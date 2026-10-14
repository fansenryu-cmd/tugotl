점수: 93/100

# 5차 재감사 A. 산출물 충실도 — sonnet_fid5 (2026-10-13 밤, main 234555a)

이 보고서에는 원고의 제목·저자·본문·각주 문장을 쓰지 않았습니다. 작가 원고는 paper1~5, 파싱본은 pdf-NN(`tests/원고_pdf/*.txt`를 이름순으로 센 번호), 그 밖의 재현은 제가 만든 가상 줄만 인용합니다. 작업은 모두 `tests/audit_sonnet_fid5/` 아래에서 했고, `src/`·`dist/`·`release/`·`templates/`·`forms/`·`README.md`는 고치지 않았습니다(한 가지 실수는 §8에 적었습니다).

## 1. 판정

- **보존은 4차와 똑같이 완결입니다.** 작가 원고 5편 × 52곳(260회)을 저장한 HWP 260개를 rhwp 없이 읽는 독립 HWP5 판독기(4차 sonnet이 쓴 `hwp5_indep4.py`, olefile+zlib)로 다시 읽어 원고와 엄격 대조했습니다. 구조 오류 0, 비어 있지 않은 원고 문단 31,200개 중 산출에서 사라진 것 0(표지 문구 311·주제어 머리말 116·쪽 표기 치환 504는 의도된 변경), 각주 9,308개의 글자(앞 공백까지)·문단 수·줄바꿈·번호 유무·번호 문단·문단 안 위치 불일치 0, 새 번호 컨트롤 104/104, 본문 강조 4,940자 유실 0, 빈 줄 7,690/7,690 정확, U+FFFD 0. 4차 수치와 한 글자도 다르지 않습니다.
- **4차 두 보고서의 새 결함은 모두 해소됐습니다.** Sonnet N-9(`***` 소실) 14자 → 0, N-3(강조 뒤 각주 표지·문장부호) 16줄 모두 서식으로, N-4(서지 변환 각주 무효) 해소, N-1b(초록 머리 오인) 13/13줄 본문, N-7(재배열 안내문) 해소, N-8(강조 안 각주) 해소. Opus N-1~N-5도 재현 명령 결과가 4차 보고서의 "해소" 수치와 같습니다(§3).
- **그러나 이번 반영 과정에서 새로 생긴 결함이 있습니다.** 가장 큰 것은 ① N-4 수정으로 서지 변환이 각주에 실제로 반영되기 시작하자 **변환된 각주의 앞 공백(번호와 글 사이 한 칸)이 지워진다**는 점(APA·Chicago 선택 시 작가 원고 각주 179개 중 56개), ② N-6 수정으로 TXT 각주 이어짐이 "문서 끝 묶음"에 묶이면서 **정당한 이어짐이 본문 문단으로 새는 것**(경고 없음)과 원래 N-6 재현이 문서 끝에서는 그대로 남는 것, ③ 목차 배치 규칙이 **korlit·eomun에서 목차를 참고문헌 뒤로 보내는 것**(PDF 파싱본 5건 × 2곳)입니다. 별표 쪽에는 **별표 자체가 기호인 `(*)`·`[*]`·`“*”`가 강조로 읽혀 두 별표가 사라지는** 결함이 남았습니다(이번 경계 확장 범위, 일부는 이전부터).
- 수정안은 `tests/audit_sonnet_fid5/patched/`의 src 사본에 적용해 검증했습니다. 작가 원고 5편 × 52곳 HWPX 바이트가 사본과 현재 판이 260/260 동일하고, PDF 파싱본·작가 원고·가상 원고 87개 × 52곳의 블록 대조에서 다른 것은 의도한 변화(목차 위치 10회, 각주 정의 안 굵게 1개 파일)뿐입니다.

## 2. 95점에 이르기 위해 고쳐야 할 것 (우선순위)

| 순위 | 항목 | 현재 영향 | 크기 |
|---|---|---|---|
| 1 | F5-1 `cite.js:102` 서지 변환이 앞뒤 공백을 지움 | APA·Chicago 선택 시 변환된 각주의 번호와 글이 붙음(작가 원고 56/179개) | 소(1줄, 검증함) |
| 2 | F5-2 `parse.js:323-327` TXT 각주 이어짐 판정 | 정의가 참고문헌 앞이면 각주 2째 문단이 본문으로 샘, 본문을 들여 쓴 원고는 끝의 본문이 각주로 감 — 둘 다 경고 없음 | 소(블록 교체, 검증함) |
| 3 | F5-3 `structure.js:174` 목차 앵커 | korlit·eomun에서 목차가 참고문헌 뒤(PDF 5건 × 2곳) | 소(1줄, 검증함) |
| 4 | F5-4 `parse.js:336-338` 기호 자체인 별표 쌍 | `(*)`·`[*]`·`“*”`·`‘*’`의 별표 두 개가 사라지고 사이 글이 기울어짐 | 소(정규식 2곳, 검증함) |
| 5 | F5-6·F5-7 TXT/MD 각주: 정의 안 `*강조*`, 고아 정의·표지 경고 | 각주 정의의 별표가 글자로 남음, 본문에 표지 없는 정의는 말없이 사라지고 경고는 엉뚱한 문구 | 소 |
| 6 | 4차에서 이어진 보류: DOCX 스타일 굵게·자동 번호·텍스트 상자, 표·그림 자리 표시, `verify_matrix` 사각지대 | 이번에도 그대로(§3.3) | 중 |

