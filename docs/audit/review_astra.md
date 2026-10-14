# ASTRA 공개 전 코드·품질 감사

감사일: 2026-10-13. 대상: `D:/project/투고틀`. 선행 자료: `review_sonnet.md`, `review_opus.md`, `review_fable.md`, `response_2026-10-13.md`.

## 1. 요약: 71/100, 공개 보류 후 조건부 배포

| 평가 영역 | 배점 | 점수 | 판단 |
|---|---:|---:|---|
| 견고성·입력 검증 | 40 | 27 | 기존 DOCX 시간 폭증과 내장 데이터 덮어쓰기는 개선. 중첩 JSON 검증, TXT 상한, 긴 HWPX 처리·취소는 미완료 |
| 변환 정확성 | 35 | 29 | 지정 77건의 파싱된 본문·각주 내용·위치 보존. 정상 XML 문단 누락, Markdown 각주 위치, 치환 시 강조 손실은 별도 재현 |
| 구조 인식 | 15 | 7 | 정형 HWP는 양호. PDF 추출문의 제목·장절·구획 경계 오류가 반복되고, 잘못된 저자 판정은 익명화 시 내용 삭제로 연결 |
| 코드 품질·배포 | 10 | 8 | 오프라인 단일 HTML·CSP·해시·자산 일치 확인. 테스트가 단언 없이 로그만 내며 UI/CLI 전처리가 분리됨 |
| **합계** | **100** | **71** | **사용자 데이터 복구 불가 경로와 정상 입력 손실을 고친 뒤 공개 권고** |

**즉시 고칠 것:** (1) 중첩 스키마와 안전 부팅, (2) 파일을 읽기 전 크기 확인·모든 형식의 문단/문자/런 상한·Worker 취소, (3) DOCX XML 스캐너의 정상 문단 누락, (4) 낮은 신뢰도의 제목/저자 판정을 삭제 기능과 분리, (5) 정오표의 저자·연도 대조 및 반복 인용 상태.

배포 형태는 **단일 HTML 유지**가 적절하다. 발견된 결함은 Tauri로 포장해도 그대로 남는다. 실제 문서 변환은 AI·서버·외부 통신을 요구하지 않는다. 외부 문헌 검색 링크와 투고처 이동은 사용자가 누르는 별도 동작이다.

### 범위와 증거의 한계

- `src/`, `dist/`, `release/`, `templates/`, `forms/`를 수정하지 않았다. 산출물·검사 스크립트·로그는 `tests/audit_astra/`에만 작성했고, 보고서만 이 경로에 작성했다. `batch.mjs`는 실행하지 않았다.
- 감사 시작의 `src/`, `tools/`, `release/` 파일 해시를 `baseline.json`에 저장했다. 중간 대조는 변경 0개였으나, 보고서 작성 중 다른 작업에서 `src/app.js`, `src/styles.css`, `release/투고틀.html`, `release/투고틀.sha256`가 변경됐다(`final-check.json`). 파서·엔진·구조 인식·정오표·학회 데이터·검증 도구는 변경되지 않았다. 13:58 KST에 최신 UI의 일정 검증 실패를 다시 재현하고 배포본 자산/해시/CSP를 재확인했다(`final-release.json`). app.js 줄 번호는 이 마지막 확인본 기준이며 추가 동시 편집 시 달라질 수 있다.
- Node 25.4.0 및 설치된 rhwp로 실행했다. **브라우저 UI 전체, Firefox/Safari, 실제 한컴오피스의 조판·인쇄 결과는 이번에 실행 검증하지 않았다.** Node의 쪽수는 근사 글자 폭 계산에 따른 값이다.
- 학회 준수 검사는 **journals.js 및 지정 바탕틀과 산출물의 일치**를 검사했다. 48개 학회 최신 외부 규정을 전부 재조사한 인증이 아니다.
- 77건의 “본문 보존”은 파서가 추출한 문단 기준이다. DOCX/HWPX 자료지도는 각각 표 9개·그림 8개가 제외된다는 경고를 낸다. 이를 원본 전체 내용의 무손실로 해석하면 안 된다.

### ‘수정됨’ 항목 재검증

