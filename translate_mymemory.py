import json
import urllib.request
import urllib.parse
import time

with open('public/locales/uz/translation.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def translate(text):
    try:
        url = "http://api.mymemory.translated.net/get?q=" + urllib.parse.quote(text) + "&langpair=ru|uz&de=testdev123@gmail.com"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        res = json.loads(response.read().decode('utf-8'))
        return res['responseData']['translatedText']
    except:
        return None

keys = [k for k, v in data.items() if v.endswith(' [UZ]')]
print(f"Remaining keys to translate: {len(keys)}")

for i, k in enumerate(keys):
    tr = translate(k)
    if tr and not 'MYMEMORY WARNING' in tr:
        data[k] = tr
        print(f"[{i+1}/{len(keys)}] {k} -> {tr}")
    else:
        # Fallback: remove [UZ] suffix
        data[k] = k
        print(f"[{i+1}/{len(keys)}] FAILED {k} -> {k}")
    
    if i % 20 == 0:
        with open('public/locales/uz/translation.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

with open('public/locales/uz/translation.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done")
