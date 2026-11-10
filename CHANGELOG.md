# 변경 내역 · Changelog

판마다 무엇이 바뀌었는지 적습니다. 배포본은 [Releases](https://github.com/fansenryu-cmd/tugotl/releases)에 있습니다. *English summaries follow the Korean.*

**v2.4.2 (2026-11-10)** — 예문 번호 규칙 바로잡기, 한글 글꼴 따로 3곳, 규정 주소 링크.
- **예문 번호 규칙 고침**: v2.4에서 넣은 규칙이 진짜 ‘(n)’ 항 제목을 본문으로 내리던 세 경우를 막음 — 긴 ‘(2)’ 제목이 본문으로 잡혀 (1)·(3)이 건너뛴 번호로 보이던 것, 절마다 하나씩인 ‘(1)’·‘(2)’, ‘(1) AI: 개념과 쓰임’·‘(2) [갈래 1] 얼개 짜기’처럼 쌍점·대괄호가 든 제목. 한편 ‘(2) John left.’처럼 표시 없이 문장만 있는 영문 예문도 예문 꼴 줄이 둘 이상이면 본문으로 둠. 판정은 줄 모양, 장·절을 넘어 이어지는 번호, 한 절 안의 예문 줄 수 세 가지로 함.
- **한글·영문 글꼴 따로 3곳**: 음성음운형태론연구·담화와 인지·ESP Review — 규정대로 한글·한자는 바탕체, 영문은 Times New Roman(v2.4.1의 `format.fontHangul`).
- **규정 원문·안내 주소**: 학회 정보의 출처 가운데 주소가 든 것은 설명이 붙어 있어도 주소를 링크로 보여 줌(47곳 → 208곳).
- **시험 보강**: 지어낸 원고 3편(예문이 있는 국문·영문 언어학 논문, ‘(1)·(2)’ 항 제목을 쓰는 교육학 논문)과 기대 판정을 `tests/fixtures/`에 두고, 전수 시험표(`tools/verify_matrix.mjs`)가 258곳 × 8편으로 돌며 기대 판정도 함께 봄. `tools/example_rule_test.mjs`(줄 꼴 74가지)·`tools/fixture_roles_test.mjs`(774가지) 추가.

**v2.4.1 (2026-11-09)** — 한국영어학회(영어학) 집중 점검.
- **한글·영문 글꼴 따로**: 규정 서식에 한글 글꼴을 따로 적는 `format.fontHangul`을 더함. 『영어학』은 규정대로 한글·한자는 한컴바탕, 영문은 Times New Roman(HWP·HWPX·Word 모두).
- **재현 점검**: 『영어학』 게재 논문 11편(국문 7·영문 4)을 한국영어학회 양식으로 변환해 표 57개·그림 97개·각주를 원고와 대조(모두 일치). 기록은 [docs/audit/journal_expansion_2026-11-09.md](docs/audit/journal_expansion_2026-11-09.md).

**v2.4 (2026-11-09)** — 영어학·영어영문학 30곳 추가(228곳 → 258곳), 언어학 원고 인식.
- **새 학회(분야 ‘영어학·영어영문학’ 신설)**: 영어학(한국영어학회), 영어학연구(한국영어학학회), 현대문법연구, 생성문법연구, 언어과학, 언어과학연구, 언어연구(한국현대언어학회), 언어학(대한언어학회), 언어(한국언어학회), 음성음운형태론연구, 언어와 정보, 형태론, 영어영문학(한국영어영문학회), 신영어영문학, 새한영어영문학, 영어영문학21, 영어영문학연구(대한영어영문학회·한국중앙영어영문학회), 영어영문학(미래영어영문학회), 현대영어영문학, 영미어문학, 현대영미어문학, 융합영어영문학, 언어학(사단법인 한국언어학회), 담화와 인지, 응용언어학, Journal of Pan-Pacific Association of Applied Linguistics, 언어연구(Linguistic Research, 경희대), ESP Review, 언어와 정보 사회. 학회 공식 규정·양식만으로 수집하고(바탕틀 21곳), Sonnet·Haiku가 따로 원문과 대조한 뒤 지적을 반영.
- **예문 번호**: 언어학 논문의 ‘(1) a. …’·‘(3) A: …’ 같은 예문 줄을 ‘(n)’ 항 제목으로 잡던 것을 고침(예문 꼴이거나, 번호가 장·절을 넘어 1부터 다시 시작하지 않고 이어지면 본문).
- **제목 없는 영문 초록**: 제목·저자 다음 ‘Abstract’ 제목 없이 영문 초록과 Keywords 줄이 오는 원고에서 초록을 본문으로 잡던 것을 고침(국문 ‘주제어 줄 앞 초록’과 같은 규칙).
- **재현 점검**: KCI 원문 논문 5편을 OCR로 옮긴 원고를 새 30곳 양식으로 변환(150회)해 본문·각주·표(칸 글·칸 합치기)·그림(같은 파일)을 대조. 기록은 [docs/audit/journal_expansion_2026-11-09.md](docs/audit/journal_expansion_2026-11-09.md).

**v2.3 (2026-11-08)** — 중국학보 추가(이슈 #1 요청, 227곳 → 228곳).
- **새 학회**: 『中國學報』(중국학보, 한국중국학회, KCI 등재) — 사용자 요청([이슈 #1](https://github.com/fansenryu-cmd/tugotl/issues/1))으로 넣은 국어국문 밖(중국 어문사철) 첫 학회. JAMS 제118집 공지 첨부 ‘투고 및 작성 규정(106집부터)’·‘투고논문 작성 샘플’을 따름. 샘플 HWP를 견본화해 바탕틀로 쓰고(목차 ‘目 次’, 참고문헌 ‘參考文獻’, 국문초록·Abstract는 논문 끝), 각주 쪽수는 p./pp. 붙여 쓰기와 ～(pp.11～22). 저작권 이양 동의서 내장. 분야 거르기는 ‘비교·세계문학’.
- 작성규정 표와 샘플 양식이 다른 곳(글꼴, 인용문 크기·여백, 본문 들여쓰기, 범위 기호)은 샘플 양식을 따르고 학회 정보의 참고(notes)에 둘 다 적음.

**v2.2 (2026-11-04)** — 유아교육·보육 학회 19곳 추가(208곳 → 227곳), 재현 점검으로 찾은 고침.
- **새 학회**: 유아교육연구, International Journal of Early Childhood Education, 유아교육학논집, 열린유아교육연구, 미래유아교육학회지, 생태유아교육연구, 구성주의유아교육연구, 영유아교육과정연구, 영유아교육·보육연구, 영유아교육: 이론과 실천, 한국유아교육연구, 유아특수교육연구, 육아지원연구, 아동교육, 어린이미디어연구, 유아교육·보육복지연구, 육아정책연구, 한국영유아보육학, 한국보육지원학회지. 분야 거르기 ‘유아교육·보육’ 신설(어린이문학교육연구 포함 20곳).
- **장·절 단계**: ‘Ⅰ.’ 장 아래 ‘1.’ 절을 쓰는 원고에서 ‘1.’을 장으로 잡던 것을 고침(Ⅰ.→장, 1.→절, 1)→항, (1)→목). ‘그림 2를 통해 …’ 같은 본문 문장을 그림 제목으로 잡지 않음.
- **표·그림 제목 쪽 나눔**: 표 위 제목(‘N=625’ 같은 짧은 줄 포함)과 그림 아래 제목을 ‘다음 문단과 함께’로 묶어 제목만 쪽 끝에 남지 않게 함.
- **분량 한도**: 학회 단위대로 비교(매·쪽·자·단어). 전에는 ‘25쪽 이내’도 ‘25매’로 보였음. 국문초록이 없는 학술지는 체크리스트에서 국문초록을 묻지 않음.
- **재현 점검**: KCI 원문 논문 5편(유아교육연구·육아지원연구·생태유아교육연구)을 OCR로 옮긴 원고를 19곳 양식으로 변환해 본문·각주·표(칸 글·칸 합치기)·그림(같은 파일)을 대조. 기록은 [docs/audit/journal_expansion_2026-11-04.md](docs/audit/journal_expansion_2026-11-04.md).

**v2.1 (2026-11-01)** — 학회 18곳 추가(190곳 → 208곳).
- **국어교육 11곳**: 국어교육, 국어교육연구(국어교육학회·서울대), 국어교육학연구, 새국어교육, 한국초등국어교육, 독서연구, 작문연구, 문법 교육, 우리말교육현장연구, 리터러시 연구. **한문교육 2곳**: 漢文敎育論集, 한자한문응용연구.
- **드라마(방송) 4곳**: 한국방송학보, 방송과 커뮤니케이션, 방송문화연구, 미디어, 젠더 & 문화 — TV 드라마 연구가 실리는 학술지. **불교문예연구** 1곳.
- 분야 거르기 이름을 ‘국어·문학교육·아동문학’, ‘대중문화·영상·드라마’로 넓힘. 문예창작·대중서사·애니메이션·만화·웹툰·드라마 전문지는 이미 모두 들어 있음을 KCI 분류 목록과 맞대어 확인.
- 학회 공식 규정만으로 수집하고 Sonnet·Haiku가 따로 원문과 대조한 뒤 엇갈린 항목은 원문을 다시 확인해 반영. 기록은 [docs/audit/journal_expansion_2026-11-01.md](docs/audit/journal_expansion_2026-11-01.md).

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

*v2.3 (2026-11-08):* *The Journal of Chinese Studies* (中國學報, Korean Society of Chinese Studies), requested in issue #1 — the first journal outside Korean language and literature (228 in total). Its sample manuscript is the template; footnotes use p./pp. with the ～ range mark, and the copyright transfer form is bundled. Where the society’s rule table and its sample file disagree (fonts, block-quote size and margins, body indent, range mark), the sample file is followed and both are recorded in the journal notes.

*v2.2 (2026-11-04):* 19 early childhood education and care journals (227 in total) with a new field filter. Fixes found while testing five OCR'd KCI papers: section levels under Roman-numeral chapters (Ⅰ. → 1. → 1)), table and figure captions kept on the same page as the object, and length limits compared in each journal's own unit (sheets, pages, characters or words).

*v2.1 (2026-11-01):* 18 more journals (208 in total): 11 in Korean-language education, 2 in classical Chinese (hanmun) education, 4 broadcasting journals that publish TV-drama research, and one on Buddhist literature, each collected from the society’s official rules and cross-checked twice.

*v2.0 in English:* the footnote separator is fixed (it was missing in 156 template-less journals, and every output had a separator-length bug from the HWP writer that made Hangul draw a full-width line with no gap above), separator rules are read from journal templates, and a new Word (DOCX) export mirrors the Hangul output (page set-up, fonts, spacing, footnotes, tables, pictures). Checked on all 190 journals with Hangul 2024 and Word 16, and cross-checked with IeumOffice. The README is now a short Korean guide followed by an English one, with details in separate documents.

*v1.4 in English:* 108 more KCI journals in literature, classics, Sino-Korean literature, folklore, culture studies, film and cultural content (190 in total: 179 accredited, 11 candidate), each collected from the society’s official rules and cross-checked against the source by two independent model passes. Tables and figures are now carried over (including footnotes inside cells and captions). A phone layout with home-screen install and offline use, six illustrations, English guidance in the README, landing page and in-app help, usage badges, and a field filter for the journal list. A code audit and a source-by-source check of 25 journals led to fixes: hanging indents are now written the way Hangul draws them (the second line no longer moves twice as far), paragraph spacing is no longer halved, English titles after the references are recognised, missing footnote/heading rules fall back to proportional defaults instead of body text, and several DOCX table/picture edge cases are handled.
