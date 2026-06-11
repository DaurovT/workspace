import re
import glob
import json

keys = set()
for file in glob.glob('src/modules/finance/**/*.tsx', recursive=True):
    with open(file, 'r') as f:
        content = f.read()
    
    for match in re.finditer(r't\("([^"\\]*(?:\\.[^"\\]*)*)", "([^"\\]*(?:\\.[^"\\]*)*)"\)', content):
        keys.add(match.group(1))

uz_path = 'public/locales/uz/translation.json'
with open(uz_path, 'r') as f:
    uz = json.load(f)

for k in keys:
    # unescape
    k_unescaped = k.replace('\\"', '"')
    if k_unescaped not in uz:
        uz[k_unescaped] = k_unescaped + " [UZ]" # Placeholder for translation

with open(uz_path, 'w', encoding='utf-8') as f:
    json.dump(uz, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(keys)} keys.")
