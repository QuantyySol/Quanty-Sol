/* tradeclock.js : "Trade Clock" card on Stats. A 24-hour heatmap (visitor's local time) of when each paper book
   closes its trades and how those hours paid, plus golden/cursed hour and each book's current streak.
   View only. Uses Desk.data.books[*].closed / trades only (tickers + times + paper P&L). */
(function(){
if(!window.Desk||!Desk.on){console.warn('tradeclock: Desk API missing');return}
var COL={quanty:'#39ff88',ledger:'#ffb84d',twitter:'#4dc3ff'},ORDER=['quanty','ledger','twitter'];
var mode='pnl',sel=null,last=null,wasSplit=null;
function E(s){return Desk.utils&&Desk.utils.E?Desk.utils.E(s):String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(v){v=+v;return isFinite(v)?v:0}
function sg(v){return (v>=0?'+':'')+v.toFixed(4)}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function hr(h){return (h<10?'0':'')+h+':00'}
function books(d){var b=d.books||{},ks=Object.keys(b);if(!ks.length&&d.closed)return{quanty:{closed:d.closed,trades:d.trades||[]}};
 var out={};ORDER.concat(ks).forEach(function(k){if(b[k]&&!out[k])out[k]=b[k]});
 if(out.quanty&&!(out.quanty.closed||[]).length&&(d.closed||[]).length)out.quanty=Object.assign({},out.quanty,{closed:d.closed});return out}
function build(d){var B=books(d),rows=[],all=[];for(var h=0;h<24;h++)all.push({pnl:0,n:0,w:0,l:0,act:0});
 Object.keys(B).forEach(function(k){var cells=[];for(var h=0;h<24;h++)cells.push({pnl:0,n:0,w:0,l:0,act:0,best:null});
  (B[k].closed||[]).forEach(function(c){var t=Date.parse(c.closed_at||c.ts);if(!isFinite(t))return;var h=new Date(t).getHours(),p=num(c.pnl_sol),x=cells[h];
   x.pnl+=p;x.n++;if(p>0)x.w++;else x.l++;if(!x.best||Math.abs(p)>Math.abs(x.best.p))x.best={s:c.symbol||'?',p:p};
   all[h].pnl+=p;all[h].n++;if(p>0)all[h].w++;else all[h].l++});
  (Array.isArray(B[k].trades)?B[k].trades:[]).forEach(function(r){var t=Date.parse(r.ts);if(!isFinite(t))return;var h=new Date(t).getHours();cells[h].act++;all[h].act++});
  /* streak: closed list newest first (sort to be safe) */
  var cl=(B[k].closed||[]).slice().sort(function(a,b){return Date.parse(b.closed_at||b.ts||0)-Date.parse(a.closed_at||a.ts||0)}),st=0,dir=0;
  for(var i=0;i<cl.length;i++){var s=num(cl[i].pnl_sol)>0?1:-1;if(!dir)dir=s;if(s!==dir)break;st++}
  rows.push({k:k,cells:cells,streak:st,dir:dir,n:cl.length})});
 return{rows:rows,all:all}}
function color(x,max,amax,c){
 if(mode==='act'){if(!x.act)return '';var a=.18+.82*Math.min(1,x.act/amax);return 'background:color-mix(in srgb,'+c+' '+Math.round(a*100)+'%,#0d1214)'}
 if(!x.n)return '';var a=.22+.78*Math.min(1,Math.abs(x.pnl)/max);return 'background:'+(x.pnl>=0?'rgba(57,255,136,':'rgba(255,92,108,')+a.toFixed(2)+')'}
function detail(r,h){if(!last)return '';var x=r==='all'?last.all[h]:null,nm='All books';
 if(r!=='all'){var R=last.rows.filter(function(o){return o.k===r})[0];if(!R)return '';x=R.cells[h];nm=cap(r)}
 var span=hr(h)+'–'+hr((h+1)%24);
 if(!x.n&&!x.act)return '<b>'+E(nm)+' · '+span+'</b> · quiet hour, no paper trades yet';
 var s='<b>'+E(nm)+' · '+span+'</b> · '+x.act+' trade'+(x.act===1?'':'s')+' · '+x.n+' closed ('+x.w+'W '+x.l+'L)';
 if(x.n)s+=' · <span class="'+(x.pnl<0?'dn':'up')+'">'+sg(x.pnl)+' SOL</span> paper';
 if(x.best)s+=' · biggest: '+E(x.best.s)+' <span class="'+(x.best.p<0?'dn':'up')+'">'+sg(x.best.p)+'</span>';
 return s}
function render(){var d=Desk.data;if(!d)return;var st=document.getElementById('stats');if(!st)return;
 var box=document.getElementById('tclock');
 if(!box){box=document.createElement('div');box.id='tclock';box.className='card';st.appendChild(box);
  box.addEventListener('click',function(e){var m=e.target.closest('[data-tc-mode]');if(m){mode=m.getAttribute('data-tc-mode');render();return}
   var c=e.target.closest('.tc-cell[data-h]');if(c){sel={r:c.getAttribute('data-r'),h:+c.getAttribute('data-h')};paintSel()}});
  box.addEventListener('mouseover',function(e){var c=e.target.closest('.tc-cell[data-h]');if(c&&matchMedia('(hover:hover)').matches){var dl=box.querySelector('.tc-dl');if(dl)dl.innerHTML=detail(c.getAttribute('data-r'),+c.getAttribute('data-h'))}});
  box.addEventListener('mouseleave',function(){paintSel()});
}
 last=build(d);var now=new Date().getHours(),max=0,amax=0;
 last.rows.forEach(function(r){r.cells.forEach(function(x){if(x.n)max=Math.max(max,Math.abs(x.pnl));amax=Math.max(amax,x.act)})});
 var amaxAll=0,maxAll=0;last.all.forEach(function(x){if(x.n)maxAll=Math.max(maxAll,Math.abs(x.pnl));amaxAll=Math.max(amaxAll,x.act)});
 max=max||1;amax=amax||1;maxAll=maxAll||1;amaxAll=amaxAll||1;
 var split=innerWidth<600,parts=split?[[0,12],[12,24]]:[[0,24]];wasSplit=split;
 function head(a,b){var s='<div class="tc-row tc-hd"><span class="tc-lb">'+(split?(a?'PM':'AM'):'')+'</span>';for(var h=a;h<b;h++)s+='<span class="tc-hl'+(h===now?' tc-now':'')+'">'+(h%3===0?h:'')+'</span>';return s+'</div>'}
 function row(k,cells,c,mx,amx,lab,a,b){var s='<div class="tc-row"><span class="tc-lb" style="color:'+c+'">'+lab+'</span>';
  for(var h=a;h<b;h++){var x=cells[h],stl=color(x,mx,amx,c);
   s+='<button type="button" class="tc-cell'+(h===now?' tc-now':'')+((mode==='pnl'?x.n:x.act)?'':' tc-0')+'" data-r="'+k+'" data-h="'+h+'" style="'+stl+'" aria-label="'+E(lab)+' '+hr(h)+'"></button>'}
  return s+'</div>'}
 var body=parts.map(function(pt){return '<div class="tc-blk" style="--n:'+(pt[1]-pt[0])+'">'+head(pt[0],pt[1])+last.rows.map(function(r){return row(r.k,r.cells,COL[r.k]||'#b48cff',max,amax,E(cap(r.k)),pt[0],pt[1])}).join('')+row('all',last.all,'#eef6f2',maxAll,amaxAll,'All',pt[0],pt[1])+'</div>'}).join('');
 /* golden / cursed hour across all books */
 var best=null,worst=null;last.all.forEach(function(x,h){if(!x.n)return;if(!best||x.pnl>last.all[best].pnl)best=h;if(worst==null||x.pnl<last.all[worst].pnl)worst=h});
 var busy=null;last.all.forEach(function(x,h){if(x.act&&(busy==null||x.act>last.all[busy].act))busy=h});
 function chip(ic,t,h,cls){if(h==null)return '';var x=last.all[h];return '<div class="tc-chip"><span class="tc-ic">'+ic+'</span><div><i>'+t+'</i><b>'+hr(h)+'</b><em class="'+cls+'">'+
  (t==='Busiest hour'?x.act+' trades':sg(x.pnl)+' SOL · '+x.w+'W '+x.l+'L')+'</em></div></div>'}
 var chips=chip('🌞','Golden hour',best!=null&&last.all[best].pnl>0?best:null,'up')+chip('🌚','Cursed hour',worst!=null&&last.all[worst].pnl<0?worst:null,'dn')+chip('⚡','Busiest hour',busy,'');
 var streaks=last.rows.map(function(r){var c=COL[r.k]||'#b48cff',t;
  if(!r.n)t='no closes yet';else if(r.dir>0)t=(r.streak>=3?'🔥 ':'')+r.streak+' win'+(r.streak===1?'':'s')+' in a row';else t=(r.streak>=3?'🧊 ':'')+r.streak+' loss'+(r.streak===1?'':'es')+' in a row';
  return '<span class="tc-st" style="--c:'+c+'"><b>'+E(cap(r.k))+'</b> '+t+'</span>'}).join('');
 var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
 box.innerHTML='<div class="tc-top"><div><div class="k">⏰ Trade Clock</div><p class="tc-sub">When do the paper trades pay? Each square is one hour of the day in your local time'+(tz?' ('+E(tz)+')':'')+', since the bank reset. Now = outlined column.</p></div>'+
  '<div class="tc-tg" role="group" aria-label="Color by"><button type="button" data-tc-mode="pnl" class="'+(mode==='pnl'?'on':'')+'">Paper P&amp;L</button><button type="button" data-tc-mode="act" class="'+(mode==='act'?'on':'')+'">Activity</button></div></div>'+
  '<div class="tc-grid'+(split?' tc-split':'')+'">'+body+'</div>'+
  '<div class="tc-lg">'+(mode==='pnl'?'<span><i style="background:rgba(57,255,136,.9)"></i>paid</span><span><i style="background:rgba(255,92,108,.9)"></i>lost</span><span><i class="tc-e"></i>no closes</span>':'<span><i style="background:linear-gradient(90deg,#1d3a2b,#39ff88)"></i>brighter = more trades</span><span><i class="tc-e"></i>quiet</span>')+'</div>'+
  '<div class="tc-dl" aria-live="polite"></div>'+
  '<div class="tc-chips">'+chips+'</div><div class="tc-sts"><span class="tc-stk">Current streak</span>'+streaks+'</div>'+
  '<p class="tc-ft">Paper trading only: pretend money, not advice. Past hours do not predict future ones.</p>';
 paintSel()}
function paintSel(){var box=document.getElementById('tclock');if(!box)return;var dl=box.querySelector('.tc-dl');
 box.querySelectorAll('.tc-cell.tc-sel').forEach(function(c){c.classList.remove('tc-sel')});
 if(!sel){if(dl)dl.innerHTML='<span class="tc-hint">Tap or hover a square for that hour\'s paper trades.</span>';return}
 var c=box.querySelector('.tc-cell[data-r="'+sel.r+'"][data-h="'+sel.h+'"]');if(c)c.classList.add('tc-sel');if(dl)dl.innerHTML=detail(sel.r,sel.h)}
Desk.on('update',function(){setTimeout(render,0)});
window.addEventListener('resize',function(){if(wasSplit!==null&&(innerWidth<600)!==wasSplit)render()});
setInterval(function(){if(document.visibilityState==='visible'&&document.getElementById('tclock'))render()},60000);
})();