1~3을 고치면 새 결함이 정리되어 95점에 닿는다고 봅니다. 4~5까지 하면 96~97점, 6은 별도 차수입니다.

## 3. 4차 발견 재판정

재현은 4차 스크립트를 `tests/audit_sonnet_fid5/`에 복사해(상대 경로 `../../src`가 같으므로) 그대로 돌렸습니다. Opus 스크립트는 저장소 루트에서 원위치로 돌렸습니다.

### 3.1 Sonnet 4차 (sonnet_fid4, 91점)

| 발견 | 판정 | 재현·수치 |
|---|---|---|
| N-9 `***` → `*` | **해소** | `node tests/audit_sonnet_fid5/txt_md.mjs`: charsLost 14 → **0**(filesChanged 3 → 0). pdf-21·23·40 복구. PDF 280회 하네스 OK 134 → **154**(`parse-text` 20 → 0) |
| N-3 강조 뒤 각주 표지·문장부호 | **해소**(잔여는 F5-4·F5-5) | `star2.mjs` 20줄 중 16줄이 서식으로, 나머지 4줄은 의도(낱말 안·저자 별표). `*Titulus*[^1]`→기울임+각주 offset 정확. 52곳 `star.txt`(강조 안 각주 포함) 독립 판독: 기울임·굵게 범위와 각주 위치 **52/52, 불일치 0** |
| N-4 서지 변환 `paras` | **해소**, 그러나 **새 결함 F5-1** | `cite_stale.mjs`: `f.paras`와 산출 각주가 변환된 글로 나옴. 같은 수정이 앞 공백을 지움 |
| N-1 주제어 정규식 | 해소(1줄 의도적 잔여) | `label_fp.mjs` 17줄 중 FAIL 1(`Keywords — …`, 전각 대시를 구분 기호로 받는 설계), `pdf16.mjs` 3곳 모두 본문 |
| N-1b 초록·요약·개요 머리 오인 | **해소** | `label_fp2.mjs` 13줄 모두 본문·제목(4차 5줄 남음 → 0) |
| N-2 주제어 구분 기호 잔여 | 안전(그대로) | `kw_forms.mjs`: 구분 기호로 끝나지 않는 머리말은 치환하지 않음 |
| N-5 표 안 각주 | **해소 유지** | `tblfn.mjs`로 표 안 각주 0·3·5·8·70개: 본문 각주 39/39 런, 새 번호 1/1. `k4_tblfn`·`k4_nnnum`·`k4_notbl`·`k4_hyph` × koli·dongak·ricc 18회 OK |
| N-6 TXT 들여 쓴 본문이 각주에 흡수 | **부분 해소**, 새 결함 **F5-2** | 본문 가운데 들여 쓴 줄은 본문으로 돌아옴. 원래 재현(문서 끝)은 그대로, 정의가 참고문헌 앞이면 정당한 이어짐이 본문으로 샘 |
| N-7 재배열 안내문 | **해소** | `withtoc.txt`×ricc, `kitchen.txt`×litheory, `withtoc.txt`×litheory 모두 안내 없음(`reorder_notes.mjs`) |
| N-8 강조 안 각주 | **해소** | `*Titulus[^1]*`, `**굵게[^2]**`, `*a[^1]b[^2]c*` 각주 offset·런 정확 |
| 조용히 버리는 서식 경고 (Opus F-11.1) | **부분 해소** | HWP·HWPX: `x_marks.hwpx`에서 "8자" 경고(작가 원고 5편·바탕틀 모두 오경고 0). **DOCX는 경고 없음**, **각주 안 장식은 세지 않음**(F5-8) |
| DOCX 스타일 굵게·자동 번호·텍스트 상자·루비, 표·그림 자리 표시 | **그대로**(보류 선언) | 이번에 다시 시험하지 않았고 코드 변경도 없음 |
| 검증 도구 사각지대 | **그대로**(보류 선언) | `verify_matrix` 52/52 통과 상태에서 F5-1~F5-4를 모두 못 봅니다 |

### 3.2 Opus 4차 (opus_fid4, 88점)

