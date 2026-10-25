// 투고틀 UI — 왼쪽: 투고처 선택·메뉴, 오른쪽: 원고 변환(드롭 → 적용 → 미리보기 → 저장) / 투고 양식·규정 / 투고 일정 / 학회 추가
import { JOURNALS, ROLE_DEFS, SECTION_LABELS, GENERIC_FORMAT, AREAS, AREA_OF } from './journals.js';
import { FORMS } from './forms.js';
import { CITE_STYLES, restyleCitations } from './cite.js';
import { buildErrata } from './errata.js';
import { THIRD_PARTY_LICENSES } from './licenses.js';
import { initEngine, analyzeTemplate, renderTemplatePage, buildDocument } from './engine.js';
import { parseManuscript } from './parse.js';
import { hwpxToDocx } from './hwpx2docx.js';
import { recognize, reorderSections, buildToc, applyBlanks, applySubstitutions, estimateLength, checklist, roleLabel } from './structure.js';

const $ = (sel, el = document) => el.querySelector(sel);
const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== null && v !== undefined) e.setAttribute(k, v); } for (const k of kids.flat()) if (k !== null && k !== undefined) e.append(k.nodeType ? k : document.createTextNode(String(k))); return e; };
const fmtDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const fmtKo = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

const LS = { journals: 'tugotl.customJournals', templates: 'tugotl.customTemplates', opts: 'tugotl.options', journal: 'tugotl.journal', schedule: 'tugotl.schedule', skin: 'tugotl.skin', welcomed: 'tugotl.welcomed', area: 'tugotl.area' };
// 화면 그림(assets/img → 빌드가 data: 주소로 넣음). 없으면 그림 없이 그린다
const IMG = (n) => (window.TUGOTL_IMG && typeof window.TUGOTL_IMG[n] === 'string' ? window.TUGOTL_IMG[n] : null);
const art = (n, cls) => (IMG(n) ? h('img', { class: cls, src: IMG(n), alt: '', decoding: 'async' }) : null);
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
// 저장은 성공 여부를 돌려준다(용량 초과·비공개 창에서 조용히 실패하지 않도록)
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
// 사용자 학회 데이터 검증 — 내장 id와 겹치거나 꼴이 어긋나면 버린다(가져오기 JSON 하나로 앱이 멈추지 않도록)
const BUILTIN_IDS = new Set(JOURNALS.map((j) => j.id));
const BUILTIN_TPL = new Set(JOURNALS.filter((j) => j.template).map((j) => j.template.file));
const RESERVED_ID = /^(__proto__|constructor|prototype|toString|valueOf|hasOwnProperty)$/i;
// 투고처 주소: http(s)만, 자격증명·역슬래시·제어문자 없이, 호스트가 실제로 파싱되는 것만
const safeUrl = (u) => {
  if (typeof u !== 'string' || u.length > 2048 || /[\s\\"'<>\u0000-\u001f]/.test(u)) return '';
  try {
    const x = new URL(u); if (!/^https?:$/.test(x.protocol) || x.username || x.password || !/^[a-z0-9.-]+$/i.test(x.hostname) || !x.hostname.includes('.')) return '';
    const labels = x.hostname.replace(/\.$/, '').split('.');   // 각 레이블은 영숫자로 시작·끝나고 63자 이하(빈 레이블·앞뒤 하이픈 거부)
    if (labels.length < 2 || !labels.every((l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(l))) return '';
    return x.href;
  } catch { return ''; }
};
const isoDate = (s) => { if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const d = new Date(s + 'T00:00:00Z'); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; };   // 2026-02-30 같은 없는 날은 거부
const monthDay = (s) => { if (typeof s !== 'string' || !/^\d{2}-\d{2}$/.test(s)) return false; const [m, d] = s.split('-').map(Number); if (m < 1 || m > 12 || d < 1) return false; return new Date(Date.UTC(2024, m - 1, d)).getUTCDate() === d; };   // 윤년 기준으로 월·일이 실제 날인지
function sanitizeSchedule(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return undefined;
  const o = {};
  if (Number.isInteger(s.perYear) && s.perYear > 0 && s.perYear < 53) o.perYear = s.perYear;
  if (Array.isArray(s.publish)) o.publish = s.publish.filter(monthDay);
  if (Array.isArray(s.deadlines)) o.deadlines = s.deadlines.filter(monthDay);
  if (typeof s.rule === 'string') o.rule = s.rule.slice(0, 300);
  if (Array.isArray(s.upcoming)) o.upcoming = s.upcoming.filter((u) => u && typeof u === 'object' && isoDate(u.deadline)).map((u) => ({ issue: String(u.issue || '공지').slice(0, 40), deadline: u.deadline, publish: isoDate(u.publish) ? u.publish : '', note: typeof u.note === 'string' ? u.note.slice(0, 200) : '' }));
  return o;
}
function sanitizeJournal(j) {
  if (!j || typeof j !== 'object' || Array.isArray(j)) return null;
  if (typeof j.id !== 'string' || !/^[a-z0-9_-]{2,32}$/i.test(j.id) || BUILTIN_IDS.has(j.id) || RESERVED_ID.test(j.id)) return null;
  if (typeof j.journal !== 'string' || !j.journal.trim()) return null;
  const c = {};
  for (const [k, v] of Object.entries(j)) { if (RESERVED_ID.test(k)) continue; c[k] = v; }
  c.journal = String(c.journal).slice(0, 120); c.society = typeof c.society === 'string' ? c.society.slice(0, 120) : '';
  if (c.submit && typeof c.submit === 'object' && !Array.isArray(c.submit)) c.submit = { system: String(c.submit.system || '').slice(0, 60), url: safeUrl(c.submit.url), note: String(c.submit.note || '').slice(0, 600) }; else c.submit = null;
  if (c.template && typeof c.template === 'object' && !Array.isArray(c.template)) { const file = typeof c.template.file === 'string' && /^[a-z0-9_-]{2,32}$/i.test(c.template.file) && !BUILTIN_TPL.has(c.template.file) && !RESERVED_ID.test(c.template.file) ? c.template.file : 'u_' + c.id; c.template = { ...c.template, file, roles: (c.template.roles && typeof c.template.roles === 'object' && !Array.isArray(c.template.roles)) ? c.template.roles : {} }; } else delete c.template;
  const GROUPS = new Set(['front', 'toc', 'abstractKo', 'body', 'references', 'abstractEn', 'tail']);
  if (!Array.isArray(c.structure) || !c.structure.every((g) => typeof g === 'string' && GROUPS.has(g)) || new Set(c.structure).size !== c.structure.length) delete c.structure;
  if (c.blanks && typeof c.blanks === 'object' && !Array.isArray(c.blanks)) { const b = {}; for (const [k, v] of Object.entries(c.blanks)) if (/^[A-Za-z]{3,40}$/.test(k) && Number.isInteger(v) && v >= 0 && v <= 10) b[k] = v; c.blanks = b; }
  if (c.format) c.format = sanitizeFormat(c.format, 0);
  if (c.format && (!c.format.roles || typeof c.format.roles !== 'object' || !Object.keys(c.format.roles).length)) delete c.format;   // 역할 서식이 없는 format은 쓸 수 없다
  if (typeof c.tocLabel === 'string') c.tocLabel = c.tocLabel.slice(0, 20); else delete c.tocLabel;
  if (c.tocDepth !== undefined && c.tocDepth !== 1 && c.tocDepth !== 2) delete c.tocDepth;
  for (const k of ['sources', 'notes', 'documents']) if (c[k] && !Array.isArray(c[k])) delete c[k];
  const sch = sanitizeSchedule(c.schedule); if (sch) c.schedule = sch; else delete c.schedule;
  for (const k of ['length', 'fees', 'abstract', 'footnote', 'references', 'marks', 'layout', 'format', 'blanks']) if (c[k] && (typeof c[k] !== 'object' || Array.isArray(c[k]))) delete c[k];
  return c;
}
// 규정값 서식: 숫자는 유한하고 0~10000(mm·pt·%) 안, 문자열은 120자까지, 4단계까지만 — 그 밖은 버린다
const FMT_NUM = new Set(['size', 'lineSpacing', 'spacing', 'indent', 'marginLeft', 'marginRight', 'spacingBefore', 'spacingAfter', 'width', 'height', 'top', 'bottom', 'left', 'right', 'header', 'footer', 'gutter', 'para', 'sec', 'charSpacing', 'ratio']);
const FMT_STR = new Set(['font', 'fontEn', 'fontLatin', 'latin', 'align', 'name', 'like', 'style', 'role']);
const FMT_BOOL = new Set(['bold', 'italic', 'underline', 'pageBreak', 'noNumber', 'superscript', 'center']);
const goodStr = (v) => typeof v === 'string' && v.length <= 120 && !/^[\s\d.eE+\-]+$/.test(v) && !/^\s*(infinity|nan)\s*$/i.test(v);
const FMT_SIGNED = new Set(['indent', 'charSpacing', 'spacing', 'marginLeft']);   // 내어쓰기·자간은 음수가 정상
const goodNum = (v, k) => typeof v === 'number' && Number.isFinite(v) && v >= (k && FMT_SIGNED.has(k) ? -10000 : 0) && v <= 10000;
function sanitizeFormat(f, depth, rolesMap) {
  if (!f || typeof f !== 'object' || Array.isArray(f) || depth > 4) return undefined;
  const o = {};
  for (const [k, v] of Object.entries(f)) {
    if (!/^[A-Za-z][A-Za-z0-9]{0,40}$/.test(k) || RESERVED_ID.test(k)) continue;
    if (rolesMap && !(v && typeof v === 'object' && !Array.isArray(v))) continue;   // 역할 맵의 값은 객체만
    if (FMT_NUM.has(k)) { if (goodNum(v, k)) o[k] = v; }   // 수치 자리에는 유한한 수만(문자열 ‘Infinity’·불리언·‘oops’는 버린다)
    else if (FMT_STR.has(k)) { if (goodStr(v)) o[k] = v; }
    else if (FMT_BOOL.has(k)) { if (typeof v === 'boolean') o[k] = v; }
    else if (typeof v === 'number') { if (goodNum(v, k)) o[k] = v; }
    else if (typeof v === 'boolean') o[k] = v;
    else if (typeof v === 'string') { if (goodStr(v)) o[k] = v; }
    else if (v && typeof v === 'object' && !Array.isArray(v)) { const inner = sanitizeFormat(v, depth + 1, depth === 0 && k === 'roles'); if (inner) o[k] = inner; }
  }
  if (depth === 0) {   // 용지는 반드시 있어야 하므로 빠진 값은 일반 양식에서 채운다
    const base = (typeof GENERIC_FORMAT !== 'undefined' && GENERIC_FORMAT && GENERIC_FORMAT.page) || { width: 210, height: 297, top: 30, bottom: 30, left: 30, right: 30, header: 15, footer: 15, gutter: 0 };   // 일반 양식 용지(A4)
    const pg = (o.page && typeof o.page === 'object') ? o.page : {};
    o.page = { ...base, ...pg }; if (!goodNum(o.page.width) || !goodNum(o.page.height)) { o.page.width = base.width; o.page.height = base.height; }
  }
  return o;
}
const sanitizeTemplates = (t) => { const out = {}; if (!t || typeof t !== 'object') return out; for (const [k, v] of Object.entries(t)) if (/^[a-z0-9_-]{2,32}$/i.test(k) && !BUILTIN_TPL.has(k) && typeof v === 'string' && v.length < 40 * 1048576 && /^[A-Za-z0-9+/=]+$/.test(v)) out[k] = v; return out; };
const state = {
  view: 'convert', tab: 'preview', jtab: 'docs', ready: false, journals: [], templates: {}, templateInfo: {}, forms: {},
  manuscript: null, baseBlocks: null, blocks: null, journalId: lsGet(LS.journal, null), area: (AREAS.some((a) => a.id === lsGet(LS.area, '')) ? lsGet(LS.area, '') : ''), result: null, dirty: false,
  options: Object.assign({ cite: 'journal', reorder: true, keepSourceBlanks: false, dropAuthor: false, errata: true, toc: true }, lsGet(LS.opts, {})),
};

// ───────── 자산 ─────────
async function b64ToBytes(b64) {
  try { const r = await fetch('data:application/octet-stream;base64,' + b64); return new Uint8Array(await r.arrayBuffer()); }
  catch { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
}
async function loadAssets() {
  const inline = document.getElementById('wasm-b64');
  let wasm;
  if (inline) { wasm = await b64ToBytes(inline.textContent.trim()); inline.remove(); }
  else { const r = await fetch(window.TUGOTL_ASSETS.wasmUrl); wasm = new Uint8Array(await r.arrayBuffer()); }
  await initEngine(wasm);
  const tplEls = [...document.querySelectorAll('script[data-template]')];
  if (tplEls.length) { for (const el of tplEls) { state.templates[el.dataset.template] = await b64ToBytes(el.textContent.trim()); el.remove(); } }
  else { for (const j of JOURNALS) if (j.template) { try { const r = await fetch(window.TUGOTL_ASSETS.templateBase + j.template.file + '.hwp'); if (r.ok) state.templates[j.template.file] = new Uint8Array(await r.arrayBuffer()); } catch { /* 없으면 생략 */ } } }
  for (const el of document.querySelectorAll('script[data-form]')) { state.forms[el.dataset.form] = await b64ToBytes(el.textContent.trim()); el.remove(); }
  if (!Object.keys(state.forms).length && window.TUGOTL_ASSETS?.formBase) { for (const list of Object.values(FORMS)) for (const f of list) { try { const r = await fetch(window.TUGOTL_ASSETS.formBase + encodeURIComponent(f.file)); if (r.ok) state.forms[f.file] = new Uint8Array(await r.arrayBuffer()); } catch { /* 생략 */ } } }
  const custom = sanitizeTemplates(lsGet(LS.templates, {}));
  for (const [k, v] of Object.entries(custom)) { try { state.templates[k] = await b64ToBytes(v); } catch { /* 깨진 바탕틀은 건너뜀 */ } }
}
function loadJournals() {
  const raw = lsGet(LS.journals, []);
  const custom = (Array.isArray(raw) ? raw : []).map(sanitizeJournal).filter(Boolean);
  const builtin = JOURNALS.filter((j) => !custom.some((c) => c.id === j.id));
  state.journals = [...builtin, ...custom.map((c) => ({ ...c, custom: true }))];
  if (state.journalId && !state.journals.some((j) => j.id === state.journalId)) state.journalId = null;
}
const journal = () => state.journals.find((j) => j.id === state.journalId);
const templateBytes = (j) => (j && j.template ? state.templates[j.template.file] : null);
function templateInfo(j) {
  if (!j || !j.template) return null;
  const key = j.template.file; if (state.templateInfo[key]) return state.templateInfo[key];
  const bytes = state.templates[key]; if (!bytes) return null;
  try { state.templateInfo[key] = analyzeTemplate(bytes); } catch (e) { state.templateInfo[key] = { error: String(e) }; }
  return state.templateInfo[key];
}

// ───────── 일정 ─────────
// 사용자가 넣은 마감(localStorage) — 꼴이 어긋난 항목은 무시한다
const safeSchedMap = () => { const a = lsGet(LS.schedule, {}); return a && typeof a === 'object' && !Array.isArray(a) ? a : {}; };
const userSchedule = (id) => { const all = lsGet(LS.schedule, {}); const list = all && typeof all === 'object' && !Array.isArray(all) && Object.prototype.hasOwnProperty.call(all, id) ? all[id] : []; return Array.isArray(list) ? list.filter((u) => u && typeof u === 'object' && isoDate(u.deadline)) : []; };
function nextDeadlines(j, today = new Date()) {
  const out = []; const t0 = new Date(fmtDate(today));
  for (const u of userSchedule(j.id)) out.push({ ...u, date: new Date(u.deadline), explicit: true, user: true });
  const upcoming = Array.isArray(j.schedule?.upcoming) ? j.schedule.upcoming.filter((u) => u && typeof u === 'object' && isoDate(u.deadline)) : [];
  for (const u of upcoming) { if (out.some((o) => Math.abs(o.date - new Date(u.deadline)) < 40 * 86400000)) continue; out.push({ ...u, date: new Date(u.deadline), explicit: true }); }
  for (const md of (Array.isArray(j.schedule?.deadlines) ? j.schedule.deadlines.filter(monthDay) : [])) {
    for (const y of [today.getFullYear(), today.getFullYear() + 1]) {
      if (!isoDate(`${y}-${md}`)) continue;   // 비윤년의 02-29는 그 해에 없다
      const d = new Date(`${y}-${md}`); if (d < t0) continue;
      if (out.some((o) => Math.abs(o.date - d) < 40 * 86400000)) continue;
      const pubIdx = j.schedule.deadlines.indexOf(md); const pub = j.schedule.publish?.[pubIdx];
      out.push({ issue: '정기', deadline: fmtDate(d), publish: pub ? `${pub < md ? y + 1 : y}-${pub}` : '', date: d, note: j.schedule.rule || '규정상 마감(공지 확인)' });
      break;
    }
  }
  return out.filter((o) => o.date >= t0).sort((a, b) => a.date - b.date);   // 지난 마감은 보여 주지 않는다(연중 마감은 내년 것이 이미 들어 있다)
}
const daysLeft = (d) => Math.ceil((new Date(d) - new Date(fmtDate(new Date()))) / 86400000);

// 학회 데이터의 메모 중 자료 수집·개발 과정 이야기(양식 파일을 어떻게 썼는지 등)는 사용자에게 필요 없으므로 화면에서 거른다
const DEV_NOTE = /바탕틀|규정값|일반 양식|견본|양식 파일|변환 시|측정값|docs\/|작가가|스타일 기반|템플릿|\(최종\)|→ 일반|스타일 입은 문서|자료실 zip/;
const userNotes = (arr) => (Array.isArray(arr) ? arr : []).filter((x) => typeof x === 'string' && !DEV_NOTE.test(x));
const cleanLayout = (x) => (typeof x === 'string' ? x.replace(/\s*[—–-]\s*일반 양식[^,;·]*?(적용|$)/g, '').replace(/\s*\((바탕틀|예시 hwp|샘플)\)/g, '').replace(/^바탕틀 스타일$/, '학회 양식의 스타일') : x);
const cleanSource = (x) => (typeof x === 'string' ? x.replace(/\(견본화\)/g, '') : x);

// ───────── 사이드바 ─────────
function setStatus(text, cls) { $('#status-text').textContent = text; $('#status').className = 'mast-status ' + (cls || ''); const d = $('#mdot'); if (d) { d.className = 'mbar-dot ' + (cls || ''); d.title = text; } }
// 휴대폰: 좁은 화면이면 사이드바를 서랍으로 연다. 손가락 입력(터치)이면 끌어 놓기 대신 파일 고르기 문구를 쓴다
const narrow = () => window.matchMedia('(max-width: 760px)').matches;
const touch = () => window.matchMedia('(pointer: coarse)').matches;
function openSide(open) {
  const side = $('#side'); const scrim = $('#scrim'); if (!side) return;
  side.classList.toggle('open', !!open); if (scrim) scrim.hidden = !open;
  $('#mnav')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.classList.toggle('drawer', !!open);
  if (open) side.querySelector('select, button')?.focus();
}
// 분야 거르기: 한 학술지가 여러 분야에 들 수 있다. 사용자가 추가한 학회는 ‘전체’에서만 보인다
const inArea = (j, a) => !a || (AREA_OF[j.id] || []).includes(a);
function renderSide() {
  const area = $('#jarea');
  if (area) area.replaceChildren(h('option', { value: '' }, `전체 분야 (${state.journals.length})`), ...AREAS.map((a) => { const n = state.journals.filter((j) => inArea(j, a.id)).length; return h('option', { value: a.id, title: a.en, selected: a.id === state.area ? '' : null }, `${a.label} (${n})`); }));
  const sel = $('#jsel'); sel.replaceChildren(h('option', { value: '' }, state.area ? '이 분야의 학회지를 고르세요…' : '학회지를 고르세요…'));
  // 등재지 → 등재후보지 → 그 밖(등급 미기재·사용자 학회) 순, 묶음 안은 학술지 이름 가나다순
  const tier = (j) => (/후보/.test(j.grade || '') ? 1 : /등재/.test(j.grade || '') ? 0 : 2);
  const byName = (a, b) => (a.journal || '').localeCompare(b.journal || '', 'ko');
  const groups = [['등재지', (j) => tier(j) === 0], ['등재후보지', (j) => tier(j) === 1], ['그 밖의 학회', (j) => tier(j) === 2]];
  for (const [label, test] of groups) {
    const items = state.journals.filter((j) => test(j) && (inArea(j, state.area) || j.id === state.journalId)).sort(byName); if (!items.length) continue;   // 고른 학회는 분야가 달라도 목록에 남긴다
    sel.append(h('optgroup', { label: `${label} (${items.length})` }, ...items.map((j) => h('option', { value: j.id, selected: j.id === state.journalId ? '' : null }, `${j.journal} — ${j.society}${j.custom ? ' (사용자)' : ''}`))));
  }
  const j = journal(); const meta = $('#jmeta'); const sub = $('#jsub'); meta.replaceChildren(); sub.replaceChildren();
  if (j) {
    const nd = nextDeadlines(j)[0]; const left = nd ? daysLeft(nd.date) : null;
    meta.append(h('div', {}, h('b', {}, j.grade || '등급 미기재')), nd ? h('div', {}, `다음 마감 ${nd.deadline}${left !== null ? (left >= 0 ? ` · D-${left}` : ' · 지남') : ''}`) : h('div', {}, '마감은 공지로 확인'));
    sub.append(h('button', { type: 'button', class: state.view === 'journal' ? 'on' : '', onclick: () => { state.view = 'journal'; render(); } }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '§'), '투고 양식 및 규정 확인'));
    if (safeUrl(j.submit?.url)) sub.append(h('a', { class: 'ext', href: safeUrl(j.submit.url), target: '_blank', rel: 'noopener noreferrer' }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '↗'), `투고처 이동 (${j.submit.system || '사이트'})`));
    else sub.append(h('button', { type: 'button', disabled: '' }, h('span', { class: 'ico', 'aria-hidden': 'true' }, '↗'), '투고처 주소 없음'));
  }
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.view === state.view));
  const mj = $('#mjour'); if (mj) mj.textContent = j ? j.journal : '투고처 고르기';
}

