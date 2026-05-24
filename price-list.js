// ─── PRICE-LIST.JS v3 ─────────────────────────────────────────
// Harga jual otomatis dari HPP × multiplier per channel
// 2 dropdown search: channel + katalog

document.getElementById('page-price-list').innerHTML = `
  <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;align-items:flex-start">
    <button class="btn btn-sm btn-primary" onclick="loadPriceList()">
      <i class="ti ti-refresh"></i> Refresh
    </button>
    <button class="btn btn-sm" onclick="exportPriceList()">
      <i class="ti ti-download"></i> Export CSV
    </button>

    <!-- DROPDOWN CHANNEL SEARCH -->
    <div id="pl-ch-wrap" style="position:relative;min-width:200px">
      <div style="position:relative">
        <input type="text" id="pl-ch-input" autocomplete="off"
          placeholder="🔍 Pilih Channel..."
          style="font-family:var(--f);font-size:13px;padding:5px 30px 5px 10px;border:2px solid var(--ink);background:var(--cream);width:100%;box-sizing:border-box;cursor:pointer"
          oninput="plChFilter()" onfocus="plChOpen()" onblur="setTimeout(()=>plChClose(),180)" readonly>
        <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:11px;color:var(--ink3)">▼</span>
      </div>
      <div id="pl-ch-list" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--cream);border:2px solid var(--ink);border-top:none;z-index:999;max-height:220px;overflow-y:auto;box-shadow:2px 4px 0 rgba(0,0,0,0.12)"></div>
      <input type="hidden" id="pl-channel-select">
    </div>

    <!-- DROPDOWN KATALOG SEARCH -->
    <div id="pl-kat-wrap" style="position:relative;min-width:200px;display:none">
      <div style="position:relative">
        <input type="text" id="pl-kat-input" autocomplete="off"
          placeholder="🔍 Filter Katalog..."
          style="font-family:var(--f);font-size:13px;padding:5px 30px 5px 10px;border:2px solid var(--ink);background:var(--cream);width:100%;box-sizing:border-box"
          oninput="plKatFilter()" onfocus="plKatOpen()" onblur="setTimeout(()=>plKatClose(),180)">
        <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:11px;color:var(--ink3)">▼</span>
      </div>
      <div id="pl-kat-list" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--cream);border:2px solid var(--ink);border-top:none;z-index:999;max-height:220px;overflow-y:auto;box-shadow:2px 4px 0 rgba(0,0,0,0.12)"></div>
    </div>
  </div>

  <!-- INFO BEBAN CHANNEL AKTIF -->
  <div id="pl-info-wrap" style="margin-bottom:14px;display:none">
    <div class="card" style="padding:10px 14px">
      <div style="font-size:11px;font-weight:700;color:var(--ink3);margin-bottom:6px;text-transform:uppercase">⚙ Beban Channel Aktif</div>
      <div id="pl-info-channel" style="font-size:13px;color:var(--ink2)">—</div>
    </div>
  </div>

  <!-- HINT BELUM PILIH CHANNEL -->
  <div id="pl-hint" style="padding:24px;text-align:center;color:var(--ink3);font-style:italic;font-size:14px">
    Pilih channel di atas untuk melihat price list
  </div>

  <!-- TABEL PRICE LIST -->
  <div class="card" id="pl-card" style="display:none">
    <div class="card-title"><i class="ti ti-tag"></i> Price List</div>
    <div class="tbl-wrap" style="overflow-x:auto;-webkit-overflow-scrolling:touch;overflow-y:auto"><table class="tbl">
      <thead>
        <tr>
          <th>Katalog</th>
          <th style="text-align:right">HPP</th>
          <th style="text-align:right" id="pl-th-harga">Harga Jual</th>
          <th style="text-align:center">Margin</th>
        </tr>
      </thead>
      <tbody id="pl-tbody">
        <tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>
      </tbody>
    </table></div>
    <div id="pl-footer" style="font-size:12px;color:var(--ink3);margin-top:8px;text-align:right"></div>
  </div>
`;

setTimeout(() => {
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-price-list'));
  _plEnsureFlexLayout();
}, 80);

