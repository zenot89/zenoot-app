// ─── PENUTUPAN-PERIODE.JS — Snapshot Bulanan Bisnis ──────────
// Simpel: setiap bulan, simpan kondisi bisnis (kas, stok, hutang,
// net worth, pendapatan, beban, laba/rugi). Tidak ada jurnal penutup,
// tidak ada lock. Auto-snapshot bulan lalu saat app dibuka.

document.getElementById('page-penutupan-periode').innerHTML = `
<style>
  #pp-scroll-zone {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: none;
    padding: 0 0 40px 0;
  }
  .pp-section { margin-bottom: 14px; }

  /* ── Snapshot hero ── */
  .pp-hero {
    text-align: center;
    padding: 18px 12px 12px;
    border-bottom: 1px solid var(--ink4);
    margin-bottom: 14px;
  }
  .pp-hero-label { font-size: 11px; font-weight: 700; color: var(--ink3); text-transform: uppercase; letter-spacing: .07em; }
  .pp-hero-val   { font-size: 32px; font-weight: 700; font-family: var(--f2); line-height: 1.1; margin: 4px 0 2px; }
  .pp-hero-sub   { font-size: 12px; color: var(--ink3); }
  .pp-hero-delta { font-size: 13px; font-weight: 700; margin-top: 4px; }

  /* ── Kartu metrik ── */
  .pp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 8px;
    margin-bottom: 10px;
  }
  .pp-card {
    padding: 10px 12px;
    background: var(--cream2);
    border: 1.5px solid var(--ink4);
    border-radius: 2px;
  }
  .pp-card-label { font-size: 10px; font-weight: 700; color: var(--ink3); text-transform: uppercase; margin-bottom: 3px; }
  .pp-card-val   { font-size: 16px; font-weight: 700; font-family: var(--f2); }
  .pp-card-sub   { font-size: 11px; color: var(--ink3); margin-top: 2px; }

  /* ── Histori ── */
  .pp-hist-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--ink4);
    gap: 12px;
    cursor: pointer;
  }
  .pp-hist-row:last-child { border-bottom: none; }
  .pp-hist-row:hover { opacity: 0.8; }
  .pp-hist-periode { font-weight: 700; font-size: 13px; }
  .pp-hist-detail  { font-size: 11px; color: var(--ink3); margin-top: 2px; }
  .pp-hist-right   { text-align: right; flex-shrink: 0; }
  .pp-hist-nw      { font-size: 14px; font-weight: 700; }
  .pp-hist-delta   { font-size: 11px; font-weight: 700; margin-top: 2px; }
  .pp-empty { color: var(--ink3); font-style: italic; font-size: 13px; padding: 12px 0; }

  /* ── Status badge ── */
  .pp-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 99px;
    margin-left: 6px;
    vertical-align: middle;
  }
  .pp-badge-ok   { background: rgba(76,175,80,0.15); color: var(--ok); }
  .pp-badge-warn { background: rgba(255,180,0,0.15); color: var(--warn,#ffb400); }

  /* ── Toast notif ── */
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
  }
  #pp-toast.show { transform: translateX(-50%) translateY(0); }
</style>

<div id="pp-toast"></div>
<div id="pp-scroll-zone">

<!-- ── Pilih Periode ── -->
<div class="card pp-section">
  <div class="card-title"><i class="ti ti-calendar-month"></i> Laporan Bulanan</div>
  <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
    <div class="form-group" style="flex:1 1 160px;margin:0">
      <label>Pilih Bulan</label>
      <select id="pp-bulan" style="width:100%" onchange="ppTampilSnapshot()">
        <option value="">Memuat...</option>
      </select>
    </div>
    <button class="btn btn-sm" onclick="ppAmbilSnapshot()" id="pp-btn-ambil" style="flex-shrink:0;display:none">
      <i class="ti ti-refresh"></i> Perbarui Snapshot
    </button>
  </div>
  <div id="pp-periode-status" style="margin-top:8px;font-size:12px;color:var(--ink3)"></div>
</div>

<!-- ── Snapshot kondisi bisnis ── -->
<div class="card pp-section" id="pp-card-snapshot" style="display:none">
  <!-- Hero: Net Worth -->
  <div class="pp-hero">
    <div class="pp-hero-label">Net Worth</div>
    <div class="pp-hero-val" id="pp-snap-nw">—</div>
    <div class="pp-hero-delta" id="pp-snap-nw-delta"></div>
    <div class="pp-hero-sub">Kas + Stok + Escrow − Hutang</div>
  </div>

  <!-- Row 1: Kas, Stok, Escrow, Hutang -->
  <div class="pp-grid">
    <div class="pp-card">
      <div class="pp-card-label">Kas</div>
      <div class="pp-card-val" id="pp-snap-kas">—</div>
      <div class="pp-card-sub">semua rekening</div>
    </div>
    <div class="pp-card">
      <div class="pp-card-label">Stok</div>
      <div class="pp-card-val" id="pp-snap-stok">—</div>
      <div class="pp-card-sub">nilai HPP × qty</div>
    </div>
    <div class="pp-card">
      <div class="pp-card-label">Escrow Shopee</div>
      <div class="pp-card-val" id="pp-snap-escrow">—</div>
      <div class="pp-card-sub">belum cair</div>
    </div>
    <div class="pp-card" style="border-color:var(--danger)">
      <div class="pp-card-label">Hutang</div>
      <div class="pp-card-val" id="pp-snap-hutang" style="color:var(--danger)">—</div>
      <div class="pp-card-sub">sisa belum lunas</div>
    </div>
  </div>

  <!-- Row 2: Pendapatan, Beban, Laba/Rugi -->
  <div style="font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.07em;margin:10px 0 6px">Kinerja Bulan Ini</div>
  <div class="pp-grid">
    <div class="pp-card" style="border-color:var(--ok)">
      <div class="pp-card-label">Pendapatan</div>
      <div class="pp-card-val" id="pp-snap-pend" style="color:var(--ok)">—</div>
      <div class="pp-card-sub">total masuk</div>
    </div>
    <div class="pp-card" style="border-color:var(--danger)">
      <div class="pp-card-label">Beban</div>
      <div class="pp-card-val" id="pp-snap-beban" style="color:var(--danger)">—</div>
      <div class="pp-card-sub">total keluar</div>
    </div>
    <div class="pp-card" id="pp-snap-lb-card">
      <div class="pp-card-label">Laba / Rugi</div>
      <div class="pp-card-val" id="pp-snap-lb">—</div>
      <div class="pp-card-sub">pendapatan − beban</div>
    </div>
  </div>

  <div id="pp-snap-meta" style="font-size:11px;color:var(--ink3);margin-top:6px;text-align:right"></div>
</div>

<!-- ── Histori ── -->
<div class="card pp-section">
  <div class="card-title"><i class="ti ti-history"></i> Riwayat Bulanan</div>
  <div id="pp-histori-body"><div class="pp-empty">Memuat...</div></div>
</div>

</div><!-- /pp-scroll-zone -->
`;

