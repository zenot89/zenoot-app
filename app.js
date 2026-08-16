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

// Paksa tutup sidebar saat pertama load hanya kalau layar kecil (<= 900px)
// Touch device di laptop (touchscreen) tidak dianggap mobile
try {
  var _isNarrow = window.innerWidth <= 900;
  if (_isNarrow) {
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
    if (btn) { btn.classList.remove('hb-hidden'); btn.innerHTML = '<i class="ti ti-menu-2"></i>'; btn.setAttribute('aria-label','Buka menu'); }
  } else {
    sb.classList.add('open');
    ov.classList.add('open');
    if (btn) { btn.classList.add('hb-hidden'); btn.innerHTML = '<i class="ti ti-menu-2"></i>'; btn.setAttribute('aria-label','Tutup menu'); }
  }
}
function closeSidebar() {
  var sb  = $id('sidebar');
  var ov  = $id('sidebar-overlay');
  var btn = $id('btn-hamburger');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('open');
  if (btn) { btn.classList.remove('hb-hidden'); btn.innerHTML = '<i class="ti ti-menu-2"></i>'; btn.setAttribute('aria-label','Buka menu'); }
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
  'gadag':              { title:'Gadag',                sub:'ongkos jahit / makloon per lusin' },
  'jurnal-penjualan':   { title:'Jurnal Penjualan',    sub:'pencatatan transaksi penjualan' },
  'price-list':         { title:'Price List',          sub:'harga jual otomatis dari HPP'   },
  'dataorder':          { title:'Data Order',          sub:'upload & lihat order Shopee'    },
  'rekap':              { title:'Rekap & P&L',         sub:'laporan keuangan per toko'      },
  'produk':             { title:'Kelola Produk',       sub:'master SKU, HPP, dan boss'      },
  'channel':            { title:'Channel',             sub:'master data channel toko'       },
  'beban-operasional':  { title:'Beban Operasional',   sub:'acuan % beban & target NPM'     },
  'anggaran':           { title:'Anggaran Beban',      sub:'target & realisasi beban bulanan' },
  'keuangan':           { title:'Keuangan Operasional', sub:'hutang, neraca, rasio & valuasi' },
  'penutupan-periode':  { title:'Penutupan Periode',    sub:'month-end close & lock jurnal'   },
  'clearance':          { title:'Clearance Monitor',    sub:'SKU non-aktif yang masih ada stok' },
  'shopee-auth':        { title:'Shopee Connect',        sub:'koneksi & sinkronisasi toko Shopee' },
  'shopee-dashboard':   { title:'Analisis Shopee',        sub:'performa & insight toko Shopee'     },
  'proyeksi-harga':     { title:'Proyeksi Harga',         sub:'pricing engine & kalkulasi margin'  },
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
  document.body.dataset.page = page;
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
    var fullHeightPages = ['stok', 'jurnal-penjualan', 'clearance', 'produk-terjual', 'restock', 'produk', 'price-list', 'kas', 'penutupan-periode', 'gadag'];
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

// ─── PROYEKSI HARGA NAV ──────────────────────────────────────
function phGoto(section, btn) {
  // Toggle sub-list visibility
  var subList = $id('ni-proyeksi-sub');
  var group   = $id('ni-proyeksi-harga-group');
  if (subList) {
    var isOpen = subList.classList.contains('ni-sub-open');
    // Jika klik parent (proyeksi-ringkasan) dan sub sudah open → toggle tutup, kecuali klik sub-item
    if (btn && btn.classList.contains('nav-item-parent')) {
      subList.classList.toggle('ni-sub-open');
      group && group.classList.toggle('ni-sub-active', subList.classList.contains('ni-sub-open'));
    } else {
      subList.classList.add('ni-sub-open');
      group && group.classList.add('ni-sub-active');
    }
  }
  // Navigate ke page proyeksi-harga
  gotoPage('proyeksi-harga', $id('ni-proyeksi-harga-group'));
  // Auto-expand sub-menu saat landing ke proyeksi-harga
  var subList2 = $id('ni-proyeksi-sub');
  var group2   = $id('ni-proyeksi-harga-group');
  if (subList2) { subList2.classList.add('ni-sub-open'); group2 && group2.classList.add('ni-sub-active'); }
  // Switch section di dalam proyeksi-harga
  if (typeof switchPhSection === 'function') {
    switchPhSection(section);
  } else {
    // Tunggu sampai page ready lalu switch
    var tries = 0;
    var poll = setInterval(function() {
      tries++;
      if (typeof switchPhSection === 'function') { clearInterval(poll); switchPhSection(section); }
      else if (tries > 20) clearInterval(poll);
    }, 100);
  }
  // Active state untuk sub-items
  $all('.ni-sub').forEach(function(b) { b.classList.remove('ni-sub-active-item'); });
  if (btn && btn.classList.contains('ni-sub')) btn.classList.add('ni-sub-active-item');
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
  // Set halaman default
  if (!document.body.dataset.page) document.body.dataset.page = 'dashboard';
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

  // iOS Safari fix: postMessage dari SW ke existing clients tidak reliable di iOS.
  // controllerchange adalah event yang SELALU firing di iOS Safari saat SW baru take control —
  // tidak bergantung pada postMessage delivery. Ini fallback yang proper untuk auto update iOS.
  var _reloadOnController = false;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (_reloadOnController) return; // cegah double reload
    _reloadOnController = true;
    // Auto reload saat SW baru take control — standalone maupun browser biasa
    window.location.reload();
  });
}

