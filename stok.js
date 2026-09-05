// ─── STOK.JS v3 — basis dari produk, keluar dari jurnal ───────

// ─── STATUS BADGE — 5-level velocity (konsep China: cash jangan mandeg di stok) ───
// Fast   : sales 7hr > 0                          → restock agresif
// Slow   : sales 7hr = 0, sales 30hr > 0          → monitor, promo dulu
// Dead   : sales 30hr = 0, sales 90hr > 0         → BLOCK restock, clearance
// Zombie : sales 90hr = 0                         → discontinue, jual rugi
// Habis  : sisa <= 0                              → urgent jika Fast, ignore jika Dead/Zombie
function _stokVelocity(sales7, sales30, sales90) {
  if ((sales7  || 0) > 0) return 'fast';
  if ((sales30 || 0) > 0) return 'slow';
  if ((sales90 || 0) > 0) return 'dead';
  return 'zombie';
}

// Ranking buat sort kolom Status: Fast(4) → Slow(3) → Dead(2) → Zombie(1) → Habis(0)
// (angka gede duluan pas dir='desc', sesuai urutan tab status yg udah ada).
// Habis (sisa<=0) nge-override velocity, sama kayak logika tab filter.
function _stokStatusRank(r) {
  if ((r.sisa || 0) <= 0) return 0;
  var vel = _stokVelocity(r.sales7, r.sales30, r.sales90);
  if (vel === 'fast')   return 4;
  if (vel === 'slow')   return 3;
  if (vel === 'dead')   return 2;
  return 1; // zombie
}

// statusBadge: parameter ke-2 adalah velocity string (bukan kat)
// dipanggil dengan: statusBadge(sisa, vel, sales7, sales30, sales90)
function statusBadge(sisa, vel, sales7, sales30, sales90) {
  // Jika vel belum dihitung (legacy call), hitung dari sales
  if (!vel || vel === 'aktif' || vel === 'discontinued' || vel === 'seasonal' || vel === 'clearance') {
    vel = _stokVelocity(sales7, sales30, sales90);
  }
  if (sisa <= 0) {
    if (vel === 'fast')   return '<span style="font-size:10px;font-weight:700;color:var(--danger);padding:2px 6px;border:1.5px solid var(--danger);border-radius:2px">Habis 🔥</span>';
    if (vel === 'slow')   return '<span style="font-size:10px;font-weight:700;color:var(--danger);padding:2px 6px;border:1.5px solid var(--danger);border-radius:2px">Habis</span>';
    return '<span style="font-size:10px;font-weight:700;color:var(--ink3);padding:2px 6px;border:1.5px solid var(--ink3);border-radius:2px;opacity:0.6">Habis</span>';
  }
  if (vel === 'fast')   return '<span style="font-size:10px;font-weight:700;color:#00c896;padding:2px 6px;border:1.5px solid #00c896;border-radius:2px">Fast</span>';
  if (vel === 'slow')   return '<span style="font-size:10px;font-weight:700;color:#c8a000;padding:2px 6px;border:1.5px solid #c8a000;border-radius:2px">Slow</span>';
  if (vel === 'dead')   return '<span style="font-size:10px;font-weight:700;color:#e05c00;padding:2px 6px;border:1.5px solid #e05c00;border-radius:2px">Dead</span>';
  return '<span style="font-size:10px;font-weight:700;color:var(--ink3);padding:2px 6px;border:1.5px solid var(--ink3);border-radius:2px">Zombie</span>';
}

