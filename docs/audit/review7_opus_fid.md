점수: 94/100

# 7차 재감사 — A. 산출물 충실도 (opus_fid7, 2026-10-13 KST, main adb1ed4)

> 대상: main adb1ed4. 감사하는 동안 HEAD는 adb1ed4 그대로였다. 다만 보고서를 마칠 무렵 작업 트리의 `src/app.js`·`cite.js`·`parse.js`가 커밋되지 않은 채 바뀌어 있었다(이 감사가 고친 것이 아니다. 단행본 권·호 제외, `***` 강조 등으로 보인다). 그래서 작업 트리를 읽는 Sonnet 6차 스크립트 6종을 adb1ed4 사본에 대고 다시 돌렸고(`tests/audit_opus_fid7/sonnet6v7/`), 결과가 먼저 낸 로그와 같음을 확인했다. 수치는 모두 `git show adb1ed4:src/*`로 꺼낸 사본(`tests/audit_opus_fid7/v7/src/`)에서 냈다. 사본에서 바꾼 것은 engine.js의 rhwp 불러오기 경로 한 줄뿐이다. 줄 번호는 adb1ed4 작업 트리(CRLF) 기준이다.
> 이 보고서에는 원고의 제목·저자·본문·각주 문장을 쓰지 않았다. 작가 원고는 paper1~5, PDF 파싱본은 pdf-NN(파일 이름순)으로만 적는다. 인용한 줄은 모두 직접 만든 가상 원고(`tests/audit_opus_fid7/fixtures/`와 스크립트 안의 가상 조각)다. 서지 항목의 꼴은 한글→`가`, 라틴→`a`, 숫자→`9`로 가려서만 적었다.

## 요약

**판정: 6차 두 보고서의 새 결함은 모두 해소됐다. Opus N6-1~N6-4, Sonnet F6-1~F6-3이 해소됐고, F6-4·F6-5는 조치표대로 보류다. 작가 원고 보존 수치는 6차와 한 글자도 다르지 않다. APA·Chicago 52곳 전수(520회)에서도 각주 구조 불일치와 숫자 소실이 0이다. 이번 반영에서는 새 결함 3건이 생겼다. 셋 다 가상 원고에서만 드러나고, 작가 원고 5편과 PDF 파싱본 40건에서는 역할·글자 변화가 없다. 그 밖에 이전부터 있던 서지 변환 숫자 소실 하나를 PDF 파싱본에서 새로 확인했다.**

- **보존 수치(6차와 같음)**
  - 작가 원고 5편 × 52곳(260회): 산출 HWP를 Sonnet 4차의 독립 HWP5 판독기로 다시 읽어 엄격 대조했다. 판독 오류 0, 원고 문단 31,200개 중 사라진 것 0(paraMissOther 0)이다. 각주 9,308개는 글자·문단·줄바꿈·강조·번호·위치 불일치가 0이다. 새 번호 104/104, 본문 강조 4,940자 유실 0, 표지 치환 311·주제어 머리말 116이다. 하네스 결과는 254 OK·6 표시(litheory 4, fcs·iall × paper2)로 6차와 줄 단위로 같다.
  - **APA·Chicago 52곳 전수(5편 × 52곳 × 2양식 = 520회, 이번에 다시 함)**: 각주 18,616개의 개수·문단 수·줄바꿈·앞 공백·번호 문단 불일치 0이다. 바뀐 문단 중 숫자를 잃은 것은 참고문헌 5,200개·각주 2,860개 가운데 **0**이다(6차 be130c3에서는 0이 아니었다).
  - Opus 하네스: 135건은 통과 127·실패 8(daejung 4·litheory 4, 이전과 같음)이다. 독립 판독 135/135 오류 0이다. 가상 원고 5종 × 52곳은 OK 235, 11종 × 27곳은 OK 272다. PDF 40 × 6곳(240회)은 엄격 실패 0이다.
  - be130c3 ↔ adb1ed4, 213개 파일(작가 5 + PDF 40 + 가상 168) × 52곳(11,076조합): 파싱·역할·최종 블록이 달라진 것은 가상 원고 두 편(`k6_period.txt`, `t6_quote_after_def.txt`)뿐이다. 둘 다 6차 수정이 의도한 변화다.
