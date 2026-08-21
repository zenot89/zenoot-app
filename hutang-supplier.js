

// ─── HUTANG-SUPPLIER.JS — Bon barang ke supplier + Master Barang ───
// Modul BERDIRI SENDIRI (tidak share fungsi/CSS dengan kas.js atau gadag.js —
// pelajaran dari insiden kas/gadag: modul terpisah = fix satu modul gak bisa
// ngerusak modul lain). Satu-satunya titik singgung ke luar:
//   1. Pas user bayar → insert 1 baris ke tabel `jurnal` (tipe 'keluar'),
//      kolom PERSIS sama kayak yang dipakai kas.js, tapi logic/validasi
//      ditulis ulang sendiri (bukan manggil fungsi internal kas.js).
//   2. Master Barang → katalog_produk diambil dari tabel `produk` (dropdown,
//      read-only, gak nulis balik ke situ).
//
// Konsep 2 tab:
//   - "Bon"           : transaksi ambil barang (utang), item-nya WAJIB pilih
//                       dari Master Barang milik supplier yang sama.
//   - "Master Barang" : katalog SKU Induk (gua) × Varian Warna × Nama versi
//                       Supplier × Harga per Lusin — harga beda per supplier,
//                       jadi 1 baris master = 1 kombinasi supplier+barang.
//
// Tabel: hutang_supplier, hutang_barang, hutang_bon, hutang_bon_item,
// hutang_pembayaran (lihat migration SQL terpisah).

// ─── FONT "Comic Neue" (tema notebook, sama kayak Gadag) — di-load via <link>,
// bukan @import (@import di tengah <style> block ke-skip diem-diem sama browser).
// ID guard SENGAJA sama persis kayak punya gadag.js — biar dedupe: siapapun
// yang lebih dulu ke-load, modul yang satunya nemu link ini udah ada & skip.
(function() {
  if (document.getElementById('gdg-font-comic-neue')) return;
  var link = document.createElement('link');
  link.id   = 'gdg-font-comic-neue';
  link.rel  = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap';
  document.head.appendChild(link);
})();

