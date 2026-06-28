// ─── STOK.JS v3 — basis dari produk, keluar dari jurnal ───────

// ─── STATUS BADGE — 5-level velocity (konsep China: cash jangan mandeg di stok) ───
// Fast   : sales 7hr > 0                          → restock agresif
// Slow   : sales 7hr = 0, sales 30hr > 0          → monitor, promo dulu
// Dead   : sales 30hr = 0, sales 90hr > 0         → BLOCK restock, clearance
// Zombie : sales 90hr = 0                         → discontinue, jual rugi
// Habis  : sisa <= 0                              → urgent jika Fast, ignore jika Dead/Zombie
function _stokVelocity(sales7, sales30, sales90) {
  if ((sales7  || 0) > 0) return 'fast';
  if ((sales30 || 0) > 0) return 'slow';
  if ((sales90 || 0) > 0) return 'dead';
  return 'zombie';
}

// statusBadge: parameter ke-2 adalah velocity string (bukan kat)
// dipanggil dengan: statusBadge(sisa, vel, sales7, sales30, sales90)
function statusBadge(sisa, vel, sales7, sales30, sales90) {
  // Jika vel belum dihitung (legacy call), hitung dari sales
  if (!vel || vel === 'aktif' || vel === 'discontinued' || vel === 'seasonal' || vel === 'clearance') {
    vel = _stokVelocity(sales7, sales30, sales90);
  }
  if (sisa <= 0) {
    if (vel === 'fast')   return '<span style="font-size:10px;font-weight:700;color:var(--danger);padding:2px 6px;border:1.5px solid var(--danger);border-radius:2px">Habis 🔥</span>';
    if (vel === 'slow')   return '<span style="font-size:10px;font-weight:700;color:var(--danger);padding:2px 6px;border:1.5px solid var(--danger);border-radius:2px">Habis</span>';
    return '<span style="font-size:10px;font-weight:700;color:var(--ink3);padding:2px 6px;border:1.5px solid var(--ink3);border-radius:2px;opacity:0.6">Habis</span>';
  }
  if (vel === 'fast')   return '<span style="font-size:10px;font-weight:700;color:#00c896;padding:2px 6px;border:1.5px solid #00c896;border-radius:2px">Fast</span>';
  if (vel === 'slow')   return '<span style="font-size:10px;font-weight:700;color:#c8a000;padding:2px 6px;border:1.5px solid #c8a000;border-radius:2px">Slow</span>';
  if (vel === 'dead')   return '<span style="font-size:10px;font-weight:700;color:#e05c00;padding:2px 6px;border:1.5px solid #e05c00;border-radius:2px">Dead</span>';
  return '<span style="font-size:10px;font-weight:700;color:var(--ink3);padding:2px 6px;border:1.5px solid var(--ink3);border-radius:2px">Zombie</span>';
}

