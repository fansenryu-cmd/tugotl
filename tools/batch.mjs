// 대량 검증: 모든 원고 × 모든 학회(또는 지정 학회)를 변환해 보존·인식·오류 지표를 집계한다.
// node tools/batch.mjs [--journals id,id] [--dirs tests/원고,tests/원고_pdf] [--out tests/report.json] [--cite apa|chicago|journal]
import fs from 'node:fs';
import path from 'node:path';
import { initEngine, buildDocument } from '../src/engine.js';
import { parseManuscript } from '../src/parse.js';
import { recognize, buildToc, reorderSections, applyBlanks, applySubstitutions, checklist } from '../src/structure.js';
import { restyleCitations } from '../src/cite.js';
import { JOURNALS } from '../src/journals.js';
const isLabelLine = (t) => /^[^가-힣A-Za-z]{0,3}(국문\s*초록|국문\s*요약|초록|요약|Abstract|ABSTRACT|참고\s*문헌|참고\s*자료|References?|목\s*차|차\s*례)[^가-힣A-Za-z]{0,3}$/.test(t.trim()) || /^[^가-힣A-Za-z]{0,3}(주제어|핵심어|키워드|국문\s*주제어|영문\s*주제어|Key\s*words?|Keywords?)[^가-힣A-Za-z]{0,3}/.test(t.trim());   // 표지·주제어 머리말은 바탕틀 표기로 바뀌므로 누락 검사에서 뺀다

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const dirs = arg('--dirs', 'tests/원고,tests/원고_pdf').split(',');
const only = arg('--journals', '').split(',').filter(Boolean);
const outFile = arg('--out', 'tests/report.json');
const citeStyle = arg('--cite', 'journal');
await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const tpl = (j) => (j.template ? new Uint8Array(fs.readFileSync(new URL(`../templates/${j.template.file}.hwp`, import.meta.url))) : null);
const norm = (s) => (s || '').replace(/[\s​]+/g, '').replace(/[“”"]/g, '"').replace(/[‘’']/g, "'");
const soft = (s) => norm(s).replace(/pp?\.\d+([-~–]\d+)?\.?|\d+([-~–]\d+)?(쪽|면)\.?/g, '#');

