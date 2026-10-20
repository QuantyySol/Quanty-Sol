/* arcade.js : AURORA RUN, a pseudo-3D 3-lane endless runner for the breakroom arcade machine.
   Swipe or arrows/WASD: left/right lanes, up jump, down slide. Collect QUANTY COINS and green candles.
   A game only: no money, nothing sent anywhere. High score lives in this browser's localStorage. */
(function(){
'use strict';
if(!window.Desk||!Desk.brk){console.warn('arcade: Desk.brk missing');return}
const B=Desk.brk,HI='uq_arcade_hi',RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
const CH={quanty:{name:'QUANTY',c:'#39ff88'},ledger:{name:'LEDGER',c:'#ffbf3f'},twitter:{name:'TWITTER',c:'#5cc8ff'}};
const coinImg=new Image();coinImg.src='assets/quanty_coin_64.png';
let ov=null,cv,X,W=0,H=0,DPR=1,raf=0,last=0,muted=true,actx=null,who='quanty',state='start',paused=false,cheerT=0;
let G=null;const hi=()=>{try{return +localStorage.getItem(HI)||0}catch(e){return 0}};
/* ---------- sound (off by default) ---------- */
function beep(f,d,type){if(muted)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.type=type||'square';o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(actx.destination);const t=actx.currentTime;g.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d)}catch(e){}}
/* ---------- game state ---------- */
const DBG=(()=>{try{const m=/[?&]arcdbg=(\d+)/.exec(location.search);return m?Math.min(10,+m[1]):0}catch(e){return 0}})();
const GOD=/[?&]arcgod=1/.test(location.search),V0=23,VMAX=56,TIERLEN=500;
function tierOf(d){return Math.min(10,1+Math.floor(d/TIERLEN))}
function reset(){const d0=DBG?(DBG-1)*TIERLEN:0;G={t:0,dist:d0,coins:0,greens:0,speed:V0,lane:0,lx:0,y:0,vy:0,slide:0,objs:[],next:d0+75,over:false,flash:0,shake:0,parts:[],tier:tierOf(d0),ban:DBG>1?2.2:0,pulse:0,boost:DBG>1?(DBG-1)*2.6:0}}
const PAL=[['#39ff88','#b46cff','#5cc8ff','#ff5cc8','#ff5cc8','#5cc8ff','180,108,255'],['#5cc8ff','#39ff88','#b46cff','#ffd84a','#39ff88','#5cc8ff','92,200,255'],['#ffd84a','#ff5cc8','#b46cff','#5cc8ff','#ffd84a','#ff9f1a','255,190,90'],['#ff5cc8','#ff9f1a','#ffd84a','#b46cff','#ff9f1a','#ff5cc8','255,92,200'],['#b46cff','#ff3b5c','#ff9f1a','#ff5cc8','#ff3b5c','#b46cff','255,80,110']];
function pal(){return PAL[((G?G.tier:1)-1)%PAL.length]}
const ZF=120;/* far draw distance */
function put(z,lane,type,x){G.objs.push(Object.assign({z,lane,type},x||{}))}
function coins(z,lane,n,gap){for(let i=0;i<n;i++)put(z+i*(gap||4),lane,'coin')}
function rnd(a){return a[Math.random()*a.length|0]}
function spawn(){const z=ZF,T=G.tier,v=G.speed,lanes=[-1,0,1],free=rnd(lanes),others=lanes.filter(l=>l!==free);
 const pitLen=Math.min(5.5,3+T*.3);let extra=0;
 const pats=['single'];if(T>=2)pats.push('double','double');if(T>=3)pats.push('jumpslide');if(T>=4)pats.push('mover');if(T>=5)pats.push('double','jumpslide','mover');
 const pt=T===1&&G.dist<300?'easy':rnd(pats);
 if(pt==='easy'){put(z,rnd(others),rnd(['candle','bar']));if(Math.random()<.7)coins(z,free,4)}
 else if(pt==='single'){others.forEach(l=>{if(Math.random()<.45+T*.04)put(z,l,rnd(['candle','bar','pit','block']),{len:pitLen});else if(Math.random()<.4)put(z,l,Math.random()<.3?'green':'coin')});if(Math.random()<.6)coins(z,free,4)}
 else if(pt==='double'){/* two lanes blocked, one survivable lane (may itself need a jump/slide at higher tiers) */
  others.forEach(l=>put(z,l,'block'));if(T>=4&&Math.random()<.5)put(z,free,rnd(['candle','bar','pit']),{len:pitLen});else coins(z,free,3);
  if(T>=3)put(z+3,others[0],'coin',{h:1})}
 else if(pt==='jumpslide'){/* full-width jump row, then slide row; gap scales with speed so there is time to land */
  const gap=Math.max(14,v*.95);lanes.forEach(l=>put(z,l,'candle'));lanes.forEach(l=>put(z+gap,l,'bar'));coins(z+gap*.5,rnd(lanes),2,3);extra=gap}
 else if(pt==='mover'){/* blocker sweeping between two adjacent lanes; the third lane is always clear */
  const pair=free===-1?[0,1]:free===1?[-1,0]:(Math.random()<.5?[-1,0]:[0,1]);const fl=pair[0]===-1&&pair[1]===0?1:-1;
  put(z,pair[0],'block',{mv:pair,ph:Math.random()*6,w:1.4+T*.12});coins(z,fl,3)}
 if(T>=3&&pt!=='jumpslide'&&Math.random()<.35)put(z+2,rnd(others),'coin');/* riskier coins near hazards */
 const react=Math.max(.62,1.05-T*.045);/* seconds between obstacle rows */
 G.next=G.dist+Math.max(v*react,Math.max(13,34-T*2.4))+extra}
