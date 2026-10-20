// 전수 재검증: node tools/verify_matrix.mjs [--journals id,id] [--papers tests/원고/paper1.hwp,...] [--samples tests/audit_fable2/samples] [--md docs/검증매트릭스.md]
// 원고 × 학회마다 변환해 산출 HWP를 다시 열고, 문단을 역할에 맞대어 글꼴·크기·굵게·정렬·줄간격·들여쓰기·내어쓰기가 학회 서식(바탕틀 예시/규정값)과 같은지,
// 목차·초록·주제어·참고문헌·영문초록이 체재 순서대로 있는지 검사한다. 게재 논문 프로파일(samples/*.json)이 있으면 참고 열로 붙인다.
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
// HWPX header의 글자 모양표: charPr id → { hangul, latin, size, bold } (글꼴 이름은 fontface 표에서)
async function fontTable(hwpx) {
  const z = await JSZip.loadAsync(hwpx); const h = await z.file('Contents/header.xml').async('string'); const s = await z.file('Contents/section0.xml').async('string');
  const faces = {}; for (const m of h.matchAll(/<hh:fontface lang="(\w+)"[^>]*>([\s\S]*?)<\/hh:fontface>/g)) faces[m[1]] = [...m[2].matchAll(/<hh:font id="(\d+)"[^>]*face="([^"]+)"/g)].reduce((a, x) => (a[x[1]] = x[2], a), {});
  const cps = {}; for (const m of h.matchAll(/<hh:charPr id="(\d+)"[^>]*height="(\d+)"[^>]*>([\s\S]*?)<\/hh:charPr>/g)) { const fr = /<hh:fontRef hangul="(\d+)" latin="(\d+)"/.exec(m[3]); cps[m[1]] = { size: +m[2] / 100, hangul: fr ? faces.HANGUL?.[fr[1]] : undefined, latin: fr ? faces.LATIN?.[fr[2]] : undefined, bold: /<hh:bold\/>/.test(m[3]) }; }
  // 최상위 문단마다 첫 글 런의 charPrIDRef
  const paras = []; let depth = 0;
  for (const m of s.matchAll(/<(\/?)hp:(subList|p)\b([^>]*)>/g)) { if (m[2] === 'subList') { depth += m[1] ? -1 : 1; continue; } if (m[1] || m[3].endsWith('/')) continue; if (depth) continue; const end = s.indexOf('</hp:p>', m.index); const body = s.slice(m.index, end); const run = /<hp:run charPrIDRef="(\d+)">(?:(?!<\/hp:run>)[\s\S])*?<hp:t>[^<]*[^\s<]/.exec(body); paras.push(run ? run[1] : (/charPrIDRef="(\d+)"/.exec(body)?.[1])); }
  // 문단마다 글이 있는 모든 런의 charPrIDRef(주제어 줄은 머리말 런과 값 런의 글자 모양이 다르다)
  const paraRuns = []; depth = 0;
  for (const m of s.matchAll(/<(\/?)hp:(subList|p)\b([^>]*)>/g)) { if (m[2] === 'subList') { depth += m[1] ? -1 : 1; continue; } if (m[1] || m[3].endsWith('/')) continue; if (depth) continue; const end = s.indexOf('</hp:p>', m.index); const body = s.slice(m.index, end).replace(/<hp:subList[\s\S]*?<\/hp:subList>/g, ''); paraRuns.push([...body.matchAll(/<hp:run charPrIDRef="(\d+)">(?:(?!<\/hp:run>)[\s\S])*?<hp:t>[^<]*[^\s<]/g)].map((x) => x[1])); }
  return { cps, paras, paraRuns };
}
import { initEngine, buildDocument, resolveRoles, HwpDocument } from '../src/engine.js';
import { parseManuscript } from '../src/parse.js';
import { recognize, buildToc, reorderSections, applyBlanks, applySubstitutions } from '../src/structure.js';
import { JOURNALS, ROLE_DEFS, GENERIC_FORMAT, FLOAT_ROLES } from '../src/journals.js';
await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const ids = arg('--journals', '') ? arg('--journals', '').split(',') : JOURNALS.map((j) => j.id);
const papers = arg('--papers', 'tests/원고/paper1.hwp,tests/원고/paper2.hwp,tests/원고/paper3.hwp,tests/원고/paper4.hwp,tests/원고/paper5.hwp').split(',');
const samplesDir = arg('--samples', 'tests/audit_fable2/samples'); const mdOut = arg('--md', null);
const J = (s) => { try { return JSON.parse(s); } catch { return {}; } };
const GROUP = Object.fromEntries(ROLE_DEFS.map((r) => [r.id, r.group]));
const tpl = (j) => (j.template && fs.existsSync(`templates/${j.template.file}.hwp`) ? new Uint8Array(fs.readFileSync(`templates/${j.template.file}.hwp`)) : null);
const probeAt = (t) => { let m = /[가-힣]/.exec(t); if (!m) m = /[A-Za-z]/.exec(t); if (!m) m = /\S/.exec(t); return m ? m.index : 0; };   // 글자 모양은 한글(없으면 영문, 없으면 첫 글자) 자리에서 읽는다 — 기대값·산출물 모두 같은 규칙
const mode = (a) => { const c = new Map(); for (const x of a) if (x !== undefined && x !== null) c.set(x, (c.get(x) || 0) + 1); return [...c.entries()].sort((p, q) => q[1] - p[1])[0]?.[0]; };
const px2pt = (v) => Math.round((v || 0) * 0.75 * 10) / 10;
// 학회 서식(기대값): 바탕틀 역할 예시 문단/스타일의 글자·문단 모양, 규정값은 format.roles
function expectedShapes(j, bytes) {
  const exp = {};
  if (bytes) {
    const d = new HwpDocument(bytes); const styles = J(d.getStyleList()) || []; const byName = Object.fromEntries(styles.map((s) => [s.name.trim(), s]));
    for (const [role, spec] of Object.entries(j.template.roles || {})) {
      if (!spec) continue;
      if (spec.para !== undefined) { const sec = spec.sec || 0; if (sec >= d.getSectionCount() || spec.para >= d.getParagraphCount(sec)) continue; const len = d.getParagraphLength(sec, spec.para); const t = len ? d.getTextRange(sec, spec.para, 0, Math.min(40, len)) : ''; const cp = J(d.getCharPropertiesAt(sec, spec.para, probeAt(t))); const pp = J(d.getParaPropertiesAt(sec, spec.para)); exp[role] = { cpId: cp.charShapeId, font: cp.fontFamily, size: (cp.fontSize || 0) / 100, bold: !!cp.bold, align: pp.alignment, ls: pp.lineSpacing, indent: px2pt(pp.indent), ml: px2pt(pp.marginLeft), src: `문단 ${spec.para}` }; }
      else if (spec.style && byName[spec.style]) { const det = J(d.getStyleDetail(byName[spec.style].id)); const cp = det.charProps || {}; const pp = det.paraProps || {}; exp[role] = { cpId: byName[spec.style].charShapeId, font: cp.fontFamily, size: (cp.fontSize || 0) / 100, bold: !!cp.bold, align: pp.alignment, ls: pp.lineSpacing, indent: px2pt(pp.indent), ml: px2pt(pp.marginLeft), src: `스타일 ${spec.style}` }; }
    }
    d.free();
  } else {
    const fmt = j.format || GENERIC_FORMAT;
    for (const [role, f] of Object.entries(fmt.roles || {})) exp[role] = { font: f.font || fmt.font, size: f.size, bold: !!f.bold, align: f.align, ls: f.lineSpacing, indent: f.indent || 0, ml: (f.indent || 0) < 0 && Math.abs((f.marginLeft || 0) + f.indent) < 0.05 ? 0 : (f.marginLeft || 0), src: '규정값' };   // 엔진은 Word식 내어쓰기(−X, +X)를 한글식(−X, 0)으로 쓴다
  }
  return exp;
}
const report = []; const t0 = Date.now();
const parsedCache = new Map();
for (const id of ids) {
  const j = JOURNALS.find((x) => x.id === id); if (!j) continue;
  const bytes = tpl(j); const exp = expectedShapes(j, bytes);
  const wantsToc = (j.structure || []).includes('toc') || !!(j.template?.roles?.toc || j.template?.roles?.tocHead);
  const row = { id, journal: j.journal, kind: bytes ? '바탕틀' : (j.format ? '규정값' : '일반'), papers: [], roleIssues: {}, labelIssues: new Set() };
  for (const pf of papers) {
    let parsed = parsedCache.get(pf); if (!parsed) { parsed = await parseManuscript(path.basename(pf), new Uint8Array(fs.readFileSync(pf))); parsedCache.set(pf, parsed); }
    let blocks = recognize(parsed.paragraphs, j);
    blocks = buildToc(blocks, j).blocks; blocks = reorderSections(blocks, j).blocks;
    const unit = j.footnote?.pageUnit || 'keep'; blocks = applySubstitutions(blocks, j, { pageUnit: unit === 'pp.' ? 'p.' : unit, marks: 'keep' }).blocks;
    blocks = applyBlanks(blocks, j).blocks;
    const res = await buildDocument({ journal: j, templateBytes: bytes, blocks });
    const ft = await fontTable(res.hwpx);
    // 기대값의 글꼴도 같은 글자 모양표에서(바탕틀의 charPr id는 산출물에 그대로 남는다)
    for (const e of Object.values(exp)) if (e.cpId !== undefined && ft.cps[e.cpId]) { const tb = ft.cps[e.cpId]; e.font = tb.hangul || e.font; e.size = tb.size || e.size; e.bold = tb.bold; }
    const d = res.doc; const n = d.getParagraphCount(0);
    const outBlocks = blocks.filter((b) => b.role !== 'skip');
    const pr = { paper: path.basename(pf), paras: n, blocks: outBlocks.length, roles: {}, structure: [], ok: true };
    const perRole = {};
    // 블록 ↔ 산출 문단: 글 머리 20자로 차례대로 짝짓는다(인덱스에 기대지 않음)
    const norm = (x) => (x || '').replace(/\s+/g, '').slice(0, 20);
    const outTexts = []; for (let i = 0; i < n; i++) { const len = d.getParagraphLength(0, i); outTexts.push(len ? d.getTextRange(0, i, 0, Math.min(60, len)) : ''); }
    let ptr = 0; let unmatched = 0;
    for (const b of outBlocks) {
      if (b.role === 'blank' || !b.text?.trim()) continue;
      const key = norm(b.text); let i = -1;
      const labelRole = /^(tocHead|abstractHead|abstractEnHead|refHead|keywords|keywordsEn)$/.test(b.role);   // 표지 문구는 바탕틀 표기로 바뀌므로 글 대신 자리(다음 비어 있지 않은 문단)로 짝짓는다
      for (let k = ptr, seen = 0; k < n && seen < 6; k++) { const ot = norm(outTexts[k]); if (!ot) continue; seen++; /* 빈 문단(표·그림 문단 포함)은 창에 세지 않는다 */ if (labelRole || (key && ot.startsWith(key.slice(0, 8)))) { i = k; break; } }
      if (i < 0) { unmatched++; if (process.env.VM_DEBUG) console.log('   못 찾음', b.role, JSON.stringify(b.text.slice(0, 30)), '| 다음 문단', JSON.stringify(outTexts.slice(ptr, ptr + 3).map((x) => x.slice(0, 20)))); continue; }
      ptr = i + 1;
      const t = outTexts[i];
      const cp = J(d.getCharPropertiesAt(0, i, probeAt(t))); const pp = J(d.getParaPropertiesAt(0, i));
      // 주제어 줄은 머리말 런과 값 런의 글자 모양이 다르므로(바탕틀 예시대로) 기대값과 맞는 런이 있으면 그 런을 본다
      let tb = ft.cps[ft.paras[i]] || {};
      if (/^keywords/.test(b.role) && exp[b.role]) { const e0 = exp[b.role]; const hit = (ft.paraRuns[i] || []).map((id) => ft.cps[id]).filter(Boolean).find((c) => c.hangul === e0.font && (!e0.size || Math.abs(c.size - e0.size) < 0.05)); if (hit) tb = hit; }
      (perRole[b.role] ||= []).push({ font: tb.hangul || cp.fontFamily, latin: tb.latin, size: tb.size || (cp.fontSize || 0) / 100, bold: tb.bold ?? !!cp.bold, align: pp.alignment, ls: pp.lineSpacing, indent: px2pt(pp.indent), ml: px2pt(pp.marginLeft), text: t.trim() });
    }
    if (unmatched) pr.structure.push(`산출물에서 못 찾은 문단 ${unmatched}`);
    // 체재 검사
    const has = (r) => (perRole[r] || []).length;
    const h1 = has('h1');
    const tocTable = outBlocks.some((b) => (b.objects || []).some((o) => o.info && o.info.toc));   // 원고가 목차를 표로 짠 경우(표째 옮김)
    if (wantsToc && !tocTable) { if (!has('tocHead') && !has('toc')) pr.structure.push('목차 없음'); else if (has('toc') < h1) pr.structure.push(`목차 항목 ${has('toc')} < 장 제목 ${h1}`); }
    const src = (r) => blocks.some((b) => b.role === r);   // 원고에 그 요소가 있을 때만 산출물에도 있어야 한다
    if (src('abstract') && !has('abstract')) pr.structure.push('국문초록 없음'); if (src('keywords') && !has('keywords')) pr.structure.push('주제어 없음');
    if ((src('ref') || src('refHead')) && !has('refHead') && !has('ref')) pr.structure.push('참고문헌 없음'); if (src('abstractEn') && !has('abstractEn')) pr.structure.push('영문초록 없음');
    pr.missingInSource = ['abstract', 'keywords', 'abstractEn'].filter((r) => !src(r));
    // 체재 순서: 출력 묶음 순서가 학회 structure 순서를 따르는가
    const order = j.structure || ['front', 'toc', 'abstractKo', 'body', 'references', 'abstractEn', 'tail'];
    const seq = []; for (const b of outBlocks) { if (b.role === 'blank' || b.role === 'skip' || FLOAT_ROLES.has(b.role)) continue; let g = GROUP[b.role] || 'body'; if ((j.keywordsPosition === 'afterReferences' || j.keywordsPosition === 'beforeReferences') && b.role === 'keywords') g = 'references'; if (seq[seq.length - 1] !== g) seq.push(g); }
    const pos = seq.map((g) => order.indexOf(g)).filter((x) => x >= 0); for (let k = 1; k < pos.length; k++) if (pos[k] < pos[k - 1]) { pr.structure.push(`체재 순서 어긋남: ${seq.join('→')}`); break; }
    // 역할별 서식 대조
    for (const [role, list] of Object.entries(perRole)) {
      const e = exp[role]; if (!e) continue;
      const got = { font: mode(list.map((x) => x.font)), size: mode(list.map((x) => x.size)), bold: mode(list.map((x) => x.bold)), align: mode(list.map((x) => x.align)), ls: mode(list.map((x) => x.ls)), indent: mode(list.map((x) => x.indent)), ml: mode(list.map((x) => x.ml)) };
      const diffs = [];
      if (e.font && got.font && e.font !== got.font) diffs.push(`글꼴 ${got.font}≠${e.font}`);
      if (e.size && Math.abs(got.size - e.size) > 0.3) diffs.push(`크기 ${got.size}≠${e.size}`);
      if (e.align && got.align && e.align !== got.align) diffs.push(`정렬 ${got.align}≠${e.align}`);
      if (e.ls && got.ls && Math.abs(got.ls - e.ls) > 3) diffs.push(`줄간격 ${got.ls}≠${e.ls}`);
      if (Math.abs((got.indent || 0) - (e.indent || 0)) > 1.5) diffs.push(`들여쓰기 ${got.indent}≠${e.indent}`);
      if (Math.abs((got.ml || 0) - (e.ml || 0)) > 1.5) diffs.push(`왼쪽여백 ${got.ml}≠${e.ml}`);
      if (e.bold !== undefined && e.bold !== got.bold && /^(title|subtitle|titleEn|subtitleEn|titleEn2|h1|h2|h3|h4|abstractHead|abstractEnHead|refHead|refSub|tocHead|toc|author|authorEn)$/.test(role)) diffs.push(`굵게 ${got.bold}≠${e.bold}`);
      pr.roles[role] = { n: list.length, got, diffs };
      if (diffs.length) { row.roleIssues[role] = diffs; }
    }
    // 표지 문구
    for (const [role, lab] of Object.entries(j.labels || {})) { const l = perRole[role]?.[0]?.text; if (l && !l.startsWith(lab.trim())) row.labelIssues.add(`${role}: “${l.slice(0, 12)}” ≠ ‘${lab}’`); }
    if (pr.structure.length) pr.ok = false;
    pr.pages = res.pages; row.papers.push(pr);
    d.free();
  }
  // 게재 논문 프로파일 참고
  const mapFile = path.join(samplesDir, 'map.json');
  if (fs.existsSync(mapFile)) { const map = JSON.parse(fs.readFileSync(mapFile, 'utf8')); const folder = Object.entries(map).find(([, v]) => v === id)?.[0]; if (folder) { const prof = fs.readdirSync(samplesDir).filter((f) => f.startsWith(folder + '_') && f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(samplesDir, f), 'utf8'))).filter((p) => p.page_mm); if (prof.length) row.published = { n: prof.length, page: mode(prof.map((p) => p.page_mm.join('×'))), body: `${mode(prof.map((p) => p.body.size_pt))}pt ${mode(prof.map((p) => p.body.line_spacing_pct))}%`, fn: mode(prof.map((p) => p.footnote?.size_pt)), title: mode(prof.map((p) => p.title?.size_pt)), h1: mode(prof.map((p) => p.h1?.size_pt)) }; } }
  row.ok = row.papers.every((p) => p.ok) && !Object.keys(row.roleIssues).length && !row.labelIssues.size;
  report.push(row);
  console.log(`${row.ok ? '●' : '○'} ${id.padEnd(14)} ${row.kind} ${row.papers.map((p) => (p.ok ? '✓' : '✗')).join('')} ${Object.keys(row.roleIssues).length ? '서식 ' + Object.entries(row.roleIssues).map(([r, d]) => r + '(' + d.join(',') + ')').join(' ') : ''} ${row.labelIssues.size ? '표지 ' + [...row.labelIssues].join(' ') : ''} ${row.papers.flatMap((p) => p.structure.map((s) => `${p.paper.replace('.hwp', '')}:${s}`)).join(' ')}`);
}
console.log(`\n${report.filter((r) => r.ok).length}/${report.length} 학회 통과, ${Math.round((Date.now() - t0) / 1000)}초`);
fs.writeFileSync('tests/out/verify_matrix.json', JSON.stringify(report.map((r) => ({ ...r, labelIssues: [...r.labelIssues] })), null, 1));
if (mdOut) {
  let s = `# 전수 재검증 매트릭스 (${new Date().toISOString().slice(0, 10)})\n\n원고 ${papers.length}편 × 학회 ${report.length}곳. ✓는 체재(목차·초록·주제어·참고문헌·영문초록·순서)와 역할별 서식(글꼴·크기·굵게·정렬·줄간격·들여쓰기·왼쪽 여백)이 학회 서식(바탕틀 예시/규정값)과 일치.\n\n| 학회 | 방식 | ${papers.map((p) => path.basename(p).replace('.hwp', '')).join(' | ')} | 서식 불일치 | 표지 |\n|---|---|${papers.map(() => '---').join('|')}|---|---|\n`;
  for (const r of report) s += `| ${r.journal} | ${r.kind} | ${r.papers.map((p) => (p.ok ? '✓' : '✗ ' + p.structure.join('; ')) + (p.missingInSource?.length ? ' (원고에 ' + p.missingInSource.join('·') + ' 없음)' : '')).join(' | ')} | ${Object.entries(r.roleIssues).map(([k, d]) => `${k}: ${d.join(', ')}`).join('; ') || '—'} | ${[...r.labelIssues].join('; ') || '—'} |
`;
  fs.writeFileSync(mdOut, s);
}
