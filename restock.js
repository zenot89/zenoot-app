// ─── RESTOCK.JS — tab per supplier ──────────────────────────
// Logic: SKU aktif yang terjual 14 hari terakhir
// Tab: Summary (ringkasan eksekutif) | per Supplier (1 tabel penuh)
// Layout: Full-Height Flex Table Layout (same pattern as jurnal-penjualan)

document.getElementById('page-restock').innerHTML = `
  <!-- TOP BAR: judul halaman + tombol aksi (laptop) — diam di atas, LUAR card -->
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
      </div>
    </div>
  </div>

  <!-- CARD tabel: flex:1, mengisi sisa ruang -->
  <div class="card" id="restock-wrap">

    <!-- STICKY HEADER dalam card: judul + tombol mobile + tab bar + info bar -->
    <div id="restock-sticky-header">

      <!-- Card title + tombol aksi (mobile fallback) -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px 6px">
        <span style="font-weight:700;font-size:14px"><i class="ti ti-refresh"></i> Re-Stock — Penjualan 14 Hari Terakhir</span>
        <div id="restock-aksi-mobile" style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-sm" onclick="loadRestock()" title="Refresh" style="padding:4px 8px">
            <i class="ti ti-refresh"></i>
          </button>
          <button class="btn btn-sm" onclick="gotoPage('clearance',null)" style="display:inline-flex;align-items:center;gap:5px;font-size:12px">
            <i class="ti ti-tag"></i> Clearance
          </button>
        </div>
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

    const [penjualan, produkAll, supplierAll, stokRaw, jpAllRaw] = await Promise.all([
      dbGet('jurnal_penjualan', '&tanggal=gte.' + dari + '&order=tanggal.desc'),
      dbGet('produk', '&order=katalog.asc'),
      dbGet('restock_supplier', '&order=boss.asc').catch(() => []),
      dbGet('stok'),
      dbGet('jurnal_penjualan', '&select=sku,qty')
    ]);

    // ── Hitung sisa stok per SKU ──
    const masukMap = {};
    (stokRaw || []).forEach(s => {
      const key = (s.sku_variasi || '').trim().toUpperCase();
      if (key) masukMap[key] = (masukMap[key] || 0) + (s.stok_masuk || 0);
    });
    const keluarMapAll = {};
    (jpAllRaw || []).forEach(r => {
      const key = (r.sku || '').trim().toUpperCase();
      if (key) keluarMapAll[key] = (keluarMapAll[key] || 0) + (r.qty || 0);
    });
    const sisaMap = {};
    Object.keys(masukMap).forEach(k => {
      sisaMap[k] = (masukMap[k] || 0) - (keluarMapAll[k] || 0);
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
      const pd = (_p[a.prioritas] || 1) - (_p[z.prioritas] || 1);
      if (pd !== 0) return pd;
      return z.qty_order - a.qty_order;
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
    tabWrap.innerHTML = `
      <div id="restock-tab-bar">
        <button
          onclick="restockSwitchTab('SUMMARY')"
          class="restock-tab-btn${_restockActiveTab === 'SUMMARY' ? ' restock-tab-active' : ''}">
          <i class="ti ti-clipboard-list"></i> Summary
          <span class="restock-tab-meta">${bossSorted.length} supplier</span>
        </button>
        ${bossSorted.map(boss => {
          const { items } = bossList[boss];
          const totalQty = items.reduce((s,r) => s + r.qty_order, 0);
          const isActive = _restockActiveTab === boss;
          return `<button
            onclick="restockSwitchTab('${boss}')"
            class="restock-tab-btn${isActive ? ' restock-tab-active' : ''}">
            <i class="ti ti-user"></i> ${boss}
            <span class="restock-tab-meta">${totalQty} pcs</span>
          </button>`;
        }).join('')}
      </div>`;
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
        <div style="margin-left:auto;font-size:12px;font-weight:700;color:var(--ok);white-space:nowrap">
          Total Budget: ${fmtRp(grandBudget)}
        </div>
      </div>`;
  }

  // ── Content berdasarkan tab aktif ──
  if (_restockActiveTab === 'SUMMARY') {
    body.innerHTML = renderSummary(bossList, bossSorted, fmtRp, clearanceList, bannerKritis);
  } else {
    const bossData = bossList[_restockActiveTab];
    if (!bossData) return;
    body.innerHTML = renderSupplierFull(_restockActiveTab, bossData, fmtRp);
  }

  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-restock'));
}

