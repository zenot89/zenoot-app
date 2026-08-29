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
    #page-cost-produksi .cp-rate-toolbar-mobile { display:none; }
    @media (max-width:600px) {
      #page-cost-produksi .cp-rate-toolbar-desktop { display:none !important; }
      #page-cost-produksi .cp-rate-toolbar-mobile { display:inline-flex !important; }
    }

    /* ── Tabel fit-to-screen di mobile — pola yang udah kebukti kerja di
       Master Barang (hutang-supplier.js) & Daftar Hutang (keuangan.js) ── */
    @media (max-width:600px) {
      #page-cost-produksi .tbl { table-layout:fixed; }
      #page-cost-produksi .tbl-wrap { overflow-x:hidden; }
      #page-cost-produksi .tbl th, #page-cost-produksi .tbl td { white-space:normal; word-break:break-word; font-size:11.5px; padding:6px 5px; }
      /* Master Ongkos: kolom per-divisi (Rajut/Lingking/dst — jumlahnya
         dinamis, nth-child(n+4) nangkep semuanya) disembunyiin di mobile,
         sisain 3 kolom fix (SKU Induk / SKU Variasi / Total Cost) — biar
         GAK perlu geser horizontal (itu udah kepake buat swipe ganti tab).
         Breakdown per-divisi lengkap tetep bisa diliat: tap barisnya. */
      #page-cost-produksi #cp-panel-rate .tbl th:nth-child(n+4),
      #page-cost-produksi #cp-panel-rate .tbl td:nth-child(n+4) { display:none; }
      #page-cost-produksi #cp-panel-rate .tbl th:nth-child(1),
      #page-cost-produksi #cp-panel-rate .tbl td:nth-child(1) { width:32%; font-size:11px; padding:6px 4px 6px 8px; }
      #page-cost-produksi #cp-panel-rate .tbl th:nth-child(2),
      #page-cost-produksi #cp-panel-rate .tbl td:nth-child(2) { width:38%; font-size:11px; padding:6px 4px; }
      #page-cost-produksi #cp-panel-rate .tbl th:nth-child(3),
      #page-cost-produksi #cp-panel-rate .tbl td:nth-child(3) { width:30%; font-size:11px; padding:6px 8px 6px 4px; }

      /* Jurnal Harian: sembunyiin Divisi(kolom-2), SKU Variasi(kolom-5,
         sekarang kolom terpisah dari SKU Induk buat versi desktop) &
         Total(kolom-7) di mobile, sisain Tanggal(Hari) / Tukang / SKU
         Induk / Qty — muat tanpa geser. Variasi tetep keliatan nempel
         jadi baris ke-2 di sel SKU Induk (.cp-jrn-variasi-mobile).
         Tap baris buat liat divisi & total lengkapnya. */
      #page-cost-produksi #cp-panel-jurnal .tbl th:nth-child(2),
      #page-cost-produksi #cp-panel-jurnal .tbl td:nth-child(2),
      #page-cost-produksi #cp-panel-jurnal .tbl th:nth-child(5),
      #page-cost-produksi #cp-panel-jurnal .tbl td:nth-child(5),
      #page-cost-produksi #cp-panel-jurnal .tbl th:nth-child(7),
      #page-cost-produksi #cp-panel-jurnal .tbl td:nth-child(7) { display:none; }
      #page-cost-produksi #cp-panel-jurnal .cp-jrn-variasi-mobile { display:inline !important; }
      #page-cost-produksi #cp-panel-jurnal .tbl th:nth-child(1),
      #page-cost-produksi #cp-panel-jurnal .tbl td:nth-child(1) { width:24%; font-size:10.5px; padding:6px 4px 6px 8px; }
      #page-cost-produksi #cp-panel-jurnal .tbl th:nth-child(3),
      #page-cost-produksi #cp-panel-jurnal .tbl td:nth-child(3) { width:22%; font-size:11px; padding:6px 4px; }
      #page-cost-produksi #cp-panel-jurnal .tbl th:nth-child(4),
      #page-cost-produksi #cp-panel-jurnal .tbl td:nth-child(4) { width:36%; font-size:11px; padding:6px 4px; }
      #page-cost-produksi #cp-panel-jurnal .tbl th:nth-child(6),
      #page-cost-produksi #cp-panel-jurnal .tbl td:nth-child(6) { width:18%; font-size:11px; padding:6px 8px 6px 4px; }
    }

    /* ── Master Tukang: desktop pivot (divisi jadi kolom mendatar) vs
       mobile list (Nama|Divisi, JANGAN diubah — per keputusan 28 Agu 2026,
       mobile masih dipikirin nanti) ── */
    #cp-tukang-pivot-wrap { display:none; }
    @media (min-width:601px) {
      #cp-tukang-list-wrap  { display:none !important; }
      #cp-tukang-pivot-wrap { display:block !important; }
      #cp-tukang-pivot-tbody td { cursor:pointer; }
      #cp-tukang-pivot-tbody td:empty { cursor:default; }
    }

    /* ── Custom picker trigger (bukan native <select>) — tap buka
       bottom-sheet #cp-picker-sheet di bawah, bukan dropdown ngambang. ── */
    #page-cost-produksi .cp-picker-trigger {
      display:flex; align-items:center; justify-content:space-between; gap:6px;
      padding:9px 10px; border-radius:8px; border:1.5px solid var(--ink4);
      cursor:pointer; font-size:13px; background:var(--cream2); color:var(--ink);
    }
    #page-cost-produksi .cp-picker-trigger .cp-placeholder { color:var(--ink3); }

    /* ── Checkbox checklist varian (Edit per Variant) — override CSS
       global .form-group input yang bikin checkbox keilangan tampilan
       (appearance:none, dikira input teks biasa). ── */
    #page-cost-produksi #cp-bulk-variant-list input[type="checkbox"] {
      -webkit-appearance:auto; appearance:auto;
      width:18px; height:18px; min-height:0; min-width:0; flex:none;
      padding:0; margin:0; border-radius:4px; background:var(--cream3);
      border:1.5px solid var(--ink4); accent-color:var(--ink);
      cursor:pointer;
    }
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
      <div class="cp-toolbar">
        <div class="cp-picker-trigger" style="max-width:220px" onclick="cpOpenOvPeriodSheet()">
          <span id="cp-ov-period-label">Minggu Ini</span>
          <i class="ti ti-chevron-down"></i>
        </div>
      </div>
      <div class="rasio-card">
        <div class="rasio-item"><div class="r-label" id="cp-ov-total-label">Total Cost Minggu Ini</div><div class="r-value" id="cp-ov-total">Rp0</div><div class="r-desc" id="cp-ov-total-desc">akumulasi seluruh jurnal periode ini</div></div>
        <div class="rasio-item"><div class="r-label">Hasil Rajut</div><div class="r-value" id="cp-ov-rajut">0 pcs</div><div class="r-desc">total qty produksi Rajut periode ini</div></div>
      </div>
      <div class="card">
        <div class="card-title" id="cp-ov-tbl-title"><i class="ti ti-chart-bar"></i> Cost per Tukang (Minggu Ini)</div>
        <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
          <thead><tr><th>Tukang</th><th>Divisi</th><th style="text-align:right">Total Cost</th></tr></thead>
          <tbody id="cp-ov-divisi-tbody"><tr><td colspan="3" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
        </table></div>
      </div>
    </div>

    <!-- ═══ JURNAL HARIAN ═══ -->
    <div id="cp-panel-jurnal" class="cp-panel">
      <div class="cp-toolbar">
        <button class="btn btn-primary btn-sm" onclick="cpOpenJurnalForm()"><i class="ti ti-plus"></i> Tambah Jurnal</button>
        <button class="btn btn-sm" onclick="cpExportJurnalPDF()"><i class="ti ti-file-export"></i> Export PDF (by Tukang)</button>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-notebook"></i> Jurnal Harian</div>
        <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
          <thead><tr><th>Tanggal</th><th>Divisi</th><th>Tukang</th><th>SKU Induk</th><th>SKU Variasi</th><th style="text-align:right">Qty(pcs)</th><th style="text-align:right">Total</th></tr></thead>
          <tbody id="cp-jurnal-tbody"><tr><td colspan="7" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
        </table></div>
      </div>
    </div>

    <!-- ═══ MASTER ONGKOS ═══ -->
    <div id="cp-panel-rate" class="cp-panel">
      <div class="cp-toolbar">
        <div class="cp-rate-toolbar-desktop" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="cpOpenRateBulk('sku')"><i class="ti ti-edit"></i> Edit per SKU</button>
          <button class="btn btn-primary btn-sm" onclick="cpOpenRateBulk('variant')"><i class="ti ti-list-check"></i> Edit per Variant</button>
          <button class="btn btn-primary btn-sm" onclick="cpOpenRateBulk('divisi')"><i class="ti ti-category"></i> Edit per Divisi</button>
        </div>
        <button class="btn btn-primary btn-sm cp-rate-toolbar-mobile" onclick="cpOpenRateModeSheet()">
          <i class="ti ti-edit"></i> Edit Rate <i class="ti ti-chevron-down" style="margin-left:2px"></i>
        </button>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-list-details"></i> Master Ongkos (per SKU x Variasi x Divisi)</div>
        <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
          <thead><tr id="cp-rate-thead-row"><th>SKU Induk</th><th>SKU Variasi</th><th style="text-align:right">Total Cost</th></tr></thead>
          <tbody id="cp-rate-tbody"><tr><td colspan="9" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
        </table></div>
      </div>
    </div>

    <!-- ═══ MASTER TUKANG ═══ -->
    <div id="cp-panel-tukang" class="cp-panel">
      <div class="cp-toolbar">
        <span id="cp-tukang-total-label" style="color:var(--ink2);font-size:13px;font-weight:700">Total Tukang: 0</span>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="cpOpenTukangForm()"><i class="ti ti-plus"></i> Tambah Tukang</button>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-users"></i> Master Tukang</div>
        <!-- Mobile (≤600px): list No|Nama|Divisi — JANGAN diubah dulu, per keputusan 28 Agu 2026 -->
        <div class="tbl-wrap" id="cp-tukang-list-wrap" style="overflow-x:auto"><table class="tbl">
          <thead><tr><th style="width:40px">No</th><th>Nama</th><th>Divisi</th></tr></thead>
          <tbody id="cp-tukang-tbody"><tr><td colspan="3" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
        </table></div>
        <!-- Desktop (>600px): pivot — divisi jadi kolom mendatar, nama tukang ditumpuk vertikal per kolom -->
        <div class="tbl-wrap" id="cp-tukang-pivot-wrap" style="overflow-x:auto;display:none"><table class="tbl">
          <thead><tr id="cp-tukang-pivot-thead"></tr></thead>
          <tbody id="cp-tukang-pivot-tbody"></tbody>
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
      <input type="hidden" id="cp-rate-edit-variasi">
      <div class="form-group">
        <label>SKU Induk</label>
        <div class="cp-picker-trigger" id="cp-rate-sku-trigger" onclick="cpOpenSkuSheetForRate()">
          <span id="cp-rate-sku-label" class="cp-placeholder">— Pilih SKU (Boss: DIMI) —</span>
          <i class="ti ti-chevron-down"></i>
        </div>
        <input type="hidden" id="cp-rate-sku">
      </div>
      <div class="form-group">
        <label>SKU Variasi</label>
        <div class="cp-picker-trigger" id="cp-rate-variasi-trigger" onclick="cpOpenVarianSheetForRate()">
          <span id="cp-rate-variasi-label" class="cp-placeholder">— Pilih SKU Induk dulu —</span>
          <i class="ti ti-chevron-down"></i>
        </div>
        <input type="hidden" id="cp-rate-variasi">
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
        <button class="btn btn-danger" id="cp-rate-del-btn" style="display:none" onclick="cpDeleteRate()"><i class="ti ti-trash"></i> Hapus Varian Ini</button>
        <button class="btn" onclick="hideModal('modal-cp-rate')">Batal</button>
        <button class="btn btn-primary" onclick="cpSaveRate()"><i class="ti ti-check"></i> Simpan</button>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL: Bulk Edit Rate — per SKU (semua varian sekaligus) atau
       per Variant (checklist, pilih semua/satuan) ═══ -->
  <div class="modal-overlay" id="modal-cp-rate-bulk" onclick="if(event.target===this)hideModal('modal-cp-rate-bulk')">
    <div class="modal" style="max-width:480px;width:100%">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
        <div class="modal-title" id="cp-bulk-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-edit"></i> Edit per SKU</div>
        <button onclick="hideModal('modal-cp-rate-bulk')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
      </div>
      <input type="hidden" id="cp-bulk-mode">
      <div class="form-group" id="cp-bulk-divisi-group" style="display:none">
        <label>Divisi</label>
        <div class="cp-picker-trigger" onclick="cpOpenDivisiSheetForBulk()">
          <span id="cp-bulk-divisi-label" class="cp-placeholder">— Pilih Divisi —</span>
          <i class="ti ti-chevron-down"></i>
        </div>
        <input type="hidden" id="cp-bulk-divisi">
      </div>
      <div class="form-group">
        <label>SKU Induk</label>
        <div class="cp-picker-trigger" onclick="cpOpenSkuSheetForBulk()">
          <span id="cp-bulk-sku-label" class="cp-placeholder">— Pilih SKU (Boss: DIMI) —</span>
          <i class="ti ti-chevron-down"></i>
        </div>
        <input type="hidden" id="cp-bulk-sku">
      </div>
      <div class="form-group" id="cp-bulk-variant-group" style="display:none">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <label style="margin:0">Pilih Varian</label>
          <button type="button" class="btn btn-sm" id="cp-bulk-selectall-btn" onclick="cpBulkToggleSelectAll()">Pilih Semua</button>
        </div>
        <div id="cp-bulk-variant-list" style="max-height:180px;overflow-y:auto;border:1.5px solid var(--ink4);border-radius:8px;padding:4px 8px;background:var(--cream2)"></div>
      </div>
      <div id="cp-bulk-fields"></div>
      <div class="form-group" id="cp-bulk-single-rate-group" style="display:none">
        <label>Ongkos Baru (Rp/lusin)</label>
        <input type="text" inputmode="numeric" id="cp-bulk-single-rate" placeholder="0">
      </div>
      <div class="form-group" id="cp-bulk-extra-divisi-group">
        <label>Divisi Lain (opsional, kalau ada divisi baru di luar 6 di atas)</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="cp-bulk-extra-divisi" placeholder="nama divisi baru" style="flex:1">
          <input type="text" inputmode="numeric" id="cp-bulk-extra-ongkos" placeholder="Rp/lusin" style="flex:1">
        </div>
      </div>
      <div class="cp-preview" id="cp-bulk-target-hint">Pilih SKU dulu.</div>
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn" onclick="hideModal('modal-cp-rate-bulk')">Batal</button>
        <button class="btn btn-primary" onclick="cpSaveRateBulk()"><i class="ti ti-check"></i> Terapkan</button>
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

