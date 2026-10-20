// 투고틀 엔진 — rhwp(WASM)로 바탕틀을 열어 원고 블록을 흘려 넣고 HWP/HWPX로 저장한다.
// AI 호출 없음. 모든 처리는 이 파일 안(브라우저 메모리)에서 끝난다.
import init, { HwpDocument } from '../node_modules/@rhwp/core/rhwp.js';
import JSZip from 'jszip';
import { ROLE_FALLBACK, GENERIC_FORMAT, ROLE_DEFS, FLOAT_ROLES } from './journals.js';
import { makeImporter } from './objects.js';
const ROLE_GROUP = Object.fromEntries(ROLE_DEFS.map((r) => [r.id, r.group]));

export { HwpDocument };

// ───────── 단위 ─────────
export const U = {
  mm: (v) => Math.round((v * 7200) / 25.4),      // mm → HWPUNIT
  hwpToMm: (v) => Math.round((v * 25.4) / 7200 * 10) / 10,
  fontSize: (pt) => Math.round(pt * 100),         // pt → fontSize(1/100pt)
  spacing: (pt) => Math.round(pt * 100),          // 문단 위/아래 간격 → HWPUNIT
  margin: (pt) => Math.round(pt * 200),           // 들여쓰기·좌우 여백은 HWPUNIT×2 로 저장됨
  pxToPt: (px) => Math.round((px * 72) / 96 * 10) / 10,
};

let engineReady = false;
export async function initEngine(wasmBytes) {
  if (engineReady) return;
  if (typeof globalThis.measureTextWidth !== 'function') {
    let ctx = null; let lastFont = '';
    if (typeof document !== 'undefined') {
      globalThis.measureTextWidth = (font, text) => {
        if (!ctx) ctx = document.createElement('canvas').getContext('2d');
        if (font !== lastFont) { ctx.font = font; lastFont = font; }
        return ctx.measureText(text).width;
      };
    } else {
      globalThis.measureTextWidth = (font, text) => { const m = /([\d.]+)px/.exec(font || ''); const px = m ? parseFloat(m[1]) : 10; let w = 0; for (const ch of text) w += ch.charCodeAt(0) > 0x2e80 ? px : px * 0.55; return w; };
    }
  }
  // 8MB를 넘는 WASM은 주 스레드에서 동기 컴파일·인스턴스화가 막히므로 비동기 경로로 초기화한다
  await init({ module_or_path: wasmBytes });
  engineReady = true;
}

const J = (s) => { try { return JSON.parse(s); } catch { return null; } };
const paraText = (d, s, i) => d.getTextRange(s, i, 0, d.getParagraphLength(s, i));

// ───────── 바탕틀 분석 ─────────
// 예시 문단에서 글자 모양을 읽을 위치: 첫 한글, 없으면 첫 영문자, 없으면 첫 비공백 글자
const probeAt = (t) => { let m = /[가-힣]/.exec(t || ''); if (!m) m = /[A-Za-z]/.exec(t || ''); if (!m) m = /\S/.exec(t || ''); return m ? m.index : 0; };

export function analyzeTemplate(bytes) {
  const d = new HwpDocument(bytes);
  try {
    const info = J(d.getDocumentInfo()) || {};
    const styles = (J(d.getStyleList()) || []).map((s) => {
      const det = J(d.getStyleDetail(s.id)) || {};
      return { ...s, char: det.charProps || {}, para: det.paraProps || {} };
    });
    const paragraphs = [];
    const n = d.getParagraphCount(0);
    for (let i = 0; i < n; i++) {
      const len = d.getParagraphLength(0, i);
      const text = len ? paraText(d, 0, i) : '';
      const st = J(d.getStyleAt(0, i)) || {};
      const pp = J(d.getParaPropertiesAt(0, i)) || {};
      // 앞 공백(여러 개 포함)을 건너뛰고 첫 글자의 모양을 본다 (예시 문단이 공백으로 시작하는 경우) — 변환 경로(resolveRoles)와 같은 규칙
      const off = probeAt(text);
      const cp = J(d.getCharPropertiesAt(0, i, off)) || {};
      paragraphs.push({ idx: i, text, len, styleId: st.id, styleName: st.name, ps: pp.paraShapeId, cs: cp.charShapeId,
        font: cp.fontFamily, size: cp.fontSize, bold: !!cp.bold, align: pp.alignment, lineSpacing: pp.lineSpacing,
        marginLeft: U.pxToPt(pp.marginLeft || 0), indent: U.pxToPt(pp.indent || 0) });
    }
    const controls = J(d.getControls()) || [];
    const pageDef = J(d.getPageDef(0)) || {};
    return { pageDef, pages: d.pageCount(), fonts: info.fontsUsed || [], styles, paragraphs,
      footnoteCount: controls.filter((c) => c.ctrlId === 'fn').length,
      tableCount: controls.filter((c) => c.ctrlId === 'tbl').length,
      pageText: `${U.hwpToMm(pageDef.width)} × ${U.hwpToMm(pageDef.height)} mm`,
      marginText: `위 ${U.hwpToMm(pageDef.marginTop)} · 아래 ${U.hwpToMm(pageDef.marginBottom)} · 왼쪽 ${U.hwpToMm(pageDef.marginLeft)} · 오른쪽 ${U.hwpToMm(pageDef.marginRight)} · 머리말 ${U.hwpToMm(pageDef.marginHeader)} · 꼬리말 ${U.hwpToMm(pageDef.marginFooter)} mm` };
  } finally { d.free(); }
}

// 줄 배치 재계산(rhwp 0.8.7의 reflowLinesegs). 없는 판이면 null
const reflow = (d) => { try { return typeof d.reflowLinesegs === 'function' ? d.reflowLinesegs() : null; } catch { return null; } };

export function renderTemplatePage(bytes, page = 0) {
  const d = new HwpDocument(bytes);
  try { return { svg: d.renderPageSvg(page), pages: d.pageCount() }; } finally { d.free(); }
}

// 바탕틀 HWPX의 각주 예시에서 문단/글자 모양 ID를 읽는다
async function templateFootnoteIds(doc) {
  const zip = await JSZip.loadAsync(doc.exportHwpx());
  const f = zip.file('Contents/section0.xml'); if (!f) return null;
  const xml = await f.async('string');
  const m = /<hp:footNote\b[\s\S]*?<hp:p\b([^>]*)>[\s\S]*?<hp:run\b([^>]*)>/.exec(xml);
  if (!m) return null;
  const ps = /paraPrIDRef="(\d+)"/.exec(m[1]); const st = /styleIDRef="(\d+)"/.exec(m[1]); const cs = /charPrIDRef="(\d+)"/.exec(m[2]);
  if (!ps || !cs) return null;
  return { ps: +ps[1], cs: +cs[1], styleId: st ? +st[1] : undefined, src: '바탕틀 각주 예시' };
}

