점수: 88/100

# ASTRA 4차 재감사 — 현재 main의 A·B 재검증

3차 F-01~F-11은 **해소 4, 부분 해소 5, 그대로 2**다. 실원고 5편·PDF 파싱본 40건을 koli·ricc·dongak에 적용한 HWP 135개와 HWPX 135개에서, 명시한 표지 문구 예외를 제외한 본문 글자·각주 글자·위치 불일치는 0이다. 그러나 DOCX 이름공간 정규화의 본문 변조, 익명화의 부제 삭제, 불완전한 사용자 서식 검증과 저장 실패 후 메모리 잔류가 있어 95점에 미달한다. 점수는 통과율이 아니라 위험도 판단(A 44/50, B 44/50)이다. 다른 감사의 8차 점수를 재사용하지 않았다.

## 95점에 이르기 위해 고쳐야 할 것

1. **P0:** `normalizeWml`의 XML 전체 문자열 치환을 이름공간·범위 인식 파싱으로 교체한다. 본문 문자열 변조와 혼합 접두사 누락을 막고 부분 손상도 명시적으로 거부한다(N-01).
2. **P1:** 익명화에서 이름 모양만으로 자동 삭제하지 않는다(F-02). 경고에 삭제 내용을 보여 주는 것은 내용 보존의 대체가 아니다.
3. **P1:** 사용자 서식을 필드별 타입·필수 구조로 검증하고, 바탕틀 저장은 두 저장소 쓰기 성공 뒤에만 메모리에 반영한다(N-03·04).
4. **P1:** HWPX 문단 길이/처리 시간 경계를 추가하고 파싱을 중단할 수 있게 한다(F-03). 48 MiB XML 총량 제한만으로 8,086바이트 파일의 약 19초 동기 실행을 막지 못한다.
5. **P2:** 문헌 분리 시 제목의 괄호·낫표 범위를 보호하고, 초록 첫 문장의 중첩 닫는 기호를 처리한다(N-05·06). 표만 있는 DOCX를 손상 문서로 오진하지 않는다(N-02).
6. **P2:** 엄격 비교를 제품 회귀 게이트에 편입한다(F-11). 보류한 범위 기호·낫표 좌표·자동 정렬은 지원 범위를 명확히 하거나 구현한다(F-08).

## 대상과 재현 조건

- 대상: `main`, HEAD `b642ee1`(8차 재감사 Opus 반영). `git log -5 --oneline`, `git branch --show-current`, `git status --short`로 확인했다. 시작 작업 트리는 깨끗했다. 전체 해시·복사 시각은 `tests/audit_astra/round4/manifest.json`에 있다.
- `brief_round3.md`를 추가 규칙 및 4~8차 안내까지 읽고, `review3_astra.md`, `response_round3_fidelity.md`의 ASTRA 3차 조치와 후속 표를 확인했다. 운영규정·기존 대응 기록·실데이터 검증·매트릭스·글꼴 안내·README도 검토했다.
- 남아 있던 round4 폴더를 이어 썼지만 **과거 결과를 현재 실행 결과로 간주하지 않았다.** `setup.mjs`로 현재 `src/`와 변환 도구 복사본을 갱신하고 아래 명령을 재실행했다. 엔진 import·자산·출력 경로만 감사 폴더에 맞췄다. 원본 src 로직은 수정하지 않았다.
- 과거 `checkpoint.mjs`는 round3 파일과 3차 보고서를 수정하므로 실행하지 않았다. 새 최종 확인기는 `final-check.mjs`다.
- 보호 대상 `src/`, `dist/`, `release/`, `templates/`, `forms/`, `README.md`는 수정하지 않았다. 새 임시 파일은 round4 아래에만 만들었다. 산출물·입력 복사본 이름은 paper1~5, pdf-01~40 등 번호만 사용했다. 원고를 외부로 전송하지 않았다.
- Node·vm으로 실제 앱 함수/콜백을 추출해 실행했다. 실브라우저·실제 한컴 조판은 **확인 못 함**. HWP/HWPX 재파싱은 제품과 같은 rhwp 엔진이므로 독립 판독기 검증과 같지 않다.

