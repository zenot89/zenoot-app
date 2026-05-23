// ─── STOK.JS v3 — basis dari produk, keluar dari jurnal ───────

function statusBadge(sisa, kat) {
  // SKU non-aktif: tidak perlu alarm, cukup info redup
  if (kat && kat !== 'aktif') {
    if (sisa <= 0) return '<span style="font-size:10px;font-weight:700;color:var(--ink3);padding:2px 6px;border:1.5px solid var(--ink3);border-radius:2px;opacity:0.5">Habis</span>';
    return '<span style="font-size:10px;color:var(--ink3);opacity:0.5">—</span>';
  }
  if (sisa <= 0)  return '<span class="badge badge-crit">Habis!</span>';
  if (sisa <= 3)  return '<span class="badge badge-crit">Kritis!</span>';
  if (sisa <= 8)  return '<span class="badge badge-warn">Ati2</span>';
  return '<span class="badge badge-ok">Aman</span>';
}

document.getElementById('page-stok').innerHTML = `
  <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center;flex-wrap:wrap">
    <!-- KIRI: Filter — nested submenu -->
    <div style="position:relative">
      <button class="btn btn-sm" id="btn-filter-all" onclick="stokToggleFilterAll()" style="min-width:90px;text-align:left;padding-right:24px">
        <i class="ti ti-adjustments-horizontal"></i> <span id="lbl-filter-all">Filter</span>
        <i class="ti ti-chevron-down" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:11px"></i>
      </button>
      <div id="dd-filter-all" style="display:none;position:absolute;left:0;top:calc(100% + 2px);z-index:999;
        background:var(--cream);border:2px solid var(--ink);min-width:180px;
        box-shadow:4px 4px 0 var(--ink4)">

        <!-- Menu: Supplier -->
        <div id="mi-boss" onclick="stokOpenSub('boss',event)"
          style="padding:8px 12px;cursor:pointer;font-size:13px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed var(--ink4)">
          <span><i class="ti ti-user" style="font-size:12px;margin-right:6px"></i>Supplier <span id="badge-boss" style="font-size:10px;color:var(--ink3)"></span></span>
          <i class="ti ti-chevron-right" style="font-size:11px"></i>
        </div>

        <!-- Menu: SKU Induk -->
        <div id="mi-katalog" onclick="stokOpenSub('katalog',event)"
          style="padding:8px 12px;cursor:pointer;font-size:13px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed var(--ink4)">
          <span><i class="ti ti-tag" style="font-size:12px;margin-right:6px"></i>SKU Induk <span id="badge-katalog" style="font-size:10px;color:var(--ink3)"></span></span>
          <i class="ti ti-chevron-right" style="font-size:11px"></i>
        </div>

        <!-- Menu: Kategori Produk -->
        <div id="mi-kategori-produk" onclick="stokOpenSub('kategori_produk',event)"
          style="padding:8px 12px;cursor:pointer;font-size:13px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed var(--ink4)">
          <span><i class="ti ti-tag" style="font-size:12px;margin-right:6px"></i>Kategori <span id="badge-kategori_produk" style="font-size:10px;color:var(--ink3)"></span></span>
          <i class="ti ti-chevron-right" style="font-size:11px"></i>
        </div>

        <!-- Menu: Status -->
        <div id="mi-status" onclick="stokOpenSub('status',event)"
          style="padding:8px 12px;cursor:pointer;font-size:13px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed var(--ink4)">
          <span><i class="ti ti-circle-check" style="font-size:12px;margin-right:6px"></i>Status <span id="badge-status" style="font-size:10px;color:var(--ink3)"></span></span>
          <i class="ti ti-chevron-right" style="font-size:11px"></i>
        </div>

        <!-- Reset dipindah ke luar dropdown -->
      </div>

      <!-- Submenu — di luar dd-filter-all, sejajar dengannya -->
      <div id="dd-filter-boss" style="display:none;position:fixed;z-index:9999;
        background:var(--cream);border:2px solid var(--ink);min-width:170px;max-height:260px;overflow-y:auto;
        box-shadow:4px 4px 0 var(--ink4)"></div>
      <div id="dd-filter-katalog" style="display:none;position:fixed;z-index:9999;
        background:var(--cream);border:2px solid var(--ink);min-width:190px;max-height:260px;overflow-y:auto;
        box-shadow:4px 4px 0 var(--ink4)"></div>
      <div id="dd-filter-status" style="display:none;position:fixed;z-index:9999;
        background:var(--cream);border:2px solid var(--ink);min-width:160px;
        box-shadow:4px 4px 0 var(--ink4)"></div>
      <div id="dd-filter-kategori_produk" style="display:none;position:fixed;z-index:9999;
        background:var(--cream);border:2px solid var(--ink);min-width:180px;
        box-shadow:4px 4px 0 var(--ink4)"></div>
    </div>

    <!-- RESET FILTER — sejajar tombol Filter -->
    <button class="btn btn-sm" id="btn-stok-reset" onclick="stokResetAllFilter()"
      style="display:none;font-size:12px;border-color:var(--danger);color:var(--danger)">
      <i class="ti ti-x"></i> Reset Filter
    </button>

    <!-- KANAN: Paste Massal + Tambah -->
    <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
      <button class="btn btn-sm" onclick="showPasteStok()"><i class="ti ti-clipboard"></i> Paste Massal</button>
      <button class="btn btn-sm btn-primary" onclick="showTambahStok()"><i class="ti ti-plus"></i> Tambah</button>
    </div>
  </div>

  <!-- MODAL PASTE MASSAL STOK -->
  <div class="modal-overlay" id="modal-paste-stok">
    <div class="modal" style="max-width:480px">
      <div class="modal-title"><i class="ti ti-clipboard"></i> Paste Massal Stok Masuk</div>
      <div style="font-size:12px;color:var(--ink3);margin-bottom:10px;line-height:1.6">
        Copy dari Google Sheet / Excel lalu paste di bawah.<br>
        Urutan kolom: <b>SKU Variasi → Qty (akan DITAMBAHKAN ke stok yang ada)</b>
      </div>
      <textarea id="paste-area-stok"
        style="width:100%;height:160px;font-family:var(--f);font-size:13px;padding:8px;border:2px solid var(--ink);background:var(--cream);resize:vertical;outline:none"
        placeholder="Paste di sini..."></textarea>
      <div id="paste-stok-preview" style="margin-top:10px;display:none">
        <div style="font-size:12px;font-weight:700;color:var(--ink3);margin-bottom:6px" id="paste-stok-count"></div>
        <div class="tbl-wrap" style="max-height:140px;overflow-y:auto">
          <table class="tbl"><thead><tr><th>SKU Variasi</th><th>Stok Masuk</th></tr></thead>
          <tbody id="paste-stok-tbody"></tbody></table>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-sm" onclick="parsePasteStok()"><i class="ti ti-eye"></i> Preview</button>
        <button class="btn btn-primary btn-sm" id="btn-simpan-paste-stok" onclick="simpanPasteStok()" style="display:none"><i class="ti ti-device-floppy"></i> Simpan Semua</button>
        <button class="btn btn-sm" onclick="closeModal('modal-paste-stok')"><i class="ti ti-x"></i> Batal</button>
      </div>
    </div>
  </div>

  <!-- FORM TAMBAH/EDIT STOK MASUK -->
  <!-- Modal Tambah Stok Masuk -->
  <div class="modal-overlay" id="modal-stok-masuk" style="display:none">
    <div class="modal" style="max-width:480px;width:92%">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.07)">
        <div class="modal-title" id="stok-form-title" style="margin:0;border:none;padding:0;font-size:18px">
          <i class="ti ti-plus"></i> Tambah Stok Masuk
        </div>
        <button onclick="cancelStokForm()"
          style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">✕</button>
      </div>

      <input type="hidden" id="inp-id">

      <!-- SKU Variasi -->
      <div class="form-group" style="margin-bottom:12px;position:relative">
        <label>SKU Variasi</label>
        <div style="display:flex;gap:0">
          <input type="text" id="inp-sku" placeholder="Ketik atau pilih SKU..." autocomplete="off"
            oninput="stokSuggestSku()" onfocus="stokSuggestSku()"
            style="flex:1;border-radius:6px 0 0 6px">
          <button onclick="stokToggleSkuFull()"
            style="background:var(--cream3);border:1px solid rgba(255,255,255,0.08);border-left:none;
                   border-radius:0 6px 6px 0;padding:0 12px;cursor:pointer;font-size:14px;color:var(--ink2)">▼</button>
        </div>
        <div id="stok-sku-dropdown"
          style="display:none;position:absolute;top:100%;left:0;right:0;z-index:999;
                 background:var(--cream2);border:1px solid rgba(255,255,255,0.08);border-top:none;
                 max-height:200px;overflow-y:auto;border-radius:0 0 8px 8px;
                 box-shadow:0 8px 24px rgba(0,0,0,0.5)"></div>
      </div>

      <!-- Stok Masuk -->
      <div class="form-group" style="margin-bottom:20px">
        <label>Stok Masuk (Qty)</label>
        <input type="number" id="inp-masuk" placeholder="0" min="0" style="font-size:20px;font-weight:700">
      </div>

      <!-- Tombol -->
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="simpanStok()" style="flex:1">
          <i class="ti ti-device-floppy"></i> Simpan
        </button>
        <button class="btn" onclick="cancelStokForm()" style="min-width:90px">
          <i class="ti ti-x"></i> Batal
        </button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;gap:8px">
      <i class="ti ti-package"></i> Semua SKU
      <span id="stok-summary" style="font-size:12px;color:var(--ink3);font-weight:400;margin-left:auto"></span>
    </div>
    <div id="stok-tbl-wrap" style="overflow-y:auto;overflow-x:auto;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;"><table class="tbl">
      <thead><tr>
        <th>SKU Variasi</th><th>Katalog</th><th>Boss</th>
        <th onclick="stokToggleSort('sisa')" style="cursor:pointer;user-select:none;white-space:nowrap">Sisa <span id="sort-icon-sisa">⇅</span></th>
        <th onclick="stokToggleSort('sales')" style="cursor:pointer;user-select:none;white-space:nowrap">Sales <span id="sort-icon-sales">⇅</span></th>
        <th>HPP</th><th onclick="stokToggleSort('nilai')" style="cursor:pointer;user-select:none;white-space:nowrap">Nilai Stok <span id="sort-icon-nilai">⇅</span></th>
        <th>Status</th><th>Kategori</th><th>Aksi</th>
      </tr></thead>
      <tbody id="stok-tbody">
        <tr><td colspan="10" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
    </div>
  </div>
`;

setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-stok')); }, 80);


// ─── BADGE & HELPER KATEGORI PRODUK ──────────────────────────
function katBadgeStok(kat) {
  var map = {
    aktif:        '<span style="font-size:10px;font-weight:700;color:var(--ok);white-space:nowrap">Aktif</span>',
    discontinued: '<span style="font-size:10px;font-weight:700;color:var(--ink3);white-space:nowrap">Discontinued</span>',
    seasonal:     '<span style="font-size:10px;font-weight:700;color:#c8a000;white-space:nowrap">Seasonal</span>',
    clearance:    '<span style="font-size:10px;font-weight:700;color:var(--danger);white-space:nowrap">Clearance</span>',
  };
  return map[kat||'aktif'] || map['aktif'];
}

async function gantiKategoriStok(produkId, skuNama, katSaat) {
  var opts = [
    { val:'aktif',        label:'✅ Aktif — normal, restock seperti biasa' },
    { val:'discontinued', label:'🚫 Discontinued — tidak produksi lagi, skip restock' },
    { val:'seasonal',     label:'🌙 Seasonal — musiman, skip restock di luar musim' },
    { val:'clearance',    label:'🏷️ Clearance — jual habis stok sisa, tidak restock' },
  ];
  var html = opts.map(function(o) {
    var active = o.val === katSaat;
    return '<div onclick="stokPilihKat(\''+o.val+'\','+produkId+')" style="'+
      'padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px dashed var(--ink4);'+
      'background:'+(active?'var(--ink)':'')+'px;color:'+(active?'var(--cream)':'')+'"' +
      ' onmouseenter="this.style.background=\'var(--cream2)\'" onmouseleave="this.style.background=\''+(active?'var(--ink)':'')+'\'">' +
      o.label + (active?' ✓':'') + '</div>';
  }).join('');
  var modal = document.getElementById('modal-ganti-kat-stok');
  document.getElementById('ganti-kat-title').textContent = skuNama;
  document.getElementById('ganti-kat-opts').innerHTML = html;
  document.getElementById('modal-ganti-kat-stok').style.display = 'flex';
}

