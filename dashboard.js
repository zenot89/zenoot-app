// ─── DASHBOARD.JS v4 — Full Edition ──────────────────────────
// Fitur baru v4: AOV, HPP vs Omset/Laba Kotor, Performa per Channel,
//   Grafik Omset per Katalog, Turnover Rate Stok, Ringkasan Beban,
//   Tooltip hover chart penjualan, Distribusi status stok

document.getElementById('page-dashboard').innerHTML = `

  <!-- ═══ ALERT STRIP ════════════════════════════════════════ -->
  <div id="dash-alerts-wrap"></div>

  <!-- ═══ TAB BAR DASHBOARD (gaya Xero: underline tab) ═══════════ -->
  <div class="zd-tabbar" id="zd-tabbar" role="tablist">
    <div class="zd-tabbar-left">
      <button class="btn btn-sm zd-refresh-btn" onclick="loadDashboard()" title="Refresh data dashboard"><i class="ti ti-refresh"></i><span class="zd-refresh-lbl"> Refresh</span></button>
      <span id="dash-last-refresh" class="zd-last-refresh"></span>
    </div>
    <button class="zd-tab active" data-tab="ringkasan" onclick="zdDashTab('ringkasan')"><i class="ti ti-layout-dashboard"></i> Ringkasan</button>
    <button class="zd-tab" data-tab="penjualan" onclick="zdDashTab('penjualan')"><i class="ti ti-chart-line"></i> Penjualan</button>
    <button class="zd-tab" data-tab="stok" onclick="zdDashTab('stok')"><i class="ti ti-package"></i> Stok &amp; Supplier</button>
    <button class="zd-tab" data-tab="keuangan" onclick="zdDashTab('keuangan')"><i class="ti ti-report-money"></i> Keuangan</button>
  </div>

  <div class="zd-tab-panel zd-tab-active" id="zd-tab-ringkasan">

  <!-- ═══ NET WORTH + BEBAN + INCOME SWIPE (portrait) / full width (laptop) ══ -->
  <div class="nw-swipe-pair" id="nw-swipe-container">
    <div class="nw-swipe-track">

      <!-- Slide 3: FCF + Jurnal Income -->
      <div class="nw-swipe-slide">
        <div class="nw-swipe-dot-label"><span class="nw-dot active"></span><span class="nw-dot"></span><span class="nw-dot"></span><span class="nw-dot"></span></div>
        <!-- Header: abu tua, nilai utama = FCF -->
        <div class="nw-slide-header nw-slide-s3">
          <div class="nw-slide-label"><span class="nw-slide-ic nw-slide-ic-green"><i class="ti ti-trending-up"></i></span> FREE CASH FLOW <span id="dash-income-bulan" style="font-size:10px;font-weight:400;opacity:0.55;margin-left:4px;text-transform:none;letter-spacing:0"></span></div>
          <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px">
            <div class="nw-slide-value" id="dash-fcf-val" style="margin:0">Rp —</div>
            <div style="text-align:right;white-space:nowrap">
              <div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink3)">Total Income</div>
              <div id="dash-income-total" style="font-size:18px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums">—</div>
            </div>
          </div>
        </div>
        <!-- Data box -->
        <div class="nw-slide-data" id="dash-income-wrap">
          <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
        </div>
      </div><!-- /slide 3 -->

      <!-- Slide 2: Beban Operasional -->
      <div class="nw-swipe-slide">
        <div class="nw-swipe-dot-label"><span class="nw-dot"></span><span class="nw-dot active"></span><span class="nw-dot"></span><span class="nw-dot"></span></div>
        <!-- Header: oranye -->
        <div class="nw-slide-header nw-slide-s2">
          <div class="nw-slide-label"><span class="nw-slide-ic nw-slide-ic-orange"><i class="ti ti-report-money"></i></span> BEBAN OPERASIONAL</div>
          <div class="nw-slide-value" id="dash-beban-total">Rp —</div>
          <div class="nw-slide-sub">bulan ini</div>
        </div>
        <!-- Data box -->
        <div class="nw-slide-data" id="dash-beban-wrap">
          <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
        </div>
      </div><!-- /slide 2 -->

      <!-- Slide 1: Net Worth -->
      <div class="nw-swipe-slide">
        <div class="nw-swipe-dot-label"><span class="nw-dot"></span><span class="nw-dot"></span><span class="nw-dot active"></span><span class="nw-dot"></span></div>
        <!-- Header: biru -->
        <div class="nw-slide-header nw-slide-s1" id="nw-widget" style="margin:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
            <div class="nw-slide-label"><span class="nw-slide-ic nw-slide-ic-blue"><i class="ti ti-chart-pie"></i></span> NET WORTH AKTUAL</div>
            <div style="display:flex;align-items:center;gap:6px">
              <span id="nw-status-badge" class="nw-badge nw-badge-loading">⏳ Memuat...</span>
              <button class="nw-refresh-btn" onclick="nwRefresh()" title="Refresh sekarang"><i class="ti ti-refresh" id="nw-refresh-icon"></i></button>
            </div>
          </div>
          <div class="nw-slide-value" id="nw-total">Rp —</div>
          <div class="nw-slide-sub" id="nw-update-time">menghitung...</div>
        </div>
        <!-- Data box: rincian Net Worth -->
        <div class="nw-slide-data">
          <div class="nw-row"><span class="nw-row-label"><i class="ti ti-building-bank"></i> Total Asset</span><span class="nw-row-val nw-pos" id="nw-aset">—</span></div>
          <div class="nw-row"><span class="nw-row-label"><i class="ti ti-credit-card-off"></i> Total Hutang</span><span class="nw-row-val nw-neg" id="nw-hutang">—</span></div>
          <div class="nw-row"><span class="nw-row-label"><i class="ti ti-truck-delivery"></i> Escrow Shopee <span id="nw-escrow-badge" class="nw-shopee-badge"></span></span><span class="nw-row-val nw-pos" id="nw-escrow">—</span></div>
          <div class="nw-row" style="border-top:1px dashed var(--ovl-0_1);margin-top:4px;padding-top:8px"><span class="nw-row-label"><i class="ti ti-chart-line"></i> Laba / Rugi</span><span class="nw-row-val" id="nw-laba">—</span></div>
        </div>
      </div><!-- /slide 1 -->

      <!-- Slide 4: Kecepatan Kas (dipindah dari card terpisah, 7 Okt 2026) — status = teks besar di slot angka, alasan di ikon (?) -->
      <div class="nw-swipe-slide" id="zd-kas-card">
        <div class="nw-swipe-dot-label"><span class="nw-dot"></span><span class="nw-dot"></span><span class="nw-dot"></span><span class="nw-dot active"></span></div>
        <!-- Header: ungu — status jadi teks besar di slot angka (sama seperti Rp di card lain), alasan lewat ikon (?) -->
        <div class="nw-slide-header nw-slide-s4">
          <div class="nw-slide-label"><span class="nw-slide-ic nw-slide-ic-purple"><i class="ti ti-gauge"></i></span> KECEPATAN KAS <button type="button" class="zdk-help" id="zd-kas-help" aria-label="Alasan status" data-reason="Menghitung kewajiban supplier, cicilan hutang, dan sisa operasional..." onclick="zdKasHint(this)">?</button></div>
          <div class="nw-slide-value zdk-status" id="zd-kas-badge">Memuat...</div>
          <div class="nw-slide-sub" id="zd-kas-sub">&nbsp;</div>
        </div>
        <!-- Data box -->
        <div class="nw-slide-data">
          <div class="zdk-stats" id="zd-kas-stats"></div>
          <div class="zdk-warn" id="zd-kas-warn" style="display:none"></div>
          <div class="zdk-links">
            <button class="zdk-link" onclick="zdDashTab('stok')">Rincian batch</button>
            <button class="zdk-link" onclick="zdDashTab('keuangan')">Rincian supplier</button>
          </div>
        </div>
      </div><!-- /slide 4 -->

    </div><!-- /nw-swipe-track -->
  </div><!-- /nw-swipe-container -->

  <!-- ═══ ROW 1: 4 METRIC CARDS ════════════════════════════════ -->
  <!-- ═══ METRICS — 2 BARIS × 4 CARD (laptop/landscape) | 4 BARIS × 2 CARD (HP portrait) ═══ -->
  <!-- Baris 1: UANG HARI INI vs AKTIVITAS | Baris 2: PENJUALAN vs TARGET | Baris 3: UNTUNG vs BEBAN | Baris 4: STOK -->
  <div class="metrics" id="dash-metrics">
    <div class="zd-car" id="zd-car-a"><div class="zd-car-track">

    <!-- BARIS 1 — Format donut + rincian (gaya Accurate) : Target, Laba Bersih, Beban vs Kas, Cash Flow -->
    <div class="metric zd-m" data-zd-i="1" id="card-target-omset">
      <div class="m-label">Target Omset</div>
      <div class="zd-m-body">
        <div class="zd-m-donutwrap"><canvas id="zd-viz-target"></canvas><div class="zd-m-center" id="zd-viz-target-c"></div></div>
        <div class="zd-m-side">
          <div class="m-value" id="d-target">—</div>
          <div class="m-delta">
            <div id="d-target-bar-wrap" style="margin-top:4px;display:none">
              <div style="background:var(--cream4);height:6px;border-radius:3px;overflow:hidden;border:1px solid var(--ink4)">
                <div id="d-target-bar" style="height:100%;background:var(--ok);transition:width .5s;width:0%"></div>
              </div>
              <span id="d-target-pct" style="font-size:10px;color:var(--ink3)">0%</span>
            </div>
          </div>
          <div class="zd-mrows" id="zd-viz-target-rows"></div>
        </div>
      </div>
      <div class="doodle"><i class="ti ti-target"></i></div>
    </div>

    <div class="metric zd-m" data-zd-i="2">
      <div class="m-label">Est. Laba Bersih</div>
      <div class="zd-m-body">
        <div class="zd-m-donutwrap"><canvas id="zd-viz-laba"></canvas><div class="zd-m-center" id="zd-viz-laba-c"></div></div>
        <div class="zd-m-side">
          <div class="m-value" id="d-laba-bersih">—</div>
          <div class="m-delta">laba kotor − beban</div>
          <div class="zd-mrows" id="zd-viz-laba-rows"></div>
        </div>
      </div>
      <div class="doodle"><i class="ti ti-trophy"></i></div>
    </div>

    <div class="metric zd-m" data-zd-i="3" style="cursor:pointer" onclick="var b=Array.prototype.find.call(document.querySelectorAll('.nav-item'),function(x){return x.getAttribute('onclick')&&x.getAttribute('onclick').indexOf('keuangan')!==-1;});gotoPage('keuangan',b);setTimeout(function(){keuGotoTab('aruskas');},400);" title="Lihat detail Arus Kas">
      <div class="m-label">Beban vs Kas</div>
      <div class="zd-m-body">
        <div class="zd-m-donutwrap"><canvas id="zd-viz-bebankas"></canvas><div class="zd-m-center" id="zd-viz-bebankas-c"></div></div>
        <div class="zd-m-side">
          <div class="m-value" id="d-beban">—</div>
          <div class="m-delta" id="d-beban-delta">bulan ini</div>
          <div id="d-beban-realisasi" style="font-size:11px;color:var(--ink3);margin-top:2px"></div>
          <div class="zd-mrows" id="zd-viz-bebankas-rows"></div>
        </div>
      </div>
      <div class="doodle"><i class="ti ti-arrows-exchange"></i></div>
    </div>

    <div class="metric zd-m" data-zd-i="4" style="cursor:pointer" onclick="var b=Array.prototype.find.call(document.querySelectorAll('.nav-item'),function(x){return x.getAttribute('onclick')&&x.getAttribute('onclick').indexOf('keuangan')!==-1;});gotoPage('keuangan',b);setTimeout(function(){keuGotoTab('aruskas');},400);">
      <div class="m-label">Cash Flow</div>
      <div class="zd-m-body">
        <div class="zd-m-donutwrap"><canvas id="zd-viz-cashflow"></canvas><div class="zd-m-center" id="zd-viz-cashflow-c"></div></div>
        <div class="zd-m-side">
          <div class="m-value" id="d-cashflow">—</div>
          <div class="m-delta" id="d-cashflow-delta">bulan ini</div>
          <div class="zd-mrows" id="zd-viz-cashflow-rows"></div>
        </div>
      </div>
      <div class="doodle"><i class="ti ti-arrows-exchange"></i></div>
    </div>

    </div><div class="zd-car-dots"><i class="on"></i><i></i><i></i><i></i></div></div><!-- /zd-car-a -->

    <div class="zd-car" id="zd-car-b"><div class="zd-car-track">
    <!-- BARIS 2 — Angka besar + rincian (donut + rincian, seragam dengan baris 1) : Saldo Kas, Order Hari Ini, Nilai Stok, SKU Kritis -->
    <div class="metric zd-m" data-zd-i="5" id="card-saldo-kas" onclick="var b=Array.prototype.find.call(document.querySelectorAll('.nav-item'),function(x){return x.getAttribute('onclick')&&x.getAttribute('onclick').indexOf('kas')!==-1;});gotoPage('kas',b);" style="cursor:pointer;transition:background .15s" onmouseover="this.style.background='var(--ovl-0_04)'" onmouseout="this.style.background=''" title="Lihat Kas &amp; Jurnal">
      <div class="m-label">Saldo Kas</div>
      <div class="zd-m-body"><div class="zd-m-donutwrap"><canvas id="zd-viz-saldo"></canvas><div class="zd-m-center" id="zd-viz-saldo-c"></div></div><div class="zd-m-side">
        <div class="m-value" id="d-saldo">—</div>
        <div class="m-delta" id="d-saldo-delta">saldo akhir</div>
        <div class="zd-mrows" id="zd-viz-saldo-rows"></div>
      </div></div>
      <div class="doodle"><i class="ti ti-wallet"></i></div>
    </div>

    <div class="metric zd-m" data-zd-i="6">
      <div class="m-label">Order Hari Ini</div>
      <div class="zd-m-body"><div class="zd-m-donutwrap"><canvas id="zd-viz-order"></canvas><div class="zd-m-center" id="zd-viz-order-c"></div></div><div class="zd-m-side">
        <div style="display:flex;align-items:baseline;gap:8px;margin-top:4px">
          <div class="m-value" id="d-order-qty" style="margin:0">—</div>
          <div style="font-size:11px;color:var(--ink3);font-weight:400;line-height:1">pcs</div>
          <div class="m-value" id="d-order-omset" style="margin:0;color:var(--ok)">—</div>
        </div>
        <div class="m-delta" id="d-order-hari-delta">belum ada order hari ini</div>
        <div style="font-size:11px;color:var(--ink3);margin-top:3px">Omset bulan: <span id="d-omset-abu">—</span></div>
        <div class="zd-mrows" id="zd-viz-order-rows"></div>
      </div></div>
      <div class="doodle"><i class="ti ti-shopping-bag"></i></div>
    </div>

    <div class="metric zd-m" data-zd-i="7">
      <div class="m-label">Nilai Stok</div>
      <div class="zd-m-body"><div class="zd-m-donutwrap"><canvas id="zd-viz-stok"></canvas><div class="zd-m-center" id="zd-viz-stok-c"></div></div><div class="zd-m-side">
        <div class="m-value" id="d-nilaiStok">—</div>
        <div class="m-delta">HPP × sisa stok</div>
        <div class="zd-mrows" id="zd-viz-stok-rows"></div>
      </div></div>
      <div class="doodle"><i class="ti ti-coin"></i></div>
    </div>

    <div class="metric zd-m" data-zd-i="8" id="card-kritis" onclick="window._restockFilterKritis=true;var btn=Array.prototype.find.call(document.querySelectorAll('.nav-item'),function(b){return b.getAttribute('onclick')&&b.getAttribute('onclick').indexOf('restock')!==-1;})||null;gotoPage('restock',btn);" style="cursor:pointer;transition:background .15s" onmouseover="this.style.background='rgba(224,82,82,0.08)'" onmouseout="this.style.background=''">
      <div class="m-label">SKU Kritis</div>
      <div class="zd-m-body"><div class="zd-m-donutwrap"><canvas id="zd-viz-kritis"></canvas><div class="zd-m-center" id="zd-viz-kritis-c"></div></div><div class="zd-m-side">
        <div class="m-value" id="d-kritis">—</div>
        <div class="m-delta">stok ≤ 3 · klik untuk restock</div>
        <div class="zd-mrows" id="zd-viz-kritis-rows"></div>
      </div></div>
      <div class="doodle"><i class="ti ti-alert-triangle"></i></div>
    </div>

    </div><div class="zd-car-dots"><i class="on"></i><i></i><i></i><i></i></div></div><!-- /zd-car-b -->

  </div>

  <!-- Hidden elements untuk backward compat (ID masih dipakai JS tapi card tidak ditampilkan) -->
  <div style="display:none">
    <div id="d-sku"></div>
    <div id="d-aov"></div>
    <div id="d-laba"></div>
    <div id="d-laba-delta"></div>
    <div id="d-omset"></div>
    <div id="d-omset-delta"></div>
    <div id="d-target-harian"></div>
    <div id="d-target-harian-bar-wrap"></div>
    <div id="d-target-harian-bar"></div>
    <div id="d-target-harian-pct"></div>
  </div>
  </div><!-- /zd-tab-ringkasan -->

  <div class="zd-tab-panel" id="zd-tab-penjualan">
  <!-- ═══ ROW 3: GRAFIK PENJUALAN + TOP SKU ════════════════════ -->
  <div class="db-swipe-pair zd-wide-21" id="swipe-pair-1">
    <div class="db-swipe-track">
      <div class="db-swipe-slide">
        <div class="db-swipe-dot-label"><span class="db-dot active"></span><span class="db-dot"></span></div>
        <div class="card" style="overflow:visible;margin:0">
          <div class="card-title" style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;overflow:visible;z-index:9000;position:relative">
        <span style="flex-shrink:0"><i class="ti ti-chart-line"></i> Tren Penjualan</span>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <div id="trench-active-chips" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center"></div>

          <!-- Tombol Periode -->
          <div style="position:relative;z-index:9100" id="trench-wrap-periode">
            <button class="btn btn-sm" id="trench-btn-periode" onclick="trenchTogglePeriode(event)"
              style="display:inline-flex;align-items:center;gap:5px;font-size:12px;background:var(--ink);color:var(--cream);border:2px solid var(--ink);min-height:32px">
              <i class="ti ti-clock"></i>
              <span id="trench-lbl-periode">30 Hari</span>
              <i class="ti ti-chevron-down" style="font-size:10px"></i>
            </button>
            <div id="trench-dd-periode" style="display:none;position:absolute;top:calc(100% + 4px);left:0;z-index:99999;
              min-width:175px;background:var(--cream);border:2px solid var(--ink);box-shadow:4px 4px 0 var(--ink4);padding:8px 10px;pointer-events:auto"
              onclick="event.stopPropagation()">
              <div style="font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px">
                <i class="ti ti-clock" style="font-size:11px"></i> Pilih Periode
              </div>
              <div style="display:flex;flex-direction:column;gap:2px" id="trench-waktu-chips">
                <div class="trench-sub-item trench-chip-w" data-w="bulan"   onclick="trenchSelWaktu(this)">📅 Bulan Ini</div>
                <div class="trench-sub-item trench-chip-w" data-w="1"       onclick="trenchSelWaktu(this)">Hari Ini</div>
                <div class="trench-sub-item trench-chip-w" data-w="kemarin" onclick="trenchSelWaktu(this)">Kemarin</div>
                <div class="trench-sub-item trench-chip-w" data-w="7"       onclick="trenchSelWaktu(this)">7 Hari Terakhir</div>
                <div class="trench-sub-item trench-chip-w" data-w="14"      onclick="trenchSelWaktu(this)">14 Hari Terakhir</div>
                <div class="trench-sub-item trench-chip-w" data-w="30"      onclick="trenchSelWaktu(this)">30 Hari Terakhir (default)</div>
              </div>

            </div>
          </div>

          <!-- Tombol Channel -->
          <div style="position:relative;z-index:9100" id="trench-wrap-channel">
            <button class="btn btn-sm" id="trench-btn-channel" onclick="trenchToggleChannel(event)"
              style="display:inline-flex;align-items:center;gap:5px;font-size:12px;background:var(--cream2);color:var(--ink);border:2px solid var(--ink);min-height:32px">
              <i class="ti ti-store"></i>
              <span id="trench-lbl-channel">Channel</span>
              <i class="ti ti-chevron-down" style="font-size:10px"></i>
            </button>
            <div id="trench-dd-channel" style="display:none;position:absolute;top:calc(100% + 4px);left:0;z-index:99999;
              min-width:190px;background:var(--cream);border:2px solid var(--ink);box-shadow:4px 4px 0 var(--ink4);pointer-events:auto"
              onclick="event.stopPropagation()">
              <div id="trench-channel-list" style="max-height:220px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;touch-action:pan-y"></div>

            </div>
          </div>

          <!-- RESET FILTER — muncul otomatis bila ada filter aktif -->
          <button class="btn btn-sm" id="trench-reset-btn" onclick="trenchReset()"
            style="display:none;align-items:center;gap:4px;font-size:12px;border-color:var(--danger);color:var(--danger)">
            <i class="ti ti-x"></i> Reset Filter
          </button>
        </div>
      </div>
      <div style="position:relative;height:170px;width:100%">
        <canvas id="dash-chart-penjualan" style="width:100%;height:100%;display:block"></canvas>
        <div id="dash-chart-empty" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;color:var(--ink3);font-style:italic;font-size:13px">
          Belum ada data penjualan
        </div>
        <!-- Tooltip hover -->
        <div id="dash-chart-tooltip" style="display:none;position:absolute;background:var(--cream);border:2px solid var(--ink);padding:5px 10px;font-size:11px;font-family:var(--f);pointer-events:none;box-shadow:3px 3px 0 var(--ink4);z-index:10;white-space:nowrap"></div>
      </div>
      <div id="dash-chart-legend" style="display:flex;gap:14px;margin-top:8px;font-size:11px;color:var(--ink3);flex-wrap:wrap"></div>
    </div>
      </div><!-- /db-swipe-slide 1 -->
      <div class="db-swipe-slide">
        <div class="db-swipe-dot-label"><span class="db-dot"></span><span class="db-dot active"></span></div>
        <div class="card" style="margin:0">
          <div class="card-title"><i class="ti ti-trophy"></i> Top 5 SKU Terlaris</div>
          <div id="dash-top-sku">
            <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
          </div>
        </div>
      </div><!-- /db-swipe-slide 2 -->
    </div><!-- /db-swipe-track -->
  </div><!-- /db-swipe-pair-1 -->

  <!-- ═══ ROW 5: PERFORMA CHANNEL + GRAFIK OMSET PER KATALOG ═══ -->
  <div class="db-swipe-pair" id="swipe-pair-3">
    <div class="db-swipe-track">
      <div class="db-swipe-slide">
        <div class="db-swipe-dot-label"><span class="db-dot active"></span><span class="db-dot"></span></div>
        <div class="card" style="margin:0">
          <div class="card-title"><i class="ti ti-building-store"></i> Performa per Channel / Toko</div>
          <div class="dash-donut-wrap" style="margin-bottom:10px">
            <div style="position:relative;width:150px;height:150px;flex-shrink:0"><canvas id="dash-chart-channel"></canvas></div>
            <div id="dash-channel-legend" class="dash-donut-legend"></div>
          </div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>Channel</th><th>Trx</th><th>Qty</th><th>Omset</th><th>%</th></tr></thead>
            <tbody id="dash-channel-tbody">
              <tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
            </tbody>
          </table></div>
        </div>
      </div><!-- /slide 1 -->
      <div class="db-swipe-slide">
        <div class="db-swipe-dot-label"><span class="db-dot"></span><span class="db-dot active"></span></div>
        <div class="card" style="margin:0">
          <div class="card-title"><i class="ti ti-chart-bar"></i> Omset per Katalog / SKU Induk</div>
          <div style="position:relative;height:280px;width:100%">
            <canvas id="dash-chart-katalog" style="width:100%;height:100%;display:block"></canvas>
            <div id="dash-katalog-empty" style="display:none;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--ink3);font-style:italic;font-size:13px">
              Belum ada data
            </div>
          </div>
        </div>
      </div><!-- /slide 2 -->
    </div><!-- /db-swipe-track -->
  </div><!-- /db-swipe-pair-3 -->
  </div><!-- /zd-tab-penjualan -->

  <div class="zd-tab-panel" id="zd-tab-stok">
  <!-- ═══ ROW 4: STATUS STOK + PERFORMA BOSS ═══════════════════ -->
  <div class="db-swipe-pair" id="swipe-pair-2">
    <div class="db-swipe-track">
      <div class="db-swipe-slide">
        <div class="db-swipe-dot-label"><span class="db-dot active"></span><span class="db-dot"></span></div>
        <div class="card card-lined" style="margin:0">
          <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
            <span><i class="ti ti-package"></i> Status Stok</span>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <div id="dash-stok-dist" style="display:flex;gap:4px;flex-wrap:wrap"></div>
              <span id="dash-stok-summary" style="font-size:11px;color:var(--ink3);font-weight:400"></span>
            </div>
          </div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>SKU</th><th>Boss</th><th>Sisa</th><th>Terjual/7hr</th><th>Turnover</th><th>ROP</th><th>Status</th></tr></thead>
            <tbody id="dash-stok-tbody">
              <tr><td colspan="7" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
            </tbody>
          </table></div>
        </div>
      </div><!-- /slide 1 -->
      <div class="db-swipe-slide">
        <div class="db-swipe-dot-label"><span class="db-dot"></span><span class="db-dot active"></span></div>
        <div class="card" style="margin:0">
          <div class="card-title"><i class="ti ti-users"></i> Performa Supplier</div>
          <div class="dash-donut-wrap" style="margin-bottom:10px">
            <div style="position:relative;width:150px;height:150px;flex-shrink:0"><canvas id="dash-chart-boss"></canvas></div>
            <div id="dash-boss-legend" class="dash-donut-legend"></div>
          </div>
          <div class="tbl-wrap"><table class="tbl">
            <thead><tr><th>Supplier</th><th>Qty</th><th>Omset</th><th>%</th></tr></thead>
            <tbody id="dash-boss-tbody">
              <tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
            </tbody>
          </table></div>
        </div>
      </div><!-- /slide 2 -->
    </div><!-- /db-swipe-track -->
  </div><!-- /db-swipe-pair-2 -->
  <!-- ═══ KEGIATAN MENDATANG — RESTOCK (tab Stok & Supplier) ═══ -->
  <div class="card dash-widget" id="dash-kegiatan-stok-card" style="margin-top:12px;margin-bottom:0">
    <div class="card-title"><i class="ti ti-package"></i> Kegiatan Mendatang · Restock</div>
    <div id="dash-kegiatan-stok-list">
      <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
    </div>
  </div>
  <!-- ═══ TRACKER BATCH RESELLER (aturan hari ke-9) ═══ -->
  <div class="card dash-widget" id="zd-kas-batch-card" style="margin-top:12px;margin-bottom:0">
    <div class="card-title"><i class="ti ti-timeline"></i> Tracker Batch Reseller · Hari ke-9</div>
    <div id="zd-kas-batch-list">
      <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
    </div>
  </div>
  </div><!-- /zd-tab-stok -->

  <div class="zd-tab-panel" id="zd-tab-keuangan">
  <!-- pair-4 lama (Beban & Income) sudah ada di nw-swipe-container atas —
       slot ini dipakai ulang untuk 2 donut baru v5 (Laba/Rugi & Beban Perusahaan) -->
  <div class="db-swipe-pair" id="swipe-pair-4">
    <div class="db-swipe-track">
      <div class="db-swipe-slide">
        <div class="db-swipe-dot-label"><span class="db-dot active"></span><span class="db-dot"></span></div>
        <div class="card dash-widget" style="margin:0">
          <div class="card-title"><i class="ti ti-chart-donut"></i> Laba/Rugi Bulan Ini</div>
          <div class="dash-donut-wrap">
            <div style="position:relative;width:130px;height:130px;flex-shrink:0">
              <canvas id="dash-donut-labarugi"></canvas>
              <div class="dash-donut-center" id="dash-donut-labarugi-center"></div>
            </div>
            <div id="dash-donut-labarugi-legend" class="dash-donut-legend"></div>
          </div>
        </div>
      </div><!-- /slide 1 -->
      <div class="db-swipe-slide">
        <div class="db-swipe-dot-label"><span class="db-dot"></span><span class="db-dot active"></span></div>
        <div class="card dash-widget" style="margin:0">
          <div class="card-title"><i class="ti ti-report-money"></i> Beban Perusahaan</div>
          <div class="dash-donut-wrap">
            <div style="position:relative;width:130px;height:130px;flex-shrink:0">
              <canvas id="dash-donut-beban"></canvas>
              <div class="dash-donut-center" id="dash-donut-beban-center"></div>
            </div>
            <div id="dash-donut-beban-legend" class="dash-donut-legend"></div>
          </div>
        </div>
      </div><!-- /slide 2 -->
    </div><!-- /db-swipe-track -->
  </div><!-- /swipe-pair-4 -->

  <!-- ═══ ROW 7: JURNAL TERAKHIR + AKTIVITAS TERBARU ════════════ -->
  <div class="db-swipe-pair" id="swipe-pair-5">
    <div class="db-swipe-track">
      <div class="db-swipe-slide">
        <div class="db-swipe-dot-label"><span class="db-dot active"></span><span class="db-dot"></span></div>
        <div class="card" style="margin:0">
          <div class="card-title"><i class="ti ti-list"></i> Jurnal Terakhir</div>
          <div class="tbl-wrap" style="max-height:260px;overflow-y:auto"><table class="tbl">
            <thead><tr><th>Tgl</th><th>Akun</th><th>IDR</th></tr></thead>
            <tbody id="dash-jurnal-tbody">
              <tr><td colspan="3" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
            </tbody>
          </table></div>
        </div>
      </div><!-- /slide 1 -->
      <div class="db-swipe-slide">
        <div class="db-swipe-dot-label"><span class="db-dot"></span><span class="db-dot active"></span></div>
        <div class="card" style="margin:0">
          <div class="card-title"><i class="ti ti-clock"></i> Aktivitas Terbaru <span style="font-size:11px;font-weight:400;color:var(--ink3);margin-left:4px">hari ini</span></div>
          <div id="dash-aktivitas-feed" style="display:flex;flex-direction:column;gap:0;max-height:260px;overflow-y:auto;-webkit-overflow-scrolling:touch">
            <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
          </div>
        </div>
      </div><!-- /slide 2 -->
    </div><!-- /db-swipe-track -->
  </div><!-- /db-swipe-pair-5 -->
  <!-- ═══ KEGIATAN MENDATANG — CICILAN (tab Keuangan) ═══ -->
  <div class="card dash-widget" id="dash-kegiatan-card" style="margin-top:12px;margin-bottom:0">
    <div class="card-title"><i class="ti ti-calendar-event"></i> Kegiatan Mendatang · Cicilan</div>
    <div id="dash-kegiatan-list">
      <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
    </div>
  </div>
  <!-- ═══ KEWAJIBAN SUPPLIER 14 HARI ═══ -->
  <div class="card dash-widget" id="zd-kas-due-card" style="margin-top:12px;margin-bottom:0">
    <div class="card-title"><i class="ti ti-calendar-dollar"></i> Kewajiban Supplier · 14 Hari</div>
    <div id="zd-kas-due-list">
      <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
    </div>
  </div>
  </div><!-- /zd-tab-keuangan -->

  <!-- MODAL TARGET OMSET -->
  <div class="modal-overlay" id="modal-target" onclick="if(event.target===this)closeModal('modal-target')">
    <div class="modal" style="max-width:360px">
      <div class="modal-title"><i class="ti ti-target"></i> Set Target Omset</div>
      <div style="margin-bottom:14px">
        <label style="font-size:12px;color:var(--ink3);display:block;margin-bottom:6px">Target Omset Bulan Ini (Rp)</label>
        <input type="text" inputmode="numeric" id="inp-target-omset" placeholder="Contoh: 10.000.000"
          style="font-family:var(--f);font-size:14px;padding:8px 10px;border:2px solid var(--ink);background:var(--cream);width:100%">
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary btn-sm" onclick="simpanTarget()"><i class="ti ti-check"></i> Simpan</button>
        <button class="btn btn-sm" onclick="closeModal('modal-target')"><i class="ti ti-x"></i> Batal</button>
      </div>
    </div>
  </div>
`;


