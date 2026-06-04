// ─── DATAORDER.JS — data order dari Shopee API (shopee_orders) ───

let _orderData = [];

document.getElementById('page-dataorder').innerHTML = `
  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span><i class="ti ti-shopping-cart"></i>Data Order</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <input type="text" id="order-search" placeholder="Cari SKU / kota..." style="font-family:var(--f);font-size:13px;padding:4px 8px;border:2px solid var(--ink);background:var(--cream);width:160px" oninput="filterOrders()">
        <button class="btn btn-sm" onclick="exportOrderCSV()"><i class="ti ti-download"></i> Export</button>
      </div>
    </div>
    <div id="order-info" style="font-size:12px;color:var(--ink3);margin-bottom:8px">Memuat data order...</div>
    <div class="tbl-wrap" style="max-height:65vh;overflow-y:auto;overflow-x:auto;overscroll-behavior:none;touch-action:pan-y pan-x;scroll-behavior:smooth"><table class="tbl">
      <thead>
        <tr>
          <th>No. Pesanan</th><th>SKU</th><th>Variasi</th><th>Qty</th>
          <th>Harga Diskon</th><th>Total Bayar</th><th>Kota</th><th>Waktu Selesai</th>
          <th style="text-align:center">Sisa Stok</th>
        </tr>
      </thead>
      <tbody id="order-tbody">
        <tr><td colspan="9" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table></div>
  </div>
`;

setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-dataorder')); }, 80);

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadDataOrder() {
  const tbody = document.getElementById('order-tbody');
  const info  = document.getElementById('order-info');
  tbody.innerHTML = '<tr><td colspan="9" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';

  try {
    // Load orders + stok data paralel
    const [orders, stokList, jurnalAll, produkList] = await Promise.all([
      dbGet('shopee_orders', '&order=create_time.desc&limit=500'),
      dbGet('stok', '&select=sku_variasi,stok_masuk'),
      dbGet('jurnal_penjualan', '&select=sku,qty'),
      dbGet('produk', '&select=sku_variasi'),
    ]);

    _orderData = orders || [];

    // Bangun sisakMap
    const masukMap = {};
    (stokList||[]).forEach(r => {
      const k = (r.sku_variasi||'').toUpperCase();
      masukMap[k] = (masukMap[k]||0) + (r.stok_masuk||0);
    });
    const keluarMap = {};
    (jurnalAll||[]).forEach(j => {
      const k = (j.sku||'').toUpperCase();
      keluarMap[k] = (keluarMap[k]||0) + (j.qty||0);
    });
    const sisakMap = {};
    (produkList||[]).forEach(p => {
      const k = (p.sku_variasi||'').toUpperCase();
      sisakMap[k] = (masukMap[k]||0) - (keluarMap[k]||0);
    });

    window._orderSisakMap = sisakMap;
    renderOrders(_orderData);
    info.textContent = _orderData.length + ' order';
  } catch(err) {
    tbody.innerHTML = '<tr><td colspan="9" style="color:var(--danger)">Error: ' + err.message + '</td></tr>';
    document.getElementById('order-info').textContent = 'Gagal memuat data';
  }
}

// ─── RENDER ───────────────────────────────────────────────────
function renderOrders(data) {
  const tbody   = document.getElementById('order-tbody');
  const sisakMap = window._orderSisakMap || {};
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="color:var(--ink3);font-style:italic">Belum ada data order</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(r => {
    const skuKey  = (r.sku||'').toUpperCase();
    const sisaVal = sisakMap[skuKey];
    const sisaHtml = sisaVal === undefined
      ? '<span style="color:var(--ink3)">—</span>'
      : sisaVal <= 0
        ? '<b style="color:var(--danger)">' + sisaVal + '</b>'
        : sisaVal <= 3
          ? '<b style="color:var(--warn)">' + sisaVal + '</b>'
          : '<b style="color:var(--ok)">' + sisaVal + '</b>';
    const waktu = r.create_time
      ? new Date(r.create_time * 1000).toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'2-digit'}) +
        ' ' + new Date(r.create_time * 1000).toTimeString().slice(0,5)
      : (r.tanggal || '—');
    return '<tr>'
      + '<td style="font-size:11px">' + (r.order_sn||'—') + '</td>'
      + '<td><b style="color:var(--accent)">' + (r.sku||'—') + '</b></td>'
      + '<td style="font-size:11px;color:var(--ink3)">' + (r.variasi||'—') + '</td>'
      + '<td style="text-align:center">' + (r.qty||0) + '</td>'
      + '<td>' + (r.harga_diskon ? 'Rp'+Number(r.harga_diskon).toLocaleString('id-ID') : '—') + '</td>'
      + '<td><b>' + (r.total_bayar||r.omset ? 'Rp'+Number(r.total_bayar||r.omset).toLocaleString('id-ID') : '—') + '</b></td>'
      + '<td style="font-size:11px">' + (r.kota||'—') + '</td>'
      + '<td style="font-size:11px;white-space:nowrap">' + waktu + '</td>'
      + '<td style="text-align:center">' + sisaHtml + '</td>'
      + '</tr>';
  }).join('');
}

// ─── FILTER ───────────────────────────────────────────────────
function filterOrders() {
  const q = (document.getElementById('order-search').value||'').toLowerCase();
  const filtered = _orderData.filter(r =>
    (r.sku||'').toLowerCase().includes(q) ||
    (r.kota||'').toLowerCase().includes(q) ||
    (r.variasi||'').toLowerCase().includes(q) ||
    (r.order_sn||'').toLowerCase().includes(q)
  );
  renderOrders(filtered);
}

// ─── EXPORT ───────────────────────────────────────────────────
function exportOrderCSV() {
  if (_orderData.length === 0) { alert('Belum ada data.'); return; }
  const headers = ['No. Pesanan','SKU','Variasi','Qty','Harga Diskon','Total Bayar','Kota','Waktu'];
  const rows = _orderData.map(r => [r.order_sn,r.sku,r.variasi,r.qty,r.harga_diskon,r.total_bayar||r.omset,r.kota,r.tanggal]);
  exportCSV('zenoot-orders.csv', headers, rows);
}

// ─── AUTO LOAD ────────────────────────────────────────────────
loadDataOrder();