- **6차 결함 판정**: Opus N6-1~N6-4 해소. Sonnet F6-1(서지 숫자 소실)·F6-2(마침표 주제어 줄)·F6-3(같은 id 정의) 해소. Sonnet F5-7③도 F6-3의 경고로 해소다. F6-4(재배열 안내 길이)·F6-5(일부 머리말 굵기 끊김)·F5-8(DOCX 버리는 서식 경고)은 그대로이며 보류 항목이다.
- **이번 반영에서 생긴 결함 (중요도순)**
  1. **N7-1 (중하·역할·위치, F5-B의 부분 재발)**: 주제어 나열 예외(`kwList`)와 Sonnet 절(`… || !/[,，、;；·・/]/.test(t)`)이 쉼표 나열이 든 본문 문장까지 주제어로 받는다. 대상은 괄호·대시 낱말로 시작하는 본문 줄이다. 가상 본문 줄 18개 중 **13개**가 be130c3에서는 본문이었는데 지금은 주제어다. 52곳 산출에서 936회 중 **676회**가 본론 밖(앞부분 주제어 자리)으로 옮겨지고, 167회는 머리말이 학회 표기로 바뀐다. be130c3은 0·0이었다.
  2. **N7-2 (낮음~중하·각주가 본문으로)**: TXT 이어짐 수정(N6-2)에서 ‘정의 + 빈 줄 + 들여 쓴 인용 시’가 이어짐에서 빠지면서 ‘본문도 들여 씀’(`bodyIndented`)의 증거로 셈해지게 됐다. 그 때문에 같은 원고의 다른 정의 **바로 아래** 진짜 이어짐까지 본문 문단이 된다. 가상 원고에서 각주 1의 문단 2 → 1, 본문 문단 8 → 9다. 경고는 나온다.
  3. **N7-3 (낮음·서식)**: 엔진 머리말 정규식 `KW_LABEL`이 판정 정규식보다 좁다. 판정이 주제어로 읽는 머리말 꼴 420개 중 310개를 머리말로 잡지 못한다(`주 제 어 :`, `한글 주제어:`, `국문 키워드:` 등). 학회 표기로 바뀌지 않는 것은 이전부터다. 이번 `csAt` 변경(머리말 없는 주제어 줄은 값 모양)으로, 이 꼴의 머리말이 이제 값 모양(굵게 빠짐)으로 쓰인다.
  - **이전부터 있던 것(이번에 새로 잼)**: F6-1 수정이 막지 못한 숫자 소실이 하나 남아 있다. 단행본 갈래(`RE_BOOK`)로 읽힌 항목에 권·호가 있으면 APA·Chicago 단행본 서식에 그 자리가 없어 숫자가 사라진다. 작가 원고에서는 0이고, PDF 파싱본 40건에서는 참고문헌 29항목·숫자 36개다.
- 수정안 P1~P4를 `tests/audit_opus_fid7/patched/apply.mjs`로 adb1ed4 사본에 적용해 검증했다. 결과는 다음과 같다.
  - N7-1 676 → 156회. 남은 156회는 서술어가 없는 나열 조각 3줄이며, 주제어로 볼 여지가 있다.
  - N7-2 각주 문단 2 유지. N7-3 310 → 0. PDF 숫자 소실 29 → 0.
  - 작가 원고 260회의 산출 HWPX가 adb1ed4와 **바이트 단위로 같다**. 213개 파일 × 52곳의 역할·블록 변화 0, 회귀 로그 40종 중 달라진 것은 경고 줄 수 하나다(5장).

### 95점에 이르기 위해 고쳐야 할 것 (우선순위)

| 순위 | 할 일 | 위치(adb1ed4) | 크기 | 사본 검증 |
|---|---|---|---|---|
| 1 | N7-1 나열 예외와 Sonnet 절이 서술어로 끝나는 조각(‘범주이다’·‘범주를 다룸’·‘다음과 같음’·‘것인가’)과 영어 동사가 든 조각을 문장으로 보게 한다. 분리 문자에 `・`를 넣는다 | `src/structure.js:63-65` | 5줄 | 가상 18줄 FP 13 → 3, 52곳 이동 676 → 156·머리말 바뀜 167 → 45. Sonnet `kw6` 24꼴·Opus `kwsent6` 88줄·`kwforms5`·`bracket_run`·`falsehead` 결과가 adb1ed4와 같음 |
| 2 | N7-2 끝 묶음 밖 ‘정의 + 빈 줄 + 들여 쓴 블록’은 `bodyIndented` 증거에서 뺀다. 블록 전체를 경고 줄 수에 넣는다 | `src/parse.js:330-331` | 2줄 | 가상 원고 각주 [2,1]·본문 8 + 경고. `t6_quote_after_def` 본문 9 유지. 213개 파일 파싱 변화는 경고 줄 수 1건뿐 |
| 3 | N7-3 `KW_LABEL`을 판정 정규식과 맞춘다(띄어 쓴 머리말, `국문`·`한글`·`영문` 접두) | `src/engine.js:192` | 1줄 | 놓침 310/420 → 0. 바탕틀 19곳 38개 예시의 머리말 추출 변화 0. 4개 가상 원고 × 10곳에서 학회 표기로 바뀌고 머리말·값이 나뉨 |
| 4 | (이전부터) 단행본 갈래에 권·호가 잡히면 변환하지 않는다 | `src/cite.js:57` | 1줄 | PDF 29항목 숫자 소실 → 0(변환하지 않고 ‘인식 못 함’으로 셈). 작가 원고 변환 수 173 그대로 |

1을 고치면 95점, 1~3을 모두 고치면 96점으로 본다. 4는 이전부터 있던 것이고 작가 원고에는 없지만, 숫자가 사라지는 종류라 함께 고치기를 권한다. 보류 항목(DOCX 스타일 서식·자동 번호·루비·텍스트 상자, 표·그림 자리 표시, 검증 도구 보강, 재배열 안내 길이)은 감점에 넣지 않았다.

감점 내역: N7-1 -2(이미 고친 결함 F5-B의 재발이고 문단 위치를 옮긴다), N7-2 -1, N7-3 -0.5, 단행본 권·호 숫자 소실 -0.5, 관찰 항목 2·3 -0.5, litheory 국문초록 제목 기울임·daejung 주제어 예시 굵기(데이터, 이전부터) -1. 보류 항목의 조용한 서식 손실은 따로 표시하고 감점에 넣지 않았다.

---

## 1. 6차 결함의 재판정