// page-stok flex column sudah diatur via CSS #page-stok
document.getElementById('page-stok').innerHTML = `
  <style>
    /* ── PICKER BOTTOM SHEET (ala BRImo) — SKU Induk & SKU Variasi ──
       Konsisten sama pola picker akun di Kas & Jurnal / SKU di Tambah
       Penjualan: sheet naik dari bawah, search nempel di atas, list item
       terang (bukan dropdown melayang gelap kayak sebelumnya). ── */
    #stok-sku-sheet-overlay {
      display: none; position: fixed; inset: 0; z-index: 598;
      background: rgba(0,0,0,.55);
    }
    #stok-sku-sheet-overlay.open { display: block; }
    #stok-sku-sheet {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 599;
      background: var(--cream2); border-radius: 20px 20px 0 0;
      transform: translateY(100%);
      transition: transform 0.28s cubic-bezier(.4,0,.2,1);
      padding-bottom: env(safe-area-inset-bottom, 16px);
      max-height: 85vh; display: none; flex-direction: column; overflow: hidden;
    }
    #stok-sku-sheet.open { display: flex; transform: translateY(0); }
    #stok-sku-sheet-handle {
      width: 40px; height: 4px; background: var(--ovl-0_18); border-radius: 2px;
      margin: 12px auto 4px; flex: none;
    }
    #stok-sku-sheet-title {
      text-align: center; font-size: 16px; font-weight: 700; color: var(--ink);
      padding: 8px 16px 12px; letter-spacing: -0.2px; flex: none;
    }
    #stok-sku-sheet-search-wrap { flex: none; padding: 0 16px 10px; }
    #stok-sku-sheet-search {
      width: 100%; box-sizing: border-box; background: var(--ovl-0_06);
      border: 1px solid var(--ovl-0_12); border-radius: 10px; padding: 11px 14px;
      font-size: 15px; font-family: var(--f); color: var(--ink); outline: none;
      -webkit-appearance: none;
    }
    #stok-sku-sheet-search::placeholder { color: var(--ink3); }
    #stok-sku-sheet-search:focus { border-color: var(--ovl-0_25); background: var(--ovl-0_09); }
    #stok-sku-sheet-list {
      flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain; padding: 4px 10px 12px;
    }
    #stok-sku-sheet-list .jp-sheet-item {
      font-size: 15px; padding: 12px 10px; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      color: var(--ink2);
    }
    #stok-sku-sheet-list .jp-sheet-item:active { background: var(--ovl-0_08); color: var(--ink); }
    #stok-sku-sheet-list .jp-sheet-empty {
      padding: 28px 12px; text-align: center; color: var(--ink3);
      font-size: 13px; font-style: italic;
    }
    @media (min-width: 768px) {
      #stok-sku-sheet {
        left: 50%; right: auto; bottom: 50%; transform: translate(-50%, 50%) scale(.96);
        width: 100%; max-width: 420px; border-radius: 16px; max-height: 70vh; opacity: 0;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      #stok-sku-sheet.open { transform: translate(-50%, 50%) scale(1); opacity: 1; }
    }
  </style>
  <!-- MINI CARD (SKU/PC/Nilai Stock) — mobile only, dipindah ke atas (sebelumnya nempel
       di dalam .card bareng tabel). Elemen ini mobile-only jadi aman di posisi manapun
       buat desktop (selalu disembunyikan lewat CSS, gak ganggu layout desktop). -->
  <div id="stok-summary-mobile-bar" class="stok-mobile-only" style="gap:8px;padding:12px 16px 0">
    <div class="metric" style="flex:1 1 0;min-width:0;padding:8px 10px">
      <div class="m-label">SKU</div>
      <div class="m-value" id="stok-summary-mobile-sku" style="font-size:20px">—</div>
    </div>
    <div class="metric" style="flex:1 1 0;min-width:0;padding:8px 10px">
      <div class="m-label">PC</div>
      <div class="m-value" id="stok-summary-mobile-pc" style="font-size:20px">—</div>
    </div>
    <div class="metric" style="flex:2 1 0;min-width:0;padding:8px 10px">
      <div class="m-label">Nilai Stock</div>
      <div class="m-value" id="stok-summary-mobile-nilai" style="font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">—</div>
    </div>
  </div>

  <!-- TAB STATUS — mobile only. Chip scroll + [X reset] nempel di ujung kanan
       (gak ikut ke-scroll), gaya Shopee. -->
  <div id="stok-status-tabs-wrap" class="stok-mobile-only" style="align-items:center;gap:6px;padding:10px 16px 0">
    <div id="stok-status-tabs-scroll" style="display:flex;overflow-x:auto;-webkit-overflow-scrolling:touch;flex:1;min-width:0">
      <div id="stok-status-tabs-mobile" style="display:flex;gap:6px;flex-wrap:nowrap;padding-right:4px"></div>
    </div>
    <button id="btn-stok-reset-mobile" class="stok-chip-icon-btn" onclick="stokResetAllFilter()" title="Reset semua filter"
      style="opacity:.35;pointer-events:none">
      <i class="ti ti-x"></i>
    </button>
  </div>

  <!-- TAB SUPPLIER — mobile only. Chip scroll + [Summary][Filter] nempel di ujung
       kanan (gak ikut ke-scroll). "Semua" jadi chip pertama, sekalian reset Supplier. -->
  <div id="stok-supplier-tabs-wrap" class="stok-mobile-only" style="align-items:center;gap:6px;padding:8px 16px 4px">
    <div id="stok-supplier-tabs-scroll" style="display:flex;overflow-x:auto;-webkit-overflow-scrolling:touch;flex:1;min-width:0">
      <div id="stok-supplier-tabs" style="display:flex;gap:6px;flex-wrap:nowrap;padding-right:4px"></div>
    </div>
    <button id="btn-stok-summary-mobile" class="stok-chip-icon-btn" onclick="stokToggleSummary()" title="Summary">
      <i class="ti ti-chart-bar"></i>
    </button>
    <button id="btn-filter-all-mobile" class="stok-chip-icon-btn" onclick="stokToggleFilterAll()" title="Filter SKU Induk">
      <i class="ti ti-filter"></i>
    </button>
  </div>

  <div id="stok-filter-bar" class="stok-desktop-only" style="align-items:center;gap:8px;flex-wrap:wrap">
    <!-- KIRI: Filter — nested submenu (desktop: Supplier+SKU Induk+Status) -->
    <div id="stok-filter-wrap" style="position:relative">
      <button class="btn btn-sm" id="btn-filter-all" onclick="stokToggleFilterAll()" style="min-width:90px;width:100%;text-align:left;padding-right:24px">
        <span id="btn-filter-all-desktop-label"><i class="ti ti-adjustments-horizontal"></i> <span id="lbl-filter-all">Filter</span></span>
        <i class="ti ti-chevron-down" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:11px"></i>
      </button>

      <!-- RESET FILTER (desktop) — badge mengambang di pojok tombol Filter, cuma nongol saat ada filter aktif -->
      <button id="btn-stok-reset" onclick="stokResetAllFilter()" title="Reset Filter"
        style="display:none;position:absolute;top:-6px;right:-6px;z-index:2;
        width:20px;height:20px;border-radius:50%;padding:0;min-height:0;
        background:var(--danger);color:#fff;border:2px solid var(--cream);
        align-items:center;justify-content:center;font-size:11px;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,.3)">
        <i class="ti ti-x" style="font-size:11px"></i>

      </button>

      <div id="dd-filter-all" style="display:none;position:fixed;z-index:9999;
        background:var(--cream);border:2px solid var(--ink);min-width:180px;
        box-shadow:4px 4px 0 var(--ink4)">

        <!-- Menu: Supplier -->
        <div id="mi-boss" onclick="stokOpenSub('boss',event)"
          style="padding:8px 12px;cursor:pointer;font-size:13px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed var(--ink4)">
          <span><i class="ti ti-user" style="font-size:12px;margin-right:6px"></i>Supplier <span id="badge-boss" style="font-size:10px;color:var(--ink3)"></span></span>
          <i class="ti ti-chevron-right" style="font-size:11px"></i>
        </div>

        <!-- Menu: SKU Induk -->
        <div id="mi-katalog" onclick="stokOpenSub('katalog',event)"
          style="padding:8px 12px;cursor:pointer;font-size:13px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed var(--ink4)">
          <span><i class="ti ti-tag" style="font-size:12px;margin-right:6px"></i>SKU Induk <span id="badge-katalog" style="font-size:10px;color:var(--ink3)"></span></span>
          <i class="ti ti-chevron-right" style="font-size:11px"></i>
        </div>

        <!-- Menu: Status -->
        <div id="mi-status" onclick="stokOpenSub('status',event)"
          style="padding:8px 12px;cursor:pointer;font-size:13px;display:flex;justify-content:space-between;align-items:center">
          <span><i class="ti ti-activity" style="font-size:12px;margin-right:6px"></i>Status <span id="badge-status" style="font-size:10px;color:var(--ink3)"></span></span>
          <i class="ti ti-chevron-right" style="font-size:11px"></i>
        </div>

        <!-- Reset dipindah ke luar dropdown -->
      </div>

      <!-- Submenu — di luar dd-filter-all, sejajar dengannya (desktop) -->
      <div id="dd-filter-boss" style="display:none;position:fixed;z-index:9999;
        background:var(--cream);border:2px solid var(--ink);min-width:170px;max-height:260px;overflow-y:auto;
        box-shadow:4px 4px 0 var(--ink4)"></div>
      <div id="dd-filter-katalog" style="display:none;position:fixed;z-index:9999;
        background:var(--cream);border:2px solid var(--ink);min-width:190px;max-height:260px;overflow-y:auto;
        box-shadow:4px 4px 0 var(--ink4)"></div>
      <div id="dd-filter-status" style="display:none;position:fixed;z-index:9999;
        background:var(--cream);border:2px solid var(--ink);min-width:170px;max-height:260px;overflow-y:auto;
        box-shadow:4px 4px 0 var(--ink4)"></div>

    </div>

    <!-- Tombol Summary -->
    <button class="btn btn-sm" id="btn-stok-summary" onclick="stokToggleSummary()" style="border-color:var(--ink3);color:var(--ink);justify-content:center">
      <i class="ti ti-chart-bar"></i> Summary
    </button>

    <!-- KANAN: Paste Massal + Tambah -->
    <div id="stok-actions-desktop" style="margin-left:auto;display:flex;gap:8px;align-items:center">
      <button class="btn btn-sm" onclick="showPasteStok()"><i class="ti ti-clipboard"></i> Paste Massal</button>

      <button class="btn btn-sm btn-primary" onclick="showTambahStok()"><i class="ti ti-plus"></i> Tambah</button>
    </div>
  </div>

  <!-- FILTER BOTTOM SHEET (mobile) — langsung daftar SKU Induk, tanpa root/drill-in lagi
       (Status & Supplier sekarang chip scroll sendiri di atas). Tap opsi = langsung
       terapkan & tutup. Reuse gaya visual kas-brimo-sheet biar konsisten. -->
  <div id="stok-filter-sheet-overlay" class="stok-filter-sheet-overlay" onclick="stokFilterSheetClose()"></div>
  <div id="stok-filter-sheet" class="kas-brimo-sheet">
    <div class="kas-brimo-handle"></div>
    <div class="kas-brimo-back-row">
      <div class="stok-filter-sheet-cat-title">SKU Induk</div>
      <button class="kas-brimo-close-x" onclick="stokFilterSheetClose()">&#10005;</button>
    </div>
    <div class="stok-filter-sheet-cat-list" id="stok-filter-sheet-cat-list"></div>
  </div>

  <!-- PANEL SUMMARY STOK -->
  <div id="stok-summary-panel" style="display:none;margin-bottom:14px;padding:14px 16px;border:2px solid var(--ink);background:var(--cream2)">
    <div style="font-weight:700;font-size:13px;margin-bottom:10px;display:flex;justify-content:space-between">
      <span><i class="ti ti-chart-bar"></i> Summary Stok</span>
      <span id="stok-summary-cash-locked" style="color:var(--danger);font-size:12px"></span>
    </div>
    <div style="display:block" id="stok-summary-cards"></div>
    <div id="stok-summary-rekomendasi" style="margin-top:14px"></div>
  </div>

  <!-- MODAL PASTE MASSAL STOK -->
  <div class="modal-overlay" id="modal-paste-stok">
    <div class="modal" style="max-width:480px">
      <div class="modal-title"><i class="ti ti-clipboard"></i> Paste Massal Stok</div>
      <!-- Toggle mode -->
      <div style="display:flex;gap:0;margin-bottom:12px;border:2px solid var(--ink);border-radius:4px;overflow:hidden">
        <button id="btn-mode-tambah" onclick="stokSetPasteMode('tambah')"
          style="flex:1;padding:7px 10px;font-size:12px;font-weight:700;border:none;cursor:pointer;transition:background 0.15s;background:var(--ink);color:var(--cream)">
          ＋ Tambah Masuk
        </button>
        <button id="btn-mode-sesuai" onclick="stokSetPasteMode('penyesuaian')"
          style="flex:1;padding:7px 10px;font-size:12px;font-weight:700;border:none;cursor:pointer;transition:background 0.15s;background:var(--cream);color:var(--ink)">
          ⚖ Penyesuaian Stok
        </button>
      </div>
      <div id="paste-mode-desc" style="font-size:12px;color:var(--ink3);margin-bottom:10px;line-height:1.6">
        Copy dari Google Sheet / Excel lalu paste di bawah.<br>
        Urutan kolom: <b>SKU Variasi → Qty (akan DITAMBAHKAN ke stok yang ada)</b>
      </div>
      <textarea id="paste-area-stok"
        style="width:100%;height:160px;font-family:var(--f);font-size:13px;padding:8px;border:2px solid var(--ink);background:var(--cream);resize:vertical;outline:none"
        placeholder="Paste di sini..."></textarea>
      <div id="paste-stok-preview" style="margin-top:10px;display:none">
        <div id="paste-stok-scope-notif" style="display:none;background:rgba(255,180,0,0.1);border:1.5px solid #c8a000;border-radius:6px;padding:8px 12px;font-size:12px;color:#c8a000;margin-bottom:8px;line-height:1.6"></div>
        <div style="font-size:12px;font-weight:700;color:var(--ink3);margin-bottom:6px" id="paste-stok-count"></div>
        <div class="tbl-wrap" style="max-height:140px;overflow-y:auto">
          <table class="tbl"><thead><tr><th>SKU Variasi</th><th id="paste-stok-col-header">Stok Masuk</th></tr></thead>
          <tbody id="paste-stok-tbody"></tbody></table>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-sm" onclick="parsePasteStok()"><i class="ti ti-eye"></i> Preview</button>
        <button class="btn btn-primary btn-sm" id="btn-simpan-paste-stok" onclick="simpanPasteStok()" style="display:none"><i class="ti ti-device-floppy"></i> Simpan Semua</button>
        <button class="btn btn-sm" onclick="closeModal('modal-paste-stok')"><i class="ti ti-x"></i> Batal</button>
      </div>
    </div>
  </div>

  <!-- FORM TAMBAH/EDIT STOK MASUK — konsep modal JP -->
  <div class="modal-overlay" id="modal-stok-masuk" onclick="stokOverlayClose(event)">
    <div class="modal" style="max-width:480px;width:100%;padding:16px;max-height:92vh;overflow-y:auto;overscroll-behavior:none;touch-action:pan-y;box-sizing:border-box">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
        <div class="modal-title" id="stok-form-title"
             style="margin:0;border:none;padding:0;font-size:18px">
          <i class="ti ti-plus"></i> Tambah Stok Masuk
        </div>
        <button onclick="cancelStokForm()"
          style="background:none;border:none;font-size:22px;cursor:pointer;
                 color:var(--ink3);line-height:1;padding:4px 8px;">&#10005;</button>
      </div>

      <input type="hidden" id="inp-id">

      <!-- SKU Induk — picker BRImo (naik dari bawah, ada kolom cari) -->
      <div class="form-group" style="margin-bottom:12px;position:relative">
        <label>SKU Induk (Katalog)</label>
        <input type="hidden" id="inp-sku-induk">
        <div class="kas-akun-picker" id="stok-picker-induk" onclick="stokSkuSheetOpen('induk')">
          <span id="stok-picker-induk-label" style="color:var(--ink3)">— Pilih SKU Induk —</span>
          <span style="margin-left:auto;color:var(--ink3);font-size:10px">▾</span>
        </div>
        <!-- Fallback: SKU belum ada di master produk, ketik manual (mis. edit stok
             lama yang katalognya udah gak ketemu di master). -->
        <div id="stok-sku-induk-manual-wrap" style="display:none;margin-top:6px">
          <input type="text" id="stok-sku-induk-manual" placeholder="Ketik SKU manual..."
            autocomplete="off" oninput="stokOnManualIndukInput()"
            style="font-family:var(--f);font-size:14px;width:100%;box-sizing:border-box;
                   padding:6px 10px;border:2px solid var(--ink);background:var(--cream)">
        </div>
      </div>

      <!-- SKU Variasi — picker custom seperti JP -->
      <div class="form-group" style="margin-bottom:12px">
        <label>SKU Variasi</label>
        <select id="inp-sku" style="display:none"></select>
        <div class="kas-akun-picker" id="stok-picker-variasi" onclick="stokSkuSheetOpen('variasi')">
          <span id="stok-picker-variasi-label" style="color:var(--ink3)">— Pilih Variasi —</span>
          <span style="margin-left:auto;color:var(--ink3);font-size:10px">&#9662;</span>
        </div>
      </div>

      <!-- ── PICKER BOTTOM SHEET (ala BRImo): SKU Induk & SKU Variasi ──
           1 sheet dipakai gantian lewat _stokSkuSheetMode ('induk'/'variasi'),
           konsisten sama picker akun di Kas & Jurnal / SKU di Tambah Penjualan. -->
      <div id="stok-sku-sheet-overlay" onclick="if(event.target===this) stokSkuSheetClose()"></div>
      <div id="stok-sku-sheet">
        <div id="stok-sku-sheet-handle"></div>
        <div id="stok-sku-sheet-title">Pilih SKU</div>
        <div id="stok-sku-sheet-search-wrap">
          <input type="text" id="stok-sku-sheet-search" placeholder="Cari..." autocomplete="off"
            autocorrect="off" autocapitalize="none" spellcheck="false"
            oninput="stokSkuSheetFilter(this.value)">
        </div>
        <div id="stok-sku-sheet-list"></div>
      </div>

      <!-- Stok Masuk / Set Sisa -->
      <div id="stok-info-sisa" style="display:none;margin-bottom:10px;padding:8px 12px;background:var(--cream2);border:1.5px dashed var(--ink3);font-size:13px">
        Sisa saat ini: <b id="stok-info-sisa-val" style="color:var(--ok)">0</b> pcs
        &nbsp;·&nbsp; Sales (keluar): <b id="stok-info-keluar-val" style="color:var(--ink3)">0</b> pcs
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label id="lbl-inp-masuk">Stok Masuk (Qty)</label>
        <input type="number" id="inp-masuk" placeholder="0" min="0"
          style="font-size:20px;font-weight:700;width:100%;box-sizing:border-box">
      </div>

      <!-- Tombol Aksi -->
      <div style="border-top:1.5px dashed var(--ink3);padding-top:12px;display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end">
        <button class="btn btn-sm" onclick="cancelStokForm()" style="flex:1 1 100px;min-width:80px">
          <i class="ti ti-x"></i> Batal
        </button>
        <button class="btn btn-primary btn-sm" onclick="simpanStok()"
          style="flex:2 1 140px;font-weight:700;font-size:14px;padding:8px 16px">
          <i class="ti ti-device-floppy"></i> SIMPAN
        </button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title" id="stok-card-title" style="display:flex;align-items:center;gap:8px;flex-shrink:0">
      <i class="ti ti-package"></i> Semua SKU
      <span id="stok-summary" style="font-size:12px;color:var(--ink3);font-weight:400;margin-left:auto"></span>
    </div>

    <!-- TAB STATUS — desktop: baris tombol -->
    <div id="stok-status-tabs" style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      <button class="stok-tab-btn stok-tab-active" data-tab="all"    onclick="stokTabStatus('all')">Semua</button>
      <button class="stok-tab-btn" data-tab="fast"   onclick="stokTabStatus('fast')">🟢 Fast</button>
      <button class="stok-tab-btn" data-tab="slow"   onclick="stokTabStatus('slow')">🟡 Slow</button>
      <button class="stok-tab-btn" data-tab="dead"   onclick="stokTabStatus('dead')">🔴 Dead</button>
      <button class="stok-tab-btn" data-tab="zombie" onclick="stokTabStatus('zombie')">⚫ Zombie</button>
      <button class="stok-tab-btn" data-tab="habis"  onclick="stokTabStatus('habis')">💀 Habis</button>
    </div>

    <div id="stok-tbl-wrap"><table class="tbl">
      <thead><tr>
        <th>Katalog</th><th>SKU Variasi</th>
        <th onclick="stokToggleSort('sisa')" style="cursor:pointer;user-select:none;white-space:nowrap">Sisa <span id="sort-icon-sisa">⇅</span></th>
        <th onclick="stokToggleSort('status')" style="cursor:pointer;user-select:none;white-space:nowrap">Status <span id="sort-icon-status">⇅</span></th>
        <th>Aksi</th>
        <th onclick="stokToggleSort('sales')" style="cursor:pointer;user-select:none;white-space:nowrap">Sales 7hr <span id="sort-icon-sales">⇅</span></th>
        <th onclick="stokToggleSort('sales_total')" style="cursor:pointer;user-select:none;white-space:nowrap">Sales Total <span id="sort-icon-sales_total">⇅</span></th>
        <th>HPP</th><th onclick="stokToggleSort('nilai')" style="cursor:pointer;user-select:none;white-space:nowrap">Nilai Stok <span id="sort-icon-nilai">⇅</span></th>
        <th>Boss</th>
      </tr></thead>
      <tbody id="stok-tbody">
        <tr><td colspan="10" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
    </div>
  </div>
`;

setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-stok')); }, 80);

// Inject CSS tab stok status
(function() {
  if (document.getElementById('stok-tab-style')) return;
  var s = document.createElement('style');
  s.id = 'stok-tab-style';
  s.textContent = '.stok-tab-btn{padding:4px 12px;font-size:12px;font-weight:600;border:1.5px solid var(--ink3);background:transparent;color:var(--ink3);cursor:pointer;border-radius:3px;font-family:var(--f);transition:all .15s}.stok-tab-btn:hover{border-color:var(--ink);color:var(--ink)}.stok-tab-btn.stok-tab-active{border-color:var(--ink);background:var(--ink);color:var(--cream)}';
  document.head.appendChild(s);
})();




// ─── STATE ────────────────────────────────────────────────────
let _stokAllData  = [];   // hasil merge produk + stok + jurnal
let _stokMasukMap = {};   // sku -> {id, qty}  (dari tabel stok)
let _produkForStok = [];  // dari tabel produk
let _stokSelectedSku = ''; // SKU variasi yang dipilih dari picker — reliable vs hidden select
let _stokEditMode    = false; // true = edit existing record (replace), false = tambah baru (akumulasi)

// ─── LOAD UTAMA ───────────────────────────────────────────────
async function loadStok() {
  const tbody = document.getElementById('stok-tbody');
  tbody.innerHTML = '<tr><td colspan="10" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>';

  try {
    // 1. Ambil semua produk (basis SKU)
    const produkData = await dbGet('produk', '&order=katalog.asc,sku_variasi.asc');
    _produkForStok = Array.isArray(produkData) ? produkData : [];

    // 2. Ambil semua stok masuk manual
    const stokData = await dbGet('stok');
    _stokMasukMap = {};
    if (Array.isArray(stokData)) {
      stokData.forEach(s => {
        const key = (s.sku_variasi || '').toUpperCase();
        _stokMasukMap[key] = { id: s.id, qty: s.stok_masuk || 0 };
      });
    }

    // 3. Ambil sum keluar dari jurnal_penjualan per SKU (all-time)
    const jurnalData = await dbGet('jurnal_penjualan', '&select=sku,qty&or=(order_status.neq.CANCELLED,order_status.is.null)');
    const keluarMap = {};
    if (Array.isArray(jurnalData)) {
      jurnalData.forEach(j => {
        const key = (j.sku || '').toUpperCase();
        keluarMap[key] = (keluarMap[key] || 0) + (j.qty || 0);
      });
    }

    // 3b. Ambil sales 7 hari terakhir per SKU (untuk status Fast/Slow/Dead)
    const tgl7 = new Date(); tgl7.setDate(tgl7.getDate() - 7);
    const tgl30 = new Date(); tgl30.setDate(tgl30.getDate() - 30);
    const tgl90 = new Date(); tgl90.setDate(tgl90.getDate() - 90);
    const tgl7Str  = tgl7.toISOString().slice(0, 10);
    const tgl30Str = tgl30.toISOString().slice(0, 10);
    const tgl90Str = tgl90.toISOString().slice(0, 10);

    const [jurnal7Data, jurnal30Data, jurnal90Data] = await Promise.all([
      dbGet('jurnal_penjualan', '&select=sku,qty&or=(order_status.neq.CANCELLED,order_status.is.null)&tanggal=gte.' + tgl7Str),
      dbGet('jurnal_penjualan', '&select=sku,qty&or=(order_status.neq.CANCELLED,order_status.is.null)&tanggal=gte.' + tgl30Str),
      dbGet('jurnal_penjualan', '&select=sku,qty&or=(order_status.neq.CANCELLED,order_status.is.null)&tanggal=gte.' + tgl90Str),
    ]);

    const sales7Map = {}, sales30Map = {}, sales90Map = {};
    const _buildMap = (data, map) => {
      if (Array.isArray(data)) data.forEach(j => {
        const key = (j.sku || '').toUpperCase();
        map[key] = (map[key] || 0) + (j.qty || 0);
      });
    };
    _buildMap(jurnal7Data,  sales7Map);
    _buildMap(jurnal30Data, sales30Map);
    _buildMap(jurnal90Data, sales90Map);

    // 4. Merge: semua SKU dari produk sebagai basis
    _stokAllData = _produkForStok.map(p => {
      const skuKey = (p.sku_variasi || '').toUpperCase();
      const masuk  = _stokMasukMap[skuKey] ? _stokMasukMap[skuKey].qty : 0;
      const keluar = keluarMap[skuKey] || 0;
      const sisa   = masuk - keluar;
      return {
        sku_variasi:      p.sku_variasi,
        katalog:          p.katalog,
        boss:             p.boss,
        hpp:              p.hpp || 0,
        kategori_produk:  p.kategori_produk || 'aktif',
        produk_id:        p.id,
        stok_masuk:       masuk,
        stok_keluar:      keluar,
        sales7:           sales7Map[skuKey]  || 0,
        sales30:          sales30Map[skuKey] || 0,
        sales90:          sales90Map[skuKey] || 0,
        sisa,
        nilai_stok:       sisa > 0 ? sisa * (p.hpp || 0) : 0,
        _stok_id:         _stokMasukMap[skuKey] ? _stokMasukMap[skuKey].id : null,
      };
    });

    filterStok(); // jaga filter aktif setelah reload
    _stokRenderStatusTabs();
    _stokRenderSupplierTabs();
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="10" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
  }
}

