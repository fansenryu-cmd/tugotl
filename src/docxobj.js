// DOCX 표·그림 → 한글(HWPX) 개체 XML.
// Word 표(칸 합치기·칸 음영·테두리·칸 안 각주·칸 안 그림)와 그림(인라인·떠 있는 그림, VML 그림)을 한글 표·그림 요소로 새로 만든다.
// 글자·문단 모양·테두리는 이 모듈이 만든 작은 header(가상 원고 자원)에 적어 두고, 엔진의 옮겨 심기(objects.js makeImporter)가 HWP 원고와 똑같이 학회 문서로 옮긴다.

const EMU = 127;          // 1 HWPUNIT = 127 EMU (914400 EMU = 1인치 = 7200 HWPUNIT)
const TWIP = 5;           // 1 twip = 5 HWPUNIT (1440 twip = 1인치)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const LANGS = ['hangul', 'latin', 'hanja', 'japanese', 'other', 'symbol', 'user'];
const all = (v) => LANGS.map((l) => `${l}="${v}"`).join(' ');
const SUBLIST = (va) => `<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="${va}" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">`;
let uid = 1900000000;

// 이미지 크기(픽셀) — PNG·JPEG·GIF·BMP 머리에서 읽는다
export function imageSize(b) {
  if (!b || b.length < 24) return null;
  if (b[0] === 0x89 && b[1] === 0x50) return { w: (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19], h: (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23] };
  if (b[0] === 0x47 && b[1] === 0x49) return { w: b[6] | (b[7] << 8), h: b[8] | (b[9] << 8) };
  if (b[0] === 0x42 && b[1] === 0x4d) return { w: b[18] | (b[19] << 8) | (b[20] << 16), h: Math.abs((b[22] | (b[23] << 8) | (b[24] << 16) | (b[25] << 24)) | 0) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1]; const len = (b[i + 2] << 8) | b[i + 3];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
      i += 2 + len;
    }
  }
  return null;
}
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', emf: 'image/x-emf', wmf: 'image/x-wmf', tif: 'image/tiff', tiff: 'image/tiff' };

