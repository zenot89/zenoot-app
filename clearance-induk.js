// ─── MODAL-INDUK.JS — Modal per SKU Induk ─────────────────────
// Agregasi dari data yang sama dengan Clearance Monitor (clearance.js),
// tapi digabung per KATALOG (SKU induk), bukan per SKU varian.
// Dipicu dari tombol "Modal per SKU Induk" di header Clearance Monitor.

document.getElementById('page-clearance-induk').innerHTML = `
  <div class="card">
    <div class="card-title mi-header">
      <span><i class="ti ti-stack-2"></i> Modal per SKU Induk</span>
      <div class="mi-header-controls">
        <div class="mi-select-wrap">
          <i class="ti ti-filter"></i>
          <select id="mi-filter-sku" onchange="miFilterBySku(this.value)">
            <option value="">Semua SKU</option>
          </select>
        </div>
        <button class="btn btn-sm" onclick="gotoPage('clearance',null)" style="font-size:12px">
          <i class="ti ti-list-details"></i> Detail per SKU
        </button>
      </div>
    </div>

    <div id="mi-metrics-strip">
      <div class="mi-metric mi-metric-blue">
        <div class="mi-metric-icon"><i class="ti ti-package"></i></div>
        <div>
          <div class="m-label">Katalog Terdampak</div>
          <div class="m-value" id="mi-total-katalog">—</div>
          <div class="m-delta">SKU induk</div>
        </div>
      </div>
      <div class="mi-metric mi-metric-amber">
        <div class="mi-metric-icon"><i class="ti ti-layers-intersect"></i></div>
        <div>
          <div class="m-label">Total Varian SKU</div>
          <div class="m-value" id="mi-total-varian">—</div>
          <div class="m-delta">non-aktif/dead/zombie</div>
        </div>
      </div>
      <div class="mi-metric mi-metric-red">
        <div class="mi-metric-icon"><i class="ti ti-coin"></i></div>
        <div>
          <div class="m-label">Total Modal Tertahan</div>
          <div class="m-value" id="mi-total-nilai">—</div>
          <div class="m-delta">HPP × sisa (digabung)</div>
        </div>
      </div>
    </div>

    <div id="mi-split-wrap">
      <div id="mi-tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th onclick="miSort('sku')" style="cursor:pointer;user-select:none">SKU Induk / Variasi <span id="mi-sort-sku">⇅</span></th>
              <th onclick="miSort('sisa')" style="cursor:pointer;user-select:none;text-align:center">Qty <span id="mi-sort-sisa">⇅</span></th>
              <th onclick="miSort('nilai')" style="cursor:pointer;user-select:none;text-align:right">Modal <span id="mi-sort-nilai">⇅</span></th>
              <th>Supplier</th>
            </tr>
          </thead>
          <tbody id="mi-tbody">
            <tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>
          </tbody>
        </table>
      </div>

      <div id="mi-flash-wrap">
        <div class="mi-flash-title">
          <i class="ti ti-bolt"></i> Kandidat Flash Sale <span>(sisa ≥ 3 pcs)</span>
        </div>
        <div id="mi-flash-tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>SKU Induk / Variasi</th>
                <th style="text-align:center">Sisa</th>
                <th style="text-align:center">Status</th>
              </tr>
            </thead>
            <tbody id="mi-flash-tbody">
              <tr><td colspan="3" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>
            </tbody>
          </table>
        </div>
        <div id="mi-flash-footer" style="font-size:12px;color:var(--ink3);text-align:right;padding:10px 16px"></div>
      </div>
    </div>
    <div id="mi-footer-wrap"><div id="mi-footer" style="font-size:12px;color:var(--ink3);text-align:right"></div></div>
  </div>
`;

setTimeout(() => {
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-clearance-induk'));
}, 80);

// ─── STATE (cache biar sort gak perlu fetch ulang) ────────────
let _miGroupTotals = null;  // { katalog: {katalog,varian,sisa,nilai} }
let _miFlatRows    = null;  // [{katalog, sku, boss, sisa, hpp, nilai}] — KHUSUS clearance (non-aktif/dead/zombie), buat tabel kiri
let _miFlashRows   = null;  // [{katalog, sku, boss, sisa, hpp, nilai, vel}] — SEMUA SKU (semua velocity), buat panel Flash Sale
let _miSort        = { col: null, dir: null };  // null = netral (default: modal desc)
let _miSkuFilter   = '';    // '' = semua SKU

