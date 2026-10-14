점수: 94/100

# ASTRA 6차 재감사 — main 52a4068

5차 요청 항목은 **해소 3·부분 해소 2·그대로 0**이다. 작가 원고 5편과 PDF 파싱본 40건을 3학회에 적용한 HWP·HWPX 270개에서, 명시한 라벨 예외를 제외한 본문·각주 글자 불일치는 0이다. 새 길이 검사에서 정상 HWPX를 거부하는 회귀와, DOCX 검사 완화 뒤 CDATA 글자를 무경고로 누락하는 동작을 확인했다. 모두 가상 원고에서만 확인했으므로 심각도는 **낮음**이다. 점수는 통과율이 아니라 투고 산출물 충실도와 입력 안정성에 대한 판단(A 48/50, B 46/50)이다. 보류 항목은 이 점수에서 추가 감점하지 않았다.

## 95점에 이르기 위해 고쳐야 할 것

1. **우선순위 1 — R6-01:** HWPX의 자기 닫힘 텍스트 노드를 별도로 처리해 문단 사이 길이 합산을 막는다. 정상 문단 두 개를 한 문단으로 오인해 거부하는 새 회귀다.
2. **우선순위 2 — R6-02 / R5-02 잔존:** DOCX 문단 검사와 실제 문단·런 추출이 같은 XML 토큰 해석을 쓰게 한다. 정상 입력을 수용하게 되었어도 그 안의 글자나 빈 문단을 조용히 빠뜨리면 해소가 아니다.
3. **후속 완결 — R5-03 잔존:** 디코딩 길이에 줄바꿈도 포함한다. 이 우회는 이전 버전에도 있어 새 회귀로 세지 않았다.

## 대상·방법

- `git branch --show-current`: main. `git log -5 --oneline`: HEAD `52a4068`, 감사 반영 커밋 `2c8faf0`, 직전 감사 대상 `ab39000`. 이번 코드 변경 비교는 `ab39000..2c8faf0`이다.
- 브리프를 마지막 **ASTRA 6차 안내**까지 읽고, 5차 보고서와 조치표의 **ASTRA 5차 조치**를 확인했다. 운영규정과 관련 검증·안내 문서를 함께 검토했다.
- 기존 round6의 round5 재현 스크립트 사본을 이어 썼다. `setup.mjs`를 다시 실행해 현재 src를 복사하고 결과를 재생성했다. 비교용 app/parse/structure는 `git show ab39000:src/<파일>.js`의 바이트를 round6 안에 저장했다. 오래된 JSON을 이번 결과로 사용하지 않았다.
- 제품 파일은 수정하지 않았다. 임시 파일·소스 사본·가상 원고·실원고 사본·산출물·로그는 모두 `tests/audit_astra/round6/` 아래다. 보고서와 새 파일 이름에는 원고 식별정보를 쓰지 않았다. 외부 전송 없이 로컬 Node·WASM·VM으로 실행했다.
- UI 검사는 실제 관리 화면 콜백을 가상 DOM·localStorage에서 실행한 것이다. 실제 브라우저·Word·한컴의 조판·인쇄·접근성 및 독립 판독기는 **확인 못 함**.

## 5차 발견 재판정

명령 접두사는 `node tests/audit_astra/round6/`이다. 기본 재현 통과와 확장 조건의 잔존을 구분했다.

