점수: 80/100

# 3차 감사 A. 산출물 충실도 — sonnet_fid (2026-10-13 심야, 대상 main 0278044)

작가 원고 5편(paper1~5.hwp)을 학회 52곳 전부에 변환해(260회) 산출 HWP·HWPX를 다시 읽어 원고와 글자 단위로 맞대고, 가상 원고(TXT·MD·DOCX·HWPX 15종)와 PDF 파싱본 40건을 학회 5~52곳에 돌렸습니다. 이 보고서에는 원고의 제목·저자·문장을 쓰지 않았습니다. 실제 원고는 paper번호·pdf-NN·수치로만, 재현 인용은 제가 만든 가상 원고의 조각만 씁니다. pdf-NN의 번호는 `tests/원고_pdf/*.txt`를 이름순(코드 단위)으로 정렬한 순번입니다.

## 1. 판정

- **본문·각주·강조는 잘 보존됩니다.** 5편 × 52곳에서 본문 글자 불일치 0, 각주 수·글자·위치 불일치 0(예외 1건: F-11), 본문 강조 유실 0, 빈 줄 규칙 위반 0/7,690곳입니다. 저장한 HWP 85개를 rhwp가 아닌 **독립 HWP5 판독기**(olefile+zlib)로 다시 읽어도 원고 문단이 하나도 빠지지 않았고(표지 문구 제외) 각주 3,043개의 위치가 모두 맞았습니다.
- **점수를 깎은 것은 보존이 아니라 배치·표지 문구·입력 경계입니다.** 학회 체재에 없는 목차가 문서 맨 끝으로 가는 것(F-01), 주제어 머리말에 바탕틀 예시 문구가 섞이는 것(F-02), `.txt`에서 별표가 사라지는 것(F-03), 각주 안 강조 유실(F-04), 영문 논문 인식(F-06)이 큽니다.
- `tools/verify_matrix.mjs`는 제가 돌린 17곳 모두(팀 기록은 52/52) 통과시키지만 F-01을 보지 못합니다(F-01 끝 참조). "통과"가 곧 "접수 가능한 체재"는 아닙니다.

### 즉시 고칠 것 (순서대로)
1. F-01 목차(및 체재에 없는 묶음) 위치 — 6개 학회에서 5편 모두 목차가 영문초록 뒤에 붙습니다.
2. F-02 주제어 머리말 잔여물 — 4개 학회에서 주제어 줄이 `• 주제어：5 …`, `국문주제어: . …`처럼 나옵니다.
3. F-03 `.txt`의 별표 해석 — 저자·소속 표기 별표가 지워집니다.
4. F-05 글 없는 문단의 각주 — 각주가 말없이 사라집니다.
5. F-04 각주 안 강조.

## 2. 95점에 이르기 위해 고쳐야 할 것 (우선순위)

| 순위 | 항목 | 현재 영향 | 수정 규모 |
|---|---|---|---|
| 1 | F-01 체재에 없는 묶음 배치 + `buildToc` 판정 + 학회 데이터 정합 + verify_matrix 맹점 | 6개 학회 × 5편 = 30/260회에서 목차가 맨 끝(체재 위반), 19개 학회에서 원고 목차가 맨 끝 | 중 (코드 10줄 + 데이터 6곳) |
| 2 | F-02 키워드 머리말 | 4개 학회의 주제어·Keywords 줄 변형 | 소 (정규식 1줄 + 닫는 괄호 3줄) |
| 3 | F-03 `.txt` 별표 | PDF 파싱본 6/40건에서 52자 소실, 저자 표기 위험 | 소 (정규식 1줄) |
| 4 | F-05 빈 문단 각주 | 각주 1개 유실(가상 원고 14개 중 1) | 소 (1줄) |
| 5 | F-04 각주 안 강조 | DOCX·HWPX 입력의 각주 강조 100% 유실 | 중 (파서+엔진) |
| 6 | F-06 영문 논문·영문 참고문헌 머리말 | 영문 원고는 본문 전체가 영문초록이 됨 | 소~중 |
| 7 | F-07 앞부분 역할(영문 제목, 소속 줄, 두 줄 제목) | 서식·위치가 어긋남(글자는 보존) | 중 |
| 8 | F-08 DOCX 읽기 누락(후주, 스타일 서식, 기호 글자, 자동 번호) | 해당 구조의 원고에서 글자·서식 유실 | 중 |
| 9 | F-09 재변환 시 표지 문구 미인식 9곳 | 산출 HWP를 다른 학회로 다시 넣을 때 역할 오인 | 소 |
| 10 | F-10~F-13 | 낮음 | 소 |

위 1~4·6·7의 일부는 제가 `src` 사본(`tests/audit_sonnet_fid/patched/`)에 적용해 확인했습니다. 5편 × 52곳 재실행에서 본문·각주·위치·강조 불일치는 늘지 않았고(0), PDF 파싱본 40건의 별표 소실은 52자 → 0자, 가상 원고 역할 시험은 217/264 → 244/264였습니다. 전체 차이는 `tests/audit_sonnet_fid/proposed_fixes.diff`(81~113줄)에 있습니다. `src/`는 건드리지 않았습니다.

## 3. 발견 (중요도순)

