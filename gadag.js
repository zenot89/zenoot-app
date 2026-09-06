// ─── GADAG.JS — Jahit / Makloon (ongkos per lusin) ────────────
// Tabel: gadag_sku        { id, nama, ongkos_lusin, created_at }
// Tabel: gadag_pendapatan { id, tanggal, sku_id, sku_nama, ongkos_lusin, qty, total, created_at }
// Total per catatan = round(qty / 12 * ongkos_lusin)

let _gdgSkuList        = [];
let _gdgPendapatanList = [];

// ─── FONT "Comic Neue" (tema notebook) — di-load via <link>, bukan @import ──
// @import di tengah <style> block ke-skip diem-diem sama browser (harus baris
// pertama di stylesheet). <link> ga punya batasan itu, dan cukup dipasang sekali.
(function() {
  if (document.getElementById('gdg-font-comic-neue')) return; // udah ada, ga usah dobel
  const link = document.createElement('link');
  link.id   = 'gdg-font-comic-neue';
  link.rel  = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap';
  document.head.appendChild(link);
})();

// ─── HTML ─────────────────────────────────────────────────────
document.getElementById('page-gadag').innerHTML = `
<style>
  .gdg-hero {
    background: linear-gradient(135deg, var(--cream2), var(--cream));
    border: 2px solid var(--ok);
    margin-bottom: 14px;
  }
  .gdg-hero-label {
    font-size: 11px; font-weight: 700; letter-spacing: .5px;
    color: var(--ink3); text-transform: uppercase;
    display: flex; align-items: center; gap: 5px;
  }
  .gdg-hero-value { font-size: 32px; font-weight: 800; color: var(--ok); margin-top: 4px; line-height: 1.1; }
  .gdg-hero-sub   { font-size: 12px; color: var(--ink3); margin-top: 3px; }
  .gdg-minicards { display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:5px; }
  .gdg-minicard.mc-pend { border: 2px solid var(--ok); }
  .gdg-minicard.mc-cost { border: 2px solid var(--danger); }
  .gdg-metrics { display:grid; grid-template-columns:repeat(2,1fr); gap:5px; margin-bottom:5px; }
  @media(max-width:600px){ .gdg-metrics { grid-template-columns:repeat(2,1fr); } }
  .gdg-panel { display:none; }
  .gdg-panel.active { display:block; }

  /* ── Anggaran: list variable (tap & tahan → edit, ganti kolom Aksi) ──
     Poin 3: "garis" divider dashed sebelumnya cuma dekorasi, sekarang
     diganti jadi progress bar realisasi (dual purpose: pemisah antar
     row SEKALIGUS indikator persentase realisasi vs target) — biar
     nggak makan tempat tambahan. */
  .gdg-ang2-row {
    display:flex; flex-direction:column; gap:4px; padding:8px 4px;
    -webkit-user-select:none; user-select:none; -webkit-touch-callout:none;
    touch-action:pan-y; cursor:pointer;
  }
  .gdg-ang2-row:last-child { padding-bottom:4px; }
  .gdg-ang2-row.gdg-ang2-pressing { background:var(--cream2); }
  /* Toggle Mingguan/Bulanan — pill segmented, sejajar tombol Tambah */
  .gdg-ang-periode-toggle { display:flex; border:2px solid var(--gdg-ink,#262220); border-radius:9px; overflow:hidden; }
  .gdg-ang-periode-btn {
    font-family:var(--f); font-size:12px; font-weight:800; letter-spacing:.02em;
    padding:7px 12px; border:none; background:transparent; color:var(--gdg-ink,#262220);
    cursor:pointer; white-space:nowrap;
  }
  .gdg-ang-periode-btn.active { background:var(--gdg-ink,#262220); color:var(--gdg-paper,#f7f2e6); }
  .gdg-ang2-top  { display:flex; align-items:center; gap:8px; }
  .gdg-ang2-idx  { color:var(--ink3); font-weight:700; min-width:20px; }
  .gdg-ang2-nama { flex:1; font-weight:700; }
  .gdg-ang2-nom  { font-weight:700; min-width:78px; text-align:right; }
  .gdg-ang2-tempo { font-size:12px; color:var(--ink3); flex:none; width:56px; text-align:right; padding-right:10px; box-sizing:border-box; }
  /* Header kolom "Variable | Tempo | IDR" — sekarang SELALU tampil (list
     udah terpadu, tempo opsional per-item, gak mode-specific lagi). */
  .gdg-ang2-thead {
    display:flex; align-items:center; gap:8px; padding:4px 4px 6px;
    border-bottom:2px solid var(--gdg-ink,#262220); margin-bottom:4px;
    font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.04em;
    color:var(--ink3);
  }
  .gdg-ang2-th-nama  { flex:1; padding-left:28px; } /* nyocokin lebar .gdg-ang2-idx di row */
  .gdg-ang2-th-tempo { flex:none; width:56px; text-align:right; padding-right:10px; box-sizing:border-box; } /* nyocokin .gdg-ang2-tempo di row, jarak ke IDR jangan mepet */
  .gdg-ang2-th-idr   { flex:none; min-width:78px; text-align:right; }
  .gdg-ang2-bar-wrap {
    display:flex; align-items:center; gap:6px;
    height:6px;
  }
  .gdg-ang2-bar-track {
    flex:1; height:5px; border-radius:3px; overflow:hidden;
    background:var(--gdg-rule, rgba(38,34,32,.15));
  }
  .gdg-ang2-bar-fill { height:100%; border-radius:3px; transition:width .25s ease; }
  .gdg-ang2-bar-pct  { font-size:10px; font-weight:800; min-width:30px; text-align:right; flex:none; }

  /* ── History (Cost per Akun) — halaman penuh (BUKAN bottom-sheet/picker),
     biar stabil & gak "muncul-ilang" kayak versi lama. Dibuka dari tombol
     ikon jam di panel Anggaran (ada di MODE MINGGUAN & BULANAN dua-duanya,
     lihat gdg-ang-hist-btn). Isi: 2 minicard Total Cost/Income + list akun
     Anggaran (Mingguan+Bulanan gabung) dengan total Bulan Ini vs Bulan Lalu,
     toggle-able. Tombol [Pilih] buat "aktifkan" akun baru ke periode
     tempat History ini dibuka (Mingguan→Mingguan, Bulanan→Bulanan). */
  #gdg-histpage-overlay {
    display:none; position:fixed; inset:0; z-index:250;
    background:var(--gdg-paper,#f7f2e6);
    justify-content:center;
  }
  #gdg-histpage-overlay.open { display:flex; }
  #gdg-histpage-page {
    width:100%; max-width:100%; height:100%; height:100dvh;
    background:var(--gdg-paper,#f7f2e6);
    display:flex; flex-direction:column;
    box-sizing:border-box; overflow-x:hidden;
    transform:translateY(100%);
    transition:transform .28s cubic-bezier(.32,.72,0,1);
  }
  #gdg-histpage-overlay.gdg-sheet-in #gdg-histpage-page { transform:translateY(0); }
  .gdg-histpage-header {
    display:flex; align-items:center; gap:10px; flex:none;
    padding:calc(env(safe-area-inset-top,0px) + 10px) 14px 12px;
    border-bottom:2.5px solid var(--gdg-ink,#262220);
  }
  .gdg-histpage-back {
    display:flex; align-items:center; gap:6px; flex:none;
    background:none; border:none; cursor:pointer; padding:4px;
    font-family:inherit; font-size:17px; font-weight:800; color:var(--gdg-ink,#262220);
  }
  .gdg-histpage-back i { font-size:20px; }
  .gdg-histpage-pilih-btn {
    display:flex; align-items:center; gap:4px; margin-left:auto; flex:none;
    font-family:inherit; font-size:13px; font-weight:800;
    padding:8px 12px; border:2px solid var(--gdg-ink,#262220); border-radius:10px;
    background:var(--gdg-ink,#262220); color:var(--gdg-paper,#f7f2e6); cursor:pointer;
  }
  #gdg-histpage-body { flex:1 1 0; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; padding:12px 14px 24px; box-sizing:border-box; }
  .gdg-histpage-toggle {
    display:flex; gap:6px; margin-bottom:12px;
  }
  .gdg-histpage-toggle button {
    flex:1; min-width:0; font-family:inherit; font-size:13px; font-weight:800;
    padding:9px 10px; border:2px solid var(--gdg-ink,#262220); border-radius:10px;
    background:var(--gdg-paper,#f7f2e6); color:var(--gdg-ink,#262220); cursor:pointer;
  }
  .gdg-histpage-toggle button.active { background:var(--gdg-ink,#262220); color:var(--gdg-paper,#f7f2e6); }
  /* wkt-picker: dropdown "minggu-minggu sebelumnya" — cuma dipakai kalau
     History dibuka dari Mingguan & lagi di tab "Minggu Lalu". Native <select>
     biar simpel (opsinya cuma tanggal, gak butuh search/picker custom). */
  #gdg-histpage-wkpicker { width:100%; margin-bottom:12px; box-sizing:border-box;
    font-family:inherit; font-size:13px; font-weight:700; padding:9px 10px;
    border:2px solid var(--gdg-ink,#262220); border-radius:10px;
    background:var(--gdg-paper,#f7f2e6); color:var(--gdg-ink,#262220); }
  .gdg-histpage-cards { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; min-width:0; }
  .gdg-histpage-cards > .card { min-width:0; }
  .gdg-histpage-cards .gdg-hero-value { font-size:17px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .gdg-histpage-cards > .card > div { min-width:0; }
  .gdg-histpage-item {
    padding:12px 2px; border-bottom:1px solid var(--gdg-rule,rgba(38,34,32,.15));
  }
  .gdg-histpage-item:last-child { border-bottom:none; }
  .gdg-histpage-top { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
  .gdg-histpage-nama { font-weight:800; font-size:14px; }
  .gdg-histpage-nom { font-weight:800; font-size:14px; }
  .gdg-histpage-sub { font-size:11.5px; color:var(--ink3); margin-top:2px; }
  @media (min-width:900px) {
    #gdg-histpage-page { max-width:480px; }
  }

  /* Donut chart — minicard kanan (Penyerapan / Cash Available), sama di
     mode Mingguan maupun Bulanan (cuma label teksnya yg beda per mode,
     lihat gdgAngTogglePeriode). Teknik: conic-gradient buat cincinnya,
     ::before nutupin tengahnya jadi lubang donut (warna nyamain kertas
     card biar nyatu), angka % nongol di atas lubang itu. */
  .gdg-donut {
    --pct: 0;
    --donut-color: var(--ok);
    width: 38px; height: 38px; flex: none;
    border-radius: 50%;
    background: conic-gradient(var(--donut-color) calc(var(--pct) * 1%), var(--gdg-rule, rgba(38,34,32,.15)) 0);
    display: flex; align-items: center; justify-content: center;
    position: relative;
    transition: background .25s ease;
  }
  .gdg-donut::before {
    content: '';
    position: absolute; inset: 5px;
    border-radius: 50%;
    background: var(--gdg-paper, #f7f2e6);
  }
  .gdg-donut span {
    position: relative; z-index: 1;
    font-size: 9px; font-weight: 800;
    color: var(--gdg-ink, #262220) !important;
  }

  /* ── Collapse ringkasan (minicard+metrics), pola sama dgn kas-top-bar ── */
  #gdg-top-summary {
    overflow: hidden;
    transition: max-height 0.25s ease, opacity 0.2s ease;
    max-height: 500px;
    opacity: 1;
  }
  #gdg-top-summary.gdg-topbar-collapsed {
    max-height: 0 !important;
    opacity: 0;
    pointer-events: none;
  }
  #gdg-sticky-header { cursor: grab; }

  /* ── Bottom-sheet: modal Tambah Catatan Pendapatan (pola IG comment sheet) ──
     Kenapa: modal center/top-align lama harus "re-center ulang" tiap kali
     keyboard iOS buka/tutup (visual viewport berubah) → itu penyebab modal
     kelihatan "mental"/lompat. Bottom-sheet nempel bottom:0, jadi cuma
     tingginya yg nyusut ngikutin ruang tersisa — ga perlu reposisi ulang.
     Tinggi/posisi aktualnya di-drive JS via window.visualViewport. */
  @media (max-width:900px){
    .gdg-sheet-overlay {
      align-items: flex-end !important;
      padding: 0 !important;
    }
    .gdg-sheet-overlay .gdg-sheet {
      width: 100% !important;
      max-width: 100% !important;
      max-height: 88dvh !important;
      margin: 0 !important;
      border-radius: 18px 18px 0 0 !important;
      padding: 0 !important;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform .28s cubic-bezier(.32,.72,0,1);
    }
    .gdg-sheet-overlay.gdg-sheet-in .gdg-sheet { transform: translateY(0); }
    .gdg-sheet-handle {
      flex: none;
      display: flex; justify-content: center; align-items: center;
      padding: 10px 0 6px; cursor: grab; touch-action: none;
    }
    .gdg-sheet-handle span {
      width: 40px; height: 5px; border-radius: 3px; background: var(--ink3); opacity: .5;
    }
    .gdg-sheet-body {
      overflow-y: auto;
      -webkit-overflow-scrolling: auto;
      overscroll-behavior: contain;
    }
  }

  /* ── Menu navigasi desktop: tab bar mendatar (ganti dropdown lama) ──
     Cuma dipake di layar lebar; mobile tetep pake gdg-page-dots (lihat
     media query max-width:900px di bawah, .gdg-menu-wrap di-hide di sana). */
  .gdg-menu-wrap { display: flex; align-items: center; gap: 20px; }
  .gdg-tab-btn {
    background: none; border: none; border-bottom: 2px solid transparent;
    padding: 4px 1px 8px; font-family: var(--f); font-size: 13px; font-weight: 700;
    color: var(--gdg-paper, inherit); opacity: .6; cursor: pointer;
    white-space: nowrap; transition: opacity .15s ease, border-color .15s ease;
  }
  .gdg-tab-btn:hover { opacity: .9; }
  .gdg-tab-btn.active { opacity: 1; color: var(--ok); border-bottom-color: var(--ok); }

  /* ══ TEMA "BUKU TULIS" — khusus block Gadag ══════════════════════
     Font "More Sugar" ga tersedia buat di-embed (font eksklusif Canva),
     jadi dipakai fallback sesuai instruksi: Comic Sans MS (bawaan iOS)
     dengan Comic Neue (versi web-safe/lisensi terbuka dari Google Fonts,
     visualnya mirip) buat platform yg ga punya Comic Sans MS bawaan.
     NOTE: font di-load lewat <link> yg di-inject via JS (lihat bawah file),
     BUKAN @import di sini — @import di tengah <style> block kayak gini
     bakal di-skip diem-diem sama browser (harus jadi baris paling atas). */

  #page-gadag {
    --gdg-paper:   #ECEBE6;   /* kertas krem → off-white hangat (Alabaster/Bone) */
    --gdg-paper2:  #efe8d8;   /* kertas krem, sedikit lebih gelap (buat card ke-2/hover) */
    --gdg-ink:     #262220;   /* tinta pena, hampir hitam */
    --gdg-ink2:    #5c554d;   /* tinta pudar, buat teks sekunder */
    --gdg-rule:    rgba(38,34,32,0.12); /* garis buku ("ruled lines") */
    --gdg-margin:  #d9776f;  /* garis margin merah ala buku tulis */
    --danger: #b5453d;   /* override: merah dark-theme kepucetan di atas kertas krem */
    --info:   #2f6fb0;
    --accent: #8a5a2b;   /* warna aksen tinta coklat, buat nama SKU dsb */
    /* Comic Neue didahulukan (bukan Comic Sans MS) SENGAJA — biar tampilan SAMA
       persis di Android & iPhone. Comic Sans MS cuma bawaan iOS, Android ga punya,
       jadi kalau dia yg didahulukan, Android bakal fallback ke font laen & hasilnya
       beda sama iPhone. Comic Neue kita load sendiri via Google Fonts, jadi
       konsisten di kedua platform. */
    font-family: 'Comic Neue', 'Comic Sans MS', cursive, sans-serif;
  }
  /* KRITIS: banyak class di style.css (.m-value, .metric-value, dst) DAN banyak
     inline style="font-family:var(--f)" di gadag.js sendiri set font-family
     dengan spesifisitas/prioritas yang menang lawan rule di atas. Sapu rata
     pakai universal selector + !important biar BENERAN ke-apply ke semua
     turunan, apapun class/inline style-nya.
     PENGECUALIAN: ikon (<i class="ti ti-...">) WAJIB di-exclude — mereka
     pakai font khusus (tabler-icons) buat nge-render glyph ikon; kalau
     ikut ke-force Comic Neue, ikon berubah jadi kotak/ilang. */
  #page-gadag *:not(i):not(.ti) {
    font-family: 'Comic Neue', 'Comic Sans MS', cursive, sans-serif !important;
  }
  /* Poin 1 (revisi root cause): rule garis buku tulis DULU nempel di
     '#page-gadag .content{...}' — itu SELECTOR MATI, karena .content itu
     ANCESTOR dari #page-gadag (bukan descendant-nya), jadi rule ini ga
     PERNAH ke-apply ke mana pun sejak awal (bukan cuma di 3 halaman yg
     disebut — di SEMUA halaman Gadag, termasuk yg keliatan "ada garis"
     sekalipun, itu garisnya dari border-bottom per-baris, bukan dari sini).
     Card sendiri juga punya background solid opaque, jadi walau selector-nya
     dibenerin & ditaro di .content, garisnya cuma nongol di celah gelap
     ANTAR card — bukan di DALEM list/tabelnya. Fix beneran: taro background
     bergaris LANGSUNG di tiap container list/tabel (lihat rule di bawah,
     digabung sama rule flex-fill yg udah ada) — background-image nempel
     independen dari isi <tbody>, jadi TETAP ada walau 0 baris/kosong. */
  #gdgw-data-area {
    background-image: repeating-linear-gradient(
      to bottom, transparent, transparent 30px, var(--gdg-rule) 30px, var(--gdg-rule) 31px
    );
  }
  #page-gadag .card,
  #page-gadag .gdg-minicard,
  #page-gadag .metric,
  #page-gadag .modal {
    background: var(--gdg-paper) !important;
    color: var(--gdg-ink);
    border: 2.5px solid var(--gdg-ink) !important;
    border-radius: 16px 22px 14px 24px / 22px 14px 24px 16px; /* wobble ala coretan tangan */
    box-shadow: 2px 3px 0 rgba(38,34,32,0.15) !important;
  }
  /* garis margin merah khas buku tulis, nempel di tepi kiri tiap card */
  /* Padding compact: override global card padding biar minicard lebih rapat (ikut referensi mockup) */
  #page-gadag .card, #page-gadag .gdg-minicard { position: relative; padding: 6px 8px 6px 15px !important; }
  /* Root cause jarak minicard renggang: .card global (style.css) bawa
     margin-bottom:12px bawaan. Di dalam grid .gdg-minicards, margin itu NUMPUK
     di atas grid-gap:5px yg udah diset (jadi total ~17px, bukan ~5px kayak
     mockup). .gdg-minicard cuma kepake di dalam grid ini doang (dicek: gapernah
     dipake berdiri sendiri), jadi aman di-nolin marginnya — .card polos lain
     (card section biasa yg BUKAN di dalam grid) TETEP butuh margin-bottom
     buat jarak antar section, makanya sengaja spesifik ke .gdg-minicard aja,
     bukan overwrite .card secara umum. */
  #page-gadag .gdg-minicard { margin: 0 !important; }
  #page-gadag .metric { padding: 6px 8px !important; }
  #page-gadag .card::before, #page-gadag .gdg-minicard::before {
    content: ''; position: absolute; left: 7px; top: 7px; bottom: 7px; width: 2px;
    background: var(--gdg-margin); border-radius: 2px; opacity: .55;
  }
  #page-gadag,
  #page-gadag .card-title,
  #page-gadag .m-label, #page-gadag .m-value, #page-gadag .m-delta,
  #page-gadag th, #page-gadag td,
  #page-gadag label, #page-gadag input, #page-gadag select {
    color: var(--gdg-ink) !important;
    font-family: inherit;
  }
  #page-gadag .m-delta, #page-gadag td[style*="ink3"], #page-gadag span[style*="ink3"] { color: var(--gdg-ink2) !important; }
  #page-gadag input, #page-gadag select {
    background: #fff !important;
    border-color: var(--gdg-ink) !important;
    border-radius: 10px !important;
  }
  #page-gadag .btn {
    font-family: inherit; font-weight: 700;
    border: 2px solid var(--gdg-ink) !important;
    border-radius: 10px !important;
    background: var(--gdg-paper); color: var(--gdg-ink);
    text-transform: uppercase; letter-spacing: .02em;
    /* Poin: user ga suka efek "timbul" (box-shadow + hover-lift dari .btn
       global di style.css). Di-nolin di sini biar jadi garis kotak flat
       doang, nyatu sama background card — bukan kotak melayang. */
    box-shadow: none !important;
    transform: none !important;
  }
  #page-gadag .btn:hover  { background: var(--gdg-paper2) !important; transform: none !important; }
  #page-gadag .btn:active { background: var(--gdg-ink) !important; color: var(--gdg-paper) !important; transform: scale(.97) !important; }
  #page-gadag .btn:active i { color: var(--gdg-paper) !important; }
  /* .btn-primary TETEP solid-fill sengaja (bukan ikut flat) — dipake sebagai
     penanda "chip terpilih/aktif" (mis. tombol mode dropdown), bahasa visual
     yg udah konsisten dipake di tempat lain di app (selected state = isi
     gelap). Yang di-flat-in cuma tombol SEKUNDER (outline biasa). */
  #page-gadag .btn-primary { background: var(--gdg-ink); color: var(--gdg-paper) !important; }
  #page-gadag .btn-primary:hover { background: var(--gdg-ink) !important; }
  #page-gadag .btn-danger  { background: var(--gdg-paper); color: #b5453d; border-color: #b5453d !important; }
  #page-gadag .btn-danger:hover { background: rgba(181,69,61,.08) !important; }
  #page-gadag .gdghist-badge {
    display: inline-flex; align-items: center; gap: 6px;
    border: 2px solid var(--gdg-ink); border-radius: 10px;
    padding: 5px 9px; font-size: 13px; font-weight: 700;
    background: var(--gdg-paper); color: var(--gdg-ink);
    white-space: nowrap; flex: none;
    /* fixed min-width biar kotak tidak resize saat nilai berubah Rp0 → Rp375.000 */
    min-width: 130px; justify-content: flex-start;
  }
  #page-gadag .gdghist-badge i { font-size: 14px; flex: none; }
  /* Kotak tanggal Riwayat — display-only, TIDAK bisa digulir/swipe. Ganti
     periode cuma lewat dropdown gdghist-mode-btn (§ Per Minggu / Per Bulan). */
  #page-gadag .gdghist-datebox {
    flex: 1; min-width: 0;
    border: 2px solid var(--gdg-ink); border-radius: 10px;
    padding: 5px 12px; font-size: 13px; font-weight: 800;
    background: var(--gdg-paper); color: var(--gdg-ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    background: var(--gdg-paper) !important; border: 2.5px solid var(--gdg-ink) !important;
    border-radius: 14px !important;
  }
  #page-gadag .tbl thead th {
    color: var(--gdg-ink2) !important;
    background: transparent !important; box-shadow: none !important;
    border-bottom: 3px solid var(--gdg-ink);
  }
  #page-gadag .tbl tbody tr { border-bottom: 1px solid var(--gdg-rule); }
  #gdgw-week-label { text-transform: uppercase; }
  #page-gadag .gdg-sheet-handle span { background: var(--gdg-ink) !important; opacity: .35; }

  /* ── Export PDF: #gdg-print-area tersembunyi — konten dikirim ke popup window ──
     Pendekatan visibility:hidden/visible + window.print() di halaman yang sama
     tidak reliable di iOS Safari (WebKit strip elemen invisible dari print layout,
     hasilnya blank). Solusi: buka popup window baru berisi full HTML dokumen,
     lalu print dari sana — konsisten di Android & iPhone. */
  #gdg-print-area { display: none; }

  /* ── Penyesuaian khusus layar sempit (HP) ──
     Poin 2: font tabel data DULU malah dikecilin ke 12px di sini — kebalikan
     dari yg diminta. Sekarang dinaikin ke 14px + tegas (font-weight 700), plus
     angka minicard (m-value, hero-value) dinaikin dikit biar bobotnya senada
     sama tabel — bukan kerasa 2 gaya tipografi yg terpisah. Kolom tetap
     sama, cuma isinya lebih jelas; kalau kepanjangan tinggal geser (tbl-wrap
     udah overflow-x:auto + ada shadow indicator di bawah). */
  @media(max-width:480px) {
    .gdg-hero-value { font-size: 24px; }
    .gdg-metrics .m-value { font-size: 18px; line-height: 1.3; }
    #page-gadag .tbl th, #page-gadag .tbl td { font-size: 14px; padding: 8px 6px; font-weight: 700; }
    #page-gadag .tbl td:last-child, #page-gadag .tbl th:last-child { padding-right: 4px; }
    #page-gadag .tbl .btn-sm { min-height: 28px; padding: 0 6px; font-size: 11px; }
    #page-gadag .tbl .btn-sm i { font-size: 12px; }
    /* bayangan tipis di kanan tbl-wrap = penanda "masih bisa di-swipe" */
    #page-gadag .tbl-wrap { position: relative; }
    #page-gadag .tbl-wrap::after {
      content: '';
      position: absolute; top: 0; right: 0; bottom: 0; width: 14px;
      background: linear-gradient(to right, transparent, rgba(0,0,0,.35));
      pointer-events: none;
    }
  }

  /* ═══ FULL-HEIGHT CHAIN — direvisi total, bukan tebakan calc(100dvh-Npx) lagi ═══
     Root cause versi lama: 'gadag' ga terdaftar di fullHeightPages (app.js), jadi
     .content tetap scroll normal (padding 16px, overflow-y:scroll), dan card di
     tiap panel dipaksa min-height pakai angka statis. Angka itu nebak tinggi header
     app + toolbar, padahal beda-beda di Android vs iPhone (address bar, safe-area,
     notch) → selalu nyisa gap hitam kosong di bawah, gedenya beda per device.
     Fix beneran: 'gadag' didaftarin ke fullHeightPages (app.js) biar .content dapet
     height-chain flex yang proper, JS-driven, PERSIS pola yang sudah kepake &
     terbukti stabil di Kas & Jurnal / Stok — bukan pola baru lagi.
     Chain: .content(flex,JS) → #page-gadag → #gdg-panels-wrap(flex:1)
            → .gdg-panel.active → .card → .tbl-wrap / #gdg-ang2-list (scroll internal). */
  #page-gadag.active { display: flex !important; flex-direction: column !important; }
  #page-gadag {
    flex: 1 1 0; min-height: 0; height: 100%;
    padding: 10px; box-sizing: border-box; overflow: hidden;
  }
  #gdg-hdr-row { flex-shrink: 0; }
  #gdg-panels-wrap { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; }

  /* Default: panel yg isinya beberapa card ditumpuk (Ringkasan Mingguan) —
     scroll biasa di panel-nya sendiri, card-card di dalemnya natural height. */
  .gdg-panel { display: none; min-height: 0; }
  .gdg-page-dots { display: none; }
  @media (max-width: 900px) {
    /* Dots pindah ke slot .gdg-menu-wrap (kanan-atas header) yang di-hide di
       mobile — hdr-row masih justify-content:space-between jadi otomatis
       kedorong ke kanan, gak perlu fixed positioning. */
    .gdg-page-dots { display: flex; align-items: center; gap: 6px; flex: none; }
    .gdg-page-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gdg-paper, #f7f2e6); opacity: .35; transition: all .18s ease; cursor: pointer; }
    .gdg-page-dot.active { width: 16px; border-radius: 3px; opacity: 1; background: var(--gdg-paper, #f7f2e6); }
    .gdg-menu-wrap { display: none; }
    /* CATATAN: strip #gdg-swipe-zone (dedicated bottom strip) DIBUANG — kegedean
       resiko meleset (cuma 36px, mepet tepi bawah) & sering rebutan sama
       edge-swipe-back bawaan OS. Swipe sekarang nempel LANGSUNG di area data
       (.tbl-wrap, #gdg-ang2-list, #gdgw-data-area) — target jauh lebih gede,
       udah kebukti aman coexist sama long-press (lihat blok JS SWIPE ANTAR PANEL). */
  }
  .gdg-panel.active { display: flex; flex-direction: column; flex: 1 1 0; min-height: 0; overflow-y: auto; }
  /* Card terakhir di panel mingguan (yang isi Net Income + tabel) ngisi sisa layar */
  #gdg-panel-mingguan.active { display: flex; flex-direction: column; }
  #gdg-panel-mingguan.active > .card:last-child { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; }
  #gdg-panel-mingguan.active > .card:last-child #gdgw-data-area { flex: 1 1 0; min-height: 0; overflow-y: auto; }

  /* Panel isi 1 card utama (Catatan/Riwayat/Kelola Produk/Anggaran) — panelnya
     sendiri jadi flex column TANPA scroll (overflow:hidden), yg scroll internal
     cuma tabel/list di dalem card-nya. Biar ga dobel scrollbar & card-nya beneran
     ngisi penuh sisa layar, ga nyisa ruang kosong di bawah. */
  #gdg-panel-pendapatan.active,
  #gdg-panel-riwayat.active,
  #gdg-panel-sku.active,
  #gdg-panel-anggaran.active {
    display: flex; flex-direction: column; overflow: hidden;
  }
  #gdg-panel-pendapatan .card,
  #gdg-panel-riwayat .card,
  #gdg-panel-sku .card,
  #gdg-panel-anggaran .card {
    flex: 1 1 0; min-height: 0; display: flex; flex-direction: column;
  }
  #gdg-panel-pendapatan .tbl-wrap,
  #gdg-panel-riwayat .tbl-wrap,
  #gdg-panel-sku .tbl-wrap {
    flex: 1 1 0; min-height: 0; overflow-y: auto;
    background-image: repeating-linear-gradient(
      to bottom, transparent, transparent 30px, var(--gdg-rule) 30px, var(--gdg-rule) 31px
    );
  }
  #gdg-panel-anggaran #gdg-ang2-list { flex: 1 1 0; min-height: 0; overflow-y: auto; }

  /* Poin 1 (baru): kertas bergaris — garis horizontal nerus di seluruh isi card
     list (termasuk area kosong di bawah item terakhir), bukan cuma per-baris
     item doang. Ngasih feel "buku tulis" beneran kayak referensi gambar. */
  #gdg-ang2-list {
    background-image: repeating-linear-gradient(
      to bottom, transparent, transparent 37px, var(--gdg-rule) 37px, var(--gdg-rule) 38px
    );
  }

  /* Poin 2: dropdown saran "Warna" bikinan sendiri — gantiin autofill bawaan
     browser yg posisinya ga konsisten (kadang muncul di atas, kepotong status
     bar). Nempel PERSIS di bawah input (position:absolute, top:100%), tinggi
     dibatasin ~5 item lalu scroll kalau lebih. */
  .gdg-warna-dropdown {
    display: none; position: absolute; left: 0; right: 0; top: 100%; margin-top: 4px;
    background: #fff !important; border: 2px solid var(--gdg-ink); border-radius: 10px;
    max-height: 192px; overflow-y: auto; z-index: 60;
    box-shadow: 2px 3px 0 rgba(38,34,32,0.15);
  }
  .gdg-warna-dropdown .gdg-warna-opt {
    padding: 8px 12px; font-size: 14px; cursor: pointer;
    border-bottom: 1px solid var(--gdg-rule); color: var(--gdg-ink) !important;
  }
  .gdg-warna-dropdown .gdg-warna-opt:last-child { border-bottom: none; }
  .gdg-warna-dropdown .gdg-warna-opt:hover,
  .gdg-warna-dropdown .gdg-warna-opt.active { background: var(--gdg-paper2); }

  /* Poin 3: minicard Ringkasan dipersingkat KHUSUS HP — laptop TETAP gaya lama.
     Breakpoint sama persis dgn bottom-sheet (max-width:900px) biar konsisten. */
  .gdg-mobile-only { display: none; }
  @media (max-width: 900px) {
    .gdg-desktop-only { display: none !important; }
    .gdg-mobile-only  { display: block; }
  }
  .gdg-qtylsn-split { display: flex !important; padding: 0 !important; overflow: hidden; }
  .gdg-qtylsn-col { flex: 1; text-align: center; padding: 10px 6px; }
  .gdg-qtylsn-col:first-child { border-right: 2px dashed var(--ink3); }
  .gdg-qtylsn-col .m-value { font-size: 26px !important; font-weight: 900 !important; line-height: 1.1; }

  /* ── Desktop: tabel data font lebih besar dan proper ── */
  @media (min-width: 901px) {
    #page-gadag .tbl th {
      font-size: 13px; padding: 10px 12px; letter-spacing: .03em; text-transform: uppercase;
    }
    #page-gadag .tbl td {
      font-size: 15px; padding: 11px 12px; font-weight: 600;
    }
    #page-gadag .tbl tbody tr:hover { background: rgba(38,34,32,.04); }
    #gdgw-net-value { font-size: 28px !important; }
    #gdgw-net-box { padding: 10px 16px !important; margin: 8px 0 12px !important; }
    /* 4 minicard: hero value lebih besar di desktop */
    .gdg-desktop-only .gdg-hero-value { font-size: 28px; }
    .gdg-desktop-only .gdg-hero-label { font-size: 12px; margin-bottom: 4px; }
    .gdg-desktop-only .gdg-hero-sub   { font-size: 12px; margin-top: 4px; }
  }

  /* Poin 1: judul section (Overview/Anggaran/Riwayat/dst) duduk di atas
     BACKGROUND GELAP bawaan app (di luar area kertas krem), tapi ke-inherit
     warna tinta gelap dari rule "#page-gadag{color:var(--gdg-ink)}" di atas
     → nyaris ga keliatan. Kasih warna terang eksplisit khusus buat baris
     judul ini aja (bukan warna umum #page-gadag, biar isi card tetep ink gelap). */
  #gdg-view-heading, #gdg-view-heading-icon, #gdg-hdr-refresh, #gdg-hdr-export { color: var(--gdg-paper) !important; }

  /* Animasi spin buat tombol refresh pas gdgLoad() lagi jalan (lihat
     gdgHandleRefresh()) — berhenti otomatis pas datanya udah selesai dimuat. */
  @keyframes gdg-spin-kf { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  #gdg-hdr-refresh.gdg-spinning i { display: inline-block; animation: gdg-spin-kf .7s linear infinite; }
</style>

<!-- HEADER: judul + dropdown menu (Catatan Pendapatan / Kelola Produk) -->
<div id="gdg-hdr-row" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:nowrap;gap:8px">
  <div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1 1 auto;flex-wrap:nowrap;overflow:hidden">
    <button id="gdg-hdr-refresh" onclick="gdgHandleRefresh()" title="Refresh" style="flex:none;background:none;border:none;padding:2px;cursor:pointer;font-size:20px;line-height:1;color:var(--gdg-paper,inherit)"><i class="ti ti-refresh"></i></button>
    <button id="gdg-hdr-export" onclick="gdgExportPendapatanPDF()" title="Export PDF" style="display:none;flex:none;background:none;border:none;padding:2px;cursor:pointer;font-size:20px;line-height:1;color:var(--gdg-paper,inherit)"><i class="ti ti-file-download"></i></button>
    <i id="gdg-view-heading-icon" class="ti ti-calendar-week" style="font-size:20px;flex:none"></i>
    <div id="gdg-view-heading" style="font-size:20px;font-weight:800;letter-spacing:.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">Overview</div>
  </div>
  <div class="gdg-menu-wrap" style="flex:none">
    <button id="gdg-menu-item-mingguan" class="gdg-tab-btn" onclick="gdgSelectView('mingguan')">Ringkasan Mingguan</button>
    <button id="gdg-menu-item-pendapatan" class="gdg-tab-btn" onclick="gdgSelectView('pendapatan')">Catatan Pendapatan</button>
    <button id="gdg-menu-item-riwayat" class="gdg-tab-btn" onclick="gdgSelectView('riwayat')">Riwayat</button>
    <button id="gdg-menu-item-sku" class="gdg-tab-btn" onclick="gdgSelectView('sku')">Kelola Produk</button>
    <button id="gdg-menu-item-anggaran" class="gdg-tab-btn" onclick="gdgSelectView('anggaran')">Anggaran</button>
  </div>
  <!-- Dot indikator posisi panel — mobile only, gantiin Menu (di-hide di mobile),
       otomatis kedorong ke kanan lewat justify-content:space-between hdr-row -->
  <div id="gdg-page-dots" class="gdg-page-dots">
    <span class="gdg-page-dot" onclick="gdgSelectView('mingguan')"></span>
    <span class="gdg-page-dot" onclick="gdgSelectView('pendapatan')"></span>
    <span class="gdg-page-dot" onclick="gdgSelectView('riwayat')"></span>
    <span class="gdg-page-dot" onclick="gdgSelectView('sku')"></span>
    <span class="gdg-page-dot" onclick="gdgSelectView('anggaran')"></span>
  </div>
</div>

<!-- Wrapper flex:1 buat semua panel — biar chain height-nya nyambung ke #page-gadag
     (lihat blok CSS "FULL-HEIGHT CHAIN" di atas). Header di atas otomatis kebagian
     ukuran secukupnya (flex-shrink:0), wrapper ini yg ngisi sisa layar. -->
<div id="gdg-panels-wrap">

<!-- PANEL: RINGKASAN MINGGUAN (halaman utama / default) -->
<div id="gdg-panel-mingguan" class="gdg-panel active">

<!-- Wrapper collapsible: 2 minicard + metrics + refresh -->
<div id="gdg-top-summary">

<!-- 4 MINICARD SEJAJAR (DESKTOP) / 2+metrics (MOBILE) -->

<!-- Desktop: 4 card 1 baris — Income, Cost, Qty/Lsn, Net Income -->
<div class="gdg-minicards gdg-desktop-only" style="grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px">
  <div class="card gdg-minicard mc-pend">
    <div class="gdg-hero-label"><i class="ti ti-scissors"></i> Income</div>
    <div class="gdg-hero-value" id="gdg-total-pendapatan" style="color:var(--ok)">Rp0</div>
    <div class="gdg-hero-sub" id="gdg-total-sub">— pcs · — catatan</div>
  </div>
  <div class="card gdg-minicard mc-cost">
    <div class="gdg-hero-label"><i class="ti ti-receipt-2"></i> Cost</div>
    <div class="gdg-hero-value" id="gdg-cost-value" style="color:var(--danger)">Rp0</div>
    <div class="gdg-hero-sub" id="gdg-cost-sub">— (periode ini)</div>
  </div>
  <div class="card gdg-minicard">
    <div class="gdg-hero-label"><i class="ti ti-stack-2"></i> Qty / Lsn</div>
    <div class="gdg-hero-value" id="gdg-metric-qty" style="font-size:26px;display:flex;align-items:baseline;gap:10px;white-space:nowrap">—</div>
    <div class="gdg-hero-sub">pcs, minggu terpilih</div>
  </div>
  <div class="card gdg-minicard" onclick="gdgSelectView('anggaran')" style="cursor:pointer">
    <div class="gdg-hero-label"><i class="ti ti-target"></i> Target</div>
    <div class="gdg-hero-value" id="gdg-metric-target-d" style="font-size:26px">—</div>
    <div class="gdg-hero-sub" id="gdg-metric-target-sub-d">Target: Rp0</div>
    <div class="gdg-hero-sub" id="gdg-metric-target-pct-d" style="margin-top:1px">—</div>
  </div>
</div>

<!-- Mobile: 4 card 2x2 grid — Income, Cost, Qty/Lsn, Target -->
<div class="gdg-mobile-only">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:5px">
  <div class="card gdg-minicard mc-pend">
    <div class="gdg-hero-label"><i class="ti ti-scissors"></i> Income</div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
      <div class="gdg-hero-value" id="gdg-total-pendapatan-m" style="color:var(--ok)">Rp0</div>
      <div class="gdg-donut" id="gdg-income-donut" style="--pct:0;flex-shrink:0"><span id="gdg-income-donut-txt">0%</span></div>
    </div>
  </div>
  <div class="card gdg-minicard mc-cost">
    <div class="gdg-hero-label"><i class="ti ti-receipt-2"></i> Cost</div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
      <div class="gdg-hero-value" id="gdg-cost-value-m" style="color:var(--danger)">Rp0</div>
      <div class="gdg-donut" id="gdg-cost-donut" style="--pct:0;flex-shrink:0"><span id="gdg-cost-donut-txt">0%</span></div>
    </div>
  </div>
  <div class="metric gdg-qtylsn-split" style="margin:0">
    <div class="gdg-qtylsn-col">
      <div class="m-value" id="gdg-metric-qty-num">—</div>
    </div>
    <div class="gdg-qtylsn-col">
      <div class="m-value" id="gdg-metric-lsn-num">—</div>
    </div>
  </div>
  <div class="metric" onclick="gdgSelectView('anggaran')" style="cursor:pointer;margin:0">
    <div class="m-label">Target</div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
      <div class="m-value" id="gdg-metric-target" style="font-size:20px">—</div>
      <div class="gdg-donut" id="gdg-metric-target-donut" style="--pct:0;flex-shrink:0"><span id="gdg-metric-target-donut-txt">0%</span></div>
    </div>
  </div>
</div>
</div>

</div>
<!-- /gdg-top-summary -->

<div class="card">
  <!-- Sticky header: navigator label (read-only) + dropdown mode kanan -->
  <div id="gdg-sticky-header" class="card-title" style="display:flex;align-items:center;justify-content:space-between;gap:6px">
    <span id="gdgw-week-label" style="font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1">—</span>
    <button id="gdgw-chart-toggle-btn" class="btn btn-sm" onclick="gdgWToggleChartView()" title="Lihat sebagai grafik batang" style="flex:none;padding:5px 8px;font-size:12px">
      <i class="ti ti-chart-bar" id="gdgw-chart-toggle-icon"></i>
    </button>
    <!-- Tombol trigger dropdown mode — menu-nya dirender ke body (portal fixed) biar ga ke-clip overflow panel -->
    <button id="gdgw-mode-btn" class="btn btn-sm btn-primary" onclick="gdgWToggleModeMenu(event)" style="flex:none;white-space:nowrap;padding:5px 9px;font-size:12px">
      <span id="gdgw-mode-label">Minggu Ini</span> <i class="ti ti-chevron-down"></i>
    </button>
  </div>

  <!-- Custom date picker — hanya muncul saat mode=custom -->
  <div id="gdgw-custom-range" style="display:none;padding:6px 0 4px;display:none;align-items:center;gap:6px;flex-wrap:wrap">
    <label style="font-size:11px;font-weight:700;color:var(--gdg-ink2);text-transform:uppercase">Dari</label>
    <input type="date" id="gdgw-custom-dari" onchange="gdgWCustomApply()"
      style="font-family:var(--f);font-size:12px;padding:4px 8px;border:2px solid var(--gdg-ink);background:var(--gdg-paper);color:var(--gdg-ink);border-radius:8px;box-sizing:border-box">
    <label style="font-size:11px;font-weight:700;color:var(--gdg-ink2);text-transform:uppercase">Sampai</label>
    <input type="date" id="gdgw-custom-sampai" onchange="gdgWCustomApply()"
      style="font-family:var(--f);font-size:12px;padding:4px 8px;border:2px solid var(--gdg-ink);background:var(--gdg-paper);color:var(--gdg-ink);border-radius:8px;box-sizing:border-box">
  </div>

  <div id="gdgw-net-box" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;margin:6px 0 8px;gap:8px;border:2px solid var(--gdg-ink);border-radius:12px;background:rgba(0,0,0,.02)">
    <div style="font-size:11px;font-weight:700;color:var(--gdg-ink2);text-transform:uppercase;white-space:nowrap">Net Income</div>
    <div id="gdgw-net-value" style="font-size:22px;font-weight:800;color:var(--ok);text-align:right">Rp0</div>
  </div>
  <!-- Tabel harian — disembunyikan saat mode bulan-ini / per-bulan -->
  <div id="gdgw-data-area" class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead><tr>
        <th style="padding:6px 4px">Hari</th>
        <th style="text-align:right;padding:6px 4px">Income</th>
        <th style="text-align:right;padding:6px 4px">Cost</th>
        <th style="text-align:right;padding:6px 4px">Net</th>
      </tr></thead>
      <tbody id="gdgw-harian-tbody">
        <tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
  <!-- Grafik batang Income vs Cost per hari — alternatif tampilan tabel di
       atas, toggle lewat tombol gdgw-chart-toggle-btn. Sama-sama ngikutin
       kondisi perHari (gak dipakai di mode Bulan Ini/Per Bulan). -->
  <div id="gdgw-chart-area" style="display:none">
    <div style="display:flex;gap:14px;align-items:center;justify-content:center;padding:4px 0 8px;font-size:11px;font-weight:700;color:var(--gdg-ink2)">
      <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:var(--ok);display:inline-block"></span> Income</span>
      <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:var(--danger);display:inline-block"></span> Cost</span>
    </div>
    <canvas id="gdgw-daily-chart" style="width:100%;height:220px;display:block"></canvas>
  </div>
  </div>
</div>

<!-- PANEL: CATATAN PENDAPATAN (cuma minggu berjalan — data lama pindah ke Riwayat) -->
<div id="gdg-panel-pendapatan" class="gdg-panel">
<div class="card">
  <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <span id="gdg-pend-count" style="font-size:12px;font-weight:700;color:var(--ink3);text-transform:uppercase">— catatan</span>
    <button class="btn btn-sm btn-primary" onclick="gdgShowPendapatanModal()"><i class="ti ti-plus"></i> Catatan Pendapatan</button>
  </div>
  <div class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>Hari</th><th>SKU</th><th>Warna</th><th style="text-align:right">Qty</th><th style="text-align:right">Total</th></tr></thead>
      <tbody id="gdg-pend-tbody">
        <tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
</div>

</div>

<!-- PANEL: RIWAYAT (semua catatan, sort per Minggu/Bulan — lihat gdgHist* di JS) -->
<div id="gdg-panel-riwayat" class="gdg-panel">
<div class="card">
  <!-- Row 1: sort waktu (KIRI, biar dropdown/submenu anchor konsisten & ga "lompat")
       + nilai IDR (KANAN) -->
  <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;gap:10px">
    <!-- Tombol trigger dropdown mode — menu-nya dirender ke body (portal fixed), sama kayak gdgw-mode-btn -->
    <button id="gdghist-mode-btn" class="btn btn-sm btn-primary" onclick="gdgHistToggleModeMenu(event)" style="flex:none;white-space:nowrap;padding:5px 9px;font-size:12px">
      <span id="gdghist-mode-label">Minggu Ini</span> <i class="ti ti-chevron-down"></i>
    </button>
    <div class="gdghist-badge"><i class="ti ti-wallet"></i><span id="gdghist-total-badge">Rp0</span></div>
  </div>

  <!-- Row 2: kotak tanggal (KIRI, display-only — ganti periode cuma lewat dropdown
       di atas, BUKAN gulir/swipe) + tombol Export PDF (KANAN), seimbang sama row 1 -->
  <div style="display:flex;align-items:center;gap:10px;margin:8px 0 2px">
    <div id="gdghist-range-label" class="gdghist-datebox">—</div>
    <button class="btn btn-sm" onclick="gdgExportRiwayatPDF()" title="Export PDF (s/d hari ini)" style="flex:none;white-space:nowrap">
      <i class="ti ti-file-download"></i> Export PDF
    </button>
  </div>

  <!-- Custom date picker — hanya muncul saat mode=custom -->
  <div id="gdghist-custom-range" style="display:none;padding:6px 0 4px;align-items:center;gap:6px;flex-wrap:wrap">
    <label style="font-size:11px;font-weight:700;color:var(--gdg-ink2);text-transform:uppercase">Dari</label>
    <input type="date" id="gdghist-custom-dari" onchange="gdgHistCustomApply()"
      style="font-family:var(--f);font-size:12px;padding:4px 8px;border:2px solid var(--gdg-ink);background:var(--gdg-paper);color:var(--gdg-ink);border-radius:8px;box-sizing:border-box">
    <label style="font-size:11px;font-weight:700;color:var(--gdg-ink2);text-transform:uppercase">Sampai</label>
    <input type="date" id="gdghist-custom-sampai" onchange="gdgHistCustomApply()"
      style="font-family:var(--f);font-size:12px;padding:4px 8px;border:2px solid var(--gdg-ink);background:var(--gdg-paper);color:var(--gdg-ink);border-radius:8px;box-sizing:border-box">
  </div>

  <div class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>Hari</th><th>SKU</th><th>Warna</th><th style="text-align:right">Qty</th><th style="text-align:right">Total</th></tr></thead>
      <tbody id="gdg-hist-tbody">
        <tr><td colspan="5" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>
    </table>
  </div>
</div>
</div>


<!-- PANEL: KELOLA PRODUK (master SKU & ongkos) -->
<div id="gdg-panel-sku" class="gdg-panel">
<div class="card">
  <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <span id="gdg-sku-count" style="font-size:12px;font-weight:700;color:var(--ink3);text-transform:uppercase">— SKU</span>
    <button class="btn btn-sm btn-primary" onclick="gdgShowSkuModal()"><i class="ti ti-plus"></i> Tambah SKU</button>
  </div>
  <div class="tbl-wrap" style="overflow-x:auto">
    <table class="tbl">
      <thead><tr><th>SKU</th><th style="text-align:right">Ongkos / Lusin (12 pc)</th></tr></thead>
      <tbody id="gdg-sku-tbody">
        <tr><td colspan="2" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>
      </tbody>

    </table>
  </div>
  <div style="font-size:11px;color:var(--ink3);margin-top:6px">Tekan &amp; tahan salah satu SKU buat edit / hapus.</div>
</div>
</div>

<!-- PANEL: ANGGARAN (Variable Mingguan) -->
<div id="gdg-panel-anggaran" class="gdg-panel">
<div class="gdg-metrics" style="margin-bottom:14px">
  <div class="metric">
    <div class="m-label">Net Anggaran</div>
    <div class="m-value" id="gdg-ang2-net">—</div>
    <div class="m-delta" id="gdg-ang2-week-label">—</div>
  </div>
  <div class="metric">
    <div class="m-label" id="gdg-ang2-diserap-label">Penyerapan</div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
      <div class="m-value" id="gdg-ang2-diserap-nilai" style="font-size:22px">—</div>
      <div class="gdg-donut" id="gdg-ang2-diserap-donut" style="--pct:0"><span id="gdg-ang2-diserap-donut-txt">0%</span></div>
    </div>
  </div>
</div>
<div class="card">
  <div class="card-title" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px">
    <span><i class="ti ti-wallet"></i> Variable Anggaran</span>
  </div>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:6px">
      <button id="gdg-ang-tambah-btn" class="btn btn-sm btn-primary" onclick="gdgAngShowAdd()" style="display:none"><i class="ti ti-plus"></i> Tambah</button>
      <button type="button" class="btn btn-sm" id="gdg-ang-hist-btn" onclick="gdgAngHistOpen(_gdgAngPeriodeAktif)" title="History"><i class="ti ti-history"></i></button>
    </div>
    <button type="button" id="gdg-ang-mode-btn" class="btn btn-sm" onclick="gdgAngTogglePeriode()">Mingguan</button>
  </div>
  <div id="gdg-ang2-list">
    <div style="color:var(--ink3);font-style:italic;padding:10px 0">Memuat...</div>
  </div>
  <div style="font-size:11px;color:var(--ink3);margin-top:10px">
    Tekan &amp; tahan salah satu variable buat masuk mode edit / hapus.
  </div>
</div>
</div>

</div><!-- /#gdg-panels-wrap -->

<!-- MODAL: SKU (bottom-sheet, keyboard-safe via visualViewport — disamain
     sama pola "Catatan Pendapatan", 6 Sep 2026. Sengaja DIDUPLIKASI jadi
     fungsi sendiri, bukan digeneralisir/parameterized, ngikutin konvensi
     yang udah ada di file ini (lihat komentar di gdgAngOpenSheet) biar kode
     Pendapatan yang udah proven-stable ga ikut kesenggol. -->
<div class="modal-overlay gdg-sheet-overlay" id="modal-gdg-sku" onclick="gdgOverlayClose(event,'modal-gdg-sku', gdgCloseSkuModal)">
  <div class="modal gdg-sheet" id="gdg-sku-sheet" style="max-width:400px;width:100%;padding:0">
    <div id="gdg-sku-sheet-handle" class="gdg-sheet-handle"><span></span></div>
    <div class="gdg-sheet-body" style="padding:0 16px 16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px" id="gdg-sku-modal-title">
        <i class="ti ti-plus"></i> Tambah SKU
      </div>
      <button onclick="gdgCloseSkuModal()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="gdg-sku-edit-id">
    <div class="form-group" style="margin-bottom:8px">
      <label>Nama SKU / Jahitan</label>
      <input type="text" id="gdg-sku-nama" placeholder="contoh: Daster Batik A"
        style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
    </div>
    <div class="form-group" style="margin-bottom:16px">
      <label>Ongkos / Lusin (Rp, 1 lusin = 12 pc)</label>
      <input type="text" inputmode="numeric" id="gdg-sku-ongkos" placeholder="contoh: 120.000"
        oninput="gdgFormatRibuan(this)"
        style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between">
      <button id="gdg-sku-modal-hapus" class="btn btn-sm btn-danger" onclick="gdgHapusSkuDariModal()" style="display:none">
        <i class="ti ti-trash"></i> Hapus
      </button>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-left:auto">
        <button class="btn" onclick="gdgCloseSkuModal()">Batal</button>
        <button class="btn btn-primary" onclick="gdgSimpanSku()"><i class="ti ti-check"></i> Simpan</button>
      </div>
    </div>
    </div>
  </div>
</div>

<!-- HALAMAN: HISTORY (Cost per Akun Anggaran) — full page (BUKAN bottom-sheet
     lagi), dibuka dari tombol ikon jam di panel Anggaran (mode Mingguan ATAU
     Bulanan dua-duanya). Isi: 2 minicard Total Cost/Income + list akun yang
     ada di Variable Anggaran (Mingguan+Bulanan gabung), total Bulan Ini vs
     Bulan Lalu (toggle). Tombol [Pilih] buat aktifkan akun baru ke periode
     tempat halaman ini dibuka. -->
<div id="gdg-histpage-overlay" onclick="gdgAngHistOverlayClick(event)">
<div id="gdg-histpage-page">
  <div class="gdg-histpage-header">
    <button type="button" class="gdg-histpage-back" onclick="gdgAngHistClose()"><i class="ti ti-chevron-left"></i> History</button>
    <button type="button" class="gdg-histpage-pilih-btn" onclick="gdgAngHistPilihAkun()"><i class="ti ti-plus"></i> Pilih</button>
  </div>
  <div id="gdg-histpage-body">
    <div class="gdg-histpage-toggle">
      <button type="button" id="gdg-histpage-toggle-ini" class="active" onclick="gdgAngHistSetMode(0)">Bulan Ini</button>
      <button type="button" id="gdg-histpage-toggle-lalu" onclick="gdgAngHistSetMode(1)">Bulan Lalu</button>
    </div>
    <select id="gdg-histpage-wkpicker" style="display:none" onchange="gdgAngHistWkPickerChange(this.value)"></select>
    <div class="gdg-histpage-cards">
      <div class="card gdg-minicard mc-cost">
        <div class="gdg-hero-label"><i class="ti ti-receipt-2"></i> Total Cost</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
          <div class="gdg-hero-value" id="gdg-histpage-cost-value" style="color:var(--danger)">Rp0</div>
          <div class="gdg-donut" id="gdg-histpage-cost-donut" style="--pct:0;flex-shrink:0"><span id="gdg-histpage-cost-donut-txt">0%</span></div>
        </div>
      </div>
      <div class="card gdg-minicard mc-pend">
        <div class="gdg-hero-label"><i class="ti ti-scissors"></i> Total Income</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
          <div class="gdg-hero-value" id="gdg-histpage-income-value" style="color:var(--ok)">Rp0</div>
          <div class="gdg-donut" id="gdg-histpage-income-donut" style="--pct:0;flex-shrink:0"><span id="gdg-histpage-income-donut-txt">0%</span></div>
        </div>
      </div>
    </div>
    <div id="gdg-histpage-list">
      <div style="color:var(--ink3);font-style:italic;padding:10px 2px">Memuat...</div>
    </div>
  </div>
</div>
</div>

<!-- MODAL: VARIABLE ANGGARAN (bottom-sheet, konsisten sama Catatan Pendapatan —
     bukan modal "mengambang" di tengah lagi) -->
<div class="modal-overlay gdg-sheet-overlay" id="modal-gdg-ang2" onclick="gdgOverlayClose(event,'modal-gdg-ang2', gdgAngCloseModal)">
  <div class="modal gdg-sheet" id="gdg-ang2-sheet" style="max-width:420px;width:100%;padding:0">
    <div id="gdg-ang2-sheet-handle" class="gdg-sheet-handle"><span></span></div>
    <div class="gdg-sheet-body" style="padding:0 16px 16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:2px dashed var(--ink3)">
      <div class="modal-title" style="margin:0;border:none;padding:0;font-size:18px" id="gdg-ang2-modal-title">
        <i class="ti ti-plus"></i> Tambah Variable
      </div>
      <button onclick="gdgAngCloseModal()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
    </div>
    <input type="hidden" id="gdg-ang2-edit-id">
    <div class="form-group" style="margin-bottom:8px;position:relative">
      <label>Nama (dari Daftar Akun)</label>
      <input type="text" id="gdg-ang2-nama-input" readonly placeholder="— pilih akun —"
        onclick="gdgAngAkunPickerOpen()"
        style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box;cursor:pointer">
    </div>
    <div class="form-group" style="margin-bottom:8px">
      <label>Nominal Bulanan (Rp)</label>
      <input type="text" inputmode="numeric" id="gdg-ang2-nominal-input" placeholder="contoh: 800.000"
        oninput="gdgFormatRibuan(this)"
        style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
      <div style="font-size:11px;color:var(--ink3);margin-top:4px">Ini nominal per bulan. Di tampilan Mingguan otomatis dibagi 4, gak perlu diisi terpisah.</div>
    </div>
    <!-- Jatuh Tempo — OPSIONAL, default OFF, buat tagihan kayak Kontrakan/WiFi.
         Cuma buat DITAMPILIN (badge "tgl X"), BUKAN penggerak status Lunas —
         realisasi/progress tetep dihitung sama rata (bulan kalender berjalan)
         buat semua akun, ada Tempo atau nggak. -->
    <div class="form-group" style="margin-bottom:8px">
      <div class="gdg-ang-periode-toggle" style="width:fit-content">
        <button type="button" id="gdg-ang2-tempo-toggle" class="gdg-ang-periode-btn" onclick="gdgAngModalToggleTempo()"><i class="ti ti-calendar-due"></i> Jatuh Tempo</button>
      </div>
    </div>
    <input type="hidden" id="gdg-ang2-tempo-aktif" value="0">
    <div id="gdg-ang2-bulanan-fields" style="display:none">
      <div class="form-group" style="margin-bottom:16px">
        <label>Jatuh tempo tanggal berapa</label>
        <input type="number" min="1" max="28" id="gdg-ang2-tempo-input" placeholder="contoh: 20"
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between">
      <button id="gdg-ang2-modal-hapus" class="btn btn-sm btn-danger" onclick="gdgAngHapusDariModal()" style="display:none">
        <i class="ti ti-trash"></i> Hapus
      </button>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-left:auto">
        <button class="btn" onclick="gdgAngCloseModal()">Batal</button>
        <button class="btn btn-primary" onclick="gdgAngSimpan()"><i class="ti ti-check"></i> Simpan</button>
      </div>
    </div>
    </div>
  </div>
</div>

<!-- MODAL: CATATAN PENDAPATAN (bottom-sheet, keyboard-safe via visualViewport) -->
<div class="modal-overlay gdg-sheet-overlay" id="modal-gdg-pend" onclick="gdgOverlayClose(event,'modal-gdg-pend', gdgClosePendapatanModal)">
  <div class="modal gdg-sheet" id="gdg-pend-sheet" style="max-width:420px;width:100%;padding:0">
    <div id="gdg-pend-sheet-handle" class="gdg-sheet-handle"><span></span></div>
    <div class="gdg-sheet-body" style="padding:0 16px 16px">
    <div style="margin-bottom:14px;padding-bottom:10px;border-bottom:2px dashed var(--gdg-ink,#262220)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <img src="gadag-icon.png" alt="" style="width:28px;height:28px;object-fit:contain;flex:none">
          <span class="modal-title" style="margin:0;border:none;padding:0;font-size:16px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--gdg-ink,#262220)" id="gdg-pend-modal-title">Catatan Pendapatan</span>
        </div>
        <button onclick="gdgClosePendapatanModal()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--ink3);line-height:1;padding:4px 8px">&#10005;</button>
      </div>
    </div>
    <input type="hidden" id="gdg-pend-edit-id">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
      <div class="form-group">
        <label>Hari</label>
        <input type="text" id="gdg-pend-hari" readonly
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream2);box-sizing:border-box;color:var(--ink2)">
      </div>
      <div class="form-group">
        <label>Tanggal</label>
        <input type="date" id="gdg-pend-tanggal" onchange="gdgUpdateHari()"
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
      </div>
      <div class="form-group" style="position:relative">
        <label>Warna</label>
        <input type="text" id="gdg-pend-warna" name="gdg-warna-custom-nofill" placeholder="contoh: Merah"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true"
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
      </div>
      <div class="form-group">
        <label>SKU</label>
        <input type="text" id="gdg-pend-sku-label" readonly placeholder="— pilih —"
          onclick="gdgSkuPickerOpen()"
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box;cursor:pointer">
        <input type="hidden" id="gdg-pend-sku-id">
        <input type="hidden" id="gdg-pend-sku-ongkos">
        <input type="hidden" id="gdg-pend-sku-nama">
      </div>
      <div class="form-group" style="padding:10px;background:var(--cream2);border:1px dashed var(--ink3);margin:0">
        <label style="font-size:11px;color:var(--ink3)">Total</label>
        <div id="gdg-pend-preview" style="font-size:18px;font-weight:800;color:var(--ok)">Rp0</div>
      </div>
      <div class="form-group">
        <label>Qty (pc)</label>
        <input type="text" inputmode="numeric" id="gdg-pend-qty" placeholder="contoh: 9"
          oninput="gdgRecomputePreview()"
          style="width:100%;font-family:var(--f);font-size:14px;padding:6px 10px;border:2px solid var(--ink);background:var(--cream);box-sizing:border-box">
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between">
      <button id="gdg-pend-modal-hapus" class="btn btn-sm btn-danger" onclick="gdgHapusPendapatanDariModal()" style="display:none">
        <i class="ti ti-trash"></i> Hapus
      </button>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-left:auto">
        <button class="btn" onclick="gdgClosePendapatanModal()">Batal</button>
        <button class="btn btn-primary" onclick="gdgSimpanPendapatan()"><i class="ti ti-check"></i> Simpan</button>
      </div>
    </div>
    </div>
  </div>
</div>

<!-- Area cetak khusus buat Export PDF (Catatan Pendapatan) — normal display:none,
     cuma dimunculin pas mode print lewat CSS @media print di atas -->
<div id="gdg-print-area"></div>
`;

