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
//                                  _stokLogKoreksi di stok.js). Tetap
//                                  DICATAT di tabel, tapi TIDAK ditampilkan
//                                  di halaman ini (3 Okt 2026, permintaan user).
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
    /* 3 Okt 2026: picker SKU (bottom sheet ala BRImo, desktop = kartu di tengah) — gantiin <select> bawaan browser yang berdempet */
    #sm-sheet-overlay { display:none; position:fixed; inset:0; z-index:598; background:rgba(0,0,0,.55); }
    #sm-sheet-overlay.open { display:block; }
    #sm-sheet {
      position:fixed; left:0; right:0; bottom:0; z-index:599; background:var(--cream2);
      border-radius:20px 20px 0 0; transform:translateY(100%);
      transition:transform .28s cubic-bezier(.4,0,.2,1);
      padding-bottom:env(safe-area-inset-bottom, 16px);
      max-height:85vh; display:none; flex-direction:column; overflow:hidden;
    }
    #sm-sheet.open { display:flex; transform:translateY(0); }
    #sm-sheet-close {
      position:absolute; top:10px; right:10px; width:32px; height:32px; border:none;
      background:var(--ovl-0_06); border-radius:50%; display:flex; align-items:center;
      justify-content:center; cursor:pointer; color:var(--ink3); font-size:16px; z-index:2; padding:0;
    }
    #sm-sheet-handle { width:40px; height:4px; background:var(--ovl-0_18); border-radius:2px; margin:12px auto 4px; flex:none; }
    #sm-sheet-title { text-align:center; font-size:16px; font-weight:700; color:var(--ink); padding:8px 16px 12px; flex:none; }
    #sm-sheet-search-wrap { flex:none; padding:0 16px 12px; }
    #sm-sheet-search {
      width:100%; box-sizing:border-box; background:var(--ovl-0_06); border:1px solid var(--ovl-0_12);
      border-radius:10px; padding:12px 14px; font-size:15px; font-family:var(--f); color:var(--ink);
      outline:none; -webkit-appearance:none;
    }
    #sm-sheet-search::placeholder { color:var(--ink3); opacity:1; }
    #sm-sheet-search:focus { border-color:var(--ovl-0_25); background:var(--ovl-0_09); }
    #sm-sheet-list { flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; padding:0 12px 16px; }
    .sm-sheet-sec {
      display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; letter-spacing:.06em;
      color:var(--ink3); text-transform:uppercase; padding:16px 8px 8px;
    }
    .sm-sheet-item {
      display:flex; flex-direction:column; gap:3px; padding:13px 14px; margin-bottom:6px;
      border-radius:10px; cursor:pointer; background:var(--ovl-0_06); color:var(--ink);
    }
    .sm-sheet-item:active { background:var(--ovl-0_12); }
    .sm-sheet-item b { font-size:15px; font-weight:700; }
    .sm-sheet-item span { font-size:12px; color:var(--ink3); }
    .sm-sheet-empty { padding:32px 16px; text-align:center; color:var(--ink3); font-size:13px; font-style:italic; line-height:1.5; }
    #sm-picker {
      display:flex; align-items:center; gap:8px; width:100%; box-sizing:border-box; padding:8px;
      border:1.5px solid var(--ink3); background:var(--cream); font-family:var(--f); color:var(--ink); cursor:pointer;
    }
    @media (min-width:768px) {
      #sm-sheet {
        left:50%; right:auto; bottom:50%; transform:translate(-50%, 50%) scale(.96);
        width:100%; max-width:420px; border-radius:16px; max-height:70vh; opacity:0;
        transition:transform .2s ease, opacity .2s ease;
      }
      #sm-sheet.open { transform:translate(-50%, 50%) scale(1); opacity:1; }
    }
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
        <input type="hidden" id="sm-sku">
        <div id="sm-picker" onclick="smOpenPicker()">
          <span id="sm-picker-label" style="color:var(--ink3)">— Pilih SKU —</span>
          <span style="margin-left:auto;color:var(--ink3);font-size:10px">&#9662;</span>
        </div>
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

  <!-- PICKER SKU (Produksi Sendiri saja) -->
  <div id="sm-sheet-overlay" onclick="smClosePicker()"></div>
  <div id="sm-sheet">
    <button type="button" id="sm-sheet-close" onclick="smClosePicker()" aria-label="Tutup"><i class="ti ti-x"></i></button>
    <div id="sm-sheet-handle"></div>
    <div id="sm-sheet-title">Pilih SKU Variasi</div>
    <div id="sm-sheet-search-wrap">
      <input type="text" id="sm-sheet-search" placeholder="Cari SKU atau katalog..." autocomplete="off"
        autocorrect="off" autocapitalize="none" spellcheck="false" oninput="smPickerRender(this.value)">
    </div>
    <div id="sm-sheet-list"></div>
  </div>