// 가상 원고 자원: 글자 모양(굵게·기울임·밑줄·위첨자·크기), 칸 문단 모양(정렬), 테두리·음영
export function makeDocxRes() {
  const res = { header: '', bins: {} };
  const cs = new Map(); const ps = new Map(); const bf = new Map();
  const csXml = []; const psXml = []; const bfXml = [];
  const borderFill = (lines, color) => {
    const key = `${['left', 'right', 'top', 'bottom'].map((s) => (lines[s] ? 1 : 0)).join('')}|${color || ''}`;
    if (bf.has(key)) return bf.get(key);
    const id = bfXml.length + 1; bf.set(key, id);
    bfXml.push(`<hh:borderFill id="${id}" threeD="0" shadow="0" centerLine="NONE" breakCellSeparateLine="0"><hh:slash type="NONE" Crooked="0" isCounter="0"/><hh:backSlash type="NONE" Crooked="0" isCounter="0"/>${['left', 'right', 'top', 'bottom'].map((s) => `<hh:${s}Border type="${lines[s] ? 'SOLID' : 'NONE'}" width="0.12 mm" color="#000000"/>`).join('')}<hh:diagonal type="SOLID" width="0.1 mm" color="#000000"/>${color ? `<hc:fillBrush><hc:winBrush faceColor="${color}" hatchColor="#999999" alpha="0"/></hc:fillBrush>` : ''}</hh:borderFill>`);
    return id;
  };
  borderFill({}, null);   // 1번: 테두리 없음
  const charShape = (v) => {
    const size = v.size && v.size >= 400 && v.size <= 4000 ? Math.round(v.size) : 1000;
    const key = `${v.bold ? 'b' : ''}${v.italic ? 'i' : ''}${v.underline ? 'u' : ''}${v.superscript ? 's' : ''}|${size}`;
    if (cs.has(key)) return cs.get(key);
    const id = csXml.length; cs.set(key, id);
    csXml.push(`<hh:charPr id="${id}" height="${size}" textColor="#000000" shadeColor="none" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="1"><hh:fontRef ${all(0)}/><hh:ratio ${all(100)}/><hh:spacing ${all(0)}/><hh:relSz ${all(100)}/><hh:offset ${all(0)}/>${v.bold ? '<hh:bold/>' : ''}${v.italic ? '<hh:italic/>' : ''}<hh:underline type="${v.underline ? 'BOTTOM' : 'NONE'}" shape="SOLID" color="#000000"/><hh:strikeout shape="NONE" color="#000000"/><hh:outline type="NONE"/><hh:shadow type="NONE" color="#C0C0C0" offsetX="10" offsetY="10"/>${v.superscript ? '<hh:supscript/>' : ''}</hh:charPr>`);
    return id;
  };
  const paraShape = (align) => {
    const A = { center: 'CENTER', right: 'RIGHT', justify: 'JUSTIFY', left: 'LEFT' }[align] || 'LEFT';
    if (ps.has(A)) return ps.get(A);
    const id = psXml.length; ps.set(A, id);
    const margin = '<hh:margin><hc:intent value="0" unit="HWPUNIT"/><hc:left value="0" unit="HWPUNIT"/><hc:right value="0" unit="HWPUNIT"/><hc:prev value="0" unit="HWPUNIT"/><hc:next value="0" unit="HWPUNIT"/></hh:margin><hh:lineSpacing type="PERCENT" value="130" unit="HWPUNIT"/>';
    psXml.push(`<hh:paraPr id="${id}" tabPrIDRef="0" condense="0" fontLineHeight="0" snapToGrid="1" suppressLineNumbers="0" checked="0"><hh:align horizontal="${A}" vertical="BASELINE"/><hh:heading type="NONE" idRef="0" level="0"/><hh:breakSetting breakLatinWord="KEEP_WORD" breakNonLatinWord="KEEP_WORD" widowOrphan="0" keepWithNext="0" keepLines="0" pageBreakBefore="0" lineWrap="BREAK"/><hh:autoSpacing eAsianEng="0" eAsianNum="0"/><hp:switch><hp:case hp:required-namespace="http://www.hancom.co.kr/hwpml/2016/HwpUnitChar">${margin}</hp:case><hp:default>${margin}</hp:default></hp:switch><hh:border borderFillIDRef="1" offsetLeft="0" offsetRight="0" offsetTop="0" offsetBottom="0" connect="0" ignoreMargin="0"/></hh:paraPr>`);
    return id;
  };
  let binN = 0;
  const addBin = (bytes, ext) => { const e = (ext || 'png').toLowerCase(); const id = `dimg${++binN}`; res.bins[id] = { href: `BinData/${id}.${e}`, type: MIME[e] || 'application/octet-stream', bytes }; return id; };
  const finish = () => { res.header = `<hh:head><hh:refList><hh:borderFills itemCnt="${bfXml.length}">${bfXml.join('')}</hh:borderFills><hh:charProperties itemCnt="${csXml.length}">${csXml.join('')}</hh:charProperties><hh:paraProperties itemCnt="${psXml.length}">${psXml.join('')}</hh:paraProperties></hh:refList></hh:head>`; return res; };
  return { res, borderFill, charShape, paraShape, addBin, finish };
}

// 그림 요소(글자처럼 취급, 문단 기준). w·h는 HWPUNIT, px는 원본 픽셀
export function picXml(binId, w, h, px) {
  const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
  const dw = px ? px.w * 75 : W, dh = px ? px.h * 75 : H;   // 원본 크기(96dpi 기준 HWPUNIT)
  const id = uid++;
  return `<hp:pic id="${id}" zOrder="0" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="${id + 1}" reverse="0"><hp:offset x="0" y="0"/><hp:orgSz width="${W}" height="${H}"/><hp:curSz width="${W}" height="${H}"/><hp:flip horizontal="0" vertical="0"/><hp:rotationInfo angle="0" centerX="${Math.round(W / 2)}" centerY="${Math.round(H / 2)}" rotateimage="1"/><hp:renderingInfo><hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/></hp:renderingInfo><hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="${W}" y="0"/><hc:pt2 x="${W}" y="${H}"/><hc:pt3 x="0" y="${H}"/></hp:imgRect><hp:imgClip left="0" right="${dw}" top="0" bottom="${dh}"/><hp:inMargin left="0" right="0" top="0" bottom="0"/><hp:imgDim dimwidth="${dw}" dimheight="${dh}"/><hc:img binaryItemIDRef="${binId}" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/><hp:effects></hp:effects><hp:sz width="${W}" widthRelTo="ABSOLUTE" height="${H}" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/><hp:outMargin left="0" right="0" top="0" bottom="0"/></hp:pic>`;
}