| 대응 기록 | 재확인 결과 | 증거 |
|---|---|---|
| 1 사용자 데이터 검증·초기화 | **부분 수정**. null 항목은 제거하지만 `schedule.upcoming:5`, `[null]`, 예약 id가 여전히 일정 렌더를 깨뜨림. 초기화 버튼은 정상 렌더되는 관리 화면 안에만 있음 | F-01, `edge-results.json`, `extra-results.json` |
| 2 내장 id·바탕틀 덮어쓰기 / javascript URL | **주요 경로 수정**. 내장 id 거부, 내장 키 제거, javascript/data URL 거부. URL 문법·자격증명 검사는 미완료 | F-10 |
| 3 XML 직접 생성으로 속도 개선 | **개선 확인, 시간 상한은 미해결**. 지정 77건 완료. 주 스레드·긴 문단 및 일부 구조 인식 O(n²) 경로는 남음 | F-02 |
| 4 다중 구역 각주 | **수정 확인**. iall 8개·kochih 1개 각주 추출, 각 2구역 경고 정상 | `edge-results.json` |
| 5 각주 위치 | **지정 HWP 표본 수정 확인**. paper1~5 각주 179개×11=1,969회 위치 대조 불일치 0 | `conversion-summary.json` |
| 6 DOCX 스캐너·입력 상한 | **부분 수정**. 5만 런 102ms, 49MiB XML 사전 거부. 정상 XML 공백 누락·TXT 제한 누락은 남음 | F-02/F-03 |
| 7 선행 영문초록 탈출 | **부분 수정**. PDF표본 본문 733블록으로 정상 탈출. PDF표본 전체 폭주 대신 초록 55블록 및 잘못된 제목/저자가 남음 | F-04 |
| 8 CSP·배포 해시 | **정적 확인 완료**. release 해시 일치, WASM·바탕틀·서식 36개 모두 원본 일치 | `release.json`, `final-release.json` |
| 9 URL·숫자 보호 | **표본 수정 확인**. URL·통권 항목 null(변환 보류), Random House Korea 인식, 2판 유지 | `verification.json` |
| 10 정오표 오탐 정비 | **부분 수정**. paper1 noRef 4, formatBad 2. 동명 문헌·반복 인용 결함 및 설명 각주 표시가 남음 | F-05 |
| Fable F1 쪽 나눔 상속 | **수정 확인**. paper2→ktla에서 pageBreakBefore는 Abstract 제목 1개뿐 | `compliance.json` |
| Fable F2 첫 비공백 글자 서식 | **변환은 수정, 표시 경로는 미수정**. koli 저자 11pt·초록 제목 12pt 출력. analyzeTemplate 표시는 각각 10pt | F-09 |
| Fable F3 동일 역할 사이 빈 줄 | **수정 확인**. postcriticism·kopoetics 연속 abstract/ref 사이 불필요 빈 줄 없음 | `verification.json` |
| Fable F4 보호 정규식 | **수정 확인**. 위 서지 4표본 재검증 | `verification.json` |
| Fable F5 PDF 인식 | **부분 수정**. DOI 제거는 유효하나 제목 뒷줄·설명 각주·‘다.’ 조각·머리말 오인은 계속됨 | F-04 및 19표본 표 |

## 2. 중요도순 발견

### F-01 [높음] 사용자 JSON 검증을 통과한 값으로 지속적인 렌더 실패 / 무제한 빈 줄 생성 가능

- 위치: `src/app.js:23`(sanitizeJournal), `:33`(schedule 객체 여부만 확인), `:80`(userSchedule), `:83`~`:85`(배열 순회), `:505`(가져오기 저장), `:508`(관리 화면 안 초기화), `:581`(예외 방어 없는 최초 render). `src/structure.js:178`~`:195`(빈 줄 수만큼 반복).
- 재현: `node tests/audit_astra/edge.mjs`, `node tests/audit_astra/extra.mjs`.

```json
{"journals":[{"id":"zz","journal":"시험","schedule":{"upcoming":5}}]}
```

- 기대: 저장 전에 거부하거나 잘못된 일정만 제거하고 앱 기동.
- 실제: sanitizeJournal 통과 후 nextDeadlines에서 `number 5 is not iterable`. `upcoming:[null]`은 deadline 접근 TypeError. `id:"constructor"`/`"__proto__"`도 통과하며, 기본 `{}` 저장소의 상속 속성을 일정으로 읽어 순회 오류. 전역 프로토타입 오염을 입증한 것은 아니다.
- 선택 id가 localStorage에 남으면 시작 render가 같은 경로를 다시 실행한다. 초기화 버튼도 render 경로 안이라 안전 부팅 수단이 아니다. 함수 수준 Node 재현과 UI 코드 추적으로 확인했으며 실제 브라우저 재부팅 시험은 미실시.
- 추가 정적 위험: JSON 숫자 `1e309`는 Infinity로 파싱된다. `blanks:{beforeBody:1e309}`가 검증을 통과함을 재현했다. applyBlanks는 `k<n`으로 객체를 계속 추가한다. **무한 루프 자체는 실행하지 않았다.** 유한한 거대 숫자도 동일한 자원 고갈 경로다. format 크기·여백·역할 spec도 재귀적 검증이 없다.
- 수정: 허용 필드로 새 객체 구성, id 예약어 거부, 일정 배열/항목/실제 날짜 검증, `Object.hasOwn` 사용, 수치는 `Number.isFinite`와 범위 확인(빈 줄 0~10 등). 저장 전 전체 검증·총량 제한을 적용하고 사용자 데이터 실패 시 내장 데이터만으로 기동하는 별도 복구 화면을 둔다.

```js
const forbiddenIds = new Set(['__proto__', 'prototype', 'constructor']);
const blankCount = v => Number.isInteger(v) && v >= 0 && v <= 10;
const ownArray = (o, key) => o && Object.hasOwn(o, key) && Array.isArray(o[key])
  ? o[key].filter(x => x && typeof x === 'object') : [];
// nextDeadlines에 전달하기 전에 upcoming/deadlines/publish를 각각 검증한다.
// sanitizeJournal은 {...j} 대신 승인된 필드만 복사한다.
```

### F-02 [높음] 크기 제한은 일부 형식에만 적용되고 처리 시간 상한은 없다

- 위치: `src/app.js:283`~`:287`, `:482`; `src/parse.js:11`~`:20`, `:28`, `:39`, `:99`, `:194`~`:214`; `src/structure.js:70`, `:106`, `:163`~`:164`.
- 재현: `node tests/audit_astra/large.mjs`, `node tests/audit_astra/edge.mjs`.

| 입력 | 실제 결과 |
|---|---|
| HWP/HWPX/DOCX/TXT 64MiB+1 바이트 | 파서에서 모두 즉시 거부 |
| 빈 파일 4형식 | 모두 ‘빈 파일입니다’ |
| 100바이트 0 데이터 HWP/HWPX/DOCX | 오류 반환. TXT는 NUL 문자열로 수용 |
| 49MiB DOCX document.xml | 2ms, 압축 해제 전에 48MiB 제한으로 거부 |
| 닫히지 않은 w:p 20만 개, DOCX 1,791B | 13ms, 단 **문단 0·경고 0으로 성공 반환** |
| 5만 런 DOCX 3,137B | 102ms. 기존 2차 스캔 개선 확인 |
| TXT 2,730,038B / 130,004문단 | 6만 문단 상한 통과 → 231ms 안에 재배열 `Maximum call stack size exceeded` |
| ASCII TXT 6,000,001자 | 12ms, 600만 자 상한을 넘는데 수용 |
| HWPX 20,000 / 80,000 / 320,000자 단일 문단 | 107 / 537 / **7,627ms**, 파일은 4,972 / 5,197 / **5,894B** |

