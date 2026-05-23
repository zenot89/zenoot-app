// ─── NOTIF.JS — Web Push + Local Notification Engine ─────────
// Handles: stok kritis, target jam 16.00, hutang jatuh tempo, sticky note

var NOTIF_VAPID_PUBLIC = ''; // diisi setelah generate VAPID key di Supabase

// ─── 1. MINTA IZIN NOTIFIKASI ────────────────────────────────
async function notifRequestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ─── 2. KIRIM NOTIF LOKAL (tanpa server) ─────────────────────
function notifKirim(title, body, icon, tag) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(function(reg) {
        reg.showNotification(title, {
          body:    body,
          icon:    './icon-192.png',
          badge:   './badge-96.png',
          tag:     tag || 'zenot-notif',
          vibrate: [200, 100, 200],
          data:    { url: './' }
        });
      });
    } else {
      new Notification(title, { body: body, icon: './icon-192.png', tag: tag });
    }
  } catch(e) { console.warn('[NOTIF]', e); }
}

// ─── 3. NOTIF STOK KRITIS / HABIS ────────────────────────────
// Dipanggil setelah load stok data
function notifCekStok(stokData) {
  if (!stokData || !stokData.length) return;
  // Hanya cek produk kategori 'aktif' — skip discontinued, seasonal, clearance
  const dataAktif = stokData.filter(r => !r.kategori_produk || r.kategori_produk === 'aktif');
  const habis  = dataAktif.filter(r => r.sisa <= 0);
  const kritis = dataAktif.filter(r => r.sisa > 0 && r.sisa <= 3);

  if (habis.length > 0) {
    const skus = habis.slice(0,3).map(r => r.sku_variasi).join(', ');
    const more = habis.length > 3 ? ` +${habis.length-3} lainnya` : '';
    notifKirim(
      '📦 Stok Habis!',
      skus + more + ' — segera restock!',
      null,
      'zenot-stok-habis'
    );
  } else if (kritis.length > 0) {
    const skus = kritis.slice(0,3).map(r => `${r.sku_variasi} (${r.sisa} pcs)`).join(', ');
    const more = kritis.length > 3 ? ` +${kritis.length-3} lainnya` : '';
    notifKirim(
      '⚠️ Stok Kritis!',
      skus + more,
      null,
      'zenot-stok-kritis'
    );
  }
}

// ─── 4. NOTIF TARGET PENJUALAN JAM 16.00 ─────────────────────
function notifSetupTargetHarian() {
  function cekDanKirim() {
    const now  = new Date();
    const jam  = now.getHours();
    const mnt  = now.getMinutes();
    if (jam !== 16 || mnt > 5) return; // hanya jam 16:00-16:05

    // Cek sudah kirim hari ini
    const hariIni = now.toISOString().split('T')[0];
    const lastKirim = localStorage.getItem('zenot_notif_target_tgl');
    if (lastKirim === hariIni) return;

    // Ambil data dari dashboard
    const targetHarianEl = document.getElementById('d-target-harian');
    const omsetHarianEl  = document.getElementById('d-order-omset');
    if (!targetHarianEl || !omsetHarianEl) return;

    const targetStr = targetHarianEl.textContent.replace(/[^0-9]/g,'');
    const omsetStr  = omsetHarianEl.textContent.replace(/[^0-9]/g,'');
    const target    = parseInt(targetStr) || 0;
    const omset     = parseInt(omsetStr) || 0;

    if (target <= 0) return;

    const pct   = Math.round(omset / target * 100);
    const sisa  = Math.max(0, target - omset);
    const fmtRp = v => fmtRpFull(v);

    let title, body;
    if (pct >= 100) {
      title = '🎉 Target Tercapai!';
      body  = `Omset hari ini ${fmtRp(omset)} — target ${fmtRp(target)} sudah terlewati!`;
    } else if (pct >= 70) {
      title = '📈 Hampir Tercapai!';
      body  = `${pct}% tercapai — sisa ${fmtRp(sisa)} lagi untuk hit target hari ini`;
    } else {
      title = '💰 Update Target Harian';
      body  = `Baru ${pct}% (${fmtRp(omset)}) — sisa ${fmtRp(sisa)} dari target ${fmtRp(target)}`;
    }

    notifKirim(title, body, null, 'zenot-target-harian');
    localStorage.setItem('zenot_notif_target_tgl', hariIni);
  }

  // Cek setiap menit — pause otomatis saat tab tidak aktif (hemat baterai)
  let _notifInterval = setInterval(cekDanKirim, 60 * 1000);
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      clearInterval(_notifInterval);
      _notifInterval = null;
    } else {
      if (_notifInterval) clearInterval(_notifInterval); // clear dulu jika ada sisa
      cekDanKirim(); // cek langsung saat tab aktif lagi
      _notifInterval = setInterval(cekDanKirim, 60 * 1000);
    }
  });
  // Langsung cek saat load
  cekDanKirim();
}

