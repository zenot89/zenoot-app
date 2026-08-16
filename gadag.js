// ─── GADAG.JS — Jahit / Makloon (ongkos per lusin) ────────────
// Tabel: gadag_sku        { id, nama, ongkos_lusin, created_at }
// Tabel: gadag_pendapatan { id, tanggal, sku_id, sku_nama, ongkos_lusin, qty, total, created_at }
// Total per catatan = round(qty / 12 * ongkos_lusin)

let _gdgSkuList        = [];
let _gdgPendapatanList = [];

// ─── HTML ─────────────────────────────────────────────────────
document.getElementById('page-gadag').innerHTML = `
<style>
  .gdg-hero {
    background: linear-gradient(135deg, var(--cream2), var(--cream));
    border: 2px solid var(--ok);
    margin-bottom: 14px;
  }
  .gdg-hero-label {
    font-size: 11px; font-weight: 700; letter-spacing: .5px;
    color: var(--ink3); text-transform: uppercase;
    display: flex; align-items: center; gap: 5px;
  }
  .gdg-hero-value { font-size: 32px; font-weight: 800; color: var(--ok); margin-top: 4px; line-height: 1.1; }
  .gdg-hero-sub   { font-size: 12px; color: var(--ink3); margin-top: 3px; }
  .gdg-minicards { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
  .gdg-minicard.mc-pend { border: 2px solid var(--ok); }
  .gdg-minicard.mc-cost { border: 2px solid var(--danger); }
  .gdg-metrics { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:14px; }
  @media(max-width:600px){ .gdg-metrics { grid-template-columns:repeat(2,1fr); } }
  .gdg-panel { display:none; }
  .gdg-panel.active { display:block; }

  /* ── Collapse ringkasan (minicard+metrics), pola sama dgn kas-top-bar ── */
  #gdg-top-summary {
    overflow: hidden;
    transition: max-height 0.25s ease, opacity 0.2s ease;
    max-height: 500px;
    opacity: 1;
  }
  #gdg-top-summary.gdg-topbar-collapsed {
    max-height: 0 !important;
    opacity: 0;
    pointer-events: none;
  }
  #gdg-sticky-header { cursor: grab; }

  /* ── Bottom-sheet: modal Tambah Catatan Pendapatan (pola IG comment sheet) ──
     Kenapa: modal center/top-align lama harus "re-center ulang" tiap kali
     keyboard iOS buka/tutup (visual viewport berubah) → itu penyebab modal
     kelihatan "mental"/lompat. Bottom-sheet nempel bottom:0, jadi cuma
     tingginya yg nyusut ngikutin ruang tersisa — ga perlu reposisi ulang.
     Tinggi/posisi aktualnya di-drive JS via window.visualViewport. */
  @media (max-width:900px){
    .gdg-sheet-overlay {
      align-items: flex-end !important;
      padding: 0 !important;
    }
    .gdg-sheet-overlay .gdg-sheet {
      width: 100% !important;
      max-width: 100% !important;
      max-height: 88dvh !important;
      margin: 0 !important;
      border-radius: 18px 18px 0 0 !important;
      padding: 0 !important;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform .28s cubic-bezier(.32,.72,0,1);
    }
    .gdg-sheet-overlay.gdg-sheet-in .gdg-sheet { transform: translateY(0); }
    .gdg-sheet-handle {
      flex: none;
      display: flex; justify-content: center; align-items: center;
      padding: 10px 0 6px; cursor: grab; touch-action: none;
    }
    .gdg-sheet-handle span {
      width: 40px; height: 5px; border-radius: 3px; background: var(--ink3); opacity: .5;
    }
    .gdg-sheet-body {
      overflow-y: auto;
      -webkit-overflow-scrolling: auto;
      overscroll-behavior: contain;
    }
  }

  /* ── Dropdown menu Jurnal / Kelola Produk ── */
  .gdg-menu-wrap { position: relative; }
  .gdg-dropdown-menu {
    display:none; position:absolute; right:0; top:calc(100% + 6px);
    background:var(--cream); border:2px solid var(--ink); min-width:190px; z-index:50;
    box-shadow:0 4px 10px rgba(0,0,0,.35);
  }
  .gdg-dropdown-menu.open { display:block; }
  .gdg-dropdown-menu button {
    display:flex; align-items:center; gap:8px; width:100%; text-align:left;
    padding:9px 12px; background:none; border:none; border-bottom:1px solid var(--cream2);
    font-family:var(--f); font-size:13px; font-weight:600; cursor:pointer; color:var(--ink);
  }
  .gdg-dropdown-menu button:last-child { border-bottom:none; }
  .gdg-dropdown-menu button:hover { background:var(--cream2); }
  .gdg-dropdown-menu button.active { color:var(--ok); }

  /* ══ TEMA "BUKU TULIS" — khusus block Gadag ══════════════════════
     Font "More Sugar" ga tersedia buat di-embed (font eksklusif Canva),
     jadi dipakai fallback sesuai instruksi: Comic Sans MS (bawaan iOS)
     dengan Comic Neue (versi web-safe/lisensi terbuka dari Google Fonts,
     visualnya mirip) buat platform yg ga punya Comic Sans MS bawaan. */
  @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap');

  #page-gadag {
    --gdg-paper:   #f7f2e6;   /* kertas krem */
    --gdg-paper2:  #efe8d8;   /* kertas krem, sedikit lebih gelap (buat card ke-2/hover) */
    --gdg-ink:     #262220;   /* tinta pena, hampir hitam */
    --gdg-ink2:    #5c554d;   /* tinta pudar, buat teks sekunder */
    --gdg-rule:    rgba(38,34,32,0.12); /* garis buku ("ruled lines") */
    --gdg-margin:  #d9776f;  /* garis margin merah ala buku tulis */
    --danger: #b5453d;   /* override: merah dark-theme kepucetan di atas kertas krem */
    --info:   #2f6fb0;
    --accent: #8a5a2b;   /* warna aksen tinta coklat, buat nama SKU dsb */
    font-family: 'Comic Sans MS', 'Comic Neue', cursive, sans-serif;
  }
  #page-gadag .content {
    background-color: var(--gdg-paper);
    background-image: repeating-linear-gradient(
      to bottom, transparent, transparent 27px, var(--gdg-rule) 28px
    );
  }
  #page-gadag .card,
  #page-gadag .gdg-minicard,
  #page-gadag .metric,
  #page-gadag .modal {
    background: var(--gdg-paper) !important;
    color: var(--gdg-ink);
    border: 2.5px solid var(--gdg-ink) !important;
    border-radius: 16px 22px 14px 24px / 22px 14px 24px 16px; /* wobble ala coretan tangan */
    box-shadow: 2px 3px 0 rgba(38,34,32,0.15) !important;
  }
  /* garis margin merah khas buku tulis, nempel di tepi kiri tiap card */
  #page-gadag .card, #page-gadag .gdg-minicard { position: relative; padding-left: 18px; }
  #page-gadag .card::before, #page-gadag .gdg-minicard::before {
    content: ''; position: absolute; left: 10px; top: 10px; bottom: 10px; width: 2px;
    background: var(--gdg-margin); border-radius: 2px; opacity: .55;
  }
  #page-gadag,
  #page-gadag .card-title,
  #page-gadag .m-label, #page-gadag .m-value, #page-gadag .m-delta,
  #page-gadag th, #page-gadag td,
  #page-gadag label, #page-gadag input, #page-gadag select {
    color: var(--gdg-ink) !important;
    font-family: inherit;
  }
  #page-gadag .m-delta, #page-gadag td[style*="ink3"], #page-gadag span[style*="ink3"] { color: var(--gdg-ink2) !important; }
  #page-gadag input, #page-gadag select {
    background: #fff !important;
    border-color: var(--gdg-ink) !important;
    border-radius: 10px !important;
  }
  #page-gadag .btn {
    font-family: inherit; font-weight: 700;
    border: 2px solid var(--gdg-ink) !important;
    border-radius: 999px !important;
    background: #fff; color: var(--gdg-ink);
  }
  #page-gadag .btn-primary { background: var(--gdg-ink); color: var(--gdg-paper) !important; }
  #page-gadag .btn-danger  { background: #fff; color: #b5453d; border-color: #b5453d !important; }
  #page-gadag .gdg-dropdown-menu {
    background: var(--gdg-paper) !important; border: 2.5px solid var(--gdg-ink) !important;
    border-radius: 14px !important;
  }
  #page-gadag .gdg-dropdown-menu button { color: var(--gdg-ink) !important; font-family: inherit; }
  #page-gadag .tbl thead th { color: var(--gdg-ink2) !important; border-bottom: 2px dashed var(--gdg-ink); }
  #page-gadag .tbl tbody tr { border-bottom: 1px solid var(--gdg-rule); }
  #page-gadag .gdg-sheet-handle span { background: var(--gdg-ink) !important; opacity: .35; }

  /* ── Penyesuaian khusus layar sempit (HP) ── */
  @media(max-width:480px) {
    .gdg-hero-value { font-size: 22px; }
    .gdg-metrics .m-value { font-size: 16px; line-height: 1.3; }
    #page-gadag .tbl th, #page-gadag .tbl td { font-size: 12px; padding: 6px 4px; }
    #page-gadag .tbl td:last-child, #page-gadag .tbl th:last-child { padding-right: 2px; }
    #page-gadag .tbl .btn-sm { min-height: 28px; padding: 0 6px; font-size: 11px; }
    #page-gadag .tbl .btn-sm i { font-size: 12px; }
    /* bayangan tipis di kanan tbl-wrap = penanda "masih bisa di-swipe" */
    #page-gadag .tbl-wrap { position: relative; }
    #page-gadag .tbl-wrap::after {
      content: '';
      position: absolute; top: 0; right: 0; bottom: 0; width: 14px;
      background: linear-gradient(to right, transparent, rgba(0,0,0,.35));
      pointer-events: none;
    }
  }
</style>

<!-- HEADER: judul + dropdown menu (Catatan Pendapatan / Kelola Produk) -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
  <div style="display:flex;align-items:center;gap:8px;min-width:0">
    <button id="gdg-summary-toggle" class="btn btn-sm" onclick="gdgToggleSummary()" style="display:none;flex:none" title="Tampilkan/sembunyikan ringkasan">
      <i id="gdg-summary-toggle-icon" class="ti ti-chevron-up"></i>
    </button>
    <i id="gdg-view-heading-icon" class="ti ti-calendar-week" style="font-size:20px;flex:none"></i>
    <div id="gdg-view-heading" style="font-size:20px;font-weight:800;letter-spacing:.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Overview</div>
  </div>
  <div class="gdg-menu-wrap">
    <button id="gdg-menu-btn" class="btn btn-sm btn-primary" onclick="gdgToggleMenu(event)">
      <i class="ti ti-menu-2"></i> <span id="gdg-menu-btn-label">Menu</span> <i class="ti ti-chevron-down"></i>
    </button>
    <div id="gdg-dropdown-menu" class="gdg-dropdown-menu">
      <button id="gdg-menu-item-mingguan" onclick="gdgSelectView('mingguan')"><i class="ti ti-calendar-week"></i> Ringkasan Mingguan</button>
      <button id="gdg-menu-item-pendapatan" onclick="gdgSelectView('pendapatan')"><i class="ti ti-notes"></i> Catatan Pendapatan</button>
      <button id="gdg-menu-item-riwayat" onclick="gdgSelectView('riwayat')"><i class="ti ti-history"></i> Riwayat</button>
      <button id="gdg-menu-item-sku" onclick="gdgSelectView('sku')"><i class="ti ti-list-details"></i> Kelola Produk</button>
    </div>
  </div>
</div>

<!-- PANEL: RINGKASAN MINGGUAN (halaman utama / default) -->
<div id="gdg-panel-mingguan" class="gdg-panel active">

<!-- Wrapper collapsible: 2 minicard + metrics + refresh -->
<div id="gdg-top-summary">

<!-- 2 MINICARD: TOTAL PENDAPATAN & PENGELUARAN MINGGUAN (COST) — cuma di sini -->
<div class="gdg-minicards">
  <div class="card gdg-minicard mc-pend">
    <div class="gdg-hero-label"><i class="ti ti-scissors"></i> Total Pendapatan</div>
    <div class="gdg-hero-value" id="gdg-total-pendapatan" style="color:var(--ok)">Rp0</div>
    <div class="gdg-hero-sub" id="gdg-total-sub">— pcs dikerjakan · — catatan</div>
  </div>
  <div class="card gdg-minicard mc-cost">
    <div class="gdg-hero-label"><i class="ti ti-receipt-2"></i> Pengeluaran Mingguan</div>
    <div class="gdg-hero-value" id="gdg-cost-value" style="color:var(--danger)">Rp0</div>
    <div class="gdg-hero-sub" id="gdg-cost-sub">— (cost minggu ini)</div>
  </div>
</div>

<div class="gdg-metrics">
  <div class="metric">
    <div class="m-label">Jumlah Qty / Lsn</div>
    <div class="m-value" id="gdg-metric-qty">—</div>
    <div class="m-delta">pcs, minggu terpilih</div>
  </div>
  <div class="metric">
    <div class="m-label">Jumlah SKU</div>
    <div class="m-value" id="gdg-metric-sku">—</div>
    <div class="m-delta">master ongkos per lusin</div>
  </div>
</div>

<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
  <button class="btn btn-sm" onclick="gdgLoad()"><i class="ti ti-refresh"></i> Refresh</button>
</div>

</div>
<!-- /gdg-top-summary -->

<div class="card">
  <!-- Sticky header: persis pola #kas-sticky-header — area ini yg jadi swipe zone -->
  <div id="gdg-sticky-header" class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
    <div style="display:flex;align-items:center;gap:6px">
      <button class="btn btn-sm" onclick="gdgWPrevWeek()"><i class="ti ti-chevron-left"></i></button>
      <span id="gdgw-week-label" style="font-size:13px;font-weight:800;white-space:nowrap">—</span>
      <button class="btn btn-sm" onclick="gdgWNextWeek()"><i class="ti ti-chevron-right"></i></button>
    </div>
    <button class="btn btn-sm btn-primary" onclick="gdgWThisWeek()">Minggu Ini</button>
  </div>
  <div style="padding:8px 0 12px">
    <div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase">Net</div>
    <div id="gdgw-net-value" style="font-size:26px;font-weight:800;color:var(--ok)">Rp0</div>
  </div>
  <div id="gdgw-data-area" class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>Hari</th><th style="text-align:right">Pendapatan</th><th style="text-align:right">Beban</th><th style="text-align:right">Net</th></tr></thead>
      <tbody id="gdgw-harian-tbody">
        <tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
</div>
</div>

<!-- PANEL: CATATAN PENDAPATAN (cuma minggu berjalan — data lama pindah ke Riwayat) -->
<div id="gdg-panel-pendapatan" class="gdg-panel">
<div style="display:flex;gap:8px;margin-bottom:10px">
  <button class="btn btn-sm" onclick="gdgLoad()"><i class="ti ti-refresh"></i> Refresh</button>
</div>
<div class="card">
  <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <span id="gdg-pend-count" style="font-size:12px;font-weight:700;color:var(--ink3);text-transform:uppercase">— catatan</span>
    <button class="btn btn-sm btn-primary" onclick="gdgShowPendapatanModal()"><i class="ti ti-plus"></i> Tambah Catatan</button>
  </div>
  <div class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>Hari</th><th>SKU</th><th>Warna</th><th style="text-align:right">Qty</th><th style="text-align:right">Total</th><th>Aksi</th></tr></thead>
      <tbody id="gdg-pend-tbody">
        <tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
</div>
</div>

<!-- PANEL: RIWAYAT (semua catatan minggu-minggu lalu, biar data ga ilang) -->
<div id="gdg-panel-riwayat" class="gdg-panel">
<div style="display:flex;gap:8px;margin-bottom:10px">
  <button class="btn btn-sm" onclick="gdgLoad()"><i class="ti ti-refresh"></i> Refresh</button>
</div>
<div class="card">
  <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
    <div style="display:flex;align-items:center;gap:6px">
      <button class="btn btn-sm" onclick="gdgHistPrevWeek()"><i class="ti ti-chevron-left"></i></button>
      <span id="gdg-hist-week-label" style="font-size:13px;font-weight:800;white-space:nowrap">—</span>
      <button class="btn btn-sm" onclick="gdgHistNextWeek()"><i class="ti ti-chevron-right"></i></button>
    </div>
    <button class="btn btn-sm btn-primary" onclick="gdgHistThisWeek()">Minggu Ini</button>
  </div>
  <div id="gdg-hist-count" style="font-size:12px;font-weight:700;color:var(--ink3);text-transform:uppercase;margin-bottom:6px">— catatan</div>
  <div class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>Hari</th><th>SKU</th><th>Warna</th><th style="text-align:right">Qty</th><th style="text-align:right">Total</th><th>Aksi</th></tr></thead>
      <tbody id="gdg-hist-tbody">
        <tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
</div>
</div>

<!-- PANEL: KELOLA PRODUK (master SKU & ongkos) -->
<div id="gdg-panel-sku" class="gdg-panel">
<div style="display:flex;gap:8px;margin-bottom:10px">
  <button class="btn btn-sm" onclick="gdgLoad()"><i class="ti ti-refresh"></i> Refresh</button>
</div>
<div class="card">
  <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <span id="gdg-sku-count" style="font-size:12px;font-weight:700;color:var(--ink3);text-transform:uppercase">— SKU</span>
    <button class="btn btn-sm btn-primary" onclick="gdgShowSkuModal()"><i class="ti ti-plus"></i> Tambah SKU</button>
  </div>
  <div class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>SKU</th><th style="text-align:right">Ongkos / Lusin (12 pc)</th><th>Aksi</th></tr></thead>
      <tbody id="gdg-sku-tbody">
        <tr><td colspan="3" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>

    </table>
  </div>
</div>
</div>

<!-- MODAL: SKU -->
<div class="modal-overlay" id="modal-gdg-sku" onclick="gdgOverlayClose(event,'modal-gdg-sku', gdgCloseSkuModal)">
  <div class="modal" style="max-width:400px;width:100%;padding:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px" id="gdg-sku-modal-title">
        <i class="ti ti-plus"></i> Tambah SKU
      </div>
      <button onclick="gdgCloseSkuModal()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="gdg-sku-edit-id">
    <div class="form-group" style="margin-bottom:8px">
      <label>Nama SKU / Jahitan</label>
      <input type="text" id="gdg-sku-nama" placeholder="contoh: Daster Batik A"
        style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
    </div>
    <div class="form-group" style="margin-bottom:16px">
      <label>Ongkos / Lusin (Rp, 1 lusin = 12 pc)</label>
      <input type="text" inputmode="numeric" id="gdg-sku-ongkos" placeholder="contoh: 120.000"
        oninput="gdgFormatRibuan(this)"
        style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn" onclick="gdgCloseSkuModal()">Batal</button>
      <button class="btn btn-primary" onclick="gdgSimpanSku()"><i class="ti ti-check"></i> Simpan</button>
    </div>
  </div>
</div>

<!-- MODAL: CATATAN PENDAPATAN (bottom-sheet, keyboard-safe via visualViewport) -->
<div class="modal-overlay gdg-sheet-overlay" id="modal-gdg-pend" onclick="gdgOverlayClose(event,'modal-gdg-pend', gdgClosePendapatanModal)">
  <div class="modal gdg-sheet" id="gdg-pend-sheet" style="max-width:420px;width:100%;padding:0">
    <div id="gdg-pend-sheet-handle" class="gdg-sheet-handle"><span></span></div>
    <div class="gdg-sheet-body" style="padding:0 16px 16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px" id="gdg-pend-modal-title">
        <i class="ti ti-plus"></i> Tambah Catatan Pendapatan
      </div>
      <button onclick="gdgClosePendapatanModal()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="gdg-pend-edit-id">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      <div class="form-group">
        <label>Hari</label>
        <input type="text" id="gdg-pend-hari" readonly
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream2);box-sizing:border-box;color:var(--ink2)">
      </div>
      <div class="form-group">
        <label>Tanggal</label>
        <input type="date" id="gdg-pend-tanggal" onchange="gdgUpdateHari()"
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
      </div>
      <div class="form-group">
        <label>Warna</label>
        <input type="text" id="gdg-pend-warna" placeholder="contoh: Merah" autocomplete="off" autocorrect="off" spellcheck="false"
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
      </div>
      <div class="form-group">
        <label>SKU</label>
        <select id="gdg-pend-sku" onchange="gdgRecomputePreview()"
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
          <option value="">— pilih —</option>
        </select>
      </div>
      <div class="form-group" style="padding:10px;background:var(--cream2);border:1px dashed var(--ink3);margin:0">
        <label style="font-size:11px;color:var(--ink3)">Total</label>
        <div id="gdg-pend-preview" style="font-size:18px;font-weight:800;color:var(--ok)">Rp0</div>
      </div>
      <div class="form-group">
        <label>Qty (pc)</label>
        <input type="text" inputmode="numeric" id="gdg-pend-qty" placeholder="contoh: 9"
          oninput="gdgRecomputePreview()"
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn" onclick="gdgClosePendapatanModal()">Batal</button>
      <button class="btn btn-primary" onclick="gdgSimpanPendapatan()"><i class="ti ti-check"></i> Simpan</button>
    </div>
    </div>
  </div>
</div>
`;

setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-gadag')); }, 80);

// ─── VIEW SWITCH: dropdown menu (Ringkasan Mingguan / Catatan Pendapatan / Kelola Produk) ──
let _gdgView = 'mingguan';

const _GDG_VIEW_LABEL = {
  mingguan:   { menu: 'Ringkasan Mingguan', label: 'Ringkasan', heading: 'Overview',      icon: 'ti-calendar-week' },
  pendapatan: { menu: 'Catatan Pendapatan', label: 'Jurnal',    heading: 'Catatan',       icon: 'ti-notes' },
  riwayat:    { menu: 'Riwayat',            label: 'Riwayat',   heading: 'Riwayat',       icon: 'ti-history' },
  sku:        { menu: 'Kelola Produk',      label: 'Kelola Produk', heading: 'Kelola Produk', icon: 'ti-list-details' },
};

function gdgToggleMenu(e) {
  if (e) e.stopPropagation();
  document.getElementById('gdg-dropdown-menu').classList.toggle('open');
}
function gdgCloseMenu() {
  document.getElementById('gdg-dropdown-menu').classList.remove('open');
}
document.addEventListener('click', function(e) {
  const menu = document.getElementById('gdg-dropdown-menu');
  const btn  = document.getElementById('gdg-menu-btn');
  if (!menu || !btn) return;
  if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.remove('open');
  }
});