setTimeout(function() { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-penutupan-periode')); }, 80);

// ─── STATE ────────────────────────────────────────────────────
var _ppPeriode   = '';
var _ppHistoriCache = [];  // cache histori untuk delta net worth

// ─── LAYOUT ──────────────────────────────────────────────────
function _ppEnsureLayout() {
  var pg = document.getElementById('page-penutupan-periode');
  if (!pg || !pg.classList.contains('active')) return;
  document.documentElement.style.height = '100%';
  document.body.style.height    = '100%';
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

// ─── LOAD DROPDOWN BULAN ─────────────────────────────────────
// Isi dari tabel penutupan_periode (sudah ada snapshot) PLUS
// bulan-bulan di jurnal yang belum punya snapshot.
async function ppLoadBulanDropdown() {
  var sel = document.getElementById('pp-bulan');
  if (!sel) return;
  sel.innerHTML = '<option value="">Memuat...</option>';

  var [snapRows, jurnalRows] = await Promise.all([
    dbGet('penutupan_periode', '&order=periode.desc').catch(function() { return []; }),
    dbGet('jurnal', '&select=tanggal&order=tanggal.desc').catch(function() { return []; }),
  ]);

  _ppHistoriCache = snapRows || [];

  // Distinct periode dari jurnal
  var seen = {};
  var periodes = [];
  (jurnalRows || []).forEach(function(r) {
    if (!r.tanggal) return;
    var ym = r.tanggal.substring(0, 7);
    if (!seen[ym]) { seen[ym] = true; periodes.push(ym); }
  });
  // Tambahkan periode dari snapshot yang mungkin tidak ada di jurnal lagi
  (snapRows || []).forEach(function(r) {
    if (r.periode && !seen[r.periode]) { seen[r.periode] = true; periodes.push(r.periode); }
  });
  // Sort desc
  periodes.sort(function(a, b) { return b > a ? 1 : -1; });

  if (periodes.length === 0) {
    sel.innerHTML = '<option value="">Tidak ada data</option>';
    return;
  }

  var snapMap = {};
  (snapRows || []).forEach(function(r) { snapMap[r.periode] = r; });

  var bulanNama = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];

  // Default: bulan lalu
  var d = new Date();
  d.setMonth(d.getMonth() - 1);
  var defaultYm = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

  sel.innerHTML = periodes.map(function(ym) {
    var parts  = ym.split('-');
    var label  = bulanNama[parseInt(parts[1]) - 1] + ' ' + parts[0];
    var sudah  = snapMap[ym] ? ' ✓' : '';
    var isDefault = ym === defaultYm;
    return '<option value="' + ym + '"' + (isDefault ? ' selected' : '') + '>' + label + sudah + '</option>';
  }).join('');

  if (!seen[defaultYm]) sel.selectedIndex = 0;

  // Tampilkan snapshot bulan yang terpilih
  ppTampilSnapshot();
}

// ─── TAMPIL SNAPSHOT DARI HISTORI (jika sudah ada) ───────────
async function ppTampilSnapshot() {
  var sel = document.getElementById('pp-bulan');
  if (!sel) return;
  _ppPeriode = sel.value;
  if (!_ppPeriode) return;

  var snapMap = {};
  _ppHistoriCache.forEach(function(r) { snapMap[r.periode] = r; });
  var snap = snapMap[_ppPeriode];

  var statusEl  = document.getElementById('pp-periode-status');
  var btnAmbil  = document.getElementById('pp-btn-ambil');
  var cardSnap  = document.getElementById('pp-card-snapshot');

  // Cek apakah bulan berjalan
  var now = new Date();
  var currentYm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var isCurrent = _ppPeriode >= currentYm;

  if (snap) {
    // Sudah ada snapshot — tampilkan
    _ppRenderSnap(snap);
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--ok)">✓ Snapshot tersimpan ' + new Date(snap.tanggal_tutup).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}) + '</span>';
    if (btnAmbil) btnAmbil.style.display = '';
    if (cardSnap) cardSnap.style.display = '';
  } else if (isCurrent) {
    // Bulan berjalan — ambil live tapi tidak simpan
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--ink3)">Bulan berjalan — data live, tidak disimpan</span>';
    if (btnAmbil) btnAmbil.style.display = 'none';
    if (cardSnap) cardSnap.style.display = '';
    ppAmbilLive();
  } else {
    // Bulan lalu belum ada snapshot
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--warn,#ffb400)">⚠ Belum ada snapshot untuk periode ini</span>';
    if (btnAmbil) btnAmbil.style.display = '';
    if (cardSnap) cardSnap.style.display = 'none';
  }
}

