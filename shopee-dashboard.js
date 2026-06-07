// ─── SHOPEE-DASHBOARD.JS — Analisis Toko Shopee (Upload Manual XLSX/CSV) ───
// Version: 20260607-v1
// Storage: localStorage per toko per bulan (key: sdash_[tokoId]_[yyyymm])
// Data src: Income.xlsx, Order_completed.xlsx, parentskudetail.xlsx, adwords.csv
// Multi-toko: SHP.ZENOOT, SHP.ELENZ, SHP.ALLEY (auto-detect dari username header)

(function() {

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const PAGE_ID = 'page-shopee-dashboard';
const LS_PREFIX = 'sdash_';
const LS_ACTIVE = 'sdash_active_toko';
const LS_HISTORY = 'sdash_history';

// Map username Shopee → channel ID
const TOKO_MAP = {
  'zenootsweater': { id: 'SHP.ZENOOT', label: 'SHP.ZENOOT', color: '#E85630' },
  'elenz':         { id: 'SHP.ELENZ',  label: 'SHP.ELENZ',  color: '#185FA5' },
  'alley':         { id: 'SHP.ALLEY',  label: 'SHP.ALLEY',  color: '#1D9E75' },
};
// Also detect by partial match
const TOKO_KEYS = Object.keys(TOKO_MAP);

// ─── STATE ───────────────────────────────────────────────────────────────────
let _activeToko = localStorage.getItem(LS_ACTIVE) || 'SHP.ZENOOT';
let _activeTab = 'ringkasan';
let _activeMonthKey = null; // 'yyyymm'
let _importErrors = [];

// ─── INJECT HTML ─────────────────────────────────────────────────────────────
document.getElementById(PAGE_ID).innerHTML = `
<div class="sdash-root">

  <!-- TOPBAR TOKO SWITCHER -->
  <div class="sdash-toko-bar">
    <div class="sdash-toko-tabs" id="sd-toko-tabs">
      ${Object.values(TOKO_MAP).map(t => `
        <button class="sdash-toko-btn ${t.id === _activeToko ? 'active' : ''}"
          data-toko="${t.id}" style="--tc:${t.color}"
          onclick="sdSwitchToko('${t.id}')">
          <i class="ti ti-brand-shopee"></i> ${t.label}
        </button>
      `).join('')}
    </div>
    <button class="sdash-upload-btn" onclick="sdOpenUpload()">
      <i class="ti ti-upload"></i> Upload Data
    </button>
  </div>

  <!-- BULAN SELECTOR -->
  <div class="sdash-month-bar" id="sd-month-bar">
    <span style="font-size:11px;color:var(--color-text-tertiary);margin-right:6px">Periode:</span>
    <div id="sd-month-chips" style="display:flex;gap:6px;flex-wrap:wrap"></div>
  </div>

  <!-- MAIN CONTENT -->
  <div id="sd-main">
    <div id="sd-empty" class="sdash-empty">
      <i class="ti ti-cloud-upload" style="font-size:36px;opacity:.3"></i>
      <div style="margin-top:12px;font-size:14px;color:var(--color-text-secondary)">
        Belum ada data untuk <b id="sd-empty-toko">—</b>
      </div>
      <div style="font-size:12px;color:var(--color-text-tertiary);margin-top:6px">
        Upload 4 file export Seller Centre untuk mulai analisis
      </div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="sdOpenUpload()">
        <i class="ti ti-upload"></i> Upload Sekarang
      </button>
    </div>
    <div id="sd-dashboard" style="display:none">
      <!-- TAB BAR -->
      <div class="sdash-tab-bar" id="sd-tab-bar">
        <button class="sdash-tab active" data-tab="ringkasan" onclick="sdTab('ringkasan',this)">📊 Ringkasan</button>
        <button class="sdash-tab" data-tab="keuangan" onclick="sdTab('keuangan',this)">💰 Keuangan</button>
        <button class="sdash-tab" data-tab="produk" onclick="sdTab('produk',this)">📦 Produk</button>
        <button class="sdash-tab" data-tab="sebaran" onclick="sdTab('sebaran',this)">🗺️ Sebaran</button>
        <button class="sdash-tab" data-tab="iklan" onclick="sdTab('iklan',this)">📢 Iklan</button>
        <button class="sdash-tab" data-tab="proyeksi" onclick="sdTab('proyeksi',this)">📈 Proyeksi</button>
      </div>
      <div id="sd-tab-content"></div>
    </div>
  </div>

  <!-- UPLOAD MODAL -->
  <div class="sdash-modal-overlay" id="sd-upload-modal" style="display:none" onclick="if(event.target===this)sdCloseUpload()">
    <div class="sdash-modal">
      <div class="sdash-modal-head">
        <span><i class="ti ti-upload"></i> Upload Data Shopee</span>
        <button class="sdash-modal-close" onclick="sdCloseUpload()"><i class="ti ti-x"></i></button>
      </div>
      <div class="sdash-modal-body">
        <div class="sdash-upload-info">
          Upload 4 file export dari <b>Seller Centre → Laporan</b>. Sistem auto-detect toko & periode dari isi file.
        </div>

        <!-- UPLOAD ZONES -->
        <div class="sdash-upload-grid">
          <div class="sdash-drop-zone" id="dz-income" ondragover="sdDragOver(event)" ondragleave="sdDragLeave(event)" ondrop="sdDrop(event,'income')">
            <i class="ti ti-file-spreadsheet"></i>
            <div class="sdz-label">Income / Dana Dilepas</div>
            <div class="sdz-hint">Income_sudah_dilepas_*.xlsx</div>
            <div class="sdz-status" id="dzs-income">Belum diupload</div>
            <input type="file" accept=".xlsx" onchange="sdFileInput(event,'income')" style="display:none" id="fi-income">
            <button class="sdz-btn" onclick="document.getElementById('fi-income').click()">Pilih File</button>
          </div>
          <div class="sdash-drop-zone" id="dz-order" ondragover="sdDragOver(event)" ondragleave="sdDragLeave(event)" ondrop="sdDrop(event,'order')">
            <i class="ti ti-file-spreadsheet"></i>
            <div class="sdz-label">Order Completed</div>
            <div class="sdz-hint">Order_completed_*.xlsx</div>
            <div class="sdz-status" id="dzs-order">Belum diupload</div>
            <input type="file" accept=".xlsx" onchange="sdFileInput(event,'order')" style="display:none" id="fi-order">
            <button class="sdz-btn" onclick="document.getElementById('fi-order').click()">Pilih File</button>
          </div>
          <div class="sdash-drop-zone" id="dz-produk" ondragover="sdDragOver(event)" ondragleave="sdDragLeave(event)" ondrop="sdDrop(event,'produk')">
            <i class="ti ti-file-spreadsheet"></i>
            <div class="sdz-label">Performa Produk (SKU Detail)</div>
            <div class="sdz-hint">parentskudetail_*.xlsx</div>
            <div class="sdz-status" id="dzs-produk">Belum diupload</div>
            <input type="file" accept=".xlsx" onchange="sdFileInput(event,'produk')" style="display:none" id="fi-produk">
            <button class="sdz-btn" onclick="document.getElementById('fi-produk').click()">Pilih File</button>
          </div>
          <div class="sdash-drop-zone" id="dz-iklan" ondragover="sdDragOver(event)" ondragleave="sdDragLeave(event)" ondrop="sdDrop(event,'iklan')">
            <i class="ti ti-file-invoice"></i>
            <div class="sdz-label">Adwords / Tagihan Iklan</div>
            <div class="sdz-hint">*_adwords_bill_*.csv</div>
            <div class="sdz-status" id="dzs-iklan">Belum diupload</div>
            <input type="file" accept=".csv" onchange="sdFileInput(event,'iklan')" style="display:none" id="fi-iklan">
            <button class="sdz-btn" onclick="document.getElementById('fi-iklan').click()">Pilih File</button>
          </div>
        </div>

        <!-- ERROR LOG -->
        <div id="sd-import-errors" style="display:none;margin-top:10px;padding:10px;background:var(--color-background-danger);border-radius:8px;font-size:12px;color:var(--color-text-danger)"></div>

        <!-- SAVE BTN -->
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn" onclick="sdCloseUpload()">Tutup</button>
          <button class="btn btn-primary" id="sd-save-btn" onclick="sdSaveImport()" disabled>
            <i class="ti ti-device-floppy"></i> Simpan Data
          </button>
        </div>
      </div>
    </div>
  </div>

</div><!-- .sdash-root -->
`;

// ─── STYLESHEET INJECT ────────────────────────────────────────────────────────
const _style = document.createElement('style');
_style.textContent = `
.sdash-root{padding:.75rem 0;font-family:var(--font-sans,var(--f));color:var(--color-text-primary)}

/* TOKO BAR */
.sdash-toko-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.sdash-toko-tabs{display:flex;gap:6px;flex-wrap:wrap}
.sdash-toko-btn{padding:5px 14px;border:.5px solid var(--color-border-secondary);border-radius:20px;background:transparent;color:var(--color-text-secondary);cursor:pointer;font-size:12px;font-weight:500;transition:all .15s;display:flex;align-items:center;gap:5px}
.sdash-toko-btn.active{background:var(--tc,#185FA5);color:#fff;border-color:transparent}
.sdash-upload-btn{padding:5px 14px;border:.5px solid var(--color-border-secondary);border-radius:8px;background:transparent;color:var(--color-text-secondary);cursor:pointer;font-size:12px;font-weight:500;display:flex;align-items:center;gap:5px;white-space:nowrap}
.sdash-upload-btn:hover{background:var(--color-background-secondary)}

/* MONTH BAR */
.sdash-month-bar{display:flex;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:4px}
.sd-month-chip{padding:3px 12px;border:.5px solid var(--color-border-secondary);border-radius:12px;background:transparent;color:var(--color-text-secondary);cursor:pointer;font-size:11px;transition:all .12s}
.sd-month-chip.active{background:var(--color-text-primary);color:var(--color-background-primary);border-color:transparent}

/* EMPTY */
.sdash-empty{text-align:center;padding:60px 20px}

/* TAB BAR */
.sdash-tab-bar{display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap}
.sdash-tab{padding:5px 13px;border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md,8px);background:transparent;color:var(--color-text-secondary);cursor:pointer;font-size:12px;font-weight:500;transition:all .12s}
.sdash-tab.active{background:#185FA5;color:#E6F1FB;border-color:#185FA5}

/* KPI GRID */
.sd-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px}
.sd-kpi{background:var(--color-background-secondary);border-radius:var(--border-radius-md,8px);padding:.75rem .9rem}
.sd-kpi .kl{font-size:10px;color:var(--color-text-tertiary);margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em}
.sd-kpi .kv{font-size:20px;font-weight:500;line-height:1.1}
.sd-kpi .ks{font-size:11px;color:var(--color-text-secondary);margin-top:4px}
.sd-kpi .kd{font-size:11px;font-weight:500;margin-top:3px}

/* CARDS */
.sd-card{background:var(--color-background-primary);border:.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg,12px);padding:.9rem 1rem;margin-bottom:10px}
.sd-card-title{font-size:12px;font-weight:500;color:var(--color-text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.sd-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.sd-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px}

/* TABLES */
.sd-tbl{width:100%;font-size:11px;border-collapse:collapse}
.sd-tbl th{color:var(--color-text-tertiary);font-weight:500;text-align:left;padding:4px 6px 6px;border-bottom:.5px solid var(--color-border-tertiary);font-size:10px;white-space:nowrap}
.sd-tbl th.r,.sd-tbl td.r{text-align:right}
.sd-tbl td{padding:5px 6px;border-bottom:.5px solid var(--color-border-tertiary);color:var(--color-text-primary)}
.sd-tbl tr:last-child td{border-bottom:none}
.sd-tbl .pnc{max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--color-text-secondary)}

/* BADGES */
.sd-badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:6px;font-weight:500;white-space:nowrap}
.sd-badge.ok{background:var(--color-background-success,#0a3d2b);color:var(--color-text-success,#0F6E56)}
.sd-badge.warn{background:var(--color-background-warning,#3d2a00);color:var(--color-text-warning,#BA7517)}
.sd-badge.danger{background:var(--color-background-danger,#3d0a00);color:var(--color-text-danger,#D85A30)}
.sd-badge.info{background:var(--color-background-info,#0a1a3d);color:var(--color-text-info,#185FA5)}
.sd-badge.gray{background:var(--color-background-secondary);color:var(--color-text-secondary)}

/* H-BAR */
.sd-hbar-row{display:flex;align-items:center;gap:7px;margin-bottom:5px}
.sd-hbl{font-size:11px;color:var(--color-text-secondary);min-width:90px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-hbg{flex:1;height:6px;background:var(--color-background-secondary);border-radius:3px;overflow:hidden}
.sd-hbf{height:6px;border-radius:3px}
.sd-hbv{font-size:11px;font-weight:500;min-width:28px;text-align:right;color:var(--color-text-primary)}

/* FEE ROWS */
.sd-fee-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:.5px solid var(--color-border-tertiary);font-size:12px}
.sd-fee-row:last-child{border-bottom:none}
.sd-fee-k{color:var(--color-text-secondary)}
.sd-fee-v.neg{color:#D85A30;font-weight:500}
.sd-fee-v.pos{color:#0F6E56;font-weight:500}
.sd-fee-v.bold{font-weight:600;color:var(--color-text-primary)}

/* PROYEKSI CARDS */
.sd-proj-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.sd-proj-card{border-radius:var(--border-radius-md,8px);padding:.85rem 1rem;text-align:center}
.sd-proj-card.worst{background:rgba(216,90,48,.1);border:.5px solid rgba(216,90,48,.3)}
.sd-proj-card.expected{background:rgba(24,95,165,.12);border:.5px solid rgba(24,95,165,.35)}
.sd-proj-card.best{background:rgba(29,158,117,.1);border:.5px solid rgba(29,158,117,.3)}
.sd-proj-card .pct{font-size:10px;font-weight:500;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px}
.sd-proj-card.worst .pct{color:#D85A30}
.sd-proj-card.expected .pct{color:#185FA5}
.sd-proj-card.best .pct{color:#0F6E56}
.sd-proj-card .pv{font-size:22px;font-weight:600;line-height:1}
.sd-proj-card .ps{font-size:11px;color:var(--color-text-tertiary);margin-top:4px}

/* IKLAN DAILY BAR */
.sd-iklan-day{display:flex;align-items:center;gap:6px;margin-bottom:3px}
.sd-iklan-day .dl{font-size:10px;color:var(--color-text-tertiary);width:38px;text-align:right;flex-shrink:0}
.sd-iklan-day .dg{flex:1;height:14px;background:var(--color-background-secondary);border-radius:3px;overflow:hidden;position:relative}
.sd-iklan-day .df{height:14px;border-radius:3px;background:#534AB7;display:flex;align-items:center;padding:0 4px}
.sd-iklan-day .dv{font-size:9px;color:#fff;white-space:nowrap;overflow:hidden}
.sd-iklan-day .dt{font-size:10px;font-weight:500;min-width:50px;text-align:right;color:var(--color-text-primary)}

/* COLORS */
.up{color:#0F6E56}.dn{color:#D85A30}.neu{color:var(--color-text-tertiary)}

/* UPLOAD MODAL */
.sdash-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:900;display:flex;align-items:center;justify-content:center;padding:16px}
.sdash-modal{background:var(--color-background-primary);border-radius:var(--border-radius-xl,16px);width:100%;max-width:680px;max-height:90vh;overflow-y:auto}
.sdash-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:.5px solid var(--color-border-tertiary);font-size:14px;font-weight:600}
.sdash-modal-close{background:none;border:none;cursor:pointer;color:var(--color-text-secondary);font-size:18px;padding:4px}
.sdash-modal-body{padding:16px 20px}
.sdash-upload-info{font-size:12px;color:var(--color-text-secondary);padding:10px 12px;background:var(--color-background-secondary);border-radius:8px;margin-bottom:14px;line-height:1.6}
.sdash-upload-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:500px){.sdash-upload-grid{grid-template-columns:1fr}.sd-grid2,.sd-grid3,.sd-proj-grid{grid-template-columns:1fr}}
.sdash-drop-zone{border:1.5px dashed var(--color-border-secondary);border-radius:10px;padding:14px 12px;text-align:center;transition:border-color .15s;cursor:default}
.sdash-drop-zone.drag-over{border-color:#185FA5;background:rgba(24,95,165,.06)}
.sdash-drop-zone.done{border-color:#0F6E56;border-style:solid}
.sdash-drop-zone.error{border-color:#D85A30;border-style:solid}
.sdash-drop-zone i{font-size:22px;color:var(--color-text-tertiary);margin-bottom:6px}
.sdz-label{font-size:12px;font-weight:600;color:var(--color-text-primary);margin-bottom:2px}
.sdz-hint{font-size:10px;color:var(--color-text-tertiary);margin-bottom:8px;font-style:italic}
.sdz-status{font-size:11px;color:var(--color-text-secondary);margin-bottom:8px;min-height:14px}
.sdash-drop-zone.done .sdz-status{color:#0F6E56;font-weight:500}
.sdash-drop-zone.error .sdz-status{color:#D85A30}
.sdz-btn{padding:4px 12px;border:.5px solid var(--color-border-secondary);border-radius:6px;background:var(--color-background-secondary);color:var(--color-text-primary);cursor:pointer;font-size:11px}
.sdz-btn:hover{background:var(--color-background-tertiary,var(--color-background-secondary))}
`;
document.head.appendChild(_style);

// ─── IMPORT STATE (per upload session) ───────────────────────────────────────
let _importSession = { income: null, order: null, produk: null, iklan: null };

// ─── TOKO SWITCHER ────────────────────────────────────────────────────────────
window.sdSwitchToko = function(tokoId) {
  _activeToko = tokoId;
  localStorage.setItem(LS_ACTIVE, tokoId);
  document.querySelectorAll('.sdash-toko-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.toko === tokoId);
  });
  sdRenderMonthBar();
};

// ─── MONTH BAR ────────────────────────────────────────────────────────────────
function sdGetAllMonths(tokoId) {
  const months = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(LS_PREFIX + tokoId + '_')) {
      months.push(k.replace(LS_PREFIX + tokoId + '_', ''));
    }
  }
  return months.sort().reverse();
}

