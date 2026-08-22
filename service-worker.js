const CACHE="nyxa-portal-v18";
const ASSETS=[
  "./","./index.html","./styles.css","./app.js?v=17","./manifest.webmanifest",
  "./assets/nyxa-logo.png",
  "./assets/icons/nyxa-192.png","./assets/icons/nyxa-512.png",
  "./assets/previews/exposition.svg","./assets/previews/before.svg",
  "./assets/previews/proof.svg","./assets/previews/homebook.svg",
  "./assets/previews/linkcheck.svg","./assets/previews/identity.svg",
  "./assets/previews/reflex.svg","./assets/previews/sos.svg"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

const portalPaths = new Set(ASSETS.map(path=>new URL(path,self.registration.scope).pathname));

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  // The root service worker also has visibility over /nyxa-before/, /nyxa-proof/, etc.
  // Do not intercept those child GitHub Pages projects.
  if(!portalPaths.has(url.pathname)) return;

  event.respondWith(
    fetch(event.request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }).catch(()=>caches.match(event.request))
  );
});
