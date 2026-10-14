점수: 94/100

# ASTRA 11차 충실도 재감사

대상: `9c76d74775587015229dbfe5bc154ae3ac1290c5` (2026-10-14). **10차 R10-01~R10-04의 원래 재현은 모두 해소, 새 결함은 3건**이다. 모두 직접 만든 가상 원고로 재현했다. 각주 위치 회귀는 DOCX 입력부터 HWP·HWPX 저장·재파싱까지 확인했다. 보류 항목과 10차가 제외한 기존 실패는 감점하지 않았다.

점수는 검사 통과율이 아니라 투고 산출물 충실도 판단이다. 새 각주 경계 회귀 −3, 정상 Keywords 나열의 역할 회귀 −1, 추가 범위의 바탕틀 정제 누락 −2로 94점이다. 실제 원고에서의 영향은 이번에 조사하지 않았으므로 발견의 관측 심각도는 브리프에 따라 모두 **낮음**으로 둔다. 정제 누락이 실제 배포 바탕틀에 존재한다고 주장하지 않는다.

## 95점에 이르기 위해 고쳐야 할 것

1. **R11-01:** 교체 문자 앞에 있던 각주가 교체 문자 뒤로 넘어가지 않도록, 글자 대응표와 별도로 경계 대응을 보존한다.
2. **R11-03:** `Sample`·`제목` 등이 포함되었다는 이유만으로 각주 문장 전체를 정제 대상에서 제외하지 않는다.
3. **R11-02:** 문장 부호와 단어 수만으로 마지막 명사구 주제어를 서술문으로 판정하지 않는다. 기존 `Readers interpret narrative.` 제외도 유지해야 한다.

## 재개 방법과 범위

- `brief_round3.md`를 끝의 ASTRA 11차 안내 및 같은 날 추가 범위까지, `review10_astra.md`와 `response_round3_fidelity.md`의 ASTRA 10차 조치·외부 말뭉치 2회차 조치표를 확인했다.
- 중단 시점 `manifest.json`의 HEAD는 `5a5d390`이었다. 그때의 결과를 현재 HEAD의 검사로 재사용하지 않았다. `manifest-interrupted.json`으로 보존하고 `setup.mjs`로 현재 소스를 다시 복사했다.
- 새 회귀의 직전 비교는 실제 Git 객체 `c602f7e:src/structure.js`를 `snapshot/src/pre11-structure.js`로 추출해 수행했다. 같은 현재 journals 및 engine을 사용한 구조 모듈 비교이다. 과거 제품 전체 실행은 아니다.
- 기존 복사 하네스의 `previous`는 더 오래된 모듈인 경우가 있다. 그것을 이번 회귀의 직전 근거로 쓰지 않았다.
- 복사된 Python 검사 4개에 남아 있던 `round10` 쓰기 경로를 **실행 전에** `round11`로 바꿨다. 과거 `checkpoint.mjs`·`final-check.mjs`는 실행하지 않았다.
- 실제 원고·PDF 말뭉치는 사용하지 않았다. `tests/corpus/`는 읽거나 쓰지 않았다. 쓰기는 `tests/audit_astra/round11/` 및 이 보고서에만 했다. 제품 수정·빌드·커밋·배포는 하지 않았다.

## R11-01 — 글자 대응표가 치환 시작 경계의 각주를 뒤로 이동

- 심각도: 낮음. 새 회귀.
- 위치: `src/structure.js:343`의 `norg.push(-1)`, `:401`의 `mapOff`, `:412`의 각주 offset 재구성.
- 재현: `node tests/audit_astra/round11/new11.mjs`.
- 입력: `fixtures/range-anchor.docx`, `prefix-anchor.docx`, `full-anchor.docx`. 결과: 같은 이름의 `outputs/*.hwp`, `*.hwpx` 및 `new11.json`.

아래 `|`는 글자가 아니라 각주 삽입 경계이다. 각주 내용은 모두 `가상 주석`이다. DOCX를 파싱한 원래 offset도 JSON에 기록했다.

| 가상 입력과 설정 | 기대 | 현재 모델 및 HWP·HWPX | UTF-16 offset: 원본 / 직전 / 현재 |
|---|---|---|---|
| `홍가상, 가상서, 2020, 12|-14쪽.`; `pageUnit:'쪽', marks:'keep'` | `12|~14쪽.` | `12~|14쪽.` | 18 / 18 / 19 |
| `홍가상, 가상서, 2020, |12쪽.`; `pageUnit:'p.', marks:'keep'` | `|p.12.` | `p.|12.` | 16 / 16 / 18 |
| `가상 |｢제목｣ 본문`; `pageUnit:'keep', marks:'full'` | `가상 |「제목」 본문` | `가상 「|제목」 본문` | 3 / 3 / 4 |

