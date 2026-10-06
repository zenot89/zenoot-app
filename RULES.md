# RULES — Zenoot App

## Rules kerja (wajib dibaca tiap sesi baru)

- Selalu baca dan pahami struktur kode dari file ZIP yang dikirim sebelum mulai apapun
- Trace properly — jangan tebak-tebak, harus trace flow secara menyeluruh sebelum menyimpulkan root cause
- Tidak bolak-balik — fix harus benar dari awal, bukan reaktif trial-error
- Sebelum eksekusi apapun: unzip & trace struktur kode dulu (bukan tebak dari nama file/fungsi)
- Kalau nemu potential root cause yang levelnya keputusan desain besar (bukan sekadar bug kecil), presentasikan dulu opsi-opsi + konsekuensinya, baru eksekusi setelah dikonfirmasi
- Tiap kode divalidasi sebelum dikirim: node --check (syntax), hitung brace {}/() balance, cek div-depth di innerHTML template literal harus balik ke 0
- Kalau nemu kode/behavior yang kelihatannya bug tapi ternyata sengaja (ada komentar penjelasan sebelumnya), jangan main ubah — jelasin dulu root cause & alasan desain lamanya
- Dead code (fungsi yang jadi gak kepake gara-gara refactor) dipertahanin apa adanya + dikasih komentar jelas, bukan langsung dihapus — minim blast radius
- Perubahan skema database (ALTER TABLE) gak bisa dieksekusi otomatis — kasih SQL persis, tunggu konfirmasi dijalanin baru lanjut kode yang gantung ke kolom itu
- Setiap kirim file hasil edit, selalu sertakan instruksi deploy yang jelas

## Repo

Ada 3 repo GitHub terpisah, jangan sampai file ketuker:
- **zenoot89/zenoot-app** — aplikasi dashboard/seller utama, yang lagi aktif dikerjain sekarang
- **zenoot89/zenot-shop** (custom domain zenoot.web.id) — shop customer, katalog produk
- **zenoot89/zenot-seller** — seller center/admin dashboard lama, akses via zenoot89.github.io/zenot-seller

## Progress project (zenoot-app) — state per file, terbaru di bawah tiap file