// ─── RENDER ───────────────────────────────────────────────────
function renderStok(data) {
  const tbody = document.getElementById('stok-tbody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="color:var(--ink3);font-style:italic">Belum ada data produk</td></tr>';
    return;
  }

  // Summary
  const totalNilai = data.reduce((s, r) => s + (r.nilai_stok || 0), 0);
  const totalSisa  = data.reduce((s, r) => s + (r.sisa || 0), 0);
  const elSum = document.getElementById('stok-summary');
  if (elSum) elSum.textContent =
    `${data.length} SKU · Sisa: ${totalSisa} pcs · Nilai: Rp${totalNilai.toLocaleString('id-ID')}`;
  const elSkuM   = document.getElementById('stok-summary-mobile-sku');
  const elPcM    = document.getElementById('stok-summary-mobile-pc');
  const elNilaiM = document.getElementById('stok-summary-mobile-nilai');
  if (elSkuM)   elSkuM.textContent   = data.length;
  if (elPcM)    elPcM.textContent    = totalSisa;
  if (elNilaiM) elNilaiM.textContent = `Rp${totalNilai.toLocaleString('id-ID')}`;

  tbody.innerHTML = data.map(row => {
    const hpp   = row.hpp   ? `Rp${row.hpp.toLocaleString('id-ID')}` : 'Rp—';
    const nilai = row.nilai_stok > 0 ? `Rp${row.nilai_stok.toLocaleString('id-ID')}` : '—';
    const safeSku = (row.sku_variasi || '').replace(/"/g, '&quot;');
    const vel = _stokVelocity(row.sales7, row.sales30, row.sales90);
    return `<tr>
      <td>${row.katalog || '—'}</td>
      <td><b>${row.sku_variasi || '—'}</b></td>
      <td style="text-align:center"><b>${row.sisa}</b></td>
      <td>${statusBadge(row.sisa, vel, row.sales7, row.sales30, row.sales90)}</td>
      <td>
        <button class="btn btn-sm" data-action="edit-stok" data-sku="${safeSku}" title="Edit stok masuk"><i class="ti ti-edit"></i></button>
      </td>
      <td style="text-align:center;color:var(--ok)">${row.sales7 || 0}</td>
      <td style="text-align:center;color:var(--ink3)">${row.stok_keluar}</td>
      <td>${hpp}</td>
      <td style="color:var(--ok);font-weight:700">${nilai}</td>
      <td>${row.boss || '—'}</td>
    </tr>`;
  }).join('');
  // Re-render rough UI setelah data selesai
  requestAnimationFrame(function() {
    if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-stok'));
  });
}

// ─── SUMMARY ──────────────────────────────────────────────────
function stokToggleSummary() {
  var panel = document.getElementById('stok-summary-panel');
  if (!panel) return;
  var open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  if (!open) stokRenderSummary();
}

function stokRenderSummary() {
  if (!_stokAllData || !_stokAllData.length) return;
  var counts = { fast:0, slow:0, dead:0, zombie:0, habis:0 };
  var nilai  = { fast:0, slow:0, dead:0, zombie:0 }; // habis selalu 0 (sisa=0)

  _stokAllData.forEach(function(r) {
    var vel = _stokVelocity(r.sales7, r.sales30, r.sales90);
    var sisa = Math.max(0, r.sisa || 0);
    if (r.sisa <= 0) {
      counts.habis++;
    } else {
      counts[vel]++;
      nilai[vel] += sisa * (r.hpp || 0);
    }
  });

  var cfg = [
    { key:'fast',   label:'Fast Moving',  color:'#00c896' },
    { key:'slow',   label:'Slow Moving',  color:'#c8a000' },
    { key:'dead',   label:'Dead Stock',   color:'#e05c00' },
    { key:'zombie', label:'Zombie',       color:'var(--ink3)' },
  ];

  var totalNilai  = nilai.fast + nilai.slow + nilai.dead + nilai.zombie;
  var nilaiSehat  = nilai.fast + nilai.slow;
  var nilaiMandeg = nilai.dead + nilai.zombie;
  var pctSehat    = totalNilai > 0 ? Math.round((nilaiSehat  / totalNilai) * 100) : 0;
  var pctMandeg   = totalNilai > 0 ? 100 - pctSehat : 0;
  var fmtRp = function(v) { return 'Rp' + Math.round(v).toLocaleString('id-ID'); };

  // ── Headline: 3 angka utama (bukan 5 card jumlah SKU) ──
  var headline =
    '<div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:10px;margin-bottom:10px">' +
      '<div style="padding:10px 12px;border:1.5px solid var(--ink3);background:var(--cream3)">' +
        '<div style="font-size:10px;color:var(--ink3);font-weight:700;text-transform:uppercase">💼 Total Nilai Inventory</div>' +
        '<div style="font-size:22px;font-weight:700;line-height:1.3">' + fmtRp(totalNilai) + '</div>' +
      '</div>' +
      '<div style="padding:10px 12px;border:1.5px solid #00c896;background:rgba(0,200,150,0.06);cursor:pointer" onclick="stokTabStatus(\'fast\')">' +
        '<div style="font-size:10px;color:#00c896;font-weight:700;text-transform:uppercase">✅ Sehat</div>' +
        '<div style="font-size:18px;font-weight:700;line-height:1.3;color:#00c896">' + pctSehat + '%</div>' +
        '<div style="font-size:10px;color:var(--ink3)">' + fmtRp(nilaiSehat) + '</div>' +
      '</div>' +
      '<div style="padding:10px 12px;border:1.5px solid var(--warn);background:rgba(224,82,82,0.06);cursor:pointer" onclick="stokTabStatus(\'dead\')">' +
        '<div style="font-size:10px;color:var(--warn);font-weight:700;text-transform:uppercase">⚠️ Mangkrak</div>' +
        '<div style="font-size:18px;font-weight:700;line-height:1.3;color:var(--warn)">' + pctMandeg + '%</div>' +
        '<div style="font-size:10px;color:var(--ink3)">' + fmtRp(nilaiMandeg) + '</div>' +
      '</div>' +
    '</div>';

  // ── Stacked bar: proporsi NILAI (Rp) per status kesehatan, bukan jumlah SKU ──
  var barSegments = '';
  cfg.forEach(function(s) {
    var pct = totalNilai > 0 ? (nilai[s.key] / totalNilai) * 100 : 0;
    if (pct <= 0) return;
    barSegments += '<div title="' + s.label + ': ' + fmtRp(nilai[s.key]) + ' (' + Math.round(pct) + '%)" ' +
      'style="width:' + pct + '%;background:' + s.color + ';height:100%;cursor:pointer" ' +
      'onclick="stokTabStatus(\'' + s.key + '\')"></div>';
  });
  var bar = '<div style="display:flex;height:14px;border-radius:3px;overflow:hidden;background:var(--cream3);margin-bottom:8px">' + barSegments + '</div>';

  // ── Chip legend ringkas — klik tetap filter tabel, tapi 1 baris padat (bukan card gede) ──
  var chips = '<div style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-bottom:2px">';
  cfg.forEach(function(s) {
    chips += '<div style="display:flex;align-items:center;gap:5px;font-size:11px;cursor:pointer" onclick="stokTabStatus(\'' + s.key + '\')">' +
      '<span style="width:8px;height:8px;border-radius:2px;background:' + s.color + ';flex-shrink:0"></span>' +
      '<span style="color:var(--ink2);font-weight:600">' + s.label + '</span>' +
      '<span style="color:var(--ink3)">' + counts[s.key] + ' SKU · ' + fmtRp(nilai[s.key]) + '</span>' +
    '</div>';
  });
  if (counts.habis > 0) {
    chips += '<div style="display:flex;align-items:center;gap:5px;font-size:11px;cursor:pointer" onclick="stokTabStatus(\'habis\')">' +
      '<span style="width:8px;height:8px;border-radius:2px;background:var(--danger);flex-shrink:0"></span>' +
      '<span style="color:var(--ink2);font-weight:600">💀 Habis</span>' +
      '<span style="color:var(--ink3)">' + counts.habis + ' SKU</span>' +
    '</div>';
  }
  chips += '</div>';

  var cards = document.getElementById('stok-summary-cards');
  if (cards) cards.innerHTML = headline + bar + chips;

  // Header kanan panel: dipakein sebagai ringkasan cepat "mangkrak" (dead+zombie)
  var cashEl = document.getElementById('stok-summary-cash-locked');
  if (cashEl) {
    cashEl.textContent = nilaiMandeg > 0
      ? '💰 Mangkrak (Dead+Zombie): ' + fmtRp(nilaiMandeg) + ' (' + pctMandeg + '% dari total)'
      : '';
  }

  _stokRenderRekomendasi();
}

// ─── REKOMENDASI: Nilai Stok Mandeg per Katalog (Dead+Zombie) ──
// Tujuan: kasih GAMBARAN modal yang nyangkut, bukan tombol aksi otomatis
// (user yang eksekusi manual — clearance / diskon extra di toko).
// Diurut dari katalog dengan nilai stok mandeg terbesar. Kalau katalog
// punya >1 varian, ditampilkan sebagai dropdown SKU Variasi.
function _stokRenderRekomendasi() {
  var wrap = document.getElementById('stok-summary-rekomendasi');
  if (!wrap || !_stokAllData) return;

  // Kumpulkan varian dead/zombie per katalog
  var byKatalog = {}; // katalog -> [{sku, sisa, nilai}]
  _stokAllData.forEach(function(r) {
    var sisa = r.sisa || 0;
    if (sisa <= 0) return;
    var vel = _stokVelocity(r.sales7, r.sales30, r.sales90);
    if (vel !== 'dead' && vel !== 'zombie') return;
    var kat = r.katalog || '—';
    if (!byKatalog[kat]) byKatalog[kat] = [];
    byKatalog[kat].push({ sku: r.sku_variasi, sisa: sisa, nilai: sisa * (r.hpp || 0) });
  });

  // Total nilai per katalog, ambil top 6
  var groups = Object.keys(byKatalog).map(function(kat) {
    var varian = byKatalog[kat].sort(function(a, b) { return b.nilai - a.nilai; });
    var total  = varian.reduce(function(s, v) { return s + v.nilai; }, 0);
    return { katalog: kat, varian: varian, total: total };
  }).filter(function(g) { return g.total > 0; })
    .sort(function(a, b) { return b.total - a.total; })
    .slice(0, 6);

  if (!groups.length) { wrap.innerHTML = ''; return; }

  var fmtRp = function(v) { return 'Rp' + Math.round(v).toLocaleString('id-ID'); };

  var rowsHtml = groups.map(function(g, i) {
    var rid = 'stok-rek-' + i;
    var top = g.varian[0]; // default: varian dengan nilai terbesar
    var selectHtml = g.varian.length > 1
      ? '<select id="' + rid + '-sel" onchange="_stokRekOnVarChange(\'' + rid + '\')" ' +
        'style="width:100%;margin-top:4px;font-size:12px;padding:4px 6px;background:var(--cream3);color:var(--ink);border:1px solid var(--ovl-0_1);border-radius:4px">'
        + g.varian.map(function(v) {
            return '<option value="' + v.sku + '" data-sisa="' + v.sisa + '" data-nilai="' + v.nilai + '">'
              + v.sku + ' — ' + v.sisa + ' pcs</option>';
          }).join('')
        + '</select>'
      : '<div style="font-size:12px;color:var(--ink3);margin-top:2px">' + top.sku + ' — ' + top.sisa + ' pcs</div>';

    return '<div style="padding:10px 12px;border:1px solid var(--ovl-0_08);border-radius:6px;margin-bottom:6px;background:var(--cream3)">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">'
      +   '<div style="flex:1;min-width:0">'
      +     '<div style="font-weight:700;font-size:13px">' + g.katalog + '</div>'
      +     selectHtml
      +   '</div>'
      +   '<div style="text-align:right;flex-shrink:0">'
      +     '<div id="' + rid + '-nilai" style="font-weight:700;color:var(--warn);font-size:15px">' + fmtRp(top.nilai) + '</div>'
      +   '</div>'
      + '</div>'
      + '<div id="' + rid + '-insight" style="font-size:11px;color:var(--ink3);margin-top:6px">💡 Modal ' + fmtRp(top.nilai) + ' nyangkut di produk ini — pertimbangkan clearance atau diskon extra</div>'
      + '</div>';
  }).join('');

  wrap.innerHTML =
    '<div style="font-weight:700;font-size:12px;color:var(--ink2);margin-bottom:8px;display:flex;align-items:center;gap:6px">'
    + '<i class="ti ti-bulb"></i> Nilai Stok Mandeg — Rekomendasi</div>'
    + rowsHtml
    + '<button class="btn btn-sm" onclick="gotoPage(\'clearance\',null)" style="width:100%;margin-top:2px">'
    + '<i class="ti ti-tag"></i> Lihat Detail Lengkap di Clearance Monitor</button>';
}

// Update nilai + insight text saat user ganti pilihan varian di dropdown
function _stokRekOnVarChange(rid) {
  var sel = document.getElementById(rid + '-sel');
  if (!sel) return;
  var opt   = sel.options[sel.selectedIndex];
  var nilai = Number(opt.dataset.nilai || 0);
  var fmtRp = function(v) { return 'Rp' + Math.round(v).toLocaleString('id-ID'); };
  var nilaiEl   = document.getElementById(rid + '-nilai');
  var insightEl = document.getElementById(rid + '-insight');
  if (nilaiEl)   nilaiEl.textContent   = fmtRp(nilai);
  if (insightEl) insightEl.textContent = '💡 Modal ' + fmtRp(nilai) + ' nyangkut di produk ini — pertimbangkan clearance atau diskon extra';
}

// ─── STATUS TABS ──────────────────────────────────────────────
var _filterStatusTab = null; // null = semua

var _stokStatusPillMeta = {
  all:    { dot: '⬜', label: 'Semua'  },
  fast:   { dot: '🟢', label: 'Fast'   },
  slow:   { dot: '🟡', label: 'Slow'   },
  dead:   { dot: '🔴', label: 'Dead'   },
  zombie: { dot: '⚫', label: 'Zombie' },
  habis:  { dot: '💀', label: 'Habis'  },
};

function stokTabStatus(tab) {
  _filterStatusTab = tab === 'all' ? null : tab;
  // Update active state tombol (desktop)
  document.querySelectorAll('.stok-tab-btn[data-tab]').forEach(function(btn) {
    if (btn.dataset.tab === tab) {
      btn.classList.add('stok-tab-active');
    } else {
      btn.classList.remove('stok-tab-active');
    }
  });
  filterStok();
}

// ─── FILTER ───────────────────────────────────────────────────
function filterStok() {
  const filtered = _stokAllData.filter(r => {
    if (_filterBoss    && (r.boss    || '') !== _filterBoss)    return false;
    if (_filterKatalog && (r.katalog || '') !== _filterKatalog) return false;
    // Tab status filter — velocity adalah sifat produk, bukan kondisi stok
    if (_filterStatusTab) {
      const sisa = r.sisa;
      const vel  = _stokVelocity(r.sales7, r.sales30, r.sales90);
      if (_filterStatusTab === 'habis'  && !(sisa <= 0))    return false;
      if (_filterStatusTab === 'fast'   && vel !== 'fast')  return false;
      if (_filterStatusTab === 'slow'   && vel !== 'slow')  return false;
      if (_filterStatusTab === 'dead'   && vel !== 'dead')  return false;
      if (_filterStatusTab === 'zombie' && vel !== 'zombie') return false;
    }
    return true;
  });

  // Apply sort
  if (_stokSort.col) {
    filtered.sort(function(a, b) {
      var va, vb;
      if (_stokSort.col === 'status') {
        va = _stokStatusRank(a);
        vb = _stokStatusRank(b);
      } else {
        va = _stokSort.col === 'sisa'        ? (a.sisa || 0)
           : _stokSort.col === 'sales'       ? (a.sales7 || 0)
           : _stokSort.col === 'sales_total' ? (a.stok_keluar || 0)
           : (a.nilai_stok || 0);
        vb = _stokSort.col === 'sisa'        ? (b.sisa || 0)
           : _stokSort.col === 'sales'       ? (b.sales7 || 0)
           : _stokSort.col === 'sales_total' ? (b.stok_keluar || 0)
           : (b.nilai_stok || 0);
      }
      return _stokSort.dir === 'desc' ? vb - va : va - vb;
    });
  }

  renderStok(filtered);
}

// ─── EVENT DELEGATION ─────────────────────────────────────────
document.getElementById('page-stok').addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'edit-stok') {
    editStok(btn.dataset.sku);
  }
});

