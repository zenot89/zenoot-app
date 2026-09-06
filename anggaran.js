// ─── ANGGARAN.JS — Anggaran Beban Bulanan ────────────────────
// Tabel: kas_anggaran { id, akun_id, bulan, nominal }
// Akun : kas_akun     { id, kode, nama, kelompok, sub_kelompok }
// Realisasi: jurnal   { akun_debit, debit, tanggal }

let _angAkunBeban  = [];
let _angAkunAllBK  = []; // SEMUA akun kelompok beban/kewajiban (semua sub_kelompok) — dipake buat select di modal "+ Anggaran" (angShowAddNew), beda dari _angAkunBeban yang cuma Beban Operasional (dipake buat baris tabel)
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

  /* Hide-on-scroll minicard (7 Sep 2026) — pola SAMA persis kayak
     .kas-topbar-collapsed di kas.js (_kasScrollCollapseInit), biar konsisten
     satu app. CUMA aktif di HP (dicek via matchMedia di JS-nya, bukan di
     CSS, biar gampang di-skip di desktop/laptop tanpa nulis breakpoint 2x). */
  #ang-metrics-wrap {
    overflow: hidden;
    transition: max-height 0.25s ease, opacity 0.2s ease;
    max-height: 500px;
    opacity: 1;
  }
  #ang-metrics-wrap.ang-metrics-collapsed {
    max-height: 0 !important;
    opacity: 0;
    pointer-events: none;
  }

  /* ── SHEET: Pilih Akun (ala BRImo, 7 Sep 2026) — ganti <select> native
     yang dulu dipakai buat "Akun Beban" mode Tambah. Sama pola persis
     kayak #kas-sheet-akun-picker di Kas & Jurnal (style.css), CUMA id
     di-scope sendiri (ang-*) biar independen — konsisten sama pola app-wide
     BRImo picker rollout di modul lain (lihat RULES.md §"picker rollout").
     .kas-brimo-handle/.kas-brimo-sheet-title/.kas-akun-item/.kas-akun-empty
     dipakai ulang (global, gak di-duplikat di sini). */
  #ang-akun-sheet-overlay {
    display: none; position: fixed; inset: 0; z-index: 700;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
  }
  #ang-akun-sheet-overlay.open { display: block; }
  #ang-akun-sheet {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 701;
    background: var(--cream2); border-radius: 20px 20px 0 0;
    transform: translateY(100%);
    transition: transform 0.28s cubic-bezier(.4,0,.2,1);
    padding-bottom: env(safe-area-inset-bottom, 16px);
    max-height: 88vh; display: none; flex-direction: column; overflow: hidden;
  }
  #ang-akun-sheet.open { display: flex; transform: translateY(0); }
  #ang-akun-sheet-search-wrap { flex: none; padding: 0 16px 10px; }
  #ang-akun-sheet-search {
    width: 100%; box-sizing: border-box; background: var(--ovl-0_06);
    border: 1px solid var(--ovl-0_12); border-radius: 10px; padding: 11px 14px;
    font-size: 15px; font-family: var(--f); color: var(--ink); outline: none;
    -webkit-appearance: none;
  }
  #ang-akun-sheet-search::placeholder { color: var(--ink3); }
  #ang-akun-sheet-search:focus { border-color: var(--ovl-0_25); background: var(--ovl-0_09); }
  #ang-akun-sheet-list {
    flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain; padding: 4px 10px 12px;
  }
  #ang-akun-sheet-list .kas-akun-item { font-size: 15px; padding: 12px 10px; border-radius: 8px; }
  /* Fix kontras "active" item di picker ini — .kas-akun-item.active (global,
     style.css) sengaja set color:var(--cream) buat picker GELAP (Kas &
     Jurnal, bg #111113 hardcoded) biar teks terang kebaca. Sheet Anggaran
     ini bg-nya TERANG (var(--cream2)), jadi --cream (nyaris putih di light
     theme) nempel warnanya sama background → teks item yang lagi kepilih
     jadi invisible (root cause SAMA kayak bug kontras input[type=month] di
     atas). Di-override CUMA di scope list ini pakai var(--ink) (otomatis
     kontras baik di light maupun dark theme app, karena --ink selalu jadi
     warna TEKS di kedua tema itu — beda dari --cream yang perannya jadi
     SURFACE/background di dark theme). Picker lain (Kas & Jurnal dll) sama
     sekali gak disentuh. */
  #ang-akun-sheet-list .kas-akun-item.active { color: var(--ink); }
  #ang-akun-sheet-list .kas-akun-group { color: var(--ink3); }
  #ang-akun-sheet-list::-webkit-scrollbar { width: 4px; }
  #ang-akun-sheet-list::-webkit-scrollbar-track { background: transparent; }
  #ang-akun-sheet-list::-webkit-scrollbar-thumb { background: var(--ovl-0_15); border-radius: 2px; }
  @media (min-width: 768px) {
    #ang-akun-sheet {
      left: 50%; right: auto; bottom: 50%; transform: translate(-50%, 50%) scale(.96);
      width: 100%; max-width: 420px; border-radius: 16px; max-height: 70vh; opacity: 0;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    #ang-akun-sheet.open { transform: translate(-50%, 50%) scale(1); opacity: 1; }
  }

  /* Baris pembatas grup non-Beban-Operasional (Kewajiban dll) di tabel
     utama — 7 Sep 2026, GANTI card "Anggaran Lainnya" terpisah (kesan
     "nempel"/berat buat cuma 1-2 baris). Sekarang 1 tabel aja, dipisah
     baris judul kecil biar tetep kebaca beda kategori tanpa duplikasi
     header/footer tabel. Lihat angRender()/angGroupLabel(). */
  .ang-group-divider td {
    background: var(--cream2); font-weight: 700; font-size: 11px;
    letter-spacing: .04em; text-transform: uppercase; color: var(--ink2);
    padding: 7px 10px; border-top: 2px solid var(--ink3);
  }
