// ─── CHANNEL-MASTER.JS v2 — Master Data Channel + Beban Per Channel ──
// Setiap channel punya % Beban & NPM sendiri → tabel channel_beban
// Halaman Beban Operasional sudah dihapus, setting harga ada di sini

document.getElementById('page-channel').innerHTML = `

  <!-- ══ TAB NAVIGATION ══ -->
  <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid var(--ink)">
    <button id="ch-tab-channel" onclick="chSwitchTab('channel')"
      style="padding:8px 20px;font-family:var(--f);font-size:13px;font-weight:700;border:2px solid var(--ink);border-bottom:none;background:var(--ink);color:var(--cream);cursor:pointer;margin-bottom:-2px">
      <i class="ti ti-antenna"></i> Channel
    </button>

    <button id="ch-tab-supplier" onclick="chSwitchTab('supplier')"
      style="padding:8px 20px;font-family:var(--f);font-size:13px;font-weight:700;border:2px solid var(--ink);border-bottom:none;border-left:none;background:var(--cream);color:var(--ink);cursor:pointer;margin-bottom:-2px">
      <i class="ti ti-truck"></i> Supplier &amp; ROP
    </button>
  </div>

  <!-- ══ TAB: CHANNEL MASTER ══ -->
  <div id="ch-tab-content-channel">

    <div style="margin-bottom:14px;padding:10px 14px;background:var(--cream2);border:2px dashed var(--ink3);border-radius:4px;font-size:13px;color:var(--ink2);line-height:1.7">
      <b>Master Data Channel</b> — sumber data global untuk seluruh aplikasi.<br>
      Setiap channel bisa punya <b>% Beban &amp; NPM</b> sendiri untuk kalkulasi harga otomatis di Price List.
    </div>

    <!-- SHOPEE -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="display:inline-flex;align-items:center;gap:7px">
          <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
            <rect x="8" y="28" width="84" height="64" rx="10" fill="currentColor"/>
            <path d="M34 28 C34 14 66 14 66 28" stroke="currentColor" stroke-width="7" fill="none" stroke-linecap="round"/>
            <path d="M58 44C58 39.6 54.4 36 50 36C45.6 36 42 39.6 42 44C42 48.4 45.6 52 50 52C54.4 52 58 55.6 58 60C58 64.4 54.4 68 50 68C45.6 68 42 64.4 42 60" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="50" y1="33" x2="50" y2="38" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <line x1="50" y1="67" x2="50" y2="72" stroke="white" stroke-width="5" stroke-linecap="round"/>
          </svg>
          Shopee
        </span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="showEditKategori('toko_utama','Shopee')"><i class="ti ti-adjustments"></i> Edit Kategori</button>
          <button class="btn btn-sm btn-primary" onclick="showFormChannel('toko_utama')"><i class="ti ti-plus"></i> Tambah</button>
        </div>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Nama Channel</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th style="text-align:center">Multiplier</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-toko_utama"><tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table></div>
    </div>

    <!-- RESELLER -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="display:inline-flex;align-items:center;gap:6px"><i class="ti ti-users" style="font-size:16px"></i> Reseller</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="showEditKategori('reseller','Reseller')"><i class="ti ti-adjustments"></i> Edit Kategori</button>
          <button class="btn btn-sm btn-primary" onclick="showFormChannel('reseller')"><i class="ti ti-plus"></i> Tambah</button>
        </div>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Nama Reseller</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th style="text-align:center">Multiplier</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-reseller"><tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table></div>
    </div>

    <!-- LAZADA -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span><i class="ti ti-shopping-bag"></i> Lazada</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="showEditKategori('lazada','Lazada')"><i class="ti ti-adjustments"></i> Edit Kategori</button>
          <button class="btn btn-sm btn-primary" onclick="showFormChannel('lazada')"><i class="ti ti-plus"></i> Tambah</button>
        </div>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Nama Toko Lazada</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th style="text-align:center">Multiplier</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-lazada"><tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table></div>
    </div>

    <!-- TIKTOK -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="display:inline-flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 40 40" fill="none" style="flex-shrink:0"><path d="M26 6c0 4.4 3.6 8 8 8v5c-3 0-5.8-1-8-2.7V26c0 6.1-4.9 11-11 11S4 32.1 4 26s4.9-11 11-11c.6 0 1.1 0 1.6.1v5.5c-.5-.1-1.1-.1-1.6-.1-3 0-5.5 2.5-5.5 5.5s2.5 5.5 5.5 5.5 5.5-2.5 5.5-5.5V6h5z" fill="currentColor"/></svg>
          TikTok
        </span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="showEditKategori('tiktok','TikTok')"><i class="ti ti-adjustments"></i> Edit Kategori</button>
          <button class="btn btn-sm btn-primary" onclick="showFormChannel('tiktok')"><i class="ti ti-plus"></i> Tambah</button>
        </div>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Nama Toko TikTok</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th style="text-align:center">Multiplier</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-tiktok"><tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table></div>
    </div>

    <!-- OFFLINE -->
    <div class="card">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span><i class="ti ti-map-pin"></i> Offline</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="showEditKategori('offline','Offline')"><i class="ti ti-adjustments"></i> Edit Kategori</button>
          <button class="btn btn-sm btn-primary" onclick="showFormChannel('offline')"><i class="ti ti-plus"></i> Tambah</button>
        </div>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Nama Channel</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th style="text-align:center">Multiplier</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-offline"><tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table></div>
    </div>

  </div><!-- end tab channel -->


  <!-- ══ TAB: SUPPLIER & ROP ══ -->
  <div id="ch-tab-content-supplier" style="display:none">
    <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div style="font-size:12px;color:var(--ink3)">
        <i class="ti ti-info-circle"></i>
        Setting per supplier — dipakai otomatis untuk kalkulasi ROP di halaman Re-Stock.
      </div>
      <button class="btn btn-primary btn-sm" onclick="showModalSupplier()">
        <i class="ti ti-plus"></i> Tambah Supplier
      </button>
    </div>
    <div id="supplier-rop-list">
      <div style="color:var(--ink3);font-style:italic;padding:12px 0">
        <i class="ti ti-loader"></i> Memuat data supplier...
      </div>
    </div>
  </div><!-- end tab supplier -->

  <!-- Modal Supplier -->
  <div class="modal-overlay" id="modal-supplier-rop">
    <div class="modal">
      <div class="modal-title"><i class="ti ti-truck"></i> <span id="supplier-modal-title">Tambah Supplier</span></div>
      <input type="hidden" id="supplier-id">
      <div class="form-row" style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="form-group" style="flex:2;min-width:140px">
          <label>Nama Boss / Supplier</label>
          <input type="text" id="supplier-nama" placeholder="cth: H SOLAH" style="text-transform:uppercase">
        </div>
        <div class="form-group" style="flex:1;min-width:100px">
          <label>Lead Time (hari)</label>
          <input type="number" id="supplier-leadtime" placeholder="7" min="1" max="90" value="7">
        </div>
      </div>
      <div class="form-row" style="display:flex;gap:10px;flex-wrap:wrap">
        <div class="form-group" style="flex:1;min-width:100px">
          <label>Min Order (pcs)</label>
          <input type="number" id="supplier-minorder" placeholder="12" min="1">
        </div>
        <div class="form-group" style="flex:1;min-width:100px">
          <label>Kelipatan Order</label>
          <input type="number" id="supplier-kelipatan" placeholder="12" min="1">
        </div>
        <div class="form-group" style="flex:2;min-width:140px">
          <label>Budget Restock (Rp)</label>
          <input type="text" inputmode="numeric" id="supplier-budget" placeholder="0 = tidak dibatasi">
        </div>
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <input type="text" id="supplier-catatan" placeholder="cth: bayar transfer, dp dulu, dll">
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary btn-sm" onclick="simpanSupplier()"><i class="ti ti-device-floppy"></i> Simpan</button>
        <button class="btn btn-sm" onclick="hideModal('modal-supplier-rop')"><i class="ti ti-x"></i> Batal</button>
      </div>
    </div>
  </div>
`;

setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-channel')); }, 80);

// ─── TAB SWITCH ──────────────────────────────────────────────
function chSwitchTab(tab) {
  var tabs    = ['channel', 'supplier'];
  tabs.forEach(function(t) {
    var btn     = document.getElementById('ch-tab-' + t);
    var content = document.getElementById('ch-tab-content-' + t);
    var active  = t === tab;
    if (btn) {
      btn.style.background = active ? 'var(--ink)' : 'var(--cream)';
      btn.style.color      = active ? 'var(--cream)' : 'var(--ink)';
    }
    if (content) content.style.display = active ? 'block' : 'none';
  });
  if (tab === 'supplier') loadSupplierROP();
}

// ─── CACHE BEBAN PER CHANNEL ─────────────────────────────────
var _chBebanMap = {}; // channel_id → { beban_persen, npm_persen }

// ─── LOAD SEMUA ──────────────────────────────────────────────
async function loadChannelMaster() {
  // Load beban dulu sekali, lalu render semua kategori
  try {
    const bebanData = await dbGet('channel_beban', '');
    _chBebanMap = {};
    (bebanData || []).forEach(b => { _chBebanMap[b.channel_id] = b; });
  } catch(e) { _chBebanMap = {}; }

  await Promise.all([
    loadChannelByKategori('toko_utama'),
    loadChannelByKategori('reseller'),
    loadChannelByKategori('lazada'),
    loadChannelByKategori('tiktok'),
    loadChannelByKategori('offline'),
  ]);
}

