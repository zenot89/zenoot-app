// ─── SUPABASE.JS ─────────────────────────────────────────────
const SUPABASE_URL = 'https://hkhntwgurticesuwcmyz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhraG50d2d1cnRpY2VzdXdjbXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzE1NjIsImV4cCI6MjA5NDA0NzU2Mn0.DSw0s6ik7ghdl947eEROgCQ00Qc6hA-h7sl3_RihcWc';

// ─── AUTH ─────────────────────────────────────────────────────
// 4 Okt 2026 — LOGIN (Supabase Auth, email + password, 1 akun pemilik).
//
// Dulu: tidak ada login, semua request pakai anon key yang tertulis di file ini + policy RLS
// allow_all_temp → siapa pun yang punya URL project + anon key bisa baca/ubah/hapus SEMUA tabel.
// Sekarang:
//  1. Layar login (overlay) muncul kalau belum ada sesi. Sesi disimpan di localStorage
//     ('zenoot_auth_v1'), jadi analisis.html / iframe embed (same-origin) ikut sesi yang sama.
//  2. window.fetch dibungkus: SEMUA request ke SUPABASE_URL (REST, RPC, edge function shopee-proxy)
//     otomatis memakai access token user (bukan anon key) — modul lain TIDAK perlu diubah, termasuk
//     yang menulis 'Authorization: Bearer ' + SUPABASE_KEY langsung. Tanpa sesi, request DITAHAN
//     (tidak dikirim, tidak ada data bocor/ter-render) sampai login berhasil → halaman reload.
//  3. Token di-refresh otomatis (refresh token berputar; pakai Web Locks supaya 2 tab/iframe tidak
//     saling rebutan). Gagal refresh karena OFFLINE ≠ logout; ditolak server = minta login ulang.
//  4. Pengamanan sebenarnya ada di DATABASE (RLS hanya untuk email pemilik) — lihat zenoot-lock-db.sql.
//     Layar login ini cuma pintu depan; tanpa SQL itu data tetap terbuka lewat API.
var _Z_SESS_KEY  = 'zenoot_auth_v1';
var _zSess       = null;
var _zRefreshing = null;
var _zNativeFetch = window.fetch.bind(window);
window._zNativeFetch = _zNativeFetch;
var _zIsEmbed = /[?&]embed=1/.test(location.search);
var _zLocked = false;   // true = layar kunci Face ID sedang tampil (lihat modul KUNCI FACE ID di bawah)

function _zNow() { return Math.floor(Date.now() / 1000); }

function _zReadSess() {
  try {
    var raw = localStorage.getItem(_Z_SESS_KEY);
    if (!raw) return null;
    var o = JSON.parse(raw);
    if (o && o.access_token && o.refresh_token && o.expires_at) return o;
  } catch (e) {}
  return null;
}
function _zWriteSess(o) {
  _zSess = o || null;
  try {
    if (o) localStorage.setItem(_Z_SESS_KEY, JSON.stringify(o));
    else localStorage.removeItem(_Z_SESS_KEY);
  } catch (e) {}
}
_zSess = _zReadSess();

function _zFromAuth(j, prev) {
  return {
    access_token:  j.access_token,
    refresh_token: j.refresh_token,
    expires_at:    j.expires_at || (_zNow() + (j.expires_in || 3600)),
    email:         (j.user && j.user.email) || (prev && prev.email) || ''
  };
}