// ───────── 렌더 ─────────
function render() {
  renderSide();
  const main = $('#main'); main.replaceChildren();
  ({ convert: renderConvert, journal: renderJournal, schedule: renderSchedule, manage: renderManage, help: renderHelp })[state.view](main);
}

// ── 원고 변환
function renderConvert(main) {
  const j = journal(); const m = state.manuscript; const o = state.options;
  // 상단 바: 파일명 · 적용 · 저장 · 설정
  const canApply = state.ready && !!(m && j && state.blocks);
  const applyBtn = h('button', { class: 'btn red', disabled: canApply ? null : '', onclick: runConvert }, state.dirty && state.result ? '다시 적용' : '적용');
  const saveWrap = h('div', { class: 'rel' });
  const saveBtn = h('button', { class: 'btn', disabled: state.result && !state.dirty ? null : '', onclick: () => saveResult('hwp') }, '저장');
  const canShare = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && touch();   // 휴대폰 공유 시트(파일 앱·드라이브·메신저로 보내기)
  const moreBtn = h('button', { class: 'btn ghost', 'aria-label': '다른 형식으로 저장', disabled: state.result && !state.dirty ? null : '', onclick: () => { const open = saveWrap.querySelector('.menu'); if (open) open.remove(); else saveWrap.append(h('div', { class: 'menu' }, canShare ? h('button', { onclick: () => saveResult('hwp', { share: true }) }, 'HWP 공유하기(파일 앱·드라이브·메신저)') : null, h('button', { onclick: () => saveResult('hwpx') }, 'HWPX로 저장'), h('button', { onclick: () => saveResult('docx') }, 'Word(DOCX)로 저장'), h('button', { onclick: () => saveResult('log') }, '변환 로그(txt) 저장'))); } }, '▾');
  saveWrap.append(h('div', { class: 'row', style: 'gap:4px' }, saveBtn, moreBtn));
  const setWrap = h('div', { class: 'rel' });
  const setBtn = h('button', { class: 'btn ghost', 'aria-expanded': 'false', onclick: () => { const open = setWrap.querySelector('.pop'); if (open) { open.remove(); setBtn.setAttribute('aria-expanded', 'false'); } else { setWrap.append(settingsPop()); setBtn.setAttribute('aria-expanded', 'true'); } } }, '설정');
  setWrap.append(setBtn);
  // 버튼 묶음(acts): 넓은 화면에서는 제목 줄 오른쪽, 휴대폰에서는 화면 아래 고정 막대
  main.append(h('div', { class: 'topbar' },
    h('h1', {}, m ? m.name : '원고 변환'), h('span', { class: 'sub' }, j ? `→ ${j.journal}` : '투고처를 먼저 고르세요'),
    h('span', { class: 'grow' }), h('div', { class: 'acts' }, setWrap, applyBtn, saveWrap)));

  if (!m) {
    // 휴대폰 파일 앱은 모르는 확장자(.hwp)를 흐리게 막는 경우가 있어, 터치 기기에서는 형식 제한을 두지 않고 열 때 확인한다
    const input = h('input', { type: 'file', accept: touch() ? null : '.hwp,.hwpx,.hml,.docx,.txt,.md', 'aria-label': '원고 파일', onchange: (e) => { const f = e.target.files[0]; if (f) openFile(f); } });
    // 처음 연 사람에게만 세 단계 안내(투고처를 고르거나 닫으면 다시 보이지 않음)
    if (!j && !lsGet(LS.welcomed, false)) main.append(h('section', { class: 'welcome', 'aria-label': '처음 사용 안내' }, art('welcome', 'welcome-art'),
      h('div', {}, h('h2', {}, '투고틀을 처음 여셨네요'), h('p', {}, '원고를 학회 양식으로 바꾸는 데 세 단계면 됩니다. 원고는 이 기기 밖으로 나가지 않습니다.'),
        h('ol', {}, h('li', {}, h('b', {}, '투고처 고르기'), ' — 학회지를 고르면 그 학회의 양식과 규정을 불러옵니다.'), h('li', {}, h('b', {}, '원고 넣기'), ' — HWP·HWPX·DOCX를 놓거나 고르면 문단 역할을 읽습니다.'), h('li', {}, h('b', {}, '적용하고 저장'), ' — 미리 보고 확인한 뒤 HWP로 저장합니다.')),
        h('div', { class: 'row', style: 'margin-top:12px' }, narrow() ? h('button', { class: 'btn', onclick: () => openSide(true) }, '투고처 고르기') : null, h('button', { class: 'btn ghost sm', onclick: () => { lsSet(LS.welcomed, true); render(); } }, '안내 닫기')))));
    const dz = h('div', { class: 'dropzone', role: 'button', tabindex: '0', onclick: () => input.click(), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } } },
      h('div', {}, art('empty', 'dz-art'), h('strong', {}, touch() ? '원고 파일을 고르세요' : '원고 파일을 이 화면에 끌어다 놓으세요'), h('p', {}, touch() ? 'HWP · HWPX · DOCX · TXT · MD — 파일 앱·드라이브에서 고르면 바로 열리고, ‘적용’을 누르면 학회 양식이 입혀진 결과를 저장 전에 미리 봅니다.' : 'HWP · HWPX · DOCX · TXT · MD — 놓는 즉시 열리고, ‘적용’을 누르면 학회 양식이 입혀진 결과를 저장 전에 미리 봅니다.'), h('span', { class: touch() ? 'btn' : 'btn ghost' }, '파일 선택'), input));
    main.append(dz);
    main.append(h('p', { class: 'hero', style: 'margin-top:18px' }, h('b', {}, '원고 내용은 바꾸지 않습니다.'), ' 학회 바탕틀의 글꼴·크기·줄간격·여백·각주 설정을 물려받고, 체재 순서와 쪽수·쪽수 범위 기호·낫표·서지 표기만 각주와 참고문헌에서 규칙대로 맞춥니다. 표·그림은 칸 안·캡션의 각주까지 그대로 옮깁니다. AI는 쓰지 않습니다.'));
    return;
  }

  // 작업 화면: 왼쪽 원고 구조, 오른쪽 미리보기/변경 사항/확인
  const left = h('div', { class: 'pane' });
  const info = h('div', { class: 'row small', style: 'gap:6px' }, h('span', { class: 'tag' }, m.parsed.format), h('span', { class: 'tag' }, `문단 ${m.parsed.paragraphs.length}`), h('span', { class: 'tag' }, `각주 ${m.parsed.counts.footnotes}`),
    m.parsed.counts.tables ? h('span', { class: 'tag' }, `표 ${m.parsed.counts.tables}`) : null, m.parsed.counts.pictures ? h('span', { class: 'tag' }, `그림 ${m.parsed.counts.pictures}`) : null,
    m.parsed.counts.objectsLost ? h('span', { class: 'tag warn' }, `옮기지 못한 표·그림 ${m.parsed.counts.objectsLost}`) : null);
  left.append(h('div', { class: 'pane-h' }, '원고 구조', h('span', { class: 'grow' }), info, h('button', { class: 'btn ghost sm', onclick: () => { state.manuscript = null; state.blocks = null; state.result = null; render(); } }, '다른 원고')));
  const lb = h('div', { class: 'pane-b' });
  if (m.error) lb.append(h('p', { class: 'err' }, m.error));
  if (!j) lb.append(h('p', { class: 'muted' }, '‘투고처 선택’에서 학회지를 고르면 문단 역할을 인식합니다.', narrow() ? h('button', { class: 'btn sm', style: 'margin-left:8px', onclick: () => openSide(true) }, '투고처 고르기') : null));
  else if (state.blocks) renderStructure(lb);
  left.append(lb);

  const right = h('div', { class: 'pane' });
  const tabs = [['preview', '미리보기'], ['errata', '정오표'], ['changes', '변경 사항'], ['check', '투고 전 확인'], ['log', '과정']];
  right.append(h('div', { class: 'pane-h' }, h('div', { class: 'tabs', role: 'tablist' }, ...tabs.map(([k, l]) => h('button', { type: 'button', role: 'tab', 'aria-selected': k === state.tab ? 'true' : 'false', class: k === state.tab ? 'on' : '', onclick: () => { state.tab = k; render(); } }, l))), h('span', { class: 'grow' }), state.result ? h('span', { class: 'small muted' }, `${state.result.pages}쪽 · ${state.result.elapsed} ms${state.dirty ? ' · 설정이 바뀜 — 다시 적용' : ''}`) : null));
  const rb = h('div', { class: 'pane-b' });
  if (!state.result) rb.append(h('div', { class: 'placeholder' }, h('div', {}, h('b', {}, '적용'), '을 누르면 ', j ? `${j.journal} 양식` : '학회 양식', '이 입혀진 쪽을 여기에서 미리 보고, 바뀐 내용을 확인한 뒤 저장합니다.')));
  else if (state.tab === 'preview') {
    // 적용을 마친 직후: 결과 요약과 저장 단추(닫으면 이 결과에서는 다시 보이지 않음)
    const r = state.result;
    if (!r.doneHidden) rb.append(h('div', { class: 'done-card', role: 'status' }, art('done', 'done-art'),
      h('div', {}, h('h3', {}, '적용을 마쳤습니다'), h('p', {}, `${j ? j.journal + ' 양식' : '학회 양식'} · ${r.pages}쪽 · 각주 ${r.stats?.footnotes ?? 0}개${m.parsed.counts.tables ? ` · 표 ${m.parsed.counts.tables}개` : ''}${m.parsed.counts.pictures ? ` · 그림 ${m.parsed.counts.pictures}개` : ''}. 아래 미리보기를 확인하고 저장하세요.`),
        h('div', { class: 'row' }, h('button', { class: 'btn', disabled: state.dirty ? '' : null, onclick: () => saveResult('hwp') }, 'HWP로 저장'), h('button', { class: 'btn ghost', onclick: () => { state.tab = 'check'; render(); } }, '투고 전 확인 보기'), h('button', { class: 'btn ghost sm', 'aria-label': '완료 안내 닫기', onclick: () => { r.doneHidden = true; render(); } }, '닫기')))));
    rb.append(pagesView(state.result));
  }
  else if (state.tab === 'errata') rb.append(errataView(state.result));
  else if (state.tab === 'changes') rb.append(changesView(state.result));
  else if (state.tab === 'check') rb.append(h('ul', { class: 'check' }, ...state.result.checklist.map((c) => h('li', { class: c.ok ? 'ok' : (c.warn ? 'warn' : 'no') }, c.text))));
  else rb.append(h('div', { class: 'log' }, ...state.result.steps.map((s) => h('div', { class: s.kind }, h('span', { class: 't' }, `${s.t} ms`), h('span', { class: s.kind }, s.msg)))));
  right.append(rb);
  // 휴대폰: 원고 구조와 결과를 한 번에 하나씩(탭으로 바꿔 본다)
  const mp = state.mpane || (state.result ? 'result' : 'struct');
  main.append(h('div', { class: 'mseg seg', role: 'tablist', 'aria-label': '보기 전환' }, ...[['struct', '원고 구조'], ['result', state.result ? '결과 미리보기' : '결과']].map(([k, l]) => h('button', { type: 'button', role: 'tab', class: mp === k ? 'on' : '', 'aria-selected': mp === k ? 'true' : 'false', onclick: () => { state.mpane = k; render(); window.scrollTo(0, 0); } }, l))));
  main.append(h('div', { class: 'work', 'data-m': mp }, left, right));
  const db = docbar(); if (db) main.append(db);
}

