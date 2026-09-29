// ─── CHANNEL-MASTER.JS v2 — Master Data Channel + Beban Per Channel ──
// Setiap channel punya % Beban & NPM sendiri → tabel channel_beban
// Halaman Beban Operasional sudah dihapus, setting beban/NPM ada di sini
// 30 Sep 2026: halaman Price List lama dihapus — harga jual per channel sekarang MANUAL
// (tabel channel_harga), diatur di panel kanan halaman ini (+ Edit Massal).
// 30 Sep 2026 (malam): harga jual jadi 2 TIER — (1) per KATEGORI toko (tabel
// channel_kategori_harga, tombol "Harga" di header kategori) dan (2) per TOKO
// (channel_harga). 1 toko × 1 katalog = 1 harga, diambil dari yang paling spesifik:
// harga toko → harga kategori → rumus otomatis HPP × (1 + Beban% + NPM%).
// KHUSUS Offline, Reseller & Dropship (_CHP_KATS, tab "Lainnya"): harga tetap.
// CATATAN NAMA: key DB 'reseller' = Dropship (kategori lama diganti nama); Reseller sungguhan = key 'reseller_baru'. Shopee/Lazada/TikTok tidak pakai Price List
// (harga jual bergerak karena promo/voucher; margin dihitung dari harga jual aktual). Data
// channel_harga lama milik toko-toko itu TIDAK dihapus, cuma tidak ditampilkan.
// 30 Sep 2026 (malam, revisi): harga jual sekarang DIHITUNG dari NET INCOME dalam RUPIAH:
// Harga Jual = HPP + Net Income. User cuma mengetik Net Income (IDR) per katalog; kolom Harga Jual
// read-only. Net Income disimpan di kolom net_income (channel_harga & channel_kategori_harga), jadi
// kalau HPP berubah, harga jual ikut (Net Income tetap). harga_jual di DB = snapshot (NOT NULL), tidak
// dipakai untuk hitung. Baris LAMA (net_income NULL) tetap dianggap harga tetap = harga_jual.
// 30 Sep 2026 (malam, revisi 3): tombol "Isi dari rumus lama" DIHAPUS dari UI (chpSeed dipertahankan sbg dead code).
// Picker untuk Offline/Reseller/Dropship jadi TAMBAH-SAJA: katalog yang sudah ada di Price List tidak ditawarkan lagi.
// Melepas produk dilakukan dari tabel (mode Edit → ikon tempat sampah per baris). Shopee/Lazada/TikTok (tanpa Price List)
// tetap pakai picker centang/uncentang karena tidak punya tabel untuk melepas.
// 30 Sep 2026 (malam, revisi 2): Price List punya tombol "Pilih Produk" sendiri (toko & kategori; pilihan kategori
// disimpan di channel_produk dengan channel_id 'kat:<kategori>'; TIDAK diwariskan ke toko — koreksi 30 Sep malam:
// tiap toko hanya menampilkan pilihannya SENDIRI, harga kategori cuma jadi patokan Net Income utk katalog yg dipilih toko). Katalog
// yang tampil = terpilih ∪ sudah punya harga (toko/kategori). Tabel Price List TERKUNCI (teks biasa) — harus klik
// "Edit" dulu baru kolom Net Income bisa diketik; habis simpan Pilih Produk otomatis masuk mode Edit.
// 30 Sep 2026 (malam): PILIH PRODUK per channel — tombol "Produk" (ikon kotak + jumlah) di kolom Aksi
// SEMUA baris channel (tab Channel & Lainnya). Daftar katalog diambil dari Kelola Produk (produk aktif +
// clearance), pilihan disimpan per KATALOG (semua varian ikut) di tabel channel_produk (channel_id, katalog).
// Toko yang belum pilih = KOSONG. Price List (tab Lainnya) hanya menampilkan katalog yang dipilih toko itu;
// mode kategori = gabungan katalog yang dipilih toko-toko di kategori tsb. Kalau tabel channel_produk belum
// dibuat (_chProdukOk=false) → Price List jatuh balik ke perilaku lama (tampil semua) supaya tidak kosong mendadak.

