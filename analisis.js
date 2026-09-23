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
// RKS Overview & RKS Mingguan di HP mengikuti pola halaman Hutang: minicard di atas (swipe ke atas = minimize, ke bawah = buka),
// tabel di bawah bisa digeser Ringkasan ↔ Rasio dengan indikator ● ●; semua teks hitam, angka negatif merah.
// Net Income & Laba/Rugi tampil di dua slide: nominal (IDR) di Ringkasan, persen di Rasio.
// Semua aturan HP hidup di file INI (CSS + filter tab) — laptop tidak tersentuh.
//
// (6) [21 Sep 2026] Permintaan "global" (HP + laptop) memaksa analisis.html ikut diubah (hanya bagian ini): RKS Overview default = bulan terakhir di Rekap
// (opsi "Data saat ini" dihapus), RKS Mingguan dapat picker periode + default minggu terakhir di Rekap Mingguan. Di file INI cuma CSS HP-nya:
// popup pilih bulan/minggu di tengah layar, tombol mode Rekap (bulan/minggu + ⇄) tampil lagi, tinggi Rekap sampai ujung bawah, header RKS Mingguan [Periode][Toko][PDF].
//
// (7) [21 Sep 2026] Tombol PDF di HP dipindah dari header ke SEJAJAR KIRI kartu Net Income (ikon saja, kecil), di RKS Overview DAN RKS Mingguan (Overview sebelumnya belum punya).
// Kartu Net Income 1 baris (label kiri, nilai IDR kanan). Header RKS Mingguan jadi [Periode][Toko] saja.
//
// (8) [21 Sep 2026] Tab baru Proyeksi Harga > By Harga Jual (byharga): masuk daftar tab & PHONE_PAGES; layout HP mengikuti By Target Qty (hasil di atas, panel Input di bawah). Tombolnya dibuat lewat JS (ensurePdfBtn) & meneruskan klik ke tombol Export PDF asli di analisis.html; laptop tidak tersentuh.
// (9) [22 Sep 2026] By Harga Jual di HP jadi SWIPE 4 halaman + indikator ●●●● (Input, Perhitungan per pcs, Batas aman + Voucher, Minicard) — semua di byhCss() di bawah; laptop tidak tersentuh.
// (sebelumnya) analisis.html SENGAJA TIDAK DIUBAH SAMA SEKALI. Tab bar disinkronkan dengan halaman aktif di dalam iframe lewat MutationObserver
// yang membaca DOM iframe (boleh, karena same-origin): tombol nav Analisis yang punya class "active" = halaman yang sedang tampil.
// Jadi kalau halaman berpindah dari DALAM iframe (link ke HPP, resume halaman setelah ganti toko, dll) tab & sidebar ikut nyala benar.
(function () {
  var pageEl = document.getElementById('page-analisis');
  if (!pageEl) return;

  // ── Peta menu: sub-menu sidebar → tab. Kunci halaman = data-page di analisis.html ──
  var GROUPS = {
    // [23 Sep 2026] 'rekap'/'rekapM' TETAP terdaftar di sini (supaya groupOf/highlightSidebar tetap kenal halamannya & submenu "Rasio Keuangan"
    // tetap nyala pas Rekap dibuka) tapi diberi flag noTab (elemen ke-3 truthy) → tabsOf() membuangnya dari tab bar. Rekap & Rekap Mingguan sekarang
    // dibuka lewat tombol di dalam RKS Overview/RKS Mingguan (analisis.html), bukan tab lagi — sesuai permintaan user 23 Sep 2026.
    rasio:    { btn: 'ni-zan-rasio',    tabs: [['hasil', 'RKS Overview'], ['rekap', 'Rekap', 1], ['hpp', 'HPP Produk'], ['hasilM', 'RKS Mingguan'], ['rekapM', 'Rekap Mingguan', 1]] },
    tokocompare: { btn: 'ni-zan-tokocompare', tabs: [['tokocompare', 'Perbandingan Toko']] },   // 1 halaman → tanpa tab bar (sama pola kayak 'setting')
    proyeksi: { btn: 'ni-zan-proyeksi', tabs: [['checkadmin', 'Check Admin'], ['proyeksi', 'By Operasional'], ['byqty', 'By Target Qty'], ['byharga', 'By Harga Jual']] },
    setting:  { btn: 'ni-zan-setting',  tabs: [['setting', 'Setting Analisis']] }   // 1 halaman → tanpa tab bar
  };
  var GROUP_ORDER = ['tokocompare', 'rasio', 'proyeksi', 'setting'];
  var lastTab = { tokocompare: 'tokocompare', rasio: 'hasil', proyeksi: 'checkadmin', setting: 'setting' };  // tab terakhir per sub-menu
  var curGroup = null;   // sub-menu yang sedang tampil
  var curPage = null;    // halaman Analisis yang sedang tampil (kunci data-page)

  // ── Mode HP ──────────────────────────────────────────────────
  // HP = layar sentuh utama (hover:none + pointer:coarse) & lebar <= 1024px. Laptop (mouse/touchpad, termasuk laptop layar sentuh) &
  // jendela browser laptop yang dikecilkan TIDAK kena, karena pointer utamanya 'fine'.
  var PHONE_MQ = '(hover: none) and (pointer: coarse) and (max-width: 1024px)';
  // Halaman yang boleh tampil di HP. [21 Sep 2026] sempat cuma RKS Overview & RKS Mingguan, lalu semua halaman dikembalikan (permintaan user).
  // Kalau nanti ada halaman yang mau disembunyikan lagi di HP: cukup buang kuncinya dari daftar ini (tab, sidebar, & pengalihan ikut otomatis).
  var PHONE_PAGES = ['hasil', 'rekap', 'hpp', 'hasilM', 'rekapM', 'checkadmin', 'proyeksi', 'byqty', 'byharga', 'setting', 'tokocompare'];
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
    var all = GROUPS[group].tabs.filter(function (t) { return !t[2]; });   // buang entri noTab (t[2] truthy) — tetap ada di GROUPS buat groupOf, tapi tidak dirender sebagai tab
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
  // penyusun selector: satu aturan → dua halaman (RKS Overview #hasilWrap/#page-hasil  &  RKS Mingguan #hasilWrapM/#page-hasilM)
  function hw(rest, body) { return 'html.zan-phone #hasilWrap' + rest + ',html.zan-phone #hasilWrapM' + rest.replace(/#hasilWrap\b/g, '#hasilWrapM') + '{' + body + '}'; }
  function pg(rest, body) { return 'html.zan-phone #page-hasil' + rest + ',html.zan-phone #page-hasilM' + rest + '{' + body + '}'; }
  // [22 Sep 2026] By Harga Jual di HP: 4 slide yang digeser ke samping — 1 Input, 2 Perhitungan per pcs, 3 Batas aman + Voucher penjual, 4 Minicard (Ringkasan).
  // DOM asli (analisis.html) tetap: #byhargaStats (minicard) | .rks-shell > .rks-main > #byhargaDetail > .byh-cols > .byh-col x2 | #byhargaInputPanel.
  // Pembungkus tengah dileburkan (display:contents) supaya keempat blok jadi anak langsung zona geser, lalu diurutkan pakai `order`. Indikator ●●●● murni CSS:
  // tiap slide punya bar judul sendiri, titik ke-n hitam = slide ini (sama polanya dengan RKS Overview). Slide 4 tidak punya h3 -> bar judulnya dibuat lewat ::before.
  function byhCss() {
    var V = 'html.zan-phone ';
    var S = [V + '#byhargaInputPanel',
             V + '#byhargaView-input .byh-cols > .byh-col:nth-child(1)',
             V + '#byhargaView-input .byh-cols > .byh-col:nth-child(2)',
             V + '#byhargaStats'];
    var T = [V + '#byhargaInputPanel h3',
             S[1] + ' > .card:first-child h3',
             S[2] + ' > .card:first-child h3'];
    function dots(n) {
      var g = [];
      for (var i = 0; i < 4; i++) g.push('radial-gradient(circle,' + (i === n ? '#000' : '#BDBDBD') + ' 3.5px,transparent 4px)');
      return g.join(',');
    }
    var out = [
      // halaman = 1 layar (tinggi = 100vh - topbar 66px), yang bergerak cuma isi slide
      V + '#page-byharga.active{display:flex;flex-direction:column;flex:none;height:calc(100vh - 66px);min-height:0;margin-bottom:0;}',
      'html.zan-phone.embed[data-zan-page="byharga"] #main{padding-bottom:0;}',
      // zona geser
      V + '#byhargaView-input.active{display:flex;flex-direction:row;align-items:stretch;flex:1 1 0;min-height:0;gap:10px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:none;}',
      V + '#byhargaView-input::-webkit-scrollbar{display:none;}',
      V + '#byhargaView-input .rks-shell,' + V + '#byhargaView-input .rks-main,' + V + '#byhargaDetail,' + V + '#byhargaView-input .byh-cols{display:contents;}',
      // tiap slide = selebar layar, isinya scroll ke bawah sendiri
      S.join(',') + '{flex:0 0 100%;width:100%;min-width:0;box-sizing:border-box;margin:0;scroll-snap-align:start;scroll-snap-stop:always;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}',
      S[0] + '{order:1;align-self:stretch;}',
      S[1] + '{order:2;gap:10px;}',
      S[2] + '{order:3;gap:10px;}',
      S[3] + '{order:4;}',
      // bar judul tiap slide + ruang untuk ●●●● di kanan
      T.join(',') + '{position:relative;font-size:15px;padding:6px 76px 6px 10px;margin-bottom:6px;}',
      T.join('::after,') + '::after{content:"";position:absolute;right:12px;top:50%;width:50px;height:8px;margin-top:-4px;background-repeat:no-repeat;background-size:8px 8px;background-position:0 0,14px 0,28px 0,42px 0;}'
    ];
    for (var n = 0; n < 3; n++) out.push(T[n] + '::after{background-image:' + dots(n) + ';}');
    // slide 4 (minicard): bar judul "Ringkasan" lewat ::before, titik digambar sebagai background berlapis di bar itu sendiri
    out.push(S[3] + '::before{content:"Ringkasan";display:block;box-sizing:border-box;margin-bottom:6px;padding:6px 76px 6px 10px;font-size:15px;font-weight:700;letter-spacing:-.2px;color:var(--ink);' +
             'border:1px solid var(--ink);border-radius:4px;background-color:var(--title-bg);background-image:' + dots(3) + ';background-repeat:no-repeat;background-size:8px 8px;' +
             'background-position:right 54px center,right 40px center,right 26px center,right 12px center;}');
    return out.join('');
  }
  var PHONE_CSS = [
    'html.zan-phone body{display:block;min-height:0;}',
    'html.zan-phone.embed #main{display:block;padding:0 12px 24px;}',
    // ══ Header satu baris: [Data saat ini ▾] kiri + pemilih toko kanan (judul halaman sudah ada di tab) ══
    'html.zan-phone.embed #storeTopbar{height:56px;min-height:56px;box-sizing:border-box;margin:0 -12px 10px -12px;padding:8px 12px;}',
    'html.zan-phone #storeTopbar .page-title-bar{display:none;}',
    'html.zan-phone #storeTopbar .store-badge{flex:1 1 auto;min-width:0;height:40px;box-sizing:border-box;color:#000;}',
    'html.zan-phone #storeTopbar .store-badge .store-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#000;}',
    'html.zan-phone #storeTopbar .store-badge .caret{margin-left:auto;color:#000;}',
    // di RKS Overview badge toko bergeser ke kanan, tombol bulan (fixed, di atas topbar) menempati sisi kiri baris yang sama
    'html.zan-phone[data-zan-page="hasil"] #storeTopbar .store-badge{margin-left:calc(38vw + 8px);}',
    'html.zan-phone #btnHasilMonth{position:fixed;top:8px;left:12px;width:38vw;height:40px;box-sizing:border-box;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:0 10px;color:#000;font-size:13.5px;font-weight:700;}',
    'html.zan-phone #btnHasilMonth:not(.active){background:var(--title-bg);border:1px solid var(--ink);border-radius:4px;}',
    'html.zan-phone #btnHasilMonth *{color:#000;}',
    // tombol & panel eksekusi → hilang di HP
    'html.zan-phone #btnToggleDataTokoPanel,html.zan-phone #btnToggleDataTokoPanelM,html.zan-phone #btnSimpanRekap,html.zan-phone #btnSimpanRekapM,',
    // [21 Sep 2026] tombol PDF header (Overview & Mingguan) disembunyikan di HP; diganti tombol ikon .zan-pdf-btn sejajar kartu Net Income (lihat ensurePdfBtn)
    'html.zan-phone #btnExportPDF,html.zan-phone #btnExportPDFM{display:none !important;}',
    'html.zan-phone .rks-datatoko-panel,html.zan-phone #tokoSetupCard{display:none !important;}',
    'html.zan-phone #page-hasilM .page-head > .toolbar:first-child,html.zan-phone #page-hasil .page-head > .toolbar:first-child{display:none !important;}',
    'html.zan-phone #page-hasil .page-head,html.zan-phone #page-hasilM .page-head{margin:0;padding:0;height:0;min-height:0;}',
    'html.zan-phone #page-hasil .page-head .toolbar,html.zan-phone #page-hasilM .page-head .toolbar{margin:0;}',
    // [21 Sep 2026] RKS Mingguan di HP: satu baris header [Periode ▾] kiri + [Toko ▾] tengah + [PDF] kanan (tombol periode & PDF melayang di atas topbar, sama polanya dengan tombol bulan RKS Overview)
    'html.zan-phone #btnHasilPeriodM{position:fixed;top:8px;left:12px;width:36vw;height:40px;box-sizing:border-box;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:0 10px;color:#000;font-size:13.5px;font-weight:700;white-space:nowrap;}',
    'html.zan-phone #btnHasilPeriodM:not(.active){background:var(--title-bg);border:1px solid var(--ink);border-radius:4px;}',
    'html.zan-phone #btnHasilPeriodM *{color:#000;}',
    'html.zan-phone #btnHasilPeriodM #hasilPeriodLabelM{min-width:0;overflow:hidden;text-overflow:ellipsis;}',
    'html.zan-phone #btnHasilPeriodM .hp-full{display:none;}',
    'html.zan-phone #btnHasilPeriodM .hp-short{display:inline;}',
    // [21 Sep 2026] DINONAKTIFKAN (tombol PDF Mingguan pindah ke sejajar kartu Net Income). Rule lama dipertahankan di sini biar gampang balik:
    //   #btnExportPDFM{position:fixed;top:8px;right:12px;width:48px;height:40px;...;font-size:0;} + #btnExportPDFM::after{content:"PDF";...}
    // [21 Sep 2026] margin-right badge toko 56px -> 0 (tombol PDF sudah tidak ada di header)
    'html.zan-phone[data-zan-page="hasilM"] #storeTopbar .store-badge{margin-left:calc(36vw + 8px);margin-right:0;}',
    // pemilih toko (popover): ganti toko boleh, tambah/ubah nama/hapus toko tidak
    'html.zan-phone .toko-pop{width:min(290px,calc(100vw - 16px));}',
    // [21 Sep 2026] popup pilih bulan/minggu: posisinya dari JS = nempel ke tombol (miring ke kiri di HP) → di HP dipaksa tepat di tengah layar
    'html.zan-phone .mp-pop{left:50% !important;right:auto !important;transform:translateX(-50%);width:min(300px,calc(100vw - 24px));max-height:calc(100vh - 90px);overflow-y:auto;}',
    'html.zan-phone .toko-pop .tk-act,html.zan-phone .toko-pop .toko-add,html.zan-phone .toko-pop .toko-sep,html.zan-phone .toko-pop .toko-sep + .toko-item{display:none !important;}',

    // ══ RKS Overview & RKS Mingguan — pola halaman Hutang: minicard di atas (bisa di-minimize), tabel di bawah bisa digeser ● ● ══
    // rantai tinggi: halaman = 1 layar (tanpa scroll halaman); yang scroll cuma isi tabel
    pg('.active', 'display:flex;flex-direction:column;flex:none;height:calc(100vh - 66px);min-height:0;margin-bottom:0;'),
    // kotak Ringkasan/Rasio habis sampai ujung bawah layar (tanpa jarak menggantung): padding bawah #main dibuang di dua halaman ini
    'html.zan-phone.embed[data-zan-page="hasil"] #main,html.zan-phone.embed[data-zan-page="hasilM"] #main{padding-bottom:0;}',
    pg(' .rks-shell', 'display:flex;flex:1 1 auto;min-height:0;gap:0;'),
    hw('', 'display:flex;flex-direction:column;flex:1 1 auto;height:100%;min-width:0;min-height:0;'),
    // minicard: tanpa kotak pembungkus "Overview"; 2 kolom; Net Income lebar penuh; Rasio Laba kiri, Laba/Rugi kanan
    hw(' > .card:first-child', 'flex:0 0 auto;background:transparent;border:0;box-shadow:none;padding:0;margin:0 0 8px 0;overflow:hidden;max-height:300px;opacity:1;transition:max-height .28s cubic-bezier(.4,0,.2,1),opacity .22s ease,margin .28s ease;'),
    hw('.zan-mini > .card:first-child', 'max-height:0 !important;opacity:0;margin-bottom:0 !important;pointer-events:none;'),
    hw(' > .card:first-child h3', 'display:none;'),
    hw(' > .card:first-child > div:first-child', 'margin:0 !important;padding:0 2px;gap:0 10px !important;'),
    hw(' > .card:first-child > div:first-child > *', 'margin-bottom:6px;'),
    hw(' .stat-grid', 'grid-template-columns:1fr 1fr !important;gap:8px !important;margin:0 !important;'),
    hw(' .stat-card:nth-child(1)', 'grid-column:1 / -1;'),
    hw(' .stat-card:nth-child(3)', 'order:1;'),
    hw(' .stat-card:nth-child(2)', 'order:2;'),
    hw(' .stat-card', 'padding:8px 12px;min-width:0;border-radius:10px;'),
    hw(' .stat-card .stat-label', 'font-size:11px;margin-bottom:3px;'),
    hw(' .stat-card .stat-value', 'font-size:17px;line-height:1.15;overflow-wrap:anywhere;'),
    // [21 Sep 2026] Tombol PDF (ikon saja) sejajar di KIRI kartu Net Income, RKS Overview & RKS Mingguan. Tombolnya dibuat ensurePdfBtn() (JS) & ditaruh di dalam .stat-grid;
    // kartu Net Income digeser 52px ke kanan (margin-left) dan tombol menempati ruang kosong itu di baris yang sama (tinggi otomatis ikut kartu Net Income).
    // Rule dasar TANPA prefix html.zan-phone = tersembunyi, supaya kalau layar berubah HP -> laptop (mis. tablet diputar) tombolnya tidak nongol di laptop.
    '.zan-pdf-btn{display:none;}',
    hw(' .stat-grid.zan-has-pdf .stat-card:nth-child(1)', 'grid-column:1 / -1;grid-row:1;margin-left:52px;'),
    hw(' .zan-pdf-btn', 'display:flex;align-items:center;justify-content:center;grid-column:1;grid-row:1;justify-self:start;align-self:stretch;width:44px;min-height:44px;box-sizing:border-box;padding:0;margin:0;background:var(--panel,#fff);border:1px solid var(--line,#D9D9D9);border-radius:10px;box-shadow:var(--shadow);cursor:pointer;-webkit-tap-highlight-color:transparent;'),
    hw(' .zan-pdf-btn:active', 'background:var(--title-bg,#E4E4E4);'),
    hw(' .zan-pdf-btn svg', 'width:26px;height:30px;display:block;pointer-events:none;'),
    // [21 Sep 2026] Kartu Net Income jadi 1 baris: label kiri, nilai IDR kanan (sebelumnya label di atas, nilai di bawah). Kartu Rasio Laba & Laba/Rugi tetap 2 baris.
    hw(' .stat-card:nth-child(1)', 'display:flex;align-items:center;justify-content:space-between;gap:10px;'),
    hw(' .stat-card:nth-child(1) .stat-label', 'margin:0;white-space:nowrap;'),
    hw(' .stat-card:nth-child(1) .stat-value', 'white-space:nowrap;text-align:right;'),
    // tabel: zona geser horizontal (Ringkasan ↔ Rasio), tiap slide = 1 kartu selebar layar
    hw(' .hasil-grid', 'display:flex;flex-direction:row;align-items:stretch;flex:1 1 0;min-height:0;gap:10px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:none;'),
    hw(' .hasil-grid::-webkit-scrollbar', 'display:none;'),
    hw(' .hasil-grid > .card', 'flex:0 0 100%;min-width:0;box-sizing:border-box;scroll-snap-align:start;scroll-snap-stop:always;display:flex;flex-direction:column;min-height:0;margin:0 !important;padding:12px;'),
    hw(' .hasil-grid > .card h3', 'flex:0 0 auto;position:relative;font-size:15px;padding:6px 64px 6px 10px;margin-bottom:6px;'),
    // indikator ● ● di kanan judul (slide ini = titik hitam, slide lain = abu-abu) — murni CSS
    hw(' .hasil-grid > .card h3::after', 'content:"";position:absolute;right:12px;top:50%;width:22px;height:8px;margin-top:-4px;background-repeat:no-repeat;background-size:8px 8px;'),
    hw(' .hasil-grid > .card:nth-child(1) h3::after', 'background-image:radial-gradient(circle,#000 3.5px,transparent 4px),radial-gradient(circle,#BDBDBD 3.5px,transparent 4px);background-position:0 0,14px 0;'),
    hw(' .hasil-grid > .card:nth-child(2) h3::after', 'background-image:radial-gradient(circle,#BDBDBD 3.5px,transparent 4px),radial-gradient(circle,#000 3.5px,transparent 4px);background-position:0 0,14px 0;'),
    // baris angka: label kiri, nilai kanan; hanya baris yang scroll di dalam kartu; keterangan rumus disembunyikan
    hw(' .hasil-grid > .card .hrow-list', 'flex:1 1 0;min-height:0;overflow-y:auto;display:block;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;'),
    hw(' .hrow', 'padding:9px 0;gap:10px;'),
    hw(' .hrow .lbl', 'font-size:13px;flex:1 1 auto;min-width:0;'),
    hw(' .hrow .lbl .ket', 'display:none;'),
    hw(' .hrow .val', 'font-size:14.5px;'),
    // baris Net Income / Laba-Rugi (nilai + persen): ditumpuk, bukan berdesakan di samping label
    hw(' .hrow .val[style*="display:flex"]', 'flex-direction:column;align-items:flex-end;gap:1px !important;'),
    // NET INCOME & LABA/RUGI ada di dua slide: Ringkasan = nominal (IDR), Rasio = persen (baris salinan diberi class .zan-dup oleh dupRows())
    hw(' .hasil-grid > .card:nth-child(1) .zan-dup .val > span:nth-child(2)', 'display:none;'),
    hw(' .hasil-grid > .card:nth-child(2) .hrow .val[style*="display:flex"] > span:nth-child(1)', 'display:none;'),
    hw(' .hasil-grid > .card:nth-child(2) .hrow .val[style*="display:flex"] > span:nth-child(2)', 'font-size:inherit !important;'),
    // WARNA: semua teks hitam; hanya angka negatif yang merah (class .zan-neg dipasang otomatis oleh markNeg())
    hw(' .stat-label,html.zan-phone #hasilWrap .stat-value,html.zan-phone #hasilWrap .hrow .lbl,html.zan-phone #hasilWrap .hrow .val,html.zan-phone #hasilWrap .hrow .val *,html.zan-phone #hasilWrap h3,html.zan-phone #hasilWrap .hasil-src-badge', 'color:#000 !important;'),
    hw(' > .card:first-child > div:first-child > span:not([style*="var(--bad)"])', 'color:#000 !important;'),
    hw(' .zan-neg.zan-neg.zan-neg', 'color:var(--bad) !important;'),
    // teks yang menyuruh upload / klik "Data Toko" → ganti dengan penjelasan yang masuk akal di HP
    'html.zan-phone #page-hasil footer.note.status-warn,html.zan-phone #page-hasilM footer.note.status-warn{font-size:0;}',
    'html.zan-phone #page-hasil footer.note.status-warn::after,html.zan-phone #page-hasilM footer.note.status-warn::after{content:"\\26A0  Data Income & Iklan belum lengkap \\2014  lengkapi dari laptop biar rasio kehitung.";display:block;font-size:12px;}',
    'html.zan-phone #hasilWrap .empty-state,html.zan-phone #hasilWrapM .empty-state{font-size:0;padding:36px 16px;}',
    'html.zan-phone #hasilWrap .empty-state::after,html.zan-phone #hasilWrapM .empty-state::after{content:"Belum ada data. Upload data dilakukan dari laptop.";display:block;font-size:13px;}',

    // ══ Teks yang menunjuk tombol/kolom khusus laptop → diganti kalimat yang masuk akal di HP (teks aslinya disembunyikan lewat font-size:0) ══
    // [23 Sep 2026] DEAD CODE: <p> penjelasan HPP Produk di analisis.html sudah diganti jadi ikon (?) info-tip (sebelah tombol "Belum Diisi"),
    // jadi selector di bawah ini sekarang tidak match apapun (aman, tidak berefek). Dipertahankan apa adanya — minim blast radius.
    'html.zan-phone #page-hpp .page-head p{font-size:0;}',
    'html.zan-phone #page-hpp .page-head p::after{content:"HPP dibaca langsung dari Kelola Produk zenOt (SKU Variasi = Nomor Referensi SKU) \\2014  tidak bisa diubah di sini. Ubah atau tambah HPP di Kelola Produk, lalu klik \u201CMuat ulang HPP\u201D. Upload data dilakukan dari laptop.";display:block;font-size:13px;line-height:1.5;}',
    // [23 Sep 2026] HPP Produk di HP: tabel dipadatkan jadi 3 kolom (SKU Induk, Nama Variasi, HPP) — Nama Produk & Nomor Referensi SKU
    // disembunyikan (kepanjangan buat layar sempit, isinya juga sudah terwakili SKU Induk+Variasi). Kelasnya ditambahkan di renderHPP() (analisis.html).
    'html.zan-phone #page-hpp .hpp-col-namaproduk,html.zan-phone #page-hpp .hpp-col-nomorref{display:none;}',
    'html.zan-phone #page-hpp .empty-state{font-size:0;}',
    'html.zan-phone #page-hpp .empty-state::after{content:"Belum ada data. Upload data dilakukan dari laptop.";display:block;font-size:13px;}',
    'html.zan-phone #page-checkadmin td[colspan="7"]{font-size:0;}',
    'html.zan-phone #page-checkadmin td[colspan="7"]::after{content:"Belum ada data \\2014  paste di kotak atas, lalu klik Parse & Hitung.";display:block;font-size:13px;}',
    'html.zan-phone .rekap-empty-note{font-size:0;}',
    'html.zan-phone .rekap-empty-note::after{content:"Belum ada data tersimpan di sini. Simpan ke Rekap dilakukan dari laptop.";display:block;font-size:12.5px;}',

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
    // [21 Sep 2026] By Harga Jual: sama seperti By Target Qty — hasil di atas, panel Input di bawah, satu kolom
    // [22 Sep 2026] By Harga Jual di HP = SWIPE 4 halaman dengan indikator ●●●● (lihat byhCss). Rule lama (satu kolom, panel Input di bawah hasil) dipertahankan di sini biar gampang balik:
    //   html.zan-phone #byhargaView-input .rks-shell{display:block;} | html.zan-phone #byhargaInputPanel{width:100%;flex:none;margin-top:10px;} | html.zan-phone .byh-cols{grid-template-columns:1fr;gap:10px;} | html.zan-phone .byh-col{gap:10px;}
    byhCss(),
    'html.zan-phone .pricelist-scroll{max-height:none;}',
    'html.zan-phone #proyeksiView-list > div:first-child,html.zan-phone #byqtyView-list > div:first-child{gap:8px;}',
    'html.zan-phone .btn-switch{min-width:0;flex:1 1 0;text-align:center;}',

    // ══ Rekap & Rekap Mingguan: tabel dipadatkan, kolom Kriteria nempel di kiri (sticky), header beku, isi scroll DI DALAM kartu ══
    // [21 Sep 2026] tinggi halaman = 100vh - topbar (66px), sama seperti RKS Overview; padding bawah #main dibuang → kartu tabel habis sampai ujung bawah layar
    'html.zan-phone #page-rekap.active,html.zan-phone #page-rekapM.active{display:flex;flex-direction:column;flex:none;height:calc(100vh - 66px);min-height:0;margin-bottom:0;}',
    'html.zan-phone.embed[data-zan-page="rekap"] #main,html.zan-phone.embed[data-zan-page="rekapM"] #main{padding-bottom:0;}',
    'html.zan-phone #page-rekap .page-head,html.zan-phone #page-rekapM .page-head{justify-content:flex-start;margin-bottom:8px;}',
    // "Pilih data" = alur hapus data → eksekusi, cuma di laptop
    'html.zan-phone #btnRekapSelect,html.zan-phone #btnRekapSelectM,html.zan-phone .rekap-selectbar{display:none !important;}',
    'html.zan-phone .rekap-card{padding:2px;}',
    'html.zan-phone :is(#rekapWrap,#rekapWrapM) > .rekap-card{margin-bottom:0;}',
    'html.zan-phone :is(#rekapWrap,#rekapWrapM) .rekap-table{font-size:13px;}',
    'html.zan-phone :is(#rekapWrap,#rekapWrapM) .rekap-table.rekap-12 th,html.zan-phone :is(#rekapWrap,#rekapWrapM) .rekap-table.rekap-12 td{padding:8px 7px;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-table thead th{font-size:12px;letter-spacing:0;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-wk-name{font-size:12px;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-wk-range{font-size:11px;}',
    // lebar kolom (asli di-set inline dalam em oleh analisis.html → ditimpa pakai !important; cocok lewat nilai em-nya)
    'html.zan-phone .rekap-table.rekap-12 col{width:108px !important;}',
    'html.zan-phone .rekap-table.rekap-12 col[style*="4.2em"]{width:44px !important;}',
    'html.zan-phone .rekap-table.rekap-12 col[style*="7.5em"]{width:72px !important;}',
    'html.zan-phone .rekap-table.rekap-12 col:first-child{width:108px !important;}',
    // kolom Kriteria: nempel kiri saat digeser ke samping, teks boleh 2 baris, tombol mode (bulan / ⇄) disembunyikan
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-table.rekap-12 td.rekap-kriteria,html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-table.rekap-12 th.rekap-kriteria{position:sticky;left:0;min-width:0;padding-left:8px;white-space:normal;line-height:1.2;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-table.rekap-12 td.rekap-kriteria{z-index:2;font-size:12px;box-shadow:1px 0 0 var(--line);}',
    // [21 Sep 2026] tombol mode di header Kriteria DIMUNCULKAN LAGI di HP: [bulan/minggu ▾] = pilih patokan, [⇄] = ganti tampilan (Anual/Average/Sum ↔ 3 bulan terakhir; Rekap bulanan ada siklus ke-3 Full Jan–Des)
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-kr-wrap{flex-direction:column;align-items:flex-start;gap:4px;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-kr-btns{display:inline-flex;gap:4px;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-month-btn{font-size:11.5px;line-height:18px;padding:0 5px;gap:3px;}',
    'html.zan-phone :is(#page-rekap,#page-rekapM) .rekap-swap-btn{font-size:13px;line-height:18px;padding:0 6px;}',
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
        stampFramePage(curPage || pendingPage);
        initPhoneBehaviors(d);
      } else {
        d.documentElement.classList.remove('zan-phone');
        d.documentElement.removeAttribute('data-zan-page');
      }
    } catch (e) {}
  }

  // Tandai halaman aktif di <html> iframe (dipakai CSS HP: mis. geser badge toko cuma di RKS Overview)
  function stampFramePage(page) {
    try {
      var d = frame.contentDocument;
      if (!d || !d.documentElement) return;
      if (isPhone() && page) d.documentElement.setAttribute('data-zan-page', page);
      else d.documentElement.removeAttribute('data-zan-page');
    } catch (e) {}
  }

  // ── Perilaku HP di dalam iframe (sekali per dokumen iframe) ──
  // (a) angka negatif → class .zan-neg (CSS bikin merah; sisanya hitam) — dipasang ulang tiap halaman di-render ulang
  // (b) swipe vertikal di zona RKS Overview/Mingguan: geser ke ATAS = minimize minicard, geser ke BAWAH = buka lagi (sama seperti halaman Hutang)
  var NEG_RE = /^\s*(\(|[-\u2212\u2013]\s*\d)/;   // "(Rp1.000)" atau "-29.8%"
  function markNeg(root) {
    var els = root.querySelectorAll('.stat-value, .hrow .val, .hrow .val > *');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.toggle('zan-neg', NEG_RE.test(els[i].textContent || ''));
    }
  }
  // Salin baris NET INCOME & LABA/RUGI (yang di kartu Rasio berisi nominal + persen) ke kartu Ringkasan; CSS lalu menampilkan
  // nominalnya di Ringkasan dan persennya di Rasio. Aman dipanggil berulang: kalau salinan sudah ada, tidak berbuat apa-apa.
  function dupRows(wrap) {
    var grid = wrap.querySelector('.hasil-grid');
    if (!grid || grid.children.length < 2) return;
    var listA = grid.children[0].querySelector('.hrow-list'), listB = grid.children[1].querySelector('.hrow-list');
    if (!listA || !listB || listA.querySelector('.zan-dup')) return;
    var rows = listB.querySelectorAll('.hrow');
    for (var i = 0; i < rows.length; i++) {
      if (!rows[i].querySelector('.val[style*="display:flex"]')) continue;
      var c = rows[i].cloneNode(true);
      c.classList.add('zan-dup');
      listA.appendChild(c);
    }
  }
  // [21 Sep 2026] Tombol PDF (ikon saja) di HP, sejajar kiri kartu Net Income — RKS Overview & RKS Mingguan. Dibuat sekali per render (wrap di-render ulang lewat innerHTML
  // oleh analisis.html, jadi dipasang ulang dari MutationObserver; aman dipanggil berulang). Klik = meneruskan klik ke tombol Export PDF asli (yang disembunyikan di header),
  // jadi logika export/PDF-nya tetap satu sumber di analisis.html (rksExport). Posisi & ukuran diatur CSS (.zan-pdf-btn) di PHONE_CSS.
  var PDF_ICON = '<svg viewBox="0 0 32 38" aria-hidden="true" focusable="false">' +
    '<path d="M6 2h14l7 7v25a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#fff" stroke="#E5645A" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M20 2v7h7" fill="none" stroke="#E5645A" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<rect x="1" y="8" width="16" height="8" rx="1.5" fill="#fff" stroke="#E5645A" stroke-width="1.3"/>' +
    '<text x="9" y="14.2" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="6" font-weight="700" fill="#E5645A">PDF</text>' +
    '<circle cx="15.5" cy="27" r="6" fill="#E5645A"/>' +
    '<path d="M15.5 23.6v6M12.9 27.3l2.6 2.7 2.6-2.7" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  function ensurePdfBtn(wrap) {
    var grid = wrap.querySelector('.stat-grid');
    if (!grid || grid.querySelector('.zan-pdf-btn')) return;
    var d = wrap.ownerDocument;
    var b = d.createElement('button');
    b.type = 'button';
    b.className = 'zan-pdf-btn';
    b.setAttribute('aria-label', 'Export PDF');
    b.title = 'Export PDF';
    b.innerHTML = PDF_ICON;
    b.addEventListener('click', function () {
      var src = d.getElementById(wrap.id === 'hasilWrapM' ? 'btnExportPDFM' : 'btnExportPDF');
      if (src) src.click();
    });
    grid.appendChild(b);           // terakhir → urutan nth-child kartu (Net Income, Laba/Rugi, Rasio Laba) tidak bergeser
    grid.classList.add('zan-has-pdf');
  }
  function initPhoneBehaviors(d) {
    if (d.__zanPhoneInit) return;
    d.__zanPhoneInit = true;
    var win = d.defaultView;
    ['hasilWrap', 'hasilWrapM'].forEach(function (id) {
      var el = d.getElementById(id);
      if (!el) return;
      var run = function () { dupRows(el); ensurePdfBtn(el); markNeg(el); };
      new win.MutationObserver(run).observe(el, { childList: true, subtree: true, characterData: true });
      run();
    });
    var ZONE = '#hasilWrap .hasil-grid, #hasilWrap > .card:first-child, #hasilWrapM .hasil-grid, #hasilWrapM > .card:first-child';
    var sx = 0, sy = 0, track = false, wrapEl = null;
    d.addEventListener('touchstart', function (e) {
      var t = e.target;
      if (!t || !t.closest || t.closest('button, input, select, a') || !t.closest(ZONE)) { track = false; return; }
      wrapEl = t.closest('#hasilWrap, #hasilWrapM');
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; track = true;
    }, { passive: true });
    d.addEventListener('touchend', function (e) {
      if (!track) return;
      track = false;
      if (!isPhone() || !wrapEl) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > Math.abs(dy) || Math.abs(dy) < 50) return;   // horizontal = ganti slide (native), gerakan pendek = abaikan
      wrapEl.classList.toggle('zan-mini', dy < 0);                      // ke atas = minimize, ke bawah = buka
    }, { passive: true });
    d.addEventListener('touchcancel', function () { track = false; }, { passive: true });
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
    stampFramePage(page);
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
    if (isPhone() && !tabsOf(group).length) group = 'rasio';   // HP: grup yang SEMUA halamannya tidak ada di PHONE_PAGES dialihkan ke Rasio Keuangan
    var target = (curGroup === group && curPage) ? curPage : lastTab[group];
    window.analisisGoto(target, btn);
  };
})();