const files = dirs.flatMap((d) => fs.existsSync(d) ? fs.readdirSync(d).filter((f) => /\.(hwp|hwpx|docx|txt|md)$/i.test(f)).map((f) => path.join(d, f)) : []);
const journals = JOURNALS.filter((j) => !only.length || only.includes(j.id));
console.log(`원고 ${files.length}개 × 학회 ${journals.length}곳 = ${files.length * journals.length}건`);
const report = { started: new Date().toISOString(), cite: citeStyle, manuscripts: [], runs: [] };
let done = 0; const t0 = Date.now();
for (const f of files) {
  let parsed; const name = path.basename(f);
  try { parsed = await parseManuscript(name, new Uint8Array(fs.readFileSync(f))); }
  catch (e) { report.manuscripts.push({ file: name, error: String(e.message || e) }); continue; }
  const inText = parsed.paragraphs.map((p) => p.text).join('\n');
  const inFn = parsed.paragraphs.flatMap((p) => p.footnotes.map((x) => x.text));
  const hasRefHead = parsed.paragraphs.some((p) => /^[<＜〔\[]?\s*참\s*고\s*문\s*헌/.test(p.text.trim()));
  const hasAbs = parsed.paragraphs.some((p) => /^[<＜〔\[]?\s*(국문\s*)?(초록|요약|개요)/.test(p.text.trim()));
  const hasAbsEn = parsed.paragraphs.some((p) => /^[<＜〔\[]?\s*abstract/i.test(p.text.trim()));
  report.manuscripts.push({ file: name, format: parsed.format, paragraphs: parsed.paragraphs.length, footnotes: inFn.length, chars: norm(inText).length, hasRefHead, hasAbs, hasAbsEn });
  for (const j of journals) {
    const run = { file: name, journal: j.id, ok: false };
    try {
      let blocks = recognize(parsed.paragraphs, j);
      const roles = {}; for (const b of blocks) roles[b.role] = (roles[b.role] || 0) + 1;
      run.roles = roles;
      blocks = buildToc(blocks, j).blocks;
      blocks = reorderSections(blocks, j).blocks;
      const unit = j.footnote?.pageUnit || 'keep';
      if (citeStyle !== 'keep') blocks = applySubstitutions(blocks, j, { pageUnit: unit === 'pp.' ? 'p.' : unit, marks: 'keep' }).blocks;
      if (citeStyle === 'apa' || citeStyle === 'chicago') { const c = restyleCitations(blocks, citeStyle); blocks = c.blocks; run.cite = { converted: c.converted, unrecognized: c.unrecognized }; }
      blocks = applyBlanks(blocks, j).blocks;
      const warns = [];
      const res = await buildDocument({ journal: j, templateBytes: tpl(j), blocks, onLog: (e) => { if (e.kind === 'warn') warns.push(e.msg); } });
      run.pages = res.pages; run.ms = res.elapsed; run.warns = warns;
      const out = await parseManuscript(`o_${j.id}.hwp`, res.hwp);
      res.doc.free();
      const outSoft = soft(out.paragraphs.map((p) => p.text).join('\n'));
      const missing = parsed.paragraphs.filter((p) => p.text.trim().length > 3 && !isLabelLine(p.text) && !outSoft.includes(soft(p.text)));
      const outFn = out.paragraphs.flatMap((p) => p.footnotes.map((x) => x.text));
      run.missingParas = missing.length; run.missingSample = missing.slice(0, 2).map((p) => p.text.slice(0, 60));
      run.fnIn = inFn.length; run.fnOut = outFn.length;
      run.fnMismatch = inFn.filter((t, i) => soft(t) !== soft(outFn[i] || '')).length;
      const ctx = (ps) => ps.flatMap((p) => p.footnotes.map((x) => norm(p.text.slice(Math.max(0, x.offset - 12), x.offset))));
      const inCtx = ctx(parsed.paragraphs), outCtx = ctx(out.paragraphs);
      run.fnPosBad = inCtx.filter((c, k) => c !== outCtx[k]).length;
      run.checklist = checklist(blocks, j).map((c) => ({ ok: c.ok, warn: !!c.warn, text: c.text.slice(0, 40) }));
      run.struct = { title: !!roles.title, h1: roles.h1 || 0, ref: roles.ref || 0, abstract: roles.abstract || 0, abstractEn: roles.abstractEn || 0, quote: roles.quote || 0, body: roles.body || 0 };
      run.ok = true;
    } catch (e) { run.error = String(e && e.message || e).slice(0, 200); }
    report.runs.push(run);
    done++;
    if (done % 50 === 0) console.log(`  ${done} / ${files.length * journals.length} (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
}
report.finished = new Date().toISOString();
// 집계
const byJ = {};
for (const r of report.runs) {
  const b = byJ[r.journal] || (byJ[r.journal] = { n: 0, errors: 0, missing: 0, fnBad: 0, warns: 0 });
  b.n++; if (!r.ok) { b.errors++; continue; }
  if (r.missingParas) b.missing++; if (r.fnMismatch) b.fnBad++; if (r.warns?.length) b.warns++;
}
const m = report.manuscripts.filter((x) => !x.error);
const structScore = (r, man) => { if (!r.ok) return 0; let s = 0, n = 0; n++; if (r.struct.title) s++; if (man.hasRefHead) { n++; if (r.struct.ref > 0) s++; } if (man.hasAbs) { n++; if (r.struct.abstract > 0) s++; } if (man.hasAbsEn) { n++; if (r.struct.abstractEn > 0) s++; } n++; if (r.struct.h1 > 0) s++; return s / n; };
const scores = report.runs.map((r) => { const man = m.find((x) => x.file === r.file) || {}; if (!r.ok) return 0; const content = r.missingParas ? Math.max(0, 1 - r.missingParas / Math.max(1, man.paragraphs || 1) * 5) : 1; const fn = r.fnIn ? (r.fnIn === r.fnOut && !r.fnMismatch && !r.fnPosBad ? 1 : Math.max(0, 1 - (r.fnMismatch + (r.fnPosBad || 0)) / r.fnIn)) : 1; return 0.45 * content + 0.3 * fn + 0.25 * structScore(r, man); });
report.summary = { manuscripts: m.length, runs: report.runs.length, errors: report.runs.filter((r) => !r.ok).length, withMissing: report.runs.filter((r) => r.missingParas).length, withFnMismatch: report.runs.filter((r) => r.fnMismatch).length, score: Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length) * 1000) / 10, byJournal: byJ, seconds: Math.round((Date.now() - t0) / 1000) };
fs.writeFileSync(outFile, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report.summary, null, 1));
