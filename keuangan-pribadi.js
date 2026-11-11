// ─── KEUANGAN PRIBADI (5 Nov 2026) ─────────────────────────────────
// Buku PRIBADI dari pemisahan uang pribadi & usaha (lihat zenoot-pisah-pribadi-usaha.sql).
// Sumber data: jurnal + kas_akun yang sama dengan buku usaha — baris/akun bertanda entitas = 'pribadi'. Halaman ini READ-ONLY; mencatat
// transaksi tetap lewat Kas & Jurnal (buku Pribadi). Arus antar buku (Prive / Modal Disetor) dibaca dari akun berperan khusus (kas_akun.peran),
// bukan dari nama akun.

document.getElementById('page-keuangan-pribadi').innerHTML = `
  <style>
    #page-keuangan-pribadi .kp-bar { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:12px; }
    #page-keuangan-pribadi .kp-bar input[type=month] { font-family:var(--f); font-size:14px; padding:6px 10px; border:2px solid var(--ink); background:var(--cream); color:var(--ink); }
    #page-keuangan-pribadi .kp-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:12px; }
    @media (max-width:900px) { #page-keuangan-pribadi .kp-grid { grid-template-columns:repeat(2,1fr); } }
    #page-keuangan-pribadi .kp-cols { display:grid; grid-template-columns:1.4fr 1fr; gap:12px; align-items:start; }
    @media (max-width:900px) { #page-keuangan-pribadi .kp-cols { grid-template-columns:1fr; } }
    #page-keuangan-pribadi .kp-note { margin-bottom:10px; padding:10px 14px; background:var(--cream2); border:2px dashed var(--ink3); font-size:13px; color:var(--ink2); line-height:1.7; }
    #page-keuangan-pribadi .kp-warn { color:var(--danger); font-weight:700; }
    #page-keuangan-pribadi .kp-bar-wrap { height:6px; background:var(--cream3); border-radius:3px; overflow:hidden; margin-top:4px; }
    #page-keuangan-pribadi .kp-bar-fill { height:100%; background:var(--ok); }
    #page-keuangan-pribadi td.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  </style>
  <div class="kp-note">
    <b>Buku Pribadi</b> — uang pribadi kamu, terpisah dari usaha. Uang yang diambil dari usaha tercatat sebagai <b>Prive</b> di buku usaha
    dan sebagai pemasukan (Ekuitas Pribadi) di sini. Catat transaksi pribadi lewat <b>Kas &amp; Jurnal</b> (buku Pribadi).<br>
    <b>Saldo Kas Pribadi</b> = uang pribadi yang benar-benar kamu pegang. Supaya akurat: <b>Ambil Prive</b> ke Kas Pribadi, lalu bayar pengeluaran pribadi dari Kas Pribadi. Uang yang sudah ada sebelumnya dicatat sekali sebagai <b>Uang Masuk</b> buku Pribadi, Kredit <b>Saldo Awal Pribadi</b>.
  </div>
  <div class="kp-bar">
    <label style="font-size:12px;font-weight:700;color:var(--ink3)">BULAN</label>
    <input type="month" id="kp-bulan" onchange="kpLoad()">
    <button class="btn btn-sm" onclick="kpLoad()" title="Refresh"><i class="ti ti-refresh"></i></button>
    <button class="btn btn-sm" onclick="kpAmbilPrive()" style="margin-left:auto" title="Pindahkan uang dari Kas Usaha ke Kas Pribadi"><i class="ti ti-user-dollar"></i> Ambil Prive</button>
    <button class="btn btn-sm btn-primary" onclick="kpCatat()"><i class="ti ti-plus"></i> Catat transaksi pribadi</button>
  </div>
  <div id="kp-pesan"></div>
  <div class="kp-grid">
    <div class="metric"><div class="m-label">Saldo Kas Pribadi</div><div class="m-value" id="kp-kas">—</div><div class="m-delta">kas &amp; bank pribadi</div></div>
    <div class="metric"><div class="m-label">Net Worth Pribadi</div><div class="m-value" id="kp-nw">—</div><div class="m-delta">aset − kewajiban pribadi</div></div>
    <div class="metric"><div class="m-label">Pengeluaran Bulan Ini</div><div class="m-value" id="kp-keluar">—</div><div class="m-delta" id="kp-keluar-sub">semua akun beban pribadi</div></div>
    <div class="metric"><div class="m-label">Dari Usaha (Prive)</div><div class="m-value" id="kp-prive">—</div><div class="m-delta" id="kp-prive-sub">diambil dari usaha bulan ini</div></div>
  </div>
  <div class="kp-cols">
    <div class="card">
      <div class="card-title"><i class="ti ti-receipt-2"></i> Pengeluaran per Akun</div>
      <table class="tbl">
        <thead><tr><th>Akun</th><th style="text-align:right">Realisasi</th><th style="text-align:right">Anggaran</th></tr></thead>
        <tbody id="kp-beban-tbody"><tr><td colspan="3" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table>
    </div>
    <div>
      <div class="card" style="margin-bottom:12px">
        <div class="card-title"><i class="ti ti-wallet"></i> Kas &amp; Rekening Pribadi</div>
        <table class="tbl"><tbody id="kp-aset-tbody"><tr><td style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody></table>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-credit-card"></i> Kewajiban Pribadi</div>
        <table class="tbl"><tbody id="kp-kwj-tbody"><tr><td style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody></table>
      </div>
    </div>
  </div>
`;

