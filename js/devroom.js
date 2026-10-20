/* devroom.js : the DEV ROOM backroom (door off the breakroom) + LAUNCHER, the concept/hype agent.
   Hoodie, rocket motif, hot orange. Dev desk with concept screens, neon sign, concept wall.
   Shows only concept names/tickers if the desk feed exports them (data.launcher_concepts); otherwise
   clearly labeled SAMPLE cards. Concepts · simulated. View only, paper only, nothing here is financial advice. */
(function(){
'use strict';
if(!window.Desk||!Desk.office||!Desk.brk||!Desk.brk.register){console.warn('devroom: Desk/brk missing');return}
const O=Desk.office,B=Desk.brk,stage=document.getElementById('stage');if(!stage)return;
const C='#ff5a1f',C2='#ffb36b',K=()=>O.mobile?1:1.25,pick=a=>a[Math.random()*a.length|0];
const RM=matchMedia('(prefers-reduced-motion: reduce)');
/* ---------- concepts (names + tickers only) ---------- */
const SAMPLES=[{name:'Neon Noodle',ticker:'SAMPLE-A'},{name:'Disco Snail',ticker:'SAMPLE-B'},{name:'Cloud Toast',ticker:'SAMPLE-C'},{name:'Tiny Comet',ticker:'SAMPLE-D'}];
function concepts(){const d=Desk.data&&Desk.data.launcher_concepts;
 if(Array.isArray(d)&&d.length){const L=d.slice(0,6).map(c=>({name:String(c&&c.name||'').replace(/[^\w '.!&-]/g,'').slice(0,24),ticker:String(c&&c.ticker||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10)})).filter(c=>c.name&&c.ticker);if(L.length)return{list:L,sample:false}}
 return{list:SAMPLES,sample:true}}
/* ---------- canvas ---------- */
const FD=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'font');
function floorFont(cv,ctx){let min=11;const upd=()=>{const r=cv.getBoundingClientRect();if(r.width)min=Math.ceil(11*cv.width/r.width)};upd();addEventListener('resize',upd);setInterval(upd,2000);
 Object.defineProperty(ctx,'font',{configurable:true,get(){return FD.get.call(this)},set(v){FD.set.call(this,String(v).replace(/(\d+(?:\.\d+)?)px/,(m0,n)=>Math.max(+n,min)+'px'))}})}
const dc=document.createElement('canvas');dc.className='brk dev';dc.setAttribute('aria-label','Dev Room');stage.appendChild(dc);const X=dc.getContext('2d');floorFont(dc,X);try{floorFont(B.canvas,B.canvas.getContext('2d'))}catch(e){}
function geo(){const W=O.width,H=O.height,m=O.mobile,FT=H*(m?.66:.6);return{W,H,m,FT,FB:H*.97,
 door:{x:W*(m?.04:.02),w:W*(m?.16:.08),h:H*(m?.17:.36)},
 sign:m?{x:W*.06,y:H*.165,w:W*.88,h:H*.055}:{x:W*.14,y:H*.06,w:W*.4,h:H*.085},
 wall:m?{x:W*.04,y:H*.235,w:W*.92,h:H*.245}:{x:W*.62,y:H*.06,w:W*.34,h:H*.44},
 desk:m?{x:W*.24,w:W*.48}:{x:W*.26,w:W*.3},poster:m?{x:W*.05,y:H*.39,w:W*.16,h:H*.12}:{x:W*.14,y:H*.19,w:W*.09,h:H*.27},
 btn:{x:W*(m?.84:.6)},lamp:{x:W*(m?.96:.92)}}}
function spots(){const g=geo(),F=g.FT,H=g.H;return{door:{x:g.door.x+g.door.w/2,y:F+H*.05},desk:{x:g.desk.x+g.desk.w/2,y:F+H*.16},
 btn:{x:g.btn.x-(g.m?60:70),y:F+H*.1},wall:{x:g.wall.x+g.wall.w*(g.m?.5:.45),y:F+H*.14},pace:{x:g.W*(g.m?.5:.78),y:F+H*.26}}}
const rr=(x,y,w,h,r,f)=>B.R(X,x,y,w,h,r,f);
function txt(s,x,y,sz,c,w,al,wt){X.font=(wt||800)+' '+sz+'px Inter,sans-serif';X.textAlign=al||'left';X.fillStyle=c;X.fillText(s,x,y,w);X.textAlign='left'}
function room(t){const g=geo(),{W,H,FT,m}=g,at=RM.matches?0:t;
 // wall + aurora wash
 let gr=X.createLinearGradient(0,0,0,FT);gr.addColorStop(0,'#160a1c');gr.addColorStop(1,'#2a1222');X.fillStyle=gr;X.fillRect(0,0,W,FT);
 X.globalCompositeOperation='screen';[[C,.18],['#b46cff',.32],['#5cc8ff',.46]].forEach(([c,y],i)=>{X.strokeStyle=c+'22';X.lineWidth=H*.06;X.beginPath();for(let x=0;x<=W;x+=20)X.lineTo(x,FT*y+Math.sin(x/(W*.15)+at/2600+i)*H*.025);X.stroke()});X.globalCompositeOperation='source-over';
 // string lights
 X.strokeStyle='#3a2a30';X.lineWidth=2;X.beginPath();for(let x=0;x<=W;x+=10)X.lineTo(x,H*.012+Math.sin(x/W*Math.PI*4)*H*.01+H*.01);X.stroke();
 for(let i=0;i<24;i++){const x=W*(i+.5)/24,y=H*.022+Math.sin(x/W*Math.PI*4)*H*.01,c=['#ff5a1f','#ffd84a','#39ff88','#5cc8ff','#ff5cc8','#b46cff'][i%6],on=((at/400|0)+i)%5!==0;X.fillStyle=on?c:c+'55';X.shadowColor=c;X.shadowBlur=on?12:0;X.beginPath();X.arc(x,y+6,4.5,0,7);X.fill()}X.shadowBlur=0;
 // floor
 gr=X.createLinearGradient(0,FT,0,H);gr.addColorStop(0,'#2a1a1c');gr.addColorStop(1,'#120c0f');X.fillStyle=gr;X.fillRect(0,FT,W,H-FT);
 X.strokeStyle='rgba(255,140,90,.08)';X.lineWidth=2;for(let i=1;i<9;i++){const y=FT+(H-FT)*Math.pow(i/9,1.4);X.beginPath();X.moveTo(0,y);X.lineTo(W,y);X.stroke()}
 X.fillStyle='rgba(0,0,0,.35)';X.fillRect(0,FT-6,W,6);
 const fg=X.createRadialGradient(W*.42,FT+H*.15,10,W*.42,FT+H*.15,W*.45);fg.addColorStop(0,'rgba(255,90,31,.16)');fg.addColorStop(1,'rgba(255,90,31,0)');X.fillStyle=fg;X.fillRect(0,FT,W,H-FT);
 // neon sign
 const s=g.sign;rr(s.x,s.y,s.w,s.h,10,'#120708');X.strokeStyle=C;X.lineWidth=2;X.shadowColor=C;X.shadowBlur=16;X.beginPath();X.roundRect(s.x,s.y,s.w,s.h,10);X.stroke();X.shadowBlur=0;
 X.font='900 '+(s.h*.46|0)+'px Inter,sans-serif';X.textAlign='center';X.fillStyle='#ffe2cf';X.shadowColor=C;X.shadowBlur=18+5*Math.sin(at/350);X.fillText('ZERO SUPPLY · FEES ONLY',s.x+s.w/2,s.y+s.h*.66,s.w*.92);X.shadowBlur=0;X.textAlign='left';
 // rocket poster
 const p=g.poster;if(!m){rr(p.x,p.y,p.w,p.h,6,'#1b0f2a');X.strokeStyle='#b46cff';X.lineWidth=2;X.strokeRect(p.x+4,p.y+4,p.w-8,p.h-8);
 X.save();X.translate(p.x+p.w/2,p.y+p.h*.52);const ps=Math.min(p.w,p.h)/110;X.scale(ps,ps);rocket(at,1.4);X.restore();
 txt('DREAM BIG',p.x+p.w/2,p.y+p.h-10,Math.max(10,p.w*.11|0),'#ffd84a',p.w-10,'center',900)}
 // door back to breakroom
 const d=g.door,dy=FT-d.h;rr(d.x-6,dy-6,d.w+12,d.h+6,6,'#2b1d22');X.fillStyle='#0d0a12';X.fillRect(d.x,dy,d.w,d.h);X.strokeStyle='#5cc8ff';X.lineWidth=2;X.shadowColor='#5cc8ff';X.shadowBlur=14;X.strokeRect(d.x+4,dy+4,d.w-8,d.h-4);X.shadowBlur=0;
 if(m){txt('←',d.x+d.w/2,dy+d.h*.22,34,'#9fe0ff',d.w-8,'center',900);txt('BREAK',d.x+d.w/2,dy+d.h*.66,24,'#9fe0ff',d.w-10,'center',900);txt('ROOM',d.x+d.w/2,dy+d.h*.8,24,'#9fe0ff',d.w-10,'center',900)}else txt('← BREAKROOM',d.x+d.w/2,dy-12,15,'#9fe0ff',d.w+40,'center');X.font='22px sans-serif';X.textAlign='center';X.fillText('☕',d.x+d.w/2,dy+d.h*(m?.45:.45)+Math.sin(at/500)*3);X.textAlign='left';
 floor(at,g);conceptWall(at,g);desk(at,g);button(at,g);lava(at,g);plant(g)}
function rocket(t,f){X.fillStyle='#e8eef0';X.beginPath();X.moveTo(0,-34);X.quadraticCurveTo(14,-14,10,14);X.lineTo(-10,14);X.quadraticCurveTo(-14,-14,0,-34);X.fill();
 X.fillStyle=C;X.beginPath();X.moveTo(-10,4);X.lineTo(-20,20);X.lineTo(-10,14);X.fill();X.beginPath();X.moveTo(10,4);X.lineTo(20,20);X.lineTo(10,14);X.fill();
 X.fillStyle='#5cc8ff';X.beginPath();X.arc(0,-10,5,0,7);X.fill();
 const fl=(f||1)*(10+4*Math.sin(t/60));X.fillStyle='#ffd84a';X.shadowColor=C;X.shadowBlur=12;X.beginPath();X.moveTo(-7,15);X.lineTo(0,15+fl*1.5);X.lineTo(7,15);X.fill();X.shadowBlur=0}
function card(c,x,y,w,h,sample,t,hi){rr(x,y,w,h,8,hi?'#24110a':'#140c12');X.strokeStyle=hi?C:'#ff7a4a88';X.lineWidth=hi?2.5:1.5;X.beginPath();X.roundRect(x,y,w,h,8);X.stroke();
 const fs=Math.max(12,Math.min(h*.3,w*.12));txt(c.name,x+12,y+fs*1.25,fs,'#fff3ea',w-24,'left',900);txt('$'+c.ticker,x+12,y+fs*2.45,fs*.82,'#ffd0a8',w-24,'left',800);
 if(sample){X.font='900 '+(fs*.6)+'px Inter,sans-serif';const bw=X.measureText('SAMPLE').width+12,bh=parseFloat(X.font.match(/([\d.]+)px/)[1])*1.25;rr(x+w-bw-8,y+h-bh-8,bw,bh,4,'#ffd84a');X.fillStyle='#1a0b00';X.fillText('SAMPLE',x+w-bw-2,y+h-8-bh*.25)}}
function conceptWall(t,g){const b=g.wall,{list,sample}=concepts(),m=g.m;rr(b.x-6,b.y-6,b.w+12,b.h+12,10,'#2a1a22');rr(b.x,b.y,b.w,b.h,8,'#0d0a10');
 const fs=m?30:26;txt('CONCEPTS',b.x+16,b.y+fs*1.25,fs,'#ff8a5c',b.w*.45,'left',900);X.font='800 '+(fs*.5)+'px Inter,sans-serif';const sub=sample?'SAMPLE CARDS · concepts · simulated':'names + tickers only · concepts · simulated';
 if(m){txt(sub,b.x+16,b.y+fs*2.3,fs*.5,'#f0d8cc',b.w-32,'left',800)}else txt(sub,b.x+16,b.y+fs*2.2,fs*.5,'#f0d8cc',b.w-30,'left',700);
 const cols=2,gap=12,top=b.y+fs*(m?2.9:2.8),cw=(b.w-32-gap)/cols,rows=Math.ceil(Math.min(list.length,4)/cols),ch=Math.min(m?130:110,(b.h-(top-b.y)-14-gap*(rows-1))/rows);
 list.slice(0,4).forEach((c,i)=>card(c,b.x+16+(i%cols)*(cw+gap),top+(i/cols|0)*(ch+gap),cw,ch,sample,t,i===((t/3000|0)%Math.min(4,list.length))))}
function screen(i,x,y,w,h,t){X.fillStyle='#0a0812';X.fillRect(x,y,w,h);X.save();X.beginPath();X.rect(x,y,w,h);X.clip();
 if(i===0){for(let r=0;r<6;r++){const ww=w*(.3+.6*Math.abs(Math.sin(r*1.7+(t/2000|0))));X.fillStyle=['#ff8a5c','#9fe0ff','#ffd84a','#b9f5c9'][r%4]+'aa';X.fillRect(x+8+(r%3)*6,y+8+r*h/7,ww-20,Math.max(3,h/16))}}
 else if(i===1){X.strokeStyle='#39ff88';X.lineWidth=2;X.beginPath();for(let k=0;k<=20;k++){const xx=x+6+k*(w-12)/20,yy=y+h*.55-Math.sin(k*.6+t/900)*h*.22-k*h*.012;k?X.lineTo(xx,yy):X.moveTo(xx,yy)}X.stroke();X.font='900 '+(h*.18)+'px Inter,sans-serif';X.fillStyle='#ffe2cf';X.fillText('MOOD BOARD',x+8,y+h-10,w-16)}
 else{X.save();X.translate(x+w/2,y+h*.58);const sc=h/110;X.scale(sc,sc);rocket(t,1);X.restore();X.font='900 '+(h*.16)+'px Inter,sans-serif';X.fillStyle='#ffd84a';X.textAlign='center';X.fillText('CONCEPT LAB',x+w/2,y+h*.2,w-12);X.textAlign='left'}
 X.restore()}
function desk(t,g){const {FT,H,m}=g,d=g.desk,top=FT+H*(m?.02:.03),{list,sample}=concepts();
 // monitors
 const n=3,mw=d.w*.3,mh=H*(m?.09:.15),gap=d.w*.05,y0=top-mh-H*.03;for(let i=0;i<n;i++){const x=d.x+gap*.5+i*(mw+gap*.5)+(d.w-(n*mw+(n)*gap*.5))/2;
  rr(x-4,y0-4,mw+8,mh+8,6,'#2b2b33');X.fillStyle='#07060c';X.fillRect(x,y0,mw,mh);screen(i,x+4,y0+4,mw-8,mh-8,t);X.fillStyle='#3a3a44';X.fillRect(x+mw/2-4,y0+mh+4,8,H*.02)}
 X.fillStyle='rgba(255,90,31,.12)';X.fillRect(d.x,y0-10,d.w,mh+20);
 // desk
 rr(d.x-10,top,d.w+20,H*.025,6,'#4a2f2a');X.fillStyle='#2b1b18';X.fillRect(d.x,top+H*.025,d.w*.04,H*.07);X.fillRect(d.x+d.w*.96,top+H*.025,d.w*.04,H*.07);
 rr(d.x+d.w*.32,top-H*.012,d.w*.36,H*.014,3,'#20202a');for(let i=0;i<12;i++){X.fillStyle=i%4?'#3a3a48':C+'aa';X.fillRect(d.x+d.w*.33+i*d.w*.028,top-H*.01,d.w*.02,H*.008)}
 X.fillStyle='#e8e2d8';X.fillRect(d.x+d.w*.8,top-H*.022,H*.018,H*.022);X.fillStyle='#fff5';X.fillRect(d.x+d.w*.81,top-H*.03-Math.sin(t/200)*2,2,6)}
let pressed=0,sparks=[];
function floor(t,g){const {W,H,FT,m}=g,cx=W*(m?.5:.42),cy=FT+H*(m?.22:.24),rx=W*(m?.36:.2),ry=H*(m?.05:.07);
 X.fillStyle='#2a1420';X.beginPath();X.ellipse(cx,cy,rx,ry,0,0,7);X.fill();X.strokeStyle=C+'88';X.lineWidth=3;X.stroke();X.strokeStyle='#ffd84a44';X.lineWidth=2;X.beginPath();X.ellipse(cx,cy,rx*.75,ry*.7,0,0,7);X.stroke();
 X.save();X.translate(cx,cy);X.scale(1.6,.5);X.rotate(Math.PI/2);X.globalAlpha=.55;rocket(t,.5);X.restore();X.globalAlpha=1;
 // beanbag
 const bx=W*(m?.86:.68),by=FT+H*(m?.2:.3);X.fillStyle='#5a2a7a';X.beginPath();X.ellipse(bx,by,W*(m?.07:.04),H*(m?.03:.045),0,0,7);X.fill();X.strokeStyle='#b46cff';X.lineWidth=2;X.stroke();
 // hype drone circling over the floor
 const a=t/1800,dx=cx+Math.cos(a)*rx*.8,dy=cy-H*(m?.07:.1)+Math.sin(a*2)*H*.015;X.fillStyle='rgba(0,0,0,.25)';X.beginPath();X.ellipse(dx,cy+Math.sin(a)*ry*.6,18,5,0,0,7);X.fill();
 B.R(X,dx-16,dy-6,32,12,5,'#2b2b33');X.fillStyle=C;X.shadowColor=C;X.shadowBlur=10;X.beginPath();X.arc(dx,dy,3.5,0,7);X.fill();X.shadowBlur=0;X.strokeStyle='#9fe0ff';X.lineWidth=2;const sp=Math.sin(t/30)*12;X.beginPath();X.moveTo(dx-22-sp,dy-9);X.lineTo(dx-22+sp,dy-9);X.moveTo(dx+22-sp,dy-9);X.lineTo(dx+22+sp,dy-9);X.stroke();
 // drifting sparkles
 for(let i=0;i<14;i++){const sx=(i*173.3+t/40*(1+i%3))%W,sy=FT+((i*97)%(H-FT-40))-Math.sin(t/900+i)*10;X.fillStyle=['#ffd84a','#ff8a5c','#9fe0ff'][i%3]+'99';X.fillRect(sx,sy,3,3)}
 // desk chair
 const ch=spots().desk;X.fillStyle='#2b2b33';B.R(X,ch.x-30,ch.y-H*(m?.07:.09),60,H*(m?.05:.065),8,'#3a2030');X.fillStyle='#22161c';X.fillRect(ch.x-4,ch.y-H*(m?.02:.025),8,H*(m?.02:.025))}
let awayRect=null;
function away(t,g){const {W,H,FT,m}=g,w=W*(m?.8:.36),h=H*(m?.1:.12),x=W*(m?.5:.42)-w/2,y=FT+H*(m?.13:.12);awayRect={x,y,w,h};
 // hoodie draped on the chair
 const ch=spots().desk;X.fillStyle=C;X.globalAlpha=.85;X.beginPath();X.ellipse(ch.x,ch.y-H*(m?.07:.085),26,14,0,0,7);X.fill();X.globalAlpha=1;
 rr(x,y,w,h,14,'rgba(12,8,14,.92)');X.strokeStyle=C;X.lineWidth=2;X.beginPath();X.roundRect(x,y,w,h,14);X.stroke();
 txt('LAUNCHER · back soon',x+w/2,y+h*.42,m?32:24,'#fff3ea',w-24,'center',900);txt('In the breakroom ☕ · tap to visit',x+w/2,y+h*.78,m?24:16,'#ffd0b8',w-24,'center',700)}
function button(t,g){const {FT,H}=g,x=g.btn.x,y=FT+H*.05,s=g.m?1.6:1.1;rr(x-26*s,y-60*s,52*s,60*s,6,'#2b2b33');X.strokeStyle='#5cc8ff55';X.lineWidth=1.5;X.strokeRect(x-26*s,y-60*s,52*s,60*s);
 const dn=pressed>0?6:0;X.fillStyle='#4a0f0a';X.beginPath();X.ellipse(x,y-58*s,30*s,10*s,0,0,7);X.fill();X.fillStyle=C;X.shadowColor=C;X.shadowBlur=16+6*Math.sin(t/250);X.beginPath();X.ellipse(x,y-(68-dn)*s,24*s,10*s,0,0,7);X.fill();X.fillRect(x-24*s,y-(68-dn)*s,48*s,(10-dn)*s);X.shadowBlur=0;
 txt('PAPER',x,y-34*s,10*s,'#ffe9a8',48*s,'center',900);txt('LAUNCH',x,y-16*s,10*s,'#ffe9a8',48*s,'center',900);
 sparks.forEach(p=>{X.fillStyle=p.c;X.fillRect(p.x,p.y,4,4)})}
function lava(t,g){const {FT,H}=g,x=g.lamp.x,y=FT-2;X.fillStyle='#333';X.fillRect(x-10,y-14,20,14);X.fillStyle=C+'55';X.beginPath();X.moveTo(x-8,y-14);X.lineTo(x-4,y-70);X.lineTo(x+4,y-70);X.lineTo(x+8,y-14);X.fill();
 for(let i=0;i<3;i++){X.fillStyle=C2;X.beginPath();X.arc(x+Math.sin(t/900+i)*2,y-20-((t/40+i*18)%46),3+i,0,7);X.fill()}
 const gl=X.createRadialGradient(x,y-40,4,x,y-40,90);gl.addColorStop(0,'rgba(255,90,31,.22)');gl.addColorStop(1,'rgba(255,90,31,0)');X.fillStyle=gl;X.fillRect(x-90,y-130,180,180)}
function plant(g){const {FT,H,W,m}=g,x=W*(m?.2:.26),y=FT+H*.03;X.fillStyle='#5a3a2a';X.fillRect(x-14,y-22,28,24);X.fillStyle='#39ff88';[[-14,-50],[0,-62],[14,-48],[-6,-40],[8,-38]].forEach(([dx,dy])=>{X.beginPath();X.ellipse(x+dx/1.4,y-22+dy/2,6,14,dx/30,0,7);X.fill()})}
/* ---------- LAUNCHER ---------- */
const launcher={id:'launcher',col:C,col2:C,sw:26,hc:54,face:1,state:'idle',mood:0,jump:0,dance:0,room:'dev',bubble:null,
 brPref:['beanL','rug','couchL','beanR'],brSpeed:2.2,
 brLines:{any:['Hype check: the breakroom is undervalued. Vibes-wise.','Name first, art second, lore third.','If the ticker needs explaining, it is dead.','Brought snacks and three concepts.']},
 grab:['Whoa, mind the hoodie!','Unplanned liftoff!','This is NOT a launch!','Hype in the air!!'],land:['Stuck the landing. Ten out of ten.','Touchdown. Concept intact.','Smooth. Very smooth.'],
 lines:['Zero supply. Fees only. Clean.','Taste is the whole game.','No dev buy, no bundles, no snipes.','That name? Chef’s kiss.','Concepts only. Simulated. Still fun.','Mood board says: orange.','Naming is 80% of it.','Lore with no promises. That is the rule.'],
 body(X,t,held){const walk=this.state==='walk',s=walk?Math.sin(t/100)*4:0,blink=(t%4100)<120,c=this.col;
  X.fillStyle='#e8eef0';X.fillRect(-11+s,-24,7,24);X.fillRect(4-s,-24,7,24);
  B.blob(X,0,-52,25,30,c,150,31);
  // hoodie pocket + rocket chest patch
  X.strokeStyle=c+'aa';X.lineWidth=1.5;X.beginPath();X.roundRect(-14,-46,28,12,5);X.stroke();
  X.save();X.translate(0,-62);X.scale(.32,.32);rocket(t,walk?1.6:.6);X.restore();
  // hood (behind + rim)
  X.fillStyle='#3a1606';X.beginPath();X.ellipse(0,-99,30,30,0,0,7);X.fill();X.strokeStyle=c;X.lineWidth=2.5;X.shadowColor=c;X.shadowBlur=10;X.stroke();X.shadowBlur=0;
  B.blob(X,0,-98,21,20,c,90,17);
  X.strokeStyle=c;X.lineWidth=4;X.beginPath();X.arc(0,-98,25,Math.PI*1.05,Math.PI*1.95);X.stroke();
  // drawstrings
  X.strokeStyle='#ffe2cf';X.lineWidth=1.6;X.beginPath();X.moveTo(-7,-80);X.lineTo(-8,-68+s*.5);X.moveTo(7,-80);X.lineTo(8,-68-s*.5);X.stroke();X.fillStyle='#ffe2cf';X.fillRect(-10,-68+s*.5,4,4);X.fillRect(6,-68-s*.5,4,4);
  // face
  X.fillStyle='#fff1e6';if(!blink){X.fillRect(-9,-102,4,this.mood>0?2:5);X.fillRect(5,-102,4,this.mood>0?2:5)}X.strokeStyle='#fff1e6';X.lineWidth=2;X.beginPath();X.arc(0,-94,6,.15,Math.PI-.15);X.stroke();
  // front hand: mini launch button remote
  X.save();X.translate(26,-60);X.rotate(-.3+Math.sin(t/(walk?180:500))*.2+(this.jump?-.6:0));B.R(X,-7,-8,14,16,3,'#2b2b33');X.fillStyle=c;X.shadowColor=c;X.shadowBlur=10;X.beginPath();X.arc(0,-2,4.5,0,7);X.fill();X.shadowBlur=0;X.restore();
  if(!walk&&!held&&(t/1100|0)%3===0){X.fillStyle='#ffd84a';for(let i=0;i<3;i++){const a=t/260+i*2.1;X.fillRect(-40+Math.cos(a)*7,-112+Math.sin(a)*7,2.5,2.5)}}}};
const dv={x:0,y:0,tx:0,ty:0,arrived:true,act:'desk',timer:200,stay:2600,held:false,drop:false,vx:0,vy:0,fy:0,face:1,bub:null,leaving:false,pending:null};
launcher.dv=dv;
function place(act){const p=spots()[act];Object.assign(dv,{act,tx:p.x+(Math.random()*30-15),ty:p.y,arrived:false,timer:500+Math.random()*700})}
function chooseDev(){place(pick(['desk','desk','btn','wall','pace']))}
function devSay(t,ms){dv.bub={t:String(t),ttl:(ms||3200)/16}}
launcher.brDoor=()=>{const g=B.geo();return devDoorBrk(g).spot};
launcher.onExit=function(){this.room='dev';this.draggable=false;const s=spots();Object.assign(dv,{x:s.door.x,y:s.door.y,held:false,drop:false,leaving:false});chooseDev();if(Math.random()<.5)devSay(pick(['Back to the concept lab.','Breakroom recharged the hype.']),2600)};
launcher.toBrkFn=function(line){if(this.room==='brk'){if(line&&this.br)this.br.bub={t:line.text,mood:line.mood,to:null,ttl:(6000+String(line.text).length*70)/16};return}
 const s=spots();dv.pending=line||null;Object.assign(dv,{tx:s.door.x,ty:s.door.y,arrived:false,leaving:true});if(line)devSay('Brb, breakroom ☕',2000)};
function toBrk(){launcher.room='brk';launcher.state='idle';B.enter(launcher,dv.pending);dv.pending=null}
B.register(launcher,'LAUNCHER');
{const s=spots();dv.x=s.desk.x;dv.y=dv.fy=s.desk.y}
function stepDev(t){if(dv.bub&&--dv.bub.ttl<=0)dv.bub=null;if(launcher.jump>0)launcher.jump--;if(launcher.dance>0)launcher.dance--;if(pressed>0)pressed--;
 sparks.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.35;p.l--});sparks=sparks.filter(p=>p.l>0);hearts.forEach(h=>{h.y-=1.2;h.l--});hearts=hearts.filter(h=>h.l>0);
 if(launcher.room!=='dev'||dv.held)return;const g=geo();
 if(dv.drop){dv.vy+=1.2;dv.y+=dv.vy;dv.x+=dv.vx;dv.vx*=.96;if(dv.x<30){dv.x=30;dv.vx=-dv.vx*.6}if(dv.x>g.W-30){dv.x=g.W-30;dv.vx=-dv.vx*.6}
  if(dv.y>=dv.fy){dv.y=dv.fy;if(Math.abs(dv.vy)>3)dv.vy=-dv.vy*.45;else{dv.drop=false;dv.vy=0;dv.vx=0;chooseDev()}}return}
 if(!dv.arrived){const dx=dv.tx-dv.x,dy=dv.ty-dv.y,d=Math.hypot(dx,dy),sp=2*(O.mobile?.8:1)*(dv.leaving?1.5:1);
  if(d<sp){dv.x=dv.tx;dv.y=dv.ty;dv.arrived=true;if(dv.leaving){dv.leaving=false;toBrk();return}
   if(dv.act==='btn'){pressed=40;launcher.jump=20;for(let i=0;i<18;i++)sparks.push({x:g.btn.x,y:g.FT+g.H*.05-70,vx:(Math.random()-.5)*8,vy:-Math.random()*8-2,l:40,c:pick([C,'#ffd84a','#ff5cc8','#39ff88'])});devSay(pick(['Concept locked. Simulated, of course.','Boop. Paper launch only.','Confetti, no capital.']),3000)}
   else if(Math.random()<.55)devSay(pick(launcher.lines),3200)}
  else{dv.x+=dx/d*sp;dv.y+=dy/d*sp;if(Math.abs(dx)>1)dv.face=dx>=0?1:-1}return}
 if(--dv.timer<=0){if(--dv.stay<=0){dv.stay=2200+Math.random()*2400;launcher.toBrkFn(null)}else chooseDev()}else dv.stay--}
let hearts=[];
function bubble(x,y,t){const fs=O.mobile?18:20;X.font='bold '+fs+'px Inter,sans-serif';const lines=B.wrap(X,t,O.mobile?300:340),lh=fs*1.25,w=Math.min(O.mobile?330:380,Math.max(...lines.map(l=>X.measureText(l).width))+28),h=lines.length*lh+16,g=geo();
 const bx=Math.max(8,Math.min(g.W-w-8,x-w/2)),by=Math.max(8,y-h-14);rr(bx,by,w,h,12,'#140b08');X.strokeStyle=C;X.lineWidth=2;X.beginPath();X.roundRect(bx,by,w,h,12);X.stroke();
 X.fillStyle='#140b08';X.beginPath();X.moveTo(x-8,by+h-1);X.lineTo(x,by+h+12);X.lineTo(x+8,by+h-1);X.fill();X.fillStyle='#ffe2cf';lines.forEach((l,i)=>X.fillText(l,bx+14,by+8+lh*(i+.8),w-28))}
function draw(t){const g=geo();if(dc.width!==g.W||dc.height!==g.H){dc.width=g.W;dc.height=g.H}room(t);const k=K();
 if(launcher.room==='dev'){const walk=!dv.arrived||dv.held,gy=dv.held||dv.drop?dv.fy:dv.y;let y=dv.y;if(walk&&!dv.held)y-=Math.abs(Math.sin(t/100))*7;if(launcher.jump>0)y-=Math.abs(Math.sin(launcher.jump/5))*24;
  X.fillStyle='rgba(0,0,0,.35)';X.beginPath();X.ellipse(dv.x,gy+6,26*k,8*k,0,0,7);X.fill();
  if(dv.held){X.strokeStyle=C+'99';X.setLineDash([3,6]);X.lineWidth=1.5;X.beginPath();X.moveTo(dv.x,0);X.lineTo(dv.x,y-124*k);X.stroke();X.setLineDash([])}
  const st=launcher.state;launcher.state=walk?'walk':'idle';X.save();X.translate(dv.x,y);X.scale(k,k);X.rotate(dv.held?Math.sin(t/160)*.22:launcher.dance>0?Math.sin(launcher.dance/4)*.35:0);B.glow(X,0,-54,80,C,t);X.save();X.scale(dv.face,1);try{launcher.body(X,t,dv.held)}catch(e){}X.restore();X.restore();launcher.state=st;
  hearts.forEach(h=>{X.globalAlpha=Math.min(1,h.l/30);X.font='22px sans-serif';X.fillText(h.c,h.x,h.y);X.globalAlpha=1});
  if(dv.bub)bubble(dv.x,y-128*k,dv.bub.t)}
 else away(t,g);if(launcher.room==='dev')awayRect=null;
 const fh=g.m?40:30;X.fillStyle='rgba(5,7,10,.85)';X.fillRect(0,g.H-fh,g.W,fh);txt(g.m?'Dev Room · concepts · simulated · not advice':'Dev Room · concepts · simulated · paper only · nothing here is financial advice',g.W/2,g.H-fh*.3,14,'#e3ece8',g.W-20,'center',600)}
(function loop(t){try{stepDev(t);if(B.view()==='dev')draw(t)}catch(e){console.warn('devroom',e)}requestAnimationFrame(loop)})(0);
/* ---------- view: tab, follow chip, door in the breakroom ---------- */
B.onView(v=>{dc.classList.toggle('show',v==='dev');roomLabel(v)});
function roomLabel(v){const a=document.querySelector('header nav a[href="#office"]');if(!a)return;let sp=a.querySelector('.rm-sub');if(!sp){sp=document.createElement('span');sp.className='rm-sub';a.appendChild(sp)}
 sp.textContent=v==='dev'?' · Dev Room':v==='brk'?' · Breakroom':'';sp.dataset.v=v;B.nav.dataset.room=v}
{const tabs=B.nav.querySelector('.brk-tabs');if(tabs){const b=document.createElement('button');b.dataset.v='dev';b.setAttribute('role','tab');b.textContent='🚀 Dev Room';tabs.appendChild(b)}
 const fol=B.nav.querySelector('.brk-fol');if(fol){const b=document.createElement('button');b.dataset.f='launcher';b.style.setProperty('--c',C);b.title='Follow LAUNCHER';b.setAttribute('aria-label','Follow Launcher');b.textContent='🚀';fol.appendChild(b)}}
function devDoorBrk(g){const m=g.m,x=g.W*(m?.318:.218),w=g.W*(m?.1:.047),h=g.H*(m?.17:.29);return{x,w,h,y:g.FT-h,spot:{x:x+w/2,y:g.FT+g.H*.05}}}
B.layers.bg.push((X2,t,g)=>{const d=devDoorBrk(g);B.R(X2,d.x-5,d.y-5,d.w+10,d.h+5,5,'#2b1d22');X2.fillStyle='#120708';X2.fillRect(d.x,d.y,d.w,d.h);X2.strokeStyle=C;X2.lineWidth=2;X2.shadowColor=C;X2.shadowBlur=14;X2.strokeRect(d.x+3,d.y+3,d.w-6,d.h-3);X2.shadowBlur=0;
 X2.fillStyle='#ffd84a';X2.beginPath();X2.arc(d.x+d.w*.8,d.y+d.h*.55,3,0,7);X2.fill();X2.font='900 '+(g.m?12:13)+'px Inter,sans-serif';X2.textAlign='center';X2.fillStyle=C;X2.shadowColor=C;X2.shadowBlur=10;if(g.m){X2.fillText('DEV',d.x+d.w/2,d.y+d.h*.2,d.w-6);X2.fillText('ROOM',d.x+d.w/2,d.y+d.h*.36,d.w-6);X2.fillText('→',d.x+d.w/2,d.y+d.h*.85,d.w-6)}else{X2.fillText('DEV',d.x+d.w/2,d.y-20);X2.fillText('ROOM →',d.x+d.w/2,d.y-6)}X2.shadowBlur=0;
 X2.font='18px sans-serif';X2.fillText('🚀',d.x+d.w/2,d.y+d.h*(g.m?.6:.4)+Math.sin(t/450)*3);X2.textAlign='left'});
B.canvas.addEventListener('pointerdown',e=>{if(B.view()!=='brk')return;const p=B.toCanvas(e.clientX,e.clientY),d=devDoorBrk(B.geo());if(p.x>d.x&&p.x<d.x+d.w&&p.y>d.y&&p.y<d.y+d.h){e.preventDefault();e.stopImmediatePropagation();B.setView('dev')}},true);
/* ---------- dev room drag / toss / tap / headpat / dance ---------- */
const toC=(cx,cy)=>{const r=dc.getBoundingClientRect();return{x:(cx-r.left)/r.width*dc.width,y:(cy-r.top)/r.height*dc.height}};
function hitL(p){if(launcher.room!=='dev')return null;const k=K(),top=dv.y-(54*2+30)*k;if(p.y<top||p.y>dv.y+12||Math.abs(p.x-dv.x)>26*k+26)return null;return{head:p.y<dv.y-54*1.45*k}}
const TAP=['Tap confirmed. Hype levels rising!','You have taste. I can tell.','Careful, that is the concept hand.','Zero supply, fees only, full send on vibes.'],PAT=['Hood up, heart full.','Headpat noted in the concept log.'],DANCE=['LIFTOFF SHUFFLE!','Countdown dance: 3, 2, 1…'];
let drag=null,lastTap=0,tmr=0;
dc.addEventListener('pointerdown',e=>{const p=toC(e.clientX,e.clientY),g=geo(),d=g.door;
 if(p.x>d.x&&p.x<d.x+d.w&&p.y>g.FT-d.h&&p.y<g.FT){e.preventDefault();B.setView('brk');return}
 if(awayRect&&p.x>awayRect.x&&p.x<awayRect.x+awayRect.w&&p.y>awayRect.y&&p.y<awayRect.y+awayRect.h){e.preventDefault();B.setView('brk');return}
 const h=hitL(p);if(!h)return;e.preventDefault();try{dc.setPointerCapture(e.pointerId)}catch(_){}drag={id:e.pointerId,hx:[p.x],oy:p.y-dv.y,sx:p.x,sy:p.y,moved:false,head:h.head,t:performance.now()};dv.fy=dv.y});
dc.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const p=toC(e.clientX,e.clientY);
 if(!drag.moved&&Math.hypot(p.x-drag.sx,p.y-drag.sy)>8){drag.moved=true;dv.held=true;dv.drop=false;devSay(pick(launcher.grab),1900)}
 if(drag.moved){dv.x=p.x;dv.y=Math.min(p.y-drag.oy,geo().FB);drag.hx.push(p.x);if(drag.hx.length>5)drag.hx.shift()}});
const up=e=>{if(!drag||e.pointerId!==drag.id)return;const D=drag;drag=null;try{dc.releasePointerCapture(e.pointerId)}catch(_){}
 if(D.moved){dv.held=false;dv.drop=true;dv.vy=0;const h=D.hx;dv.vx=h.length>1?(h[h.length-1]-h[0])/(h.length-1):0;const g=geo();dv.fy=Math.max(g.FT+g.H*.03,Math.min(g.FB-g.H*.03,dv.fy||dv.y));if(dv.y>dv.fy)dv.y=dv.fy;setTimeout(()=>devSay(pick(launcher.land),2400),500);return}
 if(e.type==='pointercancel')return;const now=performance.now(),k=K(),hy=dv.y-118*k;
 if(now-lastTap<320){clearTimeout(tmr);lastTap=0;launcher.dance=110;launcher.jump=30;devSay(pick(DANCE),2600);hearts.push({x:dv.x,y:hy,l:60,c:'♪'});return}
 lastTap=now;clearTimeout(tmr);tmr=setTimeout(()=>{lastTap=0;if(D.head){launcher.mood=1;setTimeout(()=>launcher.mood=0,2500);devSay(pick(PAT),2600);hearts.push({x:dv.x-8,y:hy,l:60,c:'❤'})}else{launcher.jump=30;devSay(pick(TAP),2400)}},260)};
dc.addEventListener('pointerup',up);dc.addEventListener('pointercancel',up);
/* ---------- dock card ---------- */
function dockCard(){const box=document.getElementById('minis'),bub=document.getElementById('mbub');if(!box||box.querySelector('[aria-label="LAUNCHER"]'))return;
 const el=document.createElement('div');el.className='mini';el.style.setProperty('--c',C);el.setAttribute('role','button');el.setAttribute('aria-label','LAUNCHER');el.tabIndex=0;
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#05070a';g.fillRect(0,0,128,128);g.save();g.translate(64,190);g.scale(1.25,1.25);try{launcher.body.call(Object.assign(Object.create(launcher),{state:'idle',mood:0,jump:0}),g,0,false)}catch(e){}g.restore();
 el.innerHTML='<div class="h"><div class="lid"></div></div><div class="nm">LAUNCHER</div>';el.querySelector('.h').style.backgroundImage='url('+c.toDataURL()+')';box.appendChild(el);
 const E=s=>(Desk.utils&&Desk.utils.E?Desk.utils.E(s):String(s??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])));
 let hide=0;const html=()=>{const lines=(Desk.data&&Desk.data.breakroom||[]).filter(l=>l.agent==='launcher'),last=lines[lines.length-1],cc=concepts();
  return `<b>LAUNCHER</b><br>Where: <b>${launcher.room==='brk'?'breakroom':'dev room'}</b><br>${last?'Last said: '+E(last.text):'Sketching concepts at the dev desk.'}<br>On the wall: ${cc.list.slice(0,3).map(x=>E(x.name)).join(', ')}${cc.sample?' (samples)':''}<br><span class="mt">launcher · concepts · simulated (does not trade)</span>`};
 const open=()=>{if(!bub)return;if(bub.style.display==='block'&&bub._l){bub.style.display='none';bub._l=false;return}
  bub.style.setProperty('--c',C);bub.style.borderColor=C;bub._refresh=html;bub._pos=null;bub.innerHTML=html();bub.style.display='block';bub._l=true;const r=el.getBoundingClientRect();bub.style.left=Math.max(6,Math.min(innerWidth-bub.offsetWidth-6,r.left+r.width/2-bub.offsetWidth/2))+'px';bub.style.top=Math.max(56,r.top-bub.offsetHeight-12)+'px';
  clearTimeout(hide);hide=setTimeout(()=>{bub.style.display='none';bub._l=false},8000);if(launcher.room==='dev')devSay('Hey! Want to see the concept wall?',2400);else B.say(launcher,'Hey! Concepts in the back.',2400)};
 el.addEventListener('click',open);el.addEventListener('pointerup',e=>e.stopPropagation())}
if(document.readyState==='complete')setTimeout(dockCard,20);else addEventListener('load',()=>setTimeout(dockCard,20));
B.nav.querySelectorAll('.brk-fol [data-f]').forEach(b=>{if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.title||('Follow '+b.dataset.f))});
B.nav.querySelectorAll('.brk-tabs [data-v]').forEach(b=>b.setAttribute('aria-label',{office:'Office',brk:'Breakroom',dev:'Dev Room'}[b.dataset.v]||b.textContent));
window.DeskDev={launcher,geo,spots,concepts,view:()=>B.view()==='dev'};
})();
