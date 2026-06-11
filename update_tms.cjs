const fs = require('fs');

const rawData = `11-Sonli Oshxona|40.209697|69.286762
4-Sonli Bufet|40.21062088012695|69.2885513305664
кондитерская цех|40.244075|69.286456
Katta Sklad|40.24430465698242|69.28620147705078
2-Sonli Oshxona |40.243384|69.289422
2-Sonli Bufet|40.243526458740234|69.28962707519531
Magazin SPS|40.243709564208984|69.28882598876953
1-Sonli Oshxona|40.239688873291016|69.28720092773438
9-Sonli Oshxona|40.23926544189453|69.29570007324219
Italya oshxona|40.23653030395508|69.29254913330078
6-Sonli Oshxona |40.23652267456055|69.2931137084961
8-Sonli Oshxona|40.23343276977539|69.29060363769531
LKP Oshxona|40.240081787109375|69.28907012939453
16-Sonli Oshxona |40.23487854003906|69.2876968383789
Kafeteriy Bazalt  Bufet|40.23480987548828|69.28578186035156
4-Sonli Oshxona |40.22364807128906|69.28691101074219
5-Sonli Bufet|40.22581100463867|69.2828369140625
10-Sonli Oshxona|40.2257194519043|69.28379821777344
Mini Pekarni|40.20905685424805|69.28711700439453
12-Sonli Oshxona|40.24387741088867|69.28606414794922
13-Sonli Oshxona |40.21311950683594|69.28721618652344
14-Sonli Bufet|40.21197509765625|69.28645324707031
14-Sonli Oshxona |40.21233367919922|69.28627014160156`.split('\n');

let locationsCode = `export const initialLocations: TMSLocation[] = [\n`;
let i = 1;
for (const line of rawData) {
  const [name, lat, lng] = line.split('|');
  const cleanName = name.trim();
  let type = 'canteen';
  const ln = cleanName.toLowerCase();
  if (ln.includes('bufet') || ln.includes('буфет')) type = 'buffet';
  else if (ln.includes('sklad') || ln.includes('склад')) type = 'warehouse';
  else if (ln.includes('magazin') || ln.includes('магазин')) type = 'retail';
  else if (ln.includes('цех') || ln.includes('pekarni')) type = 'factory';
  else if (ln.includes('kafeteriy')) type = 'cafe';
  
  locationsCode += `  {
    id: 'loc-${i}', name: '${cleanName}', type: '${type}', lat: ${parseFloat(lat).toFixed(6)}, lng: ${parseFloat(lng).toFixed(6)},
    address: 'Бекабад, Ташкентская область', description: 'Точка из Яндекс.Карт', photo: '', status: 'active',
    manager: 'Не назначен', phone: '', workingHours: '', vehiclesAtSite: 0, capacityPercent: 0, lastDelivery: '—',
    stats: { todayDeliveries: 0, weekDeliveries: 0, avgLoadTime: '—' }
  }${i === rawData.length ? '' : ','}\n`;
  i++;
}
locationsCode += `];`;

const filePath = '/root/workspace/src/modules/tms/tmsData.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/export const initialLocations: TMSLocation\[\] = \[[\s\S]*?\];/, locationsCode);

// Also remove initialRoutes if they break because we changed IDs, or just replace them with empty array
content = content.replace(/export const initialRoutes: TMSRoute\[\] = \[[\s\S]*?\];/, `export const initialRoutes: TMSRoute[] = [];`);

fs.writeFileSync(filePath, content);
console.log("Updated tmsData.ts successfully.");
