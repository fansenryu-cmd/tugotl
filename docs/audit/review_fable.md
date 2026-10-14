# 투고틀 독립 품질 감사 보고서 (Fable) — 변환 정확성·학회 규정 준수·구조 인식·서지 변환

- 감사 일시: 2026-10-13 12:10 ~ 13:35 KST. 감사 대상 코드: `src/` (읽기 전용). 감사 도중 저장소가 여러 번 바뀌었으므로(13:09 engine.js HWPX 직접 생성, 13:17 parse.js 다중 구역·입력 상한, 13:18 structure.js O(n²) 제거, 13:26 "감사 대응 2차" cite.js·structure.js) **모든 수치는 마지막 커밋 `2360f40`(13:26) 기준으로 다시 돌린 값**이고, 그 이전 코드로 재현한 항목은 따로 표시했다.
- 시험 재료: `tests/원고/` 7편(paper1~5 HWP, 자료지도 DOCX·HWPX; 28,386문단 자료 덤프 2편은 논문이 아니라 제외) + `tests/원고_pdf/` 40편 = 원고 47종 × 학회 35곳 = **1,645건** 일괄 변환(`tests/report_fable_full_tpl.json`, `tests/report_fable_full_fmt.json`). 그 밖에 학회별 산출물 서식 대조 54건(`tests/out/comply_*.hwp`), 서지 변환 표본 58건 + 원고 추출 364건, 구조 인식 PDF 40편.
- 감사용 스크립트와 산출(재현용): `tests/out/audit_fable/` (comply.mjs · struct_pdf.mjs · cite_test.mjs · regex_probe.mjs · aggregate.mjs와 각 결과 .out).
- 감사자 실수 고지: 12:5x에 CPU 경합을 줄이려고 제가 띄운 batch 프로세스를 정리하면서 **같은 이름의 다른 프로세스 `node tools/batch.mjs --out tests/report_full.json`(PID 34064)도 함께 종료**시켰습니다. 그 결과 파일은 만들어지지 않았으니 필요하면 다시 돌려 주십시오.

---

## 1. 요약

### 총점 **69 / 100**

| 항목 | 배점 | 점수 | 근거 한 줄 |
|---|---:|---:|---|
| 변환 정확성(내용 보존·각주) | 40 | 33 | HWP 논문 5편 × 35곳 = 175건 각주 불일치 0·누락 문단 0·강조 유지. 감점: ktla 영문초록 문단마다 쪽 나눔(F-1), 혼합 각주의 서양 문헌 `p.`→`쪽` 오치환(F-7), 쪽수 치환 시 참고문헌 강조 런 폐기(F-8), PDF 추출 TXT는 줄마다 문단이 되어 실용성 없음(F-9) |
| 학회 규정 준수 | 30 | 21 | 규정값 학회 16곳: 용지·여백·글꼴·크기·정렬·줄간격·들여쓰기·자간·장평·각주 모두 journals.js와 일치. 바탕틀 학회 19곳 중 18곳 일치, koli는 저자·국문초록 제목 크기가 바탕틀과 다름(F-2). 빈 줄 규칙 `after초록/after참고문헌` 이 문단마다 적용돼 14곳에서 초록 단락·참고문헌 항목 사이에 빈 줄(F-3). 쪽 범위 기호(~/-/–) 학회별 미정규화(F-10) |
| 구조 인식 | 20 | 10 | HWP 논문은 제목·저자·초록·주제어·장·참고문헌·영문초록 전부 인식. PDF 추출 TXT 40편은 제목 0/40 정상(DOI·라이선스·머리말이 첫 줄), 각주 본문 `n) …`을 절 제목으로(30편), 줄바꿈 조각 `다. …`를 목 제목으로(25편), 참고문헌 분류에 연도 조각 등(F-4·F-5·F-6). 13:26 수정으로 영문초록 선행 원고는 개선됐으나 PDF표본 본문 문장이 제목·저자로 잡히는 역행(F-4-③) |
| 서지 변환(APA·Chicago) | 10 | 5 | 표본 58건 중 변환 31, 미인식 25(학위논문·서양·신문·웹·법령은 설계상 미지원). 13:26에 추가된 "모르는 요소가 남으면 변환 안 함" 보호 장치가 **`/d/`(글자 d) 오타**로 숫자 검사가 안 되고 'd'가 든 출판사(Random House)를 거부함(F-11). 편저 속 논문·신문 기사·판차·역자 후치 서지가 깨진 채 변환됨(F-12) |

### 학회별 점수표 (변환 40 · 규정 30 · 구조 20 · 서지 10)

구조 인식과 서지 변환은 학회와 무관하게 같은 코드가 돌므로 모든 학회 10·5점. 변환은 ktla만 감점. 규정 준수는 아래 발견 항목을 학회별로 반영.