// ─── TAB DASHBOARD ────────────────────────────────────────────
// Panel non-aktif cuma dikolapskan tingginya (bukan display:none) supaya
// lebar canvas tetap terhitung benar & grafik tidak perlu redraw.
function zdDashTab(name){
  var tabs = document.querySelectorAll('#zd-tabbar .zd-tab');
  for (var i=0;i<tabs.length;i++) tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab')===name);
  var panels = document.querySelectorAll('#page-dashboard .zd-tab-panel');
  for (var j=0;j<panels.length;j++) panels[j].classList.toggle('zd-tab-active', panels[j].id==='zd-tab-'+name);
  // Scroller aslinya .content (bukan window). .content punya scroll-behavior:smooth →
  // reset instan supaya tidak ada animasi scroll saat tinggi halaman berubah antar tab.
  var sc = document.querySelector('.content');
  if (sc) { sc.style.scrollBehavior = 'auto'; sc.scrollTop = 0; sc.style.scrollBehavior = ''; }
}
window.zdDashTab = zdDashTab;

// ─── INJECT STYLE ─────────────────────────────────────────────
(function() {
  if (document.getElementById('dash-extra-style')) return;
  const s = document.createElement('style');
  s.id = 'dash-extra-style';
  s.textContent = `
    .dash-alert-item{background:var(--cream4);border:2px solid var(--ink);padding:7px 12px;font-size:13px;font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:8px;box-shadow:3px 3px 0 var(--ink4)}
    .dash-alert-item.danger{border-color:var(--danger)}
    .dash-alert-item.warn{border-color:var(--warn)}
    .dash-alert-item i{font-size:15px;flex-shrink:0}
    .dash-period-btn{padding:2px 8px !important;min-height:28px !important;font-size:12px !important}

    /* ── Tren Filter chips ── */
    .trench-chip{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-family:var(--f);padding:3px 9px;border:1.5px solid var(--ink3);background:var(--cream);color:var(--ink3);cursor:pointer;user-select:none;white-space:nowrap;transition:all .12s}
    .trench-chip:hover{border-color:var(--ink);color:var(--ink)}
    .trench-w-active{background:#EE4D2D !important;border-color:#EE4D2D !important;color:#fff !important;font-weight:700}
    .trench-ch-active{background:var(--cream2) !important;border-color:var(--ink) !important;color:var(--ink) !important;font-weight:700}
    .trench-cat-label{font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.4px;display:flex;align-items:center;gap:5px;margin-bottom:4px}
    .trench-cat-line{flex:1;height:1px;background:var(--ink4)}
    .trench-sub-item{padding:8px 12px;cursor:pointer;font-size:13px;font-family:var(--f);border-bottom:1px dashed var(--ink4);transition:background .1s;pointer-events:auto;user-select:none;-webkit-user-select:none;background:var(--cream);color:var(--ink);-webkit-tap-highlight-color:transparent;touch-action:manipulation}
    .trench-sub-item:hover,.trench-sub-item:active{background:var(--cream2)}
    .trench-sub-item:last-child{border-bottom:none}
    .trench-kat-item:hover{background:var(--cream2)}
    .active-period{background:var(--ink) !important;color:var(--cream) !important}
    .dash-top-sku-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px dashed var(--ink4)}
    .dash-top-sku-row:last-child{border-bottom:none;margin-bottom:0}
    .dash-rank{font-size:13px;width:20px;flex-shrink:0;text-align:center}
    .dash-feed-item{display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px dashed var(--ink4);font-size:12px}
    .dash-feed-item:last-child{border-bottom:none}
    .dash-feed-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:3px}
    .dash-feed-dot.sell{background:var(--ok)}
    .dash-feed-dot.kas{background:var(--warn)}
    .dash-feed-time{font-size:10px;color:var(--ink4);margin-top:2px}
    .target-link{font-size:11px;color:var(--ink4);cursor:pointer;text-decoration:underline dashed;margin-left:4px}
    .target-link:hover{color:var(--ink2)}
    .dist-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border:2px solid var(--ink);font-size:11px;font-weight:700;font-family:var(--f)}
    .beban-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--ink4);font-size:15px}
    .beban-row:last-child{border-bottom:none}
  `;
  document.head.appendChild(s);
})();


// ─── STATE ────────────────────────────────────────────────────
let _dashPeriod     = 30; // default 30 Hari Terakhir
let _dashJPData     = [];
let _trenchJPData   = []; // data khusus chart tren — TIDAK boleh dipakai card lain
let _dashStokData   = [];
let _dashChannelMap = {};
let _dashChartPoints = []; // untuk tooltip hover

// ─── HELPERS ─────────────────────────────────────────────────
function _fmtRp(v) {
  return fmtRpFull(v);
}
function _fmtRpShort(v) {
  return fmtRpShort(v);
}
function _fmtTgl(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit'});
  } catch(e) { return '—'; }
}
function _fmtAgo(iso) {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 2)  return 'baru saja';
    if (m < 60) return m + ' mnt lalu';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' jam lalu';
    return Math.floor(h/24) + ' hari lalu';
  } catch(e) { return ''; }
}
function statusBadgeDash(sisa) {
  if (sisa <= 0) return '<span class="badge badge-crit">Habis!</span>';
  if (sisa <= 3) return '<span class="badge badge-crit">Kritis!</span>';
  if (sisa <= 8) return '<span class="badge badge-warn">Ati2</span>';
  return '<span class="badge badge-ok">Aman</span>';
}

// ─── LOCAL DATE HELPER (WIB-safe, bukan UTC) ─────────────────
// new Date().toISOString() selalu UTC → salah di WIB jam 00-06
// Gunakan _localDateStr() untuk tanggal lokal yang benar
function _localDateStr(d) {
  const dt = d || new Date();
  const y  = dt.getFullYear();
  const m  = String(dt.getMonth()+1).padStart(2,'0');
  const dd = String(dt.getDate()).padStart(2,'0');
  return y + '-' + m + '-' + dd;
}
function _localDateOffset(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return _localDateStr(d);
}

// ─── TARGET ──────────────────────────────────────────────────
function _getTarget() { return parseInt(localStorage.getItem('zenoot_target_omset') || '0') || 0; }
function simpanTarget() {
  const v = idrVal('inp-target-omset');
  if (v <= 0) { alert('Target harus lebih dari 0'); return; }
  localStorage.setItem('zenoot_target_omset', String(v));
  closeModal('modal-target');
  loadDashboard();
}

// ─── TREN FILTER — 2 tombol terpisah: Periode & Channel ────────────
var _trenchPeriod   = 30; // default 30 Hari Terakhir
var _trenchChannels = [];

// Periode dropdown
function trenchTogglePeriode(e) {
  if (e) e.stopPropagation();
  var dd = document.getElementById('trench-dd-periode');
  var ddC = document.getElementById('trench-dd-channel');
  if (ddC) ddC.style.display = 'none';
  if (!dd) return;
  var open = dd.style.display === 'block';
  dd.style.display = open ? 'none' : 'block';
  if (!open) trenchRefreshPeriodeChips();
}

function trenchRefreshPeriodeChips() {
  var wrap = document.getElementById('trench-waktu-chips');
  if (!wrap) return;
  Array.from(wrap.children).forEach(function(c) {
    var rawW = c.dataset.w;
    var wVal = (!isNaN(rawW) && rawW !== '') ? Number(rawW) : rawW;
    var isAct = String(wVal) === String(_trenchPeriod);
    c.style.background = isAct ? 'var(--ink)' : 'var(--cream)';
    c.style.color      = isAct ? 'var(--cream)' : 'var(--ink)';
    c.style.fontWeight = isAct ? '700' : '';
    // Ensure touchend handler is attached (idempotent via flag)
    if (!c._trenchTouch) {
      c._trenchTouch = true;
      c.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        trenchSelWaktu(c);
      });
    }
  });
}

function trenchSelWaktu(el) {
  var w = el.dataset.w;
  _trenchPeriod = isNaN(w) ? w : Number(w);
  trenchRefreshPeriodeChips();
  var wm = {bulan:'Bulan Ini', 1:'Hari Ini', kemarin:'Kemarin', 7:'7 Hari', 14:'14 Hari', 30:'30 Hari'};
  var lbl = document.getElementById('trench-lbl-periode');
  if (lbl) lbl.textContent = wm[_trenchPeriod] || 'Periode';
  var btn = document.getElementById('trench-btn-periode');
  if (btn) {
    btn.style.background = 'var(--ink)';
    btn.style.color = 'var(--cream)';
    btn.style.borderColor = 'var(--ink)';
  }
  // Auto-apply + tutup panel
  var dd = document.getElementById('trench-dd-periode');
  if (dd) dd.style.display = 'none';
  trenchApply();
}

function trenchResetPeriode() {
  _trenchPeriod = 30;
  trenchRefreshPeriodeChips();
  var lbl = document.getElementById('trench-lbl-periode');
  if (lbl) lbl.textContent = '30 Hari';
  var btn = document.getElementById('trench-btn-periode');
  if (btn) { btn.style.background = 'var(--ink)'; btn.style.color = 'var(--cream)'; btn.style.borderColor = 'var(--ink)'; }
  document.getElementById('trench-dd-periode').style.display = 'none';
}

// Channel dropdown
function trenchToggleChannel(e) {
  if (e) e.stopPropagation();
  var dd = document.getElementById('trench-dd-channel');
  var ddP = document.getElementById('trench-dd-periode');
  if (ddP) ddP.style.display = 'none';
  if (!dd) return;
  var open = dd.style.display === 'block';
  dd.style.display = open ? 'none' : 'block';
  if (!open) trenchRenderChannelList();
}

function trenchRenderChannelList() {
  var wrap = document.getElementById('trench-channel-list');
  if (!wrap) return;
  var katCfg = {
    toko_utama:{label:'Shopee',icon:'🛍️'},
    reseller:{label:'Dropship',icon:'🚚'},   // key DB reseller = Dropship (ganti nama)
    reseller_baru:{label:'Reseller',icon:'👥'},
    tiktok:{label:'TikTok',icon:'🎵'},
    lazada:{label:'Lazada',icon:'📦'},
    offline:{label:'Offline',icon:'🏪'}
  };
  var katOrder = ['toko_utama','reseller_baru','reseller','tiktok','lazada','offline'];
  var grouped = {};
  Object.values(_dashChannelMap).forEach(function(ch) {
    var k = ch.kategori || 'lainnya';
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(ch);
  });
  if (!Object.keys(grouped).length) {
    wrap.innerHTML = '<div style="padding:10px 14px;font-size:12px;color:var(--ink3);font-style:italic">Belum ada channel</div>';
    return;
  }
  var orderedKeys = katOrder.filter(function(k){ return grouped[k]; });
  Object.keys(grouped).forEach(function(k){ if (!orderedKeys.includes(k)) orderedKeys.push(k); });

  // Clear & rebuild pakai DOM (bukan innerHTML) agar event listener tidak hilang
  wrap.innerHTML = '';
  orderedKeys.forEach(function(kat) {
    var items = grouped[kat]; if (!items||!items.length) return;
    var cfg = katCfg[kat]||{label:kat,icon:'📁'};
    var header = document.createElement('div');
    header.style.cssText = 'padding:5px 12px 2px;font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.3px;pointer-events:none';
    header.textContent = cfg.icon + ' ' + cfg.label;
    wrap.appendChild(header);
    items.forEach(function(ch) {
      var isActive = _trenchChannels.includes(String(ch.id));
      var row = document.createElement('div');
      row.dataset.chid = ch.id;
      row.style.cssText = 'padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px dashed var(--ink4);' +
        'background:'+(isActive?'var(--ink)':'var(--cream)')+';' +
        'color:'+(isActive?'var(--cream)':'inherit')+';' +
        'font-weight:'+(isActive?'700':'400')+';' +
        'user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation';
      row.textContent = (isActive?'✓ ':'')+ch.nama;
      // Pakai addEventListener — lebih reliable daripada onclick di innerHTML.
      // CATATAN 4 Sep 2026: dulu ada listener 'touchend' terpisah di sini juga,
      // dicabut karena double-fire bareng 'click' sintetis dari browser
      // (touchend jalan duluan pilih channel, lalu click nyusul toggle balik
      // deselect — user liatnya kayak "lompat-lompat"/pilihan gak nempel).
      // 'click' aja sudah cukup responsif karena row punya touch-action:manipulation.
      row.addEventListener('click', function(e) {
        e.stopPropagation();
        trenchToggleCh(row);
      });
      wrap.appendChild(row);
    });
  });

  // Stop scroll bubbling ke halaman
  wrap.addEventListener('wheel', function(e) { e.stopPropagation(); }, { passive: true });
  wrap.addEventListener('touchmove', function(e) { e.stopPropagation(); }, { passive: true });
}

function trenchToggleCh(el) {
  var id = String(el.dataset.chid);
  // Single-select: kalau sudah aktif → deselect (kembali semua channel)
  if (_trenchChannels.length === 1 && _trenchChannels[0] === id) {
    _trenchChannels = [];
  } else {
    _trenchChannels = [id];
  }
  var btn = document.getElementById('trench-btn-channel');
  if (btn) { btn.style.background = _trenchChannels.length ? 'var(--ink)' : ''; btn.style.color = _trenchChannels.length ? 'var(--cream)' : ''; }
  var lbl = document.getElementById('trench-lbl-channel');
  var selCh = _trenchChannels.length && _dashChannelMap[_trenchChannels[0]];
  if (lbl) lbl.textContent = selCh ? selCh.nama : 'Channel';
  // Auto-apply + tutup panel
  var dd = document.getElementById('trench-dd-channel');
  if (dd) dd.style.display = 'none';
  trenchApply();
}

function trenchResetChannel() {
  _trenchChannels = [];
  document.getElementById('trench-dd-channel').style.display = 'none';
  var btn = document.getElementById('trench-btn-channel');
  if (btn) { btn.style.background = ''; btn.style.color = ''; }
  var lbl = document.getElementById('trench-lbl-channel');
  if (lbl) lbl.textContent = 'Channel';
}

function trenchCloseAll() {
  var ddP = document.getElementById('trench-dd-periode');
  var ddC = document.getElementById('trench-dd-channel');
  if (ddP) ddP.style.display = 'none';
  if (ddC) ddC.style.display = 'none';
}

// Tutup saat klik di luar
document.addEventListener('click', function(e) {
  var wP = document.getElementById('trench-wrap-periode');
  var wC = document.getElementById('trench-wrap-channel');
  if (wP && !wP.contains(e.target)) { var d=document.getElementById('trench-dd-periode'); if(d) d.style.display='none'; }
  if (wC && !wC.contains(e.target)) { var d=document.getElementById('trench-dd-channel'); if(d) d.style.display='none'; }
});

function trenchReset() {
  _trenchPeriod   = 30;
  _trenchChannels = [];
  _dashPeriod     = 30;
  _trenchJPData   = []; // akan di-refetch saat apply
  trenchCloseAll();
  trenchResetPeriode();
  trenchResetChannel();
  _trenchRenderChart();
  trenchUpdateBadge();
}

async function trenchApply() {
  trenchCloseAll();
  _dashPeriod = _trenchPeriod;

  var filter = '&order=tanggal.desc';
  if (_trenchPeriod === 1) {
    filter = '&tanggal=gte.' + _localDateStr() + '&order=tanggal.desc';
  } else if (_trenchPeriod === 'kemarin') {
    var y = new Date(); y.setDate(y.getDate()-1);
    var yStr = _localDateStr(y);
    filter = '&tanggal=gte.' + yStr + '&tanggal=lte.' + yStr + '&order=tanggal.desc';
  } else if (_trenchPeriod === 'bulan') {
    var bulanStr = _localDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    filter = '&tanggal=gte.' + bulanStr + '&order=tanggal.desc';
  } else if (typeof _trenchPeriod === 'number') {
    filter = '&tanggal=gte.' + _localDateOffset(_trenchPeriod) + '&order=tanggal.desc';
  }

  try {
    _trenchJPData = (await dbGet('jurnal_penjualan', filter)) || [];
  } catch(e) {
    _trenchJPData = _dashJPData;
  }

  _trenchRenderChart();
  trenchUpdateBadge();
}

