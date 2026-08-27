// ─── COST-PRODUKSI.JS — Ongkos Operator per SKU x Divisi + Jurnal Harian ───
// Modul BERDIRI SENDIRI (pola sama kayak hutang-supplier.js/gadag.js — gak
// share fungsi/CSS ke modul lain, biar fix di sini gak bisa ngerusak modul
// lain). Belum nyambung ke Kas (dibahas belakangan, per keputusan 26 Agu
// 2026) — section ini murni nyatet ongkos produksi buat sekarang.
//
// Konsep 4 tab (Overview / Jurnal Harian / Master Ongkos / Master Tukang):
//   - "Master Ongkos" : rate ongkos per lusin, unik per kombinasi SKU x
//                       Divisi (BUKAN per tukang — siapapun yang ngerjain
//                       di divisi itu buat SKU itu, ongkosnya sama).
//   - "Master Tukang" : daftar nama tukang/karyawan, bebas lintas-divisi
//                       (gak diiket ke 1 divisi tertentu).
//   - "Jurnal Harian" : transaksi qty pcs per tukang/divisi/SKU. Rate
//                       di-snapshot dari Master Ongkos PAS jurnal dibuat
//                       (kolom rate_snapshot) — biar histori gak berubah
//                       kalau rate naik/turun belakangan.
//   - "Overview"      : rekap total cost bulan berjalan + breakdown per
//                       divisi.
//
// Formula: total_cost = round( (qty_pcs / 12) * rate_snapshot )
//   (qty_pcs=12 & rate=100.000 → total=100.000; kurang dari 12 disesuaikan
//   proporsional — persis logic yang di-konfirmasi user 26 Agu 2026.)
//
// Tabel: cost_rate, cost_tukang, cost_jurnal (lihat migration SQL terpisah,
// total_cost adalah GENERATED COLUMN di DB — jangan pernah insert manual).