</style>

<div id="ang-metrics-wrap">
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
      <button class="btn btn-sm btn-primary" id="ang-btn-tambah" onclick="angShowAddNew()"
        style="display:inline-flex;align-items:center;gap:5px;font-size:12px">
        <i class="ti ti-plus"></i> Anggaran
      </button>
    </div>
  </div>
  <div class="tbl-wrap" style="max-height:65vh;overflow-y:auto;overflow-x:auto;overscroll-behavior:none;touch-action:pan-y pan-x;scroll-behavior:smooth">
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
      <!-- <select> sekarang CUMA penyimpan value (persis pola kas-jrn-akun-debit
           di kas.js) — gak pernah ditampilin lagi, diganti trigger + sheet di
           bawah. Tetep dipertahanin biar angSimpan()/angAkunSelectChange() gak
           perlu ditulis ulang. -->
      <select id="ang-edit-akun-select" onchange="angAkunSelectChange()"
        style="display:none;pointer-events:none;position:absolute;width:0;height:0;opacity:0"
        tabindex="-1" aria-hidden="true">
      </select>
      <!-- Cuma nongol pas mode TAMBAH (angShowAddNew) — mode edit dari baris
           tabel tetep pakai div readonly di atas (akun-nya udah pasti). -->
      <div class="kas-akun-picker" id="ang-akun-picker" style="display:none" onclick="angAkunPickerOpen()">
        <span id="ang-akun-picker-label" style="color:var(--ink3)">— pilih akun —</span>
        <i class="ti ti-chevron-down" style="font-size:11px;margin-left:auto;flex-shrink:0"></i>
      </div>
    </div>
    <div class="form-group" style="margin-bottom:8px">
      <label>Bulan</label>
      <input type="month" id="ang-edit-bulan" onchange="angAkunSelectChange()"
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