- TXT는 문자 수 대신 `bytes.length > MAX_TEXT*2`만 검사한다. 따라서 한글 UTF-8와 ASCII의 허용 글자 수가 다르고 MAX_PARAS 검사가 아예 없다. 이어지는 배열 spread가 스택 한계를 넘는다.
- HWPX 문단 상한은 **new HwpDocument 뒤**에 검사한다. 48MiB XML 제한은 DOCX에만 해당한다. rhwp 내부 방어가 존재할 수 있으나 앱의 명시적 HWPX 해제 총량·문단당 길이·런/각주 수·시간 상한은 없다. 이번 검사는 메모리 폭탄 성공을 주장하지 않는다.
- UI는 `file.size` 확인 전에 arrayBuffer로 전체를 읽는다. 바탕틀 업로드도 파서 공통 상한을 거치지 않는다.
- 구조 인식의 nextNonEmpty는 개선됐지만 front의 `blocks.filter` 및 abstractEn의 `slice/filter/some`는 반복 누적 스캔이다. “구조 인식 전체가 선형”이라고 단정할 수 없다.
- 수정: 읽기 전 file.size 검사, 디코드 후 실제 문자 수 및 문단 수 확인, 문단당 길이·런/각주 수 제한, ZIP 항목 수·해제 총량 검사. spread를 루프로 교체. 파싱/조판을 Blob Worker로 옮기고 취소/시간 초과 때 Worker를 terminate한다. 주 스레드 Promise.race만으로 동기 WASM 실행을 중단할 수 없다. 큰 원고 지원 여부와 허용 시간을 제품 설정으로 명시해야 한다.

### F-03 [높음] 정상 DOCX XML의 줄바꿈을 문단 경계로 인정하지 않아 본문이 조용히 누락된다

- 위치: `src/parse.js:102`~`:120`(elements/stripElements), `:154`~`:160`, `:177`~`:181`(runText).
- 재현: `node tests/audit_astra/edge.mjs`; 파일 `tests/audit_astra/valid-newline.docx`.
- 기대: XML 태그명 뒤 개행·탭도 공백이므로 `<w:p\n>` 안의 “정상 문단” 1개를 읽는다.
- 실제: **문단 0, warnings 0**. 태그 뒤 글자를 `' '`, `'>'`, `'/'`만 허용한다. `<w:t\n...>`도 같은 종류의 누락 가능성이 있다. `attr`는 작은따옴표 속성을 지원하지 않는다.
- 추가 재현: `nested-table.docx`에서 중첩 표 내부 뒤쪽 텍스트 “표 내부 후”가 본문으로 유출됨(표 제거가 첫 닫는 태그에서 끝남). 잘못된 namespace/루트 파일도 w:p 토큰만 있으면 성공한다. `invalid-entity.docx`는 `RangeError: Invalid code point 1114112`를 그대로 반환한다.
- 수정: namespace-aware XML 토큰 파서로 well-formedness와 루트를 검사하고 중첩 깊이를 관리한다. 단기적으로 태그 뒤 XML 공백 `[\x20\t\r\n/>]`, 두 종류 속성 따옴표를 지원하되 이것만으로 XML 검증이 완성되지는 않는다. 필수 본문이 손상되거나 전혀 추출되지 않으면 명시적 오류를 반환한다. footnoteReference와 텍스트가 같은 런에 있으면 `continue`가 텍스트를 버리는 경로도 함께 고쳐야 한다.

### F-04 [높음] PDF 추출문 구조 인식의 오분류가 익명화 때 실제 제목 삭제로 이어질 수 있다

- 위치: `src/structure.js:8`~`:23`, `:66`~`:80`, `:88`~`:117`, `:125`~`:131`; `src/app.js:303`.
- 재현: `node tests/audit_astra/edge.mjs`, `node tests/audit_astra/pdf-inspect.mjs`. 전체 역할은 `structure.json`(src는 **0부터 센 입력 줄 번호**)에 보관.
- 기대: 제목 이어지는 줄은 제목, 설명 각주는 본문/각주, 초록은 해당 구획에만 적용. 확신할 수 없는 부분은 사용자 확인 대상으로 남긴다.
- 실제: 아래 19개 서로 다른 표본에서 반복 오류를 확인했다. `dropAuthor`는 auto 판정 author도 그대로 skip하므로 두 줄 제목의 뒷줄을 삭제할 수 있다. 77건 변환은 익명화 옵션을 켜지 않았으므로 그 검사로 이 경로가 검증되지 않는다.

