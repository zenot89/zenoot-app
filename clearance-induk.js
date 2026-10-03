// ─── MODAL-INDUK.JS — Modal per SKU Induk ─────────────────────
// Agregasi dari data yang sama dengan Clearance Monitor (clearance.js),
// tapi digabung per KATALOG (SKU induk), bukan per SKU varian.
// Dipicu dari tombol "Modal per SKU Induk" di header Clearance Monitor.
//
// 3 Okt 2026 — REDESIGN master-detail (request user): tiap kolom (Clearance &
// Kandidat Flash Sale) sekarang punya 2 blok dgn tampilan IDENTIK:
//   Blok 1 = daftar SKU INDUK (Qty & Modal digabung)
//   Blok 2 = SKU VARIASI dari induk yang diklik (Qty, Modal, Supplier [+Status])
//            dgn ringkasan besar di kanan: "6 varian · 40 pcs · Rp1.640.000"
// Kedua kolom lebar sama (50/50), render lewat 1 fungsi (_miRenderSide) supaya
// tampilannya gak bisa beda lagi.

document.getElementById('page-clearance-induk').innerHTML = `
  <style>
    #mi-split-wrap > .mi-col {
      -webkit-flex: 1 1 0; flex: 1 1 0; min-width: 0; min-height: 0;
      display: -webkit-flex; display: flex; -webkit-flex-direction: column; flex-direction: column;
      background: var(--cream2); border-radius: 10px; box-shadow: var(--card-shadow); overflow: hidden;
    }
    .mi-col-title {
      -webkit-flex-shrink: 0; flex-shrink: 0; display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
      padding: 13px 16px 11px; font-weight: 700; font-size: 14px; color: var(--ink2);
      border-bottom: 1px solid var(--ovl-0_06);
    }
    .mi-col-title .mi-col-sub { font-weight: 400; font-size: 12px; color: var(--ink3); white-space: nowrap; }
    .mi-blk { min-height: 0; overflow: auto; overscroll-behavior: none; scrollbar-width: thin; scrollbar-color: var(--ink4) transparent; }
    .mi-blk::-webkit-scrollbar { width: 7px; height: 7px; }
    .mi-blk::-webkit-scrollbar-track { background: transparent; }
    .mi-blk::-webkit-scrollbar-thumb { background: var(--ink4); border-radius: 4px; }
    .mi-blk-induk { -webkit-flex: 1 1 42%; flex: 1 1 42%; }
    .mi-blk-var   { -webkit-flex: 1 1 58%; flex: 1 1 58%; }
    .mi-col .tbl { width: 100%; }
    .mi-col .tbl th {
      padding: 10px 16px; font-size: 11px; letter-spacing: .08em; color: var(--ink3);
      position: sticky; top: 0; z-index: 3; background: var(--cream3); box-shadow: none;
      border-bottom: 1px solid var(--ovl-0_06); border-radius: 0; white-space: nowrap;
    }
    .mi-col .tbl td {
      padding: 10px 16px; font-size: 13.5px; font-variant-numeric: tabular-nums;
      border-bottom: 1px solid var(--ovl-0_04); vertical-align: middle;
    }
    .mi-col .tbl .c-qty  { width: 74px;  text-align: center; }
    .mi-col .tbl .c-mdl  { width: 124px; text-align: right; }
    .mi-col .tbl .c-sup  { width: 96px; }
    .mi-col .tbl .c-st   { width: 92px;  text-align: center; }
    .mi-induk-row { cursor: pointer; }
    .mi-induk-row td { font-weight: 600; }
    .mi-induk-row.mi-sel td { background: var(--ovl-0_06); box-shadow: inset 3px 0 0 var(--accent); }
    .mi-induk-name { display: block; }
    .mi-induk-sub { display: block; margin-top: 2px; font-weight: 400; font-size: 11.5px; color: var(--ink3); }
    .mi-induk-sub i { font-style: normal; margin-right: 7px; font-weight: 600; }
    .mi-modal { color: var(--warn); }
    .mi-vhead {
      -webkit-flex-shrink: 0; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 14px;
      padding: 12px 16px; background: var(--ovl-0_05);
      border-top: 1px solid var(--ovl-0_06); border-bottom: 1px solid var(--ovl-0_06);
    }
    .mi-vhead-l { min-width: 0; }
    .mi-vhead-t { display: block; font-weight: 700; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mi-vhead-s { display: block; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink3); margin-bottom: 1px; }
    .mi-vhead-r { display: flex; align-items: baseline; justify-content: flex-end; flex-wrap: wrap; gap: 4px 18px; text-align: right; }
    .mi-big { font-size: 12px; color: var(--ink3); white-space: nowrap; }
    .mi-big b { font-size: 21px; font-weight: 800; color: var(--ink); margin-right: 3px; font-variant-numeric: tabular-nums; }
    .mi-big.mi-big-rp b { color: var(--warn); }
    .mi-vhead-empty { font-size: 13px; color: var(--ink3); font-style: italic; }
    .mi-col-foot { -webkit-flex-shrink: 0; flex-shrink: 0; padding: 8px 16px; font-size: 12px; color: var(--ink3); text-align: right; border-top: 1px solid var(--ovl-0_06); }
    .mi-empty { color: var(--ink3); font-style: italic; padding: 18px 16px !important; }
    @media (hover: hover) and (pointer: fine) {
      .mi-col .mi-induk-row:hover td, .mi-col .mi-var-row:hover td { background: var(--ovl-0_04); }
      .mi-col .mi-induk-row.mi-sel:hover td { background: var(--ovl-0_06); }
    }
    @media (max-width: 900px) {
      #mi-split-wrap { overflow-y: auto; }
      #mi-split-wrap > .mi-col { -webkit-flex: 0 0 auto; flex: 0 0 auto; height: 620px; }
    }
  </style>
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
      <!-- KOLOM KIRI — Clearance -->
      <div class="mi-col" id="mi-col-kiri">
        <div class="mi-col-title"><span><i class="ti ti-stack-2"></i> Clearance — Modal Tertahan</span><span class="mi-col-sub">non-aktif · dead · zombie</span></div>
        <div class="mi-blk mi-blk-induk">
          <table class="tbl">
            <thead><tr>
              <th onclick="miSort('sku')" style="cursor:pointer;user-select:none">SKU Induk <span data-sort="sku">⇅</span></th>
              <th class="c-qty" onclick="miSort('sisa')" style="cursor:pointer;user-select:none">Qty <span data-sort="sisa">⇅</span></th>
              <th class="c-mdl" onclick="miSort('nilai')" style="cursor:pointer;user-select:none">Modal <span data-sort="nilai">⇅</span></th>
            </tr></thead>
            <tbody id="mi-tbody"><tr><td colspan="3" class="mi-empty">Memuat data...</td></tr></tbody>
          </table>
        </div>
        <div class="mi-vhead" id="mi-vhead-kiri"><span class="mi-vhead-empty">Pilih SKU induk di atas</span></div>
        <div class="mi-blk mi-blk-var">
          <table class="tbl">
            <thead><tr>
              <th>SKU Variasi</th>
              <th class="c-qty">Qty</th>
              <th class="c-mdl">Modal</th>
              <th class="c-sup">Supplier</th>
            </tr></thead>
            <tbody id="mi-vbody-kiri"></tbody>
          </table>
        </div>
        <div class="mi-col-foot" id="mi-footer"></div>
      </div>

      <!-- KOLOM KANAN — Kandidat Flash Sale (tampilan identik) -->
      <div class="mi-col" id="mi-col-kanan">
        <div class="mi-col-title"><span><i class="ti ti-bolt"></i> Kandidat Flash Sale</span><span class="mi-col-sub">sisa ≥ 3 pcs</span></div>
        <div class="mi-blk mi-blk-induk">
          <table class="tbl">
            <thead><tr>
              <th onclick="miSort('sku')" style="cursor:pointer;user-select:none">SKU Induk <span data-sort="sku">⇅</span></th>
              <th class="c-qty" onclick="miSort('sisa')" style="cursor:pointer;user-select:none">Qty <span data-sort="sisa">⇅</span></th>
              <th class="c-mdl" onclick="miSort('nilai')" style="cursor:pointer;user-select:none">Modal <span data-sort="nilai">⇅</span></th>
            </tr></thead>
            <tbody id="mi-flash-tbody"><tr><td colspan="3" class="mi-empty">Memuat data...</td></tr></tbody>
          </table>
        </div>
        <div class="mi-vhead" id="mi-vhead-kanan"><span class="mi-vhead-empty">Pilih SKU induk di atas</span></div>
        <div class="mi-blk mi-blk-var">
          <table class="tbl">
            <thead><tr>
              <th>SKU Variasi</th>
              <th class="c-qty">Qty</th>
              <th class="c-mdl">Modal</th>
              <th class="c-sup">Supplier</th>
              <th class="c-st">Status</th>
            </tr></thead>
            <tbody id="mi-vbody-kanan"></tbody>
          </table>
        </div>
        <div class="mi-col-foot" id="mi-flash-footer"></div>
      </div>
    </div>
  </div>
`;

