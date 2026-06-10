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
  'shopee-auth':        { title:'Shopee Connect',        sub:'koneksi & sinkronisasi toko Shopee' },
  'shopee-dashboard':   { title:'Analisis Shopee',        sub:'performa & insight toko Shopee'     },
};

// ─── NAVIGASI ────────────────────────────────────────────────
function gotoPage(page, btn) {
  $all('.page').forEach(function(p) {
    p.classList.remove('active');
    p.style.display = ''; // hapus inline display agar CSS .page{display:none} berlaku
  });
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
  // Fire event — semua file listen ke ini, tidak perlu override gotoPage
  // Polyfill-safe untuk iOS Safari lama yang tidak support CustomEvent constructor
  (function() {
    var ev;
    try {
      ev = new CustomEvent('zenot:page', { detail: { page: page }, bubbles: false });
    } catch(e) {
      ev = document.createEvent('CustomEvent');
      ev.initCustomEvent('zenot:page', false, false, { page: page });
    }
    document.dispatchEvent(ev);
  })();
  var contentEl = document.querySelector('.content');
  var mainEl    = document.querySelector('.main');
  if (contentEl) {
    var fullHeightPages = ['stok', 'jurnal-penjualan', 'clearance', 'produk-terjual', 'restock', 'produk', 'price-list', 'kas'];
    if (fullHeightPages.indexOf(page) !== -1) {
      // Full-height pages: paksa height chain html→body→main→content eksplisit
      // iOS Safari tidak bisa resolve flex:1 jika ancestor tidak punya height eksplisit
      document.documentElement.style.height = '100%';
      document.body.style.height            = '100%';
      document.body.style.minHeight         = '0';
      if (mainEl) {
        mainEl.style.height           = '100%';
        mainEl.style.minHeight        = '0';
        mainEl.style.overflow         = 'hidden';
        mainEl.style.display          = '-webkit-flex';
        mainEl.style.display          = 'flex';
        mainEl.style.webkitFlex       = '1 1 0';
        mainEl.style.flex             = '1 1 0';
        mainEl.style.flexDirection    = 'column';
        mainEl.style.webkitFlexDirection = 'column';
      }
      contentEl.style.overflowY            = 'hidden';
      contentEl.style.overflow             = 'hidden';
      contentEl.style.padding              = '0';
      contentEl.style.display              = '-webkit-flex';
      contentEl.style.display              = 'flex';
      contentEl.style.flexDirection        = 'column';
      contentEl.style.webkitFlexDirection  = 'column';
      contentEl.style.webkitFlex           = '1 1 0';
      contentEl.style.flex                 = '1 1 0';
      contentEl.style.minHeight            = '0';
      contentEl.style.height               = '100%';
    } else {
      // Normal scroll pages: reset semua inline styles
      document.documentElement.style.height = '';
      document.body.style.height            = '';
      document.body.style.minHeight         = '';
      if (mainEl) {
        mainEl.style.height           = '';
        mainEl.style.minHeight        = '';
        mainEl.style.overflow         = '';
        mainEl.style.display          = '';
        mainEl.style.webkitFlex       = '';
        mainEl.style.flex             = '';
        mainEl.style.flexDirection    = '';
        mainEl.style.webkitFlexDirection = '';
      }
      contentEl.style.overflowY            = '';
      contentEl.style.overflow             = '';
      contentEl.style.padding              = '';
      contentEl.style.display              = '';
      contentEl.style.flexDirection        = '';
      contentEl.style.webkitFlexDirection  = '';
      contentEl.style.height               = '';
      contentEl.style.webkitFlex           = '';
      contentEl.style.flex                 = '';
      contentEl.style.minHeight            = '';
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
  shopee: '<i class="ti ti-brand-shopee" style="font-size:15px;flex-shrink:0"></i>',

  lazada:   '<i class="ti ti-shopping-bag"   style="font-size:15px;flex-shrink:0"></i>',
  tiktok:   '<i class="ti ti-brand-tiktok"   style="font-size:15px;flex-shrink:0"></i>',
  reseller: '<i class="ti ti-users"           style="font-size:15px;flex-shrink:0"></i>',
  offline:  '<i class="ti ti-map-pin"         style="font-size:15px;flex-shrink:0"></i>',
  default:  '<i class="ti ti-antenna"         style="font-size:15px;flex-shrink:0"></i>'
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

// ─── PREVENT iOS RUBBER-BAND / BOUNCE SCROLL ─────────────────
// iOS Safari rubber-band boundary control:
// - Window/root         → html position:fixed di CSS (sudah handle)
// - Scroll container    → overscroll-behavior:none di CSS setiap tbl-wrap (sudah handle)
// - touchmove passive:true → iOS scroll engine langsung handle tanpa menunggu JS
//   Sebelumnya passive:false menyebabkan scroll terasa laggy/tidak flat di semua halaman tabel
//   karena iOS wajib menunggu JS selesai sebelum boleh scroll (bahkan saat tidak ada preventDefault).
//   Dengan passive:true + overscroll-behavior:none di CSS, bounce/rubber-band tetap dicegah
//   tanpa mengorbankan kelancaran scroll native iOS.
(function() {

  var _scrollEl = null;

  document.addEventListener('touchstart', function(e) {
    // Simpan elemen scroll terdekat saat touch mulai
    // Dipakai modul lain (swipe gesture) yang butuh tahu scroll context
    var node = e.target;
    _scrollEl = null;
    while (node && node !== document.body && node !== document.documentElement) {
      var cs = window.getComputedStyle(node);
      var oy = cs.overflowY;
      if ((oy === 'scroll' || oy === 'auto') && node.scrollHeight > node.clientHeight) {
        _scrollEl = node;
        break;
      }
      node = node.parentElement;
    }
  }, { passive: true });

  // passive:true — iOS scroll engine tidak perlu menunggu JS
  // Boundary rubber-band dicegah oleh overscroll-behavior:none di CSS setiap scroll container
  document.addEventListener('touchmove', function(e) {
    // Tidak ada scroll container → cegah window bounce (area non-scrollable)
    if (!_scrollEl) { e.preventDefault(); }
  }, { passive: false }); // passive:false hanya untuk kasus !_scrollEl (area kosong/non-scrollable)

  document.addEventListener('touchend',    function() { _scrollEl = null; }, { passive: true });
  document.addEventListener('touchcancel', function() { _scrollEl = null; }, { passive: true });

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

    // SW aktif versi baru → di PWA standalone langsung reload, di browser tampil banner
    if (e.data.type === 'SW_UPDATED') {
      // PWA standalone (tidak ada browser UI) → auto reload aman, user tidak kehilangan konteks
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        window.location.reload();
        return;
      }
      // Browser biasa → tampil banner, biarkan user yang reload
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

// ─── UNIFIED PICKER CLOSE HANDLER ────────────────────────────
// Satu handler untuk semua custom picker (kas, keuangan, jurnal-penjualan).
// Menggantikan listener terpisah di masing-masing file yang saling konflik.
(function() {
  function _closeAllPickers(list) {
    // Detect dan panggil close function yang sesuai berdasarkan id prefix
    if (!list) return;
    var id = list.id || '';
    if (typeof kasClosePicker === 'function' && (id.indexOf('picker-debit') !== -1 || id.indexOf('picker-kredit') !== -1)) {
      kasClosePicker(list);
    } else if (typeof keuClosePicker === 'function' && id.indexOf('keu-picker') !== -1) {
      keuClosePicker(list);
    } else if (typeof jpClosePicker === 'function' && id.indexOf('jp-picker') !== -1) {
      jpClosePicker(list);
    } else {
      // Fallback: sembunyikan saja
      list.style.display = 'none';
    }
  }

  // Mousedown / touchstart di luar picker → tutup semua
  // CATATAN: pakai touchstart bukan touchend — iOS touchend dari picker-toggle
  // bubble ke document dan langsung nutup picker yang baru dibuka.
  var _pickerJustOpened = false;
  window._kasPickerJustOpened = function() {
    _pickerJustOpened = true;
    setTimeout(function() { _pickerJustOpened = false; }, 300);
  };
  function _onOutsideDown(e) {
    // Guard: tap di dalam picker element atau list → jangan tutup
    if (!e.target.closest) return;
    if (
      e.target.closest('[data-picker]')          ||
      e.target.closest('.kas-akun-picker')       ||
      e.target.closest('.kas-akun-list')         ||
      e.target.closest('.kas-akun-search-wrap')  ||
      e.target.closest('.kas-akun-search')       ||
      e.target.closest('.keu-akun-picker')       ||
      e.target.closest('.keu-akun-list')         ||
      e.target.closest('.keu-akun-search-wrap')  ||
      e.target.closest('.keu-akun-search')
    ) return;
    document.querySelectorAll('.kas-akun-list').forEach(_closeAllPickers);
  }
  document.addEventListener('mousedown', _onOutsideDown);
  document.addEventListener('touchstart', _onOutsideDown, { passive: true });

  // Scroll di luar list → tutup yang sedang float di body
  document.addEventListener('scroll', function(e) {
    if (e.target && e.target.closest && e.target.closest('.kas-akun-list')) return;
    document.querySelectorAll('.kas-akun-list[data-floated]').forEach(_closeAllPickers);
  }, true);
})();

// ─── SWIPE-TO-COLLAPSE GESTURE — shared utility ───────────────
// Dipakai oleh: jurnal-penjualan, stok, clearance, produk-terjual
// swipeZoneEl  : elemen yang disentuh user untuk trigger gesture
// collapseEl   : elemen yang collapse/expand
// threshold    : jarak swipe minimal (px) — default 50
function initSwipeCollapse(swipeZoneEl, collapseEl, threshold, className) {
  if (!swipeZoneEl || !collapseEl) return;
  threshold = threshold || 50;
  className = className || 'landscape-collapsed';
  var _startY = 0;
  var _startX = 0;
  var _tracking = false;

  swipeZoneEl.addEventListener('touchstart', function(e) {
    // Jangan trigger kalau touch di button/input
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    _startY    = e.touches[0].clientY;
    _startX    = e.touches[0].clientX;
    _tracking  = true;
  }, { passive: true });

  swipeZoneEl.addEventListener('touchend', function(e) {
    if (!_tracking) return;
    _tracking = false;
    var dy = e.changedTouches[0].clientY - _startY;
    var dx = e.changedTouches[0].clientX - _startX;
    // Pastikan gesture vertikal (bukan horizontal scroll)
    if (Math.abs(dx) > Math.abs(dy)) return;
    if (Math.abs(dy) < threshold) return;

    if (dy < 0) {
      // Swipe UP → collapse
      collapseEl.classList.add(className);
    } else {
      // Swipe DOWN → expand
      collapseEl.classList.remove(className);
    }
  }, { passive: true });
}

// ─── GLOBAL MOUSE WHEEL → SCROLL FORWARD ─────────────────────
// Di laptop/desktop, scroll mouse (wheel) tidak jalan di full-height pages
// karena .content punya overflow:hidden — wheel event tidak ter-forward ke
// inner scroll container (tbl-wrap, panel, dll).
// Handler ini: temukan scrollable ancestor terdekat dari target,
// forward delta ke sana. Bekerja di semua halaman tanpa konfigurasi per-file.
(function() {
  // Cek apakah ada elemen overflow:hidden yang memblok antara target dan container
  function _hasHiddenBlocker(el, container) {
    var cur = el;
    while (cur && cur !== container) {
      var oy = window.getComputedStyle(cur).overflowY;
      if (oy === 'hidden') return true;
      cur = cur.parentElement;
    }
    return false;
  }

  function _findScrollable(el) {
    while (el && el !== document.documentElement) {
      var cs = window.getComputedStyle(el);
      var oy = cs.overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener('wheel', function(e) {
    if (e.target.closest && e.target.closest('.modal-overlay')) return;
    if (e.target.closest && e.target.closest('.kas-akun-list, .dd-filter-boss, .dd-filter-katalog, #stok-katalog-dropdown, #trench-dd-periode, #trench-dd-channel')) return;

    var lineH = 60;
    var dy = e.deltaMode === 1 ? e.deltaY * lineH : (e.deltaMode === 2 ? e.deltaY * window.innerHeight * 0.8 : e.deltaY);
    var dx = e.deltaMode === 1 ? e.deltaX * lineH : (e.deltaMode === 2 ? e.deltaX * window.innerWidth  * 0.8 : e.deltaX);
    var isHoriz = Math.abs(dx) > Math.abs(dy);

    var container = _findScrollable(e.target);
    if (!container) return;

    // Kalau container === target, browser sudah handle native
    if (container === e.target) return;

    // Kalau TIDAK ada overflow:hidden yang memblok antara target dan container,
    // berarti browser sudah bisa deliver wheel event ke container secara native → jangan intercept
    if (!_hasHiddenBlocker(e.target, container)) return;

    // Ada blocker — perlu intercept manual
    if (!isHoriz) {
      var atTop    = container.scrollTop <= 0;
      var atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
      if (dy < 0 && atTop)    return;
      if (dy > 0 && atBottom) return;
    }

    e.preventDefault();
    if (isHoriz) {
      container.scrollLeft += dx;
    } else {
      container.scrollTop += dy;
    }
  }, { passive: false });
})();

// ─── CUSTOM DATE PICKER (shared) ─────────────────────────────
// Replace semua input[type=date] dengan custom kalender
// Konsisten di Android, iPhone, laptop
(function() {
  var _dp = null; // overlay aktif
  var _dpTarget = null; // input yg sedang di-edit

  // Nama hari dan bulan Indonesia
  var HARI  = ['MIN','SEN','SEL','RAB','KAM','JUM','SAB'];
  var BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
               'Juli','Agustus','September','Oktober','November','Desember'];

  function _dpCreate() {
    if (document.getElementById('zenot-datepicker')) return;
    var el = document.createElement('div');
    el.id = 'zenot-datepicker';
    el.style.cssText = [
      'position:fixed','z-index:999999','inset:0',
      'display:flex','align-items:center','justify-content:center',
      'background:rgba(0,0,0,0.55)','padding:16px','box-sizing:border-box'
    ].join(';');
    el.innerHTML = [
      '<div style="background:var(--cream2,#1e1e1e);border-radius:16px;padding:20px;width:100%;max-width:340px;box-shadow:0 8px 40px rgba(0,0,0,.6)">',
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">',
          '<button id="dp-prev" style="background:none;border:none;cursor:pointer;color:var(--ink,#eee);font-size:22px;padding:4px 10px;border-radius:8px">&#8249;</button>',
          '<button id="dp-month-label" style="background:none;border:none;cursor:pointer;color:var(--ink,#eee);font-size:16px;font-weight:700;padding:4px 8px"></button>',
          '<button id="dp-next" style="background:none;border:none;cursor:pointer;color:var(--ink,#eee);font-size:22px;padding:4px 10px;border-radius:8px">&#8250;</button>',
        '</div>',
        '<div id="dp-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:16px"></div>',
        '<div style="display:flex;gap:8px;justify-content:flex-end">',
          '<button id="dp-reset" style="background:var(--cream4,#333);border:none;cursor:pointer;color:var(--ink3,#888);border-radius:10px;padding:8px 18px;font-size:13px;font-weight:600">Atur Ulang</button>',
          '<button id="dp-ok" style="background:#2979ff;border:none;cursor:pointer;color:#fff;border-radius:50%;width:42px;height:42px;font-size:20px;font-weight:700">✓</button>',
        '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(el);

    // Close on overlay tap
    el.addEventListener('click', function(e) {
      if (e.target === el) _dpClose();
    });
    el.addEventListener('touchstart', function(e) {
      if (e.target === el) _dpClose();
    }, { passive: true });

    document.getElementById('dp-prev').onclick = function() { _dpNav(-1); };
    document.getElementById('dp-next').onclick = function() { _dpNav(1); };
    document.getElementById('dp-reset').onclick = function() { _dpSelectDate(null); };
    document.getElementById('dp-ok').onclick = _dpConfirm;
  }

  var _dpYear, _dpMonth, _dpDay; // state kalender

  function _dpOpen(inputEl) {
    _dpCreate();
    _dpTarget = inputEl;
    var val = inputEl.value; // YYYY-MM-DD
    var now = new Date();
    if (val && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      var parts = val.split('-');
      _dpYear  = parseInt(parts[0]);
      _dpMonth = parseInt(parts[1]) - 1;
      _dpDay   = parseInt(parts[2]);
    } else {
      _dpYear  = now.getFullYear();
      _dpMonth = now.getMonth();
      _dpDay   = now.getDate();
    }
    _dpRender();
    document.getElementById('zenot-datepicker').style.display = 'flex';
    // Stop scroll behind
    document.body.style.overflow = 'hidden';
  }

  function _dpClose() {
    var el = document.getElementById('zenot-datepicker');
    if (el) el.style.display = 'none';
    document.body.style.overflow = '';
    _dpTarget = null;
  }

  function _dpNav(dir) {
    _dpMonth += dir;
    if (_dpMonth > 11) { _dpMonth = 0; _dpYear++; }
    if (_dpMonth < 0)  { _dpMonth = 11; _dpYear--; }
    _dpRender();
  }

  function _dpRender() {
    var label = document.getElementById('dp-month-label');
    var grid  = document.getElementById('dp-grid');
    if (!label || !grid) return;
    label.textContent = BULAN[_dpMonth] + ' ' + _dpYear;

    var html = '';
    // Header hari
    HARI.forEach(function(h) {
      html += '<div style="text-align:center;font-size:10px;font-weight:700;color:var(--ink3,#888);padding:4px 0">' + h + '</div>';
    });
    // Offset hari pertama
    var firstDay = new Date(_dpYear, _dpMonth, 1).getDay();
    for (var i = 0; i < firstDay; i++) {
      html += '<div></div>';
    }
    // Hari dalam bulan
    var daysInMonth = new Date(_dpYear, _dpMonth + 1, 0).getDate();
    var today = new Date();
    for (var d = 1; d <= daysInMonth; d++) {
      var isSelected = (d === _dpDay);
      var isToday    = (d === today.getDate() && _dpMonth === today.getMonth() && _dpYear === today.getFullYear());
      var bg  = isSelected ? '#2979ff' : 'transparent';
      var clr = isSelected ? '#fff' : (isToday ? '#2979ff' : 'var(--ink,#eee)');
      var fw  = (isSelected || isToday) ? '700' : '400';
      var border = isToday && !isSelected ? '2px solid #2979ff' : '2px solid transparent';
      html += '<div onclick="_dpSelectDate(' + d + ')" style="' +
        'text-align:center;padding:7px 2px;border-radius:50%;cursor:pointer;' +
        'background:' + bg + ';color:' + clr + ';font-weight:' + fw + ';' +
        'border:' + border + ';font-size:14px;aspect-ratio:1;display:flex;align-items:center;justify-content:center' +
      '">' + d + '</div>';
    }
    grid.innerHTML = html;
  }

  function _dpSelectDate(d) {
    _dpDay = d;
    _dpRender();
  }

  function _dpConfirm() {
    if (!_dpTarget) { _dpClose(); return; }
    if (_dpDay) {
      var mm = String(_dpMonth + 1).padStart(2, '0');
      var dd = String(_dpDay).padStart(2, '0');
      _dpTarget.value = _dpYear + '-' + mm + '-' + dd;
      // Trigger change event supaya form listeners tahu
      _dpTarget.dispatchEvent(new Event('change', { bubbles: true }));
      _dpTarget.dispatchEvent(new Event('input',  { bubbles: true }));
    } else {
      _dpTarget.value = '';
    }
    _dpClose();
  }

  // Expose global
  window._dpOpen = _dpOpen;

  // Auto-attach ke semua input[type=date] saat DOM ready + saat halaman ganti
  function _dpAttachAll() {
    document.querySelectorAll('input[type="date"]').forEach(function(inp) {
      if (inp.dataset.dpAttached) return;
      inp.dataset.dpAttached = '1';
      inp.readOnly = true;
      inp.style.cursor = 'pointer';
      inp.style.caretColor = 'transparent';
      inp.addEventListener('click',      function(e) { e.preventDefault(); _dpOpen(inp); });
      inp.addEventListener('touchend',   function(e) { e.preventDefault(); _dpOpen(inp); });
      inp.addEventListener('keydown',    function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _dpOpen(inp); } });
    });
  }

  // Attach saat DOMContentLoaded dan saat navigasi page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _dpAttachAll);
  } else {
    _dpAttachAll();
  }
  // Re-attach setiap kali halaman berubah (zenot:page event)
  document.addEventListener('zenot:page', function() {
    setTimeout(_dpAttachAll, 100);
  });
  // Re-attach setiap kali modal dibuka (ada innerHTML injection)
  var _dpObserver = new MutationObserver(function() {
    _dpAttachAll();
  });
  _dpObserver.observe(document.body, { childList: true, subtree: true });

})();
