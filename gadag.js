// ─── GADAG.JS — Jahit / Makloon (ongkos per lusin) ────────────
// Tabel: gadag_sku        { id, nama, ongkos_lusin, created_at }
// Tabel: gadag_pendapatan { id, tanggal, sku_id, sku_nama, ongkos_lusin, qty, total, created_at }
// Total per catatan = round(qty / 12 * ongkos_lusin)

let _gdgSkuList        = [];
let _gdgPendapatanList = [];
let _gdgBulanAktif     = '';

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
  .gdg-metrics { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-bottom:14px; }
  @media(max-width:600px){ .gdg-metrics { grid-template-columns:repeat(2,1fr); } }
  .gdg-panel { display:none; }
  .gdg-panel.active { display:block; }

  /* ── Penyesuaian khusus layar sempit (HP) ── */
  @media(max-width:480px) {
    .gdg-hero-value { font-size: 26px; }
    .gdg-metrics .m-value { font-size: 16px; line-height: 1.3; }
    #gdg-filter-bulan { min-width: 108px; flex: 1 1 auto; }
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

<!-- HEADER: judul + tombol switch view -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
  <div style="font-size:20px;font-weight:800;letter-spacing:.5px">GADAG</div>
  <button id="gdg-switch-btn" class="btn btn-sm btn-primary" onclick="gdgToggleView()">
    <i class="ti ti-list-details"></i> Kelola Produk
  </button>
</div>

<!-- HERO: TOTAL PENDAPATAN (utama) -->
<div class="card gdg-hero">
  <div class="gdg-hero-label"><i class="ti ti-scissors"></i> Total Pendapatan</div>
  <div class="gdg-hero-value" id="gdg-total-pendapatan">Rp0</div>
  <div class="gdg-hero-sub" id="gdg-total-sub">— pcs dikerjakan · — catatan</div>
</div>

<div class="gdg-metrics">
  <div class="metric">
    <div class="m-label">Jumlah Qty / Lsn</div>
    <div class="m-value" id="gdg-metric-qty">—</div>
    <div class="m-delta">pcs, periode terpilih</div>
  </div>
  <div class="metric">
    <div class="m-label">Jumlah SKU</div>
    <div class="m-value" id="gdg-metric-sku">—</div>
    <div class="m-delta">master ongkos per lusin</div>
  </div>
</div>

<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
  <button class="btn btn-sm" onclick="gdgLoad()"><i class="ti ti-refresh"></i> Refresh</button>
  <div style="margin-left:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
    <label style="font-size:12px;color:var(--ink2)">Bulan:</label>
    <input type="month" id="gdg-filter-bulan"
      style="font-family:var(--f);font-size:12px;padding:4px 8px;border:2px solid var(--ink);background:var(--cream)"
      onchange="gdgOnBulanChange()">
    <button class="btn btn-sm" onclick="gdgResetBulan()">Semua</button>
  </div>
</div>

<!-- PANEL: CATATAN PENDAPATAN -->
<div id="gdg-panel-pendapatan" class="gdg-panel active">
<div class="card">
  <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <span><i class="ti ti-notes"></i> Catatan Pendapatan</span>
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

<!-- RINGKASAN MINGGUAN (lokal, cuma di Gadag) -->
<div class="card" style="margin-top:14px">
  <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <span><i class="ti ti-calendar-week"></i> Ringkasan Mingguan</span>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
      <button class="btn btn-sm" onclick="gdgWPrevWeek()"><i class="ti ti-chevron-left"></i></button>
      <span id="gdgw-week-label" style="font-size:12px;font-weight:700;white-space:nowrap">—</span>
      <button class="btn btn-sm" onclick="gdgWNextWeek()"><i class="ti ti-chevron-right"></i></button>
      <button class="btn btn-sm btn-primary" onclick="gdgWThisWeek()">Minggu Ini</button>
    </div>
  </div>
  <div style="padding:8px 0 12px">
    <div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase">Net Mingguan (Pendapatan Gadag &minus; Beban Operasional)</div>
    <div id="gdgw-net-value" style="font-size:26px;font-weight:800;color:var(--ok)">Rp0</div>
    <div style="font-size:11px;color:var(--ink3);margin-top:2px">Beban dari jurnal akun kode 5-xxx, skip 5-001 Beban Gaji</div>
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

<!-- PANEL: KELOLA PRODUK (master SKU & ongkos) -->
<div id="gdg-panel-sku" class="gdg-panel">
<div class="card">
  <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <span><i class="ti ti-list-details"></i> Kelola Produk</span>
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

// ─── VIEW SWITCH (satu tombol, teks berganti sesuai posisi) ────
let _gdgView = 'pendapatan';

function gdgToggleView() {
  _gdgView = _gdgView === 'pendapatan' ? 'sku' : 'pendapatan';
  gdgApplyView();
}

function gdgApplyView() {
  const showPend = _gdgView === 'pendapatan';
  document.getElementById('gdg-panel-pendapatan').classList.toggle('active', showPend);
  document.getElementById('gdg-panel-sku').classList.toggle('active', !showPend);
  const btn = document.getElementById('gdg-switch-btn');
  btn.innerHTML = showPend
    ? '<i class="ti ti-list-details"></i> Kelola Produk'
    : '<i class="ti ti-notes"></i> Catatan Pendapatan';
}

// ─── INIT ─────────────────────────────────────────────────────
function gdgInit() {
  _gdgView = 'pendapatan';
  gdgApplyView();
  _gdgBulanAktif = '';
  const bulanEl = document.getElementById('gdg-filter-bulan');
  if (bulanEl) bulanEl.value = '';
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

const _GDGW_HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
const _GDGW_BLN  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

function gdgWGetMonday(d) {
  const day  = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0,0,0,0);
  return mon;
}
function gdgWToISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function gdgWFmtTgl(d) { return d.getDate() + ' ' + _GDGW_BLN[d.getMonth()] + ' ' + d.getFullYear(); }
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
  const monday = new Date(_gdgWWeekStart);
  const sunday = new Date(_gdgWWeekStart); sunday.setDate(monday.getDate() + 6);
  document.getElementById('gdgw-week-label').textContent = gdgWFmtTgl(monday) + ' – ' + gdgWFmtTgl(sunday);

  const isoMon = gdgWToISO(monday), isoSun = gdgWToISO(sunday);

  // Akun beban yg dihitung: kode diawali "5-" TAPI BUKAN "5-001" (skip Beban Gaji)
  const akunBebanMap = {};
  _gdgWAkunAll.forEach(a => {
    if (a.kelompok === 'beban' && (a.kode||'').indexOf('5-') === 0 && a.kode !== '5-001') akunBebanMap[a.id] = a;
  });

  document.getElementById('gdgw-harian-tbody').innerHTML = '<tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';

  let pendapatanMingguList = [];
  try {
    pendapatanMingguList = await dbGet('gadag_pendapatan', '&tanggal=gte.' + isoMon + '&tanggal=lte.' + isoSun) || [];
  } catch(e) {
    document.getElementById('gdgw-harian-tbody').innerHTML = `<tr><td colspan="4" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
    return;
  }

  let html = '', totalPend = 0, totalBeban = 0;
  for (let i = 0; i < 7; i++) {
    const d      = new Date(monday); d.setDate(monday.getDate() + i);
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
}

function gdgOnBulanChange() {
  _gdgBulanAktif = document.getElementById('gdg-filter-bulan').value || '';
  gdgLoad();
}

function gdgResetBulan() {
  _gdgBulanAktif = '';
  document.getElementById('gdg-filter-bulan').value = '';
  gdgLoad();
}

// ─── LOAD ─────────────────────────────────────────────────────
async function gdgLoad() {
  const skuTbody  = document.getElementById('gdg-sku-tbody');
  const pendTbody = document.getElementById('gdg-pend-tbody');
  skuTbody.innerHTML  = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';
  pendTbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';

  try {
    const bulan = _gdgBulanAktif;
    let pendFilter = '&order=tanggal.desc,id.desc';
    if (bulan) {
      const [y, m] = bulan.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      pendFilter = '&tanggal=gte.' + bulan + '-01&tanggal=lte.' + bulan + '-' + String(lastDay).padStart(2,'0') + '&order=tanggal.desc,id.desc';
    }

    const [skuAll, pendAll] = await Promise.all([
      dbGet('gadag_sku', '&order=nama.asc'),
      dbGet('gadag_pendapatan', pendFilter),
    ]);

    _gdgSkuList        = skuAll  || [];
    _gdgPendapatanList = pendAll || [];

    gdgRenderSku();
    gdgRenderPendapatan();
    gdgUpdateMetrics();
  } catch(e) {
    skuTbody.innerHTML  = `<tr><td colspan="3" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
    pendTbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
  }
}

// ─── RENDER: SKU ──────────────────────────────────────────────
function gdgRenderSku() {
  const tbody = document.getElementById('gdg-sku-tbody');
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
function gdgUpdateMetrics() {
  let totalPendapatan = 0, totalQty = 0;
  _gdgPendapatanList.forEach(p => {
    totalPendapatan += Number(p.total)||0;
    totalQty        += Number(p.qty)||0;
  });
  const jmlCatatan = _gdgPendapatanList.length;
  const totalLsn = (totalQty / 12).toFixed(1);

  document.getElementById('gdg-total-pendapatan').textContent = gdgFmt(totalPendapatan);
  document.getElementById('gdg-total-sub').textContent = totalQty.toLocaleString('id-ID') + ' pcs dikerjakan · ' + jmlCatatan + ' catatan';
  document.getElementById('gdg-metric-sku').textContent = _gdgSkuList.length;
  document.getElementById('gdg-metric-qty').innerHTML = totalQty.toLocaleString('id-ID') + ' pc<br>' + totalLsn + ' lsn';
}

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

// ─── AUTO-INIT ────────────────────────────────────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page === 'gadag') setTimeout(gdgInit, 50);
});