document.getElementById('page-cost-produksi').innerHTML = `
  <style>
    /* ── Full-height chain (pola sama kayak hutang-supplier/gadag/kas) ── */
    #page-cost-produksi.active { display:flex !important; flex-direction:column !important; }
    #page-cost-produksi { flex:1 1 0; min-height:0; height:100%; padding:10px; box-sizing:border-box; overflow:hidden; }

    #cp-hdr-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; flex-wrap:nowrap; gap:8px; flex-shrink:0; }
    #cp-hdr-left { display:flex; align-items:center; gap:6px; min-width:0; flex:1 1 auto; overflow:hidden; }
    #cp-hdr-refresh { flex:none; background:none; border:none; padding:2px; cursor:pointer; font-size:20px; line-height:1; color:var(--ink); }
    #cp-hdr-icon { font-size:20px; flex:none; }
    #cp-hdr-heading { font-size:20px; font-weight:800; letter-spacing:.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }

    #page-cost-produksi .cp-menu-wrap { display:flex; align-items:center; gap:16px; flex:none; }
    #page-cost-produksi .cp-tab-btn {
      background:none; border:none; border-bottom:2px solid transparent;
      padding:4px 1px 8px; font-size:13px; font-weight:800;
      color:var(--ink2); opacity:.65; cursor:pointer; white-space:nowrap;
      transition:opacity .15s ease, border-color .15s ease, color .15s ease;
    }
    #page-cost-produksi .cp-tab-btn:hover { opacity:.9; }
    #page-cost-produksi .cp-tab-btn.active { opacity:1; color:var(--ink); border-bottom-color:var(--ink); }
    #page-cost-produksi .cp-page-dots { display:none; }
    @media (max-width:900px) {
      #page-cost-produksi .cp-page-dots { display:flex; align-items:center; gap:6px; flex:none; }
      #page-cost-produksi .cp-page-dot { width:6px; height:6px; border-radius:50%; background:var(--ink); opacity:.35; transition:all .18s ease; cursor:pointer; }
      #page-cost-produksi .cp-page-dot.active { width:16px; border-radius:3px; opacity:1; }
      #page-cost-produksi .cp-menu-wrap { display:none; }
    }

    #cp-panels-wrap { flex:1 1 0; min-height:0; display:flex; flex-direction:column; }
    #page-cost-produksi .cp-panel { display:none; min-height:0; }
    #page-cost-produksi .cp-panel.active { display:flex; flex-direction:column; flex:1 1 0; min-height:0; overflow-y:auto; overflow-x:hidden; }

    #page-cost-produksi .rasio-card { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin-bottom:14px; flex-shrink:0; }
    #page-cost-produksi .rasio-item { background:var(--cream2); border:2px solid var(--ink3); padding:12px 14px; border-radius:2px; }
    #page-cost-produksi .r-label { font-size:11px; color:var(--ink3); font-weight:700; text-transform:uppercase; margin-bottom:4px; }
    #page-cost-produksi .r-value { font-size:20px; font-weight:700; }
    #page-cost-produksi .r-desc  { font-size:11px; color:var(--ink3); margin-top:2px; }

    #page-cost-produksi .cp-toolbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:12px; flex-shrink:0; }

    /* ── Tabel fit-to-screen di mobile — pola yang udah kebukti kerja di
       Master Barang (hutang-supplier.js) & Daftar Hutang (keuangan.js) ── */
    @media (max-width:600px) {
      #page-cost-produksi .tbl { table-layout:fixed; }
      #page-cost-produksi .tbl-wrap { overflow-x:hidden; }
      #page-cost-produksi .tbl th, #page-cost-produksi .tbl td { white-space:normal; word-break:break-word; font-size:11.5px; padding:6px 5px; }
      /* Master Ongkos kolomnya banyak (SKU + tiap divisi) — biar tetep kebaca,
         tabel ini scroll horizontal aja, gak dipaksa fixed-layout sempit. */
      #page-cost-produksi #cp-panel-rate .tbl { table-layout:auto; }
      #page-cost-produksi #cp-panel-rate .tbl th, #page-cost-produksi #cp-panel-rate .tbl td { white-space:nowrap; }
      #page-cost-produksi #cp-panel-rate .tbl-wrap { overflow-x:auto; }
    }

    /* ── Custom picker trigger (bukan native <select>) — tap buka
       bottom-sheet #cp-picker-sheet di bawah, bukan dropdown ngambang. ── */
    #page-cost-produksi .cp-picker-trigger {
      display:flex; align-items:center; justify-content:space-between; gap:6px;
      padding:9px 10px; border-radius:8px; border:1.5px solid var(--ink4);
      cursor:pointer; font-size:13px; background:var(--cream2); color:var(--ink);
    }
    #page-cost-produksi .cp-picker-trigger .cp-placeholder { color:var(--ink3); }
    #page-cost-produksi .cp-preview { margin-top:4px; font-size:13px; color:var(--ink2); }
    #page-cost-produksi .cp-preview b { color:var(--ink); font-size:15px; }

    /* ── Bottom-sheet picker (konsep BRIMO + list ala komen Instagram) ──
       Fixed full-screen, jadi CSS-nya gak di-scope ke #page-cost-produksi
       (biar gak ketiban overflow:hidden punya panel/modal). ── */
    #cp-picker-overlay {
      display:none; position:fixed; inset:0; z-index:700;
      background:rgba(0,0,0,.55); backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px);
    }
    #cp-picker-overlay.open { display:block; }
    #cp-picker-sheet {
      position:fixed; left:0; right:0; bottom:0; z-index:701;
      background:#1a1a1a; border-radius:20px 20px 0 0;
      transform:translateY(100%); transition:transform .28s cubic-bezier(.4,0,.2,1);
      padding-bottom:env(safe-area-inset-bottom,16px);
      max-height:80vh; display:none; flex-direction:column; overflow:hidden;
    }
    #cp-picker-sheet.open { display:flex; transform:translateY(0); }
    .cp-picker-handle { width:40px; height:4px; background:rgba(255,255,255,.18); border-radius:2px; margin:12px auto 4px; flex:none; }
    .cp-picker-sheet-title { text-align:center; font-size:16px; font-weight:700; color:var(--ink); padding:8px 16px 12px; letter-spacing:-.2px; flex:none; }
    .cp-picker-sheet-search-wrap { flex:none; padding:0 16px 10px; }
    #cp-picker-sheet-search {
      width:100%; box-sizing:border-box; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
      border-radius:10px; padding:11px 14px; font-size:15px; color:var(--ink); outline:none; -webkit-appearance:none;
    }
    #cp-picker-sheet-search::placeholder { color:var(--ink3); }
    #cp-picker-sheet-search:focus { border-color:rgba(255,255,255,.25); background:rgba(255,255,255,.09); }
    #cp-picker-sheet-list { flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; padding:4px 10px 12px; }
    #cp-picker-sheet-list .cp-sheet-item { font-size:15px; padding:12px 10px; border-radius:8px; cursor:pointer; }
    #cp-picker-sheet-list .cp-sheet-item:active,
    #cp-picker-sheet-list .cp-sheet-item.active { background:rgba(255,255,255,.08); color:var(--ink); }
    #cp-picker-sheet-list .cp-sheet-empty { padding:20px 10px; text-align:center; color:var(--ink3); font-style:italic; font-size:13px; }
    @media (min-width:768px) {
      #cp-picker-sheet {
        left:50%; right:auto; bottom:50%; transform:translate(-50%,50%) scale(.96);
        width:100%; max-width:400px; border-radius:16px; max-height:70vh; opacity:0;
        transition:transform .2s ease, opacity .2s ease;
      }
      #cp-picker-sheet.open { transform:translate(-50%,50%) scale(1); opacity:1; }
    }
  </style>

  <!-- HEADER: judul panel aktif + tab bar mendatar (desktop) / dot notch (mobile) -->
  <div id="cp-hdr-row">
    <div id="cp-hdr-left">
      <button id="cp-hdr-refresh" onclick="cpLoadAll()" title="Refresh"><i class="ti ti-refresh"></i></button>
      <i id="cp-hdr-icon" class="ti ti-chart-donut"></i>
      <div id="cp-hdr-heading">Overview</div>
    </div>
    <div class="cp-menu-wrap">
      <button id="cp-menu-item-overview" class="cp-tab-btn active" onclick="cpSwitchView('overview')">Overview</button>
      <button id="cp-menu-item-jurnal" class="cp-tab-btn" onclick="cpSwitchView('jurnal')">Jurnal Harian</button>
      <button id="cp-menu-item-rate" class="cp-tab-btn" onclick="cpSwitchView('rate')">Master Ongkos</button>
      <button id="cp-menu-item-tukang" class="cp-tab-btn" onclick="cpSwitchView('tukang')">Master Tukang</button>
    </div>
    <div id="cp-page-dots" class="cp-page-dots">
      <span class="cp-page-dot active" onclick="cpSwitchView('overview')"></span>
      <span class="cp-page-dot" onclick="cpSwitchView('jurnal')"></span>
      <span class="cp-page-dot" onclick="cpSwitchView('rate')"></span>
      <span class="cp-page-dot" onclick="cpSwitchView('tukang')"></span>
    </div>
  </div>

  <div id="cp-panels-wrap">

    <!-- ═══ OVERVIEW ═══ -->
    <div id="cp-panel-overview" class="cp-panel active">
      <div class="rasio-card">
        <div class="rasio-item"><div class="r-label">Total Cost Bulan Ini</div><div class="r-value" id="cp-ov-total">Rp0</div><div class="r-desc">akumulasi seluruh jurnal bulan berjalan</div></div>
        <div class="rasio-item"><div class="r-label">Jumlah Transaksi</div><div class="r-value" id="cp-ov-count">0</div><div class="r-desc">baris jurnal bulan berjalan</div></div>
        <div class="rasio-item"><div class="r-label">Rata-rata / Transaksi</div><div class="r-value" id="cp-ov-avg">Rp0</div><div class="r-desc">total cost dibagi jumlah transaksi</div></div>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-chart-bar"></i> Cost per Divisi (Bulan Ini)</div>
        <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
          <thead><tr><th>Divisi</th><th style="text-align:right">Total Cost</th></tr></thead>
          <tbody id="cp-ov-divisi-tbody"><tr><td colspan="2" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
        </table></div>
      </div>
    </div>

    <!-- ═══ JURNAL HARIAN ═══ -->
    <div id="cp-panel-jurnal" class="cp-panel">
      <div class="cp-toolbar">
        <button class="btn btn-primary btn-sm" onclick="cpOpenJurnalForm()"><i class="ti ti-plus"></i> Tambah Jurnal</button>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-notebook"></i> Jurnal Harian</div>
        <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
          <thead><tr><th>Tanggal</th><th>Divisi</th><th>Tukang</th><th>SKU / Varian</th><th style="text-align:right">Qty(pcs)</th><th style="text-align:right">Total</th></tr></thead>
          <tbody id="cp-jurnal-tbody"><tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
        </table></div>
      </div>
    </div>

    <!-- ═══ MASTER ONGKOS ═══ -->
    <div id="cp-panel-rate" class="cp-panel">
      <div class="cp-toolbar">
        <button class="btn btn-primary btn-sm" onclick="cpOpenRateForm()"><i class="ti ti-plus"></i> Tambah Rate</button>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-list-details"></i> Master Ongkos (per SKU x Divisi)</div>
        <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
          <thead><tr id="cp-rate-thead-row"><th>SKU</th></tr></thead>
          <tbody id="cp-rate-tbody"><tr><td colspan="7" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
        </table></div>
      </div>
    </div>

    <!-- ═══ MASTER TUKANG ═══ -->
    <div id="cp-panel-tukang" class="cp-panel">
      <div class="cp-toolbar">
        <button class="btn btn-primary btn-sm" onclick="cpOpenTukangForm()"><i class="ti ti-plus"></i> Tambah Tukang</button>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-users"></i> Master Tukang</div>
        <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
          <thead><tr><th>Nama</th><th>Divisi</th></tr></thead>
          <tbody id="cp-tukang-tbody"><tr><td colspan="2" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
        </table></div>
      </div>
    </div>

  </div><!-- /cp-panels-wrap -->

  <!-- ═══ MODAL: Tambah/Edit Jurnal ═══ -->
  <div class="modal-overlay" id="modal-cp-jurnal" onclick="if(event.target===this)hideModal('modal-cp-jurnal')">
    <div class="modal" style="max-width:480px;width:100%">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
        <div class="modal-title" id="cp-jrn-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-notebook"></i> Tambah Jurnal</div>
        <button onclick="hideModal('modal-cp-jurnal')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
      </div>
      <input type="hidden" id="cp-jrn-edit-id">
      <div class="form-group"><label>Tanggal</label><input type="date" id="cp-jrn-tanggal"></div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <div class="form-group" style="flex:1 1 140px;min-width:130px;margin-bottom:0">
          <label>Tukang</label>
          <div class="cp-picker-trigger" onclick="cpOpenTukangSheet()">
            <span id="cp-jrn-tukang-label" class="cp-placeholder">— Pilih Tukang —</span>
            <i class="ti ti-chevron-down"></i>
          </div>
        </div>
        <div class="form-group" style="flex:1 1 140px;min-width:130px;margin-bottom:0">
          <label>Divisi (otomatis)</label>
          <div id="cp-jrn-divisi-display" style="padding:9px 10px;border-radius:8px;border:1.5px solid var(--ink4);background:var(--cream3);color:var(--ink3);font-size:13px">auto ikut tukang</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <div class="form-group" style="flex:1 1 140px;min-width:130px;margin-bottom:0">
          <label>Ngerjain Apa (SKU)</label>
          <div class="cp-picker-trigger" onclick="cpOpenSkuSheetForJurnal()">
            <span id="cp-jrn-sku-label" class="cp-placeholder">— Pilih Tukang dulu —</span>
            <i class="ti ti-chevron-down"></i>
          </div>
        </div>
        <div class="form-group" id="cp-jrn-varian-group" style="flex:1 1 140px;min-width:130px;margin-bottom:0;display:none">
          <label>SKU Variasi</label>
          <div class="cp-picker-trigger" onclick="cpOpenVarianSheetForJurnal()">
            <span id="cp-jrn-varian-label" class="cp-placeholder">— Pilih Varian —</span>
            <i class="ti ti-chevron-down"></i>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:4px">
        <div class="form-group" style="flex:1 1 140px;min-width:130px;margin-bottom:0">
          <label>Total</label>
          <div id="cp-jrn-total-display" style="padding:9px 10px;border-radius:8px;border:1.5px solid var(--ink4);background:var(--cream3);color:var(--ink);font-size:15px;font-weight:700">Rp0</div>
        </div>
        <div class="form-group" style="flex:1 1 140px;min-width:130px;margin-bottom:0">
          <label>Qty (pcs)</label>
          <input type="text" inputmode="numeric" id="cp-jrn-qty" placeholder="0" oninput="cpUpdateJurnalPreview()">
        </div>
      </div>
      <div class="cp-preview" id="cp-jrn-preview">Rate: —</div>

      <div class="modal-actions" style="margin-top:16px">
        <button class="btn btn-danger" id="cp-jrn-del-btn" style="display:none" onclick="cpDeleteJurnal()"><i class="ti ti-trash"></i> Hapus</button>
        <button class="btn" onclick="hideModal('modal-cp-jurnal')">Batal</button>
        <button class="btn btn-primary" onclick="cpSaveJurnal()"><i class="ti ti-check"></i> Simpan</button>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL: Tambah/Edit Rate — 1 SKU, semua divisi jadi kolom input ═══ -->
  <div class="modal-overlay" id="modal-cp-rate" onclick="if(event.target===this)hideModal('modal-cp-rate')">
    <div class="modal" style="max-width:460px;width:100%">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
        <div class="modal-title" id="cp-rate-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-list-details"></i> Tambah Rate</div>
        <button onclick="hideModal('modal-cp-rate')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
      </div>
      <input type="hidden" id="cp-rate-edit-sku">
      <div class="form-group">
        <label>SKU</label>
        <div class="cp-picker-trigger" id="cp-rate-sku-trigger" onclick="cpOpenSkuSheetForRate()">
          <span id="cp-rate-sku-label" class="cp-placeholder">— Pilih SKU (Boss: DIMI) —</span>
          <i class="ti ti-chevron-down"></i>
        </div>
        <input type="hidden" id="cp-rate-sku">
      </div>
      <div id="cp-rate-fields"></div>
      <div class="form-group">
        <label>Divisi Lain (opsional, kalau ada divisi baru di luar 6 di atas)</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="cp-rate-extra-divisi" placeholder="nama divisi baru" style="flex:1">
          <input type="text" inputmode="numeric" id="cp-rate-extra-ongkos" placeholder="Rp/lusin" style="flex:1">
        </div>
      </div>
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn btn-danger" id="cp-rate-del-btn" style="display:none" onclick="cpDeleteRate()"><i class="ti ti-trash"></i> Hapus SKU Ini</button>
        <button class="btn" onclick="hideModal('modal-cp-rate')">Batal</button>
        <button class="btn btn-primary" onclick="cpSaveRate()"><i class="ti ti-check"></i> Simpan</button>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL: Tambah/Edit Tukang ═══ -->
  <div class="modal-overlay" id="modal-cp-tukang" onclick="if(event.target===this)hideModal('modal-cp-tukang')">
    <div class="modal" style="max-width:380px;width:100%">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
        <div class="modal-title" id="cp-tukang-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-users"></i> Tambah Tukang</div>
        <button onclick="hideModal('modal-cp-tukang')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
      </div>
      <input type="hidden" id="cp-tukang-edit-id">
      <div class="form-group"><label>Nama</label><input type="text" id="cp-tukang-nama" placeholder="mis. Budi"></div>
      <div class="form-group"><label>Divisi</label><input type="text" id="cp-tukang-divisi" placeholder="mis. Rajut"></div>
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn btn-danger" id="cp-tukang-del-btn" style="display:none" onclick="cpDeleteTukang()"><i class="ti ti-trash"></i> Hapus</button>
        <button class="btn" onclick="hideModal('modal-cp-tukang')">Batal</button>
        <button class="btn btn-primary" onclick="cpSaveTukang()"><i class="ti ti-check"></i> Simpan</button>
      </div>
    </div>
  </div>

  <!-- ═══ PICKER SHEET generik — konsep sama kayak sheet Uang Keluar
       (kas.js) & sheet Pilih Akun: slide dari bawah, search di atas,
       list scroll di bawahnya, tap = pilih & sheet nutup sendiri.
       Dipakai buat SEMUA picker input di Cost Produksi (Tukang, SKU). ═══ -->
  <div id="cp-picker-overlay" onclick="cpPickerSheetClose()"></div>
  <div id="cp-picker-sheet">
    <div class="cp-picker-handle"></div>
    <div id="cp-picker-sheet-title" class="cp-picker-sheet-title">Pilih</div>
    <div class="cp-picker-sheet-search-wrap">
      <input type="text" id="cp-picker-sheet-search" placeholder="Cari..."
        autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"
        oninput="cpPickerSheetFilter(this.value)">
    </div>
    <div id="cp-picker-sheet-list"></div>
  </div>
`;


