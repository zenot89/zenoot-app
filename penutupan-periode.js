// ─── PENUTUPAN-PERIODE.JS — Penutupan Periode Bulanan ────────
// Startup-standard month-end close:
// 1. Pre-close checklist (validasi data)
// 2. Snapshot P&L + Neraca
// 3. Jurnal penutup otomatis (tutup akun nominal → Laba Ditahan)
// 4. Lock periode (is_locked=true, periode=YYYY-MM di tabel jurnal)
// 5. Histori periode yang sudah ditutup

document.getElementById('page-penutupan-periode').innerHTML = `
<style>
  .pp-section {
    margin-bottom: 18px;
  }
  .pp-section-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--ink3);
    text-transform: uppercase;
    letter-spacing: .07em;
    margin-bottom: 10px;
  }
  .pp-checklist {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }
  .pp-check-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--cream2);
    border: 2px solid var(--ink4);
    border-radius: 2px;
    font-size: 13px;
  }
  .pp-check-item.ok   { border-color: var(--ok); }
  .pp-check-item.warn { border-color: var(--warn); }
  .pp-check-item.err  { border-color: var(--danger); }
  .pp-check-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
  .pp-check-label { flex: 1; font-weight: 600; }
  .pp-check-val { font-size: 12px; color: var(--ink3); text-align: right; }
  .pp-snapshot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-bottom: 14px;
  }
  .pp-snap-card {
    padding: 10px 12px;
    background: var(--cream2);
    border: 2px solid var(--ink3);
    border-radius: 2px;
  }
  .pp-snap-label { font-size: 10px; font-weight: 700; color: var(--ink3); text-transform: uppercase; margin-bottom: 3px; }
  .pp-snap-val   { font-size: 18px; font-weight: 700; font-family: var(--f2); }
  .pp-snap-desc  { font-size: 11px; color: var(--ink3); margin-top: 2px; }
  .pp-hist-empty { color: var(--ink3); font-style: italic; font-size: 13px; padding: 12px 0; }
  .pp-periode-sel {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }
  .pp-status-bar {
    padding: 12px 16px;
    border-radius: 4px;
    margin-bottom: 14px;
    font-weight: 700;
    font-size: 13px;
    display: none;
    line-height: 1.6;
  }
  .pp-btn-close {
    background: var(--ink);
    color: var(--cream);
    border: none;
    font-family: var(--f);
    font-weight: 700;
    font-size: 14px;
    padding: 12px 24px;
    cursor: pointer;
    border-radius: 2px;
    width: 100%;
    margin-top: 6px;
  }
  .pp-btn-close:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .pp-hist-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--ink4);
    gap: 10px;
  }
  .pp-hist-row:last-child { border-bottom: none; }
  .pp-hist-periode { font-weight: 700; font-size: 13px; }
  .pp-hist-detail  { font-size: 11px; color: var(--ink3); margin-top: 2px; }
  .pp-hist-laba    { font-size: 14px; font-weight: 700; text-align: right; }
  .pp-warn-box {
    padding: 10px 14px;
    background: rgba(255,180,0,0.08);
    border: 2px solid var(--warn);
    border-radius: 2px;
    font-size: 12px;
    color: var(--ink2);
    line-height: 1.7;
    margin-bottom: 14px;
  }
  #pp-scroll-zone {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: none;
    padding: 0 0 32px 0;
  }
</style>

<div id="pp-scroll-zone">

<!-- ── Pilih Periode ── -->
<div class="card pp-section">
  <div class="card-title"><i class="ti ti-calendar-month"></i> Pilih Periode</div>
  <div class="pp-periode-sel">
    <div class="form-group" style="flex:1 1 160px;margin:0">
      <label>Periode (Bulan - Tahun)</label>
      <input type="month" id="pp-bulan" style="width:100%">
    </div>
    <button class="btn btn-sm" onclick="ppValidasi()" style="flex-shrink:0">
      <i class="ti ti-search"></i> Cek Periode
    </button>
  </div>
  <div id="pp-periode-info" style="font-size:12px;color:var(--ink3)"></div>
</div>

<!-- ── Pre-Close Checklist ── -->
<div class="card pp-section" id="pp-card-checklist" style="display:none">
  <div class="card-title"><i class="ti ti-checklist"></i> Pre-Close Checklist</div>
  <div class="pp-checklist" id="pp-checklist-body"></div>
  <div id="pp-status-bar" class="pp-status-bar"></div>
</div>

<!-- ── Snapshot P&L ── -->
<div class="card pp-section" id="pp-card-snapshot" style="display:none">
  <div class="card-title"><i class="ti ti-chart-bar"></i> Snapshot Periode <span id="pp-snap-periode" style="color:var(--ink3);font-weight:400"></span></div>
  <div class="pp-snapshot-grid">
    <div class="pp-snap-card" style="border-color:var(--ok)">
      <div class="pp-snap-label">Total Pendapatan</div>
      <div class="pp-snap-val" id="pp-snap-pend" style="color:var(--ok)">—</div>
      <div class="pp-snap-desc">semua akun pendapatan</div>
    </div>
    <div class="pp-snap-card" style="border-color:var(--danger)">
      <div class="pp-snap-label">Total Beban</div>
      <div class="pp-snap-val" id="pp-snap-beban" style="color:var(--danger)">—</div>
      <div class="pp-snap-desc">semua akun beban</div>
    </div>
    <div class="pp-snap-card" id="pp-snap-lb-card">
      <div class="pp-snap-label">Laba / Rugi</div>
      <div class="pp-snap-val" id="pp-snap-lb">—</div>
      <div class="pp-snap-desc">pendapatan − beban</div>
    </div>
  </div>
  <div class="pp-snapshot-grid">
    <div class="pp-snap-card">
      <div class="pp-snap-label">Total Aset</div>
      <div class="pp-snap-val" id="pp-snap-aset">—</div>
      <div class="pp-snap-desc">per akhir periode</div>
    </div>
    <div class="pp-snap-card">
      <div class="pp-snap-label">Total Kewajiban</div>
      <div class="pp-snap-val" id="pp-snap-kwj" style="color:var(--danger)">—</div>
      <div class="pp-snap-desc">sisa hutang</div>
    </div>
    <div class="pp-snap-card">
      <div class="pp-snap-label">Jumlah Transaksi</div>
      <div class="pp-snap-val" id="pp-snap-trx">—</div>
      <div class="pp-snap-desc">jurnal periode ini</div>
    </div>
  </div>
</div>

<!-- ── Info Jurnal Penutup ── -->
<div class="card pp-section" id="pp-card-jurnal-info" style="display:none">
  <div class="card-title"><i class="ti ti-file-invoice"></i> Jurnal Penutup yang Akan Dibuat</div>
  <div class="pp-warn-box">
    Jurnal penutup menutup semua akun <b>Pendapatan</b> dan <b>Beban</b> ke akun <b>Laba Ditahan</b> (modal).
    Setelah ditutup, jurnal periode ini tidak bisa diedit lagi.
  </div>
  <div id="pp-jurnal-penutup-preview"></div>

  <div style="margin-top:14px">
    <div class="form-group">
      <label>Akun Laba Ditahan (tujuan jurnal penutup)</label>
      <select id="pp-akun-laba-ditahan" style="width:100%">
        <option value="">— Pilih Akun Modal —</option>
      </select>
    </div>
    <div class="form-group" style="margin-top:8px">
      <label>Catatan (opsional)</label>
      <input type="text" id="pp-catatan" placeholder="mis: Penutupan periode normal">
    </div>
  </div>

  <button class="pp-btn-close" id="pp-btn-tutup" onclick="ppTutupPeriode()" disabled>
    <i class="ti ti-lock"></i> Tutup Periode & Lock Data
  </button>
</div>

<!-- ── Histori Penutupan ── -->
<div class="card pp-section">
  <div class="card-title"><i class="ti ti-history"></i> Histori Penutupan Periode</div>
  <div id="pp-histori-body">
    <div class="pp-hist-empty">Memuat...</div>
  </div>
</div>

</div><!-- /pp-scroll-zone -->
`;

