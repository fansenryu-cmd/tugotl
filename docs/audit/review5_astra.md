점수: 93/100

# ASTRA 5차 재감사 — ab39000

요청한 10항목은 **해소 4·부분 해소 5·그대로 1**이다. 작가 원고 5편과 PDF 파싱본 40건을 3학회에 적용한 HWP·HWPX 270개에서, 아래에 명시한 라벨 예외를 제외한 본문·각주 글자 및 각주 위치 불일치는 0이다. 그러나 새 XML 토큰화의 이름공간 누출, 정상 XML 거부, HWPX 길이 판정 오류, 괄호 안 혼합 문헌의 쪽수 오치환을 확인했다. 점수는 통과율이 아닌 위험 판단(A 47/50, B 46/50)이다. 기존 보류 항목을 새 결함으로 중복 감점하지 않았다.

## 95점에 이르기 위해 고쳐야 할 것

1. **우선순위 1:** 자기 닫힘 태그가 이름공간 스택에 쌓이지 않게 하고, 문단 짝 검사도 같은 XML 토큰을 사용한다(R5-01·02). 본문 누락·정상 입력 거부를 먼저 막는다.
2. **우선순위 2:** HWPX의 디코딩한 문단 전체 길이로 200,000자 초과를 검사한다. 엔티티 원문 길이와 개별 `hp:t` 길이를 문단 길이로 취급하지 않는다(R5-03).
3. **우선순위 3:** 제목 내부 괄호와 인용 전체를 감싼 괄호를 구별해 정상 문헌 구분자를 유지한다(R5-04).
4. **기존 미해소:** 사용자 서식의 역할 구조 검증을 완성하고 정상 음수 내어쓰기·자간을 보존한다(N-03/F-04). 후자는 이번 변경 이전에도 발생했으므로 새 회귀 수에는 넣지 않았다.

## 대상·방법·제약

- 브랜치 `main`, HEAD `ab39000`. `brief_round3.md`의 마지막 ASTRA 5차 안내, `review4_astra.md`, `response_round3_fidelity.md`의 ASTRA 4차 조치를 읽고 재현했다. 운영규정과 관련 검증·안내 문서도 검토했다.
- 시작 시 `docs/audit/brief_round3.md`에 기존 작업 트리 변경이 있었다. 이를 보존했다. 제품 보호 경로와 README는 수정하지 않았다.
- round4의 `.mjs`를 round5에 복사했다. setup의 round3 스크립트 재복사 부분은 제거해 복사한 4차 하네스를 덮어쓰지 않게 했다. 실행 경로는 round5로 변경했고 현재 src를 `setup.mjs`로 복사했다. 원본 제품 로직은 변경하지 않았다.
- `extra.mjs`는 이제 정상적으로 거부되는 320,000자 입력을 catch해 결과를 남기도록 고쳤다. `ui-extended.mjs`에 저장 성공·내장 JSON 불러오기→저장 콜백 검사를 추가했다. 과거 보고서를 쓰는 `checkpoint.mjs`는 실행하지 않았다.
- 새 회귀 여부는 `ab39000^`의 app/parse/structure 사본을 round5 안에 두고 확인했다. 기존 round4 snapshot은 현재 소스일 수 있으므로 이전 버전의 증거로 사용하지 않았다.
- 실원고 식별은 paper1~5, pdf-01~40으로만 기록했다. 새 파일·산출물 이름에 제목·저자·본문·각주를 쓰지 않았다. 외부 전송 없이 로컬 Node/WASM/VM으로 실행했다.
- 실제 브라우저, Word·한컴에서의 조판·인쇄 및 독립 판독기 검증은 **확인 못 함**. UI 검사는 실제 앱 함수와 콜백을 VM의 가상 DOM·저장소에서 실행한 결과다.

## 4차 발견 재판정

명령은 모두 `node tests/audit_astra/round5/<파일>.mjs`이다. 원래 조건의 통과와 확장 경계의 잔존을 구분했다.