`;

var _smData   = [];
var _smProduk = [];   // SEMUA produk (buat cari katalog/boss)
var _smProdukPS = []; // cuma produk yang Boss-nya supplier sistem "Produksi Sendiri"
var _smPickerList = [];

document.addEventListener('zenot:page', function(e) {
  if (e.detail.page === 'stok-masuk') loadStokMasuk();
});

async function loadStokMasuk() {
  var tbody = document.getElementById('sm-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';
  try {
    var res = await Promise.all([
      dbGet('stok_masuk_jurnal', '&order=tanggal.desc,id.desc'),
      dbGet('produk', '&select=id,katalog,sku_variasi,boss&order=katalog.asc,sku_variasi.asc'),
      zDsLoadSuppliers(true),   // peta supplier (NAMA → baris hutang_supplier), supabase.js
    ]);
    _smData   = res[0] || [];
    _smProduk = res[1] || [];
    var supMap = res[2] || {};
    // 3 Okt 2026: Tambah (Produksi Sendiri) CUMA nampilin produk yang Boss-nya
    // supplier ber-sistem Produksi Sendiri (hutang_supplier.is_produksi_sendiri).
    _smProdukPS = _smProduk.filter(function(p) {
      var sup = supMap[String(p.boss || '').trim().toUpperCase()];
      return !!(sup && sup.is_produksi_sendiri);
    });
    renderStokMasuk();
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
  // 3 Okt 2026: entri 'koreksi' tetap tersimpan di tabel, tapi tidak ditampilkan di sini.
  var data = _smData.filter(function(r) { return r.sumber !== 'koreksi'; });
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

function _smEsc(t) {
  return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── PICKER SKU (Produksi Sendiri saja) + "Sering & Terakhir Digunakan" ───
function smOpenPicker() {
  var s = document.getElementById('sm-sheet-search');
  if (s) s.value = '';
  document.getElementById('sm-sheet-overlay').classList.add('open');
  document.getElementById('sm-sheet').classList.add('open');
  smPickerRender('');
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (s && !isIOS) setTimeout(function() { s.focus(); }, 260);
}
function smClosePicker() {
  document.getElementById('sm-sheet-overlay').classList.remove('open');
  document.getElementById('sm-sheet').classList.remove('open');
}
function smPickerRender(q) {
  var listEl = document.getElementById('sm-sheet-list');
  if (!listEl) return;
  q = String(q || '').toLowerCase().trim();
  var items = _smProdukPS.filter(function(p) {
    return !q || (p.sku_variasi || '').toLowerCase().indexOf(q) !== -1 || (p.katalog || '').toLowerCase().indexOf(q) !== -1;
  });
  _smPickerList = [];
  if (!items.length) {
    listEl.innerHTML = '<div class="sm-sheet-empty">' + (_smProdukPS.length
      ? 'Tidak ada SKU yang cocok'
      : 'Belum ada produk dengan sistem Produksi Sendiri.<br>Atur Boss produk ke supplier Produksi Sendiri di Kelola Produk.') + '</div>';
    return;
  }
  function itemHtml(p) {
    _smPickerList.push(p);
    return '<div class="sm-sheet-item" onclick="smPickSku(' + (_smPickerList.length - 1) + ')">' +
      '<b>' + _smEsc(p.sku_variasi) + '</b><span>' + _smEsc(p.katalog || '—') + '</span></div>';
  }
  var html = '';
  if (!q) {
    var byKey = {};
    items.forEach(function(p) { byKey[(p.sku_variasi || '').toUpperCase()] = p; });
    var top = zHistTop('sm_sku', 5).map(function(k) { return byKey[k]; }).filter(Boolean);
    if (top.length) {
      html += '<div class="sm-sheet-sec"><i class="ti ti-clock"></i> Sering &amp; Terakhir Digunakan</div>';
      top.forEach(function(p) { html += itemHtml(p); });
      html += '<div class="sm-sheet-sec">Semua</div>';
    }
  }
  items.forEach(function(p) { html += itemHtml(p); });
  listEl.innerHTML = html;
}
function smPickSku(i) {
  var p = _smPickerList[i];
  if (!p) return;
  document.getElementById('sm-sku').value = p.sku_variasi;
  var lbl = document.getElementById('sm-picker-label');
  if (lbl) { lbl.textContent = p.sku_variasi; lbl.style.color = 'var(--ink)'; }
  zHistPush('sm_sku', (p.sku_variasi || '').toUpperCase());
  smClosePicker();
  setTimeout(function() { var q = document.getElementById('sm-qty'); if (q) q.focus(); }, 60);
}

function _smTodayLocal() {
  var n = new Date();
  return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
}

function smOpenTambah() {
  document.getElementById('sm-tanggal').value    = _smTodayLocal();
  document.getElementById('sm-sku').value        = '';
  var pl = document.getElementById('sm-picker-label');
  if (pl) { pl.textContent = '— Pilih SKU —'; pl.style.color = 'var(--ink3)'; }
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
  if (!_smProdukPS.some(function(p) { return (p.sku_variasi || '').toUpperCase() === sku; })) {
    alert('SKU ini bukan produk Produksi Sendiri. Barang supplier masuk lewat Hutang Barang > Barang Diterima.');
    return;
  }

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
