import fs from 'node:fs';
import { initSync, HwpDocument } from '../node_modules/@rhwp/core/rhwp.js';
globalThis.measureTextWidth = (f,t)=>t.length*10;
initSync({ module: fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)) });
const d = new HwpDocument(new Uint8Array(fs.readFileSync(process.argv[2])));
const J=(s)=>JSON.parse(s);
const max = +(process.argv[3]||200);
for (let s=0;s<d.getSectionCount();s++){ console.log(`=== section ${s} pageDef`, d.getPageDef(s)); const n=d.getParagraphCount(s); for (let i=0;i<Math.min(n,max);i++){ const l=d.getParagraphLength(s,i); const t=l?d.getTextRange(s,i,0,l).replace(/\s+/g,' '):''; const st=J(d.getStyleAt(s,i)); const cp=J(d.getCharPropertiesAt(s,i,Math.min(1,Math.max(0,l-1)))); const pp=J(d.getParaPropertiesAt(s,i)); console.log(`s${s}p${i} [${st.name}] ${cp.fontFamily} ${cp.fontSize/100}${cp.bold?'B':''} ${pp.alignment} ${pp.lineSpacing}% | ${t.slice(0,80)}`); } }