async function loadChannelByKategori(kat) {
  const tbody = document.getElementById('ch-tbody-' + kat);
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';
  try {
    const data = await dbGet('channels', '&kategori=eq.' + kat + '&order=nama.asc');
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Belum ada data</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(row => {
      const safeNama = (row.nama||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const beban    = _chBebanMap[row.id];
      const bPct     = beban ? (beban.beban_persen || 0) : null;
      const nPct     = beban ? (beban.npm_persen   || 0) : null;
      const mult     = (bPct !== null) ? (1 + (bPct + nPct) / 100).toFixed(3) : null;
      const bLabel   = bPct !== null
        ? '<span style="color:var(--danger);font-weight:600">' + bPct.toFixed(1) + '%</span>'
        : '<span style="color:var(--ink3);font-style:italic">—</span>';
      const nLabel   = nPct !== null
        ? '<span style="color:var(--ok);font-weight:600">' + nPct.toFixed(1) + '%</span>'
        : '<span style="color:var(--ink3);font-style:italic">—</span>';
      const mLabel   = mult !== null
        ? '<span style="font-weight:600">×' + mult + '</span>'
        : '<span style="color:var(--ink3);font-style:italic">—</span>';
      return '<tr>' +
        '<td style="font-weight:600">' + row.nama + '</td>' +
        '<td style="text-align:center">' + bLabel + '</td>' +
        '<td style="text-align:center">' + nLabel + '</td>' +
        '<td style="text-align:center">' + mLabel + '</td>' +
        '<td style="white-space:nowrap">' +
          '<button class="btn btn-sm" data-action="setting-beban" data-id="' + row.id + '" data-nama="' + safeNama + '" data-kat="' + kat + '" style="margin-right:4px" title="Setting Harga"><i class="ti ti-settings"></i></button>' +
          '<button class="btn btn-sm" data-action="edit-ch" data-id="' + row.id + '" data-kat="' + kat + '" style="margin-right:4px"><i class="ti ti-edit"></i></button>' +
          '<button class="btn btn-sm btn-danger" data-action="hapus-ch" data-id="' + row.id + '" data-kat="' + kat + '" data-nama="' + safeNama + '"><i class="ti ti-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }).join('');

    if (typeof loadChannelDropdownJP === 'function') loadChannelDropdownJP();
  } catch(err) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--danger)">Error: ' + err.message + '</td></tr>';
  }
}

// ─── FORM TAMBAH/EDIT CHANNEL ─────────────────────────────────
function showFormChannel(kat) {
  var labels = { toko_utama:'Nama Channel Toko', reseller:'Nama Reseller', lazada:'Nama Toko Lazada', tiktok:'Nama Toko TikTok', offline:'Nama Channel Offline' };
  var titles = { toko_utama:'Tambah Channel Toko', reseller:'Tambah Reseller', lazada:'Tambah Toko Lazada', tiktok:'Tambah Toko TikTok', offline:'Tambah Channel Offline' };
  document.getElementById('ch-edit-kat').value   = kat;
  document.getElementById('ch-edit-id').value    = '';
  document.getElementById('ch-modal-nama').value = '';
  document.getElementById('ch-modal-ket').value  = '';
  document.getElementById('ch-modal-label').textContent = labels[kat] || 'Nama Channel';
  document.getElementById('ch-modal-title').innerHTML = '<i class="ti ti-plus"></i> ' + (titles[kat]||'Tambah Channel');
  showModal('modal-channel');
}

async function simpanChannelModal() {
  var kat = document.getElementById('ch-edit-kat').value;
  var id  = document.getElementById('ch-edit-id').value;
  var data = {
    kategori:   kat,
    nama:       document.getElementById('ch-modal-nama').value.trim(),
    keterangan: document.getElementById('ch-modal-ket').value.trim(),
  };
  if (!data.nama) { alert('Nama channel wajib diisi!'); return; }
  try {
    if (id) { await dbUpdate('channels', id, data); }
    else    { await dbInsert('channels', data); }
    hideModal('modal-channel');
    loadChannelByKategori(kat);
  } catch(err) { alert('Gagal simpan: ' + err.message); }
}

async function editChannel(id, kat) {
  try {
    const data = await dbGet('channels', '&id=eq.' + id);
    if (!data || !data[0]) return;
    const r = data[0];
    document.getElementById('ch-edit-kat').value   = kat;
    document.getElementById('ch-edit-id').value    = r.id;
    document.getElementById('ch-modal-nama').value = r.nama       || '';
    document.getElementById('ch-modal-ket').value  = r.keterangan || '';
    var titles = { toko_utama:'Edit Channel Toko', reseller:'Edit Reseller', lazada:'Edit Toko Lazada', tiktok:'Edit Toko TikTok', offline:'Edit Channel Offline' };
    document.getElementById('ch-modal-title').innerHTML = '<i class="ti ti-edit"></i> ' + (titles[kat]||'Edit Channel');
    showModal('modal-channel');
  } catch(err) { alert('Gagal load: ' + err.message); }
}

async function hapusChannel(id, nama, kat) {
  confirmDelete('Hapus channel "' + nama + '"?', async () => {
    try {
      await dbDelete('channels', id);
      delete _chBebanMap[id];
      loadChannelByKategori(kat);
    } catch(err) { alert('Gagal hapus: ' + err.message); }
  });
}

// ─── SETTING BEBAN PER CHANNEL ───────────────────────────────
async function showSettingBeban(channelId, channelNama) {
  document.getElementById('cb-channel-id').value    = channelId;
  document.getElementById('cb-channel-nama').textContent = channelNama;
  // Load existing
  const existing = _chBebanMap[channelId];
  document.getElementById('cb-beban').value = existing ? (existing.beban_persen || 0) : 0;
  document.getElementById('cb-npm').value   = existing ? (existing.npm_persen   || 0) : 0;
  cbUpdatePreview();
  showModal('modal-channel-beban');
}

function cbUpdatePreview() {
  const b = parseFloat(document.getElementById('cb-beban').value) || 0;
  const n = parseFloat(document.getElementById('cb-npm').value)   || 0;
  const mult = (1 + (b + n) / 100).toFixed(3);
  document.getElementById('cb-preview').innerHTML =
    'Beban: <b style="color:var(--danger)">' + b.toFixed(1) + '%</b> &nbsp;|&nbsp; ' +
    'NPM: <b style="color:var(--ok)">' + n.toFixed(1) + '%</b> &nbsp;|&nbsp; ' +
    'Multiplier: <b>×' + mult + '</b> &nbsp;|&nbsp; ' +
    'Contoh HPP Rp50.000 → <b>Rp' + Math.ceil(50000 * parseFloat(mult)).toLocaleString('id-ID') + '</b>';
}

async function simpanChannelBeban() {
  const channelId  = document.getElementById('cb-channel-id').value;
  const bebanPct   = parseFloat(document.getElementById('cb-beban').value) || 0;
  const npmPct     = parseFloat(document.getElementById('cb-npm').value)   || 0;

  try {
    const existing = _chBebanMap[channelId];
    if (existing && existing.id) {
      await dbUpdate('channel_beban', existing.id, { beban_persen: bebanPct, npm_persen: npmPct });
    } else {
      await dbInsert('channel_beban', { channel_id: channelId, beban_persen: bebanPct, npm_persen: npmPct });
    }
    // Reload cache beban
    const bebanData = await dbGet('channel_beban', '');
    _chBebanMap = {};
    (bebanData || []).forEach(b => { _chBebanMap[b.channel_id] = b; });

    hideModal('modal-channel-beban');
    // Re-render semua kategori agar angka update
    await Promise.all([
      loadChannelByKategori('toko_utama'),
      loadChannelByKategori('reseller'),
      loadChannelByKategori('lazada'),
      loadChannelByKategori('tiktok'),
      loadChannelByKategori('offline'),
    ]);
  } catch(err) { alert('Gagal simpan beban: ' + err.message); }
}

// ─── EVENT DELEGATION ────────────────────────────────────────
document.getElementById('page-channel').addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id     = btn.dataset.id;
  const kat    = btn.dataset.kat;
  if (action === 'edit-ch') {
    editChannel(id, kat);
  } else if (action === 'hapus-ch') {
    hapusChannel(id, btn.dataset.nama, kat);
  } else if (action === 'setting-beban') {
    showSettingBeban(id, btn.dataset.nama);
  }
});

