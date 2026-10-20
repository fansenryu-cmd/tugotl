// 표·그림·도형 개체 — 원고 HWPX의 개체 XML을 학회 문서로 옮긴다.
// 원고(parse): 최상위 문단마다 개체를 찾아 XML을 떼어 두고, 개체 안 각주(칸·캡션·글상자)는 꺼내 문단 각주 목록에 ‘개체 소속’으로 싣는다.
// 학회 문서(engine): 개체가 쓰는 글자·문단 모양·테두리·그림 파일을 학회 문서 header·BinData로 옮겨 심고, 판면보다 넓으면 폭을 줄인다.

export const OBJ_TAGS = ['tbl', 'pic', 'container', 'rect', 'ellipse', 'line', 'arc', 'polygon', 'curve', 'connectLine', 'equation', 'ole', 'textart', 'chart', 'video'];
export const OBJ_CTRL = new Set(['tbl', 'gso', 'eqed', '$pic', 'pic', '$ole', 'ole', '$con', 'chart']);   // rhwp getControls()의 개체 ctrlId
const OBJ_OPEN = new RegExp(`<hp:(subList|newNum|${OBJ_TAGS.join('|')})\\b`, 'g');
export const kindOf = (tag) => (tag === 'tbl' ? 'table' : tag === 'pic' ? 'picture' : tag === 'equation' ? 'equation' : 'shape');

// 같은 이름 요소의 끝(깊이를 센다 — 표 안의 표, 문단 안의 문단)
export function elementEnd(xml, start, tag) {
  const re = new RegExp(`<(/?)hp:${tag}\\b[^>]*?(/?)>`, 'g'); re.lastIndex = start; let depth = 0, m;
  while ((m = re.exec(xml))) { if (m[2]) { if (depth === 0) return re.lastIndex; continue; } depth += m[1] ? -1 : 1; if (depth === 0) return re.lastIndex; }
  return -1;
}

// 구역 XML의 최상위 문단(표·각주·머리말 안 문단 제외)과 그 문단에 바로 놓인 개체의 범위
export function scanSection(sec) {
  const paras = []; let depth = 0;
  const re = /<(\/?)hp:(p|subList)\b[^>]*?(\/?)>/g; let m; let open = -1;
  while ((m = re.exec(sec))) {
    if (m[3]) { if (m[2] === 'p' && depth === 0) paras.push({ start: m.index, end: re.lastIndex, objects: [] }); continue; }
    if (m[2] === 'subList') { depth += m[1] ? -1 : 1; continue; }
    if (depth !== 0) continue;
    if (!m[1]) open = m.index; else if (open >= 0) { paras.push({ start: open, end: re.lastIndex, objects: [] }); open = -1; }
  }
  // 그림·표·수식 번호의 ‘새 번호 지정’(커버 그림 뒤 1부터 등)은 개체 밖 문단에 있다 — 다음 개체 앞에 같이 옮긴다
  let pending = '';
  for (const p of paras) {
    OBJ_OPEN.lastIndex = p.start; let o;
    while ((o = OBJ_OPEN.exec(sec)) && o.index < p.end) {
      if (o[1] === 'newNum') {
        const tag = /^<hp:newNum\b[^>]*\/>/.exec(sec.slice(o.index, o.index + 200));
        if (tag && /numType="(PICTURE|TABLE|EQUATION)"/.test(tag[0])) pending += `<hp:ctrl>${tag[0]}</hp:ctrl>`;
        continue;
      }
      const end = elementEnd(sec, o.index, o[1]); if (end < 0) break;
      if (o[1] !== 'subList') { p.objects.push({ tag: o[1], start: o.index, end, pre: pending }); pending = ''; }   // 각주·머리말의 subList는 통째로 건너뛴다(그 안 개체는 이 문단의 개체가 아니다)
      OBJ_OPEN.lastIndex = end;
    }
  }
  return paras;
}

