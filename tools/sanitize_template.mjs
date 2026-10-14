// 학회 양식(바탕틀) HWP의 글자를 견본 문구로 바꾼다: 문단·글자 모양은 그대로 두고 실제 논문 본문·실명·이메일·각주 내용을 지운다.
// 표지(국문초록·주제어·참고문헌·Abstract 등)는 남기고, 장절 제목은 번호만 남긴 뒤 ‘제목’으로, 주제어 줄은 머리말만 남긴다.
// 사용: node tools/sanitize_template.mjs <입력.hwp> <출력.hwp>   (출력 뒤 남은 글자를 화면에 보여 준다)
import fs from 'node:fs';
import { initEngine, HwpDocument } from '../src/engine.js';
await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const [input, output] = process.argv.slice(2);
if (!input || !output) { console.error('사용: node tools/sanitize_template.mjs <입력.hwp> <출력.hwp>'); process.exit(1); }
const J = (s) => { try { return JSON.parse(s); } catch { return null; } };
const LABEL = /^[\s\p{P}\p{S}]*(?:국문\s*(?:초록|요약|개요)|영문\s*초록|초\s*록|요\s*약|개\s*요|abstract|참고\s*문헌|인용\s*문헌|인용\s*자료|works\s*cited|references?|목\s*차|차\s*례|key\s*-?\s*words?|keywords?|주\s*제\s*어|핵\s*심\s*어|주\s*요\s*어|키\s*워\s*드|기본\s*자료|논문\s*및\s*단행본|단행본|논문|기타\s*자료)[\s\p{P}\p{S}\d]*$/iu;
const KW = /^(\s*[^가-힣A-Za-z0-9]{0,3}(?:(?:국문|한글|영문)\s*)?(?:주\s*제\s*어|핵\s*심\s*어|주\s*요\s*어|키\s*워\s*드|key\s*-?\s*words?|keywords?)[^:：가-힣A-Za-z]{0,3}[:：]\s*)/i;
const HEAD = /^(\s*(?:[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]{1,3}\.?|[IVX]{1,4}\.|\d{1,2}(?:\.\d{1,2}){0,3}\.?|\d{1,2}\)|\(\d{1,2}\)|[①-⑳]|[가-하][.)])\s+)/;
const isLatin = (ch) => /[A-Za-z]/.test(ch || '');
const d = new HwpDocument(new Uint8Array(fs.readFileSync(input)));
const ctrlCount = () => (J(d.getControls()) || []).length;
const before = ctrlCount();
// 조종 문자 목록의 문단 번호는 문서 전체 번호다 — 구역·문단으로 바꾼다
const ctrlsWithSec = () => { const base = []; let acc = 0; for (let k = 0; k < d.getSectionCount(); k++) { base.push(acc); acc += d.getParagraphCount(k); } return (J(d.getControls()) || []).map((c) => { let sec = 0; while (sec + 1 < base.length && c.para >= base[sec + 1]) sec++; return { ...c, sec, para: c.para - base[sec] }; }); };
let paras = 0, notes = 0; const failed = [];
// 각주·미주 말고 다른 조종 문자(쪽 번호 위치·머리말·표·그림 등)가 있는 문단은 글자 삭제가 조종 문자까지 지울 수 있어, 아래 XML 단계에서 글자 조각만 바꾼다
const ctrlParas = new Set(ctrlsWithSec().filter((c) => c.ctrlId !== 'fn' && c.ctrlId !== 'en').map((c) => `${c.sec}:${c.para}`));
for (let s = 0; s < d.getSectionCount(); s++) {
  for (let i = 0; i < d.getParagraphCount(s); i++) {
    const L = d.getParagraphLength(s, i); if (!L) continue;
    if (ctrlParas.has(`${s}:${i}`)) continue;
    const text = d.getTextRange(s, i, 0, L); const cps = [...text];
    if (cps.length <= 30 && LABEL.test(text)) continue;
    const probe = Math.max(0, cps.findIndex((c) => /[가-힣A-Za-z0-9一-鿿぀-ヿ]/.test(c)));
    let keep, ph; let m;
    if ((m = KW.exec(text))) { keep = [...m[1]].length; ph = isLatin(cps[probe]) ? 'sample, text' : '견본, 시험'; }
    else if (cps.length <= 60 && (m = HEAD.exec(text)) && /[가-힣A-Za-z]/.test(text.slice(m[0].length))) { keep = [...m[1]].length; ph = isLatin(cps[keep]) ? 'Title' : '제목'; }
    else { keep = probe; ph = isLatin(cps[probe]) ? 'Sample text.' : '견본 문장입니다.'; }
    if (keep >= L) continue;
    // 문단 안 조종 문자(각주·표·그림) 자리는 지우지 않는다
    const ctrl = [];   // 조종 문자 pos는 글자 좌표와 단위가 달라 쓰지 않는다(엔진의 글자 삭제는 조종 문자를 남긴다 — 실행 뒤 개수로 확인)
    while (ctrl.includes(keep) && keep < L - 1) keep++;
    if (ctrl.includes(keep)) continue;
    // 첫 글자 뒤에 넣어 그 글자의 모양을 물려받게 한 뒤, 나머지와 첫 글자를 지운다
    const at = keep + 1; d.insertText(s, i, at, ph);
    const phLen = [...ph].length; const end = L + phLen;
    const cuts = []; let hi = end; for (const p of ctrl.filter((p) => p > keep).map((p) => p + phLen).sort((a, b) => b - a)) { if (p < hi) cuts.push([p, hi]); hi = p; } if (at + phLen < hi) cuts.push([at + phLen, hi]);
    for (const [a, b] of cuts) if (b > a) { try { d.deleteText(s, i, a, b - a); } catch { failed.push(`${s}:${i}`); } }
    try { d.deleteText(s, i, keep, 1); } catch { failed.push(`${s}:${i}`); }
    paras++;
  }
}
// 나머지 글자(쪽 머리말·꼬리말, 각주·미주, 표, 글상자, 그림 설명 등)는 HWPX XML에서 문단 단위로 바꾼다.
// 이미 견본이 된 문단과 표지 문단은 그대로 두고, 그 밖의 문단은 첫 글자 조각만 견본으로 두고 나머지를 비운다
const JSZip = (await import('jszip')).default;
const zip = await JSZip.loadAsync(d.exportHwpx());
// 이미 견본이 된 문단: 앞의 표지(주제어 머리말)·장절 번호·기호를 빼면 견본 문구만 남는 문단. 견본 낱말이 일부 들어 있을 뿐인 원문(‘Sample analysis by …’)은 다시 정제한다
const PH_WORD = '(?:견본 문장입니다\\.|Sample text\\.|견본, 시험|sample, text|각주 견본\\.|Sample note\\.|제목|Title|견본|Sample)';
const PH_ONLY = new RegExp(`^${PH_WORD}(?:\\s*${PH_WORD})*[\\s\\p{P}\\p{S}]*$`, 'u');
const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const isPlaceholder = (T) => { const m = KW.exec(T) || HEAD.exec(T); const rest = (m ? T.slice(m[0].length) : T).replace(/^[\s\p{P}\p{S}]*/u, ''); return PH_ONLY.test(rest); };
let xmlParas = 0;
for (const name of Object.keys(zip.files).filter((n) => /^Contents\/section\d+\.xml$/.test(n))) {
  const x = await zip.file(name).async('string');
  const TOK = /<(\/?)hp:(p|t)\b([^>]*?)(\/?)>/g;
  const stack = []; const paras2 = []; let m;   // 문단마다 글자 조각 [시작, 끝] 목록
  while ((m = TOK.exec(x))) {
    const [, close, tag, , self] = m;
    if (tag === 'p') { if (self) continue; if (!close) { stack.push({ spans: [] }); } else { const pg = stack.pop(); if (pg) paras2.push(pg); } continue; }
    if (close || self) continue;
    const end = x.indexOf('</hp:t>', TOK.lastIndex); if (end < 0) break;
    if (stack.length) stack[stack.length - 1].spans.push([TOK.lastIndex, end]);
    TOK.lastIndex = end;
  }
  const edits = [];
  for (const pg of paras2) {
    const parts = pg.spans.map(([a, b]) => x.slice(a, b).replace(/<[^>]+>/g, ''));
    const T = unesc(parts.join('')).trim(); if (!T) continue;
    if (isPlaceholder(T) || ([...T].length <= 30 && LABEL.test(T))) continue;
    let first = true;
    pg.spans.forEach(([a, b], k) => { if (!parts[k].trim()) return; edits.push([a, b, first ? (/^[^가-힣一-鿿぀-ヿ]*[A-Za-z]/.test(parts[k]) ? 'Sample' : '견본') : '']); first = false; });
    xmlParas++;
  }
  edits.sort((p, q) => q[0] - p[0]);
  let out = x; for (const [a, b, r] of edits) out = out.slice(0, a) + r + out.slice(b);
  out = out.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, 'sample@example.org');   // 하이퍼링크 필드(mailto:) 등 속성에 남은 이메일
  zip.file(name, new TextEncoder().encode(out));
}
const d2 = new HwpDocument(await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }));
const after = (J(d2.getControls()) || []).length;
fs.writeFileSync(output, d2.exportHwp()); d2.free();
console.log(`문단 ${paras}개 견본화, 그 밖의 문단(머리말·각주·표·글상자 등) ${xmlParas}개 비움. 조종 문자 ${before} → ${after}`);
// 남은 글자 점검(본문·각주)
const o = new HwpDocument(new Uint8Array(fs.readFileSync(output)));
const left = new Set();
for (let s = 0; s < o.getSectionCount(); s++) for (let i = 0; i < o.getParagraphCount(s); i++) { const L = o.getParagraphLength(s, i); if (L) left.add(o.getTextRange(s, i, 0, L).trim()); }
{ const base = []; let acc = 0; for (let k = 0; k < o.getSectionCount(); k++) { base.push(acc); acc += o.getParagraphCount(k); } for (const c of J(o.getControls()) || []) { if (c.ctrlId !== 'fn' && c.ctrlId !== 'en') continue; let s = 0; while (s + 1 < base.length && c.para >= base[s + 1]) s++; try { const r = J(o.getFootnoteInfo(s, c.para - base[s], c.controlIndex)); for (const t of (r && r.texts) || []) left.add('[주] ' + t.trim()); } catch { left.add('[주 읽기 실패]'); } } }
console.log([...left].filter(Boolean).slice(0, 400).join(' | '));
