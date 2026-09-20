// ─── ANALISIS.JS — Zenoot Analisis di dalam zenOt ────────────────────────────
// Analisis (analisis.html) dibuka lewat iframe SAMA-ORIGIN di page-analisis. Alasannya: perhitungan Analisis (RKS, Rekap, Check Admin,
// Proyeksi Harga) sudah divalidasi user dan ratusan selector/global-nya bentrok dengan style.css & modul zenOt lain kalau dicampur
// langsung — iframe menjaga angkanya tetap persis sama tanpa risiko itu. Data Analisis disimpan di tabel Supabase `analisis_data`
// (bukan localStorage), dikelola sendiri oleh analisis.html.
//
// File ini cuma: (1) bikin iframe (lazy — baru dimuat pas halaman pertama kali dibuka), (2) menu → pindah halaman di dalam iframe
// lewat postMessage, (3) CSS full-height untuk page-analisis (di-inject dari sini, jadi style.css TIDAK disentuh),
// (4) [20 Sep 2026] menu 3 sub-menu di sidebar (Rasio Keuangan / Proyeksi Harga / Setting Analisis) + TAB BAR gaya Gadag di atas iframe.
//
// analisis.html SENGAJA TIDAK DIUBAH SAMA SEKALI. Tab bar disinkronkan dengan halaman aktif di dalam iframe lewat MutationObserver
// yang membaca DOM iframe (boleh, karena same-origin): tombol nav Analisis yang punya class "active" = halaman yang sedang tampil.
// Jadi kalau halaman berpindah dari DALAM iframe (link ke HPP, resume halaman setelah ganti toko, dll) tab & sidebar ikut nyala benar.
(function () {
  var pageEl = document.getElementById('page-analisis');
  if (!pageEl) return;

  // ── Peta menu: sub-menu sidebar → tab. Kunci halaman = data-page di analisis.html ──
  var GROUPS = {
    rasio:    { btn: 'ni-zan-rasio',    tabs: [['hasil', 'RKS Overview'], ['rekap', 'Rekap'], ['hpp', 'HPP Produk'], ['hasilM', 'RKS Mingguan'], ['rekapM', 'Rekap Mingguan']] },
    proyeksi: { btn: 'ni-zan-proyeksi', tabs: [['checkadmin', 'Check Admin'], ['proyeksi', 'By Operasional'], ['byqty', 'By Target Qty']] },
    setting:  { btn: 'ni-zan-setting',  tabs: [['setting', 'Setting Analisis']] }   // 1 halaman → tanpa tab bar
  };
  var GROUP_ORDER = ['rasio', 'proyeksi', 'setting'];
  var lastTab = { rasio: 'hasil', proyeksi: 'checkadmin', setting: 'setting' };  // tab terakhir per sub-menu
  var curGroup = null;   // sub-menu yang sedang tampil
  var curPage = null;    // halaman Analisis yang sedang tampil (kunci data-page)

  function groupOf(page) {
    for (var i = 0; i < GROUP_ORDER.length; i++) {
      var tabs = GROUPS[GROUP_ORDER[i]].tabs;
      for (var j = 0; j < tabs.length; j++) { if (tabs[j][0] === page) return GROUP_ORDER[i]; }
    }
    return null;
  }

  // ── CSS full-height (pola yang sama dengan halaman full-height lain, tapi self-contained) ──
  var st = document.createElement('style');
  st.id = 'analisis-styles';
  st.textContent =
    '#page-analisis{padding:0;position:relative;}' +
    '#page-analisis.active{display:-webkit-flex !important;display:flex !important;-webkit-flex-direction:column;flex-direction:column;-webkit-flex:1 1 0;flex:1 1 0;min-height:0;}' +
    // visibility (bukan display:none) — iframe display:none gak di-layout di Safari/Firefox, hitungan ukuran di dalam Analisis bisa salah
    '#analisis-frame{-webkit-flex:1 1 0;flex:1 1 0;min-height:0;width:100%;border:0;display:block;background:#F0F0F0;visibility:hidden;}' +
    '#analisis-frame.ready{visibility:visible;}' +
    '#analisis-loading{position:absolute;left:0;top:0;padding:16px;font-size:13px;color:var(--ink3);}' +
    // ── Tab bar (gaya tab Gadag: teks bold, aktif = hijau + garis bawah). Warna dikunci terang biar nyatu sama isi Analisis (#F0F0F0) ──
    '#analisis-tabs{display:none;-webkit-flex:none;flex:none;align-items:flex-end;gap:20px;padding:10px 16px 0;background:#F0F0F0;border-bottom:1px solid #D9D9D9;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;}' +
    '#analisis-tabs::-webkit-scrollbar{display:none;}' +
    '#page-analisis.zan-has-tabs #analisis-tabs{display:flex;}' +
    '#page-analisis.zan-has-tabs #analisis-loading{top:44px;}' +
    '.zan-tab-btn{-webkit-flex:none;flex:none;background:none;border:none;border-bottom:2px solid transparent;padding:4px 1px 8px;font-family:var(--f);font-size:13px;font-weight:700;color:#1B1E24;opacity:.6;cursor:pointer;white-space:nowrap;transition:opacity .15s ease,border-color .15s ease;}' +
    '.zan-tab-btn:hover{opacity:.9;}' +
    '.zan-tab-btn.active{opacity:1;color:#156b3c;border-bottom-color:#156b3c;}';
  document.head.appendChild(st);

  pageEl.innerHTML =
    '<div id="analisis-tabs"></div>' +
    '<div id="analisis-loading">Memuat Zenoot Analisis…</div>' +
    '<iframe id="analisis-frame" title="Zenoot Analisis" allow="clipboard-write"></iframe>';

  var frame = document.getElementById('analisis-frame');
  var loading = document.getElementById('analisis-loading');
  var tabsEl = document.getElementById('analisis-tabs');
  var srcSet = false;
  var ready = false;        // iframe sudah selesai boot (kirim 'analisis:ready')
  var pendingPage = null;   // halaman Analisis yang diminta dari menu zenOt
  var obs = null;           // MutationObserver di nav iframe

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

  // ── Tab bar ──────────────────────────────────────────────────
  function renderTabs(group) {
    var g = GROUPS[group];
    if (!g) return;
    if (g.tabs.length < 2) {            // Setting: cuma 1 halaman → sembunyikan tab bar
      tabsEl.innerHTML = '';
      pageEl.classList.remove('zan-has-tabs');
      return;
    }
    var h = '';
    for (var i = 0; i < g.tabs.length; i++) {
      h += '<button type="button" class="zan-tab-btn" data-zan-page="' + g.tabs[i][0] + '">' + g.tabs[i][1] + '</button>';
    }
    tabsEl.innerHTML = h;
    pageEl.classList.add('zan-has-tabs');
  }

  function markActiveTab(page) {
    var bs = tabsEl.querySelectorAll('.zan-tab-btn');
    var act = null;
    for (var i = 0; i < bs.length; i++) {
      var on = bs[i].getAttribute('data-zan-page') === page;
      if (on) { bs[i].classList.add('active'); act = bs[i]; } else { bs[i].classList.remove('active'); }
    }
    // Tab aktif harus kelihatan di HP (tab bar bisa di-scroll mendatar)
    if (act) {
      var l = act.offsetLeft, r = l + act.offsetWidth;
      if (l < tabsEl.scrollLeft) tabsEl.scrollLeft = Math.max(0, l - 16);
      else if (r > tabsEl.scrollLeft + tabsEl.clientWidth) tabsEl.scrollLeft = r - tabsEl.clientWidth + 16;
    }
  }

  // Tombol sub-menu di sidebar zenOt yang menyala = grup dari halaman aktif
  function highlightSidebar(group) {
    if (document.body.dataset.page !== 'analisis') return;
    for (var i = 0; i < GROUP_ORDER.length; i++) {
      var b = document.getElementById(GROUPS[GROUP_ORDER[i]].btn);
      if (!b) continue;
      if (GROUP_ORDER[i] === group) b.classList.add('active'); else b.classList.remove('active');
    }
  }

  // Satu pintu buat update tampilan (tab + sidebar) ke halaman tertentu
  function setPage(page) {
    var g = groupOf(page);
    if (!g) return;
    if (g !== curGroup) { curGroup = g; renderTabs(g); }
    highlightSidebar(g);
    curPage = page;
    lastTab[g] = page;
    markActiveTab(page);
  }

  tabsEl.addEventListener('click', function (e) {
    var p = e.target && e.target.getAttribute ? e.target.getAttribute('data-zan-page') : null;
    if (!p) return;
    pendingPage = p;
    setPage(p);
    ensureFrame();
    sendGoto();
  });

  // ── Sinkron dari dalam iframe (same-origin): baca tombol nav Analisis yang "active" ──
  function readFramePage() {
    try {
      var d = frame.contentDocument;
      var b = d && d.querySelector('nav.menu button[data-page].active');
      return b ? b.getAttribute('data-page') : null;
    } catch (e) { return null; }
  }
  function syncFromFrame() {
    var p = readFramePage();
    if (p && p !== curPage) setPage(p);
  }
  function watchFrame(syncNow) {
    try {
      if (obs) { obs.disconnect(); obs = null; }
      var d = frame.contentDocument;
      var nav = d && d.querySelector('nav.menu');
      if (!nav || typeof MutationObserver === 'undefined') return;
      obs = new MutationObserver(syncFromFrame);
      obs.observe(nav, { attributes: true, subtree: true, attributeFilter: ['class'] });
      if (syncNow) syncFromFrame();
    } catch (e) {}
  }

  // Iframe ngasih tahu kalau sudah siap (data dari database sudah dimuat & aplikasi Analisis jalan)
  window.addEventListener('message', function (e) {
    if (e.origin !== window.location.origin) return;
    if (!e.data || e.source !== frame.contentWindow) return;
    if (e.data.type === 'analisis:ready') {
      ready = true;
      frame.classList.add('ready');
      if (loading) loading.style.display = 'none';
      var hadPending = !!pendingPage;   // kalau ada perintah tertunda, jangan sync dulu (hindari tab kedip ke halaman default iframe)
      sendGoto();
      watchFrame(!hadPending);
    } else if (e.data.type === 'analisis:unloading') {
      // iframe lagi reload (mis. ganti toko) → tunggu 'analisis:ready' lagi sebelum kirim perintah apa pun
      ready = false;
      if (obs) { obs.disconnect(); obs = null; }
      frame.classList.remove('ready');
      if (loading) loading.style.display = '';
    }
  });

  document.addEventListener('zenot:page', function (e) {
    if (e.detail && e.detail.page === 'analisis') { ensureFrame(); sendGoto(); }
  });

  // Pindah ke halaman Analisis tertentu (kunci data-page) — dipakai internal & dipertahankan buat kompatibilitas
  window.analisisGoto = function (sub, btn) {
    pendingPage = sub;
    if (typeof gotoPage === 'function') gotoPage('analisis', btn);  // → event zenot:page → ensureFrame + sendGoto
    setPage(sub);
  };

  // Dipanggil dari 3 tombol sub-menu sidebar: analisisOpenGroup('rasio'|'proyeksi'|'setting', this)
  // Buka tab terakhir yang dipakai di sub-menu itu (default: tab pertama).
  window.analisisOpenGroup = function (group, btn) {
    if (!GROUPS[group]) return;
    var target = (curGroup === group && curPage) ? curPage : lastTab[group];
    window.analisisGoto(target, btn);
  };
})();
