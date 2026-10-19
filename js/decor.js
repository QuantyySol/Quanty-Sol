/* decor.js : brighter, modern ambience for both rooms. Aurora wall wash (teal/violet/magenta/sunset), neon signs,
   string lights, light pools + floor reflections, window skyline, lava lamp, vinyl player, pixel art, hanging plants,
   patterned rug, slow ambient motes and a local day/night tint. Purely decorative, drawn behind the agents.
   Honors prefers-reduced-motion (static frame) and the browser pauses it when the tab is hidden. */
(function(){
'use strict';
if(!window.Desk||!Desk.office){console.warn('decor: Desk API missing');return}
const O=Desk.office,RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
const T=t=>RM&&RM.matches?0:t;
function R(X,x,y,w,h,r,f){X.fillStyle=f;X.beginPath();X.roundRect(x,y,w,h,r);X.fill()}
function tint(){const h=new Date().getHours()+new Date().getMinutes()/60;const night=h<6||h>=20,dusk=(h>=17&&h<20)||(h>=6&&h<8);return night?'rgba(40,30,120,.10)':dusk?'rgba(255,110,80,.07)':'rgba(120,220,255,.04)'}
function wash(X,W,H,top,t,a){X.globalCompositeOperation='screen';const g=X.createLinearGradient(0,0,W,0),s=Math.sin(t/9000)*.08;
 g.addColorStop(0,'rgba(0,220,200,'+a+')');g.addColorStop(.33+s,'rgba(140,90,255,'+a+')');g.addColorStop(.66+s,'rgba(255,70,190,'+a+')');g.addColorStop(1,'rgba(255,150,70,'+a+')');X.fillStyle=g;X.fillRect(0,0,W,top);
 const v=X.createLinearGradient(0,0,0,top);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(20,10,40,'+a*.8+')');X.fillStyle=v;X.fillRect(0,0,W,top);X.globalCompositeOperation='source-over'}
function lights(X,W,y0,sag,t){const n=Math.round(W/46),C=['#ff5cc8','#ffd84a','#39ff88','#5cc8ff','#b46cff','#ff9f5a'];X.strokeStyle='rgba(255,255,255,.18)';X.lineWidth=1.5;X.beginPath();
 for(let i=0;i<=n;i++){const x=i/n*W,y=y0+Math.sin(i/n*Math.PI)*sag;i?X.lineTo(x,y):X.moveTo(x,y)}X.stroke();
 for(let i=1;i<n;i++){const x=i/n*W,y=y0+Math.sin(i/n*Math.PI)*sag+6,c=C[i%C.length],a=.65+.35*Math.sin(t/600+i*1.7);X.globalAlpha=a;X.fillStyle=c;X.shadowColor=c;X.shadowBlur=14;X.beginPath();X.arc(x,y,4,0,7);X.fill()}X.shadowBlur=0;X.globalAlpha=1}
function neon(X,txt,x,y,size,c1,c2,t){X.font='900 '+size+'px Inter,sans-serif';X.textAlign='center';const f=.85+.15*Math.sin(t/300)*(Math.sin(t/2300)>.96?1:0);
 const g=X.createLinearGradient(x-size*3,0,x+size*3,0);g.addColorStop(0,c1);g.addColorStop(1,c2);X.globalAlpha=f;X.shadowColor=c1;X.shadowBlur=22;X.fillStyle=g;X.fillText(txt,x,y);X.shadowBlur=8;X.fillStyle='#fff';X.globalAlpha=.35*f;X.fillText(txt,x,y);X.globalAlpha=1;X.shadowBlur=0;X.textAlign='left'}
function candles(X,x,y,w,h,t){R(X,x,y,w,h,12,'rgba(8,10,18,.75)');X.strokeStyle='#5cc8ff';X.lineWidth=2;X.shadowColor='#5cc8ff';X.shadowBlur=14;X.beginPath();X.roundRect(x,y,w,h,12);X.stroke();X.shadowBlur=0;
 const vals=[.5,.62,.45,.7,.58,.8,.66],n=vals.length,cw=w/(n+1);vals.forEach((v,i)=>{const up=i===0||v>=vals[i-1],c=up?'#39ff88':'#ff5c6c',cx=x+cw*(i+1),bh=h*.22+h*.1*Math.sin(t/900+i),cy=y+h*(1-v);
  X.strokeStyle=c;X.lineWidth=2;X.shadowColor=c;X.shadowBlur=10;X.beginPath();X.moveTo(cx,cy-bh*.8);X.lineTo(cx,cy+bh*.8);X.stroke();X.fillStyle=c;X.fillRect(cx-cw*.28,cy-bh/2,cw*.56,bh)});X.shadowBlur=0}
function pool(X,x,y,rx,ry,c,a){const g=X.createRadialGradient(x,y,2,x,y,rx);g.addColorStop(0,c.replace('A',a));g.addColorStop(1,c.replace('A',0));X.save();X.translate(x,y);X.scale(1,ry/rx);X.translate(-x,-y);X.fillStyle=g;X.beginPath();X.arc(x,y,rx,0,7);X.fill();X.restore()}
const motes=Array.from({length:34},(_,i)=>({x:Math.random(),y:Math.random(),s:.4+Math.random()*1.2,p:Math.random()*7,c:['#5cc8ff','#ff5cc8','#b46cff','#39ff88','#ffd84a'][i%5]}));
function drift(X,W,H,top,t){motes.forEach(m=>{const x=((m.x+t/90000*m.s)%1)*W,y=m.y*top+Math.sin(t/3000+m.p)*14;X.globalAlpha=.25+.25*Math.sin(t/1500+m.p);X.fillStyle=m.c;X.fillRect(x,y,2.2,2.2)});X.globalAlpha=1}
/* ---------- OFFICE ---------- */
O.addActor({id:'decor-office',y:-.7,draw(X,t0){const t=T(t0),W=O.width,H=O.height,m=O.mobile,fy=H*.78;
 wash(X,W,H,fy,t,.14);lights(X,W,8,m?26:34,t);drift(X,W,H,fy,t);
 // floor: light pools + soft reflections
 const vr=window.DeskVS&&DeskVS.rect?DeskVS.rect():null;
 if(vr)pool(X,vr.x+vr.w/2,fy+H*.06,vr.w*.6,H*.05,'rgba(57,255,136,A)',.10);
 pool(X,m?W/2:W*.82,fy+H*.05,m?W*.4:W*.15,H*.05,'rgba(255,92,200,A)',.12);pool(X,m?W*.17:170,fy+H*.05,m?W*.2:150,H*.04,'rgba(92,200,255,A)',.10);
 const rg=X.createLinearGradient(0,fy,0,H);rg.addColorStop(0,'rgba(180,120,255,.10)');rg.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=rg;X.fillRect(0,fy,W,H-fy);
 X.fillStyle=tint();X.fillRect(0,0,W,H)}});
O.addActor({id:'decor-signs',y:-.45,draw(X,t0){const t=T(t0),W=O.width,H=O.height;if(O.mobile){neon(X,'HODL HOURS',530,895,30,'#ff5cc8','#ffd84a',t)}else{neon(X,'HODL HOURS',W*.82,H*.5,50,'#ff5cc8','#ffd84a',t);candles(X,60,430,220,128,t)}}});
/* ---------- BREAKROOM ---------- */
function skyline(X,w,t){X.save();X.beginPath();X.rect(w.x,w.y,w.w,w.h);X.clip();
 [[.55,'#1a1033',.006,23],[.7,'#0d0820',.014,41]].forEach(([hgt,col,sp,seed])=>{const off=(t*sp)%200;X.fillStyle=col;let x=w.x-off;let i=0;
  while(x<w.x+w.w+60){const bw=26+((i*seed)%5)*10,bh=w.h*(.18+((i*seed*7)%10)/10*hgt*.5);X.fillRect(x,w.y+w.h-bh,bw,bh);
   for(let yy=w.y+w.h-bh+6;yy<w.y+w.h-6;yy+=10)for(let xx=x+4;xx<x+bw-4;xx+=8)if(((xx*13+yy*7+seed)|0)%5===0){X.fillStyle=['#ffd84a','#ff9f5a','#5cc8ff'][(xx+yy|0)%3];X.globalAlpha=.75;X.fillRect(xx,yy,3,4);X.globalAlpha=1;X.fillStyle=col}
   x+=bw+6;i++}});
 const sg=X.createLinearGradient(0,w.y+w.h*.5,0,w.y+w.h);sg.addColorStop(0,'rgba(255,120,80,0)');sg.addColorStop(1,'rgba(255,120,80,.25)');X.fillStyle=sg;X.fillRect(w.x,w.y,w.w,w.h);X.restore()}
function lava(X,x,y,s,t){R(X,x-10*s,y-6*s,20*s,8*s,3,'#2a2238');X.fillStyle='rgba(255,92,200,.25)';X.beginPath();X.moveTo(x-7*s,y-6*s);X.lineTo(x-4*s,y-46*s);X.lineTo(x+4*s,y-46*s);X.lineTo(x+7*s,y-6*s);X.fill();
 X.fillStyle='#ff9f5a';X.shadowColor='#ff5cc8';X.shadowBlur=16;for(let i=0;i<3;i++){X.beginPath();X.arc(x+Math.sin(t/1700+i)*2*s,y-(12+((t/60+i*14)%30))*s,(3+i)*s*.7,0,7);X.fill()}X.shadowBlur=0;R(X,x-5*s,y-50*s,10*s,5*s,2,'#2a2238');
 const g=X.createRadialGradient(x,y-26*s,2,x,y-26*s,60*s);g.addColorStop(0,'rgba(255,92,200,.22)');g.addColorStop(1,'rgba(255,92,200,0)');X.fillStyle=g;X.fillRect(x-60*s,y-90*s,120*s,120*s)}
function vinyl(X,x,y,s,t){R(X,x-40*s,y-34*s,80*s,34*s,6,'#3b2a20');R(X,x-34*s,y-50*s,68*s,16*s,4,'#1c1430');X.save();X.translate(x-6*s,y-44*s);X.scale(1,.32);X.rotate(t/400);X.fillStyle='#08080c';X.beginPath();X.arc(0,0,24*s,0,7);X.fill();X.fillStyle='#ff5cc8';X.beginPath();X.arc(0,0,7*s,0,7);X.fill();X.restore();
 X.strokeStyle='#cfd8dc';X.lineWidth=2;X.beginPath();X.moveTo(x+26*s,y-50*s);X.lineTo(x+10*s,y-44*s);X.stroke();if(Math.sin(t/500)>0){X.fillStyle='#b46cff';X.font='bold '+(16*s|0)+'px sans-serif';X.fillText('♪',x+20*s,y-60*s-((t/40)%20))}}
function art(X,x,y,s,seed){R(X,x-4,y-4,s+8,s+8,4,'#ffd84a');R(X,x,y,s,s,2,'#0b0f12');const P=['#ff5cc8','#5cc8ff','#39ff88','#b46cff','#ffd84a'],n=6,c=s/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(((i*7+j*13+seed)%3)!==0){X.fillStyle=P[(i+j+seed)%5];X.fillRect(x+i*c,y+j*c,c-1,c-1)}}
function hang(X,x,len,s,t){X.strokeStyle='#8aa098';X.lineWidth=1.5;X.beginPath();X.moveTo(x,0);X.lineTo(x,len);X.stroke();R(X,x-16*s,len,32*s,20*s,8,'#ff9f5a');
 for(let i=0;i<6;i++){X.strokeStyle=i%2?'#2fbf6a':'#39ff88';X.lineWidth=4*s;X.beginPath();X.moveTo(x+(i-2.5)*5*s,len+14*s);X.quadraticCurveTo(x+(i-2.5)*14*s,len+40*s,x+(i-2.5)*9*s+Math.sin(t/1200+i)*3,len+(50+i*9)*s);X.stroke()}}
function rugPattern(X,cx,cy,rx,ry,t){X.save();X.beginPath();X.ellipse(cx,cy,rx,ry,0,0,7);X.clip();const C=['#ff5cc8','#5cc8ff','#ffd84a','#39ff88'];X.globalAlpha=.35;
 for(let i=-12;i<12;i++){X.strokeStyle=C[(i+12)%4];X.lineWidth=5;X.beginPath();for(let k=0;k<=12;k++){const x=cx-rx+k*rx/6,y=cy+i*ry/5+(k%2?ry*.12:-ry*.12);k?X.lineTo(x,y):X.moveTo(x,y)}X.stroke()}X.restore();X.globalAlpha=1}
function brk(X,t0,g){const t=T(t0),{W,H,FT,m}=g;
 wash(X,W,H,FT,t,.2);skyline(X,g.win,t);lights(X,W,6,m?24:30,t);drift(X,W,H,FT,t);
 const sp=Desk.brk.spots();rugPattern(X,sp.rug.x,sp.rug.y,W*(m?.36:.2),H*.05,t);
 if(!m){neon(X,'HODL HOURS',W*.12,H*.1,40,'#5cc8ff','#ff5cc8',t);candles(X,W*.025,H*.125,W*.19,H*.075,t);
  art(X,W*.355,H*.43,46,1);art(X,W*.505,H*.43,46,4);hang(X,W*.235,H*.1,1,t);vinyl(X,W*.28,FT+H*.03,1,t)}
 else{neon(X,'HODL HOURS',W/2,H*.207,28,'#5cc8ff','#ff5cc8',t)}
 lava(X,W*(m?.64:.77),FT+H*(m?.03:.05),m?1.2:1.4,t);
 pool(X,W*(m?.64:.77),FT+H*.07,W*.1,H*.03,'rgba(255,92,200,A)',.25);pool(X,g.arcade.x+g.arcade.w/2,FT+H*.04,W*.08,H*.03,'rgba(255,92,200,A)',.22);pool(X,g.lamp.x,FT+H*.05,W*.14,H*.05,'rgba(255,207,122,A)',.2);
 const rg=X.createLinearGradient(0,FT,0,H);rg.addColorStop(0,'rgba(120,90,255,.14)');rg.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=rg;X.fillRect(0,FT,W,H-FT);
 X.fillStyle=tint();X.fillRect(0,0,W,H)}
function hook(){if(Desk.brk&&Desk.brk.layers){Desk.brk.layers.bg.push(brk);return}setTimeout(hook,200)}hook();
})();