| 학회 | 유형 | 변환 | 규정 | 구조 | 서지 | 합계 | 규정 감점 사유 |
|---|---|---:|---:|---:|---:|---:|---|
| koli 한국문예창작 | 바탕틀 | 33 | 24 | 10 | 5 | 72 | 저자 11→10pt, 국문초록 제목 12→10pt(F-2) |
| daejung 대중서사연구 | 바탕틀 | 33 | 28 | 10 | 5 | 76 | — |
| eastasia 동아시아문화연구 | 바탕틀 | 33 | 25 | 10 | 5 | 73 | 초록·영문초록 단락 사이 빈 줄(F-3) |
| fcs 미래문화 | 바탕틀 | 33 | 26 | 10 | 5 | 74 | 영문초록 단락 사이 빈 줄(F-3) |
| interlali 국제언어문학 | 바탕틀 | 33 | 26 | 10 | 5 | 74 | 영문초록 단락 사이 빈 줄(F-3) |
| gubo 구보학보 | 바탕틀 | 33 | 26 | 10 | 5 | 74 | 초록 단락 사이 빈 줄(F-3) |
| anim 애니메이션연구 | 바탕틀 | 33 | 25 | 10 | 5 | 73 | 초록·영문초록 단락 사이 빈 줄(F-3) |
| koreanst 사이間SAI | 바탕틀 | 33 | 25 | 10 | 5 | 73 | 초록·영문초록 단락 사이 빈 줄(F-3) |
| korlanlit 국어국문학 | 바탕틀 | 33 | 26 | 10 | 5 | 74 | 영문초록 단락 사이 빈 줄(F-3) |
| korliter 한국문학이론과 비평 | 바탕틀 | 33 | 25 | 10 | 5 | 73 | 초록·영문초록 단락 사이 빈 줄(F-3) |
| postcriticism 한국문예비평연구 | 바탕틀 | 33 | 23 | 10 | 5 | 71 | 초록 단락 사이 빈 줄 2개 — "국문초록 3단락" 규정과 정면 충돌(F-3) |
| kopoetics 한국시학연구 | 바탕틀 | 33 | 23 | 10 | 5 | 71 | 참고문헌 항목마다 빈 줄(afterRef:1), 초록 단락 사이 빈 줄(F-3) |
| klc 비평문학 | 바탕틀 | 33 | 24 | 10 | 5 | 72 | 영문초록 단락 사이 빈 줄 2개, 초록 단락 사이 빈 줄(F-3) |
| aagcc 글로벌문화콘텐츠 | 바탕틀 | 33 | 28 | 10 | 5 | 76 | — |
| iall 국제어문 (2구역) | 바탕틀 | 33 | 26 | 10 | 5 | 74 | 영문초록 단락 사이 빈 줄(F-3). 2구역→1구역 통일·용지 유지 정상 |
| litheory 현대문학이론연구 | 바탕틀 | 33 | 26 | 10 | 5 | 74 | 영문초록 단락 사이 빈 줄(F-3) |
| dongak 동악어문학 (스타일) | 바탕틀 | 33 | 28 | 10 | 5 | 76 | — |
| kochih 한중인문학연구 (2구역) | 바탕틀 | 33 | 25 | 10 | 5 | 73 | 초록·영문초록 단락 사이 빈 줄(F-3) |
| koreacontents 한국콘텐츠학회논문지 (스타일) | 바탕틀 | 33 | 28 | 10 | 5 | 76 | — |
| klnc 한국언어문화 | 규정값 | 33 | 27 | 10 | 5 | 75 | h4·titleEn·dates 역할 서식 없음(h3·title·body로 대체) |
| childlit 아동청소년문학연구 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| urilit 우리文學硏究 | 규정값 | 33 | 27 | 10 | 5 | 75 | 각주 `indent:27`(양수 들여쓰기)만 있고 내어쓰기·왼쪽 여백 없음 — 규정 "각주 3" 해석 확인 필요 |
| korlit 한국근대문학연구 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| kcomplit 비교문학 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| kslt 문학치료연구 | 규정값 | 33 | 26 | 10 | 5 | 74 | 여백 위아래 56·좌우 53 mm가 `docs/학회조사`의 "위아래 20 좌우 30"과 다름(F-13), h4 없음 |
| eomun 어문연구 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| hangomun 고전문학연구 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| storyimage 스토리앤이미지텔링 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| ricc 문화콘텐츠연구 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| jicc 영상문화콘텐츠연구 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| ktla 한국문학과 예술 | 규정값 | 30 | 22 | 10 | 5 | 67 | abstractEnHead의 pageBreakBefore가 titleEn2·authorEn·abstractEn·keywordsEn·dates에 상속되어 영문초록 문단마다 새 쪽(F-1) |
| donam 돈암어문학 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| eomunlon 어문론총 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| kolali 국어문학 | 규정값 | 33 | 28 | 10 | 5 | 76 | — |
| kles 어문연구(語文硏究) | 규정값 | 33 | 28 | 10 | 5 | 76 | — |

### 즉시 고칠 것 (우선순위)

1. **F-1 ktla 쪽 나눔 상속** — `engine.js paraPropsOf()`가 `pageBreakBefore`를 명시적으로 끄지 않아, 서식 등록용 임시 문단을 `splitParagraph`로 이어 만들 때 앞 역할(abstractEnHead)의 쪽 나눔이 뒤 역할 전부에 남는다. paper1→ktla 산출 39쪽 중 영문초록 7문단이 각각 새 쪽(p109~p115 모두 `pageBreakBefore=true`), PDF표본는 769쪽.
2. **F-2 koli 저자·국문초록 제목 크기** — `resolveRoles()`가 예시 문단의 두 번째 글자 모양을 읽는데 koli 바탕틀 p5 `"  저자명*"`·p14 `"  국문 요약"`은 앞 공백이 두 개여서 10pt(공백 모양)를 가져온다. 기대 11pt·맑은 고딕 12pt 굵게 → 실제 10pt.
3. **F-3 빈 줄 규칙의 단위** — `applyBlanks()`의 `after<Role>`이 문단마다 적용된다. 바탕틀에서 읽어 둔 `afterAbstract:1`(초록 뒤 한 줄)이 초록 단락 사이마다 들어가고, kopoetics `afterRef:1`은 참고문헌 항목마다 빈 줄을 넣는다. 14곳 영향.
4. **F-11 cite.js 보호 장치 오타** — 13:26 커밋의 `/d/`·`/^(제s*)?d+s*(판|쇄)$/`는 `\d`·`\s`가 빠진 문자 그대로의 d·s이다. 숫자가 남은 토큰("pp.56-62 참조", "2판", "19‒37쪽")은 그대로 통과해 깨진 서지가 나오고, 'd'가 든 출판사("Random House Korea", "도서출판 bd")는 전부 거부된다.
5. **F-4 PDF 추출 원고 앞부분** — DOI·라이선스·학술지 머리말이 첫 줄이면 그대로 제목이 되고, 두 줄 제목의 둘째 줄은 저자가 된다(40편 중 제목 정상 0편). `frontJunk` 필터와 "제목 이어짓기" 규칙 추가.
6. **F-5 각주 본문 `n) 저자, 「…」, 2020, 12쪽.`을 절 제목으로** — PDF 추출 원고 30편에서 h2가 수십 개씩 생긴다. 쉼표+연도/쪽/낫표/앞의·위의·URL이 든 `n)` 줄은 본문으로.

---

## 2. 발견 목록 (심각도순)

표기: **[높음]** 산출물이 투고 규정에 어긋나거나 내용이 손상됨 · **[중간]** 눈에 띄는 서식·인식 오류 · **[낮음]** 개선 제안.

