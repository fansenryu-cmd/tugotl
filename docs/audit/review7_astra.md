점수: 94/100

# ASTRA 7차 재감사 — astra7, main cda5d3a

요청한 5개 항목은 **해소 4·부분 해소 1·그대로 0**이다. 6차의 정확한 재현 조건은 모두 해소됐지만, CDATA 처리의 확장 조건에서 새 전처리가 문자 데이터를 삭제하거나 정상 XML을 거부한다. 새 발견은 **R7-01 한 건**, 심각도는 가상 원고에서만 재현되어 **낮음**이다. 실원고 5편·PDF 파싱본 40건 × 3학회의 HWP/HWPX 270개는 명시한 라벨 예외를 제외하고 본문·각주 불일치 0, 강조 비교도 0이다. 점수는 통과율이 아닌 산출물 충실도·입력 안정성에 대한 판단이며, 아래 보류 항목은 추가 감점하지 않았다.

## 95점에 이르기 위해 고쳐야 할 것

1. **우선순위 1 — R7-01:** 주석과 CDATA를 한 번의 토큰 순회에서 구분한다. CDATA 속 주석 모양 문자열은 원고 글자다. 현재 본문·각주·미주에서 각각 7자가 사라지고, 경계를 가로지르는 경우 문서 전체가 거부된다.
2. **위 수정의 완료 조건:** 아래 4개 실패 재현을 본문·각주·미주 모두에서 통과시키고, 기존 DOCX 13조건·길이 경계·270개 산출물 대조를 유지한다. 감사용 수정 사본에서는 4/4 해소됐지만 제품 통합은 확인 못 함.

## 대상과 실행 범위

- HEAD: `cda5d3a785dcfa98ca91f2fd921e3882d4da0430`. 코드 비교 기준은 6차 대상 `52a4068`이며, 제품 소스 변경은 `src/parse.js`에 한정된다.
- `brief_round3.md`의 마지막 **ASTRA 7차 안내**, `review6_astra.md`, 조치표의 **ASTRA 6차 조치**를 읽었다. 운영규정과 관련 검증·글꼴·README 문서도 확인했다.
- round6의 `.mjs`를 round7로 복사하고 경로를 바꾼 뒤 `setup.mjs`로 현재 src를 복사했다. 비교용 parse/app/structure는 `git show 52a4068:src/<이름>.js` 바이트를 round7에 저장했다. 이전 JSON 결과는 복사해 재사용하지 않았다.
- 가상 fixture와 필요한 의존 fixture, 실원고 번호 사본, 산출물, 로그, 수정 제안 사본은 모두 `tests/audit_astra/round7/` 아래다. 원고를 외부로 전송하지 않았다. 보고서와 새 파일명에는 실원고 제목·저자·문장을 쓰지 않았다.
- 시작 시 `docs/audit/brief_round3.md`에 기존 미커밋 변경이 있었다. 종료 시 `.gitignore`에도 이 감사가 만들지 않은 변경이 나타났다. 둘 다 그대로 보존했다. 제품 파일과 README는 수정하지 않았다.

## 6차 발견 재판정

명령 접두사는 `node tests/audit_astra/round7/`이다. 길이는 UTF-16 단위다.

| 항목 | 판정 | 6차 실제 → 7차 실제 | 근거 |
|---|---|---|---|
| R6-01 자기 닫힘 hp:t | 해소 | 두 형태 모두 최장 200,002·거부 → 최장 100,001·수용. 재파싱 문단 길이 각각 [100001,100001], 2/2 | extended6 |
| R6-02 CDATA 태그 문자열 | 부분 해소 | 원래 재현 `<w:p>`는 0 → 5자, 경고 0으로 해소. 확장 CDATA 주석 문자열은 3경로에서 각 9 → 2자, 경계 횡단 1조건 거부 | extended6, probes7 |
| 잔존: 속성값 `>`와 빈 문단 | 해소 | 앞 빈 문단 2 → 1 누락은 현재 2 유지; 중간 3 → 2 누락은 현재 3 유지. 2/2 | extended6 |
| 잔존: 일반 CDATA | 해소 | 구문 포함 14자 → 실제 글 2자. 추가 `&`, `<`, `>`, 문자 참조 모양, 인접 CDATA 3/3 정확 | extended6, probes7 |
| 잔존: 줄바꿈 길이 | 해소 | 200,001자를 200,000으로 세어 수용 → 200,001로 계산·거부, 1/1 | extended6 |

별도 기존 잔존인 **균형 잡힌 주석의 가짜 문단**도 3문단·6자 → 2문단·4자로 해소됐다. R6-02의 ‘부분 해소’는 원래 재현이 계속 실패한다는 뜻이 아니라, 새 처리의 CDATA 경계 보존이 불완전하다는 뜻이다.

