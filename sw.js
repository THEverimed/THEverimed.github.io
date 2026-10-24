// يخلي الموقع يفتح بسرعة ويشتغل كتطبيق. لا يحفظ أي بيانات من الخادم.
const CACHE = 'verimed-v1';
const SHELL = ['./', 'index.html', 'config.js', 'logo.svg', 'logo-dark.svg', 'favicon.svg', 'icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return; // الخادم (Apps Script) ما نلمسه أبداً

  // الصفحة نفسها: من الإنترنت أول (عشان تحديثاتك توصل فوراً)، ومن الذاكرة لو انقطع النت
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('config.js')) {
    e.respondWith(fetch(req).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // الصور والخطوط: من الذاكرة فوراً، وتتحدث بالخلفية
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