// ─── STATE ──────────────────────────────────────────────────
var _cpJurnal = [];
var _cpRate   = [];
var _cpTukang = [];
var _cpProdukDimi = []; // katalog/varian dari Kelola Produk, boss=DIMI doang
var _cpView   = 'overview';
var _CP_VIEW_ORDER = ['overview', 'jurnal', 'rate', 'tukang'];
var _CP_VIEW_LABEL = {
  overview: { label: 'Overview',      icon: 'ti-chart-donut'   },
  jurnal:   { label: 'Jurnal Harian', icon: 'ti-notebook'      },
  rate:     { label: 'Master Ongkos', icon: 'ti-list-details'  },
  tukang:   { label: 'Master Tukang', icon: 'ti-users'         },
};

// Urutan divisi baku (sesuai alur produksi Turtleneck di spreadsheet lo).
// Divisi lain di luar list ini (via "Divisi Lain" pas Tambah Rate) otomatis
// nempel di kolom paling kanan, disortir abjad.
var CP_CANON_DIVISI = ['Rajut', 'Lingking', 'Obras', 'Som', 'Steam', 'Tilep'];

function cpDivisiColumns() {
  var extra = [];
  _cpRate.forEach(function(r) {
    if (!r.divisi) return;
    var inCanon = CP_CANON_DIVISI.some(function(c) { return c.toLowerCase() === r.divisi.toLowerCase(); });
    if (!inCanon && extra.indexOf(r.divisi) === -1) extra.push(r.divisi);
  });
  extra.sort();
  return CP_CANON_DIVISI.concat(extra);
}

function cpEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function cpEscJs(s) { return cpEsc(s).replace(/'/g, "\\'"); }

function cpFmtTgl(s) {
  if (!s) return '—';
  var p = String(s).split('-');
  return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0].slice(2)) : s;
}

// ─── LOAD ───────────────────────────────────────────────────
async function cpLoadAll() {
  try {
    var res = await Promise.all([
      dbGet('cost_jurnal', '&order=tanggal.desc,id.desc'),
      dbGet('cost_rate',   '&order=sku.asc'),
      dbGet('cost_tukang', '&order=nama.asc'),
      dbGet('produk',      '&boss=eq.DIMI&order=katalog.asc').catch(function() { return []; }),
    ]);
    _cpJurnal = res[0]; _cpRate = res[1]; _cpTukang = res[2]; _cpProdukDimi = res[3] || [];
  } catch (e) {
    alert('Gagal load Cost Produksi: ' + e.message);
    return;
  }
  cpRenderOverview();
  cpRenderJurnal();
  cpRenderRate();
  cpRenderTukang();
}

// ─── SWITCH VIEW (tab-bar desktop / dot mobile) ───────────────
function cpSwitchView(view) {
  _cpView = view;
  _CP_VIEW_ORDER.forEach(function(v) {
    var panel = document.getElementById('cp-panel-' + v);
    if (panel) panel.classList.toggle('active', v === view);
  });
  document.getElementById('cp-hdr-heading').textContent = _CP_VIEW_LABEL[view].label;
  document.getElementById('cp-hdr-icon').className = 'ti ' + _CP_VIEW_LABEL[view].icon;
  _CP_VIEW_ORDER.forEach(function(v) {
    var btn = document.getElementById('cp-menu-item-' + v);
    if (btn) btn.classList.toggle('active', v === view);
  });
  var dotsEl = document.getElementById('cp-page-dots');
  if (dotsEl) Array.prototype.forEach.call(dotsEl.children, function(dot, i) {
    dot.classList.toggle('active', _CP_VIEW_ORDER[i] === view);
  });
}

// ─── SWIPE antar panel (mobile only) — pola sama persis kayak Hutang
//     Supplier: edge-guard 24px biar gak rebutan sama swipe-back OS ──
(function() {
  var wrap = document.getElementById('cp-panels-wrap');
  if (!wrap) return;
  var EDGE = 24;
  var startX = 0, startY = 0, startT = 0, tracking = false, isHoriz = null;

  function goRelative(dir) {
    var idx = _CP_VIEW_ORDER.indexOf(_cpView);
    if (idx === -1) return;
    var next = (idx + dir + _CP_VIEW_ORDER.length) % _CP_VIEW_ORDER.length;
    cpSwitchView(_CP_VIEW_ORDER[next]);
  }

  wrap.addEventListener('touchstart', function(e) {
    var x = e.touches[0].clientX;
    if (x < EDGE || x > window.innerWidth - EDGE) { tracking = false; return; }
    startX = x; startY = e.touches[0].clientY; startT = Date.now();
    tracking = true; isHoriz = null;
  }, { passive: true });

  wrap.addEventListener('touchmove', function(e) {
    if (!tracking) return;
    var dx = e.touches[0].clientX - startX;
    var dy = e.touches[0].clientY - startY;
    if (isHoriz === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHoriz = Math.abs(dx) > Math.abs(dy);
    }
  }, { passive: true });

  wrap.addEventListener('touchend', function(e) {
    if (!tracking) return;
    tracking = false;
    if (!isHoriz) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dt = Date.now() - startT;
    var isFlick = Math.abs(dx) / Math.max(dt, 1) > 0.3;
    if (dx < -40 || (isFlick && dx < -20)) goRelative(1);
    else if (dx > 40 || (isFlick && dx > 20)) goRelative(-1);
  }, { passive: true });

  wrap.addEventListener('touchcancel', function() { tracking = false; isHoriz = null; }, { passive: true });
})();