async function _zAuthCall(path, body) {
  var res  = await _zNativeFetch(SUPABASE_URL + path, {
    method:  'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });
  var data = {};
  try { data = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, data: data };
}

async function zAuthSignIn(email, password) {
  var r;
  try { r = await _zAuthCall('/auth/v1/token?grant_type=password', { email: email, password: password }); }
  catch (e) { throw new Error('Tidak bisa terhubung. Cek koneksi internet.'); }
  if (!r.ok) {
    if (r.status === 429) throw new Error('Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.');
    if (r.status === 400 || r.status === 401 || r.status === 422) throw new Error('Email atau password salah.');
    throw new Error((r.data && (r.data.msg || r.data.error_description || r.data.message)) || ('Gagal masuk (' + r.status + ')'));
  }
  _zWriteSess(_zFromAuth(r.data, null));
  return _zSess;
}

// staleToken = access token yang barusan dipakai/hampir habis. Kalau konteks lain (tab/iframe) sudah
// refresh duluan, pakai hasilnya — jangan refresh lagi (refresh token sekali pakai).
// Lempar 'NO_SESSION' kalau server menolak refresh token (harus login ulang), 'NETWORK' kalau gagal sementara.
function _zRefresh(staleToken) {
  if (_zRefreshing) return _zRefreshing;
  var job = async function() {
    var latest = _zReadSess() || _zSess;
    if (!latest) throw new Error('NO_SESSION');
    if (latest.access_token !== staleToken && latest.expires_at - _zNow() > 60) { _zSess = latest; return _zSess; }
    var r;
    try { r = await _zAuthCall('/auth/v1/token?grant_type=refresh_token', { refresh_token: latest.refresh_token }); }
    catch (e) { throw new Error('NETWORK'); }
    if (!r.ok) {
      if (r.status === 400 || r.status === 401 || r.status === 403) {
        var again = _zReadSess();
        if (again && again.refresh_token !== latest.refresh_token) { _zSess = again; return _zSess; }  // sudah di-refresh konteks lain
        _zWriteSess(null);
        throw new Error('NO_SESSION');
      }
      throw new Error('NETWORK');
    }
    var ns = _zFromAuth(r.data, latest);
    _zWriteSess(ns);
    return ns;
  };
  var run = (navigator.locks && navigator.locks.request) ? navigator.locks.request('zenoot-auth-refresh', job) : job();
  _zRefreshing = Promise.resolve(run).then(
    function(v) { _zRefreshing = null; return v; },
    function(e) { _zRefreshing = null; throw e; }
  );
  return _zRefreshing;
}

function _zNeedLogin() {
  _zShowLogin();
  return new Promise(function() {});   // sengaja tidak pernah resolve — halaman reload setelah login berhasil
}

async function _zGetToken() {
  if (!_zSess) { var st = _zReadSess(); if (st) _zSess = st; }
  if (!_zSess) return _zNeedLogin();
  if (_zSess.expires_at - _zNow() > 60) return _zSess.access_token;
  try {
    var s = await _zRefresh(_zSess.access_token);
    return s.access_token;
  } catch (e) {
    if (e && e.message === 'NO_SESSION') return _zNeedLogin();
    return _zSess.access_token;   // offline/gangguan sementara: pakai token lama, biar request gagal sendiri kalau memang sudah kedaluwarsa
  }
}

function _zSend(input, init, token) {
  var req = (typeof input === 'string') ? input : input.clone();
  var base = (init && init.headers) || (typeof req !== 'string' ? req.headers : null) || {};
  var h = new Headers(base);
  h.set('apikey', SUPABASE_KEY);
  h.set('Authorization', 'Bearer ' + token);
  return _zNativeFetch(req, Object.assign({}, init || {}, { headers: h }));
}

window.fetch = async function(input, init) {
  var url = (typeof input === 'string') ? input : ((input && input.url) || String(input));
  if (url.indexOf(SUPABASE_URL) !== 0 || url.indexOf('/auth/v1/') !== -1) return _zNativeFetch(input, init);
  var token = await _zGetToken();
  var res = await _zSend(input, init, token);
  if (res.status === 401) {                       // JWT kedaluwarsa/ditolak → refresh sekali lalu ulang
    try {
      var s = await _zRefresh(token);
      if (s && s.access_token !== token) return _zSend(input, init, s.access_token);
    } catch (e) {
      if (e && e.message === 'NO_SESSION') return _zNeedLogin();
    }
  }
  return res;
};

async function zAuthSignOut() {
  var tok = _zSess && _zSess.access_token;
  try {
    if (tok) await _zNativeFetch(SUPABASE_URL + '/auth/v1/logout?scope=local', {
      method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + tok }
    });
  } catch (e) {}
  _zWriteSess(null);
  location.reload();   // bersihkan semua data yang sudah ter-render di layar
}
function zAuthConfirmSignOut() {
  if (typeof zConfirm === 'function') {
    Promise.resolve(zConfirm('Keluar dari zenOt? Kamu perlu login lagi untuk membuka data.', { ok: 'Keluar' }))
      .then(function(ok) { if (ok) zAuthSignOut(); });
  } else if (window._nativeConfirm ? window._nativeConfirm('Keluar dari zenOt?') : confirm('Keluar dari zenOt?')) {
    zAuthSignOut();
  }
}
function zAuthEmail() { return (_zSess && _zSess.email) || ''; }

// Login/logout/refresh di tab lain → ikut sinkron
window.addEventListener('storage', function(e) {
  if (e.key !== _Z_SESS_KEY) return;
  var s = _zReadSess();
  if (s) { var had = !!_zSess; _zSess = s; if (!had) location.reload(); }
  else   { _zSess = null; location.reload(); }
});

// Refresh proaktif (≤ 5 menit sebelum habis) + saat app dibuka lagi dari background
function _zTick() {
  if (!_zSess || document.hidden) return;
  if (_zSess.expires_at - _zNow() < 300) {
    _zRefresh(_zSess.access_token).catch(function(e) { if (e && e.message === 'NO_SESSION') _zShowLogin(); });
  }
}
setInterval(_zTick, 60000);
document.addEventListener('visibilitychange', _zTick);

// ── Layar login ───────────────────────────────────────────────
var _zLoginEl = null;
function _zShowLogin() {
  if (_zIsEmbed || _zLoginEl) return;   // iframe embed: tunggu parent login (storage event di atas → reload)
  if (!document.body) { document.addEventListener('DOMContentLoaded', _zShowLogin, { once: true }); return; }
  if (!document.getElementById('zenoot-login-css')) {
    var st = document.createElement('style');
    st.id = 'zenoot-login-css';
    st.textContent =
      '#zenoot-login{position:fixed;inset:0;z-index:2147483000;background:#F0EFEB;display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--f,-apple-system,"Inter",system-ui,sans-serif);color:#2B2B2B;-webkit-text-size-adjust:100%}' +
      '#zenoot-login .zl-card{width:100%;max-width:360px;background:#fff;border:1.5px solid #E3E1DA;border-radius:18px;padding:28px 24px 24px;box-shadow:0 8px 30px rgba(0,0,0,.06)}' +
      '#zenoot-login .zl-logo{display:block;width:56px;height:56px;object-fit:contain;margin:0 auto 10px}' +
      '#zenoot-login .zl-title{text-align:center;font-size:22px;font-weight:800;letter-spacing:-.3px}' +
      '#zenoot-login .zl-sub{text-align:center;font-size:13px;color:#8A8580;margin:2px 0 20px}' +
      '#zenoot-login .zl-lbl{display:block;font-size:10px;font-weight:700;letter-spacing:.08em;color:#8A8580;margin:12px 0 5px}' +
      '#zenoot-login input{width:100%;box-sizing:border-box;height:44px;padding:0 12px;font-size:16px;font-family:inherit;color:#2B2B2B;background:#F0EFEB;border:1.5px solid #E3E1DA;border-radius:10px;outline:none}' +
      '#zenoot-login input:focus{border-color:#2B2B2B;background:#fff}' +
      '#zenoot-login .zl-pw{position:relative}#zenoot-login .zl-pw input{padding-right:78px}' +
      '#zenoot-login .zl-eye{position:absolute;right:6px;top:6px;height:32px;padding:0 10px;border:none;background:transparent;font-size:12px;font-weight:700;color:#8A8580;cursor:pointer;font-family:inherit}' +
      '#zenoot-login .zl-err{min-height:18px;margin:12px 0 4px;font-size:12.5px;font-weight:600;color:#e05c4b;text-align:center}' +
      '#zenoot-login .zl-btn{width:100%;height:46px;border:none;border-radius:12px;background:#2B2B2B;color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer}' +
      '#zenoot-login .zl-btn:disabled{opacity:.6;cursor:default}';
    document.head.appendChild(st);
  }
  var ov = document.createElement('div');
  ov.id = 'zenoot-login';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.innerHTML =
    '<form class="zl-card" id="zl-form" novalidate>' +
      '<img class="zl-logo" src="logo.png" alt="zenOt" onerror="this.style.display=\'none\'">' +
      '<div class="zl-title">zenOt</div>' +
      '<div class="zl-sub">Masuk untuk melanjutkan</div>' +
      '<label class="zl-lbl" for="zl-email">EMAIL</label>' +
      '<input id="zl-email" name="email" type="email" inputmode="email" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false">' +
      '<label class="zl-lbl" for="zl-pass">PASSWORD</label>' +
      '<div class="zl-pw"><input id="zl-pass" name="password" type="password" autocomplete="current-password">' +
      '<button type="button" class="zl-eye" id="zl-eye" aria-label="Tampilkan password">Lihat</button></div>' +
      '<div class="zl-err" id="zl-err" role="alert"></div>' +
      '<button type="submit" class="zl-btn" id="zl-btn">Masuk</button>' +
    '</form>';
  document.body.appendChild(ov);
  _zLoginEl = ov;
  var emailEl = ov.querySelector('#zl-email'), passEl = ov.querySelector('#zl-pass');
  var errEl = ov.querySelector('#zl-err'), btn = ov.querySelector('#zl-btn'), eye = ov.querySelector('#zl-eye');
  eye.addEventListener('click', function() {
    var show = passEl.type === 'password';
    passEl.type = show ? 'text' : 'password';
    eye.textContent = show ? 'Sembunyi' : 'Lihat';
  });
  ov.querySelector('#zl-form').addEventListener('submit', async function(ev) {
    ev.preventDefault();
    var em = (emailEl.value || '').trim(), pw = passEl.value || '';
    if (!em || !pw) { errEl.textContent = 'Isi email dan password.'; return; }
    errEl.textContent = '';
    btn.disabled = true; btn.textContent = 'Memproses…';
    try {
      await zAuthSignIn(em, pw);
      btn.textContent = 'Berhasil…';
      try { sessionStorage.setItem('zenoot_pw_unlock', '1'); } catch (e) {}   // sudah verifikasi password → jangan minta Face ID lagi
      location.reload();
    } catch (e) {
      errEl.textContent = e.message || 'Gagal masuk.';
      btn.disabled = false; btn.textContent = 'Masuk';
      passEl.value = ''; passEl.focus();
    }
  });
  setTimeout(function() { try { emailEl.focus(); } catch (e) {} }, 60);
}
// Belum ada sesi → langsung tampilkan layar login (jangan nunggu request pertama)
if (!_zSess) _zShowLogin();
// Tombol "Keluar" di sidebar: tampilkan email yang sedang login di tooltip
document.addEventListener('DOMContentLoaded', function() {
  var b = document.getElementById('btn-logout');
  if (b && zAuthEmail()) b.title = 'Keluar (' + zAuthEmail() + ')';
});

// ─── KUNCI BIOMETRIK (Face ID / sidik jari / kunci layar) (5 Okt 2026) ─────────────────────
// Kunci APP lokal di perangkat ini (WebAuthn, authenticator bawaan: Face ID iPhone, sidik jari/wajah Android, Windows Hello/Touch ID).
// Android: kalau biometrik gagal, Android menawarkan PIN/pola kunci layar (userVerification 'required').
// BUKAN pengganti login: pengaman data tetap login Supabase + RLS. Ini mencegah orang yang
// memegang HP yang sedang terbuka membuka datanya. Aturan:
//  - Aktif per perangkat (tombol "Face ID" di sidebar). Kredensial disimpan di localStorage.
//  - Diminta saat app dibuka dari nol, dan saat kembali dari background > 60 detik.
//  - Selama terkunci: layar tertutup penuh (opaque). Data tetap dimuat di belakang layar kunci supaya
//    begitu lolos langsung tampil (tanpa loading). Pengaman datanya tetap login + RLS; kunci ini hanya pintu layar.
//  - Gagal/tidak bisa Face ID → tombol "Masuk dengan password" (keluar → login ulang → langsung masuk).
var _Z_LOCK_KEY   = 'zenoot_lock_v1';
var _Z_ACTIVE_KEY = 'zenoot_active_at';   // sessionStorage: terakhir app aktif (heartbeat)
var _Z_LOCK_GRACE = 60000;
var _zLockWaiters = [];
var _zLockEl = null;

function _zB64u(buf) {
  var b = new Uint8Array(buf), s = '';
  for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function _zFromB64u(str) {
  str = String(str).replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  var bin = atob(str), out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}
function _zRand(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }

function _zLockCfg() {
  try { var o = JSON.parse(localStorage.getItem(_Z_LOCK_KEY) || 'null'); if (o && o.credId) return o; } catch (e) {}
  return null;
}
function zFaceEnabled() { return !!_zLockCfg(); }
function zLockEnabled() { return zFaceEnabled() || zPinEnabled(); }   // kunci aktif bila salah satu (Face ID / PIN) aktif
function _zTouchActive() { try { sessionStorage.setItem(_Z_ACTIVE_KEY, String(Date.now())); } catch (e) {} }
function _zActiveAge() {
  try { var v = Number(sessionStorage.getItem(_Z_ACTIVE_KEY)); return v ? Date.now() - v : Infinity; } catch (e) { return Infinity; }
}
function _zLockErr(e) {
  var n = e && e.name;
  if (n === 'NotAllowedError') return 'Dibatalkan atau waktu habis. Coba lagi.';
  if (n === 'InvalidStateError') return 'Biometrik untuk app ini sudah terdaftar di perangkat ini.';
  if (n === 'NotSupportedError' || n === 'SecurityError') return 'Browser/perangkat ini tidak mendukung kunci biometrik untuk app ini.';
  return (e && e.message) || 'Gagal memakai biometrik.';
}

// Verifikasi Face ID (harus dipanggil dari ketukan tombol — aturan Safari)
async function zLockVerify() {
  var cfg = _zLockCfg();
  if (!cfg) return true;
  var cred = await navigator.credentials.get({ publicKey: {
    challenge: _zRand(32),
    allowCredentials: [{ type: 'public-key', id: _zFromB64u(cfg.credId), transports: ['internal'] }],
    userVerification: 'required',
    timeout: 60000
  } });
  return !!cred;
}

async function zLockEnable() {
  if (!window.PublicKeyCredential || !navigator.credentials) throw new Error('Browser ini belum mendukung kunci biometrik.');
  var avail = false;
  try { avail = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch (e) {}
  if (!avail) throw new Error('Biometrik (Face ID / sidik jari) atau kunci layar belum aktif di perangkat ini. Aktifkan dulu di Pengaturan HP, lalu coba lagi.');
  var email = zAuthEmail() || 'zenoot';
  var cred = await navigator.credentials.create({ publicKey: {
    challenge: _zRand(32),
    rp: { name: 'zenOt' },
    user: { id: _zRand(16), name: email, displayName: email },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
    timeout: 60000,
    attestation: 'none'
  } });
  localStorage.setItem(_Z_LOCK_KEY, JSON.stringify({ credId: _zB64u(cred.rawId), at: Date.now() }));
  _zTouchActive();
}

function _zLockRefreshBtn() {
  var b = document.getElementById('btn-lock');
  if (!b) return;
  var l = b.querySelector('.ni-label');
  var f = zFaceEnabled(), p = zPinEnabled();
  if (l) l.textContent = 'Kunci: ' + (f && p ? 'Biometrik + PIN' : f ? 'Biometrik' : p ? 'PIN' : 'Mati');
}

// Menu "Kunci App": pilih Face ID/sidik jari, PIN, atau keduanya
function _zEnsureMenuCss() {
  if (!document.getElementById('zenoot-lockmenu-css')) {
    var st = document.createElement('style');
    st.id = 'zenoot-lockmenu-css';
    st.textContent =
      '.zm-over{position:fixed;inset:0;z-index:2147482900;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;font-family:var(--f,-apple-system,"Inter",system-ui,sans-serif)}' +
      '.zm-over .zm-sheet{width:100%;max-width:480px;box-sizing:border-box;background:#F0EFEB;color:#2B2B2B;border-radius:20px 20px 0 0;padding:20px 18px calc(env(safe-area-inset-bottom,0px) + 18px)}' +
      '.zm-over .zm-title{font-size:18px;font-weight:800}' +
      '.zm-over .zm-sub{font-size:12.5px;color:#8A8580;margin:4px 0 14px;line-height:1.4}' +
      '.zm-over .zm-row{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border:1.5px solid #E3E1DA;border-radius:14px;padding:12px 14px;margin-bottom:10px}' +
      '.zm-over .zm-name{font-size:14px;font-weight:700}' +
      '.zm-over .zm-st{display:block;font-size:12px;color:#8A8580;margin-top:2px}' +
      '.zm-over .zm-st.on{color:#1f9d55}' +
      '.zm-over .zm-btns{display:flex;gap:6px;flex:none}' +
      '.zm-over .zm-b{border:1.5px solid #E3E1DA;background:#F0EFEB;border-radius:10px;padding:8px 12px;font-size:12.5px;font-weight:700;font-family:inherit;color:#2B2B2B;cursor:pointer}' +
      '.zm-over .zm-b.dark{background:#2B2B2B;border-color:#2B2B2B;color:#fff}' +
      '.zm-over .zm-msg{min-height:18px;font-size:12.5px;font-weight:600;color:#1f9d55;margin:2px 2px 8px}' +
      '.zm-over .zm-msg.err{color:#e05c4b}' +
      '.zm-over .zm-in{width:100%;height:44px;box-sizing:border-box;border:1.5px solid #E3E1DA;border-radius:10px;padding:0 12px;font-size:16px;font-family:inherit;color:#2B2B2B;background:#fff;margin-bottom:8px;outline:none}' +
      '.zm-over .zm-danger{color:#e05c4b}' +
      '.zm-over .zm-wide{width:100%;margin-bottom:8px;padding:11px 12px}' +
      '.zm-over .zm-done{width:100%;height:46px;border:none;border-radius:12px;background:#2B2B2B;color:#fff;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer}';
    document.head.appendChild(st);
  }
}

function zLockMenu() {
  if (document.getElementById('zenoot-lockmenu') || _zIsEmbed) return;
  _zEnsureMenuCss();
  var el = document.createElement('div');
  el.id = 'zenoot-lockmenu';
  el.className = 'zm-over';
  el.innerHTML =
    '<div class="zm-sheet">' +
      '<div class="zm-title">Kunci App</div>' +
      '<div class="zm-sub">Pilih cara membuka app di perangkat ini. Boleh aktif keduanya, lalu pilih saat membuka.</div>' +
      '<div class="zm-row"><div><span class="zm-name">Face ID / sidik jari</span><span class="zm-st" id="zm-face-st"></span></div>' +
        '<div class="zm-btns"><button type="button" class="zm-b dark" id="zm-face"></button></div></div>' +
      '<div class="zm-row"><div><span class="zm-name">PIN 6 digit</span><span class="zm-st" id="zm-pin-st"></span></div>' +
        '<div class="zm-btns"><button type="button" class="zm-b dark" id="zm-pin"></button><button type="button" class="zm-b" id="zm-pin-off">Matikan</button></div></div>' +
      '<div class="zm-msg" id="zm-msg"></div>' +
      '<button type="button" class="zm-done" id="zm-done">Selesai</button>' +
    '</div>';
  document.body.appendChild(el);
  var q = function(id) { return el.querySelector(id); };
  var stFace = q('#zm-face-st'), stPin = q('#zm-pin-st'), bFace = q('#zm-face'), bPin = q('#zm-pin'), bPinOff = q('#zm-pin-off'), msg = q('#zm-msg');
  var armFace = false, armPin = false;
  function say(t, err) { msg.textContent = t || ''; msg.className = 'zm-msg' + (err ? ' err' : ''); }
  function refresh() {
    var f = zFaceEnabled(), p = zPinEnabled();
    stFace.textContent = f ? 'Aktif' : 'Mati'; stFace.className = 'zm-st' + (f ? ' on' : '');
    stPin.textContent = p ? 'Aktif' : 'Mati';  stPin.className = 'zm-st' + (p ? ' on' : '');
    bFace.textContent = armFace ? 'Yakin matikan?' : (f ? 'Matikan' : 'Aktifkan');
    bPin.textContent = p ? 'Ubah PIN' : 'Buat PIN';
    bPinOff.textContent = armPin ? 'Yakin?' : 'Matikan';
    bPinOff.style.display = p ? '' : 'none';
    _zLockRefreshBtn();
  }
  bFace.addEventListener('click', async function() {
    if (zFaceEnabled()) {
      if (!armFace) { armFace = true; refresh(); setTimeout(function() { armFace = false; refresh(); }, 3000); return; }
      armFace = false; localStorage.removeItem(_Z_LOCK_KEY); say('Face ID / sidik jari dimatikan.'); refresh(); return;
    }
    try { await zLockEnable(); say('Face ID / sidik jari aktif.'); } catch (e) { say(_zLockErr(e), true); }
    refresh();
  });
  bPin.addEventListener('click', function() {
    _zPinSetup(function(ok) { if (ok) { _zTouchActive(); say('PIN aktif.'); } refresh(); });
  });
  bPinOff.addEventListener('click', function() {
    if (!armPin) { armPin = true; refresh(); setTimeout(function() { armPin = false; refresh(); }, 3000); return; }
    armPin = false; try { localStorage.removeItem(_Z_PIN_KEY); localStorage.removeItem(_Z_PINFAIL_KEY); } catch (e) {}
    say('PIN dimatikan.'); refresh();
  });
  q('#zm-done').addEventListener('click', function() { if (el.parentNode) el.parentNode.removeChild(el); _zLockRefreshBtn(); });
  refresh();
}
function zLockToggle() { zLockMenu(); }   // dipanggil tombol sidebar (index.html)

// ── Akun Login (sidebar → Setting → Akun Login) ───────────────
async function zAuthChangePassword(pw) {
  var tok = await _zGetToken();
  var res;
  try {
    res = await _zNativeFetch(SUPABASE_URL + '/auth/v1/user', {
      method: 'PUT',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
  } catch (e) { throw new Error('Tidak bisa terhubung. Cek koneksi internet.'); }
  if (res.ok) return true;
  var data = {}; try { data = await res.json(); } catch (e) {}
  var m = String(data.msg || data.message || data.error_description || '');
  if (/reauth|recent/i.test(m)) throw new Error('Untuk keamanan, keluar lalu login ulang dulu, baru ganti password.');
  if (/same|different/i.test(m)) throw new Error('Password baru harus berbeda dari yang lama.');
  if (/weak|short|least|character/i.test(m)) throw new Error('Password terlalu lemah. Pakai minimal 8 karakter, campuran huruf dan angka.');
  throw new Error(m || ('Gagal mengganti password (' + res.status + ')'));
}

function zAkunMenu() {
  if (document.getElementById('zenoot-akunmenu') || _zIsEmbed) return;
  _zEnsureMenuCss();
  var el = document.createElement('div');
  el.id = 'zenoot-akunmenu';
  el.className = 'zm-over';
  el.innerHTML =
    '<div class="zm-sheet">' +
      '<div class="zm-title">Akun Login</div>' +
      '<div class="zm-sub" id="za-email"></div>' +
      '<div class="zm-row"><div><span class="zm-name">Password</span><span class="zm-st">Ganti password untuk login</span></div>' +
        '<div class="zm-btns"><button type="button" class="zm-b dark" id="za-pw">Ganti</button></div></div>' +
      '<div id="za-box" style="display:none">' +
        '<input class="zm-in" id="za-p1" type="password" autocomplete="new-password" placeholder="Password baru (min. 8 karakter)">' +
        '<input class="zm-in" id="za-p2" type="password" autocomplete="new-password" placeholder="Ulangi password baru">' +
        '<button type="button" class="zm-b dark zm-wide" id="za-save">Simpan password</button>' +
      '</div>' +
      '<div class="zm-msg" id="za-msg"></div>' +
      '<button type="button" class="zm-b zm-danger zm-wide" id="za-out">Keluar</button>' +
      '<button type="button" class="zm-done" id="za-close">Tutup</button>' +
    '</div>';
  document.body.appendChild(el);
  var q = function(id) { return el.querySelector(id); };
  var msg = q('#za-msg'), box = q('#za-box'), p1 = q('#za-p1'), p2 = q('#za-p2'), save = q('#za-save');
  q('#za-email').textContent = zAuthEmail() || '(email tidak diketahui)';
  function say(t, err) { msg.textContent = t || ''; msg.className = 'zm-msg' + (err ? ' err' : ''); }
  function close() { if (el.parentNode) el.parentNode.removeChild(el); }
  var boxOpen = false;
  q('#za-pw').addEventListener('click', function() {
    boxOpen = !boxOpen;
    box.style.display = boxOpen ? '' : 'none';
    say('');
  });
  save.addEventListener('click', async function() {
    var a = p1.value || '', b = p2.value || '';
    if (a.length < 8) { say('Password minimal 8 karakter.', true); return; }
    if (a !== b) { say('Password baru dan ulangannya tidak sama.', true); return; }
    save.disabled = true; say('Menyimpan…');
    try {
      await zAuthChangePassword(a);
      p1.value = ''; p2.value = ''; boxOpen = false; box.style.display = 'none';
      say('Password berhasil diganti.');
    } catch (e) { say(e.message || 'Gagal mengganti password.', true); }
    save.disabled = false;
  });
  q('#za-out').addEventListener('click', function() { close(); zAuthConfirmSignOut(); });   // tutup dulu supaya dialog konfirmasi tidak tertutup lembar ini
  q('#za-close').addEventListener('click', close);
}


function _zUnlock() {
  _zLocked = false;
  _zPinClose();
  _zTouchActive();
  if (_zLockEl && _zLockEl.parentNode) _zLockEl.parentNode.removeChild(_zLockEl);
  _zLockEl = null;
  var w = _zLockWaiters; _zLockWaiters = [];
  w.forEach(function(f) { try { f(); } catch (e) {} });
}
function _zLock() {
  if (_zLocked || _zIsEmbed) return;
  _zLocked = true;
  _zShowLockScreen();
}
function _zRunAksi(aksi) {
  if (!aksi) return;
  if (typeof zQuick === 'function') setTimeout(function() { zQuick(aksi); }, 150);
  else { try { sessionStorage.setItem('zenoot_pending_aksi', aksi); } catch (e) {} }   // app.js belum selesai dimuat → dijalankan saat load
}
// Ikon: Face ID (iPhone/iPad), sidik jari (lainnya), keypad PIN — SVG sendiri supaya tidak bergantung font ikon
var _Z_SVG_FACE = '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M16 20h2a2 2 0 0 0 2-2v-2"/><path d="M9 10v1"/><path d="M15 10v1"/><path d="M12 10v3h-.8"/><path d="M9.5 15.5a3.5 3.5 0 0 0 5 0"/></svg>';
var _Z_SVG_FINGER = '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.9 7a8 8 0 0 1 1.1 5v1a6 6 0 0 0 .8 3"/><path d="M8 11a4 4 0 0 1 8 0v1a10 10 0 0 0 2 6"/><path d="M12 11v2a14 14 0 0 0 2.5 8"/><path d="M8 15a18 18 0 0 0 1.8 6"/><path d="M4.9 19a22 22 0 0 1-.9-7v-1a8 8 0 0 1 12-6.95"/></svg>';
var _Z_SVG_PIN = '<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true"><circle cx="6" cy="6" r="1.7"/><circle cx="12" cy="6" r="1.7"/><circle cx="18" cy="6" r="1.7"/><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/><circle cx="6" cy="18" r="1.7"/><circle cx="12" cy="18" r="1.7"/><circle cx="18" cy="18" r="1.7"/></svg>';
var _Z_SVG_DEL = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M12 10l4 4"/><path d="M16 10l-4 4"/></svg>';
function _zIsApple() {
  var ua = (navigator && navigator.userAgent) || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function _zIconSize(svg, n) { return svg.replace('width="38" height="38"', 'width="' + n + '" height="' + n + '"'); }

// ── PIN 6 digit ───────────────────────────────────────────────
// Disimpan sebagai hash PBKDF2-SHA256 + salt acak (bukan PIN-nya). Salah 5x berturut-turut → jeda 30 dtk,
// 60 dtk, 2 mnt, dst. (maks ±16 mnt). Sama seperti Face ID: ini kunci pintu layar di perangkat ini, bukan pengaman data.
var _Z_PIN_KEY = 'zenoot_pin_v1', _Z_PINFAIL_KEY = 'zenoot_pinfail_v1', _Z_PIN_LEN = 6;
function _zPinCfg() {
  try { var o = JSON.parse(localStorage.getItem(_Z_PIN_KEY) || 'null'); if (o && o.hash && o.salt) return o; } catch (e) {}
  return null;
}
function zPinEnabled() { return !!_zPinCfg(); }
async function _zPinDerive(pin, salt, iter) {
  var km = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
  var bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, km, 256);
  return _zB64u(bits);
}
async function zPinSet(pin) {
  var salt = _zRand(16), iter = 120000;
  var hash = await _zPinDerive(pin, salt, iter);
  localStorage.setItem(_Z_PIN_KEY, JSON.stringify({ salt: _zB64u(salt.buffer), hash: hash, iter: iter, at: Date.now() }));
  try { localStorage.removeItem(_Z_PINFAIL_KEY); } catch (e) {}
}
async function zPinCheck(pin) {
  var c = _zPinCfg();
  if (!c) return true;
  var h = await _zPinDerive(pin, new Uint8Array(_zFromB64u(c.salt)), c.iter || 120000);
  return h === c.hash;
}
function _zPinWeak(pin) { return /^(\d)\1+$/.test(pin) || pin === '123456' || pin === '654321' || pin === '012345'; }
function _zPinFailState() { try { return JSON.parse(localStorage.getItem(_Z_PINFAIL_KEY) || 'null') || { n: 0, until: 0 }; } catch (e) { return { n: 0, until: 0 }; } }
function _zPinWait() { var f = _zPinFailState(); return Math.max(0, Math.ceil(((f.until || 0) - Date.now()) / 1000)); }
function _zPinRecordFail() {
  var f = _zPinFailState();
  f.n = (f.n || 0) + 1;
  if (f.n % 5 === 0) f.until = Date.now() + 30000 * Math.pow(2, Math.min(f.n / 5, 6) - 1);
  try { localStorage.setItem(_Z_PINFAIL_KEY, JSON.stringify(f)); } catch (e) {}
  return f;
}
// Satu percobaan PIN lengkap dengan pembatasan percobaan. → { ok, msg }
async function _zPinTry(pin) {
  var w = _zPinWait();
  if (w > 0) return { ok: false, msg: 'Terlalu banyak percobaan. Coba lagi dalam ' + w + ' detik.' };
  if (await zPinCheck(pin)) { try { localStorage.removeItem(_Z_PINFAIL_KEY); } catch (e) {} return { ok: true }; }
  var f = _zPinRecordFail(), w2 = _zPinWait();
  return { ok: false, msg: w2 > 0 ? 'PIN salah. Coba lagi dalam ' + w2 + ' detik.' : 'PIN salah. Sisa percobaan: ' + (5 - (f.n % 5)) };
}

// Layar keypad PIN (dipakai untuk buka kunci dan untuk membuat PIN)
var _zPinCtl = null;
function _zPinClose() {
  if (!_zPinCtl) return;
  var c = _zPinCtl; _zPinCtl = null;
  if (c.el && c.el.parentNode) c.el.parentNode.removeChild(c.el);
  if (c.kd && document.removeEventListener) document.removeEventListener('keydown', c.kd);
}
function _zPinScreen(o) {
  _zPinClose();
  if (!document.getElementById('zenoot-pin-css')) {
    var st = document.createElement('style');
    st.id = 'zenoot-pin-css';
    st.textContent =
      '#zenoot-pin{position:fixed;inset:0;z-index:2147483200;background:#F0EFEB;font-family:var(--f,-apple-system,"Inter",system-ui,sans-serif);color:#2B2B2B;overflow:hidden;-webkit-text-size-adjust:100%}' +
      '#zenoot-pin .zp-wrap{height:100%;max-width:420px;margin:0 auto;box-sizing:border-box;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 30px) 24px calc(env(safe-area-inset-bottom,0px) + 26px)}' +
      '#zenoot-pin .zp-top{display:flex;align-items:center;gap:12px}' +
      '#zenoot-pin .zp-logo{width:44px;height:44px;object-fit:contain;flex:none}' +
      '#zenoot-pin .zp-title{font-size:20px;font-weight:800;letter-spacing:-.3px;line-height:1.1}' +
      '#zenoot-pin .zp-sub{font-size:13px;color:#8A8580;margin-top:2px}' +
      '#zenoot-pin .zp-mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;min-height:110px}' +
      '#zenoot-pin .zp-dots{display:flex;gap:14px}' +
      '#zenoot-pin .zp-dot{width:14px;height:14px;border-radius:50%;border:2px solid #2B2B2B;box-sizing:border-box}' +
      '#zenoot-pin .zp-dot.on{background:#2B2B2B}' +
      '#zenoot-pin .zp-dots.shake{animation:zpshake .35s}' +
      '@keyframes zpshake{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}' +
      '#zenoot-pin .zp-msg{min-height:18px;font-size:12.5px;font-weight:600;color:#e05c4b;padding:0 8px}' +
      '#zenoot-pin .zp-link{border:none;background:none;color:#B5B1AA;font-size:11.5px;font-weight:600;font-family:inherit;cursor:pointer;text-decoration:underline}' +
      '#zenoot-pin .zp-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 18px;justify-items:center}' +
      '#zenoot-pin .zp-k{width:72px;height:72px;padding:0;border-radius:50%;border:1.5px solid #E3E1DA;background:#fff;font-size:26px;font-weight:600;font-family:inherit;color:#2B2B2B;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '#zenoot-pin .zp-k:active{background:#E3E1DA}' +
      '#zenoot-pin .zp-k.zp-ghost{background:none;border-color:transparent;font-size:13px;font-weight:700}' +
      '#zenoot-pin .zp-k.zp-empty{visibility:hidden}';
    document.head.appendChild(st);
  }
  var el = document.createElement('div');
  el.id = 'zenoot-pin';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  var dots = '', i;
  for (i = 0; i < _Z_PIN_LEN; i++) dots += '<span class="zp-dot"></span>';
  var keys = '';
  for (i = 1; i <= 9; i++) keys += '<button type="button" class="zp-k" data-k="' + i + '">' + i + '</button>';
  keys += o.onFace ? '<button type="button" class="zp-k zp-ghost" data-k="face" aria-label="Pakai biometrik">' + _zIconSize(_zIsApple() ? _Z_SVG_FACE : _Z_SVG_FINGER, 30) + '</button>'
        : o.onCancel ? '<button type="button" class="zp-k zp-ghost" data-k="cancel">Batal</button>'
        : '<span class="zp-k zp-empty"></span>';
  keys += '<button type="button" class="zp-k" data-k="0">0</button>' +
          '<button type="button" class="zp-k zp-ghost" data-k="del" aria-label="Hapus">' + _Z_SVG_DEL + '</button>';
  el.innerHTML =
    '<div class="zp-wrap">' +
      '<div class="zp-top"><img class="zp-logo" src="logo.png" alt="zenOt" onerror="this.style.display=\'none\'"><div><div class="zp-title">' + (o.title || 'Masukkan PIN') + '</div><div class="zp-sub">' + (o.sub || '') + '</div></div></div>' +
      '<div class="zp-mid"><div class="zp-dots" id="zp-dots">' + dots + '</div><div class="zp-msg" id="zp-msg" role="alert"></div>' +
        (o.forgot ? '<button type="button" class="zp-link" id="zp-forgot">Lupa PIN? Masuk dengan password</button>' : '') + '</div>' +
      '<div class="zp-pad">' + keys + '</div>' +
    '</div>';
  document.body.appendChild(el);
  var dotEls = el.querySelectorAll('.zp-dot'), msgEl = el.querySelector('#zp-msg'), box = el.querySelector('#zp-dots');
  var pin = '', busy = false;
  function render() { for (var j = 0; j < _Z_PIN_LEN; j++) if (dotEls[j]) dotEls[j].className = 'zp-dot' + (j < pin.length ? ' on' : ''); }
  function setMsg(t) { msgEl.textContent = t || ''; }
  async function press(k) {
    if (busy) return;
    if (k === 'del') { pin = pin.slice(0, -1); render(); return; }
    if (k === 'face') { if (o.onFace) o.onFace(); return; }
    if (k === 'cancel') { if (o.onCancel) o.onCancel(); return; }
    if (!/^\d$/.test(k) || pin.length >= _Z_PIN_LEN) return;
    setMsg(''); pin += k; render();
    if (pin.length < _Z_PIN_LEN) return;
    busy = true;
    var res;
    try { res = await o.onComplete(pin); } catch (e) { res = { ok: false, msg: 'Terjadi kesalahan. Coba lagi.' }; }
    busy = false;
    if (res && res.ok) return;           // pemanggil yang menutup layar ini
    pin = ''; render(); setMsg(res && res.msg);
    if (box) { box.className = 'zp-dots shake'; setTimeout(function() { box.className = 'zp-dots'; }, 400); }
  }
  var btns = el.querySelectorAll('.zp-k');
  for (i = 0; i < btns.length; i++) (function(b) { b.addEventListener('click', function() { press(b.getAttribute('data-k')); }); })(btns[i]);
  if (o.forgot) el.querySelector('#zp-forgot').addEventListener('click', o.forgot);
  var kd = function(e) { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); };
  document.addEventListener('keydown', kd);
  _zPinCtl = { el: el, press: press, kd: kd, setMsg: setMsg };
  return _zPinCtl;
}

// Membuat / mengubah PIN: ketik 2x. done(true) bila tersimpan, done(false) bila dibatalkan.
function _zPinSetup(done) {
  var first = null;
  function stage1(msg) {
    var c = _zPinScreen({ title: 'Buat PIN', sub: '6 digit angka',
      onCancel: function() { _zPinClose(); done(false); },
      onComplete: async function(pin) {
        if (_zPinWeak(pin)) return { ok: false, msg: 'PIN terlalu mudah ditebak. Pilih yang lain.' };
        first = pin; _zPinClose(); stage2(); return { ok: true };
      } });
    if (msg) c.setMsg(msg);
  }
  function stage2() {
    _zPinScreen({ title: 'Ulangi PIN', sub: 'Masukkan PIN yang sama',
      onCancel: function() { _zPinClose(); done(false); },
      onComplete: async function(pin) {
        if (pin !== first) { _zPinClose(); stage1('PIN tidak sama. Ulangi dari awal.'); return { ok: true }; }
        await zPinSet(pin); _zPinClose(); done(true); return { ok: true };
      } });
  }
  stage1();
}

// ── Layar kunci ───────────────────────────────────────────────
function _zShowLockScreen() {
  if (_zLockEl) return;
  if (!document.body) { document.addEventListener('DOMContentLoaded', _zShowLockScreen, { once: true }); return; }
  if (!document.getElementById('zenoot-lock-css')) {
    var st = document.createElement('style');
    st.id = 'zenoot-lock-css';
    st.textContent =
      '#zenoot-lock{position:fixed;inset:0;z-index:2147483100;background:#F0EFEB;font-family:var(--f,-apple-system,"Inter",system-ui,sans-serif);color:#2B2B2B;-webkit-text-size-adjust:100%;overflow:hidden}' +
      '#zenoot-lock .zk-wrap{height:100%;max-width:520px;margin:0 auto;box-sizing:border-box;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 34px) 22px calc(env(safe-area-inset-bottom,0px) + 34px)}' +
      '#zenoot-lock .zk-top{display:flex;align-items:center;gap:12px}' +
      '#zenoot-lock .zk-logo{width:48px;height:48px;object-fit:contain;flex:none}' +
      '#zenoot-lock .zk-title{font-size:20px;font-weight:800;letter-spacing:-.3px;line-height:1.1}' +
      '#zenoot-lock .zk-sub{font-size:13px;color:#8A8580;margin-top:2px}' +
      '#zenoot-lock .zk-mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:0 10px}' +
      '#zenoot-lock .zk-hint{font-size:13px;color:#8A8580}' +
      '#zenoot-lock .zk-err{min-height:18px;font-size:12.5px;font-weight:600;color:#e05c4b}' +
      '#zenoot-lock .zk-bottom{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}' +
      '#zenoot-lock .zk-bottom.zk-solo{justify-content:center}' +
      '#zenoot-lock .zk-pill{flex:1;min-width:0;height:76px;box-sizing:border-box;display:flex;align-items:center;justify-content:space-around;gap:2px;background:#fff;border:1.5px solid #E3E1DA;border-radius:999px;padding:0 12px}' +
      '#zenoot-lock .zk-q{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:5px;border:none;background:none;font-family:inherit;font-size:10.5px;font-weight:700;line-height:1.15;color:#2B2B2B;cursor:pointer;padding:4px 2px;-webkit-tap-highlight-color:transparent}' +
      '#zenoot-lock .zk-q:active{opacity:.55}' +
      '#zenoot-lock .zk-q i{font-size:26px}' +
      '#zenoot-lock .zk-q-out i{color:#e05c4b}#zenoot-lock .zk-q-gdg i{color:#3ecf6a}' +
      '#zenoot-lock .zk-main{display:flex;flex-direction:column;align-items:center;gap:7px;flex:none}' +
      '#zenoot-lock .zk-btn{width:76px;height:76px;border:none;border-radius:50%;background:#2B2B2B;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '#zenoot-lock .zk-btn:active{transform:scale(.96)}' +
      '#zenoot-lock .zk-btn:disabled{opacity:.55;cursor:default}' +
      '#zenoot-lock .zk-lbl{font-size:13px;font-weight:600}' +
      '#zenoot-lock .zk-link{margin-top:10px;border:none;background:none;color:#B5B1AA;font-size:11.5px;font-weight:600;font-family:inherit;cursor:pointer;text-decoration:underline}' +
      '#zenoot-lock .zk-link.zk-alt{color:#2B2B2B;font-size:13px}';
    document.head.appendChild(st);
  }
  var face = zFaceEnabled(), pinOn = zPinEnabled();
  var showQ = !!document.getElementById('page-dashboard');   // pintasan hanya di halaman utama app (bukan analisis.html)
  var ov = document.createElement('div');
  ov.id = 'zenoot-lock';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.innerHTML =
    '<div class="zk-wrap">' +
      '<div class="zk-top">' +
        '<img class="zk-logo" src="logo.png" alt="zenOt" onerror="this.style.display=\'none\'">' +
        '<div><div class="zk-title">zenOt</div><div class="zk-sub">Terkunci</div></div>' +
      '</div>' +
      '<div class="zk-mid"><div class="zk-hint">' + (face ? 'Ketuk tombol untuk membuka' : 'Ketuk tombol untuk memasukkan PIN') + '</div><div class="zk-err" id="zk-err" role="alert"></div>' +
        (face && pinOn ? '<button type="button" class="zk-link zk-alt" id="zk-usepin">Pakai PIN</button>' : '') +
        '<button type="button" class="zk-link" id="zk-pw">Masuk dengan password</button></div>' +
      '<div class="zk-bottom' + (showQ ? '' : ' zk-solo') + '">' +
        (showQ ?
          '<div class="zk-pill">' +
            '<button type="button" class="zk-q zk-q-jp" data-aksi="penjualan"><i class="ti ti-shopping-cart-plus"></i><span>Penjualan</span></button>' +
            '<button type="button" class="zk-q zk-q-out" data-aksi="kas-keluar"><i class="ti ti-arrow-up-right"></i><span>Uang Keluar</span></button>' +
            '<button type="button" class="zk-q zk-q-gdg" data-aksi="gadag-pendapatan"><i class="ti ti-coin"></i><span>Gadag</span></button>' +
          '</div>' : '') +
        '<div class="zk-main"><button type="button" class="zk-btn" id="zk-btn" aria-label="Buka kunci">' + (face ? (_zIsApple() ? _Z_SVG_FACE : _Z_SVG_FINGER) : _Z_SVG_PIN) + '</button><div class="zk-lbl">Buka</div></div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);
  _zLockEl = ov;
  var btn = ov.querySelector('#zk-btn'), errEl = ov.querySelector('#zk-err'), pw = ov.querySelector('#zk-pw');
  var busy = false;
  function goPassword() {
    var go = function() { zAuthSignOut(); };   // keluar → layar login → setelah masuk langsung terbuka (flag zenoot_pw_unlock)
    if (typeof zConfirm === 'function') Promise.resolve(zConfirm('Keluar lalu masuk dengan password?', { ok: 'Lanjut' })).then(function(ok) { if (ok) go(); });
    else go();
  }
  // aksi (opsional) = pintasan yang diketuk: buka kunci dulu, setelah lolos langsung buka formnya
  function openPin(aksi) {
    _zPinScreen({ title: 'Masukkan PIN', sub: 'zenOt terkunci',
      onFace: face ? function() { _zPinClose(); attempt(false, aksi); } : null,
      forgot: goPassword,
      onComplete: async function(pin) {
        var r = await _zPinTry(pin);
        if (r.ok) { _zPinClose(); _zUnlock(); _zRunAksi(aksi); }
        return r;
      } });
  }
  async function attempt(auto, aksi) {
    if (!face) { if (!auto || !_zPinCtl) openPin(aksi); return; }   // hanya PIN: langsung keypad
    if (busy) return;
    busy = true; btn.disabled = true; errEl.textContent = '';
    try {
      var ok = await zLockVerify();
      if (ok) { _zUnlock(); _zRunAksi(aksi); return; }
      if (!auto) errEl.textContent = 'Verifikasi gagal. Coba lagi.';
    } catch (e) {
      if (!auto) errEl.textContent = _zLockErr(e);
    }
    busy = false; btn.disabled = false;
  }
  btn.addEventListener('click', function() { attempt(false, null); });
  var qs = ov.querySelectorAll ? ov.querySelectorAll('.zk-q') : [];
  for (var qi = 0; qi < qs.length; qi++) {
    (function(el) { el.addEventListener('click', function() { attempt(false, el.getAttribute('data-aksi')); }); })(qs[qi]);
  }
  if (face && pinOn) ov.querySelector('#zk-usepin').addEventListener('click', function() { openPin(null); });
  pw.addEventListener('click', goPassword);
  setTimeout(function() { attempt(true, null); }, 250);   // Face ID: coba otomatis (Safari bisa menolak tanpa ketukan; tombol tetap ada). Hanya PIN: keypad langsung terbuka.
}

// Saat load: kunci jika aktif, kecuali baru saja aktif di sesi ini (reload) atau baru masuk lewat password
function _zLockInit() {
  var pwFlag = false;
  try { pwFlag = sessionStorage.getItem('zenoot_pw_unlock') === '1'; sessionStorage.removeItem('zenoot_pw_unlock'); } catch (e) {}
  if (_zIsEmbed || !_zSess || !zLockEnabled()) return;
  if (pwFlag || _zActiveAge() < _Z_LOCK_GRACE) { _zTouchActive(); return; }
  _zLock();
}
function _zLockOnReturn() {
  if (_zIsEmbed || !_zSess || _zLocked || !zLockEnabled()) return;
  if (_zActiveAge() > _Z_LOCK_GRACE) _zLock();
}
setInterval(function() { if (!_zLocked && !document.hidden && _zSess && zLockEnabled()) _zTouchActive(); }, 20000);
document.addEventListener('visibilitychange', function() {
  if (document.hidden) { if (!_zLocked && zLockEnabled()) _zTouchActive(); }
  else _zLockOnReturn();
});
window.addEventListener('pageshow', function(e) { if (e && e.persisted) _zLockOnReturn(); });
document.addEventListener('DOMContentLoaded', _zLockRefreshBtn);
if (document.readyState !== 'loading') _zLockRefreshBtn();   // script dimuat belakangan: DOM sudah siap
_zLockInit();

// Kunci ke-dua (self-test) — jalankan di console setelah SQL pengunci database dijalankan:  zAuthSelfTest()
// Mencoba baca tiap tabel pakai anon key SAJA (tanpa login). Hasil yang benar: 0 tabel terbuka.
async function zAuthSelfTest() {
  var tabel = ['beban_operasional','channel_beban','channel_harga','channel_kategori_harga','channel_produk','channel_rekap','channels','cost_jurnal','cost_rate','cost_tukang','gadag_anggaran','gadag_pendapatan','gadag_sku','hpp','hutang','hutang_barang','hutang_bayar','hutang_bon','hutang_bon_item','hutang_pembayaran','hutang_supplier','jurnal','jurnal_penjualan','kas_akun','kas_anggaran','master_bahan','penutupan_periode','produk','restock_supplier','shopee_finance_cache','shopee_tokens','stok','stok_masuk_jurnal'];
  var terbuka = [], aman = [], lain = [];
  for (var i = 0; i < tabel.length; i++) {
    try {
      var r = await _zNativeFetch(SUPABASE_URL + '/rest/v1/' + tabel[i] + '?select=*&limit=1', { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } });
      var j = []; try { j = await r.json(); } catch (e) {}
      if (r.ok && Array.isArray(j) && j.length > 0) terbuka.push(tabel[i]);
      else if (r.ok) lain.push(tabel[i] + ' (kosong/terblokir RLS)');
      else aman.push(tabel[i] + ' [' + r.status + ']');
    } catch (e) { lain.push(tabel[i] + ' (error jaringan)'); }
  }
  console.log(terbuka.length === 0 ? '✅ AMAN: 0 tabel bisa dibaca tanpa login.' : '❌ BOCOR: ' + terbuka.length + ' tabel masih bisa dibaca tanpa login → ' + terbuka.join(', '));
  console.log('Ditolak server:', aman.length, '| Kosong/terblokir:', lain.length);
  return { terbuka: terbuka, ditolak: aman, lain: lain };
}

function _headers(extra) {
  const h = {
    'apikey':        SUPABASE_KEY,
    // Token user kalau sudah login. (Interceptor fetch di atas tetap mengganti/menyegarkan token ini
    // saat request dikirim, jadi aman walau token di sini sudah hampir kedaluwarsa.)
    'Authorization': 'Bearer ' + ((_zSess && _zSess.access_token) || SUPABASE_KEY),
    'Content-Type':  'application/json'
  };
  if (extra) Object.assign(h, extra);
  return h;
}


// ─── DB FUNCTIONS ─────────────────────────────────────────────
async function dbGet(table, filter) {
  filter = filter || '';
  const res  = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?select=*' + filter, {
    headers: _headers()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.hint || 'GET ' + table + ' error ' + res.status);
  return Array.isArray(data) ? data : [];
}

async function dbInsert(table, payload) {
  const res  = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
    method:  'POST',
    headers: _headers({ 'Prefer': 'return=representation' }),
    body:    JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.hint || 'INSERT ' + table + ' error ' + res.status);
  return data;
}

async function dbUpdate(table, id, payload) {
  const res  = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
    method:  'PATCH',
    headers: _headers({ 'Prefer': 'return=representation' }),
    body:    JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.hint || 'UPDATE ' + table + ' error ' + res.status);
  return data;
}