| 상세 검토 표본(txt) | 확인한 오류 및 정상 경계 |
|---|---|
| PDF표본 | DOI 제외·국문 제목/초록/주제어/ref/영문초록 경계는 잡음. `1)`→titleEn, src50 `다. 이는…`→h4, 설명 각주 4)→h2 |
| PDF표본 | src1 `회귀 모티프 웹소설 창작 실험`→author, src3 저자 줄→h2. 목차 뒤 실제 `1. 서론`도 toc. ref/양쪽 초록 경계는 잡음 |
| PDF표본 | 단독 `―`→title(추출문 자체 제목 결손). `위의 책, pp.245-249.`→h2. 국문초록/Keywords 경계는 인식 |
| PDF표본 | 제목 둘째 줄 `서사 구조 변용`→author, `1)`→titleEn. src135 반복 인용→h2. ref/초록 경계는 인식 |
| PDF표본 | 제목 둘째 줄 `캐릭터 분석`→author, `1)`→titleEn. src103 `PDF표본`→h2 |
| PDF표본 | 제목·초록·주제어·본문 진입 정상. src892 `❍참고문헌`→body, 참고문헌 전체 구획 미인식 |
| PDF표본 | `, , 89`→title, 진짜 제목→author/body. `문제제기1.`→body. 추출 순서·문자 손상 영향도 있음 |
| PDF표본 | src0 실제 이름 `PDF표본`→title(추출문 제목 결손). 뒤의 페이지 머리말→author. ref/Abstract 경계는 인식 |
| PDF표본 | DOI 제외·제목·국문/영문초록 선행 처리 개선. 본문 733블록으로 탈출, refHead 인식 |
| PDF표본 | 페이지 머리말 `… _ 105`→title, 학술지명→author. 표제 없는 국문초록→body. ref/영문초록 경계는 잡음 |
| PDF표본 | 쪽수 75가 붙은 머리말→title, T&I REVIEW→author. 표제 없는 영문초록→body, 영문/국문 주제어는 인식 |
| PDF표본 | DOI 제외·국문 제목 정상. `1)`→titleEn, 반복 인용 각주→h2, `다. 나아가…`→h4 |
| PDF표본 | 제목 둘째 줄 `멜랑콜리아 연구`→author. 설명 각주 1)/3)→h2, src62 `다. 이는…`→h4 |
| PDF표본| 제목 둘째 줄→author. 콜론 위치가 흐트러진 주제어와 `서론. Ⅰ` 미인식 → **abstract 634블록**, 본문·ref·영문초록 미분리 |
| PDF표본 | 본문이 먼저 추출되어 `1. 서 론`→title, 첫 문장→author. 실제 제목 src23~24→body. Keywords 다음 줄→titleEn2. abstractEn 55블록 |
| PDF표본 | 두 줄 제목의 `‘딸깍형’ 변형`→author. 국문/영문초록·주제어·ref 경계는 인식 |
| PDF표본 | 부제→author, 실제 저자 `PDF표본`→body. 표제 없는 국·영문초록이 모두 body; 주제어/ref 경계는 인식 |
| 세로형 한국 숏폼 드라마… | 학술지명→title, ISBN→author. `A B S T R A C T`, `K E Y W O R D S`, `References` 미인식. `58.5%가…`→h2 |
| 웹스토리 IP의 영상화… | 소속 각주→title, 실제 제목→author. `|주제어|` 미인식. 표제 없는 양쪽 초록→body, refHead 인식 |

전체 40파일의 역할 존재 수: title 40, abstractHead 19, keywords 27, h1 33, refHead 20, abstractEnHead 21, keywordsEn 25. **이는 정확도/재현율이 아니다.** 중복 파일이 있고 일부 추출문은 제목·문자·읽기 순서가 이미 손상됐다. 정답 원본 없이 손상 문자를 복원할 수 있다고 주장하지 않는다. PDF표본/52 등의 깨진 글자는 규칙 개선으로 복구할 대상이 아니라 입력 품질 경고 대상이다.

수정안: 경계 라벨 정규화, 앞부분 후보 점수화, 제목 연속 줄과 실제 이름 분리, PDF 줄 결합 전처리(선택 기능), 신뢰도 낮은 author는 익명화 전 확인. 모든 `n)`를 제외하면 실제 절 제목도 잃으므로 출전 표현·이전 줄·번호 연속성·원고 서식 증거를 함께 쓴다. 다음은 **제안 코드이며 소스에 적용하지 않았다**.

```js
// 경계 라벨에만 적용: 원문 본문/제목은 변경하지 않는다.
const label = t => t.normalize('NFKC')
  .replace(/^[❍❚❙▌●■\[<「]+|[❙\]>」]+$/g, '')
  .replace(/\s+/g, '').toLowerCase();
const isRefHead = t => /^(?:\d+[.．])?(?:참고문헌|references|bibliography)$/.test(label(t));
const isAbstractEnHead = t => label(t) === 'abstract';
const keywordLabel = t => /^\|?\s*주\s*제\s*어\s*\|/.test(t)
  || /^key\s*w\s*o\s*r\s*d\s*s?\s*[:：]/i.test(t);

// 앞부분: 첫 줄을 무조건 제목으로 확정하거나 짧은 줄을 이름으로 채우지 않는다.
const plausibleTitle = t => /[가-힣A-Za-z]{2}/.test(t)
  && !/^\s*(?:\d+\)|[-―—]+|저작자표시|Accessed\s*:|Journal of|\*)/.test(t)
  && !headingLike(t);
// 제목 후보 뒤, 이름/부제/경계 표제가 아닌 짧은 줄은 titleContinuation 후보로 보류.
// author는 이름 패턴 또는 명확한 원고 스타일이 있을 때만 확정한다.

const repeatedCitation = t => /^\d+\)\s*.*(?:앞의|위의|같은)\s*(?:책|글|논문)/.test(t);
const decimalSentence = t => /^\d+\.\d+\s*%/.test(t);
const sentenceFragment = (t, prevText) => /^다\.\s/.test(t)
  && prevText && !/[.!?。]$/.test(prevText.trim());
// headCand 계산에 위 제외 단서를 추가하되 서식으로 확인된 장절은 우선한다.
```

국문초록이 634줄까지 이어지는 경우에는 임의로 N번째 줄에서 본문으로 바꾸기보다 “초록 끝을 찾지 못함”을 경고하고 경계 확인을 요청해야 한다. 긴 초록 상태가 반복될 때는 누적 배열 재검색 대신 구획 시작 인덱스·seenKeywords 등의 상태 변수를 유지한다.