async function stokPilihKat(kat, produkId) {
  try {
    await dbUpdate('produk', produkId, { kategori_produk: kat });
    document.getElementById('modal-ganti-kat-stok').style.display = 'none';
    


loadStok();
  } catch(err) { alert('Gagal: ' + err.message); }
}

// ─── STATE ────────────────────────────────────────────────────
let _stokAllData  = [];   // hasil merge produk + stok + jurnal
let _stokMasukMap = {};   // sku -> {id, qty}  (dari tabel stok)
let _produkForStok = [];  // dari tabel produk

// ─── LOAD UTAMA ───────────────────────────────────────────────
async function loadStok() {
  const tbody = document.getElementById('stok-tbody');
  tbody.innerHTML = '<tr><td colspan="11" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>';

  try {
    // 1. Ambil semua produk (basis SKU)
    const produkData = await dbGet('produk', '&order=katalog.asc,sku_variasi.asc');
    _produkForStok = Array.isArray(produkData) ? produkData : [];

    // 2. Ambil semua stok masuk manual
    const stokData = await dbGet('stok');
    _stokMasukMap = {};
    if (Array.isArray(stokData)) {
      stokData.forEach(s => {
        const key = (s.sku_variasi || '').toUpperCase();
        _stokMasukMap[key] = { id: s.id, qty: s.stok_masuk || 0 };
      });
    }

    // 3. Ambil sum keluar dari jurnal_penjualan per SKU
    const jurnalData = await dbGet('jurnal_penjualan', '&select=sku,qty');
    const keluarMap = {};
    if (Array.isArray(jurnalData)) {
      jurnalData.forEach(j => {
        const key = (j.sku || '').toUpperCase();
        keluarMap[key] = (keluarMap[key] || 0) + (j.qty || 0);
      });
    }

    // 4. Merge: semua SKU dari produk sebagai basis
    _stokAllData = _produkForStok.map(p => {
      const skuKey = (p.sku_variasi || '').toUpperCase();
      const masuk  = _stokMasukMap[skuKey] ? _stokMasukMap[skuKey].qty : 0;
      const keluar = keluarMap[skuKey] || 0;
      const sisa   = masuk - keluar;
      return {
        sku_variasi:      p.sku_variasi,
        katalog:          p.katalog,
        boss:             p.boss,
        hpp:              p.hpp || 0,
        kategori_produk:  p.kategori_produk || 'aktif',
        produk_id:        p.id,
        stok_masuk:       masuk,
        stok_keluar:      keluar,
        sisa,
        nilai_stok:       sisa > 0 ? sisa * (p.hpp || 0) : 0,
        _stok_id:         _stokMasukMap[skuKey] ? _stokMasukMap[skuKey].id : null,
      };
    });

    renderStok(_stokAllData);
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="11" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
  }
}

