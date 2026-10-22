// Training Lab hors ligne : la page et ses polices restent sur l'appareil.
// Page : réseau d'abord (les mises à jour arrivent), copie sinon. Polices et icônes : copie d'abord.
// L'API (script.google.com) ne passe jamais par ce cache : les données hors ligne sont gérées par la page.
const CACHE = "tl-v2";
self.addEventListener("install", e => {
  const files = ["./", "icon-180.png", "icon-192.png", "icon.svg"];
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(files.map(u =>
    fetch(u, { cache: "reload" }).then(r => clean(r)).then(x => c.put(u, x))))));
  self.skipWaiting();
});
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// iPhone : une page gardée après une redirection (…/training-lab → …/training-lab/) refuse de s'afficher hors ligne ;
// on la garde donc « propre », sans trace de redirection.
const clean = res => res.redirected ? res.clone().blob().then(b => new Response(b, { status: res.status, statusText: res.statusText, headers: res.headers })) : Promise.resolve(res.clone());
const keep = (req, res) => { if (res.ok || res.type === "opaque") clean(res).then(copy => caches.open(CACHE).then(c => c.put(req, copy))); return res; };
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
