# ASTRA 2차 감사 보고서

## 1. 요약

점수: 76/100

**판정: 내용 무손실·학회 형식 완전 준수를 보증하는 공개 배포는 보류.** 1차 조치는 실제로 여러 회귀를 해결했지만, 정상 DOCX 본문 누락, 보조평면 문자가 있는 HWP의 재변환 각주 이동·강조 손실, 사용자 수치 검증 누락이 남는다. 단일 HTML 배포 방식은 유지할 수 있다.

| 평가 영역 | 배점 | 점수 |
|---|---:|---:|
| 견고성·사용자 입력·주소 검증 | 40 | 30 |
| 내용 보존·변환 정확성 | 35 | 28 |
| 구조 인식·규정 적용 | 15 | 10 |
| 검증·배포 품질 | 10 | 8 |
| 합계 | 100 | **76** |

점수는 위험도에 따른 감사 판단이며 검사 통과율이 아니다. 의도적으로 실패 경계를 모은 독립 검사 35개는 **15 통과·20 실패**이고, 실패 시 종료 코드 1을 반환한다.

### 95점에 이르기 위해 고쳐야 할 것

1. **P0 — 본문·좌표 무손실:** HWP 코드포인트 좌표를 공통 모델 UTF-16 좌표로 명시 변환하고, DOCX를 이름공간·문서 순서 기반 XML 파서로 처리한다. 정상 닫는 태그 공백, 글자와 각주가 섞인 런, 보조평면 문자 3회 왕복을 모두 단언한다(R-01·02).
2. **P0 — 사용자 데이터와 자원 예산:** 빈 줄은 제한된 정수만, 체재는 허용 그룹의 중복 없는 배열만 받는다. TXT 문단 상한, HWPX 해제 크기·문단 길이 상한, 읽기 전 파일 크기 검사 및 실제 중단 가능한 Worker를 적용한다(R-03·04).
3. **P0 — 공백·각주 서식 보존:** 각주를 문단·런 모델로 유지하고 공백 축약·trim·빈 줄 병합을 제거한다. 줄바꿈·탭·전각 공백·NBSP를 손실 허용 목록 없이 대조한다(R-05).
4. **P1 — 삭제와 추론 분리:** 자동 이름 모양만으로 제목 후보를 삭제하지 않는다. 목차 종료, 참고문헌 분류·정렬, 국내/국외 쪽수·범위 구분을 규칙 데이터와 일치시킨다(R-06·08).
5. **P1 — 정오표와 영속 저장:** 국외 저자·연도 충돌, 내주 학회, 유효한 국외 p. 표기, 재검사 색 초기화를 처리한다. 학회·바탕틀 저장을 원자적으로 교체한다(R-07·09).
6. **P2 — 출시 증거:** 엄격 비교와 UI/CLI 공통 전처리를 회귀 게이트로 만들고, 감사 대상 소스에서 재빌드한 HTML·해시를 함께 배포한다. 실제 한컴의 조판과 Chrome/Edge 실행을 별도로 검증한다(R-10·11). URL DNS 레이블 검증도 마무리한다.

위 수정 후 새 실패 케이스가 전부 통과하고, 55건 실원고·형식 회귀가 유지되며, 독립 한컴 조판 확인까지 확보하는 것을 95점 재심사 조건으로 제안한다. 체크리스트 개수만 채웠다고 자동으로 95점을 부여하지 않는다.

### 감사 범위와 고정 기준

- 필독 문서 5개 및 1차 보고서를 읽었다. 모든 실행 명령은 저장소 루트에서 `node`로 시작했다. 쓰기는 `tests/audit_astra2/` 및 이 보고서에만 수행했다. 네트워크 호출·원고 전송·의존성 설치는 하지 않았다.
- 감사 중 다른 작업의 변경이 관측됐다. 초기 파일 해시는 `baseline.json`, 고정 시점은 **2026-10-13 15:00:34 KST**(`snapshot-manifest.json`)이다. 소스를 `tests/audit_astra2/snapshot/src/`에 고정하고 주요 재현·55건 변환·46건 파이프라인·문자 검사·형식 검사를 다시 실행했다. 복사본 engine.js의 rhwp import 경로만 이동 위치에 맞게 변경했다.
- 아래 **src 파일의 줄 번호는 고정 스냅샷 기준**이다. 진행 중인 다른 수정과 혼동하지 않도록 원본 SHA-256을 manifest에 남겼다. 최종 해시 재확인 결과는 `integrity.json`에 있다.
- 기존 감사 도구는 출력 경로·import 경로를 감사 폴더로 바꿨다. `convert.mjs` 로그의 `tests/out/` 문구는 옛 문구이며 실제 산출은 `tests/audit_astra2/outputs/`이다.
- Node v25.4.0·설치된 rhwp 0.8.7 환경. 실제 한컴오피스, 브라우저 UI 전체, 실제 localStorage quota, Firefox/Safari는 실행하지 않았다. 저장 실패는 주입한 quota 예외로 함수 수준에서 재현했다.
- 최종 재확인 시 snapshot 이후 engine.js(구획별 쪽 나눔)·journals.js(일부 영문초록 역할 매핑)가 추가 변경됐다. **55건·407역할·점수는 15:00:34 고정본 결과**이며 이 후속 서식 변경 전체를 재인증한 것은 아니다. 최신 배포 해시·36자산·인용문 빈 줄 함수는 별도로 다시 확인했다.
- 학회 준수 수치는 저장소 journals 데이터·지정 바탕틀과의 대조다. 48개 학회의 최신 외부 규정을 전부 인증한 것이 아니다. 글꼴 이름 보존과 사용자 PC의 실제 글리프 표시도 구분한다.
- 표·그림 제외는 제품이 경고하는 알려진 범위다. 파싱 본문 보존 수치를 원본의 모든 객체 보존으로 해석하지 않는다.