// ─── RENDER: Overview ─────────────────────────────────────────
function cpRenderOverview() {
  var now = new Date();
  var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var thisMonth = _cpJurnal.filter(function(j) { return String(j.tanggal || '').slice(0, 7) === ym; });
  var total = thisMonth.reduce(function(s, j) { return s + (Number(j.total_cost) || 0); }, 0);
  var count = thisMonth.length;
  var avg = count ? Math.round(total / count) : 0;

  document.getElementById('cp-ov-total').textContent = fmtRpFull(total);
  document.getElementById('cp-ov-count').textContent = count;
  document.getElementById('cp-ov-avg').textContent   = fmtRpFull(avg);

  var byDivisi = {};
  thisMonth.forEach(function(j) {
    var d = j.divisi || '—';
    byDivisi[d] = (byDivisi[d] || 0) + (Number(j.total_cost) || 0);
  });
  var divisiList = Object.keys(byDivisi).sort(function(a, b) { return byDivisi[b] - byDivisi[a]; });
  var tbody = document.getElementById('cp-ov-divisi-tbody');
  tbody.innerHTML = divisiList.length
    ? divisiList.map(function(d) {
        return '<tr><td>' + cpEsc(d) + '</td><td style="text-align:right">' + fmtRpFull(byDivisi[d]) + '</td></tr>';
      }).join('')
    : '<tr><td colspan="2" style="color:var(--ink3);font-style:italic">Belum ada jurnal bulan ini</td></tr>';
}

// ─── RENDER: Jurnal Harian ─────────────────────────────────────
function cpRenderJurnal() {
  var tbody = document.getElementById('cp-jurnal-tbody');
  if (!_cpJurnal.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada jurnal. Tap "+ Tambah Jurnal" buat mulai.</td></tr>';
    return;
  }
  tbody.innerHTML = _cpJurnal.map(function(j) {
    var skuCell = cpEsc(j.sku) + (j.sku_variasi ? ' <span style="color:var(--ink3);font-size:11px">— ' + cpEsc(j.sku_variasi) + '</span>' : '');
    return '<tr onclick="cpOpenJurnalForm(' + j.id + ')" style="cursor:pointer">' +
      '<td>' + cpEsc(cpFmtTgl(j.tanggal)) + '</td>' +
      '<td>' + cpEsc(j.divisi) + '</td>' +
      '<td>' + cpEsc(j.tukang) + '</td>' +
      '<td>' + skuCell + '</td>' +
      '<td style="text-align:right">' + (j.qty_pcs || 0) + '</td>' +
      '<td style="text-align:right">' + fmtRpFull(j.total_cost) + '</td>' +
    '</tr>';
  }).join('');
}

// ─── RENDER: Master Ongkos (pivot — 1 baris per SKU, kolom = tiap divisi) ──
function cpRenderRate() {
  var cols = cpDivisiColumns();
  var theadRow = document.getElementById('cp-rate-thead-row');
  theadRow.innerHTML = '<th>SKU</th>' + cols.map(function(c) {
    return '<th style="text-align:right">' + cpEsc(c) + '</th>';
  }).join('');

  var skuMap = {};
  _cpRate.forEach(function(r) {
    if (!skuMap[r.sku]) skuMap[r.sku] = {};
    skuMap[r.sku][r.divisi.toLowerCase()] = r;
  });
  var skus = Object.keys(skuMap).sort();
  var tbody = document.getElementById('cp-rate-tbody');
  if (!skus.length) {
    tbody.innerHTML = '<tr><td colspan="' + (cols.length + 1) + '" style="color:var(--ink3);font-style:italic">Belum ada rate. Tap "+ Tambah Rate" buat mulai.</td></tr>';
    return;
  }
  tbody.innerHTML = skus.map(function(sku) {
    var cells = cols.map(function(c) {
      var row = skuMap[sku][c.toLowerCase()];
      return '<td style="text-align:right">' + (row ? fmtRpFull(row.ongkos_per_lusin) : '<span style="color:var(--ink3)">—</span>') + '</td>';
    }).join('');
    return '<tr onclick="cpOpenRateForm(\'' + cpEscJs(sku) + '\')" style="cursor:pointer"><td>' + cpEsc(sku) + '</td>' + cells + '</tr>';
  }).join('');
}

// ─── RENDER: Master Tukang ─────────────────────────────────────
function cpRenderTukang() {
  var tbody = document.getElementById('cp-tukang-tbody');
  if (!_cpTukang.length) {
    tbody.innerHTML = '<tr><td colspan="2" style="color:var(--ink3);font-style:italic">Belum ada tukang. Tap "+ Tambah Tukang" buat mulai.</td></tr>';
    return;
  }
  tbody.innerHTML = _cpTukang.map(function(t) {
    return '<tr onclick="cpOpenTukangForm(' + t.id + ')" style="cursor:pointer">' +
      '<td>' + cpEsc(t.nama) + '</td>' +
      '<td>' + (t.divisi ? cpEsc(t.divisi) : '<span style="color:var(--ink3);font-style:italic">belum diisi</span>') + '</td>' +
    '</tr>';
  }).join('');
}

// ─── PICKER SHEET generik (konsep BRIMO + list ala komen Instagram) ──
// Dipakai buat semua picker di Cost Produksi: Tukang & SKU (Jurnal Harian),
// SKU (Master Ongkos). Satu sheet dipakai bareng, konteksnya di _cpPickerCtx.
var _cpPickerCtx = null;      // { options, onSelect, selectedKey }
var _cpPickerFiltered = [];

function cpPickerSheetOpen(title, options, selectedKey, onSelect) {
  _cpPickerCtx = { options: options, onSelect: onSelect, selectedKey: selectedKey };
  document.getElementById('cp-picker-sheet-title').textContent = title;
  var searchEl = document.getElementById('cp-picker-sheet-search');
  if (searchEl) searchEl.value = '';
  cpPickerSheetRender('');
  document.getElementById('cp-picker-overlay').classList.add('open');
  document.getElementById('cp-picker-sheet').classList.add('open');
  setTimeout(function() { if (searchEl) searchEl.focus({ preventScroll: true }); }, 280);
}

