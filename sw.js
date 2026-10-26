// Training Lab hors ligne : la page, ses icônes et ses polices restent sur l'appareil.
// Page : copie d'abord (s'ouvre tout de suite, même sans réseau), mise à jour en arrière-plan pour la prochaine ouverture.
// L'API (script.google.com) ne passe jamais par ce cache : les données hors ligne sont gérées par la page.
// Changer CACHE à chaque modification de ce fichier : l'appareil reprend alors une copie neuve de la page.
const CACHE = "tl-v4", PAGE = "./";
// iPhone : une réponse gardée après une redirection refuse de s'afficher hors ligne ; on la garde « propre ».
const clean = res => res.redirected
  ? res.blob().then(b => new Response(b, { status: res.status, statusText: res.statusText, headers: res.headers }))
  : Promise.resolve(res);
// Toujours attendre la fin de l'écriture : l'iPhone arrête le service worker dès qu'il n'a plus rien à attendre.
const store = (key, res) => (res.ok || res.type === "opaque")
  ? clean(res).then(copy => caches.open(CACHE).then(c => c.put(key, copy)))
  : Promise.resolve();
self.addEventListener("install", e => {
  const files = [PAGE, "icon-180.png", "icon-192.png", "icon.svg"];
  e.waitUntil(Promise.all(files.map(u => fetch(u, { cache: "reload" }).then(r => store(u, r)))));
  self.skipWaiting();
});
self.addEventListener("activate", e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== "GET") return;
  if (u.origin === location.origin && (req.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith(".html"))) {
    let saved = Promise.resolve();
    const fresh = fetch(req.url, { cache: "no-store" }).then(res => { saved = store(PAGE, res.clone()); return res; });
    e.waitUntil(fresh.then(() => saved).catch(() => {}));
    e.respondWith(caches.match(PAGE).then(r => r || fresh));
  } else if (u.origin === location.origin || u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => store(req, res.clone()).then(() => res))));
  }
});