| 항목 | 판정 | 이번 수치·근거 | 스크립트 |
|---|---|---|---|
| N-01 이름공간 정규화 | 부분 해소 | 원래 XML 12/12 통과, 패키지 메타 추가본도 12/12 동일. 새 자기 닫힘 범위 2조건에서 무경고 누락 1·거부 1 | regressions, package-check, delta-xml |
| N-02 표만 있는 문서 | 해소 | 본문 0·표 경고 1. 빈 문단 1개·빈 본문 0개 정상. 표+본문도 본문 1·표 경고 1 | regressions, new-cases |
| N-03 서식·일정 정제 | 부분 해소 | page 누락 렌더 예외 1→0, Infinity/NaN·불리언 수치 제거. 5조건 중 문자열 역할 `body:'oops'`는 여전히 남음. 일정 비정상 루트 4조건 예외 0, 깨진 항목 2→0 | regressions, ui-extended |
| N-04 저장 실패 후 메모리 | 해소 | 추가 실패 디스크/메모리 새 키 0/0. 편집 실패 디스크 학회·바탕틀·메모리·캐시 복구 4/4 true | ui-extended |
| N-05 제목 내부 문헌 분리 | 부분 해소 | 기존 홑낫표·겹낫표 2/2 통과. 인용 전체를 감싼 괄호 안 정상 분리 1조건 실패(R5-04) | additional, followup, baseline-confirm |
| N-06 초록 문장 끝 | 해소 | 기존 문장부호 8/8 abstractEn. 마침표 없는 대조군은 기존대로 titleEn2 | additional |
| F-02 익명화 | 그대로 | 저자 없는 가상 부제 1문단·3자 삭제 유지. 연속 이름 후보 대조군은 보존 | functional |
| F-03 읽기·성능 제한 | 부분 해소 | 65 MiB 입력 읽기 호출 0. 48 MiB XML 허용, +1바이트 거부. 320,000자 19,279ms 수용→13ms 거부. 문단 경계·분할·엔티티 예외는 R5-03 | functional, regressions, extra, exact-boundary |
| F-04 사용자 서식·일정 | 부분 해소 | N-03 참조. format 있는 내장 30개 모두 불러오기·저장 성공하나 30/30에서 총 205개 정상 음수 필드 손실(이전 버전과 동일) | ui-functions, ui-extended, followup |
| F-09 저장 원복 | 해소 | 실패 원복 위 4/4, 성공 후 디스크 새 바이트·메모리 새 바이트·캐시 무효화·학회 로드 4/4 true | ui-extended |

`verdicts.mjs`의 옛 34조건은 31통과·3실패(exit 1)다. 실패는 F-02, 보류된 half 좌표, 제거된 format을 하네스가 `formatTable(undefined)`로 직접 호출하는 조건이다. 마지막 것은 실제 앱의 `if (j.format)` 가드를 무시한 하네스 결과이며 제품 오류로 세지 않았다. 이 집계와 위 요청 항목 10개의 판정은 분모가 다르다.

## 새 발견과 수정안

### R5-01 — 자기 닫힘 요소의 이름공간이 다음 형제에 누출

- 위치: `src/parse.js:271`, `:278`, `:284`, `:285`.
- 재현: `node tests/audit_astra/round5/delta-xml.mjs` (`scope`, `scope-wml`).
- 기대: 자기 닫힘 요소의 xmlns는 그 요소 안에서만 유효. 뒤 WML 본문 1문단·2자를 보존한다.
- 실제: 부모 커밋은 두 조건 모두 1문단·2자. 현재는 한 조건에서 0문단·경고 0, 다른 조건에서 구조 오류 거부. 가상 입력에만 확인한 **낮음** 결함이나, 무경고 내용 누락이므로 수정 우선순위는 높다.
- 원인: TAG의 속성 그룹 `[^>"']`가 마지막 `/`까지 탐욕적으로 먹어 `m[5]`가 비고, 자기 닫힘 요소도 stack에 push된다. `w`가 다른 URI인 조건 자체는 이번 확장 검사에서 정상이나 이 스택 누출과 결합하면 다시 누락된다.

가상 본문 조각(상위 x는 WML에 바인딩):

```xml
<x:other xmlns:x="urn:other"/>
<x:p><x:r><x:t>가상</x:t></x:r></x:p>
```

국소 수정안:

```js
const selfClose = /\/\s*>$/.test(m[0]);
const attrs = (m[4] || '').replace(/\/\s*$/, '');
// 이름공간·속성 정규화 후:
out += `<${qn(scope, prefix, local)}${attrsOut}${selfClose ? '/' : ''}>`;
if (!selfClose) stack.push(scope);
```

실제 구현에서는 닫는 요소 이름도 스택과 대조해야 한다. 위 조각은 자기 닫힘 문제의 국소 수정이며 완전한 XML 유효성 검사 대체가 아니다.

### R5-02 — 문단 짝 검사가 정상 XML을 거부