function sdRenderMonthBar() {
  const months = sdGetAllMonths(_activeToko);
  const chips = document.getElementById('sd-month-chips');
  const empty = document.getElementById('sd-empty');
  const dash  = document.getElementById('sd-dashboard');
  const emptyToko = document.getElementById('sd-empty-toko');

  if (emptyToko) emptyToko.textContent = _activeToko;

  if (months.length === 0) {
    empty.style.display = 'block';
    dash.style.display  = 'none';
    chips.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  dash.style.display  = 'block';

  if (!_activeMonthKey || !months.includes(_activeMonthKey)) {
    _activeMonthKey = months[0];
  }

  chips.innerHTML = months.map(m => {
    const label = sdMonthLabel(m);
    return `<button class="sd-month-chip ${m === _activeMonthKey ? 'active' : ''}"
      onclick="sdSelectMonth('${m}')">${label}</button>`;
  }).join('');

  sdRenderDashboard();
}

window.sdSelectMonth = function(m) {
  _activeMonthKey = m;
  document.querySelectorAll('.sd-month-chip').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === sdMonthLabel(m));
  });
  sdRenderDashboard();
};

function sdMonthLabel(yyyymm) {
  const y = yyyymm.slice(0, 4);
  const mo = parseInt(yyyymm.slice(4, 6)) - 1;
  const names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return names[mo] + ' ' + y;
}

