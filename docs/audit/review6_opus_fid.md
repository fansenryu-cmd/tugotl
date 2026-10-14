점수: 93/100

# 6차 재감사 — A. 산출물 충실도 (opus_fid6, 2026-10-13 KST, main be130c3)

> 대상: main be130c3. 감사 중 main은 바뀌지 않았다. 그래도 모든 수치는 `git show be130c3:src/*`로 꺼낸 사본(`tests/audit_opus_fid6/v6/src/`)에서 냈다. 이 사본에서 바꾼 것은 engine.js의 rhwp 불러오기 경로 한 줄뿐이다. 줄 번호는 be130c3 기준이다.
> 이 보고서에는 원고의 제목·저자·본문·각주 문장을 쓰지 않았다. 작가 원고는 paper1~5, PDF 파싱본은 pdf-NN(이름순)으로만 적는다. 인용한 줄은 모두 직접 만든 가상 원고(`tests/audit_opus_fid6/fixtures/`와 스크립트 안의 가상 조각)다.

## 요약

**판정: 5차 두 보고서의 새 결함은 대부분 해소됐다. Opus F5-A~F5-I 9건은 모두 해소다. Sonnet F5-1~F5-7 중에서는 F5-7③만 부분 해소다. 작가 원고 보존은 5차와 수치까지 같다. 이번 반영에서는 새 결함 3건이 생겼고, F5-C(주제어 줄 글자 모양)는 반쪽만 고쳐졌다. 4건 모두 가상 원고나 서식에서만 드러난다. 작가 원고에서 글자가 바뀌거나 사라지는 경우는 없다.**

- **보존 수치(5차와 같음)**
  - 작가 원고 5편 × 52곳(260회)의 산출 HWP를 Sonnet 4차의 독립 HWP5 판독기로 다시 읽어 엄격 대조했다. 결과: 원고 문단 31,200개 중 사라진 것 0, 각주 9,308개의 글자·문단·줄바꿈·강조·번호·위치 불일치 0, 새 번호 104/104, 본문 강조 4,940자 중 유실 0이다. 표지 치환 311·주제어 머리말 116은 5차와 같다.
  - Opus 하네스: 5편 × 27곳(135건)은 통과 127·실패 8로, 실패는 이전과 같은 daejung 4·litheory 4다. 독립 판독 135/135 오류 0이다.
  - 가상 원고: 5종 × 52곳은 OK 235, 11종 × 27곳은 OK 272다.
  - PDF 파싱본 40건 × 6곳: 변환 실패 0, 엄격 대조 실패 3 → **0**이다.
- **5차 결함 판정**
  - Opus 5차: F5-A~F5-I 9건이 모두 해소됐다.
  - Sonnet 5차: F5-1~F5-6은 해소, F5-7은 부분 해소(같은 id 정의가 둘이면 여전히 경고 없이 앞의 것이 사라짐), F5-8(DOCX 버리는 서식 경고)은 그대로다. F5-8은 조치표에 없다.
  - 4차 이전부터 부분 해소로 남은 것은 그대로다. litheory 국문초록 제목 기울임, DOCX 스타일 서식(보류), 두 줄 제목 + 부제, 검증 도구(보류)다.
- **이번 반영에서 생긴 결함 (중요도순)**
  1. **N6-1 (중하·역할)**: 주제어 판정의 문장 규칙(`kwSentence`) 때문에 주제어 줄을 놓친다. 머리말이 괄호(`[주제어]`·`【주제어】`·`<주제어>`·`〈주제어〉`·`(주제어)`)나 대시(`주제어 ―`)이고 값 목록이 마침표로 끝나는 줄이다. 이 줄은 더는 주제어가 아니고 초록 본문이 된다. 가상 88줄 중 39줄이 234555a에서는 주제어였는데 지금은 아니다. 작가 원고·PDF에는 이 꼴이 없어 역할 변화는 0이다.
  2. **N6-2 (중하·본문이 각주로)**: TXT 각주 이어짐에서 정의 뒤 빈 줄을 허용한 것이 문서 끝 묶음 밖에도 적용된다. 그래서 정의를 문단마다 둔 원고에서 정의 아래 빈 줄 뒤에 들여 쓴 인용 시가 각주의 다음 문단이 된다. 경고도 없다. 가상 원고에서 본문 문단 9 → 7, 각주 1의 문단 1 → 3이다. 234555a와 b7d5603은 본문으로 두었다.
  3. **N6-3 (낮음~중·서식, F5-C의 남은 부분)**: `valueCs`는 바탕틀 예시에서 ‘머리말을 읽은 자리’가 실제 머리말일 때만 맞는다. 영문 주제어 예시의 값 자리에 한글 안내문이 있는 학회가 있다. 거기서는 `probeAt`이 값 자리를 읽으므로 머리말이 값 모양으로 쓰인다(gubo·kopoetics 영문은 머리말 굵게를 잃고, klc 영문은 머리말 글꼴을 잃는다). anim 영문은 `Key〻words` 머리말을 엔진 정규식이 못 잡아 값이 머리말 모양(9.5pt)으로 쓰인다. 작가 원고 4편과 가상 원고 1편에서 주제어 줄 125개 중 머리말 모양이 다른 줄이 10개, 값 모양이 다른 줄이 5개다.
  4. **N6-4 (낮음·서식·표지)**: 이번에 새로 인식하는 이중 표기 머리말 `주제어(Keywords):`가 엔진 `KW_LABEL`에서는 `주제어`까지만 머리말로 잡힌다. 그래서 학회 표기로 바뀌지 않고, 머리말이 중간에서 갈라져 `주제어`만 굵고 `(Keywords):`는 값 모양이 된다(fcs·gubo·kopoetics). 영문 `Keywords(주제어):`도 같다.