document.getElementById('page-channel').innerHTML = `
  <style>
    /* Dipinjam dari pola hutang-supplier.js — dipakai checkbox Sistem
       (Dropship/Reseller/Produksi Sendiri) di modal Tambah/Edit Supplier. */
    .hs-jenis-radio {
      flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
      padding:9px 10px; border-radius:8px; border:1.5px solid var(--ink4); cursor:pointer;
      font-size:13px; font-weight:700; color:var(--ink2); background:var(--cream2);
      transition:background .15s ease, color .15s ease, border-color .15s ease;
    }
    .hs-jenis-radio input { accent-color:var(--ink); }
    .hs-jenis-radio:has(input:checked) { border-color:var(--ink); color:var(--cream); background:var(--ink); }
    .hs-jenis-radio:has(input:checked) input { accent-color:var(--cream); }

    /* ROOT CAUSE lebar mentok: style.css ("Lebar proporsional", 16 Sep) membatasi
       SEMUA anak langsung #page-channel maks 720px. Tab Channel sekarang 2 kolom,
       jadi cap itu dilepas khusus untuk nav tab + tab Channel (selector ber-ID menang
       atas aturan lama). Tab Supplier & ROP tetap 720px. */
    /* Tab: gaya sama dengan Cost Produksi (teks polos, tab aktif digaris bawah), diletakkan di kanan */
    #ch-tabs-nav { display:flex; align-items:center; justify-content:flex-end; gap:16px; margin-bottom:12px; }
    #ch-tabs-nav .ch-tab-btn {
      background:none; border:none; border-bottom:2px solid transparent;
      padding:4px 1px 8px; font-family:var(--f); font-size:13px; font-weight:800;
      color:var(--ink2); opacity:.65; cursor:pointer; white-space:nowrap;
      transition:opacity .15s ease, border-color .15s ease, color .15s ease;
    }
    #ch-tabs-nav .ch-tab-btn:hover { opacity:.9; }
    #ch-tabs-nav .ch-tab-btn.active { opacity:1; color:var(--ink); border-bottom-color:var(--ink); }
    #page-channel > #ch-tabs-nav,
    #page-channel > #ch-tab-content-channel,
    #page-channel > #ch-tab-content-lainnya { max-width:none; }

    /* Layout 2 kolom: kiri = daftar channel, kanan = Price List manual (lebih lebar) */
    .ch-grid { display:grid; grid-template-columns:minmax(380px,5fr) minmax(0,7fr); gap:14px; align-items:start; }
    .ch-col-right { position:sticky; top:8px; }
    tr[data-action="pilih-ch"] { cursor:pointer; }
    tr[data-action="pilih-ch"].ch-row-sel { background:var(--cream2); box-shadow:inset 3px 0 0 var(--ink); }

    /* Panel Price List: card setinggi layar, header tabel FREEZE, hanya baris data yang scroll */
    #chp-card { display:flex; flex-direction:column; height:calc(100vh - 150px); min-height:380px; margin-bottom:0; }
    #chp-card .card-title { flex-shrink:0; }
    #chp-body { display:flex; flex-direction:column; flex:1 1 auto; min-height:0; }
    #chp-body > * { flex-shrink:0; }
    #chp-body > .chp-scroll { flex:1 1 auto; min-height:0; }
    .chp-scroll { overflow-y:auto; overflow-x:hidden; overscroll-behavior:none; border:1px solid var(--ink4); }
    #chp-table { width:100%; table-layout:fixed; }
    #chp-table thead th { position:sticky; top:0; z-index:3; }
    #chp-table td { overflow:hidden; text-overflow:ellipsis; }
    #chp-table .chp-c-chk   { width:44px; text-align:center; }
    #chp-table .chp-c-del   { width:46px; text-align:center; }
    #chp-table:not(.chp-edit) .chp-c-del { display:none; }
    #chp-table .chp-c-hpp   { width:130px; }
    #chp-table .chp-c-ni    { width:150px; }
    #chp-table .chp-c-harga { width:130px; }
    #chp-table .chp-c-npm   { width:90px; }
    #chp-table:not(.chp-bulk) .chp-c-chk { display:none; }
    #chp-table .chp-chk { width:17px; height:17px; cursor:pointer; accent-color:var(--ink); }
    #chp-table tr.chp-sel td { background:var(--cream3); }
    .chp-inp { width:100%; box-sizing:border-box; text-align:right; font-family:var(--f); font-size:13px; padding:5px 8px; border:2px dashed var(--ink3); background:var(--cream); color:var(--ink); }
    .chp-inp.manual { border:2px solid var(--ink); font-weight:700; }
    .chp-inp.kat { border:2px solid var(--ink3); }
    .chp-inp.kat::placeholder { color:var(--ink); opacity:1; font-weight:600; }
    .chp-bulkbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:8px 10px; margin-bottom:8px; background:var(--cream2); border:2px dashed var(--ink3); }
    .chp-bulkbar .chp-bulk-lbl { font-size:12px; font-weight:700; color:var(--ink2); text-transform:uppercase; letter-spacing:.05em; }
    .chp-bulkbar input { flex:1 1 130px; min-width:110px; box-sizing:border-box; text-align:right; font-family:var(--f); font-size:14px; padding:6px 10px; border:2px solid var(--ink); background:var(--cream); color:var(--ink); }

    @media (max-width:900px) {
      .ch-grid { grid-template-columns:minmax(0,1fr); }
      .ch-col-right { position:static; order:-1; }
      #chp-card { height:auto; min-height:0; }
      #chp-body > .chp-scroll { flex:0 0 auto; max-height:60vh; }
    }
    /* Mobile: tabel muat layar tanpa scroll horizontal — kolom HPP disembunyikan */
    @media (max-width:600px) {
      #chp-table .chp-c-hpp { display:none; }
      #chp-table .chp-c-chk { width:38px; }
      #chp-table .chp-c-ni { width:36%; }
      #chp-table .chp-c-harga { width:28%; }
      #chp-table .chp-c-npm { width:64px; }
    }
  </style>

  <!-- ══ TAB NAVIGATION ══ -->
  <div id="ch-tabs-nav">
    <button id="ch-tab-channel"  class="ch-tab-btn active" onclick="chSwitchTab('channel')">Channel</button>
    <button id="ch-tab-supplier" class="ch-tab-btn"        onclick="chSwitchTab('supplier')">Supplier &amp; ROP</button>
    <button id="ch-tab-lainnya"  class="ch-tab-btn"        onclick="chSwitchTab('lainnya')">Lainnya</button>
  </div>

  <!-- ══ TAB: CHANNEL MASTER ══ -->
  <div id="ch-tab-content-channel">
   <div style="max-width:720px">

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
        <thead><tr><th>Nama Channel</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-toko_utama"><tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
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
        <thead><tr><th>Nama Toko Lazada</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-lazada"><tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
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
        <thead><tr><th>Nama Toko TikTok</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-tiktok"><tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table></div>
    </div>

   </div>
  </div><!-- end tab channel -->

  <!-- ══ TAB: LAINNYA (Offline · Reseller · Dropship + Price List) ══ -->
  <div id="ch-tab-content-lainnya" style="display:none">
   <div class="ch-grid">
    <div class="ch-col-left">

    <!-- OFFLINE -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span><i class="ti ti-map-pin"></i> Offline</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="chpPilihKategori('offline','Offline')" title="Atur harga jual semua toko Offline sekaligus"><i class="ti ti-tag"></i> Harga</button>
          <button class="btn btn-sm" onclick="showEditKategori('offline','Offline')"><i class="ti ti-adjustments"></i> Edit Kategori</button>
          <button class="btn btn-sm btn-primary" onclick="showFormChannel('offline')"><i class="ti ti-plus"></i> Tambah</button>
        </div>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Nama Channel</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-offline"><tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table></div>
    </div>

    <!-- RESELLER BARU (key DB: reseller_baru) -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="display:inline-flex;align-items:center;gap:6px"><i class="ti ti-users" style="font-size:16px"></i> Reseller</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="chpPilihKategori('reseller_baru','Reseller')" title="Atur harga jual semua toko Reseller sekaligus"><i class="ti ti-tag"></i> Harga</button>
          <button class="btn btn-sm" onclick="showEditKategori('reseller_baru','Reseller')"><i class="ti ti-adjustments"></i> Edit Kategori</button>
          <button class="btn btn-sm btn-primary" onclick="showFormChannel('reseller_baru')"><i class="ti ti-plus"></i> Tambah</button>
        </div>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Nama Reseller</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-reseller_baru"><tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table></div>
    </div>

    <!-- DROPSHIP (key DB: reseller) -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="display:inline-flex;align-items:center;gap:6px"><i class="ti ti-truck-delivery" style="font-size:16px"></i> Dropship</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="chpPilihKategori('reseller','Dropship')" title="Atur harga jual semua toko Dropship sekaligus"><i class="ti ti-tag"></i> Harga</button>
          <button class="btn btn-sm" onclick="showEditKategori('reseller','Dropship')"><i class="ti ti-adjustments"></i> Edit Kategori</button>
          <button class="btn btn-sm btn-primary" onclick="showFormChannel('reseller')"><i class="ti ti-plus"></i> Tambah</button>
        </div>
      </div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Nama Dropship</th><th style="text-align:center">Beban (%)</th><th style="text-align:center">NPM (%)</th><th>Aksi</th></tr></thead>
        <tbody id="ch-tbody-reseller"><tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table></div>
    </div>

    </div><!-- end ch-col-left -->

    <!-- ══ PANEL KANAN: PRICE LIST MANUAL ══ -->
    <div class="ch-col-right">
      <div class="card" id="chp-card">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <span><i class="ti ti-tag"></i> Price List <span id="chp-title" style="color:var(--accent)"></span></span>
          <span style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-sm" id="chp-btn-pick" onclick="chpPilihProdukPanel()" style="display:none" title="Pilih katalog dari Kelola Produk yang dijual"><i class="ti ti-package"></i> Pilih Produk</button>
            <button class="btn btn-sm" id="chp-btn-edit" onclick="chpEditToggle()" style="display:none" title="Buka kunci kolom Net Income untuk diedit"><i class="ti ti-edit"></i> Edit</button>
            <button class="btn btn-sm" id="chp-btn-bulk" onclick="chpBulkMulai()" style="display:none" title="Pilih beberapa katalog lalu isi 1 harga sekaligus"><i class="ti ti-checkbox"></i> Edit Massal</button>
          </span>
        </div>
        <div id="chp-hint" style="padding:22px 10px;text-align:center;color:var(--ink3);font-style:italic;font-size:14px">
          Klik salah satu toko di daftar (atau tombol Harga di header kategori) untuk memilih produk &amp; mengatur Net Income-nya.
        </div>
        <div id="chp-body" style="display:none">
          <div id="chp-info" style="font-size:12px;color:var(--ink2);margin-bottom:8px"></div>
          <input type="text" id="chp-search" placeholder="🔍 Cari katalog..." autocomplete="off" oninput="chpFilter(this.value)"
            style="font-family:var(--f);font-size:13px;padding:5px 10px;border:2px solid var(--ink);background:var(--cream);width:100%;box-sizing:border-box;margin-bottom:8px">
          <div class="chp-bulkbar" id="chp-bulkbar" style="display:none">
            <span class="chp-bulk-lbl">Net Income</span>
            <input type="text" inputmode="numeric" id="chp-bulk-harga" placeholder="mis: 15.000" autocomplete="off" spellcheck="false" oninput="chpFmtInput(this)" onkeydown="if(event.key==='Enter')chpBulkTerapkan()">
            <button class="btn btn-sm btn-primary" id="chp-bulk-btn" onclick="chpBulkTerapkan()"><i class="ti ti-check"></i> Terapkan (0)</button>
            <button class="btn btn-sm" onclick="chpBulkBatal()"><i class="ti ti-x"></i> Batal</button>
          </div>
          <div class="chp-scroll"><table class="tbl" id="chp-table">
            <thead><tr>
              <th class="chp-c-chk"><input type="checkbox" class="chp-chk" id="chp-chk-all" onchange="chpToggleAll(this.checked)" title="Pilih semua yang tampil"></th>
              <th>Katalog</th>
              <th class="chp-c-hpp" style="text-align:right">HPP</th>
              <th class="chp-c-ni" style="text-align:right">Net Income</th>
              <th class="chp-c-harga" style="text-align:right">Harga Jual</th>
              <th class="chp-c-npm" style="text-align:center">NPM</th>
              <th class="chp-c-del" title="Lepas produk dari daftar"></th>
            </tr></thead>
            <tbody id="chp-tbody"></tbody>
          </table></div>
          <div id="chp-footer" style="font-size:12px;color:var(--ink3);margin-top:8px;text-align:right"></div>
          <div style="font-size:11px;color:var(--ink3);margin-top:2px;line-height:1.5">
            Harga Jual = HPP + Net Income (Rp). Tabel terkunci — klik Edit dulu untuk mengetik Net Income (Enter/pindah kolom = simpan), lalu Selesai. Produk ditambah lewat Pilih Produk (yang sudah ada tidak muncul lagi) dan dilepas lewat ikon sampah di mode Edit; tiap toko hanya menampilkan produk yang dipilihnya sendiri (Net Income kategori dipakai sebagai patokan untuk katalog yang sama). Urutan: Net Income toko → Net Income kategori → otomatis (rumus lama). Garis putus-putus = otomatis, abu-abu tebal = ikut kategori, hitam = punya toko sendiri; kosongkan = kembali ke tingkat di atasnya. NPM = margin dari HPP − Beban channel.
          </div>
        </div>
      </div>
    </div>
   </div><!-- end ch-grid -->
  </div><!-- end tab lainnya -->


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
      <div class="form-group">
        <label>Sistem</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <label class="hs-jenis-radio" id="supplier-jenis-dropship-wrap">
            <input type="checkbox" id="supplier-dropship" checked onchange="chSupplierJenisToggle('dropship')">
            <i class="ti ti-truck-delivery"></i> Dropship
          </label>
          <label class="hs-jenis-radio" id="supplier-jenis-reseller-wrap">
            <input type="checkbox" id="supplier-reseller" onchange="chSupplierJenisToggle('reseller')">
            <i class="ti ti-file-invoice"></i> Reseller
          </label>
          <label class="hs-jenis-radio" id="supplier-jenis-produksi-wrap">
            <input type="checkbox" id="supplier-produksi" onchange="chSupplierJenisToggle('produksi')">
            <i class="ti ti-hammer"></i> Produksi Sendiri
          </label>
        </div>
        <div style="font-size:11px;color:var(--ink3);margin-top:6px">
          Dropship = langsung kirim hari itu, gak perlu PO. Reseller = wajib PO (+opsional uang muka). Bisa dua-duanya kalau supplier ini bisa dua cara. Produksi Sendiri = bukan supplier luar (mis. tukang rajut sendiri) — gak bisa digabung Dropship/Reseller, gak muncul di tab eksekusi Re Stock (Bon/PO) Hutang Barang, diarahin ke Cost Produksi.
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
  var tabs    = ['channel', 'supplier', 'lainnya'];
  tabs.forEach(function(t) {
    var btn     = document.getElementById('ch-tab-' + t);
    var content = document.getElementById('ch-tab-content-' + t);
    var active  = t === tab;
    if (btn) btn.classList.toggle('active', active);
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
  await _chProdukLoad();

  await Promise.all([
    loadChannelByKategori('toko_utama'),
    loadChannelByKategori('reseller'),
    loadChannelByKategori('lazada'),
    loadChannelByKategori('tiktok'),
    loadChannelByKategori('offline'),
    loadChannelByKategori('reseller_baru'),
  ]);
}

async function loadChannelByKategori(kat) {
  const tbody = document.getElementById('ch-tbody-' + kat);
  tbody.innerHTML = '<tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';
  try {
    const data = await dbGet('channels', '&kategori=eq.' + kat + '&order=nama.asc');
    _chCatChannels[kat] = (data || []).map(function(r) { return { id: String(r.id), nama: r.nama || '' }; });
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="color:var(--ink3);font-style:italic">Belum ada data</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(row => {
      const safeNama = (row.nama||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const beban    = _chBebanMap[row.id];
      const bPct     = beban ? (beban.beban_persen || 0) : null;
      const nPct     = beban ? (beban.npm_persen   || 0) : null;
      const bLabel   = bPct !== null
        ? '<span style="color:var(--danger);font-weight:600">' + bPct.toFixed(1) + '%</span>'
        : '<span style="color:var(--ink3);font-style:italic">—</span>';
      const nLabel   = nPct !== null
        ? '<span style="color:var(--ok);font-weight:600">' + nPct.toFixed(1) + '%</span>'
        : '<span style="color:var(--ink3);font-style:italic">—</span>';
      const selCls   = (String(row.id) === _chpSelId) ? ' class="ch-row-sel"' : '';
      // Price List hanya untuk Reseller & Offline (harga tetap). Shopee/Lazada/TikTok harganya bergerak → tidak dipakai.
      const trAttr   = _CHP_KATS.indexOf(kat) !== -1 ? ' data-action="pilih-ch" data-id="' + row.id + '" data-nama="' + safeNama + '" data-kat="' + kat + '"' + selCls : '';
      return '<tr' + trAttr + '>' +
        '<td style="font-weight:600">' + row.nama + '</td>' +
        '<td style="text-align:center">' + bLabel + '</td>' +
        '<td style="text-align:center">' + nLabel + '</td>' +
        '<td style="white-space:nowrap">' +
          '<button class="btn btn-sm" data-action="produk-ch" data-id="' + row.id + '" data-nama="' + safeNama + '" data-kat="' + kat + '" style="margin-right:4px" title="Pilih produk yang dijual di channel ini"><i class="ti ti-package"></i> ' + _chProdukCount(row.id) + '</button>' +
          '<button class="btn btn-sm" data-action="setting-beban" data-id="' + row.id + '" data-nama="' + safeNama + '" data-kat="' + kat + '" style="margin-right:4px" title="Setting Beban &amp; NPM"><i class="ti ti-settings"></i></button>' +
          '<button class="btn btn-sm" data-action="edit-ch" data-id="' + row.id + '" data-kat="' + kat + '" style="margin-right:4px"><i class="ti ti-edit"></i></button>' +
          '<button class="btn btn-sm btn-danger" data-action="hapus-ch" data-id="' + row.id + '" data-kat="' + kat + '" data-nama="' + safeNama + '"><i class="ti ti-trash"></i></button>' +
        '</td>' +
      '</tr>';
    }).join('');

    if (typeof loadChannelDropdownJP === 'function') loadChannelDropdownJP();
  } catch(err) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--danger)">Error: ' + err.message + '</td></tr>';
  }
}

// ─── FORM TAMBAH/EDIT CHANNEL ─────────────────────────────────
function showFormChannel(kat) {
  var labels = { toko_utama:'Nama Channel Toko', reseller:'Nama Dropship', reseller_baru:'Nama Reseller', lazada:'Nama Toko Lazada', tiktok:'Nama Toko TikTok', offline:'Nama Channel Offline' };
  var titles = { toko_utama:'Tambah Channel Toko', reseller:'Tambah Dropship', reseller_baru:'Tambah Reseller', lazada:'Tambah Toko Lazada', tiktok:'Tambah Toko TikTok', offline:'Tambah Channel Offline' };
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
    var titles = { toko_utama:'Edit Channel Toko', reseller:'Edit Dropship', reseller_baru:'Edit Reseller', lazada:'Edit Toko Lazada', tiktok:'Edit Toko TikTok', offline:'Edit Channel Offline' };
    document.getElementById('ch-modal-title').innerHTML = '<i class="ti ti-edit"></i> ' + (titles[kat]||'Edit Channel');
    showModal('modal-channel');
  } catch(err) { alert('Gagal load: ' + err.message); }
}

async function hapusChannel(id, nama, kat) {
  confirmDelete('Hapus channel "' + nama + '"?', async () => {
    try {
      await dbDelete('channels', id);
      delete _chBebanMap[id];
      await chpHapusHargaChannel(id);
      await chpHapusProdukChannel(id);
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
  document.getElementById('cb-preview').innerHTML =
    'Beban: <b style="color:var(--danger)">' + b.toFixed(1) + '%</b> &nbsp;|&nbsp; ' +
    'NPM: <b style="color:var(--ok)">' + n.toFixed(1) + '%</b>' +
    '<br><span style="color:var(--ink3)">Price List ada di tab Lainnya (Offline, Reseller, Dropship).</span>';
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
    loadChannelByKategori('reseller_baru'),
    ]);
    if (_chpSelId) chpRender();
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
  } else if (action === 'produk-ch') {
    showPilihProduk(id, btn.dataset.nama, kat);
  } else if (action === 'pilih-ch') {
    chpPilih(id, btn.dataset.nama, kat);
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
  document.getElementById('ek-preview').innerHTML =
    'Beban: <b style="color:var(--danger)">' + b.toFixed(1) + '%</b> &nbsp;|&nbsp; ' +
    'NPM: <b style="color:var(--ok)">' + n.toFixed(1) + '%</b>';
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
    if (typeof chpRender === 'function') chpRender();

  } catch(err) {
    alert('Gagal simpan: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Semua'; }
  }
}


// ═══════════════════════════════════════════════════════════════
// ─── PRICE LIST MANUAL (panel kanan halaman Channel) ───────────
// 30 Sep 2026: menggantikan halaman Price List lama. Harga jual per
// KATALOG × CHANNEL diketik manual, disimpan di tabel channel_harga
// (channel_id, katalog, harga_jual). Katalog yang belum diisi = otomatis
// pakai rumus lama: Math.ceil(HPP × (1 + (beban% + npm%)/100)).
// NPM (estimasi) = (harga − HPP) / HPP × 100 − beban%  → sama konvensinya
// dengan rumus lama, jadi harga otomatis selalu = NPM setting channel.
// ═══════════════════════════════════════════════════════════════
var _chpSelId   = '';   // id channel aktif (string)
var _chpSelNama = '';
var _chpProduk  = [];   // baris produk (aktif + clearance)
var _chpHarga   = {};   // katalog → { id, harga_jual } utk channel aktif
var _chpRows    = [];   // baris yg sedang ter-render (index dipakai input)
var _chpQuery   = '';
var _chpSeq     = 0;    // guard race saat ganti channel cepat
var _chpBulk    = false; // mode Edit Massal aktif?
var _chpEdit    = false; // mode Edit (kolom Net Income bisa diketik) aktif? default TERKUNCI
var _chpSel     = {};    // katalog → true (dipilih di Edit Massal)
var _chpFlashT  = null;
var _chpKatHarga = {};  // katalog → { id, harga_jual } harga KATEGORI dari channel aktif (fallback; hanya mode toko)
var _chCatChannels = {}; // kategori → [{ id, nama }] (diisi loadChannelByKategori)
// Kategori yang punya Price List (harga jual tetap): Offline, Reseller (key reseller_baru), Dropship (key reseller — kategori lama, ganti nama).
var _CHP_KATS  = ['reseller', 'reseller_baru', 'offline'];
var _chpChKat   = '';   // kategori dari channel aktif (mode toko)

// Mode panel: toko (_chpSelId = id channel) atau kategori (_chpSelId = 'kat:<kategori>').
// Di mode kategori, _chpHarga berisi baris channel_kategori_harga milik kategori itu.
function _chpIsKat() { return _chpSelId.indexOf('kat:') === 0; }
function _chpKatKey() { return _chpSelId.slice(4); }
function _chpTblOf(key) { return String(key).indexOf('kat:') === 0 ? 'channel_kategori_harga' : 'channel_harga'; }
function _chpQ(key) {
  key = String(key);
  return key.indexOf('kat:') === 0
    ? '&kategori=eq.' + encodeURIComponent(key.slice(4))
    : '&channel_id=eq.' + encodeURIComponent(key);
}
// val = NET INCOME (Rp); harga_jual = snapshot HPP + Net Income (kolom NOT NULL, tidak dipakai menghitung)
function _chpMkRow(key, katalog, val, hpp) {
  key = String(key);
  var hj = (Number(hpp) || 0) + val;
  return key.indexOf('kat:') === 0
    ? { kategori: key.slice(4), katalog: katalog, harga_jual: hj, net_income: val }
    : { channel_id: key, katalog: katalog, harga_jual: hj, net_income: val };
}
// Harga berlaku dari 1 baris DB: net_income terisi → HPP + net_income; NULL (baris lama) → harga_jual tetap
function _chpRowEff(row, hpp) {
  if (!row) return 0;
  if (row.net_income !== null && row.net_income !== undefined && row.net_income !== '') return (Number(hpp) || 0) + Number(row.net_income);
  return Number(row.harga_jual) || 0;
}

function _chpEsc(t) {
  return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _chpFmt(n) { return Math.round(Number(n) || 0).toLocaleString('id-ID'); }

function _chpBeban() {
  if (_chpIsKat()) {
    // Mode kategori: pakai Beban/NPM bersama semua toko di kategori. Kalau beda-beda → mixed.
    var chs  = _chCatChannels[_chpKatKey()] || [];
    var list = chs.map(function(c) { return _chBebanMap[c.id]; }).filter(Boolean);
    if (!list.length) return { ada: false, mixed: false, beban: 0, npm: 0 };
    var b0 = Number(list[0].beban_persen) || 0, n0 = Number(list[0].npm_persen) || 0;
    var same = list.length === chs.length && list.every(function(x) {
      return (Number(x.beban_persen) || 0) === b0 && (Number(x.npm_persen) || 0) === n0;
    });
    return { ada: true, mixed: !same, beban: b0, npm: n0 };
  }
  var b = _chBebanMap[_chpSelId];
  return { ada: !!b, mixed: false, beban: b ? (Number(b.beban_persen) || 0) : 0, npm: b ? (Number(b.npm_persen) || 0) : 0 };
}

// 1 katalog = 1 baris, HPP diambil dari baris pertama katalog (sama seperti Price List lama)
// SEMUA katalog di Kelola Produk (dipakai modal Pilih Produk). n = jumlah varian.
function _chpKatalogAll() {
  var map = {};
  (_chpProduk || []).forEach(function(r) {
    var k = r.katalog || '—';
    if (!map[k]) map[k] = { katalog: k, hpp: Number(r.hpp) || 0, n: 0 };
    map[k].n++;
  });
  return Object.values(map).sort(function(a, b) { return a.katalog.localeCompare(b.katalog); });
}

// Katalog yang TAMPIL di Price List = terpilih lewat Pilih Produk ∪ yang sudah punya harga — di TINGKAT YANG SEDANG DIBUKA saja.
// Mode toko: pilihan toko itu + harga toko itu (BUKAN pilihan/harga kategori — toko yang belum memilih tampil kosong).
// Mode kategori: pilihan kategori + harga kategori. Net Income kategori tetap jadi fallback harga (_chpKatHarga) untuk katalog
// yang dipilih toko tapi belum punya Net Income sendiri (lihat _chpCalc). Bulk, footer, NPM semuanya lewat fungsi ini.
function _chpKatalogList() {
  var all = _chpKatalogAll();
  if (!_chProdukOk) return all;   // tabel channel_produk belum ada → perilaku lama
  var set = {};
  function add(o) { Object.keys(o || {}).forEach(function(k) { set[k] = true; }); }
  add(_chProdukMap[_chpSelId]);
  add(_chpHarga);
  var out = all.filter(function(k) { return !!set[k.katalog]; });
  // Terpilih/berharga tapi sudah tidak ada di Kelola Produk (dihapus / di-rename) → tetap tampil supaya bisa dilepas
  var ada = {};
  all.forEach(function(k) { ada[k.katalog] = true; });
  Object.keys(set).forEach(function(k) { if (!ada[k]) out.push({ katalog: k, hpp: 0, n: 0, orphan: true }); });
  return out;
}

// hitung 1 baris → 1 harga berlaku. Urutan: Net Income sendiri (toko / kategori yg sedang dibuka)
// → Net Income kategori (hanya mode toko) → otomatis. src: 'own' | 'kat' | 'auto'
// Harga Jual = HPP + Net Income (baris lama tanpa net_income = harga tetap).
function _chpCalc(k) {
  var m      = _chpBeban();
  var mult   = 1 + (m.beban + m.npm) / 100;
  var auto   = m.mixed ? 0 : Math.ceil(k.hpp * mult);
  var man    = _chpHarga[k.katalog] || null;
  var khRow  = (!_chpIsKat() && _chpKatHarga[k.katalog]) ? _chpKatHarga[k.katalog] : null;
  var manEff = man ? _chpRowEff(man, k.hpp) : 0;
  var kh     = khRow ? _chpRowEff(khRow, k.hpp) : 0;
  var src    = man ? 'own' : (khRow ? 'kat' : 'auto');
  var eff    = man ? manEff : (khRow ? kh : auto);
  var npmEst = (k.hpp > 0 && eff > 0 && !m.mixed) ? ((eff - k.hpp) / k.hpp * 100 - m.beban) : null;
  var ok     = npmEst !== null && npmEst >= m.npm - 0.05;
  return { hpp: k.hpp, auto: auto, manual: manEff, manNi: man ? (manEff - k.hpp) : null, ni: eff > 0 || man || khRow ? (eff - k.hpp) : null, kat: kh, eff: eff, src: src, npmEst: npmEst, ok: ok, isManual: !!man, m: m };
}

// Kolom Net Income: TERKUNCI = teks biasa; mode Edit = kotak ketik
function _chpNiCell(c, i) {
  if (_chpEdit && !_chpBulk) {
    return '<input type="text" inputmode="numeric" autocomplete="off" spellcheck="false" class="chp-inp' + (c.src === 'own' ? ' manual' : (c.src === 'kat' ? ' kat' : '')) + '"' +
      ' data-idx="' + i + '" value="' + (c.isManual ? _chpFmt(c.manNi) : '') + '"' +
      ' placeholder="' + (c.ni !== null && c.eff > 0 ? _chpFmt(c.ni) : '—') + '"' +
      ' oninput="chpFmtInput(this)" onfocus="this.select()" onchange="chpSimpan(this)"' +
      ' onkeydown="if(event.key===\'Enter\')this.blur()">';
  }
  if (c.ni === null || !(c.eff > 0 || c.isManual)) return '<span style="color:var(--ink3)">—</span>';
  if (c.src === 'own')  return '<span style="font-weight:700">' + _chpFmt(c.manNi) + '</span>';
  if (c.src === 'kat')  return '<span style="font-weight:500;color:var(--ink2)" title="Ikut Net Income kategori">' + _chpFmt(c.ni) + '</span>';
  return '<span style="color:var(--ink3);font-style:italic" title="Otomatis (rumus lama)">' + _chpFmt(c.ni) + '</span>';
}

function _chpHjHtml(c) {
  if (!(c.eff > 0)) return '<span style="color:var(--ink3)">—</span>';
  if (c.src === 'auto') return '<span style="color:var(--ink3);font-style:italic">' + fmtRpFull(c.eff) + '</span>';
  return '<span style="font-weight:' + (c.src === 'own' ? '700' : '500') + '">' + fmtRpFull(c.eff) + '</span>';
}

function _chpNpmHtml(c) {
  if (c.npmEst === null) return '<span style="color:var(--ink3)">—</span>';
  var txt = c.npmEst.toFixed(1) + '%';
  if (c.src === 'auto') return '<span style="color:var(--ink3);font-style:italic">' + txt + '</span>';
  return '<span style="font-weight:' + (c.src === 'own' ? '700' : '500') + ';color:' + (c.ok ? 'var(--ok)' : 'var(--danger)') + '">' + txt + '</span>';
}

async function _chpLoadProduk() {
  try {
    _chpProduk = await dbGet('produk', '&order=katalog.asc&kategori_produk=in.(aktif,clearance)');
  } catch (e) {
    _chpProduk = await dbGet('produk', '&order=katalog.asc');
  }
}

// Buka panel untuk 1 toko (id channel) atau 1 kategori ('kat:<kategori>')
async function _chpPilihCore(key, nama, kat) {
  _chpBulkReset();
  _chpSelId   = String(key);
  _chpSelNama = nama || '';
  _chpChKat   = kat || '';
  _chpKatHarga = {};
  _chpQuery   = '';
  var search = document.getElementById('chp-search');
  if (search) search.value = '';

  document.querySelectorAll('#page-channel tr[data-action="pilih-ch"]').forEach(function(tr) {
    tr.classList.toggle('ch-row-sel', tr.dataset.id === _chpSelId);
  });
  document.getElementById('chp-hint').style.display = 'none';
  document.getElementById('chp-body').style.display = '';
  document.getElementById('chp-title').textContent  = '— ' + _chpSelNama;
  _chpSyncButtons();
  document.getElementById('chp-tbody').innerHTML = '<tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';

  // Layar sempit: panel ada di atas → geser ke sana
  if (window.matchMedia && window.matchMedia('(max-width:900px)').matches) {
    var card = document.getElementById('chp-card');
    if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var seq = ++_chpSeq;
  var thisKey = _chpSelId;
  try {
    var res = await Promise.all([
      _chpLoadProduk(),
      dbGet(_chpTblOf(thisKey), _chpQ(thisKey)),
      // harga kategori sebagai fallback (mode toko). Tabel belum ada → dianggap kosong, panel toko tetap jalan.
      (!_chpIsKat() && _chpChKat)
        ? dbGet('channel_kategori_harga', _chpQ('kat:' + _chpChKat)).catch(function() { return []; })
        : Promise.resolve([])
    ]);
    if (seq !== _chpSeq) return;
    _chpHarga = {};
    (res[1] || []).forEach(function(r) { _chpHarga[r.katalog] = r; });
    _chpKatHarga = {};
    (res[2] || []).forEach(function(r) { _chpKatHarga[r.katalog] = r; });
    chpRender();
  } catch (err) {
    if (seq !== _chpSeq) return;
    var msg = String(err && err.message || err);
    var hint = /channel_kategori_harga/i.test(msg) ? ' — tabel channel_kategori_harga belum dibuat, jalankan SQL-nya dulu.'
             : (/channel_harga/i.test(msg) ? ' — tabel channel_harga belum dibuat, jalankan SQL-nya dulu.' : '');
    document.getElementById('chp-tbody').innerHTML =
      '<tr><td colspan="' + _chpCols() + '" style="color:var(--danger)">Error: ' + _chpEsc(msg) + hint + '</td></tr>';
  }
}

function chpPilih(id, nama, kat) { if (_CHP_KATS.indexOf(kat) === -1) return; return _chpPilihCore(String(id), nama, kat); }

function chpPilihKategori(kat, label) { if (_CHP_KATS.indexOf(kat) === -1) return; return _chpPilihCore('kat:' + kat, 'Semua ' + label, ''); }

function chpFilter(q) {
  _chpQuery = String(q || '').trim().toLowerCase();
  chpRender();
}

function _chpCols() { return 7; }

// Tombol header: Edit Massal (toko & kategori) + Isi dari rumus lama (hanya toko), tersembunyi saat mode massal
function _chpSyncButtons() {
  var show = !!_chpSelId && !_chpBulk;
  document.getElementById('chp-btn-pick').style.display = (show && !_chpEdit) ? '' : 'none';
  document.getElementById('chp-btn-edit').style.display = show ? '' : 'none';
  document.getElementById('chp-btn-edit').innerHTML = _chpEdit ? '<i class="ti ti-check"></i> Selesai' : '<i class="ti ti-edit"></i> Edit';
  document.getElementById('chp-btn-bulk').style.display = (show && !_chpEdit) ? '' : 'none';
}

// Tombol "Pilih Produk" di header Price List: toko aktif atau kategori aktif
function chpPilihProdukPanel() {
  if (!_chpSelId) return;
  showPilihProduk(_chpSelId, _chpSelNama, _chpIsKat() ? _chpKatKey() : _chpChKat);
}

// Lepas 1 katalog dari daftar (ikon sampah, hanya di mode Edit): hapus pilihan + Net Income miliknya di tingkat ini
async function chpLepas(i) {
  var k = _chpRows[i];
  var key = _chpSelId;
  if (!k || !key) return;
  var tbl = _chpTblOf(key);
  var priced = _chpHarga[k.katalog];
  var selId = (_chProdukMap[key] || {})[k.katalog];
  if (!priced && !selId) return;
  var ok = await zConfirm(
    'Lepas "' + k.katalog + '" dari daftar ini?' + (priced ? ' Net Income yang tersimpan ikut dihapus.' : ''),
    { title: 'Lepas produk?', ok: 'Ya, lepas', type: 'danger' }
  );
  if (!ok) return;
  try {
    if (priced) await dbDelete(tbl, priced.id);
    if (selId)  await dbDelete('channel_produk', selId);
  } catch (err) {
    alert('Gagal melepas produk: ' + err.message);
    await _chProdukLoad();
    await _chpReloadHarga(key);
    if (key === _chpSelId) chpRender();
    return;
  }
  if (priced) delete _chpHarga[k.katalog];
  if (selId && _chProdukMap[key]) delete _chProdukMap[key][k.katalog];
  if (!_chpIsKat() && key === _chpSelId && _chpChKat) loadChannelByKategori(_chpChKat);   // angka di tombol Produk
  if (key === _chpSelId) chpRender();
}

// Tombol Edit / Selesai: buka-tutup kunci kolom Net Income
function chpEditToggle() {
  if (!_chpSelId) return;
  _chpEdit = !_chpEdit;
  _chpSyncButtons();
  chpRender();
}

function chpRender() {
  if (!_chpSelId) return;
  var tbody = document.getElementById('chp-tbody');
  if (!tbody) return;
  document.getElementById('chp-table').classList.toggle('chp-bulk', _chpBulk);
  document.getElementById('chp-table').classList.toggle('chp-edit', _chpEdit && !_chpBulk);

  var m = _chpBeban();
  var infoEl = document.getElementById('chp-info');
  var bebanHtml = 'Beban: <b style="color:var(--danger)">' + m.beban.toFixed(1) + '%</b> &nbsp;|&nbsp; NPM target: <b style="color:var(--ok)">' + m.npm.toFixed(1) + '%</b>';
  if (_chpIsKat()) {
    var chs = _chCatChannels[_chpKatKey()] || [];
    var head = '<div style="margin-bottom:4px">Harga kategori — berlaku ke <b>' + chs.length + ' toko</b> (' +
      _chpEsc(chs.map(function(c) { return c.nama; }).join(', ')) + ') yang belum punya harga sendiri.</div>';
    infoEl.innerHTML = head + (m.mixed
      ? '<span style="color:var(--danger)">⚠️ Beban/NPM tiap toko di kategori ini berbeda — harga otomatis &amp; NPM tidak ditampilkan.</span>'
      : (m.ada ? bebanHtml : '<span style="color:var(--danger)">⚠️ Toko di kategori ini belum punya setting Beban &amp; NPM (ikon ⚙).</span>'));
  } else {
    infoEl.innerHTML = m.ada
      ? bebanHtml
      : '<span style="color:var(--danger)">⚠️ Channel ini belum punya setting Beban &amp; NPM (ikon ⚙) — harga otomatis = HPP.</span>';
  }

  var list = _chpKatalogList();
  if (_chpQuery) list = list.filter(function(k) { return k.katalog.toLowerCase().indexOf(_chpQuery) !== -1; });

  if (!list.length) {
    _chpRows = [];
    tbody.innerHTML = '<tr><td colspan="' + _chpCols() + '" style="color:var(--ink3);font-style:italic">' +
      (_chpQuery ? 'Katalog tidak ditemukan'
        : (!_chpKatalogAll().length ? 'Belum ada produk di Kelola Produk'
        : (_chpIsKat() ? 'Belum ada produk dipilih untuk kategori ini — klik tombol Pilih Produk di atas.'
                       : 'Belum ada produk dipilih untuk toko ini — klik tombol Pilih Produk di atas.'))) + '</td></tr>';
    document.getElementById('chp-footer').textContent = '';
    _chpBulkUI();
    return;
  }

  _chpRows = list;
  tbody.innerHTML = list.map(function(k, i) {
    var c   = _chpCalc(k);
    var chk = !!_chpSel[k.katalog];
    return '<tr class="' + (chk ? 'chp-sel' : '') + '"' + (_chpBulk ? ' style="cursor:pointer" onclick="chpRowClick(' + i + ',event)"' : '') + '>' +
      '<td class="chp-c-chk"><input type="checkbox" class="chp-chk" data-idx="' + i + '"' + (chk ? ' checked' : '') + ' onchange="chpToggleRow(' + i + ',this.checked)"></td>' +
      '<td style="font-weight:600" title="' + _chpEsc(k.katalog) + '">' + _chpEsc(k.katalog) + (k.orphan ? ' <span style="color:var(--danger);font-weight:500;font-size:11px">· tidak ada di Kelola Produk</span>' : '') + '</td>' +
      '<td class="chp-c-hpp" style="text-align:right;color:var(--ink2)">' + fmtRpFull(k.hpp) + '</td>' +
      '<td class="chp-c-ni" style="text-align:right">' + _chpNiCell(c, i) + '</td>' +
      '<td class="chp-c-harga chp-hj" style="text-align:right">' + _chpHjHtml(c) + '</td>' +
      '<td class="chp-c-npm chp-npm" style="text-align:center">' + _chpNpmHtml(c) + '</td>' +
      '<td class="chp-c-del">' + (((_chProdukMap[_chpSelId] || {})[k.katalog] || _chpHarga[k.katalog])
        ? '<button class="btn btn-sm btn-danger" onclick="chpLepas(' + i + ')" title="Lepas dari daftar"><i class="ti ti-trash"></i></button>' : '') + '</td>' +
    '</tr>';
  }).join('');
  _chpUpdateFooter();
  _chpBulkUI();
}

function _chpUpdateFooter() {
  var all = _chpKatalogList();
  var manual = all.filter(function(k) { return !!_chpHarga[k.katalog]; }).length;
  var dariKat = _chpIsKat() ? 0 : all.filter(function(k) { return !_chpHarga[k.katalog] && !!_chpKatHarga[k.katalog]; }).length;
  document.getElementById('chp-footer').textContent =
    all.length + ' katalog · ' + manual + ' manual' + (_chpIsKat() ? '' : ' · ' + dariKat + ' dari kategori') + ' · ' + (all.length - manual - dariKat) + ' otomatis';
}

function chpFmtInput(inp) {
  var raw = String(inp.value || '').replace(/\D/g, '');
  inp.value = raw ? parseInt(raw, 10).toLocaleString('id-ID') : '';
}

async function chpSimpan(inp) {
  var row = _chpRows[parseInt(inp.dataset.idx, 10)];
  var chId = _chpSelId;
  if (!row || !chId) return;
  var tbl = _chpTblOf(chId);
  var raw = String(inp.value || '').replace(/\D/g, '');
  var val = raw === '' ? null : parseInt(raw, 10);   // Net Income (Rp); kosong = hapus, 0 = valid
  var cur = _chpHarga[row.katalog];
  try {
    if (val === null) {
      if (cur) { await dbDelete(tbl, cur.id); delete _chpHarga[row.katalog]; }
    } else if (cur) {
      var curNi = (cur.net_income !== null && cur.net_income !== undefined) ? Number(cur.net_income) : (Number(cur.harga_jual) || 0) - row.hpp;
      if (cur.net_income === null || cur.net_income === undefined || curNi !== val) {
        await dbUpdate(tbl, cur.id, { net_income: val, harga_jual: row.hpp + val });
        cur.net_income = val; cur.harga_jual = row.hpp + val;
      }
    } else {
      var ins = await dbInsert(tbl, _chpMkRow(chId, row.katalog, val, row.hpp));
      if (ins && ins[0]) _chpHarga[row.katalog] = ins[0];
    }
  } catch (err) {
    var em = String(err && err.message || err);
    alert('Gagal simpan Net Income: ' + em + (/net_income/i.test(em) ? '\n\nKolom net_income belum ada — jalankan channel_net_income.sql di Supabase dulu.' : ''));
  }
  if (chId !== _chpSelId) return;
  // update baris ini saja (bukan render ulang) supaya Tab ke baris berikutnya tidak putus
  var c = _chpCalc(row);
  inp.classList.toggle('manual', c.src === 'own');
  inp.classList.toggle('kat', c.src === 'kat');
  inp.value = c.isManual ? _chpFmt(c.manNi) : '';
  inp.placeholder = (c.ni !== null && c.eff > 0) ? _chpFmt(c.ni) : '—';
  var tr = inp.closest('tr');
  var npmTd = tr ? tr.querySelector('.chp-npm') : null;
  if (npmTd) npmTd.innerHTML = _chpNpmHtml(c);
  var hjTd = tr ? tr.querySelector('.chp-hj') : null;
  if (hjTd) hjTd.innerHTML = _chpHjHtml(c);
  _chpUpdateFooter();
}

// ─── EDIT MASSAL ─────────────────────────────────────────────
// Flow: Edit Massal → centang katalog → isi 1 harga → Terapkan → otomatis selesai
// (kotak centang hilang). Batal = keluar tanpa mengubah apa pun.
function _chpBulkReset() {
  _chpBulk = false; _chpEdit = false; _chpSel = {};
  var bar = document.getElementById('chp-bulkbar'); if (bar) bar.style.display = 'none';
  var inp = document.getElementById('chp-bulk-harga'); if (inp) inp.value = '';
  var tbl = document.getElementById('chp-table'); if (tbl) tbl.classList.remove('chp-bulk');
}

function chpBulkMulai() {
  if (!_chpSelId) return;
  _chpBulk = true; _chpEdit = false; _chpSel = {};
  document.getElementById('chp-bulkbar').style.display = '';
  document.getElementById('chp-bulk-harga').value = '';
  _chpSyncButtons();
  chpRender();
}

function chpBulkBatal() {
  _chpBulkReset();
  _chpSyncButtons();
  chpRender();
}

function _chpBulkUI() {
  var n = Object.keys(_chpSel).length;
  var btn = document.getElementById('chp-bulk-btn');
  if (btn) btn.innerHTML = '<i class="ti ti-check"></i> Terapkan (' + n + ')';
  var all = document.getElementById('chp-chk-all');
  if (all) {
    var vis = _chpRows.filter(function(k) { return !!_chpSel[k.katalog]; }).length;
    all.checked = _chpRows.length > 0 && vis === _chpRows.length;
    all.indeterminate = vis > 0 && vis < _chpRows.length;
  }
}

function chpToggleRow(i, checked) {
  var k = _chpRows[i]; if (!k) return;
  if (checked) _chpSel[k.katalog] = true; else delete _chpSel[k.katalog];
  var tr = document.querySelectorAll('#chp-tbody tr')[i];
  if (tr) tr.classList.toggle('chp-sel', !!checked);
  _chpBulkUI();
}

function chpToggleAll(checked) {
  _chpRows.forEach(function(k) { if (checked) _chpSel[k.katalog] = true; else delete _chpSel[k.katalog]; });
  document.querySelectorAll('#chp-tbody tr').forEach(function(tr) {
    tr.classList.toggle('chp-sel', !!checked);
    var cb = tr.querySelector('.chp-chk'); if (cb) cb.checked = !!checked;
  });
  _chpBulkUI();
}

// klik di mana saja pada baris = centang/uncentang (kecuali klik langsung di input)
function chpRowClick(i, e) {
  if (!_chpBulk) return;
  if (e && e.target && e.target.closest && e.target.closest('input')) return;
  var tr = document.querySelectorAll('#chp-tbody tr')[i];
  var cb = tr ? tr.querySelector('.chp-chk') : null;
  if (!cb) return;
  cb.checked = !cb.checked;
  chpToggleRow(i, cb.checked);
}

async function _chpReloadHarga(chId) {
  try {
    var rows = await dbGet(_chpTblOf(chId), _chpQ(chId));
    if (chId !== _chpSelId) return;
    _chpHarga = {};
    (rows || []).forEach(function(r) { _chpHarga[r.katalog] = r; });
  } catch (e) { console.warn('Reload harga gagal:', e); }
}

async function chpBulkTerapkan() {
  if (!_chpBulk || !_chpSelId) return;
  var chId  = _chpSelId;
  var tbl   = _chpTblOf(chId);
  var pilih = Object.keys(_chpSel);
  if (!pilih.length) { alert('Pilih katalog dulu — centang di kolom paling kiri.'); return; }

  var raw = String(document.getElementById('chp-bulk-harga').value || '').replace(/\D/g, '');
  var val = raw === '' ? null : parseInt(raw, 10);   // Net Income (Rp); kosong = hapus, 0 = valid
  var adaManual = pilih.filter(function(k) { return !!_chpHarga[k]; });
  var hppMap = {};
  _chpKatalogList().forEach(function(k) { hppMap[k.katalog] = k.hpp; });

  if (val === null) {
    // Net Income kosong = kembalikan ke otomatis (hapus baris manual)
    if (!adaManual.length) { alert('Isi Net Income dulu.'); return; }
    var okKosong = await zConfirm(
      'Net Income kosong. Hapus pengaturan manual ' + adaManual.length + ' katalog terpilih (' + (_chpIsKat() ? 'kembali ke otomatis' : 'ikut kategori / otomatis') + ')?',
      { title: 'Kembalikan ke otomatis?', ok: 'Ya, hapus', type: 'danger' }
    );
    if (!okKosong) return;
  }

  var btn = document.getElementById('chp-bulk-btn');
  if (btn) btn.disabled = true;
  var msg = '';
  try {
    if (val === null) {
      await Promise.all(adaManual.map(function(k) { return dbDelete(tbl, _chpHarga[k].id); }));
      adaManual.forEach(function(k) { delete _chpHarga[k]; });
      msg = adaManual.length + (_chpIsKat() ? ' katalog dikembalikan ke otomatis' : ' katalog toko dihapus (ikut kategori / otomatis)');
    } else {
      var upd = [], ins = [];
      pilih.forEach(function(k) {
        var cur = _chpHarga[k];
        var hp  = hppMap[k] || 0;
        if (cur) { if (cur.net_income === null || cur.net_income === undefined || Number(cur.net_income) !== val) upd.push({ cur: cur, hp: hp }); }
        else ins.push(_chpMkRow(chId, k, val, hp));
      });
      await Promise.all(upd.map(function(u) {
        return dbUpdate(tbl, u.cur.id, { net_income: val, harga_jual: u.hp + val }).then(function() { u.cur.net_income = val; u.cur.harga_jual = u.hp + val; });
      }));
      if (ins.length) {
        var res = await dbInsert(tbl, ins);
        (res || []).forEach(function(r) { _chpHarga[r.katalog] = r; });
      }
      msg = pilih.length + ' katalog diset Net Income ' + fmtRpFull(val);
    }
  } catch (err) {
    alert('Gagal menerapkan: ' + err.message + (/net_income/i.test(String(err.message)) ? '\n\nKolom net_income belum ada — jalankan channel_net_income.sql di Supabase dulu.' : ''));
    await _chpReloadHarga(chId);   // sinkron ulang dgn database supaya tampilan jujur
    if (btn) btn.disabled = false;
    if (chId === _chpSelId) chpRender();
    return;
  }
  if (btn) btn.disabled = false;
  if (chId !== _chpSelId) return;
  // SELESAI: kotak centang hilang, tampilan normal
  _chpBulkReset();
  _chpSyncButtons();
  chpRender();
  var ft = document.getElementById('chp-footer');
  if (ft) {
    ft.innerHTML = '<span style="color:var(--ok);font-weight:700">✓ ' + _chpEsc(msg) + '</span>';
    clearTimeout(_chpFlashT);
    _chpFlashT = setTimeout(function() { if (chId === _chpSelId && !_chpBulk) _chpUpdateFooter(); }, 4000);
  }
}

// Isi SEMUA katalog yang masih otomatis dengan harga rumus lama (sekali jalan)
// DEAD CODE (30 Sep 2026): tombol "Isi dari rumus lama" dihapus dari UI — tidak terpakai lagi. Fungsi dibiarkan (minim blast radius).
async function chpSeed() {
  if (!_chpSelId) return;
  var chId = _chpSelId;
  var m = _chpBeban();
  var mult = 1 + (m.beban + m.npm) / 100;
  var todo = _chpKatalogList().filter(function(k) { return !_chpHarga[k.katalog] && !_chpKatHarga[k.katalog] && k.hpp > 0; });
  if (!todo.length) { alert('Semua katalog sudah punya harga (toko / kategori).'); return; }
  var ok = await zConfirm(
    todo.length + ' katalog yang masih otomatis akan diisi dengan harga dari rumus lama (HPP × ' + mult.toFixed(3) + '). Harga manual yang sudah ada tidak diubah.',
    { title: 'Isi dari rumus lama?', ok: 'Isi' }
  );
  if (!ok) return;
  try {
    var payload = todo.map(function(k) {
      var h = Math.ceil(k.hpp * mult);
      return { channel_id: chId, katalog: k.katalog, harga_jual: h, net_income: h - k.hpp };
    });
    var ins = await dbInsert('channel_harga', payload);
    (ins || []).forEach(function(r) { _chpHarga[r.katalog] = r; });
    if (chId === _chpSelId) chpRender();
  } catch (err) {
    alert('Gagal mengisi harga: ' + err.message);
  }
}

// Channel dihapus → hapus juga harga manualnya (tabel channel_harga tanpa FK)
async function chpHapusHargaChannel(id) {
  try {
    var rows = await dbGet('channel_harga', '&channel_id=eq.' + encodeURIComponent(String(id)));
    for (var i = 0; i < rows.length; i++) { await dbDelete('channel_harga', rows[i].id); }
  } catch (e) { console.warn('Hapus channel_harga gagal:', e); }
  if (String(id) === _chpSelId) {
    _chpSelId = ''; _chpSelNama = ''; _chpHarga = {}; _chpKatHarga = {}; _chpChKat = ''; _chpRows = [];
    document.getElementById('chp-hint').style.display = '';
    document.getElementById('chp-body').style.display = 'none';
    document.getElementById('chp-title').textContent  = '';
    _chpBulkReset();
    _chpSyncButtons();
  }
}

// ═══════════════════════════════════════════════════════════════
// ─── PILIH PRODUK PER CHANNEL (30 Sep 2026) ────────────────────
// Tabel channel_produk (channel_id TEXT, katalog TEXT, UNIQUE(channel_id, katalog)).
// Sumber daftar = produk di Kelola Produk (aktif + clearance), dipilih per KATALOG.
// Toko yang belum pilih = kosong. Catatan: rename katalog di Kelola Produk TIDAK ikut
// mengubah pilihan (sama seperti channel_harga) — katalog lama tampil bertanda "tidak ada
// di Kelola Produk" di modal supaya bisa di-uncheck lalu pilih nama barunya.
// ═══════════════════════════════════════════════════════════════
var _chProdukMap = {};   // channel_id (string) → { katalog: id baris channel_produk }
var _chProdukOk  = true; // false = tabel channel_produk belum dibuat / gagal dibaca

async function _chProdukLoad() {
  try {
    var rows = await dbGet('channel_produk', '');
    var m = {};
    (rows || []).forEach(function(r) {
      var c = String(r.channel_id);
      if (!m[c]) m[c] = {};
      m[c][r.katalog] = r.id;
    });
    _chProdukMap = m;
    _chProdukOk  = true;
  } catch (e) {
    console.warn('Load channel_produk gagal (tabel belum dibuat?):', e);
    _chProdukMap = {};
    _chProdukOk  = false;
  }
}

function _chProdukCount(id) { return Object.keys(_chProdukMap[String(id)] || {}).length; }

var _cpId = '', _cpKat = '', _cpNama = '', _cpList = [], _cpView = [], _cpSel = {}, _cpQ = '', _cpPriced = {}, _cpTbl = '', _cpAddOnly = false;

// id = id channel ATAU 'kat:<kategori>' (pilihan tingkat kategori); kat = kategori channel / kategori itu sendiri
async function showPilihProduk(id, nama, kat) {
  _cpId = String(id); _cpKat = kat; _cpNama = nama || ''; _cpQ = ''; _cpList = []; _cpView = []; _cpSel = {}; _cpPriced = {};
  _cpTbl = _chpTblOf(_cpId);
  var catKey = _cpId.indexOf('kat:') === 0 ? _cpId.slice(4) : kat;
  // Offline/Reseller/Dropship (punya Price List) = TAMBAH-SAJA: yang sudah tampil di Price List tidak ditawarkan lagi.
  _cpAddOnly = _CHP_KATS.indexOf(catKey) !== -1;
  document.getElementById('cp-nama').textContent = _cpNama;
  document.getElementById('cp-desc').textContent = _cpAddOnly
    ? 'Hanya katalog dari Kelola Produk yang BELUM ditambahkan. Centang lalu Tambah — produk langsung masuk Price List. Untuk melepas produk, pakai Edit di tabel Price List.'
    : 'Daftar diambil dari Kelola Produk (per katalog — semua varian ikut). Centang katalog yang dijual di channel ini.';
  document.getElementById('cp-search').value = '';
  document.getElementById('cp-tbody').innerHTML = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic">Memuat produk dari Kelola Produk...</td></tr>';
  document.getElementById('cp-footer').textContent = '';
  document.getElementById('cp-warn').style.display = _chProdukOk ? 'none' : '';
  showModal('modal-channel-produk');
  var myId = _cpId;
  try {
    await _chpLoadProduk();
    if (_cpAddOnly) {
      // yang sudah punya Net Income di tingkat ini
      var pr = await dbGet(_cpTbl, _chpQ(_cpId)).catch(function() { return []; });
      (pr || []).forEach(function(r) { _cpPriced[r.katalog] = r.id; });
    }
  } catch (err) {
    document.getElementById('cp-tbody').innerHTML = '<tr><td colspan="3" style="color:var(--danger)">Error: ' + _chpEsc(err.message) + '</td></tr>';
    return;
  }
  if (_cpId !== myId) return;
  var cur  = _chProdukMap[_cpId] || {};
  var list = _chpKatalogAll();
  if (_cpAddOnly) {
    var skip = {};
    [cur, _cpPriced].forEach(function(o) { Object.keys(o).forEach(function(k) { skip[k] = true; }); });
    list = list.filter(function(k) { return !skip[k.katalog]; });
  } else {
    var ada = {};
    list.forEach(function(k) { ada[k.katalog] = true; });
    Object.keys(cur).forEach(function(k) {
      _cpSel[k] = true;
      if (!ada[k]) list.push({ katalog: k, hpp: 0, n: 0, orphan: true });
    });
  }
  _cpList = list;
  cpRender();
}

function cpFilter(q) { _cpQ = String(q || '').trim().toLowerCase(); cpRender(); }

function cpRender() {
  var tbody = document.getElementById('cp-tbody');
  if (!tbody) return;
  var view = _cpList.filter(function(k) { return !_cpQ || k.katalog.toLowerCase().indexOf(_cpQ) !== -1; });
  _cpView = view;
  if (!view.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic">' +
      (_cpQ ? 'Katalog tidak ditemukan' : (_cpAddOnly && !_cpList.length ? 'Semua katalog dari Kelola Produk sudah ditambahkan.' : 'Belum ada produk di Kelola Produk')) + '</td></tr>';
  } else {
    tbody.innerHTML = view.map(function(k, i) {
      var chk = !!_cpSel[k.katalog];
      return '<tr class="' + (chk ? 'chp-sel' : '') + '" style="cursor:pointer" onclick="cpRowClick(' + i + ',event)">' +
        '<td class="cp-c-chk"><input type="checkbox" class="chp-chk" ' + (chk ? 'checked ' : '') + 'onchange="cpToggle(' + i + ',this.checked)"></td>' +
        '<td style="font-weight:600">' + _chpEsc(k.katalog) +
          (k.orphan ? ' <span style="color:var(--danger);font-weight:500;font-size:11px">· tidak ada di Kelola Produk</span>'
                    : ' <span style="color:var(--ink3);font-weight:400;font-size:11px">· ' + k.n + ' varian</span>') + '</td>' +
        '<td style="text-align:right;color:var(--ink2)">' + (k.orphan ? '—' : fmtRpFull(k.hpp)) + '</td>' +
      '</tr>';
    }).join('');
  }
  cpUpdateFooter();
}

function cpUpdateFooter() {
  var n = Object.keys(_cpSel).length;
  document.getElementById('cp-footer').textContent = n + ' dipilih dari ' + _cpList.length + (_cpAddOnly ? ' katalog yang belum ditambahkan' : ' katalog');
  var all = document.getElementById('cp-chk-all');
  if (all) {
    var vis = _cpView.filter(function(k) { return !!_cpSel[k.katalog]; }).length;
    all.checked = _cpView.length > 0 && vis === _cpView.length;
    all.indeterminate = vis > 0 && vis < _cpView.length;
  }
  var btn = document.getElementById('cp-save-btn');
  if (btn) btn.innerHTML = _cpAddOnly ? '<i class="ti ti-plus"></i> Tambah (' + n + ')' : '<i class="ti ti-device-floppy"></i> Simpan (' + n + ')';
}

function cpToggle(i, checked) {
  var k = _cpView[i]; if (!k) return;
  if (checked) _cpSel[k.katalog] = true; else delete _cpSel[k.katalog];
  var tr = document.querySelectorAll('#cp-tbody tr')[i];
  if (tr) tr.classList.toggle('chp-sel', !!checked);
  cpUpdateFooter();
}

function cpToggleAll(checked) {
  _cpView.forEach(function(k) { if (checked) _cpSel[k.katalog] = true; else delete _cpSel[k.katalog]; });
  cpRender();
}

// klik di mana saja pada baris = centang/uncentang (kecuali klik langsung di kotak centang)
function cpRowClick(i, e) {
  if (e && e.target && e.target.closest && e.target.closest('input')) return;
  var tr = document.querySelectorAll('#cp-tbody tr')[i];
  var cb = tr ? tr.querySelector('.chp-chk') : null;
  if (!cb) return;
  cb.checked = !cb.checked;
  cpToggle(i, cb.checked);
}

async function cpSimpan() {
  var id  = _cpId;
  if (!id) return;
  var cur = _chProdukMap[id] || {};
  var add = [], delSel = [], delPrice = [], delPriceNames = [];
  Object.keys(_cpSel).forEach(function(k) { if (!cur[k]) add.push({ channel_id: id, katalog: k }); });
  if (!_cpAddOnly) {   // mode tambah-saja tidak pernah menghapus (melepas produk lewat tabel Price List)
    Object.keys(cur).forEach(function(k) { if (!_cpSel[k]) delSel.push(cur[k]); });
    Object.keys(_cpPriced).forEach(function(k) { if (!_cpSel[k]) { delPrice.push(_cpPriced[k]); delPriceNames.push(k); } });
  }
  if (_cpAddOnly && !add.length) { hideModal('modal-channel-produk'); return; }
  if (delPrice.length) {
    var ok = await zConfirm(
      delPrice.length + ' katalog yang dilepas sudah punya Net Income tersimpan (' + delPriceNames.slice(0, 4).join(', ') + (delPriceNames.length > 4 ? ', …' : '') + ') — ikut dihapus. Lanjut?',
      { title: 'Hapus Net Income juga?', ok: 'Ya, hapus', type: 'danger' }
    );
    if (!ok) return;
  }
  var btn = document.getElementById('cp-save-btn');
  if (btn) btn.disabled = true;
  try {
    if (delPrice.length) await Promise.all(delPrice.map(function(rid) { return dbDelete(_cpTbl, rid); }));
    if (delSel.length)   await Promise.all(delSel.map(function(rid) { return dbDelete('channel_produk', rid); }));
    if (add.length)      await dbInsert('channel_produk', add);
  } catch (err) {
    var msg = String(err && err.message || err);
    alert('Gagal simpan pilihan produk: ' + msg + (/channel_produk/i.test(msg) ? '\n\nTabel channel_produk belum dibuat — jalankan channel_produk.sql di Supabase dulu.' : ''));
    await _chProdukLoad();       // sinkron ulang dgn database supaya tampilan jujur
    if (btn) btn.disabled = false;
    loadChannelByKategori(_cpKat);
    return;
  }
  await _chProdukLoad();
  if (btn) btn.disabled = false;
  hideModal('modal-channel-produk');
  var catKey = id.indexOf('kat:') === 0 ? id.slice(4) : _cpKat;
  if (id.indexOf('kat:') !== 0) loadChannelByKategori(_cpKat);   // angka di tombol Produk ikut ter-update
  // Kategori bertabel Price List (Offline/Reseller/Dropship): langsung tampilkan produk terpilih + buka mode Edit
  // supaya Net Income bisa langsung diisi. (Shopee/Lazada/TikTok tidak punya Price List.)
  if (_CHP_KATS.indexOf(catKey) !== -1) {
    if (_chpSelId === id) {
      await _chpReloadHarga(id);
      if (_chpSelId !== id) return;
    } else {
      await _chpPilihCore(id, _cpNama, id.indexOf('kat:') === 0 ? '' : _cpKat);
      if (_chpSelId !== id) return;
    }
    _chpEdit = _chpKatalogList().length > 0;
    _chpSyncButtons();
    chpRender();
  } else if (_chpSelId) {
    chpRender();
  }
}

// Channel dihapus → hapus juga pilihan produknya (channel_produk tanpa FK)
async function chpHapusProdukChannel(id) {
  try {
    var m = _chProdukMap[String(id)] || {};
    var ids = Object.keys(m).map(function(k) { return m[k]; });
    await Promise.all(ids.map(function(rid) { return dbDelete('channel_produk', rid); }));
  } catch (e) { console.warn('Hapus channel_produk gagal:', e); }
  delete _chProdukMap[String(id)];
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
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-settings"></i> Setting Beban &amp; NPM — <span id="cb-channel-nama" style="color:var(--accent)"></span></div>
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

// ─── MODAL PILIH PRODUK PER CHANNEL ──────────────────────────
document.body.insertAdjacentHTML('beforeend', `
<style>
  #cp-scroll { max-height:52vh; overflow-y:auto; overflow-x:hidden; overscroll-behavior:none; border:1px solid var(--ink4); }
  #cp-table { width:100%; }
  #cp-table thead th { position:sticky; top:0; z-index:3; }
  #cp-table .cp-c-chk { width:44px; text-align:center; }
  #cp-table .chp-chk { width:17px; height:17px; cursor:pointer; accent-color:var(--ink); }
  #cp-table tr.chp-sel td { background:var(--cream3); }
