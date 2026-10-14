// README의 내장 학회 목록을 journals.js에서 만들어 <!-- journals:start --> … <!-- journals:end --> 사이에 채운다
import fs from 'node:fs';
import { JOURNALS } from '../src/journals.js';
const root = new URL('../', import.meta.url);
const exists = (p) => fs.existsSync(new URL(p, root));
const kind = (j) => (j.template && exists('templates/' + j.template.file + '.hwp') ? '바탕틀' : (j.format ? '규정값' : '일반 양식'));
const sys = (j) => (j.submit?.system || '').replace(/\(.*?\)/g, '').split(/[·+ ]/)[0] || '';
const rows = JOURNALS.map((j) => `| ${j.society} | ${j.journal} | ${j.grade || ''} | ${kind(j)} | ${sys(j)} | ${(j.schedule?.deadlines || []).join(' · ') || (j.schedule?.rule ? '공지' : '')} |`);
const counts = { 바탕틀: 0, 규정값: 0, '일반 양식': 0 }; for (const j of JOURNALS) counts[kind(j)]++;
const block = `<!-- journals:start -->
내장 학회 **${JOURNALS.length}곳** — 바탕틀 ${counts['바탕틀']}곳(학회 양식 파일 그대로), 규정값 ${counts['규정값']}곳(규정의 수치로 서식 생성), 일반 양식 ${counts['일반 양식']}곳(편집 양식을 공개하지 않은 학회). 이 표는 \`node tools/gen_journal_list.mjs\`로 \`src/journals.js\`에서 생성합니다.

| 학회·기관 | 학술지 | 등급 | 서식 방식 | 투고 | 정기 마감(월-일) |
|---|---|---|---|---|---|
${rows.join('\n')}
<!-- journals:end -->`;
const p = new URL('README.md', root); let r = fs.readFileSync(p, 'utf8');
if (/<!-- journals:start -->[\s\S]*<!-- journals:end -->/.test(r)) r = r.replace(/<!-- journals:start -->[\s\S]*<!-- journals:end -->/, () => block);
else r = r.replace(/\n## 화면과 흐름/, () => `\n## 내장 학회\n\n${block}\n\n## 화면과 흐름`);
// 본문에 흩어진 학회 수 표기도 같이 맞춘다(머리글의 ‘내장 학회 N곳(…)’, 구조 설명의 ‘학회 N곳 데이터’)
r = r.replace(/내장 학회 \d+곳\(바탕틀 \d+곳, 규정값 \d+곳, 일반 양식 \d+곳\)/g, () => `내장 학회 ${JOURNALS.length}곳(바탕틀 ${counts['바탕틀']}곳, 규정값 ${counts['규정값']}곳, 일반 양식 ${counts['일반 양식']}곳)`);
r = r.replace(/학회 \d+곳 데이터/g, () => `학회 ${JOURNALS.length}곳 데이터`);
fs.writeFileSync(p, r);
console.log(`README 학회 표: ${JOURNALS.length}곳 (${JSON.stringify(counts)})`);
