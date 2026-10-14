// 서지 양식 변환 — 각주·참고문헌의 한국어 서지 표기를 규칙으로만 다시 쓴다(AI 없음).
// 인식하는 꼴: 「논문」+『학술지』 형식과 『단행본』 형식(번역서 포함). 그 밖(위의 책, 서양 문헌 등)은 손대지 않고 '미인식'으로 센다.
const O_Q = '「｢', C_Q = '」｣';                 // 논문 낫표
const O_B = '『󰡔', C_B = '』󰡕';                 // 저서 겹낫표(반각 PUA 포함)
const RE_ART = new RegExp(`^(.{1,80}?),\\s*[${O_Q}](.+?)[${C_Q}],?\\s*[${O_B}](.+?)[${C_B}](.*)$`, 'u');
const RE_BOOK = new RegExp(`^(.{1,80}?),\\s*[${O_B}](.+?)[${C_B}](.*)$`, 'u');
const RE_YEAR = /^\(?((?:1[89]|20)\d{2})\)?(?:[.년]\s*\d{1,2}(?:[.월]\s*\d{1,2})?)?[.년]?$/;
const RE_PAGES = /^(?:pp?\.\s*)?(\d+)(?:\s*[-~–]\s*(\d+))?\s*(?:쪽|면|p|pp)?\.?$/;
const RE_VOL = /^(?:제\s*)?(\d+)\s*(집|호|권|輯|號|卷)(?:\s*(?:제\s*)?(\d+)\s*(호|號))?$|^(\d+)\s*\(\s*(\d+)\s*\)$|^Vol\.?\s*(\d+)(?:,?\s*No\.?\s*(\d+))?$/i;
const RE_TRANS = /^(.+?)\s*(역|옮김|譯|편역|편)\s*$/;

const dash = (a, b) => (b ? `${a}–${b}` : `${a}`);
const splitTail = (tail) => tail.replace(/^[,，\s]+/, '').replace(/[.。]\s*$/, '').split(/\s*[,，]\s*/).map((s) => s.trim()).filter(Boolean);

function classify(tokens) {
  const r = { vol: null, issue: null, year: null, pages: null, publisher: [], place: null };
  for (const t of tokens) {
    let m;
    if (!r.year && (m = RE_YEAR.exec(t))) { if (/\d{4}\s*[.년]\s*\d/.test(t)) { r.dated = true; continue; } r.year = m[1]; continue; }   // 연월일(2020.06.25)은 월·일이 사라지므로 변환 대상에서 뺀다
    if (!r.pages && (m = RE_PAGES.exec(t)) && (/쪽|면|p/.test(t) || r.year)) { r.pages = dash(m[1], m[2]); continue; }
    if (!r.vol && (m = RE_VOL.exec(t))) { r.vol = m[1] || m[5] || m[7]; r.issue = m[3] || m[6] || m[8] || null; if (m[2] && /호|號/.test(m[2]) && !m[3]) { r.issue = r.vol; r.vol = null; } continue; }
    if (!r.vol && !r.year && /^\d{1,3}$/.test(t)) { r.vol = t; continue; }   // 『국어문학』 72 처럼 단위 없는 권호
    if (r.year) r.afterYear = true;   // 연도 뒤에 남은 조각(‘재인용’·‘강조는 인용자’·‘참조’)
    r.publisher.push(t);
  }
  // '출판지: 출판사'
  const pub = r.publisher.join(', ');
  const pm = /^(.+?)\s*[:：]\s*(.+)$/.exec(pub);
  if (pm) { r.place = pm[1]; r.publisherText = pm[2]; } else r.publisherText = pub;
  return r;
}

export function parseCitation(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (/https?:\/\/|www\.|doi\.org/i.test(t)) return null;   // URL·DOI가 든 항목은 손대지 않는다
  if (!t || /^(위의|앞의|같은)\s*(책|논문|글)|^(Ibid|ibid|op\. ?cit|Op\. ?cit)/.test(t)) return null;
  let m = RE_ART.exec(t);
  if (m) {
    const c = classify(splitTail(m[4]));
    if (!c.year || c.dated || !/[^\s,，、]/.test(m[1])) return null;
    if (c.afterYear) return null;   // 논문 항목은 발행처를 버리므로, 연도 뒤의 덧말이 발행처로 읽혀 조용히 사라지지 않게 변환하지 않는다
    if (c.publisher.some((x) => /\d/.test(x)) || c.publisher.length > 1) return null;   // 통권·날짜·판차 등 모르는 요소가 남으면 변환하지 않는다
    return { kind: 'article', author: m[1].trim(), title: m[2].trim(), journal: m[3].trim(), ...c };
  }
  m = RE_BOOK.exec(t);
  if (m) {
    // 저자부: '저자1, 저자2 지음, 역자1, 역자2 옮김' — 지음/저/著 표지 뒤부터 옮김/역 표지까지를 역자로 본다
    const head = m[1].split(/\s*[,，]\s*/).map((s) => s.trim());
    let author = head[0], translator = null;
    const trIdx = head.findIndex((x, i) => i > 0 && RE_TRANS.test(x));
    const auIdx = head.findIndex((x) => /(지음|저|著)\s*$/.test(x));
    if (trIdx > 0) {
      const start = auIdx >= 0 && auIdx < trIdx ? auIdx + 1 : trIdx;
      author = head.slice(0, start).join(', ').replace(/\s*(지음|저|著)\s*$/, '');
      translator = head.slice(start, trIdx + 1).join(', ');
      if (trIdx + 1 < head.length) author += ', ' + head.slice(trIdx + 1).join(', ');
    } else author = head.join(', ').replace(/\s*(지음|저|著)\s*$/, '');
    const c = classify(splitTail(m[3]));
    if (!c.year || c.dated) return null;
    if (c.vol || c.issue) return null;   // 단행본 서식에는 권·호 칸이 없다(『학술지』 1 꼴이 단행본으로 읽히면 권이 사라진다)
    if (/[「｢」｣]/.test(m[1]) || !/[^\s,，、]/.test(m[1])) return null;   // 닫는 낫표(」｣)가 저자 칸에 있으면 PDF 줄바꿈으로 앞 낫표가 이전 줄에 남은 논문 제목의 뒤쪽이다.   // 저자 칸이 비었거나 논문 제목이 저자로 읽힌 항목(‘, 「제목」, 『학술지』 70, …’·‘저자1, 저자2 「제목」, 『학술지』 …’)
    if (c.publisher.some((x) => /\d/.test(x) && !/^(제\s*)?\d+\s*(판|쇄)$/.test(x))) return null;
    return { kind: 'book', author, translator, title: m[2].trim(), ...c };
  }
  return null;
}

