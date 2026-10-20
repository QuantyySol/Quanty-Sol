/* breakroom.js : the BREAKROOM (lounge) next door + DESIGNER bot.
   Couch, beanbags, lamp, rug, plants, arcade, snack fridge, aurora window, TOP 5 DAYS board, doorway to the office.
   Idle agents wander in, sit, nap, play arcade; Ledger raids the fridge; everyone rushes back on a new trade.
   Shows desk.json `breakroom` lines as comic bubbles (reply_to arrows) and in a collapsible chat log.
   Exposes Desk.brk for interact.js. Uses window.Desk only. View only, paper trading only. */
(function(){
'use strict';
if(!window.Desk||!Desk.office){console.warn('breakroom: Desk API missing');return}
const O=Desk.office,stage=document.getElementById('stage');if(!stage)return;
const pick=a=>a[Math.random()*a.length|0],E=s=>(Desk.utils&&Desk.utils.E?Desk.utils.E(s):String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));
const COL={quanty:'#39ff88',ledger:'#ffbf3f',twitter:'#5cc8ff',designer:'#b46cff'},LAB={quanty:'QUANTY',ledger:'LEDGER',twitter:'TWITTER',designer:'DESIGNER'};
const K=()=>O.mobile?1:1.25;
/* ---------- shared drawing helpers (dotted neon silhouettes) ---------- */
function dots(X,cx,cy,rx,ry,n,seed,col){X.fillStyle=col;for(let i=0;i<n;i++){const a=(i*137.5+seed)%360*Math.PI/180,r=Math.sqrt(((i*7919)%n)/n);X.fillRect(cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r,1.6,1.6)}}
function blob(X,cx,cy,rx,ry,col,n,seed){X.fillStyle='#0b0f12';X.beginPath();X.ellipse(cx,cy,rx,ry,0,0,7);X.fill();X.strokeStyle=col;X.lineWidth=2;X.shadowColor=col;X.shadowBlur=14;X.stroke();X.shadowBlur=0;dots(X,cx,cy,rx-2,ry-2,n,seed,'rgba(255,255,255,.78)')}
function glow(X,cx,cy,r,col,t){const g=X.createRadialGradient(cx,cy,4,cx,cy,r),a=.2+.08*Math.sin(t/700);g.addColorStop(0,col+Math.round(a*255).toString(16).padStart(2,'0'));g.addColorStop(1,col+'00');X.fillStyle=g;X.beginPath();X.ellipse(cx,cy,r,r*.9,0,0,7);X.fill()}
function R(X,x,y,w,h,r,f){X.fillStyle=f;X.beginPath();X.roundRect(x,y,w,h,r);X.fill()}
function office_bubble(X,a,y){if(!a.bubble)return;const W=O.width;X.font='bold '+(O.mobile?18:20)+'px Inter,sans-serif';const tw=Math.min(X.measureText(a.bubble.t).width+26,W*.55);
 const bx=Math.max(10,Math.min(W-tw-10,a.x-tw/2)),by=Math.max(8,y-(a.hc*2+50)*K());R(X,bx,by,tw,36,12,'#0b1210');X.strokeStyle=a.bubble.c;X.lineWidth=2;X.beginPath();X.roundRect(bx,by,tw,36,12);X.stroke();X.fillStyle=a.bubble.c;X.fillText(a.bubble.t,bx+13,by+24,tw-26)}
/* ---------- DESIGNER bot: beret, stylus, paint palette, purple ---------- */
const designer={id:'designer',col:COL.designer,col2:COL.designer,speed:1.6,sw:26,hc:52,side:1,draggable:true,x:0,y:0,fy:0,tx:0,ty:0,state:'idle',timer:200,bubble:null,bt:0,mood:0,jump:0,vy:0,face:1,rush:false,
 grab:['Careful, I am still drying!','My stylus!!','This is not in the style guide.','Wheee, motion study!'],
 land:['Kerning restored.','Nailed the landing. 8px grid.','Ta-da. Very on-brand.'],
 lines:['Needs more contrast.','Padding: 16px. Always.','That bubble is 2px off.','Aurora but make it subtle.','Dotted silhouettes are my thing.','Type scale: sorted.','Shipping polish, not pixels.'],
 say(t,ms,c){this.bubble={t:String(t),c:c||this.col};this.bt=(ms||3500)/16},
 go(x,y){const f=O.floorBounds();this.tx=Math.max(f.xMin,Math.min(f.xMax,x));this.ty=Math.max(f.yMin,Math.min(f.yMax,y));this.state='walk'},
 visit(){const d=O.spots().desk;this.go(d.x+(O.mobile?-200:240),d.y+20)},
 wander(){const s=O.spots(),n=Object.keys(s).filter(k=>k!=='desk'),p=s[pick(n)];this.go(p.x+Math.random()*120-60,p.y+Math.random()*30)},
 step(t){if(this.bt>0&&--this.bt<=0)this.bubble=null;if(this.jump>0)this.jump--;if(this.room)return;if(this.state==='held')return;
  if(this.state==='drop'){this.vy+=1.2;this.y+=this.vy;if(this.y>=this.fy){this.y=this.fy;if(Math.abs(this.vy)>3)this.vy=-this.vy*.45;else{this.vy=0;this.state='idle';this.timer=200}}return}
  if(this.state==='walk'){const dx=this.tx-this.x,dy=this.ty-this.y,d=Math.hypot(dx,dy),sp=this.speed*(this.rush?2.4:1)*(O.mobile?.7:1);
   if(d<sp){this.x=this.tx;this.y=this.fy=this.ty;this.rush=false;this.state='idle';this.timer=300+Math.random()*500;if(Math.random()<.4)this.say(pick(this.lines),3200)}
   else{this.x+=dx/d*sp;this.y+=dy/d*sp;this.fy=this.y;if(Math.abs(dx)>1)this.face=dx>=0?1:-1}}
  else if(--this.timer<=0){Math.random()<.3?this.visit():this.wander()}},
 lift(t){return this.state==='walk'?Math.abs(Math.sin(t/110))*6:0},
 body(X,t,held){const walk=this.state==='walk',s=walk?Math.sin(t/110)*4:0,blink=(t%3700)<120,c=this.col;
  X.fillStyle='#e8eef0';X.fillRect(-11+s,-24,7,24);X.fillRect(4-s,-24,7,24);
  blob(X,0,-52,24,30,c,150,7);
  // palette (back hand)
  X.save();X.translate(-26,-56);X.rotate(-.35);X.fillStyle='#2a1838';X.beginPath();X.ellipse(0,0,15,11,0,0,7);X.fill();X.strokeStyle=c;X.lineWidth=1.5;X.stroke();
  ['#ff5cc8','#39ff88','#5cc8ff','#ffbf3f'].forEach((q,i)=>{X.fillStyle=q;X.beginPath();X.arc(-7+i*5,-3+(i%2)*5,2.6,0,7);X.fill()});X.restore();
  blob(X,0,-100,22,21,c,90,13);
  // beret
  X.fillStyle='#3b1f5c';X.beginPath();X.ellipse(-3,-119,23,8,-.18,0,7);X.fill();X.strokeStyle=c;X.lineWidth=1.5;X.stroke();X.fillStyle='#3b1f5c';X.fillRect(-2,-131,4,6);
  // face
  X.fillStyle='#f3e6ff';if(!blink){X.fillRect(-9,-104,4,this.mood>0?2:4);X.fillRect(5,-104,4,this.mood>0?2:4)}X.strokeStyle='#f3e6ff';X.lineWidth=2;X.beginPath();X.arc(0,-96,5,.2,Math.PI-.2);X.stroke();
  // stylus (front hand), draws a little sparkle trail
  X.save();X.translate(24,-62);X.rotate(-.7+Math.sin(t/(walk?200:420))*.25+(this.jump?-.5:0));X.fillStyle='#e8eef0';X.fillRect(-2,-26,4,26);X.fillStyle=c;X.shadowColor=c;X.shadowBlur=10;X.beginPath();X.arc(0,-28,3,0,7);X.fill();X.shadowBlur=0;X.restore();
  if(!walk&&!held&&(t/900|0)%3===0){X.fillStyle=c;for(let i=0;i<3;i++){const a=t/300+i*2.1;X.fillRect(38+Math.cos(a)*8,-96+Math.sin(a)*8,2.5,2.5)}}},
 draw(X,t){if(this.room)return;const k=K(),held=this.state==='held',gy=(held||this.state==='drop')?this.fy:this.y;let y=this.y-this.lift(t);if(this.jump)y-=Math.abs(Math.sin(this.jump/5))*24;
  X.fillStyle='rgba(0,0,0,.35)';X.beginPath();X.ellipse(this.x,gy+6,this.sw*k,8*k,0,0,7);X.fill();
  if(held){X.strokeStyle=this.col+'99';X.setLineDash([3,6]);X.lineWidth=1.5;X.beginPath();X.moveTo(this.x,0);X.lineTo(this.x,y-(this.hc+70)*k);X.stroke();X.setLineDash([])}
  X.save();X.translate(this.x,y);X.scale(k,k);X.rotate(held?Math.sin(t/160)*.22:(this.dance>0?Math.sin(this.dance/4)*.35:0));glow(X,0,-this.hc,this.hc*1.5,this.col,t);X.save();X.scale(this.face,1);this.body(X,t,held);X.restore();X.restore()}};
{const f=O.floorBounds();designer.x=Math.min(f.xMax,O.spots().desk.x+(O.mobile?-220:300));designer.y=designer.fy=f.yMin+40;O.addActor(designer)}
/* Quanty's breakroom stand-in (Quanty keeps running the desk in the office; this is his coffee-break hologram) */
const qhead=new Image();qhead.src='assets/robot_head.png';
const quanty={id:'quanty',col:COL.quanty,hc:58,sw:30,face:1,state:'idle',
 body(X,t){X.fillStyle='#e8eef0';X.fillRect(-14,-26,9,26);X.fillRect(5,-26,9,26);blob(X,0,-56,28,30,this.col,150,21);R(X,-14,-62,28,10,4,'#04120a');X.fillStyle=this.col;X.fillRect(-10,-59,20*(.5+.5*Math.sin(t/300)),4);
  X.save();X.beginPath();X.arc(0,-108,24,0,7);X.clip();if(qhead.complete&&qhead.naturalWidth)X.drawImage(qhead,-24,-132,48,48);else{X.fillStyle='#0b1a12';X.fill()}X.restore();X.strokeStyle=this.col;X.lineWidth=2;X.shadowColor=this.col;X.shadowBlur=12;X.beginPath();X.arc(0,-108,24,0,7);X.stroke();X.shadowBlur=0;
  R(X,26,-74,14,16,3,'#cfe3ea');X.fillStyle='#fff6';X.fillRect(29,-82+Math.sin(t/200)*2,2,6)}};
const L=()=>Desk.actors.find(a=>a.id==='ledger'),T=()=>Desk.actors.find(a=>a.id==='twitter');
const EXTRA={},VH=[];const AG=()=>Object.assign({ledger:L(),twitter:T(),designer,quanty},EXTRA);
/* ---------- breakroom canvas ---------- */
const cv=document.createElement('canvas');cv.className='brk';cv.setAttribute('aria-label','Breakroom');stage.appendChild(cv);const X=cv.getContext('2d');
let view='office',follow=null;
function geo(){const W=O.width,H=O.height,m=O.mobile,FT=H*(m?.66:.6);return{W,H,m,FT,FB:H*.97,
 door:{x:W*(m?.03:.02),w:W*(m?.12:.08),h:H*(m?.2:.36)},fridge:{x:W*(m?.17:.13),w:W*(m?.14:.085),h:H*(m?.2:.34)},
 win:m?{x:W*.05,y:H*.085,w:W*.9,h:H*.1}:{x:W*.27,y:H*.07,w:W*.34,h:H*.34},
 lb:m?{x:W*.05,y:H*.21,w:W*.9,h:H*.235}:{x:W*.635,y:H*.07,w:W*.225,h:H*.42},
 arcade:{x:W*(m?.8:.885),w:W*(m?.15:.08),h:H*(m?.2:.33)},couch:{x:W*(m?.5:.45),w:W*(m?.44:.25)},lamp:{x:W*(m?.42:.6)}}}
function spots(){const g=geo(),W=g.W,F=g.FT,H=g.H,m=g.m;return{door:{x:g.door.x+g.door.w/2,y:F+H*.05},fridge:{x:g.fridge.x+g.fridge.w*.5,y:F+H*.06},
 couchL:{x:g.couch.x-g.couch.w*.22,y:F+H*(m?.08:.12)},couchR:{x:g.couch.x+g.couch.w*.22,y:F+H*(m?.08:.12)},beanL:{x:W*(m?.2:.28),y:F+H*(m?.2:.25)},beanR:{x:W*(m?.78:.7),y:F+H*(m?.2:.25)},
 arcade:{x:g.arcade.x+g.arcade.w*.45,y:F+H*.07},rug:{x:g.couch.x,y:F+H*(m?.2:.27)}}}
const ACTS=['couchL','couchR','beanL','beanR','arcade','fridge','rug'];
const fx={office:[],brk:[]},LAY={bg:[]};
function addFx(room,x,y,kind){const L=fx[room];for(let i=0;i<(kind==='star'?14:7);i++)L.push({x,y,vx:(Math.random()-.5)*(kind==='star'?9:3),vy:-Math.random()*(kind==='star'?7:3)-1.5,l:60+Math.random()*30,kind});if(L.length>200)L.splice(0,L.length-200)}
function drawFx(X,room){const L=fx[room];for(let i=L.length-1;i>=0;i--){const p=L[i];p.x+=p.vx;p.y+=p.vy;p.vy+=p.kind==='heart'?-.02:.18;p.l--;if(p.l<=0){L.splice(i,1);continue}
 X.globalAlpha=Math.min(1,p.l/30);if(p.kind==='heart'){X.fillStyle='#ff5cc8';X.font='bold 22px sans-serif';X.fillText('♥',p.x,p.y)}else if(p.kind==='note'){X.fillStyle='#b46cff';X.font='bold 22px sans-serif';X.fillText('♪',p.x,p.y)}else{X.fillStyle=pick(['#ffd84a','#39ff88','#5cc8ff','#ff5cc8']);X.fillRect(p.x,p.y,5,5)}}X.globalAlpha=1}
Desk.on('frame',X=>{try{drawFx(X,'office');bubbles(X)}catch(e){}});
/* office speech bubbles, laid out so they never stack on each other or over the VS board */
function bubbles(X){const W=O.width,k=K(),fs=O.mobile?18:20,A=[L(),T(),designer].filter(a=>a&&!a.room&&a.bubble);if(!A.length)return;X.font='bold '+fs+'px Inter,sans-serif';
 const placed=[],vr=window.DeskVS&&DeskVS.rect?DeskVS.rect():null,hit=(r,o)=>r.x<o.x+o.w&&r.x+r.w>o.x&&r.y<o.y+o.h&&r.y+r.h>o.y;
 const q=Desk.quanty;if(q&&q.bubble){X.font='bold '+fs+'px Inter,sans-serif';const w=Math.min(X.measureText(String(q.bubble.t)).width+30,W*.5);placed.push({x:q.x-w/2,y:q.y-(O.mobile?190:240),w,h:44})}
 if(vr)placed.push({x:vr.x-4,y:vr.y-4,w:vr.w+8,h:vr.h+8});
 A.sort((p,q2)=>p.x-q2.x).forEach(a=>{const tw=Math.min(X.measureText(a.bubble.t).width+26,W*.5),h=36;let r={x:Math.max(10,Math.min(W-tw-10,a.x-tw/2)),y:Math.max(8,a.y-(a.hc*2+50)*k),w:tw,h};
  for(let i=0;i<8&&placed.some(o=>hit(r,o));i++){const o=placed.find(o2=>hit(r,o2));if(vr&&o.y===vr.y-4&&o.h===vr.h+8)r.y=o.y+o.h+6;else r.y=o.y-h-6;if(r.y<8){r.y=o.y+o.h+6}}
  placed.push(r);R(X,r.x,r.y,r.w,h,12,'#0b1210');X.strokeStyle=a.bubble.c;X.lineWidth=2;X.beginPath();X.roundRect(r.x,r.y,r.w,h,12);X.stroke();X.fillStyle=a.bubble.c;X.fillText(a.bubble.t,r.x+13,r.y+24,r.w-26)})}
/* furniture */
function room(X,t){const g=geo(),{W,H,FT}=g;
 const bg=X.createLinearGradient(0,0,0,FT);bg.addColorStop(0,'#120c1e');bg.addColorStop(1,'#0c1018');X.fillStyle=bg;X.fillRect(0,0,W,FT);
 X.fillStyle='rgba(180,108,255,.06)';for(let x=12;x<W;x+=26)for(let y=12;y<FT;y+=26)X.fillRect(x,y,2,2);
 for(let i=0;i<W;i+=80){X.fillStyle=(i/80)%2?'#1a1310':'#1e1612';X.fillRect(i,FT,80,H-FT)}X.fillStyle='#2a1f33';X.fillRect(0,FT-6,W,8);
 // window + aurora
 const w=g.win;R(X,w.x-10,w.y-10,w.w+20,w.h+20,10,'#2a2238');X.fillStyle='#03060c';X.fillRect(w.x,w.y,w.w,w.h);X.save();X.beginPath();X.rect(w.x,w.y,w.w,w.h);X.clip();
 for(let i=0;i<40;i++){X.fillStyle='rgba(255,255,255,'+(.3+.3*Math.sin(t/500+i))+')';X.fillRect(w.x+(i*97)%w.w,w.y+(i*53)%(w.h*.6),2,2)}
 ['#39ff88','#b46cff','#5cc8ff'].forEach((c,i)=>{X.strokeStyle=c+'66';X.lineWidth=w.h*.12;X.shadowColor=c;X.shadowBlur=20;X.beginPath();for(let x=w.x;x<=w.x+w.w;x+=8)X.lineTo(x,w.y+w.h*(.35+i*.14)+Math.sin(x/40+t/1300+i*1.7)*w.h*.08);X.stroke()});X.shadowBlur=0;
 X.fillStyle='#0a0d14';X.beginPath();X.moveTo(w.x,w.y+w.h);for(let x=0;x<=w.w;x+=20)X.lineTo(w.x+x,w.y+w.h*(.85-.08*Math.sin(x/37)));X.lineTo(w.x+w.w,w.y+w.h);X.fill();X.restore();
 X.fillStyle='#2a2238';X.fillRect(w.x+w.w/2-3,w.y,6,w.h);
 // door back to office
 const d=g.door,dy=FT-d.h;R(X,d.x-6,dy-6,d.w+12,d.h+6,6,'#2a2238');X.fillStyle='#070a10';X.fillRect(d.x,dy,d.w,d.h);X.strokeStyle='#39ff88';X.lineWidth=2;X.shadowColor='#39ff88';X.shadowBlur=12;X.strokeRect(d.x+4,dy+4,d.w-8,d.h-4);X.shadowBlur=0;
 X.fillStyle='#39ff88';X.font='800 '+(g.m?16:18)+'px Inter,sans-serif';if(g.m){X.textAlign='left';X.fillText('← OFFICE',Math.max(6,d.x-2),dy-14)}else{X.textAlign='center';X.fillText('← OFFICE',d.x+d.w/2,dy-14)}X.textAlign='left';
 // fridge
 const f=g.fridge,fy=FT-f.h,open=Desk.brk&&Object.values(AG()).some(a=>a&&a.room==='brk'&&a.br&&a.br.act==='fridge'&&a.br.arrived);
 R(X,f.x,fy,f.w,f.h,8,'#dfe7ea');X.fillStyle='#b9c6cb';X.fillRect(f.x,fy+f.h*.38,f.w,3);R(X,f.x+f.w-12,fy+14,5,f.h*.18,2,'#8a9aa0');R(X,f.x+f.w-12,fy+f.h*.48,5,f.h*.22,2,'#8a9aa0');
 if(open){X.fillStyle='rgba(255,246,200,.55)';X.beginPath();X.moveTo(f.x+f.w,fy+f.h*.4);X.lineTo(f.x+f.w*1.9,fy+f.h*.3);X.lineTo(f.x+f.w*1.9,FT);X.lineTo(f.x+f.w,FT);X.fill();R(X,f.x+4,fy+f.h*.42,f.w-8,f.h*.55,4,'#fff6cc');['#ff9f1a','#ff5cc8','#39ff88'].forEach((c,i)=>R(X,f.x+8+i*(f.w-16)/3,fy+f.h*.55,(f.w-24)/3,f.h*.14,3,c))}
 X.fillStyle='#ff5cc8';X.font='700 12px Inter,sans-serif';X.fillText('SNACKS',f.x+8,fy+f.h*.25);
 // top 5 days board
 board(X,g.lb,t);
 // lamp
 const LH=g.m?.13:.3;const lx=g.lamp.x,ly=FT;X.fillStyle='#2a2238';X.fillRect(lx-3,ly-H*LH,6,H*LH);R(X,lx-24,ly-8,48,8,4,'#2a2238');X.fillStyle='#ffcf7a';X.beginPath();X.moveTo(lx-34,ly-H*LH);X.lineTo(lx+34,ly-H*LH);X.lineTo(lx+22,ly-H*(LH+.07));X.lineTo(lx-22,ly-H*(LH+.07));X.fill();
 const lg=X.createRadialGradient(lx,ly-H*(LH-.02),10,lx,ly-H*.2,H*(LH-.02));lg.addColorStop(0,'rgba(255,207,122,.28)');lg.addColorStop(1,'rgba(255,207,122,0)');X.fillStyle=lg;X.fillRect(lx-H*(LH+.05),ly-H*.5,H*.7,H*.6);
 // rug
 const sp=spots();X.fillStyle='#3b1f5c';X.beginPath();X.ellipse(sp.rug.x,sp.rug.y,W*(g.m?.36:.2),H*.05,0,0,7);X.fill();X.strokeStyle='#b46cff88';X.lineWidth=3;X.setLineDash([4,8]);X.stroke();X.setLineDash([]);
 // couch
 const c=g.couch,cy=sp.couchL.y;R(X,c.x-c.w/2,cy-H*.16,c.w,H*.12,18,'#3a2a55');R(X,c.x-c.w/2-14,cy-H*.1,30,H*.11,12,'#47336a');R(X,c.x+c.w/2-16,cy-H*.1,30,H*.11,12,'#47336a');R(X,c.x-c.w/2+10,cy-H*.06,c.w-20,H*.06,10,'#523b78');
 X.strokeStyle='#b46cff55';X.lineWidth=2;X.beginPath();X.moveTo(c.x,cy-H*.15);X.lineTo(c.x,cy-H*.01);X.stroke();
 // beanbags
 [['beanL','#5cc8ff'],['beanR','#ff5cc8']].forEach(([k,col])=>{const b=sp[k];X.fillStyle='#141c26';X.beginPath();X.ellipse(b.x,b.y-H*.03,W*(g.m?.08:.045),H*.045,0,0,7);X.fill();X.strokeStyle=col;X.lineWidth=2;X.shadowColor=col;X.shadowBlur=10;X.stroke();X.shadowBlur=0;dots(X,b.x,b.y-H*.03,W*(g.m?.07:.04),H*.035,60,3,col+'99')});
 // arcade
 const a=g.arcade,ay=FT-a.h;R(X,a.x,ay,a.w,a.h,8,'#1c1430');X.strokeStyle='#ff5cc8';X.lineWidth=2;X.shadowColor='#ff5cc8';X.shadowBlur=12;X.strokeRect(a.x+2,ay+2,a.w-4,a.h-4);X.shadowBlur=0;
 const sx=a.x+a.w*.12,sy=ay+a.h*.14,sw=a.w*.76,sh=a.h*.3;X.fillStyle='#02040a';X.fillRect(sx,sy,sw,sh);for(let i=0;i<6;i++){X.fillStyle=pick(['#39ff88','#5cc8ff','#ffd84a','#ff5cc8']);X.fillRect(sx+((t/9+i*37)%sw),sy+((i*29+t/23)%sh),5,5)}
 X.fillStyle='#ffd84a';X.font='800 11px Inter,sans-serif';X.fillText('ARCADE',a.x+a.w*.12,ay+a.h*.1);R(X,a.x+a.w*.1,ay+a.h*.52,a.w*.8,a.h*.1,4,'#2a1f44');X.fillStyle='#ff5c6c';X.beginPath();X.arc(a.x+a.w*.3,ay+a.h*.56,5,0,7);X.fill();X.fillStyle='#5cc8ff';X.beginPath();X.arc(a.x+a.w*.6,ay+a.h*.56,5,0,7);X.fill();
 // plants
 [[W*(g.m?.95:.975),FT+H*.1],[W*(g.m?.36:.24),FT+2]].forEach(([px,py],j)=>{R(X,px-22,py-34,44,36,6,'#5a3b2a');for(let i=0;i<5;i++){X.fillStyle=i%2?'#2fbf6a':'#39ff88';X.beginPath();X.ellipse(px+Math.sin(t/800+i+j)*3+(i-2)*9,py-50-i%3*12,8,22,(i-2)*.35,0,7);X.fill()}})}
/* TOP 5 DAYS board (pooled agent-days, best first; from DeskBooks so numbers match the VS board) */
function board(X,b,t){R(X,b.x-6,b.y-6,b.w+12,b.h+12,10,'#2a2238');R(X,b.x,b.y,b.w,b.h,8,'#070d10');const m=O.mobile,fs=Math.round(b.h/(m?11:12)),pad=b.w*.05;
 X.fillStyle='#ffd84a';X.font='900 '+fs+'px Inter,sans-serif';X.fillText('TOP 5 DAYS',b.x+pad,b.y+fs*1.4);X.fillStyle='#c9d6d0';X.font='600 '+Math.round(fs*.55)+'px Inter,sans-serif';X.fillText('realized P&L by day · traders only · paper',b.x+pad,b.y+fs*2.15);
 let rows=[];try{rows=window.DeskBooks?DeskBooks.topDays(5):[]}catch(e){}
 const rh=(b.h-fs*2.7)/(m?5.05:5.2),medal=['#ffd84a','#c8d3dc','#d08a4a'];
 if(!rows.length){X.fillStyle='#8aa098';X.font='600 '+Math.round(fs*.7)+'px Inter,sans-serif';X.fillText('No closed days yet.',b.x+pad,b.y+fs*3.6)}
 if(m){rows.forEach((r,i)=>{const y=b.y+fs*2.7+rh*i+rh*.1,c=COL[r.name]||'#cfe',my=y+rh*.62;if(i<3){X.fillStyle=medal[i]+'22';X.fillRect(b.x+4,y,b.w-8,rh*.9)}
  X.font='900 24px Inter,sans-serif';X.fillStyle=i<3?medal[i]:'#c9d6d0';X.fillText(String(i+1),b.x+pad,my);X.fillStyle=c;X.fillText(LAB[r.name],b.x+pad+34,my,b.w*.32);X.fillStyle='#c9d6d0';X.font='700 23px Inter,sans-serif';X.fillText(r.date.slice(5),b.x+pad+34+b.w*.33,my);
  X.textAlign='right';X.fillStyle=r.pnl>=0?'#39ff88':'#ff7a8a';X.font='800 24px Inter,sans-serif';X.fillText((r.pnl>=0?'+':'')+r.pnl.toFixed(3)+' ('+(r.pct>=0?'+':'')+r.pct.toFixed(1)+'%)',b.x+b.w-pad,my,b.w*.42);X.textAlign='left'});return}
 rows.forEach((r,i)=>{const y=b.y+fs*2.7+rh*i+rh*.15,c=COL[r.name]||'#cfe';if(i<3){X.fillStyle=medal[i]+'22';X.fillRect(b.x+4,y,b.w-8,rh*.88)}
  X.fillStyle=i<3?medal[i]:'#8aa098';X.font='900 '+Math.round(rh*.5)+'px Inter,sans-serif';X.fillText(String(i+1),b.x+pad,y+rh*.62);
  X.fillStyle=c;X.beginPath();X.arc(b.x+pad+rh*.75,y+rh*.44,rh*.24,0,7);X.fill();X.fillStyle='#0b0f12';X.fillRect(b.x+pad+rh*.65,y+rh*.38,rh*.06,rh*.08);X.fillRect(b.x+pad+rh*.8,y+rh*.38,rh*.06,rh*.08);
  X.fillStyle=c;X.font='800 '+Math.round(rh*.34)+'px Inter,sans-serif';X.fillText(LAB[r.name],b.x+pad+rh*1.15,y+rh*.42);X.fillStyle='#8aa098';X.font='600 '+Math.round(rh*.27)+'px Inter,sans-serif';X.fillText(r.date.slice(5),b.x+pad+rh*1.15,y+rh*.76);
  X.textAlign='right';X.fillStyle=r.pnl>=0?'#39ff88':'#ff5c6c';X.font='800 '+Math.round(rh*.34)+'px Inter,sans-serif';X.fillText((r.pnl>=0?'+':'')+r.pnl.toFixed(4),b.x+b.w-pad,y+rh*.42);
  X.font='700 '+Math.round(rh*.28)+'px Inter,sans-serif';X.fillText((r.pct>=0?'+':'')+r.pct.toFixed(1)+'%',b.x+b.w-pad,y+rh*.76);X.textAlign='left'})}
/* ---------- comic bubbles ---------- */
function wrap(X,txt,max){const w=String(txt).split(' '),out=[];let l='';w.forEach(s=>{const n=l?l+' '+s:s;if(X.measureText(n).width>max&&l){out.push(l);l=s}else l=n});if(l)out.push(l);return out.slice(0,5)}
function comic(X,a,hx,hy,t,ix){const b=a.br.bub;if(!b)return;const g=geo(),fs=g.m?19:18;X.font='700 '+fs+'px "Comic Sans MS","Comic Neue","Chalkboard SE",cursive';
 const lines=wrap(X,(b.mood?b.mood+' ':'')+b.t,g.W*(g.m?.6:.24)),lw=Math.max(...lines.map(l=>X.measureText(l).width))+28,lh=fs*1.25,bh=lines.length*lh+18;
 const bx=Math.max(8,Math.min(g.W-lw-8,hx-lw/2)),by=Math.max(8,hy-bh-26-ix*8);
 X.fillStyle='#fffdf5';X.strokeStyle='#111';X.lineWidth=3;X.beginPath();X.roundRect(bx,by,lw,bh,14);X.fill();X.stroke();
 X.beginPath();X.moveTo(hx-10,by+bh-1);X.lineTo(hx-2,by+bh+18);X.lineTo(hx+12,by+bh-1);X.fillStyle='#fffdf5';X.fill();X.beginPath();X.moveTo(hx-10,by+bh);X.lineTo(hx-2,by+bh+18);X.lineTo(hx+12,by+bh);X.stroke();
 X.fillStyle=a.col;X.fillRect(bx,by+8,5,bh-16);X.fillStyle='#111';lines.forEach((l,i)=>X.fillText(l,bx+14,by+10+fs+i*lh));
 if(b.to){const o=AG()[b.to];if(o&&o!==a&&o.room==='brk'&&o.br){const ox=o.br.x,oy=o.br.y-(o.hc*2+10)*K(),sx=ox<bx?bx:bx+lw,sy=by+bh/2,mx=(sx+ox)/2,my=Math.min(sy,oy)-40;
  X.strokeStyle=o.col;X.lineWidth=3;X.setLineDash([6,6]);X.beginPath();X.moveTo(sx,sy);X.quadraticCurveTo(mx,my,ox,oy);X.stroke();X.setLineDash([]);const an=Math.atan2(oy-my,ox-mx);X.fillStyle=o.col;X.beginPath();X.moveTo(ox,oy);X.lineTo(ox-14*Math.cos(an-.4),oy-14*Math.sin(an-.4));X.lineTo(ox-14*Math.cos(an+.4),oy-14*Math.sin(an+.4));X.fill()}}}
/* ---------- moving agents between rooms ---------- */
const officeDoor=()=>{const f=O.floorBounds();return{x:f.xMax-(O.mobile?30:50),y:f.yMin+8}};
O.addActor({id:'brk-door',y:-.4,draw(X,t){const f=O.floorBounds(),d=officeDoor(),m=O.mobile,w=m?78:96,h=m?190:230,x=d.x-w/2,y=f.yMin-h;
 R(X,x-6,y-6,w+12,h+6,6,'#1f2b2e');X.fillStyle='#120c1e';X.fillRect(x,y,w,h);X.strokeStyle='#b46cff';X.lineWidth=2;X.shadowColor='#b46cff';X.shadowBlur=14;X.strokeRect(x+4,y+4,w-8,h-4);X.shadowBlur=0;
 X.fillStyle='#b46cff';X.font='800 '+(m?14:16)+'px Inter,sans-serif';X.textAlign='center';X.fillText('BREAKROOM',d.x,y-12);X.font='22px sans-serif';X.fillText('☕',d.x,y+h*.45+Math.sin(t/500)*3);X.textAlign='left'}});
function enter(a,line){if(!a)return;if(a.state==='held')return;a.room='brk';a.toBrk=false;a.draggable=false;a.bubble=null;const s=spots();
 a.br=a.br||{};const sd=a.brDoor?a.brDoor():s.door;Object.assign(a.br,{x:sd.x,y:sd.y,vx:0,vy:0,held:false,arrived:false,stay:(a.id==='designer'?5400:3000)+Math.random()*3600,face:1});choose(a);if(line)show(a,line);
 if(follow===a.id)setView('brk')}
function exit(a,rush){if(!a||a.room!=='brk')return;a.room=null;if(a.br)a.br.bub=null;if(a.onExit){a.onExit(rush);if(follow===a.id)setView(a.room||'office');return}if(a.id==='quanty')return;a.draggable=true;const d=officeDoor();a.x=d.x;a.y=a.fy=d.y;a.vy=0;a.state='idle';a.timer=60;
 if(rush){a.visit();a.rush=true}else a.wander&&a.wander();if(follow===a.id)setView('office')}
function choose(a){const pref=a.brPref?a.brPref:a.id==='ledger'?['fridge','fridge','couchL','couchR','rug']:a.id==='twitter'?['arcade','arcade','beanL','beanR','rug']:a.id==='designer'?['beanR','rug','couchR','beanL']:['couchL','couchR'];
 const taken=Object.values(AG()).filter(o=>o&&o!==a&&o.room==='brk'&&o.br).map(o=>o.br.act);const opts=pref.filter(p=>!taken.includes(p));const act=opts.length?pick(opts):pick(ACTS),p=spots()[act];
 Object.assign(a.br,{act,tx:p.x+(Math.random()*30-15),ty:p.y,arrived:false,nap:false,timer:900+Math.random()*900})}
function show(a,l){a.br=a.br||{};a.br.bub={t:l.text,mood:l.mood,to:l.reply_to?(byId[l.reply_to]||{}).agent:null,ttl:(6000+String(l.text).length*70)/16}}
function wrapOffice(a){if(!a||a._brkWrapped)return;a._brkWrapped=true;const os=a.step,od=a.draw;
 a.step=function(t){if(this.room==='brk')return;os.call(this,t);post(this)};
 a.draw=function(X,t){if(this.room==='brk')return;if(this.dance>0){X.translate(this.x,this.y);X.rotate(Math.sin(this.dance/4)*.3);X.translate(-this.x,-this.y)}const b=this.bubble;this.bubble=null;try{od.call(this,X,t)}finally{this.bubble=b}}}
/* toss physics + door drop + walk-in, for office actors */
function post(a){if(a.dance>0)a.dance--;
 if(a.state==='held'){a._hx=a._hx||[];a._hx.push(a.x);if(a._hx.length>5)a._hx.shift();a._wasHeld=true;return}
 if(a._wasHeld){a._wasHeld=false;const h=a._hx||[];a.vx=h.length>1?(h[h.length-1]-h[0])/(h.length-1):0;a._hx=[];if(Math.abs(a.x-officeDoor().x)<70){a.vx=0;enter(a,null);return}}
 if(a.state==='drop'&&a.vx){const f=O.floorBounds();a.x+=a.vx;a.vx*=.96;if(a.x<f.xMin){a.x=f.xMin;a.vx=-a.vx*.6}if(a.x>f.xMax){a.x=f.xMax;a.vx=-a.vx*.6}}else if(a.state!=='drop')a.vx=0;
 if(a.toBrk){const d=officeDoor();if(a.state==='idle'&&Math.hypot(a.x-d.x,a.y-d.y)<40)enter(a,a.pending),a.pending=null;else if(a.state==='idle'||performance.now()-a.toBrkAt>14000){if(performance.now()-a.toBrkAt>14000){enter(a,a.pending);a.pending=null}else a.go(d.x,d.y)}}}
const _ds=designer.step;designer.step=function(t){_ds.call(this,t);if(!this.room)post(this)};
const _dd=designer.draw;designer.draw=function(X,t){if(this.dance>0&&!this.room){X.translate(this.x,this.y);X.rotate(Math.sin(this.dance/4)*.3);X.translate(-this.x,-this.y)}_dd.call(this,X,t)};
function sendToBrk(a,line,rush){if(!a)return;if(a.toBrkFn)return a.toBrkFn(line,rush);if(a.id==='quanty'){if(a.room!=='brk')enter(a,line);else if(line)show(a,line);return}
 if(a.room==='brk'){if(line)show(a,line);return}if(a.state==='held')return;a.toBrk=true;a.toBrkAt=performance.now();a.pending=line||null;a.rush=!!rush;const d=officeDoor();a.go(d.x,d.y);if(rush)a.rush=true;
 if(line&&a.say)a.say('brb, breakroom ☕',2200)}
/* breakroom sim */
function brStep(a,t){const b=a.br;if(!b)return;if(b.bub&&--b.bub.ttl<=0)b.bub=null;if(a.dance>0&&a.room==='brk')a.dance--;if(a.jump>0&&a.id==='quanty')a.jump--;
 if(b.held)return;
 if(b.drop){b.vy+=1.2;b.y+=b.vy;b.x+=b.vx;b.vx*=.96;const g=geo();if(b.x<30){b.x=30;b.vx=-b.vx*.6}if(b.x>g.W-30){b.x=g.W-30;b.vx=-b.vx*.6}if(b.y>=b.fy){b.y=b.fy;if(Math.abs(b.vy)>3)b.vy=-b.vy*.45;else{b.drop=false;b.vy=0;b.vx=0;
  if(b.x<geo().door.x+geo().door.w+30&&a.id!=='quanty'&&!a.onExit){exit(a,false);return}choose(a)}}return}
 if(!b.arrived){const dx=b.tx-b.x,dy=b.ty-b.y,d=Math.hypot(dx,dy),sp=(a.brSpeed||(a.id==='twitter'?3.2:a.id==='ledger'?1.1:1.8))*(O.mobile?.8:1)*(b.leaving?1.6:1);
  if(d<sp){b.x=b.tx;b.y=b.ty;b.arrived=true;if(b.leaving){a.id==='quanty'?(a.room=null,b.bub=null):exit(a,false);return}
   b.nap=(b.act==='couchL'||b.act==='couchR')&&a.id!=='twitter'&&Math.random()<.5;
   if(!b.bub&&Math.random()<.6){const LL=LINES[a.id]||a.brLines||{any:['…']};b.bub={t:pick(LL[b.act]||LL.any),ttl:200}}}
  else{b.x+=dx/d*sp;b.y+=dy/d*sp;if(Math.abs(dx)>1)b.face=dx>=0?1:-1}return}
 if(--b.timer<=0){if(--b.stay<=0||(a.id==='quanty'&&Math.random()<.5)){const s=spots(),sd=a.brDoor?a.brDoor():s.door;Object.assign(b,{tx:sd.x,ty:sd.y,arrived:false,leaving:true})}else choose(a)}else b.stay--}
const LINES={ledger:{fridge:['*rummage* Who took my pretzels?','Snack audit in progress.','Fridge: 3 sodas, 0 alpha.'],any:['Sitting. Not resting. Thinking.','n is too small to nap.','This couch has poor liquidity.']},
 twitter:{arcade:['NEW HIGH SCORE LFG!!!','SPEEDRUNNING THE BREAKROOM','ARCADE ARC BEGINS'],any:['POSTING FROM THE BEANBAG','BREAK TIME BUT STILL BULLISH','GM FROM THE LOUNGE']},
 designer:{any:['Sketching a new icon.','This rug is very on-brand.','Mood board: aurora.','Adding 4px of breathing room.']},
 quanty:{any:['Coffee break. Bots run on beans too.','Desk is on autopilot. Paper only.','Recharging at 3% per sip.']}};
function brDraw(t){const g=geo();if(cv.width!==g.W||cv.height!==g.H){cv.width=g.W;cv.height=g.H}room(X,t);LAY.bg.forEach(f=>{try{X.save();f(X,t,g);X.restore()}catch(e){}});const k=K();
 const list=Object.values(AG()).filter(a=>a&&a.room==='brk'&&a.br).sort((p,q)=>p.br.y-q.br.y);
 list.forEach(a=>{const b=a.br,walk=!b.arrived||b.held,gy=b.held||b.drop?b.fy:b.y;let y=b.y;
  if(walk&&!b.held)y-=Math.abs(Math.sin(t/(a.id==='twitter'?60:120)))*(a.id==='twitter'?16:5);if(a.jump>0)y-=Math.abs(Math.sin(a.jump/5))*24;
  X.fillStyle='rgba(0,0,0,.35)';X.beginPath();X.ellipse(b.x,gy+6,(a.sw||26)*k,8*k,0,0,7);X.fill();
  const st=a.state;a.state=walk?'walk':'idle';X.save();X.translate(b.x,y);X.scale(k,k);
  X.rotate(b.held?Math.sin(t/160)*.22:a.dance>0?Math.sin(a.dance/4)*.35:(b.nap?-.08:0));glow(X,0,-a.hc,a.hc*1.5,a.col,t);X.save();X.scale(b.face||1,1);try{a.body(X,t,!!b.held)}catch(e){}X.restore();X.restore();a.state=st;
  if(b.arrived&&b.nap){X.fillStyle='#cfe';X.font='800 '+(20+6*Math.sin(t/400))+'px Inter,sans-serif';X.fillText('z',b.x+30*k,y-a.hc*2*k-((t/30)%40));X.font='800 16px Inter,sans-serif';X.fillText('z',b.x+44*k,y-a.hc*2*k-20-((t/30+20)%40))}
  if(b.arrived&&b.act==='arcade'&&(t/250|0)%2){X.fillStyle='#ffd84a';X.font='800 14px Inter,sans-serif';X.fillText('★',b.x-10,y-a.hc*2.3*k)}
  if(b.arrived&&b.act==='fridge'&&a.id==='ledger'){X.fillStyle='#ff9f1a';X.fillRect(b.x-50*k,y-90*k+Math.sin(t/140)*4,14,18)}});
 drawFx(X,'brk');list.forEach((a,i)=>{const b=a.br;comic(X,a,b.x,b.y-(a.hc*2+16)*K(),t,i)});
 X.fillStyle='rgba(5,7,10,.85)';X.fillRect(0,g.H-(g.m?40:28),g.W,g.m?40:28);X.fillStyle='#e3ece8';X.font='600 14px Inter,sans-serif';X.textAlign='center';X.fillText(g.m?'Breakroom · paper only · not advice':'Breakroom · paper trading desk · nothing here is financial advice',g.W/2,g.H-9);X.textAlign='left'}
(function loop(t){try{Object.values(AG()).forEach(a=>{if(a&&a.room==='brk')brStep(a,t)});if(view==='brk')brDraw(t)}catch(e){console.warn('breakroom',e)}requestAnimationFrame(loop)})(0);
/* breakroom drag + toss */
const toC=(cx,cy)=>{const r=cv.getBoundingClientRect();return{x:(cx-r.left)/r.width*cv.width,y:(cy-r.top)/r.height*cv.height}};
function hitBrk(p){let best=null,bd=1e9;Object.values(AG()).forEach(a=>{if(!a||a.room!=='brk'||!a.br)return;const k=K(),b=a.br,top=b.y-(a.hc*2+30)*k;if(p.y<top||p.y>b.y+12)return;const dx=Math.abs(p.x-b.x);if(dx<(a.sw||26)*k+24&&dx<bd){bd=dx;best=a}});return best}
let drag=null;
cv.addEventListener('pointerdown',e=>{const p=toC(e.clientX,e.clientY),g=geo();
 if(p.x>g.door.x&&p.x<g.door.x+g.door.w&&p.y>g.FT-g.door.h&&p.y<g.FT){e.preventDefault();setView('office');return}
 const a=hitBrk(p);if(!a)return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}drag={a,id:e.pointerId,hx:[p.x],oy:p.y-a.br.y,sx:p.x,sy:p.y,moved:false};a.br.held=true;a.br.drop=false;a.br.fy=a.br.y;a.br.nap=false});