재현 방법은 다음과 같다.
- 6차 Opus 하네스는 `tests/audit_opus_fid6/v6/`를 `tests/audit_opus_fid7/v7/`로 복사해 src만 adb1ed4로 바꿨다.
- 4·5차 하네스는 `s6v` → `s7`, `sonnet6v` → `sonnet7`, `sonnet5c` → `s5c`로 옮겼다(가져오기 경로만 `../v7/src`).
- Sonnet 6차 스크립트는 `tests/audit_sonnet_fid6/`에서 그대로 돌렸다. `_h`가 없는 스크립트는 작업 트리 src(= adb1ed4, `git diff --quiet adb1ed4 -- src` 확인)를 읽고, `_h`는 be130c3 사본을 읽는다.

일괄 실행은 `bash tests/audit_opus_fid7/run_all.sh v7`, `bash tests/audit_opus_fid7/run_indep.sh`이고, 로그는 `tests/audit_opus_fid7/logs/v7/`·`logs/indep/`·`logs/sonnet6/`에 있다.

### Opus 6차 (opus_fid6, 93점)

| 결함 | 판정 | 재현 명령 | 6차 → 7차 |
|---|---|---|---|
| N6-1 괄호·대시 머리말 + 마침표 주제어 줄 놓침 | **해소(새 결함 N7-1)** | `node tests/audit_opus_fid7/v7/kwsent6.mjs` | 놓침 39/88 → **0/88** |
| N6-2 정의 뒤 빈 줄 + 들여 쓴 인용 시가 각주로 | **해소(새 결함 N7-2)** | `node tests/audit_opus_fid7/v7/txtcmp7.mjs tests/audit_opus_fid6/fixtures/t6_quote_after_def.txt`, `node tests/audit_opus_fid7/v7/txtwarn6.mjs` | 본문 7 → **9**, 각주 문단 [3,1] → **[1,1]**, 경고 0 → 1 |
| N6-3 영문 주제어 머리말·값 글자 모양, anim `Key〻words` | **해소** | `node tests/audit_opus_fid7/v7/kwlabshape6.mjs tests/audit_opus_fid6/fixtures/k6_plain.txt,tests/원고/paper1.hwp,…paper2,…paper3,…paper5 tpl -v`, `kwbold5.mjs` | 주제어 줄 125개 머리말 다름 10 → **0**, 값 다름 5 → **0**. gubo·kopoetics 영문 머리말 굵은 글자 0 → 11·13(paper1·2·3·5) |
| N6-4 이중 표기 `주제어(Keywords):` 미치환·갈라짐 | **해소** | `node tests/audit_opus_fid7/v7/kwshape6.mjs tests/audit_opus_fid6/fixtures/k6_dual.txt koli,fcs,gubo,kopoetics,aagcc,anim,klc,dongak,eastasia,kdrama` | koli·fcs·gubo·kopoetics·aagcc·klc·dongak·eastasia는 학회 표기로 바뀌고 머리말 전체가 머리말 모양. anim·kdrama(쓸 수 있는 예시 머리말 없음)는 원고 표기 그대로이고 갈라지지 않음 |

### Sonnet 6차 (sonnet_fid6, 94점)

| 결함 | 판정 | 재현 명령 | 6차 → 7차 |
|---|---|---|---|
| F6-1 빈 저자·연월일 항목 숫자 소실 | **해소(이전부터의 다른 꼴은 §3.4)** | `cd tests/audit_sonnet_fid6 && node cite_virt6b.mjs`, `node cite_loss6.mjs`, `node errata_cmp6.mjs`. 52곳 전수: `bash tests/audit_opus_fid7/cite52/run.sh` | 가상 6줄 변환 5 → 0(모두 ‘인식 못 함’). 작가 원고 숫자 소실 12·18·5(paper3·4·5) → **0**. 520회 산출 숫자 소실 문단 → **0**. 정오표 ‘인용되지 않음’ paper3 24 → 13, paper5 16 → 12(Sonnet 수정안과 같음) |
| F6-2 마침표로 끝나는 주제어 줄 12꼴 | **해소(새 결함 N7-1)** | `cd tests/audit_sonnet_fid6 && node kw6.mjs` | 미인식 17 → **5**(남은 5꼴은 b2e07b0부터 인식하지 않던 꼴). `[주제어] 가상・시험.`도 인식 |
| F6-3 같은 id 정의, `[^toString]` | **해소** | `node tests/audit_opus_fid7/v7/dupdef7.mjs`, `cd tests/audit_opus_fid7/s5c && node txt_orphan.mjs`, `cd tests/audit_sonnet_fid6 && node txtfuzz6.mjs` | 중복 정의 경고 나옴(F5-7③도 해소). `[^toString]` → 빈 각주 + ‘정의 없음’ 경고, `[^__proto__]`·`[^constructor]` 정상. 퍼저 20,000개 글 유실 0(중복 정의 손실은 모두 경고와 짝) |
| F6-4 재배열 안내 길이 | 보류(그대로) | `node tests/audit_opus_fid7/v7/reorder6.mjs @pdf` | 정확 2,080/2,080. 길이 중앙값 141자, 최대 217자, 200자 초과 158/1,964 |
| F6-5 `<Keywords>`·`Keywords -` 굵기 끊김 | 부분 해소/보류 | `node tests/audit_sonnet_fid6/kwsplit6.mjs` | 괄호 덧붙임 두 꼴은 학회 표기로 바뀜. `<Keywords>`·`Keywords -`는 그대로 |

### 이전부터 남은 것