// 런 배열 + 끼워 넣을 것(각주 자리·그림, 글자 위치 기준) → <hp:run> 들
export function runsXml(R, runs, inserts) {
  const ins = [...inserts].sort((a, b) => a.at - b.at); let k = 0; let out = ''; let off = 0;
  const segs = runs.length ? runs : [{ text: '' }];
  segs.forEach((r, ri) => {
    const cs = R.charShape(r); let x = `<hp:run charPrIDRef="${cs}">`; let pos = 0; const t = r.text || ''; const last = ri === segs.length - 1;
    while (k < ins.length && (ins[k].at < off + t.length || (last && ins[k].at <= off + t.length))) { const at = Math.max(0, ins[k].at - off); x += `<hp:t>${esc(t.slice(pos, at)).replace(/\t/g, '</hp:t><hp:tab width="4000" leader="0" type="1"/><hp:t>').replace(/\n/g, '</hp:t><hp:lineBreak/><hp:t>')}</hp:t>${ins[k].xml}`; pos = at; k++; }
    x += `<hp:t>${esc(t.slice(pos)).replace(/\t/g, '</hp:t><hp:tab width="4000" leader="0" type="1"/><hp:t>').replace(/\n/g, '</hp:t><hp:lineBreak/><hp:t>')}</hp:t></hp:run>`;
    out += x; off += t.length;
  });
  while (k < ins.length) { out += `<hp:run charPrIDRef="${R.charShape({})}">${ins[k].xml}<hp:t></hp:t></hp:run>`; k++; }
  return out;
}

