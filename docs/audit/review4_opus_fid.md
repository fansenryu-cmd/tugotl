점수: 88/100

# 4차 재감사 — A. 산출물 충실도 (opus_fid4, 2026-10-13 KST, main 2f8ad3f)

> 대상은 브리프대로 2f8ad3f다. 감사 도중(20:20) main이 3b49ac1(ASTRA 3차 반영: DOCX 이름공간, 연속 빈 줄, 국외 문헌 조각 등)로 바뀌었다. 그래서 2f8ad3f 사본(`tests/audit_opus_fid4/v2f8/`)을 따로 만들어 핵심 재현을 다시 돌렸다. **새 결함 N-1~N-5의 재현 수치는 2f8ad3f와 3b49ac1에서 같다**(`*_v.mjs`가 2f8ad3f, 이름에 접미사가 없는 것이 HEAD). 줄 번호는 2f8ad3f 기준이고, parse.js는 HEAD에서 3~4줄 밀린다(괄호 안에 HEAD 줄). 수정안 사본(`patched/`)은 3b49ac1 위에 만들었다.

## 요약

**판정: 3차에서 지적한 보존 결함은 거의 모두 사라졌다. 다만 이번 반영으로 새 결함 세 가지가 생겼다. 그중 하나는 본문 글자를 바꾼다.**

- 작가 원고 5편 × 학회 27곳(바탕틀 12·규정값 12·일반 3, 135건)을 다시 변환했다. 산출 HWP·HWPX를 재파싱해 정규화 없이 대조했다. 본문 글자 불일치 0, 각주 4,833/4,833 내용·위치·번호 유무 일치, 원고 문단 유실 0이다. 남은 실패 8건은 모두 서식이다(litheory 국문초록 제목 기울임 4, daejung 주제어 줄 전체 굵게 4). daejung 4건은 3차부터 있던 결함인데, 표지 치환이 사라지면서 대조에 처음 드러났다.
- **각주 구조**를 두 경로로 대조했다. 하나는 앱 파서를 거치지 않는 rhwp HWPX 내보내기(5편 × 13곳 = 65건), 다른 하나는 독립 HWP5 판독(135건)이다. 각주 문단 수, 각주 안 줄바꿈, 번호(autoNum/atno)가 붙은 문단, 각주 ‘새 번호 지정’, 각주 안 강조 글자가 모두 원고와 같았다(불일치 0). 3차의 F-4·F-5·F-11.2는 실원고에서 해소됐다.
- 3차 발견 25개(Opus F-1~F-12, Sonnet F-01~F-13)를 판정했다. **해소 16, 부분 해소 7, 그대로 2**다. ‘그대로’ 2건은 조치표에서 보류한 항목이다(Opus F-11.1·F-12, Sonnet F-12와 같은 묶음).
- **새 결함**
  1. **N-1 (높음·내용 변경)**: 표지 정규식을 넓히면서 본문 줄이 주제어나 초록 제목으로 오인된다. 오인된 줄은 엔진의 표지 치환으로 **첫 낱말이 바탕틀 머리말로 바뀌고**, 초록·영문초록 묶음으로 옮겨진다. PDF 파싱본 1건(pdf-16)의 본문 문단 1개에서 실제로 일어났다. 장 제목 ‘Ⅳ. 요약’, ‘Ⅴ. 개요’도 초록 제목이 되어 ‘국문초록’ 등으로 바뀐다.
  2. **N-2 (중간·체재)**: 체재 밖 묶음을 ‘원고에서 바로 앞 체재 묶음 뒤’에 두는 규칙 때문에 생긴다. **투고일(tail)이 영문초록과 참고문헌 사이로, 또는 본문 앞으로** 간다(dongak·minmunhak·aagcc·koreacontents). 목차 앞에 본문 역할 줄이 하나라도 있으면 **목차가 본문 뒤로** 간다.
  3. **N-3 (중간·각주)**: HWPX 각주 메타 짝짓기(`hwpxFootnoteMeta`)가 표 안 각주까지 센다. 그래서 표 안 각주가 5개 이상이면 그 뒤 **모든 각주**의 강조·새 번호·번호 문단 정보를 잃는다.
  4. N-4·N-5 (낮음~중간·각주 번호): 번호 없는 각주 바로 앞의 ‘새 번호 지정’이 버려진다. DOCX 사용자 지정 표시 각주 뒤의 번호는 한글이 번호 없는 각주도 세는 경우 한 칸씩 밀린다(한컴오피스 확인 못 함).
- N-1~N-5 수정안은 `src` 사본(`tests/audit_opus_fid4/patched/`, `apply.mjs`)에 적용해 검증했다. 새 결함 재현 수치는 모두 0이 됐다. 회귀도 없었다: 실원고 135건 결과가 원본과 같고, 역할 시험 259/264, 재변환 표지 104회 미인식 0, 주제어 머리말 52곳 불량 0, PDF 40건 역할 배정은 오인 1건만 사라졌다.

### 95점에 이르기 위해 고쳐야 할 것 (우선순위)