// ─── RENDER ───────────────────────────────────────────────────
function renderStok(data) {
  const tbody = document.getElementById('stok-tbody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="color:var(--ink3);font-style:italic">Belum ada data produk</td></tr>';
    return;
  }

  // Summary
  const totalNilai = data.reduce((s, r) => s + (r.nilai_stok || 0), 0);
  const totalSisa  = data.reduce((s, r) => s + (r.sisa || 0), 0);
  const elSum = document.getElementById('stok-summary');
  if (elSum) elSum.textContent =
    `${data.length} SKU · Sisa: ${totalSisa} pcs · Nilai: Rp${totalNilai.toLocaleString('id-ID')}`;

  tbody.innerHTML = data.map(row => {
    const hpp   = row.hpp   ? `Rp${row.hpp.toLocaleString('id-ID')}` : 'Rp—';
    const nilai = row.nilai_stok > 0 ? `Rp${row.nilai_stok.toLocaleString('id-ID')}` : '—';
    const safeSku = (row.sku_variasi || '').replace(/"/g, '&quot;');
    const kat = row.kategori_produk || 'aktif';
    const isNonAktif = kat !== 'aktif';
    const rowStyle = isNonAktif ? ' style="opacity:0.42"' : '';
    return `<tr${rowStyle}>
      <td><b>${row.sku_variasi || '—'}</b></td>
      <td>${row.katalog || '—'}</td>
      <td>${row.boss || '—'}</td>
      <td style="text-align:center"><b>${row.sisa}</b></td>
      <td style="text-align:center;color:var(--ok)">${row.stok_keluar}</td>
      <td>${hpp}</td>
      <td style="color:var(--ok);font-weight:700">${nilai}</td>
      <td>${statusBadge(row.sisa, kat)}</td>
      <td>${katBadgeStok(kat)}</td>
      <td>
        <button class="btn btn-sm" data-action="ganti-kat" data-id="${row.produk_id}" data-sku="${safeSku}" data-kat="${kat}" style="margin-right:4px" title="Ganti Kategori"><i class="ti ti-tag"></i></button>
        <button class="btn btn-sm" data-action="edit-stok" data-sku="${safeSku}" title="Edit stok masuk"><i class="ti ti-edit"></i></button>
      </td>
    </tr>`;
  }).join('');
  // Re-render rough UI setelah data selesai
  requestAnimationFrame(function() {
    if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-stok'));
  });
}

// ─── FILTER ───────────────────────────────────────────────────
function filterStok() {
  const filtered = _stokAllData.filter(r => {
    if (_filterBoss    && (r.boss    || '') !== _filterBoss)    return false;
    if (_filterKatalog && (r.katalog || '') !== _filterKatalog) return false;
    if (_filterKategoriProduk && (r.kategori_produk || 'aktif') !== _filterKategoriProduk) return false;
    if (_filterStatus) {
      const sisa = r.sisa;
      if (_filterStatus === 'habis'  && !(sisa <= 0))              return false;
      if (_filterStatus === 'kritis' && !(sisa > 0 && sisa <= 3))  return false;
      if (_filterStatus === 'ati2'   && !(sisa > 3 && sisa <= 8))  return false;
      if (_filterStatus === 'aman'   && !(sisa > 8))               return false;
    }
    return true;
  });

  // Apply sort
  if (_stokSort.col) {
    filtered.sort(function(a, b) {
      var va = _stokSort.col === 'sisa'  ? (a.sisa || 0)
             : _stokSort.col === 'sales' ? (a.stok_keluar || 0)
             : (a.nilai_stok || 0);
      var vb = _stokSort.col === 'sisa'  ? (b.sisa || 0)
             : _stokSort.col === 'sales' ? (b.stok_keluar || 0)
             : (b.nilai_stok || 0);
      return _stokSort.dir === 'desc' ? vb - va : va - vb;
    });
  }

  renderStok(filtered);
}

// ─── EVENT DELEGATION ─────────────────────────────────────────
document.getElementById('page-stok').addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'edit-stok') {
    editStok(btn.dataset.sku);
  } else if (btn.dataset.action === 'ganti-kat') {
    gantiKategoriStok(btn.dataset.id, btn.dataset.sku, btn.dataset.kat);
  }
});

