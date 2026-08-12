// ─── KAS.JS — Double Entry Bookkeeping + Kategori Custom ─────
// Struktur: Chart of Accounts (COA) + Jurnal Umum + Laporan otomatis

// ─── STATE ───────────────────────────────────────────────────
let _kasAkunMap   = {};
let _kasJurnalAll = [];

// ─── HTML PAGE ───────────────────────────────────────────────
document.getElementById('page-kas').innerHTML = `
<style>
  .kas-tabs { display:flex; gap:6px; flex-wrap:wrap; }
  .kas-tab  { padding:6px 14px; border:2px solid var(--ink); background:var(--cream); font-family:var(--f); font-size:13px; font-weight:700; cursor:pointer; border-radius:2px; color:var(--ink); }
  .kas-tab.active { background:var(--ink); color:var(--cream); }

  /* ── Dropdown tab kas — portal ke body ── */
  #kas-tab-trigger {
    display:flex; align-items:center; gap:7px;
    padding:7px 14px; border-radius:20px;
    background:var(--cream); color:var(--ink);
    font-family:var(--f); font-size:13px; font-weight:700;
    border:none; cursor:pointer;
  }
  #kas-tab-trigger i.arr { font-size:12px; transition:transform .2s; margin-left:2px; }
  #kas-tab-trigger.open i.arr { transform:rotate(180deg); }
  #kas-tab-dropdown {
    position:fixed;
    background:var(--cream2); border:1px solid var(--ink3);
    border-radius:14px; min-width:200px; padding:6px;
    z-index:99999; display:none;
    box-shadow:0 8px 28px rgba(0,0,0,.3), 0 2px 6px rgba(0,0,0,.15);
  }
  #kas-tab-dropdown.open { display:block; }
  #kas-tab-dropdown .dd-section {
    font-size:10px; font-weight:700; color:var(--ink3);
    text-transform:uppercase; letter-spacing:.07em; padding:5px 10px 3px;
  }
  #kas-tab-dropdown .dd-item {
    display:flex; align-items:center; gap:10px;
    padding:9px 12px; border-radius:10px;
    font-size:13px; font-weight:500; color:var(--ink2);
    cursor:pointer; border:none; background:none;
    width:100%; text-align:left; font-family:var(--f);
  }
  #kas-tab-dropdown .dd-item:hover { background:var(--cream); color:var(--ink); }
  #kas-tab-dropdown .dd-item.active { background:var(--ink); color:var(--cream); }
  #kas-tab-dropdown .dd-item i { font-size:15px; width:18px; text-align:center; }

  /* Filter bulan dropdown */
  #kas-bulan-dropdown {
    position:fixed;
    background:var(--cream2); border:1px solid var(--ink3);
    border-radius:14px; min-width:220px; padding:6px;
    z-index:99999; display:none;
    box-shadow:0 8px 28px rgba(0,0,0,.3);
  }
  #kas-bulan-dropdown.open { display:block; }
  #kas-bulan-dropdown .dd-section {
    font-size:10px; font-weight:700; color:var(--ink3);
    text-transform:uppercase; letter-spacing:.07em; padding:5px 10px 3px;
  }
  #kas-bulan-dropdown .dd-list {
    max-height:132px; overflow-y:auto; /* ~3 item kelihatan, sisanya scroll */
  }
  #kas-bulan-dropdown .dd-item {
    display:flex; align-items:center; gap:10px;
    padding:9px 12px; border-radius:10px;
    font-size:13px; font-weight:500; color:var(--ink2);
    cursor:pointer; border:none; background:none;
    width:100%; text-align:left; font-family:var(--f);
    white-space:nowrap;
  }
  #kas-bulan-dropdown .dd-item:hover { background:var(--cream); color:var(--ink); }
  #kas-bulan-dropdown .dd-item.active { background:var(--ink); color:var(--cream); }
  #kas-bulan-dropdown .dd-item i { font-size:15px; width:18px; text-align:center; flex-shrink:0; }
  .kas-btn-pill {
    display:flex; align-items:center; gap:6px;
    padding:7px 13px; border-radius:20px;
    font-family:var(--f); font-size:13px; font-weight:600;
    cursor:pointer; border:none; background:var(--cream2);
    color:var(--ink2);
  }
  .kas-btn-pill:hover { background:var(--cream); color:var(--ink); }
  .kas-btn-pill.primary { background:var(--cream); color:var(--ink); }
  .kas-btn-refresh-icon {
    padding:0; width:38px; height:38px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; font-size:18px;
  }
  .kas-panel { display:none; }
  .kas-panel.active { display:block; }
  .akun-badge { display:inline-block; padding:2px 7px; border-radius:2px; font-size:11px; font-weight:700; border:1.5px solid currentColor; }
  .akun-aset      { color:#2a6e3a; }
  .akun-kewajiban { color:#b03020; }
  .akun-modal     { color:#1a4a8a; }
  .akun-pendapatan{ color:#2a6e3a; }
  .akun-beban     { color:#b03020; }
  .kas-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:10px; }
  @media(max-width:520px){ .kas-summary{ grid-template-columns:1fr 1fr !important; } }

  /* ── Portrait: sembunyikan kolom verbose, tampilkan kolom ringkas ── */
  @media(max-width:600px) and (orientation:portrait){
    #kas-jurnal-tbl-wrap .kas-col-ref,
    #kas-jurnal-tbl-wrap .kas-col-ket,
    #kas-jurnal-tbl-wrap .kas-col-akund,
    #kas-jurnal-tbl-wrap .kas-col-akunk,
    #kas-jurnal-tbl-wrap .kas-col-debit,
    #kas-jurnal-tbl-wrap .kas-col-kredit,
    #kas-jurnal-tbl-wrap .kas-col-aksi { display:none !important; }
    #kas-jurnal-tbl-wrap .kas-col-portrait { display:table-cell !important; }
    #kas-jurnal-tbl-wrap table { min-width:unset; width:100%; }
  }
  /* Default: kolom portrait tersembunyi di laptop/landscape */
  .kas-col-portrait { display:none; }
  .lap-head td  { font-weight:700; background:var(--cream2); border-top:2px solid var(--ink); }
  .lap-sub  td  { padding-left:24px !important; color:var(--ink2); }
  .lap-total td { font-weight:700; border-top:2px dashed var(--ink3); }
  .lap-result td{ font-weight:700; font-size:15px; border-top:2px solid var(--ink); border-bottom:2px solid var(--ink); }
</style>

<!-- ═══ KAS TOP BAR ═══ -->
<div id="kas-top-bar">
  <!-- Baris 1: Refresh + Filter Bulan (kiri) | Tab Dropdown (kanan) -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
    <button class="kas-btn-pill primary kas-btn-refresh-icon" onclick="loadKasJurnal()" title="Refresh"><i class="ti ti-refresh"></i></button>
    <div style="position:relative;display:inline-block" id="kas-bulan-wrap">
      <button class="kas-btn-pill" id="kas-bulan-trigger" onclick="kasToggleBulanDD()">
        <i class="ti ti-calendar"></i>
        <span id="kas-bulan-label">Semua</span>
        <i class="ti ti-chevron-down" style="font-size:12px;margin-left:2px;transition:transform .2s" id="kas-bulan-arr"></i>
      </button>
    </div>
    <div style="margin-left:auto">
      <button id="kas-tab-trigger" onclick="kasToggleTabDD()">
        <i class="ti ti-notebook" id="kas-tab-icon"></i>
        <span id="kas-tab-label">Jurnal Harian</span>
        <i class="ti ti-chevron-down arr"></i>
      </button>
    </div>
  </div>
  <!-- Baris 2: 4 minicard summary -->
  <div class="kas-summary" style="grid-template-columns:repeat(4,1fr)">
    <div class="metric"><div class="m-label">Kas Masuk</div><div class="m-value" id="kas-total-masuk">—</div><div class="m-delta">total debit kas</div></div>
    <div class="metric"><div class="m-label">Kas Keluar</div><div class="m-value" id="kas-total-keluar">—</div><div class="m-delta">total kredit kas</div></div>
    <div class="metric"><div class="m-label">Saldo Kas</div><div class="m-value" id="kas-saldo">—</div><div class="m-delta">saldo akhir</div></div>
    <div class="metric"><div class="m-label">Cash Flow</div><div class="m-value" id="kas-cashflow">—</div><div class="m-delta" id="kas-cashflow-label">periode ini</div></div>
  </div>
  <!-- input bulan hidden — tetap dipakai fungsi filter -->
  <input type="month" id="kas-filter-bulan" style="display:none" onchange="kasApplyFilter()">
</div>

<!-- PANEL: JURNAL -->
<div id="kas-panel-jurnal" class="kas-panel active">
  <div class="card" id="kas-jurnal-card">
    <!-- Sticky header dalam card: judul + Anggaran + Tambah Transaksi -->
    <div id="kas-sticky-header">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0;padding-left:0;padding-right:0;width:100%">
        <span><i class="ti ti-list"></i> Cash Jurnal</span>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <button class="btn btn-sm" onclick="gotoPage('anggaran',null)" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap"><i class="ti ti-chart-pie"></i> Anggaran</button>
          <button class="btn btn-sm btn-primary" onclick="kasShowForm()" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap"><i class="ti ti-plus"></i> Tambah Transaksi</button>
        </div>
      </div>
    </div>
    <div id="kas-jurnal-tbl-wrap">
      <table class="tbl">
        <thead><tr>
          <th>Tanggal</th>
          <th class="kas-col-ref">Ref</th>
          <th class="kas-col-ket">Keterangan</th>
          <th class="kas-col-akund">Akun Debit</th>
          <th class="kas-col-akunk">Akun Kredit</th>
          <th class="kas-col-debit" style="text-align:right">Debit</th>
          <th class="kas-col-kredit" style="text-align:right">Kredit</th>
          <th class="kas-col-portrait">Akun</th>
          <th class="kas-col-portrait" style="text-align:right">Nominal</th>
          <th class="kas-col-aksi">Aksi</th>
        </tr></thead>
        <tbody id="kas-jurnal-tbody"><tr><td colspan="8" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table>
      <div id="kas-jurnal-footer" style="font-size:12px;color:var(--ink3);padding:8px 10px;text-align:right"></div>
    </div>
  </div>
</div>

<!-- PANEL: LAPORAN -->
<div id="kas-panel-laporan" class="kas-panel">

  <!-- FREEZE: Tab bar + filter — tidak ikut scroll -->
  <div id="kas-lap-sticky-header">
    <div class="kas-lap-header-desktop" style="display:flex;gap:0;border-bottom:2px solid var(--ink);flex-wrap:wrap">
      <button id="lap-tab-neraca" onclick="kasLapTab('neraca')"
        style="padding:7px 18px;font-family:var(--f);font-size:13px;font-weight:700;border:2px solid var(--ink);border-bottom:none;background:var(--ink);color:var(--cream);cursor:pointer;margin-bottom:-2px">
        <i class="ti ti-scale"></i> Neraca Saldo
      </button>
      <button id="lap-tab-labarugi" onclick="kasLapTab('labarugi')"
        style="padding:7px 18px;font-family:var(--f);font-size:13px;font-weight:700;border:2px solid var(--ink);border-bottom:none;border-left:none;background:var(--cream);color:var(--ink);cursor:pointer;margin-bottom:-2px">
        <i class="ti ti-chart-line"></i> Laba Rugi
      </button>
      <button id="lap-tab-aruskas" onclick="kasLapTab('aruskas')"
        style="padding:7px 18px;font-family:var(--f);font-size:13px;font-weight:700;border:2px solid var(--ink);border-bottom:none;border-left:none;background:var(--cream);color:var(--ink);cursor:pointer;margin-bottom:-2px">
        <i class="ti ti-arrows-exchange"></i> Arus Kas
      </button>
      <div style="margin-left:auto;display:flex;gap:6px;align-items:center;padding-bottom:4px">
        <button class="btn btn-sm btn-primary" onclick="kasRenderLaporan()"><i class="ti ti-refresh"></i> Refresh</button>
        <div id="kas-lap-bulan-picker-d"></div>
      </div>
    </div>
    <!-- Mobile: Refresh (icon) + tipe + bulan, SEJAJAR 1 baris -->
    <div class="kas-lap-header-mobile" style="display:none;align-items:center;gap:6px;padding:8px 0;border-bottom:2px solid var(--ink)">
      <button class="btn btn-sm btn-primary kas-btn-refresh-icon" onclick="kasRenderLaporan()" title="Refresh" style="flex-shrink:0"><i class="ti ti-refresh"></i></button>
      <div class="kas-lap-tipe-picker" style="position:relative;flex:1;min-width:0">
        <button id="lap-tipe-picker-btn" onclick="kasLapTipeToggle()"
          style="display:flex;align-items:center;gap:5px;font-family:var(--f);font-size:12px;font-weight:700;padding:6px 8px;border:2px solid var(--ink);background:var(--cream);color:var(--ink);border-radius:4px;cursor:pointer;width:100%;justify-content:center;white-space:nowrap;overflow:hidden">
          <i class="ti ti-scale" id="lap-tipe-picker-icon" style="flex-shrink:0"></i>
          <span id="lap-tipe-picker-label" style="overflow:hidden;text-overflow:ellipsis">Neraca Saldo</span>
          <i class="ti ti-chevron-down" style="font-size:11px;opacity:.6;flex-shrink:0"></i>
        </button>
        <div id="lap-tipe-picker-list" style="display:none;position:absolute;top:100%;left:0;margin-top:4px;background:var(--cream);border:2px solid var(--ink);border-radius:6px;min-width:180px;z-index:50;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,0.35)">
          <div class="lap-tipe-item" data-tab="neraca" onclick="kasLapTab('neraca');kasLapTipeToggle()"
            style="display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;font-size:13px;font-weight:600;color:var(--ink)">
            <i class="ti ti-scale"></i> Neraca Saldo
            <i class="ti ti-check lap-tipe-check" style="margin-left:auto"></i>
          </div>
          <div class="lap-tipe-item" data-tab="labarugi" onclick="kasLapTab('labarugi');kasLapTipeToggle()"
            style="display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;font-size:13px;font-weight:600;color:var(--ink);border-top:1px solid rgba(0,0,0,0.08)">
            <i class="ti ti-chart-line"></i> Laba Rugi
            <i class="ti ti-check lap-tipe-check" style="margin-left:auto;visibility:hidden"></i>
          </div>
          <div class="lap-tipe-item" data-tab="aruskas" onclick="kasLapTab('aruskas');kasLapTipeToggle()"
            style="display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;font-size:13px;font-weight:600;color:var(--ink);border-top:1px solid rgba(0,0,0,0.08)">
            <i class="ti ti-arrows-exchange"></i> Arus Kas
            <i class="ti ti-check lap-tipe-check" style="margin-left:auto;visibility:hidden"></i>
          </div>
        </div>
      </div>
      <div id="kas-lap-bulan-picker-m" style="flex:1;min-width:0"></div>
    </div>
  </div>

  <!-- SCROLL: area konten tabel -->
  <div id="kas-lap-tbl-wrap">

    <!-- Sub-panel: Neraca Saldo -->
    <div id="lap-panel-neraca">
      <table class="tbl kas-lap-tbl">
        <thead><tr><th>Kode</th><th>Nama Akun</th><th style="text-align:right">Saldo</th><th>Kelompok</th><th style="text-align:right">Debit</th><th style="text-align:right">Kredit</th></tr></thead>
        <tbody id="kas-neraca-tbody"></tbody>
      </table>
    </div>

    <!-- Sub-panel: Laba Rugi -->
    <div id="lap-panel-labarugi" style="display:none">
      <table class="tbl kas-lap-tbl">
        <thead><tr><th>Uraian</th><th style="text-align:right">Jumlah</th></tr></thead>
        <tbody id="kas-labarugi-tbody"></tbody>
      </table>
    </div>

    <!-- Sub-panel: Arus Kas -->
    <div id="lap-panel-aruskas" style="display:none">
      <table class="tbl kas-lap-tbl">
        <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Akun</th><th style="text-align:right">Masuk</th><th style="text-align:right">Keluar</th><th style="text-align:right">Saldo</th></tr></thead>
        <tbody id="kas-aruskas-tbody"></tbody>
      </table>
    </div>

  </div><!-- /kas-lap-tbl-wrap -->
</div>

<!-- PANEL: KELOLA AKUN -->
<div id="kas-panel-akun" class="kas-panel">
  <div style="margin-bottom:10px;padding:10px 14px;background:var(--cream2);border:2px dashed var(--ink3);font-size:13px;color:var(--ink2);line-height:1.7">
    <b>Chart of Accounts</b> — daftar akun keuangan bisnis kamu.<br>
    Kelompok sudah fixed (Aset, Kewajiban, Modal, Pendapatan, Beban) — tambah akun baru di dalam kelompok yang sesuai.
  </div>
  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
      <span><i class="ti ti-list"></i> Daftar Akun (Chart of Accounts)</span>
      <button class="btn btn-sm btn-primary" onclick="kasShowFormAkun()"><i class="ti ti-plus"></i> Tambah Akun</button>
    </div>
    <div id="kas-akun-tbl-scroll">
      <table class="tbl kas-akun-tbl">
        <thead><tr><th>Kode</th><th>Nama Akun</th><th>Kelompok</th><th>Sub Kelompok</th><th>Aksi</th></tr></thead>
        <tbody id="kas-akun-tbody"><tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table>
    </div>
  </div>
</div>
`;

setTimeout(() => {
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-kas'));
  _kasEnsureFlexLayout();
}, 80);

