# 3차 감사 — B. 기능 결함 (opus_func)

감사 대상: `main` HEAD `9195a72`(감사 도중 `6f87207`→`9195a72`로 바뀜, origin/main은 아직 `0a6a290`). 배포본 `release/투고틀.html` SHA-256 `8cd956bd…a427e`.
방법: `python -m http.server 8787 --bind 127.0.0.1`(저장소 루트)로 `dist/dev.html`·`release/투고틀.html`을 띄워 내장 브라우저에서 실제 조작(`window.__tugotl` 훅 + DOM 이벤트), 부족한 부분은 node로 함수 수준 재현. 작업 파일은 모두 `tests/audit_opus_func/`.

## 요약

**점수: 78/100**

판정: 핵심 흐름(드롭→적용→미리보기→저장, 지연 미리보기, 손상 파일 오류 문구, CSP, 빌드 재현)은 단단하다. 다만 **학회 데이터 6곳의 규정값 서식이 중복 키로 죽어 있고**, **사용자 학회(가져오기·빈 양식) 경로가 실제 변환에서 실패**하며, **4 KB짜리 DOCX 하나로 탭이 3분 가까이 멈춘다**. 도움말이 `p is not defined`로 중간에 끊기던 결함은 감사 중 `9195a72`에서 고쳐졌음을 확인했다.

### 95점에 이르기 위해 고쳐야 할 것 (우선순위)
1. **B-1** `journals.js` 중복 키: 6개 학회(dgukoli·kll·humancontents·eomunhak·bangyo·kdrama)의 실측 `format`이 뒤의 `format: null`에 덮여 일반 양식(A4)으로 나간다. 중복 키 제거 + 빌드에서 경고를 오류로.
2. **B-2** 바탕틀 지정만 있고 바탕틀 바이트가 없는 학회(‘빈 양식’ 그대로 저장, 바탕틀 없이 고친 내장 JSON, 부분 `format`)는 rhwp 오류 `charPrIDRef: [0]`로 변환 실패. `engine.js` 폴백 조건을 바이트 기준으로, 부분 `format`은 `GENERIC_FORMAT`에 병합.
3. **B-3** 배포본에서 ‘가져오기’한 바탕틀이 다시 열기 전까지 적재되지 않는다(`loadAssets` 재호출이 실패). 가져온 학회는 ‘일반’으로 표시되고 적용은 B-2 오류로 실패.
4. **B-4** ‘가져오기’가 기존 사용자 학회·바탕틀 전부를 확인 없이 덮어쓴다(20곳 → 1곳).
5. **B-5** DOCX `findClose`가 중첩 깊이에 대해 O(depth·n): 4 KB DOCX(같은 이름 요소 20만 겹)로 주 스레드 174초 정지. 위치 캐시 패치로 16.8 ms.
6. **B-6** `runConvert`에서 `finalizeBlocks()`가 try 밖이라, 검증을 통과한 사용자 JSON(`pageBreakBefore: 5`, `references.rules: "x"`)으로 TypeError → 상태 표시줄이 ‘적용 중…’에 멈추고 안내 없음. 같은 데이터로 ‘각주·참고문헌’ 탭 렌더도 깨진다.
7. **B-7** 사이드바 ‘다음 마감’이 내장 52곳 중 12곳에서 지난 날짜(‘지남’)를 보여 준다.
8. **B-8** 공고 붙여넣기 파서: 입력란 placeholder 예시조차 발간일을 못 찾고, ‘9월 1일 ~ 10월 31일’ 같은 범위는 시작일을 마감으로 넣는다(8건 중 2건 통과).
9. **B-9** 성능 상한: 문단 상한 6만은 생성 시간 기준으로 너무 크다(5천 문단 5초, 2만 20초, 5.9만 125초 이상, 모두 주 스레드 정지).
10. **B-10~B-12** 설정 팝업이 토글마다 닫히고 포커스가 body로, 역할 변경 때 목록 스크롤 0으로 복귀, 학회를 바꾸면 수동 역할 지정이 말없이 사라진다. 학회 추가 ‘저장’ 성공 문구가 보이지 않는다.

---

