

// ─── HUTANG-SUPPLIER.JS — Bon barang ke supplier, dibayar mingguan/bulanan/kapan aja ───
// Modul BERDIRI SENDIRI (tidak share fungsi/CSS dengan kas.js atau gadag.js —
// pelajaran dari insiden kas/gadag: modul terpisah = fix satu modul gak bisa
// ngerusak modul lain). Satu-satunya titik singgung ke luar: pas user bayar,
// insert 1 baris ke tabel `jurnal` (tipe 'keluar') pakai kolom yang PERSIS
// sama seperti yang dipakai kas.js, supaya kelihatan konsisten di Kas & Jurnal
// — tapi logic/validasinya ditulis ulang sendiri di sini, bukan manggil fungsi
// internal kas.js.
//
// Tabel: hutang_supplier, hutang_bon, hutang_bon_item, hutang_pembayaran
// (lihat migration SQL terpisah).

document.getElementById('page-hutang-supplier').innerHTML = `
  <div id="ops-switcher-hs" class="ch-switcher"></div>

  <style>
    #page-hutang-supplier { padding-bottom: 24px; }

    .hs-toolbar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:12px; }
    .hs-btn-pill    { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:20px; font-family:var(--f); font-size:13px; font-weight:600; cursor:pointer; border:none; }
    .hs-btn-primary { background:var(--ink); color:var(--cream); }
    .hs-btn-ghost   { background:none; color:var(--ink2); border:1px solid var(--ink3); }
    .hs-btn-danger  { background:none; color:var(--danger); border:1px solid var(--danger); }

    /* ── Kartu ringkasan per supplier — scroll horizontal, tap buat filter ── */
    #hs-supplier-row { display:flex; gap:10px; overflow-x:auto; padding-bottom:6px; margin-bottom:14px; -webkit-overflow-scrolling:touch; }
    .hs-sup-card {
      flex:none; min-width:150px; background:var(--cream2); border:1.5px solid var(--ink4);
      border-radius:12px; padding:12px 14px; cursor:pointer; transition:border-color .15s ease;
    }
    .hs-sup-card.active { border-color:var(--ink); }
    .hs-sup-card-nama { font-size:13px; font-weight:700; color:var(--ink); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hs-sup-card-total { font-size:15px; font-weight:800; color:var(--danger); }
    .hs-sup-card-sub  { font-size:10.5px; color:var(--ink3); margin-top:2px; }

    /* ── Donut chart, sama teknik kayak Gadag (conic-gradient) tapi warna dark theme ── */
    .hs-donut {
      --pct: 0; --donut-color: var(--ok);
      width: 40px; height: 40px; flex:none; border-radius:50%;
      background: conic-gradient(var(--donut-color) calc(var(--pct) * 1%), var(--ink4) 0);
      display:flex; align-items:center; justify-content:center; position:relative;
      transition: background .25s ease;
    }
    .hs-donut::before { content:''; position:absolute; inset:5px; border-radius:50%; background:var(--cream2); }
    .hs-donut span { position:relative; z-index:1; font-size:9px; font-weight:800; color:var(--ink); }

    /* ── List bon ── */
    #hs-bon-list { display:flex; flex-direction:column; gap:8px; }
    .hs-bon-card { display:flex; align-items:center; gap:12px; background:var(--cream2); border:1px solid var(--ink4); border-radius:12px; padding:12px 14px; cursor:pointer; }
    .hs-bon-main { flex:1; min-width:0; }
    .hs-bon-top  { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
    .hs-bon-nama { font-weight:700; font-size:14px; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .hs-bon-badge { font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:10px; white-space:nowrap; }
    .hs-badge-belum { background:rgba(230,168,23,.15); color:var(--warn); }
    .hs-badge-cicil { background:rgba(62,207,106,.12); color:var(--ok); }
    .hs-badge-lunas { background:rgba(62,207,106,.22); color:var(--ok); }
    .hs-bon-sub  { font-size:11.5px; color:var(--ink3); margin-top:3px; }
    .hs-bon-sisa { font-size:13px; font-weight:700; color:var(--danger); margin-top:2px; }
    .hs-empty { text-align:center; padding:40px 12px; color:var(--ink3); font-size:13px; }

    /* ── Bottom sheet (form Tambah Bon & Detail Bon) — pola sama Gadag ── */
    .hs-sheet-overlay { display:none; position:fixed; inset:0; z-index:820; background:rgba(0,0,0,.55); align-items:flex-end; justify-content:center; }
    .hs-sheet-overlay.open { display:flex; }
    .hs-sheet-page {
      width:100%; max-width:480px; height:85vh; max-height:85vh;
      background:var(--cream); border-radius:20px 20px 0 0;
      display:flex; flex-direction:column; transform:translateY(100%);
      transition:transform .28s cubic-bezier(.32,.72,0,1);
      box-shadow:0 -4px 20px rgba(0,0,0,.4);
    }
    .hs-sheet-overlay.hs-sheet-in .hs-sheet-page { transform:translateY(0); }
    .hs-sheet-handle { display:flex; justify-content:center; padding:10px 0 2px; flex:none; }
    .hs-sheet-handle span { width:40px; height:5px; border-radius:3px; background:var(--ink); opacity:.3; }
    .hs-sheet-header { display:flex; align-items:center; gap:10px; flex:none; padding:6px 16px 12px; border-bottom:1px solid var(--ink4); }
    .hs-sheet-title { font-size:16px; font-weight:800; color:var(--ink); }
    .hs-sheet-close { margin-left:auto; background:none; border:none; color:var(--ink2); font-size:20px; cursor:pointer; padding:4px; }
    .hs-sheet-body { flex:1 1 0; overflow-y:auto; padding:14px 16px 24px; }
    .hs-sheet-footer { flex:none; padding:12px 16px; border-top:1px solid var(--ink4); }

    .hs-form-group { margin-bottom:12px; }
    .hs-form-group label { display:block; font-size:11.5px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.03em; margin-bottom:5px; }
    .hs-form-group input, .hs-form-group select, .hs-form-group textarea {
      width:100%; padding:9px 11px; border-radius:8px; border:1px solid var(--ink4);
      background:var(--cream2); color:var(--ink); font-family:var(--f); font-size:14px;
    }
    .hs-row-2 { display:flex; gap:10px; }
    .hs-row-2 > div { flex:1; min-width:0; }

    /* ── Baris item bon (dinamis) ── */
    #hs-item-rows { display:flex; flex-direction:column; gap:8px; margin-bottom:8px; }
    .hs-item-row { background:var(--cream2); border:1px solid var(--ink4); border-radius:10px; padding:10px; position:relative; }
    .hs-item-row-top { display:flex; gap:8px; margin-bottom:6px; }
    .hs-item-row-top input { flex:1; min-width:0; }
    .hs-item-row-bottom { display:flex; gap:8px; align-items:center; }
    .hs-item-row-bottom input { flex:1; min-width:0; }
    .hs-item-subtotal { font-size:12px; font-weight:700; color:var(--ink2); white-space:nowrap; }
    .hs-item-remove { background:none; border:none; color:var(--danger); font-size:16px; cursor:pointer; padding:4px; flex:none; }
    .hs-item-hint { font-size:10px; color:var(--ink3); margin-top:3px; }
    .hs-total-line { display:flex; justify-content:space-between; align-items:center; padding:10px 2px; font-size:15px; font-weight:800; color:var(--ink); border-top:2px solid var(--ink4); margin-top:4px; }

    /* ── Detail bon: item table + riwayat bayar ── */
    .hs-detail-section-title { font-size:12px; font-weight:800; color:var(--ink3); text-transform:uppercase; letter-spacing:.04em; margin:16px 0 8px; }
    .hs-detail-section-title:first-child { margin-top:0; }
    .hs-detail-item-row { display:flex; justify-content:space-between; gap:8px; padding:7px 0; border-bottom:1px solid var(--ink4); font-size:13px; }
    .hs-detail-item-nama { color:var(--ink); font-weight:600; }
    .hs-detail-item-nama-sup { color:var(--ink3); font-size:11px; }
    .hs-detail-item-qty { color:var(--ink3); white-space:nowrap; }
    .hs-detail-item-sub { color:var(--ink); font-weight:700; white-space:nowrap; }
    .hs-pay-item { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--ink4); font-size:12.5px; }
    .hs-pay-item-left { color:var(--ink2); }
    .hs-pay-item-nom { color:var(--ok); font-weight:700; }
    .hs-detail-summary { display:flex; gap:10px; align-items:center; background:var(--cream2); border-radius:10px; padding:12px 14px; margin-bottom:4px; }
    .hs-detail-summary-txt { flex:1; min-width:0; }
    .hs-detail-summary-total { font-size:16px; font-weight:800; color:var(--ink); }
    .hs-detail-summary-sisa { font-size:12px; color:var(--danger); font-weight:700; margin-top:2px; }

    @media(max-width:600px){
      .hs-sheet-page { max-width:100%; }
    }
  </style>

  <div class="hs-toolbar">
    <button class="hs-btn-pill hs-btn-primary" onclick="hsOpenTambahBon()"><i class="ti ti-plus"></i> Tambah Bon</button>
    <button class="hs-btn-pill hs-btn-ghost" onclick="loadHutangSupplier()"><i class="ti ti-refresh"></i></button>
  </div>

  <div id="hs-supplier-row"></div>

  <div id="hs-bon-list"></div>

  <!-- ── SHEET: TAMBAH / EDIT BON ── -->
  <div class="hs-sheet-overlay" id="hs-sheet-bon" onclick="if(event.target===this) hsCloseSheet('hs-sheet-bon')">
    <div class="hs-sheet-page">
      <div class="hs-sheet-handle"><span></span></div>
      <div class="hs-sheet-header">
        <div class="hs-sheet-title" id="hs-bon-form-title">Tambah Bon</div>
        <button class="hs-sheet-close" onclick="hsCloseSheet('hs-sheet-bon')"><i class="ti ti-x"></i></button>
      </div>
      <div class="hs-sheet-body">
        <input type="hidden" id="hs-bon-id">
        <div class="hs-form-group">
          <label>Supplier</label>
          <div class="hs-row-2">
            <select id="hs-bon-supplier-select" onchange="hsOnSupplierSelectChange()"></select>
          </div>
          <input type="text" id="hs-bon-supplier-baru" placeholder="Nama supplier baru..." style="display:none;margin-top:8px">
        </div>
        <div class="hs-row-2">
          <div class="hs-form-group">
            <label>Tanggal Bon</label>
            <input type="date" id="hs-bon-tanggal">
          </div>
          <div class="hs-form-group">
            <label>No. Nota (opsional)</label>
            <input type="text" id="hs-bon-no-nota" placeholder="mis: INV-0021">
          </div>
        </div>

        <label style="display:block;font-size:11.5px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.03em;margin-bottom:6px">Barang</label>
        <div id="hs-item-rows"></div>
        <button class="hs-btn-pill hs-btn-ghost" onclick="hsAddItemRow()" style="margin-bottom:10px"><i class="ti ti-plus"></i> Tambah Barang</button>

        <div class="hs-total-line"><span>Total Bon</span><span id="hs-bon-total-display">Rp0</span></div>

        <div class="hs-form-group" style="margin-top:12px">
          <label>Catatan (opsional)</label>
          <textarea id="hs-bon-catatan" rows="2"></textarea>
        </div>
      </div>
      <div class="hs-sheet-footer" style="display:flex;gap:8px">
        <button class="hs-btn-pill hs-btn-danger" id="hs-bon-btn-hapus" style="display:none" onclick="hsHapusBon()"><i class="ti ti-trash"></i> Hapus</button>
        <button class="hs-btn-pill hs-btn-primary" style="flex:1;justify-content:center" onclick="hsSimpanBon()">Simpan</button>
      </div>
    </div>
  </div>

  <!-- ── SHEET: DETAIL BON (item + bayar + riwayat) ── -->
  <div class="hs-sheet-overlay" id="hs-sheet-detail" onclick="if(event.target===this) hsCloseSheet('hs-sheet-detail')">
    <div class="hs-sheet-page">
      <div class="hs-sheet-handle"><span></span></div>
      <div class="hs-sheet-header">
        <div class="hs-sheet-title" id="hs-detail-title">Detail Bon</div>
        <button class="hs-sheet-close" onclick="hsCloseSheet('hs-sheet-detail')"><i class="ti ti-x"></i></button>
      </div>
      <div class="hs-sheet-body">
        <div class="hs-detail-summary">
          <div class="hs-detail-summary-txt">
            <div class="hs-detail-summary-total" id="hs-detail-total">Rp0</div>
            <div class="hs-detail-summary-sisa" id="hs-detail-sisa">Sisa Rp0</div>
          </div>
          <div class="hs-donut" id="hs-detail-donut" style="--pct:0"><span id="hs-detail-donut-txt">0%</span></div>
        </div>

        <div class="hs-detail-section-title">Barang</div>
        <div id="hs-detail-items"></div>

        <div class="hs-detail-section-title">Bayar</div>
        <div class="hs-row-2">
          <div class="hs-form-group">
            <label>Nominal</label>
            <input type="text" id="hs-pay-nominal" inputmode="numeric" placeholder="0">
          </div>
          <div class="hs-form-group">
            <label>Tanggal</label>
            <input type="date" id="hs-pay-tanggal">
          </div>
        </div>
        <div class="hs-row-2">
          <div class="hs-form-group">
            <label>Debit (Hutang/Beban)</label>
            <select id="hs-pay-akun-debit"></select>
          </div>
          <div class="hs-form-group">
            <label>Bayar dari (Kas/Bank)</label>
            <select id="hs-pay-akun-kredit"></select>
          </div>
        </div>
        <div class="hs-form-group">
          <label>Catatan (opsional)</label>
          <input type="text" id="hs-pay-catatan">
        </div>
        <button class="hs-btn-pill hs-btn-primary" style="width:100%;justify-content:center;margin-bottom:6px" onclick="hsSimpanBayar()"><i class="ti ti-cash"></i> Catat Pembayaran</button>

        <div class="hs-detail-section-title">Riwayat Pembayaran</div>
        <div id="hs-detail-riwayat"></div>
      </div>
    </div>
  </div>
`;

