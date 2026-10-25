# 변경 내역 · Changelog

판마다 무엇이 바뀌었는지 적습니다. 배포본은 [Releases](https://github.com/fansenryu-cmd/tugotl/releases)에 있습니다. *English summaries follow the Korean.*

**v2.0 (2026-10-25)** — 각주 구분선 바로잡기, Word(DOCX) 저장, 학회별 구분선 규정.
- **각주 구분선**: 바탕틀 없이 만드는 156곳에서 본문과 각주 사이 선이 빠지던 문제와, 모든 산출물에서 구분선이 단 너비로 늘어나고 선 위 여백이 사라지던 문제(rhwp의 HWP 각주 모양 레코드 저장 배치)를 고침. 190곳 전수 확인, 한글 2024로 그려 확인.
- **학회별 구분선**: 학회 양식 HWP에서 읽은 길이·굵기·색(단 너비 전체 4곳, 로컬리티 인문학 회색 1/3, 한국학 4.5 cm).
- **Word(DOCX)로 저장**: 한글 산출물과 같은 서식의 Word 문서. Word 16으로 190곳 전수 열기·각주 수 확인, 이음 오피스 렌더러로 교차 확인.
- **안내 문서 정리**: README는 한국어 핵심 안내 뒤에 영어 안내를 두는 짧은 문서로 바꾸고, 자세한 내용은 [docs/사용안내.md](docs/사용안내.md)·[docs/학회목록.md](docs/학회목록.md)·[docs/개발.md](docs/개발.md)·이 파일로 옮김.
- **검토한 외부 도구**: 이음 오피스(IeumOffice, Apache-2.0)는 Word 산출물 교차 확인에 썼고, kordoc(MIT)은 수정 대조표·심사용 익명 파일 같은 다음 기능의 참고로 검토. 자세한 내용은 [docs/v2.0_설계.md](docs/v2.0_설계.md).

**v1.4 (2026-10-21)** — 학회 108곳 추가(82곳 → 190곳), 분야 거르기, 표·그림, 휴대폰, 화면 그림, 한영 안내, 감사 반영.
- **학회 확장**: KCI 문학·고전문학·한문학·구비민속·문화연구·대중문화·영상·문화콘텐츠·한국학 분야 등재지·등재후보지 108곳 추가(등재 179 · 등재후보 11). 학회 공식 규정만으로 수집하고, Sonnet 5.5·Haiku 5.5 에이전트가 108곳 전부를 원문과 따로 대조한 뒤 엇갈린 항목은 원문을 다시 확인해 반영. 기록은 [docs/audit/journal_expansion_2026-10-20.md](docs/audit/journal_expansion_2026-10-20.md).
- **표·그림**: 한글·Word 원고의 표·그림을 옮김(칸 안·캡션 각주 포함). 목차를 표로 짠 원고는 목차를 다시 만들지 않음.
- **휴대폰**: 서랍형 메뉴·아래쪽 버튼 막대·구조/결과 전환, 홈 화면 설치·오프라인.
- **화면 그림 6종**과 **한영 안내**(README·소개 페이지·앱 도움말 영어 절, 영문 주소 tugotl.html), 사용량 배지.
- **분야 거르기**: 학회 선택 칸 위에서 국어국문학 종합·현대문학·고전문학·구비민속·문학교육·비교문학·문화연구·대중문화·문화콘텐츠로 목록을 좁힘.
- **감사 반영**(코드 감사 + 학회 25곳 규정 원문 대조, [review13_code](docs/audit/review13_code.md)·[review13_data](docs/audit/review13_data.md)): 한글 내어쓰기를 한글 방식으로 써서 참고문헌·각주 둘째 줄이 두 배로 들어가던 문제, 문단 위·아래 간격이 절반으로 들어가던 단위 오류, 참고문헌 뒤 영문 제목·저자가 참고문헌으로 잡히던 문제, 규정에 없는 각주·제목이 본문 모양으로 나오던 문제, DOCX 글상자 속 표·중복 그림·빈 표, 같은 자리의 각주·표 순서를 고침. 학회 데이터 보충(탐라문화 양식 수치, 대중음악·트랜스- 각주, 표지·주제어 머리말 등).

**v1.3 (2026-10-15)** — 화면 정리, 학회 양식 정제, 역할 인식 3회차.
- 학회 선택 목록을 등재지·등재후보지 순, 학술지 이름 가나다순으로. 자료 수집용 내부 분류(양식 파일·규정 수치·일반 서식)는 화면에서 뺌.
- 학회가 공개한 논문 양식 34개 모두 견본 논문 글자·실명·이메일을 지우고 서식만 남김.
- **화면 그림 6종**: 빈 화면·처음 사용 안내·투고 일정 머리·변환 완료·휴대폰 첫 화면·소개 페이지 첫 화면(Codex 그림 생성, `assets/prompts.json`·`tools/gen_assets.mjs`).
- **휴대폰에서 작업**: 서랍형 메뉴, 아래쪽 버튼 막대, 구조·결과 전환, 터치 크기 44px, 공유 시트 저장, 홈 화면 설치·오프라인(manifest·서비스 워커, 웹 배포본만). gh-pages 배포는 `node tools/publish_pages.mjs`로.
- **표·그림을 옮김**(지금까지는 개수만 알리고 버렸음). 한글 원고: 표·그림·도형 개체와 그 글자·문단 모양·테두리·그림 파일을 학회 문서로 옮겨 심음, 그림·표 번호의 ‘새 번호’ 지정 유지. Word 원고: 표(합친 칸·음영·테두리, 칸 속 표)와 그림(인라인·떠 있는 그림·옛 VML 그림)을 한글 표·그림으로 만듦. 칸 안 각주는 제자리에서 본문 각주와 번호를 이어 매기고, 캡션 안 각주는 표·그림 바로 뒤로 옮김. 판면보다 넓은 표·그림은 폭을 줄임. 새 역할 ‘표·그림’, ‘표·그림 주석(자료·주)’.
- 첫 구역이 표 하나로 된 2구역 양식에서 산출물이 비던 엔진 결함 수정.
- 각주: 제목·저자를 표로 짠 원고에서 표 칸 안의 ‘*’ 소속·사사 각주가 빠지던 문제 수정(이제 표와 함께 칸 안 제자리로 옮김). ‘*’ 뒤 묶음 빈칸을 그대로 옮김. 학회 양식 29개×6곳 대조에서 ‘*’·‘**’·‘※’ 각주와 새 번호(1부터 다시)가 모두 원고와 같게 나옴.
- 역할 인식(외부 말뭉치 3회차): 영문초록 속 한글 줄, 제목 없는 영문초록, 긴 초록, 목차 속·끝의 ‘참고문헌·Abstract’, 점선·그림 목차, 초록 문장 조각, 참고문헌 소분류, 한자 ‘參考文獻’, 글자 사이를 띄운 저자 이름.
- 오류 표: 옛 한글 문서의 겹낫표(󰡔󰡕, 보조평면 글자)가 든 참고문헌·각주에서 검색 링크를 만들다 ‘URI malformed’로 변환이 멈추던 결함 수정(사용자 제보).
- 배포 주소 첫 화면을 소개 페이지로(방문 수 집계), 내려받기는 GitHub Releases의 tugotl.html(내려받기 수 집계).

**v1.2 (2026-10-14)** — 학회 30곳 추가(52곳 → 82곳)와 학회별 쪽수·체재 규칙 확장.
- 학회 추가(52곳 → 60곳): 만화웹툰연구(바탕틀), 픽션과 논픽션, 이상리뷰, 콘텐츠와산업, 한국출판학연구, 스토리콘텐츠, 문화와 내러티브, 콘텐츠문화연구. 애니메이션연구 규정 대조 반영.
- 새 규칙: 주제어를 본문 뒤·참고문헌 앞에 두는 체재, p./pp. 뒤 한 칸 띄움(‘pp. 1-5’).
- 학회 추가(60곳 → 82곳): 각 학회 JAMS·홈페이지 공개 규정을 모아 22곳 추가(한국언어문학, 우리어문연구, 한민족어문학, 어문론집, 국제한인문학연구, 한성어문학, 이화어문논집, 겨레어문학, 어문논총, 문학교육학, 문학과 종교, 문학과환경, 근대서지, 한국아동문학연구, 동화와 번역, 문학과 영상, 영상문화, 드라마연구, 영화연구, 문화산업연구, 다문화콘텐츠연구, 만화애니메이션연구). 학회가 공개한 양식 13개를 바탕틀로 쓰되, 견본 논문의 글자·실명·이메일은 정제 도구(tools/sanitize_template.mjs)로 견본 문구로 바꾸고 서식만 남김.
- 새 규칙: 국외 문헌 쪽 범위의 전각 하이픈(‘pp. 7－8’), 국외 문헌만 p. 뒤 한 칸, 국외 문헌도 국문과 같은 단위(‘20~37면’).
- 역할 인식(외부 말뭉치 2회차): 점선 목차·표 차례, 통계 숫자 줄, 쪽 아래 각주 줄, 참고문헌 소분류, 초록 속 소속 표기, 초록 제목 없는 초록, 목차 속 경계 제목.
- 충실도: 쪽수 교정이 숫자 안 강조·각주 위치를 옮기지 않도록 글자·경계 대응을 단계마다 합성, 같은 문헌의 앞 쪽수 칸을 언어 판정에서 제외, Keywords 이어짐과 영문 서술문 구분, 점선 목차보다 인용 서식 우선(ASTRA 10~12차, 12차 99점).

**v1.1 (2026-10-14)** — 공개 뒤 Opus·Sonnet 충실도 감사 8차와 ASTRA 감사 5차를 거쳐 반영한 수정입니다. 조치표는 `docs/audit/response_round3_fidelity.md`에 있습니다.
- 보존: 긴 원고에서 보조평면 글자(겹낫표 PUA 등)가 깨지던 문제, 각주 안 줄바꿈·강조·번호(사사 각주, 새 번호 지정)·표 안 각주, DOCX 미주·기호·하이픈·사용자 지정 표시 각주, DOCX 이름공간 접두사가 다른 문서와 깨진 문서의 처리.
- 구조: 체재에 없는 묶음(목차·국문초록·투고일)의 위치, 주제어·초록·참고문헌 표지 인식 확대와 본문 줄 오인 방지, 영문 논문, 인용문 사이 빈 줄, 두 줄 제목·소속 줄.
- 표지 문구: 주제어 머리말에 바탕틀 안내 글자가 섞이던 문제, 머리말과 값의 글자 모양 분리.
- 서지: APA·Chicago 변환이 각주 문단·앞 공백을 유지하고 빈 저자·연월일·권호 항목은 건드리지 않음, 정오표를 변환 앞에서 대조, 낫표 안에서 문헌을 나누지 않음.
- TXT·MD: 별표 강조 경계(저자 이름 뒤 별표 보존, 한 글자, `\*`, `***`), 강조 안 각주, 각주 정의 이어짐·중복 경고.
- 기능: 바탕틀 없는 사용자 학회, 가져오기 병합과 저장 실패 원복, 규정값 서식·일정 검증, 지난 마감 숨김, 입력 상한, 옮기지 않는 서식(강조점·취소선·아래첨자) 경고.
- 쪽수 범위 기호: 학회마다 각주·참고문헌 예시의 기호(~·～·∼·-)가 달라, 48곳은 규정 예시(예시가 없는 곳은 게재 논문에서 주로 쓰는 기호)대로 각주·참고문헌의 쪽수 범위를 맞춥니다. 국문 문헌과 국외 문헌(pp.)을 따로 정한 학회도 있습니다. 본문의 숫자는 바꾸지 않습니다.
- 화면 스킨 7종 — 기본은 다크 스튜디오. 종이·서지, 모노크롬, 네이비·크림, 타이포 편집, 보라(슬랙식, 이전 기본), 바이올렛을 왼쪽 아래 색 점으로 전환(브라우저에만 기억).

**v1.0 (2026-10-13)** — 공개 저장소 첫 판. 내장 학회 52곳.

---

## English

*v2.0 in English:* the footnote separator is fixed (it was missing in 156 template-less journals, and every output had a separator-length bug from the HWP writer that made Hangul draw a full-width line with no gap above), separator rules are read from journal templates, and a new Word (DOCX) export mirrors the Hangul output (page set-up, fonts, spacing, footnotes, tables, pictures). Checked on all 190 journals with Hangul 2024 and Word 16, and cross-checked with IeumOffice. The README is now a short Korean guide followed by an English one, with details in separate documents.

*v1.4 in English:* 108 more KCI journals in literature, classics, Sino-Korean literature, folklore, culture studies, film and cultural content (190 in total: 179 accredited, 11 candidate), each collected from the society’s official rules and cross-checked against the source by two independent model passes. Tables and figures are now carried over (including footnotes inside cells and captions). A phone layout with home-screen install and offline use, six illustrations, English guidance in the README, landing page and in-app help, usage badges, and a field filter for the journal list. A code audit and a source-by-source check of 25 journals led to fixes: hanging indents are now written the way Hangul draws them (the second line no longer moves twice as far), paragraph spacing is no longer halved, English titles after the references are recognised, missing footnote/heading rules fall back to proportional defaults instead of body text, and several DOCX table/picture edge cases are handled.
