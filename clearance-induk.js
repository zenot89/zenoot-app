// ─── MODAL-INDUK.JS — Modal per SKU Induk ─────────────────────
// Agregasi dari data yang sama dengan Clearance Monitor (clearance.js),
// tapi digabung per KATALOG (SKU induk), bukan per SKU varian.
// Dipicu dari tombol "Modal per SKU Induk" di header Clearance Monitor.
//
// 3 Okt 2026 — REDESIGN master-detail (request user): tiap kolom (Clearance &
// Kandidat Flash Sale) sekarang punya 2 blok dgn tampilan IDENTIK:
//   Blok 1 = daftar SKU INDUK (Qty & Modal digabung)
//   Blok 2 = SKU VARIASI dari induk yang diklik (Qty, Modal, Supplier [+Status])
//            dgn ringkasan besar di kanan: "6 varian · 40 pcs · Rp1.640.000"
// Kedua kolom lebar sama (50/50), render lewat 1 fungsi (_miRenderSide) supaya
// tampilannya gak bisa beda lagi.
//
// 3 Okt 2026 — TAMPILAN HP (<768px) dirombak, LAPTOP/TABLET TIDAK BERUBAH (request user):
//   minicard = carousel swipe loop + dot; Clearance & Flash Sale = 2 panel swipe (+ tab penanda);
//   tabel induk 3 kolom tanpa scroll horizontal; ketuk SKU induk → bottom-sheet variasi (tutup: tombol X).
//   REVISI HEADER HP (3 Okt 2026, request user): dropdown panjang "Semua SKU" + tombol Urutkan + tombol ↓↑ DIHAPUS →
//   header HP = judul + [tombol Pilih SKU (bottom-sheet)] + [Detail per SKU].
//   Semua CSS HP ada di @media (max-width:767px) di <style> atas; JS HP: blok "TAMPILAN HP" (_miIsPhone,
//   miSheetOpen/Close, _miSwipe). Swipe engine di sini SENGAJA salinan sendiri (aturan: gak share fungsi antar modul).