// 서식 명세(pt 단위) → rhwp props
function charPropsOf(doc, fmt, fontName) {
  const name = fmt.font || fontName || '바탕';
  const fid = doc.findOrCreateFontId(name);
  const p = { fontFamily: name, fontSize: U.fontSize(fmt.size || 10), bold: !!fmt.bold, italic: !!fmt.italic };
  if (fid >= 0) p.fontId = fid;
  if (fmt.spacing !== undefined) p.spacings = Array(7).fill(fmt.spacing);
  if (fmt.ratio !== undefined) p.ratios = Array(7).fill(fmt.ratio);
  return p;
}
function paraPropsOf(fmt) {
  const p = { alignment: fmt.align || 'justify', lineSpacing: fmt.lineSpacing || 160, lineSpacingType: 'Percent',
    indent: U.margin(fmt.indent || 0), marginLeft: U.margin(fmt.marginLeft || 0), marginRight: U.margin(fmt.marginRight || 0),
    spacingBefore: U.spacing(fmt.spacingBefore || 0), spacingAfter: U.spacing(fmt.spacingAfter || 0) };
  p.pageBreakBefore = !!fmt.pageBreakBefore;   // 명시적으로 꺼야 임시 서식 문단이 앞 역할(예: 영문초록 제목)의 쪽 나눔을 물려받지 않는다
  return p;
}

// 역할별 모양 ID 결정. 바탕틀 문단(para) → 스타일(style) → 서식(format) → 대체 역할 순.
// format 역할은 임시 문단을 만들어 모양을 등록한 뒤 ID만 가져온다.
export async function resolveRoles(doc, journal, log, hasTemplate) {
  const hasTpl = hasTemplate === undefined ? !!journal.template : !!hasTemplate;   // 바탕틀 파일이 실제로 있을 때만 바탕틀 역할을 쓴다(사용자 학회가 바탕틀 없이 template만 적어도 동작)
  const roles = (hasTpl && journal.template && journal.template.roles) || {};
  const fmt = journal.format || (hasTpl ? null : GENERIC_FORMAT);
  const styles = J(doc.getStyleList()) || [];
  const byName = Object.fromEntries(styles.map((s) => [s.name.trim(), s]));
  const n0 = doc.getParagraphCount(0);
  const shapes = {};
  const need = ['title', 'subtitle', 'titleEn', 'subtitleEn', 'author', 'affiliation', 'tocHead', 'toc', 'abstractHead', 'abstract', 'keywords', 'h1', 'h2', 'h3', 'h4', 'body', 'bodyFirst', 'quote', 'source', 'caption', 'object', 'objNote', 'blank', 'refHead', 'refSub', 'ref', 'abstractEnHead', 'titleEn2', 'authorEn', 'abstractEn', 'keywordsEn', 'dates'];
  const scratch = [];
  const fromFormat = (role, f) => {
    // 임시 문단: 마지막 문단 뒤에 추가
    const last = doc.getParagraphCount(0) - 1;
    doc.splitParagraph(0, last, doc.getParagraphLength(0, last));
    const idx = last + 1; scratch.push(idx);
    doc.insertText(0, idx, 0, '견본');
    doc.applyCharFormat(0, idx, 0, 2, JSON.stringify(charPropsOf(doc, f, fmt && fmt.font)));
    doc.applyParaFormat(0, idx, JSON.stringify(paraPropsOf(f)));
    const pp = J(doc.getParaPropertiesAt(0, idx)) || {}; const cp = J(doc.getCharPropertiesAt(0, idx, 0)) || {};
    return { ps: pp.paraShapeId, cs: cp.charShapeId, src: `서식 ${f.font || fmt?.font || ''} ${f.size || 10}pt ${f.lineSpacing || 160}%` };
  };
  for (const role of need) {
    const spec = roles[role];
    let got = null;
    const sec = spec && spec.sec ? spec.sec : 0;
    if (spec && spec.para !== undefined && sec < doc.getSectionCount() && spec.para < doc.getParagraphCount(sec)) {
      const i = spec.para; const txt = doc.getTextRange(sec, i, 0, Math.min(40, doc.getParagraphLength(sec, i)));
      const off = probeAt(txt);   // 글자 모양은 한글(없으면 영문, 없으면 첫 비공백) 자리에서 읽는다 — ‘●Keywords :’처럼 앞 기호가 다른 모양일 수 있다
      const pp = J(doc.getParaPropertiesAt(sec, i)) || {}; let cp = J(doc.getCharPropertiesAt(sec, i, off)) || {};
      let valueCs; if (role === 'keywords' || role === 'keywordsEn') { const lead = /^\s*/.exec(txt)[0].length; const km = KW_LABEL.exec(txt.slice(lead)); if (km) { const cpAt = (o16) => J(doc.getCharPropertiesAt(sec, i, [...txt.slice(0, o16)].length)) || {}; const lo = km[1].search(/[가-힣A-Za-z]/); if (lo >= 0) { const cl = cpAt(lead + lo); if (cl.charShapeId !== undefined) cp = cl; }   // 머리말 모양은 머리말 첫 글자에서
        const v16 = lead + km[1].length; const vr = txt.slice(v16).search(/[가-힣A-Za-z0-9]/); const lab = km[1].replace(/\s+$/, ''); const at16 = vr >= 0 ? v16 + vr : (lab && /[^가-힣A-Za-z]$/.test(lab) ? lead + lab.length - 1 : -1);   // 값 모양은 머리말 뒤 첫 글자(〻￨ 같은 구분 기호는 건너뜀), 값이 없으면 머리말 끝 구분 기호
        if (at16 >= 0) { const cv = cpAt(at16); if (cv.charShapeId !== undefined && cv.charShapeId !== cp.charShapeId) valueCs = cv.charShapeId; } } }   // 머리말 뒤 첫 글자의 글자 모양(예시에 값이 없으면 머리말 끝 구분 기호의 모양)
      got = { ps: pp.paraShapeId, cs: cp.charShapeId, font: cp.fontFamily, size: cp.fontSize, ...(valueCs !== undefined ? { valueCs } : {}), sample: txt.trim(), src: `바탕틀 ${sec ? `구역 ${sec} ` : ''}문단 ${i} (${cp.fontFamily} ${(cp.fontSize || 0) / 100}pt${cp.bold ? ' 굵게' : ''}, ${pp.alignment}, ${pp.lineSpacing}%)` };
    } else if (spec && spec.style && byName[spec.style]) {
      const s = byName[spec.style];
      const det = J(doc.getStyleDetail(s.id)) || {};
      got = { ps: s.paraShapeId, cs: s.charShapeId, styleId: s.id, font: det.charProps?.fontFamily, size: det.charProps?.fontSize, src: `바탕틀 스타일 ‘${s.name}’ (${det.charProps?.fontFamily || ''} ${(det.charProps?.fontSize || 0) / 100}pt)` };
    } else if (spec && spec.format) {
      got = fromFormat(role, spec.format);
    } else if (fmt && fmt.roles && fmt.roles[role]) {
      got = fromFormat(role, fmt.roles[role]);
    }
    if (got) shapes[role] = got;
    else if (spec && spec.like) shapes[role] = { like: spec.like };
  }
  // 표·그림 문단(가운데, 줄 간격 100% — 큰 표의 줄 높이에 줄 간격이 곱해지지 않게)과 그 밑 주석(왼쪽, 작은 글자)은 학회가 따로 정하지 않았으면 본문 글꼴로 만든다
  const bodyFont = (shapes.body && shapes.body.font) || (fmt && fmt.font);
  const bodyPt = shapes.body && shapes.body.size ? shapes.body.size / 100 : (fmt && fmt.roles && fmt.roles.body && fmt.roles.body.size) || 10;
  // 바탕틀 없이 규정 수치(format)만 있는 학회: 규정에 없는 제목·장 제목·초록 역할이 본문 모양으로 떨어지지 않게,
  // 대체 사슬에 학회가 정한 역할이 하나도 없으면 일반 양식 값을 학회 본문 크기에 비례해 채운다(h2가 h1만 있으면 기존대로 h1을 따른다)
  const ownFmt = !hasTpl && journal.format && journal.format !== GENERIC_FORMAT;
  const scaled = (g) => ({ ...g, size: Math.round(g.size * bodyPt) / 10 });   // 일반 양식 본문 10pt 기준
  if (ownFmt) {
    const given = new Set(Object.keys(shapes));
    for (const role of ['title', 'titleEn', 'author', 'abstractHead', 'abstract', 'h1', 'h2', 'h3', 'refHead', 'abstractEnHead']) {
      if (given.has(role) || (roles[role] && roles[role].like) || !GENERIC_FORMAT.roles[role]) continue;
      if ((ROLE_FALLBACK[role] || []).some((a) => given.has(a))) continue;
      shapes[role] = fromFormat(role, scaled(GENERIC_FORMAT.roles[role])); shapes[role].src += ' (일반 양식 비율)';
    }
  }
  if (!shapes.object && !(roles.object && roles.object.like)) shapes.object = fromFormat('object', { ...GENERIC_FORMAT.roles.object, size: bodyPt, font: bodyFont });
  if (!shapes.objNote && !(roles.objNote && roles.objNote.like)) shapes.objNote = fromFormat('objNote', { ...GENERIC_FORMAT.roles.objNote, size: Math.max(7, Math.round((bodyPt - 1) * 10) / 10), font: bodyFont });
  // like / fallback 해결
  for (const role of need) {
    if (shapes[role] && !shapes[role].like) continue;
    const chain = shapes[role]?.like ? [shapes[role].like, ...(ROLE_FALLBACK[role] || [])] : (ROLE_FALLBACK[role] || ['body']);
    let hit = null;
    for (const alt of [...chain, 'body']) { if (shapes[alt] && !shapes[alt].like) { hit = { ...shapes[alt], sample: undefined, src: `${shapes[alt].src} ← ‘${alt}’ 대체` }; break; } }
    if (hit) shapes[role] = hit;
    else delete shapes[role];
  }
  // 각주
  let footnote = null;
  const fnSpec = roles.footnote;
  if (fnSpec && fnSpec.style && byName[fnSpec.style]) { const s = byName[fnSpec.style]; footnote = { ps: s.paraShapeId, cs: s.charShapeId, styleId: s.id, src: `바탕틀 스타일 ‘${s.name}’` }; }
  if (journal.template) { const fromTpl = await templateFootnoteIds(doc); if (fromTpl) footnote = fromTpl; }
  if (!footnote && fmt && fmt.roles && fmt.roles.footnote) footnote = fromFormat('footnote', fmt.roles.footnote);
  if (!footnote) { const s = byName['각주']; if (s) footnote = { ps: s.paraShapeId, cs: s.charShapeId, styleId: s.id, src: '스타일 ‘각주’' }; }
  if (!footnote && ownFmt) footnote = fromFormat('footnote', scaled(GENERIC_FORMAT.roles.footnote));   // 규정에 각주 수치가 없으면 본문 모양 대신 일반 양식 각주(본문 비례)
  if (scratch.length) log?.(`서식 등록용 임시 문단 ${scratch.length}개 생성(삭제 예정)`);
  return { shapes, footnote, scratch };
}

