// ─── JURNAL-PENJUALAN.JS ─────────────────────────────────────

document.getElementById('page-jurnal-penjualan').innerHTML = `

  <!-- TOP BAR: Metrics + Toolbar Laptop — diam di atas -->
  <div id="jp-top-bar">
    <!-- METRICS -->
    <div class="metrics" style="margin-bottom:10px">
      <div class="metric">
        <div class="m-label">Total Penjualan</div>
        <div class="m-value" id="jp-total-penjualan">—</div>
        <div class="m-delta">semua transaksi</div>
      </div>
      <div class="metric">
        <div class="m-label">Total Item Terjual</div>
        <div class="m-value" id="jp-total-item">—</div>
        <div class="m-delta">qty keseluruhan</div>
      </div>
    </div>

    <!-- TOMBOL AKSI LAPTOP — tersembunyi di mobile -->
    <div id="jp-aksi-laptop" style="display:flex;gap:6px;margin-bottom:0;align-items:center;flex-wrap:nowrap">
      <button class="btn btn-sm" onclick="loadJurnalPenjualan()" title="Refresh" style="padding:4px 8px">
        <i class="ti ti-refresh"></i>
      </button>
      <button class="btn btn-sm" id="jp-periode-btn-laptop" onclick="jpTogglePeriode()"
        style="display:flex;align-items:center;gap:4px;font-size:12px">
        <i class="ti ti-calendar"></i>
        <span class="jp-periode-label-sync">Hari Ini</span>
        <span style="font-size:10px">&#9662;</span>
      </button>
      <button class="btn btn-sm" id="jp-channel-btn-laptop" onclick="jpToggleChannel()"
        style="display:flex;align-items:center;gap:4px;font-size:12px">
        <i class="ti ti-building-store"></i>
        <span class="jp-channel-label-sync">Channel</span>
        <span style="font-size:10px">&#9662;</span>
      </button>
      <button class="btn btn-sm" id="jp-reset-btn-laptop" onclick="jpResetFilter()"
        style="display:none;align-items:center;gap:4px;font-size:12px;border-color:var(--danger);color:var(--danger)">
        <i class="ti ti-x"></i> Reset
      </button>
      <button class="btn btn-sm" onclick="gotoPage('produk-terjual',null)" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap">
        <i class="ti ti-chart-bar"></i> Produk Terjual
      </button>
    </div>
  </div>



  <!-- ═══ CSS RESPONSIVE MODAL ═══ -->
  <style>
    /* ── Modal wrapper: scroll aman di HP kecil ── */
    #modal-jp .modal {
      max-height: 92vh;
      overflow-y: auto;
      overscroll-behavior: none;
      box-sizing: border-box;
    }

    /* ── Row 1: Tanggal + Waktu + Channel ── */
    .jp-row-1 {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .jp-row-1 .fg-tgl   { flex: 1 1 110px; min-width: 100px; }
    .jp-row-1 .fg-waktu { flex: 1 1 80px;  min-width: 70px;  }
    .jp-row-1 .fg-ch    { flex: 2 1 130px; min-width: 120px; }

    /* ── Row 2: SKU Variasi + SKU Induk ── */
    .jp-row-2 {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .jp-row-2 .fg-variasi,
    .jp-row-2 .fg-induk { width: 100%; }

    /* ── Row 3: Total (full) | Harga + Qty sejajar ── */
    .jp-row-3 {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .jp-row-3 .fg-total { flex: 1 1 100%; }
    .jp-row-3 .fg-harga { flex: 1 1 120px; min-width: 100px; }
    .jp-row-3 .fg-qty   { flex: 0 1 80px;  min-width: 70px;  }

    /* ── Semua input & select di modal: full width dalam grupnya ── */
    #modal-jp .form-group input,
    #modal-jp .form-group select {
      width: 100%;
      box-sizing: border-box;
    }

    /* ── Khusus SKU Induk: input+tombol tetap sejajar ── */
    .jp-induk-wrap {
      display: flex;
      width: 100%;
    }
    .jp-induk-wrap input {
      flex: 1;
      border-right: none !important;
    }
    .jp-induk-wrap button {
      flex-shrink: 0;
    }

    /* ── Tombol aksi modal: full width di portrait ── */
    #modal-jp .modal-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }
    #modal-jp .modal-actions .btn {
      flex: 1 1 120px;
    }
    #modal-jp .modal-actions .btn-primary {
      flex: 2 1 160px;
    }

    /* ── Tablet & desktop: kembalikan layout horizontal ── */
    @media (min-width: 520px) {
      .jp-row-1 .fg-ch    { flex: 1 1 150px; min-width: 120px; }
      .jp-row-2           { flex-direction: row; }
      .jp-row-2 .fg-variasi,
      .jp-row-2 .fg-induk { flex: 1 1 0; width: auto; }
      .jp-row-3 .fg-total { flex: 1 1 140px; }
    }
  /* ── Laptop: tampilkan toolbar luar, sembunyikan toolbar dalam card ── */
  @media (min-width: 768px) {
    #jp-aksi-laptop { display: flex !important; }
    #jp-aksi-mobile { display: none !important; }
  }
  /* ── Mobile (portrait & landscape HP): toolbar dalam card ── */
  @media (max-width: 767px) {
    #jp-aksi-laptop { display: none !important; }
    #jp-aksi-mobile { display: flex !important; }
  }
  </style>

  <!-- MODAL -->
  <div class="modal-overlay" id="modal-jp" onclick="jpOverlayClose(event)">
    <div class="modal" style="max-width:480px;width:100%;padding:16px">

      <!-- Header modal -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
        <div class="modal-title" id="jp-modal-title"
             style="margin:0;border:none;padding:0;font-size:18px">
          <i class="ti ti-plus"></i> Tambah Penjualan
        </div>
        <button onclick="closeModalJP()"
          style="background:none;border:none;font-size:22px;cursor:pointer;
                 color:var(--ink3);line-height:1;padding:4px 8px;">&#10005;</button>
      </div>

      <input type="hidden" id="jp-id">

      <!-- BARIS 1: Tanggal + Waktu | Channel (baris baru di portrait) -->
      <div class="jp-row-1" style="margin-bottom:12px">
        <div class="form-group fg-tgl">
          <label>Tanggal</label>
          <input type="date" id="jp-tgl">
        </div>
        <div class="form-group fg-waktu">
          <label>Waktu</label>
          <input type="time" id="jp-waktu"
            style="font-family:var(--f);font-size:14px;padding:6px 10px;
                   border:2px solid var(--ink);background:var(--cream)">
        </div>
        <div class="form-group fg-ch">
          <label>[ Channel ]</label>
          <select id="jp-channel" style="display:none">
            <option value="">— Pilih Channel —</option>
          </select>
          <div class="kas-akun-wrap">
            <div class="kas-akun-picker" id="jp-picker-channel" data-target="jp-channel"
              onmousedown="event.stopPropagation();jpTogglePicker('jp-picker-channel')"
              ontouchend="event.preventDefault();event.stopPropagation();jpTogglePicker('jp-picker-channel')">
              <span id="jp-picker-channel-label" style="color:var(--ink3)">— Pilih Channel —</span>
              <span style="margin-left:auto;color:var(--ink3);font-size:10px">▾</span>
            </div>
            <div class="kas-akun-list" id="jp-picker-channel-list" style="display:none"></div>
          </div>
        </div>
      </div>

      <!-- BARIS 2: SKU Variasi + SKU Induk (stack di portrait) -->
      <div class="jp-row-2" style="margin-bottom:12px">
        <div class="form-group fg-variasi">
          <label>SKU Variasi</label>
          <select id="jp-sku-variasi" style="display:none"
            onchange="jpOnPilihVariasi()">
            <option value="">— Pilih Variasi —</option>
          </select>
          <div class="kas-akun-wrap">
            <div class="kas-akun-picker" id="jp-picker-variasi" data-target="jp-sku-variasi"
              onmousedown="event.stopPropagation();jpTogglePicker('jp-picker-variasi')"
              ontouchend="event.preventDefault();event.stopPropagation();jpTogglePicker('jp-picker-variasi')">
              <span id="jp-picker-variasi-label" style="color:var(--ink3)">— Pilih Variasi —</span>
              <span style="margin-left:auto;color:var(--ink3);font-size:10px">▾</span>
            </div>
            <div class="kas-akun-list" id="jp-picker-variasi-list" style="display:none"></div>
          </div>
        </div>
        <div class="form-group fg-induk" style="position:relative">
          <label>SKU Induk</label>
          <div class="jp-induk-wrap">
            <input type="text" id="jp-sku-induk"
              placeholder="Ketik nama katalog..."
              autocomplete="off"
              style="font-family:var(--f);font-size:14px;
                     padding:6px 10px;border:2px solid var(--ink);background:var(--cream)"
              oninput="jpSugestKatalog()"
              onkeydown="jpKatalogKeyNav(event)"
              onfocus="jpSugestKatalog()">
            <button id="jp-sku-dd-btn"
              onclick="jpToggleKatalogFull()"
              title="Lihat semua katalog"
              style="background:var(--cream2);border:2px solid var(--ink);border-left:none;
                     padding:0 10px;cursor:pointer;font-size:14px;color:var(--ink);
                     min-height:44px;flex-shrink:0">&#9660;</button>
          </div>
        </div>
      </div>

      <!-- BARIS 3: Total (full) | Harga Satuan + Qty -->
      <div class="jp-row-3" style="margin-bottom:16px">
        <div class="form-group fg-total">
          <label>Total (otomatis)</label>
          <input type="text" inputmode="numeric" id="jp-total" placeholder="0" readonly
            style="background:var(--cream2);cursor:not-allowed;font-weight:700;color:var(--ok)">
        </div>
        <div class="form-group fg-harga">
          <label>Harga Satuan (Rp)</label>
          <input type="text" inputmode="numeric" id="jp-harga" placeholder="0" oninput="hitungTotalJP()">
        </div>
        <div class="form-group fg-qty">
          <label>QTY</label>
          <input type="number" id="jp-qty" placeholder="0" min="1" oninput="hitungTotalJP()">
        </div>
      </div>

      <!-- Tombol aksi -->
      <div class="modal-actions"
        style="border-top:1.5px dashed var(--ink3);padding-top:12px">
        <button class="btn btn-sm" onclick="closeModalJP()"
          style="min-width:80px">
          <i class="ti ti-x"></i> Batal
        </button>
        <button class="btn btn-primary btn-sm" onclick="simpanJP()"
          style="font-weight:700;font-size:14px;padding:8px 16px">
          <i class="ti ti-device-floppy"></i> SIMPAN
        </button>
      </div>
    </div>
  </div>

  <!-- TABEL -->
  <div class="card">
    <div id="jp-sticky-header">
      <!-- Target Harian + Tambah Penjualan — 1 baris -->
      <div id="jp-target-wrap" style="display:none;padding:6px 14px 4px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;white-space:nowrap">Target Harian</span>
          <span id="jp-target-nominal" style="font-size:12px;font-weight:700;color:var(--ink)">—</span>
          <span id="jp-target-label" style="font-size:11px;color:var(--ink3);margin-left:auto;white-space:nowrap">—</span>
          <button class="btn btn-sm btn-primary" onclick="showTambahJP()" id="jp-tambah-btn" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap;flex-shrink:0">
            <i class="ti ti-plus"></i> Tambah Penjualan
          </button>
        </div>
        <div style="height:5px;background:var(--cream2);border:1px solid var(--ink3);border-radius:3px;overflow:hidden">
          <div id="jp-target-bar" style="height:100%;width:0%;background:var(--ok);transition:width .6s;border-radius:3px"></div>
        </div>
      </div>
      <!-- Card title: hanya tampil saat target-wrap hidden (portrait/no-target) -->
      <div class="card-title jp-title-fallback" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <span><i class="ti ti-receipt"></i> Jurnal Penjualan</span>
        <button class="btn btn-sm btn-primary" onclick="showTambahJP()" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap">
          <i class="ti ti-plus"></i> Tambah Penjualan
        </button>
      </div>
      <!-- Toolbar mobile -->
      <div id="jp-aksi-mobile" style="display:flex;gap:6px;margin-bottom:0;align-items:center;flex-wrap:nowrap">
      <button class="btn btn-sm" onclick="loadJurnalPenjualan()" title="Refresh" style="padding:4px 8px">
        <i class="ti ti-refresh"></i>
      </button>
      <button class="btn btn-sm" id="jp-periode-btn" onclick="jpTogglePeriode()"
        style="display:flex;align-items:center;gap:4px;font-size:12px">
        <i class="ti ti-calendar"></i>
        <span id="jp-periode-label">Hari Ini</span>
        <span id="jp-periode-badge" style="display:none;background:var(--accent);color:#fff;font-size:9px;padding:1px 4px;border-radius:8px;font-weight:700">●</span>
        <span style="font-size:10px">&#9662;</span>
      </button>
      <button class="btn btn-sm" id="jp-channel-btn" onclick="jpToggleChannel()"
        style="display:flex;align-items:center;gap:4px;font-size:12px">
        <i class="ti ti-building-store"></i>
        <span id="jp-channel-label">Channel</span>
        <span id="jp-channel-badge" style="display:none;background:var(--accent);color:#fff;font-size:9px;padding:1px 4px;border-radius:8px;font-weight:700">●</span>
        <span style="font-size:10px">&#9662;</span>
      </button>
      <button class="btn btn-sm" id="jp-reset-btn" onclick="jpResetFilter()"
        style="display:none;align-items:center;gap:4px;font-size:12px;border-color:var(--danger);color:var(--danger)">
        <i class="ti ti-x"></i> Reset
      </button>
      <button class="btn btn-sm" onclick="gotoPage('produk-terjual',null)" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap">
        <i class="ti ti-chart-bar"></i> Produk Terjual
      </button>
      </div><!-- /jp-aksi-mobile -->
    </div><!-- /jp-sticky-header -->
    <div id="jp-tbl-wrap"><table class="tbl">
      <thead>
        <tr>
          <th>Tgl &amp; Waktu ↓</th>
          <th>Channel</th>
          <th>SKU</th>
          <th>Qty</th>
          <th>Harga Sat.</th>
          <th>Total</th>
          <th style="text-align:center">Sisa Stok</th>
          <th style="text-align:center">Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody id="jp-tbody">
        <tr><td colspan="7" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>
      </tbody>
    </table>
    <div id="jp-footer" style="font-size:12px;color:var(--ink3);padding:8px 10px;text-align:right"></div>
    </div>
  </div>
`;

