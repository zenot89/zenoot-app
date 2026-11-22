

// ─── PRODUK.JS — Kelola Produk (master SKU + paste massal) ───

document.getElementById('page-produk').innerHTML = `
  <div id="ops-switcher-produk" class="ch-switcher"></div>

  <style>
    #produk-toolbar-normal { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:10px; }
    #produk-toolbar-edit   { display:none; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:10px; }
    .produk-btn-pill       { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:20px; font-family:var(--f); font-size:13px; font-weight:600; cursor:pointer; border:none; }
    .produk-btn-primary    { background:var(--ink); color:var(--cream); }
    .produk-btn-ghost      { background:none; color:var(--ink2); border:1px solid var(--ink3); }
    .produk-btn-danger     { background:none; color:var(--danger); border:1px solid var(--danger); }
    .produk-btn-cancel     { background:var(--ink); color:var(--cream); margin-left:auto; }
    #produk-stat-cards     { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:12px; }
    .produk-stat           { background:var(--cream2); border-radius:8px; padding:12px 14px; border:1px solid var(--ink3); }
    .produk-stat-lbl       { font-size:10px; color:var(--ink3); margin-bottom:4px; text-transform:uppercase; letter-spacing:.05em; font-weight:700; }
    .produk-stat-val       { font-size:18px; font-weight:700; color:var(--ink); }
    .produk-stat-sub       { font-size:11px; color:var(--ink3); margin-top:2px; }
    @media(max-width:600px){ #produk-stat-cards { grid-template-columns:repeat(2,1fr); } }

    /* ── PICKER "Boss" (7 Sep 2026) — dulu <input type=text> bebas ketik,
       root cause bug "Lainnya" di dashboard & "Re Stock" kosong: nama
       supplier di sini gampang beda ejaan/spasi sama nama di tabel
       hutang_supplier (Kelola Supplier), jadi gagal match diam-diam.
       Sekarang wajib PILIH dari daftar hutang_supplier (single source of
       truth), bukan ketik bebas lagi — kalau supplier belum ada, ada opsi
       "+ Tambah Supplier Baru" yang insert ke hutang_supplier juga.
       Bottom sheet-nya pola PERSIS #stok-sku-sheet di stok.js. ── */
    .produk-boss-trigger {
      width:100%; box-sizing:border-box; display:flex; align-items:center; justify-content:space-between;
      gap:8px; font-family:var(--f); font-size:15px; padding:8px 10px;
      border:2px solid var(--ink); background:var(--cream); color:var(--ink);
      cursor:pointer; border-radius:0;
    }
    #produk-boss-sheet-overlay {
      display: none; position: fixed; inset: 0; z-index: 698;
      background: rgba(0,0,0,.55);
    }
    #produk-boss-sheet-overlay.open { display: block; }
    #produk-boss-sheet {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 699;
      background: var(--cream2); border-radius: 20px 20px 0 0;
      transform: translateY(100%);
      transition: transform 0.28s cubic-bezier(.4,0,.2,1);
      padding-bottom: env(safe-area-inset-bottom, 16px);
      max-height: 75vh; display: none; flex-direction: column; overflow: hidden;
    }
    #produk-boss-sheet.open { display: flex; transform: translateY(0); }
    #produk-boss-sheet-close {
      position: absolute; top: 10px; right: 10px; width: 32px; height: 32px;
      border: none; background: var(--ovl-0_06); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      color: var(--ink3); font-size: 16px; z-index: 2; padding: 0;
    }
    #produk-boss-sheet-handle {
      width: 40px; height: 4px; background: var(--ovl-0_18); border-radius: 2px;
      margin: 12px auto 4px; flex: none;
    }
    #produk-boss-sheet-title {
      text-align: center; font-size: 16px; font-weight: 700; color: var(--ink);
      padding: 8px 16px 12px; letter-spacing: -0.2px; flex: none;
    }
    #produk-boss-sheet-search-wrap { flex: none; padding: 0 16px 10px; }
    #produk-boss-sheet-search {
      width: 100%; box-sizing: border-box; background: var(--ovl-0_06);
      border: 1px solid var(--ovl-0_12); border-radius: 10px; padding: 11px 14px;
      font-size: 15px; font-family: var(--f); color: var(--ink); outline: none;
      -webkit-appearance: none;
    }
    #produk-boss-sheet-search::placeholder { color: var(--ink3); }
    #produk-boss-sheet-search:focus { border-color: var(--ovl-0_25); background: var(--ovl-0_09); }
    #produk-boss-sheet-list {
      flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain; padding: 4px 10px 12px;
    }
    #produk-boss-sheet-list .jp-sheet-item {
      font-size: 15px; padding: 12px 10px; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      color: var(--ink2);
    }
    #produk-boss-sheet-list .jp-sheet-item:active { background: var(--ovl-0_08); color: var(--ink); }
    #produk-boss-sheet-list .jp-sheet-empty {
      padding: 28px 12px; text-align: center; color: var(--ink3);
      font-size: 13px; font-style: italic;
    }
    @media (min-width: 768px) {
      #produk-boss-sheet {
        left: 50%; right: auto; bottom: 50%; transform: translate(-50%, 50%) scale(.96);
        width: 100%; max-width: 380px; border-radius: 16px; max-height: 65vh; opacity: 0;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      #produk-boss-sheet.open { transform: translate(-50%, 50%) scale(1); opacity: 1; }
    }
  </style>

  <!-- TOOLBAR NORMAL -->
  <div id="produk-toolbar-normal">
    <button class="produk-btn-pill produk-btn-primary" onclick="showFormProduk()"><i class="ti ti-plus"></i> Tambah SKU</button>
    <button class="produk-btn-pill produk-btn-ghost" onclick="showPasteProduk()"><i class="ti ti-clipboard"></i> Paste massal</button>
    <button class="produk-btn-pill produk-btn-ghost" onclick="exportProduk()"><i class="ti ti-download"></i> Export CSV</button>
    <button class="produk-btn-pill produk-btn-ghost" onclick="loadProduk()"><i class="ti ti-refresh"></i></button>
    <button class="produk-btn-pill produk-btn-ghost" id="produk-btn-arsip" onclick="produkToggleArsip()" style="display:none"><i class="ti ti-archive"></i> Arsip</button>
    <button class="produk-btn-pill produk-btn-ghost" onclick="produkEnterEditMode()" style="margin-left:auto"><i class="ti ti-edit"></i> Edit</button>
  </div>

  <!-- TOOLBAR EDIT/BATCH -->
  <div id="produk-toolbar-edit">
    <span id="produk-select-count" style="font-size:13px;color:var(--ink3);font-weight:600">0 dipilih</span>
    <button class="produk-btn-pill produk-btn-ghost" onclick="produkSelectAll()">Pilih semua</button>
    <button class="produk-btn-pill produk-btn-ghost" id="produk-btn-hpp" onclick="produkBatchHpp()" style="opacity:.4" disabled><i class="ti ti-currency-dollar"></i> Edit HPP</button>
    <button class="produk-btn-pill produk-btn-ghost" id="produk-btn-sis" onclick="produkBatchSistem()" style="opacity:.4" disabled><i class="ti ti-switch-horizontal"></i> Edit Sistem</button>
    <button class="produk-btn-pill produk-btn-ghost" id="produk-btn-sup" onclick="produkBatchSupplier()" style="opacity:.4" disabled><i class="ti ti-user"></i> Edit Supplier</button>
    <!-- [30 Sep 2026] Tombol "Dropship" dihapus: pilihan Dropship/Reseller sekarang jadi toggle di dalam modal Edit Supplier (khusus supplier berjenis Dropship + Reseller) -->
    <button class="produk-btn-pill produk-btn-ghost" id="produk-btn-exp" onclick="produkExportTerpilih()" style="opacity:.4" disabled><i class="ti ti-download"></i> Export</button>
    <button class="produk-btn-pill produk-btn-ghost" id="produk-btn-arsipkan" onclick="produkArsipkanTerpilih()" style="opacity:.4" disabled><i class="ti ti-archive"></i> Arsipkan</button>
    <button class="produk-btn-pill produk-btn-ghost" id="produk-btn-pulihkan" onclick="produkPulihkanTerpilih()" style="opacity:.4;display:none" disabled><i class="ti ti-arrow-back-up"></i> Pulihkan</button>
    <button class="produk-btn-pill produk-btn-danger" id="produk-btn-hapus" onclick="produkHapusTerpilih()" style="opacity:.4" disabled><i class="ti ti-trash"></i> Hapus</button>
    <button class="produk-btn-pill produk-btn-cancel" id="produk-btn-done" onclick="produkExitEditMode()">Batalkan</button>
  </div>

  <div id="produk-arsip-note" style="display:none;margin-bottom:10px;padding:8px 12px;border:1.5px dashed var(--ink3);border-radius:8px;font-size:12px;color:var(--ink2);line-height:1.6"><b>Arsip</b> — SKU yang disembunyikan dari Kelola Produk, Stok, Tambah Penjualan, dan Re-Stock. Riwayat penjualan, bon, dan laporan lama tetap utuh. Pilih lalu <b>Pulihkan</b> untuk mengaktifkan lagi, atau <b>Hapus</b> untuk menghapus permanen.</div>

  <!-- STAT CARDS -->
  <div id="produk-stat-cards">
    <div class="produk-stat"><div class="produk-stat-lbl">Total Katalog</div><div class="produk-stat-val" id="pstat-katalog">—</div><div class="produk-stat-sub">produk induk</div></div>
    <div class="produk-stat"><div class="produk-stat-lbl">Total Varian</div><div class="produk-stat-val" id="pstat-varian">—</div><div class="produk-stat-sub">SKU aktif</div></div>
    <div class="produk-stat"><div class="produk-stat-lbl">Avg HPP</div><div class="produk-stat-val" id="pstat-hpp">—</div><div class="produk-stat-sub">per varian</div></div>
    <div class="produk-stat"><div class="produk-stat-lbl">Tanpa HPP</div><div class="produk-stat-val" id="pstat-nohpp" style="color:var(--warn)">—</div><div class="produk-stat-sub">perlu diisi</div></div>
  </div>

  <!-- FORM TAMBAH/EDIT SKU -->

  <!-- MODAL PASTE MASSAL -->
  <div class="modal-overlay" id="modal-paste-produk">
    <div class="modal" style="max-width:620px">
      <div class="modal-title"><i class="ti ti-clipboard"></i> Paste Massal SKU</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <div id="paste-produk-kolom" style="flex:1;min-width:0;font-size:12.5px;font-weight:700;color:var(--ink);line-height:1.6">Boss Utama → Boss Cadangan → Katalog → SKU Variasi → HPP → Harga P.O → Harga Dropship</div>
        <button class="btn btn-sm" id="btn-salin-kolom-produk" onclick="salinKolomPasteProduk()"><i class="ti ti-copy"></i> Salin</button>
      </div>
      <textarea id="paste-area-produk"
        style="width:100%;height:180px;font-family:var(--f);font-size:13px;padding:8px;border:2px solid var(--ink);background:var(--cream);color:var(--ink);resize:vertical;outline:none"
        placeholder="Paste di sini..."></textarea>
      <div id="paste-produk-preview" style="margin-top:10px;display:none">
        <div style="font-size:12px;font-weight:700;color:var(--ink3);margin-bottom:6px" id="paste-produk-count"></div>
        <div class="tbl-wrap" style="max-height:160px;overflow-y:auto">
          <table class="tbl"><thead><tr><th>Boss</th><th>Cadangan</th><th>Katalog</th><th>SKU Variasi</th><th>HPP</th><th>P.O / Dropship</th><th>Status</th></tr></thead>
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

  <!-- TABEL PRODUK GROUP BY KATALOG -->
  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span><i class="ti ti-package"></i> Master SKU Produk</span>
      <input type="text" id="produk-search" placeholder="Cari SKU / katalog..."
        style="font-family:var(--f);font-size:13px;padding:4px 8px;border:2px solid var(--ink);background:var(--cream);width:180px"
        oninput="filterProduk()">
    </div>
    <div class="tbl-wrap" style="overflow-x:auto;overscroll-behavior:none;touch-action:pan-x pan-y">
      <table class="tbl" id="produk-tbl">
        <thead><tr id="produk-thead-row">
          <th>Katalog / SKU</th>
          <th>HPP</th>
          <th>Boss</th>
          <th>Sistem</th>
        </tr></thead>
        <tbody id="produk-tbody">
          <tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
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
let _produkSupplierList = []; // dari hutang_supplier — single source of truth buat picker Boss
let _produkCadList = [];      // produk_supplier (id, produk_id, supplier_id) — supplier cadangan per SKU (16 Nov 2026)
let _produkAll = [];          // 21 Nov 2026: SEMUA SKU (aktif + arsip); _produkData = tampilan yang sedang dipilih (aktif ATAU arsip)
var _produkLihatArsip = false;   // true = tampilan Arsip
let _produkHbList = [];       // hutang_barang (id, produk_id, supplier_id, harga_per_lusin, harga_po_per_lusin) — harga P.O & Dropship SKU supplier 2 sistem

async function loadProduk() {
  const tbody = document.getElementById('produk-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>';
  try {
    // [30 Sep 2026] daftar supplier dimuat bareng produk: badge "Dropship" butuh flag sistem supplier saat render
    // 16 Nov 2026: destructuring dibetulkan — dulu `[data, hbList]` mengambil hasil _produkLoadSupplierList() (kosong), jadi harga Master Barang tidak pernah terbaca
    const [data, , hbList, cadList] = await Promise.all([
      dbGet('produk'), _produkLoadSupplierList(),
      dbGet('hutang_barang', '&select=id,produk_id,supplier_id,harga_per_lusin,harga_po_per_lusin').catch(function() { return []; }),   // 3 Nov 2026: 2 harga SKU supplier 2 sistem
      dbGet('produk_supplier').catch(function() { return []; })   // 16 Nov 2026: supplier cadangan
    ]);
    _produkHbList = Array.isArray(hbList) ? hbList : [];
    _produkCadList = Array.isArray(cadList) ? cadList : [];
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
    _produkAll = data;
    _produkApplyView();
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
  }
}

// ── ARSIP SKU (21 Nov 2026) ───────────────────────────────────
// SKU yang sudah tidak dipakai (mis. katalog kembar lama) DIARSIPKAN, bukan dihapus: produk.arsip = true. Disembunyikan dari Kelola Produk,
// Stok Produk, Tambah Penjualan, Re-Stock, Master Barang dan pilihan SKU lain, tapi barisnya tetap ada — jadi riwayat penjualan, bon dropship otomatis
// (yang menghitung ulang 60 hari) dan HPP laporan lama tetap utuh. Bisa dipulihkan kapan saja; Hapus permanen tetap ada di tampilan Arsip.
// Syarat arsip: stok SKU harus 0. SKU baru dengan nama yang sama dengan SKU di Arsip ditolak (pulihkan saja yang lama).
function _produkApplyView() {
  _produkData = _produkAll.filter(function(r) { return !!r.arsip === _produkLihatArsip; });
  var ada = {};
  _produkData.forEach(function(r) { ada[r.id] = true; });
  Object.keys(_produkSelected).forEach(function(k) { if (!ada[k]) delete _produkSelected[k]; });
  produkPaintArsipUi();
  renderProduk(_produkData);
  if (_produkEditMode) produkUpdateSelectBar();
}
function produkPaintArsipUi() {
  var n = _produkAll.filter(function(r) { return r.arsip; }).length;
  var b = document.getElementById('produk-btn-arsip');
  if (b) {
    b.innerHTML = _produkLihatArsip ? '<i class="ti ti-arrow-left"></i> Kembali ke aktif' : '<i class="ti ti-archive"></i> Arsip' + (n ? ' (' + n + ')' : '');
    b.style.display = (n || _produkLihatArsip) ? '' : 'none';
  }
  var note = document.getElementById('produk-arsip-note');
  if (note) note.style.display = _produkLihatArsip ? '' : 'none';
  ['produk-btn-hpp', 'produk-btn-sis', 'produk-btn-sup'].forEach(function(id) {
    var x = document.getElementById(id);
    if (x) x.style.display = _produkLihatArsip ? 'none' : '';
  });
  var ba = document.getElementById('produk-btn-arsipkan'), bp = document.getElementById('produk-btn-pulihkan');
  if (ba) ba.style.display = _produkLihatArsip ? 'none' : '';
  if (bp) bp.style.display = _produkLihatArsip ? '' : 'none';
  var v = document.getElementById('pstat-varian');
  if (v && v.nextElementSibling) v.nextElementSibling.textContent = _produkLihatArsip ? 'SKU diarsipkan' : 'SKU aktif';
}
function produkToggleArsip() {
  _produkLihatArsip = !_produkLihatArsip;
  _produkSelected = {};
  _produkApplyView();
}
// Sisa stok semua SKU (masuk − keluar, penjualan dropship tidak mengurangi) — rumus sama dengan Dashboard/Stok Produk
async function _produkSisaStokMap() {
  var r = await Promise.all([
    dbGet('stok', '&select=sku_variasi,stok_masuk'),
    dbGet('jurnal_penjualan', '&select=sku,qty&kirim_dropship=eq.false&or=(order_status.neq.CANCELLED,order_status.is.null)')
  ]);
  if (!Array.isArray(r[0]) || !Array.isArray(r[1])) throw new Error('data stok tidak terbaca');
  var m = {};
  r[0].forEach(function(x) { var k = String(x.sku_variasi || '').trim().toUpperCase(); if (k) m[k] = (m[k] || 0) + (Number(x.stok_masuk) || 0); });
  r[1].forEach(function(x) { var k = String(x.sku || '').trim().toUpperCase(); if (k) m[k] = (m[k] || 0) - (Number(x.qty) || 0); });
  return m;
}
async function produkArsipkanTerpilih() {
  var ids = Object.keys(_produkSelected).map(Number);
  if (!ids.length) return;
  var rows = _produkData.filter(function(r) { return ids.indexOf(r.id) >= 0; });
  var sisa;
  try { sisa = await _produkSisaStokMap(); }
  catch (e) { alert('Gagal memeriksa stok, SKU belum diarsipkan: ' + ((e && e.message) || e)); return; }
  var bertok = rows.filter(function(r) { return (sisa[String(r.sku_variasi || '').trim().toUpperCase()] || 0) > 0; });
  if (bertok.length) {
    alert('Belum bisa diarsipkan: ' + bertok.length + ' SKU masih punya stok.\n\n'
      + bertok.slice(0, 8).map(function(r) { return '• ' + r.sku_variasi + ' (' + sisa[String(r.sku_variasi || '').trim().toUpperCase()] + ' pcs)'; }).join('\n')
      + (bertok.length > 8 ? '\n• …' : '')
      + '\n\nHabiskan atau koreksi stoknya jadi 0 dulu (Stok Produk › Edit Stock), lalu arsipkan.');
    return;
  }
  var ok = await zConfirm('Arsipkan ' + rows.length + ' SKU?\n' + rows.slice(0, 6).map(function(r) { return r.sku_variasi; }).join(', ') + (rows.length > 6 ? ', …' : '')
    + '\n\nDisembunyikan dari Kelola Produk, Stok, Tambah Penjualan, dan Re-Stock. Riwayat penjualan, bon, dan laporan lama tetap utuh. Bisa dipulihkan dari menu Arsip.',
    { title: 'Arsipkan SKU', ok: 'Arsipkan' });
  if (!ok) return;
  try {
    var tgl = _produkYmdHariIni();
    for (var i = 0; i < rows.length; i++) {
      await dbUpdate('produk', rows[i].id, { arsip: true, arsip_tgl: tgl });
      rows[i].arsip = true; rows[i].arsip_tgl = tgl;
    }
    _produkSelected = {};
    produkMarkDirty();
    _produkApplyView();
  } catch (err) {
    produkMarkDirty();
    var msg = (err && err.message) || String(err);
    alert('Gagal mengarsipkan: ' + msg + (/arsip/i.test(msg) ? '\n\nKolom belum ada — jalankan zenoot-arsip-sku.sql di Supabase dulu.' : '') + '\n\nSebagian SKU mungkin sudah terarsip — periksa tampilan Arsip.');
    _produkApplyView();
  }
}
async function produkPulihkanTerpilih() {
  var ids = Object.keys(_produkSelected).map(Number);
  if (!ids.length) return;
  var rows = _produkData.filter(function(r) { return ids.indexOf(r.id) >= 0; });
  try {
    for (var i = 0; i < rows.length; i++) {
      await dbUpdate('produk', rows[i].id, { arsip: false, arsip_tgl: null });
      rows[i].arsip = false; rows[i].arsip_tgl = null;
    }
    _produkSelected = {};
    produkMarkDirty();
    _produkApplyView();
  } catch (err) {
    produkMarkDirty();
    alert('Gagal memulihkan: ' + ((err && err.message) || err) + '\n\nSebagian SKU mungkin sudah pulih — periksa tampilan Arsip.');
    _produkApplyView();
  }
}

// ─── STATE EXPAND & SELECT ────────────────────────────────────
var _produkExpanded = {}; // katalog → true/false
var _produkSelected = {}; // id → true/false
var _produkEditMode = false;

// ── Edit mode toggle ──────────────────────────────────────────
// 12 Nov 2026: tombol kanan toolbar edit = "Batalkan" selama belum ada perubahan tersimpan di sesi Edit ini; begitu ada (walau 1 SKU) jadi "Selesai".
// Keduanya sama-sama keluar dari mode Edit (perubahan sudah tersimpan per aksi); yang beda hanya penanda bahwa sesi ini ada perubahan.
var _produkEditDirty = false;
function produkMarkDirty() { _produkEditDirty = true; produkUpdateDoneBtn(); }
function produkUpdateDoneBtn() {
  var b = document.getElementById('produk-btn-done');
  if (!b) return;
  b.className = 'produk-btn-pill ' + (_produkEditDirty ? 'produk-btn-primary' : 'produk-btn-cancel');
  b.style.marginLeft = 'auto';
  b.innerHTML = _produkEditDirty ? '<i class="ti ti-check"></i> Selesai' : 'Batalkan';
}

function produkEnterEditMode() {
  _produkEditMode = true;
  _produkEditDirty = false; produkUpdateDoneBtn();
  document.getElementById('produk-toolbar-normal').style.display = 'none';
  document.getElementById('produk-toolbar-edit').style.display   = 'flex';
  // Tampilkan kolom checkbox di thead
  var thead = document.getElementById('produk-thead-row');
  if (thead) thead.innerHTML = '<th style="width:32px"></th><th>Katalog / SKU</th><th>HPP</th><th>Boss</th><th>Sistem</th>';
  renderProduk(_produkData);
}

function produkExitEditMode() {
  _produkEditMode = false;
  _produkEditDirty = false; produkUpdateDoneBtn();
  _produkSelected = {};
  document.getElementById('produk-toolbar-normal').style.display = 'flex';
  document.getElementById('produk-toolbar-edit').style.display   = 'none';
  // Reset thead
  var thead = document.getElementById('produk-thead-row');
  if (thead) thead.innerHTML = '<th>Katalog / SKU</th><th>HPP</th><th>Boss</th><th>Sistem</th>';
  renderProduk(_produkData);
}

function produkSelectAll() {
  var allSelected = _produkData.every(r => _produkSelected[r.id]);
  if (allSelected) {
    _produkSelected = {};
  } else {
    _produkData.forEach(r => { _produkSelected[r.id] = true; });
  }
  produkUpdateSelectBar();
  renderProduk(_produkData);
}

// ── KOLOM "SISTEM" (30 Sep 2026) ──────────────────────────────
// Turunan dari flag supplier (hutang_supplier) + produk.dropship — aturannya SAMA dgn zIsDropship() di supabase.js:
//   supplier Produksi Sendiri → "Produksi Sendiri" | Dropship murni → "Dropship" | Reseller murni → "Reseller"
//   supplier Dropship + Reseller (mis. RH) → ditentukan per SKU lewat produk.dropship (toggle di Edit Supplier)
function _produkSistemOf(row) {
  // 10 Okt 2026: override per SKU didahulukan (produk.sistem_override).
  // 30 Okt 2026: opsi "Ikuti supplier" DIHAPUS — tiap SKU punya sistem pasti (Dropship / Reseller / Produksi Sendiri) di sistem_override.
  // Cabang turunan-supplier di bawah cuma jaring pengaman buat baris lama yang masih kosong (belum di-backfill / dibuat app versi lama).
  if (row && (row.sistem_override === 'dropship' || row.sistem_override === 'reseller' || row.sistem_override === 'produksi')) return row.sistem_override;
  var s = _produkSupMap()[String((row && row.boss) || '').trim().toUpperCase()];
  if (!s) return '';
  if (s.is_produksi_sendiri) return 'produksi';
  if (s.is_dropship && s.is_reseller) return row.dropship === true ? 'dropship' : 'reseller';
  if (s.is_dropship) return 'dropship';
  if (s.is_reseller) return 'reseller';
  return '';
}

// ── DROPSHIP BERSAMAAN DENGAN P.O (19 Nov 2026) ─────────────
// Sistem SKU supplier UTAMA bukan lagi pilihan tunggal: Dropship dan P.O (Reseller) boleh menyala bersamaan; Produksi Sendiri tetap eksklusif.
// Penyimpanan: sistem_override = 'reseller' (stok dilacak, restock lewat P.O) + produk.dropship_juga (boolean). NULL = ikuti supplier: supplier 2 sistem
// (Dropship + Reseller) → Dropship juga aktif, sama seperti perilaku sebelum kolom ini ada. Dropship murni = sistem_override 'dropship'.
// Kalau Dropship ikut aktif di SKU Reseller: stok dipakai seperti biasa, dropship dipilih manual lewat toggle di Tambah Penjualan
// (tujuan: supplier utama; bon dropship otomatis); harga Dropship & P.O dari Master Barang.
function _produkDropshipJuga(row) {
  if (!row || _produkSistemOf(row) !== 'reseller') return false;
  if (row.dropship_juga === true) return true;
  if (row.dropship_juga === false) return false;
  return !!_produkSupDualByName(row.boss);
}
// Kunci tampilan: 'bersama' = Reseller + Dropship; selain itu = sistem SKU
function _produkSistemKey(row) {
  var e = _produkSistemOf(row);
  return (e === 'reseller' && _produkDropshipJuga(row)) ? 'bersama' : e;
}
function _produkSisState(row) {   // saklar yang menyala di SKU ini
  var e = _produkSistemOf(row);
  return { prod: e === 'produksi', po: e === 'reseller', ds: e === 'dropship' || _produkDropshipJuga(row) };
}
// Satu saklar ditekan: Produksi eksklusif; Dropship dan P.O bebas digabung; tidak boleh kosong (null = tidak berubah)
function _produkSisToggle(st, k) {
  var n = { ds: !!st.ds, po: !!st.po, prod: !!st.prod };
  if (k === 'prod') { if (n.prod) return null; n = { ds: false, po: false, prod: true }; }
  else { n[k] = !n[k]; if (n[k]) n.prod = false; }
  return (n.ds || n.po || n.prod) ? n : null;
}
function _produkSisTarget(st) {   // saklar → { sis, juga } atau null kalau belum ada yang dipilih
  if (st.prod) return { sis: 'produksi', juga: false };
  if (st.po && st.ds) return { sis: 'reseller', juga: true };
  if (st.po) return { sis: 'reseller', juga: false };
  if (st.ds) return { sis: 'dropship', juga: false };
  return null;
}
// Kolom yang ditulis ke produk. dropship_juga hanya disentuh bila perlu (ikut menyala = true; P.O saja di supplier 2 sistem = false eksplisit;
// keluar dari Reseller = dikembalikan NULL), jadi SKU lain tidak berubah dan tidak bergantung pada kolomnya sebelum dipakai.
function _produkSisPayloadFor(row, sis, juga) {
  var pl = { sistem_override: sis };
  if (sis === 'reseller') {
    if (juga) pl.dropship_juga = true;
    else if (row.dropship_juga != null || _produkSupDualByName(row.boss)) pl.dropship_juga = false;
  } else if (row.dropship_juga != null) pl.dropship_juga = null;
  return pl;
}
function _produkSisSama(row, sis, juga) {   // sistem SKU sudah persis seperti target (tidak perlu ditulis)
  return row.sistem_override === sis && (sis !== 'reseller' || _produkDropshipJuga(row) === !!juga);
}

// [30 Okt 2026] Sistem awal sebuah SKU berdasarkan supplier (Boss)-nya — dipakai saat SKU dibuat (Tambah / Paste Massal) dan saat Boss diganti.
//   Produksi Sendiri → 'produksi' | Dropship saja → 'dropship' | Reseller saja → 'reseller'
//   Dropship + Reseller (mis. RH) → `prefer` kalau 'dropship'/'reseller', selain itu 'dropship' (default RH)
//   Supplier tidak terdaftar / kosong → null (jangan menulis apa-apa; jatuh ke aturan supplier seperti biasa)
function _produkSistemDefault(boss, prefer) {
  var s = _produkSupMap()[String(boss || '').trim().toUpperCase()];
  if (!s) return null;
  if (s.is_produksi_sendiri) return 'produksi';
  if (s.is_dropship && s.is_reseller) return (prefer === 'dropship' || prefer === 'reseller') ? prefer : 'dropship';
  if (s.is_dropship) return 'dropship';
  if (s.is_reseller) return 'reseller';
  return null;
}
// Sistem SKU sekarang kalau 'dropship'/'reseller' (dipertahankan saat pindah ke supplier dual-mode); selain itu null
function _produkSistemPrefer(row) {
  var e = _produkSistemOf(row);
  return (e === 'dropship' || e === 'reseller') ? e : null;
}
function _produkBossBerubah(oldBoss, newBoss) {
  return String(oldBoss || '').trim().toUpperCase() !== String(newBoss || '').trim().toUpperCase();
}

// ── SUPPLIER CADANGAN (16 Nov 2026) ───────────────────────────
// Satu SKU = 1 supplier UTAMA (produk.boss, penentu sistem/stok/Re-Stock) + 0..n supplier CADANGAN (tabel produk_supplier).
// Cadangan dipakai saat stok utama kosong: penjualan dicatat dropship ke supplier cadangan lewat toggle di Tambah Penjualan
// (jurnal_penjualan.kirim_dropship + kirim_supplier_id) — stok utama TIDAK berkurang. Harga dropship di cadangan = Master Barang
// (hutang_barang: produk_id x supplier_id, harga_per_lusin / 12), satu tempat seperti harga supplier 2 sistem.
// Hanya supplier berflag Dropship (bukan Produksi Sendiri) yang bisa jadi cadangan.
function _produkSupById(id) {
  return (_produkSupplierList || []).find(function(s) { return s.id === id; }) || null;
}
function _produkCadRows(row) {   // [{ link, sup }] cadangan SKU ini
  var out = [];
  (_produkCadList || []).forEach(function(l) {
    if (l.produk_id !== row.id) return;
    var s = _produkSupById(l.supplier_id);
    if (s) out.push({ link: l, sup: s });
  });
  out.sort(function(a, b) { return String(a.sup.nama || '').localeCompare(String(b.sup.nama || ''), 'id'); });
  return out;
}
function _produkCadKandidat(row) {   // supplier yang boleh dipilih jadi cadangan SKU ini (flag supplier hanya saran awal, bukan kunci)
  var boss = String(row.boss || '').trim().toUpperCase();
  return (_produkSupplierList || []).filter(function(s) {
    return !s.is_produksi_sendiri && String(s.nama || '').trim().toUpperCase() !== boss;
  });
}
// Sistem yang aktif di satu tautan cadangan (SKU × supplier): Dropship dan/atau P.O (boleh dua-duanya)
function _produkCadMode(link) { return { ds: link.dropship !== false, po: link.po === true }; }
// Saran awal sistem saat supplier baru dijadikan cadangan, dari flag supplier (Channel › Supplier & ROP); tidak ada flag → Dropship
function _produkCadModeAwal(sup) { return { dropship: !!sup.is_dropship || !sup.is_reseller, po: !!sup.is_reseller }; }
function _produkCadHargaPo(row, supId) {   // harga P.O per pcs SKU ini di supplier cadangan (0 = belum diisi)
  var b = (_produkHbList || []).find(function(x) { return x.produk_id === row.id && x.supplier_id === supId; });
  return b && Number(b.harga_po_per_lusin) > 0 ? Math.round(Number(b.harga_po_per_lusin) / 12) : 0;
}
function _produkCadHargaDs(row, supId) {   // harga Dropship per pcs SKU ini di supplier cadangan (0 = belum diisi)
  var b = (_produkHbList || []).find(function(x) { return x.produk_id === row.id && x.supplier_id === supId; });
  return b && Number(b.harga_per_lusin) > 0 ? Math.round(Number(b.harga_per_lusin) / 12) : 0;
}
// Idempotent. modes = { dropship, po } (kosong → saran dari flag supplier); harga ds/po (per pcs) > 0 → diisi ke Master Barang dan sistemnya otomatis aktif.
// Tautan yang sudah ada: sistem digabung (tidak ada yang dimatikan).
async function _produkCadTambah(row, sup, ds, po, modes) {
  var m = modes ? { dropship: !!modes.dropship, po: !!modes.po } : _produkCadModeAwal(sup);
  if (Number(ds) > 0) m.dropship = true;
  if (Number(po) > 0) m.po = true;
  var link = (_produkCadList || []).find(function(l) { return l.produk_id === row.id && l.supplier_id === sup.id; });
  if (!link) {
    var ins = await dbInsert('produk_supplier', { produk_id: row.id, supplier_id: sup.id, dropship: m.dropship, po: m.po });
    var nl = Array.isArray(ins) ? ins[0] : ins;
    _produkCadList.push({ id: nl && nl.id, produk_id: row.id, supplier_id: sup.id, dropship: m.dropship, po: m.po });
  } else {
    var cur = _produkCadMode(link), gab = { dropship: cur.ds || m.dropship, po: cur.po || m.po };
    if (gab.dropship !== cur.ds || gab.po !== cur.po) {
      await dbUpdate('produk_supplier', link.id, gab);
      link.dropship = gab.dropship; link.po = gab.po;
    }
  }
  if (Number(ds) > 0 || Number(po) > 0) await _produkUpsertHargaDual(row, sup, po, ds);
}
async function _produkCadHapus(linkId) {
  await dbDelete('produk_supplier', linkId, true);
  _produkCadList = (_produkCadList || []).filter(function(l) { return l.id !== linkId; });
}
// Supplier utama berganti → kalau supplier barunya tadinya cadangan SKU itu, tautan cadangannya dibuang (tidak boleh jadi utama + cadangan sekaligus)
async function _produkCadBersihkanUtama(produkId, bossNama) {
  var sup = _produkSupMap()[String(bossNama || '').trim().toUpperCase()];
  if (!sup) return;
  var dup = (_produkCadList || []).filter(function(l) { return l.produk_id === produkId && l.supplier_id === sup.id; });
  for (var i = 0; i < dup.length; i++) await _produkCadHapus(dup[i].id);
}
// Sel Boss: supplier utama + penanda kecil "+ RH" untuk cadangan
function _produkBossHtml(row) {
  var cad = _produkCadRows(row);
  var h = row.boss || '—';
  if (cad.length) h += '<div style="font-size:10px;color:var(--ink3);margin-top:2px">+ ' + _pkEsc(cad.map(function(c) { return c.sup.nama; }).join(', ')) + '</div>';
  return h;
}
// Sel Boss baris katalog: cadangan yang dimiliki semua varian → "+ RH"; sebagian → "+ RH (3/10)"
function _produkCadKatalogSub(rows) {
  var cnt = {};
  rows.forEach(function(r) { _produkCadRows(r).forEach(function(c) { cnt[c.sup.nama] = (cnt[c.sup.nama] || 0) + 1; }); });
  var parts = Object.keys(cnt).sort().map(function(n) { return _pkEsc(n) + (cnt[n] === rows.length ? '' : ' (' + cnt[n] + '/' + rows.length + ')'); });
  return parts.length ? '+ ' + parts.join(', ') : '';
}

var _PRODUK_SISTEM_META = {
  produksi: { label: 'Produksi Sendiri', color: 'var(--ok)'   },
  reseller: { label: 'Reseller',         color: 'var(--info)' },
  dropship: { label: 'Dropship',         color: 'var(--warn)' },
  bersama:  { label: 'Reseller + Dropship', color: 'var(--info)' }   // 19 Nov 2026: P.O dan Dropship menyala bersamaan (sistem_override reseller + dropship_juga)
};

// ── RINGKASAN SUPPLIER AKTIF (19 Nov 2026) ───────────────────
// Di Edit Supplier Massal: supplier UTAMA dan CADANGAN yang sedang aktif pada SKU terpilih beserta sistemnya, supaya jelas sebelum
// mengganti utama / menambah cadangan. Chip warna sama dengan kolom Sistem. Sistem utama = sistem SKU (sistem_override), sistem cadangan =
// saklar Dropship / P.O di tautannya; daftar pilih supplier menampilkan apa yang didukung supplier (flag Channel › Supplier & ROP).
function _produkSisChip(k, teks) {
  var m = _PRODUK_SISTEM_META[k] || { label: k, color: 'var(--ink3)' };
  return '<span style="display:inline-block;font-size:10px;font-weight:700;line-height:1.4;padding:0 6px;margin:1px 3px 1px 0;border:1.5px solid ' + m.color + ';color:' + m.color + ';border-radius:4px;white-space:nowrap">' + _pkEsc(teks || m.label) + '</span>';
}
function _produkSupChips(sup) {   // sistem yang DIDUKUNG supplier (flag Supplier & ROP)
  if (!sup) return '';
  if (sup.is_produksi_sendiri) return _produkSisChip('produksi');
  return (sup.is_dropship ? _produkSisChip('dropship') : '') + (sup.is_reseller ? _produkSisChip('reseller') : '');
}
function _produkSupRingkasHtml() {
  var ids = Object.keys(_produkSelected).map(Number);
  var rows = _produkData.filter(function(r) { return ids.indexOf(r.id) >= 0; });
  if (!rows.length) return '';
  var utama = {}, cad = {};
  rows.forEach(function(r) {
    var k = String(r.boss || '').trim().toUpperCase() || '—';
    var g = utama[k] || (utama[k] = { nama: r.boss || '—', n: 0, sis: {} });
    g.n++;
    var e = _produkSistemKey(r) || '';
    g.sis[e] = (g.sis[e] || 0) + 1;
    _produkCadRows(r).forEach(function(c) {
      var cg = cad[c.sup.id] || (cad[c.sup.id] = { sup: c.sup, n: 0, ds: 0, po: 0 });
      var m = _produkCadMode(c.link);
      cg.n++; if (m.ds) cg.ds++; if (m.po) cg.po++;
    });
  });
  var total = rows.length;
  var jml = function(n) { return n === total ? '' : ' ' + n + '/' + total; };   // sebagian SKU saja → tampil "3/10"
  var utamaHtml = Object.keys(utama).sort().map(function(k) {
    var g = utama[k];
    var chips = Object.keys(g.sis).filter(function(e) { return e; }).map(function(e) { return _produkSisChip(e, _PRODUK_SISTEM_META[e].label + (Object.keys(g.sis).length > 1 ? ' ' + g.sis[e] : '')); }).join('');
    return '<div style="display:flex;align-items:center;gap:8px;padding:3px 0"><b style="font-size:13px">' + _pkEsc(g.nama) + '</b><span>' + chips + '</span><span style="margin-left:auto;font-size:11px;color:var(--ink3);white-space:nowrap">' + g.n + ' SKU</span></div>';
  }).join('');
  var cadKeys = Object.keys(cad).sort(function(a, b) { return String(cad[a].sup.nama || '').localeCompare(String(cad[b].sup.nama || ''), 'id'); });
  var cadHtml = cadKeys.length ? cadKeys.map(function(k) {
    var g = cad[k];
    var chips = (g.ds ? _produkSisChip('dropship', 'Dropship' + jml(g.ds)) : '') + (g.po ? _produkSisChip('reseller', 'P.O' + jml(g.po)) : '');
    return '<div style="display:flex;align-items:center;gap:8px;padding:3px 0"><b style="font-size:13px">' + _pkEsc(g.sup.nama) + '</b><span>' + chips + '</span><span style="margin-left:auto;font-size:11px;color:var(--ink3);white-space:nowrap">' + g.n + ' SKU</span></div>';
  }).join('') : '<div style="font-size:12px;color:var(--ink3);padding:3px 0">Belum ada supplier cadangan.</div>';
  var lbl = 'font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin:0 0 2px';
  return '<div style="border:1.5px solid var(--ink4);border-radius:8px;padding:8px 12px;margin-bottom:12px;background:var(--cream2)">'
    + '<div style="' + lbl + '">Supplier utama</div>' + utamaHtml
    + '<div style="' + lbl + ';margin-top:8px;padding-top:6px;border-top:1px dashed var(--ink4)">Supplier cadangan</div>' + cadHtml
    + '</div>';
}

// ── DUA HARGA SUPPLIER 2 SISTEM (3 Nov 2026) ─────────────────
// SKU milik supplier Dropship + Reseller (mis. MAGRA, RH) punya dua harga per pcs: P.O (reseller) dan Dropship. Tersimpan SATU tempat di Master Barang
// (hutang_barang: harga_po_per_lusin / harga_per_lusin, per lusin = per pcs × 12) — Kelola Produk hanya menampilkan & mengisinya (upsert ke Master Barang),
// jadi bon/PO/Re-Stock yang sudah membaca Master Barang tidak berubah. produk.hpp = harga sistem SKU yang berlaku (Dropship → harga Dropship, selain itu → P.O).
function _produkSupDualByName(boss) {
  var s = _produkSupMap()[String(boss || '').trim().toUpperCase()];
  return (s && s.is_dropship && s.is_reseller && !s.is_produksi_sendiri) ? s : null;
}
function _produkHargaDualOf(row) {   // { sup, po, ds } per pcs (0 = belum diisi) atau null kalau supplier SKU bukan 2 sistem
  var s = _produkSupDualByName(row && row.boss);
  if (!s) return null;
  var b = (_produkHbList || []).find(function(x) { return x.produk_id === row.id && x.supplier_id === s.id; });
  var po = b && Number(b.harga_po_per_lusin) > 0 ? Math.round(Number(b.harga_po_per_lusin) / 12) : 0;
  var ds = b && Number(b.harga_per_lusin) > 0 ? Math.round(Number(b.harga_per_lusin) / 12) : 0;
  // HPP SKU = harga sistem aktifnya. Kalau Master Barang belum punya harga sistem itu (SKU lama, mis. HPP yang diisi sebelum ada 2 harga),
  // pakai HPP sebagai harga sistem aktif — supaya angka yang sudah ada tidak hilang dari tampilan dan terbawa saat Edit.
  var hpp = Number(row.hpp) || 0;
  if (_produkSistemOf(row) === 'dropship') { if (!ds) ds = hpp; } else { if (!po) po = hpp; }
  return { sup: s, po: po, ds: ds };
}
// Isi harga P.O / Dropship (per pcs; 0 = jangan diubah) SKU ke Master Barang supplier 2 sistem. Baris Master Barang belum ada → dibuat (SKU Supplier boleh kosong).
async function _produkUpsertHargaDual(row, sup, po, ds) {
  var data = {};
  if (Number(ds) > 0) data.harga_per_lusin = Math.round(Number(ds) * 12);
  if (Number(po) > 0) data.harga_po_per_lusin = Math.round(Number(po) * 12);
  if (!Object.keys(data).length) return;
  var cur = (_produkHbList || []).find(function(x) { return x.produk_id === row.id && x.supplier_id === sup.id; });
  if (cur) {
    await dbUpdate('hutang_barang', cur.id, data);
    Object.keys(data).forEach(function(k) { cur[k] = data[k]; });
  } else {
    var ins = await dbInsert('hutang_barang', Object.assign({
      supplier_id: sup.id, produk_id: row.id, katalog_produk: row.katalog || null, varian_warna: row.sku_variasi || null,
      sku_variasi_supplier: null, nama_supplier: null
    }, data));
    var nb = Array.isArray(ins) ? ins[0] : ins;
    _produkHbList.push(Object.assign({ id: nb && nb.id, produk_id: row.id, supplier_id: sup.id, harga_per_lusin: null, harga_po_per_lusin: null }, data));
  }
}
// HPP yang berlaku untuk SKU 2 sistem: harga sistemnya (Dropship → Dropship, selain itu → P.O); harga yang belum diisi → pertahankan HPP sekarang
function _produkHppDual(sistem, po, ds, hppSekarang) {
  var h = (sistem === 'dropship') ? ds : po;
  return Number(h) > 0 ? Number(h) : (Number(hppSekarang) || 0);
}
function _produkRp(n) { return 'Rp' + (Number(n) || 0).toLocaleString('id-ID'); }
function _produkRentang(arr) {
  var v = arr.filter(function(x) { return x > 0; });
  if (!v.length) return '—';
  var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v);
  return mn === mx ? _produkRp(mx) : _produkRp(mn) + '–' + Math.round(mx).toLocaleString('id-ID');
}
// Sel HPP untuk baris varian: supplier 2 sistem → dua baris (P.O & Dropship, harga sistem aktif ditebalkan); selain itu satu angka seperti biasa
function _produkHppVarianHtml(row) {
  var d = _produkHargaDualOf(row);
  if (!d) return _produkRp(row.hpp);
  var ds = _produkSistemOf(row) === 'dropship';
  return '<div style="line-height:1.25;font-size:12px">'
    + '<div style="' + (!ds ? 'font-weight:700' : 'color:var(--ink3)') + '">P.O ' + (d.po ? _produkRp(d.po) : '—') + '</div>'
    + '<div style="' + (ds ? 'font-weight:700' : 'color:var(--ink3)') + '">Dropship ' + (d.ds ? _produkRp(d.ds) : '—') + '</div></div>';
}
// Isi sel HPP baris katalog (header): supplier 2 sistem → rentang P.O & Dropship seluruh varian
function _produkHppKatalogHtml(rows, hppTxt) {
  var ds = rows.map(_produkHargaDualOf);
  if (!ds.length || ds.some(function(x) { return !x; })) return '<div style="font-size:14px;font-weight:600">' + hppTxt + '</div>';
  return '<div style="font-size:12px;line-height:1.3">'
    + '<div><span style="color:var(--ink3)">P.O</span> <b>' + _produkRentang(ds.map(function(x) { return x.po; })) + '</b></div>'
    + '<div><span style="color:var(--ink3)">Dropship</span> <b>' + _produkRentang(ds.map(function(x) { return x.ds; })) + '</b></div></div>';
}

function _produkSistemPill(key) {
  var m = _PRODUK_SISTEM_META[key];
  if (!m) return '<span style="color:var(--ink3)">—</span>';
  return '<span style="display:inline-block;font-size:12px;font-weight:700;padding:2px 9px;border-radius:4px;border:1px solid ' + m.color + ';color:' + m.color + ';white-space:nowrap">' + m.label + '</span>';
}

// [30 Sep 2026] Urutan varian dalam 1 katalog yang punya SIZE (mis. Turtleneck, RH_Zipper-salur): per WARNA (A-Z), di dalam warna urut size S<M<L<XL<XXL<XXXL.
// Format SKU: <induk>_<warna>-<size> (juga <induk>-<warna>-<size>). Katalog yang varian-nya tidak berakhiran size dikenali dibiarkan urutan aslinya.
var _PRODUK_SIZE_RANK = { 'XXS':0,'XS':1,'S':2,'M':3,'L':4,'XL':5,'XXL':6,'XXXL':7 };
function _produkParseWarnaSize(sku) {
  var t = String(sku || '').trim();
  var i = t.lastIndexOf('-');
  if (i < 1) return null;
  var size = t.slice(i + 1).trim().toUpperCase();
  if (!/^[A-Z0-9]{1,5}$/.test(size)) return null;
  var base = t.slice(0, i);
  var j = base.search(/[_-]/);
  var warna = (j >= 0 ? base.slice(j + 1) : base).trim().toLowerCase();
  return { warna: warna, size: size };
}
function _produkSortWarnaSize(rows) {
  var parsed = rows.map(function(r, idx) { return { r: r, idx: idx, p: _produkParseWarnaSize(r.sku_variasi) }; });
  var hasSize = parsed.filter(function(x) { return x.p && _PRODUK_SIZE_RANK[x.p.size] !== undefined; }).length;
  if (hasSize < 2 || hasSize < rows.length / 2) return rows;   // bukan katalog ber-size → urutan asli
  parsed.sort(function(a, b) {
    var wa = a.p ? a.p.warna : '~', wb = b.p ? b.p.warna : '~';
    if (wa !== wb) return wa < wb ? -1 : 1;
    var ra = a.p && _PRODUK_SIZE_RANK[a.p.size] !== undefined ? _PRODUK_SIZE_RANK[a.p.size] : 99;
    var rb = b.p && _PRODUK_SIZE_RANK[b.p.size] !== undefined ? _PRODUK_SIZE_RANK[b.p.size] : 99;
    if (ra !== rb) return ra - rb;
    return a.idx - b.idx;
  });
  return parsed.map(function(x) { return x.r; });
}

// Baris katalog: semua varian sama → 1 pill; campur → "Campuran" + rincian kecil di bawahnya
function _produkSistemKatalogCell(rows) {
  var cnt = {};
  rows.forEach(function(r) { var k = _produkSistemKey(r) || '-'; cnt[k] = (cnt[k] || 0) + 1; });
  var keys = Object.keys(cnt);
  if (keys.length === 1) return _produkSistemPill(keys[0] === '-' ? '' : keys[0]);
  var detail = keys.map(function(k) {
    var m = _PRODUK_SISTEM_META[k];
    return cnt[k] + ' ' + (m ? m.label : 'Belum diatur');
  }).join(' · ');
  return '<div style="line-height:1.2"><span style="display:inline-block;font-size:12px;font-weight:700;padding:2px 9px;border-radius:4px;border:1px solid var(--ink3);color:var(--ink2,var(--ink));white-space:nowrap">Campuran</span>' +
         '<div style="font-size:10px;color:var(--ink3);margin-top:3px">' + detail + '</div></div>';
}

// ── Sistem per SKU varian (10 Okt 2026): tombol → sheet gaya komentar Instagram ──
var _PRODUK_SISTEM_OPSI = [
  { k: 'dropship', l: 'Dropship',         d: 'Tidak disetok. Bon dropship dicatat ke supplier.' },
  { k: 'reseller', l: 'Reseller',         d: 'Dibeli sebagai PO dari supplier.' },
  { k: 'produksi', l: 'Produksi Sendiri', d: 'Disetok sendiri. Stok dilacak.' }
];   // 30 Okt 2026: opsi "Ikuti supplier" dihapus — pilihan harus pasti
var _pkSisId = null;

function _pkEsc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function _produkSistemBtn(row) {
  var key = _produkSistemKey(row);
  var m   = _PRODUK_SISTEM_META[key];
  var lbl = m ? m.label : 'Belum diatur';
  var col = m ? m.color : 'var(--ink3)';
  // 30 Okt 2026: titik ● "diatur khusus" dibuang — semua SKU sekarang punya sistem sendiri, jadi tidak ada lagi yang "khusus".
  return '<button type="button" class="pk-sis-btn" style="color:' + col + ';border-color:' + col + '"'
    + ' onclick="event.stopPropagation();produkSistemSheetOpen(' + row.id + ')">'
    + lbl
    + ' <i class="ti ti-chevron-down"></i></button>';
}

(function() {
  if (document.getElementById('pk-sis-style')) return;
  var st = document.createElement('style');
  st.id = 'pk-sis-style';
  st.textContent = [
    '.pk-sis-btn{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;border:1.5px solid;background:var(--cream2);cursor:pointer;white-space:nowrap;transition:background .15s,transform .1s}',
    '.pk-sis-btn:hover{background:var(--ovl-0_04)}',
    '.pk-sis-btn:active{transform:scale(.97)}',
    '.pk-sis-btn i{font-size:12px}',
    '.pk-sis-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;vertical-align:middle}',
    '#pk-sis-overlay{display:none;position:fixed;inset:0;z-index:700;background:rgba(0,0,0,.45);opacity:0;transition:opacity .2s ease}',
    '#pk-sis-overlay.open{display:block}',
    '#pk-sis-overlay.show{opacity:1}',
    '#pk-sis-sheet{position:fixed;left:0;right:0;bottom:0;z-index:701;background:var(--cream2);border-radius:16px 16px 0 0;padding:6px 0 calc(10px + env(safe-area-inset-bottom,0px));max-height:82vh;overflow:auto;transform:translateY(100%);transition:transform .28s cubic-bezier(.2,.8,.2,1)}',
    '#pk-sis-sheet.show{transform:translateY(0)}',
    '#pk-sis-sheet .pk-sis-handle{width:40px;height:4px;background:var(--ovl-0_18);border-radius:2px;margin:8px auto 6px}',
    '#pk-sis-sheet .pk-sis-title{text-align:center;font-size:15px;font-weight:700;color:var(--ink);padding:4px 18px 2px}',
    '#pk-sis-sheet .pk-sis-sub{text-align:center;font-size:12px;color:var(--ink3);padding:0 18px 10px;border-bottom:1px solid var(--ovl-0_06)}',
    '#pk-sis-sheet .pk-sis-sub b{color:var(--ink)}',
    '.pk-sis-row{display:flex;align-items:center;gap:12px;padding:13px 18px;cursor:pointer;border-bottom:1px solid var(--ovl-0_04);transition:background .12s}',
    '.pk-sis-row:hover{background:var(--ovl-0_04)}',
    '.pk-sis-row:active{background:var(--ovl-0_06)}',
    '.pk-sis-rtxt{flex:1;min-width:0}',
    '.pk-sis-rl{font-size:15px;font-weight:600;color:var(--ink)}',
    '.pk-sis-rd{font-size:11.5px;color:var(--ink3);margin-top:2px}',
    '.pk-sis-tg{position:relative;width:46px;height:26px;border-radius:999px;background:var(--ovl-0_18);flex-shrink:0;transition:background .2s ease}',
    '.pk-sis-tg::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s ease}',
    '.pk-sis-row.on .pk-sis-tg{background:#4cd080}',
    '.pk-sis-row.on .pk-sis-tg::after{transform:translateX(20px)}',
    '@media (min-width:768px){',
    '  #pk-sis-sheet{left:50%;right:auto;bottom:auto;top:50%;width:380px;max-width:92vw;border-radius:14px;transform:translate(-50%,-46%) scale(.96);opacity:0;transition:transform .2s ease,opacity .2s ease}',
    '  #pk-sis-sheet.show{transform:translate(-50%,-50%) scale(1);opacity:1}',
    '  #pk-sis-sheet .pk-sis-handle{display:none}',
    '}'
  ].join('\n');
  document.head.appendChild(st);

  var ov = document.createElement('div');
  ov.id = 'pk-sis-overlay';
  ov.addEventListener('click', produkSistemSheetClose);
  var sh = document.createElement('div');
  sh.id = 'pk-sis-sheet';
  sh.setAttribute('role', 'dialog');
  sh.setAttribute('aria-label', 'Pilih sistem SKU');
  document.body.appendChild(ov);
  document.body.appendChild(sh);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && sh.classList.contains('show')) produkSistemSheetClose();
  });
})();

function produkSistemSheetOpen(id) {
  var row = (_produkData || []).find(function(r) { return String(r.id) === String(id); });
  if (!row) return;
  _pkSisId = row.id;
  var eff = _produkSistemOf(row);
  var key = _produkSistemKey(row);
  var st = _produkSisState(row);   // saklar menyala: Dropship dan P.O boleh bersamaan, Produksi Sendiri eksklusif
  var effM = _PRODUK_SISTEM_META[key];
  var boss = row.boss || '—';
  var rows = [
    ['ds',   'Dropship',         'Tidak disetok. Bon dropship dicatat ke supplier ' + _pkEsc(boss) + '.'],
    ['po',   'P.O (Reseller)',   'Dibeli sebagai PO dari supplier. Boleh digabung dengan Dropship.'],
    ['prod', 'Produksi Sendiri', 'Disetok sendiri. Stok dilacak.']
  ].map(function(o) {
    return '<div class="pk-sis-row' + (st[o[0]] ? ' on' : '') + '" onclick="produkSistemToggle(\'' + o[0] + '\')">'
      + '<div class="pk-sis-rtxt"><div class="pk-sis-rl">' + o[1] + '</div><div class="pk-sis-rd">' + o[2] + '</div></div>'
      + '<span class="pk-sis-tg"></span></div>';
  }).join('');
  var sh = document.getElementById('pk-sis-sheet');
  sh.innerHTML = '<div class="pk-sis-handle"></div>'
    + '<div class="pk-sis-title">' + _pkEsc(row.sku_variasi) + '</div>'
    + '<div class="pk-sis-sub">Sekarang: <b>' + (effM ? effM.label : 'Belum diatur') + '</b> · Supplier: ' + _pkEsc(boss) + '</div>'
    + rows + _produkCadRow(row, eff);
  var ovEl = document.getElementById('pk-sis-overlay');
  ovEl.classList.add('open');
  sh.classList.add('show'); // transisi berjalan karena overlay sudah display:block di frame yang sama
  requestAnimationFrame(function() { ovEl.classList.add('show'); });
}

function produkSistemSheetClose() {
  var ovEl = document.getElementById('pk-sis-overlay');
  var sh   = document.getElementById('pk-sis-sheet');
  if (sh) sh.classList.remove('show');
  if (ovEl) ovEl.classList.remove('show');
  setTimeout(function() { if (ovEl) ovEl.classList.remove('open'); }, 200);
  _pkSisId = null;
}

// ── SUPPLIER CADANGAN per SKU (16 Nov 2026, menggantikan Padanan Dropship; sistem per sumber 17 Nov 2026) ──
// Baris di sheet Sistem → sheet "Supplier Cadangan": daftar supplier (selain supplier utama & Produksi Sendiri), ketuk = jadikan / lepas cadangan.
// Tiap cadangan punya 2 sistem sendiri — Dropship dan P.O (boleh dua-duanya) — dengan harga masing-masing di Master Barang:
// ketuk saklar = aktif/nonaktif, ketuk barisnya = ubah harga.
function _produkCadRow(row, eff) {
  if (eff === 'dropship') return '';
  var cad = _produkCadRows(row);
  var ket = cad.length
    ? cad.map(function(c) {
        var m = _produkCadMode(c.link), bagian = [];
        if (m.ds) { var d = _produkCadHargaDs(row, c.sup.id); bagian.push('Dropship ' + (d ? _produkRp(d) : 'harga belum diisi')); }
        if (m.po) { var o = _produkCadHargaPo(row, c.sup.id); bagian.push('P.O ' + (o ? _produkRp(o) : 'harga belum diisi')); }
        return _pkEsc(c.sup.nama) + ' · ' + (bagian.join(' · ') || 'tidak ada sistem aktif');
      }).join(' | ')
    : 'Belum ada — dipakai saat stok utama kosong: Dropship (toggle di Tambah Penjualan) atau P.O (sumber di Tambah Stok Masuk).';
  return '<div class="pk-sis-row" onclick="produkCadOpen()">'
    + '<div class="pk-sis-rtxt"><div class="pk-sis-rl">Supplier Cadangan</div><div class="pk-sis-rd">' + ket + '</div></div>'
    + '<i class="ti ti-chevron-right" style="color:var(--ink3)"></i></div>';
}

function produkCadOpen() {
  var row = (_produkData || []).find(function(r) { return String(r.id) === String(_pkSisId); });
  var sh = document.getElementById('pk-sis-sheet');
  if (!row || !sh) return;
  sh.innerHTML = '<div class="pk-sis-handle"></div>'
    + '<div class="pk-sis-title">Supplier Cadangan</div>'
    + '<div class="pk-sis-sub"><b>' + _pkEsc(row.sku_variasi) + '</b> — utama: <b>' + _pkEsc(row.boss || '—') + '</b>. Dipakai saat stok utama kosong. Dropship: dicatat dropship ke cadangan, stok utama tidak berkurang. P.O: stok dibeli dari cadangan lewat Tambah Stok Masuk dan bonnya terbentuk otomatis.</div>'
    + '<div id="pk-cad-list"></div>'
    + '<div class="pk-sis-row" onclick="produkSistemSheetOpen(_pkSisId)"><div class="pk-sis-rtxt"><div class="pk-sis-rl">Kembali</div></div></div>';
  produkCadRender();
}

function _produkCadRowSheet() { return (_produkData || []).find(function(r) { return String(r.id) === String(_pkSisId); }); }

function produkCadRender() {
  var row = _produkCadRowSheet();
  var box = document.getElementById('pk-cad-list');
  if (!row || !box) return;
  var kand = _produkCadKandidat(row);
  var link = {};
  _produkCadRows(row).forEach(function(c) { link[c.sup.id] = c.link; });
  if (!kand.length) { box.innerHTML = '<div class="pk-sis-sub" style="padding:14px 18px">Belum ada supplier lain yang bisa jadi cadangan.</div>'; return; }
  box.innerHTML = kand.map(function(sup) {
    var l = link[sup.id];
    var out = '<div class="pk-sis-row' + (l ? ' on' : '') + '" onclick="produkCadToggle(' + sup.id + ')">'
      + '<div class="pk-sis-rtxt"><div class="pk-sis-rl">' + _pkEsc(sup.nama) + '</div>'
      + '<div class="pk-sis-rd">' + (l ? 'Cadangan aktif' : 'Ketuk untuk jadikan cadangan') + '</div></div>'
      + '<span class="pk-sis-tg"></span></div>';
    if (l) {
      var m = _produkCadMode(l);
      [['ds', 'Dropship', m.ds, _produkCadHargaDs(row, sup.id)], ['po', 'P.O', m.po, _produkCadHargaPo(row, sup.id)]].forEach(function(x) {
        out += '<div class="pk-sis-row' + (x[2] ? ' on' : '') + '" style="padding-left:34px" onclick="produkCadHarga(' + sup.id + ',\'' + x[0] + '\')">'
          + '<div class="pk-sis-rtxt"><div class="pk-sis-rl" style="font-size:13px">' + x[1] + '</div>'
          + '<div class="pk-sis-rd">' + (x[3] ? _produkRp(x[3]) + ' / pcs — ketuk untuk ubah harga' : '<span style="color:var(--danger)">Harga belum diisi</span> — ketuk untuk isi') + '</div></div>'
          + '<span class="pk-sis-tg" onclick="event.stopPropagation();produkCadMode(' + sup.id + ',\'' + x[0] + '\')"></span></div>';
      });
    }
    return out;
  }).join('');
}

function _produkCadPesanError(e) {
  var msg = (e && e.message) || String(e);
  return msg + (/produk_supplier|column.*(dropship|po)\b/i.test(msg) ? '\n\nTabel/kolom belum ada — jalankan zenoot-multi-supplier.sql dan zenoot-multi-supplier-sistem.sql di Supabase dulu.' : '');
}

async function produkCadToggle(supId) {
  var row = _produkCadRowSheet();
  var sup = _produkSupById(supId);
  if (!row || !sup) return;
  try {
    var link = (_produkCadList || []).find(function(l) { return l.produk_id === row.id && l.supplier_id === supId; });
    if (link) await _produkCadHapus(link.id);
    else await _produkCadTambah(row, sup, 0, 0, null);
    produkMarkDirty();
    renderProduk(_produkData);
    produkCadRender();
  } catch (e) { alert('Gagal simpan supplier cadangan: ' + _produkCadPesanError(e)); }
}

async function produkCadMode(supId, mk) {   // saklar Dropship / P.O satu cadangan; minimal satu sistem harus aktif
  var row = _produkCadRowSheet();
  var link = row ? (_produkCadList || []).find(function(l) { return l.produk_id === row.id && l.supplier_id === supId; }) : null;
  if (!link) return;
  var m = _produkCadMode(link), baru = { dropship: m.ds, po: m.po };
  if (mk === 'ds') baru.dropship = !m.ds; else baru.po = !m.po;
  if (!baru.dropship && !baru.po) { alert('Minimal satu sistem aktif. Kalau supplier ini tidak dipakai lagi, lepas lewat ketuk namanya.'); return; }
  try {
    await dbUpdate('produk_supplier', link.id, baru);
    link.dropship = baru.dropship; link.po = baru.po;
    produkMarkDirty();
    renderProduk(_produkData);
    produkCadRender();
  } catch (e) { alert('Gagal simpan sistem: ' + _produkCadPesanError(e)); }
}

async function produkCadHarga(supId, mk) {
  var row = _produkCadRowSheet();
  var sup = _produkSupById(supId);
  if (!row || !sup) return;
  var ds = mk === 'ds';
  var v = await zPrompt('Harga ' + (ds ? 'Dropship' : 'P.O') + ' ' + row.sku_variasi + ' di ' + sup.nama + ' (Rp per pcs)', String((ds ? _produkCadHargaDs(row, supId) : _produkCadHargaPo(row, supId)) || ''), { title: 'Harga ' + (ds ? 'Dropship' : 'P.O'), placeholder: 'Contoh: 48000' });
  if (v == null) return;
  var n = parseInt(String(v).replace(/\D/g, ''), 10) || 0;
  if (!(n > 0)) { alert('Isi angka harga yang valid.'); return; }
  try {
    var link = (_produkCadList || []).find(function(l) { return l.produk_id === row.id && l.supplier_id === supId; });
    if (link && !(ds ? _produkCadMode(link).ds : _produkCadMode(link).po)) {   // isi harga = sistem itu dipakai → aktifkan
      var m = _produkCadMode(link), baru = { dropship: m.ds || ds, po: m.po || !ds };
      await dbUpdate('produk_supplier', link.id, baru);
      link.dropship = baru.dropship; link.po = baru.po;
    }
    await _produkUpsertHargaDual(row, sup, ds ? 0 : n, ds ? n : 0);
    produkMarkDirty();
    renderProduk(_produkData);
    produkCadRender();
  } catch (e) { alert('Gagal simpan harga: ' + _produkCadPesanError(e)); }
}

function _produkYmdHariIni() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Cap produk.dropship_mulai di payload SKU yang sistemnya DIGANTI (3 Nov 2026): ke Dropship → hari ini (kalau sebelumnya bukan Dropship), keluar dari
// Dropship → dikosongkan. Dipakai semua jalur yang mengubah sistem_override SKU yang sudah ada, supaya bon dropship tidak ditarik mundur ke penjualan lama.
// SKU baru (row kosong) tidak dicap: belum punya riwayat.
function _produkStampDropshipMulai(payload, row) {
  // 19 Nov 2026: dropship_juga (Dropship bersamaan dengan P.O) dikembalikan ke NULL (ikuti supplier) kalau sistem atau supplier utama SKU berganti,
  // kecuali payload sudah menentukannya sendiri. Hanya ditulis bila nilainya memang ada (kolom baru tidak disentuh pada SKU lain).
  if (payload && row && row.dropship_juga != null && payload.dropship_juga === undefined
      && ((payload.sistem_override && payload.sistem_override !== _produkSistemOf(row))
          || (payload.boss !== undefined && _produkBossBerubah(row.boss, payload.boss)))) payload.dropship_juga = null;
  var sis = payload && payload.sistem_override;
  if (!sis || !row) return;
  if (sis === 'dropship') { if (_produkSistemOf(row) !== 'dropship') payload.dropship_mulai = _produkYmdHariIni(); }
  else if (row.dropship_mulai) payload.dropship_mulai = null;
}

// Harga per pcs SKU ini menurut Master Barang (Hutang Barang) di supplier-nya, sesuai sistem yang dipilih:
// Dropship → harga_per_lusin ÷ 12, Reseller → harga_po_per_lusin ÷ 12. 0 = tidak ada acuan (jangan menyentuh HPP).
async function _produkHargaSistem(row, sistem) {
  if (sistem !== 'dropship' && sistem !== 'reseller') return 0;
  var s = _produkSupMap()[String(row.boss || '').trim().toUpperCase()];
  if (!s) return 0;
  var hb = await dbGet('hutang_barang', '&produk_id=eq.' + row.id + '&supplier_id=eq.' + s.id);
  var b = (hb || [])[0];
  if (!b) return 0;
  var lusin = Number(sistem === 'dropship' ? b.harga_per_lusin : b.harga_po_per_lusin) || 0;
  return lusin > 0 ? Math.round(lusin / 12) : 0;
}

async function produkSistemToggle(k) {
  if (_pkSisId == null) return;
  var row = (_produkData || []).find(function(r) { return String(r.id) === String(_pkSisId); });
  if (!row) { produkSistemSheetClose(); return; }
  var baru = _produkSisToggle(_produkSisState(row), k);
  if (!baru) { alert('Minimal satu sistem harus aktif.'); return; }
  var tgt = _produkSisTarget(baru), val = tgt.sis;
  if (_produkSisSama(row, val, tgt.juga)) { produkSistemSheetOpen(row.id); return; }
  var sup = _produkSupMap()[String(row.boss || '').trim().toUpperCase()];
  if (sup && sup.is_produksi_sendiri && val !== 'produksi') {   // supplier Produksi Sendiri eksklusif — sama dengan Edit Sistem massal
    alert('Supplier ' + (row.boss || '') + ' hanya bisa Produksi Sendiri. Untuk Dropship / P.O tambahkan supplier cadangan (Edit Supplier › + Cadangan).');
    return;
  }
  // 30 Okt 2026: pilihan SELALU disimpan eksplisit di sistem_override.
  var payload = _produkSisPayloadFor(row, val, tgt.juga);
  _produkStampDropshipMulai(payload, row);   // 3 Nov 2026: penjualan sebelum hari ini tidak ditarik mundur ke bon dropship
  // 3 Nov 2026: SKU supplier 2 sistem → HPP otomatis ikut harga sistem barunya (Dropship → harga Dropship, selain itu → harga P.O) dari Master Barang.
  // Harga yang belum diisi → HPP dibiarkan. Supplier 1 sistem tidak disentuh.
  try {
    if (_produkSupDualByName(row.boss)) {
      var hargaBaru = await _produkHargaSistem(row, val);
      if (hargaBaru > 0 && hargaBaru !== (Number(row.hpp) || 0)) payload.hpp = hargaBaru;
    }
  } catch (eHarga) { console.warn('[produk] cek harga sistem gagal:', eHarga && eHarga.message); }
  try {
    await dbUpdate('produk', row.id, payload);
    Object.keys(payload).forEach(function(kk) { row[kk] = payload[kk]; });
    if (sup && !sup.is_produksi_sendiri && val !== 'produksi') await _produkSinkronSupplier([{ sup: sup, sis: val, juga: tgt.juga, lock: false }]);   // flag supplier ikut (Channel › Supplier & ROP)
    produkMarkDirty();
    renderProduk(_produkData);
    produkSistemSheetOpen(row.id);   // sheet tetap terbuka: Dropship dan P.O bisa dinyalakan berurutan
  } catch (e) {
    var msg = (e && e.message) || String(e);
    alert('Gagal simpan sistem: ' + msg + (/dropship_mulai/i.test(msg) ? '\n\nKolom belum ada — jalankan zenoot-padanan-dropship.sql di Supabase dulu.' : '') + (/dropship_juga/i.test(msg) ? '\n\nKolom belum ada — jalankan zenoot-sistem-bersamaan.sql di Supabase dulu.' : ''));
  }
}

function renderProduk(data) {
  const tbody = document.getElementById('produk-tbody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">' + (_produkLihatArsip ? 'Arsip kosong' : 'Belum ada data produk') + '</td></tr>';
    ['pstat-katalog', 'pstat-varian', 'pstat-nohpp'].forEach(function(i) { var e = document.getElementById(i); if (e) e.textContent = '0'; });
    var eh = document.getElementById('pstat-hpp'); if (eh) eh.textContent = 'Rp0';
    return;
  }

  // Update stat cards
  var noHpp = data.filter(r => !r.hpp || r.hpp === 0).length;
  var avgHpp = data.length ? Math.round(data.reduce((s,r) => s + (r.hpp||0), 0) / data.length) : 0;
  var groups2 = {};
  data.forEach(r => { var k = r.katalog||'—'; if (!groups2[k]) groups2[k]=[]; groups2[k].push(r); });
  var el;
  el = document.getElementById('pstat-katalog'); if(el) el.textContent = Object.keys(groups2).length;
  el = document.getElementById('pstat-varian');  if(el) el.textContent = data.length;
  el = document.getElementById('pstat-hpp');     if(el) el.textContent = 'Rp' + avgHpp.toLocaleString('id-ID');
  el = document.getElementById('pstat-nohpp');   if(el) el.textContent = noHpp;

  // Group by katalog
  const groups = groups2;
  let html = '';
  Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])).forEach(([kat, rows]) => {
    const expanded   = _produkExpanded[kat] === true;
    const hpp        = rows[0] ? rows[0].hpp || 0 : 0;
    // [30 Sep 2026] varian dalam 1 katalog bisa beda HPP (mis. sebagian sudah Produksi Sendiri) → tampil rentang min–maks
    const _hv        = rows.map(r => r.hpp || 0);
    const _hMin      = Math.min.apply(null, _hv), _hMax = Math.max.apply(null, _hv);
    const hppTxt     = !_hMax ? '—' : (_hMin === _hMax ? 'Rp' + _hMax.toLocaleString('id-ID') : 'Rp' + _hMin.toLocaleString('id-ID') + '–' + _hMax.toLocaleString('id-ID'));
    const boss       = rows[0] ? rows[0].boss || '—' : '—';
    const allSelected = rows.every(r => _produkSelected[r.id]);
    const safeKat    = kat.replace(/'/g, "'");

    // Header katalog — 2 baris: nama bold + varian abu di bawah
    const katCell = `<div style="line-height:1.2">
      <div style="font-size:14px;font-weight:700">${kat}</div>
      <div style="font-size:11px;color:var(--ink3);margin-top:2px">${rows.length} varian</div>
    </div>`;
    const hppCell = `<div style="line-height:1.2">
      ${_produkHppKatalogHtml(rows, hppTxt)}
      <div style="font-size:10px;color:var(--ink3);margin-top:2px">HPP</div>
    </div>`;
    // [30 Sep 2026] badge DROPSHIP/DS yang mengambang di kolom Boss dihapus → diganti kolom "Sistem" sendiri
    const bossCell = `<div style="line-height:1.2">
      <div style="font-size:14px;font-weight:600">${boss}</div>
      <div style="font-size:10px;color:var(--ink3);margin-top:2px">Supplier${_produkCadKatalogSub(rows) ? ' · ' + _produkCadKatalogSub(rows) : ''}</div>
    </div>`;
    const sistemCellKat = _produkSistemKatalogCell(rows);

    if (_produkEditMode) {
      html += `<tr style="background:var(--cream2);cursor:pointer">
        <td style="text-align:center;padding:8px 4px;vertical-align:middle">
          <input type="checkbox" ${allSelected ? 'checked' : ''} onclick="event.stopPropagation();produkToggleKatalog('${safeKat}',this.checked)" style="cursor:pointer">
        </td>
        <td onclick="produkToggleExpand('${safeKat}')" style="padding:10px 8px">${katCell}</td>
        <td style="padding:10px 8px">${hppCell}</td>
        <td style="padding:10px 8px">${bossCell}</td>
        <td style="padding:10px 8px;vertical-align:middle">${sistemCellKat}</td>
      </tr>`;
    } else {
      html += `<tr style="background:var(--cream2);cursor:pointer" onclick="produkToggleExpand('${safeKat}')">
        <td style="padding:10px 8px">${katCell}</td>
        <td style="padding:10px 8px">${hppCell}</td>
        <td style="padding:10px 8px">${bossCell}</td>
        <td style="padding:10px 8px;vertical-align:middle">${sistemCellKat}</td>
      </tr>`;
    }

    // Baris varian (hanya tampil jika expanded)
    if (expanded) {
      _produkSortWarnaSize(rows).forEach(row => {
        const checked = _produkSelected[row.id] ? 'checked' : '';
        if (_produkEditMode) {
          html += `<tr data-kat="${kat}" style="background:var(--cream)">
            <td style="text-align:center;padding:6px 4px">
              <input type="checkbox" ${checked} data-id="${row.id}" onchange="produkToggleSelect(${row.id},this.checked)" style="cursor:pointer">
            </td>
            <td style="padding-left:24px"><b>${row.sku_variasi}</b></td>
            <td>${_produkHppVarianHtml(row)}</td>
            <td>${_produkBossHtml(row)}</td>
            <td>${_produkSistemBtn(row)}</td>
          </tr>`;
        } else {
          html += `<tr data-kat="${kat}" style="background:var(--cream)">
            <td style="padding-left:24px">
              <b>${row.sku_variasi}</b>
            </td>
            <td>${_produkHppVarianHtml(row)}</td>
            <td>${_produkBossHtml(row)}</td>
            <td>${_produkSistemBtn(row)}</td>
          </tr>`;
        }
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


function produkUpdateSelectBar() {
  const count = Object.keys(_produkSelected).length;
  const lbl   = document.getElementById('produk-select-count');
  if (lbl) lbl.textContent = count + ' dipilih';
  ['produk-btn-hapus','produk-btn-hpp','produk-btn-sis','produk-btn-sup','produk-btn-exp','produk-btn-arsipkan','produk-btn-pulihkan'].forEach(function(id) {
    var b = document.getElementById(id);
    if (!b) return;
    b.disabled     = count === 0;
    b.style.opacity = count === 0 ? '.4' : '1';
  });
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
      produkMarkDirty();
      loadProduk();
    } catch(err) { produkMarkDirty(); alert('Gagal hapus: ' + err.message); }
  });
}

// Edit per katalog (update semua varian)
// [30 Sep 2026] Peta supplier (NAMA → baris hutang_supplier) dari daftar yang sudah dimuat, format sama dgn zDsLoadSuppliers()
function _produkSupMap() {
  var m = {};
  (_produkSupplierList || []).forEach(function(s) { var k = String(s.nama || '').trim().toUpperCase(); if (k) m[k] = s; });
  return m;
}

// Supplier terpilih di modal Edit Katalog berjenis Dropship + Reseller (mis. RH)? Hanya itu yang butuh penanda per katalog.
function _produkKatBossDual() {
  var b = String(document.getElementById('kat-boss').value || '').trim().toUpperCase();
  var s = _produkSupMap()[b];
  return !!(s && s.is_dropship && s.is_reseller && !s.is_produksi_sendiri);
}

// Edit SKU: supplier 2 sistem → 2 harga menggantikan satu kolom HPP
function produkPrdSyncDual() {
  var b = document.getElementById('prd-boss');
  var dual = !!_produkSupDualByName(b ? b.value : '');
  var dr = document.getElementById('prd-dual-row'), hg = document.getElementById('prd-hpp-grp');
  if (dr) dr.style.display = dual ? 'flex' : 'none';
  if (hg) hg.style.display = dual ? 'none' : '';
}

function produkKatSyncDs() {
  var row = document.getElementById('kat-ds-row');
  var dual = _produkKatBossDual();
  if (row) row.style.display = dual ? '' : 'none';
  // 3 Nov 2026: supplier 2 sistem → 2 harga (P.O & Dropship) menggantikan satu kolom HPP
  var dr = document.getElementById('kat-dual-row'), hg = document.getElementById('kat-hpp-grp');
  if (dr) dr.style.display = dual ? 'flex' : 'none';
  if (hg) hg.style.display = dual ? 'none' : '';
}

var _katDsInit = false;   // keadaan awal checkbox Dropship saat modal dibuka — toggle baru dianggap "disentuh" kalau beda dari ini

async function editKatalog(kat, hpp, boss) {
  document.getElementById('kat-edit-nama').textContent = kat;
  idrSet('kat-hpp', hpp);
  document.getElementById('kat-boss').value = boss;
  var _rowsK = _produkData.filter(function(r) { return (r.katalog || '—') === kat; });
  var _dsChk = document.getElementById('kat-dropship');
  // 30 Okt 2026: status dropship dibaca dari sistem SKU yang berlaku (sistem_override), bukan lagi produk.dropship
  if (_dsChk) _dsChk.checked = _rowsK.length > 0 && _rowsK.every(function(r) { return _produkSistemOf(r) === 'dropship'; });
  _katDsInit = !!(_dsChk && _dsChk.checked);
  const lbl = document.getElementById('kat-boss-label');
  if (lbl) {
    if (boss) { lbl.textContent = boss; lbl.style.color = 'var(--ink)'; }
    else      { lbl.textContent = '— Pilih Supplier —'; lbl.style.color = 'var(--ink3)'; }
  }
  // 3 Nov 2026: isi harga P.O & Dropship dari Master Barang — nilai sama untuk semua varian → tampil; beragam → kosong (kosong = tidak diubah)
  var _pos = [], _dss = [];
  _rowsK.forEach(function(r) { var d = _produkHargaDualOf(r); if (d) { _pos.push(d.po); _dss.push(d.ds); } });
  var _uniq = function(a) { return a.length && a.every(function(x) { return x === a[0]; }) ? a[0] : 0; };
  idrInput('kat-harga-po'); idrInput('kat-harga-ds');
  idrSet('kat-harga-po', _uniq(_pos)); idrSet('kat-harga-ds', _uniq(_dss));
  produkKatSyncDs();
  showModal('modal-edit-katalog');
}

async function simpanEditKatalog() {
  var kat     = document.getElementById('kat-edit-nama').textContent;
  var hpp     = idrVal('kat-hpp');
  var boss    = document.getElementById('kat-boss').value.trim().toUpperCase();
  var rows    = _produkData.filter(r => (r.katalog||'—') === kat);
  if (!rows.length) { hideModal('modal-edit-katalog'); return; }
  // 30 Okt 2026: sistem tiap SKU ditulis eksplisit ke sistem_override.
  //  - Supplier dual (RH): toggle Dropship. Kalau toggle DISENTUH → semua varian katalog ikut toggle. Kalau tidak disentuh dan Boss tidak
  //    berubah → sistem per SKU tidak diubah (SKU yang sengaja beda tidak ikut tertimpa). Kalau Boss berubah ke dual dan toggle tidak
  //    disentuh → tiap SKU mempertahankan sistem lamanya (dropship/reseller), selain itu default Dropship.
  //  - Supplier lain: kalau Boss berubah, sistem SKU mengikuti supplier baru (mis. DIMI → Produksi Sendiri).
  var isDual   = _produkKatBossDual();
  var ckNow    = !!document.getElementById('kat-dropship').checked;
  var dsTouched = isDual && (ckNow !== _katDsInit);
  try {
    for (const r of rows) {
      var payloadK = { hpp: hpp, boss: boss };
      // 3 Nov 2026: supplier 2 sistem → HPP tiap SKU = harga sistemnya (setelah perubahan sistem di modal ini), bukan angka tunggal
      var _supDual = isDual ? _produkSupDualByName(boss) : null;
      var _poIn = _supDual ? idrVal('kat-harga-po') : 0, _dsIn = _supDual ? idrVal('kat-harga-ds') : 0;
      var bossBerubah = _produkBossBerubah(r.boss, boss);
      var sisBaru = null;
      if (isDual) {
        if (dsTouched) { sisBaru = ckNow ? 'dropship' : 'reseller'; payloadK.dropship = ckNow; }
        else if (bossBerubah) sisBaru = _produkSistemDefault(boss, _produkSistemPrefer(r));
      } else if (bossBerubah) {
        sisBaru = _produkSistemDefault(boss);
      }
      if (sisBaru) payloadK.sistem_override = sisBaru;
      if (_supDual) {
        var _dOld = _produkHargaDualOf(r);   // harga lama kalau SKU ini sudah di supplier 2 sistem yang sama
        var _poEf = _poIn || (_dOld && _dOld.sup.id === _supDual.id ? _dOld.po : 0), _dsEf = _dsIn || (_dOld && _dOld.sup.id === _supDual.id ? _dOld.ds : 0);
        payloadK.hpp = _produkHppDual(sisBaru || _produkSistemOf(r), _poEf, _dsEf, r.hpp);
      }
      _produkStampDropshipMulai(payloadK, r);
      await dbUpdate('produk', r.id, payloadK);
      if (bossBerubah) await _produkCadBersihkanUtama(r.id, boss);
      if (_supDual) await _produkUpsertHargaDual(r, _supDual, _poIn, _dsIn);
      // Cascade (7 Sep 2026): dulu bulk-edit di sini bypass total cascade
      // yang ada di simpanProduk() — kalau boss diganti massal lewat modal
      // ini, snapshot stok tetep basi/yatim. Sekarang ikut di-cascade juga,
      // pake helper yang sama (_produkCascadeRename). SKU & katalog gak
      // berubah di modal ini (cuma HPP/Boss), jadi cukup panggil dgn sku
      // lama=baru — cascade helper otomatis skip kalau gak ada yg berubah.
      try {
        const skuU = (r.sku_variasi || '').toUpperCase();
        await _produkCascadeRename(skuU, skuU, r.katalog, boss, r.katalog, r.boss);
      } catch (cascadeErr) {
        console.warn('Cascade gagal buat', r.sku_variasi, ':', cascadeErr.message);
      }
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
    (r.boss||'').toLowerCase().includes(q) ||
    ((_PRODUK_SISTEM_META[_produkSistemKey(r)] || {}).label || '').toLowerCase().includes(q)
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
  const lbl = document.getElementById('prd-boss-label');
  if (lbl) { lbl.textContent = '— Pilih Supplier —'; lbl.style.color = 'var(--ink3)'; }
  idrInput('prd-harga-po'); idrInput('prd-harga-ds');
  idrSet('prd-harga-po', 0); idrSet('prd-harga-ds', 0);
  produkPrdSyncDual();
  document.getElementById('prd-cad-row').style.display = '';   // cadangan hanya untuk SKU baru; SKU yang ada lewat sheet Sistem
  idrInput('prd-cad-ds'); idrInput('prd-cad-po');
  produkPrdCadKosongkan();
  showModal('modal-produk');
  document.getElementById('form-produk').scrollIntoView({behavior:'smooth'});
  sketchForm('form-produk');
}

// Cadangan di form Tambah SKU (opsional): pilih supplier → kolom harga Dropship / P.O muncul
function produkPrdCadSync() {
  var v = document.getElementById('prd-cad').value.trim();
  document.getElementById('prd-cad-harga').style.display = v ? 'flex' : 'none';
  document.getElementById('prd-cad-clear').style.display = v ? '' : 'none';
}
function produkPrdCadKosongkan() {
  document.getElementById('prd-cad').value = '';
  var lb = document.getElementById('prd-cad-label');
  if (lb) { lb.textContent = '— Tidak ada —'; lb.style.color = 'var(--ink3)'; }
  idrSet('prd-cad-ds', 0); idrSet('prd-cad-po', 0);
  produkPrdCadSync();
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
  const lbl = document.getElementById('prd-boss-label');
  if (lbl) {
    if (r.boss) { lbl.textContent = r.boss; lbl.style.color = 'var(--ink)'; }
    else        { lbl.textContent = '— Pilih Supplier —'; lbl.style.color = 'var(--ink3)'; }
  }
  idrInput('prd-harga-po'); idrInput('prd-harga-ds');
  var _dd = _produkHargaDualOf(r);
  idrSet('prd-harga-po', _dd ? _dd.po : 0); idrSet('prd-harga-ds', _dd ? _dd.ds : 0);
  produkPrdSyncDual();
  document.getElementById('prd-cad-row').style.display = 'none';
  showModal('modal-produk');
  sketchForm('form-produk');
  document.getElementById('form-produk').scrollIntoView({behavior:'smooth'});
}

// Cascade rename (7 Sep 2026) — root cause "Lainnya" di dashboard: dulu
// edit SKU/katalog/boss CUMA update tabel produk, histori penjualan &
// snapshot stok yang masih rujuk nama/boss LAMA jadi yatim (gak match lagi
// pas dashboard join by SKU) → nyasar ke bucket "Lainnya" walau sebenernya
// data aslinya ADA. Helper ini di-reuse di simpanProduk() (edit 1 SKU) DAN
// simpanEditKatalog() (edit massal 1 katalog) — biar dua-duanya sama-sama
// ke-cascade, bukan cuma yang edit-1-SKU doang.
async function _produkCascadeRename(oldSkuU, newSkuU, newKatalog, newBoss, oldKatalog, oldBoss) {
  const skuBerubah     = oldSkuU && oldSkuU !== newSkuU;
  const katalogBerubah = (oldKatalog || '') !== newKatalog;
  const bossBerubah    = (oldBoss    || '') !== newBoss;
  if (!skuBerubah && !katalogBerubah && !bossBerubah) return;

  // Histori penjualan cuma nyimpen field "sku" (bukan katalog/boss),
  // jadi cascade cuma perlu kalau SKU-nya sendiri yang berubah.
  if (skuBerubah) {
    await dbUpdateWhere('jurnal_penjualan', 'sku=eq.' + encodeURIComponent(oldSkuU), { sku: newSkuU });
  }
  // stok.js nyimpen snapshot sku_variasi+katalog+boss — cascade kalau
  // salah satu dari ketiganya berubah.
  await dbUpdateWhere('stok', 'sku_variasi=eq.' + encodeURIComponent(oldSkuU), {
    sku_variasi: newSkuU, katalog: newKatalog, boss: newBoss
  });
}

// Cegah SKU Variasi duplikat (22 Sep 2026) — dulu simpanProduk()/simpanPasteProduk() insert tanpa
// cek, SKU Variasi yang sama bisa kesimpen 2x jadi baris terpisah (kejadian nyata: paste ulang MGR_Reiko).
// Cocokin tanpa peduli besar-kecil huruf & spasi pinggir, sama kayak konvensi matching di Analisis (zProdukNorm).
function _produkSkuNorm(s) { return String(s == null ? '' : s).trim().toUpperCase(); }

async function simpanProduk() {
  const id = document.getElementById('prd-id').value;
  const data = {
    katalog:     document.getElementById('prd-katalog').value.trim().toUpperCase(),
    sku_variasi: document.getElementById('prd-sku').value.trim(),
    hpp:         idrVal('prd-hpp'),
    boss:        document.getElementById('prd-boss').value.trim().toUpperCase(),
  };
  if (!data.sku_variasi) { alert('SKU Variasi wajib diisi!'); return; }
  // 3 Nov 2026: supplier 2 sistem → 2 harga (P.O & Dropship); HPP SKU = harga sistemnya
  const supDual = _produkSupDualByName(data.boss);
  const poIn = supDual ? idrVal('prd-harga-po') : 0, dsIn = supDual ? idrVal('prd-harga-ds') : 0;
  // 17 Nov 2026: cadangan opsional hanya saat SKU baru
  const cadNama = id ? '' : document.getElementById('prd-cad').value.trim().toUpperCase();
  const cadSup = cadNama ? _produkSupMap()[cadNama] : null;
  if (cadNama && (!cadSup || cadSup.is_produksi_sendiri || cadNama === data.boss)) { alert('Supplier cadangan tidak valid (bukan Produksi Sendiri dan beda dari supplier utama).'); return; }
  const cadDs = cadSup ? idrVal('prd-cad-ds') : 0, cadPo = cadSup ? idrVal('prd-cad-po') : 0;

  const skuNormNew = _produkSkuNorm(data.sku_variasi);
  const dup = _produkAll.find(d => d.id != id && _produkSkuNorm(d.sku_variasi) === skuNormNew);
  if (dup) {
    alert(dup.arsip
      ? `SKU Variasi "${data.sku_variasi}" sudah ada di Arsip (katalog: ${dup.katalog}). Pulihkan dari menu Arsip, bukan bikin baru.`
      : `SKU Variasi "${data.sku_variasi}" sudah ada di Kelola Produk (katalog: ${dup.katalog}). Edit baris yang sudah ada, bukan bikin baru.`);
    return;
  }

  // [30 Sep 2026] Guard "total per katalog" dicabut — peralihan Produksi Sendiri boleh per varian.

  try {
    let old = null;
    if (id) old = _produkData.find(d => d.id == id);

    // 30 Okt 2026: sistem SKU selalu eksplisit. SKU baru → sistem awal dari supplier (RH = Dropship). Edit SKU → hanya kalau Boss berubah:
    // ikut sistem supplier baru (dual: pertahankan dropship/reseller lama). Supplier tidak terdaftar → tidak menulis apa-apa.
    if (id) {
      if (old && _produkBossBerubah(old.boss, data.boss)) {
        const sisBaru = _produkSistemDefault(data.boss, _produkSistemPrefer(old));
        if (sisBaru) data.sistem_override = sisBaru;
        _produkStampDropshipMulai(data, old);
      }
      if (supDual) {
        const dOld = old ? _produkHargaDualOf(old) : null;
        const poEf = poIn || (dOld && dOld.sup.id === supDual.id ? dOld.po : 0), dsEf = dsIn || (dOld && dOld.sup.id === supDual.id ? dOld.ds : 0);
        data.hpp = _produkHppDual(data.sistem_override || _produkSistemOf(old || {}), poEf, dsEf, old ? old.hpp : 0);
      }
      await dbUpdate('produk', id, data);
      if (old && _produkBossBerubah(old.boss, data.boss)) await _produkCadBersihkanUtama(old.id, data.boss);
      if (supDual) await _produkUpsertHargaDual({ id: old ? old.id : Number(id), katalog: data.katalog, sku_variasi: data.sku_variasi }, supDual, poIn, dsIn);
    } else {
      const sisAwal = _produkSistemDefault(data.boss);
      if (sisAwal) data.sistem_override = sisAwal;
      if (supDual) data.hpp = _produkHppDual(sisAwal, poIn, dsIn, 0);
      const insP = await dbInsert('produk', data);
      const rowP = Array.isArray(insP) ? insP[0] : insP;
      if (supDual && rowP && rowP.id != null) await _produkUpsertHargaDual({ id: rowP.id, katalog: data.katalog, sku_variasi: data.sku_variasi }, supDual, poIn, dsIn);
      if (cadSup && rowP && rowP.id != null) await _produkCadTambah({ id: rowP.id, katalog: data.katalog, sku_variasi: data.sku_variasi }, cadSup, cadDs, cadPo, null);
    }

    if (id && old) {
      try {
        await _produkCascadeRename(
          (old.sku_variasi || '').toUpperCase(), data.sku_variasi.toUpperCase(),
          data.katalog, data.boss, old.katalog, old.boss
        );
      } catch (cascadeErr) {
        // Produk-nya sendiri udah kesimpen; cascade gagal jangan nge-block
        // flow utama, cukup kasih tau biar user sadar histori mungkin
        // masih nyisa yang belum ke-sync.
        alert('SKU tersimpan, tapi gagal sync histori lama: ' + cascadeErr.message + '\nCoba edit ulang kalau masih ada data yang nyasar ke "Lainnya".');
      }
    }

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

// Salin header 2 baris (dipisah tab) → tempel di A1 spreadsheet, tiap kolom masuk 1 sel (merge sel grup Boss / Harga dilakukan sendiri di spreadsheet)
var _PK_PASTE_HEADER = [
  ['Boss', '', 'Katalog', 'SKU Variasi', 'HPP', 'HARGA', ''],
  ['UTAMA', 'CADANGAN', '', '', '', 'Harga P.O', 'Harga Dropship']
];
function salinKolomPasteProduk() {
  const teks = _PK_PASTE_HEADER.map(r => r.join('\t')).join('\n');
  const btn = document.getElementById('btn-salin-kolom-produk');
  const ok = () => { if (!btn) return; btn.innerHTML = '<i class="ti ti-check"></i> Tersalin'; setTimeout(() => { btn.innerHTML = '<i class="ti ti-copy"></i> Salin'; }, 1500); };
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = teks; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { alert('Gagal menyalin'); }
    document.body.removeChild(ta);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(teks).then(ok, fallback);
  else fallback();
}

let _parsedProduk = [];

function parsePasteProduk() {
  // 22 Nov 2026: urutan kolom BARU = Boss Utama → Boss Cadangan → Katalog → SKU Variasi → HPP → Harga P.O → Harga Dropship.
  // Hanya buang baris kosong di awal/akhir — JANGAN trim tab di depan (Boss utama kosong di baris pertama akan menggeser semua kolom).
  const raw = document.getElementById('paste-area-produk').value.replace(/^[\r\n]+/, '').replace(/\s+$/, '');
  if (!raw.trim()) { alert('Paste data dulu!'); return; }

  _parsedProduk = [];
  const lines = raw.split('\n');
  const supMap = _produkSupMap();
  const knownSupplier = {}; // supplier yg udah ada di hutang_supplier — buat deteksi "baru"
  Object.keys(supMap).forEach(k => { knownSupplier[k] = true; });

  // Cegah SKU Variasi duplikat (22 Sep 2026) — cek ke SKU yang udah ada di Kelola Produk SEKARANG (termasuk Arsip),
  // dan ke baris lain di batch paste yang sama. Case/spasi diabaikan.
  const existingSku = new Set((_produkAll || []).map(d => _produkSkuNorm(d.sku_variasi)));
  const seenInBatch = new Set();

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split('\t').map(c => c.trim());

    const bossRaw = cols[0] || '';
    const cadRaw  = cols[1] || '';
    const katalog = cols[2] || '';
    const sku     = cols[3] || '';

    // Baris header (1 atau 2 baris hasil salin dari spreadsheet) dilewati
    if (_produkSkuNorm(sku) === 'SKU VARIASI' || _produkSkuNorm(katalog) === 'KATALOG') continue;
    if (!sku) continue;

    const boss    = bossRaw.toUpperCase();
    const hpp     = parseInt((cols[4]||'').replace(/[^0-9]/g,'')) || 0;
    // Harga P.O & Harga Dropship per pcs, dipakai hanya kalau boss supplier 2 sistem
    const hargaPo = parseInt((cols[5]||'').replace(/[^0-9]/g,'')) || 0;
    const hargaDs = parseInt((cols[6]||'').replace(/[^0-9]/g,'')) || 0;
    // Boss yang belum ada ditandai "baru" lalu di-auto-create ke hutang_supplier saat simpan (7 Sep 2026)
    const bossIsNew = !!boss && !knownSupplier[boss];

    // Supplier cadangan (boleh lebih dari satu, dipisah koma / titik koma / garis miring). Harga cadangan diisi belakangan di Master Barang.
    // Cadangan TIDAK di-auto-create: harus supplier yang sudah terdaftar, bukan Produksi Sendiri, bukan sama dengan utama — kalau tidak, baris ditolak.
    const cadNames = [];
    cadRaw.split(/[,;\/]/).forEach(x => { const n = x.trim().toUpperCase(); if (n && cadNames.indexOf(n) < 0) cadNames.push(n); });
    const cadSups = [];
    let cadErr = '';
    for (const n of cadNames) {
      const cs = supMap[n];
      if (!cs) { cadErr = 'cadangan "' + n + '" belum terdaftar'; break; }
      if (!boss) { cadErr = 'cadangan butuh Boss utama'; break; }
      if (n === boss) { cadErr = 'cadangan sama dengan utama'; break; }
      if (cs.is_produksi_sendiri) { cadErr = 'cadangan "' + n + '" Produksi Sendiri'; break; }
      cadSups.push(cs);
    }

    const skuNorm = _produkSkuNorm(sku);
    const isDup = existingSku.has(skuNorm) || seenInBatch.has(skuNorm);
    seenInBatch.add(skuNorm);

    // Supplier 2 sistem: HPP = harga sistem awal SKU (Dropship, default supplier 2 sistem). Harga yang tidak diisi diturunkan dari kolom HPP untuk sistem awal itu.
    const dualSup = (boss && !bossIsNew) ? _produkSupDualByName(boss) : null;
    let po = 0, ds = 0, hppEf = hpp;
    if (dualSup) {
      const sisAwal = _produkSistemDefault(boss);
      po = hargaPo || (sisAwal !== 'dropship' ? hpp : 0);
      ds = hargaDs || (sisAwal === 'dropship' ? hpp : 0);
      hppEf = _produkHppDual(sisAwal, po, ds, hpp);
    }
    _parsedProduk.push({ katalog: katalog.toUpperCase(), sku_variasi: sku, hpp: hppEf, boss, bossIsNew, isDup, cadNames, cadSups, cadErr, blok: isDup || !!cadErr, dual: !!dualSup, po, ds });
  }

  if (_parsedProduk.length === 0) {
    alert('Tidak ada data yang bisa dibaca. Pastikan copy dari spreadsheet dengan urutan: Boss Utama → Boss Cadangan → Katalog → SKU Variasi → HPP → Harga P.O → Harga Dropship');
    return;
  }

  // Preview — baris yang ditolak ditampilkan (biar kelihatan mana yang di-skip) tapi tidak ikut disimpan
  const dupCount = _parsedProduk.filter(r => r.isDup).length;
  const errCount = _parsedProduk.filter(r => !r.isDup && r.cadErr).length;
  const blokCount = _parsedProduk.filter(r => r.blok).length;
  const newBossCount = _parsedProduk.filter(r => r.bossIsNew && !r.blok).length;
  document.getElementById('paste-produk-count').innerHTML =
    `✓ ${_parsedProduk.length - blokCount} SKU siap diimport` +
    (dupCount ? ` — <span style="color:var(--danger)">${dupCount} dilewati (SKU Variasi sudah ada)</span>` : '') +
    (errCount ? ` — <span style="color:var(--danger)">${errCount} ditolak (supplier cadangan bermasalah, lihat kolom Status)</span>` : '') +
    (newBossCount ? ` — <span style="color:var(--warn)">${newBossCount} pakai supplier baru, bakal otomatis ditambahin ke Kelola Supplier (mode Dropship, bisa diedit nanti)</span>` : '');
  document.getElementById('paste-produk-tbody').innerHTML = _parsedProduk.map(r => `
    <tr${r.blok ? ' style="opacity:.5"' : ''}>
      <td>${r.boss||'—'}${r.bossIsNew ? ' <span style="font-size:10px;color:var(--warn);border:1px solid var(--warn);border-radius:4px;padding:1px 4px">baru</span>' : ''}</td>
      <td style="font-size:12px">${r.cadNames.length ? r.cadNames.join(', ') : '—'}</td>
      <td>${r.katalog}</td>
      <td>${r.sku_variasi}</td>
      <td>Rp${r.hpp.toLocaleString('id-ID')}</td>
      <td style="font-size:12px">${r.dual ? ('P.O ' + (r.po ? 'Rp' + r.po.toLocaleString('id-ID') : '—') + '<br>DS ' + (r.ds ? 'Rp' + r.ds.toLocaleString('id-ID') : '—')) : '—'}</td>
      <td>${r.isDup ? '<span style="font-size:11px;color:var(--danger)">duplikat</span>' : (r.cadErr ? '<span style="font-size:11px;color:var(--danger)">' + r.cadErr + '</span>' : '<span style="font-size:11px;color:var(--ok)">✓ lolos</span>')}</td>
    </tr>`).join('');
  document.getElementById('paste-produk-preview').style.display = 'block';
  document.getElementById('btn-simpan-paste-produk').style.display = (blokCount < _parsedProduk.length) ? 'inline-block' : 'none';
}

async function simpanPasteProduk() {
  if (_parsedProduk.length === 0) return;
  const btn = document.getElementById('btn-simpan-paste-produk');
  btn.textContent = 'Menyimpan...';
  btn.disabled = true;

  try {
    // Auto-create supplier baru dulu (7 Sep 2026) — biar boss yg dipaste
    // dijamin ada di hutang_supplier begitu produk-nya kesimpen, gak
    // nyimpang diam-diam kayak sebelumnya. Default Dropship (paling aman
    // buat supplier yg belum dikenal) — user tinggal ubah ke Reseller
    // nanti dari Kelola Supplier kalau perlu.
    // Baris duplikat (isDup) di-skip total — udah ditandain "duplikat" di preview, gak ikut disimpan
    // maupun ikut nge-trigger auto-create supplier baru.
    const rowsToSave = _parsedProduk.filter(r => !r.blok);
    const newBossNames = [...new Set(rowsToSave.filter(r => r.bossIsNew).map(r => r.boss))];
    for (const nama of newBossNames) {
      const created = await dbInsert('hutang_supplier', { nama, is_dropship: true, is_reseller: false });
      const row = Array.isArray(created) ? created[0] : created;
      if (row) _produkSupplierList.push(row);
    }

    // Insert satu per satu (Supabase REST tidak support bulk insert via anon key easily)
    let ok = 0;
    for (const row of rowsToSave) {
      const payloadP = { katalog: row.katalog, sku_variasi: row.sku_variasi, hpp: row.hpp, boss: row.boss };
      const sisAwalP = _produkSistemDefault(row.boss);   // 30 Okt 2026: sistem awal dari supplier (supplier baru hasil auto-create = Dropship)
      if (sisAwalP) payloadP.sistem_override = sisAwalP;
      const insPP = await dbInsert('produk', payloadP);
      const rowPP = Array.isArray(insPP) ? insPP[0] : insPP;
      const refPP = (rowPP && rowPP.id != null) ? { id: rowPP.id, katalog: row.katalog, sku_variasi: row.sku_variasi } : null;
      if (row.dual && refPP) {   // 2 harga supplier 2 sistem → Master Barang
        const supPP = _produkSupDualByName(row.boss);
        if (supPP) await _produkUpsertHargaDual(refPP, supPP, row.po, row.ds);
      }
      if (refPP) {   // supplier cadangan (sistem awal ikut flag supplier, harga cadangan diisi belakangan)
        for (const cs of row.cadSups) await _produkCadTambah(refPP, cs, 0, 0, null);
      }
      ok++;
      btn.textContent = `Menyimpan ${ok}/${rowsToSave.length}...`;
    }
    closeModal('modal-paste-produk');
    loadProduk();
    const dupSkipped = _parsedProduk.filter(r => r.isDup).length;
    const cadSkipped = _parsedProduk.filter(r => !r.isDup && r.cadErr).length;
    alert(`✓ ${ok} SKU berhasil disimpan!` +
      (dupSkipped ? `\n⚠ ${dupSkipped} SKU dilewati karena sudah ada di Kelola Produk` : '') +
      (cadSkipped ? `\n⚠ ${cadSkipped} SKU ditolak karena supplier cadangan bermasalah` : '') +
      (newBossNames.length ? `\n✓ ${newBossNames.length} supplier baru ditambahin ke Kelola Supplier (mode Dropship): ${newBossNames.join(', ')}` : ''));
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
    ['Boss Utama','Boss Cadangan','Katalog','SKU Variasi','HPP','Harga P.O','Harga Dropship'],
    _produkData.map(r => { const d = _produkHargaDualOf(r); return [r.boss, _produkCadRows(r).map(c => c.sup.nama).join(', '), r.katalog, r.sku_variasi, r.hpp, d ? d.po : '', d ? d.ds : '']; })
  );
}

// ── BATCH: Export terpilih ────────────────────────────────────
function produkExportTerpilih() {
  const ids = Object.keys(_produkSelected).map(Number);
  if (!ids.length) return;
  const rows = _produkData.filter(r => ids.includes(r.id));
  exportCSV('zenoot-produk-terpilih.csv',
    ['Boss Utama','Boss Cadangan','Katalog','SKU Variasi','HPP','Harga P.O','Harga Dropship'],
    rows.map(r => { const d = _produkHargaDualOf(r); return [r.boss, _produkCadRows(r).map(c => c.sup.nama).join(', '), r.katalog, r.sku_variasi, r.hpp, d ? d.po : '', d ? d.ds : '']; })
  );
}

// ── BATCH: Edit HPP massal — per varian (12 Nov 2026) ─────────
// Modal menampilkan SEMUA varian terpilih, tiap baris: toggle Sistem (Dropship | P.O | Produksi), Harga P.O, Harga Dropship, HPP.
// Harga P.O / Dropship disimpan di Master Barang supplier SKU itu (hutang_barang) lewat _produkUpsertHargaDual — sumber yang sama dengan
// Hutang Barang / Re-Stock / bon. Sistem ke produk.sistem_override. HPP produk = harga sistem aktifnya (Produksi / tanpa supplier terdaftar = HPP diisi langsung).
// Sinkron ke Channel > Supplier & ROP: supplier yang SKU-nya dipilih Dropship / P.O otomatis menyalakan jenis itu (hutang_supplier.is_dropship / is_reseller),
// karena Re-Stock, form Master Barang dan bon membaca flag supplier. Supplier Produksi Sendiri bersifat eksklusif → baris SKU-nya terkunci di Produksi.
var _bhRows = [];
var _BH_SIS = [
  { k: 'dropship', l: 'Dropship', c: 'var(--warn)' },
  { k: 'reseller', l: 'P.O',      c: 'var(--info)' },
  { k: 'produksi', l: 'Produksi', c: 'var(--ok)'   }
];

(function() {
  if (document.getElementById('pk-bh-style')) return;
  var st = document.createElement('style');
  st.id = 'pk-bh-style';
  st.textContent = [
    '#modal-batch-hpp .modal{max-width:880px;width:100%}',
    '#bh-list{max-height:56vh;overflow:auto;border:1px solid var(--ovl-0_18);border-radius:8px}',
    '.bh-head,.bh-row,.bh-all{display:grid;grid-template-columns:minmax(150px,1.5fr) 218px minmax(96px,1fr) minmax(96px,1fr) minmax(96px,1fr);gap:10px;align-items:center;padding:8px 12px}',
    '.bh-head{position:sticky;top:0;z-index:2;background:var(--cream2);font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--ovl-0_18)}',
    '.bh-kat{padding:7px 12px;background:var(--cream2);font-size:12px;font-weight:700;color:var(--ink);border-top:1px solid var(--ovl-0_18)}',
    '.bh-kat span{font-weight:500;color:var(--ink3);margin-left:6px}',
    '.bh-row{border-top:1px solid var(--ovl-0_06)}',
    '.bh-sku{font-size:13px;font-weight:700;color:var(--ink);word-break:break-all}',
    '.bh-sup{font-size:10.5px;color:var(--ink3);margin-top:1px}',
    '.bh-seg{display:inline-flex;border:1.5px solid var(--ink);border-radius:999px;overflow:hidden;background:var(--cream)}',
    '.bh-seg button{font-family:var(--f);font-size:12px;font-weight:700;padding:5px 11px;border:none;background:transparent;color:var(--ink3);cursor:pointer;white-space:nowrap}',
    '.bh-seg button+button{border-left:1.5px solid var(--ink)}',
    '.bh-seg button.on{color:#fff}',
    '.bh-seg button:disabled{opacity:.35;cursor:not-allowed}',
    '.bh-in{font-family:var(--f);font-size:14px;padding:6px 8px;border:2px solid var(--ink);background:var(--cream);color:var(--ink);width:100%;box-sizing:border-box}',
    '.bh-in:disabled{opacity:.45;background:var(--cream2);border-style:dashed}',
    '.bh-in::placeholder{color:var(--ink3)}',
    '.bh-hpp{font-size:13px;font-weight:700;color:var(--ink);text-align:right}',
    '.bh-all{background:var(--cream2);border:1px dashed var(--ink3);border-radius:8px;margin-bottom:10px}',
    '.bh-note{font-size:11.5px;color:var(--ink3);line-height:1.5;margin-top:10px}',
    '.bh-note b{color:var(--ink)}',
    '.bh-lbl{display:none;font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;margin-bottom:2px}',
    '@media (max-width:760px){',
    '  .bh-head{display:none}',
    '  .bh-row,.bh-all{grid-template-columns:1fr 1fr;gap:8px}',
    '  .bh-row>:first-child,.bh-all>:first-child,.bh-row .bh-seg-wrap,.bh-all .bh-seg-wrap{grid-column:1/-1}',
    '  .bh-lbl{display:block}',
    '  .bh-hpp{text-align:left}',
    '}'
  ].join('\n');
  document.head.appendChild(st);
})();

function _bhSupOf(row) { return _produkSupMap()[String(row.boss || '').trim().toUpperCase()] || null; }

function produkBatchHpp() {
  var ids = Object.keys(_produkSelected).map(Number);
  if (!ids.length) return;
  var rows = _produkData.filter(function(r) { return ids.indexOf(r.id) >= 0; });
  var byKat = {};
  rows.forEach(function(r) { var k = r.katalog || '—'; (byKat[k] = byKat[k] || []).push(r); });
  _bhRows = [];
  Object.keys(byKat).sort(function(a, b) { return a.localeCompare(b); }).forEach(function(k) {
    _produkSortWarnaSize(byKat[k]).forEach(function(r) {
      var sup = _bhSupOf(r);
      var priced = !!(sup && !sup.is_produksi_sendiri);   // harga P.O / Dropship hanya untuk supplier terdaftar yang bukan Produksi Sendiri
      var sis = _produkSistemOf(r) || (priced ? (sup.is_reseller && !sup.is_dropship ? 'reseller' : 'dropship') : 'produksi');
      var po = 0, ds = 0, hpp = Number(r.hpp) || 0;
      if (priced) {
        var b = (_produkHbList || []).find(function(x) { return x.produk_id === r.id && x.supplier_id === sup.id; });
        po = b && Number(b.harga_po_per_lusin) > 0 ? Math.round(Number(b.harga_po_per_lusin) / 12) : 0;
        ds = b && Number(b.harga_per_lusin) > 0 ? Math.round(Number(b.harga_per_lusin) / 12) : 0;
        // HPP lama yang belum punya harga di Master Barang = harga sistem aktifnya (angka lama tidak hilang)
        if (sis === 'dropship') { if (!ds) ds = hpp; } else if (sis === 'reseller') { if (!po) po = hpp; }
      }
      _bhRows.push({ row: r, kat: k, sup: sup, priced: priced, lockProd: !!(sup && sup.is_produksi_sendiri), sis: sis, po: po, ds: ds, hpp: hpp, o: { sis: sis, po: po, ds: ds, hpp: hpp } });
    });
  });
  document.getElementById('batch-hpp-count').textContent = _bhRows.length + ' SKU terpilih · ' + Object.keys(byKat).length + ' katalog';
  _bhRenderAll();
  showModal('modal-batch-hpp');
}

function _bhSegHtml(prefix, cur, lockProd) {
  return '<div class="bh-seg">' + _BH_SIS.map(function(o) {
    var dis = lockProd && o.k !== 'produksi' && cur !== o.k;
    return '<button type="button" id="' + prefix + '-' + o.k + '" ' + (dis ? 'disabled title="Supplier Produksi Sendiri tidak bisa Dropship / P.O — ganti supplier lewat Edit Supplier"' : '')
      + ' class="' + (cur === o.k ? 'on' : '') + '" style="' + (cur === o.k ? 'background:' + o.c : '') + '" onclick="' + (prefix === 'bh-all-sis' ? 'produkBhAllSis' : 'produkBhSis') + '(' + (prefix === 'bh-all-sis' ? '' : _bhIdxOfPrefix(prefix) + ',') + '\'' + o.k + '\')">' + o.l + '</button>';
  }).join('') + '</div>';
}
function _bhIdxOfPrefix(p) { return p.replace('bh-sis-', ''); }

function _bhRenderAll() {
  var h = '<div class="bh-head"><div>Katalog / SKU</div><div>Sistem</div><div>Harga P.O (Rp/pcs)</div><div>Harga Dropship (Rp/pcs)</div><div style="text-align:right">HPP</div></div>';
  var lastKat = null;
  _bhRows.forEach(function(x, i) {
    if (x.kat !== lastKat) {
      lastKat = x.kat;
      var n = _bhRows.filter(function(y) { return y.kat === x.kat; }).length;
      h += '<div class="bh-kat">' + _pkEsc(x.kat) + '<span>' + n + ' varian</span></div>';
    }
    h += '<div class="bh-row">'
      + '<div><div class="bh-sku">' + _pkEsc(x.row.sku_variasi) + '</div><div class="bh-sup">Supplier: ' + _pkEsc(x.row.boss || '—') + '</div></div>'
      + '<div class="bh-seg-wrap" id="bh-seg-' + i + '">' + _bhSegHtml('bh-sis-' + i, x.sis, x.lockProd) + '</div>'
      + '<div><div class="bh-lbl">Harga P.O</div><input type="text" inputmode="numeric" id="bh-po-' + i + '" class="bh-in" placeholder="—" oninput="_bhRefresh()"></div>'
      + '<div><div class="bh-lbl">Harga Dropship</div><input type="text" inputmode="numeric" id="bh-ds-' + i + '" class="bh-in" placeholder="—" oninput="_bhRefresh()"></div>'
      + '<div><div class="bh-lbl">HPP</div><div id="bh-hppcell-' + i + '"></div></div>'
      + '</div>';
  });
  document.getElementById('bh-list').innerHTML = h;
  _bhRows.forEach(function(x, i) {
    idrInput('bh-po-' + i); idrInput('bh-ds-' + i);
    idrSet('bh-po-' + i, x.po); idrSet('bh-ds-' + i, x.ds);
  });
  // baris "Isi sekaligus"
  document.getElementById('bh-all').innerHTML = '<div><div class="bh-sku" style="font-size:12px">Isi sekaligus</div><div class="bh-sup">Kosong = tidak diubah</div></div>'
    + '<div class="bh-seg-wrap" id="bh-all-seg">' + _bhSegHtml('bh-all-sis', '', false) + '</div>'
    + '<div><div class="bh-lbl">Harga P.O</div><input type="text" inputmode="numeric" id="bh-all-po" class="bh-in" placeholder="Contoh: 69000"></div>'
    + '<div><div class="bh-lbl">Harga Dropship</div><input type="text" inputmode="numeric" id="bh-all-ds" class="bh-in" placeholder="Contoh: 72000"></div>'
    + '<div><div class="bh-lbl">HPP (Produksi)</div><input type="text" inputmode="numeric" id="bh-all-hpp" class="bh-in" placeholder="Contoh: 45000"></div>';
  idrInput('bh-all-po'); idrInput('bh-all-ds'); idrInput('bh-all-hpp');
  _bhRefresh();
}

// Sinkronkan tampilan tiap baris dengan sistemnya: input harga aktif/nonaktif + sel HPP (hasil harga sistem aktif, atau input langsung untuk Produksi / tanpa supplier)
function _bhRefresh() {
  _bhRows.forEach(function(x, i) {
    x.po = idrVal('bh-po-' + i); x.ds = idrVal('bh-ds-' + i);
    var cell = document.getElementById('bh-hppcell-' + i);
    var poEl = document.getElementById('bh-po-' + i), dsEl = document.getElementById('bh-ds-' + i);
    var hargaAktif = x.priced && x.sis !== 'produksi';
    if (poEl) poEl.disabled = !x.priced; if (dsEl) dsEl.disabled = !x.priced;
    if (!cell) return;
    if (hargaAktif) {
      var v = x.sis === 'dropship' ? x.ds : x.po;
      var kosong = !(v > 0);
      if (kosong) v = x.o.hpp;   // harga sistem aktif kosong → HPP lama dipertahankan
      x.hppEf = v;
      cell.innerHTML = '<div class="bh-hpp"' + (kosong ? ' style="color:var(--warn)"' : '') + '>' + _produkRp(v)
        + (kosong ? '<div style="font-size:10px;font-weight:600">harga ' + (x.sis === 'dropship' ? 'Dropship' : 'P.O') + ' kosong</div>' : '') + '</div>';
    } else {
      var el = document.getElementById('bh-hpp-' + i);
      var cur = el ? idrVal('bh-hpp-' + i) : x.hpp;
      if (!el) {
        cell.innerHTML = '<input type="text" inputmode="numeric" id="bh-hpp-' + i + '" class="bh-in" placeholder="HPP" oninput="_bhRefresh()">';
        idrInput('bh-hpp-' + i); idrSet('bh-hpp-' + i, cur);
      }
      x.hpp = idrVal('bh-hpp-' + i);
      x.hppEf = x.hpp;
    }
  });
  // Catatan sinkron ke Supplier & ROP
  var notes = _produkSinkronCatatan(_bhRows.map(function(x) { return { sup: x.sup, sis: x.sis, lock: x.lockProd }; }));
  var nt = document.getElementById('bh-note');
  if (nt) nt.innerHTML = 'HPP tiap SKU otomatis = harga sistemnya. Harga yang dikosongkan tidak diubah.'
    + (notes.length ? '<br><i class="ti ti-refresh"></i> Sinkron ke Channel › Supplier &amp; ROP: ' + notes.join(' · ') + ' akan diaktifkan.' : '');
}

function produkBhSis(i, k) {
  var x = _bhRows[i];
  if (!x) return;
  if (x.lockProd && k !== 'produksi' && x.sis !== k) return;
  x.po = idrVal('bh-po-' + i); x.ds = idrVal('bh-ds-' + i);
  var elH = document.getElementById('bh-hpp-' + i);
  if (elH) x.hpp = idrVal('bh-hpp-' + i);
  x.sis = k;
  document.getElementById('bh-seg-' + i).innerHTML = _bhSegHtml('bh-sis-' + i, x.sis, x.lockProd);
  // pindah antara mode harga ⇄ HPP langsung: buang input HPP lama supaya sel dibangun ulang sesuai mode baru
  var cell = document.getElementById('bh-hppcell-' + i);
  if (cell) cell.innerHTML = '';
  if (x.sis === 'produksi' || !x.priced) x.hpp = x.hpp || x.o.hpp;
  _bhRefresh();
}

function produkBhAllSis(k) {
  _bhRows.forEach(function(x, i) {
    if (x.lockProd && k !== 'produksi') return;
    produkBhSis(i, k);
  });
  var seg = document.getElementById('bh-all-seg');
  if (seg) seg.innerHTML = _bhSegHtml('bh-all-sis', k, false);
}

function produkBhTerapkanSemua() {
  var po = idrVal('bh-all-po'), ds = idrVal('bh-all-ds'), hp = idrVal('bh-all-hpp');
  _bhRows.forEach(function(x, i) {
    if (x.priced) { if (po) idrSet('bh-po-' + i, po); if (ds) idrSet('bh-ds-' + i, ds); }
  });
  _bhRefresh();
  if (hp) {
    _bhRows.forEach(function(x, i) { var el = document.getElementById('bh-hpp-' + i); if (el) idrSet('bh-hpp-' + i, hp); });
    _bhRefresh();
  }
}

async function simpanBatchHpp() {
  _bhRefresh();
  // 1) Validasi SEMUA baris dulu — tidak ada yang tersimpan kalau ada yang bermasalah
  var masalah = [];
  _bhRows.forEach(function(x) { if (!(x.hppEf > 0)) masalah.push(x.row.sku_variasi); });
  if (masalah.length) {
    alert('HPP masih kosong untuk ' + masalah.length + ' SKU:\n' + masalah.slice(0, 8).join('\n') + (masalah.length > 8 ? '\n…' : '') + '\n\nIsi harga sistemnya (atau HPP untuk Produksi) dulu.');
    return;
  }
  var btn = document.getElementById('bh-btn-simpan');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  try {
    var ubah = 0;
    for (var i = 0; i < _bhRows.length; i++) {
      var x = _bhRows[i], r = x.row;
      var hargaAktif = x.priced && x.sis !== 'produksi';
      var poBaru = x.priced && x.po !== x.o.po ? x.po : 0, dsBaru = x.priced && x.ds !== x.o.ds ? x.ds : 0;
      var sisBeda = x.sis !== x.o.sis, hppBeda = x.hppEf !== (Number(r.hpp) || 0);
      if (!sisBeda && !hppBeda && !poBaru && !dsBaru) continue;
      if (x.priced) {
        // baris yang memang diubah: harga yang tampil tapi belum ada di Master Barang (berasal dari HPP lama) ikut dicatat ke sana
        var hb0 = (_produkHbList || []).find(function(h) { return h.produk_id === r.id && h.supplier_id === x.sup.id; });
        if (!poBaru && x.po > 0 && !(hb0 && Number(hb0.harga_po_per_lusin) > 0)) poBaru = x.po;
        if (!dsBaru && x.ds > 0 && !(hb0 && Number(hb0.harga_per_lusin) > 0)) dsBaru = x.ds;
      }
      var payload = { hpp: x.hppEf };
      if (sisBeda || r.sistem_override !== x.sis) {
        payload.sistem_override = x.sis;
        if (x.sup && _produkSupDualByName(r.boss)) payload.dropship = (x.sis === 'dropship');   // kompatibilitas kolom lama, sama seperti Edit Supplier
        _produkStampDropshipMulai(payload, r);
      }
      await dbUpdate('produk', r.id, payload);
      Object.keys(payload).forEach(function(k) { r[k] = payload[k]; });
      if (x.priced && (poBaru || dsBaru)) await _produkUpsertHargaDual(r, x.sup, poBaru, dsBaru);
      ubah++;
    }
    // 2) Sinkron ke Supplier & ROP
    var supUbah = await _produkSinkronSupplier(_bhRows.map(function(x) { return { sup: x.sup, sis: x.sis, lock: x.lockProd }; }));
    hideModal('modal-batch-hpp');
    _produkSelected = {};
    produkMarkDirty();
    await loadProduk();
    if (supUbah.length) alert('✓ ' + ubah + ' SKU disimpan.\nSupplier disinkronkan di Channel › Supplier & ROP: ' + supUbah.join(', '));
  } catch (err) {
    produkMarkDirty();
    alert('Gagal: ' + (err && err.message || err) + '\n\nSebagian SKU mungkin sudah tersimpan — buka lagi Edit HPP untuk memeriksa.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-check"></i> Simpan'; }
  }
}

// Sinkron ke Channel › Supplier & ROP (dipakai Edit HPP & Edit Sistem massal): supplier yang SKU-nya dipilih Dropship / P.O menyalakan jenis itu.
// items = [{ sup, sis, lock }]; lock = baris supplier Produksi Sendiri (tidak ikut). Mengembalikan nama supplier yang flag-nya berubah.
function _produkSinkronNeed(items) {
  var need = {};
  items.forEach(function(x) {
    if (!x.sup || x.lock) return;
    var n = need[x.sup.id] || (need[x.sup.id] = { sup: x.sup, ds: false, rs: false });
    if (x.sis === 'dropship') n.ds = true; else if (x.sis === 'reseller') { n.rs = true; if (x.juga) n.ds = true; }
  });
  return need;
}
async function _produkSinkronSupplier(items) {
  var need = _produkSinkronNeed(items), ubah = [];
  for (var id in need) {
    var n = need[id], pl = {};
    if (n.ds && !n.sup.is_dropship) pl.is_dropship = true;
    if (n.rs && !n.sup.is_reseller) pl.is_reseller = true;
    if (!Object.keys(pl).length) continue;
    // Supplier jadi 2 sistem: SKU supplier ini yang belum punya sistem eksplisit dikunci dulu ke sistemnya sekarang,
    // supaya perilakunya tidak ikut bergeser oleh aturan turunan-supplier (dual → ikut produk.dropship).
    var supKey = String(n.sup.nama || '').trim().toUpperCase();
    var lama = _produkData.filter(function(p) { return String(p.boss || '').trim().toUpperCase() === supKey && !p.sistem_override && _produkSistemOf(p); });
    for (var li = 0; li < lama.length; li++) {
      var sisLama = _produkSistemOf(lama[li]);
      await dbUpdate('produk', lama[li].id, { sistem_override: sisLama });
      lama[li].sistem_override = sisLama;
    }
    var jadiDual = !(n.sup.is_dropship && n.sup.is_reseller) && ((n.sup.is_dropship || pl.is_dropship) && (n.sup.is_reseller || pl.is_reseller));
    await dbUpdate('hutang_supplier', n.sup.id, pl);
    Object.keys(pl).forEach(function(k) { n.sup[k] = pl[k]; });
    // Supplier BARU jadi 2 sistem: SKU Reseller lain milik supplier ini yang belum menentukan dropship_juga dikunci ke false, supaya Dropship
    // tidak ikut menyala sendiri di semua SKU-nya lewat aturan "ikuti supplier" (hanya SKU yang dipilih user yang menyala).
    if (jadiDual) {
      var kunci = _produkData.filter(function(p) { return String(p.boss || '').trim().toUpperCase() === supKey && p.dropship_juga == null && p.sistem_override === 'reseller'; });
      for (var ki = 0; ki < kunci.length; ki++) {
        try { await dbUpdate('produk', kunci[ki].id, { dropship_juga: false }); kunci[ki].dropship_juga = false; }
        catch (eK) { console.warn('[produk] kunci dropship_juga gagal (kolom belum ada?):', eK && eK.message); break; }
      }
    }
    ubah.push(n.sup.nama);
  }
  return ubah;
}

function _produkSinkronCatatan(items) {
  var need = _produkSinkronNeed(items), notes = [];
  Object.keys(need).forEach(function(id) {
    var n = need[id], add = [];
    if (n.ds && !n.sup.is_dropship) add.push('Dropship');
    if (n.rs && !n.sup.is_reseller) add.push('Reseller (P.O)');
    if (add.length) notes.push('<b>' + _pkEsc(n.sup.nama) + '</b> + ' + add.join(' & '));
  });
  return notes;
}

// ── BATCH: Edit Sistem massal (12 Nov 2026) ───────────────────
// 17 Nov 2026: pilih SUMBER dulu — Supplier utama (sistem SKU seperti dulu) atau salah satu supplier CADANGAN yang dimiliki SKU terpilih
// (tiap cadangan punya saklar Dropship dan P.O sendiri). Supplier utama Produksi Sendiri tetap hanya Produksi Sendiri.
var _bsSis = '';           // sistem utama hasil saklar: 'dropship' | 'reseller' | 'produksi' | '' (belum dipilih)
var _bsJuga = false;       // true = P.O + Dropship bersamaan (sistem 'reseller' + dropship_juga)
var _bsU = { ds: false, po: false, prod: false };   // saklar: Dropship dan P.O boleh bersamaan; Produksi eksklusif
function _bsSinkronSis() { var t = _produkSisTarget(_bsU); _bsSis = t ? t.sis : ''; _bsJuga = !!(t && t.juga); }
var _bsSumber = 'utama';   // 'utama' | id supplier cadangan
var _bsCad = { ds: false, po: false };
function _bsSumberOpsi() {   // supplier cadangan yang dimiliki SKU terpilih
  var ids = Object.keys(_produkSelected).map(Number), seen = {}, out = [];
  (_produkCadList || []).forEach(function(l) {
    if (ids.indexOf(l.produk_id) < 0 || seen[l.supplier_id]) return;
    var sp = _produkSupById(l.supplier_id);
    if (sp) { seen[l.supplier_id] = true; out.push(sp); }
  });
  out.sort(function(a, b) { return String(a.nama || '').localeCompare(String(b.nama || ''), 'id'); });
  return out;
}
function _bsCadLinks() {
  var ids = Object.keys(_produkSelected).map(Number);
  return (_produkCadList || []).filter(function(l) { return l.supplier_id === _bsSumber && ids.indexOf(l.produk_id) >= 0; });
}
function produkBsSumber(v) {
  _bsSumber = v === 'utama' ? 'utama' : Number(v);
  _bsU = { ds: false, po: false, prod: false }; _bsSinkronSis();
  if (_bsSumber !== 'utama') {   // saklar awal = kondisi mayoritas SKU terpilih
    var ls = _bsCadLinks();
    _bsCad = { ds: ls.filter(function(l) { return _produkCadMode(l).ds; }).length * 2 >= ls.length, po: ls.filter(function(l) { return _produkCadMode(l).po; }).length * 2 > ls.length };
  }
  _bsRender();
}
function produkBsCadToggle(k) { _bsCad[k] = !_bsCad[k]; _bsRender(); }
function produkBatchSistem() {
  var ids = Object.keys(_produkSelected).map(Number);
  if (!ids.length) return;
  _bsU = { ds: false, po: false, prod: false }; _bsSinkronSis();
  _bsSumber = 'utama';
  document.getElementById('bs-count').textContent = ids.length + ' SKU terpilih';
  _bsRender();
  showModal('modal-batch-sis');
}
function produkBsPick(k) { var n = _produkSisToggle(_bsU, k); if (n) { _bsU = n; _bsSinkronSis(); _bsRender(); } }   // k: 'ds' | 'po' | 'prod'
function _bsRows() { var ids = Object.keys(_produkSelected).map(Number); return _produkData.filter(function(r) { return ids.indexOf(r.id) >= 0; }); }
function _bsRender() {
  var opsi = _bsSumberOpsi();
  if (_bsSumber !== 'utama' && !opsi.some(function(x) { return x.id === _bsSumber; })) _bsSumber = 'utama';
  var chip = function(v, t, on) { return '<button type="button" onclick="produkBsSumber(\'' + v + '\')" style="font-family:var(--f);font-size:12px;font-weight:700;padding:6px 12px;border:2px solid var(--ink);cursor:pointer;background:' + (on ? 'var(--ink)' : 'var(--cream)') + ';color:' + (on ? 'var(--cream)' : 'var(--ink)') + '">' + t + '</button>'; };
  document.getElementById('bs-sumber').innerHTML = opsi.length
    ? '<div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Sumber</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">'
      + chip('utama', 'Supplier utama', _bsSumber === 'utama') + opsi.map(function(x) { return chip(x.id, _pkEsc(x.nama) + ' (cadangan)', _bsSumber === x.id); }).join('') + '</div>'
    : '';
  if (_bsSumber !== 'utama') {   // sumber = supplier cadangan: dua saklar sistem, berlaku untuk SKU terpilih yang punya cadangan itu
    var supC = _produkSupById(_bsSumber), ls = _bsCadLinks();
    document.getElementById('bs-opts').innerHTML = [['ds', 'Dropship', 'Dikirim langsung ke pembeli saat stok utama kosong. Bon dropship ke supplier ini.'], ['po', 'P.O', 'Stok dibeli dari supplier ini lewat Tambah Stok Masuk. Bon P.O terbentuk otomatis.']].map(function(x) {
      return '<div class="pk-sis-row' + (_bsCad[x[0]] ? ' on' : '') + '" style="border-radius:8px" onclick="produkBsCadToggle(\'' + x[0] + '\')">'
        + '<div class="pk-sis-rtxt"><div class="pk-sis-rl">' + x[1] + '</div><div class="pk-sis-rd">' + x[2] + '</div></div><span class="pk-sis-tg"></span></div>';
    }).join('');
    var tanpaHarga = ls.filter(function(l) {
      var r = _produkData.find(function(x) { return x.id === l.produk_id; });
      return r && ((_bsCad.ds && !_produkCadHargaDs(r, l.supplier_id)) || (_bsCad.po && !_produkCadHargaPo(r, l.supplier_id)));
    }).length;
    document.getElementById('bs-note').innerHTML = ls.length + ' SKU terpilih punya cadangan ' + _pkEsc(supC ? supC.nama : '') + '.'
      + (tanpaHarga ? '<br>⚠ ' + tanpaHarga + ' SKU belum ada harga untuk sistem yang diaktifkan — isi lewat Edit Supplier › + Cadangan atau sheet Sistem › Supplier Cadangan.' : '')
      + '<br>Minimal satu sistem aktif. Untuk melepas supplier ini pakai Edit Supplier › Hapus Cadangan.';
    return;
  }
  document.getElementById('bs-opts').innerHTML = [
    ['ds',   'Dropship',         'Tidak disetok. Bon dropship dicatat ke supplier.'],
    ['po',   'P.O (Reseller)',   'Dibeli sebagai PO dari supplier. Boleh digabung dengan Dropship.'],
    ['prod', 'Produksi Sendiri', 'Disetok sendiri. Stok dilacak.']
  ].map(function(o) {
    return '<div class="pk-sis-row' + (_bsU[o[0]] ? ' on' : '') + '" style="border-radius:8px" onclick="produkBsPick(\'' + o[0] + '\')">'
      + '<div class="pk-sis-rtxt"><div class="pk-sis-rl">' + o[1] + '</div><div class="pk-sis-rd">' + o[2] + '</div></div><span class="pk-sis-tg"></span></div>';
  }).join('');
  var note = '';
  if (_bsSis) {
    var rows = _bsRows();
    var items = rows.map(function(r) { var s = _bhSupOf(r); return { sup: s, sis: _bsSis, juga: _bsJuga, lock: !!(s && s.is_produksi_sendiri) }; });
    var skip = items.filter(function(x) { return x.lock && _bsSis !== 'produksi'; }).length;
    var notes = _bsSis === 'produksi' ? [] : _produkSinkronCatatan(items);
    note = (_bsSis === 'produksi' ? 'HPP tidak diubah — atur lewat Edit HPP.' : 'HPP tiap SKU mengikuti harga ' + (_bsSis === 'dropship' ? 'Dropship' : 'P.O') + ' di Master Barang (kalau harganya sudah ada).')
      + (_bsJuga ? '<br>Dropship + P.O: stok dipakai seperti biasa; kirim via dropship dipilih lewat toggle di Tambah Penjualan (bon dropship ke supplier utama).' : '')
      + (skip ? '<br>⚠ ' + skip + ' SKU supplier Produksi Sendiri dilewati. Untuk Dropship / P.O pilih sumber supplier cadangan (tambahkan lewat Edit Supplier › + Cadangan).' : '')
      + (notes.length ? '<br><i class="ti ti-refresh"></i> Sinkron ke Channel › Supplier &amp; ROP: ' + notes.join(' · ') + ' akan diaktifkan.' : '');
  }
  document.getElementById('bs-note').innerHTML = note;
}
// Sumber = supplier cadangan: terapkan saklar Dropship / P.O ke tautan SKU terpilih (tidak menyentuh sistem supplier utama).
async function simpanBatchSistemCad() {
  if (!_bsCad.ds && !_bsCad.po) { alert('Aktifkan minimal satu sistem. Untuk melepas supplier cadangan pakai Edit Supplier › Hapus Cadangan.'); return; }
  var links = _bsCadLinks();
  if (!links.length) { alert('Tidak ada SKU terpilih yang punya cadangan ini.'); return; }
  var btn = document.getElementById('bs-btn-simpan');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  try {
    for (var i = 0; i < links.length; i++) {
      var m = _produkCadMode(links[i]);
      if (m.ds === _bsCad.ds && m.po === _bsCad.po) continue;
      await dbUpdate('produk_supplier', links[i].id, { dropship: _bsCad.ds, po: _bsCad.po });
      links[i].dropship = _bsCad.ds; links[i].po = _bsCad.po;
    }
    hideModal('modal-batch-sis');
    _produkSelected = {};
    produkMarkDirty();
    await loadProduk();
  } catch (err) {
    produkMarkDirty();
    alert('Gagal: ' + _produkCadPesanError(err) + '\n\nSebagian SKU mungkin sudah tersimpan — periksa tabelnya.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-check"></i> Simpan'; }
  }
}

async function simpanBatchSistem() {
  if (_bsSumber !== 'utama') return simpanBatchSistemCad();
  if (!_bsSis) { alert('Pilih sistemnya dulu'); return; }
  var rows = _bsRows(), items = [], skip = 0, ubah = 0;
  var btn = document.getElementById('bs-btn-simpan');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  try {
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], sup = _bhSupOf(r), lock = !!(sup && sup.is_produksi_sendiri);
      if (lock && _bsSis !== 'produksi') { skip++; continue; }
      items.push({ sup: sup, sis: _bsSis, juga: _bsJuga, lock: lock });
      if (_produkSisSama(r, _bsSis, _bsJuga)) continue;
      var payload = _produkSisPayloadFor(r, _bsSis, _bsJuga);
      if (sup && _produkSupDualByName(r.boss)) payload.dropship = (_bsSis === 'dropship');
      _produkStampDropshipMulai(payload, r);
      if (_bsSis !== 'produksi' && sup && !lock) {   // HPP ikut harga sistem barunya di Master Barang; belum ada harganya → HPP dibiarkan
        var b = (_produkHbList || []).find(function(h) { return h.produk_id === r.id && h.supplier_id === sup.id; });
        var lusin = b ? Number(_bsSis === 'dropship' ? b.harga_per_lusin : b.harga_po_per_lusin) || 0 : 0;
        var h = lusin > 0 ? Math.round(lusin / 12) : 0;
        if (h > 0 && h !== (Number(r.hpp) || 0)) payload.hpp = h;
      }
      await dbUpdate('produk', r.id, payload);
      Object.keys(payload).forEach(function(k) { r[k] = payload[k]; });
      ubah++;
    }
    var supUbah = await _produkSinkronSupplier(items);
    hideModal('modal-batch-sis');
    _produkSelected = {};
    produkMarkDirty();
    await loadProduk();
    if (skip || supUbah.length) alert('✓ ' + ubah + ' SKU diubah.' + (skip ? '\n' + skip + ' SKU supplier Produksi Sendiri dilewati.' : '') + (supUbah.length ? '\nSupplier disinkronkan di Channel › Supplier & ROP: ' + supUbah.join(', ') : ''));
  } catch (err) {
    produkMarkDirty();
    alert('Gagal: ' + (err && err.message || err) + (/dropship_juga/i.test(String(err && err.message || err)) ? '\n\nKolom belum ada — jalankan zenoot-sistem-bersamaan.sql di Supabase dulu.' : '') + '\n\nSebagian SKU mungkin sudah tersimpan — periksa tabelnya.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-check"></i> Simpan'; }
  }
}

// ── BATCH: Edit Supplier massal ───────────────────────────────
function produkBatchSupplier() {
  const ids = Object.keys(_produkSelected).map(Number);
  if (!ids.length) return;
  document.getElementById('batch-sup-count').textContent = ids.length + ' SKU terpilih';
  document.getElementById('batch-sup-ringkas').innerHTML = _produkSupRingkasHtml();
  document.getElementById('batch-sup-input').value = '';
  const lbl = document.getElementById('batch-sup-label');
  if (lbl) { lbl.textContent = '— Pilih Supplier —'; lbl.style.color = 'var(--ink3)'; }
  produkBatchSupMode('utama');   // reset mode + toggle Sistem tersembunyi sampai supplier Dropship + Reseller dipilih
  showModal('modal-batch-sup');
}

// [30 Sep 2026] Toggle Sistem (Dropship / Reseller) di modal Edit Supplier — HANYA muncul kalau supplier terpilih
// berjenis Dropship + Reseller (mis. RH). Supplier lain sistemnya sudah pasti dari pengaturan Supplier & ROP.
// [30 Sep 2026] Peralihan ke Produksi Sendiri BOLEH DICICIL per varian (keputusan user, menggantikan aturan "harus total per
// katalog"). _produkIsProduksiBoss dipakai (HPP wajib saat pindah ke Produksi Sendiri).
function _produkIsProduksiBoss(boss) {
  var s = _produkSupMap()[String(boss || '').trim().toUpperCase()];
  return !!(s && s.is_produksi_sendiri);
}

// Kembalikan daftar katalog yang belum total: [{katalog, total, miss}]; kosong = aman.


// 16 Nov 2026: Edit Supplier Massal punya 3 mode — Ganti Utama (perilaku lama: menimpa produk.boss), + Cadangan (tambah supplier cadangan,
// supplier utama tidak berubah), Hapus Cadangan. Cadangan disimpan di tabel produk_supplier.
var _batchSupMode = 'utama';
var _BATCH_SUP_HINT = {
  utama:  'Mengganti supplier UTAMA semua SKU terpilih (menentukan sistem, stok, dan Re-Stock).',
  tambah: 'Menambah supplier CADANGAN (supplier utama tidak berubah). Dipakai saat stok utama kosong, lewat Dropship dan/atau P.O. Sistem & harga bisa diatur per SKU di sheet Sistem › Supplier Cadangan.',
  hapus:  'Menghapus supplier cadangan dari SKU terpilih. Penjualan lama yang sudah tercatat via cadangan tidak berubah.'
};
function produkBatchSupMode(m) {
  _batchSupMode = m;
  document.getElementById('batch-sup-input').value = '';
  var lbl = document.getElementById('batch-sup-label');
  if (lbl) { lbl.textContent = '— Pilih Supplier —'; lbl.style.color = 'var(--ink3)'; }
  var t = document.getElementById('batch-sup-lbl-title');
  if (t) t.textContent = m === 'utama' ? 'Nama Supplier Baru' : (m === 'tambah' ? 'Supplier Cadangan' : 'Cadangan yang Dihapus');
  var h = document.getElementById('batch-sup-mode-hint');
  if (h) h.textContent = _BATCH_SUP_HINT[m];
  document.querySelectorAll('#batch-sup-mode button').forEach(function(b) {
    var on = b.getAttribute('data-m') === m;
    b.style.background = on ? 'var(--ink)' : 'var(--cream)';
    b.style.color = on ? 'var(--cream)' : 'var(--ink)';
  });
  produkBatchSupSyncSistem();
}
function produkBatchSupOpenPicker() {
  produkOpenBossSheet('batch-sup-input', 'batch-sup-label', _batchSupMode === 'tambah' ? 'cad-tambah' : (_batchSupMode === 'hapus' ? 'cad-hapus' : ''));
}

function produkBatchSupSyncSistem() {
  // Mode cadangan: kolom harga dropship hanya untuk mode "+ Cadangan" setelah supplier dipilih; baris Sistem & HPP Produksi khusus mode Ganti Utama
  var dsRow = document.getElementById('batch-sup-ds-row');
  if (dsRow) {
    var bs = String(document.getElementById('batch-sup-input').value || '').trim();
    dsRow.style.display = (_batchSupMode === 'tambah' && bs) ? '' : 'none';
    var cds = document.getElementById('batch-sup-cad-ds'), cpo = document.getElementById('batch-sup-cad-po');
    var kds = document.getElementById('batch-sup-cad-ds-on'), kpo = document.getElementById('batch-sup-cad-po-on');
    if (dsRow.style.display === 'none') { cds.value = ''; cpo.value = ''; kds.checked = false; kpo.checked = false; }
    else {   // saran awal sistem dari flag supplier yang dipilih (bisa diubah)
      var sp = _produkSupMap()[bs.toUpperCase()], ma = sp ? _produkCadModeAwal(sp) : { dropship: true, po: false };
      kds.checked = ma.dropship; kpo.checked = ma.po;
    }
  }
  if (_batchSupMode !== 'utama') {
    var hr0 = document.getElementById('batch-sup-hpp-row'), sr0 = document.getElementById('batch-sup-sistem-row');
    if (hr0) { hr0.style.display = 'none'; document.getElementById('batch-sup-hpp').value = ''; }
    if (sr0) sr0.style.display = 'none';
    return;
  }
  // Pindah ke supplier Produksi Sendiri → wajib isi HPP baru (HPP produksi beda dengan harga beli reseller/dropship)
  var hr = document.getElementById('batch-sup-hpp-row');
  if (hr) {
    var b0 = String(document.getElementById('batch-sup-input').value || '').trim();
    hr.style.display = (b0 && _produkIsProduksiBoss(b0)) ? '' : 'none';
    if (hr.style.display === 'none') document.getElementById('batch-sup-hpp').value = '';
  }
  var row = document.getElementById('batch-sup-sistem-row');
  if (!row) return;
  var boss = String(document.getElementById('batch-sup-input').value || '').trim();
  var dual = !!boss && _produkIsDualBoss(boss);
  row.style.display = dual ? '' : 'none';
  if (!dual) return;
  // 30 Okt 2026: default = sistem SKU terpilih sekarang kalau seragam (semua Dropship / semua Reseller), selain itu Dropship (default RH).
  // Toggle ini baru dianggap pilihan eksplisit setelah di-klik; kalau tidak disentuh, tiap SKU mempertahankan sistem lamanya (lihat simpanBatchSupplier).
  var ids  = Object.keys(_produkSelected).map(Number);
  var rows = _produkData.filter(function(r) { return ids.indexOf(r.id) >= 0; });
  var allRs = rows.length > 0 && rows.every(function(r) { return _produkSistemOf(r) === 'reseller'; });
  produkBatchSupSetSistem(allRs ? 'reseller' : 'dropship');
  _batchSupSisTouched = false;
}

var _batchSupSisTouched = false;   // true kalau user mengklik toggle Sistem di modal Edit Supplier Massal
function produkBatchSupPickSistem(v) { _batchSupSisTouched = true; produkBatchSupSetSistem(v); }

function produkBatchSupSetSistem(v) {
  // Dua toggle saling meniadakan: satu SKU cuma bisa Reseller ATAU Dropship (produk.dropship = true/false),
  // jadi menyalakan salah satu otomatis mematikan yang lain.
  document.getElementById('batch-sup-sistem').value = v;
  ['reseller', 'dropship'].forEach(function(k) {
    var sw = document.getElementById('batch-sup-sw-' + k);
    if (!sw) return;
    var on = (k === v);
    sw.style.background = on ? '#4cc46b' : '#c4c4c4';
    sw.firstElementChild.style.left = on ? '23px' : '3px';
  });
}

// Mode "+ Cadangan": tambahkan supplier ke tiap SKU terpilih (SKU yang supplier utamanya sudah supplier itu dilewati); harga Dropship opsional → Master Barang.
async function simpanBatchCadTambah() {
  const ids = Object.keys(_produkSelected).map(Number);
  const nama = document.getElementById('batch-sup-input').value.trim();
  const sup = _produkSupMap()[nama.toUpperCase()];
  if (!sup) { alert('Pilih supplier cadangan dulu.'); return; }
  if (sup.is_produksi_sendiri) { alert('Supplier Produksi Sendiri tidak bisa jadi cadangan.'); return; }
  const ds = parseInt(String(document.getElementById('batch-sup-cad-ds').value || '').replace(/\D/g, ''), 10) || 0;
  const po = parseInt(String(document.getElementById('batch-sup-cad-po').value || '').replace(/\D/g, ''), 10) || 0;
  const modes = { dropship: document.getElementById('batch-sup-cad-ds-on').checked || ds > 0, po: document.getElementById('batch-sup-cad-po-on').checked || po > 0 };
  if (!modes.dropship && !modes.po) { alert('Aktifkan minimal satu sistem: Dropship atau P.O.'); return; }
  const rows = _produkData.filter(r => ids.indexOf(r.id) >= 0);
  let ok = 0, lewat = 0;
  try {
    for (const r of rows) {
      if (!_produkCadKandidat(r).some(k => k.id === sup.id)) { lewat++; continue; }   // supplier utama SKU ini sendiri
      await _produkCadTambah(r, sup, ds, po, modes);
      ok++;
    }
    hideModal('modal-batch-sup');
    _produkSelected = {};
    produkMarkDirty();
    await loadProduk();
    if (lewat) alert(ok + ' SKU ditambah cadangan ' + sup.nama + '. ' + lewat + ' SKU dilewati karena supplier utamanya sudah ' + sup.nama + '.');
  } catch (err) {
    const msg = String(err && err.message || err);
    produkMarkDirty();
    alert('Gagal: ' + _produkCadPesanError(err) + '\n\nSebagian SKU mungkin sudah tersimpan — periksa tabelnya.');
  }
}

async function simpanBatchCadHapus() {
  const ids = Object.keys(_produkSelected).map(Number);
  const nama = document.getElementById('batch-sup-input').value.trim();
  const sup = _produkSupMap()[nama.toUpperCase()];
  if (!sup) { alert('Pilih supplier cadangan yang mau dihapus.'); return; }
  const links = (_produkCadList || []).filter(l => l.supplier_id === sup.id && ids.indexOf(l.produk_id) >= 0);
  if (!links.length) { alert(sup.nama + ' bukan cadangan di SKU terpilih.'); return; }
  try {
    for (const l of links) await _produkCadHapus(l.id);
    hideModal('modal-batch-sup');
    _produkSelected = {};
    produkMarkDirty();
    await loadProduk();
  } catch (err) {
    produkMarkDirty();
    alert('Gagal: ' + String(err && err.message || err) + '\n\nSebagian SKU mungkin sudah terhapus — periksa tabelnya.');
  }
}

async function simpanBatchSupplier() {
  if (_batchSupMode === 'tambah') return simpanBatchCadTambah();
  if (_batchSupMode === 'hapus') return simpanBatchCadHapus();
  const ids  = Object.keys(_produkSelected).map(Number);
  const boss = document.getElementById('batch-sup-input').value.trim().toUpperCase();
  if (!boss) { alert('Masukkan nama supplier'); return; }
  // Pindah ke Produksi Sendiri (boleh sebagian varian): HPP baru wajib diisi & ikut disimpan ke semua SKU terpilih
  let hppBaru = 0;
  if (_produkIsProduksiBoss(boss)) {
    hppBaru = parseInt(String(document.getElementById('batch-sup-hpp').value || '').replace(/\D/g, '')) || 0;
    if (!hppBaru) { alert('Isi HPP Produksi dulu — HPP produksi beda dengan harga beli supplier sebelumnya.'); return; }
  }
  // 30 Okt 2026: sistem_override ditulis eksplisit.
  //  - Supplier dual (RH): toggle diklik → semua SKU terpilih ikut toggle; tidak diklik → tiap SKU mempertahankan dropship/reseller lamanya
  //    (SKU yang sebelumnya Produksi Sendiri dapat nilai toggle, default Dropship). produk.dropship tetap ikut ditulis (kompatibilitas).
  //  - Supplier lain: sistem mengikuti supplier baru (DIMI → Produksi Sendiri, dst.). Supplier tidak terdaftar → tidak menulis sistem.
  const payload = { boss };
  if (hppBaru) payload.hpp = hppBaru;
  const _dual = _produkIsDualBoss(boss);
  const _toggleVal = document.getElementById('batch-sup-sistem').value === 'dropship' ? 'dropship' : 'reseller';
  const _sisSingle = _dual ? null : _produkSistemDefault(boss);
  if (_sisSingle) payload.sistem_override = _sisSingle;
  try {
    const _oldMap = {};
    _produkData.forEach(r => { _oldMap[r.id] = r; });
    for (const id of ids) {
      const payloadRow = Object.assign({}, payload);
      if (_dual) {
        const _prefer = _batchSupSisTouched ? null : _produkSistemPrefer(_oldMap[id]);
        const _sisDual = _prefer || _toggleVal;
        payloadRow.sistem_override = _sisDual;
        payloadRow.dropship = (_sisDual === 'dropship');
      }
      _produkStampDropshipMulai(payloadRow, _oldMap[id]);
      await dbUpdate('produk', id, payloadRow);
      await _produkCadBersihkanUtama(id, boss);   // supplier baru tadinya cadangan SKU ini → tautan cadangannya dibuang
      // Cascade snapshot stok (stok.boss) — dulu Edit Supplier massal tidak melakukan ini, padahal kalau varian pindah
      // sebagian, Stok Produk bakal masih menampilkan supplier lama. Pola sama dengan simpanEditKatalog.
      const r = _oldMap[id];
      if (r) {
        try {
          const skuU = (r.sku_variasi || '').toUpperCase();
          await _produkCascadeRename(skuU, skuU, r.katalog, boss, r.katalog, r.boss);
        } catch (cascadeErr) { console.warn('Cascade gagal buat', r.sku_variasi, ':', cascadeErr.message); }
      }
    }
    hideModal('modal-batch-sup');
    _produkSelected = {};
    produkMarkDirty();
    loadProduk();
  } catch(err) {
    const msg = String(err && err.message || err);
    alert('Gagal: ' + msg + (/dropship/i.test(msg) ? '\n\nKolom produk.dropship belum ada — jalankan dropship_hpp.sql di Supabase dulu.' : ''));
  }
}

// ── MODAL: Batch HPP ─────────────────────────────────────────
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="modal-batch-hpp" onclick="if(event.target===this)hideModal('modal-batch-hpp')">
  <div class="modal">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-currency-dollar"></i> Edit HPP Massal</div>
      <button onclick="hideModal('modal-batch-hpp')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <p id="batch-hpp-count" style="font-size:12px;color:var(--ink3);margin-bottom:10px">0 SKU terpilih</p>
    <div class="bh-all" id="bh-all"></div>
    <button class="btn btn-sm" style="margin:-2px 0 10px" onclick="produkBhTerapkanSemua()"><i class="ti ti-arrow-down"></i> Terapkan harga ke semua baris</button>
    <div id="bh-list"></div>
    <div class="bh-note" id="bh-note"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
      <button class="btn btn-sm" onclick="hideModal('modal-batch-hpp')">Batal</button>
      <button class="btn btn-sm btn-primary" id="bh-btn-simpan" onclick="simpanBatchHpp()"><i class="ti ti-check"></i> Simpan</button>
    </div>
  </div>
</div>`);

