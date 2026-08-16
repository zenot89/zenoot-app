# RULES.md — Panduan Kerja untuk Claude di Project Zenoot

> **Buat Claude yang baca ini:** file ini adalah "memori" dari sesi-sesi sebelumnya.
> Baca SELURUH file ini dulu sebelum megang kode, sebelum nanya-nanya ke user,
> dan sebelum bikin asumsi. User akan upload file .zip project + file ini setiap
> mulai sesi baru — anggap ini pengganti context yang hilang karena sesi lama abis.

---

## 1. Tentang Project

**Zenoot** adalah aplikasi PWA (Progressive Web App) buat UMKM garmen/konveksi —
mencatat produksi, pendapatan, kas, jurnal, dsb. Single Page App, vanilla JS
(TANPA framework kayak React/Vue), backend Supabase (Postgres + REST API).

Modul yang paling banyak dikerjain sejauh ini: **Gadag** (`gadag.js`) — modul
pencatatan ongkos jahit/makloon per lusin. Tapi pola-pola di bawah ini berlaku
buat modul lain juga (Kas, Jurnal, dll) karena mereka satu arsitektur.

**Stack:**
- Frontend: vanilla JS, HTML string di-inject via `innerHTML`, CSS inline di dalam `<style>` tag per file
- Backend: Supabase (REST API langsung dari client pakai anon key, TIDAK ada auth/session)
- PWA: ada `sw.js` (service worker) buat caching offline
- Font & ikon: Tabler Icons (`class="ti ti-*"`) via CDN, Google Fonts via `<link>`

---

## 2. Struktur File & Cara Kerja 1 Halaman

Setiap "halaman"/modul (Gadag, Kas, Jurnal, dst) itu **1 file JS mandiri**
(`gadag.js`, `kas.js`, dst), pola isinya:

```js
// 1. Comment di atas file = dokumentasi skema tabel Supabase yg dipakai
// Tabel: gadag_sku        { id, nama, ongkos_lusin, created_at }
// Tabel: gadag_pendapatan { id, tanggal, sku_id, sku_nama, ongkos_lusin, qty, total, created_at }

let _xxxState = []; // state global di-prefix sesuai modul (gdg untuk Gadag)

document.getElementById('page-gadag').innerHTML = `
<style> /* SEMUA css khusus halaman ini nempel di sini, per-file */ </style>
<div id="gdg-panel-mingguan" class="gdg-panel active"> ... </div>
<div id="gdg-panel-pendapatan" class="gdg-panel"> ... </div>
<!-- panel lain... -->
<!-- modal-modal... -->
`;

function gdgInit() { ... }       // dipanggil pas halaman dibuka
function gdgLoad() { ... }       // fetch data dari Supabase, render ulang
function gdgApplyView() { ... }  // show/hide panel sesuai menu yg dipilih
// dst — semua fungsi di-prefix sesuai modul (gdg = Gadag, kas = Kas, dst)
```

**Kenapa dijelasin ini duluan:** karena SEMUA edit ke halaman ini artinya edit
1 file JS gede yang isinya HTML template string + CSS + logic jadi satu. Hati-hati
pas `str_replace` — banyak string mirip (misal ada 4 tombol Refresh yang keliatan
identik tapi beda konteks/panel).

---

## 3. WAJIB Sebelum Mulai Edit

1. **`view` file yang relevan dulu**, jangan langsung `str_replace` berdasarkan
   ingatan/asumsi dari chat history — file bisa udah berubah dari sesi sebelumnya.
2. Kalau user kasih **screenshot bug**, coba reproduce dulu di kepala: baca kode
   yang relevan, jangan langsung nebak/nambal gejala. Beberapa bug yang pernah
   kejadian di project ini akar masalahnya nggak intuitif (lihat §5 — Jebakan).
3. Setelah edit HTML-template-di-dalam-JS-string, **selalu validasi struktur**
   sebelum ngasih file ke user (lihat §6 — cara validasi). Ini WAJIB karena
   bug paling parah yang pernah kejadian di project ini adalah HTML yang gagal
   nge-nest dengan benar (§5.1).
4. Kirim balik **HANYA file yang berubah** (bukan seluruh zip), kecuali user
   minta zip utuh. User lebih suka replace file satu-satu ke project asli dia.