setTimeout(() => {
  if (typeof rerenderUI === 'function')
    rerenderUI(document.getElementById('page-jurnal-penjualan'));
  // Pastikan layout flex aktif saat halaman ini dibuka
  _jpEnsureFlexLayout();
}, 80);

// Fix .content agar height chain bekerja saat halaman JP aktif
function _jpEnsureFlexLayout() {
  var pg = document.getElementById('page-jurnal-penjualan');
  if (!pg || !pg.classList.contains('active')) return;

  // Pastikan seluruh height chain dari html → body → .main → .content eksplisit
  // iOS Safari tidak bisa resolve flex:1 jika parent tidak punya height eksplisit
  var htmlEl = document.documentElement;
  if (htmlEl) { htmlEl.style.height = '100%'; }

  var bodyEl = document.body;
  if (bodyEl) { bodyEl.style.height = '100%'; bodyEl.style.minHeight = '0'; }

  var mainEl = document.querySelector('.main');
  if (mainEl) {
    mainEl.style.height        = '100%';
    mainEl.style.minHeight     = '0';
    mainEl.style.overflow      = 'hidden';
    mainEl.style.display       = '-webkit-flex';
    mainEl.style.webkitFlex    = '1 1 0';
    mainEl.style.flex          = '1 1 0';
    mainEl.style.flexDirection = 'column';
    mainEl.style.webkitFlexDirection = 'column';
  }

  var contentEl = document.querySelector('.content');
  if (contentEl) {
    contentEl.style.overflowY     = 'hidden';
    contentEl.style.overflow      = 'hidden';
    contentEl.style.padding       = '0';
    contentEl.style.display       = '-webkit-flex';
    contentEl.style.display       = 'flex';
    contentEl.style.flexDirection = 'column';
    contentEl.style.webkitFlexDirection = 'column';
    contentEl.style.height        = '100%';
    contentEl.style.webkitFlex    = '1 1 0';
    contentEl.style.flex          = '1 1 0';
    contentEl.style.minHeight     = '0';
  }
}
window.addEventListener('resize', function() {
  var pg = document.getElementById('page-jurnal-penjualan');
  if (pg && pg.classList.contains('active')) {
    _jpEnsureFlexLayout();
  }
});

// ─── STATE ───────────────────────────────────────────────────
let _jpAllData    = [];
let _jpChannelMap = {};
let _jpProdukList = [];
let _jpSkuIndex   = -1;
let _jpDdMode     = 'bulan'; // default: bulan ini
let _jpSisakMap   = {}; // stok sisa per SKU (uppercase), diisi saat render tabel

function _jpNowTime() {
  const n = new Date();
  return String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
}
function _jpNowDate() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function _jpLocalDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// ─── MODAL ───────────────────────────────────────────────────
function jpOverlayClose(e) {
  if (e.target === document.getElementById('modal-jp')) closeModalJP();
}
function closeModalJP() {
  document.getElementById('modal-jp').classList.remove('open');
  jpTutupDropdownSKU();
}

