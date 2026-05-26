function katBadgeProduk(kat) {
  var map = {
    aktif:        '<span style="font-size:11px;font-weight:700;color:var(--ok);padding:2px 6px;border:1.5px solid var(--ok);border-radius:2px">Aktif</span>',
    discontinued: '<span style="font-size:11px;font-weight:700;color:var(--ink3);padding:2px 6px;border:1.5px solid var(--ink3);border-radius:2px">Discontinued</span>',
    seasonal:     '<span style="font-size:11px;font-weight:700;color:#c8a000;padding:2px 6px;border:1.5px solid #c8a000;border-radius:2px">Seasonal</span>',
    clearance:    '<span style="font-size:11px;font-weight:700;color:var(--danger);padding:2px 6px;border:1.5px solid var(--danger);border-radius:2px">Clearance</span>',
  };
  return map[kat] || map['aktif'];
}

// ─── PRODUK.JS — Kelola Produk (master SKU + paste massal) ───

document.getElementById('page-produk').innerHTML = `
  <div id="ops-switcher-produk" class="ch-switcher"></div>

  <div id="produk-toolbar" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
    <button class="btn btn-sm btn-primary" onclick="showFormProduk()"><i class="ti ti-plus"></i> Tambah SKU</button>
    <button class="btn btn-sm" onclick="showPasteProduk()"><i class="ti ti-clipboard"></i> Paste Massal</button>
    <button class="btn btn-sm" onclick="loadProduk()"><i class="ti ti-refresh"></i> Refresh</button>
    <button class="btn btn-sm" onclick="exportProduk()"><i class="ti ti-download"></i> Export CSV</button>
  </div>

  <!-- FORM TAMBAH/EDIT SKU -->

  <!-- MODAL PASTE MASSAL -->
  <div class="modal-overlay" id="modal-paste-produk">
    <div class="modal" style="max-width:520px">
      <div class="modal-title"><i class="ti ti-clipboard"></i> Paste Massal SKU</div>
      <div style="font-size:12px;color:var(--ink3);margin-bottom:10px;line-height:1.6">
        Copy dari Excel lalu paste di bawah.<br>
        Urutan kolom: <b>Katalog → SKU Variasi → HPP → Boss</b>
      </div>
      <textarea id="paste-area-produk"
        style="width:100%;height:180px;font-family:var(--f);font-size:13px;padding:8px;border:2px solid var(--ink);background:var(--cream);resize:vertical;outline:none"
        placeholder="Paste di sini..."></textarea>
      <div id="paste-produk-preview" style="margin-top:10px;display:none">
        <div style="font-size:12px;font-weight:700;color:var(--ink3);margin-bottom:6px" id="paste-produk-count"></div>
        <div class="tbl-wrap" style="max-height:160px;overflow-y:auto">
          <table class="tbl"><thead><tr><th>Katalog</th><th>SKU Variasi</th><th>HPP</th><th>Boss</th></tr></thead>
          <tbody id="paste-produk-tbody"></tbody></table>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-sm" onclick="parsePasteProduk()"><i class="ti ti-eye"></i> Preview</button>
        <button class="btn btn-primary btn-sm" id="btn-simpan-paste-produk" onclick="simpanPasteProduk()" style="display:none"><i class="ti ti-check"></i> Simpan Semua</button>
        <button class="btn btn-sm" onclick="closeModal('modal-paste-produk')">Batal</button>
      </div>
    </div>
  </div>

  <!-- TOOLBAR SELEKSI -->
  <div id="produk-select-bar" style="display:none;margin-bottom:8px;padding:8px 12px;background:var(--ink);color:var(--cream);display:none;align-items:center;gap:10px;flex-wrap:wrap">
    <span id="produk-select-count" style="font-size:13px;font-weight:700"></span>
    <button class="btn btn-sm" onclick="produkHapusTerpilih()" style="background:var(--danger);color:#fff;border-color:var(--danger)">
      <i class="ti ti-trash"></i> Hapus yang Dipilih
    </button>
    <button class="btn btn-sm" onclick="produkClearSelect()" style="background:none;color:var(--cream);border-color:rgba(255,255,255,0.4);margin-left:auto">
      <i class="ti ti-x"></i> Batal
    </button>
  </div>

  <!-- TABEL PRODUK GROUP BY KATALOG -->
  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span><i class="ti ti-package"></i> Master SKU Produk</span>
      <input type="text" id="produk-search" placeholder="Cari SKU / katalog..."
        style="font-family:var(--f);font-size:13px;padding:4px 8px;border:2px solid var(--ink);background:var(--cream);width:180px"
        oninput="filterProduk()">
    </div>
    <div class="tbl-wrap" style="overflow-x:auto;overscroll-behavior:none;touch-action:pan-x pan-y">
      <table class="tbl">
        <thead><tr>
          <th style="width:24px"></th>
          <th>SKU Variasi</th>
          <th>HPP</th>
          <th>Boss</th>
          <th>Kategori</th>
          <th>Aksi</th>
        </tr></thead>
        <tbody id="produk-tbody">
          <tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
`;