function formatAPA(c) {
  if (c.kind === 'article') {
    const vol = c.vol ? `, ${c.vol}${c.issue ? `(${c.issue})` : ''}` : (c.issue ? `, (${c.issue})` : '');
    return `${c.author} (${c.year}). ${c.title}. ${c.journal}${vol}${c.pages ? `, ${c.pages}` : ''}.`;
  }
  const tr = c.translator ? ` (${c.translator})` : '';
  const pg = c.pages ? ` (${/–/.test(c.pages) ? 'pp.' : 'p.'} ${c.pages})` : '';
  return `${c.author} (${c.year}). ${c.title}${tr}${pg}. ${c.publisherText || ''}`.replace(/\.\s*$/, '') + '.';
}
function formatChicago(c) {
  if (c.kind === 'article') {
    const vol = c.vol ? ` ${c.vol}` : '';
    const no = c.issue ? `, no. ${c.issue}` : '';
    return `${c.author}, 「${c.title}」, 『${c.journal}』${vol}${no} (${c.year})${c.pages ? `: ${c.pages}` : ''}.`;
  }
  const tr = c.translator ? `, ${c.translator}` : '';
  const pub = [c.place ? `${c.place}: ${c.publisherText}` : c.publisherText, c.year].filter(Boolean).join(', ');
  return `${c.author}, 『${c.title}』${tr} (${pub})${c.pages ? `, ${c.pages}` : ''}.`;
}

export const CITE_STYLES = [
  { id: 'journal', label: '학회 규정', desc: '쪽수 단위·낫표만 학회 규정에 맞춤' },
  { id: 'apa', label: 'APA', desc: '저자 (연도). 제목. 학술지, 권(호), 쪽.' },
  { id: 'chicago', label: 'Chicago', desc: '저자, 「제목」, 『학술지』 권, no. 호 (연도): 쪽.' },
  { id: 'keep', label: '원고 그대로', desc: '서지 표기를 바꾸지 않음' },
];

// blocks의 각주·참고문헌 항목에 서지 양식을 적용한다. 반환: { blocks, converted, unrecognized, samples }
export function restyleCitations(blocks, style) {
  const fmt = style === 'apa' ? formatAPA : style === 'chicago' ? formatChicago : null;
  if (!fmt) return { blocks, converted: 0, unrecognized: 0, samples: [] };
  let converted = 0, unrecognized = 0; const samples = [];
  const conv = (text, where) => {
    // 한 각주에 여러 문헌이 줄바꿈이나 세미콜론으로 이어진 경우 각각 처리
    return text.split(/(\n|;\s*)/).map((part) => {
      if (/^(\n|;\s*)$/.test(part) || !part.trim()) return part;
      const c = parseCitation(part);
      if (!c) { if (/[「｢『󰡔]/.test(part) || /\b(19|20)\d{2}\b/.test(part)) unrecognized++; return part; }
      const out = fmt(c); converted++;
      if (samples.length < 6 && out !== part.trim()) samples.push({ where, before: part.trim(), after: out });
      return part.match(/^\s*/)[0] + out + part.match(/\s*$/)[0];   // 앞뒤 공백은 원고의 일부(각주 번호 뒤 한 칸)
    }).join('');
  };
  const out = blocks.map((b) => {
    const nb = { ...b };
    if (b.role === 'ref') { const t = conv(b.text, '참고문헌'); if (t !== b.text) { nb.text = t; nb.runs = []; } }
    if (b.footnotes && b.footnotes.length) nb.footnotes = b.footnotes.map((f) => {
      const src = Array.isArray(f.paras) && f.paras.length ? f.paras : f.text.split('\n').map((x) => ({ text: x, runs: [] }));
      let changed = false; const paras = src.map((q) => { const t = conv(q.text, '각주'); if (t === q.text) return q; changed = true; return { text: t, runs: [] }; });   // 문단 단위로(문단 안의 \n은 줄바꿈). 바뀐 문단만 강조 런을 버린다
      return changed ? { ...f, paras, text: paras.map((q) => q.text).join('\n') } : f;
    });   // 엔진은 paras를 쓰므로 함께 고친다(서지 변환은 글을 다시 쓰므로 강조 런은 버린다)
    return nb;
  });
  return { blocks: out, converted, unrecognized, samples };
}