document.getElementById('page-clearance-induk').innerHTML = `
  <style>
    #mi-split-wrap > .mi-col {
      -webkit-flex: 1 1 0; flex: 1 1 0; min-width: 0; min-height: 0;
      display: -webkit-flex; display: flex; -webkit-flex-direction: column; flex-direction: column;
      background: var(--cream2); border-radius: 10px; box-shadow: var(--card-shadow); overflow: hidden;
    }
    .mi-col-title {
      -webkit-flex-shrink: 0; flex-shrink: 0; display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
      padding: 13px 16px 11px; font-weight: 700; font-size: 14px; color: var(--ink2);
      border-bottom: 1px solid var(--ovl-0_06);
    }
    .mi-col-title .mi-col-sub { font-weight: 400; font-size: 12px; color: var(--ink3); white-space: nowrap; }
    .mi-blk { min-height: 0; overflow: auto; overscroll-behavior: none; scrollbar-width: thin; scrollbar-color: var(--ink4) transparent; }
    .mi-blk::-webkit-scrollbar { width: 7px; height: 7px; }
    .mi-blk::-webkit-scrollbar-track { background: transparent; }
    .mi-blk::-webkit-scrollbar-thumb { background: var(--ink4); border-radius: 4px; }
    /* 3 Okt 2026 (revisi 2): pola halaman Channel — MASTER di kiri, DETAIL di kanan, berdampingan
       di dalam tiap kolom. Daftar induk & variasi sama-sama setinggi kolom, jadi gak ada lagi
       rebutan tinggi antar blok. */
    .mi-pane-row { -webkit-flex: 1 1 0; flex: 1 1 0; min-height: 0; display: -webkit-flex; display: flex; flex-direction: row; }
    .mi-blk-induk { -webkit-flex: 0 0 42%; flex: 0 0 42%; min-width: 0; border-right: 1px solid var(--ovl-0_06); }
    .mi-pane-var  { -webkit-flex: 1 1 0; flex: 1 1 0; min-width: 0; min-height: 0; display: -webkit-flex; display: flex; flex-direction: column; }
    .mi-blk-var   { -webkit-flex: 1 1 0; flex: 1 1 0; min-height: 0; }
    /* 3 Okt 2026 (revisi 3): 3 minicard SEJAJAR 1 baris (dulu kartu ke-3 turun ke baris 2 karena
       3×(33.3%−7px)+2 gap melebihi 100%) + dipadatkan → area tabel lebih tinggi */
    #page-clearance-induk #mi-metrics-strip { -webkit-flex-wrap: nowrap; flex-wrap: nowrap; gap: 12px; padding: 10px 20px; }
    #page-clearance-induk .mi-metric { -webkit-flex: 1 1 0; flex: 1 1 0; min-width: 0; padding: 9px 14px; }
    @media (max-width: 700px) {
      #page-clearance-induk #mi-metrics-strip { -webkit-flex-wrap: wrap; flex-wrap: wrap; }
      #page-clearance-induk .mi-metric { -webkit-flex: 1 1 calc(50% - 6px); flex: 1 1 calc(50% - 6px); min-width: 140px; }
    }
    .mi-col .tbl { width: 100%; }
    .mi-col .tbl th {
      padding: 10px 12px; font-size: 11px; letter-spacing: .08em; color: var(--ink3);
      position: sticky; top: 0; z-index: 3; background: var(--cream3); box-shadow: none;
      border-bottom: 1px solid var(--ovl-0_06); border-radius: 0; white-space: nowrap;
    }
    .mi-col .tbl td {
      padding: 10px 12px; font-size: 13.5px; font-variant-numeric: tabular-nums;
      border-bottom: 1px solid var(--ovl-0_04); vertical-align: middle;
    }
    .mi-col .tbl .c-qty  { width: 58px;  text-align: center; }
    .mi-col .tbl .c-mdl  { width: 104px; text-align: right; white-space: nowrap; }
    .mi-col .tbl .c-sup  { width: 84px; }
    .mi-col .tbl .c-st   { width: 84px;  text-align: center; }
    /* style.css global memaksa .tbl td nowrap → nama + "12 varian" + chip status gak mau turun baris
       dan tabel induk melebar melewati panelnya (kolom Modal kepotong). Sel nama boleh wrap. */
    .mi-blk-induk .tbl td { white-space: normal; }
    .mi-blk-induk .tbl td.c-qty, .mi-blk-induk .tbl td.c-mdl { white-space: nowrap; }
    .mi-induk-row { cursor: pointer; }
    .mi-induk-row td { font-weight: 600; }
    .mi-induk-row.mi-sel td { background: var(--ovl-0_06); box-shadow: inset 3px 0 0 var(--accent); }
    .mi-induk-name { display: block; }
    .mi-induk-sub { display: block; margin-top: 2px; font-weight: 400; font-size: 11.5px; color: var(--ink3); }
    .mi-induk-sub i { font-style: normal; margin-right: 7px; font-weight: 600; }
    .mi-modal { color: var(--warn); }
    .mi-vhead {
      -webkit-flex-shrink: 0; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 14px;
      flex-wrap: wrap;
      padding: 11px 14px; background: var(--ovl-0_05);
      border-bottom: 1px solid var(--ovl-0_06);
    }
    .mi-vhead-l { min-width: 0; -webkit-flex: 1 1 auto; flex: 1 1 auto; }
    .mi-vhead-t { display: block; font-weight: 700; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mi-vhead-s { display: block; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink3); margin-bottom: 1px; }
    .mi-vhead-r { display: flex; align-items: baseline; justify-content: flex-end; flex-wrap: wrap; gap: 4px 18px; text-align: right; }
    .mi-big { font-size: 12px; color: var(--ink3); white-space: nowrap; }
    .mi-big b { font-size: 21px; font-weight: 800; color: var(--ink); margin-right: 3px; font-variant-numeric: tabular-nums; }
    .mi-big.mi-big-rp b { color: var(--warn); }
    .mi-vhead-empty { font-size: 13px; color: var(--ink3); font-style: italic; }
    .mi-col-foot { -webkit-flex-shrink: 0; flex-shrink: 0; padding: 8px 16px; font-size: 12px; color: var(--ink3); text-align: right; border-top: 1px solid var(--ovl-0_06); }
    .mi-empty { color: var(--ink3); font-style: italic; padding: 18px 16px !important; }
    @media (hover: hover) and (pointer: fine) {
      .mi-col .mi-induk-row:hover td, .mi-col .mi-var-row:hover td { background: var(--ovl-0_04); }
      .mi-col .mi-induk-row.mi-sel:hover td { background: var(--ovl-0_06); }
    }
    @media (max-width: 900px) {
      #mi-split-wrap { overflow-y: auto; }
      #mi-split-wrap > .mi-col { -webkit-flex: 0 0 auto; flex: 0 0 auto; height: 640px; }
      .mi-pane-row { flex-direction: column; }
      .mi-blk-induk { -webkit-flex: 1 1 45%; flex: 1 1 45%; border-right: none; border-bottom: 1px solid var(--ovl-0_06); }
      .mi-pane-var  { -webkit-flex: 1 1 55%; flex: 1 1 55%; }
    }

    /* ════════════════════════════════════════════════════════════════
       3 Okt 2026 — TAMPILAN HP (<768px) — request user. LAPTOP/TABLET (>=768px) TIDAK DISENTUH.
       Konsep: semua serba SWIPE (sama kayak carousel dashboard & panel Gadag), tabel = murni
       informasi (gak ada aksi) jadi aman dibuat bisa diketuk:
         1) 3 minicard  → 1 kartu/halaman, swipe loop 1-2-3-1, 3 dot
         2) 2 kolom (Clearance & Flash Sale) → 2 panel swipe + tab penanda di atasnya
         3) tabel induk cuma 3 kolom (SKU Induk, Qty, Modal) — TANPA scroll horizontal
         4) ketuk SKU induk → bottom-sheet ala komen Instagram berisi variasinya, tutup pakai tombol X
       Slide non-aktif disembunyiin lewat visibility (bukan display) biar tinggi container tetap. ──── */
    #mi-phead, #mi-metrics-strip .mi-m-phone, .mi-cdots, #page-clearance-induk .mi-sku-btn { display: none; }

    /* ── bottom-sheet variasi (fixed full-screen → CSS-nya GAK di-scope ke halaman, biar gak ketiban overflow:hidden) ── */
    #mi-sheet-overlay {
      display: none; position: fixed; inset: 0; z-index: 700; touch-action: none;
      background: rgba(0,0,0,.55); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
    }
    #mi-sheet-overlay.open { display: block; }
    #mi-sheet {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 701;
      background: var(--cream2); border-radius: 20px 20px 0 0;
      transform: translateY(100%); transition: transform .28s cubic-bezier(.4,0,.2,1);
      padding-bottom: env(safe-area-inset-bottom, 16px);
      max-height: 82vh; display: none; flex-direction: column; overflow: hidden;
    }
    #mi-sheet.open { display: flex; transform: translateY(0); }
    #mi-sheet-close {
      position: absolute; top: 10px; right: 10px; width: 32px; height: 32px;
      border: none; background: var(--ovl-0_06); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      color: var(--ink3); font-size: 16px; z-index: 2; padding: 0;
    }
    .mi-sh-handle { width: 40px; height: 4px; background: var(--ovl-0_18); border-radius: 2px; margin: 12px auto 4px; flex: none; }
    .mi-sh-title { text-align: center; font-size: 16px; font-weight: 700; color: var(--ink); padding: 8px 52px 2px; letter-spacing: -.2px; flex: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mi-sh-stats { text-align: center; font-size: 12px; color: var(--ink3); padding: 0 16px 10px; flex: none; border-bottom: 1px solid var(--ovl-0_06); }
    .mi-sh-stats b { font-size: 15px; font-weight: 800; color: var(--ink); font-variant-numeric: tabular-nums; margin: 0 2px 0 6px; }
    .mi-sh-stats b:first-child { margin-left: 0; }
    .mi-sh-stats b.mi-sh-rp { color: var(--warn); }
    #mi-sh-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; padding: 0 12px 12px; }
    .mi-sh-head, .mi-sh-row {
      display: grid; grid-template-columns: minmax(0,1fr) 44px 98px; column-gap: 8px; align-items: center; padding: 10px 4px;
    }
    .mi-sh-head { position: sticky; top: 0; z-index: 1; background: var(--cream2); font-size: 11px; font-weight: 700; letter-spacing: .08em; color: var(--ink3); border-bottom: 1px solid var(--ovl-0_06); }
    .mi-sh-head span:nth-child(2) { text-align: center; }
    .mi-sh-head span:nth-child(3) { text-align: right; }
    .mi-sh-row { border-bottom: 1px solid var(--ovl-0_04); font-size: 14px; font-variant-numeric: tabular-nums; }
    .mi-sh-sku { font-weight: 600; word-break: break-word; }
    .mi-sh-sub { display: block; margin-top: 2px; font-size: 11.5px; font-weight: 400; color: var(--ink3); }
    .mi-sh-vel { display: inline-block; margin-left: 6px; padding: 0 6px; font-size: 10px; font-weight: 700; border: 1.5px solid; border-radius: 5px; line-height: 1.5; }
    .mi-sh-q { text-align: center; font-weight: 700; }
    .mi-sh-m { text-align: right; white-space: nowrap; color: var(--warn); }
    .mi-sh-stats:empty { display: none; }
    #mi-sheet.mi-so .mi-sh-title { padding-bottom: 12px; border-bottom: 1px solid var(--ovl-0_06); }
    .mi-so-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 8px; font-size: 15px; border-bottom: 1px solid var(--ovl-0_04); cursor: pointer; }
    .mi-so-row:active { background: var(--ovl-0_08); }
    .mi-so-ck { visibility: hidden; color: var(--ink); font-weight: 800; }
    .mi-so-row.on { font-weight: 700; }
    .mi-so-row.on .mi-so-ck { visibility: visible; }
    .mi-sh-empty { padding: 22px 8px; text-align: center; color: var(--ink3); font-style: italic; font-size: 13px; }

    @media (max-width: 767px) {
      /* header: baris 1 = judul + 2 tombol ikon (urutkan, detail per SKU) sejajar judul; baris 2 = filter.
         Tombol teks "Detail per SKU" jadi ikon saja → hemat tempat, tabel makin luas. */
      #page-clearance-induk .mi-header { padding: 10px 12px; gap: 8px; }
      #page-clearance-induk .mi-header > span { order: 1; -webkit-flex: 1 1 0; flex: 1 1 0; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #page-clearance-induk .mi-header-controls { display: contents; }
      #page-clearance-induk .mi-header .mi-ibtn {
        display: -webkit-flex; display: flex; -webkit-align-items: center; align-items: center; justify-content: center;
        -webkit-flex: 0 0 auto; flex: 0 0 auto; width: 38px; height: 36px; padding: 0; position: relative;
      }
      #page-clearance-induk .mi-header .mi-ibtn i { font-size: 19px; }
      #page-clearance-induk .mi-header .mi-ibtn .mi-btn-t { display: none; }
      #page-clearance-induk .mi-sku-btn { order: 2; }
      #page-clearance-induk .mi-detail-btn { order: 3; }
      #page-clearance-induk .mi-sku-btn.on::after { content: ''; position: absolute; top: 5px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--danger, #e05c4b); }
      /* 3 Okt 2026: dropdown panjang "Semua SKU" DIHAPUS dari HP — diganti tombol ikon .mi-sku-btn (bottom-sheet pilih SKU).
         Elemennya tetap ada di DOM karena laptop/tablet masih memakainya. */
      #page-clearance-induk .mi-select-wrap { display: none; }

      /* 1) minicard → carousel: semua kartu ditumpuk di 1 sel grid, geser lewat transform */
      #page-clearance-induk #mi-metrics-strip {
        display: grid; grid-template-columns: minmax(0,1fr); grid-template-rows: auto;
        gap: 0; padding: 8px 10px 8px; overflow: hidden; touch-action: pan-y;
      }
      #page-clearance-induk .mi-metric { grid-area: 1 / 1; -webkit-flex: none; flex: none; min-width: 0; width: auto; padding: 14px 16px; position: relative; will-change: transform; }
      #page-clearance-induk .mi-metric:not(.mi-sl-on) { visibility: hidden; pointer-events: none; }
      /* HP cuma 2 minicard: (1) Total Modal Rp, (2) Total Qty (kiri) + Total SKU (kanan) dalam 1 kartu.
         Kartu "Katalog Terdampak" & "Total Varian SKU" cuma buat laptop. */
      #page-clearance-induk .mi-metric.mi-m-desk { display: none; }
      #page-clearance-induk #mi-metrics-strip .mi-m-phone { display: -webkit-flex; display: flex; }
      .mi-duo { -webkit-flex: 1 1 auto; flex: 1 1 auto; min-width: 0; display: grid; grid-template-columns: minmax(0,1fr) 1px minmax(0,1fr); column-gap: 16px; align-items: center; }
      .mi-duo-sep { width: 1px; align-self: stretch; background: var(--ovl-0_1, rgba(0,0,0,.1)); }
      .mi-duo-c { min-width: 0; }
      #page-clearance-induk .mi-metric-icon { width: 42px; height: 42px; font-size: 20px; }
      #page-clearance-induk #mi-metrics-strip .m-label { font-size: 11px; }
      #page-clearance-induk #mi-metrics-strip .m-value { font-size: 26px; }
      #page-clearance-induk #mi-metrics-strip .m-delta { font-size: 11px; }
      /* indikator swipe = 2 titik DI DALAM tiap minicard, sejajar baris label (kanan atas) */
      #page-clearance-induk .mi-cdots { display: flex; position: absolute; top: 15px; right: 16px; gap: 5px; }
      .mi-cdots i { width: 6px; height: 6px; border-radius: 50%; background: var(--ink3); opacity: .35; transition: opacity .2s, width .2s; }
      .mi-cdots i.on { opacity: 1; background: var(--ink); width: 16px; border-radius: 3px; }
      /* sort pindah ke tombol (bottom-sheet) → panah sort di header tabel dimatikan di HP */
      #page-clearance-induk .mi-col th { pointer-events: none; }
      #page-clearance-induk .mi-col th [data-sort] { display: none; }

      /* 2) dua kolom → dua panel swipe; tab di atas = penanda panel aktif (bisa diketuk juga) */
      /* judul panel AKTIF (1 judul, bukan 2 sejajar) + kanan: chip halaman "1/2" & tombol pindah halaman ↓↑ */
      #page-clearance-induk #mi-phead {
        display: -webkit-flex; display: flex; -webkit-align-items: center; align-items: center; justify-content: space-between; gap: 10px;
        -webkit-flex: 0 0 auto; flex: 0 0 auto; padding: 10px 12px 9px; background: var(--cream); border-bottom: 1px solid var(--ovl-0_06);
      }
      .mi-ph-l { min-width: 0; -webkit-flex: 1 1 auto; flex: 1 1 auto; }
      .mi-ph-t { display: block; font-size: 15px; font-weight: 700; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .mi-ph-s { display: block; margin-top: 1px; font-size: 11.5px; color: var(--ink3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mi-ph-r { -webkit-flex: 0 0 auto; flex: 0 0 auto; display: flex; align-items: center; gap: 8px; }
      .mi-ph-pg { min-width: 40px; padding: 0 10px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 9px; background: var(--ovl-0_06); font-size: 13px; font-weight: 700; color: var(--ink2); font-variant-numeric: tabular-nums; }
      .mi-ph-btn { width: 40px; height: 34px; padding: 0; border: none; border-radius: 9px; background: var(--ovl-0_06); color: var(--ink); font-size: 17px; font-weight: 700; line-height: 1; font-family: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
      .mi-ph-btn:active { background: var(--ovl-0_12); }
      #page-clearance-induk #mi-split-wrap {
        display: grid; grid-template-columns: minmax(0,1fr); grid-template-rows: minmax(0,1fr);
        gap: 0; padding: 8px 10px 10px; overflow: hidden; touch-action: pan-y;
      }
      #page-clearance-induk #mi-split-wrap > .mi-col { grid-area: 1 / 1; -webkit-flex: none; flex: none; height: auto; min-height: 0; will-change: transform; }
      #page-clearance-induk #mi-split-wrap > .mi-col:not(.mi-sl-on) { visibility: hidden; pointer-events: none; }
      #page-clearance-induk .mi-col-title { display: none; }

      /* 3) tabel induk 3 kolom, full lebar, tanpa scroll horizontal; panel variasi dipindah ke bottom-sheet */
      #page-clearance-induk .mi-pane-var { display: none; }
      #page-clearance-induk .mi-blk-induk { -webkit-flex: 1 1 0; flex: 1 1 0; border: none; overflow-x: hidden; }
      #page-clearance-induk .mi-blk-induk .tbl { table-layout: fixed; }
      #page-clearance-induk .mi-col .tbl .c-qty { width: 52px; }
      #page-clearance-induk .mi-col .tbl .c-mdl { width: 104px; }
      #page-clearance-induk .mi-induk-row.mi-sel td { background: transparent; box-shadow: none; }
      #page-clearance-induk .mi-induk-row:active td { background: var(--ovl-0_08); }
      #page-clearance-induk .mi-induk-sub i { display: inline-block; white-space: nowrap; }  /* "3 Zombie" jangan kepotong di tengah */
      #page-clearance-induk .mi-col-foot { text-align: center; }
    }
  </style>
  <div class="card">
    <div class="card-title mi-header">
      <span><i class="ti ti-stack-2"></i> Modal per SKU Induk</span>
      <div class="mi-header-controls">
        <div class="mi-select-wrap">
          <i class="ti ti-filter"></i>
          <select id="mi-filter-sku" onchange="miFilterBySku(this.value)">
            <option value="">Semua SKU</option>
          </select>
        </div>
        <button class="btn btn-sm mi-sku-btn mi-ibtn" onclick="miSkuOpen()" aria-label="Pilih SKU" title="Pilih SKU">
          <i class="ti ti-filter"></i>
        </button>
        <button class="btn btn-sm mi-detail-btn mi-ibtn" onclick="gotoPage('clearance',null)" style="font-size:12px" aria-label="Detail per SKU" title="Detail per SKU">
          <i class="ti ti-list-details"></i> <span class="mi-btn-t">Detail per SKU</span>
        </button>
      </div>
    </div>

    <div id="mi-metrics-strip">
      <div class="mi-metric mi-metric-blue mi-m-desk">
        <div class="mi-metric-icon"><i class="ti ti-package"></i></div>
        <div>
          <div class="m-label">Katalog Terdampak</div>
          <div class="m-value" id="mi-total-katalog">—</div>
          <div class="m-delta">SKU induk</div>
        </div>
      </div>
      <div class="mi-metric mi-metric-amber mi-m-desk">
        <div class="mi-metric-icon"><i class="ti ti-layers-intersect"></i></div>
        <div>
          <div class="m-label">Total Varian SKU</div>
          <div class="m-value" id="mi-total-varian">—</div>
          <div class="m-delta">non-aktif/dead/zombie</div>
        </div>
      </div>
      <div class="mi-metric mi-metric-red">
        <div class="mi-metric-icon"><i class="ti ti-coin"></i></div>
        <div>
          <div class="m-label">Total Modal Tertahan</div>
          <div class="m-value" id="mi-total-nilai">—</div>
          <div class="m-delta">HPP × sisa (digabung)</div>
        </div>
        <div class="mi-cdots"><i class="on"></i><i></i></div>
      </div>
      <!-- HP saja: minicard ke-2 = Qty (kiri) + SKU (kanan) -->
      <div class="mi-metric mi-metric-amber mi-m-phone">
        <div class="mi-duo">
          <div class="mi-duo-c">
            <div class="m-label">Total Qty</div>
            <div class="m-value" id="mi-total-qty">—</div>
            <div class="m-delta">pcs tersisa</div>
          </div>
          <div class="mi-duo-sep"></div>
          <div class="mi-duo-c">
            <div class="m-label">Total SKU</div>
            <div class="m-value" id="mi-total-sku">—</div>
            <div class="m-delta">varian SKU</div>
          </div>
        </div>
        <div class="mi-cdots"><i class="off"></i><i class="on"></i></div>
      </div>
    </div>

    <!-- HP saja: judul panel aktif + chip halaman + tombol pindah halaman -->
    <div id="mi-phead">
      <div class="mi-ph-l"><span class="mi-ph-t" id="mi-ph-t">Clearance — Modal Tertahan</span><span class="mi-ph-s" id="mi-ph-s">non-aktif · dead · zombie</span></div>
      <div class="mi-ph-r">
        <span class="mi-ph-pg" id="mi-ph-pg">1/2</span>
      </div>
    </div>

    <div id="mi-split-wrap">
      <!-- KOLOM KIRI — Clearance -->
      <div class="mi-col" id="mi-col-kiri">
        <div class="mi-col-title"><span><i class="ti ti-stack-2"></i> Clearance — Modal Tertahan</span><span class="mi-col-sub">non-aktif · dead · zombie</span></div>
        <div class="mi-pane-row">
        <div class="mi-blk mi-blk-induk">
          <table class="tbl">
            <thead><tr>
              <th onclick="miSort('sku')" style="cursor:pointer;user-select:none">SKU Induk <span data-sort="sku">⇅</span></th>
              <th class="c-qty" onclick="miSort('sisa')" style="cursor:pointer;user-select:none">Qty <span data-sort="sisa">⇅</span></th>
              <th class="c-mdl" onclick="miSort('nilai')" style="cursor:pointer;user-select:none">Modal <span data-sort="nilai">⇅</span></th>
            </tr></thead>
            <tbody id="mi-tbody"><tr><td colspan="3" class="mi-empty">Memuat data...</td></tr></tbody>
          </table>
        </div>
        <div class="mi-pane-var">
        <div class="mi-vhead" id="mi-vhead-kiri"><span class="mi-vhead-empty">Pilih SKU induk di atas</span></div>
        <div class="mi-blk mi-blk-var">
          <table class="tbl">
            <thead><tr>
              <th>SKU Variasi</th>
              <th class="c-qty">Qty</th>
              <th class="c-mdl">Modal</th>
              <th class="c-sup">Supplier</th>
            </tr></thead>
            <tbody id="mi-vbody-kiri"></tbody>
          </table>
        </div>
        </div>
        </div>
        <div class="mi-col-foot" id="mi-footer"></div>
      </div>

      <!-- KOLOM KANAN — Kandidat Flash Sale (tampilan identik) -->
      <div class="mi-col" id="mi-col-kanan">
        <div class="mi-col-title"><span><i class="ti ti-bolt"></i> Kandidat Flash Sale</span><span class="mi-col-sub">sisa ≥ 3 pcs</span></div>
        <div class="mi-pane-row">
        <div class="mi-blk mi-blk-induk">
          <table class="tbl">
            <thead><tr>
              <th onclick="miSort('sku')" style="cursor:pointer;user-select:none">SKU Induk <span data-sort="sku">⇅</span></th>
              <th class="c-qty" onclick="miSort('sisa')" style="cursor:pointer;user-select:none">Qty <span data-sort="sisa">⇅</span></th>
              <th class="c-mdl" onclick="miSort('nilai')" style="cursor:pointer;user-select:none">Modal <span data-sort="nilai">⇅</span></th>
            </tr></thead>
            <tbody id="mi-flash-tbody"><tr><td colspan="3" class="mi-empty">Memuat data...</td></tr></tbody>
          </table>
        </div>
        <div class="mi-pane-var">
        <div class="mi-vhead" id="mi-vhead-kanan"><span class="mi-vhead-empty">Pilih SKU induk di atas</span></div>
        <div class="mi-blk mi-blk-var">
          <table class="tbl">
            <thead><tr>
              <th>SKU Variasi</th>
              <th class="c-qty">Qty</th>
              <th class="c-mdl">Modal</th>
              <th class="c-sup">Supplier</th>
              <th class="c-st">Status</th>
            </tr></thead>
            <tbody id="mi-vbody-kanan"></tbody>
          </table>
        </div>
        </div>
        </div>
        <div class="mi-col-foot" id="mi-flash-footer"></div>
      </div>
    </div>
  </div>

  <!-- HP: bottom-sheet variasi dari SKU induk yang diketuk (ala komen Instagram). Tutup: tombol X / ketuk area gelap -->
  <div id="mi-sheet-overlay" onclick="miSheetClose()"></div>
  <div id="mi-sheet">
    <button type="button" id="mi-sheet-close" onclick="miSheetClose()" aria-label="Tutup"><i class="ti ti-x"></i></button>
    <div class="mi-sh-handle"></div>
    <div class="mi-sh-title" id="mi-sh-title"></div>
    <div class="mi-sh-stats" id="mi-sh-stats"></div>
    <div id="mi-sh-list"></div>
  </div>
`;