// dbUpdateWhere (7 Sep 2026): PATCH massal berdasarkan filter PostgREST
// bebas (bukan cuma by id) — misal 'sku=eq.LAMA' biar bisa update SEMUA
// baris yang match sekaligus dalam 1 request, gak perlu loop dbUpdate
// per-id. Dipakai buat cascade-update histori (jurnal_penjualan/stok) pas
// SKU/katalog/boss di-rename dari halaman Produk — root cause "Lainnya"
// di dashboard: rename produk dulu cuma nyentuh tabel produk doang, histori
// lama jadi yatim (gak match lagi ke produk terkini).
async function dbUpdateWhere(table, filterQuery, payload) {
  const res  = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + filterQuery, {
    method:  'PATCH',
    headers: _headers({ 'Prefer': 'return=representation' }),
    body:    JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.hint || 'UPDATE ' + table + ' (where) error ' + res.status);
  return data;
}

// pastikan=true → minta baris yang terhapus dikembalikan; kalau 0 baris, LEMPAR error.
// Kenapa perlu: PostgREST balas 2xx walau DELETE tidak menghapus apa-apa (diblokir RLS / id tidak ada),
// jadi tanpa ini kegagalan terlihat seperti sukses ("Hapus tidak jalan" tanpa pesan apa pun).
// Default false → perilaku 35 pemanggil lain tidak berubah.
async function dbDelete(table, id, pastikan) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
    method:  'DELETE',
    headers: _headers(pastikan ? { 'Prefer': 'return=representation' } : null)
  });
  if (!res.ok) {
    let msg = 'DELETE ' + table + ' error ' + res.status;
    try { const d = await res.json(); msg = d.message || d.hint || msg; } catch(e) {}
    throw new Error(msg);
  }
  if (pastikan) {
    let rows = [];
    try { rows = await res.json(); } catch(e) {}
    if (!Array.isArray(rows) || !rows.length) {
      throw new Error('Tidak ada baris yang terhapus di tabel ' + table + ' (id ' + id + '). Kemungkinan: diblokir izin/RLS database, atau data sudah tidak ada.');
    }
  }
}


