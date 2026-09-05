

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

// ─── LOGO ZENOOT (bulat) buat header PDF — di-preload sekali jadi dataURL
// pas modul ke-load, biar pas tombol "Export PDF" dipencet gak nunggu
// fetch dulu (biasanya udah keburu selesai). File sama persis kayak yang
// dipakai di sidebar (logo.png, transparan, bentuk bulat).
var _hsLogoDataUrl = null;
var _hsLogoReady = fetch('logo.png').then(function(r){ return r.blob(); }).then(function(blob){
  return new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function(){ _hsLogoDataUrl = reader.result; resolve(_hsLogoDataUrl); };
    reader.onerror = function(){ resolve(null); };
    reader.readAsDataURL(blob);
  });
}).catch(function(){ return null; });

document.getElementById('page-hutang-supplier').innerHTML = `
  <style>
    /* Modul ini dulu punya tema "notebook" sendiri (cream/Comic Neue, samain
       kayak Gadag) — udah dicabut 3 Sep 2026, sekarang murni ikut variabel
       GLOBAL (--ink/--cream/--f dkk dari style.css / tema default app),
       gak di-override lagi di scope ini. */
    #page-hutang-supplier {
      background: var(--cream); color: var(--ink);
    }

    /* Full-height chain, pola sama persis kayak #page-gadag — biar panel
       (Bon/Master Barang) scroll internal sendiri2, bukan ngedorong tinggi
       seluruh layar. 'hutang-supplier' udah terdaftar di fullHeightPages
       (app.js) jadi .content udah flex-column duluan; tinggal sambungin. */
    #page-hutang-supplier.active { display:flex !important; flex-direction:column !important; }
    #page-hutang-supplier { flex:1 1 0; min-height:0; height:100%; padding:10px; box-sizing:border-box; overflow:hidden; }
    #hs-hdr-row, #hs-supplier-row, .hs-toolbar { flex-shrink:0; }
    #hs-panels-wrap { flex:1 1 0; min-height:0; display:flex; flex-direction:column; }
    .hs-panel { display:none; min-height:0; }
    /* overflow-x:hidden WAJIB eksplisit di sini — kalau cuma overflow-y:auto
       yang di-set, browser otomatis ngitung overflow-x jadi 'auto' juga
       (CSS spec), jadi begitu ada child (tabel) sedikit aja lebih lebar dari
       panel, SELURUH panel (termasuk switcher supplier di atas tabel) ikut
       jadi scrollable ke samping — itu penyebab "geser-geser" yang dikeluhin
       di Master Barang HP, 25 Agu 2026. */
    .hs-panel.active { display:flex; flex-direction:column; flex:1 1 0; min-height:0; overflow-y:auto; overflow-x:hidden; }

    /* ── Header: judul panel + dropdown menu (desktop) / dot notch (mobile) ── */
    #hs-hdr-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; flex-wrap:nowrap; gap:8px; }
    #hs-hdr-left { display:flex; align-items:center; gap:6px; min-width:0; flex:1 1 auto; overflow:hidden; }
    #hs-hdr-refresh { flex:none; background:none; border:none; padding:2px; cursor:pointer; font-size:20px; line-height:1; color:var(--ink); }
    #hs-hdr-icon { font-size:20px; flex:none; }
    #hs-hdr-heading { font-size:20px; font-weight:800; letter-spacing:.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
    /* ── Menu navigasi desktop: tab bar mendatar (ganti dropdown lama, pola
       sama persis kayak Gadag Overview) — cuma dipake di layar lebar; mobile
       tetep pake hs-page-dots (lihat media query max-width:900px di bawah,
       .hs-menu-wrap di-hide di sana). ── */
    .hs-menu-wrap { display:flex; align-items:center; gap:18px; flex:none; }
    .hs-tab-btn {
      background:none; border:none; border-bottom:2px solid transparent;
      padding:4px 1px 8px; font-family:var(--f); font-size:13px; font-weight:800;
      color:var(--ink2); opacity:.65; cursor:pointer; white-space:nowrap;
      transition:opacity .15s ease, border-color .15s ease, color .15s ease;
    }
    .hs-tab-btn:hover { opacity:.9; }
    .hs-tab-btn.active { opacity:1; color:var(--ink); border-bottom-color:var(--ink); }

    /* ── Re Stock (PO) ── */
    .hs-restock-cash-bar { display:flex; gap:10px; flex-wrap:wrap; padding:12px 2px; position:sticky; top:0; background:var(--cream); z-index:5; }
    .hs-restock-cash-item { flex:1 1 140px; background:var(--cream3); border:1px solid var(--ink4); border-radius:12px; padding:10px 14px; }
    .hs-restock-cash-lbl { font-size:10.5px; font-weight:800; text-transform:uppercase; letter-spacing:.03em; color:var(--ink3); margin-bottom:4px; }
    .hs-restock-cash-val { font-size:16px; font-weight:800; color:var(--ink); }
    .hs-restock-table tbody tr.hs-restock-checked-row td { background:rgba(62,207,106,.08); }
    .hs-restock-table td.hs-restock-chk { padding:9px 6px; cursor:default; }
    .hs-restock-table input[type="checkbox"] { width:18px; height:18px; cursor:pointer; }
    .hs-page-dots { display:none; }
    @media (max-width:900px) {
      .hs-page-dots { display:flex; align-items:center; gap:6px; flex:none; }
      .hs-page-dot { width:6px; height:6px; border-radius:50%; background:var(--ink); opacity:.35; transition:all .18s ease; cursor:pointer; }
      .hs-page-dot.active { width:16px; border-radius:3px; opacity:1; }
      .hs-menu-wrap { display:none; }
      /* Paste Massal cuma proper dikerjain di laptop (paste dari Excel) —
         di HP disembunyikan aja, versi desktop TETAP full (di atas 900px). */
      #hs-paste-massal-btn { display:none !important; }
      /* Master Barang di HP: cuma buat LIAT, semua CRUD (tambah/hapus/edit)
         dihandle di versi laptop. Toolbar disembunyikan, tabel dipotong jadi
         4 kolom — No, SKU Induk, Variant, HPP/Lusin (SKU Supplier & Supplier
         disembunyikan) biar gak perlu geser kanan-kiri, dan interaksi
         tap/long-press-edit dimatiin di JS (lihat hsRenderMasterList). */
      .hs-master-toolbar-desktop { display:none !important; }
      /* table-layout:fixed WAJIB di sini (bukan cuma width:100%) — auto-layout
         bisa tetep bikin tabel lebih lebar dari container kalau ada kata yang
         susah dipenggal (mis. "TURTLENECK"), meskipun white-space:normal.
         Fixed layout maksa kolom nurut lebar % yg didefinisiin, sisanya
         kata yang wrap ke bawah — tabel dijamin gak pernah lebih lebar dari
         layar, "flat" beneran, bukan cuma keliatan flat. 25 Agu 2026. */
      /* overflow-x TETEP auto (bukan hidden) di sini — swipe-handoff antar-tab
         (lihat _hsInitSwitcherSwipe / listener di bawah dekat hsSwitchView)
         ngukur t.scrollLeft buat tau tabel udah "mentok" apa belum sebelum
         estafet ke pindah-tab. Kalau overflow-x:hidden, scrollLeft kekunci 0
         selamanya → syarat "mentok" gak pernah kepenuhi → swipe maju gak
         pernah jalan. Table udah gak overflow lagi (width kolom dikunci %),
         jadi auto di sini praktis gak pernah kepake, cuma jaring pengaman.
         25 Agu 2026. */
      .hs-table-wrap:has(.hs-master-table),
      .hs-table-wrap:has(.hs-supplier-table) { overflow-x:auto; }
      /* #page-hutang-supplier di depan WAJIB (2 selector, bukan 1) — .hs-table
         base rule (min-width:540px) posisinya lebih belakang di file dan
         sama-sama 1-class specificity, jadi tanpa penguat ini dia yang
         menang meski kalah spesifik secara media query. Naikin specificity
         di sini biar menang PASTI, gak gantung urutan source. 25 Agu 2026. */
      #page-hutang-supplier .hs-master-table { min-width:0; width:100%; table-layout:fixed; }
      .hs-master-table th, .hs-master-table td { white-space:normal; word-break:break-word; padding:6px 4px; font-size:10.5px; }
      .hs-master-table th:nth-child(1), .hs-master-table td:nth-child(1) { width:8%; text-align:center; }
      .hs-master-table th:nth-child(2), .hs-master-table td:nth-child(2) { width:26%; }
      .hs-master-table th:nth-child(3), .hs-master-table td:nth-child(3) { width:40%; }
      .hs-master-table th:nth-child(4), .hs-master-table td:nth-child(4) { width:26%; }
      .hs-master-table tbody tr { cursor:default; }
      #page-hutang-supplier .hs-supplier-table { min-width:0; width:100%; table-layout:fixed; }
      .hs-supplier-table th, .hs-supplier-table td { white-space:normal; word-break:break-word; padding:7px 5px; font-size:11px; }
      .hs-supplier-table th:nth-child(1), .hs-supplier-table td:nth-child(1) { width:38%; text-align:left; }
      .hs-supplier-table th:nth-child(2), .hs-supplier-table td:nth-child(2) { width:32%; }
      .hs-supplier-table th:nth-child(3), .hs-supplier-table td:nth-child(3) { width:30%; }
      .hs-jenis-badge { font-size:10px; padding:2px 6px; gap:3px; }
    }

    .hs-toolbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:12px; }
    .hs-btn-pill    { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:20px; font-family:var(--f); font-size:13px; font-weight:600; cursor:pointer; border:none; }
    .hs-btn-primary { background:var(--ink); color:var(--cream); }
    .hs-btn-ghost   { background:none; color:var(--ink2); border:1px solid var(--ink3); }
    .hs-btn-danger  { background:none; color:var(--danger); border:1px solid var(--danger); }

    /* ── Pemisah tebal antara minicard/toolbar & data table/list di bawahnya
       — konsep sama kayak Gadag, biar ada jeda visual yang jelas sebelum
       data mulai. Dipakai di semua panel Hutang Barang yang punya toolbar/
       minicard di atas tabelnya (Bon, Master Barang, Overview). ── */
    .hs-divider { height:3px; background:var(--ink); border-radius:2px; margin:2px 0 14px; flex:none; opacity:.9; }

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
    .hs-badge-po    { background:rgba(47,111,176,.15); color:var(--info); }

    /* ── Kelola Supplier: badge jenis + radio pilih jenis ── */
    .hs-jenis-badge {
      display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:800;
      padding:3px 9px; border-radius:10px; white-space:nowrap;
    }
    .hs-jenis-dropship { background:rgba(47,111,176,.15); color:var(--info); }
    .hs-jenis-reseller { background:rgba(181,69,61,.12); color:var(--danger); }
    /* width kolom Sistem/Lead Time DIKUNCI ke desktop (min-width:901px) —
       sebelumnya gak ada media guard, jadi px width ini nabrak & menang atas
       aturan persen mobile (sama-sama nth-child, yg belakangan di source
       menang), bikin tabel Kelola Supplier meleber di HP. 25 Agu 2026. */
    @media (min-width:901px) {
      .hs-supplier-table th:nth-child(2), .hs-supplier-table td:nth-child(2) { width:120px; text-align:center; }
      .hs-supplier-table th:nth-child(3), .hs-supplier-table td:nth-child(3) { width:110px; text-align:center; }
    }
    .hs-leadtime { font-weight:700; }
    .hs-leadtime-empty { color:var(--ink3); font-weight:400; font-size:11.5px; }
    .hs-jenis-radio {
      flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
      padding:9px 10px; border-radius:8px; border:1.5px solid var(--ink4); cursor:pointer;
      font-size:13px; font-weight:700; color:var(--ink2); background:var(--cream2);
      transition:background .15s ease, color .15s ease, border-color .15s ease;
    }
    .hs-jenis-radio input { accent-color:var(--ink); }
    .hs-jenis-radio:has(input:checked) { border-color:var(--ink); color:var(--cream); background:var(--ink); }
    .hs-jenis-radio:has(input:checked) input { accent-color:var(--cream); }
    .hs-bon-sub  { font-size:11.5px; color:var(--ink3); margin-top:3px; }
    .hs-bon-sisa { font-size:13px; font-weight:700; color:var(--danger); margin-top:2px; }
    .hs-empty { text-align:center; padding:40px 12px; color:var(--ink3); font-size:13px; }

    /* ── List Master Barang ── */
    .hs-table-wrap { overflow-x:auto; border:1px solid var(--ink4); border-radius:12px; -webkit-overflow-scrolling:touch; }
    .hs-table { width:100%; min-width:540px; border-collapse:collapse; font-size:13px; }
    .hs-table thead th { background:var(--cream3); color:var(--ink3); font-weight:800; font-size:10.5px; text-transform:uppercase; letter-spacing:.03em; padding:10px 12px; border-bottom:2px solid var(--ink4); border-right:1px solid var(--ink4); text-align:left; white-space:nowrap; position:sticky; top:0; }
    .hs-table thead th:last-child { border-right:none; }
    .hs-table tbody td { padding:9px 12px; border-bottom:1px solid var(--ink4); border-right:1px solid var(--ink4); color:var(--ink); white-space:nowrap; }
    .hs-table tbody td:last-child { border-right:none; }
    .hs-table tbody tr { cursor:pointer; }
    .hs-table tbody tr:last-child td { border-bottom:none; }
    .hs-table tbody tr:hover td { background:var(--cream2); }
    .hs-table-num { text-align:right; font-weight:700; }
    .hs-table td.hs-empty { white-space:normal; }

    /* ── Switcher supplier (Jurnal Re-Stock) — ganti mini-card row: total +
       kotak nama supplier yg bisa di-swipe/tap buat pindah "halaman" supplier ── */
    .hs-bon-switcher { display:flex; gap:10px; margin-bottom:12px; position:relative; flex-shrink:0; }
    .hs-bon-switcher-total, .hs-bon-switcher-sup {
      flex:1; min-width:0; background:var(--cream2); border:1.5px solid var(--ink4);
      border-radius:12px; padding:11px 14px; font-family:var(--f); box-sizing:border-box;
    }
    .hs-bon-switcher-total { font-size:15px; font-weight:800; color:var(--danger); display:flex; align-items:center; }
    .hs-bon-switcher-sup {
      display:flex; align-items:center; justify-content:space-between; gap:6px; cursor:pointer;
      font-size:14px; font-weight:700; color:var(--ink);
      -webkit-user-select:none; user-select:none;
    }
    .hs-bon-switcher-sup span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hs-bon-switcher-sup i { flex:none; color:var(--ink3); font-size:13px; transition:transform .15s ease; }
    .hs-bon-switcher-sup.open i { transform:rotate(180deg); }
    .hs-bon-switcher-dropdown {
      display:none; position:absolute; top:calc(100% + 6px); right:0; min-width:170px;
      background:var(--cream); border:2px solid var(--ink); border-radius:12px;
      box-shadow:2px 3px 0 rgba(38,34,32,0.15); overflow:hidden; overflow-y:auto; max-height:260px; z-index:60;
    }
    .hs-bon-switcher-dropdown.open { display:block; }
    .hs-bon-switcher-dropdown button {
      display:block; width:100%; text-align:left; padding:10px 14px; background:none; border:none;
      border-bottom:1px solid var(--ink4); font-family:var(--f); font-size:13.5px; font-weight:700;
      color:var(--ink); cursor:pointer;
    }
    .hs-bon-switcher-dropdown button:last-child { border-bottom:none; }
    .hs-bon-switcher-dropdown button:hover { background:rgba(38,34,32,.06); }
    .hs-bon-switcher-dropdown button.active { background:var(--ink); color:var(--cream) !important; }

    /* ── Toolbar tab Bon: "Export PDF" (ujung kiri) & "Tambah Bon" (ujung
       kanan) — ukuran & proporsi disamain kayak box Nominal/Supplier di
       switcher atasnya (flex:1, padding & radius sama), biar proper & gak
       nempel/dempet kayak tombol pill kecil di panel lain ── */
    #hs-bon-toolbar { display:flex; gap:10px; flex-wrap:nowrap; }
    #hs-bon-toolbar .hs-btn-pill {
      flex:1; min-width:0; justify-content:center; box-sizing:border-box;
      padding:11px 14px; border-radius:12px; font-size:14px; font-weight:700;
    }
    #hs-bon-toolbar .hs-btn-ghost   { background:var(--cream2); border:1.5px solid var(--ink4); color:var(--ink); }
    #hs-bon-toolbar .hs-btn-primary { background:var(--ink); border:1.5px solid var(--ink); color:var(--cream); }
    /* Export PDF diciutin jadi kotak ikon doang (bukan flex:1 kayak 2 tombol
       teks di sebelahnya) — biar muat 3 tombol sejajar pas lagi difilter 1
       supplier, sesuai mockup: [Bayar Utang] [ikon PDF] [+ Bon]. */
    #hs-bon-toolbar .hs-btn-icon-only { flex:none; width:44px; padding:11px 0; }

    /* ── OVERVIEW: grid minicard + ranking supplier + aging list ── */
    .hs-ov-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:18px; }
    .hs-ov-card { display:flex; align-items:center; gap:8px; background:var(--cream2); border:1px solid var(--ink4); border-radius:8px; padding:10px; min-width:0; }
    .hs-ov-donut { --pct:0; --donut-color:var(--danger); width:42px; height:42px; flex:none; border-radius:50%;
      background:conic-gradient(var(--donut-color) calc(var(--pct)*1%), var(--ink4) 0);
      display:flex; align-items:center; justify-content:center; position:relative; }
    .hs-ov-donut::before { content:''; position:absolute; inset:5px; border-radius:50%; background:var(--cream2); }
    .hs-ov-donut span { position:relative; z-index:1; font-size:9.5px; font-weight:800; color:var(--ink); }
    .hs-ov-card-txt { min-width:0; flex:1; }
    .hs-ov-card-label { font-size:10.5px; color:var(--ink3); font-weight:700; text-transform:uppercase; letter-spacing:.03em; }
    .hs-ov-card-value { font-size:13.5px; font-weight:800; color:var(--ink); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hs-ov-card-value.hs-ov-danger { color:var(--danger); }
    .hs-ov-card-value.hs-ov-ok { color:var(--ok); }
    .hs-ov-section-title { font-size:12px; font-weight:800; color:var(--ink3); text-transform:uppercase; letter-spacing:.04em; margin:4px 0 8px; }
    .hs-ov-list-wrap {}
    .hs-ov-rank-row { display:flex; align-items:center; gap:10px; padding:9px 0; }
    .hs-ov-aging-row { display:flex; justify-content:space-between; align-items:baseline; gap:8px; padding:8px 0; font-size:12.5px; }
    .hs-ov-rank-nama { flex:1; min-width:0; font-size:13px; font-weight:700; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hs-ov-rank-bar-wrap { flex:none; width:70px; height:5px; border-radius:0; background:var(--ink4); overflow:hidden; }
    .hs-ov-rank-bar { height:100%; background:var(--danger); border-radius:0; }
    .hs-ov-rank-val { flex:none; font-size:12.5px; font-weight:800; color:var(--danger); white-space:nowrap; min-width:78px; text-align:right; }
    .hs-ov-aging-row { display:flex; justify-content:space-between; align-items:baseline; gap:8px; padding:8px 0; font-size:12.5px; }
    .hs-ov-aging-left { color:var(--ink2); min-width:0; }
    .hs-ov-aging-nama { font-weight:700; color:var(--ink); }
    .hs-ov-aging-hari { font-weight:800; white-space:nowrap; }
    .hs-ov-aging-merah { color:var(--danger); }
    .hs-ov-aging-kuning { color:var(--warn); }

    /* ── RIWAYAT BAYAR (jurnal pembayaran) ── */
    #hs-pembayaran-list { display:flex; flex-direction:column; gap:8px; }
    .hs-pay-row-card { display:flex; align-items:center; gap:12px; background:var(--cream2); border:1px solid var(--ink4); border-radius:12px; padding:12px 14px; }
    .hs-pay-row-icon { flex:none; width:36px; height:36px; border-radius:50%; background:rgba(62,207,106,.15); color:var(--ok); display:flex; align-items:center; justify-content:center; font-size:16px; }
    .hs-pay-row-main { flex:1; min-width:0; }
    .hs-pay-row-sup { font-weight:700; font-size:13.5px; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hs-pay-row-sub { font-size:11px; color:var(--ink3); margin-top:2px; }
    .hs-pay-row-nom { flex:none; font-size:14px; font-weight:800; color:var(--ok); white-space:nowrap; text-align:right; }

    /* ── Bottom sheet (form) — pola sama Gadag ── */
    .hs-sheet-overlay { display:none; position:fixed; inset:0; z-index:820; background:rgba(0,0,0,.55); align-items:flex-end; justify-content:center; }
    .hs-sheet-overlay.open { display:flex; }
    /* Modifier buat sheet yg bisa numpuk DI ATAS sheet lain (mis. picker
       supplier yg dibuka dari dalam sheet Tambah/Edit Bon) — z-index lebih
       tinggi dari .hs-sheet-overlay biasa (820) tapi tetep bottom-sheet. */
    .hs-sheet-overlay-top { z-index:825; }
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
    .hs-item-row { display:flex; align-items:center; gap:8px; background:var(--cream2); border:1px solid var(--ink4); border-radius:10px; padding:8px 10px; }
    .hs-item-row .hs-picker-trigger { flex:1; min-width:0; }
    .hs-item-row .hs-item-qty {
      width:56px; flex:none; text-align:center; color-scheme:light;
      border:2px solid var(--ink); border-radius:8px; background:var(--cream);
      color:var(--ink); font-family:var(--f); font-size:14px; font-weight:700;
      padding:8px 4px; box-sizing:border-box;
    }
    .hs-item-remove { background:none; border:none; color:var(--danger); font-size:16px; cursor:pointer; padding:4px; flex:none; }
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

    /* ── Picker terpusat (dipakai buat pilih Supplier di Paste Massal) ──
       Beda dari .hs-sheet-overlay (bottom sheet): ini SELALU nongol di
       tengah layar, di semua ukuran, jadi ga ada dropdown native yang
       kepotong/ketutup sheet lain. z-index di atas .hs-sheet-overlay
       (820) biar bisa dibuka numpuk di atas sheet Paste Massal. */
    .hs-picker-overlay {
      display:none; position:fixed; inset:0; z-index:830;
      background:rgba(38,34,32,.55); align-items:center; justify-content:center;
      padding:16px; box-sizing:border-box;
    }
    .hs-picker-overlay.open { display:flex; }
    .hs-picker-box {
      width:100%; max-width:340px; max-height:70vh; background:var(--cream);
      border-radius:16px; box-shadow:0 8px 28px rgba(38,34,32,.35);
      display:flex; flex-direction:column; overflow:hidden;
    }
    .hs-picker-title { font-size:15px; font-weight:800; color:var(--ink); padding:14px 16px 8px; flex:none; }
    .hs-picker-search {
      margin:0 16px 10px; padding:9px 11px; border-radius:8px; border:1px solid var(--ink4);
      background:var(--cream2); color:var(--ink); font-family:var(--f); font-size:14px; outline:none; flex:none;
    }
    .hs-picker-search:focus { border-color:var(--ink); }
    .hs-picker-list { flex:1 1 auto; min-height:0; overflow-y:auto; padding:2px 8px 10px; }
    .hs-picker-item {
      padding:11px 10px; border-radius:8px; font-size:14px; color:var(--ink); cursor:pointer;
    }
    .hs-picker-item:active, .hs-picker-item.active { background:var(--cream3); font-weight:700; }
    .hs-picker-item-new { color:var(--info); font-weight:700; display:flex; align-items:center; gap:6px; border-top:1px solid var(--ink4); margin-top:4px; padding-top:12px; }
    .hs-picker-empty { padding:16px 10px; color:var(--ink3); font-size:12.5px; text-align:center; }
    .hs-picker-trigger {
      display:flex; align-items:center; justify-content:space-between; gap:8px; cursor:pointer;
      width:100%; padding:9px 11px; border-radius:8px; border:1px solid var(--ink4);
      background:var(--cream2); color:var(--ink); font-family:var(--f); font-size:14px; box-sizing:border-box;
    }
    .hs-picker-trigger i { color:var(--ink3); flex:none; }
  </style>

  <!-- HEADER: judul panel aktif + dropdown menu (desktop) / dot notch (mobile) -->
  <div id="hs-hdr-row">
    <div id="hs-hdr-left">
      <button id="hs-hdr-refresh" onclick="loadHutangSupplier()" title="Refresh"><i class="ti ti-refresh"></i></button>
      <i id="hs-hdr-icon" class="ti ti-chart-donut"></i>
      <div id="hs-hdr-heading">Overview</div>
    </div>
    <div class="hs-menu-wrap">
      <button id="hs-menu-item-overview" class="hs-tab-btn active" onclick="hsSwitchView('overview')">Overview</button>
      <button id="hs-menu-item-restock" class="hs-tab-btn" onclick="hsSwitchView('restock')">Re Stock</button>
      <button id="hs-menu-item-bon" class="hs-tab-btn" onclick="hsSwitchView('bon')">Bon</button>
      <button id="hs-menu-item-pembayaran" class="hs-tab-btn" onclick="hsSwitchView('pembayaran')">Riwayat Bayar</button>
      <button id="hs-menu-item-master" class="hs-tab-btn" onclick="hsSwitchView('master')">Master Barang</button>
      <button id="hs-menu-item-supplier" class="hs-tab-btn" onclick="hsSwitchView('supplier')">Kelola Supplier</button>
    </div>
    <div id="hs-page-dots" class="hs-page-dots">
      <span class="hs-page-dot active" onclick="hsSwitchView('overview')"></span>
      <span class="hs-page-dot" onclick="hsSwitchView('restock')"></span>
      <span class="hs-page-dot" onclick="hsSwitchView('bon')"></span>
      <span class="hs-page-dot" onclick="hsSwitchView('pembayaran')"></span>
      <span class="hs-page-dot" onclick="hsSwitchView('master')"></span>
      <span class="hs-page-dot" onclick="hsSwitchView('supplier')"></span>
    </div>
  </div>

  <div id="hs-supplier-row" style="display:none"></div>

  <div id="hs-panels-wrap">
    <div id="hs-panel-overview" class="hs-panel active">
      <div id="hs-overview-content"></div>
    </div>

    <!-- ── RE STOCK: rekomendasi order khusus supplier Reseller (PO) ──
         dibanding sama saldo Kas & Bank gabungan, biar keputusan order
         gak lepas dari kondisi duit beneran. Modul ini standalone (gak
         manggil fungsi restock.js/kas.js), ngulang query+hitung sendiri
         sesuai konvensi §1 RULES.md. ── -->
    <div id="hs-panel-restock" class="hs-panel">
      <div id="hs-restock-cash-bar" class="hs-restock-cash-bar">
        <div class="hs-restock-cash-item">
          <div class="hs-restock-cash-lbl">Kas &amp; Bank (semua akun)</div>
          <div class="hs-restock-cash-val" id="hs-restock-cash-total">—</div>
        </div>
        <div class="hs-restock-cash-item">
          <div class="hs-restock-cash-lbl">Dicentang</div>
          <div class="hs-restock-cash-val" id="hs-restock-checked-total" style="color:var(--warn)">Rp 0</div>
        </div>
        <div class="hs-restock-cash-item">
          <div class="hs-restock-cash-lbl">Sisa Setelah Order</div>
          <div class="hs-restock-cash-val" id="hs-restock-remaining-total">—</div>
        </div>
      </div>
      <div class="hs-divider"></div>
      <div class="hs-table-wrap">
        <table class="hs-table hs-restock-table">
          <thead>
            <tr>
              <th style="width:32px"></th><th>No</th><th>Supplier</th><th>SKU Induk</th><th>Varian</th><th class="hs-table-num">Sisa</th><th class="hs-table-num">Qty</th><th class="hs-table-num">Nilai</th>
            </tr>
          </thead>
          <tbody id="hs-restock-list">
            <tr><td colspan="8" class="hs-empty">Memuat...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div id="hs-panel-bon" class="hs-panel">
      <div id="hs-bon-switcher" class="hs-bon-switcher"></div>
      <div class="hs-toolbar" id="hs-bon-toolbar">
        <button class="hs-btn-pill hs-btn-ghost" onclick="hsOpenBayarUtang()"><i class="ti ti-cash"></i> Bayar Utang</button>
        <button id="hs-bon-export-btn" class="hs-btn-pill hs-btn-ghost hs-btn-icon-only" style="display:none" onclick="hsExportSupplierBonPDF(_hsFilterSupplier)" title="Export PDF"><i class="ti ti-file-download"></i></button>
        <button class="hs-btn-pill hs-btn-primary" onclick="hsOpenTambahBon()"><i class="ti ti-plus"></i> Tambah Bon</button>
      </div>
      <div class="hs-divider"></div>
      <div id="hs-bon-list"></div>
    </div>

    <div id="hs-panel-pembayaran" class="hs-panel">
      <div id="hs-pembayaran-list"></div>
    </div>

    <div id="hs-panel-master" class="hs-panel">
      <div id="hs-master-switcher" class="hs-bon-switcher"></div>
      <div class="hs-toolbar hs-master-toolbar-desktop">
        <button class="hs-btn-pill hs-btn-primary" onclick="hsOpenTambahBarang()"><i class="ti ti-plus"></i> Tambah Barang</button>
        <button id="hs-paste-massal-btn" class="hs-btn-pill hs-btn-ghost" onclick="hsShowPasteBarang()"><i class="ti ti-clipboard"></i> Paste Massal</button>
      </div>
      <div class="hs-divider"></div>
      <div class="hs-table-wrap">
        <table class="hs-table hs-master-table">
          <thead>
            <tr id="hs-master-thead-row">
              <th>No</th><th>SKU Induk</th><th>Variant</th><th>SKU Supplier</th><th>Supplier</th><th class="hs-table-num">HPP/Lusin</th>
            </tr>
          </thead>
          <tbody id="hs-master-list"></tbody>
        </table>
      </div>
    </div>

    <div id="hs-panel-supplier" class="hs-panel">
      <div class="hs-toolbar">
        <button class="hs-btn-pill hs-btn-primary" onclick="hsOpenTambahSupplierMaster()"><i class="ti ti-plus"></i> Tambah Supplier</button>
      </div>
      <div class="hs-item-hint" style="margin-bottom:12px">
        <b>Dropship</b>: suplier ngirim langsung hari itu juga, gak perlu PO — dipilih di Tambah Bon langsung jadi hutang aktif.<br>
        <b>Reseller</b>: harus PO dulu (bisa uang muka), baru jalan pas barang jadi — otomatis muncul badge "PO" di tab Bon sampai ditandai diterima.
      </div>
      <div class="hs-divider"></div>
      <div class="hs-table-wrap">
        <table class="hs-table hs-supplier-table">
          <thead>
            <tr>
              <th>Nama Supplier</th><th>Lead Time</th><th>Sistem</th>
            </tr>
          </thead>
          <tbody id="hs-supplier-master-list"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ── MODAL: TAMBAH / EDIT SUPPLIER ── -->
  <div class="modal-overlay" id="hs-sheet-supplier-master">
    <div class="modal" style="max-width:380px">
      <div class="modal-title" id="hs-sup-form-title"><i class="ti ti-truck"></i> Tambah Supplier</div>
      <input type="hidden" id="hs-supm-id">
      <div class="hs-form-group">
        <label>Nama Supplier</label>
        <input type="text" id="hs-supm-nama" placeholder="mis: RH">
      </div>
      <div class="hs-form-group">
        <label>Sistem</label>
        <div style="display:flex;gap:8px">
          <label class="hs-jenis-radio" id="hs-supm-jenis-dropship-wrap">
            <input type="checkbox" id="hs-supm-dropship" checked>
            <i class="ti ti-truck-delivery"></i> Dropship
          </label>
          <label class="hs-jenis-radio" id="hs-supm-jenis-reseller-wrap">
            <input type="checkbox" id="hs-supm-reseller">
            <i class="ti ti-file-invoice"></i> Reseller
          </label>
        </div>
        <div class="hs-item-hint" style="margin-top:8px">
          Dropship = langsung kirim hari itu, gak perlu PO. Reseller = wajib PO (+opsional uang muka), lead time bisa berminggu-minggu. Bisa dicentang dua-duanya kalau supplier ini bisa dua cara (mis. dropship harga normal, tapi bisa juga di-PO dengan harga lebih murah).
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center" onclick="hsSimpanSupplierMaster()"><i class="ti ti-check"></i> Simpan</button>
        <button class="btn btn-danger btn-sm" id="hs-supm-btn-hapus" style="display:none" onclick="hsHapusSupplierMaster()"><i class="ti ti-trash"></i> Hapus</button>
        <button class="btn btn-sm" onclick="closeModal('hs-sheet-supplier-master')">Batal</button>
      </div>
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
          <div class="hs-picker-trigger" id="hs-bon-supplier-trigger" onclick="hsBonSupPickerOpen()">
            <span id="hs-bon-supplier-trigger-label" style="color:var(--ink3)">— Pilih Supplier —</span>
            <i class="ti ti-chevron-down"></i>
          </div>
          <select id="hs-bon-supplier-select" onchange="hsOnBonSupplierChange()" style="display:none"></select>
          <input type="text" id="hs-bon-supplier-baru" placeholder="Nama supplier baru..." style="display:none;margin-top:8px" oninput="hsOnBonSupplierBaruInput()">
          <div id="hs-bon-jenis-hint" class="hs-item-hint" style="margin-top:8px"></div>
        </div>
        <div class="hs-form-group" id="hs-bon-mode-wrap" style="display:none">
          <label>Mode Beli</label>
          <div style="display:flex;gap:8px">
            <label class="hs-jenis-radio" id="hs-bon-mode-dropship-wrap">
              <input type="radio" name="hs-bon-mode" value="dropship" checked onchange="hsOnBonModeChange()">
              <i class="ti ti-truck-delivery"></i> Dropship
            </label>
            <label class="hs-jenis-radio" id="hs-bon-mode-po-wrap">
              <input type="radio" name="hs-bon-mode" value="po" onchange="hsOnBonModeChange()">
              <i class="ti ti-file-invoice"></i> P.O
            </label>
          </div>
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
        <div id="hs-item-empty-hint" class="hs-item-hint" style="display:none">Belum ada Master Barang buat supplier ini — bikin dulu di tab Master Barang.</div>
        <button class="hs-btn-pill hs-btn-ghost" onclick="hsAddItemRow()" style="margin:10px 0"><i class="ti ti-plus"></i> Tambah Barang</button>

        <div class="hs-total-line"><span>Total Bon</span><span id="hs-bon-total-display">Rp0</span></div>
      </div>
      <div class="hs-sheet-footer" style="display:flex;gap:8px">
        <button class="hs-btn-pill hs-btn-danger" id="hs-bon-btn-hapus" style="display:none" onclick="hsHapusBon()"><i class="ti ti-trash"></i> Hapus</button>
        <button class="hs-btn-pill hs-btn-primary" id="hs-bon-btn-simpan" style="flex:1;justify-content:center" onclick="hsSimpanBon()">Simpan</button>
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

        <div id="hs-detail-po-banner" style="display:none;margin-bottom:14px;padding:10px 12px;border:1.5px solid var(--info);border-radius:10px;background:rgba(47,111,176,.08)">
          <div style="font-size:12px;color:var(--ink2);margin-bottom:8px"><i class="ti ti-file-invoice"></i> Masih status <b>PO</b> — belum ditandai barang diterima dari supplier.</div>
          <button class="hs-btn-pill hs-btn-primary" style="width:100%;justify-content:center" onclick="hsTandaiBarangDiterima()"><i class="ti ti-truck-delivery"></i> Tandai Barang Diterima</button>
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

  <!-- ── SHEET: BAYAR UTANG GABUNGAN (dibuka dari toolbar Bon, khusus pas
       lagi difilter 1 supplier) — bayar 1 nominal, dialokasiin otomatis ke
       bon-bon supplier itu dari yang PALING LAMA dulu (FIFO) sampe abis. ── -->
  <div class="hs-sheet-overlay" id="hs-sheet-bayar-gab" onclick="if(event.target===this) hsCloseSheet('hs-sheet-bayar-gab')">
    <div class="hs-sheet-page">
      <div class="hs-sheet-handle"><span></span></div>
      <div class="hs-sheet-header">
        <div class="hs-sheet-title" id="hs-bayar-gab-title">Bayar Utang</div>
        <button class="hs-sheet-close" onclick="hsCloseSheet('hs-sheet-bayar-gab')"><i class="ti ti-x"></i></button>
      </div>
      <div class="hs-sheet-body">
        <div class="hs-detail-summary">
          <div class="hs-detail-summary-txt">
            <div class="hs-detail-summary-total" id="hs-bayar-gab-total">Sisa Rp0</div>
            <div class="hs-detail-summary-sisa" id="hs-bayar-gab-sub">0 bon belum lunas</div>
          </div>
        </div>

        <div class="hs-detail-section-title">Bon Belum Lunas (dari paling lama)</div>
        <div id="hs-bayar-gab-list"></div>

        <div class="hs-detail-section-title">Bayar</div>
        <div class="hs-row-2">
          <div class="hs-form-group">
            <label>Nominal</label>
            <input type="text" id="hs-bayar-gab-nominal" inputmode="numeric" placeholder="0">
          </div>
          <div class="hs-form-group">
            <label>Tanggal</label>
            <input type="date" id="hs-bayar-gab-tanggal">
          </div>
        </div>
        <div class="hs-row-2">
          <div class="hs-form-group">
            <label>Debit (Hutang/Beban)</label>
            <select id="hs-bayar-gab-akun-debit"></select>
          </div>
          <div class="hs-form-group">
            <label>Bayar dari (Kas/Bank)</label>
            <select id="hs-bayar-gab-akun-kredit"></select>
          </div>
        </div>
        <div class="hs-form-group">
          <label>Catatan (opsional)</label>
          <input type="text" id="hs-bayar-gab-catatan">
        </div>
        <div class="hs-item-hint" style="margin-bottom:10px">Nominal dialokasikan otomatis ke bon paling lama dulu — kalau lebih dari 1 bon, sisanya lanjut ke bon berikutnya sampai nominal habis.</div>
        <button class="hs-btn-pill hs-btn-primary" style="width:100%;justify-content:center" onclick="hsSimpanBayarGabungan()"><i class="ti ti-cash"></i> Catat Pembayaran</button>
      </div>
    </div>
  </div>

  <!-- ── PICKER TERPUSAT: PILIH BON (dipakai dari tombol "Bayar Utang" pas
       lagi "Semua Supplier" — pilih 1 bon dulu, baru lanjut ke sheet Detail
       Bon yang udah ada buat catat pembayarannya). ──
       2 level: (1) grup per supplier + sistem (P.O/Dropship, cuma dipisah
       kalau supplier itu dual-mode & emang punya bon belum lunas di
       dua-duanya — H SOLAH-case cuma 1 baris karena selalu P.O),
       (2) drill-in ke grup → list bon dengan kotak centang, pilih mana
       aja yang mau dibayar bareng. ── -->
  <div class="hs-picker-overlay" id="hs-bon-bayar-picker-overlay" onclick="if(event.target===this) hsBonBayarPickerClose()">
    <div class="hs-picker-box">
      <div class="hs-picker-title" style="display:flex;align-items:center;gap:8px">
        <button id="hs-bon-bayar-picker-back" onclick="hsBonBayarPickerBack()" style="display:none;background:none;border:none;padding:0;color:var(--ink);font-size:17px;cursor:pointer;flex:none"><i class="ti ti-arrow-left"></i></button>
        <span id="hs-bon-bayar-picker-title-text">Pilih Bon yang Mau Dibayar</span>
      </div>
      <input type="text" id="hs-bon-bayar-picker-search" class="hs-picker-search" placeholder="Cari supplier / no nota..." oninput="hsBonBayarPickerFilter(this.value)">
      <div class="hs-picker-list" id="hs-bon-bayar-picker-list"></div>
      <div id="hs-bon-bayar-picker-footer" style="display:none;flex:none;padding:10px 16px;border-top:1px solid var(--ink4)">
        <button id="hs-bon-bayar-picker-confirm-btn" class="hs-btn-pill hs-btn-primary" style="width:100%;justify-content:center" onclick="hsBonBayarPickerConfirm()">Bayar</button>
      </div>
    </div>
  </div>

  <!-- ── MODAL: TAMBAH / EDIT MASTER BARANG ──
       Pakai .modal-overlay/.modal GLOBAL (sama kayak modal Paste Massal SKU
       di Kelola Produk) — proper, selalu di tengah, ga kepotong kayak
       bottom sheet. Kolom/field TETAP sama, cuma bungkusnya yang diganti. -->
  <div class="modal-overlay" id="hs-sheet-barang">
    <div class="modal" style="max-width:420px">
      <div class="modal-title" id="hs-barang-form-title"><i class="ti ti-package"></i> Tambah Barang</div>
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
      <div class="hs-row-2">
        <div class="hs-form-group" id="hs-brg-harga-dropship-wrap">
          <label>Harga Dropship /Lusin</label>
          <input type="text" id="hs-brg-harga" inputmode="numeric" placeholder="0">
        </div>
        <div class="hs-form-group" id="hs-brg-harga-po-wrap" style="display:none">
          <label>Harga P.O /Lusin</label>
          <input type="text" id="hs-brg-harga-po" inputmode="numeric" placeholder="0">
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center" onclick="hsSimpanBarang()"><i class="ti ti-check"></i> Simpan</button>
        <button class="btn btn-danger btn-sm" id="hs-brg-btn-hapus" style="display:none" onclick="hsHapusBarang()"><i class="ti ti-trash"></i> Hapus</button>
        <button class="btn btn-sm" onclick="closeModal('hs-sheet-barang')">Batal</button>
      </div>
    </div>
  </div>

  <!-- ── MODAL: PASTE MASSAL MASTER BARANG ──
       Sama kayak di atas: .modal-overlay/.modal GLOBAL, biar tampilannya
       konsisten & proper kayak Paste Massal SKU di Kelola Produk. Kolom
       data & instruksinya TETAP beda (khusus Hutang Barang), cuma
       bungkus/tampilannya yang disamain. -->
  <div class="modal-overlay" id="hs-sheet-paste-barang">
    <div class="modal" style="max-width:560px">
      <div class="modal-title"><i class="ti ti-clipboard"></i> Paste Massal Barang</div>
      <div class="hs-form-group">
        <label>Supplier default (dipakai kalau baris data ga punya kolom Suplier)</label>
        <div class="hs-picker-trigger" id="hs-paste-supplier-trigger" onclick="hsSupPickerOpen('hs-paste-supplier-select','hs-paste-supplier-trigger-label')">
          <span id="hs-paste-supplier-trigger-label" style="color:var(--ink3)">— Pilih Supplier —</span>
          <i class="ti ti-chevron-down"></i>
        </div>
        <select id="hs-paste-supplier-select" style="display:none" onchange="hsOnPasteSupplierSelectChange()"></select>
        <input type="text" id="hs-paste-supplier-baru" placeholder="Nama supplier baru..." style="display:none;margin-top:8px">
      </div>
      <div style="font-size:12px;color:var(--ink3);margin:2px 0 10px;line-height:1.6">
        Copy dari Excel lalu paste di bawah.<br>
        Urutan kolom: <b>SKU Induk → Varian → SKU Suplier → Suplier → Harga per Lusin → Harga PO per Lusin</b><br>
        Kolom Suplier per baris opsional — kalau kosong / cuma 4 kolom, pakai Supplier default di atas. Nama Suplier yang belum ada otomatis dibikin baru.<br>
        Kolom <b>Harga PO per Lusin</b> (ke-6) juga opsional — cuma perlu diisi kalau suplier-nya P.O/dual-mode (RH-case) dan mau langsung bisa dipakai di Mode P.O. Kosongin aja kalau supplier-nya dropship murni.
      </div>
      <textarea id="hs-paste-area"
        style="width:100%;height:160px;font-family:var(--f);font-size:13px;padding:8px;border:2px solid var(--ink);background:var(--cream);resize:vertical;outline:none;border-radius:6px;box-sizing:border-box"
        placeholder="Paste di sini..."></textarea>
      <div id="hs-paste-preview" style="margin-top:10px;display:none">
        <div style="font-size:12px;font-weight:700;color:var(--ink3);margin-bottom:6px" id="hs-paste-count"></div>
        <div class="tbl-wrap" style="max-height:180px;overflow-y:auto">
          <table class="tbl"><thead><tr><th>SKU Induk</th><th>Varian</th><th>SKU Suplier</th><th>Suplier</th><th>HPP/Lsn</th><th>HPP PO/Lsn</th></tr></thead>
          <tbody id="hs-paste-tbody"></tbody></table>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-sm" onclick="hsParsePasteBarang()"><i class="ti ti-eye"></i> Preview</button>
        <button class="btn btn-primary btn-sm" id="hs-btn-simpan-paste-barang" style="display:none" onclick="hsSimpanPasteBarang()"><i class="ti ti-check"></i> Simpan Semua</button>
        <button class="btn btn-sm" onclick="closeModal('hs-sheet-paste-barang')">Batal</button>
      </div>
    </div>
  </div>

  <!-- ── PICKER TERPUSAT: PILIH SUPPLIER (dipakai di Paste Massal Barang) ──
       Selalu muncul di TENGAH layar (bukan bottom sheet, ga kepotong),
       terlepas dari modal Paste Massal di baliknya. ── -->
  <div class="hs-picker-overlay" id="hs-sup-picker-overlay" onclick="if(event.target===this) hsSupPickerClose()">
    <div class="hs-picker-box">
      <div class="hs-picker-title">Pilih Supplier</div>
      <input type="text" id="hs-sup-picker-search" class="hs-picker-search" placeholder="Cari supplier..." oninput="hsSupPickerFilter(this.value)">
      <div class="hs-picker-list" id="hs-sup-picker-list"></div>
    </div>
  </div>

  <!-- ── PICKER BOTTOM SHEET: PILIH SUPPLIER buat Tambah/Edit Bon ──
       Beda dari .hs-sup-picker-overlay di atas (yg tengah layar): ini
       naik dari bawah kayak picker akun di Kas & Jurnal (pola BRImo).
       Numpuk di atas sheet Tambah/Edit Bon (hs-sheet-overlay-top). ── -->
  <div class="hs-sheet-overlay hs-sheet-overlay-top" id="hs-bon-sup-picker-overlay" onclick="if(event.target===this) hsBonSupPickerClose()">
    <div class="hs-sheet-page" style="max-height:80vh">
      <div class="hs-sheet-handle"><span></span></div>
      <div class="hs-sheet-header">
        <div class="hs-sheet-title">Pilih Supplier</div>
        <button class="hs-sheet-close" onclick="hsBonSupPickerClose()"><i class="ti ti-x"></i></button>
      </div>
      <input type="text" id="hs-bon-sup-picker-search" class="hs-picker-search" style="margin:0 16px 10px" placeholder="Cari supplier..." oninput="hsBonSupPickerFilter(this.value)">
      <div class="hs-picker-list" id="hs-bon-sup-picker-list" style="padding:2px 16px 16px"></div>
    </div>
  </div>

  <!-- ── PICKER TERPUSAT: PILIH BARANG (dipakai di baris item Tambah Bon) ──
       Ganti native <select> yg dropdown-nya item hitam kontras & masih ada
       opsi "Manual" — sekarang HARUS dari Master Barang, gak ada jalan lain. ── -->
  <div class="hs-picker-overlay" id="hs-brg-picker-overlay" onclick="if(event.target===this) hsBrgPickerClose()">
    <div class="hs-picker-box">
      <div class="hs-picker-title">Pilih Barang</div>
      <input type="text" id="hs-brg-picker-search" class="hs-picker-search" placeholder="Cari barang..." oninput="hsBrgPickerFilter(this.value)">
      <div class="hs-picker-list" id="hs-brg-picker-list"></div>
    </div>
  </div>
`;

