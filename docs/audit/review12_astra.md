점수: 99/100

# ASTRA 12차 충실도 재감사

대상: `c457511202816d95dfe4fd7fc206264596d909a5` (2026-10-14). **R11-01~03의 원래 재현은 모두 해소됐다. 이번 변경에서 새로 확인한 회귀는 Keywords 서술문 오분류 1건이다.** 동일 원인을 가상 TXT 3개로 재현하고 HWP·HWPX 저장까지 확인했다. 82학회 164개 저장 왕복 검사는 실패 0이다.

점수는 검사 통과율이 아니라 지정된 변경 범위의 투고 산출물 충실도 평가다. 새 역할 오분류에만 1점을 감점했다. 기존 보류·이전 회차 제외 실패는 감점하지 않았다. 실제 원고에서 영향을 조사하지 않았으므로 관측 심각도는 **낮음**이다. 99점은 제품 전체의 완전성이나 실제 한컴 조판을 보증하는 점수가 아니다.

## R12-01 — 새 kwProse 조건이 완결된 영문 서술문을 Keywords로 흡수

- 위치: `src/structure.js:153`~`:156`, 특히 `:155`의 `kwProse`와 `:156`의 이어짐 조건.
- 심각도: 낮음. 이번 변경의 신규 회귀, 감점 1.
- 재현: 저장소 루트에서 `node tests/audit_astra/round12/new12.mjs`.
- 증거: `tests/audit_astra/round12/new12.json`, `fixtures/r12-prose-*.txt`, `outputs/r12-prose-*.hwp`·`*.hwpx`.

가상 입력은 아래와 같다. 마지막 줄만 표의 각 문장으로 바꾼다.

```text
Abstract
This synthetic abstract is complete.
Keywords: fiction,
In the experiment readers selected stories.
```

| 마지막 줄 | 기대 / 직전 9c76d74 | 현재 |
|---|---|---|
| `In the experiment readers selected stories.` | abstractEn | keywordsEn |
| `AI changes narrative interpretation.` | abstractEn | keywordsEn |
| `I examine narrative memory.` | abstractEn | keywordsEn |

모두 동사가 있는 완결문이다. 첫 문장은 둘째 낱말 `the`가 제외 목록에 걸리고, 나머지는 첫 두 글자 조건 `/^[A-Z][a-z]/`를 만족하지 않아 서술문 근거가 없다고 처리된다. 앞 Keywords 줄이 쉼표로 끝났다는 이유로 이 문장들이 나열에 흡수된다. 둘째 낱말이 관사인 것 또는 첫 단어가 약어·한 글자인 것은 서술문이 아니라는 근거가 아니다.

TXT 파싱 → 구조 인식 → HWP·HWPX 저장 → 재파싱에서 3문장의 글자는 모두 보존됐다. **글자 소실이 아니라 역할 및 문단 서식 오류**다. 동일 현재 엔진·학회(`koli`, 규정값 경로)에서 마지막 역할만 기대값으로 바꾼 대조 산출물과 비교하면, 3건 모두 HWPX 문단 모양 참조가 기대 `11` 대신 `19`이다. 글자 모양 참조는 둘 다 `5`다. 실제 한컴 화면의 시각 차이는 측정하지 않았다.

대조군 `Readers interpret narrative.`와 `The participants read stories.`는 계속 `abstractEn`, R11-02의 `the narrative self.`·`the theory of fiction.` 및 일반 나열 `memory, narrative`는 기대대로 `keywordsEn`이다. 새 검사 8조건 중 5일치·3불일치는 위 한 원인의 재현이며, 3개 결함으로 중복 계수하지 않았다.

수정 방향: 새 대소문자·둘째 낱말 조건을 서술문 판정의 필수조건으로 삼지 않는다. 명사구 보존과 문장 배제를 함께 검증하며, 동사 및 문장 구조에 대한 추가 근거를 사용하거나 불확실한 줄을 사용자 구조 확인 대상으로 남긴다. 단순히 이전 kwProse로 되돌리면 R11-02가 재발한다.

```js
// 설계 방향만 제시. 완성 패치 또는 검증된 영문 문법 판별기가 아니다.
const kwProse = sentenceEnded && !hasListSeparators
  && hasPredicateEvidence(t); // 전치사구·약어·I로 시작하는 문장도 평가
// noun-control 2건과 prose-control 및 신규 3문장을 함께 회귀 검사한다.
```