// Word 표 → 한글 표. api: { elements, attr, cellPara(body) → { align, runs, inserts:[{at,xml}] }, nestedTable(xml) → xml, tableStyleBorders(styleId) → tblBorders XML }
export function tableXml(R, tbl, api) {
  const { elements, attr } = api;
  const tblPr = (elements(tbl, 'w:tblPr')[0] || { body: '' }).body;
  const grid = elements(tbl, 'w:tblGrid')[0];
  const cols = grid ? elements(grid.body, 'w:gridCol').map((g) => +(attr(g.attrs, 'w:w') || 0) * TWIP) : [];
  // 테두리: 표 직접 지정 → 표 스타일 → 없음
  const sideOn = (xml, side) => { const m = new RegExp(`<w:${side}\\b([^>]*)/?>`).exec(xml || ''); if (!m) return undefined; const v = (attr(m[1], 'w:val') || '').toLowerCase(); return !(v === 'nil' || v === 'none' || v === ''); };
  const styleId = attr((/<w:tblStyle\b[^>]*\/>/.exec(tblPr) || [''])[0], 'w:val');
  const tb = (elements(tblPr, 'w:tblBorders')[0] || { body: '' }).body || api.tableStyleBorders(styleId) || '';
  const tbOn = (side) => sideOn(tb, side) || (side === 'left' && sideOn(tb, 'start')) || (side === 'right' && sideOn(tb, 'end')) || false;
  const rows = elements(tbl, 'w:tr').filter((tr) => elements(tr.body, 'w:tc').length);   // 칸 없는 행은 버린다(한글에서 빈 쪽을 만든다)
  if (!rows.length) return null;   // 행이 없는 표는 옮기지 않는다(부른 쪽이 ‘옮기지 못함’으로 센다)
  // 칸 배치: gridSpan(가로 합치기), vMerge(세로 합치기)
  const cells = []; const occupied = [];
  rows.forEach((tr, r) => {
    const trPr = (elements(tr.body, 'w:trPr')[0] || { body: '' }).body;
    let c = +(attr((/<w:gridBefore\b[^>]*\/>/.exec(trPr) || [''])[0], 'w:val') || 0);
    const hRule = /<w:trHeight\b[^>]*\/>/.exec(trPr); const minH = hRule ? +(attr(hRule[0], 'w:val') || 0) * TWIP : 0;
    for (const tc of elements(tr.body, 'w:tc')) {
      const tcPr = /^\s*<w:tcPr\b/.test(tc.body) ? (elements(tc.body, 'w:tcPr')[0] || { body: '' }).body : '';   // 칸 맨 앞의 tcPr만(없으면 칸 속 표의 설정을 읽지 않게)
      const span = Math.max(1, +(attr((/<w:gridSpan\b[^>]*\/>/.exec(tcPr) || [''])[0], 'w:val') || 1));
      const vm = /<w:vMerge\b([^>]*)\/?>/.exec(tcPr); const vmVal = vm ? (attr(vm[1], 'w:val') || 'continue') : null;
      const tcW = +(attr((/<w:tcW\b[^>]*\/>/.exec(tcPr) || [''])[0], 'w:w') || 0) * TWIP;
      if (vmVal === 'continue') { const up = cells.filter((x) => x.c === c && x.r + x.rs === r).pop(); if (up) { up.rs++; if (/<w:t\b[^>]*>[^<]*\S|<w:drawing\b|<w:footnoteReference\b/.test(tc.body)) (up.more ||= []).push(tc); } c += span; continue; }   // 세로로 합친 칸의 이어진 칸에 글이 있으면 위 칸 끝에 붙인다
      cells.push({ r, c, cs: span, rs: 1, tc, tcPr, tcW, minH });
      c += span;
    }
    occupied.push(c);
  });
  const nCols = Math.max(cols.length, ...occupied, 1);
  const total = cols.reduce((a, v) => a + v, 0);
  const colW = (c, span, tcW) => { if (cols.length >= c + span) return cols.slice(c, c + span).reduce((a, v) => a + v, 0) || tcW || 8000; return tcW || Math.round((total || 42000) / nCols) * span; };
  let tw = 0; for (let c = 0; c < nCols; c++) tw += colW(c, 1, 0);
  const rowH = rows.map((_, r) => Math.max(1700, ...cells.filter((x) => x.r === r).map((x) => x.minH || 0)));
  const footnotes = [];
  const trs = rows.map((_, r) => {
    const tcs = cells.filter((x) => x.r === r).map((x) => {
      const shd = /<w:shd\b[^>]*\/>/.exec(x.tcPr); const fill = shd ? (attr(shd[0], 'w:fill') || '') : '';
      const color = /^[0-9A-Fa-f]{6}$/.test(fill) && fill.toUpperCase() !== 'FFFFFF' ? `#${fill.toUpperCase()}` : null;
      const tcb = (elements(x.tcPr, 'w:tcBorders')[0] || { body: '' }).body;
      const side = (s, def) => { const v = sideOn(tcb, s); return v === undefined ? def : v; };
      const lines = { left: side('left', x.c === 0 ? tbOn('left') : tbOn('insideV')), right: side('right', x.c + x.cs >= nCols ? tbOn('right') : tbOn('insideV')), top: side('top', x.r === 0 ? tbOn('top') : tbOn('insideH')), bottom: side('bottom', x.r + x.rs >= rows.length ? tbOn('bottom') : tbOn('insideH')) };
      const bfId = R.borderFill(lines, color);
      const va = { center: 'CENTER', bottom: 'BOTTOM' }[(attr((/<w:vAlign\b[^>]*\/>/.exec(x.tcPr) || [''])[0], 'w:val') || '').toLowerCase()] || 'TOP';
      // 칸 안: 문단과 표(칸 속 표)를 순서대로
      const parts = [];
      const body = [x.tc, ...(x.more || [])].map((t) => t.body.replace(/^\s*<w:tcPr\b[\s\S]*?<\/w:tcPr>/, '')).join('');
      const nested = elements(body, 'w:tbl'); let pos = 0; const chunks = [];
      for (const nt of nested) { chunks.push(body.slice(pos, nt.start)); chunks.push({ tbl: nt }); pos = body.indexOf('</w:tbl>', nt.start) >= 0 ? nt.start + (`<w:tbl${nt.attrs}>${nt.body}</w:tbl>`).length : body.length; }
      chunks.push(body.slice(pos));
      for (const ch of chunks) {
        if (typeof ch === 'string') { for (const p of elements(ch, 'w:p')) { const cp = api.cellPara(p.body, footnotes); parts.push(`<hp:p id="0" paraPrIDRef="${R.paraShape(cp.align)}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">${runsXml(R, cp.runs, cp.inserts)}</hp:p>`); } }
        else { const inner = tableXml(R, `${ch.tbl.body}`, api); if (!inner) continue; for (const f of inner.footnotes) footnotes.push(f); parts.push(`<hp:p id="0" paraPrIDRef="${R.paraShape('left')}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${R.charShape({})}">${inner.xml}<hp:t></hp:t></hp:run></hp:p>`); }
      }
      if (!parts.length) parts.push(`<hp:p id="0" paraPrIDRef="${R.paraShape('left')}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="${R.charShape({})}"><hp:t></hp:t></hp:run></hp:p>`);
      const w = colW(x.c, x.cs, x.tcW); const h = rowH.slice(x.r, x.r + x.rs).reduce((a, v) => a + v, 0);
      return `<hp:tc name="" header="0" hasMargin="0" protect="0" editable="0" dirty="0" borderFillIDRef="${bfId}">${SUBLIST(va)}${parts.join('')}</hp:subList><hp:cellAddr colAddr="${x.c}" rowAddr="${x.r}"/><hp:cellSpan colSpan="${x.cs}" rowSpan="${x.rs}"/><hp:cellSz width="${w}" height="${h}"/><hp:cellMargin left="510" right="510" top="141" bottom="141"/></hp:tc>`;
    });
    return `<hp:tr>${tcs.join('')}</hp:tr>`;
  });
  const th = rowH.reduce((a, v) => a + v, 0); const id = uid++;
  const xml = `<hp:tbl id="${id}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="1" rowCnt="${rows.length}" colCnt="${nCols}" cellSpacing="0" borderFillIDRef="1" noAdjust="0"><hp:sz width="${tw}" widthRelTo="ABSOLUTE" height="${th}" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="PARA" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/><hp:outMargin left="283" right="283" top="283" bottom="283"/><hp:inMargin left="510" right="510" top="141" bottom="141"/>${trs.join('')}</hp:tbl>`;
  return { xml, footnotes, rows: rows.length, cols: nCols, width: tw, height: th };
}

