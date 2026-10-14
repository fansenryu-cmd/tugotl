점수: 89/100

# 5차 재감사 — A. 산출물 충실도 (opus_fid5, 2026-10-13 KST, main 234555a)

> 대상은 브리프대로 234555a다. 감사 중(21:32) main이 b2e07b0(‘5차 재감사(Sonnet) 반영’)으로 바뀌었다. 그래서 모든 판정 수치는 `git show 234555a:src/*`로 꺼낸 사본(`tests/audit_opus_fid5/v234/src/`)에서 다시 냈다. 표의 ‘b2e07b0’ 열은 같은 재현을 작업 트리(b2e07b0)에 돌린 참고 값이다. 줄 번호는 234555a 기준이다.
> 이 보고서에는 원고의 제목·저자·본문·각주 문장을 쓰지 않았다. 작가 원고는 paper1~5, PDF 파싱본은 pdf-NN(이름순)으로만 적는다. 인용한 줄은 모두 직접 만든 가상 원고(`tests/audit_opus_fid5/fixtures/`)의 조각이다.

## 요약

**판정: 4차에서 나온 새 결함 15건(Opus N-1~N-5, Sonnet N-1~N-9와 N-1b) 중 10건은 해소됐다. 남은 5건은 부분 해소다. 다만 이번 반영에서 새 결함이 생겼다. 그중 하나(서지 변환)는 작가 원고의 각주 구조를 바꾼다.**

- 작가 원고 5편 × 27곳(135건, 바탕틀 12·규정값 12·일반 3)을 변환·저장한 뒤 다시 열어 정규화 없이 대조했다. 결과는 4차와 줄 단위로 같다. 본문·각주 글자 불일치 0, 원고 문단 유실 0, 독립 HWP5 판독 135/135 오류 0이다. 실패 8건은 4차와 같은 서식 문제다(daejung 주제어 줄 굵게 4, litheory 국문초록 제목 기울임 4). 가상 원고 5종 × 52곳(260건)은 OK 235로 4차와 같다. 가상 11종 × 27곳(297건)은 OK 272, PDF 파싱본 40건 × 6곳(240건)은 변환 실패 0이다.
- **4차 새 결함의 판정**: Opus N-1~N-5와 Sonnet N-1~N-9·N-1b를 합쳐 해소 10건, 부분 해소 5건이다. 부분 해소는 Opus N-1(괄호로 싼 낱말 줄), Sonnet N-1(`Keywords —` 줄), N-3(별표 경계), N-6(TXT 이어짐), N-7(재배열 안내)이다. 그대로인 것은 없다.
- **이번 반영에서 생긴 결함 (중요도순)**
  1. **F5-A (중·각주 구조)**: APA·Chicago 서지 변환이 각주를 `f.text.split('\n')`으로 다시 만든다. 그래서 각주 문단 안의 줄바꿈이 문단 나눔이 된다. 3차 F-5가 이 경로에서 되살아난 것이다. 작가 원고에서 확인했다. paper4는 산출 각주 문단 17 → 29, 줄바꿈 12 → 0이고, paper5는 27 → 45, 19 → 1이다. 번호 뒤 공백도 각주 9~15개에서 지워진다. 앞 문단에 줄바꿈이 있으면 번호가 다른 문단으로 옮겨 가고, 바뀌지 않은 문단의 강조도 버려진다.
  2. **F5-B (중·본문 글자 변경, Opus N-1의 남은 부분)**: `「핵심어」 개념은 …이다.`처럼 괄호로 싼 주제어 낱말과 공백으로 시작하는 본문 줄이 주제어가 된다. 52곳 모두 그 줄을 본론 밖으로 옮긴다(260/260). 그중 15곳은 괄호 낱말을 바탕틀 머리말로 바꾼다(45줄). 예: `● 주제어 : 개념은 …`.
  3. **F5-C (중·서식)**: 엔진 치환 조건은 구분 기호로 `|￨〻`를 받는다. 그런데 머리말을 뽑는 `KW_LABEL`의 꼬리에 이 글자들이 없어 조건이 늘 거짓이다. 그래서 `|주제어|`, `Key words ￨`, `주제어 |` 꼴은 학회 표기로 바뀌지 않는다. 이 줄은 바탕틀 예시의 머리말 글자 모양(굵게)으로 줄 전체가 쓰인다. PDF 파싱본 3건에서 주제어 줄 전체가 굵게 나왔다(엄격 대조 실패 0 → 3).
  4. F5-D (낮음~중): 이중 표기 머리말 `주제어(Keywords):`, `핵심어(Key Words):`, `Keywords(주제어):` 등 5꼴을 더는 인식하지 않는다. 4차 N-1 수정에서 꼬리의 여는 괄호를 막으면서 생겼다. 2f8ad3f에서는 인식했다.
  5. F5-E (낮음~중): 별표 경계 목록이 모자란다. `*Hamlet*(1600)`, `**굵게**(1990)`, 전각 괄호·문장부호, `…`·`~`·`%`·`ㆍ` 앞뒤의 강조는 별표가 글자로 남는다(가상 42줄 중 32줄). 별표가 기호인 쌍(`(*) … (*)`)은 반대로 별표가 사라진다(4줄 모두). 뒤의 것은 Sonnet 5차 F5-4와 같은 현상이다.
  6. 낮음: TXT 이어짐(F5-F), DOCX 표시 각주 + 미주의 번호 중복(F5-G), 재배열 안내 누락(F5-H), HWPX 각주 메타의 고정폭 빈칸(F5-I). 아래 3장에 적었다.
- **기존 결함인데 범위가 더 넓었던 것**: 바탕틀 주제어 예시에서 머리말만 굵은 학회가 있다. koli(영문), kopoetics(국문), fcs(국·영), gubo(국문)다. 이 학회들에서 주제어 줄 전체가 굵게 나온다(작가 원고 4편(paper1·2·3·5) × 52곳에서 줄 20개. 예시 전체가 굵은 daejung의 8개는 따로 셈). 4차는 daejung만 보고했다. 엄격 대조는 머리말이 바뀐 줄의 강조를 비교하지 않아서 이것을 잡지 못했다.
- 수정안 P1~P10을 `tests/audit_opus_fid5/patched/apply.mjs`로 234555a 사본에 적용해 검증했다. 위 결함은 모두 사라졌고 회귀는 0이다(5장).