document.getElementById('page-hutang-supplier').innerHTML = `
  <div id="ops-switcher-hs" class="ch-switcher"></div>

  <style>
    /* ═══ TEMA NOTEBOOK (samain kayak Gadag) ═══════════════════════════
       Modul ini beda pendekatan dari gadag.js: SEMUA class .hs-* di sini
       udah pakai var(--ink)/var(--cream)/var(--f) dkk (variabel GLOBAL),
       bukan warna hex hardcoded. Jadi override-nya CUKUP redefine variabel
       itu di scope #page-hutang-supplier — otomatis nge-cascade ke SEMUA
       elemen turunannya (card, tombol, sheet, form) TANPA perlu override
       tiap class satu-satu kayak di gadag.js (yang emang perlu vars custom
       --gdg-* sendiri karena banyak makein class GLOBAL style.css yang
       udah hardcode var(--ink)/var(--cream) versi dark-theme).
       Sheet/modal di modul ini juga literally nempel di dalem innerHTML
       #page-hutang-supplier (bukan di-append ke document.body kayak di
       modul lain), jadi warisan CSS var ini otomatis ikut sampe ke sana. */
    #page-hutang-supplier {
      --ink:    #262220;   /* tinta pena, hampir hitam */
      --ink2:   #5c554d;   /* tinta pudar, teks sekunder */
      --ink3:   #8a8277;   /* tinta lebih pudar lagi, label/meta */
      --ink4:   rgba(38,34,32,.16); /* border tipis ala garis buku */
      --cream:  #f7f2e6;   /* kertas krem */
      --cream2: #efe8d8;   /* kertas krem, dikit lebih gelap (card) */
      --cream3: #e5dcc8;   /* satu tingkat lagi (dipake tabel preview) */
      --cream4: #fffdf8;   /* paling terang (hover) */
      --danger: #b5453d;   /* merah dark-theme kepucetan di atas krem */
      --info:   #2f6fb0;
      --f:  'Comic Neue', 'Comic Sans MS', cursive, sans-serif;
      --f2: 'Comic Neue', 'Comic Sans MS', cursive, sans-serif;
      background: var(--cream); color: var(--ink);
    }
    #page-hutang-supplier *:not(i):not(.ti) { font-family: var(--f) !important; }

    /* Full-height chain, pola sama persis kayak #page-gadag — biar panel
       (Bon/Master Barang) scroll internal sendiri2, bukan ngedorong tinggi
       seluruh layar. 'hutang-supplier' udah terdaftar di fullHeightPages
       (app.js) jadi .content udah flex-column duluan; tinggal sambungin. */
    #page-hutang-supplier.active { display:flex !important; flex-direction:column !important; }
    #page-hutang-supplier { flex:1 1 0; min-height:0; height:100%; padding:10px; box-sizing:border-box; overflow:hidden; }
    #hs-hdr-row, #hs-supplier-row, .hs-toolbar { flex-shrink:0; }
    #hs-panels-wrap { flex:1 1 0; min-height:0; display:flex; flex-direction:column; }
    .hs-panel { display:none; min-height:0; }
    .hs-panel.active { display:flex; flex-direction:column; flex:1 1 0; min-height:0; overflow-y:auto; }

    /* Kertas bergaris — feel "buku tulis" di belakang list Bon & Master Barang */
    #hs-bon-list, #hs-master-list {
      background-image: repeating-linear-gradient(
        to bottom, transparent, transparent 37px, var(--ink4) 37px, var(--ink4) 38px
      );
    }

    /* ── Header: judul panel + dropdown menu (desktop) / dot notch (mobile) ── */
    #hs-hdr-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; flex-wrap:nowrap; gap:8px; }
    #hs-hdr-left { display:flex; align-items:center; gap:6px; min-width:0; flex:1 1 auto; overflow:hidden; }
    #hs-hdr-refresh { flex:none; background:none; border:none; padding:2px; cursor:pointer; font-size:20px; line-height:1; color:var(--ink); }
    #hs-hdr-icon { font-size:20px; flex:none; }
    #hs-hdr-heading { font-size:20px; font-weight:800; letter-spacing:.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
    .hs-menu-wrap { position:relative; flex:none; }
    #hs-menu-btn { display:flex; align-items:center; gap:6px; }
    .hs-dropdown-menu {
      display:none; position:absolute; top:calc(100% + 6px); right:0; min-width:190px;
      background:var(--cream); border:2px solid var(--ink); border-radius:12px;
      box-shadow:2px 3px 0 rgba(38,34,32,0.15); overflow:hidden; z-index:60;
    }
    .hs-dropdown-menu.open { display:block; }
    .hs-dropdown-menu button {
      display:flex; align-items:center; gap:8px; width:100%; text-align:left;
      padding:10px 14px; background:none; border:none; border-bottom:1px solid var(--ink4);
      font-family:var(--f); font-size:13.5px; font-weight:700; color:var(--ink); cursor:pointer;
    }
    .hs-dropdown-menu button:last-child { border-bottom:none; }
    .hs-dropdown-menu button:hover { background:rgba(38,34,32,.06); }
    .hs-dropdown-menu button.active { background:var(--ink); color:var(--cream) !important; }
    .hs-page-dots { display:none; }
    @media (max-width:900px) {
      .hs-page-dots { display:flex; align-items:center; gap:6px; flex:none; }
      .hs-page-dot { width:6px; height:6px; border-radius:50%; background:var(--ink); opacity:.35; transition:all .18s ease; cursor:pointer; }
      .hs-page-dot.active { width:16px; border-radius:3px; opacity:1; }
      .hs-menu-wrap { display:none; }
    }

    .hs-toolbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:12px; }
    .hs-btn-pill    { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:20px; font-family:var(--f); font-size:13px; font-weight:600; cursor:pointer; border:none; }
    .hs-btn-primary { background:var(--ink); color:var(--cream); }
    .hs-btn-ghost   { background:none; color:var(--ink2); border:1px solid var(--ink3); }
    .hs-btn-danger  { background:none; color:var(--danger); border:1px solid var(--danger); }

    /* ── Kartu ringkasan per supplier — scroll horizontal, tap buat filter ── */
    #hs-supplier-row { display:flex; gap:10px; overflow-x:auto; padding-bottom:6px; margin-bottom:14px; -webkit-overflow-scrolling:touch; }
    .hs-sup-card {
      flex:none; min-width:150px; background:var(--cream2); border:1.5px solid var(--ink4);
      border-radius:12px; padding:12px 14px; cursor:pointer; transition:border-color .15s ease;
    }
    .hs-sup-card.active { border-color:var(--ink); }
    .hs-sup-card-nama { font-size:13px; font-weight:700; color:var(--ink); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hs-sup-card-total { font-size:15px; font-weight:800; color:var(--danger); }
    .hs-sup-card-sub  { font-size:10.5px; color:var(--ink3); margin-top:2px; }

    /* ── Donut chart (conic-gradient), dark theme ── */
    .hs-donut {
      --pct: 0; --donut-color: var(--ok);
      width: 40px; height: 40px; flex:none; border-radius:50%;
      background: conic-gradient(var(--donut-color) calc(var(--pct) * 1%), var(--ink4) 0);
      display:flex; align-items:center; justify-content:center; position:relative;
      transition: background .25s ease;
    }
    .hs-donut::before { content:''; position:absolute; inset:5px; border-radius:50%; background:var(--cream2); }
    .hs-donut span { position:relative; z-index:1; font-size:9px; font-weight:800; color:var(--ink); }

    /* ── List bon ── */
    #hs-bon-list { display:flex; flex-direction:column; gap:8px; }
    .hs-bon-card { display:flex; align-items:center; gap:12px; background:var(--cream2); border:1px solid var(--ink4); border-radius:12px; padding:12px 14px; cursor:pointer; }
    .hs-bon-main { flex:1; min-width:0; }
    .hs-bon-top  { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
    .hs-bon-nama { font-weight:700; font-size:14px; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hs-bon-badge { font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:10px; white-space:nowrap; }
    .hs-badge-belum { background:rgba(230,168,23,.15); color:var(--warn); }
    .hs-badge-cicil { background:rgba(62,207,106,.12); color:var(--ok); }
    .hs-badge-lunas { background:rgba(62,207,106,.22); color:var(--ok); }
    .hs-bon-sub  { font-size:11.5px; color:var(--ink3); margin-top:3px; }
    .hs-bon-sisa { font-size:13px; font-weight:700; color:var(--danger); margin-top:2px; }
    .hs-empty { text-align:center; padding:40px 12px; color:var(--ink3); font-size:13px; }

    /* ── List Master Barang ── */
    #hs-master-list { display:flex; flex-direction:column; gap:8px; }
    .hs-brg-card { display:flex; align-items:center; gap:10px; background:var(--cream2); border:1px solid var(--ink4); border-radius:12px; padding:12px 14px; cursor:pointer; }
    .hs-brg-main { flex:1; min-width:0; }
    .hs-brg-kat  { font-weight:700; font-size:14px; color:var(--ink); }
    .hs-brg-varian { font-size:11.5px; color:var(--ink3); margin-top:2px; }
    .hs-brg-sup-nama { font-size:11px; color:var(--ink3); margin-top:1px; font-style:italic; }
    .hs-brg-harga { font-weight:800; font-size:14px; color:var(--ink); white-space:nowrap; flex:none; text-align:right; }
    .hs-brg-harga-sub { font-size:10px; color:var(--ink3); font-weight:600; text-align:right; }

    /* ── Bottom sheet (form) — pola sama Gadag ── */
    .hs-sheet-overlay { display:none; position:fixed; inset:0; z-index:820; background:rgba(0,0,0,.55); align-items:flex-end; justify-content:center; }
    .hs-sheet-overlay.open { display:flex; }
    .hs-sheet-page {
      width:100%; max-width:480px; height:85vh; max-height:85vh;
      background:var(--cream); border-radius:20px 20px 0 0;
      display:flex; flex-direction:column; transform:translateY(100%);
      transition:transform .28s cubic-bezier(.32,.72,0,1);
      box-shadow:0 -4px 20px rgba(0,0,0,.4);
    }
    .hs-sheet-overlay.hs-sheet-in .hs-sheet-page { transform:translateY(0); }
    .hs-sheet-handle { display:flex; justify-content:center; padding:10px 0 2px; flex:none; }
    .hs-sheet-handle span { width:40px; height:5px; border-radius:3px; background:var(--ink); opacity:.3; }
    .hs-sheet-header { display:flex; align-items:center; gap:10px; flex:none; padding:6px 16px 12px; border-bottom:1px solid var(--ink4); }
    .hs-sheet-title { font-size:16px; font-weight:800; color:var(--ink); }
    .hs-sheet-close { margin-left:auto; background:none; border:none; color:var(--ink2); font-size:20px; cursor:pointer; padding:4px; }
    .hs-sheet-body { flex:1 1 0; overflow-y:auto; padding:14px 16px 24px; }
    .hs-sheet-footer { flex:none; padding:12px 16px; border-top:1px solid var(--ink4); }

    .hs-form-group { margin-bottom:12px; }
    .hs-form-group label { display:block; font-size:11.5px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.03em; margin-bottom:5px; }
    .hs-form-group input, .hs-form-group select, .hs-form-group textarea {
      width:100%; padding:9px 11px; border-radius:8px; border:1px solid var(--ink4);
      background:var(--cream2); color:var(--ink); font-family:var(--f); font-size:14px;
    }
    .hs-row-2 { display:flex; gap:10px; }
    .hs-row-2 > div { flex:1; min-width:0; }

    /* ── Baris item bon (dinamis) ── */
    #hs-item-rows { display:flex; flex-direction:column; gap:8px; margin-bottom:8px; }
    .hs-item-row { background:var(--cream2); border:1px solid var(--ink4); border-radius:10px; padding:10px; position:relative; }
    .hs-item-row-picker { display:flex; gap:8px; margin-bottom:8px; }
    .hs-item-row-picker select { flex:1; min-width:0; }
    .hs-item-remove { background:none; border:none; color:var(--danger); font-size:16px; cursor:pointer; padding:4px; flex:none; }
    .hs-item-manual-fields { display:flex; gap:8px; margin-bottom:8px; }
    .hs-item-manual-fields input { flex:1; min-width:0; }
    .hs-item-row-bottom { display:flex; gap:8px; align-items:center; }
    .hs-satuan-toggle { display:flex; border:1px solid var(--ink4); border-radius:7px; overflow:hidden; flex:none; }
    .hs-satuan-btn { padding:8px 10px; font-size:12px; font-weight:700; background:var(--cream); color:var(--ink3); border:none; cursor:pointer; }
    .hs-satuan-btn.active { background:var(--ink); color:var(--cream); }
    .hs-item-row-bottom input[type=number] { max-width:64px; }
    .hs-item-row-bottom .hs-harga-input { max-width:120px; }
    .hs-item-subtotal { font-size:12px; font-weight:700; color:var(--ink2); white-space:nowrap; margin-left:auto; }
    .hs-item-hint { font-size:10.5px; color:var(--ink3); margin-top:6px; }
    .hs-total-line { display:flex; justify-content:space-between; align-items:center; padding:10px 2px; font-size:15px; font-weight:800; color:var(--ink); border-top:2px solid var(--ink4); margin-top:4px; }

    /* ── Detail bon: item table + riwayat bayar ── */
    .hs-detail-section-title { font-size:12px; font-weight:800; color:var(--ink3); text-transform:uppercase; letter-spacing:.04em; margin:16px 0 8px; }
    .hs-detail-section-title:first-child { margin-top:0; }
    .hs-detail-item-row { display:flex; justify-content:space-between; gap:8px; padding:7px 0; border-bottom:1px solid var(--ink4); font-size:13px; }
    .hs-detail-item-nama { color:var(--ink); font-weight:600; }
    .hs-detail-item-nama-sup { color:var(--ink3); font-size:11px; }
    .hs-detail-item-qty { color:var(--ink3); white-space:nowrap; }
    .hs-detail-item-sub { color:var(--ink); font-weight:700; white-space:nowrap; }
    .hs-pay-item { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--ink4); font-size:12.5px; }
    .hs-pay-item-left { color:var(--ink2); }
    .hs-pay-item-nom { color:var(--ok); font-weight:700; }
    .hs-detail-summary { display:flex; gap:10px; align-items:center; background:var(--cream2); border-radius:10px; padding:12px 14px; margin-bottom:4px; }
    .hs-detail-summary-txt { flex:1; min-width:0; }
    .hs-detail-summary-total { font-size:16px; font-weight:800; color:var(--ink); }
    .hs-detail-summary-sisa { font-size:12px; color:var(--danger); font-weight:700; margin-top:2px; }

    @media(max-width:600px){
      .hs-sheet-page { max-width:100%; }
    }
  </style>

  <!-- HEADER: judul panel aktif + dropdown menu (desktop) / dot notch (mobile) -->
  <div id="hs-hdr-row">
    <div id="hs-hdr-left">
      <button id="hs-hdr-refresh" onclick="loadHutangSupplier()" title="Refresh"><i class="ti ti-refresh"></i></button>
      <i id="hs-hdr-icon" class="ti ti-receipt"></i>
      <div id="hs-hdr-heading">Bon</div>
    </div>
    <div class="hs-menu-wrap">
      <button id="hs-menu-btn" class="hs-btn-pill hs-btn-primary" onclick="hsToggleMenu(event)">
        <i class="ti ti-menu-2"></i> <span id="hs-menu-btn-label">Bon</span> <i class="ti ti-chevron-down"></i>
      </button>
      <div id="hs-dropdown-menu" class="hs-dropdown-menu">
        <button id="hs-menu-item-bon" class="active" onclick="hsSwitchView('bon')"><i class="ti ti-receipt"></i> Bon</button>
        <button id="hs-menu-item-master" onclick="hsSwitchView('master')"><i class="ti ti-list-details"></i> Master Barang</button>
      </div>
    </div>
    <div id="hs-page-dots" class="hs-page-dots">
      <span class="hs-page-dot active" onclick="hsSwitchView('bon')"></span>
      <span class="hs-page-dot" onclick="hsSwitchView('master')"></span>
    </div>
  </div>

  <div id="hs-supplier-row"></div>

  <div id="hs-panels-wrap">
    <div id="hs-panel-bon" class="hs-panel active">
      <div class="hs-toolbar">
        <button class="hs-btn-pill hs-btn-primary" onclick="hsOpenTambahBon()"><i class="ti ti-plus"></i> Tambah Bon</button>
      </div>
      <div id="hs-bon-list"></div>
    </div>

    <div id="hs-panel-master" class="hs-panel">
      <div class="hs-toolbar">
        <button class="hs-btn-pill hs-btn-primary" onclick="hsOpenTambahBarang()"><i class="ti ti-plus"></i> Tambah Barang</button>
        <button class="hs-btn-pill hs-btn-ghost" onclick="hsShowPasteBarang()"><i class="ti ti-clipboard"></i> Paste Massal</button>
      </div>
      <div id="hs-master-list"></div>
    </div>
  </div>

  <!-- ── SHEET: TAMBAH / EDIT BON ── -->
  <div class="hs-sheet-overlay" id="hs-sheet-bon" onclick="if(event.target===this) hsCloseSheet('hs-sheet-bon')">
    <div class="hs-sheet-page">
      <div class="hs-sheet-handle"><span></span></div>
      <div class="hs-sheet-header">
        <div class="hs-sheet-title" id="hs-bon-form-title">Tambah Bon</div>
        <button class="hs-sheet-close" onclick="hsCloseSheet('hs-sheet-bon')"><i class="ti ti-x"></i></button>
      </div>
      <div class="hs-sheet-body">
        <input type="hidden" id="hs-bon-id">
        <div class="hs-form-group">
          <label>Supplier</label>
          <select id="hs-bon-supplier-select" onchange="hsOnBonSupplierChange()"></select>
          <input type="text" id="hs-bon-supplier-baru" placeholder="Nama supplier baru..." style="display:none;margin-top:8px" oninput="hsOnBonSupplierBaruInput()">
        </div>
        <div class="hs-row-2">
          <div class="hs-form-group">
            <label>Tanggal Bon</label>
            <input type="date" id="hs-bon-tanggal">
          </div>
          <div class="hs-form-group">
            <label>No. Nota (opsional)</label>
            <input type="text" id="hs-bon-no-nota" placeholder="mis: INV-0021">
          </div>
        </div>

        <label style="display:block;font-size:11.5px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.03em;margin-bottom:6px">Barang</label>
        <div id="hs-item-rows"></div>
        <div id="hs-item-empty-hint" class="hs-item-hint" style="display:none">Belum ada Master Barang buat supplier ini — pilih "✏️ Manual" di baris, atau bikin dulu di tab Master Barang.</div>
        <button class="hs-btn-pill hs-btn-ghost" onclick="hsAddItemRow()" style="margin:10px 0"><i class="ti ti-plus"></i> Tambah Barang</button>

        <div class="hs-total-line"><span>Total Bon</span><span id="hs-bon-total-display">Rp0</span></div>

        <div class="hs-form-group" style="margin-top:12px">
          <label>Catatan (opsional)</label>
          <textarea id="hs-bon-catatan" rows="2"></textarea>
        </div>
      </div>
      <div class="hs-sheet-footer" style="display:flex;gap:8px">
        <button class="hs-btn-pill hs-btn-danger" id="hs-bon-btn-hapus" style="display:none" onclick="hsHapusBon()"><i class="ti ti-trash"></i> Hapus</button>
        <button class="hs-btn-pill hs-btn-primary" style="flex:1;justify-content:center" onclick="hsSimpanBon()">Simpan</button>
      </div>
    </div>
  </div>

  <!-- ── SHEET: DETAIL BON (item + bayar + riwayat) ── -->
  <div class="hs-sheet-overlay" id="hs-sheet-detail" onclick="if(event.target===this) hsCloseSheet('hs-sheet-detail')">
    <div class="hs-sheet-page">
      <div class="hs-sheet-handle"><span></span></div>
      <div class="hs-sheet-header">
        <div class="hs-sheet-title" id="hs-detail-title">Detail Bon</div>
        <button class="hs-sheet-close" onclick="hsCloseSheet('hs-sheet-detail')"><i class="ti ti-x"></i></button>
      </div>
      <div class="hs-sheet-body">
        <div class="hs-detail-summary">
          <div class="hs-detail-summary-txt">
            <div class="hs-detail-summary-total" id="hs-detail-total">Rp0</div>
            <div class="hs-detail-summary-sisa" id="hs-detail-sisa">Sisa Rp0</div>
          </div>
          <div class="hs-donut" id="hs-detail-donut" style="--pct:0"><span id="hs-detail-donut-txt">0%</span></div>
        </div>

        <div class="hs-detail-section-title">Barang</div>
        <div id="hs-detail-items"></div>

        <div class="hs-detail-section-title">Bayar</div>
        <div class="hs-row-2">
          <div class="hs-form-group">
            <label>Nominal</label>
            <input type="text" id="hs-pay-nominal" inputmode="numeric" placeholder="0">
          </div>
          <div class="hs-form-group">
            <label>Tanggal</label>
            <input type="date" id="hs-pay-tanggal">
          </div>
        </div>
        <div class="hs-row-2">
          <div class="hs-form-group">
            <label>Debit (Hutang/Beban)</label>
            <select id="hs-pay-akun-debit"></select>
          </div>
          <div class="hs-form-group">
            <label>Bayar dari (Kas/Bank)</label>
            <select id="hs-pay-akun-kredit"></select>
          </div>
        </div>
        <div class="hs-form-group">
          <label>Catatan (opsional)</label>
          <input type="text" id="hs-pay-catatan">
        </div>
        <button class="hs-btn-pill hs-btn-primary" style="width:100%;justify-content:center;margin-bottom:6px" onclick="hsSimpanBayar()"><i class="ti ti-cash"></i> Catat Pembayaran</button>

        <div class="hs-detail-section-title">Riwayat Pembayaran</div>
        <div id="hs-detail-riwayat"></div>
      </div>
    </div>
  </div>

  <!-- ── SHEET: TAMBAH / EDIT MASTER BARANG ── -->
  <div class="hs-sheet-overlay" id="hs-sheet-barang" onclick="if(event.target===this) hsCloseSheet('hs-sheet-barang')">
    <div class="hs-sheet-page" style="height:auto;max-height:85vh">
      <div class="hs-sheet-handle"><span></span></div>
      <div class="hs-sheet-header">
        <div class="hs-sheet-title" id="hs-barang-form-title">Tambah Barang</div>
        <button class="hs-sheet-close" onclick="hsCloseSheet('hs-sheet-barang')"><i class="ti ti-x"></i></button>
      </div>
      <div class="hs-sheet-body">
        <input type="hidden" id="hs-brg-id">
        <div class="hs-form-group">
          <label>Supplier</label>
          <select id="hs-brg-supplier-select"></select>
          <input type="text" id="hs-brg-supplier-baru" placeholder="Nama supplier baru..." style="display:none;margin-top:8px">
        </div>
        <div class="hs-form-group">
          <label>SKU Induk (Katalog Produk)</label>
          <select id="hs-brg-katalog"></select>
        </div>
        <div class="hs-row-2">
          <div class="hs-form-group">
            <label>Nama versi Supplier</label>
            <input type="text" id="hs-brg-nama-supplier" placeholder="mis: H Solah">
          </div>
          <div class="hs-form-group">
            <label>Varian Warna</label>
            <input type="text" id="hs-brg-varian" placeholder="mis: Hitam">
          </div>
        </div>
        <div class="hs-form-group">
          <label>Harga per Lusin</label>
          <input type="text" id="hs-brg-harga" inputmode="numeric" placeholder="0">
        </div>
      </div>
      <div class="hs-sheet-footer" style="display:flex;gap:8px">
        <button class="hs-btn-pill hs-btn-danger" id="hs-brg-btn-hapus" style="display:none" onclick="hsHapusBarang()"><i class="ti ti-trash"></i> Hapus</button>
        <button class="hs-btn-pill hs-btn-primary" style="flex:1;justify-content:center" onclick="hsSimpanBarang()">Simpan</button>
      </div>
    </div>
  </div>

  <!-- ── SHEET: PASTE MASSAL MASTER BARANG ── -->
  <div class="hs-sheet-overlay" id="hs-sheet-paste-barang" onclick="if(event.target===this) hsCloseSheet('hs-sheet-paste-barang')">
    <div class="hs-sheet-page" style="height:auto;max-height:88vh">
      <div class="hs-sheet-handle"><span></span></div>
      <div class="hs-sheet-header">
        <div class="hs-sheet-title"><i class="ti ti-clipboard"></i> Paste Massal Barang</div>
        <button class="hs-sheet-close" onclick="hsCloseSheet('hs-sheet-paste-barang')"><i class="ti ti-x"></i></button>
      </div>
      <div class="hs-sheet-body">
        <div class="hs-form-group">
          <label>Supplier</label>
          <select id="hs-paste-supplier-select"></select>
          <input type="text" id="hs-paste-supplier-baru" placeholder="Nama supplier baru..." style="display:none;margin-top:8px">
        </div>
        <div style="font-size:12px;color:var(--ink3);margin:2px 0 10px;line-height:1.6">
          Copy dari Excel lalu paste di bawah. Semua baris masuk ke supplier yang dipilih di atas.<br>
          Urutan kolom: <b>SKU Induk → Varian → SKU Suplier → Harga per Lusin</b>
        </div>
        <textarea id="hs-paste-area"
          style="width:100%;height:160px;font-family:var(--f);font-size:13px;padding:8px;border:2px solid var(--ink);background:var(--cream);resize:vertical;outline:none;border-radius:6px"
          placeholder="Paste di sini..."></textarea>
        <div id="hs-paste-preview" style="margin-top:10px;display:none">
          <div style="font-size:12px;font-weight:700;color:var(--ink3);margin-bottom:6px" id="hs-paste-count"></div>
          <div class="tbl-wrap" style="max-height:180px;overflow-y:auto">
            <table class="tbl"><thead><tr><th>SKU Induk</th><th>Varian</th><th>SKU Suplier</th><th>HPP/Lsn</th><th>HPP Pc</th></tr></thead>
            <tbody id="hs-paste-tbody"></tbody></table>
          </div>
        </div>
      </div>
      <div class="hs-sheet-footer" style="display:flex;gap:8px">
        <button class="hs-btn-pill hs-btn-ghost" onclick="hsParsePasteBarang()"><i class="ti ti-eye"></i> Preview</button>
        <button class="hs-btn-pill hs-btn-primary" id="hs-btn-simpan-paste-barang" style="display:none;flex:1;justify-content:center" onclick="hsSimpanPasteBarang()"><i class="ti ti-check"></i> Simpan Semua</button>
      </div>
    </div>
  </div>
`;