const HEADING_ROLES = new Set(['title', 'subtitle', 'titleEn', 'subtitleEn', 'titleEn2', 'subtitleEn2', 'author', 'affiliation', 'authorEn', 'tocHead', 'toc', 'abstractHead', 'abstractEnHead', 'refHead', 'refSub', 'h1', 'h2', 'h3', 'h4', 'caption', 'dates']);
// 바탕틀 예시 문단의 표지 문구로 바꾸는 함수. 예시가 순수한 표지가 아니면(안내문 포함 등) 바꾸지 않는다
const LABEL_RE = {
  abstractHead: /^[^가-힣A-Za-z]{0,3}(국문\s*초록|국문\s*요약|초\s*록|요\s*약|국문\s*개요)[^가-힣A-Za-z]{0,3}$/,
  abstractEnHead: /^[^A-Za-z]{0,3}(Abstract|ABSTRACT|영문\s*초록)[^A-Za-z가-힣]{0,3}$/,
  refHead: /^[^가-힣A-Za-z]{0,3}(참고\s*문헌|참고\s*자료|References?)[^가-힣A-Za-z]{0,3}$/,
  tocHead: /^[^가-힣A-Za-z]{0,3}(목\s*차|차\s*례)[^가-힣A-Za-z]{0,3}$/,
};
const KW_LABEL = /^([^가-힣A-Za-z0-9]{0,3}(?:(?:(?:국문|한글|영문)\s*)?(?:주\s*제\s*어|핵\s*심\s*어|키\s*워\s*드|색\s*인\s*어|주\s*요\s*어|중\s*심\s*어)|key[\s〻]*-?[\s〻]*words?|keywords?)(?:\s*[(（][^()（）]{1,24}[)）](?=\s*[:：;；|￨]))?[\s:：;；|￨\]】〕❙」』)）]{0,4})/i;   // [keyword]·KEY WORDS 등 대소문자 무관. 꼬리는 공백·쌍점·닫는 괄호만(바탕틀 안내 문구의 숫자·마침표·여는 괄호가 섞이지 않게)
const kwLabelUsable = (l) => ((l.match(/[(（\[【〔「『<＜]/g) || []).length === (l.match(/[)）\]】〕」』>＞]/g) || []).length) && /[^가-힣A-Za-z]$/.test(l);   // 괄호 짝이 맞고 구분 기호로 끝나는 머리말만 쓴다
function relabelByTemplate(shapes, given) {
  const labels = {};
  for (const [k, v] of Object.entries(given || {})) if (typeof v === 'string' && v.length <= 16) labels[k] = v;   // 규정값 학회는 journals.js의 labels로 지정
  for (const role of Object.keys(LABEL_RE)) { if (labels[role]) continue; const s = shapes[role]?.sample; if (s && s.length <= 16 && LABEL_RE[role].test(s)) labels[role] = s; }
  for (const role of ['keywords', 'keywordsEn']) { if (labels[role]) continue; const s = shapes[role]?.sample; const m = s && KW_LABEL.exec(s); if (m && m[1].length <= 16 && kwLabelUsable(m[1])) labels[role] = m[1]; }
  const fn = (b) => {
    const want = labels[b.role]; if (!want) return null;
    const cur = (b.text || '').trim();
    if (LABEL_RE[b.role]) { if (!LABEL_RE[b.role].test(cur) || cur === want) return null; fn.count++; fn.notes.push(`${cur} → ${want}`); return want; }
    const m = KW_LABEL.exec(cur); if (!m || m[1] === want || !/[:：;；|￨〻\]】〕)）❙」』]\s*$/.test(m[1])) return null;   // 원고 머리말이 구분 기호로 끝날 때만 바꾼다
    const rest = cur.slice(m[1].length).replace(/^\s+/, ''); const sep = /\s$/.test(want) ? '' : ' ';   // 머리말 뒤 한 칸(예시에 이미 공백이 있으면 그대로)
    fn.count++; fn.notes.push(`${m[1].trim()} → ${want.trim()}`); return want + sep + rest;
  };
  fn.count = 0; fn.notes = [];
  return fn;
}

