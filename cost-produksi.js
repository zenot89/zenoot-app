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
    }

    /* ── Custom picker (bukan native <select> — aturan existing) ── */
    #page-cost-produksi .cp-picker { position:relative; }
    #page-cost-produksi .cp-picker-trigger {
      display:flex; align-items:center; justify-content:space-between; gap:6px;
      padding:9px 10px; border-radius:8px; border:1.5px solid var(--ink4);
      cursor:pointer; font-size:13px; background:var(--cream2); color:var(--ink);
    }
    #page-cost-produksi .cp-picker-trigger .cp-placeholder { color:var(--ink3); }
    #page-cost-produksi .cp-picker-list {
      display:none; position:absolute; top:calc(100% + 4px); left:0; right:0;
      max-height:220px; overflow-y:auto; background:var(--cream2); border:1px solid var(--ink3);
      border-radius:8px; z-index:50; box-shadow:0 8px 24px rgba(0,0,0,.25);
    }
    #page-cost-produksi .cp-picker.open .cp-picker-list { display:block; }
    #page-cost-produksi .cp-picker-opt { padding:9px 12px; font-size:13px; cursor:pointer; }
    #page-cost-produksi .cp-picker-opt:hover { background:var(--cream3); }
    #page-cost-produksi .cp-picker-empty { padding:9px 12px; font-size:12px; color:var(--ink3); font-style:italic; }
    #page-cost-produksi .cp-preview { margin-top:4px; font-size:13px; color:var(--ink2); }
    #page-cost-produksi .cp-preview b { color:var(--ink); font-size:15px; }
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
          <thead><tr><th>Tanggal</th><th>Divisi</th><th>Tukang</th><th>SKU</th><th style="text-align:right">Qty(pcs)</th><th style="text-align:right">Total</th></tr></thead>
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
          <thead><tr><th>SKU</th><th>Divisi</th><th style="text-align:right">Ongkos/Lusin</th></tr></thead>
          <tbody id="cp-rate-tbody"><tr><td colspan="3" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
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
          <thead><tr><th>Nama</th><th style="text-align:center">Status</th></tr></thead>
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
      <div class="form-group">
        <label>SKU</label>
        <div class="cp-picker" id="cp-jrn-sku-picker">
          <div class="cp-picker-trigger" onclick="cpTogglePicker('cp-jrn-sku-picker')">
            <span id="cp-jrn-sku-label" class="cp-placeholder">— Pilih SKU —</span>
            <i class="ti ti-chevron-down"></i>
          </div>
          <div class="cp-picker-list" id="cp-jrn-sku-list"></div>
        </div>
      </div>
      <div class="form-group">
        <label>Divisi</label>
        <div class="cp-picker" id="cp-jrn-divisi-picker">
          <div class="cp-picker-trigger" onclick="cpTogglePicker('cp-jrn-divisi-picker')">
            <span id="cp-jrn-divisi-label" class="cp-placeholder">— Pilih SKU dulu —</span>
            <i class="ti ti-chevron-down"></i>
          </div>
          <div class="cp-picker-list" id="cp-jrn-divisi-list"></div>
        </div>
      </div>
      <div class="form-group">
        <label>Tukang</label>
        <div class="cp-picker" id="cp-jrn-tukang-picker">
          <div class="cp-picker-trigger" onclick="cpTogglePicker('cp-jrn-tukang-picker')">
            <span id="cp-jrn-tukang-label" class="cp-placeholder">— Pilih Tukang —</span>
            <i class="ti ti-chevron-down"></i>
          </div>
          <div class="cp-picker-list" id="cp-jrn-tukang-list"></div>
        </div>
      </div>
      <div class="form-group"><label>Qty (pcs)</label><input type="text" inputmode="numeric" id="cp-jrn-qty" placeholder="0" oninput="cpUpdateJurnalPreview()"></div>
      <div class="cp-preview" id="cp-jrn-preview">Rate: — · Total: <b>Rp0</b></div>
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn btn-danger" id="cp-jrn-del-btn" style="display:none" onclick="cpDeleteJurnal()"><i class="ti ti-trash"></i> Hapus</button>
        <button class="btn" onclick="hideModal('modal-cp-jurnal')">Batal</button>
        <button class="btn btn-primary" onclick="cpSaveJurnal()"><i class="ti ti-check"></i> Simpan</button>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL: Tambah/Edit Rate ═══ -->
  <div class="modal-overlay" id="modal-cp-rate" onclick="if(event.target===this)hideModal('modal-cp-rate')">
    <div class="modal" style="max-width:420px;width:100%">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
        <div class="modal-title" id="cp-rate-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-list-details"></i> Tambah Rate</div>
        <button onclick="hideModal('modal-cp-rate')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
      </div>
      <input type="hidden" id="cp-rate-edit-id">
      <div class="form-group"><label>SKU</label><input type="text" id="cp-rate-sku" placeholder="mis. turtleneck"></div>
      <div class="form-group"><label>Divisi</label><input type="text" id="cp-rate-divisi" placeholder="mis. obras"></div>
      <div class="form-group"><label>Ongkos per Lusin (Rp)</label><input type="text" inputmode="numeric" id="cp-rate-ongkos" placeholder="0"></div>
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn btn-danger" id="cp-rate-del-btn" style="display:none" onclick="cpDeleteRate()"><i class="ti ti-trash"></i> Hapus</button>
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
      <div class="form-group" style="display:flex;align-items:center;gap:8px">
        <input type="checkbox" id="cp-tukang-aktif" checked style="width:auto">
        <label for="cp-tukang-aktif" style="margin:0">Aktif</label>
      </div>
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn btn-danger" id="cp-tukang-del-btn" style="display:none" onclick="cpDeleteTukang()"><i class="ti ti-trash"></i> Hapus</button>
        <button class="btn" onclick="hideModal('modal-cp-tukang')">Batal</button>
        <button class="btn btn-primary" onclick="cpSaveTukang()"><i class="ti ti-check"></i> Simpan</button>
      </div>
    </div>
  </div>