### F-05 [중간] 정오표가 다른 저자의 동명 문헌을 일치로 처리하고, 반복 인용이 잘못된 이전 문헌에 연결된다

- 위치: `src/errata.js:15`, `:69`~`:76`, `:78`~`:100`; UI 기본 설정 `src/app.js:40`.
- 재현: `node tests/audit_astra/edge.mjs`, `node tests/audit_astra/errata_test.mjs tests/원고/paper1.hwp koli`.
- 누락 1: 각주 `김철수, 『문학 연구』, 출판사, 2020, 10쪽.` / 참고문헌 `이영희, 『문학 연구』, 출판사, 2021.` → **status ok, noRef 0**. 추출한 author/year를 findRef가 활용하지 않는다.
- 누락 2: A 인용(참고문헌 있음) → B 인용(참고문헌 없음) → `위의 책`에서 마지막 인용을 A로 유지. B는 noref, 바로 다음 반복 인용은 A에 연결되어 ok. 기대는 B의 미확인 상태를 이어받는 것.
- 오탐: 본문 `김철수(2020)`만 인용하고 해당 참고문헌을 두면 uncited=1, 붉은색. 현재 기능 문구는 “각주에서 인용되지 않음”이므로 계산 정의상 사실이나 **본문 인용 방식의 원고에는 검증 불가를 오류처럼 색칠**한다. 적용 가능한 인용 체계부터 판별해야 한다.
- 실제 paper1: footnotes 61, citing 48, noRef 4, formatBad 2, refs 39, uncited 11, refFormatBad 8. 산출은 참고문헌 17개·각주 6개 붉게 표시. 설명성 각주 41(밈 정의)이 noref로 남는다. 이것이 반드시 참고문헌에 들어가야 하는지는 편집 정책에 따라 달라 확정 오류보다 검토 필요가 적합하다.
- **오탐 배제:** 서로 다른 판례 사건번호 테스트는 정상적으로 불일치했다. `RE_CASE`의 3번 캡처는 중첩 그룹 때문에 올바른 사건번호다.
- 수정: 제목 유사도와 별도로 저자/연도 충돌 시 매칭 보류. last를 “최근 성공한 참고문헌”이 아닌 “직전 인용의 키와 해결 상태”로 유지. 본문 인용 미지원은 검증 불가 상태로 분리. 자동 붉은 표시는 기본 ON 요구를 유지하더라도 저장 전에 미확인/확정 오류를 구분한다. 재검사 전 기존 flag를 초기화하여 과거 결과가 남지 않게 한다.

### F-06 [중간] 쪽수 치환은 강조를 실제로 삭제하고 혼합 언어 각주의 외국 문헌 표기를 바꾼다

- 위치: `src/structure.js:210`, `:226`; `src/parse.js:65`~`:73`; `src/engine.js:277`~`:282`.
- 재현: `node tests/audit_astra/extra.mjs`, `node tests/audit_astra/verify.mjs`.
- 기대: 이탤릭 참고문헌에서 `12면`→`12쪽`만 바뀌고 이탤릭 유지.
- 실제: 문자열이 달라지면 runs=[]로 버린다. `tests/audit_astra/substitution.hwp` 재파싱에서 italic=false 확인. 이번 예시는 **문자열 길이조차 동일**하다.
- 혼합 언어: `김철수,…12쪽; Smith, Book, Press, 2021, p.33.` → Smith도 `33쪽`. 각주 전체에 한글이 있는지만 검사한다. 국내/국외 표기를 구분하는 journals.js의 ricc 규칙과 충돌할 수 있다.
- 각주 runs는 파싱 단계에서 모델에 넣지 않고 text만 유지하므로 각주 내부 강조 보존은 77건의 본문 런 검사 범위 밖이다.
- 수정: 치환 구간을 편집 맵으로 기록해 런·각주 offset을 이동한다(런 단위 치환만 하면 런 경계에 걸친 `p.`/숫자를 놓칠 수 있음). 외국 문헌 여부는 인용 항목별로 판별한다. 각주에도 runs 모델을 확장한다.

### F-07 [중간] Markdown 강조 기호를 제거한 뒤 각주 offset을 보정하지 않는다

- 위치: `src/parse.js:203`~`:214`, `src/engine.js:295`.
- 재현: `node tests/audit_astra/extra.mjs`; 산출 `tests/audit_astra/markdown.hwp`.
- 입력: `**강조** 뒤[^1] 끝` 및 `[^1]: 각주`.
- 기대: 출력 `강조 뒤[각주] 끝`, offset 4.
- 실제: 파싱 offset 8(제거 전 기준), 출력 길이 6으로 clamp되어 `강조 뒤 끝[각주]`, offset 6. :213의 shift/acc는 실제 보정에 쓰이지 않는다. 단일 강조 런 문단은 `runs.length > 1` 조건으로 런 자체를 잃는 별도 경로도 있다.
- 수정: 텍스트·강조·각주를 하나의 토큰 처리에서 만들고 출력 글자 수를 기준으로 offset 생성. 단일 강조 런도 보존. 이 합성 사례를 변환 후 재파싱 단언으로 고정한다.

### F-08 [중간] 검증 도구의 강조 유실 22건은 오탐이며 ‘46건 통과’는 46개 단언 통과가 아니다