// ─── AMBIL DATA LIVE (untuk bulan berjalan / preview) ────────
async function ppAmbilLive() {
  var data = await _ppFetchData(_ppPeriode);
  if (!data) return;
  _ppRenderSnap(data);
}

// ─── AMBIL SNAPSHOT & SIMPAN ─────────────────────────────────
async function ppAmbilSnapshot() {
  if (!_ppPeriode) return;

  var btnAmbil = document.getElementById('pp-btn-ambil');
  if (btnAmbil) { btnAmbil.disabled = true; btnAmbil.innerHTML = '<i class="ti ti-refresh"></i> Mengambil...'; }

  try {
    var data = await _ppFetchData(_ppPeriode);
    if (!data) throw new Error('Gagal ambil data');

    // Cek sudah ada snapshot sebelumnya — kalau ada, update; kalau tidak, insert
    var existing = await dbGet('penutupan_periode', '&periode=eq.' + _ppPeriode).catch(function() { return []; });
    var payload = {
      periode:          data.periode,
      tanggal_tutup:    new Date().toISOString().split('T')[0],
      total_pendapatan: data.total_pendapatan,
      total_beban:      data.total_beban,
      laba_rugi:        data.laba_rugi,
      total_aset:       data.total_aset,
      total_kewajiban:  data.total_kewajiban,
      total_modal:      0,
      total_kas:        data.total_kas,
      nilai_stok:       data.nilai_stok,
      escrow_shopee:    data.escrow_shopee,
      net_worth:        data.net_worth,
      catatan:          null,
    };

    if (existing && existing.length > 0) {
      await dbUpdate('penutupan_periode', existing[0].id, payload);
    } else {
      await dbInsert('penutupan_periode', payload);
    }

    _ppToast('✅ Snapshot ' + _ppPeriodeLabel(_ppPeriode) + ' tersimpan');
    // Reload dropdown & histori
    await ppLoadBulanDropdown();
    await ppLoadHistori();

  } catch(e) {
    _ppToast('❌ Gagal: ' + e.message, 4000);
    console.error('[PP] ambil snapshot error', e);
  } finally {
    if (btnAmbil) { btnAmbil.disabled = false; btnAmbil.innerHTML = '<i class="ti ti-refresh"></i> Perbarui Snapshot'; }
  }
}