### 95점에 이르기 위해 고쳐야 할 것 (우선순위)

| 순위 | 할 일 | 위치(234555a) | 크기 | b2e07b0에서 | 사본 검증 |
|---|---|---|---|---|---|
| 1 | F5-A 서지 변환을 각주 문단(`paras`) 단위로 한다. 문단 안의 `\n`은 줄바꿈으로 두고, 바뀐 문단만 런을 버린다. 조각 앞 공백은 남긴다 | `src/cite.js:102, 110` | 6줄 | 공백만 고침. 문단 나눔은 그대로(paper4 17→29, paper5 27→45) | paper1~5 문단·줄바꿈·공백 변화 0 |
| 2 | F5-B·F5-D 주제어 판정: 구분 기호 없이 잡힌 줄이 문장 부호로 끝나면 본문으로 본다. 머리말 뒤 `(…)` 덧붙임(이중 표기)을 받는다 | `src/structure.js:12-13, 62-63` | 4줄 | 그대로(본문 오인 13/17, 미인식 9/47) | 본문 오인 13 → 1(남은 1은 쌍점 문장, 이전부터), 미인식 9 → 3, 실원고·PDF 역할 변화 0 |
| 3 | F5-C와 기존 굵게: `KW_LABEL` 꼬리에 `|￨`를, 낱말에 색인어·주요어·Key-words를 더한다. 바탕틀 예시의 머리말 뒤 글자 모양(`valueCs`)을 따로 읽어 값 부분에 쓴다 | `src/engine.js:146-148, 189, 375-382` | 8줄 | 그대로 | 줄 전체 굵게 20 → 0(daejung 8은 예시 자체가 다 굵어 그대로), PDF 엄격 실패 3 → 0, rt_labels 미인식 0/104 |
| 4 | F5-E 별표 경계: ASCII 문장부호(별표 제외), «», U+2010–201F·…·⸺⸻, CJK 기호(U+3000–303F), 전각 문장부호(U+FF01–FF65), ㆍ로 넓힌다. 안쪽 첫·끝 글자 조건(기호 쌍)을 더한다 | `src/parse.js:336-338` | 3줄 | 일부 고침(42줄 중 21줄 남음, `*Hamlet*(1600)` 그대로). 기호 쌍은 고침 | 42줄 모두 강조, 기호 쌍 4/4 보존, PDF 40건 별표 소실 0 |
| 5 | F5-F TXT 이어짐: 끝 묶음은 첫 정의부터 잡고, 각주 표지가 든 줄은 묶음 밖으로 둔다. 정의를 문단마다 둔 원고는 이어짐을 쓰지 않는다 | `src/parse.js:325` | 3줄 | 경고만 더함(마지막 장 흡수 그대로) | 가상 8종 기대대로(문서 끝 단일 정의는 모호, 아래 3.6) |
| 6 | F5-H 재배열 안내: 원고 쪽도 묶음 연속열로 비교한다 | `src/structure.js:183-186` | 2줄 | 그대로(12/52 누락) | 누락 0 |
| 7 | F5-G 미주가 섞인 DOCX 새 번호, F5-I 고정폭 빈칸 | `src/parse.js:249`, `:120` | 각 1줄 | 그대로 | `*,1,2,3`, 각주 강조 2런 복원 |
| 8 | 이전부터 남은 것: litheory 국문초록 제목 기울임(데이터), DOCX 스타일 강조·자동 번호·취소선 경고, 검증 도구에 감사 대조 편입(F-12) | `src/journals.js`, `src/parse.js`(DOCX), `tools/` | — | 그대로 | — |

1~4를 고치면 이번 반영의 새 결함과 실원고에서 드러나는 서식 결함이 정리된다. 그러면 93~94점으로 본다. 5~7과 8의 데이터 한 곳까지 고치면 95점에 이른다.

---

## 1. 4차 새 결함의 재판정

재현은 4차 스크립트(`tests/audit_opus_fid4/`, `tests/audit_sonnet_fid4/`)를 사본으로 옮겨 234555a 사본에 대고 다시 돌렸다(`tests/audit_opus_fid5/v234/`, `s4v/`, `sonnet_v/`). 로그는 `tests/audit_opus_fid5/logs/v234/`에 있다.

### Opus 4차 (opus_fid4, 88점)

| 결함 | 판정 | 재현 명령 | 4차 → 5차 |
|---|---|---|---|
| N-1 본문 줄이 주제어·초록 제목으로 오인되고 낱말이 바뀜 | **부분 해소** | `node tests/audit_opus_fid4/falsehead_run.mjs all`, `node tests/audit_opus_fid5/v234/bracket_run.mjs all tests/audit_opus_fid5/fixtures/b5_bracket.txt` | b_falsehead 52곳 × 9줄: 글자 바뀜 77 → 0, 장 제목 소실 34 → 0, 참고문헌 뒤 이동 111 → 0. pdf-16 줄은 본문으로 돌아옴. 괄호 낱말 + 공백 꼴은 남음(F5-B) |
| N-2 투고일·목차 배치 | **해소** | `node tests/audit_opus_fid4/seq.mjs tests/audit_opus_fid4/fixtures/s_tail.txt all`, `… s_toc_email.txt all`, `node tests/audit_opus_fid5/v234/pdftail.mjs` | 투고일이 끝이 아닌 학회 4곳 → 0(anim은 체재대로), 본문 뒤 목차 13 → 0, PDF 8곳 모두 투고일 오배치 0·목차 끝 0 |
| N-3 표 안 각주가 메타 짝짓기를 밀어냄 | **해소** | `node tests/audit_opus_fid4/fncmp.mjs …/k4_tblfn.hwp,…/k4_tblfn.hwpx koli,ricc,mkliterature --keep` | 강조 유실 28자 → 0, newNum 0/1 → 1/1, 번호 문단·표시 번호 불일치 0 |
| N-4 번호 없는 각주 앞의 새 번호 | **해소** | `node tests/audit_opus_fid4/fncmp.mjs …/k4_nnnum.hwpx koli --keep` | 표시 번호 불일치 5/7 → 0(두 모형 모두) |
| N-5 DOCX 표시 각주 뒤 번호 | **해소** | `node tests/audit_opus_fid4/docxnum.mjs tests/audit_opus_fid/fixtures/k_kitchen.docx` | 모형 A 10/10 → 0. 미주가 섞인 경우는 새 결함(F5-G) |