// ─── 5. NOTIF HUTANG JATUH TEMPO ─────────────────────────────
async function notifCekHutang() {
  try {
    const hutang = await dbGet('hutang');
    const bayar  = await dbGet('hutang_bayar');
    if (!hutang || !hutang.length) return;

    const today = new Date();
    today.setHours(0,0,0,0);
    const H3    = new Date(today); H3.setDate(H3.getDate() + 3);
    const H7    = new Date(today); H7.setDate(H7.getDate() + 7);

    const hariIni = today.toISOString().split('T')[0];
    const lastCek = localStorage.getItem('zenot_notif_hutang_tgl');
    if (lastCek === hariIni) return;

    const bayarMap = {};
    (bayar||[]).forEach(b => {
      if (!bayarMap[b.hutang_id]) bayarMap[b.hutang_id] = 0;
      bayarMap[b.hutang_id] += (b.nominal||0);
    });

    hutang.forEach(h => {
      if (!h.jatuh_tempo) return;
      const sisa = (h.pokok||0) - (bayarMap[h.id]||0);
      if (sisa <= 0) return; // sudah lunas

      const jt   = new Date(h.jatuh_tempo);
      jt.setHours(0,0,0,0);
      const diffMs   = jt - today;
      const diffHari = Math.round(diffMs / (1000*60*60*24));
      const fmtRp    = v => 'Rp' + v.toLocaleString('id-ID');

      if (diffHari < 0) {
        notifKirim(
          '🔴 Hutang Jatuh Tempo Terlewat!',
          `${h.kreditur} — sudah ${Math.abs(diffHari)} hari lewat! Sisa ${fmtRp(sisa)}`,
          null, `zenot-hutang-${h.id}`
        );
      } else if (diffHari <= 3) {
        notifKirim(
          '⚠️ Hutang Jatuh Tempo H-'+diffHari,
          `${h.kreditur} — ${diffHari===0?'hari ini!':diffHari+' hari lagi'} | Cicilan ${fmtRp(h.cicilan_per_bulan||sisa)}`,
          null, `zenot-hutang-${h.id}`
        );
      } else if (diffHari <= 7) {
        notifKirim(
          '📅 Reminder Cicilan',
          `${h.kreditur} jatuh tempo ${diffHari} hari lagi — ${fmtRp(h.cicilan_per_bulan||0)}/bulan`,
          null, `zenot-hutang-${h.id}`
        );
      }
    });

    localStorage.setItem('zenot_notif_hutang_tgl', hariIni);
  } catch(e) { console.warn('[NOTIF-HUTANG]', e); }
}

// ─── 6. NOTIF STICKY NOTE RESTOCK ────────────────────────────
async function notifCekStickyNote() {
  try {
    // Cek dari database dulu (jika sudah dipindah ke Supabase)
    let notes = [];
    try { notes = await dbGet('sticky_notes') || []; } catch(e) {}

    // Fallback: ambil dari HTML hardcode
    if (!notes.length) {
      const stickyEl = document.getElementById('sticky-note');
      if (stickyEl && stickyEl.textContent.trim()) {
        notes = [{ isi: stickyEl.textContent.trim(), updated_at: new Date().toISOString() }];
      }
    }

    if (!notes.length) return;

    const hariIni = new Date().toISOString().split('T')[0];
    const lastCek = localStorage.getItem('zenot_notif_sticky_tgl');
    if (lastCek === hariIni) return;

    // Kirim notif untuk setiap sticky note aktif
    notes.slice(0,3).forEach((n, i) => {
      setTimeout(() => {
        notifKirim(
          '📌 Reminder Restock',
          n.isi || n.keterangan || 'Ada reminder restock — cek app!',
          null,
          `zenot-sticky-${i}`
        );
      }, i * 2000); // delay 2 detik antar notif
    });

    localStorage.setItem('zenot_notif_sticky_tgl', hariIni);
  } catch(e) { console.warn('[NOTIF-STICKY]', e); }
}

// ─── 7. INIT — jalankan semua saat app dibuka ─────────────────
async function notifInit() {
  const izin = await notifRequestPermission();
  if (!izin) return;

  // Setup scheduler target jam 16.00
  notifSetupTargetHarian();

  // Cek hutang jatuh tempo (1x per hari saat app dibuka)
  notifCekHutang();

  // Cek sticky note (1x per hari)
  notifCekStickyNote();

  // Stok dicek setelah loadStok() selesai — dipatch dari stok.js
  // (lihat patch di bawah)
}

// ─── 8. PATCH stok.js — trigger notif setelah data stok load ──
// Ini override fungsi renderStok agar setelah render, cek notif stok
(function patchStokNotif() {
  var _origRenderStok = window.renderStok;
  window.renderStok = function(data) {
    if (_origRenderStok) _origRenderStok(data);
    if (data && data.length) {
      // Cek 1x per sesi (bukan per hari) agar realtime
      var lastStokNotif = sessionStorage.getItem('zenot_notif_stok_done');
      if (!lastStokNotif) {
        notifCekStok(data);
        sessionStorage.setItem('zenot_notif_stok_done', '1');
      }
    }
  };
})();

// ─── 9. EXPOSE untuk dipanggil manual dari luar ───────────────
window.notifCekStok   = notifCekStok;
window.notifCekHutang = notifCekHutang;
window.notifInit      = notifInit;