// page-stok flex column sudah diatur via CSS #page-stok
document.getElementById('page-stok').innerHTML = `
  <div id="stok-filter-bar" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
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



        <!-- Reset dipindah ke luar dropdown -->
      </div>

      <!-- Submenu — di luar dd-filter-all, sejajar dengannya -->
      <div id="dd-filter-boss" style="display:none;position:fixed;z-index:9999;
        background:var(--cream);border:2px solid var(--ink);min-width:170px;max-height:260px;overflow-y:auto;
        box-shadow:4px 4px 0 var(--ink4)"></div>
      <div id="dd-filter-katalog" style="display:none;position:fixed;z-index:9999;
        background:var(--cream);border:2px solid var(--ink);min-width:190px;max-height:260px;overflow-y:auto;
        box-shadow:4px 4px 0 var(--ink4)"></div>

    </div>

    <!-- RESET FILTER — sejajar tombol Filter -->
    <button class="btn btn-sm" id="btn-stok-reset" onclick="stokResetAllFilter()"
      style="display:none;font-size:12px;border-color:var(--danger);color:var(--danger)">
      <i class="ti ti-x"></i> Reset Filter
    </button>

    <!-- Tombol Summary -->
    <button class="btn btn-sm" onclick="stokToggleSummary()" style="border-color:var(--ink3);color:var(--ink)">
      <i class="ti ti-chart-bar"></i> Summary
    </button>

    <!-- KANAN: Paste Massal + Tambah -->
    <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
      <button class="btn btn-sm" onclick="showPasteStok()"><i class="ti ti-clipboard"></i> Paste Massal</button>
      <button class="btn btn-sm btn-primary" onclick="showTambahStok()"><i class="ti ti-plus"></i> Tambah</button>
    </div>
  </div>

  <!-- PANEL SUMMARY STOK -->
  <div id="stok-summary-panel" style="display:none;margin-bottom:14px;padding:14px 16px;border:2px solid var(--ink);background:var(--cream2)">
    <div style="font-weight:700;font-size:13px;margin-bottom:10px;display:flex;justify-content:space-between">
      <span><i class="ti ti-chart-bar"></i> Summary Stok</span>
      <span id="stok-summary-cash-locked" style="color:var(--danger);font-size:12px"></span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px" id="stok-summary-cards"></div>
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

  <!-- FORM TAMBAH/EDIT STOK MASUK — konsep modal JP -->
  <div class="modal-overlay" id="modal-stok-masuk" onclick="stokOverlayClose(event)">
    <div class="modal" style="max-width:480px;width:100%;padding:16px;max-height:92vh;overflow-y:auto;overscroll-behavior:none;touch-action:pan-y;box-sizing:border-box">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;
                  margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
        <div class="modal-title" id="stok-form-title"
             style="margin:0;border:none;padding:0;font-size:18px">
          <i class="ti ti-plus"></i> Tambah Stok Masuk
        </div>
        <button onclick="cancelStokForm()"
          style="background:none;border:none;font-size:22px;cursor:pointer;
                 color:var(--ink3);line-height:1;padding:4px 8px;">&#10005;</button>
      </div>

      <input type="hidden" id="inp-id">

      <!-- SKU Induk — search + dropdown seperti JP -->
      <div class="form-group" style="margin-bottom:12px;position:relative">
        <label>SKU Induk (Katalog)</label>
        <div style="display:flex;width:100%">
          <input type="text" id="inp-sku-induk"
            placeholder="Ketik nama katalog..."
            autocomplete="off"
            style="flex:1;border-right:none;font-family:var(--f);font-size:14px;
                   padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box"
            oninput="stokSuggestKatalog()"
            onkeydown="stokKatalogKeyNav(event)"
            onfocus="stokSuggestKatalog()">
          <button id="stok-katalog-dd-btn"
            onclick="stokToggleKatalogFull()"
            title="Lihat semua katalog"
            style="background:var(--cream2);border:2px solid var(--ink);border-left:none;
                   padding:0 10px;cursor:pointer;font-size:14px;color:var(--ink);
                   min-height:44px;flex-shrink:0">&#9660;</button>
        </div>
      </div>

      <!-- SKU Variasi — picker custom seperti JP -->
      <div class="form-group" style="margin-bottom:12px">
        <label>SKU Variasi</label>
        <select id="inp-sku" style="display:none"></select>
        <div class="kas-akun-wrap">
          <div class="kas-akun-picker" id="stok-picker-variasi" data-target="inp-sku"
            onmousedown="event.stopPropagation();stokTogglePicker('stok-picker-variasi')"
            ontouchend="event.preventDefault();event.stopPropagation();stokTogglePicker('stok-picker-variasi')">
            <span id="stok-picker-variasi-label" style="color:var(--ink3)">— Pilih Variasi —</span>
            <span style="margin-left:auto;color:var(--ink3);font-size:10px">&#9662;</span>
          </div>
          <div class="kas-akun-list" id="stok-picker-variasi-list" style="display:none"></div>
        </div>
      </div>

      <!-- Stok Masuk / Set Sisa -->
      <div id="stok-info-sisa" style="display:none;margin-bottom:10px;padding:8px 12px;background:var(--cream2);border:1.5px dashed var(--ink3);font-size:13px">
        Sisa saat ini: <b id="stok-info-sisa-val" style="color:var(--ok)">0</b> pcs
        &nbsp;·&nbsp; Sales (keluar): <b id="stok-info-keluar-val" style="color:var(--ink3)">0</b> pcs
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label id="lbl-inp-masuk">Stok Masuk (Qty)</label>
        <input type="number" id="inp-masuk" placeholder="0" min="0"
          style="font-size:20px;font-weight:700;width:100%;box-sizing:border-box">
      </div>

      <!-- Tombol Aksi -->
      <div style="border-top:1.5px dashed var(--ink3);padding-top:12px;display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end">
        <button class="btn btn-sm" onclick="cancelStokForm()" style="flex:1 1 100px;min-width:80px">
          <i class="ti ti-x"></i> Batal
        </button>
        <button class="btn btn-primary btn-sm" onclick="simpanStok()"
          style="flex:2 1 140px;font-weight:700;font-size:14px;padding:8px 16px">
          <i class="ti ti-device-floppy"></i> SIMPAN
        </button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;gap:8px;flex-shrink:0">
      <i class="ti ti-package"></i> Semua SKU
      <span id="stok-summary" style="font-size:12px;color:var(--ink3);font-weight:400;margin-left:auto"></span>
    </div>

    <!-- TAB STATUS -->
    <div id="stok-status-tabs" style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
      <button class="stok-tab-btn stok-tab-active" data-tab="all"    onclick="stokTabStatus('all')">Semua</button>
      <button class="stok-tab-btn" data-tab="fast"   onclick="stokTabStatus('fast')">🟢 Fast</button>
      <button class="stok-tab-btn" data-tab="slow"   onclick="stokTabStatus('slow')">🟡 Slow</button>
      <button class="stok-tab-btn" data-tab="dead"   onclick="stokTabStatus('dead')">🔴 Dead</button>
      <button class="stok-tab-btn" data-tab="zombie" onclick="stokTabStatus('zombie')">⚫ Zombie</button>
      <button class="stok-tab-btn" data-tab="habis"  onclick="stokTabStatus('habis')">💀 Habis</button>
    </div>

    <div id="stok-tbl-wrap"><table class="tbl">
      <thead><tr>
        <th>Katalog</th><th>SKU Variasi</th><th>Boss</th>
        <th onclick="stokToggleSort('sisa')" style="cursor:pointer;user-select:none;white-space:nowrap">Sisa <span id="sort-icon-sisa">⇅</span></th>
        <th>Aksi</th>
        <th onclick="stokToggleSort('sales')" style="cursor:pointer;user-select:none;white-space:nowrap">Sales 7hr <span id="sort-icon-sales">⇅</span></th>
        <th onclick="stokToggleSort('sales_total')" style="cursor:pointer;user-select:none;white-space:nowrap">Sales Total <span id="sort-icon-sales_total">⇅</span></th>
        <th>HPP</th><th onclick="stokToggleSort('nilai')" style="cursor:pointer;user-select:none;white-space:nowrap">Nilai Stok <span id="sort-icon-nilai">⇅</span></th>
        <th>Status</th>
      </tr></thead>
      <tbody id="stok-tbody">
        <tr><td colspan="10" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
    </div>
  </div>
`;

setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-stok')); }, 80);

// Inject CSS tab stok status
(function() {
  if (document.getElementById('stok-tab-style')) return;
  var s = document.createElement('style');
  s.id = 'stok-tab-style';
  s.textContent = '.stok-tab-btn{padding:4px 12px;font-size:12px;font-weight:600;border:1.5px solid var(--ink3);background:transparent;color:var(--ink3);cursor:pointer;border-radius:3px;font-family:var(--f);transition:all .15s}.stok-tab-btn:hover{border-color:var(--ink);color:var(--ink)}.stok-tab-btn.stok-tab-active{border-color:var(--ink);background:var(--ink);color:var(--cream)}';
  document.head.appendChild(s);
})();




// ─── STATE ────────────────────────────────────────────────────
let _stokAllData  = [];   // hasil merge produk + stok + jurnal
let _stokMasukMap = {};   // sku -> {id, qty}  (dari tabel stok)
let _produkForStok = [];  // dari tabel produk
let _stokSelectedSku = ''; // SKU variasi yang dipilih dari picker — reliable vs hidden select
let _stokEditMode    = false; // true = edit existing record (replace), false = tambah baru (akumulasi)

// ─── LOAD UTAMA ───────────────────────────────────────────────
async function loadStok() {
  const tbody = document.getElementById('stok-tbody');
  tbody.innerHTML = '<tr><td colspan="10" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>';

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

    // 3. Ambil sum keluar dari jurnal_penjualan per SKU (all-time)
    const jurnalData = await dbGet('jurnal_penjualan', '&select=sku,qty&or=(order_status.neq.CANCELLED,order_status.is.null)');
    const keluarMap = {};
    if (Array.isArray(jurnalData)) {
      jurnalData.forEach(j => {
        const key = (j.sku || '').toUpperCase();
        keluarMap[key] = (keluarMap[key] || 0) + (j.qty || 0);
      });
    }

    // 3b. Ambil sales 7 hari terakhir per SKU (untuk status Fast/Slow/Dead)
    const tgl7 = new Date(); tgl7.setDate(tgl7.getDate() - 7);
    const tgl30 = new Date(); tgl30.setDate(tgl30.getDate() - 30);
    const tgl90 = new Date(); tgl90.setDate(tgl90.getDate() - 90);
    const tgl7Str  = tgl7.toISOString().slice(0, 10);
    const tgl30Str = tgl30.toISOString().slice(0, 10);
    const tgl90Str = tgl90.toISOString().slice(0, 10);

    const [jurnal7Data, jurnal30Data, jurnal90Data] = await Promise.all([
      dbGet('jurnal_penjualan', '&select=sku,qty&or=(order_status.neq.CANCELLED,order_status.is.null)&tanggal=gte.' + tgl7Str),
      dbGet('jurnal_penjualan', '&select=sku,qty&or=(order_status.neq.CANCELLED,order_status.is.null)&tanggal=gte.' + tgl30Str),
      dbGet('jurnal_penjualan', '&select=sku,qty&or=(order_status.neq.CANCELLED,order_status.is.null)&tanggal=gte.' + tgl90Str),
    ]);

    const sales7Map = {}, sales30Map = {}, sales90Map = {};
    const _buildMap = (data, map) => {
      if (Array.isArray(data)) data.forEach(j => {
        const key = (j.sku || '').toUpperCase();
        map[key] = (map[key] || 0) + (j.qty || 0);
      });
    };
    _buildMap(jurnal7Data,  sales7Map);
    _buildMap(jurnal30Data, sales30Map);
    _buildMap(jurnal90Data, sales90Map);

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
        sales7:           sales7Map[skuKey]  || 0,
        sales30:          sales30Map[skuKey] || 0,
        sales90:          sales90Map[skuKey] || 0,
        sisa,
        nilai_stok:       sisa > 0 ? sisa * (p.hpp || 0) : 0,
        _stok_id:         _stokMasukMap[skuKey] ? _stokMasukMap[skuKey].id : null,
      };
    });

    filterStok(); // jaga filter aktif setelah reload
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="10" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
  }
}

// ─── RENDER ───────────────────────────────────────────────────
function renderStok(data) {
  const tbody = document.getElementById('stok-tbody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="color:var(--ink3);font-style:italic">Belum ada data produk</td></tr>';
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
    const vel = _stokVelocity(row.sales7, row.sales30, row.sales90);
    return `<tr>
      <td>${row.katalog || '—'}</td>
      <td><b>${row.sku_variasi || '—'}</b></td>
      <td>${row.boss || '—'}</td>
      <td style="text-align:center"><b>${row.sisa}</b></td>
      <td>
        <button class="btn btn-sm" data-action="edit-stok" data-sku="${safeSku}" title="Edit stok masuk"><i class="ti ti-edit"></i></button>
      </td>
      <td style="text-align:center;color:var(--ok)">${row.sales7 || 0}</td>
      <td style="text-align:center;color:var(--ink3)">${row.stok_keluar}</td>
      <td>${hpp}</td>
      <td style="color:var(--ok);font-weight:700">${nilai}</td>
      <td>${statusBadge(row.sisa, vel, row.sales7, row.sales30, row.sales90)}</td>
    </tr>`;
  }).join('');
  // Re-render rough UI setelah data selesai
  requestAnimationFrame(function() {
    if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-stok'));
  });
}