// Reset filter — handled by trenchReset() above

// Render chart dengan data yang sudah difilter (lokal, tidak sentuh _dashJPData asli)
function _trenchRenderChart() {
  var source = (_trenchJPData && _trenchJPData.length > 0) ? _trenchJPData : _dashJPData;
  var filtered = source;
  if (_trenchChannels.length > 0) {
    filtered = source.filter(function(r) {
      return _trenchChannels.includes(String(r.channel_id));
    });
  }
  _renderChartPenjualan(filtered);
}

// Update badge & active chips di header
function trenchUpdateBadge() {
  var waktuMap = { 1:'Hari Ini', kemarin:'Kemarin', 7:'7 Hari', 14:'14 Hari', 30:'30 Hari', bulan:'Bulan Ini' };

  var parts = [];
  if (_trenchPeriod !== 30) parts.push(waktuMap[_trenchPeriod] || String(_trenchPeriod)+' Hari');
  if (_trenchChannels.length > 0) parts.push(_trenchChannels.length + ' channel');

  // Chip badge di header (mis. pill merah "Kemarin") DICABUT 4 Sep 2026 —
  // infonya udah keliatan di label tombol Periode/Channel sendiri, chip ini
  // cuma duplikat yang bikin tombol-tombol di sebelahnya geser posisi tiap
  // filter berubah. #trench-active-chips dibiarin kosong terus.
  var chipsEl = document.getElementById('trench-active-chips');
  if (chipsEl) chipsEl.innerHTML = '';

  // Update badge channel di menu
  var bdgCh = document.getElementById('trench-badge-channel');
  if (bdgCh) bdgCh.textContent = _trenchChannels.length > 0 ? '· ' + _trenchChannels.length + ' dipilih' : '';

  // Tombol Reset otomatis — muncul bila ada filter non-default aktif
  var resetBtn = document.getElementById('trench-reset-btn');
  var filterAktif = (_trenchPeriod !== 30) || (_trenchChannels.length > 0);
  if (resetBtn) resetBtn.style.display = filterAktif ? 'inline-flex' : 'none';
}

// ─── ALERTS ──────────────────────────────────────────────────
function _renderAlerts(stokData, saldo) {
  const wrap = document.getElementById('dash-alerts-wrap');
  if (!wrap) return;
  const alerts = [];
  const habis      = stokData.filter(r => r.sisa <= 0);
  const kritis     = stokData.filter(r => r.sisa > 0 && r.sisa <= 3);
  // Alert stok dipindah ke halaman Re-Stock
  if (saldo < 0)     alerts.push({ cls:'danger', icon:'ti-coin-off',       msg: 'Saldo kas negatif ' + _fmtRp(Math.abs(saldo)) + ' — cek jurnal kas!' });
  wrap.innerHTML = alerts.map(a =>
    '<div class="dash-alert-item ' + a.cls + '"><i class="ti ' + a.icon + '" style="color:var(--' + (a.cls==='danger'?'danger':'warn') + ')"></i><span>' + a.msg + '</span></div>'
  ).join('');
}

// ─── CHART HARI INI (per jam) ────────────────────────────────
function _renderChartHariIni(jpData, canvas, tooltip) {
  const todayStr = _localDateStr(); // FIX: pakai lokal WIB bukan UTC
  const labels = [], totals = [];

  // FIX: loop 0-23 saja (jam 24 tidak valid)
  for (let h = 0; h <= 23; h++) {
    const hStr = String(h).padStart(2,'0');
    labels.push(hStr + ':00');
    const jam = jpData
      .filter(r => {
        if (!r.tanggal || String(r.tanggal).slice(0,10) !== todayStr) return false;
        const wkt = String(r.waktu || '00:00');
        return wkt.slice(0,2) === hStr;
      })
      .reduce((s,r) => s + (Number(r.total)||0), 0);
    totals.push(jam);
  }

  const total   = totals.reduce((s,v)=>s+v,0);
  const emptyEl = document.getElementById('dash-chart-empty');
  const leg     = document.getElementById('dash-chart-legend');

  if (total === 0) {
    canvas.style.display = 'none';
    if (emptyEl) { emptyEl.style.display='flex'; emptyEl.textContent='Belum ada penjualan hari ini'; }
    if (leg) leg.innerHTML = '';
    return;
  }

  // FIX: tampilkan canvas DULU agar offsetWidth tidak 0 (canvas:none → retry selamanya)
  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  if (!canvas.offsetWidth || canvas.offsetWidth < 10) {
    // Guard: jangan retry kalau page sedang hidden (display:none) → cegah infinite loop & CPU panas
    if (canvas.offsetParent === null) return;
    setTimeout(() => _renderChartHariIni(jpData, canvas, tooltip), 80);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.offsetWidth;
  const H   = canvas.offsetHeight || 160;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const padL=44, padR=16, padT=14, padB=34;
  const cW=W-padL-padR, cH=H-padT-padB;
  const maxVal = Math.max(...totals, 1);
  const step   = cW / (totals.length - 1 || 1);
  const colLine='#3ddb6b', colFill='rgba(61,219,107,0.07)', colGrid='var(--ovl-0_06)', colLabel='#909090';

  // Grid
  ctx.clearRect(0, 0, W, H);
  for (let i = 0; i <= 4; i++) {
    const y = padT + cH - (cH * i / 4);
    ctx.strokeStyle=colGrid; ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+cW,y); ctx.stroke();
    ctx.fillStyle=colLabel; ctx.font='10px sans-serif'; ctx.textAlign='right';
    ctx.fillText(_fmtRpShort(maxVal*i/4), padL-4, y+3);
  }

  // Area fill
  ctx.beginPath();
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0?ctx.moveTo(x,padT+cH):ctx.lineTo(x,y); });
  ctx.lineTo(padL+(totals.length-1)*step, padT+cH);
  ctx.closePath(); ctx.fillStyle=colFill; ctx.fill();

  // Line
  ctx.beginPath(); ctx.strokeStyle=colLine; ctx.lineWidth=1.5; ctx.lineJoin='round';
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.stroke();

  // X labels — tampilkan setiap 3 jam agar muat (00,03,06,09,12,15,18,21)
  labels.forEach((lbl,i) => {
    if (i % 3 !== 0) return;
    const x = padL + i * step;
    ctx.fillStyle=colLabel; ctx.font='10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(lbl, x, padT+cH+14);
  });

  // Legend
  if (leg) {
    const colLegend = '#2a6e3a';
    leg.innerHTML =
      '<span style="display:flex;align-items:center;gap:4px"><span style="width:14px;height:3px;background:'+colLegend+';display:inline-block;border-radius:2px"></span>Hari Ini: '+_fmtRp(total)+'</span>';
  }
}


// ─── CHART KEMARIN (per jam) ─────────────────────────────────
function _renderChartKemarin(jpData, canvas, tooltip) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = _localDateStr(yesterday);
  const labels = [], totals = [];

  for (let h = 0; h <= 23; h++) {
    const hStr = String(h).padStart(2,'0');
    labels.push(hStr + ':00');
    const jam = jpData
      .filter(r => {
        if (!r.tanggal || String(r.tanggal).slice(0,10) !== yStr) return false;
        const wkt = String(r.waktu || '00:00');
        return wkt.slice(0,2) === hStr;
      })
      .reduce((s,r) => s + (Number(r.total)||0), 0);
    totals.push(jam);
  }

  const total   = totals.reduce((s,v)=>s+v,0);
  const emptyEl = document.getElementById('dash-chart-empty');
  const leg     = document.getElementById('dash-chart-legend');

  if (total === 0) {
    canvas.style.display = 'none';
    if (emptyEl) { emptyEl.style.display='flex'; emptyEl.textContent='Belum ada penjualan kemarin'; }
    if (leg) leg.innerHTML = '';
    return;
  }

  // FIX: tampilkan canvas DULU agar offsetWidth tidak 0
  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  if (!canvas.offsetWidth || canvas.offsetWidth < 10) {
    if (canvas.offsetParent === null) return;
    setTimeout(() => _renderChartKemarin(jpData, canvas, tooltip), 80);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.offsetWidth;
  const H   = canvas.offsetHeight || 160;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const padL=44, padR=16, padT=14, padB=34;
  const cW=W-padL-padR, cH=H-padT-padB;
  const maxVal = Math.max(...totals, 1);
  const step   = cW / (totals.length - 1 || 1);
  const colLine='#3ddb6b', colFill='rgba(61,219,107,0.07)', colGrid='var(--ovl-0_06)', colLabel='#909090';

  ctx.clearRect(0, 0, W, H);
  for (let i = 0; i <= 4; i++) {
    const y = padT + cH - (cH * i / 4);
    ctx.strokeStyle=colGrid; ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+cW,y); ctx.stroke();
    ctx.fillStyle=colLabel; ctx.font='10px sans-serif'; ctx.textAlign='right';
    ctx.fillText(_fmtRpShort(maxVal*i/4), padL-4, y+3);
  }

  ctx.beginPath();
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0?ctx.moveTo(x,padT+cH):ctx.lineTo(x,y); });
  ctx.lineTo(padL+(totals.length-1)*step, padT+cH);
  ctx.closePath(); ctx.fillStyle=colFill; ctx.fill();

  ctx.beginPath(); ctx.strokeStyle=colLine; ctx.lineWidth=1.5; ctx.lineJoin='round';
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.stroke();

  labels.forEach((lbl,i) => {
    if (i % 3 !== 0) return;
    const x = padL + i * step;
    ctx.fillStyle=colLabel; ctx.font='10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(lbl, x, padT+cH+14);
  });

  if (leg) {
    const d = yesterday;
    const tgl = String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0');
    leg.innerHTML = '<span style="display:flex;align-items:center;gap:4px"><span style="width:14px;height:3px;background:#2a6e3a;display:inline-block;border-radius:2px"></span>Kemarin (' + tgl + '): ' + _fmtRp(total) + '</span>';
  }
}
// ─── CHART PENJUALAN + TOOLTIP HOVER ─────────────────────────
function _renderChartPenjualan(jpData) {
  const canvas  = document.getElementById('dash-chart-penjualan');
  const tooltip = document.getElementById('dash-chart-tooltip');
  if (!canvas) return;

  // Mode Hari Ini: tampil per jam 00-23
  if (_dashPeriod === 1) {
    _renderChartHariIni(jpData, canvas, tooltip);
    return;
  }

  // Mode Kemarin: tampil per jam 00-23, date = kemarin
  if (_dashPeriod === 'kemarin') {
    _renderChartKemarin(jpData, canvas, tooltip);
    return;
  }

  // Hitung jumlah hari yang akan ditampilkan
  let periodDays;
  if (_dashPeriod === 'bulan') {
    // Bulan ini: dari tanggal 1 sampai hari ini
    const today0 = new Date();
    periodDays = today0.getDate(); // hari ke-N bulan ini
  } else if (typeof _dashPeriod === 'number') {
    periodDays = _dashPeriod;
  } else {
    periodDays = 30; // fallback aman
  }

  const today = new Date();
  const labels = [], totals = [], dates = [];
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = _localDateStr(d); // FIX: pakai lokal WIB bukan UTC
    dates.push(key);
    labels.push(String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0'));
    const dayTotal = jpData
      .filter(r => r.tanggal && String(r.tanggal).slice(0,10) === key)
      .reduce((s,r) => s + (Number(r.total)||0), 0);
    totals.push(dayTotal);
  }

  const maxVal  = Math.max(...totals, 1);
  const hasData = totals.some(v => v > 0);
  const emptyEl = document.getElementById('dash-chart-empty');

  if (!hasData) {
    canvas.style.display = 'none';
    if (emptyEl) {
      const wm = { 1:'Hari Ini', kemarin:'Kemarin', 7:'7 Hari', 14:'14 Hari', 30:'30 Hari', bulan:'Bulan Ini' };
      const lbl = wm[_dashPeriod] || (_dashPeriod + ' Hari');
      emptyEl.textContent = 'Belum ada data penjualan (' + lbl + ')';
      emptyEl.style.display = 'flex';
    }
    return;
  }

  // FIX: tampilkan canvas DULU agar offsetWidth tidak 0 (canvas:none → retry selamanya)
  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  if (!canvas.offsetWidth || canvas.offsetWidth < 10) {
    if (canvas.offsetParent === null) return;
    setTimeout(() => _renderChartPenjualan(jpData), 80);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.offsetWidth;
  const H   = canvas.offsetHeight || 160;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const padL=44, padR=36, padT=14, padB=34;
  const cW=W-padL-padR, cH=H-padT-padB;
  const colLine='#3ddb6b', colFill='rgba(61,219,107,0.07)', colGrid='var(--ovl-0_06)', colLabel='#909090';

  for (let i=0; i<=4; i++) {
    const y = padT + cH - cH*i/4;
    ctx.strokeStyle=colGrid; ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+cW,y); ctx.stroke();
    ctx.fillStyle=colLabel; ctx.font='10px sans-serif'; ctx.textAlign='right';
    ctx.fillText(_fmtRpShort(maxVal*i/4), padL-4, y+3);
  }

  const step = cW / Math.max(labels.length-1, 1);

  ctx.beginPath();
  ctx.moveTo(padL, padT+cH);
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0?ctx.lineTo(x,y):ctx.lineTo(x,y); });
  ctx.lineTo(padL+(totals.length-1)*step, padT+cH);
  ctx.closePath(); ctx.fillStyle=colFill; ctx.fill();

  ctx.beginPath(); ctx.strokeStyle=colLine; ctx.lineWidth=1.5; ctx.lineJoin='round';
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.stroke();

  // Simpan koordinat titik untuk tooltip
  _dashChartPoints = [];
  const skip = Math.ceil(labels.length/7);
  totals.forEach((v,i) => {
    const x=padL+i*step, y=padT+cH-(v/maxVal)*cH;
    _dashChartPoints.push({ x, y, label: labels[i], date: dates[i], val: v });
    ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2);
    ctx.fillStyle=v>0?colLine:colGrid; ctx.fill();
    if (i%skip===0 || i===labels.length-1) {
      ctx.fillStyle=colLabel; ctx.font='10px sans-serif'; ctx.textAlign='center';
      ctx.fillText(labels[i], x, H-padB+14);
    }
    if (i===totals.length-1 && v>0) {
      ctx.fillStyle='#2a6e3a'; ctx.font='bold 10px sans-serif';
      // Kalau titik terakhir dekat tepi kanan, geser label ke dalam
      const labelW = ctx.measureText(_fmtRpShort(v)).width;
      if (x + labelW/2 > W - padR) {
        ctx.textAlign='right';
        ctx.fillText(_fmtRpShort(v), Math.min(x, W-padR-2), y-9);
      } else {
        ctx.textAlign='center';
        ctx.fillText(_fmtRpShort(v), x, y-9);
      }
    }
  });

  // Tooltip hover
  if (tooltip) {
    canvas.onmousemove = function(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      let closest = null, minDist = 30;
      _dashChartPoints.forEach(pt => {
        const dist = Math.abs(mx - pt.x);
        if (dist < minDist) { minDist = dist; closest = pt; }
      });
      if (closest) {
        const txn = jpData.filter(r => r.tanggal && String(r.tanggal).slice(0,10) === closest.date);
        const qty = txn.reduce((s,r)=>s+(Number(r.qty)||0),0);
        tooltip.innerHTML = '<b>' + closest.label + '</b>  ' + _fmtRp(closest.val) + '  ·  ' + qty + ' pcs  ·  ' + txn.length + ' trx';
        const tooltipX = Math.min(closest.x + 10, W - 170);
        const tooltipY = Math.max(closest.y - 36, 0);
        tooltip.style.left  = tooltipX + 'px';
        tooltip.style.top   = tooltipY + 'px';
        tooltip.style.display = 'block';
      } else {
        tooltip.style.display = 'none';
      }
    };
    canvas.onmouseleave = function() { tooltip.style.display = 'none'; };
  }

  const leg = document.getElementById('dash-chart-legend');
  if (leg) {
    const total = totals.reduce((a,b)=>a+b,0);
    const half  = Math.floor(totals.length/2);
    const prev  = totals.slice(0,half).reduce((a,b)=>a+b,0);
    const curr  = totals.slice(half).reduce((a,b)=>a+b,0);
    const delta = prev>0 ? ((curr-prev)/prev*100).toFixed(0) : null;
    const dStr  = delta!==null ? (delta>=0?'▲ +':'▼ ') + delta + '% vs paruh pertama' : '';
    const dCol  = delta>=0?'var(--ok)':'var(--danger)';
    const _wm={1:'Hari Ini',kemarin:'Kemarin',7:'7 Hari',14:'14 Hari',30:'30 Hari',bulan:'Bulan Ini'};
    const _pl=_wm[_dashPeriod]||(_dashPeriod+' hari');
    leg.innerHTML =
      '<span style="display:flex;align-items:center;gap:4px"><span style="width:14px;height:3px;background:'+colLine+';display:inline-block;border-radius:2px"></span>'+_pl+': '+_fmtRp(total)+'</span>' +
      (dStr ? '<span style="color:'+dCol+';font-weight:700">'+dStr+'</span>' : '');
  }
}

// ─── TOP SKU ─────────────────────────────────────────────────
function _renderTopSku(jpData) {
  const el = document.getElementById('dash-top-sku');
  if (!el) return;
  const map = {};
  jpData.forEach(r => {
    if (!r.sku) return;
    if (!map[r.sku]) map[r.sku] = {qty:0,omset:0};
    map[r.sku].qty   += (r.qty||0);
    map[r.sku].omset += (r.total||0);
  });
  const sorted = Object.entries(map).sort((a,b)=>b[1].omset-a[1].omset).slice(0,5);
  if (!sorted.length) { el.innerHTML='<div style="color:var(--ink3);font-style:italic;font-size:13px">Belum ada data penjualan bulan ini</div>'; return; }
  const maxO  = sorted[0][1].omset;
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
  el.innerHTML = sorted.map(([sku,d],i) => {
    const pct = maxO>0 ? (d.omset/maxO*100).toFixed(0) : 0;
    return '<div class="dash-top-sku-row">' +
      '<span class="dash-rank">'+medals[i]+'</span>' +
      '<div style="flex:1">' +
        '<div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:2px">'+sku+'</div>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<div style="flex:1;background:var(--cream4);height:6px;border-radius:3px;border:1px solid var(--ink4);overflow:hidden"><div style="width:'+pct+'%;height:100%;background:var(--ok);border-radius:3px"></div></div>' +
          '<span style="font-size:11px;color:var(--ink3);white-space:nowrap">'+d.qty+' pcs</span>' +
        '</div>' +
      '</div>' +
      '<span style="font-size:12px;color:var(--ink3);white-space:nowrap;margin-left:6px">'+_fmtRp(d.omset)+'</span>' +
    '</div>';
  }).join('');
}

// _dashNormSku (7 Sep 2026): normalisasi spasi/underscore jadi setara,
// dipakai sebagai FALLBACK match kalau exact-uppercase-match gagal — pola
// sama kayak _norm() di _jpResolveSku (jurnal-penjualan.js). Defense-in-depth
// buat kasus "Lainnya" yang murni gara-gara beda format spasi/underscore
// (bukan produk yang bener2 gak ketemu). Root cause utama (rename SKU gak
// cascade) udah difix di simpanProduk(); ini jaring pengaman tambahan.
function _dashNormSku(s) {
  return (s || '').toUpperCase().replace(/[\s_]+/g, '_').replace(/__+/g, '_');
}

// ─── BOSS CHART ──────────────────────────────────────────────
function _renderBoss(jpData, stokData) {
  const skuBossMap = {}, skuBossMapNorm = {};
  stokData.forEach(r => {
    if (r.sku_variasi && r.boss) {
      skuBossMap[(r.sku_variasi||'').toUpperCase()] = r.boss;
      skuBossMapNorm[_dashNormSku(r.sku_variasi)] = r.boss;
    }
  });
  const bossMap = {};
  jpData.forEach(r => {
    const skuU = (r.sku||'').toUpperCase();
    const boss = skuBossMap[skuU] || skuBossMapNorm[_dashNormSku(skuU)] || 'Lainnya';
    if (!bossMap[boss]) bossMap[boss] = {qty:0,omset:0};
    bossMap[boss].qty   += (r.qty||0);
    bossMap[boss].omset += (Number(r.total)||0);
  });
  const sorted     = Object.entries(bossMap).sort((a,b)=>b[1].omset-a[1].omset);
  const totalOmset = sorted.reduce((s,[,d])=>s+d.omset, 0);
  const colors     = ['#2a6e3a','#2266cc','#c8a000','#b03020','#6b3fa0','#1a8a7a'];

  const tbody = document.getElementById('dash-boss-tbody');
  if (tbody) {
    const EMPTY_ROW_BOSS = '<tr><td colspan="4" style="color:var(--ink4);text-align:center">—</td></tr>';
    if (!sorted.length) {
      const rows = Array(5).fill(EMPTY_ROW_BOSS);
      tbody.innerHTML = rows.join('');
    } else {
      const rows = sorted.slice(0, 5).map(([boss,d],i) => {
        const pct = totalOmset>0?(d.omset/totalOmset*100).toFixed(0):0;
        return '<tr>' +
          '<td><b>'+boss+'</b></td>' +
          '<td>'+d.qty+'</td>' +
          '<td><b style="color:var(--ok)">'+_fmtRp(d.omset)+'</b></td>' +
          '<td><div style="display:flex;align-items:center;gap:4px">'+
            '<div style="width:40px;background:var(--cream4);height:5px;border-radius:2px;overflow:hidden;border:1px solid var(--ink4)">'+
              '<div style="width:'+pct+'%;height:100%;background:'+colors[i%colors.length]+'"></div>'+
            '</div>'+
            '<span style="font-size:11px;color:var(--ink3)">'+pct+'%</span>'+
          '</div></td>' +
        '</tr>';
      });
      while (rows.length < 5) rows.push(EMPTY_ROW_BOSS);
      tbody.innerHTML = rows.join('');
    }
  }

  const canvas = document.getElementById('dash-chart-boss');
  if (!canvas || !sorted.length || totalOmset===0) return;
  const dpr = window.devicePixelRatio||1;
  const wrap = canvas.parentElement;
  const W = wrap ? (wrap.offsetWidth  || 260) : 260;
  const H = wrap ? (wrap.offsetHeight || 200) : 200;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const cx = W/2, cy = H/2;
  const r  = Math.min(cx, cy) - 6;
  const inner = r * 0.64;
  let angle = -Math.PI/2;
  sorted.forEach(([,d],i) => {
    const slice = (d.omset/totalOmset)*Math.PI*2;
    if (slice<=0) return;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,angle,angle+slice);
    ctx.closePath();
    ctx.fillStyle=colors[i%colors.length]; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    angle += slice;
  });
  ctx.beginPath(); ctx.arc(cx,cy,inner,0,Math.PI*2);
  ctx.fillStyle='#fff'; ctx.fill();
  const _fs = Math.max(11, Math.round(inner*0.34));
  ctx.fillStyle='#1c1a14'; ctx.font='bold '+_fs+'px sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(_fmtRpShort(totalOmset),cx,cy-_fs*0.35);
  ctx.font=Math.max(9,_fs-3)+'px sans-serif'; ctx.fillStyle='#8a8580';
  ctx.fillText('total omset',cx,cy+_fs*0.75);

  const legendEl = document.getElementById('dash-boss-legend');
  if (legendEl) {
    legendEl.innerHTML = sorted.map(([boss,d],i) => {
      const pct = totalOmset>0?(d.omset/totalOmset*100).toFixed(0):0;
      return '<div class="zd-leg-row">' +
        '<span class="zd-leg-dot" style="background:'+colors[i%colors.length]+'"></span>' +
        '<span class="zd-leg-name">'+boss+'</span>' +
        '<span class="zd-leg-pct" style="color:'+colors[i%colors.length]+'">'+pct+'%</span>' +
      '</div>';
    }).join('');
  }
}

