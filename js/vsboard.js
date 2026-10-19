/* vsboard.js : QUANTY vs LEDGER board. Replaces the office whiteboard with a live two-line P&L % race.
   Uses window.Desk (see API.md). Paper trading only. */
(function(){
'use strict';
if(!window.Desk||!Desk.office){console.warn('vsboard: Desk API missing');return}
const O=Desk.office,QC='#39ff88',LC='#ffbf3f';
const head=new Image();head.src='assets/robot_head.png';
const rect=()=>O.mobile?{x:440,y:840,w:300,h:140}:{x:56,y:438,w:228,h:134},old=()=>O.mobile?{x:440,y:840,w:300,h:140}:{x:60,y:420,w:220,h:150};
const pct=(b,s)=>((+b||0)/((+s)||1)-1)*100;
function series(){const d=Desk.data||{},bh=d.bank_history||{},lb=d.ledger_book||{},now=Date.now();
 const map=(a,s)=>(Array.isArray(a)?a:[]).filter(p=>Array.isArray(p)&&p[1]!=null).map(p=>[Date.parse(p[0])||now,pct(p[1],s)]);
 let q=map(bh.quanty&&bh.quanty.length?bh.quanty:d.history,d.start_sol||1),l=map(bh.ledger,lb.start_sol||1);
 const qc=pct(d.bank_sol,d.start_sol||1),lc=lb.bank_sol!=null?pct(lb.bank_sol,lb.start_sol||1):0;
 if(d.bank_sol!=null)q.push([now,qc]);l.push([now,lc]);if(l.length<2)l.unshift([q.length?q[0][0]:now-6e5,0]);
 const s=d.stats||{};return{q,l,qc,lc,qw:Math.round(s.wins||0),ql:Math.round(s.losses||0),lw:lb.wins||0,ll:lb.losses||0}}
const f=v=>(v>=0?'+':'')+v.toFixed(1)+'%';
function face(X,x,y,r,who){if(who==='q'){X.save();X.beginPath();X.arc(x,y,r,0,7);X.clip();if(head.complete&&head.naturalWidth)X.drawImage(head,x-r,y-r,2*r,2*r);else{X.fillStyle='#0b1a12';X.fill()}X.restore()}
 else{X.fillStyle='#1a1408';X.beginPath();X.arc(x,y,r,0,7);X.fill();X.strokeStyle=LC;X.lineWidth=Math.max(1.5,r/7);X.beginPath();X.arc(x-r*.38,y-r*.05,r*.3,0,7);X.moveTo(x+r*.68,y-r*.05);X.arc(x+r*.38,y-r*.05,r*.3,0,7);X.stroke();X.beginPath();X.moveTo(x-r*.65,y-r*.5);X.lineTo(x-r*.15,y-r*.38);X.moveTo(x+r*.65,y-r*.5);X.lineTo(x+r*.15,y-r*.38);X.stroke()}
 X.strokeStyle=who==='q'?QC:LC;X.lineWidth=2;X.shadowColor=X.strokeStyle;X.shadowBlur=8;X.beginPath();X.arc(x,y,r,0,7);X.stroke();X.shadowBlur=0}
function crown(X,x,y,s){X.fillStyle='#ffd84a';X.beginPath();X.moveTo(x-s,y);X.lineTo(x-s,y-s*.9);X.lineTo(x-s*.5,y-s*.4);X.lineTo(x,y-s*1.1);X.lineTo(x+s*.5,y-s*.4);X.lineTo(x+s,y-s*.9);X.lineTo(x+s,y);X.closePath();X.fill()}
/* draw the board into any ctx at x,y,w,h; big=true for the expanded view */
function board(X,x,y,w,h,t,big){const S=series(),u=big?w/300:w/220,fs=n=>Math.round(n*u)+'px Inter,sans-serif';
 X.save();X.fillStyle='#070d10';X.beginPath();X.roundRect(x,y,w,h,8*u);X.fill();X.strokeStyle='#2a3a40';X.lineWidth=2;X.stroke();
 const ar=10*u,top=y+16*u,lead=S.qc===S.lc?null:(S.qc>S.lc?'q':'l');
 face(X,x+16*u,top,ar,'q');face(X,x+w-16*u,top,ar,'l');
 if(lead)crown(X,lead==='q'?x+16*u:x+w-16*u,top-ar-1,6*u);
 X.textAlign='center';X.font='800 '+fs(11);X.fillStyle=QC;X.fillText('QUANTY',x+w/2-31*u,top+4*u);X.fillStyle='#8aa098';X.font='800 '+fs(10);X.fillText('vs',x+w/2,top+4*u);X.fillStyle=LC;X.font='800 '+fs(11);X.fillText('LEDGER',x+w/2+31*u,top+4*u);
 // chart
 const cx=x+8*u,cy=y+32*u,cw=w-16*u,ch=h-56*u,all=S.q.concat(S.l);let t0=Math.min(...all.map(p=>p[0])),t1=Math.max(...all.map(p=>p[0]));if(t1<=t0)t1=t0+1;
 let lo=Math.min(0,...all.map(p=>p[1])),hi=Math.max(0,...all.map(p=>p[1]));const pad=Math.max(1,(hi-lo)*.12);lo-=pad;hi+=pad;
 const px=v=>cx+(v-t0)/(t1-t0)*cw,py=v=>cy+ch-(v-lo)/(hi-lo)*ch;
 X.strokeStyle='#ffffff22';X.setLineDash([3*u,4*u]);X.lineWidth=1;X.beginPath();X.moveTo(cx,py(0));X.lineTo(cx+cw,py(0));X.stroke();X.setLineDash([]);
 [[S.q,QC,S.qc],[S.l,LC,S.lc]].forEach(([a,c,v])=>{if(!a.length)return;X.strokeStyle=c;X.lineWidth=2.2*u;X.shadowColor=c;X.shadowBlur=6;X.beginPath();a.forEach((p,i)=>i?X.lineTo(px(p[0]),py(p[1])):X.moveTo(px(p[0]),py(p[1])));X.stroke();X.shadowBlur=0;
  const ex=px(a[a.length-1][0]),ey=py(v);X.fillStyle=c;X.beginPath();X.arc(ex,ey,2.8*u*(1+.25*Math.sin(t/300)),0,7);X.fill()});
 // value labels (keep apart)
 let qy=py(S.qc),ly=py(S.lc);if(Math.abs(qy-ly)<13*u){const m=(qy+ly)/2,s=qy<=ly?-1:1;qy=m+s*6.5*u;ly=m-s*6.5*u}
 X.textAlign='right';X.font='800 '+fs(11);[[f(S.qc),qy,QC],[f(S.lc),ly,LC]].forEach(([s,yy,c])=>{const tw=X.measureText(s).width+6*u;X.fillStyle='#070d10dd';X.fillRect(cx+cw-tw,yy-7*u,tw,13*u);X.fillStyle=c;X.fillText(s,cx+cw-3*u,yy+4*u)});
 // tally
 X.textAlign='left';X.font='700 '+fs(10);X.fillStyle=QC;X.fillText('W'+S.qw+' · L'+S.ql,x+8*u,y+h-8*u);X.textAlign='right';X.fillStyle=LC;X.fillText('W'+S.lw+' · L'+S.ll,x+w-8*u,y+h-8*u);
 X.textAlign='center';X.fillStyle='#8aa098';X.font='600 '+fs(big?8:9);X.fillText(big?'P&L % from 1 SOL · paper':'tap to expand',x+w/2,y+h-8*u);
 X.restore();return S}
/* office actor drawn behind everyone (y=-1), covering the old whiteboard */
let pointing=0;
O.addActor({id:'vsboard',y:-1,draw(X,t){const r=rect(),o=old();X.fillStyle='#0a0f12';X.fillRect(o.x-4,o.y-4,o.w+8,o.h+8);board(X,r.x,r.y,r.w,r.h,t,false);
 const L=Desk.actors.find(a=>a.id==='ledger');if(pointing>0&&L){pointing--;const k=O.mobile?1:1.25,hx=L.x+(r.x+r.w/2<L.x?-40:40)*k,hy=L.y-80*k;X.strokeStyle=LC;X.lineWidth=4;X.lineCap='round';X.setLineDash([2,7]);X.beginPath();X.moveTo(hx,hy);X.lineTo(r.x+r.w/2,r.y+r.h);X.stroke();X.setLineDash([]);X.fillStyle='#ff5c6c';X.font='900 34px Inter,sans-serif';X.fillText('!',hx-6,hy-20+Math.sin(t/90)*4)}}});
/* agents wander up and react */
const act=id=>Desk.actors.find(a=>a.id===id);
function visit(){const L=act('ledger'),T=act('twitter'),r=rect();if(!L||L.state!=='idle'||L.room)return;const S=series(),behind=S.lc<S.qc;
 L.go(r.x+r.w/2+(O.mobile?0:60),O.floorBounds().yMin+10);const chk=setInterval(()=>{if(L.state==='walk')return;clearInterval(chk);if(L.state!=='idle')return;
  if(behind){pointing=220;L.mood=-1;L.say(['RIGGED. That chart is rigged.','Behind by '+(S.qc-S.lc).toFixed(1)+'%?! Small n!','Quanty got LUCKY.','I demand a recount.'][Math.random()*4|0],4200,'#ff5c6c');setTimeout(()=>L.mood=0,4500)}
  else L.say(['Ahead by '+(S.lc-S.qc).toFixed(1)+'%. As calculated.','Discipline beats vibes.','Scoreboard, robot.'][Math.random()*3|0],4000);
  if(T&&T.state==='idle'&&!T.room&&Math.random()<.6)setTimeout(()=>T.say(behind?'QUANTY COOKING!!!':'LEDGER ARC?!?!',3200),1400)},300)}
setTimeout(visit,9000);setInterval(()=>{if(Math.random()<.5)visit()},45000);
/* tap to expand */
const C=O.canvas;let dn=null;
C.addEventListener('pointerdown',e=>{dn={x:e.clientX,y:e.clientY,t:performance.now()}});
C.addEventListener('pointerup',e=>{if(!dn)return;const m=Math.hypot(e.clientX-dn.x,e.clientY-dn.y)<8&&performance.now()-dn.t<450;dn=null;if(!m)return;const p=O.toCanvas(e.clientX,e.clientY),r=rect();if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)open()});
let ov=null,raf=0;
function open(){if(ov)return;ov=document.createElement('div');ov.className='vs-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Quanty vs Ledger');
 ov.innerHTML='<div class="vs-box"><button class="vs-x" aria-label="Close">×</button><canvas></canvas><p class="vs-note">Both books start at 1 SOL of pretend money. Lines show P&amp;L % over time. Paper trading only, not financial advice.</p></div>';
 document.body.appendChild(ov);const cv=ov.querySelector('canvas'),close=()=>{cancelAnimationFrame(raf);ov&&ov.remove();ov=null};
 ov.addEventListener('click',e=>{if(e.target===ov||e.target.classList.contains('vs-x'))close()});
 (function fr(t){if(!ov)return;const r=cv.getBoundingClientRect(),dp=devicePixelRatio||1;if(cv.width!==Math.round(r.width*dp)){cv.width=Math.round(r.width*dp);cv.height=Math.round(r.height*dp)}
  const X=cv.getContext('2d');X.setTransform(dp,0,0,dp,0,0);X.clearRect(0,0,r.width,r.height);board(X,0,0,r.width,r.height,t,true);raf=requestAnimationFrame(fr)})(0)}
/* score line for Ledger's bubble card */
window.DeskVS={series,cardHTML(){const S=series(),lead=S.qc===S.lc?'tied':(S.qc>S.lc?'Quanty leads':'Ledger leads');
 return `<br><b>QUANTY vs LEDGER</b>: <span style="color:${QC}">${f(S.qc)}</span> vs <span style="color:${LC}">${f(S.lc)}</span> · ${lead}<br><span class="mt">W/L ${S.qw}-${S.ql} vs ${S.lw}-${S.ll}</span>`}};
})();
