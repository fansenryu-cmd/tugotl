// 학회 메일에서 확인한 투고 마감 — 자동 생성 파일(손으로 고치지 말 것).
// 관리자가 받은 학회 모집 메일에서 학회·호수·마감·발간일을 모으고, 사람이 확인한 것만 매주 이 파일로 씁니다(tools/mail_schedule.mjs).
// 학회 id → [{ issue, deadline, publish, note }]. journals.js 의 정기 일정보다 앞서고, 같은 시기(40일 안)의 내장 공지는 가립니다.
export const MAIL_SCHEDULE_UPDATED = '';
export const MAIL_SCHEDULE = {};