// ─── STATUS DROPSHIP PRODUK (30 Sep 2026) ────────────────────
// Produk dropship = barang tidak disetok (dikirim supplier), jadi Sisa Stok minus itu wajar dan TIDAK boleh
// dianggap kritis / perlu restock. Status dibaca berurutan (dipakai bareng oleh Jurnal, Stok, Dashboard, Re-Stock):
//   1) Boss = supplier "Produksi Sendiri"        → stok dilacak (BUKAN dropship)
//   2) Boss = supplier Dropship saja             → dropship
//   3) Boss = supplier Dropship + Reseller (RH)  → ikut penanda produk.dropship (default mati)
//   4) Boss = Reseller saja / tak terdaftar      → stok dilacak
//   Pengaman: SKU yang sudah punya barang masuk (stok_masuk > 0) selalu dilacak, karena barangnya memang dipegang.
// Perpindahan dropship → produksi sendiri = ganti Boss produk ke DIMI (aturan 1), lalu isi sisa stok di halaman Stok.
var _zDsSup = null, _zDsSupAt = 0;

// Peta supplier: NAMA_UPPERCASE → baris hutang_supplier. Di-cache 60 dtk; gagal baca → peta kosong (semua dianggap stok biasa).
async function zDsLoadSuppliers(force) {
  var now = Date.now();
  if (!force && _zDsSup && (now - _zDsSupAt) < 60000) return _zDsSup;
  try {
    var rows = await dbGet('hutang_supplier');
    var m = {};
    (rows || []).forEach(function(s) { var k = String(s.nama || '').trim().toUpperCase(); if (k) m[k] = s; });
    _zDsSup = m; _zDsSupAt = now;
  } catch (e) {
    console.warn('zDsLoadSuppliers gagal:', e && e.message);
    if (!_zDsSup) _zDsSup = {};
  }
  return _zDsSup;
}

// p = baris produk ({boss, dropship}); supMap = hasil zDsLoadSuppliers(); masuk = stok_masuk SKU itu (opsional)
function zIsDropship(p, supMap, masuk) {
  if (!p) return false;
  if ((Number(masuk) || 0) > 0) return false;
  var s = (supMap || {})[String(p.boss || '').trim().toUpperCase()];
  if (!s) return false;
  if (s.is_produksi_sendiri) return false;
  if (s.is_dropship && !s.is_reseller) return true;
  if (s.is_dropship && s.is_reseller) return p.dropship === true;
  return false;
}

