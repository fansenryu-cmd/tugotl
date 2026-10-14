// 전체 파이프라인 Node 테스트: 원고 파싱 → 구조 인식 → 재배열/빈줄/치환 → 문서 생성 → 재로드 검증
import fs from 'node:fs';
import { initEngine, buildDocument, HwpDocument } from '../src/engine.js';
import { parseManuscript } from '../src/parse.js';
import { recognize, buildToc, reorderSections, applyBlanks, applySubstitutions, estimateLength, checklist } from '../src/structure.js';
import { JOURNALS } from '../src/journals.js';

await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const J = (s) => JSON.parse(s);
const tpl = (j) => (j.template ? new Uint8Array(fs.readFileSync(new URL(`../templates/${j.template.file}.hwp`, import.meta.url))) : null);

// 원고 샘플: 텍스트로 구성 (각주 포함)
const sampleTxt = `웹소설 저작권 담론의 재구성
⸺플랫폼 계약 관행을 중심으로
홍길동*

목차
1. 서론
2. 웹소설 플랫폼 계약의 구조
2.1 연재 계약과 저작권 귀속
2.2 2차적 저작물 작성권
3. 결론

국문초록
이 논문은 웹소설 플랫폼의 계약 관행을 저작권법의 관점에서 검토한다. 플랫폼은 연재 계약을 통해 2차적 저작물 작성권까지 포괄적으로 확보하는 경향이 있다. 본고는 이러한 관행이 창작자 보호 규범과 어떻게 충돌하는지 분석한다.
주제어: 웹소설, 저작권, 플랫폼, 연재 계약, 2차적 저작물

1. 서론
웹소설 시장은 지난 십 년 사이 급격히 성장했다.[^1] 그러나 창작자의 권리 보호 논의는 산업의 성장 속도를 따라가지 못했다. 본고는 이 간극을 저작권 담론의 차원에서 살핀다.
"계약은 당사자의 합의로 성립하지만, 그 합의의 조건은 시장 구조가 결정한다."[^2]
2. 웹소설 플랫폼 계약의 구조
2.1 연재 계약과 저작권 귀속
연재 계약의 핵심 쟁점은 저작권 귀속 조항이다. 다수의 표준계약서는 저작권이 작가에게 남는다고 명시하지만, 독점적 이용허락의 범위가 사실상 양도에 가깝다는 비판이 있다.[^3]
2.2 2차적 저작물 작성권
웹툰·드라마화 등 2차적 저작물 작성권은 수익 배분의 핵심이다.
3. 결론
창작자 보호를 위한 계약 투명성 제고가 필요하다.

참고문헌
1. 기본자료
문화체육관광부, 『웹소설 분야 표준계약서』, 2023.
2. 논문 및 단행본
김철수, 「웹소설 연재 계약의 법적 쟁점」, 『저작권연구』 제12호, 한국저작권학회, 2022, 45~78면.
이영희, 『플랫폼 자본주의와 창작 노동』, 문학과지성사, 2021.
Lessig, Lawrence, Free Culture, New York: Penguin, 2004.

Abstract
Reconstructing the Copyright Discourse of Web Novels
Hong, Gildong
This paper examines the contractual practices of web novel platforms from the perspective of copyright law. Platforms tend to secure derivative work rights comprehensively through serialization contracts.
Keywords: web novel, copyright, platform, serialization contract, derivative works

[^1]: 한국콘텐츠진흥원, 『2025 웹소설 산업 실태조사』, 2025, 12면.
[^2]: 이영희, 앞의 책, 103면.
[^3]: 김철수, 앞의 글, 52면.
`;
fs.writeFileSync(new URL('../out/sample.txt', import.meta.url), sampleTxt);

