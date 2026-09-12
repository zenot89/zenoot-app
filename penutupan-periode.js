// ─── PENUTUPAN-PERIODE.JS — Laporan Bulanan ──────────────────
// Layout: 1 tabel perbandingan — kolom Kriteria + 3 bulan terakhir (snapshot) + Bulan Berjalan (live).
// Riwayat selebihnya (lebih dari 3 bulan lalu) pindah ke halaman terpisah "Riwayat Lengkap".
// Auto-snapshot bulan lalu saat app dibuka (sekali per bulan).

document.getElementById('page-penutupan-periode').innerHTML = `
<style>
  #pp-scroll-zone {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: none;
    padding: 0 0 40px 0;
  }
  .pp-section { margin-bottom: 14px; }

  /* ── Tabel perbandingan bulanan ── */
  #pp-cmp-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-top: 10px;
  }
  #pp-cmp-table { min-width: 560px; }
  #pp-cmp-table th:first-child,
  #pp-cmp-table td:first-child {
    position: -webkit-sticky;
    position: sticky;
    left: 0;
    background: var(--cream2);
    z-index: 2;
    font-weight: 700;
    color: var(--ink2);
    white-space: nowrap;
  }
  #pp-cmp-table th { white-space: nowrap; }
  #pp-cmp-table td { text-align: right; font-family: var(--f2); font-weight: 700; }
  .pp-cmp-bulan { font-size: 13px; font-weight: 700; color: var(--ink); }
  .pp-cmp-badge {
    display: block;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    margin-top: 2px;
  }
  .pp-cmp-badge.live  { color: var(--ok); }
  .pp-cmp-badge.snap  { color: var(--ink3); }
  .pp-row-nw-lg { font-size: 15px; }

  /* ── Histori (dipakai juga di halaman Riwayat Lengkap) ── */
  .pp-hist-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid var(--ink4);
    gap: 12px;
  }
  .pp-hist-row:last-child { border-bottom: none; }
  .pp-hist-periode { font-weight: 700; font-size: 13px; }
  .pp-hist-detail  { font-size: 11px; color: var(--ink3); margin-top: 2px; }
  .pp-hist-right   { text-align: right; flex-shrink: 0; }
  .pp-hist-nw      { font-size: 13px; font-weight: 700; }
  .pp-hist-delta   { font-size: 11px; font-weight: 700; margin-top: 2px; }
  .pp-empty { color: var(--ink3); font-style: italic; font-size: 13px; padding: 10px 0; }

  /* ── Toast ── */
  #pp-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(60px);
    background: var(--ink);
    color: var(--cream);
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    z-index: 9999;
    transition: transform .3s ease;
    white-space: nowrap;
    pointer-events: none;
  }
  #pp-toast.show { transform: translateX(-50%) translateY(0); }

  /* ── Dropdown periode grafik (gaya Shopee, portal ke body) ── */
  #pp-period-trigger {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; padding: 6px 10px;
    border: 1.5px solid var(--ovl-0_1); border-radius: 6px;
    background: var(--cream2); color: var(--ink); cursor: pointer;
  }
  #pp-period-trigger .pp-period-label { font-weight: 700; }
  #pp-period-panel {
    position: fixed;
    background: var(--cream2); border: 1px solid var(--ink3);
    border-radius: 10px; box-shadow: 0 8px 28px rgba(0,0,0,.3), 0 2px 6px rgba(0,0,0,.15);
    min-width: 220px; z-index: 99999; display: none; overflow: hidden;
  }
  #pp-period-panel.open { display: block; }
  .pp-period-item {
    padding: 9px 14px; font-size: 12.5px; cursor: pointer;
    color: var(--ink2); border-bottom: 1px solid var(--ovl-0_05);
  }
  .pp-period-item:last-child { border-bottom: none; }
  .pp-period-item:hover { background: var(--ovl-0_05); }
  .pp-period-item.active { color: var(--accent); font-weight: 700; background: var(--ovl-0_05); }
  .pp-period-divider { padding: 6px 14px; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--ink4); background: var(--ovl-0_03); }
  .pp-period-item.has-sub { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

  /* ── Sub-panel pilih bulan spesifik (gaya Shopee) ── */
  #pp-month-picker {
    position: fixed;
    background: var(--cream2); border: 1px solid var(--ink3);
    border-radius: 10px; box-shadow: 0 8px 28px rgba(0,0,0,.3), 0 2px 6px rgba(0,0,0,.15);
    min-width: 230px; z-index: 100000; display: none; padding: 10px;
  }
  #pp-month-picker.open { display: block; }
  .pp-mp-yearnav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-weight: 700; font-size: 13px; color: var(--ink); }
  .pp-mp-yearnav button { background: none; border: none; cursor: pointer; font-size: 15px; color: var(--ink2); padding: 3px 9px; border-radius: 6px; }
  .pp-mp-yearnav button:hover:not(:disabled) { background: var(--ovl-0_05); }
  .pp-mp-yearnav button:disabled { opacity: .3; cursor: default; }
  .pp-mp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .pp-mp-month { padding: 9px 0; text-align: center; border-radius: 8px; font-size: 12.5px; cursor: pointer; background: none; border: none; color: var(--ink2); font-family: var(--f); }
  .pp-mp-month:hover:not(:disabled) { background: var(--ovl-0_05); }
  .pp-mp-month.active { background: var(--ink); color: var(--cream); font-weight: 700; }
  .pp-mp-month:disabled { color: var(--ink4); cursor: default; }

  /* ── Sub-panel pilih tahun spesifik (list tahun yang ada datanya) ── */
  #pp-year-picker {
    position: fixed;
    background: var(--cream2); border: 1px solid var(--ink3);
    border-radius: 10px; box-shadow: 0 8px 28px rgba(0,0,0,.3), 0 2px 6px rgba(0,0,0,.15);
    min-width: 150px; z-index: 100000; display: none; overflow: hidden;
  }
  #pp-year-picker.open { display: block; }
</style>


<div id="pp-toast"></div>
<div id="pp-scroll-zone">

<!-- ── Header ── -->
<div class="card pp-section" style="padding-bottom:10px">
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
    <div class="card-title" style="margin:0"><i class="ti ti-chart-bar"></i> Laporan Bulanan</div>
    <div style="display:flex;align-items:center;gap:8px">
      <button class="btn btn-sm" onclick="ppPerbarui()" id="pp-btn-perbarui" style="display:none">
        <i class="ti ti-refresh"></i> Perbarui
      </button>
      <button class="btn btn-sm" onclick="gotoPage('penutupan-riwayat',null)">
        <i class="ti ti-history"></i> Riwayat Lengkap
      </button>
    </div>
  </div>
  <div id="pp-status" style="font-size:12px;color:var(--ink3);margin-top:6px"></div>

  <!-- ── Tabel perbandingan: Kriteria x 4 bulan ── -->
  <div id="pp-cmp-wrap">
    <table class="tbl" id="pp-cmp-table">
      <thead>
        <tr id="pp-cmp-head-row"></tr>
      </thead>
      <tbody id="pp-cmp-tbody">
        <tr><td colspan="5" class="pp-empty">Memuat data...</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ── Section 2: Checkbox Kriteria ── -->
<div class="card pp-section">
  <div class="card-title"><i class="ti ti-adjustments"></i> Grafik Kriteria</div>
  <div id="pp-kriteria-checks" style="display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:10px"></div>
  <div id="pp-kriteria-count" style="font-size:11px;color:var(--ink3);margin-top:10px"></div>
</div>

<!-- ── Section 3: Grafik ── -->
<div class="card pp-section">
  <div class="card-title" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
    <span><i class="ti ti-chart-line"></i> Grafik</span>
    <div id="pp-period-trigger" onclick="ppTogglePeriodPanel()">
      <i class="ti ti-calendar"></i>
      <span>Periode:</span>
      <span class="pp-period-label" id="pp-period-current-label">Tren Bulanan</span>
      <i class="ti ti-chevron-down" style="font-size:11px"></i>
    </div>
  </div>
  <div style="position:relative;height:220px;margin-top:12px">
    <canvas id="pp-chart-canvas" style="width:100%;height:100%;display:block"></canvas>
    <div id="pp-chart-empty" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;color:var(--ink3);font-style:italic;font-size:13px"></div>
    <div id="pp-chart-tooltip" style="display:none;position:absolute;background:var(--cream);border:2px solid var(--ink);padding:5px 10px;font-size:11px;font-family:var(--f);pointer-events:none;box-shadow:3px 3px 0 var(--ink4);z-index:10;white-space:nowrap"></div>
  </div>
  <div id="pp-chart-note" style="display:none;font-size:11px;color:var(--ink3);font-style:italic;margin-top:8px"></div>
  <div id="pp-chart-legend" style="display:flex;gap:14px;margin-top:10px;font-size:11px;color:var(--ink3);flex-wrap:wrap"></div>
</div>

</div><!-- /pp-scroll-zone -->
`;