setTimeout(() => { if (typeof rerenderUI === 'function') rerenderUI(document.getElementById('page-gadag')); }, 80);

// ─── SKU PICKER SHEET — inject ke document.body BUKAN ke dalam page-gadag ──
// Alasan: position:fixed di dalam elemen ber-transform (bottom-sheet modal induk)
// pada iOS Safari tidak anchored ke viewport — malah relatif ke transformed ancestor.
// Solusinya: picker dirender langsung di body, di luar semua transform context.
(function _gdgInjectSkuPicker() {
  if (document.getElementById('gdg-sku-picker-overlay')) return;
  const el = document.createElement('div');
  el.id = 'gdg-sku-picker-overlay';
  el.style.cssText = [
    'display:none','position:fixed','inset:0','z-index:9999',
    'background:rgba(0,0,0,.5)',
    'align-items:flex-end','justify-content:center',
  ].join(';');
  el.innerHTML = `
    <div id="gdg-sku-picker-sheet"
      style="width:100%;max-width:480px;background:var(--gdg-paper,#f7f2e6);border-radius:18px 18px 0 0;
             padding:0;box-shadow:0 -4px 24px rgba(0,0,0,.28);
             font-family:'Comic Neue','Comic Sans MS',cursive,sans-serif;
             transform:translateY(100%);transition:transform .28s cubic-bezier(.32,.72,0,1);
             display:flex;flex-direction:column;max-height:72dvh;box-sizing:border-box">
      <!-- Handle -->
      <div style="display:flex;justify-content:center;padding:10px 0 6px;flex:none">
        <span style="width:40px;height:5px;border-radius:3px;background:#262220;opacity:.3;display:block"></span>
      </div>
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:10px;padding:0 16px 12px;flex:none;border-bottom:2px solid #262220">
        <img src="gadag-icon.png" alt="" style="width:32px;height:32px;object-fit:contain;flex:none">
        <span style="font-size:17px;font-weight:800;letter-spacing:.04em;color:#262220;text-transform:uppercase">Pilih Produk</span>
        <button id="gdg-sku-picker-close-btn"
          style="margin-left:auto;background:none;border:none;font-size:22px;cursor:pointer;color:#262220;line-height:1;padding:4px 8px">&#10005;</button>
      </div>
      <!-- Search -->
      <div style="padding:10px 16px 6px;flex:none">
        <div style="display:flex;align-items:center;gap:8px;border:2px solid #262220;border-radius:10px;background:#efe8d8;padding:6px 10px">
          <i class="ti ti-search" style="color:#5c554d;font-size:16px;flex:none"></i>
          <input type="text" id="gdg-sku-picker-search" placeholder="Cari produk..."
            style="border:none;background:transparent;flex:1;font-family:'Comic Neue','Comic Sans MS',cursive,sans-serif;
                   font-size:14px;font-weight:700;color:#262220;outline:none;min-width:0">
        </div>
      </div>
      <!-- List -->
      <div id="gdg-sku-picker-list"
        style="overflow-y:auto;flex:1;padding:4px 0 16px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain">
      </div>
    </div>`;
  document.body.appendChild(el);

  // Tutup saat tap backdrop (overlay) — pakai pointer event, bukan onclick bubbling
  el.addEventListener('pointerdown', function(e) {
    if (e.target === el) gdgSkuPickerClose(true);
  });
  // Tombol ✕
  document.getElementById('gdg-sku-picker-close-btn').addEventListener('click', function() {
    gdgSkuPickerClose(true);
  });
  // Input search
  document.getElementById('gdg-sku-picker-search').addEventListener('input', function() {
    gdgSkuPickerFilter(this.value);
  });
})();