function _plEnsureFlexLayout() {
  var pg = document.getElementById('page-price-list');
  if (!pg || !pg.classList.contains('active')) return;
  var contentEl = document.querySelector('.content');
  if (contentEl) {
    contentEl.style.overflowY = 'hidden';
    contentEl.style.padding   = '0';
    contentEl.style.height    = '100%';
  }
}
window.addEventListener('resize', function() {
  var pg = document.getElementById('page-price-list');
  if (pg && pg.classList.contains('active')) _plEnsureFlexLayout();
});
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'price-list') return;
  setTimeout(_plEnsureFlexLayout, 60);
});

// ─── CACHE ───────────────────────────────────────────────────
var _plProdukData    = [];
var _plChannelList   = [];
var _plBebanMap      = {};   // channel_id → { beban_persen, npm_persen }
var _plRendered      = [];
var _plChannelAktif  = null; // object channel yang dipilih

// ─── DROPDOWN SEARCH — CHANNEL ───────────────────────────────
var _plChAllItems = []; // { id, label, kat }

function plBuildChannelItems() {
  var katLabel = { toko_utama:'Shopee', reseller:'Reseller', lazada:'Lazada', tiktok:'TikTok', offline:'Offline' };
  _plChAllItems = [];
  var grouped = {};
  _plChannelList.forEach(function(ch) {
    var k = ch.kategori || 'lainnya';
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(ch);
  });
  Object.entries(grouped).forEach(function([kat, items]) {
    items.forEach(function(ch) {
      _plChAllItems.push({ id: ch.id, label: ch.nama, kat: katLabel[kat] || kat });
    });
  });
}