- 수정안 Q1~Q4를 `tests/audit_opus_fid6/patched/apply.mjs`로 be130c3 사본에 적용해 검증했다. 위 4건은 모두 사라졌다. 작가 원고 260회 독립 판독 대조는 그대로다. 작가 원고 산출이 달라지는 곳은 의도한 4곳(gubo·kopoetics·klc·anim의 주제어 줄 글자 모양)뿐이다(5장).

### 95점에 이르기 위해 고쳐야 할 것 (우선순위)

| 순위 | 할 일 | 위치(be130c3) | 크기 | 사본 검증 |
|---|---|---|---|---|
| 1 | N6-3 주제어 예시의 머리말 모양은 머리말 첫 글자에서, 값 모양은 머리말 뒤 첫 한글·영문·숫자에서 읽는다. 머리말이 없는 주제어 줄은 값 모양으로 쓴다. `KW_LABEL`이 `Key〻words`도 받게 한다 | `src/engine.js:147-148, 190, 382` | 4줄 | 주제어 줄 125개: 머리말 모양 다름 10 → 0, 값 모양 다름 5 → 0. 작가 원고 산출 변화는 이 4곳뿐 |
| 2 | N6-1 쉼표로 이은 짧은 낱말 목록은 끝에 마침표가 있어도 주제어로 본다(`kwSentence` 예외) | `src/structure.js:62` | 3줄 | 놓침 39/88 → 0. 본문 오인 1/17(이전부터)·표지 미인식 1/47 그대로, 괄호 낱말 본문 줄 260회 이동 0, 작가 원고·PDF 역할 변화 0 |
| 3 | N6-2 문서 끝 정의 묶음 밖에서는 빈 줄을 건너뛴 들여 쓴 줄을 이어짐으로 보지 않는다. 이어짐 후보를 본문으로 둔 줄 수를 경고로 알린다 | `src/parse.js:330, 333, 368` | 3줄 | 가상 원고 본문 9문단 유지 + 경고 1. 기존 TXT·MD 110개는 문단·각주·경고 변화 0 |
| 4 | N6-4 `KW_LABEL`에 머리말 뒤 `(…)` 덧붙임을 넣는다(구분 기호가 뒤따를 때만) | `src/engine.js:190` | 1줄 | 이중 표기가 학회 표기로 바뀜, 머리말 전체가 머리말 모양 |
| 5 | 이전부터 남은 것: litheory 국문초록 제목 기울임(데이터), daejung 주제어 예시 전체 굵게(규정 확인 필요), TXT 같은 id 정의 중복 경고(Sonnet F5-7③), DOCX 취소선·아래첨자 경고(Sonnet F5-8) | `src/journals.js`, `src/parse.js` | — | 고치지 않음 |

1~4를 고치면 이번 반영의 결함이 정리되어 95점으로 본다. 1번이 작가 원고 산출에 실제로 보이는 유일한 항목이라 맨 앞에 두었다. 5번의 데이터 두 곳까지 확인하면 96점 정도로 본다. 보류 항목(DOCX 스타일 서식·자동 번호·루비·텍스트 상자, 표·그림 자리 표시, 검증 도구 보강)은 감점에 넣지 않았다.

---

## 1. 5차 결함의 재판정

재현은 5차 스크립트를 be130c3 사본에 대고 다시 돌렸다.
- `tests/audit_opus_fid5/v234/` → `tests/audit_opus_fid6/v6/`
- `s4v` → `s6v`, `sonnet_v` → `sonnet6v`
- Sonnet 5차 스크립트 → `tests/audit_opus_fid6/sonnet5c/`(가져오기 경로만 `../v6/src`로 바꿈)

일괄 실행은 `bash tests/audit_opus_fid6/run_all.sh v6`이고, 로그는 `tests/audit_opus_fid6/logs/v6/`에 있다.

### Opus 5차 (opus_fid5, 89점)

