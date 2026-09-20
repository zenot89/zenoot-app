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
// (5) [21 Sep 2026] MODE HP: di HP (layar sentuh sempit) tampilan dirapikan lewat CSS yang di-inject ke dalam iframe (PHONE_CSS). Semua halaman tetap
// bisa dibuka (daftar di PHONE_PAGES), tapi tombol/panel EKSEKUSI upload (Data Toko, Simpan ke Rekap, Export PDF, Hapus/Edit file, Pilih data di
// Rekap, tambah/ubah/hapus toko) disembunyikan — upload & analisis murni di laptop. RKS Overview & RKS Mingguan = tampilan paling matang;
// Rekap/Rekap Mingguan dipadatkan (kolom Kriteria sticky); HPP/Check Admin/Proyeksi/Setting baru dijaga supaya tidak melebar keluar layar.
// Semua aturan HP hidup di file INI (CSS + filter tab) — laptop tidak tersentuh.
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

  // ── Mode HP ──────────────────────────────────────────────────
  // HP = layar sentuh utama (hover:none + pointer:coarse) & lebar <= 1024px. Laptop (mouse/touchpad, termasuk laptop layar sentuh) &
  // jendela browser laptop yang dikecilkan TIDAK kena, karena pointer utamanya 'fine'.
  var PHONE_MQ = '(hover: none) and (pointer: coarse) and (max-width: 1024px)';
  // Halaman yang boleh tampil di HP. [21 Sep 2026] sempat cuma RKS Overview & RKS Mingguan, lalu semua halaman dikembalikan (permintaan user).
  // Kalau nanti ada halaman yang mau disembunyikan lagi di HP: cukup buang kuncinya dari daftar ini (tab, sidebar, & pengalihan ikut otomatis).
  var PHONE_PAGES = ['hasil', 'rekap', 'hpp', 'hasilM', 'rekapM', 'checkadmin', 'proyeksi', 'byqty', 'setting'];
  var PHONE_HOME = 'hasil';                // halaman tujuan kalau HP kebetulan mendarat di halaman yang tidak diizinkan
  var phoneMq = (window.matchMedia ? window.matchMedia(PHONE_MQ) : null);
  function isPhone() { return !!(phoneMq && phoneMq.matches); }
  function phoneOk(page) { return PHONE_PAGES.indexOf(page) >= 0; }
  function phoneSidebarCss() {
    var hide = [];
    for (var gi = 0; gi < GROUP_ORDER.length; gi++) {
      var gk = GROUP_ORDER[gi], any = false, tb = GROUPS[gk].tabs;
      for (var ti = 0; ti < tb.length; ti++) { if (phoneOk(tb[ti][0])) { any = true; break; } }
      if (!any) hide.push('#' + GROUPS[gk].btn);
    }
    return hide.length ? '@media ' + PHONE_MQ + '{' + hide.join(',') + '{display:none !important;}}' : '';
  }
  function tabsOf(group) {
    var all = GROUPS[group].tabs;
    if (!isPhone()) return all;
    return all.filter(function (t) { return phoneOk(t[0]); });
  }

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
    '.zan-tab-btn.active{opacity:1;color:#156b3c;border-bottom-color:#156b3c;}' +
    // HP: sub-menu yang SEMUA halamannya tidak ada di PHONE_PAGES disembunyikan (sekarang tidak ada). Media query-nya HARUS sama dengan PHONE_MQ.
    phoneSidebarCss();
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

  // ── CSS mode HP (di-inject ke DALAM iframe; semua selector diawali html.zan-phone → tanpa class itu = tidak ada efek sama sekali) ──
  // Yang diatur: (1) tombol/panel eksekusi (upload, simpan, export, hapus, edit, kelola toko) disembunyikan, (2) layout 1 kolom dengan
  // scroll normal (aturan "1 layar penuh" laptop dimatikan), (3) header ringkas: judul kotak disembunyikan (sudah ada di tab), sisa pemilih toko.
  var PHONE_CSS = [
    'html.zan-phone body{display:block;min-height:0;}',
    'html.zan-phone.embed #main{display:block;padding:0 12px 24px;}',
    // header: cuma pemilih toko (judul halaman sudah ada di tab)
    'html.zan-phone.embed #storeTopbar{height:auto;min-height:52px;margin:0 -12px 10px -12px;padding:8px 12px;}',
    'html.zan-phone #storeTopbar .page-title-bar{display:none;}',
    'html.zan-phone #storeTopbar .store-badge{flex:1 1 auto;min-width:0;}',
    'html.zan-phone #storeTopbar .store-badge .store-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    'html.zan-phone #storeTopbar .store-badge .caret{margin-left:auto;}',
    // tombol & panel eksekusi → hilang di HP
    'html.zan-phone #btnToggleDataTokoPanel,html.zan-phone #btnToggleDataTokoPanelM,html.zan-phone #btnSimpanRekap,html.zan-phone #btnSimpanRekapM,',
    'html.zan-phone #btnExportPDF,html.zan-phone #btnExportPDFM{display:none !important;}',
    'html.zan-phone .rks-datatoko-panel,html.zan-phone #tokoSetupCard{display:none !important;}',
    'html.zan-phone #page-hasilM .page-head,html.zan-phone #page-hasil .page-head > .toolbar:first-child{display:none !important;}',
    'html.zan-phone #page-hasil .page-head{margin-bottom:10px;justify-content:flex-start;}',
    'html.zan-phone #page-hasil .page-head .toolbar{margin-bottom:0;}',
    'html.zan-phone #btnHasilMonth{padding:9px 14px;}',
    // pemilih toko (popover): ganti toko boleh, tambah/ubah nama/hapus toko tidak
    'html.zan-phone .toko-pop{width:min(290px,calc(100vw - 16px));}',
    'html.zan-phone .toko-pop .tk-act,html.zan-phone .toko-pop .toko-add,html.zan-phone .toko-pop .toko-sep,html.zan-phone .toko-pop .toko-sep + .toko-item{display:none !important;}',
    // layout: satu kolom, scroll normal
    'html.zan-phone #page-hasil.active,html.zan-phone #page-hasilM.active{display:block;flex:none;min-height:0;}',
    'html.zan-phone #page-hasil .rks-shell,html.zan-phone #page-hasilM .rks-shell{display:block;}',
    'html.zan-phone #hasilWrap,html.zan-phone #hasilWrapM{display:block;height:auto;}',
    'html.zan-phone #hasilWrap .hasil-grid,html.zan-phone #hasilWrapM .hasil-grid{display:block;}',
    'html.zan-phone #hasilWrap .hasil-grid > .card,html.zan-phone #hasilWrapM .hasil-grid > .card{display:block;}',
    'html.zan-phone #hasilWrap .hasil-grid > .card .hrow-list,html.zan-phone #hasilWrapM .hasil-grid > .card .hrow-list{display:block;}',
    'html.zan-phone #page-hasil .card,html.zan-phone #page-hasilM .card{padding:12px;margin-bottom:10px;border-radius:10px;}',
    'html.zan-phone #page-hasil .card h3,html.zan-phone #page-hasilM .card h3{font-size:15px;padding:6px 10px;margin-bottom:8px;}',
    // Overview: Net Income selebar penuh, Laba/Rugi + Rasio Laba berdampingan
    'html.zan-phone #page-hasil .stat-grid,html.zan-phone #page-hasilM .stat-grid{grid-template-columns:1fr 1fr;gap:8px;margin-top:8px !important;}',
    'html.zan-phone #page-hasil .stat-grid .stat-card:first-child,html.zan-phone #page-hasilM .stat-grid .stat-card:first-child{grid-column:1 / -1;}',
    'html.zan-phone #page-hasil .stat-card,html.zan-phone #page-hasilM .stat-card{padding:10px 12px;min-width:0;}',
    'html.zan-phone #page-hasil .stat-card .stat-value,html.zan-phone #page-hasilM .stat-card .stat-value{font-size:16px;overflow-wrap:anywhere;}',
    // baris angka: label kiri, nilai kanan; keterangan rumus disembunyikan (berguna di laptop, bikin daftar 2x lebih panjang di HP)
    'html.zan-phone #page-hasil .hrow,html.zan-phone #page-hasilM .hrow{padding:8px 0;gap:10px;}',
    'html.zan-phone #page-hasil .hrow .lbl,html.zan-phone #page-hasilM .hrow .lbl{font-size:12.5px;flex:1 1 auto;min-width:0;}',
    'html.zan-phone #page-hasil .hrow .lbl .ket,html.zan-phone #page-hasilM .hrow .lbl .ket{display:none;}',
    'html.zan-phone #page-hasil .hrow .val,html.zan-phone #page-hasilM .hrow .val{font-size:14px;}',
    // baris Net Income / Laba-Rugi (nilai + persen): ditumpuk, bukan berdesakan di samping label
    'html.zan-phone #page-hasil .hrow .val[style*="display:flex"],html.zan-phone #page-hasilM .hrow .val[style*="display:flex"]{flex-direction:column;align-items:flex-end;gap:1px !important;}',
    // teks yang menyuruh upload / klik "Data Toko" → ganti dengan penjelasan yang masuk akal di HP
    'html.zan-phone #page-hasil footer.note.status-warn,html.zan-phone #page-hasilM footer.note.status-warn{font-size:0;}',
    'html.zan-phone #page-hasil footer.note.status-warn::after,html.zan-phone #page-hasilM footer.note.status-warn::after{content:"\\26A0  Data Income & Iklan belum lengkap \\2014  lengkapi dari laptop biar rasio kehitung.";display:block;font-size:12px;}',
    'html.zan-phone #hasilWrap .empty-state,html.zan-phone #hasilWrapM .empty-state{font-size:0;padding:36px 16px;}',
    'html.zan-phone #hasilWrap .empty-state::after,html.zan-phone #hasilWrapM .empty-state::after{content:"Belum ada data. Upload data dilakukan dari laptop.";display:block;font-size:13px;}',

    // ══ Halaman lain (dikembalikan ke HP 21 Sep 2026): aturan umum biar tidak melebar keluar layar & tidak kejepit "1 layar penuh" laptop ══
    'html.zan-phone .card{padding:14px 12px;}',
    'html.zan-phone .page-head{flex-wrap:wrap;gap:8px;}',
    'html.zan-phone .stat-grid{grid-template-columns:1fr 1fr !important;gap:8px;}',
    'html.zan-phone .ca-table{display:block;max-width:100%;overflow-x:auto;}',
    // HPP Produk & Check Admin: kolom kiri-kanan ditumpuk (panel input/paste di atas, hasil di bawah)
    'html.zan-phone .hpp-layout{display:flex;flex-direction:column;gap:12px;}',
    'html.zan-phone .hpp-uploads{width:100%;flex:none;order:-1;}',
    'html.zan-phone .hpp-main{width:100%;flex:none;}',
    // Proyeksi Harga: By Operasional & By Target Qty — panel input di bawah hasil, halaman mengalir biasa
    'html.zan-phone #page-proyeksi.active,html.zan-phone #page-byqty.active,html.zan-phone #proyeksiView-input.active,html.zan-phone #byqtyView-input.active{display:block;flex:none;min-height:0;}',
    'html.zan-phone #proyeksiView-input .rks-shell,html.zan-phone #byqtyView-input .rks-shell{display:block;}',
    'html.zan-phone #proyeksiInputPanel,html.zan-phone #byqtyInputPanel{width:100%;flex:none;margin-top:10px;}',
    'html.zan-phone .pricelist-scroll{max-height:none;}',
    'html.zan-phone #proyeksiView-list > div:first-child,html.zan-phone #byqtyView-list > div:first-child{gap:8px;}',
    'html.zan-phone .btn-switch{min-width:0;flex:1 1 0;text-align:center;}',

    // ══ Rekap & Rekap Mingguan: tabel dipadatkan, kolom Kriteria nempel di kiri (sticky), header beku, isi scroll DI DALAM kartu ══
    'html.zan-phone #page-rekap.active,html.zan-phone #page-rekapM.active{display:flex;flex-direction:column;height:calc(100vh - 96px);min-height:0;margin-bottom:0;}',
    'html.zan-phone #page-rekap .page-head,html.zan-phone #page-rekapM .page-head{justify-content:flex-start;margin-bottom:8px;}',
    // "Pilih data" = alur hapus data → eksekusi, cuma di laptop
    'html.zan-phone #btnRekapSelect,html.zan-phone #btnRekapSelectM,html.zan-phone .rekap-selectbar{display:none !important;}',
    'html.zan-phone .rekap-card{padding:2px;}',
    'html.zan-phone :is(#rekapWrap,#rekapWrapM) .rekap-table{font-size:12.5px;}',
    'html.zan-phone :is(#rekapWrap,#rekapWrapM) .rekap-table.rekap-12 th,html.zan-phone :is(#rekapWrap,#rekapWrapM) .rekap-table.rekap-12 td{padding:8px 7px;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-table thead th{font-size:11.5px;letter-spacing:0;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-wk-name{font-size:11.5px;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-wk-range{font-size:10.5px;}',
    // lebar kolom (asli di-set inline dalam em oleh analisis.html → ditimpa pakai !important; cocok lewat nilai em-nya)
    'html.zan-phone .rekap-table.rekap-12 col{width:96px !important;}',
    'html.zan-phone .rekap-table.rekap-12 col[style*="4.2em"]{width:44px !important;}',
    'html.zan-phone .rekap-table.rekap-12 col[style*="7.5em"]{width:72px !important;}',
    'html.zan-phone .rekap-table.rekap-12 col:first-child{width:104px !important;}',
    // kolom Kriteria: nempel kiri saat digeser ke samping, teks boleh 2 baris, tombol mode (bulan / ⇄) disembunyikan
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-table.rekap-12 td.rekap-kriteria,html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-table.rekap-12 th.rekap-kriteria{position:sticky;left:0;min-width:0;padding-left:8px;white-space:normal;line-height:1.2;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-table.rekap-12 td.rekap-kriteria{z-index:2;font-size:11.5px;box-shadow:1px 0 0 var(--line);}',
    'html.zan-phone .rekap-kr-btns{display:none;}',
    // panah naik/turun ditaruh di bawah angka (kalau sebaris, angka kepotong di kolom sempit)
    'html.zan-phone .rekap-trend{display:block;margin-left:0;margin-top:1px;font-size:10px;}'
  ].join('');

  // Pasang mode HP ke iframe: inject <style> (sekali per dokumen iframe) + nyalakan/matikan class html.zan-phone.
  // Dipanggil tiap iframe selesai dimuat (termasuk habis ganti toko = reload) dan tiap kondisi HP/laptop berubah.
  function applyPhoneToFrame() {
    try {
      var d = frame.contentDocument;
      if (!d || !d.documentElement) return;
      if (isPhone()) {
        // style baru di-inject kalau memang HP — di laptop iframe tidak diberi apa-apa
        if (!d.getElementById('zan-phone-css') && (d.head || d.body)) {
          var ps = d.createElement('style');
          ps.id = 'zan-phone-css';
          ps.textContent = PHONE_CSS;
          (d.head || d.documentElement).appendChild(ps);
        }
        d.documentElement.classList.add('zan-phone');
      } else {
        d.documentElement.classList.remove('zan-phone');
      }
    } catch (e) {}
  }
  frame.addEventListener('load', applyPhoneToFrame);

  // Kondisi HP/laptop berubah (mis. tablet diputar): perbarui iframe, tab bar, dan pulangkan ke halaman HP kalau perlu
  function onPhoneChange() {
    applyPhoneToFrame();
    if (curGroup) { renderTabs(curGroup); if (curPage) markActiveTab(curPage); }
    if (isPhone() && curPage && !phoneOk(curPage) && ready) { pendingPage = PHONE_HOME; sendGoto(); }
  }
  if (phoneMq) {
    if (phoneMq.addEventListener) phoneMq.addEventListener('change', onPhoneChange);
    else if (phoneMq.addListener) phoneMq.addListener(onPhoneChange);
  }

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
    var tabs = tabsOf(group);           // di HP cuma tab yang ada di PHONE_PAGES
    if (tabs.length < 2) {              // Setting: cuma 1 halaman → sembunyikan tab bar
      tabsEl.innerHTML = '';
      pageEl.classList.remove('zan-has-tabs');
      return;
    }
    var h = '';
    for (var i = 0; i < tabs.length; i++) {
      h += '<button type="button" class="zan-tab-btn" data-zan-page="' + tabs[i][0] + '">' + tabs[i][1] + '</button>';
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
    if (!p || p === curPage) return;
    if (isPhone() && !phoneOk(p)) {
      // HP mendarat di halaman yang tidak diizinkan (mis. halaman default iframe = Rekap, atau resume setelah ganti toko) → balik ke halaman HP
      pendingPage = (curPage && phoneOk(curPage)) ? curPage : PHONE_HOME;
      sendGoto();
      return;
    }
    setPage(p);
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
      applyPhoneToFrame();
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
    if (isPhone() && !phoneOk(sub)) sub = PHONE_HOME;   // HP: halaman yang belum punya konsep HP dialihkan ke RKS Overview
    pendingPage = sub;
    if (typeof gotoPage === 'function') gotoPage('analisis', btn);  // → event zenot:page → ensureFrame + sendGoto
    setPage(sub);
  };

  // Dipanggil dari 3 tombol sub-menu sidebar: analisisOpenGroup('rasio'|'proyeksi'|'setting', this)
  // Buka tab terakhir yang dipakai di sub-menu itu (default: tab pertama).
  window.analisisOpenGroup = function (group, btn) {
    if (!GROUPS[group]) return;
    if (isPhone() && group !== 'rasio') group = 'rasio';   // HP: cuma sub-menu Rasio Keuangan (RKS Overview & RKS Mingguan)
    var target = (curGroup === group && curPage) ? curPage : lastTab[group];
    window.analisisGoto(target, btn);
  };
})();