## 11차 수정의 해소 확인

| 검사 | 이번 실행 결과 |
|---|---|
| R11-01 range/prefix/full 각주 경계 | 모델 offset 18·16·3; HWP·HWPX 6개도 모두 같은 기대값 |
| R11-02 마지막 명사구 | 2/2 keywordsEn |
| R11-03 정제 도구 | 가상 각주 3개 모두 정제, 비공개 표식 잔존 0; 조종 문자 5→5 |
| new11 숫자 강조·다문단 각주 | 12조건 및 24산출물 일치; keep/half/full × 공백·탭·NBSP·전각 공백 |
| new11 쪽수 옵션 | pageSpace·pageSpaceLatin·pageUnitLatin same/전각 하이픈 3조건 유지 |
| new11 beforeReferences | 해당 4학회에서 본문→주제어→참고문헌 유지 |
| matrix11 | 82학회 HWP·HWPX 164개; 글자·각주 내용·위치·2문단 배열·숫자 강조 실패 0 |
| 추가 경계 검사 | 가상 4문장 93개 유효 UTF-16 경계의 모델 위치 모두 일치 |

추가 경계 검사는 범위 기호, 여러 낫표, 낫표와 쪽수의 합성, 세미콜론을 사이에 둔 반복 locator, 보조평면 글자를 포함한다. 기대 문자열과 각주 위치는 독립적인 고정값이다. 93개는 모델 검사 수이며 93개 파일 왕복을 했다는 뜻이 아니다. 저장 왕복은 원래 11차 재현과 매트릭스로 확인했다.

매트릭스는 같은 가상 원고를 교정한 모델과 산출물을 비교한다. 모든 원문→모델 변환이 의미적으로 옳다는 증거는 아니다. 신규 R12-01처럼 역할 판정은 별도 기대값이 필요하다.

## 정제 도구 및 재정제 바탕틀 13개

대상은 `koreall`, `wooree`, `hanemun`, `cakoll`, `krdiaspora`, `hansung`, `ewha`, `litedu`, `liteligion`, `ctt`, `vc`, `culind`, `mcc`이다. `9c76d74`의 해당 Git 객체와 현재 파일을 동일 엔진으로 열어 비교했다. 원문 텍스트·개인 이메일은 보고서나 검사 JSON에 기록하지 않았다.

- 13개 모두 HWPX header XML 해시 동일, 조종 문자 종류·순서 동일, `resolveRoles`가 선택한 역할별 ps·cs·valueCs 및 각주 ps·cs 차이 0.
- section XML에서 `sample@example.org` 외 이메일 정규식 일치 0. 이것은 모든 개인정보·이미지·바이너리의 정제 완전성을 증명하지 않는다.
- 바이너리는 11개 변경, `vc`·`culind` 2개는 직전과 동일하다. 재정제 실행 여부와 최종 바이트 변경 여부는 구분했다.
- 전체 중첩 문단·런까지 세면 `cakoll`은 문단 244→243, `mcc`는 1158→1157이며, `koreall`·`litedu`는 런이 각 1개 늘었다. `hansung`·`mcc`의 fwSpace, `ewha`의 tab 개수도 달라졌다. 따라서 “모든 XML 구조가 동일하다”고 결론 내리지 않았다.
- 위 차이는 실제 역할별 서식 선택 변화로 이어지지 않았고, 82학회 가상 저장 검사도 통과했다. 가상 원고로 산출물 결함을 재현하지 못한 차이를 새 결함으로 계수하거나 감점하지 않았다.

근거: `templates12.json`, `templates12.mjs`. 정제 도구 원래 재현의 근거는 `sanitize11.log`, `summary11.json`이다. 이번 검사에서 정제 도구의 추가 신규 결함은 확정하지 못했다.

## 10차 및 보조 재현