// ─── PERFORMA CHANNEL — BARU ──────────────────────────────────
function _renderChannel(jpData) {
  const tbody  = document.getElementById('dash-channel-tbody');
  const canvas = document.getElementById('dash-chart-channel');
  if (!tbody) return;

  // Build channel map dari _dashChannelMap (sudah di-load)
  const chMap = {};
  jpData.forEach(r => {
    const ch  = _dashChannelMap[r.channel_id];
    const key = ch ? (ch.nama || ('Ch#'+r.channel_id)) : 'Tidak Diketahui';
    if (!chMap[key]) chMap[key] = {trx:0, qty:0, omset:0, kategori: ch ? (ch.kategori||'') : ''};
    chMap[key].trx++;
    chMap[key].qty   += (Number(r.qty)||0);
    chMap[key].omset += (Number(r.total)||0);
  });

  const sorted     = Object.entries(chMap).sort((a,b)=>b[1].omset-a[1].omset);
  const totalOmset = sorted.reduce((s,[,d])=>s+d.omset, 0);
  const colors     = ['#2a6e3a','#2266cc','#c8a000','#b03020','#6b3fa0','#1a8a7a','#888'];

  const EMPTY_ROW_CH = '<tr><td colspan="5" style="color:var(--ink4);text-align:center">—</td></tr>';
  if (!sorted.length) {
    const rows = Array(5).fill(EMPTY_ROW_CH);
    tbody.innerHTML = rows.join('');
    return;
  }

  const chRows = sorted.slice(0, 5).map(([chNama, d], i) => {
    const pct = totalOmset>0 ? (d.omset/totalOmset*100).toFixed(0) : 0;
    // Pass object {nama, kategori} ke chBadge agar icon akurat
    const badgeHtml = chBadge({ nama: chNama, kategori: d.kategori });
    return '<tr>' +
      '<td>'+badgeHtml+'</td>' +
      '<td style="text-align:center">'+d.trx+'</td>' +
      '<td style="text-align:center">'+d.qty+'</td>' +
      '<td><b style="color:var(--ok)">'+_fmtRp(d.omset)+'</b></td>' +
      '<td><div style="display:flex;align-items:center;gap:4px">'+
        '<div style="width:36px;background:var(--cream4);height:5px;border-radius:2px;overflow:hidden;border:1px solid var(--ink4)">'+
          '<div style="width:'+pct+'%;height:100%;background:'+colors[i%colors.length]+'"></div>'+
        '</div>'+
        '<span style="font-size:11px;color:var(--ink3)">'+pct+'%</span>'+
      '</div></td>' +
    '</tr>';
  });
  while (chRows.length < 5) chRows.push(EMPTY_ROW_CH);
  tbody.innerHTML = chRows.join('');

  // Donut chart channel — full wrapper size
  if (!canvas || totalOmset===0) return;
  const dpr = window.devicePixelRatio||1;
  const wrap = canvas.parentElement;
  const W = wrap ? (wrap.offsetWidth  || 260) : 260;
  const H = wrap ? (wrap.offsetHeight || 200) : 200;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const cx=W/2, cy=H/2, r=Math.min(cx,cy)-6, inner=r*0.64;
  let angle=-Math.PI/2;
  sorted.forEach(([,d],i) => {
    const slice=(d.omset/totalOmset)*Math.PI*2;
    if(slice<=0) return;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,angle,angle+slice);
    ctx.closePath();
    ctx.fillStyle=colors[i%colors.length]; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    angle+=slice;
  });
  ctx.beginPath(); ctx.arc(cx,cy,inner,0,Math.PI*2);
  ctx.fillStyle='#fff'; ctx.fill();
  const _fs = Math.max(11, Math.round(inner*0.34));
  ctx.fillStyle='#1c1a14'; ctx.font='bold '+_fs+'px sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(_fmtRpShort(totalOmset),cx,cy-_fs*0.35);
  ctx.font=Math.max(9,_fs-3)+'px sans-serif'; ctx.fillStyle='#8a8580';
  ctx.fillText(sorted.length+' channel',cx,cy+_fs*0.75);

  // Legend
  const legendEl = document.getElementById('dash-channel-legend');
  if (legendEl) {
    legendEl.innerHTML = sorted.map(([ch,d],i) => {
      const pct = totalOmset>0?(d.omset/totalOmset*100).toFixed(0):0;
      return '<div class="zd-leg-row">' +
        '<span class="zd-leg-dot" style="background:'+colors[i%colors.length]+'"></span>' +
        '<span class="zd-leg-name">'+ch+'</span>' +
        '<span class="zd-leg-pct" style="color:'+colors[i%colors.length]+'">'+pct+'%</span>' +
      '</div>';
    }).join('');
  }
}

// ─── GRAFIK OMSET PER KATALOG — BARU ─────────────────────────
function _renderKatalog(jpData, stokData) {
  const canvas = document.getElementById('dash-chart-katalog');
  if (!canvas) return;

  // Map sku → katalog
  const skuKatalogMap = {}, skuKatalogMapNorm = {};
  stokData.forEach(r => {
    if (r.sku_variasi && r.katalog) {
      skuKatalogMap[(r.sku_variasi||'').toUpperCase()] = r.katalog;
      skuKatalogMapNorm[_dashNormSku(r.sku_variasi)] = r.katalog;
    }
  });

  const katMap = {};
  jpData.forEach(r => {
    const skuU = (r.sku||'').toUpperCase();
    const kat  = skuKatalogMap[skuU] || skuKatalogMapNorm[_dashNormSku(skuU)] || 'Lainnya';
    if (!katMap[kat]) katMap[kat] = {qty:0,omset:0};
    katMap[kat].qty   += (Number(r.qty)||0);
    katMap[kat].omset += (Number(r.total)||0);
  });

  const sorted = Object.entries(katMap).sort((a,b)=>b[1].omset-a[1].omset).slice(0,8);
  const emptyEl = document.getElementById('dash-katalog-empty');

  if (!sorted.length) {
    if (emptyEl) emptyEl.style.display='flex';
    return;
  }
  if (emptyEl) emptyEl.style.display='none';

  const maxO   = sorted[0][1].omset;
  const colors = ['#2a6e3a','#2266cc','#c8a000','#b03020','#6b3fa0','#1a8a7a','#888','#c84080'];

  const dpr = window.devicePixelRatio||1;
  const W   = canvas.offsetWidth || 280;
  const H   = canvas.offsetHeight || 200;
  canvas.width = W*dpr; canvas.height = H*dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);

  const padL=4, padR=4, padT=4, padB=4;
  const rowH   = (H-padT-padB) / sorted.length;
  const trackW = W - padL - padR;
  const barH   = 7;
  const _rr = (x,y,w,h,r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x,y,w,h,r); else ctx.rect(x,y,w,h); ctx.fill(); };

  sorted.forEach(([kat,d],i) => {
    const y0  = padT + i*rowH;
    const pct = maxO>0 ? d.omset/maxO : 0;
    const bw  = Math.max(pct>0 ? 4 : 0, Math.round(pct * trackW));
    const barY = y0 + rowH - barH - 4;

    // Nama katalog (kiri atas) + nilai & qty (kanan atas)
    ctx.textBaseline = 'alphabetic';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1c1a14';
    ctx.fillText(kat, padL, barY - 5);
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(_fmtRpShort(d.omset), padL+trackW, barY - 5);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#8a8580';
    ctx.font = 'bold 11px sans-serif';
    const _w1 = ctx.measureText(_fmtRpShort(d.omset)).width;
    ctx.font = '10px sans-serif';
    ctx.fillText(d.qty+' pcs · ', padL+trackW-_w1, barY - 5);

    // Track + bar rounded
    ctx.fillStyle='rgba(28,26,20,0.07)';
    _rr(padL, barY, trackW, barH, barH/2);
    ctx.fillStyle=colors[i%colors.length];
    if (bw > 0) _rr(padL, barY, bw, barH, barH/2);
  });
}

// ─── DISTRIBUSI STATUS STOK — BARU ───────────────────────────
function _renderStokDist(stokData) {
  const el = document.getElementById('dash-stok-dist');
  if (!el) return;

  const aman   = stokData.filter(r => r.sisa > 8).length;
  const ati2   = stokData.filter(r => r.sisa > 3 && r.sisa <= 8).length;
  const kritis = stokData.filter(r => r.sisa > 0 && r.sisa <= 3).length;
  const habis  = stokData.filter(r => r.sisa <= 0).length;
  const total  = stokData.length;

  const pills = [
    { label:'Aman',   count: aman,   color: 'var(--ok)',     bg: 'rgba(42,110,58,0.1)' },
    { label:'Ati2',   count: ati2,   color: 'var(--warn)',   bg: 'rgba(200,160,0,0.1)' },
    { label:'Kritis', count: kritis, color: 'var(--danger)', bg: 'rgba(176,48,32,0.1)' },
    { label:'Habis',  count: habis,  color: 'var(--danger)', bg: 'rgba(176,48,32,0.18)' },
  ];

  el.innerHTML = pills.map(p =>
    '<span class="dist-pill" style="color:'+p.color+';background:'+p.bg+';border-color:'+p.color+';padding:2px 7px;font-size:10px">' +
      p.label + ' <b>' + p.count + '</b>' +
    '</span>'
  ).join('');
}

// ─── TURNOVER RATE STOK — BARU ───────────────────────────────
function _turnoverLabel(masuk, keluar) {
  if (!masuk || masuk <= 0) return '<span style="color:var(--ink4)">—</span>';
  const rate = keluar / masuk;
  if (rate >= 0.8) return '<span style="color:var(--ok);font-weight:700">🔥 Cepat</span>';
  if (rate >= 0.5) return '<span style="color:var(--warn);font-weight:700">⚡ Sedang</span>';
  if (rate >= 0.2) return '<span style="color:var(--ink3)">🐢 Lambat</span>';
  return '<span style="color:var(--ink4)">💤 Stagnan</span>';
}