## 발견 (중요도순)

### B-1 [높음] 학회 6곳의 실측 규정값 서식이 중복 키 `format: null`에 덮임
- 위치: `src/journals.js` 462↔491(dgukoli 한국문학연구), 646↔675(kll 어문논집), 686↔714(humancontents 인문콘텐츠), 843↔871(eomunhak 어문학), 939↔968(bangyo 반교어문연구), 1104↔1133(kdrama 한국극예술연구). mkliterature(390↔413 등 15개 키)도 블록이 통째로 중복되어 앞쪽 `fees.join/annual`, `review`, `anonymize` 등이 사라진다.
- 재현: `node tools/build.mjs` → esbuild 경고 `Duplicate key "format"` 6건 포함 21건. `node -e "import('./src/journals.js').then(m=>console.log(m.JOURNALS.filter(j=>!j.template&&!j.format).map(j=>j.id)))"` → `mkliterature novel dgukoli hanmun kll humancontents eomunhak bangyo kdrama`.
- 기대: 커밋 `6f87207` 설명대로 “학술지 조판 실측으로 일반 양식 8곳 규정값 서식 신설” → 위 6곳은 153×225 mm 등 실측 판형·글꼴로 산출.
- 실제: 객체 리터럴의 뒤 키가 이겨 `format === null` → `GENERIC_FORMAT`(A4)로 산출. `docs/검증매트릭스`도 이 6곳을 ‘일반’으로 대조해 ✓라서 결함이 드러나지 않았다(검증이 데이터 자체를 기준으로 삼는 한계).
- 수정안: 6곳의 `format: null,` 줄 삭제, mkliterature 앞 블록과 뒤 블록을 합침. 빌드가 경고를 오류로 다루게 한다.
```js
// tools/build.mjs
const res = await build({ ..., logLevel: 'warning', logOverride: { 'duplicate-object-key': 'error' } });
```

### B-2 [높음] 바탕틀 바이트가 없는 사용자 학회·부분 `format`이면 적용이 rhwp 내부 오류로 실패
- 위치: `src/engine.js:121`, `src/engine.js:226` `const fmt = journal.format || (journal.template ? null : GENERIC_FORMAT);`
- 재현(배포본, 브라우저): ‘학회 추가’에서 입력란을 비운 채 ‘저장’(placeholder 샘플이 저장됨, 샘플에 `template` 포함) → 투고처 ‘○○연구’ → TXT 원고 → 적용. 또는 `{"id":"mini2","journal":"x","format":{"font":"바탕"}}`, `{"format":{"page":{"width":210}}}`, `page` 값이 전부 0인 `format`.
- 기대: 바탕틀이 없으면 일반 양식(또는 규정값을 일반 양식에 덮어쓴 서식)으로 산출. 사이드바도 ‘일반’이라고 표시한다.
- 실제: `적용 실패: 렌더링 오류: XML 쓰기 실패: 미등록 ID 참조 발견: charPrIDRef: [0]`(alert + 상태 표시줄). 시험한 8개 변형 중 4개 실패(mini2·mini3·mini6·mini8), 바탕틀 없는 ‘빈 양식’ 샘플·가져오기 직후 학회도 같은 오류.
- 수정안:
```js
// engine.js (두 곳 모두) — 바탕틀 바이트 기준으로 폴백, 규정값은 일반 양식 위에 덮어쓴다
const merge = (a, b) => { const o = { ...a }; for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a?.[k] && typeof a[k] === 'object' ? merge(a[k], v) : v; return o; };
const fmt = journal.format ? merge(GENERIC_FORMAT, journal.format) : (templateBytes ? null : GENERIC_FORMAT);
```
  `sanitizeFormat`에서 `page.width/height`가 50 미만이면 `page`를 버리고, UI에서 `j.template && !templateBytes(j)`이면 “바탕틀 파일이 없어 일반 양식으로 만듭니다” 안내.

