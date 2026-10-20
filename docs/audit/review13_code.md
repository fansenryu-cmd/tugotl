# 투고틀 v1.2 이후 변경 감사 보고서 (review13 · 코드)

> **반영 상태 (2026-10-20, v1.4 출시 전)**
> - H1 글상자 속 표: 표 자리 판정을 최상위 문단으로 좁히고 글상자 속 표는 원래 글로 되돌림 — 고침
> - M1 같은 자리의 각주·표 순서: 원고 컨트롤 순서(ord)로 정렬 — 고침
> - M2 표 축소 때 칸 안 그림 찌그러짐: 칸 안 그림은 가로세로·확대 행렬을 함께 줄임 — 고침
> - M3 Choice/Fallback 그림 중복: 새 형식이 있으면 대체 형식을 버림 — 고침
> - M4 빈 DOCX 표: 칸 없는 행을 버리고 행이 없으면 ‘옮기지 못함’으로 셈 — 고침
> - M5 소개 페이지의 32MB 미리 받기: 앱은 실제로 열 때만 저장, 새 판에서는 옛 캐시의 앱을 옮김 — 고침
> - M6 내어쓰기: 엔진이 Word식(−X, +X)을 한글식(−X, 0)으로 바꿔 씀(한글에서 첫 줄 0, 다음 줄 X 확인). cowol 85pt는 규정 ‘내어쓰기 30mm’ 그대로 — 고침
> - L1 세로 합친 칸의 이어진 칸 글: 위 칸 끝에 붙임 — 고침 / L3 주제어 뒤 표: 본문으로 보냄 — 고침 / L4 목차 표 오인: 첫 칸 첫 문단 전체가 목차 제목일 때만 — 고침 / L6 tcPr 없는 칸: 칸 맨 앞 tcPr만 읽음 — 고침
> - L2 판면보다 높은 그림, L5 수식 집계: 다음 판으로 미룸


- 대상: `git diff v1.2..92ef723` (감사 시작 시점 HEAD = 92ef723 "학회 108곳 추가"). 35개 파일, +4,496/−267
- 감사 방식: 코드 정독 + 실행 검증(Node 파이프라인, rhwp 재로드, 한글 2024 COM으로 PDF 변환해 눈으로 확인), 직접 만든 공격용 원고 21종
- 작업 폴더: `(로컬 임시 폴더 audit13)` (저장소 안은 아무것도 고치지 않음. 빌드·테스트가 원래 쓰는 `dist/`, `out/`만 갱신됨)
- **알림:** 감사 도중(22:5x~23:0x) 다른 작업자가 저장소를 바꿨습니다. 새 커밋 `ebeca72`, `d465829`가 생겼고 `src/engine.js`·`structure.js`·`journals.js`에 아직 커밋하지 않은 수정도 있습니다. 아래 지적은 모두 **현재 작업 트리에서 다시 확인**했습니다. `objects.js`·`parse.js`·`docxobj.js`·`site/`는 92ef723 이후 바뀌지 않았습니다. 줄 번호는 현재 작업 트리 기준입니다.

---

## 점수: 78 / 100

