// 각주 구분선 회귀 검사: 원고 하나를 내장 학회 전부(또는 --journals)로 변환해, 저장한 HWP의 각주 모양 레코드가
//  ① 한글 배치(12–15 구분선 길이 i32, 16 구분선 위 여백 ≠ 0)이고 ② 구분선이 비어 있지 않은지(종류·길이) 확인한다.
// 그리고 같은 산출물을 Word(DOCX)로 옮겨 각주 수가 같은지 본다. 배경: docs/v2.0_설계.md
// 사용: node tools/footnote_shape_check.mjs <원고.hwp|hwpx|docx> [--journals id,id]
import fs from 'node:fs';
import CFB from 'cfb';
import pako from 'pako';
import JSZip from 'jszip';
import { initEngine, buildDocument } from '../src/engine.js';
import { parseManuscript } from '../src/parse.js';
import { recognize, buildToc, reorderSections, applyBlanks, applySubstitutions } from '../src/structure.js';
import { JOURNALS } from '../src/journals.js';
import { hwpxToDocx } from '../src/hwpx2docx.js';
await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));

const paper = process.argv[2]; if (!paper) { console.error('사용: node tools/footnote_shape_check.mjs <원고> [--journals id,id]'); process.exit(1); }
const ji = process.argv.indexOf('--journals'); const only = ji > 0 ? process.argv[ji + 1].split(',') : null;
const parsed = await parseManuscript(paper, new Uint8Array(fs.readFileSync(paper)));

function footnoteShape(hwp) {
  const cfb = CFB.read(hwp, { type: 'array' });
  const hdr = CFB.find(cfb, '/FileHeader').content; const compressed = (hdr[36] & 1) === 1;
  const sec = CFB.find(cfb, '/BodyText/Section0'); let d = Uint8Array.from(sec.content); if (compressed) d = pako.inflateRaw(d);
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength); let pos = 0;
  while (pos + 4 <= d.length) {
    const h = dv.getUint32(pos, true); pos += 4; const tag = h & 0x3ff; let size = h >>> 20;
    if (size === 0xfff) { size = dv.getUint32(pos, true); pos += 4; }
    if (tag === 74) return { length: dv.getInt32(pos + 12, true), above: dv.getUint16(pos + 16, true), below: dv.getUint16(pos + 18, true), between: dv.getUint16(pos + 20, true), type: d[pos + 22], width: d[pos + 23] };
    pos += size;
  }
  return null;
}

let bad = 0; let n = 0; const seen = {};
for (const j of JOURNALS) {
  if (only && !only.includes(j.id)) continue;
  const bytes = j.template ? new Uint8Array(fs.readFileSync(new URL(`../templates/${j.template.file}.hwp`, import.meta.url))) : null;
  let blocks = recognize(parsed.paragraphs, j);
  blocks = buildToc(blocks, j).blocks; blocks = reorderSections(blocks, j).blocks;
  const unit = j.footnote?.pageUnit || 'keep'; blocks = applySubstitutions(blocks, j, { pageUnit: unit === 'pp.' ? 'p.' : unit, marks: 'keep' }).blocks;
  blocks = applyBlanks(blocks, j).blocks;
  const res = await buildDocument({ journal: j, templateBytes: bytes, blocks });
  const fs1 = footnoteShape(res.hwp); n++;
  const fnIn = blocks.reduce((a, b) => a + (b.footnotes || []).length, 0);
  const docx = await hwpxToDocx(res.hwpx); const z = await JSZip.loadAsync(docx.bytes); const fx = await z.file('word/footnotes.xml').async('string');
  const fnDocx = (fx.match(/<w:footnote w:id="\d+">/g) || []).length;
  const ok = fs1 && fs1.above > 0 && fs1.type !== 0 && fs1.length >= -4 && fs1.length !== 0 && fs1.length < 200000 && fnDocx === docx.footnotes;
  const key = fs1 ? `길이 ${fs1.length} · 위 ${fs1.above} · 아래 ${fs1.below} · 사이 ${fs1.between}` : '레코드 없음'; (seen[key] ||= []).push(j.id);
  if (!ok) { bad++; console.log('✗', j.id, key, `각주 원고 ${fnIn} / Word ${fnDocx}`); }
}
for (const [k, v] of Object.entries(seen)) console.log(`${String(v.length).padStart(3)}곳  ${k}`);
console.log(`\n${n - bad}/${n} 학회 통과`);
process.exit(bad ? 1 : 0);