## F-01~F-11 재판정

명령의 공통 접두사는 `node tests/audit_astra/round4/`다. ‘해소’는 3차 재현 조건의 해소를 뜻하며 확장 경계까지 무결하다는 뜻은 아니다.

| 항목 | 판정 | 현재 실행 수치·근거 | 재현 스크립트 |
|---|---|---|---|
| F-01 DOCX 이름공간·손상 | **부분 해소** | 기존 단일 x 접두사: 1문단·8자 보존, 완전히 닫히지 않은 문단: 거부. 확장 XML 12조건 중 3통과·9실패(N-01·02) | synthetic.mjs, regressions.mjs |
| F-02 익명화 부제 삭제 | **그대로** | 저자 없는 짧은 부제 3자·1문단 제거. 연속 이름 후보가 있는 기존 대조군은 보존. 삭제 안내만 추가됨 | functional.mjs |
| F-03 HWPX 성능·읽기 전 제한 | **부분 해소** | 65 MiB 대역의 arrayBuffer 호출 1→0. XML 48 MiB 수용·+1바이트 거부. 320,000자/8,086바이트 입력은 여전히 수용, 19,279ms | functional.mjs, extra.mjs, regressions.mjs |
| F-04 사용자 서식·일정 | **부분 해소** | 빈 format 제거·일정 비정상 루트 4조건 예외 0·quota 안내 1. page 없는 유효 판정 format은 렌더 예외 1, 문자열 Infinity/NaN·불리언 수치·문자열 역할 통과 | ui-functions.mjs, ui-extended.mjs, regressions.mjs |
| F-05 빈 줄 | **해소** | 연속 빈 줄 2→2. body,blank,quote,source,blank,body: 출전 뒤 1줄 포함 | functional.mjs |
| F-06 한 글자 강조 | **해소** | MD 3조건 저장 HWP 재열기 통과: 1자 기울임·1자 굵게·2자 기울임 | extra.mjs |
| F-07 영문초록 첫 문장 | **해소** | 원래 28자 문장은 titleEn2→abstractEn. 추가 마침표+중첩 닫는 기호에서는 재현됨(N-06) | synthetic.mjs, additional.mjs |
| F-08 서지 치환·좌표·정렬 | **부분 해소** | 마침표로 이은 실제 국외 조각 p. 보존. 범위는 여전히 12~14쪽, half 옵션 각주 offset 기대 7/실제 5·강조 런 0, 정렬 미수행. 국내 제목 분리 2조건 실패(N-05) | functional.mjs, regressions.mjs, additional.mjs |
| F-09 저장 원복 | **부분 해소** | 추가 실패 후 디스크 바탕틀 0개. 편집 실패 후 디스크 2키 복구 true/true, 메모리 복구 false·캐시 복구 false | ui-functions.mjs, ui-extended.mjs |
| F-10 일정 | **해소** | 지난 마감 결과 0개, 비윤년 02-29 결과 0개(3월 1일로 보정하지 않음). 기준일은 재현 스크립트의 2026-10-13/2026-01-01 | functional.mjs |
| F-11 제품 검증 게이트 | **그대로** | 원래 34조건 21/13→31/3. 하네스의 불필요한 undefined 직접 호출 1건을 제외해 해석하면 32통과·2실패. 제품 convert/매트릭스는 여전히 엄격 전체 비교가 아님 | verdicts.mjs, batch.mjs, verify_matrix.mjs |

`verdicts.mjs`의 3개 실패는 부제 삭제, 낫표 좌표, 빈 format 직접 렌더다. 마지막 것은 `sanitizeJournal`이 format을 제거했는데 하네스가 `formatTable(undefined)`를 강제로 호출한 결과다. 실제 앱은 `if (j.format)`으로 호출을 막으므로 이 한 건을 제품 결함으로 세지 않았다. 별개로 **roles만 있고 page가 없는 format**은 실제 가드를 통과하며 N-03으로 남는다. 32/2는 이 수동 판정 보정값이며 원래 스크립트의 출력은 31/3 그대로 보존했다.

