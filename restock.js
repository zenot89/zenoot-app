// ─── RESTOCK.JS — tab per supplier ──────────────────────────
// Logic: SKU aktif yang terjual 14 hari terakhir
// Tab: Summary (ringkasan eksekutif) | per Supplier (1 tabel penuh)
// Layout: Full-Height Flex Table Layout (same pattern as jurnal-penjualan)

document.getElementById('page-restock').innerHTML = `
  <!-- TOP BAR: judul + 3 tombol sejajar (laptop) -->
  <div id="restock-top-bar">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-weight:700;font-size:15px"><i class="ti ti-refresh"></i> Re-Stock</span>
      <span style="font-size:11px;color:var(--ink3)">daftar reorder per boss</span>
      <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
        <button class="btn btn-sm" onclick="loadRestock()" title="Refresh" style="padding:4px 8px">
          <i class="ti ti-refresh"></i>
        </button>
        <button class="btn btn-sm" onclick="gotoPage('clearance',null)" style="display:inline-flex;align-items:center;gap:5px;font-size:12px">
          <i class="ti ti-tag"></i> Produk Clearance
        </button>
        <div id="restock-summary-btn-wrap"></div>
      </div>
    </div>
  </div>

  <!-- CARD tabel: flex:1, mengisi sisa ruang -->
  <div class="card" id="restock-wrap">

    <!-- STICKY HEADER dalam card: tombol mobile + tab bar + info bar -->
    <div id="restock-sticky-header">

      <!-- Tombol aksi mobile only (portrait HP) -->
      <div id="restock-aksi-mobile" style="display:flex;gap:6px;align-items:center;padding:8px 14px 6px;flex-wrap:wrap">
        <button class="btn btn-sm" onclick="loadRestock()" title="Refresh" style="padding:4px 8px">
          <i class="ti ti-refresh"></i>
        </button>
        <button class="btn btn-sm" onclick="gotoPage('clearance',null)" style="display:inline-flex;align-items:center;gap:5px;font-size:12px">
          <i class="ti ti-tag"></i> Clearance
        </button>
        <div id="restock-tab-bar-wrap-mobile" style="margin-left:auto"></div>
      </div>

      <!-- Tab bar + info bar: diisi oleh renderRestockTabs() -->
      <div id="restock-tab-bar-wrap"></div>
      <div id="restock-info-bar-wrap"></div>

    </div><!-- /restock-sticky-header -->

    <!-- TABLE SCROLL ZONE: flex:1, scroll internal -->
    <div id="restock-tbl-scroll">
      <div id="restock-body" style="color:var(--ink3);font-style:italic;padding:12px 14px">
        <i class="ti ti-loader"></i> Memuat data...
      </div>
    </div>

  </div><!-- /restock-wrap -->
`;

setTimeout(() => {
  if (typeof rerenderUI === 'function')
    rerenderUI(document.getElementById('page-restock'));
  _restockEnsureFlexLayout();
  loadRestock();
}, 80);

// ─── FLEX LAYOUT CHAIN (same as jurnal-penjualan) ────────────
function _restockEnsureFlexLayout() {
  var pg = document.getElementById('page-restock');
  if (!pg || !pg.classList.contains('active')) return;

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

  var contentEl = document.querySelector('.content');
  if (contentEl) {
    contentEl.style.overflowY     = 'hidden';
    contentEl.style.overflow      = 'hidden';
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
  var pg = document.getElementById('page-restock');
  if (pg && pg.classList.contains('active')) _restockEnsureFlexLayout();
});

document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'restock') return;
  var raf = window.requestAnimationFrame || function(fn) { setTimeout(fn, 16); };
  raf(function() {
    _restockEnsureFlexLayout();
    // Reset collapse saat halaman dibuka
    var tb = document.getElementById('restock-top-bar');
    if (tb) tb.classList.remove('landscape-collapsed');
    // Re-scroll ke atas
    var sc = document.getElementById('restock-tbl-scroll');
    if (sc) sc.scrollTop = 0;
  });
  // Reload data otomatis saat navigasi ke halaman ini (debounce 250ms)
  clearTimeout(window._restockReloadTimer);
  window._restockReloadTimer = setTimeout(loadRestock, 250);
});

// ─── SWIPE GESTURE — collapse restock-top-bar di landscape touch ──
(function() {
  var _mq = window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: landscape)');
  function _restockInitSwipe() {
    if (!_mq.matches) return;
    var stickyHeader = document.getElementById('restock-sticky-header');
    var topBar       = document.getElementById('restock-top-bar');
    if (!stickyHeader || !topBar) return;
    initSwipeCollapse(stickyHeader, topBar, 50);
    initSwipeCollapse(topBar,       topBar, 50);
  }
  setTimeout(_restockInitSwipe, 300);
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'restock') return;
    setTimeout(function() {
      var tb = document.getElementById('restock-top-bar');
      if (tb) tb.classList.remove('landscape-collapsed');
      _restockInitSwipe();
    }, 80);
  });
})();

// Tab aktif saat ini
let _restockActiveTab = 'SUMMARY';

