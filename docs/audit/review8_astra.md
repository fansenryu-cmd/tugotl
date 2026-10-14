점수: 94/100

# ASTRA 8차 재감사 — astra8

대상은 main `3239387510042809823aa65be2c0c8d815c0ad52`이다. **R7-01과 6차 재판정 5항목은 해소 6·부분 해소 0·그대로 0**이다. 다만 이번 정규식 대안 결합으로 **새 회귀 R8-01 한 건**을 확인했다. 처리 지시 안의 CDATA 시작 모양이 뒤 실제 주석 안의 종료 모양과 연결되어 정상 XML의 본문·각주·미주 문단 또는 스타일 이름을 지운다. 가상 입력에서만 재현되므로 심각도는 **낮음**이다. 실원고 5편·PDF 파싱본 40건 × 3학회 × HWP/HWPX 270개에서는 아래 예외를 제외한 본문·각주 불일치가 0이다. 점수는 통과율이 아니라 조용한 내용 누락이 남은 입력 안정성과 산출물 충실도에 대한 판단이다.

## 95점에 이르기 위해 고쳐야 할 것

1. **우선순위 1 — R8-01:** `part()`에서 처리 지시와 따옴표 있는 태그도 같은 순회로 소비한다. 처리 지시 안의 `<![CDATA[`를 CDATA 시작으로 읽지 않아야 한다. 본문 1문단·2자가 경고 없이 0문단이 되는 회귀를 먼저 막는다.
2. **완료 조건:** `probes8`의 `pi-outside` 4경로를 보존하고, R7-01 4조건·기존 DOCX 13조건·길이 경계·실원고 산출물 대조를 유지한다. 아래 수정안은 감사용 사본에서 확장 40/40을 통과했지만 제품 통합과 수정 후 전체 A 재실행은 **확인 못 함**.

## 범위와 준비

`brief_round3.md`를 마지막 **ASTRA 8차 안내**까지, `review7_astra.md`, `response_round3_fidelity.md`의 마지막 **ASTRA 7차 조치**까지 읽었다. 운영규정과 관련 검증·글꼴·README 문서도 확인했다. `git diff cda5d3a HEAD -- src/parse.js`에서 제품 소스 변경은 전처리 한 줄이다.

round7의 `.mjs`·`.py`를 round8로 복사하고 해당 round 경로를 치환했다. fixture만 의존 입력으로 복사했으며 과거 JSON·로그·산출물을 결과로 재사용하지 않았다. `setup.mjs`로 현재 src를 snapshot에 복사하고 보호 파일 해시를 기록했다. 비교용 parse/app/structure는 `git show cda5d3a:src/<이름>.js`를 Python subprocess로 바이트 보존하여 저장했다. 따라서 이번 `previous`는 **7차 대상 cda5d3a**이고 6차 수치는 7차 보고서에 기록된 역사적 수치와 구분한다.

임시 파일·번호 원고 사본·산출물·수정 제안 사본은 모두 `tests/audit_astra/round8/` 아래다. `tests/corpus/`는 읽거나 쓰지 않았다. 제품 경로·README는 수정하지 않았다. 시작부터 있던 `docs/audit/brief_round3.md`의 미커밋 변경은 보존했다. 실제 원고의 제목·저자·문장은 보고서와 새 파일명에 기록하지 않았다.

## R7-01과 6차 잔존 재판정

길이는 UTF-16 단위다. 명령은 아래 실행 목록의 같은 이름 `.mjs`이다.

| 항목 | 판정 | 이전 기록 → 현재 관측 | 근거 |
|---|---|---|---|
| R7-01 CDATA 안 주석 모양 | 해소 | 본문·각주·미주 각각 2 → 9자; 경계 횡단 거부 → 2문단 [6,1]. 4/4 | probes7 |
| R6-01 자기 닫힘 hp:t | 해소 | 6차 최장 200,002·거부 → 현재 최장 100,001·수용, 실제 [100001,100001]. 두 표기 2/2 | extended6 |
| R6-02 CDATA 태그 문자열 | 해소 | 6차 0 → 현재 `<w:p>` 5자, 경고 0. 7차 확장 주석 문제도 위 4/4 해소 | extended6, probes7 |
| 잔존: 속성값 `>`와 빈 문단 | 해소 | 앞 빈 문단 포함 2개, 중간 포함 3개 그대로 보존. 2/2 | extended6 |
| 잔존: 일반 CDATA | 해소 | 6차 구문 포함 14 → 현재 내용 2자. 특수문자·참조 모양·인접 CDATA 추가 3/3 | extended6, probes7 |
| 잔존: 줄바꿈 길이 | 해소 | 6차 200,000으로 세어 수용 → 현재 200,001로 계산·거부. 1/1 | extended6 |

