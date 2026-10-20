/* twins.js : "Bag twins" + "Lonely sock" badges. View only, paper trades only.
   Bag twins: two or more traders (Quanty, Ledger, Twitter) hold the same coin right now -> a matching-socks badge on that
   coin's monitor-wall screen and on its open-position rows, with every holder's entry size and live P&L side by side.
   Lonely sock: one trader still holds a coin that another trader sold in the last 6 h -> a single sock with a
   "left behind" timer. Data: Desk.data books{} (Quanty from the live-overlaid top level), Desk.live.positions for live prices.
   Re-renders on every Desk update, every live poll and once a second for the timers. Shows tickers only. */
(function(){
'use strict';
if(!window.Desk){console.warn('twins: Desk API missing');return}
var B58=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, WIN=6*3600e3;
var COLS={quanty:'#39ff88',ledger:'#ffbf3f',twitter:'#5cc8ff'};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return '&#'+c.charCodeAt(0)+';'})}
function num(v){v=+v;return v===v&&isFinite(v)?v:null}
function nm(b){return b.charAt(0).toUpperCase()+b.slice(1)}
function col(b){var C=window.DeskBooks&&DeskBooks.COL;return (C&&C[b])||COLS[b]||'#b48cff'}
function ago(ms){if(!(ms>=0))return '';var m=Math.floor(ms/60000);if(m<1)return '<1m';if(m<60)return m+'m';return Math.floor(m/60)+'h '+(m%60)+'m'}
function fp(v){return v==null?'--':(v>=0?'+':'')+v.toFixed(1)+'%'}
function fs(v){return v==null?'':(v>=0?'+':'')+v.toFixed(4)}

/* every book's open and recently closed rows. Live pushes carry book totals only (no open/closed lists), so the last
   full lists seen in desk.json are kept and, while the live overlay is newer, desk.json is re-read every 90 s. */
