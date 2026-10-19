/* livequotes.js : client-side live prices for every open coin (Quanty main+premig, Ledger book).
   Polls the public DexScreener tokens endpoint from the browser (30 mints per call, ~5 s while the tab is visible,
   paused while hidden, backs off on errors/429). Picks the highest-liquidity pair quoted in SOL (else USD price / sol_usd).
   Coins DexScreener doesn't list yet fall back to the desk.json values and are flagged delayed:true.
   Exposes Desk.live = {positions:{mint:{symbol,book,price_sol,mc_usd,pnl_pct,pnl_sol,value_sol,updated,delayed,source}},
                        books:{quanty:{bank,cash,pnl_sol,pnl_pct,delayed},ledger:{...}}, updated, ok}
   and dispatches window 'desk:live' (detail = Desk.live) after every poll. Paper trading only. */
(function(){
"use strict";
var API="https://api.dexscreener.com/tokens/v1/solana/", B58=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
var EVERY=5000, MAXB=30, backoff=0, timer=null, busy=false, quotes={}, lastOk=0;
function D(){return (window.Desk&&window.Desk.data)||null;}
function positions(d){
  var out=[]; (d.open||[]).forEach(function(o){out.push({p:o,book:"quanty"});});
  ((d.ledger_book||{}).open||[]).forEach(function(o){out.push({p:o,book:"ledger"});});
  return out.filter(function(x){return typeof x.p.mint==="string"&&B58.test(x.p.mint);});
}
function pick(pairs,mint,solUsd){
  var best=null;
  (pairs||[]).forEach(function(pr){
    if(!pr||!pr.baseToken||pr.baseToken.address!==mint)return;
    var q=(pr.quoteToken&&pr.quoteToken.symbol||"").toUpperCase(), liq=+(pr.liquidity&&pr.liquidity.usd)||0;
    var ps=(q==="SOL"||q==="WSOL")?+pr.priceNative:(solUsd&&+pr.priceUsd?(+pr.priceUsd)/solUsd:NaN);
    if(!(ps>0))return; var sc=liq+((q==="SOL"||q==="WSOL")?1e12:0); /* prefer SOL-quoted, then deepest liquidity */
    if(!best||sc>best.sc)best={sc:sc,price_sol:ps,mc_usd:+(pr.marketCap||pr.fdv)||null,dex:pr.dexId};
  });
  return best;
}
function fetchBatch(ms,solUsd){
  return fetch(API+ms.join(","),{cache:"no-store"}).then(function(r){
    if(r.status===429)throw new Error("rate");if(!r.ok)throw new Error("http "+r.status);return r.json();
  }).then(function(arr){var now=Date.now();ms.forEach(function(m){var b=pick(arr,m,solUsd);if(b){b.t=now;quotes[m]=b;}});});
}
function compute(d){
  var now=Date.now(), sol=+d.sol_usd||0, live={positions:{},books:{},updated:new Date(lastOk||now).toISOString(),ok:now-lastOk<20000};
  var val={quanty:0,ledger:0}, stale={quanty:false,ledger:false};
  positions(d).forEach(function(x){
    var o=x.p, q=quotes[o.mint], fresh=q&&now-q.t<30000, entry=+o.entry_price_sol||0, cost=+o.cost_sol||0;
    var qty=+o.qty||(entry?cost/entry:0), price=fresh?q.price_sol:(+o.price_sol||null);
    var value=price&&qty?price*qty:(cost+(+o.unreal_sol||0));
    var pnlSol=cost?value-cost:(+o.unreal_sol||null), pnlPct=cost?(value/cost-1)*100:(+o.pnl_pct||null);
    if(!fresh&&o.pnl_pct!=null&&!(price&&qty)){pnlPct=+o.pnl_pct;}
    var mc=fresh?q.mc_usd:null;
    live.positions[o.mint]={symbol:o.symbol,book:x.book,strategy:o.strategy,price_sol:price,mc_usd:mc,pnl_pct:pnlPct,pnl_sol:pnlSol,value_sol:value,
      updated:new Date(fresh?q.t:(Date.parse(o.mark_ts)||now)).toISOString(),delayed:!fresh,source:fresh?"dexscreener":"desk"};
    val[x.book]+=value||0; if(!fresh)stale[x.book]=true;
  });
  var lb=d.ledger_book||{}, qOpenCost=0; (d.open||[]).forEach(function(o){qOpenCost+=(+o.cost_sol||0)+(+o.unreal_sol||0);});
  /* derive cash from bank_sol (the live feed overlays bank_sol/open but not cash_sol, so cash_sol can be stale) */
  var qCash=d.bank_sol!=null?(+d.bank_sol)-qOpenCost:(+d.cash_sol||0);
  function book(cash,v,start,n){var bank=cash+v;return {bank:bank,cash:cash,pnl_sol:bank-start,pnl_pct:(bank/start-1)*100,open:n};}
  live.books.quanty=book(qCash,val.quanty,+d.start_sol||1,(d.open||[]).length); live.books.quanty.delayed=stale.quanty;
  if(lb.cash_sol!=null||lb.bank_sol!=null){live.books.ledger=book(lb.cash_sol!=null?+lb.cash_sol:+lb.bank_sol,lb.cash_sol!=null?val.ledger:0,+lb.start_sol||1,(lb.open||[]).length);live.books.ledger.delayed=stale.ledger;}
  if(sol)live.books.quanty.bank_usd=live.books.quanty.bank*sol;
  return live;
}
function fmtMC(v){if(!(v>0))return "";return "$"+(v>=1e9?(v/1e9).toFixed(2)+"B":v>=1e6?(v/1e6).toFixed(2)+"M":v>=1e3?Math.round(v/1e3)+"K":Math.round(v));}
function fmtP(p){return p==null||!isFinite(p)?"--":(p>=0?"+":"")+p.toFixed(1)+"%";}
var css=document.createElement("style");
css.textContent=".lq-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#3fe07a;margin-right:4px;vertical-align:middle;animation:lqp 1.2s ease-in-out infinite}"+
".lq-dot.dl{background:#f5b342;animation:none}@keyframes lqp{0%,100%{opacity:1;box-shadow:0 0 0 0 #3fe07a99}50%{opacity:.45;box-shadow:0 0 0 4px #3fe07a00}}"+
".lq-tag{font-size:9px;font-weight:800;letter-spacing:.05em;color:#3fe07a}.lq-tag.dl{color:#f5b342}";
document.head.appendChild(css);
function badge(delayed){return '<span class="lq-dot'+(delayed?' dl':'')+'"></span><span class="lq-tag'+(delayed?' dl':'')+'">'+(delayed?'DELAYED':'LIVE')+'</span>';}
function paint(L){
  /* monitor wall screens */
  document.querySelectorAll("[data-live-mint]").forEach(function(el){
    var p=L.positions[el.getAttribute("data-live-mint")]; if(!p)return;
    var pe=el.querySelector(".mw-pnl"); if(pe){pe.textContent=fmtP(p.pnl_pct);pe.className="mw-pnl "+(p.pnl_pct<0?"dn":"up");}
    var mc=el.querySelector(".mw-mc"); if(mc)mc.textContent=p.mc_usd?"MC "+fmtMC(p.mc_usd):"";
    var lv=el.querySelector(".mw-lv"); if(lv&&lv.getAttribute("data-s")!==String(p.delayed)){lv.innerHTML=badge(p.delayed);lv.setAttribute("data-s",String(p.delayed));}
    el._pnl=p.pnl_pct;
  });
  /* status strip */
  var q=L.books.quanty, b=document.getElementById("bank"), pn=document.getElementById("pnl");
  if(q&&b)b.textContent=q.bank.toFixed(4)+" SOL";
  if(q&&pn){pn.textContent=(q.pnl_sol>=0?"+":"")+q.pnl_sol.toFixed(4)+" ("+fmtP(q.pnl_pct)+")";pn.className=q.pnl_sol>=0?"up":"dn";}
  var tk=document.querySelector(".ticker"), s=document.getElementById("lq-strip");
  if(tk&&!s){s=document.createElement("span");s.id="lq-strip";tk.appendChild(s);}
  if(s){var n=0,mcs=[];for(var m in L.positions){n++;var p=L.positions[m];if(p.book==="quanty")mcs.push((p.symbol||"?")+" "+(fmtMC(p.mc_usd)||"--")+" "+fmtP(p.pnl_pct));}
    var dl=!L.ok||(q&&q.delayed); s.innerHTML=badge(dl)+" "+(mcs.length?mcs.slice(0,4).join(" · ")+(mcs.length>4?" +"+(mcs.length-4):""):"no open coins")+
      (L.books.ledger?" · Ledger "+fmtP(L.books.ledger.pnl_pct):"");}
}
var CORE=null; /* index.html core keeps Desk.live.state / .lagSec (live-feed status); preserve them */
function publish(){var d=D();if(!d)return;var L=compute(d);
  if(CORE)["state","lagSec"].forEach(function(n){Object.defineProperty(L,n,{enumerable:true,get:function(){return CORE[n];}});});
  window.Desk.live=L;paint(L);
  try{window.dispatchEvent(new CustomEvent("desk:live",{detail:L}));}catch(e){}}
function poll(){
  timer=null; if(document.hidden)return; var d=D(); if(!d||busy){schedule();return;}
  var ms=[],seen={}; positions(d).forEach(function(x){if(!seen[x.p.mint]){seen[x.p.mint]=1;ms.push(x.p.mint);}});
  if(!ms.length){publish();schedule();return;}
  var jobs=[];for(var i=0;i<ms.length;i+=MAXB)jobs.push(fetchBatch(ms.slice(i,i+MAXB),+d.sol_usd||0));
  busy=true;
  Promise.all(jobs).then(function(){lastOk=Date.now();backoff=0;},function(){backoff=Math.min(60000,(backoff||EVERY)*2);})
   .then(function(){busy=false;publish();schedule();});
}
function schedule(){if(!timer&&!document.hidden)timer=setTimeout(poll,EVERY+backoff);}
document.addEventListener("visibilitychange",function(){if(document.hidden){if(timer){clearTimeout(timer);timer=null;}}else if(!timer){poll();}});
function start(){
  if(!window.Desk){setTimeout(start,300);return;}
  CORE=window.Desk.live||null; publish();
  if(typeof window.Desk.on==="function")window.Desk.on("update",function(){setTimeout(publish,0);});
  poll();
}
start();
})();
