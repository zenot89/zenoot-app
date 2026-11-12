

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
    <button class="produk-btn-pill produk-btn-danger" id="produk-btn-hapus" onclick="produkHapusTerpilih()" style="opacity:.4" disabled><i class="ti ti-trash"></i> Hapus</button>
    <button class="produk-btn-pill produk-btn-cancel" id="produk-btn-done" onclick="produkExitEditMode()">Batalkan</button>
  </div>

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
    <div class="modal" style="max-width:520px">
      <div class="modal-title"><i class="ti ti-clipboard"></i> Paste Massal SKU</div>
      <div style="font-size:12px;color:var(--ink3);margin-bottom:10px;line-height:1.6">
        Copy dari Excel lalu paste di bawah.<br>
        Urutan kolom: <b>Katalog → SKU Variasi → HPP → Boss</b><br>
        Supplier 2 sistem (P.O + Dropship), tambah 2 kolom di kanan: <b>→ Harga P.O → Harga Dropship</b> (per pcs; kolom HPP boleh dikosongkan)
      </div>
      <textarea id="paste-area-produk"
        style="width:100%;height:180px;font-family:var(--f);font-size:13px;padding:8px;border:2px solid var(--ink);background:var(--cream);color:var(--ink);resize:vertical;outline:none"
        placeholder="Paste di sini..."></textarea>
      <div id="paste-produk-preview" style="margin-top:10px;display:none">
        <div style="font-size:12px;font-weight:700;color:var(--ink3);margin-bottom:6px" id="paste-produk-count"></div>
        <div class="tbl-wrap" style="max-height:160px;overflow-y:auto">
          <table class="tbl"><thead><tr><th>Katalog</th><th>SKU Variasi</th><th>HPP</th><th>Boss</th><th>P.O / Dropship</th><th>Status</th></tr></thead>
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
let _produkHbList = [];       // hutang_barang (id, produk_id, supplier_id, harga_per_lusin, harga_po_per_lusin) — harga P.O & Dropship SKU supplier 2 sistem