// ─── LOAD CHANNEL ────────────────────────────────────────────
async function loadChannelDropdownJP() {
  try {
    const data = await dbGet('channels', '&order=nama.asc');
    if (!data || !data.length) return;

    _jpChannelMap = {};
    data.forEach(ch => { _jpChannelMap[ch.id] = ch; });

    // Label + icon per kategori
    const katConfig = {
      toko_utama: { label: 'Toko Utama',  icon: 'shopee'   },
      reseller:   { label: 'Reseller',    icon: 'reseller' },
      lazada:     { label: 'Lazada',      icon: 'lazada'   },
      tiktok:     { label: 'TikTok',      icon: 'tiktok'   },
      offline:    { label: 'Offline',     icon: 'offline'  },
    };

    let fHtml    = '<option value="">— Pilih Channel —</option>';
    let filtHtml = '<option value="">Channel</option>';

    const grouped = {};
    data.forEach(ch => {
      const k = ch.kategori || 'lainnya';
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(ch);
    });

    Object.entries(grouped).forEach(([kat, items]) => {
      const cfg  = katConfig[kat] || { label: kat, icon: 'default' };
      const lbl  = '── ' + cfg.label + ' ──';
      fHtml    += '<optgroup label="' + lbl + '">';
      filtHtml += '<optgroup label="' + lbl + '">';
      items.forEach(ch => {
        fHtml    += '<option value="' + ch.id + '">' + ch.nama + '</option>';
        filtHtml += '<option value="' + ch.id + '">' + ch.nama + '</option>';
      });
      fHtml    += '</optgroup>';
      filtHtml += '</optgroup>';
    });

    document.getElementById('jp-channel').innerHTML        = fHtml;
    // Render ke picker channel (modal form JP)
    var pickerChList = document.getElementById('jp-picker-channel-list');
    if (pickerChList) {
      var pickerHtml = '<div class="kas-akun-item" data-val="" onclick="jpPickerChannelSelect(this)"><span style="color:var(--ink3)">— Pilih Channel —</span></div>';
      Object.entries(grouped).forEach(function([kat, items]) {
        var cfg = katConfig[kat] || { label: kat, icon: 'default' };
        pickerHtml += '<div class="kas-akun-group">── ' + cfg.label + ' ──</div>';
        items.forEach(function(ch) {
          pickerHtml += '<div class="kas-akun-item" data-val="' + ch.id + '" onclick="jpPickerChannelSelect(this)">' + ch.nama + '</div>';
        });
      });
      pickerChList.innerHTML = pickerHtml;
    }
    // Custom div dropdown channel (bukan select) untuk hover effect
    var fcEl = document.getElementById('jp-filter-channel');
    if (fcEl) fcEl.value = ''; // reset hidden input
    var listEl = document.getElementById('jp-channel-list');
    if (listEl) {
      var listHtml = '';
      // "Channel" item
      listHtml += _jpChItem('', 'Channel', null, '');
      // Per group
      Object.entries(grouped).forEach(function([kat, items]) {
        var cfg = katConfig[kat] || { label: kat, icon: 'default' };
        listHtml += '<div style="font-size:10px;font-weight:700;color:var(--ink3);padding:6px 10px 2px;letter-spacing:.5px">── ' + cfg.label + ' ──</div>';
        items.forEach(function(ch) {
          listHtml += _jpChItem(ch.id, ch.nama, null, '');
        });
      });
      listEl.innerHTML = listHtml;
      // Attach click events
      listEl.querySelectorAll('[data-ch-id]').forEach(function(el) {
        el.addEventListener('click', function() {
          var val = el.getAttribute('data-ch-id');
          var fcEl2 = document.getElementById('jp-filter-channel');
          if (fcEl2) fcEl2.value = val;
          // Update active state semua item
          listEl.querySelectorAll('[data-ch-id]').forEach(function(e2) {
            var isActive = e2.getAttribute('data-ch-id') === val;
            e2.style.background = isActive ? 'var(--ink)' : '';
            e2.style.color      = isActive ? 'var(--cream)' : '';
          });
          filterJP(); jpUpdateBadge(); jpUpdateChannelLabel(); jpCloseChannelPanel();
        });
      });
    }

  } catch(e) {
    console.warn('channel dropdown error:', e.message);
    var chEl = document.getElementById('jp-channel');
    if (chEl) chEl.innerHTML = '<option value="">— Channel tidak tersedia —</option>';
  }
}

// ─── LOAD PRODUK ─────────────────────────────────────────────
async function loadProdukListJP() {
  try {
    let data = null;
    try {
      data = await dbGet('produk', '&order=katalog.asc,sku.asc');
    } catch(e) {
      try { data = await dbGet('produk', ''); } catch(e2) {}
    }
    _jpProdukList = data || [];
  } catch(e) {
    console.warn('produk list error:', e.message);
    _jpProdukList = [];
  }
}

// ─── SKU HELPERS ─────────────────────────────────────────────
function _jpGetKatalog(p) { return p.katalog || p.nama_katalog || p.catalog || p.nama || ''; }
function _jpGetSku(p)     { return p.sku || p.sku_variasi || p.kode || ''; }
function _jpGetHpp(p)     { return p.hpp || p.harga_pokok || p.cost || 0; }

function _jpRenderDropdown(katalogs, katalogMap) {
  const dd  = document.getElementById('jp-sku-dropdown');
  const inp = document.getElementById('jp-sku-induk');
  if (!katalogs.length) {
    dd.style.display = 'none';
    if (_jpProdukList.length === 0) {
      _jpPositionDropdown();
      dd.innerHTML = '<div style="padding:10px 12px;color:var(--ink3);font-size:13px;font-style:italic">Produk belum ada — tambah di Kelola Produk</div>';
      dd.style.display = 'block';
    }
    return;
  }
  _jpSkuIndex = -1;
  dd.innerHTML = katalogs.map((kat, i) => {
    const safe = kat.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    return '<div class="jp-dd-item" data-katalog="' + safe + '" data-idx="' + i + '"'
      + ' style="padding:10px 12px;cursor:pointer;font-size:14px;'
      + 'border-bottom:1px dashed var(--ink4);display:flex;justify-content:space-between;align-items:center;background:var(--cream)"'
      + ' onmouseenter="jpHighlightItem(this)"'
      + ' onclick="jpPilihKatalog(this.dataset.katalog)">'
      + '<span style="font-weight:600">' + kat + '</span>'
      + '<span style="font-size:11px;color:var(--ink3);margin-left:8px">' + katalogMap[kat] + ' var</span>'
      + '</div>';
  }).join('');
  _jpPositionDropdown();
  dd.style.display = 'block';
}

function _jpPositionDropdown() {
  const inp = document.getElementById('jp-sku-induk');
  const dd  = document.getElementById('jp-sku-dropdown');
  if (!inp || !dd) return;
  const rect = inp.getBoundingClientRect();
  dd.style.top   = (rect.bottom + 2) + 'px';
  dd.style.left  = rect.left + 'px';
  dd.style.width = (rect.width + 44) + 'px'; // +44 supaya cover tombol ▼ juga
}

function jpSugestKatalog() {
  _jpDdMode = 'suggest';
  _jpPositionDropdown();
  const q = (document.getElementById('jp-sku-induk').value || '').trim().toLowerCase();
  const katalogMap = {};
  _jpProdukList.forEach(p => {
    const kat = _jpGetKatalog(p);
    if (!kat) return;
    if (q && !kat.toLowerCase().includes(q)) return;
    katalogMap[kat] = (katalogMap[kat] || 0) + 1;
  });
  _jpRenderDropdown(Object.keys(katalogMap), katalogMap);
}

function jpToggleKatalogFull() {
  const dd = document.getElementById('jp-sku-dropdown');
  if (dd.style.display !== 'none' && _jpDdMode === 'full') {
    jpTutupDropdownSKU(); return;
  }
  _jpDdMode = 'full';
  _jpPositionDropdown();
  document.getElementById('jp-sku-induk').value = '';
  const katalogMap = {};
  _jpProdukList.forEach(p => {
    const kat = _jpGetKatalog(p);
    if (!kat) return;
    katalogMap[kat] = (katalogMap[kat] || 0) + 1;
  });
  _jpRenderDropdown(Object.keys(katalogMap), katalogMap);
  document.getElementById('jp-sku-induk').focus();
}

function jpHighlightItem(el) {
  document.getElementById('jp-sku-dropdown')
    .querySelectorAll('.jp-dd-item')
    .forEach(x => x.style.background = '');
  el.style.background = 'var(--cream2)';
  _jpSkuIndex = parseInt(el.dataset.idx);
}

