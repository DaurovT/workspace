import json

# Read the uz translation file - it has all the flat keys we need
with open('public/locales/uz/translation.json', 'r', encoding='utf-8') as f:
    uz_data = json.load(f)

# Read the existing ru translation file
with open('public/locales/ru/translation.json', 'r', encoding='utf-8') as f:
    ru_data = json.load(f)

# Build flat ru translation: for every Russian key, the value is the same key (Russian -> Russian)
flat_ru = {}
for ru_key in uz_data.keys():
    flat_ru[ru_key] = ru_key  # Russian key -> Russian value

# Merge: keep existing nested structure too, but add all flat keys
ru_data.update(flat_ru)

with open('public/locales/ru/translation.json', 'w', encoding='utf-8') as f:
    json.dump(ru_data, f, ensure_ascii=False, indent=2)

print(f"Added {len(flat_ru)} flat Russian keys to ru/translation.json")