function miPopulateSkuFilter() {
  const sel = document.getElementById('mi-filter-sku');
  if (!sel || !_miGroupTotals) return;
  const skus = Object.keys(_miGroupTotals).sort((a, b) => a.localeCompare(b));
  const prev = _miSkuFilter;
  sel.innerHTML = '<option value="">Semua SKU</option>' +
    skus.map(k => `<option value="${k}">${k}</option>`).join('');
  // pertahankan pilihan sebelumnya kalau masih valid, kalau nggak reset ke "Semua SKU"
  if (prev && skus.includes(prev)) {
    sel.value = prev;
  } else {
    _miSkuFilter = '';
    sel.value = '';
  }
}

function miFilterBySku(val) {
  _miSkuFilter = val || '';
  miRenderTable();
}

function miSort(col) {
  if (_miSort.col === col) {
    if (_miSort.dir === 'asc') {
      _miSort.dir = 'desc';
    } else {
      // udah di posisi desc → balik ke netral
      _miSort.col = null;
      _miSort.dir = null;
    }
  } else {
    _miSort.col = col;
    _miSort.dir = 'asc';
  }
  miRenderTable();
}

function miUpdateSortIcons() {
  ['sku', 'sisa', 'nilai'].forEach(c => {
    const el = document.getElementById('mi-sort-' + c);
    if (!el) return;
    el.textContent = _miSort.col === c ? (_miSort.dir === 'asc' ? '▲' : '▼') : '⇅';
    el.style.color = _miSort.col === c ? 'var(--accent)' : 'var(--ink3)';
  });
}

// ─── METRICS STRIP (ikut filter SKU aktif, dipanggil tiap render) ──
function miUpdateMetrics() {
  const elKat = document.getElementById('mi-total-katalog');
  const elVar = document.getElementById('mi-total-varian');
  const elNil = document.getElementById('mi-total-nilai');
  if (!elKat || !_miGroupTotals || !_miFlatRows) return;
  const fmtRp = v => 'Rp' + Number(v || 0).toLocaleString('id-ID');

  const groupList = Object.values(_miGroupTotals).filter(g => !_miSkuFilter || g.katalog === _miSkuFilter);
  const flatList  = _miFlatRows.filter(r => !_miSkuFilter || r.katalog === _miSkuFilter);

  elKat.textContent = groupList.length.toLocaleString('id-ID');
  elVar.textContent = flatList.length.toLocaleString('id-ID');
  elNil.textContent = fmtRp(flatList.reduce((s, r) => s + r.nilai, 0));
}