// ─── FORM TAMBAH/EDIT ─────────────────────────────────────────
function showTambahStok() {
  document.getElementById('stok-form-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Stok Masuk';
  document.getElementById('inp-id').value    = '';
  document.getElementById('inp-sku').value   = '';
  document.getElementById('inp-masuk').value = '';
  document.getElementById('modal-stok-masuk').style.display = 'flex';
  setTimeout(function(){ document.getElementById('inp-sku').focus(); }, 100);
}

function cancelStokForm() {
  document.getElementById('modal-stok-masuk').style.display = 'none';
  stokTutupDropdown();
}

function editStok(sku) {
  const skuKey = sku.toUpperCase();
  const existing = _stokMasukMap[skuKey];
  document.getElementById('stok-form-title').innerHTML = '<i class="ti ti-edit"></i> Edit Stok Masuk — ' + sku;
  document.getElementById('inp-id').value    = existing ? existing.id : '';
  document.getElementById('inp-sku').value   = sku;
  document.getElementById('inp-masuk').value = existing ? existing.qty : 0;
  document.getElementById('modal-stok-masuk').style.display = 'flex';
  setTimeout(function(){ document.getElementById('inp-masuk').focus(); }, 100);
}

async function simpanStok() {
  const id  = document.getElementById('inp-id').value;
  const sku = document.getElementById('inp-sku').value.trim();
  const qty = parseInt(document.getElementById('inp-masuk').value) || 0;

  if (!sku) { alert('SKU Variasi wajib diisi!'); return; }

  // Cari data produk untuk ambil katalog & boss
  const prod = _produkForStok.find(p =>
    (p.sku_variasi || '').toUpperCase() === sku.toUpperCase()
  );

  const payload = {
    sku_variasi:  sku.toUpperCase(),
    stok_masuk:   qty,
    stok_keluar:  0,
    katalog:      prod ? prod.katalog : '',
    boss:         prod ? prod.boss    : '',
    hpp:          prod ? prod.hpp     : 0,
  };

  try {
    if (id) {
      await dbUpdate('stok', id, { stok_masuk: qty });
    } else {
      await dbInsert('stok', payload);
    }
    cancelStokForm();
    loadStok();
  } catch(err) { alert('Gagal simpan: ' + err.message); }
}

// ─── SKU AUTOCOMPLETE DI FORM ─────────────────────────────────
function stokSuggestSku() {
  const q   = (document.getElementById('inp-sku').value || '').toLowerCase();
  const dd  = document.getElementById('stok-sku-dropdown');
  const list = _produkForStok.filter(p =>
    !q || (p.sku_variasi || '').toLowerCase().includes(q)
  ).slice(0, 30);

  if (!list.length) { dd.style.display = 'none'; return; }
  dd.innerHTML = list.map(p =>
    `<div style="padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px dashed var(--ink4)"
      onmousedown="stokPilihSku('${(p.sku_variasi||'').replace(/'/g,"\\'")}')">
      <b>${p.sku_variasi}</b>
      <span style="color:var(--ink3);font-size:11px;margin-left:6px">${p.katalog || ''}</span>
    </div>`
  ).join('');
  dd.style.display = 'block';
}

function stokToggleSkuFull() {
  document.getElementById('inp-sku').value = '';
  stokSuggestSku();
  document.getElementById('inp-sku').focus();
}

function stokPilihSku(sku) {
  document.getElementById('inp-sku').value = sku;
  stokTutupDropdown();
  document.getElementById('inp-masuk').focus();
}

function stokTutupDropdown() {
  const dd = document.getElementById('stok-sku-dropdown');
  if (dd) dd.style.display = 'none';
}

document.addEventListener('click', function(e) {
  const inp = document.getElementById('inp-sku');
  const dd  = document.getElementById('stok-sku-dropdown');
  if (!inp || !dd) return;
  if (!inp.contains(e.target) && !dd.contains(e.target)) dd.style.display = 'none';
});

// ─── PASTE MASSAL ─────────────────────────────────────────────
function showPasteStok() {
  document.getElementById('paste-area-stok').value = '';
  document.getElementById('paste-stok-preview').style.display = 'none';
  document.getElementById('btn-simpan-paste-stok').style.display = 'none';
  document.getElementById('modal-paste-stok').classList.add('open');
  setTimeout(() => document.getElementById('paste-area-stok').focus(), 100);
}

let _parsedStok = [];

function parsePasteStok() {
  const raw = document.getElementById('paste-area-stok').value.trim();
  if (!raw) { alert('Paste data dulu!'); return; }

  _parsedStok = [];
  const lines = raw.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split('\t').map(c => c.trim());
    if (cols.length < 2) continue;
    const sku = (cols[0] || '').toUpperCase();
    const qty = parseInt((cols[1] || '').replace(/[^0-9]/g, '')) || 0;
    if (!sku) continue;
    _parsedStok.push({ sku_variasi: sku, stok_masuk: qty });
  }

  if (_parsedStok.length === 0) {
    alert('Tidak ada data yang terbaca. Format: SKU Variasi (tab) Qty');
    return;
  }

  document.getElementById('paste-stok-count').textContent =
    `✓ ${_parsedStok.length} SKU siap diimport`;
  document.getElementById('paste-stok-tbody').innerHTML = _parsedStok.map(r =>
    `<tr><td>${r.sku_variasi}</td><td><b>${r.stok_masuk}</b></td></tr>`
  ).join('');
  document.getElementById('paste-stok-preview').style.display = 'block';
  document.getElementById('btn-simpan-paste-stok').style.display = 'inline-block';
}

