// 원고 파서 — HWP/HWPX(rhwp), DOCX(JSZip), TXT/MD. 결과는 공통 문단 배열.
// { text, runs:[{text,bold,italic,underline,superscript}], footnotes:[{offset,text}], align, indent, marginLeft, size, bold, styleName, level }
import JSZip from 'jszip';
import { HwpDocument, U } from './engine.js';

// rhwp가 돌려주는 JSON 문자열 안에 줄바꿈 같은 제어 문자가 그대로 들어오는 경우(여러 줄 각주)가 있어, 문자열 리터럴 안의 제어 문자를 이스케이프한 뒤 파싱한다
const fixJson = (s) => s.replace(/"(?:[^"\\]|\\.)*"/g, (lit) => lit.replace(/[\u0000-\u001f]/g, (c) => (c === '\n' ? '\\n' : c === '\r' ? '\\r' : c === '\t' ? '\\t' : '')));
const J = (s) => { if (typeof s !== 'string') return s ?? null; try { return JSON.parse(s); } catch { try { return JSON.parse(fixJson(s)); } catch { return null; } } };

// 입력 상한 — 작은 파일로도 파서를 오래 붙잡을 수 있어(감사 F-7·F-9) 크기·개수에 선을 긋는다
const MAX_FILE = 64 * 1024 * 1024;        // 원고 파일 64 MB
const MAX_XML = 48 * 1024 * 1024;         // DOCX 안의 XML 한 부분 48 MB(압축 해제 기준)
const MAX_PARAS = 20000;                  // 문단 수
const MAX_TEXT = 6_000_000;               // 텍스트 원고 글자 수
const MAX_PARA_CHARS = 200_000;           // 한 문단의 글자 수(HWPX, 엔진이 문단 길이에 제곱으로 느려지므로 진입 전에 거부)
export async function parseManuscript(name, bytes) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (!bytes || !bytes.length) throw new Error('빈 파일입니다.');
  if (bytes.length > MAX_FILE) throw new Error(`원고 파일이 ${Math.round(MAX_FILE / 1048576)} MB를 넘습니다. 그림을 빼고 다시 저장해 주세요.`);
  if (ext === 'hwp' || ext === 'hwpx' || ext === 'hml') return await parseHwp(bytes, ext);
  if (ext === 'docx') return parseDocx(bytes);
  if (ext === 'txt' || ext === 'md' || ext === 'markdown') return parseText(bytes, ext);
  throw new Error(`지원하지 않는 형식입니다: .${ext} (HWP · HWPX · DOCX · TXT · MD)`);
}

