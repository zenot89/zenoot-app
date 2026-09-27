// ─── JURNAL STOCK MASUK (26 Sep 2026) ──────────────────────────────
// Halaman baru — ledger SEMUA kejadian stock masuk (tabel stok_masuk_jurnal):
//   - sumber 'po'               → OTOMATIS dari Hutang Barang > "Barang
//                                  Diterima" (lihat _hsAutoStockInFromBon
//                                  di hutang-supplier.js)
//   - sumber 'produksi_sendiri' → MANUAL, 1x input lewat tombol "+ Tambah"
//                                  di halaman ini (satu-satunya pintu buat
//                                  sumber ini)
//   - sumber 'koreksi'          → OTOMATIS dari Stok Produk (tombol
//                                  "Edit Stock"/"Tambah" — lihat
//                                  _stokLogKoreksi di stok.js)
// Dropship SENGAJA gak pernah masuk sini (barangnya emang gak pernah
// mampir ke gudang sendiri).
// Halaman ini READ-ONLY buat entri PO & Koreksi (biar histori gak bisa
// diketik ulang sembarangan dari sini) — cuma bisa nambah entri baru
// sumber "Produksi Sendiri".

document.getElementById('page-stok-masuk').innerHTML = `
  <style>
    /* 27 Sep 2026: sama kayak gotcha #paste-area-produk dkk di style.css —
       index.html maksa color-scheme:dark, placeholder browser jadi terang
       di atas bg krem kalau gak di-override eksplisit. */
    #sm-search::placeholder, #sm-keterangan::placeholder { color: var(--ink3); opacity: 1; }
  </style>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
    <div style="font-size:13px;color:var(--ink3)" id="sm-summary">Memuat...</div>
    <div style="display:flex;gap:8px;align-items:center">
      <input type="text" id="sm-search" placeholder="Cari SKU..." oninput="renderStokMasuk()"
        style="font-family:var(--f);font-size:12.5px;padding:6px 10px;border:1.5px solid var(--ink3);background:var(--cream);width:160px;box-sizing:border-box;color:var(--ink)">
      <button class="btn btn-sm btn-primary" onclick="smOpenTambah()"><i class="ti ti-plus"></i> Tambah (Produksi Sendiri)</button>
    </div>
  </div>

  <div class="card" style="padding:0;overflow:hidden">
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr>
          <th style="white-space:nowrap">Tanggal</th>
          <th>Sumber</th>
          <th>SKU Variasi</th>
          <th style="text-align:center">Qty</th>
          <th>Keterangan</th>
        </tr></thead>
        <tbody id="sm-tbody">
          <tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- MODAL TAMBAH — sumber SELALU "produksi_sendiri" (PO & Koreksi udah
       otomatis dari halaman lain, gak perlu dipilih manual di sini) -->
  <div class="modal-overlay" id="modal-sm-tambah" onclick="if(event.target===this) hideModal('modal-sm-tambah')">
    <div class="modal" style="max-width:420px">
      <div class="modal-title"><i class="ti ti-hammer"></i> Stock Masuk — Produksi Sendiri</div>
      <div style="margin-top:10px">
        <label style="font-size:12px;color:var(--ink3);display:block;margin-bottom:4px">Tanggal</label>
        <input type="date" id="sm-tanggal" style="width:100%;box-sizing:border-box;padding:8px;border:1.5px solid var(--ink3);background:var(--cream);font-family:var(--f);color:var(--ink)">
      </div>
      <div style="margin-top:10px">
        <label style="font-size:12px;color:var(--ink3);display:block;margin-bottom:4px">SKU Variasi</label>
        <select id="sm-sku" style="width:100%;box-sizing:border-box;padding:8px;border:1.5px solid var(--ink3);background:var(--cream);font-family:var(--f);color:var(--ink)">
          <option value="">— Pilih SKU —</option>
        </select>
      </div>
      <div style="margin-top:10px">
        <label style="font-size:12px;color:var(--ink3);display:block;margin-bottom:4px">Qty (pcs)</label>
        <input type="number" min="1" id="sm-qty" style="width:100%;box-sizing:border-box;padding:8px;border:1.5px solid var(--ink3);background:var(--cream);font-family:var(--f);color:var(--ink)">
      </div>
      <div style="margin-top:10px">
        <label style="font-size:12px;color:var(--ink3);display:block;margin-bottom:4px">Keterangan (opsional)</label>
        <input type="text" id="sm-keterangan" placeholder="mis. batch Rajut minggu ini"
          style="width:100%;box-sizing:border-box;padding:8px;border:1.5px solid var(--ink3);background:var(--cream);font-family:var(--f);color:var(--ink)">
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;justify-content:flex-end">
        <button class="btn btn-sm" onclick="hideModal('modal-sm-tambah')">Batal</button>
        <button class="btn btn-sm btn-primary" onclick="smSimpanTambah()"><i class="ti ti-device-floppy"></i> Simpan</button>
      </div>
    </div>
  </div>
`;

var _smData   = [];
var _smProduk = [];

document.addEventListener('zenot:page', function(e) {
  if (e.detail.page === 'stok-masuk') loadStokMasuk();
});