### 1차 ASTRA 지적 재검증

| 1차 항목 | 2차 판정·근거 |
|---|---|
| F-01 사용자 JSON | **부분 수정.** upcoming 숫자·null 항목 방어, 예약 ID 거부 확인. 중첩 수치·날짜·중복 체재 미해결(R-03). safeBoot 코드 존재 확인, 실제 재부팅 UI 미검증 |
| F-02 입력 제한·시간 | **부분 수정.** 6,000,001자 TXT 거부, NUL 제거. 130,004문단 TXT 수용·재배열 스택 오류 및 5,894바이트 HWPX 7.559초 남음(R-04) |
| F-03 DOCX | **부분 수정.** 여는 태그 개행·중첩 표 개선. 닫는 태그 공백, 혼합 각주 런, 작은따옴표 위첨자 미해결(R-02) |
| F-04 구조·익명화 | **부분 수정.** ‘앞부분 짧은 줄’ 자동 추정은 보존하도록 코드 변경. 2~5자 한글 제목은 여전히 이름으로 확정·삭제 가능(R-06) |
| F-05 정오표 | **부분 수정.** 국문 동명 저자/연도 충돌 noRef=1, 미확인 직후 반복 인용 noRef=2 정상. 국외·내주·기존 붉은색 미해결(R-07) |
| F-06 치환 강조·국외 쪽수 | **부분 수정.** 12면→12쪽 이탤릭 왕복 유지, 세미콜론 국외 p. 유지. 다른 구분과 PUA 낫표 치환 미해결(R-08) |
| F-07 Markdown | **지정 사례 수정.** ‘**강조** 뒤[^1] 끝’ 산출 offset=4, 굵게 유지. 단일 강조 런도 반환 |
| F-08 검증 도구 | **미해결.** 공백 제거·Set 비교·로그 중심 검증은 보존의 충분조건 아님. 별도 엄격 검사 추가(R-11) |
| F-09 바탕틀 표시 | **수정.** koli p5=1100, p14=1200(1/100pt) 표시 확인 |
| F-10 외부 URL | **주요 수정.** 이전 위험/비정상 URL 5개 모두 거부. DNS 레이블 유효성은 미완료(R-10) |
| F-11 저장 실패 | **부분 수정.** 성공 여부·오류 표시 개선. 두 키의 원복은 실제로 작동하지 않음(R-09) |

다중 구역 바탕틀 iall·kochih의 각주 8개·1개도 다시 확인했다. `extra-results.json`에서 예약 ID에 보이는 TypeError는 **sanitizeJournal이 올바르게 null을 반환한 뒤 옛 하네스가 nextDeadlines(null)을 직접 호출한 결과**다. 제품 실패로 세지 않았다.

## 2. 중요도순 발견

### R-01 [높음] HWP 코드포인트와 UTF-16 좌표 혼용: 재변환 때 각주 이동·강조 손실

- 위치: `src/parse.js:50`(런 slice), `:60`(컨트롤 좌표), `:74`(각주 모델); `src/engine.js:313`·`:318`(런 길이 불일치 시 강조 폐기).
- 재현: `node tests/audit_astra2/new-cases.mjs` → `node tests/audit_astra2/anchor.mjs` → `node tests/audit_astra2/supplement.mjs`.
- 기대: ‘기호 ∑ ∞ ≠ ± ① Ⅳ 😀 𝄞 𠀀 é’의 문장 끝 각주가 반복 변환해도 끝에 남고 강조가 전체 글자를 덮는다.
- 실제: DOCX 모델 길이/offset는 UTF-16 **26**, 첫 HWP 재파싱 offset는 코드포인트 **23**. 첫 산출 XML의 각주는 정상적인 문장 끝이다. 그런데 이를 JS slice 좌표로 재사용하면서 **2차 산출은 𠀀 바로 뒤**, **3차 산출은 𝄞 바로 뒤**로 이동한다. 재파싱 좌표는 23→20→18. 독립 HWPX XML 조각으로 실제 이동을 확인했다.
- koli·ricc·dongak **3/3** 재현. 각 6문단 중 PUA 겹낫표 문단은 text 22/run 20, 보조평면 문단은 text 26/run 23으로 **2문단씩 런 범위 결손**. 2차 산출에서는 기울임·밑줄·위첨자가 false가 된다.
- 초기 `strict-output`의 emphasis=true는 “반환된 런의 속성”일 뿐 전체 글자 범위 보존이 아니다. coverage 검사로 이를 바로잡았으며 성공으로 세지 않았다.
- 수정 방향: 공통 모델 좌표를 UTF-16으로 고정하고 rhwp 입출력 경계에서 변환한다. API 조회에는 엔진 좌표, 문자열 slice에는 변환 좌표를 사용한다.