### F-01 [높음] 학회 체재(`structure`)에 없는 묶음이 문서 맨 뒤로 밀린다 — 목차, 국문초록
- 위치: `src/structure.js:166`(`for (const g of seq) if (!used.has(g)) …`), `src/structure.js:293`(`buildToc`의 `wants`), `src/app.js:398`(재배열 안내문), `tools/verify_matrix.mjs:99-100`.
- 원인: `reorderSections`는 체재 배열(order)에 있는 묶음만 순서대로 놓고, 나머지는 원고 등장 순서로 **맨 뒤**에 붙입니다. 학회 52곳 중 19곳의 `structure`에 `toc`가 없는데, 그중 6곳(fcs·anim·korlanlit·korliter·iall·dongak)은 바탕틀에 목차 서식(`template.roles.toc`)이 있어 `buildToc`가 목차를 **자동 생성**하고(`wants`가 참), 곧바로 재배열이 그것을 맨 끝으로 보냅니다. 안내문도 "목차"를 빼고 보여 줘서(`to` 목록에 없음) 사용자가 알아채기 어렵습니다.
- 재현(가상 원고):
  - `cd tests/audit_sonnet_fid && node seq.mjs fixtures/kitchen.txt fcs | tail -n +2 | awk -F: '{printf "%s ", $2}'` → 끝이 `… abstractEnHead blank abstractEn blank keywordsEn blank blank tocHead toc toc toc`.
  - 원고에 목차가 있는 경우: `node seq.mjs fixtures/withtoc.txt ricc` → `title author abstractHead … abstractEnHead titleEn2 keywordsEn tocHead toc toc toc`.
  - 국문초록: `node seq.mjs fixtures/lateabs.txt litheory` → `… refHead ref abstractEnHead titleEn2 keywordsEn abstractHead abstract keywords`(litheory의 `structure`에는 `abstractKo`가 없음).
  - 작가 원고: `node run_files.mjs ../원고/paper1.hwp fcs,anim,korlanlit,korliter,iall,dongak,litheory` → 7곳 모두 `structure-order×1`.
- 수치: 작가 원고 5편 × 6곳 = **30/260회**에서 목차가 맨 끝(+ litheory는 국문초록이 영문초록 뒤, 4편). PDF 파싱본 40건: ricc 23건, dongak 34건, fcs 34건에서 목차가 맨 끝(원고에 목차 줄이 있는 17건 + 자동 생성).
- 기대: 목차는 앞부분 바로 뒤(체재 기본값 `front → toc → …`), 또는 학회에 목차가 없다면 자동 생성하지 않고 원고의 목차는 원래 자리에 둠. 실제: 맨 끝.
- 데이터 불일치(확인 필요): `tocLabel`이 있는데 `structure`에 `toc`가 없는 학회가 6곳(korlanlit·postcriticism·iall·litheory·hanguksoseol·dongak), 바탕틀 목차 서식만 있고 `tocLabel`이 없는 곳이 3곳(fcs·anim·korliter)입니다. 학회가 실제로 목차를 요구하는지는 제가 확인하지 못했습니다(바탕틀 예시 문단에는 목차가 없습니다: fcs·dongak·korlanlit의 앞 14문단 확인). 어느 쪽이든 "맨 끝"은 맞지 않습니다.
- 수정안:
```js
// src/structure.js reorderSections — 체재에 없는 묶음은 원고에서 바로 앞서던 묶음 뒤에 끼운다(목차는 front 바로 뒤, tail은 맨 끝)
const ord = [...order];
for (const g of seq) { if (ord.includes(g) || g === 'tail') continue;
  const prevG = g === 'toc' ? 'front' : seq[seq.indexOf(g) - 1]; const k = ord.indexOf(prevG);
  ord.splice(k >= 0 ? k + 1 : ord.length, 0, g); }
// 이후 order 대신 ord를 쓴다(out 조립, changed, to 목록)

// src/structure.js:293 buildToc — 체재 자료가 있으면 그것을 따른다
const wants = journal.structure ? journal.structure.includes('toc')
  : !!(journal.template?.roles && (journal.template.roles.toc || journal.template.roles.tocHead));
```
  그리고 `src/journals.js`에서 목차가 있는 6곳의 `structure`에 `'toc'`를 넣거나(실제로 목차가 있다면) `tocLabel`을 지웁니다. 사본에 적용한 결과: `fcs front>toc>abstractKo>body>references>abstractEn`.
- 검증 도구 맹점: `tools/verify_matrix.mjs:99-100`은 `order.indexOf(g)`가 −1인 묶음을 걸러 내므로(`filter((x) => x >= 0)`) 체재에 없는 묶음의 위치를 보지 못합니다. `if (pos.length !== seq.length) pr.structure.push('체재에 없는 묶음: ' + seq.filter((g) => !order.includes(g)))`를 더하면 잡힙니다(단 `tail` 제외).

