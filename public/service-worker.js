const CACHE_NAME = "airplop-v1";
const ASSETS = [
    "/",
    "/index.html",
    "/styles/glassmorphism.css",
    "/lang/en.json",
    "/lang/vi.json",
    "/scripts/main.js",
    "/scripts/ui.js",
    "/scripts/network.js",
    "/scripts/localization.js",
    "/scripts/persistent-storage.js",
    "/scripts/libs/jszip.min.js",
    "/scripts/libs/qrcode.js",
    "/images/icon.svg"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