- 위치: `src/parse.js:156`, `:290`~`:293`.
- 재현: `node tests/audit_astra/round5/delta-xml.mjs` (`comment-tail`, `gt`), `new-cases.mjs`.
- 가상 입력: 정상 본문 뒤 `<!-- <w:p> -->`, 또는 `<x:p data="a>b"/>`.
- 기대: 주석 안의 문자열은 요소가 아니며 속성값 안의 `>`는 태그 끝이 아니다. 두 입력을 구조 오류로 거부하지 않는다.
- 실제: 이전 버전은 두 입력을 수용, 현재는 **2/2 거부**. 이전 스캐너도 속성 있는 빈 문단의 완전한 보존까지는 못 했으므로, 새 회귀는 거부 동작으로 한정한다. 가상 입력에서만 확인한 **낮음** 결함.
- CDATA 내부 `<w:p>`도 현재 거부되지만 이전 버전에서도 실패해 별도 새 결함으로 세지 않았다. 일반 CDATA는 문자 데이터 대신 구문까지 반환한다. 현재 토큰화가 CDATA를 건드리지 않는 것과, 하위 텍스트 파서가 CDATA를 읽는 것은 별개다.

수정 계약 예시(보조 함수 구현 필요):

```js
function checkParagraphBalance(xml) {
  const stack = [];
  for (const t of xmlTokens(xml)) { // 따옴표·주석·CDATA 인식
    if (t.kind !== 'element' || t.name !== 'w:p') continue;
    if (t.selfClosing) continue;
    if (!t.closing) stack.push(t);
    else if (!stack.pop()) throw paragraphError();
  }
  if (stack.length) throw paragraphError();
}
```

표 안 문단, 단순 자기 닫힘 문단, 텍스트 상자 포함 문서는 이번 검사에서 거부하지 않았다. 텍스트 상자는 본문 배열에 2문단·그림 경고 1로 반환됐으며, 텍스트 상자의 원래 조판 보존은 **확인 못 함**. 깊이 1,000의 중첩은 1문단·2자 보존했다.

### R5-03 — 20만 자 검사가 문단 길이와 다른 값을 검사

- 위치: `src/parse.js:28`.
- 재현: `node tests/audit_astra/round5/exact-boundary.mjs`; 이전 버전 수용 확인은 `baseline-confirm.mjs`.
- 기대: 디코딩한 문단이 200,000자 이하면 수용, 초과면 엔진 진입 전 거부. 같은 문단의 런·텍스트 노드 분할 여부가 결과를 바꾸지 않는다.
- 실제: 정규식 `/<hp:t>[^<]{200000}/`는 XML 원문 길이와 태그의 정확한 철자만 검사한다.

| 가상 단일 문단 | 기대 | 현재 결과 | 시간 |
|---|---|---|---:|
| 199,999자, 단일 t | 수용 | 1문단·199,999자 | 7,656ms |
| 200,000자, 단일 t | 수용 | 거부 | 7ms |
| 200,001자, 단일 t | 거부 | 거부 | 5ms |
| 200,001자, t 두 개 | 거부 | 1문단·200,001자 수용 | 7,517ms |
| 50,000자, `&#44032;` 표기 | 수용 | 거부 | 2ms |
| 200,001자, t에 xml:space 속성 | 거부 | 1문단·200,001자 수용 | 11,732ms |

200,000자와 엔티티 50,000자는 부모 커밋에서 각각 정확히 수용됨을 확인했다. 따라서 두 거부는 새 회귀다. 분할·속성 우회는 이번 방어의 미완성이다. 기존 테스트 기반의 첫 확장 측정은 바탕 문구가 남았으므로 최종 표는 모든 t를 교체한 `exact-boundary.json`만 사용했다. Node에서 다른 작업과 겹친 측정이며 브라우저 정지 시간이나 정밀 성능 비교는 아니다. 가상 입력에서만 확인한 **낮음** 결함.

수정 계약 예시(이름공간을 인식하는 스트리밍 토크나이저 필요):

```js
const lengths = [];
for (const t of hwpxTokens(sectionXml)) {
  if (t.isParagraphStart) lengths.push(0);
  if (t.isText && lengths.length) {
    lengths[lengths.length - 1] += decodeXml(t.text).length;
    if (lengths.at(-1) > 200_000) throw paragraphLimitError();
  }
  if (t.isParagraphEnd) lengths.pop();
}
```

본문·각주의 중첩 문단은 각각 별도로 세고 문자 단위(UTF-16 또는 코드포인트)를 명시해야 한다. Worker 분리는 기존 보류로 별도 표시하며, 이번 새 회귀 수에는 넣지 않았다.

