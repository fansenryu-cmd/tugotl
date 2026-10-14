// 문자 보존 검증(운영 규정 1항): 옛한글·한자·가나·라틴 확장·기호·문장부호·공백이 TXT/DOCX/HWP 입력 → 변환 → 산출물에서 글자 단위로 보존되는지 본다.
// node tools/fidelity_test.mjs [학회id,...]
import fs from 'node:fs';
import JSZip from 'jszip';
import { initEngine, buildDocument, HwpDocument } from '../src/engine.js';
import { parseManuscript } from '../src/parse.js';
import { recognize, reorderSections, applyBlanks } from '../src/structure.js';
import { JOURNALS } from '../src/journals.js';
await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const ids = (process.argv[2] || 'koli,ricc,dongak').split(',');
const outDir = new URL('../tests/out/fidelity/', import.meta.url); fs.mkdirSync(outDir, { recursive: true });

// 시험 문장들 — 각 줄이 한 문단
const lines = [
  '문자 보존 시험 원고',
  '홍길동*',
  '국문초록',
  '옛한글 자모: ᄀᆞᆯ ᄒᆞᆫ글 ᄠᅡ ᄡᅡᆯ ᅀᅵ ᄋᆞ ㆍ ㆆ ᄼ (초성·중성·종성 U+1100·U+1160·U+11A8, 아래아 ㆍ)',
  '한양 옛한글 PUA:  와 반각 낫표 PUA 󰡔겹낫표󰡕 ｢낫표｣ 「전각」 『전각』',
  '주제어: 옛한글, 기호, 보존, 외국어, 공백',
  '1. 서론',
  '한자: 漢字 文學 硏究 尹東柱 李箱 · 일본어: 日本語 ひらがな カタカナ 『源氏物語』 · 중국어 간체: 当代西方语法理论 上海外语教育出版社',
  '라틴 확장: Café, naïve, Ærøskøbing, Œuvre, façade, Göttingen, Łódź, Ñandú, São Paulo, Ðe, þorn; 그리스·키릴: Ἀριστοτέλης, Достоевский',
  '수학·기호: ∑ ∫ ∂ √ ≠ ≤ ≥ ± × ÷ ∞ → ⇒ ∴ ∵ ☞ ※ ◆ ■ ● ① ② ㉠ ㉡ Ⅰ Ⅱ ⅰ ⅱ ½ ¾ ² ³ ℃ ‰ € £ ¥ ₩',
  '문장부호: “큰따옴표” ‘작은따옴표’ ― 줄표 — 엠대시 – 엔대시 … 말줄임 ··· 가운뎃점 ‧ ․ ‥ ~ ～ 〜 ? ! ; : ( ) [ ] { } 〈 〉 《 》 〔 〕',
  '공백 시험:\t탭 뒤  두 칸　전각 공백 뒤  줄바꿈없는공백 뒤 끝 ',
  '각주 시험 문장이다.[^1] 두 번째 각주는 옛한글을 담는다.[^2]',
  '2. 결론',
  '합성 문자: 각 (가 + 종성 ㄱ 분리형), é (e + U+0301 결합), 한글 NFD: 한글 (분해형)',
  '참고문헌',
  '李箱, 『李箱全集』, 文學思想社, 1991, 12面.',
  'Mallarmé, Stéphane, Œuvres complètes, Paris: Gallimard, 1945, p. 38.',
  'Abstract',
  'Fidelity Test — ancient Hangul, CJK, Latin‑1/ Latin Extended, symbols',
  'Hong, Gildong',
  'This is the English abstract with “quotes” and an em‑dash — and ellipsis…',
  'Keywords: fidelity, ancient Hangul, symbols',
  '',
  '[^1]: 각주 안의 옛한글 ᄒᆞᆫ글 과 한자 漢字 와 Café — 보존되어야 한다.',
  '[^2]: ᄋᆞ ㆍ ㆆ 와 기호 ∑ ≠ ‰, 그리고 「낫표」 󰡔겹낫표󰡕.',
];
const txt = lines.join('\n');
fs.writeFileSync(new URL('fidelity.txt', outDir), txt);

// DOCX 생성 (각주 2개 포함)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const docxParas = []; const fnDefs = {};
for (const ln of lines) {
  const m = /^\[\^(\d+)\]: (.*)$/.exec(ln); if (m) { fnDefs[m[1]] = m[2]; continue; }
  if (ln === '') continue;
  const parts = ln.split(/(\[\^\d+\])/);
  let runs = '';
  for (const part of parts) { const f = /^\[\^(\d+)\]$/.exec(part); if (f) runs += `<w:r><w:footnoteReference w:id="${f[1]}"/></w:r>`; else if (part) runs += `<w:r><w:t xml:space="preserve">${esc(part)}</w:t></w:r>`; }
  docxParas.push(`<w:p>${runs}</w:p>`);
}
const zip = new JSZip();
zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/></Types>');
zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/></Relationships>');
zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${docxParas.join('')}</w:body></w:document>`);
zip.file('word/footnotes.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${Object.entries(fnDefs).map(([id, t]) => `<w:footnote w:id="${id}"><w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p></w:footnote>`).join('')}</w:footnotes>`);
const docxBytes = new Uint8Array(await zip.generateAsync({ type: 'uint8array' }));
fs.writeFileSync(new URL('fidelity.docx', outDir), docxBytes);