function settingsPop() {
  const o = state.options; const j = journal();
  const seg = (key, items) => h('div', { class: 'seg', role: 'group' }, ...items.map(([v, l, title]) => h('button', { type: 'button', class: o[key] === v ? 'on' : '', title: title || null, 'aria-pressed': o[key] === v ? 'true' : 'false', onclick: () => { o[key] = v; saveOpts(); state.dirty = !!state.result; render(); } }, l)));
  const chk = (key, label, hint) => h('label', { class: 'opt' }, h('input', { type: 'checkbox', checked: o[key] ? '' : null, onchange: (e) => { o[key] = e.target.checked; saveOpts(); state.dirty = !!state.result; render(); } }), label, hint ? h('span', { class: 'small muted' }, hint) : null);
  return h('div', { class: 'pop', role: 'dialog', 'aria-label': '변환 설정' },
    h('div', {}, h('div', { class: 'lbl' }, '각주·참고문헌 서지 양식'), seg('cite', CITE_STYLES.map((s) => [s.id, s.label, s.desc])), h('div', { class: 'small muted', style: 'margin-top:4px' }, CITE_STYLES.find((s) => s.id === o.cite)?.desc, j && o.cite === 'journal' ? ` — ${j.journal}: 쪽수 ‘${j.footnote?.pageUnit || '원고 그대로'}’` : '')),
    chk('reorder', '학회 체재 순서로 재배열', j ? (j.structure || []).map((g) => SECTION_LABELS[g]).join(' → ') : ''),
    chk('dropAuthor', '저자·소속 제외 (심사용 익명 원고)'),
    chk('keepSourceBlanks', '원고의 빈 줄 그대로 두기'),
    chk('errata', '각주·참고문헌 정오표', '어긋난 항목을 산출물에 붉게 표시'),
    chk('toc', '목차 자동 생성', '원고에 목차가 없고 학회 체재에 목차가 있으면 장 제목으로 만듦'));
}

function renderStructure(el) {
  const blocks = state.blocks; const j = journal();
  const counts = {}; for (const b of blocks) counts[b.role] = (counts[b.role] || 0) + 1;
  const est = estimateLength(blocks);
  el.append(h('div', { class: 'counts' }, h('span', {}, '200자 원고지 약 ', h('b', {}, est.sheets), '매', j?.length?.max ? ` / 한도 ${j.length.max}매` : ''), ...Object.entries(counts).filter(([k]) => k !== 'blank' && k !== 'body').map(([k, v]) => h('span', {}, `${roleLabel(k)} `, h('b', {}, v)))));
  const tbl = h('table', {}, h('thead', {}, h('tr', {}, h('th', { style: 'width:150px' }, '역할'), h('th', {}, '내용'))));
  const tb = h('tbody', {});
  blocks.forEach((b, i) => {
    if (b.role === 'blank') return;
    const sel = h('select', { 'aria-label': `${i + 1}번 문단 역할`, onchange: (e) => { b.role = e.target.value; b.auto = false; b.reason = '직접 지정'; state.dirty = !!state.result; render(); } },
      ...ROLE_DEFS.map((r) => h('option', { value: r.id, selected: r.id === b.role ? '' : null }, r.label)));
    // 표·그림은 글 대신 개체 요약(표 행×열, 캡션)을 보인다
    const objTags = (b.objects || []).map((o) => h('span', { class: 'fn obj' }, `${o.kind === 'table' ? `표${o.info?.rows ? ` ${o.info.rows}×${o.info.cols}` : ''}` : o.kind === 'picture' ? '그림' : o.kind === 'equation' ? '수식' : '도형'}${o.info?.caption ? ` · ${o.info.caption.slice(0, 30)}` : ''}`));
    tb.append(h('tr', { class: b.role + (b.auto ? '' : ' manual') }, h('td', {}, sel), h('td', { class: 'txt', title: `${b.reason || ''}\n${b.text}` }, b.text, ...objTags, b.footnotes?.length ? h('span', { class: 'fn' }, `각주 ${b.footnotes.length}`) : null)));
  });
  tbl.append(tb);
  el.append(h('div', { class: 'struct' }, tbl));
  el.append(h('div', { class: 'row small muted', style: 'margin-top:8px' }, h('button', { class: 'btn ghost sm', onclick: () => { recompute(true); render(); } }, '역할 다시 인식'), '잘못 잡힌 역할은 목록에서 바꾼 뒤 ‘다시 적용’을 누르세요.'));
}

// 각주 영역과 겹쳐 그려진 본문 줄 수 — rhwp 0.8.7은 각주가 많은 쪽에서 본문 줄을 다음 쪽으로 넘기지 않는다(한글은 열 때 다시 배치한다)
function footnoteOverlap(doc, page) {
  if (typeof doc.getPageRenderTree !== 'function') return 0;
  const tree = JSON.parse(doc.getPageRenderTree(page));
  let fnTop = Infinity; const lines = [];
  const walk = (n, inBody) => { if (!n || typeof n !== 'object') return; if (n.type === 'FootnoteArea' && n.bbox) fnTop = Math.min(fnTop, n.bbox.y); if (n.type === 'TextLine' && inBody && n.bbox) lines.push(n.bbox); for (const c of n.children || []) walk(c, inBody || n.type === 'Body'); };
  walk(tree, false);
  if (!isFinite(fnTop)) return 0;
  return lines.filter((b) => b.y + b.h > fnTop + 1).length;
}

// 본문 잘라내기 영역을 좌우로 조금 넓힌다 — 글꼴 대체로 글자가 원점보다 왼쪽에 그려지면 첫 글자가 잘려 보인다(미리보기만의 문제)
function widenClips(svg) {
  for (const rc of svg.querySelectorAll('clipPath rect')) { const x = +rc.getAttribute('x'); const w = +rc.getAttribute('width'); if (!isFinite(x) || !isFinite(w) || w < 100) continue; rc.setAttribute('x', x - 24); rc.setAttribute('width', w + 48); }
}
// 붉게 표시된 글자(정오표)에 마우스를 올리면 이유가 보이도록 SVG <title>을 단다
function annotateErrata(svg, errata) {
  const norm = (s) => (s || '').replace(/[\s\u200b]+/g, '');
  const items = [...errata.notes.filter((n) => n.status !== 'ok').map((n) => ({ key: norm(n.text), why: `각주 ${n.no}) — ${n.issues.join(' · ')}` })),
    ...errata.refs.filter((x) => x.uncited || x.issues.length).map((x) => ({ key: norm(x.text), why: `참고문헌 — ${[x.uncited ? '각주에서 한 번도 인용되지 않음' : '', ...x.issues].filter(Boolean).join(' · ')}` }))];
  if (!items.length) return;
  const reds = [...svg.querySelectorAll('text')].filter((t) => /^#ff0000$/i.test(t.getAttribute('fill') || ''));
  const lines = new Map();
  for (const t of reds) { const y = Math.round(+t.getAttribute('y')); if (!lines.has(y)) lines.set(y, []); lines.get(y).push(t); }
  for (const ts of lines.values()) {
    ts.sort((a, b) => +a.getAttribute('x') - +b.getAttribute('x'));
    const line = norm(ts.map((t) => t.textContent).join(''));
    const probe = line.slice(0, 16);
    const hit = probe.length >= 4 ? items.find((it) => it.key.includes(probe)) : null;
    if (!hit) continue;
    for (const t of ts) { const ti = document.createElementNS('http://www.w3.org/2000/svg', 'title'); ti.textContent = hit.why; t.append(ti); t.setAttribute('style', 'cursor:help'); }
  }
}

// 쪽 미리보기 — 보이는 만큼만 그린다
function pagesView(r) {
  const box = h('div', { class: 'pages' });
  if (!r.pages) { box.append(h('p', { class: 'muted' }, '그릴 쪽이 없습니다.')); return box; }
  let next = 0; const step = 2;
  const sentinel = h('div', { style: 'height:1px;width:100%' });
  const drawMore = () => {
    for (let k = 0; k < step && next < r.pages; k++, next++) {
      const pg = h('div', { class: 'page' }, h('span', { class: 'pn' }, `${next + 1} / ${r.pages}`));
      try { const w = h('div', {}); w.innerHTML = r.doc.renderPageSvg(next); const svg = w.firstElementChild; svg.removeAttribute('width'); svg.removeAttribute('height'); widenClips(svg); if (r.errata) annotateErrata(svg, r.errata); pg.append(svg); }
      catch (e) { pg.append(h('p', { class: 'err', style: 'padding:20px' }, '미리보기 실패: ' + e)); }
      try { const n = footnoteOverlap(r.doc, next); if (n) pg.append(h('span', { class: 'fnwarn', title: '미리보기 엔진(rhwp)은 각주가 많은 쪽에서 본문을 다음 쪽으로 넘기지 못해 본문과 각주가 겹쳐 보입니다. 저장한 HWP는 한글이 열 때 다시 배치하므로 겹치지 않습니다.' }, `각주가 많은 쪽 — 본문 ${n}줄이 각주 영역과 겹쳐 보임(미리보기만, 저장 파일은 정상)`)); } catch {}

      box.insertBefore(pg, sentinel);
    }
    if (next >= r.pages) { io.disconnect(); sentinel.remove(); }
  };
  box.append(sentinel);
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) drawMore(); }, { root: box, rootMargin: '400px' });
  drawMore(); io.observe(sentinel);
  return box;
}

