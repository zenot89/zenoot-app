// ─── SKU-DETAIL.JS — halaman detail per SKU ───────────────────
// Dipicu dari tombol mata di Clearance Monitor (skdOpen), bisa dipakai
// halaman lain nanti dengan pola yang sama: skdOpen('SKU_XXX').
// Isi: nilai stok (sisa, HPP, nilai) + riwayat penjualan per transaksi.

document.getElementById('page-sku-detail').innerHTML = `
  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span><i class="ti ti-search"></i> Detail SKU <span id="skd-sku-title" style="color:var(--accent)"></span></span>
      <button class="btn btn-sm" onclick="skdKembali()" style="font-size:12px">
        <i class="ti ti-arrow-left"></i> Kembali
      </button>
    </div>

    <div id="skd-top-bar">
      <div id="skd-info" style="font-size:12px;color:var(--ink3);margin-bottom:10px">Pilih SKU dari Clearance Monitor...</div>

      <div id="skd-metrics-strip" class="metrics" style="grid-template-columns:repeat(3,1fr);margin:0">
        <div class="metric">
          <div class="m-label">Sisa Stok</div>
          <div class="m-value" id="skd-sisa">—</div>
          <div class="m-delta">pcs</div>
        </div>
        <div class="metric">
          <div class="m-label">HPP/pcs</div>
          <div class="m-value" id="skd-hpp">—</div>
          <div class="m-delta">modal per unit</div>
        </div>
        <div class="metric">
          <div class="m-label">Nilai Stok</div>
          <div class="m-value" id="skd-nilai">—</div>
          <div class="m-delta">HPP × sisa</div>
        </div>
      </div>

      <div style="font-weight:700;margin:14px 0 6px;font-size:13px;color:var(--ink2)">
        <i class="ti ti-history"></i> Riwayat Penjualan
      </div>
    </div>

    <div id="skd-tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>No Order</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Harga</th>
            <th style="text-align:right">Total</th>
            <th style="text-align:center">Status</th>
          </tr>
        </thead>
        <tbody id="skd-tbody">
          <tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada SKU dipilih.</td></tr>
        </tbody>
      </table>
    </div>
    <div id="skd-footer-wrap"><div id="skd-footer" style="font-size:12px;color:var(--ink3);text-align:right"></div></div>
  </div>
`;

setTimeout(() => {
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-sku-detail'));
}, 80);

// ─── STATE ───────────────────────────────────────────────────
let _skdSku = '';

// ─── ENTRY POINT — panggil ini dari halaman manapun ───────────
function skdOpen(sku) {
  _skdSku = sku || '';
  gotoPage('sku-detail', null);
}

