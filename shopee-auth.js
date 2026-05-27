// ─── SHOPEE-AUTH.JS — Koneksi & Token Management ─────────────
// Mengelola OAuth flow Shopee API v2.0
// Partner ID  : 1234423  (TEST/SANDBOX)
// Redirect URL: https://zenoot89.github.io
// CORS: semua call ke Shopee harus lewat Supabase Edge Function
// ─────────────────────────────────────────────────────────────

const SHOPEE_PARTNER_ID  = 1234423;
const SHOPEE_REDIRECT    = 'https://zenoot89.github.io';
// ⚠️  Partner Key JANGAN disimpan di frontend — ini hanya untuk dev/test lokal
// Untuk production: simpan di Supabase Edge Function sebagai env variable
const SHOPEE_TEST_KEY    = 'shpk764241644f4e5561434e464f61474a4f414a41534e774b63487148626551';

// Base URL Shopee API (test/sandbox)
const SHOPEE_API_BASE    = 'https://partner.test-stable.shopeemobile.com';

// ─── RENDER HALAMAN ─────────────────────────────────────────
document.addEventListener('zenot:page', async function(e) {
  if (!e.detail || e.detail.page !== 'shopee-auth') return;
  await renderShopeeAuthPage();
});

// Jalankan saat script pertama load
(function() {
  // Cek OAuth callback dari Shopee (?code=xxx di URL)
  _handleShopeeCallback();
  // Kalau halaman sudah active saat script load, render langsung
  var el = document.getElementById('page-shopee-auth');
  if (el && el.classList.contains('active')) {
    renderShopeeAuthPage();
  }
})();