### B-3 [높음] 배포본에서 가져온 바탕틀이 다시 열기 전까지 쓰이지 않음
- 위치: `src/app.js:598`(가져오기 핸들러의 `await loadAssets().catch(() => {})`), `src/app.js:95`(`inline.remove()`), `:98`(`window.TUGOTL_ASSETS.wasmUrl`).
- 재현(배포본): `koli` JSON을 id `mytest`, `template.file: 'mytpl'`로 바꾸고 `templates.mytpl`에 바탕틀 base64를 넣은 JSON을 ‘가져오기’ → “학회 1곳, 바탕틀 1개를 가져왔습니다” → 투고처 ‘테스트학보’.
- 기대: 바탕틀 학회로 표시·변환.
- 실제: `state.templates.mytpl` 없음, 사이드바 ‘일반 · …’, 그룹 수 ‘일반 양식 (10)’, 적용은 B-2 오류. 새로 고침 뒤에야 ‘바탕틀’. 원인: 두 번째 `loadAssets()`는 인라인 WASM 태그가 이미 지워져 `window.TUGOTL_ASSETS`(배포본에 없음)를 읽다 TypeError → `.catch(() => {})`가 삼켜 사용자 바탕틀 적재 줄에 도달하지 않음. dev.html에서는 재현되지 않는다(외부 WASM을 다시 받음).
- 수정안: 사용자 바탕틀 적재를 분리해 호출.
```js
async function loadCustomTemplates() { for (const [k, v] of Object.entries(sanitizeTemplates(lsGet(LS.templates, {})))) { try { state.templates[k] = await b64ToBytes(v); delete state.templateInfo[k]; } catch {} } }
// loadAssets() 끝: await loadCustomTemplates();
// 가져오기: await loadAssets().catch(() => {});  →  await loadCustomTemplates();
```

### B-4 [높음] ‘가져오기’가 기존 사용자 학회·바탕틀을 확인 없이 전부 덮어씀
- 위치: `src/app.js:598` `lsSet(LS.journals, js)`, `lsSet(LS.templates, ts)`.
- 재현: 사용자 학회 20곳 저장 → `{"journals":[{"id":"newone","journal":"새 학회"}]}` 가져오기 → 저장소에 `newone` 하나만 남음(바탕틀도 전부 삭제). 확인 창 없음.
- 기대: 병합(같은 id만 교체) 또는 “기존 N곳을 지우고 바꿀까요?” 확인.
- 수정안:
```js
const prevJ = (lsGet(LS.journals, []) || []).filter((c) => c && !js.some((n) => n.id === c.id));
const mergedJ = [...prevJ, ...js]; const mergedT = { ...sanitizeTemplates(lsGet(LS.templates, {})), ...ts };
if (prevJ.length && !confirm(`기존 사용자 학회 ${prevJ.length}곳은 유지하고 ${js.length}곳을 추가·교체합니다. 계속할까요?`)) return;
const ok1 = lsSet(LS.journals, mergedJ); const ok2 = ok1 && lsSet(LS.templates, mergedT);
```

### B-5 [중상] DOCX 스캐너 `findClose`의 2차 시간 — 4 KB 파일로 탭 정지
- 위치: `src/parse.js:119-129`. 매 반복마다 `src.indexOf(close, i)`가 같은 먼 위치까지 다시 훑는다.
- 재현: `node tests/audit_opus_func/mkdocx.mjs`·`mknest.mjs`로 생성. node `docx_perf.mjs`: 중첩 `<w:r>` 2,000겹 34 ms → 8,000겹 335 ms(4배 깊이에 10배 시간), 200,000겹(`deep_nest.docx`, 4,269바이트) 60초 시간 초과. 브라우저(dev.html) `openFile` 174,462 ms 동안 주 스레드 정지.
- 기대: 상한 안 입력은 선형 시간.
- 수정안(동일 결과 확인, `tests/audit_opus_func/findclose_fix.mjs`: 32,000겹 현행 4,718 ms → 수정 1.7 ms, 200,000겹 16.8 ms):
```js
const findClose = (src, tag, from) => {
  const open = '<' + tag; const close = '</' + tag + '>'; let depth = 1; let i = from; let a = -2, b = -2;
  while (depth > 0) {
    if (b !== -1 && b < i) b = src.indexOf(close, i); if (b < 0) return -1;
    if (a !== -1 && a < i) a = src.indexOf(open, i);
    if (a >= 0 && a < b) { if (isTagEnd(src[a + open.length] || '')) { const gt = src.indexOf('>', a); if (gt < 0) return -1; if (src[gt - 1] !== '/') depth++; i = gt + 1; } else i = a + open.length; continue; }
    depth--; i = b + close.length;
  }
  return i - close.length;
};
```
  추가로 압축 해제 크기는 `f._data.uncompressedSize`(중앙 디렉터리 값, 위조 가능)만 보므로, `f.async('uint8array')` 대신 스트림(`internalStream`)으로 받아 누적 길이가 상한을 넘으면 중단하는 편이 안전하다.