별도 기존 잔존인 균형 잡힌 주석 속 가짜 문단도 2문단·4자로 유지되어 해소다. 새 R8-01은 위 원래 재현이 다시 실패한다는 뜻이 아니라 별도 처리 지시 경계의 회귀다.

## 새 발견 R8-01 — 처리 지시의 CDATA 모양이 뒤 주석까지 삼킴

- 심각도: **낮음**. 가상 DOCX에서만 재현; 실원고·PDF 파싱본 영향 관측 0.
- 위치: **`src/parse.js:167`**, 본문 `:170`, 각주 `:172`, 스타일 `:173`, 미주 `:242`; 스타일 이름 결과 `:217`, `:255`.
- 재현: `node tests/audit_astra/round8/probes8.mjs`의 `pi-outside`.
- 독립 XML 확인: `python tests/audit_astra/round8/xml-validity8.py`, `python tests/audit_astra/round8/oracle8.py`.

직접 만든 최소 가상 조각(WordprocessingML 이름공간을 가진 body 안):

```xml
<?audit <![CDATA[ ?>
<w:p><w:r><w:t>AB</w:t></w:r></w:p>
<!-- ]]> -->
```

`<![CDATA[`는 처리 지시의 데이터이고 `]]>`는 주석의 데이터다. 실제 CDATA 구역은 없다. ElementTree는 정상 파싱하며 본문·각주·미주 각각 1문단·2자를 읽는다. 스타일 대조 fixture는 같은 경계 안에 이름을 가진 style 요소 1개를 둔다. XML 문법 유효성은 확인했으나 전체 OOXML 스키마 적합성과 Word 생성 가능성은 **확인 못 함**.

| 경로 | 기대 / 이전 cda5d3a | 현재 3239387 | 경고 |
|---|---|---|---|
| 본문 | 1문단·2자, 굵게·기울임 유지 | 0문단·0자 반환 | 0 |
| 각주 | 각주 안 1문단·2자 | 각주 객체는 있으나 문단 0·내용 0자 | 0 |
| 미주→각주 | 각주 안 1문단·2자 | 각주 객체는 있으나 문단 0·내용 0자 | 1, 기존 미주 이동 안내뿐 |
| 스타일 XML | `SyntheticStyle` 이름 1개 | 이름 매핑 소실, `s` ID로 대체 | 0 |

스타일 행은 이름 추출의 회귀이며 보류된 스타일 서식 상속 기능을 검사한 것이 아니다. 본문·각주·미주의 강조도 문단과 함께 사라진다.

원인: 이전에는 실제 주석을 먼저 삭제하여 그 안의 `]]>`도 없어졌다. 현재는 왼쪽에서 먼저 만난 처리 지시 안 `<![CDATA[`가 뒤 주석의 `]]>`까지 한 CDATA로 묶는다. 그 사이 문단·스타일 태그를 모두 문자 참조로 바꿔 추출기가 요소를 찾지 못한다. **동일한 정상 XML에서 이전 보존 → 현재 누락**으로 비교했으므로 새 회귀다.

추가 `pi-cross`는 본문·각주·미주에서 이전에도 처리 지시 등의 문자가 혼입되던 조건이다. 이번 변경으로 실제 주석 `<!-- Q -->` 10자가 추가 혼입되지만 이를 별도의 새 결함으로 중복 계수하지 않았다. 정상 데이터 3자를 기대하는 조건이며 스타일 경로에서는 관측 가능한 이름·본문 차이 0이다.

수정안: 주석·CDATA·처리 지시·태그를 한 순회에서 분리하고, 내용이 아닌 처리 지시는 제거한다.

```js
const token = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
const plain = s.replace(token, (all, cdata) => {
  if (cdata !== undefined) {
    return cdata.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  return /^(<!--|<\?)/.test(all) ? '' : all;
});
```

