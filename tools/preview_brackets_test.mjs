// 미리보기 반각 겹낫표 회귀 시험: node tools/preview_brackets_test.mjs [--journals id,id]
// rhwp 0.8.7은 한글 전용 반각 겹낫표 󰡔(U+F0854)·󰡕(U+F0855)를 겹화살괄호 《》로 그린다. src/preview.js가 미리보기 SVG에서만
// 그 자리를 『』로 되돌리는지 지어낸 원고(본문·참고문헌·각주에 반각 겹낫표, 비교용 《》)로 확인한다.
//   1) 미리보기 SVG에 반각 겹낫표 자리의 《》가 남지 않고 『』로 그려짐(각주 안 포함)
//   2) 원고에 원래 있던 《》는 그대로
//   3) 글자 자리(x·y)·글자 수·쪽 수는 그대로 — 바뀐 것은 《→『, 》→』 글자뿐
//   4) 저장한 HWP·HWPX에는 반각 겹낫표(PUA)가 그대로 남고, 미리보기를 그려도 저장 바이트는 바뀌지 않음
// 원고의 모든 문장·이름·서지는 시험용으로 지어낸 것이다.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import { initEngine, buildDocument, HwpDocument } from '../src/engine.js';
import { renderPreviewSvg, fixPreviewSvg } from '../src/preview.js';
import { parseManuscript } from '../src/parse.js';
import { recognize, buildToc, reorderSections, applyBlanks, applySubstitutions } from '../src/structure.js';
import { JOURNALS } from '../src/journals.js';

await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
// 바탕틀 학회·규정 수치 학회·장평(글자 늘임)으로 그리는 학회·두 쪽이 되는 학회를 섞었다
const ids = arg('--journals', 'koli,korliter,klnc,kolali,urilit,humancontents').split(',');