| 발견 | 판정 | 재현·수치 |
|---|---|---|
| N-1 본문 줄이 표지로 오인 | **해소** | `node tests/audit_opus_fid4/falsehead_run.mjs all`: 검사 468회, 글자 바뀜 0, 표지로 바뀌어 원문 줄 없음 0, 참고문헌 뒤로 이동 0 |
| N-2 투고일·목차 배치 | **해소**, 예외 1(F5-3) | `pdftail.mjs`: 8곳 모두 투고일 끝 7/40 → 끝 아님 0, 목차가 끝 0. 단 korlit·eomun은 "목차가 끝 1"(pdf-05) |
| N-3 표 안 각주 | **해소** | N-5(Sonnet)와 같음 |
| N-4 새 번호 보존 | **해소** | `fncmp.mjs k4_nnnum`: newNum 1/1, 원번호 `1,*,2,3` = 산출 |
| N-5 DOCX 표시 각주 뒤 번호 | **해소** | `docxnum.mjs k_kitchen.docx`: Word·산출A·산출B 모두 `*,1,…,10`, newNum 1, 불일치 0. 가상 DOCX(표시 각주 셋이 섞인 `1,*,2,*,*,3`)는 독립 판독으로 `1,None,NW2,2,None,None,NW3,3`(`docx_custom.mjs`) |
| F-8 잔여(litheory 국문초록 제목 기울임) | 그대로 | `spur.mjs`: litheory 기울임 28자(데이터 쪽, 학회 규정 확인 필요) |

### 3.3 3차에서 이어진 약점 (이번에 바뀌지 않음)
- PDF 파싱본 pdf-10·11(장 번호 줄 없음)은 본문의 99%가 `abstract`, pdf-01·02·08·09·31 표지 부분(학위논문 꼴), pdf-21·40의 `국문 …<…>` 꼴 머리 등. 역할 변화는 4차 판(b7d5603)과 대조해 405(파일 45 × 곳 9)회 중 **0건**(`role_diff5.mjs`).

## 4. 새로 생긴 결함 (F5-)

### F5-1 [중] 서지 변환이 각주 앞 공백을 지움 — 이번 반영(N-4 수정)으로 드러남
- 위치: `src/cite.js:102-104`. `conv`가 각 조각을 `fmt(c)`로 통째로 바꾸므로 `part`의 앞뒤 공백이 사라집니다. 각주 글은 번호 뒤 한 칸(" 홍길동…")으로 시작하므로 변환된 각주는 "1)홍길동"처럼 번호와 글이 붙습니다. 4차까지는 `paras`를 고치지 않아 효과 자체가 없었고, 234555a가 `paras`를 맞추자 드러났습니다.
- 재현(가상 TXT): `node tests/audit_sonnet_fid5/cite_space.mjs`의 첫 줄 `TXT  전 " 홍길동, 「가" 후 "홍길동 (202"`.
- 작가 원고 5편(HWP) 실측: `node tests/audit_sonnet_fid5/cite_e2e.mjs c && python -X utf8 tests/audit_sonnet_fid5/read4.py`(koli·dongak, APA·Chicago로 변환·저장한 HWP를 독립 판독)

| 원고 | 각주 | 앞 공백이 있던 각주 | 변환된 각주 | 산출에서 공백이 사라진 각주 |
|---|---|---|---|---|
| paper1 | 61 | 61 | 9 | 9 |
| paper2 | 39 | 37 | 14 | 14 |
| paper3 | 35 | 34 | 9 | 9 |
| paper4 | 17 | 17 | 10 | 10 |
| paper5 | 27 | 27 | 16 | 14 |
| 합 | 179 | 176 | 58 | 56 |

  APA와 Chicago가 같습니다. 서지 표기를 "학회 양식"(기본값)으로 두면 변환 자체가 일어나지 않아 영향이 없습니다.
- 기대: 변환된 각주도 앞 공백 유지(공백이 사라진 각주 0). 실제: 56.
- 수정안(사본에서 56 → 0 확인, 참고문헌 `ref`도 같은 `conv`를 쓰므로 앞뒤 공백을 보존):
```js
// cite.js:102-104
const out = fmt(c); converted++;
if (samples.length < 6 && out !== part.trim()) samples.push({ where, before: part.trim(), after: out });
return part.match(/^\s*/)[0] + out + part.match(/\s*$/)[0];   // 앞뒤 공백은 원고의 일부(각주 번호 뒤 한 칸)
```