// HWP 생성: txt를 koli로 변환한 산출물을 다시 입력으로 쓴다(HWP 왕복)
const norm = (s) => s.replace(/\r/g, '').replace(/[ \t 　]+$/, '');   // 문단 끝 공백은 서식상 의미가 없어 비교에서 뺀다(TXT 파서가 끝 공백을 지움)
const isLabelLine = (t) => /^[^가-힣A-Za-z]{0,3}(국문\s*초록|국문\s*요약|초록|요약|Abstract|ABSTRACT|참고\s*문헌|References?|목\s*차|차\s*례)[^가-힣A-Za-z]{0,3}$/.test(t.trim()) || /^[^가-힣A-Za-z]{0,3}(주제어|핵심어|키워드|Key\s*words?|Keywords?)[^가-힣A-Za-z]{0,3}/.test(t.trim());   // 표지·주제어 머리말은 바탕틀 표기로 바뀐다
const expectBody = lines.filter((l) => !/^\[\^\d+\]:/.test(l) && l !== '' && !isLabelLine(l)).map((l) => l.replace(/\[\^\d+\]/g, ''));
const expectFn = Object.values(fnDefs);
const report = [];
async function check(label, name, bytes) {
  const parsed = await parseManuscript(name, bytes);
  const gotBody = parsed.paragraphs.map((p) => p.text).filter((t) => t.trim() !== '' || false);
  const gotFn = parsed.paragraphs.flatMap((p) => p.footnotes.map((f) => f.text));
  const missing = []; const diffs = [];
  for (const e of expectBody) { const hit = gotBody.find((g) => norm(g) === norm(e)); if (!hit) { const near = gotBody.find((g) => norm(g).slice(0, 10) === norm(e).slice(0, 10)); if (near) { let k = 0; while (k < e.length && e[k] === near[k]) k++; diffs.push({ expect: e.slice(0, 40), got: near.slice(0, 40), at: k, e: JSON.stringify(e.slice(k, k + 6)), g: JSON.stringify(near.slice(k, k + 6)) }); } else missing.push(e.slice(0, 40)); } }
  const fnBad = expectFn.filter((e) => !gotFn.some((g) => norm(g).replace(/^\s+/, '') === norm(e).replace(/^\s+/, '')));   // 각주 번호 뒤 한 칸은 저장 때 보태므로 앞 공백만 빼고 비교
  report.push({ label, paragraphs: parsed.paragraphs.length, missing, diffs, fnOk: fnBad.length === 0, fnBad });
  return parsed;
}
async function convertAndCheck(label, name, bytes, id) {
  const j = JOURNALS.find((x) => x.id === id);
  const parsed = await parseManuscript(name, bytes);
  let blocks = recognize(parsed.paragraphs, j); blocks = reorderSections(blocks, j).blocks; blocks = applyBlanks(blocks, j).blocks;
  const res = await buildDocument({ journal: j, templateBytes: j.template ? new Uint8Array(fs.readFileSync(new URL(`../templates/${j.template.file}.hwp`, import.meta.url))) : null, blocks, onLog: () => {} });
  res.doc.free();
  fs.writeFileSync(new URL(`fidelity_${label}_${id}.hwp`, outDir), res.hwp);
  await check(`${label}→${id}`, 'o.hwp', res.hwp);
  return res.hwp;
}
await check('TXT 파싱', 'fidelity.txt', new TextEncoder().encode(txt));
await check('DOCX 파싱', 'fidelity.docx', docxBytes);
let hwpRound = null;
for (const id of ids) {
  await convertAndCheck('TXT', 'fidelity.txt', new TextEncoder().encode(txt), id);
  const h = await convertAndCheck('DOCX', 'fidelity.docx', docxBytes, id);
  if (!hwpRound) hwpRound = h;
}
if (hwpRound) { await check('HWP 파싱(왕복)', 'fidelity.hwp', hwpRound); for (const id of ids) await convertAndCheck('HWP', 'fidelity.hwp', hwpRound, id); }
for (const r of report) {
  const ok = !r.missing.length && !r.diffs.length && r.fnOk;
  console.log(`${ok ? '●' : '○'} ${r.label}: 문단 ${r.paragraphs}, 누락 ${r.missing.length}, 글자 차이 ${r.diffs.length}, 각주 ${r.fnOk ? '일치' : '불일치 ' + r.fnBad.length}`);
  for (const m of r.missing) console.log(`    누락: ${m}`);
  for (const d of r.diffs) console.log(`    차이 @${d.at}: 기대 ${d.e} ← 실제 ${d.g}  (${d.expect})`);
  for (const f of r.fnBad) console.log(`    각주 불일치: ${f.slice(0, 50)}`);
}
