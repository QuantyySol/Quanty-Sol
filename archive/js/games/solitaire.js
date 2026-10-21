/* Solitaire: classic Klondike, draw 1. Tap a card to send it to the best legal spot, or drag it.
   Undo, new deal, moves + timer, auto-finish once every tableau card is face up, bouncing-cards win.
   Best time / moves stay in this browser only. */
SB.reg('solitaire',A=>{const{W,H}=A,CW=42,CH=58,GP=(W-7*CW)/8,TY=26,TY2=TY+CH+10,BOT=H-40,BY=H-33,BH=26,BK='uq_sb_best_solitaire';
const cx=i=>GP+i*(CW+GP),suit=c=>c/13|0,rank=c=>c%13+1,red=c=>suit(c)===1||suit(c)===2,SY=['\u2660','\u2665','\u2666','\u2663'],RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const now=()=>performance.now()/1000,mk=(w,h)=>{const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const x=c.getContext('2d');x.scale(2,2);return[c,x]};
let st,ws,fd,tb,up,mv,tm,on,hist,fl,hid,drag,press,won,auto,autoT,casc,newArm,busyTo,shake,best,lastFx;
const rd=()=>{try{const v=JSON.parse(localStorage.getItem(BK)||'null');return v&&typeof v==='object'?v:{}}catch(e){return{}}};
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
/* ---- pre-rendered art: felt, 52 faces, one back ---- */
const FELT=(()=>{const[c,x]=mk(W,H);const gr=x.createRadialGradient(W/2,H*.4,20,W/2,H*.45,H*.75);gr.addColorStop(0,'#2f9a45');gr.addColorStop(.6,'#1b6e2e');gr.addColorStop(1,'#0c3f19');x.fillStyle=gr;x.fillRect(0,0,W,H);
 for(let i=0;i<5000;i++){x.fillStyle=Math.random()<.5?'rgba(0,0,0,.07)':'rgba(255,255,255,.05)';x.fillRect(Math.random()*W,Math.random()*H,.6,.6)}return c})();
function face(id){const[c,x]=mk(CW+2,CH+2),s=suit(id),r=rank(id),col=red(id)?'#c8102e':'#111';
 x.fillStyle='rgba(0,0,0,.35)';rr(x,1.2,1.4,CW,CH,4);x.fill();const gr=x.createLinearGradient(0,0,0,CH);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#ecebe2');x.fillStyle=gr;rr(x,0,0,CW,CH,4);x.fill();x.strokeStyle='#8a8f96';x.lineWidth=.6;x.stroke();
 x.fillStyle=col;x.textAlign='center';x.font='bold '+(r===10?11:13)+'px Helvetica,Arial,sans-serif';x.fillText(RK[r-1],8,13);x.font='11px Helvetica,Arial,sans-serif';x.fillText(SY[s]+'\uFE0E',8,24);
 x.font='9px Helvetica,Arial,sans-serif';x.fillText(SY[s]+'\uFE0E',CW-7,11);
 if(r>10){x.fillStyle=red(id)?'#fde7c4':'#e3ecfb';rr(x,14,17,CW-18,CH-21,3);x.fill();x.strokeStyle='#c99a2e';x.lineWidth=1.2;x.stroke();x.fillStyle=col;x.font='22px Georgia,serif';x.fillText(['\u265E','\u265B','\u265A'][r-11]+'\uFE0E',14+(CW-18)/2,CH-14)}
 else{x.font=(r===1?30:24)+'px Helvetica,Arial,sans-serif';x.fillText(SY[s]+'\uFE0E',CW/2+5,CH-(r===1?12:10))}return c}
const FACES=[...Array(52).keys()].map(face),BACK=(()=>{const[c,x]=mk(CW+2,CH+2);x.fillStyle='rgba(0,0,0,.35)';rr(x,1.2,1.4,CW,CH,4);x.fill();x.fillStyle='#fff';rr(x,0,0,CW,CH,4);x.fill();x.strokeStyle='#8a8f96';x.lineWidth=.6;x.stroke();
 const gr=x.createLinearGradient(0,0,CW,CH);gr.addColorStop(0,'#3b6fd1');gr.addColorStop(1,'#14357a');x.fillStyle=gr;rr(x,3,3,CW-6,CH-6,3);x.fill();x.save();rr(x,3,3,CW-6,CH-6,3);x.clip();x.strokeStyle='rgba(255,255,255,.28)';x.lineWidth=.8;
 for(let i=-CH;i<CW+CH;i+=5){x.beginPath();x.moveTo(i,0);x.lineTo(i+CH,CH);x.stroke();x.beginPath();x.moveTo(i+CH,0);x.lineTo(i,CH);x.stroke()}x.restore();x.fillStyle='#fff';x.font='bold 12px Georgia,serif';x.textAlign='center';x.fillText('\u2663\uFE0E',CW/2,CH/2+4);return c})();
const card=(x,id,X,Y,faceUp)=>x.drawImage(faceUp?FACES[id]:BACK,X,Y,CW+2,CH+2);
/* ---- layout ---- */
function ys(i){const p=tb[i];let nd=0;p.forEach(c=>{if(!up[c])nd++});const nu=p.length-nd,av=BOT-TY2-CH;let fd0=7,fu=17;
 if(nu>1&&nd*fd0+(nu-1)*fu>av)fu=Math.max(6,(av-nd*fd0)/(nu-1));if(nd*fd0+(nu-1)*fu>av)fd0=Math.max(2,(av-(nu-1)*fu)/Math.max(1,nd));
 const o=[];let y=TY2;p.forEach((c,j)=>{o.push(y);y+=up[c]?fu:fd0});return o}
function where(id){let k=st.indexOf(id);if(k>=0)return{p:'s',k};k=ws.indexOf(id);if(k>=0)return{p:'w',k};for(let i=0;i<4;i++){k=fd[i].indexOf(id);if(k>=0)return{p:'f',i,k}}for(let i=0;i<7;i++){k=tb[i].indexOf(id);if(k>=0)return{p:'t',i,k}}return null}
function posOf(id){const w=where(id);if(!w)return[0,0];if(w.p==='s')return[cx(0),TY];if(w.p==='w')return[cx(1),TY];if(w.p==='f')return[cx(3+w.i),TY];return[cx(w.i),ys(w.i)[w.k]]}
const pile=s=>s.p==='s'?st:s.p==='w'?ws:s.p==='f'?fd[s.i]:tb[s.i],top=a=>a[a.length-1];
function fits(ids,d){const c=ids[0],p=pile(d),t=top(p);if(d.p==='f')return ids.length===1&&(t==null?rank(c)===1:suit(t)===suit(c)&&rank(c)===rank(t)+1);
 if(d.p==='t')return t==null?rank(c)===13:up[t]&&red(t)!==red(c)&&rank(t)===rank(c)+1;return false}
/* ---- moves ---- */
function snap(){hist.push(JSON.stringify([st,ws,fd,tb,[...up],mv]));if(hist.length>300)hist.shift()}
function fly(ids,from,dur,delay){const t=now()+(delay||0);ids.forEach((id,k)=>{hid.add(id);fl.push({id,fx:from[k][0],fy:from[k][1],t0:t,d:dur||.13})})}
function tick(){A.beep(1500,.025,'triangle',.035)}
function act(){if(!on)on=1;mv++}
function moveCards(s,n,d,o){o=o||{};const sp=pile(s),ids=sp.slice(sp.length-n);if(!fits(ids,d))return false;if(!o.free)snap();
 const from=o.from||ids.map(posOf);sp.length-=n;pile(d).push(...ids);if(s.p==='t'&&sp.length&&!up[top(sp)]){up[top(sp)]=1;setTimeout(()=>A.beep(900,.03,'sine',.04),90)}
 fly(ids,from,o.dur);if(o.free){if(!on)on=1}else act();d.p==='f'?A.beep(1050+rank(ids[0])*40,.06,'sine',.05):tick();after();return true}
function drawStock(free){if(st.length){if(!free)snap();const id=st.pop(),f=[cx(0),TY];up[id]=1;ws.push(id);fly([id],[f],.12);free?(on=on||1):act();tick();return true}
 if(ws.length){if(!free)snap();while(ws.length){const id=ws.pop();up[id]=0;st.push(id)}free?0:act();A.slide(700,300,.12,'triangle');return true}return false}
function undo(){if(!hist.length||auto||won){A.beep(160,.06);return}const s=JSON.parse(hist.pop());[st,ws,fd,tb]=s;up=s[4];mv=s[5]+1;fl=[];hid.clear();A.slide(500,800,.08,'sine')}
function target(ids,s){const c=ids[0];if(ids.length===1)for(let i=0;i<4;i++)if(fits(ids,{p:'f',i}))return{p:'f',i};
 let alt=null;for(let i=0;i<7;i++){if(s.p==='t'&&s.i===i)continue;const d={p:'t',i};if(!fits(ids,d))continue;if(tb[i].length)return d;
  if(!(s.p==='t'&&tb[s.i].length===ids.length)&&!alt)alt=d}return alt}
function tapAt(h){if(h.p==='s'){drawStock();return}const sp=pile(h),n=sp.length-h.k;if(!n||!up[sp[h.k]])return;const ids=sp.slice(h.k),d=target(ids,h);
 if(d)moveCards(h,n,d);else{shake={id:ids[0],t:now()};A.beep(170,.07)}}
function after(){if(fd.every(f=>f.length===13)){if(!won){won=1;casc={t:-.7};}return}if(!auto&&tb.every(p=>p.every(c=>up[c]))){auto=1;autoT=.35}}
function autoStep(){let bestc=null;const cands=[];if(ws.length)cands.push({p:'w',k:ws.length-1});tb.forEach((p,i)=>{if(p.length)cands.push({p:'t',i,k:p.length-1})});
 cands.forEach(h=>{const id=pile(h)[h.k];for(let i=0;i<4;i++)if(fits([id],{p:'f',i})&&(!bestc||rank(id)<rank(bestc.id)))bestc={h,id,i}});
 if(bestc){moveCards(bestc.h,1,{p:'f',i:bestc.i},{free:1,dur:.11});return}if(!drawStock(true))auto=0}
/* ---- hit testing ---- */
function hit(x,y){if(y>=TY&&y<=TY+CH){if(x>=cx(0)&&x<=cx(0)+CW)return{p:'s'};if(x>=cx(1)&&x<=cx(1)+CW&&ws.length)return{p:'w',k:ws.length-1};for(let i=0;i<4;i++)if(x>=cx(3+i)&&x<=cx(3+i)+CW&&fd[i].length)return{p:'f',i,k:fd[i].length-1}}
 for(let i=0;i<7;i++){if(x<cx(i)-GP/2||x>cx(i)+CW+GP/2)continue;const Y=ys(i);for(let k=tb[i].length-1;k>=0;k--)if(y>=Y[k]&&y<=Y[k]+CH)return{p:'t',i,k}}return null}
function dropAt(dr,x,y){const r=[x,y];let bestd=null,ba=0;const ov=(X,Y)=>Math.max(0,Math.min(r[0]+CW,X+CW)-Math.max(r[0],X))*Math.max(0,Math.min(r[1]+CH,Y+CH)-Math.max(r[1],Y));
 const T=[];for(let i=0;i<4;i++)T.push([{p:'f',i},cx(3+i),TY]);for(let i=0;i<7;i++){const Y=ys(i);T.push([{p:'t',i},cx(i),tb[i].length?Y[Y.length-1]:TY2])}
 T.forEach(([d,X,Y])=>{if(d.p===dr.s.p&&d.i===dr.s.i)return;const a=ov(X,Y);if(a>ba&&fits(dr.ids,d)){ba=a;bestd=d}});return bestd}
/* ---- buttons ---- */
const BTN=[{x:8,w:74,n:()=>newArm>now()?'Tap again':'\u21BB New',f:()=>{if(on&&!won&&newArm<now()){newArm=now()+2.5;A.beep(600,.04);return}deal()}},{x:88,w:74,n:()=>'\u21B6 Undo',f:undo}];
function deal(){const d=[...Array(52).keys()];for(let i=51;i>0;i--){const j=Math.random()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]]}
 st=[];ws=[];fd=[[],[],[],[]];tb=[[],[],[],[],[],[],[]];up=new Array(52).fill(0);mv=0;tm=0;on=0;hist=[];fl=[];hid=new Set();drag=null;press=null;won=0;auto=0;casc=null;newArm=0;shake=null;best=rd();
 let n=0;for(let r=0;r<7;r++)for(let i=r;i<7;i++){const id=d.pop();tb[i].push(id);if(i===r)up[id]=1;fly([id],[[cx(0),TY]],.16,n++*.03)}st=d;busyTo=now()+n*.03+.15;A.beep(800,.03,'triangle',.03)}
