// ─── DATAORDER.JS — upload & parse file Shopee ───────────────

let _orderData = [];

document.getElementById('page-dataorder').innerHTML = `
  <!-- UPLOAD ZONE -->
  <div class="upload-zone" id="upload-zone" onclick="document.getElementById('file-input').click()">
    <i class="ti ti-upload"></i>
    Upload file Shopee (.xlsx / .csv)<br>
    <span style="font-size:12px">Drag &amp; drop atau klik untuk pilih file</span>
  </div>
  <input type="file" id="file-input" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleFileUpload(event)">

  <!-- RINGKASAN SETELAH UPLOAD -->
  <div id="order-summary" style="display:none" class="metrics" style="grid-template-columns:repeat(4,1fr)">
    <div class="metric"><div class="m-label">Total Order</div><div class="m-value" id="ord-total">—</div><div class="m-delta">baris data</div></div>
    <div class="metric"><div class="m-label">Total Pendapatan</div><div class="m-value" id="ord-pendapatan">—</div><div class="m-delta">harga setelah diskon</div></div>
    <div class="metric"><div class="m-label">Total Penghasilan</div><div class="m-value" id="ord-penghasilan">—</div><div class="m-delta">total bayar</div></div>
    <div class="metric"><div class="m-label">Kota Teratas</div><div class="m-value" id="ord-kota">—</div><div class="m-delta">kota terbanyak</div></div>
  </div>

  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span><i class="ti ti-shopping-cart"></i>Data Order</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <input type="text" id="order-search" placeholder="Cari SKU / kota..." style="font-family:var(--f);font-size:13px;padding:4px 8px;border:2px solid var(--ink);background:var(--cream);width:160px" oninput="filterOrders()">
        <button class="btn btn-sm" onclick="exportOrderCSV()"><i class="ti ti-download"></i> Export</button>
      </div>
    </div>
    <div id="order-info" style="font-size:12px;color:var(--ink3);margin-bottom:8px">Belum ada file diupload. Upload file Shopee di atas.</div>
    <div class="tbl-wrap" style="max-height:65vh;overflow-y:auto;overflow-x:auto;overscroll-behavior:none;touch-action:pan-y pan-x;scroll-behavior:smooth"><table class="tbl">
      <thead>
        <tr>
          <th>No. Pesanan</th><th>SKU</th><th>Variasi</th><th>Qty</th>
          <th>Harga Diskon</th><th>Total Bayar</th><th>Kota</th><th>Waktu Selesai</th>
        </tr>
      </thead>
      <tbody id="order-tbody">
        <tr><td colspan="8" style="color:var(--ink3);font-style:italic">Upload file untuk melihat data order</td></tr>
      </tbody>
    </table></div>
  </div>
`;

// render sketchy UI untuk halaman page-dataorder setelah innerHTML siap
setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-dataorder')); }, 80);

// Drag & drop
const zone = document.getElementById('upload-zone');
zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.background='var(--cream3)'; });
zone.addEventListener('dragleave', () => { zone.style.background=''; });
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.style.background = '';
  const file = e.dataTransfer.files[0];
  if (file) processOrderFile(file);
});

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (file) processOrderFile(file);
  e.target.value = '';
}

async function processOrderFile(file) {
  document.getElementById('order-info').textContent = 'Memproses file...';
  document.getElementById('order-tbody').innerHTML = '<tr><td colspan="8" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';

  try {
    let rows = [];
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      const text = await file.text();
      rows = parseCSV(text);
    } else {
      // XLSX — load SheetJS dynamically
      rows = await parseXLSX(file);
    }

    if (rows.length === 0) {
      document.getElementById('order-info').textContent = 'File kosong atau format tidak dikenali.';
      return;
    }

    // Deteksi header Shopee (baris pertama)
    const headers = rows[0].map(h => String(h||'').toLowerCase().trim());
    const colMap  = detectShopeeColumns(headers);

    _orderData = rows.slice(1).map(row => ({
      noPesanan: row[colMap.noPesanan] || '',
      sku:       row[colMap.sku]       || '',
      variasi:   row[colMap.variasi]   || '',
      qty:       parseInt(row[colMap.qty]) || 0,
      hargaDiskon: parseRupiah(row[colMap.hargaDiskon]),
      totalBayar:  parseRupiah(row[colMap.totalBayar]),
      kota:      row[colMap.kota]      || '',
      waktu:     row[colMap.waktu]     || '',
    })).filter(r => r.noPesanan || r.sku);

    renderOrders(_orderData);
    renderOrderSummary(_orderData);
    document.getElementById('order-info').textContent = `File: ${file.name} — ${_orderData.length} baris`;

  } catch(err) {
    document.getElementById('order-info').textContent = 'Gagal parse file: ' + err.message;
  }
}

