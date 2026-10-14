// 학회별 참고 폴더 만들기: node tools/export_journal_folders.mjs <대상 폴더> [--dry]
// JOURNALS(src/journals.js)마다 "<학회>(<학술지>)" 폴더를 만들고 바탕틀·첨부 규정·서식·요지 md를 복사한 뒤,
// 학회 데이터를 정리한 "투고규정_요약(투고틀).md"를 쓴다. 이미 있는 파일은 덮어쓰지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { JOURNALS } from '../src/journals.js';
import { FORMS } from '../src/forms.js';

const [target, ...flags] = process.argv.slice(2);
if (!target) { console.error('대상 폴더를 지정하세요'); process.exit(1); }
const dry = flags.includes('--dry');
const root = new URL('../', import.meta.url);
const P = (p) => path.join(path.fromFileURL ? path.fromFileURL(root) : new URL(root).pathname, p);
const projDir = decodeURIComponent(new URL(root).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const pj = (...a) => path.join(projDir, ...a);
const safe = (s) => s.replace(/[\\/:*?"<>|]/g, '·').trim();

const existing = fs.readdirSync(target, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const attach = fs.readdirSync(pj('docs', '첨부'));
const docsMd = fs.readdirSync(pj('docs')).filter((f) => f.endsWith('.md'));
const norm = (s) => (s || '').replace(/[\s()（）·‧,]/g, '').replace(/학회|연구소|연구회|연구원/g, '');

const folderFor = (j) => {
  const want = `${j.society}(${j.journal})`;
  // 기존 폴더는 이름이 정확히 같거나, '(학술지)'가 같거나, 괄호 앞 학회 이름이 같을 때만 재사용한다(비슷한 이름의 다른 학회에 섞이지 않도록)
  const soc = norm(j.society.replace(/\(.*?\)/g, ''));
  const hit = existing.find((d) => d === want || d.includes('(' + j.journal + ')') || norm(d.replace(/\(.*$/, '')) === soc);
  return hit || safe(want);
};
const copy = (src, dstDir, name, log) => {
  const dst = path.join(dstDir, name);
  if (fs.existsSync(dst)) { log.push(`  = 이미 있음: ${name}`); return; }
  if (!dry) fs.copyFileSync(src, dst);
  log.push(`  + ${name}`);
};
const li = (arr) => (arr || []).map((x) => `- ${x}`).join('\n');
const kv = (o) => Object.entries(o || {}).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(' · ') : typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');

const summaryMd = (j, files) => `# ${j.journal} (${j.society}) — 투고 규정 요약

> 투고틀(src/journals.js)에 들어 있는 학회 데이터를 사람이 읽기 쉽게 정리한 것입니다. 원문 규정이 있으면 원문이 우선입니다.
> 갱신: ${j.updated || '-'} · 등급: ${j.grade || '-'} · 분야: ${j.fields || '-'}

## 투고
- 시스템: ${j.submit?.system || '-'}${j.submit?.url ? ` · ${j.submit.url}` : ''}
${j.submit?.note ? `- 비고: ${j.submit.note}\n` : ''}- 자격: ${j.eligibility || '-'}
- 심사: ${j.review || '-'}
- 연락처: ${j.contact || '-'}

## 일정
- 연 ${j.schedule?.perYear || '?'}회 · 발간 ${(j.schedule?.publish || []).join(', ') || '-'} · 마감 ${(j.schedule?.deadlines || []).join(', ') || '-'}
${j.schedule?.rule ? `- 규칙: ${j.schedule.rule}\n` : ''}${(j.schedule?.upcoming || []).map((u) => `- 다음: ${u.issue || ''} 마감 ${u.deadline || '?'} 발간 ${u.publish || '?'}${u.note ? ` (${u.note})` : ''}`).join('\n')}

## 비용
${kv(j.fees) || '- (미기재)'}

## 분량
- ${j.length?.text || '-'}

## 체재(순서)
- ${j.structureText || (j.structure || []).join(' → ') || '-'}
- 목차: ${(j.structure || []).includes('toc') || j.template?.roles?.toc ? `있음(제목 ‘${j.tocLabel || '목차'}’)` : '없음'}
- 초록: 국문 ${j.abstract?.ko || '-'} / 영문 ${j.abstract?.en || '-'} / 주제어 ${j.abstract?.keywords || '-'}
${j.keywordsPosition ? `- 주제어 위치: ${j.keywordsPosition}\n` : ''}${j.anonymize ? `- 익명화: ${j.anonymize}\n` : ''}
## 편집 양식
${kv(j.layout) || '- (바탕틀 참조)'}
${j.format ? `\n### 규정값(투고틀이 서식을 만드는 수치)\n\`\`\`json\n${JSON.stringify(j.format, null, 1)}\n\`\`\`\n` : ''}${j.template ? `- 바탕틀: ${j.template.name || j.template.file + '.hwp'}\n` : ''}${j.blanks ? `- 빈 줄 규칙: ${kv(j.blanks).replace(/\n/g, ', ').replace(/- /g, '')}\n` : ''}
## 부호
${kv(j.marks) || '- (미기재)'}

## 각주
- 쪽수 단위: ${j.footnote?.pageUnit || '-'}
${j.footnote?.example ? `- 예: ${j.footnote.example}\n` : ''}${li(j.footnote?.rules)}

## 참고문헌
- 순서: ${j.references?.order || '-'}
${li(j.references?.rules)}

## 제출 서류
${li(j.documents) || '- (미기재)'}

## 비고
${li(j.notes) || '- 없음'}
${j.copyright ? `- 저작권: ${j.copyright}\n` : ''}
## 이 폴더의 파일
${files.length ? li(files) : '- (전달된 파일 없음 — 이 요약과 학회 누리집·JAMS 공지를 참조)'}

## 출처
${li(j.sources) || '- 학회 누리집·메일 공지'}
`;

const report = [];
let made = 0, copied = 0;
for (const j of JOURNALS) {
  const log = []; const folder = folderFor(j); const dir = path.join(target, folder);
  if (!fs.existsSync(dir)) { if (!dry) fs.mkdirSync(dir, { recursive: true }); log.push('  (새 폴더)'); made++; }
  const files = [];
  // 바탕틀
  if (j.template?.file && fs.existsSync(pj('templates', j.template.file + '.hwp'))) { const name = `바탕틀_${safe(j.template.name || j.template.file + '.hwp')}`.replace(/\.hwp$/, '') + '.hwp'; copy(pj('templates', j.template.file + '.hwp'), dir, name, log); files.push(name); }
  // 첨부(파일 이름이 학회·학술지 이름으로 시작하거나 sources에 적힌 것)
  // 첨부 파일은 '<학회명>_…' 또는 '<학술지명>_…'으로 저장되어 있다 — 접두어가 정확히 맞는 것과 sources에 적힌 파일만 복사한다
  const prefixes = [j.society, j.journal].map((x) => x.replace(/\(.*?\)/g, '').trim()).filter((x) => x.length >= 3);
  const srcNames = new Set((j.sources || []).map((x) => x.trim()));
  for (const f of attach) {
    if (prefixes.some((p) => f.startsWith(p + '_')) || srcNames.has(f)) { copy(pj('docs', '첨부', f), dir, f, log); files.push(f); }
  }
  // 투고 요지 md
  for (const f of docsMd) if (f.startsWith(j.society) || f.startsWith(j.journal)) { copy(pj('docs', f), dir, f, log); files.push(f); }
  // 서식(forms)
  for (const fm of FORMS[j.id] || []) { const src = pj('forms', fm.file); if (fs.existsSync(src) && !files.includes(fm.file)) { copy(src, dir, fm.file, log); files.push(fm.file); } }
  // 요약 md (항상 새로 씀 — 투고틀 데이터의 사본)
  const mdName = '투고규정_요약(투고틀).md';
  if (!dry) fs.writeFileSync(path.join(dir, mdName), summaryMd(j, [...new Set(files)]), 'utf8');
  log.push(`  ✎ ${mdName}`);
  copied += log.filter((l) => l.startsWith('  + ')).length;
  report.push(`${folder}${log.length ? '\n' + log.join('\n') : ''}`);
}
console.log(report.join('\n'));
console.log(`\n학회 ${JOURNALS.length}곳 · 새 폴더 ${made} · 복사 ${copied}${dry ? ' (dry)' : ''}`);
