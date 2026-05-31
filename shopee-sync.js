// ─── SHOPEE-SYNC.JS — Auto Sync Order ke Jurnal Penjualan ────
// Sync otomatis: saat app load + tiap 30 menit
// Insert ke tabel jurnal_penjualan dengan kolom yang sudah ada
// + kolom tambahan Shopee (no_order, omset, escrow, biaya_*)
// ─────────────────────────────────────────────────────────────

const SHOPEE_EDGE = SUPABASE_URL + '/functions/v1/shopee-proxy';

// ─── AMBIL TOKEN VALID DARI DB ────────────────────────────────
async function _getValidToken() {
  try {
    const tokens = await dbGet('shopee_tokens', '&order=updated_at.desc&limit=1');
    if (!tokens.length || !tokens[0].access_token) return null;
    const tok = tokens[0];
    if ((tok.expire_at || 0) < Math.floor(Date.now() / 1000)) return null;
    return tok;
  } catch(e) { return null; }
}

// Cache channel_id Shopee (toko_utama) agar tidak query berulang
let _shopeeChannelId = null;

// ─── AMBIL CHANNEL_ID SHOPEE DARI DB ─────────────────────────
async function _getShopeeChannelId() {
  if (_shopeeChannelId) return _shopeeChannelId;
  try {
    const ch = await dbGet('channels', '&kategori=eq.toko_utama&limit=1');
    _shopeeChannelId = ch.length ? ch[0].id : null;
  } catch(e) {
    _shopeeChannelId = null;
  }
  return _shopeeChannelId;
}

// ─── SYNC SHOPEE FINANCE (Escrow + Wallet) ke shopee_finance_cache ───
// Dipanggil otomatis setelah shopeeSyncOrders, bisa juga manual
async function syncShopeeFinance(tok) {
  if (!tok) {
    tok = await _getValidToken();
    if (!tok) return null;
  }

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
    if (data.error) {
      console.warn('[shopee-sync] get_finance_info error:', data.error);
      return null;
    }

    // Support berbagai field name dari Shopee API / Edge Function
    const escrow_transit = parseFloat(
      data.escrow_transit  || data.escrow_amount    ||
      data.escrow_balance  || data.income           || 0
    );
    const wallet_balance = parseFloat(
      data.wallet_balance  || data.shopee_wallet    ||
      data.sip_wallet_balance || 0
    );

    const payload = {
      shop_id:        tok.shop_id,
      escrow_transit,
      wallet_balance,
      fetched_at:     new Date().toISOString(),
      raw_response:   JSON.stringify(data),
    };

    // Upsert: cek dulu apakah row sudah ada
    let existing = [];
    try {
      existing = await dbGet('shopee_finance_cache', '&shop_id=eq.' + tok.shop_id + '&limit=1');
    } catch(e) { existing = []; }

    if (existing.length) {
      await fetch(
        SUPABASE_URL + '/rest/v1/shopee_finance_cache?shop_id=eq.' + tok.shop_id,
        {
          method:  'PATCH',
          headers: { ..._headers(), 'Prefer': 'return=minimal' },
          body:    JSON.stringify(payload),
        }
      );
    } else {
      await dbInsert('shopee_finance_cache', payload);
    }

    console.log('[shopee-sync] Finance synced — escrow:', escrow_transit, 'wallet:', wallet_balance);

    // Trigger refresh Net Worth widget jika ada
    if (typeof nwRefresh === 'function') nwRefresh();

    return { escrow_transit, wallet_balance };
  } catch(e) {
    console.warn('[shopee-sync] syncShopeeFinance error:', e.message);
    return null;
  }
}