- 위치: `tools/convert.mjs:26`, `:64`~`:80`의 런 문자열 Set 대조; `tools/pipeline_test.mjs:52` 이후 run/verify 출력.
- 재현: 지정 77건 로그, `node tests/audit_astra/verify.mjs`.
- 실제 paper1의 BI 런 2개가 출력에서 하나로 합쳐졌다. 글자별 B/I/U 비교 결과 **11/11 모두 동일**. raw 검사에는 유실 2×11=22가 기록되지만 실제 손실은 아니다. 같은 강조 문구의 중복도 Set가 지우므로 반대로 누락을 놓칠 수 있다.
- pipeline_test는 46회 변환을 완료했으나 assert/실패 집계가 없다. 이번 실행은 종료 코드 0이고 산출을 재로드했음을 뜻하며, 모든 서식과 의미가 정답이라고 단언한 것은 아니다.
- 수정: 글자별 속성 구간을 병합·정규화해 비교하고 발생 횟수도 보존. 각주 모델 자체의 정확성은 독립 HWPX anchor와 비교해야 한다. 필수 역할/각주/서식에 명시적 assert를 추가하고 mismatch 시 nonzero 종료. UI/CLI의 익명화·정오표·쪽 나눔 전처리를 공유 함수로 옮겨 두 파이프라인이 달라지지 않게 한다.

### F-09 [낮음] koli 변환 서식은 고쳐졌으나 바탕틀 분석 화면은 여전히 틀린 크기를 표시한다

- 위치: `src/engine.js:59` vs `:138`.
- 재현: `node tests/audit_astra/edge.mjs`; `node tools/outcheck.mjs tests/audit_astra/outputs/paper2_koli.hwp 이융희 국문`.
- 기대/실제: analyzeTemplate의 p5 저자와 p14 초록 제목은 **10pt/10pt**. 변환 산출은 **11pt/12pt**로 정상. 분석은 공백 하나만 건너뛰고 변환은 첫 비공백까지 건너뛴다.
- 수정: 첫 비공백 위치 선택 함수를 공용화. 빈 문단·40자 이상 선행 공백에서도 안전하게 처리한다.

### F-10 [낮음] URL 정규식은 스킴 차단에는 유효하지만 유효 URL·호스트 검증은 아니다

- 위치: `src/app.js:22`, `:113`, `:373`, `:391`.
- 재현: `node tests/audit_astra/edge.mjs`.
- javascript/data 스킴 거부는 확인. 반면 `https://[`(잘못된 호스트), `https://trusted.example@evil.example`(실제 목적지 evil.example), 역슬래시 포함 주소는 통과한다. 이를 스크립트 실행 취약점으로 보고하지 않는다. 사용자 학회의 임의 https 링크 자체도 기능상 허용 대상이다.
- 수정: `new URL` 파싱 후 http/https 및 hostname 검사, username/password 거부, 역슬래시·제어문자 거부. UI에 실제 hostname을 표시하고 `noopener noreferrer` 유지.

### F-11 [낮음~중간] 저장 실패를 삼키고 가져오기 성공을 알리는 경로가 남아 있다

- 위치: `src/app.js:18`, `:494`~`:496`, `:505`.
- 근거: lsSet catch가 값을 반환하지 않고 오류를 삼킨다. 학회/바탕틀을 따로 저장한 뒤 성공 alert를 띄운다. 가져오기 상한 60MiB, 바탕틀 한 항목 base64 상한 40MiB는 localStorage 실제 용량과 일치하는 보장이 없다.
- 기대: 두 저장이 모두 성공한 경우에만 성공 표시. 실제: quota 등 실패 시에도 성공 경로 진행 가능. 이번에는 실제 브라우저 quota를 채우지 않고 코드로 확인했다.
- 수정: 저장 결과 반환 및 오류 표시, 검증 후 원자적 교체/롤백, 총량 예산, 큰 바탕틀은 IndexedDB 또는 파일 백업 방식. 새로고침 후 재사용 보장을 테스트한다.

## 3. 학회 규정 대조

`paper2.hwp`를 11곳에 변환한 결과에 대해 `outcheck.mjs` 11회·`probe.mjs` 11회 실행. `compliance.mjs`가 학회별 대표 역할 15개, **총 165문단**의 글꼴·크기·줄간격·정렬과 용지 수치를 대조했다. 규정값 학회는 format, 바탕틀 학회는 지정 문단/스타일과 대조했다.

| 학회 | 용지 mm | 본문 글꼴·크기 / 줄간격 | 삽입 빈 줄 | Node 쪽수 |
|---|---|---|---:|---:|
| koli | 152.0×224.0 | 한컴바탕 10pt / 160% | 30 | 55 |
| daejung | 145.0×215.0 | 한컴바탕 10pt / 160% | 42 | 47 |
| iall | 154.0×225.0 | 한양신명조 10.7pt / 167% | 45 | 53 |
| koreanst | 210.0×297.0 | 바탕 10pt / 160% | 14 | 30 |
| dongak | 153.0×225.0 | 휴먼명조 10.3pt / 177% | 16 | 51 |
| kochih | 153.0×225.0 | 휴먼명조 10pt / 170% | 8 | 44 |
| koreacontents | 188.0×258.0 | 한양신명조 9pt / 165% | 4 | 19 |
| ricc | 210.0×297.0 | 바탕 10pt / 160% | 26 | 30 |
| kolali | 153.0×231.0 | HY신명조 10.5pt / 160% | 26 | 47 |
| eomun | 147.0×210.0 | 바탕 11pt / 160% | 26 | 54 |
| ktla | 152.0×225.0 | 휴먼명조 10pt / 180% | 26 | 57 |