### F-1 [높음] ktla — 영문초록 문단마다 새 쪽으로 밀림 (pageBreakBefore 상속)
- 위치: `src/engine.js` `paraPropsOf()`(`if (fmt.pageBreakBefore) p.pageBreakBefore = true;` — 거짓일 때 끄지 않음) + `resolveRoles()`의 `fromFormat()`(마지막 문단을 `splitParagraph`로 나눠 임시 문단을 만들므로 직전 역할의 문단 모양을 물려받음). `need` 순서가 `abstractEnHead → titleEn2 → authorEn → abstractEn → keywordsEn → dates → footnote`라서 ktla(`abstractEnHead.pageBreakBefore:true`)에서 그 뒤 역할 전부가 쪽 나눔을 갖는다.
- 재현: `node tests/out/audit_fable/comply.mjs tests/원고/paper1.hwp ktla` 후
  ```
  node -e "import('./src/engine.js').then(async({initEngine,HwpDocument})=>{const fs=await import('node:fs');await initEngine(fs.readFileSync('node_modules/@rhwp/core/rhwp_bg.wasm'));const d=new HwpDocument(new Uint8Array(fs.readFileSync('tests/out/comply_paper1_ktla.hwp')));for(let i=0;i<d.getParagraphCount(0);i++){const pp=JSON.parse(d.getParaPropertiesAt(0,i));if(pp.pageBreakBefore)console.log(i,d.getTextRange(0,i,0,30));}})"
  ```
- 기대: `＜Abstract＞` 한 곳만 새 쪽. 실제: p109 `＜Abstract＞`, p110 영문 제목, p111~p114 영문초록 4단락, p115 Keywords 전부 `pageBreakBefore=true` → paper1 39쪽(donam 31쪽), PDF표본 **769쪽**(donam 53쪽), PDF표본 740쪽. 각주 서식(`footnote`)도 같은 순서로 뒤에 만들어지므로 각주 문단 모양에도 상속될 가능성이 있다(HWPX paraPr 확인 권장).
- 수정 제안 (`engine.js paraPropsOf`):
  ```js
  function paraPropsOf(fmt) {
    const p = { alignment: fmt.align || 'justify', lineSpacing: fmt.lineSpacing || 160, lineSpacingType: 'Percent',
      indent: U.margin(fmt.indent || 0), marginLeft: U.margin(fmt.marginLeft || 0), marginRight: U.margin(fmt.marginRight || 0),
      spacingBefore: U.spacing(fmt.spacingBefore || 0), spacingAfter: U.spacing(fmt.spacingAfter || 0),
      pageBreakBefore: !!fmt.pageBreakBefore,          // 항상 명시 — 임시 문단이 앞 역할의 쪽 나눔을 물려받지 않도록
      keepWithNext: false, widowOrphan: false };
    return p;
  }
  ```
  rhwp가 `pageBreakBefore:false`를 무시한다면 `fromFormat()`에서 임시 문단을 만든 직후 `doc.applyParaFormat(0, idx, JSON.stringify({ pageBreakBefore: false }))`를 먼저 호출하거나, 임시 문단을 항상 바탕글(스타일 0) 빈 문단에서 갈라 만든다.

### F-2 [높음] koli — 저자 11pt→10pt, 국문초록 제목 12pt 굵게→10pt 굵게 (예시 문단 앞 공백 2개)
- 위치: `src/engine.js resolveRoles()` `const txt = doc.getTextRange(sec, i, 0, Math.min(2, len)); const off = txt.length > 1 && /\s/.test(txt[0]) ? 1 : 0;` — 두 글자만 읽고 앞 공백이 한 개라고 가정. `analyzeTemplate()`도 같다.
- 바탕틀 실측(`templates/koli.hwp`): p5 `"  저자명*  "` 런 = `[0-1 cs10 10pt][1-2 cs9 10pt][2-5 cs51 11pt]…`, p14 `"  국문 요약    "` = `[0-2 맑은 고딕 10pt B][2-7 맑은 고딕 12pt B]`. 엔진은 offset 1(공백)의 cs9·cs24를 가져간다.
- 재현: `node tests/out/audit_fable/comply.mjs tests/원고/paper2.hwp koli` → `✗ author size 기대 11 실제 10`, `✗ abstractHead size 기대 12 실제 10`. `node tools/outcheck.mjs tests/out/comply_paper2_koli.hwp "이융희" "＜국문초록＞"` → `sz=10`, `sz=10`.
- 전 바탕틀 검사(아래 스크립트): koli 두 역할만 영향. kochih `keywords` p12도 앞 공백 2개지만 두 모양이 같아 무해.
  ```
  node -e "…for each template role spec.para: compare getCharPropertiesAt(off=engine) vs getCharPropertiesAt(text.search(/\S/))…"  (tests/out/audit_fable 참고)
  ```
- 수정 제안 (`engine.js`, `resolveRoles`·`analyzeTemplate` 두 곳):
  ```js
  const full = doc.getTextRange(sec, i, 0, doc.getParagraphLength(sec, i));
  const off = Math.max(0, full.search(/\S/));        // 첫 비공백 글자의 모양을 읽는다
  const cp = J(doc.getCharPropertiesAt(sec, i, off)) || {};
  ```

### F-3 [높음] 빈 줄 규칙 `after<Role>`이 문단마다 적용 — 초록 단락·참고문헌 항목 사이에 빈 줄
- 위치: `src/structure.js applyBlanks()` `const after = rules[\`after${cap(prev.role)}\`] || 0;` — 같은 역할이 이어져도 적용.
- 바탕틀 실측: eastasia p16 초록(1문단)·p17 빈 줄·p18 주제어, postcriticism p5~p9 초록·p10~11 빈 줄·p12 핵심어, kopoetics p55~p62 참고문헌 **항목 사이 빈 줄 없음**·p63~64 빈 줄·p65 주제어. 즉 규칙의 뜻은 "묶음 뒤"인데 구현은 "문단 뒤".
- 재현: `node tests/out/audit_fable/comply.mjs tests/원고/paper2.hwp postcriticism,kopoetics,eastasia,klc` 의 역할 순서 출력
  - postcriticism(`afterAbstract:2`): `abstractHead abstract · · abstract · · abstract · · keywords` — 규정 "국문초록 3단락"의 단락 사이에 빈 줄 2개
  - kopoetics(`afterRef:1`): `refHead refSub ref · ref · ref …` — 참고문헌 항목마다 빈 줄
  - eastasia·anim·koreanst·korliter·kochih(`afterAbstract:1` + `afterAbstractEn:1`), fcs·interlali·korlanlit·iall·litheory(`afterAbstractEn:1`), klc(`afterAbstractEn:2`), gubo(`afterAbstract:1`)
- 수정 제안 (`applyBlanks.want`):
  ```js
  const sameRun = prev.role === b.role;                       // 같은 역할이 이어지는 중
  const before = sameRun ? 0 : (rules[`before${cap(b.role)}`] || 0);
  const after  = sameRun ? 0 : (rules[`after${cap(prev.role)}`] || 0);
  n = Math.max(before, after);
  ```
  `afterRef:0`(korlanlit·koreanst)과 `afterH1`·`afterH2`는 이어지는 역할이 다르므로 영향 없음. 항목 사이 빈 줄이 정말 필요한 학회가 생기면 `betweenRef` 같은 별도 키를 두는 편이 안전하다.

