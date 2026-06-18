// ─── PENUTUPAN-PERIODE.JS — Laporan Bulanan ──────────────────
// Layout: 2 kolom — Bulan Lalu (snapshot) | Bulan Berjalan (live)
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

  /* ── 2 kolom utama ── */
  .pp-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }
  @media (max-width: 640px) {
    .pp-cols { grid-template-columns: 1fr; }
  }

  /* ── Header kolom ── */
  .pp-col-header {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: var(--ink3);
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--ink4);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .pp-col-header .pp-col-bulan {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    text-transform: none;
    letter-spacing: 0;
  }

  /* ── Net Worth besar di tiap kolom ── */
  .pp-nw-big {
    font-size: 26px;
    font-weight: 700;
    font-family: var(--f2);
    line-height: 1;
    margin: 6px 0 0;
  }
  .pp-nw-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--ink3);
    text-transform: uppercase;
    letter-spacing: .06em;
  }
  .pp-nw-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 2px;
  }
  .pp-nw-delta {
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
  }

  /* ── Baris metrik ── */
  .pp-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 7px 0;
    border-bottom: 1px solid var(--ink4);
    gap: 8px;
  }
  .pp-row:last-child { border-bottom: none; }
  .pp-row-label {
    font-size: 12px;
    color: var(--ink3);
    flex-shrink: 0;
  }
  .pp-row-val {
    font-size: 13px;
    font-weight: 700;
    font-family: var(--f2);
    text-align: right;
  }
  .pp-row-delta {
    font-size: 11px;
    font-weight: 700;
    text-align: right;
    min-width: 60px;
  }

  /* ── Divider label dalam kolom ── */
  .pp-divider {
    font-size: 10px;
    font-weight: 700;
    color: var(--ink3);
    text-transform: uppercase;
    letter-spacing: .06em;
    margin: 10px 0 4px;
  }

  /* ── Histori ── */
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

  /* ── Badge live ── */
  .pp-live-badge {
    font-size: 10px;
    font-weight: 700;
    background: rgba(76,175,80,0.15);
    color: var(--ok);
    padding: 2px 7px;
    border-radius: 99px;
    letter-spacing: .04em;
  }
  .pp-snap-badge {
    font-size: 10px;
    font-weight: 700;
    background: rgba(255,255,255,0.07);
    color: var(--ink3);
    padding: 2px 7px;
    border-radius: 99px;
  }

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
    <button class="btn btn-sm" onclick="ppPerbarui()" id="pp-btn-perbarui" style="display:none">
      <i class="ti ti-refresh"></i> Perbarui
    </button>
  </div>
  <div id="pp-status" style="font-size:12px;color:var(--ink3);margin-top:6px"></div>
</div>