// ─── TAB SWITCHER ─────────────────────────────────────────────────────────────
window.sdTab = function(tab, btn) {
  _activeTab = tab;
  document.querySelectorAll('.sdash-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  sdRenderTab(tab);
};

// ─── MAIN RENDER ─────────────────────────────────────────────────────────────
function sdRenderDashboard() {
  document.querySelectorAll('.sdash-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === _activeTab));
  sdRenderTab(_activeTab);
}

function sdGetData(tokoId, monthKey) {
  const raw = localStorage.getItem(LS_PREFIX + tokoId + '_' + monthKey);
  return raw ? JSON.parse(raw) : null;
}

function sdGetPrevData(tokoId, monthKey) {
  const months = sdGetAllMonths(tokoId);
  const idx = months.indexOf(monthKey);
  if (idx < months.length - 1) return sdGetData(tokoId, months[idx + 1]);
  return null;
}

function sdRenderTab(tab) {
  const el = document.getElementById('sd-tab-content');
  const data = sdGetData(_activeToko, _activeMonthKey);
  const prev = sdGetPrevData(_activeToko, _activeMonthKey);
  if (!data) { el.innerHTML = '<div style="padding:20px;color:var(--color-text-tertiary);text-align:center">Data tidak tersedia</div>'; return; }

  if (tab === 'ringkasan') el.innerHTML = sdTabRingkasan(data, prev);
  else if (tab === 'keuangan') el.innerHTML = sdTabKeuangan(data, prev);
  else if (tab === 'produk') el.innerHTML = sdTabProduk(data, prev);
  else if (tab === 'sebaran') el.innerHTML = sdTabSebaran(data, prev);
  else if (tab === 'iklan') el.innerHTML = sdTabIklan(data, prev);
  else if (tab === 'proyeksi') el.innerHTML = sdTabProyeksi(_activeToko, _activeMonthKey);
}

// ─── FORMAT HELPERS ──────────────────────────────────────────────────────────
function fRp(v, dec) {
  if (v === undefined || v === null || isNaN(v)) return '—';
  const abs = Math.abs(v);
  let s;
  if (abs >= 1000000) s = (v / 1000000).toFixed(dec !== undefined ? dec : 2) + ' jt';
  else if (abs >= 1000) s = (v / 1000).toFixed(dec !== undefined ? dec : 0) + ' rb';
  else s = Math.round(v).toString();
  return 'Rp ' + s;
}
function fPct(v) { return v !== undefined && !isNaN(v) ? v.toFixed(1) + '%' : '—'; }
function diff(cur, prv) {
  if (!prv || prv === 0) return '';
  const d = cur - prv;
  const p = ((d / Math.abs(prv)) * 100).toFixed(1);
  return d >= 0 ? `<span class="up">↑ ${fRp(Math.abs(d))} (+${p}%)</span>` : `<span class="dn">↓ ${fRp(Math.abs(d))} (${p}%)</span>`;
}
function diffN(cur, prv, unit) {
  if (!prv) return '';
  const d = cur - prv;
  const p = ((d / Math.abs(prv)) * 100).toFixed(1);
  const u = unit || '';
  return d >= 0 ? `<span class="up">↑ ${d}${u} (+${p}%)</span>` : `<span class="dn">↓ ${Math.abs(d)}${u} (${p}%)</span>`;
}

// ─── TAB: RINGKASAN ──────────────────────────────────────────────────────────
function sdTabRingkasan(d, prev) {
  const p = prev;
  const totalFee = (d.fee_layanan||0) + (d.fee_admin||0) + (d.fee_proses||0) + (d.fee_saldo_otomatis||0) + (d.fee_komisi_ams||0) + (d.fee_ongkir_net||0);
  const feeRate = d.omset > 0 ? (Math.abs(totalFee) / d.omset * 100).toFixed(1) : 0;
  const escrow = d.total_dilepas || 0;
  const marginRate = d.omset > 0 ? (escrow / d.omset * 100).toFixed(1) : 0;
  const avgPerOrder = d.total_pesanan > 0 ? d.omset / d.total_pesanan : 0;
  const iklanTotal = d.iklan_spend || 0;
  const roiIklan = iklanTotal > 0 && d.omset > 0 ? (d.omset / iklanTotal).toFixed(1) : '—';

  return `
  <div class="sd-kpi-grid">
    <div class="sd-kpi"><div class="kl">Omset (Subtotal)</div><div class="kv">${fRp(d.omset)}</div><div class="ks">${d.total_pesanan} pesanan selesai</div><div class="kd">${p ? diff(d.omset, p.omset) : ''}</div></div>
    <div class="sd-kpi"><div class="kl">Escrow Dilepas</div><div class="kv">${fRp(escrow)}</div><div class="ks">net setelah semua biaya</div><div class="kd ${marginRate >= 60 ? 'up' : marginRate >= 40 ? 'neu' : 'dn'}">margin bersih ${marginRate}%</div></div>
    <div class="sd-kpi"><div class="kl">Total Biaya Platform</div><div class="kv">${fRp(Math.abs(totalFee))}</div><div class="ks">dari omset ${fRp(d.omset)}</div><div class="kd dn">${feeRate}% tergerus biaya</div></div>
    <div class="sd-kpi"><div class="kl">Biaya Iklan</div><div class="kv">${fRp(iklanTotal)}</div><div class="ks">adwords spend</div><div class="kd ${parseFloat(roiIklan) >= 5 ? 'up' : 'dn'}">ROAS ${roiIklan}×</div></div>
    <div class="sd-kpi"><div class="kl">Avg. Nilai / Pesanan</div><div class="kv">${fRp(avgPerOrder)}</div><div class="ks">subtotal ÷ ${d.total_pesanan} pesanan</div><div class="kd">${p ? diffN(Math.round(avgPerOrder), Math.round(p.omset/p.total_pesanan),'') : ''}</div></div>
    <div class="sd-kpi"><div class="kl">Hari Aktif Transaksi</div><div class="kv">${d.hari_aktif||'—'} hari</div><div class="ks">avg ${d.total_pesanan && d.hari_aktif ? (d.total_pesanan/d.hari_aktif).toFixed(1) : '—'} pesanan/hari aktif</div><div class="kd">${p ? diffN(d.hari_aktif, p.hari_aktif,' hari') : ''}</div></div>
    ${d.total_refund ? `<div class="sd-kpi"><div class="kl">Refund / Pengembalian</div><div class="kv dn">${fRp(d.total_refund)}</div><div class="ks">dari pengembalian dana</div></div>` : ''}
    ${d.total_voucher ? `<div class="sd-kpi"><div class="kl">Voucher Penjual</div><div class="kv dn">${fRp(Math.abs(d.total_voucher))}</div><div class="ks">ditanggung penjual</div></div>` : ''}
  </div>

  ${p ? `
  <div class="sd-card">
    <div class="sd-card-title"><i class="ti ti-arrows-diff"></i>Perbandingan vs Bulan Sebelumnya</div>
    <table class="sd-tbl">
      <tr><th>Metrik</th><th class="r">${sdMonthLabel(_activeMonthKey)}</th><th class="r">Sebelumnya</th><th class="r">Selisih</th></tr>
      <tr><td>Total Pesanan</td><td class="r">${d.total_pesanan}</td><td class="r">${p.total_pesanan}</td><td class="r">${diffN(d.total_pesanan,p.total_pesanan,'')}</td></tr>
      <tr><td>Omset</td><td class="r">${fRp(d.omset)}</td><td class="r">${fRp(p.omset)}</td><td class="r">${diff(d.omset,p.omset)}</td></tr>
      <tr><td>Escrow Dilepas</td><td class="r">${fRp(d.total_dilepas)}</td><td class="r">${fRp(p.total_dilepas)}</td><td class="r">${diff(d.total_dilepas,p.total_dilepas)}</td></tr>
      <tr><td>Biaya Iklan</td><td class="r">${fRp(d.iklan_spend)}</td><td class="r">${fRp(p.iklan_spend)}</td><td class="r">${diff(d.iklan_spend,p.iklan_spend)}</td></tr>
      <tr><td>Hari Aktif</td><td class="r">${d.hari_aktif}</td><td class="r">${p.hari_aktif}</td><td class="r">${diffN(d.hari_aktif,p.hari_aktif,' hari')}</td></tr>
    </table>
  </div>` : ''}
  `;
}

// ─── TAB: KEUANGAN ───────────────────────────────────────────────────────────
function sdTabKeuangan(d) {
  const rows = [
    ['Harga Asli Produk', d.harga_asli, 'pos'],
    ['Pengembalian Dana', d.total_refund, 'neg'],
    ['Voucher Penjual', d.total_voucher, 'neg'],
    ['— Subtotal Pesanan', d.omset, 'bold'],
    ['', null, ''],
    ['Biaya Komisi AMS', d.fee_komisi_ams, 'neg'],
    ['Biaya Administrasi', d.fee_admin, 'neg'],
    ['Biaya Layanan', d.fee_layanan, 'neg'],
    ['Biaya Proses Pesanan', d.fee_proses, 'neg'],
    ['Biaya Isi Saldo Otomatis', d.fee_saldo_otomatis, 'neg'],
    ['Biaya Ongkir (neto)', d.fee_ongkir_net, 'neg'],
    ['Biaya Premi', d.fee_premi, 'neg'],
    ['Biaya Kampanye', d.fee_kampanye, 'neg'],
    ['', null, ''],
    ['✅ Total Escrow Dilepas', d.total_dilepas, 'bold pos'],
  ];

  return `
  <div class="sd-grid2">
    <div class="sd-card">
      <div class="sd-card-title"><i class="ti ti-receipt-2"></i>Rincian Keuangan Lengkap</div>
      ${rows.map(([k,v,cls]) => {
        if (!k) return `<div style="height:6px"></div>`;
        if (v === null || v === undefined || v === 0) return '';
        return `<div class="sd-fee-row"><span class="sd-fee-k">${k}</span><span class="sd-fee-v ${cls}">${v >= 0 ? '' : '−'}${fRp(Math.abs(v))}</span></div>`;
      }).join('')}
    </div>
    <div>
      <div class="sd-card">
        <div class="sd-card-title"><i class="ti ti-chart-pie"></i>Komposisi Biaya</div>
        ${sdFeeBar('Layanan', Math.abs(d.fee_layanan||0), Math.abs(d.omset), '#D85A30')}
        ${sdFeeBar('Administrasi', Math.abs(d.fee_admin||0), Math.abs(d.omset), '#BA7517')}
        ${sdFeeBar('Saldo Otomatis', Math.abs(d.fee_saldo_otomatis||0), Math.abs(d.omset), '#A32D2D')}
        ${sdFeeBar('Komisi AMS', Math.abs(d.fee_komisi_ams||0), Math.abs(d.omset), '#534AB7')}
        ${sdFeeBar('Proses Pesanan', Math.abs(d.fee_proses||0), Math.abs(d.omset), '#1D9E75')}
        ${sdFeeBar('Ongkir (neto)', Math.abs(d.fee_ongkir_net||0), Math.abs(d.omset), '#185FA5')}
        ${sdFeeBar('Voucher Penjual', Math.abs(d.total_voucher||0), Math.abs(d.omset), '#993C1D')}
        ${sdFeeBar('Iklan', Math.abs(d.iklan_spend||0), Math.abs(d.omset), '#7F77DD')}
      </div>
      <div class="sd-card" style="margin-top:0">
        <div class="sd-card-title"><i class="ti ti-cash"></i>Metode Pembayaran</div>
        ${sdHbarList(d.metode_bayar || [], '#185FA5', d.total_pesanan)}
      </div>
    </div>
  </div>`;
}

function sdFeeBar(label, val, total, color) {
  if (!val) return '';
  const pct = total > 0 ? Math.min((val/total)*100, 100) : 0;
  return `<div class="sd-hbar-row">
    <div class="sd-hbl">${label}</div>
    <div class="sd-hbg"><div class="sd-hbf" style="width:${pct.toFixed(1)}%;background:${color}"></div></div>
    <div class="sd-hbv">${fPct(pct)}</div>
  </div>`;
}

function sdHbarList(arr, color, total) {
  if (!arr || arr.length === 0) return '<div style="color:var(--color-text-tertiary);font-size:12px">—</div>';
  const max = arr[0].v;
  return arr.map(({n,v}) => {
    const pct = max > 0 ? (v/max)*100 : 0;
    return `<div class="sd-hbar-row">
      <div class="sd-hbl">${n}</div>
      <div class="sd-hbg"><div class="sd-hbf" style="width:${pct.toFixed(1)}%;background:${color}"></div></div>
      <div class="sd-hbv">${v}</div>
    </div>`;
  }).join('');
}

// ─── TAB: PRODUK ─────────────────────────────────────────────────────────────
function sdTabProduk(d) {
  const prodList = d.produk_performa || [];
  const hargaTdk = d.harga_tidak_kompetitif || [];
  const hargaOk  = d.harga_kompetitif || [];
  const prodBaru = d.produk_baru || [];

  return `
  ${hargaTdk.length ? `
  <div class="sd-card">
    <div class="sd-card-title"><i class="ti ti-alert-triangle"></i>⚠️ Harga Tidak Kompetitif</div>
    <table class="sd-tbl">
      <tr><th>Produk</th><th class="r">Views</th><th class="r">Klik</th><th class="r">CTR</th><th class="r">Keranjang</th><th class="r">Orders</th><th>Status</th></tr>
      ${hargaTdk.map(p => `<tr>
        <td class="pnc" title="${p.nama}">${sdShortName(p.nama)}</td>
        <td class="r">${(p.views||0).toLocaleString('id-ID')}</td>
        <td class="r">${p.klik||0}</td>
        <td class="r">${p.ctr||'—'}</td>
        <td class="r">${p.keranjang||0}</td>
        <td class="r"><b>${p.orders||0}</b></td>
        <td><span class="sd-badge danger">Harga tidak kompetitif</span></td>
      </tr>`).join('')}
    </table>
  </div>` : ''}

  <div class="sd-card">
    <div class="sd-card-title"><i class="ti ti-package"></i>Performa Semua Produk</div>
    <div style="overflow-x:auto">
    <table class="sd-tbl" style="min-width:600px">
      <tr><th>Produk</th><th class="r">Views</th><th class="r">Klik</th><th class="r">CTR</th><th class="r">CVR</th><th class="r">Orders</th><th class="r">Revenue</th><th class="r">Keranjang</th><th>Status</th></tr>
      ${prodList.slice(0,20).map(p => `<tr>
        <td class="pnc" title="${p.nama}">${sdShortName(p.nama)}</td>
        <td class="r">${(p.views||0).toLocaleString('id-ID')}</td>
        <td class="r">${p.klik||0}</td>
        <td class="r">${p.ctr||'—'}</td>
        <td class="r">${p.cvr||'—'}</td>
        <td class="r"><b>${p.orders||0}</b></td>
        <td class="r">${fRp(p.revenue||0)}</td>
        <td class="r">${p.keranjang||0}</td>
        <td>${sdProdukBadge(p)}</td>
      </tr>`).join('')}
    </table>
    </div>
  </div>

  ${prodBaru.length ? `
  <div class="sd-card">
    <div class="sd-card-title"><i class="ti ti-clock"></i>🆕 Produk Baru — masih dalam masa pertumbuhan</div>
    <table class="sd-tbl">
      <tr><th>Produk</th><th class="r">Usia</th><th class="r">Views</th><th class="r">Orders</th><th class="r">Revenue</th></tr>
      ${prodBaru.map(p => `<tr>
        <td class="pnc">${sdShortName(p.nama)}</td>
        <td class="r">${p.usia_hari} hr</td>
        <td class="r">${(p.views||0).toLocaleString('id-ID')}</td>
        <td class="r"><b class="${!p.orders?'dn':''}">${p.orders||0}</b></td>
        <td class="r">${p.revenue ? fRp(p.revenue) : '—'}</td>
      </tr>`).join('')}
    </table>
  </div>` : ''}

  ${hargaOk.length ? `
  <div class="sd-card">
    <div class="sd-card-title"><i class="ti ti-circle-check"></i>✅ Harga Sudah Kompetitif — divalidasi Shopee</div>
    <table class="sd-tbl">
      <tr><th>Produk</th><th class="r">Views</th><th class="r">Orders</th><th class="r">Revenue</th><th class="r">CTR</th><th class="r">CVR</th></tr>
      ${hargaOk.map(p => `<tr>
        <td class="pnc">${sdShortName(p.nama)}</td>
        <td class="r">${(p.views||0).toLocaleString('id-ID')}</td>
        <td class="r">${p.orders||0}</td>
        <td class="r">${fRp(p.revenue||0)}</td>
        <td class="r">${p.ctr||'—'}</td>
        <td class="r">${p.cvr||'—'}</td>
      </tr>`).join('')}
    </table>
  </div>` : ''}
  `;
}

function sdProdukBadge(p) {
  if (p.flag_harga_tidak_kompetitif) return '<span class="sd-badge danger">Harga ⚠️</span>';
  if (p.flag_harga_kompetitif) return '<span class="sd-badge ok">Kompetitif ✓</span>';
  if (p.orders > 0) return '<span class="sd-badge ok">Terjual</span>';
  if (p.keranjang > 5) return '<span class="sd-badge warn">Keranjang tinggi</span>';
  if (p.views > 1000 && !p.orders) return '<span class="sd-badge warn">Traffic, 0 order</span>';
  return '<span class="sd-badge gray">Organik</span>';
}

function sdShortName(nama) {
  if (!nama) return '—';
  if (nama.length <= 30) return nama;
  return nama.slice(0, 28) + '…';
}

// ─── TAB: SEBARAN ─────────────────────────────────────────────────────────────
function sdTabSebaran(d) {
  return `
  <div class="sd-grid3">
    <div class="sd-card">
      <div class="sd-card-title"><i class="ti ti-map-pin"></i>Sebaran Provinsi</div>
      ${sdHbarList(d.provinsi || [], '#185FA5', d.total_pesanan)}
    </div>
    <div class="sd-card">
      <div class="sd-card-title"><i class="ti ti-credit-card"></i>Metode Pembayaran</div>
      ${sdHbarList(d.metode_bayar || [], '#7F77DD', d.total_pesanan)}
    </div>
    <div class="sd-card">
      <div class="sd-card-title"><i class="ti ti-shirt"></i>Variasi Terlaris</div>
      ${sdHbarList(d.variasi_top || [], '#1D9E75', d.total_pesanan)}
    </div>
  </div>
  <div class="sd-grid2">
    <div class="sd-card">
      <div class="sd-card-title"><i class="ti ti-building"></i>Top Kota/Kabupaten</div>
      ${sdHbarList(d.kota_top || [], '#BA7517', d.total_pesanan)}
    </div>
    <div class="sd-card">
      <div class="sd-card-title"><i class="ti ti-package"></i>Top SKU Induk</div>
      ${sdHbarList(d.sku_top || [], '#534AB7', d.total_pesanan)}
    </div>
  </div>
  `;
}

// ─── TAB: IKLAN ──────────────────────────────────────────────────────────────
function sdTabIklan(d) {
  const daily = d.iklan_daily || [];
  const maxSpend = daily.length ? Math.max(...daily.map(x => x.v)) : 1;

  return `
  <div class="sd-grid2">
    <div class="sd-kpi" style="margin-bottom:14px"><div class="kl">Total Belanja Iklan</div><div class="kv">${fRp(d.iklan_spend)}</div><div class="ks">periode ${sdMonthLabel(_activeMonthKey)}</div></div>
    <div class="sd-kpi" style="margin-bottom:14px"><div class="kl">ROAS (Omset/Iklan)</div><div class="kv">${d.iklan_spend > 0 ? (d.omset/d.iklan_spend).toFixed(2)+'×' : '—'}</div><div class="ks ${d.omset/d.iklan_spend >= 5 ? 'up' : 'dn'}">setiap Rp 1 iklan → Rp ${d.iklan_spend > 0 ? (d.omset/d.iklan_spend).toFixed(1) : '—'} omset</div></div>
  </div>
  <div class="sd-card">
    <div class="sd-card-title"><i class="ti ti-chart-bar"></i>Belanja Iklan Harian</div>
    ${daily.map(row => {
      const pct = maxSpend > 0 ? Math.min((row.v / maxSpend) * 100, 100) : 0;
      return `<div class="sd-iklan-day">
        <div class="dl">${row.d}</div>
        <div class="dg"><div class="df" style="width:${pct.toFixed(1)}%"><div class="dv">${row.v >= 5000 ? fRp(row.v) : ''}</div></div></div>
        <div class="dt">${fRp(row.v)}</div>
      </div>`;
    }).join('')}
    ${!daily.length ? '<div style="color:var(--color-text-tertiary);font-size:12px">Belum ada data iklan</div>' : ''}
  </div>
  <div class="sd-card">
    <div class="sd-card-title"><i class="ti ti-info-circle"></i>Catatan Iklan</div>
    <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.7">
      • Total dari <b>Adwords CSV</b> Seller Centre (Iklan Produk Otomatis + GMV Max)<br>
      • Biaya Isi Saldo Otomatis pada CSV bukan biaya tambahan — sudah dihitung dari penghasilan<br>
      • ROAS di atas ${d.omset > 0 && d.iklan_spend > 0 ? (d.omset/d.iklan_spend).toFixed(1) : '—'}× artinya setiap Rp 1 iklan menghasilkan Rp ${d.omset > 0 && d.iklan_spend > 0 ? (d.omset/d.iklan_spend).toFixed(1) : '—'} omset
    </div>
  </div>`;
}

// ─── TAB: PROYEKSI ───────────────────────────────────────────────────────────
function sdTabProyeksi(tokoId, currentMonth) {
  const months = sdGetAllMonths(tokoId);
  const allData = months.map(m => sdGetData(tokoId, m)).filter(Boolean);

  if (allData.length < 2) {
    return `<div class="sd-card"><div style="color:var(--color-text-tertiary);font-size:13px;text-align:center;padding:20px">
      Butuh minimal 2 bulan data untuk proyeksi. Saat ini: <b>${allData.length} bulan</b>.
    </div></div>`;
  }

  // Weighted: bulan terbaru bobot lebih tinggi
  // allData[0] = terbaru, allData[1] = sebelumnya, dst
  function project(key) {
    const vals = allData.map(d => d[key] || 0).filter(v => v > 0);
    if (!vals.length) return { simple: 0, weighted: 0, min: 0, max: 0 };
    const simple = vals.reduce((a, b) => a + b, 0) / vals.length;
    // Weighted: exponential decay — tiap bulan lebih lama bobot 0.6x
    let wSum = 0, wTotal = 0;
    vals.forEach((v, i) => { const w = Math.pow(0.7, i); wSum += v * w; wTotal += w; });
    const weighted = wSum / wTotal;
    return {
      simple: Math.round(simple),
      weighted: Math.round(weighted),
      min: Math.min(...vals),
      max: Math.max(...vals),
      expected: Math.round(weighted * 0.7 + simple * 0.3), // blend
    };
  }

  const pOmset    = project('omset');
  const pPesanan  = project('total_pesanan');
  const pEscrow   = project('total_dilepas');
  const pIklan    = project('iklan_spend');

  // Bulan depan label
  const nextYear  = parseInt(_activeMonthKey.slice(0,4));
  const nextMonth = parseInt(_activeMonthKey.slice(4,6)) % 12 + 1;
  const nextYear2 = nextMonth === 1 ? nextYear + 1 : nextYear;
  const nextLabel = sdMonthLabel(`${nextYear2}${String(nextMonth).padStart(2,'0')}`);

  return `
  <div class="sd-card" style="margin-bottom:14px">
    <div class="sd-card-title"><i class="ti ti-info-circle"></i>Cara baca proyeksi</div>
    <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.7">
      <b>Worst</b> = bulan terburuk dari history · <b>Expected</b> = weighted average (bulan terbaru bobotnya 70%) · <b>Best</b> = bulan terbaik dari history<br>
      Dari ${allData.length} bulan data: ${months.map(sdMonthLabel).join(', ')}
    </div>
  </div>

  <div class="sd-card-title" style="font-size:13px;font-weight:600;margin-bottom:10px">Proyeksi ${nextLabel}</div>

  <div style="margin-bottom:14px">
    <div style="font-size:11px;color:var(--color-text-tertiary);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Omset</div>
    <div class="sd-proj-grid">
      <div class="sd-proj-card worst"><div class="pct">Worst Case</div><div class="pv">${fRp(pOmset.min)}</div><div class="ps">bulan terburuk</div></div>
      <div class="sd-proj-card expected"><div class="pct">Expected</div><div class="pv">${fRp(pOmset.expected)}</div><div class="ps">weighted avg</div></div>
      <div class="sd-proj-card best"><div class="pct">Best Case</div><div class="pv">${fRp(pOmset.max)}</div><div class="ps">bulan terbaik</div></div>
    </div>
  </div>

  <div style="margin-bottom:14px">
    <div style="font-size:11px;color:var(--color-text-tertiary);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Pesanan</div>
    <div class="sd-proj-grid">
      <div class="sd-proj-card worst"><div class="pct">Worst</div><div class="pv">${pPesanan.min}</div><div class="ps">pesanan</div></div>
      <div class="sd-proj-card expected"><div class="pct">Expected</div><div class="pv">${pPesanan.expected}</div><div class="ps">pesanan</div></div>
      <div class="sd-proj-card best"><div class="pct">Best</div><div class="pv">${pPesanan.max}</div><div class="ps">pesanan</div></div>
    </div>
  </div>

  <div style="margin-bottom:14px">
    <div style="font-size:11px;color:var(--color-text-tertiary);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Escrow Dilepas</div>
    <div class="sd-proj-grid">
      <div class="sd-proj-card worst"><div class="pct">Worst</div><div class="pv">${fRp(pEscrow.min)}</div><div class="ps">net income</div></div>
      <div class="sd-proj-card expected"><div class="pct">Expected</div><div class="pv">${fRp(pEscrow.expected)}</div><div class="ps">net income</div></div>
      <div class="sd-proj-card best"><div class="pct">Best</div><div class="pv">${fRp(pEscrow.max)}</div><div class="ps">net income</div></div>
    </div>
  </div>

  <div>
    <div style="font-size:11px;color:var(--color-text-tertiary);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Budget Iklan Disarankan</div>
    <div class="sd-proj-grid">
      <div class="sd-proj-card worst"><div class="pct">Hemat</div><div class="pv">${fRp(pIklan.min)}</div><div class="ps">kurangi 0%</div></div>
      <div class="sd-proj-card expected"><div class="pct">Sama</div><div class="pv">${fRp(pIklan.expected)}</div><div class="ps">maintain ROAS</div></div>
      <div class="sd-proj-card best"><div class="pct">Agresif</div><div class="pv">${fRp(Math.round(pIklan.expected * 1.2))}</div><div class="ps">+20% iklan</div></div>
    </div>
  </div>

  <div class="sd-card" style="margin-top:14px">
    <div class="sd-card-title"><i class="ti ti-table"></i>Detail History Semua Bulan</div>
    <table class="sd-tbl">
      <tr><th>Bulan</th><th class="r">Pesanan</th><th class="r">Omset</th><th class="r">Escrow</th><th class="r">Iklan</th><th class="r">ROAS</th></tr>
      ${allData.map((d, i) => `<tr ${i===0?'style="font-weight:500"':''}>
        <td>${sdMonthLabel(months[i])}</td>
        <td class="r">${d.total_pesanan}</td>
        <td class="r">${fRp(d.omset)}</td>
        <td class="r">${fRp(d.total_dilepas)}</td>
        <td class="r">${fRp(d.iklan_spend)}</td>
        <td class="r">${d.iklan_spend > 0 ? (d.omset/d.iklan_spend).toFixed(1)+'×' : '—'}</td>
      </tr>`).join('')}
    </table>
  </div>`;
}

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────
window.sdOpenUpload = function() {
  _importSession = { income: null, order: null, produk: null, iklan: null };
  _importErrors = [];
  ['income','order','produk','iklan'].forEach(t => {
    const dz = document.getElementById('dz-' + t);
    const st = document.getElementById('dzs-' + t);
    if (dz) { dz.className = 'sdash-drop-zone'; }
    if (st) st.textContent = 'Belum diupload';
  });
  document.getElementById('sd-import-errors').style.display = 'none';
  document.getElementById('sd-save-btn').disabled = true;
  document.getElementById('sd-upload-modal').style.display = 'flex';
};
window.sdCloseUpload = function() {
  document.getElementById('sd-upload-modal').style.display = 'none';
};
window.sdDragOver = function(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
window.sdDragLeave = function(e) { e.currentTarget.classList.remove('drag-over'); };
window.sdDrop = function(e, type) {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) sdProcessFile(file, type);
};
window.sdFileInput = function(e, type) {
  const file = e.target.files[0];
  if (file) sdProcessFile(file, type);
};

function sdProcessFile(file, type) {
  const dz = document.getElementById('dz-' + type);
  const st = document.getElementById('dzs-' + type);
  st.textContent = '⏳ Memproses...';

  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      if (type === 'iklan') {
        _importSession.iklan = sdParseAdwords(ev.target.result);
        dz.className = 'sdash-drop-zone done';
        st.textContent = '✓ ' + file.name;
      } else {
        sdParseXlsx(ev.target.result, type, file.name, function(result, err) {
          if (err) {
            dz.className = 'sdash-drop-zone error';
            st.textContent = '✗ ' + err;
          } else {
            _importSession[type] = result;
            dz.className = 'sdash-drop-zone done';
            st.textContent = '✓ ' + file.name;
          }
          sdCheckSaveReady();
        });
        return; // async
      }
    } catch(e) {
      dz.className = 'sdash-drop-zone error';
      st.textContent = '✗ Error: ' + e.message;
    }
    sdCheckSaveReady();
  };
  if (type === 'iklan') reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
}