function detectShopeeColumns(headers) {
  const find = (...kws) => {
    for (const kw of kws) {
      const i = headers.findIndex(h => h.includes(kw));
      if (i >= 0) return i;
    }
    return -1;
  };
  return {
    noPesanan:   find('no. pesanan','nomor pesanan','order id'),
    sku:         find('nama produk','nama barang','sku','produk'),
    variasi:     find('variasi','nama variasi','variant'),
    qty:         find('jumlah','qty','kuantitas'),
    hargaDiskon: find('harga setelah diskon','harga diskon','harga'),
    totalBayar:  find('total bayar pembeli','total bayar','total'),
    kota:        find('kota','kabupaten','kota/kab'),
    waktu:       find('waktu pesanan selesai','waktu selesai','tanggal','waktu'),
  };
}

function parseRupiah(val) {
  if (!val) return 0;
  return parseInt(String(val).replace(/[^0-9]/g,'')) || 0;
}

function parseCSV(text) {
  const rows = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    cells.push(cur.trim());
    rows.push(cells);
  }
  return rows;
}

async function parseXLSX(file) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
          resolve(data);
        } catch(err) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    };
    script.onerror = () => reject(new Error('Gagal load library XLSX'));
    document.head.appendChild(script);
  });
}

function renderOrders(data) {
  const tbody = document.getElementById('order-tbody');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="color:var(--ink3);font-style:italic">Tidak ada data</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r.noPesanan}</td>
      <td>${r.sku}</td>
      <td>${r.variasi}</td>
      <td>${r.qty}</td>
      <td>${r.hargaDiskon ? 'Rp'+r.hargaDiskon.toLocaleString('id-ID') : '—'}</td>
      <td>${r.totalBayar  ? 'Rp'+r.totalBayar.toLocaleString('id-ID')  : '—'}</td>
      <td>${r.kota}</td>
      <td>${r.waktu}</td>
    </tr>`).join('');
}

function renderOrderSummary(data) {
  const totalPendapatan  = data.reduce((s,r) => s + r.hargaDiskon, 0);
  const totalPenghasilan = data.reduce((s,r) => s + r.totalBayar, 0);
  const kotaCount = {};
  data.forEach(r => { if (r.kota) kotaCount[r.kota] = (kotaCount[r.kota]||0) + 1; });
  const topKota = Object.entries(kotaCount).sort((a,b)=>b[1]-a[1])[0];

  document.getElementById('order-summary').style.display = 'grid';
  document.getElementById('order-summary').style.gridTemplateColumns = 'repeat(4,1fr)';
  document.getElementById('ord-total').textContent       = data.length;
  document.getElementById('ord-pendapatan').textContent  = 'Rp'+(totalPendapatan/1000000).toFixed(1)+'jt';
  document.getElementById('ord-penghasilan').textContent = 'Rp'+(totalPenghasilan/1000000).toFixed(1)+'jt';
  document.getElementById('ord-kota').textContent        = topKota ? topKota[0] : '—';
}

function filterOrders() {
  const q = document.getElementById('order-search').value.toLowerCase();
  const filtered = _orderData.filter(r =>
    r.sku.toLowerCase().includes(q) ||
    r.kota.toLowerCase().includes(q) ||
    r.variasi.toLowerCase().includes(q) ||
    r.noPesanan.toLowerCase().includes(q)
  );
  renderOrders(filtered);
}

function exportOrderCSV() {
  if (_orderData.length === 0) { alert('Belum ada data. Upload file dulu.'); return; }
  const headers = ['No. Pesanan','SKU','Variasi','Qty','Harga Diskon','Total Bayar','Kota','Waktu'];
  const rows = _orderData.map(r => [r.noPesanan,r.sku,r.variasi,r.qty,r.hargaDiskon,r.totalBayar,r.kota,r.waktu]);
  exportCSV('zenoot-orders.csv', headers, rows);
}