function hitTest(o){const air=G.y>.9,sl=G.slide>0;if(o.type==='candle')return!air;if(o.type==='pit')return G.y<.35;if(o.type==='bar')return!sl;if(o.type==='block')return true;return false}
function step(dt){if(G.over)return;G.t+=dt;const nt=tierOf(G.dist);if(nt>G.tier){G.tier=nt;G.ban=2.2;G.pulse=1;beep(880,.15,'triangle')}G.speed=Math.min(VMAX,V0+G.t*.45+G.boost+(G.tier-1)*2.6);if(G.ban>0)G.ban-=dt;if(G.pulse>0)G.pulse-=dt*1.5;const dz=G.speed*dt;G.dist+=dz;if(G.dist>G.next)spawn();
 G.lx+=(G.lane-G.lx)*Math.min(1,dt*14);if(G.y>0||G.vy>0){G.vy-=dt*34;G.y=Math.max(0,G.y+G.vy*dt);if(G.y===0)G.vy=0}if(G.slide>0)G.slide-=dt;
 for(let i=G.objs.length-1;i>=0;i--){const o=G.objs[i];o.z-=dz;if(o.mv)o.lane=o.mv[0]+(o.mv[1]-o.mv[0])*(.5-.5*Math.cos(o.ph+G.t*o.w));if(o.z<-6){G.objs.splice(i,1);continue}
  if(!o.done&&o.z<1.2&&o.z>(o.type==='pit'?-(o.len||3)-.3:-1.2)&&Math.abs(o.lane-G.lx)<.45){if(o.type==='coin'){o.done=1;G.coins++;beep(980,.08);burst(o,'#ffd84a')}else if(o.type==='green'){o.done=1;G.greens++;G.coins+=5;beep(660,.12,'triangle');burst(o,'#39ff88')}
   else if(hitTest(o)){o.done=1;if(GOD)continue;end();return}else if(o.type!=='pit')o.done=1}}
 G.parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=600*dt;p.l-=dt});G.parts=G.parts.filter(p=>p.l>0);if(G.flash>0)G.flash-=dt;if(G.shake>0)G.shake-=dt;
 cheerT-=dt;if(cheerT<=0){cheerT=7;cheer()}}
function burst(o,c){const p=proj(o.lane,Math.max(.5,o.z),.6);for(let i=0;i<8;i++)G.parts.push({x:p.x,y:p.y,vx:(Math.random()-.5)*300,vy:-Math.random()*300,l:.5,c})}
function score(){return Math.floor(G.dist/2)+G.coins*10}
function end(){G.over=true;G.flash=.4;G.shake=.4;beep(140,.5,'sawtooth');const s=score();let h=hi();if(s>h){try{localStorage.setItem(HI,String(s))}catch(e){}}state='over';showPick(false);
 const a=B.agents().ledger;a&&B.say(a,pick(['Rugged. Statistically expected.','Small n. Try again.','Classic rug pit.']),3000)}