async function loadStokMasuk() {
  var tbody = document.getElementById('sm-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';
  try {
    var res = await Promise.all([
      dbGet('stok_masuk_jurnal', '&order=tanggal.desc,id.desc'),
      dbGet('produk', '&select=id,katalog,sku_variasi&order=katalog.asc,sku_variasi.asc'),
    ]);
    _smData   = res[0] || [];
    _smProduk = res[1] || [];
    renderStokMasuk();
    _smPopulateSkuSelect();
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--danger)">Error: ' + e.message + '</td></tr>';
  }
}

function _smBadge(sumber) {
  if (sumber === 'po') {
    return '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:rgba(91,163,224,.12);color:#5ba3e0;border:1px solid #5ba3e0;white-space:nowrap"><i class="ti ti-truck-delivery"></i> P.O.</span>';
  }
  if (sumber === 'produksi_sendiri') {
    return '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:rgba(107,165,58,.12);color:#6ba53a;border:1px solid #6ba53a;white-space:nowrap"><i class="ti ti-hammer"></i> Produksi Sendiri</span>';
  }
  return '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:rgba(200,90,60,.1);color:#c85a3c;border:1px solid #c85a3c;white-space:nowrap"><i class="ti ti-adjustments"></i> Koreksi</span>';
}

function renderStokMasuk() {
  var tbody = document.getElementById('sm-tbody');
  var sumEl = document.getElementById('sm-summary');
  var q = ((document.getElementById('sm-search') || {}).value || '').trim().toUpperCase();
  var data = _smData;
  if (q) data = data.filter(function(r) { return (r.sku_variasi || '').toUpperCase().indexOf(q) !== -1; });

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">' +
      (q ? 'Gak ada entri buat SKU "' + q + '"' : 'Belum ada catatan stock masuk') + '</td></tr>';
    if (sumEl) sumEl.textContent = '0 entri';
    return;
  }
  var totalQty = data.reduce(function(s, r) { return s + (r.qty || 0); }, 0);
  if (sumEl) sumEl.textContent = data.length + ' entri · Total ' + totalQty + ' pcs';

  tbody.innerHTML = data.map(function(r) {
    var tgl = r.tanggal ? new Date(r.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    var qtyColor = (r.qty || 0) < 0 ? 'var(--danger)' : 'var(--ok)';
    return '<tr>' +
      '<td style="white-space:nowrap">' + tgl + '</td>' +
      '<td>' + _smBadge(r.sumber) + '</td>' +
      '<td><b>' + (r.sku_variasi || '—') + '</b></td>' +
      '<td style="text-align:center;font-weight:700;color:' + qtyColor + '">' + (r.qty > 0 ? '+' : '') + (r.qty || 0) + '</td>' +
      '<td style="color:var(--ink3)">' + (r.keterangan || '—') + '</td>' +
      '</tr>';
  }).join('');
}

function _smPopulateSkuSelect() {
  var sel = document.getElementById('sm-sku');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Pilih SKU —</option>' + _smProduk.map(function(p) {
    return '<option value="' + p.sku_variasi + '">' + (p.katalog || '—') + ' — ' + p.sku_variasi + '</option>';
  }).join('');
}

function _smTodayLocal() {
  var n = new Date();
  return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
}

function smOpenTambah() {
  document.getElementById('sm-tanggal').value    = _smTodayLocal();
  document.getElementById('sm-sku').value        = '';
  document.getElementById('sm-qty').value        = '';
  document.getElementById('sm-keterangan').value = '';
  showModal('modal-sm-tambah');
}

async function smSimpanTambah() {
  var tanggal = document.getElementById('sm-tanggal').value;
  var sku     = (document.getElementById('sm-sku').value || '').trim().toUpperCase();
  var qty     = parseInt(document.getElementById('sm-qty').value, 10) || 0;
  var ket     = document.getElementById('sm-keterangan').value.trim() || null;

  if (!tanggal) { alert('Tanggal wajib diisi!'); return; }
  if (!sku)     { alert('Pilih SKU dulu!'); return; }
  if (qty <= 0) { alert('Qty harus lebih dari 0!'); return; }

  var prod = _smProduk.find(function(p) { return (p.sku_variasi || '').toUpperCase() === sku; });

  var btn = document.querySelector('#modal-sm-tambah .btn-primary');
  if (btn) { btn.textContent = 'Menyimpan...'; btn.disabled = true; }
  try {
    await dbInsert('stok_masuk_jurnal', {
      tanggal: tanggal, sumber: 'produksi_sendiri', sku_variasi: sku, qty: qty, keterangan: ket
    });
    // Sinkron ke tabel stok — pola sama kayak simpanStok() mode TAMBAH di stok.js
    var existing = await dbGet('stok', '&sku_variasi=eq.' + encodeURIComponent(sku));
    if (existing && existing.length) {
      await dbUpdate('stok', existing[0].id, { stok_masuk: (existing[0].stok_masuk || 0) + qty });
    } else {
      await dbInsert('stok', {
        sku_variasi: sku, stok_masuk: qty, stok_keluar: 0,
        katalog: prod ? prod.katalog : '', boss: '', hpp: 0
      });
    }
    hideModal('modal-sm-tambah');
    loadStokMasuk();
  } catch (e) {
    alert('Gagal simpan: ' + e.message);
  } finally {
    if (btn) { btn.innerHTML = '<i class="ti ti-device-floppy"></i> Simpan'; btn.disabled = false; }
  }
}