// ─── SUMMARY ──────────────────────────────────────────────────
function stokToggleSummary() {
  var panel = document.getElementById('stok-summary-panel');
  if (!panel) return;
  var open = panel.style.display !== 'none';
  panel.style.display = open ? 'none' : 'block';
  if (!open) stokRenderSummary();
}

function stokRenderSummary() {
  if (!_stokAllData || !_stokAllData.length) return;
  var counts = { fast:0, slow:0, dead:0, zombie:0, habis:0 };
  var skus   = { fast:[], slow:[], dead:[], zombie:[], habis:[] };
  var cashLocked = 0; // nilai IDR mandeg di dead+zombie

  _stokAllData.forEach(function(r) {
    var vel = _stokVelocity(r.sales7, r.sales30, r.sales90);
    var sisa = Math.max(0, r.sisa || 0);
    if (r.sisa <= 0) {
      counts.habis++;
      skus.habis.push({ sku: r.sku_variasi, vel: vel });
    } else {
      counts[vel]++;
      skus[vel].push(r.sku_variasi);
      if (vel === 'dead' || vel === 'zombie') cashLocked += sisa * (r.hpp || 0);
    }
  });

  var cfg = [
    { key:'fast',   label:'🟢 Fast Moving',  sub:'Laku 7hr terakhir',        color:'#00c896', action:'Restock' },
    { key:'slow',   label:'🟡 Slow Moving',  sub:'Tidak laku 7–30hr',         color:'#c8a000', action:'Promo' },
    { key:'dead',   label:'🔴 Dead Stock',   sub:'Tidak laku 30–90hr',        color:'#e05c00', action:'Clearance' },
    { key:'zombie', label:'⚫ Zombie',        sub:'Tidak laku >90hr',          color:'var(--ink3)', action:'Discontinue' },
    { key:'habis',  label:'💀 Habis',        sub:'Stok = 0',                  color:'var(--danger)', action:'Cek demand' },
  ];

  var html = '';
  cfg.forEach(function(s) {
    var n = counts[s.key];
    html += '<div style="border:1.5px solid ' + s.color + ';padding:10px 12px;cursor:pointer" onclick="stokTabStatus(\'' + s.key + '\')">'
      + '<div style="font-size:11px;color:' + s.color + ';font-weight:700">' + s.label + '</div>'
      + '<div style="font-size:24px;font-weight:700;line-height:1.2">' + n + ' <span style="font-size:11px;color:var(--ink3);font-weight:400">SKU</span></div>'
      + '<div style="font-size:10px;color:var(--ink3);margin-top:2px">' + s.sub + '</div>'
      + '<div style="font-size:10px;margin-top:4px;padding:2px 6px;display:inline-block;border:1px solid ' + s.color + ';color:' + s.color + '">' + s.action + '</div>'
      + '</div>';
  });

  var cards = document.getElementById('stok-summary-cards');
  if (cards) cards.innerHTML = html;

  var cashEl = document.getElementById('stok-summary-cash-locked');
  if (cashEl) {
    cashEl.textContent = cashLocked > 0
      ? '💰 Cash mandeg di Dead+Zombie: Rp' + cashLocked.toLocaleString('id-ID')
      : '';
  }
}

// ─── STATUS TABS ──────────────────────────────────────────────
var _filterStatusTab = null; // null = semua

function stokTabStatus(tab) {
  _filterStatusTab = tab === 'all' ? null : tab;
  // Update active state tombol
  document.querySelectorAll('.stok-tab-btn').forEach(function(btn) {
    if (btn.dataset.tab === tab) {
      btn.classList.add('stok-tab-active');
    } else {
      btn.classList.remove('stok-tab-active');
    }
  });
  filterStok();
}

