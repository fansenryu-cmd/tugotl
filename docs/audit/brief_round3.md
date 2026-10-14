# 3차 감사 브리프 (2026-10-14)

대상: D:\project\투고틀 (main 최신 커밋). 단일 HTML 오프라인 논문 양식 변환기. 핵심 원칙: AI 개입 없이 규칙만으로, 로컬에서, 원고를 저장·전송하지 않는다. 글꼴·서식은 학회 양식·규정을 그대로 따른다.

반드시 먼저 읽을 것: `docs/운영규정.md`(6항·보고서 형식·점검 항목), `docs/audit/response_2026-10-13.md`(1·2차 조치표), `docs/실데이터검증_2026-10-13.md`, `docs/검증매트릭스_2026-10-14.md`, `docs/글꼴안내.md`, `README.md`.

2차 이후 바뀐 것: 코드포인트→UTF-16 좌표(parse.js), DOCX 런 토큰 순서 읽기, 각주·공백·줄바꿈 보존(`<hp:lineBreak/>`), 번호 없는 사사 각주, 목차 자동 생성(`buildToc`), 바탕틀 쪽 나눔(`topLevelPageBreaks`), 인용문 앞뒤 빈 줄 기본 1, 표지 문구 정규화(`relabelByTemplate`, `labels`·`tocLabel`), 제목류 굵기는 학회 서식, 사용자 데이터 검증 강화, 정오표 정밀화, 학회 52곳(바탕틀 19·규정값 24·일반 9), 글꼴 안내, 전수 재검증 도구(`tools/verify_matrix.mjs`, 52/52 통과).

## 감사 차원 (에이전트마다 하나를 맡는다)
- **A. 산출물 충실도(fidelity)**: 원고를 실제로 만들어 변환·저장(HWP·HWPX)까지 한 뒤 산출물을 다시 열어 원고와 글자 단위로 대조한다. 작가 원고 5편(`tests/원고/paper1~5.hwp`)뿐 아니라 **가상 원고를 직접 만들어**(TXT/MD·DOCX·HWPX: 옛한글·한자·가나·라틴 확장·수학 기호·PUA 겹낫표·전각 공백·NBSP·탭·줄바꿈·보조평면 글자·각주 안 강조·번호 없는 각주·여러 문단 각주·두 줄 제목·부제·목차 있는/없는 원고·초록이 뒤에 오는 원고·영문 논문·2구역 HWP) 학회 여러 곳에 넣고, `tests/원고_pdf/*.txt`(다른 원고의 파싱본 40건)도 돌린다. 각주 위치·내용·강조 범위·공백·줄바꿈·문단 수·역할 배정·체재 순서·목차·표지 문구·빈 줄을 수치로 보고한다.
- **B. 기능 결함**: UI 흐름(드롭→적용→미리보기→저장, 설정, 역할 수정, 학회 추가·가져오기·내보내기, 일정 입력, 도움말), 입력 검증·상한, 오류 처리, 브라우저 저장(localStorage) 경계, CSP, 배포본(`release/투고틀.html`) 무결성(SHA-256), 빌드 재현, 성능(대용량 원고), 접근성. `dist/dev.html`을 `python -m http.server 8787`(저장소 루트)로 띄워 실제로 조작한다(브라우저 자동화가 있으면 쓰고, 없으면 node·vm으로 함수 수준 재현).
- **C. README·문서 검수**: README가 비개발자(HTML만 받아 쓰는 연구자)와 개발자 모두에게 정확·충분한지, 라이선스·감사의 말·보안 설명·학회 표·글꼴 안내·도움말이 실제 동작과 일치하는지, 연구 윤리상 부적절한 기록(제3자 논문 식별 정보 등)이 없는지 검수한다. 문구 제안은 보고서에 쓴다(README는 팀장이 고친다).