`patch-check8.mjs`는 round8의 별도 `patched8-parse.js`만 만든다. `probes8` 40조건을 같은 fixture로 재검사하여 **40/40 통과**, 그중 정상 XML 조건 **36/36**이다. 제품 snapshot 원문은 유지했다. DTD·전체 XML 문법을 지원하는 완전한 파서라는 보증은 아니다.

## 요청한 경계 검사와 기존 문제 구분

| 검사 | 결과 |
|---|---|
| CDATA의 `]] >`, `]>`, 여분 `]`, 인접 CDATA로 분리한 실제 `]]>` | 3조건 × 본문·각주·미주·스타일 = 12/12 |
| 주석 속 닫힌/열린 CDATA 시작 모양 | 2조건 × 4경로 = 8/8 |
| CDATA 속 주석 모양 | 4경로 4/4 |
| 속성값 속 이스케이프된 `&lt;!--` | 4경로 4/4 |
| 속성값 속 원시 `<!--` | 4/4 관측 결과 유지. ElementTree가 모두 거부하므로 정상 XML 보존 증거·감점에서 제외 |
| 처리 지시 경계 확장 | 8조건 중 1 통과; 새 온전한 회귀 4조건, 이전부터 혼입 있던 확장 3조건 |
| probes8 전체 XML 문법 | XML part 70개 중 66 정상, 위 원시 속성 4개만 비정상 |
| probes7 w:t 속성값의 `>` | 2/2 기존 실패 유지. 기대 2자 → 실제 5자, 이전 cda5d3a와 같음 |

기존 `w:t` 문제는 `src/parse.js:324`의 `indexOf('>')` 때문이다. 새 발견·추가 감점으로 세지 않았다. 7차 보고서와 동일하게 따옴표 인식 `tagEnd`를 공통화하는 후속안이 적용된다. 스타일 XML의 무시되는 자식 텍스트 자체를 보존한다는 주장은 하지 않는다. 스타일 경로의 성공 기준은 이름 매핑·본문·직접 지정 강조의 보존이다.

## 재실행 수치

| 실행 | 결과 |
|---|---|
| probes7 | 31조건 중 29 통과; 기존 w:t 2실패. R7-01 4/4 해소, 길이 단위 12/12 |
| extended6 | DOCX 13/13, HWPX 9/9, 길이 단위 5/5, 인용 16/16. 역할 7개는 pass 필드 없는 관측값 |
| notes6 | 본문·각주 각각 150,000 분리, 각주 200,000 수용·200,001 거부: 3/3 |
| notes7 | 자기 닫힘 3표기 각주 문단 [100001,100001] 유지, 200,001 거부: 4/4 |
| exact-boundary | 199,999·200,000 수용, 200,001·분할·속성 있는 초과 거부, 문자 참조 50,000 수용: 6/6 |
| xml-validity | 기존 r7 XML 21개 중 19 정상; 의도한 비정상 2개 |
| probes8 / patch-check8 | 제품 33/40(정상 XML만 29/36), 수정 제안 사본 40/40(정상 XML만 36/36) |

`exact-boundary`의 6개 baseline 관측값과 `extended6`의 역할 7개는 pass 플래그가 없으므로 단순 JSON pass 합계를 실패 수로 읽으면 안 된다. 종료 코드만으로 통과 판정하지 않았다.

## A 충실도 재실행

koli·ricc·dongak 3곳에서 파싱→역할 인식→목차→재배열→쪽수 치환→빈 줄 적용을 기대 모델로 만들고 저장한 HWP/HWPX를 다시 파싱하여 비교했다. 이전 결과를 복사한 수치가 아니다.

| 대상 | 산출물 | 비교 문단 | 본문 UTF-16 | 각주 UTF-16 | 본문 불일치 | 각주 불일치 / 위치 |
|---|---:|---:|---:|---:|---:|---:|
| paper1~5 × 3, HWP | 15 | 2,105 | 363,035 | 69,029 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWP | 120 | 104,454 | 4,009,755 | 0 | 0 | 0 / 0 |
| paper1~5 × 3, HWPX | 15 | 2,105 | 363,035 | 69,029 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWPX | 120 | 104,454 | 4,009,755 | 0 | 0 | 0 / 0 |