### B-6 [중간] 적용 예외가 처리되지 않아 ‘적용 중…’에 멈춤 + 검증 빈틈
- 위치: `src/app.js:416` `finalizeBlocks()`가 try 밖. `:409` `j.pageBreakBefore.includes`, `src/errata.js:59` `journal?.references?.rules?.some`, `src/app.js:472` `li(arr)`.
- 재현: 학회 추가에 `{"id":"pb1","journal":"x","pageBreakBefore":5}` / `{"id":"rf","journal":"x","references":{"order":5,"rules":"x"}}` 저장 → 적용.
- 실제: `TypeError: j.pageBreakBefore.includes is not a function` / `journal2?.references?.rules?.some is not a function`이 unhandled rejection, 상태 표시줄 ‘적용 중…’ 고정, 알림 없음. `rules`가 문자열이면 ‘투고 양식 및 규정 확인 → 각주·참고문헌’ 탭도 `(arr || []).map is not a function`으로 반쯤 그려진다(v1·rf).
- 수정안: `runConvert` 본문 전체를 try로 감싸고, `sanitizeJournal`에 배열 필드 검증 추가.
```js
for (const [k, sub] of [['footnote', 'rules'], ['references', 'rules']]) if (c[k] && c[k][sub] !== undefined && !(Array.isArray(c[k][sub]) && c[k][sub].every((x) => typeof x === 'string'))) delete c[k][sub];
if (c.pageBreakBefore !== undefined && !(Array.isArray(c.pageBreakBefore) && c.pageBreakBefore.every((r) => typeof r === 'string'))) delete c.pageBreakBefore;
for (const [k, sub] of [['footnote', 'pageUnit'], ['footnote', 'example'], ['references', 'order']]) if (c[k] && c[k][sub] !== undefined && typeof c[k][sub] !== 'string') delete c[k][sub];
const li = (arr) => h('ul', {}, ...(Array.isArray(arr) ? arr : []).map((x) => h('li', {}, String(x))));
```

### B-7 [중간] 사이드바 ‘다음 마감’이 지난 날짜를 고른다 (12/52)
- 위치: `src/app.js:127-142` `nextDeadlines` — `upcoming`·사용자 입력의 지난 항목을 거르지 않고 날짜순 정렬해 `[0]`을 씀.
- 재현(2026-10-13): 투고처를 차례로 고르면 eastasia `2026-10-05 · 지남`, koreanst `09-30`, korliter `09-19`, postcriticism `08-17`, kll `2026-02-28`, klc, aagcc, urilit, iall, korlit, kdrama, kslt — 12곳이 ‘지남’. ‘투고 일정’ 표 168행 중 12행이 지난 행으로 맨 위.
- 수정안: 지난 명시 항목은 정기 마감을 막지 않고, ‘다음’은 오늘 이후 첫 항목.
```js
const future = (d) => d.date >= t0;
// upcoming/user 반복에서: if (new Date(u.deadline) < t0) { past.push(...); continue; }
// renderSide: const nd = nextDeadlines(j).find((d) => daysLeft(d.date) >= 0);
```

### B-8 [중간] 공고 붙여넣기 파서 `parseCallText` (2/8 통과)
- 위치: `src/app.js:450-458`. 재현: `node tests/audit_opus_func/callparse.mjs`.