// ─── FILTER ───────────────────────────────────────────────────
function filterStok() {
  const filtered = _stokAllData.filter(r => {
    if (_filterBoss    && (r.boss    || '') !== _filterBoss)    return false;
    if (_filterKatalog && (r.katalog || '') !== _filterKatalog) return false;
    // Tab status filter — velocity adalah sifat produk, bukan kondisi stok
    if (_filterStatusTab) {
      const sisa = r.sisa;
      const vel  = _stokVelocity(r.sales7, r.sales30, r.sales90);
      if (_filterStatusTab === 'habis'  && !(sisa <= 0))    return false;
      if (_filterStatusTab === 'fast'   && vel !== 'fast')  return false;
      if (_filterStatusTab === 'slow'   && vel !== 'slow')  return false;
      if (_filterStatusTab === 'dead'   && vel !== 'dead')  return false;
      if (_filterStatusTab === 'zombie' && vel !== 'zombie') return false;
    }
    return true;
  });

  // Apply sort
  if (_stokSort.col) {
    filtered.sort(function(a, b) {
      var va = _stokSort.col === 'sisa'        ? (a.sisa || 0)
             : _stokSort.col === 'sales'       ? (a.sales7 || 0)
             : _stokSort.col === 'sales_total' ? (a.stok_keluar || 0)
             : (a.nilai_stok || 0);
      var vb = _stokSort.col === 'sisa'        ? (b.sisa || 0)
             : _stokSort.col === 'sales'       ? (b.sales7 || 0)
             : _stokSort.col === 'sales_total' ? (b.stok_keluar || 0)
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
  }
});

// ─── FORM TAMBAH/EDIT — konsep JP ────────────────────────────
var _stokKatalogIndex = -1;
var _stokDdMode = 'suggest';

function stokOverlayClose(e) {
  if (e.target === document.getElementById('modal-stok-masuk')) cancelStokForm();
}

function showTambahStok() {
  document.getElementById('stok-form-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Stok Masuk';
  document.getElementById('inp-id').value        = '';
  document.getElementById('inp-sku-induk').value = '';
  document.getElementById('inp-masuk').value     = '';
  _stokSelectedSku = '';
  _stokEditMode    = false;
  var infoEl = document.getElementById('stok-info-sisa');
  if (infoEl) infoEl.style.display = 'none';
  var lblMasuk = document.getElementById('lbl-inp-masuk');
  if (lblMasuk) lblMasuk.textContent = 'Stok Masuk (Qty)';
  // Reset picker variasi
  document.getElementById('inp-sku').innerHTML = '<option value="">— Pilih Variasi —</option>';
  var lbl = document.getElementById('stok-picker-variasi-label');
  if (lbl) { lbl.textContent = '— Pilih Variasi —'; lbl.style.color = 'var(--ink3)'; }
  var list = document.getElementById('stok-picker-variasi-list');
  if (list) list.innerHTML = '';
  stokTutupKatalogDropdown();
  document.getElementById('modal-stok-masuk').classList.add('open');
  setTimeout(function(){ document.getElementById('inp-sku-induk').focus(); }, 100);
}

function cancelStokForm() {
  document.getElementById('modal-stok-masuk').classList.remove('open');
  stokTutupKatalogDropdown();
  _stokSelectedSku = '';
  _stokEditMode    = false;
  var lbl = document.getElementById('stok-picker-variasi-label');
  if (lbl) { lbl.textContent = '— Pilih Variasi —'; lbl.style.color = 'var(--ink3)'; }
  var infoEl = document.getElementById('stok-info-sisa');
  if (infoEl) infoEl.style.display = 'none';
  var lblMasuk = document.getElementById('lbl-inp-masuk');
  if (lblMasuk) lblMasuk.textContent = 'Stok Masuk (Qty)';
}

function editStok(sku) {
  var skuKey   = sku.toUpperCase();
  var existing = _stokMasukMap[skuKey];
  document.getElementById('stok-form-title').innerHTML = '<i class="ti ti-edit"></i> Edit Stok';
  document.getElementById('inp-id').value = existing ? existing.id : '';
  _stokSelectedSku = skuKey;
  _stokEditMode    = true;
  stokTutupKatalogDropdown();
  // Hitung sisa current
  var dataRow = _stokAllData.find(function(r){ return (r.sku_variasi||'').toUpperCase() === skuKey; });
  var sisaCurrent   = dataRow ? dataRow.sisa : 0;
  var keluarCurrent = dataRow ? dataRow.stok_keluar : 0;
  var infoEl = document.getElementById('stok-info-sisa');
  if (infoEl) infoEl.style.display = 'block';
  var sisaVal = document.getElementById('stok-info-sisa-val');
  if (sisaVal) sisaVal.textContent = sisaCurrent;
  var keluarVal = document.getElementById('stok-info-keluar-val');
  if (keluarVal) keluarVal.textContent = keluarCurrent;
  var lblMasuk = document.getElementById('lbl-inp-masuk');
  if (lblMasuk) lblMasuk.textContent = 'Set Sisa Menjadi (Qty)';
  document.getElementById('inp-masuk').value = sisaCurrent >= 0 ? sisaCurrent : 0;
  // Cari produk untuk isi katalog & picker
  var found = _produkForStok.find(function(p) {
    return (p.sku_variasi || '').toUpperCase() === skuKey;
  });
  if (found) {
    // skipAutoOpen=true: populate list variasi tanpa reset label dan tanpa auto-open picker
    stokPilihKatalog(found.katalog || '', true);
    document.getElementById('inp-sku').value = sku;
    var lbl = document.getElementById('stok-picker-variasi-label');
    if (lbl) { lbl.textContent = sku; lbl.style.color = 'var(--ink)'; }
  } else {
    document.getElementById('inp-sku-induk').value = sku;
    document.getElementById('inp-sku').innerHTML =
      '<option value="' + sku + '">' + sku + '</option>';
    var lbl = document.getElementById('stok-picker-variasi-label');
    if (lbl) { lbl.textContent = sku; lbl.style.color = 'var(--ink)'; }
  }
  document.getElementById('modal-stok-masuk').classList.add('open');
  setTimeout(function(){ document.getElementById('inp-masuk').focus(); }, 60);
}

async function simpanStok() {
  var id  = document.getElementById('inp-id').value;
  // Prioritas: _stokSelectedSku (dari picker) → inp-sku.value → bukan fallback ke katalog
  var sku = (_stokSelectedSku || '').trim().toUpperCase();
  if (!sku) sku = (document.getElementById('inp-sku').value || '').trim().toUpperCase();
  var qty = parseInt(document.getElementById('inp-masuk').value) || 0;

  if (!sku) { alert('Pilih SKU Variasi terlebih dahulu!'); return; }
  if (!_stokEditMode && qty <= 0) { alert('Stok masuk harus lebih dari 0!'); return; }
  if (_stokEditMode  && qty < 0)  { alert('Sisa tidak boleh negatif!'); return; }
  // Validasi: SKU harus ada di produk (bukan nama katalog yang nyasar)
  var valid = _produkForStok.some(function(p) {
    return (p.sku_variasi || '').toUpperCase() === sku;
  });
  if (!valid) { alert('SKU "' + sku + '" tidak ditemukan di data produk. Pilih variasi dari picker.'); return; }

  var prod = _produkForStok.find(function(p) {
    return (p.sku_variasi || '').toUpperCase() === sku.toUpperCase();
  });

  var payload = {
    sku_variasi: sku.toUpperCase(),
    stok_masuk:  qty,
    stok_keluar: 0,
    katalog:     prod ? prod.katalog : '',
    boss:        prod ? prod.boss    : '',
    hpp:         prod ? prod.hpp     : 0,
  };

  var btnSimpan = document.querySelector('#modal-stok-masuk .btn-primary');
  if (btnSimpan) { btnSimpan.textContent = 'Menyimpan...'; btnSimpan.disabled = true; }
  try {
    // Selalu cek _stokMasukMap — jangan bergantung inp-id yang hanya diisi saat editStok()
    // Ini mencegah duplicate INSERT saat user Tambah SKU yang sudah punya record
    var existingRec = _stokMasukMap[sku];
    if (existingRec && existingRec.id) {
      if (_stokEditMode) {
        // Opsi B: user input = sisa target → stok_masuk_baru = sisa_target + keluar_jurnal
        var dataRow2 = _stokAllData.find(function(r){ return (r.sku_variasi||'').toUpperCase() === sku; });
        var keluarJurnal = dataRow2 ? (dataRow2.stok_keluar || 0) : 0;
        var stokMasukBaru = qty + keluarJurnal;
        await dbUpdate('stok', existingRec.id, { stok_masuk: stokMasukBaru });
      } else {
        // Mode TAMBAH: akumulasi
        var oldQty = existingRec.qty || 0;
        await dbUpdate('stok', existingRec.id, { stok_masuk: oldQty + qty });
      }
    } else {
      await dbInsert('stok', payload);
    }
    cancelStokForm();
    loadStok();
  } catch(err) {
    alert('Gagal simpan: ' + err.message);
  } finally {
    if (btnSimpan) {
      btnSimpan.innerHTML = '<i class="ti ti-device-floppy"></i> SIMPAN';
      btnSimpan.disabled = false;
    }
  }
}

// ─── KATALOG DROPDOWN — seperti JP ───────────────────────────
function _stokGetKatalog(p) { return p.katalog || p.nama_katalog || p.catalog || ''; }
function _stokGetSku(p)     { return p.sku_variasi || p.sku || p.kode || ''; }

function _stokPositionKatalogDropdown() {
  var inp = document.getElementById('inp-sku-induk');
  var dd  = document.getElementById('stok-katalog-dropdown');
  if (!inp || !dd) return;
  var rect = inp.getBoundingClientRect();
  dd.style.top   = (rect.bottom + 2) + 'px';
  dd.style.left  = rect.left + 'px';
  dd.style.width = (rect.width + 44) + 'px';
}

function _stokRenderKatalogDropdown(katalogs, katalogMap) {
  var dd = document.getElementById('stok-katalog-dropdown');
  if (!dd) return;
  if (!katalogs.length) { dd.style.display = 'none'; return; }
  _stokKatalogIndex = -1;
  dd.innerHTML = katalogs.map(function(kat, i) {
    var safe = kat.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    return '<div class="stok-dd-item" data-katalog="' + safe + '" data-idx="' + i + '"'
      + ' style="padding:10px 12px;cursor:pointer;font-size:14px;'
      + 'border-bottom:1px dashed var(--ink4);display:flex;justify-content:space-between;align-items:center;background:var(--cream)"'
      + ' onmouseenter="stokHighlightKatalog(this)"'
      + ' onclick="stokPilihKatalog(this.dataset.katalog)">'
      + '<span style="font-weight:600">' + kat + '</span>'
      + '<span style="font-size:11px;color:var(--ink3);margin-left:8px">' + katalogMap[kat] + ' var</span>'
      + '</div>';
  }).join('');
  _stokPositionKatalogDropdown();
  dd.style.display = 'block';
}

function stokSuggestKatalog() {
  _stokDdMode = 'suggest';
  _stokPositionKatalogDropdown();
  var q = (document.getElementById('inp-sku-induk').value || '').trim().toLowerCase();
  var katalogMap = {};
  _produkForStok.forEach(function(p) {
    var kat = _stokGetKatalog(p);
    if (!kat) return;
    if (q && !kat.toLowerCase().includes(q)) return;
    katalogMap[kat] = (katalogMap[kat] || 0) + 1;
  });
  _stokRenderKatalogDropdown(Object.keys(katalogMap), katalogMap);
}

function stokToggleKatalogFull() {
  var dd = document.getElementById('stok-katalog-dropdown');
  if (dd && dd.style.display !== 'none' && _stokDdMode === 'full') {
    stokTutupKatalogDropdown(); return;
  }
  _stokDdMode = 'full';
  document.getElementById('inp-sku-induk').value = '';
  var katalogMap = {};
  _produkForStok.forEach(function(p) {
    var kat = _stokGetKatalog(p);
    if (!kat) return;
    katalogMap[kat] = (katalogMap[kat] || 0) + 1;
  });
  _stokRenderKatalogDropdown(Object.keys(katalogMap), katalogMap);
  document.getElementById('inp-sku-induk').focus();
}

function stokHighlightKatalog(el) {
  var dd = document.getElementById('stok-katalog-dropdown');
  if (dd) dd.querySelectorAll('.stok-dd-item').forEach(function(x){ x.style.background = ''; });
  el.style.background = 'var(--cream2)';
  _stokKatalogIndex = parseInt(el.dataset.idx);
}

function stokKatalogKeyNav(e) {
  var dd = document.getElementById('stok-katalog-dropdown');
  if (!dd || dd.style.display === 'none') return;
  var items = dd.querySelectorAll('.stok-dd-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _stokKatalogIndex = Math.min(_stokKatalogIndex + 1, items.length - 1);
    items.forEach(function(x, i){ x.style.background = i === _stokKatalogIndex ? 'var(--cream2)' : ''; });
    if (items[_stokKatalogIndex]) items[_stokKatalogIndex].scrollIntoView({block:'nearest'});
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _stokKatalogIndex = Math.max(_stokKatalogIndex - 1, 0);
    items.forEach(function(x, i){ x.style.background = i === _stokKatalogIndex ? 'var(--cream2)' : ''; });
    if (items[_stokKatalogIndex]) items[_stokKatalogIndex].scrollIntoView({block:'nearest'});
  } else if (e.key === 'Enter' && _stokKatalogIndex >= 0 && items[_stokKatalogIndex]) {
    e.preventDefault();
    stokPilihKatalog(items[_stokKatalogIndex].dataset.katalog);
  } else if (e.key === 'Escape') {
    stokTutupKatalogDropdown();
  }
}

function stokPilihKatalog(katalog, skipAutoOpen) {
  document.getElementById('inp-sku-induk').value = katalog;
  stokTutupKatalogDropdown();
  var varList = _produkForStok.filter(function(p){ return _stokGetKatalog(p) === katalog; });
  var sel = document.getElementById('inp-sku');
  sel.innerHTML = '<option value="">— Pilih Variasi —</option>';
  varList.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value       = _stokGetSku(p);
    opt.textContent = _stokGetSku(p);
    sel.appendChild(opt);
  });
  var list = document.getElementById('stok-picker-variasi-list');
  if (list) {
    var html = '<div class="kas-akun-item" data-val="" onclick="stokPickerVariasiSelect(this)"><span style="color:var(--ink3)">— Pilih Variasi —</span></div>';
    varList.forEach(function(p) {
      html += '<div class="kas-akun-item" data-val="' + _stokGetSku(p) + '" onclick="stokPickerVariasiSelect(this)">' + _stokGetSku(p) + '</div>';
    });
    list.innerHTML = html;
  }
  // skipAutoOpen = true saat dipanggil dari editStok — jangan reset label, jangan auto-open
  if (skipAutoOpen) return;
  var lbl = document.getElementById('stok-picker-variasi-label');
  if (lbl) { lbl.textContent = '— Pilih Variasi —'; lbl.style.color = 'var(--ink3)'; }
  if (varList.length === 1) {
    sel.selectedIndex = 1;
    if (lbl) { lbl.textContent = _stokGetSku(varList[0]); lbl.style.color = 'var(--ink)'; }
    setTimeout(function(){ document.getElementById('inp-masuk').focus(); }, 60);
  } else {
    setTimeout(function() {
      var pickerBtn = document.getElementById('stok-picker-variasi');
      if (pickerBtn) stokTogglePicker('stok-picker-variasi');
    }, 60);
  }
}