// ═══════════════════════════════════════════════════════════
// SWIPE ANTAR PANEL (mobile only) — nempel LANGSUNG di #gdg-panels-wrap
// (jadi kena juga di area data: .tbl-wrap, #gdg-ang2-list, #gdgw-data-area).
// Dulu sempet diisolasi ke strip kecil #gdg-swipe-zone di bawah layar — dibuang
// karena kegedean resiko meleset (cuma 36px) & rebutan sama edge-swipe-back
// bawaan OS pas mepet tepi bawah, hasilnya kerasa "stuck" gak kena.
//
// Aman coexist sama long-press edit yang udah ada:
//  - Anggaran (#gdg-ang2-list): timer di-cancel di GERAKAN SEKECIL APAPUN.
//  - Catatan & Riwayat (_gdgInitLongPress): timer di-cancel kalau gerak >10px.
//  - Kelola Produk: gak ada gesture, edit/hapus pake tombol tap biasa.
// Threshold swipe kita 40px — jauh di atas 10px itu, jadi long-press SELALU
// udah batal duluan sebelum swipe kepicu, gak akan numpuk dua-duanya.
//
// Guard edge-swipe-back: swipe yg MULAI dari 24px paling tepi kiri/kanan layar
// diabaikan — biar gak berebut sama gesture back bawaan Android/iOS (yang emang
// punya prioritas OS-level di zona itu, percuma dilawan dari JS).
// ═══════════════════════════════════════════════════════════
(function() {
  var wrap = document.getElementById('gdg-panels-wrap');
  if (!wrap) return;
  var ORDER = ['mingguan', 'pendapatan', 'riwayat', 'sku', 'anggaran'];
  var EDGE = 24;
  var startX = 0, startY = 0, startT = 0, tracking = false, isHoriz = null;

  function goRelative(dir) {
    var idx = ORDER.indexOf(_gdgView);
    if (idx === -1) return;
    var next = (idx + dir + ORDER.length) % ORDER.length; // looping: abis panel terakhir balik ke awal, dan sebaliknya
    gdgSelectView(ORDER[next]);
  }

  wrap.addEventListener('touchstart', function(e) {
    var x = e.touches[0].clientX;
    if (x < EDGE || x > window.innerWidth - EDGE) { tracking = false; return; } // biarin OS handle edge-gesture
    startX = x;
    startY = e.touches[0].clientY;
    startT = Date.now();
    tracking = true;
    isHoriz = null;
  }, { passive: true });

  wrap.addEventListener('touchmove', function(e) {
    if (!tracking) return;
    var dx = e.touches[0].clientX - startX;
    var dy = e.touches[0].clientY - startY;
    if (isHoriz === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHoriz = Math.abs(dx) > Math.abs(dy);
    }
    // Gak preventDefault — scroll vertical panel & long-press-cancel tetep jalan normal apa adanya.
  }, { passive: true });

  wrap.addEventListener('touchend', function(e) {
    if (!tracking) return;
    tracking = false;
    if (!isHoriz) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dt = Date.now() - startT;
    var isFlick = Math.abs(dx) / Math.max(dt, 1) > 0.3;
    if (dx < -40 || (isFlick && dx < -20)) goRelative(1);
    else if (dx > 40 || (isFlick && dx > 20)) goRelative(-1);
  }, { passive: true });

  wrap.addEventListener('touchcancel', function() { tracking = false; isHoriz = null; }, { passive: true });
})();

// ─── VIEW SWITCH: dropdown menu (Ringkasan Mingguan / Catatan Pendapatan / Kelola Produk) ──
let _gdgView = 'mingguan';
let _gdgWChartMode = false; // false = tabel, true = grafik batang
let _gdgWDailyData = [];    // [{hariNama, tglLabel, pend, beban}, ...] — diisi tiap gdgWRenderWeek, dipakai chart

const _GDG_VIEW_LABEL = {
  mingguan:   { menu: 'Ringkasan Mingguan', label: 'Ringkasan', heading: 'Overview',      icon: 'ti-calendar-week' },
  pendapatan: { menu: 'Catatan Pendapatan', label: 'Jurnal',    heading: 'Catatan',       icon: 'ti-notes' },
  riwayat:    { menu: 'Riwayat',            label: 'Riwayat',   heading: 'Riwayat',       icon: 'ti-history' },
  sku:        { menu: 'Kelola Produk',      label: 'Kelola Produk', heading: 'Kelola Produk', icon: 'ti-list-details' },
  anggaran:   { menu: 'Anggaran',  label: 'Anggaran',  heading: 'Anggaran',      icon: 'ti-wallet' },
};

function gdgSelectView(view) {
  _gdgView = view;
  gdgApplyView();
}

function gdgApplyView() {
  document.getElementById('gdg-panel-mingguan').classList.toggle('active',   _gdgView === 'mingguan');
  document.getElementById('gdg-panel-pendapatan').classList.toggle('active', _gdgView === 'pendapatan');
  document.getElementById('gdg-panel-riwayat').classList.toggle('active',   _gdgView === 'riwayat');
  document.getElementById('gdg-panel-sku').classList.toggle('active',       _gdgView === 'sku');
  document.getElementById('gdg-panel-anggaran').classList.toggle('active',  _gdgView === 'anggaran');

  document.getElementById('gdg-view-heading').textContent    = _GDG_VIEW_LABEL[_gdgView].heading;
  document.getElementById('gdg-view-heading-icon').className = 'ti ' + _GDG_VIEW_LABEL[_gdgView].icon;
  // Refresh sekarang selalu tampil di baris judul (semua panel, konsisten).
  // Export PDF cuma relevan di panel Catatan.
  const hdrExport  = document.getElementById('gdg-hdr-export');
  if (hdrExport)  hdrExport.style.display  = (_gdgView === 'pendapatan') ? '' : 'none';
  ['mingguan','pendapatan','riwayat','sku','anggaran'].forEach(v => {
    document.getElementById('gdg-menu-item-' + v).classList.toggle('active', v === _gdgView);
  });
  const dotOrder = ['mingguan','pendapatan','riwayat','sku','anggaran'];
  const dotsEl = document.getElementById('gdg-page-dots');
  if (dotsEl) {
    Array.prototype.forEach.call(dotsEl.children, function(dot, i) {
      dot.classList.toggle('active', dotOrder[i] === _gdgView);
    });
  }
  if (_gdgView === 'riwayat' && !_gdgHistWeekStart) gdgHistThisWeek();
  if (_gdgView === 'anggaran') gdgLoadAnggaran();
}

// ─── INIT ─────────────────────────────────────────────────────
function gdgInit() {
  _gdgView = 'mingguan';
  gdgApplyView();
  const tglEl = document.getElementById('gdg-pend-tanggal');
  if (tglEl) {
    const now = new Date();
    tglEl.value = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  }
  gdgLoad();
  gdgWInit();
  gdgLoadAnggaran(); // biar card "Target" di Ringkasan langsung keisi sejak awal
}

// ═══════════════════════════════════════════════════════════════
// RINGKASAN MINGGUAN (lokal di Gadag)
// Pendapatan = dari gadag_pendapatan (bukan tabel global)
// Beban      = dari jurnal + kas_akun, kode 5-xxx KECUALI 5-001 (Beban Gaji)
// ═══════════════════════════════════════════════════════════════
let _gdgWAkunAll   = [];
let _gdgWJurnalAll = [];
let _gdgWWeekStart = null; // Date, Senin 00:00
let _gdgWAkunLoaded = false;

const _GDGW_HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const _GDGW_BLN  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

// Minggu gajian: mulai hari Minggu, berakhir hari Sabtu.
// Kerja hari Minggu ikut kehitung di minggu berikutnya (pembayaran minggu depan).
function gdgWGetMonday(d) {
  const day = d.getDay(); // 0=Minggu..6=Sabtu
  const sun = new Date(d);
  sun.setDate(d.getDate() - day);
  sun.setHours(0,0,0,0);
  return sun;
}
function gdgWToISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function gdgWFmtTgl(d) { return d.getDate() + ' ' + _GDGW_BLN[d.getMonth()] + ' ' + d.getFullYear(); }
// Format ringkas rentang minggu, biar ga makan tempat: "16-22 Ags 26".
// Tahun 2 digit + huruf besar (text-transform:uppercase di CSS) biar sesuai
// konsep referensi ("16-22 AGS 06"). Otomatis nyesuain kalau minggunya
// nyebrang bulan/tahun.
function gdgWFmtRange(start, end) {
  const sameYear  = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const y2 = n => String(n).slice(-2);
  if (sameMonth) {
    return start.getDate() + '-' + end.getDate() + ' ' + _GDGW_BLN[start.getMonth()] + ' ' + y2(start.getFullYear());
  }
  if (sameYear) {
    return start.getDate() + ' ' + _GDGW_BLN[start.getMonth()] + ' - ' + end.getDate() + ' ' + _GDGW_BLN[end.getMonth()] + ' ' + y2(start.getFullYear());
  }
  return gdgWFmtTgl(start) + ' - ' + gdgWFmtTgl(end);
}
function gdgWFmt(n) {
  const v = Number(n)||0;
  return (v < 0 ? '-Rp' : 'Rp') + Math.round(Math.abs(v)).toLocaleString('id-ID');
}

// ─── MODE SYSTEM: minggu-ini / per-minggu / bulan-ini / per-bulan / custom ──
let _gdgWMode        = 'minggu-ini'; // mode aktif
let _gdgWCustomDari  = null;         // Date, custom range start
let _gdgWCustomSampai = null;        // Date, custom range end
// _gdgWWeekStart sudah ada: dipakai per-minggu & minggu-ini
// _gdgWBulanRef: Date objek referensi bulan (per-bulan)
let _gdgWBulanRef    = null;

const _GDGW_MODE_LABELS = {
  'minggu-ini': 'Minggu Ini',
  'per-minggu': 'Per Minggu',
  'bulan-ini':  'Bulan Ini',
  'per-bulan':  'Per Bulan',
  'custom':     'Custom',
};

// ─── DROPDOWN MODE MENU — portal ke body (position:fixed) biar ga ke-clip overflow panel ──
function _gdgWEnsureModeMenu() {
  if (document.getElementById('gdgw-mode-menu')) return;
  const menu = document.createElement('div');
  menu.id = 'gdgw-mode-menu';
  menu.style.cssText = [
    'display:none',
    'position:fixed',
    'z-index:9999',
    'background:var(--gdg-paper,#f7f2e6)',
    'border:2.5px solid var(--gdg-ink,#262220)',
    'border-radius:14px',
    'min-width:160px',
    'box-shadow:2px 4px 12px rgba(0,0,0,.28)',
    'overflow:hidden',
    "font-family:'Comic Neue','Comic Sans MS',cursive,sans-serif",
  ].join(';');
  const opts = [
    ['minggu-ini', 'Minggu Ini',  true,  false],
    ['per-minggu', 'Per Minggu',  false, true],   // punya sub
    ['bulan-ini',  'Bulan Ini',   false, false],
    ['per-bulan',  'Per Bulan',   false, true],   // punya sub
    ['custom',     'Custom',      false, false],
  ];
  opts.forEach(([mode, label, active, hasSub]) => {
    const btn = document.createElement('button');
    btn.id = 'gdgw-opt-' + mode;
    btn.style.cssText = [
      'display:flex','align-items:center','justify-content:space-between',
      'width:100%','text-align:left',
      'padding:10px 14px','background:none','border:none',
      'border-bottom:1px solid rgba(38,34,32,.1)',
      'font-size:13px','font-weight:700','cursor:pointer',
      "color:var(--gdg-ink,#262220)",
      "font-family:'Comic Neue','Comic Sans MS',cursive,sans-serif",
    ].join(';');
    if (active) btn.classList.add('active');

    const span = document.createElement('span');
    span.textContent = label;
    btn.appendChild(span);

    if (hasSub) {
      // Arrow ▸ indikator punya submenu
      const arrow = document.createElement('span');
      arrow.textContent = '▸';
      arrow.style.cssText = 'font-size:10px;opacity:.55;margin-left:6px;flex:none';
      btn.appendChild(arrow);
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); _gdgWOpenSubMenu(mode, btn); });
    } else {
      btn.addEventListener('click', () => gdgWSetMode(mode));
    }
    menu.appendChild(btn);
  });
  // Hapus border-bottom dari item terakhir
  const last = menu.querySelector('button:last-child');
  if (last) last.style.borderBottom = 'none';
  document.body.appendChild(menu);
}

// ─── SUB-MENU: pilihan minggu/bulan spesifik ──
let _gdgWSubMenuOpen = null; // mode yang sub-menu-nya lagi terbuka

function _gdgWOpenSubMenu(mode, triggerBtn) {
  // Kalau sub-menu sama sudah terbuka → tutup
  if (_gdgWSubMenuOpen === mode) { _gdgWCloseSubMenu(); return; }
  _gdgWCloseSubMenu();
  _gdgWSubMenuOpen = mode;

  const sub = document.createElement('div');
  sub.id = 'gdgw-sub-menu';
  sub.style.cssText = [
    'position:fixed',
    'z-index:10000',
    'background:var(--gdg-paper,#f7f2e6)',
    'border:2.5px solid var(--gdg-ink,#262220)',
    'border-radius:14px',
    'min-width:160px',
    'max-height:260px',
    'overflow-y:auto',
    'box-shadow:4px 6px 14px rgba(0,0,0,.32)',
    "font-family:'Comic Neue','Comic Sans MS',cursive,sans-serif",
  ].join(';');

  const items = [];
  const now = new Date();

  if (mode === 'per-minggu') {
    // Tampilkan 8 minggu terakhir (termasuk minggu ini)
    for (let i = 0; i < 8; i++) {
      const ws = gdgWGetMonday(new Date());
      ws.setDate(ws.getDate() - i * 7);
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      const label = (i === 0 ? '▸ ' : '') + gdgWFmtRange(ws, we);
      items.push({ label, ws: new Date(ws), we });
    }
  } else if (mode === 'per-bulan') {
    // Tampilkan 8 bulan terakhir (termasuk bulan ini)
    for (let i = 0; i < 8; i++) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = (i === 0 ? '▸ ' : '') + _GDGW_BLN[ref.getMonth()] + ' ' + ref.getFullYear();
      items.push({ label, ref: new Date(ref) });
    }
  }

  items.forEach((item, idx) => {
    const btn = document.createElement('button');
    btn.style.cssText = [
      'display:block','width:100%','text-align:left',
      'padding:9px 16px','background:none','border:none',
      'border-bottom:1px solid rgba(38,34,32,.1)',
      'font-size:13px','font-weight:700','cursor:pointer',
      "color:var(--gdg-ink,#262220)",
      "font-family:'Comic Neue','Comic Sans MS',cursive,sans-serif",
    ].join(';');
    btn.textContent = item.label;
    if (idx === 0) btn.style.fontWeight = '900'; // minggu/bulan ini tebal

    btn.addEventListener('click', () => {
      if (mode === 'per-minggu') {
        _gdgWMode = 'per-minggu';
        _gdgWWeekStart = item.ws;
      } else {
        _gdgWMode = 'per-bulan';
        _gdgWBulanRef  = item.ref;
      }
      // Update label tombol & active state
      const modeLabel = document.getElementById('gdgw-mode-label');
      if (modeLabel) modeLabel.textContent = item.label.replace('▸ ', '');
      ['minggu-ini','per-minggu','bulan-ini','per-bulan','custom'].forEach(m => {
        const el = document.getElementById('gdgw-opt-' + m);
        if (el) el.classList.toggle('active', m === mode);
      });
      const dataArea = document.getElementById('gdgw-data-area');
      if (dataArea) dataArea.style.display = (mode === 'per-bulan') ? 'none' : '';
      const customEl = document.getElementById('gdgw-custom-range');
      if (customEl) customEl.style.display = 'none';
      _gdgWCloseSubMenu();
      gdgWCloseModeMenu();
      gdgWRenderWeek();
    });
    sub.appendChild(btn);
  });
  const lastBtn = sub.querySelector('button:last-child');
  if (lastBtn) lastBtn.style.borderBottom = 'none';

  document.body.appendChild(sub);

  // Posisi: sejajar kanan menu utama, setinggi tombol yang di-klik
  requestAnimationFrame(() => {
    const mainMenu = document.getElementById('gdgw-mode-menu');
    const tr = triggerBtn.getBoundingClientRect();
    const mw = sub.offsetWidth;
    const mainR = mainMenu ? mainMenu.getBoundingClientRect() : tr;
    let left = mainR.right + 4;
    if (left + mw > window.innerWidth - 8) left = mainR.left - mw - 4;
    if (left < 8) left = 8;
    sub.style.left = left + 'px';
    sub.style.top  = tr.top + 'px';
  });
}

function _gdgWCloseSubMenu() {
  _gdgWSubMenuOpen = null;
  const s = document.getElementById('gdgw-sub-menu');
  if (s) s.remove();
}

