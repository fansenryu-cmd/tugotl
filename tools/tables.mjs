// hwp 안의 표 셀 텍스트를 덤프한다(규정 문서의 글자 속성 표 등 확인용).
import fs from 'node:fs';
import JSZip from 'jszip';
import { initSync, HwpDocument } from '../node_modules/@rhwp/core/rhwp.js';
globalThis.measureTextWidth = (font, text) => { const m = /([\d.]+)px/.exec(font || ''); const px = m ? parseFloat(m[1]) : 10; let w = 0; for (const ch of text) w += ch.charCodeAt(0) > 0x2e80 ? px : px * 0.55; return w; };
initSync({ module: fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)) });
const d = new HwpDocument(new Uint8Array(fs.readFileSync(process.argv[2])));
const zip = await JSZip.loadAsync(d.exportHwpx());
const xml = await zip.file('Contents/section0.xml').async('string');
const tbls = xml.match(/<hp:tbl[\s\S]*?<\/hp:tbl>/g) || [];
console.log('tables', tbls.length);
tbls.forEach((t, i) => {
  console.log(`--- table ${i}`);
  for (const r of t.match(/<hp:tr>[\s\S]*?<\/hp:tr>/g) || []) {
    const cells = (r.match(/<hp:tc[\s\S]*?<\/hp:tc>/g) || []).map((c) => (c.match(/<hp:p [\s\S]*?<\/hp:p>/g) || []).map((p) => (p.match(/<hp:t[^>]*>([^<]*)<\/hp:t>/g) || []).map((x) => x.replace(/<[^>]+>/g, '')).join('')).join(' / '));
    console.log(cells.join(' | '));
  }
});