| 순위 | 할 일 | 위치 | 크기 | 검증 |
|---|---|---|---|---|
| 1 | N-1 주제어 정규식: 머리말 꼬리를 ‘구분 기호’ 또는 ‘닫는 기호+공백’으로 한정한다. 초록·목차·Abstract 제목은 앞머리에서 로마 숫자를 뺀다. 엔진은 원고 머리말이 구분 기호로 끝날 때만 바꾼다 | `src/structure.js:8-13`, `src/engine.js:200` | 6줄 | 사본: 오인 0, 회귀 0 |
| 2 | N-2 체재 밖 묶음 배치: 투고일은 끝, 목차는 앞부분(본문·참고문헌 아닌 묶음) 뒤에 둔다 | `src/structure.js:171-174` | 8줄 | 사본: PDF 투고일 오배치 0, 목차 끝 0 |
| 3 | N-3 각주 메타: 표 안 각주는 짝짓기에서 빼고, 찾는 창을 4에서 64로 넓힌다 | `src/parse.js:88, 120-121`(HEAD 91, 123-124) | 4줄 | 사본: k4_tblfn 불일치 0 |
| 4 | N-4 새 번호를 번호 없는 각주 앞에서도 보존. N-5 DOCX 표시 각주 뒤 첫 번호 각주에 Word 번호를 `restart`로 | `src/engine.js:352`, `src/parse.js:219, 240`(HEAD 222, 244) | 4줄 | 사본: 두 모형 모두 불일치 0 |
| 5 | F-8 잔여: litheory 국문초록 제목이 기울임(`abstractHead: { like: 'abstractEnHead' }`) | `src/journals.js:1195` | 데이터 1곳 | — |
| 6 | 검증 도구에 이번 감사의 대조를 옮기기(조치표 ‘보류’): 각주 구조(문단·줄바꿈·번호 문단·newNum), 체재 밖 묶음 위치, 본문 줄의 표지 오인 | `tools/verify_matrix.mjs` | — | — |

1~4를 고치면 새 결함이 정리되어 93~94점으로 본다. 5와 6, 그리고 아래 ‘부분 해소’ 가운데 DOCX 스타일 강조·자동 번호 경고까지 고치면 95점에 이른다.

---

## 1. 3차 발견의 재판정

재현은 3차 스크립트를 `tests/audit_opus_fid4/r3/`(Opus)와 `tests/audit_opus_fid4/sonnet/`(Sonnet)에 복사해 출력 경로만 바꿔 실행했다. 읽는 가상 원고는 3차 위치 그대로다.

### Opus F-1~F-12

| 발견 | 판정 | 재현 명령 | 3차 → 4차 수치 |
|---|---|---|---|
| F-1 보조평면 글자 U+FFFD | **해소** | `node tests/audit_opus_fid4/r3/bigfix.mjs 1000`(3000도), `node tests/audit_opus_fid4/t8b.mjs` | koli 1,000·3,000문단 U+FFFD 2 → 0(ricc·mkliterature도 0). t8b ricc·gubo 본문·각주 불일치 0 |
| F-2 주제어 머리말 오염 | **해소** | `node tests/audit_opus_fid4/r3/kwpapers.mjs`, `node tests/audit_opus_fid4/kwlabel.mjs`, `node tests/audit_opus_fid4/r3/labels.mjs` | 실원고 오염 줄 paper1·2·3·5 각 6 → 0. 52곳 × 국문·영문 주제어 줄: 숫자·마침표·여는 괄호 꼬리 0, 끝 각주 위치 104/104, 기울임 7/7자 104/104. k_kitchen.hwp × 52: 표지 각주 위치 불일치 0, 표지 강조 유실 0. daejung은 머리말 짝이 안 맞아 원고 머리말을 그대로 쓴다(닫는 괄호 오염 없음) |
| F-3 목차가 맨 끝 | **부분 해소** | `node tests/audit_opus_fid4/r3/fixtures_run.mjs k_kitchen.hwp,k_kitchen.hwpx,k_kitchen.docx,s_toc.txt,s_notoc.txt all`, `node tests/audit_opus_fid4/pdftail.mjs` | HWP·TXT 가상 원고 ‘목차가 끝’ 30 → 0(260건). PDF 파싱본은 ricc 5/40, aagcc·koreacontents 각 7/40, litheory 1/40건에서 여전히 끝(N-2b) |
| F-4 각주 번호 밀림 | (a) **해소** (b) **부분 해소** | `node tests/audit_opus_fid4/r3/fnnum.mjs tests/원고/paper{1..5}.hwp`, `node tests/audit_opus_fid4/docxnum.mjs …/k_kitchen.docx` | (a) paper2 `1*,1,2,3…` 일치, 독립 HWP5 판독으로 각주 nwno(1) 보존 27/27곳. (b) DOCX 표시 각주는 번호 없는 각주가 됐지만 다음 번호 각주에 새 번호가 없다. 한글이 번호 없는 각주도 센다면 10/10개가 +1 밀린다(N-5) |
| F-5 각주 줄바꿈 → 문단 | **해소** | `node tests/audit_opus_fid4/r3/fnbr3.mjs`, `fnbr2.mjs`, `fnbr.mjs` | paper4 각주 문단 17·줄바꿈 12, paper5 27·19, paper3 36·0 모두 원고와 같음. DOCX D15 문단 1·줄바꿈 1 |
| F-6 DOCX 미주·기호·하이픈·CR | **해소** | `node tests/audit_opus_fid4/r3/dumpparse.mjs tests/audit_opus_fid/fixtures/d_special.docx` | D7 미주 내용 보존(경고 ‘미주 1개를 각주로’), D3 α, D6 ‑(U+2011), D2 CR→줄바꿈, D11 쪽 나눔은 버림. D8 텍스트 상자·D9 윗주는 그대로(Sonnet F-08 참조) |
| F-7 각주 안 강조 유실 | **해소** (N-3 예외) | `node tests/audit_opus_fid4/r3/fixtures_run.mjs`(27곳), `node tests/audit_opus_fid4/fncmp.mjs …/k_kitchen.hwp,…/k_kitchen.hwpx koli,ricc,mkliterature --keep` | k_kitchen hwp·hwpx 각주 강조 22자 유실 0(3곳), fixtures_run ‘각주강조’ 실패 54 → 0. DOCX D14 기울임 보존 |
| F-8 litheory 위첨자·기울임 | **부분 해소** | `node tests/audit_opus_fid4/emph_dbg.mjs paper4 litheory`, `… paper1 litheory` | 저자 줄 위첨자 0(해소). 국문초록 제목 기울임은 그대로: paper1·2 각 6자, paper3 4자, paper5 4자 |
| F-9 영문 논문·참고문헌 제목 | **해소**(PDF 일부 남음) | `node tests/audit_opus_fid4/roles.mjs tests/audit_opus_fid/fixtures/s_english.txt`, `node tests/audit_opus_fid4/r3/pdfref.mjs` | s_english: `1. Introduction`→h1, 본문→body, `References`→refHead, 항목→ref. PDF 참고문헌 제목 없음 20 → 16건, 인식 못 한 제목 꼴 5 → 1건(번호 붙은 제목) |
| F-10 인용 사이 빈 줄 | **해소** | `node tests/audit_opus_fid4/r3/stanza.mjs tests/audit_opus_fid/fixtures/q_stanza.txt tests/원고/paper1.hwp tests/원고/paper2.hwp tests/원고/paper5.hwp` | 가상 1/1, paper1 1/1, paper2 1/1, paper5 3/3 보존(koli·ricc·mkliterature) |
| F-11.1 강조점·취소선·아래첨자 | **그대로**(보류) | — | 조치표대로 다음 차수 |
| F-11.2 앞 공백 번호 없음 판정 | **해소** | `node tests/audit_opus_fid4/r3/nonum_space.mjs` | `<hp:t> * …` 각주 noNumber true, 산출 autoNum 없음 |
| F-11.3 두 줄 제목 둘째 줄이 저자 | **부분 해소** | `node tests/audit_opus_fid4/roles.mjs tests/audit_opus_fid/fixtures/s_toc.txt` | 다음 줄이 이름이면 해소(Sonnet two_line_title 통과). s_toc처럼 둘째 줄 뒤에 부제가 오면 여전히 author |
| F-11.4 한글 미주 경고 | **해소** | 코드 확인 `src/parse.js:102`(HEAD 105) | — |
| F-11.5 koreanst tocLabel | **해소** | `node tests/audit_opus_fid4/tochead.mjs` | s_toc·s_notoc × 52곳: `tocLabel`과 다른 목차 제목 0(koreanst ‘차례’) |
| F-11.6 HWPX U+FFFE·FFFF | 그대로(불가피) | — | — |
| F-11.7 TXT 여러 문단·번호 없는 각주 | **부분 해소** | `node tests/audit_opus_fid4/txtedge.mjs` | 정의 바로 아래 4칸 들여쓰기는 같은 각주의 다음 문단. 표준 마크다운 꼴(빈 줄 뒤 들여쓰기)은 본문 문단이 된다(아래 3.4) |
| F-12 검증 도구 사각지대 | **그대로**(보류) | `git diff 0278044 2f8ad3f --stat`(tools 변경 없음) | — |