async function simpanPasteStok() {
  if (_parsedStok.length === 0) return;
  const btn = document.getElementById('btn-simpan-paste-stok');
  btn.textContent = 'Menyimpan...';
  btn.disabled = true;

  try {
    let ok = 0;
    for (const row of _parsedStok) {
      const skuKey = row.sku_variasi.toUpperCase();
      const prod   = _produkForStok.find(p => (p.sku_variasi||'').toUpperCase() === skuKey);
      const existing = _stokMasukMap[skuKey];
      const payload  = {
        sku_variasi: row.sku_variasi,
        stok_masuk:  row.stok_masuk,
        stok_keluar: 0,
        katalog:     prod ? prod.katalog : '',
        boss:        prod ? prod.boss    : '',
        hpp:         prod ? prod.hpp     : 0,
      };
      if (existing) {
        // Mode Tambah: stok_masuk baru = stok lama + qty yang diinput
        const stokBaru = (existing.qty || 0) + row.stok_masuk;
        await dbUpdate('stok', existing.id, { stok_masuk: stokBaru });
      } else {
        await dbInsert('stok', payload);
      }
      ok++;
      btn.textContent = `Menyimpan ${ok}/${_parsedStok.length}...`;
    }
    closeModal('modal-paste-stok');
    loadStok();
    alert(`✓ ${ok} SKU berhasil disimpan!`);
  } catch(err) {
    alert('Gagal simpan: ' + err.message);
  } finally {
    btn.textContent = 'Simpan Semua';
    btn.disabled = false;
  }
}

// exportStok dihapus (tombol Export CSV diringkas)

// ─── FILTER STATE ─────────────────────────────────────────────
// ─── SORT STATE ───────────────────────────────────────────────
var _stokSort = { col: null, dir: 'desc' };

function stokToggleSort(col) {
  if (_stokSort.col === col) {
    _stokSort.dir = _stokSort.dir === 'desc' ? 'asc' : 'desc';
  } else {
    _stokSort.col = col;
    _stokSort.dir = 'desc';
  }
  // Update icons
  ['sisa','sales','nilai'].forEach(function(c) {
    var el = document.getElementById('sort-icon-' + c);
    if (!el) return;
    if (c === col) {
      el.textContent = _stokSort.dir === 'desc' ? '▼' : '▲';
      el.style.color = 'var(--ok)';
    } else {
      el.textContent = '⇅';
      el.style.color = 'var(--ink3)';
    }
  });
  filterStok();
}

let _filterBoss           = null;
let _filterKatalog        = null;
let _filterStatus         = null;
let _filterKategoriProduk = null;

function stokToggleFilterAll() {
  var dd = document.getElementById('dd-filter-all');
  if (!dd) return;
  if (dd.style.display === 'block') {
    // Tutup semua submenu juga
    ['boss','katalog','status'].forEach(function(t) {
      var s = document.getElementById('dd-filter-' + t);
      if (s) s.style.display = 'none';
      var m = document.getElementById('mi-' + t);
      if (m) { m.style.background = ''; m.style.color = ''; }
    });
    dd.style.display = 'none';
    return;
  }
  dd.style.display = 'block';
}

function _miId(type) {
  return type === 'kategori_produk' ? 'mi-kategori-produk' : 'mi-' + type;
}