| 항목 | 판정 | 수치·근거 | 스크립트 |
|---|---|---|---|
| R5-01 자기 닫힘 이름공간 스택 | 해소 | 기존 scope·scope-wml 2/2: 각 1문단·2자·경고 0. 접두사 2종×끝 공백 4종 및 중첩 범위 복원 8/8: 각 2문단·4자 | delta-xml, probes6 |
| R5-02 정상 XML 거부·스캐너 | 부분 해소 | 기존 comment-tail·gt 2/2 수용. 확장 주석 앞/중간/뒤·처리 지시·런·표 6/6 글 보존. 손상 2/2 거부. 그러나 속성에 `>`가 든 빈 문단 2조건은 각 1문단 누락, CDATA 태그 문자열 1조건은 5자 누락 | delta-xml, extended6 |
| R5-03 디코딩 문단 길이 | 부분 해소 | 기본 경계 6/6 통과. 문자 참조·보조평면 4/4, 각주 실제 파일 3/3, 중첩 길이 단위 검사 5/5 통과. 자기 닫힘 t 2조건 정상 입력 거부, 줄바꿈 1조건 200,001자 수용 | exact-boundary, extended6, notes6 |
| R5-04 인용 전체 괄호 | 해소 | 기존 괄호 혼합 인용과 무괄호 대조군 2/2. 제목 4종×외곽 괄호 4종 16/16 국내 쪽수만 변환, 국외 쪽수 보존 | followup, extended6 |
| N-03 잔존 / F-04 | 해소 | 내장 format 30곳 실제 불러오기→저장 30/30, format 변경 0/30, 값 손실 205→0. 잘못된 역할 값 5/5 제거, 객체 2/2 유지. 부호·타입·상하한 50/50 | ui-extended, new-cases, extended6, probes6 |

N-05 보호 검사에는 홑낫표·겹낫표·괄호·곡선 쌍따옴표 안의 가상 제목을 사용했다. 외곽은 없음·반각·전각·이중 반각이다. 역할 맵 검사에서 문자열·숫자·불리언·null·배열은 제거되고 빈 객체 및 음수 서식 객체는 유지됐다. 내장 format 보존과 재정제 안정성은 모두 30/30이다.

## 새 발견

### R6-01 — 자기 닫힘 hp:t가 다음 문단까지 삼켜 정상 HWPX 거부

- 위치: `src/parse.js:117`, `src/parse.js:122`, 호출부 `src/parse.js:29`.
- 재현: `node tests/audit_astra/round6/extended6.mjs`, `empty-text-cross`·`empty-text-space-cross`. 가상 파일은 `fixtures/r6-empty-text-cross.hwpx` 등이다.
- 기대: 100,001자 문단 두 개의 최장 길이는 100,001이며 수용한다.
- 실제: `<hp:t/>` 또는 `<hp:t />`가 첫 문단 끝에 있으면 최장 길이를 **200,002**로 계산하여 2/2 거부한다(6·7ms). `ab39000`은 두 파일 모두 수용하고 문단 길이 `[100001,100001]`를 반환한다. 빈 노드가 없는 경우와 `<hp:t></hp:t>` 대조군은 현재도 수용한다.
- 원인: 텍스트 정규식이 자기 닫힘 t를 여는 태그로 보고 다음 문단의 `</hp:t>`까지 소비한다. 사이의 `</hp:p><hp:p>`가 길이 스택에 전달되지 않는다.

직접 만든 재현 구조(반복 표기는 설명이며 실제 파일에는 반복 글자를 넣었다):

```xml
<hp:p><hp:run><hp:t>가 × 100001</hp:t><hp:t/></hp:run></hp:p>
<hp:p><hp:run><hp:t>가 × 100001</hp:t></hp:run></hp:p>
```

국소 수정안은 자기 닫힘 t 대안을 먼저 두고, 본문 캡처가 없는 t는 길이 0으로 처리하는 것이다.

```js
const TOK = /<hp:p\b[^>]*?(\/?)>|<\/hp:p>|<hp:t\b[^>]*\/\s*>|<hp:t\b[^>]*>([\s\S]*?)<\/hp:t>/g;
// 기존 문단 시작/끝 분기 다음:
if (m[2] === undefined) continue;
```

이 수정과 아래 줄바꿈 수정의 감사 전용 VM 검사는 `probes6.mjs`에서 3/3 기대 길이를 냈다. 제품에는 적용하지 않았다. 장기적으로는 따옴표·주석·CDATA와 요소 경계를 인식하는 토큰 스캐너를 공유해야 한다. 위 정규식 조각을 완전한 XML 파서라고 보증하지 않는다.