5. Pakai `present_files` buat setiap file yang dikasih ke user.

---

## 4. Gaya Komunikasi yang Dipakai User

- User nulis santai, campur huruf besar buat emphasis, kadang typo — itu normal,
  jangan dikoreksi, langsung pahami maksudnya.
- Bahasa Indonesia informal ("gua/lo" register), balas dengan register yang sama
  (bukan bahasa formal/baku).
- User SUKA penjelasan **root cause**, bukan cuma "udah aku benerin". Selalu
  jelasin KENAPA bug itu terjadi sebelum ngejelasin fix-nya — user teknikal dan
  menghargai pemahaman, bukan cuma hasil.
- Kalau user kasih beberapa poin dalam 1 pesan (poin 1, poin 2, dst), kerjain
  SEMUA poin dalam 1 balasan, jangan cuma sebagian terus nanya lanjut.
- Kalau ada mockup/referensi visual (screenshot Canva dkk), ikutin sedetail
  mungkin tapi tetep kasih tau keterbatasan teknis kalau ada (contoh: font
  custom Canva "More Sugar" nggak bisa di-embed ke web, jadi dikasih fallback
  dan dijelasin kenapa).

---

## 5. Jebakan & Pola Penting (WAJIB paham sebelum edit)

### 5.1. Panel show/hide — JANGAN PERNAH kasih `display` di ID selector tanpa `.active`

Semua panel pakai pola:
```css
.gdg-panel { display: none; }
.gdg-panel.active { display: block; }
```
```js
document.getElementById('gdg-panel-xxx').classList.toggle('active', kondisi);
```

**JEBAKAN YANG PERNAH KEJADIAN:** nulis rule kayak
`#gdg-panel-pendapatan { display: flex; }` (ID selector, TANPA `.active`) —
ini spesifisitasnya LEBIH TINGGI dari `.gdg-panel{display:none}`, jadi panel
itu **selalu keliatan** biarpun nggak aktif, numpuk di atas panel lain (bocor
data antar halaman). FIX: selalu tulis `#gdg-panel-xxx.active { display: ...; }`
kalau butuh override display selain `block` (misal butuh `flex`).

### 5.2. Validasi HTML setelah edit — hitung jumlah tag doang TIDAK CUKUP

Jumlah `<div>` == jumlah `</div>` bisa sama padahal nesting-nya salah (div
ke-tutup di tempat yang salah, ke-nest di parent yang salah). WAJIB pakai
depth-checker (lihat §6), bukan cuma `grep -c`.

### 5.3. `@import` CSS di tengah `<style>` block = di-skip diem-diem

`@import url(...)` WAJIB jadi baris PALING PERTAMA di sebuah stylesheet.
Kalau ditaruh di tengah (misal buat load Google Font), browser SKIP baris itu
tanpa error apapun — susah didebug karena keliatannya "harusnya jalan".
**Solusi yang dipakai:** load font via `<link rel="stylesheet">` yang di-`
appendChild` ke `document.head` lewat JS (sekali aja, ada guard biar nggak
dobel), BUKAN `@import` di dalam `<style>` template.

### 5.4. Spesifisitas CSS vs inline style vs class lain

Banyak elemen di file ini punya `style="font-family:var(--f)"` inline, dan
`style.css` global punya puluhan class spesifik (`.m-value`, dst) yang set
property sendiri. Kalau mau override tampilan sebuah section secara total
(contoh: tema notebook khusus `#page-gadag`), **inline style menang lawan
apapun kecuali `!important`**. Solusinya pakai universal selector +
`!important`: `#page-gadag *:not(i):not(.ti) { ... !important; }` — TAPI
selalu exclude elemen ikon (`<i class="ti ti-*">`), soalnya ikon itu font
khusus (tabler-icons) yang render glyph lewat font-family; kalau ke-timpa,
ikon jadi kotak kosong.

### 5.5. iOS Safari vs Android — kapan beda, kapan nggak

- Perbedaan device Android vs iPhone **HAMPIR SELALU** soal device-width
  (`@media max-width:900px`), BUKAN soal OS. Jangan buat logic yang cabang
  berdasarkan deteksi OS kalau nggak kepepet.