## 공통 규칙
- `src/`, `dist/`, `release/`, `templates/`, `forms/`, `README.md`를 직접 수정하지 않는다. 수정안은 보고서에 코드 조각으로.
- 원고 내용을 외부로 보내지 않는다. 임시 파일은 `tests/audit_<agent>/` 아래에만.
- 도구: `node tools/convert.mjs <원고> <학회id,…> [--quiet]`, `node tools/pipeline_test.mjs`, `node tools/fidelity_test.mjs`, `node tools/errata_test.mjs <원고> <학회id>`, `node tools/verify_matrix.mjs --papers <원고,…> --journals <id,…>`, `node tools/output_profile.mjs <hwp>`, `node tools/overlap_check.mjs <hwp…>`, `node tools/build.mjs`.
- 보고서: `docs/audit/review3_<agent>.md`. 요약 첫 줄에 `점수: NN/100`, 95점 미만이면 "95점에 이르기 위해 고쳐야 할 것"을 우선순위로. 중요도순 발견(파일:줄, 재현 명령, 기대/실제, 수정안), 실행한 명령과 수치.

## 추가 규칙 (2026-10-13 재개)
- 대상 커밋: main 0278044 이후. 기능 감사(B) 반영분(바탕틀 없는 사용자 학회, 가져오기 병합, 지난 마감 숨김, DOCX 파서 캐시, 문단 상한 2만)이 들어 있다.
- **연구 윤리**: `tests/원고/`·`tests/원고_pdf/`의 원고는 저자 본인 또는 제3자의 논문이다. 보고서(`docs/audit/review3_*.md`)와 임시 파일 이름에 원고의 제목·저자명·본문 문장·각주 문장을 **쓰지 않는다**. 파일 번호(paper1, pdf-07 등)와 수치(문단 수, 각주 수, 불일치 글자 수, 역할 배정 결과)로만 보고한다. 불일치 재현이 필요하면 가상 원고(직접 만든 TXT/DOCX/HWPX)로 같은 현상을 재현해 그 원고의 조각만 인용한다.
- 가상 원고는 `tests/audit_<agent>/fixtures/` 아래에 만든다.

## 4차(재감사) 안내 (2026-10-13, main 2f8ad3f)
- 3차 충실도 감사(`review3_opus_fid.md` 78점, `review3_sonnet_fid.md` 80점)의 발견은 `response_round3_fidelity.md`대로 반영했다. 재감사는 **같은 발견이 실제로 사라졌는지**(두 보고서의 재현 명령을 그대로 다시 실행)와 **반영 과정에서 새로 생긴 결함**(각주 문단 배열 `paras`, HWPX 각주 메타 읽기, 표지 치환 뒤 런·각주 좌표, 체재 밖 묶음 배치, 라벨 정규식 확장, TXT 별표 규칙)을 집중해서 본다.
- 보고서는 `docs/audit/review4_<agent>.md`. 형식은 3차와 같다(첫 줄 `점수: NN/100`).

## 5차(재감사) 안내 (2026-10-13, main 234555a)
- 4차 보고서(`review4_opus_fid.md` 88점, `review4_sonnet_fid.md` 91점)의 새 결함 N-1~N-9는 `response_round3_fidelity.md`의 4차 조치표대로 반영했다. 5차는 4차 재현 명령을 다시 실행해 해소를 확인하고, 이번 반영(별표 강조 경계 `OPEN`/`CLOSE`, 강조 안 각주, 주제어·초록 머리 정규식 꼬리 규칙, 체재 밖 묶음 배치 `anchorOf`, 표 안 각주 제외, DOCX 표시 각주 뒤 새 번호, TXT 각주 이어짐의 끝 묶음 한정, 재배열 안내문)에서 생긴 결함만 새로 찾는다.
- 보고서는 `docs/audit/review5_<agent>.md`. 형식은 같다(첫 줄 `점수: NN/100`).