### F-02 [높음] 주제어·Keywords 머리말에 바탕틀 예시 문구가 섞인다 (표지 문구 정규화)
- 위치: `src/engine.js:189`(`KW_LABEL`), `:194`, `:198-201`.
- 원인: `KW_LABEL`의 끝 `[^가-힣A-Za-z]{0,3}`이 머리말 뒤의 숫자·점·여는 괄호까지 먹습니다. 바탕틀 예시가 `주제어：5개 이상`, `국문주제어: ……`, `Keywords: (키워드 …)`이면 머리말이 `주제어：5`, `국문주제어: .`, `Keywords: (`가 됩니다. 반대로 예시가 `(주제어: ……)`처럼 괄호로 감싸진 학회(daejung)는 여는 괄호만 오고 닫는 괄호가 없습니다.
- 재현: `cd tests/audit_sonnet_fid && node labels_out.mjs 1` (paper1; 값 앞부분만 출력).
  - kopoetics: `keywords[• 주제어：5 ]  keywordsEn[• Key words：5 ]`
  - dongak: `keywords[국문주제어: . ]`
  - interlali: `keywordsEn[Keywords: ( ]`
  - daejung: `keywords[(주제어:  ]` — 값 뒤에 `)`가 없음.
- 영향: paper1~3·5(주제어가 있는 4편) × 4개 학회 = 16개 산출물의 주제어 줄이 학회 표기와 다릅니다. 첫 주제어 앞에 `5`·`.`·`(`가 붙어 키워드 목록처럼 읽힙니다. 학회 접수 형식 위반 소지.
- 수정안(사본에서 확인: 4곳 모두 학회 표기와 일치, 다른 학회 라벨은 불변):
```js
// 머리말 뒤에는 닫는 기호 하나, 공백 두 칸 이내, 구분 기호만 허용(숫자·점·여는 괄호는 예시 값이므로 가져오지 않는다)
const KW_LABEL = /^([^가-힣A-Za-z0-9]{0,3}(?:주제어|핵심어|키워드|국문\s*주제어|국문\s*핵심어|영문\s*주제어|key\s*words?|keywords?)[\]\)）】〕❙]?\s{0,2}[:：|\u{F0810}〻￨]*\s{0,2})/iu;
// 예시가 ‘(주제어: …)’처럼 감싸면 닫는 괄호를 값 뒤에 붙인다
const CLOSE = { '(': ')', '（': '）', '[': ']', '【': '】', '〔': '〕', '<': '>' }; const closer = CLOSE[want.trim()[0]];
return want + sep + rest + (closer && !want.includes(closer) && !rest.trimEnd().endsWith(closer) ? closer : '');
```
  (anim의 `주제어〻￨〻`, korliter의 `󰠐주제어󰠐`는 바탕틀 글자를 그대로 가져온 것으로 판단합니다. 한컴오피스에서 글꼴이 있는 쪽에서 어떻게 보이는지는 확인하지 못했습니다.)

### F-03 [높음~중] `.txt`·`.md`가 별표를 마크다운 강조로 먹는다 — 저자·소속 표기가 바뀜
- 위치: `src/parse.js:243`(`tok` 정규식), `:228-`(`parseText`).
- 재현: `cd tests/audit_sonnet_fid && node star_test.mjs`
  - `홍길동*·김철수**` → `홍길동·김철수*`(가운데가 이탤릭 런)
  - `* 한국대학교 교수. ** 서울대학교 교수.` → ` 한국대학교 교수. * 서울대학교 교수.`(앞 별표가 사라지고 이탤릭)
  - `이 글은 2*3 과 4*5 를 곱한다.` → `… 23 과 45 …`(`*` 두 개 소실)
- 수치: PDF 파싱본 40건 중 **6건에서 52자 소실**(`node txt_md.mjs`). 6건 중 4건(pdf-16·21·32·40)은 **저자 줄**(`이름*, 이름**` 꼴)이고 나머지 2건(pdf-03·04)은 글꼴이 깨진 본문 줄입니다. 소실된 글자는 산출 HWP에도 없습니다. 저자 줄이 바뀌면 `affiliation`/`author` 인식도 달라집니다(위 둘째 줄은 `body`로 분류됨).
- 기대: 글자 `*`는 원고 그대로. 실제: 짝이 맞으면 삭제.
- 수정안(사본 적용: PDF 40건 손실 0자, `**굵게**와 *기울임*은`처럼 조사가 붙은 정상 마크다운 강조는 그대로 인식):
```js
// 여는 별표는 줄 처음/공백/여는 따옴표·괄호 뒤에서만, 안쪽 첫·끝 글자는 공백이 아니어야 하고, 닫는 별표 뒤는 끝/공백/문장부호/한글(조사)
const tok = /\[\^([^\]]+)\]|(?<=^|[\s(“‘"'])\*\*(?=\S)([^*]+?\S)\*\*(?=$|[\s.,;:)”’"'가-힣])|(?<=^|[\s(“‘"'])\*(?=\S)([^*\n]+?\S)\*(?=$|[\s.,;:)”’"'가-힣])/g;
```
  안내 문구에 "`.txt`의 `*글자*`는 기울임으로 읽습니다"를 한 줄 넣으면 좋습니다.

