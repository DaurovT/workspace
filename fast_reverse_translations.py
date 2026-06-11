import json
import os
import re

with open('matched_translations.json', 'r', encoding='utf-8') as f:
    t1 = json.load(f)

with open('new_translations.json', 'r', encoding='utf-8') as f:
    t2 = json.load(f)

translations = {**t1, **t2}

reverse_map = {}
for ru, uz in translations.items():
    uz = uz.replace(' [UZ]', '')
    if uz not in reverse_map:
        reverse_map[uz] = ru
    elif len(ru) > len(reverse_map[uz]):
        reverse_map[uz] = ru

files_to_search = []
for root, _, files in os.walk('src/modules/finance'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            files_to_search.append(os.path.join(root, f))
files_to_search.append('prisma/seed.ts')

def replacer(match):
    quote = match.group(1)
    text = match.group(2)
    ru_str = reverse_map.get(text)
    if ru_str is None:
        return match.group(0) # don't change
    
    if quote in ru_str:
        q = '"' if quote == "'" else "'"
        return q + ru_str + q
    return quote + ru_str + quote

# Create a regex that matches ANY known uzbek string inside quotes.
# This requires a large regex, but it's very fast.
# Sorting keys by length descending prevents partial replacement, though we match exact content anyway.
uz_keys_sorted = sorted(reverse_map.keys(), key=len, reverse=True)
# Escape each key
escaped_keys = [re.escape(k) for k in uz_keys_sorted]
# Join them with OR
pattern_str = r"(['\"])(" + "|".join(escaped_keys) + r")\1"
pattern = re.compile(pattern_str)

total_replacements = 0

for filepath in files_to_search:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content, count = pattern.subn(replacer, content)
    if count > 0:
        total_replacements += count
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

print(f"Fast Reverted {total_replacements} replacements across all files.")