var FULL={}, lastFetch=0;
function keep(bk){var k,n=0;for(k in bk){var b=bk[k];if(b&&Array.isArray(b.open)){FULL[k]={open:b.open,closed:b.closed||[]};n++;}}return n}
function books(d){
  var bk=d.books&&typeof d.books==='object'?d.books:{}, out={}, k, miss=false;
  keep(bk);
  for(k in bk){if(!FULL[k])miss=true;}
  if(!bk.ledger&&d.ledger_book&&Array.isArray(d.ledger_book.open))FULL.ledger=FULL.ledger||{open:d.ledger_book.open,closed:d.ledger_book.closed||[]};
  for(k in FULL)out[k]={open:FULL[k].open,closed:FULL[k].closed};
  var q=FULL.quanty||{open:[],closed:[]};
  out.quanty={open:d.open||q.open||[],closed:[].concat(d.closed||[],q.closed||[])};
  for(k in bk){var b=bk[k];if(b&&!Array.isArray(b.open)){miss=true;break;}}
  if(miss&&Date.now()-lastFetch>90e3){lastFetch=Date.now();
    fetch('desk.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j&&j.books&&keep(j.books))setTimeout(refresh,0);}).catch(function(){});}
  return out;
}
function groups(d){
  var B=books(d), G={}, now=Date.now(), b, m;
  for(b in B)(B[b].open||[]).forEach(function(o){if(!o||!B58.test(o.mint||''))return;
    var g=G[o.mint]||(G[o.mint]={sym:o.symbol||'?',hold:[],holders:{},left:[]});g.hold.push({book:b,o:o});g.holders[b]=1;});
  for(m in G){var g=G[m];
    for(b in B){if(g.holders[b])continue;var best=null;
      (B[b].closed||[]).forEach(function(c){if(!c||c.mint!==m)return;var t=Date.parse(c.closed_at);
        if(t&&now-t<=WIN&&now-t>=-60e3&&(!best||t>best.t))best={book:b,t:t,pnl:num(c.pnl_sol),rule:c.rule||''};});
      if(best)g.left.push(best);}
    g.left.sort(function(a,b){return b.t-a.t});
    var n=0;for(b in g.holders)n++;g.n=n;
    g.kind=n>=2?'twins':(n===1&&g.left.length?'lonely':'');
    if(!g.kind)delete G[m];}
  return G;
}
/* live P&L for one holder: DexScreener price vs that holder's own entry/mark; else the book's last desk mark */
function pnl(m,o){
  var lp=((window.Desk.live&&Desk.live.positions)||{})[m], live=lp&&!lp.delayed&&lp.source==='dexscreener'?num(lp.price_sol):null;
  var cost=num(o.cost_sol)||0, entry=num(o.entry_price_sol), mark=num(o.price_sol), pct=null;
  if(live&&entry>0)pct=(live/entry-1)*100;
  else if(live&&mark>0&&num(o.pnl_pct)!=null)pct=((1+o.pnl_pct/100)*live/mark-1)*100;
  if(pct!=null)return {pct:pct,sol:cost*pct/100,live:true};
  return {pct:num(o.pnl_pct),sol:num(o.unreal_sol),live:false};
}
function badgeText(g,wall){
  if(g.kind==='twins')return '\uD83E\uDDE6\uD83E\uDDE6'+(wall?(g.n>2?'\u00D7'+g.n:''):' twins'+(g.n>2?' \u00D7'+g.n:''));
  var a=ago(Date.now()-g.left[0].t);return '\uD83E\uDDE6 '+(wall?a:'left behind '+a+' ago');
}
function label(g){
  var hs=[];for(var b in g.holders)hs.push(nm(b));
  return g.kind==='twins'?'Bag twins: '+hs.join(' and ')+' all hold '+g.sym+'. Paper trades. Show details.':
    'Lonely sock: '+hs[0]+' still holds '+g.sym+', '+nm(g.left[0].book)+' sold it '+ago(Date.now()-g.left[0].t)+' ago. Paper trades. Show details.';
}
function panel(m,g){
  var h='<div class="tw-h"><span>'+(g.kind==='twins'?'\uD83E\uDDE6\uD83E\uDDE6 Bag twins':'\uD83E\uDDE6 Lonely sock')+' \u00B7 <b>$'+E(g.sym)+'</b></span><span class="tw-pp">PAPER</span></div>';
  h+='<div class="tw-sub">'+(g.kind==='twins'?g.n+' traders holding the same coin':'left holding the bag alone')+'</div>';
  g.hold.forEach(function(x){var p=pnl(m,x.o),cls=p.pct==null?'':(p.pct<0?'dn':'up');
    h+='<div class="tw-r" style="--c:'+col(x.book)+'"><i>'+E(nm(x.book))+'</i><span>in '+((num(x.o.cost_sol)||0).toFixed(3))+' SOL</span><b class="'+cls+'">'+fp(p.pct)+'</b><em class="'+cls+'">'+fs(p.sol)+'</em>'+
      '<span class="lq-dot'+(p.live?'':' dl')+'" title="'+(p.live?'live price':'last desk mark')+'"></span></div>';});
  g.left.forEach(function(l){var cls=l.pnl==null?'':(l.pnl<0?'dn':'up');
    h+='<div class="tw-r tw-gone" style="--c:'+col(l.book)+'"><i>'+E(nm(l.book))+'</i><span>sold '+ago(Date.now()-l.t)+' ago'+(l.rule?' \u00B7 '+E(l.rule):'')+'</span><b class="'+cls+'">'+(l.pnl==null?'':fs(l.pnl)+' SOL')+'</b></div>';});
  return h+'<div class="tw-f">Pretend money. Green dot = live price, amber = last desk mark.</div>';
}

var G={}, pop=null, popFor=null, hideT=null, shownAt=0;
function targets(){
  var out=[];
  document.querySelectorAll('#monitor-wall [data-live-mint]').forEach(function(el){if(!el.querySelector('.mw-closed'))out.push({el:el,m:el.getAttribute('data-live-mint'),host:el,wall:true});});
  document.querySelectorAll('#poss .pos[data-mint]').forEach(function(el){out.push({el:el,m:el.getAttribute('data-mint'),host:el.querySelector('.top>span')});});
  document.querySelectorAll('#op .row[data-mint]').forEach(function(el){out.push({el:el,m:el.getAttribute('data-mint'),host:el.querySelector('.m')});});
  document.querySelectorAll('#banks .bn-coin[data-mint]').forEach(function(el){out.push({el:el,m:el.getAttribute('data-mint'),host:el});});
  return out;
}
function decorate(){
  targets().forEach(function(t){
    if(!t.host)return; var g=G[t.m], b=t.host.querySelector(':scope>.tw-b');
    t.el.classList.toggle('tw-on',!!g); if(t.wall)t.el.classList.toggle('tw-twin',!!g&&g.kind==='twins');
    if(!g){if(b)b.remove();return}
    if(!b){b=document.createElement('span');b.setAttribute('role','button');b.tabIndex=0;
      t.host.appendChild(b);}
    b.className='tw-b '+(g.kind==='twins'?'tw-2':'tw-1')+(t.wall?' tw-w':'');
    b._m=t.m; var tx=badgeText(g,t.wall); if(b.textContent!==tx)b.textContent=tx;
    var al=label(g); if(b.getAttribute('aria-label')!==al)b.setAttribute('aria-label',al);
  });
}
function refresh(){
  var d=window.Desk.data; if(!d)return;
  try{G=groups(d);}catch(e){G={};}
  decorate();
  if(pop&&popFor){if(!document.body.contains(popFor)||!G[popFor._m]){hide();}else{pop.innerHTML=panel(popFor._m,G[popFor._m]);place(popFor);}}
}
function place(b){
  var r=b.getBoundingClientRect(), w=pop.offsetWidth, h=pop.offsetHeight, vw=innerWidth, vh=innerHeight;
  var x=Math.max(6,Math.min(vw-w-6,r.left+r.width/2-w/2)), y=r.bottom+8; if(y+h>vh-6)y=Math.max(6,r.top-h-8);
  pop.style.left=x+'px'; pop.style.top=y+'px';
}
function show(b){
  var g=G[b._m]; if(!g)return; clearTimeout(hideT);
  if(!pop){pop=document.createElement('div');pop.id='tw-pop';pop.setAttribute('role','dialog');document.body.appendChild(pop);
    pop.addEventListener('mouseenter',function(){clearTimeout(hideT)});pop.addEventListener('mouseleave',function(){hideT=setTimeout(hide,200)});}
  if(popFor!==b||pop.style.display!=='block')shownAt=Date.now(); popFor=b; pop.innerHTML=panel(b._m,g); pop.setAttribute('aria-label',b.getAttribute('aria-label')||'Bag twins'); pop.style.display='block'; place(b);
}
function hide(){clearTimeout(hideT);if(pop)pop.style.display='none';popFor=null;}
var hover=window.matchMedia&&matchMedia('(hover:hover)').matches;
/* tapping the badge opens the panel instead of the chart link; the rest of the row/screen still opens DexScreener */
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.tw-b');
  if(b){e.preventDefault();e.stopPropagation();if(popFor===b&&pop&&pop.style.display==='block'&&!hover&&Date.now()-shownAt>500)hide();else show(b);return}
  if(pop&&popFor&&!(e.target.closest&&e.target.closest('#tw-pop')))hide();
},true);
document.addEventListener('mouseover',function(e){if(!hover)return;var b=e.target.closest&&e.target.closest('.tw-b');if(b)show(b);});
document.addEventListener('mouseout',function(e){if(!hover)return;var b=e.target.closest&&e.target.closest('.tw-b');if(b&&!(e.relatedTarget&&b.contains(e.relatedTarget)))hideT=setTimeout(hide,200);});
document.addEventListener('focusin',function(e){var b=e.target.closest&&e.target.closest('.tw-b');if(b)show(b);});
document.addEventListener('focusout',function(e){var b=e.target.closest&&e.target.closest('.tw-b');if(b)hideT=setTimeout(hide,200);});
addEventListener('scroll',function(){if(popFor&&pop)place(popFor);},{passive:true});
addEventListener('resize',function(){if(popFor&&pop)place(popFor);});
Desk.on('update',function(){setTimeout(refresh,0)});
addEventListener('desk:live',function(){setTimeout(refresh,0)});
setInterval(function(){if(!document.hidden)refresh()},1000);
window.DeskTwins={groups:function(){return G},refresh:refresh};
})();