// ─── RINGKASAN BEBAN OPERASIONAL — BARU ──────────────────────
function _renderBeban(bebanData, omsetBln) {
  const el    = document.getElementById('dash-beban-wrap');
  const elTot = document.getElementById('dash-beban-total');
  const elPct = document.getElementById('dash-beban-pct');
  if (!el) return;
  if (!bebanData || !bebanData.length) {
    if (elTot) elTot.textContent = 'Rp0';
    if (elPct) elPct.textContent = '—';
    el.innerHTML = '<div style="color:var(--ink3);font-style:italic;font-size:13px">Belum ada beban bulan ini. Catat via Kas &amp; Jurnal → pilih akun kelompok Beban.</div>';
    return;
  }

  let totalNominal = 0;
  const rows = bebanData.map(r => {
    const nominal = Number(r.nominal || r.jumlah || 0);
    totalNominal += nominal;
    return { nama: r.nama_beban || r.nama || '—', nominal };
  });

  const pctDariOmset = omsetBln>0 ? (totalNominal/omsetBln*100).toFixed(1) : null;

  // Update header
  if (elTot) elTot.textContent = _fmtRp(totalNominal);
  if (elPct) elPct.textContent = pctDariOmset ? pctDariOmset + '%' : '—';

  // Data box: nama kiri · [% dari total beban] [IDR] kanan. % = porsi kategori dari TOTAL beban
  // (jumlah semua baris = 100%). Header "x% dari omset" tetap, itu rasio beban terhadap omset.
  el.innerHTML = rows.map(r => {
    const pctBeban = totalNominal>0 ? (r.nominal/totalNominal*100) : 0;
    return '<div class="beban-row">' +
      '<span style="font-size:13px;font-weight:700">' + r.nama + '</span>' +
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<span style="font-size:13px;font-weight:700;color:var(--ink3);text-align:right;min-width:52px;font-variant-numeric:tabular-nums">' + pctBeban.toFixed(1) + '%</span>' +
        '<span style="font-size:13px;font-weight:700;color:var(--danger);font-variant-numeric:tabular-nums">' + _fmtRp(r.nominal) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ─── AKTIVITAS FEED ───────────────────────────────────────────
function _renderIncome(jurnalBulan, akunMap, todayYM) {
  const el     = document.getElementById('dash-income-wrap');
  const lbl    = document.getElementById('dash-income-bulan');
  const elTot  = document.getElementById('dash-income-total');
  const elFcf  = document.getElementById('dash-fcf-val');
  if (!el) return;

  // Label bulan
  if (lbl) {
    const bln = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const [y, m] = (todayYM || '').split('-');
    lbl.textContent = (bln[parseInt(m,10)-1] || '') + ' ' + (y || '');
  }

  // Hitung FCF (Cash from Ops, tanpa Capex)
  let cashOps = 0;
  (jurnalBulan || []).forEach(r => {
    const aD = akunMap[r.akun_debit_id];
    const aK = akunMap[r.akun_kredit_id];
    const isKasD = aD && aD.kelompok === 'aset' && (aD.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
    const isKasK = aK && aK.kelompok === 'aset' && (aK.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
    if (isKasD) cashOps += Number(r.nominal || r.debit  || 0);
    if (isKasK) cashOps -= Number(r.nominal || r.kredit || 0);
  });
  if (elFcf) {
    const fcfColor = cashOps >= 0 ? 'var(--ok)' : 'var(--danger)';
    elFcf.style.color = fcfColor;
    elFcf.textContent = (cashOps>=0?'+':'\u2212') + _fmtRp(Math.abs(cashOps));
  }

  // Filter: akun kredit kelompok pendapatan
  const incomeMap = {};
  (jurnalBulan || []).forEach(r => {
    const akun = akunMap && akunMap[r.akun_kredit_id];
    if (!akun) return;
    if (akun.kelompok !== 'pendapatan') return;
    const nama = (akun.kode ? akun.kode + ' · ' : '') + akun.nama;
    incomeMap[nama] = (incomeMap[nama] || 0) + (r.nominal || r.kredit || 0);
  });

  const rows = Object.entries(incomeMap).sort((a,b) => b[1]-a[1]);
  const total = rows.reduce((s,[,v]) => s+v, 0);

  // Update header total
  if (elTot) { elTot.textContent = _fmtRp(total); }

  if (!rows.length) {
    el.innerHTML = '<div style="color:var(--ink3);font-style:italic;font-size:13px">Belum ada income bulan ini</div>';
    return;
  }

  // Data box: hanya rows detail, tanpa total row
  // Rasio tiap income terhadap total income (jumlah semua baris = 100%)
  el.innerHTML = rows.map(([nama, val]) => {
    const pct = total>0 ? (val/total*100) : 0;
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px dashed var(--ovl-0_07);font-size:15px">' +
      '<span style="color:var(--ink2);font-weight:700">' + nama + '</span>' +
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<span style="font-size:13px;font-weight:700;color:var(--ink3);text-align:right;min-width:52px;font-variant-numeric:tabular-nums">' + pct.toFixed(1) + '%</span>' +
        '<span style="color:var(--ok);font-weight:700">' + _fmtRp(val) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

function _renderAktivitas(jpData, jurnalData) {
  const feed = document.getElementById('dash-aktivitas-feed');
  if (!feed) return;
  const items = [];
  (jpData || []).forEach(r => {
    const ch = _dashChannelMap[r.channel_id];
    items.push({
      type:'sell',
      text:'Jual <b>'+(r.sku||'?')+'</b> ×'+(r.qty||0)+' — '+_fmtRp(r.total),
      sub: (ch?ch.nama+' · ':'')+_fmtTgl(r.tanggal),
      ts:  r.created_at||r.tanggal
    });
  });
  (jurnalData || []).forEach(r => {
    items.push({
      type:'kas',
      text: r.keterangan||'Transaksi kas',
      sub:  (r.debit?'+ '+_fmtRp(r.debit):'− '+_fmtRp(r.kredit))+' · '+_fmtTgl(r.tanggal),
      ts:   r.created_at||r.tanggal
    });
  });
  items.sort((a,b) => {
    const ta=a.ts?new Date(a.ts).getTime():0, tb=b.ts?new Date(b.ts).getTime():0;
    return tb-ta;
  });
  if (!items.length) {
    feed.innerHTML='<div style="color:var(--ink3);font-style:italic;font-size:13px">Belum ada aktivitas hari ini</div>';
    return;
  }
  // Max 5 baris
  feed.innerHTML = items.slice(0,5).map(item =>
    '<div class="dash-feed-item">' +
      '<div class="dash-feed-dot '+item.type+'"></div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:12px;color:var(--ink);line-height:1.4">'+item.text+'</div>' +
        '<div class="dash-feed-time">'+item.sub+' · '+_fmtAgo(item.ts)+'</div>' +
      '</div>' +
    '</div>'
  ).join('');
}

// ─── MAIN LOAD ────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const today    = _localDateStr(); // FIX: WIB bukan UTC
    const todayYM  = today.slice(0,7);

    const _dsSupMap = await zDsLoadSuppliers();   // status dropship per produk (supabase.js)
    const [produkData, stokRaw, jurnalData, _jpData30, jurnalAllData, channelData, _unused, kasAkunRaw, jpAllTime, jurnalBulanIni, jpHariIniRaw, supplierRaw] = await Promise.all([
      dbGet('produk', '&order=katalog.asc,sku_variasi.asc'),
      dbGet('stok'),
      dbGet('jurnal', '&order=created_at.desc&limit=8'),
      dbGet('jurnal_penjualan', '&tanggal=gte.' + _localDateOffset(30) + '&order=tanggal.desc'),
      dbGet('jurnal'),
      dbGet('channels').catch(() => []),
      dbGet('jurnal', '&order=tanggal.desc').catch(() => []),
      dbGet('kas_akun', '').catch(() => []),
      dbGet('jurnal_penjualan', '&select=sku,qty&or=(order_status.neq.CANCELLED,order_status.is.null)').catch(() => []),
      dbGet('jurnal', '&tanggal=gte.' + todayYM + '-01&order=tanggal.desc').catch(() => []),
      dbGet('jurnal_penjualan', '&tanggal=gte.' + today + '&order=created_at.desc').catch(() => []),
      dbGet('restock_supplier').catch(() => [])
    ]);
    const jpHariIniSell = jpHariIniRaw || [];
    // jpData & jpChart30 sama-sama 30 hari — satu fetch, reuse keduanya
    const jpData    = _jpData30 || [];
    const jpChart30 = _jpData30 || [];

    // ─ Build kas akun map (dipakai untuk saldo KAS & BANK + beban di bawah)
    const _dashKasAkunMap = {};
    (kasAkunRaw || []).forEach(a => { _dashKasAkunMap[a.id] = a; });
    // Expose ke window untuk networth.js
    window._dashKasAkunMap    = _dashKasAkunMap;
    window._dashJurnalAllData = jurnalAllData || [];

    const stokMasukMap = {};
    (stokRaw || []).forEach(s => {
      const key = (s.sku_variasi || '').toUpperCase();
      if (key) stokMasukMap[key] = { id: s.id, qty: s.stok_masuk || 0 };
    });

    // keluarMap HARUS all-time (bukan 30hr) agar sisa stok & nilai stok akurat
    const keluarMap = {};
    (jpAllTime || []).forEach(j => {
      const key = (j.sku || '').toUpperCase();
      if (key) keluarMap[key] = (keluarMap[key] || 0) + (j.qty || 0);
    });

    // Build sales30Map dari _jpData30 (reuse, no extra fetch)
    // Filter CANCELLED sama seperti stok.js
    const _sales30Map = {};
    (_jpData30 || []).forEach(j => {
      if ((j.order_status || '') === 'CANCELLED') return;
      const key = (j.sku || '').toUpperCase();
      if (key) _sales30Map[key] = (_sales30Map[key] || 0) + (j.qty || 0);
    });

    // Build supplier lead_time map: boss (uppercase) → lead_time (hari)
    const _supplierLeadMap = {};
    (supplierRaw || []).forEach(s => {
      if (s.boss) _supplierLeadMap[(s.boss || '').toUpperCase()] = Number(s.lead_time) || 7;
    });

    _dashStokData = (produkData || []).map(p => {
      const skuKey = (p.sku_variasi || '').toUpperCase();
      const masuk  = stokMasukMap[skuKey] ? stokMasukMap[skuKey].qty : 0;
      const keluar = keluarMap[skuKey] || 0;
      const sisa   = masuk - keluar;
      const sales30 = _sales30Map[skuKey] || 0;
      return {
        dropship:        zIsDropship(p, _dsSupMap, masuk),   // dropship = tidak nyetok → bukan kritis / bukan restock
        sku_variasi:     p.sku_variasi,
        katalog:         p.katalog,
        boss:            p.boss,
        hpp:             p.hpp || 0,
        kategori_produk: p.kategori_produk || 'aktif',
        stok_masuk:      masuk,
        stok_keluar:     keluar,
        sisa,
        sales30,
        nilai_stok:      sisa > 0 ? sisa * (p.hpp || 0) : 0
      };
    });

    _dashJPData   = jpData || [];
    _trenchJPData = jpChart30 || _dashJPData; // chart default 30 hari terakhir
    _dashChannelMap = {};
    (channelData||[]).forEach(ch => { _dashChannelMap[ch.id] = ch; });

    // ─ Metric 1-4
    // ─ Logika SKU Kritis: Fast velocity + hari sisa stok ≤ lead time supplier
    // avg30 = rata penjualan harian 30hr (lebih stabil dari 7hr)
    // hari_sisa = sisa / avg30 — berapa hari stok akan bertahan
    // lead_time: dari tabel restock_supplier match by boss, fallback 7 hari
    // PERLU RESTOCK jika: aktif AND fast AND (habis OR hari_sisa ≤ lead_time)
    const kritis = _dashStokData.filter(r => {
      if ((r.kategori_produk || 'aktif') !== 'aktif') return false;
      if (r.dropship) return false;   // dropship tidak disetok → tidak pernah "kritis"
      const isFast = (r.sales30 || 0) > 0; // fast = ada penjualan 30hr terakhir
      if (!isFast) return false;
      const leadTime = _supplierLeadMap[(r.boss || '').toUpperCase()] || 7;
      if (r.sisa <= 0) return true; // habis = selalu kritis kalau fast
      const avg30    = (r.sales30 || 0) / 30;
      const hariSisa = avg30 > 0 ? r.sisa / avg30 : Infinity;
      return hariSisa <= leadTime;
    }).length;
    const nilaiStok = _dashStokData.reduce((s,r) => s + (r.nilai_stok || 0), 0);
    // ─ Saldo KAS: hanya akun sub_kelompok 'KAS & BANK' — debit masuk, kredit keluar
    // Saldo KAS — sama persis dengan kas.js kasUpdateSummary:
    // masuk = nominal/debit saat akun KAS & BANK di posisi debit
    // keluar = nominal/kredit saat akun KAS & BANK di posisi kredit
    let _kasMasuk = 0, _kasKeluar = 0;
    (jurnalAllData || []).forEach(r => {
      const aD = _dashKasAkunMap[r.akun_debit_id];
      const aK = _dashKasAkunMap[r.akun_kredit_id];
      const isKasD = aD && aD.kelompok === 'aset' && (aD.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
      const isKasK = aK && aK.kelompok === 'aset' && (aK.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
      if (isKasD) _kasMasuk  += Number(r.nominal || r.debit  || 0);
      if (isKasK) _kasKeluar += Number(r.nominal || r.kredit || 0);
    });
    const saldo = _kasMasuk - _kasKeluar;

    document.getElementById('d-sku').textContent       = _dashStokData.length;
    document.getElementById('d-kritis').textContent    = kritis + ' sku' + (kritis>0?'!':'');
    document.getElementById('d-kritis').style.color    = kritis>0?'var(--danger)':'var(--ok)';
    document.getElementById('d-nilaiStok').textContent = _fmtRp(nilaiStok);
    document.getElementById('d-saldo').textContent     = (saldo>=0?'+':'')+_fmtRp(Math.abs(saldo));
    document.getElementById('d-saldo').style.color     = saldo>=0?'var(--ok)':'var(--danger)';

    // ─ Cash Flow bulan ini (masuk - keluar dari akun KAS & BANK, bulan berjalan)
    const cfMasuk = (jurnalAllData||[]).filter(r => {
      const aD = _dashKasAkunMap[r.akun_debit_id];
      return aD && aD.kelompok==='aset' && (aD.sub_kelompok||'').trim().toUpperCase()==='KAS & BANK'
          && String(r.tanggal||'').slice(0,7)===todayYM;
    }).reduce((s,r)=>s+(Number(r.nominal||r.debit)||0),0);
    const cfKeluar = (jurnalAllData||[]).filter(r => {
      const aK = _dashKasAkunMap[r.akun_kredit_id];
      return aK && aK.kelompok==='aset' && (aK.sub_kelompok||'').trim().toUpperCase()==='KAS & BANK'
          && String(r.tanggal||'').slice(0,7)===todayYM;
    }).reduce((s,r)=>s+(Number(r.nominal||r.kredit)||0),0);
    const cf = cfMasuk - cfKeluar;
    const elCf = document.getElementById('d-cashflow');
    const elCfDelta = document.getElementById('d-cashflow-delta');
    if (elCf) {
      elCf.textContent = (cf>0?'+':cf<0?'-':'') + _fmtRp(Math.abs(cf));
      elCf.style.color = cf>0?'var(--ok)':cf<0?'var(--danger)':'var(--ink2)';
    }

    // ─ Trigger Net Worth update (networth.js)
    if (typeof nwUpdate === 'function') nwUpdate();

    // ─ Metric 5-8
    const jpBulan   = _dashJPData.filter(r => r.tanggal && String(r.tanggal).slice(0,7) === todayYM);
    const jpHariIni = _dashJPData.filter(r => r.tanggal && String(r.tanggal).slice(0,10) === today);
    const omsetBln  = jpBulan.reduce((s,r)=>s+(Number(r.total)||0),0);
    const omsetHari = jpHariIni.reduce((s,r)=>s+(Number(r.total)||0),0);
    const aov       = jpBulan.length>0 ? Math.round(omsetBln/jpBulan.length) : 0;

    // Avg Beban/Hari = weighted (beban% + npm%) per channel × omset bulan ini / hari berjalan
    const dayOfMonth = Math.max(1, Number(today.slice(8,10)) || 1);
    try {
      const chBebanRows = await dbGet('channel_beban', '').catch(() => []);
      const chBebanMap  = {};
      (chBebanRows || []).forEach(b => {
        chBebanMap[b.channel_id] = (Number(b.beban_persen||0) + Number(b.npm_persen||0)) / 100;
      });
      // weighted: tiap transaksi punya channel_id → ambil pct-nya, kalikan total
      let totalBebanEst = 0;
      jpBulan.forEach(r => {
        const pct = chBebanMap[r.channel_id] || 0;
        totalBebanEst += (Number(r.total)||0) * pct;
      });
      // fallback: kalau tidak ada channel match, rata-rata semua channel
      if (totalBebanEst === 0 && omsetBln > 0 && chBebanRows && chBebanRows.length) {
        const avgPct = chBebanRows.reduce((s,b) => s + Number(b.beban_persen||0) + Number(b.npm_persen||0), 0) / chBebanRows.length / 100;
        totalBebanEst = omsetBln * avgPct;
      }
      const avgBebanHari = totalBebanEst / dayOfMonth;
      if (elCfDelta) elCfDelta.textContent = 'Avg beban/hari: ' + _fmtRp(Math.round(avgBebanHari));
    } catch(e) {
      if (elCfDelta) elCfDelta.textContent = 'bulan ini';
    }

    document.getElementById('d-omset').textContent = _fmtRp(omsetBln);
    const omsetDeltaEl = document.getElementById('d-omset-delta');
    if (omsetDeltaEl) omsetDeltaEl.textContent = 'dari jurnal penjualan';

    const qtyHariIni = jpHariIni.reduce((s,r) => s + (Number(r.qty)||0), 0);
    const elQty  = document.getElementById('d-order-qty');
    const elOmHr = document.getElementById('d-order-omset');
    const elDelta = document.getElementById('d-order-hari-delta');
    if (elQty)   elQty.textContent  = qtyHariIni || '0';
    if (elOmHr)  elOmHr.textContent = omsetHari>0 ? _fmtRp(omsetHari) : 'Rp0';
    if (elDelta) elDelta.textContent = jpHariIni.length + ' transaksi hari ini';
    const elOmsetAbu = document.getElementById('d-omset-abu');
    if (elOmsetAbu) elOmsetAbu.textContent = _fmtRp(omsetBln);

    // ─ AOV — BARU
    const elAov = document.getElementById('d-aov');
    if (elAov) {
      elAov.textContent = aov>0 ? _fmtRp(aov) : '—';
    }

    // ─ HPP terjual & Laba Kotor — BARU
    const hppMap = {};
    _dashStokData.forEach(r => { hppMap[(r.sku_variasi||'').toUpperCase()] = r.hpp||0; });
    // [30 Sep 2026] HPP per transaksi: pakai jurnal_penjualan.hpp (dibekukan saat transaksi) supaya mengganti HPP produk
    // (mis. dropship → produksi sendiri) tidak menggeser laba bulan lalu. Baris tanpa hpp → jatuh balik ke HPP produk sekarang.
    const totalHppTerjual = jpBulan.reduce((s,r) => {
      const hpp = (r.hpp != null && r.hpp !== '') ? (Number(r.hpp) || 0) : (hppMap[(r.sku||'').toUpperCase()] || 0);
      return s + hpp * (Number(r.qty)||0);
    }, 0);
    const labaKotor = omsetBln - totalHppTerjual;
    const elLaba    = document.getElementById('d-laba');
    const elLabaDelta = document.getElementById('d-laba-delta');
    if (elLaba) {
      elLaba.textContent = _fmtRp(labaKotor);
      elLaba.style.color = labaKotor >= 0 ? 'var(--ok)' : 'var(--danger)';
    }
    if (elLabaDelta) {
      const marjin = omsetBln>0 ? (labaKotor/omsetBln*100).toFixed(1) : 0;
      elLabaDelta.textContent = 'marjin ' + marjin + '%';
    }

    // ─ Beban & Laba Bersih ─────────────────────────────────────
    // kasAkunMap sudah tersedia dari Promise.all di atas (_dashKasAkunMap)
    const bulanIniStr = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const kasAkunMap  = _dashKasAkunMap; // reuse, tidak perlu fetch ulang

    // Hitung realisasi aktual dari jurnal (untuk teks kecil saja)
    const kasJurnalBulanIni = (jurnalAllData||[]).filter(j => (j.tanggal||'').slice(0,7) === bulanIniStr);
    let totalBebanRealisasi = 0;
    const bebanDetailMap = {};
    const _SKIP_SUB = ['HPP', 'Beban Produksi'];
    kasJurnalBulanIni.forEach(j => {
      const akunDebit = kasAkunMap[j.akun_debit_id];
      if (akunDebit && akunDebit.kelompok === 'beban' &&
          !_SKIP_SUB.includes(akunDebit.sub_kelompok)) {
        const nominal = Number(j.nominal || j.debit || 0);
        totalBebanRealisasi += nominal;
        const nama = akunDebit.nama || 'Beban';
        bebanDetailMap[nama] = (bebanDetailMap[nama] || 0) + nominal;
      }
    });

    // ── BARU: Beban Operasional = Total Anggaran dari kas_anggaran bulan ini ──
    const anggaranBulanIni = await dbGet('kas_anggaran', '&bulan=eq.' + bulanIniStr).catch(() => []);
    let totalAnggaran = 0;
    (anggaranBulanIni || []).forEach(a => { totalAnggaran += Number(a.nominal || 0); });
    // Fallback: kalau bulan ini belum ada anggaran, ambil bulan terakhir yang ada
    if (!totalAnggaran) {
      const anggaranAll = await dbGet('kas_anggaran', '&order=bulan.desc').catch(() => []);
      if (anggaranAll && anggaranAll.length) {
        const bulanTerakhir = anggaranAll[0].bulan;
        anggaranAll.filter(a => a.bulan === bulanTerakhir).forEach(a => { totalAnggaran += Number(a.nominal || 0); });
      }
    }
    // Gunakan anggaran sebagai angka beban utama; fallback ke realisasi jika anggaran 0
    const totalBebanNominal = totalAnggaran || totalBebanRealisasi;

    // ── BARU: Rasio % = rata-rata beban_persen channel Shopee ──
    let rasioBebanShopee = 0;
    try {
      const shopeeChannels = await dbGet('channels', '&kategori=eq.toko_utama').catch(() => []);
      const shopeeIds = (shopeeChannels || []).map(c => c.id);
      if (shopeeIds.length) {
        const bebanData = await dbGet('channel_beban', '').catch(() => []);
        const shopeeBeban = (bebanData || []).filter(b => shopeeIds.includes(b.channel_id));
        if (shopeeBeban.length) {
          const sumPct = shopeeBeban.reduce((s, b) => s + Number(b.beban_persen || 0), 0);
          rasioBebanShopee = sumPct / shopeeBeban.length;
        }
      }
    } catch(e) { rasioBebanShopee = 0; }

    const elBeban = document.getElementById('d-beban');
    const elBebanDelta = document.getElementById('d-beban-delta');
    const elBebanReal  = document.getElementById('d-beban-realisasi');
    if (elBeban) {
      elBeban.textContent = totalBebanNominal > 0 ? _fmtRp(totalBebanNominal) : '—';
      elBeban.style.color = 'var(--danger)';
    }
    if (elBebanDelta) {
      elBebanDelta.textContent = rasioBebanShopee > 0
        ? rasioBebanShopee.toFixed(1) + '% dari omset'
        : (totalBebanNominal > 0 && omsetBln > 0
            ? (totalBebanNominal / omsetBln * 100).toFixed(1) + '% dari omset'
            : 'anggaran bulan ini');
    }
    if (elBebanReal) {
      elBebanReal.textContent = totalBebanRealisasi > 0
        ? 'realisasi: ' + _fmtRp(totalBebanRealisasi)
        : '';
    }

    // ── Update label Beban vs Kas dari data arus kas ──
    _dashUpdateBebanVsKas(totalBebanNominal);
    _renderKegiatanMendatang(); // BARU v5

    // ── BARU: Target Omset = Total Anggaran ÷ rasio Shopee (auto, tanpa set manual) ──
    const targetOtomatis = (totalAnggaran > 0 && rasioBebanShopee > 0)
      ? Math.round(totalAnggaran / (rasioBebanShopee / 100))
      : _getTarget(); // fallback ke localStorage kalau data belum ada

    const labaBersih = labaKotor - totalBebanNominal;
    const elLabaBersih = document.getElementById('d-laba-bersih');
    if (elLabaBersih) {
      elLabaBersih.textContent = omsetBln>0 ? _fmtRp(labaBersih) : '—';
      elLabaBersih.style.color = labaBersih>=0 ? 'var(--ok)' : 'var(--danger)';
    }

    // ─ Target Omset — otomatis dari Total Anggaran ÷ rasio Shopee
    const target = targetOtomatis;

    const targetEl = document.getElementById('d-target');
    if (targetEl) targetEl.textContent = target>0 ? _fmtRp(target) : '—';
    if (target>0) {
      const omsetNum = Number(omsetBln) || 0;
      const pct      = Math.min(omsetNum/target*100, 100).toFixed(1);
      const barWrap  = document.getElementById('d-target-bar-wrap');
      const bar      = document.getElementById('d-target-bar');
      const pctEl    = document.getElementById('d-target-pct');
      if (barWrap) barWrap.style.display = 'block';
      if (bar)     { bar.style.width = pct+'%'; bar.style.background = pct>=100?'var(--ok)':pct>=60?'var(--warn)':'var(--danger)'; }
      if (pctEl)   pctEl.textContent = pct+'% tercapai';
    }

    const hariDlmBulan  = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
    const targetHarian  = target>0 ? Math.round(target / hariDlmBulan) : 0;
    const thEl          = document.getElementById('d-target-harian');
    if (thEl) thEl.textContent = targetHarian>0 ? _fmtRp(targetHarian) : '—';
    if (targetHarian>0) {
      const pctH     = Math.min((Number(omsetHari)||0) / targetHarian * 100, 100).toFixed(1);
      const bwH      = document.getElementById('d-target-harian-bar-wrap');
      const barH     = document.getElementById('d-target-harian-bar');
      const pctHEl   = document.getElementById('d-target-harian-pct');
      if (bwH)   bwH.style.display = 'block';
      if (barH)  { barH.style.width = pctH+'%'; barH.style.background = pctH>=100?'var(--ok)':pctH>=60?'var(--warn)':'var(--danger)'; }
      if (pctHEl) pctHEl.textContent = _fmtRp(omsetHari)+' · '+pctH+'% tercapai';
    }

    // ─ Visual 8 minicard (presentasi saja, pakai angka yang sudah dihitung di atas)
    window._zdMetricData = {
      omsetBln: omsetBln, target: target, hpp: totalHppTerjual, beban: totalBebanNominal,
      labaBersih: labaBersih, cfMasuk: cfMasuk, cfKeluar: cfKeluar,
      kasMasuk: _kasMasuk, kasKeluar: _kasKeluar,
      trxHariIni: jpHariIni.length, aov: aov,
      skuTotal: _dashStokData.length,
      pcsTotal: _dashStokData.reduce(function(a, r) { return a + (r.dropship ? 0 : (Number(r.sisa) || 0)); }, 0),
      kritis: kritis, saldo: saldo, omsetHari: Number(omsetHari) || 0, targetHarian: targetHarian || 0,
      habis: _dashStokData.filter(function(r) { return (r.kategori_produk || 'aktif') === 'aktif' && !r.dropship && (r.sales30 || 0) > 0 && r.sisa <= 0; }).length
    };
    _zdRenderMetricViz(window._zdMetricData);

    // ─ Alerts
    _renderAlerts(_dashStokData, saldo);

    // ─ Distribusi Status Stok — BARU
    _renderStokDist(_dashStokData.filter(function(r) { return !r.dropship; }));   // dropship tidak ikut sebaran stok

    // ─ Tabel stok: ROP + Turnover + REORDER — DIUPDATE
    // Selalu 5 baris, urutan prioritas Habis → Kritis → Ati2 → Aman
    const LEAD_TIME      = 7; // hari pesan ke supplier
    const SAFETY_DAYS    = 2; // buffer hari penjualan

    // Hitung terjual 7 hari terakhir per SKU
    const _batas7 = _localDateOffset(7); // FIX: WIB bukan UTC
    const _sold7Map = {};
    _dashJPData
      .filter(r => r.tanggal && String(r.tanggal).slice(0,10) >= _batas7)
      .forEach(r => {
        const k = (r.sku||'').toUpperCase();
        _sold7Map[k] = (_sold7Map[k] || 0) + (Number(r.qty)||0);
      });

    const _sortByPriority = (a, b) => {
      const pri = r => r.sisa <= 0 ? 0 : r.sisa <= 3 ? 1 : r.sisa <= 8 ? 2 : 3;
      return pri(a) !== pri(b) ? pri(a) - pri(b) : a.sisa - b.sisa;
    };
    const stokSorted = [..._dashStokData]
      .filter(r => (r.kategori_produk || 'aktif') === 'aktif' && !r.dropship)
      .sort(_sortByPriority);
    const stokTampil = stokSorted.slice(0, 5);
    const EMPTY_ROW  = '<tr><td colspan="7" style="color:var(--ink4);text-align:center">—</td></tr>';

    const stokSum = document.getElementById('dash-stok-summary');
    if (stokSum) stokSum.textContent = _dashStokData.length+' SKU';

    const stokRows = stokTampil.map(r => {
      const skuKey     = (r.sku_variasi||'').toUpperCase();
      const sold7      = _sold7Map[skuKey] || 0;
      const avgPerHari = sold7 / 7;
      const safety     = Math.ceil(avgPerHari * SAFETY_DAYS);
      const rop        = Math.ceil(avgPerHari * LEAD_TIME) + safety;
      const isReorder  = sold7 > 0 && r.sisa <= rop;

      const sold7Cell = sold7 > 0
        ? '<span style="color:var(--ok);font-weight:700">'+sold7+'×</span>'
        : '<span style="color:var(--ink4)">—</span>';
      const ropCell = sold7 > 0
        ? '<span style="font-weight:700;color:'+(isReorder?'var(--danger)':'var(--ink3)')+'">'+rop+'</span>'
        : '<span style="color:var(--ink4)">—</span>';
      const statusCell = isReorder
        ? '<span style="color:var(--danger);font-weight:700;white-space:nowrap">🔴 REORDER!</span>'
        : statusBadgeDash(r.sisa);

      return '<tr>' +
        '<td><b>'+r.sku_variasi+'</b></td>' +
        '<td>'+(r.boss||'—')+'</td>' +
        '<td><b><span style="color:'+(r.sisa<=0?'var(--danger)':r.sisa<=3?'var(--danger)':'var(--warn)')+'">'+r.sisa+'</span></b></td>'+
        '<td>'+sold7Cell+'</td>'+
        '<td>'+_turnoverLabel(r.stok_masuk, r.stok_keluar)+'</td>'+
        '<td>'+ropCell+'</td>'+
        '<td>'+statusCell+'</td>'+
      '</tr>';
    });
    // Pad to always 5 rows
    while (stokRows.length < 5) stokRows.push(EMPTY_ROW);
    document.getElementById('dash-stok-tbody').innerHTML = stokRows.join('');

    const jurnalRecent = (jurnalData||[]).slice(0,5);
    document.getElementById('dash-jurnal-tbody').innerHTML = jurnalRecent.length===0
      ? '<tr><td colspan="3" style="color:var(--ink3);font-style:italic">Belum ada jurnal</td></tr>'
      : jurnalRecent.map(r => {
      const aD = window._dashKasAkunMap && window._dashKasAkunMap[r.akun_debit_id];
      const aK = window._dashKasAkunMap && window._dashKasAkunMap[r.akun_kredit_id];
      const isMasuk = r.tipe === 'masuk';
      const isKeluar = r.tipe === 'keluar';
      // Masuk → tampilkan akun kredit (sumber pendapatan), Keluar → akun debit (tujuan beban)
      const akun = isMasuk
        ? (aK ? (aK.kode ? aK.kode+' '+aK.nama : aK.nama) : '—')
        : (aD ? (aD.kode ? aD.kode+' '+aD.nama : aD.nama) : '—');
      const idr = r.nominal || r.debit || r.kredit || 0;
      const warna = isMasuk ? 'var(--ok)' : isKeluar ? 'var(--danger)' : 'var(--ink2)';
      const prefix = isMasuk ? '+' : isKeluar ? '−' : '';
      return '<tr>' +
        '<td style="white-space:nowrap;font-size:11px">'+_fmtTgl(r.tanggal||r.created_at)+'</td>' +
        '<td style="font-size:11px;color:var(--ink2)">'+akun+'</td>' +
        '<td style="color:'+warna+';font-weight:700;white-space:nowrap;font-size:12px">'+prefix+_fmtRp(idr)+'</td>' +
      '</tr>';
    }).join('');

    // ─ Render semua chart & widget
    const _jpForRender = jpBulan.length>0 ? jpBulan : _dashJPData;
    const _stokForBoss = _dashStokData;
    setTimeout(() => {
      _trenchRenderChart();
      trenchUpdateBadge();
      _renderTopSku(_jpForRender);
      _renderBoss(_jpForRender, _stokForBoss);
      _renderChannel(_jpForRender);           // BARU
      _renderKatalog(_jpForRender, _dashStokData); // BARU
      _renderBeban(Object.entries(bebanDetailMap).map(([nama,nominal])=>({nama_beban:nama,nominal})), omsetBln);
      _renderIncome(jurnalBulanIni || [], _dashKasAkunMap, todayYM);
      _renderDonutLabaRugi(totalHppTerjual, totalBebanNominal, labaBersih); // BARU v5
      _renderDonutBeban(bebanDetailMap);                                    // BARU v5
      if (typeof rerenderUI === "function") rerenderUI(document.getElementById("page-dashboard"));
    }, 300); // FIX: dinaikkan agar canvas punya offsetWidth saat dirender

    // ─ Aktivitas feed — hari ini saja, max 5
    _renderAktivitas(jpHariIniSell, (jurnalData||[]).filter(r => (r.tanggal||'').startsWith(today)));

    // ─ Kecepatan Kas (badge + tracker batch + kewajiban supplier) — read-only, tidak di-await
    if (typeof zdKasRender === 'function') zdKasRender();

    // ─ Timestamp
    const tsEl = document.getElementById('dash-last-refresh');
    if (tsEl) tsEl.textContent = 'Terakhir diperbarui: '+new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});

  } catch(err) {
    const wrap = document.getElementById('dash-alerts-wrap');
    if (wrap) wrap.innerHTML = '<div class="dash-alert-item danger"><i class="ti ti-wifi-off" style="color:var(--danger)"></i><span>Gagal memuat data: '+err.message+'. Periksa koneksi internet.</span></div>';
    console.error('[dashboard] error:', err);
  }
  // Init swipe pairs setelah render selesai
  setTimeout(function() { if (typeof dbSwipeInit === 'function') dbSwipeInit(); }, 100);
}

loadDashboard();

// ─── AUTO-RELOAD SAAT NAVIGASI KE HALAMAN INI ────────────────
// Debounce 400ms: cegah double-fire jika menu diklik cepat
(function() {
  var _t = null;
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'dashboard') return;
    clearTimeout(_t);
    _t = setTimeout(function() {
      loadDashboard();
      setTimeout(function() { if (typeof dbSwipeInit === 'function') dbSwipeInit(); }, 500);
    }, 400);
  });
})();

// ─── BEBAN VS KAS — update metric card dari data arus kas ────
// ═══════════════════════════════════════════════════════════
// DASHBOARD REDESIGN v5 (27 Sep 2026) — donut Laba/Rugi & Beban
// Perusahaan + widget Kegiatan Mendatang, adopsi tampilan Accurate.
// Pola gambar donut sama persis dengan _renderBoss (canvas pie
// pakai hex warna langsung, BUKAN CSS var — var() tidak di-resolve
// oleh canvas 2D context).
// ═══════════════════════════════════════════════════════════
function _renderDonutLabaRugi(hpp, bebanOps, labaBersih) {
  const canvas = document.getElementById('dash-donut-labarugi');
  if (!canvas) return;
  const parts = [
    ['HPP',               Math.max(hpp||0, 0),      '#E8862E'],
    ['Beban Operasional', Math.max(bebanOps||0, 0), '#E0524F'],
    ['Laba Bersih',       Math.max(labaBersih||0,0),'#1EA672']
  ];
  const total = parts.reduce((s,p)=>s+p[1], 0);
  const dpr  = window.devicePixelRatio || 1;
  const wrap = canvas.parentElement;
  const W = wrap ? (wrap.offsetWidth  || 130) : 130;
  const H = wrap ? (wrap.offsetHeight || 130) : 130;
  canvas.width  = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  const cx = W/2, cy = H/2, r = Math.min(cx,cy) - 4, inner = r * 0.62;
  if (total <= 0) {
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle = '#E8E6E0'; ctx.fill();
  } else {
    let angle = -Math.PI/2;
    parts.forEach(([,val,color]) => {
      if (val <= 0) return;
      const slice = (val/total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,angle,angle+slice);
      ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
      angle += slice;
    });
  }
  ctx.beginPath(); ctx.arc(cx,cy,inner,0,Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill();

  const centerEl = document.getElementById('dash-donut-labarugi-center');
  if (centerEl) {
    centerEl.innerHTML = '<b style="color:'+((labaBersih||0)>=0?'#1EA672':'#E0524F')+'">'+_fmtRpShort(labaBersih||0)+'</b><span>Laba Bersih</span>';
  }
  const legendEl = document.getElementById('dash-donut-labarugi-legend');
  if (legendEl) {
    legendEl.innerHTML = parts.map(([label,val,color]) => {
      const pct = total>0 ? (val/total*100).toFixed(0) : 0;
      return '<div class="dash-donut-leg-row">' +
        '<span class="dash-donut-dot" style="background:'+color+'"></span>' +
        '<span class="dash-donut-leg-label">'+label+'</span>' +
        '<span class="dash-donut-leg-val" style="color:'+color+'">'+pct+'%</span>' +
      '</div>';
    }).join('');
  }
}

function _renderDonutBeban(bebanDetailMap) {
  const canvas = document.getElementById('dash-donut-beban');
  if (!canvas) return;
  const colors = ['#E0524F','#E8862E','#8B5CF6','#2F6FED','#0EA5A5','#C9971F','#6B7280'];
  const sorted = Object.entries(bebanDetailMap || {}).sort((a,b)=>b[1]-a[1]);
  const total  = sorted.reduce((s,[,v])=>s+v, 0);
  const dpr  = window.devicePixelRatio || 1;
  const wrap = canvas.parentElement;
  const W = wrap ? (wrap.offsetWidth  || 130) : 130;
  const H = wrap ? (wrap.offsetHeight || 130) : 130;
  canvas.width  = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  const cx = W/2, cy = H/2, r = Math.min(cx,cy) - 4, inner = r * 0.62;
  if (total <= 0) {
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle = '#E8E6E0'; ctx.fill();
  } else {
    let angle = -Math.PI/2;
    sorted.forEach(([,val],i) => {
      if (val <= 0) return;
      const slice = (val/total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,angle,angle+slice);
      ctx.closePath();
      ctx.fillStyle = colors[i%colors.length]; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
      angle += slice;
    });
  }
  ctx.beginPath(); ctx.arc(cx,cy,inner,0,Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill();

  const centerEl = document.getElementById('dash-donut-beban-center');
  if (centerEl) centerEl.innerHTML = '<b>'+_fmtRpShort(total)+'</b><span>Total Beban</span>';

  const legendEl = document.getElementById('dash-donut-beban-legend');
  if (legendEl) {
    if (!sorted.length) {
      legendEl.innerHTML = '<div class="dash-kg-empty">Belum ada beban bulan ini</div>';
    } else {
      legendEl.innerHTML = sorted.slice(0,6).map(([nama,val],i) => {
        const pct = total>0 ? (val/total*100).toFixed(0) : 0;
        return '<div class="dash-donut-leg-row">' +
          '<span class="dash-donut-dot" style="background:'+colors[i%colors.length]+'"></span>' +
          '<span class="dash-donut-leg-label">'+nama+'</span>' +
          '<span class="dash-donut-leg-val">'+pct+'%</span>' +
        '</div>';
      }).join('');
    }
  }
}


// ─── VISUAL 8 MINICARD (gaya Accurate: donut + baris rincian) ──────
// MURNI PRESENTASI: hanya membaca angka yang sudah dihitung loadDashboard.
// Tidak menghitung ulang apa pun & tidak menulis ke elemen d-* yang ada.
function _zdDonut(id, segs, centerHtml) {
  var cv = document.getElementById('zd-viz-' + id);
  var ce = document.getElementById('zd-viz-' + id + '-c');
  if (ce) ce.innerHTML = centerHtml || '';
  if (!cv) return;
  var wrap = cv.parentElement;
  var S = (wrap && wrap.offsetWidth) || 96;
  var dpr = window.devicePixelRatio || 1;
  cv.width = S * dpr; cv.height = S * dpr;
  cv.style.width = S + 'px'; cv.style.height = S + 'px';
  var ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, S, S);
  var cx = S / 2, cy = S / 2, r = S / 2 - 2, inner = r * 0.68;
  var total = segs.reduce(function(a, x) { return a + Math.max(0, x.v); }, 0);
  var ang = -Math.PI / 2;
  if (total <= 0) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.arc(cx, cy, inner, 0, Math.PI * 2, true);
    ctx.fillStyle = '#ececea'; ctx.fill('evenodd'); return;
  }
  segs.forEach(function(sg) {
    var v = Math.max(0, sg.v); if (v <= 0) return;
    var sl = v / total * Math.PI * 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, ang, ang + sl); ctx.arc(cx, cy, inner, ang + sl, ang, true); ctx.closePath();
    ctx.fillStyle = sg.c; ctx.fill();
    ang += sl;
  });
}
function _zdRows(id, rows) {
  var el = document.getElementById('zd-viz-' + id + '-rows');
  if (!el) return;
  el.innerHTML = rows.map(function(r) {
    return '<div class="zd-mrow"><span class="zd-leg-dot" style="background:' + (r.c || '#bdb8ae') + '"></span>' +
      '<span class="zd-mrow-l">' + r.l + '</span>' +
      (r.p !== undefined ? '<span class="zd-leg-pct" style="color:' + (r.c || 'var(--ink3)') + '">' + r.p + '</span>' : '') +
      '<span class="zd-mrow-v"' + (r.vc ? ' style="color:' + r.vc + '"' : '') + '>' + r.v + '</span></div>';
  }).join('');
}
function _zdRenderMetricViz(d) {
  if (!d) return;
  try {
    var G = '#22a06b', R = '#d9534f', B = '#2266cc', Y = '#c8a000', TR = '#ececea';
    var pc = function(n, t) { return t > 0 ? Math.round(n / t * 100) + '%' : '0%'; };
    var ctr = function(big, small, col) {
      return '<b style="color:' + (col || 'var(--ink)') + '">' + big + '</b><span>' + small + '</span>';
    };

    // 1. Target Omset — donut progres
    var tg = d.target > 0;
    var tp = tg ? d.omsetBln / d.target * 100 : 0;
    var tcol = tp >= 100 ? G : tp >= 60 ? Y : R;
    _zdDonut('target', tg ? [{v: Math.min(d.omsetBln, d.target), c: tcol}, {v: Math.max(d.target - d.omsetBln, 0), c: TR}] : [],
      tg ? ctr(tp.toFixed(1).replace('.0','') + '%', 'tercapai', tcol) : ctr('—', 'belum ada target'));
    _zdRows('target', [
      {l: 'Omset bulan ini', v: _fmtRp(d.omsetBln), c: tcol},
      {l: 'Sisa target', v: tg ? _fmtRp(Math.max(d.target - d.omsetBln, 0)) : '—', c: TR}
    ]);

    // 2. Est. Laba Bersih — komposisi omset: HPP / Beban / Laba
    var lb = d.omsetBln > 0;
    var lba = Math.max(d.labaBersih, 0);
    _zdDonut('laba', lb ? [{v: d.hpp, c: Y}, {v: d.beban, c: R}, {v: lba, c: G}] : [],
      lb ? ctr(Math.round(d.labaBersih / d.omsetBln * 100) + '%', 'margin', d.labaBersih >= 0 ? G : R) : ctr('—', 'margin'));
    _zdRows('laba', [
      {l: 'Omset', v: _fmtRp(d.omsetBln), c: G},
      {l: 'HPP terjual', v: _fmtRp(d.hpp), c: Y, p: pc(d.hpp, d.omsetBln)},
      {l: 'Beban', v: _fmtRp(d.beban), c: R, p: pc(d.beban, d.omsetBln)}
    ]);

    // 3. Beban vs Kas — seberapa tertutup kebutuhan oleh kas (+escrow)
    var ak = window._akData;
    if (ak && ak.totalKeluar > 0) {
      var cov = ak.totalKas / ak.totalKeluar * 100;
      _zdDonut('bebankas', [{v: Math.min(Math.max(ak.totalKas, 0), ak.totalKeluar), c: G}, {v: Math.max(ak.totalKeluar - ak.totalKas, 0), c: R}],
        ctr(Math.min(Math.round(cov), 999) + '%', 'tertutup', cov >= 100 ? G : R));
      _zdRows('bebankas', [
        {l: 'Kas + Escrow', v: _fmtRp(ak.totalKas), c: G},
        {l: 'Beban + Cicilan', v: _fmtRp(ak.totalKeluar), c: R}
      ]);
    } else {
      _zdDonut('bebankas', [], ctr('—', 'tertutup'));
      _zdRows('bebankas', []);
    }

    // 4. Cash Flow — masuk vs keluar bulan ini
    var cfT = d.cfMasuk + d.cfKeluar;
    _zdDonut('cashflow', [{v: d.cfMasuk, c: G}, {v: d.cfKeluar, c: R}],
      cfT > 0 ? ctr(pc(d.cfMasuk, cfT), 'masuk', G) : ctr('—', 'masuk'));
    _zdRows('cashflow', [
      {l: 'Masuk', v: _fmtRp(d.cfMasuk), c: G},
      {l: 'Keluar', v: _fmtRp(d.cfKeluar), c: R}
    ]);

    // Baris 2 — donut + rincian (seragam dengan baris 1)
    // 5. Saldo Kas — porsi saldo tersisa dari total kas masuk
    var kM = Math.max(d.kasMasuk || 0, 0), kK = Math.max(d.kasKeluar || 0, 0);
    var kSaldo = Math.max(d.saldo || 0, 0);
    if (kM > 0) {
      var kp = Math.max(Math.round((d.saldo || 0) / kM * 100), 0);
      _zdDonut('saldo', [{v: kSaldo, c: G}, {v: Math.min(kK, kM), c: R}], ctr(kp + '%', 'tersisa', (d.saldo || 0) >= 0 ? G : R));
    } else {
      _zdDonut('saldo', [], ctr('—', 'tersisa'));
    }
    _zdRows('saldo', [
      {l: 'Total masuk', v: _fmtRp(d.kasMasuk), c: G},
      {l: 'Total keluar', v: _fmtRp(d.kasKeluar), c: R}
    ]);

    // 6. Order Hari Ini — omset hari ini vs target harian
    var thr = d.targetHarian > 0;
    var hp = thr ? d.omsetHari / d.targetHarian * 100 : 0;
    var hcol = hp >= 100 ? G : hp >= 60 ? Y : R;
    _zdDonut('order', thr ? [{v: Math.min(d.omsetHari, d.targetHarian), c: hcol}, {v: Math.max(d.targetHarian - d.omsetHari, 0), c: TR}] : [],
      thr ? ctr(Math.round(hp) + '%', 'target harian', hcol) : ctr('—', 'target harian'));
    _zdRows('order', [
      {l: 'Transaksi hari ini', v: d.trxHariIni, c: B},
      {l: 'AOV bulan ini', v: d.aov > 0 ? _fmtRp(d.aov) : '—', c: Y}
    ]);

    // 7. Nilai Stok — komposisi nilai per Boss (top 3 + lainnya)
    var byBoss = {}, nsTot = 0;
    (_dashStokData || []).forEach(function(r) {
      var v = Number(r.nilai_stok) || 0; if (v <= 0) return;
      var k = r.boss || 'Tanpa Boss'; byBoss[k] = (byBoss[k] || 0) + v; nsTot += v;
    });
    var bossArr = Object.keys(byBoss).map(function(k) { return [k, byBoss[k]]; }).sort(function(a, b) { return b[1] - a[1]; });
    var bossCol = [B, Y, G], sSegs = [], sRows = [];
    bossArr.slice(0, 3).forEach(function(x, i) {
      sSegs.push({v: x[1], c: bossCol[i]});
      sRows.push({l: x[0], v: _fmtRp(x[1]), c: bossCol[i], p: pc(x[1], nsTot)});
    });
    var lain = bossArr.slice(3).reduce(function(a, x) { return a + x[1]; }, 0);
    if (lain > 0) { sSegs.push({v: lain, c: '#bdb8ae'}); sRows.push({l: 'Lainnya', v: _fmtRp(lain), c: '#bdb8ae', p: pc(lain, nsTot)}); }
    _zdDonut('stok', sSegs, nsTot > 0 ? ctr(d.pcsTotal, 'pcs', 'var(--ink)') : ctr('—', 'pcs'));
    _zdRows('stok', sRows);

    // 8. SKU Kritis — habis / mendekati habis / aman dari total SKU
    var mdk = Math.max(d.kritis - d.habis, 0);
    var aman = Math.max(d.skuTotal - d.kritis, 0);
    _zdDonut('kritis', d.skuTotal > 0 ? [{v: d.habis, c: R}, {v: mdk, c: Y}, {v: aman, c: G}] : [],
      d.skuTotal > 0 ? ctr(d.kritis, 'kritis', d.kritis > 0 ? R : G) : ctr('—', 'kritis'));
    _zdRows('kritis', [
      {l: 'Habis', v: d.habis + ' sku', c: R},
      {l: 'Mendekati habis', v: mdk + ' sku', c: Y},
      {l: 'Aman', v: aman + ' sku', c: G}
    ]);
  } catch (e) { console.warn('[MetricViz]', e); }
}

// ─── KEGIATAN MENDATANG — cicilan hutang aktif + SKU perlu restock ──
async function _renderKegiatanMendatang() {
  const listEl = document.getElementById('dash-kegiatan-list');
  if (!listEl) return;
  try {
    const [hutangAll, bayarAll] = await Promise.all([
      dbGet('hutang',       '').catch(() => []),
      dbGet('hutang_bayar', '').catch(() => [])
    ]);
    const items = [];

    (hutangAll || []).forEach(h => {
      const sudahBayar = (bayarAll || [])
        .filter(b => b.hutang_id === h.id)
        .reduce((s, b) => s + Number(b.nominal || 0), 0);
      const sisa = (h.pokok || 0) - sudahBayar;
      if (sisa > 0 && Number(h.cicilan_per_bulan) > 0) {
        items.push({
          grp:  'cicilan',
          icon: 'ti-credit-card',
          cls:  'warn',
          title: h.kreditur || 'Hutang',
          sub:  'Cicilan bulanan · sisa ' + _fmtRp(sisa),
          val:  _fmtRp(h.cicilan_per_bulan)
        });
      }
    });

    (_dashStokData || [])
      .filter(r => (r.kategori_produk||'aktif')==='aktif' && !r.dropship && (r.sales30||0)>0 && r.sisa<=3)
      .sort((a,b)=>a.sisa-b.sisa)
      .slice(0,4)
      .forEach(r => {
        items.push({
          grp:  'stok',
          icon: 'ti-package',
          cls:  r.sisa<=0 ? 'danger' : 'warn',
          title: r.sku_variasi,
          sub:  r.sisa<=0 ? 'Stok habis — perlu restock' : 'Sisa ' + r.sisa + ' pcs — mendekati habis',
          val:  r.sisa<=0 ? '🔴 Habis' : '⚠ ' + r.sisa
        });
      });

    const stokListEl = document.getElementById('dash-kegiatan-stok-list');
    const _kgHtml = arr => arr.map(it =>
      '<div class="dash-kg-item">' +
        '<div class="dash-kg-ic '+it.cls+'"><i class="ti '+it.icon+'"></i></div>' +
        '<div style="min-width:0;flex:1">' +
          '<div class="dash-kg-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+it.title+'</div>' +
          '<div class="dash-kg-sub">'+it.sub+'</div>' +
        '</div>' +
        '<div class="dash-kg-val" style="color:'+(it.cls==='danger'?'var(--danger)':'var(--warn)')+'">'+it.val+'</div>' +
      '</div>'
    ).join('');
    const cicilanItems = items.filter(it => it.grp === 'cicilan').slice(0,6);
    const stokItems    = items.filter(it => it.grp === 'stok').slice(0,6);
    listEl.innerHTML = cicilanItems.length
      ? _kgHtml(cicilanItems)
      : '<div class="dash-kg-empty">Tidak ada cicilan mendatang — semua aman 👍</div>';
    if (stokListEl) stokListEl.innerHTML = stokItems.length
      ? _kgHtml(stokItems)
      : '<div class="dash-kg-empty">Tidak ada SKU perlu restock — semua aman 👍</div>';
  } catch(e) {
    console.warn('[KegiatanMendatang]', e);
    listEl.innerHTML = '<div class="dash-kg-empty">Gagal memuat data</div>';
    var _sl = document.getElementById('dash-kegiatan-stok-list');
    if (_sl) _sl.innerHTML = '<div class="dash-kg-empty">Gagal memuat data</div>';
  }
}

async function _dashUpdateBebanVsKas(totalBebanDash) {
  try {
    const [hutangAll, bayarAll, kasAkun, jurnal, shopeeCache] = await Promise.all([
      dbGet('hutang',       '').catch(() => []),
      dbGet('hutang_bayar', '').catch(() => []),
      dbGet('kas_akun',     '').catch(() => []),
      dbGet('jurnal',       '').catch(() => []),
      fetch(SUPABASE_URL + '/rest/v1/shopee_finance_cache?select=*&order=fetched_at.desc&limit=1',
        { headers: _headers() }).then(r => r.ok ? r.json() : []).catch(() => [])
    ]);

    // Cicilan hutang aktif
    const totalCicilan = (hutangAll || []).filter(h => {
      const sisa = (h.pokok || 0) - (bayarAll || [])
        .filter(b => b.hutang_id === h.id)
        .reduce((s, b) => s + Number(b.nominal || 0), 0);
      return sisa > 0;
    }).reduce((s, h) => s + (h.cicilan_per_bulan || 0), 0);

    const totalKeluar = (totalBebanDash || 0) + totalCicilan;

    // Kas & Bank dari jurnal
    const kasIds = (kasAkun || [])
      .filter(a => a.kelompok === 'aset' && (a.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK')
      .map(a => a.id);
    const saldoKas = (jurnal || []).reduce((s, r) => {
      const n = Number(r.nominal || r.debit || 0);
      if (kasIds.includes(r.akun_debit_id))  return s + n;
      if (kasIds.includes(r.akun_kredit_id)) return s - n;
      return s;
    }, 0);

    const cache  = shopeeCache && shopeeCache.length > 0 ? shopeeCache[0] : null;
    const escrow = cache ? Number(cache.escrow_transit || 0) : 0;
    const totalKas = saldoKas + escrow;

    const isDefisit = totalKas < totalKeluar;
    const selisih   = Math.abs(totalKas - totalKeluar);

    // Update card
    const elDelta = document.getElementById('d-beban-delta');
    if (elDelta) {
      elDelta.textContent = isDefisit
        ? '⚠ Defisit ' + _fmtRp(selisih)
        : '✅ Surplus ' + _fmtRp(selisih);
      elDelta.style.color = isDefisit ? 'var(--danger)' : 'var(--ok)';
    }

    // Expose untuk networth
    window._akData = { totalBeban: totalBebanDash, totalCicilan, totalKeluar, totalKas, isDefisit };
    if (typeof _zdRenderMetricViz === 'function' && window._zdMetricData) _zdRenderMetricViz(window._zdMetricData);

  } catch(e) { console.warn('[BebanVsKas]', e); }
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD SWIPE PAIRS — portrait only, landscape/laptop skip
// ═══════════════════════════════════════════════════════════
(function() {
  function initSwipePairNw(pairEl) {
    var track = pairEl.querySelector('.nw-swipe-track');
    if (!track) return;
    var slides = pairEl.querySelectorAll('.nw-swipe-slide');
    var current = 0;
    var startX = 0, startY = 0, startT = 0, isDragging = false, isHoriz = null;
    var dir = 1;   // +1 maju, -1 mundur. Dibalik otomatis di ujung → gulir 1-2-3-4-3-2-1, tidak stuck
    function step() {
      var n = slides.length;
      if (n < 2) return;
      var nxt = current + dir;
      if (nxt < 0 || nxt >= n) { dir = -dir; nxt = current + dir; }
      goTo(nxt);
    }
    function goTo(idx) {
      if (idx < 0 || idx >= slides.length) return;
      current = idx;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      slides.forEach(function(slide) {
        var dots = slide.querySelectorAll('.nw-dot');
        dots.forEach(function(d, j) { d.classList.toggle('active', j === idx); });
      });
    }
    track.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
      isDragging = true;
      isHoriz = null;
    }, { passive: true });
    track.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      // Tentukan arah hanya sekali, setelah minimal 4px gerakan
      if (isHoriz === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        isHoriz = Math.abs(dx) > Math.abs(dy);
      }
      if (isHoriz) e.preventDefault();
    }, { passive: false });
    track.addEventListener('touchend', function(e) {
      if (!isDragging) return;
      isDragging = false;
      if (!isHoriz) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dt = Date.now() - startT;
      // Threshold: 40px atau velocity > 0.3px/ms
      var isFlick = Math.abs(dx) / Math.max(dt, 1) > 0.3;
      if (dx < -40 || (isFlick && dx < 0) || dx > 40 || (isFlick && dx > 0)) step();
    }, { passive: true });
    track.addEventListener('touchcancel', function() { isDragging = false; isHoriz = null; }, { passive: true });
  }

  function initSwipePair(pairEl) {
    var track = pairEl.querySelector('.db-swipe-track');
    if (!track) return;
    var slides = pairEl.querySelectorAll('.db-swipe-slide');
    var current = 0;
    var startX = 0, startY = 0, startT = 0, isDragging = false, isHoriz = null;

    function goTo(idx) {
      if (idx < 0 || idx >= slides.length) return;
      current = idx;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      slides.forEach(function(slide) {
        var dots = slide.querySelectorAll('.db-dot');
        dots.forEach(function(d, j) { d.classList.toggle('active', j === idx); });
      });
    }

    track.addEventListener('touchstart', function(e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
      isDragging = true;
      isHoriz = null;
    }, { passive: true });

    track.addEventListener('touchmove', function(e) {
      if (!isDragging) return;
      var dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      // Tentukan arah hanya sekali, setelah minimal 4px
      if (isHoriz === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        isHoriz = Math.abs(dx) > Math.abs(dy);
      }
      if (isHoriz) e.preventDefault();
    }, { passive: false });

    track.addEventListener('touchend', function(e) {
      if (!isDragging) return;
      isDragging = false;
      if (!isHoriz) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dt = Date.now() - startT;
      var isFlick = Math.abs(dx) / Math.max(dt, 1) > 0.3;
      if ((dx < -40 || (isFlick && dx < 0)) && current < slides.length - 1) goTo(current + 1);
      else if ((dx > 40 || (isFlick && dx > 0)) && current > 0) goTo(current - 1);
    }, { passive: true });

    track.addEventListener('touchcancel', function() { isDragging = false; isHoriz = null; }, { passive: true });

    // Dot click
    pairEl.querySelectorAll('.db-dot').forEach(function(dot, idx2) {
      dot.addEventListener('click', function() {
        var allDots = Array.from(pairEl.querySelectorAll('.db-swipe-slide:first-child .db-dot'));
        var i = allDots.indexOf(dot);
        if (i >= 0) goTo(i);
        else goTo(idx2 % slides.length);
      });
    });
  }

  // ── Carousel metrik HP: 1 kartu/halaman, loop tanpa ujung (1-2-3-4-1-2-3-4) ──
  // Tanpa klon (ID canvas tetap unik): DOM diputar — kartu aktif selalu di posisi ke-2
  // [kiri, AKTIF, kanan, sisa]; selesai animasi, node paling depan/belakang dipindah lalu
  // transform di-reset diam-diam ke -100%.
  function zdCarSetup(car, o) {
    o = o || {};
    var track = car.querySelector(o.track || '.zd-car-track');
    if (!track || car._zdOn) return;
    car._zdOn = true;
    var cards = Array.prototype.slice.call(track.children);
    var n = cards.length, cur = 0, busy = false;
    var dots = car.querySelectorAll(o.dot || '.zd-car-dots i');
    var dotCls = o.cls || 'on';
    var startX = 0, startY = 0, startT = 0, dragging = false, isHoriz = null, dx = 0;
    track.insertBefore(track.lastElementChild, track.firstElementChild); // aktif = kartu #1 di posisi ke-2
    track.classList.add('zd-nodrag-anim');
    track.style.transform = 'translateX(-100%)';
    void track.offsetWidth;
    track.classList.remove('zd-nodrag-anim');
    function paintDots() { dots.forEach(function(d, k) { d.classList.toggle(dotCls, (k % n) === cur); }); }
    function snap(anim) {
      track.classList.toggle('zd-nodrag-anim', !anim);
      track.style.transform = 'translateX(-100%)';
    }
    function step(dir) { // dir=+1 → kartu berikutnya, -1 → sebelumnya
      if (busy) return;
      busy = true;
      track.classList.remove('zd-nodrag-anim');
      track.style.transform = 'translateX(' + (dir > 0 ? '-200%' : '0%') + ')';
      var done = false;
      function fin() {
        if (done) return; done = true;
        track.removeEventListener('transitionend', fin);
        track.classList.add('zd-nodrag-anim');
        if (dir > 0) track.appendChild(track.firstElementChild);
        else track.insertBefore(track.lastElementChild, track.firstElementChild);
        track.style.transform = 'translateX(-100%)';
        void track.offsetWidth; // paksa reflow sebelum animasi dinyalakan lagi
        track.classList.remove('zd-nodrag-anim');
        cur = (cur + dir + n) % n; paintDots(); busy = false;
      }
      track.addEventListener('transitionend', fin);
      setTimeout(fin, 400);
    }
    track.addEventListener('touchstart', function(e) {
      if (busy) return;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY; startT = Date.now();
      dragging = true; isHoriz = null; dx = 0;
    }, { passive: true });
    track.addEventListener('touchmove', function(e) {
      if (!dragging) return;
      dx = e.touches[0].clientX - startX;
      var dy = e.touches[0].clientY - startY;
      if (isHoriz === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) isHoriz = Math.abs(dx) > Math.abs(dy);
      if (isHoriz) {
        e.preventDefault();
        track.classList.add('zd-nodrag-anim');
        track.style.transform = 'translateX(calc(-100% + ' + dx + 'px))';
      }
    }, { passive: false });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      if (!isHoriz) return;
      var moved = e.changedTouches ? e.changedTouches[0].clientX - startX : dx;
      var flick = Math.abs(moved) / Math.max(Date.now() - startT, 1) > 0.3;
      if (moved < -40 || (flick && moved < 0)) step(1);
      else if (moved > 40 || (flick && moved > 0)) step(-1);
      else snap(true);
    }
    track.addEventListener('touchend', endDrag, { passive: true });
    track.addEventListener('touchcancel', function() { dragging = false; isHoriz = null; snap(true); }, { passive: true });
  }
  // Balik ke urutan asli + grid biasa kalau layar melebar (>=768px)
  function zdCarTeardown(car) {
    if (!car._zdOn) return;
    var track = car.querySelector('.zd-car-track');
    var cards = Array.prototype.slice.call(track.children).sort(function(a, b) {
      return (+a.getAttribute('data-zd-i')) - (+b.getAttribute('data-zd-i'));
    });
    cards.forEach(function(c) { track.appendChild(c); });
    track.style.transform = ''; track.classList.remove('zd-nodrag-anim');
    var dots = car.querySelectorAll('.zd-car-dots i');
    dots.forEach(function(d, i) { d.classList.toggle('on', i === 0); });
    // handler lama tetap menempel di track; buang dengan mengganti node
    var fresh = track.cloneNode(false);
    while (track.firstChild) fresh.appendChild(track.firstChild);
    track.parentNode.replaceChild(fresh, track);
    car._zdOn = false;
  }
  function zdCarAll() {
    document.querySelectorAll('.zd-car').forEach(function(car) {
      if (window.innerWidth < 768) zdCarSetup(car); else zdCarTeardown(car);
    });
  }
  var _zdCarRz;
  window.addEventListener('resize', function() { clearTimeout(_zdCarRz); _zdCarRz = setTimeout(zdCarAll, 200); });

  function initAllSwipes() {
    zdCarAll();
    if (window.innerWidth >= 768) return;
    // Init db-swipe-pair — guard: skip kalau sudah pernah di-init
    document.querySelectorAll('.db-swipe-pair').forEach(function(pair) {
      if (pair._swipeInited) return;
      pair._swipeInited = true;
      initSwipePair(pair);
    });
    // Init nw-swipe-container (Net Worth + Beban + Income + Kecepatan Kas)
    var nwCont = document.getElementById('nw-swipe-container');
    if (nwCont && !nwCont._swipeInited) {
      nwCont._swipeInited = true;
      if (window.matchMedia && window.matchMedia('(max-width: 767px)').matches) {
        zdCarSetup(nwCont, { track: '.nw-swipe-track', dot: '.nw-dot', cls: 'active' });
      } else {
        initSwipePairNw(nwCont);
      }
    }
  }

  // Init setelah dashboard render
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initAllSwipes, 400);
  });
  // Re-init kalau dashboard direload
  document.addEventListener('zenot:dashboard-rendered', function() {
    setTimeout(initAllSwipes, 200);
  });
  window.dbSwipeInit = initAllSwipes;
})();

