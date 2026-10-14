# 2차 감사 브리프 (2026-10-13 심야)

대상: D:\project\투고틀 (main fd71288). 단일 HTML 오프라인 논문 양식 변환기. 핵심 원칙: AI 개입 없이 규칙만으로, 로컬에서, 원고를 저장·전송하지 않는다. 글꼴·서식은 학회 규정을 그대로 따른다.

반드시 먼저 읽을 것: `docs/운영규정.md`(6항·보고서 형식·점검 항목), `docs/audit/response_2026-10-13.md`(1차 감사 조치표), 자기 모델의 1차 보고서 `docs/audit/review_<agent>.md`, `docs/실데이터검증_2026-10-13.md`, `README.md`.

1차 이후 바뀐 것: 문단별 API 삽입 → HWPX XML 직접 생성(`src/engine.js`), 저장 전 `reflowLinesegs()`, 바탕틀 예시 글자색 검정 통일, 정오표(`src/errata.js`), 문서정보 바, 도움말, 사용자 학회 검증(`sanitizeJournal`/`safeUrl`/`RESERVED_ID`), DOCX 선형 스캐너·입력 상한, 학회 48곳.

## 할 일
1. 1차 보고서의 지적이 실제로 고쳐졌는지 재현 명령으로 확인(고쳐지지 않았으면 그대로 지적).
2. 운영 규정 1·2항을 최고 수준으로: 내용 보존(옛한글·외국 문자·기호·문장부호·공백·각주 위치·강조)과 형식 준수(체재 순서·쪽수 단위·빈 줄·용지·글꼴·크기·줄간격·참고문헌 분류·초록·목차). 새 재현 케이스를 스스로 만들어 돌린다(`tests/audit_<agent>/`에 입력·산출을 둔다).
3. 견고성·사용자 데이터 검증·외부 주소 검증·CSP·빌드 산출물(`release/투고틀.html`)의 무결성.
4. 정오표 오탐·누락.
5. 점수(0~100)와 판정. 95점 미만이면 "95점에 이르기 위해 고쳐야 할 것"을 우선순위로 목록화한다.

## 도구
- `node tools/convert.mjs <원고> <학회id,…> [--quiet]` 내용 보존 대조, `node tools/pipeline_test.mjs`(46건), `node tools/fidelity_test.mjs`(문자 보존), `node tools/errata_test.mjs <원고> <학회id>`, `node tools/outcheck.mjs`, `node tools/probe.mjs`, `node tools/overlap_check.mjs <hwp…>`, `node tools/build.mjs`.
- 원고 샘플: `tests/원고/paper1~5.hwp` 등(제3자 식별 정보는 보고서에 쓰지 않는다 — 파일 이름과 수치만), `tests/원고_pdf/*.txt`.
- rhwp WASM: `node_modules/@rhwp/core`. 브라우저 확인은 `dist/dev.html`(CSP 없음, `python -m http.server 8787`로 저장소 루트를 띄워 `/dist/dev.html`).

## 금지
- `src/`, `dist/`, `release/`, `templates/`, `forms/`, `README.md`를 직접 수정하지 않는다. 수정안은 보고서에 코드 조각으로 쓴다.
- 원고 내용을 외부로 보내지 않는다. 네트워크 호출은 npm 취약점 조회 정도만.
- 임시 파일은 `tests/audit_<agent>/` 아래에만.

## 보고서
`docs/audit/review2_<agent>.md`. 형식은 운영규정의 "감사 보고서 형식". 요약 첫 줄에 `점수: NN/100`.