var CP_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
function cpFmtHari(s) {
  if (!s) return '—';
  var p = String(s).split('-');
  if (p.length !== 3) return s;
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return CP_HARI[d.getDay()] + ', ' + p[2] + '/' + p[1];
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

// ─── RENDER: Overview — default periode MINGGU (Minggu s/d Sabtu), bisa
// diganti ke Bulan lewat dropdown. ──
var _cpOvPeriod = 'minggu'; // 'minggu' | 'bulan'

function cpOvDateRange() {
  var now = new Date();
  if (_cpOvPeriod === 'bulan') {
    var start = new Date(now.getFullYear(), now.getMonth(), 1);
    var end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start, end: end };
  }
  // minggu: Minggu (hari ke-0) s/d Sabtu (hari ke-6) di minggu berjalan
  var day = now.getDay();
  var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  var end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 6);
  return { start: start, end: end };
}

function cpDateToYMD(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function cpOpenOvPeriodSheet() {
  var opts = [
    { label: 'Minggu Ini', sub: 'Minggu s/d Sabtu', key: 'minggu', raw: 'minggu' },
    { label: 'Bulan Ini',  sub: null,                key: 'bulan',  raw: 'bulan' },
  ];
  cpPickerSheetOpen('Pilih Periode', opts, _cpOvPeriod, function(p) {
    _cpOvPeriod = p;
    document.getElementById('cp-ov-period-label').textContent = p === 'bulan' ? 'Bulan Ini' : 'Minggu Ini';
    cpRenderOverview();
  });
}

function cpRenderOverview() {
  var range = cpOvDateRange();
  var startYmd = cpDateToYMD(range.start);
  var endYmd   = cpDateToYMD(range.end);
  var periodeLabel = _cpOvPeriod === 'bulan' ? 'Bulan Ini' : 'Minggu Ini';

  var inPeriod = _cpJurnal.filter(function(j) {
    var t = String(j.tanggal || '');
    return t >= startYmd && t <= endYmd;
  });

  var total = inPeriod.reduce(function(s, j) { return s + (Number(j.total_cost) || 0); }, 0);
  var rajutQty = inPeriod
    .filter(function(j) { return (j.divisi || '').toLowerCase() === 'rajut'; })
    .reduce(function(s, j) { return s + (Number(j.qty_pcs) || 0); }, 0);

  document.getElementById('cp-ov-total-label').textContent = 'Total Cost ' + periodeLabel;
  document.getElementById('cp-ov-total-desc').textContent = 'akumulasi seluruh jurnal ' + (_cpOvPeriod === 'bulan' ? 'bulan berjalan' : 'minggu berjalan (Minggu–Sabtu)');
  document.getElementById('cp-ov-total').textContent = fmtRpFull(total);
  document.getElementById('cp-ov-rajut').textContent = rajutQty.toLocaleString('id-ID') + ' pcs';
  document.getElementById('cp-ov-tbl-title').innerHTML = '<i class="ti ti-chart-bar"></i> Cost per Tukang (' + periodeLabel + ')';

  // Kriteria utama: Tukang. Group by (tukang, divisi) dulu, terus kalau 1
  // tukang punya >1 baris divisi, tambahin 1 baris TOTAL per tukang itu.
  var byTukang = {}; // nama -> { order, byDivisi: {divisi: cost}, total }
  var order = [];
  inPeriod.forEach(function(j) {
    var nama = j.tukang || '—';
    var divisi = j.divisi || '—';
    if (!byTukang[nama]) { byTukang[nama] = { byDivisi: {}, total: 0 }; order.push(nama); }
    byTukang[nama].byDivisi[divisi] = (byTukang[nama].byDivisi[divisi] || 0) + (Number(j.total_cost) || 0);
    byTukang[nama].total += (Number(j.total_cost) || 0);
  });
  order.sort(function(a, b) { return byTukang[b].total - byTukang[a].total; });

  var tbody = document.getElementById('cp-ov-divisi-tbody');
  if (!order.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic">Belum ada jurnal periode ini</td></tr>';
    return;
  }
  var rowsHtml = [];
  order.forEach(function(nama) {
    var g = byTukang[nama];
    var divisiList = Object.keys(g.byDivisi).sort();
    divisiList.forEach(function(d) {
      rowsHtml.push('<tr><td>' + cpEsc(nama) + '</td><td>' + cpEsc(d) + '</td><td style="text-align:right">' + fmtRpFull(g.byDivisi[d]) + '</td></tr>');
    });
    if (divisiList.length > 1) {
      rowsHtml.push('<tr style="font-weight:700"><td colspan="2">Total ' + cpEsc(nama) + '</td><td style="text-align:right">' + fmtRpFull(g.total) + '</td></tr>');
    }
  });
  tbody.innerHTML = rowsHtml.join('');
}


// ─── RENDER: Jurnal Harian — desktop: SKU Induk & SKU Variasi kolom
// terpisah. Mobile: kolom SKU Variasi disembunyiin (nth-child CSS), tapi
// variasinya tetep keliatan nempel jadi baris ke-2 di sel SKU Induk (span
// .cp-jrn-variasi-mobile, cuma nongol di ≤600px). ──
function cpRenderJurnal() {
  var tbody = document.getElementById('cp-jurnal-tbody');
  if (!_cpJurnal.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--ink3);font-style:italic">Belum ada jurnal. Tap "+ Tambah Jurnal" buat mulai.</td></tr>';
    return;
  }
  tbody.innerHTML = _cpJurnal.map(function(j) {
    var variasiMobile = j.sku_variasi
      ? ' <span class="cp-jrn-variasi-mobile" style="display:none;color:var(--ink3);font-size:11px">— ' + cpEsc(j.sku_variasi) + '</span>'
      : '';
    return '<tr onclick="cpOpenJurnalForm(' + j.id + ')" style="cursor:pointer">' +
      '<td>' + cpEsc(cpFmtHari(j.tanggal)) + '</td>' +
      '<td>' + cpEsc(j.divisi) + '</td>' +
      '<td>' + cpEsc(j.tukang) + '</td>' +
      '<td>' + cpEsc(j.sku) + variasiMobile + '</td>' +
      '<td>' + (j.sku_variasi ? cpEsc(j.sku_variasi) : '<span style="color:var(--ink3)">—</span>') + '</td>' +
      '<td style="text-align:right">' + (j.qty_pcs || 0) + '</td>' +
      '<td style="text-align:right">' + fmtRpFull(j.total_cost) + '</td>' +
    '</tr>';
  }).join('');
}