| 결함 | 판정 | 재현 명령 | 5차 → 6차 |
|---|---|---|---|
| F5-A 서지 변환이 각주 문단을 다시 나눔 | **해소** | `node tests/audit_opus_fid6/v6/cite5_out.mjs 1,2,3,4,5 koli`, `node tests/audit_opus_fid6/v6/cite5.mjs` | paper4 각주 문단 17→29 → 17=17, 줄바꿈 12=12. paper5 27=27, 19=19. 번호 뒤 공백 없음 9·15·9·10·14 → keep과 같음(paper2의 1은 원고 그대로). 가상 12경우 모두 문단·줄바꿈 유지. 바뀌지 않은 문단의 기울임 7자 유지 |
| F5-B 괄호 낱말로 시작하는 본문 줄이 주제어가 됨 | **해소** | `node tests/audit_opus_fid6/v6/bracket_run.mjs all tests/audit_opus_fid5/fixtures/b5_bracket.txt` | 글자 바뀜 45 → 0, 본론 밖 이동 260 → 0 |
| F5-C 세로줄 머리말 미치환, 줄 전체 굵게 | **해소(남은 부분 N6-3)** | `node tests/audit_opus_fid6/v6/r3/pdfrun.mjs`, `node tests/audit_opus_fid6/v6/kwbold5.mjs <paper1,2,3,5> all`, `cd tests/audit_opus_fid6/s6v && node kw_forms.mjs` | PDF 엄격 실패 3 → 0. 줄 전체 굵게 koli·kopoetics·fcs·gubo 20 → 0(daejung 8은 예시 자체가 다 굵음). `|주제어|`·`주제어 |`·`Key-words:`·`KEY WORDS |` 치환됨 |
| F5-D 이중 표기 미인식 | **해소(새 결함 N6-4)** | `node tests/audit_opus_fid6/v6/kwforms5.mjs` | 미인식 9/47 → 1/47(남은 것은 구분 기호 없는 `■ 주제어 가상`). `중심어:`·`Keywords;`도 인식 |
| F5-E 별표 경계 | **해소** | `node tests/audit_opus_fid6/v6/star5b.mjs`, `node tests/audit_opus_fid6/pairs6.mjs v` | 별표 남음 32/42 → 0/42. 기호 쌍 별표 소실 4/4 → 0/4. `star5` 56줄 중 FAIL 7(겹친 강조 등, 5차 수정안과 같음) |
| F5-F TXT 이어짐: 마지막 장 흡수 | **해소(새 결함 N6-2)** | `node tests/audit_opus_fid6/v6/txtcont5.mjs` | ‘모든 문단 탭·정의는 장마다’의 마지막 장이 본문으로 돌아옴. 표준 MD 꼴은 같은 각주 |
| F5-G 미주가 섞인 DOCX 번호 겹침 | **해소** | `node tests/audit_opus_fid6/v6/docxnum5.mjs tests/audit_opus_fid5/fixtures/d5_mark_endnote.docx` | `*,1,1,2` → `*,1,2,3`. k_kitchen.docx `*,1…10` 그대로 |
| F5-H 재배열 안내 누락 | **해소** | `node tests/audit_opus_fid6/v6/reorder_note.mjs <가상 7종>`, `node tests/audit_opus_fid6/v6/reorder6.mjs @pdf` | 누락 12/52 → 0. 가상 7종 × 52, PDF 40 × 52, 작가 원고 5 × 52 모두 ‘옮겼는데 안내 없음’ 0, ‘안 옮겼는데 안내’ 0 |
| F5-I HWPX 각주 메타 고정폭 빈칸 | **해소** | `node tests/audit_opus_fid6/v6/fnspace.mjs tests/audit_opus_fid5/fixtures/k5_odd_space.hwp …hwpx` | 강조 런 0 → 2(두 모형 모두) |

### Sonnet 5차 (sonnet_fid5, 93점)

| 결함 | 판정 | 재현 명령(`tests/audit_opus_fid6/sonnet5c/`) | 5차 → 6차 |
|---|---|---|---|
| F5-1 서지 변환이 앞 공백을 지움 | **해소** | `node cite_space.mjs` | 작가 원고 APA·Chicago 공백 사라짐 56 → 0, paras≠text 0 |
| F5-2 TXT 이어짐 | **해소(새 결함 N6-2)** | `node txt_fn.mjs`, `node tests/audit_opus_fid6/v6/txtwarn6.mjs`(루트에서) | R1(정의가 참고문헌 앞): 각주 문단 2. T2b(본문 들여씀, 끝 단일 정의): 흡수하되 경고 |
| F5-3 korlit·eomun 목차가 참고문헌 뒤 | **해소** | `node pdf_place.mjs`, `node tests/audit_opus_fid6/v6/pdftail.mjs korlit,eomun` | tocAfterBodyOrRef 10 → 0(2,548회). 남은 orderViol 7은 kopoetics 주제어 이동(의도) |
| F5-4 기호 쌍 별표 | **해소** | `node star_sym.mjs` | 13줄 모두 기대대로 |
| F5-5 전각 문장부호 경계 | **해소** | `node txt_battery.mjs` | 남은 DIFF는 하네스 기대값(런 길이 셈)과 보수적 기대(`*A*%` 등을 글자로 기대)뿐. 실제 결함은 `*A*😀`(보조평면 글자 앞 닫는 별표) 하나다(낮음) |
| F5-6 각주 정의 안 강조 | **해소** | `node txt_fn.mjs` T0 | 각주 런 5개, 별표 사라짐 |
| F5-7 고아 정의·정의 없는 표지 | **부분 해소** | `node txt_orphan.mjs` | ①·② 경고가 나옴. ③ 같은 id 정의 둘은 여전히 경고 없이 앞의 것이 사라짐 |
| F5-8 DOCX 버리는 서식 경고 | 그대로(조치표에 없음) | `node docx_marks.mjs` | warnings `[]` |
| F5-9 kopoetics 안내 ‘국문초록·주제어’ 두 번 | 그대로(관찰) | — | 결함은 아니다 |