function gdgSelectView(view) {
  _gdgView = view;
  gdgApplyView();
  gdgCloseMenu();
}

function gdgApplyView() {
  document.getElementById('gdg-panel-mingguan').classList.toggle('active',   _gdgView === 'mingguan');
  document.getElementById('gdg-panel-pendapatan').classList.toggle('active', _gdgView === 'pendapatan');
  document.getElementById('gdg-panel-riwayat').classList.toggle('active',   _gdgView === 'riwayat');
  document.getElementById('gdg-panel-sku').classList.toggle('active',       _gdgView === 'sku');

  document.getElementById('gdg-menu-btn-label').textContent  = _GDG_VIEW_LABEL[_gdgView].label;
  document.getElementById('gdg-view-heading').textContent    = _GDG_VIEW_LABEL[_gdgView].heading;
  document.getElementById('gdg-view-heading-icon').className = 'ti ' + _GDG_VIEW_LABEL[_gdgView].icon;
  const toggleBtn = document.getElementById('gdg-summary-toggle');
  if (toggleBtn) toggleBtn.style.display = (_gdgView === 'mingguan') ? '' : 'none';
  ['mingguan','pendapatan','riwayat','sku'].forEach(v => {
    document.getElementById('gdg-menu-item-' + v).classList.toggle('active', v === _gdgView);
  });
  if (_gdgView === 'riwayat' && !_gdgHistWeekStart) gdgHistThisWeek();
}

