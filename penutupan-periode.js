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

// ─── DEFINISI BARIS KRITERIA UNTUK TABEL PERBANDINGAN ────────
var _ppKriteriaDefs = [
  { key: 'net_worth',        label: 'Net Worth',      valStyle: true,  big: true },
  { key: 'total_kas',        label: 'Kas & Bank' },
  { key: 'nilai_stok',       label: 'Stok' },
  { key: 'escrow_shopee',    label: 'Escrow Shopee' },
  { key: 'total_kewajiban',  label: 'Hutang',          color: 'var(--danger)' },
  { key: 'total_pendapatan', label: 'Pendapatan',      color: 'var(--ok)' },
  { key: 'total_beban',      label: 'Beban',           color: 'var(--danger)' },
  { key: 'laba_rugi',        label: 'Laba / Rugi',     valStyle: true },
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
  if (pg && pg.classList.contains('active')) _ppEnsureLayout();
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

// ─── FETCH DATA UNTUK SATU PERIODE ───────────────────────────
async function _ppFetchData(ym) {
  try {
    var parts   = ym.split('-');
    var lastDay = new Date(parseInt(parts[0]), parseInt(parts[1]), 0).getDate();
    var ymStart = ym + '-01';
    var ymEnd   = ym + '-' + String(lastDay).padStart(2, '0');

    var [kasAkun, allJurnal, jurnalBulan, produk, stok, jual, hutang, bayar, shopeeRaw] = await Promise.all([
      dbGet('kas_akun', '').catch(function() { return []; }),
      dbGet('jurnal', '').catch(function() { return []; }),
      dbGet('jurnal', '&tanggal=gte.' + ymStart + '&tanggal=lte.' + ymEnd).catch(function() { return []; }),
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

    // P&L bulan ini saja (filter by periode)
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
      periode:          ym,
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
    console.error('[PP] _ppFetchData error', e);
    return null;
  }
}

// ─── RENDER TABEL PERBANDINGAN (Kriteria x 4 kolom bulan) ────
// cols = [{ periode, label, badge:'snap'|'live'|null, data:{...}|null }, ...] urut lama → baru
function _ppRenderCompareTable(cols) {
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
    var tds = cols.map(function(c) {
      if (!c.data) return '<td style="color:var(--ink4)">—</td>';
      var raw = c.data[def.key];
      var n   = Number(raw || 0);
      var txt = def.valStyle ? _ppFmtVal(n) : _ppFmt(n);
      var color = def.valStyle ? _ppColor(n) : (def.color || 'var(--ink)');
      var sizeStyle = def.big ? ' font-size:15px;' : '';
      return '<td style="color:' + color + ';' + sizeStyle + '">' + txt + '</td>';
    }).join('');
    return '<tr><td>' + def.label + '</td>' + tds + '</tr>';
  }).join('');
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
      var dataLalu = await _ppFetchData(ymLalu);
      if (dataLalu) {
        await dbInsert('penutupan_periode', {
          periode:          dataLalu.periode,
          tanggal_tutup:    now.toISOString().split('T')[0],
          total_pendapatan: dataLalu.total_pendapatan,
          total_beban:      dataLalu.total_beban,
          laba_rugi:        dataLalu.laba_rugi,
          total_aset:       0,
          total_kewajiban:  dataLalu.total_kewajiban,
          total_modal:      0,
          total_kas:        dataLalu.total_kas,
          nilai_stok:       dataLalu.nilai_stok,
          escrow_shopee:    dataLalu.escrow_shopee,
          net_worth:        dataLalu.net_worth,
          catatan:          null,
        });
        dataLalu.tanggal_tutup = now.toISOString().split('T')[0];
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
    var tiga = _ppHistoriCache.slice(0, 3); // terbaru dulu (desc)
    var tigaAsc = tiga.slice().reverse();   // urut lama → baru
    var cols = tigaAsc.map(function(r) {
      return { periode: r.periode, label: _ppPeriodeLabel(r.periode), badge: 'snap', data: r };
    });
    while (cols.length < 3) {
      cols.unshift({ periode: null, label: '—', badge: null, data: null });
    }
    cols.push({ periode: ymSkrg, label: _ppPeriodeLabel(ymSkrg), badge: 'live', data: liveData });

    _ppRenderCompareTable(cols);

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

// ─── AUTO-SNAPSHOT: 3 detik setelah app load ─────────────────
setTimeout(function() {
  if (typeof dbGet !== 'function') return;
  var now = new Date();
  var dLalu = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var ymLalu = dLalu.getFullYear() + '-' + String(dLalu.getMonth() + 1).padStart(2, '0');
  dbGet('penutupan_periode', '&periode=eq.' + ymLalu).then(function(rows) {
    if (!rows || rows.length === 0) {
      // Snapshot belum ada — akan dibuat saat halaman dibuka pertama kali
      console.log('[PP] Auto-snapshot bulan lalu akan dibuat saat halaman dibuka.');
    }
  }).catch(function() {});
}, 3000);
