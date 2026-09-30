"""Local-only preview. Run from any directory: python scripts/preview.py."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

root = Path(__file__).resolve().parent.parent
handler = partial(SimpleHTTPRequestHandler, directory=str(root / 'public'))
if __name__ == '__main__':
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 8000), handler)
    except OSError:
        raise SystemExit('Port 8000 is busy. Stop the other preview, or use: python -m http.server 8001 --bind 127.0.0.1 --directory public')
    print('Invitation: http://localhost:8000/\nGuest editor: open tools/guests.html\nPress Ctrl+C to stop.')
    webbrowser.open('http://localhost:8000/')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
