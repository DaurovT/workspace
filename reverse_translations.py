import json
import os
import re

with open('matched_translations.json', 'r', encoding='utf-8') as f:
    t1 = json.load(f)

with open('new_translations.json', 'r', encoding='utf-8') as f:
    t2 = json.load(f)

# Merge
translations = {**t1, **t2}

# Create reverse mapping: Uzbek -> Russian
reverse_map = {}
for ru, uz in translations.items():
    uz = uz.replace(' [UZ]', '')
    # If multiple Russian words map to the same Uzbek word, we just keep the last one or something.
    # It might happen, but mostly they are 1-to-1.
    if uz not in reverse_map:
        reverse_map[uz] = ru
    elif len(ru) > len(reverse_map[uz]):
        # Prefer the longer/more specific Russian string?
        reverse_map[uz] = ru

files_to_search = []
for root, _, files in os.walk('src/modules/finance'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            files_to_search.append(os.path.join(root, f))
files_to_search.append('prisma/seed.ts')

# We need a regex that matches ALL strings inside quotes.
# This might be tricky because we only want to replace EXACT Uzbek strings we know about.
# Since we know the exact Uzbek strings, we can just do simple text replacement for each string.
# But we must be careful with substrings. e.g. "Sotish" vs "Sotish bo'limi".
# Sorting keys by length descending prevents partial replacement.

uz_keys_sorted = sorted(reverse_map.keys(), key=len, reverse=True)

total_replacements = 0

for filepath in files_to_search:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for uz_str in uz_keys_sorted:
        ru_str = reverse_map[uz_str]
        
        # Replace only exact string literals: 'uz_str' or "uz_str"
        # We'll use regex to match the quotes safely
        
        # Escape for regex
        escaped_uz = re.escape(uz_str)
        # Match quote, then EXACTLY the escaped string, then the same quote
        # Wait, if there are escaped quotes inside the string, it's harder.
        # But we can just try replacing the full quoted string
        pattern = re.compile(rf"(?<![\w])(['\"]){escaped_uz}\1(?![\w])")
        
        def repl(m):
            q = m.group(1)
            # handle quotes inside the string
            safe_ru = ru_str
            if q in safe_ru:
                # switch quotes
                q = '"' if q == "'" else "'"
            return q + safe_ru + q
            
        content, count = pattern.subn(repl, content)
        if count > 0:
            total_replacements += count
            
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print(f"Reverted {total_replacements} replacements across all files.")