`;

// ─── STATE ──────────────────────────────────────────────────
var _cpJurnal = [];
var _cpRate   = [];
var _cpTukang = [];
var _cpView   = 'overview';
var _CP_VIEW_ORDER = ['overview', 'jurnal', 'rate', 'tukang'];
var _CP_VIEW_LABEL = {
  overview: { label: 'Overview',      icon: 'ti-chart-donut'   },
  jurnal:   { label: 'Jurnal Harian', icon: 'ti-notebook'      },
  rate:     { label: 'Master Ongkos', icon: 'ti-list-details'  },
  tukang:   { label: 'Master Tukang', icon: 'ti-users'         },
};

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
    ]);
    _cpJurnal = res[0]; _cpRate = res[1]; _cpTukang = res[2];
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
    return '<tr onclick="cpOpenJurnalForm(' + j.id + ')" style="cursor:pointer">' +
      '<td>' + cpEsc(cpFmtTgl(j.tanggal)) + '</td>' +
      '<td>' + cpEsc(j.divisi) + '</td>' +
      '<td>' + cpEsc(j.tukang) + '</td>' +
      '<td>' + cpEsc(j.sku) + '</td>' +
      '<td style="text-align:right">' + (j.qty_pcs || 0) + '</td>' +
      '<td style="text-align:right">' + fmtRpFull(j.total_cost) + '</td>' +
    '</tr>';
  }).join('');
}

// ─── RENDER: Master Ongkos ─────────────────────────────────────
function cpRenderRate() {
  var tbody = document.getElementById('cp-rate-tbody');
  if (!_cpRate.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic">Belum ada rate. Tap "+ Tambah Rate" buat mulai.</td></tr>';
    return;
  }
  tbody.innerHTML = _cpRate.map(function(r) {
    return '<tr onclick="cpOpenRateForm(' + r.id + ')" style="cursor:pointer">' +
      '<td>' + cpEsc(r.sku) + '</td>' +
      '<td>' + cpEsc(r.divisi) + '</td>' +
      '<td style="text-align:right">' + fmtRpFull(r.ongkos_per_lusin) + '</td>' +
    '</tr>';
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
      '<td style="text-align:center">' + (t.aktif
        ? '<span style="color:var(--ok);font-weight:700">Aktif</span>'
        : '<span style="color:var(--ink3)">Nonaktif</span>') + '</td>' +
    '</tr>';
  }).join('');
}

// ─── PICKER generik (bukan native <select>) ────────────────────
function cpTogglePicker(wrapId) {
  var wrap = document.getElementById(wrapId);
  if (!wrap) return;
  var willOpen = !wrap.classList.contains('open');
  document.querySelectorAll('#page-cost-produksi .cp-picker.open').forEach(function(w) { w.classList.remove('open'); });
  if (willOpen) wrap.classList.add('open');
}
document.addEventListener('click', function(e) {
  if (!e.target.closest || !e.target.closest('#page-cost-produksi .cp-picker')) {
    document.querySelectorAll('#page-cost-produksi .cp-picker.open').forEach(function(w) { w.classList.remove('open'); });
  }
});

// ─── FORM: Jurnal Harian ────────────────────────────────────────
var _cpJrnSelSku = '', _cpJrnSelDivisi = '', _cpJrnSelTukang = '', _cpJrnRate = 0;

function cpOpenJurnalForm(id) {
  document.getElementById('cp-jrn-edit-id').value = id || '';
  document.getElementById('cp-jrn-form-title').innerHTML = id
    ? '<i class="ti ti-edit"></i> Edit Jurnal'
    : '<i class="ti ti-notebook"></i> Tambah Jurnal';
  document.getElementById('cp-jrn-del-btn').style.display = id ? '' : 'none';

  var row = id ? _cpJurnal.find(function(j) { return j.id == id; }) : null;
  document.getElementById('cp-jrn-tanggal').value = row ? row.tanggal : new Date().toISOString().slice(0, 10);
  document.getElementById('cp-jrn-qty').value = row ? row.qty_pcs : '';

  _cpJrnSelSku    = row ? row.sku    : '';
  _cpJrnSelDivisi = row ? row.divisi : '';
  _cpJrnSelTukang = row ? row.tukang : '';
  _cpJrnRate      = 0;

  cpRenderSkuPickerList();
  cpRenderTukangPickerList();
  cpSetJrnLabel('sku', _cpJrnSelSku);
  cpSetJrnLabel('tukang', _cpJrnSelTukang);

  if (_cpJrnSelSku) {
    cpRenderDivisiPickerList(_cpJrnSelSku);
    cpSetJrnLabel('divisi', _cpJrnSelDivisi);
    var rr = _cpRate.find(function(r) { return r.sku === _cpJrnSelSku && r.divisi === _cpJrnSelDivisi; });
    _cpJrnRate = rr ? Number(rr.ongkos_per_lusin) : 0;
  } else {
    document.getElementById('cp-jrn-divisi-list').innerHTML = '';
    cpSetJrnLabel('divisi', '');
  }

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
    el.textContent = field === 'sku'    ? '— Pilih SKU —'
                    : field === 'divisi' ? (_cpJrnSelSku ? '— Pilih Divisi —' : '— Pilih SKU dulu —')
                    : '— Pilih Tukang —';
    el.classList.add('cp-placeholder');
  }
}

function cpRenderSkuPickerList() {
  var skus = [];
  _cpRate.forEach(function(r) { if (skus.indexOf(r.sku) === -1) skus.push(r.sku); });
  skus.sort();
  var list = document.getElementById('cp-jrn-sku-list');
  list.innerHTML = skus.length
    ? skus.map(function(s) { return '<div class="cp-picker-opt" onclick="cpPickJrnSku(\'' + cpEscJs(s) + '\')">' + cpEsc(s) + '</div>'; }).join('')
    : '<div class="cp-picker-empty">Belum ada SKU di Master Ongkos</div>';
}

function cpPickJrnSku(sku) {
  _cpJrnSelSku = sku;
  _cpJrnSelDivisi = '';
  _cpJrnRate = 0;
  cpSetJrnLabel('sku', sku);
  cpSetJrnLabel('divisi', '');
  cpRenderDivisiPickerList(sku);
  cpTogglePicker('cp-jrn-sku-picker');
  cpUpdateJurnalPreview();
}

function cpRenderDivisiPickerList(sku) {
  var divisis = _cpRate.filter(function(r) { return r.sku === sku; }).map(function(r) { return r.divisi; });
  var list = document.getElementById('cp-jrn-divisi-list');
  list.innerHTML = divisis.length
    ? divisis.map(function(d) { return '<div class="cp-picker-opt" onclick="cpPickJrnDivisi(\'' + cpEscJs(d) + '\')">' + cpEsc(d) + '</div>'; }).join('')
    : '<div class="cp-picker-empty">SKU ini belum punya rate divisi</div>';
}

function cpPickJrnDivisi(divisi) {
  _cpJrnSelDivisi = divisi;
  cpSetJrnLabel('divisi', divisi);
  var rr = _cpRate.find(function(r) { return r.sku === _cpJrnSelSku && r.divisi === divisi; });
  _cpJrnRate = rr ? Number(rr.ongkos_per_lusin) : 0;
  cpTogglePicker('cp-jrn-divisi-picker');
  cpUpdateJurnalPreview();
}

function cpRenderTukangPickerList() {
  var aktif = _cpTukang.filter(function(t) { return t.aktif; });
  var list = document.getElementById('cp-jrn-tukang-list');
  list.innerHTML = aktif.length
    ? aktif.map(function(t) { return '<div class="cp-picker-opt" onclick="cpPickJrnTukang(\'' + cpEscJs(t.nama) + '\')">' + cpEsc(t.nama) + '</div>'; }).join('')
    : '<div class="cp-picker-empty">Belum ada tukang aktif</div>';
}

function cpPickJrnTukang(nama) {
  _cpJrnSelTukang = nama;
  cpSetJrnLabel('tukang', nama);
  cpTogglePicker('cp-jrn-tukang-picker');
}

function cpUpdateJurnalPreview() {
  var qty = parseInt((document.getElementById('cp-jrn-qty').value || '0').replace(/[^0-9]/g, ''), 10) || 0;
  var total = _cpJrnRate ? Math.round((qty / 12) * _cpJrnRate) : 0;
  document.getElementById('cp-jrn-preview').innerHTML =
    'Rate: ' + (_cpJrnRate ? fmtRpFull(_cpJrnRate) + '/lusin' : '—') + ' · Total: <b>' + fmtRpFull(total) + '</b>';
}

async function cpSaveJurnal() {
  var id = document.getElementById('cp-jrn-edit-id').value;
  var tanggal = document.getElementById('cp-jrn-tanggal').value;
  var qty = parseInt((document.getElementById('cp-jrn-qty').value || '0').replace(/[^0-9]/g, ''), 10) || 0;
  if (!tanggal) return alert('Tanggal wajib diisi.');
  if (!_cpJrnSelSku) return alert('Pilih SKU dulu.');
  if (!_cpJrnSelDivisi) return alert('Pilih Divisi dulu.');
  if (!_cpJrnSelTukang) return alert('Pilih Tukang dulu.');
  if (qty <= 0) return alert('Qty (pcs) harus lebih dari 0.');

  var rr = _cpRate.find(function(r) { return r.sku === _cpJrnSelSku && r.divisi === _cpJrnSelDivisi; });
  if (!rr) return alert('Rate buat kombinasi SKU + Divisi ini belum ada — tambahin dulu di Master Ongkos.');

  var payload = {
    tanggal: tanggal, divisi: _cpJrnSelDivisi, tukang: _cpJrnSelTukang, sku: _cpJrnSelSku,
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

// ─── FORM: Master Ongkos ────────────────────────────────────────
function cpOpenRateForm(id) {
  document.getElementById('cp-rate-edit-id').value = id || '';
  document.getElementById('cp-rate-form-title').innerHTML = id
    ? '<i class="ti ti-edit"></i> Edit Rate'
    : '<i class="ti ti-list-details"></i> Tambah Rate';
  document.getElementById('cp-rate-del-btn').style.display = id ? '' : 'none';

  var row = id ? _cpRate.find(function(r) { return r.id == id; }) : null;
  document.getElementById('cp-rate-sku').value = row ? row.sku : '';
  document.getElementById('cp-rate-divisi').value = row ? row.divisi : '';
  idrInput('cp-rate-ongkos');
  idrSet('cp-rate-ongkos', row ? row.ongkos_per_lusin : 0);
  showModal('modal-cp-rate');
}

async function cpSaveRate() {
  var id = document.getElementById('cp-rate-edit-id').value;
  var sku = document.getElementById('cp-rate-sku').value.trim();
  var divisi = document.getElementById('cp-rate-divisi').value.trim();
  var ongkos = idrVal('cp-rate-ongkos');
  if (!sku) return alert('SKU wajib diisi.');
  if (!divisi) return alert('Divisi wajib diisi.');
  if (ongkos <= 0) return alert('Ongkos per Lusin harus lebih dari 0.');

  var payload = { sku: sku, divisi: divisi, ongkos_per_lusin: ongkos };
  try {
    if (id) await dbUpdate('cost_rate', id, payload);
    else    await dbInsert('cost_rate', payload);
  } catch (e) {
    var msg = /duplicate|unique/i.test(e.message) ? 'Kombinasi SKU + Divisi ini udah ada.' : e.message;
    return alert('Gagal simpan: ' + msg);
  }
  hideModal('modal-cp-rate');
  cpLoadAll();
}

async function cpDeleteRate() {
  var id = document.getElementById('cp-rate-edit-id').value;
  if (!id) return;
  if (!confirm('Hapus rate ini? Jurnal yang udah kepake gak ikut kehapus (rate_snapshot udah tersimpan sendiri di baris jurnalnya).')) return;
  try { await dbDelete('cost_rate', id); } catch (e) { return alert('Gagal hapus: ' + e.message); }
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
  document.getElementById('cp-tukang-aktif').checked = row ? !!row.aktif : true;
  showModal('modal-cp-tukang');
}

async function cpSaveTukang() {
  var id = document.getElementById('cp-tukang-edit-id').value;
  var nama = document.getElementById('cp-tukang-nama').value.trim();
  var aktif = document.getElementById('cp-tukang-aktif').checked;
  if (!nama) return alert('Nama wajib diisi.');

  var payload = { nama: nama, aktif: aktif };
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