// ─── STATE ──────────────────────────────────────────────────────
var _hsView            = 'bon';   // 'bon' | 'master'
var _hsSupplierList     = [];     // [{id, nama, kontak}]
var _hsBonList          = [];     // [{id, supplier_id, tanggal, no_nota, total, status, catatan, ...}]
var _hsPembayaranAll    = [];     // semua hutang_pembayaran
var _hsBarangMaster     = [];     // semua hutang_barang (master katalog per supplier)
var _hsKatalogList      = [];     // distinct produk.katalog, buat dropdown SKU Induk
var _hsAkunKas          = [];     // kas_akun, buat select debit/kredit pembayaran
var _hsFilterSupplier   = null;   // null = semua (dipakai bareng di tab Bon & Master)
var _hsItemRows         = [];     // baris item form Tambah/Edit Bon
var _hsCurrentBonId     = null;   // bon yg lagi dibuka di sheet detail
var _hsCurrentBonSupplierId = null; // supplier_id yg lagi aktif di form Tambah/Edit Bon

// ─── LOAD ───────────────────────────────────────────────────────
async function loadHutangSupplier() {
  try {
    const [supplier, bon, pembayaran, barang, akun, produk] = await Promise.all([
      dbGet('hutang_supplier', '&order=nama.asc'),
      dbGet('hutang_bon',      '&order=tanggal.desc,created_at.desc'),
      dbGet('hutang_pembayaran', '&order=tanggal.desc'),
      dbGet('hutang_barang',   '&order=katalog_produk.asc'),
      dbGet('kas_akun',        '&order=kode.asc'),
      dbGet('produk',          '&select=katalog'),
    ]);
    _hsSupplierList  = supplier || [];
    _hsBonList       = bon || [];
    _hsPembayaranAll = pembayaran || [];
    _hsBarangMaster  = barang || [];
    _hsAkunKas       = akun || [];

    var katSet = {};
    (produk || []).forEach(function(p) { if (p.katalog) katSet[p.katalog] = true; });
    _hsKatalogList = Object.keys(katSet).sort(function(a,b){ return a.localeCompare(b,'id'); });

    hsRenderSupplierCards();
    hsRenderBonList();
    hsRenderMasterList();
  } catch(e) {
    console.error('loadHutangSupplier error', e);
    var list = document.getElementById('hs-bon-list');
    if (list) list.innerHTML = '<div class="hs-empty">Gagal memuat data: ' + (e.message||e) + '</div>';
  }
}

