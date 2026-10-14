// 각주·참고문헌 정오표 — 규칙만으로(AI 없음) 각주의 인용과 참고문헌 목록을 맞대어 본다.
//  1) 각주에서 인용한 문헌이 참고문헌에 있는가        → 없으면 각주를 붉게
//  2) 각주·참고문헌 표기가 학회 규정 양식에 맞는가     → 어긋나면 붉게
//  3) 참고문헌에는 있는데 각주에서 한 번도 인용되지 않았는가 → 참고문헌을 붉게
//  4) 외부(KCI·RISS·Google Scholar) 대조는 서지를 바깥으로 보내야 하므로 자동으로 하지 않고 검색 링크만 만든다.
import { parseCitation } from './cite.js';

const RE_REPEAT = /^(위의|앞의|같은)\s*(책|논문|글)|^(Ibid|ibid|op\.\s?cit|Op\.\s?cit|loc\.\s?cit)/;
const RE_TITLE_Q = /[「｢]([^」｣]+)[」｣]/;     // 논문 제목
const RE_TITLE_B = /[『󰡔]([^』󰡕]+)[』󰡕]/;     // 서명
const RE_YEAR = /\b(1[89]|20)\d{2}\b/;
const RE_CASE = /(대법원|헌법재판소|[가-힣]+(지방|고등|가정|행정|특허)법원(?:\s*[가-힣]+지원)?|[가-힣]+(?:지법|고법)(?:\s*[가-힣]+지원)?)[^,;]*?(\d{2,4}[가-힣]{1,4}\d{1,7})/;
const RE_CASE_ALL = new RegExp(RE_CASE.source, 'g');   // 한 각주·문단에 판결이 여럿일 때(‘…판결. 상고심 대법원 … 판결에서는’)
// ‘저자, 앞의 책(글·논문)[, 연도]’ — 저자 이름으로 앞서 인용한 문헌을 가리킨다
const RE_AUTHOR_REPEAT = /^([가-힣]{2,5}(?:\s*외)?|[A-Z][A-Za-z.\-' ]{1,40})\s*,\s*(앞의|위의|같은)\s*(책|논문|글)(?:\s*,\s*((?:1[89]|20)\d{2}))?/;
// 서술 문장 끝(또는 괄호 안)에 붙은 인용의 시작: ‘…에 대해선 홍길동, 「…」’, ‘(김철수, 「…」’, ‘가상 저자(假想), 이몽룡 역, 『…』’, ‘논의는 John A. Smith & Jane Doe, "…"’
const RE_CITE_HEAD = /(?:^|[\s(（“"‘'])((?:[가-힣]{2,6}\s[가-힣]{2,6}\([^)]{1,20}\)|[가-힣]{2,5}(?:·[가-힣]{2,5})*(?:\s*외(?:\s*\d+\s*명)?)?|[A-Z][A-Za-z.\-']*(?:\s+[A-Z][A-Za-z.\-']*)*(?:\s*(?:&|and|·)\s*[A-Z][A-Za-z.\-']*(?:\s+[A-Z][A-Za-z.\-']*)*)*)\s*,\s*(?:[^,「『󰡔"“]{1,30}(?:옮김|역|譯|엮음|편역|편)\s*,\s*)?)$/;
// 서술 각주에서 인용만 떼어 낸다: 문장마다 첫 제목 괄호 앞의 ‘저자, (역자,)’를 찾아 거기서부터를 인용으로 본다
function embeddedCitations(text) {
  const out = [];
  for (const sent of text.split(/(?<=[가-힣)"”'’\d]\.)\s+(?=\D)/)) {
    // 문장 안의 제목 괄호마다 앞에 ‘저자, ’가 있는지 본다(앞의 따옴표는 인용문일 수 있어 건너뛴다)
    for (const m of sent.matchAll(/[「｢『󰡔“"]/g)) {
      const head = RE_CITE_HEAD.exec(sent.slice(0, m.index)); if (!head) continue;
      out.push(sent.slice(head.index + head[0].length - head[1].length));   // 이름 앞의 구분 글자(공백·괄호·따옴표)는 빼고 이름부터
      break;
    }
  }
  return out;
}   // 판례: 사건번호로 대조
const RE_REFSUB = /^[<＜\[〔(]?\s*(자료|기본\s*자료|논저|논문|단행본|기타|국내|국외|해외|1차|2차|참고\s*자료|작품|신문|웹|사료)\s*[>＞\]〕)]?\s*$|^\d+\s*[.)]\s*\S{1,10}$/;
const normKey = (s) => (s || '').toLowerCase().replace(/[\s​]+/g, '').replace(/[.,:;·‧․()（）\[\]「」｢｣『』󰡔󰡕“”"‘’'<>＜＞\-–—~～∼〜_?!]/g, '');
const similar = (a, b) => { if (!a || !b) return 0; if (a === b) return 1; if ((a.startsWith(b) || b.startsWith(a)) && Math.min(a.length, b.length) >= 6) return 0.9;   /* 부제를 뺀 주제목(‘가상 연구’ ↔ ‘가상 연구 : 부제를 중심으로’) */ if (a.includes(b) || b.includes(a)) return Math.min(a.length, b.length) / Math.max(a.length, b.length) > 0.5 ? 0.9 : 0.6; const n = Math.min(a.length, b.length); let same = 0; for (let i = 0; i < n; i++) if (a[i] === b[i]) same++; return same / Math.max(a.length, b.length); };

// 한 각주 안의 여러 문헌 나누기: 줄바꿈, 세미콜론, 또는 "…, 2015. 한혜원, 「" 처럼 연도 뒤 마침표 다음에 새 저자가 오는 자리
const splitCitations = (text) => text.split(/\n|;\s*|(?<=\b(?:1[89]|20)\d{2}[^.]{0,12}\.)\s+(?=[가-힣A-Z][^「『"“\n]{0,30}[,，]\s*[「｢『󰡔"“])/).map((s) => s.trim()).filter(Boolean);

// 각주나 참고문헌 한 항목에서 대조 키(제목·저자)를 뽑는다. 서지로 볼 수 없으면 null(설명 각주).
function keyOf(text) {
  const t = text.trim();
  if (!t || /^[*＊※]/.test(t)) return null;                       // 사사·소속 표기
  const cs = RE_CASE.exec(t); if (cs) return { title: cs[3], author: '', parsed: null, kind: 'case' };
  const c = parseCitation(t);
  // 연도는 제목 뒤에서만 찾는다(『2024 …실태조사』처럼 제목 속 숫자나 설명 각주의 ‘1976년에 쓴’이 연도로 잡히지 않도록)
  const yearAfter = (title) => { const i = title ? t.indexOf(title) : -1; const rest = i >= 0 ? t.slice(i + title.length) : ''; const m = /(?:1[89]|20)\d{2}/.exec(rest); return m ? m[0] : ''; };
  if (c) return { title: normKey(c.title), author: normKey((c.author || '').split(/[·,]/)[0]), year: c.year || yearAfter(c.title), parsed: c, kind: c.kind };
  const q = RE_TITLE_Q.exec(t); const b = RE_TITLE_B.exec(t);
  if ((q || b) && (RE_YEAR.test(t) || /\d\s*(쪽|면)|pp?\.\s*\d/.test(t) || t.length < 120)) {
    const title = (q || b)[1];
    // 낫표 제목이 문장 한가운데 있고 앞에 긴 설명이 붙은 경우는 '설명 각주 속 언급'으로 본다
    const pre = t.slice(0, t.indexOf(title)).replace(/[「｢『󰡔]\s*$/, '');
    // 제목 앞이 ‘저자, ’(쉼표로 끝남)가 아니고 서술이면 언급이다(‘어느 철학자가 1900년에 쓴 『가상의 책』에서’)
    if ((pre.length > 40 || (pre.length > 8 && /[가-힣]\s+[가-힣]/.test(pre))) && !/[,，]\s*$/.test(pre)) return { title: normKey(title), author: '', parsed: null, kind: 'mention' };
    return { title: normKey(title), author: normKey(pre.split(/[,，]/)[0]), year: yearAfter(title), parsed: null, kind: q ? 'article' : 'book' };
  }
  // 서양 문헌: 라틴 문자 저자 토큰으로 시작하고 연도가 있으며 큰따옴표 제목 또는 두 번째 토큰
  if (/^[A-Z][A-Za-z.\-' &·]{1,60},/.test(t) && RE_YEAR.test(t)) {   // 공저자 ‘&’·‘·’도 저자 칸
    const w = /[“"]([^”"]{6,})[”"]/.exec(t); const toks = t.split(/[,，]/).map((s) => s.trim());
    return { title: normKey(w ? w[1] : toks[1] || ''), author: normKey(toks[0].split(/\s*(?:\band\b|&|·)\s*/)[0]), year: yearAfter(w ? w[1] : toks[1] || ''), parsed: null, kind: 'western' };
  }
  return null;
}

// 규정 양식 점검 — 학회 데이터(footnote.pageUnit, 규칙 문구)와 서지 구조로 판단한다. 반환: 어긋난 이유 목록
function formatIssues(text, key, journal, where, single) {
  const issues = [];
  if (!key || key.kind === 'mention' || key.kind === 'case') return issues;
  const unit = journal?.footnote?.pageUnit;
  const foreign = key.kind === 'western' || !/[가-힣]/.test(text);   // 국외 문헌은 p./pp. 표기가 규정(국내 쪽·면)의 대상이 아니다
  if (unit === '쪽' && !foreign && /\d\s*면(?![가-힣])|\bpp?\.\s*\d/.test(text)) issues.push('쪽수 단위가 규정(쪽)과 다름');
  if (unit === '면' && !foreign && /\d\s*쪽(?![가-힣])|\bpp?\.\s*\d/.test(text)) issues.push('쪽수 단위가 규정(면)과 다름');
  if ((unit === 'p.' || unit === 'pp.') && /\d\s*(쪽|면)(?![가-힣])/.test(text)) issues.push('쪽수 단위가 규정(p./pp.)과 다름');
  if (key.kind !== 'western' && /[가-힣]/.test(text)) {
    if (/[“"][^”"]{4,}[”"]/.test(text) && !RE_TITLE_Q.test(text) && !RE_TITLE_B.test(text)) issues.push('국문 문헌 제목에 낫표(「」『』) 대신 따옴표를 씀');
    if (key.parsed && !key.parsed.year && !RE_YEAR.test(text)) issues.push('발행 연도 없음');
    const needPages = journal?.footnote?.rules?.some((r) => /쪽수|면수|인용\s*쪽|p\./.test(r)) || !!unit;
    if (where === '각주' && single && key.parsed && !key.parsed.pages && needPages) issues.push('인용 쪽수 없음');
    if (where === '참고문헌' && key.parsed && key.parsed.kind === 'article' && !key.parsed.pages && journal?.references?.rules?.some((r) => /면수|쪽수|페이지/.test(r))) issues.push('논문 수록 면수 없음(규정)');
  }
  return issues;
}

// 내주(본문 괄호 주) 학회: 본문의 ‘(저자 연도…)’ 표기도 인용으로 센다
const inTextStyle = (journal) => { const f = journal?.footnote || {}; return /내주\s*(원칙|방식|체계)/.test([...(f.rules || []), f.example || ''].join(' ')) || /^\s*[(（][가-힣A-Za-z·, ]+\s+\d{4}/.test(f.example || ''); };
const RE_INTEXT2 = /([가-힣]{2,5}|[A-Z][A-Za-z\-']+)\s*[(（]\s*((?:1[89]|20)\d{2})[a-z]?\s*[:：,，)）]/g;
const RE_INTEXT = /[(（]\s*([가-힣]{2,5}|[A-Z][A-Za-z\-']+(?:\s+(?:and|&|et al\.?)\s+[A-Z][A-Za-z\-']+)?)(?:\s*(?:외|et al\.?))?\s*,?\s*((?:1[89]|20)\d{2})[a-z]?\s*[:：,，)）]/g;

export function buildErrata(blocks, journal) {
  const refs = []; const notes = [];
  for (const b of blocks) { if (b.flag === 'red') delete b.flag; for (const f of b.footnotes || []) if (f.flag === 'red') delete f.flag; }   // 지난 검사의 표시는 지우고 다시 센다
  blocks.forEach((b, bi) => {
    if (b.role !== 'ref') return;
    const t = b.text.trim(); if (!t || RE_REFSUB.test(t) || t.length < 8) return;
    refs.push({ bi, text: t, key: keyOf(t), cited: 0, issues: [] });
  });
  // 같은 저자를 밑줄·빈칸으로 적은 항목(‘      , 「…」’)은 바로 앞 항목의 저자를 잇는다
  for (let k = 1; k < refs.length; k++) { const r = refs[k]; if (r.key && !r.key.author && /^[\s_—–\-‐]*[,，]/.test(r.text) && refs[k - 1].key) r.key.author = refs[k - 1].key.author; }
  for (const r of refs) r.issues = formatIssues(r.text, r.key, journal, '참고문헌', true);
  // 제목이 같아도 저자(첫 저자)·연도가 서로 어긋나면 다른 문헌으로 본다(동명 문헌 오매칭 방지)
  const conflict = (a, b) => {
    if (a.kind === 'mention' || b.kind === 'mention') return false;
    const ay = a.year, by = b.year; if (ay && by && ay !== by) return true;   // 같은 제목이라도 연도가 다르면 다른 문헌(국외 동명 문헌 포함)
    if ((!a.parsed || !b.parsed) && a.kind !== 'western' && b.kind !== 'western') return false;   // 구조가 안 잡힌 국문 서지의 앞부분은 저자가 아닐 수 있어(설명 각주) 저자 비교를 건너뛴다 — 연도는 위에서 이미 비교했다
    const aa = a.author, ba = b.author; if (aa && ba && aa.length >= 2 && ba.length >= 2 && !aa.includes(ba) && !ba.includes(aa)) return true;   // ‘스미스’↔‘존 스미스’, ‘도우’↔‘제인 도우 지음’은 같은 저자
    return false;
  };
  const findRef = (key) => {
    let best = null, bestScore = 0;
    for (const r of refs) {
      if (!r.key) continue;
      if (key.kind === 'case' || r.key.kind === 'case') { if (key.kind === 'case' && r.key.kind === 'case' && key.title === r.key.title) return r; continue; }
      if (conflict(key, r.key)) continue;
      const s = similar(key.title, r.key.title); if (s > bestScore) { bestScore = s; best = r; }
    }
    return bestScore >= 0.8 ? best : null;
  };
  // last: 직전 인용의 해결 상태 — 참고문헌 항목(ref) 또는 '참고문헌 없음'(null). '위의 책'은 그 상태를 그대로 잇는다.
  let n = 0; let last = null; let lastResolved = false; const noRefAuthors = new Set();
  for (const b of blocks) {
    if (!b.footnotes || !b.footnotes.length) continue;
    for (const f of [...b.footnotes].sort((a, c) => (a.offset ?? 0) - (c.offset ?? 0))) {
      n++;
      const parts = splitCitations(f.text || '');
      const item = { no: n, text: f.text || '', status: 'ok', issues: [], matches: [], kind: 'note', fnObj: f };
      const cites = [];
      for (const p of parts) {
        if (RE_REPEAT.test(p)) { cites.push({ p, key: 'repeat' }); continue; }
        const ar = RE_AUTHOR_REPEAT.exec(p); if (ar) { cites.push({ p, key: { kind: 'authorRepeat', author: normKey(ar[1].replace(/\s*외$/, '')), year: ar[4] || '' } }); continue; }
        // 판결은 사건번호마다 따로 센다. 판결을 뺀 나머지 글에 문헌 인용이 함께 있을 수 있다(‘…판결. "…, 『가상 안내서』, 2020, p.7에서 재인용.’)
        const caseNos = [...p.matchAll(RE_CASE_ALL)].map((m) => m[3]);
        for (const c of caseNos) cites.push({ p, key: { title: c, author: '', parsed: null, kind: 'case' } });
        const rest = caseNos.length ? p.replace(RE_CASE_ALL, ' ').replace(/선고|판결/g, ' ') : p;
        if (caseNos.length && !/[「｢『󰡔“"]/.test(rest)) continue;
        // 서술 각주 속 인용(‘…에 대해선 홍길동, 「…」, 『…』 7, …, 2020, pp.10-12 참조. … 홍길동, 「…」, …, 2019 참조.’) — 문장이 여럿이면 문장마다 인용을 찾는다
        const multi = rest.split(/(?<=[가-힣)"”'’\d]\.)\s+(?=\D)/).length > 1;
        const emb = embeddedCitations(rest).map((e) => ({ p: e, key: RE_AUTHOR_REPEAT.test(e) ? null : keyOf(e) })).filter((x) => x.key && x.key.kind !== 'mention' && x.key.kind !== 'case');
        const key = keyOf(rest);
        if (multi && emb.length) { cites.push(...emb); continue; }
        if (key && key.kind !== 'mention' && key.kind !== 'case') { cites.push({ p: rest, key }); continue; }
        if (emb.length) cites.push(...emb); else if (key && key.kind !== 'case') cites.push({ p: rest, key });
      }
      for (const { p, key } of cites) {
        if (key.kind === 'authorRepeat') {
          item.kind = 'cite';
          // 같은 저자로 앞서 인용한 문헌(연도가 있으면 연도까지 같은 것) 가운데 가장 최근 것
          const cand = refs.filter((r) => r.key && r.key.author && (r.key.author.includes(key.author) || key.author.includes(r.key.author)) && (!key.year || r.key.year === key.year) && r.lastNo);
          const hit = cand.sort((a, c) => c.lastNo - a.lastNo)[0];
          if (hit) { hit.cited++; hit.lastNo = n; item.matches.push(hit); last = hit; lastResolved = true; }
          else { item.noRef = true; item.issues.push(noRefAuthors.has(key.author) ? '앞서 인용한 같은 저자의 문헌이 참고문헌에 없음' : '‘저자, 앞의 책’이 가리키는 앞 인용을 찾지 못함'); last = null; lastResolved = true; }
          continue;
        }
        if (key === 'repeat') {
          item.kind = 'cite';
          if (!lastResolved && !last) item.issues.push('앞 인용 없이 ‘위의/앞의’ 표기');
          else if (last) { last.cited++; item.matches.push(last); }
          else { item.noRef = true; item.issues.push('‘위의/앞의’가 가리키는 직전 인용이 참고문헌에 없음'); }
          continue;
        }
        if (key.kind === 'mention') { continue; }
        item.kind = 'cite';
        let hit = findRef(key);
        // 편저 속 한 장(「장 제목」, 『책』(엮은이))은 참고문헌에 책으로만 올리기도 한다 — 책 제목으로 한 번 더 찾는다
        if (!hit && key.kind !== 'case') { const bt = RE_TITLE_B.exec(p); if (bt && normKey(bt[1]) !== key.title) { const r2 = findRef({ title: normKey(bt[1]), author: '', parsed: null, kind: 'book', year: key.year }); if (r2 && (r2.key.kind === 'book' || r2.key.parsed?.kind === 'book')) hit = r2; } }
        if (hit) { hit.cited++; hit.lastNo = n; item.matches.push(hit); last = hit; lastResolved = true; }
        else { item.noRef = true; item.issues.push(`참고문헌에 없음: ${p.replace(/\s+/g, ' ').slice(0, 50)}`); if (key.author) noRefAuthors.add(key.author); last = null; lastResolved = true; }
        item.issues.push(...formatIssues(p, key, journal, '각주', cites.length === 1));
      }
      if (item.noRef) item.status = 'noref'; else if (item.issues.length) item.status = 'format';
      if (item.status !== 'ok') f.flag = 'red';
      notes.push(item);
    }
  }
  // 판결은 본문의 인용 출전 줄에도 적는다(‘… 대법원 2000. 1. 1. 선고 99다1234 판결.’) — 본문에서 사건번호가 나오면 인용으로 센다
  for (const b of blocks) {
    if (/^(ref|refSub|refHead)$/.test(b.role) || !b.text) continue;
    for (const m of b.text.matchAll(RE_CASE_ALL)) for (const r of refs) if (r.key && r.key.kind === 'case' && r.key.title === m[3]) r.cited++;
  }
  if (inTextStyle(journal)) {
    for (const b of blocks) {
      if (!/^(body|quote|abstract|abstractEn)$/.test(b.role)) continue;
      const hits = [...(b.text || '').matchAll(RE_INTEXT), ...(b.text || '').matchAll(RE_INTEXT2)];   // (저자 연도: 쪽) 과 저자(연도: 쪽) 두 꼴
      for (const m of hits) { const au = normKey(m[1]); const yr = m[2]; for (const r of refs) if (r.key && r.key.year === yr && r.key.author && (r.key.author.startsWith(au) || au.startsWith(r.key.author))) r.cited++; }
    }
  }
  for (const r of refs) { if (!r.cited) { r.uncited = true; blocks[r.bi].flag = 'red'; } else if (r.issues.length) blocks[r.bi].flag = 'red'; }
  const links = (t) => { const q = encodeURIComponent((t.key?.parsed?.title || t.text).replace(/\s+/g, ' ').slice(0, 80)); return { scholar: `https://scholar.google.com/scholar?q=${q}`, riss: `https://www.riss.kr/search/Search.do?isDetailSearch=N&searchGubun=true&query=${q}`, kci: `https://www.google.com/search?q=site%3Akci.go.kr+${q}` }; };
  for (const r of refs) r.links = links(r);
  for (const t of notes) t.links = links(t);
  const summary = { footnotes: notes.length, citing: notes.filter((x) => x.kind === 'cite').length, noRef: notes.filter((x) => x.status === 'noref').length, formatBad: notes.filter((x) => x.status === 'format').length, refs: refs.length, uncited: refs.filter((r) => r.uncited).length, refFormatBad: refs.filter((r) => r.issues.length).length };
  return { notes, refs, summary };
}
