// ─── SHOPEE-DASHBOARD.JS v2 — Analisis Toko Professional ───────────────────
// Rebuilt: 2026-06-08
// Fixes: parser fee (Income Summary row structure), UI full rebuild scale-up focus

(function() {
'use strict';

const PAGE_ID   = 'page-shopee-dashboard';
const LS_PREFIX = 'sdash_';
const LS_ACTIVE = 'sdash_active_toko';

const TOKO_MAP = {
  'zenootsweater': { id:'SHP.ZENOOT', label:'SHP.ZENOOT', color:'#E85630' },
  'elenz':         { id:'SHP.ELENZ',  label:'SHP.ELENZ',  color:'#185FA5' },
  'alley':         { id:'SHP.ALLEY',  label:'SHP.ALLEY',  color:'#1D9E75' },
};

let _activeToko     = localStorage.getItem(LS_ACTIVE) || 'SHP.ZENOOT';
let _activeTab      = 'overview';
let _activeMonthKey = null;
let _importSession  = { income:null, order:null, order_prev:null, produk:null, iklan:null };

// ─── CSS ─────────────────────────────────────────────────────────────────────
const _css = document.createElement('style');
_css.textContent = `
/* ROOT */
.sd2{padding:.5rem 0;font-family:var(--font-sans);color:var(--color-text-primary)}
/* TOPBAR */
.sd2-topbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.sd2-toko-tabs{display:flex;gap:6px;flex-wrap:wrap}
.sd2-toko-btn{padding:5px 14px;border:.5px solid var(--color-border-secondary);border-radius:20px;background:transparent;color:var(--color-text-secondary);cursor:pointer;font-size:12px;font-weight:500;transition:all .15s;display:flex;align-items:center;gap:5px}
.sd2-toko-btn.active{background:var(--tc,#185FA5);color:#fff;border-color:transparent}
.sd2-upload-btn{padding:5px 14px;border:.5px solid var(--color-border-secondary);border-radius:8px;background:transparent;color:var(--color-text-secondary);cursor:pointer;font-size:12px;font-weight:500;display:flex;align-items:center;gap:5px;white-space:nowrap;pointer-events:auto}
.sd2-upload-btn:hover{background:var(--color-background-secondary)}
/* MONTH BAR */
.sd2-monthbar{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.sd2-mchip{padding:3px 12px;border:.5px solid var(--color-border-secondary);border-radius:12px;background:transparent;color:var(--color-text-secondary);cursor:pointer;font-size:11px;transition:all .12s;pointer-events:auto}
.sd2-mchip.active{background:var(--color-text-primary);color:var(--color-background-primary);border-color:transparent}
/* EMPTY */
.sd2-empty{text-align:center;padding:60px 20px}
/* TABS */
.sd2-tabbar{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px;border-bottom:.5px solid var(--color-border-tertiary);padding-bottom:10px}
.sd2-tab{padding:5px 13px;border:.5px solid transparent;border-radius:var(--border-radius-md,8px);background:transparent;color:var(--color-text-secondary);cursor:pointer;font-size:12px;font-weight:500;transition:all .12s;pointer-events:auto}
.sd2-tab.active{background:#185FA5;color:#E6F1FB;border-color:#185FA5}
/* ALERT BANNER */
.sd2-alert{border-radius:8px;padding:.6rem 1rem;margin-bottom:10px;font-size:12px;line-height:1.6;display:flex;gap:8px;align-items:flex-start}
.sd2-alert.danger{background:rgba(216,90,48,.12);border:.5px solid rgba(216,90,48,.3);color:#D85A30}
.sd2-alert.warn{background:rgba(186,117,23,.1);border:.5px solid rgba(186,117,23,.25);color:#BA7517}
.sd2-alert.ok{background:rgba(15,110,86,.1);border:.5px solid rgba(15,110,86,.25);color:#0F6E56}
.sd2-alert.info{background:rgba(24,95,165,.1);border:.5px solid rgba(24,95,165,.25);color:#185FA5}
/* KPI ROW */
.sd2-kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px}
.sd2-kpi{background:var(--color-background-secondary);border-radius:var(--border-radius-md,8px);padding:.7rem .9rem;position:relative;overflow:hidden}
.sd2-kpi::before{content:'';position:absolute;top:0;left:0;width:3px;height:100%;background:var(--kpi-accent,transparent)}
.sd2-kpi .kl{font-size:10px;color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.sd2-kpi .kv{font-size:20px;font-weight:600;line-height:1.1;color:var(--kpi-color,var(--color-text-primary))}
.sd2-kpi .ks{font-size:11px;color:var(--color-text-secondary);margin-top:3px}
.sd2-kpi .kd{font-size:11px;margin-top:3px;font-weight:500}
/* CARDS */
.sd2-card{background:var(--color-background-primary);border:.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg,12px);padding:.9rem 1rem;margin-bottom:10px}
.sd2-card-title{font-size:11px;font-weight:600;color:var(--color-text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.05em}
.sd2-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.sd2-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px}
/* FUNNEL */
.sd2-funnel{display:flex;flex-direction:column;gap:4px;padding:4px 0}
.sd2-frow{display:flex;align-items:center;gap:8px}
.sd2-fl{font-size:11px;color:var(--color-text-secondary);min-width:60px}
.sd2-fg{flex:1;height:20px;background:var(--color-background-secondary);border-radius:4px;overflow:hidden;position:relative}
.sd2-ff{height:20px;border-radius:4px;display:flex;align-items:center;padding:0 6px}
.sd2-ft{font-size:10px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden}
.sd2-fv{font-size:11px;font-weight:600;min-width:40px;text-align:right;color:var(--color-text-primary)}
.sd2-fdrop{font-size:10px;color:var(--color-text-tertiary);min-width:52px;text-align:right}
/* HBAR */
.sd2-hbar{display:flex;align-items:center;gap:6px;margin-bottom:5px}
.sd2-hl{font-size:11px;color:var(--color-text-secondary);min-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd2-hg{flex:1;height:6px;background:var(--color-background-secondary);border-radius:3px;overflow:hidden}
.sd2-hf{height:6px;border-radius:3px}
.sd2-hv{font-size:11px;font-weight:500;min-width:30px;text-align:right;color:var(--color-text-primary)}
/* FEE TABLE */
.sd2-fee{display:flex;justify-content:space-between;padding:5px 0;border-bottom:.5px solid var(--color-border-tertiary);font-size:12px}
.sd2-fee:last-child{border-bottom:none}
.sd2-fee .fk{color:var(--color-text-secondary)}
.sd2-fee .fv{font-weight:500}
.sd2-fee .fv.neg{color:#D85A30}
.sd2-fee .fv.pos{color:#0F6E56}
.sd2-fee .fv.bold{font-weight:700;color:var(--color-text-primary)}
.sd2-fee .fv.muted{color:var(--color-text-tertiary)}
/* TABLE */
.sd2-tbl{width:100%;border-collapse:collapse;font-size:11px}
.sd2-tbl th{color:var(--color-text-tertiary);font-weight:500;text-align:left;padding:4px 6px 6px;border-bottom:.5px solid var(--color-border-tertiary);font-size:10px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.sd2-tbl th.r,.sd2-tbl td.r{text-align:right}
.sd2-tbl td{padding:6px 6px;border-bottom:.5px solid var(--color-border-tertiary);color:var(--color-text-primary);vertical-align:middle}
.sd2-tbl tr:last-child td{border-bottom:none}
.sd2-tbl .tn{max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--color-text-secondary)}
/* BADGES */
.sd2-b{display:inline-block;font-size:10px;padding:2px 7px;border-radius:5px;font-weight:600;white-space:nowrap;line-height:1.4}
.sd2-b.ok{background:rgba(15,110,86,.15);color:#0F6E56}
.sd2-b.warn{background:rgba(186,117,23,.15);color:#BA7517}
.sd2-b.danger{background:rgba(216,90,48,.15);color:#D85A30}
.sd2-b.info{background:rgba(24,95,165,.15);color:#185FA5}
.sd2-b.gray{background:var(--color-background-secondary);color:var(--color-text-secondary)}
.sd2-b.purple{background:rgba(83,74,183,.15);color:#534AB7}
/* PROJ */
.sd2-proj3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}
.sd2-pcard{border-radius:8px;padding:.8rem;text-align:center}
.sd2-pcard.worst{background:rgba(216,90,48,.1);border:.5px solid rgba(216,90,48,.3)}
.sd2-pcard.exp{background:rgba(24,95,165,.12);border:.5px solid rgba(24,95,165,.35)}
.sd2-pcard.best{background:rgba(29,158,117,.1);border:.5px solid rgba(29,158,117,.3)}
.sd2-pcard .pt{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
.sd2-pcard.worst .pt{color:#D85A30}
.sd2-pcard.exp .pt{color:#185FA5}
.sd2-pcard.best .pt{color:#0F6E56}
.sd2-pcard .pv{font-size:20px;font-weight:700;line-height:1;color:var(--color-text-primary)}
.sd2-pcard .ps{font-size:10px;color:var(--color-text-tertiary);margin-top:3px}
/* IKLAN BAR */
.sd2-iday{display:flex;align-items:center;gap:5px;margin-bottom:3px}
.sd2-id{font-size:10px;color:var(--color-text-tertiary);width:36px;text-align:right;flex-shrink:0}
.sd2-ig{flex:1;height:16px;background:var(--color-background-secondary);border-radius:3px;overflow:hidden}
.sd2-if{height:16px;border-radius:3px;background:#534AB7;display:flex;align-items:center;padding:0 5px}
.sd2-it{font-size:9px;color:#fff;white-space:nowrap;overflow:hidden}
.sd2-iv{font-size:10px;font-weight:500;min-width:55px;text-align:right;color:var(--color-text-primary)}
/* OPPORTUNITY CARD */
.sd2-opp{border:.5px solid var(--color-border-tertiary);border-radius:10px;padding:.8rem 1rem;margin-bottom:8px;display:flex;gap:12px;align-items:flex-start}
.sd2-opp-icon{font-size:20px;flex-shrink:0;line-height:1.2}
.sd2-opp-body{}
.sd2-opp-title{font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:3px}
.sd2-opp-desc{font-size:12px;color:var(--color-text-secondary);line-height:1.5}
.sd2-opp-action{font-size:11px;font-weight:600;margin-top:6px;padding:3px 10px;border-radius:6px;display:inline-block}
.sd2-opp-action.do{background:rgba(24,95,165,.15);color:#185FA5}
.sd2-opp-action.fix{background:rgba(216,90,48,.15);color:#D85A30}
.sd2-opp-action.boost{background:rgba(15,110,86,.15);color:#0F6E56}
/* SECTION DIVIDER */
.sd2-divider{font-size:10px;font-weight:700;color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:.1em;margin:16px 0 8px;padding-bottom:4px;border-bottom:.5px solid var(--color-border-tertiary)}
/* UTILS */
.up{color:#0F6E56}.dn{color:#D85A30}.neu{color:var(--color-text-tertiary)}
/* UPLOAD MODAL */
.sd2-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:900;display:flex;align-items:center;justify-content:center;padding:16px}
.sd2-modal{background:var(--color-background-primary);border-radius:var(--border-radius-xl,16px);width:100%;max-width:700px;max-height:90vh;overflow-y:auto}
.sd2-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:.5px solid var(--color-border-tertiary);font-size:14px;font-weight:600}
.sd2-modal-close{background:none;border:none;cursor:pointer;color:var(--color-text-secondary);font-size:18px;padding:4px;pointer-events:auto;position:relative;z-index:1}
.sd2-modal-body{padding:14px 18px}
.sd2-upload-note{font-size:12px;color:var(--color-text-secondary);padding:9px 12px;background:var(--color-background-secondary);border-radius:8px;margin-bottom:12px;line-height:1.6}
.sd2-dz-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.sd2-dz{border:1.5px dashed var(--color-border-secondary);border-radius:10px;padding:12px 10px;text-align:center;transition:all .15s}
.sd2-dz.drag-over{border-color:#185FA5;background:rgba(24,95,165,.06)}
.sd2-dz.done{border-color:#0F6E56;border-style:solid}
.sd2-dz.error{border-color:#D85A30;border-style:solid}
.sd2-dz i{font-size:20px;color:var(--color-text-tertiary);margin-bottom:4px}
.sd2-dz-label{font-size:12px;font-weight:600;color:var(--color-text-primary);margin-bottom:2px}
.sd2-dz-hint{font-size:10px;color:var(--color-text-tertiary);margin-bottom:6px;font-style:italic}
.sd2-dz-status{font-size:11px;color:var(--color-text-secondary);margin-bottom:6px;min-height:14px}
.sd2-dz.done .sd2-dz-status{color:#0F6E56;font-weight:500}
.sd2-dz.error .sd2-dz-status{color:#D85A30}
.sd2-dz-btn{padding:4px 12px;border:.5px solid var(--color-border-secondary);border-radius:6px;background:var(--color-background-secondary);color:var(--color-text-primary);cursor:pointer;font-size:11px;pointer-events:auto;position:relative;z-index:1}
@media(max-width:540px){.sd2-dz-grid,.sd2-g2,.sd2-g3,.sd2-proj3{grid-template-columns:1fr}}
`;
document.head.appendChild(_css);

// ─── INJECT HTML ─────────────────────────────────────────────────────────────
document.getElementById(PAGE_ID).innerHTML = `
<div class="sd2">
  <div class="sd2-topbar">
    <div class="sd2-toko-tabs" id="sd2-toko-tabs">
      ${Object.values(TOKO_MAP).map(t=>`<button class="sd2-toko-btn ${t.id===_activeToko?'active':''}" data-toko="${t.id}" style="--tc:${t.color}" onclick="sd2SwitchToko('${t.id}')"><i class="ti ti-brand-shopee"></i>${t.label}</button>`).join('')}
    </div>
    <button class="sd2-upload-btn" onclick="sd2OpenUpload()"><i class="ti ti-upload"></i>Upload Data</button>
  </div>
  <div class="sd2-monthbar"><span style="font-size:11px;color:var(--color-text-tertiary)">Periode:</span><div id="sd2-month-chips" style="display:flex;gap:6px;flex-wrap:wrap"></div></div>
  <div id="sd2-main">
    <div id="sd2-empty" class="sd2-empty">
      <i class="ti ti-cloud-upload" style="font-size:36px;opacity:.3"></i>
      <div style="margin-top:12px;font-size:14px;color:var(--color-text-secondary)">Belum ada data untuk <b id="sd2-empty-toko">—</b></div>
      <div style="font-size:12px;color:var(--color-text-tertiary);margin-top:6px">Upload 4–5 file export Seller Centre untuk mulai analisis</div>
      <button class="btn btn-primary" style="margin-top:16px" onclick="sd2OpenUpload()"><i class="ti ti-upload"></i>Upload Sekarang</button>
    </div>
    <div id="sd2-dash" style="display:none">
      <div class="sd2-tabbar">
        <button class="sd2-tab active" data-tab="overview" onclick="sd2Tab('overview',this)">📊 Overview</button>
        <button class="sd2-tab" data-tab="keuangan" onclick="sd2Tab('keuangan',this)">💰 Keuangan</button>
        <button class="sd2-tab" data-tab="produk" onclick="sd2Tab('produk',this)">📦 Produk</button>
        <button class="sd2-tab" data-tab="sebaran" onclick="sd2Tab('sebaran',this)">🗺️ Sebaran</button>
        <button class="sd2-tab" data-tab="iklan" onclick="sd2Tab('iklan',this)">📢 Iklan</button>
        <button class="sd2-tab" data-tab="scaleup" onclick="sd2Tab('scaleup',this)">🚀 Scale Up</button>
        <button class="sd2-tab" data-tab="proyeksi" onclick="sd2Tab('proyeksi',this)">📈 Proyeksi</button>
      </div>
      <div id="sd2-content"></div>
    </div>
  </div>

  <!-- UPLOAD MODAL -->
  <div class="sd2-overlay" id="sd2-modal" style="display:none" onclick="if(event.target===this)sd2CloseUpload()">
    <div class="sd2-modal">
      <div class="sd2-modal-head">
        <span><i class="ti ti-upload"></i> Upload Data Shopee</span>
        <button class="sd2-modal-close" onclick="sd2CloseUpload()"><i class="ti ti-x"></i></button>
      </div>
      <div class="sd2-modal-body">
        <div class="sd2-upload-note">Upload file export dari <b>Seller Centre → Laporan</b>. Sistem auto-detect toko & periode dari isi file. File opsional boleh dilewati.</div>
        <div class="sd2-dz-grid">
          ${[
            {id:'income',label:'Income / Dana Dilepas',hint:'Income_sudah_dilepas_*.xlsx',icon:'ti-file-spreadsheet',ext:'.xlsx'},
            {id:'order',label:'Order Completed',hint:'Order_completed_*.xlsx',icon:'ti-file-spreadsheet',ext:'.xlsx'},
            {id:'produk',label:'Performa Produk (SKU Detail)',hint:'parentskudetail_*.xlsx',icon:'ti-file-spreadsheet',ext:'.xlsx'},
            {id:'iklan',label:'Adwords / Tagihan Iklan',hint:'*_adwords_bill_*.csv',icon:'ti-file-invoice',ext:'.csv'},
            {id:'order_prev',label:'Order Bulan Sebelumnya',hint:'Order_completed_bulan_lalu.xlsx',icon:'ti-history',ext:'.xlsx'},
          ].map(f=>`
          <div class="sd2-dz" id="dz2-${f.id}" ondragover="sd2DragOver(event,'${f.id}')" ondragleave="sd2DragLeave(event,'${f.id}')" ondrop="sd2Drop(event,'${f.id}')">
            <i class="ti ${f.icon}"></i>
            <div class="sd2-dz-label">${f.label}</div>
            <div class="sd2-dz-hint">${f.hint}</div>
            <div class="sd2-dz-status" id="dzs2-${f.id}">Belum diupload</div>
            <input type="file" accept="${f.ext}" onchange="sd2FileInput(event,'${f.id}')" style="display:none" id="fi2-${f.id}">
            <button class="sd2-dz-btn" onclick="document.getElementById('fi2-${f.id}').click()">Pilih File</button>
          </div>`).join('')}
        </div>
        <div id="sd2-err" style="display:none;padding:10px 12px;background:rgba(216,90,48,.1);border-radius:8px;font-size:12px;color:#D85A30;margin-bottom:10px"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn" onclick="sd2CloseUpload()">Tutup</button>
          <button class="btn btn-primary" id="sd2-save-btn" onclick="sd2SaveImport()" disabled><i class="ti ti-device-floppy"></i> Simpan Data</button>
        </div>
      </div>
    </div>
  </div>
</div>
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fRp(v, dec) {
  if (v===undefined||v===null||isNaN(v)) return '—';
  const a = Math.abs(v);
  let s;
  if      (a>=1000000000) s=(v/1000000000).toFixed(dec??2)+' M';
  else if (a>=1000000)    s=(v/1000000).toFixed(dec??2)+' jt';
  else if (a>=1000)       s=(v/1000).toFixed(dec??0)+' rb';
  else                    s=Math.round(v).toString();
  return 'Rp '+s;
}
function fPct(v){ return (v!==undefined&&!isNaN(v)) ? parseFloat(v).toFixed(1)+'%' : '—'; }
function fN(v)  { return isNaN(v)||v===undefined ? '—' : Number(v).toLocaleString('id-ID'); }
function diffRp(cur,prv){
  if(!prv||prv===0)return '';
  const d=cur-prv, p=((d/Math.abs(prv))*100).toFixed(1);
  return d>=0?`<span class="up">↑${fRp(Math.abs(d))} (+${p}%)</span>`:`<span class="dn">↓${fRp(Math.abs(d))} (${p}%)</span>`;
}
function diffN(cur,prv,u=''){
  if(!prv)return '';
  const d=cur-prv, p=((d/Math.abs(prv))*100).toFixed(1);
  return d>=0?`<span class="up">↑${d}${u} (+${p}%)</span>`:`<span class="dn">↓${Math.abs(d)}${u} (${p}%)</span>`;
}
function hbar(label,v,max,color,unit=''){
  const pct=max>0?Math.min((v/max)*100,100):0;
  return `<div class="sd2-hbar"><div class="sd2-hl">${label}</div><div class="sd2-hg"><div class="sd2-hf" style="width:${pct.toFixed(1)}%;background:${color}"></div></div><div class="sd2-hv">${unit?v+unit:v}</div></div>`;
}
function hbarList(arr,color,useVal=false){
  if(!arr||!arr.length) return '<div style="color:var(--color-text-tertiary);font-size:12px;padding:8px 0">—</div>';
  const max=arr[0].v;
  return arr.map(({n,v})=>hbar(n,v,max,color,useVal?'':'')).join('');
}
function monthLabel(yyyymm){
  const y=yyyymm.slice(0,4), m=parseInt(yyyymm.slice(4,6))-1;
  return ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'][m]+' '+y;
}
function getAllMonths(tokoId){
  const months=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith(LS_PREFIX+tokoId+'_')) months.push(k.replace(LS_PREFIX+tokoId+'_',''));
  }
  return months.sort().reverse();
}
function getData(tokoId,monthKey){
  const raw=localStorage.getItem(LS_PREFIX+tokoId+'_'+monthKey);
  return raw?JSON.parse(raw):null;
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
window.sd2SwitchToko=function(id){
  _activeToko=id; localStorage.setItem(LS_ACTIVE,id);
  document.querySelectorAll('.sd2-toko-btn').forEach(b=>b.classList.toggle('active',b.dataset.toko===id));
  renderMonthBar();
};
window.sd2Tab=function(tab,btn){
  _activeTab=tab;
  document.querySelectorAll('.sd2-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  renderContent();
};
window.sd2SelectMonth=function(m){
  _activeMonthKey=m;
  document.querySelectorAll('.sd2-mchip').forEach(b=>b.classList.toggle('active',b.dataset.m===m));
  renderContent();
};

function renderMonthBar(){
  const months=getAllMonths(_activeToko);
  const chips=document.getElementById('sd2-month-chips');
  const empty=document.getElementById('sd2-empty');
  const dash=document.getElementById('sd2-dash');
  const et=document.getElementById('sd2-empty-toko');
  if(et) et.textContent=_activeToko;
  if(!months.length){empty.style.display='block';dash.style.display='none';chips.innerHTML='';return;}
  empty.style.display='none'; dash.style.display='block';
  if(!_activeMonthKey||!months.includes(_activeMonthKey)) _activeMonthKey=months[0];
  chips.innerHTML=months.map(m=>`<button class="sd2-mchip ${m===_activeMonthKey?'active':''}" data-m="${m}" onclick="sd2SelectMonth('${m}')">${monthLabel(m)}</button>`).join('');
  renderContent();
}

function renderContent(){
  document.querySelectorAll('.sd2-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===_activeTab));
  const el=document.getElementById('sd2-content');
  const data=getData(_activeToko,_activeMonthKey);
  const months=getAllMonths(_activeToko);
  const prevMonth=months.indexOf(_activeMonthKey)<months.length-1?months[months.indexOf(_activeMonthKey)+1]:null;
  const prev=prevMonth?getData(_activeToko,prevMonth):null;
  if(!data){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--color-text-tertiary)">Data tidak ditemukan</div>';return;}
  const fn={'overview':tabOverview,'keuangan':tabKeuangan,'produk':tabProduk,'sebaran':tabSebaran,'iklan':tabIklan,'scaleup':tabScaleUp,'proyeksi':tabProyeksi};
  if(fn[_activeTab]) el.innerHTML=fn[_activeTab](data,prev);
}

// ─── TAB: OVERVIEW ───────────────────────────────────────────────────────────
function tabOverview(d,prev){
  const totalFeeAbs=Math.abs((d.fee_layanan||0)+(d.fee_admin||0)+(d.fee_proses||0)+(d.fee_saldo_otomatis||0)+(d.fee_komisi_ams||0)+(d.fee_ongkir_net||0)+(d.fee_premi||0)+(d.fee_kampanye||0));
  const feeRate=d.omset>0?(totalFeeAbs/d.omset*100):0;
  const marginRate=d.omset>0?((d.total_dilepas||0)/d.omset*100):0;
  const avgOrder=d.total_pesanan>0?d.omset/d.total_pesanan:0;
  const roas=d.iklan_spend>0?(d.omset/d.iklan_spend):0;
  const prev_avg=prev&&prev.total_pesanan>0?prev.omset/prev.total_pesanan:0;

  // Funnel data
  const totalViews=(d.produk_performa||[]).reduce((a,p)=>a+(p.views||0),0);
  const totalKlik=(d.produk_performa||[]).reduce((a,p)=>a+(p.klik||0),0);
  const totalKeranjang=(d.produk_performa||[]).reduce((a,p)=>a+(p.keranjang||0),0);
  const funnelCTR=totalViews>0?(totalKlik/totalViews*100):0;
  const funnelCart=totalKlik>0?(totalKeranjang/totalKlik*100):0;
  const funnelClose=totalKeranjang>0?(d.total_pesanan/totalKeranjang*100):0;

  // Health score
  const scores=[];
  scores.push(marginRate>=60?100:marginRate>=40?60:20);
  scores.push(funnelCTR>=3?100:funnelCTR>=1.5?60:20);
  scores.push(roas>=5?100:roas>=3?60:20);
  scores.push(prev?(d.total_pesanan>=prev.total_pesanan?100:60):70);
  const health=Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
  const healthColor=health>=80?'#0F6E56':health>=55?'#BA7517':'#D85A30';

  return `
  <!-- ALERTS -->
  ${buildAlerts(d,prev,totalViews,totalKlik,funnelCTR,marginRate,roas)}

  <!-- KPI UTAMA -->
  <div class="sd2-kpi-row">
    <div class="sd2-kpi" style="--kpi-accent:#E85630"><div class="kl">Omset Bulan Ini</div><div class="kv">${fRp(d.omset)}</div><div class="ks">${d.total_pesanan} pesanan · ${d.hari_aktif} hari aktif</div><div class="kd">${prev?diffRp(d.omset,prev.omset):''}</div></div>
    <div class="sd2-kpi" style="--kpi-accent:#0F6E56"><div class="kl">Escrow Diterima</div><div class="kv ${marginRate>=60?'up':marginRate>=40?'':' dn'}">${fRp(d.total_dilepas)}</div><div class="ks">Margin bersih platform ${fPct(marginRate)}</div><div class="kd">${prev?diffRp(d.total_dilepas,prev.total_dilepas):''}</div></div>
    <div class="sd2-kpi" style="--kpi-accent:#D85A30"><div class="kl">Total Biaya Platform</div><div class="kv dn">${fRp(totalFeeAbs)}</div><div class="ks">${fPct(feeRate)} dari omset tergerus fee</div><div class="kd" style="color:${feeRate>35?'#D85A30':feeRate>25?'#BA7517':'#0F6E56'}">${feeRate>35?'⚠️ Fee tinggi':feeRate>25?'Normal':'✓ Efisien'}</div></div>
    <div class="sd2-kpi" style="--kpi-accent:#534AB7"><div class="kl">Biaya Iklan (ROAS)</div><div class="kv">${fRp(d.iklan_spend)}</div><div class="ks">ROAS ${d.iklan_spend>0?roas.toFixed(1)+'×':'—'}</div><div class="kd ${roas>=5?'up':roas>=3?'':' dn'}">${d.iklan_spend>0?(roas>=5?'✓ ROAS bagus':roas>=3?'Normal':'⚠️ ROAS rendah'):'—'}</div></div>
    <div class="sd2-kpi" style="--kpi-accent:#185FA5"><div class="kl">Avg Nilai / Pesanan</div><div class="kv">${fRp(avgOrder,0)}</div><div class="ks">Subtotal ÷ ${d.total_pesanan} pesanan</div><div class="kd">${prev?diffRp(avgOrder,prev_avg):''}</div></div>
    <div class="sd2-kpi" style="--kpi-accent:${healthColor}"><div class="kl">Skor Kesehatan Toko</div><div class="kv" style="color:${healthColor}">${health}/100</div><div class="ks">Margin · CTR · ROAS · Tren</div><div class="kd" style="color:${healthColor}">${health>=80?'🟢 Sehat':health>=55?'🟡 Perlu perhatian':'🔴 Butuh perbaikan'}</div></div>
  </div>

  <!-- FUNNEL + KOMPARASI -->
  <div class="sd2-g2">
    <div class="sd2-card">
      <div class="sd2-card-title"><i class="ti ti-filter"></i>Funnel Konversi</div>
      ${buildFunnel(totalViews,totalKlik,totalKeranjang,d.total_pesanan)}
      <div style="margin-top:10px;font-size:11px;color:var(--color-text-secondary);line-height:1.7">
        CTR <b>${fPct(funnelCTR)}</b> · Keranjang/Klik <b>${fPct(funnelCart)}</b> · Close/Keranjang <b>${fPct(funnelClose)}</b>
      </div>
    </div>
    ${prev?`
    <div class="sd2-card">
      <div class="sd2-card-title"><i class="ti ti-arrows-diff"></i>vs ${monthLabel(getAllMonths(_activeToko)[getAllMonths(_activeToko).indexOf(_activeMonthKey)+1]||'')}</div>
      <table class="sd2-tbl">
        <tr><th>Metrik</th><th class="r">${monthLabel(_activeMonthKey)}</th><th class="r">Sebelumnya</th><th class="r">Δ</th></tr>
        <tr><td>Pesanan</td><td class="r">${d.total_pesanan}</td><td class="r">${prev.total_pesanan}</td><td class="r">${diffN(d.total_pesanan,prev.total_pesanan)}</td></tr>
        <tr><td>Omset</td><td class="r">${fRp(d.omset)}</td><td class="r">${fRp(prev.omset)}</td><td class="r">${diffRp(d.omset,prev.omset)}</td></tr>
        <tr><td>Escrow</td><td class="r">${fRp(d.total_dilepas)}</td><td class="r">${fRp(prev.total_dilepas)}</td><td class="r">${diffRp(d.total_dilepas,prev.total_dilepas)}</td></tr>
        <tr><td>Margin %</td><td class="r">${fPct(marginRate)}</td><td class="r">${fPct(prev.omset>0?prev.total_dilepas/prev.omset*100:0)}</td><td class="r">—</td></tr>
        <tr><td>Avg/Order</td><td class="r">${fRp(avgOrder,0)}</td><td class="r">${fRp(prev_avg,0)}</td><td class="r">${diffRp(avgOrder,prev_avg)}</td></tr>
        <tr><td>Iklan</td><td class="r">${fRp(d.iklan_spend)}</td><td class="r">${fRp(prev.iklan_spend)}</td><td class="r">${diffRp(d.iklan_spend,prev.iklan_spend)}</td></tr>
        <tr><td>Hari Aktif</td><td class="r">${d.hari_aktif}</td><td class="r">${prev.hari_aktif}</td><td class="r">${diffN(d.hari_aktif,prev.hari_aktif,' hr')}</td></tr>
      </table>
    </div>`:`
    <div class="sd2-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:200px">
      <i class="ti ti-calendar-plus" style="font-size:28px;opacity:.3"></i>
      <div style="font-size:12px;color:var(--color-text-tertiary);margin-top:8px">Upload data bulan sebelumnya untuk melihat perbandingan</div>
    </div>`}
  </div>

  <!-- PEMBAYARAN RISK -->
  <div class="sd2-card">
    <div class="sd2-card-title"><i class="ti ti-credit-card"></i>Metode Pembayaran — Analisis Risiko</div>
    <div class="sd2-g3">
      <div>
        ${(d.metode_bayar||[]).slice(0,6).map(({n,v})=>hbar(n,v,(d.metode_bayar||[])[0]?.v||1,'#534AB7')).join('')}
      </div>
      <div>
        ${buildPaymentRisk(d.metode_bayar||[],d.total_pesanan)}
      </div>
      <div>
        <div style="font-size:11px;color:var(--color-text-secondary);line-height:1.8">
          ${buildCODNote(d.metode_bayar||[],d.total_pesanan)}
        </div>
      </div>
    </div>
  </div>
  `;
}

function buildAlerts(d,prev,totalViews,totalKlik,funnelCTR,marginRate,roas){
  const alerts=[];
  if((d.harga_tidak_kompetitif||[]).length>0) alerts.push({type:'danger',icon:'⚠️',msg:`<b>${d.harga_tidak_kompetitif.length} produk harga tidak kompetitif</b> — ada ${d.harga_tidak_kompetitif.reduce((a,p)=>a+(p.views||0),0).toLocaleString('id-ID')} views tapi 0 order. Turunkan harga atau perbaiki listing.`});
  if(marginRate<40&&d.omset>0) alerts.push({type:'danger',icon:'💸',msg:`<b>Margin platform hanya ${marginRate.toFixed(1)}%</b> — dari omset ${fRp(d.omset)} hanya ${fRp(d.total_dilepas)} yang diterima. Fee terlalu tinggi relatif ke harga jual.`});
  if(funnelCTR<1.5&&totalViews>5000) alerts.push({type:'warn',icon:'👁️',msg:`<b>CTR rendah ${fPct(funnelCTR)}</b> — ada ${totalViews.toLocaleString('id-ID')} views tapi cuma ${totalKlik.toLocaleString('id-ID')} klik. Foto cover & judul produk perlu diperbaiki.`});
  if(roas>0&&roas<3) alerts.push({type:'warn',icon:'📢',msg:`<b>ROAS iklan ${roas.toFixed(1)}× — rendah</b>. Setiap Rp 1 iklan hanya menghasilkan Rp ${roas.toFixed(1)} omset. Evaluasi targeting atau kurangi budget iklan.`});
  const codPct=calcCODPct(d.metode_bayar||[],d.total_pesanan);
  if(codPct>40) alerts.push({type:'warn',icon:'🚚',msg:`<b>COD ${codPct.toFixed(0)}% dari total pesanan</b>. Risiko retur tinggi — pertimbangkan minimum order atau seleksi pembeli COD.`});
  if(prev&&d.total_pesanan<prev.total_pesanan) alerts.push({type:'info',icon:'📉',msg:`<b>Pesanan turun ${prev.total_pesanan-d.total_pesanan} dari bulan lalu</b> (${prev.total_pesanan}→${d.total_pesanan}). Lihat tab Scale Up untuk strategi recovery.`});
  if(!alerts.length) return `<div class="sd2-alert ok"><span>✅</span><span>Tidak ada masalah kritis ditemukan bulan ini. Fokus ke Scale Up untuk pertumbuhan.</span></div>`;
  return alerts.map(a=>`<div class="sd2-alert ${a.type}"><span>${a.icon}</span><div>${a.msg}</div></div>`).join('');
}

function buildFunnel(views,klik,keranjang,orders){
  const steps=[{l:'Views',v:views,c:'#534AB7'},{l:'Klik',v:klik,c:'#185FA5'},{l:'Keranjang',v:keranjang,c:'#BA7517'},{l:'Order',v:orders,c:'#0F6E56'}];
  const max=views||1;
  return steps.map((s,i)=>{
    const prev=i>0?steps[i-1].v:null;
    const drop=prev&&prev>0?((1-s.v/prev)*100).toFixed(0):null;
    return `<div class="sd2-frow">
      <div class="sd2-fl">${s.l}</div>
      <div class="sd2-fg"><div class="sd2-ff" style="width:${Math.max((s.v/max)*100,0.5).toFixed(1)}%;background:${s.c}"><div class="sd2-ft">${s.v.toLocaleString('id-ID')}</div></div></div>
      <div class="sd2-fv">${s.v.toLocaleString('id-ID')}</div>
      <div class="sd2-fdrop">${drop?`<span class="dn">▼${drop}%</span>`:''}</div>
    </div>`;
  }).join('');
}

function calcCODPct(arr,total){
  if(!arr.length||!total)return 0;
  const cod=arr.find(m=>m.n.toLowerCase().includes('cod'));
  return cod?(cod.v/total*100):0;
}
function buildPaymentRisk(arr,total){
  const nonInst=arr.filter(m=>m.n.includes('COD')||m.n.includes('SPayLater')||m.n.includes('SeaBank'));
  const nonInstQty=nonInst.reduce((a,m)=>a+m.v,0);
  const pct=total>0?(nonInstQty/total*100):0;
  return `<div style="font-size:28px;font-weight:700;color:${pct>70?'#D85A30':pct>50?'#BA7517':'#0F6E56'};margin-bottom:4px">${pct.toFixed(0)}%</div>
    <div style="font-size:11px;color:var(--color-text-secondary);line-height:1.6">pembayaran non-instan<br>(COD + SPayLater + SeaBank)<br>${nonInstQty} dari ${total} pesanan</div>
    <div style="margin-top:8px" class="sd2-b ${pct>70?'danger':pct>50?'warn':'ok'}">${pct>70?'Risiko tinggi':pct>50?'Perlu monitoring':'Aman'}</div>`;
}
function buildCODNote(arr,total){
  const cod=arr.find(m=>m.n.toLowerCase().includes('cod'));
  const spaylater=arr.find(m=>m.n.includes('SPayLater'));
  const codPct=total>0&&cod?(cod.v/total*100):0;
  const spPct=total>0&&spaylater?(spaylater.v/total*100):0;
  return `<b>COD ${codPct.toFixed(0)}%</b> — risiko retur & cancel sebelum diterima.<br><b>SPayLater ${spPct.toFixed(0)}%</b> — escrow lebih lambat cair.<br><br>Tip: Aktifkan syarat minimal review/transaksi untuk buyer COD.`;
}

// ─── TAB: KEUANGAN ───────────────────────────────────────────────────────────
function tabKeuangan(d,prev){
  const totalFeeAbs=Math.abs((d.fee_layanan||0)+(d.fee_admin||0)+(d.fee_proses||0)+(d.fee_saldo_otomatis||0)+(d.fee_komisi_ams||0)+(d.fee_ongkir_net||0)+(d.fee_premi||0)+(d.fee_kampanye||0));
  const marginRate=d.omset>0?((d.total_dilepas||0)/d.omset*100):0;
  const entries=[
    ['Harga Asli Produk',d.harga_asli,'pos'],
    ['Pengembalian Dana ke Pembeli',d.total_refund,'neg'],
    ['Voucher Penjual',d.total_voucher,'neg'],
    ['─ Subtotal Pesanan',d.omset,'bold','━'],
    null,
    ['Biaya Layanan Shopee',d.fee_layanan,'neg'],
    ['Biaya Administrasi',d.fee_admin,'neg'],
    ['Biaya Komisi AMS',d.fee_komisi_ams,'neg'],
    ['Biaya Proses Pesanan',d.fee_proses,'neg'],
    ['Biaya Isi Saldo Otomatis',d.fee_saldo_otomatis,'neg'],
    ['Biaya Ongkir (neto)',d.fee_ongkir_net,'neg'],
    ['Premi',d.fee_premi,'neg'],
    ['Biaya Kampanye',d.fee_kampanye,'neg'],
    null,
    ['Total Biaya Platform',d.omset&&d.total_dilepas?-(d.omset-d.total_dilepas-(d.total_refund||0)-(d.total_voucher||0)):(-totalFeeAbs),'neg bold','━'],
    ['✅ Total Escrow Dilepas',d.total_dilepas,'bold pos','━'],
    ['Biaya Iklan (Adwords)',-(d.iklan_spend||0),'neg'],
    ['─ Net Setelah Iklan',d.total_dilepas-(d.iklan_spend||0),'bold','━'],
  ];
  return `
  <div class="sd2-g2">
    <div class="sd2-card">
      <div class="sd2-card-title"><i class="ti ti-receipt-2"></i>Rincian Lengkap P&L Platform</div>
      ${entries.map(e=>{
        if(!e) return '<div style="height:5px"></div>';
        const [k,v,cls]=e;
        if(v===null||v===undefined||v===0) return '';
        const sign=v<0?'−':'';
        return `<div class="sd2-fee"><span class="fk">${k}</span><span class="fv ${cls||''}">${sign}${fRp(Math.abs(v))}</span></div>`;
      }).join('')}
    </div>
    <div>
      <div class="sd2-card">
        <div class="sd2-card-title"><i class="ti ti-chart-pie"></i>Proporsi Biaya dari Omset</div>
        ${[['Layanan',d.fee_layanan,'#D85A30'],['Administrasi',d.fee_admin,'#BA7517'],['Saldo Otomatis',d.fee_saldo_otomatis,'#A32D2D'],['Komisi AMS',d.fee_komisi_ams,'#534AB7'],['Proses',d.fee_proses,'#1D9E75'],['Ongkir neto',d.fee_ongkir_net,'#185FA5'],['Voucher',d.total_voucher,'#993C1D'],['Iklan',d.iklan_spend,'#7F77DD']].filter(([,v])=>v&&v!==0).map(([l,v,c])=>hbar(l,Math.abs(v),d.omset||1,c,'')).join('')}
        <div style="margin-top:8px;font-size:11px;border-top:.5px solid var(--color-border-tertiary);padding-top:8px">
          Total fee + iklan: <b>${fPct((totalFeeAbs+(d.iklan_spend||0))/d.omset*100)}</b> dari omset<br>
          Margin bersih platform: <b class="${marginRate>=60?'up':marginRate>=40?'':' dn'}">${fPct(marginRate)}</b>
        </div>
      </div>
      ${prev?`<div class="sd2-card">
        <div class="sd2-card-title"><i class="ti ti-trending-up"></i>Tren Fee</div>
        <table class="sd2-tbl">
          <tr><th>Item</th><th class="r">${monthLabel(_activeMonthKey)}</th><th class="r">Sebelumnya</th></tr>
          ${[['Layanan','fee_layanan'],['Administrasi','fee_admin'],['Saldo Otomatis','fee_saldo_otomatis'],['Komisi AMS','fee_komisi_ams']].map(([l,k])=>`<tr><td>${l}</td><td class="r dn">${fRp(Math.abs(d[k]||0))}</td><td class="r neu">${fRp(Math.abs(prev[k]||0))}</td></tr>`).join('')}
        </table>
      </div>`:''}
    </div>
  </div>`;
}

// ─── TAB: PRODUK ─────────────────────────────────────────────────────────────
function tabProduk(d){
  const all=d.produk_performa||[];
  const notCompetitive=d.harga_tidak_kompetitif||[];
  const competitive=d.harga_kompetitif||[];
  const newProd=d.produk_baru||[];
  const withTrafficNoOrder=all.filter(p=>(p.views||0)>=500&&(p.orders||0)===0&&!notCompetitive.find(x=>x.kode===p.kode));
  const topRevenue=all.filter(p=>(p.orders||0)>0).sort((a,b)=>(b.revenue||0)-(a.revenue||0)).slice(0,8);

  return `
  ${notCompetitive.length?`
  <div class="sd2-alert danger"><span>⚠️</span><div><b>${notCompetitive.length} produk harga tidak kompetitif</b> — Shopee memvalidasi harga lebih tinggi dari kompetitor. Total views bulan ini: ${notCompetitive.reduce((a,p)=>a+(p.views||0),0).toLocaleString('id-ID')}. Tidak satu pun terjual.</div></div>
  <div class="sd2-card">
    <div class="sd2-card-title"><i class="ti ti-alert-triangle"></i>⚠️ Harga Tidak Kompetitif — Tindakan Diperlukan</div>
    <div style="overflow-x:auto"><table class="sd2-tbl" style="min-width:500px">
      <tr><th>Produk</th><th class="r">Harga</th><th class="r">Views</th><th class="r">Klik</th><th class="r">CTR</th><th class="r">Keranjang</th><th class="r">Orders</th><th>Rekomendasi</th></tr>
      ${notCompetitive.map(p=>`<tr>
        <td class="tn" title="${p.nama}">${shortName(p.nama)}</td>
        <td class="r">${p.harga?fRp(parseFloat(String(p.harga).replace(/[^\d]/g,''))):' —'}</td>
        <td class="r">${fN(p.views)}</td><td class="r">${fN(p.klik)}</td>
        <td class="r">${p.ctr||'—'}</td><td class="r">${p.keranjang||0}</td>
        <td class="r"><b class="dn">0</b></td>
        <td><span class="sd2-b danger">Turunkan harga</span></td>
      </tr>`).join('')}
    </table></div>
  </div>`:''}

  ${withTrafficNoOrder.length?`
  <div class="sd2-card">
    <div class="sd2-card-title"><i class="ti ti-eye"></i>Traffic Tapi 0 Order — Ada yang Salah</div>
    <div style="overflow-x:auto"><table class="sd2-tbl" style="min-width:500px">
      <tr><th>Produk</th><th class="r">Views</th><th class="r">Klik</th><th class="r">CTR</th><th class="r">Keranjang</th><th class="r">CVR</th><th>Kemungkinan masalah</th></tr>
      ${withTrafficNoOrder.slice(0,6).map(p=>`<tr>
        <td class="tn" title="${p.nama}">${shortName(p.nama)}</td>
        <td class="r">${fN(p.views)}</td><td class="r">${fN(p.klik)}</td>
        <td class="r">${p.ctr||'—'}</td><td class="r">${p.keranjang||0}</td>
        <td class="r">${p.cvr||'—'}</td>
        <td>${diagnoseProduk(p)}</td>
      </tr>`).join('')}
    </table></div>
  </div>`:''}

  <div class="sd2-card">
    <div class="sd2-card-title"><i class="ti ti-trophy"></i>Top Produk by Revenue</div>
    <div style="overflow-x:auto"><table class="sd2-tbl" style="min-width:600px">
      <tr><th>Produk</th><th class="r">Orders</th><th class="r">Revenue</th><th class="r">Avg/Order</th><th class="r">Views</th><th class="r">CTR</th><th class="r">CVR</th><th>Status</th></tr>
      ${topRevenue.map(p=>`<tr>
        <td class="tn" title="${p.nama}">${shortName(p.nama)}</td>
        <td class="r"><b>${p.orders||0}</b></td>
        <td class="r">${fRp(p.revenue||0)}</td>
        <td class="r">${p.orders>0?fRp((p.revenue||0)/p.orders,0):'—'}</td>
        <td class="r">${fN(p.views)}</td><td class="r">${p.ctr||'—'}</td><td class="r">${p.cvr||'—'}</td>
        <td>${produkBadge(p,competitive)}</td>
      </tr>`).join('')}
    </table></div>
  </div>

  ${newProd.length?`
  <div class="sd2-card">
    <div class="sd2-card-title"><i class="ti ti-clock"></i>Produk Baru (≤90 hari) — Masih Warm-up</div>
    <div style="overflow-x:auto"><table class="sd2-tbl" style="min-width:500px">
      <tr><th>Produk</th><th class="r">Usia</th><th class="r">Views</th><th class="r">Klik</th><th class="r">Orders</th><th class="r">Revenue</th><th>Status</th></tr>
      ${newProd.slice(0,8).map(p=>`<tr>
        <td class="tn" title="${p.nama}">${shortName(p.nama)}</td>
        <td class="r">${p.usia_hari} hr</td>
        <td class="r">${fN(p.views)}</td><td class="r">${fN(p.klik)}</td>
        <td class="r"><b ${!p.orders?'class="dn"':''}>${p.orders||0}</b></td>
        <td class="r">${p.revenue?fRp(p.revenue):'—'}</td>
        <td>${p.views>1000&&!p.orders?'<span class="sd2-b warn">Perlu boost iklan</span>':p.orders>0?'<span class="sd2-b ok">Ada traction</span>':'<span class="sd2-b gray">Terlalu dini</span>'}</td>
      </tr>`).join('')}
    </table></div>
  </div>`:''}
  `;
}
function shortName(n){if(!n)return '—';return n.length<=32?n:n.slice(0,30)+'…';}
function diagnoseProduk(p){
  if((p.klik||0)===0) return '<span class="sd2-b danger">Foto/judul buruk</span>';
  if((p.keranjang||0)>0) return '<span class="sd2-b warn">Harga atau review</span>';
  if((p.ctr||'0')&&parseFloat(p.ctr)<1.5) return '<span class="sd2-b warn">CTR rendah</span>';
  return '<span class="sd2-b gray">Perlu analisis</span>';
}
function produkBadge(p,competitive){
  if(p.flag_harga_tidak_kompetitif) return '<span class="sd2-b danger">Harga ⚠️</span>';
  if(p.flag_harga_kompetitif||competitive.find(x=>x.kode===p.kode)) return '<span class="sd2-b ok">Kompetitif ✓</span>';
  if(p.orders>=5) return '<span class="sd2-b ok">Best Seller</span>';
  if(p.orders>0) return '<span class="sd2-b info">Terjual</span>';
  return '<span class="sd2-b gray">Organik</span>';
}

// ─── TAB: SEBARAN ─────────────────────────────────────────────────────────────
function tabSebaran(d){
  return `
  <div class="sd2-g3">
    <div class="sd2-card"><div class="sd2-card-title"><i class="ti ti-map-pin"></i>Sebaran Provinsi</div>${hbarList(d.provinsi||[],'#185FA5')}</div>
    <div class="sd2-card"><div class="sd2-card-title"><i class="ti ti-credit-card"></i>Metode Pembayaran</div>${hbarList(d.metode_bayar||[],'#534AB7')}</div>
    <div class="sd2-card"><div class="sd2-card-title"><i class="ti ti-shirt"></i>Variasi Terlaris</div>${hbarList(d.variasi_top||[],'#1D9E75')}</div>
  </div>
  <div class="sd2-g2">
    <div class="sd2-card"><div class="sd2-card-title"><i class="ti ti-building"></i>Top Kota/Kabupaten</div>${hbarList(d.kota_top||[],'#BA7517')}</div>
    <div class="sd2-card"><div class="sd2-card-title"><i class="ti ti-package"></i>Top SKU Induk</div>${hbarList(d.sku_top||[],'#E85630')}</div>
  </div>
  <div class="sd2-card">
    <div class="sd2-card-title"><i class="ti ti-bulb"></i>Insight Sebaran</div>
    <div style="font-size:12px;color:var(--color-text-secondary);line-height:1.8">
      ${buildSebaranInsight(d)}
    </div>
  </div>`;
}
function buildSebaranInsight(d){
  const prov=d.provinsi||[];
  const topProv=prov[0]?.n||'—';
  const top3Pct=d.total_pesanan>0&&prov.length>=3?((prov[0].v+prov[1].v+prov[2].v)/d.total_pesanan*100).toFixed(0):0;
  const cod=d.metode_bayar?.find(m=>m.n.includes('COD'));
  const codPct=d.total_pesanan>0&&cod?(cod.v/d.total_pesanan*100).toFixed(0):0;
  const topVariasi=d.variasi_top?.[0]?.n||'—';
  return `📍 Pasar terkuat: <b>${topProv}</b> — ${top3Pct}% pesanan dari 3 provinsi teratas. Pertimbangkan promo khusus area ini.<br>
💳 COD <b>${codPct}%</b> dari total — pastikan rate cancel tidak lebih dari 10%. Jika tinggi, set minimal rating buyer.<br>
👕 Variasi terlaris: <b>${topVariasi}</b> — pastikan stok selalu tersedia. Warna/ukuran ini bisa jadi hero SKU untuk diiklankan.`;
}

// ─── TAB: IKLAN ──────────────────────────────────────────────────────────────
function tabIklan(d){
  const daily=d.iklan_daily||[];
  const max=daily.length?Math.max(...daily.map(x=>x.v)):1;
  const roas=d.iklan_spend>0?(d.omset/d.iklan_spend):0;
  const avgDaily=daily.length?d.iklan_spend/daily.length:0;
  return `
  <div class="sd2-kpi-row">
    <div class="sd2-kpi" style="--kpi-accent:#534AB7"><div class="kl">Total Belanja Iklan</div><div class="kv">${fRp(d.iklan_spend)}</div><div class="ks">periode ${monthLabel(_activeMonthKey)}</div></div>
    <div class="sd2-kpi" style="--kpi-accent:${roas>=5?'#0F6E56':roas>=3?'#BA7517':'#D85A30'}"><div class="kl">ROAS</div><div class="kv ${roas>=5?'up':roas>=3?'':' dn'}">${roas>0?roas.toFixed(2)+'×':'—'}</div><div class="ks">Rp 1 iklan → Rp ${roas>0?roas.toFixed(1):' —'} omset</div></div>
    <div class="sd2-kpi"><div class="kl">Avg Harian</div><div class="kv">${fRp(avgDaily,0)}</div><div class="ks">${daily.length} hari ada spend</div></div>
    <div class="sd2-kpi"><div class="kl">% Omset untuk Iklan</div><div class="kv">${d.omset>0?fPct(d.iklan_spend/d.omset*100):'—'}</div><div class="ks ${d.omset>0&&d.iklan_spend/d.omset>0.15?'dn':' up'}">${d.omset>0&&d.iklan_spend/d.omset>0.15?'⚠️ Terlalu besar':'Wajar'}</div></div>
  </div>
  ${roas>0&&roas<3?`<div class="sd2-alert danger"><span>⚠️</span><div><b>ROAS ${roas.toFixed(1)}× — di bawah breakeven</b>. Untuk toko dengan margin platform ~${d.omset>0?fPct((d.total_dilepas||0)/d.omset*100):'—'}, ROAS minimal yang aman adalah 3–4×. Pertimbangkan kurangi budget atau switch ke produk yang lebih converting.</div></div>`:''}
  <div class="sd2-card">
    <div class="sd2-card-title"><i class="ti ti-chart-bar"></i>Belanja Iklan Harian</div>
    <div style="max-height:400px;overflow-y:auto">
    ${daily.map(row=>{
      const pct=max>0?Math.min((row.v/max)*100,100):0;
      return `<div class="sd2-iday">
        <div class="sd2-id">${row.d}</div>
        <div class="sd2-ig"><div class="sd2-if" style="width:${pct.toFixed(1)}%"><div class="sd2-it">${row.v>=10000?fRp(row.v):''}</div></div></div>
        <div class="sd2-iv">${fRp(row.v)}</div>
      </div>`;
    }).join('')}
    ${!daily.length?'<div style="color:var(--color-text-tertiary);font-size:12px;padding:8px">Data iklan tidak tersedia. Upload file adwords CSV.</div>':''}
    </div>
  </div>`;
}

// ─── TAB: SCALE UP ──────────────────────────────────────────────────────────
function tabScaleUp(d,prev){
  const totalViews=(d.produk_performa||[]).reduce((a,p)=>a+(p.views||0),0);
  const funnelCTR=totalViews>0?((d.produk_performa||[]).reduce((a,p)=>a+(p.klik||0),0)/totalViews*100):0;
  const marginRate=d.omset>0?((d.total_dilepas||0)/d.omset*100):0;
  const roas=d.iklan_spend>0?(d.omset/d.iklan_spend):0;
  const notComp=d.harga_tidak_kompetitif||[];
  const highCartNoOrder=(d.produk_performa||[]).filter(p=>(p.keranjang||0)>5&&(p.orders||0)===0);

  const opps=[];

  if(notComp.length>0){
    const lostViews=notComp.reduce((a,p)=>a+(p.views||0),0);
    opps.push({priority:1,type:'fix',icon:'🏷️',title:`Perbaiki Harga ${notComp.length} Produk Tidak Kompetitif`,desc:`${lostViews.toLocaleString('id-ID')} views/bln terbuang sia-sia. Dengan CVR rata-rata 2.2% dan harga ${fRp(d.omset/d.total_pesanan,0)}/order, potensi omset hilang: <b>~${fRp(lostViews*0.022*(d.omset/(d.total_pesanan||1)),0)}/bln</b>.`,action:'Turunkan harga atau tambah bundling'});
  }
  if(highCartNoOrder.length>0){
    opps.push({priority:2,type:'fix',icon:'🛒',title:`${highCartNoOrder.length} Produk Keranjang Tinggi Tapi 0 Order`,desc:`Pembeli sudah intent membeli (masuk keranjang) tapi tidak checkout. Kemungkinan: harga lebih mahal dari kompetitor, review kurang, atau tidak ada promo. Produk: ${highCartNoOrder.slice(0,2).map(p=>shortName(p.nama)).join(', ')}.`,action:'Aktifkan diskon atau voucher untuk produk ini'});
  }
  if(funnelCTR<2){
    opps.push({priority:3,type:'fix',icon:'📸',title:`CTR Rendah ${fPct(funnelCTR)} — Foto & Judul Perlu Diupgrade`,desc:`Dari ${totalViews.toLocaleString('id-ID')} views, hanya ${fPct(funnelCTR)} yang klik. Benchmark toko sweater pria: 2.5–4%. Meningkatkan CTR ke 3% = +${Math.round(totalViews*0.03)-Math.round(totalViews*funnelCTR/100)} klik baru tanpa tambah budget.`,action:'A/B test foto cover, ganti background putih, tambah overlay teks harga'});
  }
  if(prev&&d.total_pesanan<prev.total_pesanan){
    const drop=prev.total_pesanan-d.total_pesanan;
    opps.push({priority:4,type:'do',icon:'📉',title:`Recovery: Pesanan Turun ${drop} dari Bulan Lalu`,desc:`April ${prev.total_pesanan} pesanan → Mei ${d.total_pesanan} pesanan. Cek apakah ada produk yang tiba-tiba stop terjual, kompetitor baru, atau penurunan iklan.`,action:'Bandingkan performa per produk April vs Mei di tab Produk'});
  }
  if(d.iklan_spend>0&&roas>=4){
    const safeIncrease=Math.round(d.iklan_spend*0.3);
    opps.push({priority:5,type:'boost',icon:'📢',title:`ROAS ${roas.toFixed(1)}× — Aman untuk Scale Iklan`,desc:`ROAS di atas 4× artinya setiap penambahan Rp 1 iklan masih menguntungkan. Dengan margin platform ${fPct(marginRate)}, scale budget iklan +30% (${fRp(safeIncrease)}) berpotensi tambah omset ${fRp(safeIncrease*roas)}.`,action:`Naikkan budget iklan Rp ${fRp(safeIncrease)}/bulan`});
  }
  opps.push({priority:6,type:'do',icon:'🗺️',title:'Ekspansi Provinsi: Jawa Timur Dominan',desc:`Jawa Timur top ${d.total_pesanan} pesanan. DKI Jakarta yang dulu kuat (Apr: top 2) turun ke posisi bawah. Aktifkan campaign khusus Jabodetabek — pasar besar yang underperform.`,action:'Buat promo bebas ongkir khusus Jabodetabek'});
  opps.push({priority:7,type:'boost',icon:'🔁',title:'Repeat Order: Potensi Belum Digarap',desc:`Data menunjukkan beberapa pembeli melakukan repeat order (18% di Kaos Rajut). Belum ada program loyalitas aktif. Follow up pembeli lama bisa jadi channel baru tanpa biaya iklan.`,action:'Aktifkan Shopee Chat blast untuk pembeli bulan lalu'});

  return `
  <div class="sd2-divider">📊 Diagnosa Bulan Ini</div>
  <div class="sd2-g3">
    <div class="sd2-kpi" style="--kpi-accent:#E85630"><div class="kl">Potensi Pesanan Hilang</div><div class="kv dn">${notComp.length?'~'+Math.round(notComp.reduce((a,p)=>a+(p.views||0),0)*0.022)+' order':'0'}</div><div class="ks">dari produk harga tidak kompetitif</div></div>
    <div class="sd2-kpi" style="--kpi-accent:#BA7517"><div class="kl">CTR Gap ke Benchmark</div><div class="kv ${funnelCTR<2?'dn':' up'}">${fPct(funnelCTR)} vs 2.5%</div><div class="ks">${funnelCTR<2?`+${((0.025-funnelCTR/100)*totalViews).toFixed(0)} klik jika capai 2.5%`:'Di atas benchmark'}</div></div>
    <div class="sd2-kpi" style="--kpi-accent:#0F6E56"><div class="kl">Budget Iklan Optimal</div><div class="kv">${fRp(d.omset*0.1,0)}</div><div class="ks">~10% omset = ${fRp(d.iklan_spend,0)} saat ini (${d.omset>0?fPct(d.iklan_spend/d.omset*100):'—'})</div></div>
  </div>
  <div class="sd2-divider">🎯 Peluang & Aksi — Diurutkan Prioritas</div>
  ${opps.sort((a,b)=>a.priority-b.priority).map(o=>`
  <div class="sd2-opp">
    <div class="sd2-opp-icon">${o.icon}</div>
    <div class="sd2-opp-body">
      <div class="sd2-opp-title">${o.priority}. ${o.title}</div>
      <div class="sd2-opp-desc">${o.desc}</div>
      <span class="sd2-opp-action ${o.type}">→ ${o.action}</span>
    </div>
  </div>`).join('')}`;
}

// ─── TAB: PROYEKSI ───────────────────────────────────────────────────────────
function tabProyeksi(){
  const months=getAllMonths(_activeToko);
  const allData=months.map(m=>getData(_activeToko,m)).filter(Boolean);
  if(allData.length<2){
    return `<div class="sd2-card"><div style="text-align:center;padding:30px;color:var(--color-text-tertiary)">Butuh minimal 2 bulan data. Saat ini: <b>${allData.length} bulan</b>.</div></div>`;
  }
  function proj(key){
    const vals=allData.map(d=>d[key]||0).filter(v=>v>0);
    if(!vals.length) return {min:0,max:0,exp:0,simple:0};
    const simple=vals.reduce((a,b)=>a+b,0)/vals.length;
    let wSum=0,wTot=0;
    vals.forEach((v,i)=>{const w=Math.pow(0.7,i);wSum+=v*w;wTot+=w;});
    const weighted=wSum/wTot;
    return {min:Math.min(...vals),max:Math.max(...vals),exp:Math.round(weighted*0.7+simple*0.3),simple:Math.round(simple)};
  }
  const pO=proj('omset'), pP=proj('total_pesanan'), pE=proj('total_dilepas'), pI=proj('iklan_spend');
  const ny=parseInt(_activeMonthKey.slice(0,4));
  const nm=parseInt(_activeMonthKey.slice(4,6))%12+1;
  const ny2=nm===1?ny+1:ny;
  const nextLbl=monthLabel(`${ny2}${String(nm).padStart(2,'0')}`);
  return `
  <div class="sd2-alert info"><span>ℹ️</span><div>Proyeksi dari <b>${allData.length} bulan</b> data: ${months.map(monthLabel).join(', ')}. <b>Expected</b> = weighted avg (bulan terbaru bobot 70%). <b>Worst/Best</b> = aktual bulan terburuk/terbaik.</div></div>
  <div class="sd2-divider">Proyeksi ${nextLbl}</div>
  ${[['Omset',pO,true],['Pesanan',pP,false],['Escrow Diterima',pE,true],['Budget Iklan',pI,true]].map(([l,p,isRp])=>`
  <div style="margin-bottom:12px">
    <div style="font-size:10px;color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${l}</div>
    <div class="sd2-proj3">
      <div class="sd2-pcard worst"><div class="pt">Worst Case</div><div class="pv">${isRp?fRp(p.min):p.min}</div><div class="ps">bulan terburuk</div></div>
      <div class="sd2-pcard exp"><div class="pt">Expected</div><div class="pv">${isRp?fRp(p.exp):p.exp}</div><div class="ps">weighted avg</div></div>
      <div class="sd2-pcard best"><div class="pt">Best Case</div><div class="pv">${isRp?fRp(p.max):p.max}</div><div class="ps">bulan terbaik</div></div>
    </div>
  </div>`).join('')}
  <div class="sd2-card">
    <div class="sd2-card-title"><i class="ti ti-table"></i>History Semua Bulan</div>
    <table class="sd2-tbl">
      <tr><th>Bulan</th><th class="r">Pesanan</th><th class="r">Omset</th><th class="r">Escrow</th><th class="r">Iklan</th><th class="r">ROAS</th><th class="r">Margin</th></tr>
      ${allData.map((d,i)=>`<tr ${i===0?'style="font-weight:600"':''}>
        <td>${monthLabel(months[i])}</td>
        <td class="r">${d.total_pesanan}</td>
        <td class="r">${fRp(d.omset)}</td>
        <td class="r">${fRp(d.total_dilepas)}</td>
        <td class="r">${fRp(d.iklan_spend)}</td>
        <td class="r">${d.iklan_spend>0?(d.omset/d.iklan_spend).toFixed(1)+'×':'—'}</td>
        <td class="r">${d.omset>0?fPct(d.total_dilepas/d.omset*100):'—'}</td>
      </tr>`).join('')}
    </table>
  </div>`;
}

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────
window.sd2OpenUpload=function(){
  _importSession={income:null,order:null,order_prev:null,produk:null,iklan:null};
  ['income','order','order_prev','produk','iklan'].forEach(t=>{
    const dz=document.getElementById('dz2-'+t);
    const st=document.getElementById('dzs2-'+t);
    if(dz) dz.className='sd2-dz';
    if(st) st.textContent=t==='order_prev'?'Opsional — untuk proyeksi':'Belum diupload';
  });
  document.getElementById('sd2-err').style.display='none';
  document.getElementById('sd2-save-btn').disabled=true;
  document.getElementById('sd2-modal').style.display='flex';
};
window.sd2CloseUpload=function(){ document.getElementById('sd2-modal').style.display='none'; };
window.sd2DragOver=function(e,id){
  if(e.target.classList.contains('sd2-dz-btn'))return;
  e.preventDefault(); document.getElementById('dz2-'+id).classList.add('drag-over');
};
window.sd2DragLeave=function(e,id){ document.getElementById('dz2-'+id).classList.remove('drag-over'); };
window.sd2Drop=function(e,type){
  e.preventDefault(); document.getElementById('dz2-'+type).classList.remove('drag-over');
  const f=e.dataTransfer.files[0]; if(f) sd2Process(f,type);
};
window.sd2FileInput=function(e,type){ const f=e.target.files[0]; if(f) sd2Process(f,type); };

function sd2Process(file,type){
  const st=document.getElementById('dzs2-'+type);
  const dz=document.getElementById('dz2-'+type);
  st.textContent='⏳ Memproses...';
  const reader=new FileReader();
  reader.onload=function(ev){
    try{
      if(type==='iklan'){
        _importSession.iklan=parseAdwords(ev.target.result);
        dz.className='sd2-dz done'; st.textContent='✓ '+file.name;
        sd2CheckReady();
      } else {
        loadSheetJS(function(){
          try{
            const parseType=type==='order_prev'?'order':type;
            const result=parseXlsx(ev.target.result,parseType,file.name);
            _importSession[type]=result;
            dz.className='sd2-dz done'; st.textContent='✓ '+file.name;
          } catch(err){
            dz.className='sd2-dz error'; st.textContent='✗ '+err.message;
          }
          sd2CheckReady();
        });
      }
    } catch(err){
      dz.className='sd2-dz error'; st.textContent='✗ '+err.message;
      sd2CheckReady();
    }
  };
  if(type==='iklan') reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
}

function sd2CheckReady(){
  const ready=_importSession.income||_importSession.order||_importSession.produk||_importSession.iklan;
  document.getElementById('sd2-save-btn').disabled=!ready;
}

function loadSheetJS(cb){
  if(window.XLSX){ cb(); return; }
  const s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload=cb; s.onerror=function(){ throw new Error('Gagal load library XLSX'); };
  document.head.appendChild(s);
}

// ─── PARSERS ─────────────────────────────────────────────────────────────────
function rp(v){ if(!v) return 0; return parseFloat(String(v).replace(/[^\d.-]/g,'').replace(',','.')) || 0; }

function parseIncome(wb){
  const r={};
  const ss=wb.Sheets['Summary'];
  if(!ss) return r;
  const rows=XLSX.utils.sheet_to_json(ss,{header:1,defval:null});
  // Row 0..4 = header meta
  for(const row of rows){
    const c0=String(row[0]||'').trim();
    const c1=String(row[1]||'').trim();
    const c2=row[2]!==null&&row[2]!==undefined?row[2]:null;
    const c3=row[3]!==null&&row[3]!==undefined?row[3]:null;
    if(c0==='Username (Penjual)') r.username=c1;
    if(c0==='Dari') r.date_from=c1.replace(/-/g,'');
    if(c0==='ke') r.date_to=c1.replace(/-/g,'');
    // Summary sheet structure:
    // Col0 = group label, Col1 = sub-label, Col2 = IDR sub, Col3 = IDR total
    // When c0 is not empty it's a group label, value is in c3
    // When c0 is empty/null and c1 is the item, value is in c2
    if(c0==='1. Total Pendapatan') r.total_pendapatan=c3;
    if(c1==='Subtotal Pesanan'&&c0==='1. Total Pendapatan'){ /* handled below */ }
    if(c0==='Subtotal Pesanan') r.omset=c3;
    if(c1==='Harga Asli Produk') r.harga_asli=c2;
    if(c1==='Jumlah Pengembalian Dana ke Pembeli') r.total_refund=c2;
    if(c1==='Voucher disponsor oleh Penjual'&&!c0.includes('co-fund')&&c0==='Voucher & Subsidi Shopee') r.total_voucher=c2;
    if(c1==='Voucher disponsor oleh Penjual') r.total_voucher=r.total_voucher||c2;
    // Biaya
    if(c1==='Biaya Komisi AMS') r.fee_komisi_ams=c2;
    if(c1==='Biaya Administrasi') r.fee_admin=c2;
    if(c1==='Biaya Layanan') r.fee_layanan=c2;
    if(c1==='Biaya Proses Pesanan') r.fee_proses=c2;
    if(c1==='Biaya Isi Saldo Otomatis (dari Penghasilan)') r.fee_saldo_otomatis=c2;
    if(c1==='Premi') r.fee_premi=c2;
    if(c1==='Biaya Kampanye') r.fee_kampanye=c2;
    if(c0==='Total Biaya Pengiriman') r.fee_ongkir_net=c3;
    if(c0==='3. Total yang Dilepas') r.total_dilepas=c3;
    if(c0==='2. Total Pengeluaran') r.total_pengeluaran=c3;
  }
  // Parse income sheet for omset if missing + metode bayar
  const is=wb.Sheets['Income'];
  if(is){
    const irows=XLSX.utils.sheet_to_json(is,{header:1,defval:null});
    const hrow=irows.find(r=>r[1]==='No. Pesanan');
    if(hrow){
      const hi=irows.indexOf(hrow);
      const cols=hrow;
      const data=irows.slice(hi+1).filter(r=>r[0]!==null&&String(r[0]).trim()!=='total(Rp)');
      // omset from income rows if summary missing
      if(!r.omset||r.omset===0){
        const si=cols.indexOf('Total Pembayaran');
        if(si>=0) r.omset=data.reduce((a,row)=>a+(parseFloat(String(row[si]||0).replace(/[^\d.-]/g,''))||0),0);
      }
      // metode bayar
      const mi=cols.indexOf('Metode pembayaran pembeli');
      if(mi>=0){
        const mc={};
        data.forEach(row=>{ const m=String(row[mi]||'Lainnya').trim(); mc[m]=(mc[m]||0)+1; });
        r._metode_bayar_income=Object.entries(mc).sort((a,b)=>b[1]-a[1]).map(([n,v])=>({n,v}));
        r._income_count=data.length;
      }
    }
  }
  return r;
}

function parseOrder(wb,filename){
  const sh=wb.Sheets['orders']||wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(sh,{header:1,defval:null});
  const header=rows[0];
  const data=rows.slice(1).filter(r=>r[0]);
  const get=(r,k)=>{ const i=header.indexOf(k); return i>=0?r[i]:null; };
  let dateFrom='',dateTo='';
  const fm=filename.match(/(\d{8})_(\d{8})/);
  if(fm){dateFrom=fm[1];dateTo=fm[2];}
  const prov={},kota={},metode={},variasi={},sku={};
  let hari=new Set();
  data.forEach(r=>{
    const p=get(r,'Provinsi')||'Lainnya';
    const k=get(r,'Kota/Kabupaten')||'Lainnya';
    const m=get(r,'Metode Pembayaran')||'Lainnya';
    const v=get(r,'Nama Variasi')||'—';
    const s=get(r,'SKU Induk')||'—';
    const tgl=get(r,'Waktu Pesanan Dibuat');
    prov[p]=(prov[p]||0)+1; kota[k]=(kota[k]||0)+1;
    metode[m]=(metode[m]||0)+1; variasi[v]=(variasi[v]||0)+1; sku[s]=(sku[s]||0)+1;
    if(tgl) hari.add(String(tgl).slice(0,10));
  });
  const topN=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([n,v])=>({n,v}));
  return {_type:'order',date_from:dateFrom,date_to:dateTo,total_pesanan:data.length,hari_aktif:hari.size,provinsi:topN(prov,8),kota_top:topN(kota,8),metode_bayar:topN(metode,8),variasi_top:topN(variasi,10),sku_top:topN(sku,6)};
}

function parseProduk(wb){
  const r={produk_performa:[],harga_tidak_kompetitif:[],harga_kompetitif:[],produk_baru:[]};
  function readSheet(name,outKey,extra){
    const sh=wb.Sheets[name]; if(!sh) return;
    const rows=XLSX.utils.sheet_to_json(sh,{header:1,defval:null});
    const h=rows[0];
    rows.slice(1).filter(x=>x[0]).forEach(row=>{
      const g=k=>{ const i=h.indexOf(k); return i>=0?row[i]:null; };
      const obj={
        kode:String(g('Kode Produk')||''),
        nama:String(g('Produk')||''),
        views:parseInt(g('Jumlah Produk Dilihat'))||0,
        klik:parseInt(g('Produk Diklik'))||0,
        ctr:g('Persentase Klik'),
        cvr:g('Tingkat Konversi Pesanan (Pesanan Siap Dikirim)'),
        orders:parseInt(g('Pesanan Siap Dikirim'))||0,
        revenue:rp(g('Penjualan (Pesanan Siap Dikirim) (IDR)')),
        keranjang:parseInt(g('Dimasukkan ke Keranjang (Produk)'))||0,
      };
      if(extra) Object.assign(obj,extra(g));
      r[outKey].push(obj);
    });
  }
  readSheet('Produk dengan Performa Terbaik','produk_performa');
  readSheet('Harga Belum Kompetitif','harga_tidak_kompetitif',g=>({harga:g('Harga Saat Ini'),flag_harga_tidak_kompetitif:true}));
  readSheet('Harga Sudah Kompetitif','harga_kompetitif',g=>({harga:g('Harga Saat Ini'),flag_harga_kompetitif:true}));
  // Produk baru
  const sb=wb.Sheets['Produk yang Baru Ditambahkan'];
  if(sb){
    const rows=XLSX.utils.sheet_to_json(sb,{header:1,defval:null});
    const h=rows[0];
    rows.slice(1).filter(x=>x[0]).forEach(row=>{
      const g=k=>{ const i=h.indexOf(k); return i>=0?row[i]:null; };
      const hari=parseInt(g('Hari Dibuat'))||0;
      if(hari<=90) r.produk_baru.push({kode:String(g('Kode Produk')||''),nama:String(g('Produk')||''),usia_hari:hari,views:parseInt(g('Jumlah Produk Dilihat'))||0,klik:parseInt(g('Produk Diklik'))||0,orders:parseInt(g('Pesanan Siap Dikirim'))||0,revenue:rp(g('Penjualan (Pesanan Siap Dikirim) (IDR)'))});
    });
    r.produk_baru.sort((a,b)=>b.views-a.views);
  }
  return r;
}

function parseAdwords(text){
  const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);
  let username=''; const daily={};  let total=0;
  for(const line of lines){
    const cols=line.split(',');
    if(line.startsWith('Username:')) username=(cols[1]||'').trim();
    if(cols.length>=4&&/^\d+$/.test((cols[0]||'').trim())){
      const tgl=(cols[1]||'').trim();
      const desc=(cols[2]||'').trim();
      const amt=parseInt((cols[3]||'').trim())||0;
      if(amt<0&&!desc.includes('Isi Saldo')){
        total+=Math.abs(amt);
        daily[tgl]=(daily[tgl]||0)+Math.abs(amt);
      }
    }
  }
  const dailyArr=Object.entries(daily).sort((a,b)=>{
    const pa=a[0].split('/'),pb=b[0].split('/');
    return new Date(pa[2],pa[1]-1,pa[0])-new Date(pb[2],pb[1]-1,pb[0]);
  }).map(([d,v])=>({d:d.slice(0,5),v}));
  return {_type:'iklan',username,totalSpend:total,daily:dailyArr};
}

function parseXlsx(buffer,type,filename){
  const wb=XLSX.read(buffer,{type:'array',cellDates:true});
  if(type==='income') return parseIncome(wb);
  if(type==='order')  return parseOrder(wb,filename);
  if(type==='produk') return parseProduk(wb);
  throw new Error('Tipe tidak dikenal: '+type);
}

// ─── SAVE ─────────────────────────────────────────────────────────────────────
window.sd2SaveImport=function(){
  const s=_importSession;
  // Detect toko
  let tokoId=_activeToko;
  const uname=((s.income&&s.income.username)||(s.iklan&&s.iklan.username)||'').toLowerCase();
  for(const [k,info] of Object.entries(TOKO_MAP)){
    if(uname.includes(k)){tokoId=info.id;break;}
  }
  // Detect month
  let monthKey='';
  const df=(s.income&&s.income.date_from)||(s.order&&s.order.date_from)||'';
  if(df.length>=6) monthKey=df.slice(0,6);
  if(!monthKey){
    const e=document.getElementById('sd2-err');
    e.style.display='block'; e.textContent='⚠️ Tidak dapat mendeteksi periode. Pastikan Income XLSX terupload.'; return;
  }
  // Merge
  const income=s.income||{},order=s.order||{},produk=s.produk||{},iklan=s.iklan||{};
  let pl=produk.produk_performa||[];
  const tdk=(produk.harga_tidak_kompetitif||[]).map(p=>p.kode);
  const ok=(produk.harga_kompetitif||[]).map(p=>p.kode);
  pl=pl.map(p=>({...p,flag_harga_tidak_kompetitif:tdk.includes(p.kode),flag_harga_kompetitif:ok.includes(p.kode)}));
  pl.sort((a,b)=>(b.revenue||0)-(a.revenue||0));
  const merged={
    _toko:tokoId,_bulan:monthKey,_saved:Date.now(),
    username:income.username||iklan.username||'',
    date_from:income.date_from||order.date_from||'',
    date_to:income.date_to||order.date_to||'',
    omset:income.omset||0,
    harga_asli:income.harga_asli||0,
    total_refund:income.total_refund||0,
    total_voucher:income.total_voucher||0,
    total_dilepas:income.total_dilepas||0,
    total_pengeluaran:income.total_pengeluaran||0,
    fee_layanan:income.fee_layanan||0,
    fee_admin:income.fee_admin||0,
    fee_proses:income.fee_proses||0,
    fee_saldo_otomatis:income.fee_saldo_otomatis||0,
    fee_komisi_ams:income.fee_komisi_ams||0,
    fee_ongkir_net:income.fee_ongkir_net||0,
    fee_premi:income.fee_premi||0,
    fee_kampanye:income.fee_kampanye||0,
    total_pesanan:order.total_pesanan||income._income_count||0,
    hari_aktif:order.hari_aktif||0,
    provinsi:order.provinsi||[],
    kota_top:order.kota_top||[],
    metode_bayar:order.metode_bayar||income._metode_bayar_income||[],
    variasi_top:order.variasi_top||[],
    sku_top:order.sku_top||[],
    produk_performa:pl,
    harga_tidak_kompetitif:produk.harga_tidak_kompetitif||[],
    harga_kompetitif:produk.harga_kompetitif||[],
    produk_baru:produk.produk_baru||[],
    iklan_spend:iklan.totalSpend||0,
    iklan_daily:iklan.daily||[],
  };
  localStorage.setItem(LS_PREFIX+tokoId+'_'+monthKey,JSON.stringify(merged));
  // Save order_prev if uploaded
  if(s.order_prev){
    const prev=s.order_prev;
    const pm=prev.date_from?prev.date_from.slice(0,6):'';
    if(pm&&pm!==monthKey){
      const pk=LS_PREFIX+tokoId+'_'+pm;
      if(!localStorage.getItem(pk)){
        localStorage.setItem(pk,JSON.stringify({_toko:tokoId,_bulan:pm,_saved:Date.now(),_partial:true,total_pesanan:prev.total_pesanan||0,hari_aktif:prev.hari_aktif||0,provinsi:prev.provinsi||[],kota_top:prev.kota_top||[],metode_bayar:prev.metode_bayar||[],variasi_top:prev.variasi_top||[],sku_top:prev.sku_top||[],omset:0,total_dilepas:0,iklan_spend:0}));
      }
    }
  }
  _activeToko=tokoId; _activeMonthKey=monthKey;
  localStorage.setItem(LS_ACTIVE,tokoId);
  document.querySelectorAll('.sd2-toko-btn').forEach(b=>b.classList.toggle('active',b.dataset.toko===tokoId));
  sd2CloseUpload();
  renderMonthBar();
  sd2Toast('✓ Data '+monthLabel(monthKey)+' untuk '+tokoId+' disimpan');
};

function hbarList(arr,color){
  if(!arr||!arr.length) return '<div style="color:var(--color-text-tertiary);font-size:12px;padding:8px 0">—</div>';
  const max=arr[0].v;
  return arr.map(({n,v})=>hbar(n,v,max,color)).join('');
}

function sd2Toast(msg){
  let t=document.getElementById('sd2-toast');
  if(!t){t=document.createElement('div');t.id='sd2-toast';t.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;z-index:9999;transition:opacity .3s;white-space:nowrap;pointer-events:none';document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';
  setTimeout(()=>{t.style.opacity='0';},3000);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
renderMonthBar();

})();
