// THIRD_PARTY_NOTICES.md 생성: 내장 소프트웨어 라이선스 전문 + 학회 자료 목록 (빌드 전 실행)
import fs from 'node:fs';
import { JOURNALS } from '../src/journals.js';
import { FORMS } from '../src/forms.js';
const root = new URL('../', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), 'utf8').trim();
const exists = (p) => fs.existsSync(new URL(p, root));
const rh = read('node_modules/@rhwp/core/LICENSE');
const jz = read('node_modules/jszip/LICENSE.markdown');
const es = exists('node_modules/esbuild/LICENSE.md') ? read('node_modules/esbuild/LICENSE.md') : 'MIT License\nCopyright (c) 2020 Evan Wallace';
const fence = (s) => '```\n' + s + '\n```';
const tpl = JOURNALS.filter((j) => j.template && exists('templates/' + j.template.file + '.hwp')).map((j) => `| templates/${j.template.file}.hwp | ${j.society} | ${j.journal} | ${j.template.name || ''} |`).join('\n');
const forms = Object.entries(FORMS).flatMap(([id, list]) => { const j = JOURNALS.find((x) => x.id === id); return list.map((f) => `| forms/${f.file} | ${j ? j.society : id} | ${f.label} |`); }).join('\n');
const att = fs.readdirSync(new URL('docs/첨부/', root)).map((f) => `- docs/첨부/${f}`).join('\n');
const out = `# 제3자 고지 (THIRD-PARTY NOTICES)

투고틀의 소스 코드는 MIT 라이선스(LICENSE)입니다. 이 파일은 그 밖의 구성 요소의 권리 관계를 밝힙니다. 이 파일은 \`node tools/gen_notices.mjs\`로 생성합니다.

## 1. 배포본(release/투고틀.html)에 내장된 소프트웨어

### rhwp (@rhwp/core 0.8.7) — MIT
HWP/HWPX 읽기·쓰기·렌더링 엔진(Rust → WebAssembly). 저작자 Edward Kim. https://github.com/edwardkim/rhwp
배포본에는 rhwp_bg.wasm(약 11.8 MB)과 rhwp.js 바인딩이 base64로 들어 있습니다.

${fence(rh)}

### JSZip 3.10.1 — MIT 또는 GPL-3.0-or-later (이중 라이선스, 본 프로젝트는 MIT 조건으로 사용)
DOCX 읽기와 HWPX 패키지 조작에 사용. 저작자 Stuart Knightley 외. https://github.com/Stuk/jszip

${fence(jz)}

## 2. 빌드 도구 (배포본에 포함되지 않음)

### esbuild 0.25.0 — MIT
저작자 Evan Wallace. https://github.com/evanw/esbuild

${fence(es.split('\n').slice(0, 24).join('\n'))}

## 3. 학회 자료 (각 학회·연구소 저작)

아래 파일들은 각 학회·연구소가 투고자에게 공개 배포한 논문 양식·서식·규정입니다. 투고 편의를 위해 원본 그대로 수록했으며 저작권은 각 발행 주체에 있습니다. 해당 학회에 투고하는 용도로만 쓰십시오. 권리자가 요청하면 즉시 제거합니다(문의: jojanggun@naver.com).

### 3-1. 바탕틀(논문 양식) — templates/
| 파일 | 발행 주체 | 학술지 | 원본 이름 |
|---|---|---|---|
${tpl}

### 3-2. 투고 서식(신청서·동의서·서약서) — forms/
| 파일 | 발행 주체 | 서식 |
|---|---|---|
${forms}

### 3-3. 규정·안내 원본 — docs/첨부/
${att}

## 4. 글꼴
배포본은 글꼴을 내장하지 않습니다. 화면 글꼴은 사용자 PC의 시스템 글꼴(Pretendard·맑은 고딕 등)을 쓰고, 산출 HWP의 글꼴은 각 학회 양식에 지정된 이름을 그대로 참조합니다(글꼴 파일을 배포하지 않음).

## 5. 데이터
src/journals.js 의 학회 정보(투고 규정 요약·일정·비용·체재)는 각 학회가 공개한 규정과 모집 공고를 투고틀이 요약·정리한 것입니다. 원문은 docs/첨부/ 와 docs/학회조사_2026-10-13.md 의 출처 주소를 보십시오. 규정은 수시로 바뀌므로 투고 전에 학회 공지로 확인해야 합니다.
`;
fs.writeFileSync(new URL('THIRD_PARTY_NOTICES.md', root), out);
console.log(`THIRD_PARTY_NOTICES.md: ${out.length} chars, templates ${tpl.split('\n').length}, forms ${forms.split('\n').length}`);