### F-4 [높음] PDF 추출 원고의 앞부분 인식 — 제목 0/40, 저자 오인, "1)"이 영문 제목
- 위치: `src/structure.js recognize()` front 상태. `if (!sawTitle) { push('title', '첫 문단') }`(첫 줄 무조건 제목) · `push(sawTitle && !author ? 'author' : 'body', '앞부분 짧은 줄')`(저자 형태가 아니어도 저자) · `RE.latin.test(t) && short`(`1)`도 영문 제목) · `RE.subtitlePrefix`(`- iii -` 쪽 번호 줄을 부제).
- 재현: `node tests/out/audit_fable/struct_pdf.mjs` → `tests/out/audit_fable/struct_pdf_v2.out`
  - ① 첫 줄이 DOI·머리말·라이선스: PDF표본 `title=https://doi.org/10.18856/…`, PDF표본 `title=289 Vol.69 No.2 Studies in Humanities…`, 웹스토리IP `title=문화산업연구 제26권 제1호(2026년 3월), ISSN…`, 웹소설의_드라마_전용 `title=Accessed : Wednesday, May 20, 2026…`, 학위논문 4편 `title=저작자표시-비영리-변경금지 2.0 대한민국` / `author=PDF표본`
  - ② 두 줄 제목의 둘째 줄이 저자: PDF표본 `author=PDF표본`, PDF표본 `author=PDF표본`, PDF표본·PDF표본·PDF표본·PDF표본 동일. 실제 저자 `PDF표본`는 그 뒤 두 번째 author로 잡힘.
  - ③ (13:26 수정 뒤 새로 생김) 영문초록 선행 원고에서 `state='front'; i--`로 돌아올 때 `sawTitle=false`라 **첫 한글 본문 문장이 제목·저자**가 됨: PDF표본 `title=#54 서사를 기반으로 하며, 회차 단위로 장기간 연재되는`, `author=PDF표본`. 수정 전에는 abstractEn×723, 수정 후 본문은 살았지만 제목·저자가 틀림.
  - ④ 각주 번호 줄 `1)`이 영문 제목(titleEn): 대중서사연구 5편.
  - ⑤ 쪽 번호 줄 `- iii -`, `- i -`가 부제: 학위논문 3편.
- 수정 제안 (`structure.js`):
  ```js
  // RE에 추가
  frontJunk: /^(?:https?:\/\/|doi\s*:|www\.)|ISSN|\bVol\.\s*\d|\bNo\.\s*\d|저작자표시|^Accessed\s*:|제\s*\d+\s*권\s*제?\s*\d*\s*호|^\d{1,4}\s{1,3}\S|^\d{1,3}\)$/i,
  pageNumLine: /^[-–—]?\s*(?:[ivxlc]{1,6}|\d{1,4})\s*[-–—]?$/i,
  // front 상태 맨 앞
  if (RE.frontJunk.test(t) || RE.pageNumLine.test(t)) { push('skip', '머리말·DOI·쪽 번호 줄'); continue; }
  if (!sawTitle) { if (RE.author.test(t)) { push('author', '이름 형태(제목 없음)'); continue; } sawTitle = true; push('title', '첫 문단'); continue; }
  // 두 줄 제목: 직전이 title이고 이름 형태·부제 기호·라틴 문자가 아니며 12자 이상이면 제목 이어짓기
  if (prev && prev.role === 'title' && !RE.author.test(t) && !RE.subtitlePrefix.test(t) && t.length >= 12 && t.length <= 60 && hasHangul(t)) { push('title', '제목 둘째 줄'); continue; }
  // 영문 제목은 글자가 있어야 함
  if (RE.latin.test(t) && /[A-Za-z]{3,}/.test(t) && short && …) { push('titleEn', …); }
  // 짧은 줄 폴백은 저자가 아니라 body로 (RE.author를 통과한 줄만 저자)
  else { push('body', '앞부분 짧은 줄'); continue; }
  ```
  ③은 `state='front'`로 되돌릴 때 `sawTitle = blocks.some(b => b.role === 'title' || b.role === 'titleEn')`를 유지하고, 본문 문장(60자 초과·문장형 종결)이면 그대로 `state='body'`로 보내야 한다.

### F-5 [높음] 각주 본문 `n) …`을 절 제목(h2)으로, 줄바꿈 조각 `다. …`를 목 제목(h4)으로
- 위치: `RE.h2`의 둘째 분기 `^\d{1,2}\s*[)）]\s*\S`, `RE.h4`의 `^[가나다…]\s*[.．)]\s+\S`. PDF 본문에는 각주가 `1) 빅 블러(Big Blur)란 …`처럼 섞여 들어오고, 줄바꿈된 문장은 `…하였\n다. 또한 …`으로 `다. ` 로 시작한다.
- 재현: `struct_pdf_v2.out` — PDF표본 `h2×59`(실제 절 제목 0개, 전부 각주), PDF표본 `h2×61`, PDF표본 `h2×96`; `h4` "다. …" 25편(예: `다. 또한 작품의 장르를 일시적으로 변환시키거나 초점`). `node tests/out/audit_fable/regex_probe.mjs` 로 현행/제안 정규식 대조표를 볼 수 있다(각주 줄 8개 중 6개 제외, 정상 절 제목 6개 유지; `다.` 조각 3개 제외, `가./나./①` 유지).
- 수정 제안:
  ```js
  footnoteLike: /^\d{1,3}\s*[)）]\s*.*(?:[,，].*(?:(?:1[89]|20)\d{2}|\d+\s*(?:쪽|면|p\.|pp\.)|[「『｢󰡔]|앞의|위의|같은|Ibid|op\. ?cit)|https?:\/\/)/,
  h4: /^[①-⑳㉠-㉭]\s*\S|^(?!다[.．)])[가나다라마바사아자차카타파하]\s*[.．)]\s+\S/,
  // 본문 처리에서
  if (headCand && RE.h2.test(t) && !RE.footnoteLike.test(t)) { push('h2', '절 번호'); continue; }
  if (headCand && RE.h4.test(t) && t.length <= 40) { push('h4', '목 번호'); continue; }
  ```
  `6) 위의 책, pp.245-249.`·`13) 각 작품의 연재일과 완결 회차`처럼 쉼표 없는 각주는 남는다. 근본 대책은 TXT 파서에서 **각주 블록 분리**(연속 `n)` 번호가 1부터 증가하는 줄 묶음을 각주로 떼어 내기)지만 PDF 추출 순서가 불규칙해 완전하지 않다.

