// Training Lab hors ligne : la page et ses polices restent sur l'appareil.
// Page : réseau d'abord (les mises à jour arrivent), copie sinon. Polices et icônes : copie d'abord.
// L'API (script.google.com) ne passe jamais par ce cache : les données hors ligne sont gérées par la page.
const CACHE = "tl-v1";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "icon-180.png", "icon-192.png", "icon.svg"])));
  self.skipWaiting();
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
const keep = (req, res) => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; };
self.addEventListener("fetch", e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== "GET") return;
  if (u.origin === location.origin) {
    if (req.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith(".html"))
      e.respondWith(fetch(req).then(res => keep(req, res)).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./"))));
    else e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => keep(req, res))));
  } else if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => keep(req, res))));
  }
});
