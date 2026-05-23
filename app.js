// ─── APP.JS v4 — Safari & Samsung Browser compatible ──────────

// ─── SAFE QUERY HELPER ───────────────────────────────────────
function $id(id) { return document.getElementById(id); }
function $all(sel, root) { return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

// ─── SIDEBAR MINIMIZE (DESKTOP) ──────────────────────────────
function toggleMinimize() {
  var isMini = document.body.classList.toggle('sidebar-mini');
  try { localStorage.setItem('zenoot_mini', isMini ? '1' : '0'); } catch(e) {}
}
// Restore sidebar state dari localStorage
// Di MOBILE: tidak pernah pakai sidebar-mini (sidebar jadi full overlay)
// Di DESKTOP: baca localStorage, default full/terbuka
try {
  var isMobile = window.innerWidth <= 900;
  if (!isMobile) {
    var savedMini = localStorage.getItem('zenoot_mini');
    if (savedMini === '1') {
      document.body.classList.add('sidebar-mini');
    }
  }
} catch(e) {}

// FIX: Paksa tutup sidebar saat pertama load di touch device / layar kecil
// Mencegah sidebar muncul otomatis saat buka app di HP
try {
  var _isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var _isNarrow = window.innerWidth <= 900;
  if (_isTouchDevice || _isNarrow) {
    // Jalankan setelah DOM siap agar element sidebar sudah ada
    document.addEventListener('DOMContentLoaded', function() {
      var sb = document.getElementById('sidebar');
      var ov = document.getElementById('sidebar-overlay');
      if (sb) sb.classList.remove('open');
      if (ov) ov.classList.remove('open');
    });
  }
} catch(e) {}

// Juga handle resize: kalau user rotate HP jadi landscape/desktop, re-check
window.addEventListener('resize', function() {
  try {
    if (window.innerWidth <= 900) {
      // Mobile: paksa hapus sidebar-mini
      document.body.classList.remove('sidebar-mini');
    } else {
      // Desktop: restore dari localStorage
      var savedMini = localStorage.getItem('zenoot_mini');
      if (savedMini === '1') {
        document.body.classList.add('sidebar-mini');
      }
    }
  } catch(e) {}
});

// ─── COLLAPSIBLE NAV GROUPS ──────────────────────────────────
function toggleNavGroup(id) {
  var group = $id(id);
  if (!group) return;
  group.classList.toggle('collapsed');
  try {
    var s = JSON.parse(localStorage.getItem('zenoot_nav')||'{}');
    s[id] = group.classList.contains('collapsed');
    localStorage.setItem('zenoot_nav', JSON.stringify(s));
  } catch(e){}
}

function restoreNavGroups() {
  try {
    var s = JSON.parse(localStorage.getItem('zenoot_nav')||'{}');
    Object.keys(s).forEach(function(id) {
      var el = $id(id);
      if (el && s[id]) el.classList.add('collapsed');
    });
  } catch(e){}
}
restoreNavGroups();

// ─── DATE ────────────────────────────────────────────────────
var days   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
var months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
var now    = new Date();
var dateEl = $id('topbar-date');
if (dateEl) {
  dateEl.textContent =
    days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
}

// ─── MOBILE SIDEBAR ──────────────────────────────────────────
function toggleSidebar() {
  var sb  = $id('sidebar');
  var ov  = $id('sidebar-overlay');
  var btn = $id('btn-hamburger');
  if (!sb || !ov) return;
  var isOpen = sb.classList.contains('open');
  if (isOpen) {
    sb.classList.remove('open');
    ov.classList.remove('open');
    if (btn) { btn.innerHTML = '<i class="ti ti-menu-2"></i>'; btn.setAttribute('aria-label','Buka menu'); }
  } else {
    sb.classList.add('open');
    ov.classList.add('open');
    if (btn) { btn.innerHTML = '<i class="ti ti-x"></i>'; btn.setAttribute('aria-label','Tutup menu'); }
  }
}
function closeSidebar() {
  var sb  = $id('sidebar');
  var ov  = $id('sidebar-overlay');
  var btn = $id('btn-hamburger');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('open');
  if (btn) { btn.innerHTML = '<i class="ti ti-menu-2"></i>'; btn.setAttribute('aria-label','Buka menu'); }
}

// Swipe-to-close sidebar (Samsung & Safari)
(function() {
  var startX = 0, startY = 0;
  document.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - startX;
    var dy = Math.abs(e.changedTouches[0].clientY - startY);
    var sb = $id('sidebar');
    if (sb && sb.classList.contains('open') && dx < -60 && dy < 80) {
      closeSidebar();
    }
  }, { passive: true });
})();