document.getElementById('page-penutupan-riwayat').innerHTML = `
<div id="ppr-scroll-zone" style="overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:none;padding:0 0 40px 0">
  <div class="card pp-section">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span><i class="ti ti-history"></i> Riwayat Lengkap</span>
      <button class="btn btn-sm" onclick="gotoPage('penutupan-periode',null)" style="font-size:12px">
        <i class="ti ti-arrow-left"></i> Back
      </button>
    </div>
    <div id="ppr-body" style="margin-top:6px"><div class="pp-empty">Memuat...</div></div>
  </div>
</div>
`;

setTimeout(function() { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-penutupan-periode')); }, 80);
setTimeout(function() { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-penutupan-riwayat')); }, 80);

// ─── STATE ────────────────────────────────────────────────────
var _ppHistoriCache = [];
var _ppFullSeries    = [];               // semua periode bulanan (histori asc + live) — sumber utk mode per_bulan/per_tahun
var _ppChartSeries   = [];               // seri yang lagi ditampilkan di grafik (hasil olahan sesuai mode aktif)
var _ppLiveDataCache = null;             // hasil fetch live bulan berjalan, di-cache biar mode bulan_ini gak fetch ulang
var _ppChartKriteria = new Set(['net_worth', 'laba_rugi']); // default kriteria dicentang
var _ppPeriodMode    = 'per_bulan';      // minggu_ini | minggu_lalu | bulan_ini | bulan_lalu | per_bulan | per_tahun

// ─── DEFINISI BARIS KRITERIA UNTUK TABEL PERBANDINGAN & GRAFIK ─
var _ppKriteriaDefs = [
  { key: 'net_worth',        label: 'Net Worth',      valStyle: true,  big: true, chartColor: '#2f6fed' },
  { key: 'total_kas',        label: 'Kas & Bank',                                 chartColor: '#8a5cf6' },
  { key: 'nilai_stok',       label: 'Stok',                                       chartColor: '#f5a623' },
  { key: 'escrow_shopee',    label: 'Escrow Shopee',                              chartColor: '#17a2b8' },
  { key: 'total_kewajiban',  label: 'Hutang',          color: 'var(--danger)',    chartColor: '#e0475a' },
  { key: 'total_pendapatan', label: 'Pendapatan',      color: 'var(--ok)',        chartColor: '#3ddb6b' },
  { key: 'total_beban',      label: 'Beban',           color: 'var(--danger)',    chartColor: '#ff7849' },
  { key: 'laba_rugi',        label: 'Laba / Rugi',     valStyle: true,            chartColor: '#111827' },
];

// ─── LAYOUT ──────────────────────────────────────────────────
function _ppEnsureLayout() {
  var pg = document.getElementById('page-penutupan-periode');
  if (!pg || !pg.classList.contains('active')) return;
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.body.style.minHeight = '0';
  var mainEl = document.querySelector('.main');
  if (mainEl) { mainEl.style.height='100%'; mainEl.style.minHeight='0'; mainEl.style.overflow='hidden'; mainEl.style.display='flex'; mainEl.style.flex='1 1 0'; mainEl.style.flexDirection='column'; }
  var contentEl = document.querySelector('.content');
  if (contentEl) { contentEl.style.overflow='hidden'; contentEl.style.overflowY='hidden'; contentEl.style.display='flex'; contentEl.style.flexDirection='column'; contentEl.style.flex='1 1 0'; contentEl.style.minHeight='0'; contentEl.style.height='100%'; }
  pg.style.display='flex'; pg.style.flexDirection='column'; pg.style.flex='1 1 0'; pg.style.minHeight='0'; pg.style.overflow='hidden';
  var zone = document.getElementById('pp-scroll-zone');
  if (zone) { zone.style.flex='1 1 0'; zone.style.minHeight='0'; zone.style.overflowY='auto'; }
}
window.addEventListener('resize', function() {
  var pg = document.getElementById('page-penutupan-periode');
  if (pg && pg.classList.contains('active')) { _ppEnsureLayout(); _ppRenderChart(); }
});

// ─── HELPERS ─────────────────────────────────────────────────
function _ppFmt(v) { return fmtRpFull(Math.abs(Number(v) || 0)); }

function _ppFmtVal(v) {
  var n = Number(v) || 0;
  return (n < 0 ? '(' : '') + _ppFmt(n) + (n < 0 ? ')' : '');
}

function _ppColor(v) { return Number(v) >= 0 ? 'var(--ok)' : 'var(--danger)'; }

function _ppPeriodeLabel(ym) {
  if (!ym) return '';
  var parts = ym.split('-');
  var bulan = ['Januari','Februari','Maret','April','Mei','Juni',
               'Juli','Agustus','September','Oktober','November','Desember'];
  return bulan[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

function _ppToast(msg, ms) {
  var t = document.getElementById('pp-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, ms || 3000);
}

// ─── CHECKBOX KRITERIA (Section 2) ────────────────────────────
function _ppRenderKriteriaChecks() {
  var wrap = document.getElementById('pp-kriteria-checks');
  if (!wrap) return;
  wrap.innerHTML = _ppKriteriaDefs.map(function(def) {
    var checked = _ppChartKriteria.has(def.key) ? 'checked' : '';
    return '<label style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--ink2);cursor:pointer;user-select:none">' +
      '<input type="checkbox" ' + checked + ' onchange="ppToggleKriteria(\'' + def.key + '\')" style="accent-color:' + def.chartColor + ';width:17px;height:17px">' +
      '<span style="width:11px;height:11px;border-radius:50%;background:' + def.chartColor + ';display:inline-block;flex-shrink:0"></span>' +
      '<span>' + def.label + '</span>' +
      '</label>';
  }).join('');
  _ppUpdateKriteriaCount();
}

function _ppUpdateKriteriaCount() {
  var el = document.getElementById('pp-kriteria-count');
  if (el) el.textContent = 'Kriteria dipilih: ' + _ppChartKriteria.size + '/' + _ppKriteriaDefs.length;
}

function ppToggleKriteria(key) {
  if (_ppChartKriteria.has(key)) { _ppChartKriteria.delete(key); } else { _ppChartKriteria.add(key); }
  _ppUpdateKriteriaCount();
  _ppRenderChart();
}

// ─── DROPDOWN PERIODE GRAFIK (gaya Shopee) ────────────────────
var _ppPeriodLabels = {
  bulan_ini:   'Bulan Ini',
  bulan_lalu:  'Bulan Lalu',
  per_bulan:   'Tren Bulanan',
  per_tahun:   'Tren Tahunan',
};
var _PP_PANEL_W = 230; // lebar perkiraan dropdown/flyout, dipakai buat clamp posisi biar gak kepotong layar

function ppTogglePeriodPanel() {
  _ppEnsurePeriodPanel();
  var panel = document.getElementById('pp-period-panel');
  var trigger = document.getElementById('pp-period-trigger');
  if (!panel || !trigger) return;
  var isOpen = panel.classList.contains('open');
  if (!isOpen) {
    var rect = trigger.getBoundingClientRect();
    var leftPos = Math.max(6, Math.min(rect.left, window.innerWidth - _PP_PANEL_W - 6));
    panel.style.top   = (rect.bottom + 6) + 'px';
    panel.style.left  = leftPos + 'px';
    panel.style.right = 'auto';
  } else {
    _ppCloseMonthPicker();
    _ppCloseYearPicker();
  }
  panel.classList.toggle('open', !isOpen);
}

// Posisikan flyout (portal, position:fixed) di SAMPING sebuah item pemicu —
// coba di kanan dulu, kalau gak muat baru flip ke kiri; top di-clamp biar
// gak keluar bawah layar. Dipakai buat month-picker & year-picker.
function _ppPositionSideFlyout(panel, itemRect, widthPx) {
  var top = Math.max(6, Math.min(itemRect.top, window.innerHeight - 40));
  panel.style.top = top + 'px';
  var spaceRight = window.innerWidth - itemRect.right - 6;
  var leftPos = (spaceRight >= widthPx) ? (itemRect.right + 6) : (itemRect.left - 6 - widthPx);
  leftPos = Math.max(6, Math.min(leftPos, window.innerWidth - widthPx - 6));
  panel.style.left  = leftPos + 'px';
  panel.style.right = 'auto';
}

// Portal panel dropdown periode ke body (dibuat sekali, dipakai ulang) —
// hindari nempel di dalam .card-title yang punya stacking context sendiri
// (ini yang bikin dropdown ketiban/transparan sama tooltip grafik).
function _ppEnsurePeriodPanel() {
  if (document.getElementById('pp-period-panel')) return;
  var panel = document.createElement('div');
  panel.id = 'pp-period-panel';
  panel.innerHTML =
    '<div class="pp-period-item" data-mode="bulan_ini"   onclick="ppSelectPeriodMode(\'bulan_ini\')">Bulan Ini (Berjalan)</div>' +
    '<div class="pp-period-item" data-mode="bulan_lalu"  onclick="ppSelectPeriodMode(\'bulan_lalu\')">Bulan Lalu</div>' +
    '<div class="pp-period-item has-sub" id="pp-item-pilih-bulan" data-mode="pilih_bulan" onclick="ppOpenMonthPicker(event)">Pilih Bulan <i class="ti ti-chevron-right" style="font-size:11px"></i></div>' +
    '<div class="pp-period-item has-sub" id="pp-item-pilih-tahun" data-mode="pilih_tahun" onclick="ppOpenYearPicker(event)">Pilih Tahun <i class="ti ti-chevron-right" style="font-size:11px"></i></div>' +
    '<div class="pp-period-divider">Tren</div>' +
    '<div class="pp-period-item active" data-mode="per_bulan" onclick="ppSelectPeriodMode(\'per_bulan\')">Tren Bulanan</div>' +
    '<div class="pp-period-item" data-mode="per_tahun" onclick="ppSelectPeriodMode(\'per_tahun\')">Tren Tahunan</div>';
  document.body.appendChild(panel);
}
document.addEventListener('click', function(e) {
  var panel = document.getElementById('pp-period-panel');
  var trigger = document.getElementById('pp-period-trigger');
  var mp = document.getElementById('pp-month-picker');
  var yp = document.getElementById('pp-year-picker');
  var itemBulan = document.getElementById('pp-item-pilih-bulan');
  var itemTahun = document.getElementById('pp-item-pilih-tahun');
  if (!panel || !panel.classList.contains('open')) return;
  var insidePanel = panel.contains(e.target) || (trigger && trigger.contains(e.target));
  var insideMp = mp && (mp.contains(e.target) || (itemBulan && itemBulan.contains(e.target)));
  var insideYp = yp && (yp.contains(e.target) || (itemTahun && itemTahun.contains(e.target)));
  if (insidePanel || insideMp || insideYp) return;
  panel.classList.remove('open');
  _ppCloseMonthPicker();
  _ppCloseYearPicker();
});

function ppSelectPeriodMode(mode) {
  _ppPeriodMode = mode;
  _ppPilihBulanYm = null; // pindah ke mode lain — reset seleksi bulan/tahun spesifik
  _ppPilihTahunYr = null;
  var labelEl = document.getElementById('pp-period-current-label');
  if (labelEl) labelEl.textContent = _ppPeriodLabels[mode] || mode;
  document.querySelectorAll('.pp-period-item').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-mode') === mode);
  });
  var panel = document.getElementById('pp-period-panel');
  if (panel) panel.classList.remove('open');
  _ppCloseMonthPicker();
  _ppCloseYearPicker();
  _ppLoadPeriodMode(mode);
}

// ─── SUB-PANEL PILIH BULAN SPESIFIK (gaya Shopee: navigasi tahun + grid 12 bulan) ──
var _ppMpYear       = new Date().getFullYear(); // tahun yang lagi ditampilin di month-picker
var _ppPilihBulanYm = null;                     // 'YYYY-MM' bulan spesifik yang lagi aktif (mode pilih_bulan)
var _ppBulanShort   = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function _ppEnsureMonthPicker() {
  if (document.getElementById('pp-month-picker')) return;
  var picker = document.createElement('div');
  picker.id = 'pp-month-picker';
  document.body.appendChild(picker);
}

function _ppCloseMonthPicker() {
  var picker = document.getElementById('pp-month-picker');
  if (picker) picker.classList.remove('open');
}

function ppOpenMonthPicker(e) {
  if (e) e.stopPropagation();
  _ppCloseYearPicker();
  _ppEnsureMonthPicker();
  var picker = document.getElementById('pp-month-picker');
  var itemEl = document.getElementById('pp-item-pilih-bulan');
  if (!picker || !itemEl) return;
  _ppMpYear = _ppPilihBulanYm ? parseInt(_ppPilihBulanYm.split('-')[0], 10) : new Date().getFullYear();
  _ppRenderMonthPicker();
  _ppPositionSideFlyout(picker, itemEl.getBoundingClientRect(), _PP_PANEL_W);
  picker.classList.add('open');
}

function _ppRenderMonthPicker() {
  var picker = document.getElementById('pp-month-picker');
  if (!picker) return;
  var now = new Date();
  var isCurYear = _ppMpYear === now.getFullYear();
  var html = '<div class="pp-mp-yearnav">' +
    '<button onclick="ppMpChangeYear(-1)"><i class="ti ti-chevrons-left"></i></button>' +
    '<span>' + _ppMpYear + '</span>' +
    '<button onclick="ppMpChangeYear(1)" ' + (isCurYear ? 'disabled' : '') + '><i class="ti ti-chevrons-right"></i></button>' +
  '</div><div class="pp-mp-grid">';
  for (var m = 0; m < 12; m++) {
    var ym = _ppMpYear + '-' + String(m + 1).padStart(2, '0');
    var isFuture = isCurYear && m > now.getMonth();
    var isActive = ym === _ppPilihBulanYm;
    html += '<button class="pp-mp-month' + (isActive ? ' active' : '') + '" ' + (isFuture ? 'disabled' : '') +
      ' onclick="ppPilihBulan(\'' + ym + '\')">' + _ppBulanShort[m] + '</button>';
  }
  html += '</div>';
  picker.innerHTML = html;
}

function ppMpChangeYear(delta) {
  var now = new Date();
  var newYear = _ppMpYear + delta;
  if (newYear > now.getFullYear()) return;
  _ppMpYear = newYear;
  _ppRenderMonthPicker();
}

async function ppPilihBulan(ym) {
  _ppPilihBulanYm = ym;
  _ppPeriodMode = 'pilih_bulan';
  var labelEl = document.getElementById('pp-period-current-label');
  if (labelEl) labelEl.textContent = _ppPeriodeLabel(ym);
  document.querySelectorAll('.pp-period-item').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-mode') === 'pilih_bulan');
  });
  _ppCloseMonthPicker();
  var panel = document.getElementById('pp-period-panel');
  if (panel) panel.classList.remove('open');
  await _ppLoadSpecificMonth(ym);
}

// Tampilkan bulan yang dipilih vs bulan sebelumnya (2 titik, sama pola dgn mode bulan_ini/bulan_lalu)
async function _ppLoadSpecificMonth(ym) {
  var emptyEl = document.getElementById('pp-chart-empty');
  var canvas  = document.getElementById('pp-chart-canvas');
  if (canvas) canvas.style.display = 'none';
  if (emptyEl) { emptyEl.style.display = 'flex'; emptyEl.textContent = 'Memuat...'; }

  try {
    var parts  = ym.split('-');
    var dPrev  = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 2, 1);
    var ymPrev = dPrev.getFullYear() + '-' + String(dPrev.getMonth() + 1).padStart(2, '0');
    var now    = new Date();
    var ymSkrg = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    var snapMap = {};
    _ppHistoriCache.forEach(function(r) { snapMap[r.periode] = r; });

    var dataYm   = (ym === ymSkrg)     ? _ppLiveDataCache : (snapMap[ym]     || await _ppFetchData(ym));
    var dataPrev = (ymPrev === ymSkrg) ? _ppLiveDataCache : (snapMap[ymPrev] || await _ppFetchData(ymPrev));

    _ppChartSeries = [
      { periode: ymPrev, label: _ppPeriodeLabel(ymPrev), data: dataPrev },
      { periode: ym,     label: _ppPeriodeLabel(ym),     data: dataYm },
    ];
  } catch(e) {
    console.error('[PP] _ppLoadSpecificMonth error', e);
    _ppChartSeries = [];
  }
  _ppRenderChart();
}

// ─── SUB-PANEL PILIH TAHUN SPESIFIK (list tahun yang punya data) ──────
var _ppPilihTahunYr = null; // 'YYYY' tahun spesifik yang lagi aktif (mode pilih_tahun)

function _ppEnsureYearPicker() {
  if (document.getElementById('pp-year-picker')) return;
  var picker = document.createElement('div');
  picker.id = 'pp-year-picker';
  document.body.appendChild(picker);
}

function _ppCloseYearPicker() {
  var picker = document.getElementById('pp-year-picker');
  if (picker) picker.classList.remove('open');
}

// Ambil daftar tahun yang beneran ada datanya (dari histori yang udah di-load), terbaru dulu
function _ppAvailableYears() {
  var yearly = _ppBuildYearlySeries();
  return yearly.map(function(s) { return s.periode; }).sort(function(a, b) { return b.localeCompare(a); });
}

function ppOpenYearPicker(e) {
  if (e) e.stopPropagation();
  _ppCloseMonthPicker();
  _ppEnsureYearPicker();
  var picker = document.getElementById('pp-year-picker');
  var itemEl = document.getElementById('pp-item-pilih-tahun');
  if (!picker || !itemEl) return;
  var years = _ppAvailableYears();
  if (years.length === 0) years = [String(new Date().getFullYear())];
  picker.innerHTML = years.map(function(yr) {
    var isActive = yr === _ppPilihTahunYr;
    return '<div class="pp-period-item' + (isActive ? ' active' : '') + '" onclick="ppPilihTahun(\'' + yr + '\')">' + yr + '</div>';
  }).join('');
  _ppPositionSideFlyout(picker, itemEl.getBoundingClientRect(), _PP_PANEL_W);
  picker.classList.add('open');
}

async function ppPilihTahun(yr) {
  _ppPilihTahunYr = yr;
  _ppPeriodMode = 'pilih_tahun';
  var labelEl = document.getElementById('pp-period-current-label');
  if (labelEl) labelEl.textContent = yr;
  document.querySelectorAll('.pp-period-item').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-mode') === 'pilih_tahun');
  });
  _ppCloseYearPicker();
  var panel = document.getElementById('pp-period-panel');
  if (panel) panel.classList.remove('open');
  _ppLoadSpecificYear(yr);
}