async function loadRestock() {
  const body = document.getElementById('restock-body');
  const tabWrap  = document.getElementById('restock-tab-bar-wrap');
  const infoWrap = document.getElementById('restock-info-bar-wrap');
  if (!body) return;
  body.innerHTML = '<div style="color:var(--ink3);font-style:italic;padding:12px 0"><i class="ti ti-loader"></i> Memuat data...</div>';
  if (tabWrap)  tabWrap.innerHTML  = '';
  if (infoWrap) infoWrap.innerHTML = '';

  try {
    const today = new Date();
    const d14   = new Date(today);
    d14.setDate(d14.getDate() - 13);
    const dari  = d14.toISOString().slice(0, 10);

    const d7 = new Date(today);
    d7.setDate(d7.getDate() - 6);
    const dari7 = d7.toISOString().slice(0, 10);

    const isKritisMode = window._restockFilterKritis === true;
    window._restockFilterKritis = false;

    const [penjualan, produkAll, supplierAll, stokData, jurnalAllData] = await Promise.all([
      dbGet('jurnal_penjualan', '&tanggal=gte.' + dari + '&order=tanggal.desc'),
      dbGet('produk', '&order=katalog.asc'),
      dbGet('restock_supplier', '&order=boss.asc').catch(() => []),
      dbGet('stok'),
      dbGet('jurnal_penjualan', '&select=sku,qty')
    ]);

    // ── Hitung sisa stok per SKU — logika IDENTIK dengan stok.js ──
    // stok.js: _stokMasukMap[key] = { id, qty } → overwrite, 1 record per SKU
    const _masukMap = {};
    (stokData || []).forEach(s => {
      const key = (s.sku_variasi || '').trim().toUpperCase();
      if (key) _masukMap[key] = s.stok_masuk || 0;
    });
    // stok.js: keluarMap[key] += qty → akumulasi semua penjualan
    const _keluarMap = {};
    (jurnalAllData || []).forEach(r => {
      const key = (r.sku || '').trim().toUpperCase();
      if (key) _keluarMap[key] = (_keluarMap[key] || 0) + (r.qty || 0);
    });
    // sisa = masuk - keluar, identik stok.js line 294-296
    const sisaMap = {};
    Object.keys(_masukMap).forEach(k => {
      sisaMap[k] = _masukMap[k] - (_keluarMap[k] || 0);
    });

    // ── Tren: qty 7 hari pertama vs 7 hari terakhir ──
    const qty7AkhirMap = {};
    const qty7AwalMap  = {};
    penjualan.forEach(row => {
      const sku = (row.sku || '').trim().toUpperCase();
      if (!sku) return;
      if (row.tanggal >= dari7) {
        qty7AkhirMap[sku] = (qty7AkhirMap[sku] || 0) + (row.qty || 0);
      } else {
        qty7AwalMap[sku]  = (qty7AwalMap[sku]  || 0) + (row.qty || 0);
      }
    });

    const sisaFilterSet = isKritisMode ? new Set(
      Object.entries(sisaMap).filter(([,v]) => v <= 3).map(([k]) => k)
    ) : null;

    const supplierMap = {};
    (supplierAll || []).forEach(s => {
      const key = (s.boss || '').trim().toUpperCase();
      supplierMap[key] = {
        lead_time   : s.lead_time   || 7,
        min_order   : s.min_order   || 6,
        kelipatan   : s.kelipatan   || s.min_order || 6,
        budget      : s.budget      || 0,
        catatan     : s.catatan     || '',
        buffer_hari : s.buffer_hari || 3
      };
    });
    const DEFAULT_SUPPLIER = { lead_time: 7, min_order: 6, kelipatan: 6, budget: 0, catatan: '', buffer_hari: 3 };

    const produkMap = {};
    produkAll.forEach(p => {
      const key = (p.sku_variasi || p.sku || '').trim().toUpperCase();
      if (key) produkMap[key] = p;
    });

    const qtyMap = {};
    penjualan.forEach(row => {
      const sku = (row.sku || '').trim().toUpperCase();
      if (!sku) return;
      qtyMap[sku] = (qtyMap[sku] || 0) + (row.qty || 0);
    });

    const bossList = {};
    Object.entries(qtyMap).forEach(([sku, qty14]) => {
      const p = produkMap[sku];
      if (!p) return;
      const kat = (p.kategori_produk || 'aktif').toLowerCase();
      if (kat !== 'aktif') return;
      if (isKritisMode && sisaFilterSet && !sisaFilterSet.has(sku)) return;

      const bossKey    = (p.boss || '—').trim().toUpperCase();
      const sup        = supplierMap[bossKey] || DEFAULT_SUPPLIER;
      const avg_harian = qty14 / 14;
      const safety_stock = avg_harian * sup.buffer_hari;
      const rop_raw    = (avg_harian * sup.lead_time) + safety_stock;
      const qty_order  = bulatkanKelipatan(rop_raw, sup.kelipatan, sup.min_order);
      const nilai      = (p.hpp || 0) * qty_order;
      const cover_hari = avg_harian > 0 ? Math.round(qty_order / avg_harian) : null;

      const q_awal  = qty7AwalMap[sku]  || 0;
      const q_akhir = qty7AkhirMap[sku] || 0;
      let tren = 'flat';
      if (q_awal === 0 && q_akhir > 0)  tren = 'baru';
      else if (q_akhir > q_awal * 1.3)  tren = 'naik';
      else if (q_akhir < q_awal * 0.7)  tren = 'turun';

      const sisa_stok = sisaMap[sku] !== undefined ? sisaMap[sku] : null;

      if (!bossList[bossKey]) bossList[bossKey] = { items: [], sup };
      // Days of Stock: berapa hari stok sisa cukup
      const dos = (sisa_stok !== null && avg_harian > 0)
        ? Math.round(sisa_stok / avg_harian)
        : null;

      // Prioritas: SEGERA / PERLU / TUNDA
      let prioritas = 'PERLU';
      if (dos !== null && dos <= sup.lead_time) {
        prioritas = 'SEGERA'; // stok habis sebelum barang datang
      } else if (sisa_stok !== null && sisa_stok <= 3) {
        prioritas = 'SEGERA';
      } else if (tren === 'turun' && (dos === null || dos > 21)) {
        prioritas = 'TUNDA';
      } else if (tren === 'naik' || (dos !== null && dos <= 14)) {
        prioritas = 'PERLU';
      }

      bossList[bossKey].items.push({
        katalog      : p.katalog || '—',
        sku,
        qty14,
        avg_harian   : avg_harian.toFixed(2),
        safety_stock : safety_stock.toFixed(1),
        rop          : rop_raw.toFixed(1),
        qty_order,
        hpp          : p.hpp || 0,
        nilai,
        cover_hari,
        tren,
        sisa_stok,
        dos,
        prioritas
      });
    });

    Object.values(bossList).forEach(b => {
      const _p = { SEGERA: 0, PERLU: 1, TUNDA: 2 };
      b.items.sort((a, z) => {
        // Primary: Prioritas (SEGERA → PERLU → TUNDA)
        const pd = (_p[a.prioritas] ?? 1) - (_p[z.prioritas] ?? 1);
        if (pd !== 0) return pd;
        // Secondary: DoS ascending (makin cepat habis, makin atas)
        const aDos = a.dos !== null ? a.dos : 9999;
        const zDos = z.dos !== null ? z.dos : 9999;
        return aDos - zDos;
      });
    });

    const bossSorted = Object.keys(bossList).sort();

    if (!bossSorted.length) {
      body.innerHTML = '<div style="color:var(--ink3);padding:16px 14px">Tidak ada SKU aktif yang terjual dalam 14 hari terakhir.</div>';
      return;
    }

    const fmtRp = v => v ? 'Rp' + Number(v).toLocaleString('id-ID') : '—';
    const totalSKU    = Object.values(bossList).reduce((s,b) => s + b.items.length, 0);
    const grandBudget = Object.values(bossList).reduce((s,b) => s + b.items.reduce((ss,r) => ss + r.nilai, 0), 0);

    const kritisCount = Object.values(bossList).reduce((s,b) => s + b.items.length, 0);
    const bannerKritis = isKritisMode ? `
      <div style="display:flex;align-items:center;gap:10px;background:rgba(224,82,82,0.1);border:1px solid var(--danger);border-radius:6px;padding:10px 14px;margin-bottom:14px">
        <i class="ti ti-alert-triangle" style="color:var(--danger);font-size:16px"></i>
        <span style="color:var(--danger);font-weight:700;font-size:13px">Mode SKU Kritis — ${kritisCount} SKU perlu restock segera</span>
        <button onclick="loadRestock()" style="margin-left:auto;font-size:12px;padding:4px 10px;border-radius:4px;border:1px solid var(--ink3);background:transparent;color:var(--ink2);cursor:pointer">
          Tampilkan Semua
        </button>
      </div>` : '';

    const clearanceList = [];
    produkAll.forEach(p => {
      const kat = (p.kategori_produk || 'aktif').toLowerCase();
      if (kat === 'aktif') return;
      const skuKey = (p.sku_variasi || p.sku || '').trim().toUpperCase();
      if (!skuKey) return;
      const sisa = sisaMap[skuKey];
      if (sisa === undefined || sisa <= 0) return;
      const qty14 = qtyMap[skuKey] || 0;
      clearanceList.push({
        sku    : skuKey,
        katalog: p.katalog || '—',
        boss   : p.boss    || '—',
        kat,
        sisa,
        qty14,
        hpp    : p.hpp || 0,
        nilai  : sisa * (p.hpp || 0)
      });
    });
    clearanceList.sort((a, z) => z.nilai - a.nilai);

    window._restockData = { bossList, bossSorted, fmtRp, d14, today, totalSKU, grandBudget, bannerKritis, clearanceList };

    if (_restockActiveTab !== 'SUMMARY' && !bossSorted.includes(_restockActiveTab)) {
      _restockActiveTab = 'SUMMARY';
    }

    renderRestockTabs();

  } catch(err) {
    const body2 = document.getElementById('restock-body');
    if (body2) body2.innerHTML = `<div style="color:var(--danger);padding:12px 14px">⚠️ Error: ${err.message}</div>`;
    console.error('[restock]', err);
  }
}