```js
const cpTo16 = [0];
for (const ch of text) cpTo16.push(cpTo16.at(-1) + ch.length);
const runText = text.slice(cpTo16[r.startOffset], cpTo16[r.endOffset]);
const offset16 = cpTo16[engineOffset];
// 모든 런의 이어 붙인 문자열 === paragraph.text를 단언한다.
```

증거: `anchor-results.json`, `supplement.json`, `strict-*.hwp`, `anchor-*-2/3.hwpx`.

### R-02 [높음] 정상 DOCX에서 닫는 태그 공백·혼합 런을 처리하지 못해 본문 누락

- 위치: `src/parse.js:108`(findClose), `:174`(각주 continue), `:177`(위첨자), `:190` 이후 runText.
- 재현: `node tests/audit_astra2/new-cases.mjs`, `node tests/audit_astra2/edge.mjs`.
- 표본은 관계 파일과 Content Types를 포함한 합성 DOCX를 바탕으로 생성했다.

| 입력 | 기대 | 실제 |
|---|---|---|
| `</w:p >`로 닫힌 정상 문단 | 1문단 | **0문단, warnings 0** |
| 한 w:r 안에 ‘앞’·footnoteReference·‘뒤’ | ‘앞뒤’, offset 1 | **빈 본문, offset 0**, warnings 0 |
| `w:val='superscript'` | 위첨자 true | false |
| 여는 `<w:p\n>` | 1문단 | 1문단 — 수정 확인 |
| 중첩 표 뒤 실제 본문 | 표 내부 제외, 본문 1개 | 정상 — 수정 확인 |

닫히지 않은 w:p 20만 개도 여전히 문단 0·경고 0으로 성공 반환한다. 잘못된 namespace 파일도 w:p 토큰만 있으면 읽고, 잘못된 숫자 엔티티는 원시 RangeError를 노출한다. 손상 입력 수용을 스크립트 실행 취약점으로 주장하는 것은 아니다.

수정: 이름공간 인식 XML 토큰 파서를 사용하고 자식 토큰의 실제 순서를 따라 글자·각주·탭·줄바꿈을 누적한다. 각주를 만났다는 이유로 런 전체를 건너뛰지 않는다.

```js
for (const token of run.children) {
  if (isText(token)) appendText(token.text, style);
  else if (isFootnote(token)) footnotes.push({ offset: text.length, ...readNote(token) });
  else if (isBreak(token)) appendText('\n', style);
}
// 속성은 따옴표 종류와 무관하게 XML 파서의 값으로 읽는다.
```

증거: `close-whitespace.docx`, `mixed-run-footnote.docx`, `single-quote-super.docx`, `new-results.json`.

### R-03 [높음] 중첩 사용자 값은 검증되지 않아 대량/무한 빈 줄과 본문 중복이 가능

- 위치: `src/app.js:29`·`:30`·`:40`·`:50`·`:53`; `src/structure.js:163`·`:195`.
- 재현: `node tests/audit_astra2/new-cases.mjs`, `node tests/audit_astra2/supplement.mjs`.
- 실제 수치: `beforeBody:10000` 통과 후 **빈 줄 10,000개** 삽입. 1.5는 2개 삽입. `structure:["body","body"]`는 본문 1개를 2개로 복제한다.
- `beforeBody:"1e309"`는 JSON 저장·재읽기 후에도 문자열로 남고 Math.max에서 **Infinity**가 된다. for(k<n) 경로는 종료 상한이 없다. 무한 루프 자체는 실행하지 않았다. 숫자 Infinity는 JSON.stringify 시 null이 되는 점과 구분해, 지속되는 **문자열** 사례를 추가했다.
- 음수 용지 폭·1e100 글자 크기도 sanitizeJournal 통과(실제 WASM 투입은 하지 않음).
- 날짜 검증은 정규식·Date 파싱 가능 여부뿐이다. `2026-02-30`은 승인되어 내부 Date는 3월 2일, 표시 원문은 2월 30일이다. `99-99`는 `NaN-NaN-NaN` 마감 항목으로 흘러간다. 최초 실험의 fmtDate 대역을 제품 함수와 동일하게 수정하고 재실행했으며, 이 사례를 렌더 예외로 과장하지 않는다.
- 수정: 허용 키로 새 객체를 만들고 필드별 타입·범위를 검증한다. 렌더 방어만으로 변환 루프는 보호되지 않는다.

```js
const blankCount = v => Number.isInteger(v) && v >= 0 && v <= 10;
const validOrder = a => Array.isArray(a)
  && a.every(x => allowedGroups.has(x)) && new Set(a).size === a.length;
const isoDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s)
  && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
// month-day도 윤년 기준 Date 생성 후 월·일을 역대조한다.
```