<!-- ── 2 Kolom: Bulan Lalu | Bulan Berjalan ── -->
<div class="pp-cols">

  <!-- KIRI: Bulan Lalu (snapshot) -->
  <div class="card pp-section" id="pp-col-lalu">
    <div class="pp-col-header">
      <span>Bulan Lalu</span>
      <span class="pp-snap-badge" id="pp-lalu-badge">snapshot</span>
    </div>
    <div class="pp-col-bulan" id="pp-lalu-label">—</div>
    <div class="pp-nw-label" style="margin-top:10px">Net Worth</div>
    <div class="pp-nw-row">
      <div class="pp-nw-big" id="pp-lalu-nw">—</div>
      <div class="pp-nw-delta" id="pp-lalu-delta"></div>
    </div>

    <div class="pp-divider" style="margin-top:14px">Posisi Keuangan</div>
    <div class="pp-row"><span class="pp-row-label">Kas &amp; Bank</span><span class="pp-row-val" id="pp-lalu-kas">—</span></div>
    <div class="pp-row"><span class="pp-row-label">Stok</span><span class="pp-row-val" id="pp-lalu-stok">—</span></div>
    <div class="pp-row"><span class="pp-row-label">Escrow Shopee</span><span class="pp-row-val" id="pp-lalu-escrow">—</span></div>
    <div class="pp-row"><span class="pp-row-label">Hutang</span><span class="pp-row-val" id="pp-lalu-hutang" style="color:var(--danger)">—</span></div>

    <div class="pp-divider">Kinerja Bulan</div>
    <div class="pp-row"><span class="pp-row-label">Pendapatan</span><span class="pp-row-val" id="pp-lalu-pend" style="color:var(--ok)">—</span></div>
    <div class="pp-row"><span class="pp-row-label">Beban</span><span class="pp-row-val" id="pp-lalu-beban" style="color:var(--danger)">—</span></div>
    <div class="pp-row"><span class="pp-row-label">Laba / Rugi</span><span class="pp-row-val" id="pp-lalu-lb">—</span></div>

    <div id="pp-lalu-meta" style="font-size:11px;color:var(--ink3);margin-top:8px;text-align:right"></div>
  </div>

  <!-- KANAN: Bulan Berjalan (live) -->
  <div class="card pp-section" id="pp-col-skrg">
    <div class="pp-col-header">
      <span>Bulan Berjalan</span>
      <span class="pp-live-badge">● LIVE</span>
    </div>
    <div class="pp-col-bulan" id="pp-skrg-label">—</div>
    <div class="pp-nw-label" style="margin-top:10px">Net Worth</div>
    <div class="pp-nw-row">
      <div class="pp-nw-big" id="pp-skrg-nw">—</div>
      <div class="pp-nw-delta" id="pp-skrg-delta"></div>
    </div>

    <div class="pp-divider" style="margin-top:14px">Posisi Keuangan</div>
    <div class="pp-row">
      <span class="pp-row-label">Kas &amp; Bank</span>
      <div style="text-align:right">
        <div class="pp-row-val" id="pp-skrg-kas">—</div>
        <div class="pp-row-delta" id="pp-skrg-kas-d"></div>
      </div>
    </div>
    <div class="pp-row">
      <span class="pp-row-label">Stok</span>
      <div style="text-align:right">
        <div class="pp-row-val" id="pp-skrg-stok">—</div>
        <div class="pp-row-delta" id="pp-skrg-stok-d"></div>
      </div>
    </div>
    <div class="pp-row">
      <span class="pp-row-label">Escrow Shopee</span>
      <div style="text-align:right">
        <div class="pp-row-val" id="pp-skrg-escrow">—</div>
        <div class="pp-row-delta" id="pp-skrg-escrow-d"></div>
      </div>
    </div>
    <div class="pp-row">
      <span class="pp-row-label">Hutang</span>
      <div style="text-align:right">
        <div class="pp-row-val" id="pp-skrg-hutang" style="color:var(--danger)">—</div>
        <div class="pp-row-delta" id="pp-skrg-hutang-d"></div>
      </div>
    </div>

    <div class="pp-divider">Kinerja Bulan</div>
    <div class="pp-row">
      <span class="pp-row-label">Pendapatan</span>
      <div style="text-align:right">
        <div class="pp-row-val" id="pp-skrg-pend" style="color:var(--ok)">—</div>
        <div class="pp-row-delta" id="pp-skrg-pend-d"></div>
      </div>
    </div>
    <div class="pp-row">
      <span class="pp-row-label">Beban</span>
      <div style="text-align:right">
        <div class="pp-row-val" id="pp-skrg-beban" style="color:var(--danger)">—</div>
        <div class="pp-row-delta" id="pp-skrg-beban-d"></div>
      </div>
    </div>
    <div class="pp-row">
      <span class="pp-row-label">Laba / Rugi</span>
      <div style="text-align:right">
        <div class="pp-row-val" id="pp-skrg-lb">—</div>
        <div class="pp-row-delta" id="pp-skrg-lb-d"></div>
      </div>
    </div>
  </div>

</div><!-- /pp-cols -->

<!-- ── Riwayat Bulanan ── -->
<div class="card pp-section">
  <div class="card-title"><i class="ti ti-history"></i> Riwayat Bulanan</div>
  <div id="pp-histori-body"><div class="pp-empty">Memuat...</div></div>
</div>