### R6-02 — 새 문단 짝 검사는 CDATA를 통과시키지만 실제 추출은 그 안의 태그 문자열에 걸림

- 위치: `src/parse.js:303`(검사), `src/parse.js:194`·`:196`(문단 추출), `src/parse.js:321`(텍스트 추출).
- 재현: `node tests/audit_astra/round6/extended6.mjs`, `cdata-tag`.
- 가상 조각:

```xml
<w:p><w:r><w:t><![CDATA[<w:p>]]></w:t></w:r></w:p>
```

- 기대: 정상 문단 1개, 문자 데이터 `<w:p>` **5자**.
- 실제: `ab39000`에서는 오류로 거부. 현재는 **1문단·0자·경고 0**으로 성공한다. 기존 CDATA 미지원이 이번 수용 경로 확대로 무경고 손실로 노출된 변화다. 이전에 올바르게 보존하던 5자를 이번에 잃었다는 뜻은 아니다.
- 원인: 검사기는 CDATA 내부를 건너뛰지만 `findClose`와 `elements`는 원문 `indexOf`를 사용한다. CDATA 내부 `<w:p>`도 문단으로 센다. 주석·처리 지시에서의 건너뛰기는 유효하지만 모든 XML 문자 데이터 경계까지 해결하지 못했다.

수정 방향은 **동일한 토큰 결과**로 문단 검사·요소 추출·런 문자 추출을 수행하는 것이다. 아래는 필요한 보조 함수의 계약 예시이며 그대로 붙이는 완성 패치는 아니다.

```js
const tokens = tokenizeXml(xml); // 따옴표, 주석, PI, CDATA를 구별
checkParagraphBalance(tokens);
for (const p of elementsFromTokens(tokens, 'w:p')) {
  // CDATA는 raw 문자 데이터, 일반 text만 문자 참조 디코딩
  const text = textTokens(p).map(t =>
    t.kind === 'cdata' ? t.value : decodeXml(t.value)
  ).join('');
}
```

이 변경은 각주·미주·런에도 동일하게 적용해야 한다. 완성 토크나이저 패치와 그 제품 통합 검증은 **확인 못 함**.

## 확장 검사에서 확인한 기존 잔존 — 새 회귀 수와 분리

| 잔존 | 기대 / 실제 | 이전 버전과 관계 | 위치 |
|---|---|---|---|
| 속성값 `>`가 있는 자기 닫힘 빈 문단 | 첫 위치 2문단→1, 중간 위치 3문단→2. 뒤의 정상 글 2·4자는 보존 | 이전에는 전체 거부, 이번에는 수용하나 빈 문단 보존은 미완성 | `src/parse.js:194` |
| 균형 잡힌 주석 속 가상 문단 | 정상 2문단·4자 / 3문단·6자, 주석 2자 혼입 | 이전과 동일, 새 결함 아님 | `src/parse.js:192` |
| 일반 CDATA | 2자 / 구문까지 포함한 14자 | 이전과 동일 | `src/parse.js:321` |
| HWPX 줄바꿈 길이 | 글 200,000자+줄바꿈 1 = 200,001, 거부 / 검사 200,000으로 수용, 실제 파싱 200,001 | 이전도 수용. R5-03 방어 미완성 | `src/parse.js:122` |

앞 세 항목은 R6-02의 공유 토큰 처리로 함께 해결하는 것이 적절하다. 빈 문단을 단순히 건너뛰면 원고 빈 줄을 보존할 수 없다. 마지막 항목의 국소 수정 예시는 다음과 같다.

```js
const raw = m[2]
  .replace(/<hp:lineBreak\b[^>]*\/\s*>/g, '\n')
  .replace(/<[^>]+>/g, '');
const n = stack.at(-1) + decodeXml(raw).length;
```

