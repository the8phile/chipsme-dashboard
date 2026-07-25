const CACHE = 'chipme-v7';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.add('/').catch(function(){
        return cache.add('/index.html').catch(function(){});
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
          .map(function(k){ return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.includes('script.google.com') ||
      url.includes('googleapis.com') ||
      url.includes('fonts.gstatic.com') ||
      url.includes('fonts.googleapis.com')) {
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        if (cached) {
          fetch(e.request).then(function(resp) {
            if (resp && resp.status === 200) cache.put(e.request, resp.clone());
          }).catch(function(){});
          return cached;
        }
        return fetch(e.request).then(function(resp) {
          if (resp && resp.status === 200 && resp.type !== 'opaque') {
            cache.put(e.request, resp.clone());
          }
          return resp;
        }).catch(function() {
          return cache.match('/') ||
                 cache.match('/index.html') ||
                 new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{background:#07090F;color:#fff;font-family:Arial;text-align:center;padding:40px}h2{color:#00D68F}</style></head><body><h2>ChipsMe</h2><p>Offline — open once with internet first.</p></body></html>',
                 {status:200,headers:{"Content-Type":"text/html"}});
        });
      });
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
