// ─── CLEARANCE.JS — monitor SKU non-aktif yang masih ada stok ──
// Filter: nested submenu (Kategori / Supplier / Katalog) — pola stok.js
// Navigasi: dari Re-Stock header atau Summary

document.getElementById('page-clearance').innerHTML = `
  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span><i class="ti ti-tag"></i> Clearance Monitor</span>

        <!-- Filter button — nested submenu -->
        <div style="position:relative">
          <button class="btn btn-sm" id="cl-filter-btn" onclick="clToggleFilterAll()"
            style="min-width:90px;text-align:left;padding-right:24px;display:inline-flex;align-items:center;gap:6px">
            <i class="ti ti-adjustments-horizontal"></i>
            <span id="cl-filter-label">Filter</span>
            <span id="cl-filter-arrow" style="position:absolute;right:8px;font-size:10px">&#9662;</span>
          </button>

          </div>

        <!-- Reset -->
        <button class="btn btn-sm" id="cl-reset-btn" onclick="clResetFilter()"
          style="display:none;align-items:center;gap:4px;font-size:12px;border-color:var(--danger);color:var(--danger)">
          <i class="ti ti-x"></i> Reset Filter
        </button>
      </div>

      <!-- Kanan: kembali -->
      <button class="btn btn-sm" onclick="gotoPage('restock',null)" style="font-size:12px">
        <i class="ti ti-arrow-left"></i> Kembali ke Re-Stock
      </button>
    </div>

    <!-- Metric strip — flex-shrink:0 via CSS #cl-metrics-strip -->
    <div id="cl-metrics-strip" class="metrics" style="grid-template-columns:repeat(3,1fr);margin:0">
      <div class="metric">
        <div class="m-label">SKU Non-Aktif</div>
        <div class="m-value" id="cl-total-sku">—</div>
        <div class="m-delta">masih ada stok</div>
      </div>
      <div class="metric">
        <div class="m-label">Total Sisa Pcs</div>
        <div class="m-value" id="cl-total-pcs">—</div>
        <div class="m-delta">hasil filter</div>
      </div>
      <div class="metric">
        <div class="m-label">Nilai Stok Tertahan</div>
        <div class="m-value" id="cl-total-nilai">—</div>
        <div class="m-delta">HPP × sisa</div>
      </div>
    </div>

    <!-- Tabel — flex:1 scroll internal via CSS #cl-tbl-wrap -->
    <div id="cl-tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th onclick="clSort('kat')" style="cursor:pointer;user-select:none">Kategori <span id="cl-sort-kat">↕</span></th>
            <th>Katalog</th>
            <th onclick="clSort('sku')" style="cursor:pointer;user-select:none">SKU <span id="cl-sort-sku">↕</span></th>
            <th>Boss</th>
            <th onclick="clSort('sisa')" style="cursor:pointer;user-select:none;text-align:center">Sisa <span id="cl-sort-sisa">↕</span></th>
            <th style="text-align:center">Terjual 14hr</th>
            <th style="text-align:right">HPP/pcs</th>
            <th onclick="clSort('nilai')" style="cursor:pointer;user-select:none;text-align:right">Nilai Stok <span id="cl-sort-nilai">↕</span></th>
          </tr>
        </thead>
        <tbody id="cl-tbody">
          <tr><td colspan="8" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="cl-footer-wrap"><div id="cl-footer" style="font-size:12px;color:var(--ink3);text-align:right"></div></div>
  </div>
`;

// Submenu panels — mount ke body saat pertama dibuka
let _clSubPanels = {};

setTimeout(() => {
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-clearance'));
  loadClearance();
}, 80);

// ─── STATE ───────────────────────────────────────────────────
let _clAllData    = [];
let _clFilterKat    = '';
let _clFilterSup    = '';
let _clFilterKatalog = '';
let _clSort       = { col: 'nilai', dir: 'desc' };

