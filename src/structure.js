// 구조 인식 — 규칙(정규식·서식 단서)만으로 문단의 역할을 정한다. AI 없음.
import { ROLE_DEFS, SECTION_LABELS } from './journals.js';

const ROLE_GROUP = Object.fromEntries(ROLE_DEFS.map((r) => [r.id, r.group]));
export const roleLabel = (id) => (ROLE_DEFS.find((r) => r.id === id) || { label: id }).label;

const RE = {
  tocHead: /^[^가-힣A-Za-z0-9\sⅠ-Ⅻ]{0,3}\s*(목\s*차|차\s*례)\s*[^가-힣A-Za-z0-9\s]{0,3}$/,
  abstractHead: /^[^가-힣A-Za-z0-9\sⅠ-Ⅻ]{0,3}\s*((국문|한글|논문)\s*)?(초\s*록|요\s*약|개\s*요)(\s*문)?\s*[^가-힣A-Za-z0-9\s]{0,3}$/,
  abstractEnHead: /^[^가-힣A-Za-z0-9\sⅠ-Ⅻ]{0,3}\s*(abstract|summary|english\s*abstract)\s*[^가-힣A-Za-z0-9\s]{0,3}$/i,
  refHead: /^[^가-힣A-Za-z0-9\s]{0,3}\s*(참\s*고\s*문\s*헌|[參参]\s*考\s*文\s*[獻献]|참\s*고\s*자\s*료|인\s*용\s*문\s*헌|참\s*고\s*및\s*인\s*용\s*문\s*헌|references|bibliography|works\s+cited)(?:\s*[^가-힣A-Za-z0-9\s(]){0,3}(\s*\(.*\))?$/i,
  keywords: /^(?:[^가-힣A-Za-z0-9\sⅠ-Ⅻ]{0,3}\s*(?:국문\s*|한글\s*)?(?:주\s*제\s*어|핵\s*심\s*어|키\s*워\s*드|색\s*인\s*어|주\s*요\s*어|중\s*심\s*어)\s*(?:(?:[(（][^()（）]{1,24}[)）]\s*)?[^가-힣A-Za-z0-9\s:：(（\[【〔「『<〈‘“,.;·、]{0,2}\s*[:：〻￨|;；]|[^가-힣A-Za-z0-9\s:：(（\[【〔「『<〈‘“’”'",.;·、]{1,3}(?=\s|$))|[\[【〔]\s*(?:주\s*제\s*어|핵\s*심\s*어|키\s*워\s*드|색\s*인\s*어|주\s*요\s*어|중\s*심\s*어)\s*[\]】〕])/,
  keywordsEn: /^(?:[^가-힣A-Za-z0-9\sⅠ-Ⅻ]{0,3}\s*key[\s〻]*-?[\s〻]*words?\s*(?:(?:[(（][^()（）]{1,24}[)）]\s*)?[^가-힣A-Za-z0-9\s:：(（\[【〔「『<〈‘“,.;·、]{0,2}\s*[:：〻￨|;；]|[^가-힣A-Za-z0-9\s:：(（\[【〔「『<〈‘“’”'",.;·、]{1,3}(?=\s|$))|[\[【〔]\s*key\s*-?\s*words?\s*[\]】〕])/i,
  refSub: /^(<\s*)?\d+\s*[.)]\s*(기본\s*자료|자\s*료|단행본|논문|논저|기타|국내|국외|해외|신문|웹|사료|작품|1차|2차|참고\s*자료)/,
  h1Num: /^(제\s*)?\d{1,2}\s*[.．장]\s*(?![\d.])\S/,
  h1Roman: /^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\s*[.．、]?\s*\S|^[IVX]{1,4}\s*[.．]\s+\S/,
  h2: /^\d{1,2}\s*[.．\-]\s*\d{1,2}(?:\s*[.．)]\s*|\s+)(?![\d.%％])\S|^\d{1,2}\s*[)）]\s*\S/,
  h3: /^\d{1,2}\s*[.．]\s*\d{1,2}\s*[.．]\s*\d{1,2}\s*[.．]?\s*\S|^[(（]\s*\d{1,2}\s*[)）]\s*\S/,
  h4: /^[①-⑳㉠-㉭]\s*\S|^[가나다라마바사아자차카타파하]\s*[.．)]\s+\S/,
  caption: /^[\[〔<＜(（〈]?\s*(표|그림|사진|도표|도|Table|Figure|Fig\.)\s*\d+/i,
  dates: /^[▮■□▪❙|｜*※\[(（]?\s*(?:논문\s*|원고\s*)?(?:최초\s*|최종\s*)?(?:(?:투고|접수|심사|게재|수정|채택)\s*(?:확정|완료|종료|결정|승인)?\s*일(?:자)?(?![가-힣])|수정\s*본\s*(?:접수|제출)일?)\s*[:：/)\]）]?/,
  subtitlePrefix: /^[\-–—⸺―:：]\s*\S/,
  author: /^[가-힣]{2,5}(\s*[*＊†‡]+)?(\s*[(（][^)）]{1,40}[)）])?(\s*[*＊]+)?\s*$|^[가-힣]{2,5}\s*[·,]\s*[가-힣]{2,5}(\s*[*＊]+)?\s*$/,
  authorEn: /^[A-Z][a-z]+([\-\s][A-Z]?[a-z]+)*,?\s*[A-Z][A-Za-z\-]+(\s*[A-Z][a-z]+)?(\s*[*＊]+)?(\s*[(（][^)）]{1,60}[)）])?\s*$/,
  latin: /^[\x00-\x7FÀ-ɏ‐-‧‰-⁞\s]+$/,
  journalNameLine: /^(Journal of|The Journal|Studies|Review)\b/i,
};
const hasHangul = (s) => /[가-힣]/.test(s);
const authorEnLike = (t) => RE.authorEn.test(t) && t.split(/\s+/).length <= 4 && !/\b(of|in|the|and|for|on|to|with|from|an?|as|by|between|through|towards?)\b/i.test(t);   // 낱말 4개 이하만 영문 이름으로(대문자로 시작하는 영문 제목이 이름으로 잡히지 않게)
const trimmed = (p) => (p.text || '').replace(/\s+/g, ' ').trim();

export function recognize(paragraphs, journal) {
  const blocks = [];
  // 본문 글자 크기(최빈값) — 인용문 판별 단서
  const sizes = {}; for (const p of paragraphs) if (p.size && trimmed(p).length > 40) sizes[p.size] = (sizes[p.size] || 0) + 1;
  const bodySize = +(Object.entries(sizes).sort((a, b) => b[1] - a[1])[0] || [0])[0];
  // 본문 왼쪽 여백(최빈값) — 원고 전체에 여백이 걸린 경우 그 값을 기준으로 인용문을 가른다
  const margins = {}; for (const p of paragraphs) if (trimmed(p).length > 80) { const m = Math.round(p.marginLeft || 0); margins[m] = (margins[m] || 0) + 1; }
  const bodyMargin = +(Object.entries(margins).sort((a, b) => b[1] - a[1])[0] || [0])[0];
  // 점선·쪽번호로 끝나는 목차 줄. 본문 중에는 앞뒤 줄도 그런 꼴이거나, 장 번호로 시작하거나, 점선이 열 개 이상일 때만 목차로 본다(본문 속 짧은 점선 한 줄은 그대로)
  const dotted = (x) => /(?:[·‧⋅․…⋯.\-─_]\s*){5,}\s*\d{1,4}\s*$/.test(x) || /[가-힣A-Za-z0-9)\]>]\s*(?:[·‧⋅․…⋯.]\s*){8,}\s*(?:[ⅰ-ⅿⅠ-Ⅻ]{1,4}|[ivxIVX]{1,5})?\s*$/.test(x);   // 쪽 번호가 로마자이거나 없는 점선 줄(앞쪽 쪽번호 정리 뒤)도 목차 줄
  const dottedNear = (k) => { for (const dir of [-1, 1]) { let r = k + dir; for (let seen = 0; paragraphs[r] && seen < 2; r += dir) { const x = trimmed(paragraphs[r]); if (!x) continue; if (dotted(x)) return true; seen++; } } return false; };   // 앞뒤 두 줄(빈 줄 빼고) 안에 목차 줄이 있으면 목차 묶음
  const indented = (p) => (p.marginLeft || 0) >= 8 && (p.marginLeft || 0) >= bodyMargin + 8;
  const sentenceEnd = (t) => /(다|요|함|임|음|까|네|죠)\s*[.．]$/.test(t);
  let state = 'front';     // front → toc → abstractKo → body → references → abstractEn
  let refSubLast = 0;   // 참고문헌 번호 소분류의 마지막 번호
  let h4Idx = -1;   // 가나다 목록의 마지막 글자 위치(장·절·항이 바뀌면 처음부터)
  let lastRole = ''; let sawTitle = false, sawBody = false, lastWasHeading = false, inQuoteRun = false;
  const headingLike = (t) => RE.h1Num.test(t) || RE.h1Roman.test(t) || RE.h2.test(t) || RE.h3.test(t);
  // 다음 비어 있지 않은 문단 번호를 미리 계산해 둔다(문단마다 slice·find를 하면 2만 문단 원고에서 O(n²)로 멈춘다)
  const nextNonEmpty = new Array(paragraphs.length).fill(-1);
  for (let i = paragraphs.length - 2, nx = -1; i >= 0; i--) { if (trimmed(paragraphs[i + 1])) nx = i + 1; nextNonEmpty[i] = nx; }

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i]; const t = trimmed(p);
    const push = (role, reason) => { if (role !== 'blank') lastRole = role; blocks.push({ role, text: p.text, runs: p.runs, footnotes: p.footnotes, src: i, reason, auto: true }); lastWasHeading = /^h[1-4]$/.test(role); if (/^h[123]$/.test(role)) h4Idx = -1; if (!/^(quote|source|blank)$/.test(role)) inQuoteRun = false; };
    if (!t && p.footnotes && p.footnotes.length) { push('body', '글 없이 각주만 있는 문단'); continue; }
    if (!t) { if (blocks.length) blocks.push({ role: 'blank', text: '', runs: [], footnotes: [], src: i, reason: '원고의 빈 줄', auto: true }); continue; }
    const short = t.length <= 60;
    const next = nextNonEmpty[i] >= 0 ? paragraphs[nextNonEmpty[i]] : null; const nt = next ? trimmed(next) : '';

    // ── 경계 제목들 (상태 전환)
    if (RE.tocHead.test(t)) { state = 'toc'; push('tocHead', '목차 제목'); continue; }
    if (state === 'toc' && (RE.refHead.test(t) || RE.abstractEnHead.test(t) || RE.abstractHead.test(t))) { const hk = (x) => x.replace(/[^가-힣A-Za-z0-9]/g, '').toLowerCase(); const key = hk(t); let again = false; for (let q = i + 1; q < paragraphs.length; q++) if (hk(trimmed(paragraphs[q])) === key) { again = true; break; }
      if (!again && blocks.some((b) => /^(refHead|abstractHead|abstractEnHead)$/.test(b.role) && hk(trimmed({ text: b.text })) === key)) again = true;   // 앞에 같은 제목이 이미 제목으로 나왔으면 이것은 목차 항목(목차가 초록 뒤에 오는 원고). 비교는 대소문자·기호 무시
      if (again) { push('toc', '목차 항목(같은 제목이 뒤에 다시 나옴)'); continue; } }   // 목차 속 ‘참고문헌’·‘Abstract’ 항목은 경계 제목이 아니다
    // 목차 맨 끝의 ‘참고문헌’·‘Abstract’ 항목(뒤에 장 제목·다른 끝 항목이 바로 옴)은 목차 항목이다. ‘초록’ 제목은 목차 바로 뒤 구조화된 초록과 헷갈릴 수 있어 여기서 다루지 않는다
    if (state === 'toc' && short && (RE.refHead.test(t) || RE.abstractEnHead.test(t)) && nt && nt.length <= 40 && (headingLike(nt) || RE.refHead.test(nt) || RE.abstractEnHead.test(nt) || /^[가-힣](?:\s[가-힣]){1,5}$/.test(nt))) { push('toc', '목차 항목(끝 제목)'); continue; }
    if (RE.abstractHead.test(t) && !/^[Ⅰ-Ⅻ①-⑳㉠-㉭\d]/.test(t) && !(sawBody && blocks.some((b) => b.role === 'abstractHead'))) { state = 'abstractKo'; push('abstractHead', '국문초록 제목'); continue; }   // 번호 매김 기호로 시작하면 초록 머리가 아니다. 본문이 시작된 뒤 두 번째 초록 머리는 보지 않는다
    if (RE.abstractEnHead.test(t)) { state = 'abstractEn'; push('abstractEnHead', 'Abstract 제목'); continue; }
    if (RE.refHead.test(t)) { state = 'references'; refSubLast = 0; push('refHead', '참고문헌 제목'); continue; }
    const kwHead = RE.keywords.exec(t) || RE.keywordsEn.exec(t);
    const kwItems = kwHead ? t.slice(kwHead[0].length).replace(/[.．。!?！？]\s*["”’'」』)]*\s*$/, '').split(/[,，、;；·・ㆍ\/]/).map((x) => x.trim()).filter(Boolean) : [];
    const kwPred = (x) => { const w = (x || '').split(/\s+/); const z = w.at(-1) || ''; const jg = z ? (z.charCodeAt(z.length - 1) - 0xAC00) % 28 : -1;   // 서술어로 끝나는 조각: ‘범주이다’·‘범주였다’·‘범주라는 것’·‘고를 것인가’·‘범주를 다룸’·‘다음과 같음’
      const pv = w.at(-2) || '';   // ‘정치적인 것’·‘시적 모호함’·‘함께 있음’·‘국가 이념’은 주제어 낱말이다
      return /(?:이다|였다|이었다|한다|했다|된다|됐다|있다|없다|같다|인가|는가|던가|을까|일까)$/.test(z) || (z === '것' && /(?:라는|다는|하는|되는)$/.test(pv)) || (w.length >= 2 && (/다$/.test(z) || (/^(?:같음|있음|없음)$/.test(z) && /[이가과와]$/.test(pv)) || (jg === 16 && (/(?:을|를|으로|로|에서|에게)$/.test(pv) || (/[이가은는도]$/.test(pv) && /(?:임|함|됨)$/.test(z)))))); };
    const kwEnVerb = (x) => { const w = x.split(/\s+/); const ev = (y) => /^(?:is|are|was|were|has|have|had|we)$/i.test(y); return w.length >= 2 && (ev(w[0]) || (w.length >= 4 && w.slice(1).some(ev))); };   // ‘we discuss A’·‘is broad’
    const kwList = kwItems.length >= 2 && kwItems.every((x) => x.length <= 24 && x.split(/\s+/).length <= 4 && !kwEnVerb(x)) && !kwPred(kwItems.at(-1));   // ‘가상, 시험, 문학.’처럼 쉼표로 이은 짧은 낱말은 주제어 목록이다(끝에 마침표가 있어도)
    const kwSentence = /[.．。!?！？]\s*["”’'」』)]*\s*$/.test(t) && !/^[^:：〻￨|;；]{0,28}[:：〻￨|;；]/.test(t) && !kwList && (/(?:다|요|까|죠|음|임|함)\s*[.．。!?！？]\s*["”’'」』)]*\s*$/.test(t) || kwPred(kwItems.at(-1)) || kwItems.some(kwEnVerb) || !/[,，、;；·・/]/.test(t));   // 머리말 뒤 구분 기호가 없고 문장 부호로 끝나면 본문 문장이다(‘「핵심어」 개념은 …이다.’)
    if (RE.keywords.test(t) && !kwSentence) { if (state === 'abstractEn') push('keywordsEn', '주제어(영문부)'); else {
        // 초록 제목 없이 주제어 줄이 나온 원고: 장 제목이 나오기 전 주제어 줄 바로 앞의 본문 덩어리는 초록이다(분량이 길면 건드리지 않는다)
        if (state !== 'abstractKo' && !blocks.some((b) => b.role === 'abstract' || b.role === 'abstractHead' || /^h[1-4]$/.test(b.role))) {
          let k = blocks.length - 1; while (k >= 0 && (blocks[k].role === 'blank' || blocks[k].role === 'affiliation')) k--;
          const run = []; for (; k >= 0 && (blocks[k].role === 'body' || blocks[k].role === 'blank'); k--) if (blocks[k].role === 'body') run.push(blocks[k]);
          while (run.length && (run.at(-1).text || '').trim().length < 35) run.pop();   // 앞쪽의 짧은 줄(부제·저자 쪽)은 초록이 아니다
          const chars = run.reduce((a, b) => a + (b.text || '').length, 0);
          if (run.length && chars <= 4000 && run.length <= 100) for (const b of run) { b.role = 'abstract'; b.reason = '주제어 줄 앞 본문(초록 제목 없음)'; }
        }
        push('keywords', '주제어'); if (state === 'abstractKo') state = 'afterAbstract'; } continue; }
    if (RE.keywordsEn.test(t) && !kwSentence) {
      if (state === 'references') {   // Abstract 제목 없이 참고문헌 뒤에 붙은 영문초록: Keywords 줄 바로 앞의 영문 서술 줄(한글·연도·쪽수·URL 표지 없음)을 영문초록으로
        const enProse = (b) => b.role === 'ref' && RE.latin.test(trimmed({ text: b.text })) && trimmed({ text: b.text }).length >= 3 && !/\b(?:1[5-9]|20)\d{2}\b|\bpp?\.|\bvol\.|\bno\.\s*\d|https?:|doi|\bibid\b/i.test(b.text);
        let k = blocks.length - 1; const run = [];
        for (; k >= 0 && (blocks[k].role === 'blank' || enProse(blocks[k])); k--) if (blocks[k].role !== 'blank') run.push(blocks[k]);
        if (run.length >= 4 && run.reduce((a, b) => a + (b.text || '').length, 0) >= 300) for (const b of run) { b.role = 'abstractEn'; b.reason = 'Keywords 앞 영문 줄(Abstract 제목 없음)'; }
      }
      push('keywordsEn', 'Keywords'); continue; }
    if (RE.dates.test(t) && (short || (t.length <= 160 && /(?:19|20)\d{2}\s*[.년\-]/.test(t)))) { push('dates', '투고·심사일'); continue; }
    const dottedToc = state !== 'references' && p.styleName !== 'quote' && !indented(p) && dotted(t) && (state === 'front' || state === 'toc' || lastRole === 'toc' || dottedNear(i) || /(?:[·‧⋅․…⋯.\-─_]\s*){10,}\s*\d{0,4}\s*$/.test(t) || /^(?:[IVXⅠ-Ⅻ\d]{1,3}(?:[.．]\d{1,2})*[.．)]\s|제\s*\d+\s*[장절부]|[가-하][.．)]\s)/.test(t));
    const tocCont = state !== 'references' && t.length <= 140 && next && !dotted(t) && dotted(nt) && (lastRole === 'toc' || lastRole === 'tocHead') && !indented(p) && p.styleName !== 'quote';   // 목차 항목이 두 줄로 나뉜 앞줄(쪽 번호는 뒷줄에)
    if (tocCont) { push('toc', '목차 항목 이어짐(줄바꿈)'); continue; }
    if (RE.caption.test(t) && short && !dottedToc) { push('caption', '표·그림 제목'); continue; }

    // 점선·쪽번호로 끝나는 줄(‘1. 서론 ········ 3’)은 제목이 아니라 목차 항목이다(목차 제목이 없는 원고)
    if (state !== 'references' && p.styleName !== 'quote' && !indented(p) && dotted(t) && (state === 'front' || state === 'toc' || blocks.filter((b) => b.role !== 'blank').at(-1)?.role === 'toc' || dottedNear(i) || /(?:[·‧⋅․…⋯.\-─_]\s*){10,}\s*\d{0,4}\s*$/.test(t) || /^(?:[IVXⅠ-Ⅻ\d]{1,3}(?:[.．]\d{1,2})*[.．)]\s|제\s*\d+\s*[장절부]|[가-하][.．)]\s)/.test(t))) { if (state === 'front') state = 'toc'; push('toc', '점선·쪽번호 목차 항목'); continue; }

    // ── 앞부분: 제목·부제·저자
    if (state === 'front') {
      // PDF에서 뽑은 원고의 머리말(DOI·URL·ISSN·학술지명·권호·쪽수 범위·저작권 표시)은 제목이 아니다
      if (!sawTitle && (/doi\.org|https?:\/\/|www\.|ISSN|©|ⓒ|\bVol\.|\bNo\.\s*\d|\bpp\.\s*\d|제\s*\d+\s*(집|호|권)\s*[,(]|\d{4}\s*[.년]\s*\d{1,2}\s*[.월]/i.test(t) || /^(http|doi|issn|e-issn|print)/i.test(t)) && t.length < 160 && !(nt && RE.author.test(nt))) { push('skip', '원고 머리말·식별자(제목 아님)'); continue; }   // 다음 줄이 이름 꼴이면 연월·URL이 든 제목이다
      if (!sawTitle) { sawTitle = true; push('title', '첫 문단'); continue; }
      const prev = blocks.filter((b) => b.role !== 'blank').at(-1);
      if (RE.subtitlePrefix.test(t) && short) { push(prev && /En$/.test(prev.role) ? 'subtitleEn' : 'subtitle', '부제 기호로 시작'); continue; }
      if (RE.latin.test(t) && short && !authorEnLike(t) && prev && /^(title|subtitle)$/.test(prev.role)) { push('titleEn', '영문 제목(제목 바로 뒤 라틴 문자)'); continue; }
      if (RE.author.test(t)) { push('author', '이름 형태'); continue; }
      if (/^[가-힣]\s[가-힣]\s[가-힣]\s*[*＊†‡]*(?:\s*[(（][^)）]{1,40}[)）])?\s*$/.test(t)) { push('author', '이름 형태(글자 사이 공백)'); continue; }
      if (authorEnLike(t) && prev && /En$/.test(prev.role)) { push('authorEn', '영문 이름 형태'); continue; }
      if (/^[*＊]\s*\S|^\*\*/.test(t) && t.length < 120) { push('affiliation', '별표 소속 표기'); continue; }
      if (sawTitle && blocks.some((b) => b.role === 'author') && t.length < 100 && !headingLike(t) && /(대학교?|대학원|연구소|연구원|학과|학부|박사|교수|강사|University|Institute|Department|College)/i.test(t)) { push('affiliation', '소속 표기(이름 뒤)'); continue; }
      // 목차가 제목 없이 바로 나오는 경우: 제목 형태 줄이 연속 2개 이상
      if (headingLike(t) && short && nt && headingLike(nt)) { state = 'toc'; push('toc', '연속된 제목 형태 줄(목차)'); continue; }
      if (headingLike(t) && short) { state = 'body'; /* 아래 본문 처리로 */ }
      else if (t.length > 120) { state = 'body'; }
      else if (sawTitle && !blocks.some((b) => b.role === 'author') && nt && RE.author.test(nt) && !RE.author.test(t)) { push('title', '제목 이어짐(다음 줄이 이름)'); continue; }   // 두 줄 제목
      else { push(sawTitle && !blocks.some((b) => b.role === 'author') ? 'author' : 'body', '앞부분 짧은 줄'); continue; }
    }

    // ── 목차
    if (state === 'toc') {
      const tkey = (x) => x.replace(/\s+/g, '').replace(/[·‧⋅․…⋯.\-─_]*\d{0,4}$/, ''); const tocTexts = blocks.filter((b) => b.role === 'toc').map((b) => tkey(b.text));   // 점선·쪽 번호를 뺀 꼴로 비교
      if (headingLike(t) && short && tocTexts.includes(tkey(t))) state = 'body';   // 목차에 이미 있는 제목이 다시 나오면 본문이 시작된 것
      else if (headingLike(t) && short) { push('toc', '목차 항목'); continue; }
      if (short && !sawBody && nt && headingLike(nt)) { push('toc', '목차 항목'); continue; }
      state = 'body';
    }

    // ── 국문초록 (장 번호 형태의 줄이 나오면 초록이 끝난 것으로 본다 — 주제어 줄이 없는 원고)
    if (state === 'abstractKo') {
      if (short && (RE.h1Num.test(t) || RE.h1Roman.test(t)) && !sentenceEnd(t) && !(/^[Ⅰ-Ⅻ]+[가-힣]/.test(t) && t.length > 30)) state = 'body';
      else if (/^[*＊†‡]{1,2}\s*\S/.test(t) && t.length < 160 && /(대학|연구소|연구원|학과|학부|교수|박사|강사|@|University|Institute|Department|교신|e-?mail)/i.test(t)) { push('affiliation', '별표 소속·교신 표기(국문초록부)'); continue; }
      else { let ac = 0; for (let k = blocks.length - 1; k >= 0 && /^(abstract|affiliation|blank)$/.test(blocks[k].role); k--) ac += (blocks[k].text || '').length;   // 국문초록이 4500자를 넘으면 본문이 초록으로 빨려 든 것(주제어·장 제목이 없는 원고)
        if (ac > 4500) state = 'body'; else { push('abstract', '국문초록 본문'); continue; } }
    }
    if (state === 'afterAbstract') { state = 'body'; }

    // ── 참고문헌
    if (state === 'references') {
      const pbk = (() => { let k = blocks.length - 1; while (k >= 0 && blocks[k].role === 'blank') k--; return k >= 0 ? blocks[k] : null; })();
      const pbt = pbk ? trimmed({ text: pbk.text }) : '';
      if (RE.refSub.test(t) && short) { refSubLast = +(/\d+/.exec(t) || [0])[0]; push('refSub', '참고문헌 분류'); continue; }
      const subNum = /^(\d+)\s*[.)]/.exec(t); const subOne = /^[가-힣A-Za-z]{1,12}$/.test(t);   // 줄바꿈 조각(쪽 번호 ‘212.’, 저자 이름·제목 끝 낱말)이 소분류가 되지 않게: 번호는 1 또는 앞 번호+1, 한 낱말은 분류어이거나 앞 줄이 마침표·숫자·닫는 괄호로 끝날 때만
      const subCat = /^(?:단행본|논문|논저|자료|기타|신문|웹|사료|작품|국내|국외|해외|외국|국문|영문|한국|일본|중국|서양|동양|저서|연구|학위|보고서|잡지|인터넷|기사|문헌|서적|도서|국내서|국외서|동양서|서양서|국내문헌|국외문헌|해외문헌|외국문헌|동양문헌|서양문헌|참고자료|기본자료|Korean|English|Japanese|Chinese|Books?|Articles?|Journals?|Web|Others?|Primary|Secondary|Sources?)$/i.test(t);
      const subOk = subNum ? (+subNum[1] === 1 || +subNum[1] === refSubLast + 1) : subOne ? (subCat || !pbk || /^(refHead|refSub)$/.test(pbk.role) || /[.。)\]”’"'」』\d]$/.test(pbt)) : true;
      if (short && subOk && /^(\d+\s*[.)]|[<＜]\s*\d|[가-힣A-Za-z]{1,12}\s*$)/.test(t) && !/[,，]/.test(t) && !/^(?:1[5-9]|20)\d{2}\b/.test(t) && !(nt && /^[가-힣A-Za-z]{1,12}$/.test(t) && /^(?:1[5-9]|20)\d{2}\s*[.)．]/.test(nt))) { if (subNum) refSubLast = +subNum[1]; push('refSub', '참고문헌 분류(짧은 소제목)'); continue; }   // 연도로 시작하는 줄, 바로 뒤가 연도로 시작하는 한 낱말(저자 이름)은 소분류가 아니다
      push('ref', '참고문헌 항목'); continue;
    }

    // ── 영문초록부 (영문초록이 본문 앞에 오는 원고도 있으므로, 국문 장 제목이나 한글 위주 긴 문단이 나오면 본문으로 돌아간다)
    if (state === 'abstractEn') {
      const enBlocks = blocks.slice(blocks.findLastIndex((b) => b.role === 'abstractEnHead') + 1).filter((b) => b.role !== 'blank');
      const hangulRatio = (t.match(/[가-힣]/g) || []).length / Math.max(1, t.replace(/\s/g, '').length);
      const latinChapter = short && /^(\d{1,2}|[IVX]{1,4})[.．]\s+[A-Z]/.test(t) && enBlocks.some((b) => b.role === 'keywordsEn' || b.role === 'abstractEn');   // 영문 논문: Keywords 뒤의 ‘1. Introduction’부터 본문
      if ((headingLike(t) && short && hasHangul(t) && !sentenceEnd(t)) || latinChapter || (hangulRatio > 0.5 && t.length > 60 && enBlocks.some((b) => b.role === 'abstractEn')) || (hangulRatio > 0.5 && t.length >= 20 && enBlocks.some((b) => b.role === 'abstractEn') && blocks.some((b) => b.role === 'author') && nt.length >= 10 && ((nt.match(/[가-힣]/g) || []).length / Math.max(1, nt.replace(/\s/g, '').length)) > 0.5)) { state = 'body'; }   // 국문 저자·제목이 이미 나온 원고에서 영문초록 뒤 한글 줄이 두 줄 이어지면(한 줄만 낀 쪽 머리말은 그대로) 본문으로 돌아간다
      else if (hangulRatio > 0.5 && t.length <= 40 && !sentenceEnd(t) && enBlocks.some((b) => b.role === 'keywordsEn' || b.role === 'abstractEn') && !blocks.some((b) => b.role === 'author')) {
        // 영문초록·Keywords 뒤에 한글 줄이 처음 나오면 앞부분(국문 제목·저자)이 시작된 것으로 본다. 앞서 잡은 라틴 문자 제목은 영문 제목으로 돌린다.
        const tb = blocks.find((b) => b.role === 'title'); if (tb && RE.latin.test(trimmed({ text: tb.text }))) { tb.role = 'titleEn'; tb.reason = '영문 제목(국문 제목이 뒤에 옴)'; sawTitle = false; }
        state = 'front'; i--; continue;   // 같은 줄을 앞부분 규칙으로 다시 본다
      } else {
      const prevKw = blocks.filter((b) => b.role !== 'blank').at(-1);
      const kwRun = (() => { let n = 0; for (let k = blocks.length - 1; k >= 0 && (blocks[k].role === 'blank' || blocks[k].role === 'keywordsEn'); k--) if (blocks[k].role === 'keywordsEn') n++; return n; })();   // 이어짐은 세 줄까지
      const kwWords = t.split(/\s+/).length; const kwPrevText = prevKw ? trimmed({ text: prevKw.text }) : '';
      // 마침표로 끝나는 세 단어 이상의 서술문(‘Readers interpret narrative.’)은 이어짐이 아니다. 서술문 근거: 대문자로 시작하고 둘째 낱말이 관사·전치사·접속사가 아닌 소문자 낱말
      // (‘the narrative self.’·‘the theory of fiction.’ 같은 마지막 명사구 주제어는 이어짐으로 둔다)
      // 판정: 대문자로 시작하고(‘In …’·‘AI …’·‘I …’ 포함) 첫 낱말 뒤에 관사·전치사·접속사가 아닌 소문자 낱말이 하나라도 있으면 서술문. 모든 낱말이 대문자로 시작하는 제목형 명사구와 소문자로 시작하는 이어진 조각은 주제어
      const kwW = t.replace(/[.!?]["”’')\]]*$/, '').split(/\s+/); const kwProse = /[.!?]["”’')\]]*$/.test(t) && kwWords >= 3 && !/[,;，；]/.test(t) && /^[A-Z]/.test(t) && kwW.slice(1).some((w) => /^[a-z]/.test(w) && !/^(?:of|the|a|an|and|or|in|on|for|to|with|as|at|by|from|into|between|versus|vs)$/i.test(w));
      if (prevKw && prevKw.role === 'keywordsEn' && kwRun <= 3 && !kwProse && RE.latin.test(t) && t.length <= 100 && !/^[*＊\d]/.test(t) && !/\b(?:is|are|was|were|has|have|we)\b/i.test(t) && !/[.!?]["”’')\]]*$/.test(kwPrevText) && ((/[,;，；]$/.test(kwPrevText) && kwWords <= 12) || (kwPrevText.length >= 45 && ((kwWords <= 4 && !/[.!?]["”’')\]]*$/.test(t)) || (/[,;，；]/.test(t) && kwWords <= 12 && !/[.!?]["”’')\]]*$/.test(t)))))) { push('keywordsEn', 'Keywords 이어짐(줄바꿈)'); continue; }   // 영문 주제어가 두 줄로 나뉜 경우
      if (!enBlocks.some((b) => b.role === 'titleEn2') && short && RE.latin.test(t) && !authorEnLike(t) && !/[.!?。！？]["”’'」』)\]}]*\s*$/.test(t)) { push('titleEn2', '영문 제목(초록부)'); continue; }
      if (RE.subtitlePrefix.test(t) && short && RE.latin.test(t)) { push('subtitleEn', '영문 부제'); continue; }
      if (authorEnLike(t) || (short && /^[A-Z][a-z]+,\s*[A-Z]/.test(t))) { push('authorEn', '영문 이름'); continue; }
      if (RE.journalNameLine.test(t) && short) { push('skip', '학술지명(바탕틀 예시 문구)'); continue; }
      if (/^[*＊†‡]{1,2}\s*\S/.test(t) && t.length < 160 && /(대학|연구소|연구원|학과|학부|교수|박사|강사|@|University|Institute|Department|College|교신|e-?mail)/i.test(t)) { push('affiliation', '별표 소속·교신 표기(영문초록부)'); continue; }
      push('abstractEn', '영문초록 본문'); continue;
      }
    }

    // ── 본문
    sawBody = true;
    // 제목 후보: 짧고, 문장처럼 끝나지 않으며, 인용문처럼 들여쓴 줄(목록 번호 "2-4) …다.")은 제외
    // 각주 본문처럼 보이는 줄("1) 김철수, 「…」, 『…』, 2019, 12쪽.")과 "다. 그러나 …" 같은 줄바꿈 조각은 제목 후보에서 뺀다
    const citationLike = /[「｢『󰡔]/.test(t) || (/\b(1[89]|20)\d{2}\b/.test(t) && /\d\s*(쪽|면)|pp?\.\s*\d/.test(t));
    const noteLike = /https?:\/\/|www\./i.test(t) || /(?:\d|\))\s*(?:쪽|면)\s*[.)]?\s*$/.test(t) || /\bpp?\.\s*[\d\-–~∼\s,]+\.?\s*$/i.test(t) || /(?:앞의|위의|같은|동일한)\s*(?:책|글|논문|논저)|\b(?:ibid|op\.\s*cit)\b/i.test(t) || ((t.match(/[,，]/g) || []).length >= 2 && (/\b(?:1[5-9]|20)\d{2}\b/.test(t) || /[.。]\s*$/.test(t))) || (/^\d{1,2}\s*[)）]/.test(t) && ((/^\d{1,2}\s*[)）]\s*[“"]/.test(t) && t.length >= 40) || (t.match(/[.。]\s+\S/g) || []).length >= 2 || /(?:1[5-9]|20)\d{2}(?:\s*[-–~]\s*\d{1,4})?\s*[.。]\s*$/.test(t)));   // 쪽 끝맺음·URL·‘앞의 책’·쉼표가 많은 서지 꼴 = 각주 글(제목 아님)
    const headCand = short && !noteLike && !sentenceEnd(t) && !(indented(p) && t.length > 30) && !citationLike && !(/^[Ⅰ-Ⅻ]+[가-힣]/.test(t) && t.length > 30);   // ‘Ⅱ장에서는 …’처럼 로마자 바로 뒤에 한글이 붙은 30자 넘는 줄은 문장 조각(초록 속 장 소개)
    if (headCand && RE.h3.test(t)) { push('h3', '항 번호'); continue; }
    if (headCand && RE.h2.test(t)) { push('h2', '절 번호'); continue; }
    if (headCand && (RE.h1Num.test(t) || RE.h1Roman.test(t))) { push('h1', '장 번호'); continue; }
    const hl = headCand ? /^([가나다라마바사아자차카타파하])\s*[.．)]\s+\S/.exec(t) : null; const hIdx = hl ? '가나다라마바사아자차카타파하'.indexOf(hl[1]) : -1;   // 줄바꿈 조각(‘다. 그러나 …’)이 목 번호로 잡히지 않게: 가나다 목록은 ‘가’로 시작하거나 바로 앞 글자 다음 글자여야 한다
    if (headCand && RE.h4.test(t) && !(hl && !(hIdx === 0 || hIdx === h4Idx + 1))) { if (hl) h4Idx = hIdx; push('h4', '목 번호'); continue; }
    if (p.level && p.level <= 4 && short) { push(`h${p.level}`, '마크다운 제목'); continue; }
    const quoteCue = p.styleName === 'quote' || indented(p) || (bodySize && p.size && p.size <= bodySize - 50 && t.length > 20);
    if (quoteCue) {
      if (inQuoteRun && short && (p.align === 'right' || /^[\-–—⸺―]/.test(t) || /『|』|「|」|󰡔/.test(t))) { push('source', '인용 출전'); inQuoteRun = true; continue; }
      push('quote', indented(p) ? '왼쪽 여백 들여쓰기' : '본문보다 작은 글자'); inQuoteRun = true; continue;
    }
    if (inQuoteRun && short && p.align === 'right') { push('source', '인용 출전(오른쪽 정렬)'); continue; }
    if (lastWasHeading && journal?.template?.roles?.bodyFirst) { push('bodyFirst', '장 첫 문단'); continue; }
    push('body', '본문');
  }
  return blocks;
}

