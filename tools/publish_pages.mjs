// gh-pages 배포: site/(소개 페이지·설치 정보·오프라인 캐시·아이콘) + dist/투고틀.html·투고틀.sha256 을 한 커밋으로 올린다.
// 작업 트리를 바꾸지 않고 git 내부 명령(hash-object·mktree·commit-tree)으로 트리를 만든다. README.md는 gh-pages에 있던 것을 그대로 둔다.
// 사용: node tools/build.mjs && node tools/publish_pages.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const git = (args, input) => execFileSync('git', args, { cwd: root, input, encoding: input === undefined ? 'utf8' : undefined, maxBuffer: 1 << 28 }).toString().trim();
const dry = process.argv.includes('--dry');
const who = ['-c', 'user.name=이융희', '-c', 'user.email=jojanggun@naver.com'];

const app = path.join(root, 'dist', '투고틀.html'); const sha = path.join(root, 'dist', '투고틀.sha256');
if (!fs.existsSync(app) || !fs.existsSync(sha)) throw new Error('dist/투고틀.html이 없습니다. 먼저 node tools/build.mjs');
const build = fs.readFileSync(sha, 'utf8').trim().split(/\s+/)[0].slice(0, 12);

git(['fetch', '-q', 'origin', 'gh-pages']);
const old = git(['ls-tree', 'origin/gh-pages']).split('\n').map((l) => { const [meta, name] = l.split('\t'); const [mode, type, id] = meta.split(' '); return { mode, type, id, name }; });
const keep = old.filter((e) => e.name === 'README.md' || e.name === '.nojekyll');
const blob = (file, transform) => { const buf = fs.readFileSync(file); const data = transform ? Buffer.from(transform(buf.toString('utf8')), 'utf8') : buf; return execFileSync('git', ['hash-object', '-w', '--stdin'], { cwd: root, input: data }).toString().trim(); };

const entries = [...keep.map((e) => ({ name: e.name, id: e.id }))];
for (const f of fs.readdirSync(path.join(root, 'site'))) {
  const p = path.join(root, 'site', f); if (!fs.statSync(p).isFile()) continue;
  entries.push({ name: f, id: blob(p, f === 'sw.js' ? (s) => s.replace('__BUILD__', build) : null) });   // 오프라인 캐시 이름에 빌드 지문을 넣어 새 판이 오면 옛 캐시를 지운다
}
const appBlob = blob(app);
entries.push({ name: '투고틀.html', id: appBlob }, { name: 'tugotl.html', id: appBlob }, { name: '투고틀.sha256', id: blob(sha) });   // 영문 주소(tugotl.html)도 같은 파일 — 해외 사용자용
if (!entries.some((e) => e.name === '.nojekyll')) entries.push({ name: '.nojekyll', id: execFileSync('git', ['hash-object', '-w', '--stdin'], { cwd: root, input: '' }).toString().trim() });

const tree = execFileSync('git', ['mktree'], { cwd: root, input: entries.map((e) => `100644 blob ${e.id}\t${e.name}`).join('\n') + '\n' }).toString().trim();
const head = git(['rev-parse', '--short', 'HEAD']);
console.log(entries.map((e) => `  ${e.name}`).join('\n'));
if (dry) { console.log(`(dry) tree ${tree}`); process.exit(0); }
const commit = execFileSync('git', [...who, 'commit-tree', tree, '-p', 'origin/gh-pages', '-m', `배포: ${head} (빌드 ${build})`], { cwd: root }).toString().trim();
git(['push', '-q', 'origin', `${commit}:refs/heads/gh-pages`]);
console.log(`gh-pages ${commit.slice(0, 7)} ← ${head}`);