| 검사 | 결과 및 해석 |
|---|---|
| probes10 | 24조건 중 23일치; 기존 `list-non-ga`만 불일치, 제외 |
| boundary10 | XML 토큰 12/12, quote 1/1, 반복 locator 2/2 |
| emphasis10 | 3조건 모델·HWP·HWPX 모두 숫자 강조 일치 |
| extended10 | 13행 재실행; 강조 7조건 유지. 역할 3조건은 직전 9c76d74와 동일 |
| errata10 | 2행 모두 기존 uncited=1 유지, 제외 |
| probes7 / probes8 | 31/31 / 40/40 관측 기대 일치 |
| probes9 | 정상 XML 56/56; 전체 68패키지 중 의도된 비정상 12개는 정상 분모에서 제외 |
| notes6 / notes7 | 3/3 / 4/4 |
| extended6 | 50행, 판정 43개 중 27일치·기존 혼합 인용 16불일치, 제외 |
| exact-boundary | 6조건의 허용/거부 기대 일치 |

R10-01~04의 원래 재현은 유지된다. 다만 R10-03 문장 배제의 다른 입력군이 이번 수정으로 다시 실패한다는 것이 R12-01이다. `extended10`의 `toc-boundary-next`·`keywords-author`는 기대값과 다르지만 실제 직전 모듈과 동일하다(`new12.json`의 `existingRoleChecks`). 오래된 하네스의 `previous` 출력만 보고 이번 회귀로 오인하지 않았다.

## 실행·재현 방법

11차 루트의 실행 스크립트·보조 baseline 파일과 가상 fixtures를 `round12`로 복사하고 쓰기 경로를 변경했다. 현재 소스는 저장소 루트에서 setup으로 다시 복사했다. 기존 실행 JSON·로그를 이번 결과로 재사용하지 않았다. 과거 `checkpoint.mjs`·`final-check.mjs` 등은 실행하지 않았다.

아래 명령은 모두 저장소 루트 기준이다. 개별 실행의 stdout은 같은 round12 안의 동명 `.log`에 보존했다.

```powershell
node tests/audit_astra/round12/setup.mjs
python tests/audit_astra/round12/extract-baseline.py
node tests/audit_astra/round12/new11.mjs
node tests/audit_astra/round12/matrix11.mjs
node tests/audit_astra/round12/probes10.mjs
node tests/audit_astra/round12/boundary10.mjs
node tests/audit_astra/round12/emphasis10.mjs
node tests/audit_astra/round12/extended10.mjs
node tests/audit_astra/round12/errata10.mjs
node tools/sanitize_template.mjs tests/audit_astra/round12/fixtures/sanitize-input.hwp tests/audit_astra/round12/outputs/sanitize-output.hwp
node tests/audit_astra/round12/probes7.mjs
node tests/audit_astra/round12/probes8.mjs
node tests/audit_astra/round12/probes9.mjs
node tests/audit_astra/round12/notes6.mjs
node tests/audit_astra/round12/notes7.mjs
node tests/audit_astra/round12/extended6.mjs
node tests/audit_astra/round12/exact-boundary.mjs
node tests/audit_astra/round12/new12.mjs
node tests/audit_astra/round12/templates12.mjs
node tests/audit_astra/round12/summary11.mjs
git diff --check -- src tools templates docs/audit/review12_astra.md tests/audit_astra/round12
```

직전 비교는 `9c76d74:src/structure.js`와 현재 모듈을 동일 현재 journals·engine과 결합해 수행했다. 과거 제품 전체 실행은 아니다. `new11`의 기존 `previous`는 더 오래된 `c602f7e` 기준이며, 신규 회귀의 직전 근거로 쓰지 않았다. 실행 종료 코드 0과 기대값 일치는 구분했다.

## 제외 범위와 무결성

F-02 익명화 한계, F-08 기존 범위 기호·half 좌표·정렬, F-11 검증 도구, Worker 분리 및 위 기존 실패는 감점하지 않았다. 실제 원고·PDF·`tests/corpus/`는 읽거나 쓰지 않았다. 독립 HWP 판독, 실제 한컴 조판, 학회 규정 수치의 타당성, 모든 중첩 객체의 개인정보 검사는 수행하지 않았다.

`summary11.json`의 현재 소스/snapshot 차이 0, setup 당시 보호 대상(src·dist·release·templates·forms·README) 해시 변화 0. 제품 코드·바탕틀 수정, 빌드, 커밋·배포는 하지 않았다. 쓰기는 `tests/audit_astra/round12/`와 이 보고서에만 했다.
