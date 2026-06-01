// ─── DASHBOARD.JS v4 — Full Edition ──────────────────────────
// Fitur baru v4: AOV, HPP vs Omset/Laba Kotor, Performa per Channel,
//   Grafik Omset per Katalog, Turnover Rate Stok, Ringkasan Beban,
//   Tooltip hover chart penjualan, Distribusi status stok

document.getElementById('page-dashboard').innerHTML = `

  <!-- ═══ ALERT STRIP ════════════════════════════════════════ -->
  <div id="dash-alerts-wrap"></div>

  <!-- ═══ ROW 1: 4 METRIC CARDS ════════════════════════════════ -->
  <div class="metrics" id="dash-metrics">
    <div class="metric">
      <div class="m-label">Total SKU Aktif</div>
      <div class="m-value" id="d-sku">—</div>
      <div class="m-delta">produk terdaftar</div>
      <div class="doodle"><i class="ti ti-package"></i></div>
    </div>
    <div class="metric">
      <div class="m-label">Nilai Stok</div>
      <div class="m-value" id="d-nilaiStok">—</div>
      <div class="m-delta">HPP × sisa stok</div>
      <div class="doodle"><i class="ti ti-coin"></i></div>
    </div>
    <div class="metric" id="card-kritis" onclick="window._restockFilterKritis=true;var btn=Array.prototype.find.call(document.querySelectorAll('.nav-item'),function(b){return b.getAttribute('onclick')&&b.getAttribute('onclick').indexOf('restock')!==-1;})||null;gotoPage('restock',btn);" style="cursor:pointer;transition:background .15s" onmouseover="this.style.background='rgba(224,82,82,0.08)'" onmouseout="this.style.background=''">
      <div class="m-label">SKU Kritis</div>
      <div class="m-value" id="d-kritis">—</div>
      <div class="m-delta">stok ≤ 3 · klik untuk restock</div>
      <div class="doodle"><i class="ti ti-alert-triangle"></i></div>
    </div>
    <div class="metric">
      <div class="m-label">Saldo Kas</div>
      <div class="m-value" id="d-saldo">—</div>
      <div class="m-delta">dari jurnal</div>
      <div class="doodle"><i class="ti ti-receipt"></i></div>
    </div>
  </div>

  <!-- ═══ ROW 2: 4 METRIC CARDS ════════════════════════════════ -->
  <div class="metrics">
    <div class="metric">
      <div class="m-label">Omset Bulan Ini</div>
      <div class="m-value" id="d-omset">—</div>
      <div class="m-delta" id="d-omset-delta">dari jurnal penjualan</div>
      <div class="doodle"><i class="ti ti-trending-up"></i></div>
    </div>
    <div class="metric">
      <div class="m-label">Target Harian</div>
      <div class="m-value" id="d-target-harian">—</div>
      <div class="m-delta">
        <div id="d-target-harian-bar-wrap" style="margin-top:4px;display:none">
          <div style="background:var(--cream4);height:6px;border-radius:3px;overflow:hidden;border:1px solid var(--ink4)">
            <div id="d-target-harian-bar" style="height:100%;background:var(--ok);transition:width .5s;width:0%"></div>
          </div>
          <span id="d-target-harian-pct" style="font-size:10px;color:var(--ink3)">0%</span>
        </div>
      </div>
      <div class="doodle"><i class="ti ti-calendar"></i></div>
    </div>
    <div class="metric">
      <div class="m-label">Target Omset <span class="target-link" onclick="openTargetModal()">✎ set</span></div>
      <div class="m-value" id="d-target" style="cursor:pointer" onclick="openTargetModal()">—</div>
      <div class="m-delta">
        <div id="d-target-bar-wrap" style="margin-top:4px;display:none">
          <div style="background:var(--cream4);height:6px;border-radius:3px;overflow:hidden;border:1px solid var(--ink4)">
            <div id="d-target-bar" style="height:100%;background:var(--ok);transition:width .5s;width:0%"></div>
          </div>
          <span id="d-target-pct" style="font-size:10px;color:var(--ink3)">0%</span>
        </div>
      </div>
      <div class="doodle"><i class="ti ti-target"></i></div>
    </div>
    <div class="metric">
      <div class="m-label">Order Hari Ini</div>
      <div style="display:flex;align-items:baseline;gap:8px;margin-top:4px">
        <div class="m-value" id="d-order-qty" style="margin:0">—</div>
        <div style="font-size:11px;color:var(--ink3);font-weight:400;line-height:1">pcs</div>
        <div class="m-value" id="d-order-omset" style="margin:0;color:var(--ok)">—</div>
      </div>
      <div class="m-delta" id="d-order-hari-delta">belum ada order hari ini</div>
      <div class="doodle"><i class="ti ti-shopping-bag"></i></div>
    </div>
  </div>

  <!-- ═══ ROW 2b: METRIC BARU — AOV + LABA KOTOR + BEBAN ═══════ -->
  <div class="metrics">
    <div class="metric">
      <div class="m-label">AOV Bulan Ini</div>
      <div class="m-value" id="d-aov">—</div>
      <div class="m-delta">rata-rata per transaksi</div>
      <div class="doodle"><i class="ti ti-calculator"></i></div>
    </div>
    <div class="metric">
      <div class="m-label">Est. Laba Kotor</div>
      <div class="m-value" id="d-laba">—</div>
      <div class="m-delta" id="d-laba-delta">omset − HPP terjual</div>
      <div class="doodle"><i class="ti ti-chart-bar"></i></div>
    </div>
    <div class="metric" style="cursor:pointer" onclick="var b=Array.prototype.find.call(document.querySelectorAll('.nav-item'),function(x){return x.getAttribute('onclick')&&x.getAttribute('onclick').indexOf('keuangan')!==-1;});gotoPage('keuangan',b);setTimeout(function(){keuGotoTab('aruskas');},400);" title="Lihat detail Arus Kas">
      <div class="m-label">Beban vs Kas</div>
      <div class="m-value" id="d-beban">—</div>
      <div class="m-delta" id="d-beban-delta">bulan ini</div>
      <div id="d-beban-realisasi" style="font-size:11px;color:var(--ink3);margin-top:2px"></div>
      <div class="doodle"><i class="ti ti-arrows-exchange"></i></div>
    </div>
    <div class="metric">
      <div class="m-label">Est. Laba Bersih</div>
      <div class="m-value" id="d-laba-bersih">—</div>
      <div class="m-delta">laba kotor − beban</div>
      <div class="doodle"><i class="ti ti-trophy"></i></div>
    </div>
  </div>

  <!-- ═══ ROW 3: GRAFIK PENJUALAN + TOP SKU ════════════════════ -->
  <div class="grid2" style="margin-bottom:12px">

    <div class="card" style="overflow:visible">
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
      <!-- id="trench-ch-wrap" dipertahankan kosong (tidak dipakai lagi tapi referensi JS lama aman) -->
      <div id="trench-ch-wrap" style="display:none"></div>
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

    <div class="card">
      <div class="card-title"><i class="ti ti-trophy"></i> Top 5 SKU Terlaris</div>
      <div id="dash-top-sku">
        <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
      </div>
    </div>

  </div>

  <!-- ═══ ROW 4: STATUS STOK + PERFORMA BOSS ═══════════════════ -->
  <div class="grid2" style="margin-bottom:12px">

    <div class="card card-lined">
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

    <div class="card">
      <div class="card-title"><i class="ti ti-users"></i> Performa Supplier</div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Supplier</th><th>Qty</th><th>Omset</th><th>%</th></tr></thead>
        <tbody id="dash-boss-tbody">
          <tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
        </tbody>
      </table></div>
    </div>

  </div>

  <!-- ═══ ROW 5: PERFORMA CHANNEL + GRAFIK OMSET PER KATALOG ═══ -->
  <div class="grid2" style="margin-bottom:12px">

    <div class="card">
      <div class="card-title"><i class="ti ti-building-store"></i> Performa per Channel / Toko</div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Channel</th><th>Trx</th><th>Qty</th><th>Omset</th><th>%</th></tr></thead>
        <tbody id="dash-channel-tbody">
          <tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
        </tbody>
      </table></div>
    </div>

    <div class="card">
      <div class="card-title"><i class="ti ti-chart-bar"></i> Omset per Katalog / SKU Induk</div>
      <div style="position:relative;height:220px;width:100%">
        <canvas id="dash-chart-katalog" style="width:100%;height:100%;display:block"></canvas>
        <div id="dash-katalog-empty" style="display:none;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--ink3);font-style:italic;font-size:13px">
          Belum ada data
        </div>
      </div>
    </div>

  </div>

  <!-- ═══ ROW 6: RINGKASAN BEBAN + JURNAL TERAKHIR ════════════ -->
  <div class="grid2" style="margin-bottom:12px">

    <div class="card">
      <div class="card-title"><i class="ti ti-report-money"></i> Ringkasan Beban Operasional</div>
      <div id="dash-beban-wrap">
        <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><i class="ti ti-list"></i> Jurnal Terakhir</div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Tgl</th><th>Keterangan</th><th>Debit</th><th>Kredit</th></tr></thead>
        <tbody id="dash-jurnal-tbody">
          <tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
        </tbody>
      </table></div>
    </div>

  </div>

  <!-- ═══ ROW 7: AKTIVITAS FEED ════════════════════════════════ -->
  <div class="grid2" style="margin-bottom:12px">
    <div class="card" style="grid-column:1/-1">
      <div class="card-title"><i class="ti ti-clock"></i> Aktivitas Terbaru</div>
      <div id="dash-aktivitas-feed" style="display:flex;flex-direction:column;gap:0">
        <div style="color:var(--ink3);font-style:italic;font-size:13px">Memuat...</div>
      </div>
    </div>
  </div>

  <!-- ═══ FOOTER ════════════════════════════════════════════════ -->
  <div style="text-align:right;margin-top:4px;display:flex;align-items:center;justify-content:space-between">
    <span id="dash-last-refresh" style="font-size:11px;color:var(--ink3)"></span>
    <button class="btn btn-sm" onclick="loadDashboard()"><i class="ti ti-refresh"></i> Refresh</button>
  </div>

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
    .beban-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--ink4);font-size:13px}
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
function openTargetModal() {
  idrSet('inp-target-omset', _getTarget() || 0);
  document.getElementById('modal-target').classList.add('open');
  setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('modal-target')); }, 50);
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
    reseller:{label:'Reseller',icon:'👥'},
    tiktok:{label:'TikTok',icon:'🎵'},
    lazada:{label:'Lazada',icon:'📦'},
    offline:{label:'Offline',icon:'🏪'}
  };
  var katOrder = ['toko_utama','reseller','tiktok','lazada','offline'];
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
      // Pakai addEventListener — lebih reliable daripada onclick di innerHTML
      row.addEventListener('click', function(e) {
        e.stopPropagation();
        trenchToggleCh(row);
      });
      row.addEventListener('touchend', function(e) {
        e.preventDefault();
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

function trenchBuildChannelList() { /* deprecated */ }
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
function _trenchResetAll() {
  _trenchPeriod   = 30;
  _trenchChannels = [];
  _dashPeriod     = 30;
  _trenchJPData   = _dashJPData;
  trenchCloseAll();
  _trenchRenderChart();
  trenchUpdateBadge();
}

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
  var chipsEl = document.getElementById('trench-active-chips');

  var parts = [];
  if (_trenchPeriod !== 30) parts.push(waktuMap[_trenchPeriod] || String(_trenchPeriod)+' Hari');
  if (_trenchChannels.length > 0) parts.push(_trenchChannels.length + ' channel');

  // Update active chips di header
  var html = '';
  if (_trenchPeriod !== 30) {
    html += '<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:#EE4D2D;color:#fff;font-weight:700">' + (waktuMap[_trenchPeriod]||_trenchPeriod) + '</span>';
  }
  _trenchChannels.forEach(function(id) {
    var ch = _dashChannelMap[id];
    if (ch) html += '<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:var(--cream2);border:1px solid var(--ink3);color:var(--ink);font-weight:600">' + ch.nama + '</span>';
  });
  if (chipsEl) chipsEl.innerHTML = html;

  // Update badge channel di menu
  var bdgCh = document.getElementById('trench-badge-channel');
  if (bdgCh) bdgCh.textContent = _trenchChannels.length > 0 ? '· ' + _trenchChannels.length + ' dipilih' : '';

  // Tombol Reset otomatis — muncul bila ada filter non-default aktif
  var resetBtn = document.getElementById('trench-reset-btn');
  var filterAktif = (_trenchPeriod !== 30) || (_trenchChannels.length > 0);
  if (resetBtn) resetBtn.style.display = filterAktif ? 'inline-flex' : 'none';
}

// ─── PERIOD TOGGLE (LAMA — dipertahankan agar tidak break referensi lain) ──
function dashTogglePeriodMenu() { /* intentionally disabled — pakai trenchTogglePanel() */ }
function setDashPeriod(days, label) {
  _dashPeriod = days;
  _trenchPeriod = days;
  _renderChartPenjualan(_dashJPData);
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
  const colLine='#3ddb6b', colFill='rgba(61,219,107,0.07)', colGrid='rgba(255,255,255,0.06)', colLabel='#909090';

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
  ctx.beginPath(); ctx.strokeStyle=colLine; ctx.lineWidth=2.5; ctx.lineJoin='round';
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
  const colLine='#3ddb6b', colFill='rgba(61,219,107,0.07)', colGrid='rgba(255,255,255,0.06)', colLabel='#909090';

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

  ctx.beginPath(); ctx.strokeStyle=colLine; ctx.lineWidth=2.5; ctx.lineJoin='round';
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
  const colLine='#3ddb6b', colFill='rgba(61,219,107,0.07)', colGrid='rgba(255,255,255,0.06)', colLabel='#909090';

  for (let i=0; i<=4; i++) {
    const y = padT + cH - cH*i/4;
    ctx.strokeStyle=colGrid; ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+cW,y); ctx.stroke();
    ctx.fillStyle=colLabel; ctx.font='10px sans-serif'; ctx.textAlign='right';
    ctx.fillText(_fmtRpShort(maxVal*i/4), padL-4, y+3);
  }

  const step = cW / Math.max(labels.length-1, 1);

  ctx.fillStyle='rgba(200,160,0,0.12)';
  ctx.fillRect(padL+cW-step*0.6, padT, step*0.6+padR, cH);

  ctx.beginPath();
  ctx.moveTo(padL, padT+cH);
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0?ctx.lineTo(x,y):ctx.lineTo(x,y); });
  ctx.lineTo(padL+(totals.length-1)*step, padT+cH);
  ctx.closePath(); ctx.fillStyle=colFill; ctx.fill();

  ctx.beginPath(); ctx.strokeStyle=colLine; ctx.lineWidth=2.5; ctx.lineJoin='round';
  totals.forEach((v,i) => { const x=padL+i*step, y=padT+cH-(v/maxVal)*cH; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.stroke();

  // Simpan koordinat titik untuk tooltip
  _dashChartPoints = [];
  const skip = Math.ceil(labels.length/7);
  totals.forEach((v,i) => {
    const x=padL+i*step, y=padT+cH-(v/maxVal)*cH;
    _dashChartPoints.push({ x, y, label: labels[i], date: dates[i], val: v });
    ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2);
    ctx.fillStyle=v>0?colLine:colGrid; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();
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
      const my = e.clientY - rect.top;
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

// ─── BOSS CHART ──────────────────────────────────────────────
function _renderBoss(jpData, stokData) {
  const skuBossMap = {};
  stokData.forEach(r => {
    if (r.sku_variasi && r.boss)
      skuBossMap[(r.sku_variasi||'').toUpperCase()] = r.boss;
  });
  const bossMap = {};
  jpData.forEach(r => {
    const boss = skuBossMap[(r.sku||'').toUpperCase()] || 'Lainnya';
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
  const r  = Math.min(cx, cy) - 10;
  const inner = r * 0.46;
  let angle = -Math.PI/2;
  sorted.forEach(([,d],i) => {
    const slice = (d.omset/totalOmset)*Math.PI*2;
    if (slice<=0) return;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,angle,angle+slice);
    ctx.closePath();
    ctx.fillStyle=colors[i%colors.length]; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.stroke();
    angle += slice;
  });
  ctx.beginPath(); ctx.arc(cx,cy,inner,0,Math.PI*2);
  ctx.fillStyle='#ede7d9'; ctx.fill();
  ctx.fillStyle='#1c1a14'; ctx.font='bold 12px sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(_fmtRpShort(totalOmset),cx,cy-7);
  ctx.font='10px sans-serif'; ctx.fillStyle='#6b6354';
  ctx.fillText('total omset',cx,cy+8);

  const legendEl = document.getElementById('dash-boss-legend');
  if (legendEl) {
    legendEl.innerHTML = sorted.map(([boss,d],i) => {
      const pct = totalOmset>0?(d.omset/totalOmset*100).toFixed(0):0;
      return '<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;white-space:nowrap">' +
        '<span style="width:9px;height:9px;border-radius:50%;background:'+colors[i%colors.length]+';flex-shrink:0;display:inline-block;box-shadow:0 0 0 1px rgba(255,255,255,0.6)"></span>' +
        '<span style="font-size:11px;font-weight:700;color:var(--ink);text-shadow:0 0 3px rgba(237,231,217,0.9),0 0 6px rgba(237,231,217,0.9)">'+boss+'</span>' +
        '<span style="font-size:11px;font-weight:700;color:'+colors[i%colors.length]+';text-shadow:0 0 3px rgba(237,231,217,0.9),0 0 6px rgba(237,231,217,0.9)">'+pct+'%</span>' +
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
  const cx=W/2, cy=H/2, r=Math.min(cx,cy)-10, inner=r*0.46;
  let angle=-Math.PI/2;
  sorted.forEach(([,d],i) => {
    const slice=(d.omset/totalOmset)*Math.PI*2;
    if(slice<=0) return;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,angle,angle+slice);
    ctx.closePath();
    ctx.fillStyle=colors[i%colors.length]; ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.stroke();
    angle+=slice;
  });
  ctx.beginPath(); ctx.arc(cx,cy,inner,0,Math.PI*2);
  ctx.fillStyle='#ede7d9'; ctx.fill();
  ctx.fillStyle='#1c1a14'; ctx.font='bold 12px sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(_fmtRpShort(totalOmset),cx,cy-7);
  ctx.font='10px sans-serif'; ctx.fillStyle='#6b6354';
  ctx.fillText(sorted.length+' channel',cx,cy+8);

  // Legend
  const legendEl = document.getElementById('dash-channel-legend');
  if (legendEl) {
    legendEl.innerHTML = sorted.map(([ch,d],i) => {
      const pct = totalOmset>0?(d.omset/totalOmset*100).toFixed(0):0;
      return '<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;white-space:nowrap">' +
        '<span style="width:9px;height:9px;border-radius:50%;background:'+colors[i%colors.length]+';flex-shrink:0;display:inline-block;box-shadow:0 0 0 1px rgba(255,255,255,0.6)"></span>' +
        '<span style="font-size:11px;font-weight:700;color:var(--ink);text-shadow:0 0 3px rgba(237,231,217,0.9),0 0 6px rgba(237,231,217,0.9)">'+ch+'</span>' +
        '<span style="font-size:11px;font-weight:700;color:'+colors[i%colors.length]+';text-shadow:0 0 3px rgba(237,231,217,0.9),0 0 6px rgba(237,231,217,0.9)">'+pct+'%</span>' +
      '</div>';
    }).join('');
  }
}

// ─── GRAFIK OMSET PER KATALOG — BARU ─────────────────────────
function _renderKatalog(jpData, stokData) {
  const canvas = document.getElementById('dash-chart-katalog');
  if (!canvas) return;

  // Map sku → katalog
  const skuKatalogMap = {};
  stokData.forEach(r => {
    if (r.sku_variasi && r.katalog)
      skuKatalogMap[(r.sku_variasi||'').toUpperCase()] = r.katalog;
  });

  const katMap = {};
  jpData.forEach(r => {
    const kat = skuKatalogMap[(r.sku||'').toUpperCase()] || 'Lainnya';
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

  const padL=10, padR=10, padT=10, padB=10;
  const labelRightW = 90; // ruang label kanan, cukup untuk Rp999rb + qty
  const barH    = Math.floor((H-padT-padB-(sorted.length-1)*8) / sorted.length);
  const trackW  = W - padL - padR - labelRightW;

  sorted.forEach(([kat,d],i) => {
    const y   = padT + i*(barH+8);
    const pct = maxO>0 ? d.omset/maxO : 0;
    const bw  = Math.round(pct * trackW);

    // Background track
    ctx.fillStyle='rgba(28,26,20,0.06)';
    ctx.fillRect(padL, y, trackW, barH);

    // Bar
    ctx.fillStyle=colors[i%colors.length];
    if (bw > 0) ctx.fillRect(padL, y, bw, barH);

    // Label katalog (kiri, di dalam bar jika panjang, atau di luar)
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = pct > 0.25 ? '#fff' : '#1c1a14';
    ctx.fillText(kat, padL+5, y+barH/2);

    // Nilai omset (kanan bar) — clipped agar tidak keluar canvas
    ctx.save();
    ctx.rect(padL+trackW, 0, labelRightW-padR, H);
    ctx.clip();
    ctx.fillStyle = '#1c1a14';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(_fmtRpShort(d.omset), padL+trackW+6, y+barH/2-5);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#6b6354';
    ctx.fillText(d.qty+' pcs', padL+trackW+6, y+barH/2+7);
    ctx.restore();
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
  const el = document.getElementById('dash-beban-wrap');
  if (!el) return;
  if (!bebanData || !bebanData.length) {
    el.innerHTML = '<div style="color:var(--ink3);font-style:italic;font-size:13px">Belum ada beban bulan ini. Catat via Kas &amp; Jurnal → pilih akun kelompok Beban.</div>';
    return;
  }

  // Hitung total beban (nominal)
  let totalNominal = 0;
  const rows = bebanData.map(r => {
    const nominal = Number(r.nominal || r.jumlah || 0);
    totalNominal += nominal;
    return { nama: r.nama_beban || r.nama || '—', nominal, persen: Number(r.beban_persen||0) };
  });

  const pctDariOmset = omsetBln>0 ? (totalNominal/omsetBln*100).toFixed(1) : null;
  const labaBersihEst = omsetBln - totalNominal;

  el.innerHTML =
    rows.map(r =>
      '<div class="beban-row">' +
        '<span style="font-size:13px">' + r.nama + '</span>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          (r.persen>0 ? '<span style="font-size:11px;color:var(--ink3)">'+r.persen+'%</span>' : '') +
          '<span style="font-size:13px;font-weight:700;color:var(--danger)">' + _fmtRp(r.nominal) + '</span>' +
        '</div>' +
      '</div>'
    ).join('') +
    '<div class="beban-row" style="margin-top:6px;border-top:2px solid var(--ink)">' +
      '<span style="font-size:13px;font-weight:700">Total Beban</span>' +
      '<span style="font-size:14px;font-weight:700;color:var(--danger)">' + _fmtRp(totalNominal) +
        (pctDariOmset ? ' <span style="font-size:11px;font-weight:400;color:var(--ink3)">('+pctDariOmset+'% omset)</span>' : '') +
      '</span>' +
    '</div>';
}

// ─── AKTIVITAS FEED ───────────────────────────────────────────
function _renderAktivitas(jpData, jurnalData) {
  const feed = document.getElementById('dash-aktivitas-feed');
  if (!feed) return;
  const items = [];
  jpData.slice(0,6).forEach(r => {
    const ch = _dashChannelMap[r.channel_id];
    items.push({
      type:'sell',
      text:'Jual <b>'+(r.sku||'?')+'</b> ×'+(r.qty||0)+' — '+_fmtRp(r.total),
      sub: (ch?ch.nama+' · ':'')+_fmtTgl(r.tanggal),
      ts:  r.created_at||r.tanggal
    });
  });
  jurnalData.slice(0,3).forEach(r => {
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
  if (!items.length) { feed.innerHTML='<div style="color:var(--ink3);font-style:italic;font-size:13px">Belum ada aktivitas</div>'; return; }
  feed.innerHTML = items.slice(0,8).map(item =>
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

    const [produkData, stokRaw, jurnalData, _jpData30, jurnalAllData, channelData, _unused, kasAkunRaw, jpAllTime] = await Promise.all([
      dbGet('produk', '&order=katalog.asc,sku_variasi.asc'),
      dbGet('stok'),
      dbGet('jurnal', '&order=created_at.desc&limit=8'),
      dbGet('jurnal_penjualan', '&tanggal=gte.' + _localDateOffset(30) + '&order=tanggal.desc'),
      dbGet('jurnal'),
      dbGet('channels').catch(() => []),
      dbGet('jurnal', '&order=tanggal.desc').catch(() => []),
      dbGet('kas_akun', '').catch(() => []),
      dbGet('jurnal_penjualan', '&select=sku,qty').catch(() => []) // all-time untuk hitung sisa stok
    ]);
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

    _dashStokData = (produkData || []).map(p => {
      const skuKey = (p.sku_variasi || '').toUpperCase();
      const masuk  = stokMasukMap[skuKey] ? stokMasukMap[skuKey].qty : 0;
      const keluar = keluarMap[skuKey] || 0;
      const sisa   = masuk - keluar;
      return {
        sku_variasi:     p.sku_variasi,
        katalog:         p.katalog,
        boss:            p.boss,
        hpp:             p.hpp || 0,
        kategori_produk: p.kategori_produk || 'aktif',
        stok_masuk:      masuk,
        stok_keluar:     keluar,
        sisa,
        nilai_stok:      sisa > 0 ? sisa * (p.hpp || 0) : 0
      };
    });

    _dashJPData   = jpData || [];
    _trenchJPData = jpChart30 || _dashJPData; // chart default 30 hari terakhir
    _dashChannelMap = {};
    (channelData||[]).forEach(ch => { _dashChannelMap[ch.id] = ch; });

    // ─ Metric 1-4
    const kritis    = _dashStokData.filter(r => r.sisa <= 3 && (r.kategori_produk || 'aktif') === 'aktif').length;
    const nilaiStok = _dashStokData.reduce((s,r) => s + (r.nilai_stok || 0), 0);
    // ─ Saldo KAS: hanya akun sub_kelompok 'KAS & BANK' — debit masuk, kredit keluar
    const saldo = (jurnalAllData || []).reduce((s, r) => {
      const n  = Number(r.nominal || r.debit || 0);
      const aD = _dashKasAkunMap[r.akun_debit_id];
      const aK = _dashKasAkunMap[r.akun_kredit_id];
      const isKasDebit  = aD && aD.kelompok === 'aset' && (aD.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK';
      const isKasKredit = aK && aK.kelompok === 'aset' && (aK.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK';
      if (isKasDebit)  return s + n;
      if (isKasKredit) return s - n;
      return s;
    }, 0);

    document.getElementById('d-sku').textContent       = _dashStokData.length;
    document.getElementById('d-kritis').textContent    = kritis + ' sku' + (kritis>0?'!':'');
    document.getElementById('d-kritis').style.color    = kritis>0?'var(--danger)':'var(--ok)';
    document.getElementById('d-nilaiStok').textContent = _fmtRp(nilaiStok);
    document.getElementById('d-saldo').textContent     = (saldo>=0?'+':'')+_fmtRp(Math.abs(saldo));
    document.getElementById('d-saldo').style.color     = saldo>=0?'var(--ok)':'var(--danger)';

    // ─ Trigger Net Worth update (networth.js)
    if (typeof nwUpdate === 'function') nwUpdate();

    // ─ Metric 5-8
    const jpBulan   = _dashJPData.filter(r => r.tanggal && String(r.tanggal).slice(0,7) === todayYM);
    const jpHariIni = _dashJPData.filter(r => r.tanggal && String(r.tanggal).slice(0,10) === today);
    const omsetBln  = jpBulan.reduce((s,r)=>s+(Number(r.total)||0),0);
    const omsetHari = jpHariIni.reduce((s,r)=>s+(Number(r.total)||0),0);
    const aov       = jpBulan.length>0 ? Math.round(omsetBln/jpBulan.length) : 0;

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

    // ─ AOV — BARU
    const elAov = document.getElementById('d-aov');
    if (elAov) {
      elAov.textContent = aov>0 ? _fmtRp(aov) : '—';
    }

    // ─ HPP terjual & Laba Kotor — BARU
    const hppMap = {};
    _dashStokData.forEach(r => { hppMap[(r.sku_variasi||'').toUpperCase()] = r.hpp||0; });
    const totalHppTerjual = jpBulan.reduce((s,r) => {
      const hpp = hppMap[(r.sku||'').toUpperCase()] || 0;
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

    // ─ Alerts
    _renderAlerts(_dashStokData, saldo);

    // ─ Distribusi Status Stok — BARU
    _renderStokDist(_dashStokData);

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
      .filter(r => (r.kategori_produk || 'aktif') === 'aktif')
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

    // ─ Jurnal terakhir
    const jurnalRecent = (jurnalData||[]).slice(0,5);
    document.getElementById('dash-jurnal-tbody').innerHTML = jurnalRecent.length===0
      ? '<tr><td colspan="4" style="color:var(--ink3);font-style:italic">Belum ada jurnal</td></tr>'
      : jurnalRecent.map(r => '<tr><td>'+_fmtTgl(r.tanggal||r.created_at)+'</td><td>'+(r.keterangan||'—')+'</td><td style="color:var(--ok)">'+(r.debit?_fmtRp(r.debit):'—')+'</td><td style="color:var(--danger)">'+(r.kredit?_fmtRp(r.kredit):'—')+'</td></tr>').join('');

    // ─ Render semua chart & widget
    const _jpForChart  = _dashJPData;
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
      if (typeof rerenderUI === "function") rerenderUI(document.getElementById("page-dashboard"));
    }, 300); // FIX: dinaikkan agar canvas punya offsetWidth saat dirender

    // ─ Aktivitas feed
    _renderAktivitas(_dashJPData.slice(0,6), jurnalData||[]);

    // ─ Timestamp
    const tsEl = document.getElementById('dash-last-refresh');
    if (tsEl) tsEl.textContent = 'Terakhir diperbarui: '+new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});

  } catch(err) {
    const wrap = document.getElementById('dash-alerts-wrap');
    if (wrap) wrap.innerHTML = '<div class="dash-alert-item danger"><i class="ti ti-wifi-off" style="color:var(--danger)"></i><span>Gagal memuat data: '+err.message+'. Periksa koneksi internet.</span></div>';
    console.error('[dashboard] error:', err);
  }
}

loadDashboard();

// ─── AUTO-RELOAD SAAT NAVIGASI KE HALAMAN INI ────────────────
// Debounce 400ms: cegah double-fire jika menu diklik cepat
(function() {
  var _t = null;
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'dashboard') return;
    clearTimeout(_t);
    _t = setTimeout(loadDashboard, 400);
  });
})();

// ─── BEBAN VS KAS — update metric card dari data arus kas ────
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
    const wallet = cache ? Number(cache.wallet_balance || 0) : 0;
    const totalKas = saldoKas + escrow + wallet;

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

  } catch(e) { console.warn('[BebanVsKas]', e); }
}