function sdCheckSaveReady() {
  const ready = _importSession.income || _importSession.order || _importSession.produk || _importSession.iklan;
  document.getElementById('sd-save-btn').disabled = !ready;
}

// ─── PARSE XLSX (uses SheetJS from CDN if available, else fallback) ───────────
function sdParseXlsx(buffer, type, filename, cb) {
  // SheetJS CDN already loaded via index.html? Otherwise load dynamically
  if (window.XLSX) {
    sdParseXlsxWithSheetJS(buffer, type, filename, cb);
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = function() { sdParseXlsxWithSheetJS(buffer, type, filename, cb); };
    s.onerror = function() { cb(null, 'Gagal load library XLSX'); };
    document.head.appendChild(s);
  }
}

function sdParseXlsxWithSheetJS(buffer, type, filename, cb) {
  try {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    if (type === 'income') cb(sdParseIncome(wb, filename), null);
    else if (type === 'order') cb(sdParseOrder(wb, filename), null);
    else if (type === 'produk') cb(sdParseProduk(wb, filename), null);
    else cb(null, 'Tipe tidak dikenal: ' + type);
  } catch(e) {
    cb(null, 'Parse error: ' + e.message);
  }
}

// ─── PARSE: INCOME XLSX ──────────────────────────────────────────────────────
function sdParseIncome(wb, filename) {
  const result = { _type: 'income', _file: filename };

  // Summary sheet
  const sumSh = wb.Sheets['Summary'];
  if (sumSh) {
    const rows = XLSX.utils.sheet_to_json(sumSh, { header: 1, defval: null });
    for (const row of rows) {
      const k = String(row[0] || '').trim();
      const v = row[3] !== undefined ? row[3] : row[2];
      if (k.includes('Username')) result.username = String(row[1] || '').trim();
      if (k === 'Dari') result.date_from = String(row[1] || '').trim();
      if (k === 'ke') result.date_to = String(row[1] || '').trim();
      if (k === 'Subtotal Pesanan') result.omset = v;
      if (k.includes('Pengembalian Dana ke Pembeli')) result.total_refund = v;
      if (k.includes('Voucher disponsor oleh Penjual') && !k.includes('co-fund')) result.total_voucher = v;
      if (k.includes('Harga Asli Produk')) result.harga_asli = row[2];
      if (k.includes('Total Pengeluaran')) result.total_pengeluaran = v;
      if (k.includes('Biaya Komisi AMS')) result.fee_komisi_ams = row[2] || v;
      if (k.includes('Biaya Administrasi')) result.fee_admin = row[2] || v;
      if (k.includes('Biaya Layanan') && !k.includes('Gratis') && !k.includes('Promo')) result.fee_layanan = row[2] || v;
      if (k.includes('Biaya Proses Pesanan')) result.fee_proses = row[2] || v;
      if (k.includes('Biaya Isi Saldo Otomatis')) result.fee_saldo_otomatis = row[2] || v;
      if (k.includes('Total Biaya Pengiriman')) result.fee_ongkir_net = v;
      if (k.includes('Premi')) result.fee_premi = row[2] || v;
      if (k.includes('Biaya Kampanye')) result.fee_kampanye = row[2] || v;
      if (k.includes('Total yang Dilepas') || k.includes('Total Penghasilan')) result.total_dilepas = v;
    }
  }

  // Income sheet: per-order detail
  const incSh = wb.Sheets['Income'];
  if (incSh) {
    const rows = XLSX.utils.sheet_to_json(incSh, { header: 1, defval: null });
    const headerRow = rows.find(r => r[1] === 'No. Pesanan');
    if (!headerRow) return result;
    const hIdx = rows.indexOf(headerRow);
    const cols = headerRow;
    const dataRows = rows.slice(hIdx + 1).filter(r => r[0] !== null && r[0] !== 'total(Rp)');

    // Extract metode_bayar from income
    const metodeCounts = {};
    dataRows.forEach(r => {
      const metode = r[cols.indexOf('Metode pembayaran pembeli')] || 'Lainnya';
      metodeCounts[metode] = (metodeCounts[metode] || 0) + 1;
    });
    result._metode_bayar_income = Object.entries(metodeCounts)
      .sort((a,b) => b[1]-a[1]).map(([n,v]) => ({n,v}));

    result._income_rows_count = dataRows.length;
  }

  return result;
}