function cpPickerSheetClose() {
  var overlay = document.getElementById('cp-picker-overlay');
  var sheet   = document.getElementById('cp-picker-sheet');
  if (overlay) overlay.classList.remove('open');
  if (sheet)   sheet.classList.remove('open');
  var searchEl = document.getElementById('cp-picker-sheet-search');
  if (searchEl) searchEl.blur();
  _cpPickerCtx = null;
}

function cpPickerSheetFilter(q) { cpPickerSheetRender(q); }

function cpPickerSheetRender(q) {
  if (!_cpPickerCtx) return;
  var ql = (q || '').toLowerCase().trim();
  _cpPickerFiltered = _cpPickerCtx.options.filter(function(o) {
    return !ql || (o.label + ' ' + (o.sub || '')).toLowerCase().indexOf(ql) !== -1;
  });
  var list = document.getElementById('cp-picker-sheet-list');
  list.innerHTML = _cpPickerFiltered.length
    ? _cpPickerFiltered.map(function(o, i) {
        var active = (o.key === _cpPickerCtx.selectedKey) ? ' active' : '';
        return '<div class="cp-sheet-item' + active + '" onclick="cpPickerSheetChoose(' + i + ')">' +
          cpEsc(o.label) + (o.sub ? ' <span style="color:var(--ink3);font-size:12px">— ' + cpEsc(o.sub) + '</span>' : '') +
        '</div>';
      }).join('')
    : '<div class="cp-sheet-empty">Gak ketemu</div>';
}

function cpPickerSheetChoose(i) {
  var opt = _cpPickerFiltered[i];
  if (!opt || !_cpPickerCtx) return;
  var cb = _cpPickerCtx.onSelect;
  cpPickerSheetClose();
  cb(opt.raw, opt.key);
}

// ─── FORM: Jurnal Harian (flow: Tukang → Divisi otomatis → SKU → Varian → Qty) ──
var _cpJrnSelSku = '', _cpJrnSelDivisi = '', _cpJrnSelTukang = '', _cpJrnSelVarian = '', _cpJrnRate = 0;

function cpOpenJurnalForm(id) {
  document.getElementById('cp-jrn-edit-id').value = id || '';
  document.getElementById('cp-jrn-form-title').innerHTML = id
    ? '<i class="ti ti-edit"></i> Edit Jurnal'
    : '<i class="ti ti-notebook"></i> Tambah Jurnal';
  document.getElementById('cp-jrn-del-btn').style.display = id ? '' : 'none';

  var row = id ? _cpJurnal.find(function(j) { return j.id == id; }) : null;
  document.getElementById('cp-jrn-tanggal').value = row ? row.tanggal : new Date().toISOString().slice(0, 10);
  document.getElementById('cp-jrn-qty').value = row ? row.qty_pcs : '';

  _cpJrnSelSku    = row ? row.sku            : '';
  _cpJrnSelDivisi = row ? row.divisi         : '';
  _cpJrnSelTukang = row ? row.tukang         : '';
  _cpJrnSelVarian = row ? (row.sku_variasi || '') : '';
  _cpJrnRate      = 0;

  cpSetJrnLabel('tukang', _cpJrnSelTukang);
  document.getElementById('cp-jrn-divisi-display').textContent = _cpJrnSelDivisi || 'auto ikut tukang';

  if (_cpJrnSelDivisi) {
    cpSetJrnLabel('sku', _cpJrnSelSku);
    var rr = _cpRate.find(function(r) { return r.sku === _cpJrnSelSku && r.divisi.toLowerCase() === _cpJrnSelDivisi.toLowerCase(); });
    _cpJrnRate = rr ? Number(rr.ongkos_per_lusin) : 0;
  } else {
    cpSetJrnLabel('sku', '');
  }
  cpRefreshVarianField();

  cpUpdateJurnalPreview();
  showModal('modal-cp-jurnal');
}

function cpSetJrnLabel(field, val) {
  var el = document.getElementById('cp-jrn-' + field + '-label');
  if (!el) return;
  if (val) {
    el.textContent = val;
    el.classList.remove('cp-placeholder');
  } else {
    el.textContent = field === 'tukang' ? '— Pilih Tukang —'
                    : field === 'sku'    ? (_cpJrnSelTukang ? '— Pilih SKU —' : '— Pilih Tukang dulu —')
                    : '— Pilih Varian —';
    el.classList.add('cp-placeholder');
  }
}

// Varian (sku_variasi) buat SKU yang lagi dipilih — ditarik dari produk
// Dimi yang udah di-load (_cpProdukDimi). Field Varian cuma muncul kalau
// katalog itu beneran punya data varian; kalau cuma 1 varian, auto-pilih
// biar gak nge-ganggu user pas cuma ada 1 opsi doang.
function cpJrnVarianOptions() {
  if (!_cpJrnSelSku) return [];
  return _cpProdukDimi.filter(function(p) { return p.katalog === _cpJrnSelSku && p.sku_variasi; });
}

function cpRefreshVarianField() {
  var group = document.getElementById('cp-jrn-varian-group');
  var opts = cpJrnVarianOptions();
  if (!opts.length) {
    group.style.display = 'none';
    _cpJrnSelVarian = '';
    return;
  }
  group.style.display = '';
  if (opts.length === 1 && !_cpJrnSelVarian) {
    _cpJrnSelVarian = opts[0].sku_variasi;
  }
  // Kalau varian yang lagi kesimpen (mis. dari edit) udah gak ada lagi
  // di daftar opsi (katalog beda), reset.
  if (_cpJrnSelVarian && !opts.some(function(p) { return p.sku_variasi === _cpJrnSelVarian; })) {
    _cpJrnSelVarian = '';
  }
  cpSetJrnLabel('varian', _cpJrnSelVarian);
}

// Sheet: Pilih Tukang — cuma yang udah punya divisi yang bisa dipilih.
function cpOpenTukangSheet() {
  var rows = _cpTukang.filter(function(t) { return t.divisi; });
  if (!rows.length) { alert('Belum ada tukang dengan divisi. Lengkapi dulu di Master Tukang.'); return; }
  var opts = rows.map(function(t) { return { label: t.nama, sub: t.divisi, key: t.nama + '|' + t.divisi, raw: t }; });
  var selKey = _cpJrnSelTukang ? (_cpJrnSelTukang + '|' + _cpJrnSelDivisi) : null;
  cpPickerSheetOpen('Pilih Tukang', opts, selKey, function(t) {
    _cpJrnSelTukang = t.nama;
    _cpJrnSelDivisi = t.divisi;
    _cpJrnSelSku = '';
    _cpJrnSelVarian = '';
    _cpJrnRate = 0;
    cpSetJrnLabel('tukang', t.nama);
    document.getElementById('cp-jrn-divisi-display').textContent = t.divisi;
    cpSetJrnLabel('sku', '');
    cpRefreshVarianField();
    cpUpdateJurnalPreview();
  });
}