// Ambil data 1 tahun terpilih dari agregat yang udah dihitung _ppBuildYearlySeries
// (reuse logic yang sama biar gak ada 2 versi rumus agregasi tahunan)
function _ppAggregateYear(yr) {
  var found = _ppBuildYearlySeries().find(function(s) { return s.periode === String(yr); });
  return found ? found.data : null;
}

// Tampilkan tahun yang dipilih vs tahun sebelumnya (2 titik)
function _ppLoadSpecificYear(yr) {
  var yrPrev = String(Number(yr) - 1);
  _ppChartSeries = [
    { periode: yrPrev, label: yrPrev, data: _ppAggregateYear(yrPrev) },
    { periode: yr,      label: yr,     data: _ppAggregateYear(yr) },
  ];
  _ppRenderChart();
}

// Hitung rentang tanggal 1 minggu (Minggu–Sabtu, offset 0 = minggu ini, -1 = minggu lalu, dst)
function _ppWeekRange(offset) {
  var now = new Date();
  var day = now.getDay(); // 0 = Minggu
  var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + (offset * 7));
  var end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (end > today) end = today; // minggu berjalan: jangan proyeksi ke depan
  var toStr = function(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
  var fmtShort = function(d) { return d.getDate() + ' ' + ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.getMonth()]; };
  return { start: toStr(start), end: toStr(end), label: fmtShort(start) + '–' + fmtShort(end) };
}