function jpKatalogKeyNav(e) {
  const dd = document.getElementById('jp-sku-dropdown');
  if (!dd || dd.style.display === 'none') return;
  const items = dd.querySelectorAll('.jp-dd-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _jpSkuIndex = Math.min(_jpSkuIndex + 1, items.length - 1);
    items.forEach((x, i) => x.style.background = i === _jpSkuIndex ? 'var(--cream2)' : '');
    if (items[_jpSkuIndex]) items[_jpSkuIndex].scrollIntoView({block:'nearest'});
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _jpSkuIndex = Math.max(_jpSkuIndex - 1, 0);
    items.forEach((x, i) => x.style.background = i === _jpSkuIndex ? 'var(--cream2)' : '');
    if (items[_jpSkuIndex]) items[_jpSkuIndex].scrollIntoView({block:'nearest'});
  } else if (e.key === 'Enter' && _jpSkuIndex >= 0 && items[_jpSkuIndex]) {
    e.preventDefault();
    jpPilihKatalog(items[_jpSkuIndex].dataset.katalog);
  } else if (e.key === 'Escape') {
    jpTutupDropdownSKU();
  }
}

function _jpRenderPickerVariasiList(varList, sisakMap) {
  var list = document.getElementById('jp-picker-variasi-list');
  if (!list) return;
  var html = '<div class="kas-akun-item" data-val="" data-hpp="" onclick="jpPickerVariasiSelect(this)"><span style="color:var(--ink3)">— Pilih Variasi —</span></div>';
  varList.forEach(function(p) {
    var sku = _jpGetSku(p);
    var sisa = sisakMap[sku.toUpperCase()];
    var sisakHtml = '';
    if (sisa !== undefined) {
      var col = sisa <= 0 ? 'var(--danger)' : sisa <= 3 ? 'var(--warn)' : 'var(--ok)';
      sisakHtml = ' <span style="font-size:11px;font-weight:700;color:' + col + ';margin-left:6px">stok: ' + sisa + '</span>';
    }
    html += '<div class="kas-akun-item" data-val="' + sku + '" data-hpp="' + _jpGetHpp(p) + '" onclick="jpPickerVariasiSelect(this)" style="display:flex;align-items:center;justify-content:space-between">'
      + '<span>' + sku + '</span>' + sisakHtml + '</div>';
  });
  list.innerHTML = html;
}

async function jpPilihKatalog(katalog) {
  document.getElementById('jp-sku-induk').value = katalog;
  jpTutupDropdownSKU();
  const varList = _jpProdukList.filter(p => _jpGetKatalog(p) === katalog);
  const sel = document.getElementById('jp-sku-variasi');
  sel.innerHTML = '<option value="">— Pilih Variasi —</option>';
  varList.forEach(p => {
    const opt = document.createElement('option');
    opt.value         = _jpGetSku(p);
    opt.textContent   = _jpGetSku(p);
    opt.dataset.hpp   = _jpGetHpp(p);
    opt.dataset.sku   = _jpGetSku(p);
    sel.appendChild(opt);
  });
  // Render picker list dulu pakai _jpSisakMap yang ada (cepat, mungkin stale)
  _jpRenderPickerVariasiList(varList, _jpSisakMap);
  // Fetch fresh dari DB, lalu update picker list dengan nilai aktual
  _jpRefreshSisakMap().then(function() {
    _jpRenderPickerVariasiList(varList, _jpSisakMap);
  });
  // Reset label picker variasi
  var lbl = document.getElementById('jp-picker-variasi-label');
  if (lbl) { lbl.textContent = '— Pilih Variasi —'; lbl.style.color = 'var(--ink3)'; }

  if (varList.length === 1) {
    sel.selectedIndex = 1;
    jpOnPilihVariasi();
    // Sync picker label juga
    var listEl = document.getElementById('jp-picker-variasi-list');
    if (listEl) {
      var items = listEl.querySelectorAll('.kas-akun-item[data-val]');
      items.forEach(function(el) { el.classList.remove('active'); });
      var first = listEl.querySelector('.kas-akun-item[data-val="' + _jpGetSku(varList[0]) + '"]');
      if (first) {
        first.classList.add('active');
        if (lbl) { lbl.textContent = first.textContent.trim(); lbl.style.color = 'var(--ink)'; }
      }
    }
  } else {
    setTimeout(function() {
      var pickerBtn = document.getElementById('jp-picker-variasi');
      if (pickerBtn) jpTogglePicker('jp-picker-variasi');
    }, 60);
  }
}

// ─── HARGA DARI PRICE LIST (pakai channel_beban per channel) ──
async function _jpGetHargaFromPriceList(hpp) {
  if (!hpp || hpp <= 0) return 0;
  const chId = document.getElementById('jp-channel').value;
  if (!chId) return hpp;
  try {
    const bebanArr = await dbGet('channel_beban', '&channel_id=eq.' + chId);
    const beban    = bebanArr && bebanArr[0];
    if (!beban) return hpp; // belum ada setting beban → kembalikan HPP
    const mult = 1 + ((beban.beban_persen || 0) + (beban.npm_persen || 0)) / 100;
    return Math.ceil(hpp * mult);
  } catch(e) {
    return hpp;
  }
}

function jpOnPilihVariasi() {
  const sel = document.getElementById('jp-sku-variasi');
  const opt = sel.options[sel.selectedIndex];
  if (!opt || !opt.dataset.hpp) return;
  const hpp = parseInt(opt.dataset.hpp) || 0;
  if (!hpp) return;
  const hargaEl = document.getElementById('jp-harga');
  _jpGetHargaFromPriceList(hpp).then(harga => {
    hargaEl.value = harga || hpp;
    hitungTotalJP();
  });
}

function jpTutupDropdownSKU() {
  const dd = document.getElementById('jp-sku-dropdown');
  if (dd) dd.style.display = 'none';
}

document.addEventListener('click', function(e) {
  const inp = document.getElementById('jp-sku-induk');
  const btn = document.getElementById('jp-sku-dd-btn');
  const dd  = document.getElementById('jp-sku-dropdown');
  if (!inp || !dd) return;
  if (!inp.contains(e.target) && !dd.contains(e.target) && (!btn || !btn.contains(e.target))) {
    dd.style.display = 'none';
  }
});

// ─── HITUNG TOTAL ────────────────────────────────────────────
function hitungTotalJP() {
  const qty   = parseInt(document.getElementById('jp-qty').value)   || 0;
  const harga = idrVal('jp-harga');
  idrSet('jp-total', qty * harga > 0 ? qty * harga : 0);
}

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadJurnalPenjualan() {
  const tbody = document.getElementById('jp-tbody');
  tbody.innerHTML = '<tr><td colspan="9" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>';
  try {
    const mode = _jpWaktuMode || 'hari-ini';
    const now  = new Date();
    let filter = '';

    if (mode === 'hari-ini') {
      // Dari jam 00:00 hari ini
      const today = _jpLocalDate(now);
      filter = '&tanggal=gte.' + today + '&tanggal=lte.' + today;
    } else if (mode === 'kemarin') {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const tgl = _jpLocalDate(d);
      filter = '&tanggal=gte.' + tgl + '&tanggal=lte.' + tgl;
    } else if (mode === '7hari') {
      const since = _jpLocalDate(new Date(now - 7*24*60*60*1000));
      filter = '&tanggal=gte.' + since;
    } else if (mode === '30hari') {
      const since = _jpLocalDate(new Date(now - 30*24*60*60*1000));
      filter = '&tanggal=gte.' + since;
    } else if (mode === 'bulan') {
      const fBulan = (document.getElementById('jp-filter-bulan')||{}).value || '';
      if (fBulan) {
        const [y, m] = fBulan.split('-');
        const from = y + '-' + m + '-01';
        const to   = new Date(y, parseInt(m), 0).toISOString().split('T')[0];
        filter = '&tanggal=gte.' + from + '&tanggal=lte.' + to;
      }
    } else if (mode === 'custom') {
      const dari   = (document.getElementById('jp-dari')   ||{}).value || '';
      const sampai = (document.getElementById('jp-sampai') ||{}).value || '';
      if (dari)   filter += '&tanggal=gte.' + dari;
      if (sampai) filter += '&tanggal=lte.' + sampai;
    }

    const data = await dbGet('jurnal_penjualan', filter + '&order=tanggal.desc,id.desc');
    _jpAllData = data || [];
    filterJP();
    jpLoadTargetHarian(); // progress bar target harian
    _jpRefreshSisakMap(); // refresh sisa stok all-time untuk picker (async, non-blocking)
  } catch(err) {
    tbody.innerHTML = '<tr><td colspan="9" style="color:var(--danger)">Error: ' + err.message + '</td></tr>';
  }
}


// ─── FILTER WAKTU BERGAYA SHOPEE ─────────────────────────────
var _jpWaktuMode = 'bulan'; // default: bulan ini