// ─── EDIT BEBAN PER KATEGORI (bulk set semua channel dalam 1 kategori) ──
async function showEditKategori(kat, label) {
  document.getElementById('ek-kat').value              = kat;
  document.getElementById('ek-label').textContent      = label;
  document.getElementById('ek-beban').value            = '';
  document.getElementById('ek-npm').value              = '';
  document.getElementById('ek-preview').textContent    = '';
  document.getElementById('ek-count').textContent      = '...';

  // Hitung berapa channel dalam kategori ini
  try {
    const list = await dbGet('channels', '&kategori=eq.' + kat);
    document.getElementById('ek-count').textContent = list ? list.length : 0;
  } catch(e) { document.getElementById('ek-count').textContent = '?'; }

  showModal('modal-edit-kategori');
}

function ekUpdatePreview() {
  var b = parseFloat(document.getElementById('ek-beban').value) || 0;
  var n = parseFloat(document.getElementById('ek-npm').value)   || 0;
  var mult = (1 + (b + n) / 100).toFixed(3);
  document.getElementById('ek-preview').innerHTML =
    'Multiplier: <b>×' + mult + '</b> &nbsp;|&nbsp; ' +
    'Contoh HPP Rp50.000 → <b>Rp' + Math.ceil(50000 * parseFloat(mult)).toLocaleString('id-ID') + '</b>';
}

