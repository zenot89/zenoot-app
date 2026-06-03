// ─── SHOPEE-SYNC.JS v5 ────────────────────────────────────────
// CHANGELOG v5 (fix dari v4):
//   1. get_order_list: loop 2x window 15 hari (Shopee max 15 hari per request)
//      v4 kirim 30 hari sekaligus → Shopee error → 400 Bad Request
//   2. _getOrderDetailBatch: fallback omset untuk order non-COMPLETED
//   3. Action 'get_order_detail' sekarang ada di Edge Function (index.ts v2)
// ─────────────────────────────────────────────────────────────

const SHOPEE_EDGE = SUPABASE_URL + '/functions/v1/shopee-proxy';

// ─── TOKEN ───────────────────────────────────────────────────
async function _getValidToken() {
  try {
    const tokens = await dbGet('shopee_tokens', '&order=updated_at.desc&limit=1');
    if (!tokens || !tokens.length || !tokens[0].access_token) return null;
    const tok = tokens[0];
    if ((tok.expire_at || 0) < Math.floor(Date.now() / 1000)) return null;
    return tok;
  } catch(e) { return null; }
}

let _shopeeChannelId = null;
async function _getShopeeChannelId() {
  if (_shopeeChannelId) return _shopeeChannelId;
  try {
    const ch = await dbGet('channels', '&kategori=eq.toko_utama&limit=1');
    _shopeeChannelId = (ch && ch.length) ? ch[0].id : null;
  } catch(e) { _shopeeChannelId = null; }
  return _shopeeChannelId;
}

// ─── GET ORDER LIST — max 15 hari per window, loop 2x = 30 hari ──
// FIX v5: Shopee hard limit 15 hari per request. Kirim 30 hari dulu
//         → error 400. Sekarang loop 2x window.
async function _fetchOrdersByStatus(tok, status) {
  const now = Math.floor(Date.now() / 1000);
  const windows = [
    { from: now - 86400 * 15, to: now },              // 0–15 hari lalu
    { from: now - 86400 * 30, to: now - 86400 * 15 }, // 15–30 hari lalu
  ];
  let results = [];
  for (const w of windows) {
    try {
      const res = await fetch(SHOPEE_EDGE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
        body:    JSON.stringify({
          action:       'get_order_list',
          shop_id:      tok.shop_id,
          access_token: tok.access_token,
          time_from:    w.from,
          time_to:      w.to,
          order_status: status,
        })
      });
      const data = await res.json();
      if (data.error) {
        console.warn('[shopee-sync] get_order_list error status=' + status + ':', data.error);
        continue;
      }
      const list = data.order_list || data.response?.order_list || [];
      results = results.concat(list.map(o => ({ ...o, order_status: status })));
    } catch(e) {
      console.warn('[shopee-sync] get_order_list skip status=' + status + ':', e.message);
    }
  }
  return results;
}

// ─── GET ORDER DETAIL BATCH (fallback omset) ──────────────────
async function _getOrderDetailBatch(tok, orderSnList) {
  if (!orderSnList || !orderSnList.length) return {};
  try {
    const res = await fetch(SHOPEE_EDGE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
      body:    JSON.stringify({
        action:                   'get_order_detail',
        shop_id:                  tok.shop_id,
        access_token:             tok.access_token,
        order_sn_list:            orderSnList.slice(0, 50).join(','),
        response_optional_fields: 'buyer_total_amount',
      })
    });
    const data = await res.json();
    if (data.error) {
      console.warn('[shopee-sync] get_order_detail error:', data.error);
      return {};
    }
    const list = data.order_list || data.response?.order_list || [];
    const map = {};
    list.forEach(o => { map[o.order_sn] = o; });
    return map;
  } catch(e) {
    console.warn('[shopee-sync] _getOrderDetailBatch error:', e.message);
    return {};
  }
}