## 6차(재감사) 안내 (2026-10-13, main be130c3)
- 5차 보고서(`review5_sonnet_fid.md` 93점, `review5_opus_fid.md` 89점)의 새 결함은 `response_round3_fidelity.md`의 5차 조치표대로 반영했다. 6차는 5차 재현 명령을 다시 실행해 해소를 확인하고, 이번 반영(각주 서지 변환의 문단 단위 처리, 주제어 줄의 머리말·값 글자 모양 분리 `valueCs`, 주제어 판정의 문장 규칙·이중 표기·중심어·`;`, 별표 경계의 문장부호 범위와 `<`·`>` 제한, TXT 이어짐의 끝 묶음·정의 분포 규칙, DOCX 미주 번호, 재배열 안내 `srcSeq`, 각주 메타 U+2007)에서 생긴 결함만 새로 찾는다.
- 보고서는 `docs/audit/review6_<agent>.md`. 형식은 같다(첫 줄 `점수: NN/100`). 점수는 "투고용 산출물로서의 충실도"를 기준으로 하되, 보류로 명시된 항목(DOCX 스타일 서식·자동 번호·루비·텍스트 상자, 표·그림 자리 표시, 검증 도구 보강)은 감점 사유에서 따로 표시한다.

## 7차(재감사) 안내 (2026-10-13, main adb1ed4)
- 6차 보고서(`review6_opus_fid.md` 93점, `review6_sonnet_fid.md` 94점)의 새 결함은 `response_round3_fidelity.md`의 6차 조치표대로 반영했다. 7차는 6차 재현 명령을 다시 실행해 해소를 확인하고, 이번 반영(영문 주제어 머리말·값 글자 모양 `valueCs` 보정, 주제어 문장·나열 규칙 `kwList`·`kwSentence`, TXT 이어짐 규칙, 이중 표기 치환, 서지 변환의 빈 저자·연월일 항목 제외 `dated`, 각주 정의 중복 경고, 매트릭스의 주제어 줄 런 선택)에서 생긴 결함만 새로 찾는다.
- 보고서는 `docs/audit/review7_<agent>.md`. 형식은 같다(첫 줄 `점수: NN/100`). 점수는 "투고용 산출물로서의 충실도"를 기준으로 하되, 보류로 명시된 항목(DOCX 스타일 서식·자동 번호·루비·텍스트 상자, 표·그림 자리 표시, 검증 도구 보강, 재배열 안내 길이)은 감점 사유에서 따로 표시한다.

## 8차(재감사) 안내 (2026-10-13, main 0d0039e)
- 7차 보고서(`review7_opus_fid.md` 94점, `review7_sonnet_fid.md` 93점)의 새 결함은 `response_round3_fidelity.md`의 7차 조치표대로 반영했다(정오표를 서지 변환 앞에서 대조, 서지 파서의 권·호·닫는 낫표·연도 뒤 덧말, MD 이스케이프·굵은 기울임, 주제어 나열의 서술어 예외 `kwPred`·`kwEnVerb`, TXT 이어짐의 빈 줄 뒤 블록 예외 `gapIdx`, 엔진 머리말 정규식 통일). 8차는 7차 재현 명령을 다시 실행해 해소를 확인하고, 이번 반영에서 생긴 결함만 새로 찾는다.
- 보고서는 `docs/audit/review8_<agent>.md`. 형식은 같다(첫 줄 `점수: NN/100`). 점수는 "투고용 산출물로서의 충실도"를 기준으로 하되, 보류로 명시된 항목(DOCX 스타일 서식·자동 번호·루비·텍스트 상자, 표·그림 자리 표시, 검증 도구 보강, 재배열 안내 길이, 굵게 안의 기울임)은 감점 사유에서 따로 표시한다. 가상 원고에서만 재현되고 작가 원고·PDF 파싱본에 영향이 없는 발견은 심각도를 ‘낮음’으로 둔다.