function gdgWToggleModeMenu(e) {
  if (e) e.stopPropagation();
  _gdgWEnsureModeMenu();
  const menu = document.getElementById('gdgw-mode-menu');
  const btn  = document.getElementById('gdgw-mode-btn');
  if (!menu || !btn) return;
  const isOpen = menu.style.display !== 'none';
  if (isOpen) { menu.style.display = 'none'; _gdgWCloseSubMenu(); return; }
  // Posisikan menu rata KIRI dengan tombol
  const r = btn.getBoundingClientRect();
  menu.style.display = 'block';
  requestAnimationFrame(() => {
    let left = r.left;
    const mw = menu.offsetWidth;
    // Kalau keluar viewport kanan, geser ke kiri
    if (left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;
    if (left < 8) left = 8;
    menu.style.top  = (r.bottom + 4) + 'px';
    menu.style.left = left + 'px';
  });
}

function gdgWCloseModeMenu() {
  const m = document.getElementById('gdgw-mode-menu');
  if (m) m.style.display = 'none';
  _gdgWCloseSubMenu();
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('gdgw-mode-menu');
  const sub  = document.getElementById('gdgw-sub-menu');
  const btn  = document.getElementById('gdgw-mode-btn');
  const clickedMenu = menu && menu.contains(e.target);
  const clickedSub  = sub  && sub.contains(e.target);
  const clickedBtn  = btn  && btn.contains(e.target);
  if (!menu || menu.style.display === 'none') return;
  if (!clickedMenu && !clickedSub && !clickedBtn) {
    menu.style.display = 'none';
    _gdgWCloseSubMenu();
  }
});

function gdgWSetMode(mode) {
  _gdgWMode = mode;
  gdgWCloseModeMenu();

  // Update label tombol & active state menu item
  document.getElementById('gdgw-mode-label').textContent = _GDGW_MODE_LABELS[mode] || mode;
  ['minggu-ini','per-minggu','bulan-ini','per-bulan','custom'].forEach(m => {
    const el = document.getElementById('gdgw-opt-' + m);
    if (el) el.classList.toggle('active', m === mode);
  });

  // Tampil/sembunyikan custom range picker
  const customEl = document.getElementById('gdgw-custom-range');
  if (customEl) customEl.style.display = (mode === 'custom') ? 'flex' : 'none';

  // Tampil/sembunyikan tabel harian
  const dataArea = document.getElementById('gdgw-data-area');
  const hideTable = (mode === 'bulan-ini' || mode === 'per-bulan');
  if (dataArea) dataArea.style.display = hideTable ? 'none' : '';

  // Reset referensi ke "sekarang" saat mode berganti
  if (mode === 'minggu-ini' || mode === 'per-minggu') {
    _gdgWWeekStart = gdgWGetMonday(new Date());
    if (mode === 'minggu-ini') {
      // Minggu ini: non-navigable (prev/next disabled)
      _gdgWWeekStart = gdgWGetMonday(new Date());
    }
  } else if (mode === 'bulan-ini' || mode === 'per-bulan') {
    _gdgWBulanRef = new Date();
  } else if (mode === 'custom') {
    // Init custom ke minggu ini kalau belum ada
    if (!_gdgWCustomDari) {
      const ws = gdgWGetMonday(new Date());
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      _gdgWCustomDari   = ws;
      _gdgWCustomSampai = we;
      const dariEl   = document.getElementById('gdgw-custom-dari');
      const sampaiEl = document.getElementById('gdgw-custom-sampai');
      if (dariEl)   dariEl.value   = gdgWToISO(ws);
      if (sampaiEl) sampaiEl.value = gdgWToISO(we);
    }
  }
  gdgWRenderWeek();
}

// Prev/Next — perilaku tergantung mode
function gdgWPrev() {
  if (_gdgWMode === 'minggu-ini') return; // minggu ini = fixed, prev ga ngapa-ngapain
  if (_gdgWMode === 'per-minggu') {
    _gdgWWeekStart.setDate(_gdgWWeekStart.getDate() - 7);
  } else if (_gdgWMode === 'bulan-ini') {
    return; // bulan ini = fixed ke bulan berjalan
  } else if (_gdgWMode === 'per-bulan') {
    _gdgWBulanRef.setMonth(_gdgWBulanRef.getMonth() - 1);
  } else if (_gdgWMode === 'custom') {
    // Geser range custom sebesar durasi range itu sendiri
    if (_gdgWCustomDari && _gdgWCustomSampai) {
      const dur = Math.round((_gdgWCustomSampai - _gdgWCustomDari) / 86400000) + 1;
      _gdgWCustomDari.setDate(_gdgWCustomDari.getDate() - dur);
      _gdgWCustomSampai.setDate(_gdgWCustomSampai.getDate() - dur);
      const dariEl   = document.getElementById('gdgw-custom-dari');
      const sampaiEl = document.getElementById('gdgw-custom-sampai');
      if (dariEl)   dariEl.value   = gdgWToISO(_gdgWCustomDari);
      if (sampaiEl) sampaiEl.value = gdgWToISO(_gdgWCustomSampai);
    }
  }
  gdgWRenderWeek();
}
function gdgWNext() {
  if (_gdgWMode === 'minggu-ini') return;
  if (_gdgWMode === 'per-minggu') {
    _gdgWWeekStart.setDate(_gdgWWeekStart.getDate() + 7);
  } else if (_gdgWMode === 'bulan-ini') {
    return;
  } else if (_gdgWMode === 'per-bulan') {
    _gdgWBulanRef.setMonth(_gdgWBulanRef.getMonth() + 1);
  } else if (_gdgWMode === 'custom') {
    if (_gdgWCustomDari && _gdgWCustomSampai) {
      const dur = Math.round((_gdgWCustomSampai - _gdgWCustomDari) / 86400000) + 1;
      _gdgWCustomDari.setDate(_gdgWCustomDari.getDate() + dur);
      _gdgWCustomSampai.setDate(_gdgWCustomSampai.getDate() + dur);
      const dariEl   = document.getElementById('gdgw-custom-dari');
      const sampaiEl = document.getElementById('gdgw-custom-sampai');
      if (dariEl)   dariEl.value   = gdgWToISO(_gdgWCustomDari);
      if (sampaiEl) sampaiEl.value = gdgWToISO(_gdgWCustomSampai);
    }
  }
  gdgWRenderWeek();
}

// Dipanggil saat input tanggal custom berubah
function gdgWCustomApply() {
  const dariVal   = document.getElementById('gdgw-custom-dari').value;
  const sampaiVal = document.getElementById('gdgw-custom-sampai').value;
  if (!dariVal || !sampaiVal) return;
  const d = dariVal.split('-').map(Number);
  const s = sampaiVal.split('-').map(Number);
  _gdgWCustomDari   = new Date(d[0], d[1]-1, d[2]);
  _gdgWCustomSampai = new Date(s[0], s[1]-1, s[2]);
  if (_gdgWCustomSampai < _gdgWCustomDari) {
    _gdgWCustomSampai = new Date(_gdgWCustomDari);
    document.getElementById('gdgw-custom-sampai').value = dariVal;
  }
  gdgWRenderWeek();
}

// Helper: hitung range ISO dari mode aktif
function gdgWGetRange() {
  const now = new Date();
  if (_gdgWMode === 'minggu-ini' || _gdgWMode === 'per-minggu') {
    if (!_gdgWWeekStart) _gdgWWeekStart = gdgWGetMonday(now);
    const end = new Date(_gdgWWeekStart); end.setDate(_gdgWWeekStart.getDate() + 6);
    return { start: _gdgWWeekStart, end, isoStart: gdgWToISO(_gdgWWeekStart), isoEnd: gdgWToISO(end), perHari: true };
  } else if (_gdgWMode === 'bulan-ini') {
    const ref   = _gdgWBulanRef || now;
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end   = new Date(ref.getFullYear(), ref.getMonth(), now.getDate());
    return { start, end, isoStart: gdgWToISO(start), isoEnd: gdgWToISO(end), perHari: false };
  } else if (_gdgWMode === 'per-bulan') {
    const ref   = _gdgWBulanRef || now;
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end   = new Date(ref.getFullYear(), ref.getMonth() + 1, 0); // akhir bulan
    return { start, end, isoStart: gdgWToISO(start), isoEnd: gdgWToISO(end), perHari: false };
  } else if (_gdgWMode === 'custom') {
    const s = _gdgWCustomDari   || gdgWGetMonday(now);
    const e = _gdgWCustomSampai || (() => { const x = new Date(s); x.setDate(s.getDate()+6); return x; })();
    return { start: s, end: e, isoStart: gdgWToISO(s), isoEnd: gdgWToISO(e), perHari: true };
  }
  // fallback
  const ws = gdgWGetMonday(now);
  const we = new Date(ws); we.setDate(ws.getDate() + 6);
  return { start: ws, end: we, isoStart: gdgWToISO(ws), isoEnd: gdgWToISO(we), perHari: true };
}

// Compat: gdgWThisWeek masih dipakai gdgWInit
function gdgWThisWeek() { gdgWSetMode('minggu-ini'); }

async function gdgWInit() {
  _gdgWMode      = 'minggu-ini';
  _gdgWWeekStart = gdgWGetMonday(new Date());
  _gdgWBulanRef  = new Date();
  _gdgWCustomDari = null;
  _gdgWCustomSampai = null;
  // Sync UI label & active state ke mode default
  const modeLabel = document.getElementById('gdgw-mode-label');
  if (modeLabel) modeLabel.textContent = 'Minggu Ini';
  ['minggu-ini','per-minggu','bulan-ini','per-bulan','custom'].forEach(m => {
    const el = document.getElementById('gdgw-opt-' + m);
    if (el) el.classList.toggle('active', m === 'minggu-ini');
  });
  const customEl = document.getElementById('gdgw-custom-range');
  if (customEl) customEl.style.display = 'none';
  const dataArea = document.getElementById('gdgw-data-area');
  if (dataArea) dataArea.style.display = '';

  const ok = await gdgWEnsureAkunJurnal();
  if (!ok) return;
  gdgWRenderWeek();
}