// ───────── HWP / HWPX ─────────
async function parseHwp(bytes, ext) {
  if (ext === 'hwpx') {   // 압축 해제량이 큰 HWPX는 엔진에 넣기 전에 거부한다(엔진은 중단할 수 없다)
    try { const z = await JSZip.loadAsync(bytes); let total = 0; for (const [k, f] of Object.entries(z.files)) if (/\.xml$/i.test(k)) total += f._data?.uncompressedSize ?? 0; if (total > MAX_XML) throw new Error(`HWPX 안의 XML이 ${Math.round(MAX_XML / 1048576)} MB를 넘어 열지 않습니다. 그림을 빼고 다시 저장해 주세요.`); for (const [k, f] of Object.entries(z.files)) if (/^Contents\/section\d+\.xml$/i.test(k)) { const sx = await f.async('string'); if (hwpxLongestParagraph(sx) > MAX_PARA_CHARS) throw new Error(`문단 하나에 ${MAX_PARA_CHARS.toLocaleString()}자가 넘는 글이 있어 열지 않습니다(MB를 넘어). 문단을 나눠 다시 저장해 주세요.`); } } catch (e) { if (/MB를 넘어/.test(String(e.message))) throw e; /* zip이 아니면 엔진 판단에 맡긴다 */ }
  }
  let d;
  try { d = new HwpDocument(bytes); } catch (e) { throw new Error(`한글 문서를 열 수 없습니다 (${ext}). 암호·배포용 문서는 지원하지 않습니다. ${String(e).slice(0, 120)}`); }
  try {
    const warnings = [];
    const info = J(d.getDocumentInfo()) || {};
    const controls = J(d.getControls()) || [];
    // 각주의 번호 유무(autoNum)·‘새 번호 지정’·강조 런은 rhwp API가 주지 않으므로 HWPX로 한 번 내보내 문서 순서대로 읽어 둔다(글이 맞는 각주에만 붙인다)
    let fnMeta = []; let fnCursor = 0; let endnotes = 0; let tblFn = null;
    // 표 칸 안의 각주(제목·저자를 표로 짠 원고의 ‘*’ 소속 각주 등)는 rhwp API로 읽을 수 없어 HWPX에서 표별로 모아 둔다
    if (controls.some((c) => c.ctrlId === 'fn' || c.ctrlId === 'en')) { try { const m = await hwpxFootnoteMeta(d); fnMeta = m.body; tblFn = m.tables; } catch { fnMeta = []; tblFn = null; } }
    const paragraphs = [];
    const sections = d.getSectionCount();
    let tables = 0, pictures = 0, fnTotal = 0, lostMarks = 0, tblFnMoved = 0, tblFnLost = 0;
    for (let s = 0; s < sections; s++) {
      const n = d.getParagraphCount(s);
      let base = 0; for (let k = 0; k < s; k++) base += d.getParagraphCount(k);
      // 이 구역의 본문 표 수가 HWPX에서 센 표 수와 같을 때만 k번째 표 ↔ k번째 표의 각주로 짝짓는다
      const secTbls = controls.filter((c) => c.list === 0 && c.ctrlId === 'tbl' && c.para >= base && c.para < base + n).length;
      const secTblFn = tblFn && tblFn[s] && tblFn[s].length === secTbls ? tblFn[s] : null;
      if (tblFn && tblFn[s] && !secTblFn) tblFnLost += tblFn[s].reduce((a, x) => a + x.length, 0);
      let tblK = 0;
      if (paragraphs.length + n > MAX_PARAS) throw new Error(`문단이 ${MAX_PARAS.toLocaleString()}개를 넘는 원고는 열 수 없습니다.`);
      for (let i = 0; i < n; i++) {
        const len = d.getParagraphLength(s, i);
        const text = len ? d.getTextRange(s, i, 0, len) : '';
        // rhwp의 글자 위치는 코드포인트 단위, JS 문자열은 UTF-16 단위다(보조평면 글자 𠀀·😀는 2칸). 런·각주 위치를 UTF-16으로 옮긴다
        const cp16 = [0]; for (const ch of text) cp16.push(cp16[cp16.length - 1] + ch.length);
        const to16 = (k) => cp16[Math.max(0, Math.min(k, cp16.length - 1))];
        const pp = J(d.getParaPropertiesAt(s, i)) || {};
        const st = J(d.getStyleAt(s, i)) || {};
        const runs = [];
        if (len) {
          const rs = J(d.getCharShapeRuns(s, i, 0, len)) || [];
          for (const r of rs) {
            const cp = J(d.getCharPropertiesAt(s, i, r.startOffset)) || {};
            if (cp.strikethrough === true || cp.subscript === true || (cp.emphasisDot && cp.emphasisDot !== 'None' && cp.emphasisDot !== 0)) lostMarks += Math.max(0, r.endOffset - r.startOffset);   // 학회 서식에 없는 글자 장식은 옮기지 않으므로 수를 세어 알린다
            runs.push({ text: text.slice(to16(r.startOffset), to16(r.endOffset)), bold: !!cp.bold, italic: !!cp.italic, underline: !!cp.underline, superscript: !!cp.superscript, size: cp.fontSize });
          }
          // 런을 이어 붙이면 본문과 같아야 한다(어긋나면 강조를 버리고 본문만 남긴다)
          if (runs.map((r) => r.text).join('') !== text) runs.length = 0;
        }
        const cp0 = J(d.getCharPropertiesAt(s, i, 0)) || {};
        const footnotes = [];
        // 각주 위치: getCharIndexAtStreamPos는 앞선 컨트롤 수만큼 글자 위치를 덜 세므로(감사 지적) 문단의 컨트롤 텍스트 위치 배열을 먼저 쓴다
        let ctrlPos = null; try { const cpz = J(d.getControlTextPositions(s, i)); if (Array.isArray(cpz)) ctrlPos = cpz; } catch { /* 구버전 엔진 */ }
        let ctrlK = 0;
        for (const c of controls) {
          // getControls()의 para는 구역을 이어 붙인 번호라 구역 시작 문단 수(base)를 더해 비교한다
          if (c.list !== 0 || c.para !== base + i) continue;
          const kth = ctrlK++;
          if (c.ctrlId === 'tbl') {
            tables++;
            const inner = secTblFn ? secTblFn[tblK] : null; tblK++;
            // 표는 옮기지 않지만 표 안 각주는 버리지 않는다 — 표가 있던 자리(그 문단)에 각주로 붙인다
            if (inner && inner.length) {
              const offset = ctrlPos && typeof ctrlPos[kth] === 'number' && ctrlPos[kth] >= 0 ? to16(ctrlPos[kth]) : text.length;
              for (const m of inner) { footnotes.push(metaFootnote(m, offset)); fnTotal++; tblFnMoved++; }
            }
          }
          else if (c.ctrlId === 'gso' || c.ctrlId === '$pic' || c.ctrlId === 'pic') pictures++;
          else if (c.ctrlId === 'fn' || c.ctrlId === 'en') {
            if (c.ctrlId === 'en') endnotes++;
            const fi = J(d.getFootnoteInfo(s, i, c.controlIndex));
            let offset = text.length;
            if (ctrlPos && typeof ctrlPos[kth] === 'number' && ctrlPos[kth] >= 0) offset = to16(ctrlPos[kth]);
            else try {
              const raw = d.getCharIndexAtStreamPos(s, i, c.pos);
              let ci = typeof raw === 'number' ? raw : null;
              if (ci === null) { const o = J(raw); if (typeof o === 'number') ci = o; else if (o && typeof o === 'object') for (const k of ['charIndex', 'charIdx', 'index', 'charOffset', 'offset', 'pos']) if (typeof o[k] === 'number') { ci = o[k]; break; } }
              if (typeof ci === 'number' && ci >= 0) offset = to16(ci);
            } catch { /* 위치 변환 실패 시 문단 끝 */ }
            // rhwp가 돌려주는 각주 첫 문단의 첫 글자는 번호 컨트롤(autoNum) 자리의 공백이다 — 글이 아니므로 한 칸만 뗀다
            const fnLines = fi && fi.texts ? fi.texts.map((x) => String(x).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')) : [];
            // 첫 글자가 공백이 아니면 번호 없이 ‘*’ 같은 표시로 시작하는 각주(사사·소속 표기)다 — 번호를 붙이지 않고 그대로 옮긴다
            // HWPX에서 읽은 같은 각주(글이 일치하는 것)가 있으면 번호 유무·새 번호·강조 런을 그대로 쓴다
            const key = (arr) => arr.map((x) => x.replace(/\s+/g, '')).join('\n');
            let meta = null; for (let q = fnCursor; q < Math.min(fnCursor + 64, fnMeta.length); q++) { if (key(fnMeta[q].paras.map((x) => x.text)) === key(fnLines)) { meta = fnMeta[q]; fnCursor = q + 1; break; } }
            const numAt = meta ? meta.numAt : ((fnLines.length > 0 && fnLines[0].length > 0 && !fnLines[0].startsWith(' ')) ? -1 : 0);   // 번호(autoNum)가 있는 문단 번호, 없으면 -1
            const noNumber = numAt < 0;
            if (!noNumber && fnLines[numAt] && fnLines[numAt].startsWith(' ')) fnLines[numAt] = fnLines[numAt].slice(1);
            // rhwp는 묶음 빈칸(nbSpace)을 보통 빈칸으로 주므로, 빈칸 종류만 다른 HWPX 글이 있으면 그쪽을 쓴다
            if (meta) for (let k = 0; k < fnLines.length; k++) { const mp = meta.paras[k]; if (mp && mp.text !== fnLines[k] && mp.text.replace(/[\u00a0\u2007]/g, ' ') === fnLines[k]) fnLines[k] = mp.text; }
            const paras = fnLines.map((t, k) => { const mp = meta && meta.paras[k]; const ok = mp && mp.runs.length && mp.runs.map((r) => r.text).join('') === t; return { text: t, runs: ok ? mp.runs : [] }; });
            footnotes.push({ offset, text: fnLines.join('\n'), paras, ...(noNumber ? { noNumber: true } : {}), ...(numAt > 0 ? { numAt } : {}), ...(meta && meta.restart ? { restart: meta.restart } : {}) });
            fnTotal++;
          }
        }
        paragraphs.push({ text, runs, footnotes, align: pp.alignment, indent: U.pxToPt(pp.indent || 0), marginLeft: U.pxToPt(pp.marginLeft || 0),
          size: cp0.fontSize || 0, bold: !!cp0.bold && runs.every((r) => r.bold || !r.text.trim()), styleName: st.name || '', level: pp.paraLevel || 0 });
      }
    }
    if (sections > 1) warnings.push(`구역 ${sections}개를 하나로 이어 붙였습니다.`);
    if (endnotes) warnings.push(`미주 ${endnotes}개를 각주로 옮겼습니다.`);
    if (tblFnMoved) warnings.push(`표 안에 있던 각주 ${tblFnMoved}개는 표 자리의 문단에 붙였습니다. 변환 후 각주 위치를 확인하세요.`);
    if (tblFnLost) warnings.push(`표 안의 각주 ${tblFnLost}개는 위치를 찾지 못해 옮기지 못했습니다. 변환 후 한글에서 직접 넣으세요.`);
    if (tables) warnings.push(`표 ${tables}개는 변환되지 않습니다. 변환 후 한글에서 직접 옮겨 넣으세요.`);
    if (pictures) warnings.push(`그림·개체 ${pictures}개는 변환되지 않습니다.`);
    if (lostMarks) warnings.push(`강조점·취소선·아래첨자 ${lostMarks}자는 옮기지 않습니다(학회 서식에 없는 장식). 변환 후 한글에서 확인하세요.`);
    return { format: ext.toUpperCase(), paragraphs, warnings, counts: { tables, pictures, footnotes: fnTotal, pages: info.pageCount }, fonts: info.fontsUsed || [] };
  } finally { d.free(); }
}

// HWPX 구역 XML에서 가장 긴 문단의 글자 수(디코딩한 글, UTF-16 단위). 각주 안 문단은 따로 센다
function hwpxLongestParagraph(sec) {
  const TOK = /<hp:p\b[^>]*?(\/?)>|<\/hp:p>|<hp:t\b[^>]*\/\s*>|<hp:t\b[^>]*>([\s\S]*?)<\/hp:t>/g;   // 자기 닫힘 <hp:t/>를 여는 태그로 보지 않는다(다음 문단까지 삼키지 않게)
  const stack = []; let longest = 0; let m;
  while ((m = TOK.exec(sec))) {
    if (m[0].startsWith('</hp:p')) { const n = stack.pop(); if (n !== undefined && n > longest) longest = n; continue; }
    if (m[0].startsWith('<hp:p')) { if (m[1] !== '/') stack.push(0); continue; }
    if (m[2] === undefined) continue;   // 빈 텍스트 노드
    if (stack.length) { const n = stack[stack.length - 1] + decodeXml(m[2].replace(/<hp:lineBreak\b[^>]*\/\s*>/g, '\n').replace(/<[^>]+>/g, '')).length; stack[stack.length - 1] = n; if (n > longest) longest = n; }   // 줄바꿈도 한 글자
  }
  return longest;
}

// HWPX에서만 읽은 각주(표 안 각주)를 앱의 각주 꼴로: 번호 문단 첫머리의 빈칸은 rhwp 경로와 같게 한 칸 뗀다
function metaFootnote(m, offset) {
  const noNumber = !m.hasAutoNum; const numAt = noNumber ? -1 : m.numAt;
  const paras = m.paras.map((q, k) => {
    if (k === numAt && q.text.startsWith(' ')) { const runs = q.runs.map((r) => ({ ...r })); if (runs[0]) runs[0].text = runs[0].text.slice(1); return { text: q.text.slice(1), runs: runs.filter((r) => r.text) }; }
    return { text: q.text, runs: q.runs };
  });
  return { offset, text: paras.map((q) => q.text).join('\n'), paras, ...(noNumber ? { noNumber: true } : {}), ...(numAt > 0 ? { numAt } : {}), ...(m.restart ? { restart: m.restart } : {}), inTable: true };
}

// HWPX(내보내기)의 각주·미주를 문서 순서대로 읽는다: 문단별 글·강조 런, 번호(autoNum) 유무, 바로 앞의 ‘새 번호 지정’
async function hwpxFootnoteMeta(d) {
  const zip = await JSZip.loadAsync(d.exportHwpx());
  const header = zip.file('Contents/header.xml') ? await zip.file('Contents/header.xml').async('string') : '';
  const charPr = {};
  for (const m of header.matchAll(/<hh:charPr id="(\d+)"[^>]*>([\s\S]*?)<\/hh:charPr>/g)) charPr[m[1]] = { bold: /<hh:bold\/>/.test(m[2]), italic: /<hh:italic\/>/.test(m[2]), underline: /<hh:underline type="(?!NONE)/.test(m[2]), superscript: /<hh:supscript\/>/.test(m[2]) };
  const dec = (x) => x.replace(/<hp:lineBreak\/>/g, '\n').replace(/<hp:tab\b[^>]*\/>/g, '\t').replace(/<hp:nbSpace\/>/g, '\u00a0').replace(/<hp:fwSpace\/>/g, '\u2007').replace(/<[^>]+>/g, '');
  const tText = (run) => decodeXml([...run.matchAll(/<hp:t\b[^>]*>([\s\S]*?)<\/hp:t>/g)].map((m) => dec(m[1])).join(''));
  const names = Object.keys(zip.files).filter((k) => /^Contents\/section\d+\.xml$/.test(k)).sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0]);
  const out = []; const tables = []; let restart = 0;
  for (const name of names) {
    const sec = await zip.file(name).async('string');
    // 머리말·꼬리말·글상자·각주 안의 표는 본문 표(getControls의 list 0)가 아니므로 표 세기에서 뺀다
    const box = []; for (const t of sec.matchAll(/<hp:(header|footer|drawText|footNote|endNote)\b[\s\S]*?<\/hp:\1>/g)) box.push([t.index, t.index + t[0].length]);
    const inBox = (i) => box.some(([a, b]) => i > a && i < b);
    const tbl = []; { const st = []; for (const t of sec.matchAll(/<(\/?)hp:tbl\b/g)) { if (!t[1]) st.push(t.index); else { const a = st.pop(); if (!st.length && a !== undefined && !inBox(a)) tbl.push([a, t.index]); } } }
    const tblOf = (i) => tbl.findIndex(([a, b]) => i > a && i < b);
    const secTables = tbl.map(() => []); tables.push(secTables);
    for (const m of sec.matchAll(/<hp:newNum num="(\d+)" numType="FOOTNOTE"\/>|<hp:(footNote|endNote)\b[^>]*>([\s\S]*?)<\/hp:\2>/g)) {
      if (m[1] !== undefined) { restart = +m[1]; continue; }
      const ti = tblOf(m.index);
      const paras = [...m[3].matchAll(/<hp:p\b[^>]*>([\s\S]*?)<\/hp:p>/g)].map((pm) => {
        const runs = [...pm[1].matchAll(/<hp:run charPrIDRef="(\d+)"[^>]*>([\s\S]*?)<\/hp:run>/g)].map((rm) => ({ text: tText(rm[2]), ...(charPr[rm[1]] || {}) })).filter((r) => r.text);
        return { text: runs.map((r) => r.text).join(''), runs, hasAutoNum: /<hp:autoNum\b/.test(pm[1]) };
      });
      const fm = { paras, hasAutoNum: paras.some((q) => q.hasAutoNum), numAt: paras.findIndex((q) => q.hasAutoNum), restart }; restart = 0;
      (ti >= 0 ? secTables[ti] : out).push(fm);
    }
  }
  return { body: out, tables };
}