// ─── FORM TAMBAH/EDIT — konsep JP ────────────────────────────

function stokOverlayClose(e) {
  if (e.target === document.getElementById('modal-stok-masuk')) cancelStokForm();
}

function showTambahStok() {
  document.getElementById('stok-form-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Stok Masuk';
  document.getElementById('inp-id').value        = '';
  document.getElementById('inp-sku-induk').value = '';
  _stokSetIndukLabel(null);
  var mw0 = document.getElementById('stok-sku-induk-manual-wrap');
  if (mw0) mw0.style.display = 'none';
  document.getElementById('inp-masuk').value     = '';
  _stokSelectedSku = '';
  _stokEditMode    = false;
  var infoEl = document.getElementById('stok-info-sisa');
  if (infoEl) infoEl.style.display = 'none';
  var lblMasuk = document.getElementById('lbl-inp-masuk');
  if (lblMasuk) lblMasuk.textContent = 'Stok Masuk (Qty)';
  // Reset picker variasi
  document.getElementById('inp-sku').innerHTML = '<option value="">— Pilih Variasi —</option>';
  var lbl = document.getElementById('stok-picker-variasi-label');
  if (lbl) { lbl.textContent = '— Pilih Variasi —'; lbl.style.color = 'var(--ink3)'; }
  document.getElementById('modal-stok-masuk').classList.add('open');
  setTimeout(function(){ stokSkuSheetOpen('induk'); }, 150);
}

function cancelStokForm() {
  document.getElementById('modal-stok-masuk').classList.remove('open');
  stokSkuSheetClose();
  _stokSelectedSku = '';
  _stokEditMode    = false;
  var lbl = document.getElementById('stok-picker-variasi-label');
  if (lbl) { lbl.textContent = '— Pilih Variasi —'; lbl.style.color = 'var(--ink3)'; }
  var infoEl = document.getElementById('stok-info-sisa');
  if (infoEl) infoEl.style.display = 'none';
  var lblMasuk = document.getElementById('lbl-inp-masuk');
  if (lblMasuk) lblMasuk.textContent = 'Stok Masuk (Qty)';
}

function editStok(sku) {
  var skuKey   = sku.toUpperCase();
  var existing = _stokMasukMap[skuKey];
  document.getElementById('stok-form-title').innerHTML = '<i class="ti ti-edit"></i> Edit Stok';
  document.getElementById('inp-id').value = existing ? existing.id : '';
  _stokSelectedSku = skuKey;
  _stokEditMode    = true;
  stokSkuSheetClose();
  // Hitung sisa current
  var dataRow = _stokAllData.find(function(r){ return (r.sku_variasi||'').toUpperCase() === skuKey; });
  var sisaCurrent   = dataRow ? dataRow.sisa : 0;
  var keluarCurrent = dataRow ? dataRow.stok_keluar : 0;
  var infoEl = document.getElementById('stok-info-sisa');
  if (infoEl) infoEl.style.display = 'block';
  var sisaVal = document.getElementById('stok-info-sisa-val');
  if (sisaVal) sisaVal.textContent = sisaCurrent;
  var keluarVal = document.getElementById('stok-info-keluar-val');
  if (keluarVal) keluarVal.textContent = keluarCurrent;
  var lblMasuk = document.getElementById('lbl-inp-masuk');
  if (lblMasuk) lblMasuk.textContent = 'Set Sisa Menjadi (Qty)';
  document.getElementById('inp-masuk').value = sisaCurrent >= 0 ? sisaCurrent : 0;
  // Cari produk untuk isi katalog & picker
  var found = _produkForStok.find(function(p) {
    return (p.sku_variasi || '').toUpperCase() === skuKey;
  });
  if (found) {
    // skipAutoOpen=true: populate list variasi tanpa reset label dan tanpa auto-open picker
    stokPilihKatalog(found.katalog || '', true);
    document.getElementById('inp-sku').value = sku;
    var lbl = document.getElementById('stok-picker-variasi-label');
    if (lbl) { lbl.textContent = sku; lbl.style.color = 'var(--ink)'; }
  } else {
    document.getElementById('inp-sku-induk').value = sku;
    _stokSetIndukLabel(sku);
    var mw1 = document.getElementById('stok-sku-induk-manual-wrap');
    var mi1 = document.getElementById('stok-sku-induk-manual');
    if (mw1) mw1.style.display = 'block';
    if (mi1) mi1.value = sku;
    document.getElementById('inp-sku').innerHTML =
      '<option value="' + sku + '">' + sku + '</option>';
    var lbl = document.getElementById('stok-picker-variasi-label');
    if (lbl) { lbl.textContent = sku; lbl.style.color = 'var(--ink)'; }
  }
  document.getElementById('modal-stok-masuk').classList.add('open');
  setTimeout(function(){ document.getElementById('inp-masuk').focus(); }, 60);
}

async function simpanStok() {
  var id  = document.getElementById('inp-id').value;
  // Prioritas: _stokSelectedSku (dari picker) → inp-sku.value → bukan fallback ke katalog
  var sku = (_stokSelectedSku || '').trim().toUpperCase();
  if (!sku) sku = (document.getElementById('inp-sku').value || '').trim().toUpperCase();
  var qty = parseInt(document.getElementById('inp-masuk').value) || 0;

  if (!sku) { alert('Pilih SKU Variasi terlebih dahulu!'); return; }
  if (!_stokEditMode && qty <= 0) { alert('Stok masuk harus lebih dari 0!'); return; }
  if (_stokEditMode  && qty < 0)  { alert('Sisa tidak boleh negatif!'); return; }
  // Validasi: SKU harus ada di produk (bukan nama katalog yang nyasar)
  var valid = _produkForStok.some(function(p) {
    return (p.sku_variasi || '').toUpperCase() === sku;
  });
  if (!valid) { alert('SKU "' + sku + '" tidak ditemukan di data produk. Pilih variasi dari picker.'); return; }

  var prod = _produkForStok.find(function(p) {
    return (p.sku_variasi || '').toUpperCase() === sku.toUpperCase();
  });

  var payload = {
    sku_variasi: sku.toUpperCase(),
    stok_masuk:  qty,
    stok_keluar: 0,
    katalog:     prod ? prod.katalog : '',
    boss:        prod ? prod.boss    : '',
    hpp:         prod ? prod.hpp     : 0,
  };

  var btnSimpan = document.querySelector('#modal-stok-masuk .btn-primary');
  if (btnSimpan) { btnSimpan.textContent = 'Menyimpan...'; btnSimpan.disabled = true; }
  try {
    // Selalu cek _stokMasukMap — jangan bergantung inp-id yang hanya diisi saat editStok()
    // Ini mencegah duplicate INSERT saat user Tambah SKU yang sudah punya record
    var existingRec = _stokMasukMap[sku];
    if (existingRec && existingRec.id) {
      if (_stokEditMode) {
        // Opsi B: user input = sisa target → stok_masuk_baru = sisa_target + keluar_jurnal
        var dataRow2 = _stokAllData.find(function(r){ return (r.sku_variasi||'').toUpperCase() === sku; });
        var keluarJurnal = dataRow2 ? (dataRow2.stok_keluar || 0) : 0;
        var stokMasukBaru = qty + keluarJurnal;
        await dbUpdate('stok', existingRec.id, { stok_masuk: stokMasukBaru });
      } else {
        // Mode TAMBAH: akumulasi
        var oldQty = existingRec.qty || 0;
        await dbUpdate('stok', existingRec.id, { stok_masuk: oldQty + qty });
      }
    } else {
      await dbInsert('stok', payload);
    }
    cancelStokForm();
    loadStok();
  } catch(err) {
    alert('Gagal simpan: ' + err.message);
  } finally {
    if (btnSimpan) {
      btnSimpan.innerHTML = '<i class="ti ti-device-floppy"></i> SIMPAN';
      btnSimpan.disabled = false;
    }
  }
}

// ─── KATALOG DROPDOWN — seperti JP ───────────────────────────
function _stokGetKatalog(p) { return p.katalog || p.nama_katalog || p.catalog || ''; }
function _stokGetSku(p)     { return p.sku_variasi || p.sku || p.kode || ''; }

// ─── PICKER BOTTOM SHEET (BRImo-style): SKU Induk & SKU Variasi ──
// 1 sheet dipakai gantian buat 2 field lewat _stokSkuSheetMode ('induk'/'variasi').
var _stokSkuSheetMode = null;

function stokSkuSheetOpen(mode) {
  _stokSkuSheetMode = mode;
  var searchEl = document.getElementById('stok-sku-sheet-search');
  var titleEl  = document.getElementById('stok-sku-sheet-title');
  if (searchEl) {
    searchEl.value = '';
    searchEl.placeholder = mode === 'induk' ? 'Cari SKU Induk...' : 'Cari variasi...';
  }
  if (titleEl) titleEl.textContent = mode === 'induk' ? 'Pilih SKU Induk' : 'Pilih Variasi';
  var ov = document.getElementById('stok-sku-sheet-overlay');
  var sh = document.getElementById('stok-sku-sheet');
  if (ov) ov.classList.add('open');
  if (sh) sh.classList.add('open');
  stokSkuSheetRender('');
  var _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (searchEl && !_isIOS) setTimeout(function() { searchEl.focus(); }, 260);
}
function stokSkuSheetClose() {
  var ov = document.getElementById('stok-sku-sheet-overlay');
  var sh = document.getElementById('stok-sku-sheet');
  if (ov) ov.classList.remove('open');
  if (sh) sh.classList.remove('open');
}
function stokSkuSheetFilter(q) { stokSkuSheetRender(q); }
function stokSkuSheetRender(q) {
  if (_stokSkuSheetMode === 'induk') _stokSkuSheetRenderInduk(q);
  else if (_stokSkuSheetMode === 'variasi') _stokSkuSheetRenderVariasi(q);
}

function _stokSetIndukLabel(text) {
  var lbl = document.getElementById('stok-picker-induk-label');
  if (lbl) {
    lbl.textContent = text || '— Pilih SKU Induk —';
    lbl.style.color = text ? 'var(--ink)' : 'var(--ink3)';
  }
}

function _stokSkuSheetRenderInduk(q) {
  var listEl = document.getElementById('stok-sku-sheet-list');
  if (!listEl) return;
  q = (q || '').toLowerCase().trim();
  var katalogMap = {};
  _produkForStok.forEach(function(p) {
    var kat = _stokGetKatalog(p);
    if (!kat) return;
    if (q && kat.toLowerCase().indexOf(q) === -1) return;
    katalogMap[kat] = (katalogMap[kat] || 0) + 1;
  });
  var katalogs = Object.keys(katalogMap).sort();
  var html = '';
  if (!katalogs.length) {
    html += '<div class="jp-sheet-empty">' + (_produkForStok.length === 0 ? 'Produk belum ada — tambah di Kelola Produk' : 'Tidak ada SKU yang cocok') + '</div>';
  } else {
    katalogs.forEach(function(kat) {
      html += '<div class="jp-sheet-item" onclick="stokSkuSheetSelectInduk(\'' + kat.replace(/'/g,"\\'") + '\')">' +
        '<span>' + kat + '</span>' +
        '<span style="font-size:11px;color:var(--ink3)">' + katalogMap[kat] + ' var</span></div>';
    });
  }
  html += '<div class="jp-sheet-item" style="color:var(--info);font-weight:700;border-top:1px solid var(--ink4);margin-top:4px;padding-top:12px" onclick="stokSkuSheetManualInduk()">' +
    '<span><i class="ti ti-pencil"></i> Ketik SKU manual...</span></div>';
  listEl.innerHTML = html;
}

function _stokSkuSheetRenderVariasi(q) {
  var listEl = document.getElementById('stok-sku-sheet-list');
  if (!listEl) return;
  var katalog = document.getElementById('inp-sku-induk').value;
  var varList = _produkForStok.filter(function(p) { return _stokGetKatalog(p) === katalog; });
  q = (q || '').toLowerCase().trim();
  var items = varList.filter(function(p) { return !q || _stokGetSku(p).toLowerCase().indexOf(q) !== -1; });
  var html = '';
  if (!katalog) {
    html = '<div class="jp-sheet-empty">Pilih SKU Induk dulu</div>';
  } else if (!items.length) {
    html = '<div class="jp-sheet-empty">' + (q ? 'Tidak ada variasi yang cocok' : 'Belum ada variasi untuk SKU ini') + '</div>';
  } else {
    items.forEach(function(p) {
      var sku = _stokGetSku(p);
      html += '<div class="jp-sheet-item" onclick="stokSkuSheetSelectVariasi(\'' + sku.replace(/'/g,"\\'") + '\')"><span>' + sku + '</span></div>';
    });
  }
  listEl.innerHTML = html;
}

function stokSkuSheetSelectInduk(katalog) {
  stokSkuSheetClose();
  var manualWrap = document.getElementById('stok-sku-induk-manual-wrap');
  if (manualWrap) manualWrap.style.display = 'none';
  stokPilihKatalog(katalog);
}

function stokSkuSheetManualInduk() {
  stokSkuSheetClose();
  var manualWrap = document.getElementById('stok-sku-induk-manual-wrap');
  var manualInp  = document.getElementById('stok-sku-induk-manual');
  if (manualWrap) manualWrap.style.display = 'block';
  if (manualInp) { manualInp.value = ''; setTimeout(function(){ manualInp.focus(); }, 260); }
}

function stokOnManualIndukInput() {
  var manualInp = document.getElementById('stok-sku-induk-manual');
  var val = manualInp ? manualInp.value : '';
  document.getElementById('inp-sku-induk').value = val;
  _stokSetIndukLabel(val || null);
  document.getElementById('inp-sku').innerHTML = '<option value="">— Pilih Variasi —</option>';
  var lblV = document.getElementById('stok-picker-variasi-label');
  if (lblV) { lblV.textContent = '— Pilih Variasi —'; lblV.style.color = 'var(--ink3)'; }
}

function stokPilihKatalog(katalog, skipAutoOpen) {
  document.getElementById('inp-sku-induk').value = katalog;
  _stokSetIndukLabel(katalog);
  var manualWrap = document.getElementById('stok-sku-induk-manual-wrap');
  if (manualWrap) manualWrap.style.display = 'none';
  var varList = _produkForStok.filter(function(p){ return _stokGetKatalog(p) === katalog; });
  var sel = document.getElementById('inp-sku');
  sel.innerHTML = '<option value="">— Pilih Variasi —</option>';
  varList.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value       = _stokGetSku(p);
    opt.textContent = _stokGetSku(p);
    sel.appendChild(opt);
  });
  // skipAutoOpen = true saat dipanggil dari editStok — jangan reset label, jangan auto-open
  if (skipAutoOpen) return;
  var lbl = document.getElementById('stok-picker-variasi-label');
  if (lbl) { lbl.textContent = '— Pilih Variasi —'; lbl.style.color = 'var(--ink3)'; }
  if (varList.length === 1) {
    sel.selectedIndex = 1;
    _stokSelectedSku = _stokGetSku(varList[0]).toUpperCase();
    if (lbl) { lbl.textContent = _stokGetSku(varList[0]); lbl.style.color = 'var(--ink)'; }
    setTimeout(function(){ document.getElementById('inp-masuk').focus(); }, 60);
  } else if (varList.length > 1) {
    setTimeout(function() { stokSkuSheetOpen('variasi'); }, 250);
  }
}

function stokSkuSheetSelectVariasi(sku) {
  _stokSelectedSku = sku.toUpperCase();
  var sel = document.getElementById('inp-sku');
  if (sel) sel.value = sku;
  var lbl = document.getElementById('stok-picker-variasi-label');
  if (lbl) { lbl.textContent = sku || '— Pilih Variasi —'; lbl.style.color = sku ? 'var(--ink)' : 'var(--ink3)'; }
  stokSkuSheetClose();
  if (sku) setTimeout(function(){ document.getElementById('inp-masuk').focus(); }, 60);
}

// ─── PASTE MASSAL ─────────────────────────────────────────────
var _pasteStokMode = 'tambah'; // 'tambah' | 'penyesuaian'

function stokSetPasteMode(mode) {
  _pasteStokMode = mode;
  var btnT  = document.getElementById('btn-mode-tambah');
  var btnS  = document.getElementById('btn-mode-sesuai');
  var desc  = document.getElementById('paste-mode-desc');
  var colH  = document.getElementById('paste-stok-col-header');
  if (mode === 'tambah') {
    btnT.style.background = 'var(--ink)';   btnT.style.color = 'var(--cream)';
    btnS.style.background = 'var(--cream)'; btnS.style.color = 'var(--ink)';
    if (desc) desc.innerHTML = 'Copy dari Google Sheet / Excel lalu paste di bawah.<br>Urutan kolom: <b>SKU Variasi → Qty (akan DITAMBAHKAN ke stok yang ada)</b>';
    if (colH) colH.textContent = 'Stok Masuk (+)';
  } else {
    btnS.style.background = 'var(--ink)';   btnS.style.color = 'var(--cream)';
    btnT.style.background = 'var(--cream)'; btnT.style.color = 'var(--ink)';
    if (desc) desc.innerHTML = 'Format: <b>Nama SKU Induk</b> (tanpa qty) sebagai header grup, lalu varian di bawahnya.<br>Contoh: <code>TURTLENECK</code> → baris header, <code>Turtleneck_HITAM-M &nbsp; 5</code> → varian.<br>Varian tidak ada di paste = sisa jadi <b>0</b>. SKU Induk lain <b>tidak disentuh</b>.';
    if (colH) colH.textContent = 'Sisa Aktual';
  }
  // Reset preview kalau mode berubah
  document.getElementById('paste-stok-preview').style.display = 'none';
  document.getElementById('btn-simpan-paste-stok').style.display = 'none';
  var sn = document.getElementById('paste-stok-scope-notif');
  if (sn) { sn.style.display = 'none'; sn.innerHTML = ''; }
  _parsedStok = [];
}

function showPasteStok() {
  document.getElementById('paste-area-stok').value = '';
  document.getElementById('paste-stok-preview').style.display = 'none';
  document.getElementById('btn-simpan-paste-stok').style.display = 'none';
  _parsedStok = [];
  stokSetPasteMode('tambah'); // reset ke mode default
  document.getElementById('modal-paste-stok').classList.add('open');
  setTimeout(() => document.getElementById('paste-area-stok').focus(), 100);
}

let _parsedStok = [];

function parsePasteStok() {
  const raw = document.getElementById('paste-area-stok').value.trim();
  if (!raw) { alert('Paste data dulu!'); return; }

  _parsedStok = [];
  const lines = raw.split('\n');

  if (_pasteStokMode === 'penyesuaian') {
    // ── Mode Penyesuaian: deteksi header SKU Induk ───────────
    // Header = baris yang kolom-2 kosong DAN nama match katalog di sistem
    const katalogSet = new Set(
      _produkForStok.map(p => (p.katalog || '').toUpperCase())
    );

    let currentKatalog = null;
    const scopeKatalogs = []; // daftar SKU Induk yang terdeteksi
    const pasteMap = {};      // SKU_VARIASI → qty

    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = line.split('\t').map(c => c.trim());
      const col0 = (cols[0] || '').toUpperCase();
      const col1 = (cols[1] || '').replace(/[^0-9]/g, '');
      if (!col0) continue;

      // Deteksi header: kolom-2 kosong DAN match katalog sistem
      if (!col1 && katalogSet.has(col0)) {
        currentKatalog = col0;
        if (!scopeKatalogs.includes(col0)) scopeKatalogs.push(col0);
        continue;
      }

      // Baris variasi — hanya masuk kalau ada SKU Induk aktif
      if (currentKatalog) {
        const qty = parseInt(col1) || 0;
        pasteMap[col0] = qty;
        _parsedStok.push({ sku_variasi: col0, qty, katalog: currentKatalog });
      }
    }

    if (scopeKatalogs.length === 0) {
      alert('Tidak ada SKU Induk yang terdeteksi.\nPastikan nama katalog di baris pertama setiap grup sesuai dengan data sistem (kolom qty-nya kosong).');
      return;
    }

    // Notif scope di preview
    const scopeNotif = `⚠️ ${scopeKatalogs.length} SKU Induk akan disesuaikan: <b>${scopeKatalogs.join(', ')}</b><br>` +
      `Varian yang <u>tidak ada</u> dalam paste (per SKU Induk) → sisa jadi <b>0</b>.<br>` +
      `SKU Induk lain tidak disentuh.`;
    document.getElementById('paste-stok-scope-notif').innerHTML = scopeNotif;
    document.getElementById('paste-stok-scope-notif').style.display = 'block';

    document.getElementById('paste-stok-count').textContent =
      `✓ ${_parsedStok.length} varian dari ${scopeKatalogs.length} SKU Induk siap disesuaikan`;
    document.getElementById('paste-stok-tbody').innerHTML = _parsedStok.map(r =>
      `<tr><td>${r.sku_variasi}</td><td><b>${r.qty}</b></td></tr>`
    ).join('');

  } else {
    // ── Mode Tambah Masuk (lama) ──────────────────────────────
    document.getElementById('paste-stok-scope-notif').style.display = 'none';
    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = line.split('\t').map(c => c.trim());
      const sku = (cols[0] || '').toUpperCase();
      if (!sku || cols.length < 2) continue;
      const qty = parseInt((cols[1] || '').replace(/[^0-9]/g, '')) || 0;
      _parsedStok.push({ sku_variasi: sku, qty });
    }
    if (_parsedStok.length === 0) {
      alert('Tidak ada data yang terbaca. Format: SKU Variasi (tab) Qty');
      return;
    }
    document.getElementById('paste-stok-count').textContent =
      `✓ ${_parsedStok.length} SKU siap diimport`;
    document.getElementById('paste-stok-tbody').innerHTML = _parsedStok.map(r =>
      `<tr><td>${r.sku_variasi}</td><td><b>${r.qty}</b></td></tr>`
    ).join('');
  }

  document.getElementById('paste-stok-preview').style.display = 'block';
  document.getElementById('btn-simpan-paste-stok').style.display = 'inline-block';
}