// ─── LOAD SESUAI MODE DROPDOWN, LALU RENDER GRAFIK ────────────
async function _ppLoadPeriodMode(mode) {
  var emptyEl = document.getElementById('pp-chart-empty');
  var canvas  = document.getElementById('pp-chart-canvas');
  if (canvas) canvas.style.display = 'none';
  if (emptyEl) { emptyEl.style.display = 'flex'; emptyEl.textContent = 'Memuat...'; }

  try {
    if (mode === 'per_bulan') {
      _ppChartSeries = _ppFullSeries;
    } else if (mode === 'per_tahun') {
      _ppChartSeries = _ppBuildYearlySeries();
    } else if (mode === 'minggu_ini' || mode === 'minggu_lalu') {
      // DEAD CODE per permintaan user (12 Sep 2026): item menu "Minggu Ini/Minggu
      // Lalu" dihapus dari dropdown karena buat GRAFIK garis, datanya kurang
      // relevan (kolom posisi net_worth/kas/stok/escrow/hutang selalu SAMA di
      // 2 titik minggu karena gak ada snapshot mingguan — cuma pendapatan/beban/
      // laba-rugi yang valid dibandingkan per minggu). Logic-nya dipertahanin,
      // gak dihapus, buat kalau ke depan mau dipakai lagi sbg TABEL data
      // (bukan grafik) — ide dari user sendiri.
      var offA = (mode === 'minggu_ini') ? -1 : -2;
      var offB = (mode === 'minggu_ini') ?  0 : -1;
      var rgA = _ppWeekRange(offA), rgB = _ppWeekRange(offB);
      var [dA, dB] = await Promise.all([_ppFetchDataRange(rgA.start, rgA.end), _ppFetchDataRange(rgB.start, rgB.end)]);
      _ppChartSeries = [
        { periode: rgA.start, label: rgA.label, data: dA },
        { periode: rgB.start, label: rgB.label, data: dB },
      ];
    } else if (mode === 'bulan_ini' || mode === 'bulan_lalu') {
      // Reuse data yang udah ke-fetch di ppLoadUtama (hindari fetch ulang)
      var now = new Date();
      var ymSkrg = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
      var d1 = new Date(now.getFullYear(), now.getMonth()-1, 1);
      var ym1 = d1.getFullYear() + '-' + String(d1.getMonth()+1).padStart(2,'0');
      var d2 = new Date(now.getFullYear(), now.getMonth()-2, 1);
      var ym2 = d2.getFullYear() + '-' + String(d2.getMonth()+1).padStart(2,'0');
      var snapMap = {};
      _ppHistoriCache.forEach(function(r) { snapMap[r.periode] = r; });

      if (mode === 'bulan_ini') {
        var dataLalu = snapMap[ym1] || await _ppFetchData(ym1);
        _ppChartSeries = [
          { periode: ym1, label: _ppPeriodeLabel(ym1), data: dataLalu },
          { periode: ymSkrg, label: _ppPeriodeLabel(ymSkrg), data: _ppLiveDataCache },
        ];
      } else {
        var data2 = snapMap[ym2] || await _ppFetchData(ym2);
        var data1 = snapMap[ym1] || await _ppFetchData(ym1);
        _ppChartSeries = [
          { periode: ym2, label: _ppPeriodeLabel(ym2), data: data2 },
          { periode: ym1, label: _ppPeriodeLabel(ym1), data: data1 },
        ];
      }
    }
  } catch(e) {
    console.error('[PP] _ppLoadPeriodMode error', e);
    _ppChartSeries = [];
  }

  _ppRenderChart();
}