## ASTRA 5차(재감사) 안내 (2026-10-14, main ab39000) — 6차는 아래 ‘ASTRA 6차 안내’
- ASTRA 4차(`review4_astra.md` 88점)의 발견은 `response_round3_fidelity.md`의 ‘ASTRA 4차 조치’대로 반영했다(DOCX 이름공간 토큰 단위 정규화 `normalizeWml`·문단 짝 검사 `checkParagraphBalance`, 표만 있는 문서, 서식 필드 타입 검증 `FMT_NUM/STR/BOOL`·용지 기본값, 일정 정제, 저장 성공 뒤 메모리 반영, 한 문단 20만 자 HWPX 거부, 낫표 안 분리 금지 `splitCitationSegs`, 초록 문장 끝 판정). 5차는 4차 재현 명령(`tests/audit_astra/round4/`, `setup.mjs`로 현재 src 복사)을 다시 실행해 해소를 확인하고, 이번 반영에서 생긴 결함만 새로 찾는다. 보류 항목(F-02 익명화 한계, F-08 범위 기호·half 좌표·정렬, F-11 검증 도구, Worker 분리)은 감점 사유에서 따로 표시한다.
- 보고서는 `docs/audit/review5_astra.md`.

## ASTRA 6차(재감사) 안내 (2026-10-14, main 2c8faf0)
- ASTRA 5차(`review5_astra.md` 93점)의 R5-01~R5-04와 N-03 잔존은 `response_round3_fidelity.md`의 ‘ASTRA 5차 조치’대로 반영했다(자기 닫힘 판정, 토큰화된 문단 짝 검사와 스캐너의 건너뛰기, 디코딩 문단 길이 `hwpxLongestParagraph`, 인용 전체 괄호 벗기기, 부호 허용 필드·역할 맵 객체). 6차는 round5 재현 명령을 다시 실행해 해소를 확인하고, 이번 반영에서 생긴 결함만 새로 찾는다. 보류(F-02·F-08·F-11·Worker)는 감점 사유에서 따로 표시한다.
- 보고서는 `docs/audit/review6_astra.md`.

## ASTRA 7차(재감사) 안내 (2026-10-14, main cda5d3a)
- ASTRA 6차(`review6_astra.md` 94점)의 R6-01·R6-02·잔존은 `response_round3_fidelity.md`의 ‘ASTRA 6차 조치’대로 반영했다(자기 닫힘 `hp:t`·줄바꿈 길이, 주석 제거·CDATA 이스케이프를 스캐너 앞에서, 따옴표 인식 태그 끝 `tagEnd`). 7차는 round6 재현 명령을 다시 실행해 해소를 확인하고, 이번 반영에서 생긴 결함만 새로 찾는다. 보류(F-02·F-08·F-11·Worker)는 감점 사유에서 따로 표시한다.
- 보고서는 `docs/audit/review7_astra.md`.

## ASTRA 8차(재감사) 안내 (2026-10-14, main 3239387)
- ASTRA 7차(`review7_astra.md` 94점)의 R7-01은 `response_round3_fidelity.md`의 ‘ASTRA 7차 조치’대로 반영했다(주석·CDATA 단일 순회). 8차는 round7 재현 명령을 다시 실행해 해소를 확인하고, 이번 반영에서 생긴 결함만 새로 찾는다. 보류(F-02·F-08·F-11·Worker)는 감점 사유에서 따로 표시한다.
- 보고서는 `docs/audit/review8_astra.md`.

## ASTRA 9차(재감사) 안내 (2026-10-14, main a480eb5)
- ASTRA 8차(`review8_astra.md` 94점)의 R8-01은 `response_round3_fidelity.md`의 ‘ASTRA 8차 조치’대로 반영했다(처리 지시·태그·CDATA·주석을 한 순회로 소비). 9차는 round8 재현 명령을 다시 실행해 해소를 확인하고, 이번 반영에서 생긴 결함만 새로 찾는다. 보류(F-02·F-08·F-11·Worker)는 감점 사유에서 따로 표시한다.
- 보고서는 `docs/audit/review9_astra.md`.