cv.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const p=toC(e.clientX,e.clientY),b=drag.a.br;if(Math.hypot(p.x-drag.sx,p.y-drag.sy)>8&&!drag.moved){drag.moved=true;if(drag.a.grab&&!b.bub)b.bub={t:pick(drag.a.grab),ttl:120}}
 if(drag.moved){b.x=p.x;b.y=Math.min(p.y-drag.oy,geo().FB);drag.hx.push(p.x);if(drag.hx.length>5)drag.hx.shift()}});
const up=e=>{if(!drag||e.pointerId!==drag.id)return;const a=drag.a,b=a.br,h=drag.hx;b.held=false;try{cv.releasePointerCapture(e.pointerId)}catch(_){}
 if(drag.moved){b.drop=true;b.vy=0;b.vx=h.length>1?(h[h.length-1]-h[0])/(h.length-1):0;const g=geo();b.fy=Math.max(g.FT+g.H*.03,Math.min(g.FB-g.H*.03,b.fy||b.y));if(b.y>b.fy)b.y=b.fy;if(a.land)b.bub={t:pick(a.land),ttl:150}}
 drag=null};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
/* ---------- view switching + follow ---------- */
const nav=document.createElement('div');nav.className='brk-nav';nav.innerHTML='<div class="brk-tabs" role="tablist"><button data-v="office" role="tab">Office</button><button data-v="brk" role="tab">☕ Breakroom</button></div><div class="brk-fol" aria-label="Follow an agent"><span>Follow</span>'+
 ['quanty','ledger','twitter','designer'].map(n=>`<button data-f="${n}" style="--c:${COL[n]}" title="Follow ${LAB[n]}">${LAB[n][0]}</button>`).join('')+'</div>';stage.appendChild(nav);
