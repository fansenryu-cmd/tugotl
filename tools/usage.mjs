// 사용량 보기 · Usage: GitHub Releases 배포본 내려받기 횟수(공개 API, 인증 없음) · release download counts (public API, no auth).
// 소개 페이지 방문 수는 https://fansenryu-cmd.github.io/tugotl/ 아래쪽 집계 이미지와 README 배지에서 본다 · landing-page visits are on the hits.sh badge.
// 사용: node tools/usage.mjs
const res = await fetch('https://api.github.com/repos/fansenryu-cmd/tugotl/releases', { headers: { accept: 'application/vnd.github+json', 'user-agent': 'tugotl-usage' } });
if (!res.ok) { console.error('GitHub API', res.status); process.exit(1); }
const rels = await res.json();
let total = 0;
for (const r of rels) {
  const n = (r.assets || []).reduce((a, x) => a + x.download_count, 0); total += n;
  console.log(`${r.tag_name.padEnd(8)} ${String(r.published_at || '').slice(0, 10)}  내려받기 downloads ${n}  ${(r.assets || []).map((x) => `${x.name} ${x.download_count}`).join(', ')}`);
}
console.log(`합계 total ${total} (배포본 releases ${rels.length})`);
console.log('방문 수 visits: https://hits.sh/fansenryu-cmd.github.io/tugotl/');
