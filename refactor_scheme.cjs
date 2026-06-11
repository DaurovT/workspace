const fs = require('fs');

const path = '/root/workspace/src/modules/scheme/SchemeApp.tsx';
let content = fs.readFileSync(path, 'utf8');

const exportEnd = "type ViewMode = 'flow' | 'plan' | 'logistics';";
const exportEndIndex = content.indexOf(exportEnd);

if (exportEndIndex === -1) {
  console.log("Could not find extraction end point");
  process.exit(1);
}

const startString = "type Cat = 'meat' | 'veg' | 'bakery' | 'dairy' | 'hot' | 'nonFood' | 'neutral';";
const startIndex = content.indexOf(startString);

if (startIndex === -1) {
  console.log("Could not find extraction start point");
  process.exit(1);
}

const extractedData = content.substring(startIndex, exportEndIndex);

const dataFilePath = '/root/workspace/src/modules/scheme/schemeData.ts';

let dataContent = extractedData.replace(/const /g, 'export const ').replace(/type /g, 'export type ').replace(/interface /g, 'export interface ');

fs.writeFileSync(dataFilePath, dataContent);

const imports = `import { CLR, LEGEND, COLORS, BLOCKS, NODES, ARROWS, CARGO_COLORS, CARGO_LEGEND, FLEET_PLACEHOLDER, LOGISTICS, RADIAL_NODES, RADIAL_FLOWS, TIMELINE_TRIPS, TIMELINE_TRACKS, Cat, N } from './schemeData';\n\n`;

let newContent = content.substring(0, startIndex) + imports + content.substring(exportEndIndex);

fs.writeFileSync(path, newContent);
console.log("Refactoring complete");
