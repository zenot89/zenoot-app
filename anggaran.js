// ─── ANGGARAN.JS — Anggaran Beban Bulanan ────────────────────
// Tabel: kas_anggaran { id, akun_id, bulan, nominal }
// Akun : kas_akun     { id, kode, nama, kelompok, sub_kelompok }
// Realisasi: jurnal   { akun_debit, debit, tanggal }

let _angAkunBeban  = [];
let _angAnggaran   = [];
let _angJurnal     = [];
let _angBulanAktif = '';

// ─── HTML ─────────────────────────────────────────────────────
document.getElementById('page-anggaran').innerHTML = `
<style>
  .ang-metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
  @media(max-width:600px){ .ang-metrics { grid-template-columns:repeat(2,1fr); } }
  .ang-bar-wrap { height:5px; background:var(--cream2); border:1px solid var(--ink3); border-radius:3px; overflow:hidden; margin-top:5px; }
  .ang-bar-fill { height:100%; border-radius:3px; transition:width .5s; }
  .ang-ok     { background:var(--ok); }
  .ang-warn   { background:var(--warn); }
  .ang-danger { background:var(--danger); }
  /* Root cause teks "September 2026" ngga kontras di HP (7 Sep 2026): rule
     GLOBAL "input[type=month]{color-scheme:dark}" di style.css (@media
     max-width:900px) SENGAJA maksa dark buat halaman yg emang bertema gelap
     (misal Gadag). Tapi halaman Anggaran (Kas) ini bertema TERANG (var(--cream)
     terang), jadi browser render teks native month-picker asumsi background
     GELAP padahal kita paksa background terang lewat CSS — hasilnya teks jadi
     abu-abu pudar nyaris nyatu warna sama backgroundnya. Fix di-scope CUMA ke
     #ang-filter-bulan (ID selector menang lawan aturan global type-selector),
     supaya halaman lain yang mungkin masih butuh color-scheme:dark (misal di
     Gadag) sama sekali gak kesenggol. */
  #ang-filter-bulan { color-scheme: light; }
</style>

<div class="ang-metrics">
  <div class="metric">
    <div class="m-label">Total Anggaran</div>
    <div class="m-value" id="ang-total-anggaran">—</div>
    <div class="m-delta">semua pos beban</div>
  </div>
  <div class="metric">
    <div class="m-label">Total Realisasi</div>
    <div class="m-value" id="ang-total-realisasi">—</div>
    <div class="m-delta">dari jurnal kas</div>
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

<div class="card">
  <div class="card-title"
    style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <span><i class="ti ti-chart-pie"></i> Anggaran Beban</span>
    <div style="display:inline-flex;align-items:center;gap:8px">
      <button class="btn btn-sm" onclick="gotoPage('kas',null)"
        style="display:inline-flex;align-items:center;gap:5px;font-size:12px">
        <i class="ti ti-arrow-left"></i> Jurnal Harian
      </button>
    </div>
  </div>
  <div class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead>
        <tr>
          <th>Akun Beban</th>
          <th>Kategori</th>
          <th style="text-align:right">Anggaran</th>
          <th style="text-align:right">Realisasi</th>
          <th style="text-align:right">Selisih</th>
          <th style="text-align:right">%</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody id="ang-tbody">
        <tr><td colspan="7" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- MODAL -->
<div class="modal-overlay" id="modal-anggaran" onclick="angOverlayClose(event)">
  <div class="modal" style="max-width:400px;width:100%;padding:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;
                margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px">
        <i class="ti ti-edit"></i> Set Anggaran
      </div>
      <button onclick="angCloseModal()"
        style="background:none;border:none;font-size:22px;cursor:pointer;
               color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="ang-edit-id">
    <input type="hidden" id="ang-edit-akun-id">
    <div class="form-group" style="margin-bottom:8px">
      <label>Akun Beban</label>
      <div id="ang-edit-nama" style="font-weight:700;font-size:15px;padding:6px 0;color:var(--ink)">—</div>
    </div>
    <div class="form-group" style="margin-bottom:8px">
      <label>Bulan</label>
      <input type="month" id="ang-edit-bulan"
        style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;
               border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
    </div>
    <div class="form-group" style="margin-bottom:16px">
      <label>Nominal Anggaran (Rp)</label>
      <input type="text" inputmode="numeric" id="ang-edit-nominal"
        placeholder="contoh: 2.000.000"
        oninput="angFormatNominal(this)"
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
  const b   = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  _angBulanAktif = b;
  document.getElementById('ang-filter-bulan').value = b;
  angLoad();
}

function angOnBulanChange() {
  _angBulanAktif = document.getElementById('ang-filter-bulan').value || '';
  angLoad();
}

function angResetBulan() {
  const now = new Date();
  const b   = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  _angBulanAktif = b;
  document.getElementById('ang-filter-bulan').value = b;
  angLoad();
}

// ─── LOAD ─────────────────────────────────────────────────────
// _angJurnalAkunIdMap: map dari akun_debit_id (di jurnal) → kode akun
let _angJurnalAkunIdMap = {};

async function angLoad() {
  document.getElementById('ang-tbody').innerHTML =
    '<tr><td colspan="7" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';
  try {
    const bulan = _angBulanAktif;
    // Auto-carry-forward (per 7 Sep 2026, GANTI tombol manual "Salin Bulan
    // Lalu" yang dihapus atas permintaan user — "terlalu ribet"). Kalau
    // bulan yang lagi dilihat BELUM punya row kas_anggaran SAMA SEKALI,
    // otomatis disalin dari bulan lalu TERDEKAT yang punya data (bisa lompat
    // >1 bulan kalau beberapa bulan kosong berturut-turut) — INSERT row BARU
    // di bulan ini, row bulan lalu TETAP UTUH/gak disentuh, jadi histori aman
    // dan bulan ini tetep bebas diedit/dihapus tanpa ngubah bulan sebelumnya.
    // CUMA jalan kalau bulan ini masih 100% kosong (dicek dalam
    // angAutoCarryForward) — biar item yang UDAH dihapus user gak numbul
    // lagi tiap reload.
    if (bulan) await angAutoCarryForward(bulan);

    const [akunAll, akunAllFull, angAll, jurnalAll] = await Promise.all([
      dbGet('kas_akun', '&kelompok=eq.beban&sub_kelompok=eq.Beban Operasional&order=kode.asc'),
      dbGet('kas_akun', '&order=kode.asc'),
      bulan
        ? dbGet('kas_anggaran', '&bulan=eq.' + bulan + '&order=akun_id.asc')
        : dbGet('kas_anggaran', '&order=bulan.desc,akun_id.asc'),
      bulan
        ? dbGet('jurnal', '&tanggal=gte.' + bulan + '-01&tanggal=lte.' + bulan + '-' + new Date(bulan.split('-')[0], bulan.split('-')[1], 0).getDate() + '&order=tanggal.asc')
        : [],
    ]);
    _angJurnalAkunIdMap = {};
    (akunAllFull || []).forEach(a => { _angJurnalAkunIdMap[String(a.id)] = a.kode; });

    _angAkunBeban = akunAll  || [];
    _angAnggaran  = angAll   || [];
    _angJurnal    = jurnalAll || [];
    angRender();
  } catch(e) {
    document.getElementById('ang-tbody').innerHTML =
      `<tr><td colspan="7" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
  }
}