### F-04 [중] 각주 안 강조(굵게·기울임·밑줄·위첨자)가 전부 유실된다 — DOCX·HWPX 입력
- 위치: `src/parse.js:162`(`footnoteText[id] = … runText(r.body)` — 런의 서식을 버림), 각주 객체는 `{offset, text}`뿐. `src/engine.js:346`(`makeFootnote`는 각주 문단마다 런 하나, 서식 하나).
- 재현: `cd tests/audit_sonnet_fid && node run_synth.mjs kitchen,english,fnstress docx,hwpx koli` → 각 `truth-fn-emph-lost×1`(kitchen 29자, english 25자, fnstress 5자 중 100%).
- 수치(가상 원고): 학회 52곳 × DOCX·HWPX 각주 강조 3,536자(52곳 5종 780회 중) 전부 유실. 본문 강조는 4,698+10,920자 중 0자 유실.
- 영문 책 제목을 이탤릭으로 쓰는 각주는 인문학 논문에서 흔합니다. HWP 입력은 rhwp에 각주 안 글자 모양 API가 없어 **확인 못 함**입니다(paper1~5를 rhwp 내보내기로 본 결과 각주 안 강조 0자, 독립 판독기로는 글자 모양을 읽지 않았습니다).
- 수정안(스케치): DOCX는 `footnoteText`를 `[{text, bold, italic, underline, superscript}…]` 문단 배열로 만들고 `footnotes.push({offset, text, runs})`, 엔진은 `variantCs(fnShape.cs, {bold, italic, underline, sup})`로 문단을 런 단위로 쪼개 `<hp:run>`을 여러 개 씁니다(본문의 `runsXml`과 같은 방식).

### F-05 [중] 글이 없고 각주만 있는 문단의 각주가 사라진다
- 위치: `src/structure.js:51`(`if (!t) … blank 블록`, `footnotes: []`).
- 재현: `node run_synth.mjs fnstress txt,docx,hwpx koli -v` → `recog-fn-on-empty: src5: 비어 있는 문단의 각주 1개가 blank 블록으로 바뀌며 사라짐`. 학회 52곳 모두 동일(156/156회).
- 기대: 각주 14개 모두 산출. 실제: 13개. 그림·개체 뒤 각주나 `[^7]` 한 줄만 있는 문단이 해당됩니다.
- 수정안(사본 확인: 14/14 보존):
```js
if (!t && p.footnotes && p.footnotes.length) { push('body', '글 없이 각주만 있는 문단'); continue; }
if (!t) { … blank … }
```

### F-06 [중] 영문 논문·영문 초록이 앞에 오는 원고 — 본문 전체가 `abstractEn`, 영문 `References` 미인식
- 위치: `src/structure.js:110`(영문초록 탈출 조건이 `hasHangul(t)`에 의존), `:11`(`refHead`는 `참고문헌`만).
- 재현: `cd tests/audit_sonnet_fid && node seq.mjs fixtures/english.docx koli` → `Abstract` 뒤 `1. Introduction`(titleEn2), 본문(abstractEn), `References`(abstractEn)까지 **전부 영문초록**. `node roles_test.mjs koli`의 `english_paper`·`ref_en`·`ref_upper`·`ref_works` FAIL.
- 같은 맥락: `【참고문헌】`, `인용문헌`, `참고자료`도 `refHead`로 인식되지 않습니다(`ref_bracket`·`ref_inyong`·`ref_jaryo`). `keywords` 정규식은 `【`를 받으므로 불일치.
- 글자는 보존되지만 서식(초록 크기·들여쓰기)이 영문 논문 전체에 입혀지고 목차·참고문헌 자동 처리도 안 됩니다. 영문 논문 작성 비중이 낮다면 심각도는 낮아집니다.
- 수정안(사본 확인: english_paper는 소속 줄 하나만 남고 모두 일치):
```js
// src/structure.js:110 — Keywords 뒤에 장 제목 형태 줄이 오면 본문 시작
if ((headingLike(t) && short && (hasHangul(t) || enBlocks.some((b) => b.role === 'keywordsEn')) && !sentenceEnd(t)) || …
// src/structure.js:11
refHead: /^[<＜〔\[❙▌「【]?\s*(참\s*고\s*문\s*헌|인\s*용\s*문\s*헌|참\s*고\s*자\s*료|references?|bibliography|works\s+cited)\s*[>＞〕\]❙」】]?(\s*\(.*\))?$/i,
```

### F-07 [중] 앞부분 역할 오배정 — 영문 제목, 소속 줄, 두 줄 제목
- 위치: `src/structure.js:72`, `:80`, `:117-118`(영문초록부), 정규식 `RE.authorEn`(`:19`).
- 재현: `cd tests/audit_sonnet_fid && node roles_test.mjs koli`
  - `en_title_en_author`: 국문 제목 바로 아래 `Genre Literature in the Digital Age` → `author`(기대 `titleEn`). `RE.authorEn`이 대문자로 시작하는 단어와 소문자 단어의 나열을 모두 영문 이름으로 봅니다.
  - `abs_en_std`: 영문초록부의 영문 제목이 `authorEn`.
  - `affil_plain`: 별표 없는 소속 줄(`한국대학교 국어국문학과 박사과정`)이 `body`가 되어 재배열 때 **국문초록·주제어 뒤**(본문 묶음 앞머리)로 옮겨집니다(가상 원고 `twoline`에서도 확인).
  - `two_line_title`: 평문 두 줄 제목의 둘째 줄이 `author`(기대 `title`), `two_affil_lines`: 소속 두 줄이 모두 `body`.
