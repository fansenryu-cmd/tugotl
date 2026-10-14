점수: 94/100

# ASTRA 10차 재감사 — astra10

대상은 현재 main `c602f7ee51fe7853b9cde386d4aaf4e6c29f0deb`(2026-10-14)이다. R9-01과 글자 토큰 속성값 `>` 잔존은 **해소**했다. 정상 XML probes9 **56/56**, probes7 **31/31** 통과다. 이번 안내가 확대한 역할·쪽수 규칙에서 **새 회귀 4건**을 가상 원고로 확인했다. 모두 가상 원고에서만 영향이 확인되어 안내에 따라 심각도는 **낮음**으로 둔다. 작가 원고 5편과 PDF 파싱본 40건, 3학회, HWP/HWPX **270개**의 명시적 예외 외 글자·각주·문단 불일치는 0이다.

94점은 검사 통과율이 아니라 투고 산출물 충실도에 대한 판단이다. XML 문제가 해결됐지만 쪽수 교정이 강조 대상을 바꾸고, 문헌 언어·역할 인식에 회귀가 있어 95점으로 올리지 않는다. 보류 항목은 감점에 포함하지 않았다.

## 95점에 이르기 위해 고쳐야 할 것

1. **R10-01:** p./pp. 교정에서 숫자 안의 강조 좌표를 보존한다. 원본의 강조 대상과 교정 후 대상을 직접 비교하는 검사가 필요하다. 현재 모델과 저장물만 비교하면 함께 잘못된 강조를 통과시킨다.
2. **R10-02:** 동일 문헌의 두 번째 이후 쪽수 표기를 새 라틴 문헌으로 오판하지 않게 한다.
3. **R10-03·04:** Keywords 이어짐에서 완결된 서술문을 제외하고, 점선 목차 탐지가 명시적인 인용 서식을 덮지 않게 한다.

완료 기준: 아래 가상 실패를 해소하고 정상 XML 56/56·31/31·추가 토큰 12/12와 A 270개 대조를 유지한다. 제안 코드는 검토용이며 제품 통합·수정 후 회귀 통과는 **확인 못 함**이다.

## 대상·재현 방법

`brief_round3.md`를 마지막 ASTRA 10차 안내까지, `review9_astra.md`, `response_round3_fidelity.md`의 마지막 조치표들을 읽었다. `git log -5 --oneline`에서 `c602f7e → 166a39b → 034e3db`, 현재 브랜치 main을 확인했다. 시작부터 존재한 `docs/audit/brief_round3.md` 수정은 건드리지 않았다.

round9의 실행 스크립트(.mjs·.py)와 가상 fixture를 round10으로 복사하고 모든 `round9` 경로를 `round10`으로 치환했다. `setup.mjs`로 현재 src를 복사했다. 기존 결과 JSON·실원고 산출물은 복사해 재사용하지 않았다. 복사된 과거 `checkpoint.mjs`는 round3에 쓰는 코드가 있어 **실행하지 않았다**. 실행 스크립트의 쓰기 경로를 확인했다.

- XML의 `previous`는 9차 하네스가 사용한 8차 snapshot이다. R9-01의 직전 수치는 9차 보고서·결과와 별도로 대조했다.
- 역할 비교는 실제 존재하는 `034e3db:src/structure.js`를 round10에 저장해 사용했다.
- 쪽수·정오표의 이전 비교는 round8 snapshot이다. structure·errata SHA-256이 round8 manifest와 각각 일치함을 `baseline-proof.json`으로 확인했다. 옛 커밋 객체를 조회했다고 주장하지 않는다. 현재 journals·cite를 공통으로 사용한 모듈 비교다.
- 새 발견은 이번 안내에 명시된 변경 범위다. 모두 c602f7e 한 커밋이 만든 결함이라는 뜻은 아니다.
- 임시 파일·실원고 사본·실행 로그·산출물은 `tests/audit_astra/round10/`에만 썼다. `tests/corpus/`는 읽거나 쓰지 않았다. 제품 경로는 수정하지 않았다.

