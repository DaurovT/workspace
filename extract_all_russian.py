import os
import re
import json

files_to_search = []
for root, _, files in os.walk('src/modules/finance'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            files_to_search.append(os.path.join(root, f))
files_to_search.append('prisma/seed.ts')

russian_strings = set()
pattern = re.compile(r"(['\"])([А-Яа-яЁё][^'\"]*)(['\"])")

for filepath in files_to_search:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        for match in pattern.finditer(content):
            russian_strings.add(match.group(2))

with open('russian_strings.json', 'w', encoding='utf-8') as f:
    json.dump(list(russian_strings), f, ensure_ascii=False, indent=2)

print(f"Extracted {len(russian_strings)} unique Russian strings.")
