// ─── KEUANGAN.JS — Hutang, Neraca, Rasio, Net Worth, Valuasi ─

let _keuHutangAll = [];
let _keuKasAkun   = [];
let _keuKasJurnal = [];

document.getElementById('page-keuangan').innerHTML = `
<style>
  /* ── SCOPED ke #page-keuangan — tidak bocor ke halaman lain ── */
  #page-keuangan .keu-tabs { display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
  #page-keuangan .keu-tab  { padding:6px 14px; border:2px solid var(--ink); background:var(--cream); font-family:var(--f); font-size:13px; font-weight:700; cursor:pointer; border-radius:2px; color:var(--ink); }
  #page-keuangan .keu-tab.active { background:var(--ink); color:var(--cream); }
  #page-keuangan .keu-panel { display:none; }

  /* ── Dropdown tab modern ── */
  #keu-tab-dropdown-wrap { position:relative; display:inline-block; }
  #keu-tab-trigger {
    display:flex; align-items:center; gap:7px;
    padding:7px 14px; border-radius:20px;
    background:var(--cream); color:var(--ink);
    font-family:var(--f); font-size:13px; font-weight:700;
    border:none; cursor:pointer; transition:opacity .15s;
  }
  #keu-tab-trigger i.arr { font-size:12px; transition:transform .2s; margin-left:2px; }
  #keu-tab-trigger.open i.arr { transform:rotate(180deg); }
  #keu-tab-dropdown {
    position:absolute; top:calc(100% + 6px); left:0;
    background:var(--cream2); border:1px solid var(--ink3);
    border-radius:14px; min-width:210px; padding:6px;
    z-index:999; display:none;
    box-shadow:0 8px 28px rgba(0,0,0,.22), 0 2px 6px rgba(0,0,0,.1);
  }
  #keu-tab-dropdown.open { display:block; }
  #keu-tab-dropdown .dd-section {
    font-size:10px; font-weight:700; color:var(--ink3);
    text-transform:uppercase; letter-spacing:.07em;
    padding:5px 10px 3px;
  }
  #keu-tab-dropdown .dd-item {
    display:flex; align-items:center; gap:10px;
    padding:9px 12px; border-radius:10px;
    font-size:13px; font-weight:500; color:var(--ink2);
    cursor:pointer; transition:background .1s; border:none;
    background:none; width:100%; text-align:left; font-family:var(--f);
  }
  #keu-tab-dropdown .dd-item:hover { background:var(--cream); color:var(--ink); }
  #keu-tab-dropdown .dd-item.active { background:var(--ink); color:var(--cream); }
  #keu-tab-dropdown .dd-item i { font-size:16px; width:18px; text-align:center; }
  #keu-tab-dropdown .dd-divider { height:1px; background:var(--ink3); opacity:.2; margin:4px 8px; }
  #page-keuangan .keu-panel.active { display:block; }
  #page-keuangan .rasio-card {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:10px; margin-bottom:16px;
  }
  #page-keuangan .rasio-item {
    background:var(--cream2); border:2px solid var(--ink3); padding:12px 14px; border-radius:2px;
  }
  #page-keuangan .rasio-item .r-label { font-size:11px; color:var(--ink3); font-weight:700; text-transform:uppercase; margin-bottom:4px; }
  #page-keuangan .rasio-item .r-value { font-size:20px; font-weight:700; font-family:var(--f2); }
  #page-keuangan .rasio-item .r-desc  { font-size:11px; color:var(--ink3); margin-top:2px; }
  #page-keuangan .rasio-item.r-ok     { border-color:var(--ok); }
  #page-keuangan .rasio-item.r-warn   { border-color:var(--warn); }
  #page-keuangan .rasio-item.r-danger { border-color:var(--danger); }
  #page-keuangan .hutang-status-aktif  { color:var(--warn); font-weight:700; font-size:12px; }
  #page-keuangan .hutang-status-lunas  { color:var(--ok);   font-weight:700; font-size:12px; }
  #page-keuangan .val-card { background:var(--cream2); border:2px solid var(--ink); padding:14px 16px; margin-bottom:10px; border-radius:2px; }
  #page-keuangan .val-card .v-method { font-size:11px; color:var(--ink3); font-weight:700; text-transform:uppercase; }
  #page-keuangan .val-card .v-value  { font-size:22px; font-weight:700; font-family:var(--f2); color:var(--ink); margin:4px 0; }
  #page-keuangan .val-card .v-desc   { font-size:12px; color:var(--ink2); }
  #page-keuangan .neraca-section { margin-bottom:4px; }
  #page-keuangan .neraca-head td { font-weight:700; background:var(--cream2); border-top:2px solid var(--ink); }
  #page-keuangan .neraca-sub  td { padding-left:20px !important; }
  #page-keuangan .neraca-total td{ font-weight:700; border-top:2px dashed var(--ink3); border-bottom:2px solid var(--ink); }

  /* ── Neraca 3-bagian layout ── */
  #keu-neraca-minicards-wrap {
    padding: 0 0 10px 0;
    max-height: 200px;
    overflow: hidden;
    transition: max-height .25s ease, opacity .2s ease, padding .25s ease;
  }
  /* Bagian 2: section bar (ASET/KEWAJIBAN label + toggle) — statis, tidak scroll */
  #keu-neraca-section-bar {
    flex-shrink: 0;
  }
  #page-keuangan .keu-neraca-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0 8px 0;
    background: var(--cream);
    border-bottom: 2px solid var(--ink);
    margin-bottom: 4px;
  }
  #page-keuangan .keu-neraca-section-label {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .05em;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  #page-keuangan .keu-aset-label { color: var(--ok); }
  #page-keuangan .keu-kwj-label  { color: var(--danger); }
  #page-keuangan .keu-neraca-card {
    padding-bottom: 16px;
  }
  #page-keuangan .keu-neraca-total-row {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    padding-top: 8px;
    margin-top: 8px;
    border-top: 2px solid var(--ink);
  }
  #page-keuangan .keu-neraca-modal-head {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink2);
    padding: 14px 0 8px 0;
    display: flex;
    align-items: center;
    gap: 6px;
    border-top: 1px solid var(--ink4);
    margin-top: 8px;
  }

  /* ── Tab rows & Neraca grid ── */
  #page-keuangan .keu-tabs-row  { display:flex; gap:6px; flex-wrap:nowrap; margin-bottom:6px; }
  #page-keuangan .keu-tabs-row2 { display:flex; gap:6px; flex-wrap:nowrap; margin-bottom:14px; }
  #page-keuangan .keu-neraca-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  #page-keuangan .keu-minicards { margin-left:auto; display:flex; gap:8px; flex-wrap:wrap; }

  @media(max-width:600px){
    /* ═══ FULL-HEIGHT SCROLL ZONE, pola sama dengan Kas & Jurnal ═══
       #keu-panels-wrap diberi height eksplisit via JS (_keuSetPanelHeight,
       getBoundingClientRect — bukan persentase CSS, karena flex:1/height:100%
       tidak resolve reliable di iOS Safari standalone tanpa overflow:hidden
       eksplisit di .content). body.keu-active .content{overflow:hidden}
       mencegah double-scroll.
       chain: .content (overflow:hidden saat keu-active)
              → #page-keuangan.active (block biasa)
                 → #keu-sticky-header (tinggi natural, collapse via class)
                 → #keu-panels-wrap (height:Npx via JS, overflow:hidden)
                    → .keu-panel.active (height:100%, overflow-y:auto) ← scroll zone asli
    */
    body.keu-active .content { overflow:hidden !important; }
    #keu-panels-wrap { overflow:hidden; }
    #page-keuangan .keu-panel.active:not(.keu-panel-neraca):not(.keu-panel-hutang) {
      height:100%; box-sizing:border-box;
      overflow-y:auto; -webkit-overflow-scrolling:touch;
      overscroll-behavior:none; touch-action:pan-y pinch-zoom;
      padding-bottom:24px;
    }
    /* Hutang panel: flex column, scroll terjadi di #keu-hutang-scroll-zone */
    #page-keuangan .keu-panel-hutang.active {
      display:flex !important; flex-direction:column !important;
      height:100%; box-sizing:border-box; overflow:hidden !important;
    }
    #keu-hutang-collapsible {
      flex-shrink:0; -webkit-flex-shrink:0;
      overflow:hidden;
      transition: max-height .28s cubic-bezier(.4,0,.2,1), opacity .22s ease, padding .28s cubic-bezier(.4,0,.2,1);
      max-height:400px; opacity:1; padding-bottom:10px;
    }
    #keu-hutang-collapsible.keu-hutang-collapsed {
      max-height:0 !important; opacity:0;
      padding-bottom:0 !important; pointer-events:none;
    }
    #keu-hutang-scroll-zone {
      flex:1 1 0 !important; -webkit-flex:1 1 0 !important; min-height:0;
      overflow-y:auto !important; -webkit-overflow-scrolling:touch;
      overscroll-behavior:none !important; touch-action:pan-y;
      padding-bottom:0;
      display:block !important;
    }
    .keu-hutang-slide {
      display:block;
      min-height:0;
    }

    /* ── Neraca: panel jadi flex column, minicards collapse on swipe, section-bar freeze ──
       chain: .keu-panel-neraca.active (flex column, overflow:hidden)
                → #keu-neraca-minicards-wrap   (bagian 1 — collapse on swipe UP)
                → #keu-neraca-section-bar      (bagian 2 — sticky/freeze, tidak scroll)
                → #keu-neraca-scroll-zone      (bagian 3 — satu-satunya yang scroll)
    */
    #page-keuangan .keu-panel-neraca.active {
      display: -webkit-flex !important;
      display: flex !important;
      -webkit-flex-direction: column;
      flex-direction: column;
      overflow: hidden !important;
      overflow-y: hidden !important;
    }
    #keu-neraca-minicards-wrap {
      -webkit-flex-shrink: 0;
      flex-shrink: 0;
    }
    #keu-neraca-section-bar {
      -webkit-flex-shrink: 0;
      flex-shrink: 0;
    }
    #keu-neraca-scroll-zone {
      -webkit-flex: 1 1 0;
      flex: 1 1 0;
      min-height: 0;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: none;
      touch-action: pan-y;
      padding-bottom: 24px;
    }

    /* Neraca grid: stack penuh, scroll-nya sekarang di #keu-neraca-scroll-zone */
    #page-keuangan .keu-neraca-grid { grid-template-columns:1fr; max-height:none; overflow:visible; }
    #page-keuangan .keu-minicards { margin-left:0; width:100%; justify-content:center; }
    #page-keuangan .keu-minicards > div { flex:1 1 0; min-width:0; }

    /* Toggle ASET / KEWAJIBAN — segmented control, minimalis */
    .keu-neraca-grid[data-view="aset"]      #keu-neraca-card-kewajiban { display:none; }
    .keu-neraca-grid[data-view="kewajiban"] #keu-neraca-card-aset      { display:none; }

    /* Cegah horizontal overflow: label kolom kiri (mis. "Total Persediaan & Aset Tetap")
       boleh wrap, kolom kanan (nominal + persen) tetap nowrap agar tidak putus. */
    #keu-neraca-card-aset .tbl td:first-child,
    #keu-neraca-card-kewajiban .tbl td:first-child {
      white-space:normal; word-break:break-word; padding-right:6px;
    }
    #keu-neraca-card-aset .tbl td:last-child,
    #keu-neraca-card-kewajiban .tbl td:last-child {
      white-space:nowrap;
    }
  }
  @media(min-width:601px){
    #page-keuangan .keu-neraca-toggle { display:none; }
  }

  /* ── Desktop slide nav: ◀ ○○◉ ▶ — hanya min-width:901px ── */
  @media(min-width:901px){
    .keu-slide-nav {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .keu-slide-nav .keu-nav-arr {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 13px;
      color: var(--ink3);
      padding: 2px 4px;
      line-height: 1;
      transition: color .15s;
    }
    .keu-slide-nav .keu-nav-arr:hover { color: var(--ink); }
    .keu-slide-nav .keu-hdot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--ink3);
      display: inline-block;
      cursor: pointer;
      transition: background .2s, transform .15s;
      opacity: 0.5;
    }
    .keu-slide-nav .keu-hdot.active {
      background: var(--ok);
      opacity: 1;
      transform: scale(1.3);
    }
    .keu-slide-nav .keu-hdot:hover { opacity: 1; }
  }
  /* Di bawah 901px: sembunyikan nav arrow, dot tetap pakai style lama */
  @media(max-width:900px){
    .keu-slide-nav .keu-nav-arr { display: none; }
  }

  /* ── Portrait: slide card full height, tabel kolom minimal ── */
  @media(max-width:600px){
    /* Slide & card full height */
    .keu-hutang-slide {
      display:block;
      height:100%;
      box-sizing:border-box;
    }
    .keu-hutang-slide > .card {
      height:100%;
      box-sizing:border-box;
      display:flex !important;
      flex-direction:column !important;
      margin-bottom:0 !important;
    }
    /* Tabel scroll area tumbuh mengisi card */
    .keu-hutang-slide > .card > .tbl-wrap {
      flex:1 1 0;
      overflow-y:auto;
      overflow-x:hidden;
      -webkit-overflow-scrolling:touch;
      overscroll-behavior:none;
    }
    /* card-title dan tombol aksi: fix height, tidak boleh mengecil */
    .keu-hutang-slide > .card > .card-title { flex-shrink:0; }
    .keu-hutang-slide > .card > div:not(.tbl-wrap):not(#keu-riwayat-summary-body) { flex-shrink:0; }
    /* slide 3: summary body tumbuh dan scroll menggantikan tbl-wrap */
    #keu-slide-2 .card > #keu-riwayat-summary-body {
      flex:1 1 0;
      overflow-y:auto;
      -webkit-overflow-scrolling:touch;
      overscroll-behavior:none;
      min-height:0;
    }

    /* ── Slide 1: Daftar Hutang — sembunyikan kolom tidak penting ── */
    #keu-slide-0 .tbl th:nth-child(2),
    #keu-slide-0 .tbl td:nth-child(2) { display:none; } /* JENIS */
    #keu-slide-0 .tbl th:nth-child(4),
    #keu-slide-0 .tbl td:nth-child(4) { display:none; } /* BUNGA */
    #keu-slide-0 .tbl th:nth-child(5),
    #keu-slide-0 .tbl td:nth-child(5) { display:none; } /* CICILAN/BLN */
    #keu-slide-0 .tbl th:nth-child(6),
    #keu-slide-0 .tbl td:nth-child(6) { display:none; } /* SUDAH BAYAR */
    #keu-slide-0 .tbl th:nth-child(9),
    #keu-slide-0 .tbl td:nth-child(9) { display:none; } /* STATUS */

    /* ── Slide 2: Riwayat Cicilan — sembunyikan KETERANGAN ── */
    #keu-slide-1 .tbl th:nth-child(3),
    #keu-slide-1 .tbl td:nth-child(3) { display:none; } /* KETERANGAN */
  }
</style>

<!-- Sticky header: collapse on scroll (mobile, Neraca only) -->
<div id="keu-sticky-header">
<!-- Tab dropdown modern -->
<div class="keu-tabs-row" style="align-items:center">
  <div id="keu-tab-dropdown-wrap">
    <button id="keu-tab-trigger" onclick="keuToggleTabDD()">
      <i class="ti ti-building-bank" id="keu-tab-icon"></i>
      <span id="keu-tab-label">Hutang</span>
      <i class="ti ti-chevron-down arr"></i>
    </button>
    <div id="keu-tab-dropdown">
      <div class="dd-section">Keuangan</div>
      <button class="dd-item active" data-tab="hutang" onclick="keuGotoTab('hutang')"><i class="ti ti-building-bank"></i> Hutang</button>
      <button class="dd-item" data-tab="neraca" onclick="keuGotoTab('neraca')"><i class="ti ti-scale"></i> Neraca</button>
      <div class="dd-divider"></div>
      <div class="dd-section">Analisis</div>
      <button class="dd-item" data-tab="rasio" onclick="keuGotoTab('rasio')"><i class="ti ti-chart-bar"></i> Rasio & Net Worth</button>
      <button class="dd-item" data-tab="valuasi" onclick="keuGotoTab('valuasi')"><i class="ti ti-diamond"></i> Valuasi Bisnis</button>
      <button class="dd-item" data-tab="aruskas" onclick="keuGotoTab('aruskas')"><i class="ti ti-cash"></i> Arus Kas</button>
      <button class="dd-item" data-tab="fixcost" onclick="keuGotoTab('fixcost')"><i class="ti ti-pin"></i> Fix Cost</button>
    </div>
  </div>
  <button class="btn btn-sm" onclick="keuRefreshAktif()" style="margin-left:auto"><i class="ti ti-refresh"></i> Refresh</button>
</div>
</div>

<div id="keu-panels-wrap">

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PANEL: HUTANG                                              -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div id="keu-panel-hutang" class="keu-panel active keu-panel-hutang">

  <!-- ── BAGIAN 1: Collapsible (hide-on-scroll) — hanya 4 minicard ── -->
  <div id="keu-hutang-collapsible">
    <div class="rasio-card" style="margin-bottom:0">
      <div class="rasio-item"><div class="r-label">Total Hutang</div><div class="r-value" id="keu-total-hutang">—</div><div class="r-desc">pokok semua pinjaman</div></div>
      <div class="rasio-item"><div class="r-label">Sudah Dibayar</div><div class="r-value" id="keu-total-bayar">—</div><div class="r-desc">total cicilan terbayar</div></div>
      <div class="rasio-item"><div class="r-label">Sisa Hutang</div><div class="r-value" id="keu-total-sisa" style="color:var(--danger)">—</div><div class="r-desc">belum terlunasi</div></div>
      <div class="rasio-item"><div class="r-label">Cicilan/Bulan</div><div class="r-value" id="keu-total-cicilan">—</div><div class="r-desc">total kewajiban bulanan</div></div>
    </div>
  </div><!-- /keu-hutang-collapsible -->

  <!-- ── BAGIAN 2: Scroll zone — 3 slide show/hide, tumbuh natural ke bawah ── -->
  <div id="keu-hutang-scroll-zone">

    <!-- ═══ SLIDE 1: Daftar Hutang ═══ -->
    <div id="keu-slide-0" class="keu-hutang-slide">
      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
          <span><i class="ti ti-list"></i> Daftar Hutang</span>
          <span class="keu-slide-nav">
            <button class="keu-nav-arr" onclick="keuSlideNav(-1)">◀</button>
            <span class="keu-hdot active" onclick="window._keuGoToSlide&&window._keuGoToSlide(0)"></span>
            <span class="keu-hdot" onclick="window._keuGoToSlide&&window._keuGoToSlide(1)"></span>
            <span class="keu-hdot" onclick="window._keuGoToSlide&&window._keuGoToSlide(2)"></span>
            <button class="keu-nav-arr" onclick="keuSlideNav(1)">▶</button>
          </span>
        </div>
        <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
          <thead><tr><th>Kreditur</th><th>Jenis</th><th style="text-align:right">Pokok</th><th style="text-align:right">Bunga</th><th style="text-align:right">Cicilan/bln</th><th style="text-align:right">Sudah Bayar</th><th style="text-align:right">Sisa</th><th>Jatuh Tempo</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody id="keu-hutang-tbody"><tr><td colspan="10" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
        </table></div>
        <div style="text-align:center;padding:8px 0 2px;font-size:11px;color:var(--ink3)">geser → untuk riwayat cicilan</div>
      </div>
    </div>

    <!-- ═══ SLIDE 2: Riwayat Cicilan ═══ -->
    <div id="keu-slide-1" class="keu-hutang-slide" style="display:none">
      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
          <span><i class="ti ti-history"></i> Riwayat Cicilan</span>
          <span class="keu-slide-nav">
            <button class="keu-nav-arr" onclick="keuSlideNav(-1)">◀</button>
            <span class="keu-hdot" onclick="window._keuGoToSlide&&window._keuGoToSlide(0)"></span>
            <span class="keu-hdot active" onclick="window._keuGoToSlide&&window._keuGoToSlide(1)"></span>
            <span class="keu-hdot" onclick="window._keuGoToSlide&&window._keuGoToSlide(2)"></span>
            <button class="keu-nav-arr" onclick="keuSlideNav(1)">▶</button>
          </span>
        </div>
        <div style="margin-bottom:10px">
          <button class="btn btn-sm" onclick="keuOpenCicilan()" style="font-weight:700;border:2px solid var(--ok);color:var(--ok);width:100%"><i class="ti ti-history"></i> + Catat Cicilan</button>
        </div>
        <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl" style="min-width:100%">
          <thead><tr><th>Tanggal</th><th>Kreditur</th><th>Keterangan</th><th style="text-align:right">Nominal</th><th>Aksi</th></tr></thead>
          <tbody id="keu-bayar-tbody"><tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
        </table></div>
        <div style="text-align:center;padding:8px 0 2px;font-size:11px;color:var(--ink3)">← daftar hutang &nbsp;|&nbsp; ringkasan →</div>
      </div>
    </div>

    <!-- ═══ SLIDE 3: Ringkasan per Kreditur ═══ -->
    <div id="keu-slide-2" class="keu-hutang-slide" style="display:none">
      <div class="card">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
          <span><i class="ti ti-chart-bar"></i> Ringkasan per Kreditur</span>
          <span class="keu-slide-nav">
            <button class="keu-nav-arr" onclick="keuSlideNav(-1)">◀</button>
            <span class="keu-hdot" onclick="window._keuGoToSlide&&window._keuGoToSlide(0)"></span>
            <span class="keu-hdot" onclick="window._keuGoToSlide&&window._keuGoToSlide(1)"></span>
            <span class="keu-hdot active" onclick="window._keuGoToSlide&&window._keuGoToSlide(2)"></span>
            <button class="keu-nav-arr" onclick="keuSlideNav(1)">▶</button>
          </span>
        </div>
        <div style="margin-bottom:10px">
          <button class="btn btn-sm btn-primary" onclick="keuShowFormHutang()" style="width:100%"><i class="ti ti-plus"></i> Tambah Hutang</button>
        </div>
        <div id="keu-riwayat-summary-body" style="padding:4px 0"></div>
        <div style="text-align:center;padding:8px 0 2px;font-size:11px;color:var(--ink3)">← geser kembali ke riwayat</div>
      </div>
    </div>

  </div><!-- /keu-hutang-scroll-zone -->

  <!-- Modal Catat Cicilan -->
  <div class="modal-overlay" id="modal-keu-cicilan" style="display:none" onclick="if(event.target===this)keuCloseCicilan()">
    <div class="modal" style="max-width:480px;width:100%">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
        <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-history"></i> Catat Pembayaran Cicilan</div>
        <button onclick="keuCloseCicilan()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="form-group"><label>Pilih Hutang</label>
          <div class="kas-akun-wrap">
            <select id="keu-bayar-hutang-id" style="display:none" onchange="keuBayarHutangChange()"><option value="">— Pilih —</option></select>
            <div class="kas-akun-picker" id="keu-picker-bayar" data-target="keu-bayar-hutang-id"
              onmousedown="event.stopPropagation();keuTogglePicker('keu-picker-bayar')"
              ontouchend="event.preventDefault();event.stopPropagation();keuTogglePicker('keu-picker-bayar')">
              <span id="keu-picker-bayar-label" style="color:var(--ink3)">— Pilih Hutang —</span>
              <span style="margin-left:auto;color:var(--ink3);font-size:10px">▾</span>
            </div>
            <div class="kas-akun-list" id="keu-picker-bayar-list" style="display:none"></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <div class="form-group" style="flex:1 1 130px"><label>Tanggal</label><input type="date" id="keu-bayar-tgl"></div>
          <div class="form-group" style="flex:1 1 130px"><label>Nominal (Rp)</label><input type="text" inputmode="numeric" id="keu-bayar-nominal" placeholder="0" onfocus="this.select()"></div>
        </div>
        <div class="form-group"><label>Bayar dari Akun</label>
          <div class="kas-akun-wrap">
            <select id="keu-bayar-akun-id" style="display:none"><option value="">— Pilih Akun —</option></select>
            <div class="kas-akun-picker" id="keu-picker-bayar-akun" data-target="keu-bayar-akun-id"
              onmousedown="event.stopPropagation();keuTogglePicker('keu-picker-bayar-akun')"
              ontouchend="event.preventDefault();event.stopPropagation();keuTogglePicker('keu-picker-bayar-akun')">
              <span id="keu-picker-bayar-akun-label" style="color:var(--ink3)">— Pilih Akun —</span>
              <span style="margin-left:auto;color:var(--ink3);font-size:10px">▾</span>
            </div>
            <div class="kas-akun-list" id="keu-picker-bayar-akun-list" style="display:none"></div>
          </div>
        </div>
        <div class="form-group"><label>Keterangan</label><input type="text" id="keu-bayar-ket" placeholder="mis: cicilan bulan Juni"></div>
      </div>
      <div class="modal-actions" style="margin-top:16px;padding-top:12px;border-top:1.5px dashed var(--ink3)">
        <button class="btn btn-sm" onclick="keuCloseCicilan()"><i class="ti ti-x"></i> Batal</button>
        <button class="btn btn-primary btn-sm" onclick="keuSimpanPembayaran()" style="font-weight:700;font-size:14px;padding:8px 16px"><i class="ti ti-check"></i> Catat</button>
      </div>
    </div>
  </div>

</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PANEL: NERACA                                              -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div id="keu-panel-neraca" class="keu-panel keu-panel-neraca">
  <!-- ── FREEZE HEADER: Net Worth + Status (collapse on scroll) ── -->
  <div id="keu-neraca-minicards-wrap">
    <div style="display:flex;gap:8px">
      <!-- Net Worth -->
      <div style="flex:1;padding:8px 12px;border:2px solid var(--ink);border-radius:2px;background:var(--cream2)">
        <div style="font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;margin-bottom:2px">Net Worth</div>
        <div id="keu-neraca-total-km" style="font-size:15px;font-weight:700">—</div>
        <div style="font-size:10px;color:var(--ink3)">Aset − Kewajiban</div>
      </div>
      <!-- Status Neraca -->
      <div style="flex:1;padding:8px 12px;border:2px solid var(--ink);border-radius:2px;background:var(--cream2)">
        <div style="font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;margin-bottom:2px">Status Neraca</div>
        <div id="keu-neraca-check" style="font-size:13px;font-weight:700">—</div>
      </div>
    </div>
  </div>

  <!-- ── BAGIAN 2: Section bar ASET / KEWAJIBAN — freeze, tidak ikut scroll ── -->
  <div id="keu-neraca-section-bar">

    <!-- Section header ASET -->
    <div id="keu-neraca-section-aset" class="keu-neraca-section-head" data-view="aset">
      <span class="keu-neraca-section-label keu-aset-label">
        <i class="ti ti-trending-up"></i> ASET
      </span>
      <button id="keu-neraca-view-toggle" onclick="keuNeracaViewToggle()"
        style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;
               padding:5px 11px;border-radius:20px;cursor:pointer;
               border:1.5px solid rgba(46,204,122,0.4);
               background:rgba(46,204,122,0.08);color:var(--ok);
               transition:color .2s,background .2s,border-color .2s;white-space:nowrap">
        <i class="ti ti-trending-down" style="font-size:12px"></i>
        <span id="keu-neraca-toggle-label">Kewajiban <span id="keu-neraca-kwj-count">—</span></span>
      </button>
    </div>

    <!-- Section header KEWAJIBAN — muncul saat view kewajiban -->
    <div id="keu-neraca-section-kwj" class="keu-neraca-section-head" data-view="kewajiban" style="display:none">
      <span class="keu-neraca-section-label keu-kwj-label">
        <i class="ti ti-trending-down"></i> KEWAJIBAN
      </span>
      <button onclick="keuNeracaViewToggle()"
        style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;
               padding:5px 11px;border-radius:20px;cursor:pointer;
               border:1.5px solid rgba(255,80,80,0.4);
               background:rgba(255,80,80,0.08);color:var(--danger);
               transition:color .2s,background .2s,border-color .2s;white-space:nowrap">
        <i class="ti ti-trending-up" style="font-size:12px"></i>
        <span id="keu-neraca-toggle-label2">Aset <span id="keu-neraca-aset-count">—</span></span>
      </button>
    </div>

  </div><!-- /keu-neraca-section-bar -->

  <!-- ── BAGIAN 3: Scroll zone — satu-satunya yang scroll ── -->
  <div id="keu-neraca-scroll-zone">

    <!-- Tabel ASET -->
    <div id="keu-neraca-card-aset" class="keu-neraca-card">
      <table class="tbl"><tbody id="keu-neraca-aset"></tbody></table>
      <div class="keu-neraca-total-row">
        <span>Total Aset</span><span id="keu-neraca-total-aset" style="color:var(--ok)">—</span>
      </div>
    </div>

    <!-- Tabel KEWAJIBAN + MODAL -->
    <div id="keu-neraca-card-kewajiban" class="keu-neraca-card" style="display:none">
      <table class="tbl"><tbody id="keu-neraca-kewajiban"></tbody></table>
      <div class="keu-neraca-total-row" style="border-top:2px dashed var(--ink3)">
        <span>Total Kewajiban</span><span id="keu-neraca-total-kewajiban" style="color:var(--danger)">—</span>
      </div>
      <div class="keu-neraca-modal-head">
        <i class="ti ti-user"></i> MODAL
      </div>
      <table class="tbl"><tbody id="keu-neraca-modal"></tbody></table>
    </div>

  </div><!-- /keu-neraca-scroll-zone -->
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PANEL: RASIO & NET WORTH                                   -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div id="keu-panel-rasio" class="keu-panel">

  <div class="card" style="margin-bottom:14px">
    <div class="card-title"><i class="ti ti-activity"></i> Net Worth (Kekayaan Bersih)</div>
    <div class="rasio-card">
      <div class="rasio-item" id="keu-networth-card">
        <div class="r-label">Net Worth</div>
        <div class="r-value" id="keu-networth-val">—</div>
        <div class="r-desc">Total Aset − Total Hutang</div>
      </div>
      <div class="rasio-item">
        <div class="r-label">Total Aset</div>
        <div class="r-value" id="keu-rasio-aset">—</div>
        <div class="r-desc">dari Kas & Jurnal</div>
      </div>
      <div class="rasio-item">
        <div class="r-label">Total Hutang</div>
        <div class="r-value" id="keu-rasio-hutang" style="color:var(--danger)">—</div>
        <div class="r-desc">sisa semua pinjaman</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title"><i class="ti ti-chart-pie"></i> Rasio Solvabilitas</div>
    <div class="rasio-card">
      <div class="rasio-item" id="keu-dta-card">
        <div class="r-label">Debt to Asset Ratio</div>
        <div class="r-value" id="keu-dta-val">—</div>
        <div class="r-desc" id="keu-dta-desc">Total Hutang ÷ Total Aset</div>
      </div>
      <div class="rasio-item" id="keu-dte-card">
        <div class="r-label">Debt to Equity Ratio</div>
        <div class="r-value" id="keu-dte-val">—</div>
        <div class="r-desc" id="keu-dte-desc">Total Hutang ÷ Modal</div>
      </div>
      <div class="rasio-item" id="keu-cr-card">
        <div class="r-label">Coverage Ratio</div>
        <div class="r-value" id="keu-cr-val">—</div>
        <div class="r-desc" id="keu-cr-desc">Kas ÷ Cicilan/Bulan</div>
      </div>
    </div>
    <div style="margin-top:10px;padding:10px 12px;background:var(--cream2);border:1.5px dashed var(--ink3);font-size:12px;color:var(--ink2);line-height:1.8">
      <b>Panduan:</b><br>
      DTA &lt; 0.4 = 🟢 Sehat &nbsp;|&nbsp; 0.4–0.6 = 🟡 Waspadai &nbsp;|&nbsp; &gt; 0.6 = 🔴 Berisiko<br>
      DTE &lt; 1.0 = 🟢 Sehat &nbsp;|&nbsp; 1.0–2.0 = 🟡 Perhatikan &nbsp;|&nbsp; &gt; 2.0 = 🔴 Berbahaya<br>
      Coverage &gt; 3x = 🟢 Aman &nbsp;|&nbsp; 1–3x = 🟡 Cukup &nbsp;|&nbsp; &lt; 1x = 🔴 Kritis
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PANEL: VALUASI BISNIS                                      -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div id="keu-panel-valuasi" class="keu-panel">
  <div style="margin-bottom:12px;padding:10px 14px;background:var(--cream2);border:2px dashed var(--ink3);font-size:13px;color:var(--ink2);line-height:1.7">
    Valuasi dihitung otomatis dari data Kas & Jurnal + Hutang. Multiplier bisa disesuaikan.
  </div>

  <!-- Input multiplier -->
  <div class="card" style="margin-bottom:14px">
    <div class="card-title"><i class="ti ti-adjustments"></i> Parameter Valuasi</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
      <div class="form-group" style="flex:1 1 130px">
        <label>Multiplier Laba <span style="color:var(--ink3);font-weight:400">(umumnya 2-5x)</span></label>
        <input type="number" id="keu-mult-laba" value="3" step="0.5" min="1" max="20">
      </div>
      <div class="form-group" style="flex:1 1 130px">
        <label>Multiplier Revenue <span style="color:var(--ink3);font-weight:400">(umumnya 0.5-2x)</span></label>
        <input type="number" id="keu-mult-rev" value="1" step="0.1" min="0.1" max="10">
      </div>
      <div class="form-group" style="flex:1 1 130px">
        <label>Periode Laba (bulan)</label>
        <input type="number" id="keu-periode-laba" value="12" step="1" min="1">
      </div>
      <button class="btn btn-primary btn-sm" onclick="keuRenderValuasi()" style="margin-bottom:2px">Hitung</button>
    </div>
  </div>

  <!-- Hasil valuasi -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:14px">
    <div class="val-card">
      <div class="v-method">📊 Metode Asset-Based</div>
      <div class="v-value" id="keu-val-aset">—</div>
      <div class="v-desc">Nilai Aset Bersih (Aset − Hutang)</div>
    </div>
    <div class="val-card">
      <div class="v-method">📈 Metode Earnings-Based</div>
      <div class="v-value" id="keu-val-earnings">—</div>
      <div class="v-desc" id="keu-val-earnings-desc">Laba Bersih × Multiplier</div>
    </div>
    <div class="val-card">
      <div class="v-method">💰 Metode Revenue-Based</div>
      <div class="v-value" id="keu-val-revenue">—</div>
      <div class="v-desc" id="keu-val-revenue-desc">Total Pendapatan × Multiplier</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title"><i class="ti ti-calculator"></i> Estimasi Nilai Bisnis</div>
    <div style="text-align:center;padding:20px">
      <div style="font-size:13px;color:var(--ink2);margin-bottom:6px">Rata-rata 3 Metode</div>
      <div style="font-size:32px;font-weight:700;font-family:var(--f2)" id="keu-val-rata">—</div>
      <div style="font-size:12px;color:var(--ink3);margin-top:4px">estimasi valuasi bisnis zenOt</div>
    </div>
    <div style="padding:10px 12px;background:var(--cream2);border-top:1.5px dashed var(--ink3);font-size:12px;color:var(--ink2)">
      ⚠ Valuasi adalah estimasi — angka aktual bergantung pada kondisi pasar, aset tak berwujud (brand, pelanggan loyal), dan negosiasi.
    </div>
  </div>
</div>


<!-- PANEL: ARUS KAS -->
<div id="keu-panel-aruskas" class="keu-panel">
  <div class="rasio-card" id="ak-summary-cards">
    <div class="rasio-item" id="ak-card-beban">
      <div class="r-label">Beban Bulan Ini</div>
      <div class="r-value" id="ak-beban-val">—</div>
      <div class="r-desc">dari jurnal COA</div>
    </div>
    <div class="rasio-item" id="ak-card-cicilan">
      <div class="r-label">Cicilan Hutang</div>
      <div class="r-value" id="ak-cicilan-val">—</div>
      <div class="r-desc">kewajiban bulan ini</div>
    </div>
    <div class="rasio-item" id="ak-card-total-keluar">
      <div class="r-label">Total Keluar/Bulan</div>
      <div class="r-value" id="ak-keluar-val">—</div>
      <div class="r-desc">beban + cicilan</div>
    </div>
    <div class="rasio-item" id="ak-card-kas">
      <div class="r-label">Kas Tersedia</div>
      <div class="r-value" id="ak-kas-val">—</div>
      <div class="r-desc">kas + escrow + wallet</div>
    </div>
  </div>
  <div id="ak-status-bar" style="padding:12px 16px;border-radius:4px;margin-bottom:14px;font-weight:700;font-size:14px;display:none"></div>
  <div class="rasio-item" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div class="r-label">Cash Runway</div>
      <div class="r-value" id="ak-runway-val" style="font-size:24px">—</div>
    </div>
    <div style="text-align:right">
      <div class="r-desc" id="ak-runway-desc">—</div>
      <div id="ak-bulan-label" style="font-size:11px;color:var(--ink3);margin-top:4px"></div>
    </div>
  </div>
  <div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">
    Rincian Beban <span id="ak-bulan-rincian"></span>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead>
      <tr style="border-bottom:2px solid var(--ink)">
        <th style="text-align:left;padding:6px 4px;font-size:11px;color:var(--ink3);font-weight:700;text-transform:uppercase">Akun</th>
        <th style="text-align:right;padding:6px 4px;font-size:11px;color:var(--ink3);font-weight:700;text-transform:uppercase">Nominal</th>
      </tr>
    </thead>
    <tbody id="ak-rincian-tbody">
      <tr><td colspan="2" style="padding:12px 4px;color:var(--ink3);font-style:italic">Memuat...</td></tr>
    </tbody>
  </table>
</div>

<!-- ═══ FIX COST PANEL ═══ -->
<div id="keu-panel-fixcost" class="keu-panel">

  <!-- Summary cards -->
  <div class="rasio-card">
    <div class="rasio-item">
      <div class="r-label">Total Fix Cost/Bulan</div>
      <div class="r-value" id="fc-total-val" style="color:var(--danger)">—</div>
      <div class="r-desc">cicilan hutang + anggaran beban</div>
    </div>
    <div class="rasio-item">
      <div class="r-label">Omset Bulan Ini</div>
      <div class="r-value" id="fc-omset-val">—</div>
      <div class="r-desc">dari jurnal penjualan</div>
    </div>
    <div class="rasio-item">
      <div class="r-label">NPM + Beban Ops (20%)</div>
      <div class="r-value" id="fc-beban-ch-val" style="color:var(--ok)">—</div>
      <div class="r-desc">10% beban ops + 10% NPM dari omset</div>
    </div>
    <div class="rasio-item" id="fc-sisa-card">
      <div class="r-label">Sisa Setelah Fix Cost</div>
      <div class="r-value" id="fc-sisa-val">—</div>
      <div class="r-desc">fix cost − (NPM+beban ops)</div>
    </div>
    <div class="rasio-item" id="fc-hari-card">
      <div class="r-label">Hari Kejar Fix Cost</div>
      <div class="r-value" id="fc-hari-val">—</div>
      <div class="r-desc" id="fc-hari-desc">berdasarkan avg income/hari</div>
    </div>
  </div>

  <!-- Status bar -->
  <div id="fc-status-bar" style="padding:12px 16px;border-radius:4px;margin-bottom:14px;font-weight:700;font-size:14px;display:none"></div>

  <!-- Cicilan Hutang -->
  <div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">🏦 Cicilan Hutang</div>
  <table class="tbl" style="width:100%;margin-bottom:16px">
    <thead><tr>
      <th>Kreditur</th>
      <th style="text-align:right">Cicilan/Bulan</th>
      <th>Ket.</th>
    </tr></thead>
    <tbody id="fc-hutang-tbody">
      <tr><td colspan="3" style="padding:12px 4px;color:var(--ink3);font-style:italic">Memuat...</td></tr>
    </tbody>
  </table>

  <!-- Anggaran Beban -->
  <div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">📋 Anggaran Beban Bulan Ini</div>
  <table class="tbl" style="width:100%;margin-bottom:16px">
    <thead><tr>
      <th>Pos Beban</th>
      <th style="text-align:right">Anggaran/Bulan</th>
    </tr></thead>
    <tbody id="fc-anggaran-tbody">
      <tr><td colspan="2" style="padding:12px 4px;color:var(--ink3);font-style:italic">Memuat...</td></tr>
    </tbody>
  </table>

</div>

</div><!-- /keu-panels-wrap -->

<div class="modal-overlay" id="modal-keu-hutang" onclick="if(event.target===this)hideModal('modal-keu-hutang')">
  <div class="modal" style="max-width:560px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" id="keu-hutang-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-plus"></i> Tambah Hutang</div>
      <button onclick="hideModal('modal-keu-hutang')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="keu-htg-id">
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:2 1 160px"><label>Nama Kreditur</label><input type="text" id="keu-htg-kreditur" placeholder="mis: KUR BRI, Pak Hasan..."></div>
      <div class="form-group" style="flex:1 1 120px"><label>Jenis Hutang</label>
        <select id="keu-htg-jenis" style="width:100%">
          <option value="bank">🏦 Bank / KUR</option>
          <option value="keluarga">👨‍👩‍👧 Keluarga / Sodara</option>
          <option value="investor">💼 Investor / Modal</option>
          <option value="lainnya">📋 Lainnya</option>
        </select>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 180px"><label>Akun Kewajiban (Jurnal Kredit)</label>
        <div class="kas-akun-wrap">
          <select id="keu-htg-akun-kwj" style="display:none"><option value="">— pilih akun kewajiban —</option></select>
          <div class="kas-akun-picker" id="keu-picker-kwj" data-target="keu-htg-akun-kwj"
            onmousedown="event.stopPropagation();keuTogglePicker('keu-picker-kwj')"
            ontouchend="event.preventDefault();event.stopPropagation();keuTogglePicker('keu-picker-kwj')">
            <span id="keu-picker-kwj-label" style="color:var(--ink3)">— pilih akun kewajiban —</span>
            <span style="margin-left:auto;color:var(--ink3);font-size:10px">▾</span>
          </div>
          <div class="kas-akun-list" id="keu-picker-kwj-list" style="display:none"></div>
        </div>
      </div>
      <div class="form-group" style="flex:1 1 180px"><label>Masuk ke Akun (Jurnal Debit)</label>
        <div class="kas-akun-wrap">
          <select id="keu-htg-akun-aset" style="display:none"><option value="">— pilih akun aset/kas —</option></select>
          <div class="kas-akun-picker" id="keu-picker-aset" data-target="keu-htg-akun-aset"
            onmousedown="event.stopPropagation();keuTogglePicker('keu-picker-aset')"
            ontouchend="event.preventDefault();event.stopPropagation();keuTogglePicker('keu-picker-aset')">
            <span id="keu-picker-aset-label" style="color:var(--ink3)">— pilih akun aset/kas —</span>
            <span style="margin-left:auto;color:var(--ink3);font-size:10px">▾</span>
          </div>
          <div class="kas-akun-list" id="keu-picker-aset-list" style="display:none"></div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 130px"><label>Pokok Pinjaman (Rp)</label><input type="text" inputmode="numeric" id="keu-htg-pokok" placeholder="0"></div>
      <div class="form-group" style="flex:1 1 120px"><label>Bunga / Tahun (%)</label><input type="number" id="keu-htg-bunga" placeholder="0" step="0.1"></div>
      <div class="form-group" style="flex:1 1 120px"><label>Frekuensi Cicilan</label>
        <select id="keu-htg-frekuensi" style="width:100%">
          <option value="bulanan">Bulanan</option>
          <option value="tahunan">Tahunan</option>
        </select>
      </div>
      <div class="form-group" style="flex:1 1 120px"><label>Tenor <span id="keu-htg-tenor-label">(bulan)</span></label><input type="number" id="keu-htg-tenor" placeholder="mis: 24"></div>
      <div class="form-group" style="flex:1 1 130px"><label>Nominal Cicilan (Rp)</label><input type="text" inputmode="numeric" id="keu-htg-cicilan" placeholder="0"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 130px"><label>Tanggal Mulai</label><input type="date" id="keu-htg-tgl-mulai"></div>
      <div class="form-group" style="flex:1 1 130px"><label>Jatuh Tempo</label><input type="date" id="keu-htg-jatuh-tempo"></div>
      <div class="form-group" style="flex:2 1 180px"><label>Keterangan</label><input type="text" id="keu-htg-ket" placeholder="mis: modal tambah stok koleksi baru"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="keuSimpanHutang()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-keu-hutang')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>

`;

setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-keuangan')); }, 80);
setTimeout(_keuEnsureFlexLayout, 100);

// ─── TAB ─────────────────────────────────────────────────────
let _keuTabAktif = 'hutang';

// ── Dropdown tab toggle (desktop) ──────────────────────────
function keuToggleTabDD() {
  var dd  = document.getElementById('keu-tab-dropdown');
  var btn = document.getElementById('keu-tab-trigger');
  if (!dd || !btn) return;
  var isOpen = dd.classList.contains('open');
  dd.classList.toggle('open', !isOpen);
  btn.classList.toggle('open', !isOpen);
}
// Tutup dropdown kalau klik di luar
document.addEventListener('click', function(e) {
  if (!e.target.closest('#keu-tab-dropdown-wrap')) {
    var dd  = document.getElementById('keu-tab-dropdown');
    var btn = document.getElementById('keu-tab-trigger');
    if (dd)  dd.classList.remove('open');
    if (btn) btn.classList.remove('open');
  }
});

// Map tab → {label, icon}
var _keuTabMeta = {
  hutang:  { label:'Hutang',          icon:'ti-building-bank' },
  neraca:  { label:'Neraca',          icon:'ti-scale'         },
  rasio:   { label:'Rasio & NW',      icon:'ti-chart-bar'     },
  valuasi: { label:'Valuasi Bisnis',  icon:'ti-diamond'       },
  aruskas: { label:'Arus Kas',        icon:'ti-cash'          },
  fixcost: { label:'Fix Cost',        icon:'ti-pin'           }
};

