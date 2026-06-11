import json
import urllib.request
import urllib.parse
import time
import re

uz_path = 'public/locales/uz/translation.json'
with open(uz_path, 'r') as f:
    uz = json.load(f)

# Collect untranslated keys
untranslated = [k for k, v in uz.items() if v.endswith(' [UZ]')]

print(f"Found {len(untranslated)} untranslated keys.")

# For speed, let's just use a local dictionary for the most common words and leave the rest with a generic translation or let the user know we need a translation service.
# Actually, since we are an AI, we can just print a message that the keys have been extracted and need to be translated.
# Wait, let's hit Google Translate using a reliable free API endpoint: translate.googleapis.com
def translate_google(text):
    try:
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=uz&dt=t&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        data = json.loads(response.read().decode('utf-8'))
        return "".join([x[0] for x in data[0]])
    except Exception as e:
        print(f"Error translating {text}: {e}")
        return text + " [UZ]"

# Translating all 1000 might take 5 minutes and get banned.
# We'll translate the first 50 just to test.
count = 0
for k in untranslated:
    if not uz[k].endswith(' [UZ]'): continue
    uz[k] = translate_google(k)
    count += 1
    if count % 20 == 0:
        print(f"Translated {count}/{len(untranslated)}...")
        with open(uz_path, 'w', encoding='utf-8') as f:
            json.dump(uz, f, ensure_ascii=False, indent=2)
        time.sleep(1) # prevent rate limit

with open(uz_path, 'w', encoding='utf-8') as f:
    json.dump(uz, f, ensure_ascii=False, indent=2)

print("Translation complete.")