function setView(v){view=v;stage.classList.toggle('in-brk',v!=='office');cv.classList.toggle('show',v==='brk');nav.querySelectorAll('[data-v]').forEach(b=>{b.classList.toggle('on',b.dataset.v===v);b.setAttribute('aria-selected',b.dataset.v===v)});VH.forEach(f=>{try{f(v)}catch(e){console.warn('view hook',e)}})}
nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.v){follow=null;paintFol();setView(b.dataset.v)}else if(b.dataset.f){follow=follow===b.dataset.f?null:b.dataset.f;paintFol();
 const a=AG()[follow];if(a)setView(a.room==='brk'?'brk':a.room==='dev'?'dev':'office');if(a&&follow&&a.id!=='quanty'&&!a.onExit&&a.room!=='brk'&&Math.random()<.5)sendToBrk(a,null)}});
function paintFol(){nav.querySelectorAll('[data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f===follow))}
setView('office');
/* office door click opens the breakroom */
{let dn=null;O.canvas.addEventListener('pointerdown',e=>{dn={x:e.clientX,y:e.clientY}});O.canvas.addEventListener('pointerup',e=>{if(!dn)return;const ok=Math.hypot(e.clientX-dn.x,e.clientY-dn.y)<8;dn=null;if(!ok)return;
 const p=O.toCanvas(e.clientX,e.clientY),d=officeDoor(),f=O.floorBounds(),w=O.mobile?78:96,h=O.mobile?190:230;if(p.x>d.x-w/2&&p.x<d.x+w/2&&p.y>f.yMin-h&&p.y<f.yMin)setView('brk')})}
/* ---------- wandering ---------- */
setInterval(()=>{const A=AG();[A.ledger,A.twitter,A.designer].forEach(a=>{if(!a||a.room==='brk'||a.toBrk||a.state!=='idle'||a.rush)return;const inB=[A.ledger,A.twitter,A.designer].filter(o=>o&&o.room==='brk').length;if(Math.random()<(inB<2?.55:.15))sendToBrk(a,null)})},12000);
setTimeout(()=>enter(designer,null),300);setTimeout(()=>sendToBrk(T(),null),5000);
/* new trade: everybody back to the desk */
Desk.on('trade',()=>{const A=AG();Object.values(A).forEach(a=>{if(!a)return;a.toBrk=false;a.pending=null;if(a.room==='brk'){if(a.id==='quanty'){a.room=null;return}exit(a,true);a.say&&a.say(pick(['NEW TRADE! BACK TO THE DESK!','On my way!','Snack break over.']),2600)}})});
/* ---------- breakroom lines + chat log ---------- */
const byId={},seen=new Set();let first=true;
const logBox=document.createElement('details');logBox.className='brlog';logBox.innerHTML='<summary>💬 Breakroom chat <span class="n">0</span></summary><ol aria-live="polite"></ol>';stage.appendChild(logBox);
const ago=ts=>{const s=(Date.now()-Date.parse(ts))/1e3|0;return s<60?s+'s':s<3600?(s/60|0)+'m':(s/3600|0)+'h'};
function paintLog(rows){const ol=logBox.querySelector('ol');logBox.querySelector('.n').textContent=rows.length;
 ol.innerHTML=rows.slice().reverse().map(l=>{const c=COL[l.agent]||'#cfe',rt=l.reply_to&&byId[l.reply_to]?` <span class="rt">↩ ${E(LAB[byId[l.reply_to].agent]||'')}</span>`:'';
  return `<li><b style="color:${c}">${E(LAB[l.agent]||String(l.agent||'').toUpperCase())}</b>${rt} <span class="mt">${E(ago(l.ts))}</span><br>${l.mood?E(l.mood)+' ':''}${E(l.text)}</li>`}).join('')||'<li class="mt">Quiet in here… for now.</li>'}
function onData(d){const rows=Array.isArray(d&&d.breakroom)?d.breakroom.filter(l=>l&&l.id&&l.text):[];rows.forEach(l=>byId[l.id]=l);paintLog(rows);
 const A=AG(),fresh=rows.filter(l=>!seen.has(l.id));fresh.forEach(l=>seen.add(l.id));
 if(first){first=false;const l=rows[rows.length-1];if(l&&Date.now()-Date.parse(l.ts)<6e5&&A[l.agent])sendToBrk(A[l.agent],l);return}
 fresh.forEach((l,i)=>{const a=A[l.agent];if(a)setTimeout(()=>sendToBrk(a,l,true),i*1500)})}
Desk.on('update',d=>{try{onData(d)}catch(e){console.warn('breakroom data',e)}});
/* office tabs dock entry for DESIGNER (mirrors the other dock cards) */
function dockCard(){const box=document.getElementById('minis'),bub=document.getElementById('mbub');if(!box||box.querySelector('[aria-label="DESIGNER"]'))return;
 const el=document.createElement('div');el.className='mini';el.style.setProperty('--c',COL.designer);el.setAttribute('role','button');el.setAttribute('aria-label','DESIGNER');el.tabIndex=0;
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#05070a';g.fillRect(0,0,128,128);g.save();g.translate(64,190);g.scale(1.25,1.25);try{designer.body.call(Object.assign(Object.create(designer),{state:'idle',mood:0,jump:0}),g,0,false)}catch(e){}g.restore();
 el.innerHTML='<div class="h"><div class="lid"></div></div><div class="nm">DESIGNER</div>';el.querySelector('.h').style.backgroundImage='url('+c.toDataURL()+')';box.appendChild(el);
 let hide=0;const html=()=>{const lines=(Desk.data&&Desk.data.breakroom||[]).filter(l=>l.agent==='designer');const last=lines[lines.length-1];
  return `<b>DESIGNER</b><br>Where: <b>${designer.room==='brk'?'breakroom':'office'}</b><br>${last?'Last said: '+E(last.text):'Working on the desk UI.'}<br><span class="mt">designer · ships UI (does not trade)</span>`};
 const open=()=>{if(!bub)return;if(bub.style.display==='block'&&bub._d){bub.style.display='none';bub._d=false;return}
  bub.style.setProperty('--c',COL.designer);bub.style.borderColor=COL.designer;bub._refresh=html;bub._pos=null;bub.innerHTML=html();bub.style.display='block';bub._d=true;const r=el.getBoundingClientRect();bub.style.left=Math.max(6,Math.min(innerWidth-bub.offsetWidth-6,r.left+r.width/2-bub.offsetWidth/2))+'px';bub.style.top=Math.max(56,r.top-bub.offsetHeight-12)+'px';
  clearTimeout(hide);hide=setTimeout(()=>{bub.style.display='none';bub._d=false},8000);designer.say&&designer.say('Hi! Like the new dock?',2400)};
 el.addEventListener('click',open);el.addEventListener('pointerup',e=>e.stopPropagation())}
if(document.readyState==='complete')setTimeout(dockCard,0);else addEventListener('load',()=>setTimeout(dockCard,0));
/* initial placement + API for interact.js */
[L(),T()].forEach(wrapOffice);
Desk.brk={register(a,lab){EXTRA[a.id]=a;COL[a.id]=a.col;LAB[a.id]=lab||a.id.toUpperCase()},onView(f){VH.push(f)},nav,follow:()=>follow,col:COL,blob,dots,glow,R,K,wrap,canvas:cv,layers:LAY,geo,spots,agents:AG,view:()=>view,setView,enter,exit,sendToBrk,fx:addFx,hit:hitBrk,toCanvas:toC,
 pos(a){if(!a)return null;if(a.room==='brk'&&a.br)return{room:'brk',x:a.br.x,y:a.br.y};if(a.id==='quanty'){const q=Desk.quanty;return q?{room:'office',x:q.x,y:q.y}:null}return{room:'office',x:a.x,y:a.y}},
 say(a,t,ms){if(!a)return;if(a.room==='brk'&&a.br){a.br.bub={t,ttl:(ms||3000)/16}}else if(a.id==='quanty'){Desk.quanty&&Desk.quanty.say(t,ms||3000)}else a.say&&a.say(t,ms||3000)}};
})();