async function simpanPasteStok() {
  if (_parsedStok.length === 0) return;
  const btn = document.getElementById('btn-simpan-paste-stok');
  btn.textContent = 'Menyimpan...';
  btn.disabled = true;
  const isPenyesuaian = _pasteStokMode === 'penyesuaian';

  try {
    let ok = 0;

    if (isPenyesuaian) {
      // ── Mode Penyesuaian — scope per SKU Induk ───────────────
      // Bangun: katalog → Set SKU variasi yang ada di paste
      const scopeMap = {};   // katalog → { sku: qty }
      _parsedStok.forEach(r => {
        const kat = (r.katalog || '').toUpperCase();
        if (!scopeMap[kat]) scopeMap[kat] = {};
        scopeMap[kat][r.sku_variasi.toUpperCase()] = r.qty;
      });

      const scopeKatalogs = Object.keys(scopeMap);
      // Kumpulkan semua SKU variasi yang termasuk dalam scope katalog
      const allSkusInScope = _produkForStok
        .filter(p => scopeKatalogs.includes((p.katalog || '').toUpperCase()))
        .map(p => (p.sku_variasi || '').toUpperCase());

      const total = allSkusInScope.length;
      for (const skuKey of allSkusInScope) {
        const prod     = _produkForStok.find(p => (p.sku_variasi||'').toUpperCase() === skuKey);
        const kat      = (prod ? prod.katalog : '').toUpperCase();
        const existing = _stokMasukMap[skuKey];
        const dataRow  = _stokAllData.find(r => (r.sku_variasi||'').toUpperCase() === skuKey);
        const keluarJurnal = dataRow ? (dataRow.stok_keluar || 0) : 0;
        // Kalau SKU ada di paste → pakai qty paste, kalau tidak → sisa = 0
        const sisaTarget   = (scopeMap[kat] && scopeMap[kat].hasOwnProperty(skuKey))
          ? scopeMap[kat][skuKey] : 0;
        const stokMasukBaru = sisaTarget + keluarJurnal;

        if (existing && existing.id) {
          await dbUpdate('stok', existing.id, { stok_masuk: stokMasukBaru });
        } else {
          await dbInsert('stok', {
            sku_variasi: skuKey,
            stok_masuk:  stokMasukBaru,
            stok_keluar: 0,
            katalog:     prod ? prod.katalog : '',
            boss:        prod ? prod.boss    : '',
            hpp:         prod ? prod.hpp     : 0,
          });
        }
        ok++;
        btn.textContent = `Menyimpan ${ok}/${total}...`;
      }
    } else {
      // ── Mode Tambah Masuk (lama) ───────────────────────────────
      for (const row of _parsedStok) {
        const skuKey   = row.sku_variasi.toUpperCase();
        const prod     = _produkForStok.find(p => (p.sku_variasi||'').toUpperCase() === skuKey);
        const existing = _stokMasukMap[skuKey];
        const payload  = {
          sku_variasi: skuKey,
          stok_masuk:  row.qty,
          stok_keluar: 0,
          katalog:     prod ? prod.katalog : '',
          boss:        prod ? prod.boss    : '',
          hpp:         prod ? prod.hpp     : 0,
        };
        if (existing) {
          const stokBaru = (existing.qty || 0) + row.qty;
          await dbUpdate('stok', existing.id, { stok_masuk: stokBaru });
        } else {
          await dbInsert('stok', payload);
        }
        ok++;
        btn.textContent = `Menyimpan ${ok}/${_parsedStok.length}...`;
      }
    }

    closeModal('modal-paste-stok');
    loadStok();
    alert(`✓ ${ok} SKU berhasil ${isPenyesuaian ? 'disesuaikan' : 'disimpan'}!`)
  } catch(err) {
    alert('Gagal simpan: ' + err.message);
  } finally {
    btn.textContent = 'Simpan Semua';
    btn.disabled = false;
  }
}