async function simpanKategoriBeban() {
  var kat   = document.getElementById('ek-kat').value;
  var label = document.getElementById('ek-label').textContent;
  var bVal  = document.getElementById('ek-beban').value;
  var nVal  = document.getElementById('ek-npm').value;

  if (bVal === '' && nVal === '') {
    alert('Isi minimal salah satu nilai (Beban atau NPM)');
    return;
  }

  var bebanPct = parseFloat(bVal) || 0;
  var npmPct   = parseFloat(nVal) || 0;
  var btn      = document.querySelector('#modal-edit-kategori .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  try {
    const list = await dbGet('channels', '&kategori=eq.' + kat);
    if (!list || list.length === 0) {
      alert('Tidak ada channel dalam kategori ' + label);
      return;
    }

    // Upsert channel_beban untuk semua channel dalam kategori
    // Reload cache beban dulu
    const existingBeban = await dbGet('channel_beban', '');
    const bebanById = {};
    (existingBeban || []).forEach(b => { bebanById[b.channel_id] = b; });

    await Promise.all(list.map(async function(ch) {
      const existing = bebanById[ch.id];
      if (existing && existing.id) {
        await dbUpdate('channel_beban', existing.id, { beban_persen: bebanPct, npm_persen: npmPct });
      } else {
        await dbInsert('channel_beban', { channel_id: ch.id, beban_persen: bebanPct, npm_persen: npmPct });
      }
    }));

    // Reload cache global
    const bebanData = await dbGet('channel_beban', '');
    _chBebanMap = {};
    (bebanData || []).forEach(b => { _chBebanMap[b.channel_id] = b; });

    hideModal('modal-edit-kategori');
    loadChannelByKategori(kat);

    // Refresh price list juga jika sedang terbuka
    if (typeof loadPriceList === 'function') loadPriceList();

  } catch(err) {
    alert('Gagal simpan: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Semua'; }
  }
}

