// ─── PRODUK-TERJUAL.JS v1 ─────────────────────────────────────
// Rekap penjualan per SKU dengan filter: tanggal range, bulan, SKU induk, supplier

document.getElementById('page-produk-terjual').innerHTML = `

  <!-- TOP BAR: header + metrics — flex-shrink:0 via CSS #pt-top-bar -->
  <div id="pt-top-bar">

  <!-- HEADER + TOMBOL KEMBALI -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
    <div>
      <button class="btn btn-sm" onclick="gotoPage('jurnal-penjualan',null)" style="margin-bottom:6px">
        <i class="ti ti-arrow-left"></i> Kembali
      </button>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <div style="position:relative">
        <button class="btn btn-sm" id="pt-filter-btn" onclick="ptToggleFilter()" style="display:flex;align-items:center;gap:5px">
          <i class="ti ti-filter"></i> Filter
          <span id="pt-filter-badge" style="display:none;background:var(--accent);color:#fff;font-size:10px;padding:1px 5px;border-radius:10px;font-weight:700">!</span>
          <span style="font-size:10px">&#9662;</span>
        </button>

        <!-- MODAL FILTER — BERGAYA STOK PRODUK -->
        <div id="pt-filter-panel" style="display:none;position:absolute;top:calc(100% + 4px);left:0;z-index:300;background:#1c1a14;color:#f0ece0;min-width:200px;box-shadow:3px 4px 0 rgba(0,0,0,0.25);border-radius:2px">

          <!-- Bulan -->
          <div id="pt-mi-bulan" onclick="ptOpenSub('bulan',event)"
            style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08)"
            onmouseenter="this.style.background='rgba(255,255,255,0.08)'" onmouseleave="this.style.background=''">
            <span><i class="ti ti-calendar" style="font-size:12px;margin-right:6px"></i>Bulan <span id="badge-pt-bulan" style="font-size:10px;color:rgba(255,255,255,0.5)"></span></span>
            <i class="ti ti-chevron-right" style="font-size:11px;opacity:0.5"></i>
          </div>

          <!-- Tanggal Range -->
          <div id="pt-mi-tgl" onclick="ptOpenSub('tgl',event)"
            style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08)"
            onmouseenter="this.style.background='rgba(255,255,255,0.08)'" onmouseleave="this.style.background=''">
            <span><i class="ti ti-calendar-stats" style="font-size:12px;margin-right:6px"></i>Tanggal <span id="badge-pt-tgl" style="font-size:10px;color:rgba(255,255,255,0.5)"></span></span>
            <i class="ti ti-chevron-right" style="font-size:11px;opacity:0.5"></i>
          </div>

          <!-- SKU Induk -->
          <div id="pt-mi-katalog" onclick="ptOpenSub('katalog',event)"
            style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08)"
            onmouseenter="this.style.background='rgba(255,255,255,0.08)'" onmouseleave="this.style.background=''">
            <span><i class="ti ti-tag" style="font-size:12px;margin-right:6px"></i>SKU Induk <span id="badge-pt-katalog" style="font-size:10px;color:rgba(255,255,255,0.5)"></span></span>
            <i class="ti ti-chevron-right" style="font-size:11px;opacity:0.5"></i>
          </div>

          <!-- Supplier -->
          <div id="pt-mi-supplier" onclick="ptOpenSub('supplier',event)"
            style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08)"
            onmouseenter="this.style.background='rgba(255,255,255,0.08)'" onmouseleave="this.style.background=''">
            <span><i class="ti ti-user" style="font-size:12px;margin-right:6px"></i>Supplier <span id="badge-pt-supplier" style="font-size:10px;color:rgba(255,255,255,0.5)"></span></span>
            <i class="ti ti-chevron-right" style="font-size:11px;opacity:0.5"></i>
          </div>

          <!-- Reset -->
          <div onclick="ptResetFilter()"
            style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:6px;color:rgba(255,100,100,0.9)"
            onmouseenter="this.style.background='rgba(255,255,255,0.08)'" onmouseleave="this.style.background=''">
            <i class="ti ti-x" style="font-size:12px"></i> Reset Filter
          </div>
        </div>

        <!-- SUBMENU: Bulan -->
        <div id="dd-pt-bulan" style="display:none;position:fixed;z-index:9999;background:#1c1a14;color:#f0ece0;min-width:180px;box-shadow:3px 4px 0 rgba(0,0,0,0.25)">
          <div onclick="ptSetBulan('')" style="padding:9px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.08)"
            onmouseenter="this.style.background='rgba(255,255,255,0.1)'" onmouseleave="this.style.background=''">Semua Bulan</div>
          <div id="pt-bulan-options"></div>
        </div>

        <!-- SUBMENU: Tanggal -->
        <div id="dd-pt-tgl" style="display:none;position:fixed;z-index:9999;background:#1c1a14;color:#f0ece0;min-width:240px;padding:12px;box-shadow:3px 4px 0 rgba(0,0,0,0.25)">
          <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:8px;text-transform:uppercase">Dari</div>
          <input type="date" id="pt-tgl-dari" style="width:100%;font-family:var(--f);font-size:13px;padding:5px 8px;background:#2a2820;color:#f0ece0;border:1px solid rgba(255,255,255,0.2);margin-bottom:10px;box-sizing:border-box;-webkit-appearance:none;appearance:none;outline:none;cursor:pointer" onchange="ptApplyTgl()">
          <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:8px;text-transform:uppercase">Sampai</div>
          <input type="date" id="pt-tgl-sampai" style="width:100%;font-family:var(--f);font-size:13px;padding:5px 8px;background:#2a2820;color:#f0ece0;border:1px solid rgba(255,255,255,0.2);box-sizing:border-box;-webkit-appearance:none;appearance:none;outline:none;cursor:pointer" onchange="ptApplyTgl()">
        </div>

        <!-- SUBMENU: SKU Induk -->
        <div id="dd-pt-katalog" style="display:none;position:fixed;z-index:9999;background:#1c1a14;color:#f0ece0;min-width:180px;max-height:240px;overflow-y:auto;box-shadow:3px 4px 0 rgba(0,0,0,0.25)">
          <div onclick="ptSetKatalog('')" style="padding:9px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.08)"
            onmouseenter="this.style.background='rgba(255,255,255,0.1)'" onmouseleave="this.style.background=''">Semua SKU Induk</div>
          <div id="pt-katalog-options"></div>
        </div>

        <!-- SUBMENU: Supplier -->
        <div id="dd-pt-supplier" style="display:none;position:fixed;z-index:9999;background:#1c1a14;color:#f0ece0;min-width:180px;max-height:240px;overflow-y:auto;box-shadow:3px 4px 0 rgba(0,0,0,0.25)">
          <div onclick="ptSetSupplier('')" style="padding:9px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.08)"
            onmouseenter="this.style.background='rgba(255,255,255,0.1)'" onmouseleave="this.style.background=''">Semua Supplier</div>
          <div id="pt-supplier-options"></div>
        </div>
      </div>

      <button class="btn btn-sm" onclick="loadProdukTerjual()">
        <i class="ti ti-refresh"></i> Refresh
      </button>
      <button class="btn btn-sm" onclick="ptExportCSV()">
        <i class="ti ti-download"></i> Export CSV
      </button>
    </div>
  </div>

  <!-- SUMMARY METRICS -->
  <div class="metrics" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));margin:0">
    <div class="metric">
      <div class="m-label">Total SKU Terjual</div>
      <div class="m-value" id="pt-total-sku">—</div>
      <div class="m-delta">jenis SKU unik</div>
    </div>
    <div class="metric">
      <div class="m-label">Total Qty</div>
      <div class="m-value" id="pt-total-qty">—</div>
      <div class="m-delta">total item terjual</div>
    </div>
    <div class="metric">
      <div class="m-label">Total Omset</div>
      <div class="m-value" id="pt-total-omset">—</div>
      <div class="m-delta">dari transaksi</div>
    </div>
  </div>

  </div><!-- /#pt-top-bar -->

  <!-- TABEL — card flex:1 via CSS #page-produk-terjual .card -->
  <div class="card">
    <div class="card-title"><i class="ti ti-chart-bar"></i> Produk Terjual</div>
    <div id="pt-tbl-wrap"><table class="tbl" style="min-width:520px">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Katalog</th>
          <th>Supplier</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Omset</th>
          <th style="text-align:center">% Omset</th>
        </tr>
      </thead>
      <tbody id="pt-tbody">
        <tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table></div>
    <div id="pt-footer-wrap"><div id="pt-footer" style="font-size:12px;color:var(--ink3);text-align:right"></div></div>
  </div>
`;