/* ---------- input ---------- */
function act(a){if(state==='start'||state==='over'){if(a==='go'||a==='jump'){start()}return}if(paused){paused=false;return}
 if(a==='left')G.lane=Math.max(-1,G.lane-1),beep(420,.04);else if(a==='right')G.lane=Math.min(1,G.lane+1),beep(420,.04);
 else if(a==='jump'&&G.y===0){G.vy=12;G.slide=0;beep(520,.08)}else if(a==='slide'){G.slide=.7;if(G.y>0)G.vy=-14;beep(300,.06)}}
function start(){reset();state='play';paused=false;showPick(false);beep(700,.1);cheerT=1.5}
const pick=a=>a[Math.random()*a.length|0];
function onKb(event){if(!ov)return;const k=event.key;const map={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump',ArrowDown:'slide',s:'slide',S:'slide',Enter:'go'};
 if(k==='Escape'){close();return}if(map[k]){event.preventDefault();act(map[k])}}
let sw=null;
function bindTouch(){cv.addEventListener('pointerdown',e=>{sw={x:e.clientX,y:e.clientY,t:performance.now()};try{cv.setPointerCapture(e.pointerId)}catch(_){}});
 cv.addEventListener('pointerup',e=>{if(!sw)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y,ad=Math.max(Math.abs(dx),Math.abs(dy));sw=null;
  if(ad<24){act(state==='play'?'jump':'go');return}if(Math.abs(dx)>Math.abs(dy))act(dx<0?'left':'right');else act(dy<0?'jump':'slide')});
 cv.addEventListener('pointercancel',()=>{sw=null})}
/* ---------- projection + drawing ---------- */
let HZ=0;function proj(lane,z,h){const f=1/(1+z*.055),cx=W/2,road=W*.62;return{x:cx+lane*road/3*f,y:HZ+(H-HZ)*.95*f-(h||0)*H*.22*f,s:f}}
function sky(t){const g=X.createLinearGradient(0,0,0,HZ);g.addColorStop(0,'#05031a');g.addColorStop(.6,'#1a0b3a');g.addColorStop(1,'#3a1446');X.fillStyle=g;X.fillRect(0,0,W,HZ+2);
 for(let i=0;i<60;i++){X.fillStyle='rgba(255,255,255,'+(.3+.4*((i*37)%10)/10)+')';X.fillRect((i*131.7)%W,(i*71.3)%(HZ*.8),1.6,1.6)}
 X.globalCompositeOperation='screen';{const P=pal();[[P[0],.3],[P[1],.45],[P[2],.6],[P[3],.72]].forEach(([c,y],i)=>{X.strokeStyle=c+'55';X.lineWidth=HZ*.09;X.shadowColor=c;X.shadowBlur=24;X.beginPath();
  for(let x=0;x<=W;x+=12)X.lineTo(x,HZ*y+Math.sin(x/(W*.12)+t*.4+i)*HZ*.06);X.stroke()})};X.shadowBlur=0;X.globalCompositeOperation='source-over';
 const sg=X.createLinearGradient(0,HZ*.7,0,HZ);sg.addColorStop(0,'rgba(255,120,80,0)');sg.addColorStop(1,'rgba(255,120,80,.35)');X.fillStyle=sg;X.fillRect(0,HZ*.7,W,HZ*.3)}
function track(){const a=proj(-1.5,ZF),b=proj(1.5,ZF),c=proj(1.5,-2),d=proj(-1.5,-2);
 const gg=X.createLinearGradient(0,HZ,0,H);gg.addColorStop(0,'#1b0d33');gg.addColorStop(1,'#07060f');X.fillStyle=gg;X.fillRect(0,HZ,W,H-HZ);const g=X.createLinearGradient(0,HZ,0,H);g.addColorStop(0,'#160c2a');g.addColorStop(1,'#0b0a18');X.fillStyle=g;X.beginPath();X.moveTo(a.x,a.y);X.lineTo(b.x,b.y);X.lineTo(c.x,c.y);X.lineTo(d.x,d.y);X.fill();
 const off=(G?G.dist:0)%6;for(let z=6-off;z<ZF;z+=6){const l=proj(-1.5,z),r=proj(1.5,z);X.strokeStyle='rgba('+pal()[6]+','+(.35*l.s+.05)+')';X.lineWidth=Math.max(1,2*l.s);X.beginPath();X.moveTo(l.x,l.y);X.lineTo(r.x,r.y);X.stroke()}
 [-1.5,-.5,.5,1.5].forEach((ln,i)=>{const p=proj(ln,ZF),q=proj(ln,-2),c=i===0||i===3?pal()[4]:pal()[5];X.strokeStyle=c;X.shadowColor=c;X.shadowBlur=12;X.lineWidth=i===0||i===3?3:1.5;X.beginPath();X.moveTo(p.x,p.y);X.lineTo(q.x,q.y);X.stroke()});X.shadowBlur=0;
 // side candles scenery
 for(let z=(6-off*1)%12+2;z<ZF;z+=12)[-2.4,2.4].forEach((ln,j)=>{const p=proj(ln,z),hh=(60+((z*7|0)%5)*30)*p.s,up=((z|0)+j)%3;X.fillStyle=up?'rgba(57,255,136,.55)':'rgba(255,92,108,.55)';X.fillRect(p.x-6*p.s,p.y-hh,12*p.s,hh);X.fillRect(p.x-1,p.y-hh-14*p.s,2,hh+28*p.s)})}
function obj(o,t){if(o.done&&o.type!=='pit')return;const p=proj(o.lane,o.z),s=p.s,lw=W*.62/3*s*.86;if(o.z>ZF||p.y<HZ)return;
 if(o.type==='coin'){const r=Math.max(4,lw*.22),sq=Math.abs(Math.cos(t*4+o.z*.3)),y=p.y-r*2.2;X.save();X.translate(p.x,y);X.scale(Math.max(.15,sq),1);if(coinImg.complete&&coinImg.naturalWidth)X.drawImage(coinImg,-r,-r,2*r,2*r);else{X.fillStyle='#ffd84a';X.beginPath();X.arc(0,0,r,0,7);X.fill()}X.restore();return}
 if(o.type==='green'){const w=lw*.22,h=lw*.7;X.fillStyle='#39ff88';X.shadowColor='#39ff88';X.shadowBlur=14;X.fillRect(p.x-w/2,p.y-h-lw*.25,w,h);X.fillRect(p.x-1,p.y-h-lw*.45,2,h+lw*.4);X.shadowBlur=0;return}
 if(o.type==='candle'){const h=lw*.55;X.fillStyle='#ff3b5c';X.shadowColor='#ff3b5c';X.shadowBlur=16;X.fillRect(p.x-lw/2,p.y-h,lw,h);X.shadowBlur=0;X.fillStyle='#ffd0d8';X.fillRect(p.x-1.5,p.y-h-lw*.25,3,lw*.25);X.fillStyle='#fff';X.font='900 '+Math.max(8,lw*.16|0)+'px Inter,sans-serif';X.textAlign='center';X.fillText('JUMP',p.x,p.y-h*.4);X.textAlign='left';return}
 if(o.type==='bar'){const top=p.y-lw*1.05,h=lw*.22;X.fillStyle='#ff9f1a';X.shadowColor='#ff9f1a';X.shadowBlur=14;X.fillRect(p.x-lw/2,top,lw,h);X.shadowBlur=0;X.fillStyle='#ffcf7a';X.fillRect(p.x-lw/2,top+h,4,lw*.83);X.fillRect(p.x+lw/2-4,top+h,4,lw*.83);X.fillStyle='#1a0b00';X.font='900 '+Math.max(7,lw*.13|0)+'px Inter,sans-serif';X.textAlign='center';X.fillText('SLIDE',p.x,top+h*.75);X.textAlign='left';return}
 if(o.type==='pit'){const q=proj(o.lane,o.z+(o.len||3));X.fillStyle='#000';X.beginPath();X.moveTo(p.x-lw/2,p.y);X.lineTo(p.x+lw/2,p.y);X.lineTo(q.x+lw*q.s/s/2,q.y);X.lineTo(q.x-lw*q.s/s/2,q.y);X.fill();X.strokeStyle='#ff5cc8';X.lineWidth=2;X.stroke();X.fillStyle='#ff5cc8';X.font='800 '+Math.max(7,lw*.12|0)+'px Inter,sans-serif';X.textAlign='center';X.fillText('RUG PIT',p.x,p.y-4);X.textAlign='left';return}
 if(o.type==='block'){const h=lw*1.3;X.fillStyle='#2a0f1e';X.fillRect(p.x-lw/2,p.y-h,lw,h);X.strokeStyle='#ff5c6c';X.lineWidth=3;X.shadowColor='#ff5c6c';X.shadowBlur=14;X.strokeRect(p.x-lw/2,p.y-h,lw,h);X.shadowBlur=0;
  X.strokeStyle='#ff5c6c';X.beginPath();X.moveTo(p.x-lw/2,p.y-h);X.lineTo(p.x+lw/2,p.y);X.moveTo(p.x+lw/2,p.y-h);X.lineTo(p.x-lw/2,p.y);X.stroke()}}
function runner(t){const p=proj(G?G.lx:0,0),s=p.s*Math.min(W*1.3,H)/900*1.25,c=CH[who].c,y=p.y-(G?G.y:0)*H*.12,sl=G&&G.slide>0,run=state==='play'&&!paused?t*14:0;
 X.fillStyle='rgba(0,0,0,.4)';X.beginPath();X.ellipse(p.x,p.y,40*s,10*s,0,0,7);X.fill();X.save();X.translate(p.x,y);X.scale(s,sl?s*.55:s);
 const gl=X.createRadialGradient(0,-90,4,0,-90,120);gl.addColorStop(0,c+'55');gl.addColorStop(1,c+'00');X.fillStyle=gl;X.beginPath();X.arc(0,-90,120,0,7);X.fill();
 X.fillStyle='#e8eef0';X.fillRect(-16,-34+Math.sin(run)*6,10,34);X.fillRect(6,-34-Math.sin(run)*6,10,34);
 const bw=who==='ledger'?46:who==='twitter'?20:30;X.fillStyle='#0b0f12';X.strokeStyle=c;X.lineWidth=2.5;X.shadowColor=c;X.shadowBlur=14;X.beginPath();X.ellipse(0,-70,bw,38,0,0,7);X.fill();X.stroke();X.beginPath();X.arc(0,-130,who==='ledger'?26:22,0,7);X.fill();X.stroke();X.shadowBlur=0;
 X.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<70;i++){const a=i*2.4,r=Math.sqrt(i/70);X.fillRect(Math.cos(a)*bw*.9*r,-70+Math.sin(a)*34*r,1.8,1.8)}
 if(who==='twitter'||who==='quanty'){X.strokeStyle=c;X.beginPath();X.moveTo(0,-152);X.lineTo(4,-172);X.stroke();X.fillStyle=c;X.beginPath();X.arc(4,-175,5,0,7);X.fill()}
 X.fillStyle='#e8eef0';X.save();X.translate(-bw,-80);X.rotate(.6+Math.sin(run)*.6);X.fillRect(-4,0,8,30);X.restore();X.save();X.translate(bw,-80);X.rotate(-.6-Math.sin(run)*.6);X.fillRect(-4,0,8,30);X.restore();X.restore()}
