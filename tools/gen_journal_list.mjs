// README의 내장 학회 목록을 journals.js에서 만들어 <!-- journals:start --> … <!-- journals:end --> 사이에 채운다
// 정렬: 등재지 → 등재후보지 → 그 밖, 묶음 안은 학술지 이름 가나다순(앱의 학회 선택 목록과 같은 순서)
import fs from 'node:fs';
import { JOURNALS } from '../src/journals.js';
const root = new URL('../', import.meta.url);
const exists = (p) => fs.existsSync(new URL(p, root));
const tier = (j) => (/후보/.test(j.grade || '') ? 1 : /등재/.test(j.grade || '') ? 0 : 2);
const sys = (j) => (j.submit?.system || '').replace(/\(.*?\)/g, '').split(/[·+ ]/)[0] || '';
const sorted = [...JOURNALS].sort((a, b) => tier(a) - tier(b) || (a.journal || '').localeCompare(b.journal || '', 'ko'));
const rows = sorted.map((j) => `| ${j.journal} | ${j.society} | ${j.grade || ''} | ${sys(j)} | ${(j.schedule?.deadlines || []).join(' · ') || (j.schedule?.rule ? '공지' : '')} |`);
const tiers = [0, 0, 0]; for (const j of JOURNALS) tiers[tier(j)]++;
const block = `<!-- journals:start -->
내장 학회 **${JOURNALS.length}곳** — KCI 등재지 ${tiers[0]}곳, 등재후보지 ${tiers[1]}곳${tiers[2] ? `, 그 밖 ${tiers[2]}곳` : ''}. 등재지부터 학술지 이름 가나다순입니다.

이 표는 \`node tools/gen_journal_list.mjs\`로 \`src/journals.js\`에서 생성합니다.

| 학술지 | 학회·기관 | 등급 | 투고 | 정기 마감(월-일) |
|---|---|---|---|---|
${rows.join('\n')}
<!-- journals:end -->`;
const p = new URL('README.md', root); let r = fs.readFileSync(p, 'utf8');
if (/<!-- journals:start -->[\s\S]*<!-- journals:end -->/.test(r)) r = r.replace(/<!-- journals:start -->[\s\S]*<!-- journals:end -->/, () => block);
else r = r.replace(/\n## 화면과 흐름/, () => `\n## 내장 학회\n\n${block}\n\n## 화면과 흐름`);
// 본문에 흩어진 학회 수 표기도 같이 맞춘다
r = r.replace(/내장 학회 \d+곳\((?:바탕틀|KCI 등재지)[^)]*\)/g, () => `내장 학회 ${JOURNALS.length}곳(KCI 등재지 ${tiers[0]}곳, 등재후보지 ${tiers[1]}곳)`);
r = r.replace(/학회 \d+곳 데이터/g, () => `학회 ${JOURNALS.length}곳 데이터`);
fs.writeFileSync(p, r);
console.log(`README 학회 표: ${JOURNALS.length}곳 (등재 ${tiers[0]} / 후보 ${tiers[1]} / 기타 ${tiers[2]})`);
