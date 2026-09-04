// ─── JURNAL-PENJUALAN.JS ─────────────────────────────────────

document.getElementById('page-jurnal-penjualan').innerHTML = `

  <!-- TOP BAR: collapse on swipe — berisi filter + tab dalam 1 baris -->
  <div id="jp-top-bar">
    <!-- TOOLBAR LAPTOP: filter + tab dalam satu baris -->
    <div id="jp-aksi-laptop" style="display:flex;gap:6px;align-items:center;flex-wrap:nowrap;margin-bottom:0;border-bottom:2px solid var(--ink4);padding-bottom:0">
      <button class="btn btn-sm" onclick="loadJurnalPenjualan()" title="Refresh" style="padding:4px 8px">
        <i class="ti ti-refresh"></i>
      </button>
      <button class="btn btn-sm" id="jp-periode-btn-laptop" onclick="jpTogglePeriode()"
        style="display:flex;align-items:center;gap:4px;font-size:12px">
        <i class="ti ti-calendar"></i>
        <span class="jp-periode-label-sync">7 Hari</span>
        <span style="font-size:10px">&#9662;</span>
      </button>
      <button class="btn btn-sm" id="jp-channel-btn-laptop" onclick="jpToggleChannel()"
        style="display:flex;align-items:center;gap:4px;font-size:12px">
        <i class="ti ti-building-store"></i>
        <span class="jp-channel-label-sync">Channel</span>
        <span style="font-size:10px">&#9662;</span>
      </button>
      <!-- Tab buttons sejajar filter -->
      <div style="display:flex;gap:0;margin-left:auto;align-self:stretch">
        <button id="jp-tab-jurnal" onclick="jpSwitchTab('jurnal')"
          style="padding:6px 16px;font-family:var(--f);font-size:12px;font-weight:700;background:none;border:none;border-bottom:2px solid var(--accent);margin-bottom:-2px;color:var(--ink);cursor:pointer">
          <i class="ti ti-receipt"></i> Jurnal
        </button>
        <button id="jp-tab-tren" onclick="jpSwitchTab('tren')"
          style="padding:6px 16px;font-family:var(--f);font-size:12px;font-weight:700;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--ink3);cursor:pointer">
          <i class="ti ti-chart-line"></i> Tren & Best Seller
        </button>
      </div>
    </div>
    <!-- TOOLBAR MOBILE: filter + tab dalam satu baris -->
    <div id="jp-aksi-mobile" style="display:flex;gap:4px;margin-bottom:0;align-items:center;flex-wrap:nowrap;border-bottom:2px solid var(--ink4);padding-bottom:0">
      <button class="btn btn-sm" onclick="loadJurnalPenjualan()" title="Refresh" style="padding:4px 8px">
        <i class="ti ti-refresh"></i>
      </button>
      <button class="btn btn-sm" id="jp-periode-btn" onclick="jpTogglePeriode()"
        style="display:flex;align-items:center;gap:3px;font-size:11px">
        <i class="ti ti-calendar"></i>
        <span id="jp-periode-label">7 Hari Terakhir</span>
        <span id="jp-periode-badge" style="display:none;background:var(--accent);color:#fff;font-size:9px;padding:1px 4px;border-radius:8px;font-weight:700">●</span>
        <span style="font-size:10px">&#9662;</span>
      </button>
      <button class="btn btn-sm" id="jp-channel-btn" onclick="jpToggleChannel()"
        style="display:flex;align-items:center;gap:3px;font-size:11px">
        <i class="ti ti-building-store"></i>
        <span id="jp-channel-label">Channel</span>
        <span id="jp-channel-badge" style="display:none;background:var(--accent);color:#fff;font-size:9px;padding:1px 4px;border-radius:8px;font-weight:700">●</span>
        <span style="font-size:10px">&#9662;</span>
      </button>
      <!-- Tab buttons mobile -->
      <div style="display:flex;gap:0;margin-left:auto;align-self:stretch">
        <button id="jp-tab-jurnal-mob" onclick="jpSwitchTab('jurnal')"
          style="padding:6px 10px;font-family:var(--f);font-size:11px;font-weight:700;background:none;border:none;border-bottom:2px solid var(--accent);margin-bottom:-2px;color:var(--ink);cursor:pointer">
          Jurnal
        </button>
        <button id="jp-tab-tren-mob" onclick="jpSwitchTab('tren')"
          style="padding:6px 10px;font-family:var(--f);font-size:11px;font-weight:700;background:none;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;color:var(--ink3);cursor:pointer">
          Tren
        </button>
      </div>
    </div>
  </div>

  <!-- ═══ TAB PANE: TREN & BEST SELLER ═══ -->
  <div id="jp-pane-tren" style="display:none;flex-direction:column;flex:1;min-height:0;gap:10px;padding:10px;overflow:hidden;">

    <!-- STICKY: mini cards + chart (collapsible on swipe) -->
    <div id="jp-tren-sticky">

    <!-- MINI CARDS -->
    <div class="metrics" style="margin-bottom:0;flex-shrink:0">
      <div class="metric">
        <div class="m-label">Total Penjualan</div>
        <div class="m-value" id="jp-total-penjualan2">—</div>
        <div class="m-delta">semua transaksi</div>
      </div>
      <div class="metric">
        <div class="m-label">Total Item Terjual</div>
        <div class="m-value" id="jp-total-item2">—</div>
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
    </div>

    </div><!-- /jp-tren-sticky -->

    <!-- BEST SELLER + CHANNEL TERBAIK: side by side -->
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
  }
  /* ── Mobile (portrait & landscape HP): toolbar dalam card ── */
  @media (max-width: 767px) {
    #jp-aksi-laptop { display: none !important; }
    #jp-aksi-mobile { display: flex !important; }
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
          <!-- Fallback: SKU belum ada di master produk, ketik manual (mis. lagi edit
               transaksi lama yang SKU-nya udah gak ada, atau item nyeleneh sekali jual).
               Disembunyikan default, cuma muncul lewat "Ketik SKU manual..." di sheet
               atau otomatis pas Edit transaksi yang SKU-nya gak ketemu di master. -->
          <div id="jp-sku-induk-manual-wrap" style="display:none;margin-top:6px">
            <input type="text" id="jp-sku-induk-manual" placeholder="Ketik SKU manual..."
              autocomplete="off" oninput="jpOnManualIndukInput()"
              style="font-family:var(--f);font-size:14px;width:100%;box-sizing:border-box;
                     padding:6px 10px;border:2px solid var(--ink);background:var(--cream)">
          </div>
          <button id="jp-btn-tambah-sku"
            onclick="jpSimpanDanTambah()"
            title="Simpan & tambah SKU lain"
            style="display:none;margin-top:6px;background:var(--ok);border:2px solid var(--ok);
                   padding:8px 12px;cursor:pointer;font-size:14px;color:#fff;font-weight:700;
                   min-height:38px;border-radius:6px;width:100%">+ Simpan &amp; Tambah SKU Lain</button>
        </div>
      </div>

      <!-- ── PICKER BOTTOM SHEET (ala BRImo): dipakai gantian buat SKU Induk
           & SKU Variasi (mode via _jpSkuSheetMode) — konsisten sama picker
           akun di Kas & Jurnal / supplier di Hutang Barang. ── -->
      <div id="jp-sku-sheet-overlay" onclick="if(event.target===this) jpSkuSheetClose()"></div>
      <div id="jp-sku-sheet">
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
        style="border-top:1.5px dashed var(--ink3);padding-top:12px">
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

  <!-- ═══ TAB PANE: JURNAL ═══ -->
  <div id="jp-pane-jurnal" style="display:flex;flex-direction:column;flex:1;min-height:0">

  <!-- MINI METRICS TAB 1 -->
  <div class="metrics" style="margin:10px 0 8px">
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
let _jpSkuIndex   = -1;
let _jpDdMode     = 'bulan'; // default: bulan ini
let _jpSisakMap   = {}; // stok sisa per SKU (uppercase), diisi saat render tabel
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

// (Renderer list variasi lama dicabut 4 Sep 2026 — diganti _jpSkuSheetRenderVariasi
// yang render ke sheet BRImo baru, bukan floating dropdown .kas-akun-list.)

async function jpPilihKatalog(katalog) {
  document.getElementById('jp-sku-induk').value = katalog;
  _jpSetIndukLabel(katalog);
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
  // Refresh sisa stok di background — sheet variasi baca dari _jpSisakMap pas dibuka/render
  _jpRefreshSisakMap();
  // Reset label picker variasi
  var lbl = document.getElementById('jp-picker-variasi-label');
  if (lbl) { lbl.textContent = '— Pilih Variasi —'; lbl.style.color = 'var(--ink3)'; }

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
    const mode = _jpWaktuMode || '7hari';
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
    } else if (mode === '7hari') {
      const since = _jpLocalDate(new Date(now.getTime() - 7*24*60*60*1000));
      const besok = _jpLocalDate(new Date(now.getTime() + 24*60*60*1000));
      filter = '&tanggal=gte.' + since + '&tanggal=lt.' + besok;
    } else if (mode === '30hari') {
      const since = _jpLocalDate(new Date(now.getTime() - 30*24*60*60*1000));
      const besok = _jpLocalDate(new Date(now.getTime() + 24*60*60*1000));
      filter = '&tanggal=gte.' + since + '&tanggal=lt.' + besok;
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
    } else if (mode === 'semua') {
      filter = '';
    }

    const data = await dbGet('jurnal_penjualan', filter + '&order=tanggal.desc,id.desc');
    _jpAllData = data || [];
    filterJP();
    jpLoadTargetHarian(); // progress bar target harian
    _jpRefreshSisakMap(); // refresh sisa stok all-time untuk picker (async, non-blocking)
    // Re-apply flex layout setelah data selesai — pastikan portrait juga flat seperti landscape
    _jpEnsureFlexLayout();
  } catch(err) {
    tbody.innerHTML = '<tr><td colspan="9" style="color:var(--danger)">Error: ' + err.message + '</td></tr>';
  }
}


// ─── FILTER WAKTU BERGAYA SHOPEE ─────────────────────────────
var _jpWaktuMode = '7hari'; // default: 7 hari terakhir

function jpSetWaktu(mode) {
  _jpWaktuMode = mode;
  // Show/hide sub-input
  var bulanWrap  = document.getElementById('jp-bulan-wrap');
  if (bulanWrap)  bulanWrap.style.display  = mode === 'bulan'  ? 'block' : 'none';
  jpUpdatePeriodeLabel();
  jpUpdateBadge();
  if (mode !== 'bulan') {
    loadJurnalPenjualan();
    // Tutup panel periode setelah pilih (kecuali bulan yang butuh sub-input)
    var panel = document.getElementById('jp-periode-panel');
    if (panel) panel.style.display = 'none';
    document.removeEventListener('click', jpClosePeriodeOutside);
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
  if (isOpen) {
    panel.style.display = 'none';
    document.removeEventListener('click', jpClosePeriodeOutside);
  } else {
    _jpPositionPanel(activeBtn, 'jp-periode-panel');
    panel.style.display = 'block';
    document.removeEventListener('click', jpClosePeriodeOutside); // jaga-jaga: pastikan nggak dobel sebelum pasang baru
    setTimeout(function() {
      document.addEventListener('click', jpClosePeriodeOutside);
    }, 50);
  }
}
function jpClosePeriodeOutside(e) {
  var panel    = document.getElementById('jp-periode-panel');
  var btnLap   = document.getElementById('jp-periode-btn-laptop');
  var btnMob   = document.getElementById('jp-periode-btn');
  var diDalamTombol = (btnLap && btnLap.contains(e.target)) || (btnMob && btnMob.contains(e.target));
  if (panel && !panel.contains(e.target) && !diDalamTombol) {
    panel.style.display = 'none';
    document.removeEventListener('click', jpClosePeriodeOutside);
  }
}
function jpResetPeriode() {
  _jpWaktuMode = '7hari';
  var radios = document.querySelectorAll('input[name="jp-waktu"]');
  radios.forEach(function(r) { r.checked = r.value === '7hari'; });
  var bulanWrap = document.getElementById('jp-bulan-wrap');
  if (bulanWrap) bulanWrap.style.display = 'none';
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
  if (perPanel) { perPanel.style.display = 'none'; document.removeEventListener('click', jpClosePeriodeOutside); }
  var isOpen = panel.style.display !== 'none';
  var activeCh = window.innerWidth > 520 ? 'jp-channel-btn-laptop' : 'jp-channel-btn';
  if (isOpen) {
    panel.style.display = 'none';
    document.removeEventListener('click', jpCloseChannelOutside);
  } else {
    _jpPositionPanel(activeCh, 'jp-channel-panel');
    panel.style.display = 'block';
    document.removeEventListener('click', jpCloseChannelOutside); // jaga-jaga: pastikan nggak dobel sebelum pasang baru
    setTimeout(function() {
      document.addEventListener('click', jpCloseChannelOutside);
    }, 50);
  }
}
function jpCloseChannelOutside(e) {
  var panel    = document.getElementById('jp-channel-panel');
  var btnLap   = document.getElementById('jp-channel-btn-laptop');
  var btnMob   = document.getElementById('jp-channel-btn');
  var diDalamTombol = (btnLap && btnLap.contains(e.target)) || (btnMob && btnMob.contains(e.target));
  if (panel && !panel.contains(e.target) && !diDalamTombol) {
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
    '30hari':   '1 Bulan Terakhir',
    'bulan':    'Bulan',
    'semua':    'Semua'
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
  var mode    = _jpWaktuMode || '7hari';
  var channel = (document.getElementById('jp-filter-channel') || {}).value || '';
  // Badge Periode (titik indikator kalau filter bukan default)
  var pBadge = document.getElementById('jp-periode-badge');
  if (pBadge) pBadge.style.display = mode !== '7hari' ? 'inline' : 'none';
  // Badge Channel
  var cBadge = document.getElementById('jp-channel-badge');
  if (cBadge) cBadge.style.display = channel ? 'inline' : 'none';
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

  const mode     = _jpWaktuMode || 'hari-ini';
  const isHourly = (mode === 'hari-ini' || mode === 'kemarin');
  const labels = [], totals = [], dateKeys = [];

  if (isHourly) {
    let baseDate;
    if (mode === 'kemarin') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      baseDate = _jpLocalDate(d);
    } else {
      baseDate = _jpLocalDate(new Date());
    }
    for (let h = 0; h <= 23; h++) {
      const hStr = String(h).padStart(2,'0');
      labels.push(hStr + ':00');
      const sum = data
        .filter(r => r.tanggal && String(r.tanggal).slice(0,10) === baseDate && String(r.waktu||'00:00').slice(0,2) === hStr)
        .reduce((s,r) => s + (Number(r.total)||0), 0);
      totals.push(sum);
      dateKeys.push(baseDate);
    }
  } else {
    const dateSet = {};
    data.forEach(r => { if (r.tanggal) dateSet[String(r.tanggal).slice(0,10)] = true; });
    const dates = Object.keys(dateSet).sort();
    dates.forEach(dt => {
      const sum = data
        .filter(r => r.tanggal && String(r.tanggal).slice(0,10) === dt)
        .reduce((s,r) => s + (Number(r.total)||0), 0);
      const dObj = new Date(dt + 'T00:00:00');
      labels.push(String(dObj.getDate()).padStart(2,'0') + '/' + String(dObj.getMonth()+1).padStart(2,'0'));
      totals.push(sum);
      dateKeys.push(dt);
    });
  }

  const totalAll = totals.reduce((a,b) => a+b, 0);


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
  ctx.beginPath();
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0 ? ctx.moveTo(x,padT+cH) : ctx.lineTo(x,y); });
  ctx.lineTo(padL+(totals.length-1)*step, padT+cH);
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
          if (!r.tanggal || String(r.tanggal).slice(0,10) !== closest.dateKey) return false;
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
  var tJurnal  = document.getElementById('jp-tab-jurnal');
  var tTren    = document.getElementById('jp-tab-tren');
  var tJurnalM = document.getElementById('jp-tab-jurnal-mob');
  var tTrenM   = document.getElementById('jp-tab-tren-mob');
  if (!pJurnal || !pTren) return;
  var setActive = function(el, active) {
    if (!el) return;
    el.style.borderBottomColor = active ? 'var(--accent)' : 'transparent';
    el.style.color = active ? 'var(--ink)' : 'var(--ink3)';
  };
  var _isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  if (tab === 'jurnal') {
    pJurnal.style.display = 'flex';
    pTren.style.display   = 'none';
    setActive(tJurnal, true);  setActive(tTren, false);
    setActive(tJurnalM, true); setActive(tTrenM, false);
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
    setActive(tJurnal, false);  setActive(tTren, true);
    setActive(tJurnalM, false); setActive(tTrenM, true);
    // Semua device: jp-pane-tren scroll sendiri — simple, konsisten, tidak ada
    // race condition dengan _jpEnsureFlexLayout yang ubah overflow .content.
    pTren.style.flex      = '1 1 0';
    pTren.style.minHeight = '0';
    pTren.style.overflow  = 'hidden';
    _jpEnsureFlexLayout();
    // Render best seller + channel langsung
    _jpRenderBestSeller(_jpLastFilterData, _jpBsSortBy);
    _jpRenderChannelTerbaik(_jpLastFilterData);
    // Chart: 1 rAF agar browser selesai layout flex setelah display:flex
    requestAnimationFrame(function() {
      _jpScheduleChartRender(_jpLastFilterData);
    });
  }
}

function jpBsSort(by) {
  _jpBsSortBy = by;
  var btnRp  = document.getElementById('jp-bs-sort-rp');
  var btnQty = document.getElementById('jp-bs-sort-qty');
  var activeStyle   = 'padding:3px 10px;font-family:var(--f);font-size:11px;font-weight:700;background:var(--accent);color:#fff;border:2px solid var(--accent);border-radius:4px;cursor:pointer';
  var inactiveStyle = 'padding:3px 10px;font-family:var(--f);font-size:11px;font-weight:700;background:none;color:var(--ink3);border:2px solid var(--ink3);border-radius:4px;cursor:pointer';
  if (btnRp)  btnRp.style.cssText  = by === 'rp'  ? activeStyle : inactiveStyle;
  if (btnQty) btnQty.style.cssText = by === 'qty' ? activeStyle : inactiveStyle;
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

function _jpRenderBestSeller(data, sortBy) {
  var listEl = document.getElementById('jp-bestseller-list');
  if (!listEl) return;
  if (!data || !data.length) {
    listEl.innerHTML = '<div style="color:var(--ink3);font-style:italic;font-size:13px;padding:10px 0">Belum ada data di periode ini</div>';
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

  listEl.innerHTML = indukList.map(function(item, idx) {
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
}

function _jpRenderChannelTerbaik(data) {
  var listEl = document.getElementById('jp-channel-terbaik-list');
  if (!listEl) return;
  if (!data || !data.length) {
    listEl.innerHTML = '<div style="color:var(--ink3);font-style:italic;font-size:13px;padding:10px 0">Belum ada data di periode ini</div>';
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

  listEl.innerHTML = chList.map(function(ch, idx) {
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
}

function filterJP() {
  const q   = '';
  const fcEl = document.getElementById('jp-filter-channel');
  const kat = fcEl ? fcEl.value : '';
  let hasil = _jpAllData.filter(r => {
    if (r.no_order) return false; // Shopee orders → Data Order, bukan Jurnal
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
    tbody.innerHTML = '<tr><td colspan="9" style="color:var(--ink3);font-style:italic">Belum ada entri penjualan</td></tr>';
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
        : sisaVal === undefined
          ? '<span style="color:var(--ink3)">—</span>'
          : sisaVal <= 0
            ? '<b style="color:var(--danger)">' + sisaVal + '</b>'
            : sisaVal <= 3
              ? '<b style="color:var(--warn)">' + sisaVal + '</b>'
              : '<b style="color:var(--ok)">' + sisaVal + '</b>';

      // ─── Status order ─────────────────────────────────────
      const statusVal = row.order_status || '';
      var statusHtml;
      if (statusVal === 'READY_TO_SHIP') {
        statusHtml = '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;background:var(--warn);color:#000;white-space:nowrap">Perlu Kirim</span>';
      } else if (statusVal === 'PROCESSED') {
        statusHtml = '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;background:var(--warn);color:#000;white-space:nowrap">Diproses</span>';
      } else if (statusVal === 'SHIPPED') {
        statusHtml = '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;background:var(--ok);color:#000;white-space:nowrap">Dikirim</span>';
      } else if (statusVal === 'COMPLETED') {
        statusHtml = '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;background:var(--ink2);color:var(--bg);white-space:nowrap">Selesai</span>';
      } else if (statusVal === 'CANCELLED') {
        statusHtml = '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;background:var(--danger);color:#fff;white-space:nowrap">Dibatal</span>';
      } else {
        statusHtml = '<span style="color:var(--ink3);font-size:10px">Manual</span>';
      }

      // ─── Qty & Harga: kosong kalau Shopee tanpa SKU ───────
      const qtyDisplay   = (!row.sku && isShopee)
        ? '<span style="color:var(--ink3)">—</span>'
        : (row.qty || 0);
      const hargaDisplay = (!row.sku && isShopee)
        ? '<span style="color:var(--ink3)">—</span>'
        : fmtRp(row.harga_satuan);

      // ─── Row style: border kiri untuk baris Shopee ────────
      const rowStyle = isShopee ? 'border-left:2px solid var(--accent);' : '';

      const safeSku = (row.sku||'').replace(/'/g, "\'");
      return '<tr style="' + rowStyle + '">'
        + '<td style="white-space:nowrap"><b>' + tgl + '</b> <span style="font-size:11px;color:var(--ink3)">' + jam + '</span></td>'
        + '<td>' + chHtml + '</td>'
        + '<td>' + skuHtml + '</td>'
        + '<td style="text-align:center">' + qtyDisplay + '</td>'
        + '<td>' + hargaDisplay + '</td>'
        + '<td><b style="color:var(--ok)">' + fmtRp(row.total) + '</b></td>'
        + '<td style="text-align:center">' + sisaHtml + '</td>'
        + '<td style="text-align:center">' + statusHtml + '</td>'
        + '<td>'
        + '<button class="btn btn-sm" onclick="editJP(' + row.id + ')" style="margin-right:4px"><i class="ti ti-edit"></i></button>'
        + '<button class="btn btn-sm btn-danger" onclick="hapusJP(' + row.id + ',\'' + safeSku + '\')"><i class="ti ti-trash"></i></button>'
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
      dbGet('stok',   '&select=sku_variasi,stok_masuk&order=id.desc'),
      dbGet('jurnal_penjualan', '&select=sku,qty'),
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
  document.getElementById('jp-tgl').value        = _jpNowDate();
  document.getElementById('jp-waktu').value      = _jpNowTime();
  document.getElementById('jp-sku-induk').value  = '';
  _jpSetIndukLabel(null);
  var mw0 = document.getElementById('jp-sku-induk-manual-wrap');
  if (mw0) mw0.style.display = 'none';
  document.getElementById('jp-sku-variasi').innerHTML = '<option value="">— Pilih Variasi —</option>';
  var lblV0 = document.getElementById('jp-picker-variasi-label');
  if (lblV0) { lblV0.textContent = '— Pilih Variasi —'; lblV0.style.color = 'var(--ink3)'; }
  document.getElementById('jp-qty').value        = '';
  var _btnT = document.getElementById('jp-btn-tambah-sku');
  if (_btnT) _btnT.style.display = 'none';

  // Isi channel dari last channel hari ini
  var lastCh = _jpGetLastChannel();
  var chVal = lastCh ? lastCh.val : '';
  var chLabel = lastCh ? lastCh.label : '— Pilih Channel —';
  document.getElementById('jp-channel').value = chVal;
  var lblC = document.getElementById('jp-picker-channel-label');
  if (lblC) { lblC.textContent = chLabel; lblC.style.color = chVal ? 'var(--ink)' : 'var(--ink3)'; }
  // Tandai aktif di picker list
  setTimeout(function() {
    var list = document.getElementById('jp-picker-channel-list');
    if (list && chVal) {
      list.querySelectorAll('.kas-akun-item').forEach(function(el) {
        el.classList.toggle('active', el.dataset.val === chVal);
      });
    }
  }, 200);

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
      document.getElementById('jp-sku-induk').value = skuVal;
      _jpSetIndukLabel(skuVal);
      var mw1 = document.getElementById('jp-sku-induk-manual-wrap');
      var mi1 = document.getElementById('jp-sku-induk-manual');
      if (mw1) mw1.style.display = 'block';
      if (mi1) mi1.value = skuVal;
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
    const resolved = _jpResolveSku(sku);
    if (!resolved.ok) {
      const lanjut = confirm(
        'SKU "' + sku + '" tidak ditemukan di master produk.\n' +
        'Pastikan SKU sudah benar sebelum menyimpan.\n\n' +
        'Tetap simpan?'
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

function _jpRenderPending() {
  var list  = document.getElementById('jp-pending-list');
  var tbody = document.getElementById('jp-pending-tbody');
  var count = document.getElementById('jp-pending-count');
  if (!list || !tbody) return;
  if (_jpPendingItems.length === 0) { list.style.display = 'none'; return; }
  list.style.display = 'block';
  if (count) count.textContent = _jpPendingItems.length;
  tbody.innerHTML = _jpPendingItems.map(function(item, idx) {
    return '<tr style="border-bottom:1px solid var(--cream4)">' +
      '<td style="padding:4px 4px;font-weight:600">' + item.skuLabel + '</td>' +
      '<td style="text-align:right;padding:4px 4px">' + item.qty + '</td>' +
      '<td style="text-align:right;padding:4px 4px;color:var(--ink3)">' + (item.harga ? 'Rp'+item.harga.toLocaleString('id-ID') : '—') + '</td>' +
      '<td style="text-align:right;padding:4px 4px;color:var(--ok);font-weight:700">Rp' + (item.total||0).toLocaleString('id-ID') + '</td>' +
      '<td style="text-align:center;padding:4px 2px">' +
        '<button onclick="_jpRemovePending(' + idx + ')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;padding:0 4px">×</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function _jpRemovePending(idx) {
  _jpPendingItems.splice(idx, 1);
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
  const sku   = (skuV || skuI).trim().toUpperCase();
  const skuLabel = skuV || sku;
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
  var mw2 = document.getElementById('jp-sku-induk-manual-wrap');
  if (mw2) mw2.style.display = 'none';
  document.getElementById('jp-sku-variasi').innerHTML = '<option value="">— Pilih Variasi —</option>';
  document.getElementById('jp-qty').value = '';
  idrSet('jp-harga', 0);
  idrSet('jp-total', 0);

  var lblV = document.getElementById('jp-picker-variasi-label');
  if (lblV) { lblV.textContent = '— Pilih Variasi —'; lblV.style.color = 'var(--ink3)'; }

  var btn = document.getElementById('jp-btn-tambah-sku');
  if (btn) btn.style.display = 'none';

  // Buka lagi picker SKU Induk buat lanjut input SKU berikutnya
  setTimeout(function() { jpSkuSheetOpen('induk'); }, 150);
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
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="hari-ini" checked onchange="jpSetWaktu(this.value)" style="cursor:pointer"> Hari Ini</label>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="kemarin" onchange="jpSetWaktu(this.value)" style="cursor:pointer"> Kemarin</label>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="7hari" onchange="jpSetWaktu(this.value)" style="cursor:pointer"> 7 Hari Terakhir</label>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="30hari" onchange="jpSetWaktu(this.value)" style="cursor:pointer"> 1 Bulan Terakhir</label>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="bulan" onchange="jpSetWaktu(this.value)" style="cursor:pointer"> Bulan</label>'
      + '<div id="jp-bulan-wrap" style="display:none;padding-left:20px;margin-top:2px">'
      + '<input type="month" id="jp-filter-bulan" style="font-family:var(--f);font-size:12px;padding:3px 6px;border:1.5px solid var(--ink3);background:var(--cream);width:100%;box-sizing:border-box" oninput="loadJurnalPenjualan();jpUpdateBadge()">'
      + '</div>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:13px;cursor:pointer;padding:3px 0"><input type="radio" name="jp-waktu" value="semua" onchange="jpSetWaktu(this.value)" style="cursor:pointer"> Semua</label>'
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
// Default periode: 7 hari terakhir
_jpWaktuMode = '7hari';
// Guard: pastikan elemen sudah ada sebelum mengisi nilai (IIFE inject sudah jalan di atas)
(function _jpSafeInit() {
  var bulanEl = document.getElementById('jp-filter-bulan');
  if (bulanEl) {
    var n = new Date();
    bulanEl.value = n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0');
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

    var searchIcon = document.createElement('span');
    searchIcon.className = 'kas-akun-search-icon';
    searchIcon.textContent = '🔍';

    var searchInp = document.createElement('input');
    searchInp.className = 'kas-akun-search';
    searchInp.type = 'text';
    searchInp.placeholder = 'Cari...';
    searchInp.autocomplete = 'off';
    searchInp.setAttribute('autocorrect', 'off');
    searchInp.setAttribute('autocapitalize', 'none');
    searchInp.setAttribute('spellcheck', 'false');

    function _stopProp(ev) { ev.stopPropagation(); }
    searchInp.addEventListener('mousedown',   _stopProp);
    searchInp.addEventListener('touchstart',  _stopProp, { passive: true });
    searchInp.addEventListener('pointerdown', _stopProp);
    searchInp.addEventListener('input', function() { kasPickerFilter(searchInp); });

    searchInp.addEventListener('touchend', function(ev) {
      ev.stopPropagation();
      setTimeout(function() { searchInp.focus(); }, 50);
    }, { passive: false });

    wrap.appendChild(searchIcon);
    wrap.appendChild(searchInp);
    list.insertBefore(wrap, list.firstChild);
  }

  // Reset search & tampilkan semua item
  var inp = list.querySelector('.kas-akun-search');
  if (inp) inp.value = '';
  list.querySelectorAll('.kas-akun-item,.kas-akun-group,.kas-akun-empty').forEach(function(el) { el.style.display = ''; });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';

  // Tandai baru dibuka — cegah unified outside handler (app.js) langsung
  // nutup ulang saat browser auto-scroll modal untuk bring search input
  // yang baru di-focus ke viewport (root cause: harus klik 2x sebelum
  // field "Cari..." kepakai — klik pertama kebuka lalu langsung ke-close
  // oleh scroll listener karena guard ini sebelumnya tidak dipanggil di sini,
  // beda dengan kasTogglePicker/keuTogglePicker yang sudah pasang guard ini).
  if (typeof window._kasPickerJustOpened === 'function') window._kasPickerJustOpened();

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

  // Auto-focus search — skip iOS Safari
  var _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (inp && !_isIOS) setTimeout(function() { inp.focus(); }, 80);
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
  // Simpan sebagai last channel hari ini
  if (val) _jpSaveLastChannel(val, label);
  // Tandai aktif
  list.querySelectorAll('.kas-akun-item').forEach(function(el) { el.classList.remove('active'); });
  item.classList.add('active');
  jpClosePicker(list);
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
    searchEl.placeholder = mode === 'induk' ? 'Cari SKU Induk...' : 'Cari variasi...';
  }
  if (titleEl) titleEl.textContent = mode === 'induk' ? 'Pilih SKU Induk' : 'Pilih Variasi';
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
}

function _jpSkuSheetRenderInduk(q) {
  var listEl = document.getElementById('jp-sku-sheet-list');
  if (!listEl) return;
  q = (q || '').toLowerCase().trim();
  var katalogMap = {};
  _jpProdukList.forEach(function(p) {
    var kat = _jpGetKatalog(p);
    if (!kat) return;
    if (q && kat.toLowerCase().indexOf(q) === -1) return;
    katalogMap[kat] = (katalogMap[kat] || 0) + 1;
  });
  var katalogs = Object.keys(katalogMap).sort();
  var html = '';
  if (!katalogs.length) {
    html += '<div class="jp-sheet-empty">' + (_jpProdukList.length === 0 ? 'Produk belum ada — tambah di Kelola Produk' : 'Tidak ada SKU yang cocok') + '</div>';
  } else {
    katalogs.forEach(function(kat) {
      html += '<div class="jp-sheet-item" onclick="jpSkuSheetSelectInduk(\'' + kat.replace(/'/g,"\\'") + '\')">' +
        '<span>' + kat + '</span>' +
        '<span style="font-size:11px;color:var(--ink3)">' + katalogMap[kat] + ' var</span></div>';
    });
  }
  html += '<div class="jp-sheet-item" style="color:var(--info);font-weight:700;border-top:1px solid var(--ink4);margin-top:4px;padding-top:12px" onclick="jpSkuSheetManualInduk()">' +
    '<span><i class="ti ti-pencil"></i> Ketik SKU manual...</span></div>';
  listEl.innerHTML = html;
}

function _jpSkuSheetRenderVariasi(q) {
  var listEl = document.getElementById('jp-sku-sheet-list');
  if (!listEl) return;
  var katalog = document.getElementById('jp-sku-induk').value;
  var varList = _jpProdukList.filter(function(p) { return _jpGetKatalog(p) === katalog; });
  q = (q || '').toLowerCase().trim();
  var items = varList.filter(function(p) { return !q || _jpGetSku(p).toLowerCase().indexOf(q) !== -1; });
  var html = '';
  if (!katalog) {
    html = '<div class="jp-sheet-empty">Pilih SKU Induk dulu</div>';
  } else if (!items.length) {
    html = '<div class="jp-sheet-empty">' + (q ? 'Tidak ada variasi yang cocok' : 'Belum ada variasi untuk SKU ini') + '</div>';
  } else {
    items.forEach(function(p) {
      var sku = _jpGetSku(p);
      var hpp = _jpGetHpp(p);
      var sisa = _jpSisakMap[sku.toUpperCase()];
      var sisakHtml = '';
      if (sisa !== undefined) {
        var col = sisa <= 0 ? 'var(--danger)' : sisa <= 3 ? 'var(--warn)' : 'var(--ok)';
        sisakHtml = '<span style="font-size:11px;font-weight:700;color:' + col + '">stok: ' + sisa + '</span>';
      }
      html += '<div class="jp-sheet-item" onclick="jpSkuSheetSelectVariasi(\'' + sku.replace(/'/g,"\\'") + '\',' + (hpp||0) + ')">' +
        '<span>' + sku + '</span>' + sisakHtml + '</div>';
    });
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
  jpSkuSheetClose();
  var manualWrap = document.getElementById('jp-sku-induk-manual-wrap');
  if (manualWrap) manualWrap.style.display = 'none';
  jpPilihKatalog(katalog);
}

function jpSkuSheetManualInduk() {
  jpSkuSheetClose();
  var manualWrap = document.getElementById('jp-sku-induk-manual-wrap');
  var manualInp  = document.getElementById('jp-sku-induk-manual');
  if (manualWrap) manualWrap.style.display = 'block';
  if (manualInp) { manualInp.value = ''; setTimeout(function(){ manualInp.focus(); }, 260); }
}

function jpOnManualIndukInput() {
  var manualInp = document.getElementById('jp-sku-induk-manual');
  var val = manualInp ? manualInp.value : '';
  document.getElementById('jp-sku-induk').value = val;
  _jpSetIndukLabel(val || null);
  // Mode manual: kosongin variasi — SKU final diambil langsung dari field ini
  document.getElementById('jp-sku-variasi').innerHTML = '<option value="">— Pilih Variasi —</option>';
  var lblV = document.getElementById('jp-picker-variasi-label');
  if (lblV) { lblV.textContent = '— Pilih Variasi —'; lblV.style.color = 'var(--ink3)'; }
  var btnTambah = document.getElementById('jp-btn-tambah-sku');
  if (btnTambah) btnTambah.style.display = val ? 'block' : 'none';
}

function jpSkuSheetSelectVariasi(sku, hpp) {
  var sel = document.getElementById('jp-sku-variasi');
  if (sel) {
    sel.value = sku;
    sel.dispatchEvent(new Event('change'));
  }
  var lbl = document.getElementById('jp-picker-variasi-label');
  if (lbl) {
    var sisa = _jpSisakMap[sku.toUpperCase()];
    var sisakTxt = '';
    if (sisa !== undefined) {
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
    _jpSetIndukLabel(null);
    var mwC = document.getElementById('jp-sku-induk-manual-wrap');
    if (mwC) mwC.style.display = 'none';
    jpSkuSheetClose();
  };
}

// Tutup picker saat klik di luar
// close listener: handled by unified handler in app.js
