점수: 94/100

# ASTRA 9차 재감사 — astra9

대상은 현재 main `166a39b2f935adea7d9549d3310668162abebec2`이다. **R8-01 원래 재현 4/4와 R7-01·6차 재판정 6항목은 해소**다. 합계 해소 7·부분 해소 0·그대로 0이다. 다만 확장 조건인 문자 노드 안 처리 지시 혼입은 남았고, 이번 변경으로 그 안의 주석 모양까지 추가 혼입되는 **R9-01 한 건(낮음)**을 확인했다. 이는 정상→실패의 새 결함이 아니라 **기존 실패의 오염량 증가**다. 기존 실패 전체를 새 발견으로 세지 않았다.

실원고 5편·PDF 파싱본 40건 × 3학회 × HWP/HWPX **270개**를 다시 만들고 읽었다. 명시한 라벨 예외를 제외한 본문·각주 글자·위치·문단 구조 불일치는 0, HWP/HWPX 135쌍의 강조 차이도 0이다. 점수는 검사 통과율이 아니라 투고용 산출물 충실도에 대한 판단이다. 가상 DOCX의 조용한 구문 혼입이 남고 그 양이 늘어 8차의 94점을 유지한다. 보류 항목은 이 감점에 포함하지 않았다.

## 95점에 이르기 위해 고쳐야 할 것

1. **우선순위 1:** `part()`가 처리 지시를 하나의 토큰으로 소비한 뒤 제거하게 한다. 현재는 통째로 남겨 `w:t` 내부에서 원고 글자로 추출된다. R9-01의 추가 10자와 기존 처리 지시 혼입을 함께 막는다.
2. **완료 조건:** `probes8` 40/40, `probes9`의 처리 지시 관련 정상 XML 32/32, R7-01 4/4, DOCX 기존 구조 13/13을 유지한다. 제안 사본에서는 이를 확인했다. 제품 통합과 제품 수정 뒤 전체 A 재실행은 **확인 못 함**이다.

## 대상과 비교 근거

`docs/audit/brief_round3.md`를 맨 아래 ASTRA 9차 안내까지, `review8_astra.md`, `response_round3_fidelity.md`의 ASTRA 8차 조치와 이후 기록을 읽었다. 운영규정과 선행 검증·글꼴·README 자료도 검토했다. 안내의 a480eb5가 아닌 현재 main을 대상으로 했다. 현재 이력은 `166a39b`, `034e3db`이며 `git cat-file -t 3239387`은 실패했다. 옛 커밋 객체를 직접 조회한 비교라고 주장하지 않는다.

round9는 없어서 round8의 `.mjs`·`.py`와 의존 fixture를 복사하고 `setup.mjs`로 현재 src를 복사했다. 과거 결과 JSON을 현재 결과로 재사용하지 않았다. 비교용 `baseline-parse.js`, `baseline-structure.js`, `baseline-app.js`는 round8의 **실행 snapshot**에서 가져왔다. 세 파일의 SHA-256이 round8 manifest의 src 해시와 모두 일치하며, manifest 대상은 `3239387510042809823aa65be2c0c8d815c0ad52`이다. 현재 parse.js와의 차이는 `:167`의 전처리 한 줄뿐이다(`parse-diff.txt`). 다른 모듈의 후속 변경과 XML 수정의 영향을 구분했다.

## R8-01·7차·6차 재판정

길이는 UTF-16 단위다. 6차의 과거 값은 8차 보고서의 역사적 기록이고, 이번 `previous`는 해시 검증한 8차 snapshot이다.

| 항목 | 판정 | 현재 수치 / 이전과의 관계 | 근거 |
|---|---|---|---|
| R8-01 PI 밖 문단·스타일 소실 | 해소 | 본문·각주·미주 0문단·0자 → 각 1문단·2자, 스타일 이름 0 → 1. 4/4, 직접 굵게·기울임 보존 | probes8 `pi-outside`, oracle8 |
| R7-01 CDATA 안 주석 모양 | 해소 유지 | 본문·각주·미주 9자, 경계 횡단 2문단 [6,1]. 4/4 | probes7 |
| R6-01 자기 닫힘 hp:t | 해소 유지 | 두 표기 모두 최장 100,001, 실제 문단 [100001,100001] 수용. 2/2 | extended6 |
| R6-02 CDATA 태그 문자열 | 해소 유지 | `<w:p>` 5자, 경고 0 | extended6 |
| 잔존: 속성값 >와 빈 문단 | 해소 유지 | 앞 빈 문단 포함 2개, 중간 포함 3개. 2/2 | extended6 |
| 잔존: 일반 CDATA | 해소 유지 | 구문 없이 내용 2자; 특수문자·참조 모양·인접 CDATA 3/3 | extended6, probes7 |
| 잔존: 줄바꿈 길이 | 해소 유지 | 200,001로 계산하여 거부. 1/1 | extended6 |