setTimeout(() => {
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-clearance-induk'));
}, 80);

// ─── STATE (cache biar sort gak perlu fetch ulang) ────────────
let _miGroupTotals = null;  // { katalog: {katalog,varian,sisa,nilai} }
let _miFlatRows    = null;  // [{katalog, sku, boss, sisa, hpp, nilai}] — KHUSUS clearance (non-aktif/dead/zombie), kolom kiri
let _miFlashRows   = null;  // [{katalog, sku, boss, sisa, hpp, nilai, vel}] — SEMUA SKU (semua velocity), kolom kanan
let _miSort        = { col: null, dir: null };  // null = netral (default: modal desc)
let _miSkuFilter   = '';    // '' = semua SKU
let _miSel         = { kiri: '', kanan: '' };   // SKU induk yang lagi dibuka di blok 2 (per kolom)

function _miEsc(t) { return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function _miEnc(t) { return encodeURIComponent(String(t == null ? '' : t)).replace(/'/g, '%27'); }
const _miFmtRp = v => 'Rp' + Number(v || 0).toLocaleString('id-ID');

function miPopulateSkuFilter() {
  const sel = document.getElementById('mi-filter-sku');
  if (!sel || !_miGroupTotals) return;
  const skus = Object.keys(_miGroupTotals).sort((a, b) => a.localeCompare(b));
  const prev = _miSkuFilter;
  sel.innerHTML = '<option value="">Semua SKU</option>' +
    skus.map(k => `<option value="${_miEsc(k)}">${_miEsc(k)}</option>`).join('');
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
  // pilih SKU di dropdown = langsung fokus: variasinya kebuka di kedua kolom
  if (_miSkuFilter) { _miSel.kiri = _miSkuFilter; _miSel.kanan = _miSkuFilter; }
  miRenderTable();
}

// klik baris SKU induk → buka variasinya di blok 2 (kolom yang diklik saja)
function miPick(side, enc) {
  _miSel[side] = enc ? decodeURIComponent(enc) : '';
  _miRenderSide(side);
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
  document.querySelectorAll('#page-clearance-induk [data-sort]').forEach(el => {
    const c = el.getAttribute('data-sort');
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

  const groupList = Object.values(_miGroupTotals).filter(g => !_miSkuFilter || g.katalog === _miSkuFilter);
  const flatList  = _miFlatRows.filter(r => !_miSkuFilter || r.katalog === _miSkuFilter);

  elKat.textContent = groupList.length.toLocaleString('id-ID');
  elVar.textContent = flatList.length.toLocaleString('id-ID');
  elNil.textContent = _miFmtRp(flatList.reduce((s, r) => s + r.nilai, 0));
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

// ─── RENDER 1 KOLOM (kiri = Clearance, kanan = Flash Sale) ─────
// Satu fungsi buat dua kolom → tampilan & perilaku dijamin sama.
function _miRenderSide(side) {
  const isFlash = side === 'kanan';
  const bodyInduk = document.getElementById(isFlash ? 'mi-flash-tbody' : 'mi-tbody');
  const bodyVar   = document.getElementById(isFlash ? 'mi-vbody-kanan' : 'mi-vbody-kiri');
  const headEl    = document.getElementById(isFlash ? 'mi-vhead-kanan' : 'mi-vhead-kiri');
  const footEl    = document.getElementById(isFlash ? 'mi-flash-footer' : 'mi-footer');
  if (!bodyInduk || !bodyVar || !headEl) return;
  const src = isFlash ? _miFlashRows : _miFlatRows;
  if (!src) return;
  const nCols = isFlash ? 5 : 4;

  const flat = src.filter(r => (!isFlash || r.sisa >= 3) && (!_miSkuFilter || r.katalog === _miSkuFilter));

  if (!flat.length) {
    bodyInduk.innerHTML = `<tr><td colspan="3" class="mi-empty">${isFlash ? 'Belum ada SKU yang sisa-nya ≥ 3 pcs.' : 'Tidak ada modal tertahan saat ini.'}</td></tr>`;
    bodyVar.innerHTML = '';
    headEl.innerHTML = '<span class="mi-vhead-empty">Pilih SKU induk di atas</span>';
    if (footEl) footEl.textContent = '';
    _miSel[side] = '';
    return;
  }

  // total per induk dari data kolom ini sendiri
  const totals = {};
  flat.forEach(r => {
    const g = totals[r.katalog] || (totals[r.katalog] = { katalog: r.katalog, varian: 0, sisa: 0, nilai: 0, vel: {}, boss: [] });
    g.varian += 1; g.sisa += r.sisa; g.nilai += r.nilai;
    const v = ['fast','slow','dead','zombie'].includes(r.vel) ? r.vel : 'lain'; g.vel[v] = (g.vel[v] || 0) + 1;
    if (r.boss && r.boss !== '—' && !g.boss.includes(r.boss)) g.boss.push(r.boss);
  });

  const sortCol = _miSort.col || 'nilai';
  const sortDir = _miSort.col ? _miSort.dir : 'desc';
  const cmp = (a, b, keyA, keyB) => {
    const d = sortCol === 'sku' ? String(keyA).localeCompare(String(keyB)) : a[sortCol] - b[sortCol];
    return sortDir === 'asc' ? d : -d;
  };
  const groups = Object.values(totals).sort((a, b) => cmp(a, b, a.katalog, b.katalog));

  // pilihan induk: kalau belum ada / sudah gak valid → otomatis induk teratas
  if (!_miSel[side] || !totals[_miSel[side]]) _miSel[side] = groups[0].katalog;
  const sel = _miSel[side];

  // ── Blok 1: daftar SKU induk ──
  const velColor = { fast: '#00c896', slow: '#c8a000', dead: '#e05c00', zombie: 'var(--ink3)' };
  bodyInduk.innerHTML = groups.map(g => {
    let sub;
    if (isFlash) {
      sub = ['fast', 'slow', 'dead', 'zombie', 'lain'].filter(k => g.vel[k])
        .map(k => `<i style="color:${velColor[k] || 'var(--ink3)'}">${g.vel[k]} ${k === 'lain' ? 'Non-aktif' : k.charAt(0).toUpperCase() + k.slice(1)}</i>`).join('');
    } else {
      sub = g.boss.length ? `<i>${_miEsc(g.boss.length <= 2 ? g.boss.join(', ') : g.boss[0] + ' +' + (g.boss.length - 1))}</i>` : '';
    }
    return `<tr class="mi-induk-row${g.katalog === sel ? ' mi-sel' : ''}" onclick="miPick('${side}','${_miEnc(g.katalog)}')">
      <td><span class="mi-induk-name">${_miEsc(g.katalog)} <span class="mi-grp-count">${g.varian} varian</span></span>${sub ? `<span class="mi-induk-sub">${sub}</span>` : ''}</td>
      <td class="c-qty">${g.sisa.toLocaleString('id-ID')}</td>
      <td class="c-mdl mi-modal">${_miFmtRp(g.nilai)}</td>
    </tr>`;
  }).join('');

  // ── Blok 2: variasi dari induk terpilih ──
  const g = totals[sel];
  const vRows = flat.filter(r => r.katalog === sel).slice().sort((a, b) => cmp(a, b, a.sku, b.sku));
  headEl.innerHTML = `
    <div class="mi-vhead-l"><span class="mi-vhead-s">Variasi</span><span class="mi-vhead-t">${_miEsc(sel)}</span></div>
    <div class="mi-vhead-r">
      <span class="mi-big"><b>${g.varian.toLocaleString('id-ID')}</b>varian</span>
      <span class="mi-big"><b>${g.sisa.toLocaleString('id-ID')}</b>pcs</span>
      <span class="mi-big mi-big-rp"><b>${_miFmtRp(g.nilai)}</b></span>
    </div>`;
  bodyVar.innerHTML = vRows.map(r => `<tr class="mi-var-row">
      <td>${_miEsc(r.sku)}</td>
      <td class="c-qty" style="font-weight:700">${r.sisa.toLocaleString('id-ID')}</td>
      <td class="c-mdl mi-modal">${_miFmtRp(r.nilai)}</td>
      <td class="c-sup">${_miEsc(r.boss)}</td>
      ${isFlash ? `<td class="c-st">${_miStatusBadge(r.vel)}</td>` : ''}
    </tr>`).join('');

  if (footEl) footEl.textContent = `${groups.length} SKU induk · ${flat.length} varian SKU`;
}

// ─── RENDER (pakai data yang udah di-cache) ────────────────────
function miRenderTable() {
  if (!_miGroupTotals || !_miFlatRows) return;
  miUpdateMetrics();
  miUpdateSortIcons();
  _miRenderSide('kiri');
  _miRenderSide('kanan');
}
// kompatibilitas nama lama
function miRenderFlashSale() { _miRenderSide('kanan'); }

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadModalInduk() {
  const tbody = document.getElementById('mi-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3" style="color:var(--ink3);font-style:italic"><i class="ti ti-loader"></i> Memuat data...</td></tr>';

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
  _miSel = { kiri: '', kanan: '' };
  _miSort = { col: null, dir: null };
  loadModalInduk();
});