function changesView(r) {
  const el = h('div', { class: 'changes' });
  const sec = (title, items) => { if (!items || !items.length) return; el.append(h('h4', {}, title), h('ul', {}, ...items.map((x) => h('li', {}, x)))); };
  sec('적용한 처리', r.notes);
  if (r.cite?.samples?.length) { el.append(h('h4', {}, `서지 표기 변경 예 (${r.cite.converted}곳 변환${r.cite.unrecognized ? `, 인식 못 한 ${r.cite.unrecognized}곳은 그대로` : ''})`)); el.append(h('div', { class: 'diff' }, ...r.cite.samples.flatMap((s) => [h('div', { class: 'b' }, s.before), h('div', { class: 'a' }, s.after)]))); }
  if (r.subst?.length) { el.append(h('h4', {}, `쪽수·낫표 치환 예 (${r.subst.reduce((a, c) => a + (c.n || 1), 0)}곳)`)); el.append(h('div', { class: 'diff' }, ...r.subst.slice(0, 5).flatMap((s) => [h('div', { class: 'b' }, s.before), h('div', { class: 'a' }, s.after)]))); }
  const warns = r.steps.filter((s) => s.kind === 'warn').map((s) => s.msg);
  sec('주의', warns);
  sec('역할별 문단 수', Object.entries(r.stats?.roles || {}).map(([k, v]) => `${roleLabel(k)} ${v}`));
  if (!el.children.length) el.append(h('p', { class: 'muted' }, '바뀐 것이 없습니다.'));
  return el;
}

// 정오표 — 각주 ↔ 참고문헌 대조 결과 (붉은 항목은 산출물에도 붉게 들어간다)
function errataView(r) {
  const e = r.errata;
  if (!e) return h('p', { class: 'muted', style: 'padding:12px' }, '설정에서 ‘각주·참고문헌 정오표’를 켜고 다시 적용하면 여기에 나옵니다.');
  const s = e.summary;
  const el = h('div', { class: 'errata' });
  el.append(h('div', { class: 'counts' }, h('span', {}, '각주 ', h('b', {}, s.footnotes)), h('span', { class: s.noRef ? 'err' : '' }, '참고문헌에 없는 인용 ', h('b', {}, s.noRef)), h('span', { class: s.formatBad ? 'err' : '' }, '양식 어긋남 ', h('b', {}, s.formatBad)), h('span', {}, '참고문헌 ', h('b', {}, s.refs)), h('span', { class: s.uncited ? 'err' : '' }, '인용되지 않음 ', h('b', {}, s.uncited))));
  const lk = (t) => h('span', { class: 'small' }, h('a', { href: t.links.scholar, target: '_blank', rel: 'noopener' }, 'Scholar'), ' · ', h('a', { href: t.links.riss, target: '_blank', rel: 'noopener' }, 'RISS'), ' · ', h('a', { href: t.links.kci, target: '_blank', rel: 'noopener' }, 'KCI'));
  const bad = e.notes.filter((x) => x.status !== 'ok');
  el.append(h('h4', {}, `각주 — 확인할 항목 ${bad.length}개`));
  if (bad.length) el.append(h('table', {}, h('thead', {}, h('tr', {}, h('th', { style: 'width:44px' }, '번호'), h('th', {}, '각주'), h('th', { style: 'width:220px' }, '문제'), h('th', { style: 'width:130px' }, '검색'))), h('tbody', {}, ...bad.map((x) => h('tr', {}, h('td', {}, x.no), h('td', { class: 'err', style: 'font-size:12.5px' }, x.text.slice(0, 140)), h('td', { class: 'small' }, x.issues.join(' / ')), h('td', {}, lk(x)))))));
  else el.append(h('p', { class: 'muted small' }, '각주의 인용은 모두 참고문헌에 있고 양식도 규정과 맞습니다.'));
  const un = e.refs.filter((x) => x.uncited || x.issues.length);
  el.append(h('h4', {}, `참고문헌 — 확인할 항목 ${un.length}개`));
  if (un.length) el.append(h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, '항목'), h('th', { style: 'width:220px' }, '문제'), h('th', { style: 'width:130px' }, '검색'))), h('tbody', {}, ...un.map((x) => h('tr', {}, h('td', { class: 'err', style: 'font-size:12.5px' }, x.text.slice(0, 140)), h('td', { class: 'small' }, [x.uncited ? '각주에서 인용되지 않음' : null, ...x.issues].filter(Boolean).join(' / ')), h('td', {}, lk(x)))))));
  else el.append(h('p', { class: 'muted small' }, '참고문헌 항목은 모두 각주에서 인용되었습니다.'));
  el.append(h('p', { class: 'small muted', style: 'margin-top:10px' }, '대조는 제목·저자 글자 비교 규칙으로만 하며 외부에 아무것도 보내지 않습니다. 검색 링크는 새 창에서 직접 확인하는 용도입니다(오자·연도·권호 확인). ‘위의 책’류 반복 표기는 바로 앞 인용을 따릅니다.'));
  return el;
}

// 하단 문서정보 바 — 한글의 상태 표시줄처럼 원고 분량과 학회 규정 매수를 나란히 보여 준다. 초과분은 알려 줄 뿐 자동으로 줄이지 않는다.
function docbar() {
  const m = state.manuscript; const j = journal(); const r = state.result;
  if (!m) return null;
  const blocks = state.blocks || [];
  const est = estimateLength(blocks.length ? blocks : m.parsed.paragraphs.map((q) => ({ role: 'body', text: q.text, footnotes: q.footnotes })));
  const items = [];
  items.push(h('span', {}, '글자 ', h('b', {}, est.chars.toLocaleString()), h('span', { class: 'dim' }, ` (공백 제외 ${est.charsNoSpace.toLocaleString()})`)));
  items.push(h('span', {}, '각주 ', h('b', {}, m.parsed.counts.footnotes || 0), est.fnChars ? h('span', { class: 'dim' }, ` · ${est.fnChars.toLocaleString()}자`) : null));
  items.push(h('span', {}, '200자 원고지 약 ', h('b', {}, est.sheets), '매'));
  if (j?.length?.max) {
    const over = Math.round((est.sheets - j.length.max) * 10) / 10;
    items.push(h('span', { class: over > 0 ? 'over' : 'okay' }, `규정 ${j.length.max}매`, over > 0 ? [' · ', h('b', {}, `${over}매 초과`), h('span', { class: 'dim' }, ` (약 ${Math.round(over * 200).toLocaleString()}자)`)] : [' · ', h('b', {}, `${Math.abs(over)}매 여유`)]));
  } else if (j?.length?.text) items.push(h('span', { class: 'dim', title: j.length.text }, `규정 분량: ${j.length.text.slice(0, 28)}${j.length.text.length > 28 ? '…' : ''}`));
  if (r) items.push(h('span', {}, '적용 후 ', h('b', {}, r.pages), '쪽'));
  if (m.parsed.counts.tables || m.parsed.counts.pictures) items.push(h('span', { class: 'dim' }, [m.parsed.counts.tables ? `표 ${m.parsed.counts.tables}` : null, m.parsed.counts.pictures ? `그림 ${m.parsed.counts.pictures}` : null].filter(Boolean).join(' · ') + (m.parsed.counts.objectsLost ? ` (옮기지 못함 ${m.parsed.counts.objectsLost})` : ' (옮김)')));
  return h('div', { class: 'docbar', role: 'status', 'aria-live': 'polite', title: '분량은 안내일 뿐이며 초과분을 자동으로 줄이거나 고치지 않습니다. 매수 초과는 학회에 따라 추가 게재료 대상입니다.' }, ...items.flatMap((x, i) => (i ? [h('span', { class: 'sep', 'aria-hidden': 'true' }, '·'), x] : [x])));
}

// ───────── 동작 ─────────
function saveOpts() { lsSet(LS.opts, state.options); }
async function openFile(file) {
  state.result = null; state.blocks = null; state.baseBlocks = null; state.dirty = false;
  try {
    if (file.size > 64 * 1024 * 1024) throw new Error('원고 파일이 64 MB를 넘습니다. 그림을 빼고 다시 저장해 주세요.');   // 읽기 전에 거부(메모리 할당 전)
    const bytes = new Uint8Array(await file.arrayBuffer());
    const parsed = await parseManuscript(file.name, bytes);
    state.manuscript = { name: file.name, parsed };
  } catch (e) { state.manuscript = { name: file.name, parsed: { format: '?', paragraphs: [], warnings: [], counts: {} }, error: String(e.message || e) }; }
  state.view = 'convert'; state.tab = 'preview';
  recompute(true); render();
}
function recompute(reRecognize = false) {
  const j = journal(); const m = state.manuscript;
  if (!j || !m || !m.parsed.paragraphs.length) { state.blocks = null; return; }
  if (reRecognize || !state.baseBlocks) state.baseBlocks = recognize(m.parsed.paragraphs, j);
  state.blocks = state.baseBlocks.map((b) => ({ ...b }));
  state.result = null; state.dirty = false;
}
function finalizeBlocks() {
  const j = journal(); const o = state.options; const notes = [];
  let blocks = state.blocks.map((b) => ({ ...b }));
  if (o.dropAuthor) {
    // 익명화: 이름 꼴로 확실히 인식됐거나 사용자가 직접 지정한 저자·소속만 뺀다(자동 추정 '앞부분 짧은 줄'은 두 줄 제목일 수 있어 남긴다)
    // 자동 인식된 ‘이름 형태’가 연달아 둘 이상이면 앞의 것은 두 줄 제목일 수 있다 — 삭제하지 않고 구조 표에서 확인하게 둔다(원고 유실 금지)
    const nameRuns = []; blocks.forEach((b, i) => { if (b.auto && b.role === 'author' && /이름 형태/.test(b.reason || '')) { const prev = nameRuns[nameRuns.length - 1]; if (prev && prev.end === i - 1) prev.end = i; else nameRuns.push({ start: i, end: i }); } });
    const ambiguous = new Set(); for (const r of nameRuns) if (r.end > r.start) for (let i = r.start; i < r.end; i++) ambiguous.add(i);
    const isAuthorBlock = (b) => /^(author|affiliation|authorEn)$/.test(b.role) && (!b.auto || /이름 형태|별표 소속|영문 이름/.test(b.reason || '')) && !ambiguous.has(blocks.indexOf(b));
    const kept = blocks.filter((b) => /^(author|affiliation|authorEn)$/.test(b.role) && !isAuthorBlock(b)).length;
    const removedTexts = blocks.filter(isAuthorBlock).map((b) => (b.text || '').trim().replace(/\s+/g, ' ').slice(0, 14));
    const n = removedTexts.length; blocks = blocks.map((b) => (isAuthorBlock(b) ? { ...b, role: 'skip' } : b));
    if (n) notes.push(`저자·소속 ${n}개 문단 제외(익명화): ${removedTexts.map((t) => `‘${t}’`).join(', ')} — 제목의 일부가 섞였으면 구조 표에서 역할을 고치세요`); if (kept) notes.push(`저자로 추정만 된 ${kept}개 문단은 제목일 수 있어 남김 — 구조 표에서 확인`);
  }
  if (o.toc !== false) { const t = buildToc(blocks, j); if (t.added) { blocks = t.blocks; notes.push(`목차(‘${t.label}’) ${t.added}항목을 장 제목에서 생성 — 원고에 목차가 없고 학회 체재에 목차가 있음`); } }
  if (o.reorder) { const r = reorderSections(blocks, j); blocks = r.blocks; if (r.changed) notes.push(`체재 순서 재배열: ${r.from.join(' → ')} ⇒ ${r.to.join(' → ')}`); }
  let subst = []; let cite = null; let errata = null;
  if (o.cite !== 'keep') {
    const unit = j.footnote?.pageUnit || 'keep';
    const sub = applySubstitutions(blocks, j, { pageUnit: unit === 'pp.' ? 'p.' : unit, marks: 'keep' });
    blocks = sub.blocks; subst = sub.changes; if (subst.length) notes.push(`쪽수 표기 치환 ${subst.reduce((a, c) => a + (c.n || 1), 0)}곳 (${[...new Set(subst.map((c) => c.where))].join(', ')})`);
    if (o.errata) errata = buildErrata(blocks, j);   // 서지 변환 앞에서 대조한다(APA는 낫표가 없어 변환 뒤에는 키를 못 뽑는다). 붉은 표시(flag)는 변환 뒤에도 남는다
    if (o.cite === 'apa' || o.cite === 'chicago') { cite = restyleCitations(blocks, o.cite); blocks = cite.blocks;
      if (errata) { errata.refs.forEach((r) => { r.text = (blocks[r.bi].text || '').trim(); }); let k = 0; for (const b of blocks) for (const f of [...(b.footnotes || [])].sort((a, c) => (a.offset ?? 0) - (c.offset ?? 0))) errata.notes[k++].text = f.text || ''; } /* 미리보기 말풍선이 변환된 글과 맞도록 */ notes.push(`서지 표기 ${CITE_STYLES.find((s) => s.id === o.cite).label} 양식으로 ${cite.converted}곳 변환${cite.unrecognized ? `, 인식 못 한 ${cite.unrecognized}곳은 원고대로` : ''}`); }
  } else notes.push('서지·쪽수 표기는 원고 그대로 둠');
  if (o.errata && !errata) errata = buildErrata(blocks, j);
  if (errata) { const s = errata.summary; notes.push(`정오표: 각주 ${s.footnotes}개 중 참고문헌에 없는 인용 ${s.noRef}, 양식 어긋남 ${s.formatBad} · 참고문헌 ${s.refs}개 중 인용되지 않음 ${s.uncited}, 양식 어긋남 ${s.refFormatBad}`); }
  const bl = applyBlanks(blocks, j, { keepSourceBlanks: o.keepSourceBlanks });
  blocks = bl.blocks; if (bl.dropped) notes.push(`원고의 빈 줄 ${bl.dropped}개 제거`); if (bl.inserted) notes.push(`학회 규칙에 따른 빈 줄 ${bl.inserted}개 삽입`);
  if (j.pageBreakBefore) for (const b of blocks) if (j.pageBreakBefore.includes(b.role)) b.pageBreakBefore = true;
  return { blocks, notes, subst, cite, errata };
}
async function runConvert() {
  const j = journal(); if (!j || !state.blocks) return;
  if (state.result) { state.result.doc?.free?.(); }
  setStatus('적용 중…', '');
  try {
    const { blocks, notes, subst, cite, errata } = finalizeBlocks();
    const res = await buildDocument({ journal: j, templateBytes: templateBytes(j), blocks });
    res.steps.unshift({ t: 0, msg: `원고 ‘${state.manuscript.name}’ (${state.manuscript.parsed.format}) → ${j.journal} (${j.society})`, kind: 'info' });
    res.checklist = checklist(blocks, j); res.notes = notes; res.subst = subst; res.cite = cite; res.errata = errata;
    const roles = {}; for (const b of blocks) if (b.role !== 'blank' && b.role !== 'skip') roles[b.role] = (roles[b.role] || 0) + 1; res.stats = { ...(res.stats || {}), roles };
    res.logText = [`투고틀 변환 로그 — ${new Date().toLocaleString('ko-KR')}`, ...notes.map((n) => `· ${n}`), ...res.steps.map((s) => `[${String(s.t).padStart(5)} ms] ${s.kind === 'warn' ? '△ ' : ''}${s.msg}`), '', '투고 전 확인:', ...res.checklist.map((c) => `${c.ok ? '●' : (c.warn ? '▲' : '○')} ${c.text}`)].join('\n');
    state.result = res; state.dirty = false; state.tab = 'preview'; state.mpane = 'result'; if (narrow()) setTimeout(() => window.scrollTo(0, 0), 0);   // 휴대폰: 결과 맨 위(미리보기 탭 줄)부터
    setStatus(`적용 완료 · ${res.elapsed} ms`, 'ready'); $('#status-note').hidden = false;
  } catch (e) { console.error(e); state.result = null; setStatus('적용 실패: ' + (e.message || e), 'err'); alert('적용 실패: ' + (e.message || e)); }
  render();
}
// 저장 — 브라우저가 지원하면 저장 위치를 직접 고른다(파일 시스템 접근 API), 아니면 내려받기
async function saveResult(kind, how = {}) {
  const r = state.result; const j = journal(); if (!r || !j) return;
  const base = (state.manuscript?.name || '원고').replace(/\.[^.]+$/, '');
  // Word(DOCX): 한글 산출물(HWPX)을 같은 서식의 Word 문서로 옮긴다(처음 저장할 때 한 번 만든다)
  if (kind === 'docx' && !r.docx) {
    try { setStatus('Word 문서 만드는 중…', ''); const d = await hwpxToDocx(r.hwpx, { title: base }); r.docx = d.bytes; r.docxWarnings = d.warnings; setStatus(d.warnings.length ? `Word 문서 준비됨 — ${d.warnings.join(' · ')}` : 'Word 문서 준비됨', 'ready'); }
    catch (e) { console.error(e); setStatus('Word 문서를 만들지 못했습니다: ' + String(e && e.message || e).slice(0, 80), 'err'); return; }
  }
  const spec = { hwp: { data: r.hwp, name: `${base}_${j.journal}.hwp`, mime: 'application/x-hwp', desc: '한글 문서 (HWP)' }, hwpx: { data: r.hwpx, name: `${base}_${j.journal}.hwpx`, mime: 'application/hwp+zip', desc: '한글 문서 (HWPX)' }, docx: { data: r.docx, name: `${base}_${j.journal}.docx`, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', desc: 'Word 문서 (DOCX)' }, log: { data: new TextEncoder().encode(r.logText), name: `${base}_${j.journal}_변환로그.txt`, mime: 'text/plain', desc: '텍스트' } }[kind];
  const blob = new Blob([spec.data], { type: spec.mime });
  if (how.share) {   // 휴대폰 공유 시트: 파일 앱 저장·드라이브·메신저로 바로 보낸다
    try { const file = new File([blob], spec.name, { type: spec.mime }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: spec.name }); setStatus(`공유함 · ${spec.name}`, 'ready'); return; } }
    catch (e) { if (e && e.name === 'AbortError') return; console.warn(e); }
  }
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: spec.name, types: [{ description: spec.desc, accept: { [spec.mime]: ['.' + spec.name.split('.').pop()] } }] });
      const w = await handle.createWritable(); await w.write(blob); await w.close();
      setStatus(`저장됨 · ${handle.name}`, 'ready'); return;
    } catch (e) { if (e && e.name === 'AbortError') return; /* 취소 */ console.warn(e); }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = spec.name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  setStatus(`내려받기 폴더에 저장 · ${spec.name}`, 'ready');
}
function downloadBytes(bytes, name, mime = 'application/x-hwp') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: mime })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// 모집 공고 본문에서 마감일·발간일·호수를 규칙으로 뽑는다 (AI 없음)
function parseCallText(text) {
  const t = text.replace(/\s+/g, ' ');
  const dates = [];
  const re = /(20\d{2})\s*[.년\-/]\s*(\d{1,2})\s*[.월\-/]\s*(\d{1,2})\s*일?/g; let m;
  while ((m = re.exec(t))) dates.push({ iso: `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`, pos: m.index, ctx: t.slice(Math.max(0, m.index - 24), m.index) });
  const pick = (kw) => dates.find((d) => kw.test(d.ctx));
  const dl = pick(/마감|기한|까지|접수|투고/); const pub = pick(/발간|발행|간행|출간/);
  const issue = (/제?\s*(\d{1,3})\s*(집|호|권)/.exec(t) || [])[0] || '';
  return { deadline: dl?.iso || dates[0]?.iso || '', publish: pub?.iso || (dates.find((d) => d !== dl) || {}).iso || '', issue: issue.replace(/\s+/g, '') };
}