// ─── PARSE: ORDER XLSX ───────────────────────────────────────────────────────
function sdParseOrder(wb, filename) {
  const sh = wb.Sheets['orders'] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: null });
  const header = rows[0];
  const dataRows = rows.slice(1).filter(r => r[0]);

  const get = (r, key) => {
    const i = header.indexOf(key);
    return i >= 0 ? r[i] : null;
  };

  // Parse date from filename
  let dateFrom = '', dateTo = '', username = '';
  const fMatch = filename.match(/(\d{8})_(\d{8})/);
  if (fMatch) { dateFrom = fMatch[1]; dateTo = fMatch[2]; }

  // Provinsi
  const provCounts = {};
  const kotaCounts = {};
  const metodeCounts = {};
  const variasiCounts = {};
  const skuCounts = {};
  let totalSubtotal = 0;
  let hariSet = new Set();

  dataRows.forEach(r => {
    const prov = get(r,'Provinsi') || 'Lainnya';
    const kota = get(r,'Kota/Kabupaten') || 'Lainnya';
    const met  = get(r,'Metode Pembayaran') || 'Lainnya';
    const vari = get(r,'Nama Variasi') || '—';
    const sku  = get(r,'SKU Induk') || '—';
    const sub  = parseFloat(get(r,'Subtotal Pesanan')) || 0;
    const tgl  = get(r,'Waktu Pesanan Dibuat');

    provCounts[prov] = (provCounts[prov]||0) + 1;
    kotaCounts[kota] = (kotaCounts[kota]||0) + 1;
    metodeCounts[met] = (metodeCounts[met]||0) + 1;
    variasiCounts[vari] = (variasiCounts[vari]||0) + 1;
    skuCounts[sku] = (skuCounts[sku]||0) + 1;
    totalSubtotal += sub;
    if (tgl) {
      const d = String(tgl).slice(0,10);
      hariSet.add(d);
    }
  });

  const topN = (obj, n) => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([n,v])=>({n,v}));

  return {
    _type: 'order',
    _file: filename,
    date_from: dateFrom,
    date_to: dateTo,
    total_pesanan: dataRows.length,
    hari_aktif: hariSet.size,
    provinsi: topN(provCounts, 8),
    kota_top: topN(kotaCounts, 8),
    metode_bayar: topN(metodeCounts, 8),
    variasi_top: topN(variasiCounts, 10),
    sku_top: topN(skuCounts, 6),
  };
}

