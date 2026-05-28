// ─── NETWORTH.JS — Net Worth Real-Time ───────────────────────
// Kalkulasi: Kas (COA) + Nilai Stok + Escrow Shopee + Wallet Shopee - Hutang
// Polling Shopee data setiap 15 menit dari shopee_finance_cache
// Fallback graceful bila Shopee belum connect

(function () {

  const NW_POLL_MS = 15 * 60 * 1000; // 15 menit
  let _nwTimer     = null;
  let _nwRendered  = false;

  // ─── INJECT WIDGET HTML ke atas dash-metrics ──────────────────
  function _injectWidget() {
    const anchor = document.getElementById('dash-alerts-wrap');
    if (!anchor || document.getElementById('nw-widget')) return;

    const el = document.createElement('div');
    el.id = 'nw-widget';
    el.innerHTML = `
      <div class="nw-card" id="nw-card">
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
            <span class="nw-row-label"><i class="ti ti-building-bank"></i> Kas &amp; Bank</span>
            <span class="nw-row-val nw-pos" id="nw-kas">—</span>
          </div>
          <div class="nw-row">
            <span class="nw-row-label"><i class="ti ti-box"></i> Nilai Stok</span>
            <span class="nw-row-val nw-pos" id="nw-stok">—</span>
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
          <div class="nw-divider"></div>
          <div class="nw-row">
            <span class="nw-row-label"><i class="ti ti-minus"></i> Hutang</span>
            <span class="nw-row-val nw-neg" id="nw-hutang">—</span>
          </div>
        </div>
      </div>
    `;

    // Inject sebelum dash-metrics
    const metrics = document.getElementById('dash-metrics');
    if (metrics) {
      anchor.parentNode.insertBefore(el, metrics);
    } else {
      anchor.after(el);
    }

    _injectStyles();
    _nwRendered = true;
  }

  // ─── STYLES ───────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('nw-styles')) return;
    const s = document.createElement('style');
    s.id = 'nw-styles';
    s.textContent = `
      #nw-widget {
        margin: 0 0 16px 0;
      }
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
        background: linear-gradient(90deg, var(--accent, #7c6af7), var(--ok, #4caf50));
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
      .nw-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .nw-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 20px;
        letter-spacing: 0.04em;
      }
      .nw-badge-live    { background: rgba(76,175,80,0.15); color: var(--ok, #4caf50); }
      .nw-badge-loading { background: rgba(255,193,7,0.15);  color: #f0b429; }
      .nw-badge-offline { background: rgba(224,82,82,0.15);  color: var(--danger, #e05252); }
      .nw-refresh-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--ink3, #888);
        padding: 4px;
        border-radius: 6px;
        line-height: 1;
        transition: color .2s, background .2s;
      }
      .nw-refresh-btn:hover { color: var(--ink, #eee); background: rgba(255,255,255,0.06); }
      .nw-refresh-spin { animation: nw-spin 1s linear infinite; }
      @keyframes nw-spin { to { transform: rotate(360deg); } }

      .nw-total-wrap {
        margin-bottom: 12px;
      }
      .nw-total {
        font-size: clamp(22px, 4vw, 32px);
        font-weight: 700;
        color: var(--ink, #eee);
        letter-spacing: -0.01em;
        line-height: 1.1;
      }
      .nw-update-time {
        font-size: 11px;
        color: var(--ink3, #888);
        margin-top: 3px;
      }

      .nw-breakdown {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 24px;
      }
      @media (max-width: 600px) {
        .nw-breakdown { grid-template-columns: 1fr; }
      }
      .nw-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        font-size: 12px;
      }
      .nw-row-label {
        color: var(--ink3, #888);
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .nw-row-val {
        font-weight: 600;
        font-size: 12px;
        font-variant-numeric: tabular-nums;
      }
      .nw-pos { color: var(--ok, #4caf50); }
      .nw-neg { color: var(--danger, #e05252); }
      .nw-divider {
        grid-column: 1 / -1;
        border-top: 1px solid var(--border, rgba(255,255,255,0.08));
        margin: 4px 0;
      }
      .nw-shopee-badge {
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 10px;
        font-weight: 600;
      }
      .nw-shopee-badge.live    { background: rgba(76,175,80,0.15); color: var(--ok,#4caf50); }
      .nw-shopee-badge.offline { background: rgba(255,193,7,0.12);  color: #f0b429; }
    `;
    document.head.appendChild(s);
  }

  // ─── FORMAT RUPIAH ────────────────────────────────────────────
  function _rp(val) {
    if (typeof _fmtRp === 'function') return _fmtRp(Math.abs(val));
    return 'Rp' + Math.round(Math.abs(val)).toLocaleString('id-ID');
  }

  // ─── HITUNG KAS dari jurnal (reuse logika dashboard) ──────────
  function _getKas() {
    try {
      if (!window._dashKasAkunMap || !window._dashJurnalAllData) return 0;
      return (window._dashJurnalAllData || []).reduce((s, r) => {
        const n  = Number(r.nominal || r.debit || 0);
        const aD = window._dashKasAkunMap[r.akun_debit_id];
        const aK = window._dashKasAkunMap[r.akun_kredit_id];
        const isKasDebit  = aD && aD.kelompok === 'aset' && (aD.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK';
        const isKasKredit = aK && aK.kelompok === 'aset' && (aK.sub_kelompok || '').trim().toUpperCase() === 'KAS & BANK';
        if (isKasDebit)  return s + n;
        if (isKasKredit) return s - n;
        return s;
      }, 0);
    } catch(e) { return 0; }
  }

  // ─── HITUNG NILAI STOK ────────────────────────────────────────
  function _getNilaiStok() {
    try {
      // _dashStokData adalah let global di dashboard.js (bukan window.*)
      const data = (typeof _dashStokData !== 'undefined' ? _dashStokData : null)
                || window._dashStokData;
      if (!data || !data.length) return 0;
      return data.reduce((s, r) => s + (r.nilai_stok || 0), 0);
    } catch(e) { return 0; }
  }

  // ─── HITUNG HUTANG dari jurnal COA kewajiban ──────────────────
  function _getHutang() {
    try {
      if (!window._dashKasAkunMap || !window._dashJurnalAllData) return 0;
      return (window._dashJurnalAllData || []).reduce((s, r) => {
        const n  = Number(r.nominal || r.debit || 0);
        const aD = window._dashKasAkunMap[r.akun_debit_id];
        const aK = window._dashKasAkunMap[r.akun_kredit_id];
        const isHutangDebit  = aD && aD.kelompok === 'kewajiban';
        const isHutangKredit = aK && aK.kelompok === 'kewajiban';
        // Kewajiban: kredit = tambah hutang, debit = bayar hutang
        if (isHutangKredit) return s + n;
        if (isHutangDebit)  return s - n;
        return s;
      }, 0);
    } catch(e) { return 0; }
  }

  // ─── AMBIL DATA SHOPEE dari cache Supabase ────────────────────
  async function _fetchShopeeCache() {
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/shopee_finance_cache?select=*&order=fetched_at.desc&limit=1',
        { headers: _headers() }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data && data.length > 0 ? data[0] : null;
    } catch(e) {
      return null;
    }
  }

  // ─── UPDATE WIDGET ────────────────────────────────────────────
  function _updateEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  async function _calculate() {
    const icon = document.getElementById('nw-refresh-icon');
    if (icon) icon.classList.add('nw-refresh-spin');

    const kas       = _getKas();
    const nilaiStok = _getNilaiStok();
    const hutang    = _getHutang();

    // Ambil data Shopee dari cache
    const shopeeCache = await _fetchShopeeCache();
    const escrow  = shopeeCache ? Number(shopeeCache.escrow_transit  || 0) : 0;
    const wallet  = shopeeCache ? Number(shopeeCache.wallet_balance  || 0) : 0;
    const isLive  = shopeeCache !== null;

    const netWorth = kas + nilaiStok + escrow + wallet - hutang;

    // Update total
    _updateEl('nw-total', (netWorth >= 0 ? '' : '-') + _rp(netWorth));
    const totalEl = document.getElementById('nw-total');
    if (totalEl) totalEl.style.color = netWorth >= 0 ? 'var(--ok, #4caf50)' : 'var(--danger, #e05252)';

    // Update breakdown
    _updateEl('nw-kas',    '+' + _rp(kas));
    _updateEl('nw-stok',   '+' + _rp(nilaiStok));
    _updateEl('nw-escrow', '+' + _rp(escrow));
    _updateEl('nw-wallet', '+' + _rp(wallet));
    _updateEl('nw-hutang', hutang > 0 ? '-' + _rp(hutang) : _rp(0));

    // Badge Shopee status
    const escrowBadge = document.getElementById('nw-escrow-badge');
    const walletBadge = document.getElementById('nw-wallet-badge');
    if (escrowBadge) {
      escrowBadge.textContent = isLive ? 'LIVE' : 'offline';
      escrowBadge.className   = 'nw-shopee-badge ' + (isLive ? 'live' : 'offline');
    }
    if (walletBadge) {
      walletBadge.textContent = isLive ? 'LIVE' : 'offline';
      walletBadge.className   = 'nw-shopee-badge ' + (isLive ? 'live' : 'offline');
    }

    // Status badge
    const badge = document.getElementById('nw-status-badge');
    if (badge) {
      if (isLive) {
        badge.textContent  = '● LIVE';
        badge.className    = 'nw-badge nw-badge-live';
      } else {
        badge.textContent  = '○ Shopee Offline';
        badge.className    = 'nw-badge nw-badge-offline';
      }
    }

    // Waktu update
    const now = new Date();
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    _updateEl('nw-update-time', 'Update ' + jam + ' WIB · auto-refresh 15 mnt');

    if (icon) icon.classList.remove('nw-refresh-spin');
  }

  // ─── POLLING ──────────────────────────────────────────────────
  function _startPolling() {
    _calculate();
    if (_nwTimer) clearInterval(_nwTimer);
    _nwTimer = setInterval(_calculate, NW_POLL_MS);
  }

  // ─── PUBLIC: refresh manual ───────────────────────────────────
  window.nwRefresh = function () {
    _calculate();
  };

  // ─── PUBLIC: dipanggil dashboard setelah data loaded ─────────
  window.nwUpdate = function () {
    if (!_nwRendered) _injectWidget();
    _calculate();
  };

  // ─── INIT ─────────────────────────────────────────────────────
  // Inject widget segera saat script dimuat
  // Kalkulasi dimulai setelah DOM siap
  function _init() {
    _injectWidget();
    _startPolling();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    // Delay sedikit agar dashboard.js selesai render HTML-nya dulu
    setTimeout(_init, 500);
  }

})();
