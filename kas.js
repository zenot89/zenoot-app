// ─── KAS.JS — Double Entry Bookkeeping + Kategori Custom ─────
// Struktur: Chart of Accounts (COA) + Jurnal Umum + Laporan otomatis

// ─── STATE ───────────────────────────────────────────────────
let _kasAkunMap   = {};
let _kasJurnalAll = [];

// ─── HTML PAGE ───────────────────────────────────────────────
document.getElementById('page-kas').innerHTML = `
<style>
  .kas-tabs { display:flex; gap:6px; flex-wrap:wrap; }
  .kas-tab  { padding:6px 14px; border:2px solid var(--ink); background:var(--cream); font-family:var(--f); font-size:13px; font-weight:700; cursor:pointer; border-radius:2px; color:var(--ink); }
  .kas-tab.active { background:var(--ink); color:var(--cream); }
  .kas-panel { display:none; }
  .kas-panel.active { display:block; }
  .akun-badge { display:inline-block; padding:2px 7px; border-radius:2px; font-size:11px; font-weight:700; border:1.5px solid currentColor; }
  .akun-aset      { color:#2a6e3a; }
  .akun-kewajiban { color:#b03020; }
  .akun-modal     { color:#1a4a8a; }
  .akun-pendapatan{ color:#2a6e3a; }
  .akun-beban     { color:#b03020; }
  .kas-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:10px; }
  @media(max-width:520px){ .kas-summary{ grid-template-columns:1fr 1fr; } }
  .lap-head td  { font-weight:700; background:var(--cream2); border-top:2px solid var(--ink); }
  .lap-sub  td  { padding-left:24px !important; color:var(--ink2); }
  .lap-total td { font-weight:700; border-top:2px dashed var(--ink3); }
  .lap-result td{ font-weight:700; font-size:15px; border-top:2px solid var(--ink); border-bottom:2px solid var(--ink); }
</style>

<!-- ═══ KAS TOP BAR — freeze di atas, bisa collapse dengan swipe ═══ -->
<div id="kas-top-bar">
  <!-- Baris 1: Tab navigasi -->
  <div style="margin-bottom:8px">
    <div class="kas-tabs">
      <button class="kas-tab active" onclick="kasGotoTab('jurnal')">📒 Jurnal Harian</button>
      <button class="kas-tab" onclick="kasGotoTab('laporan')">📊 Laporan</button>
      <button class="kas-tab" onclick="kasGotoTab('akun')">⚙ Kelola Akun</button>
    </div>
  </div>
  <!-- Baris 2: Summary metrics — ikut collapse -->
  <div class="kas-summary">
    <div class="metric"><div class="m-label">Kas Masuk</div><div class="m-value" id="kas-total-masuk">—</div><div class="m-delta">total debit kas</div></div>
    <div class="metric"><div class="m-label">Kas Keluar</div><div class="m-value" id="kas-total-keluar">—</div><div class="m-delta">total kredit kas</div></div>
    <div class="metric"><div class="m-label">Saldo Kas</div><div class="m-value" id="kas-saldo">—</div><div class="m-delta">saldo akhir</div></div>
  </div>
  <!-- Baris 3: Toolbar filter — hanya tampil di Jurnal Harian -->
  <div id="kas-jurnal-toolbar" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px">
    <button class="btn btn-sm" onclick="loadKasJurnal()"><i class="ti ti-refresh"></i> Refresh</button>
    <button class="btn btn-sm" onclick="kasExportCSV()"><i class="ti ti-download"></i> Export CSV</button>
    <input type="month" id="kas-filter-bulan" style="font-family:var(--f);font-size:12px;padding:4px 8px;border:2px solid var(--ink);background:var(--cream)" onchange="kasApplyFilter()">
    <button class="btn btn-sm" onclick="kasResetFilter()">Semua</button>
  </div>
</div>

<!-- PANEL: JURNAL -->
<div id="kas-panel-jurnal" class="kas-panel active">
  <div class="card" id="kas-jurnal-card">
    <!-- Sticky header dalam card: judul + Anggaran + Tambah Transaksi -->
    <div id="kas-sticky-header">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0">
        <span><i class="ti ti-list"></i> Buku Jurnal Harian</span>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <button class="btn btn-sm" onclick="gotoPage('anggaran',null)" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap"><i class="ti ti-chart-pie"></i> Anggaran</button>
          <button class="btn btn-sm btn-primary" onclick="kasShowForm()" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;white-space:nowrap"><i class="ti ti-plus"></i> Tambah Transaksi</button>
        </div>
      </div>
    </div>
    <div id="kas-jurnal-tbl-wrap">
      <table class="tbl">
        <thead><tr><th>Tanggal</th><th>Ref</th><th>Keterangan</th><th>Akun Debit</th><th>Akun Kredit</th><th style="text-align:right">Debit</th><th style="text-align:right">Kredit</th><th>Aksi</th></tr></thead>
        <tbody id="kas-jurnal-tbody"><tr><td colspan="8" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
      </table>
      <div id="kas-jurnal-footer" style="font-size:12px;color:var(--ink3);padding:8px 10px;text-align:right"></div>
    </div>
  </div>
</div>

<!-- PANEL: LAPORAN -->
<div id="kas-panel-laporan" class="kas-panel" style="overflow-y:auto;overscroll-behavior:none;touch-action:pan-y">
  <!-- Navigasi 3 sub-laporan -->
  <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid var(--ink);flex-wrap:wrap">
    <button id="lap-tab-neraca" onclick="kasLapTab('neraca')"
      style="padding:7px 18px;font-family:var(--f);font-size:13px;font-weight:700;border:2px solid var(--ink);border-bottom:none;background:var(--ink);color:var(--cream);cursor:pointer;margin-bottom:-2px">
      <i class="ti ti-scale"></i> Neraca Saldo
    </button>
    <button id="lap-tab-labarugi" onclick="kasLapTab('labarugi')"
      style="padding:7px 18px;font-family:var(--f);font-size:13px;font-weight:700;border:2px solid var(--ink);border-bottom:none;border-left:none;background:var(--cream);color:var(--ink);cursor:pointer;margin-bottom:-2px">
      <i class="ti ti-chart-line"></i> Laba Rugi
    </button>
    <button id="lap-tab-aruskas" onclick="kasLapTab('aruskas')"
      style="padding:7px 18px;font-family:var(--f);font-size:13px;font-weight:700;border:2px solid var(--ink);border-bottom:none;border-left:none;background:var(--cream);color:var(--ink);cursor:pointer;margin-bottom:-2px">
      <i class="ti ti-arrows-exchange"></i> Arus Kas
    </button>
    <div style="margin-left:auto;display:flex;gap:6px;align-items:center;padding-bottom:4px">
      <button class="btn btn-sm btn-primary" onclick="kasRenderLaporan()"><i class="ti ti-refresh"></i> Refresh</button>
      <input type="month" id="kas-lap-bulan" style="font-family:var(--f);font-size:12px;padding:4px 8px;border:2px solid var(--ink);background:var(--cream)" onchange="kasRenderLaporan()">
      <button class="btn btn-sm" onclick="document.getElementById('kas-lap-bulan').value='';kasRenderLaporan()">Semua</button>
    </div>
  </div>

  <!-- Sub-panel: Neraca Saldo -->
  <div id="lap-panel-neraca">
    <div class="card">
      <div class="card-title"><i class="ti ti-scale"></i> Neraca Saldo</div>
      <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
        <thead><tr><th>Kode</th><th>Nama Akun</th><th>Kelompok</th><th style="text-align:right">Debit</th><th style="text-align:right">Kredit</th><th style="text-align:right">Saldo</th></tr></thead>
        <tbody id="kas-neraca-tbody"></tbody>
      </table></div>
    </div>
  </div>

  <!-- Sub-panel: Laba Rugi -->
  <div id="lap-panel-labarugi" style="display:none">
    <div class="card">
      <div class="card-title"><i class="ti ti-chart-line"></i> Laporan Laba Rugi</div>
      <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
        <thead><tr><th>Uraian</th><th style="text-align:right">Jumlah</th></tr></thead>
        <tbody id="kas-labarugi-tbody"></tbody>
      </table></div>
    </div>
  </div>

  <!-- Sub-panel: Arus Kas -->
  <div id="lap-panel-aruskas" style="display:none">
    <div class="card">
      <div class="card-title"><i class="ti ti-arrows-exchange"></i> Arus Kas</div>
      <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
        <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Akun</th><th style="text-align:right">Masuk</th><th style="text-align:right">Keluar</th><th style="text-align:right">Saldo</th></tr></thead>
        <tbody id="kas-aruskas-tbody"></tbody>
      </table></div>
    </div>
  </div>
</div>

<!-- PANEL: KELOLA AKUN -->
<div id="kas-panel-akun" class="kas-panel">
  <div style="margin-bottom:10px;padding:10px 14px;background:var(--cream2);border:2px dashed var(--ink3);font-size:13px;color:var(--ink2);line-height:1.7">
    <b>Chart of Accounts</b> — daftar akun keuangan bisnis kamu.<br>
    Kelompok sudah fixed (Aset, Kewajiban, Modal, Pendapatan, Beban) — tambah akun baru di dalam kelompok yang sesuai.
  </div>
  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
      <span><i class="ti ti-list"></i> Daftar Akun (Chart of Accounts)</span>
      <button class="btn btn-sm btn-primary" onclick="kasShowFormAkun()"><i class="ti ti-plus"></i> Tambah Akun</button>
    </div>
    <div class="tbl-wrap" style="overflow-x:auto"><table class="tbl">
      <thead><tr><th>Kode</th><th>Nama Akun</th><th>Kelompok</th><th>Sub Kelompok</th><th>Aksi</th></tr></thead>
      <tbody id="kas-akun-tbody"><tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr></tbody>
    </table></div>
  </div>
</div>
`;