// ── MODAL: Batch Sistem ──────────────────────────────────────
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="modal-batch-sis" onclick="if(event.target===this)hideModal('modal-batch-sis')">
  <div class="modal" style="max-width:420px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-switch-horizontal"></i> Edit Sistem Massal</div>
      <button onclick="hideModal('modal-batch-sis')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <p id="bs-count" style="font-size:12px;color:var(--ink3);margin-bottom:10px">0 SKU terpilih</p>
    <div id="bs-sumber"></div>
    <div id="bs-opts"></div>
    <div class="bh-note" id="bs-note"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
      <button class="btn btn-sm" onclick="hideModal('modal-batch-sis')">Batal</button>
      <button class="btn btn-sm btn-primary" id="bs-btn-simpan" onclick="simpanBatchSistem()"><i class="ti ti-check"></i> Simpan</button>
    </div>
  </div>
</div>`);

// Supplier dual = Dropship + Reseller (mis. RH), bukan Produksi Sendiri. Hanya Boss dual yang punya toggle Sistem di modal Edit Supplier.
function _produkIsDualBoss(boss) {
  var s = _produkSupMap()[String(boss || '').trim().toUpperCase()];
  return !!(s && s.is_dropship && s.is_reseller && !s.is_produksi_sendiri);
}

// ── MODAL: Batch Supplier ─────────────────────────────────────
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-overlay" id="modal-batch-sup" onclick="if(event.target===this)hideModal('modal-batch-sup')">
  <div class="modal" style="max-width:380px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-user"></i> Edit Supplier Massal</div>
      <button onclick="hideModal('modal-batch-sup')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <p id="batch-sup-count" style="font-size:12px;color:var(--ink3);margin-bottom:8px">0 SKU terpilih</p>
    <div id="batch-sup-ringkas"></div>
    <div id="batch-sup-mode" style="display:flex;border:2px solid var(--ink);margin-bottom:14px">
      <button type="button" data-m="utama" onclick="produkBatchSupMode('utama')" style="flex:1;font-family:var(--f);font-size:12px;font-weight:700;padding:8px 4px;border:none;cursor:pointer">Ganti Utama</button>
      <button type="button" data-m="tambah" onclick="produkBatchSupMode('tambah')" style="flex:1;font-family:var(--f);font-size:12px;font-weight:700;padding:8px 4px;border:none;border-left:2px solid var(--ink);cursor:pointer">+ Cadangan</button>
      <button type="button" data-m="hapus" onclick="produkBatchSupMode('hapus')" style="flex:1;font-family:var(--f);font-size:12px;font-weight:700;padding:8px 4px;border:none;border-left:2px solid var(--ink);cursor:pointer">Hapus Cadangan</button>
    </div>
    <p id="batch-sup-mode-hint" style="font-size:11px;color:var(--ink3);line-height:1.5;margin:-6px 0 12px"></p>
    <div class="form-group" style="margin-bottom:14px">
      <label id="batch-sup-lbl-title">Nama Supplier Baru</label>
      <button type="button" class="produk-boss-trigger" onclick="produkBatchSupOpenPicker()">
        <span id="batch-sup-label" style="color:var(--ink3)">— Pilih Supplier —</span>
        <i class="ti ti-chevron-down" style="font-size:14px;flex-shrink:0"></i>
      </button>
      <input type="hidden" id="batch-sup-input">
    </div>
    <div id="batch-sup-sistem-row" class="form-group" style="display:none;margin-bottom:14px">
      <label>Sistem (supplier ini Dropship + Reseller)</label>
      <div style="border:2px solid var(--ink);background:var(--cream)">
        <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid var(--ink4);cursor:pointer" onclick="produkBatchSupPickSistem('reseller')">
          <div style="flex:1;line-height:1.3">
            <div style="font-size:14px;font-weight:700">Reseller</div>
            <div style="font-size:11px;color:var(--ink3)">Stok dilacak, ikut hitungan kritis, restock, dan nilai stok.</div>
          </div>
          <div id="batch-sup-sw-reseller" style="position:relative;width:46px;height:26px;border-radius:13px;flex-shrink:0;transition:background .15s"><div style="position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .15s"></div></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;cursor:pointer" onclick="produkBatchSupPickSistem('dropship')">
          <div style="flex:1;line-height:1.3">
            <div style="font-size:14px;font-weight:700">Dropship</div>
            <div style="font-size:11px;color:var(--ink3)">Tidak nyetok, Sisa Stok tampil "DS", tidak dihitung kritis / restock.</div>
          </div>
          <div id="batch-sup-sw-dropship" style="position:relative;width:46px;height:26px;border-radius:13px;flex-shrink:0;transition:background .15s"><div style="position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .15s"></div></div>
        </div>
      </div>
      <input type="hidden" id="batch-sup-sistem" value="reseller">
    </div>
    <div id="batch-sup-ds-row" class="form-group" style="display:none;margin-bottom:14px">
      <label>Sistem di supplier ini</label>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
        <label style="flex:0 0 108px;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;margin:0"><input type="checkbox" id="batch-sup-cad-ds-on"> Dropship</label>
        <input type="text" inputmode="numeric" id="batch-sup-cad-ds" placeholder="Harga/pcs (opsional)" style="font-family:var(--f);font-size:14px;padding:7px 10px;border:2px solid var(--ink);background:var(--cream);color:var(--ink);flex:1;min-width:0">
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <label style="flex:0 0 108px;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;margin:0"><input type="checkbox" id="batch-sup-cad-po-on"> P.O</label>
        <input type="text" inputmode="numeric" id="batch-sup-cad-po" placeholder="Harga/pcs (opsional)" style="font-family:var(--f);font-size:14px;padding:7px 10px;border:2px solid var(--ink);background:var(--cream);color:var(--ink);flex:1;min-width:0">
      </div>
      <div style="font-size:11px;color:var(--ink3);line-height:1.5;margin-top:6px">Harga disimpan ke Master Barang untuk semua SKU terpilih; kosong = harga tidak diubah. Mengisi harga otomatis mengaktifkan sistemnya. Tanpa harga, sistem itu belum bisa dipakai di Tambah Penjualan / Tambah Stok Masuk.</div>
    </div>
    <div id="batch-sup-hpp-row" class="form-group" style="display:none;margin-bottom:14px">
      <label>HPP Produksi Baru (Rp) — wajib</label>
      <input type="text" inputmode="numeric" id="batch-sup-hpp" placeholder="Contoh: 48000" style="font-family:var(--f);font-size:15px;padding:8px 10px;border:2px solid var(--ink);background:var(--cream);color:var(--ink);width:100%">
      <div style="font-size:11px;color:var(--ink3);line-height:1.5;margin-top:6px">Berlaku untuk semua SKU terpilih. Varian lain di katalog yang sama tidak berubah. Sisa stok reseller &amp; bon ke supplier lama tidak ikut berubah otomatis.</div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-sm" onclick="hideModal('modal-batch-sup')">Batal</button>
      <button class="btn btn-sm btn-primary" onclick="simpanBatchSupplier()"><i class="ti ti-check"></i> Simpan</button>
    </div>
  </div>
</div>`);

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
    editKatalog(btn.dataset.kat, btn.dataset.hpp, btn.dataset.boss);
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
      <div class="form-group" id="kat-hpp-grp" style="flex:1 1 120px"><label>HPP (Rp)</label><input type="text" inputmode="numeric" id="kat-hpp" placeholder="0"></div>
      <div class="form-group" style="flex:1 1 120px">
        <label>Boss</label>
        <button type="button" class="produk-boss-trigger" onclick="produkOpenBossSheet('kat-boss','kat-boss-label')">
          <span id="kat-boss-label" style="color:var(--ink3)">— Pilih Supplier —</span>
          <i class="ti ti-chevron-down" style="font-size:14px;flex-shrink:0"></i>
        </button>
        <input type="hidden" id="kat-boss">
      </div>
    </div>
    <div id="kat-dual-row" style="display:none;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 120px"><label>Harga P.O (Rp/pcs)</label><input type="text" inputmode="numeric" id="kat-harga-po" placeholder="0"></div>
      <div class="form-group" style="flex:1 1 120px"><label>Harga Dropship (Rp/pcs)</label><input type="text" inputmode="numeric" id="kat-harga-ds" placeholder="0"></div>
      <div style="flex:1 1 100%;font-size:11px;color:var(--ink3);line-height:1.5;margin-top:-4px">Supplier ini punya 2 sistem. Kosong = harga itu tidak diubah. HPP otomatis mengikuti sistem tiap SKU (Dropship → harga Dropship, selain itu → harga P.O).</div>
    </div>
    <div id="kat-ds-row" style="display:none;margin-bottom:10px;padding:8px 10px;border:1px dashed var(--ink3)">
      <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;font-size:13px">
        <input type="checkbox" id="kat-dropship" style="margin-top:3px">
        <span><b>Dropship (tidak nyetok)</b><br>
        <span style="color:var(--ink3);font-size:11px;line-height:1.5">Supplier ini Dropship + Reseller, jadi tandai katalog yang dropship. Sisa Stok tampil "DS" dan tidak dihitung kritis / restock. Dialihkan ke produksi sendiri? Cukup ganti Boss ke DIMI.</span></span>
      </label>
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
      <div class="form-group" id="prd-hpp-grp" style="flex:1 1 120px"><label>HPP (Rp)</label><input type="text" inputmode="numeric" id="prd-hpp" placeholder="0"></div>
      <div class="form-group" style="flex:1 1 120px">
        <label>Boss</label>
        <button type="button" class="produk-boss-trigger" onclick="produkOpenBossSheet('prd-boss','prd-boss-label')">
          <span id="prd-boss-label" style="color:var(--ink3)">— Pilih Supplier —</span>
          <i class="ti ti-chevron-down" style="font-size:14px;flex-shrink:0"></i>
        </button>
        <input type="hidden" id="prd-boss">
      </div>
    </div>
    <div id="prd-dual-row" style="display:none;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 120px"><label>Harga P.O (Rp/pcs)</label><input type="text" inputmode="numeric" id="prd-harga-po" placeholder="0"></div>
      <div class="form-group" style="flex:1 1 120px"><label>Harga Dropship (Rp/pcs)</label><input type="text" inputmode="numeric" id="prd-harga-ds" placeholder="0"></div>
      <div style="flex:1 1 100%;font-size:11px;color:var(--ink3);line-height:1.5;margin-top:-4px">Supplier ini punya 2 sistem. HPP otomatis mengikuti sistem SKU (Dropship → harga Dropship, selain itu → harga P.O).</div>
    </div>

    <div id="prd-cad-row" class="form-group" style="margin-bottom:10px">
      <label>Supplier Cadangan (opsional)</label>
      <div style="display:flex;gap:8px;align-items:center">
        <button type="button" class="produk-boss-trigger" style="flex:1" onclick="produkOpenBossSheet('prd-cad','prd-cad-label','cad-form')">
          <span id="prd-cad-label" style="color:var(--ink3)">— Tidak ada —</span>
          <i class="ti ti-chevron-down" style="font-size:14px;flex-shrink:0"></i>
        </button>
        <button type="button" id="prd-cad-clear" class="btn btn-sm" style="display:none" onclick="produkPrdCadKosongkan()" aria-label="Kosongkan"><i class="ti ti-x"></i></button>
      </div>
      <input type="hidden" id="prd-cad">
      <div id="prd-cad-harga" style="display:none;gap:10px;flex-wrap:wrap;margin-top:8px">
        <div class="form-group" style="flex:1 1 120px"><label>Harga Dropship (Rp/pcs)</label><input type="text" inputmode="numeric" id="prd-cad-ds" placeholder="0"></div>
        <div class="form-group" style="flex:1 1 120px"><label>Harga P.O (Rp/pcs)</label><input type="text" inputmode="numeric" id="prd-cad-po" placeholder="0"></div>
        <div style="flex:1 1 100%;font-size:11px;color:var(--ink3);line-height:1.5;margin-top:-4px">Sistem yang aktif mengikuti jenis supplier (bisa diubah di sheet Sistem › Supplier Cadangan); mengisi harga otomatis mengaktifkan sistemnya.</div>
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="simpanProduk()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-produk')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>`);