// ─── RENDER: Master Ongkos (pivot — 1 baris per SKU+Variasi, kolom = tiap divisi).
// Baris dasarnya SEMUA kombinasi SKU+Variasi dari Kelola Produk (Boss:
// DIMI) — bukan cuma yang udah punya rate — biar tabel ini jadi checklist
// langsung: tap baris apapun (udah keisi atau masih "—") langsung ke form,
// SKU+Variasi udah otomatis kekunci, ga perlu nyari/pilih lagi. ──
function cpRenderRate() {
  var cols = cpDivisiColumns();
  var theadRow = document.getElementById('cp-rate-thead-row');
  theadRow.innerHTML = '<th>SKU Induk</th><th>SKU Variasi</th><th style="text-align:right">Total Cost</th>' + cols.map(function(c) {
    return '<th style="text-align:right">' + cpEsc(c) + '</th>';
  }).join('');

  var groupMap = {};
  _cpProdukDimi.forEach(function(p) {
    if (!p.katalog || !p.sku_variasi) return;
    var key = p.katalog + '||' + p.sku_variasi;
    if (!groupMap[key]) groupMap[key] = { sku: p.katalog, variasi: p.sku_variasi, cells: {} };
  });
  _cpRate.forEach(function(r) {
    var key = r.sku + '||' + (r.sku_variasi || '');
    if (!groupMap[key]) groupMap[key] = { sku: r.sku, variasi: r.sku_variasi || '', cells: {} };
    groupMap[key].cells[r.divisi.toLowerCase()] = r;
  });
  var keys = Object.keys(groupMap).sort(function(a, b) {
    var ga = groupMap[a], gb = groupMap[b];
    return ga.sku !== gb.sku ? ga.sku.localeCompare(gb.sku) : ga.variasi.localeCompare(gb.variasi);
  });
  var tbody = document.getElementById('cp-rate-tbody');
  if (!keys.length) {
    tbody.innerHTML = '<tr><td colspan="' + (cols.length + 3) + '" style="color:var(--ink3);font-style:italic">Belum ada produk dengan Boss = DIMI di Kelola Produk.</td></tr>';
    return;
  }
  tbody.innerHTML = keys.map(function(key) {
    var g = groupMap[key];
    var total = 0;
    var cells = cols.map(function(c) {
      var row = g.cells[c.toLowerCase()];
      if (row) total += Number(row.ongkos_per_lusin) || 0;
      return '<td style="text-align:right">' + (row ? fmtRpFull(row.ongkos_per_lusin) : '<span style="color:var(--ink3)">—</span>') + '</td>';
    }).join('');
    return '<tr onclick="cpOpenRateForm(\'' + cpEscJs(g.sku) + '\',\'' + cpEscJs(g.variasi) + '\')" style="cursor:pointer">' +
      '<td>' + cpEsc(g.sku) + '</td>' +
      '<td>' + (g.variasi ? cpEsc(g.variasi) : '<span style="color:var(--ink3)">—</span>') + '</td>' +
      '<td style="text-align:right;font-weight:700">' + fmtRpFull(total) + '</td>' +
      cells +
    '</tr>';
  }).join('');
}

