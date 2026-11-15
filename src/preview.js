// 미리보기 SVG 보정 — 저장 파일(HWP·HWPX)은 건드리지 않고, 화면에 그리는 글자만 바로잡는다.
//
// rhwp 0.8.7은 쪽을 그릴 때 사설 영역(PUA) 글자를 일반 글자로 바꿔 그리는데(렌더 트리의 text → displayText),
// 한글 전용 반각 겹낫표 󰡔(U+F0854)·󰡕(U+F0855)를 겹화살괄호 《(U+300A)·》(U+300B)로 잘못 잇는다.
// 그래서 원고의 󰡔저서󰡕가 미리보기에서 《저서》로 보인다(한글에서 열면 정상).
//
// 고치는 법: 같은 쪽의 렌더 트리에서 text에 F0854/F0855가 든 글자 런(TextRun)을 찾고, 그 런과 같은 줄에 그려진
// SVG <text> 글자들(글자마다 하나, 왼쪽부터)에서 displayText(공백 뺌)가 나오는 자리를 찾아 한 글자씩 맞춘다.
// 맞춘 자리 가운데 원래 글자가 F0854/F0855인 곳의 《·》만 『(U+300E)·』(U+300F)로 바꾼다.
// 원고에 원래 있던 《》는 원래 글자가 U+300A/300B라 그대로 남는다.
// 글자 위치(x·y)·크기는 그대로 두므로 쪽 나눔·줄 배치는 바뀌지 않는다.
// 맞추기가 조금이라도 어긋나면(글자 수가 다름, 한 글자가 여러 글자로 펼쳐짐, 겹쳐 그린 글자 등) 그 런은 손대지 않는다.

const FIX = new Map([[0xF0854, [0x300A, '『']], [0xF0855, [0x300B, '』']]]);   // 원래 글자 → [rhwp가 그리는 글자, 바로잡을 글자]
const HAS_PUA = /[\u{F0854}\u{F0855}]/u;

const xmlDecode = (s) => s.replace(/&(?:#x([0-9a-f]+)|#(\d+)|(amp|lt|gt|quot|apos));/gi, (_, hx, dec, nm) =>
  hx ? String.fromCodePoint(parseInt(hx, 16)) : dec ? String.fromCodePoint(+dec) : { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[nm.toLowerCase()]);
const num = (attrs, k) => { const m = new RegExp(`\\s${k}="([^"]*)"`).exec(attrs); return m ? +m[1] : NaN; };

// 렌더 트리에서 반각 겹낫표가 든 글자 런 모으기
function puaRuns(tree) {
  const runs = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'TextRun' && typeof n.text === 'string' && n.bbox && HAS_PUA.test(n.text)) runs.push(n);
    for (const c of n.children || []) walk(c);
  };
  walk(tree);
  return runs;
}

/**
 * 한 쪽의 SVG 문자열을 받아 반각 겹낫표 자리만 『』로 바꾼 SVG 문자열을 돌려준다.
 * @param {string} svg   renderPageSvg 결과
 * @param {string|object} tree  같은 쪽의 getPageRenderTree 결과(JSON 문자열 또는 객체)
 * @returns {{ svg: string, fixed: number, skipped: number }}  fixed: 바꾼 글자 수, skipped: 맞추지 못해 그대로 둔 런 수
 */