// ── SHEET: Pilih Boss/Supplier (7 Sep 2026) ────────────────────
document.body.insertAdjacentHTML('beforeend', `
<div id="produk-boss-sheet-overlay" onclick="if(event.target===this) produkBossSheetClose()"></div>
<div id="produk-boss-sheet">
  <button type="button" id="produk-boss-sheet-close" onclick="produkBossSheetClose()" aria-label="Tutup"><i class="ti ti-x"></i></button>
  <div id="produk-boss-sheet-handle"></div>
  <div id="produk-boss-sheet-title">Pilih Supplier</div>
  <div id="produk-boss-sheet-search-wrap">
    <input type="text" id="produk-boss-sheet-search" placeholder="Cari atau ketik nama baru..." autocomplete="off"
      oninput="produkBossSheetFilter(this.value)">
  </div>
  <div id="produk-boss-sheet-list"></div>
</div>`);

// ── LOGIC: Sheet Pilih Boss/Supplier (7 Sep 2026) ──────────────
// Single source of truth = tabel hutang_supplier (dikelola dari tab Kelola
// Supplier di Hutang Barang). Dipakai bareng buat 3 titik: form Tambah/Edit
// SKU (prd-boss), Edit Katalog massal (kat-boss), Edit Supplier massal
// (batch-sup-input) — makanya target input/label-nya parameter, bukan hardcode.
let _produkBossSheetTarget = { inputId: '', labelId: '', filter: '' };   // filter (16 Nov 2026): '' semua | 'cad-tambah' / 'cad-form' bukan Produksi Sendiri | 'cad-hapus' supplier yang jadi cadangan SKU terpilih

