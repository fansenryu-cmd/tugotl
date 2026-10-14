// 우리 산출물(HWP)의 편집 서식 프로파일: node tools/output_profile.mjs <hwp> [--json out.json]
// pdf_profile.py와 같은 항목(용지·여백·본문/각주 글꼴·크기·줄 간격·제목·장 제목·초록·참고문헌)을 rhwp의 글자 모양과 render tree에서 뽑는다.
import fs from 'node:fs';
import { initEngine, HwpDocument } from '../src/engine.js';
await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const [file, ...flags] = process.argv.slice(2);
const out = flags.includes('--json') ? flags[flags.indexOf('--json') + 1] : null;
const J = (s) => { try { return JSON.parse(s); } catch { return {}; } };
const U = (v) => Math.round((v / 7200) * 25.4 * 10) / 10;   // HWPUNIT → mm
const d = new HwpDocument(new Uint8Array(fs.readFileSync(file)));
const pd = J(d.getPageDef(0));
const RE_H1 = /^(\d{1,2}\s*[.．]|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\s*[.．]|[IVX]+\s*[.．])\s*\S/;
const RE = { abstractKo: /^[<＜\[〔❙▌•]?\s*(국문\s*초록|국문\s*요약|초록|요약)\s*[>＞\]〕❙]?\s*$/, abstractEn: /^[<＜\[〔❙▌•]?\s*(Abstract|ABSTRACT)\s*[>＞\]〕❙]?\s*$/, refHead: /^[<＜\[〔❙▌•]?\s*(참고\s*문헌|참고자료|References?)\s*[>＞\]〕❙]?\s*$/, tocHead: /^[<＜\[〔❙▌•〈]?\s*(목\s*차|차\s*례)\s*[>＞\]〕❙〉]?\s*$/, keywords: /^[<＜\[〔❙▌•]?\s*(주제어|핵심어|키워드|Key\s*words?|Keywords?)\s*[>＞\]〕❙:：]/ };
const paras = [];
for (let i = 0; i < d.getParagraphCount(0); i++) {
  const len = d.getParagraphLength(0, i); if (!len) continue;
  const t = d.getTextRange(0, i, 0, Math.min(80, len)).trim(); if (!t) continue;
  const nz = t.search(/\S/); const cp = J(d.getCharPropertiesAt(0, i, nz > 0 ? nz : 0)); const pp = J(d.getParaPropertiesAt(0, i));
  paras.push({ i, t, font: cp.fontFamily, size: (cp.fontSize || 0) / 100, bold: !!cp.bold, align: pp.alignment, ls: pp.lineSpacing, indent: pp.indent, ml: pp.marginLeft, len });
}
const mode = (a) => { const c = new Map(); for (const x of a) c.set(x, (c.get(x) || 0) + 1); return [...c.entries()].sort((p, q) => q[1] - p[1])[0]?.[0]; };
const bodyKey = mode(paras.filter((p) => p.len > 80).map((p) => `${p.font}|${p.size}|${p.ls}`));
const [bf, bs, bls] = (bodyKey || '||').split('|');
const title = paras.slice(0, 3).reduce((a, b) => (b.size > (a?.size || 0) ? b : a), null);
const h1 = paras.filter((p) => RE_H1.test(p.t) && p.t.length < 60 && (p.size > +bs + 0.3 || p.bold));
const h1Key = mode(h1.map((p) => `${p.font}|${p.size}|${p.bold}`));
const marks = {}; for (const p of paras) for (const [k, rx] of Object.entries(RE)) if (!marks[k] && rx.test(p.t)) marks[k] = { font: p.font, size: p.size, bold: p.bold, align: p.align, sample: p.t.slice(0, 20) };
const after = (k) => { const idx = paras.findIndex((p) => RE[k].test(p.t)); const n = idx >= 0 ? paras.slice(idx + 1, idx + 6).find((p) => p.t.length > 15) : null; return n ? { font: n.font, size: n.size, ls: n.ls, align: n.align, indent_pt: n.indent, marginLeft_pt: n.ml } : null; };
// 각주 글자 모양: 첫 각주 컨트롤의 글자 모양
let footnote = null;
const c = (J(d.getControls()) || []).find((x) => x.ctrlId === 'fn');
if (c) { const fi = J(d.getFootnoteInfo(0, c.para, c.controlIndex)); footnote = { paraCount: fi.paraCount }; }
// render tree로 실제 줄 간격(px → pt) 측정: 본문 TextLine y 차이 최빈값, 각주 영역 줄 간격
const pitch = (pageIdx) => { const rt = J(d.getPageRenderTree(pageIdx)); const body = []; const fn = []; const walk = (n, inFn) => { if (n.type === 'TextLine') (inFn ? fn : body).push(n.bbox.y); for (const ch of n.children || []) walk(ch, inFn || n.type === 'FootnoteArea'); }; walk(rt, false); const gaps = (ys) => { ys.sort((a, b) => a - b); const g = ys.slice(1).map((y, i) => Math.round((y - ys[i]) * 0.75 * 10) / 10).filter((v) => v > 4 && v < 40); return mode(g); }; const fnSize = (() => { const sizes = []; const w2 = (n, inFn) => { if (inFn && n.type === 'TextRun' && n.fontSize) sizes.push(n.fontSize); for (const ch of n.children || []) w2(ch, inFn || n.type === 'FootnoteArea'); }; w2(rt, false); return mode(sizes); })(); return { bodyPitch: gaps(body), fnPitch: gaps(fn), fnSizePx: fnSize }; };
const pitches = [1, 2, 3].filter((p) => p < d.pageCount()).map(pitch);
const bodyPitch = mode(pitches.map((p) => p.bodyPitch).filter(Boolean)); const fnPitch = mode(pitches.map((p) => p.fnPitch).filter(Boolean));
const res = {
  file: file.split(/[\\/]/).pop(), pages: d.pageCount(),
  page_mm: [U(pd.width), U(pd.height)], margins_mm: { left: U(pd.marginLeft), right: U(pd.marginRight), top: U(pd.marginTop), bottom: U(pd.marginBottom), header: U(pd.marginHeader), footer: U(pd.marginFooter) },
  body: { font: bf, size_pt: +bs, line_spacing_pct: +bls, measured_pitch_pt: bodyPitch, measured_spacing_pct: bodyPitch ? Math.round((bodyPitch / +bs) * 100) : null },
  footnote: { measured_pitch_pt: fnPitch, ...footnote },
  title: title ? { font: title.font, size_pt: title.size, bold: title.bold, align: title.align } : null,
  h1: h1Key ? { font: h1Key.split('|')[0], size_pt: +h1Key.split('|')[1], bold: h1Key.split('|')[2] === 'true', samples: h1.slice(0, 3).map((p) => p.t.slice(0, 20)) } : null,
  marks, abstract_body: after('abstractKo'), ref_body: after('refHead'),
};
d.free();
const s = JSON.stringify(res, null, 1); if (out) fs.writeFileSync(out, s); console.log(s);