setTimeout(() => {
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-clearance-induk'));
}, 80);

// ─── STATE (cache biar sort gak perlu fetch ulang) ────────────
let _miGroupTotals = null;  // { katalog: {katalog,varian,sisa,nilai} }
let _miFlatRows    = null;  // [{katalog, sku, boss, sisa, hpp, nilai}] — KHUSUS clearance (non-aktif/dead/zombie), kolom kiri
let _miFlashRows   = null;  // [{katalog, sku, boss, sisa, hpp, nilai, vel}] — SEMUA SKU (semua velocity), kolom kanan
let _miSort        = { col: null, dir: null };  // null = netral (default: modal desc)
let _miSkuFilter   = '';    // '' = semua SKU
let _miSel         = { kiri: '', kanan: '' };   // SKU induk yang lagi dibuka di blok 2 (per kolom)

function _miEsc(t) { return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function _miEnc(t) { return encodeURIComponent(String(t == null ? '' : t)).replace(/'/g, '%27'); }
const _miFmtRp = v => 'Rp' + Number(v || 0).toLocaleString('id-ID');

// ═══════════════════════════════════════════════════════════════
// TAMPILAN HP (<768px) — 3 Okt 2026. Semua fungsi di blok ini cuma aktif di HP;
// laptop/tablet gak pernah masuk ke sini (cek _miIsPhone di tiap pintu masuk).
// ═══════════════════════════════════════════════════════════════
function _miIsPhone() { return window.innerWidth < 768; }

// ─── BOTTOM-SHEET VARIASI ─────────────────────────────────────
// Baris variasi dari SKU induk yang diketuk — aturan filter & urutan SAMA PERSIS dgn blok 2 desktop
// (_miRenderSide): flash = sisa ≥ 3, ikut filter SKU header, urut ikut sort aktif.
function _miSheetRows(side, katalog) {
  const isFlash = side === 'kanan';
  const src = isFlash ? _miFlashRows : _miFlatRows;
  if (!src) return [];
  const rows = src.filter(r => r.katalog === katalog && (!isFlash || r.sisa >= 3) && (!_miSkuFilter || r.katalog === _miSkuFilter));
  const sortCol = _miSort.col || 'nilai';
  const sortDir = _miSort.col ? _miSort.dir : 'desc';
  return rows.sort((a, b) => {
    const d = sortCol === 'sku' ? String(a.sku).localeCompare(String(b.sku)) : a[sortCol] - b[sortCol];
    return sortDir === 'asc' ? d : -d;
  });
}

function _miVelTag(vel) {
  const map = { fast: ['Fast', '#00c896'], slow: ['Slow', '#c8a000'], dead: ['Dead', '#e05c00'], zombie: ['Zombie', 'var(--ink3)'] };
  const m = map[vel];
  const label = m ? m[0] : (vel ? vel.charAt(0).toUpperCase() + vel.slice(1) : '—');
  const color = m ? m[1] : 'var(--ink3)';
  return `<span class="mi-sh-vel" style="color:${color};border-color:${color}">${_miEsc(label)}</span>`;
}

function miSheetOpen(side, katalog) {
  const rows = _miSheetRows(side, katalog);
  const isFlash = side === 'kanan';
  const pcs = rows.reduce((s, r) => s + r.sisa, 0);
  const nilai = rows.reduce((s, r) => s + r.nilai, 0);
  document.getElementById('mi-sheet').classList.remove('mi-so');
  document.getElementById('mi-sh-title').textContent = katalog;
  document.getElementById('mi-sh-stats').innerHTML =
    `<b>${rows.length.toLocaleString('id-ID')}</b>varian · <b>${pcs.toLocaleString('id-ID')}</b>pcs · <b class="mi-sh-rp">${_miFmtRp(nilai)}</b>`;
  const list = document.getElementById('mi-sh-list');
  list.innerHTML = rows.length
    ? '<div class="mi-sh-head"><span>SKU VARIASI</span><span>QTY</span><span>MODAL</span></div>' +
      rows.map(r => `<div class="mi-sh-row">
        <div><span class="mi-sh-sku">${_miEsc(r.sku)}</span><span class="mi-sh-sub">${_miEsc(r.boss)}${isFlash ? _miVelTag(r.vel) : ''}</span></div>
        <div class="mi-sh-q">${r.sisa.toLocaleString('id-ID')}</div>
        <div class="mi-sh-m">${_miFmtRp(r.nilai)}</div>
      </div>`).join('')
    : '<div class="mi-sh-empty">Tidak ada variasi.</div>';
  list.scrollTop = 0;
  document.getElementById('mi-sheet-overlay').classList.add('open');
  document.getElementById('mi-sheet').classList.add('open');
}

function miSheetClose() {
  const ov = document.getElementById('mi-sheet-overlay');
  const sh = document.getElementById('mi-sheet');
  if (ov) ov.classList.remove('open');
  if (sh) sh.classList.remove('open');
  // class mode-urutkan dilepas SETELAH animasi turun selesai (biar isi sheet gak berubah dulu pas menutup)
  setTimeout(() => { if (sh && !sh.classList.contains('open')) sh.classList.remove('mi-so'); }, 320);
}

// ─── PILIH SKU (HP) — 3 Okt 2026 ──────────────────────────────
// Tombol ikon di header (di samping "Detail per SKU") → bottom-sheet ala komen Instagram yang sama
// dgn sheet variasi/urutkan. Gantinya dropdown panjang "Semua SKU" + tombol Urutkan lama.
// Pilihan = filter SKU induk yang SAMA dgn dropdown laptop (miFilterBySku), jadi 1 sumber kebenaran.
let _miSkuList = [];
function miSkuOpen() {
  _miSkuList = _miGroupTotals ? Object.keys(_miGroupTotals).sort((a, b) => a.localeCompare(b)) : [];
  const row = (i, label, on) =>
    `<div class="mi-so-row${on ? ' on' : ''}" onclick="miSkuPick(${i})"><span>${_miEsc(label)}</span><span class="mi-so-ck">✓</span></div>`;
  document.getElementById('mi-sh-title').textContent = 'Pilih SKU';
  document.getElementById('mi-sh-stats').innerHTML = '';
  document.getElementById('mi-sh-list').innerHTML =
    row(-1, 'Semua SKU', !_miSkuFilter) + _miSkuList.map((k, i) => row(i, k, k === _miSkuFilter)).join('');
  document.getElementById('mi-sh-list').scrollTop = 0;
  document.getElementById('mi-sheet').classList.add('mi-so');
  document.getElementById('mi-sheet-overlay').classList.add('open');
  document.getElementById('mi-sheet').classList.add('open');
}
function miSkuPick(i) {
  const val = i < 0 ? '' : (_miSkuList[i] || '');
  const sel = document.getElementById('mi-filter-sku');
  if (sel) sel.value = val;          // jaga dropdown laptop tetap sinkron kalau layar diputar/diubah
  miSheetClose();
  miFilterBySku(val);
}

// ─── TOMBOL PILIH SKU (HP) ────────────────────────────────────
function miUpdateSortBtn() {
  // 3 Okt 2026: tombol HP sekarang = pilih SKU → titik penanda nyala kalau ada 1 SKU yang dipilih
  const b = document.querySelector('#page-clearance-induk .mi-sku-btn');
  if (b) b.classList.toggle('on', !!_miSkuFilter);
}

// ─── ENGINE SWIPE (loop, ikut jari, 2+ slide) ─────────────────
// Slide ditumpuk di 1 sel grid (CSS), yang aktif = class .mi-sl-on. Pas digeser: slide aktif + 1 tetangga
// (kiri/kanan tergantung arah jari) ikut jari lewat transform; lepas → lanjut/balik dgn animasi.
// Jadi loop jalan juga buat 2 slide (panel Clearance ↔ Flash Sale) & tanpa klon DOM.
// Mirip carousel dashboard & panel Gadag: ambang 40px / flick, tepi layar 24px diabaikan
// (jatah gesture back OS), swipe vertikal (scroll tabel) dibiarin lewat.
function _miSwipe(vp, slideSel, onChange) {
  const EDGE = 24;
  let cur = 0, busy = false, tracking = false, isHoriz = null, sx = 0, sy = 0, st = 0, dx = 0, nbIdx = -1;
  const slides = () => Array.prototype.filter.call(vp.children, el => el.matches(slideSel));

  function mark() { slides().forEach((s, i) => s.classList.toggle('mi-sl-on', i === cur)); }
  function wipe(s) { s.style.transition = ''; s.style.transform = ''; s.style.visibility = ''; }
  function wipeAll() { slides().forEach(wipe); }
  function setPos(s, x, anim) {
    s.style.transition = anim ? 'transform .28s cubic-bezier(.4,0,.2,1)' : 'none';
    s.style.transform = 'translateX(' + x + ')';
  }
  function finish(target) {
    cur = target; nbIdx = -1; busy = false;
    wipeAll(); mark();
    if (onChange) onChange(cur);
  }
  // dir: +1 = isi geser ke kiri (slide berikutnya masuk dari kanan), -1 = sebaliknya
  function settle(target, dir) {
    const sl = slides(), a = sl[cur];
    if (!a) return;
    busy = true;
    if (target !== cur) {
      const b = sl[target];
      b.style.visibility = 'visible';
      if (b.style.transform === '') { setPos(b, (dir * 100) + '%', false); void b.offsetWidth; } // dipanggil dari tab, bukan drag
      setPos(a, (-dir * 100) + '%', true);
      setPos(b, '0px', true);
    } else {
      setPos(a, '0px', true);
      if (nbIdx > -1 && sl[nbIdx]) setPos(sl[nbIdx], (dir * 100) + '%', true);
    }
    let done = false;
    const fin = () => { if (done) return; done = true; finish(target); };
    a.addEventListener('transitionend', e => { if (e.target === a) fin(); });
    setTimeout(fin, 380);
  }

  vp.addEventListener('touchstart', e => {
    if (!_miIsPhone() || busy || slides().length < 2) { tracking = false; return; }
    const x = e.touches[0].clientX;
    if (x < EDGE || x > window.innerWidth - EDGE) { tracking = false; return; }
    sx = x; sy = e.touches[0].clientY; st = Date.now();
    tracking = true; isHoriz = null; dx = 0; nbIdx = -1;
  }, { passive: true });

  vp.addEventListener('touchmove', e => {
    if (!tracking) return;
    dx = e.touches[0].clientX - sx;
    const dy = e.touches[0].clientY - sy;
    if (isHoriz === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) isHoriz = Math.abs(dx) > Math.abs(dy);
    if (!isHoriz) return;
    if (e.cancelable) e.preventDefault();
    const sl = slides(), N = sl.length, w = vp.clientWidth || 1;
    const idx = dx < 0 ? (cur + 1) % N : (cur - 1 + N) % N;
    if (idx !== nbIdx) {
      if (nbIdx > -1 && nbIdx !== cur && sl[nbIdx]) wipe(sl[nbIdx]);
      nbIdx = idx; sl[idx].style.visibility = 'visible';
    }
    setPos(sl[cur], dx + 'px', false);
    setPos(sl[idx], (dx + (dx < 0 ? w : -w)) + 'px', false);
  }, { passive: false });

  function end() {
    if (!tracking) return;
    tracking = false;
    if (!isHoriz || nbIdx === -1) return;
    const flick = Math.abs(dx) / Math.max(Date.now() - st, 1) > 0.3;
    const dir = dx < 0 ? 1 : -1;
    if (Math.abs(dx) > 40 || (flick && Math.abs(dx) > 20)) settle(nbIdx, dir); else settle(cur, dir);
  }
  vp.addEventListener('touchend', end, { passive: true });
  vp.addEventListener('touchcancel', end, { passive: true });

  mark();
  return {
    goTo(i) { if (busy || i === cur || i < 0 || i >= slides().length) return; settle(i, i > cur ? 1 : -1); },
    refresh() { tracking = false; busy = false; nbIdx = -1; wipeAll(); mark(); },  // dipanggil pas ukuran layar berubah
    get cur() { return cur; }
  };
}

let _miCarMetrics = null, _miCarPanels = null;
// judul + chip halaman ngikut panel aktif
const _MI_PANELS = [
  { t: 'Clearance — Modal Tertahan', s: 'non-aktif · dead · zombie' },
  { t: 'Kandidat Flash Sale',        s: 'sisa ≥ 3 pcs' }
];
function _miPaintHead(cur) {
  const t = document.getElementById('mi-ph-t'), s = document.getElementById('mi-ph-s'), pg = document.getElementById('mi-ph-pg');
  if (t) t.textContent = _MI_PANELS[cur].t;
  if (s) s.textContent = _MI_PANELS[cur].s;
  if (pg) pg.textContent = (cur + 1) + '/' + _MI_PANELS.length;
}

function _miInitSwipe() {
  const strip = document.getElementById('mi-metrics-strip');
  const wrap  = document.getElementById('mi-split-wrap');
  if (!strip || !wrap || _miCarMetrics) return;
  _miCarMetrics = _miSwipe(strip, '.mi-metric:not(.mi-m-desk)');  // titik indikator ada di dalam tiap kartu (statis)
  _miCarPanels = _miSwipe(wrap, '.mi-col', cur => {
    _miPaintHead(cur);
  });
  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (_miCarMetrics) _miCarMetrics.refresh();
      if (_miCarPanels) _miCarPanels.refresh();
      if (!_miIsPhone()) miSheetClose();
    }, 200);
  });
}
_miInitSwipe();