// render sketchy UI untuk halaman produk setelah innerHTML siap
setTimeout(() => {
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-produk'));
  _produkEnsureFlexLayout();
}, 80);

function _produkEnsureFlexLayout() {
  var pg = document.getElementById('page-produk');
  if (!pg || !pg.classList.contains('active')) return;
  var contentEl = document.querySelector('.content');
  if (contentEl) {
    contentEl.style.overflowY = 'hidden';
    contentEl.style.padding   = '0';
    contentEl.style.height    = '100%';
  }
}
window.addEventListener('resize', function() {
  var pg = document.getElementById('page-produk');
  if (pg && pg.classList.contains('active')) _produkEnsureFlexLayout();
});
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'produk') return;
  setTimeout(_produkEnsureFlexLayout, 60);
  // Reload data otomatis saat navigasi ke halaman ini (debounce 250ms)
  clearTimeout(window._produkReloadTimer);
  window._produkReloadTimer = setTimeout(loadProduk, 250);
});

let _produkData = [];

async function loadProduk() {
  const tbody = document.getElementById('produk-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>';
  try {
    const data = await dbGet('produk');
    // Supabase kadang return object error bukan array
    if (!Array.isArray(data)) {
      const msg = data?.message || data?.hint || JSON.stringify(data);
      tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger)">
        ⚠️ Tabel <b>produk</b> belum ada di Supabase.<br>
        <span style="font-size:12px;color:var(--ink3)">Buat dulu di Supabase → Table Editor → New Table → nama: <b>produk</b><br>
        Kolom: id (int8 PK), katalog (text), sku_variasi (text), hpp (int8), boss (text), created_at (timestamptz default now())</span>
      </td></tr>`;
      return;
    }
    _produkData = data;
    renderProduk(_produkData);
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
  }
}

// ─── STATE EXPAND & SELECT ────────────────────────────────────
var _produkExpanded = {}; // katalog → true/false
var _produkSelected = {}; // id → true/false

function renderProduk(data) {
  const tbody = document.getElementById('produk-tbody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada data produk</td></tr>';
    return;
  }

  // Group by katalog
  const groups = {};
  data.forEach(row => {
    const kat = row.katalog || '—';
    if (!groups[kat]) groups[kat] = [];
    groups[kat].push(row);
  });

  let html = '';
  Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])).forEach(([kat, rows]) => {
    const expanded = _produkExpanded[kat] === true; // default collapsed
    const triangle = expanded ? '▼' : '▶';
    const hpp      = rows[0] ? rows[0].hpp || 0 : 0;
    const boss     = rows[0] ? rows[0].boss || '—' : '—';
    const kat_prd  = rows[0] ? rows[0].kategori_produk || 'aktif' : 'aktif';
    const allIds   = rows.map(r => r.id).join(',');
    const allSelected = rows.every(r => _produkSelected[r.id]);

    // Header katalog
    html += `<tr style="background:var(--cream2);cursor:pointer" data-kat-header="${kat}">
      <td style="text-align:center;padding:6px 4px">
        <input type="checkbox" ${allSelected ? 'checked' : ''} onclick="event.stopPropagation();produkToggleKatalog('${kat.replace(/'/g,"\'")}',this.checked)" style="cursor:pointer">
      </td>
      <td colspan="3" onclick="produkToggleExpand('${kat.replace(/'/g,"\'")}')">
        <span style="font-size:13px;margin-right:6px;color:var(--ink3)">${triangle}</span>
        <b style="font-size:14px">${kat}</b>
        <span style="font-size:11px;color:var(--ink3);margin-left:8px">${rows.length} varian</span>
      </td>
      <td>${katBadgeProduk(kat_prd)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm" data-action="edit-katalog" data-kat="${kat}" data-hpp="${hpp}" data-boss="${boss}" data-katprd="${kat_prd}" title="Edit semua varian katalog ini" style="margin-right:4px">
          <i class="ti ti-edit"></i>
        </button>
      </td>
    </tr>`;

    // Baris varian (hanya tampil jika expanded)
    if (expanded) {
      rows.forEach(row => {
        const safeSku = (row.sku_variasi||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        const checked = _produkSelected[row.id] ? 'checked' : '';
        html += `<tr data-kat="${kat}" style="background:var(--cream)">
          <td style="text-align:center;padding:6px 4px">
            <input type="checkbox" ${checked} data-id="${row.id}" onchange="produkToggleSelect(${row.id},this.checked)" style="cursor:pointer">
          </td>
          <td style="padding-left:24px"><b>${row.sku_variasi}</b></td>
          <td>Rp${(row.hpp||0).toLocaleString('id-ID')}</td>
          <td>${row.boss || '—'}</td>
          <td>${katBadgeProduk(row.kategori_produk || 'aktif')}</td>
          <td></td>
        </tr>`;
      });
    }
  });

  tbody.innerHTML = html;
  produkUpdateSelectBar();

  // Re-render rough UI setelah data selesai
  requestAnimationFrame(function() {
    if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-produk'));
  });
}

function produkToggleExpand(kat) {
  _produkExpanded[kat] = !(_produkExpanded[kat] !== false);
  renderProduk(_produkData);
}

function produkToggleSelect(id, checked) {
  if (checked) _produkSelected[id] = true;
  else delete _produkSelected[id];
  produkUpdateSelectBar();
}

function produkToggleKatalog(kat, checked) {
  _produkData.filter(r => (r.katalog||'—') === kat).forEach(r => {
    if (checked) _produkSelected[r.id] = true;
    else delete _produkSelected[r.id];
  });
  renderProduk(_produkData);
}

function produkClearSelect() {
  _produkSelected = {};
  renderProduk(_produkData);
}

function produkUpdateSelectBar() {
  const count = Object.keys(_produkSelected).length;
  const bar   = document.getElementById('produk-select-bar');
  const lbl   = document.getElementById('produk-select-count');
  if (!bar) return;
  bar.style.display = count > 0 ? 'flex' : 'none';
  if (lbl) lbl.textContent = count + ' SKU dipilih';
}

async function produkHapusTerpilih() {
  const ids = Object.keys(_produkSelected).map(Number);
  if (!ids.length) return;
  const skus = _produkData.filter(r => ids.includes(r.id)).map(r => r.sku_variasi).join(', ');
  confirmDelete(`Hapus ${ids.length} SKU?
${skus.slice(0,120)}...`, async () => {
    try {
      for (const id of ids) { await dbDelete('produk', id); }
      _produkSelected = {};
      loadProduk();
    } catch(err) { alert('Gagal hapus: ' + err.message); }
  });
}

// Edit per katalog (update semua varian)
async function editKatalog(kat, hpp, boss, katPrd) {
  document.getElementById('kat-edit-nama').textContent = kat;
  idrSet('kat-hpp', hpp);
  document.getElementById('kat-boss').value = boss;
  document.getElementById('kat-kategori').value = katPrd || 'aktif';
  showModal('modal-edit-katalog');
}

async function simpanEditKatalog() {
  var kat     = document.getElementById('kat-edit-nama').textContent;
  var hpp     = idrVal('kat-hpp');
  var boss    = document.getElementById('kat-boss').value.trim().toUpperCase();
  var katPrd  = document.getElementById('kat-kategori').value || 'aktif';
  var rows    = _produkData.filter(r => (r.katalog||'—') === kat);
  if (!rows.length) { hideModal('modal-edit-katalog'); return; }
  try {
    for (const r of rows) {
      await dbUpdate('produk', r.id, { hpp: hpp, boss: boss, kategori_produk: katPrd });
    }
    hideModal('modal-edit-katalog');
    loadProduk();
  } catch(err) { alert('Gagal simpan: ' + err.message); }
}

function filterProduk() {
  const q = document.getElementById('produk-search').value.toLowerCase();
  const filtered = _produkData.filter(r =>
    (r.sku_variasi||'').toLowerCase().includes(q) ||
    (r.katalog||'').toLowerCase().includes(q) ||
    (r.boss||'').toLowerCase().includes(q)
  );
  renderProduk(filtered);
}

function showFormProduk() {
  document.getElementById('produk-form-title').innerHTML = '<i class="ti ti-plus"></i> Tambah SKU';
  document.getElementById('prd-id').value = '';
  document.getElementById('prd-katalog').value = '';
  document.getElementById('prd-sku').value = '';
  idrSet('prd-hpp', 0);
  document.getElementById('prd-boss').value = '';
  document.getElementById('prd-kategori').value = 'aktif';
  showModal('modal-produk');
  document.getElementById('form-produk').scrollIntoView({behavior:'smooth'});
  sketchForm('form-produk');
}

function cancelFormProduk() {
  hideModal('modal-produk');
}

async function editProduk(id) {
  const r = _produkData.find(d => d.id == id);  // == agar string '123' cocok dengan bigint 123
  if (!r) return;
  document.getElementById('produk-form-title').innerHTML = '<i class="ti ti-edit"></i> Edit SKU';
  document.getElementById('prd-id').value      = r.id;
  document.getElementById('prd-katalog').value = r.katalog || '';
  document.getElementById('prd-sku').value     = r.sku_variasi || '';
  idrSet('prd-hpp', r.hpp || 0);
  document.getElementById('prd-boss').value     = r.boss || '';
  document.getElementById('prd-kategori').value = r.kategori_produk || 'aktif';
  showModal('modal-produk');
  sketchForm('form-produk');
  document.getElementById('form-produk').scrollIntoView({behavior:'smooth'});
}

async function simpanProduk() {
  const id = document.getElementById('prd-id').value;
  const data = {
    katalog:     document.getElementById('prd-katalog').value.trim().toUpperCase(),
    sku_variasi: document.getElementById('prd-sku').value.trim(),
    hpp:         idrVal('prd-hpp'),
    boss:        document.getElementById('prd-boss').value.trim().toUpperCase(),
    kategori_produk: document.getElementById('prd-kategori').value || 'aktif',
  };
  if (!data.sku_variasi) { alert('SKU Variasi wajib diisi!'); return; }
  try {
    if (id) { await dbUpdate('produk', id, data); }
    else    { await dbInsert('produk', data); }
    cancelFormProduk();
    loadProduk();
  } catch(err) { alert('Gagal simpan: ' + err.message); }
}

async function hapusProduk(id, sku) {
  confirmDelete(`Hapus SKU "${sku}"?`, async () => {
    try { await dbDelete('produk', id); loadProduk(); }
    catch(err) { alert('Gagal hapus: ' + err.message); }
  });
}

// ─── PASTE MASSAL ─────────────────────────────────────────────
function showPasteProduk() {
  document.getElementById('paste-area-produk').value = '';
  document.getElementById('paste-produk-preview').style.display = 'none';
  document.getElementById('btn-simpan-paste-produk').style.display = 'none';
  document.getElementById('modal-paste-produk').classList.add('open');
  setTimeout(() => document.getElementById('paste-area-produk').focus(), 100);
}

let _parsedProduk = [];

function parsePasteProduk() {
  const raw = document.getElementById('paste-area-produk').value.trim();
  if (!raw) { alert('Paste data dulu!'); return; }

  _parsedProduk = [];
  const lines = raw.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    // Split by tab (dari Excel) atau multiple spaces
    const cols = line.split('\t').map(c => c.trim());

    // Minimal 2 kolom (katalog + sku)
    if (cols.length < 2) continue;

    const katalog = cols[0] || '';
    const sku     = cols[1] || '';
    const hpp     = parseInt((cols[2]||'').replace(/[^0-9]/g,'')) || 0;
    const boss    = (cols[3]||'').trim().toUpperCase();

    if (!sku) continue;
    _parsedProduk.push({ katalog: katalog.toUpperCase(), sku_variasi: sku, hpp, boss });
  }

  if (_parsedProduk.length === 0) {
    alert('Tidak ada data yang bisa dibaca. Pastikan copy dari Excel dengan format: Katalog → SKU → HPP → Boss');
    return;
  }

  // Render preview
  document.getElementById('paste-produk-count').textContent =
    `✓ ${_parsedProduk.length} SKU siap diimport`;
  document.getElementById('paste-produk-tbody').innerHTML = _parsedProduk.map(r => `
    <tr>
      <td>${r.katalog}</td>
      <td>${r.sku_variasi}</td>
      <td>Rp${r.hpp.toLocaleString('id-ID')}</td>
      <td>${r.boss||'—'}</td>
    </tr>`).join('');
  document.getElementById('paste-produk-preview').style.display = 'block';
  document.getElementById('btn-simpan-paste-produk').style.display = 'inline-block';
}

async function simpanPasteProduk() {
  if (_parsedProduk.length === 0) return;
  const btn = document.getElementById('btn-simpan-paste-produk');
  btn.textContent = 'Menyimpan...';
  btn.disabled = true;

  try {
    // Insert satu per satu (Supabase REST tidak support bulk insert via anon key easily)
    let ok = 0;
    for (const row of _parsedProduk) {
      await dbInsert('produk', row);
      ok++;
      btn.textContent = `Menyimpan ${ok}/${_parsedProduk.length}...`;
    }
    closeModal('modal-paste-produk');
    loadProduk();
    alert(`✓ ${ok} SKU berhasil disimpan!`);
  } catch(err) {
    alert('Gagal simpan: ' + err.message);
  } finally {
    btn.textContent = 'Simpan Semua';
    btn.disabled = false;
  }
}

async function exportProduk() {
  if (_produkData.length === 0) { alert('Belum ada data'); return; }
  exportCSV('zenoot-produk.csv',
    ['Katalog','SKU Variasi','HPP','Boss'],
    _produkData.map(r => [r.katalog, r.sku_variasi, r.hpp, r.boss])
  );
}

loadProduk();

// ─── EVENT DELEGATION untuk tombol edit/hapus di tabel produk ──
document.getElementById('page-produk').addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id     = parseInt(btn.dataset.id);  // produk.id = bigint, harus parseInt
  if (action === 'edit-prd') {
    editProduk(id);
  } else if (action === 'hapus-prd') {
    const sku = btn.dataset.sku;
    hapusProduk(id, sku);
  } else if (action === 'edit-katalog') {
    editKatalog(btn.dataset.kat, btn.dataset.hpp, btn.dataset.boss, btn.dataset.katprd);
  }
});

document.body.insertAdjacentHTML('beforeend', `<div class="modal-overlay" id="modal-edit-katalog" onclick="if(event.target===this)hideModal('modal-edit-katalog')">
  <div class="modal" style="max-width:420px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px">
        <i class="ti ti-edit"></i> Edit Katalog — <span id="kat-edit-nama" style="color:var(--accent)"></span>
      </div>
      <button onclick="hideModal('modal-edit-katalog')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <p style="font-size:12px;color:var(--ink3);margin-bottom:12px">Perubahan akan diterapkan ke <b>semua varian</b> dalam katalog ini.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 120px"><label>HPP (Rp)</label><input type="text" inputmode="numeric" id="kat-hpp" placeholder="0"></div>
      <div class="form-group" style="flex:1 1 120px"><label>Boss</label><input type="text" id="kat-boss" placeholder="mis: ALAN"></div>
    </div>
    <div class="form-group" style="margin-bottom:14px">
      <label>Kategori Produk</label>
      <select id="kat-kategori" style="font-family:var(--f);font-size:13px;padding:5px 8px;border:2px solid var(--ink);background:var(--cream);width:100%">
        <option value="aktif">✅ Aktif</option>
        <option value="discontinued">🚫 Discontinued</option>
        <option value="seasonal">🌙 Seasonal</option>
        <option value="clearance">🏷️ Clearance</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="simpanEditKatalog()"><i class="ti ti-device-floppy"></i> Simpan Semua Varian</button>
      <button class="btn btn-sm" onclick="hideModal('modal-edit-katalog')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>`);

document.body.insertAdjacentHTML('beforeend', `<div class="modal-overlay" id="modal-produk" onclick="if(event.target===this)hideModal('modal-produk')">
  <div class="modal" style="max-width:480px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" id="produk-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-plus"></i> Tambah SKU</div>
      <button onclick="hideModal('modal-produk')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="prd-id">
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 140px"><label>Katalog</label><input type="text" id="prd-katalog" placeholder="mis: TURTLENECK"></div>
      <div class="form-group" style="flex:1 1 140px"><label>SKU Variasi</label><input type="text" id="prd-sku" placeholder="mis: Turtleneck_HITAM-M"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 120px"><label>HPP (Rp)</label><input type="text" inputmode="numeric" id="prd-hpp" placeholder="0"></div>
      <div class="form-group" style="flex:1 1 120px"><label>Boss</label><input type="text" id="prd-boss" placeholder="mis: ALAN"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 200px">
        <label>Kategori Produk</label>
        <select id="prd-kategori" style="font-family:var(--f);font-size:13px;padding:5px 8px;border:2px solid var(--ink);background:var(--cream);width:100%">
          <option value="aktif">✅ Aktif</option>
          <option value="discontinued">🚫 Discontinued</option>
          <option value="seasonal">🌙 Seasonal</option>
          <option value="clearance">🏷️ Clearance</option>
        </select>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="simpanProduk()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-produk')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>`);
// ─── SWIPE GESTURE — collapse ops-switcher di landscape touch ────────
(function() {
  var _mq = window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: landscape)');
  function _init() {
    if (!_mq.matches) return;
    var cardTitle = document.querySelector('#page-produk .card-title');
    var sw        = document.getElementById('ops-switcher-produk');
    if (!sw) return;
    // 2 zona: card-title + switcher, collapse target = switcher
    if (cardTitle) initSwipeCollapse(cardTitle, sw, 50);
    initSwipeCollapse(sw, sw, 50);
  }
  setTimeout(_init, 300);
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'produk') return;
    setTimeout(function() {
      var sw = document.getElementById('ops-switcher-produk');
      if (sw) sw.classList.remove('landscape-collapsed');
      _init();
    }, 80);
  });
})();