// ─── STATE ──────────────────────────────────────────────────────
var _hsSupplierList = [];   // [{id, nama, kontak}]
var _hsBonList       = [];  // [{id, supplier_id, tanggal, no_nota, total, status, catatan, ...}]
var _hsPembayaranAll = [];  // semua hutang_pembayaran, dikelompokkan per bon_id di client
var _hsAkunKas        = []; // kas_akun, buat select debit/kredit pembayaran
var _hsFilterSupplier = null; // null = semua
var _hsItemRows       = []; // baris item form Tambah/Edit Bon: [{nama_internal,nama_supplier,qty,satuan,harga_satuan}]
var _hsCurrentBonId   = null; // bon yg lagi dibuka di sheet detail

// ─── LOAD ───────────────────────────────────────────────────────
async function loadHutangSupplier() {
  try {
    const [supplier, bon, pembayaran, akun] = await Promise.all([
      dbGet('hutang_supplier', '&order=nama.asc'),
      dbGet('hutang_bon',      '&order=tanggal.desc,created_at.desc'),
      dbGet('hutang_pembayaran', '&order=tanggal.desc'),
      dbGet('kas_akun',        '&order=kode.asc'),
    ]);
    _hsSupplierList  = supplier || [];
    _hsBonList       = bon || [];
    _hsPembayaranAll = pembayaran || [];
    _hsAkunKas       = akun || [];
    hsRenderSupplierCards();
    hsRenderBonList();
  } catch(e) {
    console.error('loadHutangSupplier error', e);
    var list = document.getElementById('hs-bon-list');
    if (list) list.innerHTML = '<div class="hs-empty">Gagal memuat data: ' + (e.message||e) + '</div>';
  }
}