function miPopulateSkuFilter() {
  const sel = document.getElementById('mi-filter-sku');
  if (!sel || !_miGroupTotals) return;
  const skus = Object.keys(_miGroupTotals).sort((a, b) => a.localeCompare(b));
  const prev = _miSkuFilter;
  sel.innerHTML = '<option value="">Semua SKU</option>' +
    skus.map(k => `<option value="${_miEsc(k)}">${_miEsc(k)}</option>`).join('');
  // pertahankan pilihan sebelumnya kalau masih valid, kalau nggak reset ke "Semua SKU"
  if (prev && skus.includes(prev)) {
    sel.value = prev;
  } else {
    _miSkuFilter = '';
    sel.value = '';
  }
}

function miFilterBySku(val) {
  _miSkuFilter = val || '';
  // pilih SKU di dropdown = langsung fokus: variasinya kebuka di kedua kolom
  if (_miSkuFilter) { _miSel.kiri = _miSkuFilter; _miSel.kanan = _miSkuFilter; }
  miRenderTable();
}

// klik baris SKU induk → buka variasinya di blok 2 (kolom yang diklik saja)
// HP (<768px): panel blok 2 disembunyiin → variasi tampil di bottom-sheet (miSheetOpen).
// Laptop/tablet: perilaku lama, gak berubah.
function miPick(side, enc) {
  const name = enc ? decodeURIComponent(enc) : '';
  if (_miIsPhone()) { miSheetOpen(side, name); return; }
  _miSel[side] = name;
  _miRenderSide(side);
}

