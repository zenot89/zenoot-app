// ─── PERIODE-PICKER.JS (12 Nov 2026) ─────────────────────────
// Komponen pemilih periode BERSAMA — tampilan & perilaku sama dengan picker periode Jurnal Penjualan
// (HP = bottom sheet, laptop >=768px & tinggi >=521px = popover dua panel di bawah tombol).
// Dipakai oleh: kas.js (pil atas, Laporan, Cashflow) dan keuangan-pribadi.js.
// (jurnal-penjualan.js masih memakai picker aslinya sendiri — belum dipindah ke komponen ini.)
//
// POLA: komponen TIDAK menyimpan pilihan. Tiap halaman/picker memegang state-nya sendiri (objek {mode,hari,dari,sampai,bulan,tahun}),
// jadi periode antar halaman — dan antar picker dalam 1 halaman — saling terpisah. Cara pakai:
//   var st = zpDefault('bulan-ini');
//   zpOpen(tombol, { get: function(){ return st; }, set: function(s){ st = s; }, onApply: function(){ ...render ulang... } });
//   zpRange(st) -> {s:'YYYY-MM-DD', e:'YYYY-MM-DD'} (inklusif) atau null = Semua;  zpLabel(st) -> teks tombol;  zpIn(tanggal, rng) -> boolean.
// Mode: hari-ini, kemarin, minggu-ini, minggu-lalu, minggu-w:<-N>, 7hari, 30hari, hari, rentang, bulan, bulan-ini, bulan-lalu, 3bulan, tahun, semua.
// Definisi minggu = Minggu s/d Sabtu menurut TANGGAL (tabel jurnal tidak punya jam, jadi tidak ada cutoff Sabtu 19.30 seperti Jurnal Penjualan).
// "7 Hari Terakhir"/"30 Hari Terakhir" = hari ini mundur 7/30 hari s/d hari ini (sama persis dengan Jurnal Penjualan).

var ZP_BLN   = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
var ZP_BLN_L = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
var ZP_ITEMS = [
  { k: 'hari-ini',   l: 'Hari Ini' },
  { k: 'kemarin',    l: 'Kemarin' },
  { k: 'minggu-ini', l: 'Minggu Ini' },
  { k: '7hari',      l: '7 Hari Terakhir' },
  { k: '30hari',     l: '30 Hari Terakhir' },
  { k: 'hari',       l: 'Per Hari',        sub: true, sep: true },
  { k: 'minggu',     l: 'Per Minggu',      sub: true },
  { k: 'bulan',      l: 'Per Bulan',       sub: true },
  { k: 'tahun',      l: 'Per Tahun',       sub: true },
  { k: 'rentang',    l: 'Rentang Tanggal', sub: true }
];
var ZP_SUBPRESET = [
  { k: 'minggu-ini',  l: 'Minggu Ini',       view: 'minggu' },
  { k: 'minggu-lalu', l: 'Minggu Lalu',      view: 'minggu' },
  { k: 'bulan-ini',   l: 'Bulan Ini',        view: 'bulan' },
  { k: 'bulan-lalu',  l: 'Bulan Lalu',       view: 'bulan' },
  { k: '3bulan',      l: '3 Bulan Terakhir', view: 'bulan' },
  { k: 'semua',       l: 'Semua',            view: 'tahun' }
];
var ZP_SHORT  = { 'hari-ini': 'Hari Ini', 'kemarin': 'Kemarin', '7hari': '7 Hari', '30hari': '30 Hari', 'minggu-ini': 'Minggu Ini', 'minggu-lalu': 'Minggu Lalu', '3bulan': '3 Bulan', 'semua': 'Semua' };
var ZP_TITLES = { list: 'Pilih Periode', hari: 'Pilih Hari', minggu: 'Pilih Minggu', rentang: 'Pilih Rentang', bulan: 'Pilih Bulan', tahun: 'Pilih Tahun' };