// Sisa hutang 1 bon = total - sum(pembayaran)
function _hsSisaBon(bon) {
  var bayar = _hsPembayaranAll.filter(function(p){ return p.bon_id === bon.id; })
    .reduce(function(s,p){ return s + (p.nominal||0); }, 0);
  return { bayar: bayar, sisa: Math.max(0, (bon.total||0) - bayar) };
}

// ─── SUPPLIER CARDS ───────────────────────────────────────────
function hsRenderSupplierCards() {
  var el = document.getElementById('hs-supplier-row');
  if (!el) return;

  // Total hutang belum lunas per supplier
  var totals = {};
  _hsBonList.forEach(function(b) {
    if (b.status === 'lunas') return;
    var s = _hsSisaBon(b).sisa;
    totals[b.supplier_id] = (totals[b.supplier_id] || 0) + s;
  });

  var totalSemua = Object.values(totals).reduce(function(s,v){ return s+v; }, 0);

  var html = '<div class="hs-sup-card' + (_hsFilterSupplier===null?' active':'') + '" onclick="hsSelectSupplierFilter(null)">' +
    '<div class="hs-sup-card-nama">Semua Supplier</div>' +
    '<div class="hs-sup-card-total">' + fmtRpFull(totalSemua) + '</div>' +
    '<div class="hs-sup-card-sub">' + _hsBonList.filter(function(b){return b.status!=='lunas';}).length + ' bon belum lunas</div>' +
  '</div>';

  html += _hsSupplierList.map(function(s) {
    var jml = _hsBonList.filter(function(b){ return b.supplier_id===s.id && b.status!=='lunas'; }).length;
    return '<div class="hs-sup-card' + (_hsFilterSupplier===s.id?' active':'') + '" onclick="hsSelectSupplierFilter(' + s.id + ')">' +
      '<div class="hs-sup-card-nama">' + _hsEsc(s.nama) + '</div>' +
      '<div class="hs-sup-card-total">' + fmtRpFull(totals[s.id]||0) + '</div>' +
      '<div class="hs-sup-card-sub">' + jml + ' bon belum lunas</div>' +
    '</div>';
  }).join('');

  el.innerHTML = html;
}