async function loadProduk() {
  const tbody = document.getElementById('produk-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>';
  try {
    // [30 Sep 2026] daftar supplier dimuat bareng produk: badge "Dropship" butuh flag sistem supplier saat render
    const [data, hbList] = await Promise.all([
      dbGet('produk'), _produkLoadSupplierList(),
      dbGet('hutang_barang', '&select=id,produk_id,supplier_id,harga_per_lusin,harga_po_per_lusin').catch(function() { return []; })   // 3 Nov 2026: 2 harga SKU supplier 2 sistem
    ]);
    _produkHbList = Array.isArray(hbList) ? hbList : [];
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

var _PRODUK_SISTEM_META = {
  produksi: { label: 'Produksi Sendiri', color: 'var(--ok)'   },
  reseller: { label: 'Reseller',         color: 'var(--info)' },
  dropship: { label: 'Dropship',         color: 'var(--warn)' }
};

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
  rows.forEach(function(r) { var k = _produkSistemOf(r) || '-'; cnt[k] = (cnt[k] || 0) + 1; });
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
  var key = _produkSistemOf(row);
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
  var cur = eff || null;   // sistem yang berlaku sekarang (baris lama yang masih kosong ditampilkan sesuai aturan supplier)
  var effM = _PRODUK_SISTEM_META[eff];
  var boss = row.boss || '—';
  var rows = _PRODUK_SISTEM_OPSI.map(function(o, i) {
    var on = (cur === o.k);
    var desc = o.k === 'dropship' ? 'Tidak disetok. Bon dropship dicatat ke supplier ' + _pkEsc(boss) + '.' : o.d;
    return '<div class="pk-sis-row' + (on ? ' on' : '') + '" onclick="produkSistemPick(' + i + ')">'
      + '<div class="pk-sis-rtxt"><div class="pk-sis-rl">' + o.l + '</div><div class="pk-sis-rd">' + desc + '</div></div>'
      + '<span class="pk-sis-tg"></span></div>';
  }).join('');
  var sh = document.getElementById('pk-sis-sheet');
  sh.innerHTML = '<div class="pk-sis-handle"></div>'
    + '<div class="pk-sis-title">' + _pkEsc(row.sku_variasi) + '</div>'
    + '<div class="pk-sis-sub">Sekarang: <b>' + (effM ? effM.label : 'Belum diatur') + '</b> · Supplier: ' + _pkEsc(boss) + '</div>'
    + rows + _produkPadananRow(row, eff);
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

// ── PADANAN DROPSHIP (3 Nov 2026) ─────────────────────────────
// SKU stok biasa (Reseller / Produksi Sendiri) boleh punya "padanan" = SKU berstatus Dropship yang dicatat saat penjualan dikirim via dropship
// (tombol "Kirim via ..." di Tambah Penjualan). Disimpan di produk.padanan_dropship_id; tidak ada pasangan yang ditebak dari nama.
// Supplier Dropship + Reseller boleh tanpa pengaturan ini: SKU padanannya dibuat otomatis saat pertama dipakai (jurnal-penjualan.js).
function _produkPadananRow(row, eff) {
  if (eff === 'dropship') return '';
  var tw = row.padanan_dropship_id ? (_produkData || []).find(function(r) { return r.id === row.padanan_dropship_id; }) : null;
  var ket = tw ? _pkEsc(tw.sku_variasi) + ' · ' + _pkEsc(tw.boss || '—') : 'Belum diatur — dipakai tombol "Kirim via dropship" di Tambah Penjualan.';
  return '<div class="pk-sis-row" onclick="produkPadananOpen()">'
    + '<div class="pk-sis-rtxt"><div class="pk-sis-rl">Padanan Dropship</div><div class="pk-sis-rd">' + ket + '</div></div>'
    + '<i class="ti ti-chevron-right" style="color:var(--ink3)"></i></div>';
}

function produkPadananOpen() {
  var row = (_produkData || []).find(function(r) { return String(r.id) === String(_pkSisId); });
  var sh = document.getElementById('pk-sis-sheet');
  if (!row || !sh) return;
  sh.innerHTML = '<div class="pk-sis-handle"></div>'
    + '<div class="pk-sis-title">Padanan Dropship</div>'
    + '<div class="pk-sis-sub"><b>' + _pkEsc(row.sku_variasi) + '</b> — pilih SKU dropship yang dicatat saat dikirim via dropship</div>'
    + '<div style="padding:10px 18px 6px"><input type="text" id="pk-pad-search" placeholder="Cari SKU / supplier..." autocomplete="off" oninput="produkPadananRender()" '
    + 'style="width:100%;box-sizing:border-box;font-family:var(--f);font-size:14px;padding:8px 10px;border:2px solid var(--ink);background:var(--cream);color:var(--ink)"></div>'
    + '<div id="pk-pad-list"></div>'
    + '<div class="pk-sis-row" onclick="produkSistemSheetOpen(_pkSisId)"><div class="pk-sis-rtxt"><div class="pk-sis-rl">Kembali</div></div></div>';
  produkPadananRender();
}

function produkPadananRender() {
  var row = (_produkData || []).find(function(r) { return String(r.id) === String(_pkSisId); });
  var box = document.getElementById('pk-pad-list');
  if (!row || !box) return;
  var q = String((document.getElementById('pk-pad-search') || {}).value || '').trim().toLowerCase();
  var list = (_produkData || []).filter(function(r) {
    if (r.id === row.id || _produkSistemOf(r) !== 'dropship') return false;
    return !q || (String(r.sku_variasi || '') + ' ' + String(r.boss || '')).toLowerCase().indexOf(q) !== -1;
  }).sort(function(a, b) { return String(a.sku_variasi || '').localeCompare(String(b.sku_variasi || ''), 'id'); });
  var html = '';
  if (row.padanan_dropship_id) {
    html += '<div class="pk-sis-row" onclick="produkPadananPick(null)"><div class="pk-sis-rtxt"><div class="pk-sis-rl" style="color:var(--danger)">Hapus padanan</div>'
      + '<div class="pk-sis-rd">Tombol "Kirim via dropship" tidak muncul untuk SKU ini (kecuali supplier-nya Dropship + Reseller).</div></div></div>';
  }
  if (!list.length) html += '<div class="pk-sis-sub" style="padding:14px 18px">Belum ada SKU berstatus Dropship yang cocok.</div>';
  html += list.slice(0, 60).map(function(r) {
    var on = (row.padanan_dropship_id === r.id);
    return '<div class="pk-sis-row' + (on ? ' on' : '') + '" onclick="produkPadananPick(' + r.id + ')">'
      + '<div class="pk-sis-rtxt"><div class="pk-sis-rl">' + _pkEsc(r.sku_variasi) + '</div><div class="pk-sis-rd">' + _pkEsc(r.boss || '—') + ' · HPP Rp' + (Number(r.hpp) || 0).toLocaleString('id-ID') + '</div></div>'
      + '<span class="pk-sis-tg"></span></div>';
  }).join('');
  if (list.length > 60) html += '<div class="pk-sis-sub" style="padding:10px 18px">Menampilkan 60 pertama — persempit pencarian.</div>';
  box.innerHTML = html;
}

async function produkPadananPick(id) {
  var row = (_produkData || []).find(function(r) { return String(r.id) === String(_pkSisId); });
  if (!row) { produkSistemSheetClose(); return; }
  try {
    await dbUpdate('produk', row.id, { padanan_dropship_id: id == null ? null : id });
    row.padanan_dropship_id = id == null ? null : id;
    produkMarkDirty();
    produkSistemSheetClose();
    renderProduk(_produkData);
  } catch (e) {
    var msg = (e && e.message) || String(e);
    alert('Gagal simpan padanan dropship: ' + msg + (/padanan_dropship_id/i.test(msg) ? '\n\nKolom belum ada — jalankan zenoot-padanan-dropship.sql di Supabase dulu.' : ''));
  }
}

function _produkYmdHariIni() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Cap produk.dropship_mulai di payload SKU yang sistemnya DIGANTI (3 Nov 2026): ke Dropship → hari ini (kalau sebelumnya bukan Dropship), keluar dari
// Dropship → dikosongkan. Dipakai semua jalur yang mengubah sistem_override SKU yang sudah ada, supaya bon dropship tidak ditarik mundur ke penjualan lama.
// SKU baru (row kosong) tidak dicap: belum punya riwayat.
function _produkStampDropshipMulai(payload, row) {
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

async function produkSistemPick(i) {
  var o = _PRODUK_SISTEM_OPSI[i];
  if (!o || _pkSisId == null) return;
  var row = (_produkData || []).find(function(r) { return String(r.id) === String(_pkSisId); });
  if (!row) { produkSistemSheetClose(); return; }
  var val = o.k;   // selalu 'dropship' | 'reseller' | 'produksi' — tidak ada lagi "ikuti supplier"
  // 30 Okt 2026: pilihan SELALU disimpan eksplisit di sistem_override (normalisasi ke null yang dibuat pagi ini dicabut).
  // Baris lama yang masih kosong lalu dipilih sistem yang sama dgn tampilannya juga tersimpan eksplisit.
  if (row.sistem_override === val) { produkSistemSheetClose(); return; }
  var payload = { sistem_override: val };
  _produkStampDropshipMulai(payload, row);   // 3 Nov 2026: penjualan sebelum hari ini tidak ditarik mundur ke bon dropship
  // 3 Nov 2026: SKU supplier 2 sistem → HPP otomatis ikut harga sistem barunya (Dropship → harga Dropship, Reseller → harga P.O) dari Master Barang.
  // Harga yang belum diisi → HPP dibiarkan. Supplier 1 sistem tidak disentuh.
  try {
    if (_produkSupDualByName(row.boss)) {
      var hargaBaru = await _produkHargaSistem(row, val);
      if (hargaBaru > 0 && hargaBaru !== (Number(row.hpp) || 0)) payload.hpp = hargaBaru;
    }
  } catch (eHarga) { console.warn('[produk] cek harga sistem gagal:', eHarga && eHarga.message); }
  try {
    await dbUpdate('produk', row.id, payload);
    Object.keys(payload).forEach(function(k) { row[k] = payload[k]; });
    produkMarkDirty();
    produkSistemSheetClose();
    renderProduk(_produkData);
  } catch (e) {
    var msg = (e && e.message) || String(e);
    alert('Gagal simpan sistem: ' + msg + (/dropship_mulai/i.test(msg) ? '\n\nKolom belum ada — jalankan zenoot-padanan-dropship.sql di Supabase dulu.' : ''));
  }
}

function renderProduk(data) {
  const tbody = document.getElementById('produk-tbody');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Belum ada data produk</td></tr>';
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
      <div style="font-size:10px;color:var(--ink3);margin-top:2px">Supplier</div>
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
            <td>${row.boss || '—'}</td>
            <td>${_produkSistemBtn(row)}</td>
          </tr>`;
        } else {
          html += `<tr data-kat="${kat}" style="background:var(--cream)">
            <td style="padding-left:24px">
              <b>${row.sku_variasi}</b>
            </td>
            <td>${_produkHppVarianHtml(row)}</td>
            <td>${row.boss || '—'}</td>
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
  ['produk-btn-hapus','produk-btn-hpp','produk-btn-sis','produk-btn-sup','produk-btn-exp'].forEach(function(id) {
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
    ((_PRODUK_SISTEM_META[_produkSistemOf(r)] || {}).label || '').toLowerCase().includes(q)
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
  const lbl = document.getElementById('prd-boss-label');
  if (lbl) {
    if (r.boss) { lbl.textContent = r.boss; lbl.style.color = 'var(--ink)'; }
    else        { lbl.textContent = '— Pilih Supplier —'; lbl.style.color = 'var(--ink3)'; }
  }
  idrInput('prd-harga-po'); idrInput('prd-harga-ds');
  var _dd = _produkHargaDualOf(r);
  idrSet('prd-harga-po', _dd ? _dd.po : 0); idrSet('prd-harga-ds', _dd ? _dd.ds : 0);
  produkPrdSyncDual();
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

  const skuNormNew = _produkSkuNorm(data.sku_variasi);
  const dup = _produkData.find(d => d.id != id && _produkSkuNorm(d.sku_variasi) === skuNormNew);
  if (dup) {
    alert(`SKU Variasi "${data.sku_variasi}" sudah ada di Kelola Produk (katalog: ${dup.katalog}). Edit baris yang sudah ada, bukan bikin baru.`);
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
      if (supDual) await _produkUpsertHargaDual({ id: old ? old.id : Number(id), katalog: data.katalog, sku_variasi: data.sku_variasi }, supDual, poIn, dsIn);
    } else {
      const sisAwal = _produkSistemDefault(data.boss);
      if (sisAwal) data.sistem_override = sisAwal;
      if (supDual) data.hpp = _produkHppDual(sisAwal, poIn, dsIn, 0);
      const insP = await dbInsert('produk', data);
      const rowP = Array.isArray(insP) ? insP[0] : insP;
      if (supDual && rowP && rowP.id != null) await _produkUpsertHargaDual({ id: rowP.id, katalog: data.katalog, sku_variasi: data.sku_variasi }, supDual, poIn, dsIn);
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

let _parsedProduk = [];

function parsePasteProduk() {
  const raw = document.getElementById('paste-area-produk').value.trim();
  if (!raw) { alert('Paste data dulu!'); return; }

  _parsedProduk = [];
  const lines = raw.split('\n');
  const knownSupplier = {}; // Set nama supplier yg udah ada di hutang_supplier — buat deteksi "baru"
  (_produkSupplierList || []).forEach(s => { knownSupplier[(s.nama||'').toUpperCase()] = true; });

  // Cegah SKU Variasi duplikat (22 Sep 2026) — cek ke SKU yang udah ada di Kelola Produk SEKARANG,
  // dan ke baris lain di batch paste yang sama (kalau user gak sengaja paste dobel). Case/spasi diabaikan.
  const existingSku = new Set((_produkData || []).map(d => _produkSkuNorm(d.sku_variasi)));
  const seenInBatch = new Set();

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
    // 3 Nov 2026: kolom 5 & 6 (opsional) = Harga P.O & Harga Dropship per pcs, dipakai hanya kalau boss supplier 2 sistem
    const hargaPo = parseInt((cols[4]||'').replace(/[^0-9]/g,'')) || 0;
    const hargaDs = parseInt((cols[5]||'').replace(/[^0-9]/g,'')) || 0;
    // 7 Sep 2026: root cause "Lainnya"/drift yg kita fix minggu ini juga
    // berlaku di sini — paste massal itu 1-1 nya jalur input Boss yang
    // masih bebas ketik (gak lewat picker). Ditandai "baru" di preview
    // biar user sadar, terus di-auto-create ke hutang_supplier pas simpan
    // (bukan dibiarin nyimpang diam-diam kayak sebelumnya).
    const bossIsNew = !!boss && !knownSupplier[boss];

    if (!sku) continue;

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
    _parsedProduk.push({ katalog: katalog.toUpperCase(), sku_variasi: sku, hpp: hppEf, boss, bossIsNew, isDup, dual: !!dualSup, po, ds });
  }

  if (_parsedProduk.length === 0) {
    alert('Tidak ada data yang bisa dibaca. Pastikan copy dari Excel dengan format: Katalog → SKU → HPP → Boss');
    return;
  }

  // Render preview — baris duplikat ditampilin (biar keliatan mana yang di-skip) tapi gak ikut disimpan
  const dupCount = _parsedProduk.filter(r => r.isDup).length;
  const newBossCount = _parsedProduk.filter(r => r.bossIsNew && !r.isDup).length;
  document.getElementById('paste-produk-count').innerHTML =
    `✓ ${_parsedProduk.length - dupCount} SKU siap diimport` +
    (dupCount ? ` — <span style="color:var(--danger)">${dupCount} dilewati (SKU Variasi sudah ada)</span>` : '') +
    (newBossCount ? ` — <span style="color:var(--warn)">${newBossCount} pakai supplier baru, bakal otomatis ditambahin ke Kelola Supplier (mode Dropship, bisa diedit nanti)</span>` : '');
  document.getElementById('paste-produk-tbody').innerHTML = _parsedProduk.map(r => `
    <tr${r.isDup ? ' style="opacity:.5"' : ''}>
      <td>${r.katalog}</td>
      <td>${r.sku_variasi}</td>
      <td>Rp${r.hpp.toLocaleString('id-ID')}</td>
      <td>${r.boss||'—'}${r.bossIsNew ? ' <span style="font-size:10px;color:var(--warn);border:1px solid var(--warn);border-radius:4px;padding:1px 4px">baru</span>' : ''}</td>
      <td style="font-size:12px">${r.dual ? ('P.O ' + (r.po ? 'Rp' + r.po.toLocaleString('id-ID') : '—') + '<br>DS ' + (r.ds ? 'Rp' + r.ds.toLocaleString('id-ID') : '—')) : '—'}</td>
      <td>${r.isDup ? '<span style="font-size:11px;color:var(--danger)">duplikat</span>' : '<span style="font-size:11px;color:var(--ok)">✓ lolos</span>'}</td>
    </tr>`).join('');
  document.getElementById('paste-produk-preview').style.display = 'block';
  document.getElementById('btn-simpan-paste-produk').style.display = (dupCount < _parsedProduk.length) ? 'inline-block' : 'none';
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
    const rowsToSave = _parsedProduk.filter(r => !r.isDup);
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
      if (row.dual) {   // 2 harga supplier 2 sistem → Master Barang
        const rowPP = Array.isArray(insPP) ? insPP[0] : insPP;
        const supPP = _produkSupDualByName(row.boss);
        if (rowPP && rowPP.id != null && supPP) await _produkUpsertHargaDual({ id: rowPP.id, katalog: row.katalog, sku_variasi: row.sku_variasi }, supPP, row.po, row.ds);
      }
      ok++;
      btn.textContent = `Menyimpan ${ok}/${rowsToSave.length}...`;
    }
    closeModal('modal-paste-produk');
    loadProduk();
    const dupSkipped = _parsedProduk.length - rowsToSave.length;
    alert(`✓ ${ok} SKU berhasil disimpan!` +
      (dupSkipped ? `\n⚠ ${dupSkipped} SKU dilewati karena sudah ada di Kelola Produk` : '') +
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
    ['Katalog','SKU Variasi','HPP','Boss','Harga P.O','Harga Dropship'],
    _produkData.map(r => { const d = _produkHargaDualOf(r); return [r.katalog, r.sku_variasi, r.hpp, r.boss, d ? d.po : '', d ? d.ds : '']; })
  );
}

// ── BATCH: Export terpilih ────────────────────────────────────
function produkExportTerpilih() {
  const ids = Object.keys(_produkSelected).map(Number);
  if (!ids.length) return;
  const rows = _produkData.filter(r => ids.includes(r.id));
  exportCSV('zenoot-produk-terpilih.csv',
    ['Katalog','SKU Variasi','HPP','Boss','Harga P.O','Harga Dropship'],
    rows.map(r => { const d = _produkHargaDualOf(r); return [r.katalog, r.sku_variasi, r.hpp, r.boss, d ? d.po : '', d ? d.ds : '']; })
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
    if (x.sis === 'dropship') n.ds = true; else if (x.sis === 'reseller') n.rs = true;
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
    await dbUpdate('hutang_supplier', n.sup.id, pl);
    Object.keys(pl).forEach(function(k) { n.sup[k] = pl[k]; });
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
var _bsSis = '';
function produkBatchSistem() {
  var ids = Object.keys(_produkSelected).map(Number);
  if (!ids.length) return;
  _bsSis = '';
  document.getElementById('bs-count').textContent = ids.length + ' SKU terpilih';
  _bsRender();
  showModal('modal-batch-sis');
}
function produkBsPick(k) { _bsSis = k; _bsRender(); }
function _bsRows() { var ids = Object.keys(_produkSelected).map(Number); return _produkData.filter(function(r) { return ids.indexOf(r.id) >= 0; }); }
function _bsRender() {
  document.getElementById('bs-opts').innerHTML = _PRODUK_SISTEM_OPSI.map(function(o) {
    var l = o.k === 'reseller' ? 'P.O (Reseller)' : o.l;
    return '<div class="pk-sis-row' + (_bsSis === o.k ? ' on' : '') + '" style="border-radius:8px" onclick="produkBsPick(\'' + o.k + '\')">'
      + '<div class="pk-sis-rtxt"><div class="pk-sis-rl">' + l + '</div><div class="pk-sis-rd">' + o.d + '</div></div><span class="pk-sis-tg"></span></div>';
  }).join('');
  var note = '';
  if (_bsSis) {
    var rows = _bsRows();
    var items = rows.map(function(r) { var s = _bhSupOf(r); return { sup: s, sis: _bsSis, lock: !!(s && s.is_produksi_sendiri) }; });
    var skip = items.filter(function(x) { return x.lock && _bsSis !== 'produksi'; }).length;
    var notes = _bsSis === 'produksi' ? [] : _produkSinkronCatatan(items);
    note = (_bsSis === 'produksi' ? 'HPP tidak diubah — atur lewat Edit HPP.' : 'HPP tiap SKU mengikuti harga ' + (_bsSis === 'dropship' ? 'Dropship' : 'P.O') + ' di Master Barang (kalau harganya sudah ada).')
      + (skip ? '<br>⚠ ' + skip + ' SKU supplier Produksi Sendiri dilewati (tidak bisa Dropship / P.O).' : '')
      + (notes.length ? '<br><i class="ti ti-refresh"></i> Sinkron ke Channel › Supplier &amp; ROP: ' + notes.join(' · ') + ' akan diaktifkan.' : '');
  }
  document.getElementById('bs-note').innerHTML = note;
}
async function simpanBatchSistem() {
  if (!_bsSis) { alert('Pilih sistemnya dulu'); return; }
  var rows = _bsRows(), items = [], skip = 0, ubah = 0;
  var btn = document.getElementById('bs-btn-simpan');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  try {
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], sup = _bhSupOf(r), lock = !!(sup && sup.is_produksi_sendiri);
      if (lock && _bsSis !== 'produksi') { skip++; continue; }
      items.push({ sup: sup, sis: _bsSis, lock: lock });
      if (r.sistem_override === _bsSis) continue;
      var payload = { sistem_override: _bsSis };
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
    alert('Gagal: ' + (err && err.message || err) + '\n\nSebagian SKU mungkin sudah tersimpan — periksa tabelnya.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-check"></i> Simpan'; }
  }
}

// ── BATCH: Edit Supplier massal ───────────────────────────────
function produkBatchSupplier() {
  const ids = Object.keys(_produkSelected).map(Number);
  if (!ids.length) return;
  document.getElementById('batch-sup-count').textContent = ids.length + ' SKU terpilih';
  document.getElementById('batch-sup-input').value = '';
  const lbl = document.getElementById('batch-sup-label');
  if (lbl) { lbl.textContent = '— Pilih Supplier —'; lbl.style.color = 'var(--ink3)'; }
  produkBatchSupSyncSistem();   // reset: toggle Sistem tersembunyi sampai supplier Dropship + Reseller dipilih
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


function produkBatchSupSyncSistem() {
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

async function simpanBatchSupplier() {
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
    <p id="batch-sup-count" style="font-size:12px;color:var(--ink3);margin-bottom:12px">0 SKU terpilih</p>
    <div class="form-group" style="margin-bottom:14px">
      <label>Nama Supplier Baru</label>
      <button type="button" class="produk-boss-trigger" onclick="produkOpenBossSheet('batch-sup-input','batch-sup-label')">
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
let _produkBossSheetTarget = { inputId: '', labelId: '' };

async function _produkLoadSupplierList() {
  try {
    _produkSupplierList = await dbGet('hutang_supplier', '&order=nama.asc');
    if (!Array.isArray(_produkSupplierList)) _produkSupplierList = [];
  } catch(e) {
    console.warn('Gagal load daftar supplier:', e.message);
    _produkSupplierList = [];
  }
}

function produkOpenBossSheet(inputId, labelId) {
  _produkBossSheetTarget = { inputId: inputId, labelId: labelId };
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
  const filtered = _produkSupplierList.filter(s => (s.nama||'').toUpperCase().includes(query));

  // "Sering & Terakhir Digunakan" — cuma pas search kosong (zHistTop di app.js)
  let histHtml = '';
  if (!query) {
    const topNama = zHistTop('produk_boss', 5).filter(function(n) { return _produkSupplierList.some(function(s) { return s.nama === n; }); });
    if (topNama.length) {
      histHtml = '<div style="font-size:11px;font-weight:700;color:var(--ink3);padding:10px 10px 2px;letter-spacing:.06em;display:flex;align-items:center;gap:5px"><i class="ti ti-clock" style="font-size:12px"></i> Sering & Terakhir Digunakan</div>' +
        topNama.map(function(n) {
          return '<div class="jp-sheet-item" onclick="produkBossSheetSelect(\'' + n.replace(/'/g, "\\'") + '\')"><span>' + n + '</span></div>';
        }).join('') +
        '<div style="font-size:11px;font-weight:700;color:var(--ink3);padding:10px 10px 2px;letter-spacing:.06em">── Semua Supplier ──</div>';
    }
  }

  let html = filtered.map(function(s) {
    const nama = (s.nama || '').replace(/'/g, "\\'");
    return '<div class="jp-sheet-item" onclick="produkBossSheetSelect(\'' + nama + '\')">' +
      '<span>' + (s.nama||'') + '</span>' +
      (s.is_reseller ? '<span style="font-size:10px;color:var(--ink3);border:1px solid var(--ink4);border-radius:4px;padding:1px 5px">PO</span>' : '') +
    '</div>';
  }).join('');

  // Kalau query gak persis match supplier manapun yg udah ada, kasih opsi
  // tambah baru — biar user gak kepentok kalau supplier-nya emang belum ada.
  if (query && !_produkSupplierList.some(s => (s.nama||'').toUpperCase() === query)) {
    html += '<div class="jp-sheet-item" style="color:var(--ok);font-weight:700" onclick="produkBossSheetTambahBaru(\'' + query.replace(/'/g,"\\'") + '\')">' +
      '<i class="ti ti-plus" style="margin-right:2px"></i> Tambah supplier "' + query + '"</div>';
  }

  if (!html) {
    html = '<div class="jp-sheet-empty">Belum ada supplier. Ketik nama buat nambah baru.</div>';
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