function hud(){const sc=G?score():0,fs=Math.max(14,Math.min(22,W/40));X.font='900 '+fs+'px Inter,sans-serif';X.fillStyle='#fff';X.fillText('SCORE '+sc,14,fs+12);X.fillStyle='#ffd84a';X.fillText('QUANTY COINS '+(G?G.coins:0),14,fs*2+18);
 X.fillStyle='#b9a8d8';X.font='700 '+(fs*.7)+'px Inter,sans-serif';X.fillText('BEST '+hi()+' · '+Math.floor(G?G.dist:0)+' m',14,fs*3+18);
 if(G){const m=G.speed/V0,pu=Math.max(0,G.pulse),f2=fs*(1+pu*.35),c=G.speed>=VMAX?'#ff5c6c':'#9fe9ff';X.font='900 '+f2+'px Inter,sans-serif';X.fillStyle=c;X.shadowColor=c;X.shadowBlur=6+pu*24;X.fillText('SPEED '+m.toFixed(1)+'x',14,fs*4+30);X.shadowBlur=0;
  const bw=Math.min(150,W*.3),by=fs*4+38;X.fillStyle='rgba(255,255,255,.12)';X.fillRect(14,by,bw,5);X.fillStyle=c;X.fillRect(14,by,bw*Math.min(1,(G.speed-V0)/(VMAX-V0)),5);
  X.font='800 '+(fs*.7)+'px Inter,sans-serif';X.fillStyle=pal()[0];X.fillText('LEVEL '+G.tier,14,by+fs*.7+10);
  if(G.ban>0){const a=Math.min(1,G.ban*2,(2.2-G.ban)*4),bs=Math.max(24,Math.min(54,W/16));X.globalAlpha=a;X.textAlign='center';X.font='900 '+bs+'px Inter,sans-serif';X.fillStyle=pal()[3];X.shadowColor=pal()[3];X.shadowBlur=22;X.fillText('LEVEL '+G.tier+' · FASTER',W/2,H*.3,W*.92);X.shadowBlur=0;X.textAlign='left';X.globalAlpha=1}}}