// ─── INIT ─────────────────────────────────────────────────────
function gdgInit() {
  _gdgView = 'mingguan';
  gdgApplyView();
  const tglEl = document.getElementById('gdg-pend-tanggal');
  if (tglEl) {
    const now = new Date();
    tglEl.value = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  }
  gdgLoad();
  gdgWInit();
}

// ═══════════════════════════════════════════════════════════════
// RINGKASAN MINGGUAN (lokal di Gadag)
// Pendapatan = dari gadag_pendapatan (bukan tabel global)
// Beban      = dari jurnal + kas_akun, kode 5-xxx KECUALI 5-001 (Beban Gaji)
// ═══════════════════════════════════════════════════════════════
let _gdgWAkunAll   = [];
let _gdgWJurnalAll = [];
let _gdgWWeekStart = null; // Date, Senin 00:00
let _gdgWAkunLoaded = false;

const _GDGW_HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const _GDGW_BLN  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

// Minggu gajian: mulai hari Minggu, berakhir hari Sabtu.
// Kerja hari Minggu ikut kehitung di minggu berikutnya (pembayaran minggu depan).
function gdgWGetMonday(d) {
  const day = d.getDay(); // 0=Minggu..6=Sabtu
  const sun = new Date(d);
  sun.setDate(d.getDate() - day);
  sun.setHours(0,0,0,0);
  return sun;
}
function gdgWToISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function gdgWFmtTgl(d) { return d.getDate() + ' ' + _GDGW_BLN[d.getMonth()] + ' ' + d.getFullYear(); }
// Format ringkas rentang minggu, biar ga makan tempat: "10-17 Ags 2026".
// Otomatis nyesuain kalau minggunya nyebrang bulan/tahun.
function gdgWFmtRange(start, end) {
  const sameYear  = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return start.getDate() + '-' + end.getDate() + ' ' + _GDGW_BLN[start.getMonth()] + ' ' + start.getFullYear();
  }
  if (sameYear) {
    return start.getDate() + ' ' + _GDGW_BLN[start.getMonth()] + ' - ' + end.getDate() + ' ' + _GDGW_BLN[end.getMonth()] + ' ' + start.getFullYear();
  }
  return gdgWFmtTgl(start) + ' - ' + gdgWFmtTgl(end);
}
function gdgWFmt(n) {
  const v = Number(n)||0;
  return (v < 0 ? '-Rp' : 'Rp') + Math.round(Math.abs(v)).toLocaleString('id-ID');
}

function gdgWPrevWeek() { _gdgWWeekStart.setDate(_gdgWWeekStart.getDate() - 7); gdgWRenderWeek(); }
function gdgWNextWeek() { _gdgWWeekStart.setDate(_gdgWWeekStart.getDate() + 7); gdgWRenderWeek(); }
function gdgWThisWeek() { _gdgWWeekStart = gdgWGetMonday(new Date()); gdgWRenderWeek(); }

async function gdgWInit() {
  _gdgWWeekStart = gdgWGetMonday(new Date());
  if (!_gdgWAkunLoaded) {
    try {
      const [akun, jurnal] = await Promise.all([
        dbGet('kas_akun', '&order=kode.asc'),
        dbGet('jurnal', '&order=tanggal.asc'),
      ]);
      _gdgWAkunAll   = akun   || [];
      _gdgWJurnalAll = jurnal || [];
      _gdgWAkunLoaded = true;
    } catch(e) {
      document.getElementById('gdgw-harian-tbody').innerHTML = `<tr><td colspan="4" style="color:var(--danger)">Error ambil data beban: ${e.message}</td></tr>`;
      return;
    }
  }
  gdgWRenderWeek();
}

// Hitung beban minggu ini dari jurnal (akun kode 5-xxx kecuali 5-001)
function gdgWHitungBebanHari(isoDay, akunBebanMap) {
  let beban = 0;
  _gdgWJurnalAll.forEach(r => {
    if (r.tanggal !== isoDay) return;
    const n = r.nominal || r.debit || r.kredit || 0;
    if (r.akun_debit_id  && akunBebanMap[r.akun_debit_id])  beban += n;
    if (r.akun_kredit_id && akunBebanMap[r.akun_kredit_id]) beban -= n;
  });
  return beban;
}