// ─── PAGE MAP ────────────────────────────────────────────────
var pageMap = {
  'dashboard':          { title:'Dashboard',          sub:'overview performa hari ini'     },
  'stok':               { title:'Stok Produk',         sub:'monitoring stok semua SKU'      },
  'restock':            { title:'Re-Stock',            sub:'daftar reorder per boss'        },
  'kas':                { title:'Kas & Jurnal',        sub:'pencatatan arus kas harian'     },
  'jurnal-penjualan':   { title:'Jurnal Penjualan',    sub:'pencatatan transaksi penjualan' },
  'price-list':         { title:'Price List',          sub:'harga jual otomatis dari HPP'   },
  'dataorder':          { title:'Data Order',          sub:'upload & lihat order Shopee'    },
  'rekap':              { title:'Rekap & P&L',         sub:'laporan keuangan per toko'      },
  'produk':             { title:'Kelola Produk',       sub:'master SKU, HPP, dan boss'      },
  'channel':            { title:'Channel',             sub:'master data channel toko'       },
  'beban-operasional':  { title:'Beban Operasional',   sub:'acuan % beban & target NPM'     },
  'anggaran':           { title:'Anggaran Beban',      sub:'target & realisasi beban bulanan' },
  'keuangan':           { title:'Keuangan Operasional', sub:'hutang, neraca, rasio & valuasi' },
  'clearance':          { title:'Clearance Monitor',    sub:'SKU non-aktif yang masih ada stok' },
};

// ─── NAVIGASI ────────────────────────────────────────────────
function gotoPage(page, btn) {
  $all('.page').forEach(function(p) { p.classList.remove('active'); });
  var pageEl = $id('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  $all('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var info = pageMap[page];
  if (info) {
    var titleEl = $id('topbar-title');
    var subEl   = $id('topbar-sub');
    if (titleEl) titleEl.textContent = info.title;
    if (subEl)   subEl.textContent   = info.sub;
  }
  closeSidebar();
  var contentEl = document.querySelector('.content');
  if (contentEl) {
    var fullHeightPages = ['stok', 'jurnal-penjualan'];
    if (fullHeightPages.indexOf(page) !== -1) {
      contentEl.style.overflowY = 'hidden';
      contentEl.style.padding   = '0';
      contentEl.style.height    = '100%';
      contentEl.style.display   = 'flex';
      contentEl.style.flexDirection = 'column';
    } else {
      contentEl.style.overflowY    = '';
      contentEl.style.padding      = '';
      contentEl.style.height       = '';
      contentEl.style.display      = '';
      contentEl.style.flexDirection = '';
      contentEl.scrollTop = 0;
    }
  }
}

// ─── MODAL ───────────────────────────────────────────────────
function closeModal(id) {
  var el = $id(id);
  if (el) el.classList.remove('open');
}
document.addEventListener('click', function(e) {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});
document.addEventListener('touchend', function(e) {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
}, { passive: true });

// ─── CONFIRM DELETE HELPER ────────────────────────────────────
function confirmDelete(msg, onConfirm) {
  var msgEl = $id('modal-confirm-msg');
  var modal = $id('modal-confirm');
  var okBtn = $id('modal-confirm-ok');
  if (!msgEl || !modal || !okBtn) return;
  msgEl.textContent = msg;
  modal.classList.add('open');
  okBtn.onclick = function() { closeModal('modal-confirm'); onConfirm(); };
}

// ─── EXPORT CSV HELPER ────────────────────────────────────────
function exportCSV(filename, headers, rows) {
  var lines = [headers.join(',')].concat(
    rows.map(function(r) {
      return r.map(function(v) {
        return '"' + String(v || '').replace(/"/g, '""') + '"';
      }).join(',');
    })
  );
  var blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  var a    = document.createElement('a');
  a.href   = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 300);
}

// ─── HELPER re-render rough UI ────────────────────────────────
function sketchForm(containerId) {
  setTimeout(function() {
    if (typeof rerenderUI === 'function') {
      var el = $id(containerId);
      if (el) rerenderUI(el);
    }
  }, 30);
}



// ─── GLOBAL MODAL HELPER ─────────────────────────────────────
// showModal(id) — buka modal overlay
// hideModal(id) — tutup modal overlay
function showModal(id) {
  var el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    // Sketchy render
    var m = el.querySelector('.modal');
    if (m && typeof rerenderUI === 'function') setTimeout(function(){ rerenderUI(m); }, 30);
    // Auto-aktifkan format IDR (titik ribuan) pada semua input numeric di modal ini
    setTimeout(function() {
      el.querySelectorAll('input[inputmode="numeric"]').forEach(function(inp) {
        if (inp.id) idrInput(inp.id);
      });
    }, 60);
  }
}
function hideModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
// (modal-overlay click handler sudah terdaftar di atas — tidak diduplikasi di sini)