- 판정: 글자는 모두 보존되고 사용자가 구조 표에서 바꿀 수 있지만, 서식(저자 크기·정렬)과 위치가 어긋난 채 "적용"됩니다.
- 수정안(사본 확인: `affil_plain`·`en_title_en_author`·`en_subtitle_dash`·`abs_en_std` 통과, 5편×52곳에서 결함 증가 없음):
```js
const looksEnTitle = (t) => /\b(of|in|the|and|for|on|to|with|from|an?|as|by|between|through|toward|towards)\b/.test(t) || t.split(/\s+/).length > 4;
const isEnName = (t) => RE.authorEn.test(t) && !looksEnTitle(t);   // RE.authorEn.test(t) 자리에 모두 isEnName(t)
// front 상태에서 소속 낱말이 있는 줄
if (sawTitle && blocks.some((b) => b.role === 'author') && /(대학교?|대학원|연구소|연구원|학과|학부|University|Institute|Department|College|박사|교수|강사)/i.test(t) && t.length < 100) { push('affiliation', '소속 표기'); continue; }
```
  남는 것: `roman_headings`(`Ⅰ.` 아래 `1.`이 h2가 아니라 h1), 번호 없는 장 제목(`서론`·`결론`), `en_subtitle_nodash`는 규칙 기반의 한계로 보고 구조 표 수정에 맡기는 편이 안전합니다.

### F-08 [중] DOCX 읽기 누락 — 후주, 문자·문단 스타일 서식, 기호·하이픈 글자, 자동 번호, 텍스트 상자
- 위치: `src/parse.js:162-195`(`footnoteText`, `on()`), `:208-216`(`runTokens`).
- 재현: `cd tests/audit_sonnet_fid && node wild_docx.mjs && node wild_dump.mjs` (가상 DOCX `fixtures/wild.docx`). 정상: 하이퍼링크·변경 추적(삽입/삭제)·내용 컨트롤·스마트 태그·필드·탭·`xml:space`·엔티티·보조평면 모두 보존. 문제:

| 구조 | 기대 | 실제 |
|---|---|---|
| `<w:sym w:font="Wingdings" w:char="F0FC"/>` | 기호 글자(또는 경고) | 글자 소실(`앞  뒤`) |
| `<w:noBreakHyphen/>` | `-` | 소실(`가나`) |
| `<w:cr/>`, `<w:ptab/>` | 줄바꿈/탭 | 소실 |
| `<w:endnoteReference>` + `endnotes.xml` | 후주 내용 | **통째 유실, 경고 없음**(`footnotes.xml`만 읽음) |
| 문단·글자 스타일에 정의된 굵게·기울임(`Strong`, `Emphasis` 등) | 강조 | 인식 못 함(`on()`은 런의 `rPr`만 봄) |
| `<w:numPr>` 자동 번호(1., 가.) | 번호 글자 또는 경고 | 번호 글자 없음, **경고 없음**(제목이 `h1` 번호 규칙에 안 걸림) |
| 텍스트 상자(`mc:AlternateContent`) | 별도 개체 | 앞 문단에 끼어들고 선택/대체 내용이 **두 번** 들어감(`본문 상자 안 글상자 안 글 뒤`) |
| 루비(`w:ruby`) | 기준 글자 | `가루비漢나`(덧말이 기준 글자 앞) |
| 쪽 나눔 `<w:br w:type="page"/>`(`docx_pb.mjs`) | 줄바꿈 아님 | 문단 끝에 `\n`이 붙어 HWP에 빈 줄 하나 추가 |

- 수정안(핵심만):
```js
// runTokens: 쪽·단 나눔은 글자가 아니다
if (r.startsWith('<w:br', a) && ws(r[a + 5])) { const gt = r.indexOf('>', a); const ty = attr(r.slice(a, gt), 'w:type'); if (ty !== 'page' && ty !== 'column') out.push({ t: '\n' }); i = gt + 1; continue; }
if (r.startsWith('<w:cr', a) && ws(r[a + 5])) { out.push({ t: '\n' }); i = a + 5; continue; }
if (r.startsWith('<w:noBreakHyphen', a)) { out.push({ t: '‑' }); i = a + 16; continue; }
// 경고: 후주·자동 번호·기호는 옮기지 못하면 알린다
if (/<w:endnoteReference/.test(bodyXml)) warnings.push('후주(미주)는 변환되지 않습니다. 각주로 바꾼 뒤 올려 주세요.');
const numbered = (bodyXml.match(/<w:numPr>/g) || []).length; if (numbered) warnings.push(`자동 번호 문단 ${numbered}개 — 번호 글자는 원고에 없어 옮겨지지 않습니다.`);
```
  스타일 서식은 `styles.xml`의 `w:style`별 `<w:rPr>`에서 `b/i/u`를 읽어 `rStyle`·`pStyle`(및 `basedOn`)로 합치면 됩니다. 그림·표처럼 위치 표시는 F-12를 참고하세요.