// Kelompokkan seri bulanan (_ppFullSeries) jadi per tahun — jumlah utk arus (pendapatan/beban),
// nilai TERAKHIR di tahun itu utk saldo (net_worth/kas/stok/escrow/hutang/laba_rugi)
function _ppBuildYearlySeries() {
  var byYear = {};
  _ppFullSeries.forEach(function(s) {
    if (!s.data || !s.periode) return;
    var yr = s.periode.split('-')[0];
    if (!byYear[yr]) byYear[yr] = { periode: yr, label: yr, data: {
      total_kas:0, nilai_stok:0, escrow_shopee:0, net_worth:0, total_kewajiban:0,
      total_pendapatan:0, total_beban:0, laba_rugi:0,
    }};
    var acc = byYear[yr].data;
    acc.total_pendapatan += Number(s.data.total_pendapatan||0);
    acc.total_beban      += Number(s.data.total_beban||0);
    acc.laba_rugi         = acc.total_pendapatan - acc.total_beban;
    // Nilai posisi (bukan arus) dipakai dari titik TERAKHIR tahun itu
    acc.total_kas       = Number(s.data.total_kas||0);
    acc.nilai_stok       = Number(s.data.nilai_stok||0);
    acc.escrow_shopee    = Number(s.data.escrow_shopee||0);
    acc.net_worth        = Number(s.data.net_worth||0);
    acc.total_kewajiban  = Number(s.data.total_kewajiban||0);
  });
  return Object.values(byYear).sort(function(a,b){ return a.periode.localeCompare(b.periode); });
}

// ─── RENDER GRAFIK (multi-line, canvas) ───────────────────────
function _ppRenderChart() {
  var canvas  = document.getElementById('pp-chart-canvas');
  var tooltip = document.getElementById('pp-chart-tooltip');
  var emptyEl = document.getElementById('pp-chart-empty');
  var legEl   = document.getElementById('pp-chart-legend');
  if (!canvas) return;

  var keys = Array.from(_ppChartKriteria);
  var series = _ppChartSeries || [];
  var noteEl = document.getElementById('pp-chart-note');

  if (keys.length === 0 || series.length === 0) {
    canvas.style.display = 'none';
    if (emptyEl) { emptyEl.style.display = 'flex'; emptyEl.textContent = keys.length === 0 ? 'Pilih minimal 1 kriteria' : 'Belum ada data'; }
    if (legEl) legEl.innerHTML = '';
    if (tooltip) tooltip.style.display = 'none';
    if (noteEl) noteEl.style.display = 'none';
    return;
  }

  // Tren Tahunan/Pilih Tahun baru kelihatan garisnya kalau histori udah ≥2 tahun —
  // ini bukan bug, cuma soal data yang masih terkumpul (bisnis baru mulai 2026)
  if (noteEl) {
    var pointsWithData = series.filter(function(s) { return s.data; }).length;
    if ((_ppPeriodMode === 'per_tahun' || _ppPeriodMode === 'pilih_tahun') && pointsWithData < 2) {
      noteEl.style.display = 'block';
      noteEl.textContent = '📌 Tren tahunan makin kelihatan setelah histori tembus lebih dari 1 tahun — saat ini baru ada data ' + (series.filter(function(s){return s.data;}).map(function(s){return s.periode;}).join(', ') || '-') + '.';
    } else {
      noteEl.style.display = 'none';
    }
  }

  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  if (!canvas.offsetWidth || canvas.offsetWidth < 10) {
    if (canvas.offsetParent === null) return;
    setTimeout(_ppRenderChart, 80);
    return;
  }

  var defsByKey = {};
  _ppKriteriaDefs.forEach(function(d) { defsByKey[d.key] = d; });

  var dpr = window.devicePixelRatio || 1;
  var W = canvas.offsetWidth;
  var H = canvas.offsetHeight || 220;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  var padL = 54, padR = 16, padT = 14, padB = 28;
  var cW = W - padL - padR, cH = H - padT - padB;

  var allVals = [0];
  keys.forEach(function(k) {
    series.forEach(function(s) { if (s.data) allVals.push(Number(s.data[k] || 0)); });
  });
  var maxVal = Math.max.apply(null, allVals);
  var minVal = Math.min.apply(null, allVals);
  if (maxVal === minVal) maxVal += 1;
  var span = maxVal - minVal;
  var step = cW / (series.length - 1 || 1);
  var colGrid = 'var(--ovl-0_06)', colLabel = '#909090';

  ctx.clearRect(0, 0, W, H);

  // Grid horizontal + label Y
  for (var i = 0; i <= 4; i++) {
    var val = minVal + (span * i / 4);
    var y = padT + cH - (cH * i / 4);
    ctx.strokeStyle = colGrid; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + cW, y); ctx.stroke();
    ctx.fillStyle = colLabel; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(typeof _fmtRpShort === 'function' ? _fmtRpShort(val) : _ppFmt(val), padL - 6, y + 3);
  }

  // Garis nol putus-putus kalau range-nya lintas negatif↔positif
  if (minVal < 0 && maxVal > 0) {
    var yZero = padT + cH - ((0 - minVal) / span) * cH;
    ctx.strokeStyle = 'var(--ink4)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(padL, yZero); ctx.lineTo(padL + cW, yZero); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Garis tiap kriteria terpilih
  keys.forEach(function(k) {
    var def = defsByKey[k];
    if (!def) return;
    var col = def.chartColor || '#888';
    var pts = series.map(function(s) {
      if (!s.data) return null;
      var v = Number(s.data[k] || 0);
      return { x: 0, y: padT + cH - ((v - minVal) / span) * cH };
    });
    pts.forEach(function(p, idx) { if (p) p.x = padL + idx * step; });

    ctx.beginPath();
    var started = false;
    pts.forEach(function(p) {
      if (!p) { started = false; return; }
      if (!started) { ctx.moveTo(p.x, p.y); started = true; } else { ctx.lineTo(p.x, p.y); }
    });
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke();

    pts.forEach(function(p) {
      if (!p) return;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    });
  });

  // X labels — kalau kepadetan, skip sebagian
  var everyN = series.length > 8 ? Math.ceil(series.length / 8) : 1;
  series.forEach(function(s, idx) {
    if (idx % everyN !== 0 && idx !== series.length - 1) return;
    var x = padL + idx * step;
    var short = s.label.split(' ');
    var lbl = (short[0] ? short[0].slice(0, 3) : '') + (short[1] ? ' ' + short[1].slice(2) : '');
    ctx.fillStyle = colLabel; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(lbl, x, padT + cH + 14);
  });

  // Legend
  if (legEl) {
    var lastS = series[series.length - 1];
    legEl.innerHTML = keys.map(function(k) {
      var def = defsByKey[k];
      if (!def) return '';
      var lastVal = (lastS && lastS.data) ? Number(lastS.data[k] || 0) : 0;
      return '<span style="display:inline-flex;align-items:center;gap:4px">' +
        '<span style="width:14px;height:3px;background:' + def.chartColor + ';display:inline-block;border-radius:2px"></span>' +
        def.label + ': ' + _ppFmtVal(lastVal) + '</span>';
    }).join('');
  }

  // Tooltip hover
  canvas.onmousemove = function(e) {
    if (!tooltip) return;
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var idx = Math.round((mx - padL) / step);
    if (idx < 0 || idx >= series.length) { tooltip.style.display = 'none'; return; }
    var s = series[idx];
    var lines = keys.map(function(k) {
      var def = defsByKey[k];
      if (!def) return '';
      var v = s.data ? Number(s.data[k] || 0) : 0;
      return '<div><span style="color:' + def.chartColor + '">●</span> ' + def.label + ': ' + _ppFmtVal(v) + '</div>';
    }).join('');
    tooltip.innerHTML = '<b>' + s.label + '</b>' + lines;
    tooltip.style.display = 'block';
    var tx = padL + idx * step;
    tooltip.style.left = Math.min(Math.max(tx - 40, 0), W - 120) + 'px';
    tooltip.style.top = '4px';
  };
  canvas.onmouseleave = function() { if (tooltip) tooltip.style.display = 'none'; };
}