// ─── GLOBAL FORMAT RUPIAH ─────────────────────────────────────
// Format full: Rp1.200.000 (tidak pakai jt/rb)
function fmtRpFull(v) {
  if (!v && v !== 0) return '—';
  v = Math.round(Number(v));
  return 'Rp' + v.toLocaleString('id-ID');
}
// Format singkat untuk chart/label sempit
function fmtRpShort(v) {
  if (!v && v !== 0) return '—';
  v = Number(v);
  if (v >= 1000000) return 'Rp' + (v/1000000).toFixed(1).replace('.0','') + 'jt';
  if (v >= 1000)    return 'Rp' + Math.round(v/1000) + 'rb';
  return 'Rp' + Math.round(v).toLocaleString('id-ID');
}

// ─── IDR INPUT FORMATTER ─────────────────────────────────────
// idrInput(id) — aktifkan auto-format titik ribuan pada input[type=text]
// idrVal(id)   — ambil nilai numerik bersih dari input yang sudah diformat
// idrSet(id,v) — set nilai ke input dengan format titik ribuan
//
// Cara pakai:
//   idrInput('kas-jrn-nominal');        // aktifkan formatter
//   var nominal = idrVal('kas-jrn-nominal'); // baca nilai bersih
//   idrSet('kas-jrn-nominal', 150000);  // isi nilai

function idrInput(id) {
  var el = document.getElementById(id);
  if (!el || el.dataset.idrInit) return;
  el.dataset.idrInit = '1';
  el.setAttribute('type', 'text');
  el.setAttribute('inputmode', 'numeric');
  el.setAttribute('autocomplete', 'off');

  function _fmt(el) {
    var raw = el.value.replace(/\./g, '').replace(/[^0-9]/g, '');
    if (!raw) { el.value = ''; return; }
    el.value = parseInt(raw, 10).toLocaleString('id-ID');
  }

  el.addEventListener('input', function() { _fmt(el); });
  el.addEventListener('focus', function() {
    // Saat fokus, pindahkan kursor ke akhir
    var v = el.value;
    el.value = '';
    el.value = v;
  });
  el.addEventListener('blur', function() { _fmt(el); });
}

function idrVal(id) {
  var el = document.getElementById(id);
  if (!el) return 0;
  var raw = el.value.replace(/\./g, '').replace(/[^0-9]/g, '');
  return parseInt(raw, 10) || 0;
}

function idrSet(id, v) {
  var el = document.getElementById(id);
  if (!el) return;
  var num = Math.round(Number(v)) || 0;
  el.value = num > 0 ? num.toLocaleString('id-ID') : '';
}

