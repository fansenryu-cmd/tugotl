점수: 78/100

# 3차 감사 — A. 산출물 충실도 (opus_fid, 2026-10-13 KST, main 0278044)

## 요약

**판정: 본문·각주의 글자는 지킨다. 그러나 체재·각주 형식·표지 문구에 투고 접수에 걸릴 수 있는 결함이 남아 있다.**

- 작가 원고 5편을 학회 27곳(바탕틀 12·규정값 12·일반 3)에 변환·저장했다(135건). 산출 HWP와 HWPX를 다시 열어 정규화 없이 대조했다. 본문 글자 불일치 0, 각주 4,833개(179개 × 27곳)의 내용·위치·번호 유무 불일치 0, 원고 문단 유실 0이다. rhwp를 쓰지 않는 독립 HWP5 판독기(olefile+zlib)로도 135/135건 모두 레코드 구조 오류가 없고 본문·각주 글자가 일치했다.
- 가상 원고 11종을 같은 27곳에 넣었다(297건). 일부는 52곳 전부에 넣었다(156건). 옛한글·한자·가나·라틴 확장·수학 기호·PUA 겹낫표·보조평면 글자(𠀀 😀 𝑥)·전각 공백·NBSP·탭·줄바꿈·끝 공백·이체자 선택자·NFD 한글이 들어 있고, 2구역 HWPX/HWP도 포함했다. 이 글자들은 TXT·MD·DOCX·HWPX·HWP 다섯 경로 모두에서 보존됐다. 보조평면 글자 뒤의 강조 범위·각주 위치(코드포인트→UTF-16 변환)도 정확했다.
- PDF 파싱본 40건 × 6곳(240건): 변환 실패 0, 엄격 대조 불일치 0.
- 다만 아래 결함들은 원고 내용이나 학회 형식을 바꾼다. 몇 가지는 실제 원고에서도 재현된다.
  - **대용량 원고에서 보조평면 글자(겹낫표 PUA 포함)가 U+FFFD로 깨진다.**
  - **주제어 머리말에 바탕틀의 안내 글자(‘：5’, ‘ .’, ‘(’)가 섞인다.** 실제 원고 4/5편에서 재현된다.
  - **체재에 목차가 없는 학회에서는 목차가 논문 맨 끝으로 간다.** 자동 생성된 목차는 6곳, 원고에 있던 목차는 19곳에서 그렇다.
  - **각주 번호가 원본보다 하나씩 밀린다.** paper2, 그리고 DOCX 사사 각주에서 재현된다.
  - **각주 안 줄바꿈이 각주 문단 나눔으로 바뀐다.** paper4·5, 31곳에서 재현된다.
  - **DOCX 미주는 경고 없이 사라진다.**
  - **각주 안 강조는 전부 사라진다.**

### 95점에 이르기 위해 고쳐야 할 것 (우선순위)

| 순위 | 할 일 | 위치 | 크기 |
|---|---|---|---|
| 1 | HWPX 항목을 문자열 대신 UTF-8 바이트로 넣기(JSZip 16K 청크가 서로게이트 쌍을 가름) | `src/engine.js:269, 402-403` | 3줄 (수정안 검증함) |
| 2 | 주제어 머리말을 바탕틀에서 읽을 때 숫자·마침표·여는 괄호를 받지 않기. 주제어 문단의 각주 위치·강조를 표지 치환 뒤 좌표로 옮기기 | `src/engine.js:189-194, 374` | 15줄 |
| 3 | 학회 체재(`structure`)에 목차가 없으면 목차를 만들지 않기. 체재에 없는 묶음은 끝이 아니라 원래 앞서던 묶음 뒤에 두기 | `src/structure.js:293, 164-166` | 10줄 |
| 4 | 한글 ‘새 번호 지정(각주)’ 보존, DOCX `customMarkFollows` 각주 처리 | `src/parse.js:63-87, 205-217`, `src/engine.js:342-348` | 30줄 |
| 5 | 각주를 문단 배열로 들고 다니기(문단 나눔과 줄바꿈 구분) | `src/parse.js:80-84, 162`, `src/engine.js:345` | 20줄 |
| 6 | DOCX 미주(`endnotes.xml`)·`w:sym`·`w:noBreakHyphen`·`w:cr` 처리, 못 옮기면 경고 | `src/parse.js:159-217` | 25줄 |
| 7 | 각주 안 강조(DOCX 런, HWP는 HWPX 내보내기의 각주 런) 옮기기 | `src/parse.js`, `src/engine.js:342-348` | 40줄 |
| 8 | 바탕틀 예시 글자의 위첨자를 본문 런에 물려주지 않기(litheory 저자 전체가 위첨자) | `src/engine.js:317-332` | 3줄 |
| 9 | 영문 논문·기호 붙은 참고문헌 제목 인식(References, ■ 참고문헌 등) | `src/structure.js:11, 24, 107-122` | 10줄 |
| 10 | 인용문 사이 빈 줄(시의 연 구분 등)은 기본 설정에서도 남기기 | `src/structure.js:177` | 5줄 |
| 11 | 검증 도구의 사각지대 보강(위첨자·기울임, 표지 문구 내용, 각주 문단/줄바꿈, 목차 위치) | `tools/verify_matrix.mjs`, `tools/convert.mjs` | — |

1~6을 고치면 본문·각주·체재의 실질 결함이 정리되어 90점대 초반으로 본다. 7~10까지 고쳐야 95점에 이른다.

---

## 중요도순 발견

### F-1 (높음·내용 훼손) 대용량 원고에서 보조평면 글자가 U+FFFD 두 개로 깨진다
- **위치**: `src/engine.js:402-403` `zip.file('Contents/section0.xml', sec)`, `zip.file('Contents/header.xml', header)`. `src/engine.js:269` `patchText`도 같다.
- **원인**: JSZip 3.10.1은 문자열 항목을 16,384글자 청크로 나눠 UTF-8로 바꾼다. 청크 경계가 서로게이트 쌍(보조평면 글자) 가운데에 걸리면 두 반쪽이 따로 인코딩되어 U+FFFD 두 개가 된다. 한글 원고의 겹낫표 󰡔󰡕(U+F0854/F0855)는 보조평면 PUA라서 대상이 된다. 확장 한자(𠀀)와 이모지도 마찬가지다. 읽기 경로(`async('string')`)는 안전하다(경계 10곳 시험, 0건).
- **재현**:
  - `node tests/audit_opus_fid/jszip_sp.mjs`: 앞에 a를 1자 두면 U+FFFD 4개, 16,385자 두면 4개.
  - `node tests/audit_opus_fid/r3/bigfix.mjs 1000`: 가상 원고(문단마다 󰡔가상 문집󰡕·𠀀𪚥·😀, 각주 1,000개).
  - `node tests/audit_opus_fid/t8b.mjs`: 3,000문단. ricc에서 본문 2문단, gubo에서 본문 2문단과 각주 1개가 ‘󰡔책󰡕’ → ‘��책󰡕’로 깨진다.
- **기대/실제**: 원고의 󰡔가 그대로 나와야 한다. 실제로는 koli 1,000·1,700·3,000문단에서 각주 1개(U+FFFD 2자)가 깨졌다. 엄격 대조로만 보이고 경고는 없다.
- **실원고**: 작가 원고 5편에는 보조평면 글자가 0개라서(아래 표) 135건 모두 무사했다. 겹낫표를 PUA로 쓰는 한글 원고는 흔하다. 원고가 길수록 청크 경계 수가 늘어 걸릴 확률이 커진다.
- **수정안**(검증함: `tests/audit_opus_fid/r3/engine_fix.mjs`로 세 크기 모두 U+FFFD 2→0):
```js
const enc = new TextEncoder();   // JSZip 문자열 항목은 16K 청크로 UTF-8 변환되며 서로게이트 쌍을 가른다 — 바이트로 넣는다
const patchText = async (name, fn) => { const f = zip.file(name); if (!f) return; const x = await f.async('string'); const y = fn(x); if (y !== x) zip.file(name, enc.encode(y)); };
…
zip.file('Contents/section0.xml', enc.encode(sec));
zip.file('Contents/header.xml', enc.encode(header));
```
회귀 시험으로는 1,000문단 이상, 문단마다 겹낫표 PUA가 든 TXT를 엄격 대조에 넣기를 권한다.

### F-2 (높음·표지 문구 오염) 주제어 머리말에 바탕틀의 안내 글자가 섞인다(실원고 4/5편)
- **위치**: `src/engine.js:189` `KW_LABEL`의 꼬리 `[^가-힣A-Za-z]{0,3}`, `src/engine.js:194`.
- **원인**: 바탕틀 예시 문단의 앞부분을 머리말로 떼어 쓴다. 이때 머리말 뒤 ‘한글·영문이 아닌 글자 3자’까지 함께 가져온다. 그래서 예시 문단의 안내 문구 첫 글자(숫자, 마침표, 여는 괄호)가 머리말에 붙는다.

| 학회 | 바탕틀 예시(가림) | 뽑힌 머리말 | 산출 주제어 줄 |
|---|---|---|---|
| kopoetics | `• 주제어：5개 이상` | `• 주제어：5` | `• 주제어：5 가상, 보존, …` (영문도 `• Key words：5 imaginary…`) |
| dongak | `국문주제어: ......` | `국문주제어: .` | `국문주제어: . 가상, …` |
| interlali | `Keywords: (키워드 5개…` | `Keywords: (` | `Keywords: ( imaginary, …` |
| daejung | `(주제어:      )(돋움…` | `(주제어:  ` | `(주제어:  가상, …` (닫는 괄호 없음) |
| anim | `주제어〻￨〻애니메이션…` | `주제어〻￨〻` | 국문만 바뀌고 영문 `Key〻words〻￨〻`는 매치되지 않아 원고대로 |

- **재현**: `node tests/audit_opus_fid/r3/kwsample.mjs kopoetics dongak daejung interlali anim`, `node tests/audit_opus_fid/r3/kwpapers.mjs`.
- **실원고**: paper1·2·3·5에서 kopoetics 주제어 줄 2개(국문·영문), dongak 1개, daejung 2개(닫는 괄호 없음 2개), interlali 1개가 오염됐다. paper4에는 주제어가 없다. 엄격 대조는 표지 역할을 ‘표지 변경’으로 따로 세므로 불일치로 잡히지 않는다. `verify_matrix`도 통과로 본다.
- **같은 자리의 부수 결함**: `src/engine.js:374`는 표지 치환 뒤 `runs: []`로 강조를 버린다. 각주 위치도 `Math.min(offset, 새 길이)`로만 자른다. 그래서 주제어 끝 각주가 머리말 길이 차이만큼 앞으로 간다. 가상 원고 k_kitchen의 ‘…, 각주[각주]’가 koli에서는 3자 앞(‘…on,’ 뒤), dongak에서는 4자 앞에 놓였다. 주제어 안 기울임(Fiktion, 7자)은 표지가 바뀐 학회 52곳 중 11곳에서 사라졌다(`labels.mjs`). 실원고의 표지 문단에는 각주·강조가 없어 영향이 없었다.
- **수정안**:
```js
// 머리말 꼬리는 공백·쌍점·닫는 괄호류만. 여는 괄호만 있고 닫는 괄호가 없으면 쓰지 않는다
const KW_LABEL = /^([^가-힣A-Za-z0-9]{0,3}(?:주제어|핵심어|키워드|국문\s*주제어|국문\s*핵심어|영문\s*주제어|key\s*words?|keywords?)[\s:：\]】〕❙」』)）]{0,4})/i;
const balanced = (s) => (s.match(/[(（\[【〔「『<＜]/g) || []).length === (s.match(/[)）\]】〕」』>＞]/g) || []).length;
… if (m && m[1].length <= 16 && balanced(m[1])) labels[role] = m[1];
// 374행: 바뀐 것은 앞머리뿐이므로 공통 꼬리 기준으로 런·각주를 옮긴다
blocks = blocks.map((b) => { const t = relabel(b); if (t === null) return b;
  let k = 0; while (k < t.length && k < b.text.length && t[t.length - 1 - k] === b.text[b.text.length - 1 - k]) k++;
  const cutOld = b.text.length - k, cutNew = t.length - k;
  const runs = []; let off = 0; for (const r of b.runs || []) { const s = Math.max(off, cutOld), e = off + r.text.length; if (e > s) runs.push({ ...r, text: b.text.slice(s, e) }); off = e; }
  if (cutNew) runs.unshift({ text: t.slice(0, cutNew) });
  return { ...b, text: t, runs: b.runs?.length ? runs : [], footnotes: (b.footnotes || []).map((f) => { const o = f.offset ?? b.text.length; return { ...f, offset: o >= cutOld ? o - cutOld + cutNew : Math.min(o, cutNew) }; }) }; });
```

### F-3 (높음·체재) 학회 체재에 목차가 없으면 목차가 논문 맨 끝(참고문헌·영문초록 뒤)으로 간다
- **위치**: `src/structure.js:293`(`buildToc`의 `wants`가 바탕틀 역할에 `toc`만 있어도 참이다), `src/structure.js:166`(`reorderSections`가 체재 밖 묶음을 끝에 붙인다).
- **두 경우**:
  1. **자동 생성 목차**: 바탕틀에 `toc` 역할이 있지만 `structure`에는 `toc`가 없는 6곳(fcs, anim, korlanlit, korliter, iall, dongak)이다. 원고에 목차가 없으면 목차를 만든 뒤 끝으로 보낸다. 실원고 5편 × anim·dongak·iall 15건 모두에서 생성 목차가 맨 끝에 놓였다(`papers.log`의 ‘목차 Y!’, 체재 `…>references>toc`).
  2. **원고에 있던 목차**: `structure`에 `toc`가 없는 학회 19곳(fcs, anim, korlanlit, korliter, postcriticism, klc, aagcc, iall, korlit, kcomplit, litheory, eomun, hanguksoseol, ricc, ktla, koreacontents, dongak, kles, iacks)에서 원고의 목차가 끝으로 간다. 가상 원고 s_toc.txt로 52곳 중 19곳에서 재현했다. PDF 파싱본 40건 중 dongak 34건, ricc 23건에서 목차가 참고문헌·영문초록 뒤로 갔다.
- **재현**: `node tests/audit_opus_fid/r3/fixtures_run.mjs s_toc.txt,s_notoc.txt all`(‘(목차가 끝!)’ 표시), `node tests/audit_opus_fid/r3/pdforder.mjs`.
- **기대**: 체재에 목차가 없으면 만들지 않는다. 원고에 있던 목차는 원래 자리(앞부분 뒤)에 두고, 빼도 된다고 안내한다.
- **수정안**:
```js
// structure.js:293
const wants = (journal.structure || []).includes('toc');
// structure.js:164-166 — 체재 밖 묶음은 원고에서 바로 앞에 있던 체재 묶음 뒤에 둔다
const inOrder = order.filter((g) => groups[g]); const after = {};
for (const g of seq) if (!order.includes(g)) { const prev = seq.slice(0, seq.indexOf(g)).reverse().find((x) => order.includes(x)); (after[prev ?? '^'] ||= []).push(g); }
const out = []; for (const g of after['^'] || []) out.push(...groups[g]);
for (const g of inOrder) { for (const b of groups[g]) out.push(b); for (const x of after[g] || []) for (const b of groups[x]) out.push(b); }
```
같은 규칙으로 litheory(체재에 abstractKo 없음)의 국문초록도 영문초록 뒤 끝이 아니라 원래 자리 근처에 남는다. 학회 규정 확인은 필요하다.

### F-4 (높음·각주 형식) 각주 번호가 원본보다 하나씩 밀린다
- **(a) 한글 원고의 ‘새 번호 지정(각주)’**: paper2에는 사사 각주(번호 없음) 뒤에 `<hp:newNum num="1" numType="FOOTNOTE">`가 있다. 그래서 원본 번호는 `1*,1,2,3…`이다. 파서는 `nwno` 컨트롤을 버리고(`src/parse.js:63-87`), 엔진은 각주마다 번호를 1씩 올린다(`src/engine.js:343`). 산출 번호는 `1*,2,3,…`가 되어, **번호 있는 각주 38개가 모두 원본보다 1 큰 번호**로 나온다. 엔진 공통 로직이라 학회와 무관하다(koli에서 확인). paper1에도 같은 컨트롤이 있지만 첫 각주 앞이라 영향이 없었다. paper3·4·5의 번호는 원본과 같다.
  - 재현: `node tests/audit_opus_fid/r3/fnnum.mjs tests/원고/paper2.hwp tests/원고/paper3.hwp`, `node tests/audit_opus_fid/r3/fnstruct.mjs tests/원고/paper2.hwp 0`(컨트롤만 출력한다).
- **(b) DOCX 사용자 지정 표시 각주(`w:customMarkFollows="1"` + `<w:t>*</w:t>`)**: Word는 본문에 ‘*’만 보이고 이 각주를 번호 세기에서 뺀다. 파서는 이 각주를 번호 각주로 받고 ‘*’를 본문 글자로 붙인다. 산출에는 가상 원고 기준 ‘…보존’ + 각주 번호 + ‘*’가 나오고, 뒤 각주가 모두 +1 밀린다(번호 `1,2,…,11`, Word에서는 사사 표시 뒤 `1…10`).
  - 재현: `node tests/audit_opus_fid/r3/parsecheck.mjs`(k_kitchen.docx p0: 본문 끝에 ‘*’ 추가, 번호 유무 불일치), `node tests/audit_opus_fid/r3/fnnum2.mjs tests/audit_opus_fid/fixtures/k_kitchen.docx`.
- **수정안 개요**(rhwp가 `newNum` 컨트롤을 받아들이는지는 확인 못 함 — 시험 필요):
```js
// parse.js(parseHwp를 async로): getControls()의 nwno에는 종류·번호가 없으므로 HWPX로 한 번 내보내 문서 순서대로 읽는다
const restarts = []; if (controls.some((c) => c.ctrlId === 'nwno')) { let k = 0; for (const m of (await sectionsXml(d)).matchAll(/<hp:footNote\b|<hp:newNum num="(\d+)" numType="FOOTNOTE"/g)) { if (m[1] === undefined) k++; else restarts[k] = +m[1]; } }
// 각주를 넣을 때: if (restarts[fnTotal] !== undefined) footnote.restart = restarts[fnTotal];
// engine.js makeFootnote 앞: if (f.restart) { fnCount = f.restart - 1; prefix = `<hp:ctrl><hp:newNum num="${f.restart}" numType="FOOTNOTE"/></hp:ctrl>`; }
// parse.js runTokens: customMarkFollows="1"이면 { fn: id, customMark: true } — 뒤따르는 <w:t>(표시 글자)는 본문에서 빼고 각주 앞에 둔 뒤 noNumber + 다음 각주에서 restart
```

### F-5 (중간~높음·각주 형식) 각주 안 줄바꿈(Shift+Enter, `<w:br/>`)이 각주 문단 나눔으로 바뀐다(실원고 2/5편)
- **위치**: `src/parse.js:80-84`는 각주 문단을 `\n`으로 잇는데, 문단 안 줄바꿈도 `\n`이다. `src/parse.js:162`(DOCX 각주도 같다). `src/engine.js:345`는 `\n`마다 각주 문단을 하나씩 만든다.
- **실원고**: paper4 원본은 각주 문단 17개에 각주 안 줄바꿈 12개다. 산출은 각주 문단 29개(여러 문단 각주 4개), 줄바꿈 0개다. paper5는 각주 문단 27개·줄바꿈 19개가 각주 문단 46개·줄바꿈 0개로 바뀐다. koli에서 확인했고, 엔진 공통 로직이라 학회와 무관하다. 글자는 같아서 엄격 대조로는 보이지 않는다. 각주 문단마다 내어쓰기·문단 간격이 다시 적용되어 쪽 배치가 달라진다.
- **재현**: `node tests/audit_opus_fid/r3/fnbr3.mjs`, `node tests/audit_opus_fid/r3/fnbr2.mjs`(가상 HWPX), `node tests/audit_opus_fid/r3/fnbr.mjs`(가상 DOCX D15).
- **수정안**: 각주를 `{ paras: [문단 텍스트…], text: paras.join('\n') }`로 들고 다닌다. 엔진은 `const lines = f.paras ?? sanitizeFootnote(f.text).split('\n')`로 문단을 만들고, 문단 안의 `\n`은 이미 있는 `tx()`로 `<hp:lineBreak/>`가 된다. 문단 안 줄바꿈은 `paras` 원소 안에 `\n`으로 남긴다. HWP는 `fi.texts`가 이미 문단 배열이다. DOCX는 `elements(fn.body,'w:p')`의 배열을 그대로 쓴다. `applySubstitutions`는 문단마다 적용한다.

### F-6 (높음·내용 유실, DOCX) 미주가 경고 없이 사라진다. 기호·하이픈·CR도 사라진다
- **위치**: `src/parse.js:159-217`. `word/endnotes.xml`을 읽지 않고 `runTokens`가 `w:endnoteReference`, `w:sym`, `w:noBreakHyphen`, `w:cr`을 모른다.
- **재현**: `node tests/audit_opus_fid/r3/dumpparse.mjs tests/audit_opus_fid/fixtures/d_special.docx`

| 가상 문단 | 원고 | 파싱 결과 |
|---|---|---|
| D7 | `미주 시험 문장이다.` + 미주(‘미주 내용은 사라지면 안 된다.’) | 본문만 남고 미주 내용 0자. 경고 없음(counts.footnotes 3) |
| D3 | `기호 ` + `<w:sym w:font="Symbol" w:char="F061"/>`(α) | `기호  끝` — 기호 유실 |
| D6 | `금지` + `<w:noBreakHyphen/>` + `하이픈` | `금지하이픈` — 하이픈 유실 |
| D2 | `줄바꿈` + `<w:cr/>` + `CR` | `줄바꿈CR` — 줄바꿈 유실 |
| D9 | 윗주 `漢`(かん) | `かん漢` — 윗주가 본문에 섞임 |
| D8 | 텍스트 상자 | 상자 안 글이 본문 문단에 섞임(그림 1개 경고는 나옴) |
| D11 | `<w:br w:type="page"/>` | 줄바꿈 `\n`으로 바뀜 |

  D1(한 런 안 글자+각주 참조+글자), D2의 탭·줄바꿈, D4 하이퍼링크, D5 필드 결과, D10 변경 추적(삽입 유지·삭제 제외), D12 공백, D13 문자 참조(`&#x1D465;`, 서로게이트 참조, `&amp;lt;`), D14(기울임 런 안 각주)는 모두 정확했다.
- **수정안**:
```js
const enXml = await part('word/endnotes.xml', false); const endnoteText = {}; /* footnoteText와 같은 방식 */
// runTokens:
if (r.startsWith('<w:endnoteReference', a) && ws(r[a + 19])) { … out.push({ en: id }); … }   // 각주로 옮기고 ‘미주 n개를 각주로 옮겼습니다’ 경고
if (r.startsWith('<w:sym', a) && ws(r[a + 6])) { const ch = attr(r.slice(a, r.indexOf('>', a)), 'w:char'); out.push({ t: symToUnicode(attr(…,'w:font'), ch) }); … }   // 못 바꾸면 원 코드 글자 + 경고
if (r.startsWith('<w:noBreakHyphen', a)) { out.push({ t: '‑' }); … }
if (r.startsWith('<w:cr', a) && ws(r[a + 5])) { out.push({ t: '\n' }); … }
```

### F-7 (중간·강조) 각주 안의 강조가 모든 입력 형식에서 사라진다
- **위치**: 파서가 각주를 글자만 담는다(`src/parse.js:80-84`, `162`). 엔진은 각주 런을 하나(`fnShape.cs`)로 쓴다(`src/engine.js:346`).
- **재현**: `node tests/audit_opus_fid/r3/fixtures_run.mjs k_kitchen.hwp,k_kitchen.hwpx all`. 원고 각주 강조 20자(기울임 ‘Œuvres imaginaires’, 굵게 ‘굵은 글’)가 52곳 모두에서 0자가 된다. DOCX D14 각주의 기울임 ‘Titulus’도 사라진다. 작가 원고 5편의 각주에는 강조가 0자라서 실원고 영향은 없었다(`fnemph.mjs`). 외국 서명을 기울여 쓰는 각주는 흔하다.
- **수정안**: DOCX는 각주 문단도 본문과 같은 런 루프로 읽는다(`runs`). HWP/HWPX는 `exportHwpx()`의 `<hp:footNote>` 안 `<hp:run charPrIDRef>`를 header의 bold·italic·underline·supscript로 해석해 각주 순서대로 붙인다. 엔진은 `makeFootnote`에서 문단마다 `runs`를 `variantCs(fnShape.cs, {...})`로 쓴다(본문 `runsXml`과 같은 방식).

### F-8 (중간·서식) litheory: 저자 이름 전체가 위첨자, 국문초록 제목이 기울임
- **위치**: `src/journals.js:1195` litheory `author: { para: 8 }`. 바탕틀 문단 8은 위첨자 ‘*’ 한 글자다(`tplpara.mjs litheory 8` → `cs26S`). `src/engine.js:317-332` `variantCs`는 바탕 모양에 속성을 더하기만 하고 빼지 않는다.
- **실제**: 5편 모두 저자 줄이 위첨자로 나온다(paper1 7자, paper2 4자, paper3 15자, paper4 9자). abstractHead는 `like: 'abstractEnHead'`(문단 45, 기울임 ‘Abstract’)라서 ‘국문초록’이 기울임으로 나온다(paper1·2·3·5).
- **재현**: `node tests/audit_opus_fid/r3/dbg_emph.mjs paper4 litheory`, 바탕틀 전수 `node tests/audit_opus_fid/r3/tplscan.mjs`(위첨자인 예시는 litheory author 하나뿐이다).
- **수정안**:
```js
// variantCs: 원고 런이 위·아래첨자가 아니면 바탕 모양의 위·아래첨자를 지운다(바탕틀 예시가 ‘*’ 표시 글자인 경우)
const supBase = /<hh:supscript\/>|<hh:subscript\/>/.test(charPrById(base) || '');
if (supBase && !v.superscript) { /* key에 'n' 추가 */ x = x.replace(/<hh:supscript\/>|<hh:subscript\/>/g, ''); }
```
데이터 쪽은 litheory `author`를 이름 자리 문단이나 `format`으로 바꾸고, abstractHead 기울임은 학회 규정을 확인하기를 권한다. `verify_matrix`는 위첨자·기울임을 비교하지 않아 이 학회를 ✓로 낸다.

### F-9 (중간·역할 배정) 영문 논문은 본문 전체가 ‘영문초록’이 된다. 기호 붙은·영문 참고문헌 제목도 인식되지 않는다
- **위치**: `src/structure.js:11` `refHead`는 한글 ‘참고문헌’만 받는다. `src/structure.js:107-122`의 영문초록 상태는 한글이 없으면 빠져나오지 않는다. `src/structure.js:24` `authorEn`은 영문 제목에도 맞는다.
- **재현**: `node tests/audit_opus_fid/r3/roles.mjs tests/audit_opus_fid/fixtures/s_english.txt`
  - `1. Introduction`은 titleEn2가 된다. 이후 본문·`2. Method`·`References`는 모두 abstractEn이 되고, 참고문헌 항목 `Doe, Jane. …`은 authorEn이 된다. 산출 체재는 `front>abstractKo>abstractEn`이다(본문·참고문헌 묶음 없음, 목차 생성 0).
  - 가상 k_kitchen의 영문 제목 `Imaginary Rivers and the Preservation of Letters`도 authorEn으로 잡힌다(대문자로 시작하는 단어 나열이 이름 정규식에 맞는다).
- **PDF 파싱본**: 40건 중 20건에서 참고문헌 제목이 없다. 그중 14건은 추출문에 제목이 없고, 5건은 제목 꼴(‘■ ’ 붙음 2건, ‘❍’ 1건, 영문 10자 1건, ‘1. ’ 번호 1건)을 인식하지 못했다(`pdfref.mjs`). 그 밖에 pdf-10·11은 본문 634문단 전체가 국문초록이 됐다(장 제목·주제어를 찾지 못해 초록 상태가 끝나지 않음).
- **수정안**:
```js
refHead: /^[<＜〔\[❙▌「■□●◆◇▣❍•\-]?\s*(참\s*고\s*문\s*헌|참\s*고\s*자\s*료|references|bibliography|works\s+cited)\s*[>＞〕\]❙」]?(\s*\(.*\))?$/i,
// abstractEn 상태: Keywords 뒤에 라틴 장 번호 제목(/^(\d{1,2}|[IVX]{1,4})\.\s+[A-Z]/)이 나오면 본문으로
// authorEn: 낱말 4개 이하이거나 쉼표·머리글자(‘Kim, G.’)가 있을 때만
```

### F-10 (중간·빈 줄) 인용문 사이 빈 줄(시의 연 구분, 이어진 두 인용)이 기본 설정에서 사라진다(실원고 3/5편)
- **위치**: `src/structure.js:177`(원고 빈 줄을 모두 버림), `src/structure.js:183-190`(같은 역할 사이에는 빈 줄을 넣지 않음).
- **재현**: `node tests/audit_opus_fid/r3/stanza.mjs tests/audit_opus_fid/fixtures/q_stanza.txt tests/원고/paper1.hwp …`. 가상 원고의 두 연 사이 빈 줄 1개가 0개가 된다. 실원고의 ‘인용–빈 줄–인용’은 paper1 1곳, paper2 1곳, paper5 3곳이다. koli·ricc·mkliterature 모두 0곳으로 붙는다(‘원고 빈 줄 유지’를 켜면 남는다).
- **수정안**:
```js
const isQ = (b) => b && /^(quote|source)$/.test(b.role);
const body = keepSourceBlanks ? blocks : blocks.filter((b, i) => b.role !== 'blank' || (isQ(prevNonBlank(blocks, i)) && isQ(nextNonBlank(blocks, i)) && blocks[i - 1]?.role !== 'blank'));
```

### F-11 (낮음~중간) 그 밖의 충실도 결함
1. **강조점·취소선·아래첨자·겹밑줄을 옮기지 않는다.** 가상 HWPX x_marks에서 취소선 3자·강조점 3자·아래첨자 1자가 0자가 되고, 겹밑줄은 홑밑줄이 된다. 재현: `node tests/audit_opus_fid/fixtures/make_marks.mjs && node tests/audit_opus_fid/r3/srcemph.mjs …`. rhwp `getCharPropertiesAt`은 `strikethrough`·`subscript`·`emphasisDot`·`underlineShape`를 준다. 파서 런과 `variantCs`에 더하거나, 최소한 개수를 경고로 알리면 된다. 실원고 5편에는 해당 강조가 0자다(위첨자 2자는 보존).
2. **번호 없는 각주의 판정을 앞 공백으로만 한다**(`src/parse.js:82`). `<hp:t> * 사사…`처럼 공백으로 시작하는 번호 없는 각주는 번호 각주로 오인된다. 앞 공백이 지워지고 산출에 번호(autoNum)가 붙는다. 재현: `node tests/audit_opus_fid/r3/nonum_space.mjs`. 수정: HWPX 내보내기에서 `<hp:autoNum>`이 있는지로 판정한다(F-4의 XML 읽기와 같이).
3. **두 줄 제목의 둘째 줄이 저자가 된다**(`src/structure.js:80` ‘앞부분 짧은 줄’). s_toc.txt에서 ‘문자의 보존’이 author가 됐다. 익명화는 막아 두었지만 산출 서식은 저자 모양이다. 다음 줄이 이름 꼴이면 현재 줄은 제목 이어짐(title)으로 보기를 권한다.
4. **한글 미주가 경고 없이 각주가 된다**(`src/parse.js:69`). 글자는 보존된다. ‘미주 n개를 각주로 옮김’ 안내를 권한다.
5. **표지 문구 충돌**: koreanst는 `tocLabel: '차례'`인데 바탕틀 예시(‘목차’)가 덮어써 ‘목차’로 나온다. 데이터와 바탕틀 중 하나로 맞춰야 한다.
6. **HWPX로 저장하면 비문자 U+FFFE·U+FFFF가 빠진다**(HWP에는 남는다). XML 규칙상 불가피하다. 실해는 거의 없다.
7. TXT·MD는 형식상 여러 문단 각주와 번호 없는 각주를 쓸 수 없다(첫 문단만, 번호가 붙음). 도움말에 적어 두기를 권한다.

### F-12 (검증 도구) 팀 도구의 사각지대
- `tools/verify_matrix.mjs`는 위첨자·기울임과 표지 문구의 내용을 보지 않는다. 각주 번호, 각주 문단/줄바꿈, 목차 위치도 보지 않는다. 그래서 F-2·F-3·F-4·F-5·F-8이 있는 litheory·dongak·kopoetics·anim을 ‘4/4 학회 통과’로 낸다(`node tools/verify_matrix.mjs --papers tests/원고/paper1.hwp,tests/원고/paper4.hwp --journals litheory,dongak,kopoetics,anim`).
- `tools/convert.mjs`의 대조는 공백을 지우고(`norm`) 각주 위치를 앞 12자로만 본다. 공백·줄바꿈 훼손은 잡지 못한다. 반대로 paper5의 영문 주제어 머리말이 대소문자 차이로 표지 판정(`isLabelLine`)에서 빠져 ‘누락 문단 1’을 잘못 낸다(koli·dongak·litheory·kopoetics·femcrit, 실제 유실 0). ‘강조 유실’은 대부분 제목류 굵기 정책과 런 병합 때문이다. 엄격 대조에서는 litheory 외 0이다.
- 권장: 이 감사의 `tests/audit_opus_fid/r3/lib.mjs`(`strictCompare`: 정규화 없음, 글자별 강조 벡터, 표지 문단의 각주 끝 위치·강조)를 회귀 도구로 옮긴다. 각주 번호 대조(`fnnum.mjs`)와 각주 문단/줄바꿈 대조(`fnbr3.mjs`)도 함께 둔다.

---

## 확인된 것(정상 동작)
- **코드포인트→UTF-16**: 가상 HWP/HWPX의 보조평면 글자(𠀀𠀁 𪚥 😀 𝑥 𝒜)가 굵게·밑줄 범위 앞·안에 있고, 각주가 𠀀 바로 뒤에 있다. 2구역 둘째 구역에도 각주가 있다. 파서·산출 모두 범위와 위치가 정확했다. 같은 학회로 3회 재변환해도 koli·ricc·mkliterature에서 본문·각주·강조가 고정됐다(`roundtrip.mjs`).
- **런 토큰 순서**: DOCX 한 런 안 ‘글자+각주 참조+글자’, ‘글자+탭+줄바꿈’, 기울임 런 안 각주, HWPX `<hp:t>` 안 `<hp:tab/>`·`<hp:lineBreak/>`가 모두 정확했다.
- **공백**: 탭·NBSP·전각 공백·두 칸·끝 공백·본문 줄바꿈(`<hp:lineBreak/>`)이 다섯 형식 모두에서 보존됐다. 독립 HWP5 판독으로 확인하면 탭은 8 WCHAR 인라인 컨트롤로, 줄바꿈은 문자 10으로, NBSP는 글자로 기록된다.
- **경계 문자**(e_edge.txt, UTF-16LE): 이체자 선택자(葛+U+E0100), NFD 한글, 결합 악센트, ZWJ·ZWSP·BOM·소프트 하이픈, U+2028/2029, C1 제어(U+0085), U+007F가 HWP에서 모두 같았다. 짝 없는 서로게이트는 디코더가 U+FFFD로 바꾼다(입력 단계라 정상).
- **번호 없는 사사 각주(HWP/HWPX)·여러 문단 각주·문단 맨 앞 각주·붙은 두 각주**: 모두 정확했다(DOCX 사용자 지정 표시는 F-4b).
- **초록이 뒤에 오는 원고**(s_abstract_last), **영문초록이 앞에 오는 원고**(s_abstract_en_first): 27곳에서 학회 체재대로 옮겨졌다. 실패는 F-3의 목차 위치와 F-8 litheory뿐이다.
- **바탕틀 경로와 규정값·일반 경로**: 첫 문단에는 구역·단 정의와 원고 첫 문단만 남는다(바탕틀 19곳 전수, 머리말·표 잔여 없음). 바탕틀 예시의 안내 색(파랑·빨강·회색)은 검정으로 바뀐다. 엄격 대조 결과는 세 경로 사이에 차이가 없다(실원고 135건: 바탕틀 60건 중 실패 5건 litheory, 규정값 60건·일반 15건 실패 0).

---

## 실행한 명령과 수치

모든 임시 파일은 `tests/audit_opus_fid/`(스크립트 `r3/`, 가상 원고 `fixtures/`, 산출 `r3/out/`) 아래에 있다. 예외 하나: `tools/verify_matrix.mjs`는 고정 경로 `tests/out/verify_matrix.json`(git 무시 대상 생성물)을 다시 썼다. 전수 재실행(`node tools/verify_matrix.mjs`)으로 복원된다. `tools/convert.mjs`는 출력 경로만 바꾼 사본 `r3/convert_copy.mjs`로 돌렸다.

| 명령 | 건수 | 결과 |
|---|---|---|
| `node tests/audit_opus_fid/r3/papers.mjs` | 원고 5 × 27곳 = 135 | 엄격 대조 통과 130, 실패 5(전부 litheory 강조, F-8). 본문 불일치 0, 각주 4,833/4,833 내용·위치·번호 유무 일치, HWPX 재파싱도 같음, 원고 문단 유실 0 |
| `node tests/audit_opus_fid/r3/indep.mjs` | 135 | 독립 HWP5 판독: 레코드 오류 0, 본문·각주 글자 불일치 0 |
| `node tests/audit_opus_fid/r3/convert_copy.mjs tests/원고/paperN.hwp koli,dongak,litheory,kopoetics,ricc,femcrit,mkliterature,novel --quiet` | 40 | 각주 40/40 일치. ‘누락 문단 1’ 5건은 도구 오탐(F-12) |
| `node tests/audit_opus_fid/r3/parsecheck.mjs` | 가상 6형식 | MD·TXT·HWPX·HWP 파서 문제 0. DOCX 2(사용자 지정 표시 각주, F-4b) |
| `node tests/audit_opus_fid/r3/fixtures_run.mjs` | 가상 11종 × 27곳 = 297 | 통과 187 / 실패 110(원인 중복 있음): 각주 강조 유실 54(F-7), 주제어 표지 치환 뒤 각주 위치·강조 52(F-2), 목차가 끝 32(F-3), litheory 위첨자·기울임 11(F-8), litheory 국문초록 끝 10 |
| `node tests/audit_opus_fid/r3/fixtures_run.mjs k_kitchen.hwp,k_kitchen.docx,s_toc.txt all` | 3 × 52 = 156 | 통과 68 / 실패 88(같은 원인. 목차가 끝 30건, 그중 s_toc는 52곳 중 19곳) |
| `node tests/audit_opus_fid/r3/pdfrun.mjs` | PDF 40 × 6곳 = 240 | 변환 실패 0, 엄격 대조 불일치 0, 머리말 제외(의도) 90문단·4,350자(학회당 15문단), 목차가 맨 끝인 산출 39건(dongak 24·ricc 15. 목차 뒤에 투고일(tail)만 오는 경우 dongak 10·ricc 8은 따로) |
| `node tests/audit_opus_fid/r3/pdforder.mjs` | 240 | 체재 밖 묶음: dongak toc 34/40, ricc toc 23/40, tail(투고일)만 끝: 각 학회 10건(의도로 봄) |
| `node tests/audit_opus_fid/r3/bigfix.mjs 1000·1700·3000`, `node tests/audit_opus_fid/t8b.mjs` | — | 원 엔진 U+FFFD 2자(koli 각주 1), t8b 본문 4·각주 1 / 수정 엔진 0 |
| `node tests/audit_opus_fid/r3/kwpapers.mjs` | 5 × 5곳 | 주제어 머리말 오염: paper1·2·3·5 각 6줄(kopoetics 2·daejung 2·dongak 1·interlali 1. anim의 바탕틀 기호 1줄은 따로), paper4 0 |
| `node tests/audit_opus_fid/r3/fnnum.mjs` | 5편 | 번호 어긋남: paper2(38개 +1), 나머지 같음 |
| `node tests/audit_opus_fid/r3/fnbr3.mjs` | 3편 | 각주 안 줄바꿈→문단: paper4 12, paper5 19, paper3 0 |
| `node tests/audit_opus_fid/r3/stanza.mjs …` | 6 | 인용 사이 빈 줄 유실: 가상 1/1, paper1 1, paper2 1, paper5 3 |
| `node tests/audit_opus_fid/r3/tplscan.mjs` | 바탕틀 19 | 위첨자 예시 1(litheory author), 기울임 예시 2(fcs titleEn2, litheory abstractEnHead) |
| `node tools/verify_matrix.mjs --papers paper1,paper4 --journals litheory,dongak,kopoetics,anim` | 8 | 4/4 통과(사각지대, F-12) |

### 작가 원고 기초 수치(글자는 싣지 않음)

| 원고 | 문단 | 각주(번호 없음) | 표/그림 | 본문/각주 한자 | 각주 줄바꿈 | 보조평면·PUA | 역할(koli 기준) |
|---|---|---|---|---|---|---|---|
| paper1 | 135 | 61 (0) | 1/0 | 7/5 | 0 | 0 | title1 author1 abstract1 keywords1 h1 5 body48 quote3 ref39 refSub4 abstractEn5 |
| paper2 | 218 | 39 (1) | 1/0 | 2/1 | 0 | 0 | title1 author1 abstract3 h1 3 h2 1 body73 quote62 ref24 refSub2 abstractEn3 |
| paper3 | 198 | 35 (1) | 0/0 | 2/1 | 1(문단) | 0 | title1 subtitle1 author1 abstract3 h1 5 body74 ref60 refSub5 abstractEn3 |
| paper4 | 60 | 17 (0) | 0/5 | 8/3 | 12 | 0 | title1 subtitle1 author1 h1 3 body23 ref15 |
| paper5 | 144 | 27 (0) | 3/0 | 0/0 | 19 | 0 | title1 abstract1 keywords1 h1 4 body34 quote13 ref47 refSub1 abstractEn1 |

변환 시간: 원고 1편 × 학회 1곳 120~560 ms(Node). PDF 파싱본 평균 206 ms.

### 확인 못 한 것
- 실제 한컴오피스에서의 표시(각주 본문 표시 번호, `newNum` 수정안 적용 뒤 번호, 사사 각주의 본문 표시)는 확인 못 했다. 위 결론은 rhwp 재파싱과 독립 HWP5 판독에 근거한다.
- 브라우저 실행은 하지 않았다. F-1은 JSZip의 같은 청크 분할 경로를 근거로 브라우저에서도 같다고 보지만, 브라우저에서 직접 재현하지는 못했다.
- HWP 원고의 덧말·글자 겹치기·하이퍼링크 필드·수식 컨트롤은 가상 원고로 만들지 못해 확인 못 했다.