- iOS Safari kasih efek "mental"/bouncy pas scroll (elastic/rubber-band) dan
  scrollTop kadang nggak monotonic pas momentum-scroll — kalau bikin logic
  collapse/expand berbasis scroll listener, WAJIB kasih noise threshold +
  cooldown (lihat pola di `_gdgInitScrollCollapse`), jangan react ke tiap
  event scroll mentah-mentah.
- Modal/bottom-sheet yang responsif ke keyboard iOS **WAJIB** pakai
  `window.visualViewport` (resize + scroll listener), bukan cuma `dvh` CSS —
  `dvh` cuma ngitung UI browser (address bar), BUKAN keyboard.
- Font system (`Comic Sans MS`, dst) cuma ada di iOS, nggak ada di Android
  stock. Kalau butuh tampilan identik di kedua platform, font WAJIB di-load
  sendiri (Google Fonts/self-hosted), jangan andalin font sistem sebagai
  prioritas pertama di font-stack.
- App ini pakai `<meta name="color-scheme" content="dark">` global (`index.html`)
  — native form control (date picker dsb) akan selalu dark, walau card di
  sekitarnya udah tema terang. Ini expected behavior, bukan bug, kecuali
  user minta diubah global.

### 5.6. Service Worker (`sw.js`) — cache strategy per tipe file

- `JS_APP_FILES` (termasuk `gadag.js`, `autocomplete.js`) → **network-first**,
  jadi update ke file ini nyampe ke user relatif cepat.
- CDN/font (`fonts.googleapis.com`, `fonts.gstatic.com`) → **cache-first**.
  URL font BARU (belum pernah di-fetch) tetap bisa network-fetch pertama kali
  (cache-miss → fetch → cache), TAPI kalau app di-install sebagai PWA,
  service worker versi lama bisa nyangkut sampai ada update-cycle — kalau user
  bilang "perubahan nggak muncul di manapun" padahal kode udah bener, curigai
  ini juga, bukan cuma kesalahan kode.

### 5.7. Mobile-only vs semua-platform

Kalau user minta perubahan **khusus HP** (bukan laptop), JANGAN ubah elemen
yang sama — bikin 2 versi (desktop & mobile) pakai class toggle:
```css
.gdg-mobile-only { display: none; }
@media (max-width: 900px) {
  .gdg-desktop-only { display: none !important; }
  .gdg-mobile-only  { display: block; }
}
```
Breakpoint `900px` ini yang udah dipakai konsisten di seluruh modul Gadag buat
mobile/desktop split (sama kayak breakpoint bottom-sheet). Pertahanin angka ini
biar konsisten, jangan bikin breakpoint baru tanpa alasan kuat.

### 5.8. Copyright/font Canva

Font eksklusif Canva (misal "More Sugar") TIDAK BISA di-embed ke web. Kalau
user minta font semacam itu, cari font Google Fonts yang paling mirip sebagai
pengganti, dan bilang terus terang kenapa nggak bisa pakai yang asli.

---

## 6. Cara Validasi Sebelum Present File ke User

Jalanin ini di `bash_tool` SETIAP KALI abis edit HTML-template-di-dalam-JS,
sebelum `present_files`:

```bash
node -e "
const fs = require('fs');
let c = fs.readFileSync('NAMA_FILE.js','utf8');
console.log('brace {', (c.match(/\{/g)||[]).length, '} ', (c.match(/\}/g)||[]).length);

const start = c.indexOf('innerHTML = \`');
const end   = c.indexOf('\`;', start);
const html  = c.slice(start, end);
const tags  = html.match(/<div\b[^>]*>|<\/div>/g) || [];
let depth = 0, bad = false;
for (const t of tags) {
  if (t.startsWith('<div')) depth++;
  else { depth--; if (depth < 0) bad = true; }
}
console.log('final div depth (harus 0):', depth, bad ? '❌ ADA YANG MINUS DI TENGAH' : '✅');
"
```

Kalau depth akhir bukan 0, ATAU sempat minus di tengah proses, JANGAN kirim
file itu — cari `</div>` yang ilang/nyasar dulu.

Untuk cek panel-panel sejajar (bukan numpuk nested), pakai variasi script yang
nge-track depth tiap `id="gdg-panel-xxx"` ketemu — semua panel harus punya
depth yang SAMA (lihat riwayat percakapan buat contoh scriptnya).

