// proyeksi-harga.js — Pricing Engine, extracted dari kalkulator-harga-jual.html
// Diinject ke #page-proyeksi-harga via zenot:page event.
// CSS di-scope ke #page-proyeksi-harga, JS di-scope ke page container.
// Data: localStorage (key: zenoot-pricing-tool-data-v1) — tidak pakai Supabase.

(function () {
  var _phInited = false;

  document.addEventListener('zenot:page', function (e) {
    if (!e.detail || e.detail.page !== 'proyeksi-harga') return;
    if (_phInited) return;
    _phInited = true;
    _phBoot();
  });

  function _phBoot() {
    var pg = document.getElementById('page-proyeksi-harga');
    if (!pg) return;

    // ── Inject font jika belum ada ──
    if (!document.getElementById('ph-font-link')) {
      var lnk = document.createElement('link');
      lnk.id   = 'ph-font-link';
      lnk.rel  = 'stylesheet';
      lnk.href = 'https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
      document.head.appendChild(lnk);
    }

    // ── Inject scoped CSS ──
    if (!document.getElementById('ph-style')) {
      var s = document.createElement('style');
      s.id = 'ph-style';
      s.textContent = PH_CSS;
      document.head.appendChild(s);
    }

    // ── Inject HTML ──
    pg.innerHTML = PH_HTML;
    pg.style.cssText = 'padding:0;overflow:hidden;height:100%;';

    // ── Run app ──
    phApp(pg);
  }

  /* ═══════════════════════════════════════════════════════════════
     CSS — scoped ke #page-proyeksi-harga
  ═══════════════════════════════════════════════════════════════ */
  var PH_CSS = [
    '#page-proyeksi-harga{--ph-bg:#121212;--ph-panel:#181818;--ph-panel2:#1f1f1f;--ph-border:#2c2c2c;--ph-border-s:#232323;--ph-text:#ece9e4;--ph-dim:#9b968d;--ph-faint:#635f58;--ph-accent:#ece9e4;--ph-accent-dim:rgba(236,233,228,0.07);--ph-ink:#121212;--ph-danger:#c98f8f;--ph-r:6px;--ph-mono:"IBM Plex Mono",monospace;--ph-display:"Source Serif 4",Georgia,serif;}',
    '#page-proyeksi-harga{display:flex;flex-direction:column;background:var(--ph-bg);color:var(--ph-text);font-family:var(--body,Inter,sans-serif);overflow:hidden;}',

    /* Shell */
    '#ph-shell{display:flex;flex:1;min-height:0;overflow:hidden;}',
    '#ph-tabs-bar{flex-shrink:0;background:var(--ph-panel);border-right:1px solid var(--ph-border);display:flex;flex-direction:column;gap:4px;padding:16px 10px;overflow-y:auto;width:180px;}',
    '#ph-tabs-bar .ph-tab{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:7px;color:var(--ph-dim);font-size:13.5px;font-weight:500;cursor:pointer;border:1px solid transparent;background:none;text-align:left;width:100%;font-family:inherit;white-space:nowrap;}',
    '#ph-tabs-bar .ph-tab:hover{background:var(--ph-panel2);color:var(--ph-text);}',
    '#ph-tabs-bar .ph-tab.ph-active{background:var(--ph-accent-dim);color:var(--ph-text);border-color:var(--ph-border);}',
    '#ph-tabs-bar .ph-tab-ico{width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
    '#ph-tabs-bar .ph-tab-ico svg{width:17px;height:17px;}',
    '#ph-tabs-bar .ph-submenu{overflow:hidden;max-height:0;transition:max-height .2s ease;display:flex;flex-direction:column;gap:2px;}',
    '#ph-tabs-bar .ph-submenu.ph-open{max-height:120px;}',
    '#ph-tabs-bar .ph-subitem{display:flex;align-items:center;padding:9px 10px 9px 38px;border-radius:7px;font-size:12.5px;color:var(--ph-dim);background:none;border:1px solid transparent;text-align:left;width:100%;cursor:pointer;font-family:inherit;white-space:nowrap;}',
    '#ph-tabs-bar .ph-subitem:hover{background:var(--ph-panel2);color:var(--ph-text);}',
    '#ph-tabs-bar .ph-subitem.ph-active{background:var(--ph-accent-dim);color:var(--ph-text);}',
    '#ph-tabs-bar .ph-chev{margin-left:auto;transition:transform .2s ease;display:flex;}',
    '#ph-tabs-bar .ph-chev.ph-open{transform:rotate(180deg);}',
    '#ph-tabs-bar .ph-rail-badge{font-family:var(--ph-mono);font-size:11px;text-align:center;background:#0a0a0a;border:1px solid var(--ph-border);border-radius:6px;padding:10px 8px;color:var(--ph-text);margin-bottom:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '#ph-tabs-bar .ph-rail-badge:empty{display:none;}',
    '#ph-tabs-bar .ph-rail-foot{font-family:var(--ph-mono);font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:var(--ph-faint);text-align:center;background:#0a0a0a;border:1px solid var(--ph-border-s);border-radius:6px;padding:8px;margin-top:auto;}',
    '#ph-main{flex:1;min-width:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:22px 20px 56px;}',

    /* Section panes */
    '#page-proyeksi-harga .ph-pane{display:none;}',
    '#page-proyeksi-harga .ph-pane.ph-active{display:block;}',

    /* Header */
    '#ph-hdr{margin-bottom:22px;}',
    '#ph-hdr h2{font-family:var(--ph-display);font-size:24px;font-weight:500;margin:0 0 4px;letter-spacing:-.005em;color:var(--ph-text);}',
    '#ph-hdr .ph-sub{color:var(--ph-dim);font-size:12.5px;line-height:1.5;}',
    '#ph-hdr-action{margin-top:10px;}',

    /* Panel */
    '#page-proyeksi-harga .ph-panel{background:var(--ph-panel);border:1px solid var(--ph-border);border-radius:var(--ph-r);padding:18px;margin-bottom:14px;}',
    '#page-proyeksi-harga .ph-panel-title{font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--ph-faint);margin:0 0 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}',
    '#page-proyeksi-harga .ph-panel-title.ph-collapsible{cursor:pointer;user-select:none;}',
    '#page-proyeksi-harga .ph-panel-title.ph-collapsible .ph-chev2{transition:transform .15s;color:var(--ph-faint);font-size:11px;}',
    '#page-proyeksi-harga .ph-panel-title.ph-collapsed .ph-chev2{transform:rotate(-90deg);}',
    '#page-proyeksi-harga .ph-collapse-body.ph-collapsed{display:none;}',

    /* Grid layouts */
    '#page-proyeksi-harga .ph-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}',
    '#page-proyeksi-harga .ph-grid2 .ph-panel{margin-bottom:0;}',

    /* Inputs */
    '#page-proyeksi-harga .ph-field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;}',
    '#page-proyeksi-harga label.ph-label{display:block;font-size:11px;color:var(--ph-faint);margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em;}',
    '#page-proyeksi-harga .ph-input-wrap{position:relative;}',
    '#page-proyeksi-harga .ph-input-wrap .ph-prefix{position:absolute;left:9px;top:50%;transform:translateY(-50%);font-family:var(--ph-mono);font-size:12px;color:var(--ph-faint);pointer-events:none;}',
    '#page-proyeksi-harga .ph-input-wrap .ph-suffix{position:absolute;right:9px;top:50%;transform:translateY(-50%);font-family:var(--ph-mono);font-size:12px;color:var(--ph-faint);pointer-events:none;}',
    '#page-proyeksi-harga .ph-input-wrap input{padding-left:28px;}',
    '#page-proyeksi-harga .ph-input-wrap.ph-suf input{padding-right:24px;padding-left:10px;}',
    '#page-proyeksi-harga input[type=text],#page-proyeksi-harga input[type=number]{background:var(--ph-panel2);border:1px solid var(--ph-border-s);color:var(--ph-text);border-radius:6px;padding:8px 10px;font-family:inherit;font-size:13px;width:100%;box-sizing:border-box;}',
    '#page-proyeksi-harga input[type=text]:focus,#page-proyeksi-harga input[type=number]:focus{outline:none;border-color:var(--ph-dim);}',
    '#page-proyeksi-harga input:disabled{opacity:.4;cursor:not-allowed;}',
    '#page-proyeksi-harga input[type=checkbox]{width:auto;accent-color:var(--ph-dim);cursor:pointer;}',
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

    /* Store/product pills */
    '#page-proyeksi-harga .ph-store-list{display:flex;flex-direction:column;gap:5px;}',
    '#page-proyeksi-harga .ph-store-pill{display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--ph-panel2);border:1px solid var(--ph-border-s);border-radius:6px;padding:9px 12px;cursor:pointer;}',
    '#page-proyeksi-harga .ph-store-pill:hover{border-color:#3a3a3a;}',
    '#page-proyeksi-harga .ph-store-pill.ph-active{border-color:var(--ph-dim);background:var(--ph-accent-dim);}',
    '#page-proyeksi-harga .ph-store-pill .ph-name{font-weight:600;font-size:13.5px;}',
    '#page-proyeksi-harga .ph-store-pill .ph-count{font-family:var(--ph-mono);font-size:11px;color:var(--ph-faint);}',
    '#page-proyeksi-harga .ph-actions{display:flex;gap:4px;opacity:0;}',
    '#page-proyeksi-harga .ph-store-pill:hover .ph-actions{opacity:1;}',
    '#page-proyeksi-harga .ph-icon-btn{background:none;border:none;color:var(--ph-faint);cursor:pointer;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:13px;}',
    '#page-proyeksi-harga .ph-icon-btn:hover{color:var(--ph-text);background:rgba(255,255,255,.05);}',
    '#page-proyeksi-harga .ph-icon-btn.ph-danger:hover{color:var(--ph-danger);}',
    '#page-proyeksi-harga .ph-product-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 4px;border-bottom:1px solid var(--ph-border-s);cursor:pointer;}',
    '#page-proyeksi-harga .ph-product-row:last-child{border-bottom:none;}',
    '#page-proyeksi-harga .ph-product-row .ph-pname{font-size:13px;font-weight:500;word-break:break-word;}',
    '#page-proyeksi-harga .ph-product-row .ph-phpp{font-family:var(--ph-mono);font-size:12px;color:var(--ph-dim);}',
    '#page-proyeksi-harga .ph-product-row.ph-sel{background:var(--ph-accent-dim);border-radius:6px;}',
    '#page-proyeksi-harga .ph-product-row .ph-actions{opacity:0;}',
    '#page-proyeksi-harga .ph-product-row:hover .ph-actions{opacity:1;}',
    '#page-proyeksi-harga .ph-empty{color:var(--ph-faint);font-size:12.5px;padding:8px 2px;line-height:1.5;}',

    /* Platform tabs */
    '#page-proyeksi-harga .ph-ptabs{display:flex;gap:8px;flex-wrap:wrap;}',
    '#page-proyeksi-harga .ph-ptab{flex:1;min-width:100px;border-radius:6px;border:1px solid var(--ph-border-s);background:var(--ph-panel2);padding:10px 12px;cursor:pointer;text-align:left;}',
    '#page-proyeksi-harga .ph-ptab:disabled{opacity:.4;cursor:not-allowed;}',
    '#page-proyeksi-harga .ph-ptab .ph-ptab-name{font-weight:600;font-size:13.5px;}',
    '#page-proyeksi-harga .ph-ptab .ph-ptab-def{font-family:var(--ph-mono);font-size:11px;color:var(--ph-faint);margin-top:2px;}',
    '#page-proyeksi-harga .ph-ptab[data-active="true"]{border-color:var(--ph-dim);box-shadow:inset 0 0 0 1px var(--ph-dim);background:var(--ph-accent-dim);}',
    '#page-proyeksi-harga .ph-dot{width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:6px;background:var(--ph-dim);}',
    '#page-proyeksi-harga .ph-saved{font-family:var(--ph-mono);font-size:11px;color:var(--ph-dim);opacity:0;transition:opacity .3s;}',
    '#page-proyeksi-harga .ph-saved.ph-show{opacity:1;}',
    '#page-proyeksi-harga .ph-settings-note{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:11.5px;color:var(--ph-faint);flex-wrap:wrap;}',

    /* Result / hero */
    '#page-proyeksi-harga .ph-hero{margin-top:4px;padding:22px 18px;border-radius:8px;background:var(--ph-panel2);border:1px solid var(--ph-border);text-align:center;}',
    '#page-proyeksi-harga .ph-hero-label{font-family:var(--ph-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ph-faint);}',
    '#page-proyeksi-harga .ph-hero-num{font-family:var(--ph-display);font-size:36px;font-weight:500;margin-top:6px;letter-spacing:-.005em;}',
    '#page-proyeksi-harga .ph-hero-sub{font-size:12px;color:var(--ph-dim);margin-top:6px;}',
    '#page-proyeksi-harga .ph-error-box{background:rgba(201,143,143,.1);border:1px solid rgba(201,143,143,.3);color:#d9b3b3;border-radius:6px;padding:12px 14px;font-size:13px;margin-top:12px;}',

    /* Metrics grid */
    '#page-proyeksi-harga .ph-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:12px;}',
    '#page-proyeksi-harga .ph-metric{background:var(--ph-panel2);border:1px solid var(--ph-border-s);border-radius:6px;padding:10px 12px;}',
    '#page-proyeksi-harga .ph-mlabel{font-family:var(--ph-mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ph-faint);margin-bottom:4px;}',
    '#page-proyeksi-harga .ph-mval{font-size:18px;font-weight:700;color:var(--ph-text);}',

    /* Bar */
    '#page-proyeksi-harga .ph-bar-wrap{margin-top:14px;}',
    '#page-proyeksi-harga .ph-bar{height:10px;border-radius:4px;overflow:hidden;display:flex;background:#232323;}',
    '#page-proyeksi-harga .ph-seg{height:100%;}',
    '#page-proyeksi-harga .ph-leg-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:5px;}',

    /* Tables */
    '#page-proyeksi-harga .ph-tbl{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:12px;}',
    '#page-proyeksi-harga .ph-tbl thead th{background:var(--ph-panel2);padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--ph-faint);border-bottom:1px solid var(--ph-border);}',
    '#page-proyeksi-harga .ph-tbl thead th.num{text-align:right;}',
    '#page-proyeksi-harga .ph-tbl tbody td{padding:7px 8px;border-top:1px solid var(--ph-border-s);}',
    '#page-proyeksi-harga .ph-tbl tbody td.num{text-align:right;font-family:var(--ph-mono);}',
    '#page-proyeksi-harga .ph-tbl .ph-total td{font-weight:700;border-top:2px solid var(--ph-dim);}',
    '#page-proyeksi-harga .ph-tbl tr.ph-sel{background:var(--ph-accent-dim);}',
    '#page-proyeksi-harga .ph-tbl .ph-preview-wrap{max-height:220px;overflow-y:auto;border:1px solid var(--ph-border-s);border-radius:7px;margin-top:10px;}',

    /* Parse boxes */
    '#page-proyeksi-harga details.ph-parse-box{margin-top:14px;border:1px solid var(--ph-border-s);border-radius:6px;background:var(--ph-panel2);overflow:hidden;}',
    '#page-proyeksi-harga details.ph-parse-box summary{cursor:pointer;list-style:none;padding:10px 13px;font-size:13px;font-weight:600;color:var(--ph-dim);display:flex;align-items:center;gap:8px;user-select:none;}',
    '#page-proyeksi-harga details.ph-parse-box summary::-webkit-details-marker{display:none;}',
    '#page-proyeksi-harga details.ph-parse-box summary::before{content:"▸";font-size:11px;color:var(--ph-faint);transition:transform .15s;}',
    '#page-proyeksi-harga details.ph-parse-box[open] summary::before{transform:rotate(90deg);}',
    '#page-proyeksi-harga .ph-parse-body{padding:0 13px 14px;border-top:1px solid var(--ph-border-s);}',
    '#page-proyeksi-harga .ph-parse-hint{font-size:11.5px;color:var(--ph-faint);margin:10px 0 7px;line-height:1.5;}',
    '#page-proyeksi-harga .ph-parse-actions{display:flex;gap:8px;margin-top:9px;flex-wrap:wrap;}',
    '#page-proyeksi-harga .ph-parse-status{font-size:12px;margin-top:9px;padding:8px 10px;border-radius:6px;line-height:1.5;}',
    '#page-proyeksi-harga .ph-parse-status.ok{background:rgba(255,255,255,.04);border:1px solid var(--ph-border);color:var(--ph-dim);}',
    '#page-proyeksi-harga .ph-parse-status.fail{background:rgba(201,143,143,.08);border:1px solid rgba(201,143,143,.3);color:#d9b3b3;}',
    '#page-proyeksi-harga .ph-parse-preview{margin-top:10px;padding:9px 11px;background:var(--ph-bg);border:1px solid var(--ph-border-s);border-radius:6px;font-family:var(--ph-mono);font-size:12px;color:var(--ph-dim);}',
    '#page-proyeksi-harga .ph-parse-preview b{color:var(--ph-text);}',

    /* Summary table */
    '#page-proyeksi-harga .ph-summary-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;flex-wrap:wrap;}',

    /* Toast */
    '#ph-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(10px);background:var(--ph-panel2);border:1px solid var(--ph-border);color:var(--ph-text);padding:9px 15px;border-radius:6px;font-size:13px;opacity:0;pointer-events:none;transition:all .25s;z-index:99999;max-width:90vw;text-align:center;}',
    '#ph-toast.ph-show{opacity:1;transform:translateX(-50%) translateY(0);}',

    /* Responsive */
    '@media(max-width:600px){#ph-tabs-bar{width:140px;padding:12px 8px;}#ph-tabs-bar .ph-tab{font-size:12px;padding:9px 8px;}#ph-main{padding:14px 12px 48px;}#page-proyeksi-harga .ph-grid2{grid-template-columns:1fr;}#page-proyeksi-harga .ph-field-row{grid-template-columns:1fr;}}',
    '@media(max-width:420px){#ph-tabs-bar{width:44px;}#ph-tabs-bar .ph-tab span:not(.ph-tab-ico){display:none;}#ph-tabs-bar .ph-subitem{padding:9px 10px;}#ph-tabs-bar .ph-subitem span{display:none;}}'
  ].join('\n');

  /* ═══════════════════════════════════════════════════════════════
     HTML — tanpa app-shell / section-rail lama
  ═══════════════════════════════════════════════════════════════ */
  var PH_HTML = '<div id="ph-shell">' +
    '<nav id="ph-tabs-bar">' +
      '<div id="ph-rail-badge" class="ph-rail-badge"></div>' +
      '<button class="ph-tab" data-sec="setting" type="button"><span class="ph-tab-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V19a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 5.65 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9.01 4.6h.09A1.7 1.7 0 0 0 10.74 4V4a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 16.3 5.65a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 20.66 9h.09a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 13z"/></svg></span><span>Setting</span></button>' +
      '<button class="ph-tab" data-sec="pesanan" type="button"><span class="ph-tab-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9.5" x2="21" y2="9.5"/><line x1="7.5" y1="14" x2="13" y2="14"/></svg></span><span>Pesanan</span></button>' +
      '<button class="ph-tab" data-sec="hpp" type="button"><span class="ph-tab-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 3v9M12 12l8-4.5M12 12l-8-4.5"/></svg></span><span>HPP</span></button>' +
      '<button class="ph-tab ph-active" data-sec="biaya" type="button"><span class="ph-tab-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.2"/><rect x="13" y="3" width="8" height="8" rx="1.2"/><rect x="3" y="13" width="8" height="8" rx="1.2"/><rect x="13" y="13" width="8" height="8" rx="1.2"/></svg></span><span>Price Analysis</span></button>' +
      '<button class="ph-tab ph-has-children" id="ph-proyeksi-toggle" type="button"><span class="ph-tab-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M7 19V11"/><path d="M12 19V6"/><path d="M17 19v-9"/></svg></span><span>Proyeksi</span><span class="ph-chev" id="ph-proy-chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span></button>' +
      '<div class="ph-submenu" id="ph-proy-submenu"><button class="ph-subitem" data-sec="proyeksi-ringkasan" type="button"><span>Proyeksi Harga</span></button><button class="ph-subitem" data-sec="proyeksi-platform" type="button"><span>Platform</span></button></div>' +
      '<div style="flex:1 1 auto;min-height:8px;"></div>' +
      '<div class="ph-rail-foot">Pricing Engine</div>' +
    '</nav>' +
    '<div id="ph-main">' +
      '<div id="ph-hdr"><h2 id="ph-heading">Price Analysis</h2><div class="ph-sub" id="ph-sub">Total biaya &amp; komponen biaya real per pesanan.</div><div id="ph-hdr-action" style="display:none;"></div></div>' +

      /* Pane: Setting */
      '<section class="ph-pane" id="ph-pane-setting">' +
        '<div class="ph-panel">' +
          '<div class="ph-panel-title ph-collapsible" id="ph-toko-title"><span>Toko</span><span class="ph-chev2">▾</span></div>' +
          '<div class="ph-collapse-body" id="ph-toko-body">' +
            '<div class="ph-store-list" id="ph-store-list"></div>' +
            '<div class="ph-add-row"><input type="text" id="ph-new-store" placeholder="Nama toko baru..."><button class="ph-btn ph-btn-accent ph-btn-sm" id="ph-add-store-btn">+ Toko</button></div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      /* Pane: Pesanan */
      '<section class="ph-pane" id="ph-pane-pesanan">' +
        '<div class="ph-grid2">' +
          '<div class="ph-panel"><div class="ph-panel-title"><span>Rincian Penghasilan</span><span style="color:var(--ph-faint);font-weight:400;text-transform:none;letter-spacing:0">sisi penjual</span></div><div class="ph-parse-hint">Paste seluruh detail "Rincian Penghasilan" dari halaman pesanan platform.</div><textarea id="ph-penghasilan-ta" placeholder="Paste teks Rincian Penghasilan..."></textarea><div id="ph-penghasilan-status"></div><div class="ph-parse-preview" id="ph-penghasilan-preview"></div></div>' +
          '<div class="ph-panel"><div class="ph-panel-title"><span>Pembayaran Pembeli</span><span style="color:var(--ph-faint);font-weight:400;text-transform:none;letter-spacing:0">sisi pembeli</span></div><div class="ph-parse-hint">Paste detail "Total Pembayaran Pembeli" dari sisi pembeli.</div><textarea id="ph-pembayaran-ta" placeholder="Paste teks Pembayaran Pembeli..."></textarea><div id="ph-pembayaran-status"></div><div class="ph-parse-preview" id="ph-pembayaran-preview"></div></div>' +
        '</div>' +
        '<div style="margin-top:10px;"><button class="ph-btn ph-btn-accent" id="ph-pesanan-action-btn">Parse Otomatis</button></div>' +
      '</section>' +

      /* Pane: HPP */
      '<section class="ph-pane" id="ph-pane-hpp">' +
        '<div class="ph-panel">' +
          '<div class="ph-panel-title"><span>Produk / SKU Induk</span><span id="ph-product-store-label" style="color:var(--ph-faint);font-weight:400;text-transform:none;letter-spacing:0"></span><button class="ph-btn ph-btn-ghost ph-btn-sm" id="ph-clear-all-btn" style="margin-left:auto">Hapus semua</button></div>' +
          '<div id="ph-product-list"></div>' +
          '<div class="ph-add-row"><input type="text" id="ph-new-prod-name" placeholder="Nama produk..." style="flex:1.4;min-width:80px"><input type="number" id="ph-new-prod-hpp" placeholder="HPP (Rp)" style="flex:1;min-width:70px"><button class="ph-btn ph-btn-accent ph-btn-sm" id="ph-add-prod-btn">+ Produk</button></div>' +
          '<details class="ph-parse-box" id="ph-import-box"><summary>Import banyak produk (paste dari Excel/Spreadsheet)</summary><div class="ph-parse-body"><div class="ph-parse-hint">1 baris = 1 produk. Pisahkan kolom dengan TAB atau titik koma ( ; ). Format: <b>SKU Induk &#9; SKU Variasi &#9; HPP</b>. Baris header dilewati otomatis.</div><textarea id="ph-import-ta" placeholder="Turtleneck&#9;Turtleneck_HITAM-M&#9;41.000&#10;..."></textarea><div class="ph-parse-actions"><button class="ph-btn ph-btn-accent ph-btn-sm" id="ph-import-parse-btn">Cek Data</button><button class="ph-btn ph-btn-ghost ph-btn-sm" id="ph-import-clear-btn">Bersihkan</button></div><div id="ph-import-preview"></div></div></details>' +
        '</div>' +
        '<div class="ph-panel">' +
          '<div class="ph-panel-title">HPP</div>' +
          '<div class="ph-field-row" style="grid-template-columns:1fr"><div><label class="ph-label">HPP (modal produk) — produk aktif</label><div class="ph-input-wrap"><span class="ph-prefix">Rp</span><input type="number" id="ph-hpp-input" placeholder="0"></div></div></div>' +
          '<details class="ph-parse-box" id="ph-hpp-bulk-box"><summary>Update HPP banyak produk sekaligus (paste)</summary><div class="ph-parse-body"><div class="ph-parse-hint">1 baris = 1 produk/variasi. TAB atau titik koma ( ; ). Format: <b>SKU Induk &#9; SKU Variasi &#9; HPP</b>. Dukung rentang <b>Kode A -> Kode B</b>.</div><textarea id="ph-hpp-bulk-ta" placeholder="Turtleneck&#9;Turtleneck_HITAM-M -> Turtleneck_Mocca-M&#9;41.000&#10;..."></textarea><div class="ph-parse-actions"><button class="ph-btn ph-btn-accent ph-btn-sm" id="ph-hpp-bulk-parse-btn">Cek Data</button><button class="ph-btn ph-btn-ghost ph-btn-sm" id="ph-hpp-bulk-clear-btn">Bersihkan</button></div><div id="ph-hpp-bulk-preview"></div></div></details>' +
        '</div>' +
      '</section>' +

      /* Pane: Biaya */
      '<section class="ph-pane ph-active" id="ph-pane-biaya">' +
        '<div class="ph-panel"><div class="ph-panel-title">Total Biaya &amp; Benefit (per order)</div><div id="ph-biaya-empty" class="ph-parse-hint">Paste "Rincian Penghasilan" di section Pesanan dulu untuk lihat total biaya &amp; benefit real per order.</div><div class="ph-metrics" id="ph-biaya-metrics" style="display:none"><div class="ph-metric"><div class="ph-mlabel">Cost Ratio</div><div class="ph-mval" id="ph-m-cost-ratio">0%</div></div><div class="ph-metric"><div class="ph-mlabel">Net Profit Margin</div><div class="ph-mval" id="ph-m-npm">–</div></div><div class="ph-metric"><div class="ph-mlabel">Gross Margin</div><div class="ph-mval" id="ph-m-gm">–</div></div><div class="ph-metric"><div class="ph-mlabel">Platform Fee</div><div class="ph-mval" id="ph-m-pf-pct">0%</div></div><div class="ph-metric"><div class="ph-mlabel">Total Cost</div><div class="ph-mval" id="ph-m-total-cost" style="color:var(--ph-danger)">Rp 0</div></div><div class="ph-metric"><div class="ph-mlabel">Profit Aktual</div><div class="ph-mval" id="ph-m-benefit">isi HPP dulu</div></div><div class="ph-metric"><div class="ph-mlabel">Subtotal</div><div class="ph-mval" id="ph-m-subtotal">Rp 0</div></div><div class="ph-metric"><div class="ph-mlabel">Biaya Platform</div><div class="ph-mval" id="ph-m-pf-idr" style="color:var(--ph-danger)">Rp 0</div></div></div></div>' +
        '<div class="ph-panel"><div class="ph-panel-title">Komponen Biaya</div><div id="ph-biaya-card"></div></div>' +
      '</section>' +

      /* Pane: Proyeksi Ringkasan */
      '<section class="ph-pane" id="ph-pane-proyeksi-ringkasan">' +
        '<div class="ph-panel" id="ph-summary-panel"><div id="ph-summary-area"></div></div>' +
      '</section>' +

      /* Pane: Proyeksi Platform */
      '<section class="ph-pane" id="ph-pane-proyeksi-platform">' +
        '<div class="ph-panel">' +
          '<div class="ph-panel-title">Platform</div>' +
          '<div class="ph-ptabs" id="ph-platform-tabs"></div>' +
          '<div class="ph-field-row"><div><label class="ph-label">Adm % (biaya platform)</label><div class="ph-input-wrap ph-suf"><span class="ph-suffix">%</span><input type="number" id="ph-adm-input" step="0.01"></div></div><div><label class="ph-label">ACOS % (iklan)</label><div class="ph-input-wrap ph-suf"><span class="ph-suffix">%</span><input type="number" id="ph-acos-input" step="0.01"></div></div></div>' +
          '<div class="ph-field-row" style="grid-template-columns:1fr"><div><label class="ph-label">Target profit / pesanan</label><div class="ph-input-wrap"><span class="ph-prefix">Rp</span><input type="number" id="ph-npm-input" value="10000"></div></div></div>' +
          '<div class="ph-settings-note"><span>Adm %, ACOS %, dan Target Profit tersimpan otomatis untuk toko ini.</span><span class="ph-saved" id="ph-saved-badge">✓ Tersimpan</span><button class="ph-btn ph-btn-ghost ph-btn-sm" id="ph-reset-platform-btn" style="margin-left:auto">↺ Reset ke default</button></div>' +
          '<div id="ph-result-area"></div>' +
        '</div>' +
      '</section>' +

    '</div>' +
  '</div>' +
  '<div id="ph-toast"></div>';

  /* ═══════════════════════════════════════════════════════════════
     APP LOGIC
  ═══════════════════════════════════════════════════════════════ */
  function phApp(pg) {
    var $ = function(id){ return document.getElementById(id); };
    var $$ = function(sel, ctx){ return (ctx||pg).querySelectorAll(sel); };

    var STORAGE_KEY  = 'zenoot-pricing-tool-data-v1';
    var LAST_STORE_KEY = 'zenoot-pricing-tool-last-store-v1';

    var PLATFORM_META = { Shopee:{color:'#cfc9bf'}, TikTok:{color:'#cfc9bf'}, Lazada:{color:'#cfc9bf'} };
    var PLATFORM_PRESETS = { Shopee:{adm:41.25,acos:10}, TikTok:{adm:50.65,acos:10}, Lazada:{adm:27.70,acos:10} };

    var PENGHASILAN_FIELDS = [
      {key:'subtotalPesanan',label:'Subtotal Pesanan',group:'omset'},
      {key:'hargaProduk',label:'Harga Produk',group:'omset'},
      {key:'ongkirDibayarPembeli',label:'Ongkir Dibayar Pembeli',group:'omset'},
      {key:'potonganOngkirShopee',label:'Estimasi Potongan Ongkos Kirim dari Shopee',group:'omset'},
      {key:'voucherSubsidiShopee',label:'Voucher & Subsidi Shopee',group:'potongan'},
      {key:'voucherToko',label:'Voucher Toko yang ditanggung Penjual',group:'potongan'},
      {key:'biayaAdministrasi',label:'Biaya Administrasi',group:'biaya'},
      {key:'biayaLayanan',label:'Biaya Layanan',group:'biaya'},
      {key:'biayaProsesPesanan',label:'Biaya Proses Pesanan',group:'biaya'},
      {key:'biayaIsiSaldo',label:'Biaya Isi Saldo Otomatis',group:'biaya'},
      {key:'totalPenghasilan',label:'Estimasi Total Penghasilan',group:'total'}
    ];
    var PEMBAYARAN_FIELDS = [
      {key:'subtotalPesanan',label:'Subtotal Pesanan',group:'omset'},
      {key:'ongkosKirim',label:'Ongkos Kirim',group:'omset'},
      {key:'voucherShopee',label:'Voucher Shopee',group:'potongan'},
      {key:'voucherToko',label:'Voucher Toko',group:'potongan'},
      {key:'biayaLayanan',label:'Biaya Layanan',group:'biaya'},
      {key:'totalPembayaran',label:'Total Pembayaran Pembeli',group:'total'}
    ];

    var data = null;
    var state = { storeId: null, productId: null };
    var pendingImportRows = null, pendingHppBulkRows = null;
    var saveTimer = null;

    /* ── utils ── */
    function uid(){ return Math.random().toString(36).slice(2,10); }

    function rupiah(n){
      if(isNaN(n)||n===null) return 'Rp 0';
      return 'Rp '+Math.round(n).toLocaleString('id-ID');
    }
    function pct(n){
      if(isNaN(n)||n===null) return '0%';
      return n.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
    }
    function esc(s){
      var d=document.createElement('div'); d.textContent=s==null?'':String(s); return d.innerHTML;
    }

    function parseRupiahLine(str){
      if(str==null) return null;
      if(!/[0-9]/.test(str)) return null;
      var s=String(str).trim();
      var negative=/-/.test(s);
      s=s.replace(/Rp/gi,'').replace(/-/g,'').replace(/\s/g,'');
      if(s==='') return null;
      var hasComma=s.includes(','), hasDot=s.includes('.');
      var num;
      if(hasComma&&hasDot){ num=parseFloat(s.replace(/,/g,'')); }
      else if(hasDot&&!hasComma){ var parts=s.split('.'); var ll=parts[parts.length-1].length; num=(parts.length>1&&ll===3)?parseFloat(parts.join('')):parseFloat(s); }
      else if(hasComma&&!hasDot){ var parts2=s.split(','); var ll2=parts2[parts2.length-1].length; num=(parts2.length>1&&ll2===3)?parseFloat(parts2.join('')):parseFloat(s.replace(',','.')); }
      else { num=parseFloat(s); }
      if(isNaN(num)) return null;
      return negative?-num:num;
    }

    function splitColumns(line){
      if(line.includes('\t')) return line.split('\t').map(function(s){return s.trim();});
      if(line.includes(';')) return line.split(';').map(function(s){return s.trim();});
      if(/ {2,}/.test(line)) return line.split(/ {2,}/).map(function(s){return s.trim();});
      return null;
    }

    function showToast(msg){
      var t=$('ph-toast'); t.textContent=msg; t.classList.add('ph-show');
      clearTimeout(t._t); t._t=setTimeout(function(){t.classList.remove('ph-show');},1800);
    }

    function flashSaved(){
      var b=$('ph-saved-badge'); if(!b) return;
      b.classList.add('ph-show'); clearTimeout(b._t); b._t=setTimeout(function(){b.classList.remove('ph-show');},1400);
    }

    /* ── data ── */
    function defaultStoreSettings(){
      return {platform:'Shopee',targetNpm:10000,platformSettings:{Shopee:{adm:PLATFORM_PRESETS.Shopee.adm,acos:PLATFORM_PRESETS.Shopee.acos},TikTok:{adm:PLATFORM_PRESETS.TikTok.adm,acos:PLATFORM_PRESETS.TikTok.acos},Lazada:{adm:PLATFORM_PRESETS.Lazada.adm,acos:PLATFORM_PRESETS.Lazada.acos}},lastParsedPenghasilan:null,lastParsedPembayaran:null,activeProductId:null,manualHpp:null,adsAcosAktual:null,affiliateAktual:null};
    }
    function defaultData(){
      return {stores:[Object.assign({id:uid(),name:'ZENOOT',products:[{id:uid(),name:'TURTLENECK',hpp:42000,parentSku:'TURTLENECK'}]},defaultStoreSettings()),Object.assign({id:uid(),name:'ALLEY',products:[{id:uid(),name:'MAYRA',hpp:57500,parentSku:'MAYRA'}]},defaultStoreSettings()),Object.assign({id:uid(),name:'ELENZ',products:[]},defaultStoreSettings())]};
    }
    function loadData(){
      try{ var raw=localStorage.getItem(STORAGE_KEY); if(raw===null) throw new Error('no data'); data=JSON.parse(raw); }
      catch(e){ data=defaultData(); persist(); return; }
      migrateData();
    }
    function migrateData(){
      if(!data||!Array.isArray(data.stores)){data=defaultData();return;}
      var migrated=false;
      var ld=data.platformDefaults||null;
      data.stores.forEach(function(store){
        if(!Array.isArray(store.products)){store.products=[];migrated=true;}
        store.products.forEach(function(p){if(!p.parentSku||typeof p.parentSku!=='string'||!p.parentSku.trim()){p.parentSku=p.name;migrated=true;}});
        if(!store.platformSettings||typeof store.platformSettings!=='object'){var base=ld||PLATFORM_PRESETS;store.platformSettings={Shopee:{adm:(base.Shopee||PLATFORM_PRESETS.Shopee).adm,acos:(base.Shopee||PLATFORM_PRESETS.Shopee).acos},TikTok:{adm:(base.TikTok||PLATFORM_PRESETS.TikTok).adm,acos:(base.TikTok||PLATFORM_PRESETS.TikTok).acos},Lazada:{adm:(base.Lazada||PLATFORM_PRESETS.Lazada).adm,acos:(base.Lazada||PLATFORM_PRESETS.Lazada).acos}};migrated=true;}
        if(!store.platform||!PLATFORM_META[store.platform]){store.platform='Shopee';migrated=true;}
        if(typeof store.targetNpm!=='number'||isNaN(store.targetNpm)){store.targetNpm=10000;migrated=true;}
        ['lastParsedPenghasilan','lastParsedPembayaran','activeProductId','manualHpp','adsAcosAktual','affiliateAktual'].forEach(function(k){if(store[k]===undefined){store[k]=null;migrated=true;}});
      });
      if(data.platformDefaults){delete data.platformDefaults;migrated=true;}
      if(migrated) persist();
    }
    function persist(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(e){showToast('Gagal menyimpan data.');} }
    function debouncedSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(function(){persist();flashSaved();},500); }

    function currentStore(){ return data.stores.find(function(s){return s.id===state.storeId;})||null; }
    function currentProduct(){ var s=currentStore(); if(!s) return null; return s.products.find(function(p){return p.id===state.productId;})||null; }

    function saveLastStore(id){ try{if(id)localStorage.setItem(LAST_STORE_KEY,id);}catch(e){} }
    function readLastStore(){ try{return localStorage.getItem(LAST_STORE_KEY)||null;}catch(e){return null;} }

    /* ── section navigation ── */
    var SECTION_META = {
      'setting':             {title:'Setting',          sub:'Kelola toko — tambah, hapus, dan pilih toko aktif.'},
      'pesanan':             {title:'Pesanan & Pembayaran', sub:'Paste Rincian Penghasilan & Pembayaran Pembeli untuk hitung biaya otomatis.'},
      'hpp':                 {title:'HPP',              sub:'Modal produk — dipakai untuk hitung profit & harga jual.'},
      'biaya':               {title:'Price Analysis',   sub:'Total biaya & komponen biaya real per pesanan, dari Rincian Penghasilan.'},
      'proyeksi-ringkasan':  {title:'Proyeksi Harga',   sub:'Ringkasan harga jual per SKU Induk — HPP, harga jual, profit, dan GPM.'},
      'proyeksi-platform':   {title:'Proyeksi · Platform', sub:'Kalkulator harga jual minimum per platform — Adm%, ACOS%, Target Profit.'}
    };

    function setProyeksiOpen(open){
      $('ph-proy-submenu').classList.toggle('ph-open',open);
      $('ph-proy-chev').classList.toggle('ph-open',open);
    }

    function switchSection(key){
      $$('.ph-tab').forEach(function(b){b.classList.toggle('ph-active',b.dataset.sec===key);});
      $$('.ph-subitem').forEach(function(b){b.classList.toggle('ph-active',b.dataset.sec===key);});
      $('ph-proyeksi-toggle').classList.toggle('ph-active',key==='proyeksi-ringkasan'||key==='proyeksi-platform');
      $$('.ph-pane').forEach(function(p){p.classList.toggle('ph-active',p.id==='ph-pane-'+key);});
      if(key==='proyeksi-ringkasan'||key==='proyeksi-platform') setProyeksiOpen(true);
      var hdrAction=$('ph-hdr-action');
      hdrAction.style.display='none'; hdrAction.innerHTML='';
      if(key==='biaya'){
        hdrAction.style.display='flex'; hdrAction.style.gap='10px'; hdrAction.style.flexWrap='wrap';
        hdrAction.innerHTML='<div style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap"><div><label class="ph-label">Affiliate (%)</label><div class="ph-input-wrap ph-suf"><span class="ph-suffix">%</span><input type="number" id="ph-affiliate-input" step="0.01" placeholder="0" style="width:90px"></div></div><div><label class="ph-label">ACOS (%)</label><div class="ph-input-wrap ph-suf"><span class="ph-suffix">%</span><input type="number" id="ph-acos-aktual-input" step="0.01" placeholder="0" style="width:90px"></div></div></div>';
        var store=currentStore();
        if(store){
          if($('ph-affiliate-input')) $('ph-affiliate-input').value=store.affiliateAktual===null?'':store.affiliateAktual;
          if($('ph-acos-aktual-input')) $('ph-acos-aktual-input').value=store.adsAcosAktual===null?'':store.adsAcosAktual;
          if($('ph-affiliate-input')) $('ph-affiliate-input').addEventListener('input',function(){var store2=currentStore();if(!store2)return;var v=this.value===''?null:parseFloat(this.value);store2.affiliateAktual=(v===null||isNaN(v))?null:v;debouncedSave();renderBiayaBenefit();});
          if($('ph-acos-aktual-input')) $('ph-acos-aktual-input').addEventListener('input',function(){var store2=currentStore();if(!store2)return;var v=this.value===''?null:parseFloat(this.value);store2.adsAcosAktual=(v===null||isNaN(v))?null:v;debouncedSave();renderBiayaBenefit();});
        }
      }
      if(key==='proyeksi-ringkasan'){
        hdrAction.style.display='flex';
        hdrAction.innerHTML='<div><label class="ph-label">Target Profit</label><div class="ph-input-wrap"><span class="ph-prefix">Rp</span><input type="number" id="ph-npm-header-input" step="100" placeholder="10000" style="width:130px"></div></div>';
        var store=currentStore();
        if(store&&$('ph-npm-header-input')){ $('ph-npm-header-input').value=store.targetNpm; $('ph-npm-header-input').addEventListener('input',function(){var s=currentStore();if(!s)return;var v=parseFloat(this.value);s.targetNpm=isNaN(v)?0:v;if($('ph-npm-input'))$('ph-npm-input').value=this.value;debouncedSave();calculate();}); }
      }
      var meta=SECTION_META[key];
      if(meta){ $('ph-heading').textContent=meta.title; $('ph-sub').textContent=meta.sub; }
    }

    $$('.ph-tab[data-sec]').forEach(function(b){ b.addEventListener('click',function(){switchSection(b.dataset.sec);}); });
    $$('.ph-subitem').forEach(function(b){ b.addEventListener('click',function(){switchSection(b.dataset.sec);}); });
    $('ph-proyeksi-toggle').addEventListener('click',function(){setProyeksiOpen(!$('ph-proy-submenu').classList.contains('ph-open'));});
    $('ph-toko-title').addEventListener('click',function(){this.classList.toggle('ph-collapsed');$('ph-toko-body').classList.toggle('ph-collapsed');});

    /* ── render stores ── */
    function renderStores(){
      var list=$('ph-store-list'); list.innerHTML='';
      var badge=$('ph-rail-badge'); if(badge){var s=currentStore();badge.textContent=s?s.name:'';}  
      if(!data.stores.length){list.innerHTML='<div class="ph-empty">Belum ada toko.</div>';return;}
      data.stores.forEach(function(store){
        var pill=document.createElement('div');
        pill.className='ph-store-pill'+(store.id===state.storeId?' ph-active':'');
        pill.innerHTML='<div><div class="ph-name">'+esc(store.name)+'</div><div class="ph-count">'+store.products.length+' produk &middot; '+esc(store.platform)+'</div></div><div class="ph-actions"><button class="ph-icon-btn" data-a="rename">&#9998;</button><button class="ph-icon-btn ph-danger" data-a="delete">&#10005;</button></div>';
        pill.addEventListener('click',function(e){if(e.target.closest('[data-a]'))return;state.storeId=store.id;state.productId=null;saveLastStore(store.id);renderAll();});
        pill.querySelector('[data-a=rename]').addEventListener('click',function(e){e.stopPropagation();var n=prompt('Nama baru:',store.name);if(n&&n.trim()){store.name=n.trim();persist();renderAll();}});
        pill.querySelector('[data-a=delete]').addEventListener('click',function(e){e.stopPropagation();if(!confirm('Hapus toko "'+store.name+'" beserta semua produknya?'))return;data.stores=data.stores.filter(function(s){return s.id!==store.id;});if(state.storeId===store.id){state.storeId=data.stores[0]?data.stores[0].id:null;state.productId=null;saveLastStore(state.storeId);}persist();renderAll();});
        list.appendChild(pill);
      });
      if(badge){var cs=currentStore();badge.textContent=cs?cs.name:'';}
    }

    /* ── render products ── */
    function renderProducts(){
      var list=$('ph-product-list'); var lbl=$('ph-product-store-label'); var store=currentStore();
      list.innerHTML=''; if(lbl)lbl.textContent=store?store.name:'';
      if(!store){list.innerHTML='<div class="ph-empty">Pilih toko dulu.</div>';return;}
      if(!store.products.length){list.innerHTML='<div class="ph-empty">Belum ada produk. Tambah manual atau import dari spreadsheet.</div>';return;}
      store.products.forEach(function(p){
        var row=document.createElement('div');
        row.className='ph-product-row'+(p.id===state.productId?' ph-sel':'');
        row.innerHTML='<div><div class="ph-pname">'+esc(p.name)+'</div><div class="ph-phpp">HPP '+rupiah(p.hpp)+'</div></div><div class="ph-actions"><button class="ph-icon-btn" data-a="edit">&#9998;</button><button class="ph-icon-btn ph-danger" data-a="delete">&#10005;</button></div>';
        row.addEventListener('click',function(e){if(e.target.closest('[data-a]'))return;setActiveProduct(store,p);renderProducts();});
        row.querySelector('[data-a=edit]').addEventListener('click',function(e){e.stopPropagation();var n=prompt('Nama baru:',p.name);if(n&&n.trim()){p.name=n.trim();persist();renderProducts();renderBiayaBenefit();}});
        row.querySelector('[data-a=delete]').addEventListener('click',function(e){e.stopPropagation();if(!confirm('Hapus produk "'+p.name+'"?'))return;store.products=store.products.filter(function(x){return x.id!==p.id;});if(state.productId===p.id)state.productId=null;if(store.activeProductId===p.id)store.activeProductId=null;persist();renderProducts();calculate();renderBiayaBenefit();});
        list.appendChild(row);
      });
    }

    function setActiveProduct(store,p){ state.productId=p.id;store.activeProductId=p.id;store.manualHpp=null;if($('ph-hpp-input'))$('ph-hpp-input').value=p.hpp;persist();calculate();renderBiayaBenefit(); }
    function ensureActiveProduct(store){
      if(!store||!store.products.length)return;
      var ap=store.activeProductId?store.products.find(function(p){return p.id===store.activeProductId;}):null;
      if(!ap){ap=store.products[0];store.activeProductId=ap.id;store.manualHpp=null;}
      state.productId=ap.id;
      if($('ph-hpp-input'))$('ph-hpp-input').value=ap.hpp;
      persist();
    }

    /* ── load store settings to inputs ── */
    function loadStoreToInputs(){
      var store=currentStore();
      var adm=$('ph-adm-input'),acos=$('ph-acos-input'),npm=$('ph-npm-input'),hpp=$('ph-hpp-input');
      if(!store){
        [adm,acos,npm,hpp].forEach(function(el){if(el){el.value='';el.disabled=true;}});
        return;
      }
      [adm,acos,npm,hpp].forEach(function(el){if(el)el.disabled=false;});
      var ps=store.platformSettings[store.platform];
      if(adm)adm.value=ps.adm; if(acos)acos.value=ps.acos; if(npm)npm.value=store.targetNpm;
      if(hpp){
        hpp.disabled=false;
        var ap=store.activeProductId?store.products.find(function(p){return p.id===store.activeProductId;}):null;
        if(!ap&&store.manualHpp===null&&store.products.length){ap=store.products[0];store.activeProductId=ap.id;debouncedSave();}
        if(ap){state.productId=ap.id;hpp.value=ap.hpp;}
        else if(store.manualHpp!==null&&store.manualHpp!==undefined){state.productId=null;hpp.value=store.manualHpp;}
        else{state.productId=null;hpp.value='';}
      }
    }

    /* ── platform tabs ── */
    function renderPlatformTabs(){
      var wrap=$('ph-platform-tabs'); if(!wrap)return; wrap.innerHTML='';
      var store=currentStore();
      Object.keys(PLATFORM_META).forEach(function(name){
        var meta=PLATFORM_META[name];
        var ps=store?store.platformSettings[name]:PLATFORM_PRESETS[name];
        var tab=document.createElement('button');
        tab.className='ph-ptab'; tab.disabled=!store; tab.dataset.active=(!!store&&store.platform===name).toString();
        tab.innerHTML='<div class="ph-ptab-name"><span class="ph-dot" style="background:'+meta.color+'"></span>'+name+'</div><div class="ph-ptab-def">'+ps.adm.toFixed(2)+'% adm &middot; '+ps.acos.toFixed(2)+'% acos</div>';
        tab.addEventListener('click',function(){if(!store)return;store.platform=name;persist();loadStoreToInputs();renderPlatformTabs();calculate();renderBiayaBenefit();});
        wrap.appendChild(tab);
      });
    }

    /* ── parse breakdown ── */
    function findFieldValue(lines,label){
      var target=label.toLowerCase();
      for(var i=0;i<lines.length;i++){
        var ll=lines[i].toLowerCase();
        if(ll===target||ll.startsWith(target)){
          for(var j=i+1;j<Math.min(lines.length,i+3);j++){var val=parseRupiahLine(lines[j]);if(val!==null)return val;}
        }
      }
      return null;
    }
    function parseBreakdown(text,fieldDefs){
      var lines=text.split('\n').map(function(l){return l.trim();}).filter(function(l){return l.length>0;});
      var result={},foundCount=0;
      fieldDefs.forEach(function(f){var val=findFieldValue(lines,f.label);result[f.key]=val;if(val!==null)foundCount++;});
      return {values:result,foundCount:foundCount,totalFields:fieldDefs.length};
    }

    function renderParsePreview(containerId,fieldDefs,values){
      var el=$(containerId); if(!el)return;
      var subtotal=values.subtotalPesanan;
      var rows=fieldDefs.map(function(f){
        var v=values[f.key]; var ok=v!==null;
        var ratio=(ok&&subtotal&&f.key!=='subtotalPesanan')?(v/subtotal)*100:null;
        return '<tr><td style="color:'+(ok?'':'var(--ph-danger)')+'">'+f.label+'</td><td class="num" style="color:'+(ok?'':'var(--ph-danger)')+'">'+( ok?rupiah(v):'tidak ketemu')+'</td><td class="num" style="color:var(--ph-faint);font-size:11px">'+(ratio!==null?pct(ratio):'&mdash;')+'</td></tr>';
      }).join('');
      el.innerHTML='<table class="ph-tbl"><thead><tr><th>Komponen</th><th class="num">Nilai</th><th class="num">% Subtotal</th></tr></thead><tbody>'+rows+'</tbody></table>';
    }

    function applyPenghasilan(text){
      var status=$('ph-penghasilan-status'); if(!text.trim()){status.className='ph-parse-status fail';status.textContent='Belum ada teks.';return;}
      var r=parseBreakdown(text,PENGHASILAN_FIELDS); renderParsePreview('ph-penghasilan-preview',PENGHASILAN_FIELDS,r.values);
      if(!r.foundCount){status.className='ph-parse-status fail';status.textContent='Tidak ada field yang dikenali.';return;}
      status.className=r.foundCount===r.totalFields?'ph-parse-status ok':'ph-parse-status fail';
      status.textContent=r.foundCount+'/'+r.totalFields+' field ketemu.';
      var store=currentStore();
      if(store&&r.values.subtotalPesanan!==null&&r.values.totalPenghasilan!==null){
        store.lastParsedPenghasilan={values:r.values,parsedAt:Date.now()}; debouncedSave();
        var totalPot=r.values.subtotalPesanan-r.values.totalPenghasilan;
        var admPct=parseFloat(((totalPot/r.values.subtotalPesanan)*100).toFixed(2));
        store.platformSettings[store.platform].adm=admPct;
        if($('ph-adm-input'))$('ph-adm-input').value=admPct;
        renderPlatformTabs(); calculate();
        showToast('Adm % '+store.platform+' terupdate ke '+pct(admPct));
      }
      updatePesananBtn(); renderBiayaBenefit();
    }
    function applyPembayaran(text){
      var status=$('ph-pembayaran-status'); if(!text.trim()){status.className='ph-parse-status fail';status.textContent='Belum ada teks.';return;}
      var r=parseBreakdown(text,PEMBAYARAN_FIELDS); renderParsePreview('ph-pembayaran-preview',PEMBAYARAN_FIELDS,r.values);
      if(!r.foundCount){status.className='ph-parse-status fail';status.textContent='Tidak ada field yang dikenali.';return;}
      status.className=r.foundCount===r.totalFields?'ph-parse-status ok':'ph-parse-status fail';
      status.textContent=r.foundCount+'/'+r.totalFields+' field ketemu.';
      var store=currentStore(); if(store){store.lastParsedPembayaran={values:r.values,parsedAt:Date.now()};debouncedSave();}
      updatePesananBtn(); renderBiayaBenefit();
    }
    function updatePesananBtn(){
      var store=currentStore(); var hasData=!!(store&&(store.lastParsedPenghasilan||store.lastParsedPembayaran));
      var btn=$('ph-pesanan-action-btn'); if(!btn)return;
      if(hasData){btn.textContent='Bersihkan Data';btn.classList.remove('ph-btn-accent');btn.classList.add('ph-btn-ghost');}
      else{btn.textContent='Parse Otomatis';btn.classList.remove('ph-btn-ghost');btn.classList.add('ph-btn-accent');}
    }
    function resetPenghasilanBox(){
      if($('ph-penghasilan-ta'))$('ph-penghasilan-ta').value='';
      if($('ph-penghasilan-status'))$('ph-penghasilan-status').innerHTML='';
      if($('ph-penghasilan-preview'))$('ph-penghasilan-preview').innerHTML='';
    }
    function resetPembayaranBox(){
      if($('ph-pembayaran-ta'))$('ph-pembayaran-ta').value='';
      if($('ph-pembayaran-status'))$('ph-pembayaran-status').innerHTML='';
      if($('ph-pembayaran-preview'))$('ph-pembayaran-preview').innerHTML='';
    }
    function loadParsedPreviews(){
      var store=currentStore(); resetPenghasilanBox(); resetPembayaranBox(); updatePesananBtn();
      if(!store)return;
      if(store.lastParsedPenghasilan){renderParsePreview('ph-penghasilan-preview',PENGHASILAN_FIELDS,store.lastParsedPenghasilan.values);if($('ph-penghasilan-status')){$('ph-penghasilan-status').className='ph-parse-status ok';$('ph-penghasilan-status').textContent='Data tersimpan dari paste terakhir.';}}
      if(store.lastParsedPembayaran){renderParsePreview('ph-pembayaran-preview',PEMBAYARAN_FIELDS,store.lastParsedPembayaran.values);if($('ph-pembayaran-status')){$('ph-pembayaran-status').className='ph-parse-status ok';$('ph-pembayaran-status').textContent='Data tersimpan dari paste terakhir.';}}
    }

    /* ── import produk ── */
    function parseImportText(text){
      var rawLines=text.split('\n').map(function(l){return l.replace(/\r$/,'');}).filter(function(l){return l.trim().length>0;});
      var rows=[]; rawLines.forEach(function(line,idx){
        var t=line.trim(); var cols=splitColumns(t);
        if(!cols||cols.length<2){rows.push({raw:t,status:'error',reason:'Format tidak dikenali.'});return;}
        var hppRaw=cols[cols.length-1]; var nameRaw=cols[cols.length-2]; var parentRaw=cols.length>=3?cols[cols.length-3]:null;
        var hpp=parseRupiahLine(hppRaw);
        if(idx===0&&hpp===null&&/hpp|harga|modal|cost/i.test(nameRaw+' '+hppRaw))return;
        if(!nameRaw){rows.push({raw:t,status:'error',reason:'Nama produk kosong.'});return;}
        if(hpp===null||hpp<=0){rows.push({raw:t,name:nameRaw,status:'error',reason:'Nilai HPP tidak valid.'});return;}
        rows.push({raw:t,name:nameRaw,parentSku:parentRaw||nameRaw,hpp:hpp,status:'pending'});
      });
      return rows;
    }

    function statusBadge(st){
      var map={'new':'<span style="color:#8fc98f">+ Baru</span>','update':'<span style="color:#c9c28f">~ Update</span>','skip':'<span style="color:var(--ph-faint)">Lewati</span>','error':'<span style="color:var(--ph-danger)">Error</span>'};
      return map[st]||st;
    }

    function renderImportPreview(){
      var wrap=$('ph-import-preview'); if(!pendingImportRows||!pendingImportRows.length){wrap.innerHTML='';return;}
      var store=currentStore(); if(!store){wrap.innerHTML='';return;}
      var overwrite=true; var ow=document.getElementById('ph-import-overwrite-chk'); if(ow)overwrite=ow.checked;
      var cN=0,cU=0,cS=0,cE=0;
      var rowsHtml=pendingImportRows.map(function(row){
        if(row.status==='error'){cE++;return '<tr><td colspan="2" style="color:var(--ph-faint)">'+esc(row.raw)+'</td><td style="color:var(--ph-danger)">'+esc(row.reason)+'</td><td>'+statusBadge('error')+'</td></tr>';}
        var ex=store.products.find(function(p){return p.name.trim().toLowerCase()===row.name.trim().toLowerCase();});
        var st=ex?(overwrite?'update':'skip'):'new'; if(st==='new')cN++;else if(st==='update')cU++;else cS++;
        var ket=st==='update'?'sebelumnya '+rupiah(ex.hpp):(st==='skip'?'sudah ada':'');
        return '<tr><td style="color:var(--ph-faint)">'+esc(row.parentSku)+'</td><td>'+esc(row.name)+'</td><td class="num">'+rupiah(row.hpp)+'</td><td style="color:var(--ph-faint)">'+ket+'</td><td>'+statusBadge(st)+'</td></tr>';
      }).join('');
      var total=cN+cU;
      wrap.innerHTML='<label style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;color:var(--ph-dim);text-transform:none;letter-spacing:0"><input type="checkbox" id="ph-import-overwrite-chk"'+(overwrite?' checked':'')+'>Timpa HPP kalau nama sudah ada</label><div class="ph-tbl-preview-wrap" style="max-height:220px;overflow-y:auto;margin-top:8px;border:1px solid var(--ph-border-s);border-radius:7px"><table class="ph-tbl"><thead><tr><th>SKU Induk</th><th>Nama</th><th class="num">HPP</th><th>Ket</th><th>Status</th></tr></thead><tbody>'+rowsHtml+'</tbody></table></div><div class="ph-parse-preview">'+cN+' baru &middot; '+cU+' update &middot; '+cS+' lewati &middot; '+cE+' error</div><div class="ph-parse-actions"><button class="ph-btn ph-btn-accent ph-btn-sm" id="ph-import-confirm-btn"'+(total===0?' disabled':'')+'>Tambahkan ke '+esc(store.name)+'</button></div>';
      var chk=document.getElementById('ph-import-overwrite-chk'); if(chk)chk.addEventListener('change',renderImportPreview);
      var confirmBtn=document.getElementById('ph-import-confirm-btn'); if(confirmBtn&&total>0)confirmBtn.addEventListener('click',applyImport);
    }
    function applyImport(){
      var store=currentStore(); if(!store||!pendingImportRows)return;
      var ow=document.getElementById('ph-import-overwrite-chk'); var overwrite=ow?ow.checked:true;
      var added=0,updated=0,skipped=0;
      pendingImportRows.forEach(function(row){
        if(row.status==='error'){skipped++;return;}
        var ex=store.products.find(function(p){return p.name.trim().toLowerCase()===row.name.trim().toLowerCase();});
        if(ex){if(overwrite){ex.hpp=row.hpp;ex.parentSku=row.parentSku;updated++;}else{ex.parentSku=row.parentSku;skipped++;}}
        else{store.products.push({id:uid(),name:row.name,hpp:row.hpp,parentSku:row.parentSku});added++;}
      });
      persist(); resetImportBox(); ensureActiveProduct(store); renderProducts(); calculate(); renderBiayaBenefit();
      showToast('Import selesai: '+added+' baru, '+updated+' update, '+skipped+' lewati');
    }
    function resetImportBox(){
      pendingImportRows=null;
      if($('ph-import-ta'))$('ph-import-ta').value='';
      if($('ph-import-preview'))$('ph-import-preview').innerHTML='';
      if($('ph-import-box'))$('ph-import-box').open=false;
    }

    /* ── hpp bulk ── */
    function parseHppBulkText(text){
      var rawLines=text.split('\n').map(function(l){return l.replace(/\r$/,'');}).filter(function(l){return l.trim().length>0;});
      var rows=[]; rawLines.forEach(function(line,idx){
        var t=line.trim(); var cols=splitColumns(t);
        if(!cols||cols.length<2){rows.push({raw:t,status:'error',reason:'Format tidak dikenali.'});return;}
        var hppRaw=cols[cols.length-1]; var nameRaw=cols[cols.length-2]; var parentRaw=cols.length>=3?cols[cols.length-3]:null;
        var hpp=parseRupiahLine(hppRaw);
        if(idx===0&&hpp===null&&/hpp|harga|modal|cost/i.test(nameRaw+' '+hppRaw))return;
        if(!nameRaw){rows.push({raw:t,status:'error',reason:'Nama kosong.'});return;}
        if(hpp===null||hpp<=0){rows.push({raw:t,name:nameRaw,status:'error',reason:'Nilai HPP tidak valid.'});return;}
        var names=nameRaw.split('->').map(function(s){return s.trim();}).filter(Boolean);
        if(!names.length){rows.push({raw:t,name:nameRaw,status:'error',reason:'Nama kosong.'});return;}
        names.forEach(function(n){rows.push({raw:t,name:n,parentSku:parentRaw||n,hpp:hpp,status:'pending'});});
      });
      return rows;
    }
    function renderHppBulkPreview(){
      var wrap=$('ph-hpp-bulk-preview'); if(!pendingHppBulkRows||!pendingHppBulkRows.length){wrap.innerHTML='';return;}
      var store=currentStore(); if(!store){wrap.innerHTML='';return;}
      var cN=0,cU=0,cE=0;
      var rowsHtml=pendingHppBulkRows.map(function(row){
        if(row.status==='error'){cE++;return '<tr><td colspan="2" style="color:var(--ph-faint)">'+esc(row.raw)+'</td><td style="color:var(--ph-danger)">'+esc(row.reason)+'</td><td>'+statusBadge('error')+'</td></tr>';}
        var ex=store.products.find(function(p){return p.name.trim().toLowerCase()===row.name.trim().toLowerCase();});
        var st=ex?'update':'new'; if(st==='new')cN++;else cU++;
        var ket=st==='update'?'sebelumnya '+rupiah(ex.hpp):'produk baru';
        return '<tr><td style="color:var(--ph-faint)">'+esc(row.parentSku)+'</td><td>'+esc(row.name)+'</td><td class="num">'+rupiah(row.hpp)+'</td><td style="color:var(--ph-faint)">'+ket+'</td><td>'+statusBadge(st)+'</td></tr>';
      }).join('');
      var total=cN+cU;
      wrap.innerHTML='<div style="max-height:220px;overflow-y:auto;margin-top:10px;border:1px solid var(--ph-border-s);border-radius:7px"><table class="ph-tbl"><thead><tr><th>SKU Induk</th><th>Nama</th><th class="num">HPP baru</th><th>Ket</th><th>Status</th></tr></thead><tbody>'+rowsHtml+'</tbody></table></div><div class="ph-parse-preview">'+cN+' baru &middot; '+cU+' update &middot; '+cE+' error</div><div class="ph-parse-actions"><button class="ph-btn ph-btn-accent ph-btn-sm" id="ph-hpp-bulk-confirm-btn"'+(total===0?' disabled':'')+'>Terapkan ke '+esc(store.name)+'</button></div>';
      var confirmBtn=document.getElementById('ph-hpp-bulk-confirm-btn'); if(confirmBtn&&total>0)confirmBtn.addEventListener('click',applyHppBulk);
    }
    function applyHppBulk(){
      var store=currentStore(); if(!store||!pendingHppBulkRows)return;
      var added=0,updated=0,skipped=0;
      pendingHppBulkRows.forEach(function(row){
        if(row.status==='error'){skipped++;return;}
        var ex=store.products.find(function(p){return p.name.trim().toLowerCase()===row.name.trim().toLowerCase();});
        if(ex){ex.hpp=row.hpp;ex.parentSku=row.parentSku;updated++;}
        else{store.products.push({id:uid(),name:row.name,hpp:row.hpp,parentSku:row.parentSku});added++;}
      });
      persist(); resetHppBulkBox(); ensureActiveProduct(store); renderProducts(); calculate(); renderBiayaBenefit();
      showToast('HPP diperbarui: '+added+' baru, '+updated+' update');
    }
    function resetHppBulkBox(){
      pendingHppBulkRows=null;
      if($('ph-hpp-bulk-ta'))$('ph-hpp-bulk-ta').value='';
      if($('ph-hpp-bulk-preview'))$('ph-hpp-bulk-preview').innerHTML='';
      if($('ph-hpp-bulk-box'))$('ph-hpp-bulk-box').open=false;
    }

    /* ── calculate & render result ── */
    function computeRealCostRatioPct(store){
      var parsed=store.lastParsedPenghasilan;
      if(!parsed||parsed.values.subtotalPesanan===null||parsed.values.totalPenghasilan===null)return null;
      var v=parsed.values; var subtotal=v.subtotalPesanan; if(!subtotal||subtotal<=0)return null;
      var acos=(!store.adsAcosAktual||isNaN(store.adsAcosAktual))?0:store.adsAcosAktual;
      var aff=(!store.affiliateAktual||isNaN(store.affiliateAktual))?0:store.affiliateAktual;
      var platformCost=Math.abs((v.biayaAdministrasi||0)+(v.biayaLayanan||0)+(v.biayaProsesPesanan||0));
      var voucherToko=Math.abs(v.voucherToko||0);
      var adsBiaya=acos>0?(subtotal*acos/100):0;
      var affBiaya=aff>0?(subtotal*aff/100):0;
      return ((platformCost+voucherToko+adsBiaya+affBiaya)/subtotal)*100;
    }

    function calculate(){
      var store=currentStore();
      var area=$('ph-result-area'); var summaryArea=$('ph-summary-area');
      if(!store){if(area)area.innerHTML='<div class="ph-error-box">Pilih atau buat toko dulu.</div>';if(summaryArea)summaryArea.innerHTML='';return;}
      var hpp=parseFloat($('ph-hpp-input')?$('ph-hpp-input').value:0)||0;
      var targetNpm=parseFloat($('ph-npm-input')?$('ph-npm-input').value:0)||0;
      var adm=parseFloat($('ph-adm-input')?$('ph-adm-input').value:0)||0;
      var acos=parseFloat($('ph-acos-input')?$('ph-acos-input').value:0)||0;
      var totalPct=(adm+acos)/100;
      if(!area)return;
      if(totalPct>=1){
        area.innerHTML='<div class="ph-error-box">Adm % + ACOS % ('+pct(adm+acos)+') &ge; 100%. Turunkan salah satu nilai dulu.</div>';
      } else if(hpp<=0){
        area.innerHTML='<div class="ph-error-box">Isi HPP dulu — pilih produk dari daftar, import dari spreadsheet, atau input manual.</div>';
      } else {
        var hj=(hpp+targetNpm)/(1-totalPct);
        var admRp=hj*(adm/100); var acosRp=hj*(acos/100);
        var gpm=((hj-hpp)/hj)*100; var npmRasio=(targetNpm/hj)*100;
        var roas=acos>0?(100/acos):null;
        var rounded=Math.ceil(hj/100)*100;
        area.innerHTML=
          '<div class="ph-hero"><div class="ph-hero-label">Harga Jual Minimum &middot; '+esc(store.platform)+'</div>'+
          '<div class="ph-hero-num">'+rupiah(hj)+'</div>'+
          '<div class="ph-hero-sub">Supaya profit bersih '+rupiah(targetNpm)+'/pesanan tercapai &middot; dibulatkan ke atas: <b style="color:var(--ph-text)">'+rupiah(rounded)+'</b></div></div>'+
          '<div class="ph-bar-wrap"><div class="ph-bar">'+
          '<div class="ph-seg" style="width:'+(hpp/hj*100).toFixed(2)+'%;background:#3a3a3a"></div>'+
          '<div class="ph-seg" style="width:'+(admRp/hj*100).toFixed(2)+'%;background:#5c5c5c"></div>'+
          '<div class="ph-seg" style="width:'+(acosRp/hj*100).toFixed(2)+'%;background:#8a8a8a"></div>'+
          '<div class="ph-seg" style="width:'+(targetNpm/hj*100).toFixed(2)+'%;background:var(--ph-accent)"></div>'+
          '</div></div>'+
          '<table class="ph-tbl"><thead><tr><th>Komponen</th><th class="num">Nilai</th><th class="num">% Harga Jual</th></tr></thead><tbody>'+
          '<tr><td><span class="ph-leg-dot" style="background:#3a3a3a"></span>HPP</td><td class="num">'+rupiah(hpp)+'</td><td class="num">'+pct(hpp/hj*100)+'</td></tr>'+
          '<tr><td><span class="ph-leg-dot" style="background:#5c5c5c"></span>Biaya Admin ('+pct(adm)+')</td><td class="num">'+rupiah(admRp)+'</td><td class="num">'+pct(admRp/hj*100)+'</td></tr>'+
          '<tr><td><span class="ph-leg-dot" style="background:#8a8a8a"></span>ACOS ('+pct(acos)+')</td><td class="num">'+rupiah(acosRp)+'</td><td class="num">'+pct(acosRp/hj*100)+'</td></tr>'+
          '<tr><td><span class="ph-leg-dot" style="background:var(--ph-accent)"></span>Profit Bersih</td><td class="num">'+rupiah(targetNpm)+'</td><td class="num">'+pct(npmRasio)+'</td></tr>'+
          '<tr class="ph-total"><td>Harga Jual</td><td class="num">'+rupiah(hj)+'</td><td class="num">100%</td></tr>'+
          '</tbody></table>'+
          '<div class="ph-metrics">'+
          '<div class="ph-metric"><div class="ph-mlabel">GPM</div><div class="ph-mval">'+pct(gpm)+'</div></div>'+
          '<div class="ph-metric"><div class="ph-mlabel">NPM Rasio</div><div class="ph-mval">'+pct(npmRasio)+'</div></div>'+
          '<div class="ph-metric"><div class="ph-mlabel">Total Potongan</div><div class="ph-mval">'+pct(adm+acos)+'</div></div>'+
          '<div class="ph-metric"><div class="ph-mlabel">ROAS</div><div class="ph-mval">'+(roas!==null?roas.toFixed(2)+'x':'&mdash;')+'</div></div>'+
          '</div>';
      }
      renderStoreSummary(store,adm,acos,targetNpm,totalPct,computeRealCostRatioPct(store));
    }

    function renderStoreSummary(store,adm,acos,targetNpm,totalPct,realCostRatioPct){
      var wrap=$('ph-summary-area'); if(!wrap)return;
      if(!store.products.length){wrap.innerHTML='<div class="ph-panel-title" style="margin-top:0"><span>Proyeksi Harga &middot; '+esc(store.name)+'</span></div><div class="ph-empty">Belum ada produk.</div>';return;}
      var usingReal=realCostRatioPct!==null&&!isNaN(realCostRatioPct);
      var effPct=usingReal?(realCostRatioPct/100):totalPct;
      var effLbl=usingReal?pct(realCostRatioPct):pct(adm+acos);
      var groups=[]; var groupIdx=new Map();
      store.products.forEach(function(p){
        var key=(p.parentSku||p.name||'').trim()||p.name;
        if(!groupIdx.has(key)){groupIdx.set(key,groups.length);groups.push({parentSku:key,products:[]});}
        groups[groupIdx.get(key)].products.push(p);
      });
      var rowsHtml=''; var tsvRows=['SKU Induk\tVariasi\tHPP\tHarga Jual\tProfit\tGPM%']; var sumHarga=0;
      groups.forEach(function(g){
        var rep=g.products[0]; var hj=null,gpmPct=null;
        if(effPct<1&&rep.hpp>0){hj=(rep.hpp+targetNpm)/(1-effPct);gpmPct=((hj-rep.hpp)/hj)*100;sumHarga+=hj;}
        var sel=g.products.some(function(p){return p.id===state.productId;})?' ph-sel':'';
        var varLabel=g.products.length>1?' <span style="color:var(--ph-faint);font-weight:400">&middot; '+g.products.length+' variasi</span>':'';
        rowsHtml+='<tr class="'+sel+'" data-id="'+rep.id+'"><td>'+esc(g.parentSku)+varLabel+'</td><td class="num">'+rupiah(rep.hpp)+'</td><td class="num">'+(hj!==null?rupiah(hj):'&mdash;')+'</td><td class="num">'+(hj!==null?rupiah(targetNpm):'&mdash;')+'</td><td class="num">'+(gpmPct!==null?pct(gpmPct):'&mdash;')+'</td></tr>';
        tsvRows.push(g.parentSku+'\t'+g.products.length+'\t'+rep.hpp+'\t'+(hj!==null?Math.round(hj):'')+'\t'+(hj!==null?targetNpm:'')+'\t'+(gpmPct!==null?gpmPct.toFixed(2):''));
      });
      wrap.innerHTML=
        '<div class="ph-panel-title" style="margin-top:0"><span>Proyeksi Harga &middot; '+esc(store.name)+'</span></div>'+
        '<table class="ph-tbl"><thead><tr><th>SKU Induk</th><th class="num">HPP</th><th class="num">Harga Jual</th><th class="num">Profit</th><th class="num">GPM</th></tr></thead><tbody id="ph-summary-tbody">'+rowsHtml+'</tbody></table>'+
        '<div class="ph-summary-foot"><div class="ph-hero-sub" style="margin:0">Total estimasi omset (1x per SKU): <b style="color:var(--ph-text)">'+rupiah(sumHarga)+'</b></div><button class="ph-btn ph-btn-ghost ph-btn-sm" id="ph-copy-summary-btn">Salin TSV</button></div>';
      wrap.querySelectorAll('#ph-summary-tbody tr').forEach(function(tr){
        tr.addEventListener('click',function(){
          var pid=tr.dataset.id; var p=store.products.find(function(x){return x.id===pid;});
          if(!p)return; setActiveProduct(store,p); renderProducts();
        });
      });
      var copyBtn=$('ph-copy-summary-btn');
      if(copyBtn) copyBtn.addEventListener('click',function(){
        navigator.clipboard.writeText(tsvRows.join('\n')).then(function(){showToast('Disalin! Tinggal paste ke spreadsheet.');}).catch(function(){showToast('Gagal salin otomatis.');});
      });
    }

    /* ── renderBiayaBenefit ── */
    function renderBiayaBenefit(){
      var emptyHint=$('ph-biaya-empty'); var grid=$('ph-biaya-metrics'); var card=$('ph-biaya-card');
      if(!grid||!card)return;
      var store=currentStore();
      if(!store){emptyHint.style.display='';grid.style.display='none';card.innerHTML='';return;}
      var parsed=store.lastParsedPenghasilan;
      var hpp=parseFloat($('ph-hpp-input')?$('ph-hpp-input').value:0)||0;
      var acos=(!store.adsAcosAktual||isNaN(store.adsAcosAktual))?0:store.adsAcosAktual;
      var aff=(!store.affiliateAktual||isNaN(store.affiliateAktual))?0:store.affiliateAktual;
      if(!parsed||parsed.values.subtotalPesanan===null||parsed.values.totalPenghasilan===null){emptyHint.style.display='';grid.style.display='none';card.innerHTML='';return;}
      emptyHint.style.display='none'; grid.style.display='';
      var v=parsed.values; var subtotal=v.subtotalPesanan; var totalPenghasilan=v.totalPenghasilan;
      var platformCost=Math.abs((v.biayaAdministrasi||0)+(v.biayaLayanan||0)+(v.biayaProsesPesanan||0));
      var voucherToko=Math.abs(v.voucherToko||0);
      var adsBiaya=acos>0?(subtotal*acos/100):0; var affBiaya=aff>0?(subtotal*aff/100):0;
      var costRatioTotal=platformCost+voucherToko+adsBiaya+affBiaya;
      var costRatioPct=subtotal>0?(costRatioTotal/subtotal)*100:0;
      var benefit=hpp>0?(totalPenghasilan-hpp-adsBiaya-affBiaya):null;
      var potongan=(v.biayaAdministrasi||0)+(v.biayaLayanan||0)+(v.biayaProsesPesanan||0)+(v.voucherToko||0);
      var npm=hpp>0?(subtotal+potongan-adsBiaya-affBiaya-hpp):null;
      var npmPct=(npm!==null&&subtotal>0)?(npm/subtotal)*100:null;
      var gm=hpp>0?(subtotal-hpp):null; var gmPct=(gm!==null&&subtotal>0)?(gm/subtotal)*100:null;
      var pfIdr=platformCost; var pfPct=subtotal>0?(pfIdr/subtotal)*100:0;
      var rowPct=function(val){return subtotal?pct((val/subtotal)*100):'–';};

      $('ph-m-subtotal').textContent=rupiah(subtotal);
      $('ph-m-total-cost').textContent=rupiah(costRatioTotal);
      $('ph-m-cost-ratio').textContent=pct(costRatioPct);
      var mB=$('ph-m-benefit'); mB.textContent=benefit!==null?rupiah(benefit):'isi HPP dulu'; mB.style.color=benefit!==null&&benefit>=0?'var(--ph-accent)':'var(--ph-danger)';
      var mN=$('ph-m-npm'); mN.textContent=npmPct!==null?pct(npmPct):'isi HPP dulu'; mN.style.color=npmPct!==null&&npmPct>=0?'var(--ph-accent)':'var(--ph-danger)';
      var mG=$('ph-m-gm'); mG.textContent=gmPct!==null?pct(gmPct):'isi HPP dulu'; mG.style.color=gmPct!==null&&gmPct>=0?'var(--ph-accent)':'var(--ph-danger)';
      $('ph-m-pf-pct').textContent=pct(pfPct);
      $('ph-m-pf-idr').textContent=rupiah(pfIdr);

      var adminRows=[ ['Biaya Administrasi',v.biayaAdministrasi],['Biaya Layanan',v.biayaLayanan],['Biaya Proses Pesanan',v.biayaProsesPesanan] ].filter(function(r){return r[1]!==null;});
      var adminSum=adminRows.reduce(function(s,r){return s+r[1];},0);
      var adminPct=subtotal?(adminSum/subtotal)*100:null;

      card.innerHTML='<table class="ph-tbl"><thead><tr><th>Komponen Biaya</th><th class="num">Nilai</th><th class="num">% Subtotal</th></tr></thead><tbody>'+
        (v.hargaProduk!==null?'<tr><td>Harga Produk</td><td class="num">'+rupiah(v.hargaProduk)+'</td><td class="num">'+rowPct(v.hargaProduk)+'</td></tr>':'')+
        (hpp>0?'<tr><td>HPP</td><td class="num">'+rupiah(hpp)+'</td><td class="num">'+rowPct(-hpp)+'</td></tr>':'')+
        '<tr style="background:rgba(255,255,255,.04)"><td style="font-weight:700">Rasio Admin &amp; Layanan</td><td class="num" style="font-weight:700">'+rupiah(adminSum)+'</td><td class="num" style="font-weight:700">'+(adminPct!==null?pct(adminPct):'–')+'</td></tr>'+
        adminRows.map(function(r){return '<tr><td style="color:var(--ph-faint);padding-left:18px">'+r[0]+'</td><td class="num" style="color:var(--ph-faint)">'+rupiah(r[1])+'</td><td class="num" style="color:var(--ph-faint)">'+rowPct(r[1])+'</td></tr>';}).join('')+
        (acos>0?'<tr><td>Biaya Iklan (ACOS '+pct(acos)+')</td><td class="num">'+rupiah(-adsBiaya)+'</td><td class="num">'+rowPct(-adsBiaya)+'</td></tr>':'')+
        (aff>0?'<tr><td>Biaya Affiliate ('+pct(aff)+'%)</td><td class="num">'+rupiah(-affBiaya)+'</td><td class="num">'+rowPct(-affBiaya)+'</td></tr>':'')+
        (v.voucherToko!==null?'<tr><td>Voucher Toko</td><td class="num">'+rupiah(v.voucherToko)+'</td><td class="num">'+rowPct(v.voucherToko)+'</td></tr>':'')+
        '<tr style="background:rgba(255,255,255,.04)"><td style="font-weight:700">Cost Ratio (Total Cost)</td><td class="num" style="font-weight:700;color:var(--ph-danger)">'+rupiah(-costRatioTotal)+'</td><td class="num" style="font-weight:700;color:var(--ph-danger)">'+rowPct(-costRatioTotal)+'</td></tr>'+
        '<tr class="ph-total"><td>Estimasi Total Penghasilan</td><td class="num">'+rupiah(totalPenghasilan)+'</td><td class="num">'+rowPct(totalPenghasilan)+'</td></tr>'+
        (hpp>0?'<tr class="ph-total"><td>Net Profit Margin</td><td class="num">'+rupiah(npm)+'</td><td class="num">'+(npmPct!==null?pct(npmPct):'–')+'</td></tr>':'')+
        (v.biayaIsiSaldo!==null?'<tr><td style="color:var(--ph-faint)">Biaya Isi Saldo Otomatis (dari Penghasilan)</td><td class="num" style="color:var(--ph-faint)">'+rupiah(v.biayaIsiSaldo)+'</td><td class="num" style="color:var(--ph-faint)">'+rowPct(v.biayaIsiSaldo)+'</td></tr>':'')+
        '</tbody></table>';
    }

    /* ── renderAll ── */
    function renderAll(){
      renderStores(); loadStoreToInputs(); renderProducts(); renderPlatformTabs();
      loadParsedPreviews(); resetImportBox(); resetHppBulkBox(); calculate(); renderBiayaBenefit();
    }

    /* ── events ── */
    $('ph-add-store-btn').addEventListener('click',function(){
      var input=$('ph-new-store'); var name=input.value.trim(); if(!name)return;
      var ns=Object.assign({id:uid(),name:name,products:[]},defaultStoreSettings());
      data.stores.push(ns); state.storeId=ns.id; state.productId=null; saveLastStore(ns.id);
      input.value=''; persist(); renderAll();
    });
    $('ph-new-store').addEventListener('keydown',function(e){if(e.key==='Enter')$('ph-add-store-btn').click();});

    $('ph-add-prod-btn').addEventListener('click',function(){
      var store=currentStore(); if(!store){showToast('Pilih toko dulu');return;}
      var nameInput=$('ph-new-prod-name'); var hppInput=$('ph-new-prod-hpp');
      var name=nameInput.value.trim(); var hpp=parseFloat(hppInput.value);
      if(!name||isNaN(hpp)||hpp<=0){showToast('Isi nama produk & HPP yang valid');return;}
      store.products.push({id:uid(),name:name,hpp:hpp,parentSku:name});
      nameInput.value=''; hppInput.value=''; persist(); ensureActiveProduct(store); renderProducts(); calculate(); renderBiayaBenefit();
    });
    $('ph-new-prod-hpp').addEventListener('keydown',function(e){if(e.key==='Enter')$('ph-add-prod-btn').click();});

    $('ph-clear-all-btn').addEventListener('click',function(){
      var store=currentStore(); if(!store||!store.products.length){showToast('Belum ada produk');return;}
      if(!confirm('Hapus SEMUA '+store.products.length+' produk di "'+store.name+'"?'))return;
      store.products=[]; store.activeProductId=null; persist(); renderProducts(); calculate(); renderBiayaBenefit();
      showToast('Semua produk dihapus.');
    });

    $('ph-adm-input').addEventListener('input',function(){var s=currentStore();if(!s)return;var v=parseFloat(this.value);s.platformSettings[s.platform].adm=isNaN(v)?0:v;debouncedSave();renderPlatformTabs();calculate();});
    $('ph-acos-input').addEventListener('input',function(){var s=currentStore();if(!s)return;var v=parseFloat(this.value);s.platformSettings[s.platform].acos=isNaN(v)?0:v;debouncedSave();renderPlatformTabs();calculate();});
    $('ph-npm-input').addEventListener('input',function(){var s=currentStore();if(!s)return;var v=parseFloat(this.value);s.targetNpm=isNaN(v)?0:v;debouncedSave();calculate();});
    $('ph-hpp-input').addEventListener('input',function(){
      var store=currentStore(); if(store){
        var raw=this.value; var v=raw===''?null:parseFloat(raw);
        var ap=state.productId?store.products.find(function(p){return p.id===state.productId;}):null;
        if(!(ap&&ap.hpp===v)){state.productId=null;store.activeProductId=null;store.manualHpp=(v===null||isNaN(v))?null:v;debouncedSave();}
      }
      calculate(); renderBiayaBenefit();
    });

    $('ph-reset-platform-btn').addEventListener('click',function(){
      var store=currentStore(); if(!store)return;
      var preset=PLATFORM_PRESETS[store.platform];
      store.platformSettings[store.platform]={adm:preset.adm,acos:preset.acos}; persist(); loadStoreToInputs(); renderPlatformTabs(); calculate();
      showToast('Reset ke default '+store.platform+' ('+preset.adm+'% / '+preset.acos+'%)');
    });

    $('ph-pesanan-action-btn').addEventListener('click',function(){
      var store=currentStore(); if(!store){showToast('Pilih toko dulu');return;}
      var hasData=!!(store.lastParsedPenghasilan||store.lastParsedPembayaran);
      if(hasData){resetPenghasilanBox();resetPembayaranBox();store.lastParsedPenghasilan=null;store.lastParsedPembayaran=null;debouncedSave();renderBiayaBenefit();updatePesananBtn();return;}
      applyPenghasilan($('ph-penghasilan-ta')?$('ph-penghasilan-ta').value:'');
      applyPembayaran($('ph-pembayaran-ta')?$('ph-pembayaran-ta').value:'');
    });

    $('ph-import-parse-btn').addEventListener('click',function(){
      var store=currentStore(); if(!store){showToast('Pilih toko dulu');return;}
      var text=$('ph-import-ta')?$('ph-import-ta').value:''; if(!text.trim()){showToast('Paste data dulu');return;}
      pendingImportRows=parseImportText(text); renderImportPreview();
    });
    $('ph-import-clear-btn').addEventListener('click',resetImportBox);

    $('ph-hpp-bulk-parse-btn').addEventListener('click',function(){
      var store=currentStore(); if(!store){showToast('Pilih toko dulu');return;}
      var text=$('ph-hpp-bulk-ta')?$('ph-hpp-bulk-ta').value:''; if(!text.trim()){showToast('Paste data dulu');return;}
      pendingHppBulkRows=parseHppBulkText(text); renderHppBulkPreview();
    });
    $('ph-hpp-bulk-clear-btn').addEventListener('click',resetHppBulkBox);

    /* ── init ── */
    loadData();
    var lastId=readLastStore();
    var lastValid=lastId&&data.stores.some(function(s){return s.id===lastId;})?lastId:null;
    state.storeId=lastValid||( data.stores[0]?data.stores[0].id:null );
    switchSection('biaya');
    renderAll();
  }

})();