// 문단 XML에서 개체 앞까지의 글자 수(subList 안은 세지 않음) — rhwp 위치를 못 쓸 때의 대비
export function textOffsetBefore(sec, pStart, at, decode) {
  let x = sec.slice(pStart, at); let k;
  while ((k = x.search(/<hp:subList\b/)) >= 0) { const e = elementEnd(x, k, 'subList'); x = e < 0 ? x.slice(0, k) : x.slice(0, k) + x.slice(e); }
  return [...x.matchAll(/<hp:t\b[^>]*>([\s\S]*?)<\/hp:t>/g)].map((t) => decode(t[1])).join('').length;
}

// 개체 요약: 표 행·열, 그림 크기(mm), 캡션 글
export function describeObject(xml, tag) {
  const num = (re) => { const m = re.exec(xml); return m ? +m[1] : 0; };
  const cap = /<hp:caption\b[\s\S]*?<\/hp:caption>/.exec(xml);
  const caption = cap ? [...cap[0].matchAll(/<hp:t\b[^>]*>([\s\S]*?)<\/hp:t>/g)].map((t) => t[1].replace(/<[^>]+>/g, '')).join('').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').trim() : '';
  const w = num(/<hp:sz width="(\d+)"/), h = num(/<hp:sz width="\d+"[^>]*height="(\d+)"/);
  // 목차를 표 안에 짠 원고(‘<목 차>’ 상자): 첫 글이 목차·차례·Contents이면 목차 표로 본다(목차 자동 생성을 건너뛰게)
  // 첫 칸 첫 문단 전체가 목차 제목일 때만(‘차례대로 …’·‘Contents of …’로 시작하는 일반 표는 아니다). 캡션 글은 빼고 본다
  const p1 = tag === 'tbl' ? (/<hp:p\b[\s\S]*?<\/hp:p>/.exec(xml.replace(/<hp:caption\b[\s\S]*?<\/hp:caption>/g, '')) || [''])[0] : '';
  const first = [...p1.matchAll(/<hp:t\b[^>]*>([\s\S]*?)<\/hp:t>/g)].map((t) => t[1].replace(/<[^>]+>/g, '')).join('').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  const toc = /^[<〈＜《\[【(（]?\s*(목\s*차|차\s*례|contents|table of contents)\s*[>〉＞》\]】)）]?$/i.test(first);
  return { rows: tag === 'tbl' ? num(/rowCnt="(\d+)"/) : 0, cols: tag === 'tbl' ? num(/colCnt="(\d+)"/) : 0, width: w, height: h, caption, ...(toc ? { toc: true } : {}) };
}

// ───────── 학회 문서로 옮겨 심기 ─────────
const LIST = { charPr: 'charProperties', paraPr: 'paraProperties', borderFill: 'borderFills', tabPr: 'tabProperties', numbering: 'numberings', bullet: 'bullets' };
const ORDER = ['fontfaces', 'borderFills', 'charProperties', 'tabProperties', 'numberings', 'bullets', 'paraProperties', 'styles'];
const items = (header, el) => { const out = {}; const re = new RegExp(`<hh:${el} id="(\\d+)"[^>]*?(?:/>|>[\\s\\S]*?</hh:${el}>)`, 'g'); for (const m of header.matchAll(re)) out[m[1]] = m[0]; return out; };
const setId = (x, id) => x.replace(/ id="\d+"/, ` id="${id}"`);