### Sonnet F-01~F-13

| 발견 | 판정 | 재현 명령(`tests/audit_opus_fid4/sonnet/`에서) | 수치 |
|---|---|---|---|
| F-01 체재 밖 묶음 맨 뒤 | **부분 해소** | `node seq.mjs fixtures/kitchen.txt fcs`, `node seq.mjs fixtures/withtoc.txt ricc`, `node run_files.mjs ../../원고/paperN.hwp all` | fcs·ricc 목차가 앞부분 뒤로 감. 5편 × 52곳 260건 중 OK 254. 남은 6건 중 structure-order 4건은 litheory 국문초록이 원래 자리에 남은 것(의도), 2건은 아래 정오. 투고일·목차의 새 오배치는 N-2 |
| F-02 주제어 머리말 잔여물 | **해소** | `node labels_out.mjs 1` | kopoetics `• 주제어： `, dongak `국문주제어: `, interlali `Keywords: `, daejung `주제어: ` |
| F-03 TXT 별표 | **해소** | `node star_test.mjs`, `node tests/audit_opus_fid4/txtedge.mjs`(저장소 루트) | 저자 별표·`2*3` 보존. 정상 강조 유지. `『*…*』`·`*…*!`·`***…***`는 강조로 읽지 않고 별표를 글자로 남긴다(글자 유실 없음) |
| F-04 각주 안 강조 | **해소**(N-3 예외) | F-7과 같음 | — |
| F-05 글 없는 문단 각주 | **해소** | `node run_synth.mjs fnstress txt,docx,hwpx koli -v` | 14/14 보존. 남은 `truth-fn-pos-total×1`은 하네스가 빈 문단 각주를 위치 대조에서 세지 않아 생기는 표시다(analyze.mjs:148) |
| F-06 영문 논문 | **해소** | `node roles_test.mjs koli` | english_paper·ref_en·ref_upper·ref_works·ref_bracket·ref_inyong·ref_jaryo 통과 |
| F-07 앞부분 역할 | **부분 해소** | `node roles_test.mjs koli` | 217/264 → 259/264. 남은 실패: en_subtitle_nodash, bare_headings, roman_headings(조치표가 규칙의 한계로 둔 3건) |
| F-08 DOCX 읽기 누락 | **부분 해소** | `node wild_docx.mjs` | 미주·기호·줄바꿈 금지 하이픈·CR·쪽 나눔은 해소. 스타일로 정한 굵게·기울임(styleBold·rStyleItalic), 자동 번호(numPr) 경고, 텍스트 상자, 윗주, `w:ptab`은 그대로 |
| F-09 재변환 표지 미인식 | **해소** | `node rt_labels.mjs` | 104회 미인식 9곳 → 0 |
| F-10 연월·URL 제목 skip | **해소** | `node roles_test.mjs koli` | title_year_month·vol_no·pp·url·copy 통과 |
| F-11 paper3 각주 번호 위치 | **해소** | `node tests/audit_opus_fid4/indep_fn.mjs paper3 koli`(루트) | 번호 문단(atno) 원고·산출 같음, 글자 1자 추가 없음(52/52 → 0) |
| F-12 표·그림 자리 표시 | **그대로**(보류) | — | 조치표대로 |
| F-13 TXT 여러 문단 각주 | **부분 해소** | Opus F-11.7과 같음 | — |