function center(lines,y0){X.textAlign='center';let y=y0;lines.forEach(([t,sz,c])=>{y+=sz*1.3;X.font='900 '+sz+'px Inter,sans-serif';X.fillStyle=c;X.shadowColor=c;X.shadowBlur=c==='#fff'?0:18;X.fillText(t,W/2,y,W*.94)});X.shadowBlur=0;X.textAlign='left'}
function frame(ts){raf=requestAnimationFrame(frame);if(!ov)return;const t=ts/1000,dt=Math.min(.05,last?t-last:0);last=t;
 const r=cv.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);if(cv.width!==Math.round(r.width*dpr)||cv.height!==Math.round(r.height*dpr)){cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr)}
 W=r.width;H=r.height;HZ=H*.36;X.setTransform(dpr,0,0,dpr,0,0);if(state==='play'&&!paused&&!document.hidden)step(dt);
 X.save();if(G&&G.shake>0&&!(RM&&RM.matches))X.translate((Math.random()-.5)*12,(Math.random()-.5)*12);const at=RM&&RM.matches?0:t;sky(at);track();
 if(G)G.objs.slice().sort((a,b)=>b.z-a.z).forEach(o=>{if(o.z>0)obj(o,at)});runner(t);if(G)G.objs.forEach(o=>{if(o.z<=0)obj(o,at)});
 if(G)G.parts.forEach(p=>{X.fillStyle=p.c;X.fillRect(p.x,p.y,4,4)});X.restore();if(G&&G.flash>0){X.fillStyle='rgba(255,60,90,'+G.flash+')';X.fillRect(0,0,W,H)}
 const big=Math.max(26,Math.min(64,W/14)),mid=Math.max(13,Math.min(22,W/42));
 if(state==='start'){X.fillStyle='rgba(5,4,12,.55)';X.fillRect(0,0,W,H);center([['AURORA RUN',big,'#b46cff'],['Dodge rug pits & red candles · grab QUANTY COINS',mid,'#fff'],[W<700?'Swipe ←→ lanes · ↑ jump · ↓ slide':'Arrows / WASD · Space jumps · ↓ slides',mid,'#9fe9ff'],['Pick a runner, then tap or press Enter',mid,'#ffd84a'],['just a game · no real money · best '+hi(),mid*.8,'#8aa098']],H*.12)}
 else if(state==='over'){X.fillStyle='rgba(5,4,12,.62)';X.fillRect(0,0,W,H);center([['RUGGED!',big,'#ff5c6c'],['Score '+score()+' · '+G.coins+' QUANTY COINS',mid*1.1,'#fff'],['Best '+hi(),mid,'#ffd84a'],['Tap or press Enter to run again',mid,'#9fe9ff']],H*.2);hud()}
 else{hud();if(paused||document.hidden)center([['PAUSED',big,'#b46cff'],['tap or press any arrow to resume',mid,'#fff']],H*.4)}}