// ─── STATE ───────────────────────────────────────────────────
var _ptJpData      = [];  // semua jurnal_penjualan
var _ptProdukMap   = {};  // sku → { katalog, boss/supplier }
var _ptFilterBulan    = '';
var _ptFilterTglDari  = '';
var _ptFilterTglSampai= '';
var _ptFilterKatalog  = '';
var _ptFilterSupplier = '';
var _ptRendered    = [];

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadProdukTerjual() {
  var tbody = document.getElementById('pt-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';

  try {
    const [jpData, produkData] = await Promise.all([
      dbGet('jurnal_penjualan', '&order=tanggal.desc'),
      dbGet('produk', '&order=katalog.asc')
    ]);

    _ptJpData    = jpData    || [];
    _ptProdukMap = {};
    (produkData || []).forEach(function(p) {
      var key = (p.sku_variasi || p.sku || '').toUpperCase();
      if (key) _ptProdukMap[key] = { katalog: p.katalog || '—', supplier: p.boss || '—' };
    });

    // Build filter options
    ptBuildFilterOptions();
    ptRender();

  } catch(err) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="color:var(--danger)">Error: ' + err.message + '</td></tr>';
  }
}

// ─── BUILD FILTER OPTIONS ─────────────────────────────────────
function ptBuildFilterOptions() {
  // Bulan — dari data JP
  var bulanSet = {};
  _ptJpData.forEach(function(r) {
    if (r.tanggal) {
      var ym = String(r.tanggal).slice(0,7);
      bulanSet[ym] = true;
    }
  });
  var bulanList = Object.keys(bulanSet).sort().reverse();
  var bulanOpts = document.getElementById('pt-bulan-options');
  if (bulanOpts) {
    bulanOpts.innerHTML = bulanList.map(function(ym) {
      var [y,m] = ym.split('-');
      var label = new Date(y, parseInt(m)-1).toLocaleDateString('id-ID', {month:'long', year:'numeric'});
      return '<div onclick="ptSetBulan(\''+ym+'\')" style="padding:9px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.08)" '+
        'onmouseenter="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseleave="this.style.background=\'\'">' + label + '</div>';
    }).join('');
  }

  // SKU Induk (katalog unik)
  var katSet = {};
  _ptJpData.forEach(function(r) {
    var key   = (r.sku || '').toUpperCase();
    var prod  = _ptProdukMap[key];
    var kat   = prod ? prod.katalog : '—';
    if (kat && kat !== '—') katSet[kat] = true;
  });
  var katOpts = document.getElementById('pt-katalog-options');
  if (katOpts) {
    katOpts.innerHTML = Object.keys(katSet).sort().map(function(k) {
      return '<div onclick="ptSetKatalog(\''+k.replace(/'/g,"\\'")+'\''+')" style="padding:9px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.08)" '+
        'onmouseenter="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseleave="this.style.background=\'\'">' + k + '</div>';
    }).join('');
  }

  // Supplier (boss unik)
  var supSet = {};
  _ptJpData.forEach(function(r) {
    var key  = (r.sku || '').toUpperCase();
    var prod = _ptProdukMap[key];
    var sup  = prod ? prod.supplier : '—';
    if (sup && sup !== '—') supSet[sup] = true;
  });
  var supOpts = document.getElementById('pt-supplier-options');
  if (supOpts) {
    supOpts.innerHTML = Object.keys(supSet).sort().map(function(s) {
      return '<div onclick="ptSetSupplier(\''+s.replace(/'/g,"\\'")+'\''+')" style="padding:9px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.08)" '+
        'onmouseenter="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseleave="this.style.background=\'\'">' + s + '</div>';
    }).join('');
  }
}

// ─── RENDER ──────────────────────────────────────────────────
function ptRender() {
  var tbody = document.getElementById('pt-tbody');
  if (!tbody) return;

  // Filter data
  var filtered = _ptJpData.filter(function(r) {
    var tgl = String(r.tanggal || '').slice(0,10);
    if (_ptFilterBulan     && !tgl.startsWith(_ptFilterBulan))          return false;
    if (_ptFilterTglDari   && tgl < _ptFilterTglDari)                    return false;
    if (_ptFilterTglSampai && tgl > _ptFilterTglSampai)                  return false;
    var key  = (r.sku || '').toUpperCase();
    var prod = _ptProdukMap[key] || {};
    if (_ptFilterKatalog  && (prod.katalog  || '') !== _ptFilterKatalog) return false;
    if (_ptFilterSupplier && (prod.supplier || '') !== _ptFilterSupplier) return false;
    return true;
  });

  // Group by SKU
  var skuMap = {};
  filtered.forEach(function(r) {
    var sku  = r.sku || '—';
    var key  = sku.toUpperCase();
    var prod = _ptProdukMap[key] || { katalog:'—', supplier:'—' };
    if (!skuMap[sku]) skuMap[sku] = { sku:sku, katalog:prod.katalog, supplier:prod.supplier, qty:0, omset:0 };
    skuMap[sku].qty   += (Number(r.qty)   || 0);
    skuMap[sku].omset += (Number(r.total) || 0);
  });

  var rows = Object.values(skuMap).sort(function(a,b){ return b.omset - a.omset; });
  var totalOmset = rows.reduce(function(s,r){ return s + r.omset; }, 0);
  var totalQty   = rows.reduce(function(s,r){ return s + r.qty; },   0);

  // Update metrics
  var elSku   = document.getElementById('pt-total-sku');
  var elQty   = document.getElementById('pt-total-qty');
  var elOmset = document.getElementById('pt-total-omset');
  if (elSku)   elSku.textContent   = rows.length + ' SKU';
  if (elQty)   elQty.textContent   = totalQty + ' item';
  if (elOmset) elOmset.textContent = 'Rp' + Math.round(totalOmset).toLocaleString('id-ID');

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Tidak ada data</td></tr>';
    document.getElementById('pt-footer').textContent = '';
    _ptRendered = [];
    return;
  }

  _ptRendered = rows;
  tbody.innerHTML = rows.map(function(r) {
    var pct = totalOmset > 0 ? (r.omset / totalOmset * 100).toFixed(1) : 0;
    return '<tr>' +
      '<td style="font-weight:600;color:var(--accent)">' + r.sku + '</td>' +
      '<td>' + r.katalog + '</td>' +
      '<td style="color:var(--ink2)">' + r.supplier + '</td>' +
      '<td style="text-align:center;font-weight:600">' + r.qty + '</td>' +
      '<td style="text-align:right;font-weight:700;color:var(--ok)">Rp' + Math.round(r.omset).toLocaleString('id-ID') + '</td>' +
      '<td style="text-align:center">' +
        '<div style="display:flex;align-items:center;gap:4px;justify-content:center">' +
          '<div style="width:40px;background:var(--cream2);height:4px;border-radius:2px;overflow:hidden">' +
            '<div style="width:'+pct+'%;height:100%;background:var(--ok)"></div>' +
          '</div>' +
          '<span style="font-size:11px;color:var(--ink3)">'+pct+'%</span>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');

  document.getElementById('pt-footer').textContent = rows.length + ' SKU ditampilkan dari ' + filtered.length + ' transaksi';

  // Re-render rough UI SETELAH data selesai dirender (card sudah punya tinggi yang benar)
  requestAnimationFrame(function() {
    if (typeof rerenderUI === 'function') {
      rerenderUI(document.getElementById('page-produk-terjual'));
    }
  });
}

// ─── FILTER PANEL ────────────────────────────────────────────
var _ptActiveSub = null;

function ptToggleFilter() {
  var panel = document.getElementById('pt-filter-panel');
  if (!panel) return;
  var isOpen = panel.style.display !== 'none';
  ptCloseAllSub();
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(function() {
      document.addEventListener('click', ptCloseOutside, { once: true });
    }, 50);
  }
}

function ptCloseOutside(e) {
  var panel = document.getElementById('pt-filter-panel');
  var btn   = document.getElementById('pt-filter-btn');
  if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
    panel.style.display = 'none';
    ptCloseAllSub();
  }
}