function stokOpenSub(type, e) {
  if (e) e.stopPropagation();
  var el = document.getElementById(_miId(type));
  if (!el) return;

  // Tutup semua submenu lain, reset highlight
  ['boss','katalog','status','kategori_produk'].forEach(function(t) {
    if (t !== type) {
      var s = document.getElementById('dd-filter-' + t);
      if (s) s.style.display = 'none';
      var m = document.getElementById(_miId(t));
      if (m) { m.style.background = ''; m.style.color = ''; }
    }
  });

  // Highlight item aktif
  el.style.background = 'var(--ink)';
  el.style.color = 'var(--cream)';

  // Render isi submenu dulu, posisi dihitung setelah innerHTML diisi
  var sub = document.getElementById('dd-filter-' + type);
  if (!sub) return;
  var rect = el.getBoundingClientRect();

  var opsi = [];
  if (type === 'boss') {
    opsi = [{ val: null, label: 'Semua Supplier' }].concat(
      [...new Set(_stokAllData.map(function(r){ return r.boss||''; }).filter(Boolean))].sort()
      .map(function(v){ return { val: v, label: v }; })
    );
  } else if (type === 'katalog') {
    opsi = [{ val: null, label: 'Semua SKU Induk' }].concat(
      [...new Set(_stokAllData.map(function(r){ return r.katalog||''; }).filter(Boolean))].sort()
      .map(function(v){ return { val: v, label: v }; })
    );
  } else if (type === 'status') {
    opsi = [
      { val: null,     label: 'Semua Status' },
      { val: 'habis',  label: '🔴 Habis' },
      { val: 'kritis', label: '🟠 Kritis' },
      { val: 'ati2',   label: '🟡 Ati2' },
      { val: 'aman',   label: '🟢 Aman' },
    ];
  } else if (type === 'kategori_produk') {
    opsi = [
      { val: null,           label: 'Semua Kategori' },
      { val: 'aktif',        label: '✅ Aktif' },
      { val: 'discontinued', label: '🚫 Discontinued' },
      { val: 'seasonal',     label: '🌙 Seasonal' },
      { val: 'clearance',    label: '🏷️ Clearance' },
    ];
  }

  var currVal = type === 'boss' ? _filterBoss : type === 'katalog' ? _filterKatalog : type === 'kategori_produk' ? _filterKategoriProduk : _filterStatus;
  sub.innerHTML = opsi.map(function(o) {
    var active = o.val === currVal;
    var valAttr = o.val === null ? '' : o.val;
    return '<div data-filter-type="' + type + '" data-filter-val="' + valAttr + '" data-filter-isnull="' + (o.val === null ? '1' : '0') + '"' +
      ' style="padding:8px 14px;cursor:pointer;font-size:13px;' +
      'background:' + (active ? 'var(--ink)' : 'transparent') + ';' +
      'color:' + (active ? 'var(--cream)' : 'inherit') + ';' +
      'border-bottom:1px solid rgba(255,255,255,0.04);border-radius:4px;margin:1px 4px;transition:background .12s"' +
      ' onmouseover="this.style.background=\'var(--cream3)\'" onmouseout="this.style.background=\'' + (active ? 'var(--ink)' : 'transparent') + '\'">' + o.label + '</div>';
  }).join('');
  // Posisi: hitung setelah innerHTML diisi agar bisa ukur lebar
  sub.style.position = 'fixed';
  sub.style.top = rect.top + 'px';
  sub.style.left = '';
  sub.style.display = 'block';
  var subW = sub.offsetWidth || 200;
  var spaceRight = window.innerWidth - rect.right;
  if (spaceRight >= subW + 4) {
    sub.style.left = (rect.right + 4) + 'px';
  } else {
    var ddAll = document.getElementById('dd-filter-all');
    var ddRect = ddAll ? ddAll.getBoundingClientRect() : rect;
    sub.style.left = Math.max(4, ddRect.left - subW - 4) + 'px';
  }

  // Event listener langsung (bukan inline onclick) agar tidak ada masalah escaping
  Array.from(sub.querySelectorAll('[data-filter-type]')).forEach(function(el) {
    el.addEventListener('click', function(ev) {
      ev.stopPropagation();
      var t   = el.getAttribute('data-filter-type');
      var val = el.getAttribute('data-filter-isnull') === '1' ? null : el.getAttribute('data-filter-val');
      stokSetFilter(t, val);
    });
  });
}

function stokResetAllFilter() {
  _filterBoss           = null;
  _filterKatalog        = null;
  _filterStatus         = null;
  _filterKategoriProduk = null;
  ['boss','katalog','status','kategori_produk'].forEach(function(t) {
    var b = document.getElementById('badge-' + t);
    if (b) b.textContent = '';
    var s = document.getElementById('dd-filter-' + t);
    if (s) s.style.display = 'none';
    var m = document.getElementById('mi-' + t);
    if (m) { m.style.background = ''; m.style.color = ''; }
  });
  _stokUpdateFilterLabel();
  document.getElementById('dd-filter-all').style.display = 'none';
  filterStok();
}

