점수: 84/100

# ASTRA 3차 감사 — 산출물 충실도(A)·기능 결함(B)

현재 소스는 2차보다 크게 개선됐다. 실원고 5편과 PDF 파싱본 40건을 세 학회에 변환한 **135건**, 새 가상 원고 16종의 **48건**에서 저장 HWP를 다시 읽고 비교했을 때, 아래 명시한 표지·규정 전처리 예외를 제외한 본문·각주 글자·각주 위치·활성 강조의 불일치는 0이었다. 그러나 정상 DOCX를 빈 문서로 읽는 경계, 익명화에 의한 부제 삭제, 사용자 서식·저장소 경계, 작은 HWPX의 긴 동기 실행 등이 남아 **95점에는 미달**한다. 84점은 위험도에 따른 판단이며 통과율이 아니다(A 43/50, B 41/50).

## 95점에 이르기 위해 고쳐야 할 것

1. **P0 내용 손실 방지:** DOCX를 XML 이름공간으로 읽고, 손상 입력은 명시적으로 거부한다(F-01). 이름 모양만으로 부제를 삭제하지 않는다(F-02).
2. **P1 입력·사용자 데이터:** HWPX 해제량·문단 길이를 WASM 진입 전에 제한하고 중단 가능한 실행 경계를 둔다(F-03). 수치 필드를 타입별로 검증하고 비어 있는 서식·깨진 일정 저장소에서도 화면과 입력이 작동하게 한다(F-04).
3. **P1 형식 충실도:** 연속 빈 줄 유지, 인용 출전 뒤 빈 줄, 한 글자 강조, 영문초록 첫 문단, 국내·국외 쪽수와 치환 좌표를 고친다(F-05~08).
4. **P1 저장·일정:** 학회 추가/편집도 가져오기처럼 원복하고, 지난 마감 및 비윤년 2월 29일을 처리한다(F-09~10).
5. **P2 출시 근거:** 정규화 없는 내용·좌표·범위 단언을 제품 회귀 게이트로 편입한다. 52/52 매트릭스를 전체 무손실의 증거로 쓰지 않는다(F-11). 실제 한컴 조판·실브라우저 접근성·재현 빌드를 별도로 확인한다.

## 감사 대상·연구 윤리·방법

- `brief_round3.md`의 마지막 추가 규칙까지, 운영규정, 2차 ASTRA 보고서, 대응표, 실데이터 검증, 검증매트릭스, 글꼴 안내, README를 읽었다. 사용자 지시대로 브라우저 자동화 없이 Node·vm으로 기능을 재현했다.
- 시작 HEAD는 `0278044ff0e444622fadb51514633d00841c4195`, 작업 트리에는 이미 다른 작업의 수정이 있었다. **초기 고정 시각 2026-10-13 19:52:17 KST**. 감사 중 소스·배포가 갱신되어 **최종 HEAD `2f8ad3ffa381bd29aa8da99dc9fbad6572bb31ef`, 최종 고정 20:01:17 KST**에 다시 복사하고 주요 검사를 재실행했다.
- 최종 수치는 `tests/audit_astra/round3/final/` 기준이다. 초기 증거는 상위 `round3/`에 따로 남겼다. `manifest.json`에 파일별 SHA-256을 기록했다. 파일:줄은 최종 소스 기준이며, 재현용 고정 소스는 `final/snapshot/src/`다.
- 이 에이전트는 `src/`, `dist/`, `release/`, `templates/`, `forms/`, README를 수정하지 않았다. 감사 스크립트·중간 파일·산출물은 모두 `tests/audit_astra/` 아래에만 썼다. 기존 감사 파일은 덮어쓰지 않았다. 새 가상 원고 원본은 `tests/audit_astra/fixtures/r3-*`다.
- `tools/convert.mjs`는 출력이 `tests/out/`에 고정되어 있어 직접 실행하면 쓰기 제한을 위반한다. 따라서 **도구의 복사본에서 import·자산 경로와 출력 경로만 변경**하고, 변환·검증 로직은 유지했다. `batch.mjs`가 입력 45건을 번호 파일로 복사하고 `process.argv`를 설정해 이 CLI를 순차 실행한다. 원문이 섞일 수 있는 CLI 로그는 출력하지 않고, 별도 엄격 비교기는 번호·길이·역할·불일치 개수만 기록한다.
- 실원고 제목·저자·문장·각주를 이 보고서나 새 파일 이름에 사용하지 않았다. `pdf-01`~`pdf-40`은 원본 TXT 파일명을 정렬한 순번이다. 원고를 외부로 보내거나 네트워크 자료 조회를 하지 않았다. 보고서에 나오는 문장 예시는 모두 직접 만든 가상 원고다.
- Node v25.4.0, 설치된 rhwp 0.8.7. 재파싱은 rhwp를 이용하므로 같은 엔진의 공통 결함 가능성이 있다. 한컴으로 열어 본 결과와 동일시하지 않는다.