## 새 발견 R7-01 — 주석 제거가 CDATA 문자 데이터까지 삭제

- 위치: **`src/parse.js:167`**, 본문 진입 `:170`, 각주 `:172`, 미주 `:242`.
- 재현: `node tests/audit_astra/round7/probes7.mjs`.
- 실패 ID: `cdata-comment`, `cdata-comment-open`, `footnote`, `endnote`.
- 검증: `python tests/audit_astra/round7/xml-validity.py`. 이 4개 fixture의 관련 XML은 Python ElementTree에서도 정상 파싱된다. Word의 전체 OOXML 스키마 검증은 확인 못 함.

직접 만든 가상 본문 조각:

```xml
<w:p><w:r><w:t><![CDATA[A<!--B-->C]]></w:t></w:r></w:p>
```

| 경로 | 기대 | 현재 | 이전 52a4068 | 변화 |
|---|---|---|---|---|
| 본문 | `A<!--B-->C`, 9자 | `AC`, 2자; 경고 0 | CDATA 구문까지 21자 | 기존 구문 혼입 외에 새로 7자 삭제 |
| 각주 | 같은 9자 | 2자; 경고 0 | 21자 | 새로 7자 삭제 |
| 미주→각주 | 같은 9자 | 2자; 경고 1 | 21자; 경고 1 | 새로 7자 삭제; 경고는 미주 이동 안내 |
| CDATA 안 열린 주석 모양 + 뒤 실제 주석 | 2문단, 길이 [6,1] | 문단 구조 오류로 전체 거부 | 2문단, 길이 [18,1] | 기존 구문 혼입에서 전체 거부로 악화 |

마지막 조건의 직접 만든 조각:

```xml
<w:p><w:r><w:t><![CDATA[A<!--B]]></w:t></w:r></w:p>
<w:p><w:r><w:t>C</w:t></w:r></w:p><!--D-->
```

원인: `s.replace(/<!--[\s\S]*?-->/g, '')`가 CDATA를 구별하지 않고 먼저 실행된다. 첫 사례는 문자 데이터 7자를 지우고, 마지막 사례는 CDATA 안의 `<!--`부터 뒤 실제 주석의 `-->`까지 문단 닫힘과 다음 문단을 함께 지운다. 그 뒤 CDATA 이스케이프로 복구할 수 없다. 이전에도 CDATA를 정확히 읽지는 못했으므로 ‘이전 완전 지원에서의 회귀’라고 주장하지 않는다. **이번 추가 전처리가 만든 새 삭제·거부**를 계수했다.

수정안: 주석·CDATA·처리 지시·따옴표 있는 태그를 하나의 순회로 소비한다. `part()`의 `plain` 계산을 다음 함수 호출로 바꾸는 국소안이다.

```js
function prepareXml(s) {
  const token = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
  return s.replace(token, (all, cdata) => {
    if (cdata !== undefined) {
      return cdata.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    return all.startsWith('<!--') ? '' : all;
  });
}
const plain = prepareXml(s);
```

`node tests/audit_astra/round7/patch-check7.mjs`가 **감사용 사본만** 수정하여 검증했다. 새 실패 4/4 해소, 정상 XML 패키지 17조건 중 15 통과이며 남은 2개는 아래의 이전부터 있던 `runTokens` 속성값 문제다. 이 조각은 DTD 등 모든 XML 문법을 지원하는 완전한 파서라는 보증이 아니다. 제품 통합·전체 재검증은 확인 못 함.

## 요청한 확장 조건과 기존 문제의 분리

| 조건 | 수치·판정 |
|---|---|
| CDATA의 `&<>`, 문자 참조 모양, 인접 CDATA | 3/3 원문 글자 보존. `&amp;&#65;&lt;`는 문자 참조로 다시 해석하지 않음 |
| 실제 주석 안 CDATA 모양 | 1/1 본문 2자 보존, 주석 내용 혼입 0 |
| 속성값의 이스케이프된 CDATA 유사 문자열 | 1/1 본문 2자 보존 |
| 주석 안 `--`, 속성값의 원시 `<![CDATA[` | 2/2 본문 2자 보존. 다만 독립 XML 파서는 두 입력을 거부하므로 정상 문서 보존 증거·새 결함으로 세지 않음 |
| 큰따옴표·작은따옴표 안 `>`: p·r·자기 닫힘 tbl | 6/6 기대 문단·본문 보존. 표는 각 1개 경고 |
| 같은 조건을 w:t에 적용 | 2/2 실패지만 **이전과 동일**. 기대 `AB` 2자 → `B">AB` 또는 `B'>AB` 5자. 새 결함·추가 감점 아님 |
| 자기 닫힘 hp:t × 3표기 × 각주 형제·본문 재개·중첩·줄바꿈 | 길이 함수 12/12 기대값 |
| 실제 HWPX 각주 문단 둘 + 자기 닫힘 hp:t | 3/3 수용, 각주 길이 [100001,100001]; 본문 2자 |
| 실제 HWPX 각주 200,001 + 자기 닫힘 hp:t | 1/1 거부 |

