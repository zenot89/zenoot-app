// proyeksi-harga.js v2 — Pricing Engine, data dari Supabase
// Toko: channels (kategori=toko_utama), HPP: produk (group by katalog)
// Beban%/NPM%/TargetNPM%: channel_beban
// Tidak ada localStorage, tidak ada Setting/HPP/Platform tab.

(function () {
  var _phInited = false;

  document.addEventListener('zenot:page', function (e) {
    if (!e.detail || e.detail.page !== 'proyeksi-harga') return;
    if (_phInited) { _phOnShow(); return; }
    _phInited = true;
    _phBoot();
  });

  function _phOnShow() {
    // Re-fetch setiap kali halaman dibuka (data bisa berubah di channel-master/produk)
    if (typeof _phRefresh === 'function') _phRefresh();
  }

  function _phBoot() {
    var pg = document.getElementById('page-proyeksi-harga');
    if (!pg) return;

    if (!document.getElementById('ph-font-link')) {
      var lnk = document.createElement('link');
      lnk.id   = 'ph-font-link';
      lnk.rel  = 'stylesheet';
      lnk.href = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
      document.head.appendChild(lnk);
    }

    // Force re-inject CSS setiap boot agar perubahan style langsung aktif
    var _phOldStyle = document.getElementById('ph-style');
    if (_phOldStyle) _phOldStyle.remove();
    var s = document.createElement('style');
    s.id = 'ph-style';
    s.textContent = PH_CSS;
    document.head.appendChild(s);

    pg.innerHTML = PH_HTML;
    pg.style.cssText = 'padding:0;overflow:hidden;height:100%;';
    phApp(pg);
  }

  /* ═══════════════════════════════════════════════════════════════
     CSS
  ═══════════════════════════════════════════════════════════════ */
  var PH_CSS = [
    '#page-proyeksi-harga{--ph-bg:#121212;--ph-panel:#181818;--ph-panel2:#1f1f1f;--ph-border:#2c2c2c;--ph-border-s:#232323;--ph-text:#ece9e4;--ph-dim:#9b968d;--ph-faint:#635f58;--ph-accent:#ece9e4;--ph-accent-dim:rgba(236,233,228,0.07);--ph-ink:#121212;--ph-danger:#c98f8f;--ph-ok:#8fc98f;--ph-r:6px;--ph-mono:"IBM Plex Mono",monospace;--ph-display:"Source Serif 4",Georgia,serif;}',
    '#page-proyeksi-harga.active{display:flex;flex-direction:column;background:var(--ph-bg);color:var(--ph-text);font-family:var(--body,Inter,sans-serif);overflow:hidden;}',
    '#ph-shell{display:flex;flex:1;min-height:0;overflow:hidden;}',
    '#ph-tabs-bar{display:none;}',
    '#ph-main{flex:1;min-width:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:22px 20px 56px;}',
    '#page-proyeksi-harga .ph-pane{display:none;}',
    '#page-proyeksi-harga .ph-pane.ph-active{display:block;}',
    /* Header */
    '#ph-hdr{margin-bottom:18px;}',
    '#ph-hdr h2{font-family:var(--ph-display);font-size:24px;font-weight:500;margin:0 0 4px;letter-spacing:-.005em;color:var(--ph-text);}',
    '#ph-hdr .ph-sub{color:var(--ph-dim);font-size:12.5px;line-height:1.5;}',
    '#ph-hdr-action{margin-top:10px;display:flex;align-items:flex-end;justify-content:space-between;gap:10px;flex-wrap:wrap;}',
    /* Toko selector */
    '#ph-toko-select{background:var(--ph-panel2);border:1px solid var(--ph-border);color:var(--ph-text);border-radius:6px;padding:7px 10px;font-family:var(--ph-mono);font-size:13px;cursor:pointer;min-width:140px;}',
    '#ph-toko-select:focus{outline:none;border-color:var(--ph-dim);}',
    /* Panel */
    '#page-proyeksi-harga .ph-panel{background:var(--ph-panel);border:1px solid var(--ph-border);border-radius:var(--ph-r);padding:18px;margin-bottom:14px;}',
    '#page-proyeksi-harga .ph-panel-title{font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--ph-faint);margin:0 0 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}',
    /* Loading / empty */
    '#page-proyeksi-harga .ph-loading{color:var(--ph-faint);font-size:13px;padding:20px 0;text-align:center;}',
    '#page-proyeksi-harga .ph-empty{color:var(--ph-faint);font-size:12.5px;padding:8px 2px;line-height:1.5;}',
    '#page-proyeksi-harga .ph-error-box{background:rgba(201,143,143,.1);border:1px solid rgba(201,143,143,.3);color:#d9b3b3;border-radius:6px;padding:12px 14px;font-size:13px;margin-top:12px;}',
    '#page-proyeksi-harga .ph-info-box{background:rgba(255,255,255,.03);border:1px solid var(--ph-border-s);color:var(--ph-faint);border-radius:6px;padding:10px 13px;font-size:12px;margin-bottom:14px;line-height:1.6;}',
    /* Grid */
    '#page-proyeksi-harga .ph-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}',
    '#page-proyeksi-harga .ph-grid2 .ph-panel{margin-bottom:0;}',
    '#page-proyeksi-harga .ph-field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;}',
    /* Labels & inputs */
    '#page-proyeksi-harga label.ph-label{display:block;font-size:11px;color:var(--ph-faint);margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em;}',
    '#page-proyeksi-harga .ph-input-wrap{position:relative;}',
    '#page-proyeksi-harga .ph-input-wrap .ph-prefix{position:absolute;left:9px;top:50%;transform:translateY(-50%);font-family:var(--ph-mono);font-size:12px;color:var(--ph-faint);pointer-events:none;}',
    '#page-proyeksi-harga .ph-input-wrap .ph-suffix{position:absolute;right:9px;top:50%;transform:translateY(-50%);font-family:var(--ph-mono);font-size:12px;color:var(--ph-faint);pointer-events:none;}',
    '#page-proyeksi-harga .ph-input-wrap input{padding-left:28px;}',
    '#page-proyeksi-harga .ph-input-wrap.ph-suf input{padding-right:24px;padding-left:10px;}',
    '#page-proyeksi-harga input[type=text],#page-proyeksi-harga input[type=number]{background:var(--ph-panel2);border:1px solid var(--ph-border-s);color:var(--ph-text);border-radius:6px;padding:8px 10px;font-family:inherit;font-size:13px;width:100%;box-sizing:border-box;}',
    '#page-proyeksi-harga input[type=text]:focus,#page-proyeksi-harga input[type=number]:focus{outline:none;border-color:var(--ph-dim);}',
    '#page-proyeksi-harga input:disabled{opacity:.4;cursor:not-allowed;}',
    '#page-proyeksi-harga textarea{width:100%;min-height:100px;resize:vertical;background:var(--ph-bg);border:1px solid var(--ph-border-s);color:var(--ph-text);border-radius:6px;padding:9px;font-family:var(--ph-mono);font-size:12px;line-height:1.5;box-sizing:border-box;}',
    '#page-proyeksi-harga textarea:focus{outline:none;border-color:var(--ph-dim);}',
    /* Buttons */
    '#page-proyeksi-harga .ph-btn{font-family:inherit;font-weight:600;font-size:12.5px;cursor:pointer;border-radius:6px;border:1px solid var(--ph-border-s);padding:7px 12px;background:var(--ph-panel2);color:var(--ph-text);white-space:nowrap;}',
    '#page-proyeksi-harga .ph-btn:hover{border-color:#3a3a3a;}',
    '#page-proyeksi-harga .ph-btn:disabled{opacity:.45;cursor:not-allowed;}',
    '#page-proyeksi-harga .ph-btn-accent{background:var(--ph-accent);border-color:var(--ph-accent);color:var(--ph-ink);}',
    '#page-proyeksi-harga .ph-btn-accent:hover{filter:brightness(.92);}',
    '#page-proyeksi-harga .ph-btn-ghost{background:none;border-color:var(--ph-border-s);color:var(--ph-dim);}',
    '#page-proyeksi-harga .ph-btn-sm{padding:5px 9px;font-size:12px;}',
    '#page-proyeksi-harga .ph-add-row{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;}',
    /* Platform tabs (used in Pesanan pane) */
    '#page-proyeksi-harga .ph-ptabs{display:flex;gap:8px;flex-wrap:wrap;}',
    '#page-proyeksi-harga .ph-ptab{flex:1;min-width:100px;border-radius:6px;border:1px solid var(--ph-border-s);background:var(--ph-panel2);padding:10px 12px;cursor:pointer;text-align:left;}',
    '#page-proyeksi-harga .ph-ptab .ph-ptab-name{font-weight:600;font-size:13.5px;}',
    '#page-proyeksi-harga .ph-ptab .ph-ptab-def{font-family:var(--ph-mono);font-size:11px;color:var(--ph-faint);margin-top:2px;}',
    '#page-proyeksi-harga .ph-ptab[data-active="true"]{border-color:var(--ph-dim);background:var(--ph-accent-dim);}',
    '#page-proyeksi-harga .ph-saved{font-family:var(--ph-mono);font-size:11px;color:var(--ph-dim);opacity:0;transition:opacity .3s;}',
    /* Tab bar */
    '#ph-tab-bar{display:flex;gap:4px;border-bottom:1px solid var(--ph-border);margin-bottom:18px;}',
    '#ph-tab-bar button{background:none;border:none;color:var(--ph-faint);font-family:inherit;font-size:13px;padding:8px 14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;display:flex;align-items:center;gap:6px;}',
    '#ph-tab-bar button:hover{color:var(--ph-dim);}',
    '#ph-tab-bar button.ph-tab-active{color:var(--ph-text);border-bottom-color:var(--ph-text);font-weight:600;}',
    '#page-proyeksi-harga .ph-saved.ph-show{opacity:1;}',
    /* Hero */
    '#page-proyeksi-harga .ph-hero{margin-top:4px;padding:22px 18px;border-radius:8px;background:var(--ph-panel2);border:1px solid var(--ph-border);text-align:center;}',
    '#page-proyeksi-harga .ph-hero-label{font-family:var(--ph-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ph-faint);}',
    '#page-proyeksi-harga .ph-hero-num{font-family:var(--ph-display);font-size:36px;font-weight:500;margin-top:6px;letter-spacing:-.005em;}',
    '#page-proyeksi-harga .ph-hero-sub{font-size:12px;color:var(--ph-dim);margin-top:6px;}',
    /* Metrics grid */
    '#page-proyeksi-harga .ph-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px;}',
    '#page-proyeksi-harga .ph-metric{background:var(--ph-panel2);border:1px solid var(--ph-border-s);border-radius:6px;padding:10px 12px;}',
    '#page-proyeksi-harga .ph-mlabel{font-family:var(--ph-mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ph-faint);margin-bottom:6px;}',
    '#page-proyeksi-harga .ph-mval{font-size:16px;font-weight:700;color:var(--ph-text);line-height:1.2;}',
    '#page-proyeksi-harga .ph-mval-sub{font-family:var(--ph-mono);font-size:11px;color:var(--ph-faint);margin-top:3px;}',
    /* Bar */
    '#page-proyeksi-harga .ph-bar-wrap{margin-top:14px;}',
    '#page-proyeksi-harga .ph-bar{height:10px;border-radius:4px;overflow:hidden;display:flex;background:#232323;}',
    '#page-proyeksi-harga .ph-seg{height:100%;}',
    '#page-proyeksi-harga .ph-leg-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:5px;}',
    /* Tables */
    '#page-proyeksi-harga .ph-tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px;}',
    '#page-proyeksi-harga .ph-tbl{width:100%;border-collapse:collapse;font-size:12.5px;min-width:560px;}',
    '#page-proyeksi-harga .ph-tbl thead th{background:var(--ph-panel2);padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--ph-faint);border-bottom:1px solid var(--ph-border);}',
    '#page-proyeksi-harga .ph-tbl thead th.num{text-align:right;}',
    '#page-proyeksi-harga .ph-tbl tbody td{padding:7px 8px;border-top:1px solid var(--ph-border-s);}',
    '#page-proyeksi-harga .ph-tbl tbody td.num{text-align:right;font-family:var(--ph-mono);}',
    '#page-proyeksi-harga .ph-tbl .ph-total td{font-weight:700;border-top:2px solid var(--ph-dim);}',
    '#page-proyeksi-harga .ph-tbl tr.ph-sel{background:var(--ph-accent-dim);}',
    /* Parse boxes */
    '#page-proyeksi-harga details.ph-parse-box{margin-top:14px;border:1px solid var(--ph-border-s);border-radius:6px;background:var(--ph-panel2);overflow:hidden;}',
    '#page-proyeksi-harga details.ph-parse-box summary{cursor:pointer;list-style:none;padding:10px 13px;font-size:13px;font-weight:600;color:var(--ph-dim);display:flex;align-items:center;gap:8px;user-select:none;}',
    '#page-proyeksi-harga details.ph-parse-box summary::-webkit-details-marker{display:none;}',
    '#page-proyeksi-harga details.ph-parse-box summary::before{content:"\\25B8";font-size:11px;color:var(--ph-faint);transition:transform .15s;}',
    '#page-proyeksi-harga details.ph-parse-box[open] summary::before{transform:rotate(90deg);}',
    '#page-proyeksi-harga .ph-parse-body{padding:0 13px 14px;border-top:1px solid var(--ph-border-s);}',
    '#page-proyeksi-harga .ph-parse-hint{font-size:11.5px;color:var(--ph-faint);margin:10px 0 7px;line-height:1.5;}',
    '#page-proyeksi-harga .ph-parse-actions{display:flex;gap:8px;margin-top:9px;flex-wrap:wrap;}',
    '#page-proyeksi-harga .ph-parse-status{font-size:12px;margin-top:9px;padding:8px 10px;border-radius:6px;line-height:1.5;}',
    '#page-proyeksi-harga .ph-parse-status.ok{background:rgba(255,255,255,.04);border:1px solid var(--ph-border);color:var(--ph-dim);}',
    '#page-proyeksi-harga .ph-parse-status.fail{background:rgba(201,143,143,.08);border:1px solid rgba(201,143,143,.3);color:#d9b3b3;}',
    '#page-proyeksi-harga .ph-parse-preview{margin-top:10px;padding:9px 11px;background:var(--ph-bg);border:1px solid var(--ph-border-s);border-radius:6px;font-family:var(--ph-mono);font-size:12px;color:var(--ph-dim);}',
    '#page-proyeksi-harga .ph-parse-preview b{color:var(--ph-text);}',
    /* Summary foot */
    '#page-proyeksi-harga .ph-summary-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;flex-wrap:wrap;}',
    /* Channel info badge */
    '#ph-ch-badge{font-family:var(--ph-mono);font-size:11px;color:var(--ph-faint);padding:5px 9px;border:1px solid var(--ph-border-s);border-radius:6px;display:none;}',
    /* Toast */
    '#ph-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(10px);background:var(--ph-panel2);border:1px solid var(--ph-border);color:var(--ph-text);padding:9px 15px;border-radius:6px;font-size:13px;opacity:0;pointer-events:none;transition:all .25s;z-index:99999;max-width:90vw;text-align:center;}',
    '#ph-toast.ph-show{opacity:1;transform:translateX(-50%) translateY(0);}',
    /* Rekap bar */
    '#ph-rekap-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px;}',
    '#ph-rekap-bar .ph-rbar-label{font-size:11px;color:var(--ph-faint);text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;}',
    '#ph-rekap-bar input[type=date]{background:var(--ph-panel2);border:1px solid var(--ph-border-s);color:var(--ph-text);border-radius:6px;padding:6px 9px;font-size:12.5px;font-family:var(--ph-mono);cursor:pointer;}',
    '#ph-rekap-bar input[type=date]:focus{outline:none;border-color:var(--ph-dim);}',
    '#ph-rekap-paste-panel{display:none;margin-bottom:14px;border:1px solid var(--ph-border-s);border-radius:8px;background:var(--ph-panel2);overflow:hidden;}',
    '#ph-rekap-paste-panel.open{display:block;}',
    '#ph-rekap-paste-inner{padding:12px 14px 14px;}',
    '#ph-rekap-paste-panel textarea{height:180px;font-size:12px;}',
    '#ph-rekap-history .ph-hist-tbl{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px;min-width:700px;}',
    '#ph-rekap-history .ph-hist-tbl th{background:var(--ph-panel2);padding:5px 7px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--ph-faint);border-bottom:1px solid var(--ph-border);}',
    '#ph-rekap-history .ph-hist-tbl th.num{text-align:right;}',
    '#ph-rekap-history .ph-hist-tbl td{padding:6px 7px;border-top:1px solid var(--ph-border-s);font-family:var(--ph-mono);}',
    '#ph-rekap-history .ph-hist-tbl td.num{text-align:right;}',
    '#ph-rekap-history .ph-hist-tbl td.pos{color:var(--ph-ok);}',
    '#ph-rekap-history .ph-hist-tbl td.neg{color:var(--ph-danger);}',
    '@media(max-width:600px){#ph-main{padding:14px 12px 48px;}#page-proyeksi-harga .ph-grid2{grid-template-columns:1fr;}#page-proyeksi-harga .ph-field-row{grid-template-columns:1fr;}#ph-rekap-bar{gap:6px;}}',
  ].join('\n');

  /* ═══════════════════════════════════════════════════════════════
     HTML
  ═══════════════════════════════════════════════════════════════ */
  var PH_HTML =
    '<div id="ph-shell">' +
      '<div id="ph-main">' +
        '<div id="ph-tab-bar">' +
          '<button onclick="switchPhSection(\'proyeksi-ringkasan\',this)" class="ph-tab-active"><i class="ti ti-bar-chart"></i>Proyeksi Harga</button>' +
          '<button onclick="switchPhSection(\'pesanan\',this)"><i class="ti ti-receipt"></i>Pesanan</button>' +
          '<button onclick="switchPhSection(\'biaya\',this)"><i class="ti ti-layout-grid"></i>Price Analysis</button>' +
          '<button onclick="switchPhSection(\'rekap\',this)"><i class="ti ti-chart-bar"></i>Rekap Toko</button>' +
        '</div>' +
        '<div id="ph-hdr">' +
          '<h2 id="ph-heading">Proyeksi Harga</h2>' +
          '<div class="ph-sub" id="ph-sub">Harga jual minimum per SKU — berdasarkan HPP, beban operasional, dan target NPM.</div>' +
          '<div id="ph-hdr-action">' +
            '<div>' +
              '<label class="ph-label">Toko</label>' +
              '<select id="ph-toko-select"><option value="">Memuat toko...</option></select>' +
            '</div>' +
            '<div style="display:flex;align-items:flex-end;gap:10px;">' +
              '<div id="ph-ch-badge"></div>' +
              '<div id="ph-acos-aff-global"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* Pane: Pesanan & Pembayaran */
        '<section class="ph-pane" id="ph-pane-pesanan">' +
          '<div class="ph-grid2">' +
            '<div class="ph-panel"><div class="ph-panel-title"><span>Rincian Penghasilan</span><span style="color:var(--ph-faint);font-weight:400;text-transform:none;letter-spacing:0">sisi penjual</span></div><div class="ph-parse-hint">Paste seluruh detail "Rincian Penghasilan" dari halaman pesanan platform.</div><textarea id="ph-penghasilan-ta" placeholder="Paste teks Rincian Penghasilan..."></textarea><div id="ph-penghasilan-status"></div><div class="ph-parse-preview" id="ph-penghasilan-preview"></div></div>' +
            '<div class="ph-panel"><div class="ph-panel-title"><span>Pembayaran Pembeli</span><span style="color:var(--ph-faint);font-weight:400;text-transform:none;letter-spacing:0">sisi pembeli</span></div><div class="ph-parse-hint">Paste detail "Total Pembayaran Pembeli" dari sisi pembeli.</div><textarea id="ph-pembayaran-ta" placeholder="Paste teks Pembayaran Pembeli..."></textarea><div id="ph-pembayaran-status"></div><div class="ph-parse-preview" id="ph-pembayaran-preview"></div></div>' +
          '</div>' +
          '<div style="margin-top:10px;"><button class="ph-btn ph-btn-accent" id="ph-pesanan-action-btn">Parse Otomatis</button></div>' +
        '</section>' +

        /* Pane: Rekap Toko */
        '<section class="ph-pane" id="ph-pane-rekap">' +
          '<div class="ph-panel">' +
            '<div class="ph-panel-title"><span>Rekap Toko</span></div>' +
            /* Bar: toko + tgl awal + tgl akhir + tombol paste */
            '<div id="ph-rekap-bar">' +
              '<span class="ph-rbar-label">Toko</span>' +
              '<select id="ph-rekap-toko-sel" style="background:var(--ph-panel2);border:1px solid var(--ph-border-s);color:var(--ph-text);border-radius:6px;padding:6px 9px;font-family:var(--ph-mono);font-size:12.5px;cursor:pointer;"></select>' +
              '<span class="ph-rbar-label" style="margin-left:4px">Dari</span>' +
              '<input type="date" id="ph-rekap-tgl-awal">' +
              '<span class="ph-rbar-label">s/d</span>' +
              '<input type="date" id="ph-rekap-tgl-akhir">' +
              '<button class="ph-btn ph-btn-sm" id="ph-rekap-toggle-btn" style="margin-left:4px">+ Input Data</button>' +
            '</div>' +
            /* Paste panel — hidden by default */
            '<div id="ph-rekap-paste-panel">' +
              '<div id="ph-rekap-paste-inner">' +
                '<div class="ph-parse-hint" style="margin-top:0;margin-bottom:8px">Paste kolom NILAI dari spreadsheet HASIL (tanpa header).</div>' +
                '<textarea id="ph-rekap-ta" placeholder="Paste data rekap di sini..."></textarea>' +
                '<div id="ph-rekap-status" style="margin-top:8px"></div>' +
                '<div id="ph-rekap-preview" class="ph-parse-preview" style="margin-top:8px"></div>' +
                '<div style="margin-top:10px;display:flex;gap:8px">' +
                  '<button class="ph-btn ph-btn-accent ph-btn-sm" id="ph-rekap-parse-btn">Proses Data</button>' +
                  '<button class="ph-btn ph-btn-sm" id="ph-rekap-save-btn" style="display:none">Simpan ke Supabase</button>' +
                  '<button class="ph-btn ph-btn-ghost ph-btn-sm" id="ph-rekap-cancel-btn">Batal</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
            /* History table */
            '<div id="ph-rekap-history"></div>' +
          '</div>' +
        '</section>' +

        /* Pane: Price Analysis */
        '<section class="ph-pane" id="ph-pane-biaya">' +
          '<div class="ph-panel"><div class="ph-panel-title">Total Biaya & Benefit (per order)</div><div id="ph-biaya-empty" class="ph-parse-hint">Paste "Rincian Penghasilan" di section Pesanan dulu untuk lihat total biaya & benefit real per order.</div><div class="ph-metrics" id="ph-biaya-metrics" style="display:none"><div class="ph-metric"><div class="ph-mlabel">Cost Ratio</div><div class="ph-mval" id="ph-m-cost-ratio">0%</div><div class="ph-mval-sub" id="ph-m-cost-ratio-idr">Rp 0</div></div><div class="ph-metric"><div class="ph-mlabel">Net Profit Margin</div><div class="ph-mval" id="ph-m-npm">-</div><div class="ph-mval-sub" id="ph-m-npm-idr">—</div></div><div class="ph-metric"><div class="ph-mlabel">Gross Margin</div><div class="ph-mval" id="ph-m-gm">-</div><div class="ph-mval-sub" id="ph-m-gm-idr">—</div></div><div class="ph-metric"><div class="ph-mlabel">Platform Fee</div><div class="ph-mval" id="ph-m-pf-pct">0%</div><div class="ph-mval-sub" id="ph-m-pf-idr" style="color:var(--ph-danger)">Rp 0</div></div><div class="ph-metric"><div class="ph-mlabel">Total Cost</div><div class="ph-mval" id="ph-m-total-cost" style="color:var(--ph-danger)">Rp 0</div><div class="ph-mval-sub" id="ph-m-cost-ratio-pct">0%</div></div><div class="ph-metric"><div class="ph-mlabel">Profit Aktual</div><div class="ph-mval" id="ph-m-benefit">isi HPP dulu</div><div class="ph-mval-sub" id="ph-m-benefit-pct">—</div></div><div class="ph-metric"><div class="ph-mlabel">Subtotal</div><div class="ph-mval" id="ph-m-subtotal">Rp 0</div><div class="ph-mval-sub">100,00%</div></div><div class="ph-metric"><div class="ph-mlabel">Biaya Platform</div><div class="ph-mval" id="ph-m-pf-idr-val" style="color:var(--ph-danger)">Rp 0</div><div class="ph-mval-sub" id="ph-m-pf-pct-sub">0%</div></div></div></div>' +
          '<div class="ph-panel"><div class="ph-panel-title">Komponen Biaya</div><div id="ph-biaya-card"></div></div>' +
        '</section>' +

        /* Pane: Proyeksi Ringkasan (default) */
        '<section class="ph-pane ph-active" id="ph-pane-proyeksi-ringkasan">' +
          '<div class="ph-panel" id="ph-summary-panel"><div id="ph-summary-area"><div class="ph-loading">Memuat data...</div></div></div>' +
        '</section>' +

      '</div>' +
    '</div>' +
    '<div id="ph-toast"></div>';

  /* ═══════════════════════════════════════════════════════════════
     APP LOGIC
  ═══════════════════════════════════════════════════════════════ */
  function phApp(pg) {
    var $ = function(id){ return document.getElementById(id); };

    // State
    var state = {
      tokoId:   null,   // channel.id yang dipilih
      tokoNama: null,   // channel.nama (parsed)
      tokoList: [],     // [{id, nama, namaRaw}]
      hpp:      {},     // katalog → hpp (number)
      beban:    null,   // {beban_persen, npm_persen, target_npm}
      parsedPenghasilan: null,
      parsedPembayaran:  null,
      acosAktual:      0,
      affiliateAktual: 0,
    };

    // Expose switchPhSection globally (dipakai app.js phGoto)
    window.switchPhSection = switchSection;

    /* ── utils ── */
    function rupiah(n) {
      if (isNaN(n) || n === null) return 'Rp 0';
      return 'Rp ' + Math.round(n).toLocaleString('id-ID');
    }
    function pct(n) {
      if (isNaN(n) || n === null) return '0%';
      return n.toLocaleString('id-ID', {minimumFractionDigits:2, maximumFractionDigits:2}) + '%';
    }
    function esc(s) {
      var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML;
    }
    function showToast(msg) {
      var t = $('ph-toast'); t.textContent = msg; t.classList.add('ph-show');
      clearTimeout(t._t); t._t = setTimeout(function(){ t.classList.remove('ph-show'); }, 1800);
    }
    function parseTokoChanNama(raw) {
      // "SHP.ZENOOT" -> "ZENOOT", "TIK.ALLEY" -> "ALLEY", "ZENOOT" -> "ZENOOT"
      var m = String(raw || '').match(/^[A-Z]+\.(.+)$/);
      return m ? m[1].trim() : String(raw || '').trim();
    }

    /* ── Supabase helpers (pakai global dbGet) ── */
    function sbGet(table, qs) {
      if (typeof dbGet === 'function') return dbGet(table, qs || '');
      return Promise.reject(new Error('dbGet not available'));
    }

    /* ── load semua data dari Supabase ── */
    window._phRefresh = phRefresh;
    function phRefresh() {
      // Load toko list (channels kategori=toko_utama)
      sbGet('channels', '&kategori=eq.toko_utama&order=nama.asc')
        .then(function(rows) {
          state.tokoList = (rows || []).map(function(r) {
            return { id: r.id, namaRaw: r.nama, nama: parseTokoChanNama(r.nama) };
          });
          renderTokoSelect();
          loadTokoData();
          // Fetch rekap terbaru untuk toko awal → populate ACOS & Affiliate
          fetchLatestRekap(state.tokoId);
        })
        .catch(function(err) {
          $('ph-toko-select').innerHTML = '<option value="">Error load toko</option>';
          showSummaryError('Gagal load data toko: ' + err.message);
        });
    }

    function renderTokoSelect() {
      var sel = $('ph-toko-select');
      if (!sel) return;
      var prev = state.tokoId;
      sel.innerHTML = state.tokoList.length
        ? state.tokoList.map(function(t) {
            return '<option value="' + t.id + '">' + esc(t.nama) + '</option>';
          }).join('')
        : '<option value="">Belum ada toko di Channel Master</option>';

      // Restore dari localStorage, fallback ke pilihan sebelumnya atau toko pertama
      var saved = ''; try { saved = localStorage.getItem('ph_last_toko') || ''; } catch(e) {}
      var restoreId = saved || prev;
      if (restoreId && state.tokoList.some(function(t){ return t.id == restoreId; })) {
        sel.value = restoreId;
        state.tokoId = restoreId;
        var tobj = state.tokoList.find(function(t){ return t.id == restoreId; });
        state.tokoNama = tobj ? tobj.nama : restoreId;
      } else if (state.tokoList.length) {
        state.tokoId   = state.tokoList[0].id;
        state.tokoNama = state.tokoList[0].nama;
        sel.value = state.tokoId;
      }
    }

    function loadTokoData() {
      var sel = $('ph-toko-select');
      if (!sel) return;
      var tid = sel.value;
      if (!tid) { showSummaryError('Belum ada toko. Tambah toko di Channel Master → Shopee.'); return; }
      var tobj = state.tokoList.find(function(t){ return t.id == tid; });
      state.tokoId   = tid;
      state.tokoNama = tobj ? tobj.nama : tid;

      // Update label rekap pane kalau sudah ter-render
      var rekapLabel = document.getElementById('ph-rekap-toko-label');
      if (rekapLabel) rekapLabel.textContent = state.tokoNama || '';

      // Paralel: load beban + HPP produk
      var p1 = sbGet('channel_beban', '&channel_id=eq.' + tid)
        .then(function(rows) {
          state.beban = (rows && rows[0]) ? rows[0] : { beban_persen:0, npm_persen:0, target_npm:10 };
          if (state.beban.target_npm == null) state.beban.target_npm = 10;
          updateChannelBadge();
        })
        .catch(function(){ state.beban = { beban_persen:0, npm_persen:0, target_npm:10 }; });

      var p2 = sbGet('produk', '&order=katalog.asc')
        .then(function(rows) {
          // Group by katalog, ambil hpp pertama yang tidak null/0
          var hpp = {};
          var skuMap = {}; // sku_variasi.toUpperCase() → katalog
          (rows || []).forEach(function(r) {
            var kat = (r.katalog || '').trim();
            if (!kat) return;
            if (hpp[kat] == null && r.hpp) hpp[kat] = r.hpp;
            // Build kamus: CALYRA_HITAM → CALYRA, DC_HITAM → D_CURLY
            var skuVar = (r.sku_variasi || '').trim().toUpperCase().replace(/\s+/g, '');
            if (skuVar) skuMap[skuVar] = kat;
          });
          state.hpp    = hpp;
          state.skuMap = skuMap;
        })
        .catch(function(){ state.hpp = {}; });

      $('ph-summary-area').innerHTML = '<div class="ph-loading">Memuat data...</div>';
      Promise.all([p1, p2]).then(function(){ renderSummary(); });
    }

    function updateChannelBadge() {
      var badge = $('ph-ch-badge');
      if (!badge) return;
      if (!state.beban) { badge.style.display = 'none'; return; }
      var b = state.beban;
      badge.style.display = '';
      badge.textContent = 'Beban ' + (b.beban_persen||0).toFixed(1) + '% · NPM ' + (b.npm_persen||0).toFixed(1) + '% · Target ' + (b.target_npm||10).toFixed(1) + '%';
    }

    /* ── section navigation ── */
    var SECTION_META = {
      'pesanan':            { title:'Pesanan & Pembayaran', sub:'Paste Rincian Penghasilan & Pembayaran Pembeli untuk hitung biaya otomatis.' },
      'rekap':              { title:'Rekap Toko',           sub:'Paste data rekap mingguan dari spreadsheet. Disimpan per toko & periode.' },
      'biaya':              { title:'Price Analysis',       sub:'Total biaya & komponen biaya real per pesanan, dari Rincian Penghasilan.' },
      'proyeksi-ringkasan': { title:'Proyeksi Harga',       sub:'Harga jual minimum per SKU — HPP, beban operasional, dan target NPM dari Channel Master.' },
    };

    function switchSection(key) {
      window.switchPhSection = switchSection;
      pg.querySelectorAll('.ph-pane').forEach(function(p){
        p.classList.toggle('ph-active', p.id === 'ph-pane-' + key);
      });
      var meta = SECTION_META[key];
      if (meta) { $('ph-heading').textContent = meta.title; $('ph-sub').textContent = meta.sub; }
      // Sync tab bar active state
      var tabBar = document.getElementById('ph-tab-bar');
      if (tabBar) {
        tabBar.querySelectorAll('button').forEach(function(b) { b.classList.remove('ph-tab-active'); });
        tabBar.querySelectorAll('button').forEach(function(b) {
          if (b.getAttribute('onclick') && b.getAttribute('onclick').indexOf("'" + key + "'") !== -1) {
            b.classList.add('ph-tab-active');
          }
        });
      }
      if (key === 'biaya') {
        renderBiayaHeaderInputs();
      }
      if (key === 'rekap') {
        initRekapPane();
      }
    }

    /* ── Rekap Toko: field definitions (posisi baris di paste, 1-based) ──
       Format paste: nilai saja tanpa label, urutan fixed sesuai spreadsheet HASIL.
       Baris 1  = TOTAL PENDAPATAN   → total_pendapatan    (IDR, kolom 1)
       Baris 2  = TOTAL PENGHASILAN  → total_penghasilan   (IDR, kolom 1)
       Baris 3  = HPP                → hpp                 (IDR, kolom 1)
       Baris 4  = OPERASIONAL        → operasional_persen  (%, kolom 2)
       Baris 5  = IKLAN              → acos_persen         (%, kolom 2)
       Baris 6  = RASIO ADMIN        → rasio_admin_persen  (%, kolom 2, abs)
       Baris 7  = Biaya Komisi AMS   → affiliate_persen    (%, kolom 2, abs)
       Baris 8  = Biaya Administrasi
       Baris 9  = Biaya Layanan
       Baris 10 = Biaya Proses Pesanan
       Baris 11 = Premi
       Baris 12 = Biaya Program Hemat Biaya Kirim
       Baris 13 = Biaya Transaksi
       Baris 14 = Biaya Kampanye
       Baris 15 = Biaya Isi Saldo Otomatis
       Baris 16 = AOV AKTUAL         → aov                 (angka, kolom 1)
       Baris 17 = BASKET SIZE AKTUAL → basket_size         (angka, kolom 1)
       Baris 18 = ROAS AKTUAL        → roas                (angka, kolom 1)
       Baris 19 = GPM AKTUAL         → gpm_persen          (%, kolom 1)
       Baris 20 = RASIO LABA         → npm_persen          (%, kolom 1)
       Baris 21 = LABA/RUGI          → laba_rugi           (IDR, kolom 1)
       Baris 22 = Net Cash Flow      → net_cash_flow_persen(%, kolom 2)
    ── */
    var REKAP_FIELDS = [
      { key: 'total_pendapatan',    label: 'TOTAL PENDAPATAN',    row: 1,  pct: false },
      { key: 'total_penghasilan',   label: 'TOTAL PENGHASILAN',   row: 2,  pct: false },
      { key: 'hpp',                 label: 'HPP',                 row: 3,  pct: false },
      { key: 'operasional_persen',  label: 'OPERASIONAL',         row: 4,  pct: true  },
      { key: 'acos_persen',         label: 'IKLAN',               row: 5,  pct: true  },
      { key: 'rasio_admin_persen',  label: 'RASIO ADMIN',         row: 6,  pct: true  },
      { key: 'affiliate_persen',    label: 'Biaya Komisi AMS',    row: 7,  pct: true  },
      { key: 'aov',                 label: 'AOV AKTUAL',          row: 16, pct: false },
      { key: 'basket_size',         label: 'BASKET SIZE AKTUAL',  row: 17, pct: false },
      { key: 'roas',                label: 'ROAS AKTUAL',         row: 18, pct: false },
      { key: 'gpm_persen',          label: 'GPM AKTUAL',          row: 19, pct: true  },
      { key: 'npm_persen',          label: 'RASIO LABA',          row: 20, pct: true  },
      { key: 'laba_rugi',           label: 'LABA/RUGI',           row: 21, pct: false },
      { key: 'net_cash_flow_persen',label: 'Net Cash Flow',       row: 22, pct: true  },
    ];

    function parseRekapCell(str) {
      // Trim whitespace + strip kurung (untuk format negatif "(881.327)")
      var s = String(str).trim().replace(/^\(/, '-').replace(/\)$/, '');
      // Persen: ambil angka + %, strip tanda negatif (affiliate dll ditampilkan abs)
      var pctMatch = s.match(/(-?[\d.,]+)%/);
      if (pctMatch) {
        var pv = parseFloat(pctMatch[1].replace(',', '.'));
        return isNaN(pv) ? null : { val: Math.abs(pv), isPct: true };
      }
      // Angka biasa: hapus titik ribuan (1.470.000 → 1470000), ganti koma desimal
      var clean = s.replace(/[Rp\s]/gi, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
      var nv = parseFloat(clean);
      return isNaN(nv) ? null : { val: nv, isPct: false };
    }

    function parseRekapBreakdown(text) {
      // Split baris, filter baris kosong, pertahankan urutan (termasuk baris "0")
      var lines = text.split('\n').map(function(l){ return l.trim(); });
      // Filter: buang baris benar-benar kosong, TAPI pertahankan baris "0" / "0\t0%"
      lines = lines.filter(function(l){ return l.length > 0; });
      // Buang baris pertama kalau header "NILAI" (user kadang paste termasuk header)
      if (lines.length && lines[0].toLowerCase().replace(/\s/g,'') === 'nilai') {
        lines = lines.slice(1);
      }

      var result = {}, foundCount = 0;
      REKAP_FIELDS.forEach(function(f) {
        var idx = f.row - 1; // 0-based
        if (idx >= lines.length) return;
        var parts = lines[idx].split('\t').map(function(p){ return p.trim(); });
        var found = null;
        if (f.pct) {
          // Cari kolom yang mengandung %
          for (var i = 0; i < parts.length; i++) {
            var r = parseRekapCell(parts[i]);
            if (r && r.isPct) { found = r.val; break; }
          }
        } else {
          // Ambil kolom pertama yang punya angka valid
          for (var j = 0; j < parts.length; j++) {
            var r2 = parseRekapCell(parts[j]);
            if (r2) { found = r2.val; break; }
          }
        }
        if (found !== null) { result[f.key] = found; foundCount++; }
      });
      return { values: result, foundCount: foundCount, totalFields: REKAP_FIELDS.length };
    }

    var _rekapParsed = null; // hasil parse terakhir
    var _rekapTokoId = null; // toko aktif di rekap pane (bisa beda dari state.tokoId)

    function initRekapPane() {
      // Populate toko selector di rekap bar
      var tokoSel = document.getElementById('ph-rekap-toko-sel');
      if (tokoSel && !tokoSel._bound) {
        tokoSel.innerHTML = state.tokoList.map(function(t) {
          return '<option value="' + t.id + '"' + (t.id == state.tokoId ? ' selected' : '') + '>' + esc(t.nama) + '</option>';
        }).join('');
        _rekapTokoId = tokoSel.value;
        tokoSel._bound = true;
        tokoSel.addEventListener('change', function() {
          _rekapTokoId = this.value;
          loadRekapHistory();
        });
      } else if (tokoSel) {
        _rekapTokoId = tokoSel.value;
      }

      // Default tanggal: awal = hari ini - 30 hari, akhir = hari ini
      var today = new Date().toISOString().slice(0, 10);
      var tglAwal = document.getElementById('ph-rekap-tgl-awal');
      var tglAkhir = document.getElementById('ph-rekap-tgl-akhir');
      if (tglAwal && !tglAwal.value) {
        var d = new Date(); d.setDate(d.getDate() - 30);
        tglAwal.value = d.toISOString().slice(0, 10);
      }
      if (tglAkhir && !tglAkhir.value) tglAkhir.value = today;

      // Toggle paste panel
      var toggleBtn = document.getElementById('ph-rekap-toggle-btn');
      if (toggleBtn && !toggleBtn._bound) {
        toggleBtn._bound = true;
        toggleBtn.addEventListener('click', function() {
          var panel = document.getElementById('ph-rekap-paste-panel');
          var isOpen = panel.classList.contains('open');
          panel.classList.toggle('open', !isOpen);
          this.textContent = isOpen ? '+ Input Data' : '− Tutup';
        });
      }

      // Cancel button
      var cancelBtn = document.getElementById('ph-rekap-cancel-btn');
      if (cancelBtn && !cancelBtn._bound) {
        cancelBtn._bound = true;
        cancelBtn.addEventListener('click', function() {
          var panel = document.getElementById('ph-rekap-paste-panel');
          panel.classList.remove('open');
          var toggleBtn2 = document.getElementById('ph-rekap-toggle-btn');
          if (toggleBtn2) toggleBtn2.textContent = '+ Input Data';
          // Reset textarea & status
          var ta = document.getElementById('ph-rekap-ta');
          var st = document.getElementById('ph-rekap-status');
          var pv = document.getElementById('ph-rekap-preview');
          var sb = document.getElementById('ph-rekap-save-btn');
          if (ta) ta.value = '';
          if (st) { st.className = ''; st.textContent = ''; }
          if (pv) pv.innerHTML = '';
          if (sb) sb.style.display = 'none';
          _rekapParsed = null;
        });
      }

      // Parse button
      var parseBtn = document.getElementById('ph-rekap-parse-btn');
      if (parseBtn && !parseBtn._bound) {
        parseBtn._bound = true;
        parseBtn.addEventListener('click', function() {
          var ta = document.getElementById('ph-rekap-ta');
          if (!ta || !ta.value.trim()) return;
          var r = parseRekapBreakdown(ta.value);
          _rekapParsed = r.foundCount > 0 ? r.values : null;
          renderRekapPreview(r);
          var saveBtn = document.getElementById('ph-rekap-save-btn');
          if (saveBtn) saveBtn.style.display = r.foundCount > 0 ? '' : 'none';
        });
      }

      // Save button
      var saveBtn = document.getElementById('ph-rekap-save-btn');
      if (saveBtn && !saveBtn._bound) {
        saveBtn._bound = true;
        saveBtn.addEventListener('click', saveRekap);
      }

      // Load history
      loadRekapHistory();
    }

    function renderRekapPreview(r) {
      var status = document.getElementById('ph-rekap-status');
      var preview = document.getElementById('ph-rekap-preview');
      if (!status || !preview) return;
      status.className = 'ph-parse-status ' + (r.foundCount > 0 ? 'ok' : 'fail');
      status.textContent = r.foundCount + '/' + r.totalFields + ' field ketemu.';
      var rows = REKAP_FIELDS.map(function(f) {
        var v = r.values[f.key];
        var ok = v !== null && v !== undefined;
        var displayLabel = f.label;
        var displayVal = ok ? (f.pct ? v.toFixed(2) + '%' : v.toLocaleString('id-ID')) : 'tidak ketemu';
        return '<tr><td style="color:'+(ok?'':'var(--ph-danger)')+'">'+displayLabel+'</td>' +
          '<td class="num" style="color:'+(ok?'':'var(--ph-danger)')+'">'+displayVal+'</td></tr>';
      }).join('');
      preview.innerHTML = '<table class="ph-tbl"><thead><tr><th>Field</th><th class="num">Nilai</th></tr></thead><tbody>'+rows+'</tbody></table>';
    }

    function saveRekap() {
      if (!_rekapParsed) return;
      var tid = _rekapTokoId || state.tokoId;
      if (!tid) return;
      var tglAwal  = (document.getElementById('ph-rekap-tgl-awal')  || {}).value  || new Date().toISOString().slice(0,10);
      var tglAkhir = (document.getElementById('ph-rekap-tgl-akhir') || {}).value || tglAwal;
      var saveBtn  = document.getElementById('ph-rekap-save-btn');
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Menyimpan...'; }

      var payload = Object.assign({
        channel_id:    parseInt(tid),
        periode:       tglAwal,
        periode_akhir: tglAkhir
      }, _rekapParsed);

      // Cek duplikat: channel_id + periode (tgl awal)
      sbGet('channel_rekap', '&channel_id=eq.' + tid + '&periode=eq.' + tglAwal)
        .then(function(rows) {
          return (rows && rows.length > 0)
            ? dbUpdate('channel_rekap', rows[0].id, payload)
            : dbInsert('channel_rekap', payload);
        })
        .then(function() {
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Simpan ke Supabase'; }
          var status = document.getElementById('ph-rekap-status');
          if (status) { status.className = 'ph-parse-status ok'; status.textContent = 'Tersimpan! ' + tglAwal + ' s/d ' + tglAkhir; }
          applyRekapToInputs(_rekapParsed);
          // Tutup paste panel
          var panel = document.getElementById('ph-rekap-paste-panel');
          if (panel) panel.classList.remove('open');
          var toggleBtn = document.getElementById('ph-rekap-toggle-btn');
          if (toggleBtn) toggleBtn.textContent = '+ Input Data';
          _rekapParsed = null;
          loadRekapHistory();
          // Scroll ke history setelah render
          setTimeout(function() {
            var histEl = document.getElementById('ph-rekap-history');
            if (histEl) histEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        })
        .catch(function(err) {
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Simpan ke Supabase'; }
          var status = document.getElementById('ph-rekap-status');
          if (status) { status.className = 'ph-parse-status fail'; status.textContent = 'Gagal simpan: ' + (err.message || err); }
        });
    }

    function fetchLatestRekap(tokoId) {
      if (!tokoId) return;
      sbGet('channel_rekap', '&channel_id=eq.' + tokoId + '&order=periode.desc&limit=1')
        .then(function(rows) {
          if (rows && rows[0]) applyRekapToInputs(rows[0]);
        })
        .catch(function(){});
    }

    function applyRekapToInputs(data) {
      // Populate state
      if (data.acos_persen != null)      state.acosAktual      = parseFloat(data.acos_persen);
      if (data.affiliate_persen != null) state.affiliateAktual = parseFloat(data.affiliate_persen);
      // Populate input elements kalau sudah ter-render
      var acosEl = document.getElementById('ph-acos-aktual-input');
      var affEl  = document.getElementById('ph-affiliate-input');
      if (acosEl) acosEl.value = state.acosAktual || '';
      if (affEl)  affEl.value  = state.affiliateAktual || '';
    }

    function loadRekapHistory() {
      var histEl = document.getElementById('ph-rekap-history');
      if (!histEl) return;
      var tid = _rekapTokoId || state.tokoId;
      if (!tid) return;
      histEl.innerHTML = '<div class="ph-loading" style="font-size:12px">Memuat data...</div>';
      sbGet('channel_rekap', '&channel_id=eq.' + tid + '&order=periode.desc&limit=12')
        .then(function(rows) {
          if (!rows || !rows.length) {
            histEl.innerHTML = '<div style="color:var(--ph-faint);font-size:12px;padding:8px 0">Belum ada data. Klik "+ Input Data" untuk tambah.</div>';
            return;
          }
          function fmt(n, decimals) {
            if (n == null) return '-';
            return (typeof n === 'number' ? n : parseFloat(n)).toFixed(decimals != null ? decimals : 0);
          }
          function fmtIdr(n) {
            if (n == null) return '-';
            return Math.round(parseFloat(n)).toLocaleString('id-ID');
          }
          function fmtPeriode(r) {
            var a = r.periode || '-';
            var b = r.periode_akhir;
            return b && b !== a ? a + '<br><span style="color:var(--ph-faint)">s/d ' + b + '</span>' : a;
          }
          function cls(n, inverse) {
            if (n == null) return '';
            var pos = inverse ? parseFloat(n) < 0 : parseFloat(n) >= 0;
            return pos ? 'pos' : 'neg';
          }

          var hdrs =
            '<th>Periode</th>' +
            '<th class="num">Pendapatan</th>' +
            '<th class="num">Penghasilan</th>' +
            '<th class="num">HPP</th>' +
            '<th class="num">Ops%</th>' +
            '<th class="num">IKLAN%</th>' +
            '<th class="num">Admin%</th>' +
            '<th class="num">AMS%</th>' +
            '<th class="num">AOV</th>' +
            '<th class="num">Basket</th>' +
            '<th class="num">ROAS</th>' +
            '<th class="num">GPM%</th>' +
            '<th class="num">NPM%</th>' +
            '<th class="num">Laba/Rugi</th>' +
            '<th class="num">NCF%</th>';

          var rowsHtml = rows.map(function(r) {
            return '<tr>' +
              '<td style="white-space:nowrap;font-size:11px">' + fmtPeriode(r) + '</td>' +
              '<td class="num">' + fmtIdr(r.total_pendapatan) + '</td>' +
              '<td class="num">' + fmtIdr(r.total_penghasilan) + '</td>' +
              '<td class="num">' + fmtIdr(r.hpp) + '</td>' +
              '<td class="num ' + cls(r.operasional_persen) + '">' + (r.operasional_persen != null ? fmt(r.operasional_persen,1)+'%' : '-') + '</td>' +
              '<td class="num ' + cls(r.acos_persen) + '">' + (r.acos_persen != null ? fmt(r.acos_persen,2)+'%' : '-') + '</td>' +
              '<td class="num neg">' + (r.rasio_admin_persen != null ? fmt(r.rasio_admin_persen,1)+'%' : '-') + '</td>' +
              '<td class="num neg">' + (r.affiliate_persen != null ? fmt(r.affiliate_persen,2)+'%' : '-') + '</td>' +
              '<td class="num">' + (r.aov != null ? fmtIdr(r.aov) : '-') + '</td>' +
              '<td class="num">' + (r.basket_size != null ? fmt(r.basket_size,1) : '-') + '</td>' +
              '<td class="num">' + (r.roas != null ? fmt(r.roas,2) : '-') + '</td>' +
              '<td class="num ' + cls(r.gpm_persen) + '">' + (r.gpm_persen != null ? fmt(r.gpm_persen,2)+'%' : '-') + '</td>' +
              '<td class="num ' + cls(r.npm_persen) + '">' + (r.npm_persen != null ? fmt(r.npm_persen,2)+'%' : '-') + '</td>' +
              '<td class="num ' + cls(r.laba_rugi) + '">' + (r.laba_rugi != null ? fmtIdr(r.laba_rugi) : '-') + '</td>' +
              '<td class="num ' + cls(r.net_cash_flow_persen) + '">' + (r.net_cash_flow_persen != null ? fmt(r.net_cash_flow_persen,2)+'%' : '-') + '</td>' +
              '</tr>';
          }).join('');

          histEl.innerHTML =
            '<div class="ph-panel-title" style="margin-bottom:8px">History Rekap</div>' +
            '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">' +
            '<table class="ph-hist-tbl"><thead><tr>' + hdrs + '</tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
            '</div>';
        })
        .catch(function() { histEl.innerHTML = '<div style="color:var(--ph-danger);font-size:12px">Gagal load data rekap.</div>'; });
    }

    /* ── Toko select event ── */
    $('ph-toko-select').addEventListener('change', function() {
      // Simpan pilihan toko terakhir
      try { localStorage.setItem('ph_last_toko', this.value); } catch(e) {}
      loadTokoData();
      // Fetch rekap terbaru untuk toko ini → populate ACOS & Affiliate
      fetchLatestRekap(this.value);
    });

    /* ── Parse helpers ── */
    function parseRupiahLine(str) {
      if (str == null) return null;
      if (!/[0-9]/.test(str)) return null;
      var s = String(str).trim();
      var negative = /-/.test(s);
      s = s.replace(/Rp/gi,'').replace(/-/g,'').replace(/\s/g,'');
      if (s === '') return null;
      var hasComma = s.includes(','), hasDot = s.includes('.');
      var num;
      if (hasComma && hasDot) { num = parseFloat(s.replace(/,/g,'')); }
      else if (hasDot && !hasComma) { var pts=s.split('.'); num=(pts.length>1&&pts[pts.length-1].length===3)?parseFloat(pts.join('')):parseFloat(s); }
      else if (hasComma && !hasDot) { var pts2=s.split(','); num=(pts2.length>1&&pts2[pts2.length-1].length===3)?parseFloat(pts2.join('')):parseFloat(s.replace(',','.')); }
      else { num = parseFloat(s); }
      if (isNaN(num)) return null;
      return negative ? -num : num;
    }

    function findFieldValue(lines, label) {
      // label bisa string atau array of strings (untuk pesanan selesai vs estimasi)
      var labelList = Array.isArray(label) ? label : [label];
      var targets = labelList.map(function(l){ return l.toLowerCase(); });
      for (var i = 0; i < lines.length; i++) {
        var ll = lines[i].toLowerCase();
        for (var ti = 0; ti < targets.length; ti++) {
          var t = targets[ti];
          if (ll === t || ll.startsWith(t)) {
            for (var j = i+1; j < Math.min(lines.length, i+3); j++) {
              var val = parseRupiahLine(lines[j]);
              if (val !== null) return { value: val, matchedLabel: labelList[ti] };
            }
          }
        }
      }
      return null;
    }

    var PENGHASILAN_FIELDS = [
      {key:'subtotalPesanan',   label:'Subtotal Pesanan'},
      {key:'hargaProduk',       label:'Harga Produk'},
      {key:'ongkirDibayarPembeli', label:'Ongkir Dibayar Pembeli'},
      // pesanan selesai: "Potongan Ongkos Kirim dari Shopee" (tanpa "Estimasi")
      {key:'potonganOngkirShopee', label:['Estimasi Potongan Ongkos Kirim dari Shopee','Potongan Ongkos Kirim dari Shopee']},
      {key:'voucherSubsidiShopee', label:'Voucher & Subsidi Shopee'},
      {key:'voucherToko',       label:'Voucher Toko yang ditanggung Penjual'},
      {key:'biayaAdministrasi', label:'Biaya Administrasi'},
      {key:'biayaLayanan',      label:'Biaya Layanan'},
      {key:'biayaProsesPesanan',label:'Biaya Proses Pesanan'},
      {key:'biayaIsiSaldo',     label:'Biaya Isi Saldo Otomatis'},
      // pesanan selesai: "Total Penghasilan" (tanpa "Estimasi")
      {key:'totalPenghasilan',  label:['Estimasi Total Penghasilan','Total Penghasilan']},
    ];
    var PEMBAYARAN_FIELDS = [
      {key:'subtotalPesanan',   label:'Subtotal Pesanan'},
      {key:'ongkosKirim',       label:'Ongkos Kirim'},
      {key:'voucherShopee',     label:'Voucher Shopee'},
      {key:'voucherToko',       label:'Voucher Toko'},
      {key:'biayaLayanan',      label:'Biaya Layanan'},
      {key:'totalPembayaran',   label:'Total Pembayaran Pembeli'},
    ];

    function parseBreakdown(text, fieldDefs) {
      var lines = text.split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l.length > 0; });
      var result = {}, matchedLabels = {}, foundCount = 0;
      fieldDefs.forEach(function(f) {
        var found = findFieldValue(lines, f.label);
        if (found !== null) {
          result[f.key] = found.value;
          matchedLabels[f.key] = found.matchedLabel;
          foundCount++;
        } else {
          result[f.key] = null;
        }
      });
      return { values: result, matchedLabels: matchedLabels, foundCount: foundCount, totalFields: fieldDefs.length };
    }

    function renderParsePreview(containerId, fieldDefs, values, matchedLabels) {
      var el = $(containerId); if (!el) return;
      var subtotal = values.subtotalPesanan;
      var rows = fieldDefs.map(function(f) {
        var v = values[f.key]; var ok = v !== null;
        var ratio = (ok && subtotal && f.key !== 'subtotalPesanan') ? (v/subtotal)*100 : null;
        // Pakai label yang actual match dari paste; fallback ke label pertama
        var fLabel = (matchedLabels && matchedLabels[f.key])
          ? matchedLabels[f.key]
          : (Array.isArray(f.label) ? f.label[0] : f.label);
        return '<tr><td style="color:'+(ok?'':'var(--ph-danger)')+'">'+fLabel+'</td>' +
          '<td class="num" style="color:'+(ok?'':'var(--ph-danger)')+'">'+( ok ? rupiah(v) : 'tidak ketemu')+'</td>' +
          '<td class="num" style="color:var(--ph-faint);font-size:11px">'+(ratio!==null?pct(ratio):'&mdash;')+'</td></tr>';
      }).join('');
      el.innerHTML = '<table class="ph-tbl"><thead><tr><th>Komponen</th><th class="num">Nilai</th><th class="num">% Subtotal</th></tr></thead><tbody>'+rows+'</tbody></table>';
    }

    function applyPenghasilan(text) {
      var status = $('ph-penghasilan-status');
      if (!text.trim()) { status.className='ph-parse-status fail'; status.textContent='Belum ada teks.'; return; }
      var r = parseBreakdown(text, PENGHASILAN_FIELDS);
      // Extract Kode Variasi untuk HPP matching via skuMap
      var kodeVariasiMatch = text.match(/Kode\s+Variasi\s*:\s*([^\n]+)/i);
      var kodeVariasiRaw = kodeVariasiMatch ? kodeVariasiMatch[1].trim() : null;
      // Simpan raw sku_variasi untuk exact match ke skuMap (misal "MAYRA_ MARUN" → "MAYRA_MARUN")
      state.skuRawFromPaste = kodeVariasiRaw || null;
      renderParsePreview('ph-penghasilan-preview', PENGHASILAN_FIELDS, r.values, r.matchedLabels);
      if (!r.foundCount) { status.className='ph-parse-status fail'; status.textContent='Tidak ada field yang dikenali.'; return; }
      status.className = r.foundCount === r.totalFields ? 'ph-parse-status ok' : 'ph-parse-status fail';
      status.textContent = r.foundCount + '/' + r.totalFields + ' field ketemu.';
      if (r.values.subtotalPesanan !== null && r.values.totalPenghasilan !== null) {
        state.parsedPenghasilan = { values: r.values };
      }
      updatePesananBtn();
      renderBiayaBenefit();
    }

    function applyPembayaran(text) {
      var status = $('ph-pembayaran-status');
      if (!text.trim()) { status.className='ph-parse-status fail'; status.textContent='Belum ada teks.'; return; }
      var r = parseBreakdown(text, PEMBAYARAN_FIELDS);
      renderParsePreview('ph-pembayaran-preview', PEMBAYARAN_FIELDS, r.values, r.matchedLabels);
      if (!r.foundCount) { status.className='ph-parse-status fail'; status.textContent='Tidak ada field yang dikenali.'; return; }
      status.className = r.foundCount === r.totalFields ? 'ph-parse-status ok' : 'ph-parse-status fail';
      status.textContent = r.foundCount + '/' + r.totalFields + ' field ketemu.';
      state.parsedPembayaran = { values: r.values };
      updatePesananBtn();
    }

    function updatePesananBtn() {
      var btn = $('ph-pesanan-action-btn'); if (!btn) return;
      var hasData = !!(state.parsedPenghasilan || state.parsedPembayaran);
      if (hasData) { btn.textContent='Bersihkan Data'; btn.classList.remove('ph-btn-accent'); btn.classList.add('ph-btn-ghost'); }
      else          { btn.textContent='Parse Otomatis'; btn.classList.remove('ph-btn-ghost'); btn.classList.add('ph-btn-accent'); }
    }

    $('ph-pesanan-action-btn').addEventListener('click', function() {
      var hasData = !!(state.parsedPenghasilan || state.parsedPembayaran);
      if (hasData) {
        state.parsedPenghasilan = null; state.parsedPembayaran = null;
        $('ph-penghasilan-ta').value=''; $('ph-penghasilan-status').innerHTML=''; $('ph-penghasilan-preview').innerHTML='';
        $('ph-pembayaran-ta').value='';  $('ph-pembayaran-status').innerHTML='';  $('ph-pembayaran-preview').innerHTML='';
        updatePesananBtn(); renderBiayaBenefit(); return;
      }
      applyPenghasilan($('ph-penghasilan-ta').value);
      applyPembayaran($('ph-pembayaran-ta').value);
    });

    /* ── Price Analysis (biaya) pane ── */
    function renderBiayaHeaderInputs() {
      // Inject Affiliate+ACOS ke global header (sejajar dengan Toko) — sekali saja
      var globalSlot = $('ph-acos-aff-global');
      if (!globalSlot || globalSlot.querySelector('#ph-affiliate-input')) return;
      globalSlot.style.cssText = 'display:flex;align-items:flex-end;gap:10px;';
      globalSlot.innerHTML =
        '<div><label class="ph-label">Affiliate (%)</label><div class="ph-input-wrap ph-suf"><span class="ph-suffix">%</span><input type="number" id="ph-affiliate-input" step="0.01" placeholder="0" style="width:90px"></div></div>' +
        '<div><label class="ph-label">ACOS (%)</label><div class="ph-input-wrap ph-suf"><span class="ph-suffix">%</span><input type="number" id="ph-acos-aktual-input" step="0.01" placeholder="0" style="width:90px"></div></div>';

      document.getElementById('ph-affiliate-input').value = state.affiliateAktual || '';
      document.getElementById('ph-acos-aktual-input').value = state.acosAktual || '';

      document.getElementById('ph-affiliate-input').addEventListener('input', function() {
        var v = this.value === '' ? 0 : parseFloat(this.value);
        state.affiliateAktual = isNaN(v) ? 0 : v;
        renderBiayaBenefit();
      });
      document.getElementById('ph-acos-aktual-input').addEventListener('input', function() {
        var v = this.value === '' ? 0 : parseFloat(this.value);
        state.acosAktual = isNaN(v) ? 0 : v;
        renderBiayaBenefit();
      });
    }

    function renderBiayaBenefit() {
      var emptyHint = $('ph-biaya-empty');
      var grid      = $('ph-biaya-metrics');
      var card      = $('ph-biaya-card');
      if (!grid || !card) return;

      var parsed = state.parsedPenghasilan;
      if (!parsed || parsed.values.subtotalPesanan === null || parsed.values.totalPenghasilan === null) {
        emptyHint.style.display = ''; grid.style.display = 'none'; card.innerHTML = ''; return;
      }
      emptyHint.style.display = 'none'; grid.style.display = '';

      var v          = parsed.values;
      var subtotal   = v.subtotalPesanan;
      var totalPenh  = v.totalPenghasilan;
      var acos       = state.acosAktual || 0;
      var aff        = state.affiliateAktual || 0;

      // Cari HPP: 4-layer lookup
      // Layer 1: exact match sku_variasi dari paste → katalog via skuMap
      // Layer 2: size remap (S/M→-M, L/XL/XLL→-XL) — konsisten dgn shopee-sync.js
      // Layer 3: fallback ke katalog yang sama (SKU induk)
      // Layer 4: tidak ketemu → hpp=0, tampil warning
      var hppKatalog = null;
      var hppMatchInfo = '';
      if (state.skuRawFromPaste && state.skuMap) {
        var skuKey = state.skuRawFromPaste.toUpperCase().replace(/\s+/g, '');
        // Layer 1: exact match
        if (state.skuMap[skuKey]) {
          hppKatalog = state.skuMap[skuKey];
          hppMatchInfo = 'exact';
        } else {
          // Layer 2: size remap — ganti suffix ukuran
          var skuRemapped = skuKey.replace(/[-_](S|M|L|XL|XLL)$/i, function(_, sz) {
            return '-' + (['S','M'].indexOf(sz.toUpperCase()) !== -1 ? 'M' : 'XL');
          });
          if (skuRemapped !== skuKey && state.skuMap[skuRemapped]) {
            hppKatalog = state.skuMap[skuRemapped];
            hppMatchInfo = 'size-remap';
          } else {
            // Layer 3: fallback ke katalog (SKU induk) — ambil HPP dari katalog yang sama
            // Cari katalog dari skuKey prefix (sebelum '_')
            var skuPrefix = skuKey.split('_')[0];
            var katMatch = Object.keys(state.hpp).find(function(k) {
              return k.toUpperCase() === skuPrefix;
            }) || null;
            if (katMatch) {
              hppKatalog = katMatch;
              hppMatchInfo = 'sku-induk';
            }
            // Layer 4: tidak ketemu sama sekali → hppKatalog null, hpp=0
          }
        }
      }
      var hpp = hppKatalog ? (state.hpp[hppKatalog] || 0) : 0;

      var platformCost = Math.abs((v.biayaAdministrasi||0) + (v.biayaLayanan||0) + (v.biayaProsesPesanan||0));
      var voucherToko  = Math.abs(v.voucherToko || 0);
      var adsBiaya     = acos > 0 ? (subtotal * acos / 100) : 0;
      var affBiaya     = aff  > 0 ? (subtotal * aff  / 100) : 0;
      var costTotal    = platformCost + voucherToko + adsBiaya + affBiaya;
      var costRatioPct = subtotal > 0 ? (costTotal / subtotal) * 100 : 0;
      // Profit Aktual & NPM: totalPenh sudah include semua potongan Shopee.
      // biayaIsiSaldo ditambah balik karena masuk ke aset saldo ads, bukan biaya hilang.
      var isiSaldo     = Math.abs(v.biayaIsiSaldo || 0);
      var benefit      = hpp > 0 ? (totalPenh - hpp - adsBiaya - affBiaya) : null;
      var npm          = hpp > 0 ? (totalPenh - hpp - adsBiaya - affBiaya + isiSaldo) : null;
      var npmPct       = (npm !== null && subtotal > 0) ? (npm/subtotal)*100 : null;
      var gm           = hpp > 0 ? (subtotal - hpp) : null;
      var gmPct        = (gm !== null && subtotal > 0) ? (gm/subtotal)*100 : null;
      var pfIdr        = platformCost;
      var pfPct        = subtotal > 0 ? (pfIdr/subtotal)*100 : 0;
      var rowPct       = function(val){ return subtotal ? pct((val/subtotal)*100) : '-'; };

      // Subtotal
      $('ph-m-subtotal').textContent = rupiah(subtotal);

      // Cost Ratio: % atas, IDR bawah
      $('ph-m-cost-ratio').textContent = pct(costRatioPct);
      if ($('ph-m-cost-ratio-idr')) $('ph-m-cost-ratio-idr').textContent = rupiah(costTotal);

      // Total Cost: IDR atas, % bawah
      $('ph-m-total-cost').textContent = rupiah(costTotal);
      $('ph-m-total-cost').style.color = 'var(--ph-danger)';
      if ($('ph-m-cost-ratio-pct')) { $('ph-m-cost-ratio-pct').textContent = pct(costRatioPct); $('ph-m-cost-ratio-pct').style.color = 'var(--ph-danger)'; }

      // Platform Fee: % atas, IDR bawah
      $('ph-m-pf-pct').textContent = pct(pfPct);
      if ($('ph-m-pf-idr'))     $('ph-m-pf-idr').textContent     = rupiah(pfIdr);
      if ($('ph-m-pf-idr-val')) $('ph-m-pf-idr-val').textContent = rupiah(pfIdr);
      if ($('ph-m-pf-idr-val')) $('ph-m-pf-idr-val').style.color = 'var(--ph-danger)';
      if ($('ph-m-pf-pct-sub')) $('ph-m-pf-pct-sub').textContent = pct(pfPct);

      // Profit Aktual: IDR atas, % bawah
      var mB = $('ph-m-benefit');
      mB.textContent = benefit !== null ? rupiah(benefit) : 'isi HPP dulu';
      mB.style.color = benefit !== null && benefit >= 0 ? 'var(--ph-ok)' : 'var(--ph-danger)';
      if ($('ph-m-benefit-pct')) {
        $('ph-m-benefit-pct').textContent = benefit !== null && subtotal > 0 ? pct((benefit/subtotal)*100) : '—';
        $('ph-m-benefit-pct').style.color = benefit !== null && benefit >= 0 ? 'var(--ph-ok)' : 'var(--ph-danger)';
      }

      // NPM: % atas, IDR bawah
      var mN = $('ph-m-npm');
      mN.textContent = npmPct !== null ? pct(npmPct) : 'isi HPP dulu';
      mN.style.color = npmPct !== null && npmPct >= 0 ? 'var(--ph-ok)' : 'var(--ph-danger)';
      if ($('ph-m-npm-idr')) {
        $('ph-m-npm-idr').textContent = npm !== null ? rupiah(npm) : '—';
        $('ph-m-npm-idr').style.color = npm !== null && npm >= 0 ? 'var(--ph-ok)' : 'var(--ph-danger)';
      }

      // Gross Margin: % atas, IDR bawah
      var mG = $('ph-m-gm');
      mG.textContent = gmPct !== null ? pct(gmPct) : 'isi HPP dulu';
      mG.style.color = gmPct !== null && gmPct >= 0 ? 'var(--ph-ok)' : 'var(--ph-danger)';
      if ($('ph-m-gm-idr')) {
        $('ph-m-gm-idr').textContent = gm !== null ? rupiah(gm) : '—';
        $('ph-m-gm-idr').style.color = gmPct !== null && gmPct >= 0 ? 'var(--ph-ok)' : 'var(--ph-danger)';
      }

      var adminRows = [['Biaya Administrasi',v.biayaAdministrasi],['Biaya Layanan',v.biayaLayanan],['Biaya Proses Pesanan',v.biayaProsesPesanan]].filter(function(r){ return r[1] !== null; });
      var adminSum  = adminRows.reduce(function(s,r){ return s + r[1]; }, 0);
      var adminPct  = subtotal ? (adminSum/subtotal)*100 : null;

      card.innerHTML =
        '<table class="ph-tbl"><thead><tr><th>Komponen Biaya</th><th class="num">Nilai</th><th class="num">% Subtotal</th></tr></thead><tbody>' +
        (v.hargaProduk !== null ? '<tr><td>Harga Produk</td><td class="num">'+rupiah(v.hargaProduk)+'</td><td class="num">'+rowPct(v.hargaProduk)+'</td></tr>' : '') +
        (hpp > 0
          ? '<tr><td>HPP <span style="color:var(--ph-faint);font-size:11px">('+esc(hppKatalog)+(hppMatchInfo==='size-remap'?' · size remap':hppMatchInfo==='sku-induk'?' · dari SKU induk':'')+')</span></td><td class="num">'+rupiah(hpp)+'</td><td class="num">'+rowPct(-hpp)+'</td></tr>'
          : '<tr><td style="color:var(--ph-danger)">HPP <span style="font-size:11px">(SKU tidak ditemukan di master produk — tambah di halaman Produk)</span></td><td class="num">—</td><td class="num">—</td></tr>') +
        '<tr style="background:rgba(255,255,255,.04)"><td style="font-weight:700">Rasio Admin & Layanan</td><td class="num" style="font-weight:700">'+rupiah(adminSum)+'</td><td class="num" style="font-weight:700">'+(adminPct!==null?pct(adminPct):'–')+'</td></tr>' +
        adminRows.map(function(r){ return '<tr><td style="color:var(--ph-faint);padding-left:18px">'+r[0]+'</td><td class="num" style="color:var(--ph-faint)">'+rupiah(r[1])+'</td><td class="num" style="color:var(--ph-faint)">'+rowPct(r[1])+'</td></tr>'; }).join('') +
        (acos > 0 ? '<tr><td>Biaya Iklan (ACOS '+pct(acos)+')</td><td class="num">'+rupiah(-adsBiaya)+'</td><td class="num">'+rowPct(-adsBiaya)+'</td></tr>' : '') +
        (aff  > 0 ? '<tr><td>Biaya Affiliate ('+pct(aff)+'%)</td><td class="num">'+rupiah(-affBiaya)+'</td><td class="num">'+rowPct(-affBiaya)+'</td></tr>' : '') +
        (v.voucherToko !== null ? '<tr><td>Voucher Toko</td><td class="num">'+rupiah(v.voucherToko)+'</td><td class="num">'+rowPct(v.voucherToko)+'</td></tr>' : '') +
        '<tr style="background:rgba(255,255,255,.04)"><td style="font-weight:700">Cost Ratio (Total Cost)</td><td class="num" style="font-weight:700;color:var(--ph-danger)">'+rupiah(-costTotal)+'</td><td class="num" style="font-weight:700;color:var(--ph-danger)">'+rowPct(-costTotal)+'</td></tr>' +
        '<tr class="ph-total"><td>Estimasi Total Penghasilan</td><td class="num">'+rupiah(totalPenh)+'</td><td class="num">'+rowPct(totalPenh)+'</td></tr>' +
        (hpp > 0 ? '<tr class="ph-total"><td>Net Profit Margin</td><td class="num">'+rupiah(npm)+'</td><td class="num">'+(npmPct!==null?pct(npmPct):'–')+'</td></tr>' : '') +
        (v.biayaIsiSaldo !== null ? '<tr><td style="color:var(--ph-faint)">Biaya Isi Saldo Otomatis (dari Penghasilan)</td><td class="num" style="color:var(--ph-faint)">'+rupiah(v.biayaIsiSaldo)+'</td><td class="num" style="color:var(--ph-faint)">'+rowPct(v.biayaIsiSaldo)+'</td></tr>' : '') +
        '</tbody></table>';
    }

    /* ── Proyeksi Ringkasan ── */
    function showSummaryError(msg) {
      $('ph-summary-area').innerHTML = '<div class="ph-error-box">' + esc(msg) + '</div>';
    }

    function renderSummary() {
      var wrap = $('ph-summary-area'); if (!wrap) return;

      var beban       = state.beban || { beban_persen:0, npm_persen:0, target_npm:10 };
      var bebanPct    = parseFloat(beban.beban_persen) || 0;
      var targetNpmPct= parseFloat(beban.target_npm) || 10;
      var totalCutPct = bebanPct + targetNpmPct;    // % dari harga jual yang bukan HPP murni
      var effPct      = totalCutPct / 100;

      var tokoNama    = state.tokoNama || '—';
      var hppEntries  = Object.keys(state.hpp);

      if (!hppEntries.length) {
        wrap.innerHTML =
          '<div class="ph-panel-title" style="margin-top:0"><span>Proyeksi Harga &middot; ' + esc(tokoNama) + '</span></div>' +
          '<div class="ph-info-box">Belum ada data produk di Supabase. Tambah produk di halaman <b>Produk</b> terlebih dahulu.</div>';
        return;
      }

      if (effPct >= 1) {
        showSummaryError('Beban% + Target NPM% >= 100%. Cek setting Channel Master.');
        return;
      }

      var rowsHtml = '';
      var tsvRows  = ['SKU Induk\tHPP\tHarga Jual\tProfit (Rp)\tGPM%\tNPM%'];
      var sumHarga = 0;

      hppEntries.forEach(function(katalog) {
        var hpp    = state.hpp[katalog] || 0;
        var hj     = hpp > 0 ? hpp / (1 - effPct) : null;
        var profitRp = hj !== null ? hj * (targetNpmPct / 100) : null;
        var gpmPct = hj !== null ? ((hj - hpp) / hj) * 100 : null;
        if (hj) sumHarga += hj;

        rowsHtml +=
          '<tr>' +
          '<td style="font-weight:500">' + esc(katalog) + '</td>' +
          '<td class="num">' + rupiah(hpp) + '</td>' +
          '<td class="num" style="font-weight:700">' + (hj ? rupiah(hj) : '&mdash;') + '</td>' +
          '<td class="num" style="color:var(--ph-ok)">' + (profitRp ? rupiah(profitRp) : '&mdash;') + '</td>' +
          '<td class="num">' + (gpmPct !== null ? pct(gpmPct) : '&mdash;') + '</td>' +
          '<td class="num">' + pct(targetNpmPct) + '</td>' +
          '</tr>';

        tsvRows.push([katalog, hpp, hj?Math.round(hj):'', profitRp?Math.round(profitRp):'', gpmPct?gpmPct.toFixed(2):'', targetNpmPct.toFixed(2)].join('\t'));
      });

      wrap.innerHTML =
        '<div class="ph-panel-title" style="margin-top:0">' +
          '<span>Proyeksi Harga &middot; ' + esc(tokoNama) + '</span>' +
          '<span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--ph-dim)">Beban ' + pct(bebanPct) + ' · Target NPM ' + pct(targetNpmPct) + '</span>' +
        '</div>' +
        '<div class="ph-tbl-wrap"><table class="ph-tbl"><thead><tr>' +
          '<th>SKU Induk</th>' +
          '<th class="num">HPP</th>' +
          '<th class="num">Harga Jual Min</th>' +
          '<th class="num">Profit (Rp)</th>' +
          '<th class="num">GPM</th>' +
          '<th class="num">NPM</th>' +
        '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>' +
        '<div class="ph-summary-foot">' +
          '<div style="font-size:12px;color:var(--ph-faint)">Total estimasi omset (1x per SKU): <b style="color:var(--ph-text)">' + rupiah(sumHarga) + '</b></div>' +
          '<button class="ph-btn ph-btn-ghost ph-btn-sm" id="ph-copy-summary-btn">Salin TSV</button>' +
        '</div>';

      var copyBtn = $('ph-copy-summary-btn');
      if (copyBtn) copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(tsvRows.join('\n'))
          .then(function(){ showToast('Disalin! Tinggal paste ke spreadsheet.'); })
          .catch(function(){ showToast('Gagal salin otomatis.'); });
      });
    }

    /* ── Init ── */
    phRefresh();
    switchSection('proyeksi-ringkasan');
  }

})();