**근거**
- (+) 실제 원고에서 잘 동작합니다. 박사논문 diss.hwp는 4구역·211쪽에 각주 352개, 그림 12장, 표 3개가 있는데 각주 수·글·순서가 모두 맞고 그림 파일 12개가 모두 옮겨졌습니다. 작법서 jak.hwp(각주 30, 표 3), p1.hwp(각주 61, 표 1), fix.hwpx(칸·캡션 각주), tdoc.docx(vMerge·gridSpan·음영·그림)도 각주 누락 0건, 순서 어긋남 0건입니다.
- (+) 회귀 시험이 모두 통과합니다. `pipeline_test` 정상, `fidelity_test` 12/12, `verify_matrix` 190/190 학회 통과(306초), `roles_test koli` 259/264입니다. roles_test의 실패 3건은 v1.2 원본에서도 똑같이 나와 회귀가 아닙니다.
- (+) 공격용 HWPX 원고 대부분이 맞게 나왔습니다. 중첩 표, 2×2 칸 합치기, 구역 2개, 새 번호 지정(7부터), 쪽 기준 떠 있는 표, 캡션 각주, 빈 1×1 표, 문단 처음·중간·끝의 개체, 수식이 해당합니다. 각주 번호·순서가 맞고 한글에서도 열립니다. 산출 header의 itemCnt와 실제 항목 수가 일치하고, 끊긴 ID 참조와 빠진 BinData 참조는 0건입니다(25개 산출 전부 검사).
- (−) DOCX의 **글상자 안 표가 있는 문단은 그 문단 글과 각주가 소리 없이 사라집니다.** v1.2에서는 보존되던 것이라 회귀입니다(High).
- (−) 각주 번호 순서가 뒤집히는 경우(Medium), 표 안 그림의 가로세로 비율이 깨지는 경우(Medium), Word 그림 중복(Medium), 빈 표가 한글에서 빈 쪽을 만드는 경우(Medium), 소개 페이지가 32 MB를 미리 받는 문제(Medium)를 실제로 재현했습니다.
- (−) 새 학회 데이터 1건(cowol)은 참고문헌 내어쓰기 값이 비정상이라 한글에서 판면이 깨집니다.

---

## 지적 사항 (심각도 순)

### [H1] DOCX: 글상자(text box) 안에 표가 있으면 그 문단의 본문 글·각주가 통째로 사라짐 (v1.2 대비 회귀)
- 위치: `src/parse.js:304`(`stripElements(..., 'w:tbl', ...)`), `src/parse.js:348`(`/<w:tgobj .../>/.exec(body)`)
- 원인: 표 자리 표시 문단(`<w:p><w:r><w:tgobj/></w:r></w:p>`)을 문서 어디에서나 `w:tbl` 자리에 넣습니다. 글상자(`w:txbxContent`) 안의 표도 똑같이 바뀝니다. 그러면 바깥 문단 body 안에 tgobj가 들어가고, 348행이 바깥 문단 전체를 "표 자리 문단"으로 취급해 `continue`합니다. 그 문단의 글, 각주, 글상자 뒤 글이 모두 버려지고 경고도 나오지 않습니다. 한 표가 `mc:Choice`와 `mc:Fallback`에 두 번 들어 있어 `tables`도 2로 셉니다.
- 재현: `audit13/mkdocx2.mjs` → `adv/W3_txbx_table.docx`. 본문 "글상자 앞 본문 글이다. 중요한 내용이 있다.[각주 FN02] [글상자: 표] 글상자 뒤 본문 글."
  - 현재: 그 문단은 `[obj]` 하나로만 남습니다. FN02와 앞뒤 글이 빠져 한글 PDF에도 없고, 각주는 3개 중 2개만 남습니다. 경고는 "표 2개…를 옮깁니다"뿐입니다.
  - v1.2(`audit13/v12tree/w3.mjs`): 문단 글과 각주 1개가 보존됩니다.
- 기대: 본문 문단의 글과 각주는 보존해야 합니다. 글상자 속 표는 옮기지 못한다고 알리거나 문단 뒤로 빼야 합니다.
- 고칠 방법: `stripElements`로 표를 바꾸기 전에 `w:txbxContent`(그리고 `mc:Fallback`)를 먼저 걸러 내 최상위 `w:body`의 표만 바꿉니다. 아니면 tgobj 판정을 "문단 body가 tgobj 하나뿐인 경우"로 좁힙니다. 예: `/^\s*<w:r><w:tgobj w:k="\d+"\/><\/w:r>\s*$/`. 글상자 속 표는 `objLost`로 셉니다.

