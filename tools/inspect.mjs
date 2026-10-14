// 인식 결과 표본 + 첫 쪽 SVG 렌더: node tools/inspect.mjs <원고> <학회id>
import fs from 'node:fs';
import { initEngine, buildDocument, HwpDocument } from '../src/engine.js';
import { parseManuscript } from '../src/parse.js';
import { recognize, reorderSections, applyBlanks, applySubstitutions } from '../src/structure.js';
import { JOURNALS } from '../src/journals.js';
await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const [input, id, ...pages] = process.argv.slice(2);
const j = JOURNALS.find((x) => x.id === id);
const parsed = await parseManuscript(input, new Uint8Array(fs.readFileSync(input)));
let blocks = recognize(parsed.paragraphs, j);
const q = blocks.filter((b) => b.role === 'quote');
console.log(`quote ${q.length}개 표본:`); for (const b of q.slice(0, 8)) console.log(`   [ml=${parsed.paragraphs[b.src].marginLeft} sz=${parsed.paragraphs[b.src].size}] ${b.text.replace(/\s+/g, ' ').slice(0, 70)}`);
const body = blocks.filter((b) => b.role === 'body');
console.log(`body ${body.length}개 표본 여백:`, [...new Set(body.map((b) => parsed.paragraphs[b.src].marginLeft))].slice(0, 6));
const emph = parsed.paragraphs.flatMap((p, i) => (p.runs || []).filter((r) => (r.bold || r.italic || r.underline) && r.text.trim().length > 1).map((r) => `p${i} ${r.bold ? 'B' : ''}${r.italic ? 'I' : ''}${r.underline ? 'U' : ''}: ${r.text.trim().slice(0, 40)}`));
console.log(`강조 런 ${emph.length}:`, emph.slice(0, 12).join(' | '));
blocks = reorderSections(blocks, j).blocks;
const unit = j.footnote?.pageUnit || 'keep';
blocks = applySubstitutions(blocks, j, { pageUnit: unit === 'pp.' ? 'p.' : unit, marks: 'keep' }).blocks;
blocks = applyBlanks(blocks, j).blocks;
const tplBytes = j.template ? new Uint8Array(fs.readFileSync(new URL(`../templates/${j.template.file}.hwp`, import.meta.url))) : null;
const res = await buildDocument({ journal: j, templateBytes: tplBytes, blocks, onLog: () => {} });
const base = input.replace(/^.*[\/]/, '').replace(/\.[^.]+$/, '');
for (const pg of (pages.length ? pages : ['0'])) {
  const svg = res.doc.renderPageSvg(+pg);
  fs.writeFileSync(new URL(`../tests/out/${base}_${id}_p${pg}.svg`, import.meta.url), svg);
  console.log(`svg: tests/out/${base}_${id}_p${pg}.svg (${(svg.length / 1024).toFixed(0)} KB)`);
}
res.doc.free();
