// ─── ANALISIS.JS — Zenoot Analisis di dalam zenOt ────────────────────────────
// Analisis (analisis.html) dibuka lewat iframe SAMA-ORIGIN di page-analisis. Alasannya: perhitungan Analisis (RKS, Rekap, Check Admin,
// Proyeksi Harga) sudah divalidasi user dan ratusan selector/global-nya bentrok dengan style.css & modul zenOt lain kalau dicampur
// langsung — iframe menjaga angkanya tetap persis sama tanpa risiko itu. Data Analisis disimpan di tabel Supabase `analisis_data`
// (bukan localStorage), dikelola sendiri oleh analisis.html.
//
// File ini cuma: (1) bikin iframe (lazy — baru dimuat pas halaman pertama kali dibuka), (2) tombol sidebar → pindah halaman di dalam iframe
// lewat postMessage, (3) CSS full-height untuk page-analisis (di-inject dari sini, jadi style.css TIDAK disentuh).
(function () {
  var pageEl = document.getElementById('page-analisis');
  if (!pageEl) return;

  // ── CSS full-height (pola yang sama dengan halaman full-height lain, tapi self-contained) ──
  var st = document.createElement('style');
  st.id = 'analisis-styles';
  st.textContent =
    '#page-analisis{padding:0;position:relative;}' +
    '#page-analisis.active{display:-webkit-flex !important;display:flex !important;-webkit-flex-direction:column;flex-direction:column;-webkit-flex:1 1 0;flex:1 1 0;min-height:0;}' +
    // visibility (bukan display:none) — iframe display:none gak di-layout di Safari/Firefox, hitungan ukuran di dalam Analisis bisa salah
    '#analisis-frame{-webkit-flex:1 1 0;flex:1 1 0;min-height:0;width:100%;border:0;display:block;background:#F0F0F0;visibility:hidden;}' +
    '#analisis-frame.ready{visibility:visible;}' +
    '#analisis-loading{position:absolute;left:0;top:0;padding:16px;font-size:13px;color:var(--ink3);}';
  document.head.appendChild(st);

  pageEl.innerHTML =
    '<div id="analisis-loading">Memuat Zenoot Analisis…</div>' +
    '<iframe id="analisis-frame" title="Zenoot Analisis" allow="clipboard-write"></iframe>';

  var frame = document.getElementById('analisis-frame');
  var loading = document.getElementById('analisis-loading');
  var srcSet = false;
  var ready = false;        // iframe sudah selesai boot (kirim 'analisis:ready')
  var pendingPage = null;   // halaman Analisis yang diminta dari sidebar zenOt

  function ensureFrame() {
    if (srcSet) return;
    srcSet = true;
    // ?v=APP_BUILD supaya versi baru analisis.html ikut ke-refresh tiap deploy
    frame.src = 'analisis.html?embed=1&v=' + encodeURIComponent(window.APP_BUILD || '0');
  }

  function sendGoto() {
    if (!ready || !pendingPage || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({ type: 'analisis:goto', page: pendingPage }, window.location.origin);
    } catch (e) {}
    pendingPage = null;
  }

  // Iframe ngasih tahu kalau sudah siap (data dari database sudah dimuat & aplikasi Analisis jalan)
  window.addEventListener('message', function (e) {
    if (e.origin !== window.location.origin) return;
    if (!e.data || e.source !== frame.contentWindow) return;
    if (e.data.type === 'analisis:ready') {
      ready = true;
      frame.classList.add('ready');
      if (loading) loading.style.display = 'none';
      sendGoto();
    } else if (e.data.type === 'analisis:unloading') {
      // iframe lagi reload (mis. ganti toko) → tunggu 'analisis:ready' lagi sebelum kirim perintah apa pun
      ready = false;
      frame.classList.remove('ready');
      if (loading) loading.style.display = '';
    }
  });

  document.addEventListener('zenot:page', function (e) {
    if (e.detail && e.detail.page === 'analisis') { ensureFrame(); sendGoto(); }
  });

  // Dipanggil dari tombol sidebar grup "Zenoot Analisis": analisisGoto('hasil', this)
  window.analisisGoto = function (sub, btn) {
    pendingPage = sub;
    if (typeof gotoPage === 'function') gotoPage('analisis', btn);  // → event zenot:page → ensureFrame + sendGoto
  };
})();