async function renderShopeeAuthPage() {
  const el = document.getElementById('page-shopee-auth');
  if (!el) return;

  // Ambil data token dari Supabase
  let tokens = [];
  try {
    tokens = await dbGet('shopee_tokens', '&order=created_at.desc');
  } catch(e) {
    console.warn('Belum ada tabel shopee_tokens:', e.message);
  }

  const hasToken = tokens.length > 0 && tokens[0].access_token;
  const tok      = hasToken ? tokens[0] : null;
  const expTime  = tok ? new Date(tok.expire_at * 1000) : null;
  const isExpired = expTime ? expTime < new Date() : true;

  el.innerHTML = `
    <div style="padding:20px;max-width:600px;margin:0 auto">

      <!-- STATUS CARD -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-title"><i class="ti ti-brand-shopee"></i> Koneksi Shopee API</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <span style="
            display:inline-flex;align-items:center;gap:6px;
            padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;
            background:${hasToken && !isExpired ? 'var(--success-bg,#1a3a1a)' : 'var(--danger-bg,#3a1a1a)'};
            color:${hasToken && !isExpired ? 'var(--success,#4caf50)' : 'var(--danger,#f44336)'}
          ">
            <span style="width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block"></span>
            ${hasToken && !isExpired ? 'Terhubung' : (hasToken && isExpired ? 'Token Expired' : 'Belum Terhubung')}
          </span>
          ${tok ? `<span style="font-size:12px;color:var(--ink3)">Shop ID: <b>${tok.shop_id}</b></span>` : ''}
        </div>

        ${tok ? `
          <div style="background:var(--card-bg2,rgba(255,255,255,0.04));border-radius:8px;padding:12px;font-size:12px;margin-bottom:14px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;color:var(--ink2)">
              <div><span style="color:var(--ink3)">Shop ID</span><br><b style="color:var(--ink)">${tok.shop_id}</b></div>
              <div><span style="color:var(--ink3)">Status</span><br><b style="color:${isExpired ? 'var(--danger)' : 'var(--success)'}">${isExpired ? 'Expired' : 'Aktif'}</b></div>
              <div><span style="color:var(--ink3)">Expire</span><br><b style="color:var(--ink)">${expTime ? expTime.toLocaleString('id-ID') : '-'}</b></div>
              <div><span style="color:var(--ink3)">Terakhir sync</span><br><b style="color:var(--ink)">${tok.updated_at ? new Date(tok.updated_at).toLocaleString('id-ID') : '-'}</b></div>
            </div>
          </div>
        ` : `
          <p style="font-size:13px;color:var(--ink2);margin-bottom:14px;line-height:1.6">
            Hubungkan toko Shopee kamu ke zenOt untuk auto-sync pesanan, data keuangan, dan escrow secara otomatis.
          </p>
        `}

        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="shopeeStartAuth()" style="gap:6px">
            <i class="ti ti-brand-shopee"></i>
            ${hasToken ? (isExpired ? 'Refresh Token' : 'Hubungkan Ulang') : 'Hubungkan Toko Shopee'}
          </button>
          ${tok && !isExpired ? `
            <button class="btn btn-sm" onclick="shopeeTestConnection()" style="gap:6px">
              <i class="ti ti-plug"></i> Test Koneksi
            </button>
            <button class="btn btn-sm" onclick="shopeeRefreshToken()" style="gap:6px">
              <i class="ti ti-refresh"></i> Refresh Token
            </button>
          ` : ''}
          ${tok ? `
            <button class="btn btn-sm" style="color:var(--danger);gap:6px" onclick="shopeeDisconnect()">
              <i class="ti ti-unlink"></i> Putus Koneksi
            </button>
          ` : ''}
        </div>
      </div>

      <!-- CARA KERJA -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-title"><i class="ti ti-info-circle"></i> Cara Kerja</div>
        <div style="font-size:13px;color:var(--ink2);line-height:1.8">
          <div style="display:flex;gap:10px;margin-bottom:8px">
            <span style="color:var(--accent);font-weight:700;min-width:20px">1</span>
            <span>Klik <b>Hubungkan Toko Shopee</b> → kamu akan diarahkan ke halaman login Shopee</span>
          </div>
          <div style="display:flex;gap:10px;margin-bottom:8px">
            <span style="color:var(--accent);font-weight:700;min-width:20px">2</span>
            <span>Login dengan akun toko ZENOT → klik <b>Izinkan</b></span>
          </div>
          <div style="display:flex;gap:10px;margin-bottom:8px">
            <span style="color:var(--accent);font-weight:700;min-width:20px">3</span>
            <span>Kamu akan kembali ke aplikasi ini secara otomatis</span>
          </div>
          <div style="display:flex;gap:10px">
            <span style="color:var(--accent);font-weight:700;min-width:20px">4</span>
            <span>Token disimpan di database — pesanan dan keuangan mulai sync otomatis</span>
          </div>
        </div>
      </div>

      <!-- LOG -->
      <div class="card">
        <div class="card-title"><i class="ti ti-list"></i> Log Aktivitas</div>
        <div id="shopee-auth-log" style="font-size:12px;color:var(--ink3);min-height:40px">
          <span style="color:var(--ink4)">— belum ada aktivitas —</span>
        </div>
      </div>

    </div>
  `;

  // Render sketchy UI
  setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(el); }, 80);
}

// ─── LOG HELPER ─────────────────────────────────────────────
function _saLog(msg, type) {
  var el = document.getElementById('shopee-auth-log');
  if (!el) return;
  var color = type === 'ok' ? 'var(--success,#4caf50)' : type === 'err' ? 'var(--danger,#f44336)' : 'var(--ink2)';
  var icon  = type === 'ok' ? '✓' : type === 'err' ? '✗' : '→';
  var time  = new Date().toLocaleTimeString('id-ID');
  el.innerHTML = `<div style="color:${color};margin-bottom:4px"><b>${icon}</b> [${time}] ${msg}</div>` + el.innerHTML;
}

// ─── STEP 1: MULAI AUTH ─────────────────────────────────────
// Generate auth URL dan buka di tab/window baru
// ⚠️  Signature untuk auth URL tidak butuh secret key — cukup partner_id + timest
function shopeeStartAuth() {
  const timest  = Math.floor(Date.now() / 1000);
  const path    = '/api/v2/shop/auth_partner';
  // Redirect setelah auth kembali ke app ini
  const redirect = SHOPEE_REDIRECT + '?shopee_callback=1';

  // Untuk TEST environment: tidak perlu HMAC signature pada auth URL
  const authUrl = SHOPEE_API_BASE + path
    + '?partner_id=' + SHOPEE_PARTNER_ID
    + '&timestamp='  + timest
    + '&redirect='   + encodeURIComponent(redirect);

  _saLog('Membuka halaman otorisasi Shopee...', 'info');

  // Simpan state untuk validasi callback
  try { localStorage.setItem('shopee_auth_ts', timest); } catch(e) {}

  // Buka di tab baru (karena GitHub Pages)
  window.open(authUrl, '_blank');

  _saLog('Halaman Shopee terbuka di tab baru. Login dan klik Izinkan, lalu kembali ke sini.', 'info');
}