function skdKembali() {
  gotoPage('clearance', null);
}

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadSkuDetail() {
  const sku = _skdSku;
  const titleEl = document.getElementById('skd-sku-title');
  const tbody   = document.getElementById('skd-tbody');
  const infoEl  = document.getElementById('skd-info');

  if (titleEl) titleEl.textContent = sku ? '— ' + sku : '';

  if (!sku) {
    if (infoEl) infoEl.textContent = 'Pilih SKU dari Clearance Monitor...';
    if (tbody)  tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada SKU dipilih.</td></tr>';
    return;
  }

  if (infoEl) infoEl.textContent = 'Memuat data...';
  if (tbody)  tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic"><i class="ti ti-loader"></i> Memuat data...</td></tr>';

  const fmtRp = v => 'Rp' + Number(v || 0).toLocaleString('id-ID');
  const skuNorm = sku.trim().toUpperCase();

  try {
    const [produkAll, stokAll, jpAll] = await Promise.all([
      dbGet('produk', '&order=katalog.asc'),
      dbGet('stok'),
      dbGet('jurnal_penjualan', '&order=tanggal.desc,id.desc&select=id,no_order,sku,qty,harga_satuan,total,omset,tanggal,waktu,order_status')
    ]);

    // Info produk — matching sama kayak clearance.js (sku_variasi fallback sku)
    const p = (produkAll || []).find(r => ((r.sku_variasi || r.sku || '').trim().toUpperCase()) === skuNorm) || {};

    // Sisa stok — stok_masuk (tabel stok) dikurangi qty jurnal_penjualan (identik logic clearance.js)
    const masuk = (stokAll || [])
      .filter(r => (r.sku_variasi || '').trim().toUpperCase() === skuNorm)
      .reduce((s, r) => s + (r.stok_masuk || 0), 0);

    const rows = (jpAll || []).filter(r => (r.sku || '').trim().toUpperCase() === skuNorm);
    const keluar = rows.reduce((s, r) => s + (r.qty || 0), 0);
    const sisa   = masuk - keluar;
    const hpp    = p.hpp || 0;
    const nilai  = sisa * hpp;

    if (infoEl) {
      infoEl.textContent = 'Katalog: ' + (p.katalog || '—')
        + '   ·   Boss: ' + (p.boss || '—')
        + '   ·   Kategori: ' + (p.kategori_produk || 'aktif');
    }

    const sisaEl = document.getElementById('skd-sisa');
    if (sisaEl) {
      sisaEl.textContent = sisa.toLocaleString('id-ID') + ' pcs';
      sisaEl.style.color = sisa <= 0 ? 'var(--danger)' : (sisa <= 3 ? 'var(--warn)' : '');
    }
    const hppEl = document.getElementById('skd-hpp');
    if (hppEl) hppEl.textContent = fmtRp(hpp);
    const nilaiEl = document.getElementById('skd-nilai');
    if (nilaiEl) nilaiEl.textContent = fmtRp(nilai);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic;padding:16px">Belum ada riwayat penjualan untuk SKU ini.</td></tr>';
      const footerEl = document.getElementById('skd-footer');
      if (footerEl) footerEl.textContent = '';
      return;
    }

    const stMap = { COMPLETED: 'Selesai', SHIPPED: 'Dikirim', READY_TO_SHIP: 'Siap Kirim', PROCESSED: 'Diproses', CANCELLED: 'Batal' };
    tbody.innerHTML = rows.map(r => {
      const waktu = (r.tanggal || '—') + (r.waktu ? ' ' + String(r.waktu).slice(0, 5) : '');
      const stLabel = stMap[r.order_status] || (r.order_status || '—');
      const stColor = r.order_status === 'COMPLETED' ? 'var(--ok)'
        : r.order_status === 'CANCELLED' ? 'var(--danger)'
        : r.order_status === 'SHIPPED' ? '#7eb8f7'
        : 'var(--ink3)';
      return `<tr>
        <td style="font-size:11px;white-space:nowrap">${waktu}</td>
        <td style="font-size:11px">${r.no_order || '—'}</td>
        <td style="text-align:center;font-weight:700">${r.qty || 0}</td>
        <td style="text-align:right;color:var(--ink3);font-size:12px">${r.harga_satuan ? fmtRp(r.harga_satuan) : '—'}</td>
        <td style="text-align:right;font-weight:700">${fmtRp(r.total || r.omset)}</td>
        <td style="text-align:center;font-size:11px;color:${stColor}">${stLabel}</td>
      </tr>`;
    }).join('');

    const totalQty   = rows.reduce((s, r) => s + (r.qty || 0), 0);
    const totalOmset = rows.reduce((s, r) => s + (r.total || r.omset || 0), 0);
    const footerEl = document.getElementById('skd-footer');
    if (footerEl) footerEl.textContent = `Total ${rows.length} transaksi · ${totalQty} pcs terjual · ${fmtRp(totalOmset)} omset`;

  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger)">⚠️ Error: ${err.message}</td></tr>`;
    if (infoEl) infoEl.textContent = '';
    console.error('[sku-detail]', err);
  }
}

// ─── AUTO-LOAD SAAT NAVIGASI KE HALAMAN INI ───────────────────
(function() {
  var _t = null;
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'sku-detail') return;
    clearTimeout(_t);
    _t = setTimeout(loadSkuDetail, 100);
  });
})();
