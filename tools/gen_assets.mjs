// 화면 그림을 Codex CLI 그림 생성으로 다시 뽑는다.
// 사용: node tools/gen_assets.mjs empty welcome …  (이름 없으면 전부)   [--resize-only: 원본 PNG에서 JPG만 다시 만듦]
// 필요: codex CLI(ChatGPT 로그인), Python + Pillow(줄이기). 원본 PNG는 assets/raw/(git 제외), 결과 JPG는 assets/img/ 또는 지정 위치.
// 여러 장을 동시에 돌리면 사용 한도(429)에 걸리므로 한 장씩 차례로 만든다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const spec = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'prompts.json'), 'utf8'));
const raw = path.join(root, 'assets', 'raw'); fs.mkdirSync(raw, { recursive: true });
const args = process.argv.slice(2); const resizeOnly = args.includes('--resize-only');
const names = args.filter((a) => !a.startsWith('--')); const list = names.length ? names : Object.keys(spec.assets);

for (const name of list) {
  const a = spec.assets[name]; if (!a) { console.log(`없는 그림 이름: ${name}`); continue; }
  const png = path.join(raw, `${name}.png`);
  if (!resizeOnly) {
    const prompt = `Use your image generation tool to create exactly one image, then copy the generated file into the current working directory as ${name}.png. Print the saved path and pixel size. Image brief: ${a.prompt} Absolutely no text, no letters, no numbers, no logos in the image.`;
    for (let t = 1; t <= 3 && !fs.existsSync(png); t++) {
      try { execFileSync('codex', ['exec', '-m', spec.model, '--skip-git-repo-check', '--sandbox', 'workspace-write', '-C', raw, prompt], { stdio: ['ignore', 'inherit', 'inherit'], shell: process.platform === 'win32' }); } catch (e) { console.log(`codex 실패(${t}/3): ${e.message.slice(0, 120)}`); }
      if (!fs.existsSync(png)) execFileSync(process.execPath, ['-e', 'setTimeout(()=>{},60000)']);   // 한도에 걸렸으면 1분 쉬고 다시
    }
  }
  if (!fs.existsSync(png)) { console.log(`원본 없음: ${png}`); continue; }
  const out = path.join(root, a.out || path.join('assets', 'img', `${name}.jpg`));
  execFileSync('python', ['-X', 'utf8', '-c', 'import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert("RGB"); w=int(sys.argv[3]); im=im.resize((w, round(im.height*w/im.width)), Image.LANCZOS); im.save(sys.argv[2], "JPEG", quality=82, optimize=True, progressive=True)', png, out, String(a.width)], { stdio: 'inherit' });
  console.log(`${name} → ${path.relative(root, out)} ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}