## 중요도순 발견

### F-01 [높음, A/B] XML 접두사가 다른 정상 DOCX를 경고 없이 빈 원고로 반환

- 위치: `src/parse.js:153`, `:223`, `:253`.
- 재현: `node tests/audit_astra/round3/final/synthetic.mjs` → `synthetic.json`의 `namespace`, `empty`. 원본은 `fixtures/r3-namespace.docx`, `r3-empty.docx`.
- 정상 이름공간 URI를 `xmlns:x`로 선언하고 `<x:p><x:r><x:t>가상 본문 보존</x:t></x:r></x:p>`를 넣었다. 기대는 문단 1개·본문 8자, 실제는 **문단 0·경고 0**. 접두사 `w` 자체는 XML의 의미가 아니다.
- 닫히지 않은 `w:p/w:r/w:t`도 문단 0·경고 0으로 반환한다. 암호화·외부 참조 실행 취약점으로 주장하지 않는다. 본문을 조용히 누락하는 파싱 결함이다.
- 2차의 닫는 태그 공백·혼합 각주 런·작은따옴표 위첨자는 각각 정상이다. 그 세 수정이 XML 전반을 보장하지는 않는다.
- 수정안: 오프라인 이름공간 인식 XML 파서를 번들에 넣고 문서 순서대로 읽는다. 파싱 오류와 지원하지 않는 구조를 성공과 구별한다.

```js
const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const xmlDoc = parseXmlStrict(xml); // 오류면 throw, 외부 엔티티 해석은 하지 않음
const paras = descendantsByNamespace(xmlDoc, NS, 'p');
for (const p of paras) readChildrenInOrder(p);
// 미지원 이름공간/깨진 구조는 사용자에게 이유를 알려 거부한다.
```

### F-02 [높음, A] 저자가 없는 두 줄 제목의 짧은 둘째 줄은 익명화 때 삭제

- 위치: `src/structure.js:75`, `src/app.js:389`~`:395`.
- 재현: `node tests/audit_astra/round3/final/functional.mjs` → `anonymous-subtitle-no-author`.
- 입력: `긴 가상 제목 연구 / 문학성 / 1. 서론 / 가상의 본문이다.`. 실제 `finalizeBlocks`를 vm에서 실행했다. 기대는 제목 둘째 줄 보존, 실제는 `문학성`을 자동 `author`로 판정해 **3자·1문단 삭제**.
- 기존 재현인 `두 줄 제목 연구 / 문학성 / 홍길동 / …`은 이제 앞의 짧은 줄을 보존하고 실제 저자 줄만 제외한다. **조치표의 이 사례 개선 주장은 맞지만, 연속 이름 후보가 없는 경우는 미해결**이다.
- 수정안: 자동 이름 모양을 삭제 승인으로 사용하지 않는다. 직접 지정하거나 명시적 저자 메타데이터가 있는 문단만 제외한다.

```js
const removable = b => authorRoles.has(b.role)
  && (!b.auto || b.authorEvidence === 'explicit-metadata');
blocks = blocks.map(b => removable(b) ? { ...b, role: 'skip' } : b);
```

### F-03 [높음, B] 8KB HWPX가 동기 파싱을 17.6초 점유; 파일 읽기 전 크기 검사도 없음

- 위치: `src/parse.js:28`, `:42`; `src/app.js:367`~`:371`, `:574`~`:576`.
- 재현: `node tests/audit_astra/round3/final/extra.mjs`, `node tests/audit_astra/round3/final/functional.mjs`.
- 같은 HWPX의 한 텍스트 노드만 늘린 결과:

| 텍스트 노드 길이 | 압축 파일 바이트 | 최종 고정본 파싱 시간 | 결과 |
|---:|---:|---:|---|
| 20,000 | 7,116 | 115ms | 7문단 수용 |
| 80,000 | 7,388 | 1,276ms | 7문단 수용 |
| 320,000 | 8,086 | **17,628ms** | 7문단 수용 |

- 문단 20,001개 TXT는 명시 거부, 20,000개는 수용한다. 이 상한은 개선됐다. 그러나 HWPX는 생성자를 호출한 뒤 문단 수를 검사하고 ZIP 총 해제량·한 문단 길이 상한이 없다. 위 측정은 Node 실행 시간이며 브라우저 정지 시간을 직접 측정한 것은 아니다.
- `size=65MiB`인 파일 대역의 `arrayBuffer()`가 **1회 호출**된다. 읽기 단계에서 예외를 주입했으며 실제 65MiB 할당은 하지 않았다.
- 수정안:

```js
if (file.size > MAX_FILE) throw new Error('파일 크기 초과');
const bytes = new Uint8Array(await file.arrayBuffer());
await checkHwpxBudget(bytes, { totalXmlBytes: MAX_XML, maxParagraphChars: MAX_PARA_CHARS });
// 파싱은 Worker에서 실행하고 취소·시간 초과 때 terminate한다.
```

### F-04 [중간~높음, B] 사용자 서식의 필드 타입·완전성 및 일정 저장소 방어가 불충분

- 위치: `src/app.js:59`, `:68`~`:76`, `:504`, `:516`, `:543`~`:546`.
- 재현: `node tests/audit_astra/round3/final/functional.mjs`, `node tests/audit_astra/round3/final/ui-functions.mjs`.
- `{id:'test-format', journal:'가상 서식', format:{}}`가 검증을 통과한다. 실제 `formatTable()`은 `Object.entries(f.roles)`에서 **TypeError**. UI의 ‘적용되는 규정값’ 경로가 이 값을 직접 전달한다.
- 숫자 `-1`, `1e100`은 제거하지만 `page.height:'1e309'`, `roles.body.lineSpacing:'Infinity'`는 문자열로 통과한다. WASM의 수치 처리까지 투입하지 않았으므로 그 결과는 **확인 못 함**.
- `tugotl.schedule`에 `{ricc:5}`를 둔 뒤 실제 `saveSched`를 실행하면 `(all[j.id] || []).filter is not a function`. 읽기 함수 `userSchedule`은 방어하지만 쓰기 함수는 같은 방어를 사용하지 않는다.
- 수정안:

```js
const finiteIn = (v, lo, hi) => typeof v === 'number'
  && Number.isFinite(v) && v >= lo && v <= hi;
// page.width/height 등은 수치 전용, font/align은 문자열 전용으로 검증한다.
if (!validFormatSchema(c.format)) delete c.format; // 또는 누락값을 명시 기본값으로 채움
const list = userSchedule(j.id).filter(x => x.deadline !== fDl.value);
if (!lsSet(LS.schedule, { ...safeScheduleMap(), [j.id]: [...list, newItem] }))
  msg.textContent = '마감 저장에 실패했습니다.';
```

### F-05 [중간, A/B] ‘원고 빈 줄 유지’도 연속 빈 줄을 합치며 인용 출전 뒤 기본 빈 줄은 누락

- 위치: `src/structure.js:177`, `:198`~`:202`; `src/app.js:398`, `:411`.
- 재현: `node tests/audit_astra/round3/final/functional.mjs` → `keep-blanks`, `quote-source`.
- `body / blank / blank / body`를 재배열하고 `keepSourceBlanks:true`로 처리하면 **빈 줄 2→1**. `applyBlanks`에 도달하기 전에 `reorderSections`가 합친다.
- `body / quote / source / body`, `blanks:{}`는 기대 `body / blank / quote / source / blank / body`, 실제는 **앞 1·뒤 0줄**. `quote` 뒤의 기본 1과 달리 `source` 뒤는 명시된 `rules.aroundQuote`만 검사한다.
- 수정안:

```js
// 재배열 단계에서는 원고 빈 문단을 보존하고 빈 줄 정책을 마지막 단계로 모은다.
return { blocks: out, changed, from, to };
// 인용문과 출전을 하나의 묶음으로 취급한다.
if (prev.role === 'source' && !isQ(b)) n = Math.max(n, aroundQuote);
```