| 입력 | 기대 | 실제 |
|---|---|---|
| placeholder 예시 “제80집 … 투고 기한 2026년 10월 31일 … 12월 31일 간행” | 발간 2026-12-31 | 발간 없음(연도 없는 날짜 무시) |
| “접수 기간: 2026년 9월 1일 ~ 10월 31일, 발간 2026년 12월 30일” | 마감 10-31 | 마감 **09-01** (브라우저에서도 확인) |
| “투고 시작 2026.09.01 / 투고 마감 2026.10.31” | 마감 10-31 | 마감 09-01 (‘투고’ 키워드가 시작일에 걸림) |
| “투고 마감 2026년 2월 30일” | 없음 | 안내문 “찾음: 마감 2026-02-30”, 날짜 칸은 빈칸 → ‘마감 추가’ 누르면 “마감일은 필수” |
| “심사 결과 통보 2026년 11월 20일, 투고 마감 …” | 발간 없음 | 발간 11-20(아무 날짜나 발간으로) |
| “제27권 제3호”, “마감 26.10.31” | 27권 3호 / 10-31 | ‘제27권’ / 못 찾음 |
- 수정안: (1) 연도 없는 `M월 D일`·`M.D`는 앞 날짜의 연도를 이어받기, (2) `A ~ B` 범위는 B를 후보로, (3) 키워드 가중치 `마감|기한|까지` > `접수|투고`, ‘시작’이 앞에 있으면 제외, (4) `isoDate`로 실재 날짜만, (5) 발간은 발간 키워드가 있을 때만 채움, (6) 호수는 `/제?\s*\d+\s*권(\s*제?\s*\d+\s*호)?|제?\s*\d+\s*(집|호)/`.

### B-9 [중간] 대용량 원고: 상한과 처리 시간이 맞지 않음, 주 스레드 정지
- 측정(브라우저 dev.html, 동악어문학): TXT 5,000문단(36만 자) 열기 752 ms·적용 5,086 ms·393쪽, 이후 **역할 하나 바꾸거나 탭을 바꿀 때마다 전체 다시 그리기 724 ms**. DOCX 20,003문단 열기 2,885 ms·적용 23,952 ms·1,539쪽. node 생성 시간: 20,003문단 13.6초, 59,003문단 **125초**(문단 3배에 9배 — 생성 단계가 2차적). 모두 주 스레드에서 돌아 그동안 화면이 멈춘다.
- TXT는 빈 줄도 문단으로 세어 실제 3만 문단(224만 자)이 “6만 개를 넘는 원고”로 거부된다. `MAX_TEXT*2` 바이트 검사라 한글 원고는 실제로 약 400만 자에서 막히는데 문구는 ‘6,000,000자’.
- 수정안: (1) `MAX_PARAS`를 1.5만 정도로 낮추거나(학술 논문 최대치의 10배 이상) Worker로 이전, (2) TXT 상한은 비지 않은 줄만 세기, (3) 바이트 상한 문구를 “약 12 MB” 식으로, (4) 구조 표는 보이는 행만 그리거나 역할 변경 시 해당 행만 갱신(아래 B-11과 함께).

### B-10 [중간·접근성] 설정 팝업이 토글마다 닫히고 포커스를 잃음
- 위치: `src/app.js:226-227` `seg`/`chk`의 `render()`.
- 재현: 원고 적용 뒤 ‘설정’ → 아무 체크 상자 클릭 → `.pop` 사라짐, `document.activeElement === body`. Esc로도 닫히지 않고, 열 때 포커스가 팝업 안으로 가지 않음(`role="dialog"`만 있음).
- 수정안: 설정 변경은 팝업을 유지한 채 상단 버튼만 갱신(`state.dirty` 표시는 `applyBtn.textContent` 갱신)하거나, `render()` 뒤 팝업을 다시 열고 포커스를 같은 컨트롤로 되돌린다. Esc 키 닫기와 첫 컨트롤 포커스 추가.