### R-04 [높음] TXT 문단 상한과 동기 HWPX 처리 시간 방어가 여전히 없다

- 위치: `src/parse.js:27`(HwpDocument 생성 후 검사), `:210` 이후 parseText; `src/structure.js:163`; `src/app.js:345`·`:548`.
- 재현: `node tests/audit_astra2/edge.mjs`, `node tests/audit_astra2/large.mjs`.

| 입력 | 결과 |
|---|---|
| TXT 6,000,001자 | 21ms, 명시 거부 — 개선 |
| TXT 2,730,038바이트 / 130,004문단 | 파싱 수용, 재배열 포함 215ms에 Maximum call stack size exceeded |
| DOCX 50,000런 / 3,137바이트 | 139ms — 이전 시간 폭증 개선 유지 |
| HWPX 20,000자 / 4,972바이트 | 106ms |
| HWPX 80,000자 / 5,197바이트 | 553ms |
| HWPX 320,000자 / 5,894바이트 | **7,559ms** |

빈 파일·64MiB+1 입력 4형식은 거부되고, 49MiB DOCX XML도 해제 전 거부된다. 그러나 파일 크기 하나만으로 위 작은 HWPX의 동기 처리 시간을 제한하지 못한다. UI의 원고·바탕틀은 file.size 검사 전에 arrayBuffer를 호출한다.

수정: 모든 형식에 실제 문단/문자/런/각주/문단 길이 예산, ZIP 해제 총량, 읽기 전 파일 크기 상한을 적용한다. 배열 spread를 반복 push로 바꾸고 Worker 종료로 시간·취소를 강제한다.

```js
if (file.size > MAX_FILE) throw new Error('파일 크기 초과');
if (lines.length > MAX_PARAS) throw new Error('문단 수 초과');
for (const block of groups[g]) out.push(block);
// Worker에서 파싱하고 시간 초과·취소 시 worker.terminate().
```

### R-05 [높음] 공백·줄바꿈·각주 강조는 정상화 과정에서 손실된다

- 위치: `src/parse.js:74`(각주 문단 trim/filter), `:149`(DOCX 공백 축약), `:196`(br), `:234`(TXT trim); `src/engine.js:188`·`:190`·`:305`.
- 재현: `node tests/audit_astra2/new-cases.mjs`, `node tests/audit_astra2/real-check.mjs`, `node tests/audit_astra2/details.mjs`.
- 합성 DOCX 각주 ‘선행 두 칸 + 탭 + 두 칸 + 전각 공백 + NBSP + 줄 끝 공백 + 빈 문단’이 **“각주 두 칸 전각 끝 둘째 문단”**으로 축약된다. 각주 w:rPr의 이탤릭도 공통 모델에서 보관하지 않는다. 3개 학회에 그대로 전파된다.
- DOCX `앞<w:br/>뒤`는 ‘앞 뒤’로 바뀐다. TXT 후행 U+0020 두 글자가 제거된다. 본문 내부 탭·전각 공백·NBSP·선행 공백은 지정 3개 학회에서 보존됐으므로 모든 공백이 없어진다고 일반화하지 않는다.
- 실원고의 엄격 대조에서 **paper4 각주 3번, 369→368자**. 개행 바로 앞 U+0020 한 글자가 없어졌다. 11개 학회 전부 동일하며, 공백을 제거하면 같아 기존 convert는 모두 성공으로 보고한다. 제3자 식별 정보와 원문은 보고서에 싣지 않았다.
- 수정: `footnotes:[{paragraphs:[{text,runs}]}]` 모델을 도입하고 원문 공백·빈 문단을 유지한다. 화면 표시용 정규화와 저장용 문자열을 분리한다.

```js
// trim(), replace(/\s+/g, ' '), filter(Boolean)로 원문을 고치지 않는다.
note.paragraphs = xmlParagraphs.map(p => readRunsInOrder(p));
assert.equal(joinRuns(note.paragraphs[0].runs), note.paragraphs[0].text);
```

### R-06 [중간~높음] 자동 익명화의 이름 판정과 목차 종료가 아직 안전하지 않다

- 위치: `src/structure.js:23`·`:73`·`:85`; `src/app.js:364`.
- 재현: `node tests/audit_astra2/new-cases.mjs`.
- 입력 ‘두 줄 제목 연구 / 문학성 / 홍길동 / 1. 서론 / 본문’에서 ‘문학성’을 author·“이름 형태”로 판정한다. 실제 익명화 조건에 해당해 **제목 둘째 줄 1개와 저자 1개를 모두 삭제**한다. 자동 추정 reason만 구분하는 1차 수정은 2~5자 한글 제목을 보호하지 못한다.
- 합성 목차 ‘1. 서론 / 2. 결론’ 다음 실제 본문 ‘1. 서론’도 toc가 된다. 참고문헌 소분류 2개는 refSub로 정상 분류했으나, 목차 종료를 구분할 상태/문서 서식 단서가 부족하다.
- 수정: 짧은 한글 단어를 확정 저자로 취급하지 말고 확인 전 삭제 금지. 직접 지정한 역할 또는 충분한 메타데이터 증거로 승인된 저자만 익명화한다. 목차와 본문 헤딩은 원본 스타일·페이지 경계 등을 함께 이용한다.