// exportStok dihapus (tombol Export CSV diringkas)

// ─── FILTER STATE ─────────────────────────────────────────────
// ─── SORT STATE ───────────────────────────────────────────────
var _stokSort = { col: null, dir: 'desc' };

function stokToggleSort(col) {
  // 3 state: netral(⇅) → desc(▼) → asc(▲) → netral
  if (_stokSort.col === col) {
    if (_stokSort.dir === 'desc') {
      _stokSort.dir = 'asc';
    } else {
      _stokSort.col = null; // reset ke netral
      _stokSort.dir = 'desc';
    }
  } else {
    _stokSort.col = col;
    _stokSort.dir = 'desc';
  }
  // Update icons semua kolom
  ['sisa','sales','sales_total','nilai','status'].forEach(function(c) {
    var el = document.getElementById('sort-icon-' + c);
    if (!el) return;
    if (c === _stokSort.col) {
      el.textContent = _stokSort.dir === 'desc' ? '▼' : '▲';
      el.style.color = 'var(--ok)';
    } else {
      el.textContent = '⇅';
      el.style.color = 'var(--ink3)';
    }
  });
  filterStok();
}

let _filterBoss           = null;
let _filterKatalog        = null;
// Status filter pakai _filterStatusTab (didefinisikan di atas, dipakai bareng
// stokTabStatus()) — bukan variabel terpisah, biar 1 sumber kebenaran.

function stokToggleFilterAll() {
  // Mobile: pakai bottom sheet drill-in, bukan dropdown kecil
  if (window.innerWidth <= 600) {
    var sheet = document.getElementById('stok-filter-sheet');
    if (sheet && sheet.classList.contains('open')) {
      stokFilterSheetClose();
    } else {
      stokFilterSheetOpen();
    }
    return;
  }

  // Desktop: dropdown lama, tidak berubah
  var dd  = document.getElementById('dd-filter-all');
  var btn = document.getElementById('btn-filter-all');
  if (!dd) return;
  if (dd.style.display === 'block') {
    // Tutup semua submenu juga
    ['boss','katalog','status'].forEach(function(t) {
      var s = document.getElementById('dd-filter-' + t);
      if (s) s.style.display = 'none';
      var m = document.getElementById('mi-' + t);
      if (m) { m.style.background = ''; m.style.color = ''; }
    });
    dd.style.display = 'none';
    return;
  }
  // Posisi fixed menggunakan getBoundingClientRect — hindari clipping oleh parent overflow.
  // Default nempel kiri tombol; kalau lebar dd bikin dia nembus tepi kanan layar, balik nempel kanan.
  if (btn) {
    var r = btn.getBoundingClientRect();
    dd.style.top = (r.bottom + 2) + 'px';
    dd.style.left = r.left + 'px';
    dd.style.visibility = 'hidden';
    dd.style.display = 'block';
    var ddW = dd.offsetWidth;
    if (r.left + ddW > window.innerWidth - 4) {
      dd.style.left = Math.max(4, r.right - ddW) + 'px';
    }
    dd.style.visibility = '';
  }
  // Pastikan dd di body agar tidak ter-clip oleh stacking context parent
  if (dd.parentNode !== document.body) document.body.appendChild(dd);
  dd.style.display = 'block';
}

// ─── FILTER BOTTOM SHEET (mobile) — langsung picker SKU Induk ────
// Status & Supplier sekarang chip scroll sendiri (lihat _stokRenderStatusTabs
// & _stokRenderSupplierTabs), jadi sheet ini gak perlu root/drill-in lagi.
function stokFilterSheetOpen() {
  var ov = document.getElementById('stok-filter-sheet-overlay');
  var sh = document.getElementById('stok-filter-sheet');
  if (!ov || !sh) return;
  ov.classList.add('open');
  sh.classList.add('open');
  _stokFilterSheetRenderList();
}

function stokFilterSheetClose() {
  var ov = document.getElementById('stok-filter-sheet-overlay');
  var sh = document.getElementById('stok-filter-sheet');
  if (ov) ov.classList.remove('open');
  if (sh) sh.classList.remove('open');
}

function _stokFilterSheetRenderList() {
  // Menyempit ke SKU Induk yang punya baris dengan Supplier terpilih (kalau ada chip Supplier aktif)
  var rows = _filterBoss ? _stokAllData.filter(function(r){ return (r.boss||'') === _filterBoss; }) : _stokAllData;
  var opsi = [{ val: null, label: 'Semua SKU Induk' }].concat(
    [...new Set(rows.map(function(r){ return r.katalog||''; }).filter(Boolean))].sort()
    .map(function(v){ return { val: v, label: v }; })
  );

  var listEl = document.getElementById('stok-filter-sheet-cat-list');
  if (!listEl) return;
  listEl.innerHTML = opsi.map(function(o) {
    var active = o.val === _filterKatalog;
    return '<div class="stok-filter-sheet-opt' + (active ? ' active' : '') + '" data-val="' + (o.val || '') + '" data-isnull="' + (o.val === null ? '1' : '0') + '">' + o.label + '</div>';
  }).join('');
  Array.from(listEl.querySelectorAll('.stok-filter-sheet-opt')).forEach(function(el) {
    el.addEventListener('click', function() {
      var val = el.getAttribute('data-isnull') === '1' ? null : el.getAttribute('data-val');
      stokSetFilter('katalog', val);
      stokFilterSheetClose();
    });
  });
}

function _miId(type) {
  return 'mi-' + type;
}

// ─── TAB STATUS (mobile) — scroll horizontal, gaya tab status Shopee ────
// "Semua" chip dihapus — kondisi default (gak ada filter) sekarang direpresentasikan
// dengan TIDAK ADA chip yang aktif, bukan chip "Semua" terpisah. Tap ulang chip yang
// lagi aktif = deselect balik ke Semua.
function _stokRenderStatusTabs() {
  var wrap = document.getElementById('stok-status-tabs-mobile');
  if (!wrap) return;

  var order = ['fast', 'slow', 'dead', 'zombie', 'habis'];
  var html = order.map(function(key) {
    var meta   = _stokStatusPillMeta[key];
    var active = _filterStatusTab === key;
    return '<button type="button" class="stok-chip-tab' + (active ? ' active' : '') + '" data-val="' + key + '">' + meta.dot + ' ' + meta.label + '</button>';
  }).join('');
  wrap.innerHTML = html;

  Array.from(wrap.querySelectorAll('.stok-chip-tab')).forEach(function(el) {
    el.addEventListener('click', function() {
      var val = el.getAttribute('data-val');
      stokTabStatus(val === _filterStatusTab ? 'all' : val);
    });
  });
}