function hsSelectSupplierFilter(id) {
  _hsFilterSupplier = id;
  hsRenderSupplierCards();
  hsRenderBonList();
}

// ─── BON LIST ─────────────────────────────────────────────────
function hsRenderBonList() {
  var el = document.getElementById('hs-bon-list');
  if (!el) return;

  var list = _hsBonList.filter(function(b) {
    return _hsFilterSupplier === null || b.supplier_id === _hsFilterSupplier;
  });

  if (!list.length) {
    el.innerHTML = '<div class="hs-empty">Belum ada bon' + (_hsFilterSupplier?' dari supplier ini':'') + '.</div>';
    return;
  }

  el.innerHTML = list.map(function(b) {
    var supplier = _hsSupplierList.find(function(s){ return s.id===b.supplier_id; });
    var namaSup  = supplier ? supplier.nama : '—';
    var st = _hsSisaBon(b);
    var pct = b.total > 0 ? Math.round((st.bayar / b.total) * 100) : 0;
    pct = Math.max(0, Math.min(100, pct));

    var badgeCls = 'hs-badge-belum', badgeTxt = 'Belum Lunas';
    if (b.status === 'lunas' || st.sisa <= 0) { badgeCls = 'hs-badge-lunas'; badgeTxt = 'Lunas'; }
    else if (st.bayar > 0) { badgeCls = 'hs-badge-cicil'; badgeTxt = 'Dicicil'; }

    var donutColor = (badgeCls === 'hs-badge-lunas') ? 'var(--ok)' : (badgeCls === 'hs-badge-cicil' ? 'var(--warn)' : 'var(--danger)');

    return '<div class="hs-bon-card" data-id="' + b.id + '" onclick="hsOpenDetailBon(' + b.id + ')" oncontextmenu="event.preventDefault();hsOpenEditBon(' + b.id + ')">' +
      '<div class="hs-donut" style="--pct:' + pct + ';--donut-color:' + donutColor + '"><span>' + pct + '%</span></div>' +
      '<div class="hs-bon-main">' +
        '<div class="hs-bon-top"><div class="hs-bon-nama">' + _hsEsc(namaSup) + '</div><div class="hs-bon-badge ' + badgeCls + '">' + badgeTxt + '</div></div>' +
        '<div class="hs-bon-sub">' + _hsFmtTgl(b.tanggal) + (b.no_nota ? ' · ' + _hsEsc(b.no_nota) : '') + ' · Total ' + fmtRpFull(b.total) + '</div>' +
        (st.sisa > 0 ? '<div class="hs-bon-sisa">Sisa ' + fmtRpFull(st.sisa) + '</div>' : '') +
      '</div>' +
    '</div>';
  }).join('');

  _hsInitLongPress('hs-bon-list', function(id) { hsOpenEditBon(parseInt(id,10)); });
}