// ─── PARSE: PRODUK XLSX ──────────────────────────────────────────────────────
function sdParseProduk(wb, filename) {
  const result = { _type: 'produk', _file: filename, produk_performa: [], harga_tidak_kompetitif: [], harga_kompetitif: [], produk_baru: [] };

  // Sheet: Produk dengan Performa Terbaik
  const shPerforma = wb.Sheets['Produk dengan Performa Terbaik'];
  if (shPerforma) {
    const rows = XLSX.utils.sheet_to_json(shPerforma, { header: 1, defval: null });
    const header = rows[0];
    rows.slice(1).filter(r => r[0]).forEach(r => {
      const get = key => { const i = header.indexOf(key); return i>=0?r[i]:null; };
      result.produk_performa.push({
        kode: String(get('Kode Produk')||''),
        nama: String(get('Produk')||''),
        views: parseInt(get('Jumlah Produk Dilihat'))||0,
        klik: parseInt(get('Produk Diklik'))||0,
        ctr: get('Persentase Klik'),
        cvr: get('Tingkat Konversi Pesanan (Pesanan Siap Dikirim)'),
        orders: parseInt(get('Pesanan Siap Dikirim'))||0,
        revenue: sdParseRp(get('Penjualan (Pesanan Siap Dikirim) (IDR)')),
        keranjang: parseInt(get('Dimasukkan ke Keranjang (Produk)'))||0,
      });
    });
  }

  // Sheet: Harga Belum Kompetitif
  const shTdk = wb.Sheets['Harga Belum Kompetitif'];
  if (shTdk) {
    const rows = XLSX.utils.sheet_to_json(shTdk, { header: 1, defval: null });
    const header = rows[0];
    rows.slice(1).filter(r => r[0]).forEach(r => {
      const get = key => { const i = header.indexOf(key); return i>=0?r[i]:null; };
      result.harga_tidak_kompetitif.push({
        kode: String(get('Kode Produk')||''),
        nama: String(get('Produk')||''),
        harga: get('Harga Saat Ini'),
        views: parseInt(get('Jumlah Produk Dilihat'))||0,
        klik: parseInt(get('Produk Diklik'))||0,
        ctr: get('Persentase Klik'),
        orders: parseInt(get('Pesanan Siap Dikirim'))||0,
        keranjang: parseInt(get('Dimasukkan ke Keranjang (Produk)'))||0,
        flag_harga_tidak_kompetitif: true,
      });
    });
  }

  // Sheet: Harga Sudah Kompetitif
  const shOk = wb.Sheets['Harga Sudah Kompetitif'];
  if (shOk) {
    const rows = XLSX.utils.sheet_to_json(shOk, { header: 1, defval: null });
    const header = rows[0];
    rows.slice(1).filter(r => r[0]).forEach(r => {
      const get = key => { const i = header.indexOf(key); return i>=0?r[i]:null; };
      result.harga_kompetitif.push({
        kode: String(get('Kode Produk')||''),
        nama: String(get('Produk')||''),
        views: parseInt(get('Jumlah Produk Dilihat'))||0,
        klik: parseInt(get('Produk Diklik'))||0,
        ctr: get('Persentase Klik'),
        cvr: get('Tingkat Konversi Pesanan (Pesanan Siap Dikirim)'),
        orders: parseInt(get('Pesanan Siap Dikirim'))||0,
        revenue: sdParseRp(get('Penjualan (Pesanan Siap Dikirim) (IDR)')),
        flag_harga_kompetitif: true,
      });
    });
  }

  // Sheet: Produk yang Baru Ditambahkan
  const shBaru = wb.Sheets['Produk yang Baru Ditambahkan'];
  if (shBaru) {
    const rows = XLSX.utils.sheet_to_json(shBaru, { header: 1, defval: null });
    const header = rows[0];
    rows.slice(1).filter(r => r[0]).forEach(r => {
      const get = key => { const i = header.indexOf(key); return i>=0?r[i]:null; };
      const hari = parseInt(get('Hari Dibuat'))||0;
      if (hari <= 90) {
        result.produk_baru.push({
          kode: String(get('Kode Produk')||''),
          nama: String(get('Produk')||''),
          usia_hari: hari,
          views: parseInt(get('Jumlah Produk Dilihat'))||0,
          klik: parseInt(get('Produk Diklik'))||0,
          orders: parseInt(get('Pesanan Siap Dikirim'))||0,
          revenue: sdParseRp(get('Penjualan (Pesanan Siap Dikirim) (IDR)')),
        });
      }
    });
    result.produk_baru.sort((a,b) => b.views - a.views);
  }

  return result;
}