### [M1] 표만 있는 문단 바로 뒤의 본문 각주가 표 안 각주보다 앞 번호를 받음 (번호·위치 뒤바뀜)
- 위치: `src/engine.js:432`. 정렬 `a.at - c.at || (a.obj ? 1 : 0) - (c.obj ? 1 : 0) || a.k - c.k`
- 원인: 같은 글자 위치에서는 각주를 항상 개체보다 먼저 놓습니다. 글 없는 문단에 표가 있고 그 바로 뒤에 각주가 있으면 모두 offset 0이 됩니다. 그래서 본문 각주가 표 앞에 놓이고, 표 안 각주가 그 다음 번호를 받습니다.
- 재현: `adv/B_tie.hwpx`([표: 칸A+FN02] 바로 뒤 FN03)
  - 원고 순서: FN01 FN02 FN03 FN99
  - 산출: `FN01#1 FN03#2 FN02#3 FN99#4`. 한글 PDF(`hg/B_tie.pdf`)에서도 각주 표시 2)가 표 위 줄에 찍히고 칸 안은 3)입니다.
- 기대: FN02#2(칸 안) → FN03#3(표 뒤).
- 고칠 방법: 같은 위치에서는 원고의 컨트롤 순서를 따라야 합니다. parse 단계에서 각주·개체 모두에 컨트롤 순번(`ctrlK`)을 실어 두고 `at`, 그 다음 `seq`로 정렬합니다. DOCX도 런 순서로 seq를 주면 됩니다.

### [M2] 판면에 맞춰 표 폭을 줄일 때 칸 안 그림의 높이는 그대로라 그림이 찌그러짐
- 위치: `src/objects.js:145-148`(`fitWidth`의 `tbl` 갈래)
- 원인: 표를 줄일 때 `<hp:sz width=`는 전부 바꾸지만 높이는 바꾸지 않습니다. 칸 안 그림의 `hp:sz height`, `scaMatrix`, `imgRect`는 그대로라 그림 비율이 깨집니다(`curSz`만 양쪽을 줄임).
- 재현: `adv/E_widepic.hwpx`(폭 80000 표에 20000×10000 그림, 비율 2.0) → koli. 산출 그림은 `sz 7583×10000`, `curSz 7583×3792`이고, 한글 PDF의 그림 상자는 75.7×99.8pt(비율 0.758)입니다. DOCX(`W2_nested.docx`, 그림 비율 2.0)도 1.346으로 나옵니다. 화면: `hg/E_widepic_p0.png`
- 기대: 그림 비율이 유지돼야 합니다.
- 고칠 방법: `tbl` 갈래에서 표 안의 `<hp:pic>…</hp:pic>` 덩어리마다 `pic` 갈래(가로·세로 비례)를 적용합니다. 표 자신의 `sz`는 폭만 줄이면 됩니다.

### [M3] DOCX: `mc:AlternateContent`(Choice는 DrawingML, Fallback은 VML)인 그림이 두 장으로 들어감
- 위치: `src/docxobj.js:158`, `src/docxobj.js:167`(`drawingXml`이 `wp:inline/anchor`와 `w:pict`를 둘 다 수집)
- 재현: `adv/W4_altpic.docx`(그림 1장) → 산출 `pic 2`, `bins 2`, 한글 PDF에도 같은 그림이 두 장 있습니다. 그림 묶음(wpg)이면 첫 그림만 두 번 나오고 나머지는 빠질 수 있습니다. 글상자는 Choice와 Fallback에서 `lost`를 두 번 세어 경고 수가 두 배가 됩니다.
- 기대: 그림 1장.
- 고칠 방법: 런 XML에서 `<mc:Fallback>…</mc:Fallback>`을 먼저 지우고, Choice가 없을 때만 Fallback을 씁니다. `readPara`의 `runTokens`에도 같은 처리가 필요합니다(글상자 글이 두 번 읽힐 수 있음).