- 용지·여백 불일치 0. 역할의 크기·줄간격·정렬 불일치 0. kochih Abstract 첫 글자의 `fontFamily`는 달라 보였지만 언어별 `fontFamilies` 7개는 완전히 동일했다. 비교 위치의 문자 종류가 달랐으므로 서식 손상으로 세지 않았다.
- koli 저자 11pt, 국문초록 제목 12pt/굵게, h1 13pt/굵게 확인. ktla의 pageBreakBefore는 p199 Abstract 한 곳만 확인.
- 체재: dongak은 body→abstractEn→references, eomun은 body→references→abstractKo→abstractEn 순으로 배치되는 것을 경계 위치와 probe로 확인했다. 나머지도 지정 그룹 순서를 적용했다. 자료에 없는 구획을 새로 창작하지는 않는다.
- 빈 줄 수/전체 문단 수는 계산 블록과 재로드 결과가 11/11 일치(`final-check.json`에서 실제 공백 문단을 별도 집계). 동일 역할 연속 빈 줄 회귀는 별도 합성 입력으로 확인했다. **모든 빈 줄의 인쇄 높이까지 검증한 것은 아니다.**
- 각주 XML에서 크기/줄간격: koli 9/130, daejung 8.5/130, iall 9/130, koreanst 9/130, dongak 8.69/140, kochih 8.6/138, koreacontents 7/145, ricc 9/140, kolali 9.5/130, eomun 9.4/130, ktla 9/150(pt/%). 규정값 4곳의 각주 크기·줄간격은 데이터와 일치. 원시 charPr/paraPr은 verification.json에 저장.
- 쪽수 단위 치환 후 각주 내용 대조는 1,969회 불일치 0. 단위 동등화 비교이므로 치환 자체의 규정 적합성을 보장하지 않는다. 혼합 언어 문제(F-06)와 학회별 범위 기호(`~`, `-` 등) 일괄 정규화 미지원은 남는다.

## 4. 배포 형태·의존성

### 단일 HTML 유지 판정

마지막 확인(13:58 KST) release는 19,479,074바이트. 배포 해시 파일과 실제 SHA-256 일치:

`8ab5da30441851f0d1a9546bf5bf7efa0a0e1a0db7333feabe6512a79aa7f0d7`

이전 검사본은 19,474,621바이트, SHA-256 `8a14ddb3c0ebfe06a731a7d02e28d1a7572ee1a9804248f186efb491ec341c62`였다. 두 시점 결과를 각각 release.json/final-release.json에 보관했다.

WASM 1개·바탕틀 20개·서식 15개, 총 36개 내장 자산이 로컬 원본과 바이트 단위로 일치한다. CSP는 default-src none, connect-src data:/blob:, object-src none을 포함한다. 일반 외부 fetch를 막는 방향이며 inline script는 허용한다. 해시를 HTML과 다른 신뢰 가능한 배포 경로에서 확인해야 출처 확인의 의미가 있다. 이번 감사에서는 빌드를 다시 실행하거나 공개 파일을 덮어쓰지 않았다.

| 선택 | 이 프로젝트에서의 판단 |
|---|---|
| 단일 HTML | 설치 없이 오프라인 사용, 브라우저 파일 선택·샌드박스 활용. 현재 목적에 가장 적합. Blob Worker·입력 제한·저장 오류 처리를 먼저 보강 |
| Tauri | 향후 OS 파일 연동·문서 대량 처리·안정적 영속 저장이 실제 요구가 될 때 검토. 서명·플랫폼별 배포·업데이트 유지 비용이 추가됨. 같은 JS/WASM을 감싸기만 하면 정확성 결함은 그대로 |

따라서 Tauri 전환을 공개 전 선행 조건으로 삼지 않는다. 배포 페이지에서 버전·검증 해시·지원 범위·표/그림 제외·변환 후 확인 사항을 명시하고, 사용 중 서버 접속 없이 파일로 계속 쓸 수 있는 구조를 유지한다.

### 의존성 확인

설치본과 lock 기준 `@rhwp/core 0.8.7`, `jszip 3.10.1`, `esbuild 0.25.0`. package.json은 각각 caret 범위이므로 재현 가능한 배포에는 lock을 보관하고 `npm ci`를 사용한다. 이번에는 설치/업데이트를 하지 않았다.