function jpSetWaktu(mode) {
  _jpWaktuMode = mode;
  // Show/hide sub-input
  var bulanWrap  = document.getElementById('jp-bulan-wrap');
  var customWrap = document.getElementById('jp-custom-wrap');
  if (bulanWrap)  bulanWrap.style.display  = mode === 'bulan'  ? 'block' : 'none';
  if (customWrap) customWrap.style.display = mode === 'custom' ? 'block' : 'none';
  jpUpdatePeriodeLabel();
  jpUpdateBadge();
  if (mode !== 'bulan' && mode !== 'custom') {
    loadJurnalPenjualan();
    // Tutup panel periode setelah pilih (kecuali bulan/custom yang butuh sub-input)
    var panel = document.getElementById('jp-periode-panel');
    if (panel) panel.style.display = 'none';
  }
}

// ─── HELPER: posisikan panel tepat di bawah tombol (fixed) ───
function _jpPositionPanel(btnId, panelId) {
  var btn   = document.getElementById(btnId);
  var panel = document.getElementById(panelId);
  if (!btn || !panel) return;
  var rect = btn.getBoundingClientRect();
  panel.style.top  = (rect.bottom + 4) + 'px';
  panel.style.left = rect.left + 'px';
}

// ─── FILTER PANEL: PERIODE ───────────────────────────────────
function jpTogglePeriode() {
  var panel = document.getElementById('jp-periode-panel');
  var chPanel = document.getElementById('jp-channel-panel');
  if (!panel) return;
  if (chPanel) { chPanel.style.display = 'none'; document.removeEventListener('click', jpCloseChannelOutside); }
  var isOpen = panel.style.display !== 'none';
  var activeBtn = window.innerWidth > 520 ? 'jp-periode-btn-laptop' : 'jp-periode-btn';
  if (!isOpen) _jpPositionPanel(activeBtn, 'jp-periode-panel');
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(function() {
      document.addEventListener('click', jpClosePeriodeOutside);
    }, 50);
  } else {
    document.removeEventListener('click', jpClosePeriodeOutside);
  }
}
function jpClosePeriodeOutside(e) {
  var panel = document.getElementById('jp-periode-panel');
  var btn   = document.getElementById('jp-periode-btn');
  if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
    panel.style.display = 'none';
    document.removeEventListener('click', jpClosePeriodeOutside);
  }
}
function jpResetPeriode() {
  _jpWaktuMode = 'bulan';
  var radios = document.querySelectorAll('input[name="jp-waktu"]');
  radios.forEach(function(r) { r.checked = r.value === 'bulan'; });
  var bulanWrap  = document.getElementById('jp-bulan-wrap');
  var customWrap = document.getElementById('jp-custom-wrap');
  if (bulanWrap)  bulanWrap.style.display  = 'block';
  if (customWrap) customWrap.style.display = 'none';
  jpUpdateBadge();
  jpUpdatePeriodeLabel();
  loadJurnalPenjualan();
  var panel = document.getElementById('jp-periode-panel');
  if (panel) panel.style.display = 'none';
}

// ─── FILTER PANEL: CHANNEL ───────────────────────────────────
function jpToggleChannel() {
  var panel = document.getElementById('jp-channel-panel');
  var perPanel = document.getElementById('jp-periode-panel');
  if (!panel) return;
  if (perPanel) perPanel.style.display = 'none';
  var isOpen = panel.style.display !== 'none';
  var activeCh = window.innerWidth > 520 ? 'jp-channel-btn-laptop' : 'jp-channel-btn';
  if (!isOpen) _jpPositionPanel(activeCh, 'jp-channel-panel');
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(function() {
      document.addEventListener('click', jpCloseChannelOutside);
    }, 50);
  } else {
    document.removeEventListener('click', jpCloseChannelOutside);
  }
}
function jpCloseChannelOutside(e) {
  var panel = document.getElementById('jp-channel-panel');
  var btn   = document.getElementById('jp-channel-btn');
  if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
    panel.style.display = 'none';
    document.removeEventListener('click', jpCloseChannelOutside);
  }
}
function jpCloseChannelPanel() {
  var panel = document.getElementById('jp-channel-panel');
  if (panel) panel.style.display = 'none';
  document.removeEventListener('click', jpCloseChannelOutside);
}
function jpResetChannel() {
  var ch = document.getElementById('jp-filter-channel');
  if (ch) ch.value = '';
  jpUpdateBadge();
  jpUpdateChannelLabel();
  filterJP();
  var panel = document.getElementById('jp-channel-panel');
  if (panel) panel.style.display = 'none';
}

// ─── UPDATE LABEL TOMBOL ─────────────────────────────────────
function jpUpdatePeriodeLabel() {
  var map = {
    'hari-ini': 'Hari Ini',
    'kemarin':  'Kemarin',
    '7hari':    '7 Hari',
    '30hari':   '30 Hari',
    'bulan':    'Per Bulan',
    'custom':   'Custom'
  };
  var el = document.getElementById('jp-periode-label');
  if (el) el.textContent = map[_jpWaktuMode] || 'Hari Ini';
  // sync laptop label
  document.querySelectorAll('.jp-periode-label-sync').forEach(function(e){ e.textContent = map[_jpWaktuMode] || 'Hari Ini'; });
}
function jpUpdateChannelLabel() {
  var inp = document.getElementById('jp-filter-channel');
  var el  = document.getElementById('jp-channel-label');
  if (!inp || !el) return;
  var val = inp.value;
  var label = !val ? 'Channel' : (_jpChannelMap[val] ? _jpChannelMap[val].nama : 'Channel');
  el.textContent = label;
  // sync laptop label
  document.querySelectorAll('.jp-channel-label-sync').forEach(function(e){ e.textContent = label; });
}

function jpToggleFilter() {} // legacy stub — sudah diganti 2 panel
function jpUpdateBadge() {
  var mode    = _jpWaktuMode || 'bulan';
  var channel = (document.getElementById('jp-filter-channel') || {}).value || '';
  // Badge Periode
  var pBadge = document.getElementById('jp-periode-badge');
  if (pBadge) pBadge.style.display = mode !== 'bulan' ? 'inline' : 'none';
  // Badge Channel
  var cBadge = document.getElementById('jp-channel-badge');
  if (cBadge) cBadge.style.display = channel ? 'inline' : 'none';
  // Tombol Reset — muncul bila ada filter non-default aktif
  var resetBtn = document.getElementById('jp-reset-btn');
  var filterAktif = (mode !== 'bulan') || (channel !== '');
  if (resetBtn) resetBtn.style.display = filterAktif ? 'inline-flex' : 'none';
  var resetBtnLaptop = document.getElementById('jp-reset-btn-laptop');
  if (resetBtnLaptop) resetBtnLaptop.style.display = filterAktif ? 'inline-flex' : 'none';
  // Update label
  jpUpdatePeriodeLabel();
  jpUpdateChannelLabel();
}
function jpResetFilter() {
  jpResetPeriode();
  jpResetChannel();
}

// ─── PROGRESS BAR TARGET HARIAN ──────────────────────────────
async function jpLoadTargetHarian() {
  try {
    var wrap = document.getElementById('jp-target-wrap');
    if (!wrap) return;

    // Ambil beban operasional
    const bebanData = await dbGet('beban_operasional', '&tipe=eq.toko_utama');
    if (!bebanData || !bebanData.length) return;

    var totalNominal = 0;
    bebanData.forEach(function(r) { totalNominal += (parseFloat(r.nominal)||0); });
    if (totalNominal <= 0) return;

    // Ambil rasio Shopee (rata2 beban channel toko_utama)
    const chData    = await dbGet('channels',      '&kategori=eq.toko_utama');
    const bebanCh   = await dbGet('channel_beban', '');
    var bebanChMap  = {};
    (bebanCh||[]).forEach(function(b){ bebanChMap[b.channel_id] = b; });
    var sumRasio = 0; var cnt = 0;
    (chData||[]).forEach(function(ch) {
      if (bebanChMap[ch.id]) { sumRasio += (bebanChMap[ch.id].beban_persen||0); cnt++; }
    });
    var rasio = cnt > 0 ? sumRasio / cnt : 0;
    if (rasio <= 0) return;

    // Hitung target harian
    var targetOmset  = Math.round(totalNominal / (rasio / 100));
    var now          = new Date();
    var hariDlmBulan = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    var targetHarian = Math.round(targetOmset / hariDlmBulan);
    if (targetHarian <= 0) return;

    // Hitung omset hari ini dari data yang sudah ter-load
    var todayStr = _jpLocalDate(now);
    var omsetHari = 0;
    (_jpAllData||[]).forEach(function(r) {
      if (r.tanggal && String(r.tanggal).slice(0,10) === todayStr) {
        omsetHari += (Number(r.total)||0);
      }
    });

    // Render progress bar
    var fmtFn    = (typeof fmtRpFull === 'function') ? fmtRpFull : (typeof _fmtRp === 'function' ? _fmtRp : function(v){ return 'Rp'+Math.round(v).toLocaleString('id-ID'); });
    var pct      = Math.min(omsetHari / targetHarian * 100, 100).toFixed(1);
    var bar      = document.getElementById('jp-target-bar');
    var label    = document.getElementById('jp-target-label');
    var nominal  = document.getElementById('jp-target-nominal');
    if (bar) {
      bar.style.width      = pct + '%';
      bar.style.background = pct >= 80 ? 'var(--ok)' : pct >= 40 ? 'var(--warn)' : 'var(--danger)';
      bar.style.transition = 'width .6s ease, background .4s ease';
    }
    if (nominal) nominal.textContent = fmtFn(targetHarian);
    if (label) {
      var fmtFn = (typeof fmtRpFull === 'function') ? fmtRpFull : (typeof _fmtRp === 'function' ? _fmtRp : function(v){ return 'Rp'+Math.round(v).toLocaleString('id-ID'); });
      label.textContent = fmtFn(omsetHari) + ' · ' + pct + '% tercapai';
    }
    wrap.style.display = 'block';
  } catch(e) { /* silent fail */ }
}