## 중요도순 재현 발견과 수정안

### N-01 — 이름공간 정규화가 본문을 바꾸고 정상 문단을 누락함

- 위치: `src/parse.js:153`, `src/parse.js:264`~`:277`, 부분 손상 검사 `src/parse.js:232`.
- 명령: `node tests/audit_astra/round4/regressions.mjs`.
- 기존 F-01을 확장해 확인한 결함이며, 현재 정규화 구현에서 발생한다. 실원고 45건은 HWP/TXT이므로 이 표본에서의 DOCX 영향은 **확인 못 함**. 가상 입력에서만 실측했지만, 파서의 본문 변조이므로 수정 우선순위는 P0로 둔다.
- 최소 ZIP 재현 12개에 Content Types와 패키지 루트 관계를 추가한 `package-check.mjs`에서도 **12/12 같은 결과**다. Word에서 직접 열어 저장하는 왕복 검증은 **확인 못 함**.

| 가상 조건 | 기대 | 실제 |
|---|---|---|
| w/x가 같은 URI인 혼합 문서 | 2문단·3자 | 1문단·1자, 경고 0 |
| w는 다른 URI, x는 WML | 1문단·2자 | 0문단, 경고 0 |
| 기본 이름공간 단독 | 1문단·2자 | 일치 |
| 기본 이름공간+x 혼합 | 1문단·2자 | 0문단, 경고 0 |
| 작은따옴표 xmlns:x | 1문단·2자 | 0문단, 경고 0 |
| 하위에서 x를 타 URI로 재바인딩 | WML 글자 1자 | 타 URI 글자 2자까지 합쳐 3자 |
| 기본 이름공간 본문 `가 key=값` | 7자 그대로 | `가 w:key=값`, 2자 삽입 |
| x 접두사 본문 `가 x:Value` | 본문 그대로 | `가 w:Value`, 1자 치환 |
| 정상 1문단 뒤 손상 문단 | 명시적 파싱 오류 | 앞 1문단만 반환, 경고 0 |

루트에서 첫 접두사만 선택하고, `w`가 있으면 조기 반환하며, 본문까지 포함한 전체 XML 문자열에 속성 모양 정규식을 적용한다. 기본 이름공간은 원래 접두사 없는 속성에 적용되지도 않는다. 수정은 추가 replace가 아니라 엄격한 XML 토큰화/이름공간 범위 처리여야 한다. 아래는 구현 계약 예시다(미구현 보조 함수 포함).

```js
const doc = parseXmlStrict(xml, { externalEntities: false });
const body = findElementNS(doc, WML_NS, 'body');
for (const p of bodyParagraphs(body, WML_NS)) {
  // 요소/속성의 namespaceURI와 localName으로 판정한다.
  // textContent는 이름공간 정규화 대상으로 삼지 않는다.
  paragraphs.push(readParagraphNS(p));
}
```

### N-02 — 문단 0 방어가 표만 있는 정상 DOCX를 손상으로 오진

- 위치: `src/parse.js:228`, `src/parse.js:232`.
- 명령: `node tests/audit_astra/round4/regressions.mjs` (`empty-p`, `empty-body`, `table-only`).
- 정상 빈 문단 `<w:p/>`는 1빈문단, 빈 body는 0문단으로 정상 반환: **2/2 통과**. 따라서 일반 빈 문서 전부를 막는다고 주장하지 않는다.
- 표 내부에만 빈 문단이 있는 문서는 표 제거 뒤 문단이 0인데 **제거 전 XML**에서 p 태그를 검사해 ‘문단 구조가 깨져 있습니다’ 오류를 낸다. 기대는 표 1개 미지원 경고와 본문 0개, 실제는 손상 오류 1개다. 가상 경계에서만 확인한 낮음 결함이다.
- 수정안: XML 정합성 오류와 지원 대상 본문 부재를 분리한다.