function sdParseRp(val) {
  if (!val) return 0;
  const s = String(val).replace(/[^\d.-]/g,'').replace(',','.');
  return parseFloat(s) || 0;
}

// ─── PARSE: ADWORDS CSV ──────────────────────────────────────────────────────
function sdParseAdwords(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let username = '', dateStr = '';
  const dailyMap = {};
  let totalSpend = 0;

  for (const line of lines) {
    const cols = line.split(',');
    if (line.startsWith('Username:')) username = cols[1] ? cols[1].trim() : '';
    if (line.startsWith('Tanggal:')) dateStr = cols[1] ? cols[1].trim() : '';
    if (cols.length >= 4 && /^\d+$/.test(cols[0])) {
      const tgl = cols[1] ? cols[1].trim() : '';
      const desc = cols[2] ? cols[2].trim() : '';
      const amt = parseInt(String(cols[3]).trim()) || 0;
      // Only count actual ad deductions (negative) excluding top-up
      if (amt < 0 && !desc.includes('Isi Saldo')) {
        totalSpend += Math.abs(amt);
        const day = tgl.slice(0, 5); // dd/mm
        dailyMap[tgl] = (dailyMap[tgl] || 0) + Math.abs(amt);
      }
    }
  }

  const daily = Object.entries(dailyMap)
    .sort((a,b) => {
      const pa = a[0].split('/'); const pb = b[0].split('/');
      return new Date(pa[2],pa[1]-1,pa[0]) - new Date(pb[2],pb[1]-1,pb[0]);
    })
    .map(([d,v]) => ({ d: d.slice(0,5), v }));

  return { _type: 'iklan', username, dateStr, totalSpend, daily };
}