// 역할 묶음(앞부분/목차/초록/본문/참고문헌/영문초록)을 학회 체재 순서로 재배열
export function reorderSections(blocks, journal) {
  const order = journal.structure || ['front', 'toc', 'abstractKo', 'body', 'references', 'abstractEn', 'tail'];
  const groups = {}; const seq = [];
  let cur = null;
  for (const b of blocks) {
    const g = b.role === 'blank' ? cur : (ROLE_GROUP[b.role] || 'body');
    if (b.role === 'skip') continue;
    if (g === null || g === undefined) continue;
    if (!groups[g]) { groups[g] = []; seq.push(g); }
    groups[g].push(b); cur = g;
  }
  // 일부 학회는 주제어를 참고문헌 뒤에 둔다 (예: 한국시학연구)
  if (journal.keywordsPosition === 'afterReferences' && groups.abstractKo) {
    const kw = groups.abstractKo.filter((b) => b.role === 'keywords');
    if (kw.length) { groups.abstractKo = groups.abstractKo.filter((b) => b.role !== 'keywords'); groups.references = [...(groups.references || []), ...kw]; if (!seq.includes('references')) seq.push('references'); }
  }
  // 주제어를 본문 뒤·참고문헌 앞에 두는 학회(예: 이상리뷰 ‘본문-주제어-참고문헌’)
  if (journal.keywordsPosition === 'beforeReferences' && groups.abstractKo) {
    const kw = groups.abstractKo.filter((b) => b.role === 'keywords');
    if (kw.length) { groups.abstractKo = groups.abstractKo.filter((b) => b.role !== 'keywords'); groups.references = [...kw, ...(groups.references || [])]; if (!seq.includes('references')) seq.push('references'); }
  }
  // 체재에 없는 묶음(원고의 목차·국문초록 등)은 끝으로 보내지 않고, 원고에서 바로 앞서던 체재 묶음 뒤에 둔다
  const after = {};
  const anchorOf = (g) => {   // 투고일(tail)은 끝, 목차는 앞부분(본문·참고문헌이 아닌 체재 묶음) 뒤, 그 밖은 원고에서 바로 앞서던 체재 묶음 뒤
    if (g === 'tail') return '$';
    const before = seq.slice(0, seq.indexOf(g)).filter((x) => order.includes(x));
    if (g === 'toc') { const bi = order.indexOf('body'); return before.filter((x) => x !== 'body' && x !== 'references' && (bi < 0 || order.indexOf(x) < bi)).at(-1) ?? '^'; }   // 이 학회가 본문 뒤에 두는 묶음(예: 참고문헌 뒤 국문초록) 뒤에는 두지 않는다
    return before.at(-1) ?? '^';
  };
  for (const g of seq) if (!order.includes(g)) (after[anchorOf(g)] ||= []).push(g);
  const out = [];   // spread는 문단 수만큼 인수를 쌓아 큰 원고에서 터진다
  for (const g of after['^'] || []) for (const b of groups[g]) out.push(b);
  for (const g of order) if (groups[g]) { for (const b of groups[g]) out.push(b); for (const x of after[g] || []) for (const b of groups[x]) out.push(b); }
  for (const g of after['$'] || []) for (const b of groups[g]) out.push(b);
  const outSeq = []; for (const b of out) { const g = ROLE_GROUP[b.role]; if (b.role !== 'blank' && g && outSeq.at(-1) !== g) outSeq.push(g); }   // 안내문은 실제 산출 순서로(체재 밖 묶음도 남아 있음)
  const srcSeq = []; for (const b of blocks) { if (b.role === 'blank' || b.role === 'skip') continue; const g = ROLE_GROUP[b.role] || 'body'; if (srcSeq.at(-1) !== g) srcSeq.push(g); }
  const changed = JSON.stringify(srcSeq) !== JSON.stringify(outSeq);
  // 묶음 경계의 빈 줄은 정리
  const cleaned = out.filter((b, i) => !(b.role === 'blank' && (i === 0 || i === out.length - 1)));   // 연속 빈 줄은 여기서 합치지 않는다(‘원고 빈 줄 유지’ 설정을 위해 applyBlanks가 정한다)
  return { blocks: cleaned, changed, from: srcSeq.map((g) => SECTION_LABELS[g] || g), to: outSeq.map((g) => SECTION_LABELS[g] || g) };
}