```js
validateXmlStrict(xml); // 손상 여부는 일부 문단 개수로 대신하지 않는다.
const bodyXml = stripUnsupported(xml);
const paras = elements(bodyXml, 'w:p');
// 빈 배열은 허용하고 제거한 표·그림 수를 warnings에 기록한다.
```

### F-02 잔존 — 익명화가 부제 3자를 삭제

- 위치: `src/app.js:390`~`:398`, 이름 판정 `src/structure.js`의 author 분기.
- 명령: `node tests/audit_astra/round4/functional.mjs` (`anonymous-subtitle-no-author`).
- 가상 입력 `긴 가상 제목 연구 / 문학성 / 1. 서론 / 가상의 본문이다.`에서 둘째 줄을 author로 판정해 제거한다. 기대 1문단·3자 보존, 실제 0. 조치표에서 인정한 잔존 한계이며 새로운 회귀로 세지 않았다.

```js
const isAuthorBlock = b => authorRoles.has(b.role)
  && (!b.auto || b.authorEvidence === 'explicit-metadata');
// 모양만으로 얻은 후보는 구조 표에서 사용자가 확정할 때까지 보존한다.
```

### N-03 — 사용자 서식의 필드 타입·필수 구조 검증은 여전히 불완전

- 위치: `src/app.js:58`~`:59`, `src/app.js:68`~`:77`, `src/app.js:549` 이후.
- 명령: `node tests/audit_astra/round4/regressions.mjs`, `node tests/audit_astra/round4/ui-extended.mjs`.
- 5개 format 조건 중 `{}`만 제거된다. `{roles:{body:{size:10}}}`은 살아남아 실제 호출 조건을 통과하지만 `f.page.width`에서 TypeError. 문자열 `Infinity`·`NaN`, width=true·height='oops'·size=false, body='oops'도 남는다. 숫자 꼴 문자열을 막는 정규식에 Infinity/NaN이 포함되지 않으며 키별 타입도 구별하지 않는다.
- 기대: 저장·읽기 단계에서 잘못된 format 거부 또는 명시 기본값 완성, 화면 예외 0. 실제: 렌더 예외 1, 부적합 타입 3조건 통과. 부적합 타입을 WASM에 넣었을 때의 결과는 **확인 못 함**.
- 일정 저장은 null·배열·숫자 항목 등 4조건에서 예외 0, quota 안내 정상. 다만 배열 안 `{}`·`{deadline:'bad'}` 2개가 저장 결과에 남는다. 현재 읽기 방어와 구별해 데이터 정제 미완료로 기록한다.

```js
const finite = (v, lo, hi) => typeof v === 'number'
  && Number.isFinite(v) && v >= lo && v <= hi;
if (!validPage(f.page) || !validRoleMap(f.roles)) return undefined;
// validPage/validRoleMap에서 숫자·문자열·열거형 필드를 각각 검증한다.
const list = userSchedule(j.id).filter(x => x.deadline !== fDl.value);
```

### N-04 — 저장소는 원복하지만 메모리 바탕틀·캐시는 원복하지 않음

- 위치: `src/app.js:594`~`:596`.
- 명령: `node tests/audit_astra/round4/ui-extended.mjs`.
- 실제 파일 선택 콜백 뒤 비동기 읽기가 완료되게 한 후 실제 저장 콜백에 학회 키 quota 실패를 주입했다. 준비본의 편집 검사는 파일 읽기를 기다리지 않아 거짓 통과했으므로 하네스에 한 이벤트 루프 대기를 추가했다. 제품 코드는 바꾸지 않았다.
- 추가: 기대 디스크/메모리 새 키 0/0, 실제 **0/1**. 편집: 디스크 학회·바탕틀은 모두 원복(true/true), 메모리는 새 바이트이고 원래 캐시도 삭제됨(false/false). 같은 세션에서 이후 변환이 저장되지 않은 새 바탕틀을 사용할 수 있는 상태다. 이후 실제 편집 변환의 조판 영향은 **확인 못 함**.