const L = '\u{F0854}', R = '\u{F0855}';   // 반각 겹낫표
const MS = `겹낫표 미리보기 시험 원고

가나다

1. 머리말

이 글은 반각 겹낫표 ${L}바람의 책${R}과 전각 겹낫표 『물의 책』, 그리고 화살괄호 《돌의 책》을 함께 쓴다. 홑낫표 「짧은 글」과 반각 홑낫표 ｢작은 글｣도 비교한다.[^1]

두 번째 문단은 ${L}구름 사전${R}을 줄 가운데에 두고 길게 이어 쓴다. 여러 줄로 나뉘어도 반각 겹낫표는 겹낫표로 보여야 하고, 원래 있던 《별의 책》은 화살괄호로 남아야 한다.[^2]

참고문헌

가나다, 「시험 논문」, 『시험 학회지』 1, 2020.
라마바, ｢반각 논문｣, ${L}반각 저서${R}, 시험출판, 2021.
사아자, 《화살 저서》, 시험출판, 2022.

[^1]: 각주 안 ${L}각주 저서${R}와 《각주 책》, ｢각주 논문｣.
[^2]: 둘째 각주 ${L}둘째 저서${R}.
`;
const count = (s, ch) => { let n = 0; for (const c of s) if (c === ch) n++; return n; };
const svgText = (svg) => [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join('');
const treeText = (doc, p) => { let s = ''; const w = (n) => { if (n.type === 'TextRun' && typeof n.text === 'string') s += n.text; for (const c of n.children || []) w(c); }; w(JSON.parse(doc.getPageRenderTree(p))); return s; };
const sha = (b) => createHash('sha256').update(b).digest('hex');

let fail = 0, n = 0;
const check = (ok, msg) => { n++; if (!ok) { fail++; console.log(`  ✗ ${msg}`); } };

// ── 가. 지어낸 원고를 학회 서식으로 변환해 확인
const parsed = await parseManuscript('preview_brackets.md', new TextEncoder().encode(MS));
const msL = count(MS, L), msR = count(MS, R), msA = count(MS, '《'), msB = count(MS, '》');
for (const id of ids) {
  const j = JOURNALS.find((x) => x.id === id); if (!j) { console.log(`학회 없음: ${id}`); fail++; continue; }
  let blocks = recognize(structuredClone(parsed.paragraphs), j);
  blocks = buildToc(blocks, j).blocks; blocks = reorderSections(blocks, j).blocks;
  const unit = j.footnote?.pageUnit || 'keep';
  blocks = applySubstitutions(blocks, j, { pageUnit: unit === 'pp.' ? 'p.' : unit, marks: 'keep' }).blocks;   // 앱과 같게 기호는 그대로
  blocks = applyBlanks(blocks, j).blocks;
  const tpl = j.template ? new Uint8Array(fs.readFileSync(new URL(`../templates/${j.template.file}.hwp`, import.meta.url))) : null;
  const res = await buildDocument({ journal: j, templateBytes: tpl, blocks, onLog: () => {} });
  const hwpSha = sha(res.hwp), hwpxSha = sha(res.hwpx);
  const before = n, fail0 = fail;
  const doc = res.doc; const pages = doc.pageCount();
  let tL = 0, tR = 0, tA = 0, tB = 0, rawA = 0, fixA = 0, fixB = 0, fixC = 0, fixD = 0, tC = 0, tD = 0, flat = '';
  for (let p = 0; p < pages; p++) {
    const tt = treeText(doc, p); tL += count(tt, L); tR += count(tt, R); tA += count(tt, '《'); tB += count(tt, '》'); tC += count(tt, '『'); tD += count(tt, '』');
    const raw = doc.renderPageSvg(p); const fixed = renderPreviewSvg(doc, p);
    const rt = svgText(raw), ft = svgText(fixed); rawA += count(rt, '《');
    fixA += count(ft, '《'); fixB += count(ft, '》'); fixC += count(ft, '『'); fixD += count(ft, '』'); flat += ft;
    // 바뀐 것은 《→『·》→』 글자뿐이어야 한다(좌표·태그·다른 글자 그대로)
    let only = raw.length === fixed.length;
    for (let i = 0; only && i < raw.length; i++) if (raw[i] !== fixed[i] && !((raw[i] === '《' && fixed[i] === '『') || (raw[i] === '》' && fixed[i] === '』'))) only = false;
    check(only, `${id} p${p + 1}: 미리보기 SVG에서 겹낫표 말고 다른 곳이 바뀜`);
  }
  check(tL === msL && tR === msR, `${id}: 렌더 트리의 반각 겹낫표 ${tL}/${tR} — 원고 ${msL}/${msR}`);
  check(rawA > tA, `${id}: rhwp가 반각 겹낫표를 《로 그리지 않음(결함 재현 안 됨 — rhwp 판이 바뀌었으면 preview.js가 아직 필요한지 볼 것)`);
  check(fixA === tA && fixB === tB, `${id}: 미리보기의 《》 ${fixA}/${fixB} — 원래 《》 ${tA}/${tB}`);
  check(tA === msA && tB === msB, `${id}: 원래 《》 ${tA}/${tB} — 원고 ${msA}/${msB}`);
  check(fixC === tC + tL && fixD === tD + tR, `${id}: 미리보기의 『』 ${fixC}/${fixD} — 기대 ${tC + tL}/${tD + tR}`);
  const flatNs = flat.replace(/\s/g, '');
  for (const k of ['『바람의책』', '『반각저서』', '『각주저서』', '『둘째저서』', '《돌의책》', '《화살저서》', '《각주책》']) check(flatNs.includes(k), `${id}: 미리보기에 “${k}” 없음`);
  check(doc.pageCount() === pages && pages === res.pages, `${id}: 미리보기를 그린 뒤 쪽 수가 바뀜`);
  // 저장 바이트는 그대로, 그 안의 반각 겹낫표도 그대로
  check(sha(res.hwp) === hwpSha && sha(res.hwpx) === hwpxSha, `${id}: 미리보기를 그린 뒤 저장 바이트가 바뀜`);
  const d2 = new HwpDocument(res.hwp); let sL = 0, sR = 0, sA = 0;
  for (let p = 0; p < d2.pageCount(); p++) { const tt = treeText(d2, p); sL += count(tt, L); sR += count(tt, R); sA += count(tt, '《'); }
  d2.free();
  check(sL === msL && sR === msR && sA === msA, `${id}: 저장한 HWP를 다시 열면 반각 겹낫표 ${sL}/${sR}·《 ${sA} — 원고 ${msL}/${msR}·${msA}`);
  const zip = await JSZip.loadAsync(res.hwpx); let xL = 0, xR = 0;
  for (const f of Object.keys(zip.files).filter((f) => /^Contents\/section\d+\.xml$/.test(f))) { const x = await zip.file(f).async('string'); xL += count(x, L); xR += count(x, R); }
  check(xL === msL && xR === msR, `${id}: 저장한 HWPX의 반각 겹낫표 ${xL}/${xR} — 원고 ${msL}/${msR}`);
  doc.free();
  console.log(`${fail === fail0 ? '●' : '✗'} ${id} (${j.journal}, ${j.template ? '바탕틀' : '규정 수치'}) ${pages}쪽 — 반각 겹낫표 ${tL}+${tR}자 → 『』, 원래 《》 ${tA}+${tB}자 그대로 (${n - before}가지)`);
}

// ── 나. 맞추기가 어긋나면 손대지 않는지(지어낸 SVG·렌더 트리)
const T = (x, ch) => `<text x="${x}" y="20" font-size="10" fill="#000000">${ch}</text>`;
const run = (x, w, text, displayText) => ({ type: 'TextRun', bbox: { x, y: 10, w, h: 12 }, text, ...(displayText !== undefined ? { displayText } : {}) });
const page = (...runs) => ({ type: 'Page', children: [{ type: 'TextLine', children: runs }] });
const svg1 = `<svg>${T(0, '《')}${T(10, '가')}${T(20, '》')}${T(30, '《')}${T(40, '나')}${T(50, '》')}</svg>`;
const cases = [
  ['한 런만 바꾸고 옆 런의 원래 《》는 그대로', svg1, page(run(0, 30, `${L}가${R}`, '《가》'), run(30, 30, '《나》')), `<svg>${T(0, '『')}${T(10, '가')}${T(20, '』')}${T(30, '《')}${T(40, '나')}${T(50, '》')}</svg>`],
  ['반각 겹낫표가 없는 쪽은 그대로', svg1, page(run(0, 30, '《가》'), run(30, 30, '《나》')), svg1],
  ['글자 수가 다르게 펼쳐지면 그대로', svg1, page(run(0, 30, `${L}가${R}`, '《가 》')), svg1],
  ['SVG 글자가 모자라면 그대로', `<svg>${T(0, '《')}${T(10, '가')}</svg>`, page(run(0, 30, `${L}가${R}`, '《가》')), `<svg>${T(0, '《')}${T(10, '가')}</svg>`],
  ['같은 글자를 겹쳐 그리면 그대로', `<svg>${T(0, '《')}${T(0, '《')}${T(10, '가')}${T(20, '》')}</svg>`, page(run(0, 30, `${L}가${R}`, '《가》')), `<svg>${T(0, '《')}${T(0, '《')}${T(10, '가')}${T(20, '》')}</svg>`],
  ['rhwp가 다른 글자로 그리면 그대로', `<svg>${T(0, '『')}${T(10, '가')}${T(20, '』')}</svg>`, page(run(0, 30, `${L}가${R}`, '『가』')), `<svg>${T(0, '『')}${T(10, '가')}${T(20, '』')}</svg>`],
  ['장평(translate·scale) 글자도 바꿈', `<svg><text transform="translate(0,20) scale(0.95,1)" font-size="10">《</text><text transform="translate(10,20) scale(0.95,1)" font-size="10">가</text><text transform="translate(20,20) scale(0.95,1)" font-size="10">》</text></svg>`, page(run(0, 30, `${L}가${R}`, '《가》')), `<svg><text transform="translate(0,20) scale(0.95,1)" font-size="10">『</text><text transform="translate(10,20) scale(0.95,1)" font-size="10">가</text><text transform="translate(20,20) scale(0.95,1)" font-size="10">』</text></svg>`],
  ['돌린 글자가 섞이면 그대로', `<svg>${T(0, '《')}<text transform="rotate(90) translate(10,20)">가</text>${T(20, '》')}</svg>`, page(run(0, 30, `${L}가${R}`, '《가》')), `<svg>${T(0, '《')}<text transform="rotate(90) translate(10,20)">가</text>${T(20, '》')}</svg>`],
];
let unitFail = 0;
for (const [name, svg, tree, want] of cases) { n++; const got = fixPreviewSvg(svg, JSON.stringify(tree)).svg; if (got !== want) { fail++; unitFail++; console.log(`  ✗ ${name}\n    얻음 ${got}\n    기대 ${want}`); } }
console.log(`${unitFail ? '✗' : '●'} 맞추기 안전 사례 ${cases.length - unitFail}/${cases.length}`);

console.log(`\n미리보기 반각 겹낫표 ${n - fail}/${n} 통과 (학회 ${ids.length} + 안전 사례 ${cases.length})`);
process.exit(fail ? 1 : 0);