export function fixPreviewSvg(svg, tree) {
  if (typeof tree === 'string') { if (!HAS_PUA.test(tree)) return { svg, fixed: 0, skipped: 0 }; tree = JSON.parse(tree); }
  const runs = puaRuns(tree);
  if (!runs.length) return { svg, fixed: 0, skipped: 0 };
  // SVG 글자 목록(rhwp는 글자마다 <text x y>…</text> 하나를 쓴다. 공백은 그리지 않는다)
  const els = [];
  for (const m of svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)) {
    let x = num(m[1], 'x'); let y = num(m[1], 'y');
    const tf = /\stransform="([^"]*)"/.exec(m[1]);
    if (tf) {   // 장평은 transform="translate(x,y) scale(sx,1)"로 그린다. 그 밖의 변형(회전 등)은 좌표를 믿을 수 없어 맞추기 대상에서 뺀다
      const t = /^\s*translate\(\s*([-\d.e+]+)[\s,]+([-\d.e+]+)\s*\)(?:\s*scale\(\s*[-\d.e+]+(?:[\s,]+[-\d.e+]+)?\s*\))?\s*$/i.exec(tf[1]);
      if (!t || isFinite(x) || isFinite(y)) continue;
      x = +t[1]; y = +t[2];
    }
    if (!isFinite(x) || !isFinite(y)) continue;
    els.push({ start: m.index, end: m.index + m[0].length, open: m[0].slice(0, m[0].length - m[2].length - 7), raw: m[2], text: xmlDecode(m[2]), x, y });
  }
  const edits = new Map();   // els 번호 → 새 글자
  let skipped = 0;
  for (const run of runs) {
    const src = [...run.text];
    // displayText가 빠진 런도 있다(각주 둘째 줄 등). 그때도 SVG에는 《》로 그려지므로 text에서 그릴 글자를 짐작하되,
    // 다른 사설 영역 글자가 섞여 있으면 무엇으로 그렸는지 알 수 없어 손대지 않는다
    let disp;
    if (typeof run.displayText === 'string') disp = [...run.displayText];
    else if (src.some((c) => { const s = c.codePointAt(0); return !FIX.has(s) && ((s >= 0xE000 && s <= 0xF8FF) || s >= 0xF0000); })) { skipped++; continue; }
    else disp = src.map((c) => { const fx = FIX.get(c.codePointAt(0)); return fx ? String.fromCodePoint(fx[0]) : c; });
    if (src.length !== disp.length) { skipped++; continue; }   // 한 글자가 여러 글자로 펼쳐짐 — 자리를 맞출 수 없음
    // 원래 글자와 그리는 글자가 다른 자리는 사설 영역 글자뿐이어야 하고, 겹낫표 자리는 rhwp가 《》로 그린 것이어야 한다
    let ok = true;
    for (let i = 0; i < src.length && ok; i++) {
      const s = src[i].codePointAt(0); const d = disp[i].codePointAt(0);
      if (FIX.has(s)) ok = d === FIX.get(s)[0];
      else if (s !== d) ok = (s >= 0xE000 && s <= 0xF8FF) || s >= 0xF0000;
    }
    if (!ok) { skipped++; continue; }
    // 이 런이 있는 줄(같은 높이)에 그려진 글자들을 왼쪽부터 늘어놓고, displayText에서 공백을 뺀 글자열이 나오는 자리를 찾는다.
    // 런의 bbox는 줄 앞 각주 번호 등으로 몇 px 어긋나기도 해서, 끝 경계 대신 '시작 글자가 bbox 안에 있는 자리가 꼭 하나'를 조건으로 한다
    const { x, y, w, h } = run.bbox;
    const line = [];
    els.forEach((e, k) => { if (e.y >= y - 0.5 && e.y <= y + h + 2) line.push(k); });
    line.sort((a, b) => els[a].x - els[b].x || a - b);
    const chars = [], owner = [], head = [];
    for (const k of line) [...els[k].text].forEach((c, t) => { chars.push(c); owner.push(k); head.push(t === 0); });
    const want = []; disp.forEach((c, i) => { if (!/\s/u.test(c)) want.push(i); });
    const pat = want.map((i) => disp[i]);
    const occ = [];
    for (let s = 0; pat.length && s + pat.length <= chars.length; s++) {
      if (!head[s] || (s + pat.length < chars.length && !head[s + pat.length])) continue;   // <text> 경계에서 시작·끝나야 함
      let m = true; for (let t = 0; t < pat.length && m; t++) m = chars[s + t] === pat[t];
      const ex = els[owner[s]].x;
      if (m && ex >= x - 0.5 && ex < x + w - 0.5) occ.push(s);
    }
    const plan = [];
    if (occ.length !== 1) ok = false;
    for (let t = 0; ok && t < pat.length; t++) {
      const fx = FIX.get(src[want[t]].codePointAt(0)); if (!fx) continue;
      const k = owner[occ[0] + t]; const e = els[k];
      if ([...e.text].length !== 1) { ok = false; break; }   // 여러 글자를 한 <text>에 그린 경우는 손대지 않음
      if (line.some((q) => q !== k && Math.abs(els[q].x - e.x) < 0.5 && Math.abs(els[q].y - e.y) < 0.5)) { ok = false; break; }   // 같은 자리에 겹쳐 그린 글자(그림자 등)
      plan.push([k, fx[1]]);
    }
    if (!ok || plan.some(([k]) => edits.has(k))) { skipped++; continue; }
    for (const [k, ch] of plan) edits.set(k, ch);
  }
  if (!edits.size) return { svg, fixed: 0, skipped };
  let out = ''; let last = 0;
  for (const k of [...edits.keys()].sort((a, b) => a - b)) {
    const e = els[k];
    out += svg.slice(last, e.start) + e.open + edits.get(k) + '</text>';
    last = e.end;
  }
  out += svg.slice(last);
  return { svg: out, fixed: edits.size, skipped };
}

// rhwp 문서의 한 쪽을 미리보기용 SVG로 그린다(반각 겹낫표 보정 포함). 보정이 실패하면 rhwp가 그린 그대로 돌려준다.
export function renderPreviewSvg(doc, page) {
  const svg = doc.renderPageSvg(page);
  try {
    if (typeof doc.getPageRenderTree !== 'function') return svg;
    return fixPreviewSvg(svg, doc.getPageRenderTree(page)).svg;
  } catch { return svg; }
}