### F-6 [중간] 그 밖의 구조 인식 오류 (PDF 추출 원고)
| 유형 | 예 | 원인 규칙 | 제안 |
|---|---|---|---|
| 장 제목 오인 "n장에서는 …" | `2장에서는 영상화가 되어…`→h1 (PDF표본, PDF표본, PDF표본) | `h1Num: /^(제\s*)?\d{1,2}\s*[.．장]\s*(?![\d.])\S/`, `h1Roman: …[.．、]?\s*\S`(구분점 선택) | `h1Num: /^(제\s*)?\d{1,2}\s*(?:[.．]\s*(?![\d.])|장(?=\s|$|[:：.．]))/`, `h1Roman: /^[Ⅰ-Ⅹ]+\s*(?:[.．、]\s*|\s+)\S|^[IVX]{1,4}\s*[.．]\s+\S/` (regex_probe: 오인 4건 전부 제외, 정상 8건 유지) |
| 참고문헌 분류에 연도·DOI 조각 | `2022.` `2023.5.15.` `9.` `01.19` `10.6109/jkiice…)` `고경은`(저자 홀줄) →refSub | `refSub` 2차 규칙 `^(\d+\s*[.)]|[<＜]\s*\d|[가-힣A-Za-z]{1,12}\s*$)` | 어휘 제한형으로 교체: `/^[<＜〈\[【]?\s*(?:\d+\s*[.)]\s*)?(?:기본\s*자료|기초\s*자료|자\s*료|단행본|논문|논저|저서|기타(\s*자료)?|국내(\s*(논저|논문|문헌|자료))?|국외…|보고서|신문|웹|인터넷|사료|작품|1차|2차|참고\s*자료|영상|사전|Primary|Secondary)(?:\s*[·및과와,]\s*(?:단행본|논문|평론|기타|정책자료|자료))*\s*[>＞〉\]】]?$/` — paper5의 `<자료>` `<단행본>` `<논저>`(현재 ref로 들어감)도 함께 해결 |
| 영문 저자 과다 매칭 | `Remediation and Narrative Transformation of Historical`→authorEn, `Television Adaptation of Web Novels`→authorEn (두 줄 영문 제목의 첫 줄) | `RE.authorEn`이 대문자 단어 연속을 모두 허용 | `authorEn: /^(?:[A-Z][A-Za-z'’\-]+[,.]?\s*){1,4}(?:[(（][^)）]{1,60}[)）])?\s*[*＊]*$/` + 기능어 제외 `/\b(and|of|the|in|on|for|to|with|a|an|from|by|as|at)\b/i` ; titleEn2 다음의 짧은 라틴 줄은 titleEn2 이어짓기 |
| 영문 제목 60자 초과 → 영문초록 본문 | paper1 `( ), A study on the Scope of Recognition of Creativity…`, paper2 `A Study on the Microhistory of Korean Game-Fantasy…`(굵게)가 abstractEn | `short`(≤60) 공통 임계 | 라틴 문자 줄은 `t.length <= 120`을 titleEn2 후보로 |
| 목차의 점선 지시자·쪽 번호 | `제 1장 서 론 ·····1`(99자) → 60자 초과로 목차 탈락, `참고문헌 ····88`→refHead 상태 전환, `ABSTRACT ····95`→abstractEnHead → 학위논문 PDF표본에서 뒤 662문단이 영문초록 | toc 상태가 길이와 경계 제목에 민감 | 판정 전 `t.replace(/\s*[·‥…ㆍ.]{3,}\s*\d{0,4}\s*$|\s+\d{1,4}$/, '')`로 지시자 제거; toc 상태에서 지시자가 있던 줄은 경계 제목이어도 `toc` |
| 투고·심사일 미인식 | `수정완료일 : 2026년 2월 14일`→abstractEn, `❙게재확정일자 : 2026.06.29.`→abstractEn | `RE.dates` 어휘·접두 기호 | `/^[▮■□▪*※❙●]?\s*(논문\s*)?(최초\s*)?(투고일|접수일|심사\s*(완료|종료)?일|게재\s*확정일|수정\s*(완료)?일|논문수정일|투고일자|심사일자|게재확정일자|심사일)\s*[:：]?/` |
| 머리말·쪽 번호 잔재 | `252 대중서사연구 제32권 1호`, `24 한국문예창작 제25권 제1호(통권 제66호)`, `616 구보학보 40집`, `웹소설 작가 지망생의 … _ 127`이 본문·참고문헌·영문초록 마지막 항목으로 | 규칙 없음 | 사전 패스: 숫자를 지운 정규형이 3회 이상 반복되는 60자 이하 줄은 `skip`; 또는 `runningHead: /^(?:\d{1,4}\s{1,3})?\S.{0,50}?(?:학보|연구|논문지|논총|Journal|Studies|Review|Vol\.|제\s*\d+\s*[권집호])[^가-힣]{0,30}(?:\d{1,4})?\s*$/` |
| 주제어 두 줄 | `(주제어: 재매개, 플랫폼, …, <` 다음 줄 `망운록>, 서사 구조 재공학)`이 body | keywords는 한 줄만 | 주제어 줄이 `)`·`.`로 닫히지 않으면 다음 짧은 줄을 keywords 이어짓기 |
| TXT 줄 = 문단 | PDF 추출 TXT 40편 평균 880문단(줄), 산출 HWP도 줄마다 문단 → 들여쓰기·양쪽 맞춤이 줄마다 걸림 | `parse.js parseText` | "PDF 모드": 앞 줄이 문장 종결 부호(`.。?!」』)`)로 끝나지 않고 다음 줄이 제목·번호·빈 줄로 시작하지 않으면 한 문단으로 합치기. 각 줄 끝 하이픈·공백 처리 포함 |
| 인코딩 깨진 PDF | PDF표본/52, 사이코여왕, 이혼물(글리프 매핑 깨짐), `뺷…뺸`(겹낫표 대체 글리프) | 입력 품질 | 한글 비율이 낮고 사용자 영역(U+E000~)·결합 기호가 많으면 "PDF 추출 품질 경고". `cite.js` O_B/C_B에 `뺷뺸` 추가 검토 |