function miSort(col) {
  if (_miSort.col === col) {
    if (_miSort.dir === 'asc') {
      _miSort.dir = 'desc';
    } else {
      // udah di posisi desc → balik ke netral
      _miSort.col = null;
      _miSort.dir = null;
    }
  } else {
    _miSort.col = col;
    _miSort.dir = 'asc';
  }
  miRenderTable();
}

function miUpdateSortIcons() {
  document.querySelectorAll('#page-clearance-induk [data-sort]').forEach(el => {
    const c = el.getAttribute('data-sort');
    el.textContent = _miSort.col === c ? (_miSort.dir === 'asc' ? '▲' : '▼') : '⇅';
    el.style.color = _miSort.col === c ? 'var(--accent)' : 'var(--ink3)';
  });
}

// ─── METRICS STRIP (ikut filter SKU aktif, dipanggil tiap render) ──
function miUpdateMetrics() {
  const elKat = document.getElementById('mi-total-katalog');
  const elVar = document.getElementById('mi-total-varian');
  const elNil = document.getElementById('mi-total-nilai');
  if (!elKat || !_miGroupTotals || !_miFlatRows) return;

  const groupList = Object.values(_miGroupTotals).filter(g => !_miSkuFilter || g.katalog === _miSkuFilter);
  const flatList  = _miFlatRows.filter(r => !_miSkuFilter || r.katalog === _miSkuFilter);

  elKat.textContent = groupList.length.toLocaleString('id-ID');
  elVar.textContent = flatList.length.toLocaleString('id-ID');
  elNil.textContent = _miFmtRp(flatList.reduce((s, r) => s + r.nilai, 0));
  // minicard HP (Qty kiri + SKU kanan) — di laptop elemennya disembunyikan
  const elQty = document.getElementById('mi-total-qty');
  const elSku = document.getElementById('mi-total-sku');
  if (elQty) elQty.textContent = flatList.reduce((s, r) => s + r.sisa, 0).toLocaleString('id-ID');
  if (elSku) elSku.textContent = flatList.length.toLocaleString('id-ID');
}