// ═══════════════════════════════════════════════════════════
// KECEPATAN KAS (7 Okt 2026) — badge Lambat / Sedang / Cepat di Dashboard
// tab Ringkasan + rincian di tab Stok & Supplier (tracker batch reseller)
// dan tab Keuangan (kewajiban supplier 14 hari).
//
// Aturan yang disepakati: "terburuk menang" — badge ngikutin indikator
// terburuk, dan alasannya ditampilkan.
//   Indikator 1 — Kecukupan kas 14 hari:
//       (saldo Kas & Bank + escrow Shopee) ÷ kewajiban supplier yang jatuh
//       tempo ≤ 14 hari ke depan (yang sudah lewat tempo ikut dihitung).
//   Indikator 2 — Tracker batch reseller (aturan hari ke-9):
//       tiap bon PO yang barangnya sudah diterima & masih ada sisa hutang,
//       minimal 50% modalnya sudah laku di hari ke-9 sejak barang jadi.
//
// Aturan tempo (dari user): Dropship = bayar tiap hari Sabtu. Reseller (PO) =
// bayar 50% saat barang jadi (diterima), sisanya tempo 14 hari. Aturan ini
// dianggap sama untuk SEMUA supplier reseller (H SOLAH, MAGRA, dst) sampai
// ada pengecualian — isi ZD_KAS_CFG.supplierTempo bila ada yang beda.
//
// Sumber data: hutang_supplier, hutang_bon, hutang_pembayaran,
// hutang_bon_item, hutang_barang, produk, shopee_finance_cache, plus
// _dashStokData (sisa stok) & window._dashKasAkunMap/_dashJurnalAllData
// (saldo kas) yang SUDAH dibangun loadDashboard. TIDAK ada tabel/kolom baru.
// Sengaja TIDAK menulis ke database sama sekali (read-only).
//
// ── REVISI 7 Okt 2026 (rumus Kecepatan Kas jadi perbandingan kas vs SEMUA kebutuhan) ──
//   Kas      = saldo Kas & Bank SAJA. Escrow Shopee TIDAK dihitung (dana di jalan,
//              bisa batal/retur) — hanya ditampilkan sebagai info.
//   Kebutuhan 14 hari = supplier (dropship + PO) + cicilan hutang yang jatuh tempo
//              ≤14 hari dan belum dibayar + sisa anggaran Beban Operasional bulan ini
//              yang belum terealisasi.
//   Cicilan  : tabel `hutang` (cicilan_per_bulan/cicilan_nominal, tgl_cicilan, bln_cicilan
//              utk tahunan, akun_kwj_id). Sudah dibayar = debit ke akun kewajiban itu di
//              jurnal bulan berjalan (hutang_bayar TIDAK dipakai: kode sekarang tidak
//              mengisinya). Cicilan dibatasi saldo kewajiban akunnya (saldo ≤0 = lunas).
//   Operasional : kas_anggaran bulan ini (fallback bulan terakhir yang ada, sama dgn
//              Dashboard) per akun beban, sub_kelompok HPP/Beban Produksi dikecualikan
//              (sama dgn Beban Operasional Dashboard); sisa = max(0, anggaran − realisasi
//              jurnal bulan ini). Akun kewajiban di anggaran TIDAK dihitung di sini
//              (sudah lewat cicilan hutang, supaya tidak dobel).
// Sengaja belum ada: angka "hari dana tertahan di Shopee" (escrow ÷ omset
// harian) — shopee_finance_cache cuma 1 baris terakhir (1 toko) sedangkan
// omset dari semua channel, jadi angkanya menyesatkan. Escrow tetap ikut
// dihitung sebagai kas yang akan masuk di indikator 1.
// ═══════════════════════════════════════════════════════════
var ZD_KAS_CFG = {
  horizonHari:     14,    // jendela kewajiban yang dihitung
  resellerTempo:   14,    // hari tempo sisa pembayaran reseller (sejak barang diterima)
  resellerDpPct:   0.5,   // porsi yang dibayar saat barang jadi
  supplierTempo:   {},    // override per nama supplier UPPERCASE, mis. { 'MAGRA': { tempo: 7, dpPct: 0.5 } }
  covHijau:        1.5,   // kecukupan kas ≥ ini = hijau
  covKuning:       1.0,   // ≥ ini = kuning, di bawahnya merah
  targetHari:      9,     // titik cek tracker batch (14 hari tempo − 5 hari dana Shopee cair)
  targetPct:       0.5,   // minimal porsi modal batch yang sudah laku di hari target
  graceHari:       3,     // 3 hari pertama batch tidak pernah merah
  trackerWindow:   60     // bon diterima > N hari lalu hanya dihitung kalau masih ada sisa hutang
};