// ─── FETCH DATA UNTUK RENTANG TANGGAL BEBAS ───────────────────
// CATATAN PENTING: total_pendapatan/total_beban/laba_rugi BENERAN kefilter sesuai
// dateStart–dateEnd yang dikasih. Tapi net_worth/total_kas/nilai_stok/escrow_shopee/
// total_kewajiban itu POSISI SAAT INI (dihitung dari semua data s.d. sekarang, bukan
// posisi historis di tanggal itu) — makanya utk histori BULANAN, angka posisi diambil
// dari snapshot tersimpan (penutupan_periode), bukan dari fungsi ini. Utk mode
// Minggu Ini/Minggu Lalu (gak ada snapshot mingguan), kolom posisi ini akan SAMA
// nilainya di kedua titik (karena emang belum ada histori mingguan) — cuma
// Pendapatan/Beban/Laba-Rugi yang beneran valid dibandingkan per minggu.
async function _ppFetchDataRange(dateStart, dateEnd) {
  try {
    var [kasAkun, allJurnal, jurnalBulan, produk, stok, jual, hutang, bayar, shopeeRaw] = await Promise.all([
      dbGet('kas_akun', '').catch(function() { return []; }),
      dbGet('jurnal', '').catch(function() { return []; }),
      dbGet('jurnal', '&tanggal=gte.' + dateStart + '&tanggal=lte.' + dateEnd).catch(function() { return []; }),
      dbGet('produk', '').catch(function() { return []; }),
      dbGet('stok', '').catch(function() { return []; }),
      dbGet('jurnal_penjualan', '&select=sku,qty').catch(function() { return []; }),
      dbGet('hutang', '').catch(function() { return []; }),
      dbGet('hutang_bayar', '').catch(function() { return []; }),
      fetch(SUPABASE_URL + '/rest/v1/shopee_finance_cache?select=*&order=fetched_at.desc&limit=1',
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } })
        .then(function(r) { return r.json(); }).catch(function() { return []; }),
    ]);

    // Build akunMap + saldo
    var akunMap = {};
    (kasAkun || []).forEach(function(a) { akunMap[a.id] = Object.assign({}, a, { sD: 0, sK: 0 }); });
    (allJurnal || []).forEach(function(r) {
      var n = Number(r.nominal || r.debit || 0);
      if (akunMap[r.akun_debit_id])  akunMap[r.akun_debit_id].sD  += n;
      if (akunMap[r.akun_kredit_id]) akunMap[r.akun_kredit_id].sK += n;
    });

    // Kas & Bank saja (untuk display card)
    var totalKas = Object.values(akunMap)
      .filter(function(a) { return a.kelompok === 'aset' && (a.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK'; })
      .reduce(function(s, a) { return s + Math.max(0, a.sD - a.sK); }, 0);

    // Nilai stok (HPP x sisa qty) — sama dengan Dashboard
    var stokMap = {};
    (stok || []).forEach(function(s) { stokMap[(s.sku_variasi||'').toUpperCase()] = s.stok_masuk || 0; });
    var keluarMap = {};
    (jual || []).forEach(function(j) { var k=(j.sku||'').toUpperCase(); keluarMap[k]=(keluarMap[k]||0)+(j.qty||0); });
    var nilaiStok = (produk || []).reduce(function(s, p) {
      var key  = (p.sku_variasi||'').toUpperCase();
      var sisa = (stokMap[key]||0) - (keluarMap[key]||0);
      return s + (sisa > 0 ? sisa * (p.hpp||0) : 0);
    }, 0);

    // Total Aset = semua aset (jurnal, sub_kelompok != Persediaan) + nilai persediaan
    // Persis sama dengan Dashboard (_getTotalAset)
    var totalAsetJurnal = Object.values(akunMap)
      .filter(function(a) { return a.kelompok === 'aset' && (a.sub_kelompok||'') !== 'Persediaan'; })
      .reduce(function(s, a) { return s + Math.max(0, a.sD - a.sK); }, 0);
    var totalAset = totalAsetJurnal + nilaiStok;

    // Hutang sisa
    var bayarMap = {};
    (bayar || []).forEach(function(b) { bayarMap[b.hutang_id] = (bayarMap[b.hutang_id]||0) + Number(b.nominal||0); });
    var totalHutang = (hutang || []).reduce(function(s, h) {
      var sisa = (h.pokok||0) - (bayarMap[h.id]||0);
      return s + (sisa > 0 ? sisa : 0);
    }, 0);

    // Escrow
    var escrow = 0;
    if (Array.isArray(shopeeRaw) && shopeeRaw.length > 0) escrow = Number(shopeeRaw[0].escrow_transit || 0);

    // P&L pada rentang tanggal yang diminta
    var totalPend = 0, totalBeban = 0;
    (jurnalBulan || []).forEach(function(r) {
      var n  = Number(r.nominal || r.debit || 0);
      var aD = akunMap[r.akun_debit_id];
      var aK = akunMap[r.akun_kredit_id];
      if (aK && aK.kelompok === 'pendapatan') totalPend  += n;
      if (aD && aD.kelompok === 'beban')      totalBeban += n;
    });

    // Net Worth = Total Aset + Escrow - Hutang (sama persis dengan Dashboard)
    var netWorth = totalAset + escrow - totalHutang;

    return {
      periode:          null,
      total_kas:        totalKas,
      nilai_stok:       nilaiStok,
      escrow_shopee:    escrow,
      net_worth:        netWorth,
      total_aset:       totalAset,
      total_pendapatan: totalPend,
      total_beban:      totalBeban,
      laba_rugi:        totalPend - totalBeban,
      total_kewajiban:  totalHutang,
    };
  } catch(e) {
    console.error('[PP] _ppFetchDataRange error', e);
    return null;
  }
}

// ─── FETCH DATA UNTUK SATU PERIODE BULAN (wrapper _ppFetchDataRange) ──
async function _ppFetchData(ym) {
  var parts   = ym.split('-');
  var lastDay = new Date(parseInt(parts[0]), parseInt(parts[1]), 0).getDate();
  var ymStart = ym + '-01';
  var ymEnd   = ym + '-' + String(lastDay).padStart(2, '0');
  var data = await _ppFetchDataRange(ymStart, ymEnd);
  if (data) data.periode = ym;
  return data;
}

// ─── RENDER TABEL PERBANDINGAN (Kriteria x 4 kolom bulan) ────
// cols = [{ periode, label, badge:'snap'|'live'|null, data:{...}|null }, ...] urut lama → baru
// refBefore = { data:{...} } opsional — snapshot SATU bulan sebelum kolom pertama,
// dipakai HANYA buat hitung % kolom pertama (gak dirender jadi kolom sendiri)
function _ppRenderCompareTable(cols, refBefore) {
  var headRow = document.getElementById('pp-cmp-head-row');
  var tbody   = document.getElementById('pp-cmp-tbody');
  if (!headRow || !tbody) return;

  headRow.innerHTML = '<th>Kriteria</th>' + cols.map(function(c) {
    if (!c.data) return '<th><span class="pp-cmp-bulan" style="color:var(--ink3)">' + c.label + '</span></th>';
    var badgeHtml = c.badge === 'live'
      ? '<span class="pp-cmp-badge live">● live</span>'
      : '<span class="pp-cmp-badge snap">snapshot</span>';
    return '<th><span class="pp-cmp-bulan">' + c.label + '</span>' + badgeHtml + '</th>';
  }).join('');

  tbody.innerHTML = _ppKriteriaDefs.map(function(def) {
    var tds = cols.map(function(c, idx) {
      if (!c.data) return '<td style="color:var(--ink4)">—</td>';
      var raw = c.data[def.key];
      var n   = Number(raw || 0);
      var txt = def.valStyle ? _ppFmtVal(n) : _ppFmt(n);
      var color = def.valStyle ? _ppColor(n) : (def.color || 'var(--ink)');
      var sizeStyle = def.big ? ' font-size:15px;' : '';

      // Badge naik/turun % vs kolom sebelumnya (kolom pertama pakai refBefore kalau ada)
      var deltaHtml = '';
      var prevCol = cols[idx - 1] || (idx === 0 ? refBefore : null);
      if (prevCol && prevCol.data) {
        var prevN = Number(prevCol.data[def.key] || 0);
        if (prevN !== 0) {
          var pct = ((n - prevN) / Math.abs(prevN)) * 100;
          var badFields  = { total_kewajiban: 1, total_beban: 1 };
          var isBadField = !!badFields[def.key];
          var isGoodMove = pct >= 0 ? !isBadField : isBadField;
          var arrow = pct >= 0 ? '▲' : '▼';
          deltaHtml = '<span style="font-weight:700;color:' + (isGoodMove ? 'var(--ok)' : 'var(--danger)') + '">' +
            arrow + ' ' + Math.abs(pct).toFixed(1) + '%</span>';
        } else if (n !== 0) {
          deltaHtml = '<span style="font-weight:700;color:var(--ink3)">baru</span>';
        }
      }

      return '<td style="color:' + color + ';' + sizeStyle + '">' +
        '<span style="display:inline-flex;align-items:baseline;justify-content:flex-end;gap:16px;white-space:nowrap">' +
          '<span>' + txt + '</span>' + deltaHtml +
        '</span>' +
      '</td>';
    }).join('');
    return '<tr><td>' + def.label + '</td>' + tds + '</tr>';
  }).join('');
}

// ─── AUTO-SNAPSHOT SATU BULAN (dipakai global timer & ppLoadUtama) ────
// Kalau snapshot bulan `ym` belum ada, fetch + simpan. Return data yang baru
// disimpan (null kalau udah ada / gagal fetch) — 1 sumber logic, dipakai di
// 2 tempat biar gak ada 2 versi payload yang bisa divergen.
async function _ppAutoSnapshotBulan(ym) {
  var existing = await dbGet('penutupan_periode', '&periode=eq.' + ym).catch(function() { return []; });
  if (existing && existing.length > 0) return null; // udah ada, gak perlu apa-apa
  var data = await _ppFetchData(ym);
  if (!data) return null;
  var now = new Date();
  await dbInsert('penutupan_periode', {
    periode:          data.periode,
    tanggal_tutup:    now.toISOString().split('T')[0],
    total_pendapatan: data.total_pendapatan,
    total_beban:      data.total_beban,
    laba_rugi:        data.laba_rugi,
    total_aset:       0,
    total_kewajiban:  data.total_kewajiban,
    total_modal:      0,
    total_kas:        data.total_kas,
    nilai_stok:       data.nilai_stok,
    escrow_shopee:    data.escrow_shopee,
    net_worth:        data.net_worth,
    catatan:          null,
  });
  data.tanggal_tutup = now.toISOString().split('T')[0];
  return data;
}

// ─── LOAD UTAMA ──────────────────────────────────────────────
async function ppLoadUtama() {
  var statusEl = document.getElementById('pp-status');
  if (statusEl) statusEl.textContent = 'Memuat data...';

  // Periode
  var now = new Date();
  var ymSkrg  = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var dLalu   = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var ymLalu  = dLalu.getFullYear() + '-' + String(dLalu.getMonth() + 1).padStart(2, '0');

  try {
    // Ambil snapshot tersimpan + data live bulan ini secara paralel
    var [snapRows, liveData] = await Promise.all([
      dbGet('penutupan_periode', '&order=periode.desc').catch(function() { return []; }),
      _ppFetchData(ymSkrg),
    ]);

    _ppHistoriCache = snapRows || [];
    var snapMap = {};
    (snapRows || []).forEach(function(r) { snapMap[r.periode] = r; });
    var snapLalu = snapMap[ymLalu];

    // Belum ada snapshot bulan lalu — ambil live dan simpan otomatis
    if (!snapLalu) {
      if (statusEl) statusEl.textContent = 'Mengambil snapshot ' + _ppPeriodeLabel(ymLalu) + '...';
      var dataLalu = await _ppAutoSnapshotBulan(ymLalu);
      if (dataLalu) {
        _ppToast('📸 Snapshot ' + _ppPeriodeLabel(ymLalu) + ' otomatis tersimpan');
        // Reload histori biar konsisten
        var newSnaps = await dbGet('penutupan_periode', '&order=periode.desc').catch(function() { return []; });
        _ppHistoriCache = newSnaps || [];
      }
    }

    if (statusEl) {
      statusEl.innerHTML = '<span style="color:var(--ok)">✓ Snapshot ' + _ppPeriodeLabel(ymLalu) + ' tersimpan</span>';
    }

    // Tampilkan tombol perbarui
    var btn = document.getElementById('pp-btn-perbarui');
    if (btn) btn.style.display = '';

    // Bangun 4 kolom: 3 bulan terakhir (snapshot, lama→baru) + bulan berjalan (live)
    // Ambil 4 snapshot (bukan 3) — snapshot ke-4 (lebih tua) dipakai HANYA sebagai
    // referensi buat hitung % kolom pertama, gak dirender jadi kolom sendiri.
    var empat = _ppHistoriCache.slice(0, 4); // terbaru dulu (desc)
    var tigaAsc = empat.slice(0, 3).reverse(); // 3 terbaru, urut lama → baru
    var refSebelum = empat[3] || null;
    var cols = tigaAsc.map(function(r) {
      return { periode: r.periode, label: _ppPeriodeLabel(r.periode), badge: 'snap', data: r };
    });
    while (cols.length < 3) {
      cols.unshift({ periode: null, label: '—', badge: null, data: null });
    }
    cols.push({ periode: ymSkrg, label: _ppPeriodeLabel(ymSkrg), badge: 'live', data: liveData });

    _ppRenderCompareTable(cols, refSebelum ? { data: refSebelum } : null);

    // Bangun seri lengkap (semua histori + bulan berjalan) buat grafik
    _ppLiveDataCache = liveData;
    var histAsc = _ppHistoriCache.slice().reverse();
    _ppFullSeries = histAsc.map(function(r) {
      return { periode: r.periode, label: _ppPeriodeLabel(r.periode), data: r };
    });
    _ppFullSeries.push({ periode: ymSkrg, label: _ppPeriodeLabel(ymSkrg), data: liveData });
    _ppLoadPeriodMode(_ppPeriodMode);

  } catch(e) {
    console.error('[PP] loadUtama error', e);
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--danger)">Error: ' + e.message + '</span>';
  }
}