// ─── PARSE ESCROW DETAIL ──────────────────────────────────────
function _parseOrderIncome(det) {
  const inc = det.order_income || det;
  return {
    omset:       parseFloat(inc.buyer_total_amount    || det.buyer_total_amount    || 0),
    escrow:      parseFloat(inc.escrow_amount         || det.escrow_amount         || 0),
    b_komisi:    parseFloat(inc.commission_fee        || det.commission_fee        || 0),
    b_admin:     parseFloat(inc.service_fee           || det.service_fee           || 0),
    b_layanan:   parseFloat(inc.transaction_fee       || det.transaction_fee       || 0),
    b_proses:    parseFloat(inc.order_processing_fee  || det.order_processing_fee  || 0),
    b_kampanye:  parseFloat(inc.campaign_fee          || det.campaign_fee          || 0),
  };
}

// ─── SYNC FINANCE (Escrow transit + Wallet) → shopee_finance_cache ──
async function syncShopeeFinance(tok) {
  if (!tok) { tok = await _getValidToken(); if (!tok) return null; }
  try {
    const res = await fetch(SHOPEE_EDGE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
      body:    JSON.stringify({
        action:       'get_finance_info',
        shop_id:      tok.shop_id,
        access_token: tok.access_token,
      })
    });
    const data = await res.json();
    if (data.error) { console.warn('[shopee-sync] get_finance_info error:', data.error); return null; }

    const escrow_transit = parseFloat(data.escrow_transit || 0);
    const wallet_balance = parseFloat(data.wallet_balance || 0);

    const payload = {
      shop_id: tok.shop_id, escrow_transit, wallet_balance,
      fetched_at: new Date().toISOString(), raw_response: JSON.stringify(data),
    };

    let existing = [];
    try { existing = await dbGet('shopee_finance_cache', '&shop_id=eq.' + tok.shop_id + '&limit=1'); } catch(e) {}

    if (existing && existing.length) {
      await fetch(SUPABASE_URL + '/rest/v1/shopee_finance_cache?shop_id=eq.' + tok.shop_id, {
        method: 'PATCH', headers: { ..._headers(), 'Prefer': 'return=minimal' },
        body: JSON.stringify(payload),
      });
    } else {
      await dbInsert('shopee_finance_cache', payload);
    }

    console.log('[shopee-sync] Finance synced — escrow:', escrow_transit, 'wallet:', wallet_balance);
    if (typeof nwRefresh === 'function') nwRefresh();
    return { escrow_transit, wallet_balance };
  } catch(e) {
    console.warn('[shopee-sync] syncShopeeFinance error:', e.message);
    return null;
  }
}

// ─── SYNC ACTIVE ORDER ESCROW ─────────────────────────────────
async function syncActiveOrderEscrow(tok) {
  if (!tok) { tok = await _getValidToken(); if (!tok) return 0; }

  const activeStatuses = ['READY_TO_SHIP', 'SHIPPED', 'TO_CONFIRM_RECEIVE'];
  let allOrders = [];
  for (const status of activeStatuses) {
    const batch = await _fetchOrdersByStatus(tok, status);
    allOrders = allOrders.concat(batch);
  }
  if (!allOrders.length) return 0;

  // Batch fetch order detail untuk fallback omset
  const allSns = allOrders.map(o => o.order_sn);
  const orderDetailMap = await _getOrderDetailBatch(tok, allSns);

  let updated = 0;
  for (const order of allOrders) {
    const sn = order.order_sn;
    try {
      const detRes = await fetch(SHOPEE_EDGE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
        body:    JSON.stringify({
          action:       'get_escrow_detail',
          shop_id:      tok.shop_id,
          access_token: tok.access_token,
          order_sn:     sn,
        })
      });
      const det = await detRes.json();
      const f   = _parseOrderIncome(det);
      const fallbackOmset = parseFloat(orderDetailMap[sn]?.buyer_total_amount || 0);
      const omset = f.omset > 0 ? f.omset : fallbackOmset;
      if (omset <= 0) continue;

      await fetch(
        SUPABASE_URL + '/rest/v1/jurnal_penjualan?no_order=eq.' + encodeURIComponent(sn),
        {
          method: 'PATCH',
          headers: { ..._headers(), 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            total: omset, omset, escrow: f.escrow,
            biaya_komisi: f.b_komisi, biaya_admin: f.b_admin,
            biaya_layanan: f.b_layanan, biaya_proses: f.b_proses,
            biaya_kampanye: f.b_kampanye, order_status: order.order_status,
          }),
        }
      );
      updated++;
    } catch(e) {
      console.warn('[shopee-sync] syncActiveOrderEscrow skip order', sn, e.message);
    }
  }
  console.log('[shopee-sync] Active escrow updated:', updated, 'orders');
  return updated;
}