| 발견 | 7차 판정 | 수치 |
|---|---|---|
| Opus F-8 litheory 국문초록 제목 기울임 | 그대로(데이터) | `papers27` 실패 8 중 4 |
| daejung 주제어 예시 전체 굵게 | 그대로(규정 확인 필요) | 실패 8 중 4 |
| Sonnet F5-8 DOCX 취소선·아래첨자 경고 없음 | 그대로(보류) | `s5c/docx_marks.mjs` warnings `[]` |
| Sonnet F-07 앞부분 역할 | 그대로(규칙 한계) | `roles_test` 259/264 |
| `*A*😀`(보조평면 글자 앞 닫는 별표) | 그대로 | `txt_battery` 같음 |
| Opus F-11.3 두 줄 제목 + 부제, DOCX 미주 `customMarkFollows` | 그대로 | — |

---

## 2. 회귀 수치 (adb1ed4 사본)

| 명령 | 건수 | 결과(be130c3와 비교) |
|---|---|---|
| `bash tests/audit_opus_fid7/run_indep.sh`(`s5c`: `run_files.mjs` × 5편 `--save` → `run_indep_all.py` → `compare4.mjs`) | 260(+원고 5) | 판독 오류 0. 비교 JSON이 6차와 글자 단위로 같다(paraMissOther 0, 각주 차이 0, 새 번호 104, 강조 유실 0, labelRepl 311, kwRepl 116) |
| `bash tests/audit_opus_fid7/cite52/run.sh`(Sonnet `cite_all6`·`cite_cmp_all6`·`cite_digits6` 사본) | 520 | 각주 18,616개 개수·문단·줄바꿈·앞 공백·번호 문단 불일치 0. 참고문헌 문단 5,200·각주 문단 2,860 변경 중 숫자 소실 0 |
| `run_all.sh v7`의 로그 37종(`papers27`·`indep`·`fixtures52/27`·`pdfrun`·`bracket`·`falsehead`·`kwforms5`·`kwlabel`·`labels`·`star5/5b`·`txtcont5`·`docxnum5`·`fnspace`·`reorder_note`·`pdftail`·`cite5*`·`s7`·`sonnet7` 하네스) | — | 시간 값을 빼면 6차 로그와 같다. 다른 것은 의도한 셋뿐이다: `cite5_papers`(변환 수 30·33·58·36·47 → 28·30·45·27·43, 구조 차이 0), `kwbold`(gubo·kopoetics 영문 머리말 굵게 복구), `txtwarn6`(N6-2) |
| `node tests/audit_opus_fid7/v7/rolediff7.mjs`(be130c3 ↔ adb1ed4) | 213 × 52 | 역할 다름 104·블록 다름 208. 모두 `k6_period.txt`·`t6_quote_after_def.txt`(의도) |
| `node tests/audit_opus_fid7/v7/cite7.mjs` / `cite7.mjs @pdf` | 작가 403조각 / PDF 1,316조각 | 작가: 변환 204 → 173. 빠진 31 중 27은 be130c3 변환이 숫자를 잃던 것이고, 4는 저자 칸에 낫표가 든 항목(보수적 제외). 남은 변환의 숫자 소실 0. PDF: 변환 95 그대로, **숫자 소실 29항목·36개(이전부터, §3.4)** |
| `node tests/audit_opus_fid7/v7/errata7all.mjs` | 5편 × 52 | 각주 ‘참고문헌에 없음’ 3,120 → 2,132, 참고 ‘미인용’ 3,376 → 2,492, ‘인용 쪽수 없음’ 520 → 468(paper4의 날짜 항목 하나가 52곳에서 빠짐, 관찰 2). PDF 40 × 52는 변화 0 |
| `node tests/audit_opus_fid7/v7/tpllabel7.mjs` | 바탕틀 19곳 38예시 | 엔진이 뽑는 예시 머리말이 be130c3과 같음(새 괄호 덧붙임 규칙이 바탕틀 안내문을 머리말로 잡지 않음) |

---

## 3. 이번 반영에서 생긴 결함 (중요도순)

### N7-1 (중하·역할·위치) 쉼표 나열이 든 괄호 낱말 본문 문장이 다시 주제어가 되어 앞으로 옮겨진다 — F5-B의 부분 재발
- **위치**: `src/structure.js:63-65`. 두 갈래가 겹친다.
  - `kwList`(Opus Q1): 쉼표로 나눈 조각이 둘 이상이고 각각 4낱말·24자 이하면 목록으로 본다. 예외는 ‘끝 조각이 두 낱말 이상이고 다로 끝남’ 하나뿐이다. 그래서 ‘범주이다.’(한 낱말), ‘범주를 다룸.’, ‘다음과 같음.’, ‘것인가.’, 영어 문장 조각(‘we discuss A’)이 목록이 된다.
  - Sonnet 절 `(서술 종결 || !나열 기호)`: 나열 기호가 있고 종결이 `다|요|까|죠|음|임|함 + 마침표`가 아니면 문장이 아니라고 본다. ‘다룸.’·‘것인가.’·영어 문장이 여기를 통과한다.