// ─── RENDER (pakai data yang udah di-cache) ────────────────────
function miRenderTable() {
  const tbody = document.getElementById('mi-tbody');
  if (!tbody || !_miGroupTotals || !_miFlatRows) return;
  const fmtRp = v => 'Rp' + Number(v || 0).toLocaleString('id-ID');

  miUpdateMetrics();
  miUpdateSortIcons();

  const sortCol = _miSort.col || 'nilai';
  const sortDir = _miSort.col ? _miSort.dir : 'desc';
  const groupList = Object.values(_miGroupTotals)
    .filter(g => !_miSkuFilter || g.katalog === _miSkuFilter)
    .sort((a, b) => {
      let d;
      if (sortCol === 'sku') d = a.katalog.localeCompare(b.katalog);
      else d = a[sortCol] - b[sortCol];
      return sortDir === 'asc' ? d : -d;
    });
  const groupRank = {};
  groupList.forEach((g, i) => { groupRank[g.katalog] = i; });

  const rows = _miFlatRows
    .filter(r => !_miSkuFilter || r.katalog === _miSkuFilter)
    .slice()
    .sort((a, b) => {
      const rk = groupRank[a.katalog] - groupRank[b.katalog];
      if (rk !== 0) return rk;
      return b.nilai - a.nilai;
    });

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--ink3);font-style:italic;padding:20px">Tidak ada modal tertahan saat ini.</td></tr>';
    const footerEl = document.getElementById('mi-footer');
    if (footerEl) footerEl.textContent = '';
    miRenderFlashSale();
    return;
  }

  let idx = 0;
  const htmlParts = [];
  while (idx < rows.length) {
    const kat = rows[idx].katalog;
    const g = _miGroupTotals[kat];
    let j = idx;
    while (j < rows.length && rows[j].katalog === kat) j++;
    const groupRows = rows.slice(idx, j);

    // Baris header grup: nama induk + total Qty & Modal SEJAJAR di kolom masing-masing (dulu geser ke kolom Variasi)
    htmlParts.push(`<tr class="mi-grp-head">
      <td>${kat} <span class="mi-grp-count">${g.varian} varian</span></td>
      <td style="text-align:center">${g.sisa.toLocaleString('id-ID')}</td>
      <td style="text-align:right;color:var(--warn)">${fmtRp(g.nilai)}</td>
      <td></td>
    </tr>`);
    groupRows.forEach(r => {
      htmlParts.push(`<tr class="mi-var-row">
        <td>${r.sku}</td>
        <td style="text-align:center">${r.sisa.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:var(--warn)">${fmtRp(r.nilai)}</td>
        <td>${r.boss}</td>
      </tr>`);
    });
    htmlParts.push('<tr class="mi-grp-gap"><td colspan="4"></td></tr>');
    idx = j;
  }
  tbody.innerHTML = htmlParts.join('');

  const footerEl = document.getElementById('mi-footer');
  if (footerEl) footerEl.textContent = `${groupList.length} SKU induk · ${rows.length} varian SKU`;

  miRenderFlashSale();
}

// ─── Badge status velocity (dipakai di kolom Status Flash Sale) ──
function _miStatusBadge(vel) {
  const map = {
    fast:   { label: 'Fast',   color: '#00c896' },
    slow:   { label: 'Slow',   color: '#c8a000' },
    dead:   { label: 'Dead',   color: '#e05c00' },
    zombie: { label: 'Zombie', color: 'var(--ink3)' }
  };
  const m = map[vel];
  if (m) return `<span style="font-size:11px;font-weight:700;color:${m.color};padding:3px 10px;border:1.5px solid ${m.color};border-radius:6px;white-space:nowrap">${m.label}</span>`;
  // non-aktif / kategori custom lain (bukan hasil velocity) — pakai raw label-nya
  const label = vel ? vel.charAt(0).toUpperCase() + vel.slice(1) : '—';
  return `<span style="font-size:11px;font-weight:700;color:var(--ink3);padding:3px 10px;border:1.5px solid var(--ink3);border-radius:6px;white-space:nowrap">${label}</span>`;
}