</style>
<div class="modal-overlay" id="modal-channel-produk" onclick="if(event.target===this)hideModal('modal-channel-produk')">
  <div class="modal" style="max-width:560px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-package"></i> Pilih Produk — <span id="cp-nama" style="color:var(--accent)"></span></div>
      <button onclick="hideModal('modal-channel-produk')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <div id="cp-desc" style="font-size:12px;color:var(--ink2);margin-bottom:8px">Daftar diambil dari Kelola Produk (per katalog — semua varian ikut). Centang katalog yang dijual di channel ini.</div>
    <div id="cp-warn" style="display:none;padding:8px 12px;margin-bottom:8px;background:var(--cream2);border:1px dashed var(--danger);font-size:12px;color:var(--danger)">⚠️ Tabel channel_produk belum bisa dibaca — jalankan channel_produk.sql di Supabase dulu, kalau tidak pilihan tidak akan tersimpan.</div>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <input type="text" id="cp-search" placeholder="🔍 Cari katalog..." autocomplete="off" oninput="cpFilter(this.value)"
        style="flex:1;font-family:var(--f);font-size:13px;padding:5px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
    </div>
    <div id="cp-scroll"><table class="tbl" id="cp-table">
      <thead><tr>
        <th class="cp-c-chk"><input type="checkbox" class="chp-chk" id="cp-chk-all" onchange="cpToggleAll(this.checked)" title="Pilih semua yang tampil"></th>
        <th>Katalog</th>
        <th style="text-align:right;width:120px">HPP</th>
      </tr></thead>
      <tbody id="cp-tbody"></tbody>
    </table></div>
    <div id="cp-footer" style="font-size:12px;color:var(--ink3);margin:8px 0 12px;text-align:right"></div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" id="cp-save-btn" onclick="cpSimpan()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-channel-produk')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>`);