async function gdgWRenderWeek() {
  if (!_gdgWWeekStart) return;
  const mingguMulai  = new Date(_gdgWWeekStart); // hari Minggu
  const mingguAkhir  = new Date(_gdgWWeekStart); mingguAkhir.setDate(mingguMulai.getDate() + 6); // hari Sabtu
  document.getElementById('gdgw-week-label').textContent = gdgWFmtRange(mingguMulai, mingguAkhir);

  const isoMulai = gdgWToISO(mingguMulai), isoAkhir = gdgWToISO(mingguAkhir);

  // Akun beban yg dihitung: kode diawali "5-" TAPI BUKAN "5-001" (skip Beban Gaji)
  const akunBebanMap = {};
  _gdgWAkunAll.forEach(a => {
    if (a.kelompok === 'beban' && (a.kode||'').indexOf('5-') === 0 && a.kode !== '5-001') akunBebanMap[a.id] = a;
  });

  document.getElementById('gdgw-harian-tbody').innerHTML = '<tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';

  let pendapatanMingguList = [];
  try {
    pendapatanMingguList = await dbGet('gadag_pendapatan', '&tanggal=gte.' + isoMulai + '&tanggal=lte.' + isoAkhir) || [];
  } catch(e) {
    document.getElementById('gdgw-harian-tbody').innerHTML = `<tr><td colspan="4" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
    return;
  }

  let html = '', totalPend = 0, totalBeban = 0;
  for (let i = 0; i < 7; i++) {
    const d      = new Date(mingguMulai); d.setDate(mingguMulai.getDate() + i);
    const isoDay = gdgWToISO(d);
    const pend   = pendapatanMingguList.filter(p => p.tanggal === isoDay).reduce((s,p) => s + (Number(p.total)||0), 0);
    const beban  = gdgWHitungBebanHari(isoDay, akunBebanMap);
    const net    = pend - beban;
    totalPend  += pend;
    totalBeban += beban;
    html += `<tr>
      <td><b>${_GDGW_HARI[i]}</b> <span style="font-size:11px;color:var(--ink3)">${d.getDate()}/${d.getMonth()+1}</span></td>
      <td style="text-align:right;color:var(--ok)">${gdgWFmt(pend)}</td>
      <td style="text-align:right;color:var(--danger)">${gdgWFmt(beban)}</td>
      <td style="text-align:right"><b style="color:${net>=0?'var(--ok)':'var(--danger)'}">${gdgWFmt(net)}</b></td>
    </tr>`;
  }
  const totalNet = totalPend - totalBeban;
  html += `<tr class="lap-total">
    <td><b>TOTAL</b></td>
    <td style="text-align:right;color:var(--ok)"><b>${gdgWFmt(totalPend)}</b></td>
    <td style="text-align:right;color:var(--danger)"><b>${gdgWFmt(totalBeban)}</b></td>
    <td style="text-align:right"><b style="color:${totalNet>=0?'var(--ok)':'var(--danger)'}">${gdgWFmt(totalNet)}</b></td>
  </tr>`;
  document.getElementById('gdgw-harian-tbody').innerHTML = html;

  const netEl = document.getElementById('gdgw-net-value');
  netEl.textContent = gdgWFmt(totalNet);
  netEl.style.color = totalNet >= 0 ? 'var(--ok)' : 'var(--danger)';

  // Update minicard "Total Pendapatan" & "Jumlah Qty/Lsn" — dari data mingguan yang sama
  const totalQtyMinggu = pendapatanMingguList.reduce((s,p) => s + (Number(p.qty)||0), 0);
  const totalLsnMinggu = (totalQtyMinggu / 12).toFixed(1);
  document.getElementById('gdg-total-pendapatan').textContent = gdgWFmt(totalPend);
  document.getElementById('gdg-total-sub').textContent = totalQtyMinggu.toLocaleString('id-ID') + ' pcs dikerjakan · ' + pendapatanMingguList.length + ' catatan';
  document.getElementById('gdg-metric-qty').innerHTML = totalQtyMinggu.toLocaleString('id-ID') + ' pc<br>' + totalLsnMinggu + ' lsn';

  // Update minicard "Pengeluaran Mingguan (Cost)" di paling atas
  document.getElementById('gdg-cost-value').textContent = gdgWFmt(totalBeban);
  document.getElementById('gdg-cost-sub').textContent = gdgWFmtTgl(mingguMulai) + ' – ' + gdgWFmtTgl(mingguAkhir);
}

// ─── LOAD (semua data, tidak difilter minggu — Catatan Pendapatan & Kelola Produk) ──
async function gdgLoad() {
  const skuTbody  = document.getElementById('gdg-sku-tbody');
  const pendTbody = document.getElementById('gdg-pend-tbody');
  skuTbody.innerHTML  = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';
  pendTbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';

  try {
    const [skuAll, pendAll] = await Promise.all([
      dbGet('gadag_sku', '&order=nama.asc'),
      dbGet('gadag_pendapatan', '&order=tanggal.desc,id.desc'),
    ]);

    _gdgSkuList        = skuAll  || [];
    _gdgPendapatanList = pendAll || [];

    gdgRenderSku();
    gdgRenderPendapatan();
    if (_gdgHistWeekStart) gdgHistRenderWeek(); // refresh Riwayat juga kalau lagi/udah pernah kebuka
    const skuMetricEl = document.getElementById('gdg-metric-sku');
    if (skuMetricEl) skuMetricEl.textContent = _gdgSkuList.length;
  } catch(e) {
    skuTbody.innerHTML  = `<tr><td colspan="3" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
    pendTbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
  }
}

