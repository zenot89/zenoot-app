// ─── DIALOG.JS — dialog tema zenOt (krem/putih) pengganti alert()/confirm()/prompt() bawaan browser ───────────────
// Dibuat 29 Sep 2026. Dipakai bareng oleh index.html (zenOt), analisis.html (iframe Zenoot Analisis) & kalkulator-harga-jual.html.
//
// API (semua Promise, gak nge-block halaman):
//   zAlert(pesan, {type, title, ok})            -> Promise<void>
//   zConfirm(pesan, {type, title, ok, cancel, danger}) -> Promise<boolean>   (true = user pilih tombol utama)
//   zPrompt(pesan, nilaiAwal, {title, ok, cancel, placeholder}) -> Promise<string|null>   (null = dibatalkan)
//
// type: 'success' | 'error' | 'warn' | 'info' | 'danger' (danger = tombol utama merah lembut, dipakai buat hapus/kosongkan/putus).
// Kalau type/title/label tombol gak diisi, ditebak otomatis dari isi pesan (mis. "Gagal simpan: ..." -> error, "Hapus ...?" -> danger),
// jadi pemanggil cukup zAlert('...') / zConfirm('...').
//
// window.alert DI-OVERRIDE ke zAlert (non-blocking, antre satu-satu) supaya seluruh alert() lama otomatis tampil pakai dialog tema.
// Konsekuensi: alert() gak lagi menghentikan eksekusi. Semua pemanggil di repo ini cuma `alert(...); return;` / `return alert(...)`
// (sudah dicek), jadi aman. confirm()/prompt() BEDA: hasilnya harus ditunggu, jadi dipanggil eksplisit: `await zConfirm(...)`.
// Versi native tetap disimpan di window._nativeAlert / _nativeConfirm / _nativePrompt buat debugging.
(function () {
  if (window.zDialog) return;

  var COLORS = {
    ink: '#2B2B2B', cream: '#F0EFEB', cream3: '#E8E6E0', line: '#E3E1DA', line2: '#D5D2CA',
    text: '#4A4744', ok: '#2F9E5B', danger: '#C4483A', warn: '#B7791F'
  };

  var ICONS = {
    success: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    error:   '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
    warn:    '<path d="M12 4l9 16H3L12 4z"/><path d="M12 10v4.5M12 17.2v.1"/>',
    info:    '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.1"/>',
    danger:  '<path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.8 12.2h9.4L17.5 7M10 11v5M14 11v5"/>',
    ask:     '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.6a2.5 2.5 0 114 2c-.9.7-1.6 1.1-1.6 2.2M12 17v.1"/>'
  };
  var ICON_COLOR = { success: COLORS.ok, error: COLORS.danger, warn: COLORS.warn, info: COLORS.ink, danger: COLORS.danger, ask: COLORS.ink };
  var TITLES = { success: 'Berhasil', error: 'Gagal', warn: 'Perhatian', info: 'Info', danger: 'Konfirmasi', ask: 'Konfirmasi' };

  // ── CSS (di-inject sekali; semua selector diawali .zdlg- supaya gak bentrok dengan style.css / analisis.html) ──
  function injectCss() {
    if (document.getElementById('zdlg-css')) return;
    var css = [
      '.zdlg-ov{position:fixed;inset:0;z-index:2100000;display:flex;align-items:center;justify-content:center;',
      'padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));',
      'background:rgba(43,43,43,.38);opacity:0;transition:opacity .16s ease;font-family:inherit;-webkit-tap-highlight-color:transparent}',
      '.zdlg-ov.zdlg-in{opacity:1}',
      '.zdlg-card{width:100%;max-width:380px;box-sizing:border-box;background:#FFFFFF;color:' + COLORS.ink + ';border:1px solid ' + COLORS.line + ';',
      'border-radius:16px;box-shadow:0 14px 44px rgba(43,43,43,.20);padding:22px 20px 18px;transform:translateY(8px) scale(.98);transition:transform .16s ease;',
      'max-height:calc(100% - 8px);overflow:auto;text-align:left}',
      '.zdlg-ov.zdlg-in .zdlg-card{transform:none}',
      '.zdlg-head{display:flex;align-items:center;gap:12px;margin-bottom:10px}',
      '.zdlg-ico{flex:0 0 auto;width:40px;height:40px;border-radius:50%;background:' + COLORS.cream + ';display:flex;align-items:center;justify-content:center}',
      '.zdlg-ico svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      '.zdlg-title{font-size:16px;font-weight:700;line-height:1.25;color:' + COLORS.ink + ';margin:0}',
      '.zdlg-msg{font-size:14px;line-height:1.5;color:' + COLORS.text + ';white-space:pre-line;word-break:break-word;margin:0 0 16px}',
      '.zdlg-inp{display:block;width:100%;box-sizing:border-box;margin:0 0 16px;padding:11px 12px;font:inherit;font-size:14px;color:' + COLORS.ink + ';',
      'background:' + COLORS.cream + ';border:1px solid ' + COLORS.line2 + ';border-radius:10px;outline:none}',
      '.zdlg-inp:focus{border-color:' + COLORS.ink + ';background:#fff}',
      '.zdlg-btns{display:flex;gap:10px}',
      '.zdlg-btn{flex:1 1 0;min-height:42px;padding:0 14px;font:inherit;font-size:14px;font-weight:600;border-radius:10px;cursor:pointer;',
      'border:1px solid ' + COLORS.line2 + ';background:#fff;color:' + COLORS.ink + ';transition:background .12s ease,transform .06s ease}',
      '.zdlg-btn:hover{background:' + COLORS.cream + '}',
      '.zdlg-btn:active{transform:scale(.98)}',
      '.zdlg-btn:focus-visible{outline:2px solid ' + COLORS.ink + ';outline-offset:2px}',
      '.zdlg-btn.zdlg-pri{background:' + COLORS.ink + ';border-color:' + COLORS.ink + ';color:' + COLORS.cream + '}',
      '.zdlg-btn.zdlg-pri:hover{background:#000}',
      '.zdlg-btn.zdlg-dng{background:' + COLORS.danger + ';border-color:' + COLORS.danger + ';color:#fff}',
      '.zdlg-btn.zdlg-dng:hover{background:#A93A2E}',
      '@media (prefers-reduced-motion:reduce){.zdlg-ov,.zdlg-card{transition:none}}'
    ].join('');
    var st = document.createElement('style');
    st.id = 'zdlg-css';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  // ── Tebak jenis & label dari isi pesan (dipakai kalau pemanggil gak nentuin) ──
  function guessAlertType(msg) {
    var m = String(msg);
    if (/^\s*(✓|✅)/.test(m)) return 'success';
    if (/gagal|error|tidak bisa|gak bisa/i.test(m)) return 'error';
    if (/wajib|pilih |pilih$|harus|isi |isi$|paste|belum|tidak boleh|lengkapi|selesaikan|masukkan|tidak ada|gak ada|gak nemu|gak kebaca|tidak ditemukan|tidak terbaca|coba lagi|sudah ada|udah ada|semua sku/i.test(m)) return 'warn';
    return 'info';
  }
  function guessConfirmOpts(msg) {
    var m = String(msg).trim();
    if (/^(hapus|kosongkan|putus)/i.test(m)) {
      var ok = /^kosongkan/i.test(m) ? 'Kosongkan' : /^putus/i.test(m) ? 'Putuskan' : 'Hapus';
      return { type: 'danger', title: /^kosongkan/i.test(m) ? 'Kosongkan data?' : /^putus/i.test(m) ? 'Putuskan koneksi?' : 'Hapus data?', ok: ok };
    }
    return { type: 'ask', title: 'Konfirmasi', ok: 'Lanjut' };
  }

  // ── Antrean: satu dialog tampil sekali, sisanya nunggu (alert beruntun gak numpuk) ──
  var queue = [], showing = false;
  function pump() {
    if (showing || !queue.length) return;
    if (!document.body) { document.addEventListener('DOMContentLoaded', pump, { once: true }); return; }
    showing = true;
    var job = queue.shift();
    render(job, function () { showing = false; pump(); });
  }
  function enqueue(job) { queue.push(job); pump(); }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function render(job, done) {
    injectCss();
    var prevFocus = document.activeElement;
    var type = job.type || 'info';
    var ov = el('div', 'zdlg-ov');
    ov.setAttribute('role', 'presentation');
    var card = el('div', 'zdlg-card');
    card.setAttribute('role', job.kind === 'alert' ? 'alertdialog' : 'dialog');
    card.setAttribute('aria-modal', 'true');

    var head = el('div', 'zdlg-head');
    var ico = el('div', 'zdlg-ico', '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[type] || ICONS.info) + '</svg>');
    ico.style.color = ICON_COLOR[type] || COLORS.ink;
    var title = el('h2', 'zdlg-title');
    title.textContent = job.title || TITLES[type] || 'Info';
    title.id = 'zdlg-t' + Date.now();
    card.setAttribute('aria-labelledby', title.id);
    head.appendChild(ico); head.appendChild(title);
    card.appendChild(head);

    var msg = el('p', 'zdlg-msg');
    msg.textContent = job.msg;
    card.appendChild(msg);

    var input = null;
    if (job.kind === 'prompt') {
      input = el('input', 'zdlg-inp');
      input.type = 'text';
      input.value = job.def == null ? '' : String(job.def);
      if (job.placeholder) input.placeholder = job.placeholder;
      input.setAttribute('aria-label', job.msg);
      card.appendChild(input);
    }

    var btns = el('div', 'zdlg-btns');
    var cancelBtn = null;
    if (job.kind !== 'alert') {
      cancelBtn = el('button', 'zdlg-btn');
      cancelBtn.type = 'button';
      cancelBtn.textContent = job.cancel || 'Batal';
      btns.appendChild(cancelBtn);
    }
    var okBtn = el('button', 'zdlg-btn ' + (type === 'danger' ? 'zdlg-dng' : 'zdlg-pri'));
    okBtn.type = 'button';
    okBtn.textContent = job.ok || (job.kind === 'alert' ? 'Oke' : 'Lanjut');
    btns.appendChild(okBtn);
    card.appendChild(btns);
    ov.appendChild(card);

    var closed = false;
    function close(result) {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      ov.classList.remove('zdlg-in');
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 170);
      try { if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true }); } catch (e) {}
      job.resolve(result);
      done();
    }
    function accept() { close(job.kind === 'prompt' ? input.value : job.kind === 'confirm' ? true : undefined); }
    function reject() { close(job.kind === 'prompt' ? null : job.kind === 'confirm' ? false : undefined); }

    function onKey(ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); reject(); return; }
      if (ev.key === 'Enter') {
        var t = ev.target;
        if (t === cancelBtn) return; // biarkan tombol Batal diklik lewat Enter
        ev.preventDefault(); ev.stopPropagation(); accept(); return;
      }
      if (ev.key === 'Tab') { // trap fokus di dalam dialog
        var f = [input, cancelBtn, okBtn].filter(Boolean);
        var i = f.indexOf(document.activeElement);
        ev.preventDefault();
        f[(i + (ev.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    }
    document.addEventListener('keydown', onKey, true);

    okBtn.addEventListener('click', accept);
    if (cancelBtn) cancelBtn.addEventListener('click', reject);
    // tap di luar kartu = batal/tutup (aman buat aksi hapus: batal, bukan lanjut)
    ov.addEventListener('mousedown', function (ev) { if (ev.target === ov) reject(); });

    document.body.appendChild(ov);
    // fokus awal: aksi hapus -> fokus ke Batal (biar Enter gak sengaja menghapus); prompt -> ke input; sisanya tombol utama
    var first = input || (type === 'danger' && cancelBtn ? cancelBtn : okBtn);
    requestAnimationFrame(function () {
      ov.classList.add('zdlg-in');
      try { first.focus({ preventScroll: true }); if (input) input.select(); } catch (e) {}
    });
  }

  function s(v) { return v == null ? '' : String(v); }

  window.zAlert = function (msg, opts) {
    opts = opts || {};
    msg = s(msg);
    var type = opts.type || guessAlertType(msg);
    if (type === 'success') msg = msg.replace(/^\s*(✓|✅)\s*/, ''); // ikon sudah centang
    return new Promise(function (resolve) {
      enqueue({ kind: 'alert', msg: msg, type: type, title: opts.title, ok: opts.ok, resolve: resolve });
    });
  };
  window.zConfirm = function (msg, opts) {
    opts = opts || {};
    msg = s(msg);
    var g = guessConfirmOpts(msg);
    var type = opts.type || (opts.danger ? 'danger' : g.type);
    return new Promise(function (resolve) {
      enqueue({ kind: 'confirm', msg: msg, type: type, title: opts.title || g.title, ok: opts.ok || g.ok, cancel: opts.cancel, resolve: resolve });
    });
  };
  window.zPrompt = function (msg, def, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      enqueue({ kind: 'prompt', msg: s(msg), def: def, type: opts.type || 'ask', title: opts.title || 'Ubah nama', ok: opts.ok || 'Simpan', cancel: opts.cancel, placeholder: opts.placeholder, resolve: resolve });
    });
  };
  window.zDialog = { alert: window.zAlert, confirm: window.zConfirm, prompt: window.zPrompt };

  // Override alert bawaan -> dialog tema. confirm/prompt sengaja TIDAK di-override (harus await, lihat catatan di atas).
  window._nativeAlert = window.alert;
  window._nativeConfirm = window.confirm;
  window._nativePrompt = window.prompt;
  window.alert = function (msg) { window.zAlert(msg); };
})();