// ── tanggal ──
function _zpPad(n) { return String(n).padStart(2, '0'); }
function zpDate(d) { return d.getFullYear() + '-' + _zpPad(d.getMonth() + 1) + '-' + _zpPad(d.getDate()); }
function zpParse(s) { var p = String(s).split('-'); return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)); }
function zpAdd(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function _zpWeekStart(now, off) { return zpAdd(now, -now.getDay() + 7 * off); }   // Minggu 00.00 dari minggu ke-(off) relatif minggu ini
function _zpWeekOff(mode) {
  if (mode === 'minggu-ini') return 0;
  if (mode === 'minggu-lalu') return -1;
  var m = /^minggu-w:(-?\d+)$/.exec(String(mode || ''));
  return m ? parseInt(m[1], 10) : null;
}
function _zpIsWeek(mode) { return _zpWeekOff(mode) !== null; }
// 'YYYY-MM-DD' -> '30 Sep' (tambah tahun kalau bukan tahun berjalan)
function _zpFmt(str) {
  var p = String(str).split('-');
  if (p.length < 3) return '';
  var out = parseInt(p[2], 10) + ' ' + ZP_BLN[parseInt(p[1], 10) - 1];
  if (parseInt(p[0], 10) !== new Date().getFullYear()) out += ' ' + p[0];
  return out;
}
function _zpNumDate(d) { return _zpPad(d.getDate()) + '-' + _zpPad(d.getMonth() + 1) + '-' + d.getFullYear(); }
// 'a'..'b' -> "5–11 Okt" / "28 Sep–4 Okt"
function _zpSpan(a, b) {
  if (!a) return '';
  if (!b || b === a) return _zpFmt(a);
  var pa = a.split('-'), pb = b.split('-');
  if (pa[0] === pb[0] && pa[1] === pb[1]) return parseInt(pa[2], 10) + '–' + _zpFmt(b);
  return _zpFmt(a) + '–' + _zpFmt(b);
}
function _zpWeekText(off) {
  var ws = _zpWeekStart(new Date(), off);
  return _zpSpan(zpDate(ws), zpDate(zpAdd(ws, 6)));
}

// ── state & rentang ──
function zpDefault(mode) { return { mode: mode || 'bulan-ini', hari: '', dari: '', sampai: '', bulan: '', tahun: '' }; }
function _zpCopy(s) { return { mode: s.mode, hari: s.hari, dari: s.dari, sampai: s.sampai, bulan: s.bulan, tahun: s.tahun }; }

// Rentang tanggal INKLUSIF {s,e} ('YYYY-MM-DD') untuk 1 state; null = Semua (tanpa batas).
function zpRange(st, now) {
  now = now || new Date();
  var m = st.mode, y, mo, p;
  if (m === 'hari-ini') return { s: zpDate(now), e: zpDate(now) };
  if (m === 'kemarin')  { var k = zpDate(zpAdd(now, -1)); return { s: k, e: k }; }
  var off = _zpWeekOff(m);
  if (off !== null) { var ws = _zpWeekStart(now, off); return { s: zpDate(ws), e: zpDate(zpAdd(ws, 6)) }; }
  if (m === '7hari')  return { s: zpDate(zpAdd(now, -7)),  e: zpDate(now) };
  if (m === '30hari') return { s: zpDate(zpAdd(now, -30)), e: zpDate(now) };
  if (m === 'hari')   { var h = st.hari || zpDate(now); return { s: h, e: h }; }
  if (m === 'rentang') {
    if (!st.dari) return { s: zpDate(now), e: zpDate(now) };
    var a = st.dari, b = st.sampai || st.dari;
    return a <= b ? { s: a, e: b } : { s: b, e: a };
  }
  if (m === 'bulan-ini' || m === 'bulan-lalu' || m === 'bulan') {
    if (m === 'bulan') { p = String(st.bulan || '').split('-'); y = parseInt(p[0], 10); mo = parseInt(p[1], 10) - 1; if (isNaN(y) || isNaN(mo)) { y = now.getFullYear(); mo = now.getMonth(); } }
    else { y = now.getFullYear(); mo = now.getMonth() - (m === 'bulan-lalu' ? 1 : 0); }
    return { s: zpDate(new Date(y, mo, 1)), e: zpDate(new Date(y, mo + 1, 0)) };
  }
  if (m === '3bulan') return { s: zpDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)), e: zpDate(now) };
  if (m === 'tahun')  { y = parseInt(st.tahun, 10) || now.getFullYear(); return { s: y + '-01-01', e: y + '-12-31' }; }
  return null;   // 'semua'
}
// Apakah 1 tanggal ('YYYY-MM-DD...' / timestamp) masuk rentang? rng null = Semua.
function zpIn(tgl, rng) {
  if (!rng) return true;
  var d = String(tgl || '').slice(0, 10);
  return d >= rng.s && d <= rng.e;
}
// 'YYYY-MM' kalau rentang PERSIS 1 bulan kalender penuh (tgl 1 s/d akhir bulan), selain itu ''.
function zpSingleMonth(st) {
  var r = zpRange(st);
  if (!r || r.s.slice(0, 7) !== r.e.slice(0, 7) || r.s.slice(8) !== '01') return '';
  var p = r.s.split('-');
  return r.e === zpDate(new Date(parseInt(p[0], 10), parseInt(p[1], 10), 0)) ? r.s.slice(0, 7) : '';
}
function _zpMonthLabel(ym) { var p = ym.split('-'); return ZP_BLN[parseInt(p[1], 10) - 1] + ' ' + p[0]; }
// Teks ringkas periode (tombol & sub-label kartu)
function zpLabel(st) {
  var m = st.mode, r;
  if (m === 'hari') return st.hari ? _zpFmt(st.hari) : 'Hari';
  var off = _zpWeekOff(m);
  if (off !== null) return (m === 'minggu-ini' || m === 'minggu-lalu') ? ZP_SHORT[m] : _zpWeekText(off);
  if (m === 'rentang') { r = zpRange(st); return _zpSpan(r.s, r.e); }
  if (m === 'bulan-ini' || m === 'bulan-lalu' || m === 'bulan') return _zpMonthLabel(zpSingleMonth(st));
  if (m === 'tahun') return String(parseInt(st.tahun, 10) || new Date().getFullYear());
  return ZP_SHORT[m] || 'Periode';
}