### [M4] DOCX 빈 표(행 0개, 또는 칸 없는 행)가 rowCnt=0 / 빈 `<hp:tr>`로 들어가 한글에서 빈 쪽이 생김
- 위치: `src/docxobj.js:150`(행·칸 검사 없이 표 생성)
- 재현: `adv/W5_empty.docx`(빈 `w:tbl` 2개). rhwp는 1쪽이라고 하지만, 한글 PDF는 5쪽이고 그중 2쪽과 4쪽이 빈 쪽입니다(`hg2/W5_empty.pdf`).
- 기대: 빈 표는 건너뛰고 알리거나 1×1 빈 표로 바꿔야 합니다.
- 고칠 방법: `tableXml`에서 `cells.length === 0`이면 null을 돌려 `objLost`로 처리하고, 칸 없는 `w:tr`은 버립니다. HWP 경로의 빈 1×1 표(`F_misc`)는 정상입니다.

### [M5] 소개 페이지 방문만으로 서비스 워커가 32 MB 앱을 미리 받음, 실행할 때마다 32 MB를 캐시에 다시 씀
- 위치: `site/sw.js:4`(CORE에 `투고틀.html` 포함), `site/index.html:78`(소개 페이지가 sw 등록), `site/sw.js:9`(network-first로 응답마다 `cache.put`)
- 관찰: `dist/투고틀.html`은 31.9 MB입니다. 소개 페이지만 열어도 install 단계에서 이 파일을 받습니다(휴대폰 데이터 소모). 앱을 열 때마다 32 MB 응답을 clone해 Cache Storage에 다시 씁니다. 오프라인일 때 이미지나 아이콘 요청이 실패하면 HTML 앱을 대신 돌려줘 content-type도 어긋납니다.
- 기대: 앱을 처음 열 때 받거나, 사용자가 "오프라인 설치"를 눌렀을 때만 받아야 합니다.
- 고칠 방법: 소개 페이지에서는 sw를 등록하지 않거나 CORE에서 앱 HTML을 빼고 앱이 처음 열릴 때 넣습니다. fetch에서는 `ETag`/`Last-Modified`가 같으면 put을 건너뛰거나 stale-while-revalidate로 바꿉니다. 대체 응답은 `req.mode === 'navigate'`일 때만 줍니다. 덧붙여 manifest의 `"purpose": "any maskable"`은 두 개로 나누는 게 권장이고, 앱 theme-color(#3f0e40)와 manifest(#1c1c1c)도 다릅니다.

### [M6] 새 학회 데이터 cowol: 참고문헌 내어쓰기 −85pt/왼쪽 85pt라 한글에서 둘째 줄이 60 mm 들어감
- 위치: `src/journals.js:3544`(cowol, `format.roles.ref = { indent: -85, marginLeft: 85 }`)
- 재현: `audit13/refind.mjs cowol` → `hg4/ref_cowol.pdf`. 판면 112 mm에서 참고문헌 첫 줄이 +30 mm, 다음 줄이 +60 mm에서 시작합니다(`hg4/ref_cowol_p0.png`). 학회 layout 글에는 참고문헌 내어쓰기 규정이 없습니다.
- 기대: 다른 학회처럼 −20~−30pt 수준이거나, 규정이 없으면 비워야 합니다. 단위를 잘못 옮긴 것으로 보입니다(8.5 또는 mm 혼동).
- 함께 볼 것: 한글 실측으로 `(indent:-X, marginLeft:+X)`은 첫 줄 +X, 다음 줄 +2X로 그려집니다. `(-X, 0)`은 첫 줄이 여백에 붙고 다음 줄이 +X입니다. 새 항목 중 kcj(−55, 없음), koreacheongram(−52.3, 0), dakll·khallyu·jcct·pmcs(−X, 없음)는 기존 학회 대부분의 `(-X, +X)`와 해석이 다릅니다. 각 학회 규정이 "왼쪽 여백 X + 내어쓰기 X"인지 "내어쓰기 X"인지 다시 대조해야 합니다(규칙 재수집이 아니라 표기 관례의 통일 문제).

### [L1] DOCX vMerge 이어짐 칸의 내용(글·각주)이 경고 없이 버려짐
- 위치: `src/docxobj.js:112`(`vmVal === 'continue'`이면 칸을 건너뜀)
- 재현: `W1_vmerge.docx` 이어짐 칸의 "이어짐 칸의 숨은 글"과 FN04 → 산출 각주 7개(원고 8개). 경고가 없고 parse 단계의 footnotes 수에서도 빠집니다.
- 참고: Word는 이어짐 칸의 내용을 보통 보여 주지 않지만, 다른 프로그램이 만든 DOCX에는 들어 있을 수 있습니다. 3행 vMerge, gridSpan, 음영, 테두리 자체는 한글에서 정확합니다(`hg2/W1_vmerge_p0.png`).
- 고칠 방법: 이어짐 칸에 글이나 각주가 있으면 위 칸 parts 뒤에 붙이거나 경고를 냅니다.

### [L2] 판면보다 높은 그림은 높이를 확인하지 않아 쪽 아래 여백(꼬리말 영역)까지 내려감
- 위치: `src/objects.js:139`(`fitWidth`는 폭만 봄), `engine.js`의 `pageW`도 폭만 계산
- 재현: `adv/N_tall.hwpx`(42000×59400 그림) → koli에서 30898×43699로 줄지만 본문 높이는 41956입니다. 한글 PDF에서 그림이 y=117~554pt로, 본문 끝(약 532pt)을 22pt 넘습니다. 실제 diss의 인준서 그림(→30898×43650)도 같은 상황입니다.
- 고칠 방법: `pageH = height − top − bottom − header − footer`도 구해 `f = min(폭 비, 높이 비)`를 씁니다. 그림만 해당하고, 표는 쪽 나눔이 되므로 제외합니다.

### [L3] 주제어와 첫 장 제목 사이에 둔 표·그림·캡션이 국문초록 묶음을 따라 참고문헌 뒤로 옮겨짐
- 위치: `src/structure.js:232`(`FLOAT_ROLES.has(b.role) && cur`), `src/engine.js`의 같은 묶음 상속
- 재현: `adv/J_float_after_kw.hwpx`(국문초록 → 주제어 → [표] → `<표 1>` → Ⅰ. 서론) → gubo(초록을 참고문헌 뒤에 두는 학회). 산출 순서는 `… refHead ref abstractHead abstract keywords object caption abstractEn …`이고, 연구 모형 표가 참고문헌 뒤 초록에 붙습니다.
- 기대: 주제어 뒤의 개체는 본문 시작으로 보는 편이 안전합니다.
- 고칠 방법: 앞 묶음이 `abstractKo`/`abstractEn`/`front`이고 다음 비어 있지 않은 블록이 body 묶음이면 body로 넣습니다(뒤 묶음 기준). 아니면 초록 묶음은 상속에서 뺍니다.

### [L4] 목차 표 판정이 느슨해 첫 칸이 "Contents…", "차례…"로 시작하는 일반 표도 목차로 봄 → 목차 자동 생성을 건너뜀
- 위치: `src/objects.js:60`(정규식 끝 고정 없음, 칸 글을 구분자 없이 이어 붙임)
- 예: 첫 칸이 "Contents"(내용 분석 표)나 "차례 | 내용"이면 `info.toc = true`가 됩니다. 그 결과 `buildToc`가 "원고에 목차 있음"으로 건너뛰고, 현재 작업 트리의 미커밋 수정으로는 그 표가 목차 묶음으로 옮겨지기까지 합니다.
- 고칠 방법: 첫 칸 글 전체가 목차 제목 꼴(`^…(목차|차례|contents)…$`)이고, 다음 칸들에 장 번호 꼴이 2개 이상 있을 때만 목차로 봅니다.

### [L5] 개수·이름 표시가 어긋남
- 수식이 "도형"으로 집계됩니다. 경고 문구가 "도형 2개"입니다(`src/parse.js:92`, `objects.js`의 stats). 구조 표에는 "수식"으로 나옵니다.
- 표 안 그림은 HWP 경로에서는 "그림 0개", DOCX 경로에서는 "그림 1개"로 세고, 엔진 로그는 둘 다 "그림 0개 옮김 (그림 파일 1개)"입니다(`W2_nested`, `E_widepic`).
- fix.hwpx는 parse 경고에서 "안의 각주 2개", 엔진 로그에서 "안의 각주 1개"입니다(캡션 각주를 세는지 여부 차이).
- 고칠 방법: kind별 집계에 `equation`을 따로 두고, 그림 수는 같은 기준(최상위만 또는 전부)으로 맞춥니다.

### [L6] DOCX: tcPr 없는 칸이 칸 안 중첩 표의 tcPr(gridSpan 등)을 자기 것으로 읽음
- 위치: `src/docxobj.js:108`(`elements(tc.body, 'w:tcPr')[0]`가 깊이와 상관없이 첫 tcPr을 찾음)
- 재현: `W6_noTcPr.docx` → 바깥 표가 grid 3열인데 `colCnt=4`가 되고 첫 칸 colSpan=2로 잘못 나옵니다.
- 고칠 방법: tc 본문의 첫 자식이 `<w:tcPr`일 때만 씁니다(`/^\s*<w:tcPr\b/`).

### [정보] 감사 중 확인한 그 밖의 사항
- `importer`는 res마다 header 기준 번호를 미리 잡습니다(`makeImporter`의 `next`). 원고 자원이 두 개 이상 섞이는 경로가 생기면 ID가 겹칩니다. 지금은 원고 1개라 문제없지만 주석으로 못 박아 두는 게 좋습니다.
- 각주 안 표(HWP)는 예전처럼 경고 없이 버려집니다(이번 변경 범위 밖, 기존 동작).
- 새 학회 108곳 중 8곳(ccs, cocri, hnlal, honamhak, island, ivctp, jkch, pnufi)은 `format.page`가 없습니다. 이 경우 빈 문서의 기본 용지를 쓰므로 "용지 규정 미확인"을 화면에 알리면 좋습니다.
- koen의 structure는 `[abstractEn, body, references, front, abstractKo]`입니다(국문 제목부가 참고문헌 뒤). structureText와 일치하는 의도된 값으로 보이지만, 유일하게 front로 시작하지 않는 항목이라 적어 둡니다.

---

## 확인한 정상 동작
- **HWP/HWPX 개체 옮기기**
  - 표·그림 XML 이식, charPr·paraPr·borderFill·tabPr·numbering을 학회 header로 옮기기, BinData와 content.hpf 항목 추가: 25개 산출 모두 itemCnt가 항목 수와 같고 끊긴 참조가 없습니다.
  - 캡션을 학회 캡션 모양으로 바꾸기, 쪽 기준 떠 있는 표를 문단 기준으로 옮기기(F_misc), 판면 폭 맞춤(표·그림·나란한 그림 두 장 H_pics의 비율 1.498 유지)
- **각주**
  - 표 칸 안 각주, 중첩 표 안 각주(C_nested), 합친 칸 각주(D_merge), 새 번호 지정 7부터(I_newnum: #7, #8, #9)
  - 둘째 구역의 표 안 각주(G_sections), 캡션 각주를 개체 바로 뒤로 옮기기
  - 묶음 빈칸을 `<hp:nbSpace/>`로 왕복
- **DOCX 표**: 3행 vMerge와 gridSpan, 셀 음영(FFCC00), 표·스타일 테두리, 칸 안 각주 번호의 문서 순서, 칸 안 그림 바이트 옮기기
- **구조 인식**: 개체만 있는 문단은 object, 바로 밑 "자료:"는 objNote, `<목 차>` 표는 목차 자동 생성 생략(L_toc_table), 수식 이식(한글 렌더 정상), applySubstitutions·표지 문구 바꿈에 따른 개체 offset 옮기기 코드
- **한글 2024 실측**: 산출 15종을 COM으로 열어 PDF 변환하면 모두 열립니다(W6만 일괄 처리에서 시간 초과, 단독으로는 정상).
- **회귀 시험**
  - pipeline_test, fidelity_test 12/12, verify_matrix 190/190
  - roles_test 259/264(v1.2와 같은 실패 3건)
- **모바일 UI**(375×812 에뮬레이션, `dist/tugotl.html`을 로컬 서버로 엶)
  - 스플래시 → 서랍 메뉴(분야 거르기 포함) → 파일 열기 → 원고 구조/결과 탭 → 아래 고정 버튼 막대 → 적용 → 완료 카드 → 미리보기
  - 가로 넘침 없음(scrollWidth 375), 콘솔 오류 없음
  - SW 등록은 https에서만 하므로 file:// 배포본에 영향이 없습니다.
- **빌드**: 이미지를 data: 주소로 넣기(약 200 KB), `tugotl.html` 같은 내용 복제본, sha256
- **journals.js 새 108곳 스키마**
  - id 중복 0, 모든 학회에 분야(AREA_OF)가 있고 잘못된 분야 ID 0
  - structure 값이 모두 SECTION_LABELS 안에 있음
  - pageUnit ∈ {쪽, 면, p., pp., keep}, 범위 기호 ∈ {-, ~, ∼, ～, –, －}
  - 글자 크기 6~30pt, 줄 간격 80~300%, 용지·여백 정상 범위(cowol 참고문헌 들여쓰기만 예외)

## 재현 자료 (모두 `(로컬 임시 폴더 audit13)`)
- `mkadv.mjs`, `mkadv2.mjs`, `mkadv3.mjs`: 공격용 HWPX 생성 / `mkdocx2.mjs`: 공격용 DOCX 생성 / `adv/`: 생성된 원고
- `radv.mjs`(원고 ↔ 산출 각주 순서·번호 대조), `h.mjs`, `hdrchk.mjs`(header·참조 무결성), `jchk.mjs`, `jchk2.mjs`(학회 스키마), `refind.mjs`
- `out/`: 산출 HWP·HWPX / `hg*/`: 한글 PDF·PNG / `v12tree/`: v1.2 원본 비교
- 로그: `pipeline.log`, `fidelity.log`, `matrix.log`, `roles.log`

---

## 요약
1. **[High·회귀] DOCX 글상자 안에 표가 있으면, 그 표를 품은 본문 문단의 글과 각주가 경고 없이 사라집니다.** `parse.js:304/348`의 표 자리 표시가 글상자 속 표에도 적용되기 때문입니다. v1.2에서는 보존되던 것입니다.
2. **[Medium] 표만 있는 문단 바로 뒤에 각주가 있으면 각주 번호가 뒤바뀝니다.** `engine.js:432`가 같은 위치에서 각주를 항상 개체보다 앞에 놓습니다. 원고의 컨트롤 순서로 정렬해야 합니다.
3. **[Medium] 넓은 표를 판면에 맞춰 줄이면 칸 안 그림이 세로로 찌그러집니다.** `objects.js` fitWidth가 칸 안 그림의 높이·행렬을 줄이지 않습니다. 한글 실측 비율이 2.0에서 0.76으로 바뀌었습니다.
4. **[Medium] 그 밖의 재현 결함**
   - Word의 AlternateContent 그림이 두 장으로 들어갑니다.
   - DOCX 빈 표가 한글에서 빈 쪽을 만듭니다.
   - 소개 페이지 서비스 워커가 32 MB 앱을 미리 받습니다.
   - 새 학회 cowol의 참고문헌 내어쓰기 값(−85/85pt)이 판면을 깨뜨립니다.
5. 그 밖의 주요 기능은 실제 원고와 공격용 원고, 한글 2024 실측에서 모두 정상이었습니다. 점수는 **78/100**입니다.
