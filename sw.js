// 투고틀 오프라인 캐시 — 한 번 연 앱(투고틀.html)을 기기에 두고 인터넷 없이 연다.
// 앱 파일은 원고를 서버로 보내지 않는다. 이 워커도 같은 사이트의 정적 파일만 저장한다.
const CACHE = 'tugotl-a1feff5b1e8b';
// 설치 때는 소개 페이지와 아이콘만 받는다. 32MB 앱 파일은 사용자가 실제로 열 때 저장한다(소개 페이지만 본 사람에게 큰 파일을 내려받게 하지 않는다)
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const APP = ['./%ED%88%AC%EA%B3%A0%ED%8B%80.html', './tugotl.html'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
// 새 판으로 바뀔 때 옛 캐시에 저장해 둔 앱 파일은 새 캐시로 옮긴 뒤 옛 캐시를 지운다(오프라인에서도 계속 열리게. 인터넷이 되면 열 때 새 판으로 바뀐다)
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const olds = (await caches.keys()).filter((k) => k.startsWith('tugotl-') && k !== CACHE);
    const cur = await caches.open(CACHE);
    for (const k of olds) {
      const c = await caches.open(k);
      for (const u of APP) { if (await cur.match(u)) continue; const hit = await c.match(u); if (hit) await cur.put(u, hit); }
      await caches.delete(k);
    }
    await self.clients.claim();
  })());
});
const isPage = (url) => { const p = new URL(url).pathname; return p.endsWith('.html') || p.endsWith('/'); };
// 새 판이 있으면 받아 쓰고(인터넷 연결 시), 없으면 저장해 둔 판을 연다
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req).then((hit) => hit || (isPage(req.url) ? caches.match(APP[0]).then((a) => a || caches.match(APP[1])) : undefined))));
});