function ptCloseAllSub() {
  ['bulan','tgl','katalog','supplier'].forEach(function(s) {
    var el = document.getElementById('dd-pt-' + s);
    if (el) el.style.display = 'none';
  });
  _ptActiveSub = null;
}

function ptOpenSub(sub, e) {
  if (e) e.stopPropagation();
  var dd = document.getElementById('dd-pt-' + sub);
  if (!dd) return;
  // Tutup sub lain
  ['bulan','tgl','katalog','supplier'].forEach(function(s) {
    if (s !== sub) { var el = document.getElementById('dd-pt-'+s); if(el) el.style.display='none'; }
  });
  if (dd.style.display !== 'none') { dd.style.display = 'none'; return; }

  // Tampil dulu untuk ukur lebar
  dd.style.display  = 'block';
  dd.style.left     = '-9999px';
  dd.style.top      = '-9999px';

  var panel    = document.getElementById('pt-filter-panel');
  var rect     = panel ? panel.getBoundingClientRect() : { left:0, right:200, top:100, bottom:300 };
  var ddW      = dd.offsetWidth  || 200;
  var ddH      = dd.offsetHeight || 200;
  var vw       = window.innerWidth;
  var vh       = window.innerHeight;

  // Coba kiri dulu, fallback kanan, fallback di bawah (HP portrait)
  var leftPos, topPos;

  if (rect.left - ddW - 4 >= 4) {
    // Cukup ruang di kiri
    leftPos = rect.left - ddW - 4;
    topPos  = rect.top;
  } else if (rect.right + ddW + 4 <= vw) {
    // Cukup ruang di kanan
    leftPos = rect.right + 4;
    topPos  = rect.top;
  } else {
    // HP portrait: tampil di bawah panel, full width
    leftPos = Math.max(4, rect.left);
    topPos  = rect.bottom + 4;
    dd.style.width = Math.min(ddW, vw - 8) + 'px';
  }

  // Pastikan tidak keluar bawah layar
  if (topPos + ddH > vh - 8) topPos = Math.max(4, vh - ddH - 8);

  dd.style.left = leftPos + 'px';
  dd.style.top  = topPos  + 'px';
}