// ─── CORE SYNC ORDERS → jurnal_penjualan ─────────────────────
async function shopeeSyncOrders(tok) {
  if (!tok) {
    tok = await _getValidToken();
    if (!tok) { console.log('[shopee-sync] shopeeSyncOrders: tidak ada token valid'); return 0; }
  }

  const channelId = await _getShopeeChannelId();
  const statuses  = ['COMPLETED', 'READY_TO_SHIP', 'SHIPPED', 'TO_CONFIRM_RECEIVE'];
  let allOrders   = [];
  for (const status of statuses) {
    const batch = await _fetchOrdersByStatus(tok, status);
    allOrders = allOrders.concat(batch);
  }

  if (!allOrders.length) {
    console.log('[shopee-sync] Tidak ada order dari API.');
    return 0;
  }

  // Deduplicate order_sn dari API (bisa muncul di 2 window)
  const seen = new Set();
  allOrders = allOrders.filter(o => { if (seen.has(o.order_sn)) return false; seen.add(o.order_sn); return true; });

  // Cek yang sudah ada di DB
  let existingOrders = [];
  try { existingOrders = await dbGet('jurnal_penjualan', '&no_order=not.is.null&select=no_order'); } catch(e) {}
  const existSet = new Set((existingOrders || []).map(r => r.no_order));

  const newOrders = allOrders.filter(o => !existSet.has(o.order_sn));
  if (!newOrders.length) {
    console.log('[shopee-sync] Semua order sudah ada di DB (' + allOrders.length + ' total).');
    return 0;
  }

  // Batch fetch order detail untuk semua order baru (fallback omset)
  const newSns = newOrders.map(o => o.order_sn);
  const orderDetailMap = await _getOrderDetailBatch(tok, newSns);

  let inserted = 0;
  for (const order of newOrders) {
    const sn     = order.order_sn;
    const status = order.order_status;
    try {
      let f = { omset: 0, escrow: 0, b_komisi: 0, b_admin: 0, b_layanan: 0, b_proses: 0, b_kampanye: 0 };

      // COMPLETED: coba escrow detail (data keuangan lengkap)
      if (status === 'COMPLETED') {
        try {
          const detRes = await fetch(SHOPEE_EDGE, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
            body:    JSON.stringify({
              action:       'get_escrow_detail',
              shop_id:      tok.shop_id,
              access_token: tok.access_token,
              order_sn:     sn,
            })
          });
          const det    = await detRes.json();
          const parsed = _parseOrderIncome(det);
          if (parsed.omset > 0) f = parsed;
        } catch(e) { /* fallback di bawah */ }
      }

      // Fallback: pakai buyer_total_amount dari order_detail
      if (f.omset <= 0) {
        f.omset = parseFloat(orderDetailMap[sn]?.buyer_total_amount || 0);
      }

      if (f.omset <= 0) {
        console.warn('[shopee-sync] Skip order omset=0:', sn, status);
        continue;
      }

      const tanggal = new Date(order.create_time * 1000).toISOString().split('T')[0];
      const waktu   = new Date(order.create_time * 1000).toTimeString().slice(0, 5);

      await dbInsert('jurnal_penjualan', {
        tanggal, waktu, channel_id: channelId,
        no_order: sn,
        total:          f.omset,
        omset:          f.omset,
        escrow:         f.escrow,
        biaya_komisi:   f.b_komisi,
        biaya_admin:    f.b_admin,
        biaya_layanan:  f.b_layanan,
        biaya_proses:   f.b_proses,
        biaya_kampanye: f.b_kampanye,
        order_status:   status,
        created_at:     new Date().toISOString(),
      });
      inserted++;
    } catch(e) {
      console.warn('[shopee-sync] Skip order', sn, e.message);
    }
  }

  console.log('[shopee-sync] Selesai. ' + inserted + '/' + newOrders.length + ' order baru di-insert.');

  if (inserted > 0 && typeof loadJurnalPenjualan === 'function') {
    const page = document.querySelector('.page.active');
    if (page && page.id === 'page-jurnal-penjualan') loadJurnalPenjualan();
  }
  return inserted;
}