// ─── LONG PRESS (copy independen, bukan reuse dari gadag.js) ──
function _hsInitLongPress(containerId, onLongPress) {
  var container = document.getElementById(containerId);
  if (!container || container._hsLongPressInited) return;
  container._hsLongPressInited = true;
  var HOLD_MS = 500, MOVE_LIMIT = 10;
  var _timer = null, _startX = 0, _startY = 0, _card = null;

  function cancel() { if (_timer) { clearTimeout(_timer); _timer = null; } _card = null; }

  container.addEventListener('touchstart', function(e) {
    var card = e.target.closest('[data-id]');
    if (!card) return;
    _card = card;
    _startX = e.touches[0].clientX;
    _startY = e.touches[0].clientY;
    _timer = setTimeout(function() {
      if (navigator.vibrate) navigator.vibrate(15);
      var c = _card; cancel();
      onLongPress(c.getAttribute('data-id'), c);
    }, HOLD_MS);
  }, { passive: true });

  container.addEventListener('touchmove', function(e) {
    if (!_timer) return;
    var dx = Math.abs(e.touches[0].clientX - _startX);
    var dy = Math.abs(e.touches[0].clientY - _startY);
    if (dx > MOVE_LIMIT || dy > MOVE_LIMIT) cancel();
  }, { passive: true });

  container.addEventListener('touchend', cancel, { passive: true });
  container.addEventListener('touchcancel', cancel, { passive: true });

  // Desktop: klik-kanan (oncontextmenu di card) sudah handle mouse, jadi
  // mousedown-hold gak wajib — tapi ditambah biar konsisten UX tekan-lama.
  container.addEventListener('mousedown', function(e) {
    var card = e.target.closest('[data-id]');
    if (!card) return;
    _card = card;
    _timer = setTimeout(function() {
      var c = _card; cancel();
      onLongPress(c.getAttribute('data-id'), c);
    }, HOLD_MS);
  });
  container.addEventListener('mouseup', cancel);
  container.addEventListener('mouseleave', cancel);
}

// ─── SHEET HELPERS ────────────────────────────────────────────
function hsOpenSheet(id) {
  var ov = document.getElementById(id);
  if (!ov) return;
  ov.classList.add('open');
  requestAnimationFrame(function() { ov.classList.add('hs-sheet-in'); });
}
function hsCloseSheet(id) {
  var ov = document.getElementById(id);
  if (!ov) return;
  ov.classList.remove('hs-sheet-in');
  setTimeout(function() { ov.classList.remove('open'); }, 280);
}

// ─── TAMBAH / EDIT BON ────────────────────────────────────────
function _hsPopulateSupplierSelect() {
  var sel = document.getElementById('hs-bon-supplier-select');
  if (!sel) return;
  var html = _hsSupplierList.map(function(s) {
    return '<option value="' + s.id + '">' + _hsEsc(s.nama) + '</option>';
  }).join('');
  html += '<option value="__baru__">+ Supplier baru...</option>';
  sel.innerHTML = html;
}

function hsOnSupplierSelectChange() {
  var sel = document.getElementById('hs-bon-supplier-select');
  var baruEl = document.getElementById('hs-bon-supplier-baru');
  if (!sel || !baruEl) return;
  baruEl.style.display = sel.value === '__baru__' ? 'block' : 'none';
}

function hsOpenTambahBon() {
  document.getElementById('hs-bon-form-title').textContent = 'Tambah Bon';
  document.getElementById('hs-bon-id').value = '';
  document.getElementById('hs-bon-btn-hapus').style.display = 'none';
  _hsPopulateSupplierSelect();
  document.getElementById('hs-bon-supplier-select').value = _hsSupplierList[0] ? _hsSupplierList[0].id : '__baru__';
  hsOnSupplierSelectChange();
  document.getElementById('hs-bon-supplier-baru').value = '';
  document.getElementById('hs-bon-tanggal').value = new Date().toISOString().slice(0,10);
  document.getElementById('hs-bon-no-nota').value = '';
  document.getElementById('hs-bon-catatan').value = '';
  _hsItemRows = [{ nama_internal:'', nama_supplier:'', qty:1, satuan:'', harga_satuan:0 }];
  _hsRenderItemRows();
  hsOpenSheet('hs-sheet-bon');
}