### F5-2 [중~낮음] TXT 각주 이어짐: 정당한 이어짐이 본문으로 새고, 원래 N-6 재현은 그대로
- 위치: `src/parse.js:323-327`(`tailStart`·`lastFn`). 234555a는 이어짐을 "문서 끝의 정의 묶음 안"에만 인정합니다.
- 재현: `node tests/audit_sonnet_fid5/txt_fn.mjs` 의 T2b와 R1.
  - **R1(새 회귀)** 표준 마크다운: 정의 아래 빈 줄 없이 4칸 들여 쓴 이어짐을 두고 그 뒤에 `참고문헌`이 오는 원고(`1. 서론` / `본문.[^1]` / 빈 줄 / `[^1]: 각주 1.` / `    이어짐 문단.` / 빈 줄 / `참고문헌` / …). 4차(b7d5603)는 이어짐이 각주 2째 문단이 되었는데, 지금은 **`    이어짐 문단.`이 본문 문단**이 되고 경고가 없습니다(문단 수 8, 각주 문단 1).
  - **T2b(원래 N-6, 그대로)** `서론` / `    첫 문단.[^1]` / `[^1]: 각주.` / `    둘째 본문.` / `    셋째 본문.` — 본문을 들여 쓴 원고에서 정의 뒤의 본문 2문단이 각주 문단 둘로 흡수됩니다(탭도 같음, 경고 없음).
- README(`README.md:157`)는 "정의 아래 네 칸 들여 쓴 줄은 같은 각주의 다음 문단"이라고만 쓰고 "파일 끝에 모아 쓸 때만"이라는 조건이 없습니다.
- 기대: 표준 이어짐은 어디서든 각주 문단, 본문도 들여 쓴 원고(모호한 경우)는 끝 묶음에서만 이어짐으로 읽고 사용자에게 알림. 실제: 위와 같음.
- 수정안(`tests/audit_sonnet_fid5/patched/apply3.mjs`, 사본에서 R1 → 각주 문단 2, N-6 mid-doc → 본문 유지, T2b → 경고):
```js
// parse.js:325-327 을 교체
const contIdx = new Set(); { let on = false; for (let i = 0; i < rawLines.length; i++) { const ln = rawLines[i]; if (isDef(ln)) on = true; else if (on && isCont(ln)) contIdx.add(i); else if (ln.trim() !== '') on = false; } }   // 정의 뒤(빈 줄 허용)의 들여 쓴 줄 = 이어짐 후보
const bodyIndented = rawLines.some((ln, i) => !isDef(ln) && isCont(ln) && !contIdx.has(i)); let contLines = 0;   // 이어짐이 아닌 들여 쓴 줄이 있으면 본문도 들여 쓴 원고
let lastFn = null;
const lines = rawLines.filter((ln, i) => { const m = isDef(ln); if (m) { fnDefs[m[1]] = m[2]; lastFn = m[1]; return false; } if (lastFn !== null && contIdx.has(i) && (!bodyIndented || i >= tailStart)) { fnDefs[lastFn] += '\n' + isCont(ln)[1]; contLines++; return false; } if (ln.trim() === '') return true; lastFn = null; return true; });
// 반환 직전: if (contLines && bodyIndented) warnings.push(`각주 정의 아래 들여 쓴 ${contLines}줄을 같은 각주의 다음 문단으로 읽었습니다(정의는 파일 끝에 모아 쓰고, 본문 문단은 들여 쓰지 마세요).`);
```

### F5-3 [중~낮음] 체재에 목차가 없는 학회 중 초록을 참고문헌 뒤에 두는 곳(korlit·eomun)에서 목차가 참고문헌 뒤로 감
- 위치: `src/structure.js:174`(`anchorOf('toc')`). 목차의 앵커를 "본문·참고문헌이 아닌 체재 묶음 중 원고에서 마지막"으로 잡는데, korlit·eomun은 `structure: [front, body, references, abstractKo, abstractEn]`이라 `abstractKo`가 앵커가 되면 목차가 본문·참고문헌 **뒤**에 놓입니다.
- 재현(저장소 루트에서): `node tests/audit_opus_fid4/pdftail.mjs korlit,eomun` → "목차가 끝 1"씩. 전수: `node tests/audit_sonnet_fid5/pdf_place.mjs` — PDF 파싱본 × 52곳 + 작가 원고 + 가상 원고 2,548회 중 `tocAfterBodyOrRef` **10**(pdf-01·02·05·24·25 × korlit·eomun, 예: `front>body>references>abstractKo>toc>abstractEn`). 4차 Sonnet이 "49/52(나머지 3곳은 체재가 초록 뒤)"로 넘긴 곳입니다.
- 기대: 목차는 이 학회가 본문 앞에 두는 묶음 뒤. 실제: 위와 같음.
- 수정안(사본: 10 → 0, 나머지 2,070회 HWPX 바이트 동일):
```js
// structure.js:174
if (g === 'toc') { const bi = order.indexOf('body'); return before.filter((x) => x !== 'body' && x !== 'references' && (bi < 0 || order.indexOf(x) < bi)).at(-1) ?? '^'; }
```

### F5-4 [낮음] 별표 자체가 기호인 쌍이 강조로 읽혀 두 별표가 사라짐 (N-9와 같은 종류의 글자 소실)
- 위치: `src/parse.js:336-338`(`OPEN`·`CLOSE`·`tok`). 안쪽 첫 글자가 닫는 기호여도, 끝 글자가 여는 기호여도 통과합니다.
- 재현: `node tests/audit_sonnet_fid5/star_sym.mjs`(가상 줄)