### 4차 이전부터 남은 것

| 발견 | 6차 판정 | 수치 |
|---|---|---|
| Opus F-8 litheory 국문초록 제목 기울임 | 그대로(데이터) | `r3/papers.mjs` 실패 8 중 4 |
| daejung 주제어 줄 굵게 | 그대로(예시 전체가 굵음, 규정 확인 필요) | 실패 8 중 4, `kwbold5` 8줄 |
| Opus F-9 PDF 참고문헌 제목 | 그대로(파싱본에 줄 없음) | noRefHead 16/40 |
| Opus F-11.1 강조점·취소선·아래첨자 | 부분 해소(HWP·HWPX 경고만, DOCX 없음) | — |
| Opus F-11.3 두 줄 제목 + 부제 | 그대로 | s_toc 둘째 줄이 author |
| Sonnet F-07 앞부분 역할 | 그대로(규칙 한계) | `roles_test` 259/264 |
| Sonnet F-08 DOCX 스타일 서식·자동 번호·텍스트 상자 | 보류 | — |
| F-12 검증 도구 | 보류 | — |

---

## 2. 회귀 수치 (be130c3 사본, `tests/audit_opus_fid6/logs/v6/`)

| 명령 | 건수 | 결과 |
|---|---|---|
| `cd tests/audit_opus_fid6/sonnet5c && for n in 1 2 3 4 5; do node run_files.mjs ../../원고/paper$n.hwp all --save; done; IDIR=indep6 python -X utf8 run_indep_all.py; IDIR=indep6 node compare4.mjs` | 260(+원고 5) | 판독 오류 0, paraMissOther 0, 각주 9,308개의 문단·줄바꿈·강조·번호·위치 차이 0, 새 번호 104, 본문 강조 4,940자 중 유실 0, labelRepl 311·kwRepl 116(5차와 같음) |
| `node tests/audit_opus_fid6/v6/r3/papers.mjs` / `r3/indep.mjs` | 135 | 통과 127 / 실패 8(daejung 4, litheory 4). 독립 판독 오류 0 |
| `r3/fixtures_run.mjs` 5종 × 52 / 11종 × 27 | 260 / 297 | OK 235 / 272(5차와 같음) |
| `r3/pdfrun.mjs` | 240 | 변환 실패 0, 엄격 실패 0, 목차 끝 0 |
| `falsehead_run.mjs all` / `kwlabel.mjs` / `r3/labels.mjs` | 468 / 52×2 / 52 | 글자 바뀜 0 / 불량 0 / 5차 수정안과 같음 |
| `s6v`: `txt_md`·`star2`·`label_fp`·`label_fp2`·`cite_stale` | — | charsLost 0, 16/16, FAIL 0, 13 본문, 산출 각주 변환 |
| `sonnet6v`: `roles_test koli`·`rt_labels`·`star_test` | — | 259/264, 미인식 0/104, 별표 보존 |
| `node tests/audit_opus_fid6/v6/rolediff6.mjs`(234555a 대비) | 작가 5 + PDF 40 × koli·dongak·kopoetics | 역할·글 변화 0 |
| `node tests/audit_opus_fid6/v6/reorder6.mjs @pdf` | 2,080 | 안내 정확 2,080/2,080. 안내 1,964회, 길이 중앙값 141자, 최대 217자(관찰) |

---

## 3. 이번 반영에서 생긴 결함 (중요도순)

### N6-1 (중하·역할) 값 목록이 마침표로 끝나는 괄호·대시 머리말 주제어 줄을 놓친다
- **위치**: `src/structure.js:62`. `kwSentence`의 조건은 두 가지다. 줄이 문장 부호로 끝나고, 앞 29자 안에 쌍점·세로줄·〻·`;`가 없으면 본문 문장으로 본다. 괄호 머리말(정규식 셋째 가지 `[주제어]`)과 닫는 기호 + 공백 머리말(`「…」`·`(…)`·`<…>`·`―`)에는 구분 기호가 없다. 그래서 값 목록 끝에 마침표만 있어도 문장으로 판정된다.
- **재현**: `node tests/audit_opus_fid6/v6/kwsent6.mjs`. 실제 표지 22꼴에 끝 ``·`.`·`。`·` 등.`을 붙인 88줄을 234555a와 be130c3로 비교한다. 234555a에서 주제어였는데 be130c3에서 아닌 줄이 **39**이다. 13꼴 × 마침표 3종이다. 예(가상 줄):

  | 원고 줄 | 234555a | be130c3 |
  |---|---|---|
  | `[주제어] 가상, 시험, 문학.` | keywords | abstract |
  | `【주제어】 가상, 시험。` / `〈주제어〉 …` / `<주제어> …` / `《주제어》 …` / `(주제어) …` / `[핵심어] …` | keywords | abstract |
  | `주제어 ― 가상, 시험 등.` / `주제어 - …` | keywords | abstract |
  | `[Keywords] virtual, test.` / `【Keywords】 …` / `<Keywords> …` / `Keywords — …` | keywordsEn | abstractEn |

  산출: `node tests/audit_opus_fid6/v6/kwshape6.mjs tests/audit_opus_fid6/fixtures/k6_period.txt koli,fcs,gubo,…`를 돌리면 10곳 모두 주제어 줄이 없다. 초록 본문 모양으로 쓰이고 학회 머리말로도 바뀌지 않는다. 주제어 판정은 학회와 무관하므로 52곳이 모두 같다.