// Sisa hutang 1 bon = total - sum(pembayaran)
function _hsSisaBon(bon) {
  var bayar = _hsPembayaranAll.filter(function(p){ return p.bon_id === bon.id; })
    .reduce(function(s,p){ return s + (p.nominal||0); }, 0);
  return { bayar: bayar, sisa: Math.max(0, (bon.total||0) - bayar) };
}

// ─── TAB SWITCHER ─────────────────────────────────────────────
var _HS_VIEW_LABEL = {
  bon:    { label: 'Bon',           icon: 'ti-receipt' },
  master: { label: 'Master Barang', icon: 'ti-list-details' },
};
var _HS_VIEW_ORDER = ['bon', 'master'];

function hsSwitchView(view) {
  _hsView = view;
  document.getElementById('hs-panel-bon').classList.toggle('active', view==='bon');
  document.getElementById('hs-panel-master').classList.toggle('active', view==='master');

  document.getElementById('hs-hdr-heading').textContent  = _HS_VIEW_LABEL[view].label;
  document.getElementById('hs-hdr-icon').className       = 'ti ' + _HS_VIEW_LABEL[view].icon;
  document.getElementById('hs-menu-btn-label').textContent = _HS_VIEW_LABEL[view].label;
  _HS_VIEW_ORDER.forEach(function(v) {
    document.getElementById('hs-menu-item-' + v).classList.toggle('active', v === view);
  });
  var dotsEl = document.getElementById('hs-page-dots');
  Array.prototype.forEach.call(dotsEl.children, function(dot, i) {
    dot.classList.toggle('active', _HS_VIEW_ORDER[i] === view);
  });
  hsCloseMenu();
  hsRenderSupplierCards();
}

// ─── Dropdown menu (desktop) ────────────────────────────────
function hsToggleMenu(e) {
  if (e) e.stopPropagation();
  document.getElementById('hs-dropdown-menu').classList.toggle('open');
}
function hsCloseMenu() {
  var m = document.getElementById('hs-dropdown-menu');
  if (m) m.classList.remove('open');
}
document.addEventListener('click', function(e) {
  var menu = document.getElementById('hs-dropdown-menu');
  var btn  = document.getElementById('hs-menu-btn');
  if (!menu || !btn) return;
  if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.remove('open');
  }
});

// ─── Swipe antar panel (mobile only) — pola sama persis kayak Gadag ──
// (edge-guard 24px biar gak rebutan sama swipe-back OS, threshold 40px/flick
// biar aman coexist sama long-press-edit yang ada di list Bon & Master Barang)
(function() {
  var wrap = document.getElementById('hs-panels-wrap');
  if (!wrap) return;
  var EDGE = 24;
  var startX = 0, startY = 0, startT = 0, tracking = false, isHoriz = null;

  function goRelative(dir) {
    var idx = _HS_VIEW_ORDER.indexOf(_hsView);
    if (idx === -1) return;
    var next = (idx + dir + _HS_VIEW_ORDER.length) % _HS_VIEW_ORDER.length;
    hsSwitchView(_HS_VIEW_ORDER[next]);
  }

  wrap.addEventListener('touchstart', function(e) {
    var x = e.touches[0].clientX;
    if (x < EDGE || x > window.innerWidth - EDGE) { tracking = false; return; }
    startX = x; startY = e.touches[0].clientY; startT = Date.now();
    tracking = true; isHoriz = null;
  }, { passive: true });

  wrap.addEventListener('touchmove', function(e) {
    if (!tracking) return;
    var dx = e.touches[0].clientX - startX;
    var dy = e.touches[0].clientY - startY;
    if (isHoriz === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHoriz = Math.abs(dx) > Math.abs(dy);
    }
  }, { passive: true });

  wrap.addEventListener('touchend', function(e) {
    if (!tracking) return;
    tracking = false;
    if (!isHoriz) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dt = Date.now() - startT;
    var isFlick = Math.abs(dx) / Math.max(dt, 1) > 0.3;
    if (dx < -40 || (isFlick && dx < -20)) goRelative(1);
    else if (dx > 40 || (isFlick && dx > 20)) goRelative(-1);
  }, { passive: true });

  wrap.addEventListener('touchcancel', function() { tracking = false; isHoriz = null; }, { passive: true });
})();

// ─── SUPPLIER CARDS (dipakai bareng tab Bon & Master) ─────────
function hsRenderSupplierCards() {
  var el = document.getElementById('hs-supplier-row');
  if (!el) return;

  var totals = {};
  _hsBonList.forEach(function(b) {
    if (b.status === 'lunas') return;
    var s = _hsSisaBon(b).sisa;
    totals[b.supplier_id] = (totals[b.supplier_id] || 0) + s;
  });
  var totalSemua = Object.values(totals).reduce(function(s,v){ return s+v; }, 0);

  var html = '<div class="hs-sup-card' + (_hsFilterSupplier===null?' active':'') + '" onclick="hsSelectSupplierFilter(null)">' +
    '<div class="hs-sup-card-nama">Semua Supplier</div>';
  if (_hsView === 'bon') {
    html += '<div class="hs-sup-card-total">' + fmtRpFull(totalSemua) + '</div>' +
      '<div class="hs-sup-card-sub">' + _hsBonList.filter(function(b){return b.status!=='lunas';}).length + ' bon belum lunas</div>';
  } else {
    html += '<div class="hs-sup-card-total" style="color:var(--ink)">' + _hsBarangMaster.length + '</div>' +
      '<div class="hs-sup-card-sub">total barang</div>';
  }
  html += '</div>';

  html += _hsSupplierList.map(function(s) {
    var card = '<div class="hs-sup-card' + (_hsFilterSupplier===s.id?' active':'') + '" onclick="hsSelectSupplierFilter(' + s.id + ')">' +
      '<div class="hs-sup-card-nama">' + _hsEsc(s.nama) + '</div>';
    if (_hsView === 'bon') {
      var jml = _hsBonList.filter(function(b){ return b.supplier_id===s.id && b.status!=='lunas'; }).length;
      card += '<div class="hs-sup-card-total">' + fmtRpFull(totals[s.id]||0) + '</div>' +
        '<div class="hs-sup-card-sub">' + jml + ' bon belum lunas</div>';
    } else {
      var jmlBrg = _hsBarangMaster.filter(function(b){ return b.supplier_id===s.id; }).length;
      card += '<div class="hs-sup-card-total" style="color:var(--ink)">' + jmlBrg + '</div>' +
        '<div class="hs-sup-card-sub">barang terdaftar</div>';
    }
    card += '</div>';
    return card;
  }).join('');

  el.innerHTML = html;
}

function hsSelectSupplierFilter(id) {
  _hsFilterSupplier = id;
  hsRenderSupplierCards();
  hsRenderBonList();
  hsRenderMasterList();
}

