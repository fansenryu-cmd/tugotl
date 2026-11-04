// 학회 메일 투고 마감 → src/schedule_mail.js (메일 수집 연동, 2026-11-04)
//   node tools/mail_schedule.mjs match <후보.json> [YYYY-MM-DD]  — 메일에서 모은 후보를 학회와 맞춰 {items, unmatched, ambiguous} 를 stdout 으로
//   node tools/mail_schedule.mjs write <승인.json>                — 승인된 items 를 src/schedule_mail.js 에 합쳐 쓴다
// 후보 한 줄: { id, outlet, issue, due_date, publish_date, extended, subject, event_title, received_at }
// 메일 원문·발신자는 받지 않고 쓰지도 않는다. 이 파일이 쓰는 것은 학회 id·호수·마감·발간일·짧은 비고뿐이다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(root, 'src', 'schedule_mail.js');
const isoDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

const norm = (s) => String(s || '').normalize('NFC').replace(/\(사\)|사단법인|\s|[·,.'"‘’“”「」『』<>《》〈〉【】\[\]()（）]/g, '').toLowerCase();
const brackets = (s) => [...String(s || '').matchAll(/[『「<《〈【\[]([^』」>》〉】\]]{2,40})[』」>》〉】\]]/g)].map((m) => norm(m[1]));
// 학술대회·콜로키움 같은 행사 안내는 학회지 모집이 아니다(호수가 없을 때)
const EVENT_RE = /학술대회|콜로키움|컬로퀴엄|심포지엄|라운드테이블|워크숍|세미나|포럼|학술제|발표자\s*모집/;
const CALL_RE = /(논문|원고).{0,8}(모집|공모|투고|접수)|투고.{0,4}(안내|마감|기한|일정)|모집.{0,4}(안내|연장|마감)|마감.{0,4}연장|기한.{0,4}연장|call\s*for\s*papers/i;
const ISSUE_RE = /(?:제\s*)?(\d{1,4})\s*(집|호|권)/;
const issueOf = (r) => { const m = String(r.issue || '').match(ISSUE_RE) || String(r.subject || '').match(ISSUE_RE); return m ? `${m[1]}${m[2]}` : ''; };

async function journals() {
  const { JOURNALS } = await import(pathToFileURL(path.join(root, 'src', 'journals.js')).href);
  return JOURNALS.map((j) => ({ id: j.id, name: `${j.journal}`, society: j.society, soc: norm(j.society.replace(/\(.*?\)/g, '')), jr: norm(j.journal) }));
}

function matchOne(r, J) {
  const text = norm(`${r.outlet} ${r.subject} ${r.event_title}`);
  const br = [...brackets(r.subject), ...brackets(r.outlet), ...brackets(r.event_title)];
  const o = norm(r.outlet);
  // 1) 괄호 속 학술지 이름이 정확히 같다 2) 학회 이름이 정확히 같다 3) 이름이 들어 있다(긴 것 우선, 다른 후보 이름의 일부인 것은 버림)
  let hit = J.filter((k) => br.includes(k.jr));
  if (hit.length > 1) { const s = hit.filter((k) => text.includes(k.soc)); if (s.length) hit = s; }
  if (!hit.length) hit = J.filter((k) => k.soc === o || k.jr === o);
  if (!hit.length) {
    hit = J.filter((k) => (k.jr.length >= 3 && text.includes(k.jr)) || (k.soc.length >= 4 && text.includes(k.soc)));
    const names = (k) => [k.jr, k.soc].filter((n) => text.includes(n));
    hit = hit.filter((k) => !hit.some((x) => x !== k && names(k).every((n) => names(x).some((m) => m !== n && m.includes(n)))));
    const score = (k) => (text.includes(k.jr) ? 100 + k.jr.length : 0) + (text.includes(k.soc) ? 50 + k.soc.length : 0);
    const top = Math.max(0, ...hit.map(score));
    hit = hit.filter((k) => score(k) === top);
  }
  const ids = [...new Set(hit.map((k) => k.id))];
  return ids.length === 1 ? { ok: J.find((k) => k.id === ids[0]) } : { ids };
}

async function match(file, today) {
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  const J = await journals();
  const items = new Map(); const unmatched = []; const ambiguous = [];
  for (const r of rows) {
    if (!r || !isoDate(r.due_date)) continue;
    const label = `${String(r.outlet || '').slice(0, 30)} ${String(r.subject || '').slice(0, 40)}`.trim();
    if (r.due_date < today) { unmatched.push({ row_id: r.id, reason: '마감 지남', label }); continue; }
    const words = `${r.subject || ''} ${r.event_title || ''}`;
    const issue = issueOf(r);
    if (!CALL_RE.test(words) && !issue) { unmatched.push({ row_id: r.id, reason: '학회지 모집 아님', label }); continue; }
    if (EVENT_RE.test(words) && !issue) { unmatched.push({ row_id: r.id, reason: '학술 행사 안내', label }); continue; }
    const m = matchOne(r, J);
    if (!m.ok) {
      if (m.ids.length) ambiguous.push(`${label} → ${m.ids.join('/')}`);   // 표시는 하되 다음 주에 다시 본다(표시하지 않음)
      else unmatched.push({ row_id: r.id, reason: '투고틀에 없는 학회', label });
      continue;
    }
    // 같은 학회·호수는 가장 늦게 받은 메일(연장 공지)만. 호수가 없으면 마감 40일 안을 같은 호로 본다
    const key = `${m.ok.id}|${issue || 'x'}`;
    const prev = items.get(key) || [...items.values()].find((it) => it.journal_id === m.ok.id && (!issue || !it.issue) && Math.abs(new Date(it.deadline) - new Date(r.due_date)) < 40 * 86400000);
    const recv = String(r.received_at || '');
    if (prev && String(prev._recv) >= recv) { prev.row_ids.push(r.id); continue; }
    const it = { journal_id: m.ok.id, journal_name: m.ok.name, issue: issue || prev?.issue || '', deadline: r.due_date,
                 publish: isoDate(r.publish_date) ? r.publish_date : (prev?.publish || ''), extended: r.extended === true || r.extended === 't',
                 note: '', row_ids: [...(prev?.row_ids || []), r.id], _recv: recv };
    it.note = `학회 메일 ${recv.slice(5, 10).replace('-', '/')}${it.extended ? ' · 마감 연장' : ''}`;
    if (prev) for (const [k, v] of items) if (v === prev) items.delete(k);
    items.set(key, it);
  }
  const out = [...items.values()].map(({ _recv, ...it }) => it).sort((a, b) => a.deadline.localeCompare(b.deadline));
  process.stdout.write(JSON.stringify({ items: out, unmatched, ambiguous }, null, 1));
}

async function loadCurrent() {
  if (!fs.existsSync(OUT)) return {};
  const mod = await import(pathToFileURL(OUT).href + `?t=${Date.now()}`);
  return JSON.parse(JSON.stringify(mod.MAIL_SCHEDULE || {}));
}

async function write(file) {
  const items = JSON.parse(fs.readFileSync(file, 'utf8'));
  const J = new Set((await journals()).map((k) => k.id));
  const cur = await loadCurrent();
  const today = new Date().toISOString().slice(0, 10);
  const old = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  let n = 0;
  for (const it of items) {
    if (!J.has(it.journal_id) || !isoDate(it.deadline)) continue;
    const list = (cur[it.journal_id] || []).filter((u) => !(it.issue && u.issue === it.issue) && Math.abs(new Date(u.deadline) - new Date(it.deadline)) >= 40 * 86400000);
    list.push({ issue: String(it.issue || '공지').slice(0, 40), deadline: it.deadline, publish: isoDate(it.publish) ? it.publish : '', note: String(it.note || '학회 메일').slice(0, 80) });
    cur[it.journal_id] = list; n++;
  }
  for (const id of Object.keys(cur)) {   // 90일 넘게 지난 마감은 걷어 낸다(파일이 커지지 않게)
    cur[id] = cur[id].filter((u) => u.deadline >= old).sort((a, b) => a.deadline.localeCompare(b.deadline));
    if (!cur[id].length) delete cur[id];
  }
  const ids = Object.keys(cur).sort();
  const body = ids.map((id) => `  ${JSON.stringify(id)}: [\n${cur[id].map((u) => `    ${JSON.stringify(u)},`).join('\n')}\n  ],`).join('\n');
  const head = fs.readFileSync(OUT, 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n');
  fs.writeFileSync(OUT, `${head}\nexport const MAIL_SCHEDULE_UPDATED = ${JSON.stringify(today)};\nexport const MAIL_SCHEDULE = {${ids.length ? `\n${body}\n` : ''}};\n`);
  process.stdout.write(JSON.stringify({ written: n, journals: ids.length }));
}

const [cmd, file, day] = process.argv.slice(2);
if (cmd === 'match' && file) await match(file, isoDate(day) ? day : new Date().toISOString().slice(0, 10));
else if (cmd === 'write' && file) await write(file);
else { console.error('사용: node tools/mail_schedule.mjs match <후보.json> [YYYY-MM-DD] | write <승인.json>'); process.exit(1); }