// 구역 XML의 최상위 문단(표·각주 안의 문단 제외)마다 pageBreak="1" 여부 — 인덱스는 rhwp의 getParagraphCount(0)와 같은 순서
function topLevelPageBreaks(sec) {
  const out = []; let depth = 0;
  for (const m of sec.matchAll(/<(\/?)hp:(subList|p)\b([^>]*)>/g)) {
    if (m[2] === 'subList') { depth += m[1] ? -1 : 1; continue; }
    if (m[1] || m[3].endsWith('/')) continue;
    if (depth === 0) out.push(/pageBreak="1"/.test(m[3]));
  }
  return out;
}

// ───────── 문서 생성 ─────────
const sanitize = (t) => (t || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\r\n?/g, '\n');
// 각주 원문은 공백·빈 줄까지 그대로 둔다(줄마다 각주 문단 하나). 제어 문자만 제거
const sanitizeFootnote = (t) => (t || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\r\n?/g, '\n');

export async function buildDocument({ journal, templateBytes, blocks, onLog }) {
  const t0 = performance.now();
  const steps = [];
  const log = (msg, kind = 'info') => { const e = { t: Math.round(performance.now() - t0), msg, kind }; steps.push(e); onLog?.(e); };
  const fmt = journal.format || (templateBytes ? null : GENERIC_FORMAT);

  let doc;
  if (templateBytes) { doc = new HwpDocument(templateBytes); log(`바탕틀 ‘${journal.template?.name || journal.template?.file}’ 열기 — 문단 ${doc.getParagraphCount(0)}개, ${doc.pageCount()}쪽`); }
  else { doc = HwpDocument.createEmpty(); log('바탕틀 없음 — 빈 문서 생성'); }

  // 바탕틀이 없으면 규정 용지에 빠진 값(또는 용지 전체)을 일반 양식 용지로 채운다 — 빈 문서 기본 여백으로 떨어지지 않게
  const page = !templateBytes && fmt ? { ...GENERIC_FORMAT.page, ...(fmt.page || {}) } : fmt && fmt.page;
  if (page) {
    const p = page;
    doc.setPageDef(0, JSON.stringify({ width: U.mm(p.width), height: U.mm(p.height), marginLeft: U.mm(p.left), marginRight: U.mm(p.right), marginTop: U.mm(p.top), marginBottom: U.mm(p.bottom), marginHeader: U.mm(p.header), marginFooter: U.mm(p.footer), marginGutter: U.mm(p.gutter || 0), landscape: false, binding: 0 }));
    log(`용지 설정 — ${p.width} × ${p.height} mm, 여백 위 ${p.top} · 아래 ${p.bottom} · 왼쪽 ${p.left} · 오른쪽 ${p.right} · 머리말 ${p.header} · 꼬리말 ${p.footer} mm`);
  } else {
    const pd = J(doc.getPageDef(0)) || {};
    log(`용지는 바탕틀 그대로 — ${U.hwpToMm(pd.width)} × ${U.hwpToMm(pd.height)} mm, 여백 위 ${U.hwpToMm(pd.marginTop)} · 아래 ${U.hwpToMm(pd.marginBottom)} · 왼쪽 ${U.hwpToMm(pd.marginLeft)} · 오른쪽 ${U.hwpToMm(pd.marginRight)} mm`);
  }

  const { shapes, footnote } = await resolveRoles(doc, journal, log, !!templateBytes);
  const usedRoles = [...new Set(blocks.map((b) => b.role))].filter((r) => r !== 'skip');
  for (const r of usedRoles) { if (shapes[r]) log(`역할 ‘${r}’ ← ${shapes[r].src}`); else log(`역할 ‘${r}’에 대응하는 서식이 없어 바탕글로 둠`, 'warn'); }
  if (footnote) log(`각주 서식 ← ${footnote.src}`); else log('각주 서식을 찾지 못해 본문 서식으로 둠', 'warn');

  // 본문 전부 비우기 (첫 문단의 구역·단 정의는 남는다)
  const n = doc.getParagraphCount(0);
  doc.deleteRange(0, 0, 0, n - 1, doc.getParagraphLength(0, n - 1));
  if (doc.getParagraphLength(0, 0) > 0) doc.deleteText(0, 0, 0, doc.getParagraphLength(0, 0));
  // 첫 문단에 남은 각주·표·개체 컨트롤 제거 (구역·단 정의는 남긴다)
  let leftover = 0;
  for (let guard = 0; guard < 50; guard++) {
    const left = (J(doc.getControls()) || []).filter((c) => c.list === 0 && c.ctrlId !== 'secd' && c.ctrlId !== 'cold');
    if (!left.length) break;
    const c = left[left.length - 1];
    let r = null;
    try { r = c.ctrlId === 'fn' || c.ctrlId === 'en' ? J(doc.deleteFootnote(0, c.para, c.controlIndex)) : J(doc.deleteControlAt(0, c.para, c.controlIndex)); } catch { r = null; }
    if (!r || r.ok === false) break;
    leftover++;
  }
  log(`바탕틀 본문 ${n}개 문단 비움 (용지·스타일·글꼴·각주 설정은 유지)${leftover ? ` — 남아 있던 컨트롤 ${leftover}개 제거` : ''}`);

  // ── 블록 삽입: 문단을 하나씩 API로 넣으면 문서가 커질수록 느려져(1,200문단에 150초) HWPX XML을 직접 만든다.
  //    비운 바탕틀을 HWPX로 내보내 구역 설정(secPr·colPr)만 남기고, 문단·런·각주를 XML로 써 넣은 뒤 다시 읽어 HWP로 저장한다.
  const sectionCount = doc.getSectionCount();
  const zip = await JSZip.loadAsync(doc.exportHwpx());
  doc.free();
  const enc = new TextEncoder();   // JSZip은 문자열 항목을 16K 글자 청크로 UTF-8 변환하며 보조평면 글자(겹낫표 PUA 등)의 서로게이트 쌍을 가를 수 있다 — 바이트로 넣는다
  const patchText = async (name, fn) => { const f = zip.file(name); if (!f) return; const x = await f.async('string'); const y = fn(x); if (y !== x) zip.file(name, enc.encode(y)); };
  if (sectionCount > 1) {
    // 바탕틀이 여러 구역이면 첫 구역만 남긴다. 패키지 메타(content.hpf·container.rdf·header secCnt·rhwp 표식)에서 나머지 구역 참조를 지운다.
    let removed = 0;
    for (let k = 1; k < sectionCount + 2; k++) { if (zip.file(`Contents/section${k}.xml`)) { zip.remove(`Contents/section${k}.xml`); removed++; } }
    const isExtraSection = (tag) => /section[1-9]\d*(\.xml|")/.test(tag) && !/section0(\.xml|")/.test(tag);
    const dropTags = (xml, tagNames) => xml.replace(/<[^>]+\/>/g, (tag) => (tagNames.some((t) => tag.startsWith('<' + t)) && isExtraSection(tag) ? '' : tag));
    await patchText('Contents/content.hpf', (x) => dropTags(x, ['opf:item ', 'opf:itemref ', 'item ', 'itemref ']));
    await patchText('META-INF/manifest.xml', (x) => dropTags(x, ['odf:file-entry', 'file-entry']));
    await patchText('META-INF/container.rdf', (x) => dropTags(x.replace(/<rdf:Description[^>]*section[1-9]\d*\.xml[^>]*>[\s\S]*?<\/rdf:Description>/g, ''), ['ns0:hasPart', 'hasPart']));
    const sec0 = zip.file('Contents/section0.xml') ? await zip.file('Contents/section0.xml').async('string') : '';
    let droppedBin = 0;
    for (const nm of Object.keys(zip.files).filter((k) => /^BinData\//.test(k) && !zip.files[k].dir)) {
      const base = nm.slice('BinData/'.length); const id = base.replace(/\.[^.]+$/, '');
      if (sec0.includes(base) || sec0.includes(`binaryItemIDRef="${id}"`)) continue;
      zip.remove(nm); droppedBin++;
      await patchText('Contents/content.hpf', (x) => x.replace(/<[^>]+\/>/g, (tag) => (tag.includes(`href="${nm}"`) ? '' : tag)));
    }
    if (droppedBin) log(`나머지 구역에만 쓰인 그림 ${droppedBin}개 제거`);
    await patchText('Contents/header.xml', (x) => x.replace(/secCnt="\d+"/, 'secCnt="1"'));
    await patchText('META-INF/rhwp-hwp5-origin', (x) => x.replace(/^\d+:/, '1:'));
    log(`바탕틀의 나머지 구역 ${removed}개 제거 — 첫 구역의 용지 설정으로 통일`);
  }
  let header = await zip.file('Contents/header.xml').async('string');
  let sec = await zip.file('Contents/section0.xml').async('string');
  // 바탕틀 예시 문단에 걸린 ‘쪽 나눔’(pageBreak="1", 예: 참고문헌·영문초록 제목이 새 쪽에서 시작)은 그 역할의 서식으로 따른다
  const pbGroups = new Set();
  {
    const pbRoles = [];
    // 이 시점의 sec는 이미 비운 바탕틀이므로, 원본 바탕틀을 따로 내보내 읽는다
    const tplPB = templateBytes ? await (async () => { const td = new HwpDocument(templateBytes); try { const tz = await JSZip.loadAsync(td.exportHwpx()); return topLevelPageBreaks(await tz.file('Contents/section0.xml').async('string')); } finally { td.free(); } })() : [];
    for (const [role, spec] of Object.entries((templateBytes && journal.template && journal.template.roles) || {})) {
      if (spec && spec.para !== undefined && !spec.sec && tplPB[spec.para] && shapes[role] && !/대체/.test(shapes[role].src || '')) { shapes[role].pageBreakBefore = true; pbRoles.push(role); }
    }
    // 쪽 나눔은 ‘묶음(참고문헌·영문초록 등)의 시작’에 해당한다 — 원고에 그 역할(예: 영문 제목)이 없어도 묶음의 첫 문단에서 새 쪽을 시작한다
    for (const r of pbRoles) pbGroups.add(ROLE_GROUP[r] || 'body');
    if (pbRoles.length) log(`바탕틀의 쪽 나눔을 따름 — ${pbRoles.join(', ')} (${[...pbGroups].join(', ')} 묶음 시작) 앞에서 새 쪽`);
  }
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // 글 조각 → <hp:t>; 줄바꿈(\n)은 <hp:lineBreak/>로(한글의 Shift+Enter)
  const tx = (t) => t.split('\n').map((p) => `<hp:t>${esc(p).replace(/\u00a0/g, '<hp:nbSpace/>').replace(/\u2007/g, '<hp:fwSpace/>')}</hp:t>`).join('<hp:lineBreak/>');   // 묶음 빈칸·고정폭 빈칸은 한글 요소로

  // 글자 모양 변형(굵게·기울임·밑줄·위첨자·붉은색)은 바탕 charPr을 복제해 header.xml에 추가한다
  const charPrCache = new Map();
  const charPrById = (id) => { if (!charPrCache.has(id)) charPrCache.set(id, (new RegExp(`<hh:charPr id="${id}"[^>]*>[\\s\\S]*?<\\/hh:charPr>`).exec(header) || [null])[0]); return charPrCache.get(id); };
  let nextCs = +((/<hh:charProperties itemCnt="(\d+)"/.exec(header) || [0, 0])[1]);
  const added = []; const variantCache = new Map();
  // 바탕틀의 예시 글자색(안내용 붉은색·파란색 등)은 원고에 옮기지 않는다 — 정오표의 붉은 표시만 색을 쓴다
  const baseColor = (id) => ((/textColor="([^"]*)"/.exec(charPrById(id) || '') || [null, '#000000'])[1]).toUpperCase();
  const variantCs = (base, v) => {
    const black = !v.red && baseColor(base) !== '#000000';
    const unsup = !v.superscript && /<hh:supscript\/>|<hh:subscript\/>/.test(charPrById(base) || '');   // 바탕틀 예시가 ‘*’ 같은 위첨자 글자면 원고 글에는 물려주지 않는다
    if (!v.bold && !v.italic && !v.underline && !v.superscript && !v.red && !black && !unsup) return base;
    const key = `${base}|${v.bold ? 'b' : ''}${v.italic ? 'i' : ''}${v.underline ? 'u' : ''}${v.superscript ? 's' : ''}${v.red ? 'r' : ''}${black ? 'k' : ''}${unsup ? 'n' : ''}`;
    if (variantCache.has(key)) return variantCache.get(key);
    const src = charPrById(base); if (!src) return base;
    let x = src.replace(/id="\d+"/, `id="${nextCs}"`);
    if (v.red) x = x.replace(/textColor="[^"]*"/, 'textColor="#FF0000"');
    else if (black) x = x.replace(/textColor="[^"]*"/, 'textColor="#000000"');
    if (v.bold && !/<hh:bold\/>/.test(x)) x = x.replace(/<hh:underline/, '<hh:bold/><hh:underline');
    if (v.italic && !/<hh:italic\/>/.test(x)) x = x.replace(/<hh:underline/, '<hh:italic/><hh:underline');
    if (v.underline) x = x.replace(/<hh:underline type="[^"]*"/, '<hh:underline type="BOTTOM"');
    if (v.superscript && !/<hh:supscript\/>/.test(x)) x = x.replace(/<\/hh:charPr>/, '<hh:supscript/></hh:charPr>');
    if (unsup) x = x.replace(/<hh:supscript\/>|<hh:subscript\/>/g, '');
    added.push(x); variantCache.set(key, nextCs);
    return nextCs++;
  };

  // 각주 번호 꼴은 바탕틀 구역 설정을 따른다
  const fnFmt = (/<hp:footNotePr>\s*(<hp:autoNumFormat[^>]*\/>)/.exec(sec) || [null, '<hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/>'])[1];
  const suffixChar = (/suffixChar="([^"]*)"/.exec(fnFmt) || [null, ')'])[1];
  const suffixCode = suffixChar ? suffixChar.charCodeAt(0) : 0;
  const fnShape = footnote || shapes.body || { ps: 0, cs: 0 };

  let pid = 1; let fnCount = 0; let fnNum = 0; let runCount = 0; let charCount = 0; let redParas = 0; let redFns = 0; let objLost = 0;
  const roleCount = {};
  // 표·그림: 원고 자원(같은 원고면 같은 객체)마다 옮겨 심는 도구를 하나씩 만든다
  const pageW = (() => {
    const pm = /<hp:pagePr\b[^>]*?landscape="(\w+)"[^>]*?width="(\d+)"[^>]*?height="(\d+)"/.exec(sec); const mm = /<hp:margin\b[^>]*\/>/.exec(sec);
    if (!pm || !mm) return 0;
    const at = (k) => +((new RegExp(`${k}="(\\d+)"`).exec(mm[0]) || [0, 0])[1]);
    const cols = +((/<hp:colPr\b[^>]*colCount="(\d+)"/.exec(sec) || [0, 1])[1]) || 1;
    const gap = +((/<hp:colPr\b[^>]*sameGap="(\d+)"/.exec(sec) || [0, 0])[1]) || 0;
    const w = (pm[1] === 'NARROWLY' ? +pm[3] : +pm[2]) - at('left') - at('right') - at('gutter');
    return Math.max(0, Math.floor((w - gap * (cols - 1)) / cols));
  })();
  const importers = new Map();
  const bodyFontRef = (() => { const x = charPrById(shapes.body ? shapes.body.cs : 0) || ''; const m = /<hh:fontRef\b[^>]*\/>/.exec(x); return m ? m[0] : null; })();
  const importerFor = (res) => {
    if (!res) return null;
    if (!importers.has(res)) importers.set(res, makeImporter({ header, src: res, textWidth: pageW, captionShape: shapes.caption || null, bodyFontRef,
      allocCharPr: (xml) => { const id = nextCs++; added.push(xml.replace(/ id="\d+"/, ` id="${id}"`)); return id; }, nextPid: () => pid++ }));
    return importers.get(res);
  };

  // 각주: 문단 배열(paras: [{ text, runs }])을 그대로 문단으로, 문단 안 줄바꿈은 lineBreak로 쓴다. 번호 없는 각주(사사·소속)는 번호를 세지 않고, 원고의 ‘새 번호 지정’은 newNum으로 보존한다
  const makeFootnote = (f) => {
    fnCount++;
    const red = f.flag === 'red'; if (red) redFns++;
    let prefix = '';
    if (Number.isInteger(f.restart) && f.restart > 0) { fnNum = f.restart - 1; prefix = `<hp:ctrl><hp:newNum num="${f.restart}" numType="FOOTNOTE"/></hp:ctrl>`; }
    if (!f.noNumber) fnNum++;
    const paras = (Array.isArray(f.paras) && f.paras.length) ? f.paras.map((q) => ({ text: sanitizeFootnote(q.text), runs: q.runs || [] })) : sanitizeFootnote(f.text).split('\n').map((t) => ({ text: t, runs: [] }));
    const xml = paras.map((q, i) => {
      let segs = [];
      if (q.text && q.runs.length) {
        let off = 0; for (const r of q.runs) { const len = sanitizeFootnote(r.text).length; if (!len) continue; segs.push({ s: off, e: off + len, v: { bold: !!r.bold, italic: !!r.italic, underline: !!r.underline, superscript: !!r.superscript, red } }); off += len; }
        if (off !== q.text.length) segs = []; else runCount += segs.filter((g) => g.v.bold || g.v.italic || g.v.underline || g.v.superscript).length;
      }
      if (!segs.length) segs = [{ s: 0, e: q.text.length, v: { red } }];
      const num = i === (f.numAt ?? 0) && !f.noNumber ? `<hp:ctrl><hp:autoNum num="${fnNum}" numType="FOOTNOTE">${fnFmt}</hp:autoNum></hp:ctrl>` : '';   // 원고에서 번호가 둘째 문단에 있던 각주(‘*’ 표시 뒤 번호)는 그 자리에
      const runs = segs.map((g, k) => `<hp:run charPrIDRef="${variantCs(fnShape.cs, g.v)}">${k === 0 ? num : ''}${tx(q.text.slice(g.s, g.e))}</hp:run>`).join('');
      return `<hp:p id="${pid++}" paraPrIDRef="${fnShape.ps}" styleIDRef="${fnShape.styleId ?? 0}" pageBreak="0" columnBreak="0" merged="0">${runs}</hp:p>`;
    }).join('');
    return `${prefix}<hp:ctrl><hp:footNote number="${f.noNumber ? fnNum + 1 : fnNum}" suffixChar="${suffixCode}" instId="${fnCount}"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="TOP" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">${xml}</hp:subList></hp:footNote></hp:ctrl>`;
  };
  // 한 블록의 런 XML: 강조 런 경계와 각주 위치에서 <hp:t>를 나눈다
  const runsXml = (b, text, cs) => {
    const red = b.flag === 'red';
    let segs = [];
    if (text && b.runs && b.runs.length) {
      const headingRole = HEADING_ROLES.has(b.role);   // 제목·장 제목·표지 문단의 굵기는 학회 서식이 정한다(원고에서 제목을 굵게 썼어도 따르지 않음)
      let off = 0; for (const r of b.runs) { const len = sanitize(r.text).length; if (!len) continue; segs.push({ s: off, e: off + len, v: { bold: !headingRole && !!r.bold, italic: !!r.italic, underline: !!r.underline, superscript: !!r.superscript, red } }); off += len; }
      if (off !== text.length) segs = [];                       // 런 길이와 본문 길이가 어긋나면 강조는 버린다
      else runCount += segs.filter((s) => s.v.bold || s.v.italic || s.v.underline || s.v.superscript).length;
    }
    if (!segs.length) segs = [{ s: 0, e: text.length, v: { red } }];
    const sh0 = shapes[b.role]; const kmL = sh0 && sh0.valueCs !== undefined && /^keywords/.test(b.role) ? KW_LABEL.exec(text) : null; const L = kmL ? kmL[1].length : -1;   // 주제어 머리말 뒤는 값 글자 모양
    if (L > 0 && L < text.length) segs = segs.flatMap((g) => (g.s < L && g.e > L ? [{ ...g, e: L }, { ...g, s: L }] : [g]));
    const csAt = (s) => (sh0 && sh0.valueCs !== undefined && /^keywords/.test(b.role) && (L <= 0 || s >= L) ? sh0.valueCs : cs);
    // 글 사이에 넣을 것: 각주와 표·그림. 개체 안 각주(objId)는 개체를 넣을 때 그 안 제자리에 넣는다(개체를 못 옮기면 개체 자리의 본문 각주로)
    const at = (o) => Math.max(0, Math.min(text.length, o.offset ?? text.length));
    const objs = (b.objects || []).map((o) => ({ o, imp: importerFor(o.res) }));
    const placed = new Set(objs.filter((x) => x.imp).map((x) => x.o.id));
    const fnItems = (b.footnotes || []).filter((f) => !(f.objId && placed.has(f.objId))).map((f) => ({ f, at: at(f) }));
    const objItems = objs.filter((x) => x.imp).map((x) => ({ obj: x.o, imp: x.imp, at: at(x.o) }));
    const fns = [...fnItems, ...objItems].map((it, k) => ({ ...it, k })).sort((a, c) => a.at - c.at || (a.obj ? 1 : 0) - (c.obj ? 1 : 0) || a.k - c.k);
    if (objs.some((x) => !x.imp)) objLost += objs.filter((x) => !x.imp).length;
    // 글자처럼 한 줄에 나란히 놓인 개체(그림 두 장 등)는 합친 폭이 판면을 넘지 않게 폭을 나눠 준다(원고처럼 나란히 — 한글은 넘치면 줄을 바꿔 위아래로 쌓는다)
    const inlineW = (o) => (/<hp:pos\b[^>]*treatAsChar="1"/.test(o.xml) && o.info ? o.info.width + (+((/<hp:outMargin left="(\d+)" right="(\d+)"/.exec(o.xml) || [0, 0, 0]).slice(1).reduce((a, v) => a + +v, 0))) : 0);
    const inl = objItems.map((it) => inlineW(it.obj)); const inlSum = inl.reduce((a, v) => a + v, 0);
    const share = inl.filter((v) => v > 0).length > 1 && pageW && inlSum > pageW * 0.98 ? (o) => Math.floor(pageW * 0.94 * inlineW(o) / inlSum) : () => 0;
    const place = (it) => {
      if (!it.obj) return makeFootnote(it.f);
      const inner = (b.footnotes || []).filter((f) => f.objId === it.obj.id && !f.objCaption);
      const capFns = (b.footnotes || []).filter((f) => f.objId === it.obj.id && f.objCaption);   // 캡션 안 각주는 개체 바로 뒤(같은 문단)에 — 한글은 캡션 안 각주를 쪽 아래에 찍지 않는다
      const x = it.imp.importObject(it.obj, (k) => (inner[k] ? makeFootnote(inner[k]) : ''), share(it.obj)) + capFns.map(makeFootnote).join('');
      return !text && it.obj.tag !== 'tbl' ? x + '<hp:t> </hp:t>' : x;   // 글 없는 문단에 그림만 있으면 rhwp가 그 줄을 그리지 않는다 — 빈칸 한 글자를 둔다(가운데 정렬에서 끝 빈칸은 자리를 차지하지 않음)
    };
    let out = ''; let fi = 0;
    for (const sg of segs) {
      let x = `<hp:run charPrIDRef="${variantCs(csAt(sg.s), sg.v)}">`; let pos = sg.s;
      while (fi < fns.length && fns[fi].at <= sg.e && (fns[fi].at < sg.e || sg === segs[segs.length - 1])) { x += `${tx(text.slice(pos, fns[fi].at))}${place(fns[fi])}`; pos = fns[fi].at; fi++; }
      x += `${tx(text.slice(pos, sg.e))}</hp:run>`;
      out += x;
    }
    while (fi < fns.length) { out += `<hp:run charPrIDRef="${cs}"><hp:t></hp:t>${place(fns[fi])}<hp:t></hp:t></hp:run>`; fi++; }
    if (!text && !fns.length) out = `<hp:run charPrIDRef="${cs}"><hp:t></hp:t></hp:run>`;
    return out;
  };
  // 표지 문구(＜국문초록＞·Abstract·참고문헌·목차)와 주제어 머리말(‘주제어:’)은 바탕틀 예시의 표기(❙국문초록❙, [주제어] …)를 따른다 — 학회마다 괄호·기호가 달라 접수 요건이 되기도 한다
  const relabel = relabelByTemplate(shapes, { ...(journal.tocLabel ? { tocHead: journal.tocLabel } : {}), ...(journal.labels || {}) });
  blocks = blocks.map((b) => {
    const t = relabel(b); if (t === null) return b;
    const old = b.text || ''; let k = 0; while (k < t.length && k < old.length && t[t.length - 1 - k] === old[old.length - 1 - k]) k++;   // 바뀐 것은 앞머리뿐이므로 공통 꼬리를 기준으로 런·각주를 옮긴다
    const cutOld = old.length - k, cutNew = t.length - k;
    const runs = []; let off = 0; for (const r of b.runs || []) { const s0 = Math.max(off, cutOld), e0 = off + r.text.length; if (e0 > s0) runs.push({ ...r, text: old.slice(s0, e0) }); off = e0; }
    if (cutNew) runs.unshift({ text: t.slice(0, cutNew) });
    const okRuns = (b.runs || []).length > 0 && runs.reduce((a, r) => a + r.text.length, 0) === t.length;
    const mv = (x) => { const o = x.offset ?? old.length; return { ...x, offset: o >= cutOld ? o - cutOld + cutNew : Math.min(o, cutNew) }; };
    return { ...b, text: t, runs: okRuns ? runs : [], footnotes: (b.footnotes || []).map(mv), ...(b.objects ? { objects: b.objects.map(mv) } : {}) };
  });
  if (relabel.count) log(`표지 문구를 바탕틀대로 — ${relabel.notes.slice(0, 4).join(', ')}${relabel.count > 4 ? ` 외 ${relabel.count - 4}곳` : ''}`);
  const bodyParas = [];
  let firstAttrs = null; let firstRuns = null; let prevGroup = null;
  for (const b of blocks) {
    if (b.role === 'skip') continue;
    const group = b.role === 'blank' || (FLOAT_ROLES.has(b.role) && prevGroup) ? prevGroup : (ROLE_GROUP[b.role] || 'body');   // 표·그림·캡션은 놓인 자리의 묶음(새 쪽을 열지 않음)
    const groupStart = b.role !== 'blank' && group !== prevGroup && pbGroups.has(group) && prevGroup !== null;
    if (b.role !== 'blank') prevGroup = group;
    const text = b.role === 'blank' ? '' : sanitize(b.text);
    charCount += text.length;
    const sh = shapes[b.role] || shapes.body || { ps: 0, cs: 0 };
    if (b.flag === 'red' && text) redParas++;
    const attrs = `paraPrIDRef="${sh.ps}" styleIDRef="${sh.styleId ?? 0}" pageBreak="${b.pageBreakBefore || groupStart || (sh.pageBreakBefore && group === 'body') ? 1 : 0}" columnBreak="0" merged="0"`;
    const runs = runsXml(b, text, sh.cs);
    roleCount[b.role] = (roleCount[b.role] || 0) + 1;
    if (firstAttrs === null) { firstAttrs = attrs; firstRuns = runs; continue; }
    bodyParas.push(`<hp:p id="${pid++}" ${attrs}>${runs}</hp:p>`);
  }
  // 첫 문단: 바탕틀의 구역·단 정의 런은 남기고 글 런만 우리 것으로 바꾼다
  // 첫 문단 안에 머리말·꼬리말 같은 조종 문자가 남아 있으면 그 안에 문단·런이 한 겹 더 있다 — 끝 태그를 깊이로 찾는다(가장 가까운 끝 태그로 자르면 XML이 깨져 문단이 사라진다)
  const elementEnd = (xml, start, tag) => { const re = new RegExp(`<(/?)hp:${tag}\\b[^>]*?(/?)>`, 'g'); re.lastIndex = start; let depth = 0, m; while ((m = re.exec(xml))) { if (m[2]) continue; depth += m[1] ? -1 : 1; if (depth === 0) return re.lastIndex; } return -1; };
  const topLevel = (xml, tag) => { const out = []; const re = new RegExp(`<hp:${tag}\\b`, 'g'); let m; while ((m = re.exec(xml))) { const e = elementEnd(xml, m.index, tag); if (e < 0) break; out.push(xml.slice(m.index, e)); re.lastIndex = e; } return out; };
  const pStart = sec.search(/<hp:p\b/); const pEnd = pStart >= 0 ? elementEnd(sec, pStart, 'p') : -1;
  if (pStart < 0 || pEnd < 0) throw new Error('바탕틀 구역에서 첫 문단을 찾지 못했습니다');
  const pm = { index: pStart };
  const firstP = sec.slice(pStart, pEnd);
  const ctrlRuns = topLevel(firstP.slice(firstP.indexOf('>') + 1), 'run').filter((r) => /<hp:secPr|<hp:ctrl>/.test(r)).map((r) => r.replace(/<hp:t>[\s\S]*?<\/hp:t>/g, ''));
  const newFirst = `<hp:p id="0" ${firstAttrs || 'paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"'}>${ctrlRuns.join('')}${firstRuns || ''}</hp:p>`;
  // 첫 문단 뒤에 남아 있을 수 있는 문단(비운 바탕틀의 잔여)은 버린다
  sec = sec.slice(0, pm.index) + newFirst + bodyParas.join('') + sec.slice(sec.lastIndexOf('</hs:sec>'));
  // 표·그림이 쓰는 문단 모양·테두리·탭·번호 목록과 그림 파일
  const objStats = { objects: 0, tables: 0, pictures: 0, shapes: 0, scaled: 0, moved: 0, footnotes: 0, bins: 0 };
  for (const imp of importers.values()) {
    header = imp.applyHeader(header);
    for (const [k, v] of Object.entries(imp.stats)) objStats[k] += v;
    for (const bf of imp.bins) { zip.file(bf.path, bf.bytes); objStats.bins++; }
    if (imp.bins.length) await patchText('Contents/content.hpf', (x) => imp.applyManifest(x));
  }
  if (added.length) header = header.replace(/<hh:charProperties itemCnt="\d+"/, () => `<hh:charProperties itemCnt="${nextCs}"`).replace(/<\/hh:charProperties>/, () => `${added.join('')}</hh:charProperties>`);
  zip.file('Contents/section0.xml', enc.encode(sec));
  zip.file('Contents/header.xml', enc.encode(header));
  const roleSummary = Object.entries(roleCount).map(([k, v]) => `${k} ${v}`).join(', ');
  log(`문단 ${Object.values(roleCount).reduce((a, b) => a + b, 0)}개 작성 — ${roleSummary}`);
  if (runCount) log(`강조 서식(굵게·기울임 등) ${runCount}곳 유지`);
  if (fnCount) log(`각주 ${fnCount}개 삽입${footnote ? ` (각주 서식 ← ${footnote.src})` : ''}`);
  if (redParas || redFns) log(`정오표 표시 — 참고문헌 ${redParas}개, 각주 ${redFns}개 붉게`);
  if (objStats.objects) log(`표 ${objStats.tables}개·그림 ${objStats.pictures}개${objStats.shapes ? `·도형 ${objStats.shapes}개` : ''} 옮김${objStats.bins ? ` (그림 파일 ${objStats.bins}개)` : ''}${objStats.footnotes ? ` — 안의 각주 ${objStats.footnotes}개는 본문 각주와 번호를 이어 매김` : ''}${objStats.scaled ? ` — 판면보다 넓은 ${objStats.scaled}개는 폭을 줄임` : ''}${objStats.moved ? ` — 쪽 기준으로 떠 있던 ${objStats.moved}개는 문단 기준으로 옮김` : ''}`);
  if (objLost) log(`표·그림 ${objLost}개는 원고 자원을 찾지 못해 옮기지 못함(안의 각주는 그 자리 본문 각주로)`, 'warn');
  const hwpxBytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

  const doc2 = new HwpDocument(hwpxBytes);
  // 직접 만든 HWPX에는 줄 배치(linesegarray) 정보가 없다. 저장 전에 엔진이 줄을 다시 흘려 넣어야 각주 영역이 본문과 겹치지 않는다.
  const reflowed = reflow(doc2);
  if (reflowed !== null) log(`줄 배치 계산 — 문단 ${reflowed}개`);
  const rep = doc2.exportHwpWithReport();
  const loss = J(rep.contentLoss()) || {};
  const hwp = rep.takeBytes();
  const hwpx = doc2.exportHwpx();
  doc2.free();
  if (loss.count) log(`저장 중 손실 보고 ${loss.count}건: ${JSON.stringify(loss.losses).slice(0, 300)}`, 'warn');
  const out = new HwpDocument(hwp);
  reflow(out);
  const pages = out.pageCount();
  log(`저장 완료 — HWP ${(hwp.length / 1024).toFixed(0)} KB, HWPX ${(hwpx.length / 1024).toFixed(0)} KB, ${pages}쪽, 글자 ${charCount.toLocaleString()}자`, 'ok');
  return { hwp, hwpx, pages, steps, doc: out, stats: { chars: charCount, footnotes: fnCount, paragraphs: Object.values(roleCount).reduce((a, b) => a + b, 0) }, elapsed: Math.round(performance.now() - t0) };
}