/* ---------- modal ---------- */
let pickEl=null;
function showPick(on){pickEl&&pickEl.classList.toggle('arc-hid',!on&&state==='play');if(pickEl&&state!=='play')pickEl.classList.remove('arc-hid')}
function open(){if(ov)return;ov=document.createElement('div');ov.className='arc-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Aurora Run arcade game');
 ov.innerHTML='<div class="arc-box"><canvas aria-label="Aurora Run game. Use arrows or swipe."></canvas><div class="arc-bar"><button class="arc-m" aria-label="Toggle sound">🔇</button><button class="arc-x" aria-label="Close game">✕</button></div><div class="arc-pick">'+
  Object.keys(CH).map(k=>`<button data-c="${k}" style="--c:${CH[k].c}">${CH[k].name}</button>`).join('')+'</div></div>';
 document.body.appendChild(ov);cv=ov.querySelector('canvas');X=cv.getContext('2d');pickEl=ov.querySelector('.arc-pick');reset();state='start';paused=false;last=0;
 const pk=()=>pickEl.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.c===who));pk();
 pickEl.addEventListener('click',e=>{const b=e.target.closest('button');if(b){who=b.dataset.c;pk();e.stopPropagation()}});
 ov.querySelector('.arc-x').addEventListener('click',close);const m=ov.querySelector('.arc-m');m.addEventListener('click',()=>{muted=!muted;m.textContent=muted?'🔇':'🔊';beep(800,.06)});
 ov.addEventListener('click',e=>{if(e.target===ov)close()});bindTouch();addEventListener('keydown',onKb);document.body.style.overflow='hidden';raf=requestAnimationFrame(frame);
 const A=B.agents(),fan=who==='twitter'?A.ledger:A.twitter;if(fan)B.sendToBrk(fan,{text:'OMG someone is on the arcade!!!',mood:'🕹️'},true);setTimeout(()=>{cv&&cv.focus&&cv.focus()},50)}