다른 제어문자의 길이도 실제 파싱 결과와 일치하도록 별도 정의해야 한다. 이번에는 줄바꿈만 재현·국소 수정 검사했다.

## 길이 경계 수치

단위는 구현과 같은 UTF-16이다. 시간은 다른 검사와 병행한 Node 측정으로, 브라우저 정지 시간이나 정밀 벤치마크가 아니다.

| 입력 | 기대 | 현재 | 근거 |
|---|---|---|---|
| 단일 t 199,999 | 수용 | 199,999자, 10,813ms | exact-boundary |
| 단일 t 200,000 | 수용 | 200,000자, 10,499ms | exact-boundary |
| 단일 t 200,001 | 거부 | 거부, 24ms | exact-boundary |
| t 둘에 분할한 200,001 | 거부 | 거부, 10ms | exact-boundary |
| 십진 문자 참조 50,000 | 수용 | 50,000자, 806ms | exact-boundary |
| 속성 있는 t 200,001 | 거부 | 거부, 7ms | exact-boundary |
| 16진 문자 참조 200,000 / 200,001 | 수용 / 거부 | 기대대로 2/2 | extended6 |
| 보조평면 문자 참조 100,000 / 100,001개 | UTF-16 200,000 수용 / 200,002 거부 | 기대대로 2/2 | extended6 |
| 본문 150,000 + 각주 문단 150,000 | 별도 집계·수용 | 본문·각주 각각 150,000 | notes6 |
| 각주 문단 200,000 / 200,001 | 수용 / 거부 | 기대대로 2/2 | notes6 |
| 각주 뒤 본문 재개·자기 닫힘 문단 등 | 중첩 스택의 독립 길이 | 단위 검사 5/5 | extended6 |

## A 충실도 재실행

학회는 koli·ricc·dongak이다. 파싱→역할 인식→목차→재배열→규정 쪽수→빈 줄 적용 결과를 기대 모델로 두고 저장 파일을 재판독했다. 문자 차이는 UTF-16 위치별로 센다.

| 대상 | 파일 수 | 비교 문단 | 본문 UTF-16 | 각주 UTF-16 | 본문 불일치 | 각주 불일치 / 위치 |
|---|---:|---:|---:|---:|---:|---:|
| paper1~5 × 3, HWP | 15 | 2,105 | 363,035 | 69,029 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWP | 120 | 104,454 | 4,009,755 | 0 | 0 | 0 / 0 |
| paper1~5 × 3, HWPX | 15 | 2,105 | 363,035 | 69,029 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWPX | 120 | 104,454 | 4,009,755 | 0 | 0 | 0 / 0 |

- 형식별 각주 537개. 문단 수 차이·각주 수·각주 문단 배열·번호 없음 여부 차이는 모두 0이다.
- HWP 135개 기존 활성 강조(B/I/U/위첨자) 손실: 본문 0·각주 0. 학회 규정이 우선인 제목류 굵기는 제외했다. HWP/HWPX 135쌍의 글자별 강조 대칭 차이: 본문 0·각주 0.
- 가상 16종×3학회 HWP 48개: 259문단·2,139자·각주 27개, 본문·각주·위치·기존 강조 손실 0. 이 수치는 별도 경계 실패가 없다는 뜻이 아니다.
- 라벨·주제어 치환 예외는 형식별 265문단(paper 41, pdf 224), 자동 skip은 학회 적용 합계 45문단이다. 라벨 예외의 모든 독립 예상 문자열 및 skip의 의미적 정답은 **확인 못 함**. 예외를 포함한 무조건 무손실 주장으로 읽으면 안 된다.
- PDF 수치는 TXT 파싱본 기준이며 각주 객체가 0개다. 원 PDF의 각주·강조·시각 서식 복구는 **확인 못 함**.
- 재판독도 같은 rhwp 엔진을 사용했다. 원본 파싱 이전 손실, 두 형식에 동시에 추가된 잘못된 강조, 원고 전체 역할 판정의 의미적 정답은 **확인 못 함**.