// ─── TAB SUPPLIER (mobile) — scroll horizontal, gaya tab status Shopee ──
// "Semua" chip dihapus — sama kayak Status, gak ada chip aktif = Semua supplier.
// Tap ulang chip yang lagi aktif = deselect balik ke Semua.
function _stokRenderSupplierTabs() {
  var wrap = document.getElementById('stok-supplier-tabs');
  if (!wrap || !_stokAllData) return;

  // Cascading: kalau SKU Induk udah dipilih, opsi Supplier ikut menyempit
  var rows = _filterKatalog ? _stokAllData.filter(function(r){ return (r.katalog||'') === _filterKatalog; }) : _stokAllData;
  var suppliers = [...new Set(rows.map(function(r){ return r.boss||''; }).filter(Boolean))].sort();

  var html = suppliers.map(function(s) {
    var active = _filterBoss === s;
    return '<button type="button" class="stok-chip-tab' + (active ? ' active' : '') + '" data-val="' + s.replace(/"/g, '&quot;') + '">' + s + '</button>';
  }).join('');
  wrap.innerHTML = html;

  Array.from(wrap.querySelectorAll('.stok-chip-tab')).forEach(function(el) {
    el.addEventListener('click', function() {
      var val = el.getAttribute('data-val') || null;
      stokSetFilter('boss', val === _filterBoss ? null : val);
    });
  });
}

function stokOpenSub(type, e) {
  if (e) e.stopPropagation();
  var el = document.getElementById(_miId(type));
  if (!el) return;

  // Tutup semua submenu lain, reset highlight
  ['boss','katalog','status'].forEach(function(t) {
    if (t !== type) {
      var s = document.getElementById('dd-filter-' + t);
      if (s) s.style.display = 'none';
      var m = document.getElementById(_miId(t));
      if (m) { m.style.background = ''; m.style.color = ''; }
    }
  });

  // Highlight item aktif
  el.style.background = 'var(--ink)';
  el.style.color = 'var(--cream)';

  // Render isi submenu dulu, posisi dihitung setelah innerHTML diisi
  var sub = document.getElementById('dd-filter-' + type);
  if (!sub) return;
  var rect = el.getBoundingClientRect();

  var opsi = [];
  if (type === 'boss') {
    // Kalau SKU Induk udah dipilih, opsi Supplier ikut menyempit ke supplier
    // yang punya baris dengan katalog tsb
    var rowsBoss = _filterKatalog ? _stokAllData.filter(function(r){ return (r.katalog||'') === _filterKatalog; }) : _stokAllData;
    opsi = [{ val: null, label: 'Semua Supplier' }].concat(
      [...new Set(rowsBoss.map(function(r){ return r.boss||''; }).filter(Boolean))].sort()
      .map(function(v){ return { val: v, label: v }; })
    );
  } else if (type === 'katalog') {
    // Kalau Supplier udah dipilih, opsi SKU Induk ikut menyempit ke SKU induk
    // yang punya baris dengan supplier tsb
    var rowsKatalog = _filterBoss ? _stokAllData.filter(function(r){ return (r.boss||'') === _filterBoss; }) : _stokAllData;
    opsi = [{ val: null, label: 'Semua SKU Induk' }].concat(
      [...new Set(rowsKatalog.map(function(r){ return r.katalog||''; }).filter(Boolean))].sort()
      .map(function(v){ return { val: v, label: v }; })
    );
  } else if (type === 'status') {
    opsi = [
      { val: null,    label: '⬜ Semua Status' },
      { val: 'fast',  label: '🟢 Fast — laku 7hr terakhir' },
      { val: 'slow',  label: '🟡 Slow — pernah laku, >7hr lalu' },
      { val: 'dead',  label: '🔴 Dead — belum laku 30hr' },
      { val: 'zombie',label: '⚫ Zombie — gak gerak 90hr' },
      { val: 'habis', label: '💀 Habis' },
    ];
  }

  var currVal = type === 'boss' ? _filterBoss : type === 'katalog' ? _filterKatalog : _filterStatusTab;
  sub.innerHTML = opsi.map(function(o) {
    var active = o.val === currVal;
    var valAttr = o.val === null ? '' : o.val;
    return '<div data-filter-type="' + type + '" data-filter-val="' + valAttr + '" data-filter-isnull="' + (o.val === null ? '1' : '0') + '"' +
      ' style="padding:8px 14px;cursor:pointer;font-size:13px;' +
      'background:' + (active ? 'var(--ink)' : 'transparent') + ';' +
      'color:' + (active ? 'var(--cream)' : 'inherit') + ';' +
      'border-bottom:1px solid var(--ovl-0_04);border-radius:4px;margin:1px 4px;transition:background .12s"' +
      ' onmouseover="this.style.background=\'var(--cream3)\'" onmouseout="this.style.background=\'' + (active ? 'var(--ink)' : 'transparent') + '\'">' + o.label + '</div>';
  }).join('');
  // Posisi: hitung setelah innerHTML diisi agar bisa ukur lebar
  sub.style.position = 'fixed';
  sub.style.top = rect.top + 'px';
  sub.style.left = '';
  sub.style.display = 'block';
  var subW = sub.offsetWidth || 200;
  var spaceRight = window.innerWidth - rect.right;
  if (spaceRight >= subW + 4) {
    sub.style.left = (rect.right + 4) + 'px';
  } else {
    var ddAll = document.getElementById('dd-filter-all');
    var ddRect = ddAll ? ddAll.getBoundingClientRect() : rect;
    sub.style.left = Math.max(4, ddRect.left - subW - 4) + 'px';
  }

  // Event listener langsung (bukan inline onclick) agar tidak ada masalah escaping
  Array.from(sub.querySelectorAll('[data-filter-type]')).forEach(function(el) {
    el.addEventListener('click', function(ev) {
      ev.stopPropagation();
      var t   = el.getAttribute('data-filter-type');
      var val = el.getAttribute('data-filter-isnull') === '1' ? null : el.getAttribute('data-filter-val');
      if (t === 'status') {
        _stokFilterSelectStatus(val);
      } else {
        stokSetFilter(t, val);
      }
    });
  });
}

// Status dipilih dari dalam dropdown Filter gabungan — reuse stokTabStatus()
// (fungsi yg sama dipakai tab desktop), lalu tutup submenu+dropdown utama.
function _stokFilterSelectStatus(val) {
  stokTabStatus(val === null ? 'all' : val);
  var s = document.getElementById('dd-filter-status');
  if (s) s.style.display = 'none';
  var m = document.getElementById('mi-status');
  if (m) { m.style.background = ''; m.style.color = ''; }
  var dd = document.getElementById('dd-filter-all');
  if (dd) dd.style.display = 'none';
  _stokUpdateFilterLabel();
}

function stokResetAllFilter() {
  _filterBoss           = null;
  _filterKatalog        = null;
  ['boss','katalog','status'].forEach(function(t) {
    var b = document.getElementById('badge-' + t);
    if (b) b.textContent = '';
    var s = document.getElementById('dd-filter-' + t);
    if (s) s.style.display = 'none';
    var m = document.getElementById('mi-' + t);
    if (m) { m.style.background = ''; m.style.color = ''; }
  });
  // Reset tab status juga
  _filterStatusTab = null;
  document.querySelectorAll('.stok-tab-btn').forEach(function(btn){
    btn.classList.toggle('stok-tab-active', btn.dataset.tab === 'all');
  });
  _stokUpdateFilterLabel();
  document.getElementById('dd-filter-all').style.display = 'none';
  filterStok();
}

function _stokUpdateFilterLabel() {
  var parts = [];
  if (_filterBoss)           parts.push(_filterBoss);
  if (_filterKatalog)        parts.push(_filterKatalog);
  if (_filterStatusTab)      parts.push((_stokStatusPillMeta[_filterStatusTab] || {}).label || _filterStatusTab);
  var lbl = document.getElementById('lbl-filter-all');
  if (lbl) lbl.textContent = parts.length ? parts.join(', ') : 'Filter';
  var btn = document.getElementById('btn-filter-all');
  if (btn) {
    btn.style.background = parts.length ? 'var(--ink)' : '';
    btn.style.color      = parts.length ? 'var(--cream)' : '';
  }
  // Badge di menu item Status
  var badgeStatus = document.getElementById('badge-status');
  if (badgeStatus) badgeStatus.textContent = _filterStatusTab ? '· ' + ((_stokStatusPillMeta[_filterStatusTab] || {}).label || _filterStatusTab) : '';
  // Tampilkan/sembunyikan tombol Reset luar (desktop, badge kecil)
  var resetBtn = document.getElementById('btn-stok-reset');
  if (resetBtn) resetBtn.style.display = parts.length ? 'inline-flex' : 'none';

  // Mobile: ikon Filter (SKU Induk) di-highlight kalau lagi aktif — gak ada
  // teks lagi (Status & Supplier udah jadi chip scroll sendiri)
  var filterMobileBtn = document.getElementById('btn-filter-all-mobile');
  if (filterMobileBtn) filterMobileBtn.classList.toggle('active', !!_filterKatalog);

  // Mobile: sinkronkan chip Status & Supplier (active state + cascading)
  _stokRenderStatusTabs();
  _stokRenderSupplierTabs();

  // Mobile: tombol reset dedicated — aktif (bisa di-tap) kalau ada filter apapun
  var anyActive   = !!(_filterBoss || _filterKatalog || _filterStatusTab);
  var resetMobile = document.getElementById('btn-stok-reset-mobile');
  if (resetMobile) {
    resetMobile.style.opacity       = anyActive ? '1' : '.35';
    resetMobile.style.pointerEvents = anyActive ? 'auto' : 'none';
  }
}

function stokSetFilter(type, val) {
  if (type === 'boss')            _filterBoss           = val;
  if (type === 'katalog')         _filterKatalog        = val;

  // Update badge di menu item
  var badgeEl = document.getElementById('badge-' + type);
  if (badgeEl) badgeEl.textContent = val ? '· ' + val : '';

  // Tutup semua submenu dan main dropdown secara langsung
  // (jangan pakai stokToggleFilterAll() karena bisa toggle arah salah)
  ['boss','katalog'].forEach(function(t) {
    var s = document.getElementById('dd-filter-' + t);
    if (s) s.style.display = 'none';
    var m = document.getElementById(_miId(t));
    if (m) { m.style.background = ''; m.style.color = ''; }
  });
  var dd = document.getElementById('dd-filter-all');
  if (dd) dd.style.display = 'none';

  _stokUpdateFilterLabel();
  filterStok();
}

document.addEventListener('click', function(e) {
  var dd  = document.getElementById('dd-filter-all');
  var btn = document.getElementById('btn-filter-all');
  var subs = ['dd-filter-boss','dd-filter-katalog','dd-filter-status'];
  // Cek apakah klik di dalam salah satu submenu
  var inSub = subs.some(function(id) {
    var s = document.getElementById(id);
    return s && s.contains(e.target);
  });
  if (inSub) return; // jangan tutup kalau klik di submenu
  // Cek apakah klik di dalam main menu items (mi-boss, mi-katalog, mi-status)
  var inMenuItem = ['mi-boss','mi-katalog','mi-status'].some(function(id) {
    var m = document.getElementById(id);
    return m && m.contains(e.target);
  });
  if (inMenuItem) return; // biarkan stokOpenSub yang handle
  if (dd && dd.style.display === 'block') {
    if (!dd.contains(e.target) && btn && !btn.contains(e.target)) {
      // Tutup semua submenu
      subs.forEach(function(id) {
        var s = document.getElementById(id);
        if (s) s.style.display = 'none';
      });
      ['boss','katalog','status'].forEach(function(t) {
        var m = document.getElementById('mi-' + t);
        if (m) { m.style.background = ''; m.style.color = ''; }
      });
      dd.style.display = 'none';
    }
  }
});






setTimeout(loadStok, 0);


// ─── SWIPE GESTURE — collapse stok-filter-bar di landscape touch ──
(function() {
  var _mq = window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: landscape)');
  function _init() {
    if (!_mq.matches) return;
    var zone = document.getElementById('stok-filter-bar');
    var bar  = document.getElementById('stok-filter-bar');
    if (!zone || !bar) return;
    initSwipeCollapse(zone, bar, 50);
  }
  setTimeout(_init, 300);
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'stok') return;
    setTimeout(function() {
      var bar = document.getElementById('stok-filter-bar');
      if (bar) bar.classList.remove('landscape-collapsed');
      _init();
    }, 80);
  });
})();
// ─── AUTO-RELOAD SAAT NAVIGASI KE HALAMAN INI ────────────────
// Debounce 250ms: cegah double-fire jika menu diklik cepat
(function() {
  var _t = null;
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'stok') return;
    clearTimeout(_t);
    _t = setTimeout(loadStok, 250);
  });
})();