/* ---- win cascade: cards leave the foundations one by one and bounce off the floor, leaving trails ---- */
let OC,OX;function cascStart(){[OC,OX]=mk(W,H);paint(OX,1);casc.cards=[];casc.n=0;casc.next=0;casc.acc=0;casc.t=0}
function cascStep(dt){casc.t+=dt;casc.acc+=dt;while(casc.acc>=1/60){casc.acc-=1/60;const t=casc.t;
 if(casc.n<52&&t>=casc.next){const i=3-casc.n%4,id=fd[i].pop();if(id!=null){casc.cards.push({id,x:cx(3+i),y:TY,vx:(Math.random()<.5?-1:1)*(60+Math.random()*170),vy:-Math.random()*260});
  OX.drawImage(FELT,cx(3+i)*2-2,(TY-1)*2,(CW+4)*2,(CH+4)*2,cx(3+i)-1,TY-1,CW+4,CH+4);fd[i].length?card(OX,top(fd[i]),cx(3+i),TY,1):slot(OX,cx(3+i),TY,'A')}casc.n++;casc.next=t+.22}
 casc.cards.forEach(c=>{c.vy+=900/60;c.x+=c.vx/60;c.y+=c.vy/60;if(c.y>H-CH){c.y=H-CH;c.vy=-c.vy*(.68+Math.random()*.12)}card(OX,c.id,c.x,c.y,1)});
 casc.cards=casc.cards.filter(c=>c.x>-CW-4&&c.x<W+4)}if((casc.n>=52&&!casc.cards.length)||casc.t>22)finish()}
