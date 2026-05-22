// ─── ANGGARAN.JS — Anggaran Beban Bulanan ────────────────────
// Pakai tabel yang sudah ada:
//   beban_operasional  → { id, nama, nominal, tipe }  ← anggaran per pos
//   jurnal             → { akun_debit, debit, tanggal } ← realisasi
//   kas_akun           → { id, nama, kode, kelompok }   ← mapping nama akun

let _angBeban   = [];   // data dari beban_operasional
let _angAkunMap = {};   // map id→akun dari kas_akun
let _angJurnal  = [];   // jurnal bulan aktif
let _angBulanAktif = '';

// ─── HTML PAGE ───────────────────────────────────────────────
document.getElementById('page-anggaran').innerHTML = `
<style>
  .ang-metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
  @media(max-width:600px){ .ang-metrics { grid-template-columns:repeat(2,1fr); } }
  .ang-bar-wrap { height:5px; background:var(--cream2); border:1px solid var(--ink3); border-radius:3px; overflow:hidden; margin-top:5px; }
  .ang-bar-fill { height:100%; border-radius:3px; transition:width .5s; }
  .ang-ok     { background:var(--ok); }
  .ang-warn   { background:var(--warn); }
  .ang-danger { background:var(--danger); }
</style>

<!-- METRICS -->
<div class="ang-metrics">
  <div class="metric">
    <div class="m-label">Total Anggaran</div>
    <div class="m-value" id="ang-total-anggaran">—</div>
    <div class="m-delta">semua pos beban</div>
  </div>
  <div class="metric">
    <div class="m-label">Total Realisasi</div>
    <div class="m-value" id="ang-total-realisasi">—</div>
    <div class="m-delta" id="ang-rea-delta">dari jurnal kas</div>
  </div>
  <div class="metric">
    <div class="m-label">Sisa / Selisih</div>
    <div class="m-value" id="ang-total-selisih">—</div>
    <div class="m-delta" id="ang-selisih-delta">anggaran − realisasi</div>
  </div>
  <div class="metric">
    <div class="m-label">% Serapan</div>
    <div class="m-value" id="ang-pct-serapan">—</div>
    <div class="m-delta">dari total anggaran</div>
  </div>
</div>

<!-- TOOLBAR -->
<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
  <button class="btn btn-sm" onclick="angLoad()">
    <i class="ti ti-refresh"></i> Refresh
  </button>
  <div style="margin-left:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
    <label style="font-size:12px;color:var(--ink2)">Bulan:</label>
    <input type="month" id="ang-filter-bulan"
      style="font-family:var(--f);font-size:12px;padding:4px 8px;border:2px solid var(--ink);background:var(--cream)"
      onchange="angOnBulanChange()">
    <button class="btn btn-sm" onclick="angResetBulan()">Bulan Ini</button>
  </div>
</div>

<!-- TABEL -->
<div class="card">
  <div class="card-title"
    style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <span><i class="ti ti-chart-pie"></i> Anggaran Beban</span>
    <button class="btn btn-sm" onclick="gotoPage('kas',null)"
      style="display:inline-flex;align-items:center;gap:5px;font-size:12px">
      <i class="ti ti-arrow-left"></i> Jurnal Harian
    </button>
  </div>
  <div class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead>
        <tr>
          <th>Pos Beban</th>
          <th style="text-align:right">Anggaran</th>
          <th style="text-align:right">Realisasi</th>
          <th style="text-align:right">Selisih</th>
          <th style="text-align:right">%</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody id="ang-tbody">
        <tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- MODAL EDIT NOMINAL -->
<div class="modal-overlay" id="modal-anggaran" onclick="angOverlayClose(event)">
  <div class="modal" style="max-width:400px;width:100%;padding:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;
                margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px">
        <i class="ti ti-edit"></i> Edit Anggaran
      </div>
      <button onclick="angCloseModal()"
        style="background:none;border:none;font-size:22px;cursor:pointer;
               color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>

    <input type="hidden" id="ang-edit-id">

    <div class="form-group" style="margin-bottom:8px">
      <label>Pos Beban</label>
      <div id="ang-edit-nama"
        style="font-weight:700;font-size:15px;padding:6px 0;color:var(--ink)">—</div>
    </div>

    <div class="form-group" style="margin-bottom:16px">
      <label>Nominal Anggaran (Rp)</label>
      <input type="text" inputmode="numeric" id="ang-edit-nominal"
        placeholder="contoh: 2000000"
        style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;
               border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn" onclick="angCloseModal()">Batal</button>
      <button class="btn btn-primary" onclick="angSimpan()">
        <i class="ti ti-check"></i> Simpan
      </button>
    </div>
  </div>
</div>
`;