function cheer(){const A=B.agents(),fan=who==='twitter'?A.ledger:A.twitter;if(!fan)return;if(fan.room!=='brk'){B.sendToBrk(fan,null,true);return}
 if(fan.br){const s=B.spots().arcade;fan.br.act='arcade';fan.br.tx=s.x-40;fan.br.ty=s.y+10;fan.br.arrived=false;fan.br.stay=Math.max(fan.br.stay||0,1200)}
 B.say(fan,fan.id==='ledger'?pick(['Sample size: one run. Go on.','Fine. That was a decent jump.','Mind the rug pit.']):pick(['GO GO GO!!!','THAT JUMP WAS INSANE','NEW HIGH SCORE INCOMING!!!','SLIDE!!! SLIDE!!!']),2600)}
function close(){cancelAnimationFrame(raf);removeEventListener('keydown',onKb);ov&&ov.remove();ov=null;document.body.style.overflow='';state='start'}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&ov&&state==='play')paused=true});
/* ---------- launcher on the breakroom arcade ---------- */
let hover=false;
function arcRect(){const g=B.geo(),a=g.arcade;return{x:a.x,y:g.FT-a.h,w:a.w,h:a.h}}
const inArc=p=>{const r=arcRect();return p.x>r.x&&p.x<r.x+r.w&&p.y>r.y&&p.y<r.y+r.h};
B.canvas.addEventListener('pointermove',e=>{const h=inArc(B.toCanvas(e.clientX,e.clientY));if(h!==hover){hover=h;B.canvas.style.cursor=h?'pointer':''}});
B.canvas.addEventListener('pointerdown',e=>{if(B.view()!=='brk')return;const p=B.toCanvas(e.clientX,e.clientY);if(inArc(p)&&!B.hit(p)){e.stopImmediatePropagation();e.preventDefault();open()}},true);
B.layers.bg.push((X2,t)=>{const r=arcRect(),pulse=.6+.4*Math.sin(t/300),s=hover?1.15:1,fs=Math.round((O2()?22:18)*s);X2.font='900 '+fs+'px Inter,sans-serif';X2.textAlign='center';
 const tw=X2.measureText('▶ PLAY').width+20,x=r.x+r.w/2,y=O2()?r.y+r.h-14:r.y-14;/* mobile: sign sits on the cabinet base so it clears the TOP 5 board */X2.fillStyle='rgba(10,8,20,.85)';X2.beginPath();X2.roundRect(x-tw/2,y-fs-6,tw,fs+12,10);X2.fill();X2.strokeStyle='#ffd84a';X2.lineWidth=2;X2.stroke();
 X2.globalAlpha=hover?1:pulse;X2.fillStyle='#ffd84a';X2.shadowColor='#ffd84a';X2.shadowBlur=12;X2.fillText('▶ PLAY',x,y);X2.shadowBlur=0;X2.globalAlpha=1;X2.textAlign='left'});
const O2=()=>Desk.office&&Desk.office.mobile;
window.DeskArcade={open,close};
})();

/* load the EGG FARM mini-game module (kept separate) */
(function(){if(document.querySelector('script[src^="js/eggfarm.js"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='css/eggfarm.css';document.head.appendChild(l);const s=document.createElement('script');s.src='js/eggfarm.js';s.defer=true;document.head.appendChild(s)})();