function plChOpen() {
  document.getElementById('pl-ch-input').removeAttribute('readonly');
  plChRenderList(_plChAllItems);
  document.getElementById('pl-ch-list').style.display = 'block';
}
function plChClose() {
  document.getElementById('pl-ch-list').style.display = 'none';
  document.getElementById('pl-ch-input').setAttribute('readonly','');
  // Restore label channel aktif jika ada
  var selId = document.getElementById('pl-channel-select').value;
  var found = _plChAllItems.find(function(i){ return i.id === selId; });
  if (found) document.getElementById('pl-ch-input').value = found.label;
  else if (!selId) document.getElementById('pl-ch-input').value = '';
}
function plChFilter() {
  var q = document.getElementById('pl-ch-input').value.toLowerCase();
  var filtered = q ? _plChAllItems.filter(function(i){ return i.label.toLowerCase().includes(q) || i.kat.toLowerCase().includes(q); }) : _plChAllItems;
  plChRenderList(filtered);
  document.getElementById('pl-ch-list').style.display = 'block';
}
function plChRenderList(items) {
  var list = document.getElementById('pl-ch-list');
  if (!items.length) {
    list.innerHTML = '<div style="padding:8px 12px;color:var(--ink3);font-style:italic;font-size:13px">Tidak ditemukan</div>';
    return;
  }
  // Group by kategori
  var byKat = {};
  items.forEach(function(i){ if(!byKat[i.kat]) byKat[i.kat]=[]; byKat[i.kat].push(i); });
  list.innerHTML = Object.entries(byKat).map(function([kat, its]) {
    return '<div style="padding:4px 10px;font-size:11px;font-weight:700;color:var(--ink3);background:var(--cream2);text-transform:uppercase;letter-spacing:0.5px">── ' + kat + ' ──</div>' +
      its.map(function(i) {
        return '<div data-id="'+i.id+'" style="padding:8px 14px;font-size:13px;cursor:pointer;border-bottom:1px solid var(--ink4,rgba(0,0,0,0.06))" '+
          'onmouseenter="this.style.background=\'var(--cream2)\'" onmouseleave="this.style.background=\'\'" '+
          'onmousedown="plChSelect(\''+i.id+'\',\''+i.label.replace(/'/g,"\\'")+'\')">'+ i.label +'</div>';
      }).join('');
  }).join('');
}
function plChSelect(id, label) {
  document.getElementById('pl-channel-select').value = id;
  document.getElementById('pl-ch-input').value       = label;
  document.getElementById('pl-ch-list').style.display = 'none';
  onPilihChannelPL();
}

// ─── DROPDOWN SEARCH — KATALOG ────────────────────────────────
var _plKatAllItems  = []; // nama katalog unik
var _plKatSelected  = ''; // '' = semua

function plBuildKatalogItems() {
  var unique = {};
  _plProdukData.forEach(function(r){ if(r.katalog) unique[r.katalog] = true; });
  _plKatAllItems = Object.keys(unique).sort();
}

function plKatOpen() {
  plKatRenderList(_plKatAllItems);
  document.getElementById('pl-kat-list').style.display = 'block';
}
function plKatClose() {
  document.getElementById('pl-kat-list').style.display = 'none';
}
function plKatFilter() {
  var q = document.getElementById('pl-kat-input').value.toLowerCase();
  var filtered = q ? _plKatAllItems.filter(function(k){ return k.toLowerCase().includes(q); }) : _plKatAllItems;
  plKatRenderList(filtered);
  document.getElementById('pl-kat-list').style.display = 'block';
}
function plKatRenderList(items) {
  var list = document.getElementById('pl-kat-list');
  var html = '<div data-kat="" style="padding:8px 14px;font-size:13px;cursor:pointer;font-style:italic;color:var(--ink3);border-bottom:1px solid var(--ink4,rgba(0,0,0,0.06))" '+
    'onmouseenter="this.style.background=\'var(--cream2)\'" onmouseleave="this.style.background=\'\'" '+
    'onmousedown="plKatSelect(\'\',\'Semua Katalog\')">— Semua Katalog —</div>';
  html += items.map(function(k) {
    return '<div data-kat="'+k+'" style="padding:8px 14px;font-size:13px;cursor:pointer;border-bottom:1px solid var(--ink4,rgba(0,0,0,0.06))" '+
      'onmouseenter="this.style.background=\'var(--cream2)\'" onmouseleave="this.style.background=\'\'" '+
      'onmousedown="plKatSelect(\''+k.replace(/'/g,"\\'")+'\',\''+k.replace(/'/g,"\\'")+'\')">'+ k +'</div>';
  }).join('');
  list.innerHTML = html;
}
function plKatSelect(kat, label) {
  _plKatSelected = kat;
  document.getElementById('pl-kat-input').value       = kat ? label : '';
  document.getElementById('pl-kat-input').placeholder = kat ? label : '🔍 Filter Katalog...';
  document.getElementById('pl-kat-list').style.display = 'none';
  // Re-render dengan filter katalog
  var filtered = kat ? _plProdukData.filter(function(r){ return r.katalog === kat; }) : _plProdukData;
  renderPriceList(filtered);
}

// ─── LOAD SEMUA DATA ─────────────────────────────────────────
async function loadPriceList() {
  try {
    const [produk, channels, bebanList] = await Promise.all([
      dbGet('produk',        '&order=katalog.asc&kategori_produk=in.(aktif,clearance)').catch(()=>dbGet('produk','&order=katalog.asc')),
      dbGet('channels',      '&order=nama.asc'),
      dbGet('channel_beban', ''),
    ]);

    _plProdukData  = produk   || [];
    _plChannelList = channels || [];
    _plBebanMap    = {};
    (bebanList || []).forEach(b => { _plBebanMap[b.channel_id] = b; });

    // Build dropdown search items
    plBuildChannelItems();
    plBuildKatalogItems();

    // Jika channel sudah dipilih sebelumnya, refresh tampilan
    var selId = document.getElementById('pl-channel-select').value;
    if (selId) {
      document.getElementById('pl-kat-wrap').style.display = '';
      onPilihChannelPL();
    }

  } catch(err) {
    document.getElementById('pl-hint').textContent = 'Error: ' + err.message;
  }
}

// ─── SAAT PILIH CHANNEL ──────────────────────────────────────
function onPilihChannelPL() {
  var channelId = document.getElementById('pl-channel-select').value;
  var hint      = document.getElementById('pl-hint');
  var card      = document.getElementById('pl-card');
  var infoWrap  = document.getElementById('pl-info-wrap');
  var katWrap   = document.getElementById('pl-kat-wrap');

  if (!channelId) {
    hint.style.display     = '';
    card.style.display     = 'none';
    infoWrap.style.display = 'none';
    katWrap.style.display  = 'none';
    _plChannelAktif = null;
    return;
  }

  _plChannelAktif = _plChannelList.find(ch => ch.id === channelId) || null;
  var beban       = _plBebanMap[channelId] || { beban_persen: 0, npm_persen: 0 };

  hint.style.display     = 'none';
  card.style.display     = '';
  infoWrap.style.display = '';
  katWrap.style.display  = '';  // tampilkan dropdown katalog

  // Reset filter katalog saat ganti channel
  _plKatSelected = '';
  document.getElementById('pl-kat-input').value = '';
  document.getElementById('pl-kat-input').placeholder = '🔍 Filter Katalog...';

  // Update header kolom
  document.getElementById('pl-th-harga').textContent = 'Harga — ' + (_plChannelAktif ? _plChannelAktif.nama : '');

  // Info beban
  var mult = (1 + ((beban.beban_persen||0) + (beban.npm_persen||0)) / 100).toFixed(3);
  var namaChannel = _plChannelAktif ? _plChannelAktif.nama : channelId;
  var infoEl = document.getElementById('pl-info-channel');
  if (!_plBebanMap[channelId]) {
    infoEl.innerHTML = '<span style="color:var(--danger)">⚠️ Channel <b>' + namaChannel + '</b> belum ada setting beban — harga = HPP (multiplier ×1.000). Setting di halaman Channel.</span>';
  } else {
    infoEl.innerHTML =
      '<b>' + namaChannel + '</b> &nbsp;|&nbsp; ' +
      'Beban: <b style="color:var(--danger)">' + (beban.beban_persen||0).toFixed(1) + '%</b> &nbsp;|&nbsp; ' +
      'NPM: <b style="color:var(--ok)">'   + (beban.npm_persen||0).toFixed(1)   + '%</b> &nbsp;|&nbsp; ' +
      'Multiplier: <b>×' + mult + '</b>';
  }

  renderPriceList(_plProdukData);
}

// ─── RENDER TABEL — 1 katalog = 1 baris ──────────────────────
function renderPriceList(data) {
  var tbody = document.getElementById('pl-tbody');
  if (!_plChannelAktif && !document.getElementById('pl-channel-select').value) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--ink3);font-style:italic">Belum ada produk di Kelola Produk</td></tr>';
    document.getElementById('pl-footer').textContent = '';
    _plRendered = [];
    return;
  }

  var channelId = document.getElementById('pl-channel-select').value;
  var beban     = _plBebanMap[channelId] || { beban_persen: 0, npm_persen: 0 };
  var mult      = 1 + ((beban.beban_persen||0) + (beban.npm_persen||0)) / 100;

  // Group by katalog — ambil HPP dari baris pertama (HPP sama per katalog)
  var katalogMap = {};
  data.forEach(function(row) {
    var kat = row.katalog || '—';
    if (!katalogMap[kat]) {
      katalogMap[kat] = { katalog: kat, hpp: row.hpp || 0 };
    }
  });

  var katalogList = Object.values(katalogMap).sort(function(a,b) {
    return a.katalog.localeCompare(b.katalog);
  });

  _plRendered = katalogList.map(function(row) {
    var hpp   = row.hpp;
    var harga = Math.ceil(hpp * mult);
    var margin = hpp > 0 ? (((harga - hpp) / hpp) * 100).toFixed(1) : 0;
    return { katalog: row.katalog, hpp: hpp, hargaJual: harga, margin: margin };
  });

  tbody.innerHTML = _plRendered.map(function(row) {
    return '<tr>' +
      '<td style="font-weight:600">' + row.katalog + '</td>' +
      '<td style="text-align:right;color:var(--ink2)">' + fmtRpFull(row.hpp) + '</td>' +
      '<td style="text-align:right;font-weight:700;color:var(--ink)">' + fmtRpFull(row.hargaJual) + '</td>' +
      '<td style="text-align:center"><span style="color:var(--ok);font-weight:600">' + row.margin + '%</span></td>' +
    '</tr>';
  }).join('');

  document.getElementById('pl-footer').textContent = _plRendered.length + ' katalog ditampilkan';
}

// ─── EXPORT CSV ──────────────────────────────────────────────
function exportPriceList() {
  if (!_plRendered || !_plRendered.length) { alert('Pilih channel dan pastikan ada data dulu'); return; }
  var chNama = _plChannelAktif ? _plChannelAktif.nama : 'channel';
  var headers = ['Katalog','HPP','Harga Jual (' + chNama + ')','Margin (%)'];
  var rows = _plRendered.map(r => [r.katalog, r.hpp, r.hargaJual, r.margin]);
  exportCSV('zenoot-price-list-' + chNama.replace(/\./g,'-') + '.csv', headers, rows);
}

// ─── EXPOSE untuk dipanggil dari luar (misal setelah update beban) ─
window.loadPriceList = loadPriceList;

// ─── INIT ────────────────────────────────────────────────────
loadPriceList();