// ─── Badge status velocity (dipakai di kolom Status Flash Sale) ──
function _miStatusBadge(vel) {
  const map = {
    fast:   { label: 'Fast',   color: '#00c896' },
    slow:   { label: 'Slow',   color: '#c8a000' },
    dead:   { label: 'Dead',   color: '#e05c00' },
    zombie: { label: 'Zombie', color: 'var(--ink3)' }
  };
  const m = map[vel];
  if (m) return `<span style="font-size:11px;font-weight:700;color:${m.color};padding:3px 10px;border:1.5px solid ${m.color};border-radius:6px;white-space:nowrap">${m.label}</span>`;
  // non-aktif / kategori custom lain (bukan hasil velocity) — pakai raw label-nya
  const label = vel ? vel.charAt(0).toUpperCase() + vel.slice(1) : '—';
  return `<span style="font-size:11px;font-weight:700;color:var(--ink3);padding:3px 10px;border:1.5px solid var(--ink3);border-radius:6px;white-space:nowrap">${label}</span>`;
}

// ─── RENDER 1 KOLOM (kiri = Clearance, kanan = Flash Sale) ─────
// Satu fungsi buat dua kolom → tampilan & perilaku dijamin sama.
function _miRenderSide(side) {
  const isFlash = side === 'kanan';
  const bodyInduk = document.getElementById(isFlash ? 'mi-flash-tbody' : 'mi-tbody');
  const bodyVar   = document.getElementById(isFlash ? 'mi-vbody-kanan' : 'mi-vbody-kiri');
  const headEl    = document.getElementById(isFlash ? 'mi-vhead-kanan' : 'mi-vhead-kiri');
  const footEl    = document.getElementById(isFlash ? 'mi-flash-footer' : 'mi-footer');
  if (!bodyInduk || !bodyVar || !headEl) return;
  const src = isFlash ? _miFlashRows : _miFlatRows;
  if (!src) return;

  const flat = src.filter(r => (!isFlash || r.sisa >= 3) && (!_miSkuFilter || r.katalog === _miSkuFilter));

  if (!flat.length) {
    bodyInduk.innerHTML = `<tr><td colspan="3" class="mi-empty">${isFlash ? 'Belum ada SKU yang sisa-nya ≥ 3 pcs.' : 'Tidak ada modal tertahan saat ini.'}</td></tr>`;
    bodyVar.innerHTML = '';
    headEl.innerHTML = '<span class="mi-vhead-empty">Pilih SKU induk di atas</span>';
    if (footEl) footEl.textContent = '';
    _miSel[side] = '';
    return;
  }

  // total per induk dari data kolom ini sendiri
  const totals = {};
  flat.forEach(r => {
    const g = totals[r.katalog] || (totals[r.katalog] = { katalog: r.katalog, varian: 0, sisa: 0, nilai: 0, vel: {}, boss: [] });
    g.varian += 1; g.sisa += r.sisa; g.nilai += r.nilai;
    const v = ['fast','slow','dead','zombie'].includes(r.vel) ? r.vel : 'lain'; g.vel[v] = (g.vel[v] || 0) + 1;
    if (r.boss && r.boss !== '—' && !g.boss.includes(r.boss)) g.boss.push(r.boss);
  });

  const sortCol = _miSort.col || 'nilai';
  const sortDir = _miSort.col ? _miSort.dir : 'desc';
  const cmp = (a, b, keyA, keyB) => {
    const d = sortCol === 'sku' ? String(keyA).localeCompare(String(keyB)) : a[sortCol] - b[sortCol];
    return sortDir === 'asc' ? d : -d;
  };
  const groups = Object.values(totals).sort((a, b) => cmp(a, b, a.katalog, b.katalog));

  // pilihan induk: kalau belum ada / sudah gak valid → otomatis induk teratas
  if (!_miSel[side] || !totals[_miSel[side]]) _miSel[side] = groups[0].katalog;
  const sel = _miSel[side];

  // ── Blok 1: daftar SKU induk ──
  const velColor = { fast: '#00c896', slow: '#c8a000', dead: '#e05c00', zombie: 'var(--ink3)' };
  bodyInduk.innerHTML = groups.map(g => {
    let sub;
    if (isFlash) {
      sub = ['fast', 'slow', 'dead', 'zombie', 'lain'].filter(k => g.vel[k])
        .map(k => `<i style="color:${velColor[k] || 'var(--ink3)'}">${g.vel[k]} ${k === 'lain' ? 'Non-aktif' : k.charAt(0).toUpperCase() + k.slice(1)}</i>`).join('');
    } else {
      sub = g.boss.length ? `<i>${_miEsc(g.boss.length <= 2 ? g.boss.join(', ') : g.boss[0] + ' +' + (g.boss.length - 1))}</i>` : '';
    }
    return `<tr class="mi-induk-row${g.katalog === sel ? ' mi-sel' : ''}" onclick="miPick('${side}','${_miEnc(g.katalog)}')">
      <td><span class="mi-induk-name">${_miEsc(g.katalog)} <span class="mi-grp-count">${g.varian} varian</span></span>${sub ? `<span class="mi-induk-sub">${sub}</span>` : ''}</td>
      <td class="c-qty">${g.sisa.toLocaleString('id-ID')}</td>
      <td class="c-mdl mi-modal">${_miFmtRp(g.nilai)}</td>
    </tr>`;
  }).join('');

  // ── Blok 2: variasi dari induk terpilih ──
  const g = totals[sel];
  const vRows = flat.filter(r => r.katalog === sel).slice().sort((a, b) => cmp(a, b, a.sku, b.sku));
  headEl.innerHTML = `
    <div class="mi-vhead-l"><span class="mi-vhead-s">Variasi</span><span class="mi-vhead-t">${_miEsc(sel)}</span></div>
    <div class="mi-vhead-r">
      <span class="mi-big"><b>${g.varian.toLocaleString('id-ID')}</b>varian</span>
      <span class="mi-big"><b>${g.sisa.toLocaleString('id-ID')}</b>pcs</span>
      <span class="mi-big mi-big-rp"><b>${_miFmtRp(g.nilai)}</b></span>
    </div>`;
  bodyVar.innerHTML = vRows.map(r => `<tr class="mi-var-row">
      <td>${_miEsc(r.sku)}</td>
      <td class="c-qty" style="font-weight:700">${r.sisa.toLocaleString('id-ID')}</td>
      <td class="c-mdl mi-modal">${_miFmtRp(r.nilai)}</td>
      <td class="c-sup">${_miEsc(r.boss)}</td>
      ${isFlash ? `<td class="c-st">${_miStatusBadge(r.vel)}</td>` : ''}
    </tr>`).join('');

  if (footEl) footEl.textContent = `${groups.length} SKU induk · ${flat.length} varian SKU`;
}