### F-7 [중간] 혼합 언어 각주에서 서양 문헌의 `p.`가 `쪽`으로 치환
- 위치: `src/structure.js applySubstitutions()` — 각주 전체에 한글이 하나라도 있으면(`hasHangul(t)`) `pp?\.\s*\d+`를 모두 `쪽/면`으로.
- 재현: `node -e` (tests/out/audit_fable 참고) 입력 `가상 개념은 “…”으로 정의된다. John Smith, “A Virtual Study…”, Journal of Things 1(2), 2000, p.15.` → unit `쪽`일 때 `…2000, 15쪽.` 기대: 서양 문헌은 `p.` 유지(모든 학회 규정 "외국 문헌은 p./pp."). 같은 식으로 `3면`(신문 면)이 `3쪽`으로.
- 수정 제안: 세미콜론·마침표로 나눈 **서지 단위**마다 한글 비율을 재서 라틴 위주(한글 비율 < 0.2) 단위는 치환하지 않는다.
  ```js
  const units = t.split(/(;\s*|\.\s+(?=[A-Z"“「『]))/);
  t = units.map(u => (/^(;\s*|\.\s+)$/.test(u) || hangulRatio(u) < 0.2) ? u : fixUnit(u)).join('');
  ```

### F-8 [중간] 쪽수 치환이 일어난 참고문헌·각주의 강조 런 폐기
- 위치: `applySubstitutions()` `if (nb.text !== b.text && b.runs && b.runs.length) nb.runs = [];`
- 재현: ref 블록 `John Smith, "…", *Journal of Things* 1(2), 2000, 10-20쪽.`(이탤릭 런) + unit `p.` → 텍스트 `pp.10-20`로 바뀌고 `runs=[]` → 서양 서명 이탤릭 유실. 규정은 대부분 "서양서는 이탤릭".
- 수정 제안: 치환을 런 단위로 수행(각 런의 text에 같은 `fix()` 적용, 길이 변화는 런 안에서만 발생하므로 오프셋 재계산 불필요).

### F-9 [중간] PDF 추출 TXT는 줄마다 문단 — 산출물 실용성 없음, 검증 도구도 거짓 '누락'
- 1,645건 중 '누락 문단' 770건은 전부 TXT. 실제 원인: `batch.mjs`/`convert.mjs`의 `soft()`가 산출 전체를 이어 붙인 뒤 `p.`·`쪽` 패턴을 지우므로 줄 끝 `… 2011, p.` + 다음 줄 `49.`가 `p.49.`로 합쳐져 원문 줄을 못 찾는다(PDF표본 `누락 86` → 글자 손실은 U+0000 144개와 `면→쪽` 치환뿐; PDF표본 손실 0). 보고용 지표로는 TXT 결과를 쓰지 말 것. HWP 논문 5편 × 35곳은 누락 0.
- 제안: 비교 전에 입력도 같은 방식으로 이어 붙이거나(`soft(inText)` 전체에서 `includes`), 문단 단위 비교는 양쪽 모두 `p.`·숫자를 지운 뒤 수행. F-6 "TXT 줄 = 문단" 합치기가 근본 해결.

### F-10 [낮음] 쪽 범위 기호 학회별 미정규화
- koli·kslt·ktla "00~00쪽/～", gubo "‘-’", kopoetics "–(줄표)" 등 규정이 갈리지만 `applySubstitutions`는 단위만 바꾸고 범위 기호는 원고대로 둔다(`p.37-76`→`37~76쪽`은 물결로 고정). `journals.js footnote.rangeDash`('~'|'-'|'–')를 두고 `(\d+)\s*[-~–～‒]\s*(\d+)`를 그 기호로 통일하는 치환을 추가.

### F-11 [높음·회귀] cite.js 13:26 보호 장치의 정규식 오타 (`/d/`, `s*`)
- 위치: `src/cite.js parseCitation()` 두 곳 `c.publisher.some((x) => /d/.test(x))`, `!/^(제s*)?d+s*(판|쇄)$/.test(x)`.
- 재현: `node tests/out/audit_fable/cite_test.mjs` 또는
  ```
  node -e "import('./src/cite.js').then(({parseCitation})=>{for(const t of ['임원선, 『실무자를 위한 저작권법』, 한국저작권위원회, 2015, pp.56-62 참조.','유종호, 『문학이란 무엇인가』, 2판, 민음사, 1989, 19‒37쪽.','홍길동, 『한국 문학사』, Random House Korea, 2010, 12쪽.'])console.log(!!parseCitation(t),t)})"
  ```
  → `true`(변환됨: APA `임원선 (2015). 실무자를 위한 저작권법. 한국저작권위원회, pp.56-62 참조.`), `true`(`유종호 (1989). 문학이란 무엇인가. 2판, 민음사, 19‒37쪽.`), **`false`**(Random House 거부). 기대는 정확히 반대.
- 수정: `/\d/`, `/^(제\s*)?\d+\s*(판|쇄)$/`. 아울러 `19‒37쪽`(U+2012 figure dash)과 `415～433쪽`(전각 물결)을 `RE_PAGES`의 대시 집합 `[-~–‒―～]`에 넣고, `(\d+)\s*(쪽|면)에서\s*재인용|참조` 꼬리는 토큰에서 떼어 내 `note`로 보존할 것.