## R9-01과 잔존 재판정

| 항목 | 직전 기록 → 현재 | 판정 |
|---|---|---|
| R9-01 PI 안 주석 모양 혼입 | 본문·각주·미주 각 23자 → 기대 2자, 3/3 | 해소 |
| w:t 속성값 > | 본문·각주·미주, 작은/큰따옴표 6실패 → 6통과 | 해소 |
| pi-cross 기존 확장 잔존 | 본문·각주·미주 21자 → 기대 3자, 3/3 | 해소 |
| probes9 정상 XML | 32/56 → 56/56 | 24실패 해소 |
| R8-01 원래 문단·스타일 재현 | 4/4 정상 유지 | 해소 유지 |
| R7-01 CDATA 안 주석·교차 경계 | 4/4 정상 유지 | 해소 유지 |
| 6차 DOCX·HWPX·길이 단위 | 13/13·9/9·5/5 | 해소 유지 |
| probes7 전체 | 29/31 → 31/31 | 2실패 해소 |
| 추가 tagEndAt 토큰 | 글자·줄·쪽 나눔·기호·각주·미주 × 따옴표 2종, 12/12 | 새 결함 관측 0 |

9차의 기존 판정 항목 7개와 별도 잔존 2종은 현재 모두 해소 유지/해소다. R9-01도 별도 해소다. 같은 재현을 여러 표에서 다루므로 행 수를 결함 수로 합산하지 않는다.

조치표의 “probes9 정상 XML 실패 0/68”은 분모를 바로잡아야 한다. **68패키지 중 정상 56, 의도한 비정상 12**다. ElementTree로 다시 확인했다. 비정상 12개는 성공률·감점에서 제외했다. probes8은 관측상 40/40이지만 정상 XML 패키지는 36개, part는 70개 중 66개 정상이다. 전체 OOXML 스키마 적합성과 Word가 해당 구문을 생성하는지는 **확인 못 함**이다.

## R10-01 — p./pp. 숫자 교정이 강조를 다른 문자로 이동

- 심각도: 낮음. **저장된 HWP/HWPX에서 재현**.
- 위치: `src/structure.js:299`, `:300`, `:329`, 각주 런 재작성 `:347`.
- 재현: `node tests/audit_astra/round10/emphasis10.mjs`.
- 원인: 숫자를 포함한 전체 locator를 한 편집으로 기록하고, 내부 좌표를 문자열 길이로 잘라 옮긴다. p를 추가/삭제한 실제 위치와 강조 경계가 맞지 않는다. 연속 교정에는 서로 다른 단계의 좌표도 섞인다.

아래는 전부 직접 만든 가상 인용이다. 굵게는 입력에서 숫자 두 글자에만 설정했다.

| 가상 각주 | 기대 강조 | 이전 snapshot | 현재 모델 | HWP / HWPX 재판독 |
|---|---|---|---|---|
| `Smith, Synthetic, 2020, p.12-14.` | `12` | `12` | `.1` | `.1` / `.1` |
| `Smith, Synthetic, 2020, pp.55.` | `55` | `55` | `5` | `5` / `5` |
| `홍가상, 『가상 연구』, 가상사, 2020, p.12～14.` | `12` | `12` | `~1` | `~1` / `~1` |

3입력·6산출물 모두 강조 대상 불일치. 글자별 굵기 대칭차는 앞 두 입력에서 각각 2자·1자, 마지막에서 4자다(형식별 합계 7자). 본문·각주 글자는 의도한 쪽수 교정 결과이며 이 발견은 글자 누락이 아니라 강조 위치 오류다. `pp.55 → 55쪽`의 숫자 강조 소실 등 이전에도 실패하던 조합은 새 결함으로 세지 않았다.

수정안: p./pp. 일치 교정은 숫자를 소비하지 않고 접두사만 편집한다. 다음은 라틴 두 재현을 대상으로 한 최소 변경 예시다.

