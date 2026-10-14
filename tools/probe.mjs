// rhwp 탐색 하네스 — 템플릿 .hwp를 열어 구조·스타일·용지 정보를 덤프한다.
import fs from 'node:fs';
import path from 'node:path';
import { initSync, HwpDocument } from '../node_modules/@rhwp/core/rhwp.js';

// 브라우저 Canvas 없음 → 폭 측정 스텁(한글 1em, 라틴 0.55em 근사)
globalThis.measureTextWidth = (font, text) => {
  const m = /([\d.]+)px/.exec(font || ''); const px = m ? parseFloat(m[1]) : 10;
  let w = 0; for (const ch of text) w += ch.charCodeAt(0) > 0x2e80 ? px : px * 0.55; return w;
};
const wasmBytes = fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url));
initSync({ module: wasmBytes });

const file = process.argv[2];
const full = process.argv.includes('--full');
const bytes = new Uint8Array(fs.readFileSync(file));
const doc = new HwpDocument(bytes);
const J = (s) => { try { return JSON.parse(s); } catch { return s; } };
console.log('# FILE', path.basename(file));
console.log('sourceFormat', doc.getSourceFormat(), 'pages', doc.pageCount(), 'sections', doc.getSectionCount());
console.log('documentInfo', JSON.stringify(J(doc.getDocumentInfo())).slice(0, 600));
console.log('pageDef', doc.getPageDef(0));
console.log('sectionDef', doc.getSectionDef(0).slice(0, 800));
const styles = J(doc.getStyleList());
console.log('styles', styles.length);
for (const s of styles) {
  const d = J(doc.getStyleDetail(s.id));
  console.log(`  [${s.id}] ${s.name} / ${s.englishName} type=${s.type} para=${s.paraShapeId} char=${s.charShapeId}`);
  if (full) console.log('      ', JSON.stringify(d));
}
const n = doc.getParagraphCount(0);
console.log('paragraphs', n);
for (let i = 0; i < n; i++) {
  const len = doc.getParagraphLength(0, i);
  const text = doc.getTextRange(0, i, 0, len).replace(/\s+/g, ' ');
  const st = J(doc.getStyleAt(0, i));
  const pp = J(doc.getParaPropertiesAt(0, i));
  const cp = J(doc.getCharPropertiesAt(0, i, 0));
  console.log(`  p${i} len=${len} style=${st.id}:${st.name} | ${text.slice(0, 50)}`);
  if (full || i < 3) console.log('      para', JSON.stringify(pp)); 
  if (full || i < 3) console.log('      char', JSON.stringify(cp));
}
console.log('controls', doc.getControls().slice(0, 1500));
console.log('structure', doc.getStructure('auto').slice(0, 800));