3입력 모두 직전 모듈에서는 기대 offset이고 현재에서는 이동한다. 산출물 6개도 각각 잘못된 모델의 offset을 그대로 보존했다. 첫 사례는 길이가 같은 한 글자 교체이고 `marks:'keep'`이므로 기존 half 좌표 보류와 무관하게 회귀를 확정할 수 있다. 셋째 사례는 같은 원인의 확장 재현이며 따로 감점하지 않았다.

원인: 새로 만든 문자는 `org=-1`이다. `mapOff`는 `org >= 원래 offset`인 첫 생존 문자만 찾으므로, 각주가 교체 구간의 시작에 있어도 새 교체 문자를 전부 건너뛴다. 강조용 `eff`는 이 경계 문제를 해결하지 못한다.

수정 방향: 문자의 출처와 **원문 문자 사이 경계**의 출처를 별도로 합성한다. 교체 시작 경계는 교체 시작으로, 교체 끝 경계는 교체 끝으로 보내고, 유지된 숫자 내부 경계는 숫자 대응을 따른다. 새 단위를 앞/뒤 어디에 붙이는지에 대한 방향도 명시한다.

```js
// 개념 예시: trackReplace가 문자 대응과 함께 경계 대응을 합성한다.
// 단순히 org=-1을 eff로 바꾸면 단위 이동과 다중 치환이 다시 어긋날 수 있다.
const mapOff = (r, p) => r.boundaries[p];
// replace [a,b) -> [c,d): boundaries[a]=c, boundaries[b]=d
// 내부의 유지 문자 경계는 실제 대응으로 채운다.
```

이는 설계 제안이며 완성 패치를 시험한 것은 아니다. 최소 합격 조건은 위 3개 offset과 기존 숫자 강조 3조건을 동시에 보존하는 것이다.

## R11-02 — 마침표로 끝나는 정상 명사구 주제어를 초록 본문으로 분류

- 심각도: 낮음. 새 회귀.
- 위치: `src/structure.js:153`~`:154`, `kwProse` 및 Keywords 이어짐 조건.
- 재현: `node tests/audit_astra/round11/new11.mjs`; 가상 TXT `fixtures/kw-3.txt`, `kw-4.txt`.

```text
Abstract
This synthetic abstract is complete.
Keywords: memory,
the narrative self.
```

마지막 줄을 `the theory of fiction.`으로 바꾼 두 번째 가상 원고도 동일하다. 두 줄 모두 서술 동사가 없는 명사구이며 앞 Keywords 나열의 마지막 항목이다.

| 마지막 줄 | 기대 / c602f7e | 현재 |
|---|---|---|
| `the narrative self.` | keywordsEn | abstractEn |
| `the theory of fiction.` | keywordsEn | abstractEn |

2/2 회귀다. 글자가 지워지는 문제는 아니지만 주제어 영역과 글자 모양 적용 대상이 바뀐다. 이번 검사는 역할 단계의 의미적 오분류를 확정하며 실제 한컴 조판의 시각 차이까지 측정한 것은 아니다.

원인: `kwProse`가 단어 3개 이상·문장부호 종결·쉼표 없음만으로 서술문을 확정한다. 이전 R10-03의 문장 사례를 고치면서 여러 단어로 된 마지막 명사구까지 배제했다.

수정 방향: 주제어 나열 문맥에서 서술문을 확정할 근거가 있는 경우에만 제외한다. 알려진 명사구를 보존하는 예외를 무한히 늘리기보다 구분이 불확실한 줄은 구조 확인 대상으로 남기는 편이 안전하다.

```js
// 개념: 단어 수는 서술문의 충분조건이 아니다.
const kwProse = endsSentence && !continuationList && hasPredicateEvidence(t);
// hasPredicateEvidence는 새 구현·검증이 필요하다.
```

기존 `Readers interpret narrative.`는 현재 `abstractEn`으로 정상이다. 위 개념을 적용했다는 주장이나 그 기존 검사가 계속 통과한다는 주장은 하지 않는다. 두 명사구와 기존 서술문을 묶어 회귀 검사해야 한다.

## R11-03 — 바탕틀 정제 도구가 견본 단어를 포함한 원문 각주 전체를 보존

- 심각도: 낮음(가상 원고에서만 검증). 11차 안내의 추가 범위 ⑤에서 확인한 새 결함.
- 위치: `tools/sanitize_template.mjs:48`, `:66`.
- 재현: 다음 명령. 입력은 `new11.mjs`가 직접 만든 HWP이며 제3자 원고가 아니다.