### F-06 [중간, A] 최종 Markdown 정규식은 한 글자 강조를 인식하지 못함

- 위치: `src/parse.js:304`.
- 재현: `node tests/audit_astra/round3/final/extra.mjs`; `fixtures/r3-single-italic.md`, `r3-single-bold.md` 및 저장 HWP.
- 기대 `*가*`→`가`(기울임), `**가**`→`가`(굵게). 실제 저장·재파싱 결과는 각각 **`*가*`, `**가**` 그대로**, 원한 강조 없음. 두 글자인 `*가나*`는 `가나`로 정상 변환한다.
- `[...]+?\S`가 최소 두 글자를 요구한다. 저자 이름 뒤 별표 보호는 유지하면서 내용 최소 길이를 1로 바꿔야 한다.

```js
// 각 강조 그룹의 내용 부분 예시: 한 글자 또는 여러 글자, 마지막은 비공백
const content = /([^*\n]*?\S)/;
// 기존의 시작·끝 경계 조건과 결합하고 *가*, **가**, *가나*를 모두 단언한다.
```

### F-07 [중간, A] 짧은 영문초록 본문이 영문 제목으로 분류됨

- 위치: `src/structure.js:121`.
- 재현: `node tests/audit_astra/round3/final/synthetic.mjs`, `final/fixture-strict.mjs`의 `fx-r3-english-txt`.
- `Abstract / This is a synthetic summary. / Keywords: test, text`에서 28자 요약 문장을 **`titleEn2`**, `abstractEn` 0개로 분류한다. 영문 장 제목 2개는 h1, 뒤 본문 2개는 body로 정상 탈출한다. 텍스트 보존 검사만으로는 잘못된 제목 서식 적용을 잡지 못한다.
- 수정안: 문장 종결을 제목 후보에서 제외하고 초록부 제목 재등장은 서식 단서나 명시적 역할로 확인한다.

```js
const titleEvidence = p.styleName === 'Title' || p.explicitRole === 'titleEn2';
if (!/[.!?]$/.test(t) && titleEvidence) push('titleEn2', '명시 제목');
else push('abstractEn', '영문초록 본문');
```

### F-08 [중간, A] 2차 R-08의 서지 치환·정렬·좌표 문제가 남음

- 위치: `src/structure.js:150`, `:224`~`:250`.
- 재현: `node tests/audit_astra/round3/final/functional.mjs` → `page-style`, `marks`, `references-sort`.
- 가상 국내 인용 뒤 마침표로 이은 `Smith, Synthetic Book, 2021, p. 33.`이 **`33쪽`**으로 바뀐다. 세미콜론으로 이으면 p.가 유지된다. 구분 기호 하나로 국외 규정 적용이 달라진다.
- ricc의 국내 여러 쪽 표기 입력 `pp. 12-14.`는 **`12~14쪽.`**. 범위 기호는 규정 데이터의 형식과 따로 처리되지 않는다.
- `marks:'half'`에서 `가 『책』 뒤`의 각주 위치는 UTF-16 **기대 7·실제 5**, 기울임 런은 `[]`로 폐기. 이 옵션은 기본 UI의 `marks:'keep'`와 구별되는 함수 옵션 경로다.
- eomun 규정의 국내 가나다→국외 알파벳 순서가 있어도 가상 입력 `Zed / 하하하 / 가가가` 순서가 그대로다. 자동 정렬 미지원 안내가 필요하다.
- 수정안:

```js
const style = citation.language === 'foreign' ? rule.foreignPages : rule.domesticPages;
const next = renderPages(citation.pages, style); // 범위 구분자도 규칙에서 읽음
// 낫표 치환도 같은 편집 목록에 포함; 새 좌표 편집은 원문 좌표로 합성한다.
applyEdit({ at, oldLen, replacement });
// 참고문헌 소분류 안에서만 규칙에 따라 정렬하거나, 자동 미지원 경고를 낸다.
```

### F-09 [중간, B] 가져오기 원복은 수정됐지만 학회 추가/편집 저장은 부분 변경을 남김

