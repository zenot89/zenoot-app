// ─── NETWORTH.JS — Net Worth Real-Time ───────────────────────
// Formula: Net Worth (dari keuangan.js) + Escrow Shopee + Wallet Shopee
// Net Worth base = (Aset jurnal + Nilai Stok) - Total Hutang
// Polling Shopee data setiap 15 menit dari shopee_finance_cache

(function () {

  const NW_POLL_MS = 15 * 60 * 1000; // 15 menit
  let _nwTimer     = null;
  let _nwRendered  = false;

  // ─── INJECT WIDGET HTML ───────────────────────────────────────
  function _injectWidget() {
    if (document.getElementById('nw-widget')) return;

    const el = document.createElement('div');
    el.id = 'nw-widget';
    el.innerHTML = `
      <div class="nw-card">
        <div class="nw-header">
          <div class="nw-title">
            <i class="ti ti-chart-pie"></i>
            NET WORTH AKTUAL
          </div>
          <div class="nw-actions">
            <span id="nw-status-badge" class="nw-badge nw-badge-loading">⏳ Memuat...</span>
            <button class="nw-refresh-btn" onclick="nwRefresh()" title="Refresh sekarang">
              <i class="ti ti-refresh" id="nw-refresh-icon"></i>
            </button>
          </div>
        </div>

        <div class="nw-total-wrap">
          <div class="nw-total" id="nw-total">Rp —</div>
          <div class="nw-update-time" id="nw-update-time">menghitung...</div>
        </div>

        <div class="nw-breakdown">
          <div class="nw-row">
            <span class="nw-row-label"><i class="ti ti-building-bank"></i> Total Aset</span>
            <span class="nw-row-val nw-pos" id="nw-aset">—</span>
          </div>
          <div class="nw-row">
            <span class="nw-row-label"><i class="ti ti-minus"></i> Total Hutang</span>
            <span class="nw-row-val nw-neg" id="nw-hutang">—</span>
          </div>
          <div class="nw-row">
            <span class="nw-row-label">
              <i class="ti ti-truck-delivery"></i> Escrow Shopee
              <span id="nw-escrow-badge" class="nw-shopee-badge"></span>
            </span>
            <span class="nw-row-val nw-pos" id="nw-escrow">—</span>
          </div>
          <div class="nw-row">
            <span class="nw-row-label">
              <i class="ti ti-wallet"></i> Wallet Shopee
              <span id="nw-wallet-badge" class="nw-shopee-badge"></span>
            </span>
            <span class="nw-row-val nw-pos" id="nw-wallet">—</span>
          </div>
        </div>
      </div>
    `;

    // Inject sebelum metric cards
    const metrics = document.getElementById('dash-metrics');
    const alerts  = document.getElementById('dash-alerts-wrap');
    const anchor  = metrics || alerts;
    if (!anchor) { document.body.prepend(el); return; }
    anchor.parentNode.insertBefore(el, anchor);

    _injectStyles();
    _nwRendered = true;
  }

  // ─── STYLES ───────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('nw-styles')) return;
    const s = document.createElement('style');
    s.id = 'nw-styles';
    s.textContent = `
      #nw-widget { margin: 0 0 16px 0; }
      .nw-card {
        background: var(--surface, #1e1e2e);
        border: 1px solid var(--border, rgba(255,255,255,0.08));
        border-radius: 12px;
        padding: 16px 20px;
        position: relative;
        overflow: hidden;
      }
      .nw-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--accent,#7c6af7), var(--ok,#4caf50));
        border-radius: 12px 12px 0 0;
      }
      .nw-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .nw-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: var(--ink3, #888);
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .nw-actions { display: flex; align-items: center; gap: 8px; }
      .nw-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 20px;
        letter-spacing: 0.04em;
      }
      .nw-badge-live    { background: rgba(76,175,80,0.15); color: var(--ok,#4caf50); }
      .nw-badge-loading { background: rgba(255,193,7,0.15);  color: #f0b429; }
      .nw-badge-offline { background: rgba(224,82,82,0.15);  color: var(--danger,#e05252); }
      .nw-refresh-btn {
        background: none; border: none; cursor: pointer;
        color: var(--ink3,#888); padding: 4px; border-radius: 6px;
        line-height: 1; transition: color .2s, background .2s;
      }
      .nw-refresh-btn:hover { color: var(--ink,#eee); background: rgba(255,255,255,0.06); }
      .nw-refresh-spin { animation: nw-spin 1s linear infinite; }
      @keyframes nw-spin { to { transform: rotate(360deg); } }
      .nw-total-wrap { margin-bottom: 12px; }
      .nw-total {
        font-size: clamp(22px, 4vw, 32px);
        font-weight: 700;
        color: var(--ink,#eee);
        letter-spacing: -0.01em;
        line-height: 1.1;
      }
      .nw-update-time { font-size: 11px; color: var(--ink3,#888); margin-top: 3px; }
      .nw-breakdown {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 24px;
      }
      @media (max-width: 600px) { .nw-breakdown { grid-template-columns: 1fr; } }
      .nw-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        font-size: 12px;
      }
      .nw-row-label {
        color: var(--ink3,#888);
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .nw-row-val { font-weight: 600; font-size: 12px; font-variant-numeric: tabular-nums; }
      .nw-pos { color: var(--ok,#4caf50); }
      .nw-neg { color: var(--danger,#e05252); }
      .nw-shopee-badge {
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 10px;
        font-weight: 600;
      }
      .nw-shopee-badge.live    { background: rgba(76,175,80,0.15);  color: var(--ok,#4caf50); }
      .nw-shopee-badge.offline { background: rgba(255,193,7,0.12);  color: #f0b429; }
    `;
    document.head.appendChild(s);
  }

  // ─── FORMAT RUPIAH (reuse dari app) ──────────────────────────
  function _rp(val) {
    if (typeof fmtRpFull === 'function') return fmtRpFull(Math.abs(val));
    if (typeof _fmtRp   === 'function') return _fmtRp(Math.abs(val));
    return 'Rp' + Math.round(Math.abs(val)).toLocaleString('id-ID');
  }

  // ─── HITUNG TOTAL ASET dari jurnal (sama persis dengan keuangan.js) ──
  async function _getTotalAset() {
    try {
      const [kasAkun, jurnal, produk, stok, jual] = await Promise.all([
        dbGet('kas_akun', '').catch(() => []),
        dbGet('jurnal',   '').catch(() => []),
        dbGet('produk',   '').catch(() => []),
        dbGet('stok',     '').catch(() => []),
        dbGet('jurnal_penjualan', '&select=sku,qty').catch(() => [])
      ]);

      // Build akunMap dengan saldo debit/kredit
      const akunMap = {};
      (kasAkun || []).forEach(a => { akunMap[a.id] = {...a, saldoDebit: 0, saldoKredit: 0}; });
      (jurnal  || []).forEach(r => {
        const n = Number(r.nominal || r.debit || 0);
        if (akunMap[r.akun_debit_id])  akunMap[r.akun_debit_id].saldoDebit   += n;
        if (akunMap[r.akun_kredit_id]) akunMap[r.akun_kredit_id].saldoKredit += n;
      });

      // Total aset dari jurnal
      const totalAsetJurnal = Object.values(akunMap)
        .filter(a => a.kelompok === 'aset')
        .reduce((s, a) => s + Math.max(0, a.saldoDebit - a.saldoKredit), 0);

      // Nilai persediaan/stok
      const stokMap = {};
      (stok || []).forEach(s => { stokMap[(s.sku_variasi || '').toUpperCase()] = s.stok_masuk || 0; });
      const keluarMap = {};
      (jual || []).forEach(j => { const k = (j.sku || '').toUpperCase(); keluarMap[k] = (keluarMap[k] || 0) + (j.qty || 0); });
      const nilaiPersediaan = (produk || []).reduce((s, p) => {
        const key  = (p.sku_variasi || '').toUpperCase();
        const sisa = (stokMap[key] || 0) - (keluarMap[key] || 0);
        return s + (sisa > 0 ? sisa * (p.hpp || 0) : 0);
      }, 0);

      return totalAsetJurnal + nilaiPersediaan;
    } catch(e) { return 0; }
  }

  // ─── HITUNG TOTAL HUTANG (sama persis dengan keuangan.js) ────
  async function _getTotalHutang() {
    try {
      const [hutangList, bayarList] = await Promise.all([
        dbGet('hutang',      '').catch(() => []),
        dbGet('hutang_bayar','').catch(() => [])
      ]);
      const bayarMap = {};
      (bayarList || []).forEach(b => {
        bayarMap[b.hutang_id] = (bayarMap[b.hutang_id] || 0) + Number(b.nominal || 0);
      });
      return (hutangList || []).reduce((s, h) => {
        const sisa = (h.pokok || 0) - (bayarMap[h.id] || 0);
        return s + (sisa > 0 ? sisa : 0);
      }, 0);
    } catch(e) { return 0; }
  }

  // ─── AMBIL DATA SHOPEE dari cache Supabase ───────────────────
  async function _fetchShopeeCache() {
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/shopee_finance_cache?select=*&order=fetched_at.desc&limit=1',
        { headers: _headers() }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.length > 0 ? data[0] : null;
    } catch(e) { return null; }
  }

  // ─── UPDATE ELEMENT ──────────────────────────────────────────
  function _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ─── KALKULASI & RENDER ──────────────────────────────────────
  async function _calculate() {
    const icon = document.getElementById('nw-refresh-icon');
    if (icon) icon.classList.add('nw-refresh-spin');

    const [totalAset, totalHutang, shopeeCache] = await Promise.all([
      _getTotalAset(),
      _getTotalHutang(),
      _fetchShopeeCache()
    ]);

    const escrow  = shopeeCache ? Number(shopeeCache.escrow_transit  || 0) : 0;
    const wallet  = shopeeCache ? Number(shopeeCache.wallet_balance  || 0) : 0;
    const isLive  = shopeeCache !== null;

    const netWorth = totalAset - totalHutang + escrow + wallet;

    // Total
    _set('nw-total', (netWorth < 0 ? '-' : '') + _rp(netWorth));
    const totalEl = document.getElementById('nw-total');
    if (totalEl) totalEl.style.color = netWorth >= 0 ? 'var(--ok,#4caf50)' : 'var(--danger,#e05252)';

    // Breakdown
    _set('nw-aset',   '+' + _rp(totalAset));
    _set('nw-hutang', totalHutang > 0 ? '-' + _rp(totalHutang) : _rp(0));
    _set('nw-escrow', '+' + _rp(escrow));
    _set('nw-wallet', '+' + _rp(wallet));

    // Badge Shopee
    ['nw-escrow-badge', 'nw-wallet-badge'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = isLive ? 'LIVE' : 'offline';
      el.className   = 'nw-shopee-badge ' + (isLive ? 'live' : 'offline');
    });

    // Status badge
    const badge = document.getElementById('nw-status-badge');
    if (badge) {
      badge.textContent = isLive ? '● LIVE' : '○ Shopee Offline';
      badge.className   = 'nw-badge ' + (isLive ? 'nw-badge-live' : 'nw-badge-offline');
    }

    // Waktu update
    const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    _set('nw-update-time', 'Update ' + jam + ' WIB · auto-refresh 15 mnt');

    if (icon) icon.classList.remove('nw-refresh-spin');
  }

  // ─── POLLING ─────────────────────────────────────────────────
  function _startPolling() {
    _calculate();
    if (_nwTimer) clearInterval(_nwTimer);
    _nwTimer = setInterval(_calculate, NW_POLL_MS);
  }

  // ─── PUBLIC API ──────────────────────────────────────────────
  window.nwRefresh = function () { _calculate(); };
  window.nwUpdate  = function () {
    if (!_nwRendered) _injectWidget();
    _calculate();
  };

  // ─── INIT ────────────────────────────────────────────────────
  function _init() {
    _injectWidget();
    _startPolling();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    setTimeout(_init, 500);
  }

})();