async function run(journalId, name, bytes) {
  const j = JOURNALS.find((x) => x.id === journalId);
  const parsed = await parseManuscript(name, bytes);
  let blocks = recognize(parsed.paragraphs, j);
  console.log(`\n===== ${j.journal} (${journalId}) ← ${name} [${parsed.format}] 문단 ${parsed.paragraphs.length}, 각주 ${parsed.counts.footnotes}`);
  if (parsed.warnings.length) console.log('  warnings:', parsed.warnings.join(' | '));
  console.log('  roles:', blocks.filter((b) => b.role !== 'blank').map((b) => `${b.role}`).join(' '));
  blocks = buildToc(blocks, j).blocks;
  const ro = reorderSections(blocks, j); blocks = ro.blocks; if (ro.changed) console.log('  reorder:', ro.from.join('→'), '⇒', ro.to.join('→'));
  const unit = j.footnote?.pageUnit || 'keep';
  const sub = applySubstitutions(blocks, j, { pageUnit: unit === 'pp.' ? 'p.' : unit, marks: 'keep' }); blocks = sub.blocks;
  if (sub.changes.length) console.log('  subst:', sub.changes.map((c) => `${c.where}: ${c.before.slice(0, 40)} → ${c.after.slice(0, 40)}`).slice(0, 3).join(' | '));
  const bl = applyBlanks(blocks, j); blocks = bl.blocks; console.log(`  blanks: dropped ${bl.dropped}, inserted ${bl.inserted}; est ${JSON.stringify(estimateLength(blocks))}`);
  const res = await buildDocument({ journal: j, templateBytes: tpl(j), blocks, onLog: (e) => console.log(`  [${String(e.t).padStart(4)}ms] ${e.kind === 'warn' ? '△ ' : ''}${e.msg}`) });
  fs.writeFileSync(new URL(`../out/pipe_${journalId}.hwp`, import.meta.url), res.hwp);
  // 검증: 재로드하여 문단별 글꼴/크기, 각주 수
  const d = res.doc; const n = d.getParagraphCount(0);
  const fn = (J(d.getControls()) || []).filter((c) => c.ctrlId === 'fn').length;
  console.log(`  verify: paras ${n}, pages ${res.pages}, footnotes ${fn}`);
  for (let i = 0; i < Math.min(n, 60); i++) { const len = d.getParagraphLength(0, i); if (!len) continue; const cp = J(d.getCharPropertiesAt(0, i, 0)); const pp = J(d.getParaPropertiesAt(0, i)); const t = d.getTextRange(0, i, 0, Math.min(len, 28)); if (i < 12 || /^(참고문헌|Abstract|1\. 서론|국문초록)/.test(t)) console.log(`   p${String(i).padStart(2)} ${(cp.fontFamily || '').padEnd(8)} ${String(cp.fontSize / 100).padStart(4)}pt ${cp.bold ? 'B' : ' '} ${pp.alignment.padEnd(7)} ${String(pp.lineSpacing).padStart(3)}% ml=${pp.marginLeft} ind=${pp.indent} | ${t}`); }
  console.log('  checklist:', checklist(blocks, j).map((c) => `${c.ok ? '●' : '○'}${c.text.slice(0, 30)}`).join(' / '));
  d.free();
}

const txt = new TextEncoder().encode(sampleTxt);
const ONLY = process.argv.slice(2);
const runIf = async (id, name, bytes) => { if (!ONLY.length || ONLY.includes(id)) return run(id, name, bytes); };
await runIf('koli', 'sample.txt', txt);
await runIf('daejung', 'sample.txt', txt);
await runIf('klnc', 'sample.txt', txt);        // 규정값(바탕틀 없음)
await runIf('mkliterature', 'sample.txt', txt); // 일반 양식
await runIf('gubo', 'sample.txt', txt);        // 체재 재배열
// HWP 원고: 대중서사 작성 예시를 원고로 넣어 한국문예창작으로
await runIf('koli', '대중서사 예시.hwp', new Uint8Array(fs.readFileSync(new URL('../templates/daejung.hwp', import.meta.url))));
await runIf('korlanlit', 'sample.txt', txt);
for (const id of ['korliter', 'postcriticism', 'kopoetics', 'kll']) await runIf(id, 'sample.txt', txt);
for (const id of ['klc', 'aagcc', 'childlit', 'eomunhak', 'humancontents']) await runIf(id, 'sample.txt', txt);
for (const id of ['urilit', 'bangyo']) await runIf(id, 'sample.txt', txt);
for (const id of ['sanghur', 'iall', 'korlit', 'kdrama', 'kcomplit', 'litheory', 'kslt']) await runIf(id, 'sample.txt', txt);
await runIf('eomun', 'sample.txt', txt);
for (const id of ['koreanst', 'anim', 'eastasia', 'fcs', 'interlali']) await runIf(id, 'sample.txt', txt);
for (const id of ['kochih', 'hangomun', 'hanguksoseol', 'storyimage', 'ricc', 'jicc', 'ktla', 'koreacontents', 'chunwon', 'donam', 'dongak', 'eomunlon', 'kolali', 'kles', 'iacks']) await runIf(id, 'sample.txt', txt);