// ─── STATE ──────────────────────────────────────────────────────
var _hsView            = 'overview';   // 'overview' | 'bon' | 'pembayaran' | 'master'
var _hsSupplierList     = [];     // [{id, nama, kontak, jenis: 'dropship'|'reseller'}]
var _hsBonList          = [];     // [{id, supplier_id, tanggal, no_nota, total, status, catatan, ...}]
var _hsPembayaranAll    = [];     // semua hutang_pembayaran
var _hsBarangMaster     = [];     // semua hutang_barang (master katalog per supplier)
var _hsKatalogList      = [];     // distinct produk.katalog, buat dropdown SKU Induk
var _hsAkunKas          = [];     // kas_akun, buat select debit/kredit pembayaran
var _hsFilterSupplier   = null;   // null = semua (dipakai bareng di tab Bon & Master)
var _hsItemRows         = [];     // baris item form Tambah/Edit Bon
var _hsCurrentBonId     = null;   // bon yg lagi dibuka di sheet detail
var _hsCurrentBonSupplierId = null; // supplier_id yg lagi aktif di form Tambah/Edit Bon
var _hsCurrentBonMode = 'dropship'; // 'dropship'|'po' — mode harga aktif di form Tambah/Edit Bon (cuma relevan buat supplier dual-mode: is_dropship & is_reseller dua-duanya true; reseller-murni selalu 'po')
var _hsBayarGabSupplierId = null; // supplier_id yg lagi aktif di sheet Bayar Utang (gabungan)
var _hsBayarGabBonIds = null; // array bon id spesifik (dari drill-in checkbox picker) — null = semua bon belum lunas milik supplier (perilaku lama)

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
    hsRenderOverview();
    hsRenderBonList();
    hsRenderPembayaranList();
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