**clearance.js + clearance-induk.js (fitur "Clearance", state final per 10 Sep 2026)**:
- Flow 2 halaman: sidebar "Clearance Monitor" → landing di clearance-induk.js (page-clearance-induk, judul "Modal per SKU Induk") = halaman pertama. Tombol "Detail per SKU" → clearance.js (page-clearance, "Clearance Monitor" list detail per varian) = halaman kedua. Tombol "Back" di clearance.js → balik ke clearance-induk.js.
- clearance-induk.js: header ada dropdown filter "Semua SKU"/per SKU Induk (#mi-filter-sku, fungsi miFilterBySku — 1 filter buat 2 tabel sekaligus) + metrics strip (Katalog Terdampak/Total Varian SKU/Total Modal Tertahan). Layout split 2 kolom (#mi-split-wrap, gap 12px, collapse jadi stack vertikal di mobile <900px): kiri tabel utama SKU→Variasi→Qty→Modal/Varian→Supplier (font 13px); kanan tabel "Kandidat Flash Sale" (SKU Induk→SKU Variasi→Sisa) cuma varian sisa≥3pcs (syarat minimal Shopee).
- Tiap tabel dikelompokkan per SKU Induk (grup di-rank sesuai sort aktif), baris header grup nampilin Total Modal & Total Qty. Efek visual "floating card": gap 16px antar grup + rounded corner + shadow halus (class mi-grp-first/mi-grp-last/mi-grp-gap di style.css).
- Sort header (SKU/Qty/Modal) 3-state: klik1=asc(▲)→klik2=desc(▼)→klik3=netral(⇅).
- Data di-cache di _miGroupTotals/_miFlatRows biar sort/filter gak fetch ulang ke DB. Scrollbar custom tipis abu-abu (var(--ink4)).
- **PENTING buat halaman full-height baru manapun ke depan**: WAJIB didaftarkan juga di style.css (bukan cuma app.js+index.html) — search "#page-clearance" dan tambahkan selector `#page-<nama>` yang sama persis di semua block terkait, + CSS wrapper tabel sendiri mirror #cl-tbl-wrap — kalau lupa, halaman gak bisa di-scroll.
- Restock.js: tombol "Produk Clearance" di topbar Re-Stock DIHAPUS (redundan, Clearance udah punya menu sidebar sendiri) — sisa 1 tombol kontekstual "Lihat Clearance" di panel Summary.
- Sidebar: tombol "Dashboard" DIHAPUS — klik logo/header zenOt (.logo-block) langsung navigasi ke dashboard.

**produk.js** (Kelola Produk — base data SKU, murni base, gak nyimpen link ke supplier manapun):
- Field "Boss" jadi PICKER dari hutang_supplier (single source of truth) + opsi "+ Tambah supplier baru". Cascade rename (_produkCascadeRename): edit SKU/katalog/boss ikut update jurnal_penjualan.sku & stok.sku_variasi/katalog/boss.
- Paste Massal SKU: kolom Boss dicek ke hutang_supplier, yang belum ada auto-insert (Dropship default), badge "baru" di preview.
- REVERTED: field "Sumber Harga Supplier" (link ke hutang_barang) DIHAPUS TOTAL — Kelola Produk harus tetep base data doang. Linking dipindah ke hutang-supplier.js.

**dashboard.js**:
- Fix bug "Lainnya" nelen data asli di Performa Supplier/Omset per Katalog: tambah fallback normalized match (_dashNormSku) selain exact match.
- Label kriteria & item Beban Operasional/Income dibold-in.

**stok.js**: Fix _stokStatusRank — urutan baru Fast → Habis(dari Fast) → Habis(dari Slow) → Slow → Dead → Zombie → Habis(Dead/Zombie).

**supabase.js**: tambah dbUpdateWhere(table, filterQuery, payload) — PATCH massal by filter custom.

**cost-produksi.js** — panel Jurnal Harian: tombol Export PDF & Tambah Jurnal ditukar posisi, teks "(by Tukang)" dihapus, lebar sama rata.

**gadag.js**:
- Overview: tombol sort & diagram diperbesar/sejajar di sticky header, label tanggal dihapus.
- Minicard jadi 3x2: Income/Cost, Average Income/Cost (baru, dibagi hari berjalan bukan ÷7 tetap), Qty-Lsn/Target.
- Donut Income: arc terisi selalu ijo, track/sisa MERAH (filosofi: target belum tercapai = merah).
- SKU picker Catatan Pendapatan: tambah "Terakhir Digunakan" (MRU localStorage max 4).
- Anggaran Gadag: sumber nominal pindah total ke kas_anggaran — 2 lapis: SELEKSI akun (gadag_anggaran, checkbox multi-select) + NOMINAL (live JOIN ke kas_anggaran+kas_akun). Item terpilih tanpa budget → "Belum diset". Tekan-tahan row = hapus dari seleksi doang.

**hutang-supplier.js**:
- Fix "Edit Bon harus klik X Detail dulu" — z-index conflict, fix: tutup Detail instan sebelum buka Edit Bon.
- Fix tombol pensil "ketarik ke tengah" — class margin-left:auto konflik 2 tombol, fix: cuma tombol pertama pegang auto-margin.
- Root cause "Re Stock kosong total": Gate is_reseller — supplier yang gak dicentang Reseller bikin semua SKU-nya ke-skip.
- Fitur "Pilih SKU Variasi" di Master Barang: picker langsung dari produk.sku_variasi (bukan input bebas lagi). Tambah = multi-select, Edit = single-select. hutang_barang.produk_id jadi link resmi (FK ke produk.id).
- Kolom baru hutang_barang.sku_variasi_supplier: teks bebas per baris, buat bahasa manusia bikin PO doang, gak dipakai matching.
- Paste Massal Barang dirombak: kolom SKU Variasi, SKU Supplier, SKU Variasi Supplier, Supplier, Harga per Lusin, Harga PO per Lusin — SKU Variasi wajib match persis ke produk.sku_variasi.
- Re Stock: prioritas baca harga dari hutang_barang kalau udah di-link, fallback produk.hpp (ditandai bintang) kalau belum. Gate is_reseller prioritas baca link resmi ketimbang produk.boss text.

**anggaran.js**:
- Fix kontras "September 2026" di input Bulan — scope rule dark ke #ang-filter-bulan doang.
- "Salin Bulan Lalu" DIHAPUS, diganti auto-carry-forward kalau bulan kosong total.
- Tombol "+ Anggaran": bisa pilih akun dari SEMUA akun Beban/Kewajiban, auto-update kalau udah ada.
- Tabel dibungkus scroll box max-height 65vh.
- Minicard HP: scroll-collapse diganti gesture swipe (atas=collapse, bawah 2x cepat=expand).
- Filter bulan: input type=month diganti pill dropdown #ang-bulan-trigger (portal ke body), pola sama kas.js.

**kas.js**: Sticky header "Cash Jurnal" HP — judul & tombol dipisah baris (class .kas-title-btns, mobile-only).

**dashboard.js + style.css (28 Sep 2026)**: 8 minicard dashboard dibungkus 2 carousel (#zd-car-a: Target/Laba/Beban vs Kas/Cash Flow, #zd-car-b: Saldo Kas/Order Hari Ini/Nilai Stok/SKU Kritis). HP (<768px): 1 halaman = 1 kartu, swipe loop 1-2-3-4-1-2-3-4 (DOM diputar, tanpa klon → ID canvas tetap unik), dot 4 titik. Desktop/tablet: wrapper display:contents, grid lama utuh. Kartu bawah sekarang juga pakai donut (Saldo=% tersisa, Order=omset hari vs target harian, Nilai Stok=komposisi per Boss, SKU Kritis=habis/mendekati/aman). Warna ikon per kartu pindah dari :nth-of-type ke [data-zd-i] karena urutan DOM bisa berputar.

**analisis.html — panel upload RKS (29 Sep 2026)**: RKS Overview, RKS Mingguan, Proyeksi RKS punya panel upload yang sama, semua dikelola helper bersama `rks*` (RKS_SEL, rksRenderOrders/Income/Ads, rksSyncButtons, rksDeleteSelected, rksHitung, rksToggleEdit; scope 'ov' | 'm' | 'p').
- Order Completed: Overview & Proyeksi 2 slot (index 0 = Bulan lalu, index 1 = Bulan ini); Mingguan 1 slot (alurnya beda, jangan disamakan). Data Proyeksi lama (1 slot) otomatis masuk "Bulan ini".
- Income & Iklan: 1 kotak tanpa header; kosong = ajakan upload, terisi = kartu nama file + keterangan (tag kecil Income/Iklan).
- Edit file -> kartu file dapat kotak centang; tombol jadi "Selesai". Hapus = hanya yang dicentang (konfirmasi, terkunci kalau belum ada centang; hapus Income juga reset pendapatan/penghasilan/rasio admin, hapus Iklan reset iklan). Hitung terkunci sampai lengkap: Income terbaca + Order (Overview 2, Mingguan 1, Proyeksi 2) + Iklan (Overview: file ATAU "tanpa iklan" dari setup toko; Mingguan & Proyeksi: wajib file).
- Tombol "Hapus Data" (hapus semua) dihapus; kalau mau hapus semua, centang semua.
- analisis.js cuma diberi catatan (24) supaya APP_BUILD berubah.
- Susunan tombol panel (revisi 29 Sep 2026): [Edit file/Selesai] di kiri, [Hapus] muncul di sebelahnya hanya saat Edit file aktif, [Hitung] SELALU tampil di kanan (terkunci sampai Order+Income+Iklan lengkap). Selesai upload TIDAK otomatis menghitung: hasil baru dihitung ulang saat user klik Hitung, supaya user sempat mengecek kartu file dulu.

**analisis.js + analisis.html — Proyeksi RKS di HP (30 Sep 2026)**: tab bar HP sekarang RKS Overview | RKS Mingguan | Proyeksi RKS (tab HPP Produk dibuang dari tab bar HP; halaman HPP tetap bisa dibuka lewat link internal). `hasilP` masuk PHONE_PAGES; semua aturan HP Overview/Mingguan dipakai ulang lewat `hw()`/`pg()` (kini 3 halaman). Khusus Proyeksi: tiap baris 2 nilai → di HP ditumpuk (SAAT INI + "Akhir bulan: ..." kecil, disembunyikan kalau nilainya sama), baris NET INCOME & LABA/RUGI disalin ke kartu Ringkasan (`dupRowsP`, aslinya disembunyikan di Rasio), `markPv()`. Header HP: [Bulan ▾ 30%][Toko 65%], tombol PDF ikon di kiri kartu Net Income (meneruskan ke `btnExportPDFP`). analisis.html hanya: label periode Proyeksi dapat versi pendek `hp-short` ("Sep 2026") — laptop tetap versi penuh. Laptop tidak tersentuh.

**analisis.html — Operasional per bulan Rekap (4 Okt 2026)**: Rekap bulan M memakai porsi omset bulan M-1 (September selalu Agustus), BUKAN bulan sebelum tanggal hari ini — supaya bulan yang sama selalu menghasilkan angka sama. Nilainya terkunci di `snapshot.operasional` saat Simpan.
- Sumber tunggal: `opsOperasionalBulan(ymKey)` (sinkron, baca cache `_opsAutoCache`) + `opsPickRefKey` (bulan acuan = M-1 APA ADANYA, TIDAK PERNAH mundur: kadang 1 toko memang tidak dapat omset, jadi bulan itu tak akan pernah "lengkap"; toko tanpa omset M-1 kebagian Rp0, sisanya dibagi proporsional; versi lama yang mundur ada sbg dead code berkomentar) + `opsAlokasi` (largest remainder, dipakai juga `opsHitungSemua`).
- **PENTING**: fungsi compute RKS (`computeHasilMetrics`, `resolveOperasionalMingguan`, `resolveOperasionalProyeksi`) JANGAN baca `state.settings.operasionalToko` langsung; lewat `opsOperasionalBulan` (bulan dari file Income). `state.settings.operasionalToko` tetap dipakai Setting & Proyeksi Harga (= bulan berjalan) dan jadi fallback kalau cache belum siap/gagal (fungsi mengembalikan `null`).
- Tiga tombol Simpan ke Rekap memanggil `await opsPastikanSiap()` dulu (hitung ulang paksa); gagal = batal simpan, supaya tidak mengunci angka basi. Rekap bulanan berubah (simpan/hapus/urungkan) -> `opsInvalidateCache()`. Rekap toko aktif di cache selalu ditimpa `state.rekap` (memori, terbaru).
- Batasan: Beban (manual `ops_item`) & Cicilan (Hutang Aing) belum punya riwayat per bulan, jadi total yang dibagi = angka hari ini; yang terkunci hanya hasil per Rekap.

## Belum kelar / open issue

- Sistem Re-Stock ada 2 versi gak sinkron: restock.js (baca produk.boss langsung, semua supplier) vs hutang-supplier.js tab Re Stock (filter Reseller/PO doang, prioritas link hutang_barang). SKU sama bisa beda status/boss di 2 tempat. User minta di-skip dulu, dipikirin ulang arahnya (satuin sistem / bikin gate keliatan di UI).
  - TURTLENECK_BATA-XL: gak muncul di Hutang Barang punya Re Stock meski udah Reseller — belum ketemu akar sebabnya, investigasi di-pause.
  - Ada sisa stok MINUS (Army-XL -1) — belum ditrace.
- Bug nominal "ALAT-ALAT"/"OPS HARIAN" (kas_anggaran) gak ke-save pas reload di Anggaran (Kas) — udah ditrace penuh, gak ketemu bug di kode. Nunggu detail lebih spesifik dari user (ada alert error gak).

**channel-master.js — Price List 2 tier (30 Sep 2026)**: 1 toko × 1 katalog = 1 harga, diambil dari yang paling spesifik: harga toko (tabel channel_harga) → harga kategori (tabel channel_kategori_harga) → otomatis HPP × (1 + Beban% + NPM%).
- Price List HANYA untuk Offline, Reseller & Dropship (`_CHP_KATS`) karena harganya tetap. Shopee/Lazada/TikTok tidak pakai (harga jual bergerak; margin dihitung dari harga jual aktual): tombol Harga tidak ada, baris toko tidak bisa diklik. Data channel_harga lama milik toko-toko itu tidak dihapus, hanya tidak ditampilkan.
- **Tab baru "Lainnya"** (halaman Channel): Offline, Reseller, Dropship + panel Price List. Tab "Channel" tinggal Shopee, Lazada, TikTok.
- Tab halaman Channel (Channel / Supplier & ROP / Lainnya) gayanya sama dengan tab Cost Produksi: teks polos, tab aktif digaris bawah (class `.ch-tab-btn.active`), diletakkan rata kanan. chSwitchTab toggle class, bukan style inline.
- **PENTING — nama kategori**: kategori lama yang tadinya bernama "Reseller" (DIMI, Lazata, LOKAN, MY OUTFIT, RILOKA) ternyata Dropship → cuma diganti LABEL, key DB tetap `reseller` (tanpa migrasi data). Kategori Reseller yang sungguhan = key baru `reseller_baru`. Label sudah disesuaikan di channel-master.js, dashboard.js, jurnal-penjualan.js (2 map), app.js (icon). Jangan tertukar: `reseller` = Dropship, `reseller_baru` = Reseller.
- Satuan harga masih per pcs untuk semua kategori (belum ada tampilan per lusin untuk Dropship — menunggu keputusan user).
- Tombol "Harga" di header kategori Offline/Reseller/Dropship membuka panel kanan dalam mode kategori (`_chpSelId = 'kat:<kategori>'`); klik toko = mode toko. Edit Massal & input per baris jalan di kedua mode (pilih tabel lewat `_chpTblOf`, query `_chpQ`, baris baru `_chpMkRow`).
- Toko yang sudah punya harga sendiri TIDAK ikut berubah saat harga kategori diubah. Kosongkan harga toko = balik ke harga kategori (kalau ada) / otomatis.
- Kategori yang Beban/NPM tokonya berbeda-beda (`mixed`): harga otomatis & NPM tidak ditampilkan di mode kategori (placeholder "—").
- "Isi dari rumus lama" hanya di mode toko dan hanya mengisi katalog yang benar-benar masih otomatis (bukan yang sudah punya harga kategori).
- Kalau tabel channel_kategori_harga belum dibuat: panel toko tetap jalan (fallback kategori dianggap kosong), mode kategori nampilin pesan error + petunjuk jalankan SQL.

**analisis.html — Data Operasional laptop (30 Sep 2026)**: layout ditumpuk (Beban+Cicilan kiri, Pembagian Toko kanan, isi 3 kolom) dibatalkan karena berantakan; kembali ke 3 kartu sejajar 1 baris (grid bawaan `.st-swipe-track` >=768px), isi 1 kolom per kartu, font baris `clamp(13.5px,1.85vh,16px)` (sedikit lebih besar dari 13px semula). HP tidak disentuh. Class `rc-cols` masih ada di JS tapi tanpa CSS (aman).

**analisis.html — Data Operasional 3 kolom per baris (30 Sep 2026)**: laptop, kartu Beban & Cicilan: baris = grid 3 kolom (Akun | Kode·% | Nominal; Nama | Sisa | Cicilan/bln) lewat `.rc-cols .rc-row` + `.rc-l{display:contents}` (JS tidak diubah); susunan luar tetap 3 kartu sejajar. HP: susunan tidak diubah, font `.rc-v` di `#settingOpsSwipe` jadi 16px.

**jurnal-penjualan.js + produk.js (30 Sep 2026)**: (1) Tambah Penjualan: Harga Satuan otomatis = HPP variasi dari Kelola Produk (bukan lagi HPP×(1+Beban+NPM) channel_beban); `_jpGetHargaFromPriceList` dibiarkan tapi tidak dipanggil; tetap bisa diedit manual. (2) Kelola Produk: varian dalam katalog ber-size (Turtleneck, RH_Zipper-salur) diurut per WARNA A-Z lalu size S<M<L<XL<XXL<XXXL lewat `_produkSortWarnaSize` (parse `<induk>_<warna>-<size>`); katalog tanpa size dikenali tetap urutan asli; size tak dikenal (mis. typo `XXI`) jatuh ke akhir warnanya.

**jurnal-penjualan.js (30 Sep 2026)**: daftar variasi di Tambah Penjualan (sheet "Semua" + `<select>` jp-sku-variasi) diurut pakai `_jpSortVariasi` → `_produkSortWarnaSize` (aturan sama dgn Kelola Produk). Bagian "Sering & Terakhir Digunakan" tidak diubah.

**anggaran.js + dashboard (8 Okt 2026)**: (1) Anggaran (Kas): ada baris keterangan `#ang-carry-note` di atas tabel — "Anggaran lanjutan dari <bulan> — belum ada perubahan / N item diubah/ditambah". Murni tampilan (`_angCarryNote`): bandingkan row bulan aktif vs bulan terdekat sebelumnya, TIDAK nulis data & tidak ada kolom baru; carry-forward (`angAutoCarryForward`) tidak diubah. (2) Akun Beban Operasional yang anggarannya belum diset DAN realisasi 0 disembunyikan dari tabel (tetap bisa di-set via "+ Anggaran"); kalau sudah ada realisasi tanpa anggaran tetap tampil. (3) Dashboard desktop: tinggi 4 kartu hero 370→320px (pas buat Kecepatan Kas), isi lebih panjang discroll dalam box; baris Net Worth direnggangkan merata (`justify-content:space-between`). HP tidak disentuh.

**anggaran.js + analisis.html (8 Okt 2026, lanjutan)**: (1) Anggaran (Kas): kolom Aksi DIHAPUS di semua layar (header, sel, CSS; colspan 7→6). Gantinya: TAHAN ~500ms di baris (jari/mouse, pointer events) → menu kecil Edit / Hapus (`#ang-row-menu`, dibuat lewat JS); ketuk singkat tidak ngapa-ngapain; Hapus tetap lewat `confirmDelete` (`angHapus`). Handler delegated di `#ang-tbody`. (2) Setting Analisis > Data Operasional > Beban Operasional sekarang SATU SUMBER dengan Anggaran Kas: `opsFetchBebanManual()` baca `kas_anggaran` (bulan berjalan; kalau kosong pakai bulan terdekat sebelumnya yang ada data), hanya akun sub_kelompok Beban Operasional dengan anggaran > 0 (akun yang tidak diset di Kas tidak tampil); anggaran Kewajiban TIDAK ikut (hindari dobel dengan Cicilan Aktif). Tombol Edit & ikon pensil di kartu dihapus; `opsToggleEdit`/`opsItemModal` jadi dead code (dibiarkan). Tabel `ops_item` TIDAK dihapus, tidak dibaca lagi untuk jenis 'beban'. Bentuk data (`bebanList`/`totalBeban`) tidak berubah sehingga Pembagian Toko, RKS, Proyeksi, Check Admin otomatis ikut. Total Beban Operasional Analisis bergeser mengikuti Anggaran Kas.

**anggaran.js + restock.js (8 Okt 2026, lanjutan 2)**: (1) Anggaran (Kas): menu kecil Edit/Hapus hasil tekan-tahan DIGANTI — tahan ~500ms (jari/mouse) di baris langsung membuka modal edit bergaya "Edit Penjualan" (Jurnal Penjualan): header ikon + judul dinamis (`#ang-modal-title`: Edit/Tambah Anggaran) + ✕, garis putus-putus, tombol **Hapus** di dalam modal kiri bawah (`#ang-btn-hapus`, hanya tampil kalau akun sudah punya anggaran; `angHapusDariModal` → `angHapus` tetap lewat confirmDelete), **Batal** + **SIMPAN** kanan. Isi form & logika simpan tidak berubah. (2) Re-Stock (`renderSummary`): daftar Order Sekarang & Lagi Naik sekarang 1 baris per SKU INDUK (`katalog` + supplier; grup = `_rsGroupBy`, disimpan di `window._rsGroups`). Klik → bottom-sheet ala komen Instagram (`rsSheetOpen`, elemen `#rs-sheet*` dibuat lewat JS & ditempel ke body; pola dari `mi-sheet` clearance-induk.js, salinan sendiri) berisi SKU variasi: Order Sekarang = SISA/HABIS/ORDER, Lagi Naik = TREN/ORDER. HP: penuh di bawah; laptop: maks 480px di tengah bawah. Ketuk variasi → tutup sheet & buka tab supplier-nya (`rsSheetGo`). Tab detail per supplier, Nilai Stok per Supplier, Clearance, Zombie tidak diubah; versi lama (per variasi) dipertahankan sebagai komentar.