### Sonnet 4차 (sonnet_fid4, 91점)

| 결함 | 판정 | 재현 명령(`tests/audit_opus_fid5/s4v/`) | 4차 → 5차 |
|---|---|---|---|
| N-9 `***`가 `*`로 줄어듦 | **해소** | `node txt_md.mjs` | PDF 40건 charsLost 14 → 0 |
| N-3 강조 뒤 각주 표지·문장부호에서 별표가 남음 | **부분 해소** | `node star2.mjs`, `node tests/audit_opus_fid5/v234/star5b.mjs` | Sonnet 20줄 중 강조로 읽어야 할 16줄은 모두 강조가 되고, 나머지 4줄은 별표가 보존됨. 다른 경계 42줄 중 32줄은 별표가 글자로 남음(F5-E) |
| N-8 강조 안의 각주 표지 | **해소** | `node tests/audit_opus_fid5/v234/star5.mjs` | `*Titulus[^1]*를`의 각주가 offset 10에 붙음. `*가*[^1]*나*`도 맞음 |
| N-4 서지 변환이 각주 `paras`를 안 고침 | **해소(새 결함 F5-A)** | `node cite_stale.mjs` | 산출 각주가 변환됨. 대신 각주 구조가 바뀜 |
| N-1 Keywords 정규식 오인 | **부분 해소** | `node label_fp.mjs` | 17줄 중 1줄 FAIL(`Keywords — …`)로 4차와 같음 |
| N-1b 초록·요약·개요 머리 오인 | **해소** | `node label_fp2.mjs` | 13줄 모두 본문·제목 |
| N-2 주제어 머리말 잔여 | **해소(부작용 F5-C)** | `node kw_forms.mjs` | 잔여 0. 주제어로 인식되는 12꼴 중 8꼴은 학회 표기로 바뀌지 않고 원고 머리말 그대로 남음 |
| N-5 표 안 각주 | **해소** | Opus N-3과 같음 | — |
| N-6 TXT 들여 쓴 본문이 각주로 흡수 | **부분 해소** | `node tests/audit_opus_fid5/v234/txtcont5.mjs` | 본문 사이 정의 뒤에 장이 더 오면 해소. Sonnet 재현 원형(문서 끝)과 ‘정의를 문단마다 둔 원고의 마지막 장’은 그대로 흡수(F5-F) |
| N-7 재배열 안내문 | **부분 해소** | `node tests/audit_opus_fid5/v234/reorder_note.mjs …` | Sonnet의 두 경우(withtoc × ricc, kitchen × litheory)는 맞음. 떨어져 있던 같은 묶음이 합쳐지는 이동은 안내 없음(F5-H) |
| 조용히 버리는 서식 | **부분 해소** | `node tests/audit_opus_fid5/v234/marks_warn.mjs tests/audit_opus_fid/fixtures/x_marks.hwpx tests/audit_sonnet_fid/fixtures/wild.docx` | HWP·HWPX는 ‘강조점·취소선·아래첨자 8자’ 경고. DOCX는 경고 없음(조치표의 보류) |

### 3차에서 부분 해소로 남았던 것

| 발견 | 5차 판정 | 수치 |
|---|---|---|
| Opus F-3 PDF 목차가 끝 | **해소** | `r3/pdfrun.mjs` tocEnd 5 → 0 |
| Opus F-4(b) DOCX 표시 각주 | **해소** | N-5와 같음 |
| Opus F-8 litheory 국문초록 제목 기울임 | 그대로 | paper1·2 6자, paper3 4자, paper5 12자(`r3/papers.mjs`) |
| Opus F-9 PDF 참고문헌 제목 | 그대로(파싱본에 줄 없음) | 참고문헌 제목 없음 16/40 |
| Opus F-11.1 강조점·취소선·아래첨자 | 부분 해소 | HWP 경고만 |
| Opus F-11.3 두 줄 제목 + 부제 | 그대로 | s_toc 둘째 줄이 author |
| Opus F-11.7 / Sonnet F-13 TXT 여러 문단 각주 | **해소** | 표준 MD 꼴(빈 줄 뒤 4칸)도 같은 각주(`txtcont5.mjs`) |
| Sonnet F-07 앞부분 역할 | 그대로(규칙 한계) | `roles_test.mjs koli` 259/264 |
| Sonnet F-08 DOCX 스타일 강조·자동 번호·텍스트 상자 | 그대로 | `wild_docx.mjs` 같은 DIFF |
| F-12 검증 도구 | 그대로(보류) | — |

---

## 2. 회귀 수치 (234555a 사본, `tests/audit_opus_fid5/logs/v234/`)

| 명령(`tests/audit_opus_fid5/v234/` 기준) | 건수 | 결과 |
|---|---|---|
| `node r3/papers.mjs` | 5편 × 27곳 = 135 | 통과 127 / 실패 8(4차와 줄 단위로 같음). 본문·각주 글자 불일치 0, 각주 4,833/4,833, 문단 유실 0 |
| `node r3/indep.mjs <산출 135개>` | 135 | 독립 HWP5 판독 오류 0, 문단·각주 불일치 0 |
| `node r3/fixtures_run.mjs k_kitchen.hwp,k_kitchen.hwpx,k_kitchen.docx,s_toc.txt,s_notoc.txt all` | 260 | OK 235(4차 234, fcs s_notoc 1건 개선), 독립 판독 불일치 0 |
| `node r3/fixtures_run.mjs` | 297 | OK 272(4차와 같음) |
| `node r3/pdfrun.mjs` | 240 | 변환 실패 0, 엄격 대조 실패 3(pdf-33·34 koli, pdf-36 kopoetics: 주제어 줄 전체 굵게 = F5-C), 목차 끝 0 |
| `cd ../sonnet_v && node run_synth.mjs all txt,docx,hwpx <12곳>` | 324 | 하네스에 알려진 표시(여러 문단 TXT 작성기·빈 문단 각주 위치·의도된 체재)만, 수정안 사본과 줄 단위로 같음 |
| `node ../sonnet_v/roles_test.mjs koli`, `rt_labels.mjs`, `star_test.mjs` | — | 259/264, 미인식 0/104, 별표 보존 |
| `node kwlabel.mjs`(4차 스크립트) | 52 × 2 | 불량 0 |

