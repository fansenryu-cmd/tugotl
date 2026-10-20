// 빌드: src → dist/투고틀.html·dist/tugotl.html(같은 파일, Release 첨부용) (WASM·바탕틀 전부 내장, 오프라인 단일 파일) 및 dist/dev.html (외부 파일 참조)
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });

const t0 = Date.now();
const res = await build({
  entryPoints: [path.join(root, 'src/app.js')],
  bundle: true, format: 'iife', platform: 'browser', target: ['es2022'],
  write: false, minify: false, legalComments: 'none', logLevel: 'warning', logOverride: { 'duplicate-object-key': 'error' },   // 학회 데이터의 중복 키(예: format 두 번)는 빌드 실패로
  define: { 'import.meta.url': '"."' },
});
const js = res.outputFiles[0].text;
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const templates = fs.readdirSync(path.join(root, 'templates')).filter((f) => f.endsWith('.hwp'));
const forms = fs.existsSync(path.join(root, 'forms')) ? fs.readdirSync(path.join(root, 'forms')).filter((f) => f.endsWith('.hwp')) : [];
const formTags = forms.map((f) => `<script type="text/plain" data-form="${f.replace(/"/g, '')}">${fs.readFileSync(path.join(root, 'forms', f)).toString('base64')}</script>`).join('\n');
// 화면 그림(assets/img/*.jpg)은 data: 주소로 묶어 넣는다(오프라인 한 파일, CSP img-src data:)
const imgDir = path.join(root, 'assets', 'img');
const imgs = fs.existsSync(imgDir) ? Object.fromEntries(fs.readdirSync(imgDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => [f.replace(/\.[^.]+$/, ''), `data:image/${/png$/i.test(f) ? 'png' : /webp$/i.test(f) ? 'webp' : 'jpeg'};base64,${fs.readFileSync(path.join(imgDir, f)).toString('base64')}`])) : {};
const imgTag = `<script>window.TUGOTL_IMG=${JSON.stringify(imgs)};</script>`;
const tplTags = templates.map((f) => `<script type="text/plain" data-template="${f.replace(/\.hwp$/, '')}">${fs.readFileSync(path.join(root, 'templates', f)).toString('base64')}</script>`).join('\n');

function assemble({ inlineWasm }) {
  const wasmTag = inlineWasm
    ? `<script type="text/plain" id="wasm-b64">${fs.readFileSync(path.join(root, 'node_modules/@rhwp/core/rhwp_bg.wasm')).toString('base64')}</script>`
    : `<script>window.TUGOTL_ASSETS={wasmUrl:'../node_modules/@rhwp/core/rhwp_bg.wasm',templateBase:'../templates/',formBase:'../forms/'};</script>`;
  // 치환 문자열에 $& $` $' 같은 패턴이 들어 있어도 그대로 넣도록 함수형 replace를 쓴다
  return html
    .replace('/*__CSS__*/', () => css)
    .replace('<!--__ASSETS__-->', () => `${imgTag}\n${wasmTag}\n${inlineWasm ? tplTags + '\n' + formTags : ''}`)
    .replace('<!--__APP__-->', () => `<script>${js}</script>`)
    .replace('__BUILD__', () => new Date().toISOString().slice(0, 16).replace('T', ' '));
}

const prod = assemble({ inlineWasm: true });
fs.writeFileSync(path.join(dist, '투고틀.html'), prod);
fs.writeFileSync(path.join(dist, 'tugotl.html'), prod);   // GitHub Release 첨부용(영문 이름이어야 releases/latest/download/tugotl.html 링크가 이어진다)
// 배포본 무결성: 받은 파일이 원본인지 확인할 수 있도록 SHA-256을 따로 적는다 (릴리스 노트에 함께 올린다)
const { createHash } = await import('node:crypto');
const sha = createHash('sha256').update(prod).digest('hex');
fs.writeFileSync(path.join(dist, '투고틀.sha256'), `${sha}  투고틀.html\n`);
console.log(`sha256 ${sha}`);
// dev.html은 외부 파일을 참조하는 개발용이라 CSP를 뺀다(배포본 투고틀.html에는 CSP가 들어간다)
fs.writeFileSync(path.join(dist, 'dev.html'), assemble({ inlineWasm: false }).replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\n?/, ''));
console.log(`built in ${Date.now() - t0}ms — dist/투고틀.html ${(prod.length / 1048576).toFixed(1)} MB, dev.html ${(fs.statSync(path.join(dist, 'dev.html')).size / 1024).toFixed(0)} KB`);