// ─── PERBARUI SNAPSHOT BULAN LALU ────────────────────────────
async function ppPerbarui() {
  var btn = document.getElementById('pp-btn-perbarui');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-refresh"></i> Memperbarui...'; }

  var now = new Date();
  var dLalu = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var ymLalu = dLalu.getFullYear() + '-' + String(dLalu.getMonth() + 1).padStart(2, '0');

  try {
    var data = await _ppFetchData(ymLalu);
    if (!data) throw new Error('Gagal ambil data');

    var existing = await dbGet('penutupan_periode', '&periode=eq.' + ymLalu).catch(function() { return []; });
    var payload = {
      periode: data.periode, tanggal_tutup: now.toISOString().split('T')[0],
      total_pendapatan: data.total_pendapatan, total_beban: data.total_beban,
      laba_rugi: data.laba_rugi, total_aset: 0, total_kewajiban: data.total_kewajiban,
      total_modal: 0, total_kas: data.total_kas, nilai_stok: data.nilai_stok,
      escrow_shopee: data.escrow_shopee, net_worth: data.net_worth, catatan: null,
    };

    if (existing && existing.length > 0) {
      await dbUpdate('penutupan_periode', existing[0].id, payload);
    } else {
      await dbInsert('penutupan_periode', payload);
    }

    _ppToast('✅ Snapshot ' + _ppPeriodeLabel(ymLalu) + ' diperbarui');
    ppLoadUtama();
  } catch(e) {
    _ppToast('❌ Gagal: ' + e.message, 4000);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-refresh"></i> Perbarui'; }
  }
}