setTimeout(function() { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-penutupan-periode')); }, 80);

// ─── STATE ────────────────────────────────────────────────────
var _ppPeriode    = '';   // 'YYYY-MM'
var _ppSnapshot   = null; // hasil validasi
var _ppCanClose   = false;

// ─── FULL HEIGHT LAYOUT ───────────────────────────────────────
function _ppEnsureLayout() {
  var pg = document.getElementById('page-penutupan-periode');
  if (!pg || !pg.classList.contains('active')) return;

  document.documentElement.style.height = '100%';
  document.body.style.height    = '100%';
  document.body.style.minHeight = '0';

  var mainEl = document.querySelector('.main');
  if (mainEl) {
    mainEl.style.height        = '100%';
    mainEl.style.minHeight     = '0';
    mainEl.style.overflow      = 'hidden';
    mainEl.style.display       = 'flex';
    mainEl.style.flex          = '1 1 0';
    mainEl.style.flexDirection = 'column';
  }
  var contentEl = document.querySelector('.content');
  if (contentEl) {
    contentEl.style.overflow      = 'hidden';
    contentEl.style.overflowY     = 'hidden';
    contentEl.style.display       = 'flex';
    contentEl.style.flexDirection = 'column';
    contentEl.style.flex          = '1 1 0';
    contentEl.style.minHeight     = '0';
    contentEl.style.height        = '100%';
  }
  pg.style.display       = 'flex';
  pg.style.flexDirection = 'column';
  pg.style.flex          = '1 1 0';
  pg.style.minHeight     = '0';
  pg.style.overflow      = 'hidden';

  var zone = document.getElementById('pp-scroll-zone');
  if (zone) {
    zone.style.flex      = '1 1 0';
    zone.style.minHeight = '0';
    zone.style.overflowY = 'auto';
  }
}

document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'penutupan-periode') return;
  // Default bulan = bulan lalu (yang lazim ditutup)
  var d = new Date();
  d.setMonth(d.getMonth() - 1);
  var ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  var el = document.getElementById('pp-bulan');
  if (el && !el.value) el.value = ym;

  setTimeout(_ppEnsureLayout, 60);
  ppLoadHistori();
});