// Load data akun (kas_akun) + jurnal SEKALI, dipakai bareng oleh Ringkasan
// Mingguan (hitung beban harian) DAN Anggaran (hitung realisasi per variable).
// Guard _gdgWAkunLoaded biar ga fetch berulang tiap ganti-ganti panel.
async function gdgWEnsureAkunJurnal() {
  if (_gdgWAkunLoaded) return true;
  try {
    const [akun, jurnal] = await Promise.all([
      dbGet('kas_akun', '&order=kode.asc'),
      dbGet('jurnal', '&order=tanggal.asc'),
    ]);
    _gdgWAkunAll   = akun   || [];
    _gdgWJurnalAll = jurnal || [];
    _gdgWAkunLoaded = true;
    return true;
  } catch(e) {
    const tbody = document.getElementById('gdgw-harian-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger)">Error ambil data beban: ${e.message}</td></tr>`;
    return false;
  }
}

// Hitung beban minggu ini dari jurnal (akun kode 5-xxx kecuali 5-001)
function gdgWHitungBebanHari(isoDay, akunBebanMap) {
  let beban = 0;
  _gdgWJurnalAll.forEach(r => {
    if (r.tanggal !== isoDay) return;
    const n = r.nominal || r.debit || r.kredit || 0;
    if (r.akun_debit_id  && akunBebanMap[r.akun_debit_id])  beban += n;
    if (r.akun_kredit_id && akunBebanMap[r.akun_kredit_id]) beban -= n;
  });
  return beban;
}

async function gdgWRenderWeek() {
  const range = gdgWGetRange();
  const { start, end, isoStart, isoEnd, perHari } = range;

  // Update label tanggal (read-only display)
  document.getElementById('gdgw-week-label').textContent = gdgWFmtRange(start, end);

  // Prev/next buttons: disable di mode yang fixed (minggu-ini, bulan-ini)
  const isFixed = (_gdgWMode === 'minggu-ini' || _gdgWMode === 'bulan-ini');
  document.querySelectorAll('#gdg-sticky-header .btn').forEach(b => {
    if (b.id !== 'gdgw-mode-btn') b.style.opacity = isFixed ? '0.35' : '1';
  });

  // Tabel/chart: tampil/sembunyikan sesuai mode (Bulan Ini/Per Bulan gak
  // punya breakdown harian sama sekali, jadi dua-duanya + tombol toggle ikut
  // disembunyikan, bukan cuma tabelnya).
  const dataArea  = document.getElementById('gdgw-data-area');
  const chartArea = document.getElementById('gdgw-chart-area');
  const chartBtn  = document.getElementById('gdgw-chart-toggle-btn');
  if (dataArea)  dataArea.style.display  = (perHari && !_gdgWChartMode) ? '' : 'none';
  if (chartArea) chartArea.style.display = (perHari && _gdgWChartMode) ? 'block' : 'none';
  if (chartBtn)  chartBtn.style.display  = perHari ? '' : 'none';

  // Akun beban: HARUS sama persis kayak sumber Card Cost/Penyerapan (Variable
  // Anggaran Mingguan) — BUKAN lagi filter kode prefix 5-xxx. Dulu filternya
  // "5-xxx kecuali 5-001", tapi itu udah dibuang dari gdgAngHitungRealisasi/
  // gdgAngPopulateAkunSelect pas fitur Variable Anggaran per-nama-akun masuk;
  // tabel breakdown harian ini kelewat, jadi masih nyapu SEMUA akun beban
  // (termasuk punya usaha lain kayak alat-alat) — bikin Total di sini beda jauh
  // sama Card Cost di atas yang udah bener (apple-to-apple ke Anggaran
  // Mingguan doang). Matchingnya: nama akun (case-insensitive) ada di daftar
  // _gdgAnggaranList minggu berjalan, sama persis kayak gdgAngHitungRealisasi.
  const anggaranNamaSet = {};
  _gdgAnggaranList.forEach(it => {
    const nama = String(it.nama || '').trim().toLowerCase();
    if (nama) anggaranNamaSet[nama] = true;
  });
  const akunBebanMap = {};
  _gdgWAkunAll.forEach(a => {
    if ((a.kelompok === 'beban' || a.kelompok === 'kewajiban') &&
        anggaranNamaSet[String(a.nama || '').trim().toLowerCase()]) {
      akunBebanMap[a.id] = a;
    }
  });

  if (perHari) {
    document.getElementById('gdgw-harian-tbody').innerHTML = '<tr><td colspan="4" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';
  }

  let pendList = [];
  try {
    pendList = await dbGet('gadag_pendapatan', '&tanggal=gte.' + isoStart + '&tanggal=lte.' + isoEnd) || [];
  } catch(e) {
    if (perHari) document.getElementById('gdgw-harian-tbody').innerHTML = `<tr><td colspan="4" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
    return;
  }

  let totalPend = 0, totalBeban = 0;

  if (perHari) {
    // Hitung jumlah hari dalam range
    const msPerDay = 86400000;
    const days = Math.round((end - start) / msPerDay) + 1;
    let html = '';
    _gdgWDailyData = [];
    for (let i = 0; i < days; i++) {
      const d      = new Date(start); d.setDate(start.getDate() + i);
      const isoDay = gdgWToISO(d);
      const pend   = pendList.filter(p => p.tanggal === isoDay).reduce((s,p) => s + (Number(p.total)||0), 0);
      const beban  = gdgWHitungBebanHari(isoDay, akunBebanMap);
      const net    = pend - beban;
      totalPend  += pend;
      totalBeban += beban;
      const hariNama = _GDGW_HARI[d.getDay()];
      _gdgWDailyData.push({ hariNama: hariNama, tglLabel: d.getDate() + '/' + (d.getMonth()+1), pend: pend, beban: beban });
      html += `<tr>
        <td style="padding:6px 4px;white-space:nowrap"><b>${hariNama}</b> <span style="font-size:11px;color:var(--ink3)">${d.getDate()}/${d.getMonth()+1}</span></td>
        <td style="text-align:right;padding:6px 4px;color:var(--ok)">${gdgWFmt(pend)}</td>
        <td style="text-align:right;padding:6px 4px;color:var(--danger)">${gdgWFmt(beban)}</td>
        <td style="text-align:right;padding:6px 4px"><b style="color:${net>=0?'var(--ok)':'var(--danger)'}">${gdgWFmt(net)}</b></td>
      </tr>`;
    }
    const totalNet = totalPend - totalBeban;
    html += `<tr class="lap-total">
      <td style="padding:6px 4px"><b>Total</b></td>
      <td style="text-align:right;padding:6px 4px;color:var(--ok)"><b>${gdgWFmt(totalPend)}</b></td>
      <td style="text-align:right;padding:6px 4px;color:var(--danger)"><b>${gdgWFmt(totalBeban)}</b></td>
      <td style="text-align:right;padding:6px 4px"><b style="color:${totalNet>=0?'var(--ok)':'var(--danger)'}">${gdgWFmt(totalNet)}</b></td>
    </tr>`;
    document.getElementById('gdgw-harian-tbody').innerHTML = html;
    if (_gdgWChartMode) _gdgWDrawDailyChart();
    totalBeban = _gdgWJurnalAll
      .filter(r => r.tanggal >= isoStart && r.tanggal <= isoEnd)
      .reduce((s, r) => {
        const n = r.nominal || r.debit || r.kredit || 0;
        if (r.akun_debit_id  && akunBebanMap[r.akun_debit_id])  return s + n;
        if (r.akun_kredit_id && akunBebanMap[r.akun_kredit_id]) return s - n;
        return s;
      }, 0);
    // Recalc totalBeban from jurnal for minicard (sama yg sudah dihitung per hari)
    totalBeban = 0;
    _gdgWJurnalAll.forEach(r => {
      if (r.tanggal < isoStart || r.tanggal > isoEnd) return;
      const n = r.nominal || r.debit || r.kredit || 0;
      if (r.akun_debit_id  && akunBebanMap[r.akun_debit_id])  totalBeban += n;
      if (r.akun_kredit_id && akunBebanMap[r.akun_kredit_id]) totalBeban -= n;
    });
    totalPend  = pendList.reduce((s,p) => s + (Number(p.total)||0), 0);
  } else {
    // Mode bulan: hanya minicard, tabel disembunyikan
    totalPend  = pendList.reduce((s,p) => s + (Number(p.total)||0), 0);
    totalBeban = 0;
    _gdgWJurnalAll.forEach(r => {
      if (r.tanggal < isoStart || r.tanggal > isoEnd) return;
      const n = r.nominal || r.debit || r.kredit || 0;
      if (r.akun_debit_id  && akunBebanMap[r.akun_debit_id])  totalBeban += n;
      if (r.akun_kredit_id && akunBebanMap[r.akun_kredit_id]) totalBeban -= n;
    });
  }

  const totalNet = totalPend - totalBeban;

  // Update Net Income label
  const netEl = document.getElementById('gdgw-net-value');
  netEl.textContent = gdgWFmt(totalNet);
  netEl.style.color = totalNet >= 0 ? 'var(--ok)' : 'var(--danger)';

  // Update minicard Income
  const totalQty = pendList.reduce((s,p) => s + (Number(p.qty)||0), 0);
  const totalLsn = (totalQty / 12).toFixed(1);
  document.getElementById('gdg-total-pendapatan').textContent = gdgWFmt(totalPend);
  const subEl = document.getElementById('gdg-total-sub');
  if (subEl) subEl.textContent = totalQty.toLocaleString('id-ID') + ' pcs · ' + pendList.length + ' catatan';
  // sync mobile
  const pendM = document.getElementById('gdg-total-pendapatan-m');
  if (pendM) pendM.textContent = gdgWFmt(totalPend);

  // Donat Income — % Net Anggaran (target biaya minggu ini) yang udah
  // ketutup pendapatan periode yang lagi dibrowse. Makin ijo makin aman
  // (income >= target), makin merah berarti income masih jauh dari target.
  const netAnggaranIncome = gdgAngNetTotalMingguan();
  if (netAnggaranIncome > 0) {
    const coverPct = Math.round((totalPend / netAnggaranIncome) * 100);
    let coverColor = 'var(--danger)';
    if (coverPct >= 100) coverColor = 'var(--ok)';
    else if (coverPct >= 50) coverColor = 'var(--warn)';
    gdgIncomeSetDonut(coverPct, coverColor, coverPct + '%');
  } else {
    gdgIncomeSetDonut(totalPend > 0 ? 100 : 0, totalPend > 0 ? 'var(--ok)' : 'var(--ink3)', totalPend > 0 ? '100%' : '—');
  }

  // Update Qty/Lsn metric — mendatar (flex row), bukan tumpuk <br> lagi
  const qtyEl = document.getElementById('gdg-metric-qty');
  if (qtyEl) qtyEl.innerHTML = totalQty.toLocaleString('id-ID') + ' pc<span style="font-size:14px;opacity:.4">·</span>' + totalLsn + ' lsn';
  const qtyNumEl = document.getElementById('gdg-metric-qty-num');
  const lsnNumEl = document.getElementById('gdg-metric-lsn-num');
  if (qtyNumEl) qtyNumEl.textContent = totalQty.toLocaleString('id-ID');
  if (lsnNumEl) lsnNumEl.textContent = totalLsn;

  // Update minicard Cost — "anggaran yang diserap" (Nilai + Percent).
  // Per 6 Sep 2026: IKUT periode yg lagi dibrowse (gdgAngUpdateCostCard baca
  // gdgWGetRange() sendiri) — BUKAN lagi fixed minggu berjalan. Gak perlu
  // oper start/end/totalBeban dari sini, fungsinya udah ambil range sendiri.
  gdgAngUpdateCostCard();

  gdgUpdateTargetCard();
}

// ─── TOGGLE TABEL <-> GRAFIK BATANG (breakdown harian Overview) ──
// Data sumbernya sama persis kayak tabel (_gdgWDailyData, diisi tiap
// gdgWRenderWeek) — cuma beda cara nampilinnya. Cuma relevan pas perHari
// true (mode Minggu Ini/Per Minggu/Custom) — di mode Bulan Ini/Per Bulan
// dua-duanya (tabel & chart) disembunyiin sama gdgWRenderWeek sendiri.
function gdgWToggleChartView() {
  _gdgWChartMode = !_gdgWChartMode;
  const tableEl = document.getElementById('gdgw-data-area');
  const chartEl = document.getElementById('gdgw-chart-area');
  const icon    = document.getElementById('gdgw-chart-toggle-icon');
  if (tableEl) tableEl.style.display = _gdgWChartMode ? 'none' : '';
  if (chartEl) chartEl.style.display = _gdgWChartMode ? 'block' : 'none';
  if (icon) icon.className = _gdgWChartMode ? 'ti ti-table' : 'ti ti-chart-bar';
  if (_gdgWChartMode) _gdgWDrawDailyChart();
}

function _gdgWDrawDailyChart() {
  const canvas = document.getElementById('gdgw-daily-chart');
  if (!canvas || !_gdgWDailyData.length) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || canvas.parentElement.clientWidth || 320;
  const cssH = 220;
  canvas.width  = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const data   = _gdgWDailyData;
  const padL = 44, padR = 10, padT = 10, padB = 28;
  const cW = cssW - padL - padR, cH = cssH - padT - padB;
  const maxVal = Math.max(1, ...data.map(d => Math.max(d.pend, d.beban)));
  const step  = cW / data.length;
  const barW  = Math.min(16, step * 0.32);
  // Hardcode langsung (bukan getComputedStyle) — --gdg-ink dkk di-scope ke
  // #page-gadag, bukan :root, jadi baca dari document.documentElement bakal
  // selalu kosong. Nilainya sama persis kayak deklarasi --gdg-ink/--gdg-ink2
  // di style block atas.
  const inkColor    = '#262220';
  const inkColor2   = '#5c554d';
  const okColor     = '#1f9254';
  const dangerColor = '#c0392b';
  const fontFam     = "'Comic Neue', cursive, sans-serif";

  // Grid horizontal (4 garis) + label nominal
  ctx.strokeStyle = 'rgba(0,0,0,.08)';
  ctx.fillStyle   = inkColor2;
  ctx.font        = '10px ' + fontFam;
  ctx.textAlign   = 'right';
  ctx.textBaseline = 'middle';
  for (let g = 0; g <= 3; g++) {
    const y = padT + cH - (cH * g / 3);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + cW, y);
    ctx.stroke();
    const val = Math.round(maxVal * g / 3);
    ctx.fillText(val >= 1000 ? Math.round(val/1000) + 'rb' : String(val), padL - 6, y);
  }

  // Bar per hari (income + cost berdampingan)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  data.forEach((d, i) => {
    const cx = padL + step * i + step / 2;
    const hPend  = maxVal > 0 ? (d.pend  / maxVal) * cH : 0;
    const hBeban = maxVal > 0 ? (d.beban / maxVal) * cH : 0;
    ctx.fillStyle = okColor;
    ctx.fillRect(cx - barW - 2, padT + cH - hPend, barW, hPend);
    ctx.fillStyle = dangerColor;
    ctx.fillRect(cx + 2, padT + cH - hBeban, barW, hBeban);
    // Label hari di bawah
    ctx.fillStyle = inkColor2;
    ctx.font = '10px ' + fontFam;
    ctx.fillText(d.hariNama.slice(0,3), cx, padT + cH + 16);
  });

  // Garis dasar
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, padT + cH);
  ctx.lineTo(padL + cW, padT + cH);
  ctx.stroke();
}

// ─── ANGGARAN — SATU list per akun, nominal = BULANAN (multi-item, dijumlah
// = Net Anggaran). Tampilan Mingguan CUMA membagi 4 nominal ini buat
// ditampilin (BUKAN input terpisah lagi) — lihat gdgAngRenderList().
// Tabel Supabase: gadag_anggaran (id, minggu_mulai date [REPURPOSED: sekarang
// nyimpen tanggal 1 bulan yang lagi dianggarin, misal '2026-08-01' — BUKAN
// tanggal awal minggu lagi. Nama kolom nyesatin tapi dipertahanin apa adanya
// biar gak perlu migrasi skema], nama text, target numeric [SEKARANG SELALU
// nominal BULANAN], tgl_jatuh_tempo int [OPSIONAL, cuma buat badge tampilan
// "tgl X", gak ngaruh ke realisasi/status lagi], periode text [SEKARANG
// SELALU 'bulanan', kolom dipertahanin apa adanya buat kompatibilitas data
// lama, gak dipakai buat cabang logic lagi]).
let _gdgAnggaranList = []; // semua item anggaran BULAN BERJALAN

function gdgAngMonthStartISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-01';
}

async function gdgLoadAnggaran() {
  const bulanIni = gdgAngMonthStartISO(new Date());
  const listEl   = document.getElementById('gdg-ang2-list');
  if (listEl) listEl.innerHTML = '<div style="color:var(--ink3);font-style:italic;padding:10px 0">Memuat...</div>';
  try {
    let rows = await dbGet('gadag_anggaran', '&periode=eq.bulanan&minggu_mulai=eq.' + bulanIni + '&order=id.asc');
    rows = rows || [];
    if (!rows.length) rows = await gdgAngCopyForwardIfEmpty(bulanIni);
    _gdgAnggaranList = rows;
  } catch(e) {
    console.error('Gagal load anggaran:', e.message);
    _gdgAnggaranList = [];
    if (listEl) listEl.innerHTML = `<div style="color:var(--danger)">Error: ${e.message}</div>`;
    gdgUpdateTargetCard();
    return;
  }
  await gdgWEnsureAkunJurnal(); // pastikan data akun+jurnal ada buat hitung realisasi progress bar
  gdgAngUpdateCostCard();   // SELALU jalan — ini yang nyuplai Overview, gak peduli toggle lagi di mana
  gdgAngRenderActiveList();
  gdgUpdateTargetCard();
  // Refresh tabel breakdown harian Overview juga — akunBebanMap-nya bergantung
  // ke _gdgAnggaranList (baru kesedia di titik ini). Tanpa ini, pas awal buka
  // halaman tabelnya sempat/bisa kepancet Rp0 duluan karena gdgWInit() jalan
  // paralel dan bisa render duluan sebelum data Anggaran ini nyampe.
  gdgWRenderWeek();
}

// Bulan baru & belum ada isinya sama sekali → salin nama+nominal+tempo dari
// bulan LALU yang PALING BARU punya data (bisa aja lompat >1 bulan kalau
// beberapa bulan kosong berturut-turut). Row bulan lalu TETAP utuh (gak
// disentuh) — yang dibuat cuma row BARU buat bulan berjalan, jadi histori
// bulan lalu tetep aman/immutable, dan bulan baru ini masih bebas diedit
// (longpress) tanpa ngubah histori. Kalau emang belum pernah ada data sama
// sekali, balikin array kosong — biarin user mulai dari nol via [+ Tambah]
// atau [Pilih] di History.
async function gdgAngCopyForwardIfEmpty(bulanIniISO) {
  try {
    const prevRows = await dbGet('gadag_anggaran', '&periode=eq.bulanan&minggu_mulai=lt.' + bulanIniISO + '&order=minggu_mulai.desc,id.asc&limit=50');
    if (!prevRows || !prevRows.length) return [];
    const bulanTerakhir = prevRows[0].minggu_mulai;
    const sumber = prevRows.filter(r => r.minggu_mulai === bulanTerakhir);
    const inserted = [];
    for (const src of sumber) {
      const payload = { periode: 'bulanan', nama: src.nama, target: src.target, tgl_jatuh_tempo: src.tgl_jatuh_tempo || null, minggu_mulai: bulanIniISO, tgl_reset: null };
      const row = await dbInsert('gadag_anggaran', payload);
      inserted.push(Array.isArray(row) ? row[0] : (row || payload));
    }
    return inserted;
  } catch(e) {
    console.error('Gagal copy-forward anggaran bulan baru:', e.message);
    return [];
  }
}

function gdgAngNetTotal() {
  return _gdgAnggaranList.reduce((s, r) => s + (Number(r.target) || 0), 0);
}

// Versi mingguan (÷4) — dipakai buat Card Cost Overview PAS mode per-hari
// (Minggu Ini/Per Minggu/Custom — lihat gdgAngUpdateCostCard) & Card Sisa
// (gdgUpdateTargetCard), biar apple-to-apple lawan realisasi/pendapatan yang
// emang dihitung per minggu berjalan.
function gdgAngNetTotalMingguan() {
  return gdgAngNetTotal() / 4;
}

// Total realisasi (nilai anggaran yang sudah diserap) PADA PERIODE YANG LAGI
// DIBROWSE di Overview — dijumlah dari semua item Variable Anggaran. Dulu
// (sebelum 6 Sep 2026) fungsi ini hardcode ke minggu kalender sekarang
// (gdgWGetMonday(new Date())) SENGAJA independen dari selector tanggal
// Overview, biar apple-to-apple lawan Card Penyerapan di halaman Anggaran
// yang juga fixed mingguan. User minta itu diubah: Cost sekarang WAJIB ikut
// gdgWGetRange() (state _gdgWMode/_gdgWWeekStart/dst yang sama dipakai
// Income & tabel breakdown harian), biar geser tanggal di Overview beneran
// ngubah 3 minicard-nya bareng-bareng (Income, Cost, Net), bukan cuma 2.
//
// Pembagi (netAnggaran) ikut nyesuain granularitas periode yang dibrowse:
// - Mode per-hari (Minggu Ini/Per Minggu/Custom, perHari:true dari
//   gdgWGetRange) → tetep anggaran MINGGUAN (÷4), approx yang sama kayak
//   donat Income di gdgWRenderWeek (custom range yg bukan pas 7 hari juga
//   dibandingin ke mingguan, bukan dihitung ulang proporsional per-hari).
// - Mode bulan (Bulan Ini/Per Bulan, perHari:false) → anggaran BULANAN PENUH
//   (gdgAngNetTotal(), TANPA ÷4), soalnya kalau tetep dibagi 4 tapi realisasi
//   udah sebulan penuh, persennya bisa jebol >400% — gak masuk akal.
//
// Card "Penyerapan" di halaman Anggaran (gdgAngRenderList) TETEP independen,
// ngikutin toggle Mingguan/Bulanan-nya sendiri — gak disatuin ke sini.
function gdgAngUpdateCostCard() {
  const range = gdgWGetRange();
  const { isoStart, isoEnd, perHari } = range;
  const netAnggaran  = perHari ? gdgAngNetTotalMingguan() : gdgAngNetTotal();
  const totalDiserap = _gdgAnggaranList.reduce((s, it) => s + gdgAngHitungRealisasi(it.nama, isoStart, isoEnd), 0);
  const pct    = netAnggaran > 0 ? Math.round((totalDiserap / netAnggaran) * 100) : 0;
  const pctFmt = pct + '%';
  let pctColor = 'var(--ok)';
  if (pct >= 75) pctColor = 'var(--danger)';
  else if (pct >= 35) pctColor = 'var(--warn)';

  // Card Cost — Overview (desktop TETEP teks, mobile ganti donat — sama pola
  // kayak Target/Income mobile, biar minicard-nya gak numpuk teks)
  const costEl  = document.getElementById('gdg-cost-value');
  const costSub = document.getElementById('gdg-cost-sub');
  if (costEl)  costEl.textContent  = gdgWFmt(totalDiserap);
  if (costSub) { costSub.textContent = pctFmt + ' dari anggaran'; costSub.style.color = pctColor; }
  const costM = document.getElementById('gdg-cost-value-m');
  if (costM) costM.textContent = gdgWFmt(totalDiserap);
  gdgDonutApply('gdg-cost-donut', 'gdg-cost-donut-txt', pct, pctColor, pctFmt);

  return { netAnggaran: netAnggaran, totalDiserap: totalDiserap, pct: pct };
}

// ─── TOGGLE tampilan Mingguan / Bulanan ─────────────────────────────────
// CUMA ganti CARA NAMPILIN — sumber datanya SATU list yang sama
// (_gdgAnggaranList, nominal bulanan). Mingguan = nominal ÷4 & realisasi
// minggu berjalan. Bulanan = nominal penuh & realisasi bulan kalender
// berjalan. Lihat gdgAngRenderList().
let _gdgAngPeriodeAktif = 'mingguan';

// Helper donut generik — dipakai bareng sama minicard Penyerapan (Anggaran),
// Income, dan Target (Overview). Ring-nya di-clamp 0-100 (biar visualnya masuk
// akal), tapi teks tengahnya bisa dioverride buat kasus ekstrem (misal Sisa
// bisa negatif/lebih dari 100%, ring cuma nunjukin proporsi kasarnya).
function gdgDonutApply(donutId, txtId, pct, color, textOverride) {
  const donutEl = document.getElementById(donutId);
  const txtEl   = document.getElementById(txtId);
  const pctClamped = Math.max(0, Math.min(100, pct));
  if (donutEl) {
    donutEl.style.setProperty('--pct', pctClamped);
    donutEl.style.setProperty('--donut-color', color);
  }
  if (txtEl) txtEl.textContent = textOverride !== undefined ? textOverride : (Math.round(pct) + '%');
}

function gdgAngSetDonut(pct, color) {
  gdgDonutApply('gdg-ang2-diserap-donut', 'gdg-ang2-diserap-donut-txt', pct, color);
}

function gdgTargetSetDonut(pct, color, textOverride) {
  gdgDonutApply('gdg-metric-target-donut', 'gdg-metric-target-donut-txt', pct, color, textOverride);
}

function gdgIncomeSetDonut(pct, color, textOverride) {
  gdgDonutApply('gdg-income-donut', 'gdg-income-donut-txt', pct, color, textOverride);
}

function gdgAngTogglePeriode() {
  _gdgAngPeriodeAktif = _gdgAngPeriodeAktif === 'bulanan' ? 'mingguan' : 'bulanan';
  const btn = document.getElementById('gdg-ang-mode-btn');
  if (btn) btn.textContent = _gdgAngPeriodeAktif === 'bulanan' ? 'Bulanan' : 'Mingguan';
  // Atur Variable Anggaran cuma boleh di mode Bulanan — tombol Tambah
  // disembunyikan pas Mingguan biar panel Mingguan bersih (read-only).
  const tambahBtn = document.getElementById('gdg-ang-tambah-btn');
  if (tambahBtn) tambahBtn.style.display = _gdgAngPeriodeAktif === 'bulanan' ? '' : 'none';
  gdgAngRenderActiveList();
}

function gdgAngRenderActiveList() {
  gdgAngRenderList();
}


// ─── HALAMAN: HISTORY (Cost per Akun Anggaran) ──────────────────────────
// Full page (BUKAN bottom-sheet lagi, biar stabil), dibuka dari tombol jam
// di panel Anggaran. Scope akun: HANYA akun yang ada di Variable Anggaran
// — BUKAN semua akun Beban di kas_akun, biar tetep apple-to-apple sama
// Card Cost Overview & gak kebawa akun usaha lain yang emang gak
// dianggarkan di Gadag.
// "Bulan Ini"/"Bulan Lalu" = kalender bulan murni (tgl 1 - akhir bulan) —
// dipakai kalau History dibuka dari panel BULANAN. Kalau dibuka dari panel
// MINGGUAN, toggle-nya jadi "Minggu Ini"/"Minggu Lalu" (Minggu-Sabtu, sama
// kayak konvensi minggu di seluruh Gadag — lihat gdgWGetMonday), biar
// apple-to-apple sama cadence budget-nya (mingguan dibandingin per minggu,
// bulanan dibandingin per bulan) — BUKAN dua-duanya dipaksa ke bulan kalender.
let _gdgAngHistMode = 0;              // 0 = periode ini, 1 = periode lalu
let _gdgAngHistOpenFrom = 'mingguan'; // target periode pas "Pilih akun" — ngikutin dari mana History ini dibuka
let _gdgAngHistPilihActive = false;   // flag: picker akun berikutnya lagi dipicu dari tombol [Pilih] History (bukan dari + Tambah biasa)
let _gdgAngHistWeeksBack = 0;         // dipakai CUMA pas openFrom==='mingguan': 0=minggu ini, 1=minggu lalu (default), 2+ = dipilih dari dropdown "minggu sebelumnya"

function gdgAngHistMonthRange(monthsAgo) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  return { start: gdgWToISO(start), end: gdgWToISO(end), label: start.toLocaleDateString('id-ID', { month:'long', year:'numeric' }) };
}

// Rentang Minggu-Sabtu, weeksBack minggu ke belakang dari minggu berjalan.
// gdgWGetMonday() namanya nyesatin — hasil aslinya hari Minggu (Sunday, day
// 0), lihat komentar di definisinya — dipertahanin apa adanya (dipakai luas
// di modul ini), cuma di-reuse di sini.
function gdgAngHistWeekRange(weeksBack) {
  const sun = gdgWGetMonday(new Date());
  sun.setDate(sun.getDate() - weeksBack * 7);
  const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
  const label = sun.toLocaleDateString('id-ID', { day:'numeric', month:'short' })
    + ' – ' + sat.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
  return { start: gdgWToISO(sun), end: gdgWToISO(sat), label: label };
}

function gdgAngHistCurrentRange() {
  if (_gdgAngHistOpenFrom === 'mingguan') {
    return gdgAngHistWeekRange(_gdgAngHistMode === 1 ? _gdgAngHistWeeksBack : 0);
  }
  return gdgAngHistMonthRange(_gdgAngHistMode);
}

// Realisasi per akun langsung by ID (bukan by nama kayak gdgAngHitungRealisasi)
// — dipakai di sini karena akun-nya udah pasti ketemu dari _gdgWAkunAll duluan.
function gdgAngHistTotalByAkunId(akunId, isoStart, isoEnd) {
  let total = 0;
  _gdgWJurnalAll.forEach(r => {
    if (r.tanggal < isoStart || r.tanggal > isoEnd) return;
    const n = r.nominal || r.debit || r.kredit || 0;
    if (r.akun_debit_id  === akunId) total += n;
    if (r.akun_kredit_id === akunId) total -= n;
  });
  return total;
}

async function gdgAngHistOpen(fromPeriode) {
  _gdgAngHistOpenFrom = fromPeriode === 'bulanan' ? 'bulanan' : 'mingguan';
  _gdgAngHistMode = 0;
  _gdgAngHistWeeksBack = 0;
  const tglIni  = document.getElementById('gdg-histpage-toggle-ini');
  const tglLalu = document.getElementById('gdg-histpage-toggle-lalu');
  if (_gdgAngHistOpenFrom === 'mingguan') {
    if (tglIni)  tglIni.textContent  = 'Minggu Ini';
    if (tglLalu) tglLalu.textContent = 'Minggu Lalu';
  } else {
    if (tglIni)  tglIni.textContent  = 'Bulan Ini';
    if (tglLalu) tglLalu.textContent = 'Bulan Lalu';
  }
  if (tglIni)  tglIni.classList.add('active');
  if (tglLalu) tglLalu.classList.remove('active');
  gdgAngHistUpdateWkPicker();
  await gdgWEnsureAkunJurnal();
  const overlay = document.getElementById('gdg-histpage-overlay');
  if (overlay) {
    overlay.classList.add('open');
    void overlay.offsetHeight; // reflow, biar transition-nya kepicu
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.classList.add('gdg-sheet-in');
    }));
  }
  gdgAngHistRender();
}

function gdgAngHistClose() {
  const overlay = document.getElementById('gdg-histpage-overlay');
  if (!overlay) return;
  overlay.classList.remove('gdg-sheet-in');
  setTimeout(() => { overlay.classList.remove('open'); }, 260);
}

function gdgAngHistOverlayClick(e) {
  if (e.target.id === 'gdg-histpage-overlay') gdgAngHistClose();
}

function gdgAngHistSetMode(mode) {
  _gdgAngHistMode = mode;
  _gdgAngHistWeeksBack = mode === 1 ? 1 : 0; // tiap kali baru pindah ke tab "lalu", default 1 minggu ke belakang
  const tglIni  = document.getElementById('gdg-histpage-toggle-ini');
  const tglLalu = document.getElementById('gdg-histpage-toggle-lalu');
  if (tglIni)  tglIni.classList.toggle('active', mode === 0);
  if (tglLalu) tglLalu.classList.toggle('active', mode === 1);
  gdgAngHistUpdateWkPicker();
  gdgAngHistRender();
}

// Dropdown "minggu-minggu sebelumnya" — CUMA muncul kalau History dibuka
// dari panel Mingguan & lagi di tab "Minggu Lalu". Opsinya dilabelin
// TANGGAL doang (bukan "2 minggu lalu" dst, sesuai diminta), isi 12 minggu
// ke belakang, rentang tiap opsi tetep Minggu-Sabtu.
function gdgAngHistUpdateWkPicker() {
  const wkPicker = document.getElementById('gdg-histpage-wkpicker');
  if (!wkPicker) return;
  const show = _gdgAngHistOpenFrom === 'mingguan' && _gdgAngHistMode === 1;
  wkPicker.style.display = show ? '' : 'none';
  if (!show) return;
  let html = '';
  for (let w = 1; w <= 12; w++) {
    const r = gdgAngHistWeekRange(w);
    html += `<option value="${w}"${w === _gdgAngHistWeeksBack ? ' selected' : ''}>${r.label}</option>`;
  }
  wkPicker.innerHTML = html;
}

function gdgAngHistWkPickerChange(val) {
  _gdgAngHistWeeksBack = parseInt(val, 10) || 1;
  gdgAngHistRender();
}

async function gdgAngHistRender() {
  const listEl = document.getElementById('gdg-histpage-list');
  if (!listEl) return;
  const range = gdgAngHistCurrentRange();

  // Nama akun dari Variable Anggaran (satu list, dedupe by nama buat jaga-jaga).
  const seen = {};
  const namaList = [];
  _gdgAnggaranList.forEach(r => {
    const key = String(r.nama || '').trim().toLowerCase();
    if (!key || seen[key]) return;
    seen[key] = true;
    namaList.push(r.nama);
  });

  let totalCost = 0;
  if (!namaList.length) {
    listEl.innerHTML = '<div style="color:var(--ink3);font-style:italic;padding:10px 2px">Belum ada akun di Variable Anggaran. Tekan [Pilih] buat aktifkan.</div>';
  } else {
    let html = '';
    namaList.forEach(nama => {
      const akun = _gdgWAkunAll.find(a =>
        (a.kelompok === 'beban' || a.kelompok === 'kewajiban') &&
        String(a.nama || '').trim().toLowerCase() === String(nama).trim().toLowerCase()
      );
      const total = akun ? gdgAngHistTotalByAkunId(akun.id, range.start, range.end) : 0;
      totalCost += total;
      const namaSafe = String(nama).replace(/&/g,'&amp;').replace(/</g,'&lt;');
      html += `<div class="gdg-histpage-item">
        <div class="gdg-histpage-top">
          <span class="gdg-histpage-nama">${namaSafe}</span>
          <span class="gdg-histpage-nom">${gdgFmt(total)}</span>
        </div>
        <div class="gdg-histpage-sub">${range.label}</div>
      </div>`;
    });
    listEl.innerHTML = html;
  }

  // Total Income (bulan yang sama) — dari gadag_pendapatan, ditampilin
  // bersanding sama Total Cost di 2 minicard atas, biar keliatan untung/
  // rugi kasarnya buat bulan yang lagi ditoggle.
  let totalIncome = 0;
  try {
    const pend = await dbGet('gadag_pendapatan', '&tanggal=gte.' + range.start + '&tanggal=lte.' + range.end) || [];
    totalIncome = pend.reduce((s, p) => s + (Number(p.total) || 0), 0);
  } catch(e) { console.error('Gagal load income History:', e.message); }

  const costEl = document.getElementById('gdg-histpage-cost-value');
  const incEl  = document.getElementById('gdg-histpage-income-value');
  if (costEl) costEl.textContent = gdgFmt(totalCost);
  if (incEl)  incEl.textContent  = gdgFmt(totalIncome);

  // Donut: proporsi Cost vs Income (bukan progress ke target — di halaman
  // ini gak ada target tunggal buat diacu), Cost & Income saling melengkapi
  // jadi 100%. Kalau dua-duanya 0, ring kosong.
  const totalGab = totalCost + totalIncome;
  const pctCost  = totalGab > 0 ? Math.round(totalCost / totalGab * 100) : 0;
  const pctInc   = totalGab > 0 ? 100 - pctCost : 0;
  gdgDonutApply('gdg-histpage-cost-donut', 'gdg-histpage-cost-donut-txt', pctCost, 'var(--danger)');
  gdgDonutApply('gdg-histpage-income-donut', 'gdg-histpage-income-donut-txt', pctInc, 'var(--ok)');
}

// Tombol [Pilih] di header History — buka form "Tambah Variable" yang
// SAMA persis kayak tombol + Tambah biasa (reuse modal-gdg-ang2 & validasi/
// simpan yang udah ada): (1) langsung buka picker akun-nya juga biar user
// gak perlu nge-tap field nama dulu, (2) set flag _gdgAngHistPilihActive
// buat trigger auto-isi nominal/tempo dari data terakhir pas akunnya
// dipilih (lihat gdgAngAkunPickerSelect).
async function gdgAngHistPilihAkun() {
  document.getElementById('gdg-ang2-edit-id').value = '';
  document.getElementById('gdg-ang2-nominal-input').value = '';
  document.getElementById('gdg-ang2-tempo-input').value = '';
  document.getElementById('gdg-ang2-modal-title').innerHTML = '<i class="ti ti-plus"></i> Aktifkan Akun';
  document.getElementById('gdg-ang2-modal-hapus').style.display = 'none';
  gdgAngModalToggleTempo(false);
  await gdgWEnsureAkunJurnal();
  gdgAngPopulateAkunSelect('');
  document.getElementById('modal-gdg-ang2').classList.add('open');
  gdgAngOpenSheet();
  _gdgAngHistPilihActive = true;
  gdgAngAkunPickerOpen();
}

// Render list TERPADU — sumbernya SATU (_gdgAnggaranList, nominal bulanan).
// Mode Mingguan: nominal ÷4, realisasi minggu berjalan (Minggu-Sabtu).
// Mode Bulanan: nominal penuh, realisasi bulan kalender berjalan. Tempo
// (kalau diisi) cuma badge info "tgl X" — gak ngaruh ke realisasi/status,
// SEMUA item (ada Tempo atau nggak) diukur sama rata pakai cara di atas.
function gdgAngRenderList() {
  const listEl    = document.getElementById('gdg-ang2-list');
  const netEl     = document.getElementById('gdg-ang2-net');
  const wkLabelEl = document.getElementById('gdg-ang2-week-label');
  const mingguan  = _gdgAngPeriodeAktif !== 'bulanan';
  const divisor   = mingguan ? 4 : 1;

  if (netEl) netEl.textContent = gdgFmt(gdgAngNetTotal() / divisor);

  let isoStart, isoEnd;
  if (mingguan) {
    const wkStart = gdgWGetMonday(new Date());
    const wkEnd   = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6);
    isoStart = gdgWToISO(wkStart); isoEnd = gdgWToISO(wkEnd);
    if (wkLabelEl) wkLabelEl.textContent = 'Minggu ' + gdgWFmtRange(wkStart, wkEnd);
  } else {
    const now = new Date();
    const bStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const bEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    isoStart = gdgWToISO(bStart); isoEnd = gdgWToISO(bEnd);
    if (wkLabelEl) wkLabelEl.textContent = bStart.toLocaleDateString('id-ID', { month:'long', year:'numeric' });
  }

  gdgAngUpdateCostCard();

  let totalDiserap = 0;
  let rowsHtml = '';
  if (!_gdgAnggaranList.length) {
    rowsHtml = '<div style="color:var(--ink3);font-style:italic;padding:10px 0">Belum ada Variable Anggaran. Tekan + Tambah buat mulai.</div>';
  } else {
    rowsHtml = `<div class="gdg-ang2-thead">
      <span class="gdg-ang2-th-nama">Variable</span>
      <span class="gdg-ang2-th-tempo">Tempo</span>
      <span class="gdg-ang2-th-idr">IDR</span>
    </div>`;
    _gdgAnggaranList.forEach((it, i) => {
      const namaSafe = String(it.nama || '—').replace(/&/g,'&amp;').replace(/</g,'&lt;');
      const namaAttr = namaSafe.replace(/"/g,'&quot;');
      const nom = (Number(it.target) || 0) / divisor;
      const realisasi = gdgAngHitungRealisasi(it.nama, isoStart, isoEnd);
      totalDiserap += realisasi;
      const pct = nom > 0 ? Math.round((realisasi / nom) * 100) : 0;
      const pctClamped = Math.max(0, Math.min(100, pct)); // lebar bar dibatasi 0-100
      // Threshold warna: 0-35% hijau, 35-75% kuning, 75-100%+ merah
      let barColor = 'var(--ok)';
      if (pct >= 75) barColor = 'var(--danger)';
      else if (pct >= 35) barColor = 'var(--warn)';
      const tempoTxt = it.tgl_jatuh_tempo ? ('tgl ' + it.tgl_jatuh_tempo) : '—';
      rowsHtml += `<div class="gdg-ang2-row" data-id="${it.id}" data-nama="${namaAttr}" data-nominal="${Number(it.target)||0}" data-jatuhtempo="${it.tgl_jatuh_tempo || ''}">
        <div class="gdg-ang2-top">
          <span class="gdg-ang2-idx">${i+1}.</span>
          <span class="gdg-ang2-nama">${namaSafe}</span>
          <span class="gdg-ang2-tempo">${tempoTxt}</span>
          <span class="gdg-ang2-nom">${gdgFmt(nom)}</span>
        </div>
        <div class="gdg-ang2-bar-wrap">
          <div class="gdg-ang2-bar-track"><div class="gdg-ang2-bar-fill" style="width:${pctClamped}%;background:${barColor}"></div></div>
          <span class="gdg-ang2-bar-pct" style="color:${barColor}">${pct}%</span>
        </div>
      </div>`;
    });
  }
  if (listEl) listEl.innerHTML = rowsHtml;

  // Card Penyerapan — halaman Anggaran (angkanya ngikutin mode Mingguan/
  // Bulanan yang lagi aktif, terpisah dari Card Cost Overview yang SELALU
  // mingguan — lihat gdgAngUpdateCostCard).
  const netTotal = gdgAngNetTotal() / divisor;
  const pctTotal = netTotal > 0 ? Math.round((totalDiserap / netTotal) * 100) : 0;
  let pctColor = 'var(--ok)';
  if (pctTotal >= 75) pctColor = 'var(--danger)';
  else if (pctTotal >= 35) pctColor = 'var(--warn)';
  const nilaiEl = document.getElementById('gdg-ang2-diserap-nilai');
  if (nilaiEl) nilaiEl.textContent = gdgFmt(totalDiserap);
  gdgAngSetDonut(pctTotal, pctColor);
}


// Realisasi = total nominal jurnal minggu berjalan pada akun (Beban ATAU
// Kewajiban) yang nama-nya cocok (case-insensitive) dengan nama variable
// anggaran. Gak ada filter kode prefix lagi — samain sama sumber picker di
// gdgAngPopulateAkunSelect.
function gdgAngHitungRealisasi(namaVariable, isoStart, isoEnd) {
  const target = String(namaVariable || '').trim().toLowerCase();
  if (!target) return 0;
  const akun = _gdgWAkunAll.find(a =>
    (a.kelompok === 'beban' || a.kelompok === 'kewajiban') &&
    String(a.nama || '').trim().toLowerCase() === target
  );
  if (!akun) return 0;
  let total = 0;
  _gdgWJurnalAll.forEach(r => {
    if (r.tanggal < isoStart || r.tanggal > isoEnd) return;
    const n = r.nominal || r.debit || r.kredit || 0;
    if (r.akun_debit_id  === akun.id) total += n;
    if (r.akun_kredit_id === akun.id) total -= n;
  });
  return total;
}

// Siapin daftar Nama akun buat picker Tambah Variable. Sumbernya SEMUA akun
// kelompok Beban + Kewajiban dari kas_akun — TIDAK ada filter kode prefix lagi
// (dulu dibatasin ke 5-xxx kecuali 5-001, sekarang dibuang: Alley yang milih
// sendiri akun mana yang relevan tiap kali bikin Variable, itu bentuk "kendali"-nya,
// bukan whitelist/toggle di sistem).
// selectedNama: kalau ada & ga ketemu di daftar akun (mis. akun udah dihapus/
// diganti nama), tetep dianggep valid biar data lama ga ilang dari tampilan.
let _gdgAngAkunCache = [];
function gdgAngPopulateAkunSelect(selectedNama) {
  const inp = document.getElementById('gdg-ang2-nama-input');
  if (!inp) return;
  _gdgAngAkunCache = _gdgWAkunAll
    .filter(a => a.kelompok === 'beban' || a.kelompok === 'kewajiban')
    .sort((a, b) => (a.kode || '').localeCompare(b.kode || ''));
  inp.value = selectedNama || '';
}

// ─── PICKER AKUN — bottom-sheet full (pola sama kayak kasAkunPickerOpen di
// kas.js): di-append ke document.body sendiri, overlay+sheet z-index di atas
// modal Tambah Variable (z:300), search auto-fokus, list di-grouping per
// kelompok (Kewajiban / Beban). Ganti dropdown absolute lama yang kehalang
// field Nominal di bawahnya pas sheet Tambah Variable-nya sendiri kepotong.
var _gdgAkunPickerVpHandler = null;

function _gdgAkunPickerInject() {
  if (document.getElementById('gdg-akunpicker-overlay')) return;
  document.body.insertAdjacentHTML('beforeend', `
<div id="gdg-akunpicker-overlay" class="gdg-akunpicker-overlay" onclick="if(event.target===this)gdgAngAkunPickerClose()"></div>
<div id="gdg-akunpicker-sheet" class="gdg-akunpicker-sheet">
  <div class="gdg-akunpicker-handle"><span></span></div>
  <div class="gdg-akunpicker-titlebar">
    <div class="gdg-akunpicker-title">Pilih Akun</div>
    <button type="button" class="gdg-akunpicker-close" onclick="gdgAngAkunPickerClose()" title="Batal">&#10005;</button>
  </div>
  <div class="gdg-akunpicker-search-wrap">
    <input type="text" id="gdg-akunpicker-search" class="gdg-akunpicker-search"
      placeholder="Cari akun..." oninput="gdgAngAkunPickerRender(this.value)">
  </div>
  <div id="gdg-akunpicker-list" class="gdg-akunpicker-list"></div>
</div>`);
  if (!document.getElementById('gdg-akunpicker-style')) {
    const st = document.createElement('style');
    st.id = 'gdg-akunpicker-style';
    st.textContent = `
      .gdg-akunpicker-overlay{display:none;position:fixed;inset:0;z-index:850;background:rgba(0,0,0,.55);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
      .gdg-akunpicker-overlay.open{display:block}
      .gdg-akunpicker-sheet{position:fixed;left:0;right:0;bottom:0;z-index:851;background:var(--gdg-paper,#f2ede1);border-radius:18px 18px 0 0;transform:translateY(100%);transition:transform .28s cubic-bezier(.32,.72,0,1),bottom .15s ease;padding-bottom:env(safe-area-inset-bottom,16px);max-height:75vh;display:none;flex-direction:column;overflow:hidden}
      .gdg-akunpicker-sheet.open{display:flex;transform:translateY(0)}
      .gdg-akunpicker-handle{flex:none;display:flex;justify-content:center;padding:10px 0 6px}
      .gdg-akunpicker-handle span{width:40px;height:5px;border-radius:3px;background:var(--gdg-ink,#262220);opacity:.35}
      .gdg-akunpicker-title{flex:none;padding:0 16px 8px;font-weight:800;font-size:15px;color:var(--gdg-ink,#262220)}
      .gdg-akunpicker-titlebar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding-right:8px}
      .gdg-akunpicker-titlebar .gdg-akunpicker-title{padding-bottom:8px}
      .gdg-akunpicker-close{flex:none;background:none;border:none;font-size:20px;cursor:pointer;color:var(--gdg-ink3,#7a746c);line-height:1;padding:4px 8px}
      .gdg-akunpicker-search-wrap{flex:none;padding:0 16px 10px}
      .gdg-akunpicker-search{width:100%;box-sizing:border-box;border:2px solid var(--gdg-ink,#262220);border-radius:10px;padding:9px 12px;font-family:var(--f);font-size:14px;background:#fff;color:var(--gdg-ink,#262220);outline:none}
      .gdg-akunpicker-list{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 10px 12px}
      .gdg-akunpicker-group{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--gdg-ink3,#7a746c);padding:10px 8px 4px}
      .gdg-akunpicker-item{padding:11px 10px;font-size:14px;border-radius:8px;cursor:pointer;color:var(--gdg-ink,#262220)}
      .gdg-akunpicker-item:active,.gdg-akunpicker-item.active{background:var(--gdg-paper2,#e9e2d3)}
      .gdg-akunpicker-item-disabled{opacity:.5;cursor:default;pointer-events:none}
      .gdg-akunpicker-empty{padding:16px 10px;color:var(--gdg-ink3,#7a746c);font-style:italic;font-size:13px}
      @media (min-width:900px){
        .gdg-akunpicker-sheet{left:50%;right:auto;bottom:50%;transform:translate(-50%,50%) scale(.96);width:100%;max-width:380px;border-radius:16px;max-height:70vh;opacity:0;transition:transform .2s ease,opacity .2s ease}
        .gdg-akunpicker-sheet.open{transform:translate(-50%,50%) scale(1);opacity:1}
      }`;
    document.head.appendChild(st);
  }
}

function gdgAngAkunPickerOpen() {
  _gdgAkunPickerInject();
  const searchEl = document.getElementById('gdg-akunpicker-search');
  if (searchEl) searchEl.value = '';
  gdgAngAkunPickerRender('');

  const overlay = document.getElementById('gdg-akunpicker-overlay');
  const sheet   = document.getElementById('gdg-akunpicker-sheet');
  if (overlay) overlay.classList.add('open');
  if (sheet)   sheet.classList.add('open');

  if (window.visualViewport) {
    _gdgAkunPickerVpHandler = _gdgAkunPickerReposition;
    window.visualViewport.addEventListener('resize', _gdgAkunPickerVpHandler);
  }
  _gdgAkunPickerReposition();

  setTimeout(function() {
    if (searchEl) searchEl.focus({ preventScroll: true });
    _gdgAkunPickerReposition();
  }, 280);
}

function gdgAngAkunPickerClose() {
  const overlay = document.getElementById('gdg-akunpicker-overlay');
  const sheet   = document.getElementById('gdg-akunpicker-sheet');
  if (sheet)   sheet.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  const searchEl = document.getElementById('gdg-akunpicker-search');
  if (searchEl) searchEl.blur();
  if (sheet) sheet.style.bottom = '';
  if (_gdgAkunPickerVpHandler && window.visualViewport) {
    window.visualViewport.removeEventListener('resize', _gdgAkunPickerVpHandler);
    _gdgAkunPickerVpHandler = null;
  }
}

function _gdgAkunPickerReposition() {
  const sheet = document.getElementById('gdg-akunpicker-sheet');
  if (!sheet || !sheet.classList.contains('open') || !window.visualViewport) return;
  if (window.matchMedia && window.matchMedia('(min-width: 900px)').matches) return;
  const vp  = window.visualViewport;
  const kbH = Math.max(0, window.innerHeight - vp.height - vp.offsetTop);
  const TOP_GAP = 90; // jarak aman dari status bar (jam/wifi/baterai/signal) — jangan nempel/ketutup
  sheet.style.bottom    = kbH + 'px';
  sheet.style.maxHeight = Math.max(240, vp.height - TOP_GAP) + 'px';
}

function gdgAngAkunPickerRender(q) {
  const listEl = document.getElementById('gdg-akunpicker-list');
  if (!listEl) return;
  const inp = document.getElementById('gdg-ang2-nama-input');
  const currentVal = inp ? inp.value.trim().toLowerCase() : '';

  // Akun yang UDAH ada di Variable Anggaran bulan berjalan — di-disable di
  // picker, biar gak bisa milih dobel (row yang lagi diedit dikecualiin,
  // biar akun sendiri gak ke-disable pas mode Edit).
  const editId   = (document.getElementById('gdg-ang2-edit-id') || {}).value.trim();
  const aktifSet = {};
  _gdgAnggaranList.forEach(r => { if (String(r.id) !== editId) aktifSet[String(r.nama || '').trim().toLowerCase()] = true; });

  q = (q || '').toLowerCase().trim();
  let akunList = _gdgAngAkunCache.slice();
  if (q) akunList = akunList.filter(a => String(a.nama || '').toLowerCase().indexOf(q) !== -1);

  const order = ['kewajiban', 'beban'];
  const label = { kewajiban: 'Kewajiban', beban: 'Beban' };
  const grouped = {}; order.forEach(k => grouped[k] = []);
  akunList.forEach(a => { if (grouped[a.kelompok]) grouped[a.kelompok].push(a); });

  let html = '';
  order.forEach(k => {
    if (!grouped[k].length) return;
    html += '<div class="gdg-akunpicker-group">' + label[k] + '</div>';
    grouped[k].forEach(a => {
      const nama    = String(a.nama || '');
      const esc     = nama.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
      const escAttr = esc.replace(/'/g,"\\'");
      const isActive = nama.trim().toLowerCase() === currentVal;
      const sudahAktif = aktifSet[nama.trim().toLowerCase()];
      if (sudahAktif) {
        html += `<div class="gdg-akunpicker-item gdg-akunpicker-item-disabled">${esc} <span style="color:var(--gdg-ink3,#7a746c);font-weight:400">· sudah aktif</span></div>`;
      } else {
        html += `<div class="gdg-akunpicker-item${isActive ? ' active' : ''}" onclick="gdgAngAkunPickerSelect('${escAttr}')">${esc}</div>`;
      }
    });
  });
  listEl.innerHTML = html || '<div class="gdg-akunpicker-empty">Belum ada akun Beban/Kewajiban</div>';
}

async function gdgAngAkunPickerSelect(nama) {
  const inp = document.getElementById('gdg-ang2-nama-input');
  if (inp) inp.value = nama;
  gdgAngAkunPickerClose();

  // Dipicu dari tombol [Pilih] History — auto-isi Nominal (& Jatuh Tempo
  // kalau ada) dari row TERAKHIR akun ini di gadag_anggaran, biar user
  // tinggal review/edit, bukan mulai dari kosong. Cuma jalan pas Tambah baru
  // (edit-id kosong) — pas Edit row yang udah ada, nominalnya emang udah
  // keisi dari row itu sendiri, jangan ketiban.
  if (_gdgAngHistPilihActive) {
    _gdgAngHistPilihActive = false;
    const editId = document.getElementById('gdg-ang2-edit-id').value.trim();
    if (!editId) {
      try {
        const rows = await dbGet('gadag_anggaran', '&nama=eq.' + encodeURIComponent(nama) + '&order=id.desc&limit=1');
        const last = rows && rows[0];
        if (last) {
          const nomEl = document.getElementById('gdg-ang2-nominal-input');
          if (nomEl && Number(last.target) > 0) nomEl.value = Number(last.target).toLocaleString('id-ID');
          if (last.tgl_jatuh_tempo) {
            gdgAngModalToggleTempo(true);
            const tempoEl = document.getElementById('gdg-ang2-tempo-input');
            if (tempoEl) tempoEl.value = last.tgl_jatuh_tempo;
          }
        }
      } catch(e) { console.error('Gagal ambil nominal sebelumnya:', e.message); }
    }
  }
}

// ─── MODAL: tambah baru ─────────────────────────────────────────
// Toggle "Jatuh Tempo" — OPSIONAL, default OFF. force (opsional): true/false
// buat set eksplisit (dipakai auto-fill History), kalau gak dikasih ya
// nge-toggle dari state sekarang (dipanggil dari klik tombol).
function gdgAngModalToggleTempo(force) {
  const btn = document.getElementById('gdg-ang2-tempo-toggle');
  const aktifEl = document.getElementById('gdg-ang2-tempo-aktif');
  const fieldsEl = document.getElementById('gdg-ang2-bulanan-fields');
  const aktif = typeof force === 'boolean' ? force : aktifEl.value !== '1';
  aktifEl.value = aktif ? '1' : '0';
  if (btn) btn.classList.toggle('active', aktif);
  if (fieldsEl) fieldsEl.style.display = aktif ? 'block' : 'none';
  if (!aktif) {
    const tempoEl = document.getElementById('gdg-ang2-tempo-input');
    if (tempoEl) tempoEl.value = '';
  }
}

async function gdgAngShowAdd() {
  document.getElementById('gdg-ang2-edit-id').value = '';
  document.getElementById('gdg-ang2-nominal-input').value = '';
  document.getElementById('gdg-ang2-tempo-input').value = '';
  document.getElementById('gdg-ang2-modal-title').innerHTML = '<i class="ti ti-plus"></i> Tambah Variable';
  document.getElementById('gdg-ang2-modal-hapus').style.display = 'none';
  gdgAngModalToggleTempo(false);
  await gdgWEnsureAkunJurnal();
  gdgAngPopulateAkunSelect('');
  document.getElementById('modal-gdg-ang2').classList.add('open');
  gdgAngOpenSheet();
}

// Dipanggil dari tekan-tahan row (IIFE di bawah) — bukan dari kolom Aksi
async function gdgAngShowEdit(row) {
  const id       = row.dataset.id;
  const nama     = row.dataset.nama;
  const nominal  = row.dataset.nominal;
  const tempo    = row.dataset.jatuhtempo || '';
  document.getElementById('gdg-ang2-edit-id').value = id;
  document.getElementById('gdg-ang2-nominal-input').value = nominal ? Number(nominal).toLocaleString('id-ID') : '';
  document.getElementById('gdg-ang2-tempo-input').value = tempo;
  document.getElementById('gdg-ang2-modal-title').innerHTML = '<i class="ti ti-edit"></i> Edit Variable';
  document.getElementById('gdg-ang2-modal-hapus').style.display = '';
  gdgAngModalToggleTempo(!!tempo);
  await gdgWEnsureAkunJurnal();
  gdgAngPopulateAkunSelect(nama || '');
  document.getElementById('modal-gdg-ang2').classList.add('open');
  gdgAngOpenSheet();
}

function gdgAngCloseModal() {
  gdgAngAkunPickerClose();
  const overlay = document.getElementById('modal-gdg-ang2');
  const sheet   = document.getElementById('gdg-ang2-sheet');
  if (!overlay) return;
  if (sheet && window.matchMedia('(max-width:900px)').matches) {
    overlay.classList.remove('gdg-sheet-in');
    sheet.style.transform = '';
    setTimeout(function() {
      overlay.classList.remove('open');
      overlay.style.height    = '';
      overlay.style.transform = '';
    }, 260);
  } else {
    overlay.classList.remove('open');
  }
}

async function gdgAngSimpan() {
  const id      = document.getElementById('gdg-ang2-edit-id').value.trim();
  const nama    = document.getElementById('gdg-ang2-nama-input').value.trim();
  const rawNom  = (document.getElementById('gdg-ang2-nominal-input').value || '').replace(/\D/g,'');
  const nominal = parseInt(rawNom, 10) || 0;
  const tempoAktif = document.getElementById('gdg-ang2-tempo-aktif').value === '1';

  if (!nama)                     { alert('Pilih akun dulu.'); return; }
  if (!nominal || nominal <= 0)  { alert('Nominal harus lebih dari 0.'); return; }

  let tempoDay = null;
  if (tempoAktif) {
    tempoDay = parseInt(document.getElementById('gdg-ang2-tempo-input').value, 10);
    if (!tempoDay || tempoDay < 1 || tempoDay > 28) { alert('Jatuh Tempo diaktifkan tapi tanggalnya belum diisi (1-28).'); return; }
  }

  // Cegah 2 Variable dengan nama akun yang SAMA nyangkut bareng — kalau
  // kejadian, realisasi (dihitung by NAMA akun, bukan by id) bakal
  // ke-double-count buat kedua row itu, dan totalnya (Net Anggaran/
  // Penyerapan) jadi salah. id yang lagi diedit dikecualiin dari pengecekan.
  const dup = _gdgAnggaranList.some(r => String(r.id) !== String(id) && String(r.nama||'').trim().toLowerCase() === nama.trim().toLowerCase());
  if (dup) { alert('"' + nama + '" udah ada di daftar Variable Anggaran. Tekan & tahan row yang udah ada buat edit nominalnya.'); return; }

  const bulanIni = gdgAngMonthStartISO(new Date());
  const payload = { periode: 'bulanan', nama, target: nominal, tgl_jatuh_tempo: tempoDay, minggu_mulai: bulanIni, tgl_reset: null };

  try {
    if (id) {
      await dbUpdate('gadag_anggaran', id, payload);
    } else {
      await dbInsert('gadag_anggaran', payload);
    }
    gdgAngCloseModal();
    gdgLoadAnggaran();
  } catch(e) {
    alert('Gagal simpan: ' + e.message);
  }
}

function gdgAngHapusDariModal() {
  const id = document.getElementById('gdg-ang2-edit-id').value.trim();
  if (!id) return;
  const nama = document.getElementById('gdg-ang2-nama-input').value || 'variable ini';
  confirmDelete('Hapus "' + nama + '" dari anggaran bulan ini?', async () => {
    try {
      await dbDelete('gadag_anggaran', id);
      gdgAngCloseModal();
      gdgLoadAnggaran();
    } catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// ─── Tekan & tahan row di list → masuk mode edit (bukan kolom Aksi) ──
// Sengaja bukan onclick biasa: tap sekali TIDAK ngapa-ngapain (sesuai
// spek), cuma tekan-tahan (~550ms) yang buka modal edit + tombol Hapus.
(function() {
  let _lpTimer = null, _lpRow = null;
  function _start(row) {
    _lpRow = row;
    row.classList.add('gdg-ang2-pressing');
    _lpTimer = setTimeout(function() {
      if (!_lpRow) return;
      const r = _lpRow;
      _clear();
      gdgAngShowEdit(r);
    }, 550);
  }
  function _clear() {
    clearTimeout(_lpTimer); _lpTimer = null;
    if (_lpRow) _lpRow.classList.remove('gdg-ang2-pressing');
    _lpRow = null;
  }
  document.addEventListener('touchstart', function(e) {
    const row = e.target.closest('#gdg-ang2-list .gdg-ang2-row');
    if (!row) return;
    _start(row);
  }, { passive: true });
  document.addEventListener('touchend',    _clear, { passive: true });
  document.addEventListener('touchmove',   _clear, { passive: true });
  document.addEventListener('touchcancel', _clear, { passive: true });

  // Mouse (desktop) — biar bisa dites di laptop juga, bukan cuma HP
  document.addEventListener('mousedown', function(e) {
    const row = e.target.closest('#gdg-ang2-list .gdg-ang2-row');
    if (!row) return;
    _start(row);
  });
  document.addEventListener('mouseup',    _clear);
  document.addEventListener('mouseleave', _clear);
})();

// Card 4 versi mobile: (pendapatan minggu ini) − (Net Anggaran minggu ini).
// SELALU minggu berjalan (hari ini), independen dari minggu yg lagi
// dibrowse di navigator Ringkasan — biar ga rancu sama konsep "target".
function gdgUpdateTargetCard() {
  const wkStart  = gdgWGetMonday(new Date());
  const wkEnd    = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6);
  const isoMulai = gdgWToISO(wkStart), isoAkhir = gdgWToISO(wkEnd);
  const pendMingguIni = _gdgPendapatanList
    .filter(p => p.tanggal >= isoMulai && p.tanggal <= isoAkhir)
    .reduce((s,p) => s + (Number(p.total)||0), 0);
  const netAnggaran = gdgAngNetTotalMingguan();
  const sisa = pendMingguIni - netAnggaran;
  const sisaFmt = gdgFmt(sisa);
  const siColor = sisa >= 0 ? 'var(--ok)' : 'var(--danger)';
  const subTxt  = 'Target: ' + gdgFmt(netAnggaran);

  // Sisa % dari pendapatan real minggu berjalan, setelah dipotong Net Anggaran.
  // pendMingguIni = 0 → gak bisa dihitung persen, tampilin "—".
  let pctTxt = '—';
  if (pendMingguIni > 0) {
    const sisaPct = Math.round((sisa / pendMingguIni) * 100);
    pctTxt = 'Sisa ' + sisaPct + '% dari pendapatan';
  }

  // Mobile card — donat gantiin 2 baris teks (Target: Rp.. / Sisa ..% dari
  // pendapatan) yang bikin card ini paling tinggi & narik tinggi seisi grid.
  // Donat nunjukin % anggaran yang udah ketutup pendapatan minggu ini
  // (netAnggaran/pendMingguIni) — makin ijo makin aman, makin merah berarti
  // anggaran udah/hampir ngelebihin pendapatan.
  const el = document.getElementById('gdg-metric-target');
  if (el) { el.textContent = sisaFmt; el.style.color = siColor; }
  if (pendMingguIni > 0) {
    const usedPct = Math.round((netAnggaran / pendMingguIni) * 100);
    let usedColor = 'var(--ok)';
    if (usedPct >= 100) usedColor = 'var(--danger)';
    else if (usedPct >= 60) usedColor = 'var(--warn)';
    gdgTargetSetDonut(usedPct, usedColor, usedPct + '%');
  } else {
    gdgTargetSetDonut(0, 'var(--ink3)', '—');
  }

  // Desktop card ke-4 — TETEP teks (space lega, gak masalah kayak di mobile)
  const elD = document.getElementById('gdg-metric-target-d');
  if (elD) { elD.textContent = sisaFmt; elD.style.color = siColor; }
  const subElD = document.getElementById('gdg-metric-target-sub-d');
  if (subElD) subElD.textContent = subTxt;
  const pctElD = document.getElementById('gdg-metric-target-pct-d');
  if (pctElD) { pctElD.textContent = pctTxt; pctElD.style.color = siColor; }
}

// ─── LOAD (semua data, tidak difilter minggu — Catatan Pendapatan & Kelola Produk) ──
async function gdgHandleRefresh() {
  const btn = document.getElementById('gdg-hdr-refresh');
  if (btn) btn.classList.add('gdg-spinning');
  try {
    // BUG PENTING: _gdgWJurnalAll/_gdgWAkunAll (dipakai buat ngitung realisasi/
    // progress SEMUA Variable Anggaran, Mingguan maupun Bulanan) di-cache SEKALI
    // doang seumur sesi lewat gdgWEnsureAkunJurnal() (guard _gdgWAkunLoaded).
    // Kalau user abis nyatet pembayaran di Kas & Jurnal terus balik ke Gadag
    // TANPA reload penuh, progress-nya bisa nyangkut/gak keupdate walau
    // pembayarannya udah beneran kecatet. Makanya refresh manual WAJIB reset
    // cache ini juga, bukan cuma reload SKU/Catatan Pendapatan doang.
    _gdgWAkunLoaded = false;
    await gdgLoad();          // SKU + Catatan Pendapatan
    await gdgLoadAnggaran();  // Anggaran Mingguan+Bulanan + jurnal (realisasi) + Overview cards, full refresh
  } finally {
    if (btn) btn.classList.remove('gdg-spinning');
  }
}

async function gdgLoad() {
  const skuTbody  = document.getElementById('gdg-sku-tbody');
  const pendTbody = document.getElementById('gdg-pend-tbody');
  skuTbody.innerHTML  = '<tr><td colspan="2" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';
  pendTbody.innerHTML = '<tr><td colspan="6" style="color:var(--ink3);font-style:italic">Memuat...</td></tr>';

  try {
    const [skuAll, pendAll] = await Promise.all([
      dbGet('gadag_sku', '&order=nama.asc'),
      dbGet('gadag_pendapatan', '&order=tanggal.desc,id.desc'),
    ]);

    _gdgSkuList        = skuAll  || [];
    _gdgPendapatanList = pendAll || [];

    gdgRenderSku();
    gdgRenderPendapatan();
    if (_gdgHistWeekStart) gdgHistRenderWeek(); // refresh Riwayat juga kalau lagi/udah pernah kebuka
    const skuMetricEl = document.getElementById('gdg-metric-sku');
    if (skuMetricEl) skuMetricEl.textContent = _gdgSkuList.length;
    gdgUpdateTargetCard();
  } catch(e) {
    skuTbody.innerHTML  = `<tr><td colspan="2" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
    pendTbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger)">Error: ${e.message}</td></tr>`;
  }
}

// ─── RENDER: SKU ──────────────────────────────────────────────
// Ga ada kolom Aksi lagi — tekan lama baris buat edit/hapus (_gdgInitLongPress,
// sama pola kayak Catatan Pendapatan/Riwayat, cuma callback-nya beda: buka
// modal SKU, bukan modal Pendapatan).
function gdgRenderSku() {
  const tbody = document.getElementById('gdg-sku-tbody');
  const countEl = document.getElementById('gdg-sku-count');
  if (countEl) countEl.textContent = _gdgSkuList.length + ' SKU';
  if (!_gdgSkuList.length) {
    tbody.innerHTML = '<tr><td colspan="2" style="color:var(--ink3);font-style:italic">Belum ada SKU. Tambah dulu.</td></tr>';
    return;
  }
  tbody.innerHTML = _gdgSkuList.map(s => {
    const safeNama = String(s.nama || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
    return `<tr data-id="${s.id}" data-nama="${safeNama}" data-ongkos="${s.ongkos_lusin||0}" style="cursor:pointer">
      <td><b>${s.nama||'—'}</b></td>
      <td style="text-align:right">${gdgFmt(s.ongkos_lusin)}</td>
    </tr>`;
  }).join('');
  _gdgInitLongPress('gdg-sku-tbody', function(id, rowEl) {
    const nama   = rowEl.getAttribute('data-nama') || '';
    const ongkos = Number(rowEl.getAttribute('data-ongkos')) || 0;
    gdgShowSkuModal(id, nama, ongkos);
  });
}

// ─── RENDER: CATATAN PENDAPATAN (cuma minggu berjalan, Minggu–Sabtu) ──
// Data minggu lalu TETAP ADA di database, cuma pindah tampilannya ke panel Riwayat.
// Ga ada kolom Aksi lagi — tekan lama baris buat edit/hapus (lihat _gdgInitLongPress).
function gdgRenderPendapatan() {
  const tbody   = document.getElementById('gdg-pend-tbody');
  const countEl = document.getElementById('gdg-pend-count');
  const wkStart = gdgWGetMonday(new Date());
  const wkEnd   = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6);
  const isoMulai = gdgWToISO(wkStart), isoAkhir = gdgWToISO(wkEnd);
  const listMingguIni = _gdgPendapatanList.filter(p => p.tanggal >= isoMulai && p.tanggal <= isoAkhir);

  if (countEl) countEl.textContent = listMingguIni.length + ' catatan';
  if (!listMingguIni.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Belum ada catatan minggu ini. Data minggu lalu ada di menu Riwayat.</td></tr>';
    return;
  }
  tbody.innerHTML = listMingguIni.map(p => {
    const hariLabel = p.hari || gdgHariName(p.tanggal) || '—';
    return `<tr data-id="${p.id}" style="cursor:pointer">
      <td style="white-space:nowrap"><b>${hariLabel}</b></td>
      <td><b style="color:var(--accent)">${p.sku_nama||'—'}</b></td>
      <td>${p.warna||'—'}</td>
      <td style="text-align:right">${p.qty||0}</td>
      <td style="text-align:right"><b>${gdgFmt(p.total)}</b></td>
    </tr>`;
  }).join('');
  _gdgInitLongPress('gdg-pend-tbody');
}

// ─── LONG-PRESS baris tabel → buka modal dalam mode EDIT ─────
// Dipakai bareng buat #gdg-pend-tbody (Catatan Pendapatan), #gdg-hist-tbody
// (Riwayat), & #gdg-sku-tbody (Kelola Produk) — parameter tbodyId + onLongPress
// (opsional, default buka modal Pendapatan) biar satu fungsi ini dipakai ulang,
// gak perlu bikin versi kembar per tabel.
function _gdgInitLongPress(tbodyId, onLongPress) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody || tbody._gdgLongPressInited) return;
  tbody._gdgLongPressInited = true;
  const cb = onLongPress || function(id) { gdgShowPendapatanModal(id); };
  const HOLD_MS    = 500; // durasi tekan biar dianggap "tekan lama"
  const MOVE_LIMIT = 10;  // px — kalau jari geser lebih dari ini, batal (dianggap scroll)
  let _timer = null, _startX = 0, _startY = 0, _row = null;

  function cancel() { if (_timer) { clearTimeout(_timer); _timer = null; } _row = null; }

  tbody.addEventListener('touchstart', function(e) {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    _row   = tr;
    _startX = e.touches[0].clientX;
    _startY = e.touches[0].clientY;
    _timer  = setTimeout(function() {
      if (navigator.vibrate) navigator.vibrate(15); // getar halus, konfirmasi tekan lama kena
      const r = _row;
      cancel();
      cb(r.getAttribute('data-id'), r);
    }, HOLD_MS);
  }, { passive: true });

  tbody.addEventListener('touchmove', function(e) {
    if (!_timer) return;
    const dx = Math.abs(e.touches[0].clientX - _startX);
    const dy = Math.abs(e.touches[0].clientY - _startY);
    if (dx > MOVE_LIMIT || dy > MOVE_LIMIT) cancel(); // jari geser → batal, biarin scroll normal
  }, { passive: true });

  tbody.addEventListener('touchend', cancel, { passive: true });
  tbody.addEventListener('touchcancel', cancel, { passive: true });

  // Desktop/laptop: mouse click-and-hold juga didukung (mousedown/mouseup)
  tbody.addEventListener('mousedown', function(e) {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    _row = tr;
    _timer = setTimeout(function() {
      const r = _row;
      cancel();
      cb(r.getAttribute('data-id'), r);
    }, HOLD_MS);
  });
  tbody.addEventListener('mouseup', cancel);
  tbody.addEventListener('mouseleave', cancel);
}

// ─── EXPORT PDF: Catatan Pendapatan minggu berjalan ────────────
// Render ke #gdg-print-area (tersembunyi normal), lalu window.print() —
// dialog print browser punya opsi "Save as PDF" bawaan, konsisten di
// Android & iPhone tanpa perlu library PDF eksternal.
function gdgExportPendapatanPDF() {
  const today    = new Date();
  const wkStart  = gdgWGetMonday(today); // Minggu (awal minggu kerja Gadag)
  const isoMulai = gdgWToISO(wkStart), isoAkhir = gdgWToISO(today);
  const list     = _gdgPendapatanList.filter(p => p.tanggal >= isoMulai && p.tanggal <= isoAkhir);
  const total    = list.reduce((s, p) => s + (p.total || 0), 0);

  const hariExport   = _gdgHariNames[today.getDay()].toUpperCase();
  const tglExportStr = String(today.getDate()).padStart(2, '0') + '-' +
                        String(today.getMonth() + 1).padStart(2, '0') + '-' +
                        today.getFullYear();

  const rows = list.length
    ? list.map((p, i) => {
        const hariLabel = p.hari || gdgHariName(p.tanggal) || '—';
        return `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd">${i + 1}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd">${hariLabel}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd">${p.sku_nama || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd">${p.warna || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${gdgFmt(p.ongkos_lusin)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${p.qty || 0}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${gdgFmt(p.total)}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="7" style="padding:10px 8px;color:#888;font-style:italic">Belum ada catatan minggu ini.</td></tr>';

  // Buka popup window baru berisi full HTML dokumen lalu print dari sana.
  // Pendekatan ini reliable di iOS Safari — berbeda dari visibility:hidden/visible
  // di halaman yang sama yang sering menghasilkan blank page di iPhone.
  const iconUrl = new URL('gadag-icon.png', location.href).href;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Catatan Pendapatan Gadag</title>
    <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; color: #000; background: #fff; padding: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tbody tr { page-break-inside: avoid; }
      @media print { body { padding: 0; } }
    </style>
  </head><body>
    <table>
      <thead>
        <tr><td colspan="7" style="padding:0 0 12px;border:none">
          <div style="border:1.5px solid #ddd;border-radius:10px;padding:12px 16px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
              <img src="${iconUrl}" alt="Gadag" style="width:40px;height:40px;object-fit:contain">
              <div style="font-size:12px;font-weight:700;color:#333">${hariExport}, ${tglExportStr}</div>
            </div>
            <div style="border-top:1px solid #ddd;margin:10px 0"></div>
            <div style="text-align:center;font-family:'Comic Neue','Comic Sans MS',cursive;font-weight:700;font-size:20px">CATATAN PENDAPATAN &mdash; GADAG</div>
            <div style="text-align:center;color:#777;font-size:11px;margin-top:2px">${gdgWFmtRange(wkStart, today)} &middot; ${list.length} catatan</div>
          </div>
        </td></tr>
        <tr style="border-bottom:2px solid #000;text-align:left">
          <th style="padding:6px 8px">No</th><th style="padding:6px 8px">Hari</th>
          <th style="padding:6px 8px">SKU / Nama Produk</th><th style="padding:6px 8px">Warna</th>
          <th style="padding:6px 8px;text-align:right">Harga</th>
          <th style="padding:6px 8px;text-align:right">Qty</th>
          <th style="padding:6px 8px;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="border-top:2px solid #000;font-weight:700">
          <td colspan="6" style="padding:8px;text-align:right">SUM</td>
          <td style="padding:8px;text-align:right">${gdgFmt(total)}</td>
        </tr>
      </tfoot>
    </table>
    <script>window.onload = function() { window.print(); }<\/script>
  </body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) {
    // Popup diblokir (jarang di iOS) — fallback ke download file HTML
    const a = document.createElement('a');
    a.href = url; a.download = 'catatan-gadag.html'; a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function gdgExportRiwayatPDF() {
  const range    = gdgHistGetRange();
  const today    = new Date();
  const list     = _gdgPendapatanList.filter(p => p.tanggal >= range.isoStart && p.tanggal <= range.isoEnd);
  const total    = list.reduce((s, p) => s + (p.total || 0), 0);

  const hariExport   = _gdgHariNames[today.getDay()].toUpperCase();
  const tglExportStr = String(today.getDate()).padStart(2, '0') + '-' +
                        String(today.getMonth() + 1).padStart(2, '0') + '-' +
                        today.getFullYear();

  const rows = list.length
    ? list.map((p, i) => {
        const hariLabel = p.hari || gdgHariName(p.tanggal) || '—';
        return `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd">${i + 1}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd">${hariLabel}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd">${p.sku_nama || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd">${p.warna || '—'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${gdgFmt(p.ongkos_lusin)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${p.qty || 0}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${gdgFmt(p.total)}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="7" style="padding:10px 8px;color:#888;font-style:italic">Ga ada catatan di rentang ini.</td></tr>';

  // Buka popup window baru berisi full HTML dokumen lalu print dari sana.
  // Pendekatan ini reliable di iOS Safari — visibility:hidden/visible di halaman
  // yang sama sering menghasilkan blank page di iPhone.
  const iconUrl = new URL('gadag-icon.png', location.href).href;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Riwayat Catatan Gadag</title>
    <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; color: #000; background: #fff; padding: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tbody tr { page-break-inside: avoid; }
      @media print { body { padding: 0; } }
    </style>
  </head><body>
    <table>
      <thead>
        <tr><td colspan="7" style="padding:0 0 12px;border:none">
          <div style="border:1.5px solid #ddd;border-radius:10px;padding:12px 16px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
              <img src="${iconUrl}" alt="Gadag" style="width:40px;height:40px;object-fit:contain">
              <div style="font-size:12px;font-weight:700;color:#333">${hariExport}, ${tglExportStr}</div>
            </div>
            <div style="border-top:1px solid #ddd;margin:10px 0"></div>
            <div style="text-align:center;font-family:'Comic Neue','Comic Sans MS',cursive;font-weight:700;font-size:20px">RIWAYAT CATATAN &mdash; GADAG</div>
            <div style="text-align:center;color:#777;font-size:11px;margin-top:2px">${gdgWFmtRange(range.start, range.end)} &middot; ${list.length} catatan</div>
          </div>
        </td></tr>
        <tr style="border-bottom:2px solid #000;text-align:left">
          <th style="padding:6px 8px">No</th><th style="padding:6px 8px">Hari</th>
          <th style="padding:6px 8px">SKU / Nama Produk</th><th style="padding:6px 8px">Warna</th>
          <th style="padding:6px 8px;text-align:right">Harga</th>
          <th style="padding:6px 8px;text-align:right">Qty</th>
          <th style="padding:6px 8px;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="border-top:2px solid #000;font-weight:700">
          <td colspan="6" style="padding:8px;text-align:right">SUM</td>
          <td style="padding:8px;text-align:right">${gdgFmt(total)}</td>
        </tr>
      </tfoot>
    </table>
    <script>window.onload = function() { window.print(); }<\/script>
  </body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) {
    // Popup diblokir — fallback ke download file HTML
    const a = document.createElement('a');
    a.href = url; a.download = 'riwayat-gadag.html'; a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}


// state & DOM id sendiri (_gdgHist*, gdghist-*), BUKAN reuse langsung,
// biar kode Ringkasan Mingguan yang udah jalan sama sekali ga kesenggol.
let _gdgHistWeekStart   = null; // Date, Minggu 00:00 (dipakai minggu-ini & per-minggu)
let _gdgHistMode        = 'minggu-ini';
let _gdgHistCustomDari  = null;
let _gdgHistCustomSampai = null;
let _gdgHistBulanRef    = null; // Date referensi bulan (dipakai bulan-ini & per-bulan)

function _gdgHistEnsureModeMenu() {
  if (document.getElementById('gdghist-mode-menu')) return;
  const menu = document.createElement('div');
  menu.id = 'gdghist-mode-menu';
  menu.style.cssText = [
    'display:none', 'position:fixed', 'z-index:9999',
    'background:var(--gdg-paper,#f7f2e6)', 'border:2.5px solid var(--gdg-ink,#262220)',
    'border-radius:14px', 'min-width:160px', 'box-shadow:2px 4px 12px rgba(0,0,0,.28)',
    'overflow:hidden', "font-family:'Comic Neue','Comic Sans MS',cursive,sans-serif",
  ].join(';');
  const opts = [
    ['minggu-ini', 'Minggu Ini',  false],
    ['per-minggu', 'Per Minggu',  true],   // punya sub
    ['bulan-ini',  'Bulan Ini',   false],
    ['per-bulan',  'Per Bulan',   true],   // punya sub
    ['custom',     'Custom',      false],
  ];
  opts.forEach(([mode, label, hasSub]) => {
    const btn = document.createElement('button');
    btn.id = 'gdghist-opt-' + mode;
    btn.style.cssText = [
      'display:flex', 'align-items:center', 'justify-content:space-between',
      'width:100%', 'text-align:left', 'padding:10px 14px', 'background:none', 'border:none',
      'border-bottom:1px solid rgba(38,34,32,.1)', 'font-size:13px', 'font-weight:700', 'cursor:pointer',
      'color:var(--gdg-ink,#262220)', "font-family:'Comic Neue','Comic Sans MS',cursive,sans-serif",
    ].join(';');
    const span = document.createElement('span');
    span.textContent = label;
    btn.appendChild(span);
    if (hasSub) {
      const arrow = document.createElement('span');
      arrow.textContent = '▸';
      arrow.style.cssText = 'font-size:10px;opacity:.55;margin-left:6px;flex:none';
      btn.appendChild(arrow);
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); _gdgHistOpenSubMenu(mode, btn); });
    } else {
      btn.addEventListener('click', () => gdgHistSetMode(mode));
    }
    menu.appendChild(btn);
  });
  const last = menu.querySelector('button:last-child');
  if (last) last.style.borderBottom = 'none';
  document.body.appendChild(menu);
}

let _gdgHistSubMenuOpen = null;

function _gdgHistOpenSubMenu(mode, triggerBtn) {
  if (_gdgHistSubMenuOpen === mode) { _gdgHistCloseSubMenu(); return; }
  _gdgHistCloseSubMenu();
  _gdgHistSubMenuOpen = mode;

  const sub = document.createElement('div');
  sub.id = 'gdghist-sub-menu';
  sub.style.cssText = [
    'position:fixed', 'z-index:10000', 'background:var(--gdg-paper,#f7f2e6)',
    'border:2.5px solid var(--gdg-ink,#262220)', 'border-radius:14px', 'min-width:160px',
    'max-height:260px', 'overflow-y:auto', 'box-shadow:4px 6px 14px rgba(0,0,0,.32)',
    "font-family:'Comic Neue','Comic Sans MS',cursive,sans-serif",
  ].join(';');

  const items = [];
  const now = new Date();
  if (mode === 'per-minggu') {
    for (let i = 0; i < 8; i++) {
      const ws = gdgWGetMonday(new Date());
      ws.setDate(ws.getDate() - i * 7);
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      items.push({ label: (i === 0 ? '▸ ' : '') + gdgWFmtRange(ws, we), ws: new Date(ws), we });
    }
  } else if (mode === 'per-bulan') {
    for (let i = 0; i < 8; i++) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      items.push({ label: (i === 0 ? '▸ ' : '') + _GDGW_BLN[ref.getMonth()] + ' ' + ref.getFullYear(), ref: new Date(ref) });
    }
  }

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.style.cssText = [
      'display:block', 'width:100%', 'text-align:left', 'padding:9px 14px', 'background:none', 'border:none',
      'border-bottom:1px solid rgba(38,34,32,.1)', 'font-size:12.5px', 'font-weight:700', 'cursor:pointer',
      'color:var(--gdg-ink,#262220)', "font-family:'Comic Neue','Comic Sans MS',cursive,sans-serif",
    ].join(';');
    btn.textContent = item.label;
    btn.addEventListener('click', () => {
      if (mode === 'per-minggu') { _gdgHistMode = 'per-minggu'; _gdgHistWeekStart = item.ws; }
      else                       { _gdgHistMode = 'per-bulan';  _gdgHistBulanRef  = item.ref; }
      const modeLabel = document.getElementById('gdghist-mode-label');
      if (modeLabel) modeLabel.textContent = item.label.replace('▸ ', '');
      ['minggu-ini','per-minggu','bulan-ini','per-bulan','custom'].forEach(m => {
        const el = document.getElementById('gdghist-opt-' + m);
        if (el) el.classList.toggle('active', m === mode);
      });
      const customEl = document.getElementById('gdghist-custom-range');
      if (customEl) customEl.style.display = 'none';
      _gdgHistCloseSubMenu();
      gdgHistCloseModeMenu();
      gdgHistRenderWeek();
    });
    sub.appendChild(btn);
  });
  const lastBtn = sub.querySelector('button:last-child');
  if (lastBtn) lastBtn.style.borderBottom = 'none';
  document.body.appendChild(sub);

  requestAnimationFrame(() => {
    const mainMenu = document.getElementById('gdghist-mode-menu');
    const tr = triggerBtn.getBoundingClientRect();
    const mw = sub.offsetWidth;
    const mainR = mainMenu ? mainMenu.getBoundingClientRect() : tr;
    let left = mainR.right + 4;
    if (left + mw > window.innerWidth - 8) left = mainR.left - mw - 4;
    if (left < 8) left = 8;
    sub.style.left = left + 'px';
    sub.style.top  = tr.top + 'px';
  });
}

function _gdgHistCloseSubMenu() {
  _gdgHistSubMenuOpen = null;
  const s = document.getElementById('gdghist-sub-menu');
  if (s) s.remove();
}

function gdgHistToggleModeMenu(e) {
  if (e) e.stopPropagation();
  _gdgHistEnsureModeMenu();
  const menu = document.getElementById('gdghist-mode-menu');
  const btn  = document.getElementById('gdghist-mode-btn');
  if (!menu || !btn) return;
  const isOpen = menu.style.display !== 'none';
  if (isOpen) { menu.style.display = 'none'; _gdgHistCloseSubMenu(); return; }
  const r = btn.getBoundingClientRect();
  menu.style.display = 'block';
  requestAnimationFrame(() => {
    let left = r.left;
    const mw = menu.offsetWidth;
    if (left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;
    if (left < 8) left = 8;
    menu.style.top  = (r.bottom + 4) + 'px';
    menu.style.left = left + 'px';
  });
}

function gdgHistCloseModeMenu() {
  const m = document.getElementById('gdghist-mode-menu');
  if (m) m.style.display = 'none';
  _gdgHistCloseSubMenu();
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('gdghist-mode-menu');
  const sub  = document.getElementById('gdghist-sub-menu');
  const btn  = document.getElementById('gdghist-mode-btn');
  const clickedMenu = menu && menu.contains(e.target);
  const clickedSub  = sub  && sub.contains(e.target);
  const clickedBtn  = btn  && btn.contains(e.target);
  if (!menu || menu.style.display === 'none') return;
  if (!clickedMenu && !clickedSub && !clickedBtn) {
    menu.style.display = 'none';
    _gdgHistCloseSubMenu();
  }
});

function gdgHistSetMode(mode) {
  _gdgHistMode = mode;
  gdgHistCloseModeMenu();

  const modeLabelEl = document.getElementById('gdghist-mode-label');
  if (modeLabelEl) modeLabelEl.textContent = _GDGW_MODE_LABELS[mode] || mode;
  ['minggu-ini','per-minggu','bulan-ini','per-bulan','custom'].forEach(m => {
    const el = document.getElementById('gdghist-opt-' + m);
    if (el) el.classList.toggle('active', m === mode);
  });

  const customEl = document.getElementById('gdghist-custom-range');
  if (customEl) customEl.style.display = (mode === 'custom') ? 'flex' : 'none';

  if (mode === 'minggu-ini' || mode === 'per-minggu') {
    _gdgHistWeekStart = gdgWGetMonday(new Date());
  } else if (mode === 'bulan-ini' || mode === 'per-bulan') {
    _gdgHistBulanRef = new Date();
  } else if (mode === 'custom') {
    if (!_gdgHistCustomDari) {
      const ws = gdgWGetMonday(new Date());
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      _gdgHistCustomDari   = ws;
      _gdgHistCustomSampai = we;
      const dariEl   = document.getElementById('gdghist-custom-dari');
      const sampaiEl = document.getElementById('gdghist-custom-sampai');
      if (dariEl)   dariEl.value   = gdgWToISO(ws);
      if (sampaiEl) sampaiEl.value = gdgWToISO(we);
    }
  }
  gdgHistRenderWeek();
}

function gdgHistPrevWeek() {
  if (_gdgHistMode === 'minggu-ini') return;
  if (_gdgHistMode === 'per-minggu') {
    _gdgHistWeekStart.setDate(_gdgHistWeekStart.getDate() - 7);
  } else if (_gdgHistMode === 'bulan-ini') {
    return;
  } else if (_gdgHistMode === 'per-bulan') {
    _gdgHistBulanRef.setMonth(_gdgHistBulanRef.getMonth() - 1);
  } else if (_gdgHistMode === 'custom') {
    if (_gdgHistCustomDari && _gdgHistCustomSampai) {
      const dur = Math.round((_gdgHistCustomSampai - _gdgHistCustomDari) / 86400000) + 1;
      _gdgHistCustomDari.setDate(_gdgHistCustomDari.getDate() - dur);
      _gdgHistCustomSampai.setDate(_gdgHistCustomSampai.getDate() - dur);
      const dariEl   = document.getElementById('gdghist-custom-dari');
      const sampaiEl = document.getElementById('gdghist-custom-sampai');
      if (dariEl)   dariEl.value   = gdgWToISO(_gdgHistCustomDari);
      if (sampaiEl) sampaiEl.value = gdgWToISO(_gdgHistCustomSampai);
    }
  }
  gdgHistRenderWeek();
}
function gdgHistNextWeek() {
  if (_gdgHistMode === 'minggu-ini') return;
  if (_gdgHistMode === 'per-minggu') {
    _gdgHistWeekStart.setDate(_gdgHistWeekStart.getDate() + 7);
  } else if (_gdgHistMode === 'bulan-ini') {
    return;
  } else if (_gdgHistMode === 'per-bulan') {
    _gdgHistBulanRef.setMonth(_gdgHistBulanRef.getMonth() + 1);
  } else if (_gdgHistMode === 'custom') {
    if (_gdgHistCustomDari && _gdgHistCustomSampai) {
      const dur = Math.round((_gdgHistCustomSampai - _gdgHistCustomDari) / 86400000) + 1;
      _gdgHistCustomDari.setDate(_gdgHistCustomDari.getDate() + dur);
      _gdgHistCustomSampai.setDate(_gdgHistCustomSampai.getDate() + dur);
      const dariEl   = document.getElementById('gdghist-custom-dari');
      const sampaiEl = document.getElementById('gdghist-custom-sampai');
      if (dariEl)   dariEl.value   = gdgWToISO(_gdgHistCustomDari);
      if (sampaiEl) sampaiEl.value = gdgWToISO(_gdgHistCustomSampai);
    }
  }
  gdgHistRenderWeek();
}

function gdgHistCustomApply() {
  const dariVal   = document.getElementById('gdghist-custom-dari').value;
  const sampaiVal = document.getElementById('gdghist-custom-sampai').value;
  if (!dariVal || !sampaiVal) return;
  const d = dariVal.split('-').map(Number);
  const s = sampaiVal.split('-').map(Number);
  _gdgHistCustomDari   = new Date(d[0], d[1]-1, d[2]);
  _gdgHistCustomSampai = new Date(s[0], s[1]-1, s[2]);
  if (_gdgHistCustomSampai < _gdgHistCustomDari) {
    _gdgHistCustomSampai = new Date(_gdgHistCustomDari);
    document.getElementById('gdghist-custom-sampai').value = dariVal;
  }
  gdgHistRenderWeek();
}

// Helper: hitung range ISO dari mode aktif (port dari gdgWGetRange)
function gdgHistGetRange() {
  const now = new Date();
  if (_gdgHistMode === 'minggu-ini' || _gdgHistMode === 'per-minggu') {
    if (!_gdgHistWeekStart) _gdgHistWeekStart = gdgWGetMonday(now);
    const end = new Date(_gdgHistWeekStart); end.setDate(_gdgHistWeekStart.getDate() + 6);
    return { start: _gdgHistWeekStart, end, isoStart: gdgWToISO(_gdgHistWeekStart), isoEnd: gdgWToISO(end) };
  } else if (_gdgHistMode === 'bulan-ini') {
    const ref   = _gdgHistBulanRef || now;
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end   = new Date(ref.getFullYear(), ref.getMonth(), now.getDate());
    return { start, end, isoStart: gdgWToISO(start), isoEnd: gdgWToISO(end) };
  } else if (_gdgHistMode === 'per-bulan') {
    const ref   = _gdgHistBulanRef || now;
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end   = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return { start, end, isoStart: gdgWToISO(start), isoEnd: gdgWToISO(end) };
  } else if (_gdgHistMode === 'custom') {
    const s = _gdgHistCustomDari   || gdgWGetMonday(now);
    const e = _gdgHistCustomSampai || (() => { const x = new Date(s); x.setDate(s.getDate()+6); return x; })();
    return { start: s, end: e, isoStart: gdgWToISO(s), isoEnd: gdgWToISO(e) };
  }
  const ws = gdgWGetMonday(now);
  const we = new Date(ws); we.setDate(ws.getDate() + 6);
  return { start: ws, end: we, isoStart: gdgWToISO(ws), isoEnd: gdgWToISO(we) };
}

// Compat: dipanggil gdgApplyView() saat panel Riwayat pertama kali dibuka
function gdgHistThisWeek() { gdgHistSetMode('minggu-ini'); }

function gdgHistRenderWeek() {
  const range = gdgHistGetRange();
  const labelEl = document.getElementById('gdghist-range-label');
  if (labelEl) labelEl.textContent = gdgWFmtRange(range.start, range.end);

  const list  = _gdgPendapatanList.filter(p => p.tanggal >= range.isoStart && p.tanggal <= range.isoEnd);
  const total = list.reduce((s, p) => s + (p.total || 0), 0);

  const tbody   = document.getElementById('gdg-hist-tbody');
  const countEl = document.getElementById('gdg-hist-count');
  const totalEl = document.getElementById('gdghist-total-badge');
  if (countEl) countEl.textContent = list.length + ' catatan';
  if (totalEl) totalEl.textContent = gdgFmt(total);

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--ink3);font-style:italic">Ga ada catatan di rentang ini.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(p => {
    const hariLabel = p.hari || gdgHariName(p.tanggal) || '—';
    return `<tr data-id="${p.id}" style="cursor:pointer">
      <td style="white-space:nowrap"><b>${hariLabel}</b></td>
      <td><b style="color:var(--accent)">${p.sku_nama||'—'}</b></td>
      <td>${p.warna||'—'}</td>
      <td style="text-align:right">${p.qty||0}</td>
      <td style="text-align:right"><b>${gdgFmt(p.total)}</b></td>
    </tr>`;
  }).join('');
  _gdgInitLongPress('gdg-hist-tbody');
}

// ─── METRICS (TOTAL PENDAPATAN = utama) ───────────────────────
// (gdgUpdateMetrics lama dihapus — Total Pendapatan & Jumlah Qty/Lsn sekarang
// dihitung di gdgWRenderWeek() dari data mingguan, biar 1 sumber kebenaran)

// ─── FORMAT ───────────────────────────────────────────────────
function gdgFmt(n) {
  const num = Number(n)||0;
  return 'Rp' + Math.round(num).toLocaleString('id-ID');
}

function gdgFormatRibuan(el) {
  const raw = el.value.replace(/\D/g, '');
  el.value = raw ? Number(raw).toLocaleString('id-ID') : '';
}

// ─── MODAL: SKU ───────────────────────────────────────────────
function gdgShowSkuModal(id, nama, ongkos) {
  document.getElementById('gdg-sku-edit-id').value = id || '';
  document.getElementById('gdg-sku-nama').value     = nama || '';
  document.getElementById('gdg-sku-ongkos').value   = ongkos ? Number(ongkos).toLocaleString('id-ID') : '';
  document.getElementById('gdg-sku-modal-title').innerHTML = id
    ? '<i class="ti ti-edit"></i> Edit SKU'
    : '<i class="ti ti-plus"></i> Tambah SKU';
  const hapusBtn = document.getElementById('gdg-sku-modal-hapus');
  if (hapusBtn) hapusBtn.style.display = id ? '' : 'none';
  document.getElementById('modal-gdg-sku').classList.add('open');
  gdgSkuOpenSheet();
}

// ─── BOTTOM-SHEET: animasi masuk/keluar + drag-to-close + keyboard-safe (iOS) —
// modal Tambah/Edit SKU. Pola identik dengan gdgOpenPendSheet (Catatan
// Pendapatan), sengaja DIDUPLIKASI bukan digeneralisir/parameterized —
// ngikutin konvensi yang udah ada di file ini (biar kode yang udah
// proven-stable, kayak Pendapatan, ga ikut kesenggol kalau salah satu
// modal butuh penyesuaian lain nanti). Sebelum ini, modal SKU masih pakai
// `.modal-overlay`/`.modal` polos (center-align, position:fixed penuh
// viewport) — di iOS itu bikin modal "lompat ke atas" pas keyboard buka,
// karena position:fixed gak ikut nyusut pas keyboard muncul, jadi browser
// scroll seluruh context biar field yg difokus keliatan (6 Sep 2026,
// dilaporkan user lewat screenshot "Tambah SKU").
function gdgSkuOpenSheet() {
  const overlay = document.getElementById('modal-gdg-sku');
  const sheet   = document.getElementById('gdg-sku-sheet');
  if (!overlay || !sheet) return;
  sheet.style.transform = ''; // pastikan mulai dari posisi tertutup (translateY(100%) dari CSS)
  void overlay.offsetHeight; // reflow paksa biar posisi awal ke-render dulu
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('gdg-sheet-in');
  }));
  _gdgSkuSheetSyncViewport();
  if (window.visualViewport && !overlay._gdgVVInited) {
    overlay._gdgVVInited = true;
    window.visualViewport.addEventListener('resize', _gdgSkuSheetSyncViewport);
    window.visualViewport.addEventListener('scroll', _gdgSkuSheetSyncViewport);
  }
  _gdgInitSkuSheetDragToClose();
  _gdgInitSkuSheetFocusScroll();
}

function _gdgSkuSheetSyncViewport() {
  const overlay = document.getElementById('modal-gdg-sku');
  const sheet   = document.getElementById('gdg-sku-sheet');
  if (!overlay || !overlay.classList.contains('open')) return;
  if (!window.matchMedia('(max-width:900px)').matches) return; // cuma perlu di layout bottom-sheet (mobile)
  const vv = window.visualViewport;
  if (!vv) return;
  overlay.style.height    = vv.height + 'px';
  overlay.style.transform = 'translateY(' + vv.offsetTop + 'px)';
  if (sheet) sheet.style.maxHeight = Math.max(240, vv.height - 12) + 'px';
}

function _gdgInitSkuSheetFocusScroll() {
  const overlay = document.getElementById('modal-gdg-sku');
  if (!overlay || overlay._gdgFocusScrollInited) return;
  overlay._gdgFocusScrollInited = true;
  overlay.addEventListener('focusin', function(e) {
    const t = e.target;
    if (!(t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    setTimeout(function() {
      _gdgSkuSheetSyncViewport();
      t.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 320);
  });
}

function _gdgInitSkuSheetDragToClose() {
  const handle = document.getElementById('gdg-sku-sheet-handle');
  const sheet  = document.getElementById('gdg-sku-sheet');
  if (!handle || !sheet || handle._gdgDragInited) return;
  handle._gdgDragInited = true;
  var _startY = 0, _dragging = false, _dy = 0;
  handle.addEventListener('touchstart', function(e) {
    _startY   = e.touches[0].clientY;
    _dragging = true;
    sheet.style.transition = 'none';
  }, { passive: true });
  handle.addEventListener('touchmove', function(e) {
    if (!_dragging) return;
    _dy = Math.max(0, e.touches[0].clientY - _startY);
    sheet.style.transform = 'translateY(' + _dy + 'px)';
  }, { passive: true });
  handle.addEventListener('touchend', function() {
    if (!_dragging) return;
    _dragging = false;
    sheet.style.transition = '';
    if (_dy > 90) {
      gdgCloseSkuModal();
    } else {
      sheet.style.transform = '';
    }
    _dy = 0;
  }, { passive: true });
}

function gdgCloseSkuModal() {
  const overlay = document.getElementById('modal-gdg-sku');
  const sheet   = document.getElementById('gdg-sku-sheet');
  if (!overlay) return;
  if (sheet && window.matchMedia('(max-width:900px)').matches) {
    overlay.classList.remove('gdg-sheet-in');
    sheet.style.transform = '';
    setTimeout(function() {
      overlay.classList.remove('open');
      overlay.style.height    = '';
      overlay.style.transform = '';
      if (sheet) sheet.style.maxHeight = '';
    }, 280);
  } else {
    overlay.classList.remove('open');
  }
}

function gdgHapusSkuDariModal() {
  const id = document.getElementById('gdg-sku-edit-id').value.trim();
  if (!id) return;
  gdgHapusSku(id);
}

async function gdgSimpanSku() {
  const id     = document.getElementById('gdg-sku-edit-id').value.trim();
  const nama   = document.getElementById('gdg-sku-nama').value.trim();
  const ongkosStr = document.getElementById('gdg-sku-ongkos').value.replace(/\D/g,'');
  const ongkos = parseInt(ongkosStr, 10);

  if (!nama)                     { alert('Nama SKU wajib diisi.'); return; }
  if (!ongkos || ongkos <= 0)    { alert('Ongkos per lusin harus lebih dari 0.'); return; }

  const payload = { nama, ongkos_lusin: ongkos };

  try {
    if (id) await dbUpdate('gadag_sku', id, payload);
    else    await dbInsert('gadag_sku', payload);
    gdgCloseSkuModal();
    gdgLoad();
  } catch(e) {
    alert('Gagal simpan SKU: ' + e.message);
  }
}

function gdgHapusSku(id) {
  confirmDelete('Hapus SKU ini? Catatan pendapatan lama tidak akan berubah (data ongkos sudah tersimpan tersendiri).', async () => {
    try { await dbDelete('gadag_sku', id); gdgCloseSkuModal(); gdgLoad(); }
    catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// ─── HARI (nama hari otomatis dari tanggal) ───────────────────
var _gdgHariNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
function gdgHariName(tanggalStr) {
  if (!tanggalStr) return '';
  var parts = tanggalStr.split('-').map(Number); // yyyy-mm-dd, hindari timezone shift
  var d = new Date(parts[0], parts[1]-1, parts[2]);
  return _gdgHariNames[d.getDay()] || '';
}
function gdgUpdateHari() {
  var tgl = document.getElementById('gdg-pend-tanggal').value;
  document.getElementById('gdg-pend-hari').value = gdgHariName(tgl);
}

// ─── MODAL: CATATAN PENDAPATAN ─────────────────────────────────
// editId opsional — kalau diisi, modal masuk mode EDIT (judul berubah, field
// ke-prefill dari data existing, tombol Hapus muncul). Dipanggil dari
// tekan-lama baris di tabel Catatan (_gdgInitLongPress).
function gdgShowPendapatanModal(editId) {
  const titleEl = document.getElementById('gdg-pend-modal-title');
  const hapusBtn = document.getElementById('gdg-pend-modal-hapus');

  if (!_gdgSkuList.length) {
    alert('Belum ada SKU. Tambah SKU dulu di bagian "Kelola Produk".');
    return;
  }

  const record = editId ? _gdgPendapatanList.find(p => String(p.id) === String(editId)) : null;

  // helper reset hidden SKU fields
  function _resetSku() {
    document.getElementById('gdg-pend-sku-id').value     = '';
    document.getElementById('gdg-pend-sku-nama').value   = '';
    document.getElementById('gdg-pend-sku-ongkos').value = '';
    document.getElementById('gdg-pend-sku-label').value  = '';
  }

  if (record) {
    // ── MODE EDIT ──
    document.getElementById('gdg-pend-edit-id').value = record.id;
    document.getElementById('gdg-pend-tanggal').value = record.tanggal;
    document.getElementById('gdg-pend-hari').value    = record.hari || gdgHariName(record.tanggal);
    document.getElementById('gdg-pend-warna').value   = record.warna || '';
    document.getElementById('gdg-pend-qty').value     = record.qty || '';
    // isi hidden SKU fields dari record
    const skuRec = _gdgSkuList.find(s => String(s.id) === String(record.sku_id));
    document.getElementById('gdg-pend-sku-id').value     = record.sku_id || '';
    document.getElementById('gdg-pend-sku-nama').value   = record.sku_nama || '';
    document.getElementById('gdg-pend-sku-ongkos').value = skuRec ? (skuRec.ongkos_lusin||0) : (record.ongkos_lusin||0);
    document.getElementById('gdg-pend-sku-label').value  = record.sku_nama || '';
    titleEl.textContent = 'Edit Catatan Pendapatan';
    hapusBtn.style.display = '';
    gdgRecomputePreview();
  } else {
    // ── MODE TAMBAH ──
    document.getElementById('gdg-pend-edit-id').value = '';
    const now = new Date();
    const tglDefault = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
    document.getElementById('gdg-pend-tanggal').value = tglDefault;
    document.getElementById('gdg-pend-hari').value = gdgHariName(tglDefault);
    document.getElementById('gdg-pend-warna').value = '';
    _resetSku();
    document.getElementById('gdg-pend-qty').value = '';
    document.getElementById('gdg-pend-preview').textContent = 'Rp0';
    titleEl.textContent = 'Catatan Pendapatan';
    hapusBtn.style.display = 'none';
  }

  document.getElementById('modal-gdg-pend').classList.add('open');
  gdgOpenPendSheet();
}

// ─── BOTTOM-SHEET: animasi masuk/keluar + drag-to-close + keyboard-safe (iOS) ──
function gdgOpenPendSheet() {
  const overlay = document.getElementById('modal-gdg-pend');
  const sheet   = document.getElementById('gdg-pend-sheet');
  if (!overlay || !sheet) return;
  sheet.style.transform = ''; // pastikan mulai dari posisi tertutup (translateY(100%) dari CSS)
  // reflow paksa biar posisi awal ke-render dulu sebelum kita animasiin ke posisi final
  void overlay.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('gdg-sheet-in');
  }));
  _gdgSheetSyncViewport();
  if (window.visualViewport && !overlay._gdgVVInited) {
    overlay._gdgVVInited = true;
    window.visualViewport.addEventListener('resize', _gdgSheetSyncViewport);
    window.visualViewport.addEventListener('scroll', _gdgSheetSyncViewport);
  }
  _gdgInitSheetDragToClose();
  _gdgInitSheetFocusScroll();
}

function _gdgSheetSyncViewport() {
  const overlay = document.getElementById('modal-gdg-pend');
  const sheet   = document.getElementById('gdg-pend-sheet');
  if (!overlay || !overlay.classList.contains('open')) return;
  if (!window.matchMedia('(max-width:900px)').matches) return; // cuma perlu di layout bottom-sheet (mobile)
  const vv = window.visualViewport;
  if (!vv) return;
  // Fixed overlay dihitung dari layout viewport, bukan visual viewport, jadi
  // pas keyboard buka, bagian bawahnya ketutup keyboard kalau ga di-sync manual.
  overlay.style.height    = vv.height + 'px';
  overlay.style.transform = 'translateY(' + vv.offsetTop + 'px)';
  // KRITIS: max-height CSS (88dvh) HANYA ngitung UI browser (address bar), BUKAN
  // keyboard iOS — jadi sheet-nya tetep "sepanjang" 88dvh walau keyboard udah makan
  // banyak ruang, dan field-field di bawah (Warna/SKU/Qty/Simpan) ke-dorong keluar
  // area yg keliatan / ketutup keyboard. Override max-height pake tinggi
  // visualViewport yang sebenarnya, biar body sheet yg scroll, bukan field-nya ilang.
  if (sheet) sheet.style.maxHeight = Math.max(240, vv.height - 12) + 'px';
}

// Field yg lagi difokus wajib keliatan di atas keyboard — kalau field itu ada
// di bagian bawah form (misal Qty/SKU), scroll otomatis biar ga ketutup.
function _gdgInitSheetFocusScroll() {
  const overlay = document.getElementById('modal-gdg-pend');
  if (!overlay || overlay._gdgFocusScrollInited) return;
  overlay._gdgFocusScrollInited = true;
  overlay.addEventListener('focusin', function(e) {
    const t = e.target;
    if (!(t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    // Delay: tunggu keyboard kebuka & _gdgSheetSyncViewport sempat nyesuain tinggi dulu,
    // baru scroll-into-view biar hitungannya pake ukuran final, bukan ukuran lama.
    setTimeout(function() {
      _gdgSheetSyncViewport();
      t.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 320);
  });
}

function _gdgInitSheetDragToClose() {
  const handle = document.getElementById('gdg-pend-sheet-handle');
  const sheet  = document.getElementById('gdg-pend-sheet');
  if (!handle || !sheet || handle._gdgDragInited) return;
  handle._gdgDragInited = true;
  var _startY = 0, _dragging = false, _dy = 0;
  handle.addEventListener('touchstart', function(e) {
    _startY   = e.touches[0].clientY;
    _dragging = true;
    sheet.style.transition = 'none'; // ikutin jari langsung, tanpa delay transisi
  }, { passive: true });
  handle.addEventListener('touchmove', function(e) {
    if (!_dragging) return;
    _dy = Math.max(0, e.touches[0].clientY - _startY); // cuma boleh narik ke bawah
    sheet.style.transform = 'translateY(' + _dy + 'px)';
  }, { passive: true });
  handle.addEventListener('touchend', function() {
    if (!_dragging) return;
    _dragging = false;
    sheet.style.transition = ''; // balikin transisi buat animasi snap-back / close
    if (_dy > 90) {
      gdgClosePendapatanModal(); // ditarik cukup jauh → tutup
    } else {
      sheet.style.transform = ''; // kurang jauh → snap balik ke posisi kebuka
    }
    _dy = 0;
  }, { passive: true });
}


function gdgClosePendapatanModal() {
  const overlay = document.getElementById('modal-gdg-pend');
  const sheet   = document.getElementById('gdg-pend-sheet');
  if (!overlay) return;
  if (sheet && window.matchMedia('(max-width:900px)').matches) {
    // animasiin sheet turun dulu, baru overlay-nya di-hide
    overlay.classList.remove('gdg-sheet-in');
    sheet.style.transform = '';
    setTimeout(function() {
      overlay.classList.remove('open');
      overlay.style.height    = '';
      overlay.style.transform = '';
      if (sheet) sheet.style.maxHeight = '';
    }, 280);
  } else {
    overlay.classList.remove('open');
  }
}

// ─── BOTTOM-SHEET: animasi masuk/keluar + drag-to-close + keyboard-safe (iOS) —
// modal Anggaran (Tambah Variable). Pola identik dengan gdgOpenPendSheet di
// atas, sengaja dipisah (bukan digeneralisir/parameterized) biar kode
// Pendapatan yang udah proven-stable ga ikut kesenggol. ──
function gdgAngOpenSheet() {
  const overlay = document.getElementById('modal-gdg-ang2');
  const sheet   = document.getElementById('gdg-ang2-sheet');
  if (!overlay || !sheet) return;
  sheet.style.transform = '';
  void overlay.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('gdg-sheet-in');
  }));
  _gdgAngSyncViewport();
  if (window.visualViewport && !overlay._gdgVVInited) {
    overlay._gdgVVInited = true;
    window.visualViewport.addEventListener('resize', _gdgAngSyncViewport);
    window.visualViewport.addEventListener('scroll', _gdgAngSyncViewport);
  }
  _gdgAngInitDragToClose();
  _gdgAngInitFocusScroll();
}

// Field yg lagi difokus (misal Nominal) wajib keliatan di atas keyboard —
// sheet ini sebelumnya CUMA nyusut tingginya (_gdgAngSyncViewport) tapi ga
// nge-scroll field yg difokus ke area yg masih keliatan, jadi field yg posisinya
// di bawah bisa ketutup keyboard / "mental" keluar layar. Pola identik
// _gdgInitSheetFocusScroll di modal Pendapatan (yg udah proven-stable).
function _gdgAngInitFocusScroll() {
  const overlay = document.getElementById('modal-gdg-ang2');
  if (!overlay || overlay._gdgFocusScrollInited) return;
  overlay._gdgFocusScrollInited = true;
  overlay.addEventListener('focusin', function(e) {
    const t = e.target;
    if (!(t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    setTimeout(function() {
      _gdgAngSyncViewport();
      t.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 320);
  });
}

function _gdgAngSyncViewport() {
  const overlay = document.getElementById('modal-gdg-ang2');
  const sheet   = document.getElementById('gdg-ang2-sheet');
  if (!overlay || !overlay.classList.contains('open')) return;
  if (!window.matchMedia('(max-width:900px)').matches) return;
  const vv = window.visualViewport;
  if (!vv) return;
  overlay.style.height    = vv.height + 'px';
  overlay.style.transform = 'translateY(' + vv.offsetTop + 'px)';
  if (sheet) sheet.style.maxHeight = Math.max(240, vv.height - 12) + 'px';
}

function _gdgAngInitDragToClose() {
  const handle = document.getElementById('gdg-ang2-sheet-handle');
  const sheet  = document.getElementById('gdg-ang2-sheet');
  if (!handle || !sheet || handle._gdgDragInited) return;
  handle._gdgDragInited = true;
  var _startY = 0, _dragging = false, _dy = 0;
  handle.addEventListener('touchstart', function(e) {
    _startY   = e.touches[0].clientY;
    _dragging = true;
    sheet.style.transition = 'none';
  }, { passive: true });
  handle.addEventListener('touchmove', function(e) {
    if (!_dragging) return;
    _dy = Math.max(0, e.touches[0].clientY - _startY);
    sheet.style.transform = 'translateY(' + _dy + 'px)';
  }, { passive: true });
  handle.addEventListener('touchend', function() {
    if (!_dragging) return;
    _dragging = false;
    sheet.style.transition = '';
    if (_dy > 90) {
      gdgAngCloseModal();
    } else {
      sheet.style.transform = '';
    }
    _dy = 0;
  }, { passive: true });
}

// ─── CUSTOM SKU PICKER ────────────────────────────────────────
let _gdgSkuPickerQuery = '';

function gdgSkuPickerOpen() {
  const overlay = document.getElementById('gdg-sku-picker-overlay');
  const sheet   = document.getElementById('gdg-sku-picker-sheet');
  const search  = document.getElementById('gdg-sku-picker-search');
  if (!overlay || !sheet) return;
  _gdgSkuPickerQuery = '';
  if (search) search.value = '';
  gdgSkuPickerRenderList('');
  overlay.style.display = 'flex';
  // Picker ini di-inject ke document.body (lihat _gdgInjectSkuPicker), jadi TERPISAH
  // dari overlay Catatan Pendapatan — sync visualViewport-nya harus sendiri, gak
  // otomatis kebagian punya modal induk (beda elemen fixed).
  _gdgSkuPickerSyncViewport();
  if (window.visualViewport && !overlay._gdgVVInited) {
    overlay._gdgVVInited = true;
    window.visualViewport.addEventListener('resize', _gdgSkuPickerSyncViewport);
    window.visualViewport.addEventListener('scroll', _gdgSkuPickerSyncViewport);
  }
  // dua rAF biar browser sempat paint display:flex sebelum animasi transform jalan
  requestAnimationFrame(() => requestAnimationFrame(() => {
    sheet.style.transform = 'translateY(0)';
  }));
  // Auto-focus search begitu sheet-nya kebuka, keyboard langsung nongol —
  // user bisa langsung ngetik nama SKU tanpa tap search dulu. Ditunda 300ms
  // (nyocokin transisi sheet .28s) biar iOS Safari gak nolak focus() gara²
  // elemen masih di tengah animasi transform (kalau ke-skip, keyboard ga muncul).
  if (search) setTimeout(() => search.focus({ preventScroll: true }), 300);
}

// Root cause bug "picker Pilih Produk ketutup keyboard di iPhone, aman di Android":
// sheet ini cuma pakai max-height:72dvh (CSS statis) yg cuma ngitung UI browser
// (address bar), BUKAN keyboard iOS — iOS Safari gak resize layout viewport pas
// keyboard buka (beda dari Android yg umumnya resize), jadi tanpa sync manual ke
// window.visualViewport, sheet ini tetep "sepanjang" 72dvh dan bagian bawahnya
// (list produk) ketutup keyboard. Sama root cause & fix-nya kayak yg udah dipasang
// di overlay Catatan Pendapatan (_gdgSheetSyncViewport) — picker ini butuh versi
// sendiri karena posisinya di document.body, terpisah dari overlay induk.
function _gdgSkuPickerSyncViewport() {
  const overlay = document.getElementById('gdg-sku-picker-overlay');
  const sheet   = document.getElementById('gdg-sku-picker-sheet');
  if (!overlay || overlay.style.display !== 'flex') return;
  const vv = window.visualViewport;
  if (!vv) return;
  overlay.style.height    = vv.height + 'px';
  overlay.style.transform = 'translateY(' + vv.offsetTop + 'px)';
  if (sheet) sheet.style.maxHeight = Math.max(200, vv.height - 24) + 'px';
}

// force=true → tutup tanpa cek target (dipanggil dari tombol ✕ atau select item)
function gdgSkuPickerClose(force) {
  const sheet   = document.getElementById('gdg-sku-picker-sheet');
  const overlay = document.getElementById('gdg-sku-picker-overlay');
  if (!sheet || !overlay) return;
  sheet.style.transform = 'translateY(100%)';
  setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

function gdgSkuPickerFilter(q) {
  _gdgSkuPickerQuery = q;
  gdgSkuPickerRenderList(q);
}

function gdgSkuPickerRenderList(q) {
  const list = document.getElementById('gdg-sku-picker-list');
  if (!list) return;
  const currentId = document.getElementById('gdg-pend-sku-id').value;
  const filtered  = q
    ? _gdgSkuList.filter(s => (s.nama||'').toLowerCase().includes(q.toLowerCase()))
    : _gdgSkuList;

  if (!filtered.length) {
    list.innerHTML = `<div style="padding:20px 16px;color:var(--gdg-ink2,#5c554d);font-style:italic;text-align:center">Produk tidak ditemukan</div>`;
    return;
  }
  list.innerHTML = filtered.map(s => {
    const selected = String(s.id) === String(currentId);
    return `<div onclick="gdgSkuPickerSelect('${s.id}','${(s.nama||'').replace(/'/g,"\\'")}',${s.ongkos_lusin||0})"
      style="display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer;
             border-bottom:1px solid var(--gdg-rule,rgba(38,34,32,.12));
             background:${selected ? 'rgba(38,34,32,.06)' : 'transparent'}">
      <span style="flex:none;width:20px;height:20px;border-radius:50%;border:2px solid var(--gdg-ink,#262220);
                   display:flex;align-items:center;justify-content:center">
        ${selected ? `<span style="width:10px;height:10px;border-radius:50%;background:var(--gdg-ink,#262220);display:block"></span>` : ''}
      </span>
      <span style="font-size:15px;font-weight:800;color:var(--gdg-ink,#262220)">${s.nama||'—'}</span>
      <span style="margin-left:auto;font-size:12px;color:var(--gdg-ink2,#5c554d);font-weight:700">${gdgFmt(s.ongkos_lusin)}/lsn</span>
    </div>`;
  }).join('');
}

function gdgSkuPickerSelect(id, nama, ongkos) {
  document.getElementById('gdg-pend-sku-id').value     = id;
  document.getElementById('gdg-pend-sku-nama').value   = nama;
  document.getElementById('gdg-pend-sku-ongkos').value = ongkos;
  document.getElementById('gdg-pend-sku-label').value  = nama;
  gdgSkuPickerClose(true);
  gdgRecomputePreview();
}

// ─────────────────────────────────────────────────────────────
function gdgRecomputePreview() {
  const ongkos = Number(document.getElementById('gdg-pend-sku-ongkos').value) || 0;
  const qty    = parseInt((document.getElementById('gdg-pend-qty').value||'').replace(/\D/g,''), 10) || 0;
  const total  = Math.round(qty / 12 * ongkos);
  document.getElementById('gdg-pend-preview').textContent = gdgFmt(total);
  return total;
}

async function gdgSimpanPendapatan() {
  const editId  = document.getElementById('gdg-pend-edit-id').value;
  const tanggal = document.getElementById('gdg-pend-tanggal').value;
  const warna   = document.getElementById('gdg-pend-warna').value.trim();
  const skuId   = document.getElementById('gdg-pend-sku-id').value;
  const qtyStr  = (document.getElementById('gdg-pend-qty').value||'').replace(/\D/g,'');
  const qty     = parseInt(qtyStr, 10);

  if (!tanggal)          { alert('Pilih tanggal.'); return; }
  if (!skuId)            { alert('Pilih SKU.'); return; }
  if (!qty || qty <= 0)  { alert('Qty harus lebih dari 0.'); return; }

  const ongkos  = Number(document.getElementById('gdg-pend-sku-ongkos').value) || 0;
  const skuNama = document.getElementById('gdg-pend-sku-nama').value || '';
  const total   = Math.round(qty / 12 * ongkos);
  const hari    = gdgHariName(tanggal);

  const payload = {
    tanggal,
    hari,
    warna,
    sku_id:       skuId,
    sku_nama:     skuNama,
    ongkos_lusin: ongkos,
    qty,
    total,
  };

  try {
    if (editId) {
      await dbUpdate('gadag_pendapatan', editId, payload); // MODE EDIT
    } else {
      await dbInsert('gadag_pendapatan', payload);         // MODE TAMBAH
    }
    if (warna && typeof acRefresh === 'function') acRefresh('warna_gadag');
    gdgClosePendapatanModal();
    gdgLoad();
  } catch(e) {
    alert('Gagal simpan catatan: ' + e.message);
  }
}

// Dipakai tombol Hapus di panel Riwayat (tabel itu masih punya kolom Aksi,
// ga kepengaruh sama perubahan poin 2 yg cuma nyasar ke panel Catatan).
function gdgHapusPendapatan(id) {
  confirmDelete('Hapus catatan pendapatan ini?', async () => {
    try { await dbDelete('gadag_pendapatan', id); gdgLoad(); }
    catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// Dipanggil dari tombol "Hapus" di dalam modal edit (bukan dari tabel lagi,
// karena kolom Aksi udah dihapus — akses hapus sekarang lewat tekan-lama).
function gdgHapusPendapatanDariModal() {
  const editId = document.getElementById('gdg-pend-edit-id').value;
  if (!editId) return;
  confirmDelete('Hapus catatan pendapatan ini?', async () => {
    try {
      await dbDelete('gadag_pendapatan', editId);
      gdgClosePendapatanModal();
      gdgLoad();
    } catch(e) { alert('Gagal hapus: ' + e.message); }
  });
}

// ─── OVERLAY CLOSE HELPER ───────────────────────────────────────
function gdgOverlayClose(e, modalId, closeFn) {
  if (e.target.id === modalId) closeFn();
}

// ─── COLLAPSE RINGKASAN (minicard+metrics) — scroll (utama) + swipe di kolom data ──
(function() {
  var _mq = window.matchMedia('(hover: none) and (pointer: coarse)');

  // Poin 2: dulu ada 2 mekanisme jalan bareng — swipe langsung di minicard/summary
  // (initSwipeCollapse) DAN scroll-listener di .content. Di Android dua-duanya
  // kebetulan searah jadi mulus, tapi di iPhone touch & scroll event-nya ke-fire
  // dengan timing beda (iOS motion-momentum decouple dari touch, Android nggak)
  // → dua mekanisme itu rebutan toggle class yg SAMA dalam 1 gesture → "mental".
  // Fix: swipe manual SEKARANG cuma di #gdgw-data-area (kolom data), 1 handler
  // buat 2 arah (naik = minimize, turun = turunin lagi) — bukan lagi nempel di
  // minicard. Scroll-listener (_gdgInitScrollCollapse) tetap jalan apa adanya
  // buat hide-on-scroll otomatis; keduanya sekarang di elemen yg beda jadi ga
  // rebutan gesture yg sama lagi.
  function _gdgInitDataAreaSwipe() {
    var area    = document.getElementById('gdgw-data-area');
    var summary = document.getElementById('gdg-top-summary');
    if (!area || !summary || area._gdgDataSwipeInited) return;
    area._gdgDataSwipeInited = true;
    var THRESHOLD = 35;   // px minimal per swipe biar keitung gesture, bukan jitter
    var MIN_GAP   = 120;  // ms — dua swipe ga boleh instan/nyambung (dianggap 1 gesture panjang)
    var MAX_GAP   = 800;  // ms — tapi juga ga boleh kelamaan jeda antar swipe 1 & 2
    var _startY = 0, _startX = 0, _tracking = false;
    var _lastSwipeAt = 0, _lastSwipeDir = 0; // dir: -1 = swipe naik, 1 = swipe turun

    area.addEventListener('touchstart', function(e) {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
      _startY   = e.touches[0].clientY;
      _startX   = e.touches[0].clientX;
      _tracking = true;
    }, { passive: true });

    area.addEventListener('touchend', function(e) {
      if (!_tracking) return;
      _tracking = false;
      if (_gdgView !== 'mingguan') return;

      var dy = e.changedTouches[0].clientY - _startY;
      var dx = e.changedTouches[0].clientX - _startX;
      if (Math.abs(dx) > Math.abs(dy)) return; // bukan gesture vertikal

      var dir = 0;
      if (dy >  THRESHOLD) dir =  1; // swipe turun → mau nurunin minicard (expand)
      if (dy < -THRESHOLD) dir = -1; // swipe naik  → mau minimize (collapse)
      if (!dir) return;

      var collapsed = summary.classList.contains('gdg-topbar-collapsed');
      if (dir ===  1 && !collapsed) return; // udah kebuka, swipe turun ga ngapa-ngapain
      if (dir === -1 &&  collapsed) return; // udah collapse, swipe naik ga ngapa-ngapain

      var now = Date.now();
      var gap = now - _lastSwipeAt;
      if (_lastSwipeDir === dir && gap >= MIN_GAP && gap <= MAX_GAP) {
        // 2x swipe searah berdekatan (ga kecepetan, ga kelamaan) → eksekusi
        if (dir === 1) summary.classList.remove('gdg-topbar-collapsed');
        else           summary.classList.add('gdg-topbar-collapsed');
        _lastSwipeAt = 0; _lastSwipeDir = 0;
      } else {
        _lastSwipeAt = now; _lastSwipeDir = dir;
      }
    }, { passive: true });
  }
  function _gdgInitScrollCollapse() {
    var content = document.querySelector('.content');
    var summary = document.getElementById('gdg-top-summary');
    if (!content || !summary || content._gdgCollapseInited) return;
    content._gdgCollapseInited = true;
    var _lastY         = 0;
    var _lastChangeAt  = 0;
    // iOS Safari: scrollTop suka "getar" (naik-turun dikit) pas momentum-scroll
    // atau pas address bar collapse/expand — beda sama Android yg monotonic.
    // Tanpa filter ini, getaran kecil ke-baca sebagai "swipe down" dan bikin
    // card balik ke-expand lagi padahal user masih scroll ke atas ("mental").
    var NOISE_PX  = 6;    // delta di bawah ini dianggap noise, diabaikan
    var COOLDOWN  = 220;  // ms — state ga boleh flip-flop lebih cepat dari ini
    content.addEventListener('scroll', function() {
      if (_gdgView !== 'mingguan') return; // cuma aktif pas lagi di panel Ringkasan
      var y  = content.scrollTop;
      var dy = y - _lastY;
      _lastY = y;
      if (Math.abs(dy) < NOISE_PX) return; // micro-jitter iOS, skip

      var now = Date.now();
      if (now - _lastChangeAt < COOLDOWN) return; // masih dalam cooldown, skip

      if (y > 40 && dy > 0) {
        if (!summary.classList.contains('gdg-topbar-collapsed')) {
          summary.classList.add('gdg-topbar-collapsed');
          _lastChangeAt = now;
        }
      } else if (dy < 0 || y <= 40) {
        if (summary.classList.contains('gdg-topbar-collapsed')) {
          summary.classList.remove('gdg-topbar-collapsed');
          _lastChangeAt = now;
        }
      }
    }, { passive: true });
  }
  document.addEventListener('zenot:page', function(e) {
    if (e.detail.page !== 'gadag') return;
    setTimeout(function() {
      var el = document.getElementById('gdg-top-summary');
      if (el) el.classList.remove('gdg-topbar-collapsed');
      _gdgInitDataAreaSwipe();
      _gdgInitScrollCollapse();
    }, 100);
  });
})();

// ─── AUTO-INIT ────────────────────────────────────────────────
// Dua lapis init biar tidak blank:
// 1. Event listener — untuk navigasi normal (user klik Gadag setelah script sudah load)
// 2. Fallback langsung — kalau page-gadag SUDAH aktif saat script ini selesai load
//    (race condition: user klik Gadag sebelum gadag.js selesai load dari network/cache,
//     event zenot:page sudah fired tapi listener belum terdaftar → blank selamanya)
document.addEventListener('zenot:page', function(e) {
  if (e.detail.page === 'gadag') setTimeout(gdgInit, 50);
});
// Fallback: cek apakah halaman sudah aktif saat script ini load
if (document.body.dataset.page === 'gadag') {
  setTimeout(gdgInit, 100);
}