```js
// apply가 기록하는 oldLen/newLen에 숫자를 포함하지 않는다.
t = apply(t,
  /\bpp\.(?=\s*\d+(?!\d|\s*(?:[-~–—∼〜～]\s*\d|,\s*\d|ff?\b)))/g,
  () => 'p.', segStart);
t = apply(t,
  /\bp\.(?=\s*\d+\s*[-~–—∼〜～]\s*\d+)/g,
  () => 'pp.', segStart);
```

국문 단위 교정까지 해결하려면 숫자는 그대로 두고 접두사 삭제·범위 기호 교체·단위 삽입을 각각 기록해야 한다. 예를 들어 `p.12～14 → 12~14쪽`은 다음처럼 숫자의 원래 좌표를 보존하는 편집으로 표현한다.

```js
// 원문 좌표 기준. 겹치지 않는 편집을 한 번에 적용한다.
const edits = [
  { at: start, oldLen: 2, replacement: '' },
  { at: separatorAt, oldLen: 1, replacement: '~' },
  { at: endOfDigits, oldLen: 0, replacement: '쪽' }
];
// 삽입 경계의 런 시작/끝에는 별도의 좌측/우측 affinity를 적용한다.
```

위 예시는 제품 전체에 바로 적용할 완성 패치가 아니다. 공백·반복 locator·한자 단위·여러 문단 각주에서 편집 합성과 경계 방향을 추가 검증해야 한다.

## R10-02 — 같은 문헌의 뒤쪽 p.를 라틴 문헌으로 오판

- 심각도: 낮음.
- 위치: `src/structure.js:210`~`:219`의 `citeLang`, `:309`의 호출.
- 재현: `node tests/audit_astra/round10/boundary10.mjs`의 locator 2건.

가상 공통 앞부분은 `홍가상, 『가상 연구』, 가상사, 2020, `이다.

| 입력 끝부분 | 기대 / 이전 | 현재 |
|---|---|---|
| `p.12, p.14.` | `12쪽, 14쪽.` | `12쪽, p.14.` |
| `p.12, p.14, p.16.` | `12쪽, 14쪽, 16쪽.` | `12쪽, p.14, p.16.` |

2조건 모두 회귀, 뒤쪽 locator 3개 미교정. `String.replace` 콜백의 str는 해당 replace 이전 문자열이다. 뒤에서부터 서지 칸을 읽다가 앞의 `p.12`에 든 라틴 p를 발행처/학술지처럼 판단한다.

수정안: 쪽수만 있는 칸은 언어 근거에서 제외한다. 서지 칸의 인용 범위를 먼저 정하고 같은 문헌에서는 판정을 재사용하는 편이 더 안정적이다.

```js
// citeLang의 fields 순회에서 문자 언어 판정보다 먼저 실행
if (/^(?:pp?\.\s*)?\d+(?:\s*[-~–—∼〜～]\s*\d+)?\s*(?:쪽|면|頁)?\.?$/i.test(f)) {
  continue;
}
```

## R10-03 — Keywords 뒤 완결된 영문 문장을 이어짐으로 흡수

- 심각도: 낮음.
- 위치: `src/structure.js:133`~`:136`.
- 재현: `node tests/audit_astra/round10/probes10.mjs`, `keywords-prose`.
- 가상 입력:

```text
Abstract
This synthetic abstract is complete.
Keywords: fiction,
Readers interpret narrative.
```

기대 및 `034e3db` 결과는 마지막 줄 `abstractEn`, 현재는 `keywordsEn`이다. 1/1 역할 회귀. 앞줄이 쉼표로 끝나는 분기는 현재 줄의 마침표를 검사하지 않고 12단어 이하를 받는다. is/are 등 일부 동사만 제외하므로 interpret 같은 서술 동사가 통과한다. 실제 Keywords 줄바꿈 `memory, narrative`는 현재 정상 인식했다.

수정안: 쉼표 분기에도 현재 줄의 완결 문장 검사를 공통 적용한다. 다음은 보수적인 최소 후보이며, 끝에 마침표가 있는 실제 주제어 나열은 별도 목록 규칙으로 허용해야 한다.

