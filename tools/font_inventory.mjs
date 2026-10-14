// 학회별 필요 글꼴 목록: node tools/font_inventory.mjs [--md docs/글꼴안내.md] [--json out.json]
// 바탕틀 학회는 역할 예시 문단·스타일의 글꼴, 규정값 학회는 format의 글꼴을 모아 역할 묶음(제목·본문·각주·기타)별로 정리하고 배포 구분을 붙인다.
import fs from 'node:fs';
import { initEngine, HwpDocument } from '../src/engine.js';
import { JOURNALS, GENERIC_FORMAT } from '../src/journals.js';
await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const args = process.argv.slice(2); const md = args.includes('--md') ? args[args.indexOf('--md') + 1] : null; const out = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const J = (s) => { try { return JSON.parse(s); } catch { return {}; } };
const GROUP = { title: '제목', subtitle: '제목', titleEn: '제목', subtitleEn: '제목', titleEn2: '제목', h1: '장·절 제목', h2: '장·절 제목', h3: '장·절 제목', h4: '장·절 제목', body: '본문', quote: '본문', source: '본문', abstract: '초록', abstractHead: '초록', abstractEn: '초록', abstractEnHead: '초록', keywords: '초록', keywordsEn: '초록', ref: '참고문헌', refHead: '참고문헌', refSub: '참고문헌', footnote: '각주', author: '저자·목차', affiliation: '저자·목차', authorEn: '저자·목차', tocHead: '저자·목차', toc: '저자·목차', caption: '기타', dates: '기타' };
// 글꼴 배포 구분 — 한글 설치 시 함께 들어오는 것(한컴 번들), 윈도우 기본, 무료 배포, 상용
const CLASS = [
  [/^(함초롬|한컴|휴먼|HY|한양|헤드라인|태나무|#?견명조|#?중고딕|양재)/, '한컴오피스 번들'],
  [/^(바탕|바탕체|돋움|돋움체|굴림|궁서|맑은 고딕|Malgun|Batang|Dotum|Gulim)/, '윈도우 기본'],
  [/^(Times New Roman|Arial|Courier)/, '윈도우 기본(라틴)'],
  [/^(KoPub)/, '무료 배포(KoPubWorld — 한국출판인회의)'],
  [/^(나눔|Nanum)/, '무료 배포(나눔글꼴 — 네이버)'],
  [/^(Noto|본고딕|본명조|Source Han|Pretendard|Arita|아리따)/, '무료 배포(오픈 라이선스)'],
  [/^(-?윤|Yoon|YD)/, '상용(윤디자인)'],
  [/^(산돌|Sandoll|SD|SandSm|SandTm|SandJg)/, '상용(산돌)'],
  [/^(#|\*|SM|신명|Sinmyeong|신명조|중명조|태명조|세명조)/, '상용(SM 신명조 계열 — 일부는 한컴 번들 HY 계열로 대체 가능)'],
  [/^(Haansoft)/, '한컴오피스 번들'],
];
const classify = (f) => { for (const [re, c] of CLASS) if (re.test(f)) return c; return '확인 필요'; };
const rows = []; const allFonts = new Map();
for (const j of JOURNALS) {
  const byGroup = {};
  const add = (role, font) => { if (!font) return; const g = GROUP[role] || '기타'; (byGroup[g] ||= new Set()).add(font); (allFonts.get(font) || allFonts.set(font, new Set()).get(font)).add(j.journal); };
  if (j.template && fs.existsSync(new URL(`../templates/${j.template.file}.hwp`, import.meta.url))) {
    const d = new HwpDocument(new Uint8Array(fs.readFileSync(new URL(`../templates/${j.template.file}.hwp`, import.meta.url))));
    const styles = J(d.getStyleList()) || []; const byName = Object.fromEntries(styles.map((s) => [s.name.trim(), s]));
    for (const [role, spec] of Object.entries(j.template.roles || {})) {
      if (!spec) continue;
      if (spec.para !== undefined) { const sec = spec.sec || 0; if (sec >= d.getSectionCount() || spec.para >= d.getParagraphCount(sec)) continue; const len = d.getParagraphLength(sec, spec.para); const t = len ? d.getTextRange(sec, spec.para, 0, Math.min(40, len)) : ''; const nz = t.search(/\S/); const cp = J(d.getCharPropertiesAt(sec, spec.para, nz > 0 ? nz : 0)); add(role, cp.fontFamily); }
      else if (spec.style && byName[spec.style]) { const det = J(d.getStyleDetail(byName[spec.style].id)); add(role, det.charProps?.fontFamily); }
      else if (spec.format) add(role, spec.format.font);
    }
    // 각주 스타일
    const fnName = j.template.roles?.footnote?.style || '각주'; if (byName[fnName]) { const det = J(d.getStyleDetail(byName[fnName].id)); add('footnote', det.charProps?.fontFamily); }
    d.free();
  } else {
    const fmt = j.format || GENERIC_FORMAT;
    for (const [role, f] of Object.entries(fmt.roles || {})) add(role, f.font || fmt.font);
    if (!fmt.roles?.footnote) add('footnote', fmt.font);
  }
  rows.push({ id: j.id, journal: j.journal, society: j.society, kind: j.template ? '바탕틀' : (j.format ? '규정값' : '일반'), fonts: Object.fromEntries(Object.entries(byGroup).map(([g, s]) => [g, [...s]])) });
}
const inventory = { generated: new Date().toISOString().slice(0, 10), journals: rows, fonts: [...allFonts.entries()].map(([font, js]) => ({ font, class: classify(font), journals: [...js] })).sort((a, b) => b.journals.length - a.journals.length) };
if (out) fs.writeFileSync(out, JSON.stringify(inventory, null, 1));
if (md) {
  const order = ['제목', '장·절 제목', '본문', '각주', '초록', '참고문헌', '저자·목차', '기타'];
  let s = `# 투고틀 글꼴 안내 (${inventory.generated} 생성)\n\n`;
  s += `투고틀은 글꼴 파일을 포함하지 않습니다(글꼴은 저작권이 있는 소프트웨어라 임의로 배포할 수 없습니다). 산출 HWP에는 학회 양식·규정이 지정한 **글꼴 이름**이 그대로 기록되므로, 그 글꼴이 내 PC에 없어도 파일은 정상이며 한글이 비슷한 글꼴로 화면에 보여 줄 뿐입니다. 학회 편집부 PC에는 해당 글꼴이 있으므로 투고에는 문제가 없습니다. 다만 **미리보기·인쇄를 정확히 보려면** 아래 글꼴을 설치하면 됩니다.\n\n`;
  s += `## 글꼴 구하는 곳\n- **한컴오피스 번들**: 함초롬바탕·함초롬돋움·한컴바탕·휴먼명조·HY(한양) 계열 등 — 한글(한컴오피스)을 설치하면 함께 설치됩니다. 함초롬 글꼴은 한컴이 무료로 배포합니다.\n- **윈도우 기본**: 바탕·돋움·맑은 고딕·Times New Roman — 윈도우에 기본으로 있습니다.\n- **무료 배포**: KoPubWorld(한국출판인회의 kopus.org), 나눔글꼴(네이버 hangeul.naver.com), 아리따(아모레퍼시픽), Noto·본명조(구글·어도비).\n- **상용**: 윤명조·윤고딕(윤디자인), 산돌(산돌구름), SM 신명조·중고딕(직지소프트) — 구매하거나 구독해야 합니다. 없으면 설치하지 않아도 되고, 화면 확인용으로는 한컴 번들의 HY신명조·HY중고딕이 가장 비슷합니다.\n\n`;
  s += `## 글꼴별 사용 학회\n| 글꼴 | 구분 | 쓰는 학회 |\n|---|---|---|\n`;
  for (const f of inventory.fonts) s += `| ${f.font} | ${f.class} | ${f.journals.length}곳: ${f.journals.slice(0, 8).join(', ')}${f.journals.length > 8 ? ' 외' : ''} |\n`;
  s += `\n## 학회별 필요 글꼴\n| 학회·학술지 | 방식 | ${order.join(' | ')} |\n|---|---|${order.map(() => '---').join('|')}|\n`;
  for (const r of rows) s += `| ${r.society} ${r.journal} | ${r.kind} | ${order.map((g) => (r.fonts[g] || []).join(', ')).join(' | ')} |\n`;
  s += `\n이 표는 \`node tools/font_inventory.mjs --md docs/글꼴안내.md\`로 \`src/journals.js\`와 바탕틀에서 생성합니다.\n`;
  fs.writeFileSync(md, s);
}
console.log(`학회 ${rows.length}곳, 글꼴 ${inventory.fonts.length}종`);
for (const f of inventory.fonts) console.log(`${f.font.padEnd(24)} ${f.class.padEnd(28)} ${f.journals.length}곳`);