### B-11 [중간] 역할 수정·학회 변경의 작업 손실
- (a) 역할 변경 시 구조 표 스크롤이 0으로, 포커스가 body로(재현: paper4, 아래에서 셋째 행 역할 변경 → `scrollTop 1436 → 0`). 400문단 원고에서 역할 여러 개를 고치기 어렵다. 위치 `src/app.js:246`.
- (b) 투고처를 바꾸면 `recompute(true)`가 수동 지정 역할을 말없이 버린다(재현: 역할 하나 ‘제외’로 → 동악→한국문예창작 전환 → 수동 지정 1→0). 위치 `src/app.js:672`.
- 수정안: (a) 변경 행의 `class`만 바꾸고 `state.dirty` 표시만 갱신(전체 `render()` 대신), 불가피하면 `.struct`의 `scrollTop`과 포커스 인덱스를 저장·복원. (b) 수동 지정이 있으면 “직접 고친 역할 N개를 새 학회 인식으로 덮어쓸까요?” 확인, 또는 `b.auto === false`인 블록의 역할을 문단 위치 기준으로 보존.

### B-12 [중하] 학회 추가 ‘저장’ 성공 문구가 보이지 않음
- 위치: `src/app.js:589` `msg.textContent = …저장됨…; render();` — `render()`가 화면을 새로 만들어 문구 요소가 사라진다(재현: 저장 후 `.small.ok` 없음). 입력란도 비워진다.
- 수정안: `state.manageMsg`에 담아 `renderManage`가 그리게 하거나 `setStatus(\`‘${j.journal}’ 저장됨\`, 'ready')`.

### B-13 [중하] ‘내장 학회 JSON 불러와 고치기’가 바탕틀 학회에서 막다른 길
- 재현: 내장 바탕틀 학회(예: dongak) 불러오기 → id를 바꿔 저장 → “바탕틀 키 ‘dongak’는 내장 바탕틀과 겹칩니다”. 키를 바꾸면 바탕틀 파일을 다시 넣어야 하고, 안 넣으면 B-2 실패.
- 수정안: 사용자 학회가 내장 바탕틀을 **읽기 전용으로 참조**하는 것은 허용(덮어쓰기만 금지). `sanitizeJournal`에서 `BUILTIN_TPL.has(file) && !tplBytesProvided`이면 그대로 두고, 저장 시 `LS.templates`에 내장 키를 쓰는 것만 막는다.

### B-14 [낮음] 입력 형식 판별
- 바이너리를 `.txt`로 열면 그대로 받아들인다: paper2.hwp를 `b.txt`로 → 756문단의 깨진 글자, 경고 없음. 수정안: NUL·U+FFFD 비율이 1%를 넘으면 “텍스트 파일이 아닙니다(HWP/DOCX라면 확장자를 확인)”.
- DOCX를 `.hwp`로 열면 “암호·배포용 문서는 지원하지 않습니다”가 앞에 붙어 원인을 오도한다. 시그니처(`PK\x03\x04` → DOCX/HWPX, `D0 CF 11 E0` → HWP)로 확장자 불일치를 먼저 알린다.
- `accept`에 `.hml`이 있으나 최소 HWPML 표본은 `UNSUPPORTED_FILE_FORMAT`(1.1초). 지원 근거가 없으면 목록에서 뺀다.
- 정상 처리 확인: 빈 파일·잘린 HWP/HWPX/DOCX·무작위 바이트·PDF는 모두 한국어 오류로 즉시 거부(1~6 ms), UTF-16 BOM·EUC-KR TXT는 올바르게 디코딩, 48 MB 초과 XML은 8 ms에 거부.

### B-15 [낮음] localStorage 경계
- `tugotl.options`를 검증 없이 병합(`src/app.js:84`): `{"cite":"bogus","reorder":"no","toc":0}` → 서지 양식 버튼 아무것도 선택 안 됨, 문자열 `"no"`가 참으로 재배열 켜짐. 수정안: `cite`는 `CITE_STYLES` id만, 나머지는 `typeof === 'boolean'`만 받기.
- `tugotl.schedule`이 `null`이면 ‘마감 추가’가 `Cannot read properties of null (reading 'dongak')`, 배열이면 저장이 조용히 사라진다(`JSON.stringify([])`가 이름 있는 키를 버림). 위치 `src/app.js:503`·삭제 버튼. 수정안: `const all0 = lsGet(LS.schedule, {}); const all = all0 && typeof all0 === 'object' && !Array.isArray(all0) ? all0 : {};`, 저장 결과 `lsSet` 반환값 확인.
- 사용자 바탕틀은 base64로 한 키에 몰아 저장한다. 이 브라우저는 1,400만 자까지 저장됐으나 일반 Chrome 할당(약 500만 자)에서는 2.6 MB 바탕틀 두 개째에서 실패한다. 실패 문구는 있음(`lsSet` 반환 확인). 시작할 때마다 전부 디코드하므로 큰 바탕틀이 많으면 시작이 느려진다 — IndexedDB 이전을 권장.
- ‘사용자 데이터 초기화’는 다섯 키를 모두 지우고 정상 재시작(확인).