// ─── RENDER: SKU ──────────────────────────────────────────────
function gdgRenderSku() {
  const tbody = document.getElementById('gdg-sku-tbody');
  const countEl = document.getElementById('gdg-sku-count');
  if (countEl) countEl.textContent = _gdgSkuList.length + ' SKU';
  if (!_gdgSkuList.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic">Belum ada SKU. Tambah dulu.</td></tr>';
    return;
  }
  tbody.innerHTML = _gdgSkuList.map(s => {
    const safeNama = (s.nama||'').replace(/'/g,"\\'");
    return `<tr>
      <td><b>${s.nama||'—'}</b></td>
      <td style="text-align:right">${gdgFmt(s.ongkos_lusin)}</td>
      <td>
        <button class="btn btn-sm" onclick="gdgShowSkuModal('${s.id}','${safeNama}',${s.ongkos_lusin||0})" title="Edit"><i class="ti ti-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="gdgHapusSku('${s.id}')" style="margin-left:4px" title="Hapus"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

// ─── RENDER: CATATAN PENDAPATAN (cuma minggu berjalan, Minggu–Sabtu) ──
// Data minggu lalu TETAP ADA di database, cuma pindah tampilannya ke panel Riwayat.
function gdgRenderPendapatan() {
  const tbody   = document.getElementById('gdg-pend-tbody');
  const countEl = document.getElementById('gdg-pend-count');
  const wkStart = gdgWGetMonday(new Date());
  const wkEnd   = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6);
  const isoMulai = gdgWToISO(wkStart), isoAkhir = gdgWToISO(wkEnd);
  const listMingguIni = _gdgPendapatanList.filter(p => p.tanggal >= isoMulai && p.tanggal <= isoAkhir);

  if (countEl) countEl.textContent = listMingguIni.length + ' catatan';
  if (!listMingguIni.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada catatan minggu ini. Data minggu lalu ada di menu Riwayat.</td></tr>';
    return;
  }
  tbody.innerHTML = listMingguIni.map(p => {
    const hariLabel = p.hari || gdgHariName(p.tanggal) || '—';
    return `<tr>
      <td style="white-space:nowrap"><b>${hariLabel}</b></td>
      <td><b style="color:var(--accent)">${p.sku_nama||'—'}</b></td>
      <td>${p.warna||'—'}</td>
      <td style="text-align:right">${p.qty||0}</td>
      <td style="text-align:right"><b>${gdgFmt(p.total)}</b></td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="gdgHapusPendapatan('${p.id}')" title="Hapus"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

// ─── RIWAYAT (History) — browse semua catatan per minggu, sort by minggu ──
// Sumber data sama (_gdgPendapatanList, sudah di-load penuh oleh gdgLoad),
// cuma di-filter per rentang minggu yang dipilih di sini secara independen
// dari panel Catatan Pendapatan (yang selalu nampilin minggu berjalan).
let _gdgHistWeekStart = null;

function gdgHistPrevWeek() { _gdgHistWeekStart.setDate(_gdgHistWeekStart.getDate() - 7); gdgHistRenderWeek(); }
function gdgHistNextWeek() { _gdgHistWeekStart.setDate(_gdgHistWeekStart.getDate() + 7); gdgHistRenderWeek(); }
function gdgHistThisWeek() { _gdgHistWeekStart = gdgWGetMonday(new Date()); gdgHistRenderWeek(); }

function gdgHistRenderWeek() {
  if (!_gdgHistWeekStart) return;
  const wkEnd = new Date(_gdgHistWeekStart); wkEnd.setDate(_gdgHistWeekStart.getDate() + 6);
  document.getElementById('gdg-hist-week-label').textContent = gdgWFmtRange(_gdgHistWeekStart, wkEnd);

  const isoMulai = gdgWToISO(_gdgHistWeekStart), isoAkhir = gdgWToISO(wkEnd);
  const list  = _gdgPendapatanList.filter(p => p.tanggal >= isoMulai && p.tanggal <= isoAkhir);
  const tbody = document.getElementById('gdg-hist-tbody');
  const countEl = document.getElementById('gdg-hist-count');
  if (countEl) countEl.textContent = list.length + ' catatan';

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Ga ada catatan di minggu ini.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(p => {
    const hariLabel = p.hari || gdgHariName(p.tanggal) || '—';
    return `<tr>
      <td style="white-space:nowrap"><b>${hariLabel}</b></td>
      <td><b style="color:var(--accent)">${p.sku_nama||'—'}</b></td>
      <td>${p.warna||'—'}</td>
      <td style="text-align:right">${p.qty||0}</td>
      <td style="text-align:right"><b>${gdgFmt(p.total)}</b></td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="gdgHapusPendapatan('${p.id}')" title="Hapus"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

// ─── METRICS (TOTAL PENDAPATAN = utama) ───────────────────────
// (gdgUpdateMetrics lama dihapus — Total Pendapatan & Jumlah Qty/Lsn sekarang
// dihitung di gdgWRenderWeek() dari data mingguan, biar 1 sumber kebenaran)

// ─── FORMAT ───────────────────────────────────────────────────
function gdgFmt(n) {
  const num = Number(n)||0;
  return 'Rp' + Math.round(num).toLocaleString('id-ID');
}

function gdgFormatRibuan(el) {
  const raw = el.value.replace(/\D/g, '');
  el.value = raw ? Number(raw).toLocaleString('id-ID') : '';
}

// ─── MODAL: SKU ───────────────────────────────────────────────
function gdgShowSkuModal(id, nama, ongkos) {
  document.getElementById('gdg-sku-edit-id').value = id || '';
  document.getElementById('gdg-sku-nama').value     = nama || '';
  document.getElementById('gdg-sku-ongkos').value   = ongkos ? Number(ongkos).toLocaleString('id-ID') : '';
  document.getElementById('gdg-sku-modal-title').innerHTML = id
    ? '<i class="ti ti-edit"></i> Edit SKU'
    : '<i class="ti ti-plus"></i> Tambah SKU';
  document.getElementById('modal-gdg-sku').classList.add('open');
}

function gdgCloseSkuModal() {
  document.getElementById('modal-gdg-sku').classList.remove('open');
}

async function gdgSimpanSku() {
  const id     = document.getElementById('gdg-sku-edit-id').value.trim();
  const nama   = document.getElementById('gdg-sku-nama').value.trim();
  const ongkosStr = document.getElementById('gdg-sku-ongkos').value.replace(/\D/g,'');
  const ongkos = parseInt(ongkosStr, 10);

  if (!nama)                     { alert('Nama SKU wajib diisi.'); return; }
  if (!ongkos || ongkos <= 0)    { alert('Ongkos per lusin harus lebih dari 0.'); return; }

  const payload = { nama, ongkos_lusin: ongkos };

  try {
    if (id) await dbUpdate('gadag_sku', id, payload);
    else    await dbInsert('gadag_sku', payload);
    gdgCloseSkuModal();
    gdgLoad();
  } catch(e) {
    alert('Gagal simpan SKU: ' + e.message);
  }
}

function gdgHapusSku(id) {
  confirmDelete('Hapus SKU ini? Catatan pendapatan lama tidak akan berubah (data ongkos sudah tersimpan tersendiri).', async () => {
    try { await dbDelete('gadag_sku', id); gdgLoad(); }
    catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// ─── HARI (nama hari otomatis dari tanggal) ───────────────────
var _gdgHariNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
function gdgHariName(tanggalStr) {
  if (!tanggalStr) return '';
  var parts = tanggalStr.split('-').map(Number); // yyyy-mm-dd, hindari timezone shift
  var d = new Date(parts[0], parts[1]-1, parts[2]);
  return _gdgHariNames[d.getDay()] || '';
}
function gdgUpdateHari() {
  var tgl = document.getElementById('gdg-pend-tanggal').value;
  document.getElementById('gdg-pend-hari').value = gdgHariName(tgl);
}

// ─── MODAL: CATATAN PENDAPATAN ─────────────────────────────────
function gdgShowPendapatanModal() {
  document.getElementById('gdg-pend-edit-id').value = '';
  const now = new Date();
  const tglDefault = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  document.getElementById('gdg-pend-tanggal').value = tglDefault;
  document.getElementById('gdg-pend-hari').value = gdgHariName(tglDefault);
  document.getElementById('gdg-pend-warna').value = '';

  const sel = document.getElementById('gdg-pend-sku');
  sel.innerHTML = '<option value="">— pilih —</option>' + _gdgSkuList.map(s =>
    `<option value="${s.id}" data-ongkos="${s.ongkos_lusin||0}" data-nama="${(s.nama||'').replace(/"/g,'&quot;')}">${s.nama}</option>`
  ).join('');

  document.getElementById('gdg-pend-qty').value = '';
  document.getElementById('gdg-pend-preview').textContent = 'Rp0';

  if (!_gdgSkuList.length) {
    alert('Belum ada SKU. Tambah SKU dulu di bagian "Kelola Produk".');
    return;
  }
  document.getElementById('modal-gdg-pend').classList.add('open');
  gdgOpenPendSheet();
}

// ─── BOTTOM-SHEET: animasi masuk/keluar + drag-to-close + keyboard-safe (iOS) ──
function gdgOpenPendSheet() {
  const overlay = document.getElementById('modal-gdg-pend');
  const sheet   = document.getElementById('gdg-pend-sheet');
  if (!overlay || !sheet) return;
  sheet.style.transform = ''; // pastikan mulai dari posisi tertutup (translateY(100%) dari CSS)
  // reflow paksa biar posisi awal ke-render dulu sebelum kita animasiin ke posisi final
  void overlay.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('gdg-sheet-in');
  }));
  _gdgSheetSyncViewport();
  if (window.visualViewport && !overlay._gdgVVInited) {
    overlay._gdgVVInited = true;
    window.visualViewport.addEventListener('resize', _gdgSheetSyncViewport);
    window.visualViewport.addEventListener('scroll', _gdgSheetSyncViewport);
  }
  _gdgInitSheetDragToClose();
  _gdgInitSheetFocusScroll();
}