async function _produkLoadSupplierList() {
  try {
    _produkSupplierList = await dbGet('hutang_supplier', '&order=nama.asc');
    if (!Array.isArray(_produkSupplierList)) _produkSupplierList = [];
  } catch(e) {
    console.warn('Gagal load daftar supplier:', e.message);
    _produkSupplierList = [];
  }
}

function _produkBossSheetOk(sup) {
  var f = _produkBossSheetTarget.filter;
  if (f === 'cad-tambah') return !sup.is_produksi_sendiri;
  if (f === 'cad-form') {   // cadangan di form Tambah SKU: bukan Produksi Sendiri dan bukan supplier utama yang sedang dipilih
    var bossSel = String((document.getElementById('prd-boss') || {}).value || '').trim().toUpperCase();
    return !sup.is_produksi_sendiri && String(sup.nama || '').trim().toUpperCase() !== bossSel;
  }
  if (f === 'cad-hapus') {
    var ids = Object.keys(_produkSelected).map(Number);
    return (_produkCadList || []).some(function(l) { return l.supplier_id === sup.id && ids.indexOf(l.produk_id) >= 0; });
  }
  return true;
}

function produkOpenBossSheet(inputId, labelId, filter) {
  _produkBossSheetTarget = { inputId: inputId, labelId: labelId, filter: filter || '' };
  const searchEl = document.getElementById('produk-boss-sheet-search');
  if (searchEl) searchEl.value = '';
  _produkBossSheetRender('');
  document.getElementById('produk-boss-sheet-overlay').classList.add('open');
  document.getElementById('produk-boss-sheet').classList.add('open');
  setTimeout(function(){ if (searchEl) searchEl.focus(); }, 200);
}