async function hsOpenEditBon(bonId) {
  var b = _hsBonList.find(function(x){ return x.id===bonId; });
  if (!b) return;
  document.getElementById('hs-bon-form-title').textContent = 'Edit Bon';
  document.getElementById('hs-bon-id').value = b.id;
  document.getElementById('hs-bon-btn-hapus').style.display = 'inline-flex';
  _hsPopulateSupplierSelect();
  document.getElementById('hs-bon-supplier-select').value = b.supplier_id;
  hsOnSupplierSelectChange();
  document.getElementById('hs-bon-supplier-baru').value = '';
  document.getElementById('hs-bon-tanggal').value = b.tanggal;
  document.getElementById('hs-bon-no-nota').value = b.no_nota || '';
  document.getElementById('hs-bon-catatan').value = b.catatan || '';

  try {
    var items = await dbGet('hutang_bon_item', '&bon_id=eq.' + b.id + '&order=id.asc');
    _hsItemRows = (items && items.length) ? items.map(function(it) {
      return { nama_internal: it.nama_internal||'', nama_supplier: it.nama_supplier||'', qty: it.qty||1, satuan: it.satuan||'', harga_satuan: it.harga_satuan||0 };
    }) : [{ nama_internal:'', nama_supplier:'', qty:1, satuan:'', harga_satuan:0 }];
  } catch(e) {
    _hsItemRows = [{ nama_internal:'', nama_supplier:'', qty:1, satuan:'', harga_satuan:0 }];
  }
  _hsRenderItemRows();
  hsOpenSheet('hs-sheet-bon');
}

function hsAddItemRow() {
  _hsItemRows.push({ nama_internal:'', nama_supplier:'', qty:1, satuan:'', harga_satuan:0 });
  _hsRenderItemRows();
}

function hsRemoveItemRow(idx) {
  if (_hsItemRows.length <= 1) return; // minimal 1 baris
  _hsItemRows.splice(idx, 1);
  _hsRenderItemRows();
}

