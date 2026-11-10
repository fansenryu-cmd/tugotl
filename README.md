# 투고틀 (tugotl) v2.4.2

**KCI 학술지 투고용 논문 양식 변환기** · [English below](#english)

[![Downloads](https://img.shields.io/github/downloads/fansenryu-cmd/tugotl/total?label=%EB%82%B4%EB%A0%A4%EB%B0%9B%EA%B8%B0%20downloads&color=e8b14a)](https://github.com/fansenryu-cmd/tugotl/releases)
[![Latest release](https://img.shields.io/github/v/release/fansenryu-cmd/tugotl?label=%EC%B5%9C%EC%8B%A0%20release&color=2a2a2a)](https://github.com/fansenryu-cmd/tugotl/releases/latest)
[![Visits](https://hits.sh/fansenryu-cmd.github.io/tugotl.svg?label=%EB%B0%A9%EB%AC%B8%20visits&color=e8b14a&labelColor=2a2a2a)](https://fansenryu-cmd.github.io/tugotl/)
[![License](https://img.shields.io/github/license/fansenryu-cmd/tugotl?label=license)](LICENSE)

## 한국어

**AI의 개입 없이, 오로지 프로그램 규칙만으로, 내 PC 안에서 작동하며, 논문 정보를 어디에도 저장·전송하지 않는 논문 서지·양식 변환기입니다.**

원고(HWP·HWPX·DOCX·TXT·MD)를 올리고 학회지를 고르면 그 학회의 양식과 규정에 맞춘 한글 파일을 만듭니다. HWPX나 Word(DOCX)로도 저장할 수 있습니다. 글꼴·크기·줄 간격·여백·용지·각주 서식은 학회 양식을 그대로 따르고, 원고의 문장은 바꾸지 않습니다. 내장 학회는 258곳입니다(KCI 등재지 246곳, 등재후보지 12곳).

### 바로 쓰기

1. **[tugotl.html 내려받기](https://github.com/fansenryu-cmd/tugotl/releases/latest/download/tugotl.html)**(약 30 MB) 또는 **[웹에서 바로 열기](https://fansenryu-cmd.github.io/tugotl/)**.
2. Chrome이나 Edge로 엽니다. 설치도 인터넷도 필요 없습니다.
3. **투고처 선택** → 원고 놓기 → **적용** → 미리보기 확인 → **저장**.

휴대폰에서는 웹 주소를 연 뒤 ‘홈 화면에 추가’하면 앱처럼 쓰고, 한 번 연 뒤에는 인터넷 없이도 열립니다.

### 주요 기능

- **학회 양식 그대로:** 학회가 배포한 양식 HWP 또는 규정 수치로 서식을 입힙니다. 체재 순서, 초록·주제어 위치, 목차, 각주 구분선까지 맞춥니다.
- **각주·참고문헌 표기:** 쪽·면·p./pp., 쪽수 범위 기호(~·-), 낫표를 학회 예시대로 맞춥니다. 끌 수도 있습니다.
- **정오표와 투고 전 확인:** 각주 인용과 참고문헌을 대조해 어긋난 곳을 붉게 표시하고, 분량과 체크리스트를 보여 줍니다.
- **표·그림:** 원고의 표·그림과 그 안의 각주를 옮깁니다.
- **저장 형식:** HWP, HWPX, Word(DOCX). Word 파일도 한글 산출물과 같은 서식으로 만듭니다.
- **학회 정보:** 투고 시스템 주소, 마감, 심사료·게재료, 분량, 제출 서류와 내장 서식. 분야로 학회 목록을 좁힐 수 있습니다.

자세한 사용법은 [사용 안내](docs/사용안내.md), 전체 학회는 [학회 목록](docs/학회목록.md)에 있습니다.

### 개인정보

원고는 브라우저 메모리에서만 처리되고, 서버·외부 전송·AI 호출이 없습니다. 사용량은 배포본 내려받기 수와 소개 페이지 방문 수만 셉니다.

### 최근 변경 — v2.4.2 (2026-11-10)

- **v2.4.2 — 예문 번호·글꼴·규정 주소:** ‘(1) AI: 개념과 쓰임’ 같은 항 제목을 언어학 예문으로 잘못 보아 본문으로 내리던 것을 고쳤습니다. 음성음운형태론연구·담화와 인지·ESP Review는 규정대로 한글 바탕체·영문 Times New Roman으로 넣습니다. 학회 정보의 규정 원문·안내 주소를 208곳에서 링크로 보여 줍니다
- **v2.4.1 — 『영어학』(한국영어학회) 집중 점검:** 규정대로 한글·한자는 한컴바탕, 영문은 Times New Roman으로 넣고(한글 글꼴을 따로 정하는 규정 서식), 게재 논문 11편으로 표·그림·각주를 대조했습니다
- **영어학·영어영문학 30곳 추가:** 영어학 전문지(영어학·영어학연구·현대문법연구·생성문법연구 등), 영어학과 영문학을 함께 싣는 영어영문학 종합지, 영어 논문이 중심인 언어학지 등 KCI 등재 30곳을 넣어 258곳이 됐습니다. 분야 거르기에 ‘영어학·영어영문학’을 새로 만들었습니다
- **언어학 원고 인식:** 예문 번호(‘(1) a. …’, ‘(3) A: …’)를 항 제목으로 잡지 않고, ‘Abstract’ 제목 없이 Keywords 줄 앞에 온 영문 초록을 영문초록으로 잡습니다
- **재현 점검:** KCI 원문 논문 5편(영어학연구·응용언어학·생성문법연구·영어영문학·언어과학)을 새 30곳 양식으로 변환해 본문·각주·표·그림을 대조했습니다

v2.3 (2026-11-08)에서는 사용자 요청([이슈 #1](https://github.com/fansenryu-cmd/tugotl/issues/1))으로 『中國學報』(중국학보, 한국중국학회)를 넣었고, v2.2 (2026-11-04)에서는 유아교육·보육 학회 19곳을 넣고(분야 거르기 ‘유아교육·보육’ 신설) 장·절 제목 단계와 표·그림 제목 쪽 나눔을 고쳤으며, v2.1 (2026-11-01)에서는 국어교육·한문교육·방송(드라마)·불교문예 학회 18곳을 넣었고, v2.0 (2026-10-25)에서는 각주 구분선을 바로잡고(학회 양식의 선 길이·굵기·색) 한글 산출물과 같은 서식의 Word(DOCX) 저장을 넣었습니다.

전체 내역은 [CHANGELOG.md](CHANGELOG.md), v2.0의 조사·검증 기록은 [docs/v2.0_설계.md](docs/v2.0_설계.md)에 있습니다.

### 더 보기

| 문서 | 내용 |
|---|---|
| [docs/사용안내.md](docs/사용안내.md) | 화면 흐름, 설정, 정오표, 휴대폰, 표·그림, 개인정보 |
| [docs/학회목록.md](docs/학회목록.md) | 내장 학회 258곳 전체 목록 |
| [docs/개발.md](docs/개발.md) | 변환 원리, 빌드·검증 도구, 코드 구조, 학회 추가 방법 |
| [docs/글꼴안내.md](docs/글꼴안내.md) | 학회별 필요 글꼴 |
| [CHANGELOG.md](CHANGELOG.md) | 판별 변경 내역 |
| [docs/audit/](docs/audit/) | 감사·검증 보고서 |

### 라이선스와 출처

소스 코드는 [MIT](LICENSE)입니다(© 2026 이융희). 배포본에 들어 있는 제3자 소프트웨어는 다음과 같습니다.

| 소프트웨어 | 쓰임 | 라이선스 | 권리자 |
|---|---|---|---|
| [rhwp](https://github.com/edwardkim/rhwp) 0.8.7 | HWP 읽기·쓰기 엔진 | MIT | Edward Kim |
| [JSZip](https://github.com/Stuk/jszip) 3.10.1 | DOCX·HWPX 묶음 | MIT(MIT/GPL 중 선택) | Stuart Knightley 외 |
| [pako](https://github.com/nodeca/pako) 1.0.11 | 압축 | MIT | Vitaly Puzrin, Andrei Tuputcyn |
| [cfb](https://github.com/SheetJS/js-cfb) 1.2.2 | HWP 복합 파일 | Apache-2.0 | SheetJS LLC |

학회 양식·서식·규정 원본은 각 학회의 저작물로, 투고 편의를 위해 수록했으며 요청하면 제거합니다. 적용 범위는 [LICENSE-SCOPE.md](LICENSE-SCOPE.md), 고지 전문은 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 있습니다. 투고 전에는 학회 공지와 산출 파일을 반드시 직접 확인하십시오(보증 없음).

**감사의 말.** 브라우저 안에서 HWP를 다루게 해 준 Edward Kim의 rhwp, 규정과 양식을 공개한 각 학회 편집위원회, 착상을 준 drjunoh 님(ece.drjunoh.chatgpt.site)께 감사드립니다. 검증과 참고에는 [이음 오피스](https://github.com/pblsketch/openoffice)(pblsketch, Apache-2.0, Mainfunc의 GenOffice 기반)와 [kordoc](https://github.com/chrisryugj/kordoc)(chrisryugj, MIT)을 썼고, 둘 다 배포본에는 들어 있지 않습니다. 코드와 문서는 AI 코딩 도구(Claude, Anthropic)의 도움을 받아 썼으며, 설계·검증·최종 확인은 저자가 했습니다. 변환기 자체는 AI를 쓰지 않습니다.

### 의견·문의

써 보신 의견이 다음 판을 만듭니다. 아래 양식 중 맞는 것을 골라 남겨 주세요.

- **[양식이 틀렸어요](https://github.com/fansenryu-cmd/tugotl/issues/new?template=1-format-error.yml)** — 변환 결과가 학회 규정과 다를 때
- **[학회지를 추가해 주세요](https://github.com/fansenryu-cmd/tugotl/issues/new?template=2-add-journal.yml)** — 목록에 없거나 규정·양식이 바뀐 학회지
- **[사용 후기·제안](https://github.com/fansenryu-cmd/tugotl/issues/new?template=3-feedback.yml)** — 좋았던 점, 불편한 점, 바라는 기능

**의견 게시판(Issues)은 누구나 볼 수 있습니다. 원고 파일이나 원고 문장은 올리지 마세요.** 원고가 있어야 설명되는 문제는 이융희 · jojanggun@naver.com 으로 따로 보내 주세요. 메일로 받은 원고는 인식 규칙을 고치는 데만 쓰고 공개하지 않습니다.

---

## English

**tugotl** (투고틀, “submission frame”) reformats a scholarly manuscript to the house style of a Korean academic journal listed in the **KCI** (Korea Citation Index). It is for anyone submitting to Korean humanities journals, including researchers outside Korea who do not work in Hangul (HWP), the word processor most Korean journals require.

- **Input:** HWP, HWPX, DOCX, TXT or MD. **Output:** HWP, HWPX or Word (DOCX), laid out in the journal’s own template or published specifications.
- **Rules only, no AI.** The text of your paper is never rewritten. Only citation details in footnotes and references (page units, page-range marks, title brackets) are normalised to the journal’s rules, and each can be switched off.
- **Private by design.** Everything runs in your browser from a single offline HTML file. Nothing is uploaded.
- **258 built-in journals** (246 KCI-accredited, 12 candidate) with submission links, deadlines, fees, length limits and required forms.

**Quick start:** download **[tugotl.html](https://github.com/fansenryu-cmd/tugotl/releases/latest/download/tugotl.html)** (about 30 MB) and open it in Chrome or Edge, or use it online at **https://fansenryu-cmd.github.io/tugotl/**. Pick the journal, drop your manuscript, press **적용 (Apply)**, check the preview, and press **저장 (Save)**. The interface is in Korean; the in-app help has an English section.

**v2.4.2 (2026-11-10):** the rule for numbered linguistic examples no longer turns real “(1) …” subsection headings (ones with a colon or brackets, or only one per section) into body text; *Studies in Phonetics, Phonology and Morphology*, *Discourse and Cognition* and *ESP Review* now use 바탕체 for Hangul and Hanja and Times New Roman for Latin text as their rules require; and the journal panel links the rule and guideline pages for 208 journals. v2.4.1 (2026-11-09): for the *Korean Journal of English Language and Linguistics* the Hangul and Hanja text now uses 한컴바탕 and Latin text Times New Roman as its rules require, checked against 11 published papers. **What’s new in v2.4 (2026-11-09):** 30 KCI-accredited journals in English linguistics and English language and literature, with a new filter — 258 journals in total. Linguistics manuscripts are read better: numbered examples such as “(1) a. …” are no longer taken for section headings, and an English abstract without an ‘Abstract’ heading before the Keywords line is recognised as the abstract. v2.3 (2026-11-08) added *The Journal of Chinese Studies* (中國學報) at a user’s request ([issue #1](https://github.com/fansenryu-cmd/tugotl/issues/1)). v2.2 (2026-11-04) added 19 early childhood education and care journals and fixed section levels under Roman-numeral chapters, captions left alone at the bottom of a page, and page-based length limits. v2.1 (2026-11-01) added 18 journals in Korean-language education, classical Chinese education, broadcasting (TV drama) and Buddhist literature; v2.0 (2026-10-25) fixed the footnote separator and added Word (DOCX) export. See [CHANGELOG.md](CHANGELOG.md) and [docs/v2.0_설계.md](docs/v2.0_설계.md).

**More:** [usage guide](docs/사용안내.md#english--using-tugotl) · [journal list](docs/학회목록.md) · [development](docs/개발.md#english--development) · [changelog](CHANGELOG.md).

**License and credits.** The source code is MIT-licensed (© 2026 Yunghee Lee / 이융희). Bundled: rhwp, JSZip and pako (MIT) and cfb by SheetJS (Apache-2.0); see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Journal templates, forms and regulations belong to the societies and will be removed on request. Thanks to Edward Kim for rhwp, to the societies for publishing their rules, and to drjunoh for the original idea. IeumOffice (pblsketch, Apache-2.0) and kordoc (chrisryugj, MIT) were used for checking and reference and are not bundled. The code was written with the help of an AI coding tool (Claude, Anthropic); the converter itself uses no AI. **No warranty:** always check the journal’s current notice and the saved file before submitting.

**Feedback:** report [wrong formatting](https://github.com/fansenryu-cmd/tugotl/issues/new?template=1-format-error.yml), [request a journal](https://github.com/fansenryu-cmd/tugotl/issues/new?template=2-add-journal.yml), or [share your experience](https://github.com/fansenryu-cmd/tugotl/issues/new?template=3-feedback.yml), in Korean or English. **Issues are public: never attach your manuscript or paste its text.** If a problem can only be shown with the manuscript, e-mail Yunghee Lee (이융희) at jojanggun@naver.com; it will be used only to fix the rules and will not be published. Pull requests are welcome.
