import fs from 'fs';

let p1 = 'src/modules/finance/components/DataImportWizard.tsx';
let c1 = fs.readFileSync(p1, 'utf-8');
c1 = c1.replace(
    't("Ular joylashtiriladi"Неразнесенные\\" для ручной классификации.", "Ular joylashtiriladi"Неразнесенные\\" для ручной классификации.")',
    't("Ular joylashtiriladi \\"Неразнесенные\\" для ручной классификации.", "Ular joylashtiriladi \\"Неразнесенные\\" для ручной классификации.")'
);
fs.writeFileSync(p1, c1);

let p2 = 'src/modules/finance/pages/MainDashboard.tsx';
let c2 = fs.readFileSync(p2, 'utf-8');
c2 = c2.replace(
    /'Yanv'26 — дек \\'26'/g,
    "'Yanv \\'26 — дек \\'26'"
);
fs.writeFileSync(p2, c2);

let p3 = 'src/modules/finance/pages/ReferencesContractorsPage.tsx';
let c3 = fs.readFileSync(p3, 'utf-8');
c3 = c3.replace(
    't("OOO \\"Компания\\" → МЧЖ \\"Kompaniya"", "OOO \\"Компания\\" → МЧЖ \\"Kompaniya"")',
    't("OOO \\"Компания\\" → МЧЖ \\"Kompaniya\\"", "OOO \\"Компания\\" → МЧЖ \\"Kompaniya\\"")'
);
fs.writeFileSync(p3, c3);