기존 w:t 문제는 `src/parse.js:324`의 `runTokens`가 여전히 `indexOf('>')`를 쓰기 때문이다. 중첩 탐색 `findClose`도 `src/parse.js:185`에서 같은 방식을 쓴다. **새 `tagEnd` 자체의 따옴표 인식은 검사 범위에서 통과**했지만 모든 추출기가 이를 공유하지는 않는다. 이번에는 w:t 기존 문제 2조건만 수치로 재확인했으며 모든 중첩 스캐너 경로는 확인 못 함.

후속 수정 방향은 `tagEnd`를 공통 범위로 옮겨 두 곳에서도 쓰는 것이다. 이번 새 발견 수에는 포함하지 않는다.

```js
// tagEnd를 parseDocx 바깥 공통 보조 함수로 이동한 뒤
// findClose와 runTokens의 태그 시작 위치 a에서:
const gt = tagEnd(src, a); // runTokens에서는 src 대신 r
if (gt < 0) break;        // findClose에서는 return -1
```

## 길이 경계·회귀 수치

| 실행 | 결과 |
|---|---|
| extended6 | DOCX 13/13, HWPX 9/9, 길이 단위 5/5, 인용 16/16. 역할 값 7조건은 관측형 기록으로 pass 플래그 없음 |
| exact-boundary | 199,999·200,000 수용; 200,001·분할 200,001·속성 있는 200,001 거부; 문자 참조 50,000 수용: 6/6 |
| extended6 문자 참조·보조평면 | 각각 경계 수용/초과 거부, 합계 4/4 |
| notes6 | 본문·각주 각각 150,000 분리, 각주 200,000 수용·200,001 거부: 3/3 |
| probes7 + notes7 길이 | 단위 12/12 + 실제 HWPX 4/4 |
| probes6 | 이름공간 8/8, 서식 수치 50/50, 감사용 길이 수정 검사 3/3. 마지막 3개는 제품 원문 검사가 아니며 extended6로 교차 확인 |
| ui-extended | 내장 format 불러오기→저장 30/30, format 변경 0 |
| fixture-strict | 가상 16종 × 3학회 = HWP 48개, 259문단·2,139자·각주 27개. 본문·각주·위치·기존 강조 손실 0 |

정확한 단일 문단 200,000자 수용은 7,827ms, 200,001자 거부는 7ms였다. 병행 실행한 Node 측정이므로 브라우저 응답 시간이나 정밀 벤치마크가 아니다. Worker 문제와 별도다.

## A 충실도 재실행

학회는 koli·ricc·dongak. 파싱→역할 인식→목차→재배열→규정 쪽수→빈 줄 적용 결과를 기대 모델로 만들고, 현재 코드로 저장한 산출물을 다시 파싱하여 UTF-16 위치별로 비교했다.

| 대상 | 파일 수 | 비교 문단 | 본문 UTF-16 | 각주 UTF-16 | 본문 불일치 | 각주 불일치 / 위치 |
|---|---:|---:|---:|---:|---:|---:|
| paper1~5 × 3, HWP | 15 | 2,105 | 363,035 | 69,029 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWP | 120 | 104,454 | 4,009,755 | 0 | 0 | 0 / 0 |
| paper1~5 × 3, HWPX | 15 | 2,105 | 363,035 | 69,029 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWPX | 120 | 104,454 | 4,009,755 | 0 | 0 | 0 / 0 |

- 각 형식 각주 537개. 문단 수 차이·각주 수·문단 배열·번호 없음 여부 차이 모두 0.
- HWP 135개의 원본 활성 강조(B/I/U/위첨자) 손실은 본문 0·각주 0. 학회 규정 우선인 제목류 굵기는 제외했다. HWP/HWPX 135쌍의 글자별 강조 대칭 차이는 본문 0·각주 0.
- 형식별 라벨·주제어 치환 예외 265문단(paper 41, pdf 224), 학회 적용 합계 자동 skip 45문단. 라벨 예외의 모든 독립 예상 문자열과 skip의 의미적 정답은 **확인 못 함**. 무조건 무손실을 뜻하지 않는다.
- PDF는 TXT 파싱본이며 각주 객체 0개다. 원 PDF의 각주·강조·시각 서식 복구는 **확인 못 함**.
- 재판독도 같은 rhwp 엔진이다. 원본 파싱 전 손실, 두 형식에 동시에 잘못 추가된 강조, 전체 역할 배정의 의미적 정답, 독립 HWP 판독기 대조는 **확인 못 함**.
- 실제 브라우저·Word·한컴의 조판·인쇄·접근성은 **확인 못 함**. UI 관련 재실행은 가상 DOM·localStorage의 콜백 검사다.