```js
const canRemove = b => authorRoles.has(b.role)
  && (b.confirmedByUser || b.authorEvidence === 'explicit-metadata');
```

### R-07 [중간] 정오표가 국외 동명 문헌·내주 체계·국외 쪽수에서 틀린 색을 만든다

- 위치: `src/errata.js:36`·`:48`·`:71`·`:111`·`:115`.
- 재현: `node tests/audit_astra2/edge.mjs`, `node tests/audit_astra2/format.mjs`.
- 국문 구조화 서지의 저자·연도 충돌과 직전 미확인 인용 전파는 수정됐다. 다만 국외 fallback 키는 parsed=null이므로 conflict가 즉시 false가 된다.
- **Smith / 2020 / Book of history** 각주가 **Jones / 2021 / 같은 제목** 참고문헌과 매칭된다(noRef=0). 실제 상태는 p. 경고로 format이지만, 다른 문헌에 연결된 오류는 검출되지 않는다.
- ricc의 국외 p. 규정에 맞는 정상 Smith 문헌도 formatBad=1, “쪽수 단위가 규정(쪽)과 다름”으로 표시한다.
- 내주 원칙 학회 **storyimage**에서 본문 ‘김철수(2020: 12)’와 해당 참고문헌을 넣어도 uncited=1·red.
- 누락 참고문헌을 보완하고 같은 객체에 buildErrata를 재실행하면 status=ok이나 각주의 flag=red가 남는다. 함수 수준 재현이며 모든 UI 경로가 같은 객체를 재사용한다고 주장하지 않는다.
- 수정: 국외 키에도 저자·연도를 별도 저장하고 충돌 비교, 인용 체계별 검사 활성화, 국내/국외 단위 분리, 검사 전 자동 생성 flag 초기화.

```js
const conflict = (a, b) =>
  (a.year && b.year && a.year !== b.year) ||
  (a.author && b.author && !sameAuthor(a.author, b.author));
// 자동 검사색은 원본색과 별도 필드로 저장하고 재검사 시작 때 지운다.
```

### R-08 [중간] 치환·참고문헌 정렬·빈 줄의 적용 범위가 규정 데이터와 어긋난다

- 위치: `src/structure.js:146`·`:186`·`:213`·`:222`·`:228`·`:236`.
- 재현: `node tests/audit_astra2/new-cases.mjs`, `node tests/audit_astra2/anchor.mjs`, `node tests/audit_astra2/policy.mjs`.
- 세미콜론으로 나눈 국내/국외 쪽수는 개선. 그러나 ‘국내 문헌 12면. Smith … p. 33.’은 **Smith도 33쪽**으로 바뀐다. 국내·국외 판별이 여전히 조각 내 한글 유무에 의존한다.
- ricc의 여러 쪽 규칙은 O-O쪽인데 `pp. 12-14.`는 **12~14쪽.**으로 변환한다.
- `marks:'half'`에서 ‘가 『책』 뒤’는 PUA 낫표로 늘어나지만 edits에 반영되지 않아 **runs=[]**, 각주 offset=5 그대로(기대 UTF-16 7). 현재 기본 UI 치환은 marks=keep이므로 이 항목은 호출 가능한 함수 옵션 경로로 한정한다.
- eomun의 “한국문헌 가나다순 → 외국문헌 알파벳순” 데이터가 있어도 ‘Zed / 하하하 / 가가가’의 역순 입력이 그대로 남는다. 구획 재배열과 항목 정렬은 별개이며 후자는 자동 적용되지 않는다.
- 동시 변경 후 고정본은 빈 줄 규칙이 없어도 aroundQuote 기본값 1을 추가한다. ‘본문/인용/출전/본문’은 **인용 앞만 빈 줄 1개**, 출전 뒤는 0개다. 규정 미명시를 일반 관행으로 보완하는 정책은 “학회 규정 그대로”와 구분해 설명해야 하고, 앞뒤 적용도 일관돼야 한다.
- 수정: 쪽수 범위 기호와 국내/국외 단위를 구조화하고, 모든 치환을 동일한 원문 좌표 편집 맵으로 처리한다. 규정이 명확한 참고문헌 정렬을 구현하거나 미지원 경고를 제공한다.

```js
const pageStyle = isForeign(citation) ? rule.foreignPages : rule.domesticPages;
const replacement = renderPages(citation.pages, pageStyle);
// 낫표 치환도 edits에 기록. 연속 치환의 좌표는 합성해 원문 좌표로 환산.
// aroundQuote는 학회 데이터의 명시값을 우선하고 누락 정책을 문서화한다.
```

### R-09 [중간] 가져오기 저장 실패 시 원복이 현재 값을 다시 쓰므로 부분 변경이 남는다