// ─── RE STOCK (PO) — rekomendasi order khusus supplier Reseller,
// dibanding sama saldo Kas & Bank gabungan. Standalone (query+hitung
// sendiri, gak manggil fungsi restock.js/kas.js), formula ROP identik
// restock.js: Avg Harian = qty14/14, Safety = AvgHarian×buffer_hari,
// ROP = (AvgHarian×lead_time)+Safety, QtyOrder = ROP dibulatkan ke atas
// ke kelipatan terdekat (BUKAN dikurangin sisa stok — skema ROP klasik:
// begitu sisa stok nembus/di bawah titik ROP → trigger reorder qty baku).
// Trigger reorder: sisa_stok <= rop_raw (kalau sisa gak diketahui, tetap
// dimasukin biar keliatan/gak silently hilang). Filter fast-move: SKU
// wajib ada penjualan dalam 7 hari terakhir buat direkomendasikan — biar
// minimum-order floor supplier gak "maksa" restock barang yg udah gak
// gerak. 30 Agu 2026. ──────────────────────────────────────────────
var _hsRestockItems     = [];
var _hsRestockChecked   = {};
var _hsRestockCashTotal = 0;

function _hsBulatkanKelipatan(nilai, kelipatan, min_order) {
  if (nilai <= 0) nilai = 0.01;
  var k   = kelipatan || 1;
  var raw = Math.ceil(nilai / k) * k;
  return Math.max(raw, min_order || k);
}

async function hsLoadRestockPO() {
  var listEl = document.getElementById('hs-restock-list');
  if (listEl) listEl.innerHTML = '<tr><td colspan="8" class="hs-empty">Memuat...</td></tr>';
  try {
    var today  = new Date();
    var d14    = new Date(today); d14.setDate(d14.getDate() - 13);
    var dari14 = d14.toISOString().slice(0, 10);
    var d7     = new Date(today); d7.setDate(d7.getDate() - 6);
    var dari7  = d7.toISOString().slice(0, 10);

    var [penjualan14, produkAll, restockSup, stokData, jurnalAll, kasAkun, jurnalKas] = await Promise.all([
      dbGet('jurnal_penjualan', '&select=sku,qty,tanggal&or=(order_status.neq.CANCELLED,order_status.is.null)&tanggal=gte.' + dari14),
      dbGet('produk',           '&order=katalog.asc'),
      dbGet('restock_supplier').catch(function() { return []; }),
      dbGet('stok'),
      dbGet('jurnal_penjualan', '&select=sku,qty&or=(order_status.neq.CANCELLED,order_status.is.null)'),
      dbGet('kas_akun'),
      dbGet('jurnal', '&select=akun_debit_id,akun_kredit_id,nominal'),
    ]);

    // ── Cash Kas & Bank, semua akun digabung ──
    var kasBankIds = {};
    (kasAkun || []).forEach(function(a) {
      if ((a.kelompok || '').trim().toLowerCase() === 'aset' && (a.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK') {
        kasBankIds[a.id] = true;
      }
    });
    var cashTotal = 0;
    (jurnalKas || []).forEach(function(r) {
      var n = r.nominal || 0;
      if (kasBankIds[r.akun_debit_id])  cashTotal += n;
      if (kasBankIds[r.akun_kredit_id]) cashTotal -= n;
    });
    _hsRestockCashTotal = cashTotal;

    // ── Supplier PO = hutang_supplier.is_reseller ──
    var poSupplierSet = {};
    (_hsSupplierList || []).forEach(function(s) {
      if (s.is_reseller) poSupplierSet[(s.nama || '').trim().toUpperCase()] = true;
    });

    // ── Sisa stok per SKU — identik stok.js/restock.js ──
    var masukMap = {};
    (stokData || []).forEach(function(s) {
      var key = (s.sku_variasi || '').trim().toUpperCase();
      if (key) masukMap[key] = s.stok_masuk || 0;
    });
    var keluarMap = {};
    (jurnalAll || []).forEach(function(r) {
      var key = (r.sku || '').trim().toUpperCase();
      if (key) keluarMap[key] = (keluarMap[key] || 0) + (r.qty || 0);
    });
    var sisaMap = {};
    Object.keys(masukMap).forEach(function(k) { sisaMap[k] = masukMap[k] - (keluarMap[k] || 0); });

    var produkMap = {};
    (produkAll || []).forEach(function(p) {
      var key = (p.sku_variasi || p.sku || '').trim().toUpperCase();
      if (key) produkMap[key] = p;
    });

    var qtyMap = {};
    var sales7Map = {};
    (penjualan14 || []).forEach(function(row) {
      var sku = (row.sku || '').trim().toUpperCase();
      if (!sku) return;
      qtyMap[sku] = (qtyMap[sku] || 0) + (row.qty || 0);
      if (row.tanggal >= dari7) sales7Map[sku] = (sales7Map[sku] || 0) + (row.qty || 0);
    });

    var supplierMap = {};
    (restockSup || []).forEach(function(s) {
      var key = (s.boss || '').trim().toUpperCase();
      supplierMap[key] = {
        lead_time:   s.lead_time   || 7,
        min_order:   s.min_order   || 6,
        kelipatan:   s.kelipatan   || s.min_order || 6,
        buffer_hari: s.buffer_hari || 3,
      };
    });
    var DEFAULT_SUP = { lead_time: 7, min_order: 6, kelipatan: 6, buffer_hari: 3 };

    var items = [];
    Object.keys(qtyMap).forEach(function(sku) {
      var p = produkMap[sku];
      if (!p) return;
      var bossKey = (p.boss || '').trim().toUpperCase();
      if (!poSupplierSet[bossKey]) return; // cuma supplier Reseller/PO yang masuk

      // ── Filter fast-move: harus ada penjualan dalam 7 hari terakhir.
      // SKU yg cuma kejual di hari ke-8..14 (gak gerak minggu ini) TIDAK
      // direkomendasikan restock di sini walau ROP-nya kebulet ke floor
      // kelipatan supplier — biar modal gak numpuk di barang yg gak laku. ──
      if (!sales7Map[sku] || sales7Map[sku] <= 0) return;

      var qty14       = qtyMap[sku];
      var sup         = supplierMap[bossKey] || DEFAULT_SUP;
      var avg_harian  = qty14 / 14;
      var safety      = avg_harian * sup.buffer_hari;
      var rop_raw     = (avg_harian * sup.lead_time) + safety;
      var sisa        = sisaMap[sku] !== undefined ? sisaMap[sku] : null;

      // ── Trigger reorder klasik: cuma muncul kalau sisa stok SEKARANG
      // udah nyampe/nembus titik ROP. Kalau sisa masih di atas ROP,
      // belum waktunya reorder — walau SKU-nya fast-move & rop_raw kecil
      // kebulet ke floor kelipatan, jangan dimasukin dulu. Qty Order tetap
      // dihitung penuh dari ROP (BUKAN dikurangin sisa) begitu trigger nyala. ──
      if (sisa !== null && sisa > rop_raw) return;

      var qty_order   = _hsBulatkanKelipatan(rop_raw, sup.kelipatan, sup.min_order);
      var nilai       = (p.hpp || 0) * qty_order;
      var dos         = (sisa !== null && avg_harian > 0) ? Math.round(sisa / avg_harian) : null;

      if (qty_order <= 0) return;

      var prioritas = 'PERLU';
      if (dos !== null && dos <= sup.lead_time) prioritas = 'SEGERA';
      else if (sisa !== null && sisa <= 3)       prioritas = 'SEGERA';
      else if (dos !== null && dos <= 14)        prioritas = 'PERLU';
      else                                        prioritas = 'TUNDA';

      // ── Varian: bagian setelah underscore terakhir di SKU Variasi
      // (mis. "CALYRA_HITAM" → "HITAM"). Fallback ke SKU penuh kalau
      // gak ada underscore. ──
      var uIdx  = sku.lastIndexOf('_');
      var varian = uIdx >= 0 ? sku.slice(uIdx + 1) : sku;

      items.push({ sku: sku, katalog: p.katalog || '—', varian: varian, boss: bossKey, sisa: sisa, qty_order: qty_order, nilai: nilai, prioritas: prioritas, dos: dos });
    });

    var prioRank = { SEGERA: 0, PERLU: 1, TUNDA: 2 };
    items.sort(function(a, b) {
      var pa = prioRank[a.prioritas], pb = prioRank[b.prioritas];
      if (pa !== pb) return pa - pb;
      return (a.dos === null ? 999 : a.dos) - (b.dos === null ? 999 : b.dos);
    });

    _hsRestockItems   = items;
    _hsRestockChecked = {};
    hsRenderRestockList();
  } catch(e) {
    console.error('hsLoadRestockPO error', e);
    var el = document.getElementById('hs-restock-list');
    if (el) el.innerHTML = '<tr><td colspan="8" class="hs-empty">Gagal memuat: ' + (e.message || e) + '</td></tr>';
  }
}

function hsRenderRestockList() {
  var cashEl = document.getElementById('hs-restock-cash-total');
  if (cashEl) cashEl.textContent = fmtRpFull(_hsRestockCashTotal);

  var listEl = document.getElementById('hs-restock-list');
  if (!listEl) return;

  if (!_hsRestockItems.length) {
    listEl.innerHTML = '<tr><td colspan="8" class="hs-empty">Gak ada rekomendasi restock buat supplier PO saat ini.</td></tr>';
    hsRestockUpdateRunningTotal();
    return;
  }

  listEl.innerHTML = _hsRestockItems.map(function(it, i) {
    var checked = _hsRestockChecked[it.sku] ? 'checked' : '';
    var skuAttr = it.sku.replace(/'/g, "\\'");
    var sisaTxt = it.sisa !== null ? it.sisa : '—';
    return '<tr data-sku="' + _hsEsc(it.sku) + '"' + (_hsRestockChecked[it.sku] ? ' class="hs-restock-checked-row"' : '') + '>' +
      '<td class="hs-restock-chk"><input type="checkbox" ' + checked + ' onchange="hsRestockToggle(\'' + skuAttr + '\', this.checked)"></td>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + _hsEsc(it.boss) + '</td>' +
      '<td>' + _hsEsc(it.katalog) + '</td>' +
      '<td>' + _hsEsc(it.varian) + '</td>' +
      '<td class="hs-table-num">' + sisaTxt + '</td>' +
      '<td class="hs-table-num">' + it.qty_order + '</td>' +
      '<td class="hs-table-num">' + fmtRpFull(it.nilai) + '</td>' +
    '</tr>';
  }).join('');

  hsRestockUpdateRunningTotal();
}

function hsRestockToggle(sku, checked) {
  if (checked) _hsRestockChecked[sku] = true; else delete _hsRestockChecked[sku];
  hsRestockUpdateRunningTotal();
}

function hsRestockUpdateRunningTotal() {
  var checkedTotal = 0;
  _hsRestockItems.forEach(function(it) {
    if (_hsRestockChecked[it.sku]) checkedTotal += it.nilai;
  });
  var remaining  = _hsRestockCashTotal - checkedTotal;
  var checkedEl  = document.getElementById('hs-restock-checked-total');
  var remainEl   = document.getElementById('hs-restock-remaining-total');
  if (checkedEl) checkedEl.textContent = fmtRpFull(checkedTotal);
  if (remainEl) {
    remainEl.textContent  = fmtRpFull(remaining);
    remainEl.style.color  = remaining < 0 ? 'var(--danger)' : 'var(--ok)';
  }
}

// ─── TAB SWITCHER ─────────────────────────────────────────────
var _HS_VIEW_LABEL = {
  overview:   { label: 'Overview',        icon: 'ti-chart-donut' },
  restock:    { label: 'Re Stock',        icon: 'ti-shopping-cart-plus' },
  bon:        { label: 'Jurnal Re-Stock', icon: 'ti-receipt' },
  pembayaran: { label: 'Riwayat Bayar',   icon: 'ti-cash' },
  master:     { label: 'Master Barang',   icon: 'ti-list-details' },
  supplier:   { label: 'Kelola Supplier', icon: 'ti-truck' },
};
var _HS_VIEW_ORDER = ['overview', 'restock', 'bon', 'pembayaran', 'master', 'supplier'];

// Jenis supplier: 'dropship' = suplier yang kirim langsung hari itu juga
// (gak perlu PO). 'reseller' = harus PO dulu + (opsional) uang muka, baru
// jalan setelah barang jadi (lead time bisa berminggu-minggu).
var _HS_JENIS_LABEL = {
  dropship: { label: 'Dropship', icon: 'ti-truck-delivery' },
  reseller: { label: 'Reseller', icon: 'ti-file-invoice'   },
};

function hsSwitchView(view) {
  _hsView = view;
  _hsFilterSupplier = null; // selalu landing di "Semua Supplier" dulu tiap ganti tab
  _HS_VIEW_ORDER.forEach(function(v) {
    var panel = document.getElementById('hs-panel-' + v);
    if (panel) panel.classList.toggle('active', v === view);
  });
  var supRow = document.getElementById('hs-supplier-row');
  if (supRow) supRow.style.display = (view === 'overview' || view === 'restock' || view === 'bon' || view === 'master' || view === 'supplier') ? 'none' : '';

  document.getElementById('hs-hdr-heading').textContent  = _HS_VIEW_LABEL[view].label;
  document.getElementById('hs-hdr-icon').className       = 'ti ' + _HS_VIEW_LABEL[view].icon;
  _HS_VIEW_ORDER.forEach(function(v) {
    document.getElementById('hs-menu-item-' + v).classList.toggle('active', v === view);
  });
  var dotsEl = document.getElementById('hs-page-dots');
  Array.prototype.forEach.call(dotsEl.children, function(dot, i) {
    dot.classList.toggle('active', _HS_VIEW_ORDER[i] === view);
  });
  hsRenderSupplierCards();
  hsRenderBonList();
  hsRenderMasterList();
  hsRenderSupplierMasterList();
  if (view === 'restock') hsLoadRestockPO(); // lazy-load, query lumayan berat, gak usah jalan tiap ganti tab lain
}

// ─── Swipe antar panel (mobile only) — pola sama persis kayak Gadag ──
// (edge-guard 24px biar gak rebutan sama swipe-back OS, threshold 40px/flick
// biar aman coexist sama long-press-edit yang ada di list Bon & Master Barang)
//
// Edge-aware handoff (fix "goyang" pas swipe di tabel Master Barang, 23 Agu
// 2026): kalau sentuhan MULAI di dalam container yang scroll-horizontal
// sendiri (.hs-table-wrap), scroll native tabelnya WAJIB menang duluan —
// JS ini cuma "nyambung" jadi swipe-pindah-tab begitu tabel udah kedorong
// sampe mentok salah satu ujung DAN user masih terus narik ke arah yang
// sama (persis pola carousel/App native: geser di dalam list dulu, baru
// nge-bubble ke gesture level atas pas abis mentok). Kalau nggak pernah
// mentok, touchend nggak pernah nge-trigger pindah tab sama sekali —
// jadi tabel jadi murni area scroll, nggak ada lagi "rem blong".
(function() {
  var wrap = document.getElementById('hs-panels-wrap');
  if (!wrap) return;
  var EDGE = 24;
  var startX = 0, startY = 0, startT = 0, tracking = false, isHoriz = null;
  var innerEl = null, handoff = false, handoffStartX = 0, handoffStartT = 0;

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
    handoff = false; handoffStartX = 0; handoffStartT = 0;
    var t = e.target.closest ? e.target.closest('.hs-table-wrap') : null;
    innerEl = (t && t.scrollWidth > t.clientWidth) ? t : null;
  }, { passive: true });

  wrap.addEventListener('touchmove', function(e) {
    if (!tracking) return;
    var x = e.touches[0].clientX;
    var dx = x - startX;
    var dy = e.touches[0].clientY - startY;
    if (isHoriz === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHoriz = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHoriz || !innerEl || handoff) return;
    var atLeft  = innerEl.scrollLeft <= 0;
    var atRight = innerEl.scrollLeft >= innerEl.scrollWidth - innerEl.clientWidth - 1;
    if ((dx < 0 && atRight) || (dx > 0 && atLeft)) {
      // Tabel udah mentok ke arah yang sama kayak dorongan jari — mulai
      // "nyambung" jadi swipe-pindah-tab, threshold diukur ULANG dari titik
      // mentok ini (bukan dari touchstart awal), biar gak kepicu instan.
      handoff = true; handoffStartX = x; handoffStartT = Date.now();
    }
  }, { passive: true });

  wrap.addEventListener('touchend', function(e) {
    if (!tracking) return;
    tracking = false;
    if (!isHoriz) return;
    if (innerEl && !handoff) return; // murni scroll tabel, gak pernah mentok — jangan pindah tab
    var refX = handoff ? handoffStartX : startX;
    var refT = handoff ? handoffStartT : startT;
    var dx = e.changedTouches[0].clientX - refX;
    var dt = Date.now() - refT;
    var isFlick = Math.abs(dx) / Math.max(dt, 1) > 0.3;
    if (dx < -40 || (isFlick && dx < -20)) goRelative(1);
    else if (dx > 40 || (isFlick && dx > 20)) goRelative(-1);
  }, { passive: true });

  wrap.addEventListener('touchcancel', function() { tracking = false; isHoriz = null; innerEl = null; handoff = false; }, { passive: true });
})();