// ─── FETCH SEMUA DATA UNTUK SATU PERIODE ─────────────────────
async function _ppFetchData(ym) {
  try {
    var parts    = ym.split('-');
    var lastDay  = new Date(parseInt(parts[0]), parseInt(parts[1]), 0).getDate();
    var ymStart  = ym + '-01';
    var ymEnd    = ym + '-' + String(lastDay).padStart(2, '0');

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

    // Build akunMap
    var akunMap = {};
    (kasAkun || []).forEach(function(a) { akunMap[a.id] = Object.assign({}, a, {saldoDebit:0, saldoKredit:0}); });
    (allJurnal || []).forEach(function(r) {
      var n = Number(r.nominal || r.debit || 0);
      if (akunMap[r.akun_debit_id])  akunMap[r.akun_debit_id].saldoDebit   += n;
      if (akunMap[r.akun_kredit_id]) akunMap[r.akun_kredit_id].saldoKredit += n;
    });

    // Kas: semua akun kelompok aset kecuali persediaan
    var totalKas = Object.values(akunMap)
      .filter(function(a) { return a.kelompok === 'aset' && a.sub_kelompok !== 'Persediaan'; })
      .reduce(function(s, a) { return s + Math.max(0, a.saldoDebit - a.saldoKredit); }, 0);

    // Nilai stok: HPP × sisa qty
    var stokMap = {};
    (stok || []).forEach(function(s) { stokMap[(s.sku_variasi||'').toUpperCase()] = s.stok_masuk || 0; });
    var keluarMap = {};
    (jual || []).forEach(function(j) { var k=(j.sku||'').toUpperCase(); keluarMap[k]=(keluarMap[k]||0)+(j.qty||0); });
    var nilaiStok = (produk || []).reduce(function(s, p) {
      var key  = (p.sku_variasi||'').toUpperCase();
      var sisa = (stokMap[key]||0) - (keluarMap[key]||0);
      return s + (sisa > 0 ? sisa * (p.hpp||0) : 0);
    }, 0);

    // Hutang sisa
    var bayarMap = {};
    (bayar || []).forEach(function(b) { bayarMap[b.hutang_id] = (bayarMap[b.hutang_id]||0) + Number(b.nominal||0); });
    var totalHutang = (hutang || []).reduce(function(s, h) {
      var sisa = (h.pokok||0) - (bayarMap[h.id]||0);
      return s + (sisa > 0 ? sisa : 0);
    }, 0);

    // Escrow Shopee
    var escrow = 0;
    if (Array.isArray(shopeeRaw) && shopeeRaw.length > 0) {
      escrow = Number(shopeeRaw[0].escrow_transit || 0);
    }

    // Net Worth
    var netWorth = totalKas + nilaiStok + escrow - totalHutang;

    // P&L bulan ini
    var totalPend = 0, totalBeban = 0;
    (jurnalBulan || []).forEach(function(r) {
      var n  = Number(r.nominal || r.debit || 0);
      var aD = akunMap[r.akun_debit_id];
      var aK = akunMap[r.akun_kredit_id];
      if (aK && aK.kelompok === 'pendapatan') totalPend  += n;
      if (aD && aD.kelompok === 'beban')      totalBeban += n;
    });

    // Total aset (all-time neraca)
    var totalAset = Object.values(akunMap)
      .filter(function(a) { return a.kelompok === 'aset'; })
      .reduce(function(s, a) { return s + Math.max(0, a.saldoDebit - a.saldoKredit); }, 0);

    return {
      periode:          ym,
      total_kas:        totalKas,
      nilai_stok:       nilaiStok,
      escrow_shopee:    escrow,
      net_worth:        netWorth,
      total_pendapatan: totalPend,
      total_beban:      totalBeban,
      laba_rugi:        totalPend - totalBeban,
      total_aset:       totalAset,
      total_kewajiban:  totalHutang,
      tanggal_tutup:    null,  // live, belum disimpan
    };
  } catch(e) {
    console.error('[PP] _ppFetchData error', e);
    return null;
  }
}