function stokTutupKatalogDropdown() {
  var dd = document.getElementById('stok-katalog-dropdown');
  if (dd) dd.style.display = 'none';
}

// ─── PICKER VARIASI STOK ─────────────────────────────────────
function stokTogglePicker(pickerId) {
  var picker = document.getElementById(pickerId);
  var list   = document.getElementById(pickerId + '-list');
  if (!picker || !list) return;
  if (list.style.display === 'block') { stokClosePicker(list); return; }

  // Search box
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
  var inp = list.querySelector('.kas-akun-search');
  if (inp) inp.value = '';
  list.querySelectorAll('.kas-akun-item,.kas-akun-group,.kas-akun-empty').forEach(function(el){ el.style.display=''; });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';

  var rect = picker.getBoundingClientRect();
  list.style.position = 'fixed';
  list.style.top      = (rect.bottom + 2) + 'px';
  list.style.left     = rect.left + 'px';
  list.style.width    = rect.width + 'px';
  list.style.maxWidth = '360px';
  list.style.zIndex   = '99999';
  list.dataset.floated = '1';
  list.style.display  = 'block';
  if (list.parentNode !== document.body) document.body.appendChild(list);
  if (inp) setTimeout(function(){ inp.focus(); }, 50);
}

function stokClosePicker(list) {
  if (!list) return;
  var inp = list.querySelector('.kas-akun-search');
  if (inp) inp.value = '';
  list.querySelectorAll('.kas-akun-item,.kas-akun-group').forEach(function(el){ el.style.display=''; });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';
  if (list.dataset.floated && list.parentNode === document.body) {
    var pickerId = list.id.replace('-list','');
    var picker   = document.getElementById(pickerId);
    if (picker && picker.parentNode) picker.parentNode.appendChild(list);
    delete list.dataset.floated;
  }
  list.style.display = 'none';
}