주석 속 균형 잡힌 가짜 문단도 2문단·4자로 보존한다. 별도로 7차부터 알려진 **w:t 속성값 > 문제는 그대로**다. 본문 원래 2조건은 기대 2자 → 실제 5자이고 이전 snapshot과 동일하다. 이번 각주·미주 확장까지 6조건이 같은 실패다. 위의 “빈 문단 보존”과 다른 경로이므로 합쳐 해소로 표시하지 않았다.

R8-01의 확장 `pi-cross`도 **그대로(미해소)**다. 본문·각주·미주 기대 3자 → 현재 21자, 3/3 실패다. 원래 누락 재현은 해소됐지만 “모든 처리 지시 입력이 해소”라는 의미는 아니다. 원래 7개 항목과 별도로 이 기존 잔존 2종을 세면 **해소 7·부분 해소 0·그대로 2**다.

## 새 악화 R9-01 — 처리 지시 안 주석 모양 10자 추가 혼입

- 심각도: **낮음**. 직접 만든 가상 DOCX에서만 재현했다. 실원고·PDF 대조에서 영향 관측 0.
- 위치: **`src/parse.js:167`**(처리 지시를 보존), **`:324`**(w:t 안 문자열을 그대로 추출). 본문 `:170`, 각주 `:172`, 스타일 `:173`, 미주 `:242`가 같은 전처리를 사용한다.
- 재현: `node tests/audit_astra/round9/probes9.mjs`의 `pi-comment`; 독립 확인 `python tests/audit_astra/round9/oracle9.py`.
- 기대: 처리 지시는 내용이 아니므로 본문·각주·미주에서 각각 `AB` 2자, 굵게·기울임 보존.

직접 만든 가상 조각:

```xml
<w:p><w:r><w:rPr><w:b/><w:i/></w:rPr>
<w:t><?audit <!-- Q --> ?>AB</w:t></w:r></w:p>
```

| 경로 | 8차 snapshot 실제 | 현재 실제 | 새로 늘어난 오염 | 경고 |
|---|---|---|---:|---:|
| 본문 | `<?audit  ?>AB` 13자 | `<?audit <!-- Q --> ?>AB` 23자 | 10자 | 0 |
| 각주 | 위와 같은 13자 | 위와 같은 23자 | 10자 | 0 |
| 미주→각주 | 위와 같은 13자 | 위와 같은 23자 | 10자 | 1, 기존 미주 이동 안내 |
| 스타일 XML | 이름 매핑·본문 유지 | 이름 매핑·본문 유지 | 0 | 0 |

ElementTree가 해당 XML을 정상 파싱하고 w:t 내용 2자를 확인했다. 전체 OOXML 스키마 적합성과 Word가 이 구문을 생성하는지는 **확인 못 함**이다. 스타일 경로에서는 무시되는 aliases 자식의 문자 보존을 요구하지 않고 이름 매핑·본문·직접 강조만 검사했다.

이전에는 잘못된 전역 주석 삭제가 PI 내부 주석 모양도 지웠다. 이제 PI를 통째로 보존하는 것은 토큰 경계 면에서는 맞지만, 뒤 추출기가 PI를 제외하지 않아 10자가 더 나온다. PI 자체 11자 혼입은 이전부터 존재하므로 새 감점으로 중복 계수하지 않았다. `pi-cdata` 3경로는 이전·현재 모두 22자이나 내용이 달라지는 기존 실패의 변형으로 별도 발견에서 제외했다.

수정안: 현재 토큰 정규식을 유지하고 콜백에서 PI도 제거한다.

```js
const plain = s.replace(token, (m0, c) => {
  if (m0.startsWith('<![CDATA[')) {
    return c.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  return m0.startsWith('<!--') || m0.startsWith('<?') ? '' : m0;
});
// token은 현재 :167의 정규식 그대로 사용한다.
```

감사용 `snapshot/src/patched9-parse.js`에서 R9-01 3경로 모두 23 → 2자, `probes8` 40/40, `probes9` 정상 XML 50/56을 확인했다. 남은 6개는 기존 w:t 속성값 > 문제다. `probes7`도 29/31로 기존 2실패만 남는다. 제품 파일은 수정하지 않았다.

## 요청한 경계 검사

