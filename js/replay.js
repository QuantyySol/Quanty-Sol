/* replay.js : "Desk Replay" card on Stats. Replays the recent paper session as a timelapse: each book's paper bank
   line draws itself in, and trade chips pop in at their buy/sell times. Scrubber + play/pause + speed toggle.
   View only. Uses Desk.data.books[*].bank_history and trades[] (tickers, times, paper sizes and P&L only). */
(function(){
if(!window.Desk||!Desk.on){console.warn('replay: Desk API missing');return}
var COL={quanty:'#39ff88',ledger:'#ffb84d',twitter:'#4dc3ff'},ORDER=['quanty','ledger','twitter'];
var SPEEDS=[[60,'1m/s'],[600,'10m/s'],[3600,'1h/s']],speed=600,playing=false,frac=1,lastTs=0,raf=0,seen=-1;
var M=null,box=null,W=640,H=260,L=46,R=12,T=12,Bt=26;
function E(s){return Desk.utils&&Desk.utils.E?Desk.utils.E(s):String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(v){v=+v;return isFinite(v)?v:0}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function hm(t){var d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function pc(v){return (v>=0?'+':'')+(Math.abs(v)>=100?Math.round(v):v.toFixed(1))+'%'}
function dur(ms){var m=Math.round(ms/60000);return m<60?m+'m':Math.floor(m/60)+'h '+(m%60)+'m'}
function model(d){var b=d.books||{},ks=ORDER.concat(Object.keys(b)).filter(function(k,i,a){return b[k]&&a.indexOf(k)===i});
 var lines={},ev=[],t0=Infinity,t1=-Infinity,lo=Infinity,hi=-Infinity,now=Date.now();
 ks.forEach(function(k){var h=(Array.isArray(b[k].bank_history)?b[k].bank_history:[]).map(function(p){return[Date.parse(p[0]),num(p[1])]}).filter(function(p){return isFinite(p[0])&&p[1]>0&&p[0]>now-36*3600e3}).sort(function(a,c){return a[0]-c[0]});
  if(h.length<2)return;
  /* Before the first bank snapshot, rebuild the bank backwards from realized paper P&L of that book's closes (drawn dashed). */
  var tr=(b[k].trades||[]).map(function(r){return{t:Date.parse(r.ts),p:r.pnl_sol}}).filter(function(o){return isFinite(o.t)&&o.t<h[0][0]&&o.t>now-24*3600e3}).sort(function(a,c){return a.t-c.t}),rc=[];
  if(tr.length){var v=h[0][1];for(var i=tr.length-1;i>=0;i--){if(tr[i].p!=null){rc.unshift([tr[i].t,v]);v-=num(tr[i].p)}}rc.unshift([tr[0].t-60000,v])}
  var pts=rc.concat(h);lines[k]={pts:pts,rc:rc.length,start:num(b[k].start_sol)||h[0][1]};t0=Math.min(t0,pts[0][0]);t1=Math.max(t1,h[h.length-1][0]);
  pts.forEach(function(p){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1])})});
 if(!isFinite(t0)||t1-t0<60000)return null;
 ks.forEach(function(k){if(!lines[k])return;(b[k].trades||[]).forEach(function(r){var t=Date.parse(r.ts);if(!isFinite(t)||t<t0||t>t1)return;
  var sd=String(r.side||'').toUpperCase();ev.push({k:k,t:t,side:sd,buy:sd==='BUY',s:r.symbol||'?',m:r.mint||'',sz:num(r.size_sol),pct:r.pnl_pct==null?null:num(r.pnl_pct),sol:r.pnl_sol==null?null:num(r.pnl_sol)})})});
 ev.sort(function(a,c){return a.t-c.t});var pad=Math.max(0.05,(hi-lo)*0.08);
 return{ks:ks.filter(function(k){return lines[k]}),lines:lines,ev:ev,t0:t0,t1:t1,lo:Math.max(0,lo-pad),hi:hi+pad}}
function X(t){return L+(t-M.t0)/(M.t1-M.t0)*(W-L-R)}
function Y(v){return T+(M.hi-v)/(M.hi-M.lo)*(H-T-Bt)}
function at(k,t){var p=M.lines[k].pts,v=null;for(var i=0;i<p.length&&p[i][0]<=t;i++)v=p[i][1];return v}
function path(k,re){var ln=M.lines[k],p=re?ln.pts.slice(0,ln.rc+1):ln.pts.slice(ln.rc),s='';if(p.length<2&&re)return '';p.forEach(function(q,i){var x=X(q[0]).toFixed(1),y=Y(q[1]).toFixed(1);s+=(i?'H'+x+'V'+y:'M'+x+','+y)});return s}
function svg(){var s='<svg class="rp-svg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="Paper bank replay chart"><defs><clipPath id="rp-clip"><rect id="rp-cr" x="0" y="0" width="'+W+'" height="'+H+'"/></clipPath></defs>';
 var span=M.t1-M.t0,st=[15,30,60,120,180,360,720].map(function(m){return m*60000}).filter(function(m){return span/m<=(W<500?4:7)})[0]||1440*60000;
 for(var t=Math.ceil(M.t0/st)*st;t<=M.t1;t+=st){var x=X(t);s+='<line x1="'+x+'" x2="'+x+'" y1="'+T+'" y2="'+(H-Bt)+'" class="rp-g"/><text x="'+x+'" y="'+(H-Bt+15)+'" class="rp-t" text-anchor="middle">'+hm(t)+'</text>'}
 var ys=(M.hi-M.lo)>6?2:(M.hi-M.lo)>2.5?1:0.5;for(var v=Math.ceil(M.lo/ys)*ys;v<=M.hi;v+=ys){var y=Y(v);s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" class="rp-g"/><text x="'+(L-6)+'" y="'+(y+4)+'" class="rp-t" text-anchor="end">'+(+v.toFixed(1))+'</text>'}
 M.ks.forEach(function(k){var y=Y(M.lines[k].start);if(y>T&&y<H-Bt)s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" class="rp-st" style="--c:'+COL[k]+'"/>'});
 M.ks.forEach(function(k){var d=path(k),r=path(k,1),c=COL[k]||'#b48cff';s+='<path d="'+d+'" class="rp-gh" style="--c:'+c+'"/><path d="'+d+'" class="rp-ln" style="--c:'+c+'" clip-path="url(#rp-clip)"/>'+
  (r?'<path d="'+r+'" class="rp-gh rp-re" style="--c:'+c+'"/><path d="'+r+'" class="rp-ln rp-re" style="--c:'+c+'" clip-path="url(#rp-clip)"/>':'')});
 M.ev.forEach(function(e,i){var v=at(e.k,e.t);if(v==null)return;var c=COL[e.k]||'#b48cff';
  s+='<g class="rp-mk'+(e.buy?' rp-buy':(e.sol!=null&&e.sol<0?' rp-loss':' rp-win'))+'" data-i="'+i+'" style="--c:'+c+'" transform="translate('+X(e.t).toFixed(1)+','+Y(v).toFixed(1)+')"><circle r="'+(e.buy?4:5)+'"/><title>'+E(cap(e.k)+' '+e.side+' '+e.s)+'</title></g>'});
 return s+'<line id="rp-ph" x1="0" x2="0" y1="'+T+'" y2="'+(H-Bt)+'" class="rp-ph"/></svg>'}
function evText(e){return '<b style="color:'+(COL[e.k]||'#b48cff')+'">'+E(cap(e.k))+'</b> '+(e.buy?'bought <b>'+E(e.s)+'</b> for '+e.sz.toFixed(2)+' SOL':'sold <b>'+E(e.s)+'</b> ('+E(e.side)+')'+(e.pct!=null?' <span class="'+(e.pct<0?'dn':'up')+'">'+pc(e.pct)+'</span>':''))}
function chipText(e){return '<span class="rp-ct">'+hm(e.t)+'</span>'+evText(e)+(e.m&&Desk.utils&&Desk.utils.DX&&Desk.utils.DX(e.m)?' <a href="'+E(Desk.utils.DX(e.m))+'" target="_blank" rel="noopener">chart ↗</a>':'')}
function paint(){if(!M||!box)return;var t=M.t0+frac*(M.t1-M.t0),x=X(t);
 var cr=box.querySelector('#rp-cr');if(cr)cr.setAttribute('width',Math.max(0,x).toFixed(1));var ph=box.querySelector('#rp-ph');if(ph){ph.setAttribute('x1',x.toFixed(1));ph.setAttribute('x2',x.toFixed(1))}
 var n=0;while(n<M.ev.length&&M.ev[n].t<=t)n++;
 if(n!==seen){box.querySelectorAll('.rp-mk').forEach(function(g){var i=+g.getAttribute('data-i');g.classList.toggle('on',i<n);g.classList.toggle('pop',playing&&i<n&&i>=seen&&seen>=0)});
  var last=M.ev.slice(Math.max(0,n-5),n).reverse(),fd=box.querySelector('.rp-feed');
  if(fd)fd.innerHTML=last.length?last.map(function(e,j){return '<div class="rp-chip'+(j===0&&playing&&n>seen&&seen>=0?' new':'')+'" style="--c:'+(COL[e.k]||'#b48cff')+'">'+chipText(e)+'</div>'}).join(''):'<div class="rp-hint">No paper trades yet at this point in the replay.</div>';
  var cap2=box.querySelector('.rp-cap');if(cap2)cap2.innerHTML=n?'🎬 '+evText(M.ev[n-1]):'🎬 The desk opens. Nobody has traded yet.';
  seen=n}
 var bk=box.querySelector('.rp-banks');if(bk)bk.innerHTML=M.ks.map(function(k){var v=at(k,t),st=M.lines[k].start;return '<span class="rp-bank" style="--c:'+COL[k]+'"><i></i>'+E(cap(k))+' <b>'+(v==null?'—':v.toFixed(2)+' SOL')+'</b>'+(v==null?'':' <small class="'+(v<st?'dn':'up')+'">'+pc((v-st)/st*100)+'</small>')+'</span>'}).join('');
 var tm=box.querySelector('.rp-time');if(tm)tm.textContent=hm(t)+(frac>=1?' · now':' · '+dur(M.t1-t)+' ago');
 var sl=box.querySelector('.rp-sl');if(sl&&document.activeElement!==sl)sl.value=Math.round(frac*1000);
 var pb=box.querySelector('.rp-play');if(pb){pb.textContent=playing?'⏸ Pause':(frac>=1?'⏮ Replay':'▶ Play');pb.setAttribute('aria-pressed',String(playing))}}
function tick(ts){raf=0;if(!playing||!M)return;var dt=lastTs?Math.min(250,ts-lastTs):0;lastTs=ts;
 frac=Math.min(1,frac+dt/1000*speed*1000/(M.t1-M.t0));if(frac>=1)playing=false;paint();if(playing)raf=requestAnimationFrame(tick)}
function play(){if(!M)return;if(frac>=1){frac=0;seen=-1}playing=true;lastTs=0;paint();if(!raf)raf=requestAnimationFrame(tick)}
function pause(){playing=false;paint()}
function render(){var d=Desk.data;if(!d)return;var st=document.getElementById('stats');if(!st)return;box=document.getElementById('replay');
 if(!box){box=document.createElement('div');box.id='replay';box.className='card';var ref=document.getElementById('fliphold')||document.getElementById('tclock');if(ref&&ref.parentNode===st)st.insertBefore(box,ref.nextSibling);else st.appendChild(box);
  box.addEventListener('click',function(e){if(e.target.closest('.rp-play')){playing?pause():play();return}
   var sp=e.target.closest('[data-rp-s]');if(sp){speed=+sp.getAttribute('data-rp-s');box.querySelectorAll('[data-rp-s]').forEach(function(b){var on=+b.getAttribute('data-rp-s')===speed;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});return}
   if(e.target.closest('.rp-now')){playing=false;frac=1;seen=-1;paint();return}
   var mk=e.target.closest('.rp-mk');if(mk&&M){var ev=M.ev[+mk.getAttribute('data-i')];if(ev){playing=false;frac=Math.min(1,(ev.t-M.t0)/(M.t1-M.t0)+1e-6);seen=-1;paint()}}});
  box.addEventListener('input',function(e){if(e.target.classList.contains('rp-sl')){playing=false;frac=+e.target.value/1000;paint()}})}
 var was1=frac>=1,old=M;M=model(d);
 if(!M){box.innerHTML='<div class="k">🎬 Desk Replay</div><p class="rp-sub">Not enough paper bank history yet to replay. Check back after the desk has been running a while.</p>';return}
 if(old&&!was1){var t=old.t0+frac*(old.t1-old.t0);frac=Math.max(0,Math.min(1,(t-M.t0)/(M.t1-M.t0)))}else if(was1)frac=1;
 W=Math.max(280,Math.round((box.clientWidth||660)-(innerWidth<600?28:40)));H=W<500?220:260;L=W<500?38:46;seen=-1;
 box.innerHTML='<div class="rp-top"><div><div class="k">🎬 Desk Replay</div><p class="rp-sub">Rewind the recent paper session and watch it play back as a timelapse: each book\'s pretend bank draws itself in and trades pop up as they happen. Drag the slider or tap a dot to jump.</p></div>'+
  '<div class="rp-ctl"><button type="button" class="rp-play" aria-pressed="false">▶ Play</button><div class="rp-sp" role="group" aria-label="Replay speed">'+SPEEDS.map(function(s){return '<button type="button" data-rp-s="'+s[0]+'" class="'+(s[0]===speed?'on':'')+'" aria-pressed="'+(s[0]===speed)+'">'+s[1]+'</button>'}).join('')+'</div><button type="button" class="rp-now">Now</button></div></div>'+
  '<div class="rp-plot">'+svg()+'</div><input type="range" class="rp-sl" min="0" max="1000" step="1" value="'+Math.round(frac*1000)+'" aria-label="Replay position"><div class="rp-bar"><span class="rp-time"></span><span class="rp-banks"></span></div>'+
  '<div class="rp-cap" aria-live="polite"></div><div class="rp-feed"></div>'+
  '<p class="rp-ft">Paper trading only: pretend money, not advice. Covers the recent bank snapshots and trades in each book\'s public log ('+hm(M.t0)+' to '+hm(M.t1)+', your local time).'+(M.ks.some(function(k){return M.lines[k].rc})?' Dashed stretches are rebuilt from closed trades, before the bank snapshots begin.':'')+'</p>';
 paint()}
Desk.on('update',function(){if(!playing)setTimeout(render,0)});
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(document.getElementById('replay')&&!playing)render()},200)});
document.addEventListener('visibilitychange',function(){if(document.visibilityState!=='visible'&&playing)pause()});
})();