- **실데이터**: 작가 원고 5편과 PDF 40건에는 이 꼴이 없다(`rolediff6.mjs` 역할 변화 0).
- **기대/실제**: 쉼표로 이은 짧은 낱말 목록은 끝에 마침표가 있어도 주제어여야 한다. 실제로는 39/88이 초록 본문이 된다.
- **수정안**(Q1, 사본 검증: 놓침 39 → 0. `kwforms5` 본문 오인 1/17·미인식 1/47 그대로. `bracket_run` 260회 이동 0. `falsehead` 468회 0. 작가 원고·PDF 역할 변화 0):
```js
// src/structure.js:62
const kwHead = RE.keywords.exec(t) || RE.keywordsEn.exec(t);
const kwItems = kwHead ? t.slice(kwHead[0].length).replace(/[.．。!?！？]\s*["”’'」』)]*\s*$/, '').split(/[,，、;；·ㆍ\/]/).map((x) => x.trim()).filter(Boolean) : [];
const kwList = kwItems.length >= 2 && kwItems.every((x) => x.length <= 24 && x.split(/\s+/).length <= 4) && !(kwItems.at(-1).split(/\s+/).length >= 2 && /다$/.test(kwItems.at(-1)));   // ‘가상, 시험, 문학.’은 목록
const kwSentence = /[.．。!?！？]\s*["”’'」』)]*\s*$/.test(t) && !/^[^:：〻￨|;；]{0,28}[:：〻￨|;；]/.test(t) && !kwList;
```
  한계: `「핵심어」 개념, 용어, 범주를 다룬다.`처럼 짧은 쉼표 목록 뒤 서술어가 한 낱말인 문장은 주제어로 볼 수 있다. 끝 항목이 두 낱말 이상이고 ‘다’로 끝나면 문장으로 보도록 막았지만, 모든 꼴을 막지는 못한다.

### N6-2 (중하·본문이 각주로) TXT: 정의 뒤 빈 줄 다음의 들여 쓴 인용 시가 각주로 흡수된다
- **위치**: `src/parse.js:330`(`contIdx`), `:333`. 정의 뒤 빈 줄을 허용하는 이어짐 후보가 문서 전체에 적용된다. `bodyIndented`는 후보가 아닌 들여 쓴 줄이 있을 때만 참이다. 그래서 다른 들여 쓴 줄이 없는 원고에서는 본문 가운데 정의 뒤의 ‘빈 줄 + 들여 쓴 블록’이 이어짐이 된다. 경고는 `bodyIndented`일 때만 나오므로 경고도 없다.
- **재현**: `tests/audit_opus_fid6/fixtures/t6_quote_after_def.txt`(문단마다 정의, 정의 아래 빈 줄 뒤 탭 들여 쓴 시 두 줄, 본문은 들여 쓰지 않음)

  | 판 | 본문 문단(빈 줄 제외) | 각주 문단 | 경고 |
  |---|---|---|---|
  | b7d5603 | 9 | 1, 1 | 0 |
  | 234555a | 9 | 1, 1 | 0 |
  | **be130c3** | **7** | **3**, 1 | **0** |

  `node tests/audit_opus_fid6/v6/txtwarn6.mjs`의 Q1도 같다. 인용 시 두 줄이 각주 1의 2·3째 문단이 되어 본문에서 사라진다.
- **기대/실제**: 본문 가운데의 ‘빈 줄 뒤 들여 쓴 블록’은 본문이어야 한다(234555a까지 그랬다). 모호하면 알려야 한다. 실제로는 말없이 각주가 된다. 표준 MD의 ‘빈 줄 + 네 칸’ 이어짐은 정의를 파일 끝에 모아 쓰는 꼴이므로 끝 묶음 안에서만 받아도 된다. Sonnet R1(정의 바로 아래 네 칸, 빈 줄 없음)은 수정안에서도 같은 각주다.
- **수정안**(Q4, 사본 검증: 위 원고 본문 9·각주 1,1·경고 1. R1 각주 문단 2. T2b·Q3 흡수 + 경고. 표준 MD(T3) 같은 각주. TXT·MD 110개(PDF 40 + 가상 70)의 문단·각주·경고 변화 0(`patched/txtdiff6.mjs`)):
```js
// src/parse.js:330 — 끝 묶음 밖에서는 빈 줄을 건너뛴 들여 쓴 줄을 후보로 받지 않는다
const contIdx = new Set(); const candIdx = new Set(); { let on = false, gap = false; for (let i = 0; i < rawLines.length; i++) { const ln = rawLines[i]; if (isDef(ln)) { on = true; gap = false; } else if (on && isCont(ln)) { candIdx.add(i); if (!gap || i >= tailStart) contIdx.add(i); else on = false; } else if (ln.trim() === '') { if (on) gap = true; } else on = false; } }
// :333 — 이어짐으로 읽은 줄은 후보에서 뺀다:  …; contLines++; candIdx.delete(i); return false; }
// :368 앞 — 이어짐 후보를 본문으로 둔 줄이 있으면 알린다
if (candIdx.size) warnings.push(`각주 정의 뒤에 들여 쓴 ${candIdx.size}줄은 본문 문단으로 두었습니다. 각주의 다음 문단이라면 정의를 파일 끝에 모으고 정의 바로 아래 네 칸 들여 쓰세요.`);
```
  덧붙임: 정의를 문단마다 두고 본문도 들여 쓴 원고(txtwarn6 Q2)에서는 정의 바로 아래의 진짜 이어짐이 본문이 된다. be130c3도 그렇고 경고가 없다(이전부터). 위 경고가 이 경우도 알린다.