### R5-04 — 인용 전체의 괄호가 정상 문헌 분리를 막음

- 위치: `src/structure.js:199`~`:212`, `:261`.
- 재현: `node tests/audit_astra/round5/followup.mjs`, `baseline-confirm.mjs`.
- 가상 입력: `(가가가, 가상, 2020, p. 12; Smith, Synthetic, 2021, p. 33.)`.
- 기대: 국내 조각만 `12쪽`, 국외 조각은 `p. 33.` 보존.
- 실제: 이전 버전은 기대대로. 현재는 국외 조각도 `33쪽`으로 변경(1조건 실패). 괄호 없는 정상 구분과 균형 잡힌 제목 뒤 구분 대조군은 정상이다. 가상 입력에서만 확인한 **낮음** 결함.
- 원인: 모든 괄호를 제목 보호 범위로 취급하고 깊이 0에서만 세미콜론을 분리한다. 괄호로 감싼 여러 문헌을 한 조각으로 읽으면 한글 포함 판정이 국외 문헌에까지 적용된다.

수정 계약 예시:

```js
const { prefix, inner, suffix } = unwrapWholeCitation(text);
// 전체 인용을 감싼 한 쌍만 벗긴다. 제목 내부 괄호는 그대로 보호한다.
const parts = splitCitationSegs(inner);
return prefix + parts.map(convertCitationPart).join('') + suffix;
```

단순히 모든 괄호 보호를 없애면 N-05가 재발할 수 있다. 쌍의 위치·종류를 보존하는 스캐너가 필요하다. 직선 따옴표 및 홑곡선 따옴표 안 제목 2조건은 여전히 쪽수 치환을 놓치지만 이전 구현의 범위 밖 문제로 새 회귀에 넣지 않았다.

## 서식·기존 한계의 별도 기록

- `src/app.js:69`~`:90`: format을 가진 내장 학회 **30개**를 실제 관리 화면 콜백으로 불러와 사용자 id로 변경·저장했다. 저장 30/30, 로드된 format의 동일성 0/30. 값 단위 손실은 **205개**이며 음수 `indent`·`spacing`이다. id 변경은 내장 id 덮어쓰기 금지를 따르기 위한 것이다.
- `followup.json`: 부모 커밋 sanitizer에서도 동일 205개 손실, 이번 타입 분류 때문에 추가로 없어진 내장 필드는 **0개**. 두 번 정제한 결과의 안정성은 30/30이다. 재정제 안정성이 원본 보존을 뜻하지 않는다.
- 이 경로에서 예를 들어 정상 내어쓰기 -30 또는 자간 -4를 제거한다. 필드별 부호·범위를 허용하고 `roles`의 값은 객체로만 받는 것이 수정 방향이다. 새 발견 감점과 별도로 N-03/F-04 미해소 근거로 남긴다.

```js
const signed = new Set(['indent', 'spacing', 'charSpacing']);
const lo = signed.has(key) ? -10000 : 0;
if (typeof value === 'number' && Number.isFinite(value)
    && value >= lo && value <= 10000) out[key] = value;
// 역할 맵 진입 시 typeof role === 'object' && !Array.isArray(role) 확인
```

- 접두사 없는 속성: 기본 이름공간 문서의 `val="0"`을 `w:val="0"`으로 바꿔 굵기 false로 읽는다. 이름공간 없는 속성을 WML 속성으로 승격하는 동작은 이전에도 있어 새 회귀로 세지 않았다. 엄격한 XML 이름공간 의미의 충실성은 미해소다.
- 초록 기존 8조건은 모두 해소했다. 마침표 없는 짧은 문장의 제목/본문 모호성은 그대로다. 이번 문장 끝 변경에서 새로 나빠진 조건은 확인하지 못했다.
- F-02 익명화, F-08 범위 기호·half 좌표·정렬, F-11 제품 검증 도구, Worker 분리는 안내문에 명시된 보류다. 본문 의미 판정의 한계나 이 보류들을 새 회귀로 중복 계수하지 않았다.

## A 충실도 재실행

학회는 koli·ricc·dongak이다. 원본 파싱→역할 인식→목차→재배열→규정 쪽수→빈 줄 적용을 기대 모델로 만들고 실제 저장 파일을 다시 파싱했다. UTF-16 위치별 비교이며 정규화로 차이를 지우지 않았다.