function renderRestockTabs() {
  const body     = document.getElementById('restock-body');
  const tabWrap  = document.getElementById('restock-tab-bar-wrap');
  const infoWrap = document.getElementById('restock-info-bar-wrap');
  if (!body || !window._restockData) return;

  const { bossList, bossSorted, fmtRp, d14, today, totalSKU, grandBudget, bannerKritis, clearanceList } = window._restockData;

  // ── Tab bar — dirender ke sticky header ──
  if (tabWrap) {
    const isSummary = _restockActiveTab === 'SUMMARY';
    const activeLabel = isSummary
      ? '<i class="ti ti-clipboard-list"></i> Summary'
      : '<i class="ti ti-user"></i> ' + _restockActiveTab;
    const activeMeta = isSummary
      ? bossSorted.length + ' supplier'
      : (() => {
          const d = bossList[_restockActiveTab];
          return d ? d.items.reduce((s,r) => s + r.qty_order, 0) + ' pcs' : '';
        })();

    const dropItems = [
      { key: 'SUMMARY', icon: 'ti-clipboard-list', label: 'Summary', meta: bossSorted.length + ' supplier' },
      ...bossSorted.map(boss => {
        const totalQty = bossList[boss].items.reduce((s,r) => s + r.qty_order, 0);
        return { key: boss, icon: 'ti-user', label: boss, meta: totalQty + ' pcs' };
      })
    ];

    tabWrap.innerHTML = `
      <div id="restock-tab-bar">
        <div id="restock-tab-dropdown-wrap">
          <button id="restock-tab-dropdown-btn" onclick="restockDropdownToggle(event)">
            <span id="restock-tab-dropdown-label">${activeLabel}</span>
            <span class="restock-tab-meta" id="restock-tab-dropdown-meta">${activeMeta}</span>
            <i class="ti ti-chevron-down" id="restock-tab-dropdown-chevron"></i>
          </button>
        </div>
      </div>`;

    // Inject Summary button ke top bar laptop (sejajar dengan Refresh + Clearance)
    var summarySlot = document.getElementById('restock-summary-btn-wrap');
    if (summarySlot) {
      summarySlot.innerHTML = `
        <button class="btn btn-sm" onclick="restockDropdownToggle(event)" style="display:inline-flex;align-items:center;gap:5px;font-size:12px">
          <i class="ti ti-clipboard-list"></i> ${activeLabel.replace(/<[^>]+>/g,'')} <span style="font-size:10px;color:var(--ink3)">${activeMeta}</span>
          <i class="ti ti-chevron-down" style="font-size:10px"></i>
        </button>`;
    }
    // Inject Summary button ke mobile slot (portrait HP) — sejajar dengan Refresh + Clearance
    var summarySlotMobile = document.getElementById('restock-tab-bar-wrap-mobile');
    if (summarySlotMobile) {
      summarySlotMobile.innerHTML = `
        <button class="btn btn-sm" onclick="restockDropdownToggle(event)" style="display:inline-flex;align-items:center;gap:5px;font-size:12px">
          <i class="ti ti-clipboard-list"></i> ${activeLabel.replace(/<[^>]+>/g,'')} <span style="font-size:10px;color:var(--ink3)">${activeMeta}</span>
          <i class="ti ti-chevron-down" style="font-size:10px"></i>
        </button>`;
    }

    // Render dropdown menu langsung ke body (keluar dari overflow container)
    var oldMenu = document.getElementById('restock-tab-dropdown-menu');
    if (oldMenu) oldMenu.remove();
    var menuEl = document.createElement('div');
    menuEl.id = 'restock-tab-dropdown-menu';
    menuEl.className = 'restock-dropdown-menu';
    menuEl.style.display = 'none';
    menuEl.innerHTML = dropItems.map(function(item) {
      var activeClass = _restockActiveTab === item.key ? ' restock-dropdown-active' : '';
      return '<div class="restock-dropdown-item' + activeClass + '"' +
        ' onclick="restockSwitchTab(\'' + item.key + '\');restockDropdownClose()">' +
        '<i class="ti ' + item.icon + '"></i>' +
        '<span class="restock-dropdown-item-label">' + item.label + '</span>' +
        '<span class="restock-dropdown-item-meta">' + item.meta + '</span>' +
        '</div>';
    }).join('');
    document.body.appendChild(menuEl);
  }

  // ── Info bar — periode + budget ──
  if (infoWrap) {
    infoWrap.innerHTML = `
      <div id="restock-info-bar">
        <div style="font-size:11px;color:var(--ink3)">
          Periode: <b style="color:var(--ink2)">${fmtTgl(d14)} – ${fmtTgl(today)}</b>
          &nbsp;·&nbsp; ${bossSorted.length} supplier
          &nbsp;·&nbsp; ${totalSKU} SKU aktif
        </div>
      </div>`;
  }

  // ── Content berdasarkan tab aktif ──
  // Summary: restock-tbl-scroll harus overflow:visible supaya sum-list-zone
  // jadi satu-satunya scroll boundary (iOS Safari nested flex scroll fix)
  const scrollEl = document.getElementById('restock-tbl-scroll');
  if (_restockActiveTab === 'SUMMARY') {
    if (scrollEl) {
      scrollEl.style.overflowY = 'visible';
      scrollEl.style.overflowX = 'visible';
      scrollEl.style.overflow  = 'visible';
    }
    body.style.height   = '100%';
    body.style.overflow = 'hidden';
    body.innerHTML = renderSummary(bossList, bossSorted, fmtRp, clearanceList, bannerKritis);
    _sumDualMode = 'segera';
    // Init swipe-to-collapse minicard — identik dengan kas.js (3 zona swipe)
    (function() {
      var topZone  = document.getElementById('sum-top-zone');
      var cardsEl  = document.getElementById('sum-cards-wrap');
      var listZone = document.getElementById('sum-list-zone');
      var header   = document.getElementById('sum-dual-header');
      if (!cardsEl) return;
      // Swipe di minicard sendiri
      initSwipeCollapse(cardsEl, cardsEl, 40, 'sum-cards-collapsed');
      // Swipe di header "Order Sekarang" juga
      if (header) initSwipeCollapse(header, cardsEl, 40, 'sum-cards-collapsed');
      // CATATAN: list zone TIDAK pakai initSwipeCollapse lagi —
      // diganti initSumCardsScrollCollapse (scroll-based collapse + double-swipe expand)
    })();
    // Poin 1+2: scroll collapse + double-swipe expand
    initSumCardsScrollCollapse();
  } else {
    // Supplier tab: restock-tbl-scroll harus overflow:visible
    // supaya sup-tbl-wrap jadi scroll container sendiri
    // dan thead sticky bisa referensi ke sup-tbl-wrap (iOS Safari fix)
    if (scrollEl) {
      scrollEl.style.overflowY = 'visible';
      scrollEl.style.overflowX = 'visible';
      scrollEl.style.overflow  = 'visible';
    }
    body.style.height   = '100%';
    body.style.overflow = 'hidden';
    const bossData = bossList[_restockActiveTab];
    if (!bossData) return;
    body.innerHTML = renderSupplierFull(_restockActiveTab, bossData, fmtRp);
  }

  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-restock'));
}