// ─── SAVE IMPORT ─────────────────────────────────────────────────────────────
window.sdSaveImport = function() {
  const s = _importSession;
  _importErrors = [];

  // Detect toko from username
  let tokoId = _activeToko;
  const usernameRaw = (s.income && s.income.username) || (s.iklan && s.iklan.username) || '';
  const usernameL = usernameRaw.toLowerCase();
  for (const [uname, info] of Object.entries(TOKO_MAP)) {
    if (usernameL.includes(uname)) { tokoId = info.id; break; }
  }

  // Detect month from income date_from or order date_from
  let monthKey = '';
  const dateFrom = (s.income && s.income.date_from) || (s.order && s.order.date_from) || '';
  if (dateFrom) {
    const clean = dateFrom.replace(/-/g,'');
    monthKey = clean.slice(0,6); // yyyymm
  }
  if (!monthKey) {
    _importErrors.push('Tidak dapat mendeteksi periode dari file. Pastikan file Income XLSX terupload.');
    sdShowErrors();
    return;
  }

  // Merge all sources into one data object
  const merged = sdMergeData(s, tokoId, monthKey);

  localStorage.setItem(LS_PREFIX + tokoId + '_' + monthKey, JSON.stringify(merged));

  // Switch to detected toko
  _activeToko = tokoId;
  _activeMonthKey = monthKey;
  localStorage.setItem(LS_ACTIVE, tokoId);
  document.querySelectorAll('.sdash-toko-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.toko === tokoId);
  });

  sdCloseUpload();
  sdRenderMonthBar();

  // Show success toast
  sdToast('✓ Data ' + sdMonthLabel(monthKey) + ' untuk ' + tokoId + ' berhasil disimpan');
};

function sdMergeData(s, tokoId, monthKey) {
  const income = s.income || {};
  const order  = s.order  || {};
  const produk = s.produk || {};
  const iklan  = s.iklan  || {};

  // Merge produk_performa: tambahkan flag dari harga sheets
  let produkList = produk.produk_performa || [];
  const tdk = (produk.harga_tidak_kompetitif || []).map(p => p.kode);
  const ok  = (produk.harga_kompetitif || []).map(p => p.kode);
  produkList = produkList.map(p => ({
    ...p,
    flag_harga_tidak_kompetitif: tdk.includes(p.kode),
    flag_harga_kompetitif: ok.includes(p.kode),
  }));
  // Sort: revenue desc
  produkList.sort((a,b) => (b.revenue||0) - (a.revenue||0));

  return {
    _toko: tokoId,
    _bulan: monthKey,
    _saved: Date.now(),

    // Identitas
    username: income.username || iklan.username || '',
    date_from: income.date_from || order.date_from || '',
    date_to: income.date_to || order.date_to || '',

    // Keuangan (from Income)
    omset: income.omset || 0,
    harga_asli: income.harga_asli || 0,
    total_refund: income.total_refund || 0,
    total_voucher: income.total_voucher || 0,
    total_dilepas: income.total_dilepas || 0,
    total_pengeluaran: income.total_pengeluaran || 0,
    fee_layanan: income.fee_layanan || 0,
    fee_admin: income.fee_admin || 0,
    fee_proses: income.fee_proses || 0,
    fee_saldo_otomatis: income.fee_saldo_otomatis || 0,
    fee_komisi_ams: income.fee_komisi_ams || 0,
    fee_ongkir_net: income.fee_ongkir_net || 0,
    fee_premi: income.fee_premi || 0,
    fee_kampanye: income.fee_kampanye || 0,

    // Order (from Order xlsx)
    total_pesanan: order.total_pesanan || income._income_rows_count || 0,
    hari_aktif: order.hari_aktif || 0,
    provinsi: order.provinsi || [],
    kota_top: order.kota_top || [],
    metode_bayar: order.metode_bayar || income._metode_bayar_income || [],
    variasi_top: order.variasi_top || [],
    sku_top: order.sku_top || [],

    // Produk performa
    produk_performa: produkList,
    harga_tidak_kompetitif: produk.harga_tidak_kompetitif || [],
    harga_kompetitif: produk.harga_kompetitif || [],
    produk_baru: produk.produk_baru || [],

    // Iklan
    iklan_spend: iklan.totalSpend || 0,
    iklan_daily: iklan.daily || [],
  };
}

function sdShowErrors() {
  const el = document.getElementById('sd-import-errors');
  el.style.display = 'block';
  el.innerHTML = _importErrors.map(e => '⚠️ ' + e).join('<br>');
}

function sdToast(msg) {
  let t = document.getElementById('sd-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'sd-toast';
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;z-index:9999;transition:opacity .3s;white-space:nowrap';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
sdRenderMonthBar();

})(); // end IIFE
