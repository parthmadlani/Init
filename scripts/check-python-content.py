"""Execute only repository-authored learning snippets; never run learner or imported pack code."""
import json
import subprocess
import sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
bank = json.loads((root / 'src/lib/learning/python-bank.json').read_text())
notes = json.loads((root / 'src/lib/learning/python-notes.json').read_text())
checked = 0
for entry in bank + notes:
    if not entry.get('code'):
        continue
    expected = entry.get('output')
    if expected is None:
        expected = next(choice['text'] for choice in entry['choices'] if choice['id'] == entry['correctId'])
    run = subprocess.run([sys.executable, '-I', '-c', entry['code']], capture_output=True, text=True, timeout=3)
    actual = run.stdout.rstrip('\n')
    assert run.returncode == 0 and actual == expected, (entry.get('id', entry.get('slug')), expected, actual, run.stderr)
    checked += 1
print(f'Validated {checked} executable Python question/note examples.')
