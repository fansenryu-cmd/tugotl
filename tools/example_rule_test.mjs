// 예문 번호 규칙 회귀 시험: node tools/example_rule_test.mjs
// ‘(n)’ 으로 시작하는 줄이 항 제목인지 언어학 예문인지 가르는 규칙(src/structure.js recognize 끝부분)을 지어낸 줄로 확인한다.
// 진짜 항 제목은 제목(h3)으로 남고, 예문은 본문(body)으로 내려가야 한다. 학회 양식 둘(국문학 kll · 영어학 kasell)로 모두 돌린다.
import { recognize } from '../src/structure.js';
import { JOURNALS } from '../src/journals.js';

const P = (lines) => lines.map((t) => ({ text: t, runs: [], footnotes: [], size: 1000 }));
const ko = '이 연구는 학습자의 어휘 습득 과정을 분석하여 교수 방법의 개선 방안을 제시하는 데 목적이 있다. 이를 위하여 여러 자료를 검토하였다.';
const en = 'This study examines the acquisition of English articles by Korean learners and shows that definiteness plays a key role in their choices.';
const koHead = ['한국어 어휘 습득 연구', '홍길동', '1. 서론', ko];
const enHead = ['The Syntax of Korean Scrambling', 'Gildong Hong', en, 'Keywords: scrambling, syntax', '1. Introduction', en];
const longHead = '(2) 자료 수집 절차와 도구에 대한 설명 및 이에 대한 세부적인 기준 제시 방식과 그 한계점 검토 결과';

// [이름, 줄들, 기대: { '줄 앞머리': 'h3' | 'body' }]
const CASES = [
  ['제목: 긴 (2) 제목이 본문으로 잡혀도 (1)·(3)은 제목', [...koHead, '2. 연구 방법', '(1) 대상', ko, longHead, ko, '(3) 분석', ko, '3. 결과', ko], { '(1) 대상': 'h3', '(3) 분석': 'h3' }],
  ['제목: 절마다 하나씩인 (1)·(2)', [...koHead, '2. 연구 방법', '2.1 참여자', '(1) 대상', ko, '2.2 절차', '(2) 절차', ko, '3. 결과', ko], { '(1) 대상': 'h3', '(2) 절차': 'h3' }],
  ['제목: 쌍점·대괄호가 든 제목', [...koHead, '2. 이론적 배경', '(1) AI: 개념과 정의', ko, '(2) [연구 1] 설계', ko, '(3) 정리', ko, '3. 결과', ko], { '(1) AI': 'h3', '(2) [연구 1]': 'h3', '(3) 정리': 'h3' }],
  ['제목: 절마다 1부터 다시 세는 항 제목', [...koHead, '2. 연구 방법', '(1) 대상', ko, '(2) 절차', ko, '3. 결과', '(1) 양적 결과', ko, '(2) 질적 결과', ko], { '(1) 대상': 'h3', '(2) 절차': 'h3', '(1) 양적 결과': 'h3', '(2) 질적 결과': 'h3' }],
  ['제목: 영문 제목 한 줄이 마침표로 끝나도 혼자면 제목', [...koHead, '2. 작품 분석', '(1) 작가와 시대', ko, '(2) Ulysses and the U.S.A.', ko, '(3) 정리', ko], { '(1) 작가와 시대': 'h3', '(2) Ulysses': 'h3', '(3) 정리': 'h3' }],
  ['제목: 영문 논문의 [Study 1] 제목', [...enHead, '2. Method', '(1) [Study 1] Design', en, '(2) [Study 2] Design', en, '3. Results', en], { '(1) [Study 1]': 'h3', '(2) [Study 2]': 'h3' }],
  ['예문: 한 절에 몰린 영어 문장', [...enHead, '2. Data', en, '(1) John left.', en, '(2) Mary arrived early.', en, '(3) Who did John see?', en, '3. Conclusion', en], { '(1) John': 'body', '(2) Mary': 'body', '(3) Who': 'body' }],
  ['예문: 문장 예문과 같은 절에서 번호가 이어지는 구 예문', [...enHead, '2. Data', en, '(1) John left.', en, '(2) Mary arrived early.', en, '(3) the big red ball', en, '3. Conclusion', en], { '(1) John': 'body', '(2) Mary': 'body', '(3) the big': 'body' }],
  ['예문: 장을 넘어 이어지는 로마자 표기 예문', [...enHead, '(1) Chelswu-ka Yenghi-lul manna-ss-ta', en, '(2) Yenghi-lul Chelswu-ka manna-ss-ta', en, '2. Analysis', en, '(3) Chelswu-ka ku chayk-ul ilk-ess-ta', en], { '(1) Chelswu': 'body', '(2) Yenghi': 'body', '(3) Chelswu': 'body' }],
  ['예문: 하위 예문 a. b.', [...enHead, '2. Data', '(1) a. John gave Mary a book', '    b. John gave a book to Mary', en, '3. Conclusion', en], { '(1) a.': 'body' }],
  ['예문: 화자 표시(영문·국문)', [...koHead, '2. 자료', '(1) A: Where are you going', ko, '(2) B: 어디 가는 길이야?', ko, '3. 결과', ko], { '(1) A:': 'body', '(2) B:': 'body' }],
  ['예문: 문법성 표시와 괄호 구조', [...enHead, '2. Data', '(1) *John seems that is sick', en, '(2) ?the man who I saw him', en, '(3) [TP John [VP left]]', en, '3. Conclusion', en], { '(1) *John': 'body', '(2) ?the': 'body', '(3) [TP': 'body' }],
  ['예문: 구 예문이 두 절에 걸쳐 이어짐(국문 논문)', [...koHead, '2. 자료', '(1) 예쁜 꽃', ko, '(2) 새 책', ko, '3. 분석', '(3) 헌 옷', ko], { '(1) 예쁜': 'body', '(2) 새 책': 'body', '(3) 헌 옷': 'body' }],
  ['예문: 예문을 가리키는 본문 줄이 끼어도 이어지는 번호로 봄', [...koHead, '2. 자료', '(1) 예쁜 꽃', '(2) 새 책', '(2)에서 보듯이 관형어는 체언 앞에 놓여 뒤따르는 말을 꾸미며 그 자리를 바꿀 수 없다.', '3. 분석', '(3) 헌 옷', ko], { '(1) 예쁜': 'body', '(2) 새 책': 'body', '(3) 헌 옷': 'body' }],
];

let fail = 0; let n = 0;
for (const id of ['kll', 'kasell']) {
  const j = JOURNALS.find((x) => x.id === id);
  for (const [name, lines, want] of CASES) {
    const blocks = recognize(P(lines), j);
    for (const [prefix, role] of Object.entries(want)) {
      n++;
      const b = blocks.find((x) => (x.text || '').trim().startsWith(prefix));
      const got = b ? b.role : '(줄 없음)';
      if (got !== role) { fail++; console.log(`✗ [${id}] ${name} — ‘${prefix}’ 기대 ${role}, 실제 ${got}${b && b.reason ? ` (${b.reason})` : ''}`); }
    }
  }
}
console.log(fail ? `실패 ${fail}/${n}` : `예문 번호 규칙 ${n}/${n} 통과 (학회 양식 2 × 사례 ${CASES.length})`);
process.exit(fail ? 1 : 0);