const _clKatLabel = {
  discontinued : '🚫 Discontinued',
  seasonal     : '🌙 Seasonal',
  clearance    : '🏷️ Clearance'
};

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadClearance() {
  const tbody = document.getElementById('cl-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="color:var(--ink3);font-style:italic"><i class="ti ti-loader"></i> Memuat data...</td></tr>';

  try {
    const today = new Date();
    const d14   = new Date(today);
    d14.setDate(d14.getDate() - 13);
    const dari14 = d14.toISOString().slice(0, 10);

    const [produkAll, stokRaw, jpAllRaw, jp14Raw] = await Promise.all([
      dbGet('produk', '&order=katalog.asc'),
      dbGet('stok'),
      dbGet('jurnal_penjualan', '&select=sku,qty'),
      dbGet('jurnal_penjualan', '&select=sku,qty&tanggal=gte.' + dari14)
    ]);

    // Hitung sisa stok per SKU
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
    const qty14Map = {};
    (jp14Raw || []).forEach(r => {
      const k = (r.sku || '').trim().toUpperCase();
      if (k) qty14Map[k] = (qty14Map[k] || 0) + (r.qty || 0);
    });

    // Build clearance list — hanya non-aktif yang sisa > 0
    _clAllData = [];
    produkAll.forEach(p => {
      const kat = (p.kategori_produk || 'aktif').toLowerCase();
      if (kat === 'aktif') return;

      const skuKey = (p.sku_variasi || p.sku || '').trim().toUpperCase();
      if (!skuKey) return;

      const sisa = (masukMap[skuKey] || 0) - (keluarMap[skuKey] || 0);
      if (sisa <= 0) return;

      _clAllData.push({
        kat,
        katalog : p.katalog || '—',
        sku     : skuKey,
        boss    : p.boss || '—',
        sisa,
        qty14   : qty14Map[skuKey] || 0,
        hpp     : p.hpp || 0,
        nilai   : sisa * (p.hpp || 0)
      });
    });

    clRenderAll();

  } catch(err) {
    const tbody = document.getElementById('cl-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger)">⚠️ Error: ${err.message}</td></tr>`;
    console.error('[clearance]', err);
  }
}

// ─── RENDER ──────────────────────────────────────────────────
function clRenderAll() {
  let data = _clAllData.filter(r => {
    if (_clFilterKat     && r.kat     !== _clFilterKat)     return false;
    if (_clFilterSup     && r.boss    !== _clFilterSup)     return false;
    if (_clFilterKatalog && r.katalog !== _clFilterKatalog) return false;
    return true;
  });

  // Sort
  const { col, dir } = _clSort;
  data = [...data].sort((a, b) => {
    let va = a[col]; let vb = b[col];
    if (typeof va === 'string') {
      va = va.toLowerCase(); vb = vb.toLowerCase();
      return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return dir === 'asc' ? va - vb : vb - va;
  });

  const fmtRp = v => v ? 'Rp' + Number(v).toLocaleString('id-ID') : '—';
  const tbody  = document.getElementById('cl-tbody');
  const footer = document.getElementById('cl-footer');

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="color:var(--ink3);font-style:italic;padding:20px">Tidak ada SKU yang cocok dengan filter.</td></tr>';
    if (footer) footer.textContent = '';
    clUpdateMetrics(data);
    clUpdateSortIcons();
    clUpdateFilterLabel();
    return;
  }

  tbody.innerHTML = data.map(r => {
    const katLabel = _clKatLabel[r.kat] || r.kat;
    return `<tr style="opacity:0.85">
      <td style="font-size:11px;white-space:nowrap">${katLabel}</td>
      <td style="color:var(--ink3)">${r.katalog}</td>
      <td><b style="color:var(--ink2)">${r.sku}</b></td>
      <td style="color:var(--ink3);font-size:12px">${r.boss}</td>
      <td style="text-align:center;font-weight:700;color:${r.sisa <= 3 ? 'var(--warn)' : 'var(--ink2)'}">${r.sisa}</td>
      <td style="text-align:center;color:${r.qty14 > 0 ? 'var(--ok)' : 'var(--ink3)'}">${r.qty14 || '—'}</td>
      <td style="text-align:right;color:var(--ink3);font-size:12px">${fmtRp(r.hpp)}</td>
      <td style="text-align:right;font-weight:700;color:var(--warn)">${fmtRp(r.nilai)}</td>
    </tr>`;
  }).join('');

  const totalPcs   = data.reduce((s, r) => s + r.sisa,  0);
  const totalNilai = data.reduce((s, r) => s + r.nilai, 0);
  tbody.innerHTML += `
    <tr style="font-weight:700;border-top:2px solid var(--ink3)">
      <td colspan="4" style="color:var(--ink2)">Total</td>
      <td style="text-align:center;color:var(--ink2)">${totalPcs}</td>
      <td></td><td></td>
      <td style="text-align:right;color:var(--warn)">${fmtRp(totalNilai)}</td>
    </tr>`;

  if (footer) footer.textContent = `Menampilkan ${data.length} dari ${_clAllData.length} SKU`;
  clUpdateMetrics(data);
  clUpdateSortIcons();
  clUpdateFilterLabel();
}

function clUpdateMetrics(data) {
  const fmtRp = v => 'Rp' + Number(v || 0).toLocaleString('id-ID');
  const el = id => document.getElementById(id);
  if (el('cl-total-sku'))   el('cl-total-sku').textContent   = data.length + ' SKU';
  if (el('cl-total-pcs'))   el('cl-total-pcs').textContent   = data.reduce((s,r) => s + r.sisa, 0).toLocaleString('id-ID') + ' pcs';
  if (el('cl-total-nilai')) el('cl-total-nilai').textContent = fmtRp(data.reduce((s,r) => s + r.nilai, 0));
}

// ─── SORT ────────────────────────────────────────────────────
function clSort(col) {
  if (_clSort.col === col) _clSort.dir = _clSort.dir === 'asc' ? 'desc' : 'asc';
  else { _clSort.col = col; _clSort.dir = col === 'nilai' || col === 'sisa' ? 'desc' : 'asc'; }
  clRenderAll();
}
function clUpdateSortIcons() {
  ['kat','sku','sisa','nilai'].forEach(c => {
    const el = document.getElementById('cl-sort-' + c);
    if (!el) return;
    el.textContent = _clSort.col === c ? (_clSort.dir === 'asc' ? '↑' : '↓') : '↕';
    el.style.color = _clSort.col === c ? 'var(--accent)' : 'var(--ink3)';
  });
}

// ─── FILTER LABEL & BADGE ────────────────────────────────────
function clUpdateFilterLabel() {
  const parts = [];
  if (_clFilterKat)     parts.push(_clFilterKat);
  if (_clFilterSup)     parts.push(_clFilterSup);
  if (_clFilterKatalog) parts.push(_clFilterKatalog);

  const lbl = document.getElementById('cl-filter-label');
  if (lbl) lbl.textContent = parts.length ? parts.join(', ') : 'Filter';

  const resetBtn = document.getElementById('cl-reset-btn');
  if (resetBtn) resetBtn.style.display = parts.length ? 'inline-flex' : 'none';

  // Badge per submenu item
  const bKat     = document.getElementById('cl-badge-kat');
  const bSup     = document.getElementById('cl-badge-sup');
  const bKatalog = document.getElementById('cl-badge-katalog');
  if (bKat)     bKat.textContent     = _clFilterKat     ? '· ' + _clFilterKat     : '';
  if (bSup)     bSup.textContent     = _clFilterSup     ? '· ' + _clFilterSup     : '';
  if (bKatalog) bKatalog.textContent = _clFilterKatalog ? '· ' + _clFilterKatalog : '';
}

// ─── NESTED SUBMENU SYSTEM ───────────────────────────────────
function clToggleFilterAll() {
  let menu = document.getElementById('cl-filter-menu');
  if (!menu) {
    // Build menu, mount ke body (fixed positioning — tidak terpotong card)
    menu = document.createElement('div');
    menu.id = 'cl-filter-menu';
    menu.style.cssText = 'display:none;position:fixed;z-index:99999;'
      + 'background:var(--cream2);border-radius:10px;min-width:180px;'
      + 'box-shadow:0 8px 32px rgba(0,0,0,0.6),0 2px 8px rgba(0,0,0,0.4);padding:8px 6px';
    menu.innerHTML = ''
      + '<div style="font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;'
      + 'margin-bottom:6px;padding:0 8px;letter-spacing:.5px">Filter</div>'
      + ['kat','sup','katalog'].map(t => {
          const icons = { kat:'ti-tag', sup:'ti-user', katalog:'ti-box' };
          const titles = { kat:'Kategori', sup:'Supplier', katalog:'Katalog' };
          return `<div id="cl-mi-${t}" onclick="clOpenSub('${t}',event)"
            style="padding:9px 12px;cursor:pointer;font-size:13px;font-weight:500;border-radius:6px;
                   margin:1px 4px;display:flex;justify-content:space-between;align-items:center"
            onmouseover="this.style.background='var(--cream3)'" onmouseout="this.style.background=''">
            <span><i class="ti ${icons[t]}" style="font-size:12px;margin-right:6px"></i>${titles[t]}
              <span id="cl-badge-${t}" style="font-size:10px;color:var(--ink3)"></span></span>
            <span style="font-size:11px">›</span>
          </div>`;
        }).join('');
    document.body.appendChild(menu);
  }

  const isOpen = menu.style.display !== 'none';
  // Tutup semua submenu dulu
  ['kat','sup','katalog'].forEach(t => {
    const p = document.getElementById('cl-sub-' + t);
    if (p) p.style.display = 'none';
  });

  if (!isOpen) {
    const btn  = document.getElementById('cl-filter-btn');
    const rect = btn.getBoundingClientRect();
    menu.style.top  = (rect.bottom + 4) + 'px';
    menu.style.left = rect.left + 'px';
    menu.style.display = 'block';
    // Update badges setelah mount
    clUpdateFilterLabel();
    setTimeout(() => document.addEventListener('click', clCloseAllOutside), 50);
  } else {
    menu.style.display = 'none';
    document.removeEventListener('click', clCloseAllOutside);
  }
}

function clCloseAllOutside(e) {
  const menu = document.getElementById('cl-filter-menu');
  const btn  = document.getElementById('cl-filter-btn');
  const subs = ['cl-sub-kat','cl-sub-sup','cl-sub-katalog'].map(id => document.getElementById(id));

  const inMenu = menu && menu.contains(e.target);
  const inBtn  = btn  && btn.contains(e.target);
  const inSub  = subs.some(s => s && s.contains(e.target));
  const inMi   = ['cl-mi-kat','cl-mi-sup','cl-mi-katalog'].some(id => {
    const el = document.getElementById(id);
    return el && el.contains(e.target);
  });

  if (!inMenu && !inBtn && !inSub && !inMi) {
    if (menu) menu.style.display = 'none';
    subs.forEach(s => { if (s) s.style.display = 'none'; });
    document.removeEventListener('click', clCloseAllOutside);
  }
}

function clOpenSub(type, event) {
  event.stopPropagation();

  // Tutup submenu lain
  ['kat','sup','katalog'].filter(t => t !== type).forEach(t => {
    const p = document.getElementById('cl-sub-' + t);
    if (p) p.style.display = 'none';
  });

  const panelId = 'cl-sub-' + type;
  let panel = document.getElementById(panelId);

  // Build opsi
  let opsi = [];
  if (type === 'kat') {
    opsi = [
      { val: '', label: 'Semua Kategori' },
      { val: 'clearance',    label: '🏷️ Clearance'   },
      { val: 'discontinued', label: '🚫 Discontinued' },
      { val: 'seasonal',     label: '🌙 Seasonal'     }
    ];
  } else if (type === 'sup') {
    const uniq = [...new Set(_clAllData.map(r => r.boss).filter(Boolean))].sort();
    opsi = [{ val: '', label: 'Semua Supplier' }, ...uniq.map(v => ({ val: v, label: v }))];
  } else if (type === 'katalog') {
    const uniq = [...new Set(_clAllData.map(r => r.katalog).filter(k => k && k !== '—'))].sort();
    opsi = [{ val: '', label: 'Semua Katalog' }, ...uniq.map(v => ({ val: v, label: v }))];
  }

  const currVal = type === 'kat' ? _clFilterKat : type === 'sup' ? _clFilterSup : _clFilterKatalog;
  const innerHtml = '<div style="padding:6px 4px;max-height:260px;overflow-y:auto">'
    + '<div style="font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;'
    + 'margin-bottom:4px;padding:0 8px;letter-spacing:.5px">'
    + (type === 'kat' ? 'Kategori' : type === 'sup' ? 'Supplier' : 'Katalog')
    + '</div>'
    + opsi.map(o => {
        const active = o.val === currVal;
        return `<div onclick="clPilihFilter('${type}','${o.val.replace(/'/g,"\\'")}')"
          style="padding:9px 12px;cursor:pointer;font-size:13px;font-weight:${active?'700':'500'};
                 border-radius:6px;margin:1px 4px;background:${active?'var(--cream3)':'transparent'};
                 white-space:nowrap"
          onmouseover="this.style.background='var(--cream3)'"
          onmouseout="this.style.background='${active?'var(--cream3)':'transparent'}'">
          ${o.label}
          ${active ? ' <span style="color:var(--accent);font-size:11px">✓</span>' : ''}
        </div>`;
      }).join('')
    + '</div>';

  if (!panel) {
    panel = document.createElement('div');
    panel.id = panelId;
    panel.style.cssText = 'display:none;position:fixed;z-index:99999;'
      + 'background:var(--cream2);border-radius:10px;min-width:190px;'
      + 'box-shadow:0 8px 32px rgba(0,0,0,0.6),0 2px 8px rgba(0,0,0,0.4)';
    document.body.appendChild(panel);
  }
  panel.innerHTML = innerHtml;

  // Posisi: sejajar dengan menu item yang diklik
  const miEl = document.getElementById('cl-mi-' + type);
  const rect = miEl ? miEl.getBoundingClientRect() : { top: 100, right: 200 };
  panel.style.top  = rect.top + 'px';
  panel.style.left = (rect.right + 6) + 'px';
  panel.style.display = 'block';
}

function clPilihFilter(type, val) {
  if (type === 'kat')     _clFilterKat     = val;
  if (type === 'sup')     _clFilterSup     = val;
  if (type === 'katalog') _clFilterKatalog = val;

  // Tutup semua panel
  const menu = document.getElementById('cl-filter-menu');
  if (menu) menu.style.display = 'none';
  ['kat','sup','katalog'].forEach(t => {
    const p = document.getElementById('cl-sub-' + t);
    if (p) p.style.display = 'none';
  });
  document.removeEventListener('click', clCloseAllOutside);

  clRenderAll();
}

function clResetFilter() {
  _clFilterKat     = '';
  _clFilterSup     = '';
  _clFilterKatalog = '';
  clRenderAll();
}


// ─── SWIPE GESTURE — collapse cl-metrics-strip di landscape touch ─
(function() {
  var _mq = window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: landscape)');
  function _init() {
    if (!_mq.matches) return;
    var cardTitle = document.querySelector('#page-clearance .card-title');
    var strip     = document.getElementById('cl-metrics-strip');
    if (!strip) return;
    // Zona swipe: card-title + metrics-strip
    if (cardTitle) initSwipeCollapse(cardTitle, strip, 50);
    initSwipeCollapse(strip, strip, 50);
  }
  setTimeout(_init, 300);
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'clearance') return;
    setTimeout(function() {
      var strip = document.getElementById('cl-metrics-strip');
      if (strip) strip.classList.remove('landscape-collapsed');
      _init();
    }, 80);
  });
})();
// ─── AUTO-RELOAD SAAT NAVIGASI KE HALAMAN INI ────────────────
// Debounce 250ms: cegah double-fire jika menu diklik cepat
(function() {
  var _t = null;
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'clearance') return;
    clearTimeout(_t);
    _t = setTimeout(loadClearance, 250);
  });
})();
