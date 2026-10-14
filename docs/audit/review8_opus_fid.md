점수: 95/100

# 8차 재감사 — A. 산출물 충실도 (opus_fid8, 2026-10-13 KST, main 0d0039e)

> **대상**: main 0d0039e. 감사 도중 main이 b9b9677(8차 Sonnet 반영)로 바뀌었다. 그래서 수치는 모두 `git show 0d0039e:src/*`로 꺼낸 사본(`tests/audit_opus_fid8/v8/src/`)에서 냈다. 사본에서 바꾼 것은 engine.js의 rhwp 불러오기 경로 한 줄뿐이다. 발견마다 b9b9677 사본(`tests/audit_opus_fid8/b9/src/`)에서 다시 재서 HEAD에서 남는지도 적었다. 줄 번호는 0d0039e 사본 기준이다.
> **줄바꿈**: 작업 트리 `src/`는 LF였다. 브리프의 CRLF 조건은 LF→CRLF로 바꾼 사본(`patched/crlf/`)으로 따로 시험했다.
> **연구 윤리**: 원고의 제목·저자·본문·각주 문장은 쓰지 않았다. 작가 원고는 paper1~5, PDF 파싱본은 pdf-NN(파일 이름순)으로만 적는다. 인용한 줄은 모두 직접 만든 가상 줄이다(`tests/audit_opus_fid8/fixtures/`, 스크립트 안의 가상 조각).

## 요약

**판정: 7차 두 보고서의 결함은 모두 해소됐다.**
- Opus N7-1·N7-2·N7-3과 단행본 권·호, Sonnet F7-1·F7-2·F7-3이 해소됐다.
- F7-4는 0d0039e에서 부분 해소였다. 본문은 고쳐졌지만 각주 정의 안은 그대로였고, 이 부분은 b9b9677에서 고쳐졌다.
- 작가 원고 보존 수치는 7차와 한 글자도 다르지 않다. 학회 규정 양식 산출 HWP 260개와 HWPX 260개는 adb1ed4 산출과 **바이트 단위로 같다**.
- APA·Chicago 520회에서 각주 구조 불일치 0, 숫자 소실 0이다.
- 정오표는 `app.js`의 `finalizeBlocks()`를 원문 그대로 떼어 돌려 확인했다. 5편 × 52곳에서 학회 규정·APA·Chicago의 붉은 항목 수가 **260/260 같다**. adb1ed4에서는 0/260이었다.

**이번 반영에서 새로 생긴 결함 3건 (모두 ‘낮음’: 가상 원고에서만 드러나고 작가 원고·PDF 파싱본 영향 0)**
1. **N8-1 주제어 판정의 서술어 예외가 실제 주제어 낱말을 서술어로 읽는다.** `kwPred`·`kwEnVerb`(N7-1 반영)가 마지막 주제어가 ‘정치적인 것’·‘시적 모호함’·‘함께 있음’·‘human being’·‘Being and Time’ 같은 줄을 문장으로 본다. 머리말이 괄호·대시 꼴이고 끝에 마침표가 있으면 그 주제어 줄이 초록 문단이 된다.
   - 가상 344줄 중 118줄이 adb1ed4에서는 주제어였는데 지금은 초록이다.
   - 산출에서는 208회 중 주제어 역할 208 → 0, 학회 표기 치환 45 → 0이다.
   - b9b9677(조사 ‘을·를’ 한정)에서도 86/344가 남는다.
2. **N8-2 들여 쓴 본문 문단이 말없이 각주로 들어간다.** TXT 이어짐의 ‘빈 줄 뒤 블록’ 예외(`gapIdx`, N7-2 반영)는 정의 다음 빈 줄 뒤에 나오는 들여 쓴 **본문 문단**까지 ‘본문도 들여 씀’의 증거에서 뺀다. 그래서 다른 정의 바로 아래 들여 쓴 본문 문단이 각주 문단으로 흡수된다.
   - 가상 원고에서 본문 9 → 8, 각주 [1,1] → [1,2]이다.
   - 흡수된 줄에 대한 경고는 없다(나오는 경고는 다른 줄 이야기다).
   - b9b9677에서도 그대로다.
3. **N8-3 MD 처리 규칙이 곳에 따라 다르다.** 0d0039e에서는 `\*` 이스케이프와 `***굵은 기울임***`이 각주 정의 안에서 작동하지 않았다(b9b9677에서 해소). `.markdown` 확장자는 지금도 마크다운 이스케이프를 받지 않는다(HEAD에서도 남음).

수정안 Q1~Q3를 `tests/audit_opus_fid8/patched/apply.mjs`로 0d0039e 사본과 b9b9677 사본에 적용해 검증했다. 두 판에 적용한 결과는 같다.
- N8-1: 118 → 6. 남은 6줄은 `We the People`처럼 조각이 we로 시작하는 꼴이다.
- N8-2: 본문 9·각주 [1,1]로 돌아온다.
- N8-3: 해소.
- 회귀가 없다. N7-1 오인 3/18 유지, N7-2 각주 [2,1] 유지, 회귀 로그 37종이 0d0039e와 같고, 329개 파일 × 52곳 역할 변화는 수정 대상 가상 원고뿐이다(5장).

