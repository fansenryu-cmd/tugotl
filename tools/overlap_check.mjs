// 미리보기 각주 겹침 측정: node tools/overlap_check.mjs <hwp 파일…>
// rhwp render tree에서 FootnoteArea 위쪽 경계 아래에 놓인 본문 TextLine 수를 쪽마다 센다(0이면 겹침 없음).
import fs from 'node:fs';
import { initEngine, HwpDocument } from '../src/engine.js';
await initEngine(fs.readFileSync(new URL('../node_modules/@rhwp/core/rhwp_bg.wasm', import.meta.url)));
const overlap = (doc, page) => {
  const tree = JSON.parse(doc.getPageRenderTree(page)); let fnTop = Infinity; const lines = [];
  const walk = (n, inBody) => { if (!n || typeof n !== 'object') return; if (n.type === 'FootnoteArea' && n.bbox) fnTop = Math.min(fnTop, n.bbox.y); if (n.type === 'TextLine' && inBody && n.bbox) lines.push(n.bbox); for (const c of n.children || []) walk(c, inBody || n.type === 'Body'); };
  walk(tree, false); return isFinite(fnTop) ? lines.filter((b) => b.y + b.h > fnTop + 1).length : 0;
};
for (const f of process.argv.slice(2)) {
  const d = new HwpDocument(new Uint8Array(fs.readFileSync(f))); const a = []; for (let p = 0; p < d.pageCount(); p++) a.push(overlap(d, p));
  console.log(`${f}: ${d.pageCount()}쪽, 겹친 본문 줄 ${a.reduce((x, y) => x + y, 0)} (쪽별 ${a.join(',')})`); d.free();
}