---

## 7. Database (Supabase)

- Helper yang udah ada (`supabase.js`): `dbGet(table, filter)`,
  `dbInsert(table, payload)`, `dbUpdate(table, id, payload)`,
  `dbDelete(table, id)`. Filter format: `'&kolom=eq.nilai'` (leading `&`).
- **Tidak ada auth/session** — semua akses lewat anon key langsung dari client.
- Kalau bikin tabel baru dan Supabase nanya soal RLS (Row Level Security):
  pilih **"Run without RLS"**, biar konsisten sama tabel-tabel lain yang udah
  ada (yang juga nggak pakai RLS). Kalau pilih "Run and enable RLS" tanpa
  nambahin policy, tabel itu bakal nolak SEMUA request dari app (termasuk yang
  sah), error "permission denied".
- Uang/currency disimpan sebagai `numeric` polos (tanpa simbol/titik), format
  tampilan "Rp xxx.xxx" itu kerjaan fungsi `gdgFmt()` di JS, BUKAN di database.

**Tabel yang udah ada (Gadag):**
```sql
gadag_sku        { id, nama, ongkos_lusin, created_at }
gadag_pendapatan { id, tanggal, hari, warna, sku_id, sku_nama, ongkos_lusin, qty, total, created_at }
gadag_anggaran   { id, minggu_mulai (date, unique), target (numeric), deskripsi (text, opsional), created_at }
```

---

## 8. Pola UI yang Udah Establish (ikutin biar konsisten)

- **Minggu kerja** = Minggu s.d Sabtu (bukan Senin-Minggu). Helper:
  `gdgWGetMonday(date)` (namanya "Monday" tapi return hari Minggu — legacy
  naming, jangan bingung), `gdgWToISO(date)`, `gdgWFmtRange(start,end)` (format
  ringkas kayak "10-17 Ags 2026").
- **Bottom-sheet modal** (mobile) pola IG-comment-style: drag handle di atas,
  slide-up animation, sync ke `visualViewport`, drag-to-close di handle-nya
  aja (bukan di seluruh body sheet, biar nggak nabrak scroll form).
- **Long-press buat edit** (dipilih user daripada tombol Aksi/hapus per baris):
  touchstart+setTimeout(~500ms)+cek movement threshold buat batalin kalau
  ternyata itu scroll, bukan tekan-lama. Support juga mousedown/mouseup versi
  desktop.
- **Header per-panel** = 1 baris gabungan: `[Refresh] [tombol aksi lain kalau
  ada] [ikon+judul panel] ......... [dropdown menu pilih panel]`. JANGAN bikin
  toolbar Refresh terpisah di tiap panel lagi — itu udah dirapikan jadi 1 pola
  seragam di semua panel.
- **Card count/label** = tampilin info yang BERGUNA (jumlah data, dsb), BUKAN
  ngulang nama panel yang udah ada di judul besar di atasnya (contoh: card
  "Catatan" nggak perlu judul "Catatan" lagi di dalamnya, ganti jadi counter
  "7 catatan").
- **Export PDF** = pakai `window.print()` + area cetak tersembunyi
  (`#gdg-print-area`, CSS `@media print`), BUKAN library PDF eksternal — lebih
  ringan, nggak nambah dependency/caching, dan hasilnya konsisten di Android
  & iPhone (keduanya punya "Save as PDF" bawaan di dialog print).

---

## 9. Workflow Tiap Sesi Baru

1. Extract file .zip yang user upload.
2. Baca file ini (`RULES.md`) SAMPAI HABIS.
3. Kalau user nunjuk modul spesifik (misal "di Gadag"), `view` file JS-nya
   dulu SEBELUM ngerjain apapun — jangan asumsi struktur dari dokumentasi ini
   doang, dokumentasi bisa ketinggalan kalau ada perubahan besar belakangan.
4. Kerjain sesuai §3, §4, §5.
5. Validasi sesuai §6 sebelum kirim file.
6. Kirim file yang berubah aja lewat `present_files`, kasih rekap perubahan
   dengan gaya bahasa sesuai §4 (santai, root-cause dulu baru fix).