// idrInputAll() — aktifkan auto-format titik ribuan pada SEMUA input nominal di DOM
// Auto-detect inputmode="numeric", tidak perlu daftar ID manual per form
function idrInputAll() {
  // 1. Auto-detect semua input[inputmode="numeric"] yang belum diinit
  document.querySelectorAll('input[inputmode="numeric"]').forEach(function(el) {
    if (el.id && !el.dataset.idrInit) idrInput(el.id);
  });
  // 2. Fallback: ID spesifik yang tidak pakai inputmode="numeric"
  var IDR_IDS = [
    'kas-jrn-nominal',
    'keu-bayar-nominal',
    'keu-htg-pokok',
    'keu-htg-cicilan',
    'inp-target-omset',
    'kalk-hpp',
    'hpp-harga',
    'jp-harga',
    'jp-total',
    'kat-hpp',
    'prd-hpp',
    'supplier-budget'
  ];
  IDR_IDS.forEach(function(id) { idrInput(id); });
  // 3. beban-ops dynamic inputs
  document.querySelectorAll('#beban-ops-rows input[data-field="nominal"]').forEach(function(el) {
    if (!el.dataset.idrInit) {
      var fakeId = 'beban-ops-dyn-' + el.dataset.idx;
      el.id = fakeId;
      idrInput(fakeId);
    }
  });
}

// Auto-run saat DOM siap dan setiap kali ada perubahan di DOM (modal buka)
document.addEventListener('DOMContentLoaded', function() {
  idrInputAll();
  // MutationObserver untuk handle input yang muncul dinamis (modal)
  var obs = new MutationObserver(function() { idrInputAll(); });
  obs.observe(document.body, { childList: true, subtree: true });
});

// ─── GLOBAL CHANNEL LOGO / ICON ──────────────────────────────
// chBadge(input) — input bisa:
//   string: nama channel saja (fallback deteksi nama)
//   object: { nama, kategori } — deteksi akurat via kategori DB
//
// Dipakai di: dashboard, jurnal-penjualan, channel-master, dropdown

// ── SVG ICONS (monokrom, ikut currentColor tema app) ─────────
var CH_SVG = {
  shopee: '<svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">' +
    '<rect x="8" y="28" width="84" height="64" rx="10" fill="currentColor"/>' +
    '<path d="M34 28 C34 14 66 14 66 28" stroke="currentColor" stroke-width="7" fill="none" stroke-linecap="round"/>' +
    '<path d="M58 44C58 39.6 54.4 36 50 36C45.6 36 42 39.6 42 44C42 48.4 45.6 52 50 52C54.4 52 58 55.6 58 60C58 64.4 54.4 68 50 68C45.6 68 42 64.4 42 60" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<line x1="50" y1="33" x2="50" y2="38" stroke="white" stroke-width="5" stroke-linecap="round"/>' +
    '<line x1="50" y1="67" x2="50" y2="72" stroke="white" stroke-width="5" stroke-linecap="round"/>' +
  '</svg>',

  lazada: '<svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">' +
    '<rect x="6" y="6" width="88" height="88" rx="14" fill="currentColor"/>' +
    '<path d="M28 72V28h14v32h30v12H28z" fill="white"/>' +
  '</svg>',

  tiktok: '<svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">' +
    '<path d="M65 8c0 11 9 20 20 20v13c-7.5 0-14.5-2.5-20-6.7V62c0 15.2-12.3 27.5-27.5 27.5S10 77.2 10 62s12.3-27.5 27.5-27.5c1.3 0 2.5.1 3.8.3v13.7c-1.2-.3-2.5-.5-3.8-.5C30 48 22 56 22 66s8 18 15.5 18S53 74 53 64V8h12z" fill="currentColor"/>' +
  '</svg>',

  reseller: '<svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">' +
    '<circle cx="35" cy="32" r="14" stroke="currentColor" stroke-width="7" fill="none"/>' +
    '<circle cx="68" cy="28" r="11" stroke="currentColor" stroke-width="6" fill="none"/>' +
    '<path d="M6 80c0-16 13-28 29-28s29 12 29 28" stroke="currentColor" stroke-width="7" fill="none" stroke-linecap="round"/>' +
    '<path d="M68 52c10 0 22 7 22 22" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/>' +
  '</svg>',

  offline: '<svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">' +
    '<path d="M10 45L50 10l40 35v45H62V70H38v30H10z" stroke="currentColor" stroke-width="7" fill="none" stroke-linejoin="round"/>' +
  '</svg>',

  default: '<svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">' +
    '<circle cx="50" cy="50" r="42" stroke="currentColor" stroke-width="7" fill="none"/>' +
    '<path d="M50 8C50 8 30 30 30 50s20 42 20 42" stroke="currentColor" stroke-width="5" fill="none"/>' +
    '<path d="M50 8c0 0 20 22 20 42s-20 42-20 42" stroke="currentColor" stroke-width="5" fill="none"/>' +
    '<line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" stroke-width="5"/>' +
    '<line x1="14" y1="28" x2="86" y2="28" stroke="currentColor" stroke-width="5"/>' +
    '<line x1="14" y1="72" x2="86" y2="72" stroke="currentColor" stroke-width="5"/>' +
  '</svg>'
};