// 쪽수 표기 바로 앞 문헌의 언어: 쉼표로 나뉜 서지 칸을 뒤에서부터 보며 숫자·연도·권호가 아닌 첫 칸(발행처·학술지·‘위의 책’·‘Ibid.’)의 글자로 정한다.
// 국문 서술 안에 인용된 외국 논문(‘…논의는 John Smith, "…", Journal of Things 1(2), 2000, pp.10-20’)은 국외, 번역서(‘…, 『가상 번역서』, 가상사, 2010’)는 국문
function citeLang(before) {
  const tail = before.slice(before.lastIndexOf(';') + 1).slice(-200);
  const fields = tail.split(/[,，]/);
  for (let k = fields.length - 1; k >= 0; k--) {
    const f = fields[k].trim();
    if (!f || /^[\s\d().:\-–~/[\]·]*$/.test(f) || /^(vol|no|n)\.?\s*\d/i.test(f)) continue;
    if (/^(?:pp?\.\s*)?\d+(?:\s*[-~–—∼〜～－]\s*\d+)?\s*(?:쪽|면|頁)?\.?$/i.test(f)) continue;   // 같은 문헌의 앞 쪽수(‘p.12, p.14’의 p.12)는 언어 근거가 아니다
    if (/[가-힣぀-ヿ一-鿿]/.test(f)) return 'ko';   // 한글·한자·가나 서지는 국문 규정(동아시아 문헌)
    if (/[A-Za-zÀ-ɏ]/.test(f)) return 'lat';
  }
  return /[가-힣]/.test(tail) ? 'ko' : 'lat';
}

