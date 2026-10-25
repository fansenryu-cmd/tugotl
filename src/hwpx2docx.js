// 투고틀 산출 HWPX → Word(DOCX). 한글 산출물과 같은 서식(용지·여백·글꼴·크기·장평·자간·줄 간격·들여쓰기·정렬·쪽 나눔),
// 각주(번호 꼴·번호 없는 각주·각주 안 문단), 표(칸 합치기·테두리·음영·칸 속 표), 그림을 Word 문서로 옮긴다. 브라우저·노드 공용.
//
// 단위: HWPX 글자 크기 height는 1/100pt. 문단 여백은 hp:switch의 ‘글자 단위’ 갈래(hp:case)가 1pt=100, 기본 갈래(hp:default·갈래 없음)가 1pt=200.
// 용지·표·그림 크기는 HWPUNIT(1인치=7200) → Word twip(1인치=1440)은 ÷5, EMU(1인치=914400)는 ×127.
// 줄 간격: 한글 ‘비율 n%’는 글자 크기의 n% 줄 높이 → Word ‘최소 n%×크기’(atLeast)로(글꼴의 기본 줄 높이보다 작으면 Word가 늘림).
import JSZip from 'jszip';

// ───────── 작은 XML 해석기(요소·속성·글) ─────────
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unesc = (s) => s.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e] ?? m));
export function parseXml(src) {
  const root = { name: '#root', attrs: {}, children: [] }; const stack = [root];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) top.children.push({ name: '#text', text: m[1] });
    else if (m[2]) { if (stack.length > 1) stack.pop(); }
    else if (m[3]) {
      const attrs = {}; for (const a of m[4].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = unesc(a[2] ?? a[3] ?? '');
      const el = { name: m[3], attrs, children: [] }; top.children.push(el);
      if (!m[5]) stack.push(el);
    } else if (m[6] !== undefined && m[0][0] !== '<') top.children.push({ name: '#text', text: unesc(m[6]) });
  }
  return root;
}
const kids = (n, name) => (n ? n.children.filter((c) => c.name === name) : []);
const kid = (n, name) => (n ? n.children.find((c) => c.name === name) : null);
const find = (n, name) => { if (!n) return null; for (const c of n.children || []) { if (c.name === name) return c; const f = find(c, name); if (f) return f; } return null; };
const num = (v, d = 0) => { const x = +v; return Number.isFinite(x) ? x : d; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const twip = (hu) => Math.round(num(hu) / 5);   // HWPUNIT → twip
const emu = (hu) => Math.round(num(hu) * 127);   // HWPUNIT → EMU

// ───────── header.xml: 글꼴·글자 모양·문단 모양·테두리 ─────────
function readHeader(xml) {
  const doc = parseXml(xml);
  const fonts = {};
  for (const ff of kids(find(doc, 'hh:fontfaces'), 'hh:fontface')) fonts[ff.attrs.lang] = Object.fromEntries(kids(ff, 'hh:font').map((f) => [f.attrs.id, f.attrs.face]));
  const chars = {};
  for (const c of kids(find(doc, 'hh:charProperties'), 'hh:charPr')) {
    const fr = kid(c, 'hh:fontRef')?.attrs || {}; const ra = kid(c, 'hh:ratio')?.attrs || {}; const sp = kid(c, 'hh:spacing')?.attrs || {};
    const ul = kid(c, 'hh:underline')?.attrs || {}; const so = kid(c, 'hh:strikeout')?.attrs || {};
    chars[c.attrs.id] = {
      size: num(c.attrs.height, 1000) / 100, color: c.attrs.textColor && c.attrs.textColor !== '#000000' ? c.attrs.textColor.slice(1) : null,
      hangul: fonts.HANGUL?.[fr.hangul] || null, latin: fonts.LATIN?.[fr.latin] || fonts.HANGUL?.[fr.hangul] || null,
      ratio: num(ra.hangul, 100), spacing: num(sp.hangul, 0),
      bold: !!kid(c, 'hh:bold'), italic: !!kid(c, 'hh:italic'), underline: ul.type && ul.type !== 'NONE', strike: so.shape && so.shape !== 'NONE',
      sup: !!kid(c, 'hh:supscript'), sub: !!kid(c, 'hh:subscript'),
    };
  }
  const paras = {};
  for (const p of kids(find(doc, 'hh:paraProperties'), 'hh:paraPr')) {
    const sw = kid(p, 'hp:switch'); const cs = sw ? kid(sw, 'hp:case') : null;
    const branch = cs || (sw ? kid(sw, 'hp:default') : p); const per = cs ? 100 : 200;   // 글자 단위 갈래 1pt=100, 기본 갈래 1pt=200
    const mg = kid(branch, 'hh:margin'); const ls = kid(branch, 'hh:lineSpacing')?.attrs || kid(p, 'hh:lineSpacing')?.attrs || {};
    const v = (k) => num(kid(mg, k)?.attrs.value, 0) / per;
    const bs = kid(p, 'hh:breakSetting')?.attrs || {};
    paras[p.attrs.id] = {
      align: kid(p, 'hh:align')?.attrs.horizontal || 'JUSTIFY', indent: v('hc:intent'), left: v('hc:left'), right: v('hc:right'), before: v('hc:prev'), after: v('hc:next'),
      lsType: ls.type || 'PERCENT', lsValue: num(ls.value, 160) / (ls.type && ls.type !== 'PERCENT' ? per : 1),
      pageBreakBefore: bs.pageBreakBefore === '1', keepNext: bs.keepWithNext === '1', keepLines: bs.keepLines === '1',
      autoEng: kid(p, 'hh:autoSpacing')?.attrs.eAsianEng === '1', autoNum: kid(p, 'hh:autoSpacing')?.attrs.eAsianNum === '1',   // 한글·영문/숫자 사이 자동 간격
    };
  }
  const borders = {};
  for (const b of kids(find(doc, 'hh:borderFills'), 'hh:borderFill')) {
    const side = (k) => { const a = kid(b, k)?.attrs || {}; return a.type && a.type !== 'NONE' ? { type: a.type, width: parseFloat(a.width) || 0.12, color: (a.color || '#000000').replace('#', '') } : null; };
    const fill = find(b, 'hc:winBrush')?.attrs.faceColor;
    borders[b.attrs.id] = { left: side('hh:leftBorder'), right: side('hh:rightBorder'), top: side('hh:topBorder'), bottom: side('hh:bottomBorder'), fill: fill && fill !== 'none' && !/^#?FFFFFF$/i.test(fill) ? fill.replace('#', '') : null };
  }
  return { fonts, chars, paras, borders };
}

// ───────── 글자·문단 속성 → Word ─────────
// 쓴 글꼴(글꼴 표에 계열·문자 집합을 적어 없는 글꼴을 Word가 같은 계열로 대체하게)
const USED_FONTS = new Set();
const isSans = (f) => /고딕|돋움|굴림|gothic|dotum|gulim|sans|arial|helvetica|맑은|malgun|나눔고딕|견출|헤드라인|HY견|HY헤드|윤고딕|-윤고딕|산돌고딕|KoPub돋움|Pretendard|Noto Sans|Spoqa|Myriad|Segoe|Verdana|Tahoma|Calibri/i.test(f);
const isKorean = (f) => /[가-힣]/.test(f) || /batang|dotum|gulim|gungsuh|malgun|nanum|kopub|hcr|haansoft|hy[a-z]/i.test(f);
export function fontTableXml() {
  const items = [...USED_FONTS].filter(Boolean).map((f) => {
    const sans = isSans(f); const ko = isKorean(f);
    const alt = ko ? (sans ? '돋움' : '바탕') : (sans ? 'Arial' : 'Times New Roman');
    // PANOSE: Word는 없는 글꼴을 PANOSE가 가까운 글꼴로 바꾼다(대체 이름만으로는 Calibri로 떨어짐) — 바탕·돋움·Times New Roman·Arial의 값
    const panose = ko ? (sans ? '020B0600000101010101' : '02030600000101010101') : (sans ? '020B0604020202020204' : '02020603050405020304');
    return `<w:font w:name="${esc(f)}"><w:altName w:val="${alt}"/><w:panose1 w:val="${panose}"/><w:charset w:val="${ko ? '81' : '00'}"/><w:family w:val="${sans ? 'swiss' : 'roman'}"/><w:pitch w:val="variable"/></w:font>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${items.join('')}</w:fonts>`;
}
const JC = { JUSTIFY: 'both', LEFT: 'left', RIGHT: 'right', CENTER: 'center', DISTRIBUTE: 'distribute', DISTRIBUTE_SPACE: 'distribute' };
function rPr(c, extra = '') {
  if (!c) return extra ? `<w:rPr>${extra}</w:rPr>` : '';
  const f = []; const ea = c.hangul || c.latin; const la = c.latin || c.hangul;
  if (ea || la) { USED_FONTS.add(la); USED_FONTS.add(ea); f.push(`<w:rFonts w:ascii="${esc(la)}" w:hAnsi="${esc(la)}" w:eastAsia="${esc(ea)}" w:cs="${esc(la)}" w:hint="eastAsia"/>`); }
  if (c.bold) f.push('<w:b/><w:bCs/>'); if (c.italic) f.push('<w:i/><w:iCs/>'); if (c.strike) f.push('<w:strike/>');
  if (c.color) f.push(`<w:color w:val="${c.color}"/>`);
  if (c.spacing) f.push(`<w:spacing w:val="${Math.round(c.size * c.spacing / 100 * 20)}"/>`);   // 자간 %(글자 크기 대비) → twip
  // Word 글자 크기는 0.5pt 단위뿐이라(10.3pt → 10.5pt) 반올림으로 넓어진 폭을 장평으로 되돌린다(10.3pt·장평 95% → 10.5pt·장평 93%)
  const half = Math.max(1, Math.round(c.size * 2)); const ratio = Math.round((c.ratio || 100) * (c.size * 2) / half);
  if (ratio !== 100) f.push(`<w:w w:val="${Math.max(1, Math.min(600, ratio))}"/>`);
  f.push(`<w:sz w:val="${half}"/><w:szCs w:val="${half}"/>`);
  if (c.underline) f.push('<w:u w:val="single"/>');
  if (c.sup) f.push('<w:vertAlign w:val="superscript"/>'); else if (c.sub) f.push('<w:vertAlign w:val="subscript"/>');
  return `<w:rPr>${f.join('')}${extra}<w:lang w:val="en-US" w:eastAsia="ko-KR"/></w:rPr>`;   // 덧붙임(vertAlign 등)은 lang 앞(요소 순서)
}
function pPr(p, size, { pageBreak = false, keepNext = false, style = '', extraBefore = 0, exact = true } = {}) {
  if (!p) return style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : '';
  const f = []; if (style) f.push(`<w:pStyle w:val="${style}"/>`);
  if (keepNext || p.keepNext) f.push('<w:keepNext/>'); if (p.keepLines) f.push('<w:keepLines/>');
  if (pageBreak || p.pageBreakBefore) f.push('<w:pageBreakBefore/>');
  // 한글·영문/숫자 사이 자동 간격: Word는 기본으로 켜져 있고 한글 양식은 대개 꺼져 있다. (Word가 한국어를 어절 단위로만 나누는 것은 문서 설정으로 바꿀 수 없다 — 쪽 수 차이의 주 원인)
  f.push(`<w:autoSpaceDE w:val="${p.autoEng ? 1 : 0}"/><w:autoSpaceDN w:val="${p.autoNum ? 1 : 0}"/>`);
  const tw = (pt) => Math.round(pt * 20);
  let line;
  // 한글의 비율 줄 간격은 글자 크기 기준이라 글꼴 고유 줄 높이보다 작아질 수 있다(바탕 9pt·132% = 11.9pt). Word의 ‘최소’는 글꼴 고유 높이 아래로 못 내려가므로
  // 글 문단은 ‘고정’으로, 그림이 든 문단만 ‘최소’로(고정이면 그림이 잘린다)
  if (p.lsType === 'PERCENT') line = `w:line="${Math.max(tw(size * p.lsValue / 100), 1)}" w:lineRule="${exact ? 'exact' : 'atLeast'}"`;
  else if (p.lsType === 'FIXED') line = `w:line="${tw(p.lsValue)}" w:lineRule="exact"`;
  else if (p.lsType === 'AT_LEAST') line = `w:line="${tw(p.lsValue)}" w:lineRule="atLeast"`;
  else line = `w:line="${tw(size * 1.6)}" w:lineRule="atLeast"`;   // 줄 사이(BETWEEN_LINES) 등은 근사
  f.push(`<w:spacing w:before="${tw(p.before + extraBefore)}" w:after="${tw(p.after)}" ${line}/>`);
  // 들여쓰기(+)는 첫 줄, 내어쓰기(−)는 왼쪽 여백 그대로 두고 다음 줄만 미는 한글식 → Word: 왼쪽 = 여백 + 내어쓰기, hanging = 내어쓰기
  const left = p.indent < 0 ? p.left + -p.indent : p.left;
  const first = p.indent > 0 ? ` w:firstLine="${tw(p.indent)}"` : p.indent < 0 ? ` w:hanging="${tw(-p.indent)}"` : '';
  f.push(`<w:ind w:left="${tw(left)}" w:right="${tw(p.right)}"${first}/>`);
  f.push(`<w:jc w:val="${JC[p.align] || 'both'}"/>`);
  return `<w:pPr>${f.join('')}</w:pPr>`;
}

// ───────── 본문·각주·표·그림 ─────────
export async function hwpxToDocx(hwpxBytes, opts = {}) {
  USED_FONTS.clear();
  const zin = await JSZip.loadAsync(hwpxBytes);
  const H = readHeader(await zin.file('Contents/header.xml').async('string'));
  const hpf = zin.file('Contents/content.hpf') ? await zin.file('Contents/content.hpf').async('string') : '';
  const binHref = {}; for (const m of hpf.matchAll(/<opf:item\b[^>]*>/g)) { const id = /\bid="([^"]+)"/.exec(m[0]); const href = /\bhref="([^"]+)"/.exec(m[0]); if (id && href) binHref[id[1]] = href[1]; }
  const secNames = Object.keys(zin.files).filter((k) => /^Contents\/section\d+\.xml$/.test(k)).sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0]);
  const warn = []; const media = []; const footnotes = []; let fnSuffix = ')';
  let noteSp = { above: 8.5, below: 5.67, between: 2.83 };
  let noteLine = { length: -1, width: 0.12, color: '000000', type: 'SOLID' };   // 각주 구분선(한글 길이 코드: −1 5cm · −2 2cm · −3 단의 1/3 · −4 단 전체 · 양수 HWPUNIT)   // 구분선 위·아래·각주 사이(pt) — 구역 각주 모양에서 읽는다(HWPUNIT ÷100)
  let drawId = 1; let pageNumber = null; let sectPr = '';

  // 글 런: hp:t 안의 글과 탭·줄바꿈·묶음 빈칸.
  // 빈칸 너비: 한글은 글꼴의 빈칸 대신 글자 크기의 절반쯤인 자체 빈칸을 쓰고(charPr useFontSpace="0") Word는 글꼴 빈칸(약 0.3em)을 쓴다.
  // 그대로 두면 Word가 한 줄에 7%쯤 더 넣어 쪽 수가 줄어든다(실측: 한컴바탕 10pt 빈칸 한글 5.9pt·Word 3.1pt) → 빈칸 런에만 자간을 더한다
  const spaceEm = opts.spaceEm ?? 0.17;   // 실측: 한글 빈칸 약 0.5em(문단 끝 줄), Word 글꼴 빈칸 0.30~0.33em
  const textRuns = (t, rp, cp) => {
    let out = ''; let buf = '';
    const spRp = cp && spaceEm ? rPr({ ...cp, spacing: (cp.spacing || 0) + spaceEm * 100 }) : rp;
    const flush = () => {
      if (!buf) return;
      for (const part of spRp === rp ? [buf] : buf.split(/( +)/)) { if (!part) continue; out += `<w:r>${part[0] === ' ' ? spRp : rp}<w:t xml:space="preserve">${esc(part)}</w:t></w:r>`; }
      buf = '';
    };
    for (const c of t.children) {
      if (c.name === '#text') buf += c.text;
      else if (c.name === 'hp:tab') { flush(); out += `<w:r>${rp}<w:tab/></w:r>`; }
      else if (c.name === 'hp:lineBreak') { flush(); out += `<w:r>${rp}<w:br/></w:r>`; }
      else if (c.name === 'hp:nbSpace') buf += ' ';
      else if (c.name === 'hp:fwSpace') buf += '　';
      else if (c.name === 'hp:hyphen') buf += '-';
    }
    flush(); return out;
  };

  const picXml = async (pic) => {
    const img = find(pic, 'hc:img'); const ref = img?.attrs.binaryItemIDRef; const href = ref && binHref[ref];
    const f = href && zin.file(href.startsWith('Contents/') || href.startsWith('BinData/') ? href : `Contents/${href}`);
    if (!f) { warn.push('그림 파일을 찾지 못함'); return ''; }
    const ext = (/\.(\w+)$/.exec(href) || [0, 'png'])[1].toLowerCase();
    const sz = kid(pic, 'hp:curSz')?.attrs || kid(pic, 'hp:sz')?.attrs || {};
    const cx = emu(sz.width), cy = emu(sz.height); if (!cx || !cy) return '';
    const rid = `rIdImg${media.length + 1}`; const name = `image${media.length + 1}.${ext === 'jpeg' ? 'jpg' : ext}`;
    media.push({ rid, name, bytes: await f.async('uint8array'), ext: ext === 'jpeg' ? 'jpg' : ext });
    const id = drawId++;
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="그림 ${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  };

  // 문단 하나 → Word 블록들(문단, 그 사이에 낀 표는 따로 블록으로). inFootnote: 각주 안 문단(각주 번호 자리)
  const paraBlocks = async (p, ctx = {}) => {
    const pp = H.paras[p.attrs.paraPrIDRef]; const blocks = []; let runs = ''; let maxSize = 0; let hasDrawing = false; let pageBreak = p.attrs.pageBreak === '1';
    const flushPara = () => { const extraBefore = ctx.inFootnote && ctx.first ? noteSp.between : 0; ctx.first = false; blocks.push(`<w:p>${pPr(pp, maxSize || 10, { pageBreak, style: ctx.style, extraBefore, exact: !hasDrawing })}${runs}</w:p>`); runs = ''; pageBreak = false; maxSize = 0; hasDrawing = false; };
    for (const run of kids(p, 'hp:run')) {
      const cp = H.chars[run.attrs.charPrIDRef]; const rp = rPr(cp);
      for (const c of run.children) {
        if (c.name === 'hp:t') { if (cp && cp.size > maxSize && !cp.sup) maxSize = cp.size; runs += textRuns(c, rp, cp); }
        else if (c.name === 'hp:ctrl') {
          for (const cc of c.children) {
            if (cc.name === 'hp:footNote' || cc.name === 'hp:endNote') runs += await footnoteRef(cc, cp);
            else if (cc.name === 'hp:autoNum' && ctx.inFootnote) { ctx.numbered = true; runs += `<w:r>${rPr(cp, cp && !cp.sup ? '<w:vertAlign w:val="baseline"/>' : '')}<w:footnoteRef/></w:r>` + (fnSuffix ? `<w:r>${rPr(cp)}<w:t xml:space="preserve">${esc(fnSuffix)}</w:t></w:r>` : ''); }
            else if (cc.name === 'hp:pageNum') pageNumber = cc.attrs.pos || 'BOTTOM_CENTER';
          }
        } else if (c.name === 'hp:tbl') { if (runs) flushPara(); blocks.push(...(await tableBlocks(c))); }
        else if (c.name === 'hp:pic') { const cap = captionBlocks(c); if (cap.top.length) { if (runs) flushPara(); blocks.push(...(await cap.renderTop())); } runs += await picXml(c); hasDrawing = true; if (cap.bottom.length) { flushPara(); blocks.push(...(await cap.renderBottom())); } }
        else if (c.name === 'hp:secPr') sectPr = c;
        else if (/^hp:(rect|ellipse|line|polygon|curve|arc|container|equation|ole)$/.test(c.name)) warn.push(c.name === 'hp:equation' ? '수식은 Word로 옮기지 못함(한글 산출물 확인)' : '도형은 Word로 옮기지 못함');
      }
    }
    if (runs || !blocks.length) flushPara();
    return blocks;
  };

  const captionBlocks = (obj) => {
    const cap = kid(obj, 'hp:caption'); const side = cap?.attrs.side || 'BOTTOM'; const ps = cap ? kids(kid(cap, 'hp:subList'), 'hp:p') : [];
    const render = async () => { const out = []; for (const p of ps) out.push(...(await paraBlocks(p))); return out; };
    return { top: side === 'TOP' ? ps : [], bottom: side !== 'TOP' ? ps : [], renderTop: render, renderBottom: render };
  };

  const footnoteRef = async (fn, cp) => {
    const id = footnotes.length + 1; const ctx = { inFootnote: true, numbered: false, style: 'FootnoteText', first: true };   // 각주 사이 여백은 각주 첫 문단 위에
    const ps = kids(kid(fn, 'hp:subList'), 'hp:p'); const body = [];
    footnotes.push(null);   // 자리(칸 속 각주가 먼저 번호를 받지 않게)
    for (const p of ps) body.push(...(await paraBlocks(p, ctx)));
    let mark = '';
    if (!ctx.numbered) {   // 번호 없는 각주(‘*’ 사사·소속): 각주 글의 첫 기호를 표시로
      const txt = ps.map((p) => find(p, 'hp:t')).filter(Boolean).map((t) => t.children.filter((x) => x.name === '#text').map((x) => x.text).join('')).join('');
      mark = (/^\s*([*＊†‡]+)/.exec(txt) || [0, '*'])[1];
    }
    footnotes[id - 1] = `<w:footnote w:id="${id}">${body.join('')}</w:footnote>`;
    const refRp = rPr(cp ? { ...cp, sup: true } : null);
    return mark ? `<w:r>${refRp}<w:footnoteReference w:customMarkFollows="1" w:id="${id}"/><w:t>${esc(mark)}</w:t></w:r>`
      : `<w:r>${refRp}<w:footnoteReference w:id="${id}"/></w:r>` + (fnSuffix ? `<w:r>${refRp}<w:t xml:space="preserve">${esc(fnSuffix)}</w:t></w:r>` : '');
  };

  const tableBlocks = async (tbl) => {
    const cap = captionBlocks(tbl); const out = [];
    if (cap.top.length) out.push(...(await cap.renderTop()));
    const rows = kids(tbl, 'hp:tr'); const nCols = num(tbl.attrs.colCnt, 1);
    const cells = [];
    for (const tr of rows) for (const tc of kids(tr, 'hp:tc')) {
      const ad = kid(tc, 'hp:cellAddr')?.attrs || {}; const sp = kid(tc, 'hp:cellSpan')?.attrs || {}; const sz = kid(tc, 'hp:cellSz')?.attrs || {};
      cells.push({ tc, r: num(ad.rowAddr), c: num(ad.colAddr), cs: Math.max(1, num(sp.colSpan, 1)), rs: Math.max(1, num(sp.rowSpan, 1)), w: twip(sz.width), bf: H.borders[tc.attrs.borderFillIDRef], va: kid(tc, 'hp:subList')?.attrs.vertAlign || 'TOP' });
    }
    if (!cells.length) { warn.push('칸 없는 표는 옮기지 않음'); return out; }
    const nRows = Math.max(rows.length, ...cells.map((x) => x.r + x.rs));
    const colW = Array(nCols).fill(0);
    for (const x of cells) if (x.cs === 1 && x.c < nCols && !colW[x.c]) colW[x.c] = x.w;
    const tw = twip(kid(tbl, 'hp:sz')?.attrs.width) || 9000; const known = colW.reduce((a, v) => a + v, 0); const unknown = colW.filter((v) => !v).length;
    for (let i = 0; i < nCols; i++) if (!colW[i]) colW[i] = Math.max(200, Math.round((tw - known) / Math.max(1, unknown)));
    const border = (s) => (s ? `w:val="${s.type === 'DOUBLE' || s.type === 'DOUBLE_SLIM' ? 'double' : s.type === 'DASH' ? 'dashed' : s.type === 'DOT' ? 'dotted' : 'single'}" w:sz="${Math.max(2, Math.round(s.width * 2.835 * 8))}" w:space="0" w:color="${s.color}"` : 'w:val="nil"');
    const trs = [];
    for (let r = 0; r < nRows; r++) {
      const tcs = []; let c = 0;
      const rowCells = cells.filter((x) => x.r === r).sort((a, b) => a.c - b.c);
      while (c < nCols) {
        const here = rowCells.find((x) => x.c === c);
        const above = cells.find((x) => x.c === c && x.r < r && x.r + x.rs > r);
        if (here) {
          const bf = here.bf || {};
          const tcPr = `<w:tcPr><w:tcW w:w="${colW.slice(c, c + here.cs).reduce((a, v) => a + v, 0)}" w:type="dxa"/>${here.cs > 1 ? `<w:gridSpan w:val="${here.cs}"/>` : ''}${here.rs > 1 ? '<w:vMerge w:val="restart"/>' : ''}<w:tcBorders><w:top ${border(bf.top)}/><w:left ${border(bf.left)}/><w:bottom ${border(bf.bottom)}/><w:right ${border(bf.right)}/></w:tcBorders>${bf.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${bf.fill}"/>` : ''}<w:vAlign w:val="${here.va === 'CENTER' ? 'center' : here.va === 'BOTTOM' ? 'bottom' : 'top'}"/></w:tcPr>`;
          const inner = []; for (const p of kids(kid(here.tc, 'hp:subList'), 'hp:p')) inner.push(...(await paraBlocks(p)));
          if (!inner.length || !/^<w:p[ >]/.test(inner[inner.length - 1])) inner.push('<w:p/>');   // 칸은 문단으로 끝나야 한다
          tcs.push(`<w:tc>${tcPr}${inner.join('')}</w:tc>`); c += here.cs;
        } else if (above) {
          const bf = above.bf || {};
          tcs.push(`<w:tc><w:tcPr><w:tcW w:w="${colW.slice(c, c + above.cs).reduce((a, v) => a + v, 0)}" w:type="dxa"/>${above.cs > 1 ? `<w:gridSpan w:val="${above.cs}"/>` : ''}<w:vMerge/><w:tcBorders><w:top ${border(bf.top)}/><w:left ${border(bf.left)}/><w:bottom ${border(bf.bottom)}/><w:right ${border(bf.right)}/></w:tcBorders></w:tcPr><w:p/></w:tc>`); c += above.cs;
        } else { tcs.push(`<w:tc><w:tcPr><w:tcW w:w="${colW[c]}" w:type="dxa"/></w:tcPr><w:p/></w:tc>`); c++; }
      }
      trs.push(`<w:tr><w:trPr><w:cantSplit/></w:trPr>${tcs.join('')}</w:tr>`);
    }
    const centered = true;
    out.push(`<w:tbl><w:tblPr><w:tblW w:w="${colW.reduce((a, v) => a + v, 0)}" w:type="dxa"/>${centered ? '<w:jc w:val="center"/>' : ''}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="102" w:type="dxa"/><w:right w:w="102" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${colW.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${trs.join('')}</w:tbl>`);
    if (cap.bottom.length) out.push(...(await cap.renderBottom()));
    return out;
  };

  // 구역들 → 본문
  const body = [];
  for (const sn of secNames) {
    const sec = parseXml(await zin.file(sn).async('string'));
    const root = find(sec, 'hs:sec') || sec;
    // 각주 번호 꼴(뒤 장식)
    const fp = find(root, 'hp:footNotePr'); const anf = fp ? kid(fp, 'hp:autoNumFormat') : null; if (anf) fnSuffix = anf.attrs.suffixChar ?? ')';
    const nl = fp ? kid(fp, 'hp:noteLine')?.attrs : null; if (nl) noteLine = { length: num(nl.length, -1), width: parseFloat(nl.width) || 0.12, color: (nl.color || '#000000').replace('#', ''), type: nl.type || 'SOLID' };
    const ns = fp ? kid(fp, 'hp:noteSpacing')?.attrs : null; if (ns) noteSp = { above: num(ns.aboveLine, 850) / 100, below: num(ns.belowLine, 567) / 100, between: num(ns.betweenNotes, 283) / 100 };
    for (const p of kids(root, 'hp:p')) body.push(...(await paraBlocks(p)));
  }

  // 용지·여백(첫 구역). 한글은 본문이 ‘위쪽 여백 + 머리말’ 아래에서 시작하고 Word는 위쪽 여백이 곧 본문 시작이라 더해서 넘긴다(아래쪽·꼬리말도 같음)
  const pg = sectPr ? find(sectPr, 'hp:pagePr') : null; const mg = pg ? kid(pg, 'hp:margin')?.attrs || {} : {};
  const landscape = pg?.attrs.landscape === 'NARROWLY';
  const W = twip(landscape ? pg?.attrs.height : pg?.attrs.width) || 11906, Hh = twip(landscape ? pg?.attrs.width : pg?.attrs.height) || 16838;
  const footerRef = pageNumber ? '<w:footerReference w:type="default" r:id="rIdFooter1"/>' : '';
  const sect = `<w:sectPr>${footerRef}<w:footnotePr><w:numFmt w:val="decimal"/></w:footnotePr><w:pgSz w:w="${W}" w:h="${Hh}"${landscape ? ' w:orient="landscape"' : ''}/><w:pgMar w:top="${twip(num(mg.top) + num(mg.header))}" w:right="${twip(mg.right)}" w:bottom="${twip(num(mg.bottom) + num(mg.footer))}" w:left="${twip(mg.left)}" w:header="${twip(mg.top)}" w:footer="${twip(mg.bottom)}" w:gutter="${twip(mg.gutter)}"/><w:cols w:space="425"/></w:sectPr>`;

  // 기본 글꼴: 가장 많이 쓴 본문 글자 모양(문서 기본값으로 — Word 기본 ‘맑은 고딕’이 빈 문단에 끼지 않게)
  const base = Object.values(H.chars).find((c) => c.hangul) || { hangul: '바탕', latin: '바탕', size: 10 };
  const W_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const z = new JSZip();
  z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${[...new Set(media.map((m) => m.ext))].map((e) => `<Default Extension="${e}" ContentType="image/${e === 'jpg' ? 'jpeg' : e === 'bmp' ? 'bmp' : e === 'gif' ? 'gif' : e === 'wmf' ? 'x-wmf' : e === 'emf' ? 'x-emf' : 'png'}"/>`).join('')}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/><Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>${pageNumber ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ''}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  z.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(opts.title || '')}</dc:title><dc:creator></dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`);
  z.file('docProps/app.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>tugotl</Application></Properties>');
  z.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rIdFontTable" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/><Relationship Id="rIdFootnotes" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/>${pageNumber ? '<Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' : ''}${media.map((m) => `<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name}"/>`).join('')}</Relationships>`);
  for (const m of media) z.file(`word/media/${m.name}`, m.bytes);
  const fnText = Object.values(H.chars).find((c) => c.size < 10) || base;
  z.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W_NS}><w:docDefaults><w:rPrDefault>${rPr({ ...base, bold: false, italic: false, underline: false, strike: false, sup: false, sub: false, color: null, spacing: 0, ratio: 100 })}</w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="FootnoteText"><w:name w:val="footnote text"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="${Math.round(fnText.size * 2)}"/></w:rPr></w:style><w:style w:type="character" w:styleId="FootnoteReference"><w:name w:val="footnote reference"/><w:rPr><w:vertAlign w:val="superscript"/></w:rPr></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`);
  z.file('word/settings.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings ${W_NS}><w:defaultTabStop w:val="800"/><w:characterSpacingControl w:val="doNotCompress"/><w:footnotePr><w:footnote w:id="-1"/><w:footnote w:id="0"/></w:footnotePr><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`);
  // 각주 구분선: Word 기본 구분선은 길이를 못 정하므로 ‘위 테두리 있는 빈 문단’으로 그리고 오른쪽 들여쓰기로 길이를 맞춘다
  const textW = W - (twip(mg.left) || 0) - (twip(mg.right) || 0) - (twip(mg.gutter) || 0);
  const L = noteLine.length; const lenTw = L === -1 ? 2835 : L === -2 ? 1134 : L === -3 ? Math.round(textW / 3) : L === -4 ? textW : L > 0 ? twip(L) : 2835;   // 5cm=2835twip, 2cm=1134
  const sepLine = noteLine.type === 'NONE' || L === 0 ? '' : `<w:pBdr><w:top w:val="${/DOUBLE/.test(noteLine.type) ? 'double' : /DASH/.test(noteLine.type) ? 'dashed' : /DOT/.test(noteLine.type) ? 'dotted' : 'single'}" w:sz="${Math.max(2, Math.round(noteLine.width * 2.835 * 8))}" w:space="0" w:color="${noteLine.color}"/></w:pBdr>`;
  const sepPara = (before) => `<w:p><w:pPr>${sepLine}<w:spacing w:before="${before}" w:after="${Math.round(noteSp.below * 20)}" w:line="20" w:lineRule="exact"/><w:ind w:left="0" w:right="${Math.max(0, textW - lenTw)}"/></w:pPr></w:p>`;
  z.file('word/footnotes.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:footnotes ${W_NS}><w:footnote w:type="separator" w:id="-1">${sepPara(Math.round(noteSp.above * 20))}</w:footnote><w:footnote w:type="continuationSeparator" w:id="0">${sepPara(Math.round(noteSp.above * 20))}</w:footnote>${footnotes.join('')}</w:footnotes>`);
  if (pageNumber) z.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${W_NS}><w:p><w:pPr><w:jc w:val="${/LEFT/.test(pageNumber) ? 'left' : /RIGHT/.test(pageNumber) ? 'right' : 'center'}"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`);
  z.file('word/fontTable.xml', fontTableXml());
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W_NS}><w:body>${body.join('')}${sect}</w:body></w:document>`);
  const bytes = await z.generateAsync({ type: 'uint8array', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  return { bytes, footnotes: footnotes.length, pictures: media.length, warnings: [...new Set(warn)] };
}
