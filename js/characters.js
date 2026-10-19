/* characters.js : mini LEDGER + TWITTER office actors and the three floating bubble tabs.
   Uses window.Desk (see API.md). Replaces the inline versions. */
(function(){
'use strict';
if(!window.Desk||!Desk.office){console.warn('characters: Desk API missing');return}
Desk.disableInline({characters:true});
const O=Desk.office,U=()=>Desk.utils||{},pick=a=>a[Math.random()*a.length|0];
const E=s=>(U().E||(x=>String(x??'')))(s),P=x=>U().P?U().P(x):String(x),S=x=>U().S?U().S(x):String(x),SG=g=>U().SG?U().SG(g):'';
const isLoss=t=>t.side==='STOP'||t.side==='TRAIL'||(t.pnl_pct!=null&&t.pnl_pct<0);
const isWin=t=>t.side!=='BUY'&&t.pnl_pct!=null&&t.pnl_pct>=0;
const sym=t=>String((t&&t.symbol)||'???').toUpperCase();

/* ---------- stats helpers ---------- */
function split(){const d=Desk.data||{},o={main:{n:0,w:0,p:0},premig:{n:0,w:0,p:0}};
 (d.closed||[]).forEach(c=>{const g=c.strategy==='premig'?'premig':'main',x=o[g],p=+(c.pnl_sol??c.realized_sol??0)||0;x.n++;x.p+=p;if(p>0)x.w++});
 if(!(d.closed||[]).length)(d.trades||[]).forEach(t=>{if(t.side==='BUY'||t.pnl_pct==null)return;const g=t.strategy==='premig'?'premig':'main',x=o[g],p=+t.pnl_sol||0;x.n++;x.p+=p;if(p>0||(t.pnl_pct>0&&!t.pnl_sol))x.w++});
 return o}
const wr=()=>{const s=(Desk.data||{}).stats||{};return Math.round((s.win_rate||0)*100)};

/* ---------- drawing helpers ---------- */
function dots(X,cx,cy,rx,ry,n,seed,col){X.fillStyle=col;for(let i=0;i<n;i++){const a=(i*137.5+seed)%360*Math.PI/180,r=Math.sqrt(((i*7919)%n)/n);X.fillRect(cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r,1.6,1.6)}}
function blob(X,cx,cy,rx,ry,col,n,seed){X.fillStyle='#0b0f12';X.beginPath();X.ellipse(cx,cy,rx,ry,0,0,7);X.fill();X.strokeStyle=col;X.lineWidth=2;X.shadowColor=col;X.shadowBlur=14;X.stroke();X.shadowBlur=0;dots(X,cx,cy,rx-2,ry-2,n,seed,'rgba(255,255,255,.78)')}
function aurora(X,cx,cy,r,col,t){const g=X.createRadialGradient(cx,cy,4,cx,cy,r);const a=(.22+.08*Math.sin(t/700));g.addColorStop(0,col+Math.round(a*255).toString(16).padStart(2,'0'));g.addColorStop(1,col+'00');X.fillStyle=g;X.beginPath();X.ellipse(cx,cy,r,r*.9,0,0,7);X.fill()}
function R(X,x,y,w,h,r,f){X.fillStyle=f;X.beginPath();X.roundRect(x,y,w,h,r);X.fill()}

/* ---------- actor base ---------- */
function mk(o){const fb=O.floorBounds();const a=Object.assign({x:200,y:fb.yMin+30,fy:fb.yMin+30,tx:0,ty:0,state:'idle',timer:120,bubble:null,bt:0,mood:0,jump:0,rush:false,vy:0,face:1,draggable:true},o);
 a.say=function(t,ms,c){this.bubble={t:String(t),c:c||this.col};this.bt=(ms||3500)/16};
 a.go=function(x,y){const f=O.floorBounds();this.tx=Math.max(f.xMin,Math.min(f.xMax,x));this.ty=Math.max(f.yMin,Math.min(f.yMax,y));this.state='walk'};
 a.visit=function(){const d=O.spots().desk,m=O.mobile;this.go(d.x+this.side*(m?110:150),d.y+8)};
 a.wander=function(){const s=O.spots(),n=[];for(const q in s)if(q!=='desk')n.push(q),p=s[pick(n)];this.go(p.x+Math.random()*90-45,p.y+Math.random()*30-10)};
 a.step=function(t){if(this.bt>0&&--this.bt<=0)this.bubble=null;if(this.jump>0)this.jump--;
  if(this.state==='held')return;
  if(this.state==='drop'){this.vy+=1.2;this.y+=this.vy;if(this.y>=this.fy){this.y=this.fy;if(Math.abs(this.vy)>3)this.vy=-this.vy*.45;else{this.vy=0;this.state='idle';this.timer=200}}return}
  if(this.state==='walk'){const dx=this.tx-this.x,dy=this.ty-this.y,d=Math.hypot(dx,dy),sp=this.speed*(this.rush?2.4:1)*(O.mobile?.7:1);
   if(d<sp){this.x=this.tx;this.y=this.ty;this.fy=this.y;this.rush=false;this.state='idle';this.timer=260+Math.random()*480;if(Math.random()<.55)this.say(this.idleLine(),3400)}
   else{this.x+=dx/d*sp;this.y+=dy/d*sp;this.fy=this.y;if(Math.abs(dx)>1)this.face=dx>=0?1:-1}}
  else if(--this.timer<=0){Math.random()<.35?this.visit():this.wander()}};
 a.draw=function(X,t){const k=O.mobile?1:1.25,held=this.state==='held',gy=(held||this.state==='drop')?this.fy:this.y;let y=this.y;
  y-=this.lift(t);if(this.jump)y-=Math.abs(Math.sin(this.jump/5))*26;
  const sh=Math.max(.35,1-Math.max(0,gy-y)/260);X.fillStyle='rgba(0,0,0,.35)';X.beginPath();X.ellipse(this.x,gy+6,this.sw*k*sh,8*k*sh,0,0,7);X.fill();
  if(held){X.strokeStyle=this.col+'99';X.setLineDash([3,6]);X.lineWidth=1.5;X.beginPath();X.moveTo(this.x,0);X.lineTo(this.x,y-(this.hc+70)*k);X.stroke();X.setLineDash([])}
  X.save();X.translate(this.x,y);X.scale(k,k);
  if(held)X.rotate(Math.sin(t/160)*.22);else X.rotate(this.tilt(t));
  aurora(X,0,-this.hc,this.hc*1.5,this.col,t);
  X.save();X.scale(this.face,1);this.body(X,t,held);X.restore();X.restore();
  if(this.bubble){const W=O.width;X.font='bold '+(O.mobile?18:20)+'px Inter,sans-serif';const tw=Math.min(X.measureText(this.bubble.t).width+26,W*.55),lim=O.mobile?W:W*.36-20;
   const bx=Math.max(10,Math.min(lim-tw,this.x-tw/2)),by=Math.max(8,y-(this.hc*2+50)*k);
   R(X,bx,by,tw,36,12,'#0b1210');X.strokeStyle=this.bubble.c;X.lineWidth=2;X.beginPath();X.roundRect(bx,by,tw,36,12);X.stroke();X.fillStyle=this.bubble.c;X.fillText(this.bubble.t,bx+13,by+24,tw-26)}};
 return a}

/* ---------- LEDGER: fat, amber, glasses, calculator, slow waddle ---------- */
const ledger=mk({id:'ledger',col:'#ffbf3f',col2:'#ffbf3f',speed:.75,sw:46,hc:62,side:-1,x:260,
 grab:['PUT ME DOWN. I HAVE SPREADSHEETS.','My snacks!!','This is statistically unwise.','Unhand me, I am load-bearing.'],
 land:['Hmph.','My calculator!','Landing logged. n=1.','Oof. Need a snack.'],
 idleLine(){const s=split(),n=s.main.n+s.premig.n;return pick(['n is too small.','Win rate: '+wr()+'%. Unimpressed.','*crunch* snack break.','Show me the sample size.','Fees. Always the fees.','Regression to the mean, kid.','Closed trades: '+n+'. Not significant.','Correlation is not alpha.'])},
 lift(){return 0},
 tilt(t){return this.state==='walk'?Math.sin(t/260)*.11:Math.sin(t/1400)*.02},
 body(X,t,held){const walk=this.state==='walk',sw=walk?Math.sin(t/260):0,blink=(t%4300)<130,snack=!walk&&!held&&((t/5200|0)%3===0);
  // stubby legs
  X.fillStyle='#e8eef0';X.fillRect(-26+sw*3,-22,14,22);X.fillRect(12-sw*3,-22,14,22);R(X,-30+sw*3,-4,20,6,3,'#cfd8dc');R(X,10-sw*3,-4,20,6,3,'#cfd8dc');
  // big round belly body
  blob(X,0,-62,54,48,this.col,340,11);
  X.strokeStyle=this.col+'66';X.lineWidth=1.5;X.beginPath();X.arc(0,-50,30,.25,Math.PI-.25);X.stroke(); // belly curve
  // arms
  X.fillStyle='#cfd8dc';X.save();X.translate(-50,-78);X.rotate(.5+(snack?-.9+Math.sin(t/140)*.2:0));X.fillRect(-4,0,9,30);X.restore();
  // snack bag in left hand
  if(snack){X.save();X.translate(-44,-104);X.rotate(-.2);R(X,-9,-12,18,22,3,'#ff9f1a');X.fillStyle='#fff3';X.fillRect(-6,-8,12,3);X.restore()}
  else{X.fillStyle='#ff9f1a';X.beginPath();X.arc(-50,-48,6,0,7);X.fill()}
  // head (small on big body)
  blob(X,0,-130,28,27,this.col,130,5);
  // glasses
  X.strokeStyle=this.col;X.lineWidth=3;X.beginPath();X.arc(-11,-132,8.5,0,7);X.moveTo(19.5,-132);X.arc(11,-132,8.5,0,7);X.moveTo(-2.5,-133);X.lineTo(2.5,-133);X.stroke();
  X.fillStyle=this.mood<0?'#ff5c6c':'#ffe6a8';if(!blink){X.fillRect(-13,-134,4,4);X.fillRect(9,-134,4,4)}
  // grumpy brow + mouth
  X.strokeStyle='#ffe6a8';X.lineWidth=2;X.beginPath();X.moveTo(-20,-146);X.lineTo(-5,-142);X.moveTo(20,-146);X.lineTo(5,-142);X.stroke();
  X.beginPath();if(this.mood>0)X.arc(0,-120,6,.2,Math.PI-.2);else X.arc(0,-112,6,Math.PI+.3,-.3);X.stroke();
  // calculator in right hand
  X.save();X.translate(44,-74);X.rotate(-.18+(walk?Math.sin(t/260)*.05:0));R(X,-15,-22,30,42,5,'#3a3020');X.strokeStyle=this.col;X.lineWidth=1.5;X.beginPath();X.roundRect(-15,-22,30,42,5);X.stroke();
  R(X,-11,-18,22,10,2,'#1a2a12');X.fillStyle=this.mood<0?'#ff5c6c':'#9cff6a';X.font='bold 8px monospace';X.fillText(((t/400|0)%2?wr()+'%':'n='+(split().main.n+split().premig.n)).slice(0,5),-9,-10);
  for(let r=0;r<3;r++)for(let c=0;c<3;c++){X.fillStyle=((t/180|0)%9===r*3+c)?this.col:'#6b5a36';X.fillRect(-10+c*8,-3+r*7,5,5)}X.restore();
 }});

/* ---------- TWITTER: slim, sky blue, megaphone + phone, fast hops ---------- */
const twitter=mk({id:'twitter',col:'#5cc8ff',col2:'#5cc8ff',speed:3.3,sw:20,hc:48,side:1,x:720,
 grab:['WHEEEE POST THIS!!!','IM TRENDING!!!','PUT ME DOWN (AFTER THE CLIP)','RATIO THE GRAVITY!!!'],
 land:['LANDED. POSTING IT.','NAILED IT!!!','10/10 LANDING LFG'],
 idleLine(){return pick(['POSTING THIS!!!','WE ARE SO BACK','GM GM GM','CHART LOOKS INSANE','LIKE AND REPOST','THREAD INCOMING','BULLISH ON THE WATER COOLER','FOLLOW @UNCLEQUANTI'])},
 lift(t){return this.state==='walk'?Math.abs(Math.sin(t/(this.rush?45:70)))*20:(this.state==='idle'?Math.abs(Math.sin(t/260))*4:0)},
 tilt(t){return this.state==='walk'?Math.sin(t/70)*.05:0},
 body(X,t,held){const walk=this.state==='walk',hype=this.jump>0||this.mood>0;
  X.fillStyle='#e8eef0';const s=walk?Math.sin(t/70)*5:0;X.fillRect(-8+s,-26,5,26);X.fillRect(3-s,-26,5,26);
  blob(X,0,-52,17,28,this.col,120,3);
  blob(X,0,-100,20,20,this.col,80,9);
  // eyes
  X.fillStyle='#e6f7ff';const bl=(t%3100)<110;if(!bl){X.fillRect(-9,-104,5,hype?2:5);X.fillRect(4,-104,5,hype?2:5)}
  X.strokeStyle='#e6f7ff';X.lineWidth=2;X.beginPath();X.arc(0,-94,6,.1,Math.PI-.1);X.stroke();
  // antenna with blinking tip
  X.strokeStyle=this.col;X.lineWidth=2;X.beginPath();X.moveTo(0,-120);X.lineTo(4,-136);X.stroke();X.fillStyle=(t/250|0)%2?this.col:'#ffffff';X.beginPath();X.arc(4,-138,4,0,7);X.fill();
  // phone in back hand
  X.save();X.translate(-20,-56);X.rotate(.3);R(X,-6,-11,12,22,3,'#10202a');R(X,-4,-8,8,14,1,(t/400|0)%2?this.col:'#9be0ff');X.restore();
  // megaphone in front hand
  X.save();X.translate(22,-66);X.rotate(-.45+Math.sin(t/120)*.14+(hype?-.3:0));X.fillStyle='#cfd8dc';X.fillRect(-14,-3,14,6);
  X.fillStyle=this.col;X.beginPath();X.moveTo(0,-5);X.lineTo(26,-15);X.lineTo(26,15);X.lineTo(0,5);X.closePath();X.fill();X.fillStyle='#0b0f12';X.fillRect(-4,-4,6,8);X.restore();
  if((t/260|0)%2||hype){X.strokeStyle='rgba(92,200,255,.75)';X.lineWidth=2;for(let i=1;i<=(hype?3:2);i++){X.beginPath();X.arc(54,-82,i*8,-.6,.6);X.stroke()}}
  if(hype){X.fillStyle='#fff';for(let i=0;i<5;i++){const a=t/200+i*1.26;X.fillRect(Math.cos(a)*34-1,-100+Math.sin(a)*30-1,3,3)}}
 }});

const ACT=[ledger,twitter];
function placeStart(){const f=O.floorBounds(),s=O.spots();ledger.x=Math.max(f.xMin,Math.min(f.xMax,(s.plant||s.desk).x+60));twitter.x=Math.max(f.xMin,Math.min(f.xMax,(s.cooler||s.desk).x-40));
 ACT.forEach(a=>{a.y=a.fy=Math.min(f.yMax,f.yMin+30+Math.random()*30);a.timer=60+Math.random()*200})}
placeStart();ACT.forEach(a=>O.addActor(a));
let lastMob=O.mobile;addEventListener('resize',()=>setTimeout(()=>{if(O.mobile!==lastMob){lastMob=O.mobile;placeStart()}const f=O.floorBounds();ACT.forEach(a=>{a.x=Math.max(f.xMin,Math.min(f.xMax,a.x));if(a.state!=='held'){a.y=a.fy=Math.max(f.yMin,Math.min(f.yMax,a.y))}})},50));

/* ---------- trade reactions ---------- */
function react(t){const loss=isLoss(t),win=isWin(t),buy=t.side==='BUY';
 ACT.forEach(a=>{if(a.state==='held')return;if(a.state==='drop'){a.y=a.fy;a.vy=0}});
 if(loss){ledger.visit();ledger.rush=true;ledger.mood=-1;ledger.say(pick(['Ugh. '+sym(t)+' '+P(t.pnl_pct)+'. Told you.','*drops chip* '+sym(t)+' '+P(t.pnl_pct)+'.','Win rate now '+wr()+'%. Sigh.','That stop was in my model.']),8000,'#ff5c6c');
  twitter.mood=0;twitter.say(pick(['BUILDING CHARACTER!!!','WE DONT TALK ABOUT '+sym(t),'NEXT ONE SENDS!!!']),5000)}
 else if(buy){twitter.visit();twitter.rush=true;twitter.mood=1;twitter.jump=45;twitter.say('NEW BUY: $'+sym(t)+' LFG!!!',8000);ledger.mood=0;ledger.say('Logging '+sym(t)+'. n+1.',5000)}
 else if(win){twitter.visit();twitter.rush=true;twitter.mood=1;twitter.jump=60;twitter.say('WIN! $'+sym(t)+' '+P(t.pnl_pct)+' WE EATING!!!',8000);ledger.mood=1;ledger.say('Fine. '+P(t.pnl_pct)+'. Still small n.',6000)}
 setTimeout(()=>{ledger.mood=0;twitter.mood=0},12000);
 tabs&&tabs.onTrade(t,loss,win,buy)}
Desk.on('trade',t=>{try{react(t)}catch(e){console.warn(e)}});

/* ---------- floating bubble tabs (Quanty, Ledger, Twitter) ---------- */
let tabs=null;
function headURL(a){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#05070a';g.fillRect(0,0,128,128);
 const st={state:'idle',mood:0,jump:0,face:1};g.save();g.translate(64,a.id==='ledger'?205:178);g.scale(1.25,1.25);aurora(g,0,-a.hc*2,70,a.col,0);a.body.call(Object.assign(Object.create(a),st),g,0,false);g.restore();return c.toDataURL()}
function initTabs(){const box=document.getElementById('minis'),bub=document.getElementById('mbub');if(!box||!bub)return;
 if(box.querySelector('.mini'))box.innerHTML='';
 const SZ=64;let hideT=0,openFor=null;
 const posBub=m=>{const r=m.el.getBoundingClientRect(),w=bub.offsetWidth,h=bub.offsetHeight;let x=r.left+SZ/2-w/2,y=r.top-h-12;if(y<56)y=r.bottom+18;bub.style.left=Math.max(6,Math.min(innerWidth-w-6,x))+'px';bub.style.top=y+'px'};
 const show=(m,html,ms)=>{bub.style.setProperty('--c',m.col);bub.style.borderColor=m.col;bub.innerHTML=html;bub.style.display='block';openFor=m;posBub(m);clearTimeout(hideT);hideT=setTimeout(()=>{bub.style.display='none';openFor=null},ms||8000)};
 const latest=()=>((Desk.data||{}).trades||[])[0];
 const cards={
  quanty(t){const d=Desk.data||{};t=t||latest();return (t?`<b>${E(t.side)} ${E(t.symbol)}</b>${SG(t.strategy)} · ${(+t.size_sol||0).toFixed(3)} SOL${t.pnl_pct!=null?' · '+P(t.pnl_pct):''}<br><span class="mt">${U().T?U().T(t.ts):''}</span><br>`:'No trades yet.<br>')+`Bank <b>${window.DeskBooks&&d.bank_sol!=null?DeskBooks.get().quanty.bank.toFixed(4)+' SOL':d.bank_sol!=null?(+d.bank_sol).toFixed(4)+' SOL':'–'}</b><br><span class="mt">${pick(['Buy high, cry later. (Paper only!)','My PhD is in vibes.','I run on SOL and snacks.','Fake money, real feelings.'])}</span>`},
  ledger(){const d=Desk.data||{},s=d.stats||{},g=split(),f=o=>o.n?`${o.n} closed · ${Math.round(o.w/o.n*100)}% win · ${S(o.p)} SOL`:'no closes yet',small=(g.main.n+g.premig.n)<30;
   return `<b>LEDGER'S NUMBERS</b><br>Win rate <b>${wr()}%</b> over ${Math.round(s.trades||0)} trades<br>Desk P&amp;L <b>${window.DeskBooks?S(DeskBooks.get().quanty.pnl):S(d.pnl_sol||0)} SOL</b><br>MAIN: ${f(g.main)}<br>PREMIG: ${f(g.premig)}<br><span class="mt">${pick([small?'n is too small. Ask me next week.':'Okay, n is finally decent. Still grumpy.','Fees ate '+(+s.fees_paid_sol||0).toFixed(3)+' SOL. I am not happy.','Correlation is not alpha.','*crunches chips* …significance: none.'])}</span>`+(window.DeskVS?DeskVS.cardHTML():'')},
  twitter(t){t=t||latest();const h=!t?'NO TRADES YET BUT WE ARE SO EARLY!!!':t.side==='BUY'?`JUST APED $${E(sym(t))} (PAPER) LFG!!!`:(t.pnl_pct>=0?`$${E(sym(t))} CLOSED ${P(t.pnl_pct)} WE EATING!!!`:`$${E(sym(t))} ${P(t.pnl_pct)}… BUILDING CHARACTER!!!`);
   return `<b>${h}</b><br><span class="mt">paper trades only · not advice</span><br><a href="https://x.com/UncleQuanTi" target="_blank" rel="noopener">Follow the desk on X →</a>`}};
 const defs=[{id:'quanty',name:'QUANTY',col:'#39ff88',img:'assets/robot_head.png'},{id:'ledger',name:'LEDGER',col:'#ffbf3f',a:ledger},{id:'twitter',name:'TWITTER',col:'#5cc8ff',a:twitter}];
 const clamp=m=>{m.px=Math.max(6,Math.min(innerWidth-SZ-6,m.px));m.py=Math.max(60,Math.min(innerHeight-SZ-22,m.py))};
 const place=m=>{const b=Math.sin(m.bob/30)*3-(m.hop>0?Math.sin(m.hop/30*Math.PI)*26:0);m.el.style.left=m.px+'px';m.el.style.top=(m.py+b)+'px';if(openFor===m)posBub(m)};
 const M=defs.map((d,i)=>{const el=document.createElement('div');el.className='mini';el.style.setProperty('--c',d.col);el.style.touchAction='none';el.setAttribute('role','button');el.setAttribute('aria-label',d.name);
  el.innerHTML='<div class="h"><div class="lid"></div></div><div class="nm">'+d.name+'</div>';
  let img=d.img;try{if(!img)img=headURL(d.a)}catch(e){}el.querySelector('.h').style.backgroundImage='url('+img+')';box.appendChild(el);
  const m=Object.assign({},d,{el,px:null,py:null,bob:i*20,hop:0,ST:'uq_mini_'+d.id});
  try{const v=JSON.parse(localStorage.getItem(m.ST)||'null');if(v&&isFinite(v.x)&&isFinite(v.y)){m.px=v.x*innerWidth;m.py=v.y*innerHeight;if(v.s==='r')m.px=innerWidth-SZ-10;if(v.s==='l')m.px=10}}catch(_){}
  if(m.px==null){m.px=innerWidth-SZ-14;m.py=innerHeight-(SZ+30)*(3-i)-10}clamp(m);return m});
 M.forEach(m=>{let dn=null,moved=false;const el=m.el;
  el.addEventListener('pointerdown',e=>{dn={id:e.pointerId,sx:e.clientX,sy:e.clientY,ox:m.px,oy:m.py};moved=false;try{el.setPointerCapture(e.pointerId)}catch(_){}el.style.cursor='grabbing';m.drag=true;e.preventDefault()});
  el.addEventListener('pointermove',e=>{if(!dn||e.pointerId!==dn.id)return;const dx=e.clientX-dn.sx,dy=e.clientY-dn.sy;if(Math.hypot(dx,dy)>6)moved=true;if(moved){m.px=dn.ox+dx;m.py=dn.oy+dy;clamp(m);place(m)}});
  const up=e=>{if(!dn||e.pointerId!==dn.id)return;dn=null;m.drag=false;el.style.cursor='grab';try{el.releasePointerCapture(e.pointerId)}catch(_){}
   if(!moved){if(openFor===m&&bub.style.display==='block'){bub.style.display='none';openFor=null}else{show(m,cards[m.id]());if(m.a){m.a.say(m.id==='ledger'?'What. I am busy.':'YOU RANG?!',2500)}else Desk.quanty&&Desk.quanty.say('Hi!',2000)}return}
   const right=m.px+SZ/2>=innerWidth/2,tx=right?innerWidth-SZ-10:10,sx=m.px,t0=performance.now();
   (function an(n){const k=Math.min(1,(n-t0)/350),e2=1-Math.pow(1-k,3);m.px=sx+(tx-sx)*e2;place(m);if(k<1)requestAnimationFrame(an);else{try{localStorage.setItem(m.ST,JSON.stringify({x:m.px/innerWidth,y:m.py/innerHeight,s:right?'r':'l'}))}catch(_){}}})(t0)};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)});
 addEventListener('resize',()=>M.forEach(m=>{clamp(m);place(m)}));
 (function tk(){M.forEach(m=>{m.bob++;if(m.hop>0)m.hop--;if(!m.drag)place(m)});requestAnimationFrame(tk)})();
 setInterval(()=>{const m=pick(M);m.el.classList.add('blink');setTimeout(()=>m.el.classList.remove('blink'),140)},2200);
 tabs={M,onTrade(t,loss,win,buy){const m=loss?M[1]:(buy?M[0]:M[2]);M.forEach(x=>{if(x.id!=='ledger'||loss)x.hop=30});show(m,cards[m.id](t),9000)}};
 window.__chars={ledger,twitter,tabs}}
if(document.readyState==='complete')initTabs();else addEventListener('load',initTabs);
})();