// ───────── DOCX ─────────
const decodeXml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, '&');
const attr = (xml, name) => { const m = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(xml); return m ? (m[1] !== undefined ? m[1] : m[2]) : null; };

async function parseDocx(bytes) {
  let zip;
  try { zip = await JSZip.loadAsync(bytes); } catch (e) { throw new Error(`DOCX 파일을 열 수 없습니다(손상되었거나 DOCX가 아닙니다). ${String(e.message || e).slice(0, 80)}`); }
  const part = async (name, required) => {
    const f = zip.file(name); if (!f) { if (required) throw new Error(`DOCX 본문(${name})을 찾을 수 없습니다.`); return ''; }
    const sz = f._data?.uncompressedSize ?? 0; if (sz > MAX_XML) throw new Error(`DOCX의 ${name}이 ${Math.round(MAX_XML / 1048576)} MB를 넘어 열지 않습니다.`);
    const s = await f.async('string'); if (s.length > MAX_XML) throw new Error(`DOCX의 ${name}이 너무 큽니다.`);
    const plain = s.replace(/<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<[A-Za-z_\/](?:"[^"]*"|'[^']*'|[^>"'])*>/g, (m0, c) => (m0.startsWith('<![CDATA[') ? c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : (m0.startsWith('<!--') || m0.startsWith('<?') ? '' : m0)));   // 한 번의 순회로: 태그(따옴표 포함)는 그대로, CDATA는 글자 데이터(이스케이프), 주석과 처리 지시는 내용이 아니므로 삭제 — 처리 지시·속성값 안의 CDATA·주석 모양은 글자가 아니다
    return normalizeWml(plain).replace(/<\/(w:[A-Za-z]+)\s+>/g, '</$1>');   // 닫는 태그 안의 공백(</w:p >)은 XML에서 허용된다
  };
  const xml = await part('word/document.xml', true);
  checkParagraphBalance(xml);
  const fnXml = await part('word/footnotes.xml', false);
  const stylesXml = await part('word/styles.xml', false);
  // 선형 스캐너 — 정규식 역추적 없이 여는 태그/닫는 태그를 indexOf로 짝지어 자른다 (닫는 태그가 없으면 그 요소는 버린다)
  const isTagEnd = (ch) => ch === ' ' || ch === '>' || ch === '/' || ch === '\n' || ch === '\r' || ch === '\t';   // 태그 이름 뒤에는 XML 공백(개행·탭 포함)이나 '>' '/'
  const tagEnd = (src, from) => { let q = ''; for (let k = from; k < src.length; k++) { const ch = src[k]; if (q) { if (ch === q) q = ''; } else if (ch === '"' || ch === "'") q = ch; else if (ch === '>') return k; } return -1; };   // 따옴표 안의 >는 태그 끝이 아니다
  // 같은 이름의 요소가 중첩될 수 있으므로(표 안의 표) 깊이를 세어 짝이 맞는 닫는 태그를 찾는다
  const findClose = (src, tag, from) => {
    const open = '<' + tag; const close = '</' + tag + '>'; let depth = 1; let i = from;
    let a = src.indexOf(open, i); let b = src.indexOf(close, i);   // 다음 여는/닫는 태그 위치는 지나쳤을 때만 다시 찾는다(깊은 중첩에서 제곱 시간 방지)
    while (depth > 0) {
      if (a >= 0 && a < i) a = src.indexOf(open, i);
      if (b >= 0 && b < i) b = src.indexOf(close, i);
      if (b < 0) return -1;
      if (a >= 0 && a < b && isTagEnd(src[a + open.length] || '')) { const gt = src.indexOf('>', a); if (gt < 0) return -1; if (src[gt - 1] !== '/') depth++; i = gt + 1; continue; }
      if (a >= 0 && a < b) { i = a + open.length; continue; }
      depth--; i = b + close.length;
    }
    return i - close.length;
  };
  const elements = (src, tag) => {
    const out = []; const open = '<' + tag; const close = '</' + tag + '>';
    let i = 0;
    while (true) {
      const a = src.indexOf(open, i); if (a < 0) break;
      if (!isTagEnd(src[a + open.length] || '')) { i = a + open.length; continue; }   // <w:pPr 같은 다른 태그
      const gt = tagEnd(src, a); if (gt < 0) break;
      if (src[gt - 1] === '/') { out.push({ start: a, attrs: src.slice(a + open.length, gt - 1), body: '' }); i = gt + 1; continue; }
      const b = findClose(src, tag, gt + 1); if (b < 0) { i = a + open.length; continue; }   // 짝이 없는 여는 태그(주석 안의 태그, 속성값 안의 >)는 건너뛰고 계속 읽는다
      out.push({ start: a, attrs: src.slice(a + open.length, gt), body: src.slice(gt + 1, b) }); i = b + close.length;
    }
    return out;
  };
  const stripElements = (src, tag, onHit) => {
    const open = '<' + tag; const close = '</' + tag + '>'; let out = ''; let i = 0;
    while (true) {
      const a = src.indexOf(open, i); if (a < 0) { out += src.slice(i); break; }
      if (!isTagEnd(src[a + open.length] || '')) { out += src.slice(i, a + open.length); i = a + open.length; continue; }
      const gt = tagEnd(src, a); if (gt < 0) { out += src.slice(i, a); break; }
      if (src[gt - 1] === '/') { out += src.slice(i, a); onHit?.(); i = gt + 1; continue; }
      const b = findClose(src, tag, gt + 1); if (b < 0) { out += src.slice(i, a + open.length); i = a + open.length; continue; }
      out += src.slice(i, a); onHit?.(); i = b + close.length;
    }
    return out;
  };
  const styleNames = {};
  for (const st of elements(stylesXml, 'w:style')) { const id = attr(st.attrs, 'w:styleId'); if (!id) continue; const nm = /<w:name\b[^>]*w:val="([^"]*)"/.exec(st.body); styleNames[id] = nm ? nm[1] : id; }
  // 문단 하나의 글·강조 런·각주 참조를 읽는다(본문과 각주 문단에 같이 쓴다)
  let symCount = 0;
  const readPara = (body, notes) => {
    const runs = []; const footnotes = []; let text = '';
    for (const re of elements(body, 'w:r')) {
      const r = re.body;
      const rPr = (elements(r, 'w:rPr')[0] || { body: '' }).body;
      const on = (tag) => { const t = new RegExp(`<w:${tag}\\b([^>]*)/?>`).exec(rPr); if (!t) return false; const v = attr(t[1], 'w:val'); return !(v && ['0', 'false', 'off', 'none'].includes(v.toLowerCase())); };
      const sz = attr((/<w:sz\b[^>]*\/>/.exec(rPr) || [''])[0], 'w:val');
      const sup = (attr((/<w:vertAlign\b[^>]*\/>/.exec(rPr) || [''])[0], 'w:val') || '').toLowerCase() === 'superscript';
      let t = '';
      for (const tk of runTokens(r)) {
        if (tk.sym) symCount++;
        if (tk.fn !== undefined || tk.en !== undefined) { if (notes) notes(tk, text.length + t.length, footnotes); continue; }
        t += tk.t;
      }
      if (!t) continue;
      runs.push({ text: t, bold: on('b'), italic: on('i'), underline: on('u'), superscript: sup, size: sz ? +sz * 50 : 0 });
      text += t;
    }
    return { text, runs, footnotes };
  };
  const noteParas = (xmlStr, tag) => { const o = {}; for (const fn of elements(xmlStr, tag)) { const id = attr(fn.attrs, 'w:id'); if (id === null) continue; o[id] = elements(fn.body, 'w:p').map((q) => { const r = readPara(q.body, null); return { text: r.text, runs: r.runs }; }); } return o; };
  const footnoteParas = noteParas(fnXml, 'w:footnote');
  const enXml = await part('word/endnotes.xml', false);
  const endnoteParas = enXml ? noteParas(enXml, 'w:endnote') : {};
  let tables = 0, pictures = 0, fnTotal = 0, enTotal = 0; let wordNum = 0, afterMark = false;   // Word는 사용자 지정 표시 각주를 세지 않는다
  const bodyXml = stripElements(stripElements(xml, 'w:tbl', () => { tables++; }), 'w:del');   // 표 안 문단과 변경 추적 삭제분 제외
  pictures = (bodyXml.match(/<w:drawing\b|<w:pict\b/g) || []).length;
  const paragraphs = [];
  const paras = elements(bodyXml, 'w:p');
  if (!paras.length && /<w:p[\s>\/]/.test(bodyXml)) throw new Error('DOCX 본문을 읽지 못했습니다(문단 구조가 깨져 있습니다). Word에서 다시 저장한 뒤 올려 주세요.');   // 문단 태그는 있는데 짝이 맞는 것이 없다 — 조용히 빈 원고를 내지 않는다
  if (paras.length > MAX_PARAS) throw new Error(`문단이 ${MAX_PARAS.toLocaleString()}개를 넘는 원고는 열 수 없습니다.`);
  for (const pe of paras) {
    const body = pe.body;
    const pPr = (elements(body, 'w:pPr')[0] || { body: '' }).body;
    const styleId = attr((/<w:pStyle\b[^>]*\/>/.exec(pPr) || [''])[0], 'w:val');
    const styleName = styleId ? (styleNames[styleId] || styleId) : '';
    const jc = attr((/<w:jc\b[^>]*\/>/.exec(pPr) || [''])[0], 'w:val') || 'left';
    const indXml = (/<w:ind\b[^>]*\/>/.exec(pPr) || [''])[0];
    const twip = (v) => (v ? Math.round((+v / 20) * 10) / 10 : 0);
    const marginLeft = twip(attr(indXml, 'w:left') || attr(indXml, 'w:start'));
    const indent = twip(attr(indXml, 'w:firstLine')) - twip(attr(indXml, 'w:hanging'));
    const { text, runs, footnotes } = readPara(body, (tk, offset, fns) => {
      const src = tk.fn !== undefined ? footnoteParas[tk.fn] : endnoteParas[tk.en];
      if (!src) return;
      if (tk.fn !== undefined) fnTotal++; else enTotal++;
      // 사용자 지정 표시 각주(customMarkFollows)는 Word에서 번호를 세지 않는다 — 번호 없는 각주로 옮기고 본문의 표시 글자는 그대로 둔다
      let restart = 0; if (tk.fn !== undefined && tk.customMark) afterMark = true; else { wordNum++; if (afterMark) { restart = wordNum; afterMark = false; } }   // wordNum: 산출에서 번호를 차지하는 각주·미주 수   // 표시 각주 뒤 첫 번호 각주에 Word 번호를 새 번호로
      fns.push({ offset, paras: src, text: src.map((q) => q.text).join('\n'), ...(tk.customMark ? { noNumber: true } : {}), ...(restart ? { restart } : {}) });
    });
    const size = runs.length ? (runs.find((r) => r.text.trim())?.size || 0) : 0;
    paragraphs.push({ text, runs, footnotes, align: { both: 'justify', center: 'center', right: 'right', left: 'left', start: 'left', end: 'right' }[jc] || 'left', indent, marginLeft, size, bold: runs.length > 0 && runs.every((r) => r.bold || !r.text.trim()), styleName, level: 0 });
  }
  const warnings = [];
  if (tables) warnings.push(`표 ${tables}개는 변환되지 않습니다. 변환 후 한글에서 직접 옮겨 넣으세요.`);
  if (pictures) warnings.push(`그림 ${pictures}개는 변환되지 않습니다.`);
  if (enTotal) warnings.push(`미주 ${enTotal}개를 각주로 옮겼습니다.`);
  if (symCount) warnings.push(`기호 글꼴 글자 ${symCount}개는 글꼴에 따라 다르게 보일 수 있습니다. 변환 후 확인하세요.`);
  return { format: 'DOCX', paragraphs, warnings, counts: { tables, pictures, footnotes: fnTotal + enTotal }, fonts: [] };
}
// WordprocessingML 이름공간의 접두사가 w가 아니거나(xmlns:x=…) 기본 이름공간이면 w: 접두사로 바꿔 선형 스캐너가 읽게 한다(접두사는 XML의 의미가 아니다)
const WML_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
function normalizeWml(xml) {
  const NS_RE = /xmlns(?::([A-Za-z_][\w.-]*))?\s*=\s*["']http:\/\/schemas\.openxmlformats\.org\/wordprocessingml\/2006\/main["']/g;
  const decl = [...xml.matchAll(NS_RE)].map((m) => m[1] || '');
  if (!decl.length) return xml;
  if (decl.every((d) => d === 'w') && !/xmlns:w\s*=\s*["'](?!http:\/\/schemas\.openxmlformats\.org\/wordprocessingml\/2006\/main["'])/.test(xml)) return xml;   // 보통의 Word 문서(w만 WML에 묶임)는 손대지 않는다
  // 태그만 토큰 단위로 다시 쓴다(본문 글자는 건드리지 않는다). 요소마다 이름공간 선언 범위를 쌓아 접두사를 URI로 푼 뒤, WML이면 w:, w가 다른 URI면 nw:로 바꾼다
  const TAG = /<(\/?)([A-Za-z_][\w.-]*)(?::([A-Za-z_][\w.-]*))?((?:"[^"]*"|'[^']*'|[^>"'])*)(\/?)>|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>/g;
  const ATTR = /([A-Za-z_][\w.-]*)(?::([A-Za-z_][\w.-]*))?\s*=\s*("[^"]*"|'[^']*')/g;
  const qn = (scope, prefix, local) => { const u = scope[prefix]; if (u === WML_NS) return `w:${local}`; if (prefix === 'w') return `nw:${local}`; return prefix ? `${prefix}:${local}` : local; };
  const stack = [Object.create(null)]; let out = ''; let i = 0; let m;
  while ((m = TAG.exec(xml))) {
    out += xml.slice(i, m.index); i = m.index + m[0].length;
    if (m[2] === undefined) { out += m[0]; continue; }   // 처리 지시·주석·CDATA·DOCTYPE
    const closing = m[1] === '/'; const hasPfx = m[3] !== undefined; const prefix = hasPfx ? m[2] : ''; const local = hasPfx ? m[3] : m[2]; const selfClose = /\/\s*>$/.test(m[0]); const attrs = (m[4] || '').replace(/\/\s*$/, '');   // 속성 그룹이 끝의 '/'까지 먹으므로 자기 닫힘은 태그 끝으로 판정
    if (closing) { const scope = stack[stack.length - 1]; out += `</${qn(scope, prefix, local)}>`; if (stack.length > 1) stack.pop(); continue; }
    const scope = Object.create(stack[stack.length - 1]);
    for (const a of attrs.matchAll(ATTR)) { if (a[1] !== 'xmlns') continue; scope[a[2] === undefined ? '' : a[2]] = a[3].slice(1, -1); }
    const defaultWml = scope[''] === WML_NS;
    const attrsOut = attrs.replace(ATTR, (all, n1, n2, val) => { if (n1 === 'xmlns') return all; const ap = n2 !== undefined ? n1 : ''; const an = n2 !== undefined ? n2 : n1; if (ap) { if (scope[ap] === WML_NS) return `w:${an}=${val}`; if (ap === 'w') return `nw:${an}=${val}`; return all; } return defaultWml ? `w:${an}=${val}` : all; });   // 접두사 없는 속성은 이름공간이 없지만, 기본 이름공간이 WML인 문서에서는 w: 속성으로 읽어야 뜻이 통한다
    out += `<${qn(scope, prefix, local)}${attrsOut}${selfClose ? '/' : ''}>`;
    if (!selfClose) stack.push(scope);
  }
  return out + xml.slice(i);
}
// 문단 태그의 짝이 맞지 않으면(일부가 깨진 DOCX) 조용히 앞부분만 내지 않고 거부한다
function checkParagraphBalance(xml) {
  const TAG = /<(\/?)([A-Za-z_][\w.-]*)(?::([A-Za-z_][\w.-]*))?((?:"[^"]*"|'[^']*'|[^>"'])*)>|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>/g;
  let depth = 0; let m;
  while ((m = TAG.exec(xml))) {
    if (m[2] === undefined) continue;   // 주석·CDATA·처리 지시·DOCTYPE 안의 글자는 요소가 아니다
    const name = m[3] !== undefined ? `${m[2]}:${m[3]}` : m[2]; if (name !== 'w:p') continue;
    if (/\/\s*>$/.test(m[0])) continue;   // 자기 닫힘 문단
    if (m[1] === '/') { if (depth === 0) throw new Error('DOCX 본문을 읽지 못했습니다(문단 구조가 깨져 있습니다). Word에서 다시 저장한 뒤 올려 주세요.'); depth--; } else depth++;
  }
  if (depth !== 0) throw new Error('DOCX 본문을 읽지 못했습니다(문단 구조가 깨져 있습니다). Word에서 다시 저장한 뒤 올려 주세요.');
}

// 런 안의 토큰을 문서 순서대로: 글자(<w:t>), 탭, 줄바꿈, 각주 참조 (선형)
// 태그 끝 찾기: 따옴표 안의 >는 태그 끝이 아니다(<w:t x="a>b">…)
function tagEndAt(src, from) { let q = ''; for (let k = from; k < src.length; k++) { const ch = src[k]; if (q) { if (ch === q) q = ''; } else if (ch === '"' || ch === "'") q = ch; else if (ch === '>') return k; } return -1; }
function runTokens(r) {
  const out = []; let i = 0;
  const ws = (ch) => /[\s\/>]/.test(ch || '');   // 태그 이름 뒤: 공백·개행·탭·'/'·'>'
  while (true) {
    const a = r.indexOf('<w:', i); if (a < 0) break;
    if (r.startsWith('<w:t', a) && ws(r[a + 4])) { const gt = tagEndAt(r, a); if (gt < 0) break; if (r[gt - 1] === '/') { i = gt + 1; continue; } const b = r.indexOf('</w:t>', gt); if (b < 0) break; out.push({ t: decodeXml(r.slice(gt + 1, b)) }); i = b + 6; continue; }
    if (r.startsWith('<w:tab', a) && ws(r[a + 6])) { out.push({ t: '\t' }); i = a + 6; continue; }
    if (r.startsWith('<w:br', a) && ws(r[a + 5])) { const gt = tagEndAt(r, a); if (gt < 0) break; const ty = attr(r.slice(a, gt), 'w:type'); if (ty !== 'page' && ty !== 'column') out.push({ t: '\n' }); i = gt + 1; continue; }   // 줄바꿈은 \n으로 남기고 저장 때 줄 나눔으로 쓴다(쪽·단 나눔은 학회 양식이 정하므로 버린다)
    if (r.startsWith('<w:cr', a) && ws(r[a + 5])) { out.push({ t: '\n' }); i = a + 5; continue; }
    if (r.startsWith('<w:noBreakHyphen', a) && ws(r[a + 16])) { out.push({ t: '\u2011' }); i = a + 16; continue; }
    if (r.startsWith('<w:sym', a) && ws(r[a + 6])) { const gt = tagEndAt(r, a); if (gt < 0) break; const tag = r.slice(a, gt); out.push({ t: symChar(attr(tag, 'w:font'), attr(tag, 'w:char')), sym: true }); i = gt + 1; continue; }
    if (r.startsWith('<w:footnoteReference', a) && ws(r[a + 20])) { const gt = tagEndAt(r, a); if (gt < 0) break; const tag = r.slice(a, gt); const id = attr(tag, 'w:id'); if (id !== null) out.push({ fn: id, ...(/^(1|true)$/i.test(attr(tag, 'w:customMarkFollows') || '') ? { customMark: true } : {}) }); i = gt + 1; continue; }
    if (r.startsWith('<w:endnoteReference', a) && ws(r[a + 19])) { const gt = tagEndAt(r, a); if (gt < 0) break; const id = attr(r.slice(a, gt), 'w:id'); if (id !== null) out.push({ en: id }); i = gt + 1; continue; }
    i = a + 3;
  }
  return out;
}
function runText(r) { return runTokens(r).map((tk) => tk.t || '').join(''); }
// Word 기호(w:sym): Symbol 글꼴의 그리스 문자는 유니코드로, 그 밖은 코드 그대로(글꼴 사설 영역) 둔다
const SYMBOL_GREEK = { a: 'α', b: 'β', c: 'χ', d: 'δ', e: 'ε', f: 'φ', g: 'γ', h: 'η', i: 'ι', j: 'ϕ', k: 'κ', l: 'λ', m: 'μ', n: 'ν', o: 'ο', p: 'π', q: 'θ', r: 'ρ', s: 'σ', t: 'τ', u: 'υ', v: 'ϖ', w: 'ω', x: 'ξ', y: 'ψ', z: 'ζ', A: 'Α', B: 'Β', C: 'Χ', D: 'Δ', E: 'Ε', F: 'Φ', G: 'Γ', H: 'Η', I: 'Ι', J: 'ϑ', K: 'Κ', L: 'Λ', M: 'Μ', N: 'Ν', O: 'Ο', P: 'Π', Q: 'Θ', R: 'Ρ', S: 'Σ', T: 'Τ', U: 'Υ', V: 'ς', W: 'Ω', X: 'Ξ', Y: 'Ψ', Z: 'Ζ' };
function symChar(font, hex) {
  const code = parseInt(hex || '', 16); if (!Number.isFinite(code)) return '';
  const low = code >= 0xF000 && code <= 0xF0FF ? code - 0xF000 : code;
  if (/^symbol$/i.test(font || '') && SYMBOL_GREEK[String.fromCharCode(low)]) return SYMBOL_GREEK[String.fromCharCode(low)];
  return String.fromCharCode(code);
}

// ───────── TXT / MD ─────────
function decodeText(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8.subarray(2));
  if (u8[0] === 0xfe && u8[1] === 0xff) return new TextDecoder('utf-16be').decode(u8.subarray(2));
  try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); } catch { try { return new TextDecoder('euc-kr').decode(u8); } catch { return new TextDecoder('utf-8').decode(u8); } }
}

function parseText(bytes, ext) {
  if (bytes.length > MAX_TEXT * 2) throw new Error('텍스트 원고가 ' + MAX_TEXT.toLocaleString() + '자를 넘어 열지 않습니다.');
  const raw = decodeText(bytes).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');   // NUL 등 제어 문자는 글이 아니다(탭·줄바꿈은 남김)
  if (raw.length > MAX_TEXT) throw new Error('텍스트 원고가 ' + MAX_TEXT.toLocaleString() + '자를 넘어 열지 않습니다.');
  // 마크다운식 각주 정의 [^1]: 내용
  const fnDefs = Object.create(null); let dupDef = 0;   // 프로토타입 없는 사전: [^toString]·[^constructor] 같은 id가 Object.prototype 값으로 읽히지 않게
  const rawLines = raw.split('\n');
  const isDef = (ln) => /^\[\^([^\]]+)\]:\s*(.*)$/.exec(ln); const isCont = (ln) => /^(?: {4,}|\t)(\S.*)$/.exec(ln);
  // [^n]: 정의 바로 아래 4칸 이상(또는 탭) 들여 쓴 줄은 같은 각주의 다음 문단 — 단, 문서 끝의 정의 묶음 안에서만(본문 가운데의 들여 쓴 문단은 본문이다). 묶음 안의 빈 줄은 이어짐을 끊지 않는다
  const hasRef = (ln) => /\[\^[^\]]+\](?!:)/.test(ln);
  let tailStart = rawLines.length; for (let i = rawLines.length - 1; i >= 0; i--) { const ln = rawLines[i]; if (ln.trim() === '' || isDef(ln) || (isCont(ln) && !hasRef(ln))) continue; tailStart = i + 1; break; }
  while (tailStart < rawLines.length && !isDef(rawLines[tailStart])) tailStart++;   // 끝 묶음은 첫 정의부터
  if (rawLines.slice(0, tailStart).some((ln) => isDef(ln))) tailStart = rawLines.length;   // 정의를 문단마다 둔 원고: 들여 쓴 줄은 본문
  // 정의 뒤(빈 줄 허용)의 들여 쓴 줄은 이어짐 후보. 이어짐이 아닌 들여 쓴 줄(= 본문도 들여 씀)이 있으면 모호하므로 문서 끝 정의 묶음 안으로만 한정하고 경고한다
  const contIdx = new Set(); const candIdx = new Set(); const gapIdx = new Set(); { let on = false, gap = false, q = false, pend = []; for (let i = 0; i < rawLines.length; i++) { const ln = rawLines[i]; if (isDef(ln)) { on = true; gap = false; q = false; pend = []; } else if (q && isCont(ln)) { pend.push(i); candIdx.add(i); } else if (on && isCont(ln)) { candIdx.add(i); if (!gap || i >= tailStart) contIdx.add(i); else { on = false; q = true; pend.push(i); } } else if (ln.trim() === '') { if (on) gap = true; } else { if (q) for (const k of pend) gapIdx.add(k); pend = []; on = false; q = false; } } }   // 빈 줄 뒤 들여 쓴 블록은 들여 쓰지 않은 본문으로 돌아갈 때만 인용(시)으로 본다. 다음 정의로 이어지면 들여 쓴 본문 문단이다   // 끝 묶음 밖에서 빈 줄 뒤의 들여 쓴 줄은 본문(정의 뒤 인용 시)
  const bodyIndented = rawLines.some((ln, i) => !isDef(ln) && isCont(ln) && !contIdx.has(i) && !gapIdx.has(i)); let contLines = 0;
  let lastFn = null;
  const lines = rawLines.filter((ln, i) => { const m = isDef(ln); if (m) { if (fnDefs[m[1]] !== undefined) dupDef++; fnDefs[m[1]] = m[2]; lastFn = m[1]; return false; } if (lastFn !== null && contIdx.has(i) && (!bodyIndented || i >= tailStart)) { fnDefs[lastFn] += '\n' + isCont(ln)[1]; contLines++; candIdx.delete(i); return false; } if (ln.trim() === '') return true; lastFn = null; return true; });
  if (lines.length > MAX_PARAS) throw new Error(`문단이 ${MAX_PARAS.toLocaleString()}개를 넘는 원고는 열 수 없습니다.`);
  const paragraphs = []; let fnTotal = 0; let missingDef = 0; const usedDef = new Set();
  const OPEN = String.raw`(?<=^|[\s!-)+-/:-@\[-_{-~«»·‐-‟…⸺⸻　-〿！-･ㆍ]|\[\^[^\]]+\])`;   // 여는 별표 앞: 줄 처음·공백·여는 기호(전각 포함)·각주 표지
  const CLOSE = String.raw`(?=$|[\s!-)+-/:-@\[-_{-~«»·‐-‟…⸺⸻　-〿！-･ㆍ가-힣ㄱ-ㅎㅏ-ㅣ]|\[\^)`;   // 닫는 별표 뒤: 끝·공백·문장부호(전각·말줄임표 포함)·한글(조사)·각주 표지
  const EM2 = String.raw`${OPEN}\*\*(?=[^*\s,;.:)\]>”’》〉」』）］】〕＞!?])([^*\s](?:[^*]*?[^*\s(\[<“‘《〈「『（［【〔＜])?)\*\*${CLOSE}`, EM1 = String.raw`${OPEN}\*(?=[^*\s,;.:)\]>”’》〉」』）］】〕＞!?])([^*\s](?:[^*\n]*?[^*\s(\[<“‘《〈「『（［【〔＜])?)\*${CLOSE}`;
  const EM3 = String.raw`${OPEN}\*\*\*(?=[^*\s,;.:)\]>”’》〉」』）］】〕＞!?])([^*\s](?:[^*]*?[^*\s(\[<“‘《〈「『（［【〔＜])?)\*\*\*${CLOSE}`;   // ***굵은 기울임***
  const ESC = /^(?:md|markdown)$/i.test(ext) ? String.raw`\x5c(\*)` : String.raw`(?!)(\*)`;   // 마크다운의 \* 는 글자 별표(텍스트 파일의 역슬래시는 글자 그대로)
  // 각주 정의 안의 *기울임*·**굵게**도 서식으로(본문과 같은 낱말 경계 규칙)
  const mdInline = (s) => { const re = new RegExp(`${ESC}|${EM3}|${EM2}|${EM1}`, 'g'); const rs = []; let pl = ''; let k = 0; let mm; const push = (t, st) => { if (!t) return; rs.push({ text: t, ...(st || {}) }); pl += t; }; while ((mm = re.exec(s))) { push(s.slice(k, mm.index)); if (mm[1] !== undefined) push('*'); else if (mm[2] !== undefined) push(mm[2], { bold: true, italic: true }); else if (mm[3] !== undefined) push(mm[3], { bold: true }); else push(mm[4], { italic: true }); k = mm.index + mm[0].length; } push(s.slice(k)); return { text: pl, runs: rs.some((r) => r.bold || r.italic) ? rs : [] }; };
  for (let ln of lines) {
    let level = 0; let quote = false;
    const h = /^(#{1,4})\s+(.*)$/.exec(ln); if (h) { level = h[1].length; ln = h[2]; }
    const q = /^>\s?(.*)$/.exec(ln); if (q) { quote = true; ln = q[1]; }
    // 각주 마커 [^n]와 **굵게**·*기울임* 마커를 한 번에 훑어, 출력 글자 수 기준으로 각주 offset과 런을 만든다
    const footnotes = []; const runs = []; let plain = '';
    const tok = new RegExp(String.raw`\[\^([^\]]+)\]|${ESC}|${EM3}|${EM2}|${EM1}`, 'g'); let last = 0; let m;   // 별표 강조는 낱말 경계에서만(저자 ‘홍길동*’·‘2*3’·‘***’의 별표는 글자)
    const pushRun = (t, style) => { if (!t) return; runs.push({ text: t, ...(style || {}) }); plain += t; };
    const addFn = (id) => { if (fnDefs[id] === undefined) missingDef++; else usedDef.add(id); const ft0 = fnDefs[id] || ''; const ft = ft0 && !/^\s/.test(ft0) ? ' ' + ft0 : ft0; const fp = ft.split('\n').map((x) => mdInline(x)); footnotes.push({ offset: plain.length, text: fp.map((q) => q.text).join('\n'), paras: fp }); fnTotal++; };
    const pushStyled = (t, style) => { let k = 0; for (const f of t.matchAll(/\[\^([^\]]+)\]/g)) { pushRun(t.slice(k, f.index), style); addFn(f[1]); k = f.index + f[0].length; } pushRun(t.slice(k), style); };   // 강조 안의 각주 표지(*서명[^1]*)도 각주로
    while ((m = tok.exec(ln))) {
      pushRun(ln.slice(last, m.index));
      if (m[1] !== undefined) addFn(m[1]);   // 텍스트 원고에는 각주 번호가 없으므로 번호 뒤 한 칸을 여기서 보탠다
      else if (m[2] !== undefined) pushRun('*');
      else if (m[3] !== undefined) pushStyled(m[3], { bold: true, italic: true });
      else if (m[4] !== undefined) pushStyled(m[4], { bold: true });
      else pushStyled(m[5], { italic: true });
      last = m.index + m[0].length;
    }
    pushRun(ln.slice(last));
    const trimmed = plain;   // 줄 끝 공백도 원고의 일부다(감사 지적) — 고치지 않는다
    const styled = runs.some((r) => r.bold || r.italic);
    paragraphs.push({ text: trimmed, runs: styled ? runs : [], footnotes, align: 'left', indent: 0, marginLeft: quote ? 20 : 0, size: 0, bold: false, styleName: level ? `h${level}` : (quote ? 'quote' : ''), level });
  }
  const warnings = [];
  const unusedDefs = Object.keys(fnDefs).filter((k) => !usedDef.has(k)).length;
  if (!fnTotal && !unusedDefs) warnings.push('텍스트 파일은 각주 정보가 없습니다. [^1] … [^1]: 내용 형식의 각주만 인식합니다.');
  if (unusedDefs) warnings.push(`각주 정의 ${unusedDefs}개는 본문에 [^번호] 표지가 없어 옮기지 못했습니다. 표지를 본문에 달아 주세요.`);
  if (dupDef) warnings.push(`같은 번호의 각주 정의가 ${dupDef}번 더 있어 앞의 정의는 버렸습니다. 번호를 겹치지 않게 고쳐 주세요.`);
  if (missingDef) warnings.push(`본문의 각주 표지 ${missingDef}개는 정의([^번호]: 내용)가 없어 빈 각주로 옮겼습니다.`);
  if (candIdx.size) warnings.push(`각주 정의 뒤에 들여 쓴 ${candIdx.size}줄은 본문 문단으로 두었습니다. 각주의 다음 문단이라면 정의를 파일 끝에 모으고 정의 바로 아래 네 칸 들여 쓰세요.`);
  if (contLines && (bodyIndented || gapIdx.size)) warnings.push(`각주 정의 아래 들여 쓴 ${contLines}줄을 같은 각주의 다음 문단으로 읽었습니다(정의는 파일 끝에 모아 쓰고, 본문 문단은 들여 쓰지 마세요).`);
  return { format: ext.toUpperCase(), paragraphs, warnings, counts: { tables: 0, pictures: 0, footnotes: fnTotal }, fonts: [] };
}