### N6-3 (낮음~중·서식, F5-C의 남은 부분) 영문 주제어 머리말이 값 모양으로, anim 영문 값이 머리말 모양으로 쓰인다
- **위치**: `src/engine.js:146-148`. 머리말 모양 `cs`는 `probeAt(txt)`, 곧 예시의 첫 한글(없으면 영문) 자리에서 읽는다. `valueCs`는 그 `cs`와 다를 때만 둔다. 영문 주제어 예시의 값에 한글 안내문이 있으면 `cs`가 값 모양이 된다. gubo `❙Keywords: 영문 키워드`, kopoetics `• Key words：5개 이상`의 ‘개’, klc `Key Words: 주제어(영문)`이 그런 예시다(가상 설명이 아니라 바탕틀 예시 문단의 구조). 이때 `valueCs`는 생기지 않고, 머리말까지 값 모양이 된다. anim 영문 예시 `Key〻words〻￨〻…`는 `KW_LABEL`(`:190`)의 `key\s*-?\s*words?`에 맞지 않는다. 그래서 `valueCs`가 없고 줄 전체가 머리말 모양(Dinmed 9.5pt)이다. 예시 값은 9.3pt다.
- **재현**
  - `node tests/audit_opus_fid6/v6/tplkw6b.mjs gubo,kopoetics,klc,anim`: 예시 문단의 글자 모양 구간을 보여 준다. gubo 영문 머리말은 [윤고딕 B], 값은 [HY신명조]다. kopoetics 영문 머리말은 [10.5 B], 값은 [10.5]다.
  - `node tests/audit_opus_fid6/v6/kwlabshape6.mjs tests/audit_opus_fid6/fixtures/k6_plain.txt,tests/원고/paper1.hwp,…paper2,…paper3,…paper5 tpl -v`: 산출 머리말 첫 글자·값 첫 글자의 크기·굵기를 예시와 비교한다. 대상은 예시에 값이 있는 학회의 주제어 줄 125개다. **머리말 모양 다름 10**(gubo 영문 5, kopoetics 영문 5: 굵게 빠짐), **값 모양 다름 5**(anim 영문: 9.5pt, 예시 9.3pt)다.
  - `kwbold5.mjs`: paper1·2·3·5 × gubo·kopoetics 영문 주제어 줄의 굵은 글자 수가 0이다(예시는 머리말 11·13자가 굵음).
- **기대/실제**: F5-C 수정의 목적은 ‘머리말은 머리말 모양, 값은 값 모양’이다. 국문 주제어는 그렇게 됐다. 영문은 위 4곳에서 반대이거나 나뉘지 않는다.
- **수정안**(Q3·Q2 일부, 사본 검증: 머리말 다름 10 → 0, 값 다름 5 → 0. 작가 원고 5편 × 52곳의 HWPX 본문 XML이 달라지는 곳은 gubo·kopoetics·klc·anim의 주제어 줄뿐(`patched/bytediff6.mjs`, 416회 중 325 같음, 나머지는 이 4곳과 가상 원고 둘). 독립 판독 260회 대조 결과는 be130c3와 같음):
```js
// src/engine.js:147 — const cp → let cp
// src/engine.js:148 — 머리말 모양은 머리말 첫 글자에서, 값 모양은 머리말 뒤 첫 한글·영문·숫자에서(〻￨ 같은 구분 기호는 건너뜀)
let valueCs; if (role === 'keywords' || role === 'keywordsEn') { const lead = /^\s*/.exec(txt)[0].length; const km = KW_LABEL.exec(txt.slice(lead)); if (km) {
  const cpAt = (o16) => J(doc.getCharPropertiesAt(sec, i, [...txt.slice(0, o16)].length)) || {};
  const lo = km[1].search(/[가-힣A-Za-z]/); if (lo >= 0) { const cl = cpAt(lead + lo); if (cl.charShapeId !== undefined) cp = cl; }
  const v16 = lead + km[1].length; const vr = txt.slice(v16).search(/[가-힣A-Za-z0-9]/); const lab = km[1].replace(/\s+$/, '');
  const at16 = vr >= 0 ? v16 + vr : (lab && /[^가-힣A-Za-z]$/.test(lab) ? lead + lab.length - 1 : -1);
  if (at16 >= 0) { const cv = cpAt(at16); if (cv.charShapeId !== undefined && cv.charShapeId !== cp.charShapeId) valueCs = cv.charShapeId; } } }
// src/engine.js:190 — KW_LABEL의 key\s*-?\s*words? → key[\s〻]*-?[\s〻]*words?(anim 예시)
// src/engine.js:382 — 머리말을 못 찾은 주제어 줄은 줄 전체를 값 모양으로(머리말 모양이 굵은 학회에서 값만 있는 줄이 굵어지지 않게)
const csAt = (s) => (sh0 && sh0.valueCs !== undefined && /^keywords/.test(b.role) && (L <= 0 || s >= L) ? sh0.valueCs : cs);
```
  anim 머리말은 이렇게 해도 학회 표기로 바뀌지 않는다. `Key〻words`가 글자로 끝나 `kwLabelUsable`을 통과하지 못하기 때문이다(5차 Opus가 피하려던 `〻` 치환은 일어나지 않음). 다른 학회의 예시에서 머리말·값 위치는 바뀌지 않는다. `tplkw6.mjs`로 19곳 38개 예시를 확인했다.