| 줄 | 4차(b7d5603) | 현재 | 기대 |
|---|---|---|---|
| `(*) 교신저자, (*) 공동저자` | 별표 소거, 사이가 기울임 | 같음 | 별표 보존 |
| `“*” 표시는 …, “*” 도 있다` | 소거 | 같음 | 보존 |
| `‘*’ 와 ‘*’`, `기호(*)와 기호(*)는` | 소거 | 같음 | 보존 |
| `표시 [*] 와 [*] 구분` | 보존 | **소거**(이번 `\[`·`\]` 확장으로 새로 생김) | 보존 |

  PDF 파싱본 40건에는 해당 줄이 없어 charsLost는 0입니다. 저자·소속 표시를 따로 설명하는 MD/TXT 원고에서 생길 수 있습니다.
- 수정안(`apply2.mjs`, 사본에서 위 줄 전부 보존, `star2`·`txt_md`·52곳 `star.txt` 결과 동일): 안쪽 첫 글자는 닫는 기호가 아니어야 하고 끝 글자는 여는 기호가 아니어야 합니다.
```js
// 두 정규식 모두: 여는 별표 뒤 lookahead와 안쪽 끝 글자를 조인다
(?=[^*\s,;.:)\]”’》〉」』）］】〕＞!?])([^*\s](?:[^*]*?[^*\s(\[“‘《〈「『（［【〔＜])?)    // **굵게**
(?=[^*\s,;.:)\]”’》〉」』）］】〕＞!?])([^*\s](?:[^*\n]*?[^*\s(\[“‘《〈「『（［【〔＜])?)    // *기울임*
```

### F5-5 [낮음] 별표 경계에 전각 문장부호·말줄임표·전각 괄호가 없음
- 위치: `parse.js:336-337`. `*A*…`, `*A*。`, `*A*，`, `*A*）`, `*A*～`, `（*A*）`, `＜*A*＞`, `*A*、*B*`에서 별표가 글자로 남습니다(글자는 보존, 서식만 안 됨). 한국어 TXT에서 `…`은 흔합니다. 재현: `node tests/audit_sonnet_fid5/txt_battery.mjs`의 DIFF 줄.
- 수정안(`apply.mjs` 3a, 사본에서 7줄 모두 서식으로): `OPEN`에 `（［【〔＜`, `CLOSE`에 `…。，、；：！？）］】〕＞～`를 더합니다.

### F5-6 [낮음] MD 각주 정의 안의 `*기울임*`·`**굵게**`가 별표 글자로 남음
- 위치: `parse.js:340`(`addFn`이 `runs: []`). 본문은 서식으로 바뀌는데 `[^1]: 홍길동, *서명*, 2020.`의 별표는 그대로 각주 글자가 됩니다. 재현: `txt_fn.mjs`의 T0 → 각주 `paras`의 `runs` 0개, 글에 별표 남음.
- 수정안(`apply.mjs` 3b, 사본: 각주 런 5개, 별표 사라짐): 정의 문단마다 같은 `OPEN`/`CLOSE` 규칙으로 `mdInline`을 돌려 `runs`를 만듭니다.

### F5-7 [낮음, 이전부터] TXT/MD 고아 정의와 정의 없는 표지: 말없이 사라지거나 엉뚱한 경고
- 재현: `node tests/audit_sonnet_fid5/txt_orphan.mjs`. ① 본문에 표지가 없는 `[^1]: …` 정의 2개 → 각주 0개, 글이 산출에서 사라지고 경고는 "텍스트 파일은 각주 정보가 없습니다…"(실제로는 정의가 있음). ② 정의 없는 표지 `[^1]`·`[^2]` → 빈 각주 2개, 경고 없음. ③ 같은 id 정의 둘 → 앞의 것이 사라짐.
- 수정안(`apply.mjs` 3b·3c, 사본: ①은 "각주 정의 2개는 본문에 [^번호] 표지가 없어 옮기지 못했습니다", ②는 "표지 2개는 정의가 없어 빈 각주로 옮겼습니다"): `usedDef` 집합과 `missingDef` 계수.

### F5-8 [낮음] 버리는 서식 경고의 빈틈
- DOCX는 `w:strike`·`w:dstrike`·`w:vertAlign=subscript`·`w:em`을 읽지 않고도 경고가 없습니다(`node tests/audit_sonnet_fid5/docx_marks.mjs` → warnings `[]`). HWP·HWPX의 `lostMarks`(`parse.js:59`)는 본문 문단만 세고 각주 안 장식은 세지 않습니다(코드 읽기, 실행 확인 못 함).