function finish(){if(casc.done)return;casc.done=1;const s=Math.round(tm),score=Math.max(100,Math.round(520+700000/Math.max(30,s)-5*mv)),b=rd();
 const nb=b.t==null||s<b.t,nm=b.m==null||mv<b.m;try{localStorage.setItem(BK,JSON.stringify({t:Math.min(s,b.t==null?s:b.t),m:Math.min(mv,b.m==null?mv:b.m),w:(b.w||0)+1}))}catch(e){}best=rd();
 A.over(score,{h:'\uD83C\uDF89 You won!',p:'\u23F1 '+fmt(s)+(nb?' (best!)':'')+' \u00B7 '+mv+' moves'+(nm?' (best!)':''),d:s,m:mv})}
const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
/* ---- drawing ---- */
function slot(x,X,Y,lab){x.fillStyle='rgba(0,0,0,.18)';rr(x,X,Y,CW,CH,4);x.fill();x.strokeStyle='rgba(255,255,255,.28)';x.lineWidth=1;x.stroke();if(lab){x.fillStyle='rgba(255,255,255,.28)';x.font='bold 18px Georgia,serif';x.textAlign='center';x.fillText(lab,X+CW/2,Y+CH/2+6)}}
const sh=(c,T)=>shake&&shake.id===c&&T-shake.t<.3?Math.sin((T-shake.t)*60)*3:0;
function paint(x,still){const T=now();x.drawImage(FELT,0,0,W,H);
 slot(x,cx(0),TY,st.length?'':'\u21BB');for(let i=0;i<4;i++)slot(x,cx(3+i),TY,'A');for(let i=0;i<7;i++)slot(x,cx(i),TY2,'K');
 for(let k=0;k<Math.min(3,Math.ceil(st.length/8));k++)if(st.length)card(x,top(st),cx(0)-k*.8,TY-k*.8,0);
 const vis=a=>a.filter(c=>!hid.has(c));const w=vis(ws);if(w.length>1)card(x,w[w.length-2],cx(1),TY,1);if(w.length)card(x,top(w),cx(1)+sh(top(w),T),TY,1);
 fd.forEach((f,i)=>{const v=vis(f);if(v.length)card(x,top(v),cx(3+i)+sh(top(v),T),TY,1)});
 tb.forEach((p,i)=>{const Y=ys(i);p.forEach((c,k)=>{if(hid.has(c))return;card(x,c,cx(i)+sh(c,T),Y[k],up[c])})});
 if(still)return;
 fl=fl.filter(f=>{const k=(T-f.t0)/f.d;if(k>=1){hid.delete(f.id);return false}return true});
 fl.forEach(f=>{const k=(T-f.t0)/f.d;if(k<0)return;const e=1-Math.pow(1-k,3),[tx,ty]=posOf(f.id);card(x,f.id,f.fx+(tx-f.fx)*e,f.fy+(ty-f.fy)*e,up[f.id])});
 if(drag&&drag.on){x.save();x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=8;x.shadowOffsetY=3;drag.ids.forEach((c,k)=>card(x,c,drag.x-drag.ox,drag.y-drag.oy+k*17,1));x.restore()}}
