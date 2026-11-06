# 투고틀 (tugotl) v2.2

**KCI 학술지 투고용 논문 양식 변환기** · [English below](#english)

[![Downloads](https://img.shields.io/github/downloads/fansenryu-cmd/tugotl/total?label=%EB%82%B4%EB%A0%A4%EB%B0%9B%EA%B8%B0%20downloads&color=e8b14a)](https://github.com/fansenryu-cmd/tugotl/releases)
[![Latest release](https://img.shields.io/github/v/release/fansenryu-cmd/tugotl?label=%EC%B5%9C%EC%8B%A0%20release&color=2a2a2a)](https://github.com/fansenryu-cmd/tugotl/releases/latest)
[![Visits](https://hits.sh/fansenryu-cmd.github.io/tugotl.svg?label=%EB%B0%A9%EB%AC%B8%20visits&color=e8b14a&labelColor=2a2a2a)](https://fansenryu-cmd.github.io/tugotl/)
[![License](https://img.shields.io/github/license/fansenryu-cmd/tugotl?label=license)](LICENSE)

## 한국어

**AI의 개입 없이, 오로지 프로그램 규칙만으로, 내 PC 안에서 작동하며, 논문 정보를 어디에도 저장·전송하지 않는 논문 서지·양식 변환기입니다.**

원고(HWP·HWPX·DOCX·TXT·MD)를 올리고 학회지를 고르면 그 학회의 양식과 규정에 맞춘 한글 파일을 만듭니다. HWPX나 Word(DOCX)로도 저장할 수 있습니다. 글꼴·크기·줄 간격·여백·용지·각주 서식은 학회 양식을 그대로 따르고, 원고의 문장은 바꾸지 않습니다. 내장 학회는 227곳입니다(KCI 등재지 215곳, 등재후보지 12곳).

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

### 최근 변경 — v2.2 (2026-11-04)

- **유아교육·보육 학회 19곳 추가:** KCI 등재 유아교육·보육 학술지를 넣어 227곳이 됐고, 분야 거르기에 ‘유아교육·보육’을 새로 만들었습니다. 실제 KCI 논문 5편을 OCR로 옮긴 원고로 본문·표·그림·각주가 그대로 옮겨지는지 확인했습니다([기록](docs/audit/journal_expansion_2026-11-04.md)).
- **인식·서식 고침:** ‘Ⅰ. 장 → 1. 절’ 원고의 제목 단계, 표·그림 제목만 쪽 끝에 남던 문제, ‘쪽’ 단위 분량 한도를 원고지 매수로 세던 오류를 고쳤습니다.

v2.1 (2026-11-01)에서는 국어교육·한문교육·방송(드라마)·불교문예 학회 18곳을 넣었고, v2.0 (2026-10-25)에서는 각주 구분선을 바로잡고(학회 양식의 선 길이·굵기·색) 한글 산출물과 같은 서식의 Word(DOCX) 저장을 넣었습니다.

전체 내역은 [CHANGELOG.md](CHANGELOG.md), v2.0의 조사·검증 기록은 [docs/v2.0_설계.md](docs/v2.0_설계.md)에 있습니다.

### 더 보기

| 문서 | 내용 |
|---|---|
| [docs/사용안내.md](docs/사용안내.md) | 화면 흐름, 설정, 정오표, 휴대폰, 표·그림, 개인정보 |
| [docs/학회목록.md](docs/학회목록.md) | 내장 학회 227곳 전체 목록 |
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
- **227 built-in journals** (215 KCI-accredited, 12 candidate) with submission links, deadlines, fees, length limits and required forms.

**Quick start:** download **[tugotl.html](https://github.com/fansenryu-cmd/tugotl/releases/latest/download/tugotl.html)** (about 30 MB) and open it in Chrome or Edge, or use it online at **https://fansenryu-cmd.github.io/tugotl/**. Pick the journal, drop your manuscript, press **적용 (Apply)**, check the preview, and press **저장 (Save)**. The interface is in Korean; the in-app help has an English section.

**What’s new in v2.2 (2026-11-04):** 19 early childhood education and care journals (227 in total) and a new field filter for them. Five real KCI papers were OCR'd into test manuscripts to check that text, tables, figures and footnotes carry over unchanged. Also fixed: section levels under Roman-numeral chapters, captions left alone at the bottom of a page, and page-based length limits counted as manuscript sheets. v2.1 (2026-11-01) added 18 journals in Korean-language education, classical Chinese education, broadcasting (TV drama) and Buddhist literature; v2.0 (2026-10-25) fixed the footnote separator and added Word (DOCX) export. See [CHANGELOG.md](CHANGELOG.md) and [docs/v2.0_설계.md](docs/v2.0_설계.md).

**More:** [usage guide](docs/사용안내.md#english--using-tugotl) · [journal list](docs/학회목록.md) · [development](docs/개발.md#english--development) · [changelog](CHANGELOG.md).

**License and credits.** The source code is MIT-licensed (© 2026 Yunghee Lee / 이융희). Bundled: rhwp, JSZip and pako (MIT) and cfb by SheetJS (Apache-2.0); see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Journal templates, forms and regulations belong to the societies and will be removed on request. Thanks to Edward Kim for rhwp, to the societies for publishing their rules, and to drjunoh for the original idea. IeumOffice (pblsketch, Apache-2.0) and kordoc (chrisryugj, MIT) were used for checking and reference and are not bundled. The code was written with the help of an AI coding tool (Claude, Anthropic); the converter itself uses no AI. **No warranty:** always check the journal’s current notice and the saved file before submitting.

**Feedback:** report [wrong formatting](https://github.com/fansenryu-cmd/tugotl/issues/new?template=1-format-error.yml), [request a journal](https://github.com/fansenryu-cmd/tugotl/issues/new?template=2-add-journal.yml), or [share your experience](https://github.com/fansenryu-cmd/tugotl/issues/new?template=3-feedback.yml), in Korean or English. **Issues are public: never attach your manuscript or paste its text.** If a problem can only be shown with the manuscript, e-mail Yunghee Lee (이융희) at jojanggun@naver.com; it will be used only to fix the rules and will not be published. Pull requests are welcome.