// ── gaya (disuntik sekali ke <head>, salinan gaya picker Jurnal Penjualan dengan prefix zp-) ──
(function _zpStyle() {
  if (document.getElementById('zp-style')) return;
  var st = document.createElement('style');
  st.id = 'zp-style';
  st.textContent = ''
    + '#zp-ov{position:fixed;inset:0;z-index:600;background:rgba(0,0,0,.5);opacity:0;visibility:hidden;touch-action:none;transition:opacity .25s ease,visibility 0s linear .25s}'
    + '#zp-ov.open{opacity:1;visibility:visible;transition:opacity .25s ease,visibility 0s}'
    + '#zp-sheet{position:fixed;left:0;right:0;bottom:0;margin:0 auto;width:100%;max-width:480px;z-index:601;background:var(--cream2);border-radius:20px 20px 0 0;transform:translateY(100%);visibility:hidden;transition:transform .28s cubic-bezier(.4,0,.2,1),visibility 0s linear .28s;padding-bottom:env(safe-area-inset-bottom,12px);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -8px 32px rgba(0,0,0,.25)}'
    + '#zp-sheet.open{transform:translateY(0);visibility:visible;transition:transform .28s cubic-bezier(.4,0,.2,1),visibility 0s}'
    + '#zp-head{flex:none;position:relative;touch-action:none}'
    + '#zp-handle{width:40px;height:4px;background:var(--ovl-0_18);border-radius:2px;margin:10px auto 2px}'
    + '#zp-title{text-align:center;font-size:16px;font-weight:700;color:var(--ink);padding:8px 52px 12px;letter-spacing:-0.2px}'
    + '#zp-back,#zp-close{position:absolute;top:12px;width:32px;height:32px;border:none;padding:0;background:var(--ovl-0_06);border-radius:50%;color:var(--ink3);font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '#zp-close{right:12px}'
    + '#zp-back{left:12px;display:none}'
    + '#zp-sheet.sub #zp-back{display:flex}'
    + '#zp-body{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 10px 10px}'
    + '.zp-pl-item{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;box-sizing:border-box;padding:13px 12px;border:none;background:none;border-radius:10px;font-family:var(--f);font-size:15px;font-weight:500;color:var(--ink);text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '.zp-pl-item.active{font-weight:700}'
    + '.zp-pl-item:active{background:var(--ovl-0_08)}'
    + '.zp-pl-right{display:flex;align-items:center;gap:6px;color:var(--ink4);font-size:16px}'
    + '.zp-pl-sum{font-size:13px;font-weight:600;color:var(--ink3)}'
    + '.zp-pl-check{color:var(--accent);font-size:18px}'
    + '.zp-pl-sep{height:1px;background:var(--ovl-0_08);margin:6px 4px}'
    + '.zp-pc-nav{display:flex;align-items:center;justify-content:space-between;padding:2px 4px 8px}'
    + '.zp-pc-nav button{width:36px;height:36px;border:none;padding:0;background:var(--ovl-0_06);border-radius:50%;color:var(--ink);font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '.zp-pc-navg{display:flex;gap:2px}'
    + '.zp-pc-month{font-size:15px;font-weight:700;color:var(--ink)}'
    + '.zp-pc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px 0;padding:0 4px}'
    + '.zp-pc-dow{text-align:center;font-size:11px;font-weight:700;color:var(--ink3);padding:6px 0}'
    + '.zp-pc-day{height:40px;display:flex;align-items:center;justify-content:center;padding:0;border:none;background:none;border-radius:10px;font-family:var(--f);font-size:14px;font-weight:600;color:var(--ink);cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '.zp-pc-day.today{box-shadow:inset 0 0 0 1.5px var(--ink4)}'
    + '.zp-pc-day.in-range{background:var(--ovl-0_08);border-radius:0}'
    + '.zp-pc-day.sel{background:var(--ink);color:var(--cream);border-radius:10px}'
    + '.zp-pc-day.out{color:var(--ink4);font-weight:500}'
    + '.zp-pc-day.dis,.zp-pc-day[disabled]{color:var(--ink4);opacity:.5;cursor:default}'
    + '.zp-pc-day.wk{border-radius:0}'
    + '.zp-pc-day.wk-first{border-radius:8px 0 0 8px}'
    + '.zp-pc-day.wk-last{border-radius:0 8px 8px 0}'
    + '.zp-pc-day.wk.today{box-shadow:none;text-decoration:underline}'
    + '.zp-pc-day.wk-hov{background:var(--ovl-0_08)}'
    + '.zp-pc-day.sel-wk{background:var(--ink);color:var(--cream);opacity:1}'
    + '.zp-pc-day.sel-wk.out{opacity:.75}'
    + '.zp-pg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:4px}'
    + '.zp-pg-item{padding:14px 4px;border:none;border-radius:12px;background:var(--ovl-0_06);color:var(--ink);font-family:var(--f);font-size:14px;font-weight:600;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '.zp-pg-item.today{box-shadow:inset 0 0 0 1.5px var(--ink4)}'
    + '.zp-pg-item.sel{background:var(--ink);color:var(--cream)}'
    + '.zp-pg-item.dis,.zp-pg-item[disabled]{opacity:.35;cursor:default}'
    + '.zp-pp-info{display:block;width:100%;box-sizing:border-box;text-align:left;padding:10px 12px;border:none;background:none;border-radius:6px;font-family:var(--f);font-size:14px;font-weight:500;color:var(--ink);cursor:pointer}'
    + '.zp-pp-info:hover{background:var(--ovl-0_06)}'
    + '.zp-pp-info.active{color:var(--accent);font-weight:700}'
    + '@media (hover:hover){.zp-pl-item:hover{background:var(--ovl-0_06)}}'
    + '@media (min-width:768px) and (min-height:521px){'
    +   '#zp-ov{touch-action:auto;background:transparent}'
    +   '#zp-sheet{left:0;right:auto;top:0;bottom:auto;margin:0;width:560px;max-width:calc(100vw - 24px);max-height:80vh;border-radius:10px;padding-bottom:0;opacity:0;transform:translateY(-4px);transition:transform .15s ease,opacity .15s ease,visibility 0s linear .15s;box-shadow:0 8px 28px rgba(0,0,0,.3);border:1px solid var(--ink4)}'
    +   '#zp-sheet.open{opacity:1;transform:none;transition:transform .15s ease,opacity .15s ease,visibility 0s}'
    +   '#zp-handle,#zp-head{display:none}'
    +   '#zp-body.zp-pp{display:flex;padding:0;overflow:hidden;flex:0 1 380px;height:380px;max-height:100%}'
    +   '#zp-body.zp-pp .zp-pp-left{flex:0 0 190px;border-right:1px solid var(--ink4);overflow-y:auto;padding:8px 6px 10px;box-sizing:border-box}'
    +   '#zp-body.zp-pp .zp-pp-right{flex:1 1 auto;min-width:0;overflow-y:auto;padding:8px 10px 10px;box-sizing:border-box}'
    +   '#zp-sheet .zp-pp-left .zp-pl-item{font-size:13.5px;padding:9px 10px;border-radius:6px;font-weight:500}'
    +   '#zp-sheet .zp-pp-left .zp-pl-item.active{color:var(--accent);font-weight:700}'
    +   '#zp-sheet .zp-pp-left .zp-pl-item.hov{background:var(--ovl-0_06)}'
    +   '#zp-sheet .zp-pp-left .zp-pl-sum{display:none}'
    +   '#zp-sheet .zp-pp-right .zp-pl-item{font-size:13.5px;padding:9px 10px;border-radius:6px}'
    +   '#zp-sheet .zp-pp-right .zp-pl-item.active{color:var(--accent)}'
    +   '#zp-sheet .zp-pc-day{height:34px;font-size:13px}'
    +   '#zp-sheet .zp-pc-nav{padding:0 0 6px}'
    +   '#zp-sheet .zp-pc-nav button{width:28px;height:28px;background:none;border-radius:6px;font-size:15px}'
    +   '#zp-sheet .zp-pc-nav button:hover{background:var(--ovl-0_06)}'
    +   '#zp-sheet .zp-pc-month{font-size:14px}'
    + '}'
    + '@media (max-height:520px){.zp-pc-day{height:32px;font-size:13px}.zp-pl-item{padding:10px 12px}#zp-title{padding-top:6px;padding-bottom:8px}.zp-pg-item{padding:10px 4px}}';
  document.head.appendChild(st);
})();