function ptUpdateBadge() {
  var hasBulan  = !!_ptFilterBulan;
  var hasTgl    = !!_ptFilterTglDari || !!_ptFilterTglSampai;
  var hasKat    = !!_ptFilterKatalog;
  var hasSup    = !!_ptFilterSupplier;
  var badge     = document.getElementById('pt-filter-badge');
  if (badge) badge.style.display = (hasBulan||hasTgl||hasKat||hasSup) ? 'inline' : 'none';

  var bBulan = document.getElementById('badge-pt-bulan');
  var bTgl   = document.getElementById('badge-pt-tgl');
  var bKat   = document.getElementById('badge-pt-katalog');
  var bSup   = document.getElementById('badge-pt-supplier');
  if (bBulan) bBulan.textContent = _ptFilterBulan    ? '✓' : '';
  if (bTgl)   bTgl.textContent   = hasTgl             ? '✓' : '';
  if (bKat)   bKat.textContent   = _ptFilterKatalog  ? '✓' : '';
  if (bSup)   bSup.textContent   = _ptFilterSupplier ? '✓' : '';
}

function ptSetBulan(val) {
  _ptFilterBulan = val;
  ptCloseAllSub();
  ptUpdateBadge();
  ptRender();
}
function ptApplyTgl() {
  _ptFilterTglDari   = (document.getElementById('pt-tgl-dari')   ||{}).value || '';
  _ptFilterTglSampai = (document.getElementById('pt-tgl-sampai') ||{}).value || '';
  ptUpdateBadge();
  ptRender();
}
function ptSetKatalog(val) {
  _ptFilterKatalog = val;
  ptCloseAllSub();
  ptUpdateBadge();
  ptRender();
}
function ptSetSupplier(val) {
  _ptFilterSupplier = val;
  ptCloseAllSub();
  ptUpdateBadge();
  ptRender();
}
function ptResetFilter() {
  _ptFilterBulan = _ptFilterTglDari = _ptFilterTglSampai = _ptFilterKatalog = _ptFilterSupplier = '';
  var dari   = document.getElementById('pt-tgl-dari');
  var sampai = document.getElementById('pt-tgl-sampai');
  if (dari)   dari.value   = '';
  if (sampai) sampai.value = '';
  ptCloseAllSub();
  document.getElementById('pt-filter-panel').style.display = 'none';
  ptUpdateBadge();
  ptRender();
}

