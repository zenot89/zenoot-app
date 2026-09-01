// ─── REKAP.JS — Dynamic P&L dari Database ────────────────────
// Membaca data dari: jurnal_penjualan, jurnal (kas), beban_operasional
// ─────────────────────────────────────────────────────────────

document.addEventListener('zenot:page', function(e) {
  if (e.detail && e.detail.page === 'rekap') loadRekap();
});

(function() {
  if (document.getElementById('page-rekap') &&
      document.getElementById('page-rekap').classList.contains('active')) {
    loadRekap();
  }
})();

// ─── FORMAT HELPERS ──────────────────────────────────────────
function _rp(n) {
  if (!n || isNaN(n)) return 'Rp0';
  return 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
}
function _pct(a, b) {
  if (!b || b === 0) return '—';
  return (a / b * 100).toFixed(1) + '%';
}
function _pill(val, base) {
  const pct = base ? (val / base * 100).toFixed(1) : 0;
  const neg  = val < 0;
  return `<span class="rasio-pill" style="${neg ? 'border-color:var(--danger);color:var(--danger)' : ''}">${neg ? '' : ''}${pct}%</span>`;
}

// ─── MAIN LOAD ───────────────────────────────────────────────
async function loadRekap() {
  const el = document.getElementById('page-rekap');
  if (!el) return;

  el.innerHTML = `<div style="padding:20px;color:var(--ink3)"><i class="ti ti-loader ti-spin"></i> Memuat data rekap...</div>`;

  try {
    // Ambil bulan yang tersedia dari jurnal_penjualan
    const now   = new Date();
    const bulan = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      bulan.push({ tahun: d.getFullYear(), bulan: d.getMonth() + 1,
        label: d.toLocaleString('id-ID', { month: 'long', year: 'numeric' }) });
    }

    // Fetch data semua bulan parallel
    const [jpAll, jurnalAll, bebanAll, stokAll] = await Promise.all([
      dbGet('jurnal_penjualan', '&order=tanggal.desc'),
      dbGet('jurnal', '&order=tanggal.desc'),
      dbGet('beban_operasional', '&order=tanggal.desc'),
      dbGet('produk', '&select=hpp,stok_saat_ini').catch(() => []),
    ]);

    // Hitung per bulan
    const data = bulan.map(b => {
      const prefix = `${b.tahun}-${String(b.bulan).padStart(2,'0')}`;

      const jp = jpAll.filter(r => (r.tanggal||'').startsWith(prefix));
      const jr = jurnalAll.filter(r => (r.tanggal||'').startsWith(prefix));
      const bb = bebanAll.filter(r => (r.tanggal||'').startsWith(prefix));

      // Pendapatan = total omset jurnal penjualan
      const pendapatan = jp.reduce((s,r) => s + (parseFloat(r.omset)||0), 0);

      // Penghasilan = pendapatan - biaya admin/layanan Shopee
      const adm_layanan = jp.reduce((s,r) =>
        s + (parseFloat(r.biaya_admin)||0) + (parseFloat(r.biaya_layanan)||0) +
            (parseFloat(r.biaya_komisi)||0) + (parseFloat(r.biaya_proses)||0) +
            (parseFloat(r.biaya_kampanye)||0) + (parseFloat(r.biaya_isi_saldo)||0), 0);
      const penghasilan = pendapatan - adm_layanan;

      // HPP = qty × hpp per produk (dari jurnal_penjualan.hpp_satuan jika ada)
      const hpp = jp.reduce((s,r) =>
        s + (parseFloat(r.hpp_satuan)||0) * (parseFloat(r.qty)||1), 0);

      // Operasional = dari beban_operasional
      const operasional = bb.filter(r => r.kategori !== 'Iklan')
        .reduce((s,r) => s + (parseFloat(r.jumlah)||0), 0);

      // Iklan
      const iklan = bb.filter(r => r.kategori === 'Iklan')
        .reduce((s,r) => s + (parseFloat(r.jumlah)||0), 0);

      // Breakdown admin Shopee dari jurnal_penjualan
      const b_komisi   = jp.reduce((s,r) => s + (parseFloat(r.biaya_komisi)||0), 0);
      const b_admin    = jp.reduce((s,r) => s + (parseFloat(r.biaya_admin)||0), 0);
      const b_layanan  = jp.reduce((s,r) => s + (parseFloat(r.biaya_layanan)||0), 0);
      const b_proses   = jp.reduce((s,r) => s + (parseFloat(r.biaya_proses)||0), 0);
      const b_kampanye = jp.reduce((s,r) => s + (parseFloat(r.biaya_kampanye)||0), 0);
      const b_saldo    = jp.reduce((s,r) => s + (parseFloat(r.biaya_isi_saldo)||0), 0);

      const laba = penghasilan - hpp - operasional - iklan;

      // Metrics
      const orders = jp.length;
      const qty    = jp.reduce((s,r) => s + (parseFloat(r.qty)||1), 0);
      const aov    = orders > 0 ? pendapatan / orders : 0;
      const basket = orders > 0 ? qty / orders : 0;

      return {
        label: b.label, prefix,
        pendapatan, penghasilan, hpp,
        operasional, iklan, adm_layanan,
        b_komisi, b_admin, b_layanan, b_proses, b_kampanye, b_saldo,
        laba, orders, qty, aov, basket,
      };
    });

    // Ambil 2 bulan terakhir yang ada data
    const aktif = data.filter(d => d.pendapatan > 0);
    const b1 = aktif[aktif.length - 2] || data[data.length - 2];
    const b2 = aktif[aktif.length - 1] || data[data.length - 1];

    // Metrics global (bulan terakhir)
    const cur = b2 || b1;
    const roas = cur && cur.iklan > 0 ? cur.pendapatan / cur.iklan : 0;
    const margin = cur && cur.pendapatan > 0 ? (cur.penghasilan - cur.hpp) / cur.pendapatan * 100 : 0;

    el.innerHTML = `
      <div style="padding:16px;max-width:900px;margin:0 auto">

        <!-- METRICS -->
        <div class="metrics" style="margin-bottom:16px">
          <div class="metric">
            <div class="m-label">AOV Aktual</div>
            <div class="m-value">${cur ? _rp(cur.aov).replace('Rp','Rp') : '—'}</div>
            <div class="m-delta">per order</div>
          </div>
          <div class="metric">
            <div class="m-label">Basket Size</div>
            <div class="m-value">${cur ? cur.basket.toFixed(2) + '×' : '—'}</div>
            <div class="m-delta">pcs per order</div>
          </div>
          <div class="metric">
            <div class="m-label">ROAS Aktual</div>
            <div class="m-value">${roas > 0 ? roas.toFixed(2) + '×' : '—'}</div>
            <div class="m-delta">target 6.5×</div>
          </div>
          <div class="metric">
            <div class="m-label">Rasio Margin</div>
            <div class="m-value">${margin > 0 ? margin.toFixed(1) + '%' : '—'}</div>
            <div class="m-delta">margin kotor</div>
          </div>
        </div>

        <!-- TABEL P&L -->
        <div class="card" style="overflow-x:auto">
          <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
            <span><i class="ti ti-chart-bar"></i> Rekap Bulanan P&L</span>
            <button class="btn btn-sm" onclick="loadRekap()" style="font-size:11px">
              <i class="ti ti-refresh"></i> Refresh
            </button>
          </div>
          <table class="tbl" style="min-width:500px">
            <thead>
              <tr>
                <th>Item</th>
                <th>${b1 ? b1.label : '—'}</th>
                <th>Rasio</th>
                <th>${b2 ? b2.label : '—'}</th>
                <th>Rasio</th>
              </tr>
            </thead>
            <tbody>
              ${_row('Total Pendapatan', b1?.pendapatan, null, b2?.pendapatan, null, true)}
              ${_row('Total Penghasilan', b1?.penghasilan, b1?.pendapatan, b2?.penghasilan, b2?.pendapatan, true)}
              ${_row('HPP', b1?.hpp, b1?.pendapatan, b2?.hpp, b2?.pendapatan, true)}
              ${_row('Operasional', b1?.operasional, b1?.pendapatan, b2?.operasional, b2?.pendapatan)}
              ${_row('Iklan', b1?.iklan, b1?.pendapatan, b2?.iklan, b2?.pendapatan)}
              <tr class="rekap-row-head"><td>Rasio Admin & Layanan</td>
                <td style="color:var(--danger)">${b1 ? '-'+_rp(b1.adm_layanan) : '—'}</td>
                <td>${b1 ? _pill(-b1.adm_layanan, b1.pendapatan) : '—'}</td>
                <td style="color:var(--danger)">${b2 ? '-'+_rp(b2.adm_layanan) : '—'}</td>
                <td>${b2 ? _pill(-b2.adm_layanan, b2.pendapatan) : '—'}</td>
              </tr>
              ${_rowSub('↳ Biaya Komisi AMS', b1?.b_komisi, b1?.pendapatan, b2?.b_komisi, b2?.pendapatan)}
              ${_rowSub('↳ Biaya Administrasi', b1?.b_admin, b1?.pendapatan, b2?.b_admin, b2?.pendapatan)}
              ${_rowSub('↳ Biaya Layanan', b1?.b_layanan, b1?.pendapatan, b2?.b_layanan, b2?.pendapatan)}
              ${_rowSub('↳ Biaya Proses Pesanan', b1?.b_proses, b1?.pendapatan, b2?.b_proses, b2?.pendapatan)}
              ${_rowSub('↳ Biaya Kampanye', b1?.b_kampanye, b1?.pendapatan, b2?.b_kampanye, b2?.pendapatan)}
              ${_rowSub('↳ Biaya Isi Saldo Otomatis', b1?.b_saldo, b1?.pendapatan, b2?.b_saldo, b2?.pendapatan)}
              <tr class="rekap-row-head" style="border-top:2px solid var(--ink)">
                <td>LABA / RUGI</td>
                <td style="color:${b1?.laba >= 0 ? 'var(--success)' : 'var(--danger)'}">
                  ${b1 ? (b1.laba < 0 ? '-' : '') + _rp(b1.laba) : '—'}
                </td>
                <td>
                  ${b1 ? `<span class="rasio-pill" style="${b1.laba < 0 ? 'border-color:var(--danger);color:var(--danger)' : ''}">
                    ${_pct(b1.laba, b1.pendapatan)}</span>` : '—'}
                </td>
                <td style="color:${b2?.laba >= 0 ? 'var(--success)' : 'var(--danger)'}">
                  ${b2 ? (b2.laba < 0 ? '-' : '') + _rp(b2.laba) : '—'}
                </td>
                <td>
                  ${b2 ? `<span class="rasio-pill" style="${b2.laba < 0 ? 'border-color:var(--danger);color:var(--danger)' : ''}">
                    ${_pct(b2.laba, b2.pendapatan)}</span>` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TREN 3 BULAN -->
        <div class="card" style="margin-top:16px">
          <div class="card-title"><i class="ti ti-trending-up"></i> Tren 3 Bulan</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
            ${data.map(d => `
              <div style="text-align:center;padding:10px;background:var(--card-bg2,var(--ovl-0_04));border-radius:8px">
                <div style="font-size:11px;color:var(--ink3);margin-bottom:6px">${d.label}</div>
                <div style="font-size:15px;font-weight:700;color:${d.laba >= 0 ? 'var(--success)' : 'var(--danger)'}">
                  ${d.laba < 0 ? '-' : '+'}${_rp(d.laba)}
                </div>
                <div style="font-size:11px;color:var(--ink3);margin-top:4px">${_rp(d.pendapatan)} omset</div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(el); }, 80);

  } catch(err) {
    el.innerHTML = `<div style="padding:20px;color:var(--danger)">
      <i class="ti ti-alert-circle"></i> Error: ${err.message}
      <br><br><button class="btn btn-sm" onclick="loadRekap()">Coba Lagi</button>
    </div>`;
  }
}

// ─── ROW HELPERS ─────────────────────────────────────────────
function _row(label, v1, base1, v2, base2, head) {
  const cls = head ? 'rekap-row-head' : '';
  return `<tr class="${cls}">
    <td>${label}</td>
    <td>${v1 !== undefined ? _rp(v1) : '—'}</td>
    <td>${base1 && v1 !== undefined ? _pill(v1, base1) : '—'}</td>
    <td>${v2 !== undefined ? _rp(v2) : '—'}</td>
    <td>${base2 && v2 !== undefined ? _pill(v2, base2) : '—'}</td>
  </tr>`;
}

function _rowSub(label, v1, base1, v2, base2) {
  return `<tr class="rekap-row-sub">
    <td>${label}</td>
    <td>${v1 ? '-'+_rp(v1) : '—'}</td>
    <td>${base1 && v1 ? (v1/base1*100).toFixed(1)+'%' : '—'}</td>
    <td>${v2 ? '-'+_rp(v2) : '—'}</td>
    <td>${base2 && v2 ? (v2/base2*100).toFixed(1)+'%' : '—'}</td>
  </tr>`;
}
