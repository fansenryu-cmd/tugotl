# 투고틀 독립 보안·견고성 감사 보고서 (Opus)

- 감사일: 2026-10-13 (KST 12:20~13:30)
- 대상: `D:\project\투고틀` — `src/*.js`, `tools/build.mjs`, `dist/투고틀.html`(19,447,090 B, 12:54 빌드)
- 방식: 읽기 전용 소스 추적 + 재현 스크립트(`tests/audit_opus/`) + 실제 Chromium 152(Claude 브라우저 패널, `http://localhost:8765`로 dist를 그대로 제공) 실행
- 감사 기준 소스 해시: `tests/audit_opus/src_snapshot.sha256` (감사 도중 `src/errata.js`가 새로 생기고 `app.js`·`engine.js`가 바뀌었습니다. 줄 번호는 12:58 기준입니다. 9×5 일괄 변환은 12:39 시점 코드로 돌았습니다.)
- `src/`, `dist/`는 수정하지 않았습니다. 새로 만든 것은 `tests/audit_opus/*`와 이 보고서뿐입니다.

---

## 1. 요약

### 점수: **67 / 100**

| 영역 | 배점 | 점수 | 한 줄 근거 |
|---|---:|---:|---|
| 보안 | 50 | **36** | XSS·네트워크 유출·매크로 전파·메타데이터 유출은 실측으로 **없음**. 감점 요인: (1) 가져오기 JSON·공유 저장소로 내장 학회의 투고처 링크와 바탕틀을 **표시 없이 바꿔치기**할 수 있음, (2) 한 번 넣으면 영구히 앱이 멈추는 저장소 오염, (3) CSP와 배포본 무결성 확인 수단이 없음, (4) `javascript:` URL을 그대로 받음 |
| 견고성·오류 처리 | 20 | **9** | 모든 변환이 주 스레드에서 돌고 문단·각주 수에 대해 **O(n²)** 입니다(각주 400개에 36초, 2000개에 765초, 537쪽 원고는 20분이 지나도 안 끝남). 2~3 KB짜리 DOCX 한 개로 43~65초 동안 멈춥니다. 13만 블록이 넘으면 스택 오버플로가 납니다. rhwp 퍼징은 100건에서 패닉 0으로 견고했습니다 |
| 변환 정확성 | 20 | **15** | 7편×5개 학회, 35건 모두 **누락 문단 0, 각주 불일치 0**. 감점: **구역이 2개 이상이고 각주가 있는 HWP는 열리지 않음**(iall·kochih 바탕틀로 쓴 원고 포함), 굵게+기울임 2곳 유실, 대형 원고는 끝나지 않음 |
| 배포 적합성 | 10 | **7** | 오프라인 단일 파일이고 로드는 1초 미만(측정값). 다만 19.4 MB라 Gmail 25 MB 한도를 MIME 인코딩 뒤에 넘고, 규정이 바뀔 때마다 파일 전체를 다시 배포해야 하며, 받은 파일이 원본인지 확인할 방법이 없습니다 |

### HTML이냐 별도 프로그램이냐: **단일 HTML을 유지할 것** (조건부)

이 대상층(윈도우, 한글 사용, 관리자 권한이 없는 학교·연구실 PC)에서는 설치 없이 더블클릭으로 열리는 HTML의 이점이 큽니다. 별도 프로그램이 보안상 확실히 나은 점은 저장소 격리와 코드 서명 두 가지뿐인데, 이 둘은 HTML을 고쳐서 대부분 메울 수 있습니다(§5). 별도 프로그램이 정말 필요해지면 **Tauri 2로 지금 HTML을 그대로 감싸는 것**이 가장 싼 길입니다. Electron과 WPF는 권하지 않습니다.

### 즉시 고칠 것 (배포 전)

1. **저장소 값 검증과 안전 부팅** — `loadJournals`/`loadAssets`에서 사용자 데이터를 검증하고, 실패하면 사용자 데이터 없이 기동한 뒤 "사용자 학회 초기화" 버튼을 보여 줍니다(F-1, F-2).
2. **내장 학회 id·바탕틀 키를 덮어쓰지 못하게** 하고, 링크는 `https:`만 허용합니다(F-3, F-4).
3. **`engine.js`에서 `beginBatch()`/`endBatch()`를 쓰고, 변환을 Web Worker로 옮깁니다.** 각주 200개 기준 9.1초가 0.24초로 줄어 38배 빨라집니다(측정값, F-6).
4. **여러 구역 HWP의 각주 파싱을 고칩니다**(`parse.js:47,54`, F-8).
5. **DOCX 정규식 파서에 크기·개수 상한**을 두고, 2차 시간이 드는 구간을 없앱니다(F-7).
6. **CSP 메타를 넣고 배포본 SHA-256을 공개**합니다(F-5).

---

## 2. 위협 모델별 판정