setTimeout(() => {
  if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-kas'));
  _kasEnsureFlexLayout();
}, 80);

// Inject modals ke body
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function(){ document.body.insertAdjacentHTML('beforeend', `
<!-- ═══════════════════════════════════════════════════════════ -->
<!-- MODAL: TAMBAH/EDIT TRANSAKSI                               -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="modal-overlay" id="modal-kas-transaksi" onclick="if(event.target===this)hideModal('modal-kas-transaksi')">
  <div class="modal" style="max-width:520px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" id="kas-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-plus"></i> Tambah Transaksi</div>
      <button onclick="hideModal('modal-kas-transaksi')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="kas-jrn-id">
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 120px;min-width:110px"><label>Tanggal</label><input type="date" id="kas-jrn-tgl"></div>
      <div class="form-group" style="flex:1 1 140px;min-width:130px"><label>Tipe</label>
        <select id="kas-jrn-tipe" onchange="kasOnTipeChange()" style="width:100%">
          <option value="masuk">💰 Uang Masuk</option>
          <option value="keluar">💸 Uang Keluar</option>
          <option value="jurnal">📋 Jurnal Umum</option>
        </select>
      </div>
      <div class="form-group" style="flex:1 1 130px;min-width:120px"><label>Nominal (Rp)</label><input type="text" inputmode="numeric" id="kas-jrn-nominal" placeholder="0" oninput="kasHitungJurnal()"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 160px;min-width:140px">
        <label id="kas-lbl-debit">Akun Debit (Masuk ke)</label>
        <select id="kas-jrn-akun-debit" style="display:none" onchange="kasHitungJurnal()"><option value="">— Pilih Akun —</option></select>
        <div class="kas-akun-wrap">
          <div class="kas-akun-picker" id="picker-debit" data-target="kas-jrn-akun-debit" onmousedown="event.stopPropagation();kasTogglePicker('picker-debit')" ontouchend="event.preventDefault();event.stopPropagation();kasTogglePicker('picker-debit')">
            <span id="picker-debit-label" style="color:var(--ink3)">— Pilih Akun —</span>
            <i class="ti ti-chevron-down" style="font-size:11px;margin-left:auto;flex-shrink:0"></i>
          </div>
          <div class="kas-akun-list" id="picker-debit-list" style="display:none"></div>
        </div>
      </div>
      <div class="form-group" style="flex:1 1 160px;min-width:140px">
        <label id="kas-lbl-kredit">Akun Kredit (Keluar dari)</label>
        <select id="kas-jrn-akun-kredit" style="display:none" onchange="kasHitungJurnal()"><option value="">— Pilih Akun —</option></select>
        <div class="kas-akun-wrap">
          <div class="kas-akun-picker" id="picker-kredit" data-target="kas-jrn-akun-kredit" onmousedown="event.stopPropagation();kasTogglePicker('picker-kredit')" ontouchend="event.preventDefault();event.stopPropagation();kasTogglePicker('picker-kredit')">
            <span id="picker-kredit-label" style="color:var(--ink3)">— Pilih Akun —</span>
            <i class="ti ti-chevron-down" style="font-size:11px;margin-left:auto;flex-shrink:0"></i>
          </div>
          <div class="kas-akun-list" id="picker-kredit-list" style="display:none"></div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:2 1 200px"><label>Keterangan</label><input type="text" id="kas-jrn-ket" placeholder="mis: bayar iklan Shopee..."></div>
      <div class="form-group" style="flex:1 1 120px"><label>No. Referensi <span style="color:var(--ink3);font-weight:400">(opsional)</span></label><input type="text" id="kas-jrn-ref" placeholder="mis: INV-001"></div>
    </div>
    <div id="kas-preview-entry" style="display:none;background:var(--cream2);border:1.5px dashed var(--ink3);padding:8px 12px;border-radius:2px;font-size:12px;margin-bottom:10px;color:var(--ink2)">
      <b>Preview Jurnal:</b><br><span id="kas-preview-text"></span>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="kasSimpanJurnal()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-kas-transaksi')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>

<!-- MODAL: TAMBAH/EDIT AKUN -->
<div class="modal-overlay" id="modal-kas-akun" onclick="if(event.target===this)hideModal('modal-kas-akun')">
  <div class="modal" style="max-width:520px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" id="akun-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-plus"></i> Tambah Akun Baru</div>
      <button onclick="hideModal('modal-kas-akun')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="akun-edit-id">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:10px">
      <div class="form-group" style="flex:0 1 100px;min-width:90px"><label>Kode Akun</label><input type="text" id="akun-kode" placeholder="mis: 1-001"></div>
      <div class="form-group" style="flex:1 1 160px;min-width:140px"><label>Nama Akun</label><input type="text" id="akun-nama" placeholder="mis: Kas Tunai"></div>
      <div class="form-group" style="flex:1 1 140px;min-width:120px"><label>Kelompok</label>
        <select id="akun-kelompok" style="width:100%">
          <option value="aset">Aset</option>
          <option value="kewajiban">Kewajiban</option>
          <option value="modal">Modal</option>
          <option value="pendapatan">Pendapatan</option>
          <option value="beban">Beban</option>
        </select>
      </div>
      <div class="form-group" style="flex:1 1 140px;min-width:120px"><label>Sub Kelompok <span style="color:var(--ink3);font-weight:400">(opsional)</span></label><input type="text" id="akun-sub" placeholder="mis: Kas & Bank"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="kasSimpanAkun()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-kas-akun')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>
`); });
} else {
  document.body.insertAdjacentHTML('beforeend', `
<!-- ═══════════════════════════════════════════════════════════ -->
<!-- MODAL: TAMBAH/EDIT TRANSAKSI                               -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="modal-overlay" id="modal-kas-transaksi" onclick="if(event.target===this)hideModal('modal-kas-transaksi')">
  <div class="modal" style="max-width:520px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" id="kas-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-plus"></i> Tambah Transaksi</div>
      <button onclick="hideModal('modal-kas-transaksi')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="kas-jrn-id">
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 120px;min-width:110px"><label>Tanggal</label><input type="date" id="kas-jrn-tgl"></div>
      <div class="form-group" style="flex:1 1 140px;min-width:130px"><label>Tipe</label>
        <select id="kas-jrn-tipe" onchange="kasOnTipeChange()" style="width:100%">
          <option value="masuk">💰 Uang Masuk</option>
          <option value="keluar">💸 Uang Keluar</option>
          <option value="jurnal">📋 Jurnal Umum</option>
        </select>
      </div>
      <div class="form-group" style="flex:1 1 130px;min-width:120px"><label>Nominal (Rp)</label><input type="text" inputmode="numeric" id="kas-jrn-nominal" placeholder="0" oninput="kasHitungJurnal()"></div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:1 1 160px;min-width:140px">
        <label id="kas-lbl-debit">Akun Debit (Masuk ke)</label>
        <select id="kas-jrn-akun-debit" style="display:none" onchange="kasHitungJurnal()"><option value="">— Pilih Akun —</option></select>
        <div class="kas-akun-wrap">
          <div class="kas-akun-picker" id="picker-debit" data-target="kas-jrn-akun-debit" onmousedown="event.stopPropagation();kasTogglePicker('picker-debit')" ontouchend="event.preventDefault();event.stopPropagation();kasTogglePicker('picker-debit')">
            <span id="picker-debit-label" style="color:var(--ink3)">— Pilih Akun —</span>
            <i class="ti ti-chevron-down" style="font-size:11px;margin-left:auto;flex-shrink:0"></i>
          </div>
          <div class="kas-akun-list" id="picker-debit-list" style="display:none"></div>
        </div>
      </div>
      <div class="form-group" style="flex:1 1 160px;min-width:140px">
        <label id="kas-lbl-kredit">Akun Kredit (Keluar dari)</label>
        <select id="kas-jrn-akun-kredit" style="display:none" onchange="kasHitungJurnal()"><option value="">— Pilih Akun —</option></select>
        <div class="kas-akun-wrap">
          <div class="kas-akun-picker" id="picker-kredit" data-target="kas-jrn-akun-kredit" onmousedown="event.stopPropagation();kasTogglePicker('picker-kredit')" ontouchend="event.preventDefault();event.stopPropagation();kasTogglePicker('picker-kredit')">
            <span id="picker-kredit-label" style="color:var(--ink3)">— Pilih Akun —</span>
            <i class="ti ti-chevron-down" style="font-size:11px;margin-left:auto;flex-shrink:0"></i>
          </div>
          <div class="kas-akun-list" id="picker-kredit-list" style="display:none"></div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div class="form-group" style="flex:2 1 200px"><label>Keterangan</label><input type="text" id="kas-jrn-ket" placeholder="mis: bayar iklan Shopee..."></div>
      <div class="form-group" style="flex:1 1 120px"><label>No. Referensi <span style="color:var(--ink3);font-weight:400">(opsional)</span></label><input type="text" id="kas-jrn-ref" placeholder="mis: INV-001"></div>
    </div>
    <div id="kas-preview-entry" style="display:none;background:var(--cream2);border:1.5px dashed var(--ink3);padding:8px 12px;border-radius:2px;font-size:12px;margin-bottom:10px;color:var(--ink2)">
      <b>Preview Jurnal:</b><br><span id="kas-preview-text"></span>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="kasSimpanJurnal()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-kas-transaksi')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>

<!-- MODAL: TAMBAH/EDIT AKUN -->
<div class="modal-overlay" id="modal-kas-akun" onclick="if(event.target===this)hideModal('modal-kas-akun')">
  <div class="modal" style="max-width:520px;width:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" id="akun-form-title" style="margin:0;border:none;padding:0;font-size:18px"><i class="ti ti-plus"></i> Tambah Akun Baru</div>
      <button onclick="hideModal('modal-kas-akun')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="akun-edit-id">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:10px">
      <div class="form-group" style="flex:0 1 100px;min-width:90px"><label>Kode Akun</label><input type="text" id="akun-kode" placeholder="mis: 1-001"></div>
      <div class="form-group" style="flex:1 1 160px;min-width:140px"><label>Nama Akun</label><input type="text" id="akun-nama" placeholder="mis: Kas Tunai"></div>
      <div class="form-group" style="flex:1 1 140px;min-width:120px"><label>Kelompok</label>
        <select id="akun-kelompok" style="width:100%">
          <option value="aset">Aset</option>
          <option value="kewajiban">Kewajiban</option>
          <option value="modal">Modal</option>
          <option value="pendapatan">Pendapatan</option>
          <option value="beban">Beban</option>
        </select>
      </div>
      <div class="form-group" style="flex:1 1 140px;min-width:120px"><label>Sub Kelompok <span style="color:var(--ink3);font-weight:400">(opsional)</span></label><input type="text" id="akun-sub" placeholder="mis: Kas & Bank"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-primary btn-sm" onclick="kasSimpanAkun()"><i class="ti ti-device-floppy"></i> Simpan</button>
      <button class="btn btn-sm" onclick="hideModal('modal-kas-akun')"><i class="ti ti-x"></i> Batal</button>
    </div>
  </div>
</div>
`);
}

