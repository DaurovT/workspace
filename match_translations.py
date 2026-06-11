import json

with open('russian_strings.json', 'r', encoding='utf-8') as f:
    russian_strings = json.load(f)

with open('public/locales/uz/translation.json', 'r', encoding='utf-8') as f:
    translations = json.load(f)

matched = {}
unmatched = []

for s in russian_strings:
    if s in translations:
        # Ignore if the translation is just the same string or has [UZ] suffix
        t = translations[s].replace(' [UZ]', '')
        matched[s] = t
    else:
        unmatched.append(s)

with open('matched_translations.json', 'w', encoding='utf-8') as f:
    json.dump(matched, f, ensure_ascii=False, indent=2)

with open('unmatched_strings.json', 'w', encoding='utf-8') as f:
    json.dump(unmatched, f, ensure_ascii=False, indent=2)

print(f"Matched: {len(matched)}, Unmatched: {len(unmatched)}")