function restockSwitchTab(boss) {
  _restockActiveTab = boss;
  renderRestockTabs();
  var sc = document.getElementById('restock-tbl-scroll');
  if (sc) sc.scrollTop = 0;
}

// ── Dropdown toggle ──
function restockDropdownToggle(e) {
  e.stopPropagation();
  var btn  = document.getElementById('restock-tab-dropdown-btn');
  var menu = document.getElementById('restock-tab-dropdown-menu');
  var chevron = document.getElementById('restock-tab-dropdown-chevron');
  if (!menu || !btn) return;
  var isOpen = menu.style.display !== 'none';
  if (isOpen) {
    menu.style.display = 'none';
    if (chevron) chevron.style.transform = '';
  } else {
    // Posisi fixed: align kanan tombol, tepat di bawah tombol
    var rect = btn.getBoundingClientRect();
    menu.style.display = 'block';
    // Hitung max-height agar tidak keluar bawah viewport
    var spaceBelow = window.innerHeight - rect.bottom - 10;
    menu.style.maxHeight = Math.min(spaceBelow, window.innerHeight * 0.6) + 'px';
    menu.style.top  = (rect.bottom + 6) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.style.left = 'auto';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    // Close saat touch di luar
    setTimeout(function() {
      document.addEventListener('touchstart', restockDropdownOutside, { once: true, passive: true });
      document.addEventListener('mousedown', restockDropdownOutside, { once: true });
    }, 10);
  }
}
function restockDropdownOutside(e) {
  var wrap = document.getElementById('restock-tab-dropdown-wrap');
  var menu = document.getElementById('restock-tab-dropdown-menu');
  // Jangan close jika touch di tombol atau di menu (menu sekarang di body, bukan di dalam wrap)
  if (wrap && wrap.contains(e.target)) return;
  if (menu && menu.contains(e.target)) return;
  restockDropdownClose();
}
function restockDropdownClose() {
  var menu = document.getElementById('restock-tab-dropdown-menu');
  var chevron = document.getElementById('restock-tab-dropdown-chevron');
  if (menu) menu.style.display = 'none';
  if (chevron) chevron.style.transform = '';
}

// ── Poin 1: Scroll list ke atas → collapse cards + banner ──
// ── Poin 2: 2x swipe down di sticky header → expand ──
function initSumCardsScrollCollapse() {
  var listZone = document.getElementById('sum-list-zone');
  var cardsWrap = document.getElementById('sum-cards-wrap');
  var stickyHeader = document.getElementById('restock-sticky-header');
  if (!listZone || !cardsWrap || !stickyHeader) return;

  // Poin 1: scroll list ke atas → collapse
  listZone.addEventListener('scroll', function() {
    if (listZone.scrollTop > 40) {
      if (!cardsWrap.classList.contains('sum-cards-collapsed')) {
        cardsWrap.classList.add('sum-cards-collapsed');
      }
    }
  }, { passive: true });

  // Poin 2: 2x swipe down di sticky header → expand
  var _swipe1Time = 0;
  var _swipe1Done = false;
  var _startY = 0;
  var _startX = 0;

  stickyHeader.addEventListener('touchstart', function(e) {
    if (e.target.closest('button') || e.target.closest('.restock-dropdown-item')) return;
    _startY = e.touches[0].clientY;
    _startX = e.touches[0].clientX;
  }, { passive: true });

  stickyHeader.addEventListener('touchend', function(e) {
    var dy = e.changedTouches[0].clientY - _startY;
    var dx = e.changedTouches[0].clientX - _startX;
    // Harus dominan vertikal ke bawah, min 30px
    if (Math.abs(dx) > Math.abs(dy)) return;
    if (dy < 30) return;
    // Hanya aktif saat cards sedang collapsed
    if (!cardsWrap.classList.contains('sum-cards-collapsed')) return;

    var now = Date.now();
    if (!_swipe1Done) {
      // Swipe pertama — catat waktu, tidak ada visual
      _swipe1Done = true;
      _swipe1Time = now;
    } else {
      // Swipe kedua — cek window 600ms
      if (now - _swipe1Time <= 600) {
        // Expand!
        cardsWrap.classList.remove('sum-cards-collapsed');
        listZone.scrollTop = 0;
      }
      _swipe1Done = false;
      _swipe1Time = 0;
    }
  }, { passive: true });

  // Reset state jika timeout 600ms
  stickyHeader.addEventListener('touchstart', function() {
    if (_swipe1Done && Date.now() - _swipe1Time > 600) {
      _swipe1Done = false;
      _swipe1Time = 0;
    }
  }, { passive: true });
}

