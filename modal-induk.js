// ─── MODAL-INDUK.JS — Modal per SKU Induk ─────────────────────
// Agregasi dari data yang sama dengan Clearance Monitor (clearance.js),
// tapi digabung per KATALOG (SKU induk), bukan per SKU varian.
// Dipicu dari tombol "Modal per SKU Induk" di header Clearance Monitor.

document.getElementById('page-modal-induk').innerHTML = `
  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span><i class="ti ti-stack-2"></i> Modal per SKU Induk</span>
      <button class="btn btn-sm" onclick="gotoPage('clearance',null)" style="font-size:12px">
        <i class="ti ti-arrow-left"></i> Kembali ke Clearance Monitor
      </button>
    </div>

    <div id="mi-metrics-strip" class="metrics" style="grid-template-columns:repeat(3,1fr);margin:0">
      <div class="metric">
        <div class="m-label">Katalog Terdampak</div>
        <div class="m-value" id="mi-total-katalog">—</div>
        <div class="m-delta">SKU induk</div>
      </div>
      <div class="metric">
        <div class="m-label">Total Varian SKU</div>
        <div class="m-value" id="mi-total-varian">—</div>
        <div class="m-delta">non-aktif/dead/zombie</div>
      </div>
      <div class="metric">
        <div class="m-label">Total Modal Tertahan</div>
        <div class="m-value" id="mi-total-nilai">—</div>
        <div class="m-delta">HPP × sisa (digabung)</div>
      </div>
    </div>

    <div id="mi-tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th onclick="miSort('sku')" style="cursor:pointer;user-select:none">SKU <span id="mi-sort-sku">⇅</span></th>
            <th>Variasi</th>
            <th onclick="miSort('sisa')" style="cursor:pointer;user-select:none;text-align:center">Qty <span id="mi-sort-sisa">⇅</span></th>
            <th onclick="miSort('nilai')" style="cursor:pointer;user-select:none;text-align:right">Modal / Varian <span id="mi-sort-nilai">⇅</span></th>
            <th>Supplier</th>
          </tr>
        </thead>
        <tbody id="mi-tbody">
          <tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
    <div id="mi-footer-wrap"><div id="mi-footer" style="font-size:12px;color:var(--ink3);text-align:right"></div></div>
  </div>
`;

setTimeout(() => {
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-modal-induk'));
}, 80);

// ─── STATE (cache biar sort gak perlu fetch ulang) ────────────
let _miGroupTotals = null;  // { katalog: {katalog,varian,sisa,nilai} }
let _miFlatRows    = null;  // [{katalog, sku, boss, sisa, hpp, nilai}]
let _miSort        = { col: 'nilai', dir: 'desc' };

function miSort(col) {
  if (_miSort.col === col) {
    _miSort.dir = (_miSort.dir === 'desc') ? 'asc' : 'desc';
  } else {
    _miSort.col = col;
    _miSort.dir = (col === 'sku') ? 'asc' : 'desc';
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

// ─── RENDER (pakai data yang udah di-cache) ────────────────────
function miRenderTable() {
  const tbody = document.getElementById('mi-tbody');
  if (!tbody || !_miGroupTotals || !_miFlatRows) return;
  const fmtRp = v => 'Rp' + Number(v || 0).toLocaleString('id-ID');

  miUpdateSortIcons();

  const groupList = Object.values(_miGroupTotals).sort((a, b) => {
    let d;
    if (_miSort.col === 'sku')   d = a.katalog.localeCompare(b.katalog);
    else d = a[_miSort.col] - b[_miSort.col];
    return _miSort.dir === 'asc' ? d : -d;
  });
  const groupRank = {};
  groupList.forEach((g, i) => { groupRank[g.katalog] = i; });

  const rows = _miFlatRows.slice().sort((a, b) => {
    const rk = groupRank[a.katalog] - groupRank[b.katalog];
    if (rk !== 0) return rk;
    return b.nilai - a.nilai;
  });

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic;padding:20px">Tidak ada modal tertahan saat ini.</td></tr>';
    const footerEl = document.getElementById('mi-footer');
    if (footerEl) footerEl.textContent = '';
    return;
  }

  let idx = 0;
  const htmlParts = [];
  while (idx < rows.length) {
    const kat = rows[idx].katalog;
    const g = _miGroupTotals[kat];
    htmlParts.push(`<tr style="background:var(--ovl-0_1);border-top:2px solid var(--ink3)">
      <td style="font-weight:700">${kat} <span style="font-weight:400;font-size:11px;color:var(--ink3)">(${g.varian} varian)</span></td>
      <td style="color:var(--warn);font-weight:700">${fmtRp(g.nilai)}</td>
      <td style="text-align:center;font-weight:700">${g.sisa.toLocaleString('id-ID')}</td>
      <td></td>
      <td></td>
    </tr>`);
    while (idx < rows.length && rows[idx].katalog === kat) {
      const r = rows[idx];
      htmlParts.push(`<tr>
        <td></td>
        <td>${r.sku}</td>
        <td style="text-align:center">${r.sisa.toLocaleString('id-ID')}</td>
        <td style="text-align:right;color:var(--warn)">${fmtRp(r.nilai)}</td>
        <td>${r.boss}</td>
      </tr>`);
      idx++;
    }
  }
  tbody.innerHTML = htmlParts.join('');

  const footerEl = document.getElementById('mi-footer');
  if (footerEl) footerEl.textContent = `${groupList.length} SKU induk · ${rows.length} varian SKU`;
}

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadModalInduk() {
  const tbody = document.getElementById('mi-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic"><i class="ti ti-loader"></i> Memuat data...</td></tr>';

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

    // Total per katalog (SKU induk) — dipakai buat metrik atas & sort grup
    const groupTotals = {};
    flat.forEach(r => {
      if (!groupTotals[r.katalog]) groupTotals[r.katalog] = { katalog: r.katalog, varian: 0, sisa: 0, nilai: 0 };
      groupTotals[r.katalog].varian += 1;
      groupTotals[r.katalog].sisa   += r.sisa;
      groupTotals[r.katalog].nilai  += r.nilai;
    });

    document.getElementById('mi-total-katalog').textContent = Object.keys(groupTotals).length.toLocaleString('id-ID');
    document.getElementById('mi-total-varian').textContent  = flat.length.toLocaleString('id-ID');
    document.getElementById('mi-total-nilai').textContent   = fmtRp(flat.reduce((s, r) => s + r.nilai, 0));

    _miGroupTotals = groupTotals;
    _miFlatRows    = flat;
    miRenderTable();

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger)">⚠️ Error: ${err.message}</td></tr>`;
    console.error('[modal-induk]', err);
  }
}

// ─── AUTO-LOAD SAAT NAVIGASI KE HALAMAN INI ───────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'modal-induk') return;
  loadModalInduk();
});