---

## 3. 이번 반영에서 생긴 결함 (중요도순)

### F5-A (중·각주 구조) 서지 변환 동기화가 각주 문단 안의 줄바꿈을 문단 나눔으로 바꾼다
- **위치**: `src/cite.js:110`. `paras: t.split('\n')`. 파서가 각주 글을 `paras.map(text).join('\n')`으로 만들고, 문단 안 줄바꿈도 `\n`이다(3차 F-5 반영). 그래서 둘을 가를 수 없다. `conv`는 `\n`과 `;`로 조각을 나눈다. 조각 앞 공백은 `fmt(c)`가 지운다(`:102`).
- **재현**
  - `node tests/audit_opus_fid5/v234/cite5.mjs`(가상 각주): 아래 결과는 APA·Chicago가 같다.
    - 문단 안 줄바꿈: 문단 1 → 2, 줄바꿈 1 → 0
    - 첫 문단 줄바꿈 + 번호가 둘째 문단: 문단 2 → 3, 번호가 사사 문단으로 감
    - 둘째 문단 기울임: 7자 → 0
    - TXT 꼴 앞 공백: 사라짐
  - `node tests/audit_opus_fid5/v234/cite5_out.mjs 1,2,3,4,5 koli`(작가 원고, APA로 변환·저장한 HWP를 다시 엶)

    | 원고 | 산출 각주 문단(keep → APA) | 줄바꿈 | 번호 뒤 공백 없음 |
    |---|---|---|---|
    | paper4 | 17 → 29 | 12 → 0 | 0 → 10 |
    | paper5 | 27 → 45 | 19 → 1 | 0 → 14 |
    | paper1·2·3 | 같음 | — | 0 → 9·15·9 |

- **기대/실제**: 서지 변환은 서지 글만 바꾸고 각주의 문단·줄바꿈·번호 위치는 그대로여야 한다. 실제로는 줄바꿈 하나가 각주 문단 하나가 된다. 쪽 수와 각주 영역 높이도 달라진다. 이 옵션을 고른 사용자에게만 일어난다. 4차 전에는 변환이 산출에 반영되지 않았으므로 이번 반영에서 새로 생긴 결함이다.
- **수정안**(P3, 사본 검증: paper1~5 APA 산출의 각주 문단·줄바꿈·번호 뒤 공백이 keep과 같음, 가상 12경우 모두 기대대로):
```js
// src/cite.js:102 — 조각 앞 공백(번호 뒤 한 칸)은 남긴다
const out = (/^\s*/.exec(part) || [''])[0] + fmt(c); converted++;
// src/cite.js:110 — 각주 문단마다 변환(문단 안 \n은 줄바꿈으로 남음). 바뀐 문단만 강조 런을 버린다
if (b.footnotes && b.footnotes.length) nb.footnotes = b.footnotes.map((f) => {
  const src = Array.isArray(f.paras) && f.paras.length ? f.paras : f.text.split('\n').map((x) => ({ text: x, runs: [] }));
  let changed = false; const paras = src.map((q) => { const t = conv(q.text, '각주'); if (t === q.text) return q; changed = true; return { text: t, runs: [] }; });
  return changed ? { ...f, paras, text: paras.map((q) => q.text).join('\n') } : f;
});
```
  b2e07b0은 앞뒤 공백만 보존했다. 문단 나눔은 그대로다(`logs/head/cite5_out.log`: paper4 29문단, paper5 45문단).

### F5-B (중·본문 글자 변경) 괄호로 싼 주제어 낱말로 시작하는 본문 줄 (Opus N-1의 남은 부분)
- **위치**: `src/structure.js:12-13`의 꼬리 (나) `닫는 기호 1~3자 + 공백`이다. 앞머리에서 `「『(<〈《`를 받고, 꼬리에서 `」』)>〉》`를 받는다. 판정은 상태와 관계없이 모든 문단에 적용된다(`:62-63`). 치환 조건 `src/engine.js:200`은 `」』)）]`로 끝나는 머리말을 구분 기호로 본다.
- **재현**: `tests/audit_opus_fid5/fixtures/b5_bracket.txt`(본론 안의 가상 본문 줄 5개)
  - `node tests/audit_opus_fid5/v234/kwforms5.mjs`: 본론 자리의 본문 줄 17개 중 13개가 주제어가 된다. 0278044에서는 2개였다. 실제 표지 47꼴 중 9꼴은 인식하지 못한다(F5-D 포함).
  - `node tests/audit_opus_fid5/v234/bracket_run.mjs all tests/audit_opus_fid5/fixtures/b5_bracket.txt`: 260줄(5줄 × 52곳)이 모두 본론 밖으로 옮겨진다. 15곳(koli·eastasia·fcs·interlali·gubo·koreanst·postcriticism·kopoetics·klc·aagcc·sanghur·iall·dongak·femcrit·literaturelab)에서 45줄의 글자가 바뀐다.

    | 원고(가상, 본론 안) | 산출 |
    |---|---|
    | `「핵심어」 개념은 이 가상 문단의 논의 대상이며 …` | koli `● 주제어 : 개념은 이 가상 문단의 …`, dongak `국문주제어: 개념은 …` (국문초록 묶음으로 이동) |
    | `『키워드』 이후의 문화 연구를 …` | `● 주제어 : 이후의 문화 연구를 …` |
    | `(키워드) 검색 결과는 …` | `[주제어] 검색 결과는 …`(eastasia) |
    | `〈핵심어〉 개념은 …`, `Keywords — the imaginary term …` | 글자는 같고 초록 묶음으로 이동 |

