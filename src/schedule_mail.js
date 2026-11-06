// 학회 메일에서 확인한 투고 마감 — 자동 생성 파일(손으로 고치지 말 것).
// 관리자가 받은 학회 모집 메일에서 학회·호수·마감·발간일을 모으고, 사람이 확인한 것만 매주 이 파일로 씁니다(tools/mail_schedule.mjs).
// 학회 id → [{ issue, deadline, publish, note }]. journals.js 의 정기 일정보다 앞서고, 같은 시기(40일 안)의 내장 공지는 가립니다.
export const MAIL_SCHEDULE_UPDATED = "2026-11-06";
export const MAIL_SCHEDULE = {
  "dgukoli": [
    {"issue":"82집","deadline":"2026-11-22","publish":"","note":"학회 메일 10/29 · 마감 연장"},
  ],
  "gubo": [
    {"issue":"44집","deadline":"2026-11-20","publish":"","note":"학회 메일 10/30 · 마감 연장"},
  ],
  "hanmun": [
    {"issue":"104집","deadline":"2026-11-25","publish":"","note":"학회 메일 11/01 · 마감 연장"},
  ],
  "interlali": [
    {"issue":"65호","deadline":"2026-11-10","publish":"","note":"학회 메일 11/03"},
  ],
  "klnc": [
    {"issue":"91집","deadline":"2026-11-10","publish":"","note":"학회 메일 11/03"},
  ],
  "koli": [
    {"issue":"68호","deadline":"2026-11-22","publish":"","note":"학회 메일 10/31 · 마감 연장"},
  ],
  "krdiaspora": [
    {"issue":"46호","deadline":"2026-11-22","publish":"","note":"학회 메일 11/02 · 마감 연장"},
  ],
  "mkliterature": [
    {"issue":"80집","deadline":"2026-11-15","publish":"","note":"학회 메일 10/27 · 마감 연장"},
  ],
};