- 위치: `src/app.js:19`·`:560`·`:571`.
- 재현: `node tests/audit_astra2/new-cases.mjs`.
- 기존 학회 old/바탕틀 old 상태에서 학회 저장만 성공하고 바탕틀에 quota 예외를 주입했다. 결과 **학회=new, 바탕틀=old**. 실패 분기의 lsGet은 이미 덮어쓴 새 학회를 읽으므로 원복이 아니다.
- 사용자에게 성공 대신 오류를 표시하는 수정은 유효하다. 다만 기존 데이터 복구와 원자적 저장은 보장하지 않는다. 학회 추가 화면의 바탕틀 lsSet 결과도 검사하지 않는다.
- 수정: 쓰기 전 두 원문 값을 보관해 실패 시 복구하거나 한 저장 단위/IndexedDB 트랜잭션으로 바꾼다. 원복 자체 실패도 처리한다.

```js
const oldJ = localStorage.getItem(LS.journals);
const oldT = localStorage.getItem(LS.templates);
// 검증·직렬화 후 커밋. 실패 시 oldJ/oldT를 복구하고 복구 실패도 알림.
// 가능하면 journal+template을 한 레코드의 원자적 트랜잭션으로 저장.
```

### R-10 [낮음] URL 검증은 개선됐지만 DNS 레이블 검증까지 끝난 것은 아니다

- 위치: `src/app.js:25`.
- 재현: `node tests/audit_astra2/new-cases.mjs`.
- javascript/data, 자격증명, 역슬래시, 깨진 IPv6 호스트 등 기존 5개 거부 확인.
- `https://example..com`, `https://-bad.example`, `https://.`은 통과. 단순 허용 문자와 점 포함 여부만 본다. 국제화 도메인의 punycode 변환은 정상 수용된다.
- `https:example.com`은 정규화된 HTTPS로 허용된다. loopback HTTP(S)·퍼센트 인코딩 경로 허용 자체를 XSS/SSRF로 세지 않는다. 이 기능은 사용자가 누르는 외부 링크이고 자동 서버 요청이 아니다.
- 수정: URL 파싱 후 DNS 레이블/길이 또는 IP를 명시 검증하고, 실제 hostname을 표시한다. noopener noreferrer는 유지.

```js
const labels = url.hostname.replace(/\.$/, '').split('.');
const dnsOK = labels.every(s => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(s));
// IP/국제화 도메인 처리 정책은 별도로 명시한다.
```

### R-11 [중간] 기존 성공 로그는 엄격 보존을 증명하지 않으며 소스·배포의 감사 시점을 고정해야 한다

- 위치: `tools/convert.mjs:12`·`:66`·`:70`, `tools/fidelity_test.mjs:66`; `tools/build.mjs`; `release/투고틀.html`의 applyBlanks.
- 재현: `node tests/audit_astra2/real-check.mjs`, `node tests/audit_astra2/verdicts.mjs`, `node tests/audit_astra2/integrity.mjs`, `node tests/audit_astra2/release-freshness.mjs`.
- 기존 convert는 공백·일부 문장부호를 정규화하고, 강조를 Set로 비교한다. fidelity는 후행 공백을 제거하고 위치/모든 강조 범위를 검증하지 않는다. 이번 엄격 실원고 비교의 각주 불일치 **11건**과 보조평면 왕복 오류를 기존 성공 로그가 놓친다.
- 파이프라인은 46회 생성·재로드 완료이지, 모든 의미/서식 단언 46개 통과가 아니다. 새 `verdicts.mjs`는 기대 조건을 명시해 **35개 중 20개 실패 시 exit 1**을 낸다.
- 초기 검사 배포 파일은 **19,490,880바이트**, SHA-256 **6a036b16122e5962bbef9502b9e280108c3faca6e5044b0aceb60b103d53671b**였다. 보고서 작성 후 **15:09:28 KST**에 재확인한 최신 배포본은 **19,498,126바이트**, SHA-256 **623f7cb3c38962ceb4a11efb8fed66cfae295fb609e2fa86bd8632f7b5680a8b**이고 해시 파일과 일치한다. 두 검사 모두 WASM 1+바탕틀 20+서식 15=**36개 원본 바이트 일치**. 등록된 바탕틀 학회 수와 디렉터리 자산 수는 다르다.
- CSP는 default-src none, connect-src data:/blob:, object-src none, base-uri none, form-action none. 정적 정책 확인이며 실제 브라우저 네트워크 봉쇄 시험은 아니다.
- **초기 소스/배포 차이와 최종 해소:** blanks={}의 body→quote→body 입력은 snapshot에서 빈 줄 **2**, 당시 배포 JS에서 **0**이었다. 배포 함수 조각을 VM으로 직접 실행해 확인했다. 최신 배포본에서는 **2 대 2로 일치**하여 이 차이는 해소됐다. 이전 증거는 release-freshness-earlier.json, 최신 증거는 release-freshness.json에 각각 보존했다. 이는 감사 중 배포 갱신의 기록이며 변조 증거가 아니다.
- 원래 build는 금지된 dist에 쓰므로 출력만 감사 폴더로 바꾼 복사본으로 재빌드를 시도했다. esbuild 자식 프로세스가 **spawn EPERM**으로 거부되어 소스 전체와 배포 JS의 재현 빌드 동등성은 확인하지 못했다. 권한 우회나 금지 폴더 쓰기는 하지 않았다.
- 수정: 엄격 보존 게이트, 역할/범위/갯수 단언, 소스 스냅샷 기준 재현 빌드 및 배포 갱신.