// ─── SYNC ACTIVE ORDER ESCROW ─────────────────────────────────
// Mengambil escrow dari order-order yang masih aktif (READY_TO_SHIP, SHIPPED, TO_CONFIRM_RECEIVE)
// dan meng-update jurnal_penjualan yang sudah ada jika escrow berubah
async function syncActiveOrderEscrow(tok) {
  if (!tok) {
    tok = await _getValidToken();
    if (!tok) return 0;
  }

  const timeTo   = Math.floor(Date.now() / 1000);
  const timeFrom = timeTo - 86400 * 30;
  const activeStatuses = ['READY_TO_SHIP', 'SHIPPED', 'TO_CONFIRM_RECEIVE'];
  let allOrders = [];

  for (const status of activeStatuses) {
    try {
      const res = await fetch(SHOPEE_EDGE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
        body:    JSON.stringify({
          action:       'get_order_list',
          shop_id:      tok.shop_id,
          access_token: tok.access_token,
          time_from:    timeFrom,
          time_to:      timeTo,
          order_status: status,
        })
      });
      const data = await res.json();
      if (data.order_list) allOrders = allOrders.concat(data.order_list);
    } catch(e) {
      console.warn('[shopee-sync] syncActiveOrderEscrow skip status', status, e.message);
    }
  }

  if (!allOrders.length) return 0;

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
      const inc = det.order_income || det;

      const escrow     = parseFloat(inc.escrow_amount || det.escrow_amount || 0);
      const omset      = parseFloat(inc.buyer_total_amount || det.buyer_total_amount || 0);
      const b_komisi   = parseFloat(inc.commission_fee     || det.commission_fee     || 0);
      const b_admin    = parseFloat(inc.service_fee        || det.service_fee        || 0);
      const b_layanan  = parseFloat(inc.transaction_fee    || det.transaction_fee    || 0);
      const b_proses   = parseFloat(inc.order_processing_fee || det.order_processing_fee || 0);
      const b_kampanye = parseFloat(inc.campaign_fee       || det.campaign_fee       || 0);

      // Update jurnal_penjualan yang sudah ada (berdasarkan no_order)
      await fetch(
        SUPABASE_URL + '/rest/v1/jurnal_penjualan?no_order=eq.' + encodeURIComponent(sn),
        {
          method:  'PATCH',
          headers: { ..._headers(), 'Prefer': 'return=minimal' },
          body:    JSON.stringify({
            escrow,
            omset:          omset  || undefined,
            biaya_komisi:   b_komisi,
            biaya_admin:    b_admin,
            biaya_layanan:  b_layanan,
            biaya_proses:   b_proses,
            biaya_kampanye: b_kampanye,
            order_status:   order.order_status,
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

// ─── CORE SYNC ORDERS ────────────────────────────────────────
async function shopeeSyncOrders(tok) {
  if (!tok) {
    tok = await _getValidToken();
    if (!tok) {
      console.log('[shopee-sync] shopeeSyncOrders: tidak ada token valid');
      return 0;
    }
  }

  // Ambil channel_id Shopee dari tabel channels
  const channelId = await _getShopeeChannelId();

  // Ambil order 30 hari terakhir
  const timeTo   = Math.floor(Date.now() / 1000);
  const timeFrom = timeTo - 86400 * 30;

  const statuses = ['COMPLETED', 'READY_TO_SHIP', 'SHIPPED', 'TO_CONFIRM_RECEIVE'];
  let allOrders  = [];

  for (const status of statuses) {
    try {
      const res = await fetch(SHOPEE_EDGE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
        body:    JSON.stringify({
          action:       'get_order_list',
          shop_id:      tok.shop_id,
          access_token: tok.access_token,
          time_from:    timeFrom,
          time_to:      timeTo,
          order_status: status,
        })
      });
      const data = await res.json();
      if (data.order_list) allOrders = allOrders.concat(data.order_list);
    } catch(e) {
      console.warn('[shopee-sync] Skip status', status, e.message);
    }
  }

  if (!allOrders.length) {
    console.log('[shopee-sync] Tidak ada order baru.');
    return 0;
  }

  // Cek order yang sudah ada (by no_order) agar tidak duplikat
  let existingOrders = [];
  try {
    existingOrders = await dbGet('jurnal_penjualan', '&no_order=not.is.null&select=no_order');
  } catch(e) { existingOrders = []; }
  const existSet = new Set(existingOrders.map(r => r.no_order));

  let inserted = 0;
  for (const order of allOrders) {
    const sn = order.order_sn;
    if (existSet.has(sn)) continue;

    try {
      // Get escrow detail untuk data keuangan
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

      // Support berbagai struktur response Shopee
      const inc = det.order_income || det;

      const omset      = parseFloat(inc.buyer_total_amount      || det.buyer_total_amount      || 0);
      const escrow     = parseFloat(inc.escrow_amount           || det.escrow_amount           || 0);
      const b_komisi   = parseFloat(inc.commission_fee          || det.commission_fee          || 0);
      const b_admin    = parseFloat(inc.service_fee             || det.service_fee             || 0);
      const b_layanan  = parseFloat(inc.transaction_fee         || det.transaction_fee         || 0);
      const b_proses   = parseFloat(inc.order_processing_fee    || det.order_processing_fee    || 0);
      const b_kampanye = parseFloat(inc.campaign_fee            || det.campaign_fee            || 0);

      const tanggal = new Date(order.create_time * 1000).toISOString().split('T')[0];
      const waktu   = new Date(order.create_time * 1000).toTimeString().slice(0, 5);

      // Insert ke jurnal_penjualan dengan kolom yang lengkap
      await dbInsert('jurnal_penjualan', {
        tanggal,
        waktu,
        channel_id:     channelId,
        no_order:       sn,
        omset,
        escrow,
        biaya_komisi:   b_komisi,
        biaya_admin:    b_admin,
        biaya_layanan:  b_layanan,
        biaya_proses:   b_proses,
        biaya_kampanye: b_kampanye,
        order_status:   order.order_status,
        created_at:     new Date().toISOString(),
      });
      inserted++;
    } catch(e) {
      console.warn('[shopee-sync] Skip order', sn, e.message);
    }
  }

  console.log('[shopee-sync] Selesai. ' + inserted + ' order baru di-insert.');

  // Refresh tampilan Jurnal Penjualan jika halaman itu sedang aktif
  if (inserted > 0 && typeof loadJurnalPenjualan === 'function') {
    const page = document.querySelector('.page.active');
    if (page && page.id === 'page-jurnal-penjualan') {
      loadJurnalPenjualan();
    }
  }

  return inserted;
}

// ─── AUTO REFRESH TOKEN (tiap 30 menit, perpanjang kalau sisa < 1 jam) ───────
async function _autoRefreshTokenIfNeeded() {
  try {
    const tokens = await dbGet('shopee_tokens', '&order=updated_at.desc&limit=1');
    if (!tokens.length || !tokens[0].access_token) return;
    const tok = tokens[0];
    const now = Math.floor(Date.now() / 1000);
    const sisaDetik = (tok.expire_at || 0) - now;

    // Kalau sisa > 1 jam, tidak perlu refresh
    if (sisaDetik > 3600) {
      console.log('[shopee-sync] Token masih OK, sisa', Math.round(sisaDetik/60), 'menit');
      return;
    }

    // Kalau sudah expired total (> 30 hari), tidak bisa refresh, harus hubungkan ulang
    if (sisaDetik < -(86400 * 30)) {
      console.warn('[shopee-sync] Token terlalu lama expired, hubungkan ulang Shopee');
      return;
    }

    console.log('[shopee-sync] Token mau habis, auto-refresh...');
    const res = await fetch(SHOPEE_EDGE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
      body:    JSON.stringify({
        action:        'refresh_token',
        shop_id:       tok.shop_id,
        refresh_token: tok.refresh_token,
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // Simpan token baru ke DB
    const expireAt = data.expire_at || (now + (data.expire_in || 14400));
    await fetch(
      SUPABASE_URL + '/rest/v1/shopee_tokens?shop_id=eq.' + tok.shop_id,
      {
        method:  'PATCH',
        headers: { ..._headers(), 'Prefer': 'return=minimal' },
        body:    JSON.stringify({
          access_token:  data.access_token,
          refresh_token: data.refresh_token || tok.refresh_token,
          expire_at:     expireAt,
          updated_at:    new Date().toISOString(),
        }),
      }
    );
    console.log('[shopee-sync] Token berhasil di-refresh! Expire baru:', new Date(expireAt * 1000).toLocaleString('id-ID'));

    // Full sync dengan token baru
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
    if (!tok) {
      console.log('[shopee-sync] Tidak ada token valid, skip auto-sync on load');
      return;
    }
    console.log('[shopee-sync] Token OK, mulai sync saat load...');
    // Finance sync DULU (cepat, tidak tergantung order baru)
    await syncShopeeFinance(tok);
    // Lalu order sync
    await shopeeSyncOrders(tok);
  } catch(e) {
    console.warn('[shopee-sync] Auto-sync on load skip:', e.message);
  }
})();

// ─── AUTO SYNC BERKALA TIAP 30 MENIT ─────────────────────────
setInterval(async function() {
  try {
    const tok = await _getValidToken();
    if (!tok) {
      console.log('[shopee-sync] Token tidak valid, skip periodic sync');
      return;
    }
    console.log('[shopee-sync] Periodic sync (30 menit)...');
    await syncShopeeFinance(tok);
    await syncActiveOrderEscrow(tok);
    await shopeeSyncOrders(tok);
  } catch(e) {
    console.warn('[shopee-sync] Periodic sync skip:', e.message);
  }
}, 30 * 60 * 1000);

// Jalankan auto-refresh tiap 30 menit (versandar pada timer berbeda dari sync)
setInterval(_autoRefreshTokenIfNeeded, 30 * 60 * 1000);
// Cek token saat pertama load (delay 5 detik biar DB siap)
setTimeout(_autoRefreshTokenIfNeeded, 5000);
