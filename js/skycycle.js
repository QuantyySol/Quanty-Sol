/* skycycle.js : Aurora sky cycle. The office and breakroom windows show a sky that follows the viewer's local time
   (dawn, neon-blue day, magenta/orange sunset, night aurora + stars + a rare tappable shooting star) and the stage gets a
   subtle matching tint. The Dev Room has no window, so it only gets the tint. View only. Test: ?sky=dawn|day|sunset|night or ?sky=0-23. */
(function(){
'use strict';
if(!window.Desk||!Desk.office){console.warn('skycycle: Desk API missing');return}
var O=Desk.office,RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
var still=function(){return !!(RM&&RM.matches)};
/* ---------- time -> phase ---------- */
var Q=(location.search.match(/[?&]sky=([a-z0-9.]+)/i)||[])[1],FIX={dawn:6.2,day:12,sunset:18.4,night:23};
function hour(){if(Q){if(FIX[Q.toLowerCase()]!=null)return FIX[Q.toLowerCase()];var h=parseFloat(Q);if(isFinite(h))return ((h%24)+24)%24}var d=new Date();return d.getHours()+d.getMinutes()/60}
/* anchor skies: [top, mid, bottom] gradient stops + night amount + stage tint */
var K=[[0,['#04061a','#0a0b2e','#1a1240'],1,'rgba(90,60,200,.10)'],[4.8,['#05071c','#0d0f33','#24154a'],1,'rgba(90,60,200,.10)'],
 [6.2,['#2a2a6e','#c86aa8','#ffb37a'],.25,'rgba(255,150,120,.08)'],[8,['#1f6fff','#4da3ff','#9fe0ff'],0,'rgba(120,200,255,.06)'],
 [16.5,['#1d63f0','#4d9fff','#a8dcff'],0,'rgba(120,200,255,.06)'],[18.4,['#3a1a6e','#ff3fa4','#ff9a3c'],.15,'rgba(255,90,160,.09)'],
 [20,['#0a0a2c','#2a1450','#4a1a5a'],.8,'rgba(140,60,200,.10)'],[24,['#04061a','#0a0b2e','#1a1240'],1,'rgba(90,60,200,.10)']];
function hx(c){return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]}
function mix(a,b,f){a=hx(a);b=hx(b);return'rgb('+a.map(function(v,i){return Math.round(v+(b[i]-v)*f)}).join(',')+')'}
function sky(){var h=hour(),i=0;while(i<K.length-2&&K[i+1][0]<=h)i++;var A=K[i],B=K[i+1],f=Math.min(1,Math.max(0,(h-A[0])/((B[0]-A[0])||1)));
 return{h:h,cols:A[1].map(function(c,j){return mix(c,B[1][j],f)}),night:A[2]+(B[2]-A[2])*f,tint:f<.5?A[3]:B[3],name:h<5||h>=20?'night':h<8?'dawn':h<17?'day':'sunset'}}
/* ---------- stars (seeded, stable) ---------- */
var STARS=[];for(var s=0;s<70;s++)STARS.push({x:(s*0.6180339)%1,y:((s*0.3819660*7)%1)*0.85,r:s%9===0?1.6:1,p:s*1.7});
/* ---------- shooting star + sparkles ---------- */
var shoot=null,sparks=[],nextShoot=performance.now()+20000+Math.random()*40000;
/* ---------- paint one window: clip -> gradient, stars, aurora, sun glow, shooting star ---------- */
function paint(X,w,t,S,id,hole){X.save();X.beginPath();X.rect(w.x,w.y,w.w,w.h);if(hole)X.rect(hole.x+hole.w,hole.y,-hole.w,hole.h);X.clip('evenodd');
 var g=X.createLinearGradient(0,w.y,0,w.y+w.h);g.addColorStop(0,S.cols[0]);g.addColorStop(.55,S.cols[1]);g.addColorStop(1,S.cols[2]);X.fillStyle=g;X.fillRect(w.x,w.y,w.w,w.h);
 var mv=still()?0:t;
 if(S.night>.05){X.globalAlpha=S.night;X.fillStyle='#fff';STARS.forEach(function(st){var a=.45+.55*Math.abs(Math.sin(mv/1400+st.p));X.globalAlpha=S.night*a;X.fillRect(w.x+st.x*w.w,w.y+st.y*w.h*.8,st.r*1.4,st.r*1.4)});
  /* aurora ribbons */
  X.globalCompositeOperation='lighter';[['57,255,136',.30,0],['77,163,255',.42,2.1],['255,92,200',.55,4.2]].forEach(function(r){X.beginPath();
   for(var x=0;x<=w.w;x+=w.w/24){var y=w.y+w.h*r[1]+Math.sin(x/w.w*6+mv/2600+r[2])*w.h*.08+Math.sin(x/w.w*13+mv/1700)*w.h*.03;x?X.lineTo(w.x+x,y):X.moveTo(w.x,y)}
   X.lineCap='round';X.strokeStyle='rgba('+r[0]+','+(.12*S.night)+')';X.lineWidth=Math.max(12,w.h*.2);X.stroke();X.strokeStyle='rgba('+r[0]+','+(.3*S.night)+')';X.lineWidth=Math.max(5,w.h*.07);X.stroke()});
  X.globalCompositeOperation='source-over';X.globalAlpha=1}
 if(S.name!=='night'){var sx=S.name==='dawn'?.25:S.name==='sunset'?.78:.6,sy=S.name==='day'?.3:.92,R=w.h*(S.name==='day'?.35:.6),sg=X.createRadialGradient(w.x+w.w*sx,w.y+w.h*sy,2,w.x+w.w*sx,w.y+w.h*sy,R);
  sg.addColorStop(0,S.name==='day'?'rgba(255,255,230,.55)':'rgba(255,220,150,.7)');sg.addColorStop(1,'rgba(255,200,150,0)');X.fillStyle=sg;X.fillRect(w.x,w.y,w.w,w.h)}
 if(shoot&&shoot.id===id){var k=(t-shoot.t0)/shoot.d;if(k>=1)shoot=null;else{var px=w.x+w.w*(shoot.x0+shoot.dx*k),py=w.y+w.h*(shoot.y0+shoot.dy*k);shoot.px=px;shoot.py=py;shoot.w=w;
  var tg=X.createLinearGradient(px,py,px-w.w*shoot.dx*.25,py-w.h*shoot.dy*.25);tg.addColorStop(0,'rgba(255,255,255,.95)');tg.addColorStop(1,'rgba(255,255,255,0)');
  X.strokeStyle=tg;X.lineWidth=2.5;X.beginPath();X.moveTo(px,py);X.lineTo(px-w.w*shoot.dx*.25,py-w.h*shoot.dy*.25);X.stroke();X.fillStyle='#fff';X.beginPath();X.arc(px,py,2.6,0,7);X.fill()}}
 X.restore();
 /* sparkle pops (not clipped, tiny) */
 sparks=sparks.filter(function(p){return p.id!==id||t-p.t0<700});sparks.forEach(function(p){if(p.id!==id)return;var k=(t-p.t0)/700;X.save();X.globalAlpha=1-k;
  for(var i=0;i<8;i++){var a=i/8*6.283,d=4+k*26;X.fillStyle=['#fff','#ffd84a','#5cc8ff','#ff5cc8'][i%4];X.fillRect(p.x+Math.cos(a)*d-1.5,p.y+Math.sin(a)*d-1.5,3,3)}X.restore()})}
/* ---------- scheduler: throttle the sky state to ~4/s, shooting stars only at night, pause when hidden ---------- */
var S=sky(),last=0;
function tickState(t){if(t-last>250){last=t;S=sky()}
 if(!shoot&&!still()&&!document.hidden&&S.night>.6&&t>nextShoot){shoot={id:Math.random()<.5||!Desk.brk||Desk.brk.view()==='office'?'office':'brk',t0:t,d:1100,x0:.1+Math.random()*.3,y0:.08+Math.random()*.2,dx:.5,dy:.35};nextShoot=t+45000+Math.random()*75000}
 if(Q&&/night/i.test(Q)&&!shoot&&!still()&&t>3000&&!window.__skyShot){window.__skyShot=1;nextShoot=t}}
/* office window (index.html scene(): same numbers), skip the plant that sits in front of it on mobile */
function offWin(){return O.mobile?{x:60,y:830,w:240,h:150}:{x:50,y:120,w:250,h:230}}
function offPlant(){var fy=O.height*.78;return O.mobile?{x:20,y:fy-110,w:100,h:110}:null}
O.addActor({id:'skycycle',y:-1,draw:function(X,t){if(document.hidden)return;tickState(t);var w=offWin();paint(X,w,t,S,'office',offPlant());
 X.fillStyle='#1f2b2e';X.fillRect(w.x+w.w/2-2,w.y,4,w.h)}});
/* breakroom window: before decor's skyline so the city stays in front of the sky */
function hook(){if(!(Desk.brk&&Desk.brk.layers&&Desk.brk.layers.bg)){return setTimeout(hook,250)}
 Desk.brk.layers.bg.unshift(function(X,t,g){if(document.hidden||!g||!g.win)return;tickState(t);paint(X,g.win,t,S,'brk')})}hook();
/* tap the shooting star -> sparkle pop (never blocks other handlers) */
function tap(e,id){if(!shoot||shoot.id!==id||shoot.px==null)return;var p=id==='office'?O.toCanvas(e.clientX,e.clientY):Desk.brk.toCanvas(e.clientX,e.clientY);
 if(Math.hypot(p.x-shoot.px,p.y-shoot.py)<60){sparks.push({id:id,x:shoot.px,y:shoot.py,t0:performance.now()});shoot=null}}
O.canvas.addEventListener('pointerdown',function(e){tap(e,'office')},{passive:true});
(function h2(){if(Desk.brk&&Desk.brk.canvas)Desk.brk.canvas.addEventListener('pointerdown',function(e){tap(e,'brk')},{passive:true});else setTimeout(h2,250)})();
/* subtle stage tint (CSS class + variable, updated once a minute) */
var st=document.getElementById('stage');function tint(){if(!st)return;S=sky();st.style.setProperty('--sky-tint',S.tint);st.dataset.sky=S.name}
tint();setInterval(function(){if(!document.hidden)tint()},60000);document.addEventListener('visibilitychange',function(){if(!document.hidden)tint()});
window.DeskSky={state:function(){return S},hour:hour};
})();