function hud(x){x.fillStyle='rgba(0,0,0,.28)';x.fillRect(0,0,W,20);A.txt('Moves '+mv,6,15,12);A.txt('\u23F1 '+fmt(tm),W/2,15,12,'#fff','center');
 A.txt(best&&best.t!=null?'Best '+fmt(best.t)+' \u00B7 '+best.m:'Best \u2013',W-6,15,12,'#ffe27a','right')}
function bar(x){const gr=x.createLinearGradient(0,H-40,0,H);gr.addColorStop(0,'rgba(60,60,60,.85)');gr.addColorStop(.5,'rgba(25,25,25,.9)');gr.addColorStop(.5,'rgba(0,0,0,.92)');gr.addColorStop(1,'rgba(10,10,10,.95)');x.fillStyle=gr;x.fillRect(0,H-40,W,40);
 BTN.forEach(b=>{const g2=x.createLinearGradient(0,BY,0,BY+BH);g2.addColorStop(0,'#6b6b6b');g2.addColorStop(.5,'#3a3a3a');g2.addColorStop(.5,'#262626');g2.addColorStop(1,'#3d3d3d');x.fillStyle=g2;rr(x,b.x,BY,b.w,BH,6);x.fill();x.strokeStyle='#111';x.lineWidth=1;x.stroke();A.txt(b.n(),b.x+b.w/2,BY+17,12,'#fff','center')});
 A.txt(auto?'Finishing\u2026':'Draw 1 \u00B7 Wins '+((best&&best.w)||0),W-8,BY+17,11,'#cfe','right')}