// ─── TABEL KANAN — Kandidat Flash Sale (sisa >= 3 pcs, syarat minimal
// Shopee). Sumber: _miFlashRows = SEMUA SKU semua velocity (lihat
// catatan di loadModalInduk) — urutan grup dihitung dari total
// masing-masing SKU induk sendiri (independen dari grup Clearance di
// tabel kiri), biar SKU induk yang gak masuk kriteria Clearance sama
// sekali (mis. full Fast-moving) tetap kehandle rankingnya. ──
function miRenderFlashSale() {
  const tbody = document.getElementById('mi-flash-tbody');
  if (!tbody || !_miFlashRows) return;

  const flashFlat = _miFlashRows.filter(r => r.sisa >= 3 && (!_miSkuFilter || r.katalog === _miSkuFilter));

  if (!flashFlat.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic;padding:14px">Belum ada SKU yang sisa-nya ≥ 3 pcs.</td></tr>';
    document.getElementById('mi-flash-footer').textContent = '';
    return;
  }

  // total per katalog dari data flash SENDIRI (bukan _miGroupTotals kiri)
  const flashGroupTotals = {};
  flashFlat.forEach(r => {
    if (!flashGroupTotals[r.katalog]) flashGroupTotals[r.katalog] = { katalog: r.katalog, sisa: 0, nilai: 0 };
    flashGroupTotals[r.katalog].sisa  += r.sisa;
    flashGroupTotals[r.katalog].nilai += r.nilai;
  });

  const sortCol = _miSort.col || 'nilai';
  const sortDir = _miSort.col ? _miSort.dir : 'desc';
  const groupOrder = Object.values(flashGroupTotals).sort((a, b) => {
    let d;
    if (sortCol === 'sku') d = a.katalog.localeCompare(b.katalog);
    else if (sortCol === 'sisa') d = a.sisa - b.sisa;
    else d = a.nilai - b.nilai;
    return sortDir === 'asc' ? d : -d;
  });
  const groupRank = {};
  groupOrder.forEach((g, i) => { groupRank[g.katalog] = i; });

  const rows = flashFlat.slice().sort((a, b) => {
    const rk = groupRank[a.katalog] - groupRank[b.katalog];
    if (rk !== 0) return rk;
    return b.nilai - a.nilai;
  });

  let idx = 0;
  const htmlParts = [];
  while (idx < rows.length) {
    const kat = rows[idx].katalog;
    let j = idx;
    while (j < rows.length && rows[j].katalog === kat) j++;
    const groupRows = rows.slice(idx, j);

    htmlParts.push(`<tr class="mi-grp-head">
      <td>${kat}</td>
      <td style="text-align:center">${flashGroupTotals[kat].sisa.toLocaleString('id-ID')}</td>
      <td></td>
    </tr>`);
    groupRows.forEach(r => {
      htmlParts.push(`<tr class="mi-var-row">
        <td>${r.sku}</td>
        <td style="text-align:center;font-weight:700">${r.sisa.toLocaleString('id-ID')}</td>
        <td style="text-align:center">${_miStatusBadge(r.vel)}</td>
      </tr>`);
    });
    htmlParts.push('<tr class="mi-grp-gap"><td colspan="3"></td></tr>');
    idx = j;
  }
  tbody.innerHTML = htmlParts.join('');

  document.getElementById('mi-flash-footer').textContent = `${rows.length} SKU siap flash sale`;
}

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadModalInduk() {
  const tbody = document.getElementById('mi-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" style="color:var(--ink3);font-style:italic"><i class="ti ti-loader"></i> Memuat data...</td></tr>';

  const fmtRp = v => 'Rp' + Number(v || 0).toLocaleString('id-ID');

  try {
    const tgl7  = new Date(); tgl7.setDate(tgl7.getDate() - 7);
    const tgl30 = new Date(); tgl30.setDate(tgl30.getDate() - 30);
    const tgl90 = new Date(); tgl90.setDate(tgl90.getDate() - 90);
    const tgl7Str  = tgl7.toISOString().slice(0, 10);
    const tgl30Str = tgl30.toISOString().slice(0, 10);
    const tgl90Str = tgl90.toISOString().slice(0, 10);

    const [produkAll, stokRaw, jpAllRaw, jp7Raw, jp30Raw, jp90Raw] = await Promise.all([
      dbGet('produk', '&order=katalog.asc'),
      dbGet('stok'),
      dbGet('jurnal_penjualan', '&select=sku,qty'),
      dbGet('jurnal_penjualan', '&select=sku,qty&tanggal=gte.' + tgl7Str),
      dbGet('jurnal_penjualan', '&select=sku,qty&tanggal=gte.' + tgl30Str),
      dbGet('jurnal_penjualan', '&select=sku,qty&tanggal=gte.' + tgl90Str)
    ]);

    // Sisa stok per SKU — identik logic clearance.js
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
    const sales7Map = {}, sales30Map = {}, sales90Map = {};
    const _buildMap = (data, map) => {
      (data || []).forEach(r => {
        const k = (r.sku || '').trim().toUpperCase();
        if (k) map[k] = (map[k] || 0) + (r.qty || 0);
      });
    };
    _buildMap(jp7Raw,  sales7Map);
    _buildMap(jp30Raw, sales30Map);
    _buildMap(jp90Raw, sales90Map);

    // Kumpulan SKU non-aktif + dead/zombie-aktif yang masih ada sisa — identik logic clearance.js
    const flat = [];
    produkAll.forEach(p => {
      const kat = (p.kategori_produk || 'aktif').toLowerCase();
      const skuKey = (p.sku_variasi || p.sku || '').trim().toUpperCase();
      if (!skuKey) return;
      const sisa = (masukMap[skuKey] || 0) - (keluarMap[skuKey] || 0);
      if (sisa <= 0) return;

      if (kat !== 'aktif') {
        flat.push({ katalog: p.katalog || '—', sku: skuKey, boss: p.boss || '—', sisa, hpp: p.hpp || 0 });
      } else if (typeof _stokVelocity === 'function') {
        const vel = _stokVelocity(sales7Map[skuKey], sales30Map[skuKey], sales90Map[skuKey]);
        if (vel === 'dead' || vel === 'zombie') {
          flat.push({ katalog: p.katalog || '—', sku: skuKey, boss: p.boss || '—', sisa, hpp: p.hpp || 0 });
        }
      }
    });
    flat.forEach(r => { r.nilai = r.sisa * r.hpp; });

    // ── Kandidat Flash Sale: SEMUA SKU (semua velocity — Fast/Slow/Dead/
    // Zombie/non-aktif), BUKAN cuma yang masuk kriteria Clearance (kolom
    // kiri) kayak sebelumnya. Alasan (16 Sep 2026, request user): flash
    // sale lebih efektif didorong ke SKU yang emang lagi laris (Fast) —
    // dampaknya ke penjualan lebih gede — bukan cuma buat ngabisin stok
    // mati. Dipisah dari `flat` di atas biar tabel kiri (murni Clearance)
    // gak ikut berubah.
    const flashFlat = [];
    produkAll.forEach(p => {
      const skuKey = (p.sku_variasi || p.sku || '').trim().toUpperCase();
      if (!skuKey) return;
      const sisa = (masukMap[skuKey] || 0) - (keluarMap[skuKey] || 0);
      if (sisa <= 0) return;
      const katRaw = (p.kategori_produk || 'aktif').toLowerCase();
      const vel = katRaw !== 'aktif'
        ? katRaw
        : (typeof _stokVelocity === 'function' ? _stokVelocity(sales7Map[skuKey], sales30Map[skuKey], sales90Map[skuKey]) : null);
      flashFlat.push({ katalog: p.katalog || '—', sku: skuKey, boss: p.boss || '—', sisa, hpp: p.hpp || 0, vel });
    });
    flashFlat.forEach(r => { r.nilai = r.sisa * r.hpp; });

    // Total per katalog (SKU induk) — dipakai buat metrik atas & sort grup
    const groupTotals = {};
    flat.forEach(r => {
      if (!groupTotals[r.katalog]) groupTotals[r.katalog] = { katalog: r.katalog, varian: 0, sisa: 0, nilai: 0 };
      groupTotals[r.katalog].varian += 1;
      groupTotals[r.katalog].sisa   += r.sisa;
      groupTotals[r.katalog].nilai  += r.nilai;
    });

    _miGroupTotals = groupTotals;
    _miFlatRows    = flat;
    _miFlashRows   = flashFlat;
    miPopulateSkuFilter();
    miRenderTable();

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger)">⚠️ Error: ${err.message}</td></tr>`;
    console.error('[clearance-induk]', err);
  }
}

// ─── AUTO-LOAD SAAT NAVIGASI KE HALAMAN INI ───────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'clearance-induk') return;
  // Fix 16 Sep 2026: dulu _miSkuFilter kebawa nempel dari kunjungan
  // sebelumnya (gak ke-reset), jadi kalau user pernah pilih 1 SKU lalu
  // pindah & balik lagi ke halaman ini, dropdown diam-diam masih
  // nge-filter ke SKU lama itu — kelihatan kayak "sort cuma nampilin
  // 1 SKU" padahal itu efek filter lama yang nyangkut, bukan dari sort.
  // Reset total ke "Semua SKU" tiap kali halaman ini dibuka dari awal.
  _miSkuFilter = '';
  _miSort = { col: null, dir: null };
  loadModalInduk();
});
