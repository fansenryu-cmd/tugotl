// 문단 텍스트 덤프: node tools/paras.mjs <hwp> <idx...>
import fs from 'node:fs';
import { initSync, HwpDocument } from '../node_modules/@rhwp/core/rhwp.js';
globalThis.measureTextWidth = (f,t)=>t.length*10;
initSync({ module: fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)) });
const d = new HwpDocument(new Uint8Array(fs.readFileSync(process.argv[2])));
for (const i of process.argv.slice(3).map(Number)) { const l=d.getParagraphLength(0,i); console.log(`p${i}: ${d.getTextRange(0,i,0,l)}`); }
const ctrls = JSON.parse(d.getControls()).filter(c=>c.ctrlId==='fn');
for (const c of ctrls.slice(0,5)) console.log('fn@p'+c.para+':', JSON.parse(d.getFootnoteInfo(0,c.para,c.controlIndex)).texts.join(' ').slice(0,220));