</div><!-- /pp-scroll-zone -->
`;

setTimeout(function() { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-penutupan-periode')); }, 80);

// ─── STATE ────────────────────────────────────────────────────
var _ppHistoriCache = [];

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

function _ppDeltaHtml(curr, prev) {
  if (prev === null || prev === undefined) return '';
  var d = Number(curr) - Number(prev);
  var sign = d >= 0 ? '+' : '';
  return '<span style="color:' + (d >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' + sign + _ppFmt(d) + '</span>';
}

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

function _ppSet(id, val, color) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = val;
  if (color) el.style.color = color;
}

function _ppSetHtml(id, html) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = html;
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

// ─── RENDER KOLOM KIRI (Bulan Lalu / snapshot) ───────────────
function _ppRenderLalu(snap, prevSnap) {
  var nw = Number(snap.net_worth || 0);
  var lb = Number(snap.laba_rugi || 0);

  _ppSet('pp-lalu-label', _ppPeriodeLabel(snap.periode));
  _ppSet('pp-lalu-nw', _ppFmtVal(nw), _ppColor(nw));

  // Delta NW vs snapshot 2 bulan lalu
  if (prevSnap) {
    var d = nw - Number(prevSnap.net_worth || 0);
    _ppSetHtml('pp-lalu-delta', _ppDeltaHtml(nw, prevSnap.net_worth) + ' vs ' + _ppPeriodeLabel(prevSnap.periode));
  } else {
    _ppSet('pp-lalu-delta', '');
  }

  _ppSet('pp-lalu-kas',    _ppFmt(snap.total_kas));
  _ppSet('pp-lalu-stok',   _ppFmt(snap.nilai_stok));
  _ppSet('pp-lalu-escrow', _ppFmt(snap.escrow_shopee));
  _ppSet('pp-lalu-hutang', _ppFmt(snap.total_kewajiban));
  _ppSet('pp-lalu-pend',   _ppFmt(snap.total_pendapatan));
  _ppSet('pp-lalu-beban',  _ppFmt(snap.total_beban));
  _ppSet('pp-lalu-lb',     _ppFmtVal(lb), _ppColor(lb));

  var metaEl = document.getElementById('pp-lalu-meta');
  if (metaEl && snap.tanggal_tutup) {
    metaEl.textContent = 'Snapshot ' + new Date(snap.tanggal_tutup).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
  }

  // Tampilkan tombol perbarui
  var btn = document.getElementById('pp-btn-perbarui');
  if (btn) btn.style.display = '';
}

// ─── RENDER KOLOM KANAN (Bulan Berjalan / live) ──────────────
function _ppRenderSkrg(live, snapLalu) {
  var nw = Number(live.net_worth || 0);
  var lb = Number(live.laba_rugi || 0);

  _ppSet('pp-skrg-label', _ppPeriodeLabel(live.periode));
  _ppSet('pp-skrg-nw', _ppFmtVal(nw), _ppColor(nw));

  // Delta NW vs bulan lalu
  if (snapLalu) {
    _ppSetHtml('pp-skrg-delta', _ppDeltaHtml(nw, snapLalu.net_worth) + ' vs ' + _ppPeriodeLabel(snapLalu.periode));
  } else {
    _ppSet('pp-skrg-delta', '');
  }

  // Posisi keuangan + delta vs bulan lalu
  var fields = [
    ['kas',    live.total_kas,        snapLalu && snapLalu.total_kas],
    ['stok',   live.nilai_stok,       snapLalu && snapLalu.nilai_stok],
    ['escrow', live.escrow_shopee,    snapLalu && snapLalu.escrow_shopee],
    ['hutang', live.total_kewajiban,  snapLalu && snapLalu.total_kewajiban],
    ['pend',   live.total_pendapatan, null],
    ['beban',  live.total_beban,      null],
    ['lb',     live.laba_rugi,        null],
  ];

  fields.forEach(function(f) {
    var key = f[0], val = f[1], prev = f[2];
    var n = Number(val);
    var isNeg = key === 'hutang' || key === 'beban';
    _ppSet('pp-skrg-' + key, (key === 'lb' || key === 'hutang') ? _ppFmtVal(n) : _ppFmt(n),
      key === 'lb' ? _ppColor(n) : undefined);
    if (prev !== null && prev !== undefined && prev !== false) {
      _ppSetHtml('pp-skrg-' + key + '-d', _ppDeltaHtml(val, prev));
    } else {
      _ppSet('pp-skrg-' + key + '-d', '');
    }
  });
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
  var dDuaLalu = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  var ymDuaLalu = dDuaLalu.getFullYear() + '-' + String(dDuaLalu.getMonth() + 1).padStart(2, '0');

  try {
    // Ambil snapshot tersimpan + data live bulan ini secara paralel
    var [snapRows, liveData] = await Promise.all([
      dbGet('penutupan_periode', '&order=periode.desc').catch(function() { return []; }),
      _ppFetchData(ymSkrg),
    ]);

    _ppHistoriCache = snapRows || [];
    var snapMap = {};
    (snapRows || []).forEach(function(r) { snapMap[r.periode] = r; });

    var snapLalu    = snapMap[ymLalu];
    var snapDuaLalu = snapMap[ymDuaLalu];

    // Kolom kiri — bulan lalu
    if (snapLalu) {
      _ppRenderLalu(snapLalu, snapDuaLalu || null);
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--ok)">✓ Snapshot ' + _ppPeriodeLabel(ymLalu) + ' tersimpan</span>';
    } else {
      // Belum ada snapshot bulan lalu — ambil live dan simpan otomatis
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
        _ppRenderLalu(dataLalu, null);
        snapLalu = dataLalu;
        _ppToast('📸 Snapshot ' + _ppPeriodeLabel(ymLalu) + ' otomatis tersimpan');
        if (statusEl) statusEl.innerHTML = '<span style="color:var(--ok)">✓ Snapshot ' + _ppPeriodeLabel(ymLalu) + ' tersimpan</span>';
        // Reload histori
        var newSnaps = await dbGet('penutupan_periode', '&order=periode.desc').catch(function() { return []; });
        _ppHistoriCache = newSnaps || [];
      }
    }

    // Kolom kanan — bulan berjalan live
    if (liveData) _ppRenderSkrg(liveData, snapLalu || null);

    ppLoadHistori();

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
    ppLoadHistori();
  } catch(e) {
    _ppToast('❌ Gagal: ' + e.message, 4000);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-refresh"></i> Perbarui'; }
  }
}

// ─── LOAD HISTORI ────────────────────────────────────────────
async function ppLoadHistori() {
  var bodyEl = document.getElementById('pp-histori-body');
  if (!bodyEl) return;

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
  if (e.detail.page !== 'penutupan-periode') return;
  setTimeout(_ppEnsureLayout, 60);
  ppLoadUtama();
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