function stokPickerVariasiSelect(item) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  var list = item.closest('.kas-akun-list');
  if (!list) return;
  var val   = item.dataset.val || '';
  var label = item.textContent.trim();
  // Simpan ke JS variable — lebih reliable dari hidden select .value
  _stokSelectedSku = val.toUpperCase();
  var sel = document.getElementById('inp-sku');
  if (sel) { sel.value = val; } // tetap set untuk kompatibilitas
  var lbl = document.getElementById('stok-picker-variasi-label');
  if (lbl) { lbl.textContent = val ? label : '— Pilih Variasi —'; lbl.style.color = val ? 'var(--ink)' : 'var(--ink3)'; }
  list.querySelectorAll('.kas-akun-item').forEach(function(el){ el.classList.remove('active'); });
  item.classList.add('active');
  stokClosePicker(list);
  if (val) setTimeout(function(){ document.getElementById('inp-masuk').focus(); }, 60);
}

function stokTutupDropdown() {
  stokTutupKatalogDropdown();
}

// Inject dropdown katalog ke body (hindari overflow modal)
(function() {
  if (document.getElementById('stok-katalog-dropdown')) return;
  var dd = document.createElement('div');
  dd.id = 'stok-katalog-dropdown';
  dd.style.cssText = 'display:none;position:fixed;z-index:99999;background:var(--cream);'
    + 'border:2px solid var(--ink);border-top:none;max-height:220px;overflow-y:auto;'
    + 'box-shadow:4px 4px 0 var(--ink4)';
  document.body.appendChild(dd);
})();

