// ─── HPP.JS — CRUD + kalkulasi margin harga jual ─────────────

async function loadHpp() {
  const tbody = document.getElementById('hpp-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>';

  try {
    const data = await dbGet('hpp');
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="color:var(--ink3);font-style:italic">Belum ada data HPP</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(row => {
      const hpp = row.harga || 0;
      // Hitung harga jual rekomendasi per margin
      const hj30 = Math.ceil(hpp / 0.70 / 1000) * 1000;
      const hj40 = Math.ceil(hpp / 0.60 / 1000) * 1000;
      const hj50 = Math.ceil(hpp / 0.50 / 1000) * 1000;
      return `
        <tr>
          <td>${row.sku_induk}</td>
          <td>${row.nomor_referensi || '—'}</td>
          <td>${row.nama_variasi || '—'}</td>
          <td>Rp${hpp.toLocaleString('id-ID')}</td>
          <td>Rp${hj30.toLocaleString('id-ID')}</td>
          <td>Rp${hj40.toLocaleString('id-ID')}</td>
          <td>Rp${hj50.toLocaleString('id-ID')}</td>
          <td>
            <button class="btn btn-sm" onclick="editHpp(${row.id})" style="margin-right:4px"><i class="ti ti-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="hapusHpp(${row.id},'${row.sku_induk}')"><i class="ti ti-trash"></i></button>
          </td>
        </tr>`;
    }).join('');
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
  }
}

document.getElementById('page-hpp').innerHTML = `
  <div id="toko-switcher-hpp" class="ch-switcher"></div>
  <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
    <button class="btn btn-sm btn-primary" onclick="showTambahHpp()"><i class="ti ti-plus"></i> Tambah Produk</button>
    <button class="btn btn-sm" onclick="loadHpp()"><i class="ti ti-refresh"></i> Refresh</button>
    <button class="btn btn-sm" onclick="exportHpp()"><i class="ti ti-download"></i> Export CSV</button>
  </div>

  <!-- KALKULATOR HARGA JUAL -->
  <div class="card" style="margin-bottom:12px">
    <div class="card-title"><i class="ti ti-calculator"></i>Kalkulator Harga Jual</div>
    <div class="form-row" style="align-items:flex-end">
      <div class="form-group">
        <label>HPP (Rp)</label>
        <input type="text" inputmode="numeric" id="kalk-hpp" placeholder="0" oninput="hitungHargaJual()">
      </div>
      <div class="form-group">
        <label>Target Margin (%)</label>
        <input type="number" id="kalk-margin" placeholder="40" value="40" oninput="hitungHargaJual()">
      </div>
      <div class="form-group">
        <label>Fee Marketplace (%)</label>
        <input type="number" id="kalk-fee" placeholder="15" value="15" oninput="hitungHargaJual()">
      </div>
      <div class="form-group" style="flex:2">
        <label>Harga Jual Minimum</label>
        <div id="kalk-result" style="font-size:20px;font-weight:700;padding:6px 10px;border:2px solid var(--ink);background:var(--cream3)">—</div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--ink3);margin-top:4px">Rumus: HPP ÷ (1 - margin% - fee%)</div>
  </div>

  <!-- FORM TAMBAH/EDIT HPP -->
  <div id="form-tambah-hpp" style="display:none;margin-bottom:12px">
    <div class="card">
      <div class="card-title" id="hpp-form-title"><i class="ti ti-plus"></i> Tambah HPP Baru</div>
      <input type="hidden" id="hpp-id">
      <div class="form-row">
        <div class="form-group"><label>SKU Induk</label><input type="text" id="hpp-sku-induk" placeholder="mis: Turtleneck"></div>
        <div class="form-group"><label>Nomor Referensi</label><input type="text" id="hpp-ref" placeholder="mis: Turtleneck_HITAM-XL"></div>
        <div class="form-group"><label>Nama Variasi</label><input type="text" id="hpp-variasi" placeholder="mis: Hitam,XL"></div>
        <div class="form-group"><label>HPP (Rp)</label><input type="text" inputmode="numeric" id="hpp-harga" placeholder="0"></div>
        <div class="form-group" style="flex:0;justify-content:flex-end">
          <label>&nbsp;</label>
          <button class="btn btn-primary btn-sm" onclick="simpanHpp()">Simpan</button>
          <button class="btn btn-sm" onclick="cancelHppForm()" style="margin-top:4px">Batal</button>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title"><i class="ti ti-calculator"></i>Daftar HPP & Proyeksi Harga Jual</div>
    <div class="tbl-wrap"><table class="tbl">
      <thead>
        <tr>
          <th>SKU Induk</th><th>Ref SKU</th><th>Variasi</th><th>HPP</th>
          <th>HJ Margin 30%</th><th>HJ Margin 40%</th><th>HJ Margin 50%</th><th>Aksi</th>
        </tr>
      </thead>
      <tbody id="hpp-tbody">
        <tr><td colspan="7" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table></div>
    <div style="font-size:11px;color:var(--ink3);margin-top:8px">*Proyeksi belum termasuk fee marketplace. Gunakan kalkulator di atas untuk perhitungan akurat.</div>
  </div>
`;

function hitungHargaJual() {
  const hpp    = idrVal('kalk-hpp');
  const margin = parseFloat(document.getElementById('kalk-margin').value) || 0;
  const fee    = parseFloat(document.getElementById('kalk-fee').value)    || 0;
  const denom  = 1 - (margin/100) - (fee/100);
  const el     = document.getElementById('kalk-result');
  if (hpp <= 0 || denom <= 0) { el.textContent = '—'; return; }
  const hj = Math.ceil(hpp / denom / 1000) * 1000;
  el.textContent = 'Rp' + hj.toLocaleString('id-ID');
}

function showTambahHpp() {
  document.getElementById('hpp-form-title').innerHTML = '<i class="ti ti-plus"></i> Tambah HPP Baru';
  document.getElementById('hpp-id').value = '';
  document.getElementById('hpp-sku-induk').value = '';
  document.getElementById('hpp-ref').value = '';
  document.getElementById('hpp-variasi').value = '';
  idrSet('hpp-harga', 0);
  document.getElementById('form-tambah-hpp').style.display = 'block';
}

function cancelHppForm() {
  document.getElementById('form-tambah-hpp').style.display = 'none';
}

async function editHpp(id) {
  try {
    const data = await dbGet('hpp', `&id=eq.${id}`);
    if (!data || !data[0]) return;
    const r = data[0];
    document.getElementById('hpp-form-title').innerHTML = '<i class="ti ti-edit"></i> Edit HPP';
    document.getElementById('hpp-id').value        = r.id;
    document.getElementById('hpp-sku-induk').value = r.sku_induk || '';
    document.getElementById('hpp-ref').value       = r.nomor_referensi || '';
    document.getElementById('hpp-variasi').value   = r.nama_variasi || '';
    idrSet('hpp-harga', r.harga || 0);
    document.getElementById('form-tambah-hpp').style.display = 'block';
    document.getElementById('form-tambah-hpp').scrollIntoView({behavior:'smooth'});
  } catch(err) { alert('Gagal load: ' + err.message); }
}

async function simpanHpp() {
  const id = document.getElementById('hpp-id').value;
  const data = {
    sku_induk:       document.getElementById('hpp-sku-induk').value.trim(),
    nomor_referensi: document.getElementById('hpp-ref').value.trim(),
    nama_variasi:    document.getElementById('hpp-variasi').value.trim(),
    harga:           idrVal('hpp-harga'),
  };
  if (!data.sku_induk) { alert('SKU Induk wajib diisi!'); return; }
  try {
    if (id) {
      await dbUpdate('hpp', id, data);
    } else {
      await dbInsert('hpp', data);
    }
    cancelHppForm();
    loadHpp();
  } catch(err) { alert('Gagal simpan: ' + err.message); }
}

async function hapusHpp(id, sku) {
  confirmDelete(`Hapus HPP "${sku}"?`, async () => {
    try {
      await dbDelete('hpp', id);
      loadHpp();
    } catch(err) { alert('Gagal hapus: ' + err.message); }
  });
}

async function exportHpp() {
  try {
    const data = await dbGet('hpp');
    if (!data || data.length === 0) { alert('Belum ada data HPP'); return; }
    const headers = ['SKU Induk','Nomor Referensi','Nama Variasi','HPP','HJ Margin 30%','HJ Margin 40%','HJ Margin 50%'];
    const rows = data.map(r => {
      const hpp = r.harga || 0;
      return [r.sku_induk, r.nomor_referensi, r.nama_variasi, hpp,
        Math.ceil(hpp/0.70/1000)*1000,
        Math.ceil(hpp/0.60/1000)*1000,
        Math.ceil(hpp/0.50/1000)*1000];
    });
    exportCSV('zenoot-hpp.csv', headers, rows);
  } catch(err) { alert('Gagal export: ' + err.message); }
}

loadHpp();

// ─── AUTO-RELOAD SAAT NAVIGASI KE HALAMAN INI ────────────────
// Debounce 250ms: cegah double-fire jika menu diklik cepat
(function() {
  var _t = null;
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'hpp') return;
    clearTimeout(_t);
    _t = setTimeout(loadHpp, 250);
  });
})();