// Helper: buat item channel custom dropdown
function _jpChItem(id, label, _unused, _unused2) {
  var curVal = (document.getElementById('jp-filter-channel') || {}).value || '';
  var active = String(id) === String(curVal) || (id === '' && curVal === '');
  return '<div data-ch-id="' + id + '" style="padding:8px 12px;cursor:pointer;font-size:13px;font-weight:' + (active?'700':'500') + ';border-radius:6px;margin:1px 4px;'
    + 'background:' + (active ? 'var(--ink)' : 'transparent') + ';'
    + 'color:' + (active ? 'var(--cream)' : 'var(--ink)') + ';transition:background .1s,color .1s"'
    + ' onmouseover="if(this.getAttribute(\'data-active\')!==\'1\'){this.style.background=\'var(--cream3)\';this.style.color=\'var(--ink)\'}"'
    + ' onmouseout="if(this.getAttribute(\'data-active\')!==\'1\'){this.style.background=\'transparent\'}">'
    + label + '</div>';
}

function filterJP() {
  const q   = '';
  const fcEl = document.getElementById('jp-filter-channel');
  const kat = fcEl ? fcEl.value : '';
  let hasil = _jpAllData.filter(r => {
    const ch = (_jpChannelMap[r.channel_id] ? _jpChannelMap[r.channel_id].nama : '').toLowerCase();
    const cocokQ  = !q || (r.sku||'').toLowerCase().includes(q) || ch.includes(q);
    const cocokCh = !kat || String(r.channel_id) === String(kat);
    return cocokQ && cocokCh;
  });
  renderTabelJP(hasil);
  updateMetricsJP(hasil);
}

// ─── RENDER TABEL ────────────────────────────────────────────
function renderTabelJP(data) {
  const tbody = document.getElementById('jp-tbody');
  const fmtRp = v => fmtRpFull(v);
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="color:var(--ink3);font-style:italic">Belum ada entri penjualan</td></tr>';
    document.getElementById('jp-footer').textContent = '';
    return;
  }

  // ─── Hitung sisa stok per SKU dari data stok global (sama persis logika stok.js) ───
  // Pakai _stokAllData kalau tersedia (di-load oleh stok.js), kalau tidak fetch sendiri
  function _jpRenderWithStok(sisakMap) {
    tbody.innerHTML = data.map(row => {
      const tgl = new Date(row.tanggal).toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'2-digit'});
      const jam = row.waktu ? String(row.waktu).slice(0,5) : '—';
      const ch  = _jpChannelMap[row.channel_id];
      const chHtml  = ch ? chBadge({ nama: ch.nama, kategori: ch.kategori||'' }) : '<span style="color:var(--ink3)">—</span>';
      // Sisa stok untuk SKU ini
      const skuKey  = (row.sku || '').toUpperCase();
      const sisaVal = sisakMap[skuKey];
      const sisaHtml = sisaVal === undefined
        ? '<span style="color:var(--ink3)">—</span>'
        : sisaVal <= 0
          ? '<b style="color:var(--danger)">' + sisaVal + '</b>'
          : sisaVal <= 3
            ? '<b style="color:var(--warn)">' + sisaVal + '</b>'
            : '<b style="color:var(--ok)">' + sisaVal + '</b>';
      // Status — dari field shopee_status kalau ada, kosong kalau manual
      const statusVal = row.shopee_status || '';
      const statusHtml = statusVal === 'READY_TO_SHIP'
        ? '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;background:var(--warn);color:#000">Perlu Kirim</span>'
        : statusVal === 'SHIPPED'
          ? '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;background:var(--ok);color:#000">Dikirim</span>'
          : statusVal === 'COMPLETED'
            ? '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;background:var(--ink2);color:var(--bg)">Selesai</span>'
            : '<span style="color:var(--ink3);font-size:10px">—</span>';
      return '<tr>'
        + '<td style="white-space:nowrap"><b>' + tgl + '</b> <span style="font-size:11px;color:var(--ink3)">' + jam + '</span></td>'
        + '<td>' + chHtml + '</td>'
        + '<td><b style="color:var(--accent)">' + (row.sku||'—') + '</b></td>'
        + '<td style="text-align:center">' + (row.qty||0) + '</td>'
        + '<td>' + fmtRp(row.harga_satuan) + '</td>'
        + '<td><b style="color:var(--ok)">' + fmtRp(row.total) + '</b></td>'
        + '<td style="text-align:center">' + sisaHtml + '</td>'
        + '<td style="text-align:center">' + statusHtml + '</td>'
        + '<td>'
        + '<button class="btn btn-sm" onclick="editJP(' + row.id + ')" style="margin-right:4px"><i class="ti ti-edit"></i></button>'
        + '<button class="btn btn-sm btn-danger" onclick="hapusJP(' + row.id + ',\'' + (row.sku||'').replace(/'/g,"\\'") + '\')"><i class="ti ti-trash"></i></button>'
        + '</td></tr>';
    }).join('');
    document.getElementById('jp-footer').textContent = 'Menampilkan ' + data.length + ' entri';
  }

  // Render pakai _jpSisakMap terkini (sudah di-refresh oleh _jpRefreshSisakMap di loadJurnalPenjualan)
  _jpRenderWithStok(_jpSisakMap);
}

// ─── REFRESH SISAK MAP (all-time, independen dari filter periode) ─────────────
// Dipanggil setiap loadJurnalPenjualan() agar picker selalu tampil nilai aktual
async function _jpRefreshSisakMap() {
  try {
    const [produkList, stokList, jurnalAll] = await Promise.all([
      dbGet('produk', '&select=sku_variasi'),
      dbGet('stok',   '&select=sku_variasi,stok_masuk'),
      dbGet('jurnal_penjualan', '&select=sku,qty'),
    ]);
    const masukMap = {};
    (stokList || []).forEach(function(r) {
      const k = (r.sku_variasi || '').toUpperCase();
      masukMap[k] = (masukMap[k] || 0) + (r.stok_masuk || 0);
    });
    const keluarMap = {};
    (jurnalAll || []).forEach(function(j) {
      const k = (j.sku || '').toUpperCase();
      keluarMap[k] = (keluarMap[k] || 0) + (j.qty || 0);
    });
    const sisakMap = {};
    (produkList || []).forEach(function(p) {
      const k = (p.sku_variasi || '').toUpperCase();
      sisakMap[k] = (masukMap[k] || 0) - (keluarMap[k] || 0);
    });
    _jpSisakMap = sisakMap;
    // Re-render tabel pakai sisakMap fresh (kalau tabel sudah ada datanya)
    if (Object.keys(sisakMap).length) {
      const tbody = document.getElementById('jp-tbody');
      if (tbody && tbody.querySelectorAll('tr').length > 0) {
        filterJP(); // trigger render ulang dengan data + sisakMap baru
      }
    }
  } catch(e) {
    // Gagal fetch — biarkan _jpSisakMap tetap nilai sebelumnya
  }
}

function updateMetricsJP(data) {
  const tot  = data.reduce((s,r) => s+(r.total||0), 0);
  const item = data.reduce((s,r) => s+(r.qty||0), 0);
  document.getElementById('jp-total-penjualan').textContent = 'Rp' + tot.toLocaleString('id-ID');
  document.getElementById('jp-total-item').textContent      = item.toLocaleString('id-ID') + ' item';
}

