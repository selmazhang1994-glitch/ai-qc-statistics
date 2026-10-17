"""Reject non-aggregate fields before publishing."""
import datetime as dt
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'public'
data = json.loads((root / 'data.json').read_text())
schema = json.loads((root / 'schema.json').read_text())
assert set(data) == {'schemaVersion','retentionDays','updatedAt','groups','rules'}
assert data['schemaVersion'] == 'aggregate-only-v1' and data['retentionDays'] == 30
dt.datetime.fromisoformat(data['updatedAt'].replace('Z', '+00:00'))
for kind in ('groups', 'rules'):
    seen = set()
    for row in data[kind]:
        expected = {'date','brand','scene','total','passed'} | ({'rule'} if kind == 'rules' else set())
        assert set(row) == expected, 'Non-aggregate fields are not allowed'
        dt.date.fromisoformat(row['date'])
        assert row['brand'] in schema['brands'] and row['scene'] in schema['scenes']
        if kind == 'rules':
            assert row['rule'] in schema['rules']
        assert type(row['total']) is int and type(row['passed']) is int
        assert 0 <= row['passed'] <= row['total'] and row['total'] > 0
        key = (row['date'], row['brand'], row['scene'], row.get('rule'))
        assert key not in seen, 'Duplicate summary'
        seen.add(key)
allowed = {'index.html','style.css','app.js','stats-core.js','trends.js','excel-parser.js',
           'echarts.min.js','xlsx.full.min.js','data.json','schema.json'}
assert {p.name for p in root.iterdir()} <= allowed, 'Unexpected public file'
print('Aggregate-only schema and publication file list verified.')
