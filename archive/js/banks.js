/* banks.js : every trader shows its OWN paper bank (start, current, P&L) from the real data. View only, nothing invented. */
(function(){
if(!window.Desk){console.warn('banks: Desk API missing');return}
var COL={quanty:'#39ff88',ledger:'#ffb84d',twitter:'#4dc3ff'};
function n(v){v=+v;return isFinite(v)&&v!==null?v:null}
function E(s){return Desk.utils&&Desk.utils.E?Desk.utils.E(s):String(s)}
function f4(v){return v==null?'n/a':v.toFixed(4)}
function sg(v,d){return v==null?'n/a':(v>=0?'+':'')+v.toFixed(d)}
/* list(): one entry per book in desk.json books{}; live marks override when present. Missing fields stay null. */
function list(){var d=Desk.data||{},b=d.books||{},lv=(Desk.live&&Desk.live.books)||{},out=[];
 Object.keys(b).forEach(function(k){var s=b[k]||{},l=lv[k]||{};
  var start=n(s.start_sol),bank=n(l.bank)!=null?n(l.bank):n(s.bank_sol);
  var pnl=n(l.pnl_sol)!=null?n(l.pnl_sol):(n(s.pnl_sol)!=null?n(s.pnl_sol):(bank!=null&&start!=null?bank-start:null));
  var pct=n(l.pnl_pct)!=null?n(l.pnl_pct):(pnl!=null&&start?pnl/start*100:null);
  out.push({open:(s.open||[]),name:k,col:COL[k]||'#b48cff',start:start,bank:bank,pnl:pnl,pct:pct,live:n(l.bank)!=null&&!l.delayed})});
 return out}
window.DeskBanks={list:list};
function card(x){return '<div class="bn-c" style="--c:'+x.col+'"><div class="bn-n">'+E(x.name.toUpperCase())+'<span class="bn-pp">PAPER</span></div>'+
 '<div class="bn-r"><i>Start</i><b>'+f4(x.start)+' SOL</b></div><div class="bn-r"><i>Bank</i><b>'+f4(x.bank)+' SOL</b></div>'+
 '<div class="bn-r"><i>P&amp;L</i><b class="'+(x.pnl<0?'dn':'up')+'">'+sg(x.pnl,4)+' SOL ('+sg(x.pct,1)+'%)</b></div>'+openList(x)+'</div>'}
function openList(x){var lp=(Desk.live&&Desk.live.positions)||{},R=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/;if(!x.open.length)return '<div class="bn-r"><i>Open</i><b>none</b></div>';
 return '<div class="bn-o">'+x.open.map(function(o){var m=R.test(o.mint||'')?o.mint:null,p=lp[o.mint],pc=p&&p.book===x.name&&p.pnl_pct!=null?p.pnl_pct:o.pnl_pct,t=E(o.symbol||'?')+(pc!=null?' <em class="'+(pc<0?'dn':'up')+'">'+sg(+pc,1)+'%</em>':'');
  return m?'<a class="cl-coin bn-coin" data-mint="'+m+'" href="https://dexscreener.com/solana/'+m+'" target="_blank" rel="noopener" title="Open on DexScreener">'+t+' ↗</a>':'<span class="bn-coin">'+t+'</span>'}).join('')+'</div>'}
function render(){var L=list();if(!L.length)return;
 /* Stats page: separate bank per trader */
 var st=document.getElementById('stats');if(st){var box=document.getElementById('banks');
  if(!box){box=document.createElement('div');box.id='banks';var a=document.getElementById('books')||st.querySelector('p.sub');(a||st.firstChild).after(box)}
  box.innerHTML='<div class="bn-h">Paper banks · each trader has its own separate bank</div><div class="bn-g">'+L.map(card).join('')+'</div>';
  var sub=st.querySelector('p.sub'),starts=L.map(function(x){return x.start}).filter(function(v){return v!=null});
  if(sub&&starts.length){var same=starts.every(function(v){return v===starts[0]});
   sub.textContent=same?'Each trader starts with its own separate '+starts[0]+' SOL paper bank (pretend money).':'Each trader has its own separate paper bank (pretend money).'}
  var sgc=document.getElementById('sg');if(sgc&&!document.getElementById('bn-sgl')){var h=document.createElement('div');h.id='bn-sgl';h.className='bn-h';h.textContent='Quanty book · trade stats';sgc.before(h)}}
 /* Office ticker: the single "Bank" figure is Quanty's book, so say so, and add the other banks */
 var bk=document.getElementById('bank');if(bk&&bk.parentNode&&bk.parentNode.firstChild.nodeType===3)bk.parentNode.firstChild.nodeValue='Quanty bank ';
 var pn=document.getElementById('pnl');if(pn&&pn.parentNode&&pn.parentNode.firstChild.nodeType===3)pn.parentNode.firstChild.nodeValue='Quanty P&L ';
 var tk=document.querySelector('.stage .ticker');if(tk){var s=document.getElementById('bn-tk');if(!s){s=document.createElement('span');s.id='bn-tk';tk.appendChild(s)}
  s.innerHTML=L.map(function(x){return '<span class="bn-t" style="--c:'+x.col+'">'+E(x.name[0].toUpperCase()+x.name.slice(1))+' <b>'+f4(x.bank)+'</b> <em class="'+(x.pnl<0?'dn':'up')+'">'+sg(x.pct,1)+'%</em></span>'}).join('')}}
Desk.on('update',function(){setTimeout(render,0)});
window.addEventListener('desk:live',function(){setTimeout(render,0)});
render();
})();