### F-09 [낮음~중] 산출 HWP를 다른 학회로 다시 넣으면 표지 문구를 못 알아본다 (9곳)
- 위치: `src/structure.js:8-14`(`tocHead`·`abstractHead`·`refHead`·`keywords` 정규식).
- 재현: `cd tests/audit_sonnet_fid && node rt_labels.mjs` → 104회 중 9개 학회: eastasia(`〈차 례〉`), anim(`주제어〻￨〻`), korliter(`󰠐주제어󰠐`), postcriticism(`* 핵심어 :`), kopoetics(`• 국문초록` 등 5종 모두), litheory(`▣ Key words:`), kochih(`◆ 참고문헌`), dongak(`국문주제어:`), kles(`<References>`).
- 영향: 같은 도구가 만든 라벨을 도구 자신이 다시 읽지 못해 재변환 때 역할이 달라집니다(`rt_detail.mjs 4 eastasia`: 목차 제목이 본문이 되어 목차 항목 4문단이 밀림). 제출처를 바꾸는 흐름에서 실제로 일어날 수 있습니다.
- 수정안: 라벨 정규식의 접두·접미 허용을 `[^가-힣A-Za-z0-9]{0,3}`로 넓히고(`〈 〉`, `•`, `◆`, `▣`, PUA 포함), `국문주제어`·`〻￨〻` 구분자를 허용합니다.

### F-10 [낮음] 첫 줄에 연월·URL·`pp.`·`ⓒ`가 있으면 제목이 `skip`으로 버려지고 저자가 제목이 된다
- 위치: `src/structure.js:68`(머리말 판정 정규식).
- 재현: `node roles_test.mjs koli` → `title_year_month`(`2026. 3월 개정 …`), `title_vol_no`, `title_pp`, `title_url`, `title_copy`: `0:title=>skip ; 1:author=>title`. 구조 표에서 `skip`이 보이므로 알 수는 있으나, 산출물에서 제목이 빠집니다. PDF 파싱본 머리말 15줄(768자)을 거르려고 만든 규칙의 부작용입니다. 판정을 `!sawTitle`에 더해 "다음 줄이 이름 꼴이고 이 줄이 한글 위주 문장이 아님" 같은 조건을 두거나, `skip`이 첫 한글 줄이면 제목으로 되돌리는 방법이 있습니다.

### F-11 [낮음] paper3의 각주 1개: 글자 1자 추가, 번호 위치 변경
- 위치: `src/parse.js:79-84`(`noNumber` 판정과 번호 자리 공백 제거).
- 독립 판독기와 대조하면 paper3 각주 0번만 1,146자(원고) ↔ 1,147자(앱 파싱)입니다. 이 각주는 첫 문단이 `*`로 시작하고 **둘째 문단 맨 앞에 자동 번호**가 있는 구조라, 앱은 첫 줄이 공백으로 시작하지 않아 `noNumber`로 보고 둘째 문단의 번호 자리 공백을 글자로 남깁니다. 산출물에서는 번호가 둘째 문단이 아니라 아예 사라지고(두 문단 모두 번호 없음) 공백 1자가 늘어납니다. 학회 52곳에서 동일(52/52).
- 재현: `cd tests/audit_sonnet_fid && node compare_indep.mjs`(독립 판독 ↔ 앱 파싱 대조).
- 수정안: 각주 문단 중 어느 하나가 번호 자리 공백으로 시작하면(`texts[k][0] === ' '` 이며 독립 판독상 `atno`) 그 문단에서 한 칸을 떼고, 번호 컨트롤을 그 문단에 둡니다(엔진의 `i === 0` 가정을 `autoNumAt` 인덱스로).

### F-12 [낮음] 표·그림이 빠지는 자리를 산출물에 표시하지 않는다
- 작가 원고: paper1 표 1, paper2 표 1, paper4 그림·개체 5, paper5 표 3. 경고 문구는 뜨지만(`표 N개는 변환되지 않습니다`) 산출 HWP에는 위치 표시가 없어 사용자가 어디에 넣어야 하는지 원고를 다시 봐야 합니다. 표 안 글은 유실로 볼 수 있습니다(규정 1항). 위치에 `[표 — 여기에 직접 옮겨 넣으세요]` 같은 빈 표시 문단(붉은 글자)을 넣는 방안을 권합니다.

### F-13 [낮음] TXT의 여러 문단 각주 정의
- `[^a]: 첫 줄` 아래 들여 쓴 이어지는 줄은 각주가 아니라 **본문 문단**이 되어(`md_test.mjs` 17번) 각주 문단 구조와 위치가 달라집니다. 이어지는 줄(들여쓰기 4칸 이상)을 같은 각주의 다음 문단으로 묶으면 됩니다.

### 정오·사소한 관찰
- XML↔HWP 차이: paper2에서 fcs·iall·litheory의 저자 문단 4자는 HWP에서 굵게, 내보낸 XML에서는 굵지 않게 나옵니다(바탕틀 서식 때문으로 추정, `dbg_p2.mjs`; 확인 못 함).
- `<hp:hyphen/>`은 rhwp가 U+00AD로, `<hp:fwSpace/>`는 U+2007로 읽습니다(진짜 전각 공백 U+3000은 그대로 보존됨). HWPX 덧말(`dutmal`) 내용은 읽지 못합니다(드묾).

## 4. 잘 되는 것 (수치)