```js
// 먼저 저장소 두 값을 커밋하고, 실패하면 저장소만 원복한다.
if (!commitWithRollback(nextTemplates, nextJournals)) return;
// 메모리는 성공 뒤에만 변경한다.
state.templates[key] = tplBytes;
delete state.templateInfo[key];
loadJournals();
```

### F-03 잔존 — 해제량 검사는 유효하지만 긴 한 문단의 동기 점유는 유지

- 위치: `src/parse.js:28`, HWP 엔진 진입 부분, `src/app.js:openFile`.
- 명령: `node tests/audit_astra/round4/extra.mjs`, `node tests/audit_astra/round4/regressions.mjs`.

| 한 텍스트 노드 길이 | 파일 바이트 | 현재 파싱 시간 | 처리 |
|---:|---:|---:|---|
| 20,000 | 7,116 | 151ms | 수용 |
| 80,000 | 7,388 | 1,199ms | 수용 |
| 320,000 | 8,086 | 19,279ms | 수용 |

XML 총량 경계는 **50,331,648바이트 수용(113ms), 50,331,649바이트 거부(1ms)**. 두 ZIP은 각 55,327바이트이며 사용되지 않는 XML 항목으로 경계를 만들었다. 이 검사는 ZIP 메타데이터 합산 경계를 확인한 것이며 조작된 해제 크기 메타데이터에 대한 실제 해제량 검증은 **확인 못 함**. 시간은 다른 감사 작업과 겹친 Node 측정으로 브라우저 멈춤 시간이나 정확한 성능 회귀율로 해석하지 않는다.

```js
await checkXmlBudget(bytes, { maxTotalBytes, maxParagraphChars });
const worker = startParseWorker(bytes);
const timer = setTimeout(() => worker.terminate(), MAX_PARSE_MS);
try { return await worker.result; } finally { clearTimeout(timer); }
```

### N-05 — 국외 조각 분리가 국내 문헌 제목 내부를 잘못 자름

- 위치: `src/structure.js:243`, `src/structure.js:248`.
- 명령: `node tests/audit_astra/round4/additional.mjs`.
- 가상 국내 항목 `가가가, 『Synthetic. Smith, Study』, 2021, p. 33.`의 기대는 `33쪽`, 실제는 `p. 33.` 유지. 겹낫표·홑낫표 두 조건 **2/2 실패**. 제목 내부 `. Smith, `를 문헌 시작으로 쪼개 뒷조각의 한글 유무가 사라지는 것이 원인이다. 원래의 국내 항목+별도 국외 항목 대조군과 한글 번역서 대조군은 정상이다.
- 가상 원고에서만 확인한 낮음 결함이다. 원고 내용을 지운 사례는 아니지만 국내 규정 치환이 누락된다.

```js
// 괄호·낫표·인용부호 깊이가 0일 때만 문헌 구분 후보로 삼는다.
const segments = splitCitations(text, { respectQuotedTitles: true });
for (const seg of segments) renderPagesWithLanguage(seg);
```

### N-06 — 초록 문장 뒤 중첩 닫는 기호는 제목으로 분류

- 위치: `src/structure.js:129`.
- 명령: `node tests/audit_astra/round4/additional.mjs`.
- 가상 문장 `This is a synthetic summary.”)`의 기대 abstractEn, 실제 titleEn2. 문장부호가 있는 8조건 중 **7통과·1실패**. 마침표 없는 문장은 추가로 titleEn2가 되지만 제목과의 모호성이 있어 별도 경계로 기록한다. 가상 원고에서만 확인한 낮음 결함이다.

```js
const endsSentence = /[.!?。！？]["”’'」』)\]}]*\s*$/.test(t);
if (titleEvidence && !endsSentence) push('titleEn2', '명시 제목');
else push('abstractEn', '영문초록 본문');
```

### F-08·F-11 보류 항목