// ─── RENDER SNAPSHOT KE UI ───────────────────────────────────
function _ppRenderSnap(snap) {
  var lb = Number(snap.laba_rugi || 0);
  var nw = Number(snap.net_worth || 0);

  // Net Worth hero
  var nwEl = document.getElementById('pp-snap-nw');
  if (nwEl) { nwEl.textContent = (nw < 0 ? '(' : '') + _ppFmt(nw) + (nw < 0 ? ')' : ''); nwEl.style.color = nw >= 0 ? 'var(--ok)' : 'var(--danger)'; }

  // Delta net worth vs bulan sebelumnya
  var deltaEl = document.getElementById('pp-snap-nw-delta');
  if (deltaEl) {
    var prevSnap = _ppGetPrevSnap(snap.periode);
    if (prevSnap) {
      var delta = nw - Number(prevSnap.net_worth || 0);
      var sign  = delta >= 0 ? '+' : '';
      deltaEl.textContent = sign + _ppFmt(delta) + ' dari ' + _ppPeriodeLabel(prevSnap.periode);
      deltaEl.style.color = delta >= 0 ? 'var(--ok)' : 'var(--danger)';
    } else {
      deltaEl.textContent = '';
    }
  }

  // Kartu aset
  var kasEl = document.getElementById('pp-snap-kas');
  if (kasEl) kasEl.textContent = _ppFmt(snap.total_kas || snap.total_aset);
  var stokEl = document.getElementById('pp-snap-stok');
  if (stokEl) stokEl.textContent = _ppFmt(snap.nilai_stok);
  var escrowEl = document.getElementById('pp-snap-escrow');
  if (escrowEl) escrowEl.textContent = _ppFmt(snap.escrow_shopee);
  var hutangEl = document.getElementById('pp-snap-hutang');
  if (hutangEl) hutangEl.textContent = _ppFmt(snap.total_kewajiban);

  // Kartu P&L
  var pendEl = document.getElementById('pp-snap-pend');
  if (pendEl) pendEl.textContent = _ppFmt(snap.total_pendapatan);
  var bebanEl = document.getElementById('pp-snap-beban');
  if (bebanEl) bebanEl.textContent = _ppFmt(snap.total_beban);
  var lbEl = document.getElementById('pp-snap-lb');
  if (lbEl) { lbEl.textContent = (lb < 0 ? '(' : '') + _ppFmt(lb) + (lb < 0 ? ')' : ''); lbEl.style.color = lb >= 0 ? 'var(--ok)' : 'var(--danger)'; }
  var lbCard = document.getElementById('pp-snap-lb-card');
  if (lbCard) lbCard.style.borderColor = lb >= 0 ? 'var(--ok)' : 'var(--danger)';

  // Meta
  var metaEl = document.getElementById('pp-snap-meta');
  if (metaEl) {
    if (snap.tanggal_tutup) {
      metaEl.textContent = 'Snapshot diambil ' + new Date(snap.tanggal_tutup).toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'});
    } else {
      metaEl.textContent = 'Data live — belum disimpan';
    }
  }
}

// Ambil snapshot bulan sebelumnya dari cache
function _ppGetPrevSnap(ym) {
  var parts = ym.split('-');
  var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 2, 1); // bulan sebelumnya
  var prevYm = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  return _ppHistoriCache.find(function(r) { return r.periode === prevYm; }) || null;
}

