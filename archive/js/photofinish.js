/* photofinish.js : "Photo finish" stamps. Any closed PAPER trade that ended within ~0.0015 SOL of breakeven gets a
   📸 PHOTO FINISH stamp on its Bag Graveyard headstone, and the Graveyard page gets a small "Photo finish booth"
   card with a per-book counter and the closest calls. View only: reads Desk.data / desk.json (tickers, times,
   paper P&L only), sends nothing anywhere. */
(function(){
'use strict';
var TH=0.0015,WHO={quanty:{n:'Quanty',c:'#39ff88'},ledger:{n:'Ledger',c:'#ffbf3f'},twitter:{n:'Twitter',c:'#5cc8ff'}};
var CAP=['Too close to call.','Decided by a whisker.','Breakeven, basically.','The fees took the photo.','Nose-to-nose at the line.','Enhance… enhance… still a tie.'];
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function h(s){var x=0;s=String(s);for(var i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))|0;return Math.abs(x)}
function DX(m){return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(m||'')?'https://dexscreener.com/solana/'+m:null}
function day(s){try{return s?new Date(s).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):''}catch(e){return ''}}
function rows(d){var out=[],books=(d&&d.books)||{};
 Object.keys(WHO).forEach(function(k){var b=books[k];var c=(b&&b.closed)||(k==='quanty'?(d.closed||[]):k==='ledger'?((d.ledger_book||{}).closed||[]):[]);
  (c||[]).forEach(function(t){var p=t&&+t.pnl_sol;if(t&&t.pnl_sol!=null&&isFinite(p)&&Math.abs(p)<=TH)out.push({who:k,sym:String(t.symbol||'???'),mint:t.mint,at:t.closed_at,pnl:p})})});
 return out.sort(function(a,b){return Math.abs(a.pnl)-Math.abs(b.pnl)})}
var card,lastSig='',close=[];
function ensureCard(){if(card&&document.body.contains(card))return card;var top=document.querySelector('#graveyard .gy-top');if(!top)return null;
 card=document.createElement('div');card.className='card pf-booth';card.id='pf-booth';top.appendChild(card);return card}
function sg(v){return (v>=0?'+':'')+v.toFixed(4)}
function renderCard(){var c=ensureCard();if(!c)return;var by={};Object.keys(WHO).forEach(function(k){by[k]=0});close.forEach(function(x){by[x.who]++});
 var chips=Object.keys(WHO).map(function(k){return '<span class="pf-cnt" style="--who:'+WHO[k].c+'"><b>'+by[k]+'</b> '+WHO[k].n+'</span>'}).join('');
 var list=close.slice(0,4).map(function(x){var u=DX(x.mint),tg=u?'a':'span';return '<'+tg+' class="pf-row"'+(u?' href="'+u+'" target="_blank" rel="noopener"':'')+' style="--who:'+WHO[x.who].c+'"><span class="pf-sym">$'+E(x.sym.toUpperCase())+'</span><span class="'+(x.pnl>=0?'up':'dn')+'">'+sg(x.pnl)+' SOL</span><span class="pf-w">'+WHO[x.who].n+'</span></'+tg+'>'}).join('');
 c.innerHTML='<div class="k"><span aria-hidden="true">📸</span> Photo finish booth</div>'+
  '<p class="pf-lead">'+(close.length?('<b>'+close.length+'</b> paper close'+(close.length===1?'':'s')+' landed within '+TH+' SOL of breakeven.'):'No photo finishes yet. Every paper close so far was a clear win or loss.')+'</p>'+
  '<div class="pf-cnts">'+chips+'</div>'+(list?'<div class="pf-list">'+list+'</div>':'')}
function stamp(){var g=document.getElementById('gy-plots');if(!g)return;
 var stones=g.querySelectorAll('.gy-stone');for(var i=0;i<stones.length;i++){var s=stones[i];if(s.querySelector('.pf-stamp'))continue;
  var sym=(s.querySelector('.gy-sym')||{}).textContent||'',loss=((s.querySelector('.gy-loss')||{}).textContent||'').replace(/\s*SOL\s*$/,'');
  for(var j=0;j<close.length;j++){var x=close[j];if(x.pnl<0&&('$'+x.sym.toUpperCase())===sym&&x.pnl.toFixed(4)===loss){
   s.classList.add('pf-hit');var st=document.createElement('div');st.className='pf-stamp';st.setAttribute('aria-label','Photo finish: closed within '+TH+' SOL of breakeven');
   st.innerHTML='<span aria-hidden="true">📸</span> PHOTO FINISH';s.insertBefore(st,s.firstChild);
   var ep=s.querySelector('.gy-ep');if(ep)ep.textContent=CAP[h(x.sym+x.at)%CAP.length];
   s.title=(s.title?s.title+' · ':'')+'Photo finish: '+sg(x.pnl)+' SOL ('+day(x.at)+')';break}}}}
function render(d){if(!d)return;close=rows(d);var sig=JSON.stringify(close.map(function(x){return x.who+x.sym+x.at}));
 if(sig!==lastSig||!document.getElementById('pf-booth')){lastSig=sig;renderCard()}stamp()}
function boot(){var g=document.getElementById('gy-plots');if(g&&window.MutationObserver)new MutationObserver(function(){stamp()}).observe(g,{childList:true});
 if(window.Desk&&Desk.on){Desk.on('update',function(d){setTimeout(function(){render(d||Desk.data)},5)});if(Desk.data)render(Desk.data)}
 else fetch('../desk.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(render).catch(function(){})}
window.addEventListener('desk:live',function(){if(window.Desk&&Desk.data)setTimeout(function(){render(Desk.data)},5)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