// ─── LOAD RIWAYAT LENGKAP (halaman terpisah) ─────────────────
async function ppLoadRiwayatFull() {
  var bodyEl = document.getElementById('ppr-body');
  if (!bodyEl) return;
  bodyEl.innerHTML = '<div class="pp-empty">Memuat...</div>';

  var data = _ppHistoriCache.length > 0 ? _ppHistoriCache
    : await dbGet('penutupan_periode', '&order=periode.desc').catch(function() { return []; });

  if (!data || data.length === 0) {
    bodyEl.innerHTML = '<div class="pp-empty">Belum ada snapshot tersimpan.</div>';
    return;
  }

  bodyEl.innerHTML = data.map(function(r, i) {
    var nw   = Number(r.net_worth || 0);
    var lb   = Number(r.laba_rugi || 0);
    var prev = data[i + 1];
    var deltaHtml = '';
    if (prev) {
      var d = nw - Number(prev.net_worth || 0);
      deltaHtml = '<div class="pp-hist-delta" style="color:' + (d >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' +
        (d >= 0 ? '▲ +' : '▼ ') + _ppFmt(d) + '</div>';
    }
    var tgl = r.tanggal_tutup ? new Date(r.tanggal_tutup).toLocaleDateString('id-ID', { day:'2-digit', month:'short' }) : '—';
    return '<div class="pp-hist-row">' +
      '<div>' +
        '<div class="pp-hist-periode">' + _ppPeriodeLabel(r.periode) + '</div>' +
        '<div class="pp-hist-detail">' + tgl + ' · L/R: <span style="color:' + (lb >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' + _ppFmtVal(lb) + '</span> · Pend: ' + _ppFmt(r.total_pendapatan) + ' · Beban: ' + _ppFmt(r.total_beban) + '</div>' +
      '</div>' +
      '<div class="pp-hist-right">' +
        '<div class="pp-hist-nw" style="color:' + (nw >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' + _ppFmtVal(nw) + '</div>' +
        deltaHtml +
      '</div>' +
    '</div>';
  }).join('');
}

// ─── EVENT: BUKA HALAMAN ─────────────────────────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page === 'penutupan-periode') {
    setTimeout(_ppEnsureLayout, 60);
    ppLoadUtama();
  } else if (e.detail.page === 'penutupan-riwayat') {
    ppLoadRiwayatFull();
  }
});

// Render checkbox pertama kali (setelah semua var/fungsi di atas siap)
_ppRenderKriteriaChecks();

// ─── AUTO-SNAPSHOT: 3 detik setelah app dibuka (di halaman APAPUN) ───
// Gak perlu buka halaman Penutupan Periode — begitu app dibuka & bulan lalu
// belum ada snapshot-nya, langsung disimpan di background pakai fungsi yang
// sama dengan yang dipakai ppLoadUtama.
setTimeout(function() {
  if (typeof dbGet !== 'function' || typeof dbInsert !== 'function' || typeof _ppFetchData !== 'function') return;
  var now = new Date();
  var dLalu = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var ymLalu = dLalu.getFullYear() + '-' + String(dLalu.getMonth() + 1).padStart(2, '0');
  _ppAutoSnapshotBulan(ymLalu).then(function(data) {
    if (!data) return; // udah ada / gagal fetch — gak ada yang perlu dilakukan
    console.log('[PP] Auto-snapshot ' + ymLalu + ' tersimpan otomatis di background.');
    // Kalau kebetulan user lagi ada di halaman Laporan Bulanan, refresh biar konsisten
    var pg = document.getElementById('page-penutupan-periode');
    if (pg && pg.classList.contains('active') && typeof ppLoadUtama === 'function') ppLoadUtama();
  }).catch(function(e) { console.error('[PP] Auto-snapshot background gagal', e); });
}, 3000);