## 보류 항목 — 감점과 별도

- **F-02 익명화 한계:** 이름 꼴 부제와 저자를 규칙만으로 구분하기 어려운 기존 문제. 새 회귀로 계수하지 않았다.
- **F-08 범위 기호·half 좌표·정렬:** 기존 보류 유지. 이번 인용 괄호 검사의 통과가 이 항목의 해소를 뜻하지 않는다.
- **F-11 검증 도구:** 감사의 엄격 대조를 제품 회귀 게이트로 편입하는 작업은 보류. 이번 감사 하네스를 제품 검증 도구의 완결로 간주하지 않았다.
- **Worker 분리:** 보류. 정상 200,000자 입력의 수용에 약 10초가 걸린 측정은 남기되, Worker 부재를 새 감점으로 더하지 않았다.

## 실행 명령과 증거

저장소 루트에서 아래 명령을 실행했다. 각 스크립트의 같은 이름 `.json`·`.log`가 round6 아래에 있다. `extended6`은 기대와 다른 결과도 기록 후 exit 0이므로 종료 코드 대신 `pass`와 기대/실제를 읽었다.

```text
git status --short
git branch --show-current
git log -5 --oneline
git diff ab39000 2c8faf0 -- src/parse.js src/structure.js src/app.js
git show ab39000:src/app.js
git show ab39000:src/parse.js
git show ab39000:src/structure.js
node tests/audit_astra/round6/setup.mjs
node tests/audit_astra/round6/delta-xml.mjs
node tests/audit_astra/round6/regressions.mjs
node tests/audit_astra/round6/additional.mjs
node tests/audit_astra/round6/new-cases.mjs
node tests/audit_astra/round6/followup.mjs
node tests/audit_astra/round6/ui-extended.mjs
node tests/audit_astra/round6/exact-boundary.mjs
node tests/audit_astra/round6/extended6.mjs
node tests/audit_astra/round6/notes6.mjs
node tests/audit_astra/round6/probes6.mjs
node tests/audit_astra/round6/batch.mjs
node tests/audit_astra/round6/supplement.mjs
node tests/audit_astra/round6/output-emphasis.mjs
node tests/audit_astra/round6/synthetic.mjs
node tests/audit_astra/round6/fixture-strict.mjs
node tests/audit_astra/round6/package-check.mjs
node tests/audit_astra/round6/functional.mjs
node tests/audit_astra/round6/ui-functions.mjs
node tests/audit_astra/round6/extra.mjs
node tests/audit_astra/round6/integrity.mjs
node tests/audit_astra/round6/final-check.mjs
```

준비 스크립트의 `decodeXml` 추출이 함수 선언을 찾도록 되어 있어 최초 extended6 실행이 실패했다. 실제 const 선언을 추출하도록 수정했다. 이어 가상 HWPX 생성기가 바탕 글자 2자를 남기는 것을 확인해 모든 t를 교체하고 재실행했다. 최종 `extended6.json`은 이 두 하네스 오류를 수정한 결과다. PowerShell 인용 실패 1회도 있었으며 제품 오류로 세지 않았다. 과거 보고서를 쓰는 `checkpoint.mjs`와 과거 기대에 고정된 `baseline-confirm.mjs`는 실행하지 않았다.

`probes6.json`: 이름공간 8·수치 검증 50·국소 수정 검사 3 = 61/61 통과. 배포본 19,563,046바이트, SHA-256 `bc9148506d327946c6adc761b1a887b75c4d071d8a34174721ec93b455b79c46`: 해시 파일 일치, 내장 자산 34개 및 WASM 원본 일치. 전체 빌드 재현과 배포본에서의 모든 재현 실행은 **확인 못 함**.

최종 `final-check.json`으로 HEAD 불변, 보호 파일 해시 변화 0, 현재 src와 실행 snapshot 차이 0, 엄격 산출물 270개 실패 0을 확인했다. 이 보고서 외 제품 추적 파일 변경은 없다.