// Tutup katalog dropdown saat klik luar
document.addEventListener('click', function(e) {
  var inp = document.getElementById('inp-sku-induk');
  var btn = document.getElementById('stok-katalog-dd-btn');
  var dd  = document.getElementById('stok-katalog-dropdown');
  if (!inp || !dd) return;
  if (!inp.contains(e.target) && !dd.contains(e.target) && (!btn || !btn.contains(e.target))) {
    dd.style.display = 'none';
  }
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
        // Akumulasi: stok_masuk += qty baru (sisa = stok_masuk - keluar dari jurnal)
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
  // 3 state: netral(⇅) → desc(▼) → asc(▲) → netral
  if (_stokSort.col === col) {
    if (_stokSort.dir === 'desc') {
      _stokSort.dir = 'asc';
    } else {
      _stokSort.col = null; // reset ke netral
      _stokSort.dir = 'desc';
    }
  } else {
    _stokSort.col = col;
    _stokSort.dir = 'desc';
  }
  // Update icons semua kolom
  ['sisa','sales','sales_total','nilai'].forEach(function(c) {
    var el = document.getElementById('sort-icon-' + c);
    if (!el) return;
    if (c === _stokSort.col) {
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
  return 'mi-' + type;
}

function stokOpenSub(type, e) {
  if (e) e.stopPropagation();
  var el = document.getElementById(_miId(type));
  if (!el) return;

  // Tutup semua submenu lain, reset highlight
  ['boss','katalog'].forEach(function(t) {
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
      { val: null,    label: 'Semua Status' },
      { val: 'fast',  label: '🟢 Fast Moving — laku 7hr terakhir' },
      { val: 'slow',  label: '🟡 Slow Moving — pernah laku, >7hr lalu' },
      { val: 'dead',  label: '⚫ Dead Stock — belum pernah laku' },
      { val: 'habis', label: '🔴 Habis' },
    ];
  }

  var currVal = type === 'boss' ? _filterBoss : type === 'katalog' ? _filterKatalog : _filterStatus;
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
  ['boss','katalog'].forEach(function(t) {
    var b = document.getElementById('badge-' + t);
    if (b) b.textContent = '';
    var s = document.getElementById('dd-filter-' + t);
    if (s) s.style.display = 'none';
    var m = document.getElementById('mi-' + t);
    if (m) { m.style.background = ''; m.style.color = ''; }
  });
  // Reset tab status juga
  _filterStatusTab = null;
  document.querySelectorAll('.stok-tab-btn').forEach(function(btn){
    btn.classList.toggle('stok-tab-active', btn.dataset.tab === 'all');
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
  ['boss','katalog'].forEach(function(t) {
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
  var subs = ['dd-filter-boss','dd-filter-katalog'];
  // Cek apakah klik di dalam salah satu submenu
  var inSub = subs.some(function(id) {
    var s = document.getElementById(id);
    return s && s.contains(e.target);
  });
  if (inSub) return; // jangan tutup kalau klik di submenu
  // Cek apakah klik di dalam main menu items (mi-boss, mi-katalog, mi-status)
  var inMenuItem = ['mi-boss','mi-katalog'].some(function(id) {
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






setTimeout(loadStok, 0);


// ─── SWIPE GESTURE — collapse stok-filter-bar di landscape touch ──
(function() {
  var _mq = window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: landscape)');
  function _init() {
    if (!_mq.matches) return;
    var zone = document.getElementById('stok-filter-bar');
    var bar  = document.getElementById('stok-filter-bar');
    if (!zone || !bar) return;
    initSwipeCollapse(zone, bar, 50);
  }
  setTimeout(_init, 300);
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'stok') return;
    setTimeout(function() {
      var bar = document.getElementById('stok-filter-bar');
      if (bar) bar.classList.remove('landscape-collapsed');
      _init();
    }, 80);
  });
})();
// ─── AUTO-RELOAD SAAT NAVIGASI KE HALAMAN INI ────────────────
// Debounce 250ms: cegah double-fire jika menu diklik cepat
(function() {
  var _t = null;
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'stok') return;
    clearTimeout(_t);
    _t = setTimeout(loadStok, 250);
  });
})();
