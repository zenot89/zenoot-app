// ─── JURNAL-PENJUALAN.JS ─────────────────────────────────────

document.getElementById('page-jurnal-penjualan').innerHTML = `

  <!-- TOP BAR: collapse on swipe — berisi filter + tab dalam 1 baris -->
  <div id="jp-top-bar">
    <!-- TOOLBAR LAPTOP: filter + tab dalam satu baris -->
    <div id="jp-aksi-laptop" style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;margin-bottom:0;border-bottom:2px solid var(--ink4);padding-bottom:0">
      <button class="btn btn-sm" onclick="loadJurnalPenjualan()" title="Refresh" style="padding:4px 8px;flex-shrink:0">
        <i class="ti ti-refresh"></i>
      </button>
      <!-- 3 Okt 2026: tombol Periode + Channel digabung jadi 1 tombol → 1 sheet (jpPerSheetOpen),
           sama dengan versi HP. Label diisi _jpFilterBtnSync(). -->
      <button class="btn btn-sm jp-filter-btn" id="jp-filter-btn-laptop" onclick="jpPerSheetOpen()"
        style="display:flex;align-items:center;gap:4px;font-size:12px;max-width:380px;min-width:0">
        <i class="ti ti-calendar"></i>
        <span class="jp-filter-label" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">Minggu Ini</span>
        <span class="jp-filter-badge" style="display:none;background:var(--accent);color:#fff;font-size:9px;padding:1px 4px;border-radius:8px;font-weight:700">●</span>
        <span style="font-size:10px">&#9662;</span>
      </button>
      <!-- 19 Sep 2026: 2 tombol Jurnal/Tren digabung jadi 1 toggle (permintaan
           user) — safe karena id lama (jp-tab-jurnal/tren + versi -mob) cuma
           dipakai internal di jpSwitchTab(), gak ada referensi lain di file
           manapun. Label tombol nunjukin TUJUAN kalau diklik (bukan tab
           aktif) — default Jurnal aktif, tombol bilang "Tren & Best Seller". -->
      <button class="btn btn-sm" id="jp-tab-toggle" onclick="jpToggleTab()"
        style="display:flex;align-items:center;gap:4px;font-size:12px;margin-left:auto;align-self:center">
        <i class="ti ti-chart-line" id="jp-tab-toggle-icon"></i>
        <span id="jp-tab-toggle-label">Tren &amp; Best Seller</span>
      </button>
    </div>
    <!-- TOOLBAR MOBILE: filter + tab dalam satu baris -->
    <div id="jp-aksi-mobile" style="display:flex;gap:4px;margin-bottom:0;align-items:center;flex-wrap:nowrap;border-bottom:2px solid var(--ink4);padding-bottom:0">
      <button class="btn btn-sm" onclick="loadJurnalPenjualan()" title="Refresh" style="padding:4px 8px;flex-shrink:0">
        <i class="ti ti-refresh"></i>
      </button>
      <button class="btn btn-sm jp-filter-btn" id="jp-filter-btn" onclick="jpPerSheetOpen()"
        style="display:flex;align-items:center;gap:3px;font-size:11px;min-width:0;flex:0 1 auto">
        <i class="ti ti-calendar" style="flex-shrink:0"></i>
        <span class="jp-filter-label" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">Minggu Ini</span>
        <span class="jp-filter-badge" style="display:none;flex-shrink:0;background:var(--accent);color:#fff;font-size:9px;padding:1px 4px;border-radius:8px;font-weight:700">●</span>
        <span style="font-size:10px;flex-shrink:0">&#9662;</span>
      </button>
      <button class="btn btn-sm" id="jp-tab-toggle-mob" onclick="jpToggleTab()"
        style="display:flex;align-items:center;gap:3px;font-size:11px;margin-left:auto;flex-shrink:0">
        <i class="ti ti-chart-line" id="jp-tab-toggle-icon-mob"></i>
        <span id="jp-tab-toggle-label-mob">Tren</span>
      </button>
    </div>
  </div>

  <!-- ═══ TAB PANE: TREN & BEST SELLER ═══ -->
  <div id="jp-pane-tren" style="display:none;flex-direction:column;flex:1;min-height:0;gap:10px;padding:10px;overflow:hidden;">

    <!-- STICKY: mini cards + chart (collapsible on swipe) -->
    <div id="jp-tren-sticky">

    <!-- MINI CARDS -->
    <div class="metrics" style="flex-shrink:0">
      <div class="metric">
        <div class="m-label">Total Penjualan</div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:2px 8px"><div class="m-value" id="jp-total-penjualan2">—</div><span class="jp-delta" id="jp-delta-penjualan2" style="display:none"></span></div>
        <div class="m-delta">semua transaksi</div>
      </div>
      <div class="metric">
        <div class="m-label">Total Item Terjual</div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:2px 8px"><div class="m-value" id="jp-total-item2">—</div><span class="jp-delta" id="jp-delta-item2" style="display:none"></span></div>
        <div class="m-delta">qty keseluruhan</div>
      </div>
    </div>

    <!-- TREN PENJUALAN CHART -->
    <div class="card" id="jp-tren-card" style="padding:14px;flex-shrink:0">
      <div class="card-title" style="margin-bottom:10px"><i class="ti ti-chart-line"></i> Tren Penjualan</div>
      <div id="jp-tren-chart-wrap" style="position:relative;height:240px">
        <canvas id="jp-chart-tren" style="width:100%;height:100%;display:block"></canvas>
        <div id="jp-chart-empty" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;color:var(--ink3);font-style:italic;font-size:13px">
          Belum ada penjualan di periode ini
        </div>
        <div id="jp-chart-tooltip" style="display:none;position:absolute;background:var(--cream);border:2px solid var(--ink);padding:5px 10px;font-size:11px;font-family:var(--f);pointer-events:none;box-shadow:3px 3px 0 var(--ink4);z-index:10;white-space:nowrap"></div>
      </div>
      <!-- 19 Sep 2026: MOBILE ONLY — isi ruang kosong di bawah chart (setelah
           Best Seller/Channel dipindah keluar jadi swipe-pair sendiri) pakai
           ringkasan performa tertinggi periode ini. Laptop tidak disentuh —
           div ini disembunyikan total via CSS di layar ≥768px. -->
      <div id="jp-tren-ringkasan">
        <div style="color:var(--ink3);font-style:italic;font-size:13px;text-align:center;padding:16px 0">Memuat ringkasan...</div>
      </div>
    </div>

    </div><!-- /jp-tren-sticky -->

    <!-- BEST SELLER + CHANNEL TERBAIK: side by side — LAPTOP SAJA, tidak diubah -->
    <div id="jp-bs-ch-wrap" style="display:flex;gap:10px;align-items:stretch;flex:1;min-height:0;overflow:hidden">

      <!-- BEST SELLER (kiri) -->
      <div class="card" style="padding:14px;flex:1;min-width:280px;display:flex;flex-direction:column;min-height:0">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;flex-shrink:0">
          <div class="card-title" style="margin-bottom:0"><i class="ti ti-trophy"></i> Best Seller</div>
          <div style="display:flex;gap:4px">
            <button id="jp-bs-sort-rp" onclick="jpBsSort('rp')"
              style="padding:3px 10px;font-family:var(--f);font-size:11px;font-weight:700;background:var(--accent);color:#fff;border:2px solid var(--accent);border-radius:4px;cursor:pointer">
              Omset (Rp)
            </button>
            <button id="jp-bs-sort-qty" onclick="jpBsSort('qty')"
              style="padding:3px 10px;font-family:var(--f);font-size:11px;font-weight:700;background:none;color:var(--ink3);border:2px solid var(--ink3);border-radius:4px;cursor:pointer">
              Qty (pcs)
            </button>
          </div>
        </div>
        <div id="jp-bestseller-list" style="display:flex;flex-direction:column;gap:0;overflow-y:auto;flex:1;min-height:0">
          <div style="color:var(--ink3);font-style:italic;font-size:13px;padding:10px 0">Belum ada data</div>
        </div>
      </div>

      <!-- CHANNEL TERBAIK (kanan) -->
      <div class="card" style="padding:14px;flex:1;min-width:280px;display:flex;flex-direction:column;min-height:0">
        <div class="card-title" style="margin-bottom:10px;flex-shrink:0"><i class="ti ti-building-store"></i> Channel Terbaik</div>
        <div id="jp-channel-terbaik-list" style="display:flex;flex-direction:column;gap:0;overflow-y:auto;flex:1;min-height:0">
          <div style="color:var(--ink3);font-style:italic;font-size:13px;padding:10px 0">Belum ada data</div>
        </div>
      </div>

    </div>

    <!-- 19 Sep 2026: MOBILE ONLY — Best Seller & Channel Terbaik dipisah jadi
         2 "halaman" swipe (bukan lagi berdampingan/numpuk), niru persis pola
         .db-swipe-pair dashboard.js (dot indikator bold, hint teks polos
         TANPA ikon — permintaan user eksplisit). CSS & mekanisme swipe
         (touch drag + dot click) REUSE 100% dari dashboard.js lewat
         window.dbSwipeInit() — gak nulis ulang, biar konsisten & battle-tested.
         Laptop (≥768px): elemen ini disembunyikan total, jp-bs-ch-wrap di
         atas yang tampil apa adanya — TIDAK diubah sama sekali. -->
    <div class="db-swipe-pair" id="jp-bs-ch-swipe">
      <div class="db-swipe-track">

        <!-- SLIDE 1: BEST SELLER -->
        <div class="db-swipe-slide">
          <div class="db-swipe-dot-label"><span class="db-dot active"></span><span class="db-dot"></span><span class="db-swipe-hint">geser → Channel Terbaik</span></div>
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;flex-shrink:0">
              <div class="card-title" style="margin-bottom:0"><i class="ti ti-trophy"></i> Best Seller</div>
              <div style="display:flex;gap:4px">
                <button id="jp-bs-sort-rp-mob" onclick="jpBsSort('rp')"
                  style="padding:3px 10px;font-family:var(--f);font-size:11px;font-weight:700;background:var(--accent);color:#fff;border:2px solid var(--accent);border-radius:4px;cursor:pointer">
                  Omset (Rp)
                </button>
                <button id="jp-bs-sort-qty-mob" onclick="jpBsSort('qty')"
                  style="padding:3px 10px;font-family:var(--f);font-size:11px;font-weight:700;background:none;color:var(--ink3);border:2px solid var(--ink3);border-radius:4px;cursor:pointer">
                  Qty (pcs)
                </button>
              </div>
            </div>
            <div id="jp-bestseller-list-mob">
              <div style="color:var(--ink3);font-style:italic;font-size:13px;padding:10px 0">Belum ada data</div>
            </div>
          </div>
        </div>

        <!-- SLIDE 2: CHANNEL TERBAIK -->
        <div class="db-swipe-slide">
          <div class="db-swipe-dot-label"><span class="db-dot"></span><span class="db-dot active"></span><span class="db-swipe-hint">← Best Seller</span></div>
          <div class="card">
            <div class="card-title" style="margin-bottom:10px;flex-shrink:0"><i class="ti ti-building-store"></i> Channel Terbaik</div>
            <div id="jp-channel-terbaik-list-mob">
              <div style="color:var(--ink3);font-style:italic;font-size:13px;padding:10px 0">Belum ada data</div>
            </div>
          </div>
        </div>

      </div><!-- /db-swipe-track -->
    </div><!-- /jp-bs-ch-swipe -->

  </div><!-- /jp-pane-tren -->

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
    #jp-bs-ch-swipe { display: none !important; }
    #jp-tren-ringkasan { display: none !important; }
  }
  /* ── Mobile (portrait & landscape HP): toolbar dalam card ──
     19 Sep 2026: Best Seller & Channel Terbaik jadi swipe-pair (bukan lagi
     side-by-side kayak laptop) + ringkasan performa ngisi ruang kosong di
     bawah chart Tren — permintaan user, laptop (#jp-bs-ch-wrap di atas)
     TIDAK disentuh sama sekali, cuma disembunyikan di lebar ini. */
  @media (max-width: 767px) {
    #jp-aksi-laptop { display: none !important; }
    #jp-aksi-mobile { display: flex !important; }
    #jp-bs-ch-wrap  { display: none !important; }
    #jp-bs-ch-swipe { display: flex !important; flex-direction: column; flex: 1; min-height: 0; margin-bottom: 0 !important; }
    #jp-bs-ch-swipe .db-swipe-track  { flex: 1; min-height: 0; }
    #jp-bs-ch-swipe .db-swipe-slide  { display: flex; flex-direction: column; min-height: 0; }
    #jp-bs-ch-swipe .db-swipe-slide .card {
      margin: 0; flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 14px;
    }
    #jp-bs-ch-swipe #jp-bestseller-list-mob,
    #jp-bs-ch-swipe #jp-channel-terbaik-list-mob {
      display: flex; flex-direction: column; gap: 0; overflow-y: auto; flex: 1; min-height: 0;
    }
    #jp-tren-ringkasan { display: block; margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--ink4); }
  }

    /* ── PICKER BOTTOM SHEET (ala BRImo) — SKU Induk & SKU Variasi ──
       Konsisten sama pola picker akun di Kas & Jurnal / supplier di Hutang
       Barang: sheet naik dari bawah, search nempel di atas, list item
       terang (bukan dropdown melayang gelap kayak sebelumnya). ── */
    #jp-sku-sheet-overlay {
      display: none; position: fixed; inset: 0; z-index: 598;
      background: rgba(0,0,0,.55);
    }
    #jp-sku-sheet-overlay.open { display: block; }
    #jp-sku-sheet {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 599;
      background: var(--cream2); border-radius: 20px 20px 0 0;
      transform: translateY(100%);
      transition: transform 0.28s cubic-bezier(.4,0,.2,1);
      padding-bottom: env(safe-area-inset-bottom, 16px);
      max-height: 85vh; display: none; flex-direction: column; overflow: hidden;
    }
    #jp-sku-sheet.open { display: flex; transform: translateY(0); }
    #jp-sku-sheet-close {
      position: absolute; top: 10px; right: 10px; width: 32px; height: 32px;
      border: none; background: var(--ovl-0_06); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      color: var(--ink3); font-size: 16px; z-index: 2; padding: 0;
    }
    #jp-sku-sheet-handle {
      width: 40px; height: 4px; background: var(--ovl-0_18); border-radius: 2px;
      margin: 12px auto 4px; flex: none;
    }
    #jp-sku-sheet-title {
      text-align: center; font-size: 16px; font-weight: 700; color: var(--ink);
      padding: 8px 16px 12px; letter-spacing: -0.2px; flex: none;
    }
    #jp-sku-sheet-search-wrap { flex: none; padding: 0 16px 10px; }
    #jp-sku-sheet-search {
      width: 100%; box-sizing: border-box; background: var(--ovl-0_06);
      border: 1px solid var(--ovl-0_12); border-radius: 10px; padding: 11px 14px;
      font-size: 15px; font-family: var(--f); color: var(--ink); outline: none;
      -webkit-appearance: none;
    }
    #jp-sku-sheet-search::placeholder { color: var(--ink3); }
    #jp-sku-sheet-search:focus { border-color: var(--ovl-0_25); background: var(--ovl-0_09); }
    #jp-sku-sheet-list {
      flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain; padding: 4px 10px 12px;
    }
    #jp-sku-sheet-list .jp-sheet-item {
      font-size: 15px; padding: 12px 10px; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      color: var(--ink2);
    }
    #jp-sku-sheet-list .jp-sheet-item:active { background: var(--ovl-0_08); color: var(--ink); }
    #jp-sku-sheet-list .jp-sheet-empty {
      padding: 28px 12px; text-align: center; color: var(--ink3);
      font-size: 13px; font-style: italic;
    }
    #jp-sku-sheet-list::-webkit-scrollbar { width: 4px; }
    #jp-sku-sheet-list::-webkit-scrollbar-track { background: transparent; }
    #jp-sku-sheet-list::-webkit-scrollbar-thumb { background: var(--ovl-0_15); border-radius: 2px; }
    @media (min-width: 768px) {
      #jp-sku-sheet {
        left: 50%; right: auto; bottom: 50%; transform: translate(-50%, 50%) scale(.96);
        width: 100%; max-width: 420px; border-radius: 16px; max-height: 70vh; opacity: 0;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      #jp-sku-sheet.open { transform: translate(-50%, 50%) scale(1); opacity: 1; }
    }

    /* ── 3 Okt 2026: PICKER PERIODE HP — bottom sheet ala komentar Instagram ──
       Sejak 3 Okt 2026 dipakai tombol gabungan Periode+Channel di HP DAN laptop
       (#jp-filter-btn / #jp-filter-btn-laptop). Layer 600/601 = sama dgn sheet Kas/Stok (di atas nav). ── */
    #jp-per-overlay {
      position: fixed; inset: 0; z-index: 600; background: rgba(0,0,0,.5);
      opacity: 0; visibility: hidden; touch-action: none;
      transition: opacity .25s ease, visibility 0s linear .25s;
    }
    #jp-per-overlay.open { opacity: 1; visibility: visible; transition: opacity .25s ease, visibility 0s; }
    #jp-per-sheet {
      position: fixed; left: 0; right: 0; bottom: 0; margin: 0 auto; width: 100%; max-width: 480px;
      z-index: 601; background: var(--cream2); border-radius: 20px 20px 0 0;
      transform: translateY(100%); visibility: hidden;
      transition: transform .28s cubic-bezier(.4,0,.2,1), visibility 0s linear .28s;
      padding-bottom: env(safe-area-inset-bottom, 12px);
      max-height: 88vh; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 -8px 32px rgba(0,0,0,.25);
    }
    #jp-per-sheet.open { transform: translateY(0); visibility: visible; transition: transform .28s cubic-bezier(.4,0,.2,1), visibility 0s; }
    #jp-per-head { flex: none; position: relative; touch-action: none; }
    #jp-per-handle { width: 40px; height: 4px; background: var(--ovl-0_18); border-radius: 2px; margin: 10px auto 2px; }
    #jp-per-title { text-align: center; font-size: 16px; font-weight: 700; color: var(--ink); padding: 8px 52px 12px; letter-spacing: -0.2px; }
    #jp-per-back, #jp-per-close {
      position: absolute; top: 12px; width: 32px; height: 32px; border: none; padding: 0;
      background: var(--ovl-0_06); border-radius: 50%; color: var(--ink3); font-size: 16px;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    #jp-per-close { right: 12px; }
    #jp-per-back { left: 12px; display: none; }
    #jp-per-sheet.sub #jp-per-back { display: flex; }
    #jp-per-body { flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; padding: 0 10px 10px; }
    .jp-pl-item {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      width: 100%; box-sizing: border-box; padding: 13px 12px; border: none; background: none;
      border-radius: 10px; font-family: var(--f); font-size: 15px; font-weight: 500;
      color: var(--ink); text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent;
    }
    .jp-pl-item.active { font-weight: 700; }
    .jp-pl-item:active { background: var(--ovl-0_08); }
    .jp-pl-right { display: flex; align-items: center; gap: 6px; color: var(--ink4); font-size: 16px; }
    .jp-pl-sum { font-size: 13px; font-weight: 600; color: var(--ink3); }
    .jp-pl-check { color: var(--accent); font-size: 18px; }
    .jp-pc-nav { display: flex; align-items: center; justify-content: space-between; padding: 2px 4px 8px; }
    .jp-pc-nav button {
      width: 36px; height: 36px; border: none; padding: 0; background: var(--ovl-0_06); border-radius: 50%;
      color: var(--ink); font-size: 16px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; -webkit-tap-highlight-color: transparent;
    }
    .jp-pc-month { font-size: 15px; font-weight: 700; color: var(--ink); }
    .jp-pc-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px 0; padding: 0 4px; }
    .jp-pc-dow { text-align: center; font-size: 11px; font-weight: 700; color: var(--ink3); padding: 6px 0; }
    .jp-pc-day {
      height: 40px; display: flex; align-items: center; justify-content: center; padding: 0;
      border: none; background: none; border-radius: 10px; font-family: var(--f);
      font-size: 14px; font-weight: 600; color: var(--ink); cursor: pointer; -webkit-tap-highlight-color: transparent;
    }
    .jp-pc-day.today { box-shadow: inset 0 0 0 1.5px var(--ink4); }
    .jp-pc-day.in-range { background: var(--ovl-0_08); border-radius: 0; }
    .jp-pc-day.sel { background: var(--ink); color: var(--cream); border-radius: 10px; }
    .jp-pc-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 6px 2px; }
    .jp-pc-range { min-width: 0; font-size: 13px; font-weight: 600; color: var(--ink); }
    .jp-pc-apply {
      flex: none; padding: 10px 20px; border: none; border-radius: 10px; background: var(--ink);
      color: var(--cream); font-family: var(--f); font-size: 14px; font-weight: 700; cursor: pointer;
    }
    .jp-pc-apply[disabled] { opacity: .35; cursor: default; }
    .jp-pg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 4px; }
    .jp-pg-item {
      padding: 14px 4px; border: none; border-radius: 12px; background: var(--ovl-0_06); color: var(--ink);
      font-family: var(--f); font-size: 14px; font-weight: 600; text-align: center; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .jp-pg-item.today { box-shadow: inset 0 0 0 1.5px var(--ink4); }
    .jp-pg-item.sel { background: var(--ink); color: var(--cream); }
    /* ── 3 Okt 2026: sheet gabungan Periode + Channel — tab, footer Terapkan, daftar channel ── */
    #jp-per-tabs { flex: none; display: flex; gap: 6px; padding: 0 12px 8px; }
    #jp-per-sheet.sub #jp-per-tabs, #jp-per-sheet.sub #jp-per-foot { display: none; }
    .jp-pt {
      flex: 1; padding: 9px 0; border: none; border-radius: 10px; background: var(--ovl-0_06);
      color: var(--ink3); font-family: var(--f); font-size: 14px; font-weight: 700; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .jp-pt.active { background: var(--ink); color: var(--cream); }
    #jp-per-foot { flex: none; display: flex; gap: 10px; padding: 10px 12px 6px; border-top: 1px solid var(--ovl-0_08); }
    .jp-pf-reset {
      flex: none; padding: 10px 18px; border: none; border-radius: 10px; background: var(--ovl-0_06);
      color: var(--ink); font-family: var(--f); font-size: 14px; font-weight: 700; cursor: pointer;
    }
    #jp-per-foot .jp-pc-apply { flex: 1; }
    .jp-pl-group { font-size: 11px; font-weight: 700; letter-spacing: .5px; color: var(--ink3); padding: 12px 12px 4px; text-transform: uppercase; }
    .jp-pl-empty { padding: 16px 12px; font-size: 13px; color: var(--ink3); }
    @media (hover: hover) {
      .jp-pl-item:hover { background: var(--ovl-0_06); }
      .jp-pt:not(.active):hover, .jp-pf-reset:hover { background: var(--ovl-0_08); }
    }
    /* Laptop / layar lebar: sheet yang sama tampil sebagai dialog di tengah layar (isi identik dengan HP) */
    @media (min-width: 768px) and (min-height: 521px) {
      #jp-per-overlay { touch-action: auto; }
      #jp-per-sheet {
        left: 50%; right: auto; top: 50%; bottom: auto; margin: 0;
        width: 440px; max-width: calc(100vw - 32px); max-height: 80vh;
        border-radius: 16px; padding-bottom: 6px; opacity: 0;
        transform: translate(-50%, -46%) scale(.98);
        transition: transform .2s ease, opacity .2s ease, visibility 0s linear .2s;
        box-shadow: 0 12px 40px rgba(0,0,0,.35);
      }
      #jp-per-sheet.open {
        opacity: 1; transform: translate(-50%, -50%);
        transition: transform .2s ease, opacity .2s ease, visibility 0s;
      }
      #jp-per-handle { display: none; }
      #jp-per-head { padding-top: 6px; }
    }
    @media (max-height: 520px) {
      .jp-pc-day { height: 32px; font-size: 13px; }
      .jp-pl-item { padding: 10px 12px; }
      #jp-per-title { padding-top: 6px; padding-bottom: 8px; }
      .jp-pg-item { padding: 10px 4px; }
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
        <button onclick="closeModalJP()" id="jp-btn-close-x"
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
          <div class="kas-akun-picker" id="jp-picker-channel" onclick="jpSkuSheetOpen('channel')">
            <span id="jp-picker-channel-label" style="color:var(--ink3)">— Pilih Channel —</span>
            <span style="margin-left:auto;color:var(--ink3);font-size:10px">▾</span>
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
          <div class="kas-akun-picker" id="jp-picker-variasi" onclick="jpSkuSheetOpen('variasi')">
            <span id="jp-picker-variasi-label" style="color:var(--ink3)">— Pilih Variasi —</span>
            <span style="margin-left:auto;color:var(--ink3);font-size:10px">▾</span>
          </div>
        </div>
        <div class="form-group fg-induk" style="position:relative">
          <label>SKU Induk</label>
          <input type="hidden" id="jp-sku-induk">
          <div class="kas-akun-picker" id="jp-picker-induk" onclick="jpSkuSheetOpen('induk')">
            <span id="jp-picker-induk-label" style="color:var(--ink3)">— Pilih SKU Induk —</span>
            <span style="margin-left:auto;color:var(--ink3);font-size:10px">▾</span>
          </div>
          <button id="jp-btn-tambah-sku"
            onclick="jpSimpanDanTambah()"
            title="Simpan & tambah SKU lain"
            style="display:none;margin-top:6px;background:var(--ok);border:2px solid var(--ok);
                   padding:8px 12px;cursor:pointer;font-size:14px;color:#fff;font-weight:700;
                   min-height:38px;border-radius:6px;width:100%">+ Simpan &amp; Tambah SKU Lain</button>
        </div>
      </div>

      <!-- KIRIM VIA RH (6 Okt 2026): muncul hanya untuk SKU XL yang punya padanan RH (dropship). Dicatat sebagai SKU RH. -->
      <div id="jp-via-rh-wrap" style="display:none;margin:2px 0 12px;padding:10px 12px;border:2px solid var(--cream4);border-radius:8px;background:var(--cream2)">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:700;color:var(--ink)">
          <input type="checkbox" id="jp-via-rh" onchange="jpToggleViaRh()" style="width:18px;height:18px;margin:0;flex:none">
          <span>Kirim via RH (dropship)</span>
        </label>
        <div id="jp-via-rh-info" style="margin-top:5px;font-size:12px;color:var(--ink3);line-height:1.45"></div>
      </div>
      <!-- ── PICKER BOTTOM SHEET (ala BRImo): dipakai gantian buat SKU Induk
           & SKU Variasi (mode via _jpSkuSheetMode) — konsisten sama picker
           akun di Kas & Jurnal / supplier di Hutang Barang. ── -->
      <div id="jp-sku-sheet-overlay" onclick="if(event.target===this) jpSkuSheetClose()"></div>
      <div id="jp-sku-sheet">
        <button type="button" id="jp-sku-sheet-close" onclick="jpSkuSheetClose()" aria-label="Tutup"><i class="ti ti-x"></i></button>
        <div id="jp-sku-sheet-handle"></div>
        <div id="jp-sku-sheet-title">Pilih SKU</div>
        <div id="jp-sku-sheet-search-wrap">
          <input type="text" id="jp-sku-sheet-search" placeholder="Cari..." autocomplete="off"
            autocorrect="off" autocapitalize="none" spellcheck="false"
            oninput="jpSkuSheetFilter(this.value)">
        </div>
        <div id="jp-sku-sheet-list"></div>
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

      <!-- List sementara sebelum simpan -->
      <div id="jp-pending-list" style="display:none;margin-bottom:12px">
        <div style="font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">
          Akan Disimpan <span id="jp-pending-count" style="color:var(--ok)">0</span> item
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse" id="jp-pending-tbl">
          <thead>
            <tr style="color:var(--ink3);border-bottom:1px solid var(--cream4)">
              <th style="text-align:left;padding:3px 4px">SKU</th>
              <th style="text-align:right;padding:3px 4px">Qty</th>
              <th style="text-align:right;padding:3px 4px">Harga</th>
              <th style="text-align:right;padding:3px 4px">Total</th>
              <th style="width:24px"></th>
            </tr>
          </thead>
          <tbody id="jp-pending-tbody"></tbody>
        </table>
      </div>

      <!-- Tombol aksi -->
      <div class="modal-actions"
        style="border-top:1.5px dashed var(--ink3);padding-top:12px;display:flex;align-items:center;justify-content:space-between">
        <button class="btn btn-sm btn-danger" onclick="jpHapusDariModal()" id="jp-btn-hapus" style="display:none;flex:0 0 auto">
          <i class="ti ti-trash"></i> Hapus
        </button>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-left:auto">
          <button class="btn btn-sm" onclick="closeModalJP()" id="jp-btn-batal"
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
  </div>

  <!-- ═══ TAB PANE: JURNAL ═══ -->
  <div id="jp-pane-jurnal" style="display:flex;flex-direction:column;flex:1;min-height:0">

  <!-- MINI METRICS TAB 1 -->
  <div class="metrics" style="margin:10px 0 8px">
    <div class="metric">
      <div class="m-label">Total Penjualan</div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:2px 8px"><div class="m-value" id="jp-total-penjualan">—</div><span class="jp-delta" id="jp-delta-penjualan" style="display:none"></span></div>
      <div class="m-delta">semua transaksi</div>
    </div>
    <div class="metric">
      <div class="m-label">Total Item Terjual</div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:2px 8px"><div class="m-value" id="jp-total-item">—</div><span class="jp-delta" id="jp-delta-item" style="display:none"></span></div>
      <div class="m-delta">qty keseluruhan</div>
    </div>
  </div>

  <!-- TABEL -->
  <div class="card" id="jp-table-card">
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

  // Tab TREN di laptop/desktop (non-touch): lepas kunci overflow, murni pakai
  // scroll native browser (wheel, scrollbar, trackpad, keyboard — semua otomatis
  // jalan tanpa JS tambahan). Tab JURNAL, atau device touch: tetap overflow:hidden
  // karena tabelnya butuh layout freeze (sticky header + scroll internal jp-tbl-wrap).
  // .content selalu overflow:hidden — scroll ditangani jp-pane-tren / jp-tbl-wrap sendiri.
  // Ini menghilangkan race condition overflow yang bikin chart terpotong di laptop.
  var contentEl = document.querySelector('.content');
  if (contentEl) {
    contentEl.style.overflow      = 'hidden';
    contentEl.style.overflowY     = 'hidden';
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

// orientationchange: portrait ↔ landscape — re-apply flex layout setelah browser selesai resize
window.addEventListener('orientationchange', function() {
  var pg = document.getElementById('page-jurnal-penjualan');
  if (!pg || !pg.classList.contains('active')) return;
  // Delay 300ms: beri waktu browser selesai relayout setelah rotasi
  setTimeout(_jpEnsureFlexLayout, 300);
});

// ─── STATE ───────────────────────────────────────────────────
let _jpAllData    = [];
let _jpChannelMap = {};
let _jpChartPoints = []; // titik chart Tren Penjualan, untuk tooltip hover
let _jpProdukList = [];
 // default: bulan ini
let _jpSisakMap   = {}; // stok sisa per SKU (uppercase), diisi saat render tabel
let _jpDsMap      = {}; // SKU (uppercase) → true kalau produk dropship (tidak nyetok → Sisa Stok tampil "DS", bukan angka minus). Aturannya di zIsDropship() (supabase.js)
let _jpChartRenderToken = 0; // token untuk cancel render chart lama sebelum render baru

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
// Geser tanggal 'YYYY-MM-DD' sebanyak n hari (pakai komponen Y/M/D lokal, bukan ms).
function _jpAddDays(dateStr, n) {
  var p = String(dateStr).split('-');
  return _jpLocalDate(new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10) + n));
}
// Format timestamp lokal presisi jam:menit:detik — dibutuhkan buat filter
// "Minggu Ini" yang batas atasnya bukan pas ganti hari (00:00) tapi jam
// 19:30 Sabtu (bukan tengah malam kayak mode lain).
// Hitung rentang "Minggu Ini": Minggu 00:00 s/d Sabtu jam CUTOFF (lihat
// _JP_MINGGU_CUTOFF_H/_M di bawah). Kalau waktu sekarang udah lewat cutoff
// Sabtu minggu berjalan, otomatis geser ke minggu berikutnya (Minggu depan
// s/d Sabtu depan cutoff) — sesuai aturan user (12 Sep 2026): "lebih dari
// itu masuk ke minggu berikutnya".
// ⚠️ 26 Sep 2026: komentar/kode lama nulis cutoff jam 19:30, tapi user bilang
// yang pernah diminta itu jam 20:00 — dibiarkan 19:30 dulu (belum diubah
// sepihak sesuai rules), tinggal ganti 2 angka di bawah begitu dikonfirmasi.
var _JP_MINGGU_CUTOFF_H = 19, _JP_MINGGU_CUTOFF_M = 30;
function _jpMingguIniRange(now) {
  var dow = now.getDay(); // 0=Minggu .. 6=Sabtu
  var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow, 0, 0, 0);
  var cutoff = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, _JP_MINGGU_CUTOFF_H, _JP_MINGGU_CUTOFF_M, 0);
  if (now.getTime() > cutoff.getTime()) {
    start  = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7, 0, 0, 0);
    cutoff = new Date(cutoff.getFullYear(), cutoff.getMonth(), cutoff.getDate() + 7, _JP_MINGGU_CUTOFF_H, _JP_MINGGU_CUTOFF_M, 0);
  }
  return { start: start, cutoff: cutoff };
}
// 3 Okt 2026 — DEFINISI MINGGU TUNGGAL (Minggu Ini & Minggu Lalu).
// Aturan user: 1 minggu = dari Sabtu 19.30 (minggu sebelumnya, TIDAK termasuk) s/d Sabtu 19.30 (termasuk).
// Entri Sabtu lewat 19.30 masuk minggu BERIKUTNYA. Dulu cuma sisi akhir yang diterapkan (Sabtu lewat cutoff
// dibuang dari minggu yang tutup) sedangkan sisi awal tidak (minggu berikutnya query dari Minggu 00.00) →
// entri Sabtu lewat cutoff tidak masuk minggu manapun. Minggu Lalu juga dulu pakai kalender biasa (tanpa cutoff)
// sehingga selisih satu minggu begitu cutoff lewat. offset: 0 = Minggu Ini, -1 = Minggu Lalu.
// Return: { start (Minggu 00.00, utk sumbu chart), cutoff (Sabtu 19.30 akhir minggu), prevCutoff (Sabtu 19.30 awal minggu) }
function _jpMingguRange(now, offset) {
  var base = _jpMingguIniRange(now);
  var o = offset || 0;
  var start      = new Date(base.start.getFullYear(),  base.start.getMonth(),  base.start.getDate()  + 7 * o, 0, 0, 0);
  var cutoff     = new Date(base.cutoff.getFullYear(), base.cutoff.getMonth(), base.cutoff.getDate() + 7 * o, _JP_MINGGU_CUTOFF_H, _JP_MINGGU_CUTOFF_M, 0);
  var prevCutoff = new Date(cutoff.getFullYear(),      cutoff.getMonth(),      cutoff.getDate() - 7,          _JP_MINGGU_CUTOFF_H, _JP_MINGGU_CUTOFF_M, 0);
  return { start: start, cutoff: cutoff, prevCutoff: prevCutoff };
}
function _jpWeekOffsetOfMode(mode) { return mode === 'minggu-ini' ? 0 : (mode === 'minggu-lalu' ? -1 : null); }
// Rentang minggu yang AKTIF. Disimpan saat data dimuat (_jpWeekRngAktif) supaya filter tabel, total, dan chart
// memakai batas yang SAMA dgn query walau jam cutoff terlewati saat halaman terbuka.
var _jpWeekRngAktif = null;   // { mode, rng }
function _jpMingguRangeAktif(mode, now) {
  var off = _jpWeekOffsetOfMode(mode);
  if (off === null) return null;
  if (_jpWeekRngAktif && _jpWeekRngAktif.mode === mode) return _jpWeekRngAktif.rng;
  return _jpMingguRange(now || new Date(), off);
}
function _jpJamStr(d) { return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
// Apakah 1 baris jurnal masuk minggu ini? Dicek di CLIENT SIDE (bukan lewat query bertimestamp): root cause bug
// 26 Sep 2026 — kolom `tanggal` di Supabase diduga bertipe DATE, jadi batas `T19:30` terpotong jadi tanggalnya saja dan
// seluruh hari Sabtu ikut tersingkir. Query cuma pakai batas TANGGAL PENUH (aman utk tipe kolom apapun); pemotongan jam
// cutoff dilakukan di sini dengan membandingkan "YYYY-MM-DDTHH:MM" (tanggal + kolom `waktu`).
function _jpRowDalamMinggu(row, rng) {
  var tgl = String(row.tanggal || '').slice(0, 10);
  if (!tgl) return false;
  var key = tgl + 'T' + String(row.waktu || '00:00').slice(0, 5);
  var lo  = _jpLocalDate(rng.prevCutoff) + 'T' + _jpJamStr(rng.prevCutoff);
  var hi  = _jpLocalDate(rng.cutoff)     + 'T' + _jpJamStr(rng.cutoff);
  return key > lo && key <= hi;
}
// Tanggal kelompok utk sumbu chart: entri Sabtu (awal minggu) lewat cutoff dihitung ke hari Minggu berikutnya,
// supaya total chart = total tabel (sumbu chart Minggu..Sabtu).
function _jpTglChart(row, mode) {
  var tgl = String(row.tanggal || '').slice(0, 10);
  var rng = _jpMingguRangeAktif(mode);
  if (rng && tgl === _jpLocalDate(rng.prevCutoff)) {
    return _jpLocalDate(new Date(rng.prevCutoff.getFullYear(), rng.prevCutoff.getMonth(), rng.prevCutoff.getDate() + 1));
  }
  return tgl;
}

// 19 Sep 2026: dulu sumbu-X chart Tren Penjualan dibangun cuma dari tanggal
// yang ADA transaksinya — kalau hari pertama periode kosong (misal Minggu
// tanggal 13 gak ada penjualan), chart "loncat" mulai dari hari pertama yang
// ADA datanya (14 Sep), bukan dari awal periode beneran. DIKONFIRMASI user —
// harus konsisten mulai dari awal periode, hari kosong tetap tampil (Rp0).
// Helper ini bikin rentang tanggal FIX (bukan dari isi data) yang PERSIS
// sama kayak filter query di loadJurnalPenjualan(), per mode. Return null
// buat 'semua' (gak ada batas pasti secara alami — tetap data-driven).
function _jpChartDateRange(mode, now) {
  if (mode === 'minggu-ini' || mode === 'minggu-lalu') {
    var rng = _jpMingguRangeAktif(mode, now);
    var end = new Date(rng.start.getFullYear(), rng.start.getMonth(), rng.start.getDate() + 6);
    return { start: _jpLocalDate(rng.start), end: _jpLocalDate(end) };
  }
  if (mode === '7hari') {
    return { start: _jpLocalDate(new Date(now.getTime() - 7*24*60*60*1000)), end: _jpLocalDate(now) };
  }
  if (mode === 'bulan-ini') {
    // 3 Okt 2026: tanggal 1 s/d hari terakhir bulan berjalan (sama persis dgn query-nya)
    return {
      start: _jpLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      end:   _jpLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    };
  }
  if (mode === 'minggu') {
    const dari   = (document.getElementById('jp-filter-minggu-dari') || {}).value || '';
    const sampai = (document.getElementById('jp-filter-minggu-sampai') || {}).value || '';
    if (!dari || !sampai) return null;
    return { start: dari, end: sampai };
  }
  if (mode === 'tahun') {
    const fTahun = (document.getElementById('jp-filter-tahun') || {}).value || '';
    if (!fTahun) return null;
    return { start: fTahun + '-01-01', end: fTahun + '-12-31' };
  }
  if (mode === 'bulan') {
    var fBulan = (document.getElementById('jp-filter-bulan') || {}).value || '';
    if (!fBulan) return null;
    var bParts = fBulan.split('-'); var by = parseInt(bParts[0]); var bm = parseInt(bParts[1]);
    var lastDay = new Date(by, bm, 0).getDate(); // hari terakhir bulan itu
    return {
      start: by + '-' + String(bm).padStart(2,'0') + '-01',
      end:   by + '-' + String(bm).padStart(2,'0') + '-' + String(lastDay).padStart(2,'0')
    };
  }
  return null; // 'semua' & fallback lain: tetap data-driven (gak ada batas alami)
}

// ─── MODAL ───────────────────────────────────────────────────
function jpOverlayClose(e) {
  if (e.target === document.getElementById('modal-jp')) closeModalJP();
}
function closeModalJP() {
  if (_jpIsSaving) return; // sedang proses simpan ke Supabase — jangan biarkan modal ditutup, biar tidak ada data yang "lolos" tercatat setelah dibatalkan
  _jpPendingItems = [];
  var list = document.getElementById('jp-pending-list');
  if (list) list.style.display = 'none';
  document.getElementById('modal-jp').classList.remove('open');
  jpTutupDropdownSKU();
}

// Kunci/lepas tombol Batal & X selama dbInsert/dbUpdate JP berjalan,
// supaya user tidak mengira aksi batal mereka diabaikan diam-diam.
function _jpSetCancelLocked(locked) {
  var batal = document.getElementById('jp-btn-batal');
  var x     = document.getElementById('jp-btn-close-x');
  [batal, x].forEach(function(btn) {
    if (!btn) return;
    btn.disabled = locked;
    btn.style.opacity = locked ? '0.4' : '';
    btn.style.cursor = locked ? 'not-allowed' : 'pointer';
  });
}

// ─── LOAD CHANNEL ────────────────────────────────────────────
async function loadChannelDropdownJP() {
  try {
    const data = await dbGet('channels', '&order=nama.asc');
    if (!data || !data.length) return;

    _jpChannelMap = {};
    data.forEach(ch => { _jpChannelMap[ch.id] = ch; });
    _jpChannelList = data.slice();   // 3 Okt 2026: urutan asli (nama asc) utk tab Channel di sheet filter

    // Label + icon per kategori
    const katConfig = {
      toko_utama: { label: 'Toko Utama',  icon: 'shopee'   },
      reseller:   { label: 'Dropship',    icon: 'reseller' },   // key DB reseller = Dropship (ganti nama)
      reseller_baru: { label: 'Reseller', icon: 'reseller' },
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
    var fcEl = document.getElementById('jp-filter-channel');
    if (fcEl) fcEl.value = ''; // reset hidden input

    _jpFilterBtnSync();
    _jpPerRefreshIfOpen();   // kalau sheet filter sedang terbuka, gambar ulang tab Channel
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

// ─── PRODUK PER CHANNEL (channel_produk) ─────────────────────
// [30 Sep 2026] Pilihan SKU di modal Tambah Penjualan HANYA menampilkan katalog yang sudah ditambahkan ke channel
// terpilih (Channel Master → ikon Produk). Channel yang belum punya produk = daftar KOSONG + alert (sengaja,
// produk ditambah manual dulu di Channel Master). Belum pilih channel = semua produk (belum ada acuan).
// Kalau tabel channel_produk gagal dibaca → jatuh balik ke semua produk supaya input penjualan tidak terblokir.
// Transaksi lama (edit) tidak terpengaruh: filter cuma berlaku untuk pemilihan SKU lewat picker.
var _jpChProdukCache = { chId: null, set: null };   // set = { katalog: true } atau null (= tanpa filter)

async function _jpLoadChProduk(chId) {
  chId = String(chId || '');
  if (!chId) { _jpChProdukCache = { chId: '', set: null }; return; }
  try {
    var rows = await dbGet('channel_produk', '&channel_id=eq.' + encodeURIComponent(chId));
    var set = {};
    (rows || []).forEach(function(r) { if (r.katalog) set[r.katalog] = true; });
    _jpChProdukCache = { chId: chId, set: set };
  } catch (e) {
    console.warn('channel_produk gagal dibaca, filter SKU per channel dimatikan:', e);
    _jpChProdukCache = { chId: chId, set: null };
  }
}

// undefined = belum dimuat untuk channel yang sedang dipilih; selain itu = array produk yang boleh dipilih
function _jpAllowedProduk() {
  var chId = String(document.getElementById('jp-channel').value || '');
  if (!chId) return _jpProdukList;
  if (_jpChProdukCache.chId !== chId) return undefined;
  var set = _jpChProdukCache.set;
  if (!set) return _jpProdukList;
  return _jpProdukList.filter(function(p) { return !!set[_jpGetKatalog(p)]; });
}

function _jpChannelKosong() {   // channel terpilih + sudah dimuat + tidak ada produk sama sekali
  var chId = String(document.getElementById('jp-channel').value || '');
  return !!chId && _jpChProdukCache.chId === chId && !!_jpChProdukCache.set && Object.keys(_jpChProdukCache.set).length === 0;
}

// Dipanggil setelah channel dipilih di picker: muat produk channel, alert kalau kosong, reset SKU yang tidak berlaku
async function _jpOnChannelChosen(id) {
  await _jpLoadChProduk(id);
  if (String(document.getElementById('jp-channel').value || '') !== String(id || '')) return;   // sudah ganti lagi
  if (!id) return;
  var ch = _jpChannelMap[id];
  if (_jpChannelKosong()) {
    alert('Channel "' + (ch ? ch.nama : '') + '" belum punya produk.\n\nTambahkan dulu di menu Channel: klik ikon 📦 pada channel ini, pilih produk, lalu Tambah.');
  }
  // Transaksi baru saja: SKU yang sudah terpilih tapi tidak ada di channel ini di-reset supaya tidak salah masuk
  if (!document.getElementById('jp-id').value) {
    var kat = document.getElementById('jp-sku-induk').value;
    if (kat) {
      var allowed = _jpAllowedProduk() || [];
      var ok = allowed.some(function(p) { return _jpGetKatalog(p) === kat; });
      if (!ok) {
        document.getElementById('jp-sku-induk').value = '';
        _jpSetIndukLabel(null);
        document.getElementById('jp-sku-variasi').innerHTML = '<option value="">— Pilih Variasi —</option>';
        var lblV = document.getElementById('jp-picker-variasi-label');
        if (lblV) { lblV.textContent = '— Pilih Variasi —'; lblV.style.color = 'var(--ink3)'; }
        idrSet('jp-harga', 0);
        idrSet('jp-total', 0);
        var bt = document.getElementById('jp-btn-tambah-sku');
        if (bt) bt.style.display = 'none';
        _jpRenderPending();
      }
    }
  }
}

// ─── SKU HELPERS ─────────────────────────────────────────────
function _jpGetKatalog(p) { return p.katalog || p.nama_katalog || p.catalog || p.nama || ''; }
function _jpGetSku(p)     { return p.sku || p.sku_variasi || p.kode || ''; }
// [30 Sep 2026] Urutan variasi = aturan yang sama dgn Kelola Produk (per warna A-Z, lalu size S<M<L<XL<XXL). Pakai _produkSortWarnaSize (produk.js); kalau belum ada → urutan asli.
function _jpSortVariasi(list) {
  if (typeof _produkSortWarnaSize !== 'function') return list;
  var wrap = list.map(function(p) { return { sku_variasi: _jpGetSku(p), _p: p }; });
  return _produkSortWarnaSize(wrap).map(function(w) { return w._p; });
}

// ── SKU Resolver: normalize + validasi vs produk list ──────────────────────
// Return: { sku: string, ok: boolean, warned: boolean }
function _jpResolveSku(raw) {
  const all = _jpProdukList.map(p => _jpGetSku(p)).filter(Boolean);

  // Helper: normalize spasi/underscore dan lowercase untuk compare
  const _norm = s => s.replace(/[\s_]+/g, '_').replace(/__+/g, '_').toLowerCase();

  // 1. Exact match
  if (all.includes(raw)) return { sku: raw.toUpperCase(), ok: true };

  // 2. Normalize: uppercase sudah — coba spasi → underscore, strip double spaces
  const norm = raw.replace(/\s+/g, '_').replace(/__+/g, '_');
  if (all.includes(norm)) return { sku: norm.toUpperCase(), ok: true };

  // 3. Case-insensitive match
  const lower = norm.toLowerCase();
  const found = all.find(s => s.toLowerCase() === lower);
  if (found) return { sku: found.toUpperCase(), ok: true };

  // 4. Normalize kedua sisi: anggap spasi dan underscore equivalen
  //    Ini fix case "TURTLENECK_ABU TUA-M" vs "Turtleneck_Abu Tua-M"
  const normRaw = _norm(raw);
  const found2  = all.find(s => _norm(s) === normRaw);
  if (found2) return { sku: found2.toUpperCase(), ok: true };

  // 5. Tidak ketemu — kembalikan as-is uppercase, tandai warn
  return { sku: raw.toUpperCase(), ok: false };
}
function _jpGetHpp(p)     { return p.hpp || p.harga_pokok || p.cost || 0; }







// (Renderer list variasi lama dicabut 4 Sep 2026 — diganti _jpSkuSheetRenderVariasi
// yang render ke sheet BRImo baru, bukan floating dropdown .kas-akun-list.)

async function jpPilihKatalog(katalog) {
  document.getElementById('jp-sku-induk').value = katalog;
  _jpSetIndukLabel(katalog);
  jpTutupDropdownSKU();
  const varList = _jpSortVariasi(_jpProdukList.filter(p => _jpGetKatalog(p) === katalog));
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
  // Refresh sisa stok di background — sheet variasi baca dari _jpSisakMap pas dibuka/render
  _jpRefreshSisakMap();
  // Reset label picker variasi
  var lbl = document.getElementById('jp-picker-variasi-label');
  if (lbl) { lbl.textContent = '— Pilih Variasi —'; lbl.style.color = 'var(--ink3)'; }
  _jpRenderPending();   // pilihan variasi lama terhapus -> baris live hilang sampai variasi baru dipilih

  if (varList.length === 1) {
    sel.selectedIndex = 1;
    jpOnPilihVariasi();
    if (lbl) { lbl.textContent = _jpGetSku(varList[0]); lbl.style.color = 'var(--ink)'; }
    var btnTambah = document.getElementById('jp-btn-tambah-sku');
    if (btnTambah) btnTambah.style.display = 'block';
  } else if (varList.length > 1) {
    setTimeout(function() { jpSkuSheetOpen('variasi'); }, 250);
  }
}

function jpOnPilihVariasi() {
  const sel = document.getElementById('jp-sku-variasi');
  const opt = sel.options[sel.selectedIndex];
  if (!opt || !opt.dataset.hpp) { _jpRenderPending(); return; }
  const hpp = parseInt(opt.dataset.hpp) || 0;
  if (!hpp) { _jpRenderPending(); return; }
  const hargaEl = document.getElementById('jp-harga');
  // [30 Sep 2026] Harga Satuan = HPP dari Kelola Produk (bukan lagi HPP x (1+Beban+NPM) dari channel_beban).
  hargaEl.value = hpp;
  hitungTotalJP();   // hitungTotalJP sudah me-render daftar "Akan Disimpan" (baris live)
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
  _jpRenderPending();   // 4 Okt 2026: baris live di daftar "Akan Disimpan" ikut berubah
}

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadJurnalPenjualan() {
  const tbody = document.getElementById('jp-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>';
  try {
    const mode = _jpWaktuMode || 'minggu-ini';
    const now  = new Date();
    let filter = '';

    // Kolom `tanggal` di Supabase bertipe timestamp (ada komponen jam),
    // jadi batas atas SELALU pakai `lt.<hari_besok>` (exclusive), BUKAN
    // `lte.<hari_ini>` — karena `lte.<tanggal>` diartikan PostgREST sebagai
    // "<= tanggal 00:00:00", yang memotong semua entri di atas jam 00:00
    // pada hari itu sendiri. Pola: gte = awal periode (00:00), lt = hari
    // setelah akhir periode (jadi otomatis mencakup s/d 23:59:59 akhir periode).
    if (mode === 'hari-ini') {
      const today = _jpLocalDate(now);
      const besok = _jpLocalDate(new Date(now.getTime() + 24*60*60*1000));
      filter = '&tanggal=gte.' + today + '&tanggal=lt.' + besok;
    } else if (mode === 'kemarin') {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      const tgl   = _jpLocalDate(d);
      const today = _jpLocalDate(now); // hari ini = batas atas eksklusif utk kemarin
      filter = '&tanggal=gte.' + tgl + '&tanggal=lt.' + today;
    } else if (mode === 'minggu-ini' || mode === 'minggu-lalu') {
      // 3 Okt 2026: query ambil TANGGAL PENUH dari Sabtu awal minggu (prevCutoff) s/d Sabtu akhir minggu (cutoff),
      // supaya entri Sabtu-lewat-cutoff minggu sebelumnya ikut terambil. Potongan jam persisnya (> prevCutoff,
      // <= cutoff) dilakukan di filterJP() lewat _jpRowDalamMinggu() — lihat komentar _jpMingguRange.
      var rng = _jpMingguRange(now, _jpWeekOffsetOfMode(mode));
      _jpWeekRngAktif = { mode: mode, rng: rng };
      var besokCutoff = new Date(rng.cutoff.getFullYear(), rng.cutoff.getMonth(), rng.cutoff.getDate() + 1);
      filter = '&tanggal=gte.' + _jpLocalDate(rng.prevCutoff) + '&tanggal=lt.' + _jpLocalDate(besokCutoff);
    } else if (mode === 'bulan-ini') {
      // 3 Okt 2026: Bulan Ini = tgl 1 bulan berjalan s/d akhir bulan (batas atas eksklusif = tgl 1 bulan depan)
      const awalBulan  = _jpLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
      const bulanDepan = _jpLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
      filter = '&tanggal=gte.' + awalBulan + '&tanggal=lt.' + bulanDepan;
    } else if (mode === '7hari') {
      const since = _jpLocalDate(new Date(now.getTime() - 7*24*60*60*1000));
      const besok = _jpLocalDate(new Date(now.getTime() + 24*60*60*1000));
      filter = '&tanggal=gte.' + since + '&tanggal=lt.' + besok;
    } else if (mode === 'minggu') {
      const dari   = (document.getElementById('jp-filter-minggu-dari')||{}).value || '';
      const sampai = (document.getElementById('jp-filter-minggu-sampai')||{}).value || '';
      if (dari && sampai) {
        const besok = _jpLocalDate(new Date(new Date(sampai+'T00:00:00').getTime() + 24*60*60*1000));
        filter = '&tanggal=gte.' + dari + '&tanggal=lt.' + besok;
      }
    } else if (mode === 'tahun') {
      const fTahun = (document.getElementById('jp-filter-tahun')||{}).value || '';
      if (fTahun) {
        const from       = fTahun + '-01-01';
        const tahunDepan = (parseInt(fTahun)+1) + '-01-01';
        filter = '&tanggal=gte.' + from + '&tanggal=lt.' + tahunDepan;
      }
    } else if (mode === 'bulan') {
      const fBulan = (document.getElementById('jp-filter-bulan')||{}).value || '';
      if (fBulan) {
        const [y, m] = fBulan.split('-');
        const from        = y + '-' + m + '-01';
        const bulanDepan  = parseInt(m) === 12
          ? (parseInt(y)+1) + '-01-01'
          : y + '-' + String(parseInt(m)+1).padStart(2,'0') + '-01';
        filter = '&tanggal=gte.' + from + '&tanggal=lt.' + bulanDepan;
      }
    } else if (mode === 'hari') {
      // 3 Okt 2026: satu hari pilihan dari picker HP (hidden #jp-filter-hari).
      // Pola sama dgn mode lain: gte = hari itu 00:00, lt = hari berikutnya.
      var fHari = (document.getElementById('jp-filter-hari') || {}).value || _jpLocalDate(now);
      filter = '&tanggal=gte.' + fHari + '&tanggal=lt.' + _jpAddDays(fHari, 1);
    } else if (mode === 'semua') {
      filter = '';
    }

    const data = await dbGet('jurnal_penjualan', filter + '&order=tanggal.desc,id.desc');
    _jpAllData = data || [];
    filterJP();
    _jpLoadPrev(mode, now); // [8 Okt 2026] periode pembanding untuk badge △/▽ (async, tidak menahan tabel)
    jpLoadTargetHarian(); // progress bar target harian
    _jpRefreshSisakMap(); // refresh sisa stok all-time untuk picker (async, non-blocking)
    // Re-apply flex layout setelah data selesai — pastikan portrait juga flat seperti landscape
    _jpEnsureFlexLayout();
  } catch(err) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--danger)">Error: ' + err.message + '</td></tr>';
  }
}


// ─── FILTER WAKTU BERGAYA SHOPEE ─────────────────────────────
var _jpWaktuMode = 'minggu-ini'; // default: Minggu Ini (18 Sep 2026, permintaan user — sebelumnya 7hari)


// ─── HELPER: posisikan panel tepat di bawah tombol (fixed) ───

var _JP_NAMA_BULAN_PENDEK = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

// ═══ PICKER FILTER (PERIODE + CHANNEL) — 1 SHEET UNTUK HP & LAPTOP (3 Okt 2026) ═══
// Menggantikan 2 tombol terpisah (Periode & Channel) dan 2 sistem picker
// (panel radio melayang di laptop + bottom sheet di HP) dengan SATU tombol
// (#jp-filter-btn-laptop / #jp-filter-btn) → SATU sheet (#jp-per-sheet) berisi
// 2 tab: Periode | Channel. Isi & logic sama persis di laptop dan HP; bedanya
// cuma bentuk (CSS): HP = bottom sheet, laptop (>=768px & tinggi >520px) =
// dialog di tengah layar.
// Sheet TIDAK punya logic query sendiri. Alurnya:
//   buka sheet -> salin state aktif ke _jpDraft -> user ubah draft (periode/channel)
//   -> tombol Terapkan (jpFilterApply) menulis draft ke state aktif:
//      _jpWaktuMode + hidden input yang sudah dipakai loadJurnalPenjualan()/filterJP()
//      (jp-filter-minggu-dari/sampai, jp-filter-bulan, jp-filter-tahun, jp-filter-hari,
//      jp-filter-channel) lalu memanggil loadJurnalPenjualan() (kalau periode berubah)
//      atau filterJP() (kalau cuma channel berubah).
// Tutup tanpa Terapkan = draft dibuang, filter aktif tidak berubah.
// Preset "Bulan Lalu / 3 Bulan Terakhir" disimpan sebagai mode 'minggu'
// (rentang dari-sampai) supaya query & chart tidak perlu diubah; labelnya dikenali
// lagi lewat _jpPerPresetOf().
// State aktif disimpan di hidden input #jp-filter-state (dibuat IIFE "STATE FILTER AKTIF").
var _JP_PER_ITEMS = [
  { k: 'minggu-ini',  l: 'Minggu Ini' },
  { k: 'minggu-lalu', l: 'Minggu Lalu' },   // 3 Okt 2026: mode sendiri (bukan preset rentang tanggal) supaya ikut cutoff Sabtu 19.30
  { k: 'bulan-ini',   l: 'Bulan Ini' },
  { k: 'bulan-lalu',  l: 'Bulan Lalu',        preset: true },
  { k: 'hari-ini',    l: 'Hari Ini' },
  { k: 'kemarin',     l: 'Kemarin' },
  { k: '7hari',       l: '7 Hari Terakhir' },
  { k: '3bulan',      l: '3 Bulan Terakhir',  preset: true },
  { k: 'hari',        l: 'Hari',   sub: true },
  { k: 'minggu',      l: 'Minggu', sub: true },
  { k: 'bulan',       l: 'Bulan',  sub: true },
  { k: 'tahun',       l: 'Tahun',  sub: true },
  { k: 'semua',       l: 'Semua' }
];
var _JP_PER_PRESET_KEYS = ['bulan-lalu', '3bulan'];
var _JP_PER_SHORT = { 'hari-ini': 'Hari Ini', 'kemarin': 'Kemarin', '7hari': '7 Hari', 'minggu-ini': 'Minggu Ini', 'minggu-lalu': 'Minggu Lalu', 'bulan-ini': 'Bulan Ini', 'hari': 'Hari', 'minggu': 'Minggu', 'bulan': 'Bulan', 'tahun': 'Tahun', 'semua': 'Semua' };
var _JP_PER_TITLES = { list: 'Pilih Periode', channel: 'Pilih Channel', hari: 'Pilih Hari', minggu: 'Pilih Minggu', bulan: 'Pilih Bulan', tahun: 'Pilih Tahun' };
var _JP_NAMA_BULAN_PANJANG = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
var _JP_KAT_LABEL = { toko_utama: 'Toko Utama', reseller: 'Dropship', reseller_baru: 'Reseller', lazada: 'Lazada', tiktok: 'TikTok', offline: 'Offline' };   // sama dgn katConfig di loadChannelDropdownJP (key DB reseller = Dropship)
var _jpChannelList = [];   // urutan asli dari loadChannelDropdownJP (order nama asc) — _jpChannelMap kehilangan urutan karena key numerik
var _jpPer = { view: 'list', tab: 'periode', calY: 0, calM: 0, rStart: null, rEnd: null, bYear: 0 };
var _jpDraft = null;

function _jpPerVal(id) { return (document.getElementById(id) || {}).value || ''; }
function _jpPerPad(n) { return String(n).padStart(2, '0'); }
function _jpPerEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// 'YYYY-MM-DD' -> '30 Sep' (tambah tahun kalau bukan tahun berjalan)
function _jpPerFmt(str) {
  var p = String(str).split('-');
  if (p.length < 3) return '';
  var out = parseInt(p[2], 10) + ' ' + _JP_NAMA_BULAN_PENDEK[parseInt(p[1], 10) - 1];
  if (parseInt(p[0], 10) !== new Date().getFullYear()) out += ' ' + p[0];
  return out;
}

// State filter yang SEDANG AKTIF (sumber: _jpWaktuMode + hidden input).
function _jpPerCommitted() {
  return {
    mode:   _jpWaktuMode || 'minggu-ini',
    hari:   _jpPerVal('jp-filter-hari'),
    dari:   _jpPerVal('jp-filter-minggu-dari'),
    sampai: _jpPerVal('jp-filter-minggu-sampai'),
    bulan:  _jpPerVal('jp-filter-bulan'),
    tahun:  _jpPerVal('jp-filter-tahun'),
    ch:     _jpPerVal('jp-filter-channel')
  };
}
// Kunci periode: dipakai membandingkan apakah periode berubah (perlu fetch ulang) atau cuma channel.
function _jpPerKey(o) {
  var v = '';
  if (o.mode === 'hari')        v = o.hari;
  else if (o.mode === 'minggu') v = o.dari + '~' + o.sampai;
  else if (o.mode === 'bulan')  v = o.bulan;
  else if (o.mode === 'tahun')  v = o.tahun;
  return o.mode + '|' + v;
}
// Ringkasan pilihan utk mode yang butuh sub-input; '' kalau mode biasa.
function _jpPerSummary(o) {
  o = o || _jpPerCommitted();
  var mode = o.mode;
  if (mode === 'hari') return o.hari ? _jpPerFmt(o.hari) : '';
  if (mode === 'minggu') {
    var d = o.dari, e = o.sampai;
    if (!d) return '';
    if (!e || e === d) return _jpPerFmt(d);
    var pd = d.split('-'), pe = e.split('-');
    if (pd[0] === pe[0] && pd[1] === pe[1]) return parseInt(pd[2], 10) + '–' + _jpPerFmt(e);
    return _jpPerFmt(d) + '–' + _jpPerFmt(e);
  }
  if (mode === 'bulan') {
    if (!o.bulan) return '';
    var pb = o.bulan.split('-');
    return _JP_NAMA_BULAN_PENDEK[parseInt(pb[1], 10) - 1] + ' ' + pb[0];
  }
  if (mode === 'tahun') return o.tahun || '';
  return '';
}

// Rentang tanggal preset (relatif terhadap hari ini). Minggu Lalu BUKAN preset lagi (3 Okt 2026) — lihat _jpMingguRange.
function _jpPerPresetRange(key) {
  var n = new Date(), s, e;
  if (key === 'bulan-lalu') {
    s = new Date(n.getFullYear(), n.getMonth() - 1, 1);
    e = new Date(n.getFullYear(), n.getMonth(), 0);
  } else if (key === '3bulan') {
    s = new Date(n.getFullYear(), n.getMonth() - 2, 1);
    e = n;
  } else return null;
  return { s: _jpLocalDate(s), e: _jpLocalDate(e) };
}
// Kenali apakah rentang dari-sampai persis sama dgn salah satu preset hari ini; '' kalau bukan.
function _jpPerPresetOf(dari, sampai) {
  if (!dari || !sampai) return '';
  for (var i = 0; i < _JP_PER_PRESET_KEYS.length; i++) {
    var r = _jpPerPresetRange(_JP_PER_PRESET_KEYS[i]);
    if (r && r.s === dari && r.e === sampai) return _JP_PER_PRESET_KEYS[i];
  }
  return '';
}
function _jpPerPresetLabel(key) {
  for (var i = 0; i < _JP_PER_ITEMS.length; i++) if (_JP_PER_ITEMS[i].k === key) return _JP_PER_ITEMS[i].l;
  return key;
}

// ── Label tombol gabungan: "Minggu Ini" / "Minggu Ini · Shopee" ──
function _jpFilterLabel() {
  var c = _jpPerCommitted();
  var txt;
  if (c.mode === 'minggu') {
    var pk = _jpPerPresetOf(c.dari, c.sampai);
    txt = pk ? _jpPerPresetLabel(pk) : (_jpPerSummary(c) || 'Minggu');
  } else if (c.mode === 'hari' || c.mode === 'bulan' || c.mode === 'tahun') {
    txt = _jpPerSummary(c) || _JP_PER_SHORT[c.mode];
  } else {
    txt = _JP_PER_SHORT[c.mode] || 'Hari Ini';
  }
  if (c.ch && _jpChannelMap[c.ch]) txt += ' · ' + _jpChannelMap[c.ch].nama;
  return txt;
}
function _jpFilterBtnSync() {
  var lbl = _jpFilterLabel();
  var c = _jpPerCommitted();
  var aktif = c.mode !== 'minggu-ini' || !!c.ch;   // titik indikator kalau filter bukan default
  document.querySelectorAll('.jp-filter-label').forEach(function(e) { e.textContent = lbl; });
  document.querySelectorAll('.jp-filter-badge').forEach(function(e) { e.style.display = aktif ? 'inline' : 'none'; });
  document.querySelectorAll('.jp-filter-btn').forEach(function(b) { b.title = lbl; });
}

function jpPerSheetOpen() {
  var ov = document.getElementById('jp-per-overlay');
  var sh = document.getElementById('jp-per-sheet');
  if (!ov || !sh) return;
  _jpDraft = _jpPerCommitted();
  _jpPer.view = 'list';
  _jpPer.tab  = 'periode';
  _jpPerRender(false);
  sh.style.transition = '';
  sh.style.transform = '';
  ov.classList.add('open');
  sh.classList.add('open');
}
function jpPerSheetClose() {
  var ov = document.getElementById('jp-per-overlay');
  var sh = document.getElementById('jp-per-sheet');
  if (ov) ov.classList.remove('open');
  if (sh) sh.classList.remove('open');
}
function jpPerBack() {
  _jpPer.view = 'list';
  _jpPerRender(false);
}
// Dipanggil setelah daftar channel selesai dimuat — kalau sheet sedang terbuka, gambar ulang.
function _jpPerRefreshIfOpen() {
  var sh = document.getElementById('jp-per-sheet');
  if (sh && sh.classList.contains('open') && _jpDraft) _jpPerRender(true);
}

function _jpPerRender(keepScroll) {
  var sh    = document.getElementById('jp-per-sheet');
  var body  = document.getElementById('jp-per-body');
  var title = document.getElementById('jp-per-title');
  if (!sh || !body || !_jpDraft) return;
  var v  = _jpPer.view;
  var st = body.scrollTop;
  if (v === 'list') sh.classList.remove('sub'); else sh.classList.add('sub');
  if (title) title.textContent = (v === 'list') ? (_jpPer.tab === 'channel' ? _JP_PER_TITLES.channel : _JP_PER_TITLES.list) : (_JP_PER_TITLES[v] || _JP_PER_TITLES.list);
  var tp = document.getElementById('jp-pt-periode'), tc = document.getElementById('jp-pt-channel');
  if (tp) tp.classList.toggle('active', _jpPer.tab === 'periode');
  if (tc) {
    tc.classList.toggle('active', _jpPer.tab === 'channel');
    tc.textContent = 'Channel' + (_jpDraft.ch ? ' ●' : '');
  }
  if (v === 'hari' || v === 'minggu') body.innerHTML = _jpPerCalHtml(v);
  else if (v === 'bulan')             body.innerHTML = _jpPerBulanHtml();
  else if (v === 'tahun')             body.innerHTML = _jpPerTahunHtml();
  else if (_jpPer.tab === 'channel')  body.innerHTML = _jpPerChannelHtml();
  else                                body.innerHTML = _jpPerListHtml();
  body.scrollTop = keepScroll ? st : 0;
}

function _jpPerListHtml() {
  var d   = _jpDraft;
  var cur = d.mode || 'minggu-ini';
  var presetAktif = (cur === 'minggu') ? _jpPerPresetOf(d.dari, d.sampai) : '';
  var html = '';
  _JP_PER_ITEMS.forEach(function(it) {
    var active;
    if (it.preset)           active = (cur === 'minggu' && presetAktif === it.k);
    else if (it.k === 'minggu') active = (cur === 'minggu' && !presetAktif);
    else                     active = (cur === it.k);
    var right;
    if (it.sub) {
      right = (active ? '<span class="jp-pl-sum">' + _jpPerSummary(d) + '</span>' : '') + '<i class="ti ti-chevron-right"></i>';
    } else {
      right = active ? '<i class="ti ti-check jp-pl-check"></i>' : '';
    }
    html += '<button type="button" class="jp-pl-item' + (active ? ' active' : '') + '" data-per="' + (it.sub ? 'sub' : (it.preset ? 'preset' : 'pick')) + '" data-val="' + it.k + '">'
      + '<span>' + it.l + '</span><span class="jp-pl-right">' + right + '</span></button>';
  });
  return html;
}

function _jpPerChRow(id, label, active) {
  return '<button type="button" class="jp-pl-item' + (active ? ' active' : '') + '" data-per="ch" data-val="' + _jpPerEsc(id) + '">'
    + '<span>' + _jpPerEsc(label) + '</span><span class="jp-pl-right">' + (active ? '<i class="ti ti-check jp-pl-check"></i>' : '') + '</span></button>';
}
function _jpPerChannelHtml() {
  var cur  = String(_jpDraft.ch || '');
  var html = _jpPerChRow('', 'Semua Channel', cur === '');
  if (!_jpChannelList.length) return html + '<div class="jp-pl-empty">Memuat channel…</div>';
  var grouped = {}, order = [];
  _jpChannelList.forEach(function(ch) {
    var k = ch.kategori || 'lainnya';
    if (!grouped[k]) { grouped[k] = []; order.push(k); }
    grouped[k].push(ch);
  });
  order.forEach(function(k) {
    html += '<div class="jp-pl-group">' + _jpPerEsc(_JP_KAT_LABEL[k] || k) + '</div>';
    grouped[k].forEach(function(ch) { html += _jpPerChRow(ch.id, ch.nama, String(ch.id) === cur); });
  });
  return html;
}

// Kalender 1 bulan: view 'hari' (pilih 1 tanggal) atau 'minggu' (pilih rentang awal→akhir,
// tombol "Pilih rentang"). Hasil masuk ke _jpDraft, baru berlaku setelah Terapkan.
function _jpPerCalHtml(view) {
  var y = _jpPer.calY, m = _jpPer.calM;
  var startDow = new Date(y, m, 1).getDay();           // 0 = Minggu (sama dgn definisi minggu di app)
  var dim      = new Date(y, m + 1, 0).getDate();
  var todayStr = _jpLocalDate(new Date());
  var selHari  = (view === 'hari' && _jpDraft.mode === 'hari') ? _jpDraft.hari : '';
  var st = _jpPer.rStart, en = _jpPer.rEnd;
  var html = '<div class="jp-pc-nav">'
    + '<button type="button" data-per="calnav" data-val="-1" aria-label="Bulan sebelumnya"><i class="ti ti-chevron-left"></i></button>'
    + '<div class="jp-pc-month">' + _JP_NAMA_BULAN_PANJANG[m] + ' ' + y + '</div>'
    + '<button type="button" data-per="calnav" data-val="1" aria-label="Bulan berikutnya"><i class="ti ti-chevron-right"></i></button>'
    + '</div><div class="jp-pc-grid">';
  ['Min','Sen','Sel','Rab','Kam','Jum','Sab'].forEach(function(n) { html += '<div class="jp-pc-dow">' + n + '</div>'; });
  for (var i = 0; i < startDow; i++) html += '<div></div>';
  for (var d = 1; d <= dim; d++) {
    var ds = y + '-' + _jpPerPad(m + 1) + '-' + _jpPerPad(d);
    var cls = 'jp-pc-day';
    if (ds === todayStr) cls += ' today';
    if (view === 'hari') {
      if (ds === selHari) cls += ' sel';
    } else {
      if ((st && ds === st) || (en && ds === en)) cls += ' sel';
      else if (st && en && ds > st && ds < en) cls += ' in-range';
    }
    html += '<button type="button" class="' + cls + '" data-per="day" data-val="' + ds + '">' + d + '</button>';
  }
  html += '</div>';
  if (view === 'minggu') {
    var lbl;
    if (st && en && en !== st) lbl = _jpPerFmt(st) + ' – ' + _jpPerFmt(en);
    else if (st && en)         lbl = _jpPerFmt(st);
    else if (st)               lbl = _jpPerFmt(st) + ' – …';
    else                       lbl = 'Ketuk tanggal awal';
    html += '<div class="jp-pc-foot"><div class="jp-pc-range">' + lbl + '</div>'
      + '<button type="button" class="jp-pc-apply" data-per="rangeok"' + (st ? '' : ' disabled') + '>Pilih rentang</button></div>';
  }
  return html;
}

function _jpPerBulanHtml() {
  var y   = _jpPer.bYear;
  var cur = (_jpDraft.mode === 'bulan') ? _jpDraft.bulan : '';
  var n   = new Date();
  var thisVal = n.getFullYear() + '-' + _jpPerPad(n.getMonth() + 1);
  var html = '<div class="jp-pc-nav">'
    + '<button type="button" data-per="bulannav" data-val="-1" aria-label="Tahun sebelumnya"><i class="ti ti-chevron-left"></i></button>'
    + '<div class="jp-pc-month">' + y + '</div>'
    + '<button type="button" data-per="bulannav" data-val="1" aria-label="Tahun berikutnya"><i class="ti ti-chevron-right"></i></button>'
    + '</div><div class="jp-pg">';
  for (var m = 0; m < 12; m++) {
    var val = y + '-' + _jpPerPad(m + 1);
    var cls = 'jp-pg-item' + (val === cur ? ' sel' : '') + (val === thisVal ? ' today' : '');
    html += '<button type="button" class="' + cls + '" data-per="bulan" data-val="' + val + '">' + _JP_NAMA_BULAN_PENDEK[m] + '</button>';
  }
  return html + '</div>';
}

function _jpPerTahunHtml() {
  var cur   = (_jpDraft.mode === 'tahun') ? String(_jpDraft.tahun) : '';
  var thisY = new Date().getFullYear();
  var html  = '<div class="jp-pg">';
  for (var y = thisY; y >= 2015; y--) {   // 2015 = batas min input tahun lama
    var cls = 'jp-pg-item' + (String(y) === cur ? ' sel' : '') + (y === thisY ? ' today' : '');
    html += '<button type="button" class="' + cls + '" data-per="tahun" data-val="' + y + '">' + y + '</button>';
  }
  return html + '</div>';
}

function _jpPerOpenSub(k) {
  var now = new Date(), anchor = now, d = _jpDraft;
  if (k === 'hari') {
    if (d.mode === 'hari' && d.hari) anchor = new Date(d.hari + 'T00:00:00');
  } else if (k === 'minggu') {
    _jpPer.rStart = d.dari || null;
    _jpPer.rEnd   = d.sampai || null;
    if (d.dari) anchor = new Date(d.dari + 'T00:00:00');
  } else if (k === 'bulan') {
    _jpPer.bYear = d.bulan ? parseInt(d.bulan.split('-')[0], 10) : now.getFullYear();
  }
  _jpPer.calY = anchor.getFullYear();
  _jpPer.calM = anchor.getMonth();
  _jpPer.view = k;
  _jpPerRender(false);
}

// Sinkronkan state panel lama (radio + sub-input) biar tetap konsisten dengan filter aktif.
function _jpPerSetVal(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val;
}

// Tombol Terapkan: tulis draft -> state aktif, lalu muat ulang seperlunya.
function jpFilterApply() {
  var d = _jpDraft;
  if (!d) { jpPerSheetClose(); return; }
  var lama = _jpPerCommitted();
  var periodeBerubah = (_jpPerKey(lama) !== _jpPerKey(d));
  var channelBerubah = (String(lama.ch || '') !== String(d.ch || ''));
  _jpWaktuMode = d.mode;
  _jpPerSetVal('jp-filter-hari', d.hari);
  _jpPerSetVal('jp-filter-minggu-dari', d.dari);
  _jpPerSetVal('jp-filter-minggu-sampai', d.sampai);
  _jpPerSetVal('jp-filter-bulan', d.bulan);
  _jpPerSetVal('jp-filter-tahun', d.tahun);
  _jpPerSetVal('jp-filter-channel', d.ch || '');
  jpPerSheetClose();
  _jpFilterBtnSync();       // perbarui label + titik indikator tombol gabungan
  if (periodeBerubah)      loadJurnalPenjualan();   // fetch ulang, filterJP() dipanggil di dalamnya
  else if (channelBerubah) filterJP();              // data periode sama, cukup saring ulang
}

function _jpPerOnTap(act, val) {
  var d = _jpDraft;
  if (!d) return;
  if (act === 'tab') {
    _jpPer.tab = (val === 'channel') ? 'channel' : 'periode';
    _jpPer.view = 'list';
    _jpPerRender(false);
    return;
  }
  if (act === 'pick')   { d.mode = val; _jpPerRender(true); return; }
  if (act === 'preset') {
    var r = _jpPerPresetRange(val);
    if (!r) return;
    d.mode = 'minggu'; d.dari = r.s; d.sampai = r.e;
    _jpPerRender(true);
    return;
  }
  if (act === 'sub')  { _jpPerOpenSub(val); return; }
  if (act === 'calnav') {
    var m = _jpPer.calM + parseInt(val, 10), y = _jpPer.calY;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    _jpPer.calM = m; _jpPer.calY = y;
    _jpPerRender(true);
    return;
  }
  if (act === 'bulannav') {
    _jpPer.bYear += parseInt(val, 10);
    _jpPerRender(true);
    return;
  }
  if (act === 'day') {
    if (_jpPer.view === 'hari') {
      d.mode = 'hari'; d.hari = val;
      _jpPer.view = 'list';
      _jpPerRender(false);
    } else {
      // rentang: ketuk 1 = awal, ketuk 2 = akhir (kalau lebih awal dari awal → ditukar), ketuk 3 = mulai lagi
      var st = _jpPer.rStart, en = _jpPer.rEnd;
      if (!st || (st && en)) { _jpPer.rStart = val; _jpPer.rEnd = null; }
      else if (val < st)     { _jpPer.rEnd = st; _jpPer.rStart = val; }
      else                   { _jpPer.rEnd = val; }
      _jpPerRender(true);
    }
    return;
  }
  if (act === 'rangeok') {
    var s = _jpPer.rStart;
    if (!s) return;
    var e = _jpPer.rEnd || s;
    if (e < s) { var t = s; s = e; e = t; }
    d.mode = 'minggu'; d.dari = s; d.sampai = e;
    _jpPer.view = 'list';
    _jpPerRender(false);
    return;
  }
  if (act === 'bulan') { d.mode = 'bulan'; d.bulan = val; _jpPer.view = 'list'; _jpPerRender(false); return; }
  if (act === 'tahun') { d.mode = 'tahun'; d.tahun = String(val); _jpPer.view = 'list'; _jpPerRender(false); return; }
  if (act === 'ch')    { d.ch = String(val || ''); _jpPerRender(true); return; }
  if (act === 'reset') { d.mode = 'minggu-ini'; d.ch = ''; _jpPerRender(true); return; }   // reset DRAFT saja; berlaku setelah Terapkan
  if (act === 'go')    { jpFilterApply(); return; }
}

// Pasang overlay + sheet langsung ke <body> (alasan sama dgn panel lain: .content
// punya overflow, position:fixed di dalamnya tidak andal di semua browser).
(function _jpPerSheetInject() {
  if (document.getElementById('jp-per-sheet')) return;
  var ov = document.createElement('div');
  ov.id = 'jp-per-overlay';
  ov.addEventListener('click', jpPerSheetClose);
  var sh = document.createElement('div');
  sh.id = 'jp-per-sheet';
  sh.setAttribute('role', 'dialog');
  sh.setAttribute('aria-label', 'Filter periode dan channel');
  sh.innerHTML = '<div id="jp-per-head">'
    + '<div id="jp-per-handle"></div>'
    + '<button type="button" id="jp-per-back" aria-label="Kembali"><i class="ti ti-chevron-left"></i></button>'
    + '<div id="jp-per-title">Pilih Periode</div>'
    + '<button type="button" id="jp-per-close" aria-label="Tutup"><i class="ti ti-x"></i></button>'
    + '</div>'
    + '<div id="jp-per-tabs">'
    +   '<button type="button" class="jp-pt active" id="jp-pt-periode" data-per="tab" data-val="periode">Periode</button>'
    +   '<button type="button" class="jp-pt" id="jp-pt-channel" data-per="tab" data-val="channel">Channel</button>'
    + '</div>'
    + '<div id="jp-per-body"></div>'
    + '<div id="jp-per-foot">'
    +   '<button type="button" class="jp-pf-reset" data-per="reset">Reset</button>'
    +   '<button type="button" class="jp-pc-apply" data-per="go">Terapkan</button>'
    + '</div>'
    + '<input type="hidden" id="jp-filter-hari">';
  document.body.appendChild(ov);
  document.body.appendChild(sh);

  document.getElementById('jp-per-back').addEventListener('click', jpPerBack);
  document.getElementById('jp-per-close').addEventListener('click', jpPerSheetClose);
  // 1 listener untuk seluruh sheet (tab, isi, footer) lewat atribut data-per
  sh.addEventListener('click', function(e) {
    var t = e.target.closest ? e.target.closest('[data-per]') : null;
    if (!t || t.disabled) return;
    _jpPerOnTap(t.getAttribute('data-per'), t.getAttribute('data-val'));
  });
  // Esc menutup (berguna di laptop)
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && sh.classList.contains('open')) jpPerSheetClose();
  });

  // Tarik header ke bawah untuk menutup (seperti sheet komentar Instagram) — HANYA mode bottom sheet.
  // Mode dialog tengah (laptop) tidak digeser supaya posisi tengahnya tidak rusak di layar sentuh lebar.
  var head = document.getElementById('jp-per-head');
  var y0 = null, dy = 0;
  function modeDialog() { return window.matchMedia && window.matchMedia('(min-width: 768px) and (min-height: 521px)').matches; }
  head.addEventListener('touchstart', function(e) {
    if (e.touches.length !== 1 || modeDialog()) return;
    y0 = e.touches[0].clientY; dy = 0;
    sh.style.transition = 'none';
  }, { passive: true });
  head.addEventListener('touchmove', function(e) {
    if (y0 === null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    sh.style.transform = 'translateY(' + dy + 'px)';
  }, { passive: true });
  function dragEnd() {
    if (y0 === null) return;
    var tutup = dy > 80;
    y0 = null; dy = 0;
    sh.style.transition = '';   // kembalikan transisi CSS dulu supaya geser-balik / geser-tutup mulus
    sh.style.transform = '';
    if (tutup) jpPerSheetClose();
  }
  head.addEventListener('touchend', dragEnd, { passive: true });
  head.addEventListener('touchcancel', dragEnd, { passive: true });
})();
// Pindah halaman → pastikan sheet tertutup
document.addEventListener('zenot:page', function() { jpPerSheetClose(); });

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

// ─── CHART TREN PENJUALAN (gaya Shopee) ───────────────────────
// Granularitas otomatis: hari-ini/kemarin → per jam (00:00-23:00),
// periode lain → per hari (sesuai tanggal unik yang ada di data hasil filter).
// ─── CHART RENDER SCHEDULER ──────────────────────────────────
// Semua pemanggilan chart wajib lewat sini.
// Naikkan token → render lama otomatis dibatalkan via guard di dalam _jpRenderChartTren.
function _jpScheduleChartRender(data) {
  _jpChartRenderToken = (_jpChartRenderToken + 1) & 0xFFFF;
  var token = _jpChartRenderToken;
  requestAnimationFrame(function() {
    if (token !== _jpChartRenderToken) return; // sudah ada request lebih baru
    _jpRenderChartTren(data, null, token);
  });
}

function _jpRenderChartTren(data, _retry, _token) {
  // ── Render guard: batalkan kalau ada render lebih baru dijadwalkan ──
  if (_token === undefined) _token = _jpChartRenderToken; // backward-compat safety
  if (_token !== _jpChartRenderToken) return;
  const canvas  = document.getElementById('jp-chart-tren');
  const tooltip = document.getElementById('jp-chart-tooltip');
  const emptyEl = document.getElementById('jp-chart-empty');
  if (!canvas) return;

  const now = new Date();
  const mode     = _jpWaktuMode || 'hari-ini';
  const isHourly = (mode === 'hari-ini' || mode === 'kemarin' || mode === 'hari');
  const labels = [], totals = [], qtys = [], dateKeys = [];

  if (isHourly) {
    let baseDate;
    if (mode === 'kemarin') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      baseDate = _jpLocalDate(d);
    } else if (mode === 'hari') {
      baseDate = (document.getElementById('jp-filter-hari') || {}).value || _jpLocalDate(new Date());
    } else {
      baseDate = _jpLocalDate(new Date());
    }
    for (let h = 0; h <= 23; h++) {
      const hStr = String(h).padStart(2,'0');
      labels.push(hStr + ':00');
      const rowsJam = data.filter(r => r.tanggal && String(r.tanggal).slice(0,10) === baseDate && String(r.waktu||'00:00').slice(0,2) === hStr);
      totals.push(rowsJam.reduce((s,r) => s + (Number(r.total)||0), 0));
      qtys.push(rowsJam.reduce((s,r) => s + (Number(r.qty)||0), 0));
      dateKeys.push(baseDate);
    }
  } else {
    const range = _jpChartDateRange(mode, now);
    if (range) {
      // Rentang FIX per mode — semua hari dalam periode tampil, termasuk yang kosong (Rp0)
      let dCur = new Date(range.start + 'T00:00:00');
      const dEnd = new Date(range.end + 'T00:00:00');
      while (dCur.getTime() <= dEnd.getTime()) {
        const dtKey = _jpLocalDate(dCur);
        const rowsHari = data.filter(r => r.tanggal && _jpTglChart(r, mode) === dtKey);
        labels.push(String(dCur.getDate()).padStart(2,'0') + '/' + String(dCur.getMonth()+1).padStart(2,'0'));
        totals.push(rowsHari.reduce((s,r) => s + (Number(r.total)||0), 0));
        qtys.push(rowsHari.reduce((s,r) => s + (Number(r.qty)||0), 0));
        dateKeys.push(dtKey);
        dCur = new Date(dCur.getFullYear(), dCur.getMonth(), dCur.getDate() + 1);
      }
    } else {
      // Mode 'semua' (atau fallback): gak ada batas periode alami, tetap data-driven
      const dateSet = {};
      data.forEach(r => { if (r.tanggal) dateSet[String(r.tanggal).slice(0,10)] = true; });
      const dates = Object.keys(dateSet).sort();
      dates.forEach(dt => {
        const rowsHari = data.filter(r => r.tanggal && String(r.tanggal).slice(0,10) === dt);
        const dObj = new Date(dt + 'T00:00:00');
        labels.push(String(dObj.getDate()).padStart(2,'0') + '/' + String(dObj.getMonth()+1).padStart(2,'0'));
        totals.push(rowsHari.reduce((s,r) => s + (Number(r.total)||0), 0));
        qtys.push(rowsHari.reduce((s,r) => s + (Number(r.qty)||0), 0));
        dateKeys.push(dt);
      });
    }
  }

  // 19 Sep 2026: ringkasan performa tertinggi — MOBILE ONLY, isi ruang
  // kosong di kartu Tren Penjualan setelah Best Seller/Channel dipindah
  // jadi swipe-pair sendiri. Aman dipanggil di sini walau div-nya
  // disembunyikan di laptop — cuma hitung + tulis innerHTML, gak berat.
  _jpRenderTrenRingkasan(isHourly, labels, totals, qtys, dateKeys, data);


  if (totals.length === 0) {
    canvas.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    if (tooltip) tooltip.style.display = 'none';
    return;
  }

  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  // Ambil lebar canvas. Prioritas: wrap → pane-tren → page → content → viewport.
  // Semua fallback ini punya width terdefinisi dari CSS, tidak bergantung timing layout.
  const wrap = canvas.parentElement;
  function _getW(el) { return el ? el.clientWidth : 0; }
  const forcedW = (_getW(wrap) > 10)                                                ? _getW(wrap)
                : (_getW(document.getElementById('jp-pane-tren')) > 10)             ? _getW(document.getElementById('jp-pane-tren')) - 28
                : (_getW(document.getElementById('page-jurnal-penjualan')) > 10)    ? _getW(document.getElementById('page-jurnal-penjualan')) - 28
                : (_getW(document.querySelector('.content')) > 10)                  ? _getW(document.querySelector('.content')) - 28
                : (window.innerWidth > 200)                                         ? window.innerWidth - 200
                : 400;
  // forcedW tidak akan pernah 0 karena window.innerWidth selalu ada
  canvas.style.width  = forcedW + 'px';
  canvas.style.height = '240px';

  const dpr = window.devicePixelRatio || 1;
  const W   = forcedW;
  const H   = 240;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const padL=48, padR=16, padT=14, padB=28;
  const cW=W-padL-padR, cH=H-padT-padB;
  const maxVal = Math.max(...totals, 1);
  const step   = cW / Math.max(totals.length-1, 1);
  const colLine='#3ddb6b', colFill='rgba(61,219,107,0.08)', colGrid='var(--ovl-0_06)', colLabel='#909090';

  ctx.clearRect(0, 0, W, H);

  // Grid horizontal + label nominal
  for (let i = 0; i <= 4; i++) {
    const y = padT + cH - (cH * i / 4);
    ctx.strokeStyle = colGrid; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+cW,y); ctx.stroke();
    ctx.fillStyle = colLabel; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(_fmtRpShort(maxVal*i/4), padL-6, y+3);
  }

  // Area fill
  // 19 Sep 2026: root cause "area di titik pertama keliatan segitiga dari 0"
  // — titik pertama (i===0) dulu moveTo ke BASELINE (padT+cH), bukan ke
  // tinggi data point pertama (y), jadi area-nya nanjak dari 0 ke titik
  // ke-2 padahal garisnya sendiri udah di ketinggian yg bener dari awal.
  // Fix: moveTo ke (x,y) titik pertama, baru turun ke baseline di KEDUA
  // ujung (kanan lalu kiri) sebelum closePath, biar sisi bawahnya rata
  // ngikutin baseline, bukan garis diagonal motong.
  ctx.beginPath();
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
  ctx.lineTo(padL+(totals.length-1)*step, padT+cH); // turun ke baseline, ujung kanan
  ctx.lineTo(padL, padT+cH);                         // balik ke baseline, ujung kiri (x titik pertama)
  ctx.closePath(); ctx.fillStyle = colFill; ctx.fill();

  // Garis
  ctx.beginPath(); ctx.strokeStyle = colLine; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
  ctx.stroke();

  // Titik + label sumbu X (skip biar nggak numpuk)
  _jpChartPoints = [];
  const skip = Math.max(Math.ceil(labels.length/8), 1);
  totals.forEach((v,i) => {
    const x = padL+i*step, y = padT+cH-(v/maxVal)*cH;
    _jpChartPoints.push({ x, y, label: labels[i], val: v, dateKey: dateKeys[i] });
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fillStyle = v>0 ? colLine : colGrid; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    if (i % skip === 0 || i === labels.length-1) {
      ctx.fillStyle = colLabel; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(labels[i], x, H-padB+14);
    }
  });

  // Tooltip hover — titik merah + box info, gaya Shopee
  if (tooltip) {
    canvas.onmousemove = function(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      let closest = null, minDist = 30;
      _jpChartPoints.forEach(pt => {
        const dist = Math.abs(mx - pt.x);
        if (dist < minDist) { minDist = dist; closest = pt; }
      });
      if (closest) {
        const txn = data.filter(r => {
          if (!r.tanggal || _jpTglChart(r, mode) !== closest.dateKey) return false;
          if (!isHourly) return true;
          return String(r.waktu||'00:00').slice(0,2) === closest.label.slice(0,2);
        });
        const qty = txn.reduce((s,r) => s + (Number(r.qty)||0), 0);
        tooltip.innerHTML = '<b>' + closest.label + '</b> &middot; ' + fmtRpFull(closest.val) + ' &middot; ' + qty + ' pcs &middot; ' + txn.length + ' trx';
        const tx = Math.min(closest.x + 10, W - 180);
        const ty = Math.max(closest.y - 38, 0);
        tooltip.style.left = tx + 'px';
        tooltip.style.top  = ty + 'px';
        tooltip.style.display = 'block';
      } else {
        tooltip.style.display = 'none';
      }
    };
    canvas.onmouseleave = function() { tooltip.style.display = 'none'; };
  }
}

// ─── TAB SWITCH ──────────────────────────────────────────────
var _jpActiveTab = 'jurnal';
var _jpBsSortBy  = 'rp'; // 'rp' | 'qty'
var _jpLastFilterData = [];

function jpSwitchTab(tab) {
  _jpActiveTab = tab;
  var pJurnal = document.getElementById('jp-pane-jurnal');
  var pTren   = document.getElementById('jp-pane-tren');
  if (!pJurnal || !pTren) return;
  // 19 Sep 2026: label tombol toggle nunjukin TUJUAN kalau diklik lagi
  // (bukan tab yang lagi aktif) — di Jurnal, tombol nawarin "Tren & Best
  // Seller"; di Tren, tombol nawarin "Jurnal".
  var lbl  = document.getElementById('jp-tab-toggle-label');
  var lblM = document.getElementById('jp-tab-toggle-label-mob');
  var ic   = document.getElementById('jp-tab-toggle-icon');
  var icM  = document.getElementById('jp-tab-toggle-icon-mob');
  var isJurnal = tab === 'jurnal';
  if (lbl)  lbl.textContent  = isJurnal ? 'Tren & Best Seller' : 'Jurnal';
  if (lblM) lblM.textContent = isJurnal ? 'Tren' : 'Jurnal';
  if (ic)   ic.className  = isJurnal ? 'ti ti-chart-line' : 'ti ti-receipt';
  if (icM)  icM.className = isJurnal ? 'ti ti-chart-line' : 'ti ti-receipt';
  var _isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  if (tab === 'jurnal') {
    pJurnal.style.display = 'flex';
    pTren.style.display   = 'none';
    // Balikin jp-pane-tren ke mode default (flex:1, overflow-y:auto dari CSS)
    // dan kunci lagi .content — tabel jurnal butuh layout freeze.
    pTren.style.flex       = '';
    pTren.style.minHeight  = '';
    pTren.style.overflowY  = '';
    pTren.style.overflowX  = '';
    _jpEnsureFlexLayout();
  } else {
    pJurnal.style.display = 'none';
    pTren.style.display   = 'flex';
    // Semua device: jp-pane-tren scroll sendiri — simple, konsisten, tidak ada
    // race condition dengan _jpEnsureFlexLayout yang ubah overflow .content.
    pTren.style.flex      = '1 1 0';
    pTren.style.minHeight = '0';
    pTren.style.overflow  = 'hidden';
    _jpEnsureFlexLayout();
    // Render best seller + channel langsung
    _jpRenderBestSeller(_jpLastFilterData, _jpBsSortBy);
    _jpRenderChannelTerbaik(_jpLastFilterData);
    // 19 Sep 2026: init swipe (drag + dot click) buat pair Best Seller ↔
    // Channel Terbaik versi HP — REUSE mekanisme dashboard.js apa adanya
    // (window.dbSwipeInit di-expose global di sana), idempotent karena
    // ada guard _swipeInited per elemen jadi aman dipanggil berkali-kali.
    if (typeof window.dbSwipeInit === 'function') window.dbSwipeInit();
    // Chart: 1 rAF agar browser selesai layout flex setelah display:flex
    requestAnimationFrame(function() {
      _jpScheduleChartRender(_jpLastFilterData);
    });
  }
}

// 19 Sep 2026: pengganti 2 tombol Jurnal/Tren terpisah — 1 tombol toggle.
function jpToggleTab() {
  jpSwitchTab(_jpActiveTab === 'jurnal' ? 'tren' : 'jurnal');
}

function jpBsSort(by) {
  _jpBsSortBy = by;
  var btnRp     = document.getElementById('jp-bs-sort-rp');
  var btnQty    = document.getElementById('jp-bs-sort-qty');
  var btnRpMob  = document.getElementById('jp-bs-sort-rp-mob');
  var btnQtyMob = document.getElementById('jp-bs-sort-qty-mob');
  var activeStyle   = 'padding:3px 10px;font-family:var(--f);font-size:11px;font-weight:700;background:var(--accent);color:#fff;border:2px solid var(--accent);border-radius:4px;cursor:pointer';
  var inactiveStyle = 'padding:3px 10px;font-family:var(--f);font-size:11px;font-weight:700;background:none;color:var(--ink3);border:2px solid var(--ink3);border-radius:4px;cursor:pointer';
  if (btnRp)     btnRp.style.cssText     = by === 'rp'  ? activeStyle : inactiveStyle;
  if (btnQty)    btnQty.style.cssText    = by === 'qty' ? activeStyle : inactiveStyle;
  if (btnRpMob)  btnRpMob.style.cssText  = by === 'rp'  ? activeStyle : inactiveStyle;
  if (btnQtyMob) btnQtyMob.style.cssText = by === 'qty' ? activeStyle : inactiveStyle;
  _jpRenderBestSeller(_jpLastFilterData, by);
}

// Ekstrak SKU Induk dari nama SKU variasi
// TURTLENECK_HITAM-XL → TURTLENECK | DC_BATA → DC_BATA | LUNEA_MARUN → LUNEA
function _jpSkuInduk(sku) {
  if (!sku) return '—';
  var s = sku.toUpperCase();
  // Hapus suffix ukuran (-M, -L, -XL, -XLL, -XXL)
  var noSize = s.replace(/[-_](XXL|XLL|XL|L|M|S)\s*$/i, '');
  // Hapus suffix warna (kata terakhir setelah _ jika > 1 segment)
  var parts = noSize.split('_');
  if (parts.length >= 3) return parts.slice(0, parts.length - 1).join('_');
  if (parts.length === 2) return parts[0]; // LUNEA_MARUN → LUNEA (1 kata induk)
  return noSize;
}

// 19 Sep 2026: ringkasan performa tertinggi buat kartu Tren Penjualan
// (MOBILE ONLY — dibuat compact/2-baris biar gak makan banyak ruang,
// karena "jangan sampai ada scroll" di layar HP). Dipanggil dari
// _jpRenderChartTren tiap kali chart di-render ulang. Laptop: div
// #jp-tren-ringkasan disembunyikan total via CSS, jadi fungsi ini boleh
// jalan di semua device tanpa perlu dicek lebar layar dulu.
function _jpRenderTrenRingkasan(isHourly, labels, totals, qtys, dateKeys, data) {
  var el = document.getElementById('jp-tren-ringkasan');
  if (!el) return;
  if (!totals.length || !data || !data.length) {
    el.innerHTML = '<div style="color:var(--ink3);font-style:italic;font-size:12px;text-align:center">Belum ada penjualan di periode ini</div>';
    return;
  }
  var maxIdx = 0;
  for (var i = 1; i < totals.length; i++) { if (totals[i] > totals[maxIdx]) maxIdx = i; }
  var maxVal = totals[maxIdx];
  var maxQty = qtys[maxIdx] || 0;
  var whenLabel;
  if (maxVal <= 0) {
    whenLabel = '—';
  } else if (isHourly) {
    whenLabel = 'Jam ' + labels[maxIdx];
  } else {
    var dObj = new Date(dateKeys[maxIdx] + 'T00:00:00');
    var hariNama = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][dObj.getDay()];
    whenLabel = hariNama + ', ' + labels[maxIdx];
  }
  // Produk terlaris (per SKU Induk) sepanjang periode ini — reuse _jpSkuInduk
  var indukMap = {};
  data.forEach(function(r) {
    var induk = _jpSkuInduk(r.sku);
    if (!indukMap[induk]) indukMap[induk] = 0;
    indukMap[induk] += (Number(r.qty)||0);
  });
  var topInduk = '—', topQty = 0;
  Object.keys(indukMap).forEach(function(k) { if (indukMap[k] > topQty) { topQty = indukMap[k]; topInduk = k; } });

  el.innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:3px 0">' +
      '<i class="ti ti-trophy" style="color:var(--warn);flex-shrink:0"></i>' +
      '<span style="color:var(--ink3)">Tertinggi</span>' +
      '<span style="font-weight:700;flex-shrink:0">' + whenLabel + '</span>' +
      '<span style="color:var(--ink3)">·</span>' +
      '<span style="font-weight:700;color:var(--ok)">' + fmtRpFull(maxVal) + '</span>' +
      '<span style="color:var(--ink3);font-size:11px">(' + maxQty + ' pcs)</span>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:3px 0">' +
      '<i class="ti ti-package" style="color:var(--accent);flex-shrink:0"></i>' +
      '<span style="color:var(--ink3)">Produk terlaris</span>' +
      '<span style="font-weight:700">' + topInduk + '</span>' +
      '<span style="color:var(--ink3);font-size:11px">(' + topQty + ' pcs)</span>' +
    '</div>';
}

function _jpRenderBestSeller(data, sortBy) {
  var listEl = document.getElementById('jp-bestseller-list');
  var listElMob = document.getElementById('jp-bestseller-list-mob');
  if (!listEl && !listElMob) return;
  if (!data || !data.length) {
    var emptyHtml = '<div style="color:var(--ink3);font-style:italic;font-size:13px;padding:10px 0">Belum ada data di periode ini</div>';
    if (listEl) listEl.innerHTML = emptyHtml;
    if (listElMob) listElMob.innerHTML = emptyHtml;
    return;
  }
  var indukMap = {};
  data.forEach(function(r) {
    var induk = _jpSkuInduk(r.sku);
    var vari  = (r.sku||'').toUpperCase();
    if (!indukMap[induk]) indukMap[induk] = { rp:0, qty:0, variasi:{} };
    indukMap[induk].rp  += (r.total||0);
    indukMap[induk].qty += (r.qty||0);
    if (!indukMap[induk].variasi[vari]) indukMap[induk].variasi[vari] = {rp:0, qty:0};
    indukMap[induk].variasi[vari].rp  += (r.total||0);
    indukMap[induk].variasi[vari].qty += (r.qty||0);
  });
  var indukList = Object.keys(indukMap).map(function(k){ return {induk:k, data:indukMap[k]}; });
  indukList.sort(function(a,b){ return sortBy==='rp' ? b.data.rp-a.data.rp : b.data.qty-a.data.qty; });
  var totalRp = data.reduce(function(s,r){ return s+(r.total||0); }, 0);

  var htmlOut = indukList.map(function(item, idx) {
    var pct = totalRp > 0 ? Math.round(item.data.rp / totalRp * 100) : 0;
    var variList = Object.keys(item.data.variasi).map(function(k){ return {sku:k, d:item.data.variasi[k]}; });
    variList.sort(function(a,b){ return sortBy==='rp' ? b.d.rp-a.d.rp : b.d.qty-a.d.qty; });
    // Variasi tampil langsung tanpa klik
    var variHtml = variList.map(function(v){
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0 5px 24px;border-top:1px solid var(--ink4);font-size:12px">'
        + '<span style="color:var(--ink2)">' + v.sku + '</span>'
        + '<div style="display:flex;gap:16px;align-items:center">'
        + '<span style="color:var(--ink3)">' + v.d.qty + ' pcs</span>'
        + '<span style="color:var(--ok);font-weight:700;min-width:80px;text-align:right">' + fmtRpFull(v.d.rp) + '</span>'
        + '</div></div>';
    }).join('');
    return '<div style="border-top:2px solid var(--ink4)">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:10px 0">'
      + '<span style="font-size:11px;font-weight:700;color:var(--ink3);min-width:20px;text-align:center">' + (idx+1) + '</span>'
      + '<span style="font-weight:700;flex:1;font-size:14px">' + item.induk + '</span>'
      + '<span style="font-size:11px;color:var(--ink3);margin-right:6px">' + pct + '%</span>'
      + '<span style="font-size:12px;color:var(--ink3);margin-right:6px">' + item.data.qty + ' pcs</span>'
      + '<span style="font-weight:700;color:var(--ok);font-size:14px;min-width:90px;text-align:right">' + fmtRpFull(item.data.rp) + '</span>'
      + '</div>'
      + variHtml
      + '</div>';
  }).join('');
  if (listEl) listEl.innerHTML = htmlOut;
  if (listElMob) listElMob.innerHTML = htmlOut;
}

function _jpRenderChannelTerbaik(data) {
  var listEl = document.getElementById('jp-channel-terbaik-list');
  var listElMob = document.getElementById('jp-channel-terbaik-list-mob');
  if (!listEl && !listElMob) return;
  if (!data || !data.length) {
    var emptyHtml = '<div style="color:var(--ink3);font-style:italic;font-size:13px;padding:10px 0">Belum ada data di periode ini</div>';
    if (listEl) listEl.innerHTML = emptyHtml;
    if (listElMob) listElMob.innerHTML = emptyHtml;
    return;
  }
  // Agregasi per channel
  var chMap = {};
  data.forEach(function(r) {
    var chNama = (_jpChannelMap[r.channel_id] ? _jpChannelMap[r.channel_id].nama : 'Channel ' + r.channel_id) || '—';
    if (!chMap[chNama]) chMap[chNama] = { rp:0, qty:0, variasi:{} };
    chMap[chNama].rp  += (r.total||0);
    chMap[chNama].qty += (r.qty||0);
    var vari = (r.sku||'').toUpperCase();
    if (!chMap[chNama].variasi[vari]) chMap[chNama].variasi[vari] = {rp:0, qty:0};
    chMap[chNama].variasi[vari].rp  += (r.total||0);
    chMap[chNama].variasi[vari].qty += (r.qty||0);
  });
  var chList = Object.keys(chMap).map(function(k){ return {nama:k, data:chMap[k]}; });
  chList.sort(function(a,b){ return b.data.rp - a.data.rp; });
  var totalRp = data.reduce(function(s,r){ return s+(r.total||0); }, 0);

  var htmlOut2 = chList.map(function(ch, idx) {
    var pct = totalRp > 0 ? Math.round(ch.data.rp / totalRp * 100) : 0;
    // Top 3 variasi by qty
    var variList = Object.keys(ch.data.variasi).map(function(k){ return {sku:k, d:ch.data.variasi[k]}; });
    variList.sort(function(a,b){ return b.d.qty - a.d.qty; });
    var topVari = variList.slice(0, 3).map(function(v, vi){
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0 4px 20px;border-top:1px solid var(--ink4);font-size:12px">'
        + '<span style="color:var(--ink3);min-width:18px">' + (vi+1) + '.</span>'
        + '<span style="color:var(--ink2);flex:1">' + v.sku + '</span>'
        + '<span style="color:var(--ink3);margin-right:10px">' + v.d.qty + ' pcs</span>'
        + '<span style="color:var(--ok);font-weight:700;min-width:75px;text-align:right">' + fmtRpFull(v.d.rp) + '</span>'
        + '</div>';
    }).join('');
    return '<div style="border-top:2px solid var(--ink4)">'
      + '<div style="display:flex;align-items:center;gap:10px;padding:10px 0">'
      + '<span style="font-size:11px;font-weight:700;color:var(--ink3);min-width:20px;text-align:center">' + (idx+1) + '</span>'
      + '<span style="font-weight:700;flex:1;font-size:14px">' + ch.nama + '</span>'
      + '<span style="font-size:11px;color:var(--ink3);margin-right:6px">' + pct + '%</span>'
      + '<span style="font-size:12px;color:var(--ink3);margin-right:6px">' + ch.data.qty + ' pcs</span>'
      + '<span style="font-weight:700;color:var(--ok);font-size:14px;min-width:90px;text-align:right">' + fmtRpFull(ch.data.rp) + '</span>'
      + '</div>'
      + (topVari ? '<div style="padding-bottom:6px">' + topVari + '</div>' : '')
      + '</div>';
  }).join('');
  if (listEl) listEl.innerHTML = htmlOut2;
  if (listElMob) listElMob.innerHTML = htmlOut2;
}

function filterJP() {
  const q   = '';
  const fcEl = document.getElementById('jp-filter-channel');
  const kat = fcEl ? fcEl.value : '';
  // 3 Okt 2026: Minggu Ini / Minggu Lalu → hanya baris setelah Sabtu 19.30 sebelumnya s/d Sabtu 19.30 (termasuk). Lihat _jpMingguRange.
  const _rngMinggu = _jpMingguRangeAktif(_jpWaktuMode);
  let hasil = _jpAllData.filter(r => {
    if (r.no_order) return false; // Shopee orders → Data Order, bukan Jurnal
    if (_rngMinggu && !_jpRowDalamMinggu(r, _rngMinggu)) return false;
    const ch = (_jpChannelMap[r.channel_id] ? _jpChannelMap[r.channel_id].nama : '').toLowerCase();
    const cocokQ  = !q || (r.sku||'').toLowerCase().includes(q) || ch.includes(q);
    const cocokCh = !kat || String(r.channel_id) === String(kat);
    return cocokQ && cocokCh;
  });
  renderTabelJP(hasil);
  updateMetricsJP(hasil);
  _jpLastFilterData = hasil;
  // Sync metrics ke Tab 2
  var el2 = document.getElementById('jp-total-penjualan2');
  var el3 = document.getElementById('jp-total-item2');
  if (el2) el2.textContent = document.getElementById('jp-total-penjualan').textContent;
  if (el3) el3.textContent = document.getElementById('jp-total-item').textContent;
  _jpRenderDelta(hasil);
  // Render bestseller + channel + chart hanya kalau Tab Tren aktif
  if (_jpActiveTab === 'tren') {
    _jpRenderBestSeller(hasil, _jpBsSortBy);
    _jpRenderChannelTerbaik(hasil);
    _jpScheduleChartRender(hasil);
  }
}

// ─── RENDER TABEL ────────────────────────────────────────────
function renderTabelJP(data) {
  const tbody = document.getElementById('jp-tbody');
  const fmtRp = v => fmtRpFull(v);
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--ink3);font-style:italic">Belum ada entri penjualan</td></tr>';
    document.getElementById('jp-footer').textContent = '';
    return;
  }

  // ─── Render tabel dengan sisakMap ────────────────────────────
  function _jpRenderWithStok(sisakMap) {
    tbody.innerHTML = data.map(function(row) {
      const tgl    = new Date(row.tanggal).toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'2-digit'});
      const jam    = row.waktu ? String(row.waktu).slice(0,5) : '—';
      const ch     = _jpChannelMap[row.channel_id];
      const chHtml = ch ? chBadge({ nama: ch.nama, kategori: ch.kategori||'' }) : '<span style="color:var(--ink3)">—</span>';

      // ─── Baris Shopee vs Manual ───────────────────────────
      const isShopee = !!(row.no_order);
      const skuKey   = (row.sku || '').toUpperCase();

      // SKU cell: untuk Shopee tampilkan SKU + badge no_order ringkas
      var skuHtml;
      if (isShopee) {
        const noOrderShort = String(row.no_order).slice(-8);
        const skuLabel     = row.sku
          ? '<b style="color:var(--accent)">' + row.sku + '</b>'
          : '<span style="color:var(--ink3);font-style:italic">No SKU</span>';
        skuHtml = '<div style="line-height:1.3">'
          + skuLabel
          + '<div style="font-size:10px;color:var(--ink3);margin-top:1px">'
          + '<span style="font-family:monospace;letter-spacing:.02em">⋯⋯⋯' + noOrderShort + '</span>'
          + '</div></div>';
      } else {
        skuHtml = row.sku
          ? '<b style="color:var(--accent)">' + row.sku + '</b>'
          : '<span style="color:var(--ink3)">—</span>';
      }

      // ─── Sisa stok ───────────────────────────────────────
      const sisaVal  = sisakMap[skuKey];
      const sisaHtml = !row.sku
        ? '<span style="color:var(--ink3)">—</span>'
        : _jpDsMap[skuKey]
          ? '<span title="Dropship — tidak nyetok" style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:3px;background:rgba(47,111,176,.15);color:var(--info)">DS</span>'
          : sisaVal === undefined
          ? '<span style="color:var(--ink3)">—</span>'
          : sisaVal <= 0
            ? '<b style="color:var(--danger)">' + sisaVal + '</b>'
            : sisaVal <= 3
              ? '<b style="color:var(--warn)">' + sisaVal + '</b>'
              : '<b style="color:var(--ok)">' + sisaVal + '</b>';

      // ─── Qty & Harga: kosong kalau Shopee tanpa SKU ───────
      const qtyDisplay   = (!row.sku && isShopee)
        ? '<span style="color:var(--ink3)">—</span>'
        : (row.qty || 0);
      const hargaDisplay = (!row.sku && isShopee)
        ? '<span style="color:var(--ink3)">—</span>'
        : fmtRp(row.harga_satuan);

      // ─── Row style: border kiri untuk baris Shopee ────────
      const rowStyle = isShopee ? 'border-left:2px solid var(--accent);' : '';

      return '<tr data-id="' + row.id + '" style="cursor:pointer;' + rowStyle + '">'
        + '<td style="white-space:nowrap"><b>' + tgl + '</b> <span style="font-size:11px;color:var(--ink3)">' + jam + '</span></td>'
        + '<td>' + chHtml + '</td>'
        + '<td>' + skuHtml + '</td>'
        + '<td style="text-align:center">' + qtyDisplay + '</td>'
        + '<td>' + hargaDisplay + '</td>'
        + '<td><b style="color:var(--ok)">' + fmtRp(row.total) + '</b></td>'
        + '<td style="text-align:center">' + sisaHtml + '</td>'
        + '</tr>';
    }).join('');
    document.getElementById('jp-footer').textContent = 'Menampilkan ' + data.length + ' entri';
    _jpInitLongPress();
  }

  // Render pakai _jpSisakMap terkini (sudah di-refresh oleh _jpRefreshSisakMap di loadJurnalPenjualan)
  _jpRenderWithStok(_jpSisakMap);
}

// ─── LONG-PRESS baris tabel → buka modal Edit Penjualan ───────
// 18 Sep 2026: kolom Aksi (pensil+hapus) DIHAPUS atas permintaan user
// ("biar lebih clean") — diganti tekan-tahan (~500ms) baris buat buka
// modal edit, pola PERSIS niru _gdgInitLongPress (gadag.js), yang udah
// kebukti jalan buat kasus sama (tabel tanpa kolom Aksi). Tombol Hapus
// dipindah ke dalam modal-jp sendiri (lihat #jp-btn-hapus & jpHapusDariModal),
// nongol cuma pas mode edit — sama persis kayak pola gdg-pend-modal-hapus.
function _jpInitLongPress() {
  const tbody = document.getElementById('jp-tbody');
  if (!tbody || tbody._jpLongPressInited) return;
  tbody._jpLongPressInited = true;
  const HOLD_MS    = 500; // durasi tekan biar dianggap "tekan lama"
  const MOVE_LIMIT = 10;  // px — kalau jari geser lebih dari ini, batal (dianggap scroll)
  let _timer = null, _startX = 0, _startY = 0, _row = null;

  function cancel() { if (_timer) { clearTimeout(_timer); _timer = null; } _row = null; }
  function fire() {
    if (navigator.vibrate) navigator.vibrate(15); // getar halus, konfirmasi tekan lama kena
    const r = _row;
    cancel();
    editJP(r.getAttribute('data-id'));
  }

  tbody.addEventListener('touchstart', function(e) {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    _row    = tr;
    _startX = e.touches[0].clientX;
    _startY = e.touches[0].clientY;
    _timer  = setTimeout(fire, HOLD_MS);
  }, { passive: true });
  tbody.addEventListener('touchmove', function(e) {
    if (!_timer) return;
    const dx = Math.abs(e.touches[0].clientX - _startX);
    const dy = Math.abs(e.touches[0].clientY - _startY);
    if (dx > MOVE_LIMIT || dy > MOVE_LIMIT) cancel(); // jari geser → batal, biarin scroll normal
  }, { passive: true });
  tbody.addEventListener('touchend', cancel, { passive: true });
  tbody.addEventListener('touchcancel', cancel, { passive: true });

  // Desktop/laptop: mouse click-and-hold juga didukung (mousedown/mouseup)
  tbody.addEventListener('mousedown', function(e) {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    _row   = tr;
    _timer = setTimeout(fire, HOLD_MS);
  });
  tbody.addEventListener('mouseup', cancel);
  tbody.addEventListener('mouseleave', cancel);
}

// ─── REFRESH SISAK MAP (all-time, independen dari filter periode) ─────────────
// Dipanggil setiap loadJurnalPenjualan() agar picker selalu tampil nilai aktual
async function _jpRefreshSisakMap() {
  try {
    const [produkList, stokList, jurnalAll, dsSupMap] = await Promise.all([
      dbGet('produk'),   // butuh boss + penanda dropship untuk status DS
      dbGet('stok',   '&select=sku_variasi,stok_masuk&order=id.desc'),
      dbGet('jurnal_penjualan', '&select=sku,qty'),
      zDsLoadSuppliers(),
    ]);
    // Sama persis dengan stok.js: last-write-wins per SKU (bukan akumulasi)
    const masukMap = {};
    (stokList || []).forEach(function(r) {
      const k = (r.sku_variasi || '').toUpperCase();
      if (!(k in masukMap)) masukMap[k] = r.stok_masuk || 0;
    });
    const keluarMap = {};
    (jurnalAll || []).forEach(function(j) {
      const k = (j.sku || '').toUpperCase();
      keluarMap[k] = (keluarMap[k] || 0) + (j.qty || 0);
    });
    const sisakMap = {};
    // Union semua key dari masukMap (tabel stok) dan keluarMap (jurnal_penjualan)
    // agar semua SKU yang pernah ada di stok atau terjual tampil sisa stoknya,
    // termasuk SKU Shopee yang tidak terdaftar di tabel produk.
    const _allStokKeys = new Set([
      ...Object.keys(masukMap),
      ...Object.keys(keluarMap),
    ]);
    _allStokKeys.forEach(function(k) {
      sisakMap[k] = (masukMap[k] || 0) - (keluarMap[k] || 0);
    });
    _jpSisakMap = sisakMap;
    // Status dropship per SKU (boleh minus tanpa dianggap masalah → tampil "DS")
    const dsMap = {};
    (produkList || []).forEach(function(p) {
      const k = (p.sku_variasi || '').toUpperCase();
      if (k && zIsDropship(p, dsSupMap, masukMap[k])) dsMap[k] = true;
    });
    _jpDsMap = dsMap;
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

// ─── PERBANDINGAN △/▽ vs PERIODE SEBELUMNYA (8 Okt 2026) ─────
// Badge di minicard Total Penjualan & Total Item Terjual: △ naik / ▽ turun terhadap periode pembanding.
// Aturan: SEPADAN, bukan periode penuh — kalau periode aktif belum selesai (Minggu Ini baru jalan 3 hari), pembandingnya
// juga cuma sepanjang waktu yang sudah berjalan (Minggu Ini s/d Kamis 10.31 vs Minggu Lalu s/d Kamis 10.31). Kalau dibandingkan
// dengan minggu penuh, hasilnya hampir selalu ▽ dan menyesatkan. Periode pembanding: Hari Ini→kemarin, Kemarin/Hari→hari sebelumnya,
// Minggu Ini→minggu lalu (pakai cutoff Sabtu yang sama), Minggu Lalu→minggu sebelumnya, Bulan Ini→bulan lalu, Bulan/Tahun pilihan→
// bulan/tahun sebelumnya, 7 Hari & rentang tanggal (termasuk Bulan Lalu/3 Bulan)→rentang sama panjang tepat sebelumnya. 'Semua'→tidak ada badge.
// Mengikuti filter channel yang aktif. Data pembanding diambil lewat query terpisah (_jpPrevRows) supaya tabel/chart tidak tersentuh.
var _jpPrevRows = null;   // baris mentah periode pembanding (null = belum/tidak ada)
var _jpPrevInfo = null;   // { label, lo, hi, week }
var _jpPrevTok  = 0;      // penanda permintaan terakhir (abaikan balasan lama kalau periode keburu diganti)
function _jpKeyDT(d) { return _jpLocalDate(d) + 'T' + _jpJamStr(d); }
function _jpPrevPeriod(mode, now) {
  var y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  var D = function(yy, mm, dd) { return new Date(yy, mm, dd, 0, 0, 0); };
  var cs, ce, ps, label, week = false;   // cs/ce = awal/akhir periode aktif, ps = awal periode pembanding
  function parseYmd(str) { var q = String(str || '').split('-'); return q.length === 3 ? D(+q[0], +q[1] - 1, +q[2]) : null; }
  if (mode === 'hari-ini')      { cs = D(y, m, d);     ce = D(y, m, d + 1); ps = D(y, m, d - 1); label = 'kemarin'; }
  else if (mode === 'kemarin')  { cs = D(y, m, d - 1); ce = D(y, m, d);     ps = D(y, m, d - 2); label = 'hari sebelumnya'; }
  else if (mode === 'hari') {
    cs = parseYmd((document.getElementById('jp-filter-hari') || {}).value || _jpLocalDate(now));
    if (!cs) return null;
    ce = D(cs.getFullYear(), cs.getMonth(), cs.getDate() + 1); ps = D(cs.getFullYear(), cs.getMonth(), cs.getDate() - 1); label = 'hari sebelumnya';
  }
  else if (mode === 'minggu-ini' || mode === 'minggu-lalu') {
    var rng = _jpMingguRangeAktif(mode, now);
    cs = rng.prevCutoff; ce = rng.cutoff; week = true;
    ps = new Date(cs.getFullYear(), cs.getMonth(), cs.getDate() - 7, cs.getHours(), cs.getMinutes(), 0);
    label = mode === 'minggu-ini' ? 'minggu lalu' : 'minggu sebelumnya';
  }
  else if (mode === 'bulan-ini') { cs = D(y, m, 1); ce = D(y, m + 1, 1); ps = D(y, m - 1, 1); label = 'bulan lalu'; }
  else if (mode === 'bulan') {
    var fb = String((document.getElementById('jp-filter-bulan') || {}).value || '').split('-');
    if (fb.length < 2 || !fb[0] || !fb[1]) return null;
    cs = D(+fb[0], +fb[1] - 1, 1); ce = D(+fb[0], +fb[1], 1); ps = D(+fb[0], +fb[1] - 2, 1); label = 'bulan sebelumnya';
  }
  else if (mode === 'tahun') {
    var ft = parseInt((document.getElementById('jp-filter-tahun') || {}).value, 10);
    if (!ft) return null;
    cs = D(ft, 0, 1); ce = D(ft + 1, 0, 1); ps = D(ft - 1, 0, 1); label = 'tahun sebelumnya';
  }
  else if (mode === '7hari') { cs = D(y, m, d - 7); ce = D(y, m, d + 1); ps = new Date(cs.getTime() - (ce.getTime() - cs.getTime())); label = '7 hari sebelumnya'; }
  else if (mode === 'minggu') {
    var a = parseYmd((document.getElementById('jp-filter-minggu-dari') || {}).value);
    var b = parseYmd((document.getElementById('jp-filter-minggu-sampai') || {}).value);
    if (!a || !b) return null;
    cs = a; ce = D(b.getFullYear(), b.getMonth(), b.getDate() + 1); ps = new Date(cs.getTime() - (ce.getTime() - cs.getTime())); label = 'periode sebelumnya';
  }
  else return null;
  if (isNaN(cs.getTime()) || isNaN(ps.getTime())) return null;
  var elapsed = Math.max(0, Math.min(now.getTime(), ce.getTime()) - cs.getTime());      // yang sudah berjalan di periode aktif
  var hi = new Date(Math.min(ps.getTime() + elapsed, cs.getTime()));                      // pembanding sepanjang itu, tidak boleh masuk periode aktif
  return { label: label, lo: ps, hi: hi, week: week };
}
function _jpLoadPrev(mode, now) {
  var info = _jpPrevPeriod(mode, now);
  _jpPrevInfo = info; _jpPrevRows = null;
  var tok = ++_jpPrevTok;
  _jpRenderDelta();   // sembunyikan badge lama dulu
  if (!info) return;
  var f = '&tanggal=gte.' + _jpLocalDate(info.lo) + '&tanggal=lt.' + _jpAddDays(_jpLocalDate(info.hi), 1);
  dbGet('jurnal_penjualan', f + '&order=tanggal.desc,id.desc').then(function(rows) {
    if (tok !== _jpPrevTok) return;
    _jpPrevRows = rows || [];
    _jpRenderDelta();
  }).catch(function() { /* gagal ambil pembanding → badge tetap tersembunyi, fitur lain tidak terganggu */ });
}
function _jpFmtWin(d) { return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' + _jpJamStr(d).replace(':', '.'); }
function _jpDeltaHtml(cur, prev, info, fmtPrev) {
  if (!prev && !cur) return '';
  var label = info.label;
  // [8 Okt 2026] angka periode pembanding ditampilkan LANGSUNG di teks kecil (bukan cuma tooltip) + rentang persisnya di tooltip,
  // supaya "– 0%" / "▽ 17%" bisa dicek mata: ada angka pembandingnya, dan jelas sampai hari & jam berapa dihitung.
  var tip = 'Pembanding (' + label + '): ' + fmtPrev(prev) + '  |  rentang: ' + _jpFmtWin(info.lo) + ' s/d ' + _jpFmtWin(info.hi) + ' (hari & jam sepadan)';
  var base = 'display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-family:var(--mono);font-size:13px;font-weight:700;line-height:1.3;white-space:nowrap;';
  var col, txt;
  if (!prev) { col = 'var(--ok)'; txt = '△ baru'; }
  else {
    var pct = (cur - prev) / prev * 100;
    var r = Math.round(pct);
    var shown = String(Math.abs(r));
    if (r === 0 && pct !== 0) shown = (Math.round(Math.abs(pct) * 10) / 10).toLocaleString('id-ID');
    if (pct === 0)      { col = 'var(--ink3)';   txt = '– 0%'; }
    else if (pct > 0)   { col = 'var(--ok)';     txt = '△ ' + shown + '%'; }
    else                { col = 'var(--danger)'; txt = '▽ ' + shown + '%'; }
  }
  var bg = 'background:color-mix(in srgb, ' + col + ' 13%, transparent);';
  return '<span title="' + tip + '" style="' + base + bg + 'color:' + col + '">' + txt + '</span>'
    + '<span title="' + tip + '" style="display:block;text-align:right;font-family:var(--f);font-size:10px;font-weight:400;color:var(--ink3);margin-top:1px">vs ' + label + ' · ' + fmtPrev(prev) + '</span>';
}
function _jpRenderDelta(curRows) {
  var ids = ['jp-delta-penjualan', 'jp-delta-penjualan2', 'jp-delta-item', 'jp-delta-item2'];
  var hide = function() { ids.forEach(function(id) { var e = document.getElementById(id); if (e) { e.style.display = 'none'; e.innerHTML = ''; } }); };
  var info = _jpPrevInfo;
  if (!info || !_jpPrevRows) { hide(); return; }
  var cur = curRows || _jpLastFilterData || [];
  var fc = document.getElementById('jp-filter-channel');
  var kat = fc ? fc.value : '';
  var lo = _jpKeyDT(info.lo), hi = _jpKeyDT(info.hi);
  var prev = _jpPrevRows.filter(function(r) {
    if (r.no_order) return false;                                        // Shopee → Data Order, sama dengan filterJP
    if (kat && String(r.channel_id) !== String(kat)) return false;
    var tgl = String(r.tanggal || '').slice(0, 10);
    if (!tgl) return false;
    var key = tgl + 'T' + String(r.waktu || '00:00').slice(0, 5);
    return info.week ? (key > lo && key <= hi) : (key >= lo && key < hi);   // minggu: (Sabtu cutoff, Sabtu cutoff] seperti _jpRowDalamMinggu
  });
  var sum = function(rows, k) { return rows.reduce(function(a, r) { return a + (r[k] || 0); }, 0); };
  var pT = sum(prev, 'total'), pQ = sum(prev, 'qty'), cT = sum(cur, 'total'), cQ = sum(cur, 'qty');
  var put = function(idList, html) { idList.forEach(function(id) { var e = document.getElementById(id); if (!e) return; e.innerHTML = html; e.style.display = html ? 'block' : 'none'; }); };
  put(['jp-delta-penjualan', 'jp-delta-penjualan2'], _jpDeltaHtml(cT, pT, info, function(v) { return 'Rp' + v.toLocaleString('id-ID'); }));
  put(['jp-delta-item', 'jp-delta-item2'],           _jpDeltaHtml(cQ, pQ, info, function(v) { return v.toLocaleString('id-ID') + ' item'; }));
}

// ─── LAST CHANNEL MEMORY — reset jam 00.00 ───────────────────
function _jpGetLastChannel() {
  try {
    var today = new Date().toISOString().slice(0,10);
    var saved = localStorage.getItem('jp_last_channel');
    if (!saved) return null;
    var obj = JSON.parse(saved);
    if (obj.date !== today) { localStorage.removeItem('jp_last_channel'); return null; }
    return obj; // { date, val, label }
  } catch(e) { return null; }
}
function _jpSaveLastChannel(val, label) {
  try {
    var today = new Date().toISOString().slice(0,10);
    localStorage.setItem('jp_last_channel', JSON.stringify({ date: today, val: val, label: label }));
  } catch(e) {}
}

// ─── BUKA MODAL ──────────────────────────────────────────────
function showTambahJP() {
  document.getElementById('jp-modal-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Penjualan';
  document.getElementById('jp-id').value         = '';
  var hapusBtn0 = document.getElementById('jp-btn-hapus');
  if (hapusBtn0) hapusBtn0.style.display = 'none';
  document.getElementById('jp-tgl').value        = _jpNowDate();
  document.getElementById('jp-waktu').value      = _jpNowTime();
  document.getElementById('jp-sku-induk').value  = '';
  _jpSetIndukLabel(null);
  document.getElementById('jp-sku-variasi').innerHTML = '<option value="">— Pilih Variasi —</option>';
  var lblV0 = document.getElementById('jp-picker-variasi-label');
  if (lblV0) { lblV0.textContent = '— Pilih Variasi —'; lblV0.style.color = 'var(--ink3)'; }
  document.getElementById('jp-qty').value        = '1';
  var _btnT = document.getElementById('jp-btn-tambah-sku');
  if (_btnT) _btnT.style.display = 'none';

  // Isi channel dari last channel hari ini
  var lastCh = _jpGetLastChannel();
  var chVal = lastCh ? lastCh.val : '';
  var chLabel = lastCh ? lastCh.label : '— Pilih Channel —';
  document.getElementById('jp-channel').value = chVal;
  var lblC = document.getElementById('jp-picker-channel-label');
  if (lblC) { lblC.textContent = chLabel; lblC.style.color = chVal ? 'var(--ink)' : 'var(--ink3)'; }
  jpTutupDropdownSKU();
  _jpChProdukCache = { chId: null, set: null };   // selalu baca ulang channel_produk (bisa berubah di menu Channel)
  loadProdukListJP();
  if (chVal) _jpLoadChProduk(chVal);
  _jpRenderPending();
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
    var hapusBtn1 = document.getElementById('jp-btn-hapus');
    if (hapusBtn1) hapusBtn1.style.display = '';
    document.getElementById('jp-tgl').value     = r.tanggal ? r.tanggal.split('T')[0] : '';
    document.getElementById('jp-waktu').value   = r.waktu ? String(r.waktu).slice(0,5) : _jpNowTime();
    document.getElementById('jp-channel').value = r.channel_id || '';
    _jpChProdukCache = { chId: null, set: null };   // baca ulang channel_produk saat picker SKU dibuka
    var lblCEdit = document.getElementById('jp-picker-channel-label');
    if (lblCEdit) {
      var chEdit = r.channel_id ? _jpChannelMap[r.channel_id] : null;
      lblCEdit.textContent = chEdit ? chEdit.nama : '— Pilih Channel —';
      lblCEdit.style.color = chEdit ? 'var(--ink)' : 'var(--ink3)';
    }
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
      _jpSetIndukLabel(kat);
      jpPilihKatalog(kat);
setTimeout(() => {
  document.getElementById('jp-sku-variasi').value = skuVal;
  var lblV = document.getElementById('jp-picker-variasi-label');
  if (lblV) { lblV.textContent = skuVal; lblV.style.color = 'var(--ink)'; }
  var btnT = document.getElementById('jp-btn-tambah-sku');
  if (btnT) btnT.style.display = 'block';
}, 80);
    } else {
      // Transaksi lama yang SKU-nya udah gak ada di Kelola Produk: SKU dipertahankan
      // apa adanya biar edit qty/harga/channel tetep bisa. Ganti SKU cuma lewat picker (data master).
      document.getElementById('jp-sku-induk').value = skuVal;
      _jpSetIndukLabel(skuVal);
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
  const tgl   = document.getElementById('jp-tgl').value;
  const waktu = document.getElementById('jp-waktu').value || _jpNowTime();

  // Kalau ada pending items, item di form sekarang harus juga valid
  // Kalau tidak ada pending items, validasi normal
  const hasPending = _jpPendingItems.length > 0;

  if (!tgl) { alert('Tanggal wajib diisi!'); return; }

  // Kalau form saat ini ada isinya, validasi dan tambah ke batch
  var allItems = _jpPendingItems.slice(); // copy
  if (sku || qty > 0 || harga > 0) {
    if (!sku)      { alert('SKU wajib diisi!');           return; }
    if (qty <= 0)  { alert('Qty harus lebih dari 0!');    return; }
    if (harga <= 0){ alert('Harga satuan harus diisi!');  return; }
    // ── Resolve SKU: normalize dan validasi vs produk list ──
    const resolved = _jpResolveSku(_jpViaRhApply(sku));   // 6 Okt 2026: "Kirim via RH" mencatat SKU RH-nya
    if (!resolved.ok) {
      const lanjut = await zConfirm(
        'SKU "' + sku + '" tidak ditemukan di master produk.\n' +
        'Pastikan SKU sudah benar sebelum menyimpan.\n\n' +
        'Tetap simpan?',
        {title: 'SKU tidak ditemukan', type: 'warn', ok: 'Tetap simpan'}
      );
      if (!lanjut) return;
    }
    allItems.push({ sku: resolved.sku, qty, harga, total: total||qty*harga, channel_id: chId, tgl, waktu });
  } else if (!hasPending) {
    // Form kosong dan tidak ada pending
    if (!sku)      { alert('SKU wajib diisi!');           return; }
    if (qty <= 0)  { alert('Qty harus lebih dari 0!');    return; }
    if (harga <= 0){ alert('Harga satuan harus diisi!');  return; }
  }

  if (allItems.length === 0) { alert('Tidak ada item untuk disimpan!'); return; }

  const btnSimpan = document.querySelector('#modal-jp .btn-primary');
  if (btnSimpan) { btnSimpan.textContent = 'Menyimpan...'; btnSimpan.disabled = true; }
  _jpIsSaving = true;
  _jpSetCancelLocked(true);

  try {
    if (id) {
      // Mode edit — simpan item pertama saja
      const p = allItems[0];
      await dbUpdate('jurnal_penjualan', id, {
        tanggal: tgl, waktu: p.waktu, channel_id: p.channel_id,
        sku: p.sku, qty: p.qty, harga_satuan: p.harga, total: p.total
      });
    } else {
      // Mode tambah — simpan semua item (pending + form)
      for (var i = 0; i < allItems.length; i++) {
        var p = allItems[i];
        await dbInsert('jurnal_penjualan', {
          tanggal: p.tgl || tgl, waktu: p.waktu || waktu,
          channel_id: p.channel_id, sku: (p.sku || '').toUpperCase(),
          qty: p.qty, harga_satuan: p.harga, total: p.total
        });
      }
    }
    _jpIsSaving = false;
    _jpSetCancelLocked(false);
    _jpPendingItems = []; // clear pending
    closeModalJP();
    loadJurnalPenjualan();
    if (typeof loadDashboard === 'function') loadDashboard();
  } catch(err) {
    _jpIsSaving = false;
    _jpSetCancelLocked(false);
    alert('Gagal simpan: ' + err.message);
  } finally {
    if (btnSimpan) {
      btnSimpan.innerHTML = '<i class="ti ti-device-floppy"></i> SIMPAN';
      btnSimpan.disabled = false;
    }
  }
}

// ─── PENDING LIST ────────────────────────────────────────────
var _jpPendingItems = []; // [{sku, qty, harga, total, channel_id, tgl, waktu, skuLabel}]
var _jpIsSaving = false; // true selama dbInsert/dbUpdate JP berjalan — cegah Batal/X/overlay menutup modal di tengah proses simpan

// 4 Okt 2026: baris "live" — begitu SKU Variasi dipilih (mode Tambah), isi form saat ini langsung
// tampil sebagai baris terakhir di daftar "Akan Disimpan" (ikut berubah saat Qty/Harga diedit),
// jadi jumlah baris di daftar = persis jumlah yang akan tersimpan saat klik SIMPAN.
// Tidak ada perubahan di simpanJP(): item form tetap ikut ke batch seperti sebelumnya.
function _jpLiveItem() {
  var idEl = document.getElementById('jp-id');
  if (!idEl || idEl.value) return null;                 // mode Edit: 1 transaksi saja, tanpa daftar
  var vEl = document.getElementById('jp-sku-variasi');
  var skuV = vEl ? vEl.value : '';
  if (!skuV) return null;
  var qty   = parseInt(document.getElementById('jp-qty').value) || 0;
  var harga = idrVal('jp-harga');
  var total = idrVal('jp-total') || qty * harga;
  var viaRh = !!(_jpViaRh && _jpViaRh.from === skuV.toUpperCase());
  return { sku: _jpViaRhApply(skuV), skuLabel: viaRh ? (_jpViaRh.label + ' (via RH)') : skuV, qty: qty, harga: harga, total: total, live: true };
}

// ─── KIRIM VIA RH (6 Okt 2026) ───────────────────────────────────
// Kasus: Turtleneck DIMI (ukuran M maupun XL) punya padanan di RH (All Size ~ XL, dropship). Kalau stok DIMI belum jadi dan batas
// kirim mepet, penjualan dicatat sebagai SKU RH-nya: stok DIMI tidak berkurang, bon RH terbentuk otomatis lewat
// mekanisme dropship yang sudah ada, dan harga satuan = HPP RH. Tidak ada kolom/tabel baru; modul lain tidak berubah.
// Padanan dicari lewat nama (spasi/underscore/huruf besar-kecil diabaikan): Turtleneck_HITAM-XL / -M  ->  Turtleneck_Hitam,
// dan hanya kalau SKU RH itu memang berstatus dropship (_jpDsMap) supaya tidak jadi SKU bertumpuk stok minus.
var _jpViaRh = null;   // { from, to, label, hpp } saat dicentang
function _jpNormSku(s) { return String(s || '').replace(/[\s_]+/g, '_').toLowerCase(); }
function _jpRhPair(sku) {
  var s0 = String(sku || '').trim();
  var m = /^(.*?)\s*-\s*(XXL|XL|L|M|S|XS)$/i.exec(s0);   // ukuran apa pun: RH hanya All Size, dikirim apa adanya
  if (!m) return null;
  var base = _jpNormSku(m[1]);
  if (!base) return null;
  if (_jpDsMap[s0.toUpperCase()]) return null;   // SKU ini sendiri sudah dropship
  for (var i = 0; i < _jpProdukList.length; i++) {
    var k = _jpGetSku(_jpProdukList[i]);
    if (!k || _jpNormSku(k) !== base) continue;
    if (!_jpDsMap[String(k).toUpperCase()]) continue;
    return { sku: String(k).toUpperCase(), label: k, hpp: Number(_jpGetHpp(_jpProdukList[i])) || 0, size: m[2].toUpperCase() };
  }
  return null;
}
function _jpViaRhApply(sku) {   // SKU yang benar-benar dicatat: SKU RH kalau "via RH" aktif untuk SKU ini
  var u = String(sku || '').trim().toUpperCase();
  return (_jpViaRh && _jpViaRh.from === u) ? _jpViaRh.to : u;
}
function _jpRp(n) { return 'Rp' + (Number(n) || 0).toLocaleString('id-ID'); }
function _jpViaRhRefresh() {
  var wrap = document.getElementById('jp-via-rh-wrap');
  if (!wrap) return;
  var cb = document.getElementById('jp-via-rh'), info = document.getElementById('jp-via-rh-info');
  var idEl = document.getElementById('jp-id'), vEl = document.getElementById('jp-sku-variasi');
  var skuV = vEl ? String(vEl.value || '') : '';
  var pair = (idEl && idEl.value) ? null : _jpRhPair(skuV);   // mode edit: tanpa pilihan ini
  if (!pair) { _jpViaRh = null; if (cb) cb.checked = false; wrap.style.display = 'none'; return; }
  if (_jpViaRh && _jpViaRh.from !== skuV.toUpperCase()) { _jpViaRh = null; if (cb) cb.checked = false; }
  wrap.style.display = 'block';
  if (!info) return;
  var sisa = _jpSisakMap[skuV.toUpperCase()];
  var catatan = (pair.size !== 'XL') ? ' <b>Ukuran yang dikirim RH: All Size (setara XL).</b>' : '';
  if (_jpViaRh) info.innerHTML = 'Dicatat sebagai <b>' + pair.label + '</b> &middot; harga RH ' + _jpRp(pair.hpp) + '. Stok DIMI tidak berkurang, masuk bon RH.' + catatan;
  else if (sisa !== undefined && sisa <= 0) info.innerHTML = '<span style="color:var(--danger);font-weight:700">Stok DIMI habis.</span> Centang untuk kirim via RH (' + pair.label + ', ' + _jpRp(pair.hpp) + ').';
  else info.innerHTML = 'Padanan di RH: ' + pair.label + ' &middot; ' + _jpRp(pair.hpp) + '.' + catatan;
}
function jpToggleViaRh() {
  var cb = document.getElementById('jp-via-rh');
  var sel = document.getElementById('jp-sku-variasi');
  var skuV = sel ? String(sel.value || '') : '';
  var pair = _jpRhPair(skuV);
  var hargaEl = document.getElementById('jp-harga');
  if (!cb || !pair || !hargaEl) return;
  if (cb.checked) {
    _jpViaRh = { from: skuV.toUpperCase(), to: pair.sku, label: pair.label, hpp: pair.hpp };
    if (pair.hpp > 0) hargaEl.value = pair.hpp;
  } else {
    _jpViaRh = null;
    var opt = sel.options[sel.selectedIndex];
    var h = (opt && parseInt(opt.dataset.hpp)) || 0;
    if (h > 0) hargaEl.value = h;   // kembali ke HPP DIMI
  }
  hitungTotalJP();
}

function _jpRenderPending() {
  _jpViaRhRefresh();   // pilihan "Kirim via RH" ikut SKU yang sedang dipilih
  var list  = document.getElementById('jp-pending-list');
  var tbody = document.getElementById('jp-pending-tbody');
  var count = document.getElementById('jp-pending-count');
  if (!list || !tbody) return;
  var rows = _jpPendingItems.map(function(it, i) { return { item: it, idx: i, live: false }; });
  var live = _jpLiveItem();
  if (live) rows.push({ item: live, idx: -1, live: true });
  if (rows.length === 0) { list.style.display = 'none'; return; }
  list.style.display = 'block';
  if (count) count.textContent = rows.length;
  tbody.innerHTML = rows.map(function(r) {
    var item = r.item;
    var rm = r.live ? '_jpClearLive()' : '_jpRemovePending(' + r.idx + ')';
    return '<tr style="border-bottom:1px solid var(--cream4)' + (r.live ? ';background:var(--cream2)' : '') + '">' +
      '<td style="padding:4px 4px;font-weight:600">' + item.skuLabel + '</td>' +
      '<td style="text-align:right;padding:4px 4px">' + item.qty + '</td>' +
      '<td style="text-align:right;padding:4px 4px;color:var(--ink3)">' + (item.harga ? 'Rp'+item.harga.toLocaleString('id-ID') : '—') + '</td>' +
      '<td style="text-align:right;padding:4px 4px;color:var(--ok);font-weight:700">Rp' + (item.total||0).toLocaleString('id-ID') + '</td>' +
      '<td style="text-align:center;padding:4px 2px">' +
        '<button onclick="' + rm + '" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;padding:0 4px">×</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function _jpRemovePending(idx) {
  _jpPendingItems.splice(idx, 1);
  _jpRenderPending();
}

// × pada baris live = batalkan pilihan SKU di form (baris pending lain tidak tersentuh)
function _jpClearLive() {
  document.getElementById('jp-sku-induk').value = '';
  _jpSetIndukLabel(null);
  document.getElementById('jp-sku-variasi').innerHTML = '<option value="">— Pilih Variasi —</option>';
  var lblV = document.getElementById('jp-picker-variasi-label');
  if (lblV) { lblV.textContent = '— Pilih Variasi —'; lblV.style.color = 'var(--ink3)'; }
  document.getElementById('jp-qty').value = '1';
  idrSet('jp-harga', 0);
  idrSet('jp-total', 0);
  var btn = document.getElementById('jp-btn-tambah-sku');
  if (btn) btn.style.display = 'none';
  _jpRenderPending();
}

// ─── SIMPAN & TAMBAH SKU LAIN ───────────────────────────────
function jpSimpanDanTambah() {
  const qty   = parseInt(document.getElementById('jp-qty').value) || 0;
  const harga = idrVal('jp-harga');
  const total = idrVal('jp-total') || qty * harga;
  const chIdRaw = document.getElementById('jp-channel').value;
  const chId    = chIdRaw ? chIdRaw : null;
  const skuV  = document.getElementById('jp-sku-variasi').value;
  const skuI  = document.getElementById('jp-sku-induk').value.trim().toUpperCase();
  const sku0  = (skuV || skuI).trim().toUpperCase();
  const sku   = _jpViaRhApply(sku0);   // 6 Okt 2026: "Kirim via RH" mencatat SKU RH-nya
  const skuLabel = (sku !== sku0 && _jpViaRh) ? (_jpViaRh.label + ' (via RH)') : (skuV || sku0);
  const tgl   = document.getElementById('jp-tgl').value;
  const waktu = document.getElementById('jp-waktu').value || _jpNowTime();

  if (!tgl)      { alert('Tanggal wajib diisi!');       return; }
  if (!sku)      { alert('SKU wajib diisi!');           return; }
  if (qty <= 0)  { alert('Qty harus lebih dari 0!');    return; }
  if (harga <= 0){ alert('Harga satuan harus diisi!');  return; }

  // Tambah ke list sementara — belum ke DB
  _jpPendingItems.push({ sku, skuLabel, qty, harga, total, channel_id: chId, tgl, waktu });
  _jpRenderPending();

  // Reset SKU — pertahankan tanggal, waktu, channel
  document.getElementById('jp-sku-induk').value = '';
  _jpSetIndukLabel(null);
  document.getElementById('jp-sku-variasi').innerHTML = '<option value="">— Pilih Variasi —</option>';
  document.getElementById('jp-qty').value = '1';
  idrSet('jp-harga', 0);
  idrSet('jp-total', 0);

  var lblV = document.getElementById('jp-picker-variasi-label');
  if (lblV) { lblV.textContent = '— Pilih Variasi —'; lblV.style.color = 'var(--ink3)'; }

  var btn = document.getElementById('jp-btn-tambah-sku');
  if (btn) btn.style.display = 'none';
  _jpRenderPending();   // form sudah dikosongkan -> baris live hilang, item barusan tinggal sebagai baris tetap

  // Buka lagi picker SKU Induk buat lanjut input SKU berikutnya
  setTimeout(function() { jpSkuSheetOpen('induk'); }, 150);
}

// ─── HAPUS ───────────────────────────────────────────────────
async function hapusJP(id, sku) {
  confirmDelete('Hapus transaksi SKU "' + sku + '"?', async () => {
    try {
      await dbDelete('jurnal_penjualan', id);
      var m = document.getElementById('modal-jp');
      if (m && m.classList.contains('open')) closeModalJP();
      loadJurnalPenjualan();
      if (typeof loadDashboard === 'function') loadDashboard();
    } catch(err) { alert('Gagal hapus: ' + err.message); }
  });
}

// 18 Sep 2026: dipanggil tombol Hapus di dalam modal-jp (mode edit) —
// baris tabel udah gak punya kolom Aksi lagi (lihat _jpInitLongPress).
function jpHapusDariModal() {
  const id = document.getElementById('jp-id').value;
  if (!id) return;
  const sku = document.getElementById('jp-sku-variasi').value
    || document.getElementById('jp-sku-induk').value || '';
  hapusJP(id, sku);
}

// ─── EXPORT ──────────────────────────────────────────────────

// ─── STATE FILTER AKTIF (hidden input) ───────────────────────
// Penyimpan nilai filter periode & channel yang dibaca loadJurnalPenjualan()/filterJP().
// Ditulis oleh sheet filter (jpFilterApply). Di-mount ke body supaya tidak tergantung layout halaman.
(function() {
  if (document.getElementById('jp-filter-state')) return;
  var st = document.createElement('div');
  st.id = 'jp-filter-state';
  st.style.display = 'none';
  st.innerHTML = '<input type="hidden" id="jp-filter-minggu-dari">'
    + '<input type="hidden" id="jp-filter-minggu-sampai">'
    + '<input type="hidden" id="jp-filter-bulan">'
    + '<input type="hidden" id="jp-filter-tahun">'
    + '<input type="hidden" id="jp-filter-channel" value="">';
  document.body.appendChild(st);
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
// Default periode: Minggu Ini (18 Sep 2026, permintaan user — sebelumnya 7 hari terakhir)
_jpWaktuMode = 'minggu-ini';
// Guard: pastikan elemen sudah ada sebelum mengisi nilai (IIFE inject sudah jalan di atas)
(function _jpSafeInit() {
  var bulanEl = document.getElementById('jp-filter-bulan');
  if (bulanEl) {
    var n = new Date();
    bulanEl.value = n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0');
  }
  var tahunEl = document.getElementById('jp-filter-tahun');
  if (tahunEl) tahunEl.value = new Date().getFullYear();
  // Default isi "Minggu" (range custom) = minggu LALU (Minggu–Sabtu), biar begitu radio
  // ini dipilih langsung kepakai buat lihat minggu sebelumnya tanpa perlu ngatur manual dulu.
  var mDariEl = document.getElementById('jp-filter-minggu-dari'), mSampaiEl = document.getElementById('jp-filter-minggu-sampai');
  if (mDariEl && mSampaiEl) {
    var mn = new Date();
    var thisWeekStart = new Date(mn.getFullYear(), mn.getMonth(), mn.getDate() - mn.getDay());
    var lastWeekStart  = new Date(thisWeekStart.getFullYear(), thisWeekStart.getMonth(), thisWeekStart.getDate() - 7);
    var lastWeekEnd    = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate() + 6);
    mDariEl.value   = _jpLocalDate(lastWeekStart);
    mSampaiEl.value = _jpLocalDate(lastWeekEnd);
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
    var st = document.getElementById('jp-tren-sticky');
    if (st) st.classList.remove('jp-tren-sticky-collapsed');
    // Re-scroll ke atas
    var wrap = document.getElementById('jp-tbl-wrap');
    if (wrap) wrap.scrollTop = 0;
  });
  // Reload data otomatis saat navigasi ke halaman ini (debounce 250ms)
  clearTimeout(window._jpReloadTimer);
  window._jpReloadTimer = setTimeout(loadJurnalPenjualan, 250);
});

// ─── SWIPE GESTURE — collapse jp-top-bar + jp-tren-sticky ─────────────────
(function() {
  var _isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  function _jpInitSwipeTopBar() {
    if (!_isTouchDevice) return;
    var zone   = document.getElementById('jp-sticky-header');
    var topBar = document.getElementById('jp-top-bar');
    if (!zone || !topBar) return;
    initSwipeCollapse(zone,   topBar, 50, 'jp-topbar-collapsed');
    initSwipeCollapse(topBar, topBar, 50, 'jp-topbar-collapsed');
  }

  function _jpInitSwipeTren() {
    if (!_isTouchDevice) return;
    var sticky = document.getElementById('jp-tren-sticky');
    var bsWrap = document.getElementById('jp-bs-ch-wrap');
    if (!sticky || !bsWrap) return;
    initSwipeCollapse(bsWrap,  sticky, 50, 'jp-tren-sticky-collapsed');
    initSwipeCollapse(sticky,  sticky, 50, 'jp-tren-sticky-collapsed');
  }

  setTimeout(function() { _jpInitSwipeTopBar(); _jpInitSwipeTren(); }, 250);

  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'jurnal-penjualan') return;
    setTimeout(function() {
      var tb = document.getElementById('jp-top-bar');
      if (tb) tb.classList.remove('jp-topbar-collapsed');
      var st = document.getElementById('jp-tren-sticky');
      if (st) st.classList.remove('jp-tren-sticky-collapsed');
      _jpInitSwipeTopBar();
      _jpInitSwipeTren();
    }, 80);
  });
})();

// ─── JP CUSTOM PICKER ENGINE ─────────────────────────────────


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


// ─── PICKER BOTTOM SHEET (BRImo-style): SKU Induk & SKU Variasi ──
// 1 sheet dipakai gantian buat 2 field lewat _jpSkuSheetMode ('induk'/'variasi').
var _jpSkuSheetMode = null;

function jpSkuSheetOpen(mode) {
  _jpSkuSheetMode = mode;
  var searchEl = document.getElementById('jp-sku-sheet-search');
  var titleEl  = document.getElementById('jp-sku-sheet-title');
  if (searchEl) {
    searchEl.value = '';
    searchEl.placeholder = mode === 'induk' ? 'Cari SKU Induk...' : mode === 'variasi' ? 'Cari variasi...' : 'Cari channel...';
  }
  if (titleEl) titleEl.textContent = mode === 'induk' ? 'Pilih SKU Induk' : mode === 'variasi' ? 'Pilih Variasi' : 'Pilih Channel';
  var ov = document.getElementById('jp-sku-sheet-overlay');
  var sh = document.getElementById('jp-sku-sheet');
  if (ov) ov.classList.add('open');
  if (sh) sh.classList.add('open');
  jpSkuSheetRender('');
  var _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (searchEl && !_isIOS) setTimeout(function() { searchEl.focus(); }, 260);
}
function jpSkuSheetClose() {
  var ov = document.getElementById('jp-sku-sheet-overlay');
  var sh = document.getElementById('jp-sku-sheet');
  if (ov) ov.classList.remove('open');
  if (sh) sh.classList.remove('open');
}
function jpSkuSheetFilter(q) { jpSkuSheetRender(q); }
function jpSkuSheetRender(q) {
  if (_jpSkuSheetMode === 'induk') _jpSkuSheetRenderInduk(q);
  else if (_jpSkuSheetMode === 'variasi') _jpSkuSheetRenderVariasi(q);
  else if (_jpSkuSheetMode === 'channel') _jpSkuSheetRenderChannel(q);
}

// ─── Riwayat SKU Induk — aturan sama persis kayak riwayat channel
// (_jpChHistGet/Push/Top): simpen {count, last} per katalog di localStorage,
// diurut paling SERING dipakai, tie-break paling baru. ──
function _jpIndHistGet() {
  try { return JSON.parse(localStorage.getItem('jp_induk_hist') || '{}'); }
  catch(e) { return {}; }
}
function _jpIndHistPush(kat) {
  if (!kat) return;
  try {
    var hist = _jpIndHistGet();
    var cur = hist[kat] || { count: 0, last: 0 };
    hist[kat] = { count: cur.count + 1, last: Date.now() };
    localStorage.setItem('jp_induk_hist', JSON.stringify(hist));
  } catch(e) {}
}
function _jpIndHistTop(n) {
  var hist = _jpIndHistGet();
  return Object.keys(hist)
    .sort(function(a, b) {
      var ha = hist[a], hb = hist[b];
      if (hb.count !== ha.count) return hb.count - ha.count;
      return hb.last - ha.last;
    })
    .slice(0, n);
}

function _jpSkuSheetRenderInduk(q) {
  var listEl = document.getElementById('jp-sku-sheet-list');
  if (!listEl) return;
  q = (q || '').toLowerCase().trim();
  var _chId = String(document.getElementById('jp-channel').value || '');
  var allowed = _jpAllowedProduk();
  if (allowed === undefined) {   // produk channel ini belum dimuat → muat dulu lalu render ulang
    listEl.innerHTML = '<div class="jp-sheet-empty">Memuat produk channel...</div>';
    _jpLoadChProduk(_chId).then(function() {
      if (_jpSkuSheetMode === 'induk') {
        var se = document.getElementById('jp-sku-sheet-search');
        jpSkuSheetRender(se ? se.value : '');
      }
    });
    return;
  }
  var katalogMap = {};
  allowed.forEach(function(p) {
    var kat = _jpGetKatalog(p);
    if (!kat) return;
    if (q && kat.toLowerCase().indexOf(q) === -1) return;
    katalogMap[kat] = (katalogMap[kat] || 0) + 1;
  });
  var katalogs = Object.keys(katalogMap).sort();
  var html = '';

  // "Sering & Terakhir Digunakan" — cuma pas search kosong, sama pola
  // kayak picker Channel. Item yang sama tetep nongol lagi di list A-Z
  // di bawah (sengaja dobel).
  if (!q) {
    var topKat = _jpIndHistTop(5).filter(function(k) { return katalogMap[k]; });
    if (topKat.length) {
      html += '<div style="font-size:11px;font-weight:700;color:var(--ink3);padding:10px 10px 2px;letter-spacing:.06em;display:flex;align-items:center;gap:5px"><i class="ti ti-clock" style="font-size:12px"></i> Sering & Terakhir Digunakan</div>';
      topKat.forEach(function(kat) {
        html += '<div class="jp-sheet-item" onclick="jpSkuSheetSelectInduk(\'' + kat.replace(/'/g,"\\'") + '\')">' +
          '<span>' + kat + '</span>' +
          '<span style="font-size:11px;color:var(--ink3)">' + katalogMap[kat] + ' var</span></div>';
      });
      html += '<div style="font-size:11px;font-weight:700;color:var(--ink3);padding:10px 10px 2px;letter-spacing:.06em">── Semua SKU ──</div>';
    }
  }

  if (!katalogs.length) {
    var _chNama = (_jpChannelMap[_chId] || {}).nama || '';
    html += '<div class="jp-sheet-empty">' +
      (_jpProdukList.length === 0 ? 'Produk belum ada — tambah di Kelola Produk'
        : (_jpChannelKosong() ? 'Channel ' + _chNama + ' belum punya produk — tambahkan dulu di menu Channel (ikon 📦)'
        : 'Tidak ada SKU yang cocok')) + '</div>';
  } else {
    katalogs.forEach(function(kat) {
      html += '<div class="jp-sheet-item" onclick="jpSkuSheetSelectInduk(\'' + kat.replace(/'/g,"\\'") + '\')">' +
        '<span>' + kat + '</span>' +
        '<span style="font-size:11px;color:var(--ink3)">' + katalogMap[kat] + ' var</span></div>';
    });
  }
  listEl.innerHTML = html;
}

function _jpSkuSheetRenderVariasi(q) {
  var listEl = document.getElementById('jp-sku-sheet-list');
  if (!listEl) return;
  var katalog = document.getElementById('jp-sku-induk').value;
  var varList = _jpProdukList.filter(function(p) { return _jpGetKatalog(p) === katalog; });
  q = (q || '').toLowerCase().trim();
  var items = _jpSortVariasi(varList.filter(function(p) { return !q || _jpGetSku(p).toLowerCase().indexOf(q) !== -1; }));
  var html = '';
  function _varRowHtml(p) {
    var sku = _jpGetSku(p);
    var hpp = _jpGetHpp(p);
    var sisa = _jpSisakMap[sku.toUpperCase()];
    var sisakHtml = '';
    if (_jpDsMap[sku.toUpperCase()]) {
      sisakHtml = '<span style="font-size:11px;font-weight:700;color:var(--info)">dropship</span>';
    } else if (sisa !== undefined) {
      var col = sisa <= 0 ? 'var(--danger)' : sisa <= 3 ? 'var(--warn)' : 'var(--ok)';
      sisakHtml = '<span style="font-size:11px;font-weight:700;color:' + col + '">stok: ' + sisa + '</span>';
    }
    return '<div class="jp-sheet-item" onclick="jpSkuSheetSelectVariasi(\'' + sku.replace(/'/g,"\\'") + '\',' + (hpp||0) + ')">' +
      '<span>' + sku + '</span>' + sisakHtml + '</div>';
  }
  if (!katalog) {
    html = '<div class="jp-sheet-empty">Pilih SKU Induk dulu</div>';
  } else if (!items.length) {
    html = '<div class="jp-sheet-empty">' + (q ? 'Tidak ada variasi yang cocok' : 'Belum ada variasi untuk SKU ini') + '</div>';
  } else {
    // "Sering & Terakhir Digunakan" — cuma pas search kosong (zHistTop di app.js). [27 Sep 2026]
    if (!q) {
      var bySku = {};
      items.forEach(function(p) { bySku[_jpGetSku(p).toUpperCase()] = p; });
      // [8 Okt 2026] Riwayat variasi sekarang PER KATALOG ('jp_variasi_<KATALOG>'). Dulu: top-5 GLOBAL ('jp_variasi', semua katalog, maks 20 entri) baru
      // difilter ke katalog yang lagi dibuka -> kalau 5 teratas milik katalog lain (atau variasi katalog ini sudah tergeser dari 20 entri), section "Sering & Terakhir"
      // kosong walau katalog ini sudah sering dipakai. Riwayat global lama tetap dibaca sebagai cadangan (setelah riwayat katalog), jadi data lama tidak hilang.
      var _seenH = {}, _topKeys = [];
      zHistTop('jp_variasi_' + String(katalog).toUpperCase(), 20).concat(zHistTop('jp_variasi', 20)).forEach(function(k) {
        if (bySku[k] && !_seenH[k]) { _seenH[k] = 1; _topKeys.push(k); }
      });
      var top = _topKeys.slice(0, 5).map(function(k) { return bySku[k]; });
      if (top.length) {
        html += '<div style="font-size:11px;font-weight:700;color:var(--ink3);padding:10px 10px 2px;letter-spacing:.06em;display:flex;align-items:center;gap:5px"><i class="ti ti-clock" style="font-size:12px"></i> Sering & Terakhir Digunakan</div>';
        top.forEach(function(p) { html += _varRowHtml(p); });
        html += '<div style="font-size:11px;font-weight:700;color:var(--ink3);padding:10px 10px 2px;letter-spacing:.06em">── Semua ──</div>';
      }
    }
    items.forEach(function(p) { html += _varRowHtml(p); });
  }
  listEl.innerHTML = html;
}

function _jpSetIndukLabel(text) {
  var lbl = document.getElementById('jp-picker-induk-label');
  if (lbl) {
    lbl.textContent = text || '— Pilih SKU Induk —';
    lbl.style.color = text ? 'var(--ink)' : 'var(--ink3)';
  }
}

function jpSkuSheetSelectInduk(katalog) {
  _jpIndHistPush(katalog); // riwayat sering/terakhir dipakai
  jpSkuSheetClose();
  jpPilihKatalog(katalog);
}

function jpSkuSheetSelectVariasi(sku, hpp) {
  zHistPush('jp_variasi', sku.toUpperCase()); // riwayat sering/terakhir dipakai
  var _katH = (document.getElementById('jp-sku-induk') || {}).value;   // [8 Okt 2026] + riwayat per katalog (lihat _jpSkuSheetRenderVariasi)
  if (_katH) zHistPush('jp_variasi_' + String(_katH).toUpperCase(), sku.toUpperCase());
  var sel = document.getElementById('jp-sku-variasi');
  if (sel) {
    sel.value = sku;
    sel.dispatchEvent(new Event('change'));
  }
  var lbl = document.getElementById('jp-picker-variasi-label');
  if (lbl) {
    var sisa = _jpSisakMap[sku.toUpperCase()];
    var sisakTxt = '';
    if (_jpDsMap[sku.toUpperCase()]) {
      sisakTxt = ' <span style="font-size:11px;font-weight:700;color:var(--info)">dropship</span>';
    } else if (sisa !== undefined) {
      var col = sisa <= 0 ? 'var(--danger)' : sisa <= 3 ? 'var(--warn)' : 'var(--ok)';
      sisakTxt = ' <span style="font-size:11px;font-weight:700;color:' + col + '">stok: ' + sisa + '</span>';
    }
    lbl.innerHTML = '<span style="color:var(--ink)">' + sku + '</span>' + sisakTxt;
  }
  var btnTambah = document.getElementById('jp-btn-tambah-sku');
  if (btnTambah) btnTambah.style.display = sku ? 'block' : 'none';
  jpOnPilihVariasi();
  jpSkuSheetClose();
}

// ─── Channel — sama seperti SKU Induk/Variasi, dikelompokin per kategori
// (Toko Utama/Reseller/Lazada/TikTok/Offline), sumber data _jpChannelMap
// yang udah dipopulate loadChannelDropdownJP(). ──
var _jpChKatConfig = {
  toko_utama: 'Toko Utama', reseller: 'Dropship', reseller_baru: 'Reseller', lazada: 'Lazada',
  tiktok: 'TikTok', offline: 'Offline'
};
// ─── Riwayat channel — frekuensi + terakhir dipakai, localStorage.
// Beda dari _gdgRecentSkuGet (recency doang, max 4): di sini kita
// simpen {count, last} per channel biar bisa nampilin "yang paling
// SERING dipakai" di atas (bukan cuma yang terakhir), sesuai
// permintaan user (12 Sep 2026). Tie-break pakai waktu terakhir
// dipakai kalau count sama. ──
function _jpChHistKey() { return 'jp_channel_hist'; }
function _jpChHistGet() {
  try { return JSON.parse(localStorage.getItem(_jpChHistKey()) || '{}'); }
  catch(e) { return {}; }
}
function _jpChHistPush(id) {
  if (!id) return;
  try {
    var hist = _jpChHistGet();
    var key = String(id);
    var cur = hist[key] || { count: 0, last: 0 };
    hist[key] = { count: cur.count + 1, last: Date.now() };
    localStorage.setItem(_jpChHistKey(), JSON.stringify(hist));
  } catch(e) {}
}
// Ambil top-N id channel diurut: count desc, tie-break last desc
function _jpChHistTop(n) {
  var hist = _jpChHistGet();
  return Object.keys(hist)
    .sort(function(a, b) {
      var ha = hist[a], hb = hist[b];
      if (hb.count !== ha.count) return hb.count - ha.count;
      return hb.last - ha.last;
    })
    .slice(0, n);
}

function _jpSkuSheetRenderChannel(q) {
  var listEl = document.getElementById('jp-sku-sheet-list');
  if (!listEl) return;
  q = (q || '').toLowerCase().trim();
  var ids = Object.keys(_jpChannelMap || {});
  var grouped = {};
  ids.forEach(function(id) {
    var ch = _jpChannelMap[id];
    if (q && ch.nama.toLowerCase().indexOf(q) === -1) return;
    var kat = ch.kategori || 'lainnya';
    if (!grouped[kat]) grouped[kat] = [];
    grouped[kat].push(ch);
  });
  var kats = Object.keys(grouped);
  var html = '';

  // "Sering & Terakhir Digunakan" — cuma pas search kosong, sama pola
  // kayak MRU SKU picker Gadag (_gdgRecentSkuGet) — item yang sama
  // tetep nongol lagi di listing normal per kategori di bawah.
  if (!q) {
    var topIds = _jpChHistTop(5).filter(function(id) { return _jpChannelMap[id]; });
    if (topIds.length) {
      html += '<div style="font-size:11px;font-weight:700;color:var(--ink3);padding:10px 10px 2px;letter-spacing:.06em;display:flex;align-items:center;gap:5px"><i class="ti ti-clock" style="font-size:12px"></i> Sering & Terakhir Digunakan</div>';
      topIds.forEach(function(id) {
        var ch = _jpChannelMap[id];
        html += '<div class="jp-sheet-item" onclick="jpSkuSheetSelectChannel(\'' + ch.id + '\')"><span>' + ch.nama + '</span></div>';
      });
    }
  }

  if (!kats.length) {
    html += '<div class="jp-sheet-empty">' + (ids.length === 0 ? 'Channel belum ada' : 'Tidak ada channel yang cocok') + '</div>';
  } else {
    kats.forEach(function(kat) {
      html += '<div style="font-size:11px;font-weight:700;color:var(--ink3);padding:10px 10px 2px;letter-spacing:.06em">── ' + (_jpChKatConfig[kat] || kat) + ' ──</div>';
      grouped[kat].forEach(function(ch) {
        html += '<div class="jp-sheet-item" onclick="jpSkuSheetSelectChannel(\'' + ch.id + '\')"><span>' + ch.nama + '</span></div>';
      });
    });
  }
  listEl.innerHTML = html;
}
function jpSkuSheetSelectChannel(id) {
  var sel = document.getElementById('jp-channel');
  var ch  = _jpChannelMap[id];
  if (sel) { sel.value = id; sel.dispatchEvent(new Event('change')); }
  var lbl = document.getElementById('jp-picker-channel-label');
  if (lbl) {
    lbl.textContent = ch ? ch.nama : '— Pilih Channel —';
    lbl.style.color = ch ? 'var(--ink)' : 'var(--ink3)';
  }
  if (id && ch) { _jpSaveLastChannel(id, ch.nama); _jpChHistPush(id); } // prefill "channel terakhir" + riwayat sering/terakhir dipakai
  jpSkuSheetClose();
  _jpOnChannelChosen(id);   // muat produk channel ini + alert kalau kosong
}

// Reset label picker variasi saat katalog/modal reset
if (typeof closeModalJP === 'function') {
  var _jpOrigClose2 = closeModalJP;
  window.closeModalJP = function() {
    _jpOrigClose2();
    var lblV = document.getElementById('jp-picker-variasi-label');
    if (lblV) { lblV.textContent = '— Pilih Variasi —'; lblV.style.color = 'var(--ink3)'; }
    var lblC = document.getElementById('jp-picker-channel-label');
    if (lblC) { lblC.textContent = '— Pilih Channel —'; lblC.style.color = 'var(--ink3)'; }
    _jpSetIndukLabel(null);
    jpSkuSheetClose();
  };
}

// Tutup picker saat klik di luar
// close listener: handled by unified handler in app.js
