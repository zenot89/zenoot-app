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
  <div class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>Hari</th><th style="text-align:right">Pendapatan</th><th style="text-align:right">Beban</th><th style="text-align:right">Net</th></tr></thead>
      <tbody id="gdgw-harian-tbody">
        <tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
</div>
</div>

<!-- PANEL: CATATAN PENDAPATAN -->
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

<!-- MODAL: CATATAN PENDAPATAN -->
<div class="modal-overlay" id="modal-gdg-pend" onclick="gdgOverlayClose(event,'modal-gdg-pend', gdgClosePendapatanModal)">
  <div class="modal" style="max-width:420px;width:100%;padding:16px">
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
        <input type="text" id="gdg-pend-warna" placeholder="contoh: Merah"
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
`;

setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-gadag')); }, 80);

// ─── VIEW SWITCH: dropdown menu (Ringkasan Mingguan / Catatan Pendapatan / Kelola Produk) ──
let _gdgView = 'mingguan';

const _GDG_VIEW_LABEL = {
  mingguan:   { menu: 'Ringkasan Mingguan', label: 'Ringkasan', heading: 'Overview',      icon: 'ti-calendar-week' },
  pendapatan: { menu: 'Catatan Pendapatan', label: 'Jurnal',    heading: 'Catatan',       icon: 'ti-notes' },
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
  document.getElementById('gdg-panel-sku').classList.toggle('active',       _gdgView === 'sku');

  document.getElementById('gdg-menu-btn-label').textContent  = _GDG_VIEW_LABEL[_gdgView].label;
  document.getElementById('gdg-view-heading').textContent    = _GDG_VIEW_LABEL[_gdgView].heading;
  document.getElementById('gdg-view-heading-icon').className = 'ti ' + _GDG_VIEW_LABEL[_gdgView].icon;
  const toggleBtn = document.getElementById('gdg-summary-toggle');
  if (toggleBtn) toggleBtn.style.display = (_gdgView === 'mingguan') ? '' : 'none';
  ['mingguan','pendapatan','sku'].forEach(v => {
    document.getElementById('gdg-menu-item-' + v).classList.toggle('active', v === _gdgView);
  });
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

// ─── RENDER: CATATAN PENDAPATAN ───────────────────────────────
function gdgRenderPendapatan() {
  const tbody = document.getElementById('gdg-pend-tbody');
  const countEl = document.getElementById('gdg-pend-count');
  if (countEl) countEl.textContent = _gdgPendapatanList.length + ' catatan';
  if (!_gdgPendapatanList.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada catatan pendapatan.</td></tr>';
    return;
  }
  tbody.innerHTML = _gdgPendapatanList.map(p => {
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
}

function gdgClosePendapatanModal() {
  document.getElementById('modal-gdg-pend').classList.remove('open');
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
      _gdgInitToggleSync();
      _gdgSyncToggleIcon();
    }, 100);
  });
})();

// ─── AUTO-INIT ────────────────────────────────────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page === 'gadag') setTimeout(gdgInit, 50);
});