### 4.1 작가 원고 5편 × 52곳 (260회, 오류·경고 0)
| | paper1 | paper2 | paper3 | paper4 | paper5 |
|---|---|---|---|---|---|
| 원고 문단 / 각주 / 글자(코드포인트) | 135 / 61 / 25,747 | 218 / 39 / 35,335 | 198 / 35 / 26,420 | 60 / 17 / 11,353 | 144 / 27 / 21,935 |
| 산출 문단(학회별 범위) | 116~145 | 204~227 | 158~187 | 45~62 | 117~141 |
| 산출 쪽 수 | 13~39 | 19~57 | 14~42 | 6~19 | 11~34 |
| 본문 글자 불일치(블록) | 0 | 0 | 0 | 0 | 0 |
| 각주 수·글자·위치 불일치 | 0 | 0 | 1개(F-11)×52 | 0 | 0 |
| 본문 강조 유실 / 불필요 강조 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| 체재 순서 결함(F-01) | 7곳 | 7곳 | 7곳 | 6곳 | 7곳 |
| 표 / 그림 경고(F-12) | 표 1 | 표 1 | — | 그림 5 | 표 3 |

합계: 문단 31,200(원고 비빈 문단 × 52), 각주 9,308(위치 일치 9,256 + F-11 52), 본문 강조 글자 21,788 중 유실 0, 변환 글자 6,294,330, 빈 줄 규칙 7,690곳 모두 규정 수치와 정확히 일치(부족·초과 0).

### 4.2 저장한 HWP를 독립 판독기로 다시 읽음 (`convert_copy.mjs` 17곳 × 5편 = 85개)
- 학회: 바탕틀 8(koli·eastasia·dongak·fcs·korlanlit·iall·kopoetics·aagcc), 규정값 6(sanghur·ricc·ktla·urilit·kcomplit·hangomun), 일반 3(mkliterature·novel·kdrama).
- 원고 읽기: 독립 판독기와 앱 파서가 755문단 글자 일치, 각주 179개 중 178개 일치(F-11 1개), 각주 위치 179/179 일치. 2구역 HWP(iall·kochih 바탕틀을 원고로 투입): 문단 86·94, 각주 8·1 모두 글자·위치 일치.
- 산출 읽기: 원고의 비빈 문단 10,200건 중 학회 라벨 문단을 뺀 **본문 문단 누락 0**(라벨 160건은 표지 문구 정규화). 각주 3,043건 중 쪽수 표기 치환을 뺀 누락 17건(전부 F-11). 쪽수 치환 1,032건은 숫자열이 원고와 모두 같고(0건 변경) 단위만 바뀝니다(쪽/면/p.). 각주 위치(앞 14자와 문단 끝 여부) 3,026/3,026 일치.
- 저장 파이프라인 동일성: 내 하네스의 변환 결과가 `convert_copy.mjs`가 디스크에 쓴 HWP와 SHA-256 동일(12/12).
- 재변환 안정성: 산출 HWP를 같은 학회로 다시 변환(24회) — 문단 수 변화 0, 각주 글자·위치 변화 0, 문단 글자 변화는 eastasia 3건(F-09).

### 4.3 가상 원고 (`tests/audit_sonnet_fid/fixtures/`: 위 9종 + 보조 시험 6종)
옛한글 조합형·호환·확장 자모, 한자·보조평면(CJK 확장 B·C)·이체자 선택자, 가나(전각·반각·합자), 라틴 확장·결합 문자, 그리스·키릴·아랍·히브리·태국·데바나가리, 수학·기호·원문자, 전각 문장부호·`｢｣`, PUA 겹낫표·한양 PUA, 이모지(ZWJ·국기·변이 선택자), NBSP·EN/EM·얇은 공백·ZWSP·ZWNJ·ZWJ·WJ·SHY·BOM·U+0085, 탭, 강제 줄바꿈, 줄 끝 공백, 앞 공백, 전각 공백 시작 문단.
- 9종(kitchen·english·withtoc·lateabs·absfirst·twoline·ws·fnstress·quotes) × TXT·DOCX·HWPX × 학회 18곳(486회)·52곳(5종 780회) = **1,266회**: 본문 글자 불일치 0, 본문 강조(굵게·기울임·밑줄·위첨자) 유실 0(15,618자), 각주 위치 불일치 0, 같은 자리 각주 둘·문단 첫머리·강조 속·보조평면 뒤·이모지 뒤·번호 없는 사사·여러 문단 각주 모두 보존. 각주 12개를 역할별(제목·부제·저자·초록·주제어·장 제목·절 제목·표 제목·참고문헌·영문초록·영문 주제어)로 단 시험은 52곳 모두 보존(`fn_roles.mjs`).
- 목차 있는/없는 원고, 초록이 뒤에 오는 원고(`lateabs`), 영문초록이 앞에 오는 원고(`absfirst`), 두 줄 제목(`twoline`)은 글자는 보존되나 F-01·F-06·F-07의 배치 문제가 보입니다.
- TXT 각주 `[^n]`는 번호 뒤 한 칸이 정확히 보태지고, 줄 끝 공백도 보존됩니다.

### 4.4 PDF 파싱본 40건 × 7곳 (280회)
- 파서·변환 오류 0, 경고 0. 문단 35,254, 글자 1,335,477(학회당 한 번 통과), 산출 쪽 수 평균 koli 54.0·ricc 22.9·mkliterature 27.4·sanghur 59.5·dongak 52.4·fcs 47.5·kochih 42.6.
- 누락·변형 문단(koli 기준): 머리말 줄 `skip` 15줄(768자, DOI 주소·학술지명·권호 등 의도된 것), 별표 소실 6건(F-03). 그 밖에 하네스가 `사라짐`으로 센 2건은 주제어 머리말 줄이 바탕틀 표기로 바뀐 것이며 값은 보존됨을 확인했습니다. 목차 줄이 있는 원고는 17건(F-01).