## 보류 — 감점 사유와 별도

- **F-02 익명화 한계:** 이름 꼴 부제와 저자를 구분하는 기존 한계. 새 회귀·추가 감점 아님.
- **F-08 범위 기호·half 좌표·정렬:** 기존 보류 유지. 이번 스캐너 검사와 별개.
- **F-11 검증 도구:** 엄격 대조를 제품 회귀 게이트에 편입하는 작업은 보류. 감사 하네스로 제품 도구의 완결을 주장하지 않는다.
- **Worker 분리:** 보류. 긴 정상 입력의 처리 시간은 기록했으나 추가 감점하지 않았다.

## 실행 명령·증거·하네스 주의점

저장소 루트에서 실행했다. `.mjs`와 같은 이름의 JSON·로그는 round7 아래에 있다. 관측형 스크립트는 실패 사례가 있어도 exit 0이므로 종료 코드만으로 통과 판정하지 않았다.

```text
git status --short
git rev-parse HEAD
git diff 52a4068 cda5d3a -- src/parse.js
git diff 52a4068 cda5d3a --stat
git show 52a4068:src/parse.js
git show 52a4068:src/structure.js
git show 52a4068:src/app.js
node tests/audit_astra/round7/setup.mjs
node tests/audit_astra/round7/delta-xml.mjs
node tests/audit_astra/round7/extended6.mjs
node tests/audit_astra/round7/notes6.mjs
node tests/audit_astra/round7/exact-boundary.mjs
node tests/audit_astra/round7/regressions.mjs
node tests/audit_astra/round7/additional.mjs
node tests/audit_astra/round7/new-cases.mjs
node tests/audit_astra/round7/followup.mjs
node tests/audit_astra/round7/probes6.mjs
node tests/audit_astra/round7/probes7.mjs
node tests/audit_astra/round7/notes7.mjs
python tests/audit_astra/round7/xml-validity.py
node tests/audit_astra/round7/patch-check7.mjs
node tests/audit_astra/round7/batch.mjs
node tests/audit_astra/round7/supplement.mjs
node tests/audit_astra/round7/output-emphasis.mjs
node tests/audit_astra/round7/synthetic.mjs
node tests/audit_astra/round7/fixture-strict.mjs
node tests/audit_astra/round7/ui-extended.mjs
node tests/audit_astra/round7/package-check.mjs
node tests/audit_astra/round7/functional.mjs
node tests/audit_astra/round7/ui-functions.mjs
node tests/audit_astra/round7/extra.mjs
node tests/audit_astra/round7/integrity.mjs
node tests/audit_astra/round7/final-check.mjs
```

`git show` 세 명령은 Python `subprocess.check_output`으로 바이트를 받아 저장했다. 재실행 준비 시 round6 `.mjs` 경로를 round7로 치환했고, setup 이후 누락된 가상 fixture를 round6에서 보충했다. `exact-boundary` 첫 실행의 fixture 없음과 `ui-extended` 첫 실행의 선행 synthetic 산출물 없음은 의존 파일 준비 후 재실행해 해소했다. XML 유효성 초회 집계에서 ZIP 디렉터리 항목까지 읽은 하네스 실수는 `.xml`만 검사하도록 고쳤다. 최종 21 XML 중 19 정상, 의도한 비정상 2개다.

`new-cases`의 과거 길이 생성기는 첫 t만 교체하여 바탕 글 22자를 남긴다. `legacy-lengths.json`으로 실제 길이 200,021·200,022를 확인했다. 이 둘의 거부를 회귀로 세지 않고 모든 t를 정리하는 `exact-boundary` 결과를 사용했다. `regressions`의 오래된 기대 중 인용 1개·초록 1개는 계속 불일치하지만 이번 변경 영역 밖이며 6차 기록과 같다. UI의 정제 전 잘못된 format 직접 렌더 예외와 역할 재판정 관측값도 이번 새 결함으로 세지 않았다. 과거 보고서를 쓰는 `checkpoint`·`verdicts`와 과거 기대 고정 `baseline-confirm`은 실행하지 않았다.

배포본 19,563,617바이트, SHA-256 `4fc6e0584982051c0716ceb2031f88d0eb6a84895ccc68d93e0f179d7eb2f066`: 해시 파일 일치, 내장 자산 34개·WASM 원본 일치. 전체 빌드 재현·배포본 내부에서 모든 재현 실행은 **확인 못 함**.

최종 `final-check.json`에서 HEAD 불변, 보호 파일 해시 변화 0, 현재 src와 실행 snapshot 차이 0, 엄격 산출물 270개 실패 0을 확인했다. 제품 소스는 수정하지 않았다.
