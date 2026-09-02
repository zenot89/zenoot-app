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

**Palet brand (4 warna netral, dikonfirmasi user 2 Sep 2026):**
| Nama | Hex | CSS var (`:root`) | Pemakaian |
|---|---|---|---|
| Abu tua | `#2B2B2B` | `--ink` | teks, tombol utama, badge |
| Putih | `#FFFFFF` | `--cream2` | background kartu/menu |
| Abu muda | `#F0EFEB` | `--cream` | background halaman |
| Abu netral | `#8A8580` | `--ink2` | subteks/keterangan |

Ini murni netral (gak ada warna aksen kayak merah/ijo/biru) — status color
(`--danger`, `--ok`, `--info`, `--warn`) itu sistem TERPISAH, jangan disamain
sebagai "warna brand" pas user nyebut itu.

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

### 5.8.5. Input teks yang harusnya "nyambung" ke tabel lain → pakai `acAttach`, bukan free-text polos

Ada modul (`autocomplete.js`) yang nempelin dropdown saran ke sebuah
`<input>`, isinya dari kolom tabel Supabase lain (bukan histori
session — beneran query). Dipakai pas ada 2 field di modul BEDA yang
konsepnya harusnya sama tapi disimpan sebagai teks bebas masing-masing
(rawan typo bikin mismatch senyap, gak ada error, cuma logic di modul lain
diam-diam salah — contoh nyata: `restock_supplier.boss` (teks bebas) vs
`produk.boss` (sumber asli), lihat §7 kalau nambah source baru — key baru
di `_acSources`, terus `acAttach(input, 'key_baru')` pas modal render/buka.
JANGAN bikin field itu jadi `<select>` native (lihat §5.5 soal native
control) — autocomplete ini yang jadi standarnya, tetap ngizinin ketik bebas
buat kasus valid yang belum ada di tabel sumbernya.

### 5.8.6. Container yang "harus selalu beda tema" dari `:root` — WAJIB re-scope CSS var, gak otomatis ngikut

Beberapa container di-hardcode background-nya beda dari tema default halaman
(`.sidebar` selalu gelap `#0e0e0e` walau app-nya tema terang; card
Net Worth/Beban/FCF di Dashboard — `#nw-swipe-container` — sengaja beda tema
juga). Kalau container kayak gini CUMA hardcode `background`-nya doang tanpa
ikut redeclare custom property (`--ink`, `--ink3`, `--danger`, `--ok`, dst),
elemen di dalamnya yang baca `var(--ink)` dkk bakal ambil nilai dari `:root`
— yang didesain buat tema SEBALIKNYA. Hasilnya teks nyaris invisible (teks
terang di atas bg terang, atau teks gelap di atas bg gelap), TAPI CSS-nya
keliatan "benar" kalau cuma dibaca sekilas (gak ada typo, gak ada error).

**Kejadian nyata:** teks "zenOt" di logo sidebar & label nav-item aktif
nyaris gak keliatan (root `--ink`/`--active-nav` itu buat tema terang, dibaca
sidebar yang selalu gelap). Juga di Dashboard: label & badge di card Net
Worth pakai warna yang sama persis kayak background barunya.

**Pola fix yang established:** scope ulang custom property yang relevan di
level container (`#page-gadag`, `.sidebar`, `#nw-swipe-container` — lihat
kode buat contoh), BUKAN hardcode warna satu-satu di tiap child selector.
Keuntungan: otomatis ke-apply ke elemen yang warnanya di-inject inline dari
JS pakai `style="color:var(--danger)"` juga (lihat §5.11 kenapa ini penting).

**WAJIB dicek sebelum nganggep beres:** trace SEMUA child yang baca custom
property itu di dalam container-nya (bukan cuma yang keliatan di screenshot
user) — termasuk badge, hover state, placeholder text, dan style inline yang
di-generate JS (`element.style.color = 'var(--xxx)'` atau template string
`style="color:var(--xxx)"`). Grep `var(--nama-property)` di file `.js` yang
relevan, jangan cuma di `style.css`.

### 5.8.7. File JS bisa punya duplikat inline `<style>` — cek semua file, jangan cuma `style.css`

Beberapa modul (`networth.js`) nyimpen COPY dari sebagian rule CSS yang juga
ada di `style.css` (inject `<style>` sendiri saat widget-nya di-render).
Kalau cuma edit `style.css` dan lupa cek duplikatnya, hasil fix bisa ke-override
lagi tergantung urutan cascade (siapa yang nge-load terakhir menang kalau
spesifisitasnya sama). **Sebelum nganggep 1 file css cukup buat fix warna/style
sebuah komponen, `grep` nama class-nya di SEMUA file `.js`** — kalau ketemu
duplikat, edit semuanya sekaligus biar konsisten.

### 5.8.8. Live site (`zenot89.github.io`) bisa beda versi dari zip yang di-upload user

Pernah kejadian: nilai `--danger` di `:root` (`style.css` dalam zip) beda
dari warna yang benar-benar ke-render di screenshot live site user (root
bilang satu hex, tapi yang muncul di layar persis nilai fallback lama —
indikasi live site jalanin versi `style.css` yang beda/lebih lama dari yang
ada di zip). **Kalau nemu kejanggalan gini, jangan maksa nyocokin analisis
ke pixel screenshot** — cukup flag ke user sebagai catatan ("live site
mungkin belum sinkron sama zip ini"), dan tetap kerjain fix berdasarkan
KODE YANG ADA DI ZIP (itu yang bakal di-replace user), bukan berdasarkan
nebak-nebak dari pixel yang mungkin representasi versi lama.



**Gejala:** tombol Export PDF bikin app **force-close total** (bukan error
JS biasa yang bisa di-`alert()`) — kejadian di Android, khusus pas app
dibuka lewat **PWA yang di-"Add to Home Screen"** (`display:standalone`),
bukan pas dibuka lewat tab Chrome biasa.

**Histori percobaan yang GAGAL** (dari kasus nyata di Cost Produksi, 29 Agu
2026 — semua modul yang masih pakai pola pertama di bawah ini KEMUNGKINAN
BESAR juga kena, termasuk Gadag & Hutang Barang per saat ditulis):

1. **`window.open(blobURL, '_blank')` + `window.print()`** (pola lama Gadag,
   `gdgExportRiwayatPDF` dkk) — CRASH. Teori awal: `blob:` URL cuma valid di
   proses yang bikin dia, `window.open` coba lempar ke browsing context lain
   (tab/window baru) → force close.
2. **jsPDF + autoTable, `doc.save()` buat Android/desktop, `navigator.share()`
   buat iOS** (pola yang dipakai `hutang-supplier.js`, awalnya dikira udah
   fix) — user lapor **masih crash juga** di Android, padahal jalur Android
   di sini SAMA SEKALI nggak manggil `window.open` ataupun `navigator.share`.
   Ini yang bikin teori #1 di atas jadi diragukan — kemungkinan bukan cuma
   soal blob-lintas-context, tapi jsPDF+autoTable sendiri (library berat)
   yang bikin memory pressure di WebView standalone PWA (yang resource-nya
   lebih terbatas dibanding tab Chrome biasa).
3. **jsPDF + autoTable, `navigator.share()` dicoba juga di Android** — masih
   crash (belum ke-konfirmasi beda dari #2).

**Pola yang KEBUKTI JALAN (dikonfirmasi user via screenshot Android, 30 Agu
2026) — status FINAL, jangan diutak-atik lagi tanpa laporan crash baru:**

jsPDF + autoTable seperti biasa, tapi delivery-nya `navigator.share({ files:
[pdfFile] })` **TANPA field `title`**, dicoba di SEMUA platform (bukan cuma
iOS), fallback ke `doc.save()` kalau `canShare` gak ada / share gagal /
user cancel. Konfirmasi: PDF "SLIP BAYARAN KARYAWAN" dari Cost Produksi
berhasil terkirim ke WhatsApp di Android PWA standalone, gak force-close.

```js
if (navigator.canShare) {
  try {
    var pdfFile = new File([doc.output('arraybuffer')], fileName, { type: 'application/pdf' });
    if (navigator.canShare({ files: [pdfFile] })) {
      navigator.share({ files: [pdfFile] }).catch(function(err) {
        if (err && err.name !== 'AbortError') doc.save(fileName);
      });
      return;
    }
  } catch (e) { /* fallback ke doc.save() di bawah */ }
}
doc.save(fileName);
```

Kenapa `title` dibuang: percobaan awal (yang masih dianggap "aman" waktu itu)
nyertain `title: fileName`, dan itu bikin sebagian target app share (Samsung
Notes dkk) munculin dialog perantara ("Pilih format PDF") sebelum file
beneran terkirim — nambah klik yang gak perlu. Files-only = share sheet
langsung muncul, minim langkah.

Sudah diterapin di `cpDoExportJurnalPDFInner` (cost-produksi.js) dan
`hsBuildAndDeliverBonPDF` (hutang-supplier.js) per 30 Agu 2026. Kalau nambah
export PDF baru di modul lain (Gadag dkk), pakai pola inilah, BUKAN
`window.open(blob)` (percobaan #1, gagal) atau iframe hidden print
(sempat jadi rencana cadangan, tapi gak jadi dipakai — kepentok lebih ribet
+ browser print dialog default nempelin header/footer URL halaman kecuali
user manual matiin, jadi bukan pilihan yang direkomendasiin).

**Cara diagnosis kalau ternyata masih ada laporan crash di device lain:**
minta user sambungin HP Android ke laptop via USB, buka `chrome://inspect`
di Chrome laptop, reproduce bug-nya, liat console log SEBELUM app
force-close. Itu satu-satunya cara dapet signal asli — jangan nebak-nebak
berkali-kali tanpa data kayak yang kejadian di histori percobaan #1-3 di atas.

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

### 6.1. Validasi kontras warna (WCAG) sebelum ngasih rekomendasi/fix warna teks

Kalau kerjaannya ganti warna background/teks (bukan cuma layout/logic),
JANGAN nebak "kayaknya kontras" dari mata doang — hitung rasio WCAG-nya:

```python
def lin(c):
    c/=255
    return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
def lum(hex):
    hex=hex.lstrip('#')
    r,g,b=int(hex[0:2],16),int(hex[2:4],16),int(hex[4:6],16)
    return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)
def contrast(a,b):
    la,lb=lum(a),lum(b)
    L1,L2=max(la,lb),min(la,lb)
    return (L1+0.05)/(L2+0.05)
```

Target minimum: **4.5:1** buat teks normal (AA), **3:1** buat teks besar/bold
(≥18.66px bold atau ≥24px), **7:1** kalau user minta "lebih kontras lagi" (AAA).
Kalau background-nya semi-transparan (badge `rgba(...)`), hitung dulu warna
hasil composite-nya di atas base background sebelum ngukur kontras teksnya
(jangan ukur langsung ke warna rgba mentahnya). Sample pixel asli dari
screenshot user (`PIL.Image.getpixel`) kalau ada keraguan warna yang
BENERAN ke-render vs yang tertulis di CSS (lihat §5.8.8).

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

## 7.5. Service Worker (`sw.js`) — Kapan WAJIB Bump Cache Version

`sw.js` punya 3 bucket cache beda strategi:

- **`CACHE_VERSION`** (`STATIC_ASSETS`: `logo.png`, `icon-192.png`, `icon-512.png`,
  `gadag-icon.png`, `manifest.json`) → **cache-first**, gambar/aset statis.
- **`JS_CACHE`** (semua file `.js` + `style.css`) → **network-first**, selalu
  ambil versi terbaru. Auto di-bump tiap push ke `main` lewat
  `.github/workflows/auto-version.yml` (hash `*.js style.css index.html`).
- **`index.html`** → **selalu network**, tidak pernah dicache sama sekali.

**Akibatnya:** ganti isi file JS/CSS/HTML → user langsung dapet versi baru,
gak perlu ngapa-ngapain (auto-version.yml udah handle). TAPI kalau yang
diganti isinya salah satu dari 5 `STATIC_ASSETS` di atas (paling sering:
ganti `gadag-icon.png` atau icon lain) → CI **TIDAK** nyentuh `CACHE_VERSION`,
jadi browser bakal keukeuh serve file lama selama-lamanya walau filenya udah
diganti di server/hosting.

**Rule:** setiap kali isi salah satu `STATIC_ASSETS` diganti (bukan cuma
ditambah — replace konten file yang sudah ada), **WAJIB** manual bump versi
di `sw.js`:

```js
var CACHE_VERSION = 'zenot-static-v28'; // naikin angka + komentar alasannya
```

Gak perlu bump kalau yang diubah cuma JS/CSS/HTML biasa (itu udah auto).
Kejadian nyata: `gadag-icon.png` diganti (bg transparan) tapi `CACHE_VERSION`
lupa di-bump → user masih liat versi lama (bg hitam) walau file udah bener
di-deploy. Fix-nya bump `v27` → `v28`.

---

## 7.6. `present_files` — Kirim `sw.js` Juga Kalau Bump Cache Version

Kalau sesi ini bump `CACHE_VERSION` di `sw.js` (lihat §7.5), **`sw.js` WAJIB**
ikut di-`present_files`-kan ke user sebagai salah satu file yang berubah —
jangan cuma bilang "udah dibenerin" tanpa ngirim file aktualnya (user perlu
replace file itu di project dia, sama kayak semua file lain yang diedit).

---

## 8. Pola UI yang Udah Establish (ikutin biar konsisten)
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
- **Export PDF** = jsPDF+autoTable → `navigator.share({ files:[pdfFile] })`
  (TANPA `title`) di semua platform, fallback `doc.save()`. BUKAN
  `window.open(blob)`, BUKAN `window.print()`/iframe print. Detail lengkap +
  histori percobaan yang GAGAL sebelum ketemu pola ini: lihat §5.9.

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