| 검사 | 결과 |
|---|---|
| PI의 따옴표 안처럼 보이는 ?>, 문단 밖 | 작은·큰따옴표 × 4경로 8/8. 첫 ?>에서 끝나 뒤 문단 보존 |
| 같은 PI가 w:t 안에 있음 | 본문·각주·미주 6/6 혼입, 이전과 동일. 스타일 이름 정상 |
| PI 안 주석 모양 | 본문·각주·미주 3/3에서 10자 추가 혼입(R9-01); 스타일 정상 |
| PI 안 태그 모양·일반 PI | 본문·각주·미주 6조건 기존 실패 유지; 새 회귀로 세지 않음 |
| p/style 속성의 >, 이스케이프 주석 모양, 서로 다른 따옴표 | 4종 × 4경로 16/16 보존 |
| w:t 속성의 > | 본문·각주·미주 6조건 기존 실패; 스타일 경로는 t 속성 소비 검사가 아님 |
| 태그 따옴표 불균형 | 비정상 XML 8건. 본문 2건 거부, 각주·미주 4건 빈 각주 문단, 스타일 2건 이름 매핑 소실. 모두 이전과 동일 |
| 원시 <!--가 속성값에 있음 | 비정상 XML 4건. 관측상 보존, 정상 XML 성공 근거·감점에서 제외 |
| probes9 전체 | 68패키지 중 XML 정상 56·비정상 12. 정상 32통과·24실패. 위 기존 실패와 새 악화의 합계이며 새 결함 24건이라는 뜻이 아님 |
| probes8 전체 | 40조건 37통과·3기존 실패. 정상 XML만 33/36. part XML 70개 중 66 정상 |

비정상 XML의 pass 플래그는 제외하고 거부 여부를 별도 관측값으로 남겼다. 전체 XML 문법 검증기·비정상 입력 복구 보장은 **확인 못 함**이다.

## A 충실도 재실행

koli·ricc·dongak에서 파싱→역할 인식→목차→재배열→쪽수 치환→빈 줄 적용 모델과 저장·재판독 결과를 대조했다. 과거 산출물을 다시 센 것이 아니다.

| 대상 | 산출물 | 비교 문단 | 본문 UTF-16 | 각주 UTF-16 | 본문 불일치 | 각주 글자 / 위치 불일치 |
|---|---:|---:|---:|---:|---:|---:|
| paper1~5 × 3, HWP | 15 | 2,105 | 363,035 | 69,028 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWP | 120 | 104,400 | 4,009,855 | 0 | 0 | 0 / 0 |
| paper1~5 × 3, HWPX | 15 | 2,105 | 363,035 | 69,028 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWPX | 120 | 104,400 | 4,009,855 | 0 | 0 | 0 / 0 |

각 형식 각주 537개. 문단 수 차이·각주 수·문단 배열·번호 없음 여부 불일치 모두 0이다. HWP 135개의 활성 강조(B/I/U/위첨자) 손실 본문 0·각주 0, HWP/HWPX 135쌍의 글자별 강조 차이 본문 0·각주 0이다. 학회 규정이 우선인 제목류 굵기는 원본 강조 손실에서 제외한다.

라벨·주제어 예외는 형식별 265문단(paper 41, pdf 224), 자동 skip은 학회 적용 합계 45문단이다. 이 예외의 독립 예상 문자열과 skip의 의미적 정답은 **확인 못 함**이다. PDF TXT에는 각주 객체가 0개이므로 원 PDF 각주·강조·시각 서식 복구는 **확인 못 함**이다. 같은 rhwp 재판독의 공통 오류, 파싱 전 손실, 두 형식에 동시에 잘못 추가된 강조, 역할 판정의 의미적 정답, 독립 HWP 판독기·Word·한컴 조판 대조도 **확인 못 함**이다.

8차와 비교하면 형식별 PDF 문단 -54·본문 +100자, paper 각주 합계 -1자다. 현재 main의 후속 역할·쪽수 규칙을 포함하는 모델과 산출물은 일치하지만, 이 차이를 XML 수정 효과나 원고 원문 무손실의 독립 증거로 해석하지 않는다. 번호별 수치 차이는 `A-delta.json`에 기록했다.

## 나머지 재실행 수치와 범위 밖 차이

| 실행 | 결과 |
|---|---|
| probes7 | 29/31, 기존 w:t 2실패; R7-01 4/4, 길이 단위 12/12 |
| extended6 | DOCX 13/13, HWPX 9/9, 길이 단위 5/5; 역할 7개는 pass 없는 관측값 |
| notes6 / notes7 | 3/3, 4/4 |
| exact-boundary | 경계 6/6 기대대로: 199,999·200,000·참조 50,000 수용, 200,001·분할·속성 있는 초과 거부. 별도 baseline 관측 6개 |
| xml-validity | 21 part 중 정상 19, 의도한 비정상 2 |
| integrity | 배포 SHA-256 일치, 내장 자산 34개·WASM 일치 |