| 경로 | 시도한 공격 | 판정 | 근거 |
|---|---|---|---|
| (a) 악성 원고 | 원고 글·각주에 `</text><image onerror>`, `<script>`, `<foreignObject>` 삽입 → 미리보기 `innerHTML` | **불성립** | rhwp 0.8.7이 `<`, `&`, `"`, `'`를 전부 이스케이프합니다(`svg_xss.mjs`: 원시 태그 0, `&lt;` 150개) |
| (a) | 글꼴 이름에 `"`/`'`를 넣어 속성 탈출 | **불성립** | `font-family="&apos;Evil&quot; onmouseover…"`처럼 이스케이프됨 |
| (a) | HWP 하이퍼링크를 `javascript:`/`data:`/`file:`로 변조 | **불성립** | 기본 `renderPageSvg`는 `<a>`를 아예 내보내지 않습니다(https 링크 포함, `hyperlink_probe.mjs`). rhwp의 삽입 API도 http/https만 받습니다 |
| (a) | zip 폭탄 HWPX(압축 554 KB → 512 MB) | **방어됨** | rhwp가 항목당 256 MB 한도로 거부, 55 ms |
| (a) | zip 폭탄 DOCX(압축 1 MB → 1 GB) | **부분 성립** | JSZip에는 한도가 없습니다. 5초 동안 RSS가 1.26 GB까지 오른 뒤 `Invalid string length`로 끝납니다. 메모리가 적은 PC에서는 탭이 죽을 수 있습니다(F-9) |
| (a) | 2~3 KB DOCX로 정규식 2차 시간 유발 | **성립** | 닫히지 않은 `<w:p>` 20만 개: 55초. `<w:tbl>`: 65초. 한 문단에 런 5만 개: 43초. 그동안 주 스레드가 멈춥니다(F-7) |
| (a) | XXE / 외부 엔티티 | **해당 없음** | DOCX는 XML 파서 없이 정규식으로 읽고, HWPX는 rhwp(quick-xml)가 DTD를 해석하지 않습니다. 애초에 네트워크도 없습니다 |
| (a) | 변조 HWP 퍼징(비트 뒤집기·자르기 100건) | **방어됨** | 패닉 0, 정상 오류 76, 성공 24. 최장 89 ms. 이후 엔진 상태도 정상(`fuzz_hwp.mjs`) |
| (a) | 확장자 위조·빈 파일 | **방어됨**(메시지는 개선 필요) | HWP 쪽은 한국어 오류. DOCX 쪽은 JSZip의 영문 오류(`Corrupted zip ?`)가 그대로 나옵니다 |
| (b) 변조 HTML | 수정된 HTML이 원고를 외부로 전송 | **막을 수 없음**(구조적 한계) | file:// 페이지도 https로 `fetch`할 수 있습니다. CSP가 없고 배포본 해시도 공개하지 않습니다(F-5) |
| (c) 학회 JSON 가져오기 | `{"journals":[null]}` | **성립 — 영구 DoS** | 가져오기는 실패라고 알리지만 저장은 먼저 끝나 있습니다. 새로 고치면 화면이 비고 "엔진 준비 중…"에서 영영 멈춥니다(브라우저에서 재현, F-1) |
| (c) | `{"templates":{"koli":{}}}` | **성립 — 영구 DoS** | 기동할 때마다 `엔진 로드 실패: atob…`(브라우저에서 재현, F-2) |
| (c) | 내장 id(`koli`)로 학회 넣기 + `submit.url` 변조 | **성립 — 피싱 유도** | 내장 학회를 대체하고, "투고처 이동"이 공격자 주소로 갑니다. 표시는 목록 끝의 "(사용자)" 하나뿐입니다(F-3) |
| (c) | 사용자 바탕틀 키를 내장 파일명(`koli`)으로 | **성립 — 무표시 바꿔치기** | 내장 학회 이름에 표시가 전혀 없는 채로 다른 바탕틀이 적용됩니다(브라우저에서 재현, F-3) |
| (c) | `submit.url = "javascript:…"` | **수용됨, 실행은 안 됨** | `href`에 그대로 들어갑니다. 측정한 Chromium 152에서는 `target=_blank`라 실행되지 않았습니다. 이것은 브라우저 동작에 기대는 것입니다(F-4) |
| (c) | 프로토타입 오염 `__proto__`/`constructor.prototype` | **불성립**(국소 영향만) | 전역 `Object.prototype`은 오염되지 않습니다. 해당 객체의 프로토타입만 바뀝니다(`proto_pollution.mjs`) |
| (c) | 바탕틀 HWP 안의 스크립트·OLE | **산출물로 전파되지 않음** | 내장 바탕틀 20개·서식 15개의 `Scripts/DefaultJScript`를 풀어 보니 모두 한글 기본 빈 스크립트였습니다. OLE 0개. 산출 HWP의 스크립트는 rhwp 기본본(16 B 빈 것)이고 바탕틀 스크립트는 옮겨지지 않습니다(`cfb_scan.mjs`, `cfb_scripts.mjs`) |
| (d) 다른 사이트 | https 사이트가 file:// 저장소 읽기 | **불성립** | 오리진이 다릅니다. 링크는 모두 `rel=noopener`라 역탭내빙도 없습니다 |
| (d) | **다른 로컬 HTML 파일**(메일 첨부를 내려받아 연 것) | **성립** | Chromium 계열(크롬·엣지·웨일)은 모든 file:// 문서가 localStorage 하나를 함께 씁니다. 그래서 (c)의 공격 셋을 가져오기 없이 그대로 할 수 있습니다(F-3과 같은 근본 원인) |
| 산출 HWP | 한글에서 열 때의 위험 | **낮음** | 스크립트는 빈 기본본이고 OLE·하이퍼링크는 없습니다. 문서 정보(작성자)는 비어 있고 원고 작성자 이름은 옮겨지지 않습니다(`summary_info.mjs`). 다만 `DocOptions/_LinkDoc`에 rhwp 기본본에서 온 `C:\Users\cabso\AppData\Local\Temp\prv…png` 경로가 남습니다(F-12) |

---

## 3. 발견 사항 (심각도순)

### F-1 [높음] 가져오기 JSON 하나로 앱이 영구히 멈춤(저장 후 검증)
- 위치: `src/app.js:438`(가져오기 핸들러: `lsSet`이 검증보다 먼저 실행), `:44-49` `loadJournals`(`c.id`를 null 검사 없이 읽음), `:501` 최상위 `loadJournals(); render();`(try 없음), `:64` `nextDeadlines`(`for…of j.schedule.upcoming`, 반복 불가 값이면 예외)
- 재현(브라우저에서 확인): `{"journals":[null],"templates":{}}`를 가져오면 경고창에 `TypeError: Cannot read properties of null (reading 'id')`가 뜨지만, localStorage에는 `[null]`이 이미 저장되어 있습니다. 새로 고치면 `#jsel` 옵션 0개, `#main` 빈 화면, 상태가 "엔진 준비 중…"으로 멈춥니다. `"schedule":{"upcoming":5}`도 그 학회를 고르는 순간부터 같은 결과가 납니다.
- 영향: 일반 사용자는 개발자 도구 없이 복구할 수 없습니다. "학회 설정 공유 파일"처럼 위장한 JSON을 받으면 그것만으로 도구를 못 쓰게 됩니다. 같은 브라우저에서 연 다른 로컬 HTML로도 같은 상태를 만들 수 있습니다(F-3).
- 수정안:
```js
// app.js — 검증 후 저장, 실패해도 기동
const SAFE_ID = /^[a-z0-9_-]{2,32}$/i;
const str = (v, n = 300) => (typeof v === 'string' && v.length <= n ? v : '');
const httpsUrl = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
function cleanJournal(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c) || !SAFE_ID.test(c.id) || !str(c.journal)) return null;
  const j = structuredClone(c);                                  // 프로토타입 키 제거 효과
  j.submit = j.submit && typeof j.submit === 'object' ? { ...j.submit, url: httpsUrl(j.submit.url) } : undefined;
  j.sources = Array.isArray(j.sources) ? j.sources.filter((s) => typeof s === 'string') : [];
  const sc = j.schedule && typeof j.schedule === 'object' ? j.schedule : {};
  for (const k of ['upcoming', 'deadlines', 'publish']) if (!Array.isArray(sc[k])) delete sc[k];
  j.schedule = sc; return j;
}
function loadJournals() {
  let custom = lsGet(LS.journals, []); if (!Array.isArray(custom)) custom = [];
  custom = custom.map(cleanJournal).filter(Boolean);
  ...
}
// 가져오기: 먼저 정리·검증하고, 통과한 것만 저장
const list = all.journals.map(cleanJournal); if (list.some((x) => !x)) throw new Error('형식이 맞지 않는 학회 항목이 있습니다');
// 최상위 부팅
try { loadJournals(); render(); } catch (e) { console.error(e); state.journals = [...JOURNALS]; showResetBanner(e); render(); }
```

