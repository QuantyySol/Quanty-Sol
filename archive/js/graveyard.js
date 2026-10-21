/* graveyard.js : the Bag Graveyard page. Every losing PAPER trade from the three desk books gets a little
   headstone (ticker, trader, paper loss, cause of death); the best paper win gets a trophy. View only:
   reads Desk.data / desk.json, sends nothing anywhere. Click a headstone to open the coin's chart. */
(function(){
'use strict';
var WHO={quanty:{n:'Quanty',c:'#39ff88'},ledger:{n:'Ledger',c:'#ffbf3f'},twitter:{n:'Twitter',c:'#5cc8ff'}};
var EP=['Aped in. Faded out.','Died doing what it loved: going down.','Gone, but the chart remembers.','It was early. Then it was late.',
 'Here lies a 100x that never was.','Diamond hands, paper ending.','Rest in pumps.','Bought the top, kept the lesson.',
 'Volume left first. We followed.','"This one is different," it said.','Survived the rug check. Not the market.','Fees were the real winner.'];
var CAUSE={'stop loss':'Hit the stop loss','dying pre initials':'Volume flatlined','time stop':'Ran out of time','trail':'Trailing stop caught it','trailing stop':'Trailing stop caught it'};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function h(s){var x=0;s=String(s);for(var i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))|0;return Math.abs(x)}
function DX(m){return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(m||'')?'https://dexscreener.com/solana/'+m:null}
function day(s){try{return s?new Date(s).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):''}catch(e){return ''}}
function cause(r){r=String(r||'sold').replace(/_/g,' ').toLowerCase();return CAUSE[r]||(r.charAt(0).toUpperCase()+r.slice(1))}
function rows(d){var out=[],books=(d&&d.books)||{};
 Object.keys(WHO).forEach(function(k){var b=books[k];var c=(b&&b.closed)||(k==='quanty'?(d.closed||[]):k==='ledger'?((d.ledger_book||{}).closed||[]):[]);
  (c||[]).forEach(function(t){if(t&&t.pnl_sol!=null&&isFinite(+t.pnl_sol))out.push({who:k,sym:t.symbol||'???',mint:t.mint,at:t.closed_at,rule:t.rule,pnl:+t.pnl_sol,st:t.strategy})})});
 return out}
var sec,last='';
function ensure(){if(sec)return sec;sec=document.getElementById('graveyard');return sec}
function render(d){if(!ensure()||!d)return;var r=rows(d),dead=r.filter(function(x){return x.pnl<0}).sort(function(a,b){return String(b.at).localeCompare(String(a.at))}),
 wins=r.filter(function(x){return x.pnl>0}).sort(function(a,b){return b.pnl-a.pnl});
 var sig=JSON.stringify([dead.map(function(x){return x.sym+x.at}),wins.slice(0,1).map(function(x){return x.sym+x.pnl})]);if(sig===last)return;last=sig;
 var lost=dead.reduce(function(s,x){return s+x.pnl},0),by={};dead.forEach(function(x){by[x.who]=(by[x.who]||0)+1});
 var top=Object.keys(by).sort(function(a,b){return by[b]-by[a]})[0];
 var sum=document.getElementById('gy-sum');if(sum)sum.innerHTML=dead.length?('<b>'+dead.length+'</b> paper bag'+(dead.length===1?'':'s')+' buried · <b class="dn">'+lost.toFixed(4)+' SOL</b> of pretend money lost'+(top?' · most plots: <b style="color:'+WHO[top].c+'">'+WHO[top].n+'</b>':'')):'No paper losses yet. The groundskeeper is bored.';
 var tr=document.getElementById('gy-trophy'),w=wins[0];
 if(tr)tr.innerHTML=w?('<span class="gy-cup" aria-hidden="true">🏆</span><div><div class="k">Hall of Fame · best paper win</div><b>$'+E(String(w.sym).toUpperCase())+'</b> <span class="up">+'+w.pnl.toFixed(4)+' SOL</span> · <span style="color:'+WHO[w.who].c+'">'+WHO[w.who].n+'</span></div>'):'<span class="gy-cup" aria-hidden="true">🏆</span><div><div class="k">Hall of Fame</div>Still waiting for the first paper win to frame.</div>';
 var g=document.getElementById('gy-plots');if(!g)return;
 g.innerHTML=dead.length?dead.slice(0,60).map(function(x){var u=DX(x.mint),tg=u?'a':'div',W=WHO[x.who],hh=h(x.sym+x.at);
  return '<'+tg+' class="gy-stone" style="--tilt:'+((hh%7)-3)+'deg;--who:'+W.c+'"'+(u?' href="'+u+'" target="_blank" rel="noopener" title="Open $'+E(x.sym)+' chart"':'')+'>'+
   '<div class="gy-rip">R.I.P.</div><div class="gy-sym">$'+E(String(x.sym).toUpperCase())+'</div>'+
   '<div class="gy-loss">'+x.pnl.toFixed(4)+' SOL</div><div class="gy-cause">'+E(cause(x.rule))+'</div>'+
   '<div class="gy-ep">'+E(EP[hh%EP.length])+'</div><div class="gy-by">'+E(W.n)+(x.st==='premig'?' · premig':'')+' · '+E(day(x.at))+'</div></'+tg+'>'}).join('')
  :'<div class="gy-empty">🌱 Fresh grass. Nobody has lost a paper trade yet.</div>'}
function boot(){if(window.Desk&&Desk.on){Desk.on('update',function(d){setTimeout(function(){render(d||Desk.data)},0)})}
 else fetch('../desk.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(render).catch(function(){})}
window.addEventListener('desk:live',function(){if(window.Desk&&Desk.data)setTimeout(function(){render(Desk.data)},0)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
