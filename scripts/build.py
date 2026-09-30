"""Build static personal invitation JSON files from an editable CSV."""
import argparse
import csv
import json
import re
import secrets
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data' / 'guests.csv'

def generate():
    if DATA.exists():
        raise SystemExit('data/guests.csv already exists; refusing to overwrite your guests.')
    DATA.parent.mkdir(exist_ok=True)
    with DATA.open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['token', 'name', 'max_party'])
        writer.writeheader()
        for i in range(1, 801):
            writer.writerow({'token': secrets.token_hex(16), 'name': f'Tamu Contoh {i:03d}', 'max_party': 2})

def read_guests():
    with DATA.open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    seen = set()
    for i, row in enumerate(rows, 2):
        token, name = row.get('token', ''), row.get('name', '').strip()
        if not re.fullmatch(r'[a-f0-9]{32}', token) or token in seen:
            raise ValueError(f'Line {i}: token must be unique, 32 lowercase hexadecimal characters.')
        if not 1 <= len(name) <= 120:
            raise ValueError(f'Line {i}: name must contain 1–120 characters.')
        if not row.get('max_party', '').isdigit() or not 1 <= int(row['max_party']) <= 10:
            raise ValueError(f'Line {i}: max_party must be 1–10.')
        row['name'] = name
        row['max_party'] = int(row['max_party'])
        seen.add(token)
    if not rows:
        raise ValueError('Guest list cannot be empty.')
    return rows

def build():
    rows = read_guests()  # Validate everything before writing.
    target = ROOT / 'public' / 'invitations'
    target.mkdir(exist_ok=True)
    # Only generated JSON in this fixed folder can be removed.
    for old in target.glob('*.json'):
        old.unlink()
    for row in rows:
        (target / f"{row['token']}.json").write_text(json.dumps({'name': row['name'], 'max_party': row['max_party']}, ensure_ascii=False), encoding='utf-8')
    print(f"Validated {len(rows)} guests. Personal invitation files generated.")
    print(f"Example: http://localhost:8000/?guest={rows[0]['token']}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--generate', action='store_true', help='Create 800 dummy guests once.')
    args = parser.parse_args()
    if args.generate:
        generate()
    build()