### F5-9 [관찰] 기타
- 재배열 안내문: 주제어를 참고문헌 뒤로 옮기는 kopoetics에서 안내가 "…본문>참고문헌>국문초록·주제어>영문초록…"처럼 **국문초록·주제어가 두 번** 나옵니다(`reorder_notes.mjs`). 주제어만 옮겨진 것이 정확하게 반영된 것이라 결함은 아니지만 혼동 소지가 있습니다. 수정은 하지 않았습니다.
- 강조 문법: `***굵은기울임***`은 별표 세 쌍이 글자로, `**굵게 *안의 기울임* 끝**`은 바깥 `**`가 글자로 남습니다(글자 보존, 서식만 안 됨).
- 성능: `[^a ` 꼴을 한 줄에 수만 번 반복한 TXT는 이차 시간(38만 자 한 줄 15초, `perf2.mjs`). `tok`의 첫 대안 `\[\^([^\]]+)\]`가 원인이며 이전부터 있었고 실제 원고에서는 나오기 어렵습니다.
- `src/structure.js`는 줄바꿈이 CRLF(323줄)와 LF가 섞여 있습니다. 동작과 무관하지만 diff가 지저분해지니 한쪽으로 통일하는 편이 좋습니다.

## 5. 수치

### 5.1 작가 원고 5편 × 52곳 = 260회 (HEAD 234555a, 4차와 동일)
- 하네스: 254 OK, 6 표시(litheory × paper1·2·3·5 `structure-order`, fcs·iall × paper2 `out-emph-xml-vs-hwp` — 4차에서 판독기 한계로 확인된 것). 오류·경고·저장 손실 0.
- 독립 판독 대조(`compare4.mjs`, 원고 5 + 산출 260 = 265개 HWP, 구조 오류 0):

| 항목 | 수치 |
|---|---|
| 원고 비빈 문단 | 31,200 → 산출에서 없어진 문단 **0**(표지 문구 311·주제어 머리말 116 치환, 쪽 표기 치환 504) |
| 각주 | 9,308 — 글자 불일치 0(앞 공백까지 9,308/9,308), 개수·문단 수·줄바꿈·번호 유무·번호 문단·문단 안 위치 0 |
| 각주 순서 | 산출 각주 열이 원고 각주 열과 같은 순서 260/260(`strictorder.mjs`, 쪽 표기 치환 허용) |
| 새 번호 컨트롤 | 원고 104 = 산출 104, 값 동일 |
| 본문 강조 | 4,940자 중 유실 0, 불필요 서식 28자(litheory 국문초록 제목 기울임) |
| 산출에만 있는 글 | 문단 1,402 = 표지 506 + 주제어 116 + 자동 목차 780(체재에 목차가 있는 39곳 × 5편 = 195조합에서만) |
| 빈 줄 | 7,690/7,690 정확 |
| 글자 집합 | 산출에 있고 원고에 없는 글자는 표지 문구·`쪽`·`례`·`핵` 등 의도된 것뿐, 원고 글자가 이유 없이 줄어든 것 0(`charset.mjs`), U+FFFD 0 |
| 재변환 | 산출 HWP를 같은 학회로 다시 변환 50회(5편 × 10곳): 문단 글·각주 글·번호·새 번호 변화 0(`roundtrip5.mjs`) |

### 5.2 가상 원고
- 3차 9종 × TXT·DOCX·HWPX × 52곳 = 1,404회: OK 1,142(4차와 같음). 나머지 262는 4차에서 밝힌 하네스 장치 문제(TXT 작성기의 다문단 각주, 빈 문단 각주 계산)와 의도된 `structure-order`.
- `labelpos`(주제어·Keywords 줄에 기울임+각주) DOCX·HWPX × 52곳 **104/104**, `fnshape`(셋 문단 각주 + 강조 + 쪽수 치환) **104/104**(독립 판독).
- 별표·각주 경계 `star.txt`(강조 안 각주, 강조 뒤 각주, 한 글자 강조, 저자 별표) × 52곳: 기울임·굵게 범위와 각주 offset **52/52, 불일치 0**.
- DOCX 읽기(`docx_nest.mjs`): hyperlink·ins·smartTag·sdt·fldSimple·복합 필드·moveTo 안의 글 보존, `w:del` 삭제분 제외(의도). 표시 각주(customMarkFollows) 뒤 새 번호 `docx_custom.mjs` 일치.
- TXT 별표·각주 시험 54줄(`txt_battery.mjs`)에서 위 F5-4·F5-5 외 이상 없음.