// ─── BUKA MODAL ──────────────────────────────────────────────
function showTambahJP() {
  document.getElementById('jp-modal-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Penjualan';
  document.getElementById('jp-id').value         = '';
  document.getElementById('jp-tgl').value        = _jpNowDate();
  document.getElementById('jp-waktu').value      = _jpNowTime();
  document.getElementById('jp-channel').value    = '';
  document.getElementById('jp-sku-induk').value  = '';
  document.getElementById('jp-sku-variasi').innerHTML = '<option value="">— Pilih Variasi —</option>';
  document.getElementById('jp-qty').value        = '';
  
  
  jpTutupDropdownSKU();
  loadProdukListJP();
  document.getElementById('modal-jp').classList.add('open');
setTimeout(() => { document.getElementById('jp-channel').focus(); }, 80);
}

// ─── EDIT ────────────────────────────────────────────────────
async function editJP(id) {
  try {
    const data = await dbGet('jurnal_penjualan', '&id=eq.' + id);
    if (!data || !data[0]) return;
    const r = data[0];
    document.getElementById('jp-modal-title').innerHTML = '<i class="ti ti-edit"></i> Edit Penjualan';
    document.getElementById('jp-id').value      = r.id;
    document.getElementById('jp-tgl').value     = r.tanggal ? r.tanggal.split('T')[0] : '';
    document.getElementById('jp-waktu').value   = r.waktu ? String(r.waktu).slice(0,5) : _jpNowTime();
    document.getElementById('jp-channel').value = r.channel_id || '';
    document.getElementById('jp-qty').value     = r.qty          || '';
    idrSet('jp-harga', r.harga_satuan || 0);
    idrSet('jp-total', r.total || 0);
    jpTutupDropdownSKU();
    if (_jpProdukList.length === 0) await loadProdukListJP();
    const skuVal = r.sku || '';
    const found  = _jpProdukList.find(p => _jpGetSku(p) === skuVal);
    if (found) {
      const kat = _jpGetKatalog(found);
      document.getElementById('jp-sku-induk').value = kat;
      jpPilihKatalog(kat);
setTimeout(() => { document.getElementById('jp-sku-variasi').value = skuVal; }, 80);
    } else {
      document.getElementById('jp-sku-induk').value = skuVal;
      const sel = document.getElementById('jp-sku-variasi');
      sel.innerHTML = skuVal
        ? '<option value="' + skuVal + '">' + skuVal + '</option>'
        : '<option value="">— Pilih Variasi —</option>';
    }
    document.getElementById('modal-jp').classList.add('open');
  } catch(err) { alert('Gagal load: ' + err.message); }
}

// ─── SIMPAN ──────────────────────────────────────────────────
async function simpanJP() {
  const id    = document.getElementById('jp-id').value;
  const qty   = parseInt(document.getElementById('jp-qty').value)   || 0;
  const harga = idrVal('jp-harga');
  const total = idrVal('jp-total') || qty * harga;
  const chIdRaw = document.getElementById('jp-channel').value;
  const chId    = chIdRaw ? chIdRaw : null;
  const skuV  = document.getElementById('jp-sku-variasi').value;
  const skuI  = document.getElementById('jp-sku-induk').value.trim().toUpperCase();
  const sku   = (skuV || skuI).trim().toUpperCase();
  const waktu = document.getElementById('jp-waktu').value || _jpNowTime();

  const payload = {
    tanggal:      document.getElementById('jp-tgl').value,
    waktu,
    channel_id:   chId,
    sku,
    qty,
    harga_satuan: harga,
    total,
  };

  if (!payload.tanggal) { alert('Tanggal wajib diisi!');      return; }
  if (!sku)             { alert('SKU wajib diisi!');          return; }
  if (qty <= 0)         { alert('Qty harus lebih dari 0!');   return; }
  if (harga <= 0)       { alert('Harga satuan harus diisi!'); return; }

  const btnSimpan = document.querySelector('#modal-jp .btn-primary');
  if (btnSimpan) { btnSimpan.textContent = 'Menyimpan...'; btnSimpan.disabled = true; }
  try {
    if (id) await dbUpdate('jurnal_penjualan', id, payload);
    else    await dbInsert('jurnal_penjualan', payload);
    closeModalJP();
    loadJurnalPenjualan();
    if (typeof loadDashboard === 'function') loadDashboard();
  } catch(err) {
    alert('Gagal simpan: ' + err.message);
  } finally {
    if (btnSimpan) {
      btnSimpan.innerHTML = '<i class="ti ti-device-floppy"></i> SIMPAN';
      btnSimpan.disabled = false;
    }
  }
}

// ─── HAPUS ───────────────────────────────────────────────────
async function hapusJP(id, sku) {
  confirmDelete('Hapus transaksi SKU "' + sku + '"?', async () => {
    try {
      await dbDelete('jurnal_penjualan', id);
      loadJurnalPenjualan();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch(err) { alert('Gagal hapus: ' + err.message); }
  });
}

// ─── EXPORT ──────────────────────────────────────────────────
async function exportJurnalPenjualan() {
  try {
    const data = await dbGet('jurnal_penjualan', '&order=tanggal.asc');
    if (!data || !data.length) { alert('Belum ada data penjualan'); return; }
    const headers = ['Tanggal','Waktu','Channel','SKU','Qty','Harga Satuan','Total'];
    const rows = data.map(r => {
      const ch = _jpChannelMap[r.channel_id];
      return [r.tanggal, r.waktu||'', ch?ch.nama:'', r.sku, r.qty, r.harga_satuan, r.total];
    });
    exportCSV('zenoot-jurnal-penjualan.csv', headers, rows);
  } catch(err) { alert('Gagal export: ' + err.message); }
}

// ─── INJECT PANEL PERIODE & CHANNEL KE BODY (sama seperti jp-sku-dropdown) ───
// Alasan: .content punya overflow-y:scroll → position:fixed di dalamnya
// tidak bekerja benar di semua browser. Solusi: mount ke body langsung.
(function() {
  // Panel Periode
  if (!document.getElementById('jp-periode-panel')) {
    var pp = document.createElement('div');
    pp.id = 'jp-periode-panel';
    pp.style.cssText = 'display:none;position:fixed;top:0;left:0;z-index:99999;'
      + 'background:var(--cream);border:2px solid var(--ink);min-width:210px;'
      + 'box-shadow:3px 4px 0 rgba(0,0,0,0.13)';
    pp.innerHTML = '<div style="padding:10px 12px">'
      + '<div style="font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;margin-bottom:7px;letter-spacing:.5px">Pilih Periode</div>'
      + '<div id="jp-waktu-opts" style="display:flex;flex-direction:column;gap:3px">'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="hari-ini" onchange="jpSetWaktu(this.value)" style="cursor:pointer"> Hari Ini (24 jam)</label>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="kemarin" onchange="jpSetWaktu(this.value)" style="cursor:pointer"> Kemarin</label>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="7hari" onchange="jpSetWaktu(this.value)" style="cursor:pointer"> 7 Hari Terakhir</label>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="30hari" onchange="jpSetWaktu(this.value)" style="cursor:pointer"> 30 Hari Terakhir</label>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="bulan" checked onchange="jpSetWaktu(this.value)" style="cursor:pointer"> Per Bulan</label>'
      + '<div id="jp-bulan-wrap" style="display:block;padding-left:20px;margin-top:2px">'
      + '<input type="month" id="jp-filter-bulan" style="font-family:var(--f);font-size:12px;padding:3px 6px;border:1.5px solid var(--ink3);background:var(--cream);width:100%;box-sizing:border-box" oninput="loadJurnalPenjualan();jpUpdateBadge()">'
      + '</div>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="custom" onchange="jpSetWaktu(this.value)" style="cursor:pointer"> Custom</label>'
      + '<div id="jp-custom-wrap" style="display:none;padding-left:20px;margin-top:2px">'
      + '<div style="font-size:11px;color:var(--ink3);margin-bottom:3px">Dari</div>'
      + '<input type="date" id="jp-dari" style="font-family:var(--f);font-size:12px;padding:3px 6px;border:1.5px solid var(--ink3);background:var(--cream);width:100%;box-sizing:border-box;margin-bottom:5px" onchange="loadJurnalPenjualan();jpUpdateBadge()">'
      + '<div style="font-size:11px;color:var(--ink3);margin-bottom:3px">Sampai</div>'
      + '<input type="date" id="jp-sampai" style="font-family:var(--f);font-size:12px;padding:3px 6px;border:1.5px solid var(--ink3);background:var(--cream);width:100%;box-sizing:border-box" onchange="loadJurnalPenjualan();jpUpdateBadge()">'
      + '</div>'
      + '</div>'
      + '</div>';
    document.body.appendChild(pp);
  }

  // Panel Channel
  if (!document.getElementById('jp-channel-panel')) {
    var cp = document.createElement('div');
    cp.id = 'jp-channel-panel';
    cp.style.cssText = 'display:none;position:fixed;top:0;left:0;z-index:99999;'
      + 'background:var(--cream2);border:none;min-width:200px;border-radius:10px;'
      + 'box-shadow:0 8px 32px rgba(0,0,0,0.6),0 2px 8px rgba(0,0,0,0.4)';
    cp.innerHTML = '<div style="padding:8px 6px">'
      + '<div style="font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;margin-bottom:6px;letter-spacing:.5px;padding:0 8px">Pilih Channel</div>'
      + '<div id="jp-channel-list" style="max-height:260px;overflow-y:auto"></div>'
      + '<input type="hidden" id="jp-filter-channel" value="">'
      + '</div>';
    document.body.appendChild(cp);
  }
})();
(function() {
  if (document.getElementById('jp-sku-dropdown')) return;
  const dd = document.createElement('div');
  dd.id = 'jp-sku-dropdown';
  dd.style.cssText = 'display:none;position:fixed;z-index:99999;background:var(--cream);'
    + 'border:2px solid var(--ink);border-top:none;max-height:220px;overflow-y:auto;'
    + 'box-shadow:4px 4px 0 var(--ink4)';
  document.body.appendChild(dd);
})();

// ─── INIT ────────────────────────────────────────────────────
// Default periode: bulan ini
_jpWaktuMode = 'bulan';
// Guard: pastikan elemen sudah ada sebelum mengisi nilai (IIFE inject sudah jalan di atas)
(function _jpSafeInit() {
  var bulanEl = document.getElementById('jp-filter-bulan');
  if (bulanEl) {
    bulanEl.value = new Date().toISOString().slice(0,7);
  }
  // Sedikit delay agar DOM inject selesai di semua engine (terutama iOS WebKit)
  setTimeout(function() {
    Promise.all([
      loadChannelDropdownJP(),
      loadProdukListJP()
    ]).then(function() { loadJurnalPenjualan(); }).catch(function(e) {
      console.warn('[JP init error]', e);
      loadJurnalPenjualan();
    });
  }, 50);
})();

// ─── HOOK zenot:page — layout flex + reset topbar ────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'jurnal-penjualan') return;
  // requestAnimationFrame memastikan layout flush terjadi setelah paint
  // sangat penting di iOS Safari yang lazy dalam menghitung flex chain
  var raf = window.requestAnimationFrame || function(fn) { setTimeout(fn, 16); };
  raf(function() {
    _jpEnsureFlexLayout();
    var tb = document.getElementById('jp-top-bar');
    if (tb) tb.classList.remove('jp-topbar-collapsed');
    // Re-scroll ke atas
    var wrap = document.getElementById('jp-tbl-wrap');
    if (wrap) wrap.scrollTop = 0;
  });
  // Reload data otomatis saat navigasi ke halaman ini (debounce 250ms)
  clearTimeout(window._jpReloadTimer);
  window._jpReloadTimer = setTimeout(loadJurnalPenjualan, 250);
});