## 5. 실행한 명령과 수치

작업 디렉터리 `D:\project\투고틀`, 스크립트는 `tests/audit_sonnet_fid/`(이 디렉터리에서 실행).

| 목적 | 명령 | 결과 |
|---|---|---|
| 작가 원고 5편 × 52곳 | `for n in 1 2 3 4 5; do node run_files.mjs ../원고/paper$n.hwp all; done` | 260회, 위 4.1 |
| 공식 도구로 저장 | `node convert_copy.mjs ../원고/paper$n.hwp $(cat journals17.txt) --quiet` (tools/convert.mjs 사본; 산출 위치만 `conv/`) | 85개 HWP, 검증 줄: 본문 전부 보존·각주 일치 |
| 독립 HWP5 판독 | `python -X utf8 hwp5_indep.py <hwp> --json indep/…` (사본 `tests/audit_opus_fid/hwp5check.py`) | 원고 5+3, 산출 85, 오류 0 |
| 독립 판독 대조 | `node compare_indep.mjs`, `node pos_check.mjs`, `node digits_check.mjs`, `node miss_detail.mjs`, `node sec2_check.mjs` | 4.2의 수치 |
| 가상 원고 | `node run_synth.mjs all txt,docx,hwpx sample` (486회), `node run_synth.mjs kitchen,fnstress,ws,twoline,quotes txt,docx,hwpx all` (780회) | 1,266회, F-04·F-05·F-01 |
| PDF 파싱본 | `node run_files.mjs @pdf koli,ricc,mkliterature,sanghur,dongak,fcs,kochih` | 280회 |
| 마크다운 해석 영향 | `node txt_md.mjs` | 40건 중 6건, 52자(F-03) |
| 역할 배정 시험 | `node roles_test.mjs koli` | 217/264 일치, 37사례 중 23 FAIL |
| DOCX 구조 시험 | `node wild_docx.mjs`, `node wild_dump.mjs`, `node docx_pb.mjs` | F-08 |
| HWPX 요소 시험 | `node hwpx_special.mjs` | 하이픈·고정폭 공백·덧말 |
| 라벨 재인식 | `node rt_labels.mjs` | 9/52곳(104회) |
| 도구 | `node tools/verify_matrix.mjs --journals $(cat tests/audit_sonnet_fid/journals17.txt)`, `node tools/fidelity_test.mjs` | 17/17 통과, 12/12 일치 — F-01·F-02를 못 잡음 |

공식 도구와 하네스의 같은 논리 확인: `cmp_conv.mjs`(디스크 HWP와 하네스 결과 SHA-256 12/12 동일).

## 6. 한계 · 확인하지 못한 것
- **한컴오피스에서 실제로 열어 보지 못했습니다.** 옛한글(조합형 자모)·PUA 겹낫표·한양 PUA·이체자 선택자가 글꼴에 따라 제대로 보이는지, 번호 없는 각주(사사) 뒤 각주 번호가 1부터 매겨지는지(rhwp 렌더링에서는 첫 각주에 `1)`이 표시됨), `〻￨〻`·`󰠐` 라벨의 표시는 확인 못 함입니다.
- HWP 입력의 **각주 안 강조**는 rhwp API가 없어 읽지 못했습니다. HWP의 자동 번호(개요 번호)가 있는 원고는 작가 원고 5편에 없어 시험하지 못했습니다(독립 판독으로 paper1~5는 번호 문단 0 확인).
- DOCX는 실제 Word·한글이 저장한 파일이 아니라 제가 쓴 합성 파일입니다. 변경 추적·텍스트 상자·스타일은 구조 시험이며 실제 문서의 변형은 더 다양할 수 있습니다.
- `tests/원고/`의 `.docx`·`.hwpx`·제3자 `.hwp` 각 1건은 브리프 범위(paper1~5)가 아니라 쓰지 않았습니다.
- 학회별 목차 요구 여부(F-01 데이터)는 학회 규정을 확인하지 못했습니다.

## 7. 만든 파일 (모두 `tests/audit_sonnet_fid/` 아래, `src/` 등은 수정 없음)
- 가상 원고: `fixtures/`(kitchen·english·withtoc·lateabs·absfirst·twoline·ws·fnstress·quotes 각 .txt/.docx/.hwpx, wild.docx, pagebreak.docx, special.hwpx, md_misc.md, head_italic.txt, fn_roles.txt)
- 하네스: `lib.mjs`(앱 finalizeBlocks와 동일 순서), `analyze.mjs`, `spec.mjs`, `corpus.mjs`, `run_files.mjs`, `run_synth.mjs`, 독립 판독 `hwp5_indep.py`
- 제안 수정 사본: `patched/`(src 복사 + 적용 스크립트), 차이 `proposed_fixes.diff`
- 결과: `results_*.json`, `log_*.txt`, `conv/`(저장한 HWP 85개), `indep/`(독립 판독 JSON), `out/`(PDF 파싱본 koli 변환본)
