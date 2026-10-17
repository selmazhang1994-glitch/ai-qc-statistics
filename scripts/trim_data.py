"""Trim only the published aggregate snapshot; never delete source files."""
import datetime as dt
import json
from pathlib import Path
from zoneinfo import ZoneInfo

p = Path(__file__).resolve().parents[1] / 'public/data.json'
d = json.loads(p.read_text())
assert d['schemaVersion'] == 'aggregate-only-v1'
today = dt.datetime.now(ZoneInfo('Asia/Shanghai')).date()
start, end = (today - dt.timedelta(days=29)).isoformat(), today.isoformat()
for key in ('groups', 'rules'):
    d[key] = [r for r in d[key] if start <= r['date'] <= end]
p.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