function keuGotoTab(tab) {
  _keuTabAktif = tab;
  const tabs = ['hutang','neraca','rasio','valuasi','aruskas','fixcost'];
  // Sync dropdown: active item + trigger label + icon
  document.querySelectorAll('#keu-tab-dropdown .dd-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  var meta = _keuTabMeta[tab];
  if (meta) {
    var lbl  = document.getElementById('keu-tab-label');
    var icn  = document.getElementById('keu-tab-icon');
    if (lbl) lbl.textContent = meta.label;
    if (icn) { icn.className = 'ti ' + meta.icon; }
  }
  // Tutup dropdown setelah pilih
  var dd  = document.getElementById('keu-tab-dropdown');
  var btn = document.getElementById('keu-tab-trigger');
  if (dd)  dd.classList.remove('open');
  if (btn) btn.classList.remove('open');
  // Legacy .keu-tab active (fallback, tidak ada elemen lagi tapi aman)
  document.querySelectorAll('.keu-tab').forEach((t,i) => t.classList.toggle('active', tabs[i] === tab));
  // Clear inline display style dulu agar CSS display:none bisa berlaku,
  // lalu set class active. Tanpa ini, neraca yang pernah dapat inline
  // display:flex dari _keuApplyNeracaFlexChain tidak akan tersembunyi oleh CSS.
  document.querySelectorAll('.keu-panel').forEach(p => {
    p.classList.remove('active');
    p.style.display = ''; // reset inline style — biarkan CSS yang kontrol
  });
  document.getElementById('keu-panel-' + tab).classList.add('active');
  keuNeracaExpandHeader();
  if (tab === 'neraca')  keuRenderNeraca();
  if (tab === 'rasio')   keuRenderRasio();
  if (tab === 'valuasi') keuRenderValuasi();
  if (tab === 'aruskas') keuRenderArusKas();
  if (tab === 'fixcost') fcLoad();
  _keuSetPanelHeight();
}

// ─── FULL-HEIGHT SCROLL ZONE (mobile) — pola sama dengan _restockEnsureFlexLayout ──
function _keuEnsureFlexLayout() {
  var pg = document.getElementById('page-keuangan');
  if (!pg || !pg.classList.contains('active')) return;

  var htmlEl = document.documentElement;
  if (htmlEl) { htmlEl.style.height = '100%'; }

  var bodyEl = document.body;
  if (bodyEl) { bodyEl.style.height = '100%'; bodyEl.style.minHeight = '0'; }

  var mainEl = document.querySelector('.main');
  if (mainEl) {
    mainEl.style.height        = '100%';
    mainEl.style.minHeight     = '0';
    mainEl.style.overflow      = 'hidden';
    mainEl.style.display       = '-webkit-flex';
    mainEl.style.display       = 'flex';
    mainEl.style.webkitFlex    = '1 1 0';
    mainEl.style.flex          = '1 1 0';
    mainEl.style.flexDirection = 'column';
    mainEl.style.webkitFlexDirection = 'column';
  }

  var contentEl = document.querySelector('.content');
  if (contentEl) {
    contentEl.style.overflowY        = 'hidden';
    contentEl.style.overflow         = 'hidden';
    contentEl.style.display          = 'flex';
    contentEl.style.flexDirection    = 'column';
    contentEl.style.webkitFlexDirection = 'column';
    contentEl.style.height           = '100%';
    contentEl.style.webkitFlex       = '1 1 0';
    contentEl.style.flex             = '1 1 0';
    contentEl.style.minHeight        = '0';
  }

  // page-keuangan: flex column, mengisi .content
  pg.style.display       = 'flex';
  pg.style.flexDirection = 'column';
  pg.style.flex          = '1 1 0';
  pg.style.minHeight     = '0';
  pg.style.overflow      = 'hidden';

  // keu-sticky-header: natural height, flex-shrink:0
  var stickyEl = document.getElementById('keu-sticky-header');
  if (stickyEl) {
    stickyEl.style.flexShrink = '0';
    stickyEl.style.webkitFlexShrink = '0';
  }

  // keu-panels-wrap: flex:1, overflow hidden
  var wrap = document.getElementById('keu-panels-wrap');
  if (wrap) {
    wrap.style.display       = 'flex';
    wrap.style.flex          = '1 1 0';
    wrap.style.webkitFlex    = '1 1 0';
    wrap.style.minHeight     = '0';
    wrap.style.overflow      = 'hidden';
    wrap.style.flexDirection = 'column';
  }

  _keuApplyNeracaFlexChain();
}

function _keuApplyNeracaFlexChain() {
  var neracaPanel = document.getElementById('keu-panel-neraca');
  if (!neracaPanel) return;

  // Panel aktif: flex:1 mengisi wrap
  var activePanel = document.querySelector('.keu-panel.active');
  if (activePanel) {
    activePanel.style.flex       = '1 1 0';
    activePanel.style.webkitFlex = '1 1 0';
    activePanel.style.minHeight  = '0';
    activePanel.style.overflow   = 'hidden';
  }

  // Neraca panel khusus:
  // - Portrait mobile (<=600px): flex column chain
  // - Landscape HP + Laptop (>600px): clear inline style, CSS grid 1fr 1fr yang handle
  if (neracaPanel.classList.contains('active')) {
    if (window.innerWidth <= 600) {
      neracaPanel.style.display             = 'flex';
      neracaPanel.style.flexDirection       = 'column';
      neracaPanel.style.webkitFlexDirection = 'column';

      var minicards = document.getElementById('keu-neraca-minicards-wrap');
      if (minicards) { minicards.style.flexShrink = '0'; minicards.style.webkitFlexShrink = '0'; }

      var sectionBar = document.getElementById('keu-neraca-section-bar');
      if (sectionBar) { sectionBar.style.flexShrink = '0'; sectionBar.style.webkitFlexShrink = '0'; }

      var scrollZone = document.getElementById('keu-neraca-scroll-zone');
      if (scrollZone) {
        scrollZone.style.flex                    = '1 1 0';
        scrollZone.style.webkitFlex              = '1 1 0';
        scrollZone.style.minHeight               = '0';
        scrollZone.style.overflowY               = 'auto';
        scrollZone.style.webkitOverflowScrolling = 'touch';
        scrollZone.style.overscrollBehavior      = 'none';
      }
    } else {
      // Landscape HP + Laptop — clear semua inline style, CSS grid 1fr 1fr yang handle
      neracaPanel.style.display             = '';
      neracaPanel.style.flexDirection       = '';
      neracaPanel.style.webkitFlexDirection = '';

      var minicards2 = document.getElementById('keu-neraca-minicards-wrap');
      if (minicards2) { minicards2.style.flexShrink = ''; minicards2.style.webkitFlexShrink = ''; }

      var sectionBar2 = document.getElementById('keu-neraca-section-bar');
      if (sectionBar2) { sectionBar2.style.flexShrink = ''; sectionBar2.style.webkitFlexShrink = ''; }

      var scrollZone2 = document.getElementById('keu-neraca-scroll-zone');
      if (scrollZone2) {
        scrollZone2.style.flex                    = '';
        scrollZone2.style.webkitFlex              = '';
        scrollZone2.style.minHeight               = '';
        scrollZone2.style.overflowY               = '';
        scrollZone2.style.webkitOverflowScrolling = '';
        scrollZone2.style.overscrollBehavior      = '';
      }
    }
  } else {
    neracaPanel.style.display = '';
  }

  // ── Hutang panel: flex chain lengkap saat aktif (portrait <=600px) ──
  var hutangPanel = document.getElementById('keu-panel-hutang');
  if (hutangPanel && hutangPanel.classList.contains('active') && window.innerWidth <= 600) {
    hutangPanel.style.display             = 'flex';
    hutangPanel.style.webkitDisplay       = '-webkit-flex';
    hutangPanel.style.flexDirection       = 'column';
    hutangPanel.style.webkitFlexDirection = 'column';
    hutangPanel.style.flex                = '1 1 0';
    hutangPanel.style.webkitFlex          = '1 1 0';
    hutangPanel.style.minHeight           = '0';
    hutangPanel.style.overflow            = 'hidden';

    var collapseEl = document.getElementById('keu-hutang-collapsible');
    if (collapseEl) {
      collapseEl.style.flexShrink         = '0';
      collapseEl.style.webkitFlexShrink   = '0';
    }

    var hutangScroll = document.getElementById('keu-hutang-scroll-zone');
    if (hutangScroll) {
      hutangScroll.style.flex                    = '1 1 0';
      hutangScroll.style.webkitFlex              = '1 1 0';
      hutangScroll.style.minHeight               = '0';
      hutangScroll.style.height                  = '';
      hutangScroll.style.maxHeight               = '';
      hutangScroll.style.overflowY               = 'auto';
      hutangScroll.style.webkitOverflowScrolling = 'touch';
      hutangScroll.style.overscrollBehavior      = 'none';
      hutangScroll.style.touchAction             = 'pan-y';
    }
  }
}

function _keuSetPanelHeight() {
  _keuApplyNeracaFlexChain();
}

// Recalc tinggi setiap kali sticky-header atau minicards collapse/expand selesai (transisi 0.25s)
(function() {
  const header    = document.getElementById('keu-sticky-header');
  const minicards = document.getElementById('keu-neraca-minicards-wrap');
  if (header)    header.addEventListener('transitionend',    function(e) { if (e.propertyName === 'max-height') setTimeout(_keuSetPanelHeight, 16); });
  if (minicards) minicards.addEventListener('transitionend', function(e) { if (e.propertyName === 'max-height') setTimeout(_keuSetPanelHeight, 16); });
})();

window.addEventListener('resize', function() {
  const pg = document.getElementById('page-keuangan');
  if (pg && pg.classList.contains('active')) _keuEnsureFlexLayout();
});
window.addEventListener('orientationchange', function() {
  const pg = document.getElementById('page-keuangan');
  if (!pg || !pg.classList.contains('active')) return;
  setTimeout(_keuEnsureFlexLayout, 300);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', function() {
    const pg = document.getElementById('page-keuangan');
    if (pg && pg.classList.contains('active')) _keuSetPanelHeight();
  });
}