// Sheet: Ngerjain Apa (SKU) — difilter cuma SKU yang punya rate di divisi
// tukang yang lagi dipilih.
function cpOpenSkuSheetForJurnal() {
  if (!_cpJrnSelDivisi) { alert('Pilih Tukang dulu.'); return; }
  var rows = _cpRate.filter(function(r) { return r.divisi.toLowerCase() === _cpJrnSelDivisi.toLowerCase(); });
  if (!rows.length) { alert('Divisi "' + _cpJrnSelDivisi + '" belum punya rate SKU apapun — isi dulu di Master Ongkos.'); return; }
  var opts = rows.map(function(r) { return { label: r.sku, sub: null, key: r.sku, raw: r.sku }; });
  cpPickerSheetOpen('Ngerjain Apa (SKU)', opts, _cpJrnSelSku, function(sku) {
    _cpJrnSelSku = sku;
    _cpJrnSelVarian = '';
    cpSetJrnLabel('sku', sku);
    var rr = _cpRate.find(function(r) { return r.sku === sku && r.divisi.toLowerCase() === _cpJrnSelDivisi.toLowerCase(); });
    _cpJrnRate = rr ? Number(rr.ongkos_per_lusin) : 0;
    cpRefreshVarianField();
    cpUpdateJurnalPreview();
  });
}

// Sheet: Varian — daftar sku_variasi dari katalog yang lagi dipilih.
function cpOpenVarianSheetForJurnal() {
  var opts = cpJrnVarianOptions();
  if (!opts.length) return;
  var sheetOpts = opts.map(function(p) { return { label: p.sku_variasi, sub: null, key: p.sku_variasi, raw: p.sku_variasi }; });
  cpPickerSheetOpen('Pilih Varian', sheetOpts, _cpJrnSelVarian, function(varian) {
    _cpJrnSelVarian = varian;
    cpSetJrnLabel('varian', varian);
  });
}

function cpUpdateJurnalPreview() {
  var qty = parseInt((document.getElementById('cp-jrn-qty').value || '0').replace(/[^0-9]/g, ''), 10) || 0;
  var total = _cpJrnRate ? Math.round((qty / 12) * _cpJrnRate) : 0;
  document.getElementById('cp-jrn-total-display').textContent = fmtRpFull(total);
  document.getElementById('cp-jrn-preview').textContent =
    'Rate: ' + (_cpJrnRate ? fmtRpFull(_cpJrnRate) + '/lusin' : '—');
}

async function cpSaveJurnal() {
  var id = document.getElementById('cp-jrn-edit-id').value;
  var tanggal = document.getElementById('cp-jrn-tanggal').value;
  var qty = parseInt((document.getElementById('cp-jrn-qty').value || '0').replace(/[^0-9]/g, ''), 10) || 0;
  if (!tanggal) return alert('Tanggal wajib diisi.');
  if (!_cpJrnSelTukang) return alert('Pilih Tukang dulu.');
  if (!_cpJrnSelDivisi) return alert('Divisi belum ke-set — pilih ulang tukangnya.');
  if (!_cpJrnSelSku) return alert('Pilih SKU (ngerjain apa) dulu.');
  if (cpJrnVarianOptions().length && !_cpJrnSelVarian) return alert('Pilih Varian dulu — biar jelas warna/model apa yang dikerjain.');
  if (qty <= 0) return alert('Qty (pcs) harus lebih dari 0.');

  var rr = _cpRate.find(function(r) { return r.sku === _cpJrnSelSku && r.divisi.toLowerCase() === _cpJrnSelDivisi.toLowerCase(); });
  if (!rr) return alert('Rate buat kombinasi SKU + Divisi ini belum ada — tambahin dulu di Master Ongkos.');

  var payload = {
    tanggal: tanggal, divisi: _cpJrnSelDivisi, tukang: _cpJrnSelTukang, sku: _cpJrnSelSku,
    sku_variasi: _cpJrnSelVarian || null,
    qty_pcs: qty, rate_snapshot: Number(rr.ongkos_per_lusin)
  };
  try {
    if (id) await dbUpdate('cost_jurnal', id, payload);
    else    await dbInsert('cost_jurnal', payload);
  } catch (e) { return alert('Gagal simpan: ' + e.message); }
  hideModal('modal-cp-jurnal');
  cpLoadAll();
}

async function cpDeleteJurnal() {
  var id = document.getElementById('cp-jrn-edit-id').value;
  if (!id) return;
  if (!confirm('Hapus jurnal ini?')) return;
  try { await dbDelete('cost_jurnal', id); } catch (e) { return alert('Gagal hapus: ' + e.message); }
  hideModal('modal-cp-jurnal');
  cpLoadAll();
}

// ─── FORM: Master Ongkos (1 SKU, semua divisi jadi kolom input) ──
function cpOpenRateForm(sku) {
  document.getElementById('cp-rate-edit-sku').value = sku || '';
  document.getElementById('cp-rate-form-title').innerHTML = sku
    ? '<i class="ti ti-edit"></i> Edit Rate — ' + cpEsc(sku)
    : '<i class="ti ti-list-details"></i> Tambah Rate';
  document.getElementById('cp-rate-del-btn').style.display = sku ? '' : 'none';

  document.getElementById('cp-rate-sku').value = sku || '';
  var trigger = document.getElementById('cp-rate-sku-trigger');
  var label = document.getElementById('cp-rate-sku-label');
  if (sku) {
    label.textContent = sku;
    label.classList.remove('cp-placeholder');
    trigger.style.opacity = '.6';
    trigger.style.pointerEvents = 'none'; // hindari rename SKU pas edit (biar gak numpuk baris nyasar)
  } else {
    label.textContent = '— Pilih SKU (Boss: DIMI) —';
    label.classList.add('cp-placeholder');
    trigger.style.opacity = '';
    trigger.style.pointerEvents = '';
  }

  var cols = cpDivisiColumns();
  var byDivisiLower = {};
  if (sku) {
    _cpRate.filter(function(r) { return r.sku === sku; }).forEach(function(r) {
      byDivisiLower[r.divisi.toLowerCase()] = r;
    });
  }

  document.getElementById('cp-rate-fields').innerHTML = cols.map(function(c) {
    var fid = 'cp-rate-f-' + c.replace(/[^a-z0-9]/gi, '_');
    return '<div class="form-group"><label>' + cpEsc(c) + ' (Rp/lusin)</label>' +
      '<input type="text" inputmode="numeric" id="' + fid + '" placeholder="0"></div>';
  }).join('');
  cols.forEach(function(c) {
    var fid = 'cp-rate-f-' + c.replace(/[^a-z0-9]/gi, '_');
    idrInput(fid);
    var row = byDivisiLower[c.toLowerCase()];
    idrSet(fid, row ? row.ongkos_per_lusin : 0);
  });

  document.getElementById('cp-rate-extra-divisi').value = '';
  document.getElementById('cp-rate-extra-ongkos').value = '';
  idrInput('cp-rate-extra-ongkos');

  showModal('modal-cp-rate');
}