- **실데이터**: 작가 원고 5편과 PDF 40건에는 이 꼴의 본문 줄이 없다(`node tests/audit_opus_fid5/v234/kwcount.mjs`: 괄호 + 공백 꼴 2줄은 paper5의 실제 주제어 줄이다). 하지만 낫표로 책·글 제목을 쓰는 문학 논문에서 ‘『키워드』’ 같은 서명으로 문단을 여는 일은 있을 수 있다. 일어나면 본문 낱말이 지워진다.
- **수정안**(P1 (나), 사본 검증: 본문 오인 13 → 1, 글자 바뀜 45 → 0, 이동 260 → 0, 작가 원고·PDF 45건 × 2곳의 역할 변화 0(`patched/rolediff5.mjs`), 실제 주제어 63줄 중 문장형 0):
```js
// src/structure.js:62 앞 — 머리말 뒤에 구분 기호(쌍점·세로줄·〻)가 없고 문장 부호로 끝나는 줄은 본문 문장이다
const kwSentence = /[.．。!?！？]\s*["”’'」』)]*\s*$/.test(t) && !/^[^:：〻￨|]{0,28}[:：〻￨|]/.test(t);
if (RE.keywords.test(t) && !kwSentence) { … }
if (RE.keywordsEn.test(t) && !kwSentence) { … }
```
  남는 1줄은 `키워드: 이 가상 문단은 콜론 뒤에 문장을 쓴다.`다. 쌍점이 있어 표지로 보는 것이 맞고, 0278044부터 같다.

### F5-C (중·서식) `|`·`￨` 머리말은 치환되지 못하고, 줄 전체가 머리말 글자 모양으로 쓰인다
- **위치**: `src/engine.js:200`의 조건 `/[:：|￨〻\]】〕)）❙」』]\s*$/`와 `src/engine.js:189`의 `KW_LABEL` 꼬리 `[\s:：\]】〕❙」』)）]{0,4}`. `KW_LABEL`이 `|￨〻`를 머리말에 넣지 않으므로, 조건의 `|￨〻` 가지는 늘 거짓이다. 이 경우 블록 런이 비어 있다(TXT·PDF, 그리고 런이 없는 문단). 그러면 줄 전체가 `shapes[role].cs`로 쓰인다. 이 값은 예시의 첫 한글·영문 자리, 곧 머리말의 글자 모양이다(`:146`).
- **재현**
  - `node tests/audit_opus_fid5/s4v/kw_forms.mjs`: koli·eastasia에서 주제어로 인식되는 12꼴 중 8꼴(`|주제어|`, `｜주제어｜`, `주제어 |`, `주제어 -`, `주제어〻￨〻`, `＜주제어＞`, `Key-words:`, `KEY WORDS |`)이 원고 머리말 그대로 남는다. 그중 `|`·`￨`로 끝나는 꼴은 치환 조건이 받는다고 적힌 꼴이다.
  - `node tests/audit_opus_fid5/v234/r3/pdfrun.mjs`: 엄격 대조 실패는 4차 0 → 3이다(`pdfemph.mjs`: pdf-33·34 koli keywordsEn 85/85자 굵게, pdf-36 kopoetics keywords 49/49자 굵게). 세 건 모두 머리말이 `Key words ￨`, `|주제어|` 꼴이다(`pdfkwlab.mjs`). 4차에는 이 줄들이 (잔여물을 남긴 채) 치환되어 대조에서 빠졌다.
- **기존 결함과의 관계**: 머리말이 치환돼도 런이 없는 줄은 같은 이유로 줄 전체가 굵다. 바탕틀 예시에서 머리말만 굵은 학회는 koli 영문(`B8`), kopoetics 국문(`B5`), fcs 국·영(`B3`, `B7`), gubo 국문(`B5`)이다(`node tests/audit_opus_fid5/v234/tplkw.mjs …`). `node tests/audit_opus_fid5/v234/kwbold5.mjs paper1,2,3,5 all`을 돌리면 이 4곳에서 주제어 줄 20개가 줄 전체 굵게 나온다. 예: paper1 koli 영문 102/102자, fcs 국문 50/50자. daejung 8개는 예시가 처음부터 끝까지 굵다(37/37). 그래서 규정을 확인하지 않고는 결함이라 말할 수 없다.
- **수정안**(P2·P9, 사본 검증: 줄 전체 굵게 koli·kopoetics·fcs·gubo 20 → 0(daejung 8은 그대로), PDF 엄격 실패 3 → 0, `kw_forms` 치환 안 되는 꼴 8 → 4(`|주제어|`·`주제어 |`·`Key-words:`·`KEY WORDS |` 치환), `rt_labels` 미인식 0/104, `kwlabel` 불량 0, `labels.mjs`(k_kitchen × 52 표지) 변화 0):
```js
// src/engine.js:189 — 판정 정규식이 구분 기호로 받는 세로줄을 머리말 꼬리에도. 색인어·주요어·Key-words도 머리말로
const KW_LABEL = /^([^가-힣A-Za-z0-9]{0,3}(?:주제어|핵심어|키워드|색인어|주요어|국문\s*주제어|국문\s*핵심어|영문\s*주제어|key\s*-?\s*words?|keywords?)[\s:：|￨\]】〕❙」』)）]{0,4})/i;
// src/engine.js:148 — 주제어 예시에서 머리말 뒤 첫 글자(값이 없으면 머리말 끝 구분 기호)의 글자 모양을 valueCs로
// src/engine.js:378 이후 — 주제어 줄은 KW_LABEL 길이 L에서 런을 나누고, L 뒤는 valueCs로 쓴다
const csAt = (s) => (L > 0 && s >= L ? sh0.valueCs : cs);
```
  전체 코드는 `tests/audit_opus_fid5/patched/apply.mjs`의 P2·P9에 있다. 〻는 일부러 넣지 않았다. 넣으면 anim 바탕틀의 `주제어〻￨〻`가 학회 머리말로 뽑힌다. 그러면 작가 원고의 `주제어:`가 그 표기로 바뀐다. 이 글자가 한컴오피스에서 실제로 그렇게 보이는지는 확인하지 못했다.