function _kpRp(n) { n = Math.round(Number(n) || 0); return (n < 0 ? '-' : '') + 'Rp' + Math.abs(n).toLocaleString('id-ID'); }
function _kpEsc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Hitung seluruh angka halaman (fungsi murni → mudah diuji).
//   akun: kas_akun[] (kedua buku), jurnal: jurnal[] (kedua buku), anggaran: kas_anggaran[] bulan terpilih, ym: 'YYYY-MM'
function kpHitung(akun, jurnal, anggaran, ym) {
  var akunMap = {};
  (akun || []).forEach(function(a) { akunMap[a.id] = a; });
  var sal = {};   // saldo per akun pribadi: { d, k, real (beban bulan ini) }
  var priveBulan = 0, modalBulan = 0;
  (jurnal || []).forEach(function(r) {
    var n = Number(r.nominal || r.debit || 0);
    var aD = akunMap[r.akun_debit_id], aK = akunMap[r.akun_kredit_id];
    var bulan = String(r.tanggal || '').slice(0, 7) === ym;
    // buku usaha: arus Prive / Modal Disetor (akun berperan khusus)
    if (aD && aD.peran === 'prive' && bulan) priveBulan += n;
    if (aK && aK.peran === 'modal_disetor' && bulan) modalBulan += n;
    // buku pribadi
    if (aD && aD.entitas === 'pribadi') { var x = sal[aD.id] || (sal[aD.id] = { d: 0, k: 0, real: 0 }); x.d += n; if (bulan && aD.kelompok === 'beban') x.real += n; }
    if (aK && aK.entitas === 'pribadi') { var y = sal[aK.id] || (sal[aK.id] = { d: 0, k: 0, real: 0 }); y.k += n; }
  });
  var ang = {};
  (anggaran || []).forEach(function(a) { ang[a.akun_id] = (ang[a.akun_id] || 0) + (Number(a.nominal) || 0); });

  var out = { aset: [], kwj: [], beban: [], kas: 0, asetTotal: 0, kwjTotal: 0, keluar: 0, anggaranTotal: 0, prive: priveBulan, modal: modalBulan };
  (akun || []).forEach(function(a) {
    if (a.entitas !== 'pribadi' || a.peran) return;   // akun khusus (Ekuitas Pribadi) bukan rekening / beban
    var s = sal[a.id] || { d: 0, k: 0, real: 0 };
    if (a.kelompok === 'aset') {
      var saldo = s.d - s.k;
      out.aset.push({ nama: a.nama, kode: a.kode, saldo: saldo });
      out.asetTotal += Math.max(0, saldo);
      if (String(a.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK') out.kas += Math.max(0, saldo);
    } else if (a.kelompok === 'kewajiban') {
      var sk = s.k - s.d;
      out.kwj.push({ nama: a.nama, kode: a.kode, saldo: sk });
      out.kwjTotal += Math.max(0, sk);
    } else if (a.kelompok === 'beban') {
      out.beban.push({ nama: a.nama, kode: a.kode, real: s.real, anggaran: ang[a.id] || 0 });
      out.keluar += s.real;
      out.anggaranTotal += ang[a.id] || 0;
    }
  });
  out.netWorth = out.asetTotal - out.kwjTotal;
  return out;
}

async function kpLoad() {
  var elB = document.getElementById('kp-bulan');
  if (elB && !elB.value) { var now = new Date(); elB.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'); }
  var ym = elB ? elB.value : '';
  try {
    var res = await Promise.all([
      dbGet('kas_akun', '&order=kode.asc'),
      dbGet('jurnal', '&order=tanggal.asc'),
      dbGet('kas_anggaran', '&bulan=eq.' + ym).catch(function() { return []; })
    ]);
    var akun = res[0] || [], jurnal = res[1] || [], anggaran = res[2] || [];
    var pesan = document.getElementById('kp-pesan');
    if (akun.length && akun[0].entitas === undefined) {
      if (pesan) pesan.innerHTML = '<div class="kp-note kp-warn">Kolom buku (entitas) belum ada di database — jalankan zenoot-pisah-pribadi-usaha.sql di Supabase dulu.</div>';
      return;
    }
    var jumlahPribadi = akun.filter(function(a) { return a.entitas === 'pribadi' && !a.peran; }).length;
    if (pesan) pesan.innerHTML = jumlahPribadi ? '' : '<div class="kp-note">Belum ada akun pribadi. Buka <b>Kas &amp; Jurnal › Kelola Akun</b>, tambah akun dengan Buku = <b>Pribadi</b> (mis. Kas Pribadi, Tabungan, dan akun pengeluaran pribadi).</div>';
    kpRender(kpHitung(akun, jurnal, anggaran, ym));
  } catch (e) {
    var p = document.getElementById('kp-pesan');
    if (p) p.innerHTML = '<div class="kp-note kp-warn">Gagal memuat: ' + _kpEsc(e.message) + '</div>';
  }
}

function kpRender(d) {
  var set = function(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; };
  set('kp-kas', _kpRp(d.kas));
  set('kp-nw', _kpRp(d.netWorth));
  var nwEl = document.getElementById('kp-nw'); if (nwEl) nwEl.style.color = d.netWorth >= 0 ? 'var(--ok)' : 'var(--danger)';
  set('kp-keluar', _kpRp(d.keluar));
  set('kp-keluar-sub', d.anggaranTotal > 0 ? 'anggaran ' + _kpRp(d.anggaranTotal) : 'semua akun beban pribadi');
  set('kp-prive', _kpRp(d.prive));
  set('kp-prive-sub', d.modal > 0 ? 'disetor ke usaha ' + _kpRp(d.modal) : 'diambil dari usaha bulan ini');

  var bb = document.getElementById('kp-beban-tbody');
  if (bb) {
    bb.innerHTML = d.beban.length ? d.beban.map(function(b) {
      var pct = b.anggaran > 0 ? Math.min(b.real / b.anggaran * 100, 100) : 0;
      var lewat = b.anggaran > 0 && b.real > b.anggaran;
      return '<tr><td>' + _kpEsc(b.nama) + (b.anggaran > 0 ? '<div class="kp-bar-wrap"><div class="kp-bar-fill" style="width:' + pct.toFixed(0) + '%;' + (lewat ? 'background:var(--danger)' : '') + '"></div></div>' : '') + '</td>'
        + '<td class="num"' + (lewat ? ' style="color:var(--danger);font-weight:700"' : '') + '>' + _kpRp(b.real) + '</td>'
        + '<td class="num" style="color:var(--ink3)">' + (b.anggaran > 0 ? _kpRp(b.anggaran) : '—') + '</td></tr>';
    }).join('') : '<tr><td colspan="3" style="color:var(--ink3);font-style:italic">Belum ada akun beban pribadi</td></tr>';
  }
  var ab = document.getElementById('kp-aset-tbody');
  if (ab) ab.innerHTML = d.aset.length ? d.aset.map(function(a) {
    return '<tr><td>' + _kpEsc(a.nama) + '</td><td class="num"' + (a.saldo < 0 ? ' style="color:var(--danger)"' : '') + '>' + _kpRp(a.saldo) + '</td></tr>';
  }).join('') : '<tr><td style="color:var(--ink3);font-style:italic">Belum ada akun aset pribadi</td></tr>';
  var kb = document.getElementById('kp-kwj-tbody');
  if (kb) kb.innerHTML = d.kwj.length ? d.kwj.map(function(a) {
    return '<tr><td>' + _kpEsc(a.nama) + '</td><td class="num">' + _kpRp(a.saldo) + '</td></tr>';
  }).join('') : '<tr><td style="color:var(--ink3);font-style:italic">Tidak ada kewajiban pribadi</td></tr>';
}

// Ambil Prive = buka Kas & Jurnal langsung di form transfer Kas Usaha → Kas Pribadi
function kpAmbilPrive() {
  try { localStorage.setItem('kas_buku', 'pribadi'); } catch (e) {}
  if (typeof gotoPage === 'function') gotoPage('kas');
  setTimeout(function() {
    if (typeof kasSetBuku === 'function') kasSetBuku('pribadi');
    if (typeof kasShowForm === 'function') kasShowForm();
    setTimeout(function() { if (typeof kasBrimoSelectTipe === 'function') kasBrimoSelectTipe('prive'); }, 300);
  }, 250);
}

// Mencatat transaksi pribadi = buka Kas & Jurnal dengan buku Pribadi
function kpCatat() {
  try { localStorage.setItem('kas_buku', 'pribadi'); } catch (e) {}
  if (typeof gotoPage === 'function') gotoPage('kas');
  setTimeout(function() { if (typeof kasSetBuku === 'function') kasSetBuku('pribadi'); if (typeof kasShowForm === 'function') kasShowForm(); }, 250);
}

document.addEventListener('zenot:page', function(e) {
  if (e && e.detail && e.detail.page === 'keuangan-pribadi') kpLoad();
});