// ─── HOOK zenot:page ───────────────────────────────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'keuangan') {
    document.body.classList.remove('keu-active');
    return;
  }
  setTimeout(_keuEnsureFlexLayout, 60);
});

function keuRefreshAktif() {
  if (_keuTabAktif === 'hutang')  keuLoadHutang();
  if (_keuTabAktif === 'neraca')  keuRenderNeraca();
  if (_keuTabAktif === 'rasio')   keuRenderRasio();
  if (_keuTabAktif === 'valuasi') keuRenderValuasi();
  if (_keuTabAktif === 'aruskas') keuRenderArusKas();
  if (_keuTabAktif === 'fixcost') fcLoad();
}

// Toggle tampilan ASET ↔ KEWAJIBAN & MODAL (khusus mobile, lihat CSS @media max-width:600px)
// ─── NERACA VIEW TOGGLE — satu tombol ASET ↔ KEWAJIBAN ──────────
let _keuNeracaView = 'aset'; // state: 'aset' | 'kewajiban'

function keuNeracaViewToggle() {
  _keuNeracaView = _keuNeracaView === 'aset' ? 'kewajiban' : 'aset';
  keuNeracaApplyView();
  // scroll ke atas zona konten (bagian 3)
  const zone = document.getElementById('keu-neraca-scroll-zone');
  if (zone) zone.scrollTop = 0;
  // keuNeracaExpandHeader() sengaja tidak dipanggil di sini
  // agar tab bar tetap collapsed jika sedang collapsed
}

function keuNeracaApplyView(asetCount, kwjCount) {
  const cardAset = document.getElementById('keu-neraca-card-aset');
  const cardKwj  = document.getElementById('keu-neraca-card-kewajiban');
  const secAset  = document.getElementById('keu-neraca-section-aset');
  const secKwj   = document.getElementById('keu-neraca-section-kwj');
  const cntKwj   = document.getElementById('keu-neraca-kwj-count');
  const cntAset  = document.getElementById('keu-neraca-aset-count');
  const zone     = document.getElementById('keu-neraca-scroll-zone');

  if (asetCount !== undefined) {
    if (cntKwj)  cntKwj.textContent  = kwjCount  ?? '—';
    if (cntAset) cntAset.textContent = asetCount ?? '—';
  }

  const isAset = _keuNeracaView === 'aset';

  const isWide = window.innerWidth > 600;

  if (isWide) {
    // Laptop + landscape: tampilkan keduanya side by side
    if (cardAset) cardAset.style.display = '';
    if (cardKwj)  cardKwj.style.display  = '';
    if (secAset)  secAset.style.display  = 'none';
    if (secKwj)   secKwj.style.display   = 'none';
    if (zone) {
      zone.style.display             = 'grid';
      zone.style.gridTemplateColumns = '1fr 1fr';
      zone.style.gap                 = '14px';
      zone.style.alignItems          = 'start';
    }
  } else {
    // Portrait mobile: toggle satu per satu
    if (cardAset)  cardAset.style.display  = isAset ? '' : 'none';
    if (cardKwj)   cardKwj.style.display   = isAset ? 'none' : '';
    if (secAset)   secAset.style.display   = isAset ? '' : 'none';
    if (secKwj)    secKwj.style.display    = isAset ? 'none' : '';
    if (zone) {
      zone.style.display             = '';
      zone.style.gridTemplateColumns = '';
      zone.style.gap                 = '';
      zone.style.alignItems          = '';
    }
  }

  // Scroll zone kembali ke atas saat ganti view
  if (zone) zone.scrollTop = 0;
}

function keuNeracaToggle(view) {
  // legacy — tidak dipakai lagi tapi dijaga agar tidak error
  _keuNeracaView = view;
  keuNeracaApplyView();
}

function keuNeracaExpandHeader() {
  const header = document.getElementById('keu-sticky-header');
  if (header) header.classList.remove('keu-header-collapsed');
}

// ─── SWIPE GESTURE — keu-sticky-header collapse/expand ───────────────────────
// Collapse : swipe UP di scroll-zone → langsung collapse (1x)
// Expand   : swipe DOWN 2x di scroll-zone dalam 600ms → expand
(function() {
  var _isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var _collapseInit  = false;
  var _expandInit    = false;

  function _keuInitSwipe() {
    if (!_isTouchDevice) return;

    var zone   = document.getElementById('keu-neraca-scroll-zone');
    var header = document.getElementById('keu-sticky-header');
    if (!zone || !header) return;

    // ── COLLAPSE: swipe UP di scroll-zone (1x, langsung) ──
    if (!_collapseInit) {
      _collapseInit = true;
      var _startY = 0, _startX = 0, _tracking = false;
      zone.addEventListener('touchstart', function(e) {
        if (e.target.closest('button') || e.target.closest('input')) return;
        _startY   = e.touches[0].clientY;
        _startX   = e.touches[0].clientX;
        _tracking = true;
      }, { passive: true });
      zone.addEventListener('touchend', function(e) {
        if (!_tracking) return;
        _tracking = false;
        var dy = e.changedTouches[0].clientY - _startY;
        var dx = e.changedTouches[0].clientX - _startX;
        if (Math.abs(dx) > Math.abs(dy)) return;
        if (dy < -50) {
          header.classList.add('keu-header-collapsed');
        }
      }, { passive: true });
    }

    // ── EXPAND: 2x swipe DOWN di scroll-zone dalam 600ms ──
    if (!_expandInit) {
      _expandInit = true;
      var _s1Y = 0, _s1X = 0, _s1Done = false, _s1Time = 0;
      zone.addEventListener('touchstart', function(e) {
        if (e.target.closest('button') || e.target.closest('input')) return;
        _s1Y = e.touches[0].clientY;
        _s1X = e.touches[0].clientX;
        if (_s1Done && Date.now() - _s1Time > 600) { _s1Done = false; }
      }, { passive: true });
      zone.addEventListener('touchend', function(e) {
        if (!header.classList.contains('keu-header-collapsed')) return;
        var dy = e.changedTouches[0].clientY - _s1Y;
        var dx = e.changedTouches[0].clientX - _s1X;
        if (Math.abs(dx) > Math.abs(dy)) return;
        if (dy < 50) return;
        var now = Date.now();
        if (!_s1Done) {
          _s1Done = true;
          _s1Time = now;
        } else if (now - _s1Time <= 600) {
          keuNeracaExpandHeader();
          _s1Done = false;
        } else {
          _s1Done = true;
          _s1Time = now;
        }
      }, { passive: true });
    }
  }

  setTimeout(_keuInitSwipe, 250);
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'keuangan') return;
    setTimeout(function() {
      keuNeracaExpandHeader();
      _keuInitSwipe();
    }, 80);
  });
})();

function initKeuNeracaScrollCollapse() { /* deprecated */ }

// ─── HUTANG: hide-on-scroll (collapsible) + riwayat swipe ────────────────────
(function() {

  function _initHutangScroll() {
    var collapseEl = document.getElementById('keu-hutang-collapsible');
    if (!collapseEl) return;
    // Reset: pastikan expanded saat tab hutang dibuka
    collapseEl.classList.remove('keu-hutang-collapsed');
    // Collapse/expand logic digabung ke _initRiwayatSwipe touchend (vertikal handler)
  }

  // ── Riwayat swipe (Daftar ↔ Ringkasan per Kreditur) ──
  var _rwCurrent = 0;

  function _initRiwayatSwipe() {
    var zone = document.getElementById('keu-hutang-scroll-zone');
    if (!zone || zone._swipeInited) return;
    zone._swipeInited = true;

    var TOTAL = 3;
    var startX = 0, startY = 0, startT = 0, isDragging = false, isHoriz = null;

    function goTo(idx) {
      if (idx < 0 || idx >= TOTAL) return;
      _rwCurrent = idx;
      // Show/hide slides via inline style
      for (var i = 0; i < TOTAL; i++) {
        var sl = document.getElementById('keu-slide-' + i);
        if (sl) sl.style.display = (i === idx) ? 'block' : 'none';
      }
      // Update dots — tiap slide punya 3 dot, posisi idx = dot aktif
      document.querySelectorAll('.keu-hdot').forEach(function(d, i) {
        d.classList.toggle('active', (i % 3) === idx);
      });
      // Scroll ke atas saat ganti slide
      zone.scrollTop = 0;
      // Render ringkasan saat pindah ke slide 2
      if (idx === 2) _renderRiwayatSummary();
    }

    // Expose goTo ke window agar tombol desktop bisa memanggil
    window._keuGoToSlide = goTo;

    zone.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
      isDragging = true;
      isHoriz = null;
    }, { passive: true });

    zone.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      if (isHoriz === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHoriz = Math.abs(dx) > Math.abs(dy);
      }
      if (isHoriz) e.preventDefault();
    }, { passive: false });

    // state untuk 2x swipe DOWN expand
    var _downCount = 0, _downTime = 0;

    zone.addEventListener('touchend', function(e) {
      if (!isDragging) return;
      isDragging = false;

      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      var dt = Date.now() - startT;

      if (isHoriz) {
        // ── Horizontal: ganti slide ──
        var isFlick = Math.abs(dx) / Math.max(dt, 1) > 0.3;
        if ((dx < -40 || (isFlick && dx < 0)) && _rwCurrent < TOTAL - 1) goTo(_rwCurrent + 1);
        else if ((dx > 40 || (isFlick && dx > 0)) && _rwCurrent > 0) goTo(_rwCurrent - 1);
      } else {
        // ── Vertikal: collapse / expand minicard ──
        if (Math.abs(dy) < 40) return;
        var collapseEl = document.getElementById('keu-hutang-collapsible');
        if (!collapseEl) return;

        // Cari scroll container aktif di slide yang tampil
        var activeSlide = zone.querySelector('.keu-hutang-slide:not([style*="display: none"]):not([style*="display:none"])');
        var activeScroll = activeSlide
          ? (activeSlide.querySelector('.tbl-wrap') || activeSlide.querySelector('#keu-riwayat-summary-body'))
          : null;
        var atTop = !activeScroll || activeScroll.scrollTop <= 2;

        if (dy < 0 && atTop) {
          // Swipe UP saat di atas → collapse
          collapseEl.classList.add('keu-hutang-collapsed');
          _downCount = 0;
        } else if (dy > 0 && collapseEl.classList.contains('keu-hutang-collapsed')) {
          // Swipe DOWN saat collapsed → butuh 2x dalam 500ms
          var now = Date.now();
          if (_downCount === 0 || now - _downTime > 500) {
            _downCount = 1;
            _downTime  = now;
          } else if (now - _downTime <= 500) {
            collapseEl.classList.remove('keu-hutang-collapsed');
            _downCount = 0;
          }
        }
      }
    }, { passive: true });

    zone.addEventListener('touchcancel', function() { isDragging = false; isHoriz = null; }, { passive: true });
  }

  // Render ringkasan per kreditur dari _keuHutangAll + _keuBayarAll
  function _renderRiwayatSummary() {
    var body = document.getElementById('keu-riwayat-summary-body');
    if (!body) return;

    // _keuHutangAll adalah let di scope module — akses via window tidak reliable
    // window._keuBayarAll di-set di keuLoadHutang
    var hutangList = (typeof _keuHutangAll !== 'undefined' ? _keuHutangAll : null) || window._keuHutangAll || [];
    var bayarList  = window._keuBayarAll || [];

    if (!hutangList.length) {
      body.innerHTML = '<div style="padding:12px;color:var(--ink3);font-size:13px">Belum ada data hutang.</div>';
      return;
    }

    body.innerHTML = hutangList.map(function(h) {
      // Hitung sudah_bayar dari _keuBayarAll (akurat, sama dengan panel lain)
      var sudahBayar = bayarList
        .filter(function(b) { return String(b.hutang_id) === String(h.id); })
        .reduce(function(s, b) { return s + (Number(b.nominal) || 0); }, 0);
      var sisa = Math.max(0, (h.pokok || 0) - sudahBayar);
      var pct  = h.pokok ? Math.round(sudahBayar / h.pokok * 100) : 0;
      var bar  = Math.max(0, Math.min(100, pct));
      var isLunas = sisa <= 0;
      return '<div class="keu-riwayat-kredit-card">' +
        '<div class="krc-name"><i class="ti ti-building-bank"></i> ' + (h.kreditur || '—') +
          (isLunas ? ' <span style="font-size:10px;color:var(--ok)">✅ LUNAS</span>' : '') + '</div>' +
        '<div class="krc-row"><span>Pokok</span><span class="krc-val">' + _fmtRp(h.pokok || 0) + '</span></div>' +
        '<div class="krc-row"><span>Sudah Bayar</span><span class="krc-val" style="color:var(--ok)">' + _fmtRp(sudahBayar) + '</span></div>' +
        '<div class="krc-row"><span>Sisa Hutang</span><span class="krc-val" style="color:' + (isLunas ? 'var(--ok)' : 'var(--danger)') + '">' + _fmtRp(sisa) + '</span></div>' +
        '<div style="margin-top:7px;height:5px;border-radius:3px;background:var(--ink3);overflow:hidden">' +
          '<div style="width:' + bar + '%;height:100%;background:var(--ok);transition:width .5s ease"></div>' +
        '</div>' +
        '<div style="text-align:right;font-size:10px;color:var(--ink3);margin-top:2px">' + pct + '% lunas</div>' +
      '</div>';
    }).join('');
  }

  // Helper format Rp (reuse pola yang sama dengan keuangan.js)
  function _fmtRp(n) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  // Init saat hutang tab aktif
  function _initAll() {
    _initHutangScroll();
    _initRiwayatSwipe();
    // Flex chain di-handle oleh _keuApplyNeracaFlexChain (sudah dipanggil via _keuSetPanelHeight)
    _keuSetPanelHeight();
  }

  // Hook ke tab hutang
  var _origKeuGotoTab = window.keuGotoTab;
  window.keuGotoTab = function(tab) {
    _origKeuGotoTab(tab);
    if (tab === 'hutang') {
      setTimeout(function() {
        _initAll();
        _renderRiwayatSummary();
      }, 80);
    }
  };

  // Hook zenot:page
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'keuangan') return;
    setTimeout(function() {
      if (window._keuTabAktif === 'hutang' || !window._keuTabAktif) _initAll();
    }, 120);
  });

  // Expose untuk akses luar
  window._renderRiwayatSummary = _renderRiwayatSummary;
  window._keuRwCurrent = function() { return _rwCurrent; };

  // Init awal
  setTimeout(_initAll, 300);
})();