```js
assert.deepEqual(actualParagraphs, expectedParagraphs); // 순서·중복·공백 포함
assert.deepEqual(actualFootnotes, expectedFootnotes);   // 좌표·문단·런 포함
assert.equal(concatRuns(p.runs), p.text);
// 허용된 서지 치환은 별도 expected를 만든 뒤 비교한다.
```

## 3. 실행한 명령과 수치

### 실원고 5편 × 11개 학회 = 55건

고정본 기준 입력을 인식→재배열→허용 쪽수 치환→빈 줄 적용한 결과와 산출 HWP를 **문단 인덱스별·문자열 그대로** 비교했다. 동일 문자열 두 번도 두 문단으로 센다. 각주 위치도 순서별 직접 비교했다.

| 검사 | 수치 |
|---|---:|
| 변환 | 55 |
| 비교 문단(규정 빈 줄 포함) | 7,453 |
| 비교 본문 UTF-16 코드 단위 | 1,328,726 |
| 본문 문자열 불일치 | 0 |
| 각주 내용·좌표 비교 | 1,969 |
| 각주 위치 불일치 | 0 |
| 각주 내용 엄격 불일치 | **11** — paper4의 같은 줄 끝 공백 1자 |
| 원문 활성 강조(B/I/U/위첨자) 글자별 손실 | 0 |

이는 **파서가 반환한 본문과 허용 전처리 결과 기준**이다. 새 DOCX·보조평면·각주 서식 실패는 별도 검사이며 위 수치가 이를 상쇄하지 않는다.

### 서식: 실원고 165역할 + 새 합성 242역할

- paper2를 11개 학회에 변환하고 15역할씩 **165문단**의 글꼴·크기·줄간격·정렬, 용지·여백을 비교했다.
- 새 `format-input.json`은 목차, 초록 2단락, h1~h4, 본문·인용·출전, 참고문헌 분류·2항목, 영문초록·주제어의 **24블록**이다. 13개 학회 산출문단의 문자열·순서·빈 줄 수가 계산 블록과 **13/13** 일치했다.
- 그중 같은 11개 학회의 고유 역할 **22×11=242문단**을 바탕틀/format과 비교했다. 따라서 서식 표본은 총 **407문단**.
- 크기·줄간격·정렬·용지·여백 불일치 0. 글꼴 대표 이름의 차이는 실원고 1건·합성 6건 있었으나, **언어별 fontFamilies 7개가 각각 동일**하다. 문자가 한글/라틴인지에 따라 대표 이름이 달라진 것으로 판단하여 오류로 세지 않았다.
- 동일 역할 초록·참고문헌 사이 불필요 빈 줄은 13/13 없었다. 쪽수 단위 변환 후 합성 각주도 계산된 기대값과 대조했다. 참고문헌 항목 정렬·범위 기호·국외 판별의 규정 적합성은 R-08의 별도 실패다.
- 고정본이 기본 인용문 빈 줄 정책을 추가하면서 초기 감사와 빈 줄 수가 달라졌다. 아래는 **재실행 후 고정본** 수치다.

| 학회 | 본문 글꼴·크기 / 줄간격 | 삽입 빈 줄 | Node 쪽수 |
|---|---|---:|---:|
| koli | 한컴바탕 10pt / 160% | 30 | 45 |
| daejung | 한컴바탕 10pt / 160% | 42 | 36 |
| iall | 한양신명조 10.7pt / 167% | 45 | 47 |
| koreanst | 바탕 10pt / 160% | 40 | 22 |
| dongak | 휴먼명조 10.3pt / 177% | 42 | 41 |
| kochih | 휴먼명조 10pt / 170% | 34 | 35 |
| koreacontents | 한양신명조 9pt / 165% | 30 | 18 |
| ricc | 바탕 10pt / 160% | 26 | 19 |
| kolali | HY신명조 10.5pt / 160% | 26 | 38 |
| eomun | 바탕 11pt / 160% | 26 | 42 |
| ktla | 휴먼명조 10pt / 180% | 26 | 48 |

Node 쪽수는 근사 글자 폭 기반이며 한컴 인쇄 쪽수 인증이 아니다. 실제 한컴에서 “저장 파일은 겹치지 않는다”는 README 설명도 이번 감사에서 확인하지 않았다. 별도 overlap 검사에서 당시 paper1→koli 미리보기는 **32쪽·겹친 본문 72줄**이었다(`overlap_check.mjs.paper1_koli.hwp.log`). 미리보기 수치와 저장 파일의 실제 한컴 조판은 구분해야 한다.

### 문자·신규 경계 검사