function _gdgSheetSyncViewport() {
  const overlay = document.getElementById('modal-gdg-pend');
  const sheet   = document.getElementById('gdg-pend-sheet');
  if (!overlay || !overlay.classList.contains('open')) return;
  if (!window.matchMedia('(max-width:900px)').matches) return; // cuma perlu di layout bottom-sheet (mobile)
  const vv = window.visualViewport;
  if (!vv) return;
  // Fixed overlay dihitung dari layout viewport, bukan visual viewport, jadi
  // pas keyboard buka, bagian bawahnya ketutup keyboard kalau ga di-sync manual.
  overlay.style.height    = vv.height + 'px';
  overlay.style.transform = 'translateY(' + vv.offsetTop + 'px)';
  // KRITIS: max-height CSS (88dvh) HANYA ngitung UI browser (address bar), BUKAN
  // keyboard iOS — jadi sheet-nya tetep "sepanjang" 88dvh walau keyboard udah makan
  // banyak ruang, dan field-field di bawah (Warna/SKU/Qty/Simpan) ke-dorong keluar
  // area yg keliatan / ketutup keyboard. Override max-height pake tinggi
  // visualViewport yang sebenarnya, biar body sheet yg scroll, bukan field-nya ilang.
  if (sheet) sheet.style.maxHeight = Math.max(240, vv.height - 12) + 'px';
}