- **재현**
  - `node tests/audit_opus_fid7/v7/kwbody7.mjs tests/audit_opus_fid7/fixtures/k7_body_lines.txt`: 가상 본문 줄 18개를 본론 자리에 두고 판별로 인식한다. be130c3에서 모두 body였던 줄 중 adb1ed4에서 keywords·keywordsEn인 것이 **13**이다. 예(가상 줄):

    | 원고 줄(본론 안) | be130c3 | adb1ed4 |
    |---|---|---|
    | `「핵심어」 개념, 용어, 범주이다.` / `… 범주였다.` / `… 범주라는 것.` | body | keywords |
    | `「핵심어」 개념, 용어, 범주를 다룸.` / `「핵심어」 개념, 정의, 쓰임은 다음과 같음.` | body | keywords |
    | `「주제어」 문제, 즉 무엇을 고를 것인가.` | body | keywords |
    | `[핵심어] 가상・시험・보존을 다룸.` | body | keywords |
    | `[Keywords] In this paper, we discuss A, B, and C.` / `<Keywords> Briefly, the term is used here, and only here.` | body | keywordsEn |

  - `node tests/audit_opus_fid7/v7/kwbody7_run.mjs <lib>`(`fixtures/k7_body_list.txt`, 18줄 × 52곳 산출을 다시 읽음):

    | 판 | 글자 바뀜 | 본론 밖 이동 |
    |---|---|---|
    | 234555a | 197 | 936 |
    | be130c3 | **0** | **0** |
    | dd20376 | 152 | 572 |
    | **adb1ed4** | **167** | **676** |

    옮겨진 줄은 앞부분 주제어 자리로 가고, 학회가 머리말 표기를 주면 `「핵심어」`가 `● 주제어 : `·`국문주제어: ` 등으로 바뀐다.
- **실데이터**: 작가 원고 5편·PDF 40건에는 이 꼴이 없다(`rolediff7` 역할 변화 0).
- **기대/실제**: 5차(F5-B)에서 고친 대로, 괄호 낱말로 시작하는 본문 문장은 본문에 남아야 한다. 실제로는 쉼표 나열이 섞이면 13/18이 주제어가 된다.
- **수정안**(P1, 사본 검증 결과):
  - FP 13 → 3. 남은 3줄 `(키워드) 검색, 분류, 정리.`·`『키워드』 이후, 문화 연구, 그리고 비평.`·`「색인어」 작성, 편집, 교정을 거친 판본.`은 서술어가 없어 주제어로 볼 여지가 있다.
  - 52곳 이동 676 → 156, 글자 바뀜 167 → 45.
  - Sonnet `kw6`(24꼴) 출력은 adb1ed4와 같다(미인식 5). Opus `kwsent6` 0/88, `kwforms5`, `bracket_run`, `falsehead_run`도 같다.
  - 213개 파일 × 52곳 역할 변화 0.
```js
// src/structure.js:63 — 분리 문자에 ・(U+30FB)
const kwItems = kwHead ? t.slice(kwHead[0].length).replace(/[.．。!?！？]\s*["”’'」』)]*\s*$/, '').split(/[,，、;；·・ㆍ\/]/).map((x) => x.trim()).filter(Boolean) : [];
// 서술어로 끝나는 조각: ‘범주이다’·‘범주였다’·‘범주라는 것’·‘고를 것인가’·‘범주를 다룸’·‘다음과 같음’
const kwPred = (x) => { const w = (x || '').split(/\s+/); const z = w.at(-1) || ''; const jg = z ? (z.charCodeAt(z.length - 1) - 0xAC00) % 28 : -1;
  return /(?:이다|였다|이었다|한다|했다|된다|됐다|있다|없다|같다|인가|는가|던가|을까|일까|것)$/.test(z) || (w.length >= 2 && (/다$/.test(z) || /(?:같음|있음|없음|함|됨|임)$/.test(z) || (jg === 16 && /[을를은는이가에도로]$/.test(w.at(-2))))); };
const kwEnVerb = (x) => x.split(/\s+/).length >= 2 && /\b(?:is|are|was|were|we|our|has|have|had|been|being)\b/i.test(x);   // ‘we discuss A’·‘is broad’
// :64
const kwList = kwItems.length >= 2 && kwItems.every((x) => x.length <= 24 && x.split(/\s+/).length <= 4 && !kwEnVerb(x)) && !kwPred(kwItems.at(-1));
// :65 — Sonnet 절에 같은 판정을 더한다
… && !kwList && (/(?:다|요|까|죠|음|임|함)\s*[.．。!?！？]\s*["”’'」』)]*\s*$/.test(t) || kwPred(kwItems.at(-1)) || kwItems.some(kwEnVerb) || !/[,，、;；·・/]/.test(t));
```
  - 한계 1: ㅁ 받침 명사형(‘다룸’)은 앞 낱말이 조사(을·를·은·는·이·가·에·도·로)로 끝날 때만 서술어로 본다. ‘사랑과 죽음’·‘타자의 마음’·‘근대적 꿈’ 같은 주제어 낱말을 지키기 위해서다.
  - 한계 2: 영어는 2낱말 이상 조각에 be·have·we류가 있을 때만 문장으로 본다.