```text
node tests/audit_astra/round11/new11.mjs
node tools/sanitize_template.mjs tests/audit_astra/round11/fixtures/sanitize-input.hwp tests/audit_astra/round11/outputs/sanitize-output.hwp
node tests/audit_astra/round11/summary11.mjs
```

| 가상 각주 입력 | 기대 | 정제 후 HWP 재파싱 |
|---|---|---|
| `Sample analysis by Fictional Person, 2099, secret-marker-A.` | 원문 이름·표식 제거 | 문장 전체 유지 |
| `논문의 제목 분석: 가상인, 비공개표식B.` | 원문 이름·표식 제거 | 문장 전체 유지 |
| `Ordinary analysis by Fictional Person, secret-marker-C.` | 원문 이름·표식 제거 | `Sample`로 치환 |

3각주 중 2개에서 가상 원문 표식이 남는다. `sanitize11.log`와 `summary11.json`에 결과가 있다. 도구의 조종 문자 개수는 5→5이며, 개수 보존 검사는 정제의 성공을 증명하지 못한다.

원인: `PH = /견본|Sample|sample, text|제목|Title/`가 부분 일치를 허용하고 `PH.test(T)`이면 문단 전체를 건너뛴다. 본문을 견본으로 바꾼 뒤의 XML 2차 처리에서 각주 안의 평범한 단어 `Sample` 또는 `제목`까지 이미 정제된 증거로 취급한다.

수정 방향: 이미 정제한 문단은 문단 식별자로 관리한다. 문자열 검사를 유지해야 한다면 정확한 견본 문자열의 전체 일치만 허용하고, 주변에 원문이 남으면 반드시 다시 정제한다.

```js
// 최소 수정 후보. 부분 포함 검사보다 좁은 범위이며 추가 회귀 검증이 필요하다.
const placeholders = new Set([
  '견본', '견본 문장입니다.', '견본, 시험', '제목',
  'Sample', 'Sample text.', 'sample, text', 'Title'
]);
if (placeholders.has(T) || ([...T].length <= 30 && LABEL.test(T))) continue;
```

현재 배포 바탕틀의 개인정보 잔존 여부, 머리말·글상자·표 등 모든 중첩 객체의 정제 완전성은 이번 가상 각주 재현으로 증명하지 않았다. 기존 F-02의 저자 자동 추정·익명화 한계와 별개의 신규 도구 결함이다.

## 10차 재현과 추가 검증 결과

모든 아래 수치는 현재 HEAD로 스냅샷을 갱신한 뒤 다시 실행한 결과이다. 프로세스 종료 코드 0과 기대값 일치를 구분했다.

| 검사 | 결과 | 판정 |
|---|---|---|
| probes10 | 24조건 중 23일치, `list-non-ga` 1불일치 | 의도된 기존 제한만 남음, 감점 제외 |
| boundary10 | XML 토큰 12/12, 명시적 quote 1/1, 반복 locator 2/2 | R10-02·04 해소 |
| emphasis10 | 3입력의 모델 및 HWP·HWPX 6개 모두 숫자 강조 일치 | R10-01 원래 재현 해소 |
| Keywords 서술문·실제 줄바꿈 | probes10 둘 다 통과 | R10-03 원래 재현 해소 |
| probes7 / probes8 | 31/31 / 40/40 관측 기대 일치 | 기존 XML 회귀 없음; 모두 정상 XML이라는 뜻은 아님 |
| probes9 | 정상 XML 56/56, 전체 패키지 68 | 비정상 12개를 정상 분모에 포함하지 않음 |
| notes6 / notes7 | 3/3 / 4/4 | 각주 길이 경계 유지 |
| extended6 | 50행, 판정 43개 중 27통과·기존 혼합 인용 16불일치 | 기존 실패를 새 결함으로 계수하지 않음 |
| exact-boundary | 6경계의 허용/거부가 기대대로 | 상한 이하·정확한 상한 허용, 초과 거부 |
| XML 독립 검사 | r7 21 part 중 19 정상, r8 70 중 66 정상, r9 68패키지 중 56 정상 | 의도된 비정상 fixture 포함 |
| extended10 | 13행 재실행 | 점선 목차 뒤 본문 제목 사례는 현재 h1로 해소. 기존 정오표 실패는 제외 |
| errata10 | 2행 모두 국외 책 uncited=1 관측 | 10차 제외 항목, 새 실패로 계수하지 않음 |
| 숫자 강조·다문단 각주 | 12조건, 24산출물 모두 기대 일치 | keep/half/full × 공백·탭·NBSP·전각 공백, 반복 locator·보조평면 문자·2문단 각주 |
| 새 쪽수 옵션 | pageSpace / pageSpaceLatin / pageUnitLatin same + 전각 하이픈, 3조건 기대대로 | 새 실패 관측 없음 |
| beforeReferences | 해당 4학회에서 본문→주제어→참고문헌 순서 | 새 실패 관측 없음 |
| 학회 82곳 가상 저장 왕복 | HWP·HWPX 164개, 글자·각주 내용·offset·문단 배열·숫자 강조 실패 0 | 아래 한계 참조 |