### 5.3 PDF 파싱본 40건
- 40 × 7곳 = 280회: OK **154**(b7d5603 134), 나머지는 `truth-para-changed` 95(머리말 skip 등 의도)·`structure-order` 77(의도). `parse-text` 0.
- 40 × 52곳 = 2,080회 블록 글 대조(`pdf_text_fid.mjs`): 원고 비빈 문단 1,787,500개 중 같은 글 1,783,338, 쪽 표기 치환 3,382, 나머지 780은 전부 `skip`(원고 머리말·식별자, 11개 파일 15문단 × 52곳), 그 밖의 소실 0. 목차 머리·항목 외 새 글 0.
- 4차(b7d5603)와 역할 비교: 파일 45(PDF 40 + 작가 원고 5) × 곳 9 = 405회 중 차이 **0**(구문 차이는 별표 3파일뿐).
- 요약(koli): 제목·저자 40/40, 국문초록 머리 26, 주제어 28, 참고문헌 머리 24, 영문초록 머리 23, 목차 25, 투고일 10, 장 제목 3개 이상 32, 참고문헌 5개 이상 22. 초록으로 쏠린 것 2건(pdf-10·11, 99%).
- 체재: 목차가 본문·참고문헌 뒤인 경우 10회(F5-3), 투고일이 끝이 아닌 경우 0, 체재 안 묶음 순서 위반 0(kopoetics 주제어 이동 제외).

## 6. 수정안 검증 (`tests/audit_sonnet_fid5/patched/`)
- `rm -rf src && cp -r ../../../src src && node apply.mjs && node apply2.mjs && node apply3.mjs` (cite 공백, 목차 앵커, TXT 이어짐·고아 경고·각주 정의 강조·별표 경계).
- 최종 사본(`apply*.mjs` 셋 모두 적용)을 현재 판과 엔진 빌드 없이 대조(`patch_equiv2.mjs`): 파일 87개(PDF 40 + 작가 원고 5 + 가상 42) × 52곳 = 4,524회의 파싱 결과와 finalize 블록(역할·글·런·각주)이 4,462회 동일. 다른 62회는 모두 의도한 변화입니다 — 목차 위치 10(pdf-01·02·05·24·25 × korlit·eomun), `md_misc.md` 52(각주 정의 안 `**굵게**`가 서식으로).
- 같은 최종 사본으로 HWPX 바이트까지 대조(`patch_equiv.mjs`): 작가 원고 5편 × 52곳 **260/260 동일**, 가상 TXT/MD 8종 × 52곳(kitchen·fnstress·withtoc·k_kitchen.txt·k_kitchen.md·fn_roles·english·star) 416/416 동일. PDF 40 × 52 = 2,080회 빌드 대조는 apply2·apply3 적용 전 사본으로 돌렸고(다른 것은 의도한 목차 위치 10뿐), 최종 사본은 위 파싱·블록 대조로 갈음했습니다.
- `txt_md` charsLost 0, `star2` 동일, `star_sym` 전부 보존, `cite_space` 공백 소실 56 → 0, `pdf_place` 목차 오배치 10 → 0, 사본의 `tools/fidelity_test`(출력 현재 판과 동일)·`pipeline_test`(종료 코드 0)·`verify_matrix`(52/52, 40초) 통과.

## 7. 실행한 명령 (작업 디렉터리 `tests/audit_sonnet_fid5/`, 별도 표기가 없으면)

| 목적 | 명령 | 결과 |
|---|---|---|
| 5편 × 52곳 | `for n in 1 2 3 4 5; do node run_files.mjs ../원고/paper$n.hwp all --save; done` | 254 OK |
| 독립 판독·대조 | `IDIR=indep5 python -X utf8 run_indep_all.py`, `IDIR=indep5 node compare4.mjs`, `rawfn.mjs`, `digits4.mjs`, `spur.mjs`, `extra4.mjs`, `blank_exact.mjs`, `strictorder.mjs`, `charset.mjs`, `roundtrip5.mjs` | §5.1 |
| 가상 원고 | `node run_synth.mjs all txt\|docx\|hwpx all`, `node run_synth4.mjs labelpos,fnshape docx,hwpx all --save`, `python -X utf8 check_labelpos.py`, `check_fnshape.py`, `check_m2.py`, `node star_run.mjs fixtures/star.txt star` + `python -X utf8 read_dir.py out3 star ind3` + `node star_check.mjs` | §5.2 |
| PDF | `node run_files.mjs @pdf koli,ricc,mkliterature,sanghur,dongak,fcs,kochih`, `pdf_text_fid.mjs`, `pdf_place.mjs`, `pdf_toc.mjs`, `pdf_summary.mjs`, `role_diff5.mjs`, `skips.mjs` | §5.3 |
| 4차 Sonnet 재현 | `txt_md.mjs`, `star2.mjs`, `cite_stale.mjs`, `label_fp.mjs`, `label_fp2.mjs`, `kw_forms.mjs`, `pdf16.mjs`, `tblfn.mjs <hwp> N`, `md_test.mjs`, `reorder_notes.mjs` | §3.1 |
| 4차 Opus 재현 (저장소 루트에서) | `node tests/audit_opus_fid4/falsehead_run.mjs all`, `pdftail.mjs [곳,…]`, `docxnum.mjs <docx>`, `fncmp.mjs <파일,…> <곳,…>` | §3.2 |
| 신규 결함 | `cite_space.mjs`, `cite_e2e.mjs c`+`read4.py`, `txt_fn.mjs`, `txt_battery.mjs`, `star_sym.mjs`, `txt_orphan.mjs`, `docx_marks.mjs`, `docx_custom.mjs`, `docx_nest.mjs`, `perf_txt.mjs`, `perf2.mjs` | §4 |
| 수정안 | `patched/apply*.mjs`, `patch_equiv.mjs <파일,…>`·`patch_equiv.mjs pdfs 0-10`, `p_*.mjs` | §6 |