- `npm audit --json --cache tests/audit_astra/npm-cache` 출력: 알려진 취약점 0, 총 의존성 40(prod 15/dev 26, 집계 중복 가능). PowerShell 도구는 npm의 사용자 설정 경고를 NativeCommandError로 기록해 exit 1을 보고했으므로 **‘명령이 깨끗하게 성공했다’고 표기하지 않는다.** JSON 응답에 vulnerabilities={}·total=0이 있음을 확인했다. 취약점 DB 0은 파서의 시간/메모리 안전성 보증이 아니다.
- esbuild의 과거 개발 서버 CORS 취약점은 <=0.24.2이며 0.25.0은 수정 버전이다. [공식 권고 GHSA-67mh-4wv8-2f99](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99).
- 2026년 Windows 개발 서버 경로 문제 권고는 affected 0.27.3, patched >=0.28.1로 공시되어 있다. 이를 근거 없이 이 설치본 0.25.0에 적용해 취약하다고 세지 않았다. 이 프로젝트 build.mjs도 serve를 사용하지 않는다. [공식 권고 GHSA-g7r4-m6w7-qqqr](https://github.com/evanw/esbuild/security/advisories/GHSA-g7r4-m6w7-qqqr).
- JSZip의 프로젝트 권고 페이지에는 게시된 권고가 없었지만 이는 과거 모든 취약점이 없었다는 뜻이 아니다. DOCX 방어는 라이브러리 교체만이 아니라 애플리케이션 입력 예산으로 검증해야 한다. [JSZip 공식 보안 페이지](https://github.com/Stuk/jszip/security/advisories).
- rhwp 0.8.7 배포 존재는 공식 릴리스에서 확인했다. 핵심 파싱·조판·저장을 같은 엔진에 의존하므로 독립 한컴 검증과 악성/비정상 입력 회귀가 필요하다. [rhwp 공식 릴리스](https://github.com/edwardkim/rhwp/releases).

## 5. 실행한 명령과 수치

### 지정 변환 7편×11곳=77건

원본 도구는 `tests/out/` 또는 `out/`에 고정 저장한다. 사용자 지정 산출 경로를 지키기 위해 **도구를 tests/audit_astra에 복사하고 import 상대경로와 출력 경로만 변경**했다. 변환/비교 로직은 그대로다. 로그의 `저장: tests/out/...` 문구는 원본 상수로 남지만 실제 파일은 `tests/audit_astra/outputs/`에 있다.

```powershell
$ids='koli,daejung,iall,koreanst,dongak,kochih,koreacontents,ricc,kolali,eomun,ktla'
$samples=Get-ChildItem tests/원고 | Where-Object { $_.Name -match '^paper[1-5]\.hwp$|^00_.*\.(docx|hwpx)$' }
foreach($sample in $samples) {
  node tests/audit_astra/convert.mjs $sample.FullName $ids --quiet
}
node tests/audit_astra/pipeline_test.mjs
node tests/audit_astra/errata_test.mjs tests/원고/paper1.hwp koli
```

| 원고 | 변환 수 | 누락 문단 | 각주 내용 불일치 | 각주 위치 불일치 | 도구 강조 유실 표시 / 재판정 |
|---|---:|---:|---:|---:|---|
| paper1.hwp | 11 | 0 | 0 | 0 | 22 / 런 병합 오탐, 글자별 실제 유실 0 |
| paper2.hwp | 11 | 0 | 0 | 0 | 0 |
| paper3.hwp | 11 | 0 | 0 | 0 | 0 |
| paper4.hwp | 11 | 0 | 0 | 0 | 0 |
| paper5.hwp | 11 | 0 | 0 | 0 | 0 |
| 00_자료지도_5개논문_대응.docx | 11 | 0 | 0(각주 없음) | 0 | 0 |
| 00_자료지도_5개논문_대응.hwpx | 11 | 0 | 0(각주 없음) | 0 | 0 |
| **합계** | **77** | **0** | **0** | **0** | **22건 모두 오탐으로 확인** |

- 7개 convert 프로세스 모두 exit 0. 자료지도는 실제로 동일 내용의 두 형식 표본이며 독립 논문 두 편으로 일반화하지 않는다.
- HWP 5편의 각주: 61+39+35+17+27=179개, 11곳 합계 1,969회 내용·위치 검사.
- pipeline_test: **46회 생성·재로드 완료**, exit 0. 결과는 `pipeline_test.log`. 자동 assert 46개 통과라는 의미는 아니다.
- errata_test: exit 0, 34쪽(Node), 각주 6개·참고문헌 17개 붉게 표시.

### 추가 실행

```powershell
node tests/audit_astra/edge.mjs
node tests/audit_astra/large.mjs
node tests/audit_astra/compliance.mjs
node tests/audit_astra/verify.mjs
node tests/audit_astra/extra.mjs
node tests/audit_astra/summarize.mjs
node tests/audit_astra/inspect-results.mjs
node tests/audit_astra/pdf-inspect.mjs
node tests/audit_astra/tables.mjs
node tests/audit_astra/final-check.mjs
node tests/audit_astra/final-release.mjs

# 아래를 지정 학회 11곳에 각각 실행
node tools/outcheck.mjs tests/audit_astra/outputs/paper2_koli.hwp 이융희 국문 '1. 서론' Abstract
node tools/probe.mjs tests/audit_astra/outputs/paper2_koli.hwp
npm.cmd audit --json --cache tests/audit_astra/npm-cache
```

- DOCX 합성 7개, TXT 상한·Markdown·localStorage 함수·정오표 합성 검사, HWPX 긴 문단 3개 및 빈/위조/초과 크기 12조건 실행. 타이밍은 Node 실측이며 다른 batch 프로세스의 자원 경쟁이 있을 수 있다.
- 40개 PDF 추출 TXT 전체 recognize 실행, 19개 서로 다른 표본 상세 검토. 단순 역할 존재 통계를 정확도로 보고하지 않았다.
- outcheck 11회, probe 11회 완료. 결과 `outcheck_<id>.log`, `probe_<id>.log`.
- 537쪽 한국형판타지 자료는 이 감사의 지정 7편 변환 집합에 넣지 않았다.
- 초기 Node 자식 프로세스 실행은 환경의 EPERM으로 실패했다(`run.mjs`/`runs.json`). PowerShell에서 직접 Node를 실행해 77건을 완료했다. pipeline 복사본의 첫 실행은 상대경로 하나가 남아 ENOENT였고 이를 수정한 뒤 46회를 재실행했다. 요약 스크립트의 괄호 오류도 수정 후 재실행했다. 이들은 제품 결함 수에 포함하지 않았다.

### 핵심 증거 파일

- `tests/audit_astra/baseline.json`: 감사 기준 SHA-256
- `conversion-summary.json`, `*.hwp.log`, `*.docx.log`, `*.hwpx.log`: 77건 보존 검사
- `edge-results.json`, `large-results.json`, `extra-results.json`: 비정상·경계 입력 및 실제 손실
- `structure.json`, `pdf-inspect.log`, `inspection.log`: PDF 역할 전체 및 상세 문맥
- `compliance.json`, `verification.json`: 165문단 서식, 각주 XML, 강조 오탐 재판정 및 중간 시점 해시 대조
- `release.json`, `final-release.json`, `final-check.json`, `npm-audit.json`, `npm-audit.stderr`: 배포 무결성·의존성 증거