// ── 투고 양식 및 규정 확인
function renderJournal(main) {
  const j = journal();
  if (!j) { main.append(h('div', { class: 'topbar' }, h('h1', {}, '투고 양식 및 규정')), h('p', { class: 'hero' }, '왼쪽에서 투고처를 고르세요.')); return; }
  main.append(h('div', { class: 'topbar' }, h('h1', {}, j.journal), h('span', { class: 'sub' }, `${j.society} · ${j.grade || ''}`), h('span', { class: 'grow' }),
    safeUrl(j.submit?.url) ? h('a', { class: 'btn', href: safeUrl(j.submit.url), target: '_blank', rel: 'noopener noreferrer' }, `투고처 이동 ↗`) : null,
    h('button', { class: 'btn ghost', onclick: () => { state.view = 'convert'; render(); } }, '원고 변환으로')));
  const tabs = [['docs', '투고 서류·양식'], ['overview', '개요·투고'], ['schedule', '일정'], ['layout', '편집 양식'], ['cite', '각주·참고문헌']];
  const el = h('div', { class: 'card detail' });
  el.append(h('div', { class: 'tabs', role: 'tablist' }, ...tabs.map(([k, l]) => h('button', { type: 'button', role: 'tab', 'aria-selected': k === state.jtab ? 'true' : 'false', class: k === state.jtab ? 'on' : '', onclick: () => { state.jtab = k; render(); } }, l))));
  const body = h('div', {}); el.append(body); main.append(el);
  const li = (arr) => h('ul', {}, ...(arr || []).map((x) => h('li', {}, x)));
  const kv = (pairs) => h('dl', { class: 'kv' }, ...pairs.flatMap(([k, v]) => (v ? [h('dt', {}, k), h('dd', {}, v)] : [])));
  const t = state.jtab;
  if (t === 'docs') {
    body.append(h('h3', {}, '투고처'), kv([['시스템', safeUrl(j.submit?.url) ? h('span', {}, `${j.submit.system} · `, h('a', { href: safeUrl(j.submit.url), target: '_blank', rel: 'noopener noreferrer' }, j.submit.url)) : (j.submit?.system || '규정 참조')], ['안내', j.submit?.note], ['연락', j.contact]]));
    body.append(h('h3', {}, '제출 서류'));
    body.append(j.documents?.length ? li(j.documents) : h('p', { class: 'muted' }, '규정에 별도 서류 요구가 없습니다(투고 시스템 안내 확인).'));
    const forms = FORMS[j.id] || [];
    body.append(h('h3', {}, '내장 서식 파일'));
    if (forms.length) body.append(h('div', { class: 'docs' }, ...forms.map((f) => { const bytes = state.forms[f.file]; return h('div', { class: 'doc' }, h('b', {}, f.label), h('span', { class: 'small' }, f.file, bytes ? ` · ${(bytes.length / 1024).toFixed(0)} KB` : ' · 파일 없음'), h('div', {}, h('button', { class: 'btn ghost sm', disabled: bytes ? null : '', onclick: () => downloadBytes(bytes, f.file) }, '내려받기'))); })));
    else body.append(h('p', { class: 'muted' }, '이 학회의 신청서·동의서 파일은 투고처(위 주소)에서 받습니다.'));
    const links = (j.sources || []).filter((s) => /^https?:/.test(s));
    if (links.length) { body.append(h('h3', {}, '규정 원문·안내 주소')); body.append(h('ul', {}, ...links.filter(safeUrl).map((u) => h('li', {}, h('a', { href: u, target: '_blank', rel: 'noopener noreferrer' }, u))))); }
    body.append(h('h3', {}, '체재')); body.append(h('p', {}, j.structureText || (j.structure || []).map((g) => SECTION_LABELS[g]).join(' → ')));
    body.append(h('h3', {}, '분량·초록')); body.append(kv([['분량', j.length?.text], ['국문초록', j.abstract?.ko], ['영문초록', j.abstract?.en], ['주제어', j.abstract?.keywords], ['익명화', j.anonymize]]));
    if (userNotes(j.notes).length) { body.append(h('h3', {}, '메모')); body.append(li(userNotes(j.notes))); }
  } else if (t === 'overview') {
    body.append(kv([['분야', j.fields], ['자격', j.eligibility], ['심사', j.review], ['저작권', j.copyright]]));
    body.append(h('h3', {}, '비용')); body.append(kv([['심사료', j.fees?.review], ['게재료', j.fees?.publication]]));
    body.append(h('p', { class: 'small muted', style: 'margin-top:14px' }, `출처: ${(j.sources || []).map(cleanSource).join(' · ')} · 갱신 ${j.updated || ''}`));
  } else if (t === 'schedule') {
    const s = j.schedule || {};
    body.append(kv([['연간 발행', s.perYear ? `${s.perYear}회 — ${(s.publish || []).join(' · ')}` : ''], ['정기 마감', (s.deadlines || []).join(' · ') || '공지로 정함'], ['비고', s.rule]]));
    const nd = nextDeadlines(j);
    body.append(h('h3', {}, '다음 모집 갱신'));
    const mine = userSchedule(j.id);
    const ta = h('textarea', { rows: 4, placeholder: '학회에서 온 모집 공고를 여기에 붙여 넣으면 마감일·발간일·호수를 찾아 아래 칸에 채웁니다. (예: 제80집 … 투고 기한 2026년 10월 31일 … 12월 31일 간행)', 'aria-label': '모집 공고 본문' });
    const fIssue = h('input', { type: 'text', placeholder: '호수 (예: 80집)', style: 'width:120px', 'aria-label': '호수' });
    const fDl = h('input', { type: 'date', 'aria-label': '마감일' }); const fPub = h('input', { type: 'date', 'aria-label': '발간일' });
    const msg = h('span', { class: 'small muted' });
    ta.addEventListener('input', () => { const r = parseCallText(ta.value); if (r.deadline) fDl.value = r.deadline; if (r.publish) fPub.value = r.publish; if (r.issue) fIssue.value = r.issue; msg.textContent = r.deadline ? `찾음: 마감 ${r.deadline}${r.publish ? ', 발간 ' + r.publish : ''}${r.issue ? ', ' + r.issue : ''}` : '날짜를 찾지 못했습니다. 아래 칸에 직접 넣으세요.'; });
    const saveSched = () => { if (!fDl.value) { msg.textContent = '마감일은 필수입니다.'; return; } const all = safeSchedMap(); const list = (Array.isArray(all[j.id]) ? all[j.id] : []).filter((x) => x && typeof x === 'object' && isoDate(x.deadline) && x.deadline !== fDl.value); list.push({ issue: fIssue.value || '공지', deadline: fDl.value, publish: fPub.value || '', note: '사용자 입력 ' + fmtDate(new Date()) }); all[j.id] = list.sort((x, y) => String(x.deadline).localeCompare(String(y.deadline))); if (!lsSet(LS.schedule, all)) { msg.textContent = '마감 저장에 실패했습니다(브라우저 저장 공간).'; return; } render(); };
    body.append(h('div', { class: 'card', style: 'padding:14px 16px' }, ta, h('div', { class: 'row', style: 'margin-top:8px' }, fIssue, h('label', { class: 'opt' }, '마감', fDl), h('label', { class: 'opt' }, '발간', fPub), h('button', { class: 'btn', onclick: saveSched }, '마감 추가'), msg),
      mine.length ? h('div', { class: 'small', style: 'margin-top:8px' }, '내가 넣은 마감: ', ...mine.map((x) => h('span', { class: 'tag', style: 'margin-right:4px' }, `${x.issue} ${x.deadline}`, h('button', { type: 'button', class: 'btn ghost sm', style: 'height:20px;padding:0 6px;margin-left:4px', 'aria-label': '삭제', onclick: () => { const all = safeSchedMap(); all[j.id] = (Array.isArray(all[j.id]) ? all[j.id] : [][j.id] || []).filter((y) => y.deadline !== x.deadline); lsSet(LS.schedule, all); render(); } }, '×')))) : null,
      h('p', { class: 'small muted', style: 'margin:8px 0 0' }, 'JAMS나 학회 홈페이지를 자동으로 읽어 오지는 않습니다(이 프로그램은 어디에도 접속하지 않음). 공고 메일을 붙여 넣거나 날짜를 직접 고치면 사이드바와 ‘투고 일정’에 바로 반영됩니다. 이 브라우저에만 저장됩니다.')));
    body.append(h('h3', {}, '다가오는 마감'));
    body.append(h('table', { class: 'sched' }, h('thead', {}, h('tr', {}, h('th', {}, '마감'), h('th', {}, '호'), h('th', {}, '발간'), h('th', {}, '남은 날'), h('th', {}, '비고'))),
      h('tbody', {}, ...nd.map((d) => { const left = daysLeft(d.date); return h('tr', { class: left < 0 ? 'past' : (left <= 14 ? 'soon' : '') }, h('td', { class: 'due' }, `${d.deadline} (${DOW[d.date.getDay()]})`), h('td', {}, d.issue, d.user ? h('span', { class: 'tag ok', style: 'margin-left:6px' }, '내 입력') : null), h('td', {}, d.publish || ''), h('td', {}, left < 0 ? '지남' : `D-${left}`), h('td', { class: 'small muted' }, d.note || '')); }))));
  } else if (t === 'layout') {
    const L = j.layout || {};
    body.append(kv([['용지', cleanLayout(L.paper)], ['여백', cleanLayout(L.margins)], ['본문', cleanLayout(L.body)], ['인용문', cleanLayout(L.quote)], ['각주', cleanLayout(L.footnote)], ['장절 번호', cleanLayout(L.headings)], ['제목·기타', cleanLayout(L.title)], ['캡션', L.caption], ['비고', DEV_NOTE.test(L.note || '') ? '' : cleanLayout(L.note)]]));
    const ti = templateInfo(j);
    if (ti && !ti.error) { body.append(h('h3', {}, '적용 서식')); body.append(kv([['용지', ti.pageText], ['여백', ti.marginText], ['글꼴', ti.fonts.join(', ')], ['스타일', `${ti.styles.length}개`], ['쪽수', `${ti.pages}쪽, 문단 ${ti.paragraphs.length}개, 각주 ${ti.footnoteCount}개`]])); }
    if (j.format) { body.append(h('h3', {}, '적용 서식')); body.append(formatTable(j.format)); const fonts = [...new Set([j.format.font, ...Object.values(j.format.roles || {}).map((r) => r.font)].filter(Boolean))]; body.append(kv([['필요 글꼴', fonts.join(', ') + ' — 없으면 설치하지 않아도 됩니다(글꼴 이름은 파일에 그대로 기록). 도움말의 ‘글꼴’ 참조']])); }
    else if (!j.template) { body.append(h('h3', {}, '적용 서식')); body.append(formatTable(GENERIC_FORMAT)); }
    body.append(h('h3', {}, '기호')); body.append(kv([['논문·작품', j.marks?.paper], ['저서·학술지', j.marks?.book], ['작품명', j.marks?.work], ['강조·인용', j.marks?.emph]]));
  } else if (t === 'cite') {
    body.append(h('h3', {}, `각주 — 쪽수 표기 ‘${j.footnote?.pageUnit || ''}’`)); body.append(h('p', {}, j.footnote?.example || '')); body.append(li(j.footnote?.rules));
    body.append(h('h3', {}, '참고문헌')); body.append(h('p', {}, j.references?.order || '')); body.append(li(j.references?.rules));
  } else if (t === 'template') {
    if (j.template) {
      const ti = templateInfo(j); const bytes = templateBytes(j);
      body.append(h('p', {}, `파일: ${j.template.name || j.template.file}`, bytes ? '' : h('span', { class: 'warn' }, ' — 바탕틀 데이터가 없습니다')));
      if (ti && !ti.error) {
        body.append(h('h3', {}, '역할별 서식'));
        const rows = Object.entries(j.template.roles || {}).map(([role, spec]) => {
          let desc = '';
          if (spec.para !== undefined) { const p = (spec.sec ? null : ti.paragraphs[spec.para]); desc = spec.sec ? `구역 ${spec.sec} 문단 ${spec.para}` : (p ? `문단 ${spec.para} · ${p.font} ${(p.size || 0) / 100}pt${p.bold ? ' 굵게' : ''} · ${p.align} · ${p.lineSpacing}% — “${p.text.slice(0, 36)}”` : `문단 ${spec.para}`); }
          else if (spec.style) { const s = ti.styles.find((x) => x.name.trim() === spec.style); desc = s ? `스타일 ‘${s.name}’ · ${s.char.fontFamily || ''} ${(s.char.fontSize || 0) / 100}pt` : `스타일 ‘${spec.style}’ (바탕틀에 없음)`; }
          else if (spec.like) desc = `‘${roleLabel(spec.like)}’와 같게`;
          return h('tr', {}, h('td', {}, role), h('td', {}, roleLabel(role)), h('td', {}, desc));
        });
        body.append(h('table', { class: 'rolemap' }, h('thead', {}, h('tr', {}, h('th', {}, '역할'), h('th', {}, '뜻'), h('th', {}, '가져오는 서식'))), h('tbody', {}, ...rows)));
        body.append(h('h3', {}, '양식 미리보기 (1쪽)'));
        try { const { svg } = renderTemplatePage(bytes, 0); const w = h('div', { class: 'preview' }); const d = h('div', {}); d.innerHTML = svg; w.append(d.firstElementChild); body.append(w); } catch (e) { body.append(h('p', { class: 'err' }, '미리보기 실패 ' + e)); }
      } else if (ti?.error) body.append(h('p', { class: 'err' }, ti.error));
    }
  }
}
function formatTable(f) {
  const rows = Object.entries(f.roles || {}).map(([role, r]) => h('tr', {}, h('td', { class: 'mono small' }, role), h('td', {}, roleLabel(role)), h('td', {}, `${r.font || f.font} ${r.size}pt${r.bold ? ' 굵게' : ''}, ${r.align || 'justify'}, ${r.lineSpacing || 160}%${r.spacing ? `, 자간 ${r.spacing}%` : ''}${r.indent ? `, 들여쓰기 ${r.indent}pt` : ''}${r.marginLeft ? `, 왼쪽 ${r.marginLeft}pt` : ''}`)));
  const p = f.page;
  return h('div', {}, h('p', { class: 'small' }, `용지 ${p.width} × ${p.height} mm · 여백 위 ${p.top} 아래 ${p.bottom} 왼쪽 ${p.left} 오른쪽 ${p.right} 머리말 ${p.header} 꼬리말 ${p.footer} mm`), h('table', {}, h('tbody', {}, ...rows)));
}