// ─── STEP 2: HANDLE CALLBACK ────────────────────────────────
// Shopee redirect ke: https://zenoot89.github.io?code=XXX&shop_id=YYY
// Karena GitHub Pages (SPA), kita cek URL params saat app load
function _handleShopeeCallback() {
  const params = new URLSearchParams(window.location.search);
  const code   = params.get('code');
  const shopId = params.get('shop_id');

  if (!code || !shopId) return; // bukan callback

  _saLog('Menerima callback dari Shopee... code=' + code.substring(0,8) + '...', 'info');

  // Bersihkan URL agar tidak loop
  try {
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch(e) {}

  // Exchange code → access_token via Supabase Edge Function
  // Edge Function yang menangani HMAC signature (jangan expose secret di frontend!)
  _shopeeExchangeToken(code, parseInt(shopId));
}

// ─── STEP 3: EXCHANGE CODE → TOKEN ──────────────────────────
// Ini harus lewat Supabase Edge Function karena butuh secret key untuk HMAC
async function _shopeeExchangeToken(code, shopId) {
  _saLog('Menukar code dengan access token...', 'info');

  const SUPABASE_EDGE = SUPABASE_URL + '/functions/v1/shopee-proxy';

  try {
    const res  = await fetch(SUPABASE_EDGE, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + SUPABASE_KEY,
      },
      body: JSON.stringify({
        action:  'get_token',
        code:    code,
        shop_id: shopId,
      })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || data.message || 'Token exchange gagal');
    }

    // Simpan token ke Supabase
    await _saveToken(shopId, data);
    _saLog('Berhasil! Toko ' + shopId + ' terhubung ke zenOt.', 'ok');
    setTimeout(() => renderShopeeAuthPage(), 800);

  } catch(err) {
    _saLog('Gagal dapat token: ' + err.message, 'err');
    // Fallback: tampilkan instruksi manual
    _showManualTokenInput(code, shopId);
  }
}

// ─── FALLBACK: INPUT TOKEN MANUAL ───────────────────────────
// Kalau Edge Function belum ada, user bisa input token manual dari API Test Tool
function _showManualTokenInput(code, shopId) {
  var logEl = document.getElementById('shopee-auth-log');
  if (!logEl) return;
  logEl.innerHTML = `
    <div style="background:rgba(255,200,0,0.08);border:1px solid rgba(255,200,0,0.3);border-radius:8px;padding:12px;margin-bottom:10px">
      <div style="font-size:12px;font-weight:600;color:#ffc107;margin-bottom:8px">⚠️ Supabase Edge Function belum aktif</div>
      <div style="font-size:12px;color:var(--ink2);margin-bottom:10px;line-height:1.6">
        Untuk sementara, dapatkan token manual dari <b>Shopee Open Platform → Tools → API Test Tool</b>,
        lalu masukkan di bawah ini:
      </div>
      <div style="display:grid;gap:8px">
        <input id="sa-manual-shop" class="form-input" placeholder="Shop ID (${shopId})" value="${shopId}" style="font-size:12px">
        <input id="sa-manual-access" class="form-input" placeholder="Access Token" style="font-size:12px">
        <input id="sa-manual-refresh" class="form-input" placeholder="Refresh Token" style="font-size:12px">
        <input id="sa-manual-expire" class="form-input" placeholder="Expire At (unix timestamp)" style="font-size:12px">
        <button class="btn btn-primary" onclick="_saveManualToken()" style="font-size:12px">
          <i class="ti ti-device-floppy"></i> Simpan Token
        </button>
      </div>
    </div>
  ` + logEl.innerHTML;
}