---

## 2. 새 결함 (중요도순)

### N-1 (높음·본문 글자 변경) 넓힌 표지 정규식이 본문 줄을 주제어·초록 제목으로 잡고, 엔진이 그 낱말을 바탕틀 머리말로 바꾼다
- **위치**: `src/structure.js:12-13`(`keywords`·`keywordsEn`), `src/structure.js:8-10`(`tocHead`·`abstractHead`·`abstractEnHead` 앞머리 `[^가-힣A-Za-z0-9\s]{0,3}`), 판정은 상태와 관계없이 모든 문단에 적용된다(`src/structure.js:58-63`). 치환은 `src/engine.js:200`.
- **원인**: 주제어 정규식 꼬리 `(?:[^가-힣A-Za-z0-9\s:：]{1,3}|…)`는 ‘한글·영문·숫자가 아닌 글자 1~3개’면 무엇이든 받는다. 그래서 ‘키워드’ 뒤의 쉼표·닫는 따옴표·여는 괄호, ‘(Keyword)’ 뒤의 ‘)’도 머리말로 본다. 앞머리 기호 칸은 로마 숫자 Ⅳ·Ⅴ도 받는다. `abstractHead`에만 `!/^[ⅠⅡⅢ\d]/` 예외가 있어 Ⅳ 이후 장 제목은 걸린다. 오인된 줄은 표지 역할이 된다. 엔진은 `KW_LABEL`이 잡은 앞부분(예: ‘‘키워드’)을 바탕틀 머리말로 바꾸고, 재배열은 그 줄을 초록·영문초록 묶음으로 옮긴다.
- **재현**: 가상 원고 `tests/audit_opus_fid4/fixtures/b_falsehead.txt`(본문 줄 5개와 장 제목 2개)
  - `node tests/audit_opus_fid4/roles.mjs tests/audit_opus_fid4/fixtures/b_falsehead.txt`: 3차 코드에서는 7줄 모두 body·h1이었다. 지금은 keywordsEn 1, keywords 4, abstractHead 2이고, 장 아래 문단은 abstract가 된다.
  - `node tests/audit_opus_fid4/falsehead_koli.mjs koli`: 산출에서 다음과 같이 바뀐다.

    | 원고(가상) | 산출(koli) |
    |---|---|
    | `‘키워드’는 이 가상 문단에서 …` (본문, Ⅰ장 안) | `● 주제어 : ’는 이 가상 문단에서 …` (국문초록 뒤로 이동) |
    | `키워드, 해시태그, 검색어는 …` | `● 주제어 : , 해시태그, 검색어는 …` |
    | `(Keyword)’라는 영어 낱말은 …` | `●Keywords : ’라는 영어 낱말은 …` (참고문헌 뒤로 이동) |
    | `Ⅳ. 요약` (장 제목) + 문단 | `국문 요약` + 문단이 초록으로 앞부분에 감, 자동 목차에서 장이 빠짐 |

  - `node tests/audit_opus_fid4/falsehead_run.mjs all`: 52곳 × 9개 검사에서 글자가 바뀐 줄 77, 장 제목이 표지 문구로 바뀌어 원문 줄이 없어진 경우 34, 참고문헌 뒤로 옮겨진 경우 111이다.