### B-16 [낮음] CSP·링크
- 배포본 CSP 동작 확인: 같은 출처 `fetch('/README.md')`·외부 `fetch` 모두 차단, `blob:`·`data:` 허용. 원고에 `<img onerror>`·`<svg onload>`·`<script>`·`javascript:` 링크를 넣은 MD를 변환·미리보기해도 실행 0회(rhwp SVG가 글자를 이스케이프).
- 다만 `script-src 'unsafe-inline'`은 인라인 이벤트 처리기까지 허용한다. 미리보기는 `innerHTML`로 rhwp SVG를 넣으므로(`src/app.js:297`, `:536`) rhwp 이스케이프가 유일한 방어선이다. 배포본에서 실행되는 인라인 스크립트는 앱 번들 하나뿐이니 해시로 바꿀 수 있다.
```js
// tools/build.mjs — prod 조립 뒤
const h = createHash('sha256').update(js).digest('base64');
prod = prod.replace("script-src 'unsafe-inline'", `script-src 'sha256-${h}'`);
```
- 정오표 검색 링크(`src/app.js:332`)와 사이드바 rhwp 링크(`src/index.html:33`)는 `rel="noopener"`만 있음 → `noopener noreferrer`로 통일.

### B-17 [낮음·접근성]
- 탭(`role="tab"`)에 `aria-controls`·`role="tabpanel"`이 없고 화살표 키 이동이 없다(변환 화면 5개, 학회 화면 6개).
- 미리보기 SVG에 이름이 없다 → `svg.setAttribute('role','img'); svg.setAttribute('aria-label', \`${next+1}쪽 미리보기\`)`.
- 학회 추가의 바탕틀 파일 입력에 레이블이 없다(`aria-label="바탕틀 파일"`).
- 오류를 `alert()`로만 알리는 곳(적용 실패·가져오기) — 상태 표시줄(`role="status"`)에도 같이 쓰므로 치명적이지는 않음.

### B-18 [참고] 배포본 무결성·빌드 재현
- `release/투고틀.html`·`dist/투고틀.html` SHA-256 = `8cd956bd9438e114c8bdffcaa0dd34559b412e84338ca3d08c94c4c4577a427e` = `release/투고틀.sha256`(HEAD `9195a72`). 줄 끝은 `.gitattributes eol=lf`로 작업 트리·블롭 모두 LF(CR 0개)라 GitHub에서 받은 파일과 해시가 같다.
- 빌드 재현: `tools/build.mjs`를 출력 경로만 바꾼 `tests/audit_opus_func/build_repro.mjs`에 `BUILD_STAMP="2026-10-13 09:30"`을 주면 배포본과 **바이트 단위 동일**(감사 시작 시점 `6f87207`도 `09:14`로 동일 재현). esbuild 0.25.0·@rhwp/core 0.8.7·jszip 3.10.1 = lock.
- 개선: 빌드 표기가 UTC인데 시간대 표기가 없고, 재현하려면 그 분 단위 시각을 알아야 한다. `SOURCE_DATE_EPOCH` 또는 `git log -1 --format=%cI`(커밋 시각)를 쓰고 표기에 `UTC`나 커밋 해시를 넣으면 누구나 재현할 수 있다.
- 감사 시점 HEAD `9195a72`는 origin/main(`0a6a290`)에 아직 푸시되지 않았다(운영규정 4·5항).
- 같은 커밋의 개인정보 삭제 치환이 문장을 깨뜨림: `src/journals.js` “계좌는 학회 공지 참조산학협력단”(eastasia), “계좌는 학회 공지 참조학회”(mkliterature) — C 감사 영역이지만 참고로 적는다.