var _zdKasRunning = false;
var _zdKasPending = false;
var _zdKasData    = null;

function _zdKasEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _zdKasParse(s) {
  var p = String(s || '').slice(0, 10).split('-');
  if (p.length < 3) return null;
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}
function _zdKasAddDays(s, n) {
  var d = _zdKasParse(s);
  if (!d) return null;
  d.setDate(d.getDate() + n);
  return _localDateStr(d);
}
function _zdKasDiffDays(a, b) {   // b − a (hari)
  var da = _zdKasParse(a), db = _zdKasParse(b);
  if (!da || !db) return 0;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}
function _zdKasSabtuOnOrAfter(s) {   // Sabtu pertama pada/setelah tanggal s
  var d = _zdKasParse(s);
  if (!d) return null;
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return _localDateStr(d);
}
function _zdKasTglPendek(s) {
  var d = _zdKasParse(s);
  if (!d) return '—';
  var bln = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return d.getDate() + ' ' + bln[d.getMonth()];
}
function _zdKasPctTxt(x) { return Math.round((x || 0) * 100) + '%'; }
function _zdKasRank(st) { return st === 'merah' ? 2 : st === 'kuning' ? 1 : 0; }
function _zdKasWorst(a, b) { return _zdKasRank(b) > _zdKasRank(a) ? b : a; }

// Status 1 batch: di hari target minimal targetPct; sebelum itu dibandingkan
// target linear (targetPct × hari/targetHari). Hari awal (grace) tidak pernah merah.
function _zdKasStatusBatch(hari, pct) {
  var C = ZD_KAS_CFG;
  var h = Math.max(0, hari);
  if (h >= C.targetHari) {
    if (pct >= C.targetPct) return 'hijau';
    if (pct >= C.targetPct * 0.7) return 'kuning';
    return 'merah';
  }
  var need = C.targetPct * h / C.targetHari;
  if (pct >= need) return 'hijau';
  if (h < C.graceHari) return 'kuning';
  if (pct >= need * 0.6) return 'kuning';
  return 'merah';
}
function _zdKasTargetBatch(hari) {
  var C = ZD_KAS_CFG;
  var h = Math.max(0, hari);
  return C.targetPct * Math.min(h, C.targetHari) / C.targetHari;
}

// Cicilan hutang yang jatuh tempo ≤ horizon & belum dibayar. Return { items, tanpaTgl, tanpaAkun }.
function _zdKasCicilan(hutangRows, akunMap, jr, today, horizon) {
  var out = { items: [], tanpaTgl: 0, tanpaAkun: 0 };
  var saldo = {}, bayarBln = {};
  jr.forEach(function(r) {
    var aD = akunMap[r.akun_debit_id], aK = akunMap[r.akun_kredit_id];
    if (aD && aD.kelompok === 'kewajiban') {
      var nd = Number(r.nominal || r.debit || 0);
      saldo[aD.id] = (saldo[aD.id] || 0) - nd;
      var kd = aD.id + '|' + String(r.tanggal || '').slice(0, 7);
      bayarBln[kd] = (bayarBln[kd] || 0) + nd;
    }
    if (aK && aK.kelompok === 'kewajiban') saldo[aK.id] = (saldo[aK.id] || 0) + Number(r.nominal || r.kredit || 0);
  });
  var tY = Number(today.slice(0, 4)), tM = Number(today.slice(5, 7));
  (hutangRows || []).forEach(function(h) {
    var tahunan = h.frekuensi === 'tahunan';
    var nominal = tahunan ? (Number(h.cicilan_nominal) || 0) : (Number(h.cicilan_per_bulan) || 0);
    if (!(nominal > 0)) return;
    var tgl = parseInt(h.tgl_cicilan, 10);
    var bln = parseInt(h.bln_cicilan, 10);
    if (!tgl || (tahunan && !bln)) { out.tanpaTgl++; return; }
    var akun = (h.akun_kwj_id != null && akunMap[h.akun_kwj_id]) ? akunMap[h.akun_kwj_id] : null;
    var adaItem = false;
    if (akun && (saldo[akun.id] || 0) <= 0) return;                 // saldo kewajiban ≤ 0 → sudah lunas
    var left = akun ? saldo[akun.id] : Infinity;
    for (var off = 0; off <= 1; off++) {
      var base = new Date(tY, tM - 1 + off, 1, 12, 0, 0);
      if (tahunan && (base.getMonth() + 1) !== bln) continue;
      var hari = Math.min(tgl, new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate());
      var ymStr = _localDateStr(base).slice(0, 7);
      var due = ymStr + '-' + String(hari).padStart(2, '0');
      if (due > horizon) continue;                                    // hanya yang jatuh tempo dalam jendela
      var paid = akun ? (bayarBln[akun.id + '|' + ymStr] || 0) : 0;
      var need = Math.min(Math.max(0, nominal - paid), left);
      if (!(need > 0)) continue;
      left -= need;
      if (akun) saldo[akun.id] = left;
      out.items.push({ tgl: due, amt: need, sup: String(h.kreditur || 'HUTANG').toUpperCase(), bonId: null, jenis: 'cicilan',
        label: 'Cicilan · tgl ' + hari });
      adaItem = true;
    }
    if (!akun && adaItem) out.tanpaAkun++;                              // hanya dilaporkan kalau memang ikut terhitung
  });
  return out;
}

// Sisa anggaran Beban Operasional bulan ini yang belum terealisasi.
function _zdKasOperasional(anggaranRows, akunMap, jr, ym) {
  var real = {};
  jr.forEach(function(r) {
    if (String(r.tanggal || '').slice(0, 7) !== ym) return;
    var aD = akunMap[r.akun_debit_id];
    if (aD && aD.kelompok === 'beban') real[aD.id] = (real[aD.id] || 0) + Number(r.nominal || r.debit || 0);
  });
  var sisa = 0, anggaran = 0;
  (anggaranRows || []).forEach(function(a) {
    var ak = akunMap[a.akun_id];
    if (!ak || ak.kelompok !== 'beban' || ak.sub_kelompok === 'HPP' || ak.sub_kelompok === 'Beban Produksi') return;
    var ang = Number(a.nominal) || 0;
    anggaran += ang;
    sisa += Math.max(0, ang - (real[ak.id] || 0));
  });
  return { sisa: sisa, anggaran: anggaran };
}