- `src/structure.js:253`, `src/structure.js:259`~`:266`: 범위 기호는 고정 `~`, 낫표 치환은 편집 목록에 추가하지 않아 보조평면 치환 뒤 각주 7→5·강조 런 폐기. `functional.mjs`의 marks/page-style/references-sort로 재현한다. 자동 참고문헌 정렬도 입력 3항목 순서를 그대로 둔다. 보류 사실과 UI 미사용 marks 옵션을 구별하며 별도 새 결함으로 중복 감점하지 않았다.
- 수정: 낫표도 `{at, oldLen, replacement}` 편집 목록으로 처리하고 모든 좌표를 원문 기준으로 합성한다. 범위 기호는 학회 규칙에서 읽는다. 정렬 미지원은 명시한다.
- `tools/convert.mjs`의 정규화·포함 검사, `tools/verify_matrix.mjs`의 역할 최빈값 비교는 모든 글자의 보존/서식을 입증하지 못한다. 새 감사 스크립트가 제품 도구에 편입된 것은 아니다.

```js
assert.deepEqual(actualTexts, expectedTexts);
assert.deepEqual(actualNotes, expectedNotes); // 문단·글자·번호·좌표
assert.deepEqual(actualStyleCoverage, expectedStyleCoverage);
process.exitCode = failures.length ? 1 : 0;
```

## A 충실도 재실행 수치

원본 파싱→인식→목차→재배열→규정 쪽수 치환→빈 줄 정책을 기대 모델로 만들었다. HWP는 기존 CLI 복사본이 디스크에 저장한 파일을, HWPX는 현재 buildDocument가 별도로 생성·저장한 파일을 다시 읽었다. 원고 파서 이후의 전송·저장 보존 검사이며, 인식 자체의 의미적 정답까지 보장하지 않는다. UTF-16 단위로 정규화 없이 비교했다.

| 대상 | 파일 수 | 비교 문단 | 본문 UTF-16 | 각주 수 / UTF-16 | 본문 불일치 글자 | 각주 불일치 글자 / 위치 |
|---|---:|---:|---:|---:|---:|---:|
| paper1~5 × 3학회, HWP | 15 | 2,105 | 363,035 | 537 / 69,029 | 0 | 0 / 0 |
| pdf-01~40 × 3학회, HWP | 120 | 104,454 | 4,009,755 | 0 / 0 | 0 | 0 / 0 |
| paper1~5 × 3학회, HWPX | 15 | 2,105 | 363,035 | 537 / 69,029 | 0 | 0 / 0 |
| pdf-01~40 × 3학회, HWPX | 120 | 104,454 | 4,009,755 | 0 / 0 | 0 | 0 / 0 |
| 가상 16종 × 3학회, HWP | 48 | 259 | 2,139 | 27 / 별도 총계 미집계 | 0 | 0 / 0 |

- 실원고 HWP 135건의 본문·각주 **기존 활성 강조 손실 0/0**. 제목류 굵기는 학회 규칙 우선이라 입력 굵기 보존 분모에서 제외했다. 비활성→활성의 추가 강조를 원고 기대값과 전 글자 대칭 비교한 것은 **확인 못 함**.
- 대응 HWP/HWPX **135쌍**의 글자별 B/I/U/위첨자 속성을 대칭 비교한 결과 본문·각주 차이 **0/0**이다(`output-emphasis.json`). 따라서 HWPX에서도 위 활성 강조 보존 결과와 일치한다. 두 산출물이 함께 잘못된 강조를 더하는 경우까지 배제하는 검사는 아니다.
- HWP/HWPX의 각주 문단 배열·번호 없음 여부·각주 개수 불일치 모두 0. 번호 없음 여부 검사가 모든 표시 번호/restart 의미의 독립 검증을 대신하지는 않는다.
- 표지/주제어 문구 변경 **265문단(HWP 기준: paper 41, pdf 224)**은 본문 불일치에서 분리했다. HWPX도 같다. 이 265건의 완전한 독립 예상 문자열 검증은 **확인 못 함**.
- 자동 skip **45문단**(PDF, 학회 중복 집계)은 비교 분모에서 제외했다. 원고 의미에 비추어 모든 제외가 옳은지 **확인 못 함**.
- PDF 각주 0은 TXT에서 연결된 각주 객체가 0이라는 뜻이다. PDF 원본의 실제 각주가 없거나 그 서식이 복구됐다는 뜻이 아니다. 원본 PDF 시각 비교는 **확인 못 함**.
- 가상 Unicode 3학회×3왕복에서 본문 불일치·활성 강조 손실 0, 각주 offset 14·26자·3문단·이탤릭 24자 유지. 2구역 HWP·번호 없는 각주도 재현 통과했다.
- 용지·여백: 저장 HWP **135건×9속성 불일치 0**. 매트릭스: **52/52 학회, 260변환, 41초**. 이 매트릭스는 역할별 최빈값 검사이지 전체 글자 서식 무결성 인증이 아니다.

