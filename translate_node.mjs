import fs from 'fs';
import path from 'path';

const UZ_PATH = path.join(process.cwd(), 'public/locales/uz/translation.json');
const uz = JSON.parse(fs.readFileSync(UZ_PATH, 'utf-8'));

async function translate(text) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=uz&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data[0].map(x => x[0]).join('');
    } catch (e) {
        return text + " [UZ]";
    }
}

async function run() {
    const keys = Object.keys(uz).filter(k => uz[k].endsWith(' [UZ]'));
    console.log(`Translating ${keys.length} keys...`);
    
    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await Promise.all(batch.map(async k => {
            const translated = await translate(k);
            if (translated && !translated.endsWith('[UZ]')) {
                uz[k] = translated;
            }
        }));
        fs.writeFileSync(UZ_PATH, JSON.stringify(uz, null, 2), 'utf-8');
        console.log(`Progress: ${Math.min(i + batchSize, keys.length)}/${keys.length}`);
        await new Promise(r => setTimeout(r, 1000)); // sleep to prevent IP ban
    }
    console.log("Translation complete!");
}

run();