// ── isi sheet ──
var _zp = { cfg: null, draft: null, view: 'list', hov: null, calY: 0, calM: 0, bYear: 0, rStart: null, rEnd: null };
function _zpIsPop() { return !!(window.matchMedia && window.matchMedia('(min-width: 768px) and (min-height: 521px)').matches); }
function _zpEl(id) { return document.getElementById(id); }

function _zpLeftActive(k, d) {
  var c = d.mode;
  if (k === 'hari')    return c === 'hari';
  if (k === 'minggu')  return _zpIsWeek(c) && c !== 'minggu-ini';   // Minggu Ini punya item sendiri di daftar
  if (k === 'bulan')   return c === 'bulan' || c === 'bulan-ini' || c === 'bulan-lalu' || c === '3bulan';
  if (k === 'tahun')   return c === 'tahun' || c === 'semua';
  if (k === 'rentang') return c === 'rentang';
  return c === k;
}
function _zpLeftSum(k, d) {
  var c = d.mode;
  if (k === 'hari')    return c === 'hari' ? zpLabel(d) : '';
  if (k === 'minggu')  return (_zpIsWeek(c) && c !== 'minggu-ini') ? zpLabel(d) : '';
  if (k === 'bulan')   return c === '3bulan' ? '3 Bulan Terakhir' : ((c === 'bulan' || c === 'bulan-ini' || c === 'bulan-lalu') ? zpLabel(d) : '');
  if (k === 'tahun')   return c === 'tahun' ? zpLabel(d) : (c === 'semua' ? 'Semua' : '');
  if (k === 'rentang') return c === 'rentang' ? zpLabel(d) : '';
  return '';
}
function _zpListHtml() {
  var d = _zp.draft, html = '';
  ZP_ITEMS.forEach(function(it) {
    var active = _zpLeftActive(it.k, d), right;
    if (it.sub) {
      var sum = active ? _zpLeftSum(it.k, d) : '';
      right = (sum ? '<span class="zp-pl-sum">' + sum + '</span>' : '') + '<i class="ti ti-chevron-right"></i>';
    } else {
      right = active ? '<i class="ti ti-check zp-pl-check"></i>' : '';
    }
    html += (it.sep ? '<div class="zp-pl-sep"></div>' : '')
      + '<button type="button" class="zp-pl-item' + (active ? ' active' : '') + (_zp.hov === it.k ? ' hov' : '') + '" data-zp="' + (it.sub ? 'sub' : 'pick') + '" data-val="' + it.k + '" data-hov="' + it.k + '">'
      + '<span>' + it.l + '</span><span class="zp-pl-right">' + right + '</span></button>';
  });
  return html;
}
function _zpSubPresetHtml(view) {
  var d = _zp.draft, html = '';
  ZP_SUBPRESET.forEach(function(p) {
    if (p.view !== view) return;
    var active = d.mode === p.k;
    var sum = p.k === 'minggu-ini' ? _zpWeekText(0) : (p.k === 'minggu-lalu' ? _zpWeekText(-1) : '');
    html += '<button type="button" class="zp-pl-item' + (active ? ' active' : '') + '" data-zp="pick" data-val="' + p.k + '"><span>' + p.l + '</span>'
      + '<span class="zp-pl-right">' + (sum ? '<span class="zp-pl-sum">' + sum + '</span>' : '') + (active ? '<i class="ti ti-check zp-pl-check"></i>' : '') + '</span></button>';
  });
  return html;
}
function _zpInfoRow(k) {
  var r = zpRange({ mode: k }), on = !!_zp.draft && _zp.draft.mode === k;
  var txt = (r.s === r.e) ? _zpNumDate(zpParse(r.s)) : _zpNumDate(zpParse(r.s)) + ' – ' + _zpNumDate(zpParse(r.e));
  return '<button type="button" class="zp-pp-info' + (on ? ' active' : '') + '" data-zp="pick" data-val="' + k + '">' + txt + '</button>';
}
// Kalender 1 bulan: 'hari' = 1 tanggal (tak boleh setelah hari ini), 'minggu' = ketuk tanggal mana pun → seluruh minggunya (Min–Sab),
// 'rentang' = tanggal awal lalu akhir (boleh tanggal depan).
function _zpCalHtml(view) {
  var now = new Date(), y = _zp.calY, m = _zp.calM;
  if (!y) { y = now.getFullYear(); m = now.getMonth(); _zp.calY = y; _zp.calM = m; }
  var startDow = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
  var todayStr = zpDate(now), isWeek = (view === 'minggu'), isRange = (view === 'rentang'), d = _zp.draft;
  var selHari = (view === 'hari' && d.mode === 'hari') ? d.hari : '';
  var html = '<div class="zp-pc-nav"><span class="zp-pc-navg">'
    + '<button type="button" data-zp="calnav" data-val="-12" aria-label="Tahun sebelumnya"><i class="ti ti-chevrons-left"></i></button>'
    + '<button type="button" data-zp="calnav" data-val="-1" aria-label="Bulan sebelumnya"><i class="ti ti-chevron-left"></i></button></span>'
    + '<div class="zp-pc-month">' + ZP_BLN_L[m] + ' ' + y + '</div>'
    + '<span class="zp-pc-navg">'
    + '<button type="button" data-zp="calnav" data-val="1" aria-label="Bulan berikutnya"><i class="ti ti-chevron-right"></i></button>'
    + '<button type="button" data-zp="calnav" data-val="12" aria-label="Tahun berikutnya"><i class="ti ti-chevrons-right"></i></button></span>'
    + '</div><div class="zp-pc-grid">';
  ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].forEach(function(n) { html += '<div class="zp-pc-dow">' + n + '</div>'; });
  if (isWeek) {
    var baseStart = _zpWeekStart(now, 0), selOff = _zpWeekOff(d.mode), total = Math.ceil((startDow + dim) / 7) * 7;
    for (var i = 0; i < total; i++) {
      var dt = new Date(y, m, 1 - startDow + i), dow = dt.getDay();
      var wsDate = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - dow), ws = zpDate(wsDate);
      var off = Math.round((wsDate.getTime() - baseStart.getTime()) / 86400000 / 7);
      var cls = 'zp-pc-day wk';
      if (dt.getMonth() !== m) cls += ' out';
      if (zpDate(dt) === todayStr) cls += ' today';
      if (off > 0) cls += ' dis';
      if (selOff !== null && off === selOff) cls += ' sel-wk';
      if (dow === 0) cls += ' wk-first';
      if (dow === 6) cls += ' wk-last';
      html += '<button type="button" class="' + cls + '" data-zp="week" data-val="' + ws + '" data-wk="' + ws + '"' + (off > 0 ? ' disabled' : '') + '>' + dt.getDate() + '</button>';
    }
    return html + '</div>';
  }
  var st = _zp.rStart, en = _zp.rEnd;
  for (var b = 0; b < startDow; b++) html += '<div></div>';
  for (var dd = 1; dd <= dim; dd++) {
    var dstr = y + '-' + _zpPad(m + 1) + '-' + _zpPad(dd), c2 = 'zp-pc-day', future = (!isRange && dstr > todayStr);
    if (dstr === todayStr) c2 += ' today';
    if (future) c2 += ' dis';
    if (!isRange) { if (dstr === selHari) c2 += ' sel'; }
    else if ((st && dstr === st) || (en && dstr === en)) c2 += ' sel';
    else if (st && en && dstr > st && dstr < en) c2 += ' in-range';
    html += '<button type="button" class="' + c2 + '" data-zp="day" data-val="' + dstr + '"' + (future ? ' disabled' : '') + '>' + dd + '</button>';
  }
  return html + '</div>';
}
function _zpBulanHtml() {
  var y = _zp.bYear || new Date().getFullYear(), d = _zp.draft, cur = (d.mode === 'bulan') ? d.bulan : '';
  var n = new Date(), thisVal = n.getFullYear() + '-' + _zpPad(n.getMonth() + 1);
  var html = '<div class="zp-pc-nav">'
    + '<button type="button" data-zp="bulannav" data-val="-1" aria-label="Tahun sebelumnya"><i class="ti ti-chevrons-left"></i></button>'
    + '<div class="zp-pc-month">' + y + '</div>'
    + '<button type="button" data-zp="bulannav" data-val="1" aria-label="Tahun berikutnya"><i class="ti ti-chevrons-right"></i></button>'
    + '</div><div class="zp-pg">';
  for (var m = 0; m < 12; m++) {
    var val = y + '-' + _zpPad(m + 1), future = val > thisVal;
    html += '<button type="button" class="zp-pg-item' + (val === cur ? ' sel' : '') + (val === thisVal ? ' today' : '') + (future ? ' dis' : '') + '" data-zp="bulan" data-val="' + val + '"' + (future ? ' disabled' : '') + '>' + ZP_BLN[m] + '</button>';
  }
  return html + '</div>';
}
function _zpTahunHtml() {
  var d = _zp.draft, cur = (d.mode === 'tahun') ? String(parseInt(d.tahun, 10) || '') : '', thisY = new Date().getFullYear(), html = '<div class="zp-pg">';
  for (var y = thisY; y >= 2015; y--) html += '<button type="button" class="zp-pg-item' + (String(y) === cur ? ' sel' : '') + (y === thisY ? ' today' : '') + '" data-zp="tahun" data-val="' + y + '">' + y + '</button>';
  return html + '</div>';
}
// Panel kanan (laptop): tanggal pasti utk preset cepat, atau kalender/grid utk "Per ..."
function _zpRightHtml(k) {
  if (!k) return '';
  if (k === 'hari-ini' || k === 'kemarin' || k === 'minggu-ini' || k === '7hari' || k === '30hari') return _zpInfoRow(k);
  if (k === 'hari')    return _zpCalHtml('hari');
  if (k === 'minggu')  return _zpSubPresetHtml('minggu') + _zpCalHtml('minggu');
  if (k === 'rentang') return _zpCalHtml('rentang');
  if (k === 'bulan')   return _zpSubPresetHtml('bulan') + _zpBulanHtml();
  if (k === 'tahun')   return _zpSubPresetHtml('tahun') + _zpTahunHtml();
  return '';
}
function _zpRenderRight() {
  var r = _zpEl('zp-pp-right');
  if (!r) return;
  r.innerHTML = _zpRightHtml(_zp.hov);
  var items = document.querySelectorAll('#zp-body .zp-pp-left [data-hov]');
  for (var i = 0; i < items.length; i++) items[i].classList.toggle('hov', items[i].getAttribute('data-hov') === _zp.hov);
}
function _zpRefreshView() { if (_zpIsPop()) _zpRenderRight(); else _zpRender(true); }
function _zpRender(keepScroll) {
  var sh = _zpEl('zp-sheet'), body = _zpEl('zp-body'), title = _zpEl('zp-title');
  if (!sh || !body || !_zp.draft) return;
  var st = body.scrollTop, pop = _zpIsPop(), v = _zp.view;
  body.classList.toggle('zp-pp', pop);
  sh.classList.toggle('pop', pop);
  if (pop) {
    sh.classList.remove('sub');
    if (title) title.textContent = ZP_TITLES.list;
    body.innerHTML = '<div class="zp-pp-left">' + _zpListHtml() + '</div><div class="zp-pp-right" id="zp-pp-right">' + _zpRightHtml(_zp.hov) + '</div>';
    body.scrollTop = 0;
    return;
  }
  sh.classList.toggle('sub', v !== 'list');
  if (title) title.textContent = ZP_TITLES[v] || ZP_TITLES.list;
  if (v === 'hari' || v === 'rentang') body.innerHTML = _zpCalHtml(v);
  else if (v === 'minggu') body.innerHTML = _zpSubPresetHtml(v) + _zpCalHtml(v);
  else if (v === 'bulan')  body.innerHTML = _zpSubPresetHtml(v) + _zpBulanHtml();
  else if (v === 'tahun')  body.innerHTML = _zpSubPresetHtml(v) + _zpTahunHtml();
  else                     body.innerHTML = _zpListHtml();
  body.scrollTop = keepScroll ? st : 0;
}