### F5-D (낮음~중) 이중 표기 머리말을 인식하지 못함
- **위치**: `src/structure.js:12-13`. 4차 N-1 수정에서 (가)·(나) 두 가지 모두 여는 괄호를 막았다.
- **재현**: `node tests/audit_opus_fid5/v234/kwforms5.mjs`

  | 꼴 | 0278044 | 2f8ad3f | 234555a |
  |---|---|---|---|
  | `주제어(Keywords): 가상, 시험` | 초록 | **주제어** | 초록 |
  | `주제어(Key words) : …`, `핵심어(Key Words): …`, `주요어(主要語): …` | 초록 | **주제어** | 초록 |
  | `Keywords(주제어): …`, `Key words (주제어) : …` | 초록 | **Keywords** | 초록 |

  작가 원고·PDF 파싱본에는 이 꼴이 0개다. 국·영문을 함께 적는 학회 양식에서 쓰는 꼴이라 낮음~중으로 둔다.
- **수정안**(P1 (가), 사본 검증: 미인식 9 → 3. 남은 것은 `■ 주제어 가상`(구분 기호 없음), `중심어:`, `Keywords;`로 모두 0278044부터 같음): 낱말 뒤에 `(?:[(（][^()（）]{1,24}[)）]\s*)?`를 넣는다. `주제어(主題語)의 선택은 …`은 덧붙임 뒤에 구분 기호가 없으므로 계속 본문이다.
- 참고: journals.js에 ‘중심어 각 5개 내외’라고 적힌 학회가 있다(koreacontents 규정 문구). 그런데 `중심어:`는 인식하지 않는다(이전부터).

### F5-E (낮음~중) TXT 별표 경계 목록의 빈칸
- **위치**: `src/parse.js:336-338`(`OPEN`·`CLOSE`·`tok`)
- **재현**
  - `node tests/audit_opus_fid5/v234/star5b.mjs`: 42줄 중 32줄에서 별표가 글자로 남는다. 강조는 사라지고 원고에 없는 별표가 산출에 들어간다. 다음 꼴이다.
    - 바로 뒤 여는 괄호: `*Hamlet*(1600)`, `**굵게**(1990)`, `*가*(나)`, `*A*[1]`
    - 전각 괄호·문장부호: `（*A*）`, `〔*A*〕`, `*A*，`, `*A*。`
    - 기타 기호 앞뒤: `…`, `~`, `%`, `ㆍ`, `･`, `―`, `«»`, `<>`
    - ‘작품명 바로 뒤 괄호 연도’는 문학 논문에서 흔하다.
  - `node tests/audit_opus_fid5/pairs5.mjs v`: `(*) 표시와 (*) 표시`, `[*]와 [*]`, `“*”와 “*”`, `「*」는 「*」와`에서 별표 둘씩이 사라진다(4/4). 이 문제는 Sonnet 5차가 F5-4로 따로 보고했다.
- **수정안**(P4·P4b, 사본 검증: 42줄 모두 강조, 기호 쌍 4/4 보존, `star2` 16/16, `txt_md` PDF 40건 charsLost 0, `star5` 56줄 중 남은 7줄은 겹친 강조 `***`·`**…*…*…**`(이전부터)과 Markdown상 옳은 해석 3줄)
  - 경계는 공백, 별표를 뺀 ASCII 문장부호, «», U+2010–201F, …, ⸺⸻, U+3000–303F, U+FF01–FF65, ㆍ다. 닫는 쪽에는 한글을 더한다. 안쪽 첫 글자는 닫는 기호·문장부호가 아니어야 하고, 끝 글자는 여는 기호가 아니어야 한다.
  - `\p{P}` 전체를 쓰면 안 된다. 깨진 글자 PDF 파싱본(pdf-03·04)의 `¡*…‰*` 별표 4자를 강조로 먹는다. 사본에서 확인했다. 정확한 정규식은 `patched/apply.mjs` P4·P4b에 있다.
  - b2e07b0은 전각 문장부호 일부와 기호 쌍을 고쳤다. 그러나 `*Hamlet*(1600)` 등 21줄은 그대로다(`logs/head/star5b.log`).

### F5-F (낮음) TXT 각주 이어짐: 문서 끝 범위 판정이 들여 쓴 본문 줄을 끝 묶음에 넣는다
- **위치**: `src/parse.js:325`. 끝에서 거슬러 올라가며 빈 줄·정의·들여 쓴 줄을 모두 끝 묶음으로 본다. 그래서 본문 문단을 탭으로 들여 쓴 원고에서는 마지막 장 전체가 ‘끝 묶음’이 된다.
- **재현**: `node tests/audit_opus_fid5/v234/txtcont5.mjs`
  - `모든 문단 탭 들여쓰기·정의는 장마다`: 마지막 장의 `\t결론 둘째 문단.`이 각주 3의 둘째 문단이 된다(본문에서 사라짐). 첫 장은 해소됐다.
  - Sonnet N-6 원형(`1. 서론` / `\t첫 문단.[^1]` / `[^1]: …` / `\t둘째 문단`으로 끝나는 문서)도 그대로 흡수된다.
- **수정안**(P5, 사본 검증: 위 경우는 본문, 표준 MD 꼴·정의 바로 아래 4칸은 계속 같은 각주): 끝 묶음은 첫 정의부터 시작한다. 각주 표지(`[^n]`, 정의 아님)가 든 줄은 끝 묶음에 넣지 않는다. 끝 묶음 앞에도 정의가 있으면(정의를 문단마다 둔 원고) 이어짐을 쓰지 않는다. 다만 Sonnet 원형처럼 정의가 하나뿐이고 문서 끝에 있는 경우는 모양만으로 가를 수 없다. 이 경우는 수정안에서도 각주로 읽는다. b2e07b0은 이 경우에 경고를 더했으며, 그 방향이 맞다.