// ── 투고 일정
function renderSchedule(main) {
  const rows = [];
  for (const j of state.journals) for (const d of nextDeadlines(j)) rows.push({ j, ...d });
  rows.sort((a, b) => a.date - b.date);
  main.append(h('div', { class: 'topbar' }, h('h1', {}, '투고 일정'), h('span', { class: 'sub' }, `오늘 ${fmtKo.format(new Date())} 기준 · 중복 투고 금지`)));
  const banner = art('schedule', 'sched-banner'); if (banner) main.append(banner);
  main.append(h('div', { class: 'card' }, h('table', { class: 'sched' }, h('thead', {}, h('tr', {}, h('th', {}, '마감'), h('th', {}, '남은 날'), h('th', {}, '학회지'), h('th', {}, '호'), h('th', {}, '발간'), h('th', {}, '분량'), h('th', {}, '비고'))),
    h('tbody', {}, ...rows.map((r) => { const left = daysLeft(r.date); return h('tr', { class: left < 0 ? 'past' : (left <= 14 ? 'soon' : '') }, h('td', { class: 'due' }, `${r.deadline} (${DOW[r.date.getDay()]})`), h('td', {}, left < 0 ? '지남' : `D-${left}`), h('td', {}, h('a', { href: '#', onclick: (e) => { e.preventDefault(); state.journalId = r.j.id; lsSet(LS.journal, r.j.id); state.view = 'journal'; state.jtab = 'schedule'; recompute(true); render(); } }, r.j.journal), h('div', { class: 'small muted' }, r.j.society)), h('td', {}, r.issue), h('td', {}, r.publish || ''), h('td', { class: 'small' }, r.j.length?.text || ''), h('td', { class: 'small muted' }, r.note || '')); })))));
}

// ── 학회 추가
function renderManage(main) {
  const custom = lsGet(LS.journals, []);
  const sample = { id: 'myjournal', society: '○○학회', journal: '○○연구', grade: 'KCI 등재', fields: '', submit: { system: 'JAMS', url: 'https://xxx.jams.or.kr' },
    schedule: { perYear: 3, publish: ['04-30', '08-31', '12-31'], deadlines: ['02-28', '06-30', '10-31'], upcoming: [{ issue: '00집', deadline: '2026-12-31', publish: '2027-02-28' }] },
    eligibility: '', fees: { review: '', publication: '' }, length: { text: '200자 원고지 120매', max: 120 }, structure: ['front', 'toc', 'abstractKo', 'body', 'references', 'abstractEn'], structureText: '',
    abstract: { ko: '', en: '', keywords: '5개' }, footnote: { pageUnit: '쪽', example: '', rules: [] }, references: { order: '', rules: [] }, marks: {}, layout: {}, documents: [],
    template: { file: 'myjournal', name: '학회 바탕틀.hwp', roles: { title: { para: 0 }, author: { para: 2 }, h1: { para: 5 }, body: { para: 6 }, footnote: { style: '각주' } } }, blanks: {}, notes: [], sources: [], updated: fmtDate(new Date()) };
  main.append(h('div', { class: 'topbar' }, h('h1', {}, '학회 추가'), h('span', { class: 'sub' }, 'JSON 한 덩어리 + 바탕틀 .hwp 하나 · 이 브라우저에만 보관')));
  const ta = h('textarea', { rows: 20, placeholder: JSON.stringify(sample, null, 2), 'aria-label': '학회 JSON' });
  let tplBytes = null; let tplName = '';
  const tplInfo = h('div', { class: 'small muted', style: 'margin-top:6px' });
  const tplDrop = h('div', { class: 'drop', ondragover: (e) => { e.preventDefault(); e.stopPropagation(); tplDrop.classList.add('over'); }, ondragleave: () => tplDrop.classList.remove('over'), ondrop: (e) => { e.preventDefault(); e.stopPropagation(); tplDrop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) takeTpl(f); } },
    h('strong', {}, '바탕틀 .hwp (선택)'), h('div', { class: 'muted small' }, '학회가 배포한 논문 양식·작성 예시 파일. 넣으면 문단 목록을 아래에 보여 줍니다.'), h('input', { type: 'file', accept: '.hwp,.hwpx', onchange: (e) => { if (e.target.files[0]) takeTpl(e.target.files[0]); } }));
  tplDrop.addEventListener('click', (e) => { if (e.target.tagName !== 'INPUT') tplDrop.querySelector('input').click(); });
  const paraList = h('div', { class: 'struct', style: 'max-height:300px;display:none' });
  async function takeTpl(f) {
    tplBytes = new Uint8Array(await f.arrayBuffer()); tplName = f.name;
    try { const ti = analyzeTemplate(tplBytes); tplInfo.textContent = `${f.name} — ${ti.pageText}, ${ti.pages}쪽, 문단 ${ti.paragraphs.length}개, 스타일 ${ti.styles.length}개 (${ti.styles.map((s) => s.name).join(', ')})`;
      paraList.style.display = ''; paraList.replaceChildren(h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, '문단'), h('th', {}, '스타일'), h('th', {}, '서식'), h('th', {}, '내용'))), h('tbody', {}, ...ti.paragraphs.map((p) => h('tr', {}, h('td', { class: 'mono' }, p.idx), h('td', { class: 'small' }, p.styleName), h('td', { class: 'small' }, `${p.font || ''} ${(p.size || 0) / 100}pt${p.bold ? ' 굵게' : ''} ${p.align || ''} ${p.lineSpacing || ''}%`), h('td', { class: 'txt' }, p.text.slice(0, 60)))))));
    } catch (e) { tplInfo.textContent = '바탕틀을 열 수 없습니다: ' + e; }
  }
  const msg = h('p', { class: 'small' });
  const save = async () => {
    let j; try { j = JSON.parse(ta.value || ta.placeholder); } catch (e) { msg.textContent = 'JSON 오류: ' + e.message; msg.className = 'small err'; return; }
    if (!j.id || !j.journal || !/^[a-z0-9_-]{2,32}$/i.test(j.id)) { msg.textContent = 'id(영문·숫자 2~32자)와 journal은 필수입니다.'; msg.className = 'small err'; return; }
    if (BUILTIN_IDS.has(j.id)) { msg.textContent = `‘${j.id}’는 내장 학회 id입니다. 다른 id를 쓰세요(내장 학회는 덮어쓸 수 없습니다).`; msg.className = 'small err'; return; }
    if (j.submit && j.submit.url && !safeUrl(j.submit.url)) { msg.textContent = '투고처 주소는 http:// 또는 https:// 로 시작해야 합니다.'; msg.className = 'small err'; return; }
    if (j.template && j.template.file && BUILTIN_TPL.has(j.template.file)) { msg.textContent = `바탕틀 키 ‘${j.template.file}’는 내장 바탕틀과 겹칩니다. 다른 이름을 쓰세요.`; msg.className = 'small err'; return; }
    let beforeT = null; let savedKey = null; try { beforeT = localStorage.getItem(LS.templates); } catch { /* 저장소 접근 불가 */ }   // 학회 저장이 실패하면 먼저 저장한 바탕틀을 되돌린다
    if (tplBytes) { const key = (j.template && j.template.file) || j.id; j.template = Object.assign({ roles: {} }, j.template || {}, { file: key, name: tplName }); const all = lsGet(LS.templates, {}); let s = ''; for (let i = 0; i < tplBytes.length; i += 0x8000) s += String.fromCharCode.apply(null, tplBytes.subarray(i, i + 0x8000)); all[key] = btoa(s); if (!lsSet(LS.templates, all)) { msg.textContent = '바탕틀 저장 실패: 브라우저 저장 공간이 부족합니다(바탕틀 파일이 너무 크거나 저장이 막혀 있음).'; msg.className = 'small err'; return; } savedKey = key; }
    const list = custom.filter((c) => c.id !== j.id); list.push(j); if (!lsSet(LS.journals, list)) { try { if (beforeT === null) localStorage.removeItem(LS.templates); else localStorage.setItem(LS.templates, beforeT); } catch { /* 원복 실패는 무시 */ } msg.textContent = '저장 실패: 브라우저 저장 공간이 부족하거나 저장이 막혀 있습니다.'; msg.className = 'small err'; return; }
    if (savedKey) { state.templates[savedKey] = tplBytes; delete state.templateInfo[savedKey]; }   // 두 저장소가 모두 성공한 뒤에만 메모리에 반영
    loadJournals(); msg.textContent = `‘${j.journal}’ 저장됨 (이 브라우저에만 보관)`; msg.className = 'small ok'; render();
  };
  const customList = h('div', { class: 'jgrid' }, ...custom.map((c) => h('div', { class: 'jcard' }, h('div', { class: 'jn' }, c.journal), h('div', { class: 'js' }, c.society), h('div', { class: 'row', style: 'margin-top:8px' },
    h('button', { class: 'btn ghost sm', onclick: () => { ta.value = JSON.stringify(c, null, 2); window.scrollTo(0, 0); } }, '편집'),
    h('button', { class: 'btn ghost sm', onclick: () => { if (!confirm(`‘${c.journal}’을 삭제할까요?`)) return; lsSet(LS.journals, custom.filter((x) => x.id !== c.id)); const t = lsGet(LS.templates, {}); if (c.template?.file) { delete t[c.template.file]; lsSet(LS.templates, t); } loadJournals(); render(); } }, '삭제')))));
  main.append(h('div', { class: 'card' }, h('div', { class: 'row', style: 'margin-bottom:8px' },
    h('select', { 'aria-label': '내장 학회 JSON 불러오기', onchange: (e) => { const j = state.journals.find((x) => x.id === e.target.value); if (j) { const c = { ...j }; delete c.custom; ta.value = JSON.stringify(c, null, 2); } } }, h('option', { value: '' }, '내장 학회 JSON 불러와 고치기…'), ...state.journals.map((j) => h('option', { value: j.id }, `${j.journal} (${j.society})`))),
    h('button', { class: 'btn ghost', onclick: () => { ta.value = JSON.stringify(sample, null, 2); } }, '빈 양식'),
    h('button', { class: 'btn ghost', onclick: () => { const all = { journals: custom, templates: lsGet(LS.templates, {}) }; downloadBytes(new TextEncoder().encode(JSON.stringify(all)), `투고틀_학회_${fmtDate(new Date())}.json`, 'application/json'); } }, '사용자 학회 내보내기'),
    h('label', { class: 'btn ghost' }, '가져오기', h('input', { type: 'file', accept: '.json', style: 'display:none', onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { if (f.size > 60 * 1048576) throw new Error('60 MB를 넘는 파일입니다'); const all = JSON.parse(await f.text()); if (!all || typeof all !== 'object' || !Array.isArray(all.journals)) throw new Error('journals 배열이 없습니다'); const js = all.journals.map(sanitizeJournal).filter(Boolean); const ts = sanitizeTemplates(all.templates); if (!js.length) throw new Error('유효한 학회 항목이 없습니다(내장 학회와 같은 id는 받지 않습니다)'); let oldJ = null, oldT = null; try { oldJ = localStorage.getItem(LS.journals); oldT = localStorage.getItem(LS.templates); } catch { /* 읽기 불가 */ } const curJ = (Array.isArray(lsGet(LS.journals, [])) ? lsGet(LS.journals, []) : []).map(sanitizeJournal).filter(Boolean); const curT = sanitizeTemplates(lsGet(LS.templates, {})); const dup = js.filter((n) => curJ.some((c) => c.id === n.id)).length; if (curJ.length && !confirm(`이 브라우저에 사용자 학회 ${curJ.length}곳이 이미 있습니다. 가져온 ${js.length}곳을 합칩니다(같은 id ${dup}곳은 가져온 것으로 바뀜). 계속할까요?`)) { e.target.value = ''; return; } const mergedJ = [...curJ.filter((c) => !js.some((n) => n.id === c.id)), ...js]; const mergedT = { ...curT, ...ts }; const ok1 = lsSet(LS.journals, mergedJ); const ok2 = ok1 && lsSet(LS.templates, mergedT); if (!ok1 || !ok2) { try { if (oldJ === null) localStorage.removeItem(LS.journals); else localStorage.setItem(LS.journals, oldJ); if (oldT === null) localStorage.removeItem(LS.templates); else localStorage.setItem(LS.templates, oldT); } catch { /* 원복도 실패하면 아래 오류로 알린다 */ } throw new Error('브라우저 저장 공간이 부족하거나 저장이 막혀 있습니다(바탕틀이 크면 줄여 주세요)'); } for (const [k, v] of Object.entries(ts)) { try { state.templates[k] = await b64ToBytes(v); delete state.templateInfo[k]; } catch { /* 깨진 바탕틀은 건너뜀 */ } } loadJournals(); render(); alert(`학회 ${js.length}곳, 바탕틀 ${Object.keys(ts).length}개를 가져왔습니다.`); } catch (err) { alert('가져오기 실패: ' + (err.message || err)); } } }))),
    ta, tplDrop, tplInfo, paraList, h('div', { class: 'row', style: 'margin-top:10px' }, h('button', { class: 'btn', onclick: save }, '저장'), msg)));
  if (custom.length) main.append(h('h3', { style: 'margin:18px 0 8px' }, '사용자 추가 학회'), customList);
  main.append(h('p', { class: 'small muted', style: 'margin-top:18px' }, '화면이 이상하게 뜨거나 가져온 데이터에 문제가 있으면 ', h('button', { class: 'btn ghost sm', onclick: () => { if (!confirm('이 브라우저에 저장된 사용자 학회·바탕틀·설정·마감 입력을 모두 지웁니다. 계속할까요?')) return; for (const k of Object.values(LS)) { try { localStorage.removeItem(k); } catch { /* 무시 */ } } location.reload(); } }, '사용자 데이터 초기화'), ' 를 누르세요. 내장 학회와 바탕틀은 그대로입니다.'));
}