// ─── TAB ─────────────────────────────────────────────────────
function kasGotoTab(tab) {
  const tabs = ['jurnal','laporan','akun'];
  document.querySelectorAll('#page-kas .kas-tab').forEach((t,i) => t.classList.toggle('active', tabs[i] === tab));
  // Scope selector ke #page-kas agar tidak bertabrakan dengan komponen lain
  document.querySelectorAll('#page-kas .kas-panel').forEach(p => {
    p.classList.remove('active');
    p.style.overflowY = '';
    p.style.height    = '';
    p.style.maxHeight = '';
    p.style.padding   = '';
  });
  var targetPanel = document.getElementById('kas-panel-' + tab);
  if (targetPanel) {
    targetPanel.classList.add('active');
    // Tab Laporan & Kelola Akun: scroll normal dalam panel
    if (tab !== 'jurnal') {
      var topBar = document.getElementById('kas-top-bar');
      var tabBar = document.querySelector('#page-kas .kas-tabs');
      var usedH  = (topBar ? topBar.offsetHeight : 0) + (tabBar ? tabBar.offsetHeight : 0) + 32;
      targetPanel.style.overflowY = 'auto';
      targetPanel.style.overflowX = 'hidden';
      targetPanel.style.height    = 'calc(100vh - ' + usedH + 'px)';
      targetPanel.style.maxHeight = 'calc(100vh - ' + usedH + 'px)';
      targetPanel.style.padding   = '0 0 40px 0';
      targetPanel.style.webkitOverflowScrolling = 'touch';
    }
  }
  // Tampilkan toolbar hanya di tab jurnal
  var toolbar = document.getElementById('kas-jurnal-toolbar');
  if (toolbar) toolbar.style.display = tab === 'jurnal' ? 'flex' : 'none';
  // Fetch fresh data saat switch tab
  if (tab === 'laporan') kasRenderLaporan();   // async: fetch fresh jurnal + akun
  if (tab === 'akun')    kasLoadAkun();         // async: fetch fresh akun list
}