// ─── SWIPE GESTURE — collapse jp-top-bar di landscape touch ─────────
(function() {
  var _mq = window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: landscape)');
  function _jpInitSwipe() {
    if (!_mq.matches) return;
    var zone     = document.getElementById('jp-sticky-header');
    var topBar   = document.getElementById('jp-top-bar');
    if (!zone || !topBar) return;
    // Gabung jp-top-bar sebagai swipe zone juga
    initSwipeCollapse(zone,   topBar, 50);
    initSwipeCollapse(topBar, topBar, 50);
  }
  setTimeout(_jpInitSwipe, 250);
  // Re-init saat zenot:page
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'jurnal-penjualan') return;
    setTimeout(function() {
      var tb = document.getElementById('jp-top-bar');
      if (tb) tb.classList.remove('jp-topbar-collapsed');
      _jpInitSwipe();
    }, 80);
  });
})();

// ─── JP CUSTOM PICKER ENGINE ─────────────────────────────────

function jpTogglePicker(pickerId) {
  var picker = document.getElementById(pickerId);
  var list   = document.getElementById(pickerId + '-list');
  if (!picker || !list) return;
  // Tutup semua picker jp lain
  document.querySelectorAll('.kas-akun-list').forEach(function(el) {
    if (el.id !== pickerId + '-list') jpClosePicker(el);
  });
  if (list.style.display === 'block') { jpClosePicker(list); return; }

  // Inject search box jika belum ada
  if (!list.querySelector('.kas-akun-search-wrap')) {
    var wrap = document.createElement('div');
    wrap.className = 'kas-akun-search-wrap';
    wrap.innerHTML =
      '<span class="kas-akun-search-icon">🔍</span>' +
      '<input class="kas-akun-search" type="text" placeholder="Cari..." autocomplete="off" ' +
        'onmousedown="event.stopPropagation()" ' +
        'ontouchstart="event.stopPropagation()" ' +
        'oninput="kasPickerFilter(this)">';
    list.insertBefore(wrap, list.firstChild);
  }

  // Reset search & tampilkan semua item
  var inp = list.querySelector('.kas-akun-search');
  if (inp) inp.value = '';
  list.querySelectorAll('.kas-akun-item,.kas-akun-group,.kas-akun-empty').forEach(function(el) { el.style.display = ''; });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';

  // Float ke body agar tidak terpotong overflow modal
  var rect = picker.getBoundingClientRect();
  list.style.position  = 'fixed';
  list.style.top       = (rect.bottom + 2) + 'px';
  list.style.left      = rect.left + 'px';
  list.style.width     = rect.width + 'px';
  list.style.maxWidth  = '360px';
  list.style.zIndex    = '99999';
  list.dataset.floated = '1';
  list.style.display   = 'block';
  if (list.parentNode !== document.body) document.body.appendChild(list);

  // Auto-focus search
  if (inp) setTimeout(function() { inp.focus(); }, 50);
}

function jpClosePicker(list) {
  if (!list) return;
  // Reset search
  var inp = list.querySelector('.kas-akun-search');
  if (inp) inp.value = '';
  list.querySelectorAll('.kas-akun-item,.kas-akun-group').forEach(function(el) { el.style.display = ''; });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';

  if (list.dataset.floated && list.parentNode === document.body) {
    var pickerId = list.id.replace('-list', '');
    var picker   = document.getElementById(pickerId);
    if (picker && picker.parentNode) picker.parentNode.appendChild(list);
    delete list.dataset.floated;
  }
  list.style.display = 'none';
}

function jpPickerChannelSelect(item) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  var list = item.closest('.kas-akun-list');
  if (!list) return;
  var val   = item.dataset.val || '';
  var label = item.textContent.trim();
  // Update hidden select
  var sel = document.getElementById('jp-channel');
  if (sel) { sel.value = val; sel.dispatchEvent(new Event('change')); }
  // Update label
  var lbl = document.getElementById('jp-picker-channel-label');
  if (lbl) { lbl.textContent = val ? label : '— Pilih Channel —'; lbl.style.color = val ? 'var(--ink)' : 'var(--ink3)'; }
  // Tandai aktif
  list.querySelectorAll('.kas-akun-item').forEach(function(el) { el.classList.remove('active'); });
  item.classList.add('active');
  jpClosePicker(list);
}

function jpPickerVariasiSelect(item) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  var list = item.closest('.kas-akun-list');
  if (!list) return;
  var val = item.dataset.val || '';
  var hpp = item.dataset.hpp || '';
  var label = item.textContent.trim();
  // Update hidden select
  var sel = document.getElementById('jp-sku-variasi');
  if (sel) {
    sel.value = val;
    // Tandai dataset di option yang cocok agar jpOnPilihVariasi bisa baca
    var opts = sel.options;
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].value === val) { opts[i].selected = true; break; }
    }
    sel.dispatchEvent(new Event('change'));
  }
  // Update label
  var lbl = document.getElementById('jp-picker-variasi-label');
  if (lbl) {
    if (val) {
      var sisa = _jpSisakMap[val.toUpperCase()];
      var sisakTxt = '';
      if (sisa !== undefined) {
        var col = sisa <= 0 ? 'var(--danger)' : sisa <= 3 ? 'var(--warn)' : 'var(--ok)';
        sisakTxt = ' <span style="font-size:11px;font-weight:700;color:' + col + '">stok: ' + sisa + '</span>';
      }
      lbl.innerHTML = '<span style="color:var(--ink)">' + label + '</span>' + sisakTxt;
    } else {
      lbl.textContent = '— Pilih Variasi —';
      lbl.style.color = 'var(--ink3)';
    }
  }
  // Tandai aktif
  list.querySelectorAll('.kas-akun-item').forEach(function(el) { el.classList.remove('active'); });
  item.classList.add('active');
  jpClosePicker(list);
  // Trigger hitung harga
  if (val) jpOnPilihVariasi();
}

// Reset label picker variasi saat katalog/modal reset
var _jpOrigCloseModal = window.closeModalJP;
if (typeof closeModalJP === 'function') {
  var _jpOrigClose2 = closeModalJP;
  window.closeModalJP = function() {
    _jpOrigClose2();
    var lblV = document.getElementById('jp-picker-variasi-label');
    if (lblV) { lblV.textContent = '— Pilih Variasi —'; lblV.style.color = 'var(--ink3)'; }
    var lblC = document.getElementById('jp-picker-channel-label');
    if (lblC) { lblC.textContent = '— Pilih Channel —'; lblC.style.color = 'var(--ink3)'; }
  };
}

// Tutup picker saat klik di luar
// close listener: handled by unified handler in app.js