// SKU picker khusus Master Ongkos — ditarik dari Kelola Produk (tabel
// `produk`), CUMA katalog yang Boss/Supplier-nya DIMI (per keputusan 27
// Agu 2026). 1 opsi = 1 katalog (bukan per-varian), karena rate ongkos
// emang berlaku buat semua varian dalam katalog itu (samain kayak
// spreadsheet asli — "Turtleneck" 1 baris ongkos buat semua warnanya).
function cpOpenSkuSheetForRate() {
  if (!_cpProdukDimi.length) {
    alert('Belum ada produk dengan Boss = DIMI di Kelola Produk.');
    return;
  }
  var byKatalog = {};
  _cpProdukDimi.forEach(function(p) {
    if (!p.katalog) return;
    byKatalog[p.katalog] = (byKatalog[p.katalog] || 0) + 1;
  });
  var opts = Object.keys(byKatalog).sort().map(function(k) {
    return { label: k, sub: byKatalog[k] + ' varian', key: k, raw: k };
  });
  var currentSku = document.getElementById('cp-rate-sku').value;
  cpPickerSheetOpen('Pilih SKU (Boss: DIMI)', opts, currentSku, function(katalog) {
    document.getElementById('cp-rate-sku').value = katalog;
    var label = document.getElementById('cp-rate-sku-label');
    label.textContent = katalog;
    label.classList.remove('cp-placeholder');
  });
}

async function cpSaveRate() {
  var sku = document.getElementById('cp-rate-sku').value.trim();
  if (!sku) return alert('SKU wajib diisi.');

  var cols = cpDivisiColumns();
  var jobs = [];

  cols.forEach(function(c) {
    var fid = 'cp-rate-f-' + c.replace(/[^a-z0-9]/gi, '_');
    var val = idrVal(fid);
    var existing = _cpRate.find(function(r) { return r.sku === sku && r.divisi.toLowerCase() === c.toLowerCase(); });
    if (val > 0) {
      jobs.push(existing
        ? dbUpdate('cost_rate', existing.id, { ongkos_per_lusin: val })
        : dbInsert('cost_rate', { sku: sku, divisi: c, ongkos_per_lusin: val }));
    } else if (existing) {
      jobs.push(dbDelete('cost_rate', existing.id));
    }
  });

  var extraDivisi = document.getElementById('cp-rate-extra-divisi').value.trim();
  var extraVal = idrVal('cp-rate-extra-ongkos');
  if (extraDivisi && extraVal > 0) {
    var existingExtra = _cpRate.find(function(r) { return r.sku === sku && r.divisi.toLowerCase() === extraDivisi.toLowerCase(); });
    jobs.push(existingExtra
      ? dbUpdate('cost_rate', existingExtra.id, { ongkos_per_lusin: extraVal })
      : dbInsert('cost_rate', { sku: sku, divisi: extraDivisi, ongkos_per_lusin: extraVal }));
  }

  try {
    await Promise.all(jobs);
  } catch (e) { return alert('Gagal simpan: ' + e.message); }
  hideModal('modal-cp-rate');
  cpLoadAll();
}

async function cpDeleteRate() {
  var sku = document.getElementById('cp-rate-edit-sku').value;
  if (!sku) return;
  if (!confirm('Hapus semua rate buat SKU "' + sku + '" (semua divisi)? Jurnal yang udah kepake gak ikut kehapus (rate_snapshot udah tersimpan sendiri).')) return;
  var rows = _cpRate.filter(function(r) { return r.sku === sku; });
  try {
    await Promise.all(rows.map(function(r) { return dbDelete('cost_rate', r.id); }));
  } catch (e) { return alert('Gagal hapus: ' + e.message); }
  hideModal('modal-cp-rate');
  cpLoadAll();
}

// ─── FORM: Master Tukang ────────────────────────────────────────
function cpOpenTukangForm(id) {
  document.getElementById('cp-tukang-edit-id').value = id || '';
  document.getElementById('cp-tukang-form-title').innerHTML = id
    ? '<i class="ti ti-edit"></i> Edit Tukang'
    : '<i class="ti ti-users"></i> Tambah Tukang';
  document.getElementById('cp-tukang-del-btn').style.display = id ? '' : 'none';

  var row = id ? _cpTukang.find(function(t) { return t.id == id; }) : null;
  document.getElementById('cp-tukang-nama').value = row ? row.nama : '';
  document.getElementById('cp-tukang-divisi').value = row ? (row.divisi || '') : '';
  showModal('modal-cp-tukang');
}

async function cpSaveTukang() {
  var id = document.getElementById('cp-tukang-edit-id').value;
  var nama = document.getElementById('cp-tukang-nama').value.trim();
  var divisi = document.getElementById('cp-tukang-divisi').value.trim();
  if (!nama) return alert('Nama wajib diisi.');
  if (!divisi) return alert('Divisi wajib diisi.');

  var payload = { nama: nama, divisi: divisi, aktif: true };
  try {
    if (id) await dbUpdate('cost_tukang', id, payload);
    else    await dbInsert('cost_tukang', payload);
  } catch (e) { return alert('Gagal simpan: ' + e.message); }
  hideModal('modal-cp-tukang');
  cpLoadAll();
}

async function cpDeleteTukang() {
  var id = document.getElementById('cp-tukang-edit-id').value;
  if (!id) return;
  if (!confirm('Hapus tukang ini?')) return;
  try { await dbDelete('cost_tukang', id); } catch (e) { return alert('Gagal hapus: ' + e.message); }
  hideModal('modal-cp-tukang');
  cpLoadAll();
}

// ─── HOOK zenot:page ─────────────────────────────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail && e.detail.page === 'cost-produksi') cpLoadAll();
});