- **실데이터**: `node tests/audit_opus_fid4/rolediff.mjs koli`는 3차 코드와 지금 코드의 역할 배정을 비교한다(원고 글자는 가린 꼴로만 출력). 작가 원고 5편은 바뀐 역할이 0이다. PDF 파싱본 40건에서는 바뀐 배정 대부분이 개선이다(‘❍참고문헌’, ‘■ Abstract’, ‘〈차 례〉’, ‘Key words ￨’ 인식). 하지만 **pdf-16의 본문 문단 1개**(괄호로 싼 영문 낱말과 닫는 따옴표로 시작)가 keywordsEn이 됐다. `node tests/audit_opus_fid4/pdf16.mjs 16 102`로 보면, koli·gubo에서 이 문단의 첫 낱말이 바탕틀 머리말로 바뀐다(48자 → 51·50자). 위치도 원고의 102번째 문단에서 산출 1,175문단 가운데 1,153번째(영문초록 앞)로 옮겨진다. ricc는 바탕틀 머리말이 없어 글자는 같지만 위치는 옮겨진다.
- **기대/실제**: 본문 문단은 글자와 위치가 그대로여야 한다(운영규정 1항). 실제로는 낱말이 지워지고 머리말이 들어간다. 엄격 대조는 표지 역할을 ‘표지 변경’으로 따로 세므로 이 변화를 실패로 잡지 못한다. 그래서 `papers.mjs`·`pdfrun.mjs`의 불일치 수치(0)에 나타나지 않았다.
- **수정안**(사본 검증: `node tests/audit_opus_fid4/patched/apply.mjs` 뒤 `falsehead_run_p.mjs all` 0/0/0, `kwlabel_p.mjs` 불량 0, `sonnet_p/roles_test.mjs` 259/264, `sonnet_p/rt_labels.mjs` 미인식 0/104, `rolediff_p.mjs`는 3차 대비 개선은 모두 남고 pdf-16 오인만 사라짐):
```js
// src/structure.js — 머리말 뒤는 (가) 닫는 기호 0~2개 + 구분 기호(쌍점·세로줄·〻) 또는 (나) 닫는 기호 1~3개 + 공백·줄 끝.
// 여는 괄호·여는 따옴표·쉼표·마침표는 머리말 꼬리가 아니다. 앞머리 기호에서 로마 숫자(장 번호)를 뺀다
keywords: /^(?:[^가-힣A-Za-z0-9\sⅠ-Ⅻ]{0,3}\s*(?:국문\s*|한글\s*)?(?:주\s*제\s*어|핵\s*심\s*어|키\s*워\s*드|색\s*인\s*어|주\s*요\s*어)\s*(?:[^가-힣A-Za-z0-9\s:：(（\[【〔「『<〈‘“,.;·、]{0,2}\s*[:：〻￨|]|[^가-힣A-Za-z0-9\s:：(（\[【〔「『<〈‘“’”'",.;·、]{1,3}(?=\s|$))|[\[【〔]\s*(?:주\s*제\s*어|핵\s*심\s*어|키\s*워\s*드|색\s*인\s*어|주\s*요\s*어)\s*[\]】〕])/,
keywordsEn: /^(?:[^가-힣A-Za-z0-9\sⅠ-Ⅻ]{0,3}\s*key[\s〻]*-?[\s〻]*words?\s*(?:[^가-힣A-Za-z0-9\s:：(（\[【〔「『<〈‘“,.;·、]{0,2}\s*[:：〻￨|]|[^가-힣A-Za-z0-9\s:：(（\[【〔「『<〈‘“’”'",.;·、]{1,3}(?=\s|$))|[\[【〔]\s*key\s*-?\s*words?\s*[\]】〕])/i,
// tocHead·abstractHead·abstractEnHead의 앞머리 /^[^가-힣A-Za-z0-9\s]{0,3}/ → /^[^가-힣A-Za-z0-9\sⅠ-Ⅻ]{0,3}/

// src/engine.js:200 — 원고 쪽 머리말이 구분 기호로 끝날 때만 바꾼다(정규식이 다시 넓어져도 본문 낱말을 지우지 않게)
const m = KW_LABEL.exec(cur); if (!m || m[1] === want || !/[:：|￨〻\]】〕)）❙」』]\s*$/.test(m[1])) return null;
```
  korliter(`󰠐주제어󰠐 …`)·anim(`주제어〻￨〻`)·`|주제어| …`·`Key words ￨ …`·`[주제어] …`·`(주제어: …)`는 계속 인식된다(rt_labels 104회 확인).

### N-2 (중간·체재) 투고일이 본문 앞·참고문헌 앞으로 가고, 앞에 본문 역할 줄이 있으면 목차가 본문 뒤로 간다
- **위치**: `src/structure.js:171`. 체재 밖 묶음의 자리를 ‘원고에서 처음 나온 순서(seq)상 바로 앞 체재 묶음’ 뒤로 정한다.
- **(a) 투고일(tail)**: 52곳 중 49곳은 `structure`에 tail이 없다. 원고 끝의 투고일은 원고상 바로 앞 묶음(대개 영문초록) 뒤에 붙는다. 그런데 영문초록이 끝이 아닌 학회에서는 위치가 이렇게 된다.
  - dongak·minmunhak(`…body>abstractEn>references`): 투고일이 영문초록과 참고문헌 **사이**에 온다.
  - aagcc·koreacontents(`front>abstractKo>abstractEn>body>references`): 투고일이 **본문 앞**(영문초록 바로 뒤)에 온다.
  - 3차 코드는 투고일을 맨 끝에 두었다(`node tests/audit_opus_fid4/seq_old.mjs tests/audit_opus_fid4/fixtures/s_tail.txt dongak,aagcc`). 따라서 이번 반영에서 생긴 회귀다.
  - 재현: `node tests/audit_opus_fid4/seq.mjs tests/audit_opus_fid4/fixtures/s_tail.txt all`. 4곳에서 `…abstractEn>tail>references`, `front>abstractKo>abstractEn>tail>body>references`가 나온다.
  - PDF 파싱본(`node tests/audit_opus_fid4/pdftail.mjs`, 2f8ad3f는 `pdftail_v.mjs`, 결과 같음): 투고일로 끝나는 원고는 7/40건이다. 이 가운데 투고일이 끝에 놓이지 않은 건수는 dongak 5, minmunhak 5, aagcc 6(모두 본문 앞), koreacontents 6(모두 본문 앞)이다. koli·ricc·litheory·gubo도 각 1건(pdf-38, 원고 순서상 투고일이 참고문헌 바로 뒤로 잡힌 경우)이다.
- **(b) 목차**: 목차보다 앞에 body 역할 줄이 하나라도 있으면 목차의 ‘앞 체재 묶음’이 body가 된다. 예를 들어 저자 뒤 전자우편 줄은 ‘앞부분 짧은 줄’로 body가 된다. 그러면 체재에 목차가 없는 학회에서 목차가 본문 전체 뒤에 놓인다.
  - 재현: `node tests/audit_opus_fid4/seq.mjs tests/audit_opus_fid4/fixtures/s_toc_email.txt all`. 13곳에서 `…body>toc>references…`가 된다(3차 코드에서는 맨 끝이었다).
  - PDF 파싱본: 목차가 끝인 산출은 ricc 5, aagcc·koreacontents 각 7, litheory 1건이다(`pdftail.mjs`). PDF의 앞머리 잔여 줄이 body로 잡힌 원고들이다.
