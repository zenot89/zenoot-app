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
        response_optional_fields: 'total_amount,create_time,item_list',
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

  const activeStatuses = ['READY_TO_SHIP', 'PROCESSED', 'SHIPPED'];
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
  for (var ai = 0; ai < allOrders.length; ai++) {
    const order = allOrders[ai];
    const sn    = order.order_sn;
    const det   = orderDetailMap[sn] || {};
    try {
      const f             = _parseOrderIncome(det);
      const fallbackOmset = parseFloat(det.total_amount || 0);
      const omset         = f.omset > 0 ? f.omset : fallbackOmset;
      if (omset <= 0) continue;

      // Update semua baris dengan no_order = sn (bisa >1 baris kalau multi-item)
      // Hanya update status + escrow/biaya — jangan overwrite total per-item
      await fetch(
        SUPABASE_URL + '/rest/v1/jurnal_penjualan?no_order=eq.' + encodeURIComponent(sn),
        {
          method: 'PATCH',
          headers: { ..._headers(), 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            order_status:   order.order_status,
            escrow:         f.escrow,
            biaya_komisi:   f.b_komisi,
            biaya_admin:    f.b_admin,
            biaya_layanan:  f.b_layanan,
            biaya_proses:   f.b_proses,
            biaya_kampanye: f.b_kampanye,
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
var _shopeeSyncOrdersRunning = false; // cegah 2 trigger (on-load, interval 30menit, refresh token, connect baru) jalan bersamaan → duplikat insert
async function shopeeSyncOrders(tok) {
  if (_shopeeSyncOrdersRunning) {
    console.log('[shopee-sync] shopeeSyncOrders sudah berjalan di proses lain, skip — cegah duplikat.');
    return 0;
  }
  _shopeeSyncOrdersRunning = true;
  try {
    return await _shopeeSyncOrdersImpl(tok);
  } finally {
    _shopeeSyncOrdersRunning = false;
  }
}
// ─── HELPER: Ekstrak item_list dari order_detail response ─────
// Shopee order_detail mengembalikan item_list di dalam order object.
// Setiap item memiliki: item_sku, variation_sku, model_quantity_purchased,
// model_original_price, model_discounted_price, item_name, variation_name.
// Prioritas SKU:
//   1. variation_sku (sudah lengkap, contoh: Turtleneck_HITAM-M)
//   2. Mapping dari item_sku + variation_name (contoh: "Hitam,M" → TURTLENECK_HITAM-M)
//      Berlaku untuk produk yang variation_sku-nya kosong di Shopee.
//      Size S/M → suffix -M, size L/XL → suffix -XL
//   3. item_sku saja (fallback terakhir)
function _parseItemList(orderDetail) {
  const items = orderDetail.item_list || [];
  return items.map(function(item) {
    // Priority: variation_sku → model_sku → item_sku+variation_name → item_sku
    let sku = (item.variation_sku || '').trim();

    if (!sku) sku = (item.model_sku || '').trim();

    // Kalau masih kosong, coba bangun dari item_sku + variation_name
    if (!sku) {
      const itemSku  = (item.item_sku || '').trim();
      const varNamaRaw = (item.variation_name || '').trim();
      if (itemSku && varNamaRaw) {
        // variation_name format: "Warna,Ukuran" — contoh: "Hitam,M" / "Abu muda,XL"
        const parts  = varNamaRaw.split(',');
        const warna  = (parts[0] || '').trim();
        const size   = (parts[parts.length - 1] || '').trim().toUpperCase();
        // Mapping ukuran: S atau M → -M, L atau XL → -XL
        const sizeKey = (size === 'S' || size === 'M') ? 'M' : 'XL';
        sku = itemSku + '_' + warna + '-' + sizeKey;
      } else {
        sku = itemSku;
      }
    }

    sku = sku.toUpperCase();
    const qty     = parseInt(item.model_quantity_purchased || item.quantity_purchased || 0);
    // Harga per satuan: pakai discounted_price (harga bayar buyer), fallback original_price
    const harga   = parseFloat(item.model_discounted_price || item.model_original_price || 0);
    const nama    = item.item_name || '';
    const varNama = item.variation_name || '';
    return { sku, qty, harga, nama, varNama };
  }).filter(function(item) { return item.qty > 0; }); // hanya item dengan qty valid
}

async function _shopeeSyncOrdersImpl(tok) {
  if (!tok) {
    tok = await _getValidToken();
    if (!tok) { console.log('[shopee-sync] shopeeSyncOrders: tidak ada token valid'); return 0; }
  }

  const channelId = await _getShopeeChannelId();
  const statuses  = ['COMPLETED', 'READY_TO_SHIP', 'PROCESSED', 'SHIPPED'];
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
  allOrders = allOrders.filter(function(o) {
    if (seen.has(o.order_sn)) return false;
    seen.add(o.order_sn);
    return true;
  });

  // Ambil semua baris Shopee yang sudah ada di DB (no_order tidak null)
  let existingRows = [];
  try {
    existingRows = await dbGet('jurnal_penjualan', '&no_order=not.is.null&select=id,no_order,sku');
  } catch(e) {}

  // Pisahkan: baris lama tanpa SKU (stale) vs baris yang sudah lengkap
  // Stale = no_order ada tapi sku kosong/null → hasil insert lama yang tidak punya item detail
  const staleIds   = [];  // id baris lama yang akan di-delete dan di-replace
  const staleSnSet = new Set(); // no_order dari baris stale
  const doneSnSet  = new Set(); // no_order yang sudah lengkap (ada sku), tidak perlu re-insert

  (existingRows || []).forEach(function(r) {
    if (!r.sku || r.sku === '') {
      staleIds.push(r.id);
      staleSnSet.add(r.no_order);
    } else {
      doneSnSet.add(r.no_order);
    }
  });

  // Hapus baris stale (tanpa SKU) dari DB
  if (staleIds.length > 0) {
    console.log('[shopee-sync] Hapus ' + staleIds.length + ' baris lama tanpa SKU...');
    for (var di = 0; di < staleIds.length; di++) {
      try {
        await fetch(SUPABASE_URL + '/rest/v1/jurnal_penjualan?id=eq.' + staleIds[di], {
          method: 'DELETE', headers: _headers(),
        });
      } catch(e) { console.warn('[shopee-sync] Gagal hapus baris stale id=' + staleIds[di]); }
    }
  }

  // Order yang perlu di-sync: stale (sudah delete, perlu insert ulang) + benar-benar baru
  const ordersToSync = allOrders.filter(function(o) {
    return staleSnSet.has(o.order_sn) || !doneSnSet.has(o.order_sn);
  });

  if (!ordersToSync.length) {
    console.log('[shopee-sync] Semua order sudah lengkap di DB (' + allOrders.length + ' total).');
    return 0;
  }

  // Batch fetch order detail untuk order yang perlu di-sync
  const syncSns     = ordersToSync.map(function(o) { return o.order_sn; });
  const orderDetailMap = await _getOrderDetailBatch(tok, syncSns);

  let inserted = 0;
  for (var oi = 0; oi < ordersToSync.length; oi++) {
    const order  = ordersToSync[oi];
    const sn     = order.order_sn;
    const status = order.order_status;
    const det    = orderDetailMap[sn] || {};

    try {
      // ─── 1. Data finansial order ──────────────────────────
      let f = { omset: 0, escrow: 0, b_komisi: 0, b_admin: 0, b_layanan: 0, b_proses: 0, b_kampanye: 0 };

      if (status === 'COMPLETED') {
        try {
          const detRes = await fetch(SHOPEE_EDGE, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
            body:    JSON.stringify({
              action: 'get_escrow_detail', shop_id: tok.shop_id,
              access_token: tok.access_token, order_sn: sn,
            })
          });
          const escDet = await detRes.json();
          const parsed = _parseOrderIncome(escDet);
          if (parsed.omset > 0) f = parsed;
        } catch(e) { /* fallback di bawah */ }
      }

      // Fallback omset dari total_amount
      if (f.omset <= 0) f.omset = parseFloat(det.total_amount || 0);
      if (f.omset <= 0) {
        console.warn('[shopee-sync] Skip order omset=0:', sn, status);
        continue;
      }

      // ─── 2. Tanggal & waktu order ─────────────────────────
      const rawCt    = order.create_time || det.create_time || 0;
      const createMs = rawCt > 0 ? rawCt * 1000 : Date.now();
      const tanggal  = new Date(createMs).toISOString().split('T')[0];
      const waktu    = new Date(createMs).toTimeString().slice(0, 5);

      // ─── 3. Parse item list (SKU per item) ────────────────
      const items = _parseItemList(det);

      if (items.length === 0) {
        // Tidak ada item_list dari API → insert 1 baris ringkasan tanpa SKU
        // (akan di-clean up lagi di sync berikutnya kalau API sudah tersedia)
        await dbInsert('jurnal_penjualan', {
          tanggal, waktu, channel_id: channelId, no_order: sn,
          sku: null, qty: 0, harga_satuan: 0,
          total: f.omset, omset: f.omset, escrow: f.escrow,
          biaya_komisi: f.b_komisi, biaya_admin: f.b_admin,
          biaya_layanan: f.b_layanan, biaya_proses: f.b_proses,
          biaya_kampanye: f.b_kampanye, order_status: status,
          created_at: new Date().toISOString(),
        });
        inserted++;
        continue;
      }

      // ─── 4. Insert 1 baris per item (pecah per SKU) ───────
      // Total order dibagi proporsional berdasarkan (harga × qty) per item
      const totalItemValue = items.reduce(function(s, it) { return s + (it.harga * it.qty); }, 0);

      for (var ii = 0; ii < items.length; ii++) {
        const item      = items[ii];
        const itemValue = item.harga * item.qty;
        // Total proporsional: kalau totalItemValue = 0, bagi rata
        const totalProporsional = totalItemValue > 0
          ? Math.round(f.omset * itemValue / totalItemValue)
          : Math.round(f.omset / items.length);

        // Biaya proporsional
        const rasio = totalItemValue > 0 ? itemValue / totalItemValue : 1 / items.length;

        await dbInsert('jurnal_penjualan', {
          tanggal, waktu, channel_id: channelId, no_order: sn,
          sku:          item.sku    || null,
          qty:          item.qty,
          harga_satuan: Math.round(item.harga),
          total:        totalProporsional,
          omset:        totalProporsional,
          escrow:       Math.round(f.escrow      * rasio),
          biaya_komisi: Math.round(f.b_komisi    * rasio),
          biaya_admin:  Math.round(f.b_admin     * rasio),
          biaya_layanan:Math.round(f.b_layanan   * rasio),
          biaya_proses: Math.round(f.b_proses    * rasio),
          biaya_kampanye: Math.round(f.b_kampanye * rasio),
          order_status: status,
          created_at:   new Date().toISOString(),
        });
        inserted++;
      }
    } catch(e) {
      console.warn('[shopee-sync] Skip order', sn, e.message);
    }
  }

  console.log('[shopee-sync] Selesai. ' + inserted + ' baris di-insert dari ' + ordersToSync.length + ' order.');

  if (inserted > 0 && typeof loadJurnalPenjualan === 'function') {
    const page = document.querySelector('.page.active');
    if (page && page.id === 'page-jurnal-penjualan') loadJurnalPenjualan();
  }
  return inserted;
}

// ─── AUTO REFRESH TOKEN ────────────────────────────────────────
// Return value: token baru kalau refresh sukses, null kalau tidak perlu/gagal.
// Caller pakai return value ini — tidak fetch ulang dari DB untuk hindari race condition.
async function _autoRefreshTokenIfNeeded() {
  try {
    const tokens = await dbGet('shopee_tokens', '&order=updated_at.desc&limit=1');
    if (!tokens || !tokens.length || !tokens[0].access_token) return null;
    const tok = tokens[0];
    const now = Math.floor(Date.now() / 1000);
    const sisaDetik = (tok.expire_at || 0) - now;
    if (sisaDetik > 3600) {
      console.log('[shopee-sync] Token masih OK, sisa', Math.round(sisaDetik/60), 'menit');
      return null; // tidak perlu refresh
    }
    if (sisaDetik < -(86400 * 30)) {
      console.warn('[shopee-sync] Token terlalu lama expired, hubungkan ulang Shopee');
      return null;
    }
    console.log('[shopee-sync] Token mau habis/expired, auto-refresh...');
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
        access_token:  data.access_token,
        refresh_token: data.refresh_token || tok.refresh_token,
        expire_at:     expireAt,
        updated_at:    new Date().toISOString(),
      }),
    });
    console.log('[shopee-sync] Token refresh OK! Expire:', new Date(expireAt * 1000).toLocaleString('id-ID'));
    // Return token baru langsung — jangan fetch ulang dari DB (race condition)
    return { ...tok, access_token: data.access_token, expire_at: expireAt };
  } catch(e) {
    console.warn('[shopee-sync] Auto-refresh token gagal:', e.message);
    return null;
  }
}

// ─── AUTO SYNC SAAT APP LOAD ──────────────────────────────────
// FIX v6: refresh token dulu, pakai return value langsung (no race condition).
// Sebelumnya: _autoRefreshTokenIfNeeded tidak return token baru → _getValidToken
// fetch ulang dari DB sebelum PATCH selesai → dapat token lama → return null → skip sync.
(async function() {
  try {
    // Step 1: refresh kalau perlu — dapat token baru kalau refresh, null kalau masih OK
    const refreshedTok = await _autoRefreshTokenIfNeeded();

    // Step 2: pakai token baru dari refresh, atau ambil dari DB kalau tidak perlu refresh
    const tok = refreshedTok || await _getValidToken();
    if (!tok) {
      console.log('[shopee-sync] Token tidak valid. Hubungkan ulang Shopee di Shopee Connect.');
      return;
    }

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

// Periodic token refresh tiap 30 menit
// setTimeout dihapus — sudah dihandle di auto-sync on load di atas
setInterval(_autoRefreshTokenIfNeeded, 30 * 60 * 1000);