// ─── INIT ─────────────────────────────────────────────────────
function angInit() {
  const now = new Date();
  const bulanIni = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  _angBulanAktif = bulanIni;
  document.getElementById('ang-filter-bulan').value = bulanIni;
  angLoad();
}

function angOnBulanChange() {
  _angBulanAktif = document.getElementById('ang-filter-bulan').value || '';
  angLoad();
}

function angResetBulan() {
  const now = new Date();
  const bulanIni = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  _angBulanAktif = bulanIni;
  document.getElementById('ang-filter-bulan').value = bulanIni;
  angLoad();
}

// ─── LOAD ─────────────────────────────────────────────────────
async function angLoad() {
  document.getElementById('ang-tbody').innerHTML =
    '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';
  try {
    const [beban, akun, jurnal] = await Promise.all([
      dbGet('beban_operasional', '&order=id.asc'),
      dbGet('kas_akun', '&kelompok=eq.beban&order=kode.asc'),
      _angBulanAktif
        ? dbGet('jurnal', '&tanggal=gte.' + _angBulanAktif + '-01&tanggal=lte.' + _angBulanAktif + '-31&order=tanggal.asc')
        : [],
    ]);
    _angBeban   = beban  || [];
    _angAkunMap = {};
    (akun||[]).forEach(a => { _angAkunMap[a.id] = a; });
    _angJurnal  = jurnal || [];
    angRender();
  } catch(e) {
    document.getElementById('ang-tbody').innerHTML =
      `<tr><td colspan="6" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
  }
}

// ─── HITUNG REALISASI ─────────────────────────────────────────
// Cari akun kas yang namanya mirip nama pos beban, lalu sum debit dari jurnal
function angRealisasiUntuk(namaPos) {
  // Cari akun beban yang namanya cocok (case-insensitive, trim)
  const namaLower = (namaPos||'').toLowerCase().trim();
  const matchAkun = Object.values(_angAkunMap).find(a =>
    (a.nama||'').toLowerCase().trim() === namaLower ||
    (a.nama||'').toLowerCase().includes(namaLower) ||
    namaLower.includes((a.nama||'').toLowerCase().trim())
  );
  if (!matchAkun) return 0;
  let total = 0;
  _angJurnal.forEach(j => {
    if (String(j.akun_debit) === String(matchAkun.id)) {
      total += Number(j.debit) || 0;
    }
  });
  return total;
}

// ─── RENDER ───────────────────────────────────────────────────
function angRender() {
  const tbody = document.getElementById('ang-tbody');
  if (!_angBeban.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada data beban operasional.</td></tr>';
    angUpdateMetrics(0, 0);
    return;
  }

  let totalAng = 0, totalRea = 0;

  const rows = _angBeban.map(b => {
    const nomAng = Number(b.nominal) || 0;
    const nomRea = angRealisasiUntuk(b.nama);
    totalAng += nomAng;
    totalRea += nomRea;

    const selisih  = nomAng - nomRea;
    const pct      = nomAng > 0 ? Math.round((nomRea/nomAng)*100) : (nomRea > 0 ? 999 : 0);
    const barW     = Math.min(pct, 100);
    const barCls   = pct >= 100 ? 'ang-danger' : pct >= 80 ? 'ang-warn' : 'ang-ok';
    const selColor = selisih >= 0 ? 'var(--ok)' : 'var(--danger)';
    const pctColor = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warn)' : 'var(--ok)';

    const selStr = nomAng === 0
      ? '—'
      : `<span style="color:${selColor};font-weight:700">${selisih >= 0 ? '+' : ''}${angFmt(selisih)}</span>`;

    const pctStr = nomAng === 0
      ? (nomRea > 0 ? '<span style="color:var(--danger)">∞%</span>' : '—')
      : `<span style="color:${pctColor};font-weight:700">${pct}%</span>`;

    const bar = nomAng > 0
      ? `<div class="ang-bar-wrap"><div class="ang-bar-fill ${barCls}" style="width:${barW}%"></div></div>`
      : '';

    return `<tr>
      <td>
        <div style="font-weight:700">${b.nama||'—'}</div>
        <div style="font-size:11px;color:var(--ink3)">${b.tipe||''}</div>
        ${bar}
      </td>
      <td style="text-align:right">${nomAng > 0 ? angFmt(nomAng) : '<span style="color:var(--ink3);font-style:italic">Belum diset</span>'}</td>
      <td style="text-align:right">${nomRea > 0 ? angFmt(nomRea) : '<span style="color:var(--ink3)">—</span>'}</td>
      <td style="text-align:right">${selStr}</td>
      <td style="text-align:right">${pctStr}</td>
      <td>
        <button class="btn btn-sm" onclick="angShowEdit(${b.id},'${(b.nama||'').replace(/'/g,"\\'")}',${nomAng})" title="Edit Anggaran">
          <i class="ti ti-edit"></i>
        </button>
      </td>
    </tr>`;
  });

  tbody.innerHTML = rows.join('');
  angUpdateMetrics(totalAng, totalRea);
}

// ─── METRICS ──────────────────────────────────────────────────
function angUpdateMetrics(totalAng, totalRea) {
  const selisih = totalAng - totalRea;
  const pct     = totalAng > 0 ? Math.round((totalRea/totalAng)*100) : 0;

  document.getElementById('ang-total-anggaran').textContent  = angFmt(totalAng);
  document.getElementById('ang-total-realisasi').textContent = angFmt(totalRea);

  const selEl  = document.getElementById('ang-total-selisih');
  const selDel = document.getElementById('ang-selisih-delta');
  const pctEl  = document.getElementById('ang-pct-serapan');

  if (totalAng === 0) {
    selEl.textContent = '—'; selEl.style.color = '';
    selDel.textContent = 'belum ada anggaran';
    pctEl.textContent = '—'; pctEl.style.color = '';
  } else {
    selEl.textContent  = (selisih >= 0 ? '+' : '') + angFmt(selisih);
    selEl.style.color  = selisih >= 0 ? 'var(--ok)' : 'var(--danger)';
    selDel.textContent = selisih >= 0 ? 'masih aman' : 'melebihi anggaran!';
    pctEl.textContent  = pct + '%';
    pctEl.style.color  = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warn)' : 'var(--ok)';
  }
}

// ─── FORMAT ───────────────────────────────────────────────────
function angFmt(n) {
  const abs = Math.abs(Math.round(n));
  const str = 'Rp' + abs.toLocaleString('id-ID');
  return n < 0 ? '−' + str : str;
}

// ─── MODAL ────────────────────────────────────────────────────
function angShowEdit(id, nama, nominal) {
  document.getElementById('ang-edit-id').value      = id;
  document.getElementById('ang-edit-nama').textContent = nama;
  document.getElementById('ang-edit-nominal').value = nominal || '';
  document.getElementById('modal-anggaran').classList.add('open');
}

function angCloseModal() {
  document.getElementById('modal-anggaran').classList.remove('open');
}

function angOverlayClose(e) {
  if (e.target.id === 'modal-anggaran') angCloseModal();
}

// ─── SIMPAN ───────────────────────────────────────────────────
async function angSimpan() {
  const id     = document.getElementById('ang-edit-id').value;
  const nomStr = document.getElementById('ang-edit-nominal').value.replace(/\D/g,'');
  const nominal = parseInt(nomStr, 10);

  if (!nominal || nominal <= 0) { alert('Nominal harus lebih dari 0.'); return; }

  try {
    await dbUpdate('beban_operasional', id, { nominal });
    angCloseModal();
    angLoad();
  } catch(e) {
    alert('Gagal simpan: ' + e.message);
  }
}

// ─── AUTO-INIT saat halaman dibuka ───────────────────────────
(function _angPatchGotoPage() {
  const _orig = window.gotoPage;
  window.gotoPage = function(page, btn) {
    _orig(page, btn);
    if (page === 'anggaran') setTimeout(angInit, 50);
  };
})();