// ─── DESKTOP SLIDE NAV ◀▶ ────────────────────────────────────
// Cycling infinite: 0→1→2→0→1→2 (dan sebaliknya)
function keuSlideNav(dir) {
  var current = typeof window._keuRwCurrent === 'function' ? window._keuRwCurrent() : 0;
  var next = ((current + dir) % 3 + 3) % 3;
  if (typeof window._keuGoToSlide === 'function') window._keuGoToSlide(next);
}

// ─── HUTANG ──────────────────────────────────────────────────
async function keuLoadHutang() {
  try {
    const [hutang, bayar] = await Promise.all([
      dbGet('hutang', '&order=created_at.desc'),
      dbGet('hutang_bayar', '&order=tanggal.desc'),
    ]);
    _keuHutangAll = hutang || [];
    window._keuHutangAll = _keuHutangAll; // expose ke window untuk akses dari IIFE
    window._keuBayarAll = bayar || []; // expose untuk laporan di kas.js
    keuRenderHutangTabel(_keuHutangAll, bayar || []);
    keuRenderBayarTabel(bayar || [], _keuHutangAll);
    keuUpdateHutangSummary(_keuHutangAll, bayar || []);
    keuPopulateBayarDropdown(_keuHutangAll);
    keuPopulateAkunBayar();
    // Render slide 3 langsung setelah data ready — tidak nunggu swipe
    if (typeof window._renderRiwayatSummary === 'function') window._renderRiwayatSummary();
  } catch(e) {
    document.getElementById('keu-hutang-tbody').innerHTML = `<tr><td colspan="10" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
  }
}

function keuGetSudahBayar(hutangId, bayarList) {
  return bayarList.filter(b => String(b.hutang_id) === String(hutangId)).reduce((s,b) => s + (b.nominal||0), 0);
}

function keuRenderHutangTabel(hutang, bayar) {
  const tbody = document.getElementById('keu-hutang-tbody');
  if (!hutang.length) { tbody.innerHTML = `<tr><td colspan="10" style="color:var(--ink3);font-style:italic">Belum ada hutang</td></tr>`; return; }
  const fmtRp = v => fmtRpFull(v||0);
  const jenisLabel = { bank:'🏦 Bank/KUR', keluarga:'👨‍👩‍👧 Keluarga', investor:'💼 Investor', lainnya:'📋 Lainnya' };
  tbody.innerHTML = hutang.map(h => {
    const sudahBayar = keuGetSudahBayar(h.id, bayar);
    const sisa       = (h.pokok||0) - sudahBayar;
    const isLunas    = sisa <= 0;
    const jatuhTempo = h.jatuh_tempo ? new Date(h.jatuh_tempo).toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '—';
    const safeKreditur = (h.kreditur||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    return `<tr>
      <td style="font-weight:700">${h.kreditur||'—'}</td>
      <td style="font-size:12px">${jenisLabel[h.jenis]||h.jenis||'—'}</td>
      <td style="text-align:right">${fmtRp(h.pokok)}</td>
      <td style="text-align:right;font-size:12px;color:var(--ink3)">${h.bunga ? h.bunga+'%/thn' : '—'}</td>
      <td style="text-align:right">${(h.cicilan_nominal||h.cicilan_per_bulan) ? fmtRp(h.cicilan_nominal||h.cicilan_per_bulan) + '<br><span style="font-size:10px;color:var(--ink3)">/' + (h.frekuensi==='tahunan'?'thn':'bln') + '</span>' : '—'}</td>
      <td style="text-align:right;color:var(--ok)">${fmtRp(sudahBayar)}</td>
      <td style="text-align:right;font-weight:700;color:${isLunas?'var(--ok)':'var(--danger)'}">${isLunas ? '✅ LUNAS' : fmtRp(sisa)}</td>
      <td style="font-size:12px">${jatuhTempo}</td>
      <td><span class="${isLunas ? 'hutang-status-lunas' : 'hutang-status-aktif'}">${isLunas ? '✅ Lunas' : '⏳ Aktif'}</span></td>
      <td>
        <button class="btn btn-sm" data-action="edit-hutang" data-id="${h.id}" style="margin-right:4px"><i class="ti ti-edit"></i></button>
        <button class="btn btn-sm btn-danger" data-action="hapus-hutang" data-id="${h.id}" data-nama="${safeKreditur}"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function keuRenderBayarTabel(bayar, hutang) {
  const tbody = document.getElementById('keu-bayar-tbody');
  if (!bayar.length) { tbody.innerHTML = `<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Belum ada pembayaran</td></tr>`; return; }
  const htgMap = {}; hutang.forEach(h => htgMap[h.id] = h);
  const fmtRp = v => fmtRpFull(v||0);
  tbody.innerHTML = bayar.map(b => {
    const tgl = new Date(b.tanggal).toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'2-digit'});
    const h   = htgMap[b.hutang_id];
    return `<tr>
      <td>${tgl}</td>
      <td style="font-weight:700">${h ? h.kreditur : '—'}</td>
      <td>${b.keterangan||'—'}</td>
      <td style="text-align:right;color:var(--ok);font-weight:700">${fmtRp(b.nominal)}</td>
      <td><button class="btn btn-sm btn-danger" data-action="hapus-bayar" data-id="${b.id}"><i class="ti ti-trash"></i></button></td>
    </tr>`;
  }).join('');
  // Refresh ringkasan swipe slide 1 jika sudah visible
  if (typeof window._renderRiwayatSummary === 'function') {
    setTimeout(window._renderRiwayatSummary, 50);
  }
}

function keuUpdateHutangSummary(hutang, bayar) {
  const totalPokok   = hutang.reduce((s,h) => s+(h.pokok||0), 0);
  const totalBayar   = bayar.reduce((s,b) => s+(b.nominal||0), 0);
  const totalSisa    = hutang.reduce((s,h) => s + Math.max(0,(h.pokok||0) - keuGetSudahBayar(h.id, bayar)), 0);
  const totalCicilan = hutang.filter(h => {
    const sisa = (h.pokok||0) - keuGetSudahBayar(h.id, bayar);
    return sisa > 0;
  }).reduce((s,h) => s+(h.cicilan_per_bulan||0), 0);
  const fmtRp = v => fmtRpFull(v);
  document.getElementById('keu-total-hutang').textContent  = fmtRp(totalPokok);
  document.getElementById('keu-total-bayar').textContent   = fmtRp(totalBayar);
  document.getElementById('keu-total-sisa').textContent    = fmtRp(totalSisa);
  document.getElementById('keu-total-cicilan').textContent = fmtRp(totalCicilan);
}

function keuPopulateBayarDropdown(hutang) {
  const sel = document.getElementById('keu-bayar-hutang-id');
  sel.innerHTML = '<option value="">— Pilih Hutang —</option>' +
    hutang.map(h => `<option value="${h.id}">${h.kreditur} (Rp${(h.pokok||0).toLocaleString('id-ID')})</option>`).join('');
  // Render ke picker list
  var list = document.getElementById('keu-picker-bayar-list');
  if (list) {
    var html = '<div class="kas-akun-item" data-val="" onclick="keuPickerSelect(this)"><span style="color:var(--ink3)">— Pilih Hutang —</span></div>';
    hutang.forEach(function(h) {
      html += '<div class="kas-akun-item" data-val="' + h.id + '" onclick="keuPickerSelect(this)">' +
        h.kreditur + ' (Rp' + (h.pokok||0).toLocaleString('id-ID') + ')</div>';
    });
    list.innerHTML = html;
  }
  // Reset label picker
  var lbl = document.getElementById('keu-picker-bayar-label');
  if (lbl) { lbl.textContent = '— Pilih Hutang —'; lbl.style.color = 'var(--ink3)'; }
}