// ── 사용법·도움말
function renderHelp(main) {
  main.append(h('div', { class: 'topbar' }, h('h1', {}, '사용법·도움말'), h('span', { class: 'sub' }, '투고틀은 AI를 쓰지 않는 규칙 기반 변환기입니다')));
  const sec = (title, ...kids) => h('section', { class: 'card', style: 'margin-bottom:14px' }, h('h2', { style: 'font-size:16px;margin-bottom:10px' }, title), ...kids);
  const ol = (...items) => h('ol', { style: 'margin:0;padding-left:20px;line-height:1.7' }, ...items.map((x) => h('li', {}, x)));
  const ul = (...items) => h('ul', { style: 'margin:0;padding-left:20px;line-height:1.7' }, ...items.map((x) => h('li', {}, x)));
  main.append(sec('이 프로그램은',
    h('p', { style: 'margin:0 0 8px;font-size:15px' }, h('b', {}, 'AI의 개입 없이, 오로지 프로그램 규칙만으로, 내 PC 안에서 작동하며, 논문 정보를 어디에도 저장·전송하지 않는 논문 서지·양식 변환기'), '입니다.'),
    ul('규칙 기반: 문단 역할 인식, 체재 재배열, 쪽수·낫표·서지 표기, 정오표까지 전부 정규식과 규칙입니다. 원고의 문장은 한 글자도 바꾸지 않고, 어떤 언어 모델도 부르지 않습니다.',
      '로컬 동작: HTML 파일 하나에 HWP 엔진(rhwp, WASM)과 학회 바탕틀·서식이 다 들어 있습니다. 인터넷이 없어도 되고, 원고와 결과는 브라우저 메모리에서만 처리됩니다.',
      '저장하지 않음: 원고·결과·각주 내용을 서버나 저장소에 남기지 않습니다. 남는 것은 사용자가 고른 설정값과 직접 추가한 학회뿐입니다.',
      '학회 규정 그대로: 글꼴·크기·여백·줄간격·체재 순서·쪽수 단위는 각 학회의 양식 파일과 규정 수치를 그대로 씁니다. 프로그램이 임의로 고르지 않습니다.',
      '구성: 왼쪽에서 투고처를 고르고, 오른쪽에 원고를 놓고, 적용해 미리보고, 저장합니다. 투고처별 규정·서류·일정은 같은 화면에서 봅니다.')));
  main.append(sec('기본 흐름',
    ol([h('b', {}, '투고처 선택'), ' — 왼쪽 위에서 학회지를 고릅니다. 목록은 등재지·등재후보지 순, 학술지 이름 가나다순입니다. 바로 위 분야 칸(국어국문학 종합·현대문학·고전문학·구비민속·문학교육·비교문학·문화연구·대중문화·문화콘텐츠)으로 목록을 좁힐 수 있습니다. 고른 학회의 양식과 규정에 맞춰 서식을 입힙니다.'],
      [h('b', {}, '원고 놓기'), ' — HWP·HWPX·DOCX·TXT·MD 원고를 화면에 끌어다 놓거나 ‘파일 선택’을 누릅니다. 놓는 즉시 열리고, 왼쪽에 문단별 역할(제목·초록·장 제목·본문·인용·참고문헌·영문초록)이 인식되어 나옵니다. TXT·MD 원고는 각주를 [^1] … [^1]: 내용 꼴로, 강조를 *기울임*·**굵게**(낱말 경계에서만, 저자 이름 뒤 * 표시는 글자로 남음)로, 장 제목을 # 로, 인용을 > 로 읽습니다. 각주 정의 아래 네 칸 들여 쓴 줄은 같은 각주의 다음 문단입니다.'],
      [h('b', {}, '역할 확인'), ' — 잘못 잡힌 역할은 목록에서 직접 바꿉니다. 역할은 서식을 정하는 기준이므로 제목·참고문헌·영문초록이 맞게 잡혔는지 먼저 보세요.'],
      [h('b', {}, '적용'), ' — 학회 양식이 입혀진 쪽을 오른쪽 ‘미리보기’에서 보고, ‘변경 사항’에서 무엇이 바뀌었는지(체재 재배열, 쪽수·서지 표기, 빈 줄) 확인합니다. 저장 전에 설정이나 역할을 고쳤다면 ‘다시 적용’을 누릅니다. 각주가 많은 쪽은 미리보기에서 본문과 각주가 겹쳐 보일 수 있습니다(쪽 아래에 노란 표시). 미리보기 엔진의 한계일 뿐이며, 저장한 HWP는 한글이 열 때 다시 배치하므로 겹치지 않습니다.'],
      [h('b', {}, '저장'), ' — ‘저장’을 누르면 저장할 폴더와 파일 이름을 그때그때 고를 수 있습니다(크롬·엣지). 그 밖의 브라우저에서는 내려받기 폴더에 저장됩니다. ▾ 메뉴에서 HWPX·Word(DOCX)·변환 로그도 저장합니다.'],
      [h('b', {}, 'Word(DOCX)로 저장'), ' — Word로 받는 학회나 해외 공동 저자를 위해, 한글 산출물과 같은 용지·여백·글꼴·크기·장평·자간·줄 간격·들여쓰기·각주(번호 꼴·구분선)·표·그림을 Word 문서로 옮깁니다. Word는 줄 나눔 규칙이 달라 쪽 수가 한두 쪽 다를 수 있고, 수식·도형은 옮기지 않습니다. 학회 양식 글꼴이 PC에 없으면 Word가 다른 글꼴로 바꿔 보여 줍니다(한글도 같음). 투고 전에 Word에서 한 번 열어 확인하세요.'],
      [h('b', {}, '한글에서 마무리'), ' — 표·그림이 판면 안에 제대로 놓였는지(넓은 표는 폭을 줄임), 쪽 넘김과 머리말을 확인한 뒤 투고합니다. 글상자·차트처럼 옮기지 못한 개체가 있으면 경고에 수가 나옵니다.'])));
  main.append(sec('설정 (상단 ‘설정’ 버튼)',
    ul([h('b', {}, '화면 스킨'), ' — 왼쪽 아래 ‘스킨’의 색 점을 누르면 다크 스튜디오(기본), 종이·서지, 모노크롬, 네이비·크림, 타이포 편집, 보라(슬랙식), 바이올렛 가운데 고를 수 있습니다. 색·글꼴·모서리만 바뀌고 변환 결과에는 영향이 없으며, 이 브라우저에만 기억됩니다.'],
      [h('b', {}, '목차 자동 생성'), ' — 원고에 목차가 없고 학회 체재에 목차(차례)가 있으면 장 제목으로 목차를 만들어 넣습니다. 인용문 앞뒤에는 한 줄을 띄우고, 바탕틀 예시에 쪽 나눔(참고문헌·영문초록이 새 쪽에서 시작)이 있으면 그대로 따릅니다.'],
      [h('b', {}, '각주·참고문헌 서지 양식'), ' — ', h('b', {}, '학회 규정'), '은 쪽수 단위(쪽·면·p.)만 학회 규정대로 맞춥니다. ', h('b', {}, 'APA'), '·', h('b', {}, 'Chicago'), '는 「논문」+『학술지』, 『단행본』 꼴의 한국어 서지를 그 양식으로 다시 씁니다(인식하지 못한 항목과 ‘위의 책’ 같은 반복 표기는 그대로 둡니다). ', h('b', {}, '원고 그대로'), '는 손대지 않습니다.'],
      [h('b', {}, '학회 체재 순서로 재배열'), ' — 제목·초록·목차·본문·참고문헌·영문초록 묶음을 학회가 정한 순서로 옮깁니다.'],
      [h('b', {}, '저자·소속 제외'), ' — 심사용 익명 원고를 만들 때 켭니다. 각주의 소속 표기는 직접 지워야 합니다.'],
      [h('b', {}, '원고의 빈 줄 그대로 두기'), ' — 평소에는 원고의 빈 줄을 없애고 학회 규칙대로 다시 넣습니다.'])));
  main.append(sec('투고 양식 및 규정 확인',
    h('p', { style: 'margin:0 0 8px' }, '투고처를 고르면 그 아래에 ‘투고 양식 및 규정 확인’과 ‘투고처 이동’이 나타납니다. 규정 확인 화면의 첫 탭에는 투고 시스템 주소, 제출 서류 목록, 이 파일에 내장된 신청서·동의서·서약서 파일(내려받기), 규정 원문 주소, 체재와 분량이 모여 있습니다. 나머지 탭에서 일정, 편집 양식 수치, 각주·참고문헌 규칙, 바탕틀의 역할 매핑을 볼 수 있습니다.')));
  main.append(sec('다음 모집 공고 갱신',
    h('p', { style: 'margin:0' }, '학회 규정의 정기 마감은 내장되어 있지만, 실제 공고는 호수마다 달라집니다. 투고처 화면의 ‘일정’ 탭에서 공고 메일을 붙여 넣으면 마감일·발간일·호수를 찾아 채우고, 날짜를 직접 고쳐 ‘마감 추가’를 누르면 사이드바와 ‘투고 일정’에 반영됩니다. JAMS 등을 자동으로 읽어 오는 기능은 일부러 넣지 않았습니다. 이 프로그램은 어떤 사이트에도 접속하지 않기 때문입니다.')));
  main.append(sec('하단 문서정보 바',
    h('p', { style: 'margin:0' }, '원고를 열면 작업 화면 맨 아래에 글자 수(공백 제외 포함), 각주 수와 각주 글자 수, 200자 원고지 환산 매수, 선택한 학회의 규정 매수와 초과·여유 매수(초과분의 대략 글자 수), 적용 후 쪽수가 나란히 표시됩니다. 초과분은 알려 줄 뿐 내용을 자동으로 줄이거나 고치라고 요구하지 않습니다. 많은 학회는 매수 초과에 추가 게재료를 받는 정도이므로 판단은 저자가 합니다. 환산은 공백 포함 글자 수와 각주 글자 수를 200자로 나눈 값이라 한글 프로그램의 문서 정보와 약간 다를 수 있습니다.')));
  main.append(sec('각주·참고문헌 정오표',
    h('p', { style: 'margin:0 0 8px' }, '‘적용’ 뒤 ‘정오표’ 탭에 나오고, 산출 HWP에는 문제 항목이 붉은 글자로 들어갑니다(설정에서 끌 수 있음).'),
    ol('각주에서 인용한 문헌이 참고문헌 목록에 있는지 — 없으면 그 각주를 붉게.',
      '각주·참고문헌 표기가 학회 규정 양식(쪽수 단위, 낫표, 연도·쪽수 유무, 저자–제목–게재지–발행처–연도–쪽 순서)과 어긋나는지 — 어긋나면 붉게.',
      '참고문헌에는 있는데 각주에서 한 번도 인용되지 않은 항목 — 그 참고문헌을 붉게.',
      '출처 표기의 오자·연도·권호 확인 — 각 항목 옆의 Google Scholar·RISS·KCI 검색 링크로 직접 대조합니다. 자동 대조는 서지를 외부로 보내야 하므로 하지 않습니다.'),
    h('p', { class: 'small muted', style: 'margin:8px 0 0' }, '대조는 제목·저자 글자 비교이며 ‘위의 책’, ‘앞의 논문’ 같은 반복 표기는 바로 앞 인용을 따릅니다. 서양 문헌은 큰따옴표 제목 또는 두 번째 항목을 제목으로 봅니다.')));
  main.append(sec('무엇을 바꾸고 무엇을 바꾸지 않나',
    ul('바꾸는 것: 글꼴·크기·줄간격·여백·용지(학회 양식), 문단 역할별 서식, 체재 순서, 쪽수 단위, 선택한 서지 양식, 빈 줄.',
      '바꾸지 않는 것: 본문 문장, 각주 내용, 강조(굵게·기울임), 저자 표기. 글꼴은 학회 양식에 정해진 것을 그대로 쓰며 임의로 고르지 않습니다.',
      '못 하는 것: Word 원고의 글상자·차트·수식 옮기기(개수만 알림), 영문 교정, 내용 요약·생성. 모든 처리는 규칙이며 AI를 호출하지 않습니다.')));
  main.append(sec('글꼴',
    h('p', {}, '투고틀은 글꼴 파일을 포함하지 않습니다. 글꼴은 저작권이 있는 소프트웨어라 임의로 배포할 수 없기 때문입니다. 산출 HWP에는 학회 양식·규정이 지정한 글꼴 이름이 그대로 기록되므로, 그 글꼴이 내 PC에 없어도 파일은 정상이고 한글이 비슷한 글꼴로 화면에 보여 줄 뿐입니다. 학회 편집부에는 해당 글꼴이 있으므로 투고에는 지장이 없습니다.'),
    ul([h('b', {}, '내 PC에서 똑같이 보려면'), ' — 학회 화면 ‘편집 양식’ 탭의 글꼴 목록을 확인하고 설치합니다. 함초롬·한컴·휴먼·HY(한양) 계열은 한글(한컴오피스)과 함께 설치되고, 바탕·돋움·맑은 고딕·Times New Roman은 윈도우 기본입니다. KoPubWorld(한국출판인회의)·나눔글꼴(네이버)은 무료로 받을 수 있습니다.'],
      [h('b', {}, '상용 글꼴'), ' — 윤명조·윤고딕(윤디자인), 산돌(산돌구름), SM 신명조·중고딕(직지소프트)은 구매·구독이 필요합니다. 없으면 그대로 두세요. 화면 확인용으로는 한컴 번들의 HY신명조·HY중고딕이 가장 비슷합니다.'],
      [h('b', {}, '학회별 목록'), ' — 저장소의 docs/글꼴안내.md에 학회별로 쓰는 글꼴과 구분(번들·기본·무료·상용)을 정리해 두었습니다.'])));
  main.append(sec('보안과 보관',
    ul('이 파일 하나로 동작하며 원고·결과는 브라우저 메모리에서만 처리됩니다. 어디에도 전송하지 않고, 네트워크 연결 없이도 됩니다.',
      '‘학회 추가’로 넣은 학회와 바탕틀, 설정값만 이 브라우저의 저장소(localStorage)에 남습니다. 원고는 남기지 않습니다.',
      '다른 PC에서도 쓰려면 이 HTML 파일을 복사하면 됩니다. 사용자 추가 학회는 ‘학회 추가’ 화면에서 내보내기·가져오기로 옮깁니다.')));
  main.append(sec('라이선스와 감사의 말',
    ul([h('b', {}, '투고틀 소스 코드'), ' — MIT 라이선스, ⓒ 2026 이융희. 자유롭게 쓰고 고치고 나눌 수 있으며 보증은 없습니다. 투고 전 학회 공지와 산출 파일은 반드시 직접 확인하세요.'],
      [h('b', {}, 'HWP 엔진 rhwp'), ' (Edward Kim, MIT) — 이 파일 안에서 HWP를 읽고 쓰는 핵심입니다. ', h('a', { href: 'https://github.com/edwardkim/rhwp', target: '_blank', rel: 'noopener noreferrer' }, 'github.com/edwardkim/rhwp')],
      [h('b', {}, 'JSZip'), ' (Stuart Knightley 외, MIT/GPL 이중 라이선스 중 MIT) — DOCX 읽고 쓰기와 HWPX 패키지 처리.'],
      [h('b', {}, 'pako'), ' (Vitaly Puzrin·Andrei Tuputcyn, MIT)와 ', h('b', {}, 'cfb'), ' (SheetJS, Apache-2.0) — 저장한 HWP의 각주 모양(구분선 길이·선 위 여백)을 한글이 읽는 배치로 고칠 때 압축을 풀고 다시 묶습니다.'],
      [h('b', {}, '학회 바탕틀·투고 서식·규정'), ' — 각 학회·연구소가 투고자에게 공개 배포한 자료를 투고 편의를 위해 넣었습니다. 논문 양식 파일은 견본 논문 글자를 지우고 서식만 남겼습니다. 저작권은 각 학회에 있고, 해당 학회 투고 용도로만 쓰세요. 권리자가 요청하면 즉시 제거합니다.'],
      '글꼴은 이 파일에 들어 있지 않습니다. 화면은 PC의 시스템 글꼴을, 산출물은 학회 양식의 글꼴 이름을 그대로 씁니다.',
      ['전문과 목록: 저장소의 ', h('a', { href: 'https://github.com/fansenryu-cmd/tugotl/blob/main/LICENSE', target: '_blank', rel: 'noopener noreferrer' }, 'LICENSE'), ', ', h('a', { href: 'https://github.com/fansenryu-cmd/tugotl/blob/main/THIRD_PARTY_NOTICES.md', target: '_blank', rel: 'noopener noreferrer' }, 'THIRD_PARTY_NOTICES.md'), '. 새 버전과 소스: ', h('a', { href: 'https://github.com/fansenryu-cmd/tugotl', target: '_blank', rel: 'noopener noreferrer' }, 'github.com/fansenryu-cmd/tugotl')]),
    h('details', { style: 'margin-top:10px' }, h('summary', { style: 'cursor:pointer' }, '제3자 소프트웨어 라이선스 전문 (MIT·Apache-2.0)'), ...THIRD_PARTY_LICENSES.map((l) => h('div', { style: 'margin-top:8px' }, h('b', {}, l.name), h('pre', { style: 'white-space:pre-wrap;font-size:11px;line-height:1.5;margin:4px 0 0' }, l.text)))),
    h('p', { style: 'margin:10px 0 0' }, '규정을 공개해 주신 각 학회 편집위원회와 rhwp를 만든 Edward Kim께 감사드립니다. 이 프로그램의 코드와 문서는 AI 코딩 도구(Claude, Anthropic)의 도움을 받아 작성했고, 설계·검증·최종 확인은 저자가 했습니다.')));
  // 해외 연구자용 영어 안내(화면은 한글이지만 단추 네 개로 끝난다)
  main.append(h('section', { class: 'card', lang: 'en', style: 'margin-bottom:14px' }, h('h2', { style: 'font-size:16px;margin-bottom:10px' }, 'In English — for researchers submitting to Korean journals'),
    h('p', { style: 'margin:0 0 8px' }, 'tugotl reformats your manuscript to the house style of a Korean (KCI-listed) journal and saves it as HWP, the format most Korean journals require. It uses rules only (no AI) and runs entirely in this browser; nothing is uploaded.'),
    ol(h('span', {}, h('b', {}, '투고처 선택'), ' (Journal) — choose the journal in the sidebar or, on a phone, from the ☰ menu. The field box above it narrows the list by area (Korean literature, modern, classical, folklore, education, comparative, culture studies, popular culture, cultural content).'),
      h('span', {}, h('b', {}, '파일 선택'), ' (Choose file) — drop or pick the manuscript: HWP, HWPX, DOCX, TXT or MD. Check the role recognised for each paragraph (제목 title, 국문초록 abstract, 본문 body, 참고문헌 references …) and correct it if needed.'),
      h('span', {}, h('b', {}, '적용'), ' (Apply) — builds the journal-styled document; review 미리보기 (preview), 정오표 (errata), 변경 사항 (changes) and 투고 전 확인 (checklist).'),
      h('span', {}, h('b', {}, '저장'), ' (Save) — saves the HWP (▾ for HWPX or Word/DOCX). The Word file keeps the same page set-up, fonts, spacing, footnotes, tables and pictures; page breaks may differ by a page or two. Open the file once before submitting.')),
    h('p', { class: 'small muted', style: 'margin:8px 0 0' }, '투고 양식 및 규정 확인 (Journal rules) lists each journal’s submission system (usually JAMS), deadlines, fees, length limits, required forms and citation rules. Questions in English are welcome: jojanggun@naver.com.')));
  main.append(sec('문의 및 개선 제안',
    h('p', { style: 'margin:0' }, '잘못 인식되는 원고, 학회 규정 변경, 추가하고 싶은 학회가 있으면 아래로 보내 주세요. 원고 파일을 함께 보내 주시면 인식 규칙을 고치는 데 큰 도움이 됩니다.'),
    h('p', { style: 'margin:10px 0 0;font-size:15px' }, h('b', {}, '이융희'), ' · ', h('a', { href: 'mailto:jojanggun@naver.com?subject=' + encodeURIComponent('[투고틀] 문의 및 개선 제안') }, 'jojanggun@naver.com'))));
}