// ─── SUPPLIER CARDS (dipakai bareng tab Bon & Master) ─────────
function hsRenderSupplierCards() {
  var el = document.getElementById('hs-supplier-row');
  if (!el) return;

  // Overview = ringkasan lintas-supplier, gak butuh filter per-supplier di sini
  if (_hsView === 'overview') { el.innerHTML = ''; return; }
  // Tab Bon (Jurnal Re-Stock) & Master Barang pake hs-bon-switcher/hs-master-switcher
  // (total + kotak nama supplier swipeable), bukan row mini-card ini lagi — biar
  // gak numpuk 1 kartu per supplier tiap supplier baru ditambah. Kelola Supplier
  // punya list sendiri (hs-supplier-master-list), gak butuh filter row ini juga.
  if (_hsView === 'bon' || _hsView === 'master' || _hsView === 'supplier') { el.innerHTML = ''; return; }

  // Titik ini cuma kesisa tab Riwayat Bayar (overview/bon/master udah return
  // duluan di atas) — biarpun gitu tetep pake nama var payTotals dkk biar jelas.
  var payTotals = {};
  _hsPembayaranAll.forEach(function(p) {
    var bon = _hsBonList.find(function(b){ return b.id===p.bon_id; });
    if (!bon) return;
    payTotals[bon.supplier_id] = (payTotals[bon.supplier_id] || 0) + (p.nominal||0);
  });
  var payTotalSemua = Object.values(payTotals).reduce(function(s,v){ return s+v; }, 0);

  var html = '<div class="hs-sup-card' + (_hsFilterSupplier===null?' active':'') + '" onclick="hsSelectSupplierFilter(null)">' +
    '<div class="hs-sup-card-nama">Semua Supplier</div>' +
    '<div class="hs-sup-card-total" style="color:var(--ok)">' + fmtRpFull(payTotalSemua) + '</div>' +
    '<div class="hs-sup-card-sub">' + _hsPembayaranAll.length + ' total dibayar</div>' +
  '</div>';

  html += _hsSupplierList.map(function(s) {
    var jmlBayar = _hsPembayaranAll.filter(function(p){
      var bon = _hsBonList.find(function(b){ return b.id===p.bon_id; });
      return bon && bon.supplier_id===s.id;
    }).length;
    return '<div class="hs-sup-card' + (_hsFilterSupplier===s.id?' active':'') + '" onclick="hsSelectSupplierFilter(' + s.id + ')">' +
      '<div class="hs-sup-card-nama">' + _hsEsc(s.nama) + '</div>' +
      '<div class="hs-sup-card-total" style="color:var(--ok)">' + fmtRpFull(payTotals[s.id]||0) + '</div>' +
      '<div class="hs-sup-card-sub">' + jmlBayar + ' kali bayar</div>' +
    '</div>';
  }).join('');

  el.innerHTML = html;
}

// ─── SWITCHER SUPPLIER (tab Bon / Jurnal Re-Stock) ─────────────
// Ganti hs-supplier-row (mini-card) khusus buat tab ini: 1 kotak total +
// 1 kotak nama supplier yg bisa di-swipe (kiri/kanan) atau di-tap (buka
// dropdown list semua supplier). Urutan cycle: [Semua Supplier, ...supplier].
function hsRenderBonSwitcher() {
  var el = document.getElementById('hs-bon-switcher');
  if (!el) return;

  var sup = _hsFilterSupplier === null ? null : _hsSupplierList.find(function(s){ return s.id === _hsFilterSupplier; });
  var label = sup ? sup.nama : 'Semua Supplier';

  var relevantBons = sup
    ? _hsBonList.filter(function(b){ return b.supplier_id === sup.id; })
    : _hsBonList;
  var totalAktif = relevantBons
    .filter(function(b){ return b.status !== 'lunas'; })
    .reduce(function(s,b){ return s + _hsSisaBon(b).sisa; }, 0);

  el.innerHTML =
    '<div class="hs-bon-switcher-total">' + fmtRpFull(totalAktif) + '</div>' +
    '<div class="hs-bon-switcher-sup" id="hs-bon-switcher-sup" onclick="hsToggleSupplierDropdown(event)">' +
      '<span>' + _hsEsc(label) + '</span><i class="ti ti-chevron-down"></i>' +
      '<div class="hs-bon-switcher-dropdown" id="hs-bon-switcher-dropdown">' +
        '<button class="' + (_hsFilterSupplier===null?'active':'') + '" onclick="event.stopPropagation();hsSelectSupplierFilter(null);hsCloseSupplierDropdown()">Semua Supplier</button>' +
        _hsSupplierList.map(function(s) {
          return '<button class="' + (_hsFilterSupplier===s.id?'active':'') + '" onclick="event.stopPropagation();hsSelectSupplierFilter(' + s.id + ');hsCloseSupplierDropdown()">' + _hsEsc(s.nama) + '</button>';
        }).join('') +
      '</div>' +
    '</div>';

  var exportBtn = document.getElementById('hs-bon-export-btn');
  if (exportBtn) exportBtn.style.display = sup ? '' : 'none';
}

// ─── SWITCHER SUPPLIER (tab Master Barang) ─────────────────────
// Sama persis konsepnya kayak hsRenderBonSwitcher di atas (2 kotak tetap:
// [kotak Supplier switcher] + [kotak Total Barang]), GANTI dari hs-supplier-row
// (1 kartu per supplier) — kalau supplier terus nambah, row lama itu bakal
// numpuk kartu terus, gak scalable. 23 Agu 2026, poin 2.
function hsRenderMasterSwitcher() {
  var el = document.getElementById('hs-master-switcher');
  if (!el) return;

  var sup = _hsFilterSupplier === null ? null : _hsSupplierList.find(function(s){ return s.id === _hsFilterSupplier; });
  var label = sup ? sup.nama : 'Semua Supplier';
  var jmlBarang = sup
    ? _hsBarangMaster.filter(function(b){ return b.supplier_id === sup.id; }).length
    : _hsBarangMaster.length;

  el.innerHTML =
    '<div class="hs-bon-switcher-sup" id="hs-master-switcher-sup" onclick="hsToggleSupplierDropdown(event,\'master\')">' +
      '<span>' + _hsEsc(label) + '</span><i class="ti ti-chevron-down"></i>' +
      '<div class="hs-bon-switcher-dropdown" id="hs-master-switcher-dropdown">' +
        '<button class="' + (_hsFilterSupplier===null?'active':'') + '" onclick="event.stopPropagation();hsSelectSupplierFilter(null);hsCloseSupplierDropdown(\'master\')">Semua Supplier</button>' +
        _hsSupplierList.map(function(s) {
          return '<button class="' + (_hsFilterSupplier===s.id?'active':'') + '" onclick="event.stopPropagation();hsSelectSupplierFilter(' + s.id + ');hsCloseSupplierDropdown(\'master\')">' + _hsEsc(s.nama) + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="hs-bon-switcher-total" style="color:var(--ink)">' + jmlBarang + ' <span style="font-size:12px;font-weight:600;opacity:.7">barang</span></div>';
}

// prefix: 'bon' (default, switcher Jurnal Re-Stock) atau 'master' (switcher
// Master Barang) — dua-duanya reuse CSS/markup .hs-bon-switcher* yang sama,
// cuma beda id container aja.
function hsToggleSupplierDropdown(e, prefix) {
  prefix = prefix || 'bon';
  if (e) e.stopPropagation();
  var box = document.getElementById('hs-' + prefix + '-switcher-sup');
  var dd  = document.getElementById('hs-' + prefix + '-switcher-dropdown');
  if (!box || !dd) return;
  var open = dd.classList.toggle('open');
  box.classList.toggle('open', open);
}
function hsCloseSupplierDropdown(prefix) {
  prefix = prefix || 'bon';
  var box = document.getElementById('hs-' + prefix + '-switcher-sup');
  var dd  = document.getElementById('hs-' + prefix + '-switcher-dropdown');
  if (dd) dd.classList.remove('open');
  if (box) box.classList.remove('open');
}
document.addEventListener('click', function(e) {
  ['bon', 'master'].forEach(function(prefix) {
    var dd  = document.getElementById('hs-' + prefix + '-switcher-dropdown');
    var box = document.getElementById('hs-' + prefix + '-switcher-sup');
    if (!dd || !box) return;
    if (dd.classList.contains('open') && !box.contains(e.target)) hsCloseSupplierDropdown(prefix);
  });
});

// Cycle order: [null (Semua Supplier), ...supplier sesuai _hsSupplierList].
// Otomatis nyesuain kalau supplier nambah/berkurang, gak perlu ubah logic ini.
function hsCycleSupplierFilter(dir) {
  var order = [null].concat(_hsSupplierList.map(function(s){ return s.id; }));
  var idx = order.indexOf(_hsFilterSupplier);
  if (idx === -1) idx = 0;
  var next = (idx + dir + order.length) % order.length;
  hsSelectSupplierFilter(order[next]);
}

// Swipe di kotak nama supplier — event delegation di parent statis
// (#hs-bon-switcher / #hs-master-switcher, dua-duanya pake fungsi generik ini)
// karena innerHTML kotak ini di-render ulang tiap ganti filter. stopPropagation() di
// touchstart WAJIB biar gak bentrok/dobel-kepencet sama swipe global antar-panel
// (#hs-panels-wrap di bawah, yg pindah Overview/Bon/Riwayat Bayar/Master Barang) —
// begitu propagation diputus di titik ini, listener swipe global gak akan pernah
// tau ada sentuhan sama sekali (dia baru mulai "tracking" dari touchstart-nya sendiri).
function _hsInitSwitcherSwipe(prefix) {
  var parent = document.getElementById('hs-' + prefix + '-switcher');
  if (!parent) return;
  var boxSel = '#hs-' + prefix + '-switcher-sup';
  var startX = 0, startY = 0, startT = 0, tracking = false, isHoriz = null, swiped = false;

  parent.addEventListener('touchstart', function(e) {
    var box = e.target.closest(boxSel);
    if (!box) return;
    e.stopPropagation();
    startX = e.touches[0].clientX; startY = e.touches[0].clientY; startT = Date.now();
    tracking = true; isHoriz = null; swiped = false;
  }, { passive: true });

  parent.addEventListener('touchmove', function(e) {
    if (!tracking) return;
    e.stopPropagation();
    var dx = e.touches[0].clientX - startX;
    var dy = e.touches[0].clientY - startY;
    if (isHoriz === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHoriz = Math.abs(dx) > Math.abs(dy);
    }
  }, { passive: true });

  parent.addEventListener('touchend', function(e) {
    if (!tracking) return;
    tracking = false;
    e.stopPropagation();
    if (!isHoriz) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dt = Date.now() - startT;
    var isFlick = Math.abs(dx) / Math.max(dt, 1) > 0.3;
    if (dx < -30 || (isFlick && dx < -15)) { swiped = true; hsCycleSupplierFilter(1); }
    else if (dx > 30 || (isFlick && dx > 15)) { swiped = true; hsCycleSupplierFilter(-1); }
  }, { passive: true });

  parent.addEventListener('touchcancel', function() { tracking = false; isHoriz = null; }, { passive: true });

  // Tap buat buka dropdown — di-skip kalau sentuhan barusan adalah swipe (nge-geser
  // beneran), biar swipe gak ke-double sebagai "tap" juga.
  parent.addEventListener('click', function(e) {
    var box = e.target.closest(boxSel);
    if (!box) return;
    if (swiped) { swiped = false; e.stopPropagation(); e.preventDefault(); }
  }, true);
}
_hsInitSwitcherSwipe('bon');
_hsInitSwitcherSwipe('master');

function hsSelectSupplierFilter(id) {
  _hsFilterSupplier = id;
  hsRenderSupplierCards();
  hsRenderBonList();
  hsRenderMasterList();
  hsRenderPembayaranList();
}

// ─── EXPORT PDF: Jurnal Re-Stock per supplier ──────────────────
// GANTI TOTAL dari pola window.open(blob)+window.print() ke generate PDF
// asli pake jsPDF + autoTable. Root cause versi lama: window.open() dengan
// URL blob: + target _blank, di dalam PWA "display":"standalone" (lihat
// manifest.json), adalah known crash trigger di Android WebView — blob:
// URL cuma valid di proses yang bikin dia, sementara window.open coba
// lempar ke browsing context/proses lain → force close. Versi baru ini
// gak pernah buka context baru sama sekali: doc.save() cuma trigger
// download Blob di halaman yang sama, aman di semua Android/iOS.
function hsExportSupplierBonPDF(supplierId) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('Modul PDF belum siap (mungkin lagi offline pertama kali). Coba lagi sebentar.');
    return;
  }
  // Tunggu logo (dataURL) siap dulu — kalau fetch-nya udah kelar duluan
  // (biasanya gitu), .then() ini langsung jalan tanpa delay kerasa.
  // hsBuildAndDeliverBonPDF sekarang async (fetch rincian barang per bon
  // dulu ke Supabase), jadi .catch() dipasang biar error kepantau di
  // console alih-alih ilang diem-diem sebagai unhandled rejection.
  _hsLogoReady.then(function(logoDataUrl) {
    return hsBuildAndDeliverBonPDF(supplierId, logoDataUrl);
  }).catch(function(err) {
    console.error('Export PDF gagal:', err);
    alert('Gagal export PDF: ' + (err && err.message ? err.message : 'coba lagi.'));
  });
}

// Abu tua (bukan hitam pekat) buat header tabel — sesuai tema cream/ink
// notebook, tapi tetep kebaca kontras di atas putih.
var HS_PDF_ABU_TUA = [92, 88, 82];