// ─── AUTO-SNAPSHOT: cek & simpan bulan lalu saat app dibuka ──
async function ppAutoSnapshot() {
  try {
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    var bulanLalu = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

    // Cek apakah sudah ada snapshot bulan lalu
    var existing = await dbGet('penutupan_periode', '&periode=eq.' + bulanLalu).catch(function() { return []; });
    if (existing && existing.length > 0) return; // sudah ada, skip

    // Belum ada — ambil dan simpan
    var data = await _ppFetchData(bulanLalu);
    if (!data) return;

    await dbInsert('penutupan_periode', {
      periode:          data.periode,
      tanggal_tutup:    new Date().toISOString().split('T')[0],
      total_pendapatan: data.total_pendapatan,
      total_beban:      data.total_beban,
      laba_rugi:        data.laba_rugi,
      total_aset:       data.total_aset,
      total_kewajiban:  data.total_kewajiban,
      total_modal:      0,
      total_kas:        data.total_kas,
      nilai_stok:       data.nilai_stok,
      escrow_shopee:    data.escrow_shopee,
      net_worth:        data.net_worth,
      catatan:          null,
    });

    _ppToast('📸 Snapshot ' + _ppPeriodeLabel(bulanLalu) + ' otomatis tersimpan');
  } catch(e) {
    console.warn('[PP] auto-snapshot gagal:', e.message);
  }
}

// ─── LOAD HISTORI ────────────────────────────────────────────
async function ppLoadHistori() {
  var bodyEl = document.getElementById('pp-histori-body');
  if (!bodyEl) return;
  bodyEl.innerHTML = '<div class="pp-empty">Memuat...</div>';

  try {
    var data = await dbGet('penutupan_periode', '&order=periode.desc').catch(function() { return []; });
    _ppHistoriCache = data || [];

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
        var delta = nw - Number(prev.net_worth || 0);
        var sign  = delta >= 0 ? '▲ +' : '▼ ';
        deltaHtml = '<div class="pp-hist-delta" style="color:' + (delta >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' +
          sign + _ppFmt(delta) + '</div>';
      }
      var tgl = r.tanggal_tutup ? new Date(r.tanggal_tutup).toLocaleDateString('id-ID', {day:'2-digit',month:'short'}) : '—';
      return '<div class="pp-hist-row" onclick="ppPilihPeriode(\'' + r.periode + '\')">' +
        '<div>' +
          '<div class="pp-hist-periode">' + _ppPeriodeLabel(r.periode) + '</div>' +
          '<div class="pp-hist-detail">' + tgl + ' · Pend: ' + _ppFmt(r.total_pendapatan) + ' · Beban: ' + _ppFmt(r.total_beban) + '</div>' +
          '<div class="pp-hist-detail" style="margin-top:2px">L/R: <span style="color:' + (lb >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' + (lb < 0 ? '(' : '') + _ppFmt(lb) + (lb < 0 ? ')' : '') + '</span></div>' +
        '</div>' +
        '<div class="pp-hist-right">' +
          '<div class="pp-hist-nw" style="color:' + (nw >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' + (nw < 0 ? '(' : '') + _ppFmt(nw) + (nw < 0 ? ')' : '') + '</div>' +
          deltaHtml +
        '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    bodyEl.innerHTML = '<div class="pp-empty" style="color:var(--danger)">Error: ' + e.message + '</div>';
  }
}

// Klik histori → pilih periode itu di dropdown
function ppPilihPeriode(ym) {
  var sel = document.getElementById('pp-bulan');
  if (!sel) return;
  sel.value = ym;
  ppTampilSnapshot();
  // Scroll ke atas
  var zone = document.getElementById('pp-scroll-zone');
  if (zone) zone.scrollTop = 0;
}

// ─── EVENT: BUKA HALAMAN ─────────────────────────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'penutupan-periode') return;
  setTimeout(_ppEnsureLayout, 60);
  ppLoadBulanDropdown();
  ppLoadHistori();
});

// ─── AUTO-SNAPSHOT: jalankan saat app.js selesai load ────────
// Delay 3 detik — beri waktu dbGet siap dan halaman lain load dulu
setTimeout(function() {
  if (typeof dbGet === 'function') ppAutoSnapshot();
}, 3000);
