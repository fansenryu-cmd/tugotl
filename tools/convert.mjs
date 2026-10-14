// 실데이터 변환 검증: node tools/convert.mjs <원고 파일> <학회id[,학회id...]> [--quiet]
// 원고를 파싱·인식·변환한 뒤 산출 HWP를 다시 파싱해 내용 보존(본문 텍스트·각주·강조)을 대조한다.
import fs from 'node:fs';
import path from 'node:path';
import { initEngine, buildDocument } from '../src/engine.js';
import { parseManuscript } from '../src/parse.js';
import { recognize, buildToc, reorderSections, applyBlanks, applySubstitutions, estimateLength, checklist } from '../src/structure.js';
import { JOURNALS } from '../src/journals.js';
const isLabelLine = (t) => /^[^가-힣A-Za-z]{0,3}(국문\s*초록|국문\s*요약|초록|요약|Abstract|ABSTRACT|참고\s*문헌|참고\s*자료|References?|목\s*차|차\s*례)[^가-힣A-Za-z]{0,3}$/.test(t.trim()) || /^[^가-힣A-Za-z]{0,3}(주제어|핵심어|키워드|국문\s*주제어|영문\s*주제어|Key\s*words?|Keywords?)[^가-힣A-Za-z]{0,3}/.test(t.trim());   // 표지·주제어 머리말은 바탕틀 표기로 바뀌므로 누락 검사에서 뺀다

await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const tpl = (j) => (j.template ? new Uint8Array(fs.readFileSync(new URL(`../templates/${j.template.file}.hwp`, import.meta.url))) : null);
const norm = (s) => (s || '').replace(/[\s​]+/g, '').replace(/[“”"]/g, '"').replace(/[‘’']/g, "'");

const [input, ids, ...flags] = process.argv.slice(2);
const quiet = flags.includes('--quiet');
const outDir = new URL('../tests/out/', import.meta.url);
fs.mkdirSync(outDir, { recursive: true });
const base = path.basename(input).replace(/\.[^.]+$/, '');
const bytes = new Uint8Array(fs.readFileSync(input));
const parsed = await parseManuscript(path.basename(input), bytes);

