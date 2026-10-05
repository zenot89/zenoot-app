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
function zLockEnabled() { return !!_zLockCfg(); }
function _zTouchActive() { try { sessionStorage.setItem(_Z_ACTIVE_KEY, String(Date.now())); } catch (e) {} }
function _zActiveAge() {
  try { var v = Number(sessionStorage.getItem(_Z_ACTIVE_KEY)); return v ? Date.now() - v : Infinity; } catch (e) { return Infinity; }
}
function _zWaitUnlocked() {
  return _zLocked ? new Promise(function(r) { _zLockWaiters.push(r); }) : Promise.resolve();
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

function _zDlg(msg) {
  if (typeof zAlert === 'function') return Promise.resolve(zAlert(msg));
  alert(msg); return Promise.resolve();
}
function _zLockRefreshBtn() {
  var b = document.getElementById('btn-lock');
  if (!b) return;
  if (!window.PublicKeyCredential) { b.style.display = 'none'; return; }
  var l = b.querySelector('.ni-label');
  if (l) l.textContent = 'Biometrik: ' + (zLockEnabled() ? 'Aktif' : 'Mati');
}
async function zLockToggle() {
  try {
    if (zLockEnabled()) {
      var ok = (typeof zConfirm === 'function') ? await zConfirm('Matikan kunci biometrik di perangkat ini?', { ok: 'Matikan' }) : confirm('Matikan kunci biometrik?');
      if (!ok) return;
      localStorage.removeItem(_Z_LOCK_KEY);
      _zLockRefreshBtn();
      await _zDlg('Kunci biometrik dimatikan.');
    } else {
      await zLockEnable();
      _zLockRefreshBtn();
      await _zDlg('Kunci biometrik aktif. App akan meminta Face ID / sidik jari saat dibuka, dan setelah ditinggal lebih dari 1 menit.');
    }
  } catch (e) { await _zDlg(_zLockErr(e)); }
}

function _zUnlock() {
  _zLocked = false;
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
// Ikon biometrik: Face ID (iPhone/iPad) atau sidik jari (lainnya) — SVG sendiri supaya tidak bergantung font ikon
var _Z_SVG_FACE = '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M16 20h2a2 2 0 0 0 2-2v-2"/><path d="M9 10v1"/><path d="M15 10v1"/><path d="M12 10v3h-.8"/><path d="M9.5 15.5a3.5 3.5 0 0 0 5 0"/></svg>';
var _Z_SVG_FINGER = '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.9 7a8 8 0 0 1 1.1 5v1a6 6 0 0 0 .8 3"/><path d="M8 11a4 4 0 0 1 8 0v1a10 10 0 0 0 2 6"/><path d="M12 11v2a14 14 0 0 0 2.5 8"/><path d="M8 15a18 18 0 0 0 1.8 6"/><path d="M4.9 19a22 22 0 0 1-.9-7v-1a8 8 0 0 1 12-6.95"/></svg>';

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
      '#zenoot-lock .zk-link{margin-top:10px;border:none;background:none;color:#B5B1AA;font-size:11.5px;font-weight:600;font-family:inherit;cursor:pointer;text-decoration:underline}';
    document.head.appendChild(st);
  }
  var ua = (navigator && navigator.userAgent) || '';
  var isApple = /iPad|iPhone|iPod/.test(ua) || (navigator && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
      '<div class="zk-mid"><div class="zk-hint">Ketuk tombol untuk membuka</div><div class="zk-err" id="zk-err" role="alert"></div><button type="button" class="zk-link" id="zk-pw">Masuk dengan password</button></div>' +
      '<div class="zk-bottom' + (showQ ? '' : ' zk-solo') + '">' +
        (showQ ?
          '<div class="zk-pill">' +
            '<button type="button" class="zk-q zk-q-jp" data-aksi="penjualan"><i class="ti ti-shopping-cart-plus"></i><span>Penjualan</span></button>' +
            '<button type="button" class="zk-q zk-q-out" data-aksi="kas-keluar"><i class="ti ti-arrow-up-right"></i><span>Uang Keluar</span></button>' +
            '<button type="button" class="zk-q zk-q-gdg" data-aksi="gadag-pendapatan"><i class="ti ti-coin"></i><span>Gadag</span></button>' +
          '</div>' : '') +
        '<div class="zk-main"><button type="button" class="zk-btn" id="zk-btn" aria-label="Buka kunci">' + (isApple ? _Z_SVG_FACE : _Z_SVG_FINGER) + '</button><div class="zk-lbl">Buka</div></div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);
  _zLockEl = ov;
  var btn = ov.querySelector('#zk-btn'), errEl = ov.querySelector('#zk-err'), pw = ov.querySelector('#zk-pw');
  var busy = false;
  // aksi (opsional) = pintasan yang diketuk: Face ID dulu, setelah lolos langsung buka formnya
  async function attempt(auto, aksi) {
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
  pw.addEventListener('click', function() {
    var go = function() { zAuthSignOut(); };   // keluar → layar login → setelah masuk langsung terbuka (flag zenoot_pw_unlock)
    if (typeof zConfirm === 'function') Promise.resolve(zConfirm('Keluar lalu masuk dengan password?', { ok: 'Lanjut' })).then(function(ok) { if (ok) go(); });
    else go();
  });
  setTimeout(function() { attempt(true, null); }, 250);   // coba otomatis (Safari bisa menolak tanpa ketukan; tombol tetap ada)
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

// _ensureAuth() dipertahankan (dead code, tidak ada pemanggil) — sekarang mengembalikan access token user.
async function _ensureAuth() { return _zGetToken(); }

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

async function _headersAsync(extra) {
  return _headers(extra);
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

async function dbDelete(table, id) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?id=eq.' + id, {
    method:  'DELETE',
    headers: _headers()
  });
  if (!res.ok) {
    let msg = 'DELETE ' + table + ' error ' + res.status;
    try { const d = await res.json(); msg = d.message || d.hint || msg; } catch(e) {}
    throw new Error(msg);
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