82학회 검사는 제목·장 제목·본문과 두 문단 각주를 가진 동일한 가상 원고를 사용했다. 바탕틀이 있는 학회는 실제 등록 바탕틀을 적용했다. 글자·각주 내용은 교정 모델과 대조했으며, 각주 위치 4와 숫자 강조 `2020121412` / `20201214`는 가상 원본의 고정 기대값과 대조했다. 산출물은 `outputs/matrix11-*`, 결과는 `matrix11.json`에 있다.

이 매트릭스는 **원문→교정 모델의 모든 변환이 의미적으로 옳다는 증거가 아니다.** R11-01은 그 경계를 별도로 검사해야 발견된다. 학회 규정 수치의 옳고 그름, 실제 한컴 조판, 30개 신규 학회 전체 역할·표지·모든 바탕틀 객체, 실제 원고의 충실도를 전수 검증했다고 주장하지 않는다. 점선 목차와 역할 규칙 A~G도 기존 재현 및 지정 경계를 확인했으며 전체 조합을 소진한 것은 아니다.

## 실행 명령

저장소 루트에서 실행했다. 아래 하네스의 출력 경로는 모두 round11이다.

```text
node tests/audit_astra/round11/setup.mjs
node tests/audit_astra/round11/probes10.mjs
node tests/audit_astra/round11/boundary10.mjs
node tests/audit_astra/round11/emphasis10.mjs
node tests/audit_astra/round11/extended10.mjs
node tests/audit_astra/round11/errata10.mjs
node tests/audit_astra/round11/probes7.mjs
node tests/audit_astra/round11/probes8.mjs
node tests/audit_astra/round11/probes9.mjs
node tests/audit_astra/round11/notes6.mjs
node tests/audit_astra/round11/notes7.mjs
node tests/audit_astra/round11/extended6.mjs
node tests/audit_astra/round11/exact-boundary.mjs
python tests/audit_astra/round11/xml-validity.py
python tests/audit_astra/round11/xml-validity8.py
python tests/audit_astra/round11/oracle8.py
python tests/audit_astra/round11/oracle9.py
node tests/audit_astra/round11/new11.mjs
node tests/audit_astra/round11/matrix11.mjs
node tools/sanitize_template.mjs tests/audit_astra/round11/fixtures/sanitize-input.hwp tests/audit_astra/round11/outputs/sanitize-output.hwp
node tests/audit_astra/round11/summary11.mjs
git diff --check
```

준비 과정의 Node 자식 프로세스 `git show` 호출은 EPERM으로 실패했다. 직접 PowerShell에서 `git show`를 실행해 UTF-8로 round11에 저장한 뒤 비교했다. 이는 제품 실패가 아니다. 하네스는 제품 결함을 관측해 JSON에 기록하는 도구이므로 종료 코드만으로 통과 판정하면 안 된다.

## 보류와 최종 무결성

- F-02 익명화 한계, F-08 기존 범위 기호·half 좌표·정렬, F-11 검증 도구, Worker 분리: 감점 제외. 전체 해소를 주장하지 않는다.
- 가나다 ‘나’ 시작, extended6의 혼합 인용 16조건, 기존 정오표 미인용 실패: 감점 제외.
- 새로운 `citeLang` 결함은 이번 검사에서 확정하지 못했다. 반복 locator 원래 재현과 기본 혼합 언어 경계는 통과했다.
- 현재 소스와 실행 snapshot 차이 0, 재개 시 기록한 src·dist·release·templates·forms·README 해시 변화 0. 근거: `summary11.json` 및 `manifest.json`.
- 실제 원고 재검증·독립 HWP 판독·시각 조판은 수행하지 않았다. 10차의 실원고 270개 통과 수치를 이번 실적으로 가져오지 않았다.

보고서 외 작업 파일은 round11에만 남겼다. 수정 제안은 보고서에만 있으며 제품 코드는 변경하지 않았다.
