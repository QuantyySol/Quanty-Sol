/* vsboard.js : QUANTY vs LEDGER board. Replaces the office whiteboard with a live two-line P&L % race.
   Uses window.Desk (see API.md). Paper trading only. */
(function(){
'use strict';
if(!window.Desk||!Desk.office){console.warn('vsboard: Desk API missing');return}
const O=Desk.office,QC='#39ff88',LC='#ffbf3f';
const head=new Image();head.src='assets/robot_head.png';
const rect=()=>O.mobile?{x:70,y:430,w:660,h:300}:{x:470,y:92,w:640,h:330},old=()=>O.mobile?{x:440,y:840,w:300,h:140}:{x:60,y:420,w:220,h:150};
const NM=['quanty','ledger','twitter'],COL={quanty:QC,ledger:LC,twitter:'#5cc8ff'},LAB={quanty:'QUANTY',ledger:'LEDGER',twitter:'TWITTER'};
function series(){const B=window.DeskBooks;const o={rows:[]};
 NM.forEach(n=>{const b=B&&B.book(n);if(!b||!b.traded)return;o.rows.push({n,c:COL[n],pts:B.series(n),cur:b.pct,w:b.wins,l:b.losses,live:b.live,dl:b.delayed})});
 const g=n=>o.rows.find(r=>r.n===n);o.qc=g('quanty')?g('quanty').cur:0;o.lc=g('ledger')?g('ledger').cur:0;o.qw=g('quanty')?g('quanty').w:0;o.ql=g('quanty')?g('quanty').l:0;o.lw=g('ledger')?g('ledger').w:0;o.ll=g('ledger')?g('ledger').l:0;return o}
const f=v=>(v>=0?'+':'')+v.toFixed(1)+'%';
function face(X,x,y,r,who){if(who==='q'){X.save();X.beginPath();X.arc(x,y,r,0,7);X.clip();if(head.complete&&head.naturalWidth)X.drawImage(head,x-r,y-r,2*r,2*r);else{X.fillStyle='#0b1a12';X.fill()}X.restore()}
 else if(who==='t'){X.fillStyle='#08141c';X.beginPath();X.arc(x,y,r,0,7);X.fill();X.fillStyle='#e6f7ff';X.fillRect(x-r*.45,y-r*.25,r*.25,r*.3);X.fillRect(x+r*.2,y-r*.25,r*.25,r*.3);X.strokeStyle='#e6f7ff';X.lineWidth=Math.max(1.2,r/9);X.beginPath();X.arc(x,y+r*.2,r*.3,.2,Math.PI-.2);X.stroke()}
 else{X.fillStyle='#1a1408';X.beginPath();X.arc(x,y,r,0,7);X.fill();X.strokeStyle=LC;X.lineWidth=Math.max(1.5,r/7);X.beginPath();X.arc(x-r*.38,y-r*.05,r*.3,0,7);X.moveTo(x+r*.68,y-r*.05);X.arc(x+r*.38,y-r*.05,r*.3,0,7);X.stroke();X.beginPath();X.moveTo(x-r*.65,y-r*.5);X.lineTo(x-r*.15,y-r*.38);X.moveTo(x+r*.65,y-r*.5);X.lineTo(x+r*.15,y-r*.38);X.stroke()}
 X.strokeStyle=who==='q'?QC:who==='t'?'#5cc8ff':LC;X.lineWidth=2;X.shadowColor=X.strokeStyle;X.shadowBlur=8;X.beginPath();X.arc(x,y,r,0,7);X.stroke();X.shadowBlur=0}
function crown(X,x,y,s){X.fillStyle='#ffd84a';X.beginPath();X.moveTo(x-s,y);X.lineTo(x-s,y-s*.9);X.lineTo(x-s*.5,y-s*.4);X.lineTo(x,y-s*1.1);X.lineTo(x+s*.5,y-s*.4);X.lineTo(x+s,y-s*.9);X.lineTo(x+s,y);X.closePath();X.fill()}
/* draw the board into any ctx at x,y,w,h; big=true for the expanded view */
function board(X,x,y,w,h,t,big){const S=series(),u=big?Math.min(w/300,h/170):w/220,fs=n=>Math.round(n*u)+'px Inter,sans-serif',R=S.rows;
 X.save();X.fillStyle='#070d10';X.beginPath();X.roundRect(x,y,w,h,8*u);X.fill();X.strokeStyle='#2a3a40';X.lineWidth=2;X.stroke();
 const ar=9*u,top=y+15*u,lead=R.length>1?R.slice().sort((a,b)=>b.cur-a.cur)[0]:null,tied=lead&&R.filter(r=>Math.abs(r.cur-lead.cur)<1e-9).length>1;
 const slots=NM.map((n,i)=>({n,x:x+w*(i+.5)/3}));
 slots.forEach(sl=>{const r=R.find(z=>z.n===sl.n);X.globalAlpha=r?1:.4;face(X,sl.x-24*u,top,ar,sl.n[0]);if(r&&lead&&!tied&&lead.n===sl.n)crown(X,sl.x-24*u,top-ar-1,5.5*u);
  X.textAlign='left';X.font='800 '+fs(10);X.fillStyle=COL[sl.n];X.fillText(LAB[sl.n],sl.x-12*u,top-1*u);X.font='800 '+fs(r||big?10:8);X.fillStyle=r?(r.cur<0?'#ff5c6c':COL[sl.n]):'#8aa098';X.fillText(r?f(r.cur):(big?'no trades yet':'no trades'),sl.x-12*u,top+9*u);X.globalAlpha=1});
 const cx=x+8*u,cy=y+32*u,cw=w-16*u,ch=h-50*u,all=[].concat(...R.map(r=>r.pts));
 if(all.length){let t0=Math.min(...all.map(p=>p[0])),t1=Math.max(...all.map(p=>p[0]));if(t1<=t0)t0=t1-1;
  let lo=Math.min(0,...all.map(p=>p[1])),hi=Math.max(0,...all.map(p=>p[1]));const pad=Math.max(1,(hi-lo)*.12);lo-=pad;hi+=pad;
  const px=v=>cx+(v-t0)/(t1-t0)*cw,py=v=>cy+ch-(v-lo)/(hi-lo)*ch;
  X.strokeStyle='#ffffff22';X.setLineDash([3*u,4*u]);X.lineWidth=1;X.beginPath();X.moveTo(cx,py(0));X.lineTo(cx+cw,py(0));X.stroke();X.setLineDash([]);
  R.forEach(r=>{const a=r.pts.length>1?r.pts:[[t0,0]].concat(r.pts);X.strokeStyle=r.c;X.lineWidth=2*u;X.shadowColor=r.c;X.shadowBlur=6;X.beginPath();a.forEach((p,i)=>i?X.lineTo(px(p[0]),py(p[1])):X.moveTo(px(p[0]),py(p[1])));X.stroke();X.shadowBlur=0;
   X.fillStyle=r.c;X.beginPath();X.arc(px(a[a.length-1][0]),py(r.cur),2.6*u*(1+.25*Math.sin(t/300)),0,7);X.fill()})}
 if(!R.length){X.textAlign='center';X.fillStyle='#8aa098';X.font='700 '+fs(11);X.fillText('Fresh paper books · the race starts at the first trade',x+w/2,y+h*.55)}
 X.textAlign='left';X.font='700 '+fs(9);slots.forEach(sl=>{const r=R.find(z=>z.n===sl.n);if(r){X.fillStyle=COL[sl.n];X.fillText('W'+r.w+'·L'+r.l,sl.x-24*u,y+h-7*u)}});
 const lv=R.some(r=>r.live),dl=R.some(r=>r.live&&r.dl);if(lv){const c=dl?'#f5b342':'#3fe07a';X.fillStyle=c;X.globalAlpha=dl?1:.55+.45*Math.sin(t/190);X.beginPath();X.arc(x+w-36*u,y+h-10*u,2.6*u,0,7);X.fill();X.globalAlpha=1;X.font='800 '+fs(7);X.fillText(dl?'DELAYED':'LIVE',x+w-31*u,y+h-7.5*u)}
 if(!big){X.textAlign='right';X.fillStyle='#8aa098';X.font='600 '+fs(7);X.fillText('tap to expand',x+w-8*u,y+h-17*u)}
 X.restore();return S}
/* office actor drawn behind everyone (y=-1), covering the old whiteboard */
let pointing=0;
O.addActor({id:'vsboard-cover',y:-.95,draw(X){const o=old(),wg=X.createLinearGradient(0,0,0,O.height);wg.addColorStop(0,'#0e1518');wg.addColorStop(1,'#090d0f');X.fillStyle=wg;X.fillRect(o.x-4,o.y-4,o.w+8,o.h+8)}});
let vscEl=null;
O.addActor({id:'vsboard',y:-.5,draw(X,t){const r=rect();if(!vscEl||!vscEl.isConnected)vscEl=document.querySelector('.vsc:not(.vsc-x)');const covered=!!vscEl;if(!covered)board(X,r.x,r.y,r.w,r.h,t,false);
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
function open(){if(ov)return;ov=document.createElement('div');ov.className='vs-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Quanty vs Ledger vs Twitter');
 ov.innerHTML='<div class="vs-box"><button class="vs-x" aria-label="Close">×</button><p class="vs-note"><span class="vs-lv"></span> <span class="vs-bk">Each trader has their own separate paper bank.</span> Paper trading only, not financial advice.</p></div>';
 document.body.appendChild(ov);const close=()=>{clearInterval(raf);ov&&ov.remove();ov=null};
 ov.addEventListener('click',e=>{if(e.target===ov||e.target.classList.contains('vs-x'))close()});
 const lv=()=>{const e=ov&&ov.querySelector('.vs-lv');if(e&&window.DeskBooks){const B=DeskBooks.get(),L=Object.values(B).filter(b=>b&&b.live);e.innerHTML=L.length?DeskBooks.badge(L.some(b=>b.delayed)):''}const k=ov&&ov.querySelector('.vs-bk');if(k&&window.DeskBooks){const st=['quanty','ledger','twitter'].map(n=>DeskBooks.book(n)).filter(b=>b&&b.start).map(b=>b.start);k.textContent=st.length&&st.every(v=>v===st[0])?'Each trader has their own separate '+st[0]+' SOL paper bank.':'Each trader has their own separate paper bank.'}};lv();raf=setInterval(lv,2000)}
/* score line for Ledger's bubble card */
window.DeskVS={rect,series,cardHTML(){if(window.DeskBooks){const B0=DeskBooks.get(),B={};NM.forEach(n=>{if(B0[n]&&B0[n].traded)B[n]=B0[n]});const r=NM.filter(n=>B[n]).sort((a,b)=>B[b].pct-B[a].pct);return '<br><b>RACE</b>: '+NM.map(n=>B[n]?`<span style="color:${COL[n]}">${LAB[n][0]} ${f(B[n].pct)}</span>`:`<span class="mt">${LAB[n][0]} no trades</span>`).join(' · ')+(r.length?`<br><span class="mt">${LAB[r[0]]} leads</span>`:'')}const S=series(),lead=S.qc===S.lc?'tied':(S.qc>S.lc?'Quanty leads':'Ledger leads');
 return `<br><b>QUANTY vs LEDGER</b>: <span style="color:${QC}">${f(S.qc)}</span> vs <span style="color:${LC}">${f(S.lc)}</span> · ${lead}<br><span class="mt">W/L ${S.qw}-${S.ql} vs ${S.lw}-${S.ll}</span>`}};
})();