**extended6 인용 16조건은 고정 기대값과 16/16 불일치**다. 이전은 가상 혼합 서지 앞쪽 `p. 12`를 `12쪽`으로 바꾸지만 현재는 유지한다. `src/structure.js:210`의 문헌 언어 판정과 `:309`의 분기에서 라틴 필드로 판단하는 후속 변경이 원인이다. parse.js 변경 한 줄의 회귀가 아니므로 이번 새 발견에 넣거나 기대값을 고쳐 통과 처리하지 않았다. 혼합 서지의 의미적 정답은 **확인 못 함**으로 남긴다.

## 보류 — 감점과 별도

- **F-02 익명화 한계:** 이름 꼴 부제와 저자를 규칙만으로 구분하는 한계. 추가 감점 없음.
- **F-08 범위 기호·half 좌표·정렬:** 조치표의 후속 범위 기호 반영은 있으나 이 보류 전체의 해소를 검증하지 않았다. 추가 감점 없음.
- **F-11 검증 도구:** 감사 대조를 제품 게이트에 통합하는 작업은 보류. 감사 하네스로 완료를 주장하지 않는다.
- **Worker 분리:** 보류 유지. 브라우저 응답성 재측정은 확인 못 함. 추가 감점 없음.

## 실행 명령·절차 기록

다음 명령은 저장소 루트에서 실행했다. 각 node 실행 로그와 JSON은 round9에 남겼다. 복사·경로 치환·해시 비교·비교 소스 diff·수정 제안 생성은 Python pathlib/shutil/hashlib/difflib로 수행했다.

```text
git log -5 --oneline
git log -3 --format='%H %s'
git branch --show-current
git status --short
git cat-file -t 3239387
node tests/audit_astra/round9/setup.mjs
node tests/audit_astra/round9/probes7.mjs
node tests/audit_astra/round9/extended6.mjs
node tests/audit_astra/round9/notes6.mjs
node tests/audit_astra/round9/notes7.mjs
node tests/audit_astra/round9/exact-boundary.mjs
node tests/audit_astra/round9/delta-xml.mjs
node tests/audit_astra/round9/probes8.mjs
node tests/audit_astra/round9/probes9.mjs
python tests/audit_astra/round9/xml-validity.py
python tests/audit_astra/round9/xml-validity8.py
python tests/audit_astra/round9/oracle8.py
python tests/audit_astra/round9/oracle9.py
node tests/audit_astra/round9/patch-check9.mjs
node tests/audit_astra/round9/patch-probes8.mjs
node tests/audit_astra/round9/patch-probes7.mjs
node tests/audit_astra/round9/batch.mjs
node tests/audit_astra/round9/supplement.mjs
node tests/audit_astra/round9/output-emphasis.mjs
node tests/audit_astra/round9/integrity.mjs
python tests/audit_astra/round9/summarize9.py
node tests/audit_astra/round9/final-check.mjs
```

제품 변경·빌드·커밋·배포는 하지 않았다. `tests/corpus/`는 읽거나 쓰지 않았다. 원고 파일명은 paper1·pdf-01 같은 번호로만 만들었고 보고서에 실원고 제목·저자·문장을 쓰지 않았다. 보호 경로 `src/`, `dist/`, `release/`, `templates/`, `forms/`, `README.md`의 시작·종료 해시와 snapshot을 검증한다.

최종 `final-check.json`: HEAD 불변, 보호 파일 해시 변화 0, 현재 src와 실행 snapshot 차이 0, 엄격 대조 산출물 270개·실패 0. `git status --short`에는 새 `docs/audit/review9_astra.md`만 표시된다(round9는 기존 ignore 규칙 적용). `git diff --check` 오류 0이다.

**임시 파일 경로 제한의 절차 위반:** 최초 복사 때 `round8/`만 치환하여 Python 스크립트의 슬래시 없는 경로가 남았다. 최초 xml-validity.py·xml-validity8.py·oracle8.py 실행이 round8의 기존 `xml-validity.json`·`xml-validity8.json`·`oracle8.json`을 재작성했다. 이 3개의 실행 전 해시는 기록하지 않아 바이트 불변은 **확인 못 함**이다. 경로를 round9로 고친 뒤 모두 재실행하여 본 보고서는 round9 결과만 사용했다. 따라서 “모든 쓰기가 round9 안이었다”라고 주장하지 않는다. 보호 제품 경로에는 쓰지 않았다. 초기 PowerShell UTF-8 표시 문제와 Python 기본 인코딩 오류도 수정 후 재실행했고 제품 실패로 세지 않았다.