- 위치: `src/app.js:588`~`:589`.
- 재현: `node tests/audit_astra/round3/final/ui-functions.mjs` → `add-save-rollback`.
- 실제 `renderManage`가 만든 바탕틀 선택·저장 콜백을 실행하고 학회 저장 키에 quota 예외를 주입했다. 기대는 두 데이터 모두 원래 상태, 실제는 **학회는 기존 synthetic 1개, 새 바탕틀 newsave 1개만 저장됨**. 새 키로 재현했으므로 기존 학회 파괴를 실측했다고 주장하지 않는다. 편집 경로는 같은 키의 바탕틀도 선행 교체한다.
- 가져오기 핸들러는 기존 1+신규 1 병합, 두 번째 저장 실패 시 기존 두 원문 복구를 확인했다. 2차 R-09의 기존 핸들러 문제는 해결됐다.
- 수정안:

```js
const beforeJ = localStorage.getItem(LS.journals);
const beforeT = localStorage.getItem(LS.templates);
try { commitBoth(nextJ, nextT); }
catch (e) { restoreBoth(beforeJ, beforeT); throw e; }
// 성공한 뒤에만 state.templates / templateInfo를 변경한다.
```

### F-10 [중간, B] 지난 마감만 있으면 다시 표시; 비윤년 2월 29일은 3월 1일로 이동

- 위치: `src/app.js:35`, `:130`~`:142`.
- 재현: `node tests/audit_astra/round3/final/functional.mjs` → `past-only`, `leap-nonleap`.
- 기준일 2026-10-13, 명시 마감 2026-01-01 한 건뿐이면 미래 결과가 없다는 이유로 **지난 마감 1건을 반환**한다. 추가 규칙의 ‘지난 마감 숨김’과 다르다.
- `deadlines:['02-29']`는 윤년 기준 검증을 통과하지만 기준 연도 2026에 생성하면 **2026-03-01**이 된다.
- 수정안:

```js
const iso = `${y}-${md}`;
if (!isoDate(iso)) continue; // 다음 유효 연도까지 탐색하는 정책을 별도로 정함
return out.filter(o => o.date >= t0).sort((a, b) => a.date - b.date);
```

### F-11 [중간, A/B] 기존 검증 도구는 엄격 무손실·모든 역할 서식의 합격 게이트가 아님

- 위치: `tools/convert.mjs:13`, `:68`, `:77`; `tools/verify_matrix.mjs:71`, `:78`, `:97`, `:102`.
- 재현: 아래 135건·52개 학회 검사와 `node tests/audit_astra/round3/final/verdicts.mjs`.
- convert는 공백/일부 구두점 제거, 부분문자열 포함 여부, 강조 Set 비교다. 매트릭스는 글 머리와 역할별 **최빈값**으로 비교한다. 체재 순서도 실제 산출 역할을 독립 인식한 것이 아니라 전처리 블록의 그룹 순서다.
- 따라서 **52/52 통과는 이 도구가 실제 확인한 조건의 통과**이며 모든 글자·중복·강조 범위·규정 적합성 인증이 아니다. F-01/02/05/07이 별도 독립 기대값에서 실패하는 이유다.
- 새 게이트는 실원고 성공 조건과 의도적 경계 실패 조건 **34개 중 21 통과·13 실패**이며 실패 시 exit 1을 반환한다. 이 34개는 모든 탐색 사례를 다 센 것이 아니다(한 글자 강조·성능 등은 별도).
- 수정안:

```js
assert.deepEqual(actualTexts, expectedTexts); // 문단 순서·중복·공백 유지
assert.deepEqual(actualNotes, expectedNotes); // 내용·번호 유무·문단·좌표
assert.deepEqual(actualStyleCoverage, expectedStyleCoverage);
// 표지 변경은 역할별 예상 문자열을 먼저 만든 뒤 비교한다.
// 역할 최빈값 대신 문단마다 허용 범위·기대 속성을 단언한다.
```

## 2차 발견·조치표 재검증