// Field yg lagi difokus wajib keliatan di atas keyboard — kalau field itu ada
// di bagian bawah form (misal Qty/SKU), scroll otomatis biar ga ketutup.
function _gdgInitSheetFocusScroll() {
  const overlay = document.getElementById('modal-gdg-pend');
  if (!overlay || overlay._gdgFocusScrollInited) return;
  overlay._gdgFocusScrollInited = true;
  overlay.addEventListener('focusin', function(e) {
    const t = e.target;
    if (!(t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    // Delay: tunggu keyboard kebuka & _gdgSheetSyncViewport sempat nyesuain tinggi dulu,
    // baru scroll-into-view biar hitungannya pake ukuran final, bukan ukuran lama.
    setTimeout(function() {
      _gdgSheetSyncViewport();
      t.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 320);
  });
}

function _gdgInitSheetDragToClose() {
  const handle = document.getElementById('gdg-pend-sheet-handle');
  const sheet  = document.getElementById('gdg-pend-sheet');
  if (!handle || !sheet || handle._gdgDragInited) return;
  handle._gdgDragInited = true;
  var _startY = 0, _dragging = false, _dy = 0;
  handle.addEventListener('touchstart', function(e) {
    _startY   = e.touches[0].clientY;
    _dragging = true;
    sheet.style.transition = 'none'; // ikutin jari langsung, tanpa delay transisi
  }, { passive: true });
  handle.addEventListener('touchmove', function(e) {
    if (!_dragging) return;
    _dy = Math.max(0, e.touches[0].clientY - _startY); // cuma boleh narik ke bawah
    sheet.style.transform = 'translateY(' + _dy + 'px)';
  }, { passive: true });
  handle.addEventListener('touchend', function() {
    if (!_dragging) return;
    _dragging = false;
    sheet.style.transition = ''; // balikin transisi buat animasi snap-back / close
    if (_dy > 90) {
      gdgClosePendapatanModal(); // ditarik cukup jauh → tutup
    } else {
      sheet.style.transform = ''; // kurang jauh → snap balik ke posisi kebuka
    }
    _dy = 0;
  }, { passive: true });
}


function gdgClosePendapatanModal() {
  const overlay = document.getElementById('modal-gdg-pend');
  const sheet   = document.getElementById('gdg-pend-sheet');
  if (!overlay) return;
  if (sheet && window.matchMedia('(max-width:900px)').matches) {
    // animasiin sheet turun dulu, baru overlay-nya di-hide
    overlay.classList.remove('gdg-sheet-in');
    sheet.style.transform = '';
    setTimeout(function() {
      overlay.classList.remove('open');
      overlay.style.height    = '';
      overlay.style.transform = '';
      if (sheet) sheet.style.maxHeight = '';
    }, 280);
  } else {
    overlay.classList.remove('open');
  }
}

function gdgRecomputePreview() {
  const sel = document.getElementById('gdg-pend-sku');
  const opt = sel.options[sel.selectedIndex];
  const ongkos = opt ? Number(opt.getAttribute('data-ongkos'))||0 : 0;
  const qty    = parseInt((document.getElementById('gdg-pend-qty').value||'').replace(/\D/g,''), 10) || 0;
  const total  = Math.round(qty / 12 * ongkos);
  document.getElementById('gdg-pend-preview').textContent = gdgFmt(total);
  return total;
}

async function gdgSimpanPendapatan() {
  const tanggal = document.getElementById('gdg-pend-tanggal').value;
  const warna   = document.getElementById('gdg-pend-warna').value.trim();
  const sel     = document.getElementById('gdg-pend-sku');
  const opt     = sel.options[sel.selectedIndex];
  const skuId   = sel.value;
  const qtyStr  = (document.getElementById('gdg-pend-qty').value||'').replace(/\D/g,'');
  const qty     = parseInt(qtyStr, 10);

  if (!tanggal)          { alert('Pilih tanggal.'); return; }
  if (!skuId)            { alert('Pilih SKU.'); return; }
  if (!qty || qty <= 0)  { alert('Qty harus lebih dari 0.'); return; }

  const ongkos  = Number(opt.getAttribute('data-ongkos'))||0;
  const skuNama = opt.getAttribute('data-nama')||'';
  const total   = Math.round(qty / 12 * ongkos);
  const hari    = gdgHariName(tanggal);

  const payload = {
    tanggal,
    hari,
    warna,
    sku_id:       skuId,
    sku_nama:     skuNama,
    ongkos_lusin: ongkos,
    qty,
    total,
  };

  try {
    await dbInsert('gadag_pendapatan', payload);
    if (warna && typeof acRefresh === 'function') acRefresh('warna_gadag');
    gdgClosePendapatanModal();
    gdgLoad();
  } catch(e) {
    alert('Gagal simpan catatan: ' + e.message);
  }
}

function gdgHapusPendapatan(id) {
  confirmDelete('Hapus catatan pendapatan ini?', async () => {
    try { await dbDelete('gadag_pendapatan', id); gdgLoad(); }
    catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// ─── OVERLAY CLOSE HELPER ───────────────────────────────────────
function gdgOverlayClose(e, modalId, closeFn) {
  if (e.target.id === modalId) closeFn();
}

// ─── TOGGLE RINGKASAN (minicard+metrics) — tombol eksplisit, alternatif dari swipe ──
function gdgToggleSummary() {
  var summary = document.getElementById('gdg-top-summary');
  if (!summary) return;
  summary.classList.toggle('gdg-topbar-collapsed'); // ikon disinkronin otomatis via MutationObserver
}

// ─── COLLAPSE RINGKASAN (minicard+metrics) — swipe & scroll, pola sama dgn Kas & Jurnal ──
(function() {
  var _mq = window.matchMedia('(hover: none) and (pointer: coarse)');
  function _gdgInitSwipe() {
    if (!_mq.matches) return;
    var summary   = document.getElementById('gdg-top-summary');
    var minicards = document.querySelector('#gdg-panel-mingguan .gdg-minicards');
    var sticky    = document.getElementById('gdg-sticky-header');
    if (!summary || typeof initSwipeCollapse !== 'function') return;
    if (summary)   initSwipeCollapse(summary,   summary, 50, 'gdg-topbar-collapsed');
    if (minicards) initSwipeCollapse(minicards, summary, 50, 'gdg-topbar-collapsed');
    if (sticky)    initSwipeCollapse(sticky,    summary, 50, 'gdg-topbar-collapsed');
  }
  function _gdgInitDoubleSwipeExpand() {
    var area    = document.getElementById('gdgw-data-area');
    var summary = document.getElementById('gdg-top-summary');
    if (!area || !summary || area._gdgDblSwipeInited) return;
    area._gdgDblSwipeInited = true;
    var THRESHOLD = 35;   // px minimal per swipe biar keitung gesture, bukan jitter
    var MIN_GAP   = 120;  // ms — dua swipe ga boleh instan/nyambung (dianggap 1 gesture panjang)
    var MAX_GAP   = 800;  // ms — tapi juga ga boleh kelamaan jeda antar swipe 1 & 2
    var _startY = 0, _startX = 0, _tracking = false, _lastSwipeDownAt = 0;

    area.addEventListener('touchstart', function(e) {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
      _startY   = e.touches[0].clientY;
      _startX   = e.touches[0].clientX;
      _tracking = true;
    }, { passive: true });

    area.addEventListener('touchend', function(e) {
      if (!_tracking) return;
      _tracking = false;
      if (_gdgView !== 'mingguan') return;
      if (!summary.classList.contains('gdg-topbar-collapsed')) return; // cuma perlu kalo lagi ke-collapse
      var dy = e.changedTouches[0].clientY - _startY;
      var dx = e.changedTouches[0].clientX - _startX;
      if (Math.abs(dx) > Math.abs(dy)) return; // bukan gesture vertikal
      if (dy < THRESHOLD) return;              // bukan swipe ke bawah yg cukup jauh

      var now = Date.now();
      var gap = now - _lastSwipeDownAt;
      if (gap >= MIN_GAP && gap <= MAX_GAP) {
        // 2x swipe-turun berdekatan (ga kecepetan, ga kelamaan) → turunin ringkasan
        summary.classList.remove('gdg-topbar-collapsed');
        _lastSwipeDownAt = 0;
      } else {
        _lastSwipeDownAt = now;
      }
    }, { passive: true });
  }
  function _gdgInitScrollCollapse() {
    var content = document.querySelector('.content');
    var summary = document.getElementById('gdg-top-summary');
    if (!content || !summary || content._gdgCollapseInited) return;
    content._gdgCollapseInited = true;
    var _lastY         = 0;
    var _lastChangeAt  = 0;
    // iOS Safari: scrollTop suka "getar" (naik-turun dikit) pas momentum-scroll
    // atau pas address bar collapse/expand — beda sama Android yg monotonic.
    // Tanpa filter ini, getaran kecil ke-baca sebagai "swipe down" dan bikin
    // card balik ke-expand lagi padahal user masih scroll ke atas ("mental").
    var NOISE_PX  = 6;    // delta di bawah ini dianggap noise, diabaikan
    var COOLDOWN  = 220;  // ms — state ga boleh flip-flop lebih cepat dari ini
    content.addEventListener('scroll', function() {
      if (_gdgView !== 'mingguan') return; // cuma aktif pas lagi di panel Ringkasan
      var y  = content.scrollTop;
      var dy = y - _lastY;
      _lastY = y;
      if (Math.abs(dy) < NOISE_PX) return; // micro-jitter iOS, skip

      var now = Date.now();
      if (now - _lastChangeAt < COOLDOWN) return; // masih dalam cooldown, skip

      if (y > 40 && dy > 0) {
        if (!summary.classList.contains('gdg-topbar-collapsed')) {
          summary.classList.add('gdg-topbar-collapsed');
          _lastChangeAt = now;
        }
      } else if (dy < 0 || y <= 40) {
        if (summary.classList.contains('gdg-topbar-collapsed')) {
          summary.classList.remove('gdg-topbar-collapsed');
          _lastChangeAt = now;
        }
      }
    }, { passive: true });
  }
  function _gdgSyncToggleIcon() {
    var summary = document.getElementById('gdg-top-summary');
    var icon    = document.getElementById('gdg-summary-toggle-icon');
    if (!summary || !icon) return;
    var collapsed = summary.classList.contains('gdg-topbar-collapsed');
    icon.className = collapsed ? 'ti ti-chevron-down' : 'ti ti-chevron-up';
  }
  function _gdgInitToggleSync() {
    var summary = document.getElementById('gdg-top-summary');
    if (!summary || summary._gdgObserverInited) return;
    summary._gdgObserverInited = true;
    // Observer biar ikon toggle tetep sinkron walau collapse-nya dipicu
    // lewat swipe atau scroll, bukan cuma lewat tombol.
    new MutationObserver(_gdgSyncToggleIcon).observe(summary, { attributes: true, attributeFilter: ['class'] });
  }
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'gadag') return;
    setTimeout(function() {
      var el = document.getElementById('gdg-top-summary');
      if (el) el.classList.remove('gdg-topbar-collapsed');
      _gdgInitSwipe();
      _gdgInitScrollCollapse();
      _gdgInitDoubleSwipeExpand();
      _gdgInitToggleSync();
      _gdgSyncToggleIcon();
    }, 100);
  });
})();

// ─── AUTO-INIT ────────────────────────────────────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page === 'gadag') setTimeout(gdgInit, 50);
});