console.log(`\n##### ${base} [${parsed.format}] 문단 ${parsed.paragraphs.length}, 각주 ${parsed.counts.footnotes}, 표 ${parsed.counts.tables}, 그림 ${parsed.counts.pictures}, 쪽 ${parsed.counts.pages ?? '?'}`);
if (parsed.warnings.length) console.log('  warnings:', parsed.warnings.join(' | '));
const inText = parsed.paragraphs.map((p) => p.text).join('\n');
const inFn = parsed.paragraphs.flatMap((p) => p.footnotes.map((f) => f.text));
const inEmph = parsed.paragraphs.flatMap((p) => (p.runs || []).filter((r) => (r.bold || r.italic || r.underline) && r.text.trim().length > 1).map((r) => `${r.bold ? 'B' : ''}${r.italic ? 'I' : ''}${r.underline ? 'U' : ''}:${r.text.trim()}`));
const inSizes = {}; for (const p of parsed.paragraphs) if (p.text.trim()) inSizes[p.size] = (inSizes[p.size] || 0) + 1;
console.log(`  원고 글자 크기 분포: ${Object.entries(inSizes).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k / 100}pt×${v}`).join(' ')}; 강조 런 ${inEmph.length}; 들여쓰기 문단 ${parsed.paragraphs.filter((p) => p.marginLeft >= 8).length}`);

for (const id of ids.split(',')) {
  const j = JOURNALS.find((x) => x.id === id);
  if (!j) { console.log(`!! 학회 id 없음: ${id}`); continue; }
  let blocks = recognize(parsed.paragraphs, j);
  console.log(`\n===== ${j.journal} (${id}) ${j.template ? '바탕틀 ' + j.template.file : (j.format ? '규정값' : '일반 양식')}`);
  // 인식 결과: 본문·빈줄 이외 역할을 순서대로 보여 준다(연속 동일 역할은 묶음)
  const roleCounts = {}; for (const b of blocks) roleCounts[b.role] = (roleCounts[b.role] || 0) + 1;
  console.log('  roles:', Object.entries(roleCounts).map(([k, v]) => `${k}×${v}`).join(' '));
  if (!quiet) {
    let prev = null; let run = 0;
    for (const b of blocks) {
      if (b.role === 'body' || b.role === 'blank') { prev = null; continue; }
      const snip = (b.text || '').replace(/\s+/g, ' ').slice(0, 44);
      if (b.role === prev && /^(ref|toc|quote|abstract|abstractEn)$/.test(b.role)) { run++; if (run > 2) continue; } else run = 0;
      prev = b.role;
      console.log(`    ${b.role.padEnd(14)} ${snip}${b.reason ? '  ⟨' + b.reason + '⟩' : ''}`);
    }
  }
  blocks = buildToc(blocks, j).blocks;
  const ro = reorderSections(blocks, j); blocks = ro.blocks; if (ro.changed) console.log('  reorder:', ro.from.join('→'), '⇒', ro.to.join('→'));
  const unit = j.footnote?.pageUnit || 'keep';
  const sub = applySubstitutions(blocks, j, { pageUnit: unit === 'pp.' ? 'p.' : unit, marks: 'keep' }); blocks = sub.blocks;
  if (sub.changes.length) console.log(`  subst: ${sub.changes.length}곳 (예: ${sub.changes[0].before.slice(0, 36)} → ${sub.changes[0].after.slice(0, 36)})`);
  const bl = applyBlanks(blocks, j); blocks = bl.blocks;
  const warns = [];
  const res = await buildDocument({ journal: j, templateBytes: tpl(j), blocks, onLog: (e) => { if (e.kind === 'warn') warns.push(e.msg); } });
  const outFile = new URL(`${base}_${id}.hwp`, outDir);
  fs.writeFileSync(outFile, res.hwp);
  console.log(`  저장: tests/out/${base}_${id}.hwp — ${res.pages}쪽, ${(res.hwp.length / 1024).toFixed(0)} KB, 추정 ${estimateLength(blocks).sheets}매${warns.length ? ' | △ ' + warns.join(' / ') : ''}`);
  res.doc.free();

  // 산출물을 다시 파싱해 내용 대조
  const out = await parseManuscript(`${base}_${id}.hwp`, res.hwp);
  const outText = out.paragraphs.map((p) => p.text).join('\n');
  const outFn = out.paragraphs.flatMap((p) => p.footnotes.map((f) => f.text));
  const outEmph = out.paragraphs.flatMap((p) => (p.runs || []).filter((r) => (r.bold || r.italic || r.underline) && r.text.trim().length > 1).map((r) => `${r.bold ? 'B' : ''}${r.italic ? 'I' : ''}${r.underline ? 'U' : ''}:${r.text.trim()}`));
  // 문단 단위 누락 검사(치환으로 바뀔 수 있는 쪽수 표기는 숫자+단위를 지워 비교)
  const soft = (s) => norm(s).replace(/pp?\.\d+([-~–]\d+)?\.?|\d+([-~–]\d+)?(쪽|면)\.?/g, '#');
  const outSoft = soft(outText);
  const missing = parsed.paragraphs.filter((p) => p.text.trim().length > 3 && !isLabelLine(p.text) && !outSoft.includes(soft(p.text)));
  // 각주 위치: 각주 앞 12자(원고 기준)가 산출물에서도 같은 각주 앞에 있는지
  const ctx = (ps) => ps.flatMap((p) => p.footnotes.map((f) => norm(p.text.slice(Math.max(0, f.offset - 12), f.offset))));
  const inCtx = ctx(parsed.paragraphs), outCtx = ctx(out.paragraphs);
  const posBad = inCtx.filter((c, i) => c !== outCtx[i]).length;
  const fnOk = inFn.length === outFn.length && inFn.every((t, i) => soft(t) === soft(outFn[i]));
  const fnMis = inFn.map((t, i) => [t, outFn[i]]).filter(([a, b]) => soft(a) !== soft(b || ''));
  const emphIn = new Set(inEmph.map(norm)), emphOut = new Set(outEmph.map(norm));
  const emphLost = [...emphIn].filter((e) => !emphOut.has(e));
  console.log(`  검증: 글자 ${norm(inText).length} → ${norm(outText).length} (${missing.length ? '누락 문단 ' + missing.length : '본문 전부 보존'}); 각주 ${inFn.length} → ${outFn.length} ${fnOk ? '일치' : '불일치 ' + fnMis.length}${posBad ? ` (위치 어긋남 ${posBad})` : ''}; 강조 ${inEmph.length} → ${outEmph.length}${emphLost.length ? ' (유실 ' + emphLost.length + ')' : ''}; 문단 ${parsed.paragraphs.length} → ${out.paragraphs.length}`);
  for (const p of missing.slice(0, 4)) console.log(`    누락: ${p.text.replace(/\s+/g, ' ').slice(0, 70)}`);
  for (const [a, b] of fnMis.slice(0, 3)) console.log(`    각주 불일치: ${a.slice(0, 40)} ≠ ${(b || '(없음)').slice(0, 40)}`);
  for (const e of emphLost.slice(0, 3)) console.log(`    강조 유실: ${e.slice(0, 50)}`);
  console.log('  checklist:', checklist(blocks, j).map((c) => `${c.ok ? '●' : (c.warn ? '▲' : '○')}${c.text.slice(0, 24)}`).join(' / '));
}