**95점 근거(감점 내역)**
- N8-1 -1: 주제어 줄의 역할이 바뀐다. 이미 고친 N6-1 계열의 반대 방향 재발이다.
- N8-2 -1: 본문 글이 각주로 옮겨진다. 다만 들여 쓴 본문 + `[^n]` 원고에서만 생긴다.
- N8-3 -0.5
- 이전부터 남은 것 -1.5: litheory 국문초록 제목 기울임·daejung 주제어 예시 굵기(데이터), 단행본 변환의 연도 뒤 덧말·괄호 출판 정보(관찰 1·2), F6-5 머리말 굵기 끊김.
- 보류 항목(DOCX 스타일 서식·자동 번호·루비·텍스트 상자, 표·그림 자리 표시, 검증 도구 보강, 재배열 안내 길이, 굵게 안의 기울임)은 감점에 넣지 않았다.

### 고칠 것 (우선순위. 95점이라 필수는 아니지만 셋 다 1~3줄이고 검증했다)

| 순위 | 할 일 | 위치(0d0039e / b9b9677 같음) | 크기 | 사본 검증 |
|---|---|---|---|---|
| 1 | N8-1 서술어 예외를 좁힌다. ‘것’은 ‘-라는·-다는·-하는·-되는’ 뒤에서만 서술어로 본다. ‘있음·없음·같음’은 ‘이·가·과·와’ 뒤에서만 본다. ㅁ 받침 명사형은 ‘을·를·(으)로·에서·에게’ 뒤이거나, ‘이·가·은·는·도’ 뒤의 ‘-임·-함·-됨’일 때만 본다. 영어는 조각 첫 낱말이 be·have·we일 때, 또는 네 낱말 이상 조각 안에 있을 때만 본다 | `src/structure.js:64-66` | 3줄 | 344줄 손실 118 → 6, 산출 208회 주제어 역할 0 → 208·치환 0 → 45(adb1ed4와 같음). N7-1 `k7_body_lines` 오인 3 유지, Sonnet `kw6`·`kw7`·`kw7b` 출력이 0d0039e와 같음 |
| 2 | N8-2 빈 줄 뒤 들여 쓴 블록을 증거에서 빼는 조건을 좁힌다. 그 블록 다음이 들여 쓰지 않은 본문 줄일 때(인용 시)만 뺀다. 다음 정의로 이어지는 블록은 들여 쓴 본문 문단으로 보고 증거로 남긴다. 증거를 뺀 채 이어짐을 읽었으면 그 사실도 경고한다 | `src/parse.js:330, 374` | 2줄 | `t8_gap_chain` 본문 8 → 9·각주 [1,2] → [1,1]. N7-2 `t7_mixed_cont` [2,1]·`t6_quote_after_def` [1,1] 유지. 출처 각주가 달린 인용 시(`t8_poem_ref`)도 [2,1,1] 유지. Sonnet `txtfuzz7` 20,000개 유실 0 |
| 3 | N8-3 `.markdown`도 마크다운으로 본다. 각주 정의 안 규칙은 b9b9677에 이미 들어감 | `src/parse.js:340` | 1줄 | `.markdown` 본문·각주 `\*` → `*` |

---

## 1. 7차 결함의 재판정

재현 방법은 다음과 같다.
- 7차 하네스 `tests/audit_opus_fid7/{v7,s5c,s7,sonnet7,cite52}`를 `tests/audit_opus_fid8/{v8,s5c,s8,sonnet8,cite52}`로 복사하고, 가져오기 경로를 v8 사본으로 바꿨다.
- Sonnet 7차 스크립트는 `tests/audit_opus_fid8/s7s/`에 복사했다. `h/src` = 0d0039e, `a/src` = adb1ed4, `p/src` = 수정안이다.
- 일괄 실행은 `bash tests/audit_opus_fid8/run_all.sh v8`, `bash tests/audit_opus_fid8/run_indep.sh`, `bash tests/audit_opus_fid8/cite52/run.sh`이다.

### Opus 7차 (opus_fid7, 94점)

