import json
import os
import re

with open('matched_translations.json', 'r', encoding='utf-8') as f:
    translations = json.load(f)

with open('new_translations.json', 'r', encoding='utf-8') as f:
    new_translations = json.load(f)

# Merge
translations.update(new_translations)

# We want to replace strings in files: src/modules/finance/**/*.ts(x) and prisma/seed.ts
files_to_search = []
for root, _, files in os.walk('src/modules/finance'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            files_to_search.append(os.path.join(root, f))
files_to_search.append('prisma/seed.ts')

def replacer(match):
    quote = match.group(1)
    text = match.group(2)
    # Get translation, default to original text if not found
    translated_text = translations.get(text, text)
    # Remove any [UZ] suffix if it was accidentally carried over
    translated_text = translated_text.replace(' [UZ]', '')
    # Important: if the translation contains the quote character, we must escape it or avoid replacing
    if quote in translated_text:
        # If it contains the same quote, just use the opposite quote if possible
        if quote == "'":
            return f'"{translated_text}"'
        else:
            return f"'{translated_text}'"
    return quote + translated_text + quote

pattern = re.compile(r"(['\"])([А-Яа-яЁё][^'\"]*)(['\"])")

total_replacements = 0

for filepath in files_to_search:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content, count = pattern.subn(replacer, content)
    
    if count > 0:
        total_replacements += count
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

print(f"Applied {total_replacements} replacements across all files.")