- **수정안**(사본 검증: `seq_p.mjs` s_tail 52곳 모두 투고일 끝(anim은 체재대로 영문초록 앞), s_toc_email 목차 본문 뒤 0, `pdftail_p.mjs` 8곳 모두 0/0, 실원고 135건 결과 같음):
```js
// src/structure.js:171
const anchorOf = (g) => {
  if (g === 'tail') return '$';                                   // 투고·심사일은 언제나 끝
  const before = seq.slice(0, seq.indexOf(g)).filter((x) => order.includes(x));
  if (g === 'toc') return before.filter((x) => x !== 'body' && x !== 'references').at(-1) ?? '^';   // 목차는 앞부분(·초록) 뒤
  return before.at(-1) ?? '^';
};
for (const g of seq) if (!order.includes(g)) (after[anchorOf(g)] ||= []).push(g);
// 174행 루프 뒤
for (const g of after['$'] || []) for (const b of groups[g]) out.push(b);
```

### N-3 (중간·각주 강조·번호) 표 안 각주가 짝짓기를 밀어 그 뒤 모든 각주의 메타를 잃는다
- **위치**: `src/parse.js:120-121`(HEAD 123-124. `hwpxFootnoteMeta`는 구역 XML의 `<hp:footNote>`를 표 안 것까지 모두 모은다), `src/parse.js:88`(HEAD 91. 앱은 본문(list 0) 각주만 읽고, `fnCursor`부터 4개 안에서만 짝을 찾는다).
- **원인**: 표 안 각주가 4개를 넘으면 본문 각주는 창 안에서 짝을 못 찾는다. 커서가 앞으로 가지 않으므로 그 뒤 각주도 전부 짝을 못 찾는다. 짝이 없으면 각주는 3차 이전 방식(앞 공백 판정, 강조 없음, 새 번호 없음)으로 돌아간다.
- **재현**: 가상 원고 생성 `node tests/audit_opus_fid4/fixtures/make4.mjs`. k4_tblfn은 1칸 표 안 각주 6개 뒤에 본문 각주 7개가 있다(기울임·굵게, 번호 없음, 새 번호 1, 둘째 문단 번호, 줄바꿈). k4_notbl은 같은 원고에서 표만 뺀 것이다.
  - `node tests/audit_opus_fid4/fnparse.mjs tests/audit_opus_fid4/fixtures/k4_notbl.hwp tests/audit_opus_fid4/fixtures/k4_tblfn.hwp`: 표가 없으면 강조 런 5개, restart 1, numAt 1이 모두 읽힌다. 표가 있으면 강조 0개, restart 없음, 둘째 문단 번호 각주가 noNumber로 읽힌다.
  - `node tests/audit_opus_fid4/fncmp.mjs tests/audit_opus_fid4/fixtures/k4_tblfn.hwp,tests/audit_opus_fid4/fixtures/k4_tblfn.hwpx koli,ricc,mkliterature --keep`: 각주 강조 글자 28자 유실, newNum 1 → 0, 번호 문단 불일치 1, 글 불일치 1(번호 자리 공백 1자가 남음). 표시 번호 불일치는 7개 중 5개(번호 없는 각주도 세는 모형 A) 또는 2개(세지 않는 모형 B)다.
- **실원고**: 작가 원고 5편에는 표 안 각주가 0개라 영향이 없다(`node tests/audit_opus_fid4/tblfn_count.mjs tests/원고/paper*.hwp`). 표 주석을 각주로 다는 원고에서 일어난다.
- **수정안**(사본 검증: k4_tblfn hwp·hwpx 모든 항목 0):
```js
// src/parse.js hwpxFootnoteMeta — 구역마다
const sec = await zip.file(name).async('string');
const tbl = []; { const st = []; for (const t of sec.matchAll(/<(\/?)hp:tbl\b/g)) { if (!t[1]) st.push(t.index); else { const a = st.pop(); if (!st.length && a !== undefined) tbl.push([a, t.index]); } } }
const inTbl = (i) => tbl.some(([a, b]) => i > a && i < b);   // 앱은 본문 각주만 읽으므로 표 안 각주는 짝짓기에서 뺀다
for (const m of sec.matchAll(/…기존 정규식…/g)) { if (inTbl(m.index)) continue; … }
// src/parse.js:88 — 창을 넓혀 한 번 어긋나도 다시 잡게
for (let q = fnCursor; q < Math.min(fnCursor + 64, fnMeta.length); q++) …
```
  글상자(`gso`) 안 각주도 같은 방식으로 빼는 것이 안전하다(가상 원고로는 확인 못 함).

### N-4 (낮음~중간·각주 번호) 번호 없는 각주 바로 앞의 ‘새 번호 지정’이 버려진다
- **위치**: `src/engine.js:352` `if (!f.noNumber && Number.isInteger(f.restart) …)`. 파서는 newNum을 바로 뒤 각주에 붙인다. 그 각주가 번호 없는 각주(사사)면 엔진이 새 번호를 쓰지 않는다.
- **재현**: `node tests/audit_opus_fid4/fncmp.mjs tests/audit_opus_fid4/fixtures/k4_nnnum.hwpx koli --keep`. 원고는 각주 1, 새 번호 1, 사사 각주, 번호 각주 순서다. 산출 newNum 1 → 0, 표시 번호 불일치 5/7(두 모형 모두).
- **수정안**(사본 검증: 0/0): `if (Number.isInteger(f.restart) && f.restart > 0) { fnNum = f.restart - 1; prefix = …newNum… }`. noNumber 조건을 뺀다.