// ═══════════════════════════════════════════════════════════
// INJECT SHEETS & MODALS — BRImo-style flow (mobile) + modal edit (desktop)
// ═══════════════════════════════════════════════════════════
function _kasInjectSheets() {
  if (document.getElementById('kas-brimo-overlay')) return;
  document.body.insertAdjacentHTML('beforeend', `

<!-- ══════════════════════════════════════════════════════ -->
<!-- BRIMO OVERLAY — backdrop semua sheets                  -->
<!-- ══════════════════════════════════════════════════════ -->
<div id="kas-brimo-overlay" onclick="kasBrimoClose()"></div>

<!-- ══════════════════════════════════════════════════════ -->
<!-- SHEET 1: PILIH TIPE TRANSAKSI                          -->
<!-- ══════════════════════════════════════════════════════ -->
<div id="kas-sheet-tipe" class="kas-brimo-sheet">
  <div class="kas-brimo-handle"></div>
  <div class="kas-brimo-sheet-title">Jenis Transaksi</div>
  <div class="kas-tipe-grid">
    <button class="kas-tipe-cell" onclick="kasBrimoSelectTipe('pinjaman')">
      <div class="kas-tipe-icon"><i class="ti ti-building-bank"></i></div>
      <div class="kas-tipe-label">Pinjaman</div>
    </button>
    <button class="kas-tipe-cell" onclick="kasBrimoSelectTipe('bayar_pinjaman')">
      <div class="kas-tipe-icon"><i class="ti ti-credit-card"></i></div>
      <div class="kas-tipe-label">Bayar Pinjaman</div>
    </button>
    <button class="kas-tipe-cell" onclick="kasBrimoSelectTipe('keluar')">
      <div class="kas-tipe-icon"><i class="ti ti-arrow-up-right"></i></div>
      <div class="kas-tipe-label">Uang Keluar</div>
    </button>
    <button class="kas-tipe-cell" onclick="kasBrimoSelectTipe('masuk')">
      <div class="kas-tipe-icon"><i class="ti ti-arrow-down-left"></i></div>
      <div class="kas-tipe-label">Uang Masuk</div>
    </button>
    <button class="kas-tipe-cell" onclick="kasBrimoSelectTipe('jurnal')">
      <div class="kas-tipe-icon"><i class="ti ti-pencil"></i></div>
      <div>
        <div class="kas-tipe-label">Jurnal Umum</div>
        <div class="kas-tipe-desc">Koreksi & transfer akun</div>
      </div>
    </button>
    <button class="kas-tipe-cell" onclick="kasBrimoSelectTipe('penarikan')">
      <div class="kas-tipe-icon"><i class="ti ti-cash-banknote"></i></div>
      <div>
        <div class="kas-tipe-label">Penarikan Tunai</div>
        <div class="kas-tipe-desc">Kas/Bank ke Tunai</div>
      </div>
    </button>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ -->
<!-- SHEET 2: INPUT NOMINAL (BRImo style)                  -->
<!-- ══════════════════════════════════════════════════════ -->
<div id="kas-sheet-nominal" class="kas-brimo-sheet kas-sheet-nominal-full">
  <!-- Header info konteks -->
  <div id="kas-brimo-nominal-header">
    <button onclick="kasBrimoBack()" class="kas-brimo-back"><i class="ti ti-arrow-left"></i></button>
    <div id="kas-brimo-nominal-info">
      <div id="kas-brimo-tipe-badge"></div>
      <div class="kas-brimo-nominal-title">Masukkan Nominal</div>
    </div>
    <button onclick="kasBrimoClose()" class="kas-brimo-close-x">&#10005;</button>
  </div>

  <!-- Display nominal besar BRImo style -->
  <div id="kas-brimo-display-wrap">
    <div id="kas-brimo-display">
      <span class="kas-brimo-rp">Rp</span>
      <span id="kas-brimo-expr">0</span>
    </div>
    <div id="kas-brimo-hint">Minimal Rp0</div>
  </div>

  <!-- History chips -->
  <div id="kas-brimo-history"></div>

  <!-- Operator: tambah / kurang / bagi -->
  <div id="kas-brimo-opsrow" class="kas-brimo-numrow" style="padding:0 10px;margin-top:6px">
    <button class="kas-brimo-key kas-brimo-op" ontouchend="event.preventDefault();kasBrimoKey('+')" onclick="kasBrimoKey('+')">+</button>
    <button class="kas-brimo-key kas-brimo-op" ontouchend="event.preventDefault();kasBrimoKey('-')" onclick="kasBrimoKey('-')">&minus;</button>
    <button class="kas-brimo-key kas-brimo-op" ontouchend="event.preventDefault();kasBrimoKey('÷')" onclick="kasBrimoKey('÷')">&divide;</button>
  </div>

  <!-- Numpad BRImo full width -->
  <div id="kas-brimo-numpad">
    <div class="kas-brimo-numrow">
      <button class="kas-brimo-key kas-brimo-num" ontouchend="event.preventDefault();kasBrimoKey('1')" onclick="kasBrimoKey('1')">1</button>
      <button class="kas-brimo-key kas-brimo-num" ontouchend="event.preventDefault();kasBrimoKey('2')" onclick="kasBrimoKey('2')">2</button>
      <button class="kas-brimo-key kas-brimo-num" ontouchend="event.preventDefault();kasBrimoKey('3')" onclick="kasBrimoKey('3')">3</button>
    </div>
    <div class="kas-brimo-numrow">
      <button class="kas-brimo-key kas-brimo-num" ontouchend="event.preventDefault();kasBrimoKey('4')" onclick="kasBrimoKey('4')">4</button>
      <button class="kas-brimo-key kas-brimo-num" ontouchend="event.preventDefault();kasBrimoKey('5')" onclick="kasBrimoKey('5')">5</button>
      <button class="kas-brimo-key kas-brimo-num" ontouchend="event.preventDefault();kasBrimoKey('6')" onclick="kasBrimoKey('6')">6</button>
    </div>
    <div class="kas-brimo-numrow">
      <button class="kas-brimo-key kas-brimo-num" ontouchend="event.preventDefault();kasBrimoKey('7')" onclick="kasBrimoKey('7')">7</button>
      <button class="kas-brimo-key kas-brimo-num" ontouchend="event.preventDefault();kasBrimoKey('8')" onclick="kasBrimoKey('8')">8</button>
      <button class="kas-brimo-key kas-brimo-num" ontouchend="event.preventDefault();kasBrimoKey('9')" onclick="kasBrimoKey('9')">9</button>
    </div>
    <div class="kas-brimo-numrow">
      <button class="kas-brimo-key kas-brimo-num kas-brimo-000" ontouchend="event.preventDefault();kasBrimoKey('000')" onclick="kasBrimoKey('000')">000</button>
      <button class="kas-brimo-key kas-brimo-num" ontouchend="event.preventDefault();kasBrimoKey('0')" onclick="kasBrimoKey('0')">0</button>
      <button class="kas-brimo-key kas-brimo-del" ontouchend="event.preventDefault();kasBrimoKey('⌫')" onclick="kasBrimoKey('⌫')">
        <i class="ti ti-backspace" style="font-size:22px"></i>
      </button>
    </div>
    <div class="kas-brimo-numrow kas-brimo-action-row">
      <button class="kas-brimo-key kas-brimo-lanjut" ontouchend="event.preventDefault();kasBrimoLanjut()" onclick="kasBrimoLanjut()">Lanjut</button>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ -->
<!-- SHEET 3: DETAIL TRANSAKSI                              -->
<!-- ══════════════════════════════════════════════════════ -->
<div id="kas-sheet-detail" class="kas-brimo-sheet">
  <div class="kas-brimo-handle"></div>
  <!-- Ringkasan nominal + tipe di atas -->
  <div id="kas-brimo-detail-summary">
    <button onclick="kasBrimoBack()" class="kas-brimo-back" style="position:static;margin-right:8px"><i class="ti ti-arrow-left"></i></button>
    <div>
      <div id="kas-brimo-detail-badge"></div>
      <div id="kas-brimo-detail-nominal" style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:var(--ink)"></div>
    </div>
  </div>
  <!-- Hidden fields state -->
  <input type="hidden" id="kas-jrn-id">
  <input type="hidden" id="kas-jrn-tipe">
  <input type="hidden" id="kas-jrn-nominal">
  <!-- Form detail -->
  <div class="kas-brimo-detail-form">
    <div class="kas-brimo-field">
      <label class="kas-brimo-label">Tanggal</label>
      <input type="date" id="kas-jrn-tgl" class="kas-brimo-input" onchange="kasPjmAutoJatuhTempo('kas-pjm')">
    </div>
    <div class="kas-brimo-field">
      <label class="kas-brimo-label" id="kas-lbl-debit">Masuk ke Akun (Debit)</label>
      <select id="kas-jrn-akun-debit" style="display:none" onchange="kasHitungJurnal()"><option value="">— Pilih Akun —</option></select>
      <div class="kas-akun-wrap">
        <div class="kas-akun-picker kas-brimo-picker" id="picker-debit" data-target="kas-jrn-akun-debit" data-picker="picker-debit">
          <span id="picker-debit-label" style="color:var(--ink3)">— Pilih Akun —</span>
          <i class="ti ti-chevron-down" style="font-size:11px;margin-left:auto;flex-shrink:0"></i>
        </div>
        <div class="kas-akun-list" id="picker-debit-list" style="display:none"></div>
      </div>
    </div>
    <div class="kas-brimo-field">
      <label class="kas-brimo-label" id="kas-lbl-kredit">Sumber Dana (Kredit)</label>
      <select id="kas-jrn-akun-kredit" style="display:none" onchange="kasHitungJurnal()"><option value="">— Pilih Akun —</option></select>
      <div class="kas-akun-wrap">
        <div class="kas-akun-picker kas-brimo-picker" id="picker-kredit" data-target="kas-jrn-akun-kredit" data-picker="picker-kredit">
          <span id="picker-kredit-label" style="color:var(--ink3)">— Pilih Akun —</span>
          <i class="ti ti-chevron-down" style="font-size:11px;margin-left:auto;flex-shrink:0"></i>
        </div>
        <div class="kas-akun-list" id="picker-kredit-list" style="display:none"></div>
      </div>
    </div>
    <div class="kas-brimo-field">
      <label class="kas-brimo-label">Keterangan</label>
      <input type="text" id="kas-jrn-ket" class="kas-brimo-input" placeholder="mis: bayar iklan Shopee...">
    </div>
    <div class="kas-brimo-field kas-ref-field">
      <label class="kas-brimo-label">No. Referensi <span style="color:var(--ink3);font-weight:400">(opsional)</span></label>
      <input type="text" id="kas-jrn-ref" class="kas-brimo-input" placeholder="mis: INV-001">
    </div>

    <!-- ── Extra fields: hanya muncul saat tipe = pinjaman ── -->
    <div id="kas-pinjaman-extra" style="display:none">
      <div style="margin:8px 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:var(--ink3);text-transform:uppercase">Detail Pinjaman</div>
      <div class="kas-brimo-field">
        <label class="kas-brimo-label">Nama Kreditur <span style="color:var(--danger)">*</span></label>
        <input type="text" id="kas-pjm-kreditur" class="kas-brimo-input" placeholder="mis: KUR BRI, Pak Hasan...">
      </div>
      <div style="display:flex;gap:10px">
        <div class="kas-brimo-field" style="flex:1">
          <label class="kas-brimo-label">Bunga (%/bln)</label>
          <input type="number" id="kas-pjm-bunga" class="kas-brimo-input" placeholder="0" min="0" step="0.1">
        </div>
        <div class="kas-brimo-field" style="flex:1">
          <label class="kas-brimo-label">Frekuensi</label>
          <select id="kas-pjm-frekuensi" class="kas-brimo-input" onchange="kasPjmFrekuensiChange(this.value,'kas-pjm')">
            <option value="bulanan" selected>Bulanan</option>
            <option value="tahunan">Tahunan</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <div class="kas-brimo-field" style="flex:1">
          <label class="kas-brimo-label">Tgl Cicilan</label>
          <input type="number" id="kas-pjm-tgl-cicilan" class="kas-brimo-input" placeholder="mis: 10" min="1" max="31" inputmode="numeric" oninput="kasPjmAutoJatuhTempo('kas-pjm')">
        </div>
        <div class="kas-brimo-field" style="flex:1">
          <label class="kas-brimo-label kas-pjm-cicilan-lbl">Cicilan/Bulan <span style="color:var(--ink3);font-weight:400">(opsional)</span></label>
          <input type="text" id="kas-pjm-cicilan" class="kas-brimo-input kas-idr-input" placeholder="Rp0" inputmode="numeric">
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <div class="kas-brimo-field kas-pjm-bln-wrap" style="flex:1;display:none">
          <label class="kas-brimo-label">Bulan Cicilan</label>
          <select id="kas-pjm-bln-cicilan" class="kas-brimo-input">
            <option value="">— Pilih —</option>
            <option value="1">Januari</option><option value="2">Februari</option><option value="3">Maret</option>
            <option value="4">April</option><option value="5">Mei</option><option value="6">Juni</option>
            <option value="7">Juli</option><option value="8">Agustus</option><option value="9">September</option>
            <option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
          </select>
        </div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.07);margin:8px 0 4px;padding-top:8px;display:flex;gap:10px">
        <div class="kas-brimo-field" style="flex:1">
          <label class="kas-brimo-label" style="color:var(--ink3)">Tenor (bulan) <span style="font-size:10px">↓ auto</span></label>
          <input type="number" id="kas-pjm-tenor" class="kas-brimo-input" placeholder="mis: 12" min="1" oninput="kasPjmAutoJatuhTempo('kas-pjm')">
        </div>
        <div class="kas-brimo-field" style="flex:1">
          <label class="kas-brimo-label" style="color:var(--ink3)">Jatuh Tempo <span style="font-size:10px">↓ auto</span></label>
          <input type="date" id="kas-pjm-jatuh-tempo" class="kas-brimo-input">
        </div>
      </div>
    </div>

    <div id="kas-preview-entry" style="display:none;background:var(--cream2);border:1.5px dashed var(--ink3);padding:8px 12px;border-radius:8px;font-size:12px;margin-bottom:4px;color:var(--ink2)">
      <b>Preview Jurnal:</b><br><span id="kas-preview-text"></span>
    </div>
  </div>
  <!-- Sticky action bar -->
  <div class="kas-brimo-action-bar">
    <button class="kas-brimo-btn-batal" onclick="kasBrimoClose()"><i class="ti ti-x"></i> Batal</button>
    <button class="kas-brimo-btn-simpan" onclick="kasSimpanJurnal()"><i class="ti ti-device-floppy"></i> Simpan</button>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ -->
<!-- MODAL: EDIT TRANSAKSI (desktop + mobile edit)         -->
<!-- ══════════════════════════════════════════════════════ -->
<div class="modal-overlay" id="modal-kas-transaksi" onclick="if(event.target===this)hideModal('modal-kas-transaksi')">
  <div class="modal" style="max-width:520px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" id="kas-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-edit"></i> Edit Transaksi</div>
      <button onclick="hideModal('modal-kas-transaksi')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="kas-edit-id">
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 120px;min-width:110px"><label>Tanggal</label><input type="date" id="kas-edit-tgl" onchange="kasPjmAutoJatuhTempo('kas-edit-pjm')"></div>
      <div class="form-group" style="flex:1 1 140px;min-width:130px"><label>Tipe</label>
        <select id="kas-edit-tipe" onchange="kasOnEditTipeChange()" style="display:none">
          <option value="jurnal">Jurnal Umum</option>
          <option value="bayar_pinjaman">Bayar Pinjaman</option>
          <option value="pinjaman">Pinjaman</option>
          <option value="keluar">Uang Keluar</option>
          <option value="masuk">Uang Masuk</option>
          <option value="penarikan">Penarikan Tunai</option>
        </select>
        <div id="kas-edit-tipe-picker" class="kas-tipe-picker" onclick="kasToggleTipePicker(this)" style="position:relative">
          <div class="kas-tipe-picker-val">
            <span class="kas-tipe-picker-icon"></span>
            <span class="kas-tipe-picker-lbl">Pilih Tipe</span>
          </div>
          <i class="ti ti-chevron-down" style="font-size:14px;color:var(--ink3);transition:transform 0.2s"></i>
        </div>
      </div>
      <div class="form-group" style="flex:1 1 130px;min-width:120px"><label>Nominal (Rp)</label><input type="text" inputmode="numeric" id="kas-edit-nominal" placeholder="0" oninput="kasHitungEditJurnal()" style="cursor:pointer"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 160px;min-width:140px">
        <label id="kas-edit-lbl-debit">Masuk ke Akun (Debit)</label>
        <select id="kas-edit-akun-debit" style="display:none" onchange="kasHitungEditJurnal()"><option value="">— Pilih Akun —</option></select>
        <div class="kas-akun-wrap">
          <div class="kas-akun-picker" id="picker-edit-debit" data-target="kas-edit-akun-debit" data-picker="picker-edit-debit">
            <span id="picker-edit-debit-label" style="color:var(--ink3)">— Pilih Akun —</span>
            <i class="ti ti-chevron-down" style="font-size:11px;margin-left:auto;flex-shrink:0"></i>
          </div>
          <div class="kas-akun-list" id="picker-edit-debit-list" style="display:none"></div>
        </div>
      </div>
      <div class="form-group" style="flex:1 1 160px;min-width:140px">
        <label id="kas-edit-lbl-kredit">Sumber Dana (Kredit)</label>
        <select id="kas-edit-akun-kredit" style="display:none" onchange="kasHitungEditJurnal()"><option value="">— Pilih Akun —</option></select>
        <div class="kas-akun-wrap">
          <div class="kas-akun-picker" id="picker-edit-kredit" data-target="kas-edit-akun-kredit" data-picker="picker-edit-kredit">
            <span id="picker-edit-kredit-label" style="color:var(--ink3)">— Pilih Akun —</span>
            <i class="ti ti-chevron-down" style="font-size:11px;margin-left:auto;flex-shrink:0"></i>
          </div>
          <div class="kas-akun-list" id="picker-edit-kredit-list" style="display:none"></div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:2 1 200px"><label>Keterangan</label><input type="text" id="kas-edit-ket" placeholder="mis: bayar iklan Shopee..."></div>
      <div class="form-group" style="flex:1 1 120px"><label>No. Referensi <span style="color:var(--ink3);font-weight:400">(opsional)</span></label><input type="text" id="kas-edit-ref" placeholder="mis: INV-001"></div>
    </div>
    <!-- ── Extra fields: hanya muncul saat tipe = pinjaman (modal Edit) ── -->
    <div id="kas-edit-pinjaman-extra" style="display:none;margin-bottom:10px">
      <div style="margin:8px 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;color:var(--ink3);text-transform:uppercase">Detail Pinjaman</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">
        <div class="form-group" style="flex:2 1 160px"><label>Nama Kreditur <span style="color:var(--danger)">*</span></label><input type="text" id="kas-edit-pjm-kreditur" placeholder="mis: KUR BRI, Pak Hasan..."></div>
        <div class="form-group" style="flex:1 1 90px"><label>Bunga (%/bln)</label><input type="number" id="kas-edit-pjm-bunga" placeholder="0" min="0" step="0.1"></div>
        <div class="form-group" style="flex:1 1 100px"><label>Frekuensi</label>
          <select id="kas-edit-pjm-frekuensi" onchange="kasPjmFrekuensiChange(this.value,'kas-edit-pjm')">
            <option value="bulanan" selected>Bulanan</option>
            <option value="tahunan">Tahunan</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">
        <div class="form-group" style="flex:1 1 80px"><label>Tgl Cicilan</label><input type="number" id="kas-edit-pjm-tgl-cicilan" placeholder="mis: 10" min="1" max="31" oninput="kasPjmAutoJatuhTempo('kas-edit-pjm')"></div>
        <div class="form-group" style="flex:1 1 140px"><label class="kas-edit-pjm-cicilan-lbl">Cicilan/Bulan <span style="color:var(--ink3);font-weight:400">(opsional)</span></label><input type="text" id="kas-edit-pjm-cicilan" class="kas-idr-input" placeholder="Rp0" inputmode="numeric"></div>
      </div>
      <div class="form-group kas-edit-pjm-bln-wrap" style="display:none"><label>Bulan Cicilan</label>
        <select id="kas-edit-pjm-bln-cicilan">
          <option value="">— Pilih —</option>
          <option value="1">Januari</option><option value="2">Februari</option><option value="3">Maret</option>
          <option value="4">April</option><option value="5">Mei</option><option value="6">Juni</option>
          <option value="7">Juli</option><option value="8">Agustus</option><option value="9">September</option>
          <option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
        </select>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,0.07);margin-top:8px;padding-top:8px">
        <div class="form-group" style="flex:1 1 80px"><label style="color:var(--ink3)">Tenor (bulan) <span style="font-size:10px">↓ auto</span></label><input type="number" id="kas-edit-pjm-tenor" placeholder="mis: 12" min="1" oninput="kasPjmAutoJatuhTempo('kas-edit-pjm')"></div>
        <div class="form-group" style="flex:1 1 140px"><label style="color:var(--ink3)">Jatuh Tempo <span style="font-size:10px">↓ auto</span></label><input type="date" id="kas-edit-pjm-jatuh-tempo"></div>
      </div>
    </div>

    <div id="kas-edit-preview" style="display:none;background:var(--cream2);border:1.5px dashed var(--ink3);padding:8px 12px;border-radius:2px;font-size:12px;margin-bottom:10px;color:var(--ink2)">
      <b>Preview Jurnal:</b><br><span id="kas-edit-preview-text"></span>
    </div>
    <div class="modal-actions" style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
      <button class="btn btn-sm btn-danger" onclick="kasHapusDariModal()" id="kas-edit-btn-hapus" style="display:none"><i class="ti ti-trash"></i> Hapus</button>
      <button class="btn btn-sm" onclick="hideModal('modal-kas-transaksi')" style="flex:1"><i class="ti ti-x"></i> Batal</button>
      <button class="btn btn-primary btn-sm" onclick="kasUpdateJurnal()" style="flex:1"><i class="ti ti-device-floppy"></i> Simpan</button>
    </div>
  </div>
</div>

<!-- MODAL: TAMBAH/EDIT AKUN -->
<div class="modal-overlay" id="modal-kas-akun" onclick="if(event.target===this)hideModal('modal-kas-akun')">
  <div class="modal" style="max-width:520px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" id="akun-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-plus"></i> Tambah Akun Baru</div>
      <button onclick="hideModal('modal-kas-akun')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="akun-edit-id">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:10px">
      <div class="form-group" style="flex:0 1 100px;min-width:90px"><label>Kode Akun</label><input type="text" id="akun-kode" placeholder="mis: 1-001"></div>
      <div class="form-group" style="flex:1 1 160px;min-width:140px"><label>Nama Akun</label><input type="text" id="akun-nama" placeholder="mis: Kas Tunai"></div>
      <div class="form-group" style="flex:1 1 140px;min-width:120px"><label>Kelompok</label>
        <select id="akun-kelompok" style="width:100%">
          <option value="aset">Aset</option>
          <option value="kewajiban">Kewajiban</option>
          <option value="modal">Modal</option>
          <option value="pendapatan">Pendapatan</option>
          <option value="beban">Beban</option>
        </select>
      </div>
      <div class="form-group" style="flex:1 1 140px;min-width:120px"><label>Sub Kelompok <span style="color:var(--ink3);font-weight:400">(opsional)</span></label><input type="text" id="akun-sub" placeholder="mis: Kas & Bank"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="kasSimpanAkun()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-kas-akun')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>
`);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _kasInjectSheets);
} else {
  _kasInjectSheets();
}