function _hsRenderItemRows() {
  var wrap = document.getElementById('hs-item-rows');
  if (!wrap) return;
  wrap.innerHTML = _hsItemRows.map(function(row, idx) {
    var subtotal = (row.qty||0) * (row.harga_satuan||0);
    return '<div class="hs-item-row">' +
      '<div class="hs-item-row-top">' +
        '<input type="text" placeholder="Nama versi lo (mis: Tali Atas)" value="' + _hsEscAttr(row.nama_internal) + '" id="hs-item-int-' + idx + '" oninput="_hsItemRowUpdate(' + idx + ')">' +
        '<input type="text" placeholder="Nama versi supplier (mis: H Solah)" value="' + _hsEscAttr(row.nama_supplier) + '" id="hs-item-sup-' + idx + '" oninput="_hsItemRowUpdate(' + idx + ')">' +
        '<button class="hs-item-remove" onclick="hsRemoveItemRow(' + idx + ')"><i class="ti ti-trash"></i></button>' +
      '</div>' +
      '<div class="hs-item-row-bottom">' +
        '<input type="number" min="0" step="any" placeholder="Qty" value="' + (row.qty||'') + '" id="hs-item-qty-' + idx + '" oninput="_hsItemRowUpdate(' + idx + ')" style="max-width:70px">' +
        '<input type="text" placeholder="Satuan (pcs/kg/m)" value="' + _hsEscAttr(row.satuan) + '" id="hs-item-sat-' + idx + '" oninput="_hsItemRowUpdate(' + idx + ')" style="max-width:90px">' +
        '<input type="text" inputmode="numeric" placeholder="Harga satuan" value="' + (row.harga_satuan ? row.harga_satuan.toLocaleString('id-ID') : '') + '" id="hs-item-hrg-' + idx + '" oninput="_hsItemRowUpdate(' + idx + ')">' +
        '<span class="hs-item-subtotal">' + fmtRpFull(subtotal) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');

  // Attach autocomplete ke input nama internal & nama supplier (baru dipasang di DOM)
  _hsItemRows.forEach(function(_, idx) {
    var elInt = document.getElementById('hs-item-int-' + idx);
    var elSup = document.getElementById('hs-item-sup-' + idx);
    if (elInt && window.acAttach) acAttach(elInt, 'hs_nama_internal');
    if (elSup && window.acAttach) acAttach(elSup, 'hs_nama_supplier');
    // Formatter rupiah utk kolom harga
    var elHrg = document.getElementById('hs-item-hrg-' + idx);
    if (elHrg) idrInput('hs-item-hrg-' + idx);
  });

  _hsUpdateTotalDisplay();
}

function _hsItemRowUpdate(idx) {
  var row = _hsItemRows[idx];
  if (!row) return;
  row.nama_internal  = (document.getElementById('hs-item-int-' + idx) || {}).value || '';
  row.nama_supplier  = (document.getElementById('hs-item-sup-' + idx) || {}).value || '';
  row.qty            = parseFloat((document.getElementById('hs-item-qty-' + idx) || {}).value) || 0;
  row.satuan         = (document.getElementById('hs-item-sat-' + idx) || {}).value || '';
  row.harga_satuan   = idrVal('hs-item-hrg-' + idx);

  var sub = document.querySelectorAll('.hs-item-subtotal')[idx];
  if (sub) sub.textContent = fmtRpFull(row.qty * row.harga_satuan);
  _hsUpdateTotalDisplay();
}

function _hsUpdateTotalDisplay() {
  var total = _hsItemRows.reduce(function(s,r){ return s + (r.qty||0) * (r.harga_satuan||0); }, 0);
  var el = document.getElementById('hs-bon-total-display');
  if (el) el.textContent = fmtRpFull(total);
  return total;
}

async function hsSimpanBon() {
  var id       = document.getElementById('hs-bon-id').value;
  var selVal   = document.getElementById('hs-bon-supplier-select').value;
  var namaBaru = document.getElementById('hs-bon-supplier-baru').value.trim();
  var tanggal  = document.getElementById('hs-bon-tanggal').value;
  var noNota   = document.getElementById('hs-bon-no-nota').value.trim() || null;
  var catatan  = document.getElementById('hs-bon-catatan').value.trim() || null;

  if (!tanggal) { alert('Tanggal bon wajib diisi!'); return; }
  if (selVal === '__baru__' && !namaBaru) { alert('Isi nama supplier baru!'); return; }

  var validItems = _hsItemRows.filter(function(r){ return (r.nama_internal||r.nama_supplier) && r.qty > 0; });
  if (!validItems.length) { alert('Isi minimal 1 barang (nama & qty)!'); return; }

  var total = validItems.reduce(function(s,r){ return s + r.qty * r.harga_satuan; }, 0);
  if (!total) { alert('Total bon masih Rp0 — cek harga satuan barang!'); return; }

  try {
    var supplierId = selVal;
    if (selVal === '__baru__') {
      var newSup = await dbInsert('hutang_supplier', { nama: namaBaru.toUpperCase() });
      supplierId = newSup[0].id;
    }

    var bonData = {
      supplier_id: supplierId,
      tanggal:     tanggal,
      no_nota:     noNota,
      total:       total,
      catatan:     catatan,
    };

    var bonId;
    if (id) {
      await dbUpdate('hutang_bon', id, bonData);
      bonId = id;
      // Hapus item lama, insert ulang (lebih simpel & aman drpd diff baris)
      var oldItems = await dbGet('hutang_bon_item', '&bon_id=eq.' + id);
      for (var i=0;i<oldItems.length;i++) { await dbDelete('hutang_bon_item', oldItems[i].id); }
    } else {
      bonData.status = 'belum_lunas';
      var newBon = await dbInsert('hutang_bon', bonData);
      bonId = newBon[0].id;
    }

    for (var j=0;j<validItems.length;j++) {
      var r = validItems[j];
      await dbInsert('hutang_bon_item', {
        bon_id: bonId,
        nama_internal: r.nama_internal || null,
        nama_supplier: r.nama_supplier || null,
        qty: r.qty,
        satuan: r.satuan || null,
        harga_satuan: r.harga_satuan,
        subtotal: r.qty * r.harga_satuan,
      });
    }

    if (window.acRefresh) { acRefresh('hs_nama_internal'); acRefresh('hs_nama_supplier'); }
    hsCloseSheet('hs-sheet-bon');
    await loadHutangSupplier();
  } catch(e) {
    alert('Gagal simpan: ' + e.message);
  }
}

async function hsHapusBon() {
  var id = document.getElementById('hs-bon-id').value;
  if (!id) return;
  if (!confirm('Hapus bon ini? Semua item & riwayat pembayarannya ikut terhapus.')) return;
  try {
    await dbDelete('hutang_bon', id); // cascade hapus item & pembayaran
    hsCloseSheet('hs-sheet-bon');
    await loadHutangSupplier();
  } catch(e) {
    alert('Gagal hapus: ' + e.message);
  }
}

// ─── DETAIL BON (item + bayar + riwayat) ───────────────────────
function _hsPopulateAkunSelect(selectId, filterFn) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var opts = _hsAkunKas.filter(filterFn);
  sel.innerHTML = '<option value="">Pilih akun...</option>' + opts.map(function(a) {
    return '<option value="' + a.id + '">' + (a.kode ? a.kode + ' ' : '') + _hsEsc(a.nama) + '</option>';
  }).join('');
}

async function hsOpenDetailBon(bonId) {
  var b = _hsBonList.find(function(x){ return x.id===bonId; });
  if (!b) return;
  _hsCurrentBonId = bonId;
  var supplier = _hsSupplierList.find(function(s){ return s.id===b.supplier_id; });
  document.getElementById('hs-detail-title').textContent = supplier ? supplier.nama : 'Detail Bon';

  var st = _hsSisaBon(b);
  var pct = b.total > 0 ? Math.round((st.bayar / b.total) * 100) : 0;
  pct = Math.max(0, Math.min(100, pct));
  document.getElementById('hs-detail-total').textContent = 'Total ' + fmtRpFull(b.total);
  document.getElementById('hs-detail-sisa').textContent  = st.sisa > 0 ? 'Sisa ' + fmtRpFull(st.sisa) : 'Lunas';
  var donut = document.getElementById('hs-detail-donut');
  donut.style.setProperty('--pct', pct);
  donut.style.setProperty('--donut-color', st.sisa<=0 ? 'var(--ok)' : (st.bayar>0 ? 'var(--warn)' : 'var(--danger)'));
  document.getElementById('hs-detail-donut-txt').textContent = pct + '%';

  // Item barang
  var itemsWrap = document.getElementById('hs-detail-items');
  itemsWrap.innerHTML = '<div class="hs-empty" style="padding:10px 0">Memuat...</div>';
  try {
    var items = await dbGet('hutang_bon_item', '&bon_id=eq.' + bonId + '&order=id.asc');
    itemsWrap.innerHTML = (items && items.length) ? items.map(function(it) {
      return '<div class="hs-detail-item-row">' +
        '<div><div class="hs-detail-item-nama">' + _hsEsc(it.nama_internal || it.nama_supplier || '—') + '</div>' +
        (it.nama_internal && it.nama_supplier ? '<div class="hs-detail-item-nama-sup">supplier: ' + _hsEsc(it.nama_supplier) + '</div>' : '') + '</div>' +
        '<div class="hs-detail-item-qty">' + it.qty + (it.satuan?' '+_hsEsc(it.satuan):'') + '</div>' +
        '<div class="hs-detail-item-sub">' + fmtRpFull(it.subtotal) + '</div>' +
      '</div>';
    }).join('') : '<div class="hs-empty" style="padding:10px 0">Tidak ada data barang.</div>';
  } catch(e) {
    itemsWrap.innerHTML = '<div class="hs-empty">Gagal memuat barang.</div>';
  }

  // Form bayar — default akun kredit ke akun Kas & Bank, debit ke Beban/Kewajiban
  _hsPopulateAkunSelect('hs-pay-akun-debit', function(a) {
    return a.kelompok === 'beban' || a.kelompok === 'kewajiban';
  });
  _hsPopulateAkunSelect('hs-pay-akun-kredit', function(a) {
    return a.kelompok === 'aset' && (a.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
  });
  document.getElementById('hs-pay-nominal').value = st.sisa > 0 ? st.sisa.toLocaleString('id-ID') : '';
  idrInput('hs-pay-nominal');
  document.getElementById('hs-pay-tanggal').value = new Date().toISOString().slice(0,10);
  document.getElementById('hs-pay-catatan').value = '';

  await _hsRenderRiwayatBayar(bonId);
  hsOpenSheet('hs-sheet-detail');
}

async function _hsRenderRiwayatBayar(bonId) {
  var wrap = document.getElementById('hs-detail-riwayat');
  var list = _hsPembayaranAll.filter(function(p){ return p.bon_id===bonId; });
  if (!list.length) { wrap.innerHTML = '<div class="hs-empty" style="padding:10px 0">Belum ada pembayaran.</div>'; return; }
  wrap.innerHTML = list.map(function(p) {
    var akun = _hsAkunKas.find(function(a){ return a.id===p.kas_akun_id; });
    return '<div class="hs-pay-item">' +
      '<div class="hs-pay-item-left">' + _hsFmtTgl(p.tanggal) + (akun ? ' · ' + _hsEsc(akun.nama) : '') + (p.catatan ? ' · ' + _hsEsc(p.catatan) : '') + '</div>' +
      '<div class="hs-pay-item-nom">' + fmtRpFull(p.nominal) + '</div>' +
    '</div>';
  }).join('');
}

async function hsSimpanBayar() {
  var bonId = _hsCurrentBonId;
  if (!bonId) return;
  var b = _hsBonList.find(function(x){ return x.id===bonId; });
  if (!b) return;

  var nominal   = idrVal('hs-pay-nominal');
  var tanggal   = document.getElementById('hs-pay-tanggal').value;
  var akunD     = document.getElementById('hs-pay-akun-debit').value;
  var akunK     = document.getElementById('hs-pay-akun-kredit').value;
  var catatan   = document.getElementById('hs-pay-catatan').value.trim() || null;

  if (!tanggal)  { alert('Tanggal wajib diisi!'); return; }
  if (!nominal)  { alert('Nominal wajib diisi!'); return; }
  if (!akunD)    { alert('Pilih akun Debit (Hutang/Beban)!'); return; }
  if (!akunK)    { alert('Pilih akun Kas/Bank sumber bayar!'); return; }

  var st = _hsSisaBon(b);
  if (nominal > st.sisa + 1) {
    if (!confirm('Nominal (' + fmtRpFull(nominal) + ') lebih besar dari sisa hutang (' + fmtRpFull(st.sisa) + '). Lanjut tetap?')) return;
  }

  try {
    await dbInsert('hutang_pembayaran', {
      bon_id: bonId,
      tanggal: tanggal,
      nominal: nominal,
      kas_akun_id: akunK,
      catatan: catatan,
    });

    // Entry ke Kas & Jurnal (tipe 'keluar') — kolom sama persis dgn yg dipakai kas.js
    await dbInsert('jurnal', {
      tanggal: tanggal,
      keterangan: 'Bayar hutang supplier' + (catatan ? ' — ' + catatan : ''),
      referensi: b.no_nota || null,
      tipe: 'keluar',
      akun_debit_id: akunD,
      akun_kredit_id: akunK,
      nominal: nominal,
      debit: nominal,
      kredit: nominal,
    });

    // Update status bon kalau udah lunas
    var newSisa = Math.max(0, st.sisa - nominal);
    if (newSisa <= 0 && b.status !== 'lunas') {
      await dbUpdate('hutang_bon', bonId, { status: 'lunas' });
    }

    hsCloseSheet('hs-sheet-detail');
    await loadHutangSupplier();
  } catch(e) {
    alert('Gagal simpan pembayaran: ' + e.message);
  }
}

// ─── UTIL ───────────────────────────────────────────────────────
function _hsEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
function _hsEscAttr(s) { return _hsEsc(s); }

function _hsFmtTgl(iso) {
  if (!iso) return '—';
  var d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  var bln = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return String(d.getDate()).padStart(2,'0') + ' ' + bln[d.getMonth()] + ' ' + d.getFullYear();
}
