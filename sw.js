// ─── SERVICE WORKER — zenOt PWA ───────────────────────────────
// Strategi:
// - index.html        → SELALU network (tidak pernah cache)
// - JS app files      → SELALU network (tidak pernah cache)
// - CDN (font, icons) → cache-first (jarang berubah)
// - Gambar/manifest   → cache-first
// Dengan strategi ini, update file JS langsung terasa tanpa perlu
// unregister SW atau hard refresh.

var CACHE_VERSION = 'zenot-static-v4';
var CACHE_CDN     = 'zenot-cdn-v1';

// Hanya file statis yang boleh di-cache (tidak pernah berubah setelah deploy)
var STATIC_ASSETS = [
  './logo.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.json',
];

var CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.min.js',
];

// File JS — network-first: selalu ambil versi terbaru, fallback cache kalau offline
var JS_APP_FILES = [
  'app.js', 'supabase.js', 'dashboard.js', 'produk.js',
  'stok.js', 'restock.js', 'kas.js', 'jurnal-penjualan.js',
  'produk-terjual.js', 'price-list.js', 'dataorder.js',
  'rekap.js', 'channel-master.js', 'beban-operasional.js',
  'anggaran.js', 'keuangan.js', 'clearance.js', 'hpp.js', 'notif.js',
  'shopee-auth.js', 'shopee-sync.js', 'networth.js',
  'rough-ui.js', 'style.css',
];
// index.html selalu dari network agar versi SW terbaru langsung aktif
// networth.js + shopee-sync.js: TIDAK di-cache — kritis, harus selalu versi terbaru
var NO_CACHE_PATTERNS = ['index.html', 'networth.js', 'shopee-sync.js'];
// BUMP: JS_CACHE v8 — fix jitter (kas/jp scroll) + keuangan.js orphan brace fix
var JS_CACHE = 'zenot-js-20260605-scroll-v8';

// ─── SKIP WAITING ────────────────────────────────────────────
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ─── INSTALL ─────────────────────────────────────────────────
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_VERSION).then(function(c) {
        return Promise.all(STATIC_ASSETS.map(function(url) {
          return c.add(url).catch(function(err) {
            console.warn('[SW] Gagal cache static:', url, err);
          });
        }));
      }),
      caches.open(CACHE_CDN).then(function(c) {
        return Promise.all(CDN_ASSETS.map(function(url) {
          return c.add(url).catch(function(err) {
            console.warn('[SW] Gagal cache CDN:', url, err);
          });
        }));
      })
    ])
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      // JS_CACHE wajib masuk kept — tanpa ini cache JS terhapus setiap aktivasi SW
      // yang menyebabkan semua script harus fetch ulang dari network.
      // Jika network lambat/offline saat PWA dibuka → semua script gagal load → blank page.
      var kept = [CACHE_VERSION, CACHE_CDN, JS_CACHE];
      return Promise.all(
        keys.filter(function(k) { return kept.indexOf(k) === -1; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      return self.clients.matchAll({ type: 'window' }).then(function(clients) {
        clients.forEach(function(c) { c.postMessage({ type: 'SW_UPDATED' }); });
      });
    })
  );
});

// ─── FETCH ───────────────────────────────────────────────────
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Supabase → selalu network, tidak cache
  if (url.indexOf('supabase.co') !== -1) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
      })
    );
    return;
  }

  // CDN → cache-first
  if (url.indexOf('fonts.googleapis.com') !== -1 ||
      url.indexOf('fonts.gstatic.com')    !== -1 ||
      url.indexOf('cdn.jsdelivr.net')     !== -1) {
    e.respondWith(
      caches.open(CACHE_CDN).then(function(c) {
        return c.match(e.request).then(function(cached) {
          if (cached) return cached;
          return fetch(e.request).then(function(res) {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  // index.html → selalu network
  var isNoCache = NO_CACHE_PATTERNS.some(function(p) { return url.indexOf(p) !== -1; });
  if (isNoCache) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).catch(function() { return caches.match(e.request); }));
    return;
  }

  // File JS/CSS app → network-first (selalu ambil versi terbaru)
  // Fallback ke cache hanya kalau benar-benar offline
  var isJsFile = JS_APP_FILES.some(function(p) { return url.indexOf(p) !== -1; });
  if (isJsFile) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(function(res) {
        if (res.ok) {
          // Clone SEBELUM return — iOS Safari throw "body already used" kalau clone setelah return
          var resClone = res.clone();
          caches.open(JS_CACHE).then(function(c) { c.put(e.request, resClone); });
        }
        return res;
      }).catch(function() {
        return caches.open(JS_CACHE).then(function(c) { return c.match(e.request); });
      })
    );
    return;
  }

  // Static assets (gambar, icon) → cache-first
  e.respondWith(
    caches.open(CACHE_VERSION).then(function(c) {
      return c.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(res) {
          if (res.ok) c.put(e.request, res.clone());
          return res;
        });
      });
    })
  );
});

// ─── PUSH NOTIFICATION ───────────────────────────────────────
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) {}
  e.waitUntil(self.registration.showNotification(data.title || 'zenOt', {
    body:    data.body  || '',
    icon:    './icon-192.png',
    badge:   './icon-192.png',
    tag:     data.tag   || 'zenot-push',
    vibrate: [200, 100, 200],
    data:    { url: data.url || './' }
  }));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url    = (e.notification.data && e.notification.data.url) || './';
  var action = (e.notification.data && e.notification.data.action) || '';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url.indexOf(url) !== -1 && 'focus' in c) {
          c.focus();
          if (action === 'reload') c.postMessage({ type: 'SW_DO_RELOAD' });
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