// ─── RENDER: Master Tukang ─────────────────────────────────────
function cpRenderTukang() {
  var uniqueNames = {};
  _cpTukang.forEach(function(t) { if (t.nama) uniqueNames[t.nama.trim().toLowerCase()] = true; });
  document.getElementById('cp-tukang-total-label').textContent = 'Total Tukang: ' + Object.keys(uniqueNames).length;

  var tbody = document.getElementById('cp-tukang-tbody');
  if (!_cpTukang.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic">Belum ada tukang. Tap "+ Tambah Tukang" buat mulai.</td></tr>';
  } else {
    tbody.innerHTML = _cpTukang.map(function(t, i) {
      return '<tr onclick="cpOpenTukangForm(' + t.id + ')" style="cursor:pointer">' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + cpEsc(t.nama) + '</td>' +
        '<td>' + (t.divisi ? cpEsc(t.divisi) : '<span style="color:var(--ink3);font-style:italic">belum diisi</span>') + '</td>' +
      '</tr>';
    }).join('');
  }
  cpRenderTukangPivot();
}

// Kolom divisi buat pivot Master Tukang — pola sama kayak cpDivisiColumns()
// (urutan baku Rajut→Tilep, sisa divisi custom nempel di ujung), tapi
// sumbernya dari _cpTukang (bukan _cpRate).
function cpTukangDivisiColumns() {
  var extra = [];
  _cpTukang.forEach(function(t) {
    if (!t.divisi) return;
    var inCanon = CP_CANON_DIVISI.some(function(c) { return c.toLowerCase() === t.divisi.toLowerCase(); });
    if (!inCanon && extra.indexOf(t.divisi) === -1) extra.push(t.divisi);
  });
  extra.sort();
  return CP_CANON_DIVISI.concat(extra);
}