### F-2 [높음] 사용자 바탕틀 값이 잘못되면 엔진 로드가 영구히 실패
- 위치: `src/app.js:41-42` — `for (const [k, v] of Object.entries(custom)) state.templates[k] = await b64ToBytes(v);`. 예외가 `loadAssets` 전체를 거부시키고 `state.ready`가 영영 `true`가 되지 않습니다.
- 재현(브라우저에서 확인): `localStorage['tugotl.customTemplates'] = '{"koli":{}}'` → 상태 표시가 `엔진 로드 실패: Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.`로 고정됩니다.
- 수정안: 항목마다 try/catch로 감싸고, `typeof v === 'string' && /^[A-Za-z0-9+/]+=*$/.test(v) && v.length < 4e6`인지 검사합니다. 디코드한 뒤에는 시그니처(`D0 CF 11 E0`=HWP, `50 4B`=HWPX)를 확인하고, 틀리면 그 항목만 버리면서 알립니다.

### F-3 [높음] 내장 학회·바탕틀을 표시 없이 바꿔치기(투고처 피싱, 서식 조작)
- 위치: `src/app.js:46` `JOURNALS.filter((j) => !custom.some((c) => c.id === j.id))`는 사용자 항목이 같은 id의 내장 학회를 **대체**합니다. `:42` `state.templates[k] = …`는 내장 바탕틀 키(`koli`, `iall`…)를 **덮어씁니다**.
- 재현(브라우저에서 확인):
  - `journals:[{id:'koli', journal:'한국문학연구', society:'동국대학교 한국문학연구소', submit:{system:'JAMS', url:'javascript:alert(document.domain)'}}]`를 가져오면 사이드바 "투고처 이동"의 `href`가 그 주소가 됩니다. 실제 공격이라면 `https://koli-jams.example/login` 같은 가짜 JAMS 로그인 화면일 것입니다.
  - `customTemplates = {koli: <다른 HWP의 base64>}`을 넣으면 내장 학회 `koli`(목록에 "(사용자)" 표시 없음)가 다른 바탕틀(109,056 B)로 변환합니다.
- 영향: 투고 시스템(JAMS) 계정 피싱, 그리고 잘못된 여백·글꼴로 인한 형식 미비 반려. **Chromium에서는 모든 file:// 문서가 저장소를 함께 쓰므로**, 같은 PC에서 연 아무 로컬 HTML이 가져오기 없이도 이렇게 할 수 있습니다.
- 수정안:
```js
// 사용자 항목은 별도 이름공간 — 내장 id와 겹치면 'user-' 접두어를 붙이고 목록·제목에 항상 '사용자' 배지
const id = BUILTIN_IDS.has(c.id) ? `user-${c.id}` : c.id;
// 사용자 바탕틀은 'user:' 접두어 키로만 저장·조회
state.templates['user:' + k] = bytes;   const templateBytes = (j) => state.templates[(j.custom ? 'user:' : '') + j.template.file];
```
  또 저장소의 무결성을 보조하는 장치로, 사용자 데이터가 바뀌면 첫 화면에 "사용자 학회 N개(마지막 변경 시각)" 안내를 띄우는 것을 권합니다. Tauri로 감싸면 저장소가 앱 전용이 되어 근본 원인이 사라집니다(§5).

### F-4 [중간] 링크 주소 검증 없음(`javascript:`·`http:` 수용)
- 위치: `src/app.js:92`, `:295`(투고처 이동), `:305`(문서 탭의 주소). `:337`의 `sources`만 `/^https?:/`로 거릅니다.
- 실측: `javascript:` 주소가 `href`에 그대로 들어갑니다. Chromium 152에서는 `target=_blank` 때문에 실행되지 않았지만, 이것은 브라우저 동작에 기대는 것입니다.
- 함께 볼 것: `src/journals.js`의 투고처 주소 30곳이 `http://`입니다(예: `http://koli.jams.or.kr`). 공용 와이파이에서 JAMS 로그인 화면이 변조될 여지가 있습니다.
- 수정안: F-1의 `httpsUrl()`을 모든 `href`에 쓰고, 내장 주소는 `https://`로 바꿉니다(JAMS는 https를 지원합니다).

