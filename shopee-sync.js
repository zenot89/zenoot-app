// ─── SHOPEE-SYNC.JS — Auto Sync Order ke Jurnal Penjualan ────
// Sync otomatis: saat app load + tiap 30 menit
// Insert ke tabel jurnal_penjualan dengan kolom yang sudah ada
// + kolom tambahan Shopee (no_order, omset, escrow, biaya_*)
// ─────────────────────────────────────────────────────────────

const SHOPEE_EDGE = SUPABASE_URL + '/functions/v1/shopee-proxy';

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

// ─── AUTO SYNC SAAT APP LOAD ──────────────────────────────────
(async function() {
  try {
    const tokens = await dbGet('shopee_tokens', '&order=updated_at.desc&limit=1');
    if (!tokens.length || !tokens[0].access_token) return;
    const tok = tokens[0];
    if ((tok.expire_at || 0) < Math.floor(Date.now() / 1000)) {
      console.log('[shopee-sync] Token expired, skip auto-sync');
      return;
    }
    console.log('[shopee-sync] Token OK, mulai sync saat load...');
    await shopeeSyncOrders(tok);
  } catch(e) {
    console.warn('[shopee-sync] Auto-sync on load skip:', e.message);
  }
})();

// ─── AUTO SYNC BERKALA TIAP 30 MENIT ─────────────────────────
setInterval(async function() {
  try {
    const tokens = await dbGet('shopee_tokens', '&order=updated_at.desc&limit=1');
    if (!tokens.length || !tokens[0].access_token) return;
    const tok = tokens[0];
    if ((tok.expire_at || 0) < Math.floor(Date.now() / 1000)) {
      console.log('[shopee-sync] Token expired, skip periodic sync');
      return;
    }
    console.log('[shopee-sync] Periodic sync (30 menit)...');
    await shopeeSyncOrders(tok);
  } catch(e) {
    console.warn('[shopee-sync] Periodic sync skip:', e.message);
  }
}, 30 * 60 * 1000); // 30 menit

// ─── CORE SYNC ORDERS ────────────────────────────────────────
async function shopeeSyncOrders(tok) {
  if (!tok) {
    const tokens = await dbGet('shopee_tokens', '&order=updated_at.desc&limit=1');
    if (!tokens.length) throw new Error('Belum ada token Shopee');
    tok = tokens[0];
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
  const existing = await dbGet('jurnal_penjualan', '&no_order=not.is.null&select=no_order');
  const existSet = new Set(existing.map(r => r.no_order));

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
        channel_id:     channelId,   // FK ke tabel channels (toko_utama)
        no_order:       sn,
        omset,
        escrow,
        biaya_komisi:   b_komisi,
        biaya_admin:    b_admin,
        biaya_layanan:  b_layanan,
        biaya_proses:   b_proses,
        biaya_kampanye: b_kampanye,
        order_status:   order.order_status,
        // sku, qty, harga_satuan, total dibiarkan null untuk order Shopee
        // (bisa diisi manual atau dari get_order_detail jika perlu)
        created_at:     new Date().toISOString(),
      });
      inserted++;
    } catch(e) {
      console.warn('[shopee-sync] Skip order', sn, e.message);
    }
  }

  console.log('[shopee-sync] Selesai. ' + inserted + ' order baru.');

  // Refresh tampilan Jurnal Penjualan jika halaman itu sedang aktif
  if (inserted > 0 && typeof loadJurnalPenjualan === 'function') {
    const page = document.querySelector('.page.active');
    if (page && page.id === 'page-jurnal-penjualan') {
      loadJurnalPenjualan();
    }
  }

  return inserted;
}