// opts: { header(학회 header XML), src: { header, bins }, textWidth, captionShape: {ps, cs, styleId}, bodyFontRef(문자열), allocCharPr(xml)→id, nextPid()→id }
export function makeImporter(opts) {
  const srcH = opts.src.header || '';
  const S = { charPr: items(srcH, 'charPr'), paraPr: items(srcH, 'paraPr'), borderFill: items(srcH, 'borderFill'), tabPr: items(srcH, 'tabPr'), numbering: items(srcH, 'numbering'), bullet: items(srcH, 'bullet') };
  // 새 번호는 학회 문서 목록의 가장 큰 번호 + 1(테두리·번호 목록은 1부터, 글자·문단 모양은 0부터 센다). 개수(itemCnt)는 따로 센다
  const next = {}; const count = {};
  for (const k of Object.keys(LIST)) { const ids = Object.keys(items(opts.header, k)).map(Number); next[k] = ids.length ? Math.max(...ids) + 1 : (/^(borderFill|numbering|bullet)$/.test(k) ? 1 : 0); count[k] = ids.length; }
  const added = { paraPr: [], borderFill: [], tabPr: [], numbering: [], bullet: [] };
  const cache = {}; const bins = []; const binMap = {};
  const stats = { objects: 0, tables: 0, pictures: 0, shapes: 0, scaled: 0, moved: 0, footnotes: 0 };
  const memo = (kind, id, fn) => { const key = `${kind}:${id}`; if (!(key in cache)) cache[key] = fn(); return cache[key]; };

  const importBin = (id) => memo('bin', id, () => {
    const b = opts.src.bins && opts.src.bins[id]; if (!b) return id;
    const nid = `tgbin${bins.length + 1}`; const ext = (/\.([A-Za-z0-9]+)$/.exec(b.href) || [null, 'bin'])[1];
    bins.push({ id: nid, path: `BinData/${nid}.${ext}`, type: b.type, bytes: b.bytes }); binMap[id] = nid; return nid;
  });
  const importBorderFill = (id) => memo('bf', id, () => {
    const x = S.borderFill[id]; if (!x) return 1;   // 1번은 한글 문서의 기본 테두리(없음)
    const nid = next.borderFill++; added.borderFill.push(setId(x, nid).replace(/binaryItemIDRef="([^"]+)"/g, (m0, b) => `binaryItemIDRef="${importBin(b)}"`)); return nid;
  });
  const importCharPr = (id) => memo('cs', id, () => {
    const x = S.charPr[id]; if (!x) return 0;
    let y = x.replace(/borderFillIDRef="(\d+)"/, (m0, b) => `borderFillIDRef="${importBorderFill(b)}"`);
    if (opts.bodyFontRef) y = y.replace(/<hh:fontRef\b[^>]*\/>/, opts.bodyFontRef);   // 개체 안 글은 학회 본문 글꼴로(크기·굵기·색은 원고대로)
    return opts.allocCharPr(y);
  });
  const importTabPr = (id) => memo('tab', id, () => { const x = S.tabPr[id]; if (!x || +id === 0) return 0; const nid = next.tabPr++; added.tabPr.push(setId(x, nid)); return nid; });
  const importNumbering = (kind, id) => memo(kind, id, () => {
    const x = S[kind][id]; if (!x) return null;
    const nid = next[kind]++; added[kind].push(setId(x, nid).replace(/charPrIDRef="(\d+)"/g, (m0, c) => (c === '4294967295' ? m0 : `charPrIDRef="${importCharPr(c)}"`))); return nid;
  });
  const importParaPr = (id) => memo('ps', id, () => {
    const x = S.paraPr[id]; if (!x) return 0;
    let y = x.replace(/tabPrIDRef="(\d+)"/, (m0, t) => `tabPrIDRef="${importTabPr(t)}"`).replace(/borderFillIDRef="(\d+)"/g, (m0, b) => `borderFillIDRef="${importBorderFill(b)}"`);
    y = y.replace(/<hh:heading type="(\w+)" idRef="(\d+)"/, (m0, type, ref) => {
      if (type === 'NUMBER' || type === 'BULLET') { const n = importNumbering(type === 'NUMBER' ? 'numbering' : 'bullet', ref); if (n !== null) return `<hh:heading type="${type}" idRef="${n}"`; }
      return '<hh:heading type="NONE" idRef="0"';   // 개요 번호는 학회 문서의 개요와 섞이므로 뗀다
    });
    const nid = next.paraPr++; added.paraPr.push(setId(y, nid)); return nid;
  });

  // 개체 XML 하나를 학회 문서용으로: footnoteXml(k)는 개체 안 k번째 각주 자리의 XML(번호는 본문 흐름으로 이어 매김)
  function importObject(obj, footnoteXml, limit) {
    let x = obj.xml; stats.objects++; stats[obj.kind === 'table' ? 'tables' : obj.kind === 'picture' ? 'pictures' : 'shapes']++;
    // 캡션 문단은 학회의 표·그림 제목 모양으로(자동 번호는 그대로) — ‘#’ 표시는 이미 학회 쪽 ID라는 뜻
    const cap = opts.captionShape;
    if (cap) x = x.replace(/<hp:caption\b[\s\S]*?<\/hp:caption>/g, (c) => c.replace(/paraPrIDRef="\d+"/g, `paraPrIDRef="#${cap.ps}"`).replace(/charPrIDRef="\d+"/g, `charPrIDRef="#${cap.cs}"`).replace(/styleIDRef="\d+"/g, `styleIDRef="#${cap.styleId ?? 0}"`));
    x = x.replace(/<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>/g, '');   // 줄 배치는 학회 문서에서 다시 계산한다
    x = x.replace(/(charPrIDRef|paraPrIDRef|borderFillIDRef|styleIDRef)="(\d+)"/g, (m0, k, v) => {
      if (k === 'charPrIDRef') return v === '4294967295' ? m0 : `${k}="#${importCharPr(v)}"`;
      if (k === 'paraPrIDRef') return `${k}="#${importParaPr(v)}"`;
      if (k === 'borderFillIDRef') return `${k}="#${importBorderFill(v)}"`;
      return `${k}="#0"`;   // 원고 스타일은 학회 문서에 없다 — 바탕글로(문단·글자 모양은 위에서 직접 지정)
    }).replace(/(charPrIDRef|paraPrIDRef|borderFillIDRef|styleIDRef)="#(\d+)"/g, '$1="$2"');
    x = x.replace(/binaryItemIDRef="([^"]+)"/g, (m0, b) => `binaryItemIDRef="${importBin(b)}"`);
    x = x.replace(/<hp:p id="\d+"/g, () => `<hp:p id="${opts.nextPid()}"`);
    let k = 0; x = x.replace(/<hp:ctrl><!--tgfn--><\/hp:ctrl>/g, () => { stats.footnotes++; return footnoteXml(k++); });
    // 쪽·용지 기준으로 떠 있는 개체는 문단 기준으로(원고와 학회 판면이 달라 엉뚱한 자리에 놓이지 않게)
    x = x.replace(/<hp:pos\b[^>]*\/>/, (p) => {
      if (/treatAsChar="1"/.test(p) || !/(vertRelTo|horzRelTo)="(PAPER|PAGE)"/.test(p)) return p;
      stats.moved++;
      return p.replace(/vertRelTo="\w+"/, 'vertRelTo="PARA"').replace(/horzRelTo="\w+"/, 'horzRelTo="COLUMN"').replace(/vertOffset="-?\d+"/, 'vertOffset="0"').replace(/horzOffset="-?\d+"/, 'horzOffset="0"').replace(/horzAlign="\w+"/, 'horzAlign="CENTER"').replace(/vertAlign="\w+"/, 'vertAlign="TOP"');
    });
    x = fitWidth(x, obj.tag, limit || opts.textWidth);
    return (obj.pre || '') + x;   // 그림·표 번호 ‘새 번호 지정’은 개체 바로 앞에
  }

  // 판면보다 넓은 개체는 폭을 줄인다(표: 칸 너비 비례, 그림: 가로세로 비례)
  function fitWidth(x, tag, limit) {
    const m = /<hp:sz width="(\d+)"([^>]*?)height="(\d+)"/.exec(x); if (!m || !limit) return x;
    const om = /<hp:outMargin left="(\d+)" right="(\d+)"/.exec(x); const margin = om ? +om[1] + +om[2] : 0;
    const w = +m[1]; if (w + margin <= limit) return x;
    const f = Math.max(0.05, (limit - margin) / w); stats.scaled++;
    const sc = (v) => Math.max(1, Math.round(v * f));
    if (tag === 'tbl') {
      // 표 자체 크기와 칸 너비. 표 안의 표·그림은 그대로 두면 칸을 넘으니 같이 줄인다 — 칸 안 그림은 가로세로·확대 행렬을 함께 줄여 비율을 지킨다
      const pics = []; const y = x.replace(/<hp:pic\b[\s\S]*?<\/hp:pic>/g, (pm) => { pics.push(scalePic(pm, f, sc)); return `<!--tgpic${pics.length - 1}-->`; });
      return y.replace(/<hp:sz width="(\d+)"/g, (m0, v) => `<hp:sz width="${sc(v)}"`).replace(/<hp:cellSz width="(\d+)"/g, (m0, v) => `<hp:cellSz width="${sc(v)}"`)
        .replace(/<hp:curSz width="(\d+)" height="(\d+)"/g, (m0, a, b) => `<hp:curSz width="${sc(a)}" height="${sc(b)}"`)
        .replace(/<!--tgpic(\d+)-->/g, (m0, i) => pics[+i]);
    }
    if (tag === 'pic') return scalePic(x, f, sc);
    return x.replace(/<hp:sz width="(\d+)"([^>]*?)height="(\d+)"/, (m0, a, mid, b) => `<hp:sz width="${sc(a)}"${mid}height="${sc(b)}"`);   // 도형 묶음: 겉 크기만(속 도형 좌표는 한글이 비율로 맞춘다)
  }
  // 그림 한 장을 f배로: 크기·현재 크기·확대 행렬·회전 중심·마지막 폭
  function scalePic(x, f, sc) {
    return x.replace(/<hp:sz width="(\d+)"([^>]*?)height="(\d+)"/, (m0, a, mid, b) => `<hp:sz width="${sc(a)}"${mid}height="${sc(b)}"`)
      .replace(/<hp:curSz width="(\d+)" height="(\d+)"/, (m0, a, b) => `<hp:curSz width="${sc(a)}" height="${sc(b)}"`)
      .replace(/<hc:scaMatrix e1="([\d.]+)"([^>]*?)e5="([\d.]+)"/, (m0, a, mid, b) => `<hc:scaMatrix e1="${(+a * f).toFixed(8)}"${mid}e5="${(+b * f).toFixed(8)}"`)
      .replace(/<hp:rotationInfo angle="(-?\d+)" centerX="(\d+)" centerY="(\d+)"/, (m0, a, cx, cy) => `<hp:rotationInfo angle="${a}" centerX="${sc(cx)}" centerY="${sc(cy)}"`)
      .replace(/lastWidth="(\d+)"/, (m0, v) => `lastWidth="${sc(v)}"`);
  }

  // header.xml에 옮겨 온 목록을 붙인다(charPr은 엔진의 글자 모양 목록이 붙인다)
  function applyHeader(header) {
    let h = header;
    for (const [k, arr] of Object.entries(added)) {
      if (!arr.length) continue; const list = LIST[k]; const cnt = count[k] + arr.length;
      const selfClosed = new RegExp(`<hh:${list} itemCnt="\\d+"\\s*/>`);
      if (selfClosed.test(h)) h = h.replace(selfClosed, () => `<hh:${list} itemCnt="${cnt}">${arr.join('')}</hh:${list}>`);
      else if (new RegExp(`<hh:${list} itemCnt="\\d+"`).test(h)) h = h.replace(new RegExp(`<hh:${list} itemCnt="\\d+"`), `<hh:${list} itemCnt="${cnt}"`).replace(`</hh:${list}>`, () => `${arr.join('')}</hh:${list}>`);
      else {
        // 목록이 아예 없으면 정해진 순서 자리에 새로 만든다
        const after = ORDER.slice(ORDER.indexOf(list) + 1).find((n) => h.includes(`<hh:${n} `));
        const block = `<hh:${list} itemCnt="${cnt}">${arr.join('')}</hh:${list}>`;
        h = after ? h.replace(`<hh:${after} `, () => `${block}<hh:${after} `) : h.replace('</hh:refList>', () => `${block}</hh:refList>`);
      }
    }
    return h;
  }
  // content.hpf에 그림 파일 항목을 붙인다
  function applyManifest(hpf) {
    if (!bins.length) return hpf;
    return hpf.replace('</opf:manifest>', () => `${bins.map((b) => `<opf:item id="${b.id}" href="${b.path}" media-type="${b.type}" isEmbeded="1"/>`).join('')}</opf:manifest>`);
  }
  return { importObject, applyHeader, applyManifest, bins, stats };
}