// ═══════════════════════════════════════════════════════════════
// ─── SUPPLIER & ROP ────────────────────────────────────────────
// 15 Sep 2026: SATU-SATUNYA tempat kelola data supplier di seluruh app.
// Tabel Supabase: hutang_supplier (BUKAN restock_supplier lagi — tabel itu
// udah di-retire, cuma numpang lewat doang buat migrasi data awal).
// hutang_supplier.id dipakai sebagai FK oleh hutang_barang.supplier_id &
// hutang_bon.supplier_id (riwayat Bon/PO/pembayaran) — makanya hapusSupplier
// di bawah WAJIB dicek dulu sebelum betulan delete, biar histori gak putus.
// ═══════════════════════════════════════════════════════════════

var _supplierData = [];

async function loadSupplierROP() {
  const wrap = document.getElementById('supplier-rop-list');
  if (!wrap) return;
  wrap.innerHTML = '<div style="color:var(--ink3);font-style:italic;padding:12px 0"><i class="ti ti-loader"></i> Memuat...</div>';
  try {
    const data = await dbGet('hutang_supplier', '&order=nama.asc');
    _supplierData = data || [];
    renderSupplierROP();
  } catch(e) {
    wrap.innerHTML = `
      <div style="color:var(--danger);padding:12px 0">
        ⚠️ Gagal memuat tabel <b>hutang_supplier</b>: ${e.message}
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
          <th>Sistem</th>
          <th style="text-align:center">Lead Time</th>
          <th style="text-align:center">Min Order</th>
          <th style="text-align:center">Kelipatan</th>
          <th style="text-align:right">Budget</th>
          <th>Catatan</th>
          <th style="text-align:center">Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${_supplierData.map(s => { 
          let badges = '';
          if (s.is_produksi_sendiri) badges += '<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;background:rgba(91,163,224,0.12);color:#5ba3e0;border:1px solid #5ba3e0;white-space:nowrap"><i class="ti ti-hammer"></i> Produksi Sendiri</span>';
          if (s.is_dropship) badges += ' <span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;background:rgba(120,120,120,0.1);color:var(--ink2);border:1px solid var(--ink3);white-space:nowrap"><i class="ti ti-truck-delivery"></i> Dropship</span>';
          if (s.is_reseller) badges += ' <span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;background:rgba(200,90,60,0.1);color:#c85a3c;border:1px solid #c85a3c;white-space:nowrap"><i class="ti ti-file-invoice"></i> Reseller</span>';
          return `
          <tr>
            <td><b style="color:var(--ink)">${s.nama || '—'}</b></td>
            <td>${badges || '—'}</td>
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
              <button class="btn btn-sm btn-danger" onclick="hapusSupplier(${s.id},'${(s.nama||'').replace(/'/g,"\\'")}')">
                <i class="ti ti-trash"></i>
              </button>
            </td>
          </tr>
        `; }).join('')}
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

// "Nama Boss / Supplier" di-attach ke autocomplete sumber `produk.boss` —
// biar nama yang diketik di sini konsisten sama nama boss yang beneran
// dipakai di Kelola Produk. Root cause yang diperbaiki: field ini teks bebas,
// jadi kalau ketik "H. SOLAH" padahal di produk "H SOLAH", restock.js gagal
// match (fallback ke DEFAULT_SUPPLIER, lead time/kelipatan salah tanpa
// ketahuan). Autocomplete gak ngunci ke pilihan doang (masih bisa ketik
// bebas kalau boss-nya belum ada produk aktif), tapi nyaranin nilai yang
// udah pasti valid duluan.
function _chAttachBossAutocomplete() {
  var input = document.getElementById('supplier-nama');
  if (input && typeof acAttach === 'function') acAttach(input, 'boss_produk');
}

// Produksi Sendiri gak bisa digabung sama Dropship/Reseller (bukan supplier
// luar) — saling eksklusif, sama kayak pola di hutang-supplier.js.
function chSupplierJenisToggle(which) {
  var elDropship = document.getElementById('supplier-dropship');
  var elReseller = document.getElementById('supplier-reseller');
  var elProduksi = document.getElementById('supplier-produksi');
  if (which === 'produksi' && elProduksi.checked) {
    elDropship.checked = false;
    elReseller.checked = false;
  } else if ((which === 'dropship' || which === 'reseller') &&
             (elDropship.checked || elReseller.checked)) {
    elProduksi.checked = false;
  }
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
  document.getElementById('supplier-dropship').checked = true;
  document.getElementById('supplier-reseller').checked = false;
  document.getElementById('supplier-produksi').checked = false;
  showModal('modal-supplier-rop');
  _chAttachBossAutocomplete();
}

function editSupplier(id) {
  const s = _supplierData.find(x => x.id === id);
  if (!s) return;
  document.getElementById('supplier-modal-title').textContent = 'Edit Supplier';
  document.getElementById('supplier-id').value        = s.id;
  document.getElementById('supplier-nama').value      = s.nama || '';
  document.getElementById('supplier-leadtime').value  = s.lead_time || 7;
  document.getElementById('supplier-minorder').value  = s.min_order || '';
  document.getElementById('supplier-kelipatan').value = s.kelipatan || s.min_order || '';
  idrSet('supplier-budget', s.budget || 0);
  document.getElementById('supplier-catatan').value   = s.catatan || '';
  document.getElementById('supplier-dropship').checked = !!s.is_dropship;
  document.getElementById('supplier-reseller').checked = !!s.is_reseller;
  document.getElementById('supplier-produksi').checked = !!s.is_produksi_sendiri;
  showModal('modal-supplier-rop');
  _chAttachBossAutocomplete();
}

async function simpanSupplier() {
  const id        = document.getElementById('supplier-id').value;
  const nama      = (document.getElementById('supplier-nama').value || '').trim().toUpperCase();
  const lead_time = parseInt(document.getElementById('supplier-leadtime').value) || 7;
  const min_order = parseInt(document.getElementById('supplier-minorder').value) || 6;
  const kelipatan = parseInt(document.getElementById('supplier-kelipatan').value) || min_order;
  const budget    = idrVal('supplier-budget');
  const catatan   = (document.getElementById('supplier-catatan').value || '').trim();
  const isDropship = document.getElementById('supplier-dropship').checked;
  const isReseller = document.getElementById('supplier-reseller').checked;
  const isProduksi = document.getElementById('supplier-produksi').checked;

  if (!nama) { alert('Nama boss/supplier wajib diisi!'); return; }
  if (!isDropship && !isReseller && !isProduksi) { alert('Pilih minimal 1 sistem: Dropship, Reseller, atau Produksi Sendiri!'); return; }
  if (isProduksi && (isDropship || isReseller)) { alert('Produksi Sendiri gak bisa digabung Dropship/Reseller!'); return; }

  const payload = {
    nama, lead_time, min_order, kelipatan, budget, catatan,
    is_dropship: isDropship, is_reseller: isReseller, is_produksi_sendiri: isProduksi
  };

  try {
    if (id) {
      await dbUpdate('hutang_supplier', id, payload);
    } else {
      await dbInsert('hutang_supplier', payload);
    }
    hideModal('modal-supplier-rop');
    loadSupplierROP();
  } catch(e) {
    alert('Error: ' + e.message);
  }
}

// Sebelum betulan hapus, cek dulu apa supplier ini udah pernah kepake di Bon
// (hutang_bon) atau Master Barang (hutang_barang) — kalau iya, hapus tetap
// diizinin (data lama gak ikut kehapus, cuma nampilin "—" di kolom Supplier
// di tempat-tempat itu) tapi user dikasih tau dulu biar gak kaget.
async function hapusSupplier(id, nama) {
  let sudahDipakai = false;
  try {
    const [bonPakai, barangPakai] = await Promise.all([
      dbGet('hutang_bon', '&select=id&supplier_id=eq.' + id + '&limit=1'),
      dbGet('hutang_barang', '&select=id&supplier_id=eq.' + id + '&limit=1'),
    ]);
    sudahDipakai = (bonPakai && bonPakai.length > 0) || (barangPakai && barangPakai.length > 0);
  } catch(e) { /* kalau gagal cek, lanjut ke konfirmasi biasa aja */ }

  const pesan = sudahDipakai
    ? 'Supplier "' + nama + '" udah pernah dipakai di Bon/Master Barang. Riwayatnya TIDAK ikut kehapus, tapi bakal nampilin "—" di kolom Supplier. Tetap hapus?'
    : 'Hapus supplier "' + nama + '"?';
  if (!(await zConfirm(pesan, {title: sudahDipakai ? 'Supplier masih dipakai' : 'Hapus supplier?', ok: 'Hapus', type: 'danger'}))) return;

  try {
    await dbDelete('hutang_supplier', id);
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