async function _saveManualToken() {
  const shopId  = parseInt(document.getElementById('sa-manual-shop')?.value || '0');
  const access  = document.getElementById('sa-manual-access')?.value?.trim();
  const refresh = document.getElementById('sa-manual-refresh')?.value?.trim();
  const expire  = parseInt(document.getElementById('sa-manual-expire')?.value || '0');

  if (!shopId || !access) { alert('Shop ID dan Access Token wajib diisi!'); return; }

  await _saveToken(shopId, {
    access_token:  access,
    refresh_token: refresh || '',
    expire_in:     expire  || 86400,
  });
  _saLog('Token manual tersimpan untuk shop ' + shopId, 'ok');
  setTimeout(() => renderShopeeAuthPage(), 500);
}

// ─── SIMPAN TOKEN KE SUPABASE ────────────────────────────────
async function _saveToken(shopId, data) {
  const expireAt = data.expire_at || Math.floor(Date.now() / 1000) + (data.expire_in || 86400);
  const payload  = {
    shop_id:       shopId,
    partner_id:    SHOPEE_PARTNER_ID,
    access_token:  data.access_token,
    refresh_token: data.refresh_token || '',
    expire_at:     expireAt,
    updated_at:    new Date().toISOString(),
  };

  // Cek apakah sudah ada record untuk shop ini
  const existing = await dbGet('shopee_tokens', '&shop_id=eq.' + shopId);
  if (existing.length > 0) {
    await dbUpdate('shopee_tokens', existing[0].id, payload);
  } else {
    await dbInsert('shopee_tokens', payload);
  }
}

// ─── TEST KONEKSI ────────────────────────────────────────────
async function shopeeTestConnection() {
  _saLog('Testing koneksi ke Shopee API...', 'info');
  try {
    const tokens = await dbGet('shopee_tokens', '&order=created_at.desc&limit=1');
    if (!tokens.length) throw new Error('Belum ada token tersimpan');

    const tok = tokens[0];
    // Test dengan endpoint /api/v2/shop/get_shop_info
    const SUPABASE_EDGE = SUPABASE_URL + '/functions/v1/shopee-proxy';
    const res  = await fetch(SUPABASE_EDGE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
      body:    JSON.stringify({ action: 'get_shop_info', shop_id: tok.shop_id, access_token: tok.access_token })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    _saLog('Koneksi OK! Toko: ' + (data.shop_name || tok.shop_id), 'ok');
  } catch(err) {
    _saLog('Test gagal: ' + err.message, 'err');
  }
}

// ─── REFRESH TOKEN ───────────────────────────────────────────
async function shopeeRefreshToken() {
  _saLog('Memperpanjang token...', 'info');
  try {
    const tokens = await dbGet('shopee_tokens', '&order=created_at.desc&limit=1');
    if (!tokens.length) throw new Error('Tidak ada token');
    const tok  = tokens[0];
    const SUPABASE_EDGE = SUPABASE_URL + '/functions/v1/shopee-proxy';
    const res  = await fetch(SUPABASE_EDGE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SUPABASE_KEY },
      body:    JSON.stringify({ action: 'refresh_token', shop_id: tok.shop_id, refresh_token: tok.refresh_token })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    await _saveToken(tok.shop_id, data);
    _saLog('Token diperpanjang! Expire baru: ' + new Date((data.expire_at || 0) * 1000).toLocaleString('id-ID'), 'ok');
    setTimeout(() => renderShopeeAuthPage(), 600);
  } catch(err) {
    _saLog('Refresh gagal: ' + err.message, 'err');
  }
}

// ─── PUTUS KONEKSI ───────────────────────────────────────────
async function shopeeDisconnect() {
  if (!confirm('Putus koneksi Shopee? Data yang sudah sync tidak akan terhapus.')) return;
  try {
    const tokens = await dbGet('shopee_tokens');
    for (const t of tokens) await dbDelete('shopee_tokens', t.id);
    _saLog('Koneksi Shopee diputus.', 'info');
    setTimeout(() => renderShopeeAuthPage(), 400);
  } catch(err) {
    _saLog('Gagal putus: ' + err.message, 'err');
  }
}