// ─── RENDER (pakai data yang udah di-cache) ────────────────────
function miRenderTable() {
  if (!_miGroupTotals || !_miFlatRows) return;
  miUpdateMetrics();
  miUpdateSortIcons();
  miUpdateSortBtn();
  _miRenderSide('kiri');
  _miRenderSide('kanan');
}
// kompatibilitas nama lama

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadModalInduk() {
  const tbody = document.getElementById('mi-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic"><i class="ti ti-loader"></i> Memuat data...</td></tr>';

  const fmtRp = v => 'Rp' + Number(v || 0).toLocaleString('id-ID');

  try {
    const tgl7  = new Date(); tgl7.setDate(tgl7.getDate() - 7);
    const tgl30 = new Date(); tgl30.setDate(tgl30.getDate() - 30);
    const tgl90 = new Date(); tgl90.setDate(tgl90.getDate() - 90);
    const tgl7Str  = tgl7.toISOString().slice(0, 10);
    const tgl30Str = tgl30.toISOString().slice(0, 10);
    const tgl90Str = tgl90.toISOString().slice(0, 10);

    const [produkAll, stokRaw, jpAllRaw, jp7Raw, jp30Raw, jp90Raw] = await Promise.all([
      dbGet('produk', '&order=katalog.asc'),
      dbGet('stok'),
      dbGet('jurnal_penjualan', '&select=sku,qty'),
      dbGet('jurnal_penjualan', '&select=sku,qty&tanggal=gte.' + tgl7Str),
      dbGet('jurnal_penjualan', '&select=sku,qty&tanggal=gte.' + tgl30Str),
      dbGet('jurnal_penjualan', '&select=sku,qty&tanggal=gte.' + tgl90Str)
    ]);

    // Sisa stok per SKU — identik logic clearance.js
    const masukMap = {};
    (stokRaw || []).forEach(s => {
      const k = (s.sku_variasi || '').trim().toUpperCase();
      if (k) masukMap[k] = (masukMap[k] || 0) + (s.stok_masuk || 0);
    });
    const keluarMap = {};
    (jpAllRaw || []).forEach(r => {
      const k = (r.sku || '').trim().toUpperCase();
      if (k) keluarMap[k] = (keluarMap[k] || 0) + (r.qty || 0);
    });
    const sales7Map = {}, sales30Map = {}, sales90Map = {};
    const _buildMap = (data, map) => {
      (data || []).forEach(r => {
        const k = (r.sku || '').trim().toUpperCase();
        if (k) map[k] = (map[k] || 0) + (r.qty || 0);
      });
    };
    _buildMap(jp7Raw,  sales7Map);
    _buildMap(jp30Raw, sales30Map);
    _buildMap(jp90Raw, sales90Map);

    // Kumpulan SKU non-aktif + dead/zombie-aktif yang masih ada sisa — identik logic clearance.js
    const flat = [];
    produkAll.forEach(p => {
      const kat = (p.kategori_produk || 'aktif').toLowerCase();
      const skuKey = (p.sku_variasi || p.sku || '').trim().toUpperCase();
      if (!skuKey) return;
      const sisa = (masukMap[skuKey] || 0) - (keluarMap[skuKey] || 0);
      if (sisa <= 0) return;

      if (kat !== 'aktif') {
        flat.push({ katalog: p.katalog || '—', sku: skuKey, boss: p.boss || '—', sisa, hpp: p.hpp || 0 });
      } else if (typeof _stokVelocity === 'function') {
        const vel = _stokVelocity(sales7Map[skuKey], sales30Map[skuKey], sales90Map[skuKey]);
        if (vel === 'dead' || vel === 'zombie') {
          flat.push({ katalog: p.katalog || '—', sku: skuKey, boss: p.boss || '—', sisa, hpp: p.hpp || 0 });
        }
      }
    });
    flat.forEach(r => { r.nilai = r.sisa * r.hpp; });

    // ── Kandidat Flash Sale: SEMUA SKU (semua velocity — Fast/Slow/Dead/
    // Zombie/non-aktif), BUKAN cuma yang masuk kriteria Clearance (kolom
    // kiri) kayak sebelumnya. Alasan (16 Sep 2026, request user): flash
    // sale lebih efektif didorong ke SKU yang emang lagi laris (Fast) —
    // dampaknya ke penjualan lebih gede — bukan cuma buat ngabisin stok
    // mati. Dipisah dari `flat` di atas biar tabel kiri (murni Clearance)
    // gak ikut berubah.
    const flashFlat = [];
    produkAll.forEach(p => {
      const skuKey = (p.sku_variasi || p.sku || '').trim().toUpperCase();
      if (!skuKey) return;
      const sisa = (masukMap[skuKey] || 0) - (keluarMap[skuKey] || 0);
      if (sisa <= 0) return;
      const katRaw = (p.kategori_produk || 'aktif').toLowerCase();
      const vel = katRaw !== 'aktif'
        ? katRaw
        : (typeof _stokVelocity === 'function' ? _stokVelocity(sales7Map[skuKey], sales30Map[skuKey], sales90Map[skuKey]) : null);
      flashFlat.push({ katalog: p.katalog || '—', sku: skuKey, boss: p.boss || '—', sisa, hpp: p.hpp || 0, vel });
    });
    flashFlat.forEach(r => { r.nilai = r.sisa * r.hpp; });

    // Total per katalog (SKU induk) — dipakai buat metrik atas & sort grup
    const groupTotals = {};
    flat.forEach(r => {
      if (!groupTotals[r.katalog]) groupTotals[r.katalog] = { katalog: r.katalog, varian: 0, sisa: 0, nilai: 0 };
      groupTotals[r.katalog].varian += 1;
      groupTotals[r.katalog].sisa   += r.sisa;
      groupTotals[r.katalog].nilai  += r.nilai;
    });

    _miGroupTotals = groupTotals;
    _miFlatRows    = flat;
    _miFlashRows   = flashFlat;
    miPopulateSkuFilter();
    miRenderTable();

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger)">⚠️ Error: ${err.message}</td></tr>`;
    console.error('[clearance-induk]', err);
  }
}

// ─── AUTO-LOAD SAAT NAVIGASI KE HALAMAN INI ───────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'clearance-induk') return;
  // Fix 16 Sep 2026: dulu _miSkuFilter kebawa nempel dari kunjungan
  // sebelumnya (gak ke-reset), jadi kalau user pernah pilih 1 SKU lalu
  // pindah & balik lagi ke halaman ini, dropdown diam-diam masih
  // nge-filter ke SKU lama itu — kelihatan kayak "sort cuma nampilin
  // 1 SKU" padahal itu efek filter lama yang nyangkut, bukan dari sort.
  // Reset total ke "Semua SKU" tiap kali halaman ini dibuka dari awal.
  _miSkuFilter = '';
  _miSel = { kiri: '', kanan: '' };
  _miSort = { col: null, dir: null };
  miSheetClose();   // HP: sheet variasi jangan nyangkut terbuka dari kunjungan sebelumnya
  loadModalInduk();
});