// ─── TAB ─────────────────────────────────────────────────────
// ── Kas tab meta ─────────────────────────────────────────────
var _kasTabMeta = {
  jurnal:  { label:'Jurnal Harian', icon:'ti-notebook'  },
  laporan: { label:'Laporan',       icon:'ti-chart-bar' },
  akun:    { label:'Kelola Akun',   icon:'ti-settings'  }
};

// ── Tab dropdown portal ───────────────────────────────────────
function _kasEnsureTabDD() {
  if (document.getElementById('kas-tab-dropdown')) return;
  var dd = document.createElement('div');
  dd.id = 'kas-tab-dropdown';
  dd.innerHTML =
    '<div class="dd-section">Menu</div>' +
    '<button class="dd-item active" data-tab="jurnal" onclick="kasGotoTab(&quot;jurnal&quot;)"><i class="ti ti-notebook"></i> Jurnal Harian</button>' +
    '<button class="dd-item" data-tab="laporan" onclick="kasGotoTab(&quot;laporan&quot;)"><i class="ti ti-chart-bar"></i> Laporan</button>' +
    '<button class="dd-item" data-tab="akun" onclick="kasGotoTab(&quot;akun&quot;)"><i class="ti ti-settings"></i> Kelola Akun</button>';
  document.body.appendChild(dd);
}

function kasToggleTabDD() {
  _kasEnsureTabDD();
  var dd  = document.getElementById('kas-tab-dropdown');
  var btn = document.getElementById('kas-tab-trigger');
  if (!dd || !btn) return;
  var isOpen = dd.classList.contains('open');
  if (!isOpen) {
    var rect = btn.getBoundingClientRect();
    dd.style.top   = (rect.bottom + 6) + 'px';
    dd.style.left  = 'auto';
    dd.style.right = (window.innerWidth - rect.right) + 'px';
  }
  dd.classList.toggle('open', !isOpen);
  btn.classList.toggle('open', !isOpen);
}

// ── Filter bulan dropdown ─────────────────────────────────────
function _kasEnsureBulanDD() {
  if (document.getElementById('kas-bulan-dropdown')) return;
  var dd = document.createElement('div');
  dd.id = 'kas-bulan-dropdown';
  // Generate 12 bulan terakhir
  var html = '<div class="dd-section">Filter Periode</div>';
  html += '<div class="dd-list">';
  html += '<button class="dd-item active" data-bulan="" onclick="kasSetBulan(&quot;&quot;)"><i class="ti ti-calendar-off"></i> Semua periode</button>';
  var now = new Date();
  for (var i = 0; i < 12; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var val = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    var lbl = d.toLocaleDateString('id-ID', {month:'long', year:'numeric'});
    html += '<button class="dd-item" data-bulan="'+val+'" onclick="kasSetBulan(&quot;'+val+'&quot;)"><i class="ti ti-calendar"></i> '+lbl+'</button>';
  }
  html += '</div>';
  dd.innerHTML = html;
  document.body.appendChild(dd);
}

function kasToggleBulanDD() {
  _kasEnsureBulanDD();
  var dd  = document.getElementById('kas-bulan-dropdown');
  var btn = document.getElementById('kas-bulan-trigger');
  if (!dd || !btn) return;
  var isOpen = dd.classList.contains('open');
  if (!isOpen) {
    var rect = btn.getBoundingClientRect();
    dd.style.top  = (rect.bottom + 6) + 'px';
    dd.style.left = rect.left + 'px';
    dd.style.right = 'auto';
  }
  dd.classList.toggle('open', !isOpen);
  var arr = document.getElementById('kas-bulan-arr');
  if (arr) arr.style.transform = isOpen ? '' : 'rotate(180deg)';
}

function kasSetBulan(val) {
  var inp = document.getElementById('kas-filter-bulan');
  if (inp) { inp.value = val; kasApplyFilter(); }
  // Update label
  var lbl = document.getElementById('kas-bulan-label');
  if (lbl) {
    if (!val) { lbl.textContent = 'Semua'; }
    else {
      var d = new Date(val + '-01');
      lbl.textContent = d.toLocaleDateString('id-ID', {month:'short', year:'numeric'});
    }
  }
  // Update active state di dropdown
  var dd = document.getElementById('kas-bulan-dropdown');
  if (dd) dd.querySelectorAll('.dd-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.bulan === val);
  });
  // Tutup dropdown
  var ddEl = document.getElementById('kas-bulan-dropdown');
  if (ddEl) ddEl.classList.remove('open');
  var arr = document.getElementById('kas-bulan-arr');
  if (arr) arr.style.transform = '';
}

// Tutup semua dropdown kas kalau klik luar
document.addEventListener('click', function(e) {
  if (!e.target.closest('#kas-tab-trigger') && !e.target.closest('#kas-tab-dropdown')) {
    var dd = document.getElementById('kas-tab-dropdown');
    var btn = document.getElementById('kas-tab-trigger');
    if (dd) dd.classList.remove('open');
    if (btn) btn.classList.remove('open');
  }
  if (!e.target.closest('#kas-bulan-wrap') && !e.target.closest('#kas-bulan-dropdown')) {
    var dd = document.getElementById('kas-bulan-dropdown');
    if (dd) dd.classList.remove('open');
    var arr = document.getElementById('kas-bulan-arr');
    if (arr) arr.style.transform = '';
  }
});