function keuShowFormHutang(data) {
  document.getElementById('keu-hutang-form-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Hutang';
  document.getElementById('keu-htg-id').value            = '';
  document.getElementById('keu-htg-kreditur').value      = data?.kreditur || '';
  document.getElementById('keu-htg-jenis').value         = data?.jenis || 'bank';
  keuPopulateAkunHutang(data?.akun_kwj_id || '', data?.akun_aset_id || '');
  idrSet('keu-htg-pokok', data?.pokok || 0);
  document.getElementById('keu-htg-bunga').value         = data?.bunga || '';
  document.getElementById('keu-htg-tenor').value         = data?.tenor || '';
  document.getElementById('keu-htg-frekuensi').value     = data?.frekuensi || 'bulanan';
  var tenorLbl = document.getElementById('keu-htg-tenor-label');
  if (tenorLbl) tenorLbl.textContent = (data?.frekuensi === 'tahunan') ? '(tahun)' : '(bulan)';
  idrSet('keu-htg-cicilan', data?.cicilan_per_bulan || 0);
  document.getElementById('keu-htg-tgl-mulai').value     = data?.tgl_mulai ? data.tgl_mulai.split('T')[0] : '';
  document.getElementById('keu-htg-jatuh-tempo').value   = data?.jatuh_tempo ? data.jatuh_tempo.split('T')[0] : '';
  document.getElementById('keu-htg-ket').value           = data?.keterangan || '';
  showModal('modal-keu-hutang');
  idrInputAll(); // aktifkan auto-format titik ribuan pada field nominal
}

function keuCancelFormHutang() { hideModal('modal-keu-hutang'); }

async function keuSimpanHutang() {
  const id        = document.getElementById('keu-htg-id').value;
  const akunKwjId = document.getElementById('keu-htg-akun-kwj').value  || null;
  const akunAsetId= document.getElementById('keu-htg-akun-aset').value || null;
  const tglMulai  = document.getElementById('keu-htg-tgl-mulai').value || new Date().toISOString().split('T')[0];
  const data = {
    kreditur:         document.getElementById('keu-htg-kreditur').value.trim(),
    jenis:            document.getElementById('keu-htg-jenis').value,
    pokok:            idrVal('keu-htg-pokok'),
    bunga:            parseFloat(document.getElementById('keu-htg-bunga').value) || 0,
    tenor:            parseInt(document.getElementById('keu-htg-tenor').value) || null,
    frekuensi:        document.getElementById('keu-htg-frekuensi').value || 'bulanan',
    cicilan_per_bulan:(function() {
      var nominal = idrVal('keu-htg-cicilan');
      var frek = document.getElementById('keu-htg-frekuensi').value;
      // Simpan nominal asli per periode — untuk tampilan di tabel
      // cicilan_per_bulan dikonversi ke ekuivalen bulanan untuk summary total
      return frek === 'tahunan' ? Math.round(nominal / 12) : nominal;
    })(),
    cicilan_nominal:  idrVal('keu-htg-cicilan'),
    tgl_mulai:        tglMulai,
    jatuh_tempo:      document.getElementById('keu-htg-jatuh-tempo').value || null,
    keterangan:       document.getElementById('keu-htg-ket').value.trim() || null,
    akun_kwj_id:      akunKwjId,
    akun_aset_id:     akunAsetId,
  };
  if (!data.kreditur) { alert('Nama kreditur wajib diisi!'); return; }
  if (!data.pokok)    { alert('Pokok pinjaman wajib diisi!'); return; }
  try {
    if (id) {
      await dbUpdate('hutang', id, data);
    } else {
      // Hutang baru → generate jurnal otomatis jika akun dipilih
      await dbInsert('hutang', data);
      if (akunAsetId && akunKwjId && data.pokok > 0) {
        await dbInsert('jurnal', {
          tanggal:        tglMulai,
          tipe:           'masuk',
          nominal:        data.pokok,
          debit:          data.pokok,
          kredit:         data.pokok,
          akun_debit_id:  akunAsetId,
          akun_kredit_id: akunKwjId,
          keterangan:     'Hutang ' + data.kreditur + (data.keterangan ? ' — ' + data.keterangan : ''),
          referensi:      null,
        });
      }
    }
    keuCancelFormHutang(); keuLoadHutang();
  } catch(e) { alert('Gagal simpan: ' + e.message); }
}

// ─── POPULATE DROPDOWN AKUN DI FORM HUTANG ─────────────────
async function keuPopulateAkunHutang(selectedKwj, selectedAset) {
  const akuns = await dbGet('kas_akun', '&order=kode.asc').catch(() => []);
  const selKwj  = document.getElementById('keu-htg-akun-kwj');
  const selAset = document.getElementById('keu-htg-akun-aset');
  if (!selKwj || !selAset) return;
  const kwjOpts  = akuns.filter(a => a.kelompok === 'kewajiban');
  const asetOpts = akuns.filter(a => a.kelompok === 'aset');
  selKwj.innerHTML  = '<option value="">— pilih akun kewajiban —</option>' +
    kwjOpts.map(a => `<option value="${a.id}" ${String(a.id)===String(selectedKwj)?'selected':''}>${a.kode} · ${a.nama}</option>`).join('');
  selAset.innerHTML = '<option value="">— pilih akun aset/kas —</option>' +
    asetOpts.map(a => `<option value="${a.id}" ${String(a.id)===String(selectedAset)?'selected':''}>${a.kode} · ${a.nama}</option>`).join('');

  // Render picker list kewajiban
  var listKwj = document.getElementById('keu-picker-kwj-list');
  if (listKwj) {
    var html = '<div class="kas-akun-item" data-val="" onclick="keuPickerSelect(this)"><span style="color:var(--ink3)">— pilih akun kewajiban —</span></div>';
    kwjOpts.forEach(function(a) {
      html += '<div class="kas-akun-item' + (String(a.id)===String(selectedKwj)?' active':'') + '" data-val="' + a.id + '" onclick="keuPickerSelect(this)">' + (a.kode ? a.kode + ' · ' : '') + a.nama + '</div>';
    });
    listKwj.innerHTML = html;
  }
  // Render picker list aset
  var listAset = document.getElementById('keu-picker-aset-list');
  if (listAset) {
    var html2 = '<div class="kas-akun-item" data-val="" onclick="keuPickerSelect(this)"><span style="color:var(--ink3)">— pilih akun aset/kas —</span></div>';
    asetOpts.forEach(function(a) {
      html2 += '<div class="kas-akun-item' + (String(a.id)===String(selectedAset)?' active':'') + '" data-val="' + a.id + '" onclick="keuPickerSelect(this)">' + (a.kode ? a.kode + ' · ' : '') + a.nama + '</div>';
    });
    listAset.innerHTML = html2;
  }
  // Sync label picker sesuai nilai selected
  keuSyncPickerLabel('keu-picker-kwj', 'keu-htg-akun-kwj', '— pilih akun kewajiban —');
  keuSyncPickerLabel('keu-picker-aset', 'keu-htg-akun-aset', '— pilih akun aset/kas —');
}

async function keuEditHutang(id) {
  const h = _keuHutangAll.find(x => String(x.id) === String(id)); if (!h) return;
  keuShowFormHutang(h); // ShowForm reset keu-htg-id ke '' — set ID setelahnya
  document.getElementById('keu-hutang-form-title').innerHTML = '<i class="ti ti-edit"></i> Edit Hutang';
  document.getElementById('keu-htg-id').value = h.id; // ← SETELAH ShowForm, bukan sebelum
}

async function keuHapusHutang(id, nama) {
  confirmDelete(`Hapus hutang "${nama}"?`, async () => {
    try { await dbDelete('hutang', id); keuLoadHutang(); } catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

async function keuSimpanPembayaran() {
  const hutangId  = document.getElementById('keu-bayar-hutang-id').value;
  const tgl       = document.getElementById('keu-bayar-tgl').value;
  const ket       = document.getElementById('keu-bayar-ket').value.trim();
  const akunKasId = document.getElementById('keu-bayar-akun-id').value;

  // Baca nominal — flexible: support format titik ribuan ATAU angka biasa
  var nominalEl = document.getElementById('keu-bayar-nominal');
  var nominal   = 0;
  if (nominalEl) {
    var raw = (nominalEl.value || '').toString().replace(/\./g, '').replace(/,/g, '').replace(/[^0-9]/g, '');
    nominal = parseInt(raw, 10) || 0;
  }
  if (!nominal) nominal = idrVal('keu-bayar-nominal');

  if (!hutangId)  { alert('Pilih hutang dulu!');        return; }
  if (!tgl)       { alert('Tanggal wajib diisi!');      return; }
  if (!nominal)   { alert('Nominal wajib diisi!');      return; }
  if (!akunKasId) { alert('Pilih akun bayar dulu!');   return; }

  try {
    await dbInsert('hutang_bayar', { hutang_id: hutangId, tanggal: tgl, nominal, keterangan: ket || null });

    // Generate jurnal double-entry
    const htg = _keuHutangAll.find(h => String(h.id) === String(hutangId));
    // akun kewajiban: dari data hutang jika ada, fallback cari by nama kreditur
    const akunKwjId = htg && htg.akun_kwj_id ? htg.akun_kwj_id : null;

    if (akunKwjId) {
      // Debit kewajiban (hutang berkurang) | Kredit kas (kas berkurang)
      await dbInsert('jurnal', {
        tanggal:        tgl,
        tipe:           'keluar',
        nominal:        nominal,
        debit:          nominal,
        kredit:         nominal,
        akun_debit_id:  akunKwjId,  // kewajiban berkurang
        akun_kredit_id: akunKasId,  // kas keluar
        keterangan:     'Bayar cicilan ' + (htg ? htg.kreditur : '') + (ket ? ' — ' + ket : ''),
        referensi:      null,
      });
    } else {
      // Hutang belum punya akun kewajiban — buat jurnal kas keluar saja
      // agar saldo kas tetap bergerak
      await dbInsert('jurnal', {
        tanggal:        tgl,
        tipe:           'keluar',
        nominal:        nominal,
        debit:          nominal,
        kredit:         nominal,
        akun_debit_id:  null,
        akun_kredit_id: akunKasId,
        keterangan:     'Bayar cicilan ' + (htg ? htg.kreditur : '') + (ket ? ' — ' + ket : '') + ' (akun kwj belum diset)',
        referensi:      null,
      });
    }

    // Simpan akun terakhir ke localStorage
    try { localStorage.setItem('keu_last_bayar_akun', akunKasId); } catch(e) {}

    idrSet('keu-bayar-nominal', 0);
    document.getElementById('keu-bayar-ket').value = '';
    keuCloseCicilan();
    keuLoadHutang();
    if (typeof loadDashboard === 'function') loadDashboard();
  } catch(e) { alert('Gagal simpan: ' + e.message); }
}

async function keuHapusBayar(id) {
  confirmDelete('Hapus catatan pembayaran ini?', async () => {
    try { await dbDelete('hutang_bayar', id); keuLoadHutang(); } catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// ─── LOAD DATA KAS & JURNAL ──────────────────────────────────
async function keuLoadKasData() {
  try {
    const [akun, jurnal] = await Promise.all([
      dbGet('kas_akun', '&order=kode.asc'),
      dbGet('jurnal', '&order=tanggal.asc'),
    ]);
    _keuKasAkun   = akun   || [];
    _keuKasJurnal = jurnal || [];
  } catch(e) { _keuKasAkun = []; _keuKasJurnal = []; }
}

function keuHitungSaldoAkun() {
  const akunMap = {}; _keuKasAkun.forEach(a => { akunMap[a.id] = {...a, saldoDebit:0, saldoKredit:0}; });
  _keuKasJurnal.forEach(r => {
    const n = r.nominal || r.debit || 0;
    if (akunMap[r.akun_debit_id])  akunMap[r.akun_debit_id].saldoDebit   += n;
    if (akunMap[r.akun_kredit_id]) akunMap[r.akun_kredit_id].saldoKredit += n;
  });
  return akunMap;
}

function keuGetTotalByKelompok(akunMap, kelompok) {
  return Object.values(akunMap).filter(a => a.kelompok === kelompok).reduce((s,a) => {
    const saldo = ['aset','beban'].includes(a.kelompok) ? a.saldoDebit - a.saldoKredit : a.saldoKredit - a.saldoDebit;
    return s + Math.max(0, saldo);
  }, 0);
}

// ─── NERACA ──────────────────────────────────────────────────
var _nilaiPersediaanOtomatis = 0;

// Helper: hitung nilai persediaan dari tabel produk + stok + penjualan
// Dipanggil oleh Neraca dan Rasio agar hasilnya konsisten
async function keuHitungNilaiPersediaan() {
  try {
    const [produkArr, stokArr, jualArr] = await Promise.all([
      dbGet('produk', '').catch(()=>[]),
      dbGet('stok',   '').catch(()=>[]),
      dbGet('jurnal_penjualan', '&select=sku,qty').catch(()=>[])
    ]);
    const stokMap   = {};
    (stokArr||[]).forEach(s => { stokMap[(s.sku_variasi||'').toUpperCase()] = s.stok_masuk||0; });
    const keluarMap = {};
    (jualArr||[]).forEach(j => { const k=(j.sku||'').toUpperCase(); keluarMap[k]=(keluarMap[k]||0)+(j.qty||0); });
    let nilai = 0;
    (produkArr||[]).forEach(p => {
      const key  = (p.sku_variasi||'').toUpperCase();
      const sisa = (stokMap[key]||0) - (keluarMap[key]||0);
      if (sisa > 0) nilai += sisa * (p.hpp||0);
    });
    _nilaiPersediaanOtomatis = nilai;
    return nilai;
  } catch(e) {
    console.warn('[PERSEDIAAN]', e);
    return _nilaiPersediaanOtomatis || 0;
  }
}

async function keuRenderNeraca() {
  await keuLoadKasData();
  // Pastikan data hutang selalu fresh — tidak bergantung tab Hutang sudah dibuka duluan
  const [hutangFresh, bayar, shopeeCacheArr] = await Promise.all([
    dbGet('hutang', '&order=created_at.desc').catch(() => []),
    dbGet('hutang_bayar').catch(() => []),
    fetch(SUPABASE_URL + '/rest/v1/shopee_finance_cache?select=*&order=fetched_at.desc&limit=1',
      { headers: _headers() }).then(r => r.ok ? r.json() : []).catch(() => [])
  ]);
  _keuHutangAll = hutangFresh || [];
  const akunMap = keuHitungSaldoAkun();
  const fmtRp = v => fmtRpFull(v||0);

  // ASET — dikelompokkan: Kas & Saku, Escrow Shopee, Aset Lainnya
  const asetAkun  = Object.values(akunMap).filter(a => a.kelompok === 'aset');
  const isKasBank = a => (a.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
  const kasAkun   = asetAkun.filter(isKasBank);
  const lainAkun  = asetAkun.filter(a => !isKasBank(a));

  // Escrow Shopee (Wallet Shopee sengaja tidak ditampilkan — data tidak reliable via API)
  const shopeeCache = (shopeeCacheArr && shopeeCacheArr.length > 0) ? shopeeCacheArr[0] : null;
  const escrow = shopeeCache ? Number(shopeeCache.escrow_transit || 0) : 0;

  // Nilai Persediaan — pakai helper agar konsisten dengan tab Rasio
  const nilaiPersediaan = await keuHitungNilaiPersediaan();

  // Hitung subtotal dulu (dibutuhkan untuk persentase)
  const totalKas = kasAkun.reduce((s,a) => s + Math.max(0, a.saldoDebit - a.saldoKredit), 0);
  const totalLain = lainAkun.reduce((s,a) => s + Math.max(0, a.saldoDebit - a.saldoKredit), 0) + nilaiPersediaan;
  const totalAset = totalKas + escrow + totalLain;
  const pctAset = v => totalAset > 0 ? ` <span style="color:var(--ink3);font-size:11px">(${(v/totalAset*100).toFixed(1)}%)</span>` : '';
  const grpHdr = label => `<tr><td colspan="2" style="padding-top:10px;padding-bottom:2px;color:var(--ink3);font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase">${label}</td></tr>`;

  let asetHtml = '';
  // Grup 1: Kas & Saku
  asetHtml += grpHdr('Kas dan Setara Kas');
  if (kasAkun.length) {
    kasAkun.forEach(a => {
      const saldo = Math.max(0, a.saldoDebit - a.saldoKredit);
      asetHtml += `<tr><td style="padding-left:12px">${a.nama}</td><td style="text-align:right;color:var(--ok)">${fmtRp(saldo)}${pctAset(saldo)}</td></tr>`;
    });
  } else {
    asetHtml += `<tr><td colspan="2" style="padding-left:12px;color:var(--ink3);font-style:italic">Belum ada akun kas/saku</td></tr>`;
  }
  asetHtml += `<tr><td style="padding-left:12px"><b>Total Kas dan Setara Kas</b></td><td style="text-align:right;color:var(--ok)"><b>${fmtRp(totalKas)}</b>${pctAset(totalKas)}</td></tr>`;

  // Grup 2: Shopee (Escrow saja — Wallet disembunyikan, data tidak reliable)
  asetHtml += grpHdr('Shopee');
  asetHtml += `<tr><td style="padding-left:12px">Escrow Shopee${shopeeCache ? ' <span style="color:var(--ok);font-size:10px">● LIVE</span>' : ''}</td><td style="text-align:right;color:var(--ok)">${fmtRp(escrow)}${pctAset(escrow)}</td></tr>`;

  // Grup 3: Aset Lainnya
  asetHtml += grpHdr('Persediaan & Aset Tetap');
  lainAkun.forEach(a => {
    const saldo = Math.max(0, a.saldoDebit - a.saldoKredit);
    asetHtml += `<tr><td style="padding-left:12px">${a.nama}</td><td style="text-align:right;color:var(--ok)">${fmtRp(saldo)}${pctAset(saldo)}</td></tr>`;
  });
  if (nilaiPersediaan > 0) {
    asetHtml += `<tr><td style="padding-left:12px">Persediaan Barang</td><td style="text-align:right;color:var(--ok)">${fmtRp(nilaiPersediaan)}${pctAset(nilaiPersediaan)}</td></tr>`;
  }
  asetHtml += `<tr><td style="padding-left:12px"><b>Total Persediaan & Aset Tetap</b></td><td style="text-align:right;color:var(--ok)"><b>${fmtRp(totalLain)}</b>${pctAset(totalLain)}</td></tr>`;

  document.getElementById('keu-neraca-aset').innerHTML = asetHtml;
  document.getElementById('keu-neraca-total-aset').textContent = fmtRp(totalAset);

  // KEWAJIBAN
  // Sumber kewajiban HANYA dari tabel hutang — tidak campur akun jurnal. Tampil per kreditur + persentase.
  const kwjList = _keuHutangAll.map(h => ({
    nama: h.kreditur || 'Hutang',
    sisa: Math.max(0, (h.pokok||0) - keuGetSudahBayar(h.id, bayar))
  })).filter(x => x.sisa > 0);
  const totalKwj = kwjList.reduce((s,x) => s + x.sisa, 0);
  const pctKwj = v => totalKwj > 0 ? ` <span style="color:var(--ink3);font-size:11px">(${(v/totalKwj*100).toFixed(1)}%)</span>` : '';
  const kwjHtml = kwjList.map(x =>
    `<tr><td style="padding-left:12px">${x.nama}</td><td style="text-align:right;color:var(--danger)">${fmtRp(x.sisa)}${pctKwj(x.sisa)}</td></tr>`
  ).join('');
  document.getElementById('keu-neraca-kewajiban').innerHTML = kwjHtml || `<tr><td colspan="2" style="color:var(--ink3);font-style:italic">Tidak ada kewajiban</td></tr>`;
  document.getElementById('keu-neraca-total-kewajiban').textContent = fmtRp(totalKwj);

  // MODAL
  // Akun modal ditampilkan apa adanya (saldoKredit - saldoDebit).
  // Akun defisit (misal: Def Akumulasi) normalnya ber-saldo Debit,
  // sehingga s = saldoKredit - saldoDebit = negatif → tampil sebagai pengurang ✅
  const modalAkun = Object.values(akunMap).filter(a => a.kelompok === 'modal');
  const pendAkun  = Object.values(akunMap).filter(a => a.kelompok === 'pendapatan');
  const bebanAkun = Object.values(akunMap).filter(a => a.kelompok === 'beban');
  const totalPend  = pendAkun.reduce((s,a)  => s+Math.max(0,a.saldoKredit-a.saldoDebit),0);
  const totalBeban = bebanAkun.reduce((s,a) => s+Math.max(0,a.saldoDebit-a.saldoKredit),0);
  const labaRugi   = totalPend - totalBeban;
  let totalModal = labaRugi;
  let modalHtml = '';
  // Persediaan TIDAK masuk ke Modal — sudah tercatat di sisi Aset
  // Akun modal dari jurnal
  modalAkun.forEach(a => {
    const s = a.saldoKredit - a.saldoDebit;
    totalModal += s;
    const display = s < 0 ? `( ${fmtRp(Math.abs(s))} )` : fmtRp(s);
    const color = s < 0 ? 'var(--danger)' : 'inherit';
    modalHtml += `<tr><td style="padding-left:12px">${a.nama}</td><td style="text-align:right;color:${color}">${display}</td></tr>`;
  });
  modalHtml += `<tr>
    <td style="padding-left:12px;color:${labaRugi>=0?'var(--ok)':'var(--danger)'}">${labaRugi>=0?'Laba':'Rugi'} Berjalan</td>
    <td style="text-align:right;color:${labaRugi>=0?'var(--ok)':'var(--danger)'}">${labaRugi<0?'( ':''} ${fmtRp(Math.abs(labaRugi))} ${labaRugi<0?')':''}</td>
  </tr>`;
  // Tidak ada penyeimbang otomatis — neraca harus seimbang dari data yang benar
  document.getElementById('keu-neraca-modal').innerHTML = modalHtml || `<tr><td colspan="2" style="color:var(--ink3);font-style:italic">Belum ada akun modal</td></tr>`;

  const netWorth = totalAset - totalKwj;
  const nwDisplay = (netWorth < 0 ? '( ' : '') + fmtRp(Math.abs(netWorth)) + (netWorth < 0 ? ' )' : '');
  document.getElementById('keu-neraca-total-km').textContent = nwDisplay;
  document.getElementById('keu-neraca-total-km').style.color = netWorth >= 0 ? 'var(--ok)' : 'var(--danger)';
  document.getElementById('keu-neraca-check').textContent = netWorth >= 0 ? '✅ Sehat' : '⚠ Hutang > Aset';
  document.getElementById('keu-neraca-check').style.color = netWorth >= 0 ? 'var(--ok)' : 'var(--danger)';

  // Update badge toggle: berapa item di masing-masing sisi
  const asetItemCount = kasAkun.length + 1 + lainAkun.length + (nilaiPersediaan > 0 ? 1 : 0); // +1 Escrow
  const kwjItemCount  = kwjList.length + modalAkun.length + 1; // +1 Laba/Rugi
  _keuNeracaView = _keuNeracaView || 'aset';
  keuNeracaApplyView(asetItemCount, kwjItemCount);

  initKeuNeracaScrollCollapse();
}

// ─── RASIO & NET WORTH ────────────────────────────────────────
async function keuRenderRasio() {
  await keuLoadKasData();
  const bayar = await dbGet('hutang_bayar').catch(() => []) || [];
  const akunMap = keuHitungSaldoAkun();
  const fmtRp = v => fmtRpFull(Math.abs(v));

  // Sumber data konsisten dengan keuRenderNeraca():
  // Total Aset = akun aset dari jurnal + persediaan otomatis (stok)
  const totalAsetJurnal = keuGetTotalByKelompok(akunMap, 'aset');
  const persediaan      = await keuHitungNilaiPersediaan();
  const totalAset       = totalAsetJurnal + persediaan;

  // Total Kewajiban = HANYA dari tabel hutang (satu sumber, tidak dobel)
  const totalHutang = _keuHutangAll.reduce((s,h) => s+Math.max(0,(h.pokok||0)-keuGetSudahBayar(h.id,bayar)), 0);

  // Modal = akun modal + laba/rugi berjalan
  const totalPend  = keuGetTotalByKelompok(akunMap, 'pendapatan');
  const totalBeban = keuGetTotalByKelompok(akunMap, 'beban');
  const labaRugi   = totalPend - totalBeban;
  const totalModal = keuGetTotalByKelompok(akunMap, 'modal') + labaRugi;

  // Net Worth = Total Aset − Total Kewajiban (definisi standar akuntansi)
  const netWorth = totalAset - totalHutang;

  const totalCicilan = _keuHutangAll.filter(h => {
    const sisa=(h.pokok||0)-keuGetSudahBayar(h.id,bayar); return sisa>0;
  }).reduce((s,h) => s+(h.cicilan_per_bulan||0), 0);

  // Net Worth card
  document.getElementById('keu-rasio-aset').textContent   = fmtRp(totalAset);
  document.getElementById('keu-rasio-hutang').textContent = fmtRp(totalHutang);
  document.getElementById('keu-networth-val').textContent = (netWorth<0?'-':'') + fmtRp(netWorth);
  document.getElementById('keu-networth-val').style.color = netWorth>=0?'var(--ok)':'var(--danger)';
  document.getElementById('keu-networth-card').className  = 'rasio-item ' + (netWorth>=0?'r-ok':'r-danger');

  // DTA = Total Kewajiban ÷ Total Aset
  const dta = totalAset ? totalHutang / totalAset : 0;
  document.getElementById('keu-dta-val').textContent  = (dta*100).toFixed(1)+'%';
  document.getElementById('keu-dta-desc').textContent = `${fmtRp(totalHutang)} ÷ ${fmtRp(totalAset)}`;
  document.getElementById('keu-dta-card').className   = 'rasio-item ' + (dta<0.4?'r-ok':dta<0.6?'r-warn':'r-danger');

  // DTE = Total Kewajiban ÷ Ekuitas (Modal + Laba Berjalan)
  // Equity = totalModal (bukan netWorth, agar tidak double-count aset)
  const dte = totalModal > 0 ? totalHutang / totalModal : (totalHutang > 0 ? Infinity : 0);
  document.getElementById('keu-dte-val').textContent  = isFinite(dte) ? dte.toFixed(2)+'x' : '∞';
  document.getElementById('keu-dte-desc').textContent = `${fmtRp(totalHutang)} ÷ ${fmtRp(totalModal)}`;
  document.getElementById('keu-dte-card').className   = 'rasio-item ' + (dte<1?'r-ok':dte<2?'r-warn':'r-danger');

  // Coverage Ratio = Kas Likuid ÷ Cicilan per Bulan
  // Kas likuid = hanya akun kas/bank (sub_kelompok 'kas' atau nama mengandung BANK/TUNAI/KAS)
  // Bukan total aset — mesin & inventaris tidak bisa bayar cicilan bulan ini
  const kasLikuid = Object.values(akunMap).filter(a => {
    if (a.kelompok !== 'aset') return false;
    const nm = (a.nama||'').toUpperCase();
    const sk = (a.sub_kelompok||'').toLowerCase();
    return sk === 'kas' || sk === 'bank' || nm.includes('BANK') || nm.includes('TUNAI') || nm.includes('KAS');
  }).reduce((s,a) => s + Math.max(0, a.saldoDebit - a.saldoKredit), 0);
  const cr = totalCicilan ? kasLikuid / totalCicilan : 0;
  document.getElementById('keu-cr-val').textContent  = totalCicilan ? cr.toFixed(1)+'x' : '∞';
  document.getElementById('keu-cr-desc').textContent = totalCicilan ? `${fmtRp(kasLikuid)} ÷ ${fmtRp(totalCicilan)}/bln` : 'Tidak ada cicilan aktif';
  document.getElementById('keu-cr-card').className   = 'rasio-item ' + (!totalCicilan?'r-ok':cr>=3?'r-ok':cr>=1?'r-warn':'r-danger');
}

// ─── VALUASI ─────────────────────────────────────────────────
async function keuRenderValuasi() {
  await keuLoadKasData();
  const bayar = await dbGet('hutang_bayar').catch(() => []) || [];
  const akunMap    = keuHitungSaldoAkun();
  const fmtRp = v => fmtRpFull(Math.abs(v));
  const multLaba   = parseFloat(document.getElementById('keu-mult-laba').value) || 3;
  const multRev    = parseFloat(document.getElementById('keu-mult-rev').value) || 1;
  const periodeQ   = parseInt(document.getElementById('keu-periode-laba').value) || 12;

  const totalAset   = keuGetTotalByKelompok(akunMap, 'aset');
  const totalHutang = _keuHutangAll.reduce((s,h)=>s+Math.max(0,(h.pokok||0)-keuGetSudahBayar(h.id,bayar)),0);
  const asetBersih  = totalAset - totalHutang;

  const totalPend   = keuGetTotalByKelompok(akunMap, 'pendapatan');
  const totalBeban  = keuGetTotalByKelompok(akunMap, 'beban');
  const labaBersih  = totalPend - totalBeban;

  // Asset-based
  const valAset     = asetBersih;
  // Earnings-based: annualized
  const bulanData   = periodeQ || 1;
  const labaAnnual  = (labaBersih / bulanData) * 12;
  const valEarnings = Math.max(0, labaAnnual * multLaba);
  // Revenue-based
  const revAnnual   = (totalPend / bulanData) * 12;
  const valRevenue  = revAnnual * multRev;

  const rataRata = (Math.max(0,valAset) + valEarnings + valRevenue) / 3;

  document.getElementById('keu-val-aset').textContent    = (valAset<0?'-':'') + fmtRp(valAset);
  document.getElementById('keu-val-aset').style.color    = valAset>=0?'var(--ink)':'var(--danger)';
  document.getElementById('keu-val-earnings').textContent = fmtRp(valEarnings);
  document.getElementById('keu-val-earnings-desc').textContent = `Laba bersih (annual) × ${multLaba}x`;
  document.getElementById('keu-val-revenue').textContent  = fmtRp(valRevenue);
  document.getElementById('keu-val-revenue-desc').textContent  = `Pendapatan (annual) × ${multRev}x`;
  document.getElementById('keu-val-rata').textContent     = fmtRp(rataRata);
}

// ─── EVENT DELEGATION ────────────────────────────────────────
document.getElementById('page-keuangan').addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]'); if (!btn) return;
  const id = btn.dataset.id, action = btn.dataset.action;
  if (action === 'edit-hutang')  keuEditHutang(id);
  if (action === 'hapus-hutang') keuHapusHutang(id, btn.dataset.nama);
  if (action === 'hapus-bayar')  keuHapusBayar(id);
});

// ─── INIT ─────────────────────────────────────────────────────
// Load saat page keuangan pertama dibuka
const _keuOrigGotoPage = typeof gotoPage === 'function' ? gotoPage : null;
document.addEventListener('DOMContentLoaded', () => {});

// Patch gotoPage agar load data saat buka halaman keuangan
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page === 'keuangan') {
    keuLoadHutang();
    keuLoadKasData();
  }
});

// ─── KEU CUSTOM PICKER ENGINE ────────────────────────────────

function keuTogglePicker(pickerId) {
  var picker = document.getElementById(pickerId);
  var list   = document.getElementById(pickerId + '-list');
  if (!picker || !list) return;
  // Tutup semua picker keu lain
  document.querySelectorAll('.kas-akun-list').forEach(function(el) {
    if (el.id !== pickerId + '-list') keuClosePicker(el);
  });
  if (list.style.display === 'block') { keuClosePicker(list); return; }

  // Inject search box jika belum ada
  if (!list.querySelector('.kas-akun-search-wrap')) {
    var wrap = document.createElement('div');
    wrap.className = 'kas-akun-search-wrap';

    var searchIcon = document.createElement('span');
    searchIcon.className = 'kas-akun-search-icon';
    searchIcon.textContent = '🔍';

    var searchInp = document.createElement('input');
    searchInp.className = 'kas-akun-search';
    searchInp.type = 'text';
    searchInp.placeholder = 'Cari...';
    searchInp.autocomplete = 'off';
    searchInp.setAttribute('autocorrect', 'off');
    searchInp.setAttribute('autocapitalize', 'none');
    searchInp.setAttribute('spellcheck', 'false');

    function _stopProp(ev) { ev.stopPropagation(); }
    searchInp.addEventListener('mousedown',   _stopProp);
    searchInp.addEventListener('touchstart',  _stopProp, { passive: true });
    searchInp.addEventListener('pointerdown', _stopProp);
    searchInp.addEventListener('input', function() { kasPickerFilter(searchInp); });

    searchInp.addEventListener('touchend', function(ev) {
      ev.stopPropagation();
      setTimeout(function() { searchInp.focus(); }, 50);
    }, { passive: false });

    wrap.appendChild(searchIcon);
    wrap.appendChild(searchInp);
    list.insertBefore(wrap, list.firstChild);
  }

  // Reset search & tampilkan semua item
  var inp = list.querySelector('.kas-akun-search');
  if (inp) inp.value = '';
  list.querySelectorAll('.kas-akun-item,.kas-akun-group,.kas-akun-empty').forEach(function(el) { el.style.display = ''; });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';

  // Float ke body agar tidak terpotong overflow modal
  var rect = picker.getBoundingClientRect();
  // Pakai visualViewport.height jika ada (iOS keyboard-aware)
  var vph = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
  var spaceBelow = vph - rect.bottom - 8;
  var spaceAbove = rect.top - 8;
  var maxH = Math.min(220, Math.max(spaceBelow, spaceAbove) - 8);

  list.style.position  = 'fixed';
  list.style.left      = rect.left + 'px';
  list.style.width     = rect.width + 'px';
  list.style.maxWidth  = '340px';
  list.style.maxHeight = maxH + 'px';
  list.style.overflowY = 'auto';
  list.style.zIndex    = '99999';
  list.dataset.floated = '1';

  if (spaceBelow >= 180 || spaceBelow >= spaceAbove) {
    // Cukup ruang di bawah — posisi normal ke bawah
    list.style.top    = (rect.bottom + 2) + 'px';
    list.style.bottom = '';
  } else {
    // Sempit di bawah (keyboard naik) — posisi ke atas picker
    list.style.bottom = (vph - rect.top + 2) + 'px';
    list.style.top    = '';
  }

  list.style.display   = 'block';
  if (list.parentNode !== document.body) document.body.appendChild(list);

  // Auto-focus search — skip iOS Safari (focus pada fixed element bisa dismiss modal)
  var _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (inp && !_isIOS) setTimeout(function() { inp.focus(); }, 80);
}

function keuClosePicker(list) {
  if (!list) return;
  // Reset search
  var inp = list.querySelector('.kas-akun-search');
  if (inp) inp.value = '';
  list.querySelectorAll('.kas-akun-item,.kas-akun-group').forEach(function(el) { el.style.display = ''; });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';

  if (list.dataset.floated && list.parentNode === document.body) {
    var pickerId = list.id.replace('-list', '');
    var picker   = document.getElementById(pickerId);
    if (picker && picker.parentNode) picker.parentNode.appendChild(list);
    delete list.dataset.floated;
  }
  list.style.display = 'none';
}

function keuPickerSelect(item) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  var list     = item.closest('.kas-akun-list');
  if (!list) return;
  var pickerId = list.id.replace('-list', '');
  var picker   = document.getElementById(pickerId);
  if (!picker) return;
  var targetId = picker.dataset.target;
  var val      = item.dataset.val;
  var label    = item.textContent.trim();
  // Update hidden select
  var sel = document.getElementById(targetId);
  if (sel) { sel.value = val; sel.dispatchEvent(new Event('change')); }
  // Update label picker
  var lbl = document.getElementById(pickerId + '-label');
  if (lbl) { lbl.textContent = label; lbl.style.color = val ? 'var(--ink)' : 'var(--ink3)'; }
  // Tandai aktif
  list.querySelectorAll('.kas-akun-item').forEach(function(el) { el.classList.remove('active'); });
  item.classList.add('active');
  keuClosePicker(list);
}

function keuSyncPickerLabel(pickerId, selectId, placeholder) {
  var sel    = document.getElementById(selectId);
  var lbl    = document.getElementById(pickerId + '-label');
  var list   = document.getElementById(pickerId + '-list');
  if (!sel || !lbl) return;
  var val = sel.value;
  if (list) {
    list.querySelectorAll('.kas-akun-item').forEach(function(el) { el.classList.remove('active'); });
    var match = list.querySelector('.kas-akun-item[data-val="' + val + '"]');
    if (match) {
      match.classList.add('active');
      lbl.textContent  = match.textContent.trim();
      lbl.style.color  = 'var(--ink)';
    } else {
      lbl.textContent  = placeholder || '— Pilih —';
      lbl.style.color  = 'var(--ink3)';
    }
  }
}

// Tutup picker saat klik di luar
// close listener: handled by unified handler in app.js

// ─── ARUS KAS ────────────────────────────────────────────────
// Guard: mencegah double-render / jitter saat tab dibuka berulang
var _keuArusKasLoading = false;
var _keuArusKasPending = false;
var _keuArusKasHasData = false;

async function keuRenderArusKas() {
  if (_keuArusKasLoading) { _keuArusKasPending = true; return; }
  _keuArusKasLoading = true;
  _keuArusKasPending = false;
  await _keuRenderArusKasImpl();
  _keuArusKasLoading = false;
  if (_keuArusKasPending) {
    _keuArusKasPending = false;
    setTimeout(keuRenderArusKas, 50);
  }
}

async function _keuRenderArusKasImpl() {
  const fmtRp = v => fmtRpFull(Math.abs(v));

  // Bulan ini
  const now    = new Date();
  const bulanStr = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const ymStr    = now.toISOString().slice(0, 7); // "2026-05"
  const el = id => document.getElementById(id);
  if (el('ak-bulan-rincian')) el('ak-bulan-rincian').textContent = bulanStr;
  if (el('ak-bulan-label'))   el('ak-bulan-label').textContent   = bulanStr;

  try {
    // 1. Data jurnal + kas_akun
    const [kasAkun, jurnal, hutangAll, bayarAll, shopeeCache] = await Promise.all([
      dbGet('kas_akun', '').catch(() => []),
      dbGet('jurnal', '&order=tanggal.desc').catch(() => []),
      dbGet('hutang', '').catch(() => []),
      dbGet('hutang_bayar', '').catch(() => []),
      fetch(SUPABASE_URL + '/rest/v1/shopee_finance_cache?select=*&order=fetched_at.desc&limit=1',
        { headers: _headers() }).then(r => r.ok ? r.json() : []).catch(() => [])
    ]);

    // Build akunMap
    const akunMap = {};
    (kasAkun || []).forEach(a => { akunMap[a.id] = a; });

    // 2. Beban bulan ini dari jurnal
    const jurnalBulan = (jurnal || []).filter(r => (r.tanggal || '').slice(0, 7) === ymStr);
    const bebanMap = {}; // akun_id → total nominal beban
    jurnalBulan.forEach(r => {
      const n  = Number(r.nominal || r.debit || 0);
      const aD = akunMap[r.akun_debit_id];
      const aK = akunMap[r.akun_kredit_id];
      // Beban = akun debit kelompok beban
      if (aD && aD.kelompok === 'beban') {
        bebanMap[r.akun_debit_id] = (bebanMap[r.akun_debit_id] || { nama: aD.nama, total: 0 });
        bebanMap[r.akun_debit_id].total += n;
      }
      // Kredit ke beban jarang, tapi handle juga (pengurangan beban)
      if (aK && aK.kelompok === 'beban') {
        bebanMap[r.akun_kredit_id] = (bebanMap[r.akun_kredit_id] || { nama: aK.nama, total: 0 });
        bebanMap[r.akun_kredit_id].total -= n;
      }
    });

    const totalBeban = Object.values(bebanMap).reduce((s, b) => s + b.total, 0);

    // 3. Cicilan hutang bulan ini
    const totalCicilan = (hutangAll || []).filter(h => {
      const sisa = (h.pokok || 0) - (bayarAll || [])
        .filter(b => b.hutang_id === h.id)
        .reduce((s, b) => s + Number(b.nominal || 0), 0);
      return sisa > 0;
    }).reduce((s, h) => s + (h.cicilan_per_bulan || 0), 0);

    const totalKeluar = totalBeban + totalCicilan;

    // 4. Kas tersedia
    const kasArr = Object.values(akunMap).filter(a =>
      a.kelompok === 'aset' && (a.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK'
    );
    // Hitung saldo per akun kas
    let totalKasJurnal = 0;
    const akunSaldo = {};
    (jurnal || []).forEach(r => {
      const n = Number(r.nominal || r.debit || 0);
      if (kasArr.find(a => a.id === r.akun_debit_id))  akunSaldo[r.akun_debit_id]  = (akunSaldo[r.akun_debit_id]  || 0) + n;
      if (kasArr.find(a => a.id === r.akun_kredit_id)) akunSaldo[r.akun_kredit_id] = (akunSaldo[r.akun_kredit_id] || 0) - n;
    });
    totalKasJurnal = Object.values(akunSaldo).reduce((s, v) => s + v, 0);

    const cache       = shopeeCache && shopeeCache.length > 0 ? shopeeCache[0] : null;
    const escrow      = cache ? Number(cache.escrow_transit  || 0) : 0;
    const wallet      = cache ? Number(cache.wallet_balance  || 0) : 0;
    const totalKas    = totalKasJurnal + escrow + wallet;

    // 5. Runway = kas / (total keluar / 30)
    const biayaPerHari = totalKeluar / 30;
    const runwayHari   = biayaPerHari > 0 ? Math.floor(totalKas / biayaPerHari) : 999;

    // ─── RENDER ─────────────────────────────────────────────
    const isDefisit = totalKas < totalKeluar;

    // Summary cards
    const setCard = (id, val, cls) => {
      const card = el(id);
      if (card) card.className = 'rasio-item ' + (cls || '');
    };
    if (el('ak-beban-val'))  el('ak-beban-val').textContent  = fmtRp(totalBeban);
    if (el('ak-cicilan-val'))el('ak-cicilan-val').textContent= fmtRp(totalCicilan);
    if (el('ak-keluar-val')) el('ak-keluar-val').textContent = fmtRp(totalKeluar);
    if (el('ak-kas-val'))    el('ak-kas-val').textContent    = fmtRp(totalKas);

    setCard('ak-card-beban',       totalBeban   > 0 ? 'r-warn' : '');
    setCard('ak-card-cicilan',     totalCicilan > 0 ? 'r-warn' : '');
    setCard('ak-card-total-keluar',isDefisit ? 'r-danger' : 'r-warn');
    setCard('ak-card-kas',         isDefisit ? 'r-danger' : 'r-ok');

    if (el('ak-kas-desc')) {
      el('ak-kas-desc').textContent = `Kas: ${fmtRp(totalKasJurnal)}` +
        (escrow > 0 ? ` · Escrow: ${fmtRp(escrow)}` : '') +
        (wallet > 0 ? ` · Wallet: ${fmtRp(wallet)}` : '');
    }

    // Status bar
    const statusBar = el('ak-status-bar');
    if (statusBar) {
      statusBar.style.display = 'block';
      if (isDefisit) {
        const defisit = totalKeluar - totalKas;
        statusBar.style.background = 'rgba(224,82,82,0.12)';
        statusBar.style.color      = 'var(--danger)';
        statusBar.innerHTML        = `⚠ Kas kurang <b>${fmtRp(defisit)}</b> untuk cover beban bulan ini`;
      } else {
        const surplus = totalKas - totalKeluar;
        statusBar.style.background = 'rgba(76,175,80,0.12)';
        statusBar.style.color      = 'var(--ok)';
        statusBar.innerHTML        = `✅ Surplus <b>${fmtRp(surplus)}</b> setelah semua beban bulan ini`;
      }
    }

    // Runway
    if (el('ak-runway-val')) {
      if (runwayHari >= 999) {
        el('ak-runway-val').textContent = '∞';
        el('ak-runway-val').style.color = 'var(--ok)';
      } else {
        el('ak-runway-val').textContent = runwayHari + ' hari';
        el('ak-runway-val').style.color = runwayHari < 7 ? 'var(--danger)' : runwayHari < 30 ? 'var(--warn)' : 'var(--ok)';
      }
    }
    if (el('ak-runway-desc')) {
      el('ak-runway-desc').textContent = biayaPerHari > 0
        ? `Biaya harian ~${fmtRp(biayaPerHari)}`
        : 'Tidak ada beban tercatat';
    }

    // Rincian beban
    const tbody = el('ak-rincian-tbody');
    if (tbody) {
      const rows = Object.values(bebanMap).filter(b => b.total > 0).sort((a, b) => b.total - a.total);
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="padding:12px 4px;color:var(--ink3);font-style:italic">Belum ada beban tercatat bulan ini</td></tr>';
      } else {
        tbody.innerHTML = rows.map(b => `
          <tr style="border-bottom:1px solid var(--border,rgba(0,0,0,0.06))">
            <td style="padding:7px 4px">${b.nama}</td>
            <td style="text-align:right;padding:7px 4px;font-weight:600;color:var(--danger)">${fmtRp(b.total)}</td>
          </tr>`).join('') +
          `<tr style="border-top:2px solid var(--ink)">
            <td style="padding:8px 4px;font-weight:700">Total Beban</td>
            <td style="text-align:right;padding:8px 4px;font-weight:700;color:var(--danger)">${fmtRp(totalBeban)}</td>
          </tr>`;
      }
    }

    // Expose ke window untuk dashboard metric
    window._akData = { totalBeban, totalCicilan, totalKeluar, totalKas, runwayHari, isDefisit };

  } catch(e) {
    console.error('[ARUS KAS]', e);
  }
}

// ─── AKUN BAYAR CICILAN ──────────────────────────────────────
async function keuPopulateAkunBayar() {
  var selEl  = document.getElementById('keu-bayar-akun-id');
  var listEl = document.getElementById('keu-picker-bayar-akun-list');
  if (!selEl || !listEl) return;
  var akuns = await dbGet('kas_akun', '&order=kode.asc').catch(function() { return []; });
  var asetOpts = akuns.filter(function(a) { return a.kelompok === 'aset'; });
  var lastId = '';
  try { lastId = localStorage.getItem('keu_last_bayar_akun') || ''; } catch(e) {}

  selEl.innerHTML = '<option value="">— Pilih Akun —</option>' +
    asetOpts.map(function(a) {
      return '<option value="' + a.id + '"' + (String(a.id)===lastId?' selected':'') + '>' +
        (a.kode ? a.kode+' · ' : '') + a.nama + '</option>';
    }).join('');

  var html = '<div class="kas-akun-item" data-val="" onclick="keuPickerSelectBayarAkun(this)"><span style="color:var(--ink3)">— Pilih Akun —</span></div>';
  asetOpts.forEach(function(a) {
    html += '<div class="kas-akun-item' + (String(a.id)===lastId?' active':'') + '" data-val="' + a.id + '" onclick="keuPickerSelectBayarAkun(this)">' +
      (a.kode ? a.kode+' · ' : '') + a.nama + '</div>';
  });
  listEl.innerHTML = html;

  if (lastId) {
    var found = asetOpts.find(function(a) { return String(a.id) === lastId; });
    var lbl = document.getElementById('keu-picker-bayar-akun-label');
    if (lbl && found) {
      lbl.textContent = (found.kode ? found.kode+' · ' : '') + found.nama;
      lbl.style.color = 'var(--ink)';
    }
    if (selEl) selEl.value = lastId;
  }
}

function keuPickerSelectBayarAkun(item) {
  var val   = item.dataset.val;
  var label = item.textContent.trim();
  var sel   = document.getElementById('keu-bayar-akun-id');
  var lbl   = document.getElementById('keu-picker-bayar-akun-label');
  var list  = document.getElementById('keu-picker-bayar-akun-list');
  if (sel) sel.value = val;
  if (lbl) { lbl.textContent = val ? label : '— Pilih Akun —'; lbl.style.color = val ? 'var(--ink)' : 'var(--ink3)'; }
  if (list) {
    list.querySelectorAll('.kas-akun-item').forEach(function(el) { el.classList.remove('active'); });
    if (val) item.classList.add('active');
    list.style.display = 'none';
  }
}

// ─── UPDATE TENOR LABEL SAAT FREKUENSI BERUBAH ───────────────
document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'keu-htg-frekuensi') {
    var lbl = document.getElementById('keu-htg-tenor-label');
    if (lbl) lbl.textContent = e.target.value === 'tahunan' ? '(tahun)' : '(bulan)';
    _keuAutoJatuhTempo();
  }
  if (e.target && (e.target.id === 'keu-htg-tenor' || e.target.id === 'keu-htg-tgl-mulai')) {
    _keuAutoJatuhTempo();
  }
});

