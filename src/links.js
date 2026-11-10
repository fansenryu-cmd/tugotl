// 주소 다루기 — 투고처·출처 주소를 화면에 링크로 내보낼 때 쓰는 검사와, 출처 글에서 주소만 골라내기
// 투고처 주소: http(s)만, 자격증명·역슬래시·제어문자 없이, 호스트가 실제로 파싱되는 것만
export const safeUrl = (u) => {
  if (typeof u !== 'string' || u.length > 2048 || /[\s\\"'<>\u0000-\u001f]/.test(u)) return '';
  try {
    const x = new URL(u); if (!/^https?:$/.test(x.protocol) || x.username || x.password || !/^[a-z0-9.-]+$/i.test(x.hostname) || !x.hostname.includes('.')) return '';
    const labels = x.hostname.replace(/\.$/, '').split('.');   // 각 레이블은 영숫자로 시작·끝나고 63자 이하(빈 레이블·앞뒤 하이픈 거부)
    if (labels.length < 2 || !labels.every((l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(l))) return '';
    return x.href;
  } catch { return ''; }
};

// 출처 한 줄을 [글자, {url, text}, 글자 …]로 나눈다(v2.4.2).
// 출처에는 ‘https://x.jams.or.kr (학회소개 > 투고규정)’·‘KCI 학술지 정보(https://…)’처럼 주소에 설명이 붙은 것이 많아,
// 줄 전체가 주소일 때만 링크로 보이던 것을 — 주소 부분만 링크로, 나머지는 글자 그대로 — 로 바꾼다.
// 주소는 ASCII 주소 글자만 잇고(한글·공백에서 끊음), 끝의 문장부호와 짝 없는 닫는 괄호는 뗀다. safeUrl 을 통과한 것만 링크.
const URL_RUN = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&()*+,;=%]+/g;
const count = (s, ch) => s.split(ch).length - 1;
const trimUrl = (u) => {
  for (;;) {
    const c = u.at(-1);
    if ('.,;:!?([*'.includes(c) || (c === ')' && count(u, ')') > count(u, '(')) || (c === ']' && count(u, ']') > count(u, '['))) u = u.slice(0, -1);
    else if (count(u, '(') > count(u, ')')) u = u.slice(0, u.lastIndexOf('('));   // ‘…/a.zip(파일 이름’처럼 설명 괄호가 열린 채 끊긴 것
    else if (count(u, '[') > count(u, ']')) u = u.slice(0, u.lastIndexOf('['));
    else return u;
  }
};
export const sourceParts = (s) => {
  if (typeof s !== 'string') return [];
  const out = []; let last = 0;
  for (const m of s.matchAll(URL_RUN)) {
    const raw = trimUrl(m[0]); const href = safeUrl(raw);
    if (!href) continue;
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push({ url: href, text: raw }); last = m.index + raw.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
};
export const hasLink = (parts) => parts.some((p) => typeof p === 'object');