function kasGotoTab(tab) {
  const tabs = ['jurnal','laporan','akun'];
  // Sync dropdown
  var tabDD = document.getElementById('kas-tab-dropdown');
  if (tabDD) tabDD.querySelectorAll('.dd-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  var meta = _kasTabMeta[tab];
  if (meta) {
    var lbl = document.getElementById('kas-tab-label');
    var icn = document.getElementById('kas-tab-icon');
    if (lbl) lbl.textContent = meta.label;
    if (icn) icn.className = 'ti ' + meta.icon;
  }
  var dd = document.getElementById('kas-tab-dropdown');
  var btn = document.getElementById('kas-tab-trigger');
  if (dd) dd.classList.remove('open');
  if (btn) btn.classList.remove('open');
  document.querySelectorAll('#page-kas .kas-tab').forEach((t,i) => t.classList.toggle('active', tabs[i] === tab));
  document.querySelectorAll('#page-kas .kas-panel').forEach(p => {
    p.classList.remove('active');
    p.style.overflowY = '';
    p.style.height    = '';
    p.style.maxHeight = '';
    p.style.padding   = '';
    p.style.flex      = '';
    p.style.minHeight = '';
  });
  var targetPanel = document.getElementById('kas-panel-' + tab);
  if (targetPanel) {
    targetPanel.classList.add('active');
    if (tab === 'akun') {
      // Panel akun: lock height via window.innerHeight agar tidak ikut dvh dinamis
      _kasLockPanelHeight(targetPanel);
      if (!targetPanel._kasResizeHandler) {
        targetPanel._kasResizeHandler = function() {
          var active = document.querySelector('#page-kas .kas-panel.active');
          if (active && active.id === 'kas-panel-akun') _kasLockPanelHeight(active);
        };
        window.addEventListener('resize', targetPanel._kasResizeHandler, { passive: true });
      }
    }
    // Panel laporan: pakai flex column chain — tidak perlu lock height manual
  }
  var toolbar = document.getElementById('kas-jurnal-toolbar');
  if (toolbar) toolbar.style.display = tab === 'jurnal' ? 'flex' : 'none';
  if (tab === 'laporan') kasRenderLaporan();
  if (tab === 'akun')    kasLoadAkun();
}

function _kasLockPanelHeight(panel) {
  var topBar = document.getElementById('kas-top-bar');
  var tabsEl = document.querySelector('#page-kas > .kas-tabs');
  var topH   = topBar ? topBar.getBoundingClientRect().height : 0;
  var tabH   = tabsEl ? tabsEl.getBoundingClientRect().height : 0;
  var avail  = window.innerHeight - topH - tabH;
  if (avail > 100) {
    panel.style.height    = avail + 'px';
    panel.style.maxHeight = avail + 'px';
    panel.style.flex      = 'none';
    panel.style.minHeight = '0';
    panel.style.overflowY = 'auto';
  }
}

// ─── LOAD AKUN ───────────────────────────────────────────────
async function kasLoadAkun() {
  try {
    const data = await dbGet('kas_akun', '&order=kode.asc');
    _kasAkunMap = {};
    (data || []).forEach(a => { _kasAkunMap[a.id] = a; });
    kasRenderAkunTabel(data || []);
    kasPopulateAkunDropdown(data || []);
  } catch(e) {
    document.getElementById('kas-akun-tbody').innerHTML = `<tr><td colspan="5" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
  }
}

function kasKelompokLabel(k) {
  return { aset:'Aset', kewajiban:'Kewajiban', modal:'Modal', pendapatan:'Pendapatan', beban:'Beban' }[k] || k;
}

function kasRenderAkunTabel(data) {
  const tbody = document.getElementById('kas-akun-tbody');
  if (!data.length) { tbody.innerHTML = `<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Belum ada akun</td></tr>`; return; }
  const order = ['aset','kewajiban','modal','pendapatan','beban'];
  const sorted = [...data].sort((a,b) => { const ki = order.indexOf(a.kelompok) - order.indexOf(b.kelompok); return ki !== 0 ? ki : (a.kode||'').localeCompare(b.kode||''); });
  tbody.innerHTML = sorted.map(a => {
    const safeNama = (a.nama||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    return `<tr>
      <td style="font-weight:700;font-family:monospace">${a.kode||'—'}</td>
      <td>${a.nama||'—'}</td>
      <td><span class="akun-badge akun-${a.kelompok}">${kasKelompokLabel(a.kelompok)}</span></td>
      <td style="color:var(--ink3);font-size:12px">${a.sub_kelompok||'—'}</td>
      <td>
        <button class="btn btn-sm" data-action="edit-akun" data-id="${a.id}" style="margin-right:4px"><i class="ti ti-edit"></i></button>
        <button class="btn btn-sm btn-danger" data-action="hapus-akun" data-id="${a.id}" data-nama="${safeNama}"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function kasPopulateAkunDropdown(data) {
  const order = ['aset','kewajiban','modal','pendapatan','beban'];
  const grouped = {}; order.forEach(k => grouped[k] = []);
  data.forEach(a => { if (grouped[a.kelompok]) grouped[a.kelompok].push(a); });
  let html = '<option value="">— Pilih Akun —</option>';
  order.forEach(k => {
    if (!grouped[k].length) return;
    html += `<optgroup label="── ${kasKelompokLabel(k)} ──">`;
    grouped[k].forEach(a => { html += `<option value="${a.id}">${a.kode ? a.kode+' · ' : ''}${a.nama}</option>`; });
    html += '</optgroup>';
  });
  // Populate semua select — BRImo sheet + modal edit
  ['kas-jrn-akun-debit','kas-jrn-akun-kredit','kas-edit-akun-debit','kas-edit-akun-kredit'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = html; });
  // Populate custom picker list — BRImo sheet
  kasPopulatePickerList('picker-debit-list', data);
  kasPopulatePickerList('picker-kredit-list', data);
  // Populate custom picker list — modal edit
  kasPopulatePickerList('picker-edit-debit-list', data);
  kasPopulatePickerList('picker-edit-kredit-list', data);
}

async function kasSimpanAkun() {
  const id   = document.getElementById('akun-edit-id').value;
  const data = { kode: document.getElementById('akun-kode').value.trim(), nama: document.getElementById('akun-nama').value.trim(), kelompok: document.getElementById('akun-kelompok').value, sub_kelompok: document.getElementById('akun-sub').value.trim() || null };
  if (!data.nama) { alert('Nama akun wajib diisi!'); return; }
  try {
    if (id) { await dbUpdate('kas_akun', id, data); } else { await dbInsert('kas_akun', data); }
    kasResetFormAkun(); kasLoadAkun();
  } catch(e) { alert('Gagal simpan: ' + e.message); }
}

function kasResetFormAkun() {
  ['akun-edit-id','akun-kode','akun-nama','akun-sub'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('akun-kelompok').value = 'aset';
  document.getElementById('akun-form-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Akun Baru';
}

function kasShowFormAkun() {
  kasResetFormAkun();
  showModal('modal-kas-akun');
}

async function kasEditAkun(id) {
  const a = _kasAkunMap[id]; if (!a) return;
  document.getElementById('akun-edit-id').value  = a.id;
  document.getElementById('akun-kode').value     = a.kode || '';
  document.getElementById('akun-nama').value     = a.nama || '';
  document.getElementById('akun-kelompok').value = a.kelompok || 'aset';
  document.getElementById('akun-sub').value      = a.sub_kelompok || '';
  document.getElementById('akun-form-title').innerHTML = '<i class="ti ti-edit"></i> Edit Akun';
  showModal('modal-kas-akun');
}

async function kasHapusAkun(id, nama) {
  confirmDelete(`Hapus akun "${nama}"?`, async () => {
    try { await dbDelete('kas_akun', id); kasLoadAkun(); } catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// ─── FORM JURNAL ─────────────────────────────────────────────
// Desktop: langsung buka modal edit-style. Mobile: BRImo sheet flow.
function kasShowForm() {
  if (window.innerWidth >= 768) {
    // Desktop: modal klasik (reuse modal-kas-transaksi sebagai tambah)
    document.getElementById('kas-form-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Transaksi';
    document.getElementById('kas-edit-id').value = '';
    var btnHapus = document.getElementById('kas-edit-btn-hapus');
    if (btnHapus) btnHapus.style.display = 'none';
    (function() {
      var now = new Date();
      document.getElementById('kas-edit-tgl').value = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
    })();
    document.getElementById('kas-edit-tipe').value = 'keluar'; kasSyncTipePicker('keluar');
    idrSet('kas-edit-nominal', 0);
    document.getElementById('kas-edit-ket').value = '';
    document.getElementById('kas-edit-ref').value = '';
    document.getElementById('kas-edit-preview').style.display = 'none';
    // Reset pinjaman extra (modal)
    var exEdit = document.getElementById('kas-edit-pinjaman-extra');
    if (exEdit) {
      exEdit.style.display = 'none';
      ['kas-edit-pjm-kreditur','kas-edit-pjm-bunga','kas-edit-pjm-tenor','kas-edit-pjm-frekuensi','kas-edit-pjm-cicilan','kas-edit-pjm-tgl-cicilan','kas-edit-pjm-bln-cicilan','kas-edit-pjm-jatuh-tempo']
        .forEach(function(eid){ var el=document.getElementById(eid); if(el) el.value=''; });
    }
    kasOnEditTipeChange();
    showModal('modal-kas-transaksi');
    setTimeout(function() { if (typeof idrInput === 'function') idrInput('kas-edit-nominal'); }, 80);
  } else {
    // Mobile: BRImo flow → mulai dari Sheet 1 (pilih tipe)
    kasBrimoShowStep('tipe');
  }
}

function kasCancelForm() { kasBrimoClose(); hideModal('modal-kas-transaksi'); }

// ── Picker delegation: setup SEKALI per modal ─────────────────
// Hindari inline ontouchstart/onmousedown yang tidak reliable di Android
(function() {
  var _bound = false;
  window._kasPickerDelegateInit = function() {
    if (_bound) return;
    _bound = true;
    // Gunakan 'pointerdown' — works di semua browser modern (Chrome Android, iOS Safari 13+)
    // Fallback touchstart untuk iOS Safari < 13
    var evName = window.PointerEvent ? 'pointerdown' : 'touchstart';
    document.addEventListener(evName, function(e) {
      var picker = e.target.closest ? e.target.closest('[data-picker]') : null;
      if (!picker) return;
      // stopPropagation cegah outside handler
      e.stopPropagation();
      // preventDefault hanya untuk touch agar tidak double-fire dengan click
      if (e.type === 'touchstart') e.preventDefault();
      kasTogglePicker(picker.dataset.picker);
    }, evName === 'touchstart' ? { passive: false } : true);
  };
  window._kasPickerDelegateInit();
})();

// ═══════════════════════════════════════════════════════════
// BRIMO FLOW — sheet-based mobile flow (Tambah Transaksi)
// ═══════════════════════════════════════════════════════════
(function() {
  var _brimoExpr  = '';
  var _brimoTipe  = 'masuk';
  var _brimoStep  = ''; // 'tipe' | 'nominal' | 'detail'

  // ── Buka overlay + sheet tertentu ─────────────────────
  window.kasBrimoShowStep = function(step) {
    _kasInjectSheets();
    _brimoStep = step;
    var overlay = document.getElementById('kas-brimo-overlay');
    ['tipe','nominal','detail'].forEach(function(s) {
      var el = document.getElementById('kas-sheet-' + s);
      if (el) el.classList.remove('open');
    });
    if (overlay) overlay.classList.add('open');
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        var el = document.getElementById('kas-sheet-' + step);
        if (el) el.classList.add('open');
        if (step === 'nominal') _brimoUpdateDisplay();
        if (step === 'nominal') _brimoLoadHistory();
      });
    });
  };

  // ── Pilih tipe → ke nominal ────────────────────────────
  window.kasBrimoSelectTipe = function(tipe) {
    _brimoTipe = tipe;
    _brimoExpr = '';
    var badge = document.getElementById('kas-brimo-tipe-badge');
    var labels = { masuk:'Uang Masuk', keluar:'Uang Keluar', jurnal:'Jurnal Umum', pinjaman:'Pinjaman', bayar_pinjaman:'Bayar Pinjaman', penarikan:'Penarikan Tunai' };
    var colors = { masuk:'#3ecf6e', keluar:'#e05260', jurnal:'#6495ed', pinjaman:'#8a2be2', bayar_pinjaman:'#ffa500', penarikan:'#20b2aa' };
    if (badge) {
      badge.textContent = labels[tipe] || tipe;
      badge.style.color = colors[tipe] || 'var(--ink2)';
      badge.style.fontWeight = '700';
      badge.style.fontSize = '13px';
    }
    var sTipe = document.getElementById('kas-sheet-tipe');
    if (sTipe) sTipe.classList.remove('open');
    setTimeout(function() { kasBrimoShowStep('nominal'); }, 180);
  };

  // ── Tombol Lanjut dari nominal → detail ───────────────
  window.kasBrimoLanjut = function() {
    var result = _brimoEval();
    if (!result || result <= 0) {
      var expr = document.getElementById('kas-brimo-expr');
      if (expr) { expr.style.color = '#e05260'; setTimeout(function(){ expr.style.color = ''; }, 600); }
      return;
    }
    document.getElementById('kas-jrn-nominal').value = result;
    document.getElementById('kas-jrn-tipe').value = _brimoTipe;
    var tglEl = document.getElementById('kas-jrn-tgl');
    if (tglEl && !tglEl.value) {
      var now = new Date();
      tglEl.value = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
    }
    var labels = { masuk:'Uang Masuk', keluar:'Uang Keluar', jurnal:'Jurnal Umum', pinjaman:'Pinjaman', bayar_pinjaman:'Bayar Pinjaman', penarikan:'Penarikan Tunai' };
    var colors = { masuk:'#3ecf6e', keluar:'#e05260', jurnal:'#6495ed', pinjaman:'#8a2be2', bayar_pinjaman:'#ffa500', penarikan:'#20b2aa' };
    var db = document.getElementById('kas-brimo-detail-badge');
    if (db) { db.textContent = labels[_brimoTipe]; db.style.color = colors[_brimoTipe]; db.style.fontWeight='700'; db.style.fontSize='12px'; }
    var dn = document.getElementById('kas-brimo-detail-nominal');
    if (dn) dn.textContent = 'Rp' + result.toLocaleString('id-ID');
    kasOnTipeChange();
    ['picker-debit','picker-kredit'].forEach(function(pid) {
      var lbl = document.getElementById(pid+'-label');
      if (lbl) { lbl.textContent = '\u2014 Pilih Akun \u2014'; lbl.style.color = 'var(--ink3)'; }
    });
    var selD = document.getElementById('kas-jrn-akun-debit');
    var selK = document.getElementById('kas-jrn-akun-kredit');
    if (selD) selD.value = '';
    if (selK) selK.value = '';
    var prev = document.getElementById('kas-preview-entry');
    if (prev) prev.style.display = 'none';
    // Reset keterangan & ref
    var ketEl = document.getElementById('kas-jrn-ket');
    var refEl = document.getElementById('kas-jrn-ref');
    if (ketEl) ketEl.value = '';
    if (refEl) refEl.value = '';
    var sNom = document.getElementById('kas-sheet-nominal');
    if (sNom) sNom.classList.remove('open');
    setTimeout(function() { kasBrimoShowStep('detail'); }, 200);
  };

  // ── Tombol Back ────────────────────────────────────────
  window.kasBrimoBack = function() {
    if (_brimoStep === 'nominal') {
      var sNom = document.getElementById('kas-sheet-nominal');
      if (sNom) sNom.classList.remove('open');
      setTimeout(function() { kasBrimoShowStep('tipe'); }, 180);
    } else if (_brimoStep === 'detail') {
      var sDet = document.getElementById('kas-sheet-detail');
      if (sDet) sDet.classList.remove('open');
      setTimeout(function() { kasBrimoShowStep('nominal'); }, 180);
    }
  };

  // ── Tutup semua sheets ─────────────────────────────────
  window.kasBrimoClose = function() {
    var overlay = document.getElementById('kas-brimo-overlay');
    ['tipe','nominal','detail'].forEach(function(s) {
      var el = document.getElementById('kas-sheet-' + s);
      if (el) el.classList.remove('open');
    });
    setTimeout(function() {
      if (overlay) overlay.classList.remove('open');
    }, 260);
    _brimoStep = '';
    _brimoExpr = '';
    // Reset pinjaman extra fields
    var ex = document.getElementById('kas-pinjaman-extra');
    if (ex) {
      ex.style.display = 'none';
      ['kas-pjm-kreditur','kas-pjm-bunga','kas-pjm-tenor','kas-pjm-frekuensi','kas-pjm-cicilan','kas-pjm-tgl-cicilan','kas-pjm-bln-cicilan','kas-pjm-jatuh-tempo']
        .forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    }
  };

  // Segmen angka terakhir dalam ekspresi (setelah operator terakhir, kalau ada)
  var _brimoOps = '+-\u00F7';
  function _brimoLastSegment() {
    var m = _brimoExpr.match(/[0-9]+$/);
    return m ? m[0] : '';
  }

  // ── Key handler numpad BRImo (dukung + − ÷) ────────────
  window.kasBrimoKey = function(k) {
    if (k === '\u232B') {
      _brimoExpr = _brimoExpr.slice(0, -1);
    } else if (_brimoOps.indexOf(k) >= 0) {
      // Tombol operator: gak boleh jadi karakter pertama,
      // dan operator beruntun akan saling menggantikan (bukan menumpuk)
      if (!_brimoExpr) return;
      var lastCh = _brimoExpr.charAt(_brimoExpr.length - 1);
      if (_brimoOps.indexOf(lastCh) >= 0) {
        _brimoExpr = _brimoExpr.slice(0, -1) + k;
      } else {
        _brimoExpr += k;
      }
    } else if (k === '000') {
      var seg000 = _brimoLastSegment();
      if (!seg000 || seg000 === '0') return;
      if (seg000.length >= 12) return;
      _brimoExpr += k;
    } else {
      // digit 0-9
      var seg = _brimoLastSegment();
      if (!_brimoExpr && k === '0') { _brimoExpr = '0'; }
      else if (seg === '0') { _brimoExpr = _brimoExpr.slice(0, -1) + k; }
      else {
        if (seg.length >= 13) return;
        _brimoExpr += k;
      }
    }
    _brimoUpdateDisplay();
  };

  function _brimoEval() {
    if (!_brimoExpr) return 0;
    // buang operator nyantol di ujung (belum diisi angka berikutnya)
    var expr = _brimoExpr.replace(/[+\-\u00F7]+$/, '');
    if (!expr) return 0;
    var tokens = expr.match(/[0-9]+|[+\-\u00F7]/g);
    if (!tokens || !tokens.length) return 0;
    var result = parseInt(tokens[0], 10) || 0;
    for (var i = 1; i < tokens.length - 1; i += 2) {
      var op = tokens[i], num = parseInt(tokens[i + 1], 10) || 0;
      if (op === '+') result += num;
      else if (op === '-') result -= num;
      else if (op === '\u00F7') result = num !== 0 ? Math.round(result / num) : result;
    }
    return isFinite(result) && result > 0 ? result : 0;
  }

  function _brimoUpdateDisplay() {
    var el = document.getElementById('kas-brimo-expr');
    if (!el) return;
    if (!_brimoExpr) {
      el.textContent = '0';
      el.style.fontSize = '';
      return;
    }
    var formatted = _brimoExpr.replace(/[0-9]+/g, function(seg) {
      var n = parseInt(seg, 10);
      return isNaN(n) ? seg : n.toLocaleString('id-ID');
    });
    el.textContent = formatted;
    var len = formatted.length;
    el.style.fontSize = len > 18 ? '24px' : len > 14 ? '28px' : len > 10 ? '36px' : '44px';
  }

  function _brimoLoadHistory() {
    var hist = document.getElementById('kas-brimo-history');
    if (!hist) return;
    var seen = [], chips = [];
    var list = (window._kasJurnalAll || []).slice().reverse();
    for (var i = 0; i < list.length && chips.length < 5; i++) {
      var v = list[i].nominal || list[i].debit || 0;
      if (v > 0 && seen.indexOf(v) < 0) { seen.push(v); chips.push(v); }
    }
    hist.innerHTML = chips.length
      ? '<div class="kas-brimo-hist-label">Terakhir</div>' + chips.map(function(v) {
          return '<button class="kas-brimo-hist-chip" ontouchend="event.preventDefault();kasBrimoChipTap('+v+')" onclick="kasBrimoChipTap('+v+')">'
            + 'Rp' + v.toLocaleString('id-ID') + '</button>';
        }).join('')
      : '';
  }

  window.kasBrimoChipTap = function(val) {
    _brimoExpr = String(val);
    _brimoUpdateDisplay();
  };

  // Compat shims
  window.kasNumpadOpen  = function() { kasBrimoShowStep('nominal'); };
  window.kasNumpadClose = function() { kasBrimoClose(); };
  window.kasNumpadKey   = function() {};
  window.kasNumpadChipTap = window.kasBrimoChipTap;

})();

// ── Filter akun dropdown berdasarkan tipe transaksi ─────────
// Pinjaman     : debit=aset, kredit=kewajiban
// Bayar Pinjaman: debit=kewajiban, kredit=aset
// Masuk        : debit=aset, kredit=pendapatan/modal
// Keluar       : debit=beban, kredit=aset
// Penarikan Tunai: debit=TUNAI (dikunci, auto-select), kredit=Kas&Bank selain Tunai
// Jurnal Umum  : semua akun (tidak difilter)
function kasFilterAkunByTipe(tipe, idDebit, idKredit) {
  var selD = document.getElementById(idDebit);
  var selK = document.getElementById(idKredit);
  if (!selD || !selK) return;
  var allOpts = Array.from(selD.options);
  // Reset dulu — tampilkan semua
  allOpts.forEach(function(o) { o.style.display = ''; });
  Array.from(selK.options).forEach(function(o) { o.style.display = ''; });
  if (tipe === 'jurnal') return; // semua tampil

  var pickerD = idDebit.replace('kas-jrn-akun-','picker-').replace('kas-edit-akun-','picker-edit-') + '-list';
  var pickerK = idKredit.replace('kas-jrn-akun-','picker-').replace('kas-edit-akun-','picker-edit-') + '-list';

  // ── Kasus khusus: Penarikan Tunai — bukan filter by kelompok biasa,
  // tapi predikat khusus (sub_kelompok KAS & BANK, exclude Tunai di kredit,
  // dan Debit dikunci/otomatis ke akun TUNAI). ──
  if (tipe === 'penarikan') {
    function isKasBank(akun) {
      return akun && akun.kelompok === 'aset' && (akun.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK';
    }
    function isTunai(akun) {
      return akun && (akun.nama || '').trim().toUpperCase() === 'TUNAI';
    }
    var tunaiId = '';
    Array.from(selD.options).forEach(function(o) {
      if (!o.value) { o.style.display = 'none'; return; } // placeholder disembunyikan — debit selalu Tunai
      var akun = _kasAkunMap[o.value];
      var show = isTunai(akun);
      o.style.display = show ? '' : 'none';
      if (show) tunaiId = o.value;
    });
    if (tunaiId) selD.value = tunaiId; // auto-select TUNAI, debit dikunci
    Array.from(selK.options).forEach(function(o) {
      if (!o.value) { o.style.display = ''; return; }
      var akun = _kasAkunMap[o.value];
      o.style.display = (isKasBank(akun) && !isTunai(akun)) ? '' : 'none';
    });
    if (selK.value) {
      var curK = _kasAkunMap[selK.value];
      if (!isKasBank(curK) || isTunai(curK)) selK.value = '';
    }
    function filterPickerPenarikan(listId, mode) {
      var list = document.getElementById(listId);
      if (!list) return;
      Array.from(list.querySelectorAll('.kas-akun-item')).forEach(function(item) {
        if (!item.dataset.val) { item.style.display = (mode === 'debit') ? 'none' : ''; return; }
        var akun = _kasAkunMap[item.dataset.val];
        var show = mode === 'debit' ? isTunai(akun) : (isKasBank(akun) && !isTunai(akun));
        item.style.display = show ? '' : 'none';
      });
    }
    filterPickerPenarikan(pickerD, 'debit');
    filterPickerPenarikan(pickerK, 'kredit');
    // Sinkron label picker (debit terkunci ke TUNAI, kredit ikut value ter-reset kalau invalid)
    kasSyncPickerLabel(pickerD.replace('-list', ''), idDebit);
    kasSyncPickerLabel(pickerK.replace('-list', ''), idKredit);
    return;
  }

  var filterD = null, filterK = null;
  if (tipe === 'pinjaman')       { filterD = ['aset'];       filterK = ['kewajiban']; }
  if (tipe === 'bayar_pinjaman') { filterD = ['kewajiban'];  filterK = ['aset']; }
  if (tipe === 'masuk')          { filterD = ['aset'];       filterK = ['pendapatan','modal','kewajiban']; }
  if (tipe === 'keluar')         { filterD = ['beban','kewajiban']; filterK = ['aset']; }
  if (!filterD) return;

  function applyFilter(sel, allowed) {
    var currentVal = sel.value;
    var firstAllowed = '';
    Array.from(sel.options).forEach(function(o) {
      if (!o.value) { o.style.display = ''; return; } // placeholder selalu tampil
      var akun = _kasAkunMap[o.value];
      var show = akun && allowed.indexOf(akun.kelompok) !== -1;
      o.style.display = show ? '' : 'none';
      if (show && !firstAllowed) firstAllowed = o.value;
    });
    // Kalau nilai aktif tidak allowed, reset
    if (currentVal && _kasAkunMap[currentVal] && allowed.indexOf(_kasAkunMap[currentVal].kelompok) === -1) {
      sel.value = '';
    }
  }
  applyFilter(selD, filterD);
  applyFilter(selK, filterK);

  // Update picker list juga kalau ada
  function filterPickerList(listId, allowed) {
    var list = document.getElementById(listId);
    if (!list) return;
    Array.from(list.querySelectorAll('.kas-akun-item')).forEach(function(item) {
      var id = item.dataset.id;
      var akun = _kasAkunMap[id];
      item.style.display = (!akun || allowed.indexOf(akun.kelompok) !== -1) ? '' : 'none';
    });
  }
  filterPickerList(pickerD, filterD);
  filterPickerList(pickerK, filterK);
}

// Accent warna Debit dinamis sesuai tipe transaksi:
//   Uang Masuk  → hijau (uang nambah ke akun)
//   Uang Keluar → merah (uang keluar/beban)
//   Tipe lain (Jurnal/Pinjaman/Bayar Pinjaman) → netral, tanpa accent
// Kredit sengaja TIDAK didinamiskan — tetap kuning statis di semua tipe (via CSS).
function _kasSetDebitAccent(lblId, pickerId, tipe) {
  var lbl = document.getElementById(lblId);
  var pk  = document.getElementById(pickerId);
  [lbl, pk].forEach(function(el) {
    if (!el) return;
    el.classList.remove('kas-debit-masuk', 'kas-debit-keluar');
    if (tipe === 'masuk')       el.classList.add('kas-debit-masuk');
    else if (tipe === 'keluar') el.classList.add('kas-debit-keluar');
  });
}

function kasOnTipeChange() {
  const tipe = document.getElementById('kas-jrn-tipe').value;
  var extraEl = document.getElementById('kas-pinjaman-extra');
  if (extraEl) extraEl.style.display = (tipe === 'pinjaman') ? 'block' : 'none';
  if (tipe === 'pinjaman') kasPjmAutoJatuhTempo('kas-pjm');
  const lblD = document.getElementById('kas-lbl-debit');
  const lblK = document.getElementById('kas-lbl-kredit');
  if (tipe === 'masuk')           { lblD.textContent = 'Masuk ke Akun (Debit)';   lblK.textContent = 'Sumber Dana (Kredit)'; }
  else if (tipe === 'keluar')     { lblD.textContent = 'Beban / Tujuan (Debit)';  lblK.textContent = 'Keluar dari Akun (Kredit)'; }
  else if (tipe === 'pinjaman')   { lblD.textContent = 'Kas Tujuan (Debit)';      lblK.textContent = 'Akun Pinjaman (Kredit)'; }
  else if (tipe === 'bayar_pinjaman') { lblD.textContent = 'Akun Pinjaman (Debit)'; lblK.textContent = 'Bayar dari Akun (Kredit)'; }
  else if (tipe === 'penarikan')  { lblD.textContent = 'Ke Tunai (Debit)';        lblK.textContent = 'Sumber Penarikan (Kredit)'; }
  else { lblD.textContent = 'Akun Debit'; lblK.textContent = 'Akun Kredit'; }
  _kasSetDebitAccent('kas-lbl-debit', 'picker-debit', tipe);
  kasFilterAkunByTipe(tipe, 'kas-jrn-akun-debit', 'kas-jrn-akun-kredit');
  kasHitungJurnal();
}

function kasHitungJurnal() {
  // nominal dari hidden field (BRImo flow simpan di sini)
  var nomEl = document.getElementById('kas-jrn-nominal');
  const nominal = nomEl ? parseInt(nomEl.value, 10) || 0 : 0;
  const akunDId = document.getElementById('kas-jrn-akun-debit').value;
  const akunKId = document.getElementById('kas-jrn-akun-kredit').value;
  const akunD   = _kasAkunMap[akunDId];
  const akunK   = _kasAkunMap[akunKId];
  const preview = document.getElementById('kas-preview-entry');
  if (!preview) return;
  if (!nominal || !akunD || !akunK) { preview.style.display = 'none'; return; }
  const fmtRp = v => fmtRpFull(v);
  document.getElementById('kas-preview-text').innerHTML =
    `<b>Debit</b>  : ${akunD.kode ? akunD.kode+' ' : ''}${akunD.nama} &nbsp; ${fmtRp(nominal)}<br>` +
    `<b>Kredit</b> : ${akunK.kode ? akunK.kode+' ' : ''}${akunK.nama} &nbsp; ${fmtRp(nominal)}`;
  preview.style.display = 'block';
}

async function kasSimpanJurnal() {
  // Baca dari sheet detail (BRImo) — nominal dari hidden input
  var nomEl = document.getElementById('kas-jrn-nominal');
  const nominal = nomEl ? parseInt(nomEl.value, 10) || 0 : 0;
  const akunDId = document.getElementById('kas-jrn-akun-debit').value;
  const akunKId = document.getElementById('kas-jrn-akun-kredit').value;
  const tgl     = document.getElementById('kas-jrn-tgl').value;
  if (!tgl)             { alert('Tanggal wajib diisi!'); return; }
  if (!nominal)         { alert('Nominal wajib diisi!'); return; }
  if (!akunDId)         { alert('Akun Debit wajib dipilih!'); return; }
  if (!akunKId)         { alert('Akun Kredit wajib dipilih!'); return; }
  if (akunDId===akunKId){ alert('Akun Debit dan Kredit tidak boleh sama!'); return; }
  const data = {
    tanggal:        tgl,
    keterangan:     (document.getElementById('kas-jrn-ket').value||'').trim(),
    referensi:      (document.getElementById('kas-jrn-ref').value||'').trim() || null,
    tipe:           document.getElementById('kas-jrn-tipe').value,
    akun_debit_id:  akunDId,
    akun_kredit_id: akunKId,
    nominal:        nominal,
    debit:          nominal,
    kredit:         nominal,
  };
  try {
    await dbInsert('jurnal', data);

    // Jika pinjaman → insert juga ke tabel hutang
    const tipe = data.tipe;
    if (tipe === 'pinjaman') {
      const kreditur = (document.getElementById('kas-pjm-kreditur').value||'').trim();
      if (kreditur) {
        const bunga   = parseFloat(document.getElementById('kas-pjm-bunga').value)  || 0;
        const tenor   = parseInt(document.getElementById('kas-pjm-tenor').value)    || null;
        const cicilan = (function(){
          var el = document.getElementById('kas-pjm-cicilan');
          if (!el) return 0;
          var raw = el.value.replace(/[^0-9]/g,'');
          return parseInt(raw,10) || 0;
        })();
        const jatuhTempo = document.getElementById('kas-pjm-jatuh-tempo').value || null;
        const hutangData = {
          kreditur:          kreditur,
          jenis:             'lainnya',
          pokok:             nominal,
          bunga:             bunga,
          tenor:             tenor,
          frekuensi:         document.getElementById('kas-pjm-frekuensi').value || 'bulanan',
          cicilan_per_bulan: cicilan,
          cicilan_nominal:   cicilan,
          tgl_mulai:         tgl,
          jatuh_tempo:       jatuhTempo,
          tgl_cicilan:       parseInt(document.getElementById('kas-pjm-tgl-cicilan').value) || null,
          bln_cicilan:       parseInt(document.getElementById('kas-pjm-bln-cicilan').value) || null,
          keterangan:        (document.getElementById('kas-jrn-ket').value||'').trim() || null,
          akun_kwj_id:       akunKId || null,
          akun_aset_id:      akunDId || null,
        };
        await dbInsert('hutang', hutangData);
      }
    }

    kasBrimoClose();
    loadKasJurnal();
  } catch(e) { alert('Gagal simpan: ' + e.message); }
}

// ── MODAL EDIT (gunakan field kas-edit-*) ──────────────────
function kasOnEditTipeChange() {
  const tipe = document.getElementById('kas-edit-tipe').value;
  var extraEl = document.getElementById('kas-edit-pinjaman-extra');
  if (extraEl) extraEl.style.display = (tipe === 'pinjaman') ? 'block' : 'none';
  const lblD = document.getElementById('kas-edit-lbl-debit');
  const lblK = document.getElementById('kas-edit-lbl-kredit');
  if (!lblD || !lblK) return;
  if (tipe === 'masuk')           { lblD.textContent = 'Masuk ke Akun (Debit)';   lblK.textContent = 'Sumber Dana (Kredit)'; }
  else if (tipe === 'keluar')     { lblD.textContent = 'Beban / Tujuan (Debit)';  lblK.textContent = 'Keluar dari Akun (Kredit)'; }
  else if (tipe === 'pinjaman')   { lblD.textContent = 'Kas Tujuan (Debit)';      lblK.textContent = 'Akun Pinjaman (Kredit)'; }
  else if (tipe === 'bayar_pinjaman') { lblD.textContent = 'Akun Pinjaman (Debit)'; lblK.textContent = 'Bayar dari Akun (Kredit)'; }
  else if (tipe === 'penarikan')  { lblD.textContent = 'Ke Tunai (Debit)';        lblK.textContent = 'Sumber Penarikan (Kredit)'; }
  else { lblD.textContent = 'Akun Debit'; lblK.textContent = 'Akun Kredit'; }
  _kasSetDebitAccent('kas-edit-lbl-debit', 'picker-edit-debit', tipe);
  kasFilterAkunByTipe(tipe, 'kas-edit-akun-debit', 'kas-edit-akun-kredit');
  kasHitungEditJurnal();
}

function kasHitungEditJurnal() {
  const nominal = idrVal('kas-edit-nominal');
  const akunDId = document.getElementById('kas-edit-akun-debit').value;
  const akunKId = document.getElementById('kas-edit-akun-kredit').value;
  const akunD   = _kasAkunMap[akunDId];
  const akunK   = _kasAkunMap[akunKId];
  const preview = document.getElementById('kas-edit-preview');
  if (!preview) return;
  if (!nominal || !akunD || !akunK) { preview.style.display = 'none'; return; }
  const fmtRp = v => fmtRpFull(v);
  document.getElementById('kas-edit-preview-text').innerHTML =
    `<b>Debit</b>  : ${akunD.kode ? akunD.kode+' ' : ''}${akunD.nama} &nbsp; ${fmtRp(nominal)}<br>` +
    `<b>Kredit</b> : ${akunK.kode ? akunK.kode+' ' : ''}${akunK.nama} &nbsp; ${fmtRp(nominal)}`;
  preview.style.display = 'block';
}

async function kasUpdateJurnal() {
  const id      = document.getElementById('kas-edit-id').value;
  const nominal = idrVal('kas-edit-nominal');
  const akunDId = document.getElementById('kas-edit-akun-debit').value;
  const akunKId = document.getElementById('kas-edit-akun-kredit').value;
  const tgl     = document.getElementById('kas-edit-tgl').value;
  if (!tgl)             { alert('Tanggal wajib diisi!'); return; }
  if (!nominal)         { alert('Nominal wajib diisi!'); return; }
  if (!akunDId)         { alert('Akun Debit wajib dipilih!'); return; }
  if (!akunKId)         { alert('Akun Kredit wajib dipilih!'); return; }
  if (akunDId===akunKId){ alert('Akun Debit dan Kredit tidak boleh sama!'); return; }
  const data = {
    tanggal:        tgl,
    keterangan:     document.getElementById('kas-edit-ket').value.trim(),
    referensi:      document.getElementById('kas-edit-ref').value.trim() || null,
    tipe:           document.getElementById('kas-edit-tipe').value,
    akun_debit_id:  akunDId,
    akun_kredit_id: akunKId,
    nominal:        nominal,
    debit:          nominal,
    kredit:         nominal,
  };
  try {
    if (id) { await dbUpdate('jurnal', id, data); } else { await dbInsert('jurnal', data); }

    // Jika pinjaman baru (bukan edit) → insert juga ke tabel hutang
    if (!id && data.tipe === 'pinjaman') {
      const kreditur = (document.getElementById('kas-edit-pjm-kreditur').value||'').trim();
      if (kreditur) {
        const bunga   = parseFloat(document.getElementById('kas-edit-pjm-bunga').value)  || 0;
        const tenor   = parseInt(document.getElementById('kas-edit-pjm-tenor').value)    || null;
        const cicilan = (function(){
          var el = document.getElementById('kas-edit-pjm-cicilan');
          if (!el) return 0;
          var raw = (el.value||'').replace(/[^0-9]/g,'');
          return parseInt(raw,10) || 0;
        })();
        const jatuhTempo = document.getElementById('kas-edit-pjm-jatuh-tempo').value || null;
        await dbInsert('hutang', {
          kreditur:          kreditur,
          jenis:             'lainnya',
          pokok:             nominal,
          bunga:             bunga,
          tenor:             tenor,
          frekuensi:         document.getElementById('kas-edit-pjm-frekuensi').value || 'bulanan',
          cicilan_per_bulan: cicilan,
          cicilan_nominal:   cicilan,
          tgl_mulai:         tgl,
          jatuh_tempo:       jatuhTempo,
          tgl_cicilan:       parseInt(document.getElementById('kas-edit-pjm-tgl-cicilan').value) || null,
          bln_cicilan:       parseInt(document.getElementById('kas-edit-pjm-bln-cicilan').value) || null,
          keterangan:        data.keterangan || null,
          akun_kwj_id:       akunKId || null,
          akun_aset_id:      akunDId || null,
        });
      }
    }

    hideModal('modal-kas-transaksi');
    loadKasJurnal();
  } catch(e) { alert('Gagal simpan: ' + e.message); }
}

// ─── LOAD JURNAL ─────────────────────────────────────────────
async function loadKasJurnal() {
  document.getElementById('kas-jurnal-tbody').innerHTML = `<tr><td colspan="8" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>`;
  try {
    const [jurnal, akun] = await Promise.all([
      dbGet('jurnal', '&order=tanggal.desc,created_at.desc'),
      dbGet('kas_akun', '&order=kode.asc'),
    ]);
    _kasAkunMap = {};
    (akun || []).forEach(a => { _kasAkunMap[a.id] = a; });
    kasPopulateAkunDropdown(akun || []);
    _kasJurnalAll = jurnal || [];
    kasApplyFilter();
    // Re-apply flex layout setelah data selesai — pastikan portrait flat seperti landscape
    _kasEnsureFlexLayout();
  } catch(e) {
    document.getElementById('kas-jurnal-tbody').innerHTML = `<tr><td colspan="8" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
  }
}

function kasApplyFilter() {
  const bulan = document.getElementById('kas-filter-bulan').value;
  const filtered = bulan ? _kasJurnalAll.filter(r => (r.tanggal||'').startsWith(bulan)) : _kasJurnalAll;
  _kasCurrentPage = 1;
  _kasFilteredData = filtered;
  kasRenderJurnalTabel(filtered);
  // Summary (Kas Masuk, Keluar, Saldo) pakai SEMUA data — tidak ikut filter
  kasUpdateSummary(_kasJurnalAll);
  // Cashflow pakai data filtered — menunjukkan arus kas periode yang dipilih
  kasUpdateCashflow(filtered, bulan);
}

function kasResetFilter() { document.getElementById('kas-filter-bulan').value = ''; kasApplyFilter(); }

// Set default filter ke bulan ini
(function() {
  var el = document.getElementById('kas-filter-bulan');
  if (el && !el.value) {
    var now = new Date();
    el.value = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  }
})();

// ─── PAGINATION STATE ────────────────────────────────────────
const _KAS_PAGE_SIZE = 999999; // load semua, tidak ada pagination
let _kasCurrentPage  = 1;
let _kasFilteredData = [];

function kasRenderJurnalTabel(data) {
  _kasFilteredData = data;
  const tbody   = document.getElementById('kas-jurnal-tbody');
  const totalPg = Math.max(1, Math.ceil(data.length / _KAS_PAGE_SIZE));
  if (_kasCurrentPage > totalPg) _kasCurrentPage = totalPg;
  const start   = (_kasCurrentPage - 1) * _KAS_PAGE_SIZE;
  const slice   = data.slice(start, start + _KAS_PAGE_SIZE);

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="color:var(--ink3);font-style:italic">Belum ada transaksi</td></tr>';
    _kasRenderPagination(0, 0);
    return;
  }
  const fmtRp = v => fmtRpFull(v);
  tbody.innerHTML = slice.map(r => {
    const _tglParts = (r.tanggal||'').split('-');
    const tgl = _tglParts.length===3 ? _tglParts[2]+'/'+_tglParts[1]+'/'+_tglParts[0].slice(2) : (r.tanggal||'—');
    const akunD = _kasAkunMap[r.akun_debit_id];
    const akunK = _kasAkunMap[r.akun_kredit_id];
    const nmD   = akunD ? '<span class="akun-badge akun-'+akunD.kelompok+'">'+akunD.nama+'</span>' : '—';
    const nmK   = akunK ? '<span class="akun-badge akun-'+akunK.kelompok+'">'+akunK.nama+'</span>' : '—';
    const safeKet = (r.keterangan||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    // Portrait: deteksi masuk/keluar dari kelompok akun
    // Uang MASUK: akun kredit = pendapatan/modal (uang dari luar masuk ke kas)
    // Uang KELUAR: akun debit = beban/kewajiban (uang keluar dari kas)
    // Fallback: akun debit = aset → transfer antar kas (netral, tampil sebagai masuk)
    var kelompokD = akunD ? akunD.kelompok : '';
    var kelompokK = akunK ? akunK.kelompok : '';
    var isMasuk = (kelompokK === 'pendapatan' || kelompokK === 'modal' || kelompokK === 'kewajiban')
               || (kelompokD === 'aset' && kelompokK === 'aset'); // transfer antar akun aset

    // Akun yang ditampilkan: sumber dana (kredit) kalau masuk, tujuan (debit) kalau keluar
    var akunPort  = isMasuk
      ? (akunK ? '<span class="akun-badge akun-'+akunK.kelompok+'">'+akunK.nama+'</span>' : '—')
      : (akunD ? '<span class="akun-badge akun-'+akunD.kelompok+'">'+akunD.nama+'</span>' : '—');
    var nominalPort = isMasuk
      ? '<span style="color:var(--ok);font-weight:700">+'+fmtRp(r.debit)+'</span>'
      : '<span style="color:var(--danger);font-weight:700">-'+fmtRp(r.kredit)+'</span>';

    return '<tr>' +
      '<td style="white-space:nowrap">'+tgl+'</td>' +
      '<td class="kas-col-ref" style="color:var(--ink3);font-size:11px">'+(r.referensi||'—')+'</td>' +
      '<td class="kas-col-ket">'+(r.keterangan||'—')+'</td>' +
      '<td class="kas-col-akund">'+nmD+'</td>' +
      '<td class="kas-col-akunk">'+nmK+'</td>' +
      '<td class="kas-col-debit" style="text-align:right;color:var(--ok);font-weight:600">'+fmtRp(r.debit)+'</td>' +
      '<td class="kas-col-kredit" style="text-align:right;color:var(--danger);font-weight:600">'+fmtRp(r.kredit)+'</td>' +
      '<td class="kas-col-portrait">'+akunPort+'</td>' +
      '<td class="kas-col-portrait" style="text-align:right">'+nominalPort+'</td>' +
      '<td class="kas-col-aksi">' +
        '<button class="btn btn-sm" data-action="edit-kas" data-id="'+r.id+'" style="margin-right:4px"><i class="ti ti-edit"></i></button>' +
        '<button class="btn btn-sm btn-danger" data-action="hapus-kas" data-id="'+r.id+'" data-ket="'+safeKet+'"><i class="ti ti-trash"></i></button>' +
      '</td></tr>';
  }).join('');
  _kasRenderPagination(totalPg, data.length);
}

function _kasRenderPagination(totalPg, totalData) {
  let el = document.getElementById('kas-jurnal-pagination');
  if (!el) {
    const wrap = document.querySelector('#kas-panel-jurnal .card');
    if (!wrap) return;
    el = document.createElement('div');
    el.id = 'kas-jurnal-pagination';
    wrap.appendChild(el);
  }
  el.style.cssText = 'padding:8px 4px;border-top:1px dashed var(--ink4);margin-top:4px';
  el.innerHTML = '<div style="font-size:12px;color:var(--ink3);text-align:right">Menampilkan <b style="color:var(--ink2)">'+totalData+'</b> transaksi</div>';
}

function kasGoPage(pg) { /* tidak dipakai, semua data tampil */ 
}

function kasUpdateCashflow(data, bulan) {
  let cfMasuk = 0, cfKeluar = 0;
  data.forEach(r => {
    const aD = _kasAkunMap[r.akun_debit_id];
    const aK = _kasAkunMap[r.akun_kredit_id];
    const isKasD = aD && aD.kelompok === 'aset' && (aD.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
    const isKasK = aK && aK.kelompok === 'aset' && (aK.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
    if (isKasD) cfMasuk  += (r.nominal || r.debit  || 0);
    if (isKasK) cfKeluar += (r.nominal || r.kredit || 0);
  });
  const cf = cfMasuk - cfKeluar;
  const fmtRp = v => fmtRpFull(Math.abs(v));
  const el = document.getElementById('kas-cashflow');
  const lb = document.getElementById('kas-cashflow-label');
  if (el) {
    el.textContent = (cf < 0 ? '-' : (cf > 0 ? '+' : '')) + 'Rp' + fmtRp(cf).replace('Rp','');
    el.style.color = cf > 0 ? 'var(--ok)' : cf < 0 ? 'var(--danger)' : 'var(--ink2)';
  }
  if (lb) lb.textContent = bulan ? bulan.replace('-','/') : 'semua periode';
}

function kasUpdateSummary(data) {
  let masuk = 0, keluar = 0;
  data.forEach(r => {
    const aD = _kasAkunMap[r.akun_debit_id];
    const aK = _kasAkunMap[r.akun_kredit_id];
    // Hanya hitung akun KAS & BANK — bukan semua aset
    const isKasD = aD && aD.kelompok === 'aset' && (aD.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
    const isKasK = aK && aK.kelompok === 'aset' && (aK.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
    if (isKasD) masuk  += (r.nominal || r.debit  || 0);
    if (isKasK) keluar += (r.nominal || r.kredit || 0);
  });
  const saldo = masuk - keluar;
  const fmtRp = v => fmtRpFull(Math.abs(v));
  document.getElementById('kas-total-masuk').textContent = fmtRp(masuk);
  document.getElementById('kas-total-keluar').textContent = fmtRp(keluar);
  document.getElementById('kas-saldo').textContent = (saldo < 0 ? '-' : '') + fmtRp(saldo);
  document.getElementById('kas-saldo').style.color = saldo >= 0 ? 'var(--ok)' : 'var(--danger)';
}

async function kasEditJurnal(id) {
  // Tampilkan tombol Hapus di modal edit
  var btnHapus = document.getElementById('kas-edit-btn-hapus');
  if (btnHapus) btnHapus.style.display = 'inline-flex';
  const r = _kasJurnalAll.find(x => String(x.id) === String(id)); if (!r) return;
  document.getElementById('kas-form-title').innerHTML = '<i class="ti ti-edit"></i> Edit Transaksi';
  document.getElementById('kas-edit-id').value      = r.id;
  document.getElementById('kas-edit-tgl').value     = r.tanggal ? r.tanggal.split('T')[0] : '';
  document.getElementById('kas-edit-tipe').value    = r.tipe || 'masuk'; kasSyncTipePicker(r.tipe || 'masuk');
  idrSet('kas-edit-nominal', r.nominal || r.debit || 0);
  setTimeout(function() {
    if (typeof idrInput === 'function') idrInput('kas-edit-nominal');
  }, 50);
  document.getElementById('kas-edit-ket').value     = r.keterangan || '';
  document.getElementById('kas-edit-ref').value     = r.referensi || '';
  kasOnEditTipeChange();
  setTimeout(() => {
    document.getElementById('kas-edit-akun-debit').value  = r.akun_debit_id  || '';
    document.getElementById('kas-edit-akun-kredit').value = r.akun_kredit_id || '';
    kasSyncPickerLabel('picker-edit-debit',  'kas-edit-akun-debit');
    kasSyncPickerLabel('picker-edit-kredit', 'kas-edit-akun-kredit');
    kasHitungEditJurnal();
  }, 50);
  showModal('modal-kas-transaksi');
}

async function kasHapusJurnal(id, ket) {
  confirmDelete(`Hapus transaksi "${ket}"?`, async () => {
    try { await dbDelete('jurnal', id); loadKasJurnal(); } catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// Hapus dari dalam modal edit
async function kasHapusDariModal() {
  var id  = parseInt(document.getElementById('kas-edit-id').value);
  var ket = document.getElementById('kas-edit-ket').value || 'transaksi ini';
  if (!id) return;
  hideModal('modal-kas-transaksi');
  kasHapusJurnal(id, ket);
}

// Long press pada row tabel jurnal → hapus
(function() {
  var _lpTimer = null;
  var _lpId    = null;
  var _lpKet   = null;

  document.addEventListener('touchstart', function(e) {
    var row = e.target.closest('#kas-jurnal-tbody tr');
    if (!row) return;
    var editBtn = row.querySelector('[data-action="edit-kas"]');
    if (!editBtn) return;
    _lpId  = parseInt(editBtn.dataset.id);
    var hapusBtn = row.querySelector('[data-action="hapus-kas"]');
    _lpKet = hapusBtn ? hapusBtn.dataset.ket : '';
    _lpTimer = setTimeout(function() {
      if (_lpId) kasHapusJurnal(_lpId, _lpKet);
      _lpId = null;
    }, 600);
  }, { passive: true });

  document.addEventListener('touchend',   function() { clearTimeout(_lpTimer); }, { passive: true });
  document.addEventListener('touchmove',  function() { clearTimeout(_lpTimer); }, { passive: true });
  document.addEventListener('touchcancel',function() { clearTimeout(_lpTimer); }, { passive: true });
})();

function kasExportCSV() {
  const bulan = document.getElementById('kas-filter-bulan').value;
  const data  = bulan ? _kasJurnalAll.filter(r => (r.tanggal||'').startsWith(bulan)) : _kasJurnalAll;
  if (!data.length) { alert('Belum ada data'); return; }
  const headers = ['Tanggal','Referensi','Keterangan','Tipe','Akun Debit','Akun Kredit','Nominal'];
  const rows = data.map(r => {
    const aD = _kasAkunMap[r.akun_debit_id]; const aK = _kasAkunMap[r.akun_kredit_id];
    return [r.tanggal, r.referensi||'', r.keterangan||'', r.tipe||'', aD?aD.nama:'', aK?aK.nama:'', r.nominal||r.debit||0];
  });
  exportCSV('zenoot-kas-jurnal.csv', headers, rows);
}

// ─── LAPORAN ─────────────────────────────────────────────────
var _kasLapTipeCfg = {
  neraca:   { icon: 'ti-scale',          label: 'Neraca Saldo' },
  labarugi: { icon: 'ti-chart-line',     label: 'Laba Rugi' },
  aruskas:  { icon: 'ti-arrows-exchange', label: 'Arus Kas' },
};

function kasLapTipeToggle() {
  var list = document.getElementById('lap-tipe-picker-list');
  if (!list) return;
  var willOpen = list.style.display !== 'block';
  list.style.display = willOpen ? 'block' : 'none';
  if (willOpen) {
    setTimeout(function() {
      document.addEventListener('click', _kasLapTipeOutside);
    }, 0);
  }
}
function _kasLapTipeOutside(e) {
  var wrap = document.querySelector('.kas-lap-tipe-picker');
  if (wrap && !wrap.contains(e.target)) {
    var list = document.getElementById('lap-tipe-picker-list');
    if (list) list.style.display = 'none';
    document.removeEventListener('click', _kasLapTipeOutside);
  }
}

// ─── Picker Bulan (shortcut) — Laporan Kas & Jurnal ───
// '' = Semua. Format lain 'YYYY-MM'. Dipakai baik desktop maupun mobile
// (2 instance DOM: -d dan -m, disinkronkan bareng tiap kali berubah).
var _kasLapBulan = '';
var NAMA_BULAN_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
var NAMA_BULAN_SINGKAT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

function _kasLapBulanOptions() {
  var opts = [{ val: '', label: 'Semua' }];
  var now = new Date();
  for (var i = 0; i < 12; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var label = (i === 0 ? 'Bulan Ini — ' : '') + NAMA_BULAN_ID[d.getMonth()] + ' ' + d.getFullYear();
    opts.push({ val: d.getFullYear() + '-' + mm, label: label });
  }
  return opts;
}

function _kasLapBulanLabel(val) {
  if (!val) return 'Semua';
  var parts = val.split('-');
  var yy = parts[0].slice(-2);
  return NAMA_BULAN_SINGKAT[parseInt(parts[1], 10) - 1] + ' ' + yy;
}

function _kasLapBulanRenderPicker() {
  var opts = _kasLapBulanOptions();
  var itemsHtml = opts.map(function(o) {
    return '<div class="kas-lap-bulan-item" data-val="' + o.val + '" onclick="kasLapBulanPick(\'' + o.val + '\')" ' +
      'style="display:flex;align-items:center;gap:8px;padding:9px 14px;cursor:pointer;font-size:13px;font-weight:600;color:var(--ink);border-top:1px solid rgba(0,0,0,0.08);white-space:nowrap">' +
      o.label +
      '<i class="ti ti-check kas-lap-bulan-check" style="margin-left:auto;visibility:' + (o.val === _kasLapBulan ? 'visible' : 'hidden') + '"></i>' +
    '</div>';
  }).join('');

  return function(suffix) {
    return '<div class="kas-lap-bulan-picker" style="position:relative">' +
      '<button id="kas-lap-bulan-btn-' + suffix + '" onclick="kasLapBulanToggle(\'' + suffix + '\')" ' +
        'style="display:flex;align-items:center;gap:6px;font-family:var(--f);font-size:12px;font-weight:700;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);color:var(--ink);border-radius:4px;cursor:pointer;width:100%;justify-content:center">' +
        '<i class="ti ti-calendar"></i> <span id="kas-lap-bulan-label-' + suffix + '">' + _kasLapBulanLabel(_kasLapBulan) + '</span>' +
        '<i class="ti ti-chevron-down" style="font-size:12px;opacity:.6"></i>' +
      '</button>' +
      '<div id="kas-lap-bulan-list-' + suffix + '" style="display:none;position:absolute;top:100%;right:0;margin-top:4px;background:var(--cream);border:2px solid var(--ink);border-radius:6px;min-width:200px;max-height:320px;overflow-y:auto;z-index:50;box-shadow:0 6px 16px rgba(0,0,0,0.35)">' +
        itemsHtml +
      '</div>' +
    '</div>';
  };
}

function kasLapBulanInit() {
  var build = _kasLapBulanRenderPicker();
  var elD = document.getElementById('kas-lap-bulan-picker-d');
  var elM = document.getElementById('kas-lap-bulan-picker-m');
  if (elD) elD.innerHTML = build('d');
  if (elM) elM.innerHTML = build('m');
}

function kasLapBulanToggle(suffix) {
  var list = document.getElementById('kas-lap-bulan-list-' + suffix);
  if (!list) return;
  var willOpen = list.style.display !== 'block';
  // Tutup instance lain (desktop/mobile) biar gak dobel kebuka
  ['d','m'].forEach(function(s) {
    var l = document.getElementById('kas-lap-bulan-list-' + s);
    if (l && s !== suffix) l.style.display = 'none';
  });
  list.style.display = willOpen ? 'block' : 'none';
  if (willOpen) {
    setTimeout(function() { document.addEventListener('click', _kasLapBulanOutside); }, 0);
  }
}
function _kasLapBulanOutside(e) {
  var insideAny = !!e.target.closest('.kas-lap-bulan-picker');
  if (!insideAny) {
    ['d','m'].forEach(function(s) {
      var l = document.getElementById('kas-lap-bulan-list-' + s);
      if (l) l.style.display = 'none';
    });
    document.removeEventListener('click', _kasLapBulanOutside);
  }
}

function kasLapBulanPick(val) {
  _kasLapBulan = val;
  var label = _kasLapBulanLabel(val);
  ['d','m'].forEach(function(s) {
    var lblEl = document.getElementById('kas-lap-bulan-label-' + s);
    if (lblEl) lblEl.textContent = label;
    var list = document.getElementById('kas-lap-bulan-list-' + s);
    if (list) {
      list.style.display = 'none';
      list.querySelectorAll('.kas-lap-bulan-item').forEach(function(item) {
        var chk = item.querySelector('.kas-lap-bulan-check');
        if (chk) chk.style.visibility = (item.dataset.val === val) ? 'visible' : 'hidden';
      });
    }
  });
  kasRenderLaporan();
}

function kasLapTab(tab) {
  ['neraca','labarugi','aruskas'].forEach(function(t) {
    var btn   = document.getElementById('lap-tab-' + t);
    var panel = document.getElementById('lap-panel-' + t);
    var active = t === tab;
    if (btn)   { btn.style.background = active ? 'var(--ink)' : 'var(--cream)'; btn.style.color = active ? 'var(--cream)' : 'var(--ink)'; }
    if (panel) panel.style.display = active ? 'block' : 'none';
  });
  // Sinkron custom dropdown mobile (icon monochrome ti-*, bukan emoji)
  var cfg = _kasLapTipeCfg[tab];
  if (cfg) {
    var icoEl = document.getElementById('lap-tipe-picker-icon');
    var lblEl = document.getElementById('lap-tipe-picker-label');
    if (icoEl) icoEl.className = 'ti ' + cfg.icon;
    if (lblEl) lblEl.textContent = cfg.label;
  }
  document.querySelectorAll('.lap-tipe-item').forEach(function(item) {
    var check = item.querySelector('.lap-tipe-check');
    if (check) check.style.visibility = (item.dataset.tab === tab) ? 'visible' : 'hidden';
  });
}

// ─── kasRenderLaporan — pola clearTimeout/setTimeout persis JP ──
var _kasLaporanTimer = null;
function kasRenderLaporan() {
  clearTimeout(_kasLaporanTimer);
  _kasLaporanTimer = setTimeout(_kasExecLaporan, 250);
}
async function _kasExecLaporan() {
  try {
    const [jurnal, akun] = await Promise.all([
      dbGet('jurnal', '&order=tanggal.asc,created_at.asc'),
      dbGet('kas_akun', '&order=kode.asc'),
    ]);
    _kasAkunMap = {};
    (akun || []).forEach(a => { _kasAkunMap[a.id] = a; });
    _kasJurnalAll = jurnal || [];
  } catch(e) {
    console.error('[kasRenderLaporan] gagal fetch data:', e.message);
    ['kas-neraca-tbody','kas-labarugi-tbody','kas-aruskas-tbody'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '<tr><td colspan="6" style="color:var(--danger)">Gagal memuat data. Cek koneksi dan refresh.</td></tr>';
    });
    return;
  }
  const bulan = _kasLapBulan;
  const data  = bulan ? _kasJurnalAll.filter(r => (r.tanggal||'').startsWith(bulan)) : _kasJurnalAll;
  kasLapBulanInit();
  kasRenderNeraca(data); kasRenderLabaRugi(data); kasRenderArusKas(data);
}

function kasRenderNeraca(data) {
  const tbody = document.getElementById('kas-neraca-tbody');
  const saldoMap = {};
  data.forEach(r => {
    const n = r.nominal || r.debit || 0;
    if (r.akun_debit_id)  { if (!saldoMap[r.akun_debit_id])  saldoMap[r.akun_debit_id]  = {debit:0,kredit:0}; saldoMap[r.akun_debit_id].debit   += n; }
    if (r.akun_kredit_id) { if (!saldoMap[r.akun_kredit_id]) saldoMap[r.akun_kredit_id] = {debit:0,kredit:0}; saldoMap[r.akun_kredit_id].kredit += n; }
  });
  const order = ['aset','kewajiban','modal','pendapatan','beban'];
  const fmtRp = v => fmtRpFull(v);
  let html = '', totalD = 0, totalK = 0;
  order.forEach(k => {
    const akuns = Object.values(_kasAkunMap).filter(a => a.kelompok === k).sort((a,b) => (a.kode||'').localeCompare(b.kode||''));
    if (!akuns.length) return;
    html += `<tr class="lap-head"><td colspan="6">${kasKelompokLabel(k).toUpperCase()}</td></tr>`;
    akuns.forEach(a => {
      const s = saldoMap[a.id] || {debit:0,kredit:0};
      const saldo = ['aset','beban'].includes(k) ? s.debit - s.kredit : s.kredit - s.debit;
      totalD += s.debit; totalK += s.kredit;
      html += `<tr>
        <td style="font-family:monospace;font-size:12px">${a.kode||'—'}</td><td>${a.nama}</td>
        <td style="text-align:right;font-weight:700;color:${saldo>=0?'var(--ok)':'var(--danger)'}">
          ${saldo<0?'(':''}${fmtRp(Math.abs(saldo))}${saldo<0?')':''}
        </td>
        <td><span class="akun-badge akun-${k}">${kasKelompokLabel(k)}</span></td>
        <td style="text-align:right;color:var(--ok)">${fmtRp(s.debit)}</td>
        <td style="text-align:right;color:var(--danger)">${fmtRp(s.kredit)}</td>
      </tr>`;
    });
  });
  html += `<tr class="lap-total"><td colspan="2"><b>TOTAL</b></td><td style="text-align:right;line-height:1.5"><b style="color:var(--ok)">D ${fmtRp(totalD)}</b><br><b style="color:var(--danger)">K ${fmtRp(totalK)}</b></td></tr>`;

  tbody.innerHTML = html || `<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada data</td></tr>`;
}

function kasRenderLabaRugi(data) {
  const tbody = document.getElementById('kas-labarugi-tbody');
  const saldoMap = {};
  data.forEach(r => {
    const n = r.nominal || r.debit || 0;
    if (r.akun_debit_id)  { if (!saldoMap[r.akun_debit_id])  saldoMap[r.akun_debit_id]  = {debit:0,kredit:0}; saldoMap[r.akun_debit_id].debit   += n; }
    if (r.akun_kredit_id) { if (!saldoMap[r.akun_kredit_id]) saldoMap[r.akun_kredit_id] = {debit:0,kredit:0}; saldoMap[r.akun_kredit_id].kredit += n; }
  });
  const fmtRp = v => fmtRpFull(Math.abs(v));
  const akunPend  = Object.values(_kasAkunMap).filter(a => a.kelompok === 'pendapatan');
  const akunBeban = Object.values(_kasAkunMap).filter(a => a.kelompok === 'beban');
  let totalPend = 0, totalBeban = 0, html = '';
  html += `<tr class="lap-head"><td colspan="2">PENDAPATAN</td></tr>`;
  akunPend.forEach(a => {
    const s = saldoMap[a.id] || {debit:0,kredit:0};
    const saldo = s.kredit - s.debit; totalPend += saldo;
    html += `<tr class="lap-sub"><td>${a.nama}</td><td style="text-align:right">${fmtRp(saldo)}</td></tr>`;
  });
  html += `<tr class="lap-total"><td><b>Total Pendapatan</b></td><td style="text-align:right;font-weight:700;color:var(--ok)"><b>${fmtRp(totalPend)}</b></td></tr>`;
  html += `<tr class="lap-head"><td colspan="2">BEBAN</td></tr>`;
  akunBeban.forEach(a => {
    const s = saldoMap[a.id] || {debit:0,kredit:0};
    const saldo = s.debit - s.kredit; totalBeban += saldo;
    html += `<tr class="lap-sub"><td>${a.nama}</td><td style="text-align:right;color:var(--danger)">${fmtRp(saldo)}</td></tr>`;
  });
  html += `<tr class="lap-total"><td><b>Total Beban</b></td><td style="text-align:right;font-weight:700;color:var(--danger)"><b>${fmtRp(totalBeban)}</b></td></tr>`;
  const labaRugi = totalPend - totalBeban;
  const isLaba   = labaRugi >= 0;
  html += `<tr class="lap-result"><td><b>${isLaba ? '✅ LABA BERSIH' : '❌ RUGI BERSIH'}</b></td><td style="text-align:right;color:${isLaba?'var(--ok)':'var(--danger)'}"><b>${isLaba?'':'('}${fmtRp(labaRugi)}${isLaba?'':')'}</b></td></tr>`;
  tbody.innerHTML = html || `<tr><td colspan="2" style="color:var(--ink3);font-style:italic">Belum ada data</td></tr>`;
}

// ─── PAGINATION ARUS KAS ─────────────────────────────────────
let _arusCurrentPage  = 1;
let _arusFilteredData = [];
let _arusSaldoMap     = {}; // id -> saldo kumulatif (dihitung dari ascending)

function kasRenderArusKas(data) {
  // Helper: cek apakah akun adalah kas/bank — berdasarkan sub_kelompok "KAS & BANK"
  function isKasBank(akun) {
    if (!akun || akun.kelompok !== 'aset') return false;
    return (akun.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK';
  }

  // Filter: salah satu sisi (debit atau kredit) harus akun KAS & BANK
  const filtered = data.filter(r => {
    const aD = _kasAkunMap[r.akun_debit_id];
    const aK = _kasAkunMap[r.akun_kredit_id];
    return isKasBank(aD) || isKasBank(aK);
  });

  // Kumpulkan id transaksi yang masuk ke filtered (untuk exclude dari saldo awal)
  const filteredIds = new Set(filtered.map(r => r.id));

  // Hitung saldo awal = semua transaksi KAS & BANK di _kasJurnalAll
  // yang TIDAK masuk ke data yang ditampilkan (transaksi sebelum periode filter)
  let saldoAwal = 0;
  (_kasJurnalAll || []).forEach(r => {
    if (filteredIds.has(r.id)) return; // skip transaksi yang tampil
    const aD = _kasAkunMap[r.akun_debit_id];
    const aK = _kasAkunMap[r.akun_kredit_id];
    const isKasD = isKasBank(aD);
    const isKasK = isKasBank(aK);
    if (!isKasD && !isKasK) return; // skip yang tidak menyentuh kas
    const n = Number(r.nominal || r.debit || 0);
    // Hitung kedua sisi secara independen (handle transfer antar kas)
    if (isKasD) saldoAwal += n;
    if (isKasK) saldoAwal -= n;
  });

  // Sort ascending (lama ke baru) untuk hitung saldo kumulatif yang benar
  const ascending = filtered.slice().sort((a, b) => {
    const d = (a.tanggal || '').localeCompare(b.tanggal || '');
    return d !== 0 ? d : String(a.id).localeCompare(String(b.id));
  });

  // Hitung saldo kumulatif per-id, mulai dari saldo awal (bukan 0)
  // Hitung kedua sisi independen — handle transfer antar kas (isKasD && isKasK)
  const saldoByIdMap = {};
  let runSaldo = saldoAwal;
  ascending.forEach(r => {
    const n = Number(r.nominal || r.debit || 0);
    const aD = _kasAkunMap[r.akun_debit_id];
    const aK = _kasAkunMap[r.akun_kredit_id];
    const isKasD = isKasBank(aD);
    const isKasK = isKasBank(aK);
    if (isKasD) runSaldo += n;
    if (isKasK) runSaldo -= n;
    saldoByIdMap[r.id] = runSaldo;
  });

  // Balik ke descending (terbaru di atas) untuk tampilan
  const descending = ascending.slice().reverse();

  _arusFilteredData = descending;
  _arusSaldoMap = saldoByIdMap;
  _arusCurrentPage  = 1;
  _kasRenderArusTabel();
}

function _kasRenderArusTabel() {
  const tbody   = document.getElementById('kas-aruskas-tbody');
  const fmtRp   = v => fmtRpFull(v);
  const data    = _arusFilteredData;
  const totalPg = Math.max(1, Math.ceil(data.length / _KAS_PAGE_SIZE));
  if (_arusCurrentPage > totalPg) _arusCurrentPage = totalPg;
  const start   = (_arusCurrentPage - 1) * _KAS_PAGE_SIZE;
  const slice   = data.slice(start, start + _KAS_PAGE_SIZE);

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada arus kas</td></tr>';
    _kasRenderArusPagination(0, 0);
    return;
  }

  tbody.innerHTML = slice.map((r) => {
    const _tp = (r.tanggal||'').split('-');
    const tgl = _tp.length===3 ? _tp[2]+'/'+_tp[1]+'/'+_tp[0].slice(2) : (r.tanggal||'—');
    const n   = r.nominal || r.debit || 0;
    const aD  = _kasAkunMap[r.akun_debit_id];
    const aK  = _kasAkunMap[r.akun_kredit_id];
    const isMasuk = aD && aD.kelompok === 'aset' && (aD.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
    const s   = _arusSaldoMap[r.id] !== undefined ? _arusSaldoMap[r.id] : 0;
    // Kalau masuk: uang datang dari akun kredit (lawan). Kalau keluar: uang pergi ke akun debit (lawan)
    const akunLawan = isMasuk ? aK : aD;
    const akunLawanNama = akunLawan ? akunLawan.nama : '—';
    const akunLawanKelompok = akunLawan ? akunLawan.kelompok : '';
    const akunBadge = akunLawan
      ? '<span class="akun-badge akun-'+akunLawanKelompok+'" style="font-size:10px;padding:1px 6px">'+akunLawanNama+'</span>'
      : '—';
    return '<tr>' +
      '<td style="white-space:nowrap">'+tgl+'</td>' +
      '<td>'+(r.keterangan||'—')+'</td>' +
      '<td>'+akunBadge+'</td>' +
      '<td style="text-align:right;color:var(--ok)">'+(isMasuk ? fmtRp(n) : '—')+'</td>' +
      '<td style="text-align:right;color:var(--danger)">'+(!isMasuk ? fmtRp(n) : '—')+'</td>' +
      '<td style="text-align:right;font-weight:700;color:'+(s>=0?'var(--ok)':'var(--danger)')+'">'+(s<0?'-':'')+fmtRp(Math.abs(s))+'</td>' +
      '</tr>';
  }).join('');
  _kasRenderArusPagination(totalPg, data.length);
}

function _kasRenderArusPagination(totalPg, totalData) {
  let el = document.getElementById('kas-arus-pagination');
  if (!el) {
    const wrap = document.querySelector('#lap-panel-aruskas .card');
    if (!wrap) return;
    el = document.createElement('div');
    el.id = 'kas-arus-pagination';
    wrap.appendChild(el);
  }
  if (totalPg <= 1) { el.innerHTML = ''; return; }
  const start = (_arusCurrentPage - 1) * _KAS_PAGE_SIZE + 1;
  const end   = Math.min(_arusCurrentPage * _KAS_PAGE_SIZE, totalData);
  let from = Math.max(1, _arusCurrentPage - 2);
  let to   = Math.min(totalPg, from + 4);
  from     = Math.max(1, to - 4);
  const pages = [];
  for (let i = from; i <= to; i++) pages.push(i);
  const btnBase = 'padding:4px 9px;font-family:var(--f);font-size:12px;font-weight:700;border:2px solid var(--ink);border-radius:2px;cursor:pointer;';
  const btnNorm = btnBase + 'background:var(--cream);color:var(--ink);';
  const btnActv = btnBase + 'background:var(--ink);color:var(--cream);';
  const btnDsbl = btnBase + 'opacity:0.3;cursor:default;background:var(--cream);color:var(--ink);';
  el.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 4px;flex-wrap:wrap;gap:8px;border-top:1px dashed var(--ink4);margin-top:4px';
  el.innerHTML =
    '<div style="font-size:12px;color:var(--ink3)">Menampilkan <b style="color:var(--ink2)">'+start+'–'+end+'</b> dari <b style="color:var(--ink2)">'+totalData+'</b> transaksi</div>' +
    '<div style="display:flex;gap:4px;align-items:center">' +
      '<button onclick="arusGoPage(1)" '+(_arusCurrentPage===1?'disabled':'')+' style="'+(_arusCurrentPage===1?btnDsbl:btnNorm)+'"><i class="ti ti-chevrons-left"></i></button>' +
      '<button onclick="arusGoPage('+(_arusCurrentPage-1)+')" '+(_arusCurrentPage===1?'disabled':'')+' style="'+(_arusCurrentPage===1?btnDsbl:btnNorm)+'"><i class="ti ti-chevron-left"></i></button>' +
      pages.map(function(p){ return '<button onclick="arusGoPage('+p+')" style="'+(p===_arusCurrentPage?btnActv:btnNorm)+'">'+p+'</button>'; }).join('') +
      '<button onclick="arusGoPage('+(_arusCurrentPage+1)+')" '+(_arusCurrentPage===totalPg?'disabled':'')+' style="'+(_arusCurrentPage===totalPg?btnDsbl:btnNorm)+'"><i class="ti ti-chevron-right"></i></button>' +
      '<button onclick="arusGoPage('+totalPg+')" '+(_arusCurrentPage===totalPg?'disabled':'')+' style="'+(_arusCurrentPage===totalPg?btnDsbl:btnNorm)+'"><i class="ti ti-chevrons-right"></i></button>' +
    '</div>';
}

function arusGoPage(pg) {
  const totalPg = Math.max(1, Math.ceil(_arusFilteredData.length / _KAS_PAGE_SIZE));
  _arusCurrentPage = Math.max(1, Math.min(pg, totalPg));
  _kasRenderArusTabel();
  const card = document.querySelector('#lap-panel-aruskas .card');
  if (card) card.scrollIntoView({behavior:'smooth', block:'start'});
}

// ─── EVENT DELEGATION ────────────────────────────────────────
document.getElementById('page-kas').addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]'); if (!btn) return;
  const id = btn.dataset.id, action = btn.dataset.action;
  if (action === 'edit-kas')   kasEditJurnal(id);
  if (action === 'hapus-kas')  kasHapusJurnal(id, btn.dataset.ket);
  if (action === 'edit-akun')  kasEditAkun(id);
  if (action === 'hapus-akun') kasHapusAkun(id, btn.dataset.nama);
});

// ─── INIT ────────────────────────────────────────────────────
loadKasJurnal();


// ─── KAS AKUN CUSTOM PICKER ──────────────────────────────────
// Menggantikan <select> native yang muncul sebagai bottom sheet Android.
// <select> tetap ada (display:none) sebagai source of truth untuk semua logic lama.

// Ambil tinggi safe-area-inset-top (notch/status bar) dengan andal di semua
// platform. app.js (iOS-only) sudah bikin probe '_zenot-safe-probe-top', tapi
// di sini kita pastikan probe selalu ada terlepas dari urutan load script,
// supaya posisi list TIDAK PERNAH kehalangan notch di iPhone.
function _kasGetSafeTop() {
  var probe = document.getElementById('_zenot-safe-probe-top');
  if (!probe) {
    probe = document.createElement('div');
    probe.id = '_zenot-safe-probe-top';
    probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;' +
      'padding-top:env(safe-area-inset-top,0px);pointer-events:none;visibility:hidden;';
    document.body.appendChild(probe);
  }
  return parseInt(getComputedStyle(probe).paddingTop) || 0;
}

// Hitung & terapkan posisi float list berdasarkan rect picker saat ini.
// Dipakai baik untuk initial open maupun untuk reposisi (resize/scroll).
// minTop memastikan list tidak pernah render di bawah notch/status bar.
window._kasPositionPickerList = _kasPositionPickerList;
function _kasPositionPickerList(list, picker, listH) {
  var rect    = picker.getBoundingClientRect();
  var vpH     = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  var minTop  = _kasGetSafeTop() + 4;
  var spaceBelow = vpH - rect.bottom - 4;
  var spaceAbove = rect.top - minTop;

  list.style.position = 'fixed';
  list.style.left     = rect.left + 'px';
  list.style.width    = rect.width + 'px';
  list.style.maxWidth = '320px';
  list.style.zIndex   = '99999';

  if (spaceBelow < listH && spaceAbove > spaceBelow) {
    var actualH = Math.min(listH, spaceAbove);
    list.style.maxHeight = actualH + 'px';
    list.style.bottom    = '';
    list.style.top       = Math.max(minTop, rect.top - actualH - 2) + 'px';
  } else {
    list.style.maxHeight = Math.min(listH, Math.max(80, spaceBelow)) + 'px';
    list.style.top       = (rect.bottom + 2) + 'px';
    list.style.bottom    = '';
  }
}

// Hitung saldo akun dari _kasJurnalAll (in-memory, no extra query)
function _kasGetSaldoMap() {
  var map = {};
  (_kasJurnalAll || []).forEach(function(r) {
    var n = r.nominal || r.debit || 0;
    if (r.akun_debit_id)  { if (!map[r.akun_debit_id])  map[r.akun_debit_id]  = {d:0,k:0}; map[r.akun_debit_id].d  += n; }
    if (r.akun_kredit_id) { if (!map[r.akun_kredit_id]) map[r.akun_kredit_id] = {d:0,k:0}; map[r.akun_kredit_id].k += n; }
  });
  return map;
}

function kasPopulatePickerList(listId, akunData) {
  var list = document.getElementById(listId);
  if (!list) return;
  var order = ['aset','kewajiban','modal','pendapatan','beban'];
  var grouped = {}; order.forEach(function(k){ grouped[k] = []; });
  akunData.forEach(function(a){ if (grouped[a.kelompok]) grouped[a.kelompok].push(a); });
  var html = '<div class="kas-akun-item" data-val="" onclick="kasPickerSelect(this)"><span style="color:var(--ink3)">— Pilih Akun —</span></div>';
  order.forEach(function(k) {
    if (!grouped[k].length) return;
    html += '<div class="kas-akun-group">' + kasKelompokLabel(k) + '</div>';
    var saldoMap = (k === 'aset') ? _kasGetSaldoMap() : null;
    grouped[k].forEach(function(a) {
      var label = (a.kode ? a.kode + ' · ' : '') + a.nama;
      var saldoHtml = '';
      var isKasBankAkun = saldoMap && (a.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
      if (isKasBankAkun) {
        var s = saldoMap[a.id] || {d:0,k:0};
        var saldo = s.d - s.k;
        var saldoColor = saldo > 0 ? 'var(--ok)' : saldo < 0 ? 'var(--danger)' : 'var(--ink3)';
        var saldoFmt = (saldo < 0 ? '(' : '') + 'Rp' + Math.abs(saldo).toLocaleString('id-ID') + (saldo < 0 ? ')' : '');
        saldoHtml = '<span class="kas-akun-saldo" style="color:' + saldoColor + '">' + saldoFmt + '</span>';
      }
      html += '<div class="kas-akun-item" data-val="' + a.id + '" onclick="kasPickerSelect(this)"><span class="kas-akun-nama">' + label + '</span>' + saldoHtml + '</div>';
    });
  });
  list.innerHTML = html;
}

function _kasReturnListToWrap(list) {
  // Kembalikan list ke .kas-akun-wrap asalnya setelah di-float ke body
  if (!list || !list.dataset.floated) return;
  var wrap = document.querySelector('.kas-akun-wrap #' + list.id.replace('-list',''));
  if (!wrap) {
    // Cari wrap berdasarkan data-target
    var picker = document.querySelector('[id="' + list.id.replace('-list','') + '"]');
    if (picker && picker.parentNode) picker.parentNode.appendChild(list);
  }
  list.style.display = 'none';
  list.style.position = '';
  list.style.top = '';
  list.style.left = '';
  list.style.width = '';
  list.style.zIndex = '';
  delete list.dataset.floated;
}

function kasClosePicker(list) {
  if (!list) return;
  // Cleanup visualViewport listener
  if (list._vpHandler && window.visualViewport) {
    window.visualViewport.removeEventListener('resize', list._vpHandler);
    delete list._vpHandler;
  }
  // Cleanup modal scroll listener
  if (list._modalScrollEl && list._modalScrollHandler) {
    list._modalScrollEl.removeEventListener('scroll', list._modalScrollHandler);
    delete list._modalScrollEl;
    delete list._modalScrollHandler;
  }
  // Reset search & tampilkan semua item
  var inp = list.querySelector('.kas-akun-search');
  if (inp) inp.value = '';
  list.querySelectorAll('.kas-akun-item,.kas-akun-group').forEach(function(el) { el.style.display = ''; });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';

  if (list.dataset.floated && list.parentNode === document.body) {
    var pickerId = list.id.replace('-list', '');
    var picker = document.getElementById(pickerId);
    if (picker && picker.parentNode && picker.parentNode.classList.contains('kas-akun-wrap')) {
      picker.parentNode.appendChild(list);
    }
    delete list.dataset.floated;
  }
  list.style.display = 'none';
}

function kasTogglePicker(pickerId) {
  var picker = document.getElementById(pickerId);
  var list   = document.getElementById(pickerId + '-list');
  if (!picker || !list) return;

  // Tutup semua picker lain dulu
  document.querySelectorAll('.kas-akun-list').forEach(function(el) {
    if (el.id !== pickerId + '-list') kasClosePicker(el);
  });

  if (list.style.display === 'block') { kasClosePicker(list); return; }

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

    // Proper DOM event — inline attributes tidak reliable di iOS Safari untuk pointer events
    // Harus stop propagation di SEMUA event types yang bisa trigger outside handler
    function _stopProp(ev) { ev.stopPropagation(); }
    searchInp.addEventListener('mousedown',   _stopProp);
    searchInp.addEventListener('touchstart',  _stopProp, { passive: true });
    searchInp.addEventListener('pointerdown', _stopProp);
    searchInp.addEventListener('input', function() { kasPickerFilter(searchInp); });

    // iOS Safari: gunakan touchend untuk trigger focus — lebih late dalam event cycle
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
  list.querySelectorAll('.kas-akun-item,.kas-akun-group,.kas-akun-empty').forEach(function(el) {
    el.style.display = '';
  });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';

  // Tandai baru dibuka — cegah outside handler langsung nutup (iOS touchend bubble)
  if (typeof window._kasPickerJustOpened === 'function') window._kasPickerJustOpened();

  // Float ke body
  var listH = 260; // maxHeight

  list.dataset.floated = '1';

  // Posisi awal — dihitung dari rect picker SAAT INI (keyboard belum tentu
  // muncul). Ini cuma posisi sementara supaya list tidak invisible saat
  // langsung di-display; akan dikoreksi ulang setelah keyboard settle (lihat
  // _settle di bawah).
  _kasPositionPickerList(list, picker, listH);

  list.style.display = 'block';
  if (list.parentNode !== document.body) document.body.appendChild(list);

  // Reposisi list setelah keyboard benar2 muncul & modal (jika ikut shift)
  // sudah settle. Posisi awal di atas dihitung dari viewport SEBELUM keyboard
  // tampil, jadi BUKAN posisi final — harus dikoreksi ulang begitu
  // visualViewport resize (keyboard) selesai, baru lalu fokus ke search box.
  // Urutan ini (reposisi dulu, fokus belakangan) mencegah list "lompat" /
  // muncul di tempat salah saat keyboard baru naik.
  function _settle() {
    if (list.style.display !== 'block') return;
    _kasPositionPickerList(list, picker, listH);
  }
  function _settleDeferred() {
    requestAnimationFrame(function() { requestAnimationFrame(_settle); });
  }

  if (window.visualViewport) {
    list._vpHandler = _settleDeferred;
    window.visualViewport.addEventListener('resize', _settleDeferred);
  }

  // Reposisi juga saat .modal (overflow-y:auto) scroll — bukan cuma saat
  // visualViewport (keyboard) resize. Tap pada picker yang dekat tepi modal
  // sering memicu browser auto-scroll .modal untuk bring element into view;
  // ini MENGUBAH picker.getBoundingClientRect() tanpa memicu visualViewport
  // resize sama sekali. Tanpa listener ini, list float tetap di posisi LAMA
  // (relatif viewport) sementara picker sudah pindah — keduanya jadi tidak
  // sinkron, salah satu penyebab "pindah-pindah".
  var _modalEl = picker.closest('.modal');
  if (_modalEl) {
    list._modalScrollEl = _modalEl;
    list._modalScrollHandler = _settleDeferred;
    _modalEl.addEventListener('scroll', _settleDeferred, { passive: true });
  }

  // Auto-focus search input — picu keyboard, lalu visualViewport resize akan
  // memanggil _settleDeferred di atas untuk koreksi posisi final.
  // Fallback timeout (350ms, di luar resize) untuk browser yang tidak fire
  // visualViewport resize secara konsisten saat keyboard animasi.
  if (inp) {
    setTimeout(function() {
      inp.focus();
      setTimeout(_settle, 350);
    }, 80);
  }
}

function kasPickerFilter(inp) {
  var list  = inp.closest('.kas-akun-list');
  if (!list) return;
  var q     = inp.value.toLowerCase().trim();
  var items = list.querySelectorAll('.kas-akun-item');
  var groups = list.querySelectorAll('.kas-akun-group');
  var anyVisible = false;

  // Filter item
  items.forEach(function(item) {
    var match = item.textContent.toLowerCase().indexOf(q) !== -1;
    item.style.display = match ? '' : 'none';
    if (match) anyVisible = true;
  });

  // Sembunyikan group header jika semua item di bawahnya hidden
  groups.forEach(function(grp) {
    var next = grp.nextElementSibling;
    var hasVisible = false;
    while (next && !next.classList.contains('kas-akun-group')) {
      if (next.classList.contains('kas-akun-item') && next.style.display !== 'none') hasVisible = true;
      next = next.nextElementSibling;
    }
    grp.style.display = hasVisible ? '' : 'none';
  });

  // Tampilkan pesan kosong jika tidak ada hasil
  var emp = list.querySelector('.kas-akun-empty');
  if (!emp) {
    emp = document.createElement('div');
    emp.className = 'kas-akun-empty';
    emp.textContent = 'Tidak ditemukan';
    list.appendChild(emp);
  }
  emp.style.display = anyVisible ? 'none' : '';
}

function kasPickerSelect(item) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  var list = item.closest('.kas-akun-list');
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
  // Update picker label
  var lbl = document.getElementById(pickerId + '-label');
  if (lbl) { lbl.textContent = label; lbl.style.color = val ? 'var(--ink)' : 'var(--ink3)'; }
  // Tandai aktif
  list.querySelectorAll('.kas-akun-item').forEach(function(el){ el.classList.remove('active'); });
  item.classList.add('active');
  // Tutup list
  list.style.display = 'none';
}

function kasSyncPickerLabel(pickerId, selectId) {
  var sel = document.getElementById(selectId);
  var picker = document.getElementById(pickerId);
  if (!sel || !picker) return;
  var val = sel.value;
  var list = document.getElementById(pickerId + '-list');
  var lbl  = document.getElementById(pickerId + '-label');
  if (list) {
    list.querySelectorAll('.kas-akun-item').forEach(function(el){ el.classList.remove('active'); });
    var match = list.querySelector('.kas-akun-item[data-val="' + val + '"]');
    if (match) {
      match.classList.add('active');
      if (lbl) { lbl.textContent = match.textContent.trim(); lbl.style.color = 'var(--ink)'; }
    } else {
      if (lbl) { lbl.textContent = '— Pilih Akun —'; lbl.style.color = 'var(--ink3)'; }
    }
  }
}

// ── Frekuensi cicilan show/hide bln_cicilan ──────────────────────────────────
function kasPjmFrekuensiChange(val, prefix) {
  var blnWrap  = document.querySelector('.' + prefix + '-bln-wrap');
  var lblCicil = document.querySelector('.' + prefix + '-cicilan-lbl');
  if (blnWrap)  blnWrap.style.display  = (val === 'tahunan') ? '' : 'none';
  if (lblCicil) lblCicil.textContent   = (val === 'tahunan') ? 'Cicilan/Tahun (opsional)' : 'Cicilan/Bulan (opsional)';
  kasPjmAutoJatuhTempo(prefix);
}

function kasPjmAutoJatuhTempo(prefix) {
  // Ambil nilai dari prefix yang benar (kas-pjm atau kas-edit-pjm)
  var tglMulaiId  = (prefix === 'kas-pjm') ? 'kas-jrn-tgl' : 'kas-edit-tgl';
  var tenorId     = prefix + '-tenor';
  var tglCicilanId= prefix + '-tgl-cicilan';
  var blnCicilanId= prefix + '-bln-cicilan';
  var frekuensiId = prefix + '-frekuensi';
  var jatuhTempoId= prefix + '-jatuh-tempo';

  var tglMulai   = document.getElementById(tglMulaiId)   ? document.getElementById(tglMulaiId).value   : '';
  var tenor      = parseInt(document.getElementById(tenorId)     ? document.getElementById(tenorId).value     : '') || 0;
  var tglCicilan = parseInt(document.getElementById(tglCicilanId)? document.getElementById(tglCicilanId).value: '') || 0;
  var frekuensi  = document.getElementById(frekuensiId)  ? document.getElementById(frekuensiId).value   : 'bulanan';
  var jtEl       = document.getElementById(jatuhTempoId);

  if (!tglMulai || !tenor || !tglCicilan || !jtEl) return;

  var d = new Date(tglMulai);
  if (isNaN(d.getTime())) return;

  // Hitung target bulan & tahun tanpa menyentuh tanggal dulu
  // (setMonth pada tanggal 29-31 bisa overflow ke bulan berikutnya di JS)
  var targetYear  = d.getFullYear();
  var targetMonth = d.getMonth(); // 0-indexed

  if (frekuensi === 'tahunan') {
    targetYear += tenor;
  } else {
    targetMonth += tenor;
    // Normalize overflow (mis: bulan 13 → tahun+1 bulan 1)
    while (targetMonth > 11) { targetMonth -= 12; targetYear++; }
  }

  // Clamp tanggal ke max hari di target bulan
  var maxDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  var targetDay = Math.min(tglCicilan, maxDay);

  // Format YYYY-MM-DD untuk input date
  var yyyy = targetYear;
  var mm   = String(targetMonth + 1).padStart(2, '0');
  var dd   = String(targetDay).padStart(2, '0');
  jtEl.value = yyyy + '-' + mm + '-' + dd;
}

// ── Custom Tipe Picker (modal Edit desktop) ──────────────────────────────────
var _KAS_TIPE_META = {
  jurnal:         { label:'Jurnal Umum',     icon:'ti-pencil'          },
  bayar_pinjaman: { label:'Bayar Pinjaman',  icon:'ti-credit-card'     },
  pinjaman:       { label:'Pinjaman',        icon:'ti-building-bank'   },
  keluar:         { label:'Uang Keluar',     icon:'ti-arrow-up-right'  },
  masuk:          { label:'Uang Masuk',      icon:'ti-arrow-down-left' },
  penarikan:      { label:'Penarikan Tunai', icon:'ti-cash-banknote'   }
};

function kasSyncTipePicker(tipe) {
  var picker = document.getElementById('kas-edit-tipe-picker');
  if (!picker) return;
  var meta = _KAS_TIPE_META[tipe];
  if (!meta) return;
  var iconEl = picker.querySelector('.kas-tipe-picker-icon');
  var lblEl  = picker.querySelector('.kas-tipe-picker-lbl');
  if (iconEl) { iconEl.innerHTML = '<i class="ti ' + meta.icon + '"></i>'; }
  if (lblEl)  { lblEl.textContent = meta.label; lblEl.style.color = 'var(--ink)'; }
}

function kasToggleTipePicker(anchor) {
  // Tutup jika sudah ada portal tipe
  var existing = document.getElementById('_kas-tipe-portal');
  if (existing) { existing.remove(); anchor.querySelector('.ti-chevron-down').style.transform = ''; return; }

  var rect = anchor.getBoundingClientRect();
  var portal = document.createElement('div');
  portal.id = '_kas-tipe-portal';
  portal.style.cssText = 'position:fixed;z-index:9999;background:#1e1e1e;border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.5);min-width:' + Math.max(rect.width, 190) + 'px;overflow:hidden;';

  // Posisi: muncul ke bawah, atau ke atas kalau dekat bawah layar
  var spaceBelow = window.innerHeight - rect.bottom;
  var menuH = 6 * 40; // estimasi 6 item x 40px
  if (spaceBelow < menuH + 8) {
    portal.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
    portal.style.top = 'auto';
  } else {
    portal.style.top = (rect.bottom + 4) + 'px';
  }
  portal.style.left = rect.left + 'px';

  Object.entries(_KAS_TIPE_META).forEach(function(entry) {
    var val = entry[0], m = entry[1];
    var item = document.createElement('div');
    item.className = 'kas-tipe-portal-item';
    item.innerHTML = '<i class="ti ' + m.icon + '"></i><span>' + m.label + '</span>';
    item.addEventListener('click', function() {
      document.getElementById('kas-edit-tipe').value = val;
      kasSyncTipePicker(val);
      portal.remove();
      anchor.querySelector('.ti-chevron-down').style.transform = '';
      kasOnEditTipeChange();
    });
    portal.appendChild(item);
  });

  document.body.appendChild(portal);
  anchor.querySelector('.ti-chevron-down').style.transform = 'rotate(180deg)';

  // Tutup saat klik luar
  setTimeout(function() {
    document.addEventListener('click', function _closeTipe(e) {
      if (!portal.contains(e.target) && e.target !== anchor) {
        portal.remove();
        if (anchor.querySelector) anchor.querySelector('.ti-chevron-down').style.transform = '';
      }
      document.removeEventListener('click', _closeTipe);
    });
  }, 10);
}

// Reset picker saat modal dibuka untuk transaksi baru
var _kasOrigShowModal = window.showModal;
if (_kasOrigShowModal) {
  window.showModal = function(id) {
    _kasOrigShowModal(id);
    if (id === 'modal-kas-transaksi') {
      // Cek apakah form baru (bukan edit)
      setTimeout(function() {
        var kasId = document.getElementById('kas-edit-id');
        if (kasId && !kasId.value) {
          ['picker-edit-debit','picker-edit-kredit'].forEach(function(pid) {
            var lbl = document.getElementById(pid + '-label');
            if (lbl) { lbl.textContent = '— Pilih Akun —'; lbl.style.color = 'var(--ink3)'; }
            var list = document.getElementById(pid + '-list');
            if (list) { list.querySelectorAll('.kas-akun-item').forEach(function(el){ el.classList.remove('active'); }); }
          });
        }
      }, 30);
    }
  };
}

// Close listener dipindah ke unified handler di bawah

// scroll listener: handled by unified handler in app.js

// ─── ENSURE FLEX LAYOUT — sama persis pola JP ────────────────
function _kasEnsureFlexLayout() {
  var pg = document.getElementById('page-kas');
  if (!pg || !pg.classList.contains('active')) return;

  document.body.classList.add('kas-active');
  _kasSetCardHeight();
}

function _kasSetCardHeight() {
  var pg = document.getElementById('page-kas');
  if (!pg || !pg.classList.contains('active')) return;

  var card = document.getElementById('kas-jurnal-card');
  if (!card) return;

  requestAnimationFrame(function() {
    var cardTop = card.getBoundingClientRect().top;
    var winH    = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
    var newH    = winH - cardTop;
    if (newH > 100) {
      card.style.height    = newH + 'px';
      card.style.minHeight = newH + 'px';
      card.style.maxHeight = newH + 'px';
      card.style.flex      = 'none';
      card.style.overflow  = 'hidden';
    }
  });
}

// Re-kalkulasi card height setiap kali top-bar collapse/expand selesai (0.25s transition)
(function() {
  var _kasTopBar = document.getElementById('kas-top-bar');
  if (!_kasTopBar) return;
  _kasTopBar.addEventListener('transitionend', function(e) {
    if (e.propertyName === 'max-height') {
      // Tunggu satu frame lagi agar DOM settle
      setTimeout(_kasSetCardHeight, 16);
    }
  });
})();
window.addEventListener('resize', function() {
  var pg = document.getElementById('page-kas');
  if (pg && pg.classList.contains('active')) _kasEnsureFlexLayout();
});

window.addEventListener('orientationchange', function() {
  var pg = document.getElementById('page-kas');
  if (!pg || !pg.classList.contains('active')) return;
  setTimeout(_kasEnsureFlexLayout, 300);
});

// ─── HOOK zenot:page ─────────────────────────────────────────
document.addEventListener('zenot:page', function(e) {
  // Bersihkan kas-active saat navigasi ke halaman lain
  if (e.detail.page !== 'kas') {
    document.body.classList.remove('kas-active');
    return;
  }
  setTimeout(_kasEnsureFlexLayout, 60);
  setTimeout(function() {
    var tb = document.getElementById('kas-top-bar');
    if (tb) tb.classList.remove('kas-topbar-collapsed');
  }, 60);
  // Reload data otomatis saat navigasi ke halaman ini (debounce 250ms)
  clearTimeout(window._kasReloadTimer);
  window._kasReloadTimer = setTimeout(loadKasJurnal, 250);
});

// ─── SWIPE GESTURE — collapse kas-top-bar di semua touch mobile ──
(function() {
  var _mq = window.matchMedia('(hover: none) and (pointer: coarse)');
  function _kasInitSwipe() {
    if (!_mq.matches) return;
    var topBar      = document.getElementById('kas-top-bar');
    var stickyHdr   = document.getElementById('kas-sticky-header');
    var summary     = document.querySelector('#kas-panel-jurnal .kas-summary');
    if (!topBar) return;
    // Swipe di top-bar sendiri
    initSwipeCollapse(topBar, topBar, 50, 'kas-topbar-collapsed');
    // Swipe di sticky header dalam card juga bisa expand/collapse
    if (stickyHdr) initSwipeCollapse(stickyHdr, topBar, 50, 'kas-topbar-collapsed');
    // Swipe di summary juga
    if (summary) initSwipeCollapse(summary, topBar, 50, 'kas-topbar-collapsed');
  }
  setTimeout(_kasInitSwipe, 300);
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'kas') return;
    setTimeout(function() {
      var tb = document.getElementById('kas-top-bar');
      if (tb) tb.classList.remove('kas-topbar-collapsed');
      _kasInitSwipe();
    }, 80);
  });
})();

// ─── SCROLL-TO-COLLAPSE di tab Laporan & Akun (semua mode: HP, landscape, laptop) ──
(function() {
  function _kasScrollCollapseInit(panelId) {
    var panel  = document.getElementById(panelId);
    var topBar = document.getElementById('kas-top-bar');
    if (!panel || !topBar || panel._kasCollapseInited) return;
    panel._kasCollapseInited = true;
    var _lastY = 0;
    panel.addEventListener('scroll', function() {
      var y = panel.scrollTop;
      if (y > 40 && y > _lastY) {
        topBar.classList.add('kas-topbar-collapsed');
      } else if (y < _lastY || y <= 40) {
        topBar.classList.remove('kas-topbar-collapsed');
      }
      _lastY = y;
    }, { passive: true });
  }
  function _kasAkunInitScroll() {
    _kasScrollCollapseInit('kas-panel-akun');
    _kasScrollCollapseInit('kas-panel-laporan');
  }
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'kas') return;
    setTimeout(function() {
      var tb = document.getElementById('kas-top-bar');
      if (tb) tb.classList.remove('kas-topbar-collapsed');
      _kasAkunInitScroll();
    }, 80);
  });
  setTimeout(_kasAkunInitScroll, 300);
})();
