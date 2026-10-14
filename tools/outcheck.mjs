// 산출물에서 특정 문구가 든 문단의 서식(글꼴·크기·여백)과 강조 런을 보여 준다: node tools/outcheck.mjs <산출.hwp> <문구1> [문구2...]
import fs from 'node:fs';
import { initEngine } from '../src/engine.js';
import { parseManuscript } from '../src/parse.js';
await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const [f, ...needles] = process.argv.slice(2);
const p = await parseManuscript(f, new Uint8Array(fs.readFileSync(f)));
for (const nd of needles) {
  const i = p.paragraphs.findIndex((q) => q.text.replace(/\s+/g, ' ').includes(nd));
  if (i < 0) { console.log(`  "${nd}" 없음`); continue; }
  const q = p.paragraphs[i];
  console.log(`  p${i} [${q.styleName}] sz=${q.size / 100} ml=${q.marginLeft} ind=${q.indent} align=${q.align} fn=${q.footnotes.length} | ${q.text.replace(/\s+/g, ' ').slice(0, 50)}`);
  const em = (q.runs || []).filter((r) => r.bold || r.italic || r.underline).map((r) => `${r.bold ? 'B' : ''}${r.italic ? 'I' : ''}${r.underline ? 'U' : ''}:${r.text.trim().slice(0, 30)}`);
  if (em.length) console.log(`      강조: ${em.join(' | ')}`);
}
