/* fliphold.js : "Flip or Hold?" card on Stats. One dot per closed paper trade (x = how long it was held, log scale;
   y = paper P&L %), colored by book, plus hollow rings for positions still open, and hold-time buckets that show
   whether quick flips or long holds pay better. View only. Uses Desk.data.books[*].trades / closed / open
   (tickers, times, paper sizes and P&L only). */
(function(){
if(!window.Desk||!Desk.on){console.warn('fliphold: Desk API missing');return}
var COL={quanty:'#39ff88',ledger:'#ffb84d',twitter:'#4dc3ff'},ORDER=['quanty','ledger','twitter'];
var hide={},sel=null,pts=[];
var BK=[[0,10,'Under 10m'],[10,60,'10–60m'],[60,240,'1–4h'],[240,1e9,'4h+']];
function E(s){return Desk.utils&&Desk.utils.E?Desk.utils.E(s):String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(v){v=+v;return isFinite(v)?v:0}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function dur(m){if(m<1)return '<1m';if(m<60)return Math.round(m)+'m';var h=m/60;if(h<24)return (h<10?h.toFixed(1).replace(/\.0$/,''):Math.round(h))+'h';return (h/24).toFixed(1).replace(/\.0$/,'')+'d'}
function pc(v){return (v>=0?'+':'')+(Math.abs(v)>=100?Math.round(v):v.toFixed(1))+'%'}
function sg(v){return (v>=0?'+':'')+v.toFixed(4)}
function books(d){var b=d.books||{},out={};ORDER.concat(Object.keys(b)).forEach(function(k){if(b[k]&&!out[k])out[k]=b[k]});
 if(!Object.keys(out).length&&d.closed)out.quanty={closed:d.closed,trades:d.trades||[],open:d.open||[]};return out}
function build(d){var B=books(d),P=[];
 Object.keys(B).forEach(function(k){var tr=(Array.isArray(B[k].trades)?B[k].trades:[]).map(function(r){return{t:Date.parse(r.ts),r:r}}).filter(function(o){return isFinite(o.t)}).sort(function(a,b){return a.t-b.t});
  var cl=(B[k].closed||[]).map(function(c){return{t:Date.parse(c.closed_at||c.ts),c:c}}).filter(function(o){return isFinite(o.t)}).sort(function(a,b){return a.t-b.t});
  var prevClose={};
  cl.forEach(function(o){var c=o.c,m=c.mint||c.symbol,lo=prevClose[m]||-Infinity;prevClose[m]=o.t;
   var buys=tr.filter(function(x){return (x.r.mint||x.r.symbol)===m&&String(x.r.side).toUpperCase()==='BUY'&&x.t<=o.t+1000&&x.t>lo});
   if(!buys.length)return;var cost=0;buys.forEach(function(x){cost+=num(x.r.size_sol)});var p=num(c.pnl_sol);if(!(cost>0))return;
   P.push({k:k,s:c.symbol||'?',m:c.mint||'',hold:Math.max(0.2,(o.t-buys[0].t)/60000),pct:p/cost*100,sol:p,rule:c.rule||'',open:false,at:o.t})});
  (B[k].open||[]).forEach(function(o){var t=Date.parse(o.opened_at);if(!isFinite(t))return;
   P.push({k:k,s:o.symbol||'?',m:o.mint||'',hold:Math.max(0.2,(Date.now()-t)/60000),pct:num(o.pnl_pct),sol:num(o.unreal_sol),rule:'still holding',open:true,at:t})})});
 return P}
var W=640,H=300,L=44,R=14,T=14,Bt=34;
function xs(m,lo,hi){return L+(Math.log10(m)-lo)/(hi-lo)*(W-L-R)}
function ys(v,lo,hi){return T+(hi-v)/(hi-lo)*(H-T-Bt)}
function chart(P){var vis=P.filter(function(p){return !hide[p.k]});
 var mx=Math.max(60,Math.max.apply(null,P.map(function(p){return p.hold}).concat([1]))),mn=Math.min.apply(null,P.map(function(p){return p.hold}).concat([1])),lo=Math.max(-1,Math.floor(Math.log10(mn)*2)/2-0.15),hi=Math.ceil(Math.log10(mx)*2)/2;
 var yv=P.map(function(p){return p.pct}),yhi=Math.max(20,Math.max.apply(null,yv.concat([0]))),ylo=Math.min(-20,Math.min.apply(null,yv.concat([0])));
 yhi=Math.ceil(yhi/10)*10+5;ylo=Math.floor(ylo/10)*10-5;
 var s='<svg class="fh-svg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="Hold time versus paper P&amp;L scatter">';
 s+='<rect x="'+L+'" y="'+T+'" width="'+(W-L-R)+'" height="'+(ys(0,ylo,yhi)-T)+'" fill="rgba(57,255,136,.045)"/><rect x="'+L+'" y="'+ys(0,ylo,yhi)+'" width="'+(W-L-R)+'" height="'+(H-Bt-ys(0,ylo,yhi))+'" fill="rgba(255,92,108,.045)"/>';
 [[0.5,'30s'],[1,'1m'],[5,'5m'],[15,'15m'],[60,'1h'],[240,'4h'],[1440,'1d'],[4320,'3d']].forEach(function(g){if(Math.log10(g[0])>hi||Math.log10(g[0])<lo)return;var x=xs(g[0],lo,hi);
  s+='<line x1="'+x+'" x2="'+x+'" y1="'+T+'" y2="'+(H-Bt)+'" class="fh-g"/><text x="'+x+'" y="'+(H-Bt+15)+'" class="fh-t" text-anchor="middle">'+g[1]+'</text>'});
 var step=(yhi-ylo)>200?50:(yhi-ylo)>80?20:10;
 for(var v=Math.ceil(ylo/step)*step;v<=yhi;v+=step){var y=ys(v,ylo,yhi);s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" class="'+(v===0?'fh-z':'fh-g')+'"/><text x="'+(L-6)+'" y="'+(y+4)+'" class="fh-t" text-anchor="end">'+(v>0?'+':'')+v+'%</text>'}
 s+='<text x="'+((L+W-R)/2)+'" y="'+(H-4)+'" class="fh-ax" text-anchor="middle">time held →</text>';
 vis.slice().sort(function(a,b){return Math.abs(a.pct)-Math.abs(b.pct)}).forEach(function(p){var i=P.indexOf(p),x=xs(p.hold,lo,hi),y=ys(Math.max(ylo,Math.min(yhi,p.pct)),ylo,yhi),c=COL[p.k]||'#b48cff';
  s+='<circle data-i="'+i+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(sel===i?8:6)+'" class="fh-d'+(p.open?' fh-o':'')+(sel===i?' fh-sel':'')+'" style="--c:'+c+'" tabindex="0"><title>'+E(p.s)+'</title></circle>'});
 return s+'</svg>'}
function buckets(P){var vis=P.filter(function(p){return !p.open&&!hide[p.k]}),out=BK.map(function(b){var r={lab:b[2],n:0,w:0,sum:0,sol:0};
  vis.forEach(function(p){if(p.hold>=b[0]&&p.hold<b[1]){r.n++;if(p.sol>0)r.w++;r.sum+=p.pct;r.sol+=p.sol}});r.avg=r.n?r.sum/r.n:0;return r});
 var best=null;out.forEach(function(r){if(r.n&&(!best||r.avg>best.avg))best=r});
 return{rows:out,best:best,n:vis.length}}
function detail(p){if(!p)return '<span class="fh-hint">Tap or hover a dot for that paper trade.</span>';
 return '<b style="color:'+(COL[p.k]||'#b48cff')+'">'+E(cap(p.k))+'</b> · <b>'+E(p.s)+'</b> · '+(p.open?'held '+dur(p.hold)+' so far':'held '+dur(p.hold))+' · <span class="'+(p.pct<0?'dn':'up')+'">'+pc(p.pct)+' ('+sg(p.sol)+' SOL'+(p.open?' unrealized':'')+')</span>'+(p.rule?' · '+E(p.rule):'')+(p.m?' · <a href="https://dexscreener.com/solana/'+encodeURIComponent(p.m)+'" target="_blank" rel="noopener">chart ↗</a>':'')}
function verdict(b){if(!b.n)return 'No closed paper trades yet.';if(b.n<6)return 'Only '+b.n+' closed paper trades so far, too few to call it.';
 var q=b.rows[0].n+b.rows[1].n,l=b.rows[2].n+b.rows[3].n;if(!q||!l)return (q?'Every close so far was a quick flip under an hour.':'Every close so far was held over an hour.');
 var qa=(b.rows[0].sum+b.rows[1].sum)/q,la=(b.rows[2].sum+b.rows[3].sum)/l;
 if(Math.abs(qa-la)<3)return 'Dead heat: quick flips and longer holds average about the same.';
 if(qa<0&&la<0)return (qa>la?'⚡ Both are red on paper, but quick flips under an hour bleed less: '+pc(qa)+' avg vs '+pc(la)+' for longer holds.':'💎 Both are red on paper, but holds over an hour bleed less: '+pc(la)+' avg vs '+pc(qa)+' for quick flips.');
 return (qa>la?'⚡ Flippers are winning: trades closed in under an hour average '+pc(qa)+' vs '+pc(la)+' for longer holds.':'💎 Holders are winning: trades held over an hour average '+pc(la)+' vs '+pc(qa)+' for quick flips.')}
function render(){var d=Desk.data;if(!d)return;var st=document.getElementById('stats');if(!st)return;var box=document.getElementById('fliphold');
 if(!box){box=document.createElement('div');box.id='fliphold';box.className='card';var tc=document.getElementById('tclock');if(tc&&tc.parentNode===st)st.insertBefore(box,tc.nextSibling);else st.appendChild(box);
  box.addEventListener('click',function(e){var t=e.target.closest('[data-fh-k]');if(t){var k=t.getAttribute('data-fh-k');hide[k]=!hide[k];if(sel!=null&&pts[sel]&&hide[pts[sel].k])sel=null;render();return}
   var c=e.target.closest('circle[data-i]');if(c){sel=+c.getAttribute('data-i');render()}});
  box.addEventListener('keydown',function(e){var c=e.target.closest&&e.target.closest('circle[data-i]');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();sel=+c.getAttribute('data-i');render()}});
  box.addEventListener('mouseover',function(e){var c=e.target.closest('circle[data-i]');if(c&&matchMedia('(hover:hover)').matches){var dl=box.querySelector('.fh-dl');if(dl)dl.innerHTML=detail(pts[+c.getAttribute('data-i')])}});
  box.addEventListener('mouseleave',function(){var dl=box.querySelector('.fh-dl');if(dl)dl.innerHTML=detail(sel!=null?pts[sel]:null)})}
 W=Math.max(280,Math.round((box.clientWidth||660)-(innerWidth<600?28:40)));H=W<500?250:300;L=W<500?40:44;
 pts=build(d);if(sel!=null&&!pts[sel])sel=null;var b=buckets(pts),ks=ORDER.filter(function(k){return pts.some(function(p){return p.k===k})});
 var tog=ks.map(function(k){var n=pts.filter(function(p){return p.k===k&&!p.open}).length;return '<button type="button" data-fh-k="'+k+'" class="'+(hide[k]?'':'on')+'" style="--c:'+COL[k]+'" aria-pressed="'+(!hide[k])+'"><i></i>'+E(cap(k))+' <small>'+n+'</small></button>'}).join('');
 var bmax=Math.max.apply(null,b.rows.map(function(r){return Math.abs(r.avg)}).concat([1]));
 var bars=b.rows.map(function(r){var w=r.n?Math.max(4,Math.abs(r.avg)/bmax*50):0;return '<div class="fh-b'+(b.best===r&&r.n?' fh-best':'')+'"><span class="fh-bl">'+r.lab+'</span><span class="fh-bt"><span class="fh-bm"></span>'+(r.n?'<span class="fh-bf '+(r.avg<0?'dn':'up')+'" style="width:'+w.toFixed(1)+'%"></span>':'')+'</span><span class="fh-bv">'+(r.n?'<b class="'+(r.avg<0?'dn':'up')+'">'+pc(r.avg)+'</b> avg · '+r.n+' trade'+(r.n===1?'':'s')+' · '+Math.round(r.w/r.n*100)+'% won':'<span class="fh-hint">none yet</span>')+'</span></div>'}).join('');
 box.innerHTML='<div class="fh-top"><div><div class="k">⚡💎 Flip or Hold?</div><p class="fh-sub">Does it pay to flip fast or sit on a bag? One dot per closed paper trade: how long it was held (left to right) against how it ended (up = paper profit). Hollow rings are coins still being held.</p></div>'+
  '<div class="fh-tg" role="group" aria-label="Show books">'+tog+'</div></div>'+
  '<div class="fh-plot">'+chart(pts)+'</div><div class="fh-dl" aria-live="polite">'+detail(sel!=null?pts[sel]:null)+'</div>'+
  '<div class="fh-v">'+verdict(b)+'</div><div class="fh-bs">'+bars+'</div>'+
  '<p class="fh-ft">Paper trading only: pretend money, not advice. Based on the recent trades in each book\'s public log.</p>'}
Desk.on('update',function(){setTimeout(render,0)});
setInterval(function(){if(document.visibilityState==='visible'&&document.getElementById('fliphold'))render()},60000);
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(document.getElementById('fliphold'))render()},200)});
})();