| 2차 항목 | 3차 판정과 실행 근거 |
|---|---|
| R-01 UTF-16 좌표 | **수정 확인.** 보조평면 포함 3학회×3회 왕복, 각주 offset 14 고정, 본문 활성 강조 결손 0. 코드포인트 수를 기대값으로 쓰지 않음 |
| R-02 DOCX 순서·공백 | **지정 3사례 수정.** 닫는 태그 공백 1문단, 혼합 런 ‘앞뒤’ offset 1, 작은따옴표 위첨자 true. 이름공간·손상 XML은 F-01 |
| R-03 사용자 데이터 | **부분 수정.** 빈 줄 10000·1.5·문자열 무한값 제거, 중복 체재 제거, 음수/초대형 숫자 제거, 없는 ISO 날짜 제거. 필드별 타입·빈 서식은 F-04 |
| R-04 입력 상한 | **부분 수정.** 20,001문단 거부·20,000 수용, spread 제거. HWPX·읽기 전 상한은 F-03 |
| R-05 공백·각주 | **주요 수정.** 본문 탭/줄바꿈/전각/NBSP/줄끝 공백, 3문단 각주·빈 문단·이탤릭 보존. paper4 관련 각주도 3학회 엄격 불일치 0. 전체 537각주 불일치 0. 각주 안 강조는 최종 소스·배포 양쪽 확인 |
| R-06 익명화·목차 | **부분 수정.** 기존 연속 이름 재현은 보존, 반복 목차 뒤 본문 h1 2개 정상. 저자 없는 짧은 부제는 F-02 |
| R-07 정오표 | **지정 사례 수정.** 국외 동명 다른 저자/연도 noRef=1, 국외 p. formatBad=0, 내주 학회 uncited=0, 재검사 뒤 red 잔류 없음 |
| R-08 치환·정렬·빈 줄 | **미해결/부분.** 원고 인용 사이 빈 줄을 보존하는 개선은 있으나 F-05·08 남음 |
| R-09 저장 원복 | **가져오기 수정 확인.** 실제 새 핸들러를 추출해 주입 시험. 옛 저장 코드를 하네스에서 재구현하지 않음. 추가/편집은 F-09 |
| R-10 URL | **수정 확인.** 빈 DNS 레이블·선행 하이픈·점만 있는 호스트·javascript 거부, 정상 HTTPS와 IDN 수용 |
| R-11 검증·배포 | **부분 수정.** 최신 해시·자산 일치. F-11의 검증 한계와 재현 빌드 환경 제약은 남음 |
| 추가 규칙 기능 | 바탕틀 없는 사용자 학회 저장·재로딩, 가져오기 병합, 문단 2만 상한 확인. 지난 마감은 F-10. DOCX 캐시 로직은 소스 확인; 5만 런 성능을 최종본에서 별도 재측정한 것은 **확인 못 함** |

## 실행한 명령과 수치

### A: 실제 저장 HWP 재열기·문자 비교

최종 `batch.mjs`는 원본 파싱→역할 인식→목차 생성→학회 체재 재배열→허용 쪽수 치환→빈 줄 정책을 기대 모델로 만들고, CLI가 **디스크에 저장한 HWP**를 다시 읽어 문단 인덱스별로 비교했다. 글자 수는 JS UTF-16 코드 단위다. 이 검사는 **파서 모델 이후의 전송·저장 보존**을 보며, 파서 자체의 정답은 직접 만든 fixture에서 별도로 검사했다.

| 최종 검사 | 건수 | 비교 문단 | 비교 UTF-16 | 각주 | 본문 불일치 | 각주 내용/위치 불일치 | 본문/각주 활성 강조 손실 |
|---|---:|---:|---:|---:|---:|---:|---:|
| paper1~5 × koli·ricc·dongak | 15 | 2,105 | 363,035 | 537 | 0 | 0 / 0 | 0 / 0 |
| pdf-01~40 × 같은 3곳 | 120 | 104,454 | 4,009,755 | 0 | 0 | 0 / 0 | 0 / 0 |
| 가상 16종 × 같은 3곳 | 48 | 261 | 2,139 | 27 | 0 | 0 / 0 | 0 / 0 |