// ─── RENDER: Master Tukang — versi PIVOT khusus desktop (>600px). Divisi
// jadi kolom mendatar, nama tukang ditumpuk vertikal per kolom (persis
// pola spreadsheet aslinya). Mobile TIDAK make ini — masih list biasa,
// per keputusan 28 Agu 2026 (belum diputusin mau digimanain di HP). ──
function cpRenderTukangPivot() {
  var cols = cpTukangDivisiColumns();

  var byDivisi = {};
  cols.forEach(function(c) { byDivisi[c] = []; });
  _cpTukang.forEach(function(t) {
    if (!t.divisi) return;
    var col = cols.find(function(c) { return c.toLowerCase() === t.divisi.toLowerCase(); });
    if (col) byDivisi[col].push(t);
  });

  var thead = document.getElementById('cp-tukang-pivot-thead');
  thead.innerHTML = '<th style="width:40px">No</th>' + cols.map(function(c) {
    return '<th>' + cpEsc(c) + ' <span style="color:var(--ink3);font-weight:400">(' + byDivisi[c].length + ')</span></th>';
  }).join('');

  var maxLen = cols.reduce(function(m, c) { return Math.max(m, byDivisi[c].length); }, 0);
  var tbody = document.getElementById('cp-tukang-pivot-tbody');
  if (!maxLen) {
    tbody.innerHTML = '<tr><td colspan="' + (cols.length + 1) + '" style="color:var(--ink3);font-style:italic">Belum ada tukang. Tap "+ Tambah Tukang" buat mulai.</td></tr>';
    return;
  }
  var rows = [];
  for (var i = 0; i < maxLen; i++) {
    var cells = cols.map(function(c) {
      var t = byDivisi[c][i];
      return t ? '<td onclick="cpOpenTukangForm(' + t.id + ')">' + cpEsc(t.nama) + '</td>' : '<td></td>';
    }).join('');
    rows.push('<tr><td>' + (i + 1) + '</td>' + cells + '</tr>');
  }
  tbody.innerHTML = rows.join('');
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
  cpSetJrnLabel('sku', _cpJrnSelSku);
  cpRefreshVarianField(); // ini juga yang nentuin _cpJrnRate, karena rate sekarang baru ketauan setelah Varian jelas

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

// Opsi Varian buat SKU+Divisi yang lagi dipilih — ditarik dari cost_rate
// (BUKAN dari produk langsung), karena rate ongkos sekarang emang beda per
// varian (M vs LX dst.) jadi variannya harus yang beneran udah punya rate
// buat divisi ini di Master Ongkos. 1 hasil = 1 baris cost_rate.
function cpJrnVarianOptions() {
  if (!_cpJrnSelSku || !_cpJrnSelDivisi) return [];
  var seen = {};
  return _cpRate.filter(function(r) {
    return r.sku === _cpJrnSelSku && r.divisi.toLowerCase() === _cpJrnSelDivisi.toLowerCase() && r.sku_variasi;
  }).filter(function(r) {
    if (seen[r.sku_variasi]) return false;
    seen[r.sku_variasi] = true;
    return true;
  });
}

function cpRefreshVarianField() {
  var group = document.getElementById('cp-jrn-varian-group');
  var opts = cpJrnVarianOptions();
  if (!opts.length) {
    group.style.display = 'none';
    _cpJrnSelVarian = '';
    _cpJrnRate = 0;
    cpUpdateJurnalPreview();
    return;
  }
  group.style.display = '';
  if (opts.length === 1 && !_cpJrnSelVarian) {
    _cpJrnSelVarian = opts[0].sku_variasi;
  }
  var match = opts.find(function(r) { return r.sku_variasi === _cpJrnSelVarian; });
  if (match) {
    _cpJrnRate = Number(match.ongkos_per_lusin);
  } else {
    _cpJrnSelVarian = '';
    _cpJrnRate = 0;
  }
  cpSetJrnLabel('varian', _cpJrnSelVarian);
  cpUpdateJurnalPreview();
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
// tukang yang lagi dipilih (dedupe, karena 1 SKU sekarang bisa punya
// banyak baris cost_rate — 1 per varian).
function cpOpenSkuSheetForJurnal() {
  if (!_cpJrnSelDivisi) { alert('Pilih Tukang dulu.'); return; }
  var rows = _cpRate.filter(function(r) { return r.divisi.toLowerCase() === _cpJrnSelDivisi.toLowerCase(); });
  if (!rows.length) { alert('Divisi "' + _cpJrnSelDivisi + '" belum punya rate SKU apapun — isi dulu di Master Ongkos.'); return; }
  var seen = {}, opts = [];
  rows.forEach(function(r) {
    if (seen[r.sku]) return;
    seen[r.sku] = true;
    opts.push({ label: r.sku, sub: null, key: r.sku, raw: r.sku });
  });
  cpPickerSheetOpen('Ngerjain Apa (SKU)', opts, _cpJrnSelSku, function(sku) {
    _cpJrnSelSku = sku;
    _cpJrnSelVarian = '';
    _cpJrnRate = 0;
    cpSetJrnLabel('sku', sku);
    cpRefreshVarianField();
    cpUpdateJurnalPreview();
  });
}

// Sheet: Varian — daftar sku_variasi yang punya rate buat SKU+Divisi ini.
function cpOpenVarianSheetForJurnal() {
  var opts = cpJrnVarianOptions();
  if (!opts.length) return;
  var sheetOpts = opts.map(function(r) { return { label: r.sku_variasi, sub: fmtRpFull(r.ongkos_per_lusin) + '/lusin', key: r.sku_variasi, raw: r }; });
  cpPickerSheetOpen('Pilih Variasi', sheetOpts, _cpJrnSelVarian, function(r) {
    _cpJrnSelVarian = r.sku_variasi;
    _cpJrnRate = Number(r.ongkos_per_lusin);
    cpSetJrnLabel('varian', r.sku_variasi);
    cpUpdateJurnalPreview();
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

  var rr = _cpRate.find(function(r) { return r.sku === _cpJrnSelSku && r.sku_variasi === _cpJrnSelVarian && r.divisi.toLowerCase() === _cpJrnSelDivisi.toLowerCase(); });
  if (!rr) return alert('Rate buat kombinasi SKU + Varian + Divisi ini belum ada — tambahin dulu di Master Ongkos.');

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

// ─── EXPORT PDF (by Tukang) — jsPDF + autoTable ASLI (BUKAN
// window.open(blob)+window.print()). Root cause versi lama: window.open()
// dengan URL blob: + target _blank, di dalam PWA "display":"standalone",
// adalah known crash trigger di Android WebView — blob: URL cuma valid
// di proses yang bikin dia, sementara window.open coba lempar ke
// browsing context lain → force close. Ini exact bug yang sama yang udah
// pernah diperbaiki di hutang-supplier.js (Export PDF Jurnal Re-Stock),
// jadi Cost Produksi disamain ke pola yang sama: doc.save() cuma trigger
// download Blob di halaman yang sama, aman di semua Android/iOS.
// 29 Agu 2026. ──
function cpExportJurnalPDF() {
  var names = [];
  _cpJurnal.forEach(function(j) { if (j.tukang && names.indexOf(j.tukang) === -1) names.push(j.tukang); });
  if (!names.length) { alert('Belum ada jurnal buat di-export.'); return; }
  var opts = names.sort().map(function(n) { return { label: n, sub: null, key: n, raw: n }; });
  cpPickerSheetOpen('Export PDF — Pilih Tukang', opts, null, function(nama) {
    cpDoExportJurnalPDF(nama);
  });
}

var CP_PDF_ABU_TUA = [92, 88, 82];

function cpDoExportJurnalPDF(nama) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('Modul PDF belum siap (mungkin lagi offline pertama kali). Coba lagi sebentar.');
    return;
  }
  var rows = _cpJurnal.filter(function(j) { return j.tukang === nama; });
  if (!rows.length) { alert('Gak ada jurnal buat ' + nama + '.'); return; }

  var divisiSet = [];
  rows.forEach(function(j) { if (j.divisi && divisiSet.indexOf(j.divisi) === -1) divisiSet.push(j.divisi); });

  // Group by kombinasi SKU + Variasi, sum qty & total_cost.
  var group = {}, order = [];
  rows.forEach(function(j) {
    var key = j.sku + '||' + (j.sku_variasi || '');
    if (!group[key]) { group[key] = { sku: j.sku, variasi: j.sku_variasi || '', qty: 0, total: 0, rate: Number(j.rate_snapshot) || 0 }; order.push(key); }
    group[key].qty += Number(j.qty_pcs) || 0;
    group[key].total += Number(j.total_cost) || 0;
  });
  var grandQty   = rows.reduce(function(s, j) { return s + (Number(j.qty_pcs) || 0); }, 0);
  var grandTotal = rows.reduce(function(s, j) { return s + (Number(j.total_cost) || 0); }, 0);

  var body = order.map(function(key) {
    var g = group[key];
    return [g.sku, g.variasi || '\u2014', String(g.qty), fmtRpFull(g.rate), fmtRpFull(g.total)];
  });

  var hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var today = new Date();
  var hariExport = hariNames[today.getDay()];
  var tglExportStr = String(today.getDate()).padStart(2, '0') + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + today.getFullYear();

  var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
  var pageW = doc.internal.pageSize.getWidth();
  var marginL = 40, marginR = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(CP_PDF_ABU_TUA[0], CP_PDF_ABU_TUA[1], CP_PDF_ABU_TUA[2]);
  doc.text('SLIP BAYARAN KARYAWAN', marginL, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 126, 120);
  doc.text('Dimi.id  \u00b7  ' + hariExport + ', ' + tglExportStr, marginL, 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 28, 26);
  doc.text(nama.toUpperCase(), pageW - marginR, 36, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 86, 80);
  doc.text(divisiSet.join(', ').toUpperCase(), pageW - marginR, 50, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  var footRows = [[
    { content: 'TOTAL', colSpan: 2, styles: { halign: 'right' } },
    String(grandQty), '',
    fmtRpFull(grandTotal)
  ]];

  doc.autoTable({
    startY: 66,
    head: [['SKU Induk', 'SKU Variasi', 'Total Qty', 'Harga/Lsn', 'Total']],
    body: body,
    styles: { font: 'helvetica', fontSize: 11, cellPadding: 8, textColor: [20, 20, 20] },
    headStyles: { fillColor: CP_PDF_ABU_TUA, textColor: 255, fontStyle: 'bold', fontSize: 11 },
    columnStyles: {
      2: { halign: 'right', cellWidth: 60 },
      3: { halign: 'right' },
      4: { halign: 'right' }
    },
    foot: footRows,
    footStyles: { fillColor: [244, 238, 227], textColor: [20, 20, 20], fontStyle: 'bold', fontSize: 11 },
  });

  var safeNama = nama.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  var fileName = 'dimi-' + safeNama + '.pdf';

  // ── Delivery PDF: iOS Safari vs Android PWA (pola sama kayak Hutang
  // Supplier) — iOS pake native share sheet (hindari blob URL nempel pas
  // share), Android/desktop pake doc.save() biasa. ──
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS && navigator.canShare) {
    try {
      var pdfOutput = doc.output('arraybuffer');
      var pdfFile   = new File([pdfOutput], fileName, { type: 'application/pdf' });
      if (navigator.canShare({ files: [pdfFile] })) {
        navigator.share({ files: [pdfFile], title: fileName }).catch(function(err) {
          if (err && err.name !== 'AbortError') doc.save(fileName);
        });
        return;
      }
    } catch (e) { /* fallback ke doc.save() di bawah */ }
  }
  doc.save(fileName);
}

// ─── FORM: Master Ongkos (1 SKU + 1 Variasi, semua divisi jadi kolom input) ──
function cpOpenRateForm(sku, variasi) {
  document.getElementById('cp-rate-edit-sku').value = sku || '';
  document.getElementById('cp-rate-edit-variasi').value = variasi || '';
  document.getElementById('cp-rate-form-title').innerHTML = sku
    ? '<i class="ti ti-edit"></i> Edit Rate — ' + cpEsc(sku) + (variasi ? ' — ' + cpEsc(variasi) : '')
    : '<i class="ti ti-list-details"></i> Tambah Rate';
  document.getElementById('cp-rate-del-btn').style.display = sku ? '' : 'none';

  document.getElementById('cp-rate-sku').value = sku || '';
  var skuTrigger = document.getElementById('cp-rate-sku-trigger');
  var skuLabel = document.getElementById('cp-rate-sku-label');
  document.getElementById('cp-rate-variasi').value = variasi || '';
  var varTrigger = document.getElementById('cp-rate-variasi-trigger');
  var varLabel = document.getElementById('cp-rate-variasi-label');

  if (sku) {
    skuLabel.textContent = sku;
    skuLabel.classList.remove('cp-placeholder');
    skuTrigger.style.opacity = '.6';
    skuTrigger.style.pointerEvents = 'none'; // hindari rename SKU/Variasi pas edit (biar gak numpuk baris nyasar)
    varLabel.textContent = variasi || '—';
    varLabel.classList.remove('cp-placeholder');
    varTrigger.style.opacity = '.6';
    varTrigger.style.pointerEvents = 'none';
  } else {
    skuLabel.textContent = '— Pilih SKU (Boss: DIMI) —';
    skuLabel.classList.add('cp-placeholder');
    skuTrigger.style.opacity = '';
    skuTrigger.style.pointerEvents = '';
    varLabel.textContent = '— Pilih SKU Induk dulu —';
    varLabel.classList.add('cp-placeholder');
    varTrigger.style.opacity = '';
    varTrigger.style.pointerEvents = '';
  }

  var cols = cpDivisiColumns();
  var byDivisiLower = {};
  if (sku && variasi) {
    _cpRate.filter(function(r) { return r.sku === sku && r.sku_variasi === variasi; }).forEach(function(r) {
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

// SKU induk picker — ditarik dari Kelola Produk (tabel `produk`), CUMA
// katalog yang Boss/Supplier-nya DIMI.
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
  cpPickerSheetOpen('Pilih SKU Induk (Boss: DIMI)', opts, currentSku, function(katalog) {
    document.getElementById('cp-rate-sku').value = katalog;
    var skuLabel = document.getElementById('cp-rate-sku-label');
    skuLabel.textContent = katalog;
    skuLabel.classList.remove('cp-placeholder');
    // ganti SKU induk → reset Variasi yang mungkin udah kepilih sebelumnya
    document.getElementById('cp-rate-variasi').value = '';
    var varLabel = document.getElementById('cp-rate-variasi-label');
    varLabel.textContent = '— Pilih Variasi —';
    varLabel.classList.add('cp-placeholder');
  });
}

// Variasi picker — daftar sku_variasi dari SKU induk yang lagi dipilih,
// tetap dari Kelola Produk (boss DIMI). Karena ongkos bisa beda per
// ukuran (M vs LX dst.), tiap kombinasi SKU+Variasi punya rate sendiri.
function cpOpenVarianSheetForRate() {
  var sku = document.getElementById('cp-rate-sku').value;
  if (!sku) { alert('Pilih SKU Induk dulu.'); return; }
  var rows = _cpProdukDimi.filter(function(p) { return p.katalog === sku && p.sku_variasi; });
  if (!rows.length) { alert('SKU ini belum punya data varian di Kelola Produk.'); return; }
  var opts = rows.map(function(p) { return { label: p.sku_variasi, sub: null, key: p.sku_variasi, raw: p.sku_variasi }; });
  var currentVar = document.getElementById('cp-rate-variasi').value;
  cpPickerSheetOpen('Pilih Variasi', opts, currentVar, function(variasi) {
    document.getElementById('cp-rate-variasi').value = variasi;
    var varLabel = document.getElementById('cp-rate-variasi-label');
    varLabel.textContent = variasi;
    varLabel.classList.remove('cp-placeholder');
  });
}

async function cpSaveRate() {
  var sku = document.getElementById('cp-rate-sku').value.trim();
  var variasi = document.getElementById('cp-rate-variasi').value.trim();
  if (!sku) return alert('SKU Induk wajib diisi.');
  if (!variasi) return alert('SKU Variasi wajib diisi.');

  var cols = cpDivisiColumns();
  var jobs = [];

  cols.forEach(function(c) {
    var fid = 'cp-rate-f-' + c.replace(/[^a-z0-9]/gi, '_');
    var val = idrVal(fid);
    var existing = _cpRate.find(function(r) { return r.sku === sku && r.sku_variasi === variasi && r.divisi.toLowerCase() === c.toLowerCase(); });
    if (val > 0) {
      jobs.push(existing
        ? dbUpdate('cost_rate', existing.id, { ongkos_per_lusin: val })
        : dbInsert('cost_rate', { sku: sku, sku_variasi: variasi, divisi: c, ongkos_per_lusin: val }));
    } else if (existing) {
      jobs.push(dbDelete('cost_rate', existing.id));
    }
  });

  var extraDivisi = document.getElementById('cp-rate-extra-divisi').value.trim();
  var extraVal = idrVal('cp-rate-extra-ongkos');
  if (extraDivisi && extraVal > 0) {
    var existingExtra = _cpRate.find(function(r) { return r.sku === sku && r.sku_variasi === variasi && r.divisi.toLowerCase() === extraDivisi.toLowerCase(); });
    jobs.push(existingExtra
      ? dbUpdate('cost_rate', existingExtra.id, { ongkos_per_lusin: extraVal })
      : dbInsert('cost_rate', { sku: sku, sku_variasi: variasi, divisi: extraDivisi, ongkos_per_lusin: extraVal }));
  }

  try {
    await Promise.all(jobs);
  } catch (e) {
    var msg = /duplicate|unique/i.test(e.message) ? 'Kombinasi SKU + Variasi + Divisi ini udah ada.' : e.message;
    return alert('Gagal simpan: ' + msg);
  }
  hideModal('modal-cp-rate');
  cpLoadAll();
}

async function cpDeleteRate() {
  var sku = document.getElementById('cp-rate-edit-sku').value;
  var variasi = document.getElementById('cp-rate-edit-variasi').value;
  if (!sku) return;
  if (!confirm('Hapus semua rate buat "' + sku + ' — ' + variasi + '" (semua divisi)? Jurnal yang udah kepake gak ikut kehapus (rate_snapshot udah tersimpan sendiri).')) return;
  var rows = _cpRate.filter(function(r) { return r.sku === sku && r.sku_variasi === variasi; });
  try {
    await Promise.all(rows.map(function(r) { return dbDelete('cost_rate', r.id); }));
  } catch (e) { return alert('Gagal hapus: ' + e.message); }
  hideModal('modal-cp-rate');
  cpLoadAll();
}

// ─── BULK EDIT RATE — "Edit per SKU" (semua varian sekaligus) & "Edit per
// Variant" (checklist, pilih semua/satuan). Beda dari cpOpenRateForm (yang
// edit 1 SKU+Variasi doang) — ini buat isi banyak baris sekali Simpan,
// biar cepet pas rate-nya emang sama buat banyak varian. 28 Agu 2026. ──
var _cpBulkMode = 'sku'; // 'sku' | 'variant'
var _cpBulkSelected = {}; // { sku_variasi: true }

function cpOpenRateBulk(mode) {
  _cpBulkMode = mode;
  _cpBulkSelected = {};
  document.getElementById('cp-bulk-mode').value = mode;
  document.getElementById('cp-bulk-title').innerHTML =
    mode === 'sku'    ? '<i class="ti ti-edit"></i> Edit per SKU (semua varian)'
  : mode === 'variant' ? '<i class="ti ti-list-check"></i> Edit per Variant (pilih sendiri)'
  :                       '<i class="ti ti-category"></i> Edit per Divisi';

  document.getElementById('cp-bulk-sku').value = '';
  var skuLabel = document.getElementById('cp-bulk-sku-label');
  skuLabel.textContent = '— Pilih SKU (Boss: DIMI) —';
  skuLabel.classList.add('cp-placeholder');

  document.getElementById('cp-bulk-divisi').value = '';
  var divisiLabel = document.getElementById('cp-bulk-divisi-label');
  divisiLabel.textContent = '— Pilih Divisi —';
  divisiLabel.classList.add('cp-placeholder');

  // Checklist varian dipakai buat mode 'variant' DAN 'divisi' (dua-duanya
  // butuh milih target varian spesifik); mode 'sku' otomatis ke semua.
  document.getElementById('cp-bulk-divisi-group').style.display = mode === 'divisi' ? '' : 'none';
  document.getElementById('cp-bulk-variant-group').style.display = (mode === 'variant' || mode === 'divisi') ? '' : 'none';
  document.getElementById('cp-bulk-variant-list').innerHTML = '';
  document.getElementById('cp-bulk-target-hint').textContent = mode === 'divisi' ? 'Pilih Divisi dulu.' : 'Pilih SKU dulu.';

  // Mode sku/variant: 6 field per-divisi. Mode divisi: 1 field rate doang.
  document.getElementById('cp-bulk-fields').style.display = mode === 'divisi' ? 'none' : '';
  document.getElementById('cp-bulk-single-rate-group').style.display = mode === 'divisi' ? '' : 'none';
  document.getElementById('cp-bulk-extra-divisi-group').style.display = mode === 'divisi' ? 'none' : '';

  var cols = cpDivisiColumns();
  document.getElementById('cp-bulk-fields').innerHTML = cols.map(function(c) {
    var fid = 'cp-bulk-f-' + c.replace(/[^a-z0-9]/gi, '_');
    return '<div class="form-group"><label>' + cpEsc(c) + ' (Rp/lusin)</label>' +
      '<input type="text" inputmode="numeric" id="' + fid + '" placeholder="0"></div>';
  }).join('');
  cols.forEach(function(c) {
    var fid = 'cp-bulk-f-' + c.replace(/[^a-z0-9]/gi, '_');
    idrInput(fid);
    idrSet(fid, 0);
  });
  document.getElementById('cp-bulk-extra-divisi').value = '';
  document.getElementById('cp-bulk-extra-ongkos').value = '';
  idrInput('cp-bulk-extra-ongkos');
  idrInput('cp-bulk-single-rate');
  idrSet('cp-bulk-single-rate', 0);

  showModal('modal-cp-rate-bulk');
}

// Trigger dropdown mobile — sheet 3 opsi, milih salah satu langsung
// nembak cpOpenRateBulk(mode) yang sama kayak tombol desktop.
function cpOpenRateModeSheet() {
  var opts = [
    { label: 'Edit per SKU',     sub: 'semua varian sekaligus', key: 'sku',     raw: 'sku' },
    { label: 'Edit per Variant', sub: 'pilih sendiri',          key: 'variant', raw: 'variant' },
    { label: 'Edit per Divisi',  sub: 'mis. Rajut doang',       key: 'divisi',  raw: 'divisi' },
  ];
  cpPickerSheetOpen('Mau edit rate gimana?', opts, null, function(mode) { cpOpenRateBulk(mode); });
}

function cpOpenDivisiSheetForBulk() {
  var cols = cpDivisiColumns();
  var opts = cols.map(function(c) { return { label: c, sub: null, key: c, raw: c }; });
  var current = document.getElementById('cp-bulk-divisi').value;
  cpPickerSheetOpen('Pilih Divisi', opts, current, function(divisi) {
    document.getElementById('cp-bulk-divisi').value = divisi;
    var label = document.getElementById('cp-bulk-divisi-label');
    label.textContent = divisi;
    label.classList.remove('cp-placeholder');
    cpBulkUpdateHint();
  });
}

function cpOpenSkuSheetForBulk() {
  if (!_cpProdukDimi.length) { alert('Belum ada produk dengan Boss = DIMI di Kelola Produk.'); return; }
  var byKatalog = {};
  _cpProdukDimi.forEach(function(p) { if (p.katalog) byKatalog[p.katalog] = (byKatalog[p.katalog] || 0) + 1; });
  var opts = Object.keys(byKatalog).sort().map(function(k) {
    return { label: k, sub: byKatalog[k] + ' varian', key: k, raw: k };
  });
  var currentSku = document.getElementById('cp-bulk-sku').value;
  cpPickerSheetOpen('Pilih SKU Induk (Boss: DIMI)', opts, currentSku, function(katalog) {
    document.getElementById('cp-bulk-sku').value = katalog;
    var skuLabel = document.getElementById('cp-bulk-sku-label');
    skuLabel.textContent = katalog;
    skuLabel.classList.remove('cp-placeholder');
    _cpBulkSelected = {};
    if (_cpBulkMode === 'variant' || _cpBulkMode === 'divisi') {
      cpBulkRenderVariantChecklist(katalog);
    } else {
      var count = _cpProdukDimi.filter(function(p) { return p.katalog === katalog; }).length;
      document.getElementById('cp-bulk-target-hint').textContent = 'Rate ini bakal kepasang ke SEMUA ' + count + ' varian ' + katalog + '.';
    }
  });
}

function cpBulkRenderVariantChecklist(sku) {
  var rows = _cpProdukDimi.filter(function(p) { return p.katalog === sku && p.sku_variasi; });
  var list = document.getElementById('cp-bulk-variant-list');
  list.innerHTML = rows.length
    ? rows.map(function(p, i) {
        return '<label style="display:flex;align-items:center;gap:8px;padding:6px 4px;font-size:13px;cursor:pointer">' +
          '<input type="checkbox" id="cp-bulk-chk-' + i + '" data-variasi="' + cpEsc(p.sku_variasi) + '" onchange="cpBulkOnCheck(this)" style="width:auto">' +
          cpEsc(p.sku_variasi) +
        '</label>';
      }).join('')
    : '<div style="color:var(--ink3);font-style:italic;font-size:12px;padding:6px 4px">SKU ini belum punya data varian.</div>';
  document.getElementById('cp-bulk-selectall-btn').textContent = 'Pilih Semua';
  cpBulkUpdateHint();
}

function cpBulkOnCheck(el) {
  if (el.checked) _cpBulkSelected[el.dataset.variasi] = true;
  else delete _cpBulkSelected[el.dataset.variasi];
  cpBulkUpdateHint();
}

function cpBulkToggleSelectAll() {
  var checkboxes = document.querySelectorAll('#cp-bulk-variant-list input[type="checkbox"]');
  var allChecked = checkboxes.length > 0 && Array.prototype.every.call(checkboxes, function(c) { return c.checked; });
  checkboxes.forEach(function(c) {
    c.checked = !allChecked;
    if (c.checked) _cpBulkSelected[c.dataset.variasi] = true;
    else delete _cpBulkSelected[c.dataset.variasi];
  });
  document.getElementById('cp-bulk-selectall-btn').textContent = allChecked ? 'Pilih Semua' : 'Batal Semua';
  cpBulkUpdateHint();
}

function cpBulkUpdateHint() {
  var n = Object.keys(_cpBulkSelected).length;
  var divisi = document.getElementById('cp-bulk-divisi').value;
  if (_cpBulkMode === 'divisi') {
    document.getElementById('cp-bulk-target-hint').textContent = n
      ? 'Rate ' + (divisi || 'divisi ini') + ' bakal kepasang ke ' + n + ' varian yang dicentang.'
      : 'Belum ada varian yang dicentang.';
    return;
  }
  document.getElementById('cp-bulk-target-hint').textContent = n
    ? 'Rate ini bakal kepasang ke ' + n + ' varian yang dicentang.'
    : 'Belum ada varian yang dicentang.';
}

async function cpSaveRateBulk() {
  var sku = document.getElementById('cp-bulk-sku').value.trim();
  if (!sku) return alert('Pilih SKU Induk dulu.');

  var targetVariants;
  if (_cpBulkMode === 'sku') {
    targetVariants = _cpProdukDimi.filter(function(p) { return p.katalog === sku && p.sku_variasi; }).map(function(p) { return p.sku_variasi; });
  } else {
    targetVariants = Object.keys(_cpBulkSelected);
  }
  if (!targetVariants.length) return alert(_cpBulkMode === 'sku' ? 'SKU ini belum punya data varian.' : 'Centang minimal 1 varian dulu.');

  // ── Mode Divisi: 1 divisi tetap, 1 rate, ditembak ke varian yang dicentang ──
  if (_cpBulkMode === 'divisi') {
    var divisi = document.getElementById('cp-bulk-divisi').value.trim();
    if (!divisi) return alert('Pilih Divisi dulu.');
    var rate = idrVal('cp-bulk-single-rate');
    if (rate <= 0) return alert('Isi ongkos baru dulu.');

    var jobsD = targetVariants.map(function(variasi) {
      var existing = _cpRate.find(function(r) {
        return r.sku === sku && r.sku_variasi === variasi && r.divisi.toLowerCase() === divisi.toLowerCase();
      });
      return existing
        ? dbUpdate('cost_rate', existing.id, { ongkos_per_lusin: rate })
        : dbInsert('cost_rate', { sku: sku, sku_variasi: variasi, divisi: divisi, ongkos_per_lusin: rate });
    });
    try {
      await Promise.all(jobsD);
    } catch (e) { return alert('Gagal simpan: ' + e.message); }
    hideModal('modal-cp-rate-bulk');
    cpLoadAll();
    return;
  }

  // ── Mode SKU / Variant: sampe 6 field divisi + 1 divisi custom, field
  // yang dibiarin 0 di-skip (BUKAN dianggap hapus rate) ──
  var cols = cpDivisiColumns();
  var divisiVals = {}; // divisi -> rate value (>0 aja yang dipasang)
  cols.forEach(function(c) {
    var fid = 'cp-bulk-f-' + c.replace(/[^a-z0-9]/gi, '_');
    var val = idrVal(fid);
    if (val > 0) divisiVals[c] = val;
  });
  var extraDivisi = document.getElementById('cp-bulk-extra-divisi').value.trim();
  var extraVal = idrVal('cp-bulk-extra-ongkos');
  if (extraDivisi && extraVal > 0) divisiVals[extraDivisi] = extraVal;

  if (!Object.keys(divisiVals).length) return alert('Isi minimal 1 rate divisi dulu.');

  var jobs = [];
  targetVariants.forEach(function(variasi) {
    Object.keys(divisiVals).forEach(function(divisi) {
      var val = divisiVals[divisi];
      var existing = _cpRate.find(function(r) {
        return r.sku === sku && r.sku_variasi === variasi && r.divisi.toLowerCase() === divisi.toLowerCase();
      });
      jobs.push(existing
        ? dbUpdate('cost_rate', existing.id, { ongkos_per_lusin: val })
        : dbInsert('cost_rate', { sku: sku, sku_variasi: variasi, divisi: divisi, ongkos_per_lusin: val }));
    });
  });

  try {
    await Promise.all(jobs);
  } catch (e) { return alert('Gagal simpan: ' + e.message); }
  hideModal('modal-cp-rate-bulk');
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