| 결함 | 판정 | 재현 명령 | adb1ed4 → 0d0039e |
|---|---|---|---|
| N7-1 쉼표 나열 괄호 낱말 본문 문장이 주제어로 | **해소**(부작용 N8-1) | `node tests/audit_opus_fid8/v8/kwbody8.mjs tests/audit_opus_fid7/fixtures/k7_body_lines.txt`, `node tests/audit_opus_fid8/v8/kwbody7_run.mjs ./r3/lib.mjs` | 오인 13/18 → **3/18**. 52곳 본론 밖 이동 676 → **156**, 글자 바뀜 167 → **45**(남은 3줄은 서술어 없는 나열로 7차 판단과 같음) |
| N7-2 인용 시가 있으면 다른 정의의 이어짐이 본문으로 | **해소**(부작용 N8-2) | `node tests/audit_opus_fid8/v8/txtcmp8.mjs tests/audit_opus_fid7/fixtures/t7_mixed_cont.txt …t7_direct_cont.txt tests/audit_opus_fid6/fixtures/t6_quote_after_def.txt` | mixed 본문 9 → **8**, 각주 [1,1] → **[2,1]**, 경고 ‘2줄’. direct [2,1] 유지, t6 [1,1] 유지(경고 줄 수 1 → 2, 7차 P2와 같음) |
| N7-3 엔진 머리말 정규식이 판정보다 좁음 | **해소** | `node tests/audit_opus_fid8/v8/kwlabgap7.mjs`, `node tests/audit_opus_fid8/v8/kwshape6.mjs tests/audit_opus_fid7/fixtures/k7_lab_{hangul,spaced}.txt koli,fcs,gubo,…` | 놓침 310/420 → **0/420**. koli·fcs·gubo·kopoetics에서 학회 표기로 바뀌고, fcs·gubo·kopoetics에서는 머리말(굵게)·값 모양이 나뉨. 바탕틀 38예시 머리말 추출은 `tpllabel7.mjs` 출력이 7차와 같음 |
| §3.4 단행본 갈래 권·호 숫자 소실 | **해소** | `node tests/audit_opus_fid8/v8/cite7.mjs @pdf`, `node tests/audit_opus_fid8/v8/cite7.mjs` | PDF 변환 95 → **65**, 숫자 소실 29항목·36개 → **0**. 작가 원고 변환 173 그대로, 소실 0 |
| 관찰 1(연·월 항목 제외)·관찰 2(날짜 항목 점검 생략) | 그대로(선택 사항) | — | — |

### Sonnet 7차 (sonnet_fid7, 93점)

