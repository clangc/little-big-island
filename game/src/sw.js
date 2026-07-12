const C = "tlbi-explorer-v3";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    if (e.request.method === "GET" && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
    return res;
  }).catch(() => caches.match("./index.html"))));
});