### N7-2 (낮음~중하·각주가 본문으로) 정의 뒤 인용 시가 있으면 다른 정의의 진짜 이어짐이 본문이 된다
- **위치**: `src/parse.js:330-331`. N6-2 수정으로, 끝 묶음 밖에서 빈 줄 뒤의 들여 쓴 줄은 `contIdx`에 들지 않는다. 그런데 `bodyIndented`는 ‘`contIdx`에 없는 들여 쓴 줄이 하나라도 있으면 참’이다. 그래서 인용 시 줄이 ‘본문도 들여 씀’의 증거가 된다. `bodyIndented`가 참이면 끝 묶음 밖의 이어짐은 하나도 쓰지 않으므로(`:333`의 `!bodyIndented || i >= tailStart`), 정의 바로 아래(빈 줄 없음) 네 칸 들여 쓴 진짜 이어짐까지 본문 문단이 된다.
- **재현**: `node tests/audit_opus_fid7/v7/txtcmp7.mjs tests/audit_opus_fid7/fixtures/t7_mixed_cont.txt tests/audit_opus_fid7/fixtures/t7_direct_cont.txt`
  - `t7_mixed_cont.txt`: 정의를 문단마다 둔다. 각주 1 정의 바로 아래에 네 칸 이어짐 한 줄을 두고, 각주 2 정의 아래에는 빈 줄 뒤 탭 들여 쓴 시 두 줄을 둔다. 본문은 들여 쓰지 않는다.
  - `t7_direct_cont.txt`: 위에서 인용 시만 뺀 원고다.

  | 원고 | 판 | 본문 문단 | 각주 문단 | 경고 |
  |---|---|---|---|---|
  | mixed | b7d5603 | 8 | [2,1] | 0 |
  | mixed | be130c3 | 6 | [2,3] | 0 |
  | mixed | **adb1ed4** | **9** | **[1,1]** | 1(‘2줄은 본문 문단으로’) |
  | direct | be130c3·adb1ed4 | 6 | [2,1] | 0 |

  인용 시가 없으면 이어짐이 지켜지는데, 다른 각주 아래에 인용 시가 있다는 이유로 각주 1의 둘째 문단이 본문으로 나온다.
- **기대/실제**: 정의 바로 아래의 이어짐은 각주에, 빈 줄 뒤의 인용 시는 본문에 있어야 한다(b7d5603이 그랬다). 실제로는 둘 다 본문이다. 경고는 나오지만 줄 수가 실제와 다르다(인용 시 첫 줄과 이어짐 한 줄만 셈).
- **수정안**(P2, 사본 검증: mixed 본문 8·각주 [2,1]·경고 ‘2줄’(시 두 줄). `t6_quote_after_def` 본문 9·[1,1] 유지(경고 줄 수 1 → 2). `txtwarn6` Q2·Q3·T2b·R1 같음. 213개 파일 × 52곳 파싱 변화는 이 경고 줄 수 하나뿐. Sonnet `txtfuzz6` 20,000개 글 유실 0):
```js
// src/parse.js:330 — 빈 줄 뒤 들여 쓴 블록(인용 시)을 gapIdx로 따로 표시하고 블록 전체를 후보(경고)에 넣는다
const contIdx = new Set(); const candIdx = new Set(); const gapIdx = new Set(); { let on = false, gap = false, q = false; for (let i = 0; i < rawLines.length; i++) { const ln = rawLines[i]; if (isDef(ln)) { on = true; gap = false; q = false; } else if (q && isCont(ln)) { gapIdx.add(i); candIdx.add(i); } else if (on && isCont(ln)) { candIdx.add(i); if (!gap || i >= tailStart) contIdx.add(i); else { on = false; q = true; gapIdx.add(i); } } else if (ln.trim() === '') { if (on) gap = true; } else { on = false; q = false; } } }
// :331 — 그 블록은 ‘본문도 들여 씀’의 증거가 아니다
const bodyIndented = rawLines.some((ln, i) => !isDef(ln) && isCont(ln) && !contIdx.has(i) && !gapIdx.has(i)); let contLines = 0;
```

### N7-3 (낮음·서식) 판정은 주제어로 읽는데 엔진이 머리말을 못 잡는 꼴: 머리말이 값 모양이 된다
- **위치**: `src/engine.js:192`(`KW_LABEL`), `:384`(`csAt`).
  - 판정 정규식 `RE.keywords`(`src/structure.js:12`)는 띄어 쓴 머리말(`주\s*제\s*어`)과 `국문`·`한글` 접두를 모든 낱말에 받는다.
  - `KW_LABEL`은 붙여 쓴 낱말과 `국문 주제어`·`국문 핵심어`·`영문 주제어`만 받는다.
  - 이런 줄은 이전부터 학회 표기로 바뀌지 않았다. 이번 `csAt` 변경(`L <= 0`이면 줄 전체를 `valueCs`)으로 머리말까지 값 모양이 됐다. be130c3에서는 줄 전체가 머리말 모양이었다.
- **재현**
  - `node tests/audit_opus_fid7/v7/kwlabgap7.mjs`: 접두 7종 × 낱말 6 × 붙임·띄움 × 구분 기호 5 = 420꼴이 모두 주제어로 판정된다. 그중 **310꼴**은 `KW_LABEL`이 구분 기호까지 잡지 못한다. 띄어 쓴 꼴 210(접두 7종 모두), `국문`·`한글`을 붙인 꼴 100(붙여 쓴 `국문주제어`·`국문핵심어`는 잡힘)이다.
  - `node tests/audit_opus_fid7/v7/kwshape6.mjs tests/audit_opus_fid7/fixtures/k7_lab_hangul.txt koli,fcs,gubo,kopoetics,…`(`k7_lab_spaced.txt`도 같음): `한글 주제어: 가상, 시험`·`주 제 어 : 가상, 시험`을 다시 읽는다.
    - fcs·gubo·kopoetics 국문: be130c3에서는 줄 전체가 굵었고(머리말 모양), adb1ed4에서는 줄 전체가 값 모양으로 굵게가 없다.
    - 10곳 모두 머리말이 학회 표기로 바뀌지 않는다.