return{help:'Classic Klondike, draw 1. Tap a card to send it to the best spot, or drag it. Build down in alternating colours; aces up to the foundations.',
reset:deal,
down(x,y){if(casc){if(casc.t>.3)finish();return}if(y>=BY-4){const b=BTN.find(b=>x>=b.x&&x<=b.x+b.w);b&&b.f();return}if(auto||now()<busyTo)return;
 const h=hit(x,y);if(!h)return;press={x,y,h};if(h.p!=='s'){const sp=pile(h);if(up[sp[h.k]]){const ids=sp.slice(h.k),p=posOf(ids[0]);drag={on:0,ids,s:h,ox:x-p[0],oy:y-p[1],x,y}}}},
move(x,y,d){if(!drag||!d)return;drag.x=x;drag.y=y;if(!drag.on&&Math.hypot(x-press.x,y-press.y)>6){drag.on=1;drag.ids.forEach(c=>hid.add(c))}},
up(x,y){const p=press,dr=drag;press=null;drag=null;if(!p)return;
 if(dr&&dr.on){dr.ids.forEach(c=>hid.delete(c));const from=dr.ids.map((c,k)=>[dr.x-dr.ox,dr.y-dr.oy+k*17]);const d=dropAt(dr,dr.x-dr.ox,dr.y-dr.oy);
  if(d&&moveCards(dr.s,dr.ids.length,d,{from,dur:.08}))return;fly(dr.ids,from,.15);A.beep(220,.05);return}tapAt(p.h)},
press(k){if(k==='u'||k==='z'||k==='Backspace')undo();else if(k===' '||k==='d')!auto&&drawStock();else if(k==='n')BTN[0].f()},
update(dt){if(on&&!won)tm+=dt;if(auto&&!won){autoT-=dt;if(autoT<=0&&!fl.some(f=>now()<f.t0+f.d*.6)){autoT=.07;autoStep()}}
 if(casc&&!casc.done){if(casc.t<0){casc.t+=dt;if(casc.t>=0&&!fl.length)cascStart();else if(casc.t>=0)casc.t=-.05;return}cascStep(dt)}},
draw(x){if(casc&&casc.cards){x.drawImage(OC,0,0,W,H);hud(x);A.txt('Tap to skip',W/2,H-14,11,'#cfe','center');return}paint(x);hud(x);bar(x)},
stop(){fl=[];casc=null},
_state(){return{st:st.slice(),ws:ws.slice(),fd:fd.map(f=>f.slice()),tb:tb.map(p=>p.slice()),up:up.slice(),mv,tm,won,auto,ys:tb.map((p,i)=>ys(i)),cw:CW,ch:CH,cx:[0,1,2,3,4,5,6].map(cx),ty:TY,ty2:TY2,by:BY}},
_nearWin(){deal();fl=[];hid.clear();busyTo=0;st=[];ws=[];tb=[[],[],[],[],[],[],[]];up=new Array(52).fill(1);fd=[0,1,2,3].map(s=>[...Array(12).keys()].map(r=>s*13+r));[0,1,2,3].forEach(s=>tb[s].push(s*13+12));on=1;after()}}});