### N-5 (낮음·각주 번호, 한컴오피스 확인 못 함) DOCX 사용자 지정 표시 각주 뒤의 번호
- **위치**: `src/parse.js:240`(HEAD 244). 표시 각주는 noNumber가 되지만, 다음 번호 각주에 새 번호를 넣지 않는다.
- **근거**: paper2 원본은 사사 각주(번호 없음) 바로 뒤에 ‘새 번호 지정(1)’을 두었다. 한글은 번호 없는 각주도 번호를 센다는 뜻으로 읽힌다(모형 A). 이 모형에서는 `node tests/audit_opus_fid4/docxnum.mjs tests/audit_opus_fid/fixtures/k_kitchen.docx`의 Word 번호 `*,1,2,…,10`이 산출에서 `*,2,3,…,11`이 된다(10/10 불일치). 모형 B에서는 일치한다. rhwp 렌더 트리의 번호 표시는 원고에서도 맞지 않아 판단 근거로 쓸 수 없었다.
- **수정안**(사본 검증: 두 모형 모두 0): DOCX 파서가 Word 번호를 세다가, 표시 각주 바로 뒤 첫 번호 각주에 `restart: wordNum`을 붙인다. 모형 B에서는 결과가 바뀌지 않고, 모형 A에서는 맞게 된다.
```js
let wordNum = 0, afterMark = false;   // parseDocx, tables 선언 옆
// readPara 콜백, fns.push 직전
let restart = 0; if (tk.fn !== undefined) { if (tk.customMark) afterMark = true; else { wordNum++; if (afterMark) { restart = wordNum; afterMark = false; } } }
fns.push({ offset, paras: src, text: …, ...(tk.customMark ? { noNumber: true } : {}), ...(restart ? { restart } : {}) });
```

---

## 3. 그 밖의 관찰

1. **daejung 주제어 줄 전체가 굵게**(기존 결함, 낮음): 3차 코드로도 paper1 국문 51/51자·영문 101/101자, paper5 46/46·132/132자가 굵게 나온다(`node tests/audit_opus_fid4/old/full/kwbold.mjs`). 바탕틀 예시 첫 글자 모양(굵은 머리말)이 줄 전체에 쓰이기 때문이다. 3차에는 표지 치환으로 글자가 달라져 엄격 대조가 강조를 비교하지 않았다. 이번에 치환이 빠지면서 드러났다(실원고 4건, 가상 원고 10건). 머리말만 굵게 하려면 엔진이 머리말 런과 값 런을 나눠야 한다. 학회 규정은 확인 못 했다.
2. **표지 치환 뒤 좌표**: 공통 꼬리 기준 이동은 정확했다. 주제어 끝 각주 104/104, 주제어 안 기울임 104/104(`kwlabel.mjs`), k_kitchen 52곳 표지 각주 위치·강조 불일치 0(`labels.mjs`). 머리말 안에 있는 각주(‘주제어[^1]:’)는 새 머리말의 같은 글자 수 자리에 놓인다. 드문 경우라 따로 결함으로 세지 않았다.
3. **각주 쪽수 치환과 각주 런**: 기울임 런 안·런 경계·둘째 각주 문단·문단 안 줄바꿈의 쪽수 표기를 바꿔도 강조 범위와 문단 배열이 유지됐다(`node tests/audit_opus_fid4/substfn.mjs`, 5곳 × 인용 모드 2).
4. **TXT 규칙**:
   - 별표 강조는 낱말 경계에서만 읽는다. `『*…*』`, `*…*!`, `***…***`는 강조가 되지 않지만 별표는 글자로 남는다.
   - 각주 정의 아래 4칸 들여쓰기는 같은 각주의 다음 문단이 된다. 그러나 표준 마크다운의 ‘빈 줄 뒤 들여쓰기’는 본문 문단(앞 공백 4칸 포함)이 된다.
   - 각주 정의를 본문 가운데 두면, 바로 아래 들여 쓴 본문 줄(인용 등)이 각주로 흡수된다(`txtedge.mjs`). 도움말에 ‘빈 줄 없이’를 적거나, 빈 줄 하나 뒤의 들여쓰기 줄도 이어 받기를 권한다.
5. **PDF 파싱본 초록 과대 배정**(기존 성격): 새 머리말 ‘논문요약’류가 인식되면서 pdf-01·02는 초록 상태가 장 번호 줄이 나올 때까지 이어진다. 그래서 줄 단위 문단 212개가 abstract가 된다(`rolediff.mjs`). 3차 F-9의 pdf-10·11과 같은 종료 조건 문제다. 글자는 보존된다.
6. **정오(3차 Sonnet 관찰과 같음)**: paper2 fcs·iall의 저자 문단 4자는 HWP에서는 굵고, 내보낸 XML에서는 굵지 않다(`out-emph-xml-vs-hwp`). 원인은 확인 못 했다.

---

## 4. 실행한 명령과 수치

모든 임시 파일은 `tests/audit_opus_fid4/` 아래에 있다. 3차 스크립트 사본은 `r3/`·`sonnet/`(2f8ad3f용 `sonnet_v2f8/`, 수정안용 `sonnet_p/`), 새 가상 원고는 `fixtures/`, 3차 코드(0278044) 사본은 `old/`, 2f8ad3f 사본은 `v2f8/`, 수정안 사본은 `patched/`(`apply.mjs`), 로그는 `logs/`다. `papers.log`·`fixtures27.log`·`fixtures52.log`·`pdfrun.log`·`indep.log`·`fncmp_*`는 2f8ad3f가 main이던 시각에 돌렸다. `src/` 등 금지 경로는 수정하지 않았다. `tools/verify_matrix.mjs`는 고정 경로(`tests/out/`)에 써서 실행하지 않았다(조치표상 도구 보강은 보류).

