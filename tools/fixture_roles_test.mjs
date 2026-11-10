// 지어낸 언어학 원고(tests/fixtures/*.txt)를 모든 학회 서식으로 읽혀, 기대 판정(*.expect.json)과 맞는지 본다.
//   node tools/fixture_roles_test.mjs [--journals id,id]
// examples: 예문 번호 줄 — 제목(h1~h4)이 되면 안 된다 / headings: 제목이어야 한다 / abstractEn: 영문 초록이어야 한다
// 변환(HWP 만들기)은 하지 않으므로 수 초면 끝난다. 서식 대조는 tools/verify_matrix.mjs 가 같은 원고로 한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initEngine } from '../src/engine.js';
import { parseManuscript } from '../src/parse.js';
import { recognize } from '../src/structure.js';
import { JOURNALS } from '../src/journals.js';

export function checkExpect(blocks, expect) {
  const bad = []; const head = (b) => (b.text || '').trim();
  const find = (pre) => blocks.find((b) => head(b).startsWith(pre));
  for (const pre of expect.examples || []) { const b = find(pre); if (!b) bad.push(`예문 줄 없음 “${pre}”`); else if (/^h[1-4]$/.test(b.role)) bad.push(`예문이 제목(${b.role})으로: “${pre}”`); }
  for (const pre of expect.headings || []) { const b = find(pre); if (!b) bad.push(`제목 줄 없음 “${pre}”`); else if (!/^h[1-4]$/.test(b.role)) bad.push(`제목이 ${b.role}(으)로: “${pre}”`); }
  for (const pre of expect.abstractEn || []) { const b = find(pre); if (!b) bad.push(`영문 초록 줄 없음 “${pre}”`); else if (b.role !== 'abstractEn') bad.push(`영문 초록이 ${b.role}(으)로: “${pre}”`); }
  return bad;
}
export const expectFor = (paper) => { const f = paper.replace(/\.[^.]+$/, '.expect.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
  const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
  const ids = arg('--journals', '') ? arg('--journals', '').split(',') : JOURNALS.map((j) => j.id);
  const dir = new URL('../tests/fixtures/', import.meta.url);
  const papers = fs.readdirSync(dir).filter((f) => f.endsWith('.txt'));
  let fail = 0, n = 0;
  for (const pf of papers) {
    const file = path.join(fileURLToPath(dir), pf); const expect = expectFor(file); if (!expect) continue;
    const parsed = await parseManuscript(pf, new Uint8Array(fs.readFileSync(file)));
    for (const id of ids) { const j = JOURNALS.find((x) => x.id === id); if (!j) continue; n++;
      const bad = checkExpect(recognize(structuredClone(parsed.paragraphs), j), expect);
      if (bad.length) { fail++; console.log(`✗ ${pf} × ${id}: ${bad.join(' / ')}`); } }
  }
  console.log(`\n지어낸 원고 판정 ${n - fail}/${n} 통과`);
  process.exit(fail ? 1 : 0);
}