// Siapkan anchor kalender/grid saat item "Per ..." disorot/dibuka
function _zpInitSub(k) {
  var now = new Date(), d = _zp.draft, anchor = now;
  if (!d) return;
  if (k === 'hari') {
    if (d.mode === 'hari' && d.hari) anchor = zpParse(d.hari);
  } else if (k === 'minggu') {
    var off = _zpWeekOff(d.mode);
    if (off !== null) anchor = _zpWeekStart(now, off);
  } else if (k === 'rentang') {
    var has = (d.mode === 'rentang' && d.dari);
    _zp.rStart = has ? d.dari : null;
    _zp.rEnd   = has ? (d.sampai || null) : null;
    if (has) anchor = zpParse(d.dari);
  } else if (k === 'bulan') {
    _zp.bYear = (d.mode === 'bulan' && d.bulan) ? parseInt(d.bulan.split('-')[0], 10) : now.getFullYear();
  }
  _zp.calY = anchor.getFullYear();
  _zp.calM = anchor.getMonth();
}

function _zpPlace(sh, anchor) {
  if (!_zpIsPop()) { sh.style.left = ''; sh.style.top = ''; sh.style.maxHeight = ''; return; }
  var vw = window.innerWidth, vh = window.innerHeight, w = Math.min(560, vw - 24), left, top;
  if (anchor && anchor.getBoundingClientRect) {
    var r = anchor.getBoundingClientRect();
    left = Math.max(12, Math.min(r.left, vw - w - 12));
    top = Math.round(r.bottom + 6);
  } else { left = Math.max(12, Math.round((vw - w) / 2)); top = 90; }
  sh.style.left = left + 'px';
  sh.style.top = top + 'px';
  sh.style.maxHeight = Math.max(260, vh - top - 12) + 'px';
}
function zpClose() {
  var ov = _zpEl('zp-ov'), sh = _zpEl('zp-sheet');
  if (ov) ov.classList.remove('open');
  if (sh) sh.classList.remove('open');
}
function zpOpen(anchor, cfg) {
  _zpEnsure();
  var ov = _zpEl('zp-ov'), sh = _zpEl('zp-sheet');
  _zp.cfg = cfg;
  _zp.draft = _zpCopy(cfg.get());
  _zp.view = 'list';
  _zp.hov = null;   // panel kanan KOSONG sampai kursor diarahkan ke pilihan kiri
  var n = new Date();
  _zp.calY = n.getFullYear(); _zp.calM = n.getMonth(); _zp.bYear = n.getFullYear();
  _zpRender(false);
  sh.style.transition = '';
  sh.style.transform = '';
  _zpPlace(sh, anchor);
  ov.classList.add('open');
  sh.classList.add('open');
}
// Tulis draft ke state pemilik picker lalu beri tahu halaman
function _zpApply() {
  var cfg = _zp.cfg, d = _zp.draft;
  if (!cfg || !d) { zpClose(); return; }
  cfg.set(_zpCopy(d));
  zpClose();
  if (cfg.onApply) cfg.onApply();
}
function _zpOnTap(act, val) {
  var d = _zp.draft;
  if (!d) return;
  if (act === 'pick') { d.mode = val; _zpApply(); return; }
  if (act === 'sub') {
    if (_zpIsPop()) { _zp.hov = val; _zpInitSub(val); _zpRenderRight(); }   // laptop: isi panel kanan
    else { _zpInitSub(val); _zp.view = val; _zpRender(false); }             // HP: sub-halaman
    return;
  }
  if (act === 'calnav') {
    var dt = new Date(_zp.calY, _zp.calM + parseInt(val, 10), 1);
    _zp.calY = dt.getFullYear(); _zp.calM = dt.getMonth();
    _zpRefreshView();
    return;
  }
  if (act === 'bulannav') { _zp.bYear += parseInt(val, 10); _zpRefreshView(); return; }
  if (act === 'week') {
    var off = Math.round((zpParse(val).getTime() - _zpWeekStart(new Date(), 0).getTime()) / 86400000 / 7);
    if (isNaN(off) || off > 0) return;
    d.mode = (off === 0) ? 'minggu-ini' : (off === -1 ? 'minggu-lalu' : 'minggu-w:' + off);
    _zpApply();
    return;
  }
  if (act === 'day') {
    var cv = _zpIsPop() ? _zp.hov : _zp.view;
    if (cv === 'hari') { d.mode = 'hari'; d.hari = val; _zpApply(); return; }
    // rentang: ketuk 1 = awal, ketuk 2 = akhir (lebih awal dari awal → ditukar), ketuk 3 = mulai lagi
    var st = _zp.rStart, en = _zp.rEnd;
    if (!st || (st && en)) { _zp.rStart = val; _zp.rEnd = null; }
    else if (val < st)     { _zp.rEnd = st; _zp.rStart = val; }
    else                   { _zp.rEnd = val; }
    if (_zp.rStart && _zp.rEnd) { d.mode = 'rentang'; d.dari = _zp.rStart; d.sampai = _zp.rEnd; _zpApply(); return; }
    _zpRefreshView();
    return;
  }
  if (act === 'bulan') { d.mode = 'bulan'; d.bulan = val; _zpApply(); return; }
  if (act === 'tahun') { d.mode = 'tahun'; d.tahun = String(val); _zpApply(); return; }
}

