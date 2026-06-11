import fs from 'fs';
import path from 'path';

const UZ_PATH = path.join(process.cwd(), 'public/locales/uz/translation.json');
const uz = JSON.parse(fs.readFileSync(UZ_PATH, 'utf-8'));

async function translate(text) {
    try {
        const url = `https://lingva.ml/api/v1/ru/uz/${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.translation;
    } catch (e) {
        return null;
    }
}

async function run() {
    const keys = Object.keys(uz).filter(k => uz[k].endsWith(' [UZ]'));
    console.log(`Translating ${keys.length} keys with Lingva...`);
    
    // Process sequentially to avoid rate limits
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        
        // Before translating, strip "[UZ]" suffix if the key itself ended with it? No, the key is pure Russian.
        const originalText = k;
        
        let translated = await translate(originalText);
        
        if (translated && translated.trim() !== '') {
            uz[k] = translated;
            console.log(`[${i+1}/${keys.length}] ${originalText} -> ${translated}`);
        } else {
            console.log(`[${i+1}/${keys.length}] Failed to translate: ${originalText}`);
        }
        
        // Save periodically
        if (i % 10 === 0) {
            fs.writeFileSync(UZ_PATH, JSON.stringify(uz, null, 2), 'utf-8');
        }
        
        await new Promise(r => setTimeout(r, 200)); // 200ms delay
    }
    
    fs.writeFileSync(UZ_PATH, JSON.stringify(uz, null, 2), 'utf-8');
    console.log("Translation complete!");
}

run();