```js
const endsSentence = /[.!?]["”’')\]]*$/.test(t);
const continuationList = /[,;，；]/.test(t);
const proseTail = endsSentence && kwWords >= 3 && !continuationList;
// 기존 prevKw ... 조건에 && !proseTail 추가
```

영문 저자명 `John Smith`도 같은 자리에서 authorEn→keywordsEn이 된다(`extended10`). 다만 저자명과 주제어를 글자만으로 가르기 어려우므로 별도 결함·감점으로 중복 계산하지 않았다.

## R10-04 — 점선 목차가 명시적인 인용 서식을 덮음

- 심각도: 낮음.
- 위치: `src/structure.js:77`, 뒤의 인용 판정 `:157` 이후.
- 재현: `node tests/audit_astra/round10/boundary10.mjs`, `explicit-quote-dots`.
- 가상 입력: 본문 다음 문단 `가상 인용 ..... 123`, `styleName:'quote'`, `marginLeft:10`.
- 기대 및 이전: quote 1개. 현재: toc 1개, quote 0개. **1/1 회귀**. 목차 묶음으로 재배열될 수 있는 역할 오판이며, 이 사례의 저장 후 실제 이동량은 **확인 못 함**이다.

수정안: 명시적 인용 단서를 점선보다 우선한다. 본문 중 도표·숫자 나열까지 목차로 읽지 않도록 위치·이웃 항목도 함께 제한해야 한다.

```js
const explicitQuote = p.styleName === 'quote' || indented(p);
if (state !== 'references' && !explicitQuote && dottedLeader.test(t)) {
  if (state === 'front') state = 'toc';
  push('toc', '점선·쪽번호 목차 항목');
  continue;
}
// dottedLeader는 현재 :77 정규식
```

## 경계 검사와 새 발견에서 제외한 것

| 범위 | 실행 결과 | 판단 |
|---|---|---|
| 국문 서술 속 외국 문헌·번역서·괄호 속 국내 인용 | 기본 가상 3/3 기대대로 | 새 결함 없음 |
| 금액·판결 날짜/번호·권수 범위 | 한 가상 복합 각주 그대로 | 새 결함 없음 |
| 라틴 pp. 단수, p. 범위, pp.12,15, pp.12ff. | 4/4 글자 결과 기대대로 | 강조는 R10-01에서 별도 판정 |
| 학회 범위 기호 | koli 국문 ～→~, ricc 국외 기호 미지정은 ～ 유지 | ricc에 '-'를 기대한 초기 테스트 오류를 고쳤음. 52학회 원규정 재조사는 확인 못 함 |
| 가나다 가→나 | h4 2/2 | 정상 |
| 가나다 나→다 | 이전 h4 2개, 현재 body 2개 | 안내가 명시한 ‘가부터’ 조건의 의도된 제한. 새 결함·감점에서 제외 |
| 각주 번호 줄·3.5% 줄 | 각각 body | 정상 |
| 점선 목차 기본 줄 | toc | 정상. 명시적 quote 회귀는 R10-04 |
| 점선 목차 다음 본문 제목 | 현재·이전 모두 toc 오판 | 기존 실패, 새 결함 제외 |
| 국외 문헌 `12쪽에서` | 현재·이전 모두 단위 유지 | 기존 실패, 새 결함 제외 |
| 서술·두 문장·괄호 속 인용 | 기본 3/3 noRef=0·uncited=0 | 정상 |
| 외국 문헌의 국문 서술·두 문헌 두 문장 | 추가 2조건 uncited=0 | 정상 |
| 같은 문장 안 두 문헌 | 두 번째 문헌 uncited=1 | 미해결 관측. 새로 생겼다는 인과는 확인 못 함, 감점 제외 |
| 낫표 없는 외국 책 + 국문 문헌 두 문장 | 2조건에서 외국 책 uncited=1 | 이전에도 미인용, 새 결함 제외 |
| tagEndAt | 12/12, 각주/미주 위치 1 유지 | 새 결함 관측 0 |