### F5-G (낮음) DOCX: 표시 각주 뒤에 미주가 오면 번호가 겹친다
- **위치**: `src/parse.js:249`. `wordNum`은 Word 각주만 센다. 그런데 각주로 옮긴 미주도 산출에서 번호를 차지한다.
- **재현**: `node tests/audit_opus_fid5/fixtures/make_docx5.mjs` 뒤 `node tests/audit_opus_fid5/v234/docxnum5.mjs tests/audit_opus_fid5/fixtures/d5_mark_endnote.docx`. 원고 순서는 사용자 지정 표시 각주, 미주, 번호 각주 둘이다. 산출 표시 번호는 `*,1,1,2`로 `1`이 겹친다. b7d5603 이전에는 `*,1,2,3`이었다.
- **수정안**(P7, 사본 검증: `*,1,2,3`, k_kitchen.docx `*,1…10` 그대로): 표시 각주가 아니면 각주·미주를 함께 센다(`if (tk.fn !== undefined && tk.customMark) afterMark = true; else { wordNum++; if (afterMark) { restart = wordNum; afterMark = false; } }`).

### F5-H (낮음) ‘체재 순서 재배열’ 안내가 문단을 옮겨도 나오지 않는 경우
- **위치**: `src/structure.js:183-186`. 원고 쪽은 ‘처음 나온 순서’(`seq`)로, 산출 쪽은 ‘연속열’(`outSeq`)로 비교한다. 그래서 같은 묶음이 떨어져 있다가 합쳐지는 이동은 보이지 않는다.
- **재현**: `node tests/audit_opus_fid5/v234/reorder_note.mjs tests/audit_opus_fid5/fixtures/b5_bracket_ko.txt …`. 본문 가운데 줄이 주제어로 잡혀 국문초록 묶음으로 옮겨져도 52곳 중 12곳은 안내가 없다. 이 안내는 F5-B 같은 오인을 사용자가 알아챌 유일한 단서다.
- **수정안**(P8, 사본 검증: 누락 0, 다른 6개 가상 원고 × 52곳 안내 정확): 원고 쪽도 `outSeq`처럼 연속열(`srcSeq`)로 만들어 비교하고 `from`에 쓴다.

### F5-I (낮음, 이번에 고친 함수 안의 기존 결함) HWPX 각주 메타가 고정폭 빈칸을 U+3000으로 읽는다
- **위치**: `src/parse.js:120`. `dec`가 `<hp:fwSpace/>`를 U+3000으로 바꾼다. rhwp의 각주 글은 같은 자리를 U+2007로 준다. 짝짓기 키는 공백을 지우므로 짝은 맞는다. 하지만 런 글자 비교(`:95`)에서 어긋나 그 각주의 강조 런을 모두 버린다.
- **재현**: `node tests/audit_opus_fid5/fixtures/make5.mjs`(가상 HWPX 8종: 탭·하이퍼링크 필드·책갈피·묶음/고정폭 빈칸·실체 참조·제목 차례 표시·PUA) 뒤 `node tests/audit_opus_fid4/fnparse.mjs tests/audit_opus_fid5/fixtures/k5_odd_space.hwp`. 고정폭 빈칸이 든 각주만 `강조 []`이고(기울임 유실), 나머지 7종은 강조를 보존한다. 작가 원고 5편의 각주에는 고정폭 빈칸이 0개다.
- **수정안**(P6, 사본 검증: 런 2개 복원): `dec`에서 `<hp:fwSpace/>`를 U+2007로 바꾼다.

### 그 밖의 관찰
1. **64개 탐색 창**: 자기 메타와 짝이 안 맞는 각주가 있고 그 뒤 64개 안에 같은 글의 각주가 있으면, 커서가 멀리 건너뛴다. 그러면 사이의 각주 메타를 모두 잃는다. 이런 짝 어긋남을 만드는 요소를 가상 원고 8종으로 찾았지만, 글이 어긋나는 것은 찾지 못했다(위 F5-I는 키가 맞음). 그래서 재현하지 못했다.
2. **본문 가운데 ‘「차례」’ 한 줄**(시 제목으로 가정): 목차 제목이 되어 본론 밖으로 옮겨진다. 2f8ad3f도 52곳 모두 같아서 이번 반영과는 관계없다(`node tests/audit_opus_fid5/v234/midtoc.mjs`).
3. **TXT 각주 정의 안의 별표**: `[^1]: 가상, *Titulus*, …`는 별표째 각주에 들어간다. 정의 없는 표지 `[^없음]`은 글자가 사라지고 빈 각주가 생기며 경고가 없다. 둘 다 이전부터 있던 것이다. b2e07b0이 고쳤다(F5-6·F5-7). 사본의 P10도 앞의 것을 고친다(`fnemph_txt.mjs p`).
4. **겹친 강조** `***굵은 기울임***`, `**굵게 *안의 기울임* 끝**`: 별표가 글자로 남는다(이전부터).
5. **재현 하네스의 한계**: 4차 `r3/strictCompare`는 머리말이 바뀐 표지 줄의 강조를 비교하지 않는다. 그래서 F5-C의 줄 전체 굵게를 135건 대조에서 잡지 못했다(4차 daejung도 같은 이유). 검증 도구에 옮길 때는 ‘머리말 이후 구간’의 강조를 따로 대조해야 한다.

---

## 4. 실행한 명령과 수치

모든 임시 파일은 `tests/audit_opus_fid5/` 아래에 있다. 디렉터리 구성은 다음과 같다.
- `v234/src`: 234555a 사본. `v234/r3`·`s4v`·`sonnet_v`는 그 사본을 쓰는 하네스다.
- `patched/src`: 수정안 사본. `patched/apply.mjs`를 v234 사본에 적용한 것이다. `patched/r3`·`s4p`·`sonnet_p`는 그 사본을 쓰는 하네스다.
- 작업 트리(b2e07b0) 참고 값은 루트 스크립트·`r3`·`s4h`·`sonnet`으로 냈다.
- 로그: `logs/v234/`, `logs/patched/`, `logs/head/`. 일괄 실행은 `run_all.sh <v234|patched|head>`.