| 명령 | 건수 | 결과 |
|---|---|---|
| `node tests/audit_opus_fid4/r3/papers.mjs` | 5편 × 27곳 = 135 | 엄격 대조 통과 127 / 실패 8(daejung 주제어 굵게 4, litheory 국문초록 제목 기울임 4). 본문 불일치 0, 각주 4,833/4,833 일치, 원고 문단 유실 0 (3차 130/5) |
| `node tests/audit_opus_fid4/fncmp.mjs tests/원고/paper{1..5}.hwp koli,daejung,dongak,iall,kopoetics,litheory,anim,ricc,ktla,sanghur,femcrit,mkliterature,novel --keep` | 65 | 각주 문단 수·줄바꿈·번호 문단·표시 번호(두 모형)·강조·글 불일치 0. 인용 모드 ‘학회’에서 글 차이는 쪽수 단위 치환뿐(`fndiff4.mjs`로 확인) |
| `node tests/audit_opus_fid4/r3/indep.mjs <paper 산출 135개>` | 135 | 독립 HWP5 판독: 레코드 오류 0, 본문·각주 글자 불일치 0 |
| `node tests/audit_opus_fid4/indep_fn.mjs …`, `python -X utf8 tests/audit_opus_fid4/nwno.py …` | 135 | 독립 판독 각주 문단 수·문자 10 줄바꿈·atno 문단 불일치 0. 각주 nwno: paper1 27/27·paper2 27/27 보존(쪽 번호 nwno는 학회 양식이 정하므로 버림) |
| `node tests/audit_opus_fid4/r3/fixtures_run.mjs` | 가상 11종 × 27 = 297 | 통과 272 / 실패 25(daejung 주제어 굵게 10, litheory 기울임 + 의도된 체재 10, 체재에 목차 없는 학회의 원래 자리 목차 5) (3차 187/110) |
| `node tests/audit_opus_fid4/r3/fixtures_run.mjs k_kitchen.hwp,k_kitchen.hwpx,k_kitchen.docx,s_toc.txt,s_notoc.txt all` | 5 × 52 = 260 | 통과 234 / 실패 26(같은 원인 + fcs titleEn2 바탕틀 기울임 4). 목차가 끝 0(3차 30), 각주 강조 유실 0 |
| `node tests/audit_opus_fid4/r3/pdfrun.mjs`, `pdforder.mjs` | PDF 40 × 6 = 240 | 변환 실패 0, 엄격 대조 불일치 0, 머리말 제외 90문단(3차와 같음), 참고문헌 제목 없음 16(3차 20), koli 순서열 목차 끝 5(3차 39) |
| `node tests/audit_opus_fid4/pdftail.mjs`(`_v` 같음) | 40 × 8곳 | 투고일 오배치 dongak·minmunhak 각 5, aagcc·koreacontents 각 6, koli·ricc·litheory·gubo 각 1, 목차 끝 ricc 5·aagcc 7·koreacontents 7·litheory 1(N-2). 사본 0 |
| `node tests/audit_opus_fid4/rolediff.mjs koli` | 실원고 5 + PDF 40 | 3차 대비 역할 변화: 실원고 0, PDF는 대부분 개선, 본문→keywordsEn 오인 1(pdf-16, N-1) |
| `node tests/audit_opus_fid4/falsehead_run.mjs all` | 가상 1 × 52곳 × 9줄 | 글자 바뀜 77, 장 제목 소실 34, 참고문헌 뒤로 이동 111(N-1). 사본 0/0/0 |
| `node tests/audit_opus_fid4/kwlabel.mjs` | 52곳 × 2줄 | 불량 0 |
| `node tests/audit_opus_fid4/fncmp.mjs …/k4_*.hwp(x) …`, `fnparse.mjs`, `docxnum.mjs` | 가상 4종 + DOCX 2 | N-3·N-4·N-5 수치(위). 사본 모두 0 |
| `node tests/audit_opus_fid4/r3/bigfix.mjs 1000·3000`, `t8b.mjs` | 3곳 × 2 + 2 | U+FFFD 0 |
| `cd tests/audit_opus_fid4/sonnet_v2f8 && for n in 1 2 3 4 5; do node run_files.mjs ../../원고/paper$n.hwp all; done`(2f8ad3f, HEAD용 `sonnet/`도 같음) | 5 × 52 = 260 | OK 254, structure-order 4(litheory 국문초록, 의도), out-emph-xml-vs-hwp 2(정오) |
| `node roles_test.mjs koli`, `node rt_labels.mjs`, `node star_test.mjs`, `node labels_out.mjs 1`, `node run_synth.mjs fnstress txt,docx,hwpx koli -v`, `node wild_docx.mjs` | — | 259/264, 미인식 0/104, 별표 보존, 머리말 정상, 각주 14/14, DOCX 잔여(F-08) |
| `node tests/audit_opus_fid4/patched/papers.mjs` ↔ `logs/papers_head.log` | 135 | 수정안 사본(3b49ac1 기반)과 HEAD의 결과가 줄 단위로 같음(시간 칸 제외). 2f8ad3f 결과(`papers.log`)와도 통과·실패가 같음 |

### 확인 못 한 것
- 한컴오피스에서의 각주 번호 표시를 확인하지 못했다. 번호 없는 각주를 번호 세기에 넣는지, 새 번호 지정의 효과가 어떤지 모른다. N-4·N-5는 두 표시 모형을 나눠 보고했다. rhwp 렌더 트리의 각주 영역 번호는 원고에서도 원래 번호와 맞지 않아 쓰지 않았다.
- 글상자 안 각주, 덧말·글자 겹치기 컨트롤이 든 각주의 메타 짝짓기는 가상 원고를 만들지 못해 확인 못 했다.
- 브라우저 실행(`dist/dev.html`)은 하지 않았다. 결론은 Node에서 같은 모듈로 낸 것이다.
- daejung 주제어 줄의 굵기와 litheory 국문초록 제목 기울임이 학회 규정에 맞는지는 확인 못 했다.