// Word 그림(w:drawing 또는 w:pict)이 든 런 → 그림 XML. api: { rel(rId) → { bytes, ext } }
export function drawingXml(R, run, api) {
  const out = [];
  // DrawingML: wp:inline / wp:anchor — 크기는 wp:extent(EMU), 그림은 a:blip r:embed
  for (const m of run.matchAll(/<wp:(inline|anchor)\b[\s\S]*?<\/wp:\1>/g)) {
    const ext = /<wp:extent\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/.exec(m[0]);
    const blip = /<a:blip\b[^>]*r:embed="([^"]+)"/.exec(m[0]);
    if (!blip || !ext) { out.push({ lost: /<c:chart\b/.test(m[0]) ? 'chart' : /wps:txbx|<w:txbxContent/.test(m[0]) ? 'textbox' : 'shape' }); continue; }
    const f = api.rel(blip[1]); if (!f) { out.push({ lost: 'image' }); continue; }
    const binId = R.addBin(f.bytes, f.ext);
    out.push({ xml: picXml(binId, +ext[1] / EMU, +ext[2] / EMU, imageSize(f.bytes)), w: +ext[1] / EMU, h: +ext[2] / EMU });
  }
  // VML(옛 Word): v:imagedata r:id, 크기는 style의 width/height(pt)
  for (const m of run.matchAll(/<w:pict\b[\s\S]*?<\/w:pict>/g)) {
    const im = /<v:imagedata\b[^>]*r:id="([^"]+)"/.exec(m[0]); if (!im) { out.push({ lost: 'shape' }); continue; }
    const st = /style="([^"]*)"/.exec(m[0]); const dim = (k) => { const x = st && new RegExp(`${k}:([\\d.]+)(pt|in|px)`).exec(st[1]); return x ? +x[1] * (x[2] === 'in' ? 7200 : x[2] === 'px' ? 75 : 100) : 0; };
    const f = api.rel(im[1]); if (!f) { out.push({ lost: 'image' }); continue; }
    const px = imageSize(f.bytes); const w = dim('width') || (px ? px.w * 75 : 20000); const h = dim('height') || (px ? px.h * 75 : 15000);
    out.push({ xml: picXml(R.addBin(f.bytes, f.ext), w, h, px), w, h });
  }
  return out;
}