function restockSwitchTab(boss) {
  _restockActiveTab = boss;
  renderRestockTabs();
  // Scroll tbl-scroll ke atas saat ganti tab
  var sc = document.getElementById('restock-tbl-scroll');
  if (sc) sc.scrollTop = 0;
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
  const grandBudget  = bossSorted.reduce((s,b) => s + bossList[b].items.reduce((ss,r) => ss + r.nilai, 0), 0);
  const grandQty     = bossSorted.reduce((s,b) => s + bossList[b].items.reduce((ss,r) => ss + r.qty_order, 0), 0);
  const grandSKU     = bossSorted.reduce((s,b) => s + bossList[b].items.length, 0);

  const allItems       = bossSorted.flatMap(b => bossList[b].items);
  const skuKritis      = allItems.filter(r => r.sisa_stok !== null && r.sisa_stok <= 3);
  const skuNaik        = allItems.filter(r => r.tren === 'naik');
  const skuTurun       = allItems.filter(r => r.tren === 'turun');
  const skuCoverPendek = allItems.filter(r => {
    const sup = bossSorted.map(b => bossList[b]).find(b => b.items.includes(r));
    return r.cover_hari !== null && r.cover_hari <= (sup ? sup.sup.lead_time + 3 : 10);
  });

  const alerts = [];
  if (skuKritis.length)      alerts.push(`<span style="color:var(--danger)"><b>${skuKritis.length} SKU</b> stok kritis (≤3 pcs)</span>`);
  if (skuCoverPendek.length) alerts.push(`<span style="color:var(--warn)"><b>${skuCoverPendek.length} SKU</b> cover pendek</span>`);
  if (skuNaik.length)        alerts.push(`<span style="color:var(--ok)"><b>${skuNaik.length} SKU</b> tren naik ↑</span>`);
  if (skuTurun.length)       alerts.push(`<span style="color:var(--ink3)"><b>${skuTurun.length} SKU</b> tren turun ↓</span>`);

  const alertBar = alerts.length ? `
    <div style="display:flex;flex-wrap:wrap;gap:16px;padding:10px 14px;margin-bottom:14px;
                background:var(--cream2);border-radius:6px;border-left:3px solid var(--warn);font-size:13px">
      ${alerts.join('<span style="color:var(--ink3)">·</span>')}
    </div>` : '';

  const rows = bossSorted.map(boss => {
    const { items, sup } = bossList[boss];
    const totalQty   = items.reduce((s,r) => s + r.qty_order, 0);
    const totalNilai = items.reduce((s,r) => s + r.nilai, 0);
    const budgetSisa = sup.budget ? sup.budget - totalNilai : null;
    const skuKritisN = items.filter(r => r.sisa_stok !== null && r.sisa_stok <= 3).length;
    const trenNaikN  = items.filter(r => r.tren === 'naik').length;
    const trenTurunN = items.filter(r => r.tren === 'turun').length;

    const budgetCell = sup.budget
      ? `<div style="font-size:12px;color:var(--warn)">${fmtRp(sup.budget)}</div>
         <div style="font-size:11px;color:${budgetSisa >= 0 ? 'var(--ok)' : 'var(--danger)'}">
           ${budgetSisa >= 0 ? 'sisa ' + fmtRp(budgetSisa) : 'over ' + fmtRp(Math.abs(budgetSisa))}
         </div>`
      : `<span style="color:var(--ink3);font-size:12px">—</span>`;

    const trenCell = [
      trenNaikN  ? `<span style="color:var(--ok)">↑${trenNaikN}</span>` : '',
      trenTurunN ? `<span style="color:var(--danger)">↓${trenTurunN}</span>` : '',
    ].filter(Boolean).join(' ') || '<span style="color:var(--ink3)">→</span>';

    const kritisCell = skuKritisN
      ? `<span style="color:var(--danger);font-weight:700">⚠ ${skuKritisN}</span>`
      : `<span style="color:var(--ink3)">—</span>`;

    return `
      <tr>
        <td>
          <b style="font-size:14px;cursor:pointer;color:var(--ink)" onclick="restockSwitchTab('${boss}')">${boss}</b>
          <div style="font-size:11px;color:var(--ink3)">LT ${sup.lead_time}h · SS ${sup.buffer_hari}h · min ${sup.min_order}pcs</div>
          ${sup.catatan ? `<div style="font-size:10px;color:var(--ink3);margin-top:2px"><i class="ti ti-note"></i> ${sup.catatan}</div>` : ''}
        </td>
        <td style="text-align:center">${items.length}</td>
        <td style="text-align:center;font-size:18px;font-weight:700;color:var(--warn)">${totalQty}</td>
        <td style="text-align:right;font-weight:700;color:var(--ok)">${fmtRp(totalNilai)}</td>
        <td style="text-align:center">${budgetCell}</td>
        <td style="text-align:center;font-size:13px">${trenCell}</td>
        <td style="text-align:center">${kritisCell}</td>
        <td style="text-align:center">
          <button class="btn btn-sm" onclick="restockSwitchTab('${boss}')" style="font-size:11px">
            Detail →
          </button>
        </td>
      </tr>`;
  }).join('');

  const totalRow = `
    <tr style="font-weight:700;border-top:2px solid var(--ink3)">
      <td style="color:var(--ink2)">TOTAL — ${bossSorted.length} supplier</td>
      <td style="text-align:center;color:var(--ink2)">${grandSKU} SKU</td>
      <td style="text-align:center;font-size:20px;color:var(--warn)">${grandQty}</td>
      <td style="text-align:right;font-size:15px;color:var(--ok)">${fmtRp(grandBudget)}</td>
      <td colspan="4"></td>
    </tr>`;

  return `
    ${bannerKritis || ''}
    ${alertBar}
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Supplier</th>
            <th style="text-align:center">SKU</th>
            <th style="text-align:center;color:var(--warn)">Total Order</th>
            <th style="text-align:right;color:var(--ok)">Nilai HPP</th>
            <th style="text-align:center">Budget</th>
            <th style="text-align:center">Tren</th>
            <th style="text-align:center">Kritis</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          ${totalRow}
        </tbody>
      </table>
    </div>
    ${(clearanceList && clearanceList.length) ? `
    <div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:12px 16px;background:var(--cream2);border-radius:6px;border-left:3px solid var(--ink3)">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--ink2);margin-bottom:3px"><i class="ti ti-tag"></i> Clearance Monitor</div>
        <div style="font-size:12px;color:var(--ink3)">${clearanceList.length} SKU non-aktif &nbsp;·&nbsp; Nilai tertahan: <b style="color:var(--warn)">${fmtRp(clearanceList.reduce((s,r) => s + r.nilai, 0))}</b></div>
      </div>
      <button class="btn btn-sm" onclick="gotoPage('clearance',null)" style="display:inline-flex;align-items:center;gap:5px;font-size:12px"><i class="ti ti-tag"></i> Lihat Clearance Monitor</button>
    </div>` : ''}`;
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

  return `
    <div style="padding:10px 14px">
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;padding:10px 14px;
                  background:var(--cream2);border:2px dashed var(--ink3);border-radius:4px">
        <div style="font-size:13px">
          <span style="color:var(--ink3)">Lead Time:</span>
          <b style="color:var(--ink);margin-left:4px">${sup.lead_time} hari</b>
        </div>
        <div style="font-size:13px">
          <span style="color:var(--ink3)">Safety Stock:</span>
          <b style="color:var(--ink2);margin-left:4px">${sup.buffer_hari} hari buffer</b>
        </div>
        <div style="font-size:13px">
          <span style="color:var(--ink3)">Min Order:</span>
          <b style="color:var(--ink);margin-left:4px">${sup.min_order} pcs</b>
        </div>
        <div style="font-size:13px">
          <span style="color:var(--ink3)">Kelipatan:</span>
          <b style="color:var(--ink);margin-left:4px">× ${sup.kelipatan}</b>
        </div>
        ${sup.budget ? `
          <div style="font-size:13px;margin-left:auto">
            <span style="color:var(--ink3)">Budget:</span>
            <b style="color:var(--warn);margin-left:4px">${fmtRp(sup.budget)}</b>
            <span style="margin-left:8px;color:${budgetSisa >= 0 ? 'var(--ok)' : 'var(--danger)'}">
              ${budgetSisa >= 0 ? '(Sisa ' + fmtRp(budgetSisa) + ')' : '(Over ' + fmtRp(Math.abs(budgetSisa)) + ')'}
            </span>
          </div>
        ` : ''}
        ${sup.catatan ? `<div style="width:100%;font-size:11px;color:var(--ink3)"><i class="ti ti-note"></i> ${sup.catatan}</div>` : ''}
        ${trenSummary}
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px;font-size:11px;color:var(--ink3)">
        <span>Cover: <span style="color:var(--danger)">merah</span> = supply pendek, <span style="color:var(--warn)">kuning</span> = cukup, <span style="color:var(--ok)">hijau</span> = aman</span>
        <span>Tren: ↑ naik · ↓ turun · → stabil · ★ baru</span>
      </div>
    </div>
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Katalog</th>
            <th>Variant (SKU)</th>
            <th style="text-align:center">Prioritas</th>
            <th style="text-align:center">DoS</th>
            <th style="text-align:center">Tren</th>
            <th style="text-align:center">Sisa</th>
            <th style="text-align:center">Qty 14hr</th>
            <th style="text-align:center">Avg/hari</th>
            <th style="text-align:center;color:var(--warn)">Order</th>
            <th style="text-align:right;color:var(--ok)">Nilai HPP</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((r, i) => `
            <tr style="${r.prioritas === 'SEGERA' ? 'background:rgba(224,82,82,0.05)' : r.prioritas === 'TUNDA' ? 'opacity:0.6' : ''}">
              <td style="color:var(--ink3);font-size:11px">${i + 1}</td>
              <td style="color:var(--ink3)">${r.katalog}</td>
              <td><b style="color:var(--ink)">${r.sku}</b></td>
              <td style="text-align:center">${prioritasBadge(r.prioritas)}</td>
              <td style="text-align:center">${dosBadge(r.dos, sup.lead_time)}</td>
              <td style="text-align:center">${trenIcon(r.tren)}</td>
              <td style="text-align:center">${sisaBadge(r.sisa_stok)}</td>
              <td style="text-align:center">${r.qty14}</td>
              <td style="text-align:center;color:var(--ink3)">${r.avg_harian}</td>
              <td style="text-align:center;font-weight:700;font-size:16px;color:var(--warn)">${r.qty_order}</td>
              <td style="text-align:right;font-weight:600;color:${r.nilai ? 'var(--ok)' : 'var(--ink3)'}">
                ${fmtRp(r.nilai)}
              </td>
            </tr>
          `).join('')}
          <tr style="font-weight:700;border-top:2px solid var(--ink3)">
            <td colspan="9" style="color:var(--ink2)">Total</td>
            <td style="text-align:center;font-size:18px;color:var(--warn)">${totalQty}</td>
            <td style="text-align:right;color:var(--ok);font-size:15px">${fmtRp(totalNilai)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
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