### 해결 확인
- `6f87207`의 도움말 `p is not defined`(글꼴 절 이후 ‘글꼴·보안과 보관·라이선스와 감사의 말·문의’ 4절 누락, 콘솔 `ReferenceError`)는 `9195a72`에서 수정 — 배포본에서 12절 모두 그려지고 오류 0, 외부 링크 5개 모두 `http(s)`/`mailto`, 새 창 링크는 `noopener noreferrer`.
- 2차 지적의 저장 실패 원복·예약 키·URL 검증·복구 화면은 정상 동작.

---

## 실행한 명령과 수치

| 항목 | 명령·절차 | 결과 |
|---|---|---|
| 서버 | `python -m http.server 8787 --bind 127.0.0.1` (저장소 루트) | dev.html·배포본 모두 로드 |
| 배포본 시작 | 내장 브라우저, `performance` | DOMContentLoaded 418 ms, 엔진 준비 545 ms, 힙 51 MB, 바탕틀 19(감사 시작 시 20: 미사용 kcomplit, HEAD에서 제거됨)·서식 15 |
| 흐름 | paper1→동악어문학 적용 | 32쪽, 미리보기 지연 그리기 2쪽→스크롤 6회 14쪽 |
| | paper4→동악어문학 | 열기 147 ms, 적용 385 ms, 14쪽 |
| 손상 입력 13종 | `openFile`(빈·잘린·무작위·확장자 불일치·PDF·UTF-16·EUC-KR) | 모두 예외 없이 처리, 위 B-14의 3건만 문제 |
| 사용자 학회 17변형 | 학회 추가 저장 → 적용 / 학회 화면 6탭 렌더 | 적용 실패 5(B-2), 멈춤 2(B-6), 탭 렌더 실패 2(B-6) |
| 가져오기 | 배포본, 바탕틀 포함 JSON | 바탕틀 미적재(B-3), 기존 20곳 삭제(B-4) |
| 대용량 | TXT 5천·DOCX 2만/5.9만, `tests/audit_opus_func/conv_perf.mjs` | B-9 수치 |
| DOCX 중첩 | `mknest.mjs`, `docx_perf.mjs`, `findclose_fix.mjs` | 2천 34 ms / 8천 335 ms / 20만 겹 174 s(브라우저) → 수정안 16.8 ms |
| 일정 | 52곳 사이드바 순회, `callparse.mjs` | ‘지남’ 12곳, 파서 2/8 |
| XSS | 위험 태그를 담은 MD 변환·미리보기(배포본) | 실행 0, `foreignObject`·`script`·이벤트 속성 0 |
| CSP | 배포본에서 `fetch` 3종 | 같은 출처·외부 차단, blob 허용 |
| 빌드 재현 | `BUILD_STAMP="2026-10-13 09:30" node tests/audit_opus_func/build_repro.mjs` | SHA-256 동일(`8cd956bd…`), dev.html 동일, 중복 키 경고 21건 |
| 접근성 | 대화형 요소 이름 검사, 팝업 포커스·Esc | 이름 없는 요소 1(바탕틀 파일 입력), 팝업 포커스·Esc 미지원, tabpanel 0 |

작업 파일: `tests/audit_opus_func/` — `callparse.mjs`, `mkdocx.mjs`, `mknest.mjs`, `docx_perf.mjs`, `conv_perf.mjs`, `findclose_fix.mjs`, `build_repro.mjs`, `gen/`(생성 DOCX; 재빌드 산출물 `rebuild/`는 해시 확인 후 삭제).
주의: 내장 브라우저 탭을 다른 감사 에이전트와 함께 써서 두 번 탭이 다른 주소로 바뀌었다. 그 뒤 측정은 출처를 `127.0.0.1:8787`로 분리해 다시 했고, 5.9만 문단 적용 시간은 브라우저 대신 node로 쟀다.