정오표는 요청한 서술 속 인용 경계를 시험했지만 **이번 변경으로 새로 생겼다고 확정한 결함은 0**이다. 입력 형식 전반의 완전성은 확인 못 함이다. `extended6` 혼합 인용 16조건은 고정 기대와 여전히 16/16 불일치다. 9차와 같은 결과이며, 이전 실패를 새 발견으로 재계수하거나 기대를 바꿔 통과시키지 않았다.

## A 충실도 — 원고 5편과 PDF 파싱본 40건 재실행

koli·ricc·dongak에서 현재 파싱→역할→목차→재배열→쪽수 교정→빈 줄 모델을 만들고, HWP/HWPX로 저장 후 다시 읽어 비교했다. UTF-16 단위다.

| 대상 | 산출물 | 비교 문단 | 본문 글자 | 각주 글자 | 본문 불일치 | 각주 글자 / 위치 불일치 |
|---|---:|---:|---:|---:|---:|---:|
| paper1~5 × 3, HWP | 15 | 2,105 | 363,035 | 69,028 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWP | 120 | 104,400 | 4,009,855 | 0 | 0 | 0 / 0 |
| paper1~5 × 3, HWPX | 15 | 2,105 | 363,035 | 69,028 | 0 | 0 / 0 |
| pdf-01~40 × 3, HWPX | 120 | 104,400 | 4,009,855 | 0 | 0 | 0 / 0 |

- 형식별 각주 537개. 문단 수 차이·각주 수·각주 문단 배열·번호 없음 여부 불일치 모두 0.
- HWP 135개: 모델 대비 활성 강조(B/I/U/위첨자) 손실 본문 0·각주 0. 제목류 굵기는 학회 서식 우선으로 제외.
- HWP/HWPX 135쌍: 글자별 강조 차이 본문 0·각주 0.
- 라벨·주제어 문단 예외는 형식별 265개(paper 41, pdf 224). 자동 skip은 학회 적용 합계 45개. 예외 문구와 skip의 의미적 정답은 **확인 못 함**.
- 9차 supplement와 번호·학회·형식별 수치 변화 0행(`summary10.json`).
- 추가 원본 각주 강조 검사: paper1~5의 **파싱된 각주에서 활성 강조 글자가 0**이다. 3학회 15조합 전후 모두 0이므로 실원고에서 R10-01이 관측되지 않는 것을 해당 기능의 강한 통과 증거로 볼 수 없다(`input-note-emphasis10.json`).

**검사 한계:** A의 기준은 교정 완료 모델이며 파싱 전 원본의 독립 판독이 아니다. R10-01처럼 모델 단계에서 망가진 강조는 A가 놓친다. 라벨 예외·두 형식에 공통으로 잘못 들어간 서식·인식된 역할의 의미적 정답·rhwp 공통 오류·실제 한컴/Word 조판·독립 HWP 판독은 **확인 못 함**이다. PDF TXT에는 각주 객체가 없으므로 원 PDF의 각주 위치·강조·시각 서식 복구도 **확인 못 함**이다. 실원고의 제목·저자·문장은 보고하지 않았다.

## 실행 명령과 수치

저장소 루트에서 실행했다. 파일 복사·경로 치환·baseline 추출·집계에는 PowerShell, Python pathlib/shutil/hashlib, `git show 034e3db:src/structure.js`·`git show 034e3db:src/errata.js`를 사용했다. 아래는 감사 재실행 명령이다.