- 실원고 합계 **106,559문단·4,372,790 UTF-16·537각주**. 표지/주제어 역할의 문구 변경 **267문단**은 위 본문 불일치 수에서 분리했다(paper 41, pdf 226). 표지의 학회 데이터 적합성은 아래 매트릭스로 별도 검사했다. **주제어 내용 전체의 독립 예상 문자열까지 267건 모두 엄격 검증한 것은 확인 못 함**.
- 원고 인식에서 `skip`으로 제거된 파싱본 줄은 학회별 중복 집계 **45문단**. paper는 0. 이 줄들을 ‘글자 보존 성공’의 분모에 포함하지 않았다. 모든 자동 제외의 의미적 타당성을 원문 정답 라벨로 인증한 것은 **확인 못 함**.
- PDF 파싱 TXT의 각주 0은 각주가 없다는 논문 내용 판정이 아니다. TXT 파서가 각주 마커 정의로 연결한 객체가 0이라는 뜻이다. PDF상의 실제 각주 위치·각주 서식을 복구했다는 증거가 아니다.
- 제목류의 굵기는 학회 서식 우선이므로 입력 굵기 유지는 제외하고, 그 밖의 활성 B/I/U/위첨자 손실을 글자별 검사했다. 원고에 없던 강조가 추가됐는지 전 글자 대칭 비교한 것은 **확인 못 함**. 제목류 기대 굵기는 매트릭스에서 별도 확인했다.
- 가상 16종: TXT 6, MD 1, DOCX 5, HWPX 3, HWP 1. 추가 파싱 경계 DOCX 2종(이름공간/손상), 한 글자 강조 등 MD 3종, 대용량 HWPX 3종도 별도 생성했다. HWP는 직접 만든 2구역 HWPX를 엔진으로 저장한 파일이다.
- 2구역 HWP: 입력 2구역·2문단·번호 없는 각주 2개, 각주 offset 10/10·각주 이탤릭 각 9자 보존. 구역을 합친다는 경고 확인. 가상 원고의 여러 문단 각주는 3문단(중간 빈 문단 포함) 유지.
- Unicode 경계: 본문 7문단×3학회×3왕복=**63문단**, 글자 불일치 0·본문 활성 강조 손실 0. 각주 9회 모두 offset **14**, 내용 26자·3문단·이탤릭 24자 유지. HWPX 저장본도 다시 파싱했다.

### 형식·기능 수치와 한계

| 항목 | 실행 결과 |
|---|---|
| 5편 × 52개 학회 전수 매트릭스 | **52/52**, 260건, 최종 39초 |
| 매트릭스 역할별 비교 | **3,532 역할 묶음**, 해당 문단 31,902개. 역할별 최빈값 검사임 |
| 용지·여백 독립 검사 | 저장 HWP 135건×9속성, 불일치 **0**. 바탕틀 원본 또는 format.page와 직접 비교 |
| 새 경계 게이트 | 34조건: **21 통과·13 실패**, exit 1 |
| vm 열기→적용→저장 | 가상 원고 8문단, HWP 6,144바이트·HWPX 6,370바이트·로그 1,899바이트, 저장 HWP 재열기 8문단 |
| 역할 수정 | 실제 콜백으로 subtitle·auto=false·dirty=true 확인. recompute(false)는 재설정하지만 해당 직접 호출을 사용자 경로의 결함으로 세지 않음 |
| 사용자 학회 | 바탕틀 없는 저장·로드 성공, 새 렌더 후 JSON 내보내기 1학회, 가져오기 병합 2학회·2바탕틀, 가져오기 실패 원복 성공 |
| 공고 입력 | 가상 공고에서 호수·마감·발간 날짜 추출 성공 |
| 기존 pipeline_test | 초기 고정본의 도구 실행 완료. 로그 기반 생성·재로드 검사이며 최종 전체 합격 단언 수로 세지 않음 |
| 기존 fidelity_test | 초기 고정본 **12경로 성공 로그**. 최종본은 새 엄격 fixture 검사로 재검증 |
| 접근성·도움말 | 원고 드롭 영역 Enter/Space 처리, 파일/역할 선택 aria-label, 저장 메뉴 이름, 설정 dialog 선언을 소스에서 확인. 포커스 이동·스크린리더·실제 미리보기 UI는 **확인 못 함** |
| 예시 쪽 나눔·조판 | 매트릭스 체재/서식 확인 외 실제 한컴의 새 쪽 시작·각주 겹침·글꼴 글리프·인쇄 결과는 **확인 못 함** |

### 배포 무결성과 감사 중 갱신