### N6-4 (낮음·서식·표지) 이중 표기 머리말이 학회 표기로 바뀌지 않고, 머리말이 갈라진다
- **위치**: `src/engine.js:190` `KW_LABEL`. 판정 정규식(`src/structure.js:12-13`)은 이번에 `주제어(Keywords):`를 받게 됐다. 그러나 엔진 머리말 정규식은 `(`에서 멈춘다. 그래서 `m[1] = '주제어'`가 되어 구분 기호로 끝나지 않으므로 치환되지 않는다. 값 모양 경계 `L`도 3이다.
- **재현**: `node tests/audit_opus_fid6/v6/kwshape6.mjs tests/audit_opus_fid6/fixtures/k6_dual.txt koli,fcs,gubo,kopoetics,aagcc,anim,klc,dongak,eastasia,kdrama`
  - fcs 국문: `주제어`=굵게, `(Keywords): 가상…`=값 모양. gubo·kopoetics도 같다.
  - koli 국문: `주제어(Keywords):` 그대로(학회 표기 `● 주제어 : `로 안 바뀜). koli 영문은 `Keywords`만 굵다.
- **기대/실제**: 이중 표기도 다른 머리말처럼 학회 표기로 바뀌거나, 적어도 머리말 전체가 한 모양이어야 한다. 실제로는 반쯤 굵다. 234555a에서는 이 줄을 초록 본문으로 읽었다. 주제어로 인식하게 된 것은 F5-D 수정의 결과이고, 엔진 쪽이 따라가지 못한 것이다.
- **수정안**(Q2, 사본 검증: koli `● 주제어 : 가상, 시험`, dongak `국문주제어: …`, fcs·gubo·kopoetics 머리말 전체가 머리말 모양. `rt_labels` 미인식 0/104, `kwlabel` 불량 0, `labels` 변화 0):
```js
// src/engine.js:190 — 낱말 뒤 (…) 덧붙임은 구분 기호가 뒤따를 때만 머리말에 넣는다(‘주제어(主題語)의 …’는 그대로)
const KW_LABEL = /^([^가-힣A-Za-z0-9]{0,3}(?:주제어|핵심어|키워드|색인어|주요어|중심어|국문\s*주제어|국문\s*핵심어|영문\s*주제어|key[\s〻]*-?[\s〻]*words?|keywords?)(?:\s*[(（][^()（）]{1,24}[)）](?=\s*[:：;；|￨]))?[\s:：;；|￨\]】〕❙」』)）]{0,4})/i;
```
  치환하면 원고의 덧붙임 `(Keywords)`는 학회 표기로 대체된다. 다른 머리말을 치환하는 방식과 같다. 학회가 이중 표기를 요구하는지는 확인하지 못했다.

### 그 밖의 관찰 (결함 아님 또는 이전부터)
1. **재배열 안내 길이**: `srcSeq`로 바꾼 뒤 안내는 정확하다(2,080/2,080). PDF 파싱본은 원고 묶음열이 최대 25항목이고 안내가 217자까지 길어진다(1,964회 중 158회가 200자 초과). 파싱본의 쪽 머리 줄 등이 묶음을 오가기 때문이다. 정보로는 맞다.
2. **안내에 생성 목차가 원고 순서로 나옴**: `buildToc`가 reorder 앞에 목차를 넣는다. 그래서 원고에 없던 목차가 ‘원고 순서’에 보인다(예: paper1 × kopoetics). 234555a부터 같다.
3. **DOCX 미주의 사용자 지정 표시**: 파서는 `w:endnoteReference`의 `customMarkFollows`를 읽지 않는다(`src/parse.js:293`). 그런 미주는 번호 미주로 옮겨지고 본문의 표시 글자도 남는다. 이전부터이며 실제로는 매우 드물다.
4. **`*A*😀`**: 닫는 별표 뒤가 보조평면 글자이면 강조가 되지 않는다(`CLOSE`에 없음, `u` 깃발 없음). 이전부터다.

---

## 4. 실행한 명령과 수치 (be130c3 사본 → 수정안 사본)