async function hsBuildAndDeliverBonPDF(supplierId, logoDataUrl) {
  var sup = _hsSupplierList.find(function(s){ return s.id === supplierId; });
  var list = _hsBonList.filter(function(b){ return b.supplier_id === supplierId; })
    .slice().sort(function(a,b){ return new Date(a.tanggal) - new Date(b.tanggal); });

  // ── Ambil rincian barang (hutang_bon_item) tiap bon ──
  // Laporan sekarang per-BARANG (biar supplier ngerti persis apa yg
  // dikirim), bukan cuma per-transaksi kayak sebelumnya. Dikelompokin
  // per bon: 1 baris header abu-abu muda (tanggal · status · sisa),
  // di bawahnya baris tiap barang (No jalan terus/global, SKU Supplier,
  // Varian warna, Qty pcs, Harga/Lsn, Total per barang).
  var itemsByBon = {};
  for (var bi = 0; bi < list.length; bi++) {
    try {
      itemsByBon[list[bi].id] = await dbGet('hutang_bon_item', '&bon_id=eq.' + list[bi].id + '&order=id.asc');
    } catch (e) {
      itemsByBon[list[bi].id] = [];
    }
  }

  // ── Helper format tanggal untuk header grup di PDF ──
  // Contoh output: "Sabtu, 17 Agu 2026  ·  INV-0021"
  var bln = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var hariNm = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  function _fmtTglHeader(iso) {
    if (!iso) return '—';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return hariNm[d.getDay()] + ', ' +
      String(d.getDate()).padStart(2,'0') + ' ' + bln[d.getMonth()] + ' ' + d.getFullYear();
  }

  var totalSemua = 0, rowNo = 1;
  var body = [];
  // ── Tag setiap baris sebagai 'header_tgl' atau 'data' untuk willDrawCell ──
  // jsPDF autoTable tidak punya built-in "group header" row,
  // jadi kita tandai via meta array paralel: _bodyMeta[i] = tipe baris.
  var _bodyMeta = [];

  list.forEach(function(b) {
    totalSemua += b.total || 0;

    // ── Baris header tanggal per bon ──
    // Format: "Senin, 22 Agu 2026  ·  INV-0021" (no_nota opsional)
    var tglLabel = _fmtTglHeader(b.tanggal);
    if (b.no_nota) tglLabel += '  \u00b7  ' + b.no_nota;
    body.push([{ content: tglLabel, colSpan: 6,
      styles: { fontStyle: 'bold', fontSize: 10, textColor: [60, 56, 50] }
    }]);
    _bodyMeta.push('header_tgl');

    var items = itemsByBon[b.id] || [];
    if (!items.length) {
      body.push([{
        content: '\u2014 belum ada rincian barang \u2014', colSpan: 6,
        styles: { textColor: [150, 146, 140], fontStyle: 'italic', fontSize: 10 }
      }]);
      _bodyMeta.push('data');
    } else {
      items.forEach(function(it) {
        var qtyPcs = it.qty || 0;
        var hargaLsn = it.harga_satuan || 0;
        var subtotal = (it.subtotal != null) ? it.subtotal : Math.round(qtyPcs * (hargaLsn / 12));
        var skuSup = it.nama_supplier || it.nama_internal || '\u2014';
        var varian = it.varian_warna || '\u2014';
        body.push([String(rowNo++), skuSup, varian, String(qtyPcs), fmtRpFull(hargaLsn), fmtRpFull(subtotal)]);
        _bodyMeta.push('data');
      });
    }
  });
  if (!body.length) {
    body = [['\u2014', 'Belum ada bon.', '', '', '', '']];
    _bodyMeta.push('data');
  }

  var today = new Date();
  var hariNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var hariExport = hariNames[today.getDay()];
  var tglExportStr = String(today.getDate()).padStart(2,'0') + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + today.getFullYear();
  var namaSup = sup ? sup.nama : '\u2014';

  var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
  var pageW = doc.internal.pageSize.getWidth();
  var marginL = 40, marginR = 40;

  // ── Header: logo bulat ZENOOT di kiri, judul+tanggal di sebelahnya,
  // nama supplier gede di ujung kanan ──
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', marginL, 24, 32, 32); } catch(e) {}
  }
  var textX = logoDataUrl ? (marginL + 42) : marginL;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(HS_PDF_ABU_TUA[0], HS_PDF_ABU_TUA[1], HS_PDF_ABU_TUA[2]);
  doc.text('JURNAL RE-STOCK', textX, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 126, 120);
  doc.text(hariExport + ', ' + tglExportStr + '  \u00b7  ' + list.length + ' bon', textX, 51);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(30, 28, 26);
  doc.text(namaSup.toUpperCase(), pageW - marginR, 42, { align: 'right' });

  doc.setTextColor(0, 0, 0);

  var footRows = [[
    { content: 'TOTAL', colSpan: 5, styles: { halign: 'right' } },
    fmtRpFull(totalSemua)
  ]];
  doc.autoTable({
    startY: 76,
    head: [['No', 'SKU', 'Varian', 'Qty', 'Harga/Lsn', 'Total']],
    body: body,
    styles: { font: 'helvetica', fontSize: 11, cellPadding: 8, textColor: [20,20,20] },
    headStyles: { fillColor: HS_PDF_ABU_TUA, textColor: 255, fontStyle: 'bold', fontSize: 11 },
    columnStyles: {
      0: { cellWidth: 28 },
      3: { halign: 'right', cellWidth: 44 },
      4: { halign: 'right' },
      5: { halign: 'right' }
    },
    foot: footRows,
    footStyles: { fillColor: [244, 238, 227], textColor: [20,20,20], fontStyle: 'bold', fontSize: 11 },
    // ── Beri background abu muda pada baris header tanggal ──
    // _bodyMeta[row.index] = 'header_tgl' → fillColor abu sangat muda
    // agar setiap kelompok tanggal terlihat jelas sebagai divider.
    willDrawCell: function(data) {
      if (data.section === 'body' && _bodyMeta[data.row.index] === 'header_tgl') {
        data.doc.setFillColor(232, 228, 220); // krem abu muda, selaras tema notebook
      }
    },
  });

  var safeNama = namaSup.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  var fileName = 'jurnal-restock-' + safeNama + '-' + tglExportStr + '.pdf';

  // ── Delivery PDF: navigator.share() di SEMUA platform (bukan cuma iOS lagi) ──
  // Root cause update 30 Agu 2026: dulu Android di-skip dari navigator.share()
  // dengan asumsi "sering crash di WebView PWA". Ternyata itu ketinggalan zaman
  // — Cost Produksi udah pakai pola files-only (tanpa title) di SEMUA platform
  // dan kebukti JALAN di Android PWA standalone user (lihat histori chat, PDF
  // "SLIP BAYARAN KARYAWAN" berhasil terkirim ke WhatsApp, gak force-close).
  // Disamain ke sini biar hutang-supplier gak mesti download-manual+share-manual
  // (2 langkah) di Android, cukup 1 tap kayak iOS.
  if (navigator.canShare) {
    try {
      var pdfOutput = doc.output('arraybuffer');
      var pdfFile   = new File([pdfOutput], fileName, { type: 'application/pdf' });
      if (navigator.canShare({ files: [pdfFile] })) {
        // title SENGAJA dibuang — lihat catatan sama di cost-produksi.js
        // (cpDoExportJurnalPDFInner): title bikin sebagian target app
        // (Samsung Notes dkk) munculin dialog format tambahan, nambah klik.
        navigator.share({ files: [pdfFile] }).catch(function(err) {
          // User cancel atau share gagal → fallback ke doc.save()
          if (err && err.name !== 'AbortError') doc.save(fileName);
        });
        return; // share berhasil dimulai, tidak perlu doc.save()
      }
    } catch(e) {
      // Fallback jika File/canShare tidak tersedia
    }
  }
  // Fallback (device/browser tanpa Web Share API): doc.save() trigger
  // download Blob di halaman yang sama.
  doc.save(fileName);
}