// ─── BON LIST ─────────────────────────────────────────────────
function hsRenderBonList() {
  var el = document.getElementById('hs-bon-list');
  if (!el) return;

  var list = _hsBonList.filter(function(b) {
    return _hsFilterSupplier === null || b.supplier_id === _hsFilterSupplier;
  });

  if (!list.length) {
    el.innerHTML = '<div class="hs-empty">Belum ada bon' + (_hsFilterSupplier?' dari supplier ini':'') + '.</div>';
    return;
  }

  el.innerHTML = list.map(function(b) {
    var supplier = _hsSupplierList.find(function(s){ return s.id===b.supplier_id; });
    var namaSup  = supplier ? supplier.nama : '—';
    var st = _hsSisaBon(b);
    var pct = b.total > 0 ? Math.round((st.bayar / b.total) * 100) : 0;
    pct = Math.max(0, Math.min(100, pct));

    var badgeCls = 'hs-badge-belum', badgeTxt = 'Belum Lunas';
    if (b.status === 'lunas' || st.sisa <= 0) { badgeCls = 'hs-badge-lunas'; badgeTxt = 'Lunas'; }
    else if (st.bayar > 0) { badgeCls = 'hs-badge-cicil'; badgeTxt = 'Dicicil'; }

    var donutColor = (badgeCls === 'hs-badge-lunas') ? 'var(--ok)' : (badgeCls === 'hs-badge-cicil' ? 'var(--warn)' : 'var(--danger)');

    return '<div class="hs-bon-card" data-id="' + b.id + '" onclick="hsOpenDetailBon(' + b.id + ')" oncontextmenu="event.preventDefault();hsOpenEditBon(' + b.id + ')">' +
      '<div class="hs-donut" style="--pct:' + pct + ';--donut-color:' + donutColor + '"><span>' + pct + '%</span></div>' +
      '<div class="hs-bon-main">' +
        '<div class="hs-bon-top"><div class="hs-bon-nama">' + _hsEsc(namaSup) + '</div><div class="hs-bon-badge ' + badgeCls + '">' + badgeTxt + '</div></div>' +
        '<div class="hs-bon-sub">' + _hsFmtTgl(b.tanggal) + (b.no_nota ? ' · ' + _hsEsc(b.no_nota) : '') + ' · Total ' + fmtRpFull(b.total) + '</div>' +
        (st.sisa > 0 ? '<div class="hs-bon-sisa">Sisa ' + fmtRpFull(st.sisa) + '</div>' : '') +
      '</div>' +
    '</div>';
  }).join('');

  _hsInitLongPress('hs-bon-list', function(id) { hsOpenEditBon(parseInt(id,10)); });
}

// ─── MASTER BARANG LIST ───────────────────────────────────────
function hsRenderMasterList() {
  var el = document.getElementById('hs-master-list');
  if (!el) return;

  var list = _hsBarangMaster.filter(function(b) {
    return _hsFilterSupplier === null || b.supplier_id === _hsFilterSupplier;
  });

  if (!list.length) {
    el.innerHTML = '<div class="hs-empty">Belum ada Master Barang' + (_hsFilterSupplier?' buat supplier ini':'') + '. Tap "+ Tambah Barang" buat mulai.</div>';
    return;
  }

  el.innerHTML = list.map(function(b) {
    var supplier = _hsSupplierList.find(function(s){ return s.id===b.supplier_id; });
    return '<div class="hs-brg-card" data-id="' + b.id + '" onclick="hsOpenEditBarang(' + b.id + ')">' +
      '<div class="hs-brg-main">' +
        '<div class="hs-brg-kat">' + _hsEsc(b.katalog_produk) + (b.varian_warna ? ' — ' + _hsEsc(b.varian_warna) : '') + '</div>' +
        '<div class="hs-brg-varian">Supplier: ' + _hsEsc(supplier ? supplier.nama : '—') + '</div>' +
        (b.nama_supplier ? '<div class="hs-brg-sup-nama">"' + _hsEsc(b.nama_supplier) + '"</div>' : '') +
      '</div>' +
      '<div>' +
        '<div class="hs-brg-harga">' + fmtRpFull(b.harga_per_lusin) + '</div>' +
        '<div class="hs-brg-harga-sub">/ lusin</div>' +
      '</div>' +
    '</div>';
  }).join('');

  _hsInitLongPress('hs-master-list', function(id) { hsOpenEditBarang(parseInt(id,10)); });
}

// ─── LONG PRESS (copy independen, bukan reuse dari gadag.js) ──
function _hsInitLongPress(containerId, onLongPress) {
  var container = document.getElementById(containerId);
  if (!container || container._hsLongPressInited) return;
  container._hsLongPressInited = true;
  var HOLD_MS = 500, MOVE_LIMIT = 10;
  var _timer = null, _startX = 0, _startY = 0, _card = null;

  function cancel() { if (_timer) { clearTimeout(_timer); _timer = null; } _card = null; }

  container.addEventListener('touchstart', function(e) {
    var card = e.target.closest('[data-id]');
    if (!card) return;
    _card = card;
    _startX = e.touches[0].clientX;
    _startY = e.touches[0].clientY;
    _timer = setTimeout(function() {
      if (navigator.vibrate) navigator.vibrate(15);
      var c = _card; cancel();
      onLongPress(c.getAttribute('data-id'), c);
    }, HOLD_MS);
  }, { passive: true });

  container.addEventListener('touchmove', function(e) {
    if (!_timer) return;
    var dx = Math.abs(e.touches[0].clientX - _startX);
    var dy = Math.abs(e.touches[0].clientY - _startY);
    if (dx > MOVE_LIMIT || dy > MOVE_LIMIT) cancel();
  }, { passive: true });

  container.addEventListener('touchend', cancel, { passive: true });
  container.addEventListener('touchcancel', cancel, { passive: true });

  container.addEventListener('mousedown', function(e) {
    var card = e.target.closest('[data-id]');
    if (!card) return;
    _card = card;
    _timer = setTimeout(function() {
      var c = _card; cancel();
      onLongPress(c.getAttribute('data-id'), c);
    }, HOLD_MS);
  });
  container.addEventListener('mouseup', cancel);
  container.addEventListener('mouseleave', cancel);
}

// ─── SHEET HELPERS ────────────────────────────────────────────
function hsOpenSheet(id) {
  var ov = document.getElementById(id);
  if (!ov) return;
  ov.classList.add('open');
  requestAnimationFrame(function() { ov.classList.add('hs-sheet-in'); });
}
function hsCloseSheet(id) {
  var ov = document.getElementById(id);
  if (!ov) return;
  ov.classList.remove('hs-sheet-in');
  setTimeout(function() { ov.classList.remove('open'); }, 280);
}

// ─── HELPER: populate select supplier (dipakai form Bon & form Barang) ──
function _hsPopulateSupplierSelect(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var html = _hsSupplierList.map(function(s) {
    return '<option value="' + s.id + '">' + _hsEsc(s.nama) + '</option>';
  }).join('');
  html += '<option value="__baru__">+ Supplier baru...</option>';
  sel.innerHTML = html;
}

// Resolve supplier_id dari pasangan select+input "baru" — insert supplier
// baru ke DB kalau perlu. Dipakai bareng form Bon & form Barang.
async function _hsResolveSupplierId(selectId, baruInputId) {
  var sel     = document.getElementById(selectId).value;
  var namaBaru = document.getElementById(baruInputId).value.trim();
  if (sel !== '__baru__') return sel;
  if (!namaBaru) throw new Error('Isi nama supplier baru!');
  var newSup = await dbInsert('hutang_supplier', { nama: namaBaru.toUpperCase() });
  var id = newSup[0].id;
  _hsSupplierList.push({ id: id, nama: namaBaru.toUpperCase() });
  return id;
}

// ─── TAMBAH / EDIT BON ────────────────────────────────────────
function hsOnBonSupplierChange() {
  var sel = document.getElementById('hs-bon-supplier-select');
  var baruEl = document.getElementById('hs-bon-supplier-baru');
  baruEl.style.display = sel.value === '__baru__' ? 'block' : 'none';

  var newSupplierId = sel.value === '__baru__' ? null : parseInt(sel.value, 10);
  if (newSupplierId !== _hsCurrentBonSupplierId) {
    var hasFilledRows = _hsItemRows.some(function(r){ return r.barang_id || r.nama_internal || r.nama_supplier; });
    if (hasFilledRows && !confirm('Ganti supplier bakal reset baris barang yang udah diisi (master barang beda per supplier). Lanjut?')) {
      // Batal — balikin pilihan select ke supplier sebelumnya
      sel.value = _hsCurrentBonSupplierId || '__baru__';
      baruEl.style.display = sel.value === '__baru__' ? 'block' : 'none';
      return;
    }
    _hsCurrentBonSupplierId = newSupplierId;
    _hsItemRows = [_hsBlankItemRow()];
    _hsRenderItemRows();
  }
}
function hsOnBonSupplierBaruInput() {
  // Supplier baru → belum ada id, treat sebagai null (semua baris jadi manual)
  if (_hsCurrentBonSupplierId !== null) {
    _hsCurrentBonSupplierId = null;
    _hsItemRows = [_hsBlankItemRow()];
    _hsRenderItemRows();
  }
}

function _hsBlankItemRow() {
  return { barang_id: null, katalog_produk: '', varian_warna: '', nama_supplier: '', nama_internal: '', satuan: 'lusin', qty: 1, harga_per_lusin: 0, manual: false };
}