// ── Helper: ikon tren ──
function trenIcon(tren) {
  if (tren === 'naik')  return '<span title="Tren naik 7 hari terakhir" style="color:var(--ok);font-size:13px">↑</span>';
  if (tren === 'turun') return '<span title="Tren turun 7 hari terakhir" style="color:var(--danger);font-size:13px">↓</span>';
  if (tren === 'baru')  return '<span title="Mulai terjual 7 hari terakhir" style="color:var(--warn);font-size:11px">★</span>';
  return '<span style="color:var(--ink3);font-size:11px">→</span>';
}

function coverHariStyle(cover, lead_time) {
  if (cover === null) return 'color:var(--ink3)';
  if (cover <= lead_time + 3)  return 'color:var(--danger);font-weight:700';
  if (cover <= lead_time + 10) return 'color:var(--warn);font-weight:600';
  return 'color:var(--ok)';
}

function sisaBadge(sisa) {
  if (sisa === null)  return '<span style="color:var(--ink3);font-size:10px">—</span>';
  if (sisa <= 0)      return `<span style="color:var(--danger);font-weight:700">${sisa} ⚠️</span>`;
  if (sisa <= 3)      return `<span style="color:var(--danger)">${sisa}</span>`;
  if (sisa <= 8)      return `<span style="color:var(--warn)">${sisa}</span>`;
  return `<span style="color:var(--ink2)">${sisa}</span>`;
}

// ── Summary dual toggle: Order Sekarang ↔ Naik Daun ──
// ── Minicard collapse toggle ──
var _sumCardsCollapsed = false;
function sumCardsToggle() {
  _sumCardsCollapsed = !_sumCardsCollapsed;
  const inner   = document.getElementById('sum-cards-inner');
  const chevron = document.getElementById('sum-cards-chevron');
  if (!inner || !chevron) return;
  if (_sumCardsCollapsed) {
    inner.style.maxHeight = '0';
    inner.style.opacity   = '0';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    inner.style.maxHeight = '300px';
    inner.style.opacity   = '1';
    chevron.style.transform = 'rotate(0deg)';
  }
}

var _sumDualMode = 'segera'; // 'segera' | 'naik'

function sumDualToggle(segeraLen, naikLen) {
  _sumDualMode = _sumDualMode === 'segera' ? 'naik' : 'segera';
  const list    = document.getElementById('sum-dual-list');
  const label   = document.getElementById('sum-dual-label');
  const title   = document.getElementById('sum-dual-title');
  const btn     = document.getElementById('sum-dual-toggle');
  if (!list || !label || !title || !btn) return;

  if (_sumDualMode === 'naik') {
    label.textContent = 'Lagi Naik Daun — ' + naikLen + ' SKU';
    title.style.color = 'var(--ok)';
    title.querySelector('i').className = 'ti ti-trending-up';
    btn.style.color = 'var(--danger)';
    btn.style.borderColor = 'rgba(224,82,82,0.3)';
    btn.style.background = 'rgba(224,82,82,0.07)';
    btn.innerHTML = '<i class="ti ti-urgent" style="font-size:12px"></i> Order ' + segeraLen;
    // Render naik list
    list.innerHTML = window._sumNaikHtml || '<div style="color:var(--ink3);padding:10px 0">Belum ada tren naik</div>';
  } else {
    label.textContent = 'Order Sekarang — ' + segeraLen + ' SKU';
    title.style.color = 'var(--danger)';
    title.querySelector('i').className = 'ti ti-urgent';
    btn.style.color = 'var(--ok)';
    btn.style.borderColor = 'rgba(46,204,122,0.3)';
    btn.style.background = 'rgba(46,204,122,0.07)';
    btn.innerHTML = '<i class="ti ti-trending-up" style="font-size:12px"></i> Naik ' + naikLen;
    list.innerHTML = window._sumSegeraHtml || '<div style="color:var(--ink3);padding:10px 0">Semua stok aman 👌</div>';
  }
}

function prioritasBadge(p) {
  if (p === 'SEGERA') return '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;background:rgba(224,82,82,0.15);color:var(--danger);border:1px solid var(--danger)">SEGERA</span>';
  if (p === 'TUNDA')  return '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;background:rgba(80,80,96,0.3);color:var(--ink3);border:1px solid var(--ink3)">TUNDA</span>';
  return '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;background:rgba(230,168,23,0.12);color:var(--warn);border:1px solid var(--warn)">PERLU</span>';
}

function dosBadge(dos, lead_time) {
  if (dos === null) return '<span style="color:var(--ink3)">—</span>';
  if (dos <= lead_time) return '<b style="color:var(--danger)">' + dos + ' hr</b>';
  if (dos <= 14)        return '<b style="color:var(--warn)">'   + dos + ' hr</b>';
  return '<span style="color:var(--ink2)">' + dos + ' hr</span>';
}

