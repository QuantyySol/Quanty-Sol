/* trending.js : 🔥 Trending tab. Mirrors the pump.fun app Trending board (desk.json `trending`, refreshed on the box every 45 s)
   with live prices / MC / 5m & 1h change from the public DexScreener API every 7 s while the tab is open and visible.
   Falls back to the desk values with a DELAYED label. Tickers only; avatars are generated (no external images).
   Each row opens the coin on DexScreener. Badges: coins our paper books hold, coins our rug filter rejected. Paper trading only. */
(function(){
"use strict";
if(!window.Desk){console.warn("trending: Desk API missing");return}
var API="https://api.dexscreener.com/tokens/v1/solana/",B58=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/,EVERY=7000,q={},lastOk=0,timer=null,busy=false,back=0;
function E(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return "&#"+c.charCodeAt(0)+";"})}
function mc(v){v=+v;if(!(v>0))return "--";return "$"+(v>=1e9?(v/1e9).toFixed(2)+"B":v>=1e6?(v/1e6).toFixed(2)+"M":v>=1e3?(v/1e3).toFixed(v>=1e5?0:1)+"K":Math.round(v))}
function pc(v){if(v==null||!isFinite(v))return '<span class="tr-chip">--</span>';v=+v;return '<span class="tr-chip '+(v<0?"dn":"up")+'">'+(v>=0?"▲":"▼")+Math.abs(v).toFixed(v>=100||v<=-100?0:1)+"%</span>"}
function age(s){s=+s;if(!(s>=0))return "";return s<3600?Math.max(1,Math.round(s/60))+"m":s<86400?Math.round(s/3600)+"h":Math.round(s/86400)+"d"}
function hue(t){var h=0;for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))%360;return h}
var css=document.createElement("style");css.textContent=
"#trending .tr-h{display:flex;align-items:center;gap:8px;margin:6px 0 10px;font-size:12px;color:#9ab}"+
"#trending .tr-list{display:flex;flex-direction:column;gap:6px;max-width:720px}"+
"#trending a.tr-row{display:grid;grid-template-columns:22px 44px 1fr auto;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:#11161f;border:1px solid #ffffff12;color:inherit;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:#5ad1ff33;transition:background .15s,border-color .15s}"+
"#trending a.tr-row:hover,#trending a.tr-row:focus{background:#172030;border-color:#5ad1ff66;outline:none}"+
"#trending .tr-rk{font:700 12px ui-monospace,monospace;color:#7a8a99;text-align:center}"+
"#trending .tr-av{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font:900 18px Inter,sans-serif;color:#fff;text-shadow:0 1px 2px #0008}"+
"#trending .tr-m{min-width:0}#trending .tr-t{font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;gap:5px;align-items:center}"+
"#trending .tr-s{font-size:11px;color:#8a9aab;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
"#trending .tr-bar{height:4px;border-radius:2px;background:#232c38;margin-top:6px;overflow:hidden}#trending .tr-bar i{display:block;height:100%;background:linear-gradient(90deg,#39ff88,#a6ff3d)}#trending .tr-bar.gd i{background:linear-gradient(90deg,#ffcc33,#ff9f1a)}"+
"#trending .tr-r{text-align:right;white-space:nowrap}#trending .tr-mc{font-weight:800;font-size:15px;font-variant-numeric:tabular-nums}"+
"#trending .tr-chip{display:inline-block;font:700 11px ui-monospace,monospace;padding:2px 5px;border-radius:6px;margin-left:4px;background:#ffffff10;color:#9ab}#trending .tr-chip.up{color:#39ff88;background:#39ff8818}#trending .tr-chip.dn{color:#ff5c6c;background:#ff5c6c18}"+
"#trending .tr-b{font:800 9px Inter,sans-serif;padding:2px 5px;border-radius:5px;letter-spacing:.04em}#trending .tr-b.held{background:#39ff8822;color:#39ff88}#trending .tr-b.rug{background:#ff5c6c22;color:#ff7c8a}#trending .tr-b.gd{background:#ffcc3322;color:#ffcc33}"+
"#trending .tr-flash{animation:trF .6s}@keyframes trF{0%{background:#5ad1ff22}100%{background:transparent}}"+
"@media(max-width:520px){#trending a.tr-row{grid-template-columns:18px 38px 1fr auto;gap:8px;padding:9px 10px}#trending .tr-av{width:38px;height:38px;font-size:16px}#trending .tr-chip{margin-left:2px}}";
document.head.appendChild(css);
function sec(){var s=document.getElementById("trending");if(s&&!s.querySelector(".tr-list")){s.insertAdjacentHTML("beforeend",'<div class="tr-h"><span id="tr-lv"></span><span id="tr-up"></span></div><div class="tr-list" id="tr-list"></div>')}return s}
function on(){return (location.hash||"")==="#trending"&&!document.hidden}
function render(){var s=sec();if(!s)return;var T=(Desk.data||{}).trending,L=document.getElementById("tr-list");if(!L)return;
 if(!T||!T.coins||!T.coins.length){L.innerHTML='<div class="tr-s">Trending list loading…</div>';return}
 var now=Date.now(),live=now-lastOk<25000,WHO={quanty:"Q",ledger:"L",twitter:"T"},prev={};
 L.querySelectorAll("[data-mint]").forEach(function(a){prev[a.getAttribute("data-mint")]=a.getAttribute("data-mc")});
 L.innerHTML=T.coins.map(function(c){if(!B58.test(c.mint||""))return "";var x=q[c.mint],f=x&&now-x.t<30000,m=f&&x.mc?x.mc:c.mc_usd,c5=f&&x.m5!=null?x.m5:c.chg_5m,c1=f&&x.h1!=null?x.h1:c.chg_1h,t=c.ticker||"?",h=hue(t);
  var pr=c.migrated?100:Math.max(0,Math.min(100,+c.progress_pct||0)),bd="";
  (c.held_by||[]).forEach(function(b){bd+='<span class="tr-b held" title="Our '+E(b)+' paper book holds this">HELD '+E(WHO[b]||b)+'</span>'});
  if(c.rug_rejected)bd+='<span class="tr-b rug" title="Our rug filter rejected this coin">RUG ✗</span>';
  if(c.migrated)bd+='<span class="tr-b gd">MIGRATED</span>';
  var mk=String(Math.round(+m||0));
  return '<a class="tr-row'+(prev[c.mint]!=null&&prev[c.mint]!==mk?' tr-flash':'')+'" data-mint="'+c.mint+'" data-mc="'+mk+'" href="https://dexscreener.com/solana/'+c.mint+'" target="_blank" rel="noopener" title="Open $'+E(t)+' on DexScreener">'+
   '<span class="tr-rk">'+E(c.rank)+'</span><span class="tr-av" style="background:linear-gradient(135deg,hsl('+h+',70%,45%),hsl('+((h+60)%360)+',75%,35%))">'+E(t.replace(/^\$/,"").charAt(0).toUpperCase()||"?")+'</span>'+
   '<span class="tr-m"><span class="tr-t">$'+E(t)+' '+bd+'</span><span class="tr-s">'+(c.age_s!=null?age(c.age_s)+" old · ":"")+"vol 1h "+mc(c.vol_usd_1h)+(c.kol_count?" · "+E(c.kol_count)+" KOLs":"")+'</span>'+
   '<span class="tr-bar'+(c.migrated?" gd":"")+'" title="'+(c.migrated?"Migrated":"Bonding curve "+pr.toFixed(0)+"%")+'"><i style="width:'+pr+'%"></i></span></span>'+
   '<span class="tr-r"><div class="tr-mc">'+mc(m)+'</div><div style="margin-top:4px">'+pc(c5)+pc(c1)+'</div></span></a>'}).join("");
 var lv=document.getElementById("tr-lv");if(lv)lv.innerHTML='<span class="lq-dot'+(live?"":" dl")+'"></span><span class="lq-tag'+(live?"":" dl")+'">'+(live?"LIVE":"DELAYED")+'</span>';
 var up=document.getElementById("tr-up");if(up)up.textContent="pump.fun trending · list "+(T.updated_at?new Date(T.updated_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"")+" · prices "+(live?"live (DexScreener, ~7 s)":"from the desk")+" · 5m / 1h";
}
function poll(){timer=null;if(!on()){return}var T=(Desk.data||{}).trending,ms=((T&&T.coins)||[]).map(function(c){return c.mint}).filter(function(m){return B58.test(m||"")}).slice(0,30);
 if(!ms.length||busy){render();sched();return}busy=true;
 fetch(API+ms.join(","),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(arr){var now=Date.now(),best={};
  (arr||[]).forEach(function(p){var a=p&&p.baseToken&&p.baseToken.address,l=+(p.liquidity&&p.liquidity.usd)||0;if(!a)return;if(!best[a]||l>best[a].l)best[a]={l:l,mc:+(p.marketCap||p.fdv)||null,m5:p.priceChange&&p.priceChange.m5!=null?+p.priceChange.m5:null,h1:p.priceChange&&p.priceChange.h1!=null?+p.priceChange.h1:null,t:now}});
  for(var k in best)q[k]=best[k];lastOk=now;back=0}).catch(function(){back=Math.min(60000,(back||EVERY)*2)}).then(function(){busy=false;render();sched()})}
function sched(){if(!timer&&on())timer=setTimeout(poll,EVERY+back)}
function kick(){render();if(on()&&!timer)poll()}
window.addEventListener("hashchange",kick);document.addEventListener("visibilitychange",kick);
if(typeof Desk.on==="function")Desk.on("update",function(){setTimeout(render,0)});
kick();
})();