### F-12 [중간] 서지 변환(APA·Chicago) 잘못되는 꼴 — 표본 58건 (`tests/out/audit_fable/cite_test.out`)
| 꼴 | 입력 → 출력(APA) | 문제 |
|---|---|---|
| 편저 속 논문 | `최용호, 「프란츠 칼 슈탄젤의 …」, 김상환 외, 『이야기꾼과 놀이꾼』, 이학사, 2023` → `최용호, 「프란츠 …」, 김상환 외 (2023). 이야기꾼과 놀이꾼 : …. 이학사.` | `RE_ART`가 「」 뒤 편자 토막을 허용하지 않아 `RE_BOOK`으로 떨어져 저자 자리에 논문 제목까지 들어감. `RE_ART`에 `[」],?\s*(?:(.+?),\s*)?[『]` 편자 그룹을 추가하고 kind `chapter` |
| 편저 속 논문(권수 있는 서명) | `박인하 엮음, 강주영 외 저자, 「장르 판타지」, 『웹툰 1』, 커뮤니케이션북스, 2021, 65~82쪽.` → `… (2021). 장르 판타지. 웹툰 1, 65–82.` | 출판사 탈락, 학술지로 오판 |
| 신문 기사(저자 없음) | `「문피아 ‘웹소설 공모대전’ 7만편 등록」, 『문학신문』, 2020.06.25.` → `「문피아 …」 (2020). 문학신문.` | 기사 제목이 저자 자리, 날짜 유실. 머리가 「」로 시작하면 kind `news`: `문학신문 (2020. 6. 25.). 문피아 …` |
| 역자 후치 | `레이윈 코넬, 『남성성/들』, 안상욱･현민 역, 이매진, 2013, 120쪽.` → `레이윈 코넬 (2013). 남성성/들 (p. 120). 안상욱･현민 역, 이매진.` | 역자가 출판사로. 꼬리 토큰 중 `RE_TRANS`에 맞는 것을 translator로 |
| 판차·figure dash | `유종호, 󰡔문학이란 무엇인가󰡕, 2판, 민음사, 1989, 19‒37쪽.` → `… 문학이란 무엇인가. 2판, 민음사, 19‒37쪽.` | F-11 오타로 통과. `2판` edition 필드, `‒` 대시 |
| "참조"·"재인용" 꼬리 | `… 2015, pp.56-62 참조.` → `… 한국저작권위원회, pp.56-62 참조.` | 페이지 토큰에 꼬리말이 붙어 출판사로 분류 |
| 연도:쪽 | `이혜순, ｢…｣, 『국어국문학』 제114호, 국어국문학회, 1995: 415～433쪽.` → 미인식 | `RE_YEAR`가 `1995:` 불허. `(\d{4})\s*[:：]\s*(\d+…)` 분리 |
| 저자(연도) 꼴 | `홍사만(2006), ｢…｣, 『어문론총』 44호, …, 101-142쪽.` → 미인식 | 머리의 `(연도)`를 연도로 쓰도록 `m[1]`에서 `\((\d{4})\)` 추출 |
| 통권·卷·页·頁 | `『한국출판학연구』 통권 117호`(미인식, 13:26 이후), `『惺所覆瓿藁』 卷26, 『韓國文集叢刊』 74`(미인식), `45-52页`(미인식), `大塚英志, 『キャラクター小説の作り方』, 講談社, 2003, 56頁.` → `… 講談社, 56頁.`(页·頁는 쪽수 미인식) | `RE_VOL`에 `통권\s*(\d+)\s*호`, `卷\s*(\d+)`, `第(\d+)期`; `RE_PAGES`에 `页|頁` |
| 학술지 논문의 학회명 탈락 | 모든 article 변환에서 `한국현대소설학회` 등 발행처가 사라짐 | APA·Chicago 설계상 맞지만 koli·daejung 등 국내 규정 예시는 학회명을 요구 — "학회 규정" 스타일에서는 APA 변환을 쓰지 않도록 UI에서 분리 명시 |
| 설계상 미지원(그대로 둠, 정상) | 학위논문(`「…」, 가상대학교 박사학위논문, 2020`), 서양 문헌 4건, 웹 자료, 법령·판결, 익명 보고서 `『2024 웹소설 분야…』` | 미인식 수치로 사용자에게 보임 |
- 원고 추출 364건(paper1~5 각주 179 + 참고문헌 185): APA 변환 211, 미인식 134(위의 책·판결 등 제외 시 약 90), 이상 출력 1(동일 저자 반복 기호 `　,` 로 시작하는 항목이 `, 「…」 (2020)…`로 변환 — 저자 공란 항목은 변환하지 않거나 바로 위 항목 저자를 상속).

### F-13 [낮음] journals.js 규정값 데이터 의문 (코드 아님)
- kslt 문학치료연구: `page {top:56,bottom:56,left:53,right:53}` vs `docs/학회조사_2026-10-13.md` "A4, 여백 위아래 20 좌우 30". 신국판 판면을 A4에 올린 값인지 확인 필요.
- urilit 우리文學硏究: `footnote {indent:27}`(양수) — 다른 학회는 모두 내어쓰기(`indent:-N, marginLeft:N`). 조사 메모 "들여쓰기 2(각주·인용 3)"의 해석 확인.
- klnc·kslt: `h4`·`titleEn`·`subtitleEn`·`dates` 역할 서식 없음 → h3·title·body로 대체(동작은 함).
- litheory: 바탕틀 182×257, 여백 위아래 40·머리말 15 vs 규정 pdf "위아래 42, 머리말 10, 꼬리말 0, 제본 5" — 바탕틀을 기준으로 삼는 설계라 산출은 바탕틀과 일치. 규정 pdf와 바탕틀의 불일치는 학회에 확인.
- `docs/실데이터검증_2026-10-13.md`의 "paper3 여백 15pt" 등 기록은 유효; 이 보고서의 F-2·F-3은 그 검증에 포함되지 않았던 항목.

### F-14 [낮음] 검증·배치 도구의 거짓 양성·운영 메모
- F-9의 `soft()` 거짓 누락 외에, `checklist()`의 "분량 약 N매"는 줄 수 기반(`ceil(len/20)/10`)이라 PDF 추출 TXT(짧은 줄 다수)에서 1.6~1.7배 과대(PDF표본 30,437자 → 252매; 200자 원고지 환산 152매). 글자 수 기반(`chars/200`)과 병기 권장.
- 13:13~13:15 사이 `parse.js` 편집 중간 상태(`MAX_PARAS` 선언 전 참조)로 제 fmt2 배치 128건이 `MAX_PARAS is not defined`로 전부 실패했다. 현재 코드에서는 재발하지 않음(1,645건 오류 0).
- 노드 프로세스 5개를 동시에 띄우면 WASM 초기화가 조용히 실패(exit 1, 메시지 없음)했다. 배치는 2개까지가 안전.

---

## 3. 산출 HWP 건전성 (과제 4)

`node tools/probe.mjs tests/out/comply_paper2_<id>.hwp` 와 바탕틀 `templates/<id>.hwp` 대조.