function hsOpenTambahBon() {
  document.getElementById('hs-bon-form-title').textContent = 'Tambah Bon';
  document.getElementById('hs-bon-id').value = '';
  document.getElementById('hs-bon-btn-hapus').style.display = 'none';
  _hsPopulateSupplierSelect('hs-bon-supplier-select');
  var firstSup = _hsSupplierList[0];
  document.getElementById('hs-bon-supplier-select').value = firstSup ? firstSup.id : '__baru__';
  document.getElementById('hs-bon-supplier-baru').value = '';
  document.getElementById('hs-bon-supplier-baru').style.display = firstSup ? 'none' : 'block';
  _hsCurrentBonSupplierId = firstSup ? firstSup.id : null;
  document.getElementById('hs-bon-tanggal').value = new Date().toISOString().slice(0,10);
  document.getElementById('hs-bon-no-nota').value = '';
  document.getElementById('hs-bon-catatan').value = '';
  _hsItemRows = [_hsBlankItemRow()];
  _hsRenderItemRows();
  hsOpenSheet('hs-sheet-bon');
}

async function hsOpenEditBon(bonId) {
  var b = _hsBonList.find(function(x){ return x.id===bonId; });
  if (!b) return;
  document.getElementById('hs-bon-form-title').textContent = 'Edit Bon';
  document.getElementById('hs-bon-id').value = b.id;
  document.getElementById('hs-bon-btn-hapus').style.display = 'inline-flex';
  _hsPopulateSupplierSelect('hs-bon-supplier-select');
  document.getElementById('hs-bon-supplier-select').value = b.supplier_id;
  document.getElementById('hs-bon-supplier-baru').style.display = 'none';
  document.getElementById('hs-bon-supplier-baru').value = '';
  _hsCurrentBonSupplierId = b.supplier_id;
  document.getElementById('hs-bon-tanggal').value = b.tanggal;
  document.getElementById('hs-bon-no-nota').value = b.no_nota || '';
  document.getElementById('hs-bon-catatan').value = b.catatan || '';

  try {
    var items = await dbGet('hutang_bon_item', '&bon_id=eq.' + b.id + '&order=id.asc');
    _hsItemRows = (items && items.length) ? items.map(function(it) {
      var master = it.barang_id ? _hsBarangMaster.find(function(m){ return m.id===it.barang_id; }) : null;
      return {
        barang_id: master ? it.barang_id : null,
        katalog_produk: it.nama_internal || '',
        varian_warna: it.varian_warna || '',
        nama_supplier: it.nama_supplier || '',
        nama_internal: it.nama_internal || '',
        satuan: it.satuan === 'pcs' ? 'pcs' : 'lusin',
        qty: it.qty || 1,
        harga_per_lusin: it.harga_satuan || 0,
        manual: !master, // kalau barang master-nya udah gak ada/kehapus, fallback manual
      };
    }) : [_hsBlankItemRow()];
  } catch(e) {
    _hsItemRows = [_hsBlankItemRow()];
  }
  _hsRenderItemRows();
  hsOpenSheet('hs-sheet-bon');
}

function hsAddItemRow() {
  _hsItemRows.push(_hsBlankItemRow());
  _hsRenderItemRows();
}

function hsRemoveItemRow(idx) {
  if (_hsItemRows.length <= 1) return;
  _hsItemRows.splice(idx, 1);
  _hsRenderItemRows();
}

// Konversi qty ke ekuivalen lusin, buat hitung subtotal terhadap harga_per_lusin
function _hsQtyToLusin(qty, satuan) { return satuan === 'pcs' ? (qty || 0) / 12 : (qty || 0); }
function _hsRowSubtotal(row) { return _hsQtyToLusin(row.qty, row.satuan) * (row.harga_per_lusin || 0); }