- 기존 fidelity 재실행: 로그 **12경로 전부 성공**, 본문 차이 0·각주 일치. 해당 도구의 공백 정규화 한계는 R-11에 명시했다.
- 새 strict-unicode: 옛한글 자모·PUA, 프랑스/독일/폴란드/그리스/키릴/아랍/히브리/일본/중국 문자, 수학 기호·보조평면 문자·결합 문자, 선행/중간/후행 공백과 중복 문장 **6문단×3학회=18문단**의 본문 문자열은 정확히 보존. 각주 공백, 런 범위, 재왕복 위치는 실패.
- 정상/비정상 DOCX, 사용자 스키마·일정·URL, 저장 실패, 정오표·치환·익명화·목차 사례를 JSON으로 보관했다.
- 35개 회귀 판정은 성공 15·실패 20이며 `verdicts.json`에 각각의 기대 조건과 증거 파일을 기록했다. R-08의 추가 정책 사례 등 모든 탐색을 35개 통계에 넣지는 않았다.

### 재현 명령

전부 저장소 루트에서 실행한다. `run.mjs`는 console 출력을 감사 폴더에 저장하는 Node 래퍼이며 테스트 의미를 바꾸지 않는다.

```text
node tests/audit_astra2/run.mjs tests/audit_astra2/edge.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/extra.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/fidelity_test.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/new-cases.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/anchor.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/supplement.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/format.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/policy.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/large.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/pipeline_test.mjs

node tests/audit_astra2/run.mjs tests/audit_astra2/convert.mjs tests/원고/paper1.hwp koli,daejung,iall,koreanst,dongak,kochih,koreacontents,ricc,kolali,eomun,ktla --quiet
node tests/audit_astra2/run.mjs tests/audit_astra2/convert.mjs tests/원고/paper2.hwp koli,daejung,iall,koreanst,dongak,kochih,koreacontents,ricc,kolali,eomun,ktla --quiet
node tests/audit_astra2/run.mjs tests/audit_astra2/convert.mjs tests/원고/paper3.hwp koli,daejung,iall,koreanst,dongak,kochih,koreacontents,ricc,kolali,eomun,ktla --quiet
node tests/audit_astra2/run.mjs tests/audit_astra2/convert.mjs tests/원고/paper4.hwp koli,daejung,iall,koreanst,dongak,kochih,koreacontents,ricc,kolali,eomun,ktla --quiet
node tests/audit_astra2/run.mjs tests/audit_astra2/convert.mjs tests/원고/paper5.hwp koli,daejung,iall,koreanst,dongak,kochih,koreacontents,ricc,kolali,eomun,ktla --quiet

node tests/audit_astra2/run.mjs tests/audit_astra2/real-check.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/compliance.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/synthetic-compliance.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/details.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/verdicts.mjs

node tests/audit_astra2/run.mjs tools/outcheck.mjs tests/audit_astra2/outputs/paper2_koli.hwp 국문 Abstract
node tests/audit_astra2/run.mjs tools/probe.mjs tests/audit_astra2/outputs/paper2_koli.hwp
node tests/audit_astra2/run.mjs tools/overlap_check.mjs tests/audit_astra2/outputs/paper1_koli.hwp
node tests/audit_astra2/integrity.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/build.mjs
node tests/audit_astra2/run.mjs tests/audit_astra2/release-freshness.mjs
```

- build 실행만 환경상 spawn EPERM으로 실패했다. verdicts의 exit 1은 발견한 기대 조건 실패를 반영하는 의도된 결과다. 나머지 최종 재현은 exit 0.
- 준비 단계에 PowerShell/Node 인용 문제로 스크립트 생성 실패와 그에 따른 모듈 미발견이 있었고, base64 전달로 고친 후 재실행했다. 제품 결함 수에 넣지 않았다.
- `edge.mjs`는 기존 PDF 추출 TXT 40개도 다시 인식해 `structure.json`에 저장한다. 이를 정답 라벨 기반 정확도/재현율로 제시하지 않는다.

### 핵심 증거

모두 `tests/audit_astra2/` 아래에 있다.

| 파일 | 내용 |
|---|---|
| snapshot-manifest.json / snapshot/src/ | 고정 소스·원본 SHA-256·고정 시각 |
| baseline.json / integrity.json / release-freshness*.json | 동시 변경·배포 해시·36자산·소스/배포 차이 |
| edge-results.json / extra-results.json | 1차 사례 재검증 |
| new-results.json / supplement.json / anchor-results.json | DOCX·Unicode·각주·공백·입력·저장·주소 |
| real-summary.json / real-footnote-diff.json | 55건·7,453문단·1,969각주 엄격 대조 |
| compliance.json / synthetic-compliance.json | 407개 역할 서식 및 용지·여백 |
| format-input.json / format-results.json / policy-results.json | 새 합성 체재·빈 줄·참고문헌·쪽수 사례 |
| errata-new.json / large-results.json | 정오표 경계·자원 실측 |
| verdicts.json / verdicts.mjs | 35개 기대 조건과 명시적 실패 종료 |
| *.log / outputs/ / strict-* / anchor-* | 실행 로그·산출 문서·원시 XML 위치 증거 |