| 대상 | 산출 파일 | 비교 문단 | 본문 UTF-16 | 각주 UTF-16 | 본문 불일치 | 각주 불일치 / 위치 |
|---|---:|---:|---:|---:|---:|---:|
| paper1~5 × 3, HWP | 15 | 2,105 | 363,035 | 69,029 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWP | 120 | 104,454 | 4,009,755 | 0 | 0 | 0 / 0 |
| paper1~5 × 3, HWPX | 15 | 2,105 | 363,035 | 69,029 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWPX | 120 | 104,454 | 4,009,755 | 0 | 0 | 0 / 0 |

- HWP 기준 각주 537개. 양 형식에서 문단 수 차이·각주 수·문단 배열·번호 없음 여부 차이는 모두 0이다.
- HWP 135개의 기존 활성 강조(B/I/U/위첨자) 손실: 본문 0·각주 0. 제목류 굵기는 학회 규정 우선으로 제외한다. 대응 HWP/HWPX **135쌍**의 글자별 강조 대칭 차이도 본문 0·각주 0이다.
- 가상 16종×3학회 HWP **48개**, 259문단·2,139자·각주 27개: 본문·각주·위치·기존 강조 손실 모두 0. Unicode 3학회×3왕복도 손실 0이다.
- 라벨·주제어 치환 예외는 형식별 **265문단**(paper 41, pdf 224). 자동 skip **45문단**은 비교에서 제외된다. 이들의 의미적 정답 및 모든 예외의 독립 예상 문자열 검증은 **확인 못 함**.
- PDF 각주 0은 파싱 TXT에 연결된 각주 객체가 없다는 뜻이다. 원 PDF의 각주 부재나 서식 복구를 입증하지 않는다. PDF 원본과 시각 대조는 **확인 못 함**.
- 동일 rhwp 엔진을 재판독에 사용했다. 원본 파싱 이전의 유실, 두 형식에 동시에 추가된 잘못된 강조, 원고의 모든 역할 판정 정답은 **확인 못 함**.

## 실행 명령·증거

저장소 루트에서 실행했다. 모든 하네스·사본·입출력·로그는 round5 아래다. 아래 git show 출력도 round5 사본으로 저장했다.

```text
git rev-parse --short HEAD
git branch --show-current
git status --short
git diff ab39000^ ab39000 -- src/parse.js src/app.js src/structure.js
git show ab39000^:src/app.js
git show ab39000^:src/parse.js
git show ab39000^:src/structure.js
node tests/audit_astra/round5/setup.mjs
node tests/audit_astra/round5/synthetic.mjs
node tests/audit_astra/round5/functional.mjs
node tests/audit_astra/round5/ui-functions.mjs
node tests/audit_astra/round5/regressions.mjs
node tests/audit_astra/round5/additional.mjs
node tests/audit_astra/round5/extra.mjs
node tests/audit_astra/round5/ui-extended.mjs
node tests/audit_astra/round5/batch.mjs
node tests/audit_astra/round5/supplement.mjs
node tests/audit_astra/round5/output-emphasis.mjs
node tests/audit_astra/round5/fixture-strict.mjs
node tests/audit_astra/round5/package-check.mjs
node tests/audit_astra/round5/integrity.mjs
node tests/audit_astra/round5/new-cases.mjs
node tests/audit_astra/round5/followup.mjs
node tests/audit_astra/round5/exact-boundary.mjs
node tests/audit_astra/round5/delta-xml.mjs
node tests/audit_astra/round5/baseline-confirm.mjs
node tests/audit_astra/round5/verdicts.mjs
node tests/audit_astra/round5/final-check.mjs
```

핵심 수치는 각 스크립트와 같은 이름의 JSON에 있다. `verdicts` exit 1은 위에 설명한 실패 검출이다. 추가 UI 하네스 삽입 시 PowerShell 파이프의 한글 인코딩으로 버튼 선택자가 깨진 1회 실패는 이스케이프로 고쳐 재실행했다. 제품 결함으로 세지 않았다.

배포본 19,560,772바이트, SHA-256 `edffff01ed383e9374e4fcff9c8c2b352b9f5f043231bc58e49a016f0f57850a`: 해시 파일 일치, 내장 자산 34개·WASM 원본 일치. 전체 빌드 재현·배포본에서 새 결함 전부 실행·브라우저 CSP·접근성·글꼴 검증은 **확인 못 함**.

최종 보호 파일 해시 변화 0개, 현재 src와 실행 snapshot 차이 0개, HEAD 변화 없음은 `final-check.json`으로 확인한다. 시작부터 있던 브리프 변경을 제외한 추적 파일 변경은 이 보고서뿐이다.
