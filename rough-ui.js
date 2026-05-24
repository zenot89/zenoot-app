// ─── ROUGH-UI.JS — sketchy UI renderer pakai Rough.js ────────
// Fix: canvas rough selalu diinsert sebagai firstChild (z-index aman),
//      guard duplikasi ketat, konten HTML selalu tampil di atas canvas.

(function() {
  const INK   = '#e8eaf0';
  const CREAM = '#0f1117';
  const BASE  = { roughness:2.1, bowing:1.6, strokeWidth:1.7, stroke:INK };

  // ── Helper: hapus canvas lama, buat baru, INSERT SEBAGAI FIRST CHILD
  // ── Ini kunci utama fix: canvas rough harus jadi sibling PERTAMA
  // ── agar semua konten HTML setelahnya menang di stacking context
  function _makeRoughCanvas(el, className, w, h) {
    el.querySelectorAll('canvas.' + className).forEach(c => c.remove());
    const cvs = document.createElement('canvas');
    cvs.className = className;
    cvs.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:0;';
    cvs.width  = w;
    cvs.height = h;
    // insertBefore(newNode, firstChild) = prepend — canvas jadi lapisan paling bawah
    el.insertBefore(cvs, el.firstChild);
    return cvs;
  }

  // ── 1. NAV ITEM
  function sketchNavItem(el) {
    if (!el.offsetWidth) return;
    // Hapus canvas lama
    el.querySelectorAll('canvas.rough-nav').forEach(c => c.remove());
    // Tidak gambar rough canvas untuk nav item
    // Tampilan ditangani murni CSS — bersih tanpa garis goyang
  }

  // ── 2. TOMBOL — CSS border saja, tidak perlu rough canvas
  function sketchBtn(el) {
    el.querySelectorAll('canvas.rough-btn').forEach(c => c.remove());
  }

  // ── 3. CARD / METRIC BOX — no rough strokes, CSS shadow handles elevation
  function sketchCard(el) {
    el.querySelectorAll('canvas.rough-card').forEach(c => c.remove());
  }

  // ── 4. DATE PILL — no rough strokes
  function sketchPill(el) {
    el.querySelectorAll('canvas.rough-pill').forEach(c => c.remove());
  }

  // ── Migrasi nav-item lama ke struktur pill baru
  function migrateNavItem(el) {
    if (el.querySelector('.ni-icon')) return;
    const icon = el.querySelector('i');
    const iconClass = icon ? icon.className : 'ti ti-circle';
    const text = el.textContent.replace(/[→]/g,'').trim();
    el.innerHTML = `<span class="ni-icon"><i class="${iconClass}" aria-hidden="true"></i></span><span class="ni-label">${text}</span>`;
  }

  // ── INIT
  function init() {
    if (typeof rough === 'undefined') {
      console.warn('[rough-ui] Rough.js belum dimuat!');
      return;
    }

    document.querySelectorAll('.nav-item').forEach(el => {
      migrateNavItem(el);
      sketchNavItem(el);
    });

    document.querySelectorAll('.btn:not(.ch-mini-btn)').forEach(el => sketchBtn(el));
    document.querySelectorAll('.card, .metric').forEach(el => sketchCard(el));

    const dp = document.getElementById('topbar-date');
    if (dp) sketchPill(dp);

    // Re-sketch nav saat zenot:page
    document.addEventListener('zenot:page', function(e) {
      setTimeout(() => {
        document.querySelectorAll('.nav-item').forEach(el => sketchNavItem(el));
        const activePage = document.getElementById('page-' + e.detail.page);
        if (activePage) rerenderUI(activePage);
      }, 30);
    });

    // Re-sketch saat nav group expand/collapse
    document.querySelectorAll('.nav-group-header').forEach(h => {
      h.addEventListener('click', () => {
        setTimeout(() => {
          document.querySelectorAll('.nav-item').forEach(el => sketchNavItem(el));
        }, 300);
      });
    });
  }

  // rerenderUI — dikosongkan untuk performa (canvas rough tidak digunakan)
  // Semua sketch functions sudah no-op; querySelector loop dihapus agar tidak boros CPU/GPU
  function rerenderUI(root) {
    // Hanya migrate nav-item agar label sidebar tetap benar (ringan, satu kali)
    if (root) root.querySelectorAll('.nav-item').forEach(el => migrateNavItem(el));
  }

  window.rerenderUI = rerenderUI;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 50);
  }
})();