// ─── HITUNG REALISASI ─────────────────────────────────────────
function angRealisasi(akunKode) {
  let total = 0;
  _angJurnal.forEach(j => {
    const kodeJurnal = _angJurnalAkunIdMap[String(j.akun_debit_id)];
    if (kodeJurnal && kodeJurnal === akunKode) {
      total += Number(j.debit || j.nominal || 0);
    }
  });
  return total;
}
// ─── RENDER ───────────────────────────────────────────────────
function angRender() {
  const tbody  = document.getElementById('ang-tbody');
  const angMap = {};
  _angAnggaran.forEach(a => { angMap[String(a.akun_id)] = a; });

  if (!_angAkunBeban.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--ink3);font-style:italic">Belum ada akun beban. Tambah via Kas & Jurnal → Kelola Akun.</td></tr>';
    angUpdateMetrics(0, 0);
    return;
  }

  let totalAng = 0, totalRea = 0;

  const rows = _angAkunBeban.map(akun => {
    const ang    = angMap[String(akun.id)];
    const nomAng = ang ? (Number(ang.nominal) || 0) : 0;
    const nomRea = angRealisasi(akun.kode);
    totalAng += nomAng;
    totalRea += nomRea;

    const selisih = nomAng - nomRea;
    const pct     = nomAng > 0 ? Math.round((nomRea / nomAng) * 100) : (nomRea > 0 ? 999 : 0);
    const barW    = Math.min(pct, 100);
    const barCls  = pct > 75  ? 'ang-danger' : pct >= 35 ? 'ang-warn' : 'ang-ok';
    const selCol  = selisih >= 0 ? 'var(--ok)' : 'var(--danger)';
    const pctCol  = pct > 75  ? 'var(--danger)' : pct >= 35 ? 'var(--warn)' : 'var(--ok)';

    const angStr  = nomAng > 0
      ? angFmt(nomAng)
      : `<span style="color:var(--ink3);font-style:italic">Belum diset</span>`;
    const reaStr  = nomRea > 0 ? angFmt(nomRea) : `<span style="color:var(--ink3)">—</span>`;
    const selStr  = nomAng === 0 ? '—'
      : `<span style="color:${selCol};font-weight:700">${selisih>=0?'+':''}${angFmt(selisih)}</span>`;
    const pctStr  = nomAng === 0
      ? (nomRea > 0 ? `<span style="color:var(--danger)">∞%</span>` : '—')
      : `<span style="color:${pctCol};font-weight:700">${pct}%</span>`;


    const safeNama = (akun.nama||'').replace(/'/g,"\\'");

    return `<tr>
      <td>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div>
            <div style="font-weight:700">${akun.nama||'—'}</div>
            <div style="font-size:11px;color:var(--ink3);font-family:monospace">${akun.kode||''}</div>
          </div>
          ${nomAng > 0 ? `<span style="font-size:12px;font-weight:700;color:${pctCol};white-space:nowrap">${pct}%</span>` : ''}
        </div>
        ${nomAng > 0 ? `<div class="ang-bar-wrap" style="margin-top:5px"><div class="ang-bar-fill ${barCls}" style="width:${barW}%"></div></div>` : ''}
      </td>
      <td style="font-size:12px;color:var(--ink2)">${akun.sub_kelompok||'—'}</td>
      <td style="text-align:right">${angStr}</td>
      <td style="text-align:right">${reaStr}</td>
      <td style="text-align:right">${selStr}</td>
      <td style="text-align:right">${pctStr}</td>
      <td>
        <button class="btn btn-sm"
          onclick="angShowEdit('${akun.id}','${safeNama}','${ang ? ang.id : ''}',${nomAng})"
          title="Set Anggaran"><i class="ti ti-edit"></i></button>
        ${ang ? `<button class="btn btn-sm btn-danger" onclick="angHapus('${ang.id}')" style="margin-left:4px" title="Hapus"><i class="ti ti-trash"></i></button>` : ''}
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
  const delEl  = document.getElementById('ang-selisih-delta');
  const pctEl  = document.getElementById('ang-pct-serapan');

  if (totalAng === 0) {
    selEl.textContent = '—'; selEl.style.color = '';
    delEl.textContent = 'belum ada anggaran';
    pctEl.textContent = '—'; pctEl.style.color = '';
  } else {
    selEl.textContent = (selisih >= 0 ? '+' : '') + angFmt(selisih);
    selEl.style.color = selisih >= 0 ? 'var(--ok)' : 'var(--danger)';
    delEl.textContent = selisih >= 0 ? 'masih aman' : 'melebihi anggaran!';
    pctEl.textContent = pct + '%';
    pctEl.style.color = pct > 75  ? 'var(--danger)' : pct >= 35 ? 'var(--warn)' : 'var(--ok)';
  }
}

// ─── FORMAT ───────────────────────────────────────────────────
function angFmt(n) {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? '−' : '') + 'Rp' + abs.toLocaleString('id-ID');
}

// ─── MODAL ────────────────────────────────────────────────────
function angShowEdit(akunId, nama, angId, nomAng) {
  document.getElementById('ang-edit-akun-id').value  = akunId;
  document.getElementById('ang-edit-id').value       = angId || '';
  document.getElementById('ang-edit-nama').textContent = nama;
  document.getElementById('ang-edit-bulan').value    = _angBulanAktif || '';
  document.getElementById('ang-edit-nominal').value  = nomAng > 0 ? Number(nomAng).toLocaleString('id-ID') : '';
  document.getElementById('modal-anggaran').classList.add('open');
}

function angFormatNominal(el) {
  const raw = el.value.replace(/\D/g, '');
  if (!raw) { el.value = ''; return; }
  el.value = Number(raw).toLocaleString('id-ID');
}

function angCloseModal() {
  document.getElementById('modal-anggaran').classList.remove('open');
}

function angOverlayClose(e) {
  if (e.target.id === 'modal-anggaran') angCloseModal();
}

// ─── SIMPAN ───────────────────────────────────────────────────
async function angSimpan() {
  const angId  = document.getElementById('ang-edit-id').value.trim();
  const akunId = document.getElementById('ang-edit-akun-id').value;
  const bulan  = document.getElementById('ang-edit-bulan').value;
  const nomStr = document.getElementById('ang-edit-nominal').value.replace(/\D/g,'');
  const nominal = parseInt(nomStr, 10);

  if (!bulan)             { alert('Pilih bulan anggaran.'); return; }
  if (!nominal || nominal <= 0) { alert('Nominal harus lebih dari 0.'); return; }

  const payload = { akun_id: akunId, bulan, nominal };

  try {
    if (angId) {
      await dbUpdate('kas_anggaran', angId, payload);
    } else {
      await dbInsert('kas_anggaran', payload);
    }
    angCloseModal();
    _angBulanAktif = bulan;
    document.getElementById('ang-filter-bulan').value = bulan;
    angLoad();
  } catch(e) {
    alert('Gagal simpan: ' + e.message);
  }
}

// ─── HAPUS ────────────────────────────────────────────────────
function angHapus(id) {
  confirmDelete('Hapus anggaran ini?', async () => {
    try { await dbDelete('kas_anggaran', id); angLoad(); }
    catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// ─── SALIN BULAN LALU ─────────────────────────────────────────
// Ambil semua anggaran dari bulan sebelumnya, insert ke bulan aktif
// (skip akun yang sudah punya anggaran di bulan aktif)
// Auto-carry-forward kas_anggaran — dipanggil dari angLoad() SEBELUM fetch
// data bulan aktif. Cuma nyalin kalau bulan aktif masih 100% kosong (belum
// ada row kas_anggaran sama sekali) — gak dipanggil ulang begitu bulan itu
// udah punya minimal 1 row (termasuk kalau user abis hapus sebagian, sisanya
// tetep dihitung "udah punya data", jadi gak ke-restore lagi tiap reload).
// Gagal (network dll) sengaja cuma di-log, gak alert — biar gak ganggu
// render tabel normal (anggaran kosong tetep kebaca sebagai "Belum diset").
async function angAutoCarryForward(bulanAktif) {
  try {
    const cekAktif = await dbGet('kas_anggaran', '&bulan=eq.' + bulanAktif + '&limit=1');
    if (cekAktif && cekAktif.length) return; // bulan ini udah punya data sendiri

    const prevRows = await dbGet('kas_anggaran', '&bulan=lt.' + bulanAktif + '&order=bulan.desc,akun_id.asc&limit=200');
    if (!prevRows || !prevRows.length) return; // belum pernah ada anggaran sama sekali di bulan manapun

    const bulanTerakhir = prevRows[0].bulan;
    const sumber = prevRows.filter(r => r.bulan === bulanTerakhir);
    for (const r of sumber) {
      await dbInsert('kas_anggaran', { akun_id: r.akun_id, bulan: bulanAktif, nominal: r.nominal });
    }
  } catch(e) {
    console.error('Auto carry-forward anggaran gagal:', e.message);
  }
}

// ─── AUTO-INIT ────────────────────────────────────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page === 'anggaran') setTimeout(angInit, 50);
});