// ─── INIT ────────────────────────────────────────────────────
loadChannelMaster();

// ─── MODAL CHANNEL (tambah/edit nama) ────────────────────────
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="modal-channel" onclick="if(event.target===this)hideModal('modal-channel')">
  <div class="modal" style="max-width:440px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" id="ch-modal-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-plus"></i> Tambah Channel</div>
      <button onclick="hideModal('modal-channel')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="ch-edit-kat">
    <input type="hidden" id="ch-edit-id">
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 180px">
        <label id="ch-modal-label">Nama Channel</label>
        <input type="text" id="ch-modal-nama" placeholder="mis: SHP.ZENOOT">
      </div>
      <div class="form-group" style="flex:1 1 180px">
        <label>Keterangan <span style="color:var(--ink3);font-weight:400">(opsional)</span></label>
        <input type="text" id="ch-modal-ket" placeholder="keterangan...">
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="simpanChannelModal()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-channel')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>`);

// ─── MODAL EDIT KATEGORI (bulk) ──────────────────────────────
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="modal-edit-kategori" onclick="if(event.target===this)hideModal('modal-edit-kategori')">
  <div class="modal" style="max-width:420px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px">
        <i class="ti ti-adjustments"></i> Edit Kategori — <span id="ek-label" style="color:var(--accent)"></span>
      </div>
      <button onclick="hideModal('modal-edit-kategori')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="ek-kat">
    <div style="padding:8px 12px;background:var(--cream2);border:1px dashed var(--ink3);border-radius:4px;font-size:12px;color:var(--ink2);margin-bottom:14px">
      Akan mengubah <b><span id="ek-count">...</span> channel</b> sekaligus dalam kategori ini.<br>
      Channel yang sudah punya setting sendiri akan di-<i>override</i>.
    </div>
    <div style="display:flex;gap:12px;margin-bottom:12px">
      <div class="form-group" style="flex:1">
        <label>Beban Ops (%)</label>
        <input type="number" id="ek-beban" placeholder="mis: 10" step="0.1" min="0" max="100" oninput="ekUpdatePreview()" style="font-size:16px">
      </div>
      <div class="form-group" style="flex:1">
        <label>Target NPM (%)</label>
        <input type="number" id="ek-npm" placeholder="mis: 8" step="0.1" min="0" max="100" oninput="ekUpdatePreview()" style="font-size:16px">
      </div>
    </div>
    <div id="ek-preview" style="padding:8px 12px;background:var(--cream2);border:1px dashed var(--ink3);border-radius:4px;font-size:12px;color:var(--ink2);margin-bottom:14px;min-height:28px;line-height:1.8"></div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="simpanKategoriBeban()"><i class="ti ti-device-floppy"></i> Simpan Semua</button>
      <button class="btn btn-sm" onclick="hideModal('modal-edit-kategori')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>`);
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="modal-channel-beban" onclick="if(event.target===this)hideModal('modal-channel-beban')">
  <div class="modal" style="max-width:400px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-settings"></i> Setting Harga — <span id="cb-channel-nama" style="color:var(--accent)"></span></div>
      <button onclick="hideModal('modal-channel-beban')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="cb-channel-id">
    <div style="display:flex;gap:12px;margin-bottom:12px">
      <div class="form-group" style="flex:1">
        <label>Beban Ops (%)</label>
        <input type="number" id="cb-beban" placeholder="0" step="0.1" min="0" max="100" oninput="cbUpdatePreview()" style="font-size:16px">
      </div>
      <div class="form-group" style="flex:1">
        <label>Target NPM (%)</label>
        <input type="number" id="cb-npm" placeholder="0" step="0.1" min="0" max="100" oninput="cbUpdatePreview()" style="font-size:16px">
      </div>
    </div>
    <div id="cb-preview" style="padding:8px 12px;background:var(--cream2);border:1px dashed var(--ink3);border-radius:4px;font-size:12px;color:var(--ink2);margin-bottom:14px;line-height:1.8"></div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="simpanChannelBeban()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-channel-beban')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>`);