// ── Tab Summary ──
function renderSummary(bossList, bossSorted, fmtRp, clearanceList, bannerKritis) {
  const grandBudget = bossSorted.reduce((s,b) => s + bossList[b].items.reduce((ss,r) => ss + r.nilai, 0), 0);
  const grandQty    = bossSorted.reduce((s,b) => s + bossList[b].items.reduce((ss,r) => ss + r.qty_order, 0), 0);
  const grandSKU    = bossSorted.reduce((s,b) => s + bossList[b].items.length, 0);
  const allItems    = bossSorted.flatMap(b => bossList[b].items.map(r => ({ ...r, _boss: b, _sup: bossList[b].sup })));

  // ── Klasifikasi ──
  const segera  = allItems.filter(r => r.prioritas === 'SEGERA');
  const perlu   = allItems.filter(r => r.prioritas === 'PERLU');
  const tunda   = allItems.filter(r => r.prioritas === 'TUNDA');
  const skuNaik = allItems.filter(r => r.tren === 'naik' || r.tren === 'baru');

  // ── Deadline order: SKU dengan DoS paling pendek ──
  const dosSorted = allItems.filter(r => r.dos !== null).sort((a,z) => a.dos - z.dos);
  const deadlineSku = dosSorted[0] || null;

  // ── Deadline warning — dideklarasi dulu sebelum cards ──
  const deadlineBar = deadlineSku ? (() => {
    const dos = deadlineSku.dos;
    const color = dos <= 3 ? 'var(--danger)' : dos <= 7 ? 'var(--warn)' : 'var(--ok)';
    const msg = dos <= 0
      ? `<b style="color:var(--danger)">${deadlineSku.sku}</b> sudah HABIS — order sekarang juga!`
      : dos <= deadlineSku._sup.lead_time
      ? `<b style="color:var(--danger)">${deadlineSku.sku}</b> habis dalam <b>${dos} hari</b> — lebih cepat dari lead time supplier!`
      : `SKU paling kritis: <b style="color:${color}">${deadlineSku.sku}</b> — sisa stok cukup <b>${dos} hari</b>`;
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:8px;
                  background:rgba(224,82,82,0.06);border-radius:6px;border-left:3px solid ${color}">
        <i class="ti ti-alarm" style="color:${color};font-size:16px;flex-shrink:0"></i>
        <span style="font-size:13px;color:var(--ink2)">${msg}</span>
      </div>`;
  })() : '';

  // ── Minicard — bannerKritis + deadlineBar ikut collapse bersama cards ──
  const cards = `
    <div id="sum-cards-wrap" style="margin-bottom:4px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06)">
      <div id="sum-cards-inner" style="overflow:hidden;transition:max-height .3s ease,opacity .3s ease;max-height:600px;opacity:1">
        ${bannerKritis ? '<div style="margin-bottom:8px">' + bannerKritis + '</div>' : ''}
        ${deadlineBar}
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:4px 0 2px" class="sum-cards-grid">
          <div style="background:rgba(224,82,82,0.08);border:1.5px solid var(--danger);border-radius:8px;padding:12px 10px;min-width:0">
            <div style="font-size:9px;font-weight:700;color:var(--danger);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;white-space:nowrap">⚡ Order Kini</div>
            <div style="font-size:28px;font-weight:700;color:var(--danger);line-height:1">${segera.length}</div>
            <div style="font-size:10px;color:var(--ink3);margin-top:4px">SKU kritis</div>
          </div>
          <div style="background:rgba(230,168,23,0.08);border:1.5px solid var(--warn);border-radius:8px;padding:12px 10px;min-width:0">
            <div style="font-size:9px;font-weight:700;color:var(--warn);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;white-space:nowrap">📋 Perlu Order</div>
            <div style="font-size:28px;font-weight:700;color:var(--warn);line-height:1">${perlu.length}</div>
            <div style="font-size:10px;color:var(--ink3);margin-top:4px">SKU segera</div>
          </div>
          <div style="background:rgba(46,204,122,0.08);border:1.5px solid var(--ok);border-radius:8px;padding:12px 10px;min-width:0">
            <div style="font-size:9px;font-weight:700;color:var(--ok);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;white-space:nowrap">💰 Total Order</div>
            <div style="font-size:28px;font-weight:700;color:var(--ok);line-height:1">${grandQty}</div>
            <div style="font-size:10px;color:var(--ink3);margin-top:4px">pcs · ${grandSKU} SKU</div>
          </div>
          <div style="background:rgba(24,95,165,0.08);border:1.5px solid rgba(24,95,165,0.4);border-radius:8px;padding:12px 10px;min-width:0">
            <div style="font-size:9px;font-weight:700;color:#5ba3e0;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;white-space:nowrap">💳 Total Budget</div>
            <div style="font-size:16px;font-weight:700;color:#5ba3e0;line-height:1.2;word-break:break-all">${fmtRp(grandBudget)}</div>
            <div style="font-size:10px;color:var(--ink3);margin-top:4px">${grandQty}pcs · ${grandSKU} SKU</div>
          </div>
        </div>
      </div>
    </div>`;

  // ── SKU SEGERA + Naik Daun — toggle, default Order Sekarang ──
  const segeraBlock = '';
  const naikBlock   = '';

  const _renderSegeraList = () => segera.length ? `
    <div style="display:flex;flex-direction:column;gap:5px">
      ${segera.map(r => `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(224,82,82,0.06);border:1px solid rgba(224,82,82,0.2);border-radius:6px;cursor:pointer" onclick="restockSwitchTab('${r._boss}')">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.sku}</div>
            <div style="font-size:11px;color:var(--ink3)">${r.katalog} · <b>${r._boss}</b></div>
          </div>
          <div style="text-align:right;flex-shrink:0;line-height:1.4">
            <div style="font-size:10px;color:var(--ink3)">sisa · habis · order</div>
            <div style="font-size:12px;font-weight:700">
              <span style="color:${r.sisa_stok <= 0 ? 'var(--danger)' : r.sisa_stok <= 3 ? 'var(--danger)' : 'var(--warn)'}">${r.sisa_stok !== null ? r.sisa_stok : '—'}</span>
              <span style="color:var(--ink3)"> · </span>
              <span style="color:var(--danger)">${r.dos !== null ? r.dos+'hr' : '—'}</span>
              <span style="color:var(--ink3)"> · </span>
              <span style="color:var(--warn)">${r.qty_order}pcs</span>
            </div>
          </div>
          <i class="ti ti-chevron-right" style="color:var(--ink3);flex-shrink:0;font-size:13px"></i>
        </div>
      `).join('')}
    </div>` : '<div style="color:var(--ink3);font-size:13px;padding:10px 0">Semua stok aman 👌</div>';

  const _renderNaikList = () => skuNaik.length ? `
    <div style="display:flex;flex-direction:column;gap:5px">
      ${skuNaik.map(r => `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(46,204,122,0.06);border:1px solid rgba(46,204,122,0.2);border-radius:6px;cursor:pointer" onclick="restockSwitchTab('${r._boss}')">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.sku}</div>
            <div style="font-size:11px;color:var(--ink3)">${r.katalog} · <b>${r._boss}</b></div>
          </div>
          <div style="text-align:right;flex-shrink:0;line-height:1.4">
            <div style="font-size:10px;color:var(--ink3)">tren · order</div>
            <div style="font-size:12px;font-weight:700">
              <span style="color:var(--ok)">${r.tren === 'baru' ? '★ baru' : '↑ naik'}</span>
              <span style="color:var(--ink3)"> · </span>
              <span style="color:var(--warn)">${r.qty_order}pcs</span>
            </div>
          </div>
          <i class="ti ti-chevron-right" style="color:var(--ink3);flex-shrink:0;font-size:13px"></i>
        </div>
      `).join('')}
    </div>` : '<div style="color:var(--ink3);font-size:13px;padding:10px 0">Belum ada tren naik</div>';

  // Pre-render list HTML — harus sebelum template string return
  const _segeraHtml = _renderSegeraList();
  const _naikHtml   = _renderNaikList();
  window._sumSegeraHtml = _segeraHtml;
  window._sumNaikHtml   = _naikHtml;

  const dualBlock = '';

  // ── Tabel per supplier (ringkas) ──
  const rows = bossSorted.map(boss => {
    const { items, sup } = bossList[boss];
    const totalQty    = items.reduce((s,r) => s + r.qty_order, 0);
    const totalNilai  = items.reduce((s,r) => s + r.nilai, 0);
    const budgetSisa  = sup.budget ? sup.budget - totalNilai : null;
    const segeraN     = items.filter(r => r.prioritas === 'SEGERA').length;
    const perluN      = items.filter(r => r.prioritas === 'PERLU').length;
    const tundaN      = items.filter(r => r.prioritas === 'TUNDA').length;

    const prioritasCell = [
      segeraN ? `<span style="color:var(--danger);font-weight:700">${segeraN} segera</span>` : '',
      perluN  ? `<span style="color:var(--warn)">${perluN} perlu</span>` : '',
      tundaN  ? `<span style="color:var(--ink3)">${tundaN} tunda</span>` : '',
    ].filter(Boolean).join(' · ');

    const budgetCell = sup.budget
      ? `${fmtRp(sup.budget)} <span style="font-size:11px;color:${budgetSisa >= 0 ? 'var(--ok)' : 'var(--danger)'}">(${budgetSisa >= 0 ? 'sisa ' + fmtRp(budgetSisa) : 'over ' + fmtRp(Math.abs(budgetSisa))})</span>`
      : `<span style="color:var(--ink3)">—</span>`;

    return `
      <tr>
        <td>
          <b style="cursor:pointer;color:var(--ink)" onclick="restockSwitchTab('${boss}')">${boss}</b>
          <div style="font-size:11px;color:var(--ink3)">LT ${sup.lead_time}h · min ${sup.min_order}pcs${sup.catatan ? ' · ' + sup.catatan : ''}</div>
        </td>
        <td style="text-align:center;font-size:13px">${prioritasCell || '—'}</td>
        <td style="text-align:center;font-weight:700;color:var(--warn)">${totalQty} pcs</td>
        <td style="text-align:right;font-weight:700;color:var(--ok)">${fmtRp(totalNilai)}</td>
        <td style="text-align:right;font-size:12px">${budgetCell}</td>
        <td style="text-align:center">
          <button class="btn btn-sm" onclick="restockSwitchTab('${boss}')" style="font-size:11px">Detail →</button>
        </td>
      </tr>`;
  }).join('');

  const totalRow = `
    <tr style="font-weight:700;border-top:2px solid var(--ink3)">
      <td style="color:var(--ink2)">TOTAL — ${bossSorted.length} supplier</td>
      <td style="text-align:center;font-size:12px;color:var(--ink3)">${grandSKU} SKU aktif</td>
      <td style="text-align:center;font-size:18px;color:var(--warn)">${grandQty} pcs</td>
      <td style="text-align:right;font-size:15px;color:var(--ok)">${fmtRp(grandBudget)}</td>
      <td colspan="2"></td>
    </tr>`;

  // ── Clearance ──
  const clearanceBlock = (clearanceList && clearanceList.length) ? `
    <div style="margin-top:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 16px;background:var(--cream2);border-radius:6px;border-left:3px solid var(--ink3)">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--ink2);margin-bottom:3px"><i class="ti ti-tag"></i> Clearance Monitor</div>
        <div style="font-size:12px;color:var(--ink3)">${clearanceList.length} SKU non-aktif · Modal tertahan: <b style="color:var(--warn)">${fmtRp(clearanceList.reduce((s,r) => s + r.nilai, 0))}</b></div>
      </div>
      <button class="btn btn-sm" onclick="gotoPage('clearance',null)" style="font-size:12px"><i class="ti ti-tag"></i> Lihat Clearance</button>
    </div>` : '';

  return `
    <!-- ZONA ATAS: fixed, tidak scroll -->
    <div id="sum-top-zone" style="-webkit-flex-shrink:0;flex-shrink:0;padding:10px 14px 0;background:var(--cream2)">
      ${cards}
      ${(segera.length || skuNaik.length) ? `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0 8px;border-top:1px solid rgba(255,255,255,0.06)">
        <!-- Portrait: toggle button -->
        <div class="sum-header-portrait" style="display:flex;align-items:center;justify-content:space-between;width:100%">
          <div id="sum-dual-title" style="font-size:12px;font-weight:700;color:var(--danger);text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:6px">
            <i class="ti ti-urgent"></i> <span id="sum-dual-label">Order Sekarang — ${segera.length} SKU</span>
          </div>
          <button id="sum-dual-toggle" onclick="sumDualToggle(${segera.length}, ${skuNaik.length})"
            style="font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;
                   border:1px solid rgba(46,204,122,0.3);background:rgba(46,204,122,0.07);
                   color:var(--ok);cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px">
            <i class="ti ti-trending-up" style="font-size:12px"></i>
            Naik ${skuNaik.length}
          </button>
        </div>
        <!-- Laptop: judul dua kolom -->
        <div class="sum-header-laptop" style="display:none;width:100%;align-items:center;gap:0">
          <div style="flex:1;font-size:12px;font-weight:700;color:var(--danger);text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:6px">
            <i class="ti ti-urgent"></i> Order Sekarang — ${segera.length} SKU
          </div>
          <div style="flex:1;font-size:12px;font-weight:700;color:var(--ok);text-transform:uppercase;letter-spacing:.08em;display:flex;align-items:center;gap:6px;padding-left:12px;border-left:1px solid rgba(255,255,255,0.06)">
            <i class="ti ti-trending-up"></i> Lagi Naik — ${skuNaik.length} SKU
          </div>
        </div>
      </div>` : ''}
    </div>
    <!-- Portrait: single list dengan toggle -->
    <div id="sum-list-zone" class="sum-list-portrait" style="-webkit-flex:1 1 0;flex:1 1 0;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;-webkit-overflow-scrolling:touch;padding:0 14px 16px">
      <div id="sum-dual-list">${_segeraHtml}</div>
    </div>
    <!-- Laptop: dua kolom side-by-side -->
    <div id="sum-split-zone" class="sum-list-laptop" style="display:none;-webkit-flex:1 1 0;flex:1 1 0;min-height:0;">
      <div style="flex:1;min-width:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;padding:0 14px 16px;border-right:1px solid rgba(255,255,255,0.06)">
        ${_segeraHtml}
      </div>
      <div style="flex:1;min-width:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;padding:0 14px 16px">
        ${_naikHtml}
      </div>
    </div>`;
}

// ── Tampilan full 1 supplier (tab individual) ──
function renderSupplierFull(boss, { items, sup }, fmtRp) {
  const totalQty   = items.reduce((s,r) => s + r.qty_order, 0);
  const totalNilai = items.reduce((s,r) => s + r.nilai, 0);
  const budgetSisa = sup.budget ? sup.budget - totalNilai : null;

  const trenNaik  = items.filter(r => r.tren === 'naik').length;
  const trenTurun = items.filter(r => r.tren === 'turun').length;
  const trenBaru  = items.filter(r => r.tren === 'baru').length;

  const trenSummary = (trenNaik || trenTurun || trenBaru) ? `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;font-size:12px">
      ${trenNaik  ? `<span style="color:var(--ok)">↑ ${trenNaik} SKU tren naik</span>` : ''}
      ${trenTurun ? `<span style="color:var(--danger)">↓ ${trenTurun} SKU tren turun</span>` : ''}
      ${trenBaru  ? `<span style="color:var(--warn)">★ ${trenBaru} SKU mulai laku</span>` : ''}
    </div>` : '';

  // ── Portrait mobile: info box collapsible, tabel 4 kolom ──
  return `
    <!-- INFO BOX — collapsible di portrait -->
    <div id="sup-info-box" class="sup-info-box">
      <div class="sup-info-inner">
        <div style="display:flex;flex-wrap:wrap;gap:10px;padding:10px 14px;
                    background:var(--cream2);border:1px dashed rgba(255,255,255,0.15);border-radius:6px;margin:10px 14px 0">
          <div style="font-size:13px"><span style="color:var(--ink3)">Lead Time:</span> <b>${sup.lead_time} hari</b></div>
          <div style="font-size:13px"><span style="color:var(--ink3)">Safety Stock:</span> <b style="color:var(--ink2)">${sup.buffer_hari} hari buffer</b></div>
          <div style="font-size:13px"><span style="color:var(--ink3)">Min Order:</span> <b>${sup.min_order} pcs</b></div>
          <div style="font-size:13px"><span style="color:var(--ink3)">Kelipatan:</span> <b>× ${sup.kelipatan}</b></div>
          ${sup.budget ? `
            <div style="font-size:13px;margin-left:auto">
              <span style="color:var(--ink3)">Budget:</span>
              <b style="color:var(--warn);margin-left:4px">${fmtRp(sup.budget)}</b>
              <span style="margin-left:6px;color:${budgetSisa >= 0 ? 'var(--ok)' : 'var(--danger)'}">
                ${budgetSisa >= 0 ? '(Sisa '+fmtRp(budgetSisa)+')' : '(Over '+fmtRp(Math.abs(budgetSisa))+')'}
              </span>
            </div>` : ''}
          ${sup.catatan ? `<div style="width:100%;font-size:11px;color:var(--ink3)"><i class="ti ti-note"></i> ${sup.catatan}</div>` : ''}
          ${trenSummary}
        </div>
        <div style="padding:6px 14px 8px;font-size:11px;color:var(--ink3)">
          Cover: <span style="color:var(--danger)">merah</span> = pendek · <span style="color:var(--warn)">kuning</span> = cukup · <span style="color:var(--ok)">hijau</span> = aman
          &nbsp;·&nbsp; Tren: ↑ naik · ↓ turun · → stabil · ★ baru
        </div>
      </div>
      <!-- Toggle hint — hanya portrait -->
      <div class="sup-info-toggle" onclick="supInfoToggle()">
        <span class="sup-info-toggle-label">Detail Supplier</span>
        <i class="ti ti-chevron-down sup-info-chevron"></i>
      </div>
    </div>

    <!-- TABEL -->
    <div class="tbl-wrap" id="sup-tbl-wrap" onscroll="supInfoAutoCollapse(this)">
      <table class="tbl">
        <thead>
          <tr>
            <!-- Desktop: semua kolom -->
            <th class="col-desktop">#</th>
            <th class="col-desktop">Katalog</th>
            <th>Variant (SKU)</th>
            <th style="text-align:center">Prioritas</th>
            <th class="col-desktop" style="text-align:center">DoS</th>
            <th style="text-align:center">Tren</th>
            <th style="text-align:center">Sisa</th>
            <th class="col-desktop" style="text-align:center">Qty 14hr</th>
            <th class="col-desktop" style="text-align:center">Avg/hari</th>
            <th style="text-align:center;color:var(--warn)">Order</th>
            <th class="col-desktop" style="text-align:right;color:var(--ok)">Nilai HPP</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((r, i) => `
            <tr style="${r.prioritas === 'SEGERA' ? 'background:rgba(224,82,82,0.05)' : r.prioritas === 'TUNDA' ? 'opacity:0.6' : ''}">
              <td class="col-desktop" style="color:var(--ink3);font-size:11px">${i + 1}</td>
              <td class="col-desktop" style="color:var(--ink3)">${r.katalog}</td>
              <td>
                <b style="color:var(--ink)">${r.sku}</b>
                <!-- Sub-text portrait: dos + katalog -->
                <div class="col-portrait-sub" style="font-size:10px;color:var(--ink3);margin-top:2px">${r.katalog} · <span style="color:${r.dos !== null && r.dos <= sup.lead_time ? 'var(--danger)' : r.dos !== null && r.dos <= 14 ? 'var(--warn)' : 'var(--ink3)'}">${r.dos !== null ? r.dos+'hr' : '—'}</span></div>
              </td>
              <td style="text-align:center">${prioritasBadge(r.prioritas)}</td>
              <td class="col-desktop" style="text-align:center">${dosBadge(r.dos, sup.lead_time)}</td>
              <td style="text-align:center">${trenIcon(r.tren)}</td>
              <td style="text-align:center">${sisaBadge(r.sisa_stok)}</td>
              <td class="col-desktop" style="text-align:center">${r.qty14}</td>
              <td class="col-desktop" style="text-align:center;color:var(--ink3)">${r.avg_harian}</td>
              <td style="text-align:center;font-weight:700;font-size:16px;color:var(--warn)">${r.qty_order}</td>
              <td class="col-desktop" style="text-align:right;font-weight:600;color:${r.nilai ? 'var(--ok)' : 'var(--ink3)'}">
                ${fmtRp(r.nilai)}
              </td>
            </tr>
          `).join('')}
          <tr style="font-weight:700;border-top:2px solid var(--ink3)">
            <td class="col-desktop"></td>
            <td class="col-desktop" style="color:var(--ink2)">Total</td>
            <td style="color:var(--ink2)">Total</td>
            <td colspan="2" class="col-desktop"></td>
            <td class="col-desktop"></td>
            <td class="col-desktop"></td>
            <td class="col-desktop"></td>
            <td class="col-desktop"></td>
            <td style="text-align:center;font-size:18px;color:var(--warn)">${totalQty}</td>
            <td class="col-desktop" style="text-align:right;color:var(--ok);font-size:15px">${fmtRp(totalNilai)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

// ── Info box collapse (portrait) ──
function supInfoToggle() {
  const box = document.getElementById('sup-info-box');
  if (!box) return;
  box.classList.toggle('sup-info-collapsed');
}

function supInfoAutoCollapse(el) {
  const box = document.getElementById('sup-info-box');
  if (!box) return;
  // Hanya aktif di portrait
  if (window.innerWidth > 900 || window.innerHeight < window.innerWidth) return;
  if (el.scrollTop > 30) {
    box.classList.add('sup-info-collapsed');
  } else if (el.scrollTop < 5) {
    box.classList.remove('sup-info-collapsed');
  }
}

function bulatkanKelipatan(nilai, kelipatan, min_order) {
  if (nilai <= 0) nilai = 0.01;
  const k   = kelipatan || 1;
  const raw = Math.ceil(nilai / k) * k;
  return Math.max(raw, min_order || k);
}

function fmtTgl(d) {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