// Sheet + overlay dipasang ke <body> (alasan sama dgn picker lain: position:fixed di dalam .content tidak andal)
function _zpEnsure() {
  if (_zpEl('zp-sheet')) return;
  var ov = document.createElement('div');
  ov.id = 'zp-ov';
  ov.addEventListener('click', zpClose);
  var sh = document.createElement('div');
  sh.id = 'zp-sheet';
  sh.setAttribute('role', 'dialog');
  sh.setAttribute('aria-label', 'Pilih periode');
  sh.innerHTML = '<div id="zp-head"><div id="zp-handle"></div>'
    + '<button type="button" id="zp-back" aria-label="Kembali"><i class="ti ti-chevron-left"></i></button>'
    + '<div id="zp-title">Pilih Periode</div>'
    + '<button type="button" id="zp-close" aria-label="Tutup"><i class="ti ti-x"></i></button></div>'
    + '<div id="zp-body"></div>';
  document.body.appendChild(ov);
  document.body.appendChild(sh);
  _zpEl('zp-back').addEventListener('click', function() { _zp.view = 'list'; _zpRender(false); });
  _zpEl('zp-close').addEventListener('click', zpClose);
  sh.addEventListener('click', function(e) {
    var t = e.target.closest ? e.target.closest('[data-zp]') : null;
    if (!t || t.disabled) return;
    _zpOnTap(t.getAttribute('data-zp'), t.getAttribute('data-val'));
  });
  // Laptop: kursor di item panel kiri → panel kanan menyediakan pilihannya; di kalender "Per Minggu" kursor menyorot seluruh minggunya.
  function wkHover(ws) {
    var old = sh.querySelectorAll('.zp-pc-day.wk-hov'), i;
    for (i = 0; i < old.length; i++) old[i].classList.remove('wk-hov');
    if (!ws) return;
    var cells = sh.querySelectorAll('.zp-pc-day[data-wk="' + ws + '"]');
    for (i = 0; i < cells.length; i++) if (!cells[i].disabled) cells[i].classList.add('wk-hov');
  }
  sh.addEventListener('mouseover', function(e) {
    if (!_zpIsPop() || !e.target.closest) return;
    var li = e.target.closest('.zp-pp-left [data-hov]');
    if (li) {
      var k = li.getAttribute('data-hov');
      if (k !== _zp.hov) { _zp.hov = k; _zpInitSub(k); _zpRenderRight(); }
      return;
    }
    var c = e.target.closest('.zp-pc-day[data-wk]');
    wkHover(c ? c.getAttribute('data-wk') : '');
  });
  sh.addEventListener('mouseleave', function() { wkHover(''); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && sh.classList.contains('open')) zpClose(); });
  // Tarik header ke bawah untuk menutup (HP saja; popover laptop tidak digeser)
  var head = _zpEl('zp-head'), y0 = null, dy = 0;
  head.addEventListener('touchstart', function(e) {
    if (e.touches.length !== 1 || _zpIsPop()) return;
    y0 = e.touches[0].clientY; dy = 0;
    sh.style.transition = 'none';
  }, { passive: true });
  head.addEventListener('touchmove', function(e) {
    if (y0 === null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    sh.style.transform = 'translateY(' + dy + 'px)';
  }, { passive: true });
  function dragEnd() {
    if (y0 === null) return;
    var tutup = dy > 80;
    y0 = null; dy = 0;
    sh.style.transition = '';
    sh.style.transform = '';
    if (tutup) zpClose();
  }
  head.addEventListener('touchend', dragEnd, { passive: true });
  head.addEventListener('touchcancel', dragEnd, { passive: true });
}
// Pindah halaman → pastikan sheet tertutup
document.addEventListener('zenot:page', function() { zpClose(); });