| 결함 | 판정 | 재현 명령(`cd tests/audit_opus_fid8/s7s`) | adb1ed4 → 0d0039e |
|---|---|---|---|
| F7-1 PDF 줄 나뉨·`『학술지』 1` 꼴 권·호 소실 | **해소** | `node cite_cls7.mjs`, `node cite_corpus7.mjs`, `node cite_fuzz7.mjs h` | 파싱본 변환 95 중 소실 29 → 변환 **65 중 0**. 코퍼스 196단위 숫자 소실 **0**. 가상 조합 44,000개 소실 6,390 → **36**(7차 수정안 기대값과 같음: ‘호’가 둘인 꼴) |
| F7-2 정오표가 서지 변환 뒤에 돎 | **해소(앱 코드로 확인)** | `node tests/audit_opus_fid8/app/app_final.mjs <src> all` | adb1ed4: APA 붉은 참고문헌 6,604·Chicago 2,476(학회 규정 3,189), 같은 조합 0/260. **0d0039e: 3,189·3,189·3,189, 붉은 각주 1,812·1,812·1,812, 정오표 요약 7수 260/260 같음.** 말풍선용 `errata.notes/refs.text`와 산출 블록 글 불일치 0. PDF 40 × 6곳(240회) 요약 같음 240/240 |
| F7-3 논문 항목 연도 뒤 덧말 소실 | **해소** | `node cite7a.mjs h` | `…, 2020, 재인용.`·`강조는 인용자`·`원문 강조` 모두 ‘그대로’(변환 안 함) |
| F7-4 MD `\*`·`***` | 0d0039e **부분 해소** → b9b9677 해소 | `node tests/audit_opus_fid8/app/show_md.mjs <src> tests/audit_opus_fid8/fixtures/m8_fn_escape.md` | 본문: `\*별표\*` → `*별표*`, `***굵은 기울임***` → 굵게+기울임(산출 HWP에서도 BI). 각주 정의: 0d0039e는 `\별표\`(기울임)·별표 6개 잔존, b9b9677에서 본문과 같아짐. `.markdown`은 HEAD에서도 미지원(N8-3) |

### 이전부터 남은 것

| 발견 | 8차 판정 | 수치 |
|---|---|---|
| F6-5 `<Keywords>`·`Keywords -` 머리말 굵기 끊김 | 그대로(보류) | `s7s/kwsplit6.mjs` 출력 7차와 같음 |
| F6-4 재배열 안내 길이 | 그대로(보류) | `reorder6.log` 7차와 같음 |
| F5-8 DOCX 취소선·아래첨자 경고 없음 | 그대로(보류) | `s5c/docx_marks.mjs` warnings `[]` |
| litheory 국문초록 제목 기울임, daejung 주제어 예시 굵기 | 그대로(데이터) | `papers27` 실패 8 같음 |

---

## 2. 보존 회귀 수치 (0d0039e 사본)

| 명령 | 건수 | 결과 |
|---|---|---|
| `bash tests/audit_opus_fid8/run_indep.sh`(5편 × 52곳 `--save` → 독립 HWP5 판독 → `compare4.mjs`) | 260(+원고 5) | 판독 오류 0. `compare4.log`가 7차와 **바이트 동일**(원고 문단 31,200 중 paraMissOther 0, 각주 9,308 글·문단·줄바꿈·강조·번호·위치 차이 0, 새 번호 104, 본문 강조 4,940자 유실 0, labelRepl 311, kwRepl 116). 하네스 254 OK·6 표시 |
| 산출 바이트 대조(`cmp` fid8 `s5c/out` ↔ fid7 `s5c/out`) | HWP 260·HWPX 260 | **차이 0** |
| `bash tests/audit_opus_fid8/run_all.sh v8`(로그 37종) | — | 시간 값을 빼면 7차 `logs/v7`과 같다. 다른 것은 의도한 둘뿐이다: `star5`(FAIL 7 → 5, `***…***` 두 줄 해소), `txtwarn6`(경고 줄 수 1 → 2) |
| `bash tests/audit_opus_fid8/cite52/run.sh`(APA·Chicago 52곳) | 520 | 각주 18,616개 개수·문단·줄바꿈·앞 공백·번호 문단 불일치 0, 바뀐 각주 5,720(7차와 같음), 참고문헌 문단 5,200·각주 문단 2,860 변경 중 숫자 소실 0 |
| `node tests/audit_opus_fid8/v8/rolediff8.mjs`(adb1ed4 ↔ 0d0039e) | 315 파일 × 52 = 16,380 | 역할 다름 156·블록 다름 312. 모두 `k7_body_lines`·`k7_body_list`·`t7_mixed_cont`(7차 수정이 의도한 변화)이고, 그 밖에는 `t6_quote_after_def` 경고 줄 수뿐이다. **작가 원고 5·PDF 40 변화 0** |
| `node tests/audit_opus_fid8/v8/errata7all.mjs`(학회 규정) | 5편 × 52 | adb1ed4 로그와 같음 |
| Sonnet `txtfuzz7`·`starfuzz6/7`·`fnfuzz6`·`starlit6`·`txt_md`(`s7s/_a_*`·`*`·`_p_*`) | 20,000·20,590·29,106·16,323줄 등 | 글 유실 0, 각주 수 불일치 0, 중복 정의 885/885 경고. `txt_battery`의 차이 1줄은 `***굵은기울임***`이 서식이 된 것(하네스 기대값이 옛 동작) |
| `node tests/audit_opus_fid8/app/cite_paren.mjs` | 작가 5 + PDF 40, 1,719단위 | 변환 238단위, 변환 뒤 괄호 짝이 어긋난 것 0 |

---

## 3. 이번 반영에서 생긴 결함 (중요도순, 모두 낮음)

### N8-1 (낮음·역할) 서술어 예외가 실제 주제어 낱말을 서술어로 읽어 주제어 줄이 초록이 된다

**위치**: `src/structure.js:64-66`(`kwPred`, `kwEnVerb`). `kwList`(:67)와 `kwSentence`(:68)가 이 둘을 쓴다.
- 마침표로 끝나고 앞 28자 안에 쌍점류가 없는 주제어 줄(`[주제어] …`, `「핵심어」 …`, `주제어 ― …`, `<Keywords> …`, `Keywords - …`)은 `kwList`가 참이어야 주제어로 남는다.
- 그런데 0d0039e는 마지막 조각을 이렇게 서술어로 본다.
  - 마지막 낱말이 `것`으로 끝나면 무조건 서술어(‘정치적인 것’·‘한국적인 것’·‘숭고한 것’).
  - 두 낱말 이상이고 `함·됨·임·있음·없음·같음`으로 끝나면 서술어(‘시적 모호함’·‘언어의 투명함’·‘함께 있음’·‘출구 없음’).
  - ㅁ 받침 + 앞 낱말 끝이 `을를은는이가에도로`면 서술어(‘국가 이념’·‘제주도 사람’·‘어린이 마음’·‘시가 리듬’).
  - 영어는 2낱말 이상 조각에 `is|are|was|were|we|our|has|have|had|been|being`이 하나라도 있으면 문장(‘human being’·‘Being and Time’·‘Our Town’·‘what is literature’).
- 그러면 `kwList`가 거짓이 되고, `kwSentence`가 `kwPred(마지막)`·`some(kwEnVerb)`로 참이 되어 줄이 초록 본문이 된다.

**재현**: `cd tests/audit_opus_fid8/kw && node kwpred8.mjs`. 초록 뒤 주제어 자리에 둔다. 머리말 꼴은 국문 10·영문 6, 끝 낱말은 국문 13·영문 7, 끝은 마침표 있음/없음이다.

| 판 | 344줄 중 adb1ed4에서 주제어였는데 아닌 것 |
|---|---|
| 0d0039e | **118**(국문 11낱말 × 8머리말, 영문 5낱말 × 6머리말. 모두 마침표 꼴) |
| b9b9677 | **86**(‘국가 이념’류 ㅁ 받침 4낱말만 해소. `것`·`함/있음/없음`·영어는 남음) |
| 수정안 | **6**(`We the People`만) |

예(가상 줄, 0d0039e 역할):

| 줄 | adb1ed4 | 0d0039e |
|---|---|---|
| `[주제어] 가상, 시험, 정치적인 것.` | keywords | abstract |
| `「핵심어」 가상, 시험, 시적 모호함.` | keywords | abstract |
| `주제어 ― 가상, 시험, 함께 있음.` | keywords | abstract |
| `[Keywords] virtual, test, human being.` | keywordsEn | abstractEn |

- **산출**: `node tests/audit_opus_fid8/kw/kwpred8_run.mjs <판>/r3/lib.mjs`. 4줄 × 52곳 = 208회를 산출해 다시 읽었다.

  | 판 | 주제어 역할 | 학회 표기 치환 |
  |---|---|---|
  | adb1ed4 | 208 | 45 |
  | 0d0039e | **0** | **0** |
  | 수정안 | 208 | 45 |

  글자는 남는다. 다만 주제어 서식이 아니라 초록 문단 모양으로 나오고, 머리말이 학회 표기로 바뀌지 않는다.
- **실데이터**: 작가 원고 5편·PDF 40건에서 역할 변화 0(`rolediff8`).
- **기대/실제**: 쉼표로 이은 짧은 명사구 목록은 주제어다(6차 N6-1·F6-2에서 고친 방향). 실제로는 마지막 주제어가 ‘~것’·‘~함’·영어 be 동사·we가 든 명사구면 본문이 된다.
- **수정안 Q1**(`patched/apply.mjs`):

```js
// src/structure.js:64-65 — kwPred
const kwPred = (x) => { const w = (x || '').split(/\s+/); const z = w.at(-1) || ''; const jg = z ? (z.charCodeAt(z.length - 1) - 0xAC00) % 28 : -1;
  const pv = w.at(-2) || '';   // ‘정치적인 것’·‘시적 모호함’·‘함께 있음’·‘국가 이념’은 주제어 낱말이다
  return /(?:이다|였다|이었다|한다|했다|된다|됐다|있다|없다|같다|인가|는가|던가|을까|일까)$/.test(z)
    || (z === '것' && /(?:라는|다는|하는|되는)$/.test(pv))
    || (w.length >= 2 && (/다$/.test(z) || (/^(?:같음|있음|없음)$/.test(z) && /[이가과와]$/.test(pv))
      || (jg === 16 && (/(?:을|를|으로|로|에서|에게)$/.test(pv) || (/[이가은는도]$/.test(pv) && /(?:임|함|됨)$/.test(z)))))); };