// ─── EXPORT CSV ──────────────────────────────────────────────
function ptExportCSV() {
  if (!_ptRendered || !_ptRendered.length) { alert('Tidak ada data untuk diekspor'); return; }
  var headers = ['SKU','Katalog','Supplier','Qty Terjual','Total Omset'];
  var rows    = _ptRendered.map(function(r){ return [r.sku, r.katalog, r.supplier, r.qty, r.omset]; });
  exportCSV('zenoot-produk-terjual.csv', headers, rows);
}

// ─── INIT ────────────────────────────────────────────────────
loadProdukTerjual();


// ─── HIDE-ON-SCROLL landscape: pt-top-bar collapse ───────────
(function() {
  var _inited = false;
  function _init() {
    if (_inited) return;
    var wrap = document.getElementById('pt-tbl-wrap');
    if (!wrap) return;
    _inited = true;
    var mq = window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: landscape)');
    wrap.addEventListener('scroll', function() {
      if (!mq.matches) return;
      var bar = document.getElementById('pt-top-bar');
      if (!bar) return;
      bar.classList.toggle('landscape-collapsed', wrap.scrollTop > 40);
    }, { passive: true });
  }
  setTimeout(_init, 300);
  var _orig = window.gotoPage;
  if (_orig) {
    window.gotoPage = function(page, btn) {
      _orig(page, btn);
      if (page === 'produk-terjual') {
        setTimeout(function() {
          var bar = document.getElementById('pt-top-bar');
          if (bar) bar.classList.remove('landscape-collapsed');
          _init();
        }, 80);
      }
    };
  }
})();