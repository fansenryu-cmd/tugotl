# 투고틀 2026-10-20 확장분 규정 대조 감사 (review13 · 데이터)

- 대상: 2026-10-20에 추가한 학회 108곳 중 25곳을 시드 20261020으로 뽑아(등재후보 4, 등재 21) 규정 원문(학회 홈페이지·JAMS 투고규정·첨부 양식 HWP/PDF)과 산출 HWP를 대조.
- 방식: 시험 원고 두 편(paper1·paper3)을 25곳으로 변환해 산출 HWP를 rhwp로 다시 열고 용지·여백·역할별 글꼴·크기·줄간격·들여쓰기·장평·자간, 각주 서식, 체재 순서, 표지 문구, 각주·참고문헌의 쪽 단위와 범위 기호 코드포인트를 뽑아 규정과 맞춤. 5개 묶음(A~E)으로 나눠 맡김.
- 표본: kdm, baekrok, jkr, sccs(등재후보) / trans, khallyu, kcri, bigyominsok, shiga, kiagc, woohan, dakll, koreastudy, yeolsang, eih, itkc, dkuas, koreanshamanism, kaspm, tamla, badalmal, classicedu, kosacm, kcl1994, kuhjhm(등재)
- 전수 정합성: 108곳 모두 쪽 단위·범위 기호·표지 문구 길이·체재 묶음 이름·format 역할 키가 프로그램이 아는 값이고 id 중복 없음.

## 잘 맞은 것

- 25곳 모두 체재 순서가 규정과 같게 재배열된다(khallyu 제외 — 아래 고침).
- 각주 쪽 단위와 범위 기호는 규정 원문의 코드포인트까지 일치: kdm·dkuas·koreanshamanism·eih `~`(U+007E), itkc `∼`(U+223C), woohan·kuhjhm `～`(U+FF5E), tamla·dakll·baekrok `-`, jkr `–`(U+2013).
- 규정 수치가 있는 곳(kdm, kosacm, dakll, kiagc, baekrok, sccs, trans, khallyu, kaspm 용지·본문)은 용지·본문·인용 수치가 산출과 맞음.
- 규정에 편집 수치가 없는 GEN 학회(badalmal, classicedu, kcl1994, kuhjhm, woohan, koreastudy, eih, itkc, dkuas, koreanshamanism, kcri, bigyominsok, shiga)는 일반 양식을 쓰는 것이 타당.
- 항목의 일정·비용·분량·자격 값은 원문과 일치(tamla 문의 메일만 공고와 다름 — 메모 추가).

## 결함과 반영 (모두 v1.4 출시 전 반영)

| 구분 | 내용 | 반영 |
|---|---|---|
| 프로그램·상 | 참고문헌 뒤·영문초록 앞의 영문 제목·부제·저자가 참고문헌 항목으로 분류(표본 전체 공통) | 인식 뒤처리로 영문초록부 제목·부제(subtitleEn2)·저자로 돌림 |
| 프로그램·상 | 표 상자로 짠 목차가 체재 재배열에서 목차 자리로 가지 않음(yeolsang) | 목차 표는 목차 묶음으로 옮김 |
| 프로그램·중 | 문단 위·아래 간격이 한글 표시값의 절반(khallyu 제목 위 45pt → 22.5pt) | 저장 배율 1pt=200으로(한글 COM 실측: 양식 45pt = 9000) |
| 프로그램·중 | 장평·자간을 적지 않은 역할이 앞 역할의 값을 물려받음(yeolsang 참고문헌 장평 90 등) | 기본 100%·0% |
| 프로그램·중 | 규정 수치만 있는 학회에서 각주·제목·장 제목·초록 역할이 없으면 본문 모양(각주 10pt 170% 등) | 일반 양식 값을 학회 본문 크기에 비례해 채움 |
| 프로그램·중 | 용지 값이 빠진 FMT 8곳이 빈 문서 기본 여백 | 일반 양식 용지로 채움 |
| 프로그램·중 | 범위 기호 규정이 없을 때 pp.→쪽·면 변환만 `~`를 넣어 한 원고 안에서 `-`와 섞임(classicedu·shiga) | 원고 기호 유지 |
| 프로그램·중 | 쪽 단위를 원고대로 두는 학회는 `p. 25` 띄어쓰기를 적용할 수 없음(jkr) | pageSpace를 keep에서도 적용 |
| 데이터·상 | khallyu·hnlal: 주제어가 【초록】보다 앞(keywordsPosition 중복) | 삭제 |
| 데이터·상 | tamla: 83호 공고가 ‘작성양식 참고’를 지시하는데 A4·일반 양식 | 양식 수치(158×226, KoPubWorld 10pt 180%, 각주 8.7pt 등)를 format으로 |
| 데이터·상 | kiagc: 국문 문헌도 `pp. 45-47`인데 쪽 단위 유지, 참고문헌 새 쪽 없음 | pageUnit p.·pageSpace, 참고문헌 쪽 나눔·표지 |
| 데이터·중 | kaspm 각주가 본문 모양, 핵심어 머리말·들여쓰기 누락 | 작성틀 ‘각주’ 스타일 8.4pt 140%, ‘핵심어:’, 들여쓰기 |
| 데이터·중 | trans 각주 9pt 130%·영문초록 새 쪽·‘핵심어:’ 누락 | 보충(본문 앞 쪽 나눔은 메모로 안내) |
| 데이터·중 | 표지 문구 누락: dakll ‘<목  차>’, yeolsang ‘차례’·‘핵심어 :’, khallyu ‘< 목 차 >’, jkr Abstract·References, kosacm 표지 역할이 장 제목 모양 | 보충 |
| 데이터·하 | 주제어 머리말: baekrok ‘•주제어 :’, sccs ‘키워드:’, kdm ‘주제어 :’, itkc ‘Key Words:’, tamla ‘Key-words:’ | 보충 |
| 데이터·하 | baekrok 글꼴 ‘바탕’ → 규정 ‘바탕체’, sccs 절 제목 진하게, yeolsang 영문초록 왼쪽 여백 15 | 보충 |

## 남긴 것

- sccs: 양식은 ‘ABSTRACT’ 표지 하나 아래 국문·영문 요약을 함께 두는데, 영문 표지를 없애는 기능은 없음.
- kuhjhm: 참고문헌의 국문 범위 기호(`~`)가 각주(`～`)와 다른데 국문 참고문헌용 설정 키가 없음.
- kaspm·kosacm 등 내주(저자, 연도: 쪽) 규정 학회에 각주 출처 원고를 넣으면 경고 없이 그대로 나감 — 안내 경고 후보.
- 표지 용어만 다른 경우(‘요약문’, ‘국문 개요’, ‘국문요약’)는 규정이 표기 형식을 정하지 않아 원고 표기를 유지.