// ─── AUTO REFRESH TOKEN ────────────────────────────────────────
async function _autoRefreshTokenIfNeeded() {
  try {
    const tokens = await dbGet('shopee_tokens', '&order=updated_at.desc&limit=1');
    if (!tokens || !tokens.length || !tokens[0].access_token) return;
    const tok = tokens[0];
    const now = Math.floor(Date.now() / 1000);
    const sisaDetik = (tok.expire_at || 0) - now;
    if (sisaDetik > 3600) {
      console.log('[shopee-sync] Token masih OK, sisa', Math.round(sisaDetik/60), 'menit');
      return;
    }
    if (sisaDetik < -(86400 * 30)) {
      console.warn('[shopee-sync] Token terlalu lama expired, hubungkan ulang Shopee');
      return;
    }
    console.log('[shopee-sync] Token mau habis, auto-refresh...');
    const res = await fetch(SHOPEE_EDGE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
      body:    JSON.stringify({
        action: 'refresh_token', shop_id: tok.shop_id, refresh_token: tok.refresh_token,
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const now2     = Math.floor(Date.now() / 1000);
    const expireAt = data.expire_at || (now2 + (data.expire_in || 14400));
    await fetch(SUPABASE_URL + '/rest/v1/shopee_tokens?shop_id=eq.' + tok.shop_id, {
      method: 'PATCH',
      headers: { ..._headers(), 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token || tok.refresh_token,
        expire_at: expireAt, updated_at: new Date().toISOString(),
      }),
    });
    console.log('[shopee-sync] Token refresh OK! Expire:', new Date(expireAt * 1000).toLocaleString('id-ID'));
    const newTok = { ...tok, access_token: data.access_token, expire_at: expireAt };
    await syncShopeeFinance(newTok);
    await syncActiveOrderEscrow(newTok);
    await shopeeSyncOrders(newTok);
  } catch(e) {
    console.warn('[shopee-sync] Auto-refresh token gagal:', e.message);
  }
}

// ─── AUTO SYNC SAAT APP LOAD ──────────────────────────────────
(async function() {
  try {
    const tok = await _getValidToken();
    if (!tok) { console.log('[shopee-sync] Tidak ada token valid, skip auto-sync'); return; }
    console.log('[shopee-sync] Token OK, mulai sync saat load...');
    await syncShopeeFinance(tok);
    await shopeeSyncOrders(tok);
  } catch(e) {
    console.warn('[shopee-sync] Auto-sync on load skip:', e.message);
  }
})();

// ─── PERIODIC SYNC TIAP 30 MENIT ─────────────────────────────
setInterval(async function() {
  try {
    const tok = await _getValidToken();
    if (!tok) return;
    console.log('[shopee-sync] Periodic sync (30 menit)...');
    await syncShopeeFinance(tok);
    await syncActiveOrderEscrow(tok);
    await shopeeSyncOrders(tok);
  } catch(e) {
    console.warn('[shopee-sync] Periodic sync skip:', e.message);
  }
}, 30 * 60 * 1000);

setInterval(_autoRefreshTokenIfNeeded, 30 * 60 * 1000);
setTimeout(_autoRefreshTokenIfNeeded, 5000);