- **실데이터**: 작가 원고의 주제어 머리말은 모두 `KW_LABEL`이 잡는 꼴이다(kwRepl 116, 주제어 줄 125개 머리말·값 모양 불일치 0).
- **수정안**(P3, 사본 검증 결과):
  - 놓침 310 → 0. 4개 가상 원고 × 10곳에서 `● 주제어 : `·`주제어:  `[굵게] + 값 모양으로 쓰인다.
  - 바탕틀 38예시의 머리말 추출 변화 0(`patched/tpllabel7.mjs`). 작가 원고 260회 HWPX는 adb1ed4와 바이트 단위로 같다.
```js
// src/engine.js:192 — 낱말 부분만 판정 정규식과 같게(뒤 괄호 덧붙임·꼬리는 그대로)
const KW_LABEL = /^([^가-힣A-Za-z0-9]{0,3}(?:(?:(?:국문|한글|영문)\s*)?(?:주\s*제\s*어|핵\s*심\s*어|키\s*워\s*드|색\s*인\s*어|주\s*요\s*어|중\s*심\s*어)|key[\s〻]*-?[\s〻]*words?|keywords?)(?:\s*[(（][^()（）]{1,24}[)）](?=\s*[:：;；|￨]))?[\s:：;；|￨\]】〕❙」』)）]{0,4})/i;
```

### 3.4 (이전부터, 이번에 새로 잼) 권·호가 잡힌 단행본 갈래 항목이 APA·Chicago 변환에서 숫자를 잃는다
- **위치**: `src/cite.js:57`. `RE_BOOK` 갈래는 `classify`가 권(`vol`)·호(`issue`)를 잡아도 변환한다. 그런데 `formatAPA`·`formatChicago`의 단행본 서식에는 권·호 자리가 없다. 논문 제목이 낫표가 아닌 따옴표로 된 학술지 논문(`저자, “논문”, 『학술지』 12집, …`)과 여러 권 저서가 여기에 걸린다.
- **재현**: `node tests/audit_opus_fid7/v7/cite7.mjs @pdf` → newLossy 29·newLostDigits 36. `node tests/audit_opus_fid7/v7/cite7loss.mjs`는 꼴별로 보여 준다(모두 참고문헌, 단행본 갈래). 꼴은 `『가』 가99가`(‘『서명』 제NN집’) 14, `『가 가』 가99가` 2, `『가』 99(9)` 2, `󰡔가󰡕 가99가 9가` 2 등이다. pdf-18·19·24·25·29·30·32·35·39에 있다. be130c3에서도 같다.
- **실데이터**: 작가 원고 5편은 0이다(F6-1 수정 뒤 변환 173조각의 숫자 소실 0).
- **수정안**(P4, 사본 검증: PDF 숫자 소실 29 → 0. 29항목은 ‘인식 못 함’으로 세어 원고대로 둔다. 작가 원고 변환 수 173 그대로):
```js
// src/cite.js:57
if (!c.year || c.dated || c.vol || c.issue) return null;   // 권·호는 단행본 서식에 자리가 없다
```

### 그 밖의 관찰 (결함 아님 또는 영향 없음)
1. **연·월 표기의 변환 제외**: `dated` 판정(`/\d{4}\s*[.년]\s*\d/`)은 연월일뿐 아니라 연·월(`2010.12`)도 뺀다. 국내 학술지 논문 항목에 흔한 꼴이다. APA·Chicago의 학술지 논문은 연도만 쓰므로 be130c3의 변환(`(2010)`)이 서식상 맞았다(`node tests/audit_opus_fid7/v7/citeym7.mjs`). 이제 그 항목은 ‘인식 못 함’으로 원고대로 남는다. 작가 원고·PDF에는 이 꼴이 0이라 영향이 없다. 연월일만 빼는 판정 `/\d{4}\s*[.년]\s*\d{1,2}\s*[.월]\s*\d/`을 `tests/audit_opus_fid7/p5/cite.js`에서 시험했다. 가상 줄은 다시 변환되고 코퍼스 변화는 0이다(`cite7_p5.mjs`). 선택 사항이다.
2. **정오표의 날짜 항목 점검 생략**: 날짜 항목은 `parseCitation`이 null이 되어 `keyOf`가 구조 없는 키로 대조한다. 대조 결과는 좋아졌다(위 표). 그러나 `formatIssues`의 ‘인용 쪽수 없음’·‘발행 연도 없음’ 점검이 이 항목에서 빠진다. paper4의 각주 하나(꼴 `「가 ‘가 가’ 9가 가」, 『가』, 9999.99.99.`, 신문 기사)가 52곳에서 빠졌는데, 신문 기사라 원래 지적이 과했던 경우다. 연·월 항목에도 같은 생략이 적용된다는 점만 적어 둔다.
3. **경고 줄 수**: N6-2 경고(`candIdx.size`)는 빈 줄 뒤 블록의 첫 줄만 센다. 그리고 `bodyIndented` 원고(txtwarn6 Q2)에서는 이어짐 다음의 들여 쓴 본문 줄까지 센다. 문구는 맞지만 줄 수가 실제와 다르다. P2가 앞의 것을 고친다.
4. **검증 도구(`tools/verify_matrix.mjs:88`)**: 주제어 줄은 기대 글꼴과 맞는 런이 하나라도 있으면 그 런을 본다. 기대값은 예시의 첫 한글 자리에서 읽는다. 그래서 국문은 머리말 런만, 값에 한글 안내문이 있는 영문 예시(gubo 등)는 값 런만 확인하고, 나머지 런이 틀려도 통과한다. 이번 N7-3 같은 머리말·값 모양 회귀는 매트릭스로 잡히지 않는다. 검증 도구 보강은 보류 항목이라 감점하지 않았다. 매트릭스는 `tests/out/`에 쓰므로 실행하지 않았다.