| 학회 | 바탕틀 | 산출 | 판정 |
|---|---|---|---|
| iall (2구역) | sections 2, sec0=sec1 154×225 L23 R23 T21 B24 H10 F10 | sections 1, pageDef 동일, styles 23 유지, secd·cold 컨트롤 유지, 각주 39 | 정상. 구역 1(본문) 역할도 구역 0 용지와 같아 손실 없음 |
| kochih (2구역) | sections 2, 153×225 L22 R22 T19 B27 H13 F0, styles 49 | sections 1, pageDef 동일, styles 49, 각주 39 | 정상 |
| dongak (스타일 기반) | 153×225 L24.5 R24.5 T17 B28 H13, styles 26 | 동일, 체재 `body → abstractEn → references` 반영(Abstract 146번째 문단, 참고문헌 151번째) | 정상 |
| koreacontents (스타일 기반) | 188×258 T0 H35, styles 26, 단 정의 유지 | 동일, 21쪽 | 정상 |
| gubo | 153×225, binding 1 | 동일. 체재 `body → references → abstractKo → abstractEn` 반영(국문초록이 참고문헌 뒤 168번째) | 정상 |
| anim | 188×257 L30 R26 T22 B17 F13 | 동일. `tail`(투고일) 뒤 abstractEn 순서 반영 | 정상 |
| 규정값 16곳 | — | `format.page` mm → HWPUNIT 환산 정확(0.3 mm 이내), 각주 charPr/paraPr가 `footnote` 규정값(크기·줄간격·내어쓰기)과 일치 | 정상 |

쪽 수 비교(paper2, 35곳): koreacontents 19 ~ ktla 58 — ktla는 F-1 때문에 +7쪽.

---

## 4. 실행 명령과 수치

### 4-1. 일괄 변환 (코드 `2360f40`)
```
node tools/batch.mjs --journals koli,daejung,eastasia,fcs,interlali,gubo,anim,koreanst,korlanlit,korliter,postcriticism,kopoetics,klc,aagcc,iall,litheory,dongak,kochih,koreacontents --dirs tests/out/원고_audit,tests/원고_pdf --out tests/report_fable_full_tpl.json   # 893건, 295 s
node tools/batch.mjs --journals klnc,childlit,urilit,korlit,kcomplit,kslt,eomun,hangomun,storyimage,ricc,jicc,ktla,donam,eomunlon,kolali,kles --dirs tests/out/원고_audit,tests/원고_pdf --out tests/report_fable_full_fmt.json   # 752건
node tests/out/audit_fable/aggregate.mjs full_tpl full_fmt > tests/out/aggregate_fable_full.txt
```
- 1,645건 오류 0. 변환 시간 중앙값 185 ms, p90 283 ms, 최대 504 ms(코디네이터 메모의 "1,200문단 150초→2초"와 부합; 이전 API 삽입 엔진에서는 PDF 원고 1편당 5~8초였음).
- 각주 있는 175건(paper1~5 × 35) **각주 수·내용 불일치 0**, 누락 문단 0. 강조 런 보존(새 엔진 variantCs). 쪽수 단위 치환 확인: koli `23-24쪽`, eastasia `23-24면`, anim `pp.23-24`, dongak·kles(keep) 원문 유지.
- 구조 인식(학회 무관, 47편): 제목 100%(단, TXT는 F-4의 잘못된 제목 포함), 장 제목 83%, 참고문헌 제목 있는 29편 중 ref 인식 76%, 국문초록 있는 28편 중 75%, Abstract 있는 29편 중 79%, 주제어 66%. HWP 논문 5편은 전 항목 100%(paper4는 발표문으로 초록·주제어 없음).
- 22종 축소 배치(`tests/report_fable_tpl1/2, fmt1/2.json`)도 보존용으로 남겼다(fmt2는 F-14의 편집 중 실패 기록).

### 4-2. 학회 규정 대조
```
node tests/out/audit_fable/comply.mjs tests/원고/paper2.hwp <바탕틀 19곳>   → tests/out/comply_paper2_tpl.txt, tests/out/comply_paper2_<id>.hwp
node tests/out/audit_fable/comply.mjs tests/원고/paper3.hwp <바탕틀 19곳>   → tests/out/comply_paper3_tpl.txt
node tests/out/audit_fable/comply.mjs tests/원고/paper1.hwp <규정값 16곳>   → tests/out/comply_paper1_fmt.txt
node tests/out/audit_fable/comply.mjs tests/원고_pdf/PDF표본.txt koli,gubo,anim,iall,klnc,kslt
```
역할마다 산출 문단의 글꼴(한글 슬롯)·크기·굵게·정렬·줄간격·들여쓰기·왼쪽 여백을 바탕틀 예시 문단(`template.roles[].para/style`) 또는 `format.roles[]`와 대조하고, 용지는 `getPageDef`, 각주는 산출 HWPX의 `charPr/paraPr`로 확인. 결과: 규정값 16곳 불일치 0(자간·장평도 klnc −4/100, kslt −15/98, eomun −11/92, kolali −8/90 확인), 바탕틀 19곳 중 koli 2건(F-2)만 불일치. 빈 줄 배치는 역할 순서 덤프로 F-3 확인. `outcheck` 표본: `node tools/outcheck.mjs tests/out/comply_paper2_koli.hwp "이융희" "＜국문초록＞" "1. 서론" "2.1. 게임판타지" "에브왐이란" "권태용"` → `sz=10 / sz=10 / sz=13 B / sz=12 ml=10 B / sz=9 ml=10 / sz=10 ind=-29.8`. SVG: `node tools/inspect.mjs tests/원고/paper2.hwp koli 0 1` → `tests/out/paper2_koli_p0.svg`, `_p1.svg`.

### 4-3. 구조 인식
```
node tests/out/audit_fable/struct_pdf.mjs            → tests/out/audit_fable/struct_pdf_v2.out (40편 역할 요약; struct_pdf.out은 13:18 코드)
node tests/out/audit_fable/regex_probe.mjs           → 현행/제안 정규식 대조표
```
13:18 → 13:26 코드 차이: 영문초록 선행 3편(PDF표본 abstractEn 662→36, PDF표본 760→17, PDF표본 723→22)만 달라졌고 나머지 37편은 동일. PDF표본 F-4-③ 역행.

### 4-4. 서지 변환
```
node tests/out/audit_fable/cite_test.mjs > tests/out/audit_fable/cite_test.out
```
표본 58건(국문 학술지 15, 단행본 8, 번역서 9, 편저 3, 학위 3, 신문·웹 5, 서양 4, 중·일·한문 3, 반복·기타 8): APA 변환 31·미인식 25·반복 인용 건너뜀 2; 변환 31 중 틀린 출력 8(F-12). 원고 추출 364건: 변환 211, 미인식 134.

### 4-5. 참고: 같은 날 다른 감사와의 관계
`docs/audit/review_opus.md`(보안·견고성)와 `review_sonnet.md`는 입력 검증·성능·다중 구역 파싱을 다뤘고 13:17·13:26 커밋에 반영됐다. 이 보고서는 서식·구조·서지 정확성에 한정했고, 겹치는 항목은 없다. 13:26 커밋이 만든 F-4-③·F-11은 이 보고서에서만 다룬다.
