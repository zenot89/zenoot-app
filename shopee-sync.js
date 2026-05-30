// ─── SHOPEE-SYNC.JS — Auto Sync Order ke Jurnal Penjualan ────
// Jalankan setelah token tersimpan di shopee_tokens
// Sync: order list → jurnal_penjualan
// ─────────────────────────────────────────────────────────────

const SHOPEE_EDGE = SUPABASE_URL + '/functions/v1/shopee-proxy';

// ─── AUTO SYNC saat app load ─────────────────────────────────
(async function() {
  try {
    const tokens = await dbGet('shopee_tokens', '&order=updated_at.desc&limit=1');
    if (!tokens.length || !tokens[0].access_token) return;
    const tok = tokens[0];
    const expAt = tok.expire_at || 0;
    if (expAt < Math.floor(Date.now() / 1000)) {
      console.log('[shopee-sync] Token expired, skip auto-sync');
      return;
    }
    console.log('[shopee-sync] Token OK, mulai sync...');
    await shopeeSyncOrders(tok, false); // silent sync
  } catch(e) {
    console.warn('[shopee-sync] Auto-sync skip:', e.message);
  }
})();

// ─── SYNC ORDERS ─────────────────────────────────────────────
async function shopeeSyncOrders(tok, verbose) {
  if (!tok) {
    const tokens = await dbGet('shopee_tokens', '&order=updated_at.desc&limit=1');
    if (!tokens.length) throw new Error('Belum ada token Shopee');
    tok = tokens[0];
  }

  const log = verbose ? (msg, t) => _saLog(msg, t) : () => {};

  log('Mengambil daftar order dari Shopee...', 'info');

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

  log(`Dapat ${allOrders.length} order, memproses...`, 'info');

  // Cek order yang sudah ada di jurnal_penjualan
  const existing = await dbGet('jurnal_penjualan', '&channel=eq.Shopee&select=no_order');
  const existSet = new Set(existing.map(r => r.no_order));

  let inserted = 0;
  for (const order of allOrders) {
    const sn = order.order_sn;
    if (existSet.has(sn)) continue; // skip yang sudah ada

    try {
      // Get order detail untuk harga
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

      const omset      = parseFloat(det.buyer_total_amount || det.order_income?.buyer_total_amount || 0);
      const escrow     = parseFloat(det.escrow_amount || det.order_income?.escrow_amount || 0);
      const b_komisi   = parseFloat(det.commission_fee || det.order_income?.commission_fee || 0);
      const b_admin    = parseFloat(det.service_fee || det.order_income?.service_fee || 0);
      const b_layanan  = parseFloat(det.transaction_fee || det.order_income?.transaction_fee || 0);
      const b_proses   = parseFloat(det.order_processing_fee || 0);
      const b_kampanye = parseFloat(det.campaign_fee || 0);

      const tanggal = new Date(order.create_time * 1000).toISOString().split('T')[0];

      await dbInsert('jurnal_penjualan', {
        tanggal,
        no_order:    sn,
        channel:     'Shopee',
        omset,
        escrow,
        biaya_komisi:   b_komisi,
        biaya_admin:    b_admin,
        biaya_layanan:  b_layanan,
        biaya_proses:   b_proses,
        biaya_kampanye: b_kampanye,
        status:         order.order_status,
        created_at:     new Date().toISOString(),
      });
      inserted++;
    } catch(e) {
      console.warn('[shopee-sync] Skip order', sn, e.message);
    }
  }

  log(`Sync selesai! ${inserted} order baru ditambahkan.`, 'ok');
  return inserted;
}

// ─── MANUAL SYNC (dipanggil dari UI) ────────────────────────
async function shopeeManualSync() {
  const btn = document.getElementById('shopee-sync-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader ti-spin"></i> Syncing...'; }
  try {
    const n = await shopeeSyncOrders(null, true);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-refresh"></i> Sync Order'; }
    alert(`Sync selesai! ${n} order baru ditambahkan.`);
    if (typeof loadJurnalPenjualan === 'function') loadJurnalPenjualan();
  } catch(e) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-refresh"></i> Sync Order'; }
    alert('Sync gagal: ' + e.message);
  }
}