// ─── LOAD AKUN ───────────────────────────────────────────────
async function kasLoadAkun() {
  try {
    const data = await dbGet('kas_akun', '&order=kode.asc');
    _kasAkunMap = {};
    (data || []).forEach(a => { _kasAkunMap[a.id] = a; });
    kasRenderAkunTabel(data || []);
    kasPopulateAkunDropdown(data || []);
  } catch(e) {
    document.getElementById('kas-akun-tbody').innerHTML = `<tr><td colspan="5" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
  }
}

function kasKelompokLabel(k) {
  return { aset:'Aset', kewajiban:'Kewajiban', modal:'Modal', pendapatan:'Pendapatan', beban:'Beban' }[k] || k;
}

function kasRenderAkunTabel(data) {
  const tbody = document.getElementById('kas-akun-tbody');
  if (!data.length) { tbody.innerHTML = `<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Belum ada akun</td></tr>`; return; }
  const order = ['aset','kewajiban','modal','pendapatan','beban'];
  const sorted = [...data].sort((a,b) => { const ki = order.indexOf(a.kelompok) - order.indexOf(b.kelompok); return ki !== 0 ? ki : (a.kode||'').localeCompare(b.kode||''); });
  tbody.innerHTML = sorted.map(a => {
    const safeNama = (a.nama||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    return `<tr>
      <td style="font-weight:700;font-family:monospace">${a.kode||'—'}</td>
      <td>${a.nama||'—'}</td>
      <td><span class="akun-badge akun-${a.kelompok}">${kasKelompokLabel(a.kelompok)}</span></td>
      <td style="color:var(--ink3);font-size:12px">${a.sub_kelompok||'—'}</td>
      <td>
        <button class="btn btn-sm" data-action="edit-akun" data-id="${a.id}" style="margin-right:4px"><i class="ti ti-edit"></i></button>
        <button class="btn btn-sm btn-danger" data-action="hapus-akun" data-id="${a.id}" data-nama="${safeNama}"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function kasPopulateAkunDropdown(data) {
  const order = ['aset','kewajiban','modal','pendapatan','beban'];
  const grouped = {}; order.forEach(k => grouped[k] = []);
  data.forEach(a => { if (grouped[a.kelompok]) grouped[a.kelompok].push(a); });
  let html = '<option value="">— Pilih Akun —</option>';
  order.forEach(k => {
    if (!grouped[k].length) return;
    html += `<optgroup label="── ${kasKelompokLabel(k)} ──">`;
    grouped[k].forEach(a => { html += `<option value="${a.id}">${a.kode ? a.kode+' · ' : ''}${a.nama}</option>`; });
    html += '</optgroup>';
  });
  ['kas-jrn-akun-debit','kas-jrn-akun-kredit'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = html; });
  // Populate custom picker list
  kasPopulatePickerList('picker-debit-list', data);
  kasPopulatePickerList('picker-kredit-list', data);
}

async function kasSimpanAkun() {
  const id   = document.getElementById('akun-edit-id').value;
  const data = { kode: document.getElementById('akun-kode').value.trim(), nama: document.getElementById('akun-nama').value.trim(), kelompok: document.getElementById('akun-kelompok').value, sub_kelompok: document.getElementById('akun-sub').value.trim() || null };
  if (!data.nama) { alert('Nama akun wajib diisi!'); return; }
  try {
    if (id) { await dbUpdate('kas_akun', id, data); } else { await dbInsert('kas_akun', data); }
    kasResetFormAkun(); kasLoadAkun();
  } catch(e) { alert('Gagal simpan: ' + e.message); }
}

function kasResetFormAkun() {
  ['akun-edit-id','akun-kode','akun-nama','akun-sub'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('akun-kelompok').value = 'aset';
  document.getElementById('akun-form-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Akun Baru';
}

function kasShowFormAkun() {
  kasResetFormAkun();
  showModal('modal-kas-akun');
}

async function kasEditAkun(id) {
  const a = _kasAkunMap[id]; if (!a) return;
  document.getElementById('akun-edit-id').value  = a.id;
  document.getElementById('akun-kode').value     = a.kode || '';
  document.getElementById('akun-nama').value     = a.nama || '';
  document.getElementById('akun-kelompok').value = a.kelompok || 'aset';
  document.getElementById('akun-sub').value      = a.sub_kelompok || '';
  document.getElementById('akun-form-title').innerHTML = '<i class="ti ti-edit"></i> Edit Akun';
  showModal('modal-kas-akun');
}

async function kasHapusAkun(id, nama) {
  confirmDelete(`Hapus akun "${nama}"?`, async () => {
    try { await dbDelete('kas_akun', id); kasLoadAkun(); } catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// ─── FORM JURNAL ─────────────────────────────────────────────
function kasShowForm() {
  document.getElementById('kas-form-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Transaksi';
  document.getElementById('kas-jrn-id').value = '';
  (function() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth()+1).padStart(2,'0');
    var d = String(now.getDate()).padStart(2,'0');
    document.getElementById('kas-jrn-tgl').value = y+'-'+m+'-'+d;
  })();
  document.getElementById('kas-jrn-tipe').value = 'masuk';
  idrSet('kas-jrn-nominal', 0);
  document.getElementById('kas-jrn-ket').value = '';
  document.getElementById('kas-jrn-ref').value = '';
  document.getElementById('kas-preview-entry').style.display = 'none';
  kasOnTipeChange();
  showModal('modal-kas-transaksi');
  setTimeout(function() { if (typeof idrInput === 'function') idrInput('kas-jrn-nominal'); }, 50);
}

function kasCancelForm() { hideModal('modal-kas-transaksi'); }

function kasOnTipeChange() {
  const tipe = document.getElementById('kas-jrn-tipe').value;
  const lblD = document.getElementById('kas-lbl-debit');
  const lblK = document.getElementById('kas-lbl-kredit');
  if (tipe === 'masuk')  { lblD.textContent = 'Masuk ke Akun (Debit)';  lblK.textContent = 'Sumber Dana (Kredit)'; }
  else if (tipe === 'keluar') { lblD.textContent = 'Beban / Tujuan (Debit)'; lblK.textContent = 'Keluar dari Akun (Kredit)'; }
  else { lblD.textContent = 'Akun Debit'; lblK.textContent = 'Akun Kredit'; }
  kasHitungJurnal();
}

function kasHitungJurnal() {
  const nominal = idrVal('kas-jrn-nominal');
  const akunDId = document.getElementById('kas-jrn-akun-debit').value;
  const akunKId = document.getElementById('kas-jrn-akun-kredit').value;
  const akunD   = _kasAkunMap[akunDId];
  const akunK   = _kasAkunMap[akunKId];
  const preview = document.getElementById('kas-preview-entry');
  if (!nominal || !akunD || !akunK) { preview.style.display = 'none'; return; }
  const fmtRp = v => fmtRpFull(v);
  document.getElementById('kas-preview-text').innerHTML =
    `<b>Debit</b>  : ${akunD.kode ? akunD.kode+' ' : ''}${akunD.nama} &nbsp; ${fmtRp(nominal)}<br>` +
    `<b>Kredit</b> : ${akunK.kode ? akunK.kode+' ' : ''}${akunK.nama} &nbsp; ${fmtRp(nominal)}`;
  preview.style.display = 'block';
}

async function kasSimpanJurnal() {
  const id      = document.getElementById('kas-jrn-id').value;
  const nominal = idrVal('kas-jrn-nominal');
  const akunDId = document.getElementById('kas-jrn-akun-debit').value;
  const akunKId = document.getElementById('kas-jrn-akun-kredit').value;
  const tgl     = document.getElementById('kas-jrn-tgl').value;
  if (!tgl)             { alert('Tanggal wajib diisi!'); return; }
  if (!nominal)         { alert('Nominal wajib diisi!'); return; }
  if (!akunDId)         { alert('Akun Debit wajib dipilih!'); return; }
  if (!akunKId)         { alert('Akun Kredit wajib dipilih!'); return; }
  if (akunDId===akunKId){ alert('Akun Debit dan Kredit tidak boleh sama!'); return; }
  const data = {
    tanggal:        tgl,
    keterangan:     document.getElementById('kas-jrn-ket').value.trim(),
    referensi:      document.getElementById('kas-jrn-ref').value.trim() || null,
    tipe:           document.getElementById('kas-jrn-tipe').value,
    akun_debit_id:  akunDId,
    akun_kredit_id: akunKId,
    nominal:        nominal,
    debit:          nominal,
    kredit:         nominal,
  };
  try {
    if (id) { await dbUpdate('jurnal', id, data); } else { await dbInsert('jurnal', data); }
    kasCancelForm(); loadKasJurnal();
  } catch(e) { alert('Gagal simpan: ' + e.message); }
}

// ─── LOAD JURNAL ─────────────────────────────────────────────
async function loadKasJurnal() {
  document.getElementById('kas-jurnal-tbody').innerHTML = `<tr><td colspan="8" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>`;
  try {
    const [jurnal, akun] = await Promise.all([
      dbGet('jurnal', '&order=tanggal.desc,created_at.desc'),
      dbGet('kas_akun', '&order=kode.asc'),
    ]);
    _kasAkunMap = {};
    (akun || []).forEach(a => { _kasAkunMap[a.id] = a; });
    kasPopulateAkunDropdown(akun || []);
    _kasJurnalAll = jurnal || [];
    kasApplyFilter();
  } catch(e) {
    document.getElementById('kas-jurnal-tbody').innerHTML = `<tr><td colspan="8" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
  }
}

function kasApplyFilter() {
  const bulan = document.getElementById('kas-filter-bulan').value;
  const filtered = bulan ? _kasJurnalAll.filter(r => (r.tanggal||'').startsWith(bulan)) : _kasJurnalAll;
  _kasCurrentPage = 1;
  _kasFilteredData = filtered;
  kasRenderJurnalTabel(filtered);
  kasUpdateSummary(filtered);
}

function kasResetFilter() { document.getElementById('kas-filter-bulan').value = ''; kasApplyFilter(); }

// ─── PAGINATION STATE ────────────────────────────────────────
const _KAS_PAGE_SIZE = 999999; // load semua, tidak ada pagination
let _kasCurrentPage  = 1;
let _kasFilteredData = [];

function kasRenderJurnalTabel(data) {
  _kasFilteredData = data;
  const tbody   = document.getElementById('kas-jurnal-tbody');
  const totalPg = Math.max(1, Math.ceil(data.length / _KAS_PAGE_SIZE));
  if (_kasCurrentPage > totalPg) _kasCurrentPage = totalPg;
  const start   = (_kasCurrentPage - 1) * _KAS_PAGE_SIZE;
  const slice   = data.slice(start, start + _KAS_PAGE_SIZE);

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="color:var(--ink3);font-style:italic">Belum ada transaksi</td></tr>';
    _kasRenderPagination(0, 0);
    return;
  }
  const fmtRp = v => fmtRpFull(v);
  tbody.innerHTML = slice.map(r => {
    const _tglParts = (r.tanggal||'').split('-');
    const tgl = _tglParts.length===3 ? _tglParts[2]+'/'+_tglParts[1]+'/'+_tglParts[0].slice(2) : (r.tanggal||'—');
    const akunD = _kasAkunMap[r.akun_debit_id];
    const akunK = _kasAkunMap[r.akun_kredit_id];
    const nmD   = akunD ? '<span class="akun-badge akun-'+akunD.kelompok+'">'+akunD.nama+'</span>' : '—';
    const nmK   = akunK ? '<span class="akun-badge akun-'+akunK.kelompok+'">'+akunK.nama+'</span>' : '—';
    const safeKet = (r.keterangan||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    return '<tr>' +
      '<td style="white-space:nowrap">'+tgl+'</td>' +
      '<td style="color:var(--ink3);font-size:11px">'+(r.referensi||'—')+'</td>' +
      '<td>'+(r.keterangan||'—')+'</td>' +
      '<td>'+nmD+'</td><td>'+nmK+'</td>' +
      '<td style="text-align:right;color:var(--ok);font-weight:600">'+fmtRp(r.debit)+'</td>' +
      '<td style="text-align:right;color:var(--danger);font-weight:600">'+fmtRp(r.kredit)+'</td>' +
      '<td>' +
        '<button class="btn btn-sm" data-action="edit-kas" data-id="'+r.id+'" style="margin-right:4px"><i class="ti ti-edit"></i></button>' +
        '<button class="btn btn-sm btn-danger" data-action="hapus-kas" data-id="'+r.id+'" data-ket="'+safeKet+'"><i class="ti ti-trash"></i></button>' +
      '</td></tr>';
  }).join('');
  _kasRenderPagination(totalPg, data.length);
}

function _kasRenderPagination(totalPg, totalData) {
  let el = document.getElementById('kas-jurnal-pagination');
  if (!el) {
    const wrap = document.querySelector('#kas-panel-jurnal .card');
    if (!wrap) return;
    el = document.createElement('div');
    el.id = 'kas-jurnal-pagination';
    wrap.appendChild(el);
  }
  el.style.cssText = 'padding:8px 4px;border-top:1px dashed var(--ink4);margin-top:4px';
  el.innerHTML = '<div style="font-size:12px;color:var(--ink3);text-align:right">Menampilkan <b style="color:var(--ink2)">'+totalData+'</b> transaksi</div>';
}

function kasGoPage(pg) { /* tidak dipakai, semua data tampil */ 
}

function kasUpdateSummary(data) {
  let masuk = 0, keluar = 0;
  data.forEach(r => {
    const aD = _kasAkunMap[r.akun_debit_id];
    const aK = _kasAkunMap[r.akun_kredit_id];
    if (aD && aD.kelompok === 'aset') masuk  += (r.nominal || r.debit  || 0);
    if (aK && aK.kelompok === 'aset') keluar += (r.nominal || r.kredit || 0);
  });
  const saldo = masuk - keluar;
  const fmtRp = v => fmtRpFull(Math.abs(v));
  document.getElementById('kas-total-masuk').textContent = fmtRp(masuk);
  document.getElementById('kas-total-keluar').textContent = fmtRp(keluar);
  document.getElementById('kas-saldo').textContent = (saldo < 0 ? '-' : '') + fmtRp(saldo);
  document.getElementById('kas-saldo').style.color = saldo >= 0 ? 'var(--ok)' : 'var(--danger)';
}

async function kasEditJurnal(id) {
  const r = _kasJurnalAll.find(x => String(x.id) === String(id)); if (!r) return;
  document.getElementById('kas-form-title').innerHTML = '<i class="ti ti-edit"></i> Edit Transaksi';
  document.getElementById('kas-jrn-id').value      = r.id;
  document.getElementById('kas-jrn-tgl').value     = r.tanggal ? r.tanggal.split('T')[0] : '';
  document.getElementById('kas-jrn-tipe').value    = r.tipe || 'masuk';
  idrSet('kas-jrn-nominal', r.nominal || r.debit || 0);
  setTimeout(function() { if (typeof idrInput === 'function') idrInput('kas-jrn-nominal'); }, 50);
  document.getElementById('kas-jrn-ket').value     = r.keterangan || '';
  document.getElementById('kas-jrn-ref').value     = r.referensi || '';
  kasOnTipeChange();
  setTimeout(() => {
    document.getElementById('kas-jrn-akun-debit').value  = r.akun_debit_id  || '';
    document.getElementById('kas-jrn-akun-kredit').value = r.akun_kredit_id || '';
    kasSyncPickerLabel('picker-debit',  'kas-jrn-akun-debit');
    kasSyncPickerLabel('picker-kredit', 'kas-jrn-akun-kredit');
    kasHitungJurnal();
  }, 50);
  showModal('modal-kas-transaksi');
}

async function kasHapusJurnal(id, ket) {
  confirmDelete(`Hapus transaksi "${ket}"?`, async () => {
    try { await dbDelete('jurnal', id); loadKasJurnal(); } catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

function kasExportCSV() {
  const bulan = document.getElementById('kas-filter-bulan').value;
  const data  = bulan ? _kasJurnalAll.filter(r => (r.tanggal||'').startsWith(bulan)) : _kasJurnalAll;
  if (!data.length) { alert('Belum ada data'); return; }
  const headers = ['Tanggal','Referensi','Keterangan','Tipe','Akun Debit','Akun Kredit','Nominal'];
  const rows = data.map(r => {
    const aD = _kasAkunMap[r.akun_debit_id]; const aK = _kasAkunMap[r.akun_kredit_id];
    return [r.tanggal, r.referensi||'', r.keterangan||'', r.tipe||'', aD?aD.nama:'', aK?aK.nama:'', r.nominal||r.debit||0];
  });
  exportCSV('zenoot-kas-jurnal.csv', headers, rows);
}

// ─── LAPORAN ─────────────────────────────────────────────────
function kasLapTab(tab) {
  ['neraca','labarugi','aruskas'].forEach(function(t) {
    var btn   = document.getElementById('lap-tab-' + t);
    var panel = document.getElementById('lap-panel-' + t);
    var active = t === tab;
    if (btn)   { btn.style.background = active ? 'var(--ink)' : 'var(--cream)'; btn.style.color = active ? 'var(--cream)' : 'var(--ink)'; }
    if (panel) panel.style.display = active ? 'block' : 'none';
  });
}

async function kasRenderLaporan() {
  // Tampilkan loading state dulu
  var loadingHtml = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat data...</td></tr>';
  var tbodies = ['kas-neraca-tbody','kas-labarugi-tbody','kas-aruskas-tbody'];
  tbodies.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = loadingHtml;
  });

  // Selalu fetch fresh dari DB agar data tidak stale/bocor dari cache jurnal harian
  try {
    const [jurnal, akun] = await Promise.all([
      dbGet('jurnal', '&order=tanggal.asc,created_at.asc'),
      dbGet('kas_akun', '&order=kode.asc'),
    ]);
    _kasAkunMap = {};
    (akun || []).forEach(a => { _kasAkunMap[a.id] = a; });
    _kasJurnalAll = jurnal || [];
  } catch(e) {
    console.error('[kasRenderLaporan] gagal fetch data:', e.message);
    tbodies.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '<tr><td colspan="6" style="color:var(--danger)">Gagal memuat data. Cek koneksi dan refresh.</td></tr>';
    });
    return; // jangan render dengan data lama yang mungkin salah
  }
  const bulan = document.getElementById('kas-lap-bulan') ? document.getElementById('kas-lap-bulan').value : '';
  const data  = bulan ? _kasJurnalAll.filter(r => (r.tanggal||'').startsWith(bulan)) : _kasJurnalAll;
  kasRenderNeraca(data); kasRenderLabaRugi(data); kasRenderArusKas(data);
}

function kasRenderNeraca(data) {
  const tbody = document.getElementById('kas-neraca-tbody');
  const saldoMap = {};
  data.forEach(r => {
    const n = r.nominal || r.debit || 0;
    if (r.akun_debit_id)  { if (!saldoMap[r.akun_debit_id])  saldoMap[r.akun_debit_id]  = {debit:0,kredit:0}; saldoMap[r.akun_debit_id].debit   += n; }
    if (r.akun_kredit_id) { if (!saldoMap[r.akun_kredit_id]) saldoMap[r.akun_kredit_id] = {debit:0,kredit:0}; saldoMap[r.akun_kredit_id].kredit += n; }
  });
  const order = ['aset','kewajiban','modal','pendapatan','beban'];
  const fmtRp = v => fmtRpFull(v);
  let html = '', totalD = 0, totalK = 0;
  order.forEach(k => {
    const akuns = Object.values(_kasAkunMap).filter(a => a.kelompok === k).sort((a,b) => (a.kode||'').localeCompare(b.kode||''));
    if (!akuns.length) return;
    html += `<tr class="lap-head"><td colspan="6">${kasKelompokLabel(k).toUpperCase()}</td></tr>`;
    akuns.forEach(a => {
      const s = saldoMap[a.id] || {debit:0,kredit:0};
      const saldo = ['aset','beban'].includes(k) ? s.debit - s.kredit : s.kredit - s.debit;
      totalD += s.debit; totalK += s.kredit;
      html += `<tr>
        <td style="font-family:monospace;font-size:12px">${a.kode||'—'}</td><td>${a.nama}</td>
        <td><span class="akun-badge akun-${k}">${kasKelompokLabel(k)}</span></td>
        <td style="text-align:right;color:var(--ok)">${fmtRp(s.debit)}</td>
        <td style="text-align:right;color:var(--danger)">${fmtRp(s.kredit)}</td>
        <td style="text-align:right;font-weight:700;color:${saldo>=0?'var(--ok)':'var(--danger)'}">
          ${saldo<0?'(':''}${fmtRp(Math.abs(saldo))}${saldo<0?')':''}
        </td>
      </tr>`;
    });
  });
  html += `<tr class="lap-total"><td colspan="3"><b>TOTAL</b></td><td style="text-align:right;font-weight:700;color:var(--ok)">Rp${totalD.toLocaleString('id-ID')}</td><td style="text-align:right;font-weight:700;color:var(--danger)">Rp${totalK.toLocaleString('id-ID')}</td><td></td></tr>`;

  tbody.innerHTML = html || `<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada data</td></tr>`;
}

function kasRenderLabaRugi(data) {
  const tbody = document.getElementById('kas-labarugi-tbody');
  const saldoMap = {};
  data.forEach(r => {
    const n = r.nominal || r.debit || 0;
    if (r.akun_debit_id)  { if (!saldoMap[r.akun_debit_id])  saldoMap[r.akun_debit_id]  = {debit:0,kredit:0}; saldoMap[r.akun_debit_id].debit   += n; }
    if (r.akun_kredit_id) { if (!saldoMap[r.akun_kredit_id]) saldoMap[r.akun_kredit_id] = {debit:0,kredit:0}; saldoMap[r.akun_kredit_id].kredit += n; }
  });
  const fmtRp = v => fmtRpFull(Math.abs(v));
  const akunPend  = Object.values(_kasAkunMap).filter(a => a.kelompok === 'pendapatan');
  const akunBeban = Object.values(_kasAkunMap).filter(a => a.kelompok === 'beban');
  let totalPend = 0, totalBeban = 0, html = '';
  html += `<tr class="lap-head"><td colspan="2">PENDAPATAN</td></tr>`;
  akunPend.forEach(a => {
    const s = saldoMap[a.id] || {debit:0,kredit:0};
    const saldo = s.kredit - s.debit; totalPend += saldo;
    html += `<tr class="lap-sub"><td>${a.nama}</td><td style="text-align:right">${fmtRp(saldo)}</td></tr>`;
  });
  html += `<tr class="lap-total"><td><b>Total Pendapatan</b></td><td style="text-align:right;font-weight:700;color:var(--ok)"><b>${fmtRp(totalPend)}</b></td></tr>`;
  html += `<tr class="lap-head"><td colspan="2">BEBAN</td></tr>`;
  akunBeban.forEach(a => {
    const s = saldoMap[a.id] || {debit:0,kredit:0};
    const saldo = s.debit - s.kredit; totalBeban += saldo;
    html += `<tr class="lap-sub"><td>${a.nama}</td><td style="text-align:right;color:var(--danger)">${fmtRp(saldo)}</td></tr>`;
  });
  html += `<tr class="lap-total"><td><b>Total Beban</b></td><td style="text-align:right;font-weight:700;color:var(--danger)"><b>${fmtRp(totalBeban)}</b></td></tr>`;
  const labaRugi = totalPend - totalBeban;
  const isLaba   = labaRugi >= 0;
  html += `<tr class="lap-result"><td><b>${isLaba ? '✅ LABA BERSIH' : '❌ RUGI BERSIH'}</b></td><td style="text-align:right;color:${isLaba?'var(--ok)':'var(--danger)'}"><b>${isLaba?'':'('}${fmtRp(labaRugi)}${isLaba?'':')'}</b></td></tr>`;
  tbody.innerHTML = html || `<tr><td colspan="2" style="color:var(--ink3);font-style:italic">Belum ada data</td></tr>`;
}

// ─── PAGINATION ARUS KAS ─────────────────────────────────────
let _arusCurrentPage  = 1;
let _arusFilteredData = [];
let _arusSaldoMap     = {}; // id -> saldo kumulatif (dihitung dari ascending)

function kasRenderArusKas(data) {
  // Helper: cek apakah akun adalah kas/bank — berdasarkan sub_kelompok "KAS & BANK"
  function isKasBank(akun) {
    if (!akun || akun.kelompok !== 'aset') return false;
    return (akun.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK';
  }

  // Filter: salah satu sisi (debit atau kredit) harus akun KAS & BANK
  const filtered = data.filter(r => {
    const aD = _kasAkunMap[r.akun_debit_id];
    const aK = _kasAkunMap[r.akun_kredit_id];
    return isKasBank(aD) || isKasBank(aK);
  });

  // Sort ascending (lama ke baru) dulu untuk hitung saldo kumulatif yang benar
  const ascending = filtered.slice().sort((a, b) => {
    const d = (a.tanggal || '').localeCompare(b.tanggal || '');
    return d !== 0 ? d : String(a.id).localeCompare(String(b.id));
  });

  // Hitung saldo kumulatif per-id dari ascending
  const saldoByIdMap = {};
  let runSaldo = 0;
  ascending.forEach(r => {
    const n = r.nominal || r.debit || 0;
    const aD = _kasAkunMap[r.akun_debit_id];
    const isMasuk = isKasBank(aD);
    if (isMasuk) runSaldo += n; else runSaldo -= n;
    saldoByIdMap[r.id] = runSaldo;
  });

  // Balik ke descending (terbaru di atas) untuk tampilan
  const descending = ascending.slice().reverse();

  _arusFilteredData = descending;
  _arusSaldoMap = saldoByIdMap;
  _arusCurrentPage  = 1;
  _kasRenderArusTabel();
}

function _kasRenderArusTabel() {
  const tbody   = document.getElementById('kas-aruskas-tbody');
  const fmtRp   = v => fmtRpFull(v);
  const data    = _arusFilteredData;
  const totalPg = Math.max(1, Math.ceil(data.length / _KAS_PAGE_SIZE));
  if (_arusCurrentPage > totalPg) _arusCurrentPage = totalPg;
  const start   = (_arusCurrentPage - 1) * _KAS_PAGE_SIZE;
  const slice   = data.slice(start, start + _KAS_PAGE_SIZE);

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Belum ada arus kas</td></tr>';
    _kasRenderArusPagination(0, 0);
    return;
  }

  tbody.innerHTML = slice.map((r) => {
    const _tp = (r.tanggal||'').split('-');
    const tgl = _tp.length===3 ? _tp[2]+'/'+_tp[1]+'/'+_tp[0].slice(2) : (r.tanggal||'—');
    const n   = r.nominal || r.debit || 0;
    const aD  = _kasAkunMap[r.akun_debit_id];
    const aK  = _kasAkunMap[r.akun_kredit_id];
    const isMasuk = aD && aD.kelompok === 'aset' && (aD.sub_kelompok||'').trim().toUpperCase() === 'KAS & BANK';
    const s   = _arusSaldoMap[r.id] !== undefined ? _arusSaldoMap[r.id] : 0;
    // Kalau masuk: uang datang dari akun kredit (lawan). Kalau keluar: uang pergi ke akun debit (lawan)
    const akunLawan = isMasuk ? aK : aD;
    const akunLawanNama = akunLawan ? akunLawan.nama : '—';
    const akunLawanKelompok = akunLawan ? akunLawan.kelompok : '';
    const akunBadge = akunLawan
      ? '<span class="akun-badge akun-'+akunLawanKelompok+'" style="font-size:10px;padding:1px 6px">'+akunLawanNama+'</span>'
      : '—';
    return '<tr>' +
      '<td style="white-space:nowrap">'+tgl+'</td>' +
      '<td>'+(r.keterangan||'—')+'</td>' +
      '<td>'+akunBadge+'</td>' +
      '<td style="text-align:right;color:var(--ok)">'+(isMasuk ? fmtRp(n) : '—')+'</td>' +
      '<td style="text-align:right;color:var(--danger)">'+(!isMasuk ? fmtRp(n) : '—')+'</td>' +
      '<td style="text-align:right;font-weight:700;color:'+(s>=0?'var(--ok)':'var(--danger)')+'">'+(s<0?'-':'')+fmtRp(Math.abs(s))+'</td>' +
      '</tr>';
  }).join('');
  _kasRenderArusPagination(totalPg, data.length);
}

function _kasRenderArusPagination(totalPg, totalData) {
  let el = document.getElementById('kas-arus-pagination');
  if (!el) {
    const wrap = document.querySelector('#lap-panel-aruskas .card');
    if (!wrap) return;
    el = document.createElement('div');
    el.id = 'kas-arus-pagination';
    wrap.appendChild(el);
  }
  if (totalPg <= 1) { el.innerHTML = ''; return; }
  const start = (_arusCurrentPage - 1) * _KAS_PAGE_SIZE + 1;
  const end   = Math.min(_arusCurrentPage * _KAS_PAGE_SIZE, totalData);
  let from = Math.max(1, _arusCurrentPage - 2);
  let to   = Math.min(totalPg, from + 4);
  from     = Math.max(1, to - 4);
  const pages = [];
  for (let i = from; i <= to; i++) pages.push(i);
  const btnBase = 'padding:4px 9px;font-family:var(--f);font-size:12px;font-weight:700;border:2px solid var(--ink);border-radius:2px;cursor:pointer;';
  const btnNorm = btnBase + 'background:var(--cream);color:var(--ink);';
  const btnActv = btnBase + 'background:var(--ink);color:var(--cream);';
  const btnDsbl = btnBase + 'opacity:0.3;cursor:default;background:var(--cream);color:var(--ink);';
  el.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 4px;flex-wrap:wrap;gap:8px;border-top:1px dashed var(--ink4);margin-top:4px';
  el.innerHTML =
    '<div style="font-size:12px;color:var(--ink3)">Menampilkan <b style="color:var(--ink2)">'+start+'–'+end+'</b> dari <b style="color:var(--ink2)">'+totalData+'</b> transaksi</div>' +
    '<div style="display:flex;gap:4px;align-items:center">' +
      '<button onclick="arusGoPage(1)" '+(_arusCurrentPage===1?'disabled':'')+' style="'+(_arusCurrentPage===1?btnDsbl:btnNorm)+'"><i class="ti ti-chevrons-left"></i></button>' +
      '<button onclick="arusGoPage('+(_arusCurrentPage-1)+')" '+(_arusCurrentPage===1?'disabled':'')+' style="'+(_arusCurrentPage===1?btnDsbl:btnNorm)+'"><i class="ti ti-chevron-left"></i></button>' +
      pages.map(function(p){ return '<button onclick="arusGoPage('+p+')" style="'+(p===_arusCurrentPage?btnActv:btnNorm)+'">'+p+'</button>'; }).join('') +
      '<button onclick="arusGoPage('+(_arusCurrentPage+1)+')" '+(_arusCurrentPage===totalPg?'disabled':'')+' style="'+(_arusCurrentPage===totalPg?btnDsbl:btnNorm)+'"><i class="ti ti-chevron-right"></i></button>' +
      '<button onclick="arusGoPage('+totalPg+')" '+(_arusCurrentPage===totalPg?'disabled':'')+' style="'+(_arusCurrentPage===totalPg?btnDsbl:btnNorm)+'"><i class="ti ti-chevrons-right"></i></button>' +
    '</div>';
}

function arusGoPage(pg) {
  const totalPg = Math.max(1, Math.ceil(_arusFilteredData.length / _KAS_PAGE_SIZE));
  _arusCurrentPage = Math.max(1, Math.min(pg, totalPg));
  _kasRenderArusTabel();
  const card = document.querySelector('#lap-panel-aruskas .card');
  if (card) card.scrollIntoView({behavior:'smooth', block:'start'});
}

// ─── EVENT DELEGATION ────────────────────────────────────────
document.getElementById('page-kas').addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]'); if (!btn) return;
  const id = btn.dataset.id, action = btn.dataset.action;
  if (action === 'edit-kas')   kasEditJurnal(id);
  if (action === 'hapus-kas')  kasHapusJurnal(id, btn.dataset.ket);
  if (action === 'edit-akun')  kasEditAkun(id);
  if (action === 'hapus-akun') kasHapusAkun(id, btn.dataset.nama);
});

// ─── INIT ────────────────────────────────────────────────────
loadKasJurnal();


// ─── KAS AKUN CUSTOM PICKER ──────────────────────────────────
// Menggantikan <select> native yang muncul sebagai bottom sheet Android.
// <select> tetap ada (display:none) sebagai source of truth untuk semua logic lama.

function kasPopulatePickerList(listId, akunData) {
  var list = document.getElementById(listId);
  if (!list) return;
  var order = ['aset','kewajiban','modal','pendapatan','beban'];
  var grouped = {}; order.forEach(function(k){ grouped[k] = []; });
  akunData.forEach(function(a){ if (grouped[a.kelompok]) grouped[a.kelompok].push(a); });
  var html = '<div class="kas-akun-item" data-val="" onclick="kasPickerSelect(this)"><span style="color:var(--ink3)">— Pilih Akun —</span></div>';
  order.forEach(function(k) {
    if (!grouped[k].length) return;
    html += '<div class="kas-akun-group">' + kasKelompokLabel(k) + '</div>';
    grouped[k].forEach(function(a) {
      var label = (a.kode ? a.kode + ' · ' : '') + a.nama;
      html += '<div class="kas-akun-item" data-val="' + a.id + '" onclick="kasPickerSelect(this)">' + label + '</div>';
    });
  });
  list.innerHTML = html;
}

function _kasReturnListToWrap(list) {
  // Kembalikan list ke .kas-akun-wrap asalnya setelah di-float ke body
  if (!list || !list.dataset.floated) return;
  var wrap = document.querySelector('.kas-akun-wrap #' + list.id.replace('-list',''));
  if (!wrap) {
    // Cari wrap berdasarkan data-target
    var picker = document.querySelector('[id="' + list.id.replace('-list','') + '"]');
    if (picker && picker.parentNode) picker.parentNode.appendChild(list);
  }
  list.style.display = 'none';
  list.style.position = '';
  list.style.top = '';
  list.style.left = '';
  list.style.width = '';
  list.style.zIndex = '';
  delete list.dataset.floated;
}

function kasClosePicker(list) {
  if (!list) return;
  // Reset search & tampilkan semua item
  var inp = list.querySelector('.kas-akun-search');
  if (inp) inp.value = '';
  list.querySelectorAll('.kas-akun-item,.kas-akun-group').forEach(function(el) { el.style.display = ''; });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';

  if (list.dataset.floated && list.parentNode === document.body) {
    var pickerId = list.id.replace('-list', '');
    var picker = document.getElementById(pickerId);
    if (picker && picker.parentNode && picker.parentNode.classList.contains('kas-akun-wrap')) {
      picker.parentNode.appendChild(list);
    }
    delete list.dataset.floated;
  }
  list.style.display = 'none';
}

function kasTogglePicker(pickerId) {
  var picker = document.getElementById(pickerId);
  var list   = document.getElementById(pickerId + '-list');
  if (!picker || !list) return;

  // Tutup semua picker lain dulu
  document.querySelectorAll('.kas-akun-list').forEach(function(el) {
    if (el.id !== pickerId + '-list') kasClosePicker(el);
  });

  if (list.style.display === 'block') { kasClosePicker(list); return; }

  // Inject search box jika belum ada
  if (!list.querySelector('.kas-akun-search-wrap')) {
    var wrap = document.createElement('div');
    wrap.className = 'kas-akun-search-wrap';
    wrap.innerHTML =
      '<span class="kas-akun-search-icon">🔍</span>' +
      '<input class="kas-akun-search" type="text" placeholder="Cari..." autocomplete="off" ' +
        'onmousedown="event.stopPropagation()" ' +
        'ontouchstart="event.stopPropagation()" ' +
        'oninput="kasPickerFilter(this)">';
    list.insertBefore(wrap, list.firstChild);
  }

  // Reset search & tampilkan semua item
  var inp = list.querySelector('.kas-akun-search');
  if (inp) inp.value = '';
  list.querySelectorAll('.kas-akun-item,.kas-akun-group,.kas-akun-empty').forEach(function(el) {
    el.style.display = '';
  });
  var emp = list.querySelector('.kas-akun-empty');
  if (emp) emp.style.display = 'none';

  // Float ke body
  var rect = picker.getBoundingClientRect();
  list.style.position  = 'fixed';
  list.style.top       = (rect.bottom + 2) + 'px';
  list.style.left      = rect.left + 'px';
  list.style.width     = rect.width + 'px';
  list.style.maxWidth  = '320px';
  list.style.zIndex    = '99999';
  list.dataset.floated = '1';
  list.style.display   = 'block';
  if (list.parentNode !== document.body) document.body.appendChild(list);

  // Auto-focus search
  if (inp) setTimeout(function() { inp.focus(); }, 50);
}

function kasPickerFilter(inp) {
  var list  = inp.closest('.kas-akun-list');
  if (!list) return;
  var q     = inp.value.toLowerCase().trim();
  var items = list.querySelectorAll('.kas-akun-item');
  var groups = list.querySelectorAll('.kas-akun-group');
  var anyVisible = false;

  // Filter item
  items.forEach(function(item) {
    var match = item.textContent.toLowerCase().indexOf(q) !== -1;
    item.style.display = match ? '' : 'none';
    if (match) anyVisible = true;
  });

  // Sembunyikan group header jika semua item di bawahnya hidden
  groups.forEach(function(grp) {
    var next = grp.nextElementSibling;
    var hasVisible = false;
    while (next && !next.classList.contains('kas-akun-group')) {
      if (next.classList.contains('kas-akun-item') && next.style.display !== 'none') hasVisible = true;
      next = next.nextElementSibling;
    }
    grp.style.display = hasVisible ? '' : 'none';
  });

  // Tampilkan pesan kosong jika tidak ada hasil
  var emp = list.querySelector('.kas-akun-empty');
  if (!emp) {
    emp = document.createElement('div');
    emp.className = 'kas-akun-empty';
    emp.textContent = 'Tidak ditemukan';
    list.appendChild(emp);
  }
  emp.style.display = anyVisible ? 'none' : '';
}

function kasPickerSelect(item) {
  if (event) { event.stopPropagation(); event.preventDefault(); }
  var list = item.closest('.kas-akun-list');
  if (!list) return;
  var pickerId = list.id.replace('-list', '');
  var picker   = document.getElementById(pickerId);
  if (!picker) return;
  var targetId = picker.dataset.target;
  var val      = item.dataset.val;
  var label    = item.textContent.trim();
  // Update hidden select
  var sel = document.getElementById(targetId);
  if (sel) { sel.value = val; sel.dispatchEvent(new Event('change')); }
  // Update picker label
  var lbl = document.getElementById(pickerId + '-label');
  if (lbl) { lbl.textContent = label; lbl.style.color = val ? 'var(--ink)' : 'var(--ink3)'; }
  // Tandai aktif
  list.querySelectorAll('.kas-akun-item').forEach(function(el){ el.classList.remove('active'); });
  item.classList.add('active');
  // Tutup list
  list.style.display = 'none';
}

function kasSyncPickerLabel(pickerId, selectId) {
  var sel = document.getElementById(selectId);
  var picker = document.getElementById(pickerId);
  if (!sel || !picker) return;
  var val = sel.value;
  var list = document.getElementById(pickerId + '-list');
  var lbl  = document.getElementById(pickerId + '-label');
  if (list) {
    list.querySelectorAll('.kas-akun-item').forEach(function(el){ el.classList.remove('active'); });
    var match = list.querySelector('.kas-akun-item[data-val="' + val + '"]');
    if (match) {
      match.classList.add('active');
      if (lbl) { lbl.textContent = match.textContent.trim(); lbl.style.color = 'var(--ink)'; }
    } else {
      if (lbl) { lbl.textContent = '— Pilih Akun —'; lbl.style.color = 'var(--ink3)'; }
    }
  }
}

// Reset picker saat modal dibuka untuk transaksi baru
var _kasOrigShowModal = window.showModal;
if (_kasOrigShowModal) {
  window.showModal = function(id) {
    _kasOrigShowModal(id);
    if (id === 'modal-kas-transaksi') {
      // Cek apakah form baru (bukan edit)
      setTimeout(function() {
        var kasId = document.getElementById('kas-jrn-id');
        if (kasId && !kasId.value) {
          ['picker-debit','picker-kredit'].forEach(function(pid) {
            var lbl = document.getElementById(pid + '-label');
            if (lbl) { lbl.textContent = '— Pilih Akun —'; lbl.style.color = 'var(--ink3)'; }
            var list = document.getElementById(pid + '-list');
            if (list) { list.querySelectorAll('.kas-akun-item').forEach(function(el){ el.classList.remove('active'); }); }
          });
        }
      }, 30);
    }
  };
}

// Close listener dipindah ke unified handler di bawah

// scroll listener: handled by unified handler in app.js

// ─── ENSURE FLEX LAYOUT — sama persis pola JP ────────────────
function _kasEnsureFlexLayout() {
  var pg = document.getElementById('page-kas');
  if (!pg || !pg.classList.contains('active')) return;
  var contentEl = document.querySelector('.content');
  if (contentEl) {
    contentEl.style.overflowY = 'hidden';
    contentEl.style.padding   = '0';
    contentEl.style.height    = '100%';
  }
}
window.addEventListener('resize', function() {
  var pg = document.getElementById('page-kas');
  if (pg && pg.classList.contains('active')) _kasEnsureFlexLayout();
});

// ─── HOOK zenot:page ─────────────────────────────────────────
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page !== 'kas') return;
  setTimeout(_kasEnsureFlexLayout, 60);
  setTimeout(function() {
    var tb = document.getElementById('kas-top-bar');
    if (tb) tb.classList.remove('kas-topbar-collapsed');
  }, 60);
  // Reload data otomatis saat navigasi ke halaman ini (debounce 250ms)
  clearTimeout(window._kasReloadTimer);
  window._kasReloadTimer = setTimeout(loadKasJurnal, 250);
});

// ─── SWIPE GESTURE — collapse kas-top-bar di semua touch mobile ──
(function() {
  var _mq = window.matchMedia('(hover: none) and (pointer: coarse)');
  function _kasInitSwipe() {
    if (!_mq.matches) return;
    var topBar      = document.getElementById('kas-top-bar');
    var stickyHdr   = document.getElementById('kas-sticky-header');
    var summary     = document.querySelector('#kas-panel-jurnal .kas-summary');
    if (!topBar) return;
    // Swipe di top-bar sendiri
    initSwipeCollapse(topBar, topBar, 50);
    // Swipe di sticky header dalam card juga bisa expand/collapse
    if (stickyHdr) initSwipeCollapse(stickyHdr, topBar, 50);
    // Swipe di summary juga
    if (summary) initSwipeCollapse(summary, topBar, 50);
  }
  setTimeout(_kasInitSwipe, 300);
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'kas') return;
    setTimeout(function() {
      var tb = document.getElementById('kas-top-bar');
      if (tb) tb.classList.remove('kas-topbar-collapsed');
      _kasInitSwipe();
    }, 80);
  });
})();