---

## 4. 실행한 명령과 수치 (adb1ed4 사본 → 수정안 사본)

수정안 적용: `node tests/audit_opus_fid7/patched/apply.mjs [src 폴더]`.
- P1~P4를 LF로 맞춰 치환한 뒤 원래 줄바꿈으로 되돌려 쓴다. 대상 문자열이 정확히 한 번 나오지 않으면 멈춘다.
- `patched/src/`(git blob 사본, LF)와 작업 트리 CRLF 사본(`tests/audit_opus_fid7/crlfcheck/`)에 모두 적용했다. 두 결과는 줄바꿈만 빼고 같다(CRLF 338/338 등 유지).

| 명령 | adb1ed4 | 수정안 |
|---|---|---|
| 독립 판독 260회(`run_indep.sh` → `run_indep_patched.sh`) | 유실·불일치 0, kwRepl 116 | `compare4` 결과 같음, 산출 HWPX 260개 **바이트 동일** |
| `run_all.sh v7` → `run_all.sh patched`(로그 37종 + `s5c`→`s5cp` 5종) | — | 시간 값 빼고 같음. 다른 것은 `txtwarn6` 경고 줄 수(1 → 2) 하나 |
| `kwbody7.mjs` FP / `kwbody7_run.mjs` 이동·글자 바뀜 | 13/18 / 676·167 | 3/18 / 156·45 |
| Sonnet `kw6.mjs` 미인식(24꼴) / Opus `kwsent6` | 5 / 0 | 5 / 0(출력 같음) |
| `txtcmp7.mjs t7_mixed_cont` 본문 / 각주 문단 | 9 / [1,1] | 8 / [2,1] |
| `kwlabgap7.mjs` 머리말 놓침 | 310/420 | 0/420 |
| `tpllabel7.mjs` 바탕틀 예시 머리말 변화(be130c3 대비) | 0 | 0 |
| `cite7.mjs` 작가 변환 / 숫자 소실 | 173 / 0 | 173 / 0 |
| `cite7.mjs @pdf` 변환 / 숫자 소실 | 95 / 29항목·36개 | 66 / 0 |
| `rolediff7.mjs`(BASE=adb1ed4, 213 × 52) | — | 역할 0·블록 0, 경고 1파일 |
| Sonnet `txtfuzz6.mjs`(20,000개) | 유실 0 | 유실 0 |

### 확인 못 한 것
- 한컴오피스에서 직접 열어 보지 않았다. 주제어 머리말·값의 화면 표시, 학회가 머리말 굵게를 요구하는지, daejung 예시 전체 굵게가 규정인지는 확인하지 못했다.
- P1의 서술어 판정이 실제 학회지 주제어 목록에서 놓치는 꼴이 있는지는 코퍼스(작가 5·PDF 40) 밖에서는 확인하지 못했다. 코퍼스 안에서는 변화 0이다.
- `tools/pipeline_test.mjs`·`fidelity_test.mjs`·`verify_matrix.mjs`는 고정 경로(`tests/out/` 등)에 쓰므로 실행하지 않았다. 브라우저(`dist/dev.html`)와 `release/투고틀.html`로도 실행하지 않았다.
- DOCX는 합성 파일로만 시험했다.

## 5. 만든 파일 (`tests/audit_opus_fid7/`)
- `v7/`: adb1ed4 사본(`src/`)과 6차 하네스 사본. 이번에 만든 스크립트는 다음과 같다.
  - 주제어: `kwbody7.mjs`, `kwbody7_run.mjs`, `kwbody7_show.mjs`, `kwlabgap7.mjs`, `tpllabel7.mjs`
  - TXT 각주: `txtcmp7.mjs`(b7d5603·234555a·be130c3·dd20376·adb1ed4 비교), `dupdef7.mjs`
  - 서지·정오표: `cite7.mjs`, `cite7loss.mjs`, `citeym7.mjs`, `cite7_p5.mjs`, `citeym7_p5.mjs`, `errata7.mjs`, `errata7all.mjs`, `fnmask7.mjs`
  - 회귀: `rolediff7.mjs`
- `patched/`: 수정안 사본. `apply.mjs`(P1~P4)가 들어 있다. `p5/cite.js`는 관찰 1의 선택 수정 시험본이다.
- `s5c`·`s5cp`, `s7`·`s7p`, `sonnet7`·`sonnet7p`, `sonnet6p`: 4~6차 하네스 사본. `s5c/out`·`s5c/indep7`·`s5cp/out`·`s5cp/indep7`·`cite52/out4all`에는 작가 원고의 글이 들어 있으므로 저장소 밖으로 내보내지 말 것.
- `cite52/`: Sonnet 6차 APA·Chicago 52곳 전수 스크립트 사본과 `run.sh`.
- `fixtures/`: `k7_body_lines.txt`·`k7_body_list.txt`(N7-1), `t7_mixed_cont.txt`·`t7_direct_cont.txt`(N7-2), `k7_lab_hangul.txt`·`k7_lab_spaced.txt`·`k7_lab_kwd.txt`·`k7_lab_saegin.txt`(N7-3).
- `run_all.sh <v7|patched>`, `run_indep.sh`, `run_indep_patched.sh`, `logs/`, `crlfcheck/`.