## 실행 명령과 증거

모두 저장소 루트에서 실행했다. 로그는 원문 노출을 막기 위해 번호/수치 중심 batch로 수집했고, 도구 경로는 round4 출력으로 바꿨다. 아래 명령 중 `verdicts.mjs`의 exit 1은 위 실패 조건 검출이다.

```text
git log -5 --oneline
git branch --show-current
git status --short
node tests/audit_astra/round4/setup.mjs
node tests/audit_astra/round4/synthetic.mjs
node tests/audit_astra/round4/functional.mjs
node tests/audit_astra/round4/ui-functions.mjs
node tests/audit_astra/round4/ui-extended.mjs
node tests/audit_astra/round4/regressions.mjs
node tests/audit_astra/round4/extra.mjs
node tests/audit_astra/round4/batch.mjs
node tests/audit_astra/round4/fixture-strict.mjs
node tests/audit_astra/round4/verdicts.mjs
node tests/audit_astra/round4/geometry.mjs
node tests/audit_astra/round4/snapshot/tools/verify_matrix.mjs --samples tests/audit_astra/round4/no-samples --md tests/audit_astra/round4/matrix.md
node tests/audit_astra/round4/integrity.mjs
node tests/audit_astra/round4/release-behavior.mjs
node tests/audit_astra/round4/additional.mjs
node tests/audit_astra/round4/supplement.mjs
node tests/audit_astra/round4/output-emphasis.mjs
node tests/audit_astra/round4/package-check.mjs
node tests/audit_astra/round4/final-check.mjs
```

주요 증거는 같은 이름의 JSON, `manifest.json`, `outputs/verify_matrix.json`, `final-check.json`이다. 준비본 `ui-extended.mjs`의 파일 선택 대기와 추가 검사 기대값의 치환 순서를 바로잡아 재실행했다. 이는 하네스 보정이며 제품 수정으로 세지 않았다.

최종 HEAD와 복사 소스는 동일하며, 보호 대상 해시 변경 0개·snapshot 소스 차이 0개다. 셸의 `git diff --name-only`로 보호 대상과 3차 보고서 변경이 없음을 확인했다. `final-check.mjs`의 최초 Node 자식 git 실행은 환경의 `spawnSync EPERM`으로 실패해 파일 직접 확인과 별도 셸 git 검사로 바꿨다. 최종 확인기는 exit 0이며, 추적 작업 트리의 새 변경은 이 보고서뿐이다(감사 임시 폴더는 git ignore 대상).

배포본은 **19,556,059바이트**, SHA-256 `b17aada3d35e1e154a66d6d97bdf25a91e1cf9e65b9c636683e90dedde5a7aa4`로 해시 파일과 일치한다. 내장 자산 34개와 WASM이 원본 바이트와 일치한다. 배포 파서의 두 각주 재현은 소스와 동일하다(26자·3문단·이탤릭 24자, 번호 없는 9자·이탤릭 9자). 전체 재현 빌드·실브라우저 CSP 동작·접근성·한컴 조판·인쇄·글꼴 글리프는 이번에 **확인 못 함**.