async function _zdKasHitung() {
  var C       = ZD_KAS_CFG;
  var today   = _localDateStr();
  var horizon = _zdKasAddDays(today, C.horizonHari);
  var winFrom = _zdKasAddDays(today, -C.trackerWindow);
  var sabtuIni = _zdKasSabtuOnOrAfter(today);

  // ── 1) Data dasar (semua kecil; bon dibatasi yang masih relevan) ──
  var base = await Promise.all([
    dbGet('hutang_supplier', ''),
    dbGet('hutang_bon', '&or=(status.is.null,status.neq.lunas)'),
    dbGet('hutang_bon', '&mode_beli=eq.po&is_po=eq.false&tgl_diterima=gte.' + winFrom).catch(function() { return []; }),
    dbGet('hutang_barang', ''),
    dbGet('produk', '&select=id,sku_variasi'),
    fetch(SUPABASE_URL + '/rest/v1/shopee_finance_cache?select=*&order=fetched_at.desc&limit=1', { headers: _headers() })
      .then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
    dbGet('hutang', '').catch(function() { return []; }),
    dbGet('kas_anggaran', '&bulan=eq.' + today.slice(0, 7)).catch(function() { return []; })
  ]);
  var supRows = base[0] || [], barangRows = base[3] || [], produkRows = base[4] || [];
  var shopeeRows = base[5];
  var hutangRows = base[6] || [];
  var anggaranRows = base[7] || [];
  var anggaranBulan = today.slice(0, 7);
  if (!anggaranRows.length) {          // sama dgn Dashboard: bulan ini belum ada anggaran → pakai bulan terakhir yang ada
    var angAll = await dbGet('kas_anggaran', '&order=bulan.desc').catch(function() { return []; });
    if (angAll && angAll.length) {
      anggaranBulan = angAll[0].bulan;
      anggaranRows = angAll.filter(function(a) { return a.bulan === anggaranBulan; });
    }
  }

  var bonMap = {};
  (base[1] || []).forEach(function(b) { bonMap[b.id] = b; });
  (base[2] || []).forEach(function(b) { if (!bonMap[b.id]) bonMap[b.id] = b; });
  var bons = Object.keys(bonMap).map(function(k) { return bonMap[k]; });
  var ids  = bons.map(function(b) { return b.id; });

  // ── 2) Pembayaran per bon ──
  var payMap = {};
  if (ids.length) {
    var pays = await dbGet('hutang_pembayaran', '&bon_id=in.(' + ids.join(',') + ')');
    (pays || []).forEach(function(p) { payMap[p.bon_id] = (payMap[p.bon_id] || 0) + (Number(p.nominal) || 0); });
  }

  var supMap = {};
  supRows.forEach(function(s) { supMap[s.id] = s; });

  // ── 3) Kas: saldo Kas & Bank (rumus sama dgn kartu Saldo Kas) + escrow Shopee ──
  var akunMap = window._dashKasAkunMap || {};
  var jr      = window._dashJurnalAllData || [];
  var kMasuk = 0, kKeluar = 0;
  jr.forEach(function(r) {
    var aD = akunMap[r.akun_debit_id], aK = akunMap[r.akun_kredit_id];
    var isD = aD && aD.kelompok === 'aset' && String(aD.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK';
    var isK = aK && aK.kelompok === 'aset' && String(aK.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK';
    if (isD) kMasuk  += Number(r.nominal || r.debit  || 0);
    if (isK) kKeluar += Number(r.nominal || r.kredit || 0);
  });
  var saldoKas = kMasuk - kKeluar;
  var escrow   = (shopeeRows && shopeeRows.length) ? (Number(shopeeRows[0].escrow_transit) || 0) : 0;
  var escrowLive = !!(shopeeRows && shopeeRows.length);
  var kasTotal = Math.max(0, saldoKas);   // 7 Okt 2026: escrow TIDAK dihitung (dana di jalan, bisa batal) — hanya info

  // ── 4) Kewajiban per bon ──
  var obligations = [];     // {tgl, amt, sup, bonId, jenis, label}
  var poBelumJadi = { n: 0, sisa: 0 };
  var diLuarAturan = { n: 0, sisa: 0 };
  var fallbackTgl = 0;
  var batches = [];          // PO reseller sudah diterima (kandidat tracker)

  bons.forEach(function(b) {
    var sup    = supMap[b.supplier_id] || null;
    var nama   = sup ? String(sup.nama || '').toUpperCase() : ('SUPPLIER #' + b.supplier_id);
    var total  = Number(b.total) || 0;
    var bayar  = payMap[b.id] || 0;
    var sisa   = Math.max(0, total - bayar);
    // mode_beli kosong (bon lama): supplier reseller murni dianggap PO, selain itu dropship
    var mode   = b.mode_beli === 'po' ? 'po'
               : (b.mode_beli === 'dropship' ? 'dropship'
               : ((sup && sup.is_reseller && !sup.is_dropship) ? 'po' : 'dropship'));
    var ov     = C.supplierTempo[nama] || {};
    var tempo  = ov.tempo != null ? ov.tempo : C.resellerTempo;
    var dpPct  = ov.dpPct != null ? ov.dpPct : C.resellerDpPct;

    if (sup && sup.is_produksi_sendiri) {
      if (sisa > 0) { diLuarAturan.n++; diLuarAturan.sisa += sisa; }
      return;
    }

    if (mode === 'po') {
      if (b.is_po === true) {                       // barang belum jadi → belum ada uang keluar
        if (sisa > 0) { poBelumJadi.n++; poBelumJadi.sisa += sisa; }
        return;
      }
      var tgl = b.tgl_diterima || null;
      if (!tgl) { tgl = String(b.tanggal || '').slice(0, 10); fallbackTgl++; }
      tgl = String(tgl).slice(0, 10);
      if (sisa > 0) {
        var dpNeed = Math.min(sisa, Math.max(0, Math.round(total * dpPct) - bayar));
        var rest   = sisa - dpNeed;
        if (dpNeed > 0) obligations.push({ tgl: tgl, amt: dpNeed, sup: nama, bonId: b.id, jenis: 'dp',
          label: 'DP ' + Math.round(dpPct * 100) + '% · barang jadi ' + _zdKasTglPendek(tgl) });
        if (rest > 0)   obligations.push({ tgl: _zdKasAddDays(tgl, tempo), amt: rest, sup: nama, bonId: b.id, jenis: 'sisa',
          label: 'Sisa · tempo ' + tempo + ' hari' });
      }
      batches.push({ bon: b, sup: nama, tgl: tgl, sisaHutang: sisa, tempoTgl: _zdKasAddDays(tgl, tempo) });
      return;
    }

    // dropship → dibayar tiap Sabtu (Sabtu pertama pada/setelah tanggal bon)
    if (sisa > 0) {
      var sab = _zdKasSabtuOnOrAfter(String(b.tanggal || '').slice(0, 10));
      if (!sab) { diLuarAturan.n++; diLuarAturan.sisa += sisa; return; }
      obligations.push({ tgl: sab, amt: sisa, sup: nama, bonId: b.id, jenis: 'dropship',
        label: 'Dropship · bayar Sabtu ' + _zdKasTglPendek(sab) });
    }
  });

  // ── 4b) Cicilan hutang + sisa operasional (7 Okt 2026) ──
  var cic = _zdKasCicilan(hutangRows, akunMap, jr, today, horizon);
  cic.items.forEach(function(o) { obligations.push(o); });
  var ops = _zdKasOperasional(anggaranRows, akunMap, jr, today.slice(0, 7));
  if (ops.sisa > 0) obligations.push({ tgl: today, amt: ops.sisa, sup: 'OPERASIONAL', bonId: null, jenis: 'operasional',
    label: 'Sisa anggaran bulan ini' });

  var due14 = obligations.filter(function(o) { return o.tgl && o.tgl <= horizon; });
  var butuh14   = due14.reduce(function(s, o) { return s + o.amt; }, 0);
  var terlambat = due14.filter(function(o) { return o.tgl < today; }).reduce(function(s, o) { return s + o.amt; }, 0);
  var butuhSabtu = obligations.filter(function(o) { return o.jenis === 'dropship' && o.tgl <= sabtuIni; })
    .reduce(function(s, o) { return s + o.amt; }, 0);
  // Rincian per jenis (8 Okt 2026): dashboard harus jelas ANGKA ITU PUNYA SIAPA —
  // dropship (bayar Sabtu) vs PO reseller (DP saat barang jadi + sisa tempo 14 hari).
  function _sumJ(arr) { return arr.reduce(function(s, o) { return s + o.amt; }, 0); }
  var isDrop     = function(o) { return o.jenis === 'dropship'; };
  var isPo       = function(o) { return o.jenis === 'dp' || o.jenis === 'sisa'; };
  var isCic      = function(o) { return o.jenis === 'cicilan'; };
  var isOps      = function(o) { return o.jenis === 'operasional'; };
  var isLate     = function(o) { return o.tgl < today; };
  var butuhDrop14 = _sumJ(due14.filter(isDrop));
  var butuhPo14   = _sumJ(due14.filter(isPo));
  var butuhCic14  = _sumJ(due14.filter(isCic));
  var butuhOps14  = _sumJ(due14.filter(isOps));
  var lateDrop    = _sumJ(due14.filter(function(o) { return isDrop(o) && isLate(o); }));
  var latePo      = _sumJ(due14.filter(function(o) { return isPo(o) && isLate(o); }));
  var lateCic     = _sumJ(due14.filter(function(o) { return isCic(o) && isLate(o); }));
  var lateNames   = [];
  due14.filter(isLate).forEach(function(o) { if (lateNames.indexOf(o.sup) < 0) lateNames.push(o.sup); });

  var rasio = butuh14 > 0 ? kasTotal / butuh14 : null;
  var covStatus = rasio == null ? 'hijau' : (rasio >= C.covHijau ? 'hijau' : (rasio >= C.covKuning ? 'kuning' : 'merah'));

  // ── 5) Tracker batch reseller (alokasi sisa stok: barang terbaru yang masih ada) ──
  var batchIds = batches.map(function(x) { return x.bon.id; });
  var itemRows = batchIds.length ? await dbGet('hutang_bon_item', '&bon_id=in.(' + batchIds.join(',') + ')') : [];
  var itemsByBon = {};
  (itemRows || []).forEach(function(it) { (itemsByBon[it.bon_id] = itemsByBon[it.bon_id] || []).push(it); });

  var barangMap = {}; barangRows.forEach(function(x) { barangMap[x.id] = x; });
  var produkMap = {}; produkRows.forEach(function(x) { produkMap[x.id] = x; });
  var sisaMap = {};
  (typeof _dashStokData !== 'undefined' ? _dashStokData : []).forEach(function(r) {
    var k = String(r.sku_variasi || '').toUpperCase();
    if (k) sisaMap[k] = Number(r.sisa) || 0;
  });

  var perSku = {};
  batches.forEach(function(bt) {
    bt.items = []; bt.untracked = 0;
    (itemsByBon[bt.bon.id] || []).forEach(function(it) {
      var qty  = it.qty_diterima != null ? Number(it.qty_diterima) : Number(it.qty);
      var cost = (Number(it.harga_satuan) || 0) / 12;     // harga_satuan tersimpan per LUSIN
      var br = barangMap[it.barang_id];
      var pr = br && br.produk_id ? produkMap[br.produk_id] : null;
      var sku = pr && pr.sku_variasi ? String(pr.sku_variasi).toUpperCase() : '';
      if (!(qty > 0)) return;
      if (!sku || sisaMap[sku] === undefined) { bt.untracked++; return; }
      var row = { sku: sku, qty: qty, cost: cost, remain: qty };
      bt.items.push(row);
      (perSku[sku] = perSku[sku] || []).push({ bt: bt, it: row });
    });
  });
  Object.keys(perSku).forEach(function(sku) {
    var arr = perSku[sku].slice().sort(function(x, y) {
      if (y.bt.tgl !== x.bt.tgl) return y.bt.tgl > x.bt.tgl ? 1 : -1;
      return y.bt.bon.id - x.bt.bon.id;
    });
    var R = Math.max(0, sisaMap[sku]);
    arr.forEach(function(e) { var rem = Math.min(R, e.it.qty); e.it.remain = rem; R -= rem; });
  });

  var tracker = [];
  batches.forEach(function(bt) {
    if (bt.sisaHutang <= 0) return;                      // sudah lunas → tidak ada tekanan kas
    var recv = 0, laku = 0;
    bt.items.forEach(function(it) { recv += it.qty * it.cost; laku += (it.qty - it.remain) * it.cost; });
    var hari = Math.max(0, _zdKasDiffDays(bt.tgl, today));
    var pct  = recv > 0 ? laku / recv : null;
    var status = pct == null ? 'kuning' : _zdKasStatusBatch(hari, pct);
    tracker.push({
      bonId: bt.bon.id, sup: bt.sup, tgl: bt.tgl, hari: hari, pct: pct, target: _zdKasTargetBatch(hari),
      status: status, sisaHutang: bt.sisaHutang, tempoTgl: bt.tempoTgl, modalRecv: recv,
      untracked: bt.untracked, tanpaData: pct == null
    });
  });
  tracker.sort(function(a, b) { return _zdKasRank(b.status) - _zdKasRank(a.status) || (a.tgl < b.tgl ? -1 : 1); });

  // ── 6) Status gabungan: terburuk menang + alasan ──
  var signals = [];
  if (rasio != null && covStatus !== 'hijau') {
    signals.push({ st: covStatus, txt: 'Kas ' + _fmtRp(kasTotal) + ' baru ' + (Math.round(rasio * 10) / 10).toString().replace('.', ',') +
      '× kebutuhan ' + C.horizonHari + ' hari (' + _fmtRp(butuh14) + ': supplier ' + _fmtRp(butuhDrop14 + butuhPo14) +
      ' · cicilan ' + _fmtRp(butuhCic14) + ' · operasional ' + _fmtRp(butuhOps14) + ')' });
  }
  tracker.forEach(function(t) {
    if (t.status === 'hijau') return;
    if (t.tanpaData) {
      signals.push({ st: 'kuning', txt: t.sup + ' ' + _zdKasTglPendek(t.tgl) + ': barang belum ter-link ke produk, sell-through tidak bisa dihitung' });
      return;
    }
    signals.push({ st: t.status, txt: t.sup + ' ' + _zdKasTglPendek(t.tgl) + ': hari ke-' + t.hari + ' baru ' + _zdKasPctTxt(t.pct) +
      ' modal laku (target ≥' + _zdKasPctTxt(t.hari >= C.targetHari ? C.targetPct : t.target) + ')' });
  });
  var status = covStatus;
  tracker.forEach(function(t) { status = _zdKasWorst(status, t.status); });
  var top = signals.filter(function(s) { return s.st === status; });
  var reason;
  if (status === 'hijau') {
    reason = butuh14 > 0
      ? 'Kas ' + _fmtRp(kasTotal) + ' cukup menutup kebutuhan ' + C.horizonHari + ' hari (' + _fmtRp(butuh14) + ': supplier ' + _fmtRp(butuhDrop14 + butuhPo14) +
        ' · cicilan ' + _fmtRp(butuhCic14) + ' · operasional ' + _fmtRp(butuhOps14) + ')' + (tracker.length ? ', batch reseller sesuai target.' : '.')
      : 'Tidak ada kewajiban supplier, cicilan, maupun sisa anggaran operasional untuk ' + C.horizonHari + ' hari ke depan.';
  } else {
    // Semua sinyal dengan status terburuk ditulis satu per baris (maks 3) — dulu "(+1 lainnya)"
    // tidak menyebut apa lainnya itu. Baris dipisah \n, ditampilkan lewat white-space:pre-line.
    reason = top.slice(0, 3).map(function(x) { return x.txt + '.'; }).join('\n') +
      (top.length > 3 ? '\n+' + (top.length - 3) + ' sinyal lain, lihat tab Stok & Supplier.' : '');
  }

  return {
    today: today, horizon: horizon, sabtuIni: sabtuIni, status: status, covStatus: covStatus, reason: reason,
    saldoKas: saldoKas, escrow: escrow, escrowLive: escrowLive, kasTotal: kasTotal,
    butuh14: butuh14, terlambat: terlambat, butuhSabtu: butuhSabtu, rasio: rasio,
    butuhDrop14: butuhDrop14, butuhPo14: butuhPo14, butuhCic14: butuhCic14, butuhOps14: butuhOps14,
    lateDrop: lateDrop, latePo: latePo, lateCic: lateCic, lateNames: lateNames,
    cicTanpaTgl: cic.tanpaTgl, cicTanpaAkun: cic.tanpaAkun, anggaranBulan: anggaranBulan, opsAnggaran: ops.anggaran,
    obligations: obligations, due14: due14, tracker: tracker,
    poBelumJadi: poBelumJadi, diLuarAturan: diLuarAturan, fallbackTgl: fallbackTgl,
    kasOk: !!(window._dashKasAkunMap && window._dashJurnalAllData)
  };
}

function _zdKasPaint(d) {
  var badge = document.getElementById('zd-kas-badge');
  if (!badge) return;
  var lbl = { hijau: 'Cepat', kuning: 'Sedang', merah: 'Lambat' };
  badge.className = 'nw-slide-value zdk-status ' + d.status;      // teks besar di slot angka, warna ikut status
  badge.textContent = lbl[d.status];
  _zdKasSetReason(d.reason);                                      // alasan lewat ikon (?)

  var covTxt = d.rasio == null ? '—' : (Math.round(d.rasio * 10) / 10).toString().replace('.', ',') + '×';
  var subEl = document.getElementById('zd-kas-sub');
  if (subEl) subEl.textContent = d.rasio == null ? 'tidak ada kebutuhan kas ' + ZD_KAS_CFG.horizonHari + ' hari'
    : 'Kecukupan kas ' + covTxt + ' · aman ≥ ' + String(ZD_KAS_CFG.covHijau).replace('.', ',') + '×';
  // Setiap angka diberi keterangan jenisnya (dropship / PO reseller) + siapa yang lewat tempo
  var lateJenis = [];
  if (d.lateDrop > 0) lateJenis.push('dropship');
  if (d.latePo   > 0) lateJenis.push('PO reseller');
  if (d.lateCic  > 0) lateJenis.push('cicilan');
  var lateNm = (d.lateNames || []).slice(0, 3).join(', ') + ((d.lateNames || []).length > 3 ? ' +' + (d.lateNames.length - 3) : '');
  var tiles = [
    { l: 'Kecukupan ' + ZD_KAS_CFG.horizonHari + ' hari', v: covTxt, c: d.rasio == null ? '' : d.covStatus,
      s: d.rasio == null ? 'tidak ada tagihan' : '' },
    { l: 'Kebutuhan ' + ZD_KAS_CFG.horizonHari + ' hari', v: _fmtRp(d.butuh14), c: '',
      s: 'supplier ' + _fmtRp(d.butuhDrop14 + d.butuhPo14) + ' · cicilan ' + _fmtRp(d.butuhCic14) + ' · operasional ' + _fmtRp(d.butuhOps14) }
  ];
  if (d.terlambat > 0) tiles.push({ l: 'Sudah lewat tempo', v: _fmtRp(d.terlambat), c: 'merah',
    s: lateJenis.join(' + ') + ' belum dibayar' + (lateNm ? ' · ' + lateNm : '') });
  tiles.push(
    { l: 'Saldo kas', v: _fmtRp(d.kasTotal), c: '',
      s: d.escrowLive ? 'escrow ' + _fmtRp(d.escrow) + ' belum dihitung' : '' },
    { l: 'Bayar Sabtu ' + _zdKasTglPendek(d.sabtuIni), v: _fmtRp(d.butuhSabtu), c: '',
      s: d.lateDrop > 0 ? 'dropship + tunggakan ' + _fmtRp(d.lateDrop) : 'dropship minggu ini' }
  );
  var grid = document.getElementById('zd-kas-stats');
  if (grid) grid.innerHTML = tiles.map(function(t) {
    return '<div class="zdk-tile"><div class="zdk-tile-l">' + _zdKasEsc(t.l) + '</div>' +
      '<div class="zdk-tile-v ' + t.c + '">' + _zdKasEsc(t.v) + '</div>' +
      '<div class="zdk-tile-s">' + _zdKasEsc(t.s) + '</div></div>';
  }).join('');

  var warn = document.getElementById('zd-kas-warn');
  if (warn) {
    var w = [];
    if (!d.kasOk) w.push('Saldo kas belum terbaca, hasil bisa terlalu rendah.');
    if (d.poBelumJadi && d.poBelumJadi.n > 0) w.push('PO belum diterima: ' + d.poBelumJadi.n + ' bon (' + _fmtRp(d.poBelumJadi.sisa) + '), belum masuk tagihan.');
    if (d.fallbackTgl > 0) w.push(d.fallbackTgl + ' bon reseller tidak punya tanggal diterima, dipakai tanggal bon.');
    if (d.cicTanpaTgl > 0) w.push(d.cicTanpaTgl + ' hutang tidak punya tanggal cicilan, tidak dihitung.');
    if (d.cicTanpaAkun > 0) w.push(d.cicTanpaAkun + ' hutang belum terhubung ke akun kewajiban, dianggap belum dibayar.');
    if (d.anggaranBulan && d.anggaranBulan !== d.today.slice(0, 7)) w.push('Anggaran bulan ini belum ada, memakai anggaran ' + d.anggaranBulan + '.');
    warn.innerHTML = w.map(function(x) { return '<div>' + _zdKasEsc(x) + '</div>'; }).join('');
    warn.style.display = w.length ? '' : 'none';
  }

  // ── Tab Stok & Supplier: tracker batch ──
  var bl = document.getElementById('zd-kas-batch-list');
  if (bl) {
    if (!d.tracker.length) {
      bl.innerHTML = '<div class="dash-kg-empty">Tidak ada batch reseller yang masih punya sisa hutang.</div>';
    } else {
      bl.innerHTML = d.tracker.map(function(t) {
        var pctW = t.pct == null ? 0 : Math.min(100, Math.round(t.pct * 100));
        var tgtW = Math.min(100, Math.round((t.hari >= ZD_KAS_CFG.targetHari ? ZD_KAS_CFG.targetPct : t.target) * 100));
        return '<div class="zdk-row">' +
          '<div class="zdk-row-top"><div class="zdk-row-nm">' + _zdKasEsc(t.sup) + ' · barang jadi ' + _zdKasTglPendek(t.tgl) +
          '<span class="zdk-row-sub"> · hari ke-' + t.hari + '</span></div>' +
          '<span class="zdk-chip ' + t.status + '">' + (t.status === 'hijau' ? 'Aman' : t.status === 'kuning' ? 'Waspada' : 'Bahaya') + '</span></div>' +
          (t.tanpaData
            ? '<div class="zdk-row-sub">Barang di bon ini belum ter-link ke produk — sell-through tidak bisa dihitung.</div>'
            : '<div class="zdk-bar"><div class="zdk-bar-fill ' + t.status + '" style="width:' + pctW + '%"></div><div class="zdk-bar-tgt" style="left:' + tgtW + '%"></div></div>' +
              '<div class="zdk-row-sub">' + _zdKasPctTxt(t.pct) + ' modal laku · target ' + _zdKasPctTxt(t.hari >= ZD_KAS_CFG.targetHari ? ZD_KAS_CFG.targetPct : t.target) +
              (t.hari >= ZD_KAS_CFG.targetHari ? '' : ' hari ini (' + _zdKasPctTxt(ZD_KAS_CFG.targetPct) + ' di hari ke-' + ZD_KAS_CFG.targetHari + ')') + '</div>') +
          '<div class="zdk-row-sub">Sisa hutang ' + _fmtRp(t.sisaHutang) + ' · jatuh tempo ' + _zdKasTglPendek(t.tempoTgl) +
          (t.untracked > 0 ? ' · ' + t.untracked + ' item belum ter-link' : '') + '</div>' +
        '</div>';
      }).join('');
    }
  }

  // ── Tab Keuangan: kewajiban supplier ──
  var dl = document.getElementById('zd-kas-due-list');
  if (dl) {
    var rows = d.due14.slice().sort(function(a, b) { return a.tgl < b.tgl ? -1 : a.tgl > b.tgl ? 1 : 0; });
    var html = '';
    if (!rows.length) {
      html += '<div class="dash-kg-empty">Tidak ada kewajiban supplier yang jatuh tempo ' + ZD_KAS_CFG.horizonHari + ' hari ke depan.</div>';
    } else {
      html += rows.slice(0, 12).map(function(o) {
        var late = o.tgl < d.today;
        return '<div class="zdk-row"><div class="zdk-row-top"><div class="zdk-row-nm">' + _zdKasEsc(o.sup) +
          '<span class="zdk-row-sub"> · ' + _zdKasEsc(o.label) + '</span></div>' +
          '<div class="zdk-row-amt">' + _fmtRp(o.amt) + '</div></div>' +
          '<div class="zdk-row-sub">' + (late ? '<span class="zdk-late">Lewat tempo</span> · ' : '') + 'jatuh tempo ' + _zdKasTglPendek(o.tgl) + '</div></div>';
      }).join('');
      if (rows.length > 12) html += '<div class="zdk-row-sub" style="padding-top:6px">+' + (rows.length - 12) + ' kewajiban lain</div>';
    }
    var notes = [];
    if (d.poBelumJadi.n > 0) notes.push('PO belum jadi: ' + d.poBelumJadi.n + ' bon (' + _fmtRp(d.poBelumJadi.sisa) + '). DP baru jatuh tempo saat barang jadi, belum dihitung.');
    if (d.diLuarAturan.n > 0) notes.push('Di luar aturan tempo: ' + d.diLuarAturan.n + ' bon (' + _fmtRp(d.diLuarAturan.sisa) + '), tidak dihitung.');
    html += notes.map(function(x) { return '<div class="zdk-note">' + _zdKasEsc(x) + '</div>'; }).join('');
    dl.innerHTML = html;
  }
}

// Alasan status disimpan di ikon (?) dan ditampilkan sebagai bubble saat diketuk.
// Bubble TETAP sampai diketuk lagi / ketuk di luar / scroll (alasannya bisa 3 baris).
function _zdKasSetReason(txt) {
  var h = document.getElementById('zd-kas-help');
  if (h) h.setAttribute('data-reason', txt || '');
  var b = document.getElementById('zd-kas-bubble');
  if (b) b.textContent = txt || '';
}
function zdKasHint(el) {
  var lama = document.getElementById('zd-kas-bubble');
  if (lama) { lama.remove(); return; }                      // ketuk (?) lagi = tutup
  var b = document.createElement('div');
  b.id = 'zd-kas-bubble'; b.className = 'zdk-bubble';
  b.textContent = el.getAttribute('data-reason') || '';
  document.body.appendChild(b);
  var r = el.getBoundingClientRect();
  var w = b.offsetWidth;
  b.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
  b.style.top = (r.bottom + 8) + 'px';
  var tutup = function(ev) {
    if (ev && ev.target && ev.target.closest && ev.target.closest('#zd-kas-help')) return;   // toggle ditangani onclick (?)
    var x = document.getElementById('zd-kas-bubble'); if (x) x.remove();
    document.removeEventListener('click', tutup, true);
    window.removeEventListener('scroll', tutup, true);
    window.removeEventListener('resize', tutup, true);
  };
  setTimeout(function() {
    document.addEventListener('click', tutup, true);
    window.addEventListener('scroll', tutup, true);
    window.addEventListener('resize', tutup, true);
  }, 0);
}
window.zdKasHint = zdKasHint;

function _zdKasPaintError(e) {
  var badge = document.getElementById('zd-kas-badge');
  if (badge) { badge.className = 'nw-slide-value zdk-status'; badge.textContent = 'Tidak tersedia'; }
  var subEl = document.getElementById('zd-kas-sub');
  if (subEl) subEl.textContent = 'gagal dihitung';
  _zdKasSetReason('Gagal menghitung kecepatan kas: ' + (e && e.message ? e.message : e) + '. Tekan Refresh untuk mencoba lagi.');
}

async function zdKasRender() {
  if (_zdKasRunning) { _zdKasPending = true; return; }
  _zdKasRunning = true;
  try {
    var d = await _zdKasHitung();
    _zdKasData = d;
    _zdKasPaint(d);
  } catch (e) {
    console.warn('[KecepatanKas]', e);
    _zdKasPaintError(e);
  } finally {
    _zdKasRunning = false;
    if (_zdKasPending) { _zdKasPending = false; zdKasRender(); }
  }
}
window.zdKasRender = zdKasRender;

(function() {
  if (document.getElementById('zd-kas-style')) return;
  var s = document.createElement('style');
  s.id = 'zd-kas-style';
  s.textContent = [
    '.zdk-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px}',
    '.zdk-badge{display:inline-flex;align-items:center;gap:7px;padding:4px 14px;border-radius:20px;font-weight:700;font-size:15px;background:var(--cream2);color:var(--ink3)}',
    '.zdk-badge.hijau{background:rgba(76,175,80,.16);color:var(--ok)}',
    '.zdk-badge.kuning{background:rgba(255,193,7,.18);color:var(--warn)}',
    '.zdk-badge.merah{background:rgba(224,82,82,.16);color:var(--danger)}',
    '.zdk-dot{width:9px;height:9px;border-radius:50%;background:currentColor;flex-shrink:0}',
    '.zdk-reason{font-size:13px;color:var(--ink2);line-height:1.45;margin-bottom:10px}',
    '.zdk-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}',
    '@media (max-width:760px){.zdk-stats{grid-template-columns:repeat(2,1fr)}}',
    '.zdk-tile{background:var(--cream2);border-radius:8px;padding:8px 10px;min-width:0}',
    '.zdk-tile-l{font-size:11px;color:var(--ink3)}',
    '.zdk-tile-v{font-size:16px;font-weight:700;margin:2px 0;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
    '.zdk-tile-v.hijau{color:var(--ok)}.zdk-tile-v.kuning{color:var(--warn)}.zdk-tile-v.merah{color:var(--danger)}',
    '.zdk-tile-s{font-size:11px;color:var(--ink3)}',
    '.zdk-warn{font-size:11px;color:var(--warn);margin-top:8px}',
    '.zdk-link{font-size:12px;color:var(--ink3);cursor:pointer;text-decoration:underline dashed;background:none;border:none;padding:0;font-family:inherit}',
    '.zdk-links{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px}',
    '.zdk-row{padding:8px 0;border-bottom:1px dashed var(--ink4)}',
    '.zdk-row:last-child{border-bottom:none}',
    '.zdk-row-top{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '.zdk-row-nm{font-size:13px;font-weight:700;min-width:0}',
    '.zdk-row-amt{font-size:13px;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}',
    '.zdk-row-sub{font-size:11px;color:var(--ink3);font-weight:400;margin-top:2px}',
    '.zdk-chip{font-size:11px;font-weight:700;padding:2px 9px;border-radius:12px;white-space:nowrap}',
    '.zdk-chip.hijau{background:rgba(76,175,80,.16);color:var(--ok)}',
    '.zdk-chip.kuning{background:rgba(255,193,7,.18);color:var(--warn)}',
    '.zdk-chip.merah{background:rgba(224,82,82,.16);color:var(--danger)}',
    '.zdk-bar{position:relative;height:7px;background:var(--cream4);border-radius:4px;margin:6px 0 2px;overflow:visible}',
    '.zdk-bar-fill{height:100%;border-radius:4px;background:var(--ok)}',
    '.zdk-bar-fill.kuning{background:var(--warn)}.zdk-bar-fill.merah{background:var(--danger)}',
    '.zdk-bar-tgt{position:absolute;top:-3px;width:2px;height:13px;background:var(--ink)}',
    '.zdk-late{color:var(--danger);font-weight:700}',
    '.zdk-note{font-size:11px;color:var(--ink3);margin-top:8px}',
    '#nw-swipe-container .zdk-status{color:var(--ink3)}',
    '#nw-swipe-container .zdk-status.hijau{color:var(--ok)}',
    '#nw-swipe-container .zdk-status.kuning{color:var(--warn)}',
    '#nw-swipe-container .zdk-status.merah{color:var(--danger)}',
    '.zdk-help{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;border:1px solid var(--ink4);background:transparent;color:var(--ink3);font-size:10px;font-weight:700;line-height:1;padding:0;cursor:pointer;font-family:inherit;text-transform:none;letter-spacing:0;flex-shrink:0}',
    '.zdk-help:hover{color:var(--ink);border-color:var(--ink3)}',
    '.zdk-bubble{position:fixed;z-index:9999;max-width:min(300px,calc(100vw - 16px));background:#2b2b2b;color:#fff;font-size:12px;line-height:1.45;font-weight:500;padding:9px 12px;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.25);white-space:pre-line;text-transform:none;letter-spacing:0}'
  ].join('\n');
  document.head.appendChild(s);
})();