| 명령 | 234555a | 수정안 |
|---|---|---|
| `r3/papers.mjs`(135) | 127/8, 유실 0 | 127/8(같은 8건), 유실 0 |
| `r3/indep.mjs`(135) | 오류 0 | 오류 0 |
| `r3/fixtures_run.mjs` 5종 × 52 / 11종 × 27 | 235 / 272 | 235 / 272(통과·실패 같음, 독립 판독 불일치 0) |
| `r3/pdfrun.mjs`(240) | 엄격 실패 3, 목차 끝 0 | 엄격 실패 0 |
| `run_synth.mjs all txt,docx,hwpx <12곳>`(324) | 알려진 하네스 표시만 | 줄 단위로 같음 |
| `falsehead_run.mjs all` / `kwlabel.mjs` / `pdftail.mjs` | 0·0·0 / 0 / 8곳 0 | 같음 |
| `kwforms5.mjs` 실제 표지 미인식 / 본문 오인 | 9/47 / 13/17 | 3/47 / 1/17 |
| `bracket_run.mjs all` 글자 바뀜 / 이동 | 45 / 260 | 0 / 0 |
| `cite5_out.mjs 1,2,3,4,5 koli`(APA) | paper4 각주 문단 17→29, paper5 27→45, 번호 뒤 공백 없음 9·15·9·10·14 | 모두 keep과 같음 |
| `star5b.mjs` 별표 남음 / `pairs5.mjs` 기호 쌍 별표 소실 | 32/42 / 4/4 | 0/42 / 0/4 |
| `s4*/txt_md.mjs` PDF 40건 charsLost / `star2.mjs` 강조 | 0 / 16 | 0 / 16 |
| `kwbold5.mjs paper1,2,3,5 all` 줄 전체 굵게 | koli 4·kopoetics 4·fcs 8·gubo 4·daejung 8 | daejung 8 |
| `txtcont5.mjs` 8종 | 마지막 장·원형 흡수 | 원형만 흡수(모호) |
| `docxnum5.mjs` 미주 섞임 | `*,1,1,2` | `*,1,2,3` |
| `reorder_note.mjs` 7종 × 52 | 안내 누락 12 | 0 |
| `roles_test.mjs koli` / `rt_labels.mjs` / `label_fp.mjs` / `label_fp2.mjs` | 259/264 / 0/104 / FAIL 1 / 13 본문 | 259/264 / 0/104 / FAIL 0 / 13 본문 |
| `patched/rolediff5.mjs`(작가 5 + PDF 40, koli·dongak) | — | 234555a 대비 역할 변화 0 |

### 확인 못 한 것
- 한컴오피스에서 직접 열어 보지 않았다. 다음은 확인하지 못했다.
  - 주제어 줄의 굵기가 학회 규정에 맞는지. 특히 예시 전체가 굵은 daejung.
  - anim 머리말의 `〻` 글자가 실제로 어떻게 보이는지.
  - 미주가 섞인 DOCX의 Word 화면 번호와 한글 산출 번호의 대응. Word는 미주를 따로 i, ii로 센다.
- 64개 탐색 창의 건너뛰기는 재현 원고를 만들지 못했다(그 밖의 관찰 1).
- `tools/pipeline_test.mjs`·`fidelity_test.mjs`·`verify_matrix.mjs`는 고정 경로(`out/`, `tests/out/`)에 써서 실행하지 않았다.
- 브라우저(`dist/dev.html`)로는 실행하지 않았다. 결론은 Node에서 같은 모듈로 낸 것이다.

### 작업 중 생긴 일 (알림)
- 4차 `r3/fixtures_run.mjs`를 사본으로 처음 돌렸을 때, 이 스크립트는 독립 판독 경로가 `tests/audit_opus_fid4/r3/out/`으로 고정되어 있었다. 그래서 그 폴더의 `_i.json` 하나를 덮어썼고, 4차 산출 HWP와 비교했다. 경로를 `tests/audit_opus_fid5/` 아래로 고친 뒤 위 수치를 모두 다시 냈다. `src/` 등 금지 경로는 건드리지 않았다.
- 감사 중 main이 b2e07b0으로 바뀌었다(21:32). 21:32 이전의 작업 트리 실행은 234555a와 같았다. 그래도 보고서 수치는 모두 `v234` 사본에서 다시 냈다.

## 5. 만든 파일 (`tests/audit_opus_fid5/`)
- 가상 원고(`fixtures/`)
  - `b5_bracket.txt`, `b5_bracket_ko.txt`(괄호 낱말 본문 줄)
  - `s5_midtoc.txt`(본문 가운데 목차 꼴 줄)
  - `make_docx5.mjs` → `d5_mark_endnote.docx`(표시 각주 + 미주)
  - `make5.mjs` → `k5_odd_{plain,tab,link,bookmark,space,amp,title,pua}.hwp(x)`(각주 안 특수 요소)
- 시험 스크립트
  - `star5.mjs`, `star5b.mjs`, `pairs5.mjs`(별표)
  - `kwforms5.mjs`, `bracket_run.mjs`, `v234/kwcount.mjs`, `pdfkwlab.mjs`, `pdfemph.mjs`, `tplkw.mjs`, `kwbold5.mjs`(주제어)
  - `cite5.mjs`, `cite5_papers.mjs`, `cite5_out.mjs`(서지 변환)
  - `txtcont5.mjs`, `fnemph_txt.mjs`, `undef_fn.mjs`(TXT 각주)
  - `docxnum5.mjs`, `fnspace.mjs`, `fnspace_papers.mjs`(번호·메타)
  - `reorder_note.mjs`, `midtoc.mjs`(재배열)
  - `marks_warn.mjs`, `run_all.sh`
- 수정안: `patched/apply.mjs`(P1~P10, P4b), `patched/src/`(적용 결과), `patched/rolediff5.mjs`, `patched/starloss.mjs`
- 판 비교: `v234/`(234555a), `v_b7/`(b7d5603)