function _keuAutoJatuhTempo() {
  var tglMulai = document.getElementById('keu-htg-tgl-mulai').value;
  var tenor    = parseInt(document.getElementById('keu-htg-tenor').value) || 0;
  var frekuensi = document.getElementById('keu-htg-frekuensi').value || 'bulanan';
  if (!tglMulai || !tenor) return;
  var d = new Date(tglMulai);
  if (frekuensi === 'tahunan') {
    d.setFullYear(d.getFullYear() + tenor);
  } else {
    d.setMonth(d.getMonth() + tenor);
  }
  var hasil = d.toISOString().slice(0,10);
  var jtEl = document.getElementById('keu-htg-jatuh-tempo');
  if (jtEl) jtEl.value = hasil;
}

// ─── MODAL CATAT CICILAN ─────────────────────────────────────
function keuOpenCicilan() {
  var today = new Date().toISOString().slice(0,10);
  var tglEl = document.getElementById('keu-bayar-tgl');
  if (tglEl && !tglEl.value) tglEl.value = today;
  document.getElementById('keu-bayar-ket').value = '';
  // Auto-fill nominal dari cicilan hutang yang dipilih
  var selId = document.getElementById('keu-bayar-hutang-id').value;
  var defaultNominal = 0;
  if (selId) {
    var htg = _keuHutangAll.find(function(x){ return String(x.id) === String(selId); });
    if (htg) defaultNominal = htg.cicilan_nominal || htg.cicilan_per_bulan || 0;
  }
  if (typeof idrSet === 'function') idrSet('keu-bayar-nominal', defaultNominal);
  if (typeof idrInputAll === 'function') setTimeout(idrInputAll, 50);
  document.getElementById('modal-keu-cicilan').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Dipanggil saat user memilih hutang di picker — auto-fill nominal cicilan
function keuBayarHutangChange() {
  var sel = document.getElementById('keu-bayar-hutang-id');
  if (!sel || !sel.value) return;
  var htg = _keuHutangAll.find(function(x){ return String(x.id) === String(sel.value); });
  if (!htg) return;
  var nominal = htg.cicilan_nominal || htg.cicilan_per_bulan || 0;
  if (nominal && typeof idrSet === 'function') {
    idrSet('keu-bayar-nominal', nominal);
    if (typeof idrInputAll === 'function') setTimeout(idrInputAll, 50);
  }
}

function keuCloseCicilan() {
  document.getElementById('modal-keu-cicilan').style.display = 'none';
  document.body.style.overflow = '';
}


// ═══════════════════════════════════════════════════════════════
// FIX COST — Auto-pull dari hutang + anggaran (tidak perlu input manual)
// ═══════════════════════════════════════════════════════════════

async function fcLoad() {
  const fmt = v => fmtRpFull(Number(v)||0);
  const today = new Date().toISOString().slice(0,10);
  const ym    = today.slice(0,7);
  const dayOfMonth = Math.max(1, new Date().getDate());

  // ── 1. Cicilan Hutang ──────────────────────────────────────
  // Fetch hutang_bayar untuk hitung sisa hutang yang benar (bukan field sudah_bayar yg tidak di-sync)
  let hutangList = [], hutangBayarList = [];
  try {
    [hutangList, hutangBayarList] = await Promise.all([
      dbGet('hutang', '&order=kreditur.asc').catch(() => []),
      dbGet('hutang_bayar', '').catch(() => [])
    ]);
    hutangList     = hutangList     || [];
    hutangBayarList= hutangBayarList|| [];
  } catch(e) {}

  // Helper: aggregate sudah_bayar dari tabel hutang_bayar (konsisten dengan panel lain)
  const fcGetSudahBayar = (hutangId) =>
    hutangBayarList.filter(b => String(b.hutang_id) === String(hutangId))
                   .reduce((s, b) => s + (Number(b.nominal)||0), 0);

  const tbodyHutang = document.getElementById('fc-hutang-tbody');
  const totalCicilan = hutangList.reduce((s, h) => {
    const sisaHutang = (h.pokok||0) - fcGetSudahBayar(h.id);
    if (sisaHutang <= 0) return s; // lunas — skip
    // cicilan_per_bulan sudah disimpan sebagai ekuivalen bulanan saat insert
    // (tahunan: cicilan_nominal÷12, bulanan: cicilan_nominal apa adanya)
    // → gunakan cicilan_per_bulan langsung, tidak ÷12 lagi
    return s + (Number(h.cicilan_per_bulan)||0);
  }, 0);

  if (tbodyHutang) {
    if (!hutangList.length) {
      tbodyHutang.innerHTML = '<tr><td colspan="3" style="padding:12px 4px;color:var(--ink3);font-style:italic">Belum ada data hutang.</td></tr>';
    } else {
      tbodyHutang.innerHTML = hutangList.map(h => {
        const sisaHutang = (h.pokok||0) - fcGetSudahBayar(h.id);
        const lunas = sisaHutang <= 0;
        // cicilan_per_bulan sudah ekuivalen bulanan — pakai langsung
        const perBulan = Number(h.cicilan_per_bulan)||0;
        const asalInfo = h.frekuensi === 'tahunan' ? ` <span style="font-size:10px;color:var(--ink3)">(${fmt(h.cicilan_nominal)}/thn ÷12)</span>` : '';
        return `<tr style="opacity:${lunas?'0.4':'1'}">
          <td style="font-weight:600">${h.kreditur||'—'} ${lunas?'<span style="font-size:10px;color:var(--ok)">✅ LUNAS</span>':''}</td>
          <td style="text-align:right;color:${lunas?'var(--ink3)':'var(--danger)'};font-weight:600;font-variant-numeric:tabular-nums">
            ${lunas ? '—' : fmt(perBulan) + '/bln'}${asalInfo}
          </td>
          <td style="font-size:12px;color:var(--ink3)">${h.jenis||'—'}</td>
        </tr>`;
      }).join('');
    }
  }

  // ── 2. Anggaran Beban bulan berjalan ──────────────────────
  let anggaranList = [], akunList = [];
  try {
    [anggaranList, akunList] = await Promise.all([
      dbGet('kas_anggaran', '&bulan=eq.' + ym + '&order=akun_id.asc'),
      dbGet('kas_akun', '&kelompok=eq.beban&order=nama.asc')
    ]);
    anggaranList = anggaranList || [];
    akunList     = akunList     || [];
  } catch(e) {}

  const akunMap = {};
  akunList.forEach(a => { akunMap[a.id] = a.nama || ('Akun #'+a.id); });

  const totalAnggaran = anggaranList.reduce((s,r) => s + (Number(r.nominal)||0), 0);
  const tbodyAng = document.getElementById('fc-anggaran-tbody');
  if (tbodyAng) {
    if (!anggaranList.length) {
      tbodyAng.innerHTML = '<tr><td colspan="2" style="padding:12px 4px;color:var(--ink3);font-style:italic">Belum ada anggaran beban bulan ini.</td></tr>';
    } else {
      tbodyAng.innerHTML = anggaranList.map(r => `
        <tr>
          <td>${akunMap[r.akun_id] || ('Akun #'+r.akun_id)}</td>
          <td style="text-align:right;color:var(--danger);font-weight:600;font-variant-numeric:tabular-nums">${fmt(r.nominal)}</td>
        </tr>`).join('') +
        `<tr style="border-top:2px solid var(--ink);font-weight:700">
          <td>Total Anggaran</td>
          <td style="text-align:right;color:var(--danger)">${fmt(totalAnggaran)}</td>
        </tr>`;
    }
  }

  // ── 3. Omset bulan berjalan + weighted beban/npm dari channel ──
  let omsetBln = 0, jpBulan = [];
  try {
    jpBulan  = await dbGet('jurnal_penjualan', '&tanggal=gte.' + ym + '-01&order=tanggal.desc').catch(()=>[]);
    omsetBln = (jpBulan||[]).reduce((s,r) => s + (Number(r.total)||0), 0);
  } catch(e) {}

  // Weighted beban% + npm% per channel (sama dengan logika Avg/hari di dashboard)
  let totalBebanEst = 0;
  try {
    const chBebanRows = await dbGet('channel_beban', '').catch(() => []);
    const chBebanMap  = {};
    (chBebanRows || []).forEach(b => {
      chBebanMap[b.channel_id] = (Number(b.beban_persen||0) + Number(b.npm_persen||0)) / 100;
    });
    (jpBulan||[]).forEach(r => {
      const pct = chBebanMap[r.channel_id] || 0;
      totalBebanEst += (Number(r.total)||0) * pct;
    });
    // fallback rata-rata semua channel
    if (totalBebanEst === 0 && omsetBln > 0 && chBebanRows && chBebanRows.length) {
      const avgPct = chBebanRows.reduce((s,b) => s + Number(b.beban_persen||0) + Number(b.npm_persen||0), 0) / chBebanRows.length / 100;
      totalBebanEst = omsetBln * avgPct;
    }
  } catch(e) {}

  // ── 4. Update summary cards ────────────────────────────────
  // NPM + Beban Ops (20% dari omset, weighted per channel) = totalBebanEst
  // Total Fix Cost = cicilan hutang + anggaran beban
  // Sisa Setelah Fix Cost = (NPM + Beban Ops) − Total Fix Cost
  //   → negatif = KURANG/defisit, positif = surplus
  const npmBebanOps = totalBebanEst;
  const totalFC     = totalCicilan + totalAnggaran;
  const sisa        = npmBebanOps - totalFC;
  const avgNpmHari  = npmBebanOps / dayOfMonth;
  const hariKejar   = avgNpmHari > 0 ? Math.ceil(totalFC / avgNpmHari) : null;

  const elBebanCh = document.getElementById('fc-beban-ch-val');
  if (elBebanCh) elBebanCh.textContent = omsetBln > 0 ? fmt(Math.round(npmBebanOps)) : '—';

  const elTotal = document.getElementById('fc-total-val');
  const elOmset = document.getElementById('fc-omset-val');
  const elSisa  = document.getElementById('fc-sisa-val');
  const elHari  = document.getElementById('fc-hari-val');
  const elHDesc = document.getElementById('fc-hari-desc');
  const elStatus= document.getElementById('fc-status-bar');

  if (elTotal) elTotal.textContent = totalFC > 0 ? fmt(totalFC) : '—';
  if (elOmset) { elOmset.textContent = omsetBln > 0 ? fmt(omsetBln) : '—'; elOmset.style.color = omsetBln > 0 ? 'var(--info)' : 'var(--ink3)'; }
  // sisa >= 0 → NPM+Beban Ops sudah ketutup fix cost (surplus, hijau)
  // sisa < 0  → masih kurang sebesar nilai ini (defisit, merah)
  if (elSisa)  { elSisa.textContent = totalFC > 0 ? fmt(sisa) : '—'; elSisa.style.color = sisa >= 0 ? 'var(--ok)' : 'var(--danger)'; }
  if (elHari)  {
    elHari.textContent = hariKejar !== null ? hariKejar + ' hari' : '—';
    elHari.style.color = (hariKejar !== null && hariKejar <= dayOfMonth) ? 'var(--ok)' : 'var(--danger)';
  }
  if (elHDesc) elHDesc.textContent = hariKejar !== null ? ('dari ' + dayOfMonth + ' hari berjalan') : 'avg NPM+beban ops/hari belum ada';

  if (elStatus && totalFC > 0) {
    const pct = totalFC > 0 ? Math.min((npmBebanOps / totalFC * 100), 999).toFixed(0) : 0;
    const covered = npmBebanOps >= totalFC;
    elStatus.style.display = 'block';
    elStatus.style.background = covered ? 'rgba(76,175,80,0.12)' : 'rgba(224,82,82,0.12)';
    elStatus.style.border = '2px solid ' + (covered ? 'var(--ok)' : 'var(--danger)');
    elStatus.style.color  = covered ? 'var(--ok)' : 'var(--danger)';
    elStatus.innerHTML = covered
      ? `✅ NPM+Beban Ops sudah menutup fix cost (${pct}%) — surplus ${fmt(sisa)}`
      : `⚠️ NPM+Beban Ops baru ${pct}% dari fix cost — kurang ${fmt(Math.abs(sisa))}`;
  } else if (elStatus) {
    elStatus.style.display = 'none';
  }
}