## 8. 한계 · 확인하지 못한 것
- 한컴오피스에서 직접 열어 보지 못했습니다. PUA 겹낫표·옛한글·번호 없는 각주 뒤 번호 매김의 화면 표시는 확인 못 함입니다(번호 값은 자동 번호·새 번호 컨트롤을 독립 판독기로 확인).
- 독립 판독기 `hwp5_indep4.py`는 4차 sonnet이 직접 쓴 것을 그대로 썼습니다(공식 HWP5 라이브러리가 아님). 이번에 새로 만든 대조는 `strictorder.mjs`(각주·문단 순서), `charset.mjs`(글자 집합), `roundtrip5.mjs`, `pdf_text_fid.mjs`, `star_check.mjs`입니다. 글자 모양은 기울임·굵게·밑줄·위첨자 속성 비트만 봅니다.
- DOCX는 실제 Word 저장본이 아니라 합성 파일입니다. 이번 5편에는 표 안 각주, 각주 안 강조, 사용자 지정 번호 표시가 없어 해당 경로는 가상 원고로만 시험했습니다.
- `release/투고틀.html`을 실제로 실행해 시험하지는 못했습니다. 소스와의 일치는 이번 반영의 고유 구문(`const addFn`, `paras: t.split`, `lostMarks` 등)이 번들에 들어 있음과 `release/투고틀.sha256` 값이 `release/투고틀.html`과 맞음만 확인했습니다(`dist/`에 새로 만든 번들의 SHA-256은 release와 다릅니다 — 아래 참고).
- **제 실수**: 인수를 확인하려고 `node tools/build.mjs --help`를 실행했는데, 이 도구가 인수와 무관하게 빌드해 `dist/`(git이 무시하는 폴더)가 같은 src로 다시 만들어졌습니다. 추적 파일은 바뀌지 않았고(`git status`로 확인, `docs/audit/brief_round3.md`의 변경은 제 것이 아님) `release/`는 건드리지 않았습니다. 다른 감사 에이전트가 `dist/dev.html`을 읽는 중이었다면 같은 src에서 나온 같은 내용입니다. 이 빌드의 `dist/투고틀.html` SHA-256(74e769d8…)은 `release/투고틀.html`(f5c0f029…)과 다른데, 빌드 변형 차이인지 재현성 문제인지는 따지지 않았습니다(기능 감사 쪽 일).
- 학회 규정상 목차·초록 위치와 litheory 국문초록 제목 기울임이 맞는지는 확인 못 함입니다.

## 9. 만든 파일 (모두 `tests/audit_sonnet_fid5/` 아래)
- 독립 판독·대조: `hwp5_indep4.py`(4차 사본), `run_indep_all.py`, `compare4.mjs`, `rawfn.mjs`, `digits4.mjs`, `spur.mjs`, `extra4.mjs`, `blank_exact.mjs`, `strictorder.mjs`, `moved.mjs`, `charset.mjs`, `roundtrip5.mjs`, `fnnums.py`, `check_*.py`, `read_dir.py`, `read4.py`
- 새 시험: `txt_battery.mjs`, `txt_fn.mjs`, `txt_orphan.mjs`, `star_sym.mjs`, `star_run.mjs`·`star_check.mjs`·`fixtures/star.txt`, `cite_space.mjs`, `cite_e2e.mjs`, `docx_custom.mjs`, `docx_marks.mjs`, `docx_nest.mjs`, `mkdocx.mjs`, `kw_recall.mjs`, `pdf_text_fid.mjs`, `pdf_place.mjs`, `pdf_summary.mjs`, `role_diff5.mjs`, `skips.mjs`, `reorder_notes.mjs`, `perf_txt.mjs`, `perf2.mjs`, `warns.mjs`, `marks.mjs`, `save_one.mjs`
- 수정안: `patched/apply.mjs`, `apply2.mjs`, `apply3.mjs`, `patched/src/`(적용된 사본), `patch_equiv.mjs`, `p_*.mjs`, `lib_p.mjs`
- 판 비교: `b7/src`(b7d5603), `lib_b7.mjs`
- 결과: `logs/`, `out/`·`out2~4`·`out3p`(산출 HWP·HWPX), `indep5/`·`ind3/`·`ind3p/`(독립 판독 JSON — 작가 원고의 글이 들어 있으므로 저장소 밖으로 내보내지 마세요), `results*.json`