- 최초 배포: **19,527,258바이트**, SHA-256 `cb595d63f161c4c74dc39ee342da855a5ad982bfeb078df4792dcf29216d45d9`, 해시 파일 일치. 당시 배포 파서를 vm으로 실행하니 DOCX 각주 24자 이탤릭이 모델에 없고, 선행 공백이 있는 번호 없는 HWPX 각주가 9→8자 및 번호 정보 손실이었다. 소스에서는 정상이라 배포 지연으로 구별했다.
- **최종 배포에서 해소 확인:** **19,540,050바이트**, SHA-256 `8210db45252c515ce043be213671e9a1b3a2725e0bae18fd30530ac0a32a8dea`, 해시 파일 일치. 같은 vm 재현에서 DOCX 26자·3문단·이탤릭 24자, 번호 없는 각주 9자·이탤릭 9자·noNumber=true로 소스와 일치한다. 이 문제는 최종 미해결 목록과 감점에 넣지 않았다.
- 내장 바탕틀/서식 **34자산 + WASM 1개**를 원본 바이트와 비교해 모두 일치. CSP는 default-src none, connect-src data:/blob:, object-src/base-uri/form-action none. 브라우저에서 실제 통신 차단을 시험한 것은 **확인 못 함**.
- 출력만 감사 폴더로 바꾼 `build.mjs` 복사본 실행은 **esbuild spawn EPERM**으로 중단. 자동 승인 검토 거부가 아니라 실행 환경의 자식 프로세스 생성 오류다. 금지 폴더 쓰기나 권한 우회를 하지 않았다. 전체 재빌드 바이트 동등성은 **확인 못 함**이며 빌드 시각 문자열 때문에 원래도 시각을 고정/정규화해야 한다.

### 재현 명령

모두 저장소 루트에서 실행. `final/snapshot/tools/convert.mjs`는 원본 도구의 경로만 바꾼 고정 복사본이다. 아래 batch는 5개 HWP와 40개 TXT 전부를 각각 세 학회에 넣는 실제 CLI 실행을 포함한다.

```text
node tests/audit_astra/round3/setup.mjs
node tests/audit_astra/round3/batch.mjs
node tests/audit_astra/round3/synthetic.mjs
node tests/audit_astra/round3/functional.mjs
node tests/audit_astra/round3/ui-functions.mjs
node tests/audit_astra/round3/fixture-conversions.mjs
node tests/audit_astra/round3/fixture-strict.mjs
node tests/audit_astra/round3/snapshot/tools/pipeline_test.mjs
node tests/audit_astra/round3/snapshot/tools/fidelity_test.mjs
node tests/audit_astra/round3/snapshot/tools/build.mjs
node tests/audit_astra/round3/integrity.mjs
node tests/audit_astra/round3/release-behavior.mjs

node tests/audit_astra/round3/prepare-final.mjs
node tests/audit_astra/round3/final/batch.mjs
node tests/audit_astra/round3/final/synthetic.mjs
node tests/audit_astra/round3/final/functional.mjs
node tests/audit_astra/round3/final/ui-functions.mjs
node tests/audit_astra/round3/final/fixture-strict.mjs
node tests/audit_astra/round3/final/extra.mjs
node tests/audit_astra/round3/final/geometry.mjs
node tests/audit_astra/round3/final/snapshot/tools/verify_matrix.mjs --samples tests/audit_astra/round3/no-samples --md tests/audit_astra/round3/final/matrix.md
node tests/audit_astra/round3/final/integrity.mjs
node tests/audit_astra/round3/final/release-behavior.mjs
node tests/audit_astra/round3/final/verdicts.mjs
```

`setup`/`prepare-final`은 해당 실행 당시 소스를 복사한다. **과거 고정본 재현 시 이 준비 명령을 다시 실행하지 말고 이미 보존된 snapshot을 사용한다.** 개별 CLI 예시는 `node tests/audit_astra/round3/final/snapshot/tools/convert.mjs tests/audit_astra/round3/final/inputs/paper1.hwp koli,ricc,dongak --quiet`다(이 도구의 로그에는 원문 조각이 나올 수 있어 자동 batch는 로그를 억제한다).

준비 중 도구 복사본의 자산/출력 경로, vm의 번들 import 이름, 가상 DOM 버튼 이름을 바로잡고 재실행했다. 이 초기 하네스 오류와 집계 스크립트 구문 오류는 제품 결함으로 세지 않았다. `verdicts`의 실패 종료는 검출된 조건 실패이며, build EPERM과 구별한다.

주요 증거: `final/batch.json`, `fixture-strict.json`, `synthetic.json`, `functional.json`, `ui-functions.json`, `extra.json`, `geometry.json`, `verdicts.json`, `outputs/verify_matrix.json`, `integrity.json`, `release-behavior.json`, `manifest.json`. 최종 소스 변경 여부는 `final/checkpoint.json`에 기록한다.