// ─── UNIFIED PICKER CLOSE HANDLER ────────────────────────────
// Satu handler untuk semua custom picker (kas, keuangan, jurnal-penjualan).
// Menggantikan listener terpisah di masing-masing file yang saling konflik.
(function() {
  function _closeAllPickers(list) {
    // Detect dan panggil close function yang sesuai berdasarkan id prefix
    if (!list) return;
    // iOS Safari fix: jangan tutup picker jika search input di dalamnya sedang focused
    // (keyboard muncul → visualViewport resize → scroll event → picker ditutup salah)
    var searchInp = list.querySelector('.kas-akun-search');
    if (searchInp && document.activeElement === searchInp) return;
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

  // Mousedown / touchstart / pointerdown di luar picker → tutup semua
  // Guard _pickerJustOpened diperpanjang ke 400ms untuk iOS Safari:
  // pada iOS, touchstart dari tap yang sama bisa bubble ke document
  // setelah pointerdown yang membuka picker — tanpa guard cukup panjang,
  // picker langsung tertutup lagi setelah dibuka (race condition).
  var _pickerJustOpened = false;
  var _pickerJustOpenedTimer = null;
  window._kasPickerJustOpened = function() {
    _pickerJustOpened = true;
    if (_pickerJustOpenedTimer) clearTimeout(_pickerJustOpenedTimer);
    _pickerJustOpenedTimer = setTimeout(function() {
      _pickerJustOpened = false;
      _pickerJustOpenedTimer = null;
    }, 400); // 400ms — cukup cover seluruh touch gesture di iOS
  };
  function _isInsidePicker(target) {
    if (!target || !target.closest) return false;
    return !!(
      target.closest('[data-picker]')          ||
      target.closest('.kas-akun-picker')       ||
      target.closest('.kas-akun-list')         ||
      target.closest('.kas-akun-search-wrap')  ||
      target.closest('.kas-akun-search')       ||
      target.closest('.keu-akun-picker')       ||
      target.closest('.keu-akun-list')         ||
      target.closest('.keu-akun-search-wrap')  ||
      target.closest('.keu-akun-search')       ||
      target.closest('[id^="jp-picker"]')      ||
      target.closest('.jp-akun-list')          ||
      target.closest('[class*="jp-picker"]')
    );
  }
  function _onOutsideDown(e) {
    if (_pickerJustOpened) return; // guard: picker baru dibuka dalam 400ms terakhir
    if (_isInsidePicker(e.target)) return;
    document.querySelectorAll('.kas-akun-list').forEach(_closeAllPickers);
  }
  document.addEventListener('mousedown',  _onOutsideDown);
  document.addEventListener('touchstart', _onOutsideDown, { passive: true });
  // pointerdown untuk browser modern (iOS Safari 13+, Chrome Android)
  if (window.PointerEvent) {
    document.addEventListener('pointerdown', function(e) {
      if (!e.isPrimary) return; // hanya primary pointer, hindari multi-touch noise
      _onOutsideDown(e);
    });
  }

  // Scroll di luar list → tutup yang sedang float di body
  // Guard ganda:
  // 1. _pickerJustOpened (400ms) — picker yang BARU dibuka sering memicu
  //    scroll bawaan browser (mis. .modal overflow-y:auto auto-scroll
  //    untuk bring tapped element into view) SEBELUM search input di-focus
  //    pada 80ms. Tanpa guard ini, scroll event tsb membuat _closeAllPickers
  //    jalan dan list langsung ditutup ulang — lalu reposisi berikutnya
  //    (visualViewport resize / _settle) bekerja pada list yang sudah
  //    'display:none', menghasilkan posisi akhir yang tidak konsisten
  //    ("pindah-pindah") tergantung timing scroll vs focus per device.
  // 2. activeElement === .kas-akun-search — skip jika user sedang ketik
  //    di search box (iOS keyboard resize memicu scroll event palsu).
  document.addEventListener('scroll', function(e) {
    if (_pickerJustOpened) return;
    if (e.target && e.target.closest && e.target.closest('.kas-akun-list')) return;
    if (document.activeElement && document.activeElement.classList.contains('kas-akun-search')) return;
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
          '<button id="dp-prev-yr" style="background:none;border:none;cursor:pointer;color:var(--ink3,#888);font-size:14px;padding:4px 6px;border-radius:8px" title="Tahun sebelumnya">&#8249;&#8249;</button>',
          '<button id="dp-prev" style="background:none;border:none;cursor:pointer;color:var(--ink,#eee);font-size:22px;padding:4px 10px;border-radius:8px">&#8249;</button>',
          '<button id="dp-month-label" style="background:none;border:none;cursor:pointer;color:var(--ink,#eee);font-size:16px;font-weight:700;padding:4px 8px"></button>',
          '<button id="dp-next" style="background:none;border:none;cursor:pointer;color:var(--ink,#eee);font-size:22px;padding:4px 10px;border-radius:8px">&#8250;</button>',
          '<button id="dp-next-yr" style="background:none;border:none;cursor:pointer;color:var(--ink3,#888);font-size:14px;padding:4px 6px;border-radius:8px" title="Tahun berikutnya">&#8250;&#8250;</button>',
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
    document.getElementById('dp-prev-yr').onclick = function() { _dpNavYear(-1); };
    document.getElementById('dp-next-yr').onclick = function() { _dpNavYear(1); };
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

  function _dpNavYear(dir) {
    _dpYear += dir;
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
  window._dpOpen       = _dpOpen;
  window._dpSelectDate = _dpSelectDate;
  window._dpNavYear    = _dpNavYear;

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

// ─── iOS KEYBOARD PUSH-UP ─────────────────────────────────────
// iOS Safari TIDAK menaikkan konten saat keyboard muncul untuk
// elemen position:fixed. Akibatnya modal tertimpa keyboard.
// Fix: listen visualViewport resize, adjust bottom padding modal-overlay
// sehingga konten naik mengikuti keyboard — identik dengan Android.
//
// Hanya aktif di iOS. Android & desktop tidak perlu ini karena
// browser mereka sudah handle dengan benar.
(function() {
  var _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (!_isIOS) return;
  if (!window.visualViewport) return;

  var _lastKeyboardH = 0;
  var _raf = null;

  function _applyKeyboardOffset() {
    _raf = null;
    // Hitung tinggi keyboard: selisih window height vs visual viewport height
    // Jika ada safe area bottom, dikurangi untuk akurasi
    var vvH     = window.visualViewport.height;
    var winH    = window.innerHeight;
    var safeB   = 0;
    // Coba baca env(safe-area-inset-bottom) via computed style trick
    var _safeEl = document.getElementById('_zenot-safe-probe');
    if (_safeEl) safeB = parseInt(getComputedStyle(_safeEl).paddingBottom) || 0;

    var keyboardH = Math.max(0, winH - vvH - safeB);
    _lastKeyboardH = keyboardH;

    // Semua modal-overlay yang sedang open → geser ke atas sebesar keyboard
    document.querySelectorAll('.modal-overlay.open').forEach(function(overlay) {
      if (keyboardH > 0) {
        var modal = overlay.querySelector('.modal');
        var modalH = modal ? modal.getBoundingClientRect().height : 0;
        var safeT = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0') || 0;
        if (!safeT) {
          // fallback: baca dari probe element top
          var _probeT = document.getElementById('_zenot-safe-probe-top');
          if (_probeT) safeT = parseInt(getComputedStyle(_probeT).paddingTop) || 0;
        }
        var availH = window.innerHeight - keyboardH;
        var topPad = modalH > 0 ? Math.max(safeT + 8, (availH - modalH) / 2) : (safeT + 16);
        overlay.style.bottom     = keyboardH + 'px';
        overlay.style.top        = '0';
        overlay.style.height     = availH + 'px';
        overlay.style.alignItems = 'flex-start';
        overlay.style.paddingTop = topPad + 'px';
      } else {
        overlay.style.bottom     = '';
        overlay.style.top        = '';
        overlay.style.height     = '';
        overlay.style.alignItems = '';
        overlay.style.paddingTop = '';
      }
    });

    // CATATAN: repositioning .kas-akun-list[data-floated] TIDAK dilakukan di
    // sini lagi. Sebelumnya ada 2 listener visualViewport.resize yang
    // sama-sama reposisi picker list (di sini DAN di kas.js _settleDeferred),
    // dengan timing RAF berbeda (1x RAF vs 2x RAF) — race condition ini
    // menyebabkan posisi akhir list "berubah-ubah" tiap kali keyboard
    // animasi (tergantung urutan eksekusi mana yang menang).
    // Sekarang HANYA kas.js (_settleDeferred, double-RAF) yang reposisi
    // picker list, dan ia berjalan SETELAH overlay-shift di atas selesai
    // (1x RAF) — sehingga rect picker yang dibaca sudah final untuk tick ini.
  }


  // Safe area probe elements — invisible div untuk baca CSS env()
  (function() {
    var probe = document.createElement('div');
    probe.id = '_zenot-safe-probe';
    probe.style.cssText = 'position:fixed;bottom:0;left:0;width:0;height:0;' +
      'padding-bottom:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden;';
    document.body.appendChild(probe);

    var probeT = document.createElement('div');
    probeT.id = '_zenot-safe-probe-top';
    probeT.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;' +
      'padding-top:env(safe-area-inset-top,0px);pointer-events:none;visibility:hidden;';
    document.body.appendChild(probeT);
  })();

  // Listen resize: keyboard muncul/hilang
  window.visualViewport.addEventListener('resize', function() {
    if (_raf) cancelAnimationFrame(_raf);
    _raf = requestAnimationFrame(_applyKeyboardOffset);
  });

  // Reset saat modal ditutup
  document.addEventListener('zenot:modal:close', function() {
    _lastKeyboardH = 0;
  });

  // MutationObserver: detect saat modal dibuka/ditutup → reset atau apply offset
  // Lebih reliable dari patch showModal karena tidak terpengaruh urutan script load
  var _modalObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.type !== 'attributes' || m.attributeName !== 'class') return;
      var el = m.target;
      if (!el.classList.contains('modal-overlay')) return;
      if (!el.classList.contains('open')) {
        // Modal ditutup → bersihkan offset
        el.style.bottom    = '';
        el.style.top       = '';
        el.style.alignItems = '';
        el.style.paddingTop = '';
        _lastKeyboardH = 0;
      }
      // Saat modal dibuka, biarkan _applyKeyboardOffset handle jika keyboard sudah muncul
    });
  });
  // Observe semua modal-overlay yang ada dan yang mungkin ditambahkan nanti
  function _observeModals() {
    document.querySelectorAll('.modal-overlay').forEach(function(el) {
      _modalObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _observeModals);
  } else {
    _observeModals();
  }
  // Re-observe setiap kali DOM berubah (modal diinject dinamis)
  var _domWatcher = new MutationObserver(function() { _observeModals(); });
  _domWatcher.observe(document.body, { childList: true, subtree: false });
})();


// ─── HIDE-ON-SCROLL TOPBAR ────────────────────────────────────
// Topbar tersembunyi saat user scroll DOWN di .content,
// muncul kembali saat scroll UP atau di dekat puncak halaman.
// Berlaku di semua halaman (dashboard, stok, kas, dll).
// Tidak aktif saat fullscreen pages (overflow:hidden) karena .content
// tidak bisa discroll → tidak ada scroll event yang fire.
(function() {
  var _topbar    = null;
  var _content   = null;
  var _lastY     = 0;
  var _ticking   = false;
  var _hidden    = false;
  var THRESHOLD  = 6;   // px minimum sebelum react (cegah noise)
  var SHOW_ZONE  = 60;  // px dari atas → selalu tampil

  function _onScroll() {
    if (_ticking) return;
    _ticking = true;
    requestAnimationFrame(function() {
      _ticking = false;
      if (!_topbar || !_content) return;
      // Dashboard: topbar selalu diam, tidak ikut scroll
      var activePage = document.body.dataset.page || '';
      if (activePage === 'dashboard') {
        if (_hidden) { _topbar.classList.remove('topbar-hidden'); _hidden = false; }
        _lastY = _content.scrollTop;
        return;
      }
      var y   = _content.scrollTop;
      var dy  = y - _lastY;

      if (y < SHOW_ZONE) {
        // Dekat atas → selalu tampilkan
        if (_hidden) { _topbar.classList.remove('topbar-hidden'); _hidden = false; }
      } else if (dy > THRESHOLD && !_hidden) {
        // Scroll DOWN → sembunyikan
        _topbar.classList.add('topbar-hidden');
        _hidden = true;
      } else if (dy < -THRESHOLD && _hidden) {
        // Scroll UP → tampilkan
        _topbar.classList.remove('topbar-hidden');
        _hidden = false;
      }
      _lastY = y;
    });
  }

  function _attachHideScroll() {
    _topbar  = document.querySelector('.topbar');
    _content = document.querySelector('.content');
    if (!_topbar || !_content) return;
    // Bersihkan listener lama
    _content.removeEventListener('scroll', _onScroll, { passive: true });
    _content.addEventListener('scroll', _onScroll, { passive: true });
    _lastY  = _content.scrollTop;
    _hidden = false;
    _topbar.classList.remove('topbar-hidden');
  }

  // Attach saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _attachHideScroll);
  } else {
    _attachHideScroll();
  }

  // Re-show topbar saat navigasi halaman (zenot:page)
  document.addEventListener('zenot:page', function() {
    if (!_topbar) _topbar = document.querySelector('.topbar');
    if (_topbar)  { _topbar.classList.remove('topbar-hidden'); _hidden = false; }
    if (!_content) _content = document.querySelector('.content');
    if (_content)  _lastY = _content.scrollTop;
  });
})();
