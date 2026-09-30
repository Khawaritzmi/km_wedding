"""Browser acceptance tests. Uses local Chrome, no website build dependencies."""
import csv
import json
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / '.tools'))
from playwright.sync_api import sync_playwright, expect

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        if self.path.startswith('/wedding/'):
            self.path = self.path[len('/wedding'):]
        super().do_GET()

def run():
    with (ROOT / 'data/guests.csv').open(encoding='utf-8-sig', newline='') as f:
        guests = list(csv.DictReader(f))
    assert len(guests) == 800
    assert len({g['token'] for g in guests}) == 800
    for guest in guests:
        invitation = json.loads((ROOT / f"public/invitations/{guest['token']}.json").read_text(encoding='utf-8'))
        assert invitation['name'] == guest['name']
    print('PASS: 800 unique, valid personal invitations')
    results = ROOT / 'test-results'
    results.mkdir(exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT / 'public')))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}'
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, permissions=['clipboard-read', 'clipboard-write'])
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base)
        expect(page.locator('#copy-phone')).to_be_enabled()
        expect(page.locator('#groom-full')).to_have_text('Khawaritzmi Abdallah Ahmad S.Si., M.Eng.')
        expect(page.locator('#bride-full')).to_have_text('Mariani, S.Si., M.Si.')
        page.evaluate('document.fonts.ready')
        page.locator('#gallery').scroll_into_view_if_needed()
        page.wait_for_function('Array.from(document.images).filter(i => i.getAttribute("src")).every(i => i.complete && i.naturalWidth > 0)')
        page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
        assert page.evaluate('Array.from(document.images).filter(i => i.getAttribute("src")).every(i => i.complete && i.naturalWidth > 0)')
        page.screenshot(path=str(results / 'desktop.png'), full_page=True)
        page.screenshot(path=str(results / 'desktop-hero.png'))
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        print('PASS: desktop render, exact names, bundled assets, no overflow')
        page.locator('#copy-account').click()
        expect(page.locator('#toast')).to_contain_text('dummy disalin')
        assert page.evaluate('navigator.clipboard.readText()') == '0000000000'
        with page.expect_download() as event:
            page.locator('#calendar-button').click()
        data = Path(event.value.path()).read_text(encoding='utf-8')
        assert 'DTSTART:20270123T010000Z' in data and 'DTEND:20270123T060000Z' in data
        assert '(CONTOH)' in data and 'BEGIN:VEVENT' in data
        print('PASS: clipboard and timezone-correct calendar download')
        page.locator('.gallery-item').first.click()
        expect(page.locator('#lightbox')).to_be_visible()
        page.keyboard.press('ArrowRight')
        expect(page.locator('#lightbox-caption')).to_have_text('Merayakan kebersamaan')
        page.keyboard.press('Escape')
        expect(page.locator('#lightbox')).not_to_be_visible()
        print('PASS: gallery dialog, keyboard navigation, Escape')
        token = guests[0]['token']
        page.goto(f'{base}/?guest={token}')
        expect(page.locator('#guest-name')).to_have_text(guests[0]['name'])
        assert guests[1]['name'] not in page.locator('body').inner_text()
        expect(page.locator('#contact-phone')).to_have_text('082194905095')
        page.locator('#copy-phone').click()
        expect(page.locator('#toast')).to_have_text('Nomor telepon berhasil disalin.')
        assert page.evaluate('navigator.clipboard.readText()') == '082194905095'
        assert page.locator('#wish-form').count() == 0
        print('PASS: personal invitation and copyable contact number')
        for invalid in ['../config.js', '0' * 32]:
            page.goto(f'{base}/?guest={invalid}')
            expect(page.locator('#guest-name')).to_have_text('Tautan undangan tidak ditemukan')
            expect(page.locator('#copy-phone')).to_be_enabled()
        print('PASS: invalid and nonexistent guest links rejected')
        page.goto(f'{base}/wedding/?guest={token}')
        expect(page.locator('#guest-name')).to_have_text(guests[0]['name'])
        print('PASS: GitHub Pages repository subpath')
        for width in [320, 375, 390, 768, 1024]:
            page.set_viewport_size({'width': width, 'height': 844})
            page.goto(base)
            expect(page.locator('#copy-phone')).to_be_enabled()
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), f'Overflow at {width}'
            if width == 390:
                page.screenshot(path=str(results / 'mobile.png'), full_page=True)
        print('PASS: responsive layout at 320, 375, 390, 768, 1024 pixels')
        # Editor works as a local file and preserves tokens when editing names.
        editor = context.new_page()
        editor.on('pageerror', lambda error: errors.append(str(error)))
        editor.goto((ROOT / 'tools/guests.html').as_uri())
        editor.locator('#csv-file').set_input_files(str(ROOT / 'data/guests.csv'))
        expect(editor.locator('#count')).to_have_text('800 dari 800 tamu')
        editor.locator('#search').fill('Tamu Contoh 800')
        expect(editor.locator('#count')).to_have_text('1 dari 800 tamu')
        editor.locator('#rows input').first.fill('Bapak Ahmad, Ibu "Sari"')
        with editor.expect_download() as event:
            editor.locator('#export-guests').click()
        with Path(event.value.path()).open(encoding='utf-8-sig', newline='') as f:
            exported = list(csv.DictReader(f))
        assert len(exported) == 800 and exported[-1]['name'] == 'Bapak Ahmad, Ibu "Sari"'
        assert exported[-1]['token'] == guests[-1]['token']
        editor.locator('#base-url').fill('https://example.github.io/wedding/')
        with editor.expect_download() as event:
            editor.locator('#export-links').click()
        with Path(event.value.path()).open(encoding='utf-8-sig', newline='') as f:
            links = list(csv.DictReader(f))
        assert len(links) == 800 and links[0]['url'] == f'https://example.github.io/wedding/?guest={token}'
        editor.locator('#csv-file').set_input_files(str(ROOT / 'data/guests.csv'))
        expect(editor.locator('#status')).to_contain_text('800 tamu berhasil')
        print('PASS: guest editor import, search, quote-safe CSV export, stable tokens, 800 share links')
        assert not errors, errors
        print('PASS: no JavaScript runtime errors')
        browser.close()
    server.shutdown()
    print('ALL CHECKS PASSED. Screenshots: test-results/')

if __name__ == '__main__':
    run()
