import json
import urllib.request
import urllib.parse
import time

with open('unmatched_strings.json', 'r', encoding='utf-8') as f:
    unmatched = json.load(f)

translated = {}

def translate(text):
    try:
        url = "https://api.mymemory.translated.net/get?q=" + urllib.parse.quote(text) + "&langpair=ru|uz"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            return res['responseData']['translatedText']
    except Exception as e:
        print(f"Error translating {text}: {e}")
        return text

for i, text in enumerate(unmatched):
    print(f"Translating {i+1}/{len(unmatched)}: {text}")
    t = translate(text)
    translated[text] = t
    time.sleep(0.5)  # Stay within rate limits

with open('new_translations.json', 'w', encoding='utf-8') as f:
    json.dump(translated, f, ensure_ascii=False, indent=2)

print("Translation complete.")