<!-- SHEET: Pilih Akun (ala BRImo) — buat "Akun Beban" di modal Set Anggaran
     mode Tambah. Overlay/sheet SENDIRI (bukan punya modal-anggaran), z-index
     di atas .modal-overlay (300) biar bisa naik DI ATAS modal itu tanpa
     nutupnya — sama pola kayak #kas-akun-picker-overlay di Kas & Jurnal. -->
<div id="ang-akun-sheet-overlay" onclick="angAkunPickerClose()"></div>
<div id="ang-akun-sheet">
  <div class="kas-brimo-handle"></div>
  <div class="kas-brimo-sheet-title">Pilih Akun Beban</div>
  <div id="ang-akun-sheet-search-wrap">
    <input type="text" id="ang-akun-sheet-search" placeholder="Cari akun..."
      autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"
      oninput="angAkunPickerFilter(this.value)">
  </div>
  <div id="ang-akun-sheet-list"></div>
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
    _angAkunAllBK = (akunAllFull || []).filter(a => a.kelompok === 'beban' || a.kelompok === 'kewajiban');

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
// ─── RENDER (baris tabel, dipakai bareng tabel utama & "Anggaran Lainnya") ──
// Diekstrak dari angRender() (dulu cuma dipakai 1 tabel) — 7 Sep 2026, dipecah
// biar tabel "Anggaran Lainnya" (akun di luar Beban Operasional) bisa pakai
// bentuk baris yang identik tanpa duplikasi logic warna/format.
function angRowHtml(akun, ang, kategoriLabel) {
  const nomAng = ang ? (Number(ang.nominal) || 0) : 0;
  const nomRea = angRealisasi(akun.kode);

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

  const html = `<tr>
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
    <td style="font-size:12px;color:var(--ink2)">${kategoriLabel||akun.sub_kelompok||'—'}</td>
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

  return { html, nomAng, nomRea };
}

// Label baris pembatas grup non-Beban-Operasional — 7 Sep 2026. Khusus
// kelompok 'kewajiban' pakai nama yang user minta ("Anggaran Pelunasan
// Hutang"); kelompok/sub_kelompok lain (kalau suatu saat ada) fallback ke
// nama sub_kelompok/kelompok akun itu sendiri, biar gak hardcode ke 1 kasus doang.
function angGroupLabel(akun) {
  if (akun.kelompok === 'kewajiban') return 'Anggaran Pelunasan Hutang';
  return 'Anggaran ' + (akun.sub_kelompok || akun.kelompok || 'Lainnya');
}

// ─── RENDER ───────────────────────────────────────────────────
// Tabel ini render 2 golongan baris dalam 1 tbody yang sama:
//  1) _angAkunBeban (Beban Operasional) — ikut dihitung ke total metrics atas.
//  2) Akun di luar itu (misal Kewajiban kayak Hutang Bank) yang KEBETULAN
//     punya row kas_anggaran bulan aktif — dipisah baris judul (divider),
//     dikelompokkan per kategori (angGroupLabel), TIDAK ikut total metrics
//     atas (biar "Total Anggaran" tetep berarti "anggaran beban operasional").
//     Dulu ini card terpisah (§8.1 lama) — digabung jadi 1 tabel 7 Sep 2026
//     karena card kedua kesannya "nempel"/berat buat cuma 1-2 baris.
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

  const mainRows = _angAkunBeban.map(akun => {
    const r = angRowHtml(akun, angMap[String(akun.id)]);
    totalAng += r.nomAng;
    totalRea += r.nomRea;
    return r.html;
  });

  // Akun kandidatnya _angAkunAllBK (Beban+Kewajiban SEMUA sub_kelompok,
  // sumber yang sama dipakai picker "+ Anggaran") MINUS akun yang udah
  // tampil di atas (_angAkunBeban). Cuma ditampilin kalau BENERAN punya row
  // kas_anggaran bulan aktif — bukan semua kandidat, biar gak numplek
  // nampilin akun "Belum diset" yang emang gak relevan di panel ini.
  const bebanIds = new Set(_angAkunBeban.map(a => String(a.id)));
  const lainnyaAkun = (_angAkunAllBK || []).filter(a =>
    angMap[String(a.id)] && !bebanIds.has(String(a.id))
  );

  let lainnyaRows = [];
  if (lainnyaAkun.length) {
    let lastLabel = null;
    lainnyaAkun.forEach(akun => {
      const label = angGroupLabel(akun);
      if (label !== lastLabel) {
        lainnyaRows.push(`<tr class="ang-group-divider"><td colspan="7">${label}</td></tr>`);
        lastLabel = label;
      }
      lainnyaRows.push(angRowHtml(akun, angMap[String(akun.id)]).html);
    });
  }

  tbody.innerHTML = mainRows.join('') + lainnyaRows.join('');
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
  document.getElementById('ang-edit-nama').style.display = '';
  document.getElementById('ang-edit-nama').textContent = nama;
  document.getElementById('ang-akun-picker').style.display = 'none';
  document.getElementById('ang-edit-bulan').value    = _angBulanAktif || '';
  document.getElementById('ang-edit-nominal').value  = nomAng > 0 ? Number(nomAng).toLocaleString('id-ID') : '';
  document.getElementById('modal-anggaran').classList.add('open');
}

// Tombol [+ Anggaran] di header — beda dari angShowEdit (yg selalu dari
// baris tabel yg akunnya udah pasti): di sini akunnya BEBAS dipilih dari
// SEMUA akun Beban/Kewajiban (_angAkunAllBK, semua sub_kelompok — bukan
// cuma Beban Operasional yg tampil di tabel), termasuk akun yg gak pernah
// nongol sebagai baris di tabel ini sama sekali (misal kelompok Kewajiban,
// atau Beban di luar sub_kelompok "Beban Operasional"). Berguna khususnya
// buat akun yang mau dipilih di checkbox "Pilih Akun" Gadag tapi belum
// pernah bisa di-set nominalnya di sini.
function angShowAddNew() {
  document.getElementById('ang-edit-id').value      = '';
  document.getElementById('ang-edit-akun-id').value = '';
  document.getElementById('ang-edit-nama').style.display = 'none';
  // <select> tetep penyimpan value (option HARUS ada biar sel.value=id
  // di angAkunPickerSelectItem beneran nempel) — cuma gak pernah ditampilin,
  // trigger + sheet BRImo di bawah yang jadi UI-nya.
  const sel = document.getElementById('ang-edit-akun-select');
  sel.innerHTML = '<option value="">— pilih akun —</option>' +
    _angAkunAllBK.map(a => `<option value="${a.id}">${(a.nama||'—')} (${a.kode||'—'})</option>`).join('');
  sel.value = '';
  const picker = document.getElementById('ang-akun-picker');
  picker.style.display = '';
  const pickerLbl = document.getElementById('ang-akun-picker-label');
  pickerLbl.textContent = '— pilih akun —';
  pickerLbl.style.color = 'var(--ink3)';
  document.getElementById('ang-edit-bulan').value   = _angBulanAktif || '';
  document.getElementById('ang-edit-nominal').value = '';
  document.getElementById('modal-anggaran').classList.add('open');
}

// Kalau akun yang dipilih di select TERNYATA udah punya kas_anggaran bulan
// ini, auto-isi nominalnya (biar user gak insert duplikat tanpa sadar —
// angSimpan bakal UPDATE row itu, bukan bikin baru, lihat di bawah).
function angAkunSelectChange() {
  const akunId = document.getElementById('ang-edit-akun-select').value;
  const bulan  = document.getElementById('ang-edit-bulan').value || _angBulanAktif;
  const existing = _angAnggaran.find(a => String(a.akun_id) === String(akunId) && a.bulan === bulan);
  document.getElementById('ang-edit-id').value      = existing ? existing.id : '';
  document.getElementById('ang-edit-nominal').value = existing ? Number(existing.nominal).toLocaleString('id-ID') : '';
}

function angFormatNominal(el) {
  const raw = el.value.replace(/\D/g, '');
  if (!raw) { el.value = ''; return; }
  el.value = Number(raw).toLocaleString('id-ID');
}

// ─── SHEET: Pilih Akun (ala BRImo, 7 Sep 2026) ────────────────────────
// Ganti <select> native "Akun Beban" (mode Tambah) — dulu dropdown browser
// biasa (gak ada search, suka overlap di HP kecil kayak di screenshot user).
// Sumber list-nya _angAkunAllBK (udah di-fetch di angLoad, SEMUA akun
// Beban+Kewajiban — sama data yang dulu ngisi <option> select). Milih item
// nge-set value ke <select> tersembunyi + dispatch 'change' biar
// angAkunSelectChange() (auto-isi nominal kalau akun ini udah ada budget
// bulan ini) tetep jalan tanpa ditulis ulang.
function angAkunPickerOpen() {
  const searchEl = document.getElementById('ang-akun-sheet-search');
  if (searchEl) searchEl.value = '';
  angAkunPickerRender('');
  document.getElementById('ang-akun-sheet-overlay').classList.add('open');
  document.getElementById('ang-akun-sheet').classList.add('open');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (searchEl && !isIOS) setTimeout(() => searchEl.focus(), 260);
}

function angAkunPickerClose() {
  document.getElementById('ang-akun-sheet-overlay').classList.remove('open');
  document.getElementById('ang-akun-sheet').classList.remove('open');
}

function angAkunPickerFilter(q) { angAkunPickerRender(q); }

// Sheet "Pilih Akun Beban" — 7 Sep 2026 ditambah 2 hal:
//  1) Dikelompokkan per sub_kelompok (judul bold uppercase, reuse
//     .kas-akun-group yang udah dipakai app-wide di picker Kas & Jurnal),
//     biar gampang nyari (misal semua "Hutang Jangka Panjang" nempel).
//     _angAkunAllBK udah ke-order by kode.asc dari angLoad(), dan kode akun
//     per sub_kelompok emang kontigu (2-001..2-006 Kewajiban, 5-001..
//     5-0xx Beban Operasional dst) — jadi cukup deteksi PERUBAHAN label
//     dibanding item sebelumnya buat nyisipin divider, gak perlu sort ulang.
//  2) Kalau akun itu UDAH punya kas_anggaran di bulan aktif (_angAnggaran),
//     kasih badge nominalnya di kanan — biar user gak nge-set anggaran
//     dobel ke akun yang sama tanpa sadar (angSimpan sebenarnya udah aman
//     dari duplikat row karena angAkunSelectChange auto-UPDATE row existing,
//     tapi user tetep butuh cara TAU dari awal sebelum milih).
function angAkunPickerRender(q) {
  const listEl = document.getElementById('ang-akun-sheet-list');
  if (!listEl) return;
  q = (q || '').toLowerCase().trim();
  const currentVal = document.getElementById('ang-edit-akun-select').value;
  const angMap = {};
  (_angAnggaran || []).forEach(a => { angMap[String(a.akun_id)] = a; });

  const akunList = (_angAkunAllBK || []).filter(a => {
    if (!q) return true;
    return ((a.kode ? a.kode + ' ' : '') + (a.nama||'')).toLowerCase().indexOf(q) !== -1;
  });
  if (!akunList.length) {
    listEl.innerHTML = '<div class="kas-akun-empty">Tidak ditemukan</div>';
    return;
  }
  let html = '', lastGroup = null;
  akunList.forEach(a => {
    const groupLabel = a.sub_kelompok || a.kelompok || '—';
    if (groupLabel !== lastGroup) {
      html += `<div class="kas-akun-group">${groupLabel}</div>`;
      lastGroup = groupLabel;
    }
    const label = (a.nama||'—') + ' (' + (a.kode||'—') + ')';
    const labelSafe = label.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const isActive = String(a.id) === String(currentVal);
    const existing = angMap[String(a.id)];
    const badge = existing
      ? `<span style="font-size:10px;font-weight:700;color:var(--ok);white-space:nowrap;flex-shrink:0">✓ ${angFmt(Number(existing.nominal)||0)}</span>`
      : '';
    html += `<div class="kas-akun-item${isActive?' active':''}" data-val="${a.id}" onclick="angAkunPickerSelectItem(this)">
      <span class="kas-akun-nama">${labelSafe}</span>${badge}</div>`;
  });
  listEl.innerHTML = html;
}

function angAkunPickerSelectItem(item) {
  const val = item.dataset.val;
  const sel = document.getElementById('ang-edit-akun-select');
  sel.value = val;
  sel.dispatchEvent(new Event('change'));
  const lbl = document.getElementById('ang-akun-picker-label');
  const namaEl = item.querySelector('.kas-akun-nama');
  lbl.textContent = namaEl ? namaEl.textContent : item.textContent.trim();
  lbl.style.color = '';
  angAkunPickerClose();
}

function angCloseModal() {
  document.getElementById('modal-anggaran').classList.remove('open');
  angAkunPickerClose();
}

function angOverlayClose(e) {
  if (e.target.id === 'modal-anggaran') angCloseModal();
}

// ─── SIMPAN ───────────────────────────────────────────────────
async function angSimpan() {
  let angId  = document.getElementById('ang-edit-id').value.trim();
  // Mode Tambah (angShowAddNew, div nama disembunyikan) → akunId dari select
  // (skrg cuma value-holder buat sheet BRImo). Mode Edit (dari baris tabel,
  // div nama kelihatan) → akunId dari hidden input lama. Dulu dicek dari
  // display select-nya sendiri, tapi select sekarang SELALU hidden (jadi
  // trigger + sheet), jadi mode-nya dicek dari div nama ini gantinya.
  const isAddMode = document.getElementById('ang-edit-nama').style.display === 'none';
  const selEl  = document.getElementById('ang-edit-akun-select');
  const akunId = isAddMode ? selEl.value : document.getElementById('ang-edit-akun-id').value;
  const bulan  = document.getElementById('ang-edit-bulan').value;
  const nomStr = document.getElementById('ang-edit-nominal').value.replace(/\D/g,'');
  const nominal = parseInt(nomStr, 10);

  if (!akunId)            { alert('Pilih akun dulu.'); return; }
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

// ─── AUTO-CARRY-FORWARD BULAN BARU ─────────────────────────────
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

// ─── HIDE-ON-SCROLL minicard (HP doang) ─────────────────────────────────
// Pola SAMA persis kayak _kasScrollCollapseInit di kas.js — direplikasi di
// sini (bukan dipanggil ulang dari kas.js) karena scope-nya beda container
// (.content di sini, panel spesifik di sana) & CSS class-nya juga beda
// (ang-metrics-collapsed vs kas-topbar-collapsed, biar independen/gak
// nyenggol elemen kas.js). CUMA aktif kalau lebar viewport <=900px — dicek
// tiap event scroll (bukan sekali di init) biar tetep bener kalau device
// di-rotate landscape/portrait tanpa reload halaman.
(function() {
  function _angScrollCollapseInit() {
    const content = document.querySelector('.content');
    const wrap    = document.getElementById('ang-metrics-wrap');
    if (!content || !wrap || content._angCollapseInited) return;
    content._angCollapseInited = true;
    let _lastY = 0;
    content.addEventListener('scroll', function() {
      if (!window.matchMedia('(max-width:900px)').matches) return; // desktop/laptop: skip, minicard tetep nampil
      if (document.body.dataset.page !== 'anggaran') return;
      const y = content.scrollTop;
      if (y > 40 && y > _lastY) {
        wrap.classList.add('ang-metrics-collapsed');
      } else if (y < _lastY || y <= 40) {
        wrap.classList.remove('ang-metrics-collapsed');
      }
      _lastY = y;
    }, { passive: true });
  }
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'anggaran') return;
    setTimeout(function() {
      const wrap = document.getElementById('ang-metrics-wrap');
      if (wrap) wrap.classList.remove('ang-metrics-collapsed');
      _angScrollCollapseInit();
    }, 80);
  });
})();