// 참고문헌·각주 글을 문헌 조각으로 나눈다: 구분자는 ‘; ’ 또는 ‘. ’ 뒤 라틴 저자(‘Smith, ’). 낫표·괄호·따옴표 안(제목 안의 ‘. Smith, ’)에서는 나누지 않는다. 결과는 [조각, 구분자, 조각, …]
const SEG_OPEN = '『「(（“《〈[【〔'; const SEG_CLOSE = '』」)）”》〉]】〕';
function splitCitationSegs(text) {
  // 인용 전체를 감싼 괄호 한 쌍(‘(가가가, …; Smith, …)’)은 벗기고 안을 나눈다 — 괄호 안에 국내·국외 문헌이 섞여 있을 수 있다
  const whole = /^(\s*[(（])([\s\S]*)([)）]\s*)$/.exec(text);
  if (whole) { let d = 0; let enclosesAll = true; for (let i = 0; i < whole[2].length; i++) { const ch = whole[2][i]; if (SEG_OPEN.includes(ch)) d++; else if (SEG_CLOSE.includes(ch)) { if (d === 0) { enclosesAll = false; break; } d--; } } if (enclosesAll && d === 0) return [whole[1], ...splitCitationSegs(whole[2]), whole[3]]; }
  const out = []; let seg = ''; let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (SEG_OPEN.includes(ch)) depth++; else if (SEG_CLOSE.includes(ch) && depth > 0) depth--;
    if (depth === 0) {
      const rest = text.slice(i);
      const m = /^;\s*/.exec(rest) || /^\.\s+(?=[A-Z][A-Za-z'’-]+,\s)/.exec(rest);
      if (m) { out.push(seg, m[0]); seg = ''; i += m[0].length - 1; continue; }
    }
    seg += ch;
  }
  out.push(seg);
  return out;
}

// 원고의 빈 줄 처리 + 학회 빈 줄 규칙 적용
export function applyBlanks(blocks, journal, { keepSourceBlanks = false } = {}) {
  const rules = journal.blanks || {};
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const isQ = (b) => !!b && /^(quote|source)$/.test(b.role);
  const nonBlank = (i, step) => { for (let k = i + step; k >= 0 && k < blocks.length; k += step) if (blocks[k].role !== 'blank') return blocks[k]; return null; };
  // 인용문 사이의 빈 줄(시의 연 구분, 이어진 두 인용)은 원고의 뜻이므로 기본 설정에서도 한 줄 남긴다
  const body = keepSourceBlanks ? blocks : blocks.filter((b, i) => b.role !== 'blank' || (isQ(nonBlank(i, -1)) && isQ(nonBlank(i, 1)) && blocks[i - 1]?.role !== 'blank'));
  const out = []; let inserted = 0;
  const want = (b, i) => { // b 앞에 넣을 빈 줄 수
    let n = 0; const prev = body[i - 1];
    if (!prev) return 0;
    // 같은 역할이 이어지는 자리(초록 단락 사이, 참고문헌 항목 사이, 본문 문단 사이)에는 before/after 규칙을 적용하지 않는다
    const sameRole = prev.role === b.role;
    const before = sameRole ? 0 : (rules[`before${cap(b.role)}`] || 0);
    const after = sameRole ? 0 : (rules[`after${cap(prev.role)}`] || 0);
    n = Math.max(before, after);
    // 인용문 앞뒤는 학회 규칙이 따로 없어도 한 줄 띄운다(국내 학술지의 일반 관행). 끄려면 blanks.aroundQuote: 0
    const aroundQuote = rules.aroundQuote ?? 1;
    if (b.role === 'quote' && prev.role !== 'quote' && aroundQuote) n = Math.max(n, aroundQuote);
    if (prev.role === 'quote' && b.role !== 'quote' && b.role !== 'source' && aroundQuote) n = Math.max(n, aroundQuote);
    if (prev.role === 'source' && !isQ(b) && aroundQuote) n = Math.max(n, aroundQuote);   // 출전 줄 뒤도 인용문 뒤와 같이 한 줄
    if (rules.afterTitleBlock && /^(title|subtitle|titleEn|subtitleEn|author|affiliation)$/.test(prev.role) && !/^(title|subtitle|titleEn|subtitleEn|author|affiliation)$/.test(b.role)) n = Math.max(n, rules.afterTitleBlock);
    if (rules.afterBodyBlock && /^(body|bodyFirst)$/.test(prev.role) && /^h[1-4]$/.test(b.role)) n = Math.max(n, rules.afterBodyBlock);
    return n;
  };
  body.forEach((b, i) => {
    if (b.role !== 'blank') { const n = want(b, i); let have = 0; for (let k = out.length - 1; k >= 0 && out[k].role === 'blank'; k--) have++; for (let k = have; k < n; k++) { out.push({ role: 'blank', text: '', runs: [], footnotes: [], reason: '학회 빈 줄 규칙', auto: true }); inserted++; } }
    out.push(b);
  });
  return { blocks: out, inserted, dropped: blocks.length - body.length };
}

// 치환 — 각주·참고문헌의 쪽수 표기, 낫표 형식
const PUA_OPEN = '\u{F0854}', PUA_CLOSE = '\u{F0855}';
export function applySubstitutions(blocks, journal, opts) {
  const changes = [];
  const unit = opts.pageUnit && opts.pageUnit !== 'keep' ? opts.pageUnit : null;
  const marks = opts.marks || 'keep';
  // 쪽수 범위 기호: 학회 각주·참고문헌 예시의 기호(국문 문헌 / 국외 문헌 pp. / 참고문헌의 국외 문헌). 설정이 없으면 원고대로 둔다
  const fr = (journal && journal.footnote) || {};
  const okSym = (x) => (typeof x === 'string' && /^[-~∼〜～–－]$/.test(x) ? x : null);
  const rangeKo = opts.pageRange === undefined ? okSym(fr.pageRange) : okSym(opts.pageRange);
  const pageSpace = fr.pageSpace === true && (unit === 'p.' || unit === 'pp.');
  const pageSpaceLatin = fr.pageSpaceLatin === true;   // 국외 문헌의 p./pp.만 한 칸(‘pp. 33－35’, 겨레어문학)
  const latSame = fr.pageUnitLatin === 'same';   // 국외 문헌도 국문과 같은 단위(‘…, 2019, 20~37면’, 문학교육학)
  const langOf = (before) => (latSame ? 'ko' : citeLang(before));
  const rangeLatin = okSym(fr.pageRangeLatin); const rangeRefLatin = okSym(fr.pageRangeRefLatin);
  // 치환마다 글자별 원래 위치(org)를 따라간다: 남는 글자(숫자 등)는 원래 좌표를 그대로 지니고, 새로 넣은 글자는 강조를 물려줄 원래 글자(eff)를 정한다
  // (같은 틈에서 지운 글자 → 그 locator의 숫자 아닌 남는 글자 → 그 locator에서 지운 글자 순). 외국 문헌 조각(세미콜론 구분)은 한글이 없으면 손대지 않는다.
  const lcsKeep = (a, b) => {
    const L = Array.from({ length: a.length + 1 }, () => new Int16Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const keep = new Array(b.length).fill(-1); let i = 0, j = 0;
    while (i < a.length && j < b.length) { if (a[i] === b[j]) { keep[j] = i; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    return keep;
  };
  const trackReplace = (st, re, fn) => {
    let nt = ''; const norg = [], neff = []; let last = 0, cnt = 0;
    const f = new Array(st.t.length + 1);   // 이 단계의 경계 대응(옛 글자 사이 위치 → 새 위치)
    const copy = (a, b) => { for (let k = a; k <= b; k++) f[k] = nt.length + (k - a); for (let k = a; k < b; k++) { norg.push(st.org[k]); neff.push(st.eff[k]); } nt += st.t.slice(a, b); };
    st.t.replace(re, (...args) => {
      const m = args[0]; const idx = args[args.length - 2]; const rep = fn(...args);
      copy(last, idx); last = idx + m.length;
      if (rep === m) { copy(idx, last); return m; }
      cnt++;
      const keep = lcsKeep(m, rep); const kept = new Set(keep.filter((x) => x >= 0));
      // 경계: 교체 구간의 시작은 교체 시작, 끝은 교체 끝, 안쪽은 남는 글자를 따라간다(각주가 교체 글자 앞뒤를 넘지 않게)
      { const c = nt.length; const at = new Array(m.length).fill(-1); keep.forEach((i, j) => { if (i >= 0) at[i] = j; });
        f[idx] = c; f[idx + m.length] = c + rep.length;
        for (let q = 1; q < m.length; q++) {
          if (at[q] >= 0) f[idx + q] = c + at[q];
          else if (at[q - 1] >= 0) f[idx + q] = c + at[q - 1] + 1;
          else { let r = q + 1; while (r < m.length && at[r] < 0) r++; f[idx + q] = r < m.length ? c + at[r] : c + rep.length; }
        } }
      const deleted = []; for (let k = 0; k < m.length; k++) if (!kept.has(k)) deleted.push(k);
      for (let j = 0; j < rep.length; j++) {
        if (keep[j] >= 0) { norg.push(st.org[idx + keep[j]]); neff.push(st.eff[idx + keep[j]]); continue; }
        let lo = -1; for (let q = j - 1; q >= 0; q--) if (keep[q] >= 0) { lo = keep[q]; break; }
        let hi = m.length; for (let q = j + 1; q < rep.length; q++) if (keep[q] >= 0) { hi = keep[q]; break; }
        let src = deleted.find((k) => k > lo && k < hi);
        if (src === undefined) { let bd = Infinity; for (let q = 0; q < rep.length; q++) if (keep[q] >= 0 && !/\d/.test(m[keep[q]]) && Math.abs(q - j) < bd) { bd = Math.abs(q - j); src = keep[q]; } }
        if (src === undefined && deleted.length) src = deleted[0];
        if (src === undefined) src = Math.max(0, keep.find((x) => x >= 0) ?? 0);
        norg.push(-1); neff.push(st.eff[idx + src]);
      }
      nt += rep; return m;
    });
    copy(last, st.t.length);
    if (cnt) st.bnd = st.bnd.map((b) => f[b]);
    st.t = nt; st.org = norg; st.eff = neff; return cnt;
  };
  const fixTracked = (text, where) => {
    let n = 0; const org = [], eff = []; let out = ''; let pos = 0; const bnd = new Array(text.length + 1).fill(0);
    // 세미콜론으로 나뉜 조각마다 한글 유무를 따로 본다(혼합 언어 각주에서 서양 문헌의 p.를 쪽으로 바꾸지 않도록)
    const segs = splitCitationSegs(text);   // 세미콜론, 또는 마침표 뒤 ‘Smith, ’ 꼴로 시작하는 국외 문헌 조각 — 낫표·괄호·따옴표 안에서는 나누지 않는다
    for (const seg of segs) {
      if (seg === undefined) continue;
      const ids = Array.from({ length: seg.length }, (_, k) => pos + k);
      const st = { t: seg, org: ids, eff: ids.slice(), bnd: Array.from({ length: seg.length + 1 }, (_, k) => k) };
      const apply = (re, fn) => { n += trackReplace(st, re, fn); };
      if (!/^(;\s*|\.\s+)$/.test(seg)) {
        // p.와 pp.는 숫자에 맞춘다: 한 쪽이면 p., 범위면 pp.(국문·국외 모두. ‘pp. 12, 15’·‘pp.12ff.’는 그대로)
        apply(/\bpp\.(?=\s*\d+(?!\d|\s*(?:[-~–—∼〜～－]\s*\d|,\s*\d|ff?\b)))/g, () => 'p.');
        apply(/\bp\.(?=\s*\d+\s*[-~–—∼〜～－]\s*\d+)/g, () => 'pp.');
        if (unit && (hasHangul(seg) || latSame)) {
          if (unit === '쪽' || unit === '면') {
            // 국외 문헌 뒤에 잘못 붙은 쪽·면은 p./pp.로(‘…, Journal of Things 1(2), 2000, 15쪽’ → ‘p.15’)
            apply(/(\d+)(\s*[-~–∼〜～－]\s*(\d+))?\s*(쪽|면)(?=에서|에|부터|까지|을|를|의|과|와|참조|재인용|[^가-힣]|$)/g, (m, a, r, b, u, off, str) => (langOf(str.slice(0, off)) === 'lat' ? (b ? `pp.${a}${rangeLatin || '-'}${b}` : `p.${a}`) : m));
            apply(/(\d+)\s*(쪽|면)(?![가-힣])/g, (m, d, u) => (u === unit ? m : `${d}${unit}`));
            // p./pp.는 그 문헌이 국문일 때만 쪽·면으로(국문 문장 안에 인용된 외국 논문은 그대로). ‘p.20에서’처럼 조사가 붙어도 → ‘20쪽에서’
            apply(/\bpp?\.\s*(\d+)(\s*[-~–∼〜～－]\s*(\d+))?(?=[.,;)\s]|$|[가-힣])/g, (m, a, r, b, off, str) => (langOf(str.slice(0, off)) === 'lat' ? m : (b ? `${a}${rangeKo || '~'}${b}${unit}` : `${a}${unit}`)));
          } else if (unit === 'p.' || unit === 'pp.') {
            apply(/(\d+)(\s*[-~–∼〜～－]\s*(\d+))?\s*(쪽|면)(?![가-힣])/g, (m, a, r, b) => (b ? `pp.${a}${rangeKo || '-'}${b}` : `p.${a}`));
          }
        }
        // 쪽수 범위 기호(~ ～ ∼ -)는 학회 각주·참고문헌 예시대로 — 기호 한 글자만 바꾼다. pp. 범위는 그 문헌의 언어(국문/국외)로 고른다
        const latSym = where === '참고문헌' ? (rangeRefLatin || rangeLatin) : rangeLatin;
        if (rangeKo || latSym) {
          if (rangeKo && hasHangul(seg)) apply(/(\d\s*)([-~–—∼〜～－])(\s*\d+\s*(?:쪽|면|頁)(?![가-힣]))/g, (m, pre, sym, post) => (sym === rangeKo ? m : `${pre}${rangeKo}${post}`));   // 국문 쪽·면 범위
          apply(/(\bpp?\.\s*\d+\s*)([-~–—∼〜～－])(\s*\d+)/g, (m, pre, sym, post, off, str) => { const want = langOf(str.slice(0, off)) === 'lat' ? latSym : rangeKo; return !want || sym === want ? m : `${pre}${want}${post}`; });
        }
        if (pageSpace) apply(/\b(pp?\.)(?=\d)/g, (m, u) => u + ' ');
        else if (pageSpaceLatin) apply(/\b(pp?\.)(?=\d)/g, (m, u, off, str) => (citeLang(str.slice(0, off)) === 'lat' ? u + ' ' : m));   // p./pp. 뒤 한 칸(‘pp. 1-5’, 만화웹툰연구)
        if (marks === 'half') { apply(/「/g, () => '｢'); apply(/」/g, () => '｣'); apply(/『/g, () => PUA_OPEN); apply(/』/g, () => PUA_CLOSE); }
        if (marks === 'full') { apply(/｢/g, () => '「'); apply(/｣/g, () => '」'); apply(new RegExp(PUA_OPEN, 'gu'), () => '『'); apply(new RegExp(PUA_CLOSE, 'gu'), () => '』'); }
      }
      for (let k = 0; k <= seg.length; k++) bnd[pos + k] = out.length + st.bnd[k];
      out += st.t; for (let k = 0; k < st.org.length; k++) { org.push(st.org[k]); eff.push(st.eff[k]); } pos += seg.length;
    }
    if (out !== text) changes.push({ where, before: text.slice(0, 80), after: out.slice(0, 80), n });
    return { text: out, org, eff, bnd };
  };
  // 강조 런을 새 글: 글자마다 물려받은 원래 글자의 런을 따른다(런 글자 합이 원문과 다르면 강조를 비운다)
  const remapRuns = (runs, srcLen, r) => {
    if (!runs || !runs.length) return [];
    const runOf = new Int32Array(srcLen); let off = 0;
    runs.forEach((run, ri) => { for (let k = 0; k < run.text.length && off + k < srcLen; k++) runOf[off + k] = ri; off += run.text.length; });
    if (off !== srcLen) return [];
    const res = []; let cur = -1, start = 0;
    for (let i = 0; i <= r.text.length; i++) { const ri = i < r.text.length ? runOf[r.eff[i]] : -2; if (ri !== cur) { if (cur >= 0 && i > start) res.push({ ...runs[cur], text: r.text.slice(start, i) }); cur = ri; start = i; } }
    return res;
  };
  // 원래 위치(글자 사이 경계) → 치환 뒤 위치: 단계마다 합성한 경계 대응표를 따른다
  const mapOff = (r, p) => r.bnd[Math.max(0, Math.min(p, r.bnd.length - 1))];
  const out = blocks.map((b) => {
    const nb = { ...b };
    const isRef = /^(ref|refSub)$/.test(b.role);
    if (isRef || marks !== 'keep') {
      const r = fixTracked(b.text, isRef ? '참고문헌' : roleLabel(b.role));
      if (r.text !== b.text) {
        nb.text = r.text;
        if (b.runs && b.runs.length) {   // 런 경계를 새 좌표로 옮겨 강조를 유지한다
          nb.runs = remapRuns(b.runs, b.text.length, r);
        }
        if (b.footnotes && b.footnotes.length) nb.footnotes = b.footnotes.map((f) => ({ ...f, offset: mapOff(r, f.offset ?? b.text.length) }));
      }
    }
    if (nb.footnotes && nb.footnotes.length) nb.footnotes = nb.footnotes.map((f) => {
      if (!Array.isArray(f.paras) || !f.paras.length) return { ...f, text: fixTracked(f.text, '각주').text };
      const paras = f.paras.map((q) => { const r = fixTracked(q.text, '각주'); if (r.text === q.text) return q; return { text: r.text, runs: remapRuns(q.runs, q.text.length, r) }; });
      return { ...f, paras, text: paras.map((q) => q.text).join('\n') };
    });
    return nb;
  });
  return { blocks: out, changes };
}

// 200자 원고지 매수 추정 (20자 × 10행; 공백 포함, 각주 포함)
export function estimateLength(blocks) {
  let chars = 0, charsNoSpace = 0, lines = 0, fnChars = 0;
  for (const b of blocks) {
    if (b.role === 'skip') continue;
    const t = (b.text || '');
    chars += t.length; charsNoSpace += t.replace(/\s/g, '').length; lines += Math.max(1, Math.ceil(t.length / 20));
    for (const f of b.footnotes || []) { fnChars += f.text.length; lines += Math.ceil(f.text.length / 20); chars += f.text.length; }
  }
  return { chars, charsNoSpace, fnChars, sheets: Math.round((lines / 10) * 10) / 10 };
}

// 체크리스트 — 학회 요구와 블록을 대조
export function checklist(blocks, journal) {
  const has = (r) => blocks.some((b) => b.role === r);
  const items = [];
  items.push({ ok: has('title'), text: '국문 제목' });
  items.push({ ok: has('abstract') || has('abstractHead'), text: `국문초록 (${journal.abstract?.ko || '필수'})` });
  items.push({ ok: has('keywords'), text: `주제어 (${journal.abstract?.keywords || '5개 이상'})` });
  items.push({ ok: has('h1'), text: '장 제목' });
  items.push({ ok: has('refHead') || has('ref'), text: `참고문헌 (${journal.references?.order || ''})` });
  items.push({ ok: has('abstractEn') || has('abstractEnHead'), text: `영문초록 (${journal.abstract?.en || ''})` });
  items.push({ ok: has('keywordsEn'), text: 'Keywords' });
  const author = blocks.find((b) => b.role === 'author' || b.role === 'affiliation');
  if (journal.anonymize && author) items.push({ ok: false, warn: true, text: `익명화 확인: 저자 ‘${(author.text || '').trim().slice(0, 20)}’가 남아 있음 — ${journal.anonymize}` });
  const est = estimateLength(blocks);
  if (journal.length?.max) items.push({ ok: est.sheets <= journal.length.max, text: `분량 약 ${est.sheets}매 / 한도 ${journal.length.text}` });
  return items;
}

// 목차 자동 생성 — 학회 체재에 목차(차례)가 있는데 원고에 목차가 없으면 장 제목(h1; tocDepth가 2면 절 제목까지)으로 만든다
export function buildToc(blocks, journal) {
  const wants = (journal.structure || []).includes('toc') || !!(journal.template && journal.template.roles && (journal.template.roles.toc || journal.template.roles.tocHead));
  if (!wants) return { blocks, added: 0, reason: '학회 체재에 목차 없음' };
  if (blocks.some((b) => b.role === 'toc' || b.role === 'tocHead')) return { blocks, added: 0, reason: '원고에 목차 있음' };
  const depth = journal.tocDepth === 2 ? ['h1', 'h2'] : ['h1'];
  const heads = blocks.filter((b) => depth.includes(b.role) && b.text.trim());
  if (!heads.length) return { blocks, added: 0, reason: '장 제목 없음' };
  const label = journal.tocLabel || '목차';
  const items = [{ role: 'tocHead', text: label, auto: true, reason: '목차 제목(자동 생성)', footnotes: [], runs: [] },
    ...heads.map((b) => ({ role: 'toc', text: b.text.trim(), auto: true, reason: '장 제목에서 생성', footnotes: [], runs: [] }))];
  // 본문이 시작하는 자리(첫 장 제목 또는 첫 본문) 앞에 넣는다 — 체재 재배열이 켜져 있으면 학회 순서대로 옮겨진다
  let at = blocks.findIndex((b) => depth.includes(b.role) || b.role === 'body');
  if (at < 0) at = blocks.length;
  return { blocks: [...blocks.slice(0, at), ...items, ...blocks.slice(at)], added: items.length - 1, label };
}
