// ─── AUTOCOMPLETE.JS — Global Autocomplete / History Suggestions ──────────────
// Attach ke semua input text yang relevan di zenOt.
// Sumber data: Supabase (real data, bukan hanya session history).
// Cara kerja:
//   1. Saat halaman load, fetch semua nilai unik dari kolom Supabase yang relevan
//   2. Cache di memory
//   3. Attach dropdown ke setiap input yang terdaftar
//   4. Filter saat user ketik (case-insensitive, partial match)
// Tidak ada perubahan di file lain — modul ini self-contained.

(function() {
  'use strict';

  // ─── CACHE DATA ──────────────────────────────────────────────────────────────
  // key → array of unique string values
  var _acCache = {};
  var _acFetched = {};

  // Definisi source: key → { table, column }
  var _acSources = {
    'keterangan_jurnal':   { table: 'jurnal',       column: 'keterangan'  },
    'referensi_jurnal':    { table: 'jurnal',       column: 'referensi'   },
    'sub_kelompok_akun':   { table: 'kas_akun',     column: 'sub_kelompok'},
    'nama_akun':           { table: 'kas_akun',     column: 'nama'        },
    'kreditur_hutang':     { table: 'hutang',       column: 'kreditur'    },
    'keterangan_hutang':   { table: 'hutang',       column: 'keterangan'  },
    'keterangan_bayar':    { table: 'hutang_bayar', column: 'keterangan'  },
    'warna_gadag':         { table: 'gadag_pendapatan', column: 'warna'  },
  };

  // ─── FETCH CACHE ─────────────────────────────────────────────────────────────
  async function _acFetch(sourceKey) {
    if (_acFetched[sourceKey]) return;
    _acFetched[sourceKey] = true;
    var src = _acSources[sourceKey];
    if (!src) return;
    try {
      var rows = await dbGet(src.table, '&select=' + src.column + '&order=' + src.column + '.asc').catch(function() { return []; });
      var vals = [];
      (rows || []).forEach(function(r) {
        var v = (r[src.column] || '').trim();
        if (v && vals.indexOf(v) === -1) vals.push(v);
      });
      vals.sort(function(a, b) { return a.localeCompare(b, 'id'); });
      _acCache[sourceKey] = vals;
    } catch(e) {
      _acCache[sourceKey] = [];
    }
  }

  // Refresh cache satu source (dipanggil setelah simpan data baru)
  function acRefresh(sourceKey) {
    _acFetched[sourceKey] = false;
    _acFetch(sourceKey);
  }
  window.acRefresh = acRefresh;

  // ─── DROPDOWN ELEMENT ─────────────────────────────────────────────────────────
  var _acDropdown = null;
  var _acActiveInput = null;

  function _acGetDropdown() {
    if (!_acDropdown) {
      _acDropdown = document.createElement('div');
      _acDropdown.id = 'ac-dropdown';
      _acDropdown.style.cssText = [
        'position:fixed',
        'z-index:9999',
        'background:var(--cream)',
        'border:2px solid var(--ink)',
        'border-radius:4px',
        'box-shadow:0 4px 16px rgba(0,0,0,0.18)',
        'max-height:200px',
        'overflow-y:auto',
        'display:none',
        'min-width:180px',
      ].join(';');
      document.body.appendChild(_acDropdown);
    }
    return _acDropdown;
  }

  function _acHide() {
    var dd = _acGetDropdown();
    dd.style.display = 'none';
    dd.innerHTML = '';
    _acActiveInput = null;
  }

  function _acShow(input, items) {
    var dd = _acGetDropdown();
    if (!items || items.length === 0) { _acHide(); return; }

    dd.innerHTML = items.map(function(val, i) {
      return '<div class="ac-item" data-val="' + _acEsc(val) + '" style="' +
        'padding:9px 12px;' +
        'font-size:13px;' +
        'cursor:pointer;' +
        'border-bottom:1px solid var(--ink4);' +
        'color:var(--ink);' +
        'white-space:nowrap;' +
        'overflow:hidden;' +
        'text-overflow:ellipsis;' +
        '">' + _acHighlight(val, input.value) + '</div>';
    }).join('');

    // Posisi dropdown: default di bawah input. Kalau input._acPosition === 'right',
    // muncul di SEBELAH KANAN input (boleh menimpa field lain di sebelahnya —
    // ini overlay sementara, bukan bagian dari layout). Maks ~5 item keliatan,
    // sisanya scroll (overflow-y:auto sudah di-set di _acGetDropdown).
    var rect = input.getBoundingClientRect();
    if (input._acPosition === 'right') {
      var ddWidth  = 170;
      var left     = rect.right + 6;
      var maxLeft  = window.innerWidth - ddWidth - 8;
      if (left > maxLeft) left = Math.max(8, maxLeft);
      dd.style.left      = left + 'px';
      dd.style.top       = rect.top + 'px';
      dd.style.width     = ddWidth + 'px';
      dd.style.maxHeight = '192px'; // ~5 item (item ≈ 38px), lebih dari itu discroll
    } else {
      dd.style.left      = rect.left + 'px';
      dd.style.top       = (rect.bottom + 2) + 'px';
      dd.style.width     = Math.max(rect.width, 200) + 'px';
      dd.style.maxHeight = '200px';
    }
    dd.style.display = 'block';
    _acActiveInput   = input;

    // Click handler tiap item
    dd.querySelectorAll('.ac-item').forEach(function(item) {
      item.addEventListener('mousedown', function(e) {
        e.preventDefault(); // cegah blur dulu
        var val = item.getAttribute('data-val');
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        _acHide();
      });
    });
  }

  function _acEsc(s) {
    return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function _acHighlight(text, query) {
    if (!query) return _acEsc(text);
    var idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return _acEsc(text);
    return _acEsc(text.slice(0, idx)) +
      '<b style="color:var(--ink);background:rgba(255,220,0,0.35);border-radius:2px">' +
      _acEsc(text.slice(idx, idx + query.length)) + '</b>' +
      _acEsc(text.slice(idx + query.length));
  }

  // ─── ATTACH KE INPUT ─────────────────────────────────────────────────────────
  // sourceKey: salah satu key dari _acSources
  // input: HTMLInputElement
  function acAttach(input, sourceKey, opts) {
    if (!input || input._acAttached) return;
    input._acAttached  = true;
    input._acSourceKey = sourceKey;
    input._acPosition  = (opts && opts.position) || 'bottom';

    // Fetch cache saat fokus pertama kali
    input.addEventListener('focus', function() {
      _acFetch(sourceKey).then(function() {
        var q   = input.value.trim();
        var all = _acCache[sourceKey] || [];
        var filtered = q
          ? all.filter(function(v) { return v.toLowerCase().indexOf(q.toLowerCase()) !== -1; })
          : all.slice(0, 8); // Tampilkan 8 teratas kalau belum ketik
        _acShow(input, filtered);
      });
    });

    input.addEventListener('input', function() {
      var q   = input.value.trim();
      var all = _acCache[sourceKey] || [];
      if (!q) {
        _acShow(input, all.slice(0, 8));
        return;
      }
      var filtered = all.filter(function(v) {
        return v.toLowerCase().indexOf(q.toLowerCase()) !== -1;
      });
      _acShow(input, filtered.slice(0, 10));
    });

    input.addEventListener('blur', function() {
      // Delay agar mousedown pada item sempat jalan dulu
      setTimeout(_acHide, 180);
    });

    input.addEventListener('keydown', function(e) {
      var dd = _acGetDropdown();
      if (dd.style.display === 'none') return;
      var items = dd.querySelectorAll('.ac-item');
      var active = dd.querySelector('.ac-item.ac-active');
      var idx = -1;
      items.forEach(function(it, i) { if (it === active) idx = i; });

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var next = items[idx + 1] || items[0];
        if (active) active.classList.remove('ac-active');
        next.classList.add('ac-active');
        next.style.background = 'var(--ink4)';
        if (active) active.style.background = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = items[idx - 1] || items[items.length - 1];
        if (active) { active.classList.remove('ac-active'); active.style.background = ''; }
        prev.classList.add('ac-active');
        prev.style.background = 'var(--ink4)';
      } else if (e.key === 'Enter' && active) {
        e.preventDefault();
        input.value = active.getAttribute('data-val');
        input.dispatchEvent(new Event('input',  { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        _acHide();
      } else if (e.key === 'Escape') {
        _acHide();
      }
    });
  }
  window.acAttach = acAttach;

  // ─── GLOBAL CLOSE on click outside ──────────────────────────────────────────
  document.addEventListener('mousedown', function(e) {
    var dd = document.getElementById('ac-dropdown');
    if (!dd) return;
    if (_acActiveInput && e.target === _acActiveInput) return;
    if (dd.contains(e.target)) return;
    _acHide();
  });

  // ─── AUTO-ATTACH: scan setiap kali page berubah ──────────────────────────────
  // Map: input id → sourceKey
  var _acInputMap = {
    // Kas & Jurnal
    'kas-jrn-ket':     'keterangan_jurnal',
    'kas-jrn-ref':     'referensi_jurnal',
    'akun-sub':        'sub_kelompok_akun',
    'akun-nama':       'nama_akun',
    // Keuangan Ops
    'keu-bayar-ket':   'keterangan_bayar',
    'keu-htg-kreditur':'kreditur_hutang',
    'keu-htg-ket':     'keterangan_hutang',
    // Penutupan Periode
    'pp-catatan':      'keterangan_jurnal',
    // Gadag — dropdown muncul di sebelah kanan input (boleh menimpa SKU)
    'gdg-pend-warna':  { source: 'warna_gadag', position: 'right' },
  };

  function _acScanPage() {
    Object.keys(_acInputMap).forEach(function(id) {
      var el  = document.getElementById(id);
      if (!el) return;
      var cfg = _acInputMap[id];
      if (typeof cfg === 'string') {
        acAttach(el, cfg);
      } else {
        acAttach(el, cfg.source, { position: cfg.position });
      }
    });
  }

  // Scan saat page event
  document.addEventListener('zenot:page', function() {
    setTimeout(_acScanPage, 300);
  });

  // Scan saat DOM berubah (untuk field yang dirender dinamis via innerHTML)
  var _acObserver = new MutationObserver(function(mutations) {
    var relevant = mutations.some(function(m) {
      return m.addedNodes.length > 0;
    });
    if (relevant) setTimeout(_acScanPage, 100);
  });
  _acObserver.observe(document.body, { childList: true, subtree: true });

  // Scan awal
  setTimeout(_acScanPage, 800);

})();