// ─── BON LIST ─────────────────────────────────────────────────
function hsRenderBonList() {
  var el = document.getElementById('hs-bon-list');
  if (!el) return;

  hsRenderBonSwitcher();

  // Poin 4 (23 Agu 2026): Jurnal Re-Stock cuma nampilin bon yang BELUM lunas —
  // bon yang udah lunas tetep kesimpen di DB & keitung di Riwayat Bayar,
  // cuma gak numpuk di list ini lagi.
  var list = _hsBonList.filter(function(b) {
    return (_hsFilterSupplier === null || b.supplier_id === _hsFilterSupplier) && b.status !== 'lunas';
  });

  if (!list.length) {
    el.innerHTML = '<div class="hs-empty">' + (_hsFilterSupplier ? 'Semua bon dari supplier ini udah lunas.' : 'Semua bon udah lunas.') + '</div>';
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
    else if (b.is_po) { badgeCls = 'hs-badge-po'; badgeTxt = st.bayar > 0 ? 'PO · DP' : 'PO'; }
    else if (st.bayar > 0) { badgeCls = 'hs-badge-cicil'; badgeTxt = 'Dicicil'; }

    var donutColor = (badgeCls === 'hs-badge-lunas') ? 'var(--ok)' : (badgeCls === 'hs-badge-cicil' ? 'var(--warn)' : (badgeCls === 'hs-badge-po' ? 'var(--info)' : 'var(--danger)'));

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

// ─── MASTER BARANG LIST (tabel spreadsheet) ────────────────────
function hsRenderMasterList() {
  var el = document.getElementById('hs-master-list');
  if (!el) return;

  hsRenderMasterSwitcher();

  var list = _hsBarangMaster.filter(function(b) {
    return _hsFilterSupplier === null || b.supplier_id === _hsFilterSupplier;
  });

  // Master Barang di HP cuma buat LIAT — semua tambah/edit/hapus dihandle
  // di versi laptop, jadi tap-to-edit & long-press-edit dimatiin di sini.
  // Kolom yg dirender juga BEDA (bukan disembunyiin CSS): di HP thead+tbody
  // emang cuma dibikin 3 <td> (SKU Induk, Variant, HPP/Lusin) biar lebar
  // kebagi natural tanpa geser — di laptop tetep full 6 kolom.
  var isMobile = window.innerWidth <= 900;
  var theadRow = document.getElementById('hs-master-thead-row');
  if (theadRow) {
    theadRow.innerHTML = isMobile
      ? '<th>No</th><th>SKU Induk</th><th>Variant</th><th class="hs-table-num">HPP/Lusin</th>'
      : '<th>No</th><th>SKU Induk</th><th>Variant</th><th>SKU Supplier</th><th>Supplier</th><th class="hs-table-num">HPP/Lusin</th><th class="hs-table-num">HPP P.O/Lusin</th>';
  }

  if (!list.length) {
    var colspan = isMobile ? 4 : 7;
    el.innerHTML = '<tr><td colspan="' + colspan + '" class="hs-empty">Belum ada Master Barang' + (_hsFilterSupplier?' buat supplier ini':'') + '. Tap "+ Tambah Barang" buat mulai.</td></tr>';
    return;
  }

  el.innerHTML = list.map(function(b, i) {
    var supplier = _hsSupplierList.find(function(s){ return s.id===b.supplier_id; });
    var rowAttr = isMobile ? '' : ' onclick="hsOpenEditBarang(' + b.id + ')"';
    if (isMobile) {
      return '<tr data-id="' + b.id + '">' +
        '<td style="text-align:center">' + (i+1) + '</td>' +
        '<td>' + _hsEsc(b.katalog_produk) + '</td>' +
        '<td>' + _hsEsc(b.varian_warna || '—') + '</td>' +
        '<td class="hs-table-num">' + fmtRpFull(b.harga_per_lusin) + '</td>' +
      '</tr>';
    }
    return '<tr data-id="' + b.id + '"' + rowAttr + '>' +
      '<td>' + (i+1) + '</td>' +
      '<td>' + _hsEsc(b.katalog_produk) + '</td>' +
      '<td>' + _hsEsc(b.varian_warna || '—') + '</td>' +
      '<td>' + _hsEsc(b.nama_supplier || '—') + '</td>' +
      '<td>' + _hsEsc(supplier ? supplier.nama : '—') + '</td>' +
      '<td class="hs-table-num">' + fmtRpFull(b.harga_per_lusin) + '</td>' +
      '<td class="hs-table-num">' + (b.harga_po_per_lusin ? fmtRpFull(b.harga_po_per_lusin) : '—') + '</td>' +
    '</tr>';
  }).join('');

  if (!isMobile) {
    _hsInitLongPress('hs-master-list', function(id) { hsOpenEditBarang(parseInt(id,10)); });
  }
}

// ─── KELOLA SUPPLIER (nama + jenis Dropship/Reseller) ──────────
// Sumber picker supplier di seluruh modul Hutang Barang. Jenis dipake buat
// nentuin flow "Tambah Bon" (Dropship langsung, Reseller jadi PO dulu —
// lihat hsOnBonSupplierChange & hsSimpanBon).
function hsRenderSupplierMasterList() {
  var el = document.getElementById('hs-supplier-master-list');
  if (!el) return;

  if (!_hsSupplierList.length) {
    el.innerHTML = '<tr><td colspan="3" class="hs-empty">Belum ada Supplier. Tap "+ Tambah Supplier" buat mulai.</td></tr>';
    return;
  }

  el.innerHTML = _hsSupplierList.map(function(s) {
    var badges = '';
    if (s.is_dropship) badges += '<span class="hs-jenis-badge hs-jenis-dropship"><i class="ti ' + _HS_JENIS_LABEL.dropship.icon + '"></i> ' + _HS_JENIS_LABEL.dropship.label + '</span>';
    if (s.is_reseller) badges += ' <span class="hs-jenis-badge hs-jenis-reseller"><i class="ti ' + _HS_JENIS_LABEL.reseller.icon + '"></i> ' + _HS_JENIS_LABEL.reseller.label + '</span>';
    if (!badges) badges = '<span class="hs-leadtime-empty">—</span>';
    return '<tr data-id="' + s.id + '" onclick="hsOpenEditSupplierMaster(' + s.id + ')">' +
      '<td>' + _hsEsc(s.nama) + '</td>' +
      '<td>' + _hsLeadTimeLabel(s) + '</td>' +
      '<td>' + badges + '</td>' +
    '</tr>';
  }).join('');
}

// ─── LEAD TIME per supplier ─────────────────────────────────────
// Cuma relevan buat supplier yang punya jalur Reseller/PO (is_reseller,
// walau dropship-nya juga dicentang). Dropship-murni gak lewat PO, barang
// dateng hari itu juga jadi leadtime gak pernah dihitung (selalu "Sama
// hari"). Dihitung dari SEMUA histori bon yang udah pernah ditandai
// diterima (kolom tgl_diterima keisi), rata-rata (tgl_diterima - tanggal)
// dalam hari. Bon yang masih PO (belum ditandai diterima) gak ikut dihitung.
// 25 Agu 2026, poin 2.
function _hsLeadTimeForSupplier(supplierId) {
  var bons = _hsBonList.filter(function(b) {
    return b.supplier_id === supplierId && b.tgl_diterima && b.tanggal;
  });
  if (!bons.length) return null;
  var totalHari = bons.reduce(function(sum, b) {
    var mulai  = new Date(b.tanggal + 'T00:00:00');
    var selesai = new Date(b.tgl_diterima + 'T00:00:00');
    var hari = Math.round((selesai - mulai) / 86400000);
    return sum + Math.max(0, hari);
  }, 0);
  return { rataRata: Math.round(totalHari / bons.length), jumlahBon: bons.length };
}

function _hsLeadTimeLabel(s) {
  if (!s.is_reseller) return '<span class="hs-leadtime-empty">Sama hari</span>';
  var lt = _hsLeadTimeForSupplier(s.id);
  if (!lt) return '<span class="hs-leadtime-empty">Belum ada data</span>';
  return '<span class="hs-leadtime">' + lt.rataRata + ' hari</span>';
}

function hsOpenTambahSupplierMaster() {
  document.getElementById('hs-sup-form-title').textContent = 'Tambah Supplier';
  document.getElementById('hs-supm-id').value = '';
  document.getElementById('hs-supm-btn-hapus').style.display = 'none';
  document.getElementById('hs-supm-nama').value = '';
  document.getElementById('hs-supm-dropship').checked = true;
  document.getElementById('hs-supm-reseller').checked = false;
  document.getElementById('hs-sheet-supplier-master').classList.add('open');
}

function hsOpenEditSupplierMaster(id) {
  var s = _hsSupplierList.find(function(x){ return x.id===id; });
  if (!s) return;
  document.getElementById('hs-sup-form-title').textContent = 'Edit Supplier';
  document.getElementById('hs-supm-id').value = s.id;
  document.getElementById('hs-supm-btn-hapus').style.display = 'inline-flex';
  document.getElementById('hs-supm-nama').value = s.nama;
  document.getElementById('hs-supm-dropship').checked = !!s.is_dropship;
  document.getElementById('hs-supm-reseller').checked = !!s.is_reseller;
  document.getElementById('hs-sheet-supplier-master').classList.add('open');
}

async function hsSimpanSupplierMaster() {
  var id    = document.getElementById('hs-supm-id').value;
  var nama  = document.getElementById('hs-supm-nama').value.trim();
  var isDropship = document.getElementById('hs-supm-dropship').checked;
  var isReseller = document.getElementById('hs-supm-reseller').checked;

  if (!nama) { alert('Isi nama supplier!'); return; }
  if (!isDropship && !isReseller) { alert('Pilih minimal 1 sistem: Dropship dan/atau Reseller!'); return; }

  try {
    var data = { nama: nama.toUpperCase(), is_dropship: isDropship, is_reseller: isReseller };
    if (id) {
      await dbUpdate('hutang_supplier', id, data);
    } else {
      await dbInsert('hutang_supplier', data);
    }
    closeModal('hs-sheet-supplier-master');
    await loadHutangSupplier();
  } catch(e) {
    alert('Gagal simpan: ' + e.message);
  }
}

async function hsHapusSupplierMaster() {
  var id = document.getElementById('hs-supm-id').value;
  if (!id) return;
  if (!confirm('Hapus supplier ini? Bon/Master Barang yang udah pernah pakai supplier ini TIDAK ikut kehapus, tapi bakal nampilin "—" di kolom Supplier.')) return;
  try {
    await dbDelete('hutang_supplier', id);
    closeModal('hs-sheet-supplier-master');
    await loadHutangSupplier();
  } catch(e) {
    alert('Gagal hapus: ' + e.message);
  }
}

// ─── OVERVIEW ───────────────────────────────────────────────
function hsRenderOverview() {
  var el = document.getElementById('hs-overview-content');
  if (!el) return;

  var belumLunas = _hsBonList.filter(function(b){ return b.status !== 'lunas'; });
  var totalUtangAktif = belumLunas.reduce(function(s,b){ return s + _hsSisaBon(b).sisa; }, 0);

  var now = new Date();
  var ymBulanIni = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
  var dibayarBulanIni = _hsPembayaranAll
    .filter(function(p){ return p.tanggal && p.tanggal.slice(0,7) === ymBulanIni; })
    .reduce(function(s,p){ return s + (p.nominal||0); }, 0);

  var totalDibayarAllTime = _hsPembayaranAll.reduce(function(s,p){ return s + (p.nominal||0); }, 0);
  var totalNilaiSemuaBon  = _hsBonList.reduce(function(s,b){ return s + (b.total||0); }, 0);
  var pctLunasKeseluruhan = totalNilaiSemuaBon > 0 ? Math.round((totalDibayarAllTime/totalNilaiSemuaBon)*100) : 0;
  pctLunasKeseluruhan = Math.max(0, Math.min(100, pctLunasKeseluruhan));

  if (!_hsBonList.length) {
    el.innerHTML = '<div class="hs-empty">Belum ada data bon. Overview bakal keisi otomatis begitu ada Bon pertama.</div>';
    return;
  }

  // ── Minicards ──
  var html = '<div class="hs-ov-grid">' +
    '<div class="hs-ov-card">' +
      '<div class="hs-ov-donut" style="--pct:' + pctLunasKeseluruhan + ';--donut-color:var(--danger)"><span>' + pctLunasKeseluruhan + '%</span></div>' +
      '<div class="hs-ov-card-txt"><div class="hs-ov-card-label">Total Utang Aktif</div>' +
        '<div class="hs-ov-card-value hs-ov-danger">' + fmtRpFull(totalUtangAktif) + '</div></div>' +
    '</div>' +
    '<div class="hs-ov-card">' +
      '<div class="hs-ov-donut" style="--pct:100;--donut-color:var(--warn)"><span>' + belumLunas.length + '</span></div>' +
      '<div class="hs-ov-card-txt"><div class="hs-ov-card-label">Bon Belum Lunas</div>' +
        '<div class="hs-ov-card-value">' + belumLunas.length + ' bon</div></div>' +
    '</div>' +
    '<div class="hs-ov-card">' +
      '<div class="hs-ov-donut" style="--pct:100;--donut-color:var(--ok)"><span><i class="ti ti-cash" style="font-size:16px"></i></span></div>' +
      '<div class="hs-ov-card-txt"><div class="hs-ov-card-label">Dibayar Bulan Ini</div>' +
        '<div class="hs-ov-card-value hs-ov-ok">' + fmtRpFull(dibayarBulanIni) + '</div></div>' +
    '</div>' +
    '<div class="hs-ov-card">' +
      '<div class="hs-ov-donut" style="--pct:100;--donut-color:var(--info)"><span>' + _hsSupplierList.length + '</span></div>' +
      '<div class="hs-ov-card-txt"><div class="hs-ov-card-label">Supplier Aktif</div>' +
        '<div class="hs-ov-card-value">' + _hsSupplierList.length + ' supplier</div></div>' +
    '</div>' +
  '</div>';

  // ── Ranking utang terbesar per supplier ──
  var totalsSup = {};
  belumLunas.forEach(function(b) {
    totalsSup[b.supplier_id] = (totalsSup[b.supplier_id] || 0) + _hsSisaBon(b).sisa;
  });
  var ranked = Object.keys(totalsSup).map(function(sid) {
    var supplier = _hsSupplierList.find(function(s){ return String(s.id)===String(sid); });
    return { nama: supplier ? supplier.nama : '—', sisa: totalsSup[sid] };
  }).sort(function(a,b){ return b.sisa - a.sisa; }).slice(0, 5);
  var maxSisa = ranked.length ? ranked[0].sisa : 0;

  // ── Bon paling lama belum lunas (aging) — dihitung duluan (bukan di
  // tempat lama di bawah) biar length-nya kepake buat nentuin garis tebal ──
  var aging = belumLunas.slice().sort(function(a,b){ return new Date(a.tanggal) - new Date(b.tanggal); }).slice(0, 5);

  // Garis tebal cuma nongol kalau ADA section data di bawahnya (ranking dan/
  // atau aging) — kalau semua bon udah lunas (dua-duanya kosong), skip biar
  // gak ada garis nganggur tanpa isi di bawahnya.
  if (ranked.length || aging.length) {
    html += '<div class="hs-divider"></div>';
  }

  if (ranked.length) {
    html += '<div class="hs-ov-section-title">Utang Terbesar per Supplier</div>' +
      '<div class="hs-ov-list-wrap" style="background:var(--cream2);border:1px solid var(--ink4);border-radius:8px;padding:6px 14px;margin-bottom:18px">' +
      ranked.map(function(r) {
        var pct = maxSisa > 0 ? Math.round((r.sisa/maxSisa)*100) : 0;
        return '<div class="hs-ov-rank-row">' +
          '<div class="hs-ov-rank-nama">' + _hsEsc(r.nama) + '</div>' +
          '<div class="hs-ov-rank-bar-wrap"><div class="hs-ov-rank-bar" style="width:' + pct + '%"></div></div>' +
          '<div class="hs-ov-rank-val">' + fmtRpFull(r.sisa) + '</div>' +
        '</div>';
      }).join('') + '</div>';
  }

  if (aging.length) {
    html += '<div class="hs-ov-section-title">Bon Paling Lama Belum Lunas</div>' +
      '<div class="hs-ov-list-wrap" style="background:var(--cream2);border:1px solid var(--ink4);border-radius:8px;padding:6px 14px">' +
      aging.map(function(b) {
        var supplier = _hsSupplierList.find(function(s){ return s.id===b.supplier_id; });
        var hari = Math.floor((now - new Date(b.tanggal + 'T00:00:00')) / 86400000);
        var hariCls = hari >= 30 ? 'hs-ov-aging-merah' : (hari >= 14 ? 'hs-ov-aging-kuning' : '');
        return '<div class="hs-ov-aging-row" data-id="' + b.id + '" onclick="hsOpenDetailBon(' + b.id + ')" style="cursor:pointer">' +
          '<div class="hs-ov-aging-left"><span class="hs-ov-aging-nama">' + _hsEsc(supplier?supplier.nama:'—') + '</span> · ' + _hsFmtTgl(b.tanggal) + '</div>' +
          '<div class="hs-ov-aging-hari ' + hariCls + '">' + hari + ' hari</div>' +
        '</div>';
      }).join('') + '</div>';
  }

  el.innerHTML = html;
}

// ─── RIWAYAT BAYAR (jurnal pembayaran, lintas semua bon) ──────
function hsRenderPembayaranList() {
  var el = document.getElementById('hs-pembayaran-list');
  if (!el) return;

  var list = _hsPembayaranAll.filter(function(p) {
    if (_hsFilterSupplier === null) return true;
    var bon = _hsBonList.find(function(b){ return b.id===p.bon_id; });
    return bon && bon.supplier_id === _hsFilterSupplier;
  }).slice().sort(function(a,b){ return new Date(b.tanggal) - new Date(a.tanggal); });

  if (!list.length) {
    el.innerHTML = '<div class="hs-empty">Belum ada riwayat pembayaran' + (_hsFilterSupplier?' dari supplier ini':'') + '.</div>';
    return;
  }

  el.innerHTML = list.map(function(p) {
    var bon = _hsBonList.find(function(b){ return b.id===p.bon_id; });
    var supplier = bon ? _hsSupplierList.find(function(s){ return s.id===bon.supplier_id; }) : null;
    var akun = _hsAkunKas.find(function(a){ return a.id===p.kas_akun_id; });
    return '<div class="hs-pay-row-card" onclick="' + (bon ? 'hsOpenDetailBon(' + bon.id + ')' : '') + '" style="' + (bon?'cursor:pointer':'') + '">' +
      '<div class="hs-pay-row-icon"><i class="ti ti-cash"></i></div>' +
      '<div class="hs-pay-row-main">' +
        '<div class="hs-pay-row-sup">' + _hsEsc(supplier ? supplier.nama : '—') + (bon && bon.no_nota ? ' · ' + _hsEsc(bon.no_nota) : '') + '</div>' +
        '<div class="hs-pay-row-sub">' + _hsFmtTgl(p.tanggal) + (akun ? ' · ' + _hsEsc(akun.nama) : '') + (p.catatan ? ' · ' + _hsEsc(p.catatan) : '') + '</div>' +
      '</div>' +
      '<div class="hs-pay-row-nom">' + fmtRpFull(p.nominal) + '</div>' +
    '</div>';
  }).join('');
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

// ─── PICKER TERPUSAT: PILIH SUPPLIER ───────────────────────────
// Nge-drive select asli (hidden) yang tetep dipakai sama _hsResolveSupplierId
// dkk — picker ini cuma UI pengganti native <select> biar posisinya SELALU
// di tengah layar & ga kepotong, dipanggil dari trigger div (.hs-picker-trigger).
var _hsSupPickerCtx = null; // { selectId, triggerLabelId }

function hsSupPickerOpen(selectId, triggerLabelId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  _hsSupPickerCtx = { selectId: selectId, triggerLabelId: triggerLabelId };
  var searchEl = document.getElementById('hs-sup-picker-search');
  if (searchEl) searchEl.value = '';
  _hsSupPickerRender('', sel.value);
  var overlay = document.getElementById('hs-sup-picker-overlay');
  if (overlay) overlay.classList.add('open');
  setTimeout(function() { if (searchEl) searchEl.focus({ preventScroll: true }); }, 60);
}

function hsSupPickerClose() {
  var overlay = document.getElementById('hs-sup-picker-overlay');
  if (overlay) overlay.classList.remove('open');
  _hsSupPickerCtx = null;
}

function hsSupPickerFilter(q) {
  var sel = _hsSupPickerCtx ? document.getElementById(_hsSupPickerCtx.selectId) : null;
  _hsSupPickerRender(q, sel ? sel.value : '');
}

function _hsSupPickerRender(q, currentVal) {
  var listEl = document.getElementById('hs-sup-picker-list');
  if (!listEl) return;
  q = (q || '').toLowerCase().trim();
  var items = _hsSupplierList.filter(function(s) {
    return !q || s.nama.toLowerCase().indexOf(q) !== -1;
  });
  listEl.innerHTML = '';
  if (q && items.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'hs-picker-empty';
    empty.textContent = 'Tidak ada supplier yang cocok';
    listEl.appendChild(empty);
  }
  items.forEach(function(s) {
    var it = document.createElement('div');
    it.className = 'hs-picker-item' + (String(s.id) === String(currentVal) ? ' active' : '');
    it.textContent = s.nama;
    it.onclick = function() { hsSupPickerSelect(String(s.id), s.nama); };
    listEl.appendChild(it);
  });
  var itBaru = document.createElement('div');
  itBaru.className = 'hs-picker-item hs-picker-item-new';
  itBaru.innerHTML = '<i class="ti ti-plus"></i> Supplier baru...';
  itBaru.onclick = function() { hsSupPickerSelect('__baru__', '+ Supplier baru...'); };
  listEl.appendChild(itBaru);
}

function hsSupPickerSelect(val, label) {
  if (!_hsSupPickerCtx) return;
  var sel = document.getElementById(_hsSupPickerCtx.selectId);
  if (sel) {
    sel.value = val;
    if (typeof sel.onchange === 'function') sel.onchange();
  }
  var lblEl = document.getElementById(_hsSupPickerCtx.triggerLabelId);
  if (lblEl) {
    lblEl.textContent = label;
    lblEl.style.color = val ? 'var(--ink)' : 'var(--ink3)';
  }
  hsSupPickerClose();
}

// ─── PICKER BOTTOM SHEET: PILIH SUPPLIER (khusus Tambah/Edit Bon) ──
// Nge-drive select asli #hs-bon-supplier-select yg sekarang disembunyiin
// (display:none) — trigger button di form manggil hsBonSupPickerOpen(),
// picker ini naik dari bawah (pola BRImo) numpuk di atas sheet hs-sheet-bon.
function hsBonSupPickerOpen() {
  var sel = document.getElementById('hs-bon-supplier-select');
  if (!sel) return;
  var searchEl = document.getElementById('hs-bon-sup-picker-search');
  if (searchEl) searchEl.value = '';
  _hsBonSupPickerRender('', sel.value);
  hsOpenSheet('hs-bon-sup-picker-overlay');
  setTimeout(function() { if (searchEl) searchEl.focus({ preventScroll: true }); }, 260);
}

function hsBonSupPickerClose() {
  hsCloseSheet('hs-bon-sup-picker-overlay');
}

function hsBonSupPickerFilter(q) {
  var sel = document.getElementById('hs-bon-supplier-select');
  _hsBonSupPickerRender(q, sel ? sel.value : '');
}

function _hsBonSupPickerRender(q, currentVal) {
  var listEl = document.getElementById('hs-bon-sup-picker-list');
  if (!listEl) return;
  q = (q || '').toLowerCase().trim();
  var items = _hsSupplierList.filter(function(s) {
    return !q || s.nama.toLowerCase().indexOf(q) !== -1;
  });
  listEl.innerHTML = '';
  if (q && items.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'hs-picker-empty';
    empty.textContent = 'Tidak ada supplier yang cocok';
    listEl.appendChild(empty);
  }
  items.forEach(function(s) {
    var it = document.createElement('div');
    it.className = 'hs-picker-item' + (String(s.id) === String(currentVal) ? ' active' : '');
    it.textContent = s.nama;
    it.onclick = function() { hsBonSupPickerSelect(String(s.id), s.nama); };
    listEl.appendChild(it);
  });
  var itBaru = document.createElement('div');
  itBaru.className = 'hs-picker-item hs-picker-item-new';
  itBaru.innerHTML = '<i class="ti ti-plus"></i> Supplier baru...';
  itBaru.onclick = function() { hsBonSupPickerSelect('__baru__', '+ Supplier baru...'); };
  listEl.appendChild(itBaru);
}

function hsBonSupPickerSelect(val, label) {
  var sel = document.getElementById('hs-bon-supplier-select');
  if (sel) {
    sel.value = val;
    if (typeof sel.onchange === 'function') sel.onchange();
  }
  var lblEl = document.getElementById('hs-bon-supplier-trigger-label');
  if (lblEl) {
    lblEl.textContent = label;
    lblEl.style.color = val ? 'var(--ink)' : 'var(--ink3)';
  }
  hsBonSupPickerClose();
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
  _hsUpdateBonFormBySupplier();
}
function hsOnBonSupplierBaruInput() {
  // Supplier baru → belum ada id, treat sebagai null (semua baris jadi manual,
  // dan dianggap Dropship dulu — bisa diubah jenisnya belakangan di Kelola Supplier)
  if (_hsCurrentBonSupplierId !== null) {
    _hsCurrentBonSupplierId = null;
    _hsItemRows = [_hsBlankItemRow()];
    _hsRenderItemRows();
  }
  _hsUpdateBonFormBySupplier();
}

// Sesuain judul sheet + label tombol + hint, tergantung jenis supplier yang
// lagi dipilih (Dropship = Bon biasa, Reseller = PO). Dipanggil tiap supplier
// berubah DAN pas sheet baru dibuka (hsOpenTambahBon/hsOpenEditBon).
function _hsUpdateBonFormBySupplier() {
  // Sync label tombol trigger picker (dulu ini otomatis dari native <select>,
  // sekarang select-nya disembunyiin jadi label harus di-set manual tiap kali
  // state supplier berubah — termasuk pas sheet baru dibuka).
  var sel = document.getElementById('hs-bon-supplier-select');
  var trigLbl = document.getElementById('hs-bon-supplier-trigger-label');
  if (sel && trigLbl) {
    if (sel.value === '__baru__') {
      trigLbl.textContent = '+ Supplier baru...';
      trigLbl.style.color = 'var(--info)';
    } else {
      var selSup = _hsSupplierList.find(function(s){ return String(s.id) === String(sel.value); });
      trigLbl.textContent = selSup ? selSup.nama : '— Pilih Supplier —';
      trigLbl.style.color = selSup ? 'var(--ink)' : 'var(--ink3)';
    }
  }

  var supplier = _hsCurrentBonSupplierId
    ? _hsSupplierList.find(function(s){ return s.id === _hsCurrentBonSupplierId; })
    : null;
  var isPureReseller = !!(supplier && supplier.is_reseller && !supplier.is_dropship);
  var isDualMode     = !!(supplier && supplier.is_reseller && supplier.is_dropship);
  var isEdit = !!document.getElementById('hs-bon-id').value;
  var titleEl  = document.getElementById('hs-bon-form-title');
  var btnEl    = document.getElementById('hs-bon-btn-simpan');
  var hintEl   = document.getElementById('hs-bon-jenis-hint');
  var modeWrap = document.getElementById('hs-bon-mode-wrap');

  if (isPureReseller) {
    // Reseller murni, gak ada dropship (H SOLAH-case) — otomatis full-PO, toggle disembunyiin.
    _hsCurrentBonMode = 'po';
    if (modeWrap) modeWrap.style.display = 'none';
    titleEl.textContent = isEdit ? 'Edit PO' : 'Tambah PO';
    if (btnEl) btnEl.textContent = 'Simpan PO';
    if (hintEl) hintEl.innerHTML = '<i class="ti ti-file-invoice"></i> Supplier <b>Reseller</b> — otomatis jadi PO (badge "PO" di tab Bon). Tetap kehitung di Total Utang Aktif dari sekarang, uang muka tinggal dicatet lewat "Bayar Utang" kayak cicilan biasa. Begitu barang beneran sampai, tandai "Barang Diterima" di detail PO-nya.';
  } else if (isDualMode) {
    // Dropship + Reseller dua-duanya dicentang (RH-case) — toggle nongol, harga & hint ikut mode aktif.
    if (modeWrap) modeWrap.style.display = 'block';
    titleEl.textContent = isEdit ? 'Edit Bon' : 'Tambah Bon';
    if (btnEl) btnEl.textContent = _hsCurrentBonMode === 'po' ? 'Simpan PO' : 'Simpan';
    if (hintEl) hintEl.innerHTML = _hsCurrentBonMode === 'po'
      ? '<i class="ti ti-file-invoice"></i> Mode <b>P.O</b> — harga lebih murah, tapi barang belum di tangan. Tandai "Barang Diterima" nanti pas barang dateng.'
      : '<i class="ti ti-truck-delivery"></i> Mode <b>Dropship</b> — harga normal, barang langsung dianggap diterima.';
  } else {
    // Dropship biasa (atau supplier baru/belum keisi) — gak berubah dari sebelumnya.
    _hsCurrentBonMode = 'dropship';
    if (modeWrap) modeWrap.style.display = 'none';
    titleEl.textContent = isEdit ? 'Edit Bon' : 'Tambah Bon';
    if (btnEl) btnEl.textContent = 'Simpan';
    if (hintEl) hintEl.innerHTML = '';
  }
}

// Toggle Dropship/PO di form Bon (cuma nongol buat supplier dual-mode).
// Sama kayak ganti supplier: kalau udah ada baris keisi, konfirmasi dulu
// sebelum reset — soalnya harga per mode beda (dropship vs PO).
function hsOnBonModeChange() {
  var modeEl = document.querySelector('input[name="hs-bon-mode"]:checked');
  var newMode = modeEl ? modeEl.value : 'dropship';
  if (newMode === _hsCurrentBonMode) return;
  var hasFilledRows = _hsItemRows.some(function(r){ return r.barang_id; });
  if (hasFilledRows && !confirm('Ganti mode beli bakal reset baris barang yang udah diisi (harga beda per mode). Lanjut?')) {
    var prevEl = document.querySelector('input[name="hs-bon-mode"][value="' + _hsCurrentBonMode + '"]');
    if (prevEl) prevEl.checked = true;
    return;
  }
  _hsCurrentBonMode = newMode;
  _hsItemRows = [_hsBlankItemRow()];
  _hsRenderItemRows();
  _hsUpdateBonFormBySupplier();
}

function _hsBlankItemRow() {
  return { barang_id: null, katalog_produk: '', varian_warna: '', nama_supplier: '', nama_internal: '', qty: 1, harga_per_lusin: 0 };
}

function hsOpenTambahBon() {
  document.getElementById('hs-bon-form-title').textContent = 'Tambah Bon';
  document.getElementById('hs-bon-id').value = '';
  document.getElementById('hs-bon-btn-hapus').style.display = 'none';
  _hsPopulateSupplierSelect('hs-bon-supplier-select');
  var presetSup = (_hsFilterSupplier !== null)
    ? _hsSupplierList.find(function(s){ return s.id === _hsFilterSupplier; })
    : _hsSupplierList[0];
  document.getElementById('hs-bon-supplier-select').value = presetSup ? presetSup.id : '__baru__';
  document.getElementById('hs-bon-supplier-baru').value = '';
  document.getElementById('hs-bon-supplier-baru').style.display = presetSup ? 'none' : 'block';
  _hsCurrentBonSupplierId = presetSup ? presetSup.id : null;
  _hsCurrentBonMode = 'dropship';
  var modeDropshipEl = document.querySelector('input[name="hs-bon-mode"][value="dropship"]');
  if (modeDropshipEl) modeDropshipEl.checked = true;
  document.getElementById('hs-bon-tanggal').value = new Date().toISOString().slice(0,10);
  document.getElementById('hs-bon-no-nota').value = '';
  _hsItemRows = [_hsBlankItemRow()];
  _hsRenderItemRows();
  _hsUpdateBonFormBySupplier();
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
  _hsCurrentBonMode = b.mode_beli === 'po' ? 'po' : 'dropship';
  var modeEl = document.querySelector('input[name="hs-bon-mode"][value="' + _hsCurrentBonMode + '"]');
  if (modeEl) modeEl.checked = true;
  document.getElementById('hs-bon-tanggal').value = b.tanggal;
  document.getElementById('hs-bon-no-nota').value = b.no_nota || '';

  try {
    var items = await dbGet('hutang_bon_item', '&bon_id=eq.' + b.id + '&order=id.asc');
    _hsItemRows = (items && items.length) ? items.map(function(it) {
      var master = it.barang_id ? _hsBarangMaster.find(function(m){ return m.id===it.barang_id; }) : null;
      // Qty lama kemungkinan disimpen dalam satuan lusin (data sebelum redesign) —
      // konversi ke pcs biar konsisten sama form baru yg qty-nya selalu pcs.
      var qtyPcs = it.satuan === 'lusin' ? (it.qty || 0) * 12 : (it.qty || 1);
      return {
        barang_id: master ? it.barang_id : null,
        katalog_produk: it.nama_internal || '',
        varian_warna: it.varian_warna || '',
        nama_supplier: it.nama_supplier || '',
        nama_internal: it.nama_internal || '',
        qty: qtyPcs,
        harga_per_lusin: it.harga_satuan || 0,
      };
    }) : [_hsBlankItemRow()];
  } catch(e) {
    _hsItemRows = [_hsBlankItemRow()];
  }
  _hsRenderItemRows();
  _hsUpdateBonFormBySupplier();
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

// Qty selalu dalam PCS. Harga master disimpen per-lusin, jadi harga/pcs =
// harga_per_lusin/12 (1 lusin = 12 pcs) — dihitung otomatis, gak bisa diketik.
function _hsHargaPerPcs(row) { return (row.harga_per_lusin || 0) / 12; }
function _hsRowSubtotal(row) { return (row.qty || 0) * _hsHargaPerPcs(row); }

function _hsRenderItemRows() {
  var wrap = document.getElementById('hs-item-rows');
  if (!wrap) return;

  var masterOptions = _hsBarangMaster.filter(function(m) {
    if (String(m.supplier_id) !== String(_hsCurrentBonSupplierId)) return false;
    if (_hsCurrentBonMode === 'po' && !m.harga_po_per_lusin) return false;
    return true;
  });
  var emptyHint = document.getElementById('hs-item-empty-hint');
  if (emptyHint) emptyHint.style.display = (_hsCurrentBonSupplierId && !masterOptions.length) ? 'block' : 'none';

  wrap.innerHTML = _hsItemRows.map(function(row, idx) {
    var label = row.barang_id
      ? (row.katalog_produk + (row.varian_warna ? ' — ' + row.varian_warna : ''))
      : '';
    var triggerLabel = label || '— pilih barang —';

    return '<div class="hs-item-row">' +
      '<div class="hs-picker-trigger" onclick="hsBrgPickerOpen(' + idx + ')"><span>' + _hsEsc(triggerLabel) + '</span><i class="ti ti-chevron-down"></i></div>' +
      '<input type="number" class="hs-item-qty" min="0" step="1" value="' + (row.qty||'') + '" id="hs-item-qty-' + idx + '" oninput="_hsItemRowUpdate(' + idx + ')">' +
      '<button class="hs-item-remove" onclick="hsRemoveItemRow(' + idx + ')"><i class="ti ti-trash"></i></button>' +
    '</div>';
  }).join('');

  _hsUpdateTotalDisplay();
}

// ─── PICKER TERPUSAT: PILIH BARANG (baris item Tambah Bon) ─────
// Selalu dari Master Barang milik supplier yg lagi dipilih di bon — gak ada
// jalur "manual" lagi, biar gak ada barang siluman yg gak ke-tracking stok/harganya.
var _hsBrgPickerCtx = null; // { idx }

function hsBrgPickerOpen(idx) {
  _hsBrgPickerCtx = { idx: idx };
  var searchEl = document.getElementById('hs-brg-picker-search');
  if (searchEl) searchEl.value = '';
  _hsBrgPickerRender('');
  var overlay = document.getElementById('hs-brg-picker-overlay');
  if (overlay) overlay.classList.add('open');
  setTimeout(function() { if (searchEl) searchEl.focus({ preventScroll: true }); }, 60);
}

function hsBrgPickerClose() {
  var overlay = document.getElementById('hs-brg-picker-overlay');
  if (overlay) overlay.classList.remove('open');
  _hsBrgPickerCtx = null;
}

function hsBrgPickerFilter(q) {
  _hsBrgPickerRender(q);
}

function _hsBrgPickerRender(q) {
  var listEl = document.getElementById('hs-brg-picker-list');
  if (!listEl) return;
  q = (q || '').toLowerCase().trim();
  var row = _hsBrgPickerCtx ? _hsItemRows[_hsBrgPickerCtx.idx] : null;
  // CATATAN 5 Sep 2026: sempat dicoba tetep nampilin item PO-mode yang
  // Harga PO-nya belum diisi (ditandai warning), tapi kebanyakan tag warning
  // numpuk bikin list berantakan/jelek kalau banyak varian belum keisi
  // sekaligus. Balik ke filter ketat: item PO-mode tanpa Harga PO gak
  // muncul di sini. Isi Harga PO-nya lewat Master Barang.
  var masterOptions = _hsBarangMaster.filter(function(m) {
    if (String(m.supplier_id) !== String(_hsCurrentBonSupplierId)) return false;
    if (_hsCurrentBonMode === 'po' && !m.harga_po_per_lusin) return false;
    return true;
  });
  var items = masterOptions.filter(function(m) {
    var label = (m.katalog_produk + ' ' + (m.varian_warna||'') + ' ' + (m.nama_supplier||'')).toLowerCase();
    return !q || label.indexOf(q) !== -1;
  });
  listEl.innerHTML = '';
  if (!items.length) {
    var empty = document.createElement('div');
    empty.className = 'hs-picker-empty';
    empty.textContent = q ? 'Tidak ada barang yang cocok' : (_hsCurrentBonMode === 'po' ? 'Belum ada barang dengan Harga PO untuk supplier ini' : 'Belum ada Master Barang untuk supplier ini');
    listEl.appendChild(empty);
    return;
  }
  items.forEach(function(m) {
    var it = document.createElement('div');
    it.className = 'hs-picker-item' + (row && String(row.barang_id) === String(m.id) ? ' active' : '');
    it.textContent = m.katalog_produk + (m.varian_warna ? ' — ' + m.varian_warna : '');
    it.onclick = function() { hsBrgPickerSelect(m.id); };
    listEl.appendChild(it);
  });
}

function hsBrgPickerSelect(id) {
  if (!_hsBrgPickerCtx) return;
  var row = _hsItemRows[_hsBrgPickerCtx.idx];
  var m = _hsBarangMaster.find(function(x){ return x.id === id; });
  if (row && m) {
    row.barang_id = m.id;
    row.katalog_produk = m.katalog_produk;
    row.varian_warna   = m.varian_warna || '';
    row.nama_supplier  = m.nama_supplier || '';
    row.nama_internal  = m.katalog_produk;
    row.harga_per_lusin = (_hsCurrentBonMode === 'po' ? m.harga_po_per_lusin : m.harga_per_lusin) || 0;
    if (!row.qty) row.qty = 12; // default 1 lusin ekuivalen pcs, biar gak 0
  }
  hsBrgPickerClose();
  _hsRenderItemRows();
}

function _hsItemRowUpdate(idx) {
  var row = _hsItemRows[idx];
  if (!row) return;
  row.qty = parseFloat((document.getElementById('hs-item-qty-' + idx) || {}).value) || 0;
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

  if (!tanggal) { alert('Tanggal bon wajib diisi!'); return; }

  var validItems = _hsItemRows.filter(function(r){ return r.barang_id && r.qty > 0 && r.harga_per_lusin > 0; });
  if (!validItems.length) { alert('Pilih minimal 1 barang dari Master Barang, isi qty-nya!'); return; }

  var total = validItems.reduce(function(s,r){ return s + _hsRowSubtotal(r); }, 0);

  try {
    var supplierId  = await _hsResolveSupplierId('hs-bon-supplier-select', 'hs-bon-supplier-baru');
    var supplierObj = _hsSupplierList.find(function(s){ return s.id === supplierId; });
    var isPureReseller = !!(supplierObj && supplierObj.is_reseller && !supplierObj.is_dropship);
    var isDualMode     = !!(supplierObj && supplierObj.is_reseller && supplierObj.is_dropship);
    // mode_beli: reseller murni selalu 'po'; supplier dual-mode ikut toggle aktif;
    // dropship biasa selalu 'dropship'.
    var modeBeli = isPureReseller ? 'po' : (isDualMode ? _hsCurrentBonMode : 'dropship');

    var bonData = {
      supplier_id: supplierId,
      tanggal:     tanggal,
      no_nota:     noNota,
      total:       Math.round(total),
      mode_beli:   modeBeli,
    };

    var bonId;
    if (id) {
      // Edit: is_po SENGAJA nggak diikutin di sini — status PO/diterima cuma
      // diubah lewat tombol "Tandai Barang Diterima" (hsTandaiBarangDiterima),
      // bukan keubah otomatis pas edit qty/harga/dsb.
      await dbUpdate('hutang_bon', id, bonData);
      bonId = id;
      var oldItems = await dbGet('hutang_bon_item', '&bon_id=eq.' + id);
      for (var i=0;i<oldItems.length;i++) { await dbDelete('hutang_bon_item', oldItems[i].id); }
    } else {
      bonData.status = 'belum_lunas';
      bonData.is_po  = (modeBeli === 'po'); // PO (reseller ATAU dropship mode-PO) = belum diterima, butuh "Tandai Diterima"
      var newBon = await dbInsert('hutang_bon', bonData);
      bonId = newBon[0].id;
    }

    for (var j=0;j<validItems.length;j++) {
      var r = validItems[j];
      await dbInsert('hutang_bon_item', {
        bon_id: bonId,
        barang_id: r.barang_id,
        nama_internal: r.katalog_produk || r.nama_internal || null,
        nama_supplier: r.nama_supplier || null,
        varian_warna: r.varian_warna || null,
        qty: r.qty,
        satuan: 'pcs',
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

  var poBanner = document.getElementById('hs-detail-po-banner');
  if (poBanner) poBanner.style.display = b.is_po ? 'block' : 'none';

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

// Reseller PO → begitu barang beneran sampai, tandai di sini. Bon-nya TETAP
// jalan seperti biasa (udah kehitung di Total Utang Aktif sejak PO dibuat),
// cuma badge-nya balik normal (Belum Lunas/Dicicil/Lunas) — bukan "PO" lagi.
async function hsTandaiBarangDiterima() {
  var bonId = _hsCurrentBonId;
  if (!bonId) return;
  try {
    // tgl_diterima dicatet SEKALI di sini — satu-satunya sumber data buat
    // hitung Lead Time supplier (lihat _hsLeadTimeForSupplier). Kalau
    // ditandai diterima lebih dari sekali (harusnya gak mungkin, tombolnya
    // ilang begitu is_po jadi false), tanggal PERTAMA yang kepakai gak akan
    // ketiban timpa krn kolom cuma diisi kalau masih null — aman.
    var tglDiterima = new Date().toISOString().slice(0,10);
    await dbUpdate('hutang_bon', bonId, { is_po: false, tgl_diterima: tglDiterima });
    var b = _hsBonList.find(function(x){ return x.id===bonId; });
    if (b) { b.is_po = false; b.tgl_diterima = tglDiterima; }
    document.getElementById('hs-detail-po-banner').style.display = 'none';
    hsRenderBonList();
    hsRenderSupplierMasterList();
  } catch(e) {
    alert('Gagal update: ' + e.message);
  }
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
      keterangan: 'Bayar hutang barang' + (catatan ? ' — ' + catatan : ''),
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

// ─── BAYAR UTANG (tombol toolbar Bon) ──────────────────────────
// Alur (dikonfirmasi user 23 Agu 2026): kalau lagi "Semua Supplier" → buka
// picker pilih 1 bon dulu, lanjut ke sheet Detail Bon yang udah ada (bayar
// per-bon). Kalau udah difilter ke 1 supplier → langsung buka sheet Bayar
// Gabungan (1 nominal, dialokasikan otomatis ke bon-bon supplier itu FIFO).
function hsOpenBayarUtang() {
  if (_hsFilterSupplier === null) {
    hsBonBayarPickerOpen();
  } else {
    hsOpenBayarGabungan(_hsFilterSupplier);
  }
}

// ─── PICKER: PILIH BON (Bayar Utang, mode Semua Supplier) ─────
// Level 1 = grup per supplier (+ per sistem P.O/Dropship kalau dual-mode &
// emang ada bon belum lunas di dua-duanya). Level 2 (drill-in) = list bon
// mentah di grup itu dengan kotak centang, user pilih mana yang mau dibayar
// bareng, lalu lanjut ke sheet Bayar Gabungan (FIFO cuma di antara yg dicentang).
var _hsBonBayarPickerGroup   = null; // {supplierId, mode} kalau lagi di level 2, null = level 1
var _hsBonBayarPickerChecked = {};   // {bonId: true} state centang di level 2
var _hsBonBayarPickerItems   = {};   // {bonId: [hutang_bon_item, ...]} — rincian SKU per bon, di-fetch pas drill-in ke grup

function hsBonBayarPickerOpen() {
  _hsBonBayarPickerGroup = null;
  _hsBonBayarPickerChecked = {};
  document.getElementById('hs-bon-bayar-picker-search').value = '';
  document.getElementById('hs-bon-bayar-picker-overlay').classList.add('open');
  _hsBonBayarPickerRenderGroups('');
}
function hsBonBayarPickerClose() {
  document.getElementById('hs-bon-bayar-picker-overlay').classList.remove('open');
}
function hsBonBayarPickerFilter(q) {
  if (_hsBonBayarPickerGroup) _hsBonBayarPickerRenderDetail(q);
  else _hsBonBayarPickerRenderGroups(q);
}
function hsBonBayarPickerBack() {
  _hsBonBayarPickerGroup = null;
  _hsBonBayarPickerChecked = {};
  document.getElementById('hs-bon-bayar-picker-search').value = '';
  _hsBonBayarPickerRenderGroups('');
}

function _hsBonBayarMode(b) { return b.mode_beli === 'po' ? 'po' : 'dropship'; }

function _hsBonBayarPickerRenderGroups(q) {
  document.getElementById('hs-bon-bayar-picker-back').style.display = 'none';
  document.getElementById('hs-bon-bayar-picker-title-text').textContent = 'Pilih Bon yang Mau Dibayar';
  document.getElementById('hs-bon-bayar-picker-footer').style.display = 'none';
  document.getElementById('hs-bon-bayar-picker-search').placeholder = 'Cari supplier / no nota...';

  var listEl = document.getElementById('hs-bon-bayar-picker-list');
  if (!listEl) return;
  q = (q || '').toLowerCase().trim();
  var belumLunas = _hsBonList.filter(function(b){ return b.status !== 'lunas'; });

  // Kelompokin per supplier + sistem (mode_beli).
  var groupsMap = {};
  belumLunas.forEach(function(b) {
    var mode = _hsBonBayarMode(b);
    var key = b.supplier_id + '|' + mode;
    if (!groupsMap[key]) groupsMap[key] = { supplierId: b.supplier_id, mode: mode, bons: [] };
    groupsMap[key].bons.push(b);
  });
  var groups = Object.keys(groupsMap).map(function(k){ return groupsMap[k]; });

  // Supplier yang cuma punya bon di 1 sistem → gak usah dilabelin nama sistem.
  var modeCountBySupplier = {};
  groups.forEach(function(g) {
    modeCountBySupplier[g.supplierId] = (modeCountBySupplier[g.supplierId] || 0) + 1;
  });

  groups.sort(function(a, b) {
    var da = Math.min.apply(null, a.bons.map(function(x){ return new Date(x.tanggal).getTime(); }));
    var db = Math.min.apply(null, b.bons.map(function(x){ return new Date(x.tanggal).getTime(); }));
    return da - db;
  });

  var items = groups.filter(function(g) {
    if (!q) return true;
    var supplier = _hsSupplierList.find(function(s){ return s.id===g.supplierId; });
    var supNama = (supplier ? supplier.nama : '').toLowerCase();
    if (supNama.indexOf(q) !== -1) return true;
    return g.bons.some(function(b){ return (b.no_nota||'').toLowerCase().indexOf(q) !== -1; });
  });

  listEl.innerHTML = '';
  if (!items.length) {
    var empty = document.createElement('div');
    empty.className = 'hs-picker-empty';
    empty.textContent = q ? 'Tidak ada bon yang cocok' : 'Semua bon udah lunas \ud83c\udf89';
    listEl.appendChild(empty);
    return;
  }
  items.forEach(function(g) {
    var supplier = _hsSupplierList.find(function(s){ return s.id===g.supplierId; });
    var totalSisa = g.bons.reduce(function(s,b){ return s + _hsSisaBon(b).sisa; }, 0);
    var showModeLabel = modeCountBySupplier[g.supplierId] > 1;
    var label = (supplier ? supplier.nama : '\u2014') + (showModeLabel ? ' \u00b7 Sistem ' + (g.mode === 'po' ? 'P.O' : 'Dropship') : '');
    var it = document.createElement('div');
    it.className = 'hs-picker-item';
    it.innerHTML = '<div style="font-weight:700">' + _hsEsc(label) + '</div>' +
      '<div style="font-size:11.5px;color:var(--ink3);margin-top:2px">' + g.bons.length + ' bon \u00b7 Sisa ' + fmtRpFull(totalSisa) + '</div>';
    it.onclick = function() { hsBonBayarPickerOpenGroup(g.supplierId, g.mode); };
    listEl.appendChild(it);
  });
}

async function hsBonBayarPickerOpenGroup(supplierId, mode) {
  _hsBonBayarPickerGroup = { supplierId: supplierId, mode: mode };
  _hsBonBayarPickerChecked = {};
  var bons = _hsBonList.filter(function(b) {
    return b.supplier_id === supplierId && b.status !== 'lunas' && _hsBonBayarMode(b) === mode;
  });
  bons.forEach(function(b) { _hsBonBayarPickerChecked[b.id] = true; }); // default semua dicentang
  document.getElementById('hs-bon-bayar-picker-search').value = '';

  // Rincian SKU per bon (buat ditampilin di list) — fetch batch 1x query,
  // bukan per-bon, biar gak lambat kalau bonnya banyak.
  var listEl = document.getElementById('hs-bon-bayar-picker-list');
  if (listEl) listEl.innerHTML = '<div class="hs-picker-empty">Memuat rincian barang...</div>';
  try {
    var ids = bons.map(function(b){ return b.id; });
    var itemRows = ids.length ? await dbGet('hutang_bon_item', '&bon_id=in.(' + ids.join(',') + ')&order=id.asc') : [];
    _hsBonBayarPickerItems = {};
    itemRows.forEach(function(it) {
      if (!_hsBonBayarPickerItems[it.bon_id]) _hsBonBayarPickerItems[it.bon_id] = [];
      _hsBonBayarPickerItems[it.bon_id].push(it);
    });
  } catch (e) {
    _hsBonBayarPickerItems = {};
  }
  _hsBonBayarPickerRenderDetail('');
}

function _hsBonBayarPickerRenderDetail(q) {
  var g = _hsBonBayarPickerGroup;
  if (!g) return;
  var supplier  = _hsSupplierList.find(function(s){ return s.id===g.supplierId; });
  var modeCount = _hsBonList.filter(function(b){ return b.supplier_id===g.supplierId && b.status!=='lunas'; })
    .reduce(function(set,b){ set[_hsBonBayarMode(b)] = true; return set; }, {});
  var showModeLabel = Object.keys(modeCount).length > 1;
  var modeLabel = g.mode === 'po' ? 'Sistem P.O' : 'Sistem Dropship';

  document.getElementById('hs-bon-bayar-picker-back').style.display = 'inline-flex';
  document.getElementById('hs-bon-bayar-picker-title-text').textContent = (supplier ? supplier.nama : '\u2014') + (showModeLabel ? ' \u00b7 ' + modeLabel : '');
  document.getElementById('hs-bon-bayar-picker-search').placeholder = 'Cari no nota...';

  var bons = _hsBonList.filter(function(b) {
    return b.supplier_id === g.supplierId && b.status !== 'lunas' && _hsBonBayarMode(b) === g.mode;
  }).slice().sort(function(a,b){ return new Date(a.tanggal) - new Date(b.tanggal); });

  q = (q || '').toLowerCase().trim();
  var items = bons.filter(function(b) {
    return !q || (b.no_nota||'').toLowerCase().indexOf(q) !== -1;
  });

  var listEl = document.getElementById('hs-bon-bayar-picker-list');
  listEl.innerHTML = '';
  if (!items.length) {
    var empty = document.createElement('div');
    empty.className = 'hs-picker-empty';
    empty.textContent = 'Tidak ada bon yang cocok';
    listEl.appendChild(empty);
  }
  items.forEach(function(b) {
    var st = _hsSisaBon(b);
    var checked = !!_hsBonBayarPickerChecked[b.id];
    var barangItems = _hsBonBayarPickerItems[b.id] || [];
    var rincianHtml = '';
    if (barangItems.length) {
      var rincianText = barangItems.map(function(it) {
        return (it.nama_internal || '?') + (it.varian_warna ? ' (' + it.varian_warna + ')' : '') + ' \u00d7' + it.qty;
      }).join(', ');
      rincianHtml = '<div style="font-size:11px;color:var(--ink3);margin-top:2px;line-height:1.4">' + _hsEsc(rincianText) + '</div>';
    }
    var it = document.createElement('label');
    it.className = 'hs-picker-item';
    it.style.display = 'flex';
    it.style.gap = '10px';
    it.style.alignItems = 'flex-start';
    it.innerHTML =
      '<input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="hsBonBayarPickerToggle(' + b.id + ', this.checked)" style="flex:none;width:18px;height:18px;accent-color:var(--ink);margin-top:2px">' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:700">' + _hsFmtTgl(b.tanggal) + (b.no_nota ? ' \u00b7 ' + _hsEsc(b.no_nota) : '') + '</div>' +
        rincianHtml +
        '<div style="font-size:11.5px;color:var(--ink3);margin-top:2px">Sisa ' + fmtRpFull(st.sisa) + '</div>' +
      '</div>';
    listEl.appendChild(it);
  });

  _hsBonBayarPickerUpdateFooter();
}

function hsBonBayarPickerToggle(bonId, checked) {
  if (checked) _hsBonBayarPickerChecked[bonId] = true;
  else delete _hsBonBayarPickerChecked[bonId];
  _hsBonBayarPickerUpdateFooter();
}

function _hsBonBayarPickerUpdateFooter() {
  var footer = document.getElementById('hs-bon-bayar-picker-footer');
  var btn    = document.getElementById('hs-bon-bayar-picker-confirm-btn');
  if (!footer || !btn) return;
  footer.style.display = _hsBonBayarPickerGroup ? 'block' : 'none';
  var ids = Object.keys(_hsBonBayarPickerChecked);
  var total = ids.reduce(function(sum, id) {
    var b = _hsBonList.find(function(x){ return String(x.id) === String(id); });
    return sum + (b ? _hsSisaBon(b).sisa : 0);
  }, 0);
  btn.disabled = ids.length === 0;
  btn.textContent = ids.length ? ('Bayar ' + ids.length + ' Bon \u00b7 ' + fmtRpFull(total)) : 'Pilih minimal 1 bon';
}

function hsBonBayarPickerConfirm() {
  var g = _hsBonBayarPickerGroup;
  if (!g) return;
  var ids = Object.keys(_hsBonBayarPickerChecked).map(function(x){ return parseInt(x, 10); });
  if (!ids.length) return;
  hsBonBayarPickerClose();
  hsOpenBayarGabungan(g.supplierId, ids);
}

// ─── SHEET: BAYAR UTANG GABUNGAN (1 supplier, multi-bon FIFO) ──
// bonIds (opsional): kalau diisi (dari drill-in checkbox di picker "Pilih
// Bon"), FIFO cuma jalan di antara bon-bon yg dicentang itu — bukan semua
// bon belum lunas milik supplier. Kalau kosong/gak dikasih, balik ke
// perilaku lama: semua bon belum lunas milik supplier (dipanggil dari
// tombol "Bayar Utang" pas view udah difilter ke 1 supplier).
function hsOpenBayarGabungan(supplierId, bonIds) {
  _hsBayarGabSupplierId = supplierId;
  _hsBayarGabBonIds = (bonIds && bonIds.length) ? bonIds : null;
  var supplier = _hsSupplierList.find(function(s){ return s.id===supplierId; });
  var bons = (_hsBayarGabBonIds
      ? _hsBonList.filter(function(b){ return _hsBayarGabBonIds.indexOf(b.id) !== -1 && b.status!=='lunas'; })
      : _hsBonList.filter(function(b){ return b.supplier_id===supplierId && b.status!=='lunas'; })
    ).slice().sort(function(a,b){ return new Date(a.tanggal) - new Date(b.tanggal); });
  var totalSisa = bons.reduce(function(s,b){ return s + _hsSisaBon(b).sisa; }, 0);

  document.getElementById('hs-bayar-gab-title').textContent = 'Bayar Utang — ' + (supplier?supplier.nama:'');
  document.getElementById('hs-bayar-gab-total').textContent = 'Sisa ' + fmtRpFull(totalSisa);
  document.getElementById('hs-bayar-gab-sub').textContent = _hsBayarGabBonIds ? (bons.length + ' bon dipilih') : (bons.length + ' bon belum lunas');

  var listEl = document.getElementById('hs-bayar-gab-list');
  listEl.innerHTML = bons.length ? bons.map(function(b) {
    var st = _hsSisaBon(b);
    return '<div class="hs-detail-item-row">' +
      '<div><div class="hs-detail-item-nama">' + _hsFmtTgl(b.tanggal) + '</div>' +
      (b.no_nota ? '<div class="hs-detail-item-nama-sup">' + _hsEsc(b.no_nota) + '</div>' : '') + '</div>' +
      '<div class="hs-detail-item-sub">' + fmtRpFull(st.sisa) + '</div>' +
    '</div>';
  }).join('') : '<div class="hs-empty" style="padding:10px 0">Supplier ini nggak ada bon belum lunas.</div>';

  _hsPopulateAkunSelect('hs-bayar-gab-akun-debit', function(a) {
    return a.kelompok === 'beban' || a.kelompok === 'kewajiban';
  });
  _hsPopulateAkunSelect('hs-bayar-gab-akun-kredit', function(a) {
    return a.kelompok === 'aset' && (a.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
  });
  document.getElementById('hs-bayar-gab-nominal').value = totalSisa > 0 ? totalSisa.toLocaleString('id-ID') : '';
  idrInput('hs-bayar-gab-nominal');
  document.getElementById('hs-bayar-gab-tanggal').value = new Date().toISOString().slice(0,10);
  document.getElementById('hs-bayar-gab-catatan').value = '';

  hsOpenSheet('hs-sheet-bayar-gab');
}

async function hsSimpanBayarGabungan() {
  var supplierId = _hsBayarGabSupplierId;
  if (!supplierId) return;
  var bons = (_hsBayarGabBonIds
      ? _hsBonList.filter(function(b){ return _hsBayarGabBonIds.indexOf(b.id) !== -1 && b.status!=='lunas'; })
      : _hsBonList.filter(function(b){ return b.supplier_id===supplierId && b.status!=='lunas'; })
    ).slice().sort(function(a,b){ return new Date(a.tanggal) - new Date(b.tanggal); });

  var nominal = idrVal('hs-bayar-gab-nominal');
  var tanggal = document.getElementById('hs-bayar-gab-tanggal').value;
  var akunD   = document.getElementById('hs-bayar-gab-akun-debit').value;
  var akunK   = document.getElementById('hs-bayar-gab-akun-kredit').value;
  var catatan = document.getElementById('hs-bayar-gab-catatan').value.trim() || null;

  if (!tanggal)  { alert('Tanggal wajib diisi!'); return; }
  if (!nominal)  { alert('Nominal wajib diisi!'); return; }
  if (!akunD)    { alert('Pilih akun Debit (Hutang/Beban)!'); return; }
  if (!akunK)    { alert('Pilih akun Kas/Bank sumber bayar!'); return; }
  if (!bons.length) { alert('Supplier ini nggak ada bon belum lunas.'); return; }

  var totalSisa = bons.reduce(function(s,b){ return s + _hsSisaBon(b).sisa; }, 0);
  if (nominal > totalSisa + 1) {
    if (!confirm('Nominal (' + fmtRpFull(nominal) + ') lebih besar dari total sisa hutang supplier ini (' + fmtRpFull(totalSisa) + '). Lanjut tetap? (Kelebihannya nggak dialokasikan ke mana-mana)')) return;
  }

  try {
    var sisaNominal = nominal;
    for (var i = 0; i < bons.length && sisaNominal > 0; i++) {
      var b = bons[i];
      var st = _hsSisaBon(b);
      if (st.sisa <= 0) continue;
      var bagian = Math.min(sisaNominal, st.sisa);

      await dbInsert('hutang_pembayaran', {
        bon_id: b.id,
        tanggal: tanggal,
        nominal: bagian,
        kas_akun_id: akunK,
        catatan: catatan,
      });
      await dbInsert('jurnal', {
        tanggal: tanggal,
        keterangan: 'Bayar hutang barang (gabungan)' + (catatan ? ' — ' + catatan : ''),
        referensi: b.no_nota || null,
        tipe: 'keluar',
        akun_debit_id: akunD,
        akun_kredit_id: akunK,
        nominal: bagian,
        debit: bagian,
        kredit: bagian,
      });
      if (bagian >= st.sisa) {
        await dbUpdate('hutang_bon', b.id, { status: 'lunas' });
      }
      sisaNominal -= bagian;
    }

    hsCloseSheet('hs-sheet-bayar-gab');
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

// Harga Dropship cuma relevan/wajib buat barang di bawah supplier yang
// is_dropship=true. Harga P.O cuma relevan/wajib buat supplier yang
// is_reseller=true. Supplier bisa dua-duanya (RH-case, dua field wajib),
// atau cuma salah satu (dropship biasa / H SOLAH-case).
function _hsBrgUpdateHargaFieldVisibility() {
  var sel = document.getElementById('hs-brg-supplier-select');
  var supplier = sel ? _hsSupplierList.find(function(s){ return String(s.id) === String(sel.value); }) : null;
  // Supplier baru (belum ada di list, lagi diketik namanya) dianggap dropship
  // default — konsisten sama default kolom is_dropship di database.
  var showDropship = !supplier || !!supplier.is_dropship;
  var showPo       = !!(supplier && supplier.is_reseller);
  var dsWrap = document.getElementById('hs-brg-harga-dropship-wrap');
  var poWrap = document.getElementById('hs-brg-harga-po-wrap');
  if (dsWrap) dsWrap.style.display = showDropship ? 'block' : 'none';
  if (poWrap) poWrap.style.display = showPo ? 'block' : 'none';
  return { showDropship: showDropship, showPo: showPo };
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
    _hsBrgUpdateHargaFieldVisibility();
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
  document.getElementById('hs-brg-harga-po').value = '';
  idrInput('hs-brg-harga-po');
  _hsBrgUpdateHargaFieldVisibility();
  document.getElementById('hs-sheet-barang').classList.add('open');
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
  _hsSyncPasteSupplierTrigger();

  document.getElementById('hs-sheet-paste-barang').classList.add('open');
  setTimeout(function() { document.getElementById('hs-paste-area').focus(); }, 100);
}

// Sinkronin label trigger picker sesuai <select> hidden yang lagi aktif
// (dipanggil pas buka sheet & tiap kali pilihan berubah lewat picker).
function _hsSyncPasteSupplierTrigger() {
  var sel = document.getElementById('hs-paste-supplier-select');
  var lblEl = document.getElementById('hs-paste-supplier-trigger-label');
  if (!sel || !lblEl) return;
  if (sel.value === '__baru__') {
    lblEl.textContent = '+ Supplier baru...';
    lblEl.style.color = 'var(--ink)';
  } else {
    var s = _hsSupplierList.find(function(x) { return String(x.id) === String(sel.value); });
    lblEl.textContent = s ? s.nama : '— Pilih Supplier —';
    lblEl.style.color = s ? 'var(--ink)' : 'var(--ink3)';
  }
}

function hsOnPasteSupplierSelectChange() {
  var sel = document.getElementById('hs-paste-supplier-select');
  document.getElementById('hs-paste-supplier-baru').style.display = sel.value === '__baru__' ? 'block' : 'none';
  _hsSyncPasteSupplierTrigger();
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

    var katalog, varian, skuSup, supNamaRaw, harga, hargaPo;
    if (cols.length >= 6) {
      // 6 kolom: SKU Induk → Varian → SKU Suplier → Suplier → HPP/Lsn → HPP PO/Lsn
      katalog    = (cols[0] || '').toUpperCase();
      varian     = (cols[1] || '').trim();
      skuSup     = (cols[2] || '').trim();
      supNamaRaw = (cols[3] || '').trim();
      harga      = parseInt((cols[4] || '').replace(/[^0-9]/g,''), 10) || 0;
      hargaPo    = parseInt((cols[5] || '').replace(/[^0-9]/g,''), 10) || null;
    } else if (cols.length >= 5) {
      // 5 kolom: SKU Induk → Varian → SKU Suplier → Suplier → HPP/Lsn (tanpa HPP PO)
      katalog    = (cols[0] || '').toUpperCase();
      varian     = (cols[1] || '').trim();
      skuSup     = (cols[2] || '').trim();
      supNamaRaw = (cols[3] || '').trim();
      harga      = parseInt((cols[4] || '').replace(/[^0-9]/g,''), 10) || 0;
      hargaPo    = null;
    } else {
      // Fallback 4 kolom lama: SKU Induk → Varian → SKU Suplier → HPP/Lsn
      // (ga ada kolom Suplier per baris → pakai Supplier default di atas)
      katalog    = (cols[0] || '').toUpperCase();
      varian     = (cols[1] || '').trim();
      skuSup     = (cols[2] || '').trim();
      supNamaRaw = '';
      harga      = parseInt((cols[3] || '').replace(/[^0-9]/g,''), 10) || 0;
      hargaPo    = null;
    }

    if (!katalog) return;

    var row = {
      katalog_produk: katalog,
      varian_warna: varian || null,
      nama_supplier: skuSup || null, // "nama versi supplier" a.k.a SKU Suplier
      harga_per_lusin: harga,
      harga_po_per_lusin: hargaPo,
      dikenal: _hsKatalogList.indexOf(katalog) !== -1,
      supplier_id: null,
      supplier_nama: null,
      supplier_new: false,
      use_default_supplier: true
    };

    if (supNamaRaw) {
      var match = _hsSupplierList.find(function(s) {
        return s.nama.toLowerCase() === supNamaRaw.toLowerCase();
      });
      row.use_default_supplier = false;
      if (match) {
        row.supplier_id = match.id;
        row.supplier_nama = match.nama;
      } else {
        row.supplier_nama = supNamaRaw.toUpperCase();
        row.supplier_new = true;
      }
    }

    _hsParsedBarang.push(row);
  });

  if (_hsParsedBarang.length === 0) {
    alert('Tidak ada data yang bisa dibaca. Pastikan copy dari Excel dengan format: SKU Induk → Varian → SKU Suplier → Suplier → Harga per Lusin → Harga PO per Lusin (opsional)');
    return;
  }

  var jumlahAsing = _hsParsedBarang.filter(function(r){ return !r.dikenal; }).length;
  document.getElementById('hs-paste-count').textContent =
    '✓ ' + _hsParsedBarang.length + ' baris siap diimport' +
    (jumlahAsing ? ' — ⚠ ' + jumlahAsing + ' SKU Induk belum ada di Kelola Produk' : '');
  document.getElementById('hs-paste-tbody').innerHTML = _hsParsedBarang.map(function(r) {
    var supCell;
    if (r.use_default_supplier) supCell = '<span style="color:var(--ink3)">(default)</span>';
    else if (r.supplier_new)    supCell = '<span style="color:var(--info)">' + _hsEsc(r.supplier_nama) + ' (baru)</span>';
    else                        supCell = _hsEsc(r.supplier_nama);
    return '<tr' + (r.dikenal ? '' : ' style="color:var(--warn)"') + '>' +
      '<td>' + _hsEsc(r.katalog_produk) + (r.dikenal ? '' : ' ⚠') + '</td>' +
      '<td>' + _hsEsc(r.varian_warna||'—') + '</td>' +
      '<td>' + _hsEsc(r.nama_supplier||'—') + '</td>' +
      '<td>' + supCell + '</td>' +
      '<td>Rp' + r.harga_per_lusin.toLocaleString('id-ID') + '</td>' +
      '<td>' + (r.harga_po_per_lusin ? 'Rp' + r.harga_po_per_lusin.toLocaleString('id-ID') : '<span style="color:var(--ink3)">—</span>') + '</td>' +
      '</tr>';
  }).join('');
  document.getElementById('hs-paste-preview').style.display = 'block';
  document.getElementById('hs-btn-simpan-paste-barang').style.display = 'inline-flex';
}

async function hsSimpanPasteBarang() {
  if (_hsParsedBarang.length === 0) return;
  var btn = document.getElementById('hs-btn-simpan-paste-barang');

  // Supplier default (dari picker atas) cuma di-resolve KALAU beneran ada
  // baris yang butuh — jadi baris dengan Suplier per-baris sendiri ga
  // ketahan gara-gara input "supplier baru" default kosong (bug lama).
  var defaultSupplierId = null;
  var defaultResolved = false;
  async function resolveDefault() {
    if (!defaultResolved) {
      defaultSupplierId = await _hsResolveSupplierId('hs-paste-supplier-select', 'hs-paste-supplier-baru');
      defaultResolved = true;
    }
    return defaultSupplierId;
  }

  // Cache supplier baru yang dibikin dalam batch ini (biar nama sama ga
  // ke-insert dobel kalau muncul di beberapa baris).
  var newSupplierCache = {};
  async function resolveRowSupplier(r) {
    if (r.use_default_supplier) return await resolveDefault();
    if (r.supplier_id) return r.supplier_id;
    if (r.supplier_new) {
      var key = r.supplier_nama.toUpperCase();
      if (newSupplierCache[key]) return newSupplierCache[key];
      var newSup = await dbInsert('hutang_supplier', { nama: key });
      var id = newSup[0].id;
      newSupplierCache[key] = id;
      _hsSupplierList.push({ id: id, nama: key });
      return id;
    }
    return await resolveDefault();
  }

  try {
    btn.disabled = true;
    var ok = 0;
    for (var i = 0; i < _hsParsedBarang.length; i++) {
      var r = _hsParsedBarang[i];
      var supplierId = await resolveRowSupplier(r);
      await dbInsert('hutang_barang', {
        supplier_id: supplierId,
        katalog_produk: r.katalog_produk,
        varian_warna: r.varian_warna,
        nama_supplier: r.nama_supplier,
        harga_per_lusin: r.harga_per_lusin,
        harga_po_per_lusin: r.harga_po_per_lusin
      });
      ok++;
      btn.textContent = 'Menyimpan ' + ok + '/' + _hsParsedBarang.length + '...';
    }
    closeModal('hs-sheet-paste-barang');
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
    _hsBrgUpdateHargaFieldVisibility();
  };
  _hsPopulateKatalogSelect();
  document.getElementById('hs-brg-katalog').value = b.katalog_produk;
  document.getElementById('hs-brg-nama-supplier').value = b.nama_supplier || '';
  document.getElementById('hs-brg-varian').value = b.varian_warna || '';
  document.getElementById('hs-brg-harga').value = b.harga_per_lusin ? b.harga_per_lusin.toLocaleString('id-ID') : '';
  idrInput('hs-brg-harga');
  document.getElementById('hs-brg-harga-po').value = b.harga_po_per_lusin ? b.harga_po_per_lusin.toLocaleString('id-ID') : '';
  idrInput('hs-brg-harga-po');
  _hsBrgUpdateHargaFieldVisibility();
  document.getElementById('hs-sheet-barang').classList.add('open');
}

async function hsSimpanBarang() {
  var id       = document.getElementById('hs-brg-id').value;
  var katalog  = document.getElementById('hs-brg-katalog').value;
  var namaSup  = document.getElementById('hs-brg-nama-supplier').value.trim() || null;
  var varian   = document.getElementById('hs-brg-varian').value.trim() || null;
  var vis      = _hsBrgUpdateHargaFieldVisibility();
  var harga    = vis.showDropship ? idrVal('hs-brg-harga') : null;
  var hargaPo  = vis.showPo ? idrVal('hs-brg-harga-po') : null;

  if (!katalog) { alert('Pilih SKU Induk!'); return; }
  if (vis.showDropship && !harga) { alert('Isi Harga Dropship per Lusin!'); return; }
  if (vis.showPo && !hargaPo) { alert('Supplier ini punya sistem P.O — isi Harga P.O per Lusin!'); return; }

  try {
    var supplierId = await _hsResolveSupplierId('hs-brg-supplier-select', 'hs-brg-supplier-baru');

    var data = {
      supplier_id: supplierId,
      katalog_produk: katalog,
      nama_supplier: namaSup,
      varian_warna: varian,
      harga_per_lusin: harga,
      harga_po_per_lusin: hargaPo,
    };

    if (id) { await dbUpdate('hutang_barang', id, data); }
    else    { await dbInsert('hutang_barang', data); }

    closeModal('hs-sheet-barang');
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
    closeModal('hs-sheet-barang');
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

// ─── AUTO-INIT ────────────────────────────────────────────────
// Dua lapis, pola sama persis kayak gadag.js — biar gak blank:
// 1. Event listener — navigasi normal (user klik menu "Hutang Barang" di
//    sidebar setelah script ini udah ke-load).
// 2. Fallback langsung — kalau #page-hutang-supplier UDAH aktif saat script
//    ini selesai load (race condition: user klik menu duluan sebelum file
//    ini selesai di-fetch dari network/SW cache → event zenot:page udah
//    fired duluan, listener di bawah belum sempet ke-daftar → tanpa fallback
//    ini, datanya blank selamanya sampe user refresh manual).
// SEBELUM FIX INI: modul gak punya hook sama sekali → loadHutangSupplier()
// cuma kepanggil dari tombol refresh manual atau abis simpan data — itu
// kenapa "Master Barang ngga ada, refresh baru muncul".
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page === 'hutang-supplier') setTimeout(loadHutangSupplier, 50);
});
if (document.body.dataset.page === 'hutang-supplier') {
  setTimeout(loadHutangSupplier, 100);
}

// ── LAPIS KE-3 (poin 3, 24 Agu 2026): resume dari background ──
// 2 lapis di atas cuma nge-cover "navigasi/load script" — gak ada satupun
// yang nge-trigger pas app di-CLOSE (background) lalu DIBUKA LAGI tanpa
// full reload (kejadian umum di PWA standalone: OS nge-suspend WebView-nya,
// bukan matiin proses). Kalau user lagi mantengin tab Riwayat Bayar terus
// nutup app, state JS (termasuk _hsPembayaranAll) diem aja di kondisi
// terakhir — gak ada yang refetch, jadi keliatan "kosong"/nggak update
// sampe di-refresh manual. Fix: dengerin 'visibilitychange' (Android) dan
// 'pageshow' persisted/bfcache (iOS Safari) — begitu app balik ke depan
// DAN halaman aktifnya emang hutang-supplier, refetch otomatis. Pola ini
// udah dipake di networth.js buat kasus yang sama persis.
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible' && document.body.dataset.page === 'hutang-supplier') {
    loadHutangSupplier();
  }
});
window.addEventListener('pageshow', function(e) {
  if (e.persisted && document.body.dataset.page === 'hutang-supplier') {
    loadHutangSupplier();
  }
});