// ═══════════════════════════════════════════════════════════════
// ─── SUPPLIER & ROP ────────────────────────────────────────────
// Tabel Supabase: restock_supplier
// Kolom: id, boss, lead_time, min_order, kelipatan, budget, catatan, created_at
// ═══════════════════════════════════════════════════════════════

var _supplierData = [];

async function loadSupplierROP() {
  const wrap = document.getElementById('supplier-rop-list');
  if (!wrap) return;
  wrap.innerHTML = '<div style="color:var(--ink3);font-style:italic;padding:12px 0"><i class="ti ti-loader"></i> Memuat...</div>';
  try {
    const data = await dbGet('restock_supplier', '&order=boss.asc');
    _supplierData = data || [];
    renderSupplierROP();
  } catch(e) {
    wrap.innerHTML = `
      <div style="color:var(--danger);padding:12px 0">
        ⚠️ Tabel <b>restock_supplier</b> belum ada di Supabase.<br>
        <span style="font-size:12px;color:var(--ink3)">
          Buat di Supabase → Table Editor → New Table → nama: <b>restock_supplier</b><br>
          Kolom: id (int8 PK auto), boss (text), lead_time (int4 default 7),
          min_order (int4 default 6), kelipatan (int4 default 6),
          budget (int8 default 0), catatan (text), created_at (timestamptz default now())
        </span>
      </div>`;
  }
}