// ───────── 시작 ─────────
document.querySelectorAll('#nav button').forEach((b) => b.addEventListener('click', () => { state.view = b.dataset.view; openSide(false); render(); window.scrollTo(0, 0); }));
// 휴대폰 서랍: 메뉴 단추·투고처 이름을 누르면 열고, 바깥·Esc·메뉴 선택으로 닫는다
$('#mnav')?.addEventListener('click', () => openSide(!$('#side').classList.contains('open')));
$('#mjour')?.addEventListener('click', () => openSide(true));
$('#scrim')?.addEventListener('click', () => openSide(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#side')?.classList.contains('open')) openSide(false); });
$('#jsub')?.addEventListener('click', (e) => { if (e.target.closest('button')) openSide(false); });
window.matchMedia('(max-width: 760px)').addEventListener?.('change', () => { if (!narrow()) openSide(false); render(); });
// 화면 스킨: 색·글꼴·둥글기 변수만 바꾼다(원고 처리와 무관). 이 브라우저에만 기억
const SKINS = new Set(['', 'dark', 'paper', 'mono', 'navy', 'type', 'slack', 'violet']);   // ''=다크(기본)
const applySkin = (k) => { if (!SKINS.has(k)) k = ''; if (k) document.documentElement.setAttribute('data-skin', k); else document.documentElement.removeAttribute('data-skin'); document.querySelectorAll('#skins .sw').forEach((b) => { const on = (b.dataset.skin || '') === k; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); }); };
applySkin(typeof lsGet(LS.skin, '') === 'string' ? lsGet(LS.skin, '') : '');
document.querySelectorAll('#skins .sw').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.skin || ''; applySkin(k); lsSet(LS.skin, k); }));
$('#jarea')?.addEventListener('change', (e) => { state.area = e.target.value || ''; lsSet(LS.area, state.area); renderSide(); });
$('#jsel').addEventListener('change', (e) => { state.journalId = e.target.value || null; lsSet(LS.journal, state.journalId); if (state.journalId) lsSet(LS.welcomed, true); if (state.view === 'journal' && !state.journalId) state.view = 'convert'; recompute(true); if (narrow()) openSide(false); render(); });
// 화면 어디에 놓아도 원고가 열린다
const mainEl = $('#main'); let dragDepth = 0;
mainEl.append(h('div', { class: 'dropline', 'aria-hidden': 'true' }));
document.addEventListener('dragenter', (e) => { if (e.dataTransfer?.types?.includes('Files')) { dragDepth++; mainEl.classList.add('over'); } });
document.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) mainEl.classList.remove('over'); });
document.addEventListener('dragover', (e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
document.addEventListener('drop', (e) => { dragDepth = 0; mainEl.classList.remove('over'); if (e.defaultPrevented) return; const f = e.dataTransfer?.files?.[0]; if (f) { e.preventDefault(); if (state.view !== 'manage') openFile(f); } });
document.addEventListener('click', (e) => { for (const el of document.querySelectorAll('.pop, .menu')) if (!el.parentElement.contains(e.target)) el.remove(); }, { capture: true });
function safeBoot() {
  try { loadJournals(); render(); }
  catch (e) {
    console.error(e);
    const main = document.getElementById('main'); main.replaceChildren(h('div', { class: 'card', style: 'margin:24px auto;max-width:560px' }, h('h2', { style: 'font-size:17px;margin-bottom:8px' }, '화면을 그리지 못했습니다'), h('p', { class: 'small muted' }, '이 브라우저에 저장된 사용자 학회·설정 데이터가 깨졌을 수 있습니다. 아래 버튼으로 사용자 데이터만 지우고 다시 시작합니다(내장 학회·바탕틀은 그대로).'), h('p', { class: 'small mono muted' }, String(e && e.message || e).slice(0, 200)), h('button', { class: 'btn', onclick: () => { for (const k of Object.values(LS)) { try { localStorage.removeItem(k); } catch { /* 무시 */ } } location.reload(); } }, '사용자 데이터 초기화 후 다시 시작')));
  }
}
safeBoot();
// 휴대폰: 엔진(약 8MB)을 불러오는 동안 첫 화면 그림을 깐다
const splash = $('#splash');
if (splash && narrow() && IMG('splash')) { splash.style.backgroundImage = `url("${IMG('splash')}")`; splash.hidden = false; }
const hideSplash = () => { if (splash && !splash.hidden) { splash.classList.add('out'); setTimeout(() => { splash.hidden = true; }, 260); } };
loadAssets().then(() => { state.ready = true; setStatus('엔진 준비됨 · 오프라인 처리', 'ready'); hideSplash(); render(); })
  .catch((e) => { console.error(e); setStatus('엔진 로드 실패: ' + (e.message || e), 'err'); const sm = $('#splash-msg'); if (sm) sm.textContent = '엔진을 불러오지 못했습니다'; setTimeout(hideSplash, 1500); });
// 웹 배포본(https)에서는 오프라인 캐시(서비스 워커)를 등록해 홈 화면 앱처럼 인터넷 없이 연다. 내려받은 파일(file://)에서는 하지 않는다
if (location.protocol === 'https:' && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* sw.js가 없는 곳 */ });
// 테스트용 훅(브라우저 콘솔에서 파일을 넣을 때) — UI 동작에는 영향 없음
window.__tugotl = { openFile, state, render, runConvert, saveResult };