// :66 — kwEnVerb: 조각 첫 낱말이 be·have·we이거나, 네 낱말 이상 조각 안에 있을 때만
const kwEnVerb = (x) => { const w = x.split(/\s+/); const ev = (y) => /^(?:is|are|was|were|has|have|had|we)$/i.test(y); return w.length >= 2 && (ev(w[0]) || (w.length >= 4 && w.slice(1).some(ev))); };
```

- **수정안 검증**
  - N7-1 `k7_body_lines` 오인 3/18 유지(`v8/kwbody8p.mjs`). 7차가 잡은 ‘범주이다·범주를 다룸·다음과 같음·것인가·범주라는 것·보존을 다룸’과 영어 3줄은 모두 문장으로 남는다.
  - Sonnet `kw6`(24꼴)·`kw7`·`kw7b`의 출력이 0d0039e와 같다. ‘[주제어] 가상, 시험, 보존이 관건임.’도 본문으로 남는다.
  - Opus `kwsent6`(88줄)·`kwforms5`·`bracket_run`·`falsehead` 로그가 같다(`run_all.sh pv8`).
- **한계**: `We the People`처럼 조각이 we로 시작하는 고유명은 여전히 문장으로 본다. ‘~하는 것’이 실제 주제어인 경우(‘말하는 것’)도 서술어로 본다.

### N8-2 (낮음·각주 위치) 들여 쓴 본문 문단이 다른 정의 아래에서 각주 문단으로 흡수된다

**위치**: `src/parse.js:330-331`(`gapIdx`, `bodyIndented`), `:333`, `:374`.
- N7-2 반영으로, 끝 묶음 밖에서 ‘정의 + 빈 줄 + 들여 쓴 블록’은 `gapIdx`에 들어가 ‘본문도 들여 씀’(`bodyIndented`)의 증거에서 빠진다.
- 이 블록이 인용 시가 아니라 **들여 쓴 본문 문단**이어도 똑같이 빠진다. 게다가 `q`는 빈 줄을 넘어 이어지므로, 다음 정의 전까지 들여 쓴 문단이 모두 빠진다.
- 원고의 들여 쓴 본문이 모두 이렇게 정의 뒤에 오면 `bodyIndented`가 거짓이 된다. 그러면 다른 정의 **바로 아래**(빈 줄 없음)의 들여 쓴 본문 문단이 이어짐으로 읽혀 각주에 붙는다.
- 이는 `:326`의 설계(‘정의를 문단마다 둔 원고: 들여 쓴 줄은 본문’)와도 어긋난다.

**재현**: `node tests/audit_opus_fid8/v8/txtcmp8b.mjs tests/audit_opus_fid8/fixtures/t8_gap_chain.txt tests/audit_opus_fid8/fixtures/t8_poem_ref.txt …`
- `t8_gap_chain.txt`(가상) 구성: 첫 본문 문단은 들여 쓰지 않음 + `[^1]`, 정의. 빈 줄 뒤 네 칸 들여 쓴 본문 문단 + `[^2]`. 정의 바로 아래 네 칸 들여 쓴 본문 문단, 빈 줄, 네 칸 들여 쓴 본문 문단, 장 제목, 본문.
- `t8_gap_chain_ctrl.txt`는 첫 문단도 들여 쓴 대조 원고다.
- `t8_poem_ref.txt`는 7차 `t7_mixed_cont`에서 인용 시 끝줄에 출처 각주를 단 원고다.

| 원고 | adb1ed4 | 0d0039e·b9b9677 | 수정안 |
|---|---|---|---|
| gap_chain 본문 / 각주 문단 | 9 / [1,1] | **8 / [1,2]**(본문 문단 하나가 각주 2의 둘째 문단) | 9 / [1,1] |
| gap_chain 경고 | ‘3줄은 본문 문단으로’ | ‘2줄은 본문 문단으로’(흡수된 줄은 알리지 않음) | ‘3줄은 본문 문단으로’ |
| gap_chain_ctrl | 8 / [1,1] | 8 / [1,1] | 8 / [1,1] |
| poem_ref 각주 문단 | [1,1,1] | [2,1,1] | [2,1,1] + ‘1줄을 같은 각주의 다음 문단으로 읽었습니다’ |

- **실데이터**: 작가 원고는 HWP라 해당 없다. PDF 파싱본 40건에는 `[^n]` 표기가 없다(`txt_md` fnDef 0). 영향 0이다.
- **기대/실제**: 본문 글은 각주로 옮겨지면 안 된다(옮길 때는 경고). 실제로는 본문 문단 1개가 경고 없이 각주 문단이 된다.
- **수정안 Q2**: 빈 줄 뒤 블록은 그 뒤가 **들여 쓰지 않은 본문 줄**일 때만 인용(시)으로 확정한다. 다음 정의나 파일 끝으로 이어지면 증거로 남긴다. 증거를 뺀 채 이어짐을 읽었으면 경고한다.

```js
// src/parse.js:330 — 빈 줄 뒤 블록을 pend에 모았다가, 들여 쓰지 않은 본문 줄로 돌아갈 때만 gapIdx로 확정
const contIdx = new Set(); const candIdx = new Set(); const gapIdx = new Set(); { let on = false, gap = false, q = false, pend = []; for (let i = 0; i < rawLines.length; i++) { const ln = rawLines[i]; if (isDef(ln)) { on = true; gap = false; q = false; pend = []; } else if (q && isCont(ln)) { pend.push(i); candIdx.add(i); } else if (on && isCont(ln)) { candIdx.add(i); if (!gap || i >= tailStart) contIdx.add(i); else { on = false; q = true; pend.push(i); } } else if (ln.trim() === '') { if (on) gap = true; } else { if (q) for (const k of pend) gapIdx.add(k); pend = []; on = false; q = false; } } }
// :374 — 증거에서 뺀 블록이 있는데 이어짐을 읽었으면 알린다
if (contLines && (bodyIndented || gapIdx.size)) warnings.push(/* 기존 문구 */);
```

- **수정안 검증**
  - 위 표. N7-2 `t7_mixed_cont` [2,1]·`t7_direct_cont` [2,1]·`t6_quote_after_def` [1,1]은 그대로다. `t7_mixed_cont`에는 정보 경고가 하나 는다.
  - `txtwarn6`·`txtcont5` 로그가 같다.
  - Sonnet `txtfuzz7` 20,000개 글 유실 0, 각주 수 불일치 0이다(중복 정의로 버려진 수만 76 → 75).
  - `rolediff8p`(329 파일 × 52)에서 파싱이 바뀐 것은 `t8_gap_chain`과 경고 줄 수 3파일뿐이다.

### N8-3 (낮음·서식) MD 규칙이 곳에 따라 다르다: 각주 정의(0d0039e)와 `.markdown` 확장자(HEAD까지)

**위치**: `src/parse.js:342`(`mdInline`), `:340`(`ESC = /^md$/i`).
- 0d0039e에서는 F7-4 반영이 본문 토큰(`tok`)에만 들어갔다. 그래서 각주 정의 안의 `\*별표\*`는 글자 `\별표\`에 `별표\` 기울임이 되고, `***굵은 기울임***`은 별표 여섯 개가 남는다. b9b9677에서 `mdInline`이 본문과 같은 규칙이 되어 해소됐다.
- `parseManuscript`는 `.markdown`도 텍스트로 받는다(`:21`). 앱은 끌어 놓기에서 확장자를 거르지 않는다. 그런데 `ESC`는 `md`만 보므로 `.markdown`에서는 `\*`가 TXT처럼 처리된다(HEAD에서도 남음).

**재현**: `node tests/audit_opus_fid8/app/show_md.mjs <src> tests/audit_opus_fid8/fixtures/m8_fn_escape.md tests/audit_opus_fid8/fixtures/m8_fn_escape.markdown`. 산출 확인은 `node tests/audit_opus_fid8/app/md_roundtrip.mjs <판>/r3/lib.mjs tests/audit_opus_fid8/fixtures/m8_fn_escape2.md koli,fcs,gubo,kopoetics`이다.
- 0d0039e: `.md` 본문은 `*별표*` + BI이고, 각주는 `\별표\`(I)·`***굵은 기울임***`이다.
- b9b9677: `.md`는 본문·각주 같음. `.markdown`은 본문·각주 모두 `\별표\`(I)다.
- 수정안: 모두 `*별표*` + BI다. 산출 HWP에서도 본문·각주 BI 런을 확인했다.
- **수정안 Q3**: `const ESC = /^(?:md|markdown)$/i.test(ext) ? …`. 0d0039e에는 b9b9677과 같은 `mdInline` 변경도 넣는다. `apply.mjs`는 b9b9677에서 이 부분을 ‘이미 반영’으로 건너뛴다.

### 관찰 (결함으로 세지 않음)

1. **단행본 변환의 연도 뒤 덧말**: F7-3 수정(`afterYear`)은 논문 갈래에만 걸린다. 단행본 `가상, 『가상 책』, 가상출판사, 2020, 재수록.`은 덧말이 발행처 자리로 들어간다. APA는 `…. 가상출판사, 재수록.`, Chicago는 `(가상출판사, 재수록, 2020)`이 된다. 글자는 남지만 뜻이 바뀐다. 이전부터 있던 것이고 작가 원고·PDF에서는 0이다(`cite_probe.mjs`).
2. **괄호 출판 정보 단행본**: `가상, 『가상 책』(가상출판사, 2020), 12쪽.`이 APA는 `… (p. 12). (가상출판사.`, Chicago는 `((가상출판사, 2020), 12.`가 되어 괄호 짝이 깨진다. 이전부터 있던 것이다. 코퍼스 1,719단위 중 변환 뒤 괄호가 어긋난 것은 0이다(`cite_paren.mjs`). 고친다면 `RE_BOOK` 꼬리가 `(`로 시작하면 변환하지 않게 하면 된다.
3. **정오표 표의 두 칸**: APA·Chicago에서 정오표의 ‘각주’ 칸은 변환된 글을 보이고, ‘문제’ 칸의 ‘참고문헌에 없음: …’은 변환 전 글 조각을 보인다. 같은 항목이 두 표기로 보인다. 표시만의 문제다.
4. **붉은 런 수**: 학회 규정·APA·Chicago 산출 HWPX의 붉은 런 수는 paper3에서만 41 대 38로 다르다(koli·kopoetics, fcs 21 대 20). 변환된 참고문헌이 강조 런(밑줄)을 버려 런이 합쳐지기 때문이다(7차 관찰 2). 붉은 **항목** 수는 같다(`app_red_hwpx.mjs`, 3곳 × 5편).
5. **`\[^1]`**: MD의 각주 표지 이스케이프는 지원하지 않는다. 역슬래시가 남고 빈 각주와 ‘정의 없음’ 경고가 생긴다. 이전부터 있던 것이다(`s7s/txt7c.mjs`).

---

## 4. 학회·원고 범위

- 작가 원고 5편 × 52곳(학회 규정): 독립 판독·바이트 대조(2장).
- 5편 × 52곳 × APA·Chicago(정오표 켬): `cite52`(520 HWP), `app_final.mjs`(앱 순서 780회), `app_red_hwpx.mjs`(koli·fcs·kopoetics × 5편 HWPX 붉은 런).
- PDF 파싱본 40 × 52곳: `rolediff8`. 40 × 6곳(koli·fcs·dongak·kopoetics·mkliterature·sanghur) × 3양식: 정오표. `cite_cls7`(koli).
- 가상 원고는 다음과 같다. 7차까지의 fixtures 270여 개에 이번 6개(`t8_gap_chain`·`t8_gap_chain_ctrl`·`t8_poem_ref`·`m8_fn_escape.{md,txt,markdown}`·`m8_fn_escape2.md`)를 더했다. 스크립트 안의 가상 줄은 주제어 344·208, 서지 14줄이다.

## 5. 수정안 검증 (`tests/audit_opus_fid8/patched/`)

**적용**: `node tests/audit_opus_fid8/patched/apply.mjs <src 폴더>`
- LF로 맞춰 치환한 뒤 원래 줄바꿈으로 되돌려 쓴다. 대상이 정확히 한 번 나오지 않으면 멈추고, 같은 수정이 이미 들어 있으면 ‘이미 반영’으로 건너뛴다.
- 0d0039e 사본(`patched/src/`)과 b9b9677 사본에 적용한 결과가 바이트 동일하다.
- CRLF로 바꾼 사본(`patched/crlf/`)에서도 줄바꿈만 빼고 같다(CRLF 376/376·339/339 유지). `node --check` 통과.

| 명령 | 0d0039e | 수정안 |
|---|---|---|
| `bash tests/audit_opus_fid8/run_all.sh pv8`(37종) | — | 0d0039e 로그와 **모두 같음**(시간 값 제외) |
| `node tests/audit_opus_fid8/pv8/rolediff8p.mjs`(0d0039e ↔ 수정안, 329 × 52) | — | 역할 다름 52(`t8_gap_chain`), 블록 다름은 이 파일과 `m8_fn_escape*` 3개뿐. 경고 다름 3건(`t7_mixed_cont` 사본 2개·`t8_poem_ref`의 정보 경고). 작가 원고·PDF 변화 0 |
| `kw/kwpred8.mjs` 손실 / `kwpred8_run.mjs` 주제어 역할·치환 | 118 / 0·0 | 6 / 208·45 |
| `v8/kwbody8p.mjs` N7-1 오인 | 3 | 3 |
| Sonnet `kw6`·`kw7`·`kw7b`(`s7s/_p_*`) | — | 0d0039e 출력과 같음 |
| `txtcmp8b.mjs` gap_chain / mixed / poem_ref | [1,2] / [2,1] / [2,1,1] | [1,1] / [2,1] / [2,1,1] |
| Sonnet `txtfuzz7`·`starfuzz6/7`·`fnfuzz6`·`starlit6`·`txt_battery`·`txt_md`·`txt7a~d` | — | 유실 0. 0d0039e와 다른 것은 `txtfuzz7` dupLost 76 → 75 한 값뿐 |
| `md_roundtrip.mjs m8_fn_escape2.md` 각주 | `\별표\`·`***` | `*별표*`·BI |

## 6. 확인 못 한 것

- 한컴오피스에서 직접 열어 보지 않았다. 붉은 글자 화면 표시, 주제어 머리말 굵기와 학회 규정의 일치는 확인하지 못했다.
- 브라우저(`dist/dev.html`)는 띄우지 않았다. 정오표 순서는 `app.js`의 `finalizeBlocks()` 원문을 node에서 그대로 실행해 확인했다(DOM과 말풍선 렌더링은 제외). `release/투고틀.html`은 실행하지 않았다. 해시가 `.sha256`과 같은 것(b9b9677 판)과 `kwPred`·`gapIdx`·`afterYear`·`EM3` 문자열이 들어 있는 것만 확인했다.
- `tools/verify_matrix.mjs`·`fidelity_test.mjs`·`pipeline_test.mjs`는 고정 출력 경로를 써서 실행하지 않았다. `tools/build.mjs`도 실행하지 않았다.
- N8-1 수정안의 서술어 판정이 실제 학회지 주제어 목록에서 놓치는 꼴이 있는지는 코퍼스(작가 5·PDF 40, 변화 0) 밖에서는 확인하지 못했다.
- DOCX는 합성 파일로만 시험했다.

## 7. 만든 파일 (`tests/audit_opus_fid8/`)

- `v8/`: 0d0039e 사본(`src/`)과 7차 하네스 사본이다. 이번 스크립트는 `kwbody8.mjs`·`kwbody8p.mjs`·`kwbody8b9.mjs`, `txtcmp8.mjs`·`txtcmp8p.mjs`·`txtcmp8b.mjs`, `rolediff8.mjs`다.
- `pv8/`: 수정안 하네스다(`rolediff8p.mjs` 포함). `b9/src/`: b9b9677 사본이다.
- `s5c`·`s8`·`s8p`·`sonnet8`·`sonnet8p`·`cite52`: 4~7차 하네스 사본이다. `s7s/`: Sonnet 7차 스크립트 사본이다(`h` = 0d0039e, `a` = adb1ed4, `p` = 수정안, `_a_*`·`_p_*` 변형).
- `app/`: 다음 스크립트다.
  - `app_final.mjs`: 앱 `finalizeBlocks()` 실행
  - `app_red_hwpx.mjs`
  - `show_md.mjs`
  - `md_roundtrip.mjs`
  - `cite_probe.mjs`
  - `cite_paren.mjs`
- `kw/`: `kwpred8.mjs`·`kwpred8_b9.mjs`·`kwpred8_run.mjs`.
- `fixtures/`: 7차 fixtures 사본과 이번 6개.
- `patched/`: `apply.mjs`(Q1~Q3), `src/`(적용본), `crlf/`(CRLF 시험본).
- `logs/`(`v8`·`pv8`·`indep`·`cite52_*`·`rolediff8*`·`errata7all_*`), `run_all.sh`·`run_indep.sh`.
- **주의**: `s5c/out`·`s5c/indep7`·`cite52/out4all`·`v8/r3/out`·`pv8/r3/out`에는 작가 원고의 글이 들어 있다. 저장소 밖으로 내보내지 말 것.