function _hsRenderItemRows() {
  var wrap = document.getElementById('hs-item-rows');
  if (!wrap) return;

  var masterOptions = _hsBarangMaster.filter(function(m) { return m.supplier_id === _hsCurrentBonSupplierId; });
  var emptyHint = document.getElementById('hs-item-empty-hint');
  if (emptyHint) emptyHint.style.display = (_hsCurrentBonSupplierId && !masterOptions.length) ? 'block' : 'none';

  wrap.innerHTML = _hsItemRows.map(function(row, idx) {
    var pickerOptions = '<option value="">— pilih barang —</option>' +
      masterOptions.map(function(m) {
        var label = m.katalog_produk + (m.varian_warna ? ' — ' + m.varian_warna : '') + (m.nama_supplier ? ' (' + m.nama_supplier + ')' : '');
        var sel = (!row.manual && row.barang_id === m.id) ? ' selected' : '';
        return '<option value="' + m.id + '"' + sel + '>' + _hsEsc(label) + '</option>';
      }).join('') +
      '<option value="__manual__"' + (row.manual ? ' selected' : '') + '>✏️ Manual (barang gak ada di master)</option>';

    var manualFieldsHtml = row.manual ? (
      '<div class="hs-item-manual-fields">' +
        '<input type="text" placeholder="Nama barang" value="' + _hsEscAttr(row.katalog_produk || row.nama_internal) + '" id="hs-item-int-' + idx + '" oninput="_hsItemRowUpdate(' + idx + ')">' +
        '<input type="text" placeholder="Nama versi supplier" value="' + _hsEscAttr(row.nama_supplier) + '" id="hs-item-sup-' + idx + '" oninput="_hsItemRowUpdate(' + idx + ')">' +
      '</div>'
    ) : '';

    var subtotal = _hsRowSubtotal(row);
    var hargaDisabled = row.manual ? '' : 'disabled';

    return '<div class="hs-item-row">' +
      '<div class="hs-item-row-picker">' +
        '<select id="hs-item-pick-' + idx + '" onchange="_hsItemRowPickChange(' + idx + ')">' + pickerOptions + '</select>' +
        '<button class="hs-item-remove" onclick="hsRemoveItemRow(' + idx + ')"><i class="ti ti-trash"></i></button>' +
      '</div>' +
      manualFieldsHtml +
      '<div class="hs-item-row-bottom">' +
        '<div class="hs-satuan-toggle">' +
          '<button type="button" class="hs-satuan-btn' + (row.satuan==='lusin'?' active':'') + '" onclick="_hsItemRowSetSatuan(' + idx + ',\'lusin\')">Lusin</button>' +
          '<button type="button" class="hs-satuan-btn' + (row.satuan==='pcs'?' active':'') + '" onclick="_hsItemRowSetSatuan(' + idx + ',\'pcs\')">Pcs</button>' +
        '</div>' +
        '<input type="number" min="0" step="any" value="' + (row.qty||'') + '" id="hs-item-qty-' + idx + '" oninput="_hsItemRowUpdate(' + idx + ')">' +
        '<input type="text" class="hs-harga-input" inputmode="numeric" placeholder="Harga/lusin" value="' + (row.harga_per_lusin ? row.harga_per_lusin.toLocaleString('id-ID') : '') + '" id="hs-item-hrg-' + idx + '" ' + hargaDisabled + ' oninput="_hsItemRowUpdate(' + idx + ')">' +
        '<span class="hs-item-subtotal">' + fmtRpFull(subtotal) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');

  _hsItemRows.forEach(function(_, idx) {
    idrInput('hs-item-hrg-' + idx);
  });

  _hsUpdateTotalDisplay();
}

function _hsItemRowPickChange(idx) {
  var row = _hsItemRows[idx];
  if (!row) return;
  var val = document.getElementById('hs-item-pick-' + idx).value;
  if (val === '__manual__') {
    row.manual = true;
    row.barang_id = null;
  } else if (val) {
    var m = _hsBarangMaster.find(function(x){ return x.id === parseInt(val,10); });
    if (m) {
      row.manual = false;
      row.barang_id = m.id;
      row.katalog_produk = m.katalog_produk;
      row.varian_warna   = m.varian_warna || '';
      row.nama_supplier  = m.nama_supplier || '';
      row.nama_internal  = m.katalog_produk;
      row.harga_per_lusin = m.harga_per_lusin || 0;
    }
  } else {
    row.manual = false;
    row.barang_id = null;
    row.katalog_produk = ''; row.varian_warna = ''; row.nama_supplier = ''; row.nama_internal = ''; row.harga_per_lusin = 0;
  }
  _hsRenderItemRows();
}

function _hsItemRowSetSatuan(idx, satuan) {
  var row = _hsItemRows[idx];
  if (!row) return;
  row.satuan = satuan;
  _hsRenderItemRows();
}

function _hsItemRowUpdate(idx) {
  var row = _hsItemRows[idx];
  if (!row) return;
  if (row.manual) {
    var elInt = document.getElementById('hs-item-int-' + idx);
    var elSup = document.getElementById('hs-item-sup-' + idx);
    if (elInt) { row.katalog_produk = elInt.value; row.nama_internal = elInt.value; }
    if (elSup) row.nama_supplier = elSup.value;
    row.harga_per_lusin = idrVal('hs-item-hrg-' + idx);
  }
  row.qty = parseFloat((document.getElementById('hs-item-qty-' + idx) || {}).value) || 0;

  var subEl = document.querySelectorAll('.hs-item-subtotal')[idx];
  if (subEl) subEl.textContent = fmtRpFull(_hsRowSubtotal(row));
  _hsUpdateTotalDisplay();
}

function _hsUpdateTotalDisplay() {
  var total = _hsItemRows.reduce(function(s,r){ return s + _hsRowSubtotal(r); }, 0);
  var el = document.getElementById('hs-bon-total-display');
  if (el) el.textContent = fmtRpFull(total);
  return total;
}

async function hsSimpanBon() {
  var id       = document.getElementById('hs-bon-id').value;
  var tanggal  = document.getElementById('hs-bon-tanggal').value;
  var noNota   = document.getElementById('hs-bon-no-nota').value.trim() || null;
  var catatan  = document.getElementById('hs-bon-catatan').value.trim() || null;

  if (!tanggal) { alert('Tanggal bon wajib diisi!'); return; }

  var validItems = _hsItemRows.filter(function(r){ return (r.katalog_produk || r.nama_internal) && r.qty > 0 && r.harga_per_lusin > 0; });
  if (!validItems.length) { alert('Isi minimal 1 barang (nama, qty, & harga)!'); return; }

  var total = validItems.reduce(function(s,r){ return s + _hsRowSubtotal(r); }, 0);

  try {
    var supplierId = await _hsResolveSupplierId('hs-bon-supplier-select', 'hs-bon-supplier-baru');

    var bonData = {
      supplier_id: supplierId,
      tanggal:     tanggal,
      no_nota:     noNota,
      total:       Math.round(total),
      catatan:     catatan,
    };

    var bonId;
    if (id) {
      await dbUpdate('hutang_bon', id, bonData);
      bonId = id;
      var oldItems = await dbGet('hutang_bon_item', '&bon_id=eq.' + id);
      for (var i=0;i<oldItems.length;i++) { await dbDelete('hutang_bon_item', oldItems[i].id); }
    } else {
      bonData.status = 'belum_lunas';
      var newBon = await dbInsert('hutang_bon', bonData);
      bonId = newBon[0].id;
    }

    for (var j=0;j<validItems.length;j++) {
      var r = validItems[j];
      await dbInsert('hutang_bon_item', {
        bon_id: bonId,
        barang_id: r.barang_id || null,
        nama_internal: r.katalog_produk || r.nama_internal || null,
        nama_supplier: r.nama_supplier || null,
        varian_warna: r.varian_warna || null,
        qty: r.qty,
        satuan: r.satuan,
        harga_satuan: r.harga_per_lusin,
        subtotal: Math.round(_hsRowSubtotal(r)),
      });
    }

    hsCloseSheet('hs-sheet-bon');
    await loadHutangSupplier();
  } catch(e) {
    alert('Gagal simpan: ' + e.message);
  }
}

async function hsHapusBon() {
  var id = document.getElementById('hs-bon-id').value;
  if (!id) return;
  if (!confirm('Hapus bon ini? Semua item & riwayat pembayarannya ikut terhapus.')) return;
  try {
    await dbDelete('hutang_bon', id); // cascade hapus item & pembayaran
    hsCloseSheet('hs-sheet-bon');
    await loadHutangSupplier();
  } catch(e) {
    alert('Gagal hapus: ' + e.message);
  }
}

// ─── DETAIL BON (item + bayar + riwayat) ───────────────────────
function _hsPopulateAkunSelect(selectId, filterFn) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var opts = _hsAkunKas.filter(filterFn);
  sel.innerHTML = '<option value="">Pilih akun...</option>' + opts.map(function(a) {
    return '<option value="' + a.id + '">' + (a.kode ? a.kode + ' ' : '') + _hsEsc(a.nama) + '</option>';
  }).join('');
}

async function hsOpenDetailBon(bonId) {
  var b = _hsBonList.find(function(x){ return x.id===bonId; });
  if (!b) return;
  _hsCurrentBonId = bonId;
  var supplier = _hsSupplierList.find(function(s){ return s.id===b.supplier_id; });
  document.getElementById('hs-detail-title').textContent = supplier ? supplier.nama : 'Detail Bon';

  var st = _hsSisaBon(b);
  var pct = b.total > 0 ? Math.round((st.bayar / b.total) * 100) : 0;
  pct = Math.max(0, Math.min(100, pct));
  document.getElementById('hs-detail-total').textContent = 'Total ' + fmtRpFull(b.total);
  document.getElementById('hs-detail-sisa').textContent  = st.sisa > 0 ? 'Sisa ' + fmtRpFull(st.sisa) : 'Lunas';
  var donut = document.getElementById('hs-detail-donut');
  donut.style.setProperty('--pct', pct);
  donut.style.setProperty('--donut-color', st.sisa<=0 ? 'var(--ok)' : (st.bayar>0 ? 'var(--warn)' : 'var(--danger)'));
  document.getElementById('hs-detail-donut-txt').textContent = pct + '%';

  var itemsWrap = document.getElementById('hs-detail-items');
  itemsWrap.innerHTML = '<div class="hs-empty" style="padding:10px 0">Memuat...</div>';
  try {
    var items = await dbGet('hutang_bon_item', '&bon_id=eq.' + bonId + '&order=id.asc');
    itemsWrap.innerHTML = (items && items.length) ? items.map(function(it) {
      var namaTampil = it.nama_internal || '—';
      var subNama = [];
      if (it.varian_warna) subNama.push('varian: ' + it.varian_warna);
      if (it.nama_supplier) subNama.push('supplier: ' + it.nama_supplier);
      return '<div class="hs-detail-item-row">' +
        '<div><div class="hs-detail-item-nama">' + _hsEsc(namaTampil) + '</div>' +
        (subNama.length ? '<div class="hs-detail-item-nama-sup">' + _hsEsc(subNama.join(' · ')) + '</div>' : '') + '</div>' +
        '<div class="hs-detail-item-qty">' + it.qty + ' ' + (it.satuan||'') + '</div>' +
        '<div class="hs-detail-item-sub">' + fmtRpFull(it.subtotal) + '</div>' +
      '</div>';
    }).join('') : '<div class="hs-empty" style="padding:10px 0">Tidak ada data barang.</div>';
  } catch(e) {
    itemsWrap.innerHTML = '<div class="hs-empty">Gagal memuat barang.</div>';
  }

  _hsPopulateAkunSelect('hs-pay-akun-debit', function(a) {
    return a.kelompok === 'beban' || a.kelompok === 'kewajiban';
  });
  _hsPopulateAkunSelect('hs-pay-akun-kredit', function(a) {
    return a.kelompok === 'aset' && (a.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
  });
  document.getElementById('hs-pay-nominal').value = st.sisa > 0 ? st.sisa.toLocaleString('id-ID') : '';
  idrInput('hs-pay-nominal');
  document.getElementById('hs-pay-tanggal').value = new Date().toISOString().slice(0,10);
  document.getElementById('hs-pay-catatan').value = '';

  await _hsRenderRiwayatBayar(bonId);
  hsOpenSheet('hs-sheet-detail');
}

async function _hsRenderRiwayatBayar(bonId) {
  var wrap = document.getElementById('hs-detail-riwayat');
  var list = _hsPembayaranAll.filter(function(p){ return p.bon_id===bonId; });
  if (!list.length) { wrap.innerHTML = '<div class="hs-empty" style="padding:10px 0">Belum ada pembayaran.</div>'; return; }
  wrap.innerHTML = list.map(function(p) {
    var akun = _hsAkunKas.find(function(a){ return a.id===p.kas_akun_id; });
    return '<div class="hs-pay-item">' +
      '<div class="hs-pay-item-left">' + _hsFmtTgl(p.tanggal) + (akun ? ' · ' + _hsEsc(akun.nama) : '') + (p.catatan ? ' · ' + _hsEsc(p.catatan) : '') + '</div>' +
      '<div class="hs-pay-item-nom">' + fmtRpFull(p.nominal) + '</div>' +
    '</div>';
  }).join('');
}

async function hsSimpanBayar() {
  var bonId = _hsCurrentBonId;
  if (!bonId) return;
  var b = _hsBonList.find(function(x){ return x.id===bonId; });
  if (!b) return;

  var nominal   = idrVal('hs-pay-nominal');
  var tanggal   = document.getElementById('hs-pay-tanggal').value;
  var akunD     = document.getElementById('hs-pay-akun-debit').value;
  var akunK     = document.getElementById('hs-pay-akun-kredit').value;
  var catatan   = document.getElementById('hs-pay-catatan').value.trim() || null;

  if (!tanggal)  { alert('Tanggal wajib diisi!'); return; }
  if (!nominal)  { alert('Nominal wajib diisi!'); return; }
  if (!akunD)    { alert('Pilih akun Debit (Hutang/Beban)!'); return; }
  if (!akunK)    { alert('Pilih akun Kas/Bank sumber bayar!'); return; }

  var st = _hsSisaBon(b);
  if (nominal > st.sisa + 1) {
    if (!confirm('Nominal (' + fmtRpFull(nominal) + ') lebih besar dari sisa hutang (' + fmtRpFull(st.sisa) + '). Lanjut tetap?')) return;
  }

  try {
    await dbInsert('hutang_pembayaran', {
      bon_id: bonId,
      tanggal: tanggal,
      nominal: nominal,
      kas_akun_id: akunK,
      catatan: catatan,
    });

    await dbInsert('jurnal', {
      tanggal: tanggal,
      keterangan: 'Bayar hutang supplier' + (catatan ? ' — ' + catatan : ''),
      referensi: b.no_nota || null,
      tipe: 'keluar',
      akun_debit_id: akunD,
      akun_kredit_id: akunK,
      nominal: nominal,
      debit: nominal,
      kredit: nominal,
    });

    var newSisa = Math.max(0, st.sisa - nominal);
    if (newSisa <= 0 && b.status !== 'lunas') {
      await dbUpdate('hutang_bon', bonId, { status: 'lunas' });
    }

    hsCloseSheet('hs-sheet-detail');
    await loadHutangSupplier();
  } catch(e) {
    alert('Gagal simpan pembayaran: ' + e.message);
  }
}

// ─── MASTER BARANG: TAMBAH / EDIT ─────────────────────────────
function _hsPopulateKatalogSelect() {
  var sel = document.getElementById('hs-brg-katalog');
  if (!sel) return;
  sel.innerHTML = '<option value="">Pilih SKU Induk...</option>' + _hsKatalogList.map(function(k) {
    return '<option value="' + _hsEscAttr(k) + '">' + _hsEsc(k) + '</option>';
  }).join('');
}

function hsOpenTambahBarang() {
  document.getElementById('hs-barang-form-title').textContent = 'Tambah Barang';
  document.getElementById('hs-brg-id').value = '';
  document.getElementById('hs-brg-btn-hapus').style.display = 'none';
  _hsPopulateSupplierSelect('hs-brg-supplier-select');
  var defaultSup = _hsFilterSupplier || (_hsSupplierList[0] ? _hsSupplierList[0].id : '__baru__');
  document.getElementById('hs-brg-supplier-select').value = defaultSup;
  document.getElementById('hs-brg-supplier-baru').style.display = defaultSup === '__baru__' ? 'block' : 'none';
  document.getElementById('hs-brg-supplier-baru').value = '';
  document.getElementById('hs-brg-supplier-select').onchange = function() {
    document.getElementById('hs-brg-supplier-baru').style.display = this.value === '__baru__' ? 'block' : 'none';
  };
  if (!_hsKatalogList.length) {
    _hsPopulateKatalogSelect();
    document.getElementById('hs-brg-katalog').insertAdjacentHTML('afterend',
      '<div class="hs-item-hint" id="hs-brg-katalog-empty-hint">Belum ada data di Kelola Produk — isi dulu SKU di sana biar muncul di sini.</div>');
  } else {
    var hint = document.getElementById('hs-brg-katalog-empty-hint');
    if (hint) hint.remove();
    _hsPopulateKatalogSelect();
  }
  document.getElementById('hs-brg-nama-supplier').value = '';
  document.getElementById('hs-brg-varian').value = '';
  document.getElementById('hs-brg-harga').value = '';
  idrInput('hs-brg-harga');
  hsOpenSheet('hs-sheet-barang');
}

// ─── MASTER BARANG: PASTE MASSAL ───────────────────────────────
var _hsParsedBarang = [];

function hsShowPasteBarang() {
  _hsParsedBarang = [];
  document.getElementById('hs-paste-area').value = '';
  document.getElementById('hs-paste-preview').style.display = 'none';
  document.getElementById('hs-btn-simpan-paste-barang').style.display = 'none';

  _hsPopulateSupplierSelect('hs-paste-supplier-select');
  var defaultSup = _hsFilterSupplier || (_hsSupplierList[0] ? _hsSupplierList[0].id : '__baru__');
  document.getElementById('hs-paste-supplier-select').value = defaultSup;
  document.getElementById('hs-paste-supplier-baru').style.display = defaultSup === '__baru__' ? 'block' : 'none';
  document.getElementById('hs-paste-supplier-baru').value = '';
  document.getElementById('hs-paste-supplier-select').onchange = function() {
    document.getElementById('hs-paste-supplier-baru').style.display = this.value === '__baru__' ? 'block' : 'none';
  };

  hsOpenSheet('hs-sheet-paste-barang');
  setTimeout(function() { document.getElementById('hs-paste-area').focus(); }, 100);
}

function hsParsePasteBarang() {
  var raw = document.getElementById('hs-paste-area').value.trim();
  if (!raw) { alert('Paste data dulu!'); return; }

  _hsParsedBarang = [];
  var lines = raw.split('\n');

  lines.forEach(function(line) {
    if (!line.trim()) return;
    // Split by tab (dari Excel)
    var cols = line.split('\t').map(function(c) { return c.trim(); });
    if (cols.length < 1) return;

    var katalog = (cols[0] || '').toUpperCase();
    var varian  = (cols[1] || '').trim();
    var namaSup = (cols[2] || '').trim();
    var harga   = parseInt((cols[3]||'').replace(/[^0-9]/g,''), 10) || 0;

    if (!katalog) return;
    _hsParsedBarang.push({
      katalog_produk: katalog,
      varian_warna: varian || null,
      nama_supplier: namaSup || null,
      harga_per_lusin: harga,
      dikenal: _hsKatalogList.indexOf(katalog) !== -1
    });
  });

  if (_hsParsedBarang.length === 0) {
    alert('Tidak ada data yang bisa dibaca. Pastikan copy dari Excel dengan format: SKU Induk → Varian → SKU Suplier → Harga per Lusin');
    return;
  }

  var jumlahAsing = _hsParsedBarang.filter(function(r){ return !r.dikenal; }).length;
  document.getElementById('hs-paste-count').textContent =
    '✓ ' + _hsParsedBarang.length + ' baris siap diimport' +
    (jumlahAsing ? ' — ⚠ ' + jumlahAsing + ' SKU Induk belum ada di Kelola Produk' : '');
  document.getElementById('hs-paste-tbody').innerHTML = _hsParsedBarang.map(function(r) {
    return '<tr' + (r.dikenal ? '' : ' style="color:var(--warn)"') + '>' +
      '<td>' + _hsEsc(r.katalog_produk) + (r.dikenal ? '' : ' ⚠') + '</td>' +
      '<td>' + _hsEsc(r.varian_warna||'—') + '</td>' +
      '<td>' + _hsEsc(r.nama_supplier||'—') + '</td>' +
      '<td>Rp' + r.harga_per_lusin.toLocaleString('id-ID') + '</td>' +
      '<td>Rp' + Math.round(r.harga_per_lusin/12).toLocaleString('id-ID') + '</td>' +
      '</tr>';
  }).join('');
  document.getElementById('hs-paste-preview').style.display = 'block';
  document.getElementById('hs-btn-simpan-paste-barang').style.display = 'inline-flex';
}

async function hsSimpanPasteBarang() {
  if (_hsParsedBarang.length === 0) return;
  var btn = document.getElementById('hs-btn-simpan-paste-barang');

  try {
    var supplierId = await _hsResolveSupplierId('hs-paste-supplier-select', 'hs-paste-supplier-baru');

    btn.disabled = true;
    var ok = 0;
    for (var i = 0; i < _hsParsedBarang.length; i++) {
      var r = _hsParsedBarang[i];
      await dbInsert('hutang_barang', {
        supplier_id: supplierId,
        katalog_produk: r.katalog_produk,
        varian_warna: r.varian_warna,
        nama_supplier: r.nama_supplier,
        harga_per_lusin: r.harga_per_lusin
      });
      ok++;
      btn.textContent = 'Menyimpan ' + ok + '/' + _hsParsedBarang.length + '...';
    }
    hsCloseSheet('hs-sheet-paste-barang');
    await loadHutangSupplier();
    alert('✓ ' + ok + ' barang berhasil disimpan!');
  } catch(e) {
    alert('Gagal simpan: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-check"></i> Simpan Semua';
  }
}

function hsOpenEditBarang(id) {
  var b = _hsBarangMaster.find(function(x){ return x.id===id; });
  if (!b) return;
  document.getElementById('hs-barang-form-title').textContent = 'Edit Barang';
  document.getElementById('hs-brg-id').value = b.id;
  document.getElementById('hs-brg-btn-hapus').style.display = 'inline-flex';
  _hsPopulateSupplierSelect('hs-brg-supplier-select');
  document.getElementById('hs-brg-supplier-select').value = b.supplier_id;
  document.getElementById('hs-brg-supplier-baru').style.display = 'none';
  document.getElementById('hs-brg-supplier-baru').value = '';
  document.getElementById('hs-brg-supplier-select').onchange = function() {
    document.getElementById('hs-brg-supplier-baru').style.display = this.value === '__baru__' ? 'block' : 'none';
  };
  _hsPopulateKatalogSelect();
  document.getElementById('hs-brg-katalog').value = b.katalog_produk;
  document.getElementById('hs-brg-nama-supplier').value = b.nama_supplier || '';
  document.getElementById('hs-brg-varian').value = b.varian_warna || '';
  document.getElementById('hs-brg-harga').value = b.harga_per_lusin ? b.harga_per_lusin.toLocaleString('id-ID') : '';
  idrInput('hs-brg-harga');
  hsOpenSheet('hs-sheet-barang');
}

async function hsSimpanBarang() {
  var id       = document.getElementById('hs-brg-id').value;
  var katalog  = document.getElementById('hs-brg-katalog').value;
  var namaSup  = document.getElementById('hs-brg-nama-supplier').value.trim() || null;
  var varian   = document.getElementById('hs-brg-varian').value.trim() || null;
  var harga    = idrVal('hs-brg-harga');

  if (!katalog) { alert('Pilih SKU Induk!'); return; }
  if (!harga)   { alert('Isi harga per lusin!'); return; }

  try {
    var supplierId = await _hsResolveSupplierId('hs-brg-supplier-select', 'hs-brg-supplier-baru');

    var data = {
      supplier_id: supplierId,
      katalog_produk: katalog,
      nama_supplier: namaSup,
      varian_warna: varian,
      harga_per_lusin: harga,
    };

    if (id) { await dbUpdate('hutang_barang', id, data); }
    else    { await dbInsert('hutang_barang', data); }

    hsCloseSheet('hs-sheet-barang');
    await loadHutangSupplier();
  } catch(e) {
    alert('Gagal simpan: ' + e.message);
  }
}

async function hsHapusBarang() {
  var id = document.getElementById('hs-brg-id').value;
  if (!id) return;
  if (!confirm('Hapus barang ini dari Master? Bon yang udah pernah pakai barang ini tetap aman (datanya udah ke-snapshot).')) return;
  try {
    await dbDelete('hutang_barang', id);
    hsCloseSheet('hs-sheet-barang');
    await loadHutangSupplier();
  } catch(e) {
    alert('Gagal hapus: ' + e.message);
  }
}

// ─── UTIL ───────────────────────────────────────────────────────
function _hsEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
function _hsEscAttr(s) { return _hsEsc(s); }

function _hsFmtTgl(iso) {
  if (!iso) return '—';
  var d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  var bln = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return String(d.getDate()).padStart(2,'0') + ' ' + bln[d.getMonth()] + ' ' + d.getFullYear();
}