### F-5 [중간] CSP 없음 · 배포본 무결성 확인 수단 없음
- 위치: `src/index.html`(CSP 메타 없음), `tools/build.mjs`(해시를 출력하지 않음).
- 영향: 앱 안에서 주입점은 찾지 못했습니다. 그러나 CSP가 없으니 (i) 장래에 XSS가 생기면 원고를 외부로 그대로 보낼 수 있고, (ii) "외부로 전송되지 않습니다"라는 약속을 기술적으로 보장하지 못합니다. 변조된 HTML(위협 b)은 CSP로도 막지 못합니다. 그래서 **배포 채널에 해시를 공개하는 것**이 유일한 실효 수단입니다.
- 수정안(`build.mjs`):
```js
import crypto from 'node:crypto';
const h = crypto.createHash('sha256').update(js).digest('base64');
const csp = `default-src 'none'; script-src 'sha256-${h}' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src data: blob:; worker-src blob:; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'`;
// <head>에 <meta http-equiv="Content-Security-Policy" content="${csp}"> 삽입
// 빌드 끝에 배포본 SHA-256 출력 → 배포 페이지·메일 본문에 함께 공지
console.log('SHA-256', crypto.createHash('sha256').update(prod).digest('hex'));
```
  `type="text/plain"` 자산 스크립트는 실행되지 않으므로 `script-src`의 영향을 받지 않습니다. `b64ToBytes`의 `fetch('data:…')`에는 `connect-src data:`가 필요합니다. 번들 안의 `new Function`(setImmediate 폴리필, 함수가 아닌 인자를 받을 때만 실행)은 호출되지 않으므로 `'unsafe-eval'`은 필요 없습니다. 참고로 현재 배포본(12:30 빌드)의 SHA-256은 `731ce13f…41c1`이었고, 12:54 재빌드로 이미 바뀌었습니다. 해시를 공지하지 않으면 사용자가 원본인지 비교할 수 없다는 뜻입니다.

### F-6 [높음·견고성] 모든 변환이 주 스레드에서 O(n²) — 수백 쪽 원고는 사실상 불가
- 위치: `src/engine.js` 블록 삽입 루프(`splitParagraph`·`insertText` 반복)와 각주 삽입 루프(`:259` `insertFootnote`). 편집할 때마다 rhwp가 `paginate()`를 다시 돕니다. rhwp는 `beginBatch()`/`endBatch()`(d.ts 139·469행: "이후 Command 호출 시 paginate()를 건너뛴다")를 제공하지만 쓰이지 않습니다. 또 `structure.js:50` `paragraphs.slice(i + 1).find(…)`는 문단마다 배열 뒤쪽을 통째로 복사해 O(n²)이고, `structure.js:148-149` `out.push(...groups[g])`는 인자 수 한계에 걸립니다.
- 실측:

| 입력 | 결과 |
|---|---|
| 각주 100 / 200 / 400 / 2000개 (md) | 생성 2.6 s / 9.3 s / 36.5 s / **764.8 s** (2배마다 약 4배) |
| 같은 작업에 `beginBatch` 적용 (`batch_mode_bench.mjs`) | 100: 2180→**98 ms**, 200: 9134→**241 ms**, 400: →1.35 s, 2000: →33 s (재오픈 후 각주 수 일치) |
| 브라우저 실측 paper2.hwp → koli | 주 스레드 정지 **21.9 s** (paper4 → iall은 2.3 s) |
| 537쪽 원고(28,386문단, `한국형판타지…hwp`) → koli | **20분 넘게 끝나지 않음**(환경이 프로세스를 정리해 측정 중단) |
| 이진 데이터를 .txt로(1,564문단, 19만 8천 자) | 파싱 12 ms, 인식 14 ms인데 생성이 **120 s 제한 초과** |
| recognize 5천/1만/2만/4만 문단 | 78 / 195 / 743 / 3,731 ms |
| 200만 자 20만 줄 txt | recognize **398 s** 뒤 `RangeError: Maximum call stack size exceeded`(reorder) |
| reorderSections 13만 블록 | 스택 오버플로(10만 블록은 9 ms) |
- 영향: 학위논문급 원고(각주 300~600개)는 수 분 동안 "페이지 응답 없음" 상태가 됩니다. 사용자는 고장으로 보고 탭을 닫게 됩니다.
- 수정안:
```js
// engine.js buildDocument — 삽입 구간 전체를 배치로
doc.beginBatch();
try { /* 비우기 · 블록 삽입 · 각주 삽입 */ } finally { doc.endBatch(); }
// structure.js — 다음 비어 있지 않은 문단을 미리 계산(O(n))
const nextIdx = new Array(paragraphs.length); for (let i = paragraphs.length - 1, nx = -1; i >= 0; i--) { nextIdx[i] = nx; if (trimmed(paragraphs[i])) nx = i; }
const next = nextIdx[i] >= 0 ? paragraphs[nextIdx[i]] : null;
// reorderSections — 스프레드 대신 루프
for (const b of groups[g]) out.push(b);
```
  그리고 파싱·변환을 **Web Worker**(인라인 코드로 만든 blob: URL 워커. file://에서도 동작)로 옮기고 진행률과 취소 버튼을 둡니다. `renderPageSvg`도 워커에서 문자열로 받아 옵니다.

### F-7 [중간] DOCX 정규식 파서의 2차 시간(아주 작은 파일로 DoS)
- 위치: `src/parse.js:97`(`<w:tbl\b[\s\S]*?<\/w:tbl>` — 닫는 태그가 없으면 여는 태그마다 끝까지 훑음), `:99`(`<w:p\b…<\/w:p>` 동일), `:112` `const before = body.slice(0, rm.index)`(런마다 문단 앞부분을 복사).
- 실측(`run_all.mjs`): `quad_unclosed_p.docx` 2 KB → **55.0 s**, `quad_unclosed_tbl.docx` 2 KB → **64.7 s**, `quad_runs50k.docx` 3 KB → **43.2 s**.
- 수정안: (1) `<w:del>` 깊이는 런을 훑으면서 하나의 카운터로 추적하고 `slice`를 없앱니다. (2) 표 제거는 여는/닫는 태그를 한 번에 훑는 선형 스캐너로 바꿉니다(중첩 표도 처리). (3) 상한을 둡니다: `document.xml` 압축 해제 크기 64 MB, 문단 20만, 문단당 런 2만. 넘으면 "원고가 너무 큽니다"로 거부합니다. 브라우저 전용이면 `DOMParser('application/xml')`도 대안입니다(외부 엔티티를 가져오지 않습니다).

### F-8 [높음·정확성] 구역 2개 이상 + 각주 HWP는 열리지 않거나 각주가 섞임
- 위치: `src/parse.js:47` `if (c.list !== 0 || c.para !== i) continue;`, `:54` `d.getCharIndexAtStreamPos(0, i, c.pos)`.
- 원인: `getControls()`의 `para`는 **구역을 이어 붙인 전체 문단 번호**입니다(실측: 구역 0에 20문단이 있으면 구역 1의 첫 문단은 `para:20`). 그런데 파서는 구역마다 `i`를 0부터 다시 세어 비교하고, 위치 변환은 항상 구역 0으로 합니다.
- 재현(`multisection_fn.mjs`): 내장 바탕틀 `iall.hwp`, `kochih.hwp`(둘 다 2구역)를 원고로 넣으면 각각 `렌더링 오류: 컨트롤 0은 각주/미주가 아닙니다`, `컨트롤 인덱스 0 범위 초과`로 **원고 열기에 실패**합니다. 구역 1에 각주를 넣은 문서도 같습니다.
- 영향: 학회 바탕틀(여러 구역)에 이미 쓴 논문을 다른 학회로 옮기는 흔한 경우가 막힙니다. 예외가 나지 않는 배치에서는 각주가 다른 문단에 붙거나 중복됩니다.
- 수정안:
```js
let base = 0;
for (let s = 0; s < sections; s++) {
  const n = d.getParagraphCount(s);
  for (let i = 0; i < n; i++) {
    for (const c of controls) {
      if (c.list !== 0 || c.para !== base + i) continue;
      ...
      let fi = null; try { fi = J(d.getFootnoteInfo(s, i, c.controlIndex)); } catch { warnings.push(`구역 ${s + 1} 각주 하나를 읽지 못했습니다`); continue; }
      const raw = d.getCharIndexAtStreamPos(s, i, c.pos);
```
  `base += n`도 구역 루프 끝에 둡니다. 고친 뒤 `iall`·`kochih` 바탕틀을 원고로 넣는 회귀 시험을 추가합니다.

### F-9 [중간] 입력 크기 상한 없음(DOCX zip 폭탄, 수 GB 파일)
- 위치: `src/app.js:245` `file.arrayBuffer()`(크기 검사 없음), `src/parse.js:80-84`(JSZip `async('string')`, 압축 해제 크기 검사 없음).
- 실측: `bomb_1gb.docx`(1 MB) → 5.0 s, **RSS 최대 1,257 MB**, 그 뒤 `Invalid string length`. 500 MB 이하로 만들면 문자열 한도를 통과해 정규식 단계까지 갑니다. HWPX는 rhwp가 256 MB 한도로 막습니다.
- 수정안: `if (file.size > 50 * 2**20) throw new Error('50MB를 넘는 원고는 열 수 없습니다')`. DOCX는 `const sz = docFile._data?.uncompressedSize; if (sz > 64 * 2**20) throw …`(JSZip 내부 필드라 버전을 고정해야 함). footnotes·styles도 같게 합니다.

### F-10 [낮음] localStorage 실패를 숨김 — "저장됨"이라 해 놓고 다음에 사라짐
- 위치: `src/app.js:18` `lsSet`이 예외를 삼키고, 저장 처리(`:427-429`)는 결과와 상관없이 "저장됨"을 표시합니다.
- 영향: base64로 33% 커진 바탕틀이 일반 크롬·엣지의 오리진 한도(약 5~10 MB, 여러 바탕틀이 누적)를 넘거나 비공개 창이면, 새로 고친 뒤 학회는 있는데 바탕틀은 없는 상태가 됩니다. 감사용 브라우저 패널은 24M자까지 받아 한도를 직접 재현하지는 못했습니다.
- 수정안: `lsSet`이 `true/false`를 돌려주게 하고, 실패하면 "이 브라우저에 저장하지 못했습니다 — ‘내보내기’로 파일에 보관하세요"를 표시합니다. 큰 바탕틀은 IndexedDB로 옮기는 것을 권합니다(용량이 훨씬 큽니다).

### F-11 [낮음] WASM 문서 해제 누락·예외 경로 누수
- 위치: `src/app.js:243`(`openFile`), `:252`(`recompute`)가 `state.result = null`만 하고 `state.result.doc.free()`를 하지 않습니다. `engine.js buildDocument`에는 try/finally가 없어, 중간에 예외가 나면 `doc`이 해제되지 않습니다.
- 실측(`leak_test.mjs`, paper4 → iall 10회): free하면 11 MB로 유지되고, free하지 않으면 11→12 MB입니다. 18쪽 원고 기준 회당 약 0.1 MB라 실사용에서는 경미합니다. WASM 메모리는 줄어들지 않으므로 대형 원고를 반복 변환할 때 누적됩니다.
- 수정안: `state.result?.doc?.free?.()`를 공통 함수 `clearResult()`로 묶어 세 곳에서 부르고, `buildDocument` 본문은 `try { … } catch (e) { doc?.free(); throw e; }`로 감쌉니다.

### F-12 [낮음] 배포 파일 안의 제3자 정보(사용자 계정 경로)
- 내장 서식 15개·바탕틀 20개의 `DocOptions/_LinkDoc` 스트림에 한글이 남긴 쓰레기 데이터가 있습니다. 여기에 학회 직원의 Windows 계정 경로(`C:\Users\박진희\…`, `moonj`, `kimpd`, `안지햐`, `tkddm`, `콘텐츠~1` 등)와 본문 조각이 들어 있습니다. 모든 산출 HWP의 `_LinkDoc`에도 rhwp 기본본에서 온 `C:\Users\cabso\AppData\Local\Temp\prv00004c2050fb.png`가 남습니다.
- 영향: 개인정보로서 위험은 낮습니다. 익명 심사에서 투고자 본인 정보는 남지 않습니다(산출물의 문서 정보 요약은 비어 있고 원고 작성자 `fanse`는 옮겨지지 않음, 실측). 다만 "rhwp로 만든 문서"라는 표식(`RhwpHwpxOrigin` 스트림)은 남습니다.
- 수정안: 빌드할 때 서식·바탕틀의 `_LinkDoc`를 비우거나, 한글로 한 번 "다른 이름으로 저장"해 정리합니다. 산출물의 `_LinkDoc`은 rhwp에 정리를 요청하거나 저장 뒤 CFB를 후처리합니다.

### F-13 [낮음] 기타 코드 수준 항목
- **SVG 미리보기 `innerHTML`**(`app.js:195`, `:380`): 현재 rhwp가 이스케이프하므로 안전하지만, 안전성이 전적으로 의존성에 달려 있습니다. rhwp를 올릴 때(하이퍼링크 오버레이 `<a href>`, `rawSvg`, `<style>`을 내는 코드가 WASM 문자열에 이미 있음) 회귀가 생길 수 있습니다. 심층 방어로 `<img src="blob:…svg">` 렌더링을 권합니다. SVG를 이미지로 쓰면 스크립트·이벤트·외부 참조가 원천 차단됩니다:
  ```js
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
  const img = h('img', { src: url, alt: `${n + 1}쪽`, decoding: 'async' }); img.onload = () => URL.revokeObjectURL(url);
  ```
- **`window.__tugotl`**(`app.js` 마지막 줄): 배포본에도 상태·저장 함수를 그대로 노출합니다. `define: { __DEV__: 'false' }`로 빌드에서 빼기를 권합니다.
- **`build.mjs`**: 치환에 함수형 `replace`를 써서 `$&` 문제는 없습니다. 인라인 JS에 `<!--`와 `<script`는 0개, `</script`는 esbuild가 `<\/`로 12곳 이스케이프했고, 스크립트 태그 수는 37/37로 균형이 맞습니다(`html_inspect.mjs`). 다만 `data-template="${f}"`는 따옴표를 제거하지 않습니다(서식은 제거함). 빌드 입력은 개발자 소유라 위험은 낮지만 같은 처리로 맞추십시오. `minify:false`로 소스가 보이는 것은 비밀이 없으므로 문제없고, 오히려 감사 가능성 면에서 장점입니다.
- **오류 메시지**: DOCX 쪽은 JSZip 영문 원문이 그대로 나옵니다(`End of data reached … Corrupted zip ?`, `Can't find end of central directory`). 한국어 안내로 감싸십시오.
- **정오표 기능(감사 중 추가된 `errata.js`)**: 검색 링크는 `encodeURIComponent` + https로 사용자가 직접 누를 때만 열리므로 문제없습니다. 다만 기본값 `errata:true`가 산출 HWP의 각주를 **붉게 칠합니다**. 그대로 투고하면 형식 문제가 되므로, 기본값을 끄거나 저장 직전에 경고를 띄우기를 권합니다(미검증 신규 코드).
- **전역 drop**(`app.js:499`): 파일이 아닌 끌어 놓기는 막지 않고 통과시켜 안전합니다. 폴더를 떨어뜨리면 `arrayBuffer` 실패가 잡혀 오류로 표시됩니다. 문제없습니다.
- **showSaveFilePicker 폴백**(`app.js:300`): 취소(AbortError)는 그대로 끝내고 그 밖의 오류는 내려받기로 넘어갑니다. 올바른 처리입니다. `createWritable` 뒤 실패하면 빈 파일이 남을 수 있으니, 실패할 때 `handle.remove?.()`를 권합니다.

### 의존성
| 패키지 | 판정 |
|---|---|
| `@rhwp/core 0.8.7` (MIT) | 공개된 CVE를 찾지 못했습니다. 퍼징 100건에서 패닉 0, zip 폭탄 한도(256 MB) 내장, SVG 이스케이프 정상. 신생 프로젝트이므로 버전 고정(`^` 대신 정확한 버전) 권장 |
| `jszip 3.10.1` | 알려진 취약점(CVE-2021-23413 프로토타입 오염 <3.7.0, CVE-2022-48285 경로 탐색 <3.8.0)은 모두 이전 버전 문제입니다. 압축 해제 크기 한도가 없어 F-9로 직접 막아야 합니다 |
| `esbuild 0.25.0` | GHSA-67mh-4wv8-2f99(개발 서버 CORS, ≤0.24.2)가 고쳐진 버전입니다. 빌드에만 쓰이고 배포본에 포함되지 않습니다 |
| 전이 의존성(pako, readable-stream 등) | `npm audit --offline` 결과 0건(오프라인 캐시 기준이므로 온라인 재확인 권장) |

---

## 4. 변환 안전성 표본 검사

### 4-1. 실제 원고 9편 × 5개 학회 (koli·iall·kochih·koreacontents·ricc)
명령: `node tests/audit_opus/convert_audit.mjs <원고> koli,iall,kochih,koreacontents,ricc --quiet` (`tools/convert.mjs`와 같은 코드이고 출력 폴더만 `tests/audit_opus/out/`). 로그는 `tests/audit_opus/batch9x5.log`.

| 원고 | 형식 | 문단 / 각주 | 누락 문단 | 각주 일치 | 강조 유실 | 5개 학회 소요 |
|---|---|---|---|---|---|---:|
| 00_자료지도 | DOCX | 50 / 0 | 0 ×5 | 일치 ×5 | 0 | 2.0 s |
| 00_자료지도 | HWPX | 51 / 0 | 0 ×5 | 일치 ×5 | 0 | 2.4 s |
| paper1 | HWP | 135 / 61 | 0 ×5 | 61→61 ×5 | **2곳 ×5**(영문 제목의 굵게+기울임) | 30.5 s |
| paper2 | HWP | 218 / 39 | 0 ×5 | 39→39 ×5 | 0 | 55.1 s |
| paper3 | HWP | 198 / 35 | 0 ×5 | 35→35 ×5 | 0 | 37.7 s |
| paper4 | HWP | 60 / 17 | 0 ×5 | 17→17 ×5 | 0 | 7.4 s |
| paper5 | HWP | 144 / 27 | 0 ×5 | 27→27 ×5 | 0 | 22.3 s |
| 한국형판타지 | HWP | 28,386 / 0 (537쪽, 그림 187) | — | — | — | **koli 하나에 20분 넘게 미완료** |
| 한국형판타지 | HWPX | (동일 원고) | — | — | — | 미실행(앞 원고가 끝나지 않음) |

- 완료된 35건은 **누락 문단 0, 각주 불일치 0**입니다. kochih에서 글자 수가 +1, +46으로 늘어난 것은 쪽수 표기 치환(`쪽`→`pp.`) 때문임을 `extra_text.mjs`로 확인했습니다(바탕틀 예시 문구가 남은 것이 아님).
- 표·그림은 설계상 변환하지 않으며 경고로 알립니다. 검증 도구가 표 안의 글자를 셈에 넣지 않으므로, "본문 전부 보존"은 **표 밖 글**에 한한 판정입니다.
- 이 표본에는 F-8(여러 구역 + 각주) 원고가 없어서 모두 통과했습니다. 바탕틀 기반 원고에서는 실패합니다.

### 4-2. 악의적·극단 입력
명령: `node tests/audit_opus/gen_inputs.mjs` → `node tests/audit_opus/run_all.mjs "<정규식>" koli <제한초>`(파일마다 별도 프로세스). 결과는 `malicious_results.jsonl`, `heavy_run.log`, `bomb_probe.mjs`, `binary_txt_probe.mjs`에 있습니다.

| 입력 | 결과 | 시간 | 메시지·비고 |
|---|---|---:|---|
| empty.txt / empty.md | 빈 문서 생성 | 0.3 s | 문단 1개(빈 줄)라 '적용'이 가능하고 빈 HWP가 나옴. 안내가 필요함 |
| empty.hwp / .hwpx | 거부 | 10 ms | "빈 파일(0 바이트)입니다" (좋음) |
| empty.docx | 거부 | 1 ms | `End of data reached … Corrupted zip ?` (영문 원문) |
| spoof_docx_as.hwp / text_as.hwp / exe_as.hwp | 거부 | 10~14 ms | "알 수 없는 파일 형식 … UNSUPPORTED_FILE_FORMAT" |
| spoof_hwp_as.docx | 거부 | 5 ms | `Can't find end of central directory : is this a zip file ?` (영문) |
| spoof_binary_as.txt (195 KB 이진) | **120 s 제한 초과** | >120 s | EUC-KR로 해석돼 1,564문단이 되고, 생성 단계가 O(n²) |
| ctrl_chars.md (NUL·ESC·RLO·고립 서로게이트) | 정상 | 0.4 s | 제어 문자 제거됨 |
| fn2000.md (각주 2000개) | 성공 | **764.8 s** | 134쪽. 각주 삽입이 O(n²) |
| big_2m_200klines.txt | **실패** | 398 s | `Maximum call stack size exceeded` |
| big_2m_40klines.txt (4만 문단) | **900 s 제한 초과** | >900 s | 생성 단계(문단마다 paginate)가 끝나지 않음 |
| big_2m_oneline.txt (한 문단 200만 자) | 감사 마감까지 결과 없음 | — | `heavy_run.log`에 나중에 기록됨(제한 900 s) |
| quad_unclosed_p.docx (2 KB) | 문단 0 | **55.0 s** | 정규식 2차 시간 |
| quad_unclosed_tbl.docx (2 KB) | 문단 0 | **64.7 s** | 〃 |
| quad_runs50k.docx (3 KB) | 성공 | **46.7 s** (파싱 43.2 s) | `body.slice` 반복 |
| bomb_1gb.docx (1 MB) | 실패 | 5.0 s | `Invalid string length`, RSS 최대 1,257 MB |
| bomb_512mb.hwpx (554 KB) | 거부 | 55 ms | rhwp `HWPX entry exceeds 268435456 byte limit` (좋음) |
| 변조 HWP 60건 / HWPX 40건 | 정상 오류 76, 성공 24 | 최장 89 ms | **패닉 0**, 뒤이은 정상 파일 재파싱도 이상 없음 |

---

## 5. 배포 형태 판정

### 5-1. 실측과 사실
- **로드**: Chromium 152에서 DOMContentLoaded 476~910 ms, 엔진 준비까지 약 0.6~0.9 s(로컬 디스크, 두 번째 로드부터 캐시 효과). 힙 35~51 MB. 바탕틀 20개와 서식 15개를 디코드한 뒤 `<script>`를 지워 base64 문자열을 해제하는 처리가 이미 되어 있습니다.
- **WASM 8 MB 동기 컴파일 제한**: 번들에 `new WebAssembly.Module`(동기)은 없고 `WebAssembly.instantiate`(비동기)만 있습니다. `await init({ module_or_path: bytes })`로 우회되어 있습니다(정상).
- **용량**: 19,447,090 B. 메일 첨부는 MIME base64로 약 25.9 MB가 되어 **Gmail 25 MB 한도를 넘고**, 자동으로 드라이브 링크로 바뀝니다. 네이버 메일도 일반 첨부 한도를 넘으므로 대용량 첨부(보관 기간 제한)가 됩니다. 기관 메일 보안장비는 큰 base64 덩어리와 스크립트가 든 HTML 첨부를 "HTML 스머글링"으로 의심해 격리할 수 있습니다(일반적 위험, 미검증).
- **파일 열 때 경고**: 로컬 HTML을 더블클릭으로 열면 크롬·엣지 모두 경고가 없습니다. 내려받을 때 브라우저나 SmartScreen이 HTML을 검사·경고할 수 있습니다(환경마다 다름, 미검증). 반면 서명 없는 .exe는 SmartScreen "Windows의 PC 보호" 경고가 거의 확실히 뜹니다.
- **저장**: file://도 보안 컨텍스트라 크롬·엣지에서 `showSaveFilePicker`가 동작합니다. 파이어폭스는 내려받기로 폴백합니다.
- **갱신**: 학회 규정(journals.js, 253 KB)이 바뀔 때마다 19 MB를 다시 배포해야 합니다. 사용자 PC에 구버전이 섞이고, 어느 것이 최신이고 정품인지 확인할 방법이 없습니다.

### 5-2. 비교

| 기준 | 단일 HTML(현행) | Tauri 2로 감싸기 | Electron | .NET WPF/WinUI 재작성 |
|---|---|---|---|---|
| 설치·권한 | 없음(최상) | 설치형 또는 포터블 exe. 관리자 권한은 대개 불필요 | 설치형, 150 MB 이상 | 설치형. 런타임이 필요할 수 있음 |
| 크기 | 19 MB | 약 5 MB 런타임 + 19 MB 자산 | 약 170 MB | 재작성 크기 + rhwp 네이티브화 필요 |
| 저장소 격리(F-3 근본 원인) | ✗ (file:// 공유) | ✓ 앱 전용 | ✓ | ✓ |
| 코드 서명·무결성 | ✗ (해시 공지로 보완) | ✓ (Authenticode, 연 수십만 원) | ✓ | ✓ |
| 서명 없을 때 첫 실행 | 경고 없음 | SmartScreen 경고 | SmartScreen 경고 | SmartScreen 경고 |
| 오프라인 | ✓ | ✓ | ✓ | ✓ |
| 규정 갱신 | 파일 재배포 | 서명된 업데이트(서버 필요) 또는 규정 팩 | 같음 | 같음 |
| 개발 비용 | 0 | 낮음(HTML 그대로 `frontendDist`) | 중간 | 매우 큼(rhwp가 WASM·Rust라 다시 붙여야 함) |
| 맥·리눅스 | ✓ | 빌드마다 따로 | ✓ | ✗ |

### 5-3. 판정과 최소 비용 경로
1. **지금은 단일 HTML을 유지합니다.** F-1~F-6과 F-8을 고치면 HTML의 보안 약점은 "저장소 공유"와 "무결성" 두 가지로 줄어듭니다.
   - 저장소 공유 대책: 사용자 데이터를 검증·이름공간으로 분리하고(F-1, F-3), 사용자 학회는 기본적으로 "가져오기 파일"로만 쓰게 합니다. 영구 저장은 선택입니다.
   - 무결성 대책: 빌드할 때 SHA-256을 출력하고 배포 공지(학회 메일, 개인 홈페이지, GitHub Releases)에 함께 적습니다. 화면 하단에도 빌드 해시 앞 12자를 보여 줘서 사용자가 대조할 수 있게 합니다.
2. **규정 갱신은 "규정 팩"으로 분리합니다.** `journals.js`를 별도 JSON(수십 KB)으로 떼어 내고, HTML에 내장한 공개키로 서명을 검증한 뒤에만 덮어씁니다(WebCrypto ECDSA P-256. 오프라인에서도 검증 가능). 19 MB 본체는 엔진(rhwp)을 올릴 때만 다시 배포합니다.
   ```js
   const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, PUBKEY, sigBytes, packBytes);
   if (!ok) throw new Error('규정 팩 서명이 맞지 않습니다');
   ```
3. **프로그램이 필요해지면 Tauri 2로 감쌉니다**(학과 단위 보급, 파일 연결 `.hwp → 투고틀로 열기`, 저장소 격리가 필요할 때). `dist/투고틀.html`을 그대로 `frontendDist`로 쓰고, 저장은 `@tauri-apps/plugin-dialog`/`plugin-fs` 두 개로 `showSaveFilePicker`를 대체합니다. Windows 10/11에 기본 탑재된 WebView2를 쓰므로 런타임을 따로 받을 필요가 없습니다. 코드 서명 인증서가 없다면 SmartScreen 경고 때문에 오히려 HTML보다 사용성이 나빠지므로, **서명 예산이 생길 때** 전환하십시오. Electron(용량)과 WPF(재작성)는 이점에 비해 비용이 맞지 않습니다.

---

## 6. 실행 명령과 수치 (재현 방법)

모든 스크립트는 `D:\project\투고틀`에서 실행합니다. `src/`를 읽기 전용으로 가져다 쓰고, 산출물은 `tests/audit_opus/out/`에만 씁니다.

| 목적 | 명령 | 핵심 수치 |
|---|---|---|
| 9×5 변환 | `node tests/audit_opus/convert_audit.mjs tests/원고/<파일> koli,iall,kochih,koreacontents,ricc --quiet` | 35건 누락 0·각주 불일치 0, 대형 원고 미완료 |
| 극단 입력 생성 | `node tests/audit_opus/gen_inputs.mjs` | 입력 20종 |
| 극단 입력 실행 | `node tests/audit_opus/run_all.mjs "empty\|spoof\|ctrl\|quad" koli 120` | §4-2 표 |
| 단일 입력 | `node tests/audit_opus/run_one.mjs <파일> [학회]` | 단계별 ms, RSS, WASM MB |
| zip 폭탄 | `node --max-old-space-size=4096 tests/audit_opus/bomb_probe.mjs tests/audit_opus/inputs/bomb_1gb.docx` | 5.0 s, 1,257 MB |
| SVG 주입 | `node tests/audit_opus/svg_xss.mjs` | 원시 태그 0, 바탕틀 20개 SVG에 script·on*·외부 href 0 |
| 하이퍼링크 | `node tests/audit_opus/hyperlink_probe.mjs` | `<a>` 출력 0 |
| HWP 스트림 | `node tests/audit_opus/cfb_scan.mjs templates forms tests/audit_opus/out` / `cfb_scripts.mjs` | 스크립트 모두 기본 빈 것, OLE 0 |
| 메타데이터 | `node tests/audit_opus/summary_info.mjs <원고> <바탕틀> <산출>` | 산출물 요약 정보 비어 있음 |
| 퍼징 | `node tests/audit_opus/fuzz_hwp.mjs tests/원고/paper5.hwp 60 7` | 패닉 0 / 100 |
| 여러 구역 각주 | `node tests/audit_opus/multisection_fn.mjs` | iall·kochih 열기 실패 |
| 규모 | `node tests/audit_opus/scaling.mjs` | recognize O(n²), reorder 13만에서 스택 오버플로 |
| 배치 모드 효과 | `node tests/audit_opus/batch_mode_bench.mjs 100,200 nobatch,batch` | 2180→98 ms, 9134→241 ms |
| 메모리 누수 | `node tests/audit_opus/leak_test.mjs ../원고/paper4.hwp 10 iall` | free 없을 때 회당 약 0.1 MB |
| 프로토타입 오염 | `node tests/audit_opus/proto_pollution.mjs` | 전역 오염 없음 |
| 빌드 산출 HTML | `node tests/audit_opus/html_inspect.mjs` | script 37/37, CSP 없음, http 링크 30 |
| 브라우저 | `node tests/audit_opus/serve.mjs` 뒤 `http://localhost:8765/dist/투고틀.html` | F-1·F-2·F-3 재현, 로드 0.5~0.9 s, paper2→koli 21.9 s |

측정 환경: Windows 11 Pro, Node 25.4.0, Chromium 152(Claude 브라우저 패널). 측정하는 동안 같은 PC에서 다른 작업(`tools/batch.mjs` 4개 프로세스)이 함께 돌았으므로 절대 시간은 10~30% 부풀었을 수 있습니다. 그래도 증가 비율(O(n²))은 그대로 성립합니다.

---

## 7. 권고 우선순위

| 순위 | 조치 | 해결하는 발견 | 예상 공수 |
|---|---|---|---|
| P0 | 저장소 값 검증, 안전 부팅, 초기화 버튼 | F-1, F-2 | 반나절 |
| P0 | 내장 id·바탕틀 키 이름공간 분리, `https:`만 허용, 내장 `http://` 30곳 교체 | F-3, F-4 | 반나절 |
| P0 | `beginBatch/endBatch` 적용, `recognize` O(n), reorder 스프레드 제거 | F-6 | 2시간 |
| P0 | 여러 구역 각주 파싱 수정 + 회귀 시험(iall·kochih 바탕틀을 원고로) | F-8 | 2시간 |
| P1 | 변환을 Web Worker로, 진행률·취소 버튼 | F-6 | 1~2일 |
| P1 | DOCX 선형 파싱, 크기·개수 상한, 파일 크기 50 MB 상한 | F-7, F-9 | 반나절 |
| P1 | CSP 메타(해시 기반), 빌드 해시 출력·공지, `__tugotl` 제거 | F-5, F-13 | 2시간 |
| P2 | 규정 팩 분리 + 서명 검증 | 배포·갱신 | 1~2일 |
| P2 | SVG를 `<img src=blob:>`으로 렌더링(심층 방어) | F-13 | 1시간 |
| P2 | `lsSet` 실패 표시, IndexedDB 전환, `clearResult()`, 한국어 오류 메시지 | F-10, F-11, F-13 | 반나절 |
| P2 | 서식·바탕틀 `_LinkDoc` 정리, 정오표 붉은 표시 기본값 재검토 | F-12, F-13 | 2시간 |
| P3 | (서명 예산이 생기면) Tauri 2 래퍼 | F-3 근본 원인, 무결성 | 2~3일 + 인증서 |