## ASTRA 10차(재감사) 안내 (2026-10-14, main c602f7e)
- ASTRA 9차(`review9_astra.md` 94점)의 R9-01과 잔존(글자 토큰 태그 속성값의 `>`)은 `response_round3_fidelity.md`의 ‘ASTRA 9차 조치’대로 반영했다(처리 지시 삭제, `tagEndAt` 따옴표 인식). 그 사이 외부 말뭉치 1회차로 역할 인식(structure.js: 가나다 목 번호 순서, 쪽 아래 각주·퍼센트 줄 제외, 투고·심사일, 영문 Keywords 이어짐, 점선 목차, 참고문헌 연도 토막)과 각주 쪽수(문헌 단위 국문·국외 판정 `citeLang`, p./pp. 숫자 일치, 학회별 범위 기호), 정오표(서술 속 인용 등)가 바뀌었다. 10차는 round9 재현을 다시 실행해 해소를 확인하고, 이 변경들에서 생긴 결함만 새로 찾는다. 보류(F-02·F-08·F-11·Worker)는 감점 사유에서 따로 표시한다.
- 보고서는 `docs/audit/review10_astra.md`.

## ASTRA 11차(재감사) 안내 (2026-10-14)
- ASTRA 10차(`review10_astra.md` 94점)의 R10-01~R10-04는 `response_round3_fidelity.md`의 ‘ASTRA 10차 조치’대로 반영했다(쪽수 치환의 글자 단위 원래 위치 추적과 강조·각주 위치 재구성, `citeLang`의 쪽수 칸 건너뛰기, Keywords 서술문 제외, 점선 목차의 인용 서식 우선·본문 중 제한). 국외 문헌 ‘12쪽에서’ 기존 실패도 고쳤다.
- 11차는 round10 재현 명령을 다시 실행해 해소를 확인하고, 이번 반영(특히 글자 단위 추적: 공백·반복 locator·여러 문단 각주·낫표 반각/전각 변환과 겹칠 때의 강조 경계와 각주 위치)에서 생긴 결함만 새로 찾는다. 보류(F-02·F-08·F-11·Worker)와 10차가 제외한 기존 실패는 감점하지 않는다.
- 보고서는 `docs/audit/review11_astra.md`.
- 11차 범위 추가(같은 날 반영): ① 학회 30곳 추가(52 → 82곳, 바탕틀 14곳 신규 — 만화웹툰연구 포함) ② 쪽수 규칙 `footnote.pageSpace`(‘pp. 1-5’), `pageSpaceLatin`(국외만 한 칸), `pageUnitLatin: 'same'`(국외도 국문 단위), 전각 하이픈 범위 기호 ‘－’ ③ 체재 `keywordsPosition: 'beforeReferences'`(본문 뒤·참고문헌 앞 주제어) ④ 외부 말뭉치 2회차 역할 규칙 A~G(`response_round3_fidelity.md`의 ‘외부 말뭉치 검증 2회차 반영’) ⑤ 바탕틀 정제 도구 `tools/sanitize_template.mjs`(견본 논문 글자·실명·이메일을 지우고 모양만 보존). 새 결함은 이 범위에서도 찾는다. 학회 규정 자체의 해석(학회별 수치)은 감점 대상이 아니다.

## ASTRA 12차(재감사) 안내 (2026-10-14)
- ASTRA 11차(`review11_astra.md` 94점)의 R11-01~R11-03은 `response_round3_fidelity.md`의 ‘ASTRA 11차 조치’대로 반영했다(경계 대응 합성 `bnd`/`mapOff`, Keywords 서술문 근거, 정제 도구의 견본 판정과 바탕틀 13개 재정제).
- 12차는 round11 재현을 다시 실행해 해소를 확인하고, 이번 반영에서 생긴 결함만 새로 찾는다. 보류·기존 제외 항목은 감점하지 않는다. 보고서는 `docs/audit/review12_astra.md`.