function _stokUpdateFilterLabel() {
  var parts = [];
  if (_filterBoss)           parts.push(_filterBoss);
  if (_filterKatalog)        parts.push(_filterKatalog);
  if (_filterStatus)         parts.push(_filterStatus.charAt(0).toUpperCase() + _filterStatus.slice(1));
  if (_filterKategoriProduk) parts.push(_filterKategoriProduk.charAt(0).toUpperCase() + _filterKategoriProduk.slice(1));
  var lbl = document.getElementById('lbl-filter-all');
  if (lbl) lbl.textContent = parts.length ? parts.join(', ') : 'Filter';
  var btn = document.getElementById('btn-filter-all');
  if (btn) {
    btn.style.background = parts.length ? 'var(--ink)' : '';
    btn.style.color      = parts.length ? 'var(--cream)' : '';
  }
  // Tampilkan/sembunyikan tombol Reset luar
  var resetBtn = document.getElementById('btn-stok-reset');
  if (resetBtn) resetBtn.style.display = parts.length ? 'inline-flex' : 'none';
}

function stokSetFilter(type, val) {
  if (type === 'boss')            _filterBoss           = val;
  if (type === 'katalog')         _filterKatalog        = val;
  if (type === 'status')          _filterStatus         = val;
  if (type === 'kategori_produk') _filterKategoriProduk = val;

  // Update badge di menu item
  var lblMap = { habis:'Habis', kritis:'Kritis', ati2:'Ati2', aman:'Aman' };
  var badgeEl = document.getElementById('badge-' + type);
  if (badgeEl) {
    var bLabel = '';
    if (type === 'status' && val) bLabel = '· ' + lblMap[val];
    else if (val) bLabel = '· ' + val;
    badgeEl.textContent = bLabel;
  }

  // Tutup semua submenu dan main dropdown secara langsung
  // (jangan pakai stokToggleFilterAll() karena bisa toggle arah salah)
  ['boss','katalog','status','kategori_produk'].forEach(function(t) {
    var s = document.getElementById('dd-filter-' + t);
    if (s) s.style.display = 'none';
    var m = document.getElementById(_miId(t));
    if (m) { m.style.background = ''; m.style.color = ''; }
  });
  var dd = document.getElementById('dd-filter-all');
  if (dd) dd.style.display = 'none';

  _stokUpdateFilterLabel();
  filterStok();
}

document.addEventListener('click', function(e) {
  var dd  = document.getElementById('dd-filter-all');
  var btn = document.getElementById('btn-filter-all');
  var subs = ['dd-filter-boss','dd-filter-katalog','dd-filter-status','dd-filter-kategori_produk'];
  // Cek apakah klik di dalam salah satu submenu
  var inSub = subs.some(function(id) {
    var s = document.getElementById(id);
    return s && s.contains(e.target);
  });
  if (inSub) return; // jangan tutup kalau klik di submenu
  // Cek apakah klik di dalam main menu items (mi-boss, mi-katalog, mi-status)
  var inMenuItem = ['mi-boss','mi-katalog','mi-status','mi-kategori-produk'].some(function(id) {
    var m = document.getElementById(id);
    return m && m.contains(e.target);
  });
  if (inMenuItem) return; // biarkan stokOpenSub yang handle
  if (dd && dd.style.display === 'block') {
    if (!dd.contains(e.target) && btn && !btn.contains(e.target)) {
      // Tutup semua submenu
      subs.forEach(function(id) {
        var s = document.getElementById(id);
        if (s) s.style.display = 'none';
      });
      ['boss','katalog','status'].forEach(function(t) {
        var m = document.getElementById('mi-' + t);
        if (m) { m.style.background = ''; m.style.color = ''; }
      });
      dd.style.display = 'none';
    }
  }
});





// ─── MODAL GANTI KATEGORI ─────────────────────────────────────
document.body.insertAdjacentHTML('beforeend', `
<div id="modal-ganti-kat-stok" style="display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.5);align-items:center;justify-content:center">
  <div style="background:var(--cream);border:2px solid var(--ink);max-width:380px;width:90%;box-shadow:4px 4px 0 var(--ink4)">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:2px dashed var(--ink3)">
      <div style="font-weight:700;font-size:15px"><i class="ti ti-tag"></i> Kategori — <span id="ganti-kat-title"></span></div>
      <button onclick="document.getElementById('modal-ganti-kat-stok').style.display='none'" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink3)">&#10005;</button>
    </div>
    <div id="ganti-kat-opts"></div>
  </div>
</div>`);

loadStok();