function renderSupplierROP() {
  const wrap = document.getElementById('supplier-rop-list');
  if (!wrap) return;
  const fmtRp = v => v ? 'Rp' + Number(v).toLocaleString('id-ID') : '—';

  if (!_supplierData.length) {
    wrap.innerHTML = '<div style="color:var(--ink3);font-style:italic;padding:12px 0">Belum ada supplier. Klik "+ Tambah Supplier" untuk mulai.</div>';
    return;
  }

  wrap.innerHTML = `
    <table class="tbl">
      <thead>
        <tr>
          <th>Boss / Supplier</th>
          <th style="text-align:center">Lead Time</th>
          <th style="text-align:center">Min Order</th>
          <th style="text-align:center">Kelipatan</th>
          <th style="text-align:right">Budget</th>
          <th>Catatan</th>
          <th style="text-align:center">Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${_supplierData.map(s => `
          <tr>
            <td><b style="color:var(--ink)">${s.boss || '—'}</b></td>
            <td style="text-align:center">${s.lead_time || 7} hari</td>
            <td style="text-align:center">${s.min_order || 6} pcs</td>
            <td style="text-align:center">× ${s.kelipatan || s.min_order || 6}</td>
            <td style="text-align:right;color:${s.budget ? 'var(--warn)' : 'var(--ink3)'}">
              ${s.budget ? fmtRp(s.budget) : 'Tidak dibatasi'}
            </td>
            <td style="color:var(--ink3);font-size:12px">${s.catatan || '—'}</td>
            <td style="text-align:center;white-space:nowrap">
              <button class="btn btn-sm" onclick="editSupplier(${s.id})" style="margin-right:4px">
                <i class="ti ti-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="hapusSupplier(${s.id},'${(s.boss||'').replace(/'/g,"\\'")}')">
                <i class="ti ti-trash"></i>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="margin-top:12px;padding:10px 14px;background:var(--cream3);border-radius:6px;font-size:12px;color:var(--ink3)">
      <i class="ti ti-info-circle"></i>
      <b>Formula ROP:</b> &nbsp;
      Avg Harian = Qty 14 hari ÷ 14 &nbsp;·&nbsp;
      ROP = Avg Harian × Lead Time &nbsp;·&nbsp;
      Qty Order = bulatkan ROP ke atas → kelipatan terdekat
    </div>
  `;
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-channel'));
}

function showModalSupplier() {
  document.getElementById('supplier-modal-title').textContent = 'Tambah Supplier';
  document.getElementById('supplier-id').value       = '';
  document.getElementById('supplier-nama').value     = '';
  document.getElementById('supplier-leadtime').value = '7';
  document.getElementById('supplier-minorder').value = '';
  document.getElementById('supplier-kelipatan').value = '';
  idrSet('supplier-budget', 0);
  document.getElementById('supplier-catatan').value  = '';
  showModal('modal-supplier-rop');
}

function editSupplier(id) {
  const s = _supplierData.find(x => x.id === id);
  if (!s) return;
  document.getElementById('supplier-modal-title').textContent = 'Edit Supplier';
  document.getElementById('supplier-id').value        = s.id;
  document.getElementById('supplier-nama').value      = s.boss || '';
  document.getElementById('supplier-leadtime').value  = s.lead_time || 7;
  document.getElementById('supplier-minorder').value  = s.min_order || '';
  document.getElementById('supplier-kelipatan').value = s.kelipatan || s.min_order || '';
  idrSet('supplier-budget', s.budget || 0);
  document.getElementById('supplier-catatan').value   = s.catatan || '';
  showModal('modal-supplier-rop');
}

async function simpanSupplier() {
  const id        = document.getElementById('supplier-id').value;
  const boss      = (document.getElementById('supplier-nama').value || '').trim().toUpperCase();
  const lead_time = parseInt(document.getElementById('supplier-leadtime').value) || 7;
  const min_order = parseInt(document.getElementById('supplier-minorder').value) || 6;
  const kelipatan = parseInt(document.getElementById('supplier-kelipatan').value) || min_order;
  const budget    = idrVal('supplier-budget');
  const catatan   = (document.getElementById('supplier-catatan').value || '').trim();

  if (!boss) { alert('Nama boss/supplier wajib diisi!'); return; }

  const payload = { boss, lead_time, min_order, kelipatan, budget, catatan };

  try {
    if (id) {
      await dbUpdate('restock_supplier', id, payload);
    } else {
      await dbInsert('restock_supplier', payload);
    }
    hideModal('modal-supplier-rop');
    loadSupplierROP();
  } catch(e) {
    alert('Error: ' + e.message);
  }
}

async function hapusSupplier(id, nama) {
  if (!confirm('Hapus supplier "' + nama + '"?')) return;
  try {
    await dbDelete('restock_supplier', id);
    loadSupplierROP();
  } catch(e) {
    alert('Error: ' + e.message);
  }
}

// ─── AUTO-RELOAD SAAT NAVIGASI KE HALAMAN INI ────────────────
// Debounce 250ms: cegah double-fire jika menu diklik cepat
(function() {
  var _t = null;
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'channel-master') return;
    clearTimeout(_t);
    _t = setTimeout(loadChannelMaster, 250);
  });
})();