function produkBossSheetClose() {
  document.getElementById('produk-boss-sheet-overlay').classList.remove('open');
  document.getElementById('produk-boss-sheet').classList.remove('open');
}

function produkBossSheetFilter(q) { _produkBossSheetRender(q); }

function _produkBossSheetRender(q) {
  const listEl = document.getElementById('produk-boss-sheet-list');
  if (!listEl) return;
  const query    = (q || '').trim().toUpperCase();
  const filtered = _produkSupplierList.filter(s => (s.nama||'').toUpperCase().includes(query) && _produkBossSheetOk(s));

  // "Sering & Terakhir Digunakan" — cuma pas search kosong (zHistTop di app.js)
  let histHtml = '';
  if (!query) {
    const topNama = zHistTop('produk_boss', 5).filter(function(n) { return _produkSupplierList.some(function(s) { return s.nama === n && _produkBossSheetOk(s); }); });
    if (topNama.length) {
      histHtml = '<div style="font-size:11px;font-weight:700;color:var(--ink3);padding:10px 10px 2px;letter-spacing:.06em;display:flex;align-items:center;gap:5px"><i class="ti ti-clock" style="font-size:12px"></i> Sering & Terakhir Digunakan</div>' +
        topNama.map(function(n) {
          return '<div class="jp-sheet-item" onclick="produkBossSheetSelect(\'' + n.replace(/'/g, "\\'") + '\')"><span>' + n + '</span></div>';
        }).join('') +
        '<div style="font-size:11px;font-weight:700;color:var(--ink3);padding:10px 10px 2px;letter-spacing:.06em">── Semua Supplier ──</div>';
    }
  }

  // Peran supplier pada SKU terpilih (hanya di Edit Supplier Massal): "utama 3 SKU" / "cadangan 2 SKU"
  const peran = {};
  if (_produkBossSheetTarget.inputId === 'batch-sup-input') {
    const selIds = Object.keys(_produkSelected).map(Number);
    _produkData.forEach(function(r) {
      if (selIds.indexOf(r.id) < 0) return;
      const kb = String(r.boss || '').trim().toUpperCase();
      if (kb) { const o = peran[kb] || (peran[kb] = { u: 0, c: 0 }); o.u++; }
      _produkCadRows(r).forEach(function(c) { const kc = String(c.sup.nama || '').trim().toUpperCase(); const o = peran[kc] || (peran[kc] = { u: 0, c: 0 }); o.c++; });
    });
  }
  let html = filtered.map(function(s) {
    const nama = (s.nama||'').replace(/'/g, "\\'");
    const pr = peran[String(s.nama || '').trim().toUpperCase()];
    const prTxt = pr ? (pr.u ? 'utama ' + pr.u + ' SKU' : '') + (pr.u && pr.c ? ' · ' : '') + (pr.c ? 'cadangan ' + pr.c + ' SKU' : '') : '';
    return '<div class="jp-sheet-item" onclick="produkBossSheetSelect(\'' + nama + '\')">' +
      '<span>' + (s.nama||'') + '</span>' +
      '<span style="margin-left:8px">' + _produkSupChips(s) + '</span>' +
      (prTxt ? '<span style="margin-left:auto;font-size:11px;color:var(--ink3)">' + prTxt + '</span>' : '') +
    '</div>';
  }).join('');

  // Kalau query gak persis match supplier manapun yg udah ada, kasih opsi
  // tambah baru — biar user gak kepentok kalau supplier-nya emang belum ada.
  if (query && !_produkBossSheetTarget.filter && !_produkSupplierList.some(s => (s.nama||'').toUpperCase() === query)) {
    html += '<div class="jp-sheet-item" style="color:var(--ok);font-weight:700" onclick="produkBossSheetTambahBaru(\'' + query.replace(/'/g,"\\'") + '\')">' +
      '<i class="ti ti-plus" style="margin-right:2px"></i> Tambah supplier "' + query + '"</div>';
  }

  if (!html) {
    html = _produkBossSheetTarget.filter ? '<div class="jp-sheet-empty">Tidak ada supplier yang cocok.</div>' : '<div class="jp-sheet-empty">Belum ada supplier. Ketik nama buat nambah baru.</div>';
  }
  listEl.innerHTML = histHtml + html;
}

function produkBossSheetSelect(nama) {
  zHistPush('produk_boss', nama); // riwayat sering/terakhir dipakai
  const inputEl = document.getElementById(_produkBossSheetTarget.inputId);
  const labelEl = document.getElementById(_produkBossSheetTarget.labelId);
  if (inputEl) inputEl.value = nama;
  if (labelEl) { labelEl.textContent = nama; labelEl.style.color = 'var(--ink)'; }
  produkBossSheetClose();
  if (_produkBossSheetTarget.inputId === 'prd-boss') produkPrdSyncDual();   // 2 harga untuk supplier 2 sistem
  if (_produkBossSheetTarget.inputId === 'kat-boss') produkKatSyncDs();   // tampilkan/sembunyikan opsi Dropship sesuai jenis supplier
  if (_produkBossSheetTarget.inputId === 'batch-sup-input') produkBatchSupSyncSistem();   // toggle Sistem di Edit Supplier massal
  if (_produkBossSheetTarget.inputId === 'prd-cad') produkPrdCadSync();   // kolom harga cadangan di form Tambah SKU
}

async function produkBossSheetTambahBaru(nama) {
  try {
    const created = await dbInsert('hutang_supplier', { nama: nama.toUpperCase() });
    const row = Array.isArray(created) ? created[0] : created;
    _produkSupplierList.push(row);
    _produkSupplierList.sort(function(a,b){ return (a.nama||'').localeCompare(b.nama||''); });
    produkBossSheetSelect(row.nama);
  } catch(e) {
    alert('Gagal tambah supplier baru: ' + e.message);
  }
}

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