// ── HELPER: icon saja (tanpa label) ──────────────────────────
function chIcon(input) {
  var kat = '';
  var nama = '';
  if (input && typeof input === 'object') {
    kat  = (input.kategori || '').toLowerCase();
    nama = input.nama || '';
  } else {
    nama = input || '';
  }
  var n = nama.toUpperCase();

  // Prioritaskan kategori dari DB jika ada
  if (kat === 'toko_utama')  return CH_SVG.shopee;
  if (kat === 'lazada')      return CH_SVG.lazada;
  if (kat === 'tiktok')      return CH_SVG.tiktok;
  if (kat === 'reseller')    return CH_SVG.reseller;
  if (kat === 'offline')     return CH_SVG.offline;

  // Fallback: tebak dari nama
  if (n.indexOf('SHP') !== -1 || n.indexOf('SHOPEE') !== -1) return CH_SVG.shopee;
  if (n.indexOf('LZD') !== -1 || n.indexOf('LAZ')    !== -1) return CH_SVG.lazada;
  if (n.indexOf('TT.')  !== -1 || n.indexOf('TIKTOK') !== -1) return CH_SVG.tiktok;
  if (n.indexOf('OFFLINE') !== -1 || n.indexOf('COD') !== -1) return CH_SVG.offline;
  return CH_SVG.default;
}

// ── BADGE: icon + nama ────────────────────────────────────────
function chBadge(input) {
  if (!input) return '<span style="color:var(--ink3)">—</span>';
  var nama = (typeof input === 'object') ? (input.nama || '') : input;
  if (!nama) return '<span style="color:var(--ink3)">—</span>';
  return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--ink);white-space:nowrap">' +
    chIcon(input) + nama +
  '</span>';
}

// ─── PREVENT DOUBLE-TAP ZOOM (Samsung Browser) ───────────────
(function() {
  var lastTap = 0;
  document.addEventListener('touchend', function(e) {
    var t = e.target;
    // Hanya prevent pada elemen interaktif, bukan scroll area
    if (t && (t.tagName === 'BUTTON' || t.tagName === 'A' || t.classList.contains('nav-item'))) {
      var now = Date.now();
      if (now - lastTap < 300) { e.preventDefault(); }
      lastTap = now;
    }
  }, { passive: false });
})();

// ─── SERVICE WORKER UPDATE HANDLER ───────────────────────────
// Terima pesan dari SW: reload saat user klik notif update
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', function(e) {
    if (!e.data) return;

    // SW minta reload (user klik notif update di HP)
    if (e.data.type === 'SW_DO_RELOAD') {
      window.location.reload();
      return;
    }

    // SW aktif versi baru → tampil banner kecil di dalam app (fallback)
    if (e.data.type === 'SW_UPDATED') {
      // Tampil banner tipis di atas app sebagai fallback
      // (notif HP sudah dikirim via showNotification di sw.js)
      var existing = document.getElementById('zenot-update-banner');
      if (existing) return; // jangan duplikat

      var banner = document.createElement('div');
      banner.id = 'zenot-update-banner';
      banner.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9999',
        'background:#1a1a2e', 'color:#fff', 'font-size:13px',
        'display:flex', 'align-items:center', 'justify-content:space-between',
        'padding:8px 14px', 'gap:10px',
        'border-bottom:1px solid rgba(255,255,255,0.1)',
        'font-family:inherit'
      ].join(';');
      banner.innerHTML =
        '<span>🚀 zenOt versi baru tersedia</span>' +
        '<button onclick="window.location.reload()" style="' +
          'background:#4f46e5;color:#fff;border:none;border-radius:6px;' +
          'padding:4px 12px;font-size:12px;cursor:pointer;font-weight:600' +
        '">Reload</button>';
      document.body.insertBefore(banner, document.body.firstChild);
    }
  });
}