각 형식 각주 537개. 문단 수 차이·각주 수·각주 문단 배열·번호 없음 여부 불일치는 모두 0이다. HWP 135개의 원본 활성 강조(B/I/U/위첨자) 손실은 본문 0·각주 0이며 학회 규정 우선인 제목류 굵기는 제외했다. HWP/HWPX 135쌍의 글자별 강조 차이는 **본문 0·각주 0**이다(`output-emphasis.json`).

형식별 라벨·주제어 치환 예외는 265문단(paper 41, pdf 224), 학회 적용 합계 자동 skip은 45문단이다. 예외의 독립 예상 문자열과 skip의 의미적 정답은 **확인 못 함**. PDF TXT 파싱본의 각주 객체는 0개이므로 원 PDF 각주·강조·시각 서식 복구는 **확인 못 함**. 재판독도 같은 rhwp 엔진이므로 원본 파싱 전 손실·공통 엔진 오류·양쪽 형식에 동시에 잘못 추가된 강조·전체 역할 배정의 의미적 정답·독립 HWP 판독기 대조는 **확인 못 함**. 브라우저·Word·한컴에서의 조판·인쇄도 **확인 못 함**.

## 보류 — 감점 사유와 별도

- **F-02 익명화 한계:** 이름 꼴 부제와 저자를 규칙만으로 구분하는 기존 한계. 추가 감점 없음.
- **F-08 범위 기호·half 좌표·정렬:** 기존 보류 유지. 추가 감점 없음.
- **F-11 검증 도구:** 엄격 대조를 제품 회귀 게이트에 편입하는 작업은 보류. 감사 하네스로 완료를 주장하지 않음.
- **Worker 분리:** 기존 보류 유지. 긴 입력 응답성의 브라우저 측정은 이번에 확인 못 함. 추가 감점 없음.

## 실행 명령과 증거

아래는 저장소 루트에서 실행했다. 재현 스크립트·JSON·로그는 `tests/audit_astra/round8/`에 있다. 복사와 경로 치환은 Python pathlib/shutil, 비교 소스 추출은 subprocess를 사용했다. 과거 보고서를 쓰는 checkpoint/verdicts, 과거 기대 고정 baseline-confirm, 7차 전처리 문자열을 수정하는 patch-check7은 실행하지 않았다. 관련 없는 B/UI 전체 재감사는 수행하지 않았다.

```text
git status --short
git rev-parse HEAD
git diff cda5d3a HEAD -- src/parse.js
git diff --stat cda5d3a HEAD
git show cda5d3a:src/parse.js
git show cda5d3a:src/app.js
git show cda5d3a:src/structure.js
node tests/audit_astra/round8/setup.mjs
node tests/audit_astra/round8/probes7.mjs
node tests/audit_astra/round8/extended6.mjs
node tests/audit_astra/round8/notes6.mjs
node tests/audit_astra/round8/notes7.mjs
node tests/audit_astra/round8/exact-boundary.mjs
node tests/audit_astra/round8/delta-xml.mjs
python tests/audit_astra/round8/xml-validity.py
node tests/audit_astra/round8/probes8.mjs
python tests/audit_astra/round8/xml-validity8.py
python tests/audit_astra/round8/oracle8.py
node tests/audit_astra/round8/patch-check8.mjs
node tests/audit_astra/round8/batch.mjs
node tests/audit_astra/round8/supplement.mjs
node tests/audit_astra/round8/output-emphasis.mjs
node tests/audit_astra/round8/integrity.mjs
node tests/audit_astra/round8/summarize8.mjs
node tests/audit_astra/round8/final-check.mjs
```

하네스 주의: `pi-outside` 초회에는 빈 본문을 읽는 감사 코드가 TypeError를 냈다. optional 접근과 문단 수 기록으로 수정한 뒤 재실행했으며, 제품은 예외가 아닌 **빈 문단 배열을 정상 반환**한다. Python 인라인 집계 명령 두 건은 셸 인용 오류로 실패하여 파일형 검사·집계 스크립트로 대체했다. 제품 결함으로 세지 않았다.

최종 `final-check.json`: HEAD 불변, 보호 파일 해시 변화 0, 현재 src와 실행 snapshot 차이 0, 산출물 270개 엄격 비교 실패 0. `git status --short`에서 기존 브리프 변경과 새 보고서만 보이며 round8 증거는 저장소의 기존 ignore 규칙 적용 대상이다. 보호 경로는 수정하지 않았다.