| 명령 | be130c3 | 수정안 |
|---|---|---|
| 독립 판독 260회(`sonnet5c` → `sonnet5p`) | 유실·불일치 0, kwRepl 116 | 같음(결과 JSON 5개 동일) |
| `r3/papers.mjs`(135) / `r3/indep.mjs` | 127/8, 오류 0 | 같음 |
| `r3/fixtures_run.mjs` 260 / 297 | 235 / 272 | 같음 |
| `r3/pdfrun.mjs`(240) | 엄격 실패 0 | 같음 |
| `kwsent6.mjs` 마침표 꼴 놓침 | 39/88 | 0/88 |
| `kwforms5.mjs` 미인식 / 본문 오인 | 1/47 / 1/17 | 같음 |
| `bracket_run.mjs` / `falsehead_run.mjs` | 0·0 / 0 | 같음 |
| `kwlabshape6.mjs`(주제어 줄 125개) 머리말 다름 / 값 다름 | 10 / 5 | 0 / 0 |
| `kwbold5.mjs` 줄 전체 굵게 | daejung 8 | daejung 8(gubo·kopoetics 영문 머리말 굵게 0 → 11·13자) |
| `kwshape6.mjs k6_dual` 머리말 갈라짐 | fcs·gubo·kopoetics·koli·aagcc | 0 |
| `t6_quote_after_def.txt` 본문 문단 / 각주 문단 / 경고 | 7 / 3,1 / 0 | 9 / 1,1 / 1 |
| `patched/txtdiff6.mjs`(TXT·MD 110개) | — | 문단·각주·경고 변화 0 |
| `patched/rolediff6.mjs`(작가 5 + PDF 40 × 3곳, be130c3 대비) | — | 역할·글 변화 0 |
| `patched/bytediff6.mjs`(작가 5 + 가상 3 × 52곳 HWPX 본문) | — | 작가 원고에서 다른 곳은 gubo·kopoetics·klc·anim(주제어 줄)뿐 |
| `s6p`/`sonnet6p`/`sonnet5p` 나머지(`txt_md`·`star2`·`label_fp*`·`kw_forms`·`cite_stale`·`roles_test`·`rt_labels`·`star_test`·`txt_fn`·`txt_orphan`·`star_sym`·`txt_battery`) | — | be130c3와 줄 단위로 같음 |

수정안 적용: `node tests/audit_opus_fid6/patched/apply.mjs`. 이 스크립트는 LF로 맞춰 치환한 뒤 원래 줄바꿈으로 되돌려 쓴다. 작업 트리의 CRLF `src` 사본(`tests/audit_opus_fid6/crlfcheck/`)에도 적용해 보았고, 결과가 줄바꿈만 빼고 같음을 확인했다.

### 확인 못 한 것
- 한컴오피스에서 직접 열어 보지 않았다. 주제어 머리말·값 글꼴의 화면 표시, gubo·kopoetics 영문 머리말 굵기가 학회 규정과 맞는지, daejung 예시 전체 굵게가 규정인지는 확인하지 못했다.
- 학회가 이중 표기 머리말(`주제어(Keywords):`)을 요구하거나 허용하는지 확인하지 못했다.
- 글꼴 비교는 rhwp `getCharPropertiesAt`이 주는 글꼴 이름·크기·굵기로만 했다. 언어별 글꼴(한글·영문 글꼴이 다른 글자 모양)은 크기·굵기로만 대조했다.
- `tools/pipeline_test.mjs`·`fidelity_test.mjs`·`verify_matrix.mjs`는 고정 경로에 쓰기 때문에 실행하지 않았다. 브라우저(`dist/dev.html`)로도 실행하지 않았다.
- DOCX는 합성 파일로만 시험했다.

## 5. 만든 파일 (`tests/audit_opus_fid6/`)
- `v6/`: be130c3 사본(`src/`)과 5차 하네스 사본. 새 스크립트는 다음과 같다.
  - `kwsent6.mjs`, `kwshape6.mjs`, `kwlabshape6.mjs`, `tplkw6.mjs`, `tplkw6b.mjs`(주제어)
  - `txtwarn6.mjs`(TXT 이어짐), `reorder6.mjs`(안내), `rolediff6.mjs`(234555a 대비 역할)
- `patched/`: 수정안 사본. `apply.mjs`(Q1~Q4), `bytediff6.mjs`, `txtdiff6.mjs`가 들어 있다.
- `s6v`·`s6p`, `sonnet6v`·`sonnet6p`, `sonnet5c`·`sonnet5p`: 4·5차 하네스 사본. `sonnet5c/out`·`indep6`에는 작가 원고의 글이 들어 있으므로 저장소 밖으로 내보내지 말 것.
- `fixtures/`: `k6_plain.txt`, `k6_dual.txt`, `k6_period.txt`(주제어 줄 꼴), `t6_quote_after_def.txt`(정의 뒤 인용 시)
- `pairs6.mjs`, `run_all.sh <v6|patched>`, `logs/v6/`, `logs/patched/`, `crlfcheck/`(CRLF 적용 확인), `v_b7/`(b7d5603 사본, 5차에서 복사)
