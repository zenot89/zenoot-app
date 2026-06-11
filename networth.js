// ─── NETWORTH.JS — Net Worth Real-Time ───────────────────────
(function () {

  const NW_POLL_MS = 15 * 60 * 1000;
  let _nwTimer   = null;
  let _nwRunning = false;

  function _log() {} // debug disabled

  // ─── FORMAT RUPIAH ───────────────────────────────────────────
  function _rp(val) {
    if (typeof fmtRpFull === 'function') return fmtRpFull(Math.abs(val));
    if (typeof _fmtRp   === 'function') return _fmtRp(Math.abs(val));
    return 'Rp' + Math.round(Math.abs(val)).toLocaleString('id-ID');
  }

  function _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ─── INJECT STYLES ───────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('nw-styles')) return;
    const s = document.createElement('style');
    s.id = 'nw-styles';
    s.textContent = `
      #nw-widget { margin: 0 0 10px 0; }
      .nw-card {
        background: var(--cream2);
        border: none; border-radius: 8px;
        padding: 12px 16px;
        position: relative; overflow: hidden;
        box-shadow: var(--card-shadow);
      }
      .nw-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
      .nw-title { font-size:11px; font-weight:700; letter-spacing:0.08em; color:var(--ink3,#888); text-transform:uppercase; display:flex; align-items:center; gap:6px; }
      .nw-actions { display:flex; align-items:center; gap:8px; }
      .nw-badge { font-size:10px; font-weight:600; padding:2px 8px; border-radius:20px; letter-spacing:0.04em; }
      .nw-badge-live    { background:rgba(76,175,80,0.15);  color:var(--ok,#4caf50); }
      .nw-badge-loading { background:rgba(255,193,7,0.15);  color:#f0b429; }
      .nw-badge-offline { background:rgba(224,82,82,0.15);  color:var(--danger,#e05252); }
      .nw-refresh-btn { background:none; border:none; cursor:pointer; color:var(--ink3,#888); padding:4px; border-radius:6px; line-height:1; transition:color .2s,background .2s; }
      .nw-refresh-btn:hover { color:var(--ink,#eee); background:rgba(255,255,255,0.06); }
      .nw-refresh-spin { animation:nw-spin 1s linear infinite; }
      @keyframes nw-spin { to { transform:rotate(360deg); } }
      .nw-total-wrap { margin-bottom:12px; }
      .nw-total { font-size:clamp(22px,4vw,32px); font-weight:700; color:var(--ink,#eee); letter-spacing:-0.01em; line-height:1.1; }
      .nw-update-time { font-size:11px; color:var(--ink3,#888); margin-top:3px; }
      .nw-breakdown { display:grid; grid-template-columns:1fr 1fr; gap:4px 24px; }
      @media (max-width:600px) { .nw-breakdown { grid-template-columns:1fr; } }
      .nw-row { display:flex; justify-content:space-between; align-items:center; padding:4px 0; font-size:12px; }
      .nw-row-label { color:var(--ink3,#888); display:flex; align-items:center; gap:5px; }
      .nw-row-val { font-weight:600; font-size:12px; font-variant-numeric:tabular-nums; }
      .nw-pos { color:var(--ok,#4caf50); }
      .nw-neg { color:var(--danger,#e05252); }
      .nw-shopee-badge { font-size:9px; padding:1px 5px; border-radius:10px; font-weight:600; }
      .nw-shopee-badge.live    { background:rgba(76,175,80,0.15);  color:var(--ok,#4caf50); }
      .nw-shopee-badge.offline { background:rgba(255,193,7,0.12);  color:#f0b429; }
    `;
    document.head.appendChild(s);
  }



  // ─── HITUNG TOTAL ASET ───────────────────────────────────────
  async function _getTotalAset() {
    try {
      _log('fetch aset: kasAkun,jurnal,produk,stok,jp...');
      const [kasAkun, jurnal, produk, stok, jual] = await Promise.all([
        _withTimeout(dbGet('kas_akun', ''),                       [], 8000).catch(() => []),
        _withTimeout(dbGet('jurnal',   ''),                       [], 8000).catch(() => []),
        _withTimeout(dbGet('produk',   ''),                       [], 8000).catch(() => []),
        _withTimeout(dbGet('stok',     ''),                       [], 8000).catch(() => []),
        _withTimeout(dbGet('jurnal_penjualan', '&select=sku,qty'),[], 8000).catch(() => [])
      ]);
      _log('got: kasAkun=' + (kasAkun||[]).length + ' jurnal=' + (jurnal||[]).length + ' produk=' + (produk||[]).length + ' stok=' + (stok||[]).length + ' jp=' + (jual||[]).length);
      const akunMap = {};
      (kasAkun || []).forEach(a => { akunMap[a.id] = {...a, saldoDebit:0, saldoKredit:0}; });
      (jurnal  || []).forEach(r => {
        const n = Number(r.nominal || r.debit || 0);
        if (akunMap[r.akun_debit_id])  akunMap[r.akun_debit_id].saldoDebit   += n;
        if (akunMap[r.akun_kredit_id]) akunMap[r.akun_kredit_id].saldoKredit += n;
      });
      const totalAsetJurnal = Object.values(akunMap)
        .filter(a => a.kelompok === 'aset' && a.sub_kelompok !== 'Persediaan')
        .reduce((s, a) => s + Math.max(0, a.saldoDebit - a.saldoKredit), 0);
      const stokMap = {};
      (stok || []).forEach(s => { stokMap[(s.sku_variasi||'').toUpperCase()] = s.stok_masuk || 0; });
      const keluarMap = {};
      (jual || []).forEach(j => { const k=(j.sku||'').toUpperCase(); keluarMap[k]=(keluarMap[k]||0)+(j.qty||0); });
      const nilaiPersediaan = (produk || []).reduce((s, p) => {
        const key  = (p.sku_variasi||'').toUpperCase();
        const sisa = (stokMap[key]||0) - (keluarMap[key]||0);
        return s + (sisa > 0 ? sisa * (p.hpp||0) : 0);
      }, 0);
      _log('asetJurnal=' + totalAsetJurnal + ' persediaan=' + nilaiPersediaan);
      return totalAsetJurnal + nilaiPersediaan;
    } catch(e) {
      _log('ERROR _getTotalAset: ' + e.message);
      return 0;
    }
  }

  // ─── HITUNG TOTAL HUTANG ─────────────────────────────────────
  async function _getTotalHutang() {
    try {
      _log('fetch hutang...');
      const [hutangList, bayarList] = await Promise.all([
        _withTimeout(dbGet('hutang',       ''), [], 8000).catch(() => []),
        _withTimeout(dbGet('hutang_bayar', ''), [], 8000).catch(() => [])
      ]);
      _log('hutang=' + (hutangList||[]).length + ' bayar=' + (bayarList||[]).length);
      const bayarMap = {};
      (bayarList||[]).forEach(b => { bayarMap[b.hutang_id] = (bayarMap[b.hutang_id]||0) + Number(b.nominal||0); });
      return (hutangList||[]).reduce((s, h) => {
        const sisa = (h.pokok||0) - (bayarMap[h.id]||0);
        return s + (sisa > 0 ? sisa : 0);
      }, 0);
    } catch(e) {
      _log('ERROR _getTotalHutang: ' + e.message);
      return 0;
    }
  }

  // ─── HITUNG LABA / RUGI ──────────────────────────────────────
  async function _getLabaRugi() {
    try {
      _log('fetch labarugi...');
      const [kasAkun, jurnal] = await Promise.all([
        _withTimeout(dbGet('kas_akun', ''), [], 8000).catch(() => []),
        _withTimeout(dbGet('jurnal',   ''), [], 8000).catch(() => [])
      ]);
      const saldoMap = {};
      (jurnal || []).forEach(r => {
        const n = Number(r.nominal || r.debit || 0);
        if (r.akun_debit_id)  { if (!saldoMap[r.akun_debit_id])  saldoMap[r.akun_debit_id]  = {debit:0,kredit:0}; saldoMap[r.akun_debit_id].debit   += n; }
        if (r.akun_kredit_id) { if (!saldoMap[r.akun_kredit_id]) saldoMap[r.akun_kredit_id] = {debit:0,kredit:0}; saldoMap[r.akun_kredit_id].kredit += n; }
      });
      let totalPend = 0, totalBeban = 0;
      (kasAkun || []).forEach(a => {
        const s = saldoMap[a.id] || {debit:0, kredit:0};
        if (a.kelompok === 'pendapatan') totalPend  += (s.kredit - s.debit);
        if (a.kelompok === 'beban')      totalBeban += (s.debit  - s.kredit);
      });
      _log('labaRugi: pend=' + totalPend + ' beban=' + totalBeban);
      return { totalPend, totalBeban, laba: totalPend - totalBeban };
    } catch(e) {
      _log('ERROR _getLabaRugi: ' + e.message);
      return { totalPend: 0, totalBeban: 0, laba: 0 };
    }
  }

  // ─── AMBIL DATA SHOPEE ───────────────────────────────────────
  async function _fetchShopeeCache() {
    try {
      _log('fetch shopee cache...');
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/shopee_finance_cache?select=*&order=fetched_at.desc&limit=1',
        { headers: _headers() }
      );
      if (!res.ok) { _log('shopee HTTP ' + res.status); return null; }
      const data = await res.json();
      _log('shopee rows=' + (data||[]).length);
      return data && data.length > 0 ? data[0] : null;
    } catch(e) {
      _log('ERROR shopee: ' + e.message);
      return null;
    }
  }

  // ─── TIMEOUT WRAPPER ─────────────────────────────────────────
  function _withTimeout(promise, fallback, ms) {
    ms = ms || 8000;
    return Promise.race([
      promise,
      new Promise(function(resolve) {
        setTimeout(function() {
          _log('TIMEOUT ' + ms + 'ms');
          resolve(fallback);
        }, ms);
      })
    ]);
  }

  // ─── WAIT FOR dbGet — retry loop ────────────────────────────
  function _waitForDbGet(callback) {
    var attempts = 0;
    var delays = [100, 200, 300, 500, 800, 1000, 1500, 2000, 2000, 1600];
    function check() {
      _log('dbGet check #' + (attempts+1) + ' ready=' + (typeof dbGet === 'function'));
      if (typeof dbGet === 'function') { callback(); return; }
      if (attempts >= delays.length) {
        _log('dbGet GAGAL TOTAL setelah ' + attempts + ' attempt');
        var badge = document.getElementById('nw-status-badge');
        if (badge) { badge.textContent = '⚠ Gagal memuat'; badge.className = 'nw-badge nw-badge-offline'; }
        _set('nw-update-time', 'Tap refresh untuk coba lagi');
        return;
      }
      setTimeout(check, delays[attempts++]);
    }
    check();
  }

  // ─── KALKULASI & RENDER ──────────────────────────────────────
  async function _calculate() {
    if (!document.getElementById('nw-total')) { _log('nw-total DOM not found!'); return; }
    if (_nwRunning) { _log('skip: sedang running'); return; }
    _nwRunning = true;

    if (typeof dbGet !== 'function') {
      _log('dbGet not ready, queue...');
      _nwRunning = false;
      _waitForDbGet(function() { _calculate(); });
      return;
    }

    _log('_calculate START');
    const icon = document.getElementById('nw-refresh-icon');
    if (icon) icon.classList.add('nw-refresh-spin');

    var badge = document.getElementById('nw-status-badge');
    if (badge && badge.textContent.indexOf('LIVE') === -1) {
      badge.textContent = '⏳ Memuat...';
      badge.className   = 'nw-badge nw-badge-loading';
    }

    try {
      const [totalAset, totalHutang, shopeeCache, labaRugi] = await Promise.all([
        _withTimeout(_getTotalAset(),     0,    10000),
        _withTimeout(_getTotalHutang(),   0,    10000),
        _withTimeout(_fetchShopeeCache(), null, 10000),
        _withTimeout(_getLabaRugi(),      {totalPend:0,totalBeban:0,laba:0}, 10000)
      ]);

      _log('RESULT aset=' + totalAset + ' hutang=' + totalHutang + ' laba=' + labaRugi.laba + ' shopee=' + (shopeeCache?'ok':'null'));

      const escrow   = shopeeCache ? Number(shopeeCache.escrow_transit || 0) : 0;
      const wallet   = shopeeCache ? Number(shopeeCache.wallet_balance || 0) : 0;
      const isLive   = shopeeCache !== null;
      const netWorth = totalAset - totalHutang + escrow + wallet + labaRugi.laba;

      _set('nw-total', (netWorth < 0 ? '-' : '') + _rp(netWorth));
      const totalEl = document.getElementById('nw-total');
      if (totalEl) totalEl.style.color = netWorth >= 0 ? 'var(--ok,#4caf50)' : 'var(--danger,#e05252)';

      _set('nw-aset',   '+' + _rp(totalAset));
      _set('nw-hutang', totalHutang > 0 ? '-' + _rp(totalHutang) : _rp(0));
      _set('nw-escrow', '+' + _rp(escrow));
      _set('nw-wallet', '+' + _rp(wallet));
      const labaEl = document.getElementById('nw-laba');
      if (labaEl) {
        labaEl.textContent = (labaRugi.laba >= 0 ? '+' : '-') + _rp(labaRugi.laba);
        labaEl.style.color = labaRugi.laba >= 0 ? 'var(--ok,#4caf50)' : 'var(--danger,#e05252)';
      }

      ['nw-escrow-badge','nw-wallet-badge'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = isLive ? 'LIVE' : 'offline';
        el.className   = 'nw-shopee-badge ' + (isLive ? 'live' : 'offline');
      });

      if (badge) {
        badge.textContent = isLive ? '● LIVE' : '○ Shopee Offline';
        badge.className   = 'nw-badge ' + (isLive ? 'nw-badge-live' : 'nw-badge-offline');
      }

      const jam = new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
      _set('nw-update-time', 'Update ' + jam + ' WIB · auto-refresh 15 mnt');

      if (totalAset === 0 && totalHutang === 0 && shopeeCache === null) {
        _log('WARNING: semua 0 — kemungkinan timeout total');
        if (badge) { badge.textContent = '⚠ Timeout'; badge.className = 'nw-badge nw-badge-offline'; }
        _set('nw-update-time', 'Jaringan lambat · tap refresh');
      }

    } catch(e) {
      _log('ERROR _calculate: ' + e.message);
      if (badge) { badge.textContent = '⚠ Error'; badge.className = 'nw-badge nw-badge-offline'; }
      _set('nw-update-time', 'Tap refresh untuk coba lagi');
    } finally {
      if (icon) icon.classList.remove('nw-refresh-spin');
      _nwRunning = false;
      _log('_calculate DONE');
    }
  }

  function _startPolling() {
    if (_nwTimer) clearInterval(_nwTimer);
    _nwTimer = setInterval(_calculate, NW_POLL_MS);
  }

  function _attachWakeListeners() {
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        _log('visibilitychange → visible, restart');
        _startPolling();
        _calculate();
      }
    });
    window.addEventListener('pageshow', function(e) {
      if (e.persisted) {
        _log('pageshow persisted (bfcache)');
        _startPolling();
        _calculate();
      }
    });
  }

  window.nwRefresh = function() { _log('manual refresh'); _calculate(); };
  window.nwUpdate  = function() { _calculate(); };

  function _init() {
    _injectStyles();
    _attachWakeListeners();
    _log('init — dbGet ready: ' + (typeof dbGet === 'function'));
    _log('APP_BUILD: ' + (window.APP_BUILD || '?'));
    _log('UA: ' + navigator.userAgent.slice(0,60));
    _waitForDbGet(function() {
      _log('dbGet READY, mulai hitung');
      _calculate();
      _startPolling();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();
