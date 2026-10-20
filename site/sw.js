// 투고틀 오프라인 캐시 — 한 번 연 앱(투고틀.html)을 기기에 두고 인터넷 없이 연다.
// 앱 파일은 원고를 서버로 보내지 않는다. 이 워커도 같은 사이트의 정적 파일만 저장한다.
const CACHE = 'tugotl-__BUILD__';
const CORE = ['./', './index.html', './%ED%88%AC%EA%B3%A0%ED%8B%80.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('tugotl-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// 새 판이 있으면 받아 쓰고(인터넷 연결 시), 없으면 저장해 둔 판을 연다
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => caches.match(req).then((hit) => hit || caches.match('./%ED%88%AC%EA%B3%A0%ED%8B%80.html'))));
});