```text
git log -5 --oneline
git branch --show-current
git status --short
node tests/audit_astra/round10/setup.mjs
node tests/audit_astra/round10/probes7.mjs
node tests/audit_astra/round10/probes8.mjs
node tests/audit_astra/round10/probes9.mjs
node tests/audit_astra/round10/extended6.mjs
node tests/audit_astra/round10/notes6.mjs
node tests/audit_astra/round10/notes7.mjs
node tests/audit_astra/round10/exact-boundary.mjs
python tests/audit_astra/round10/xml-validity.py
python tests/audit_astra/round10/xml-validity8.py
python tests/audit_astra/round10/oracle8.py
python tests/audit_astra/round10/oracle9.py
node tests/audit_astra/round10/probes10.mjs
node tests/audit_astra/round10/extended10.mjs
node tests/audit_astra/round10/boundary10.mjs
node tests/audit_astra/round10/emphasis10.mjs
node tests/audit_astra/round10/errata10.mjs
node tests/audit_astra/round10/batch.mjs
node tests/audit_astra/round10/supplement.mjs
node tests/audit_astra/round10/output-emphasis.mjs
node tests/audit_astra/round10/input-note-emphasis10.mjs
node tests/audit_astra/round10/integrity.mjs
python tests/audit_astra/round10/summarize10.py
node tests/audit_astra/round10/final-check.mjs
git diff --check
```

재현 모듈은 round10 snapshot을 읽는다. setup 후 baseline-*.js를 snapshot/src에 복사한 준비 상태도 round10에 남겼다. `oracle9.py`는 실행하지 않은 patched9 결과를 요구하지 않도록 현재 probes9만 집계하게 바꿨다. 초기 PowerShell 중괄호 경로 확장 오류는 검색 명령의 오류이며 제품 검사 실패가 아니다. 집계 중 Python 기본 cp949 읽기 오류와 보고서 말미 한 줄의 파이프 인코딩 문제도 UTF-8로 고친 뒤 재검증했다.

| 묶음 | 수치 |
|---|---|
| probes7 / probes8 / probes9 | 31/31 / 40/40 관측 / 정상 56/56 |
| extended6 | 50행, 판정 43개 중 27통과·기존 인용 16불일치, 역할 7관측 |
| notes6 / notes7 | 3/3 / 4/4 |
| exact-boundary | 경계 6/6 기대대로, 별도 baseline 관측 6개 |
| XML 문법 독립 확인 | 21 part 중 19 정상; probes8 70 part 중 66 정상; probes9 68패키지 중 56 정상 |
| probes10 | 24조건 중 20기대 일치·4불일치. 불일치에는 의도된 가나다 제한·기존 단위 잔존이 포함되어 결함 수와 다름 |
| boundary10 | 토큰 12/12 + 새 실패 quote 1·locator 2 |
| emphasis10 | 3입력·6산출물 강조 대상 실패 |
| A | 270산출물·135강조 쌍, 명시적 예외 외 불일치 0 |
| integrity | 배포 SHA-256, 내장 자산 34개, WASM 일치 |

## 보류 — 감점과 별도

- **F-02 익명화 한계:** 이름 꼴 부제와 저자 구분 한계. 감점 제외, 이번 재검증 안 함.
- **F-08 범위 기호·half 좌표·정렬:** 기존 보류 전체의 해소는 확인 못 함. 이번 R10-01은 `marks:'keep'`에서도 발생하는 새 p./pp. 교정 회귀로 half 좌표 보류와 다르다. R10-02도 이번 citeLang 변경의 회귀다. 기존 보류 자체는 감점 제외.
- **F-11 검증 도구:** 제품 게이트 통합 보류. 감사 하네스와 제품 검증 완료를 동일시하지 않는다. 감점 제외.
- **Worker 분리:** 보류, 브라우저 응답성 재측정은 확인 못 함. 감점 제외.

제품 변경·빌드·커밋·배포는 하지 않았다. 보호 파일 시작/종료 해시·실행 snapshot과 src 일치·HEAD 불변은 `final-check.json`에 기록한다. 보고서 외 새 작업 파일은 round10 아래에만 두었다.

최종 검증: HEAD 불변, 보호 파일 해시 변화 0, src/실행 snapshot 차이 0, 엄격 대조 270개·실패 0. `git diff --check` 오류 0. 기존 brief 수정 외 이번 보고서만 git 상태에 추가되었으며 round10은 기존 ignore 규칙을 따른다.