window.addEventListener('resize', function() {
  var pg = document.getElementById('page-penutupan-periode');
  if (pg && pg.classList.contains('active')) _ppEnsureLayout();
});

// ─── FORMAT ───────────────────────────────────────────────────
function _ppFmt(v) { return fmtRpFull(Math.abs(Number(v) || 0)); }

function _ppPeriodeLabel(ym) {
  if (!ym) return '';
  var parts = ym.split('-');
  var bulan = ['Januari','Februari','Maret','April','Mei','Juni',
               'Juli','Agustus','September','Oktober','November','Desember'];
  return bulan[parseInt(parts[1]) - 1] + ' ' + parts[0];
}

// ─── VALIDASI & CEK PERIODE ──────────────────────────────────
async function ppValidasi() {
  var bulanEl = document.getElementById('pp-bulan');
  _ppPeriode  = bulanEl ? bulanEl.value : '';
  if (!_ppPeriode) { alert('Pilih periode dulu!'); return; }

  // Reset state
  _ppSnapshot = null;
  _ppCanClose = false;
  var btnTutup = document.getElementById('pp-btn-tutup');
  if (btnTutup) btnTutup.disabled = true;

  // Sembunyikan card dulu
  ['pp-card-checklist','pp-card-snapshot','pp-card-jurnal-info'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  var infoEl = document.getElementById('pp-periode-info');
  if (infoEl) infoEl.textContent = 'Memuat data...';

  try {
    // 1. Cek apakah periode sudah pernah ditutup
    var histori = await dbGet('penutupan_periode', '&periode=eq.' + _ppPeriode).catch(function() { return []; });
    if (histori && histori.length > 0) {
      if (infoEl) infoEl.innerHTML = '<span style="color:var(--ok)">✅ Periode ' + _ppPeriodeLabel(_ppPeriode) + ' sudah pernah ditutup pada ' +
        new Date(histori[0].tanggal_tutup).toLocaleDateString('id-ID') + '</span>';
      return;
    }

    // 2. Ambil semua jurnal periode ini
    var periodeStart = _ppPeriode + '-01';
    // Hari terakhir bulan ini
    var parts = _ppPeriode.split('-');
    var lastDay = new Date(parseInt(parts[0]), parseInt(parts[1]), 0).getDate();
    var periodeEnd = _ppPeriode + '-' + String(lastDay).padStart(2, '0');

    var [jurnal, kasAkun, hutang, bayar] = await Promise.all([
      dbGet('jurnal', '&tanggal=gte.' + periodeStart + '&tanggal=lte.' + periodeEnd + '&order=tanggal.asc').catch(function() { return []; }),
      dbGet('kas_akun', '&order=kode.asc').catch(function() { return []; }),
      dbGet('hutang', '').catch(function() { return []; }),
      dbGet('hutang_bayar', '').catch(function() { return []; }),
    ]);

    jurnal   = jurnal   || [];
    kasAkun  = kasAkun  || [];
    hutang   = hutang   || [];
    bayar    = bayar    || [];

    // Build akunMap
    var akunMap = {};
    kasAkun.forEach(function(a) { akunMap[a.id] = Object.assign({}, a, { saldoDebit: 0, saldoKredit: 0 }); });

    // Hitung saldo semua jurnal (all-time, bukan hanya bulan ini) untuk neraca
    var allJurnal = await dbGet('jurnal', '&order=tanggal.asc').catch(function() { return []; });
    (allJurnal || []).forEach(function(r) {
      var n = Number(r.nominal || r.debit || 0);
      if (akunMap[r.akun_debit_id])  akunMap[r.akun_debit_id].saldoDebit   += n;
      if (akunMap[r.akun_kredit_id]) akunMap[r.akun_kredit_id].saldoKredit += n;
    });

    // Hitung P&L periode ini saja
    // Agregasi per akun (bukan per baris jurnal) agar jurnal penutup 1 baris per akun
    var totalPend  = 0, totalBeban = 0;
    var pendAggr   = {};  // akunId → { id, nama, total }
    var bebanAggr  = {};  // akunId → { id, nama, total }
    jurnal.forEach(function(r) {
      var n  = Number(r.nominal || r.debit || 0);
      var aD = akunMap[r.akun_debit_id];
      var aK = akunMap[r.akun_kredit_id];
      if (aK && aK.kelompok === 'pendapatan') {
        totalPend += n;
        if (!pendAggr[r.akun_kredit_id]) pendAggr[r.akun_kredit_id] = { id: r.akun_kredit_id, nama: aK.nama, total: 0 };
        pendAggr[r.akun_kredit_id].total += n;
      }
      if (aD && aD.kelompok === 'beban') {
        totalBeban += n;
        if (!bebanAggr[r.akun_debit_id]) bebanAggr[r.akun_debit_id] = { id: r.akun_debit_id, nama: aD.nama, total: 0 };
        bebanAggr[r.akun_debit_id].total += n;
      }
    });
    var pendDetail  = Object.values(pendAggr);   // [{ id, nama, total }]
    var bebanDetail = Object.values(bebanAggr);  // [{ id, nama, total }]
    var labaRugi = totalPend - totalBeban;

    // Total aset & kewajiban (all-time neraca)
    var totalAset = Object.values(akunMap).filter(function(a) { return a.kelompok === 'aset'; })
      .reduce(function(s, a) { return s + Math.max(0, a.saldoDebit - a.saldoKredit); }, 0);
    var totalKwj = (hutang || []).reduce(function(s, h) {
      var sudah = (bayar || []).filter(function(b) { return String(b.hutang_id) === String(h.id); })
        .reduce(function(x, b) { return x + Number(b.nominal || 0); }, 0);
      return s + Math.max(0, (h.pokok || 0) - sudah);
    }, 0);
    var totalModal = Object.values(akunMap).filter(function(a) { return a.kelompok === 'modal'; })
      .reduce(function(s, a) { return s + (a.saldoKredit - a.saldoDebit); }, 0);

    // Cek jurnal locked di periode ini
    var jurnalLocked = jurnal.filter(function(r) { return r.is_locked; }).length;
    var jurnalTotal  = jurnal.length;

    // Simpan snapshot untuk dipakai saat tutup
    _ppSnapshot = {
      periode:          _ppPeriode,
      periodeStart:     periodeStart,
      periodeEnd:       periodeEnd,
      jurnal:           jurnal,
      akunMap:          akunMap,
      kasAkun:          kasAkun,
      totalPend:        totalPend,
      totalBeban:       totalBeban,
      labaRugi:         labaRugi,
      totalAset:        totalAset,
      totalKwj:         totalKwj,
      totalModal:       totalModal,
      jurnalTotal:      jurnalTotal,
      jurnalLocked:     jurnalLocked,
      pendDetail:       pendDetail,
      bebanDetail:      bebanDetail,
    };

    // ── Render checklist ──
    var checks = [];

    // Check 1: Ada transaksi di periode ini
    checks.push({
      label: 'Transaksi di periode ini',
      val:   jurnalTotal + ' jurnal',
      ok:    jurnalTotal > 0,
      warn:  false,
      icon:  jurnalTotal > 0 ? '✅' : '⚠',
    });

    // Check 2: Belum ada jurnal locked di periode ini
    checks.push({
      label: 'Status lock periode',
      val:   jurnalLocked > 0 ? jurnalLocked + ' jurnal sudah terkunci' : 'Belum ada yang terkunci',
      ok:    jurnalLocked === 0,
      warn:  jurnalLocked > 0,
      icon:  jurnalLocked === 0 ? '✅' : '⚠',
    });

    // Check 3: Periode belum ditutup sebelumnya (sudah dicek di atas)
    checks.push({
      label: 'Status penutupan',
      val:   'Belum ditutup',
      ok:    true,
      warn:  false,
      icon:  '✅',
    });

    // Check 4: Ada akun pendapatan
    checks.push({
      label: 'Akun pendapatan tercatat',
      val:   totalPend > 0 ? _ppFmt(totalPend) : 'Tidak ada',
      ok:    totalPend > 0,
      warn:  totalPend === 0,
      icon:  totalPend > 0 ? '✅' : '⚠',
    });

    var checkHtml = checks.map(function(c) {
      var cls = c.ok ? 'ok' : (c.warn ? 'warn' : 'err');
      return '<div class="pp-check-item ' + cls + '">' +
        '<span class="pp-check-icon">' + c.icon + '</span>' +
        '<span class="pp-check-label">' + c.label + '</span>' +
        '<span class="pp-check-val">' + c.val + '</span>' +
      '</div>';
    }).join('');

    var checklistBody = document.getElementById('pp-checklist-body');
    if (checklistBody) checklistBody.innerHTML = checkHtml;

    var allOk = checks.every(function(c) { return c.ok || c.warn; });
    var statusBar = document.getElementById('pp-status-bar');
    if (statusBar) {
      statusBar.style.display = 'block';
      if (jurnalTotal === 0) {
        statusBar.style.background = 'rgba(224,82,82,0.10)';
        statusBar.style.color      = 'var(--danger)';
        statusBar.innerHTML        = '⛔ Tidak ada transaksi di periode ini. Pastikan periode yang dipilih benar.';
        _ppCanClose = false;
      } else {
        statusBar.style.background = 'rgba(76,175,80,0.10)';
        statusBar.style.color      = 'var(--ok)';
        statusBar.innerHTML        = '✅ Checklist lengkap. Periode siap ditutup.';
        _ppCanClose = true;
      }
    }

    // ── Render snapshot ──
    var snapPeriode = document.getElementById('pp-snap-periode');
    if (snapPeriode) snapPeriode.textContent = _ppPeriodeLabel(_ppPeriode);
    document.getElementById('pp-snap-pend').textContent  = _ppFmt(totalPend);
    document.getElementById('pp-snap-beban').textContent = _ppFmt(totalBeban);
    document.getElementById('pp-snap-lb').textContent    = (labaRugi < 0 ? '(' : '') + _ppFmt(labaRugi) + (labaRugi < 0 ? ')' : '');
    document.getElementById('pp-snap-lb').style.color    = labaRugi >= 0 ? 'var(--ok)' : 'var(--danger)';
    document.getElementById('pp-snap-lb-card').style.borderColor = labaRugi >= 0 ? 'var(--ok)' : 'var(--danger)';
    document.getElementById('pp-snap-aset').textContent  = _ppFmt(totalAset);
    document.getElementById('pp-snap-kwj').textContent   = _ppFmt(totalKwj);
    document.getElementById('pp-snap-trx').textContent   = jurnalTotal;

    // ── Render jurnal penutup preview ──
    var previewHtml = '';
    if (totalPend > 0 || totalBeban > 0) {
      previewHtml += '<table class="tbl" style="margin-bottom:10px"><thead><tr><th>Keterangan</th><th style="text-align:right">Debit</th><th style="text-align:right">Kredit</th></tr></thead><tbody>';
      // Tutup pendapatan: Debit Pendapatan → Kredit Laba Ditahan (1 jurnal per akun)
      pendDetail.forEach(function(p) {
        previewHtml += '<tr><td style="font-size:12px">Tutup Pend: ' + p.nama + '</td><td style="text-align:right;color:var(--ok)">' + _ppFmt(p.total) + '</td><td style="text-align:right">—</td></tr>';
      });
      // Tutup beban: Debit Laba Ditahan → Kredit Beban (1 jurnal per akun)
      bebanDetail.forEach(function(b) {
        previewHtml += '<tr><td style="font-size:12px">Tutup Beban: ' + b.nama + '</td><td style="text-align:right">—</td><td style="text-align:right;color:var(--danger)">' + _ppFmt(b.total) + '</td></tr>';
      });
      // Baris ringkasan net
      previewHtml += '<tr style="border-top:2px solid var(--ink);font-weight:700"><td>Net ' + (labaRugi >= 0 ? 'Laba' : 'Rugi') + ' → Laba Ditahan</td>' +
        '<td style="text-align:right;color:' + (labaRugi >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' + (labaRugi < 0 ? _ppFmt(Math.abs(labaRugi)) : '—') + '</td>' +
        '<td style="text-align:right;color:' + (labaRugi >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' + (labaRugi >= 0 ? _ppFmt(labaRugi) : '—') + '</td></tr>';
      previewHtml += '</tbody></table>';
    } else {
      previewHtml = '<div style="color:var(--ink3);font-style:italic;font-size:13px">Tidak ada akun pendapatan/beban di periode ini.</div>';
    }
    var previewEl = document.getElementById('pp-jurnal-penutup-preview');
    if (previewEl) previewEl.innerHTML = previewHtml;

    // Populate dropdown akun Laba Ditahan (akun kelompok modal)
    ppPopulateAkunLabaDitahan(kasAkun);

    // Tampilkan semua card
    document.getElementById('pp-card-checklist').style.display    = '';
    document.getElementById('pp-card-snapshot').style.display     = '';
    document.getElementById('pp-card-jurnal-info').style.display  = '';

    // Enable tombol tutup jika boleh
    if (btnTutup) btnTutup.disabled = !_ppCanClose;

    if (infoEl) infoEl.textContent = '';

  } catch(e) {
    if (infoEl) infoEl.innerHTML = '<span style="color:var(--danger)">Error: ' + e.message + '</span>';
    console.error('[PP] validasi error', e);
  }
}

// ─── POPULATE AKUN LABA DITAHAN ──────────────────────────────
function ppPopulateAkunLabaDitahan(kasAkun) {
  var sel = document.getElementById('pp-akun-laba-ditahan');
  if (!sel) return;
  var modalAkun = (kasAkun || []).filter(function(a) { return a.kelompok === 'modal'; });
  sel.innerHTML = '<option value="">— Pilih Akun Modal —</option>' +
    modalAkun.map(function(a) {
      // Auto-select jika nama mengandung "laba ditahan" atau "retained"
      var isLabaDitahan = (a.nama || '').toLowerCase().indexOf('laba ditahan') !== -1 ||
                          (a.nama || '').toLowerCase().indexOf('retained') !== -1;
      return '<option value="' + a.id + '"' + (isLabaDitahan ? ' selected' : '') + '>' +
        (a.kode ? a.kode + ' · ' : '') + a.nama + '</option>';
    }).join('');
}

// ─── PROSES TUTUP PERIODE ────────────────────────────────────
async function ppTutupPeriode() {
  if (!_ppSnapshot || !_ppCanClose) return;

  var akunLabaDitahanId = document.getElementById('pp-akun-laba-ditahan').value;
  if (!akunLabaDitahanId) {
    alert('Pilih akun Laba Ditahan dulu!');
    return;
  }

  var catatan = (document.getElementById('pp-catatan').value || '').trim();

  var konfirm = confirm(
    'Tutup periode ' + _ppPeriodeLabel(_ppPeriode) + '?\n\n' +
    '• Semua jurnal periode ini akan di-lock (tidak bisa diedit)\n' +
    '• Jurnal penutup akan dibuat otomatis\n\n' +
    'Tindakan ini tidak bisa dibatalkan.'
  );
  if (!konfirm) return;

  var btnTutup = document.getElementById('pp-btn-tutup');
  if (btnTutup) { btnTutup.disabled = true; btnTutup.textContent = 'Memproses...'; }

  try {
    var snap     = _ppSnapshot;
    var today    = new Date().toISOString().split('T')[0];
    var labaRugi = snap.labaRugi;

    // ── STEP 1: Lock semua jurnal di periode ini ──────────────
    // Update per jurnal via dbUpdate (safe dengan helper yang ada)
    var lockPromises = snap.jurnal.map(function(r) {
      return dbUpdate('jurnal', r.id, { is_locked: true, periode: snap.periode });
    });
    await Promise.all(lockPromises);

    // ── STEP 2: Buat jurnal penutup per akun (proper double-entry) ──────
    // Pendapatan: Debit akun Pendapatan, Kredit Laba Ditahan
    // Beban:      Debit Laba Ditahan, Kredit akun Beban
    // Tidak ada akun_debit_id atau akun_kredit_id yang null.
    var jurnalPenutupId = null;
    var _ket = 'Jurnal Penutup ' + _ppPeriodeLabel(snap.periode) + (catatan ? ' — ' + catatan : '');
    var _ref = 'TUTUP-' + snap.periode;
    var penutupPromises = [];

    snap.pendDetail.forEach(function(p) {
      if (!p.id || !p.total || !akunLabaDitahanId) return;
      penutupPromises.push(dbInsert('jurnal', {
        tanggal:        today,
        tipe:           'masuk',
        nominal:        p.total,
        debit:          p.total,
        kredit:         p.total,
        akun_debit_id:  p.id,
        akun_kredit_id: akunLabaDitahanId,
        keterangan:     _ket + ' (Tutup Pend: ' + p.nama + ')',
        referensi:      _ref,
        is_locked:      true,
        periode:        snap.periode,
      }));
    });

    snap.bebanDetail.forEach(function(b) {
      if (!b.id || !b.total || !akunLabaDitahanId) return;
      penutupPromises.push(dbInsert('jurnal', {
        tanggal:        today,
        tipe:           'keluar',
        nominal:        b.total,
        debit:          b.total,
        kredit:         b.total,
        akun_debit_id:  akunLabaDitahanId,
        akun_kredit_id: b.id,
        keterangan:     _ket + ' (Tutup Beban: ' + b.nama + ')',
        referensi:      _ref,
        is_locked:      true,
        periode:        snap.periode,
      }));
    });

    if (penutupPromises.length > 0) {
      var hasilPenutup = await Promise.all(penutupPromises);
      if (hasilPenutup[0] && hasilPenutup[0][0]) jurnalPenutupId = hasilPenutup[0][0].id;
    }

    // ── STEP 3: Simpan record penutupan ──────────────────────
    await dbInsert('penutupan_periode', {
      periode:           snap.periode,
      tanggal_tutup:     today,
      total_pendapatan:  snap.totalPend,
      total_beban:       snap.totalBeban,
      laba_rugi:         labaRugi,
      total_aset:        snap.totalAset,
      total_kewajiban:   snap.totalKwj,
      total_modal:       snap.totalModal,
      jurnal_penutup_id: jurnalPenutupId,
      catatan:           catatan || null,
    });

    // ── STEP 4: Reset UI ──────────────────────────────────────
    _ppSnapshot = null;
    _ppCanClose = false;
    ['pp-card-checklist','pp-card-snapshot','pp-card-jurnal-info'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    alert('✅ Periode ' + _ppPeriodeLabel(snap.periode) + ' berhasil ditutup!\n' +
          snap.jurnal.length + ' jurnal terkunci.\n' +
          (jurnalPenutupId ? 'Jurnal penutup dibuat.' : 'Tidak ada jurnal penutup (tidak ada pendapatan/beban).'));

    ppLoadHistori();

  } catch(e) {
    alert('Gagal tutup periode: ' + e.message);
    console.error('[PP] tutup error', e);
    if (btnTutup) { btnTutup.disabled = false; btnTutup.innerHTML = '<i class="ti ti-lock"></i> Tutup Periode & Lock Data'; }
  }
}

// ─── LOAD HISTORI PENUTUPAN ───────────────────────────────────
async function ppLoadHistori() {
  var bodyEl = document.getElementById('pp-histori-body');
  if (!bodyEl) return;
  bodyEl.innerHTML = '<div class="pp-hist-empty">Memuat...</div>';

  try {
    var data = await dbGet('penutupan_periode', '&order=periode.desc').catch(function() { return []; });
    if (!data || data.length === 0) {
      bodyEl.innerHTML = '<div class="pp-hist-empty">Belum ada periode yang ditutup.</div>';
      return;
    }
    bodyEl.innerHTML = data.map(function(r) {
      var lb  = Number(r.laba_rugi || 0);
      var tgl = new Date(r.tanggal_tutup).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
      return '<div class="pp-hist-row">' +
        '<div>' +
          '<div class="pp-hist-periode">' + _ppPeriodeLabel(r.periode) + '</div>' +
          '<div class="pp-hist-detail">Ditutup ' + tgl + (r.catatan ? ' · ' + r.catatan : '') + '</div>' +
          '<div class="pp-hist-detail" style="margin-top:2px">' +
            'Pend: ' + _ppFmt(r.total_pendapatan) + ' · ' +
            'Beban: ' + _ppFmt(r.total_beban) +
          '</div>' +
        '</div>' +
        '<div class="pp-hist-laba" style="color:' + (lb >= 0 ? 'var(--ok)' : 'var(--danger)') + '">' +
          (lb < 0 ? '(' : '') + _ppFmt(lb) + (lb < 0 ? ')' : '') +
          '<div style="font-size:10px;color:var(--ink3);font-weight:400">' + (lb >= 0 ? 'Laba' : 'Rugi') + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch(e) {
    bodyEl.innerHTML = '<div class="pp-hist-empty" style="color:var(--danger)">Error: ' + e.message + '</div>';
  }
}
