/* Sudoku: classic 9x9 number puzzle. Every puzzle is generated in the browser with exactly one solution.
   Easy / Medium / Hard, tap a cell then a number (or type 1-9), pencil marks, undo, mistake highlighting,
   timer. Best times and the game in progress stay in this browser only. */
SB.reg('sudoku',A=>{const{W,H}=A,BK='uq_sb_best_sudoku',CK='uq_sb_sudoku_cur',OK='uq_sb_sudoku_opt',CS=33,GX=(W-CS*9)/2,GY=52,PY=GY+CS*9+8,PH=40,BY=H-33,BH=26;
const LV=[{k:'e',n:'Easy',g:38,lg:1},{k:'m',n:'Medium',g:30,lg:1},{k:'h',n:'Hard',g:24,lg:0}],BASE=[300,600,1000];
const rd=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?d:v}catch(e){return d}},wr=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const now=()=>performance.now()/1000,fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
/* ---- board geometry: rows, columns, boxes and each cell's 20 peers ---- */
const RW=i=>i/9|0,CL=i=>i%9,BX=i=>(i/27|0)*3+((i%9)/3|0),UN=[],PE=[];
for(let k=0;k<9;k++){UN.push([...Array(9)].map((_,j)=>k*9+j),[...Array(9)].map((_,j)=>j*9+k),[...Array(9)].map((_,j)=>((k/3|0)*3+(j/3|0))*9+(k%3)*3+j%3))}
for(let i=0;i<81;i++){const s=new Set();for(let j=0;j<81;j++)if(j!==i&&(RW(j)===RW(i)||CL(j)===CL(i)||BX(j)===BX(i)))s.add(j);PE.push([...s])}
const pop=m=>{let c=0;while(m){m&=m-1;c++}return c},shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
/* ---- bitmask backtracking solver: counts solutions up to `lim`; with rnd it fills a random full grid ---- */
function solve(g0,lim,rnd,out){const g=g0.slice(),R=Array(9).fill(0),C=Array(9).fill(0),B=Array(9).fill(0);
 for(let i=0;i<81;i++)if(g[i]){const m=1<<g[i];if((R[RW(i)]|C[CL(i)]|B[BX(i)])&m)return 0;R[RW(i)]|=m;C[CL(i)]|=m;B[BX(i)]|=m}
 let n=0;const rec=()=>{let bi=-1,bm=0,bc=10;for(let i=0;i<81;i++)if(!g[i]){const m=~(R[RW(i)]|C[CL(i)]|B[BX(i)])&0x3FE,c=pop(m);if(c<bc){bc=c;bi=i;bm=m;if(c<2)break}}
  if(bi<0){n++;if(out&&n===1)out.push(...g);return n>=lim}if(!bc)return false;const ds=[];for(let d=1;d<10;d++)if(bm>>d&1)ds.push(d);if(rnd)shuf(ds);
  const r=RW(bi),c=CL(bi),b=BX(bi);for(const d of ds){const m=1<<d;R[r]|=m;C[c]|=m;B[b]|=m;g[bi]=d;if(rec())return true;R[r]&=~m;C[c]&=~m;B[b]&=~m;g[bi]=0}return false};
 rec();return n}
/* ---- logic grader: can it be finished with naked + hidden singles only? (keeps Easy/Medium guess-free) ---- */
function singles(g0){const g=g0.slice();for(let guard=0;guard<200;guard++){let prog=false;const cd=Array(81).fill(0);
 for(let i=0;i<81;i++)if(!g[i]){let m=0x3FE;for(const p of PE[i])if(g[p])m&=~(1<<g[p]);if(!m)return false;cd[i]=m;if(pop(m)===1){g[i]=31-Math.clz32(m);prog=true}}
 if(prog)continue;for(const u of UN)for(let d=1;d<10;d++){let k=0,at=-1;for(const i of u){if(g[i]===d){k=9;break}if(!g[i]&&cd[i]>>d&1){k++;at=i}}if(k===1){g[at]=d;prog=true}}
 if(!prog)break}return g.every(v=>v)}
function generate(lv){if(lv===2){let bestg=null,sc=1e9;for(let k=0;k<8;k++){const g=gen1(2),n=g.P.filter(v=>v).length+(singles(g.P)?100:0);if(n<sc){sc=n;bestg=g}if(sc<27)break}return bestg}return gen1(lv)}
function gen1(lv){const L=LV[lv],full=[];solve(Array(81).fill(0),1,true,full);const p=full.slice();let giv=81;
 const order=shuf([...Array(41).keys()]);for(const i of order){if(giv<=L.g)break;const j=80-i,cells=i===j?[i]:[i,j];if(cells.some(c=>!p[c]))continue;
  const keep=cells.map(c=>p[c]);cells.forEach(c=>p[c]=0);if(solve(p,2)===1&&(!L.lg||singles(p)))giv-=cells.length;else cells.forEach((c,k)=>p[c]=keep[k])}
 return{P:p,S:full}}
/* ---- state ---- */
let P,S,V,N,sel,pen,hist,tm,mi,mv,lv,won,winT,arm,armLv,shake,best,opt;
const given=i=>P[i]>0,val=i=>P[i]||V[i],wrong=i=>!given(i)&&V[i]&&V[i]!==S[i];
function save(){if(won)return;wr(CK,{lv,P,S,V,N,tm:Math.round(tm),mi,mv})}
function fresh(l){if(l!=null)lv=l;const g=generate(lv);P=g.P;S=g.S;V=Array(81).fill(0);N=Array(81).fill(0);sel=P.indexOf(0);hist=[];tm=0;mi=0;mv=0;won=0;winT=0;arm=0;shake=null;opt.lv=lv;wr(OK,opt);save()}
function load(){opt=rd(OK,{});if(typeof opt!=='object'||!opt)opt={};if(opt.mk==null)opt.mk=1;lv=[0,1,2].includes(opt.lv)?opt.lv:0;best=rd(BK,{});if(typeof best!=='object'||!best)best={};pen=0;
 const c=rd(CK,null);if(c&&Array.isArray(c.P)&&c.P.length===81&&Array.isArray(c.S)&&c.S.length===81&&Array.isArray(c.V)&&Array.isArray(c.N)&&c.S.every((d,i)=>d>=1&&d<=9&&(!c.P[i]||c.P[i]===d))){
  P=c.P;S=c.S;V=c.V;N=c.N;lv=[0,1,2].includes(c.lv)?c.lv:0;tm=+c.tm||0;mi=+c.mi||0;mv=+c.mv||0;hist=[];won=0;winT=0;arm=0;shake=null;sel=P.indexOf(0);if(sel<0)sel=0;return}
 fresh()}
const busy=()=>V&&V.some((v,i)=>v||N[i]);
function snap(){hist.push([V.slice(),N.slice()]);if(hist.length>400)hist.shift()}
function undo(){if(won||!hist.length){A.beep(160,.06);return}[V,N]=hist.pop();A.slide(500,800,.08,'sine');save()}
function enter(d){if(won)return;if(sel==null||sel<0)return;if(given(sel)){shake={i:sel,t:now()};A.beep(170,.07);return}
 if(pen){if(V[sel]){A.beep(170,.06);return}snap();N[sel]^=1<<d;A.beep(1200,.025,'triangle',.03);save();return}
 snap();mv++;if(V[sel]===d){V[sel]=0;A.beep(700,.03,'triangle',.03);save();return}
 V[sel]=d;N[sel]=0;PE[sel].forEach(p=>{N[p]&=~(1<<d)});
 if(d!==S[sel]){mi++;if(opt.mk){shake={i:sel,t:now()};A.beep(180,.12,'sawtooth',.04)}else A.beep(1000,.04,'sine',.05)}else A.beep(1000+d*40,.05,'sine',.05);
 check();save()}
function erase(){if(won||sel<0||given(sel))return;if(!V[sel]&&!N[sel])return;snap();V[sel]=0;N[sel]=0;A.beep(500,.04,'triangle',.03);save()}
function check(){for(let i=0;i<81;i++)if(val(i)!==S[i])return;won=1;winT=0;wr(CK,null);
 [0,4,7,12].forEach((k,j)=>setTimeout(()=>A.beep([784,988,1175,1568][j],.14,'sine',.06),j*110))}
function finish(){if(won!==1)return;won=2;const s=Math.round(tm),b=best[LV[lv].k]||{},nb=b.t==null||s<b.t;
 best[LV[lv].k]={t:nb?s:b.t,w:(b.w||0)+1};wr(BK,best);const score=Math.max(50,Math.round(BASE[lv]+BASE[lv]*240/Math.max(60,s)-15*mi));
 A.over(score,{h:'\uD83C\uDF89 Solved!',p:LV[lv].n+' \u00B7 \u23F1 '+fmt(s)+(nb?' (best!)':'')+' \u00B7 '+mi+' mistake'+(mi===1?'':'s'),d:s,m:mv,lv:LV[lv].k})}
function newGame(l){const L=l==null?lv:l;if(busy()&&!won&&!(arm>now()&&armLv===L)){arm=now()+2.5;armLv=L;A.beep(600,.04);return}arm=0;fresh(L);A.beep(800,.04,'triangle',.04)}
/* ---- layout ---- */
const SEG={x:40,y:25,w:240,h:21},PW=(W-16-8*3)/9,padX=i=>8+i*(PW+3);
const BTN=[{x:6,w:58,n:()=>arm>now()&&armLv===lv?'Tap again':'\u21BB New',f:()=>newGame()},{x:68,w:58,n:()=>'\u21B6 Undo',f:undo},{x:130,w:60,n:()=>'\u270E Notes',on:()=>pen,f:()=>{pen^=1;A.beep(pen?1100:800,.04,'sine',.04)}},
 {x:194,w:58,n:()=>'\u232B Erase',f:erase},{x:256,w:58,n:()=>opt.mk?'\u26A0 On':'\u26A0 Off',on:()=>opt.mk,f:()=>{opt.mk^=1;wr(OK,opt);A.beep(900,.04,'sine',.04)}}];
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const x=c.getContext('2d');x.scale(2,2);return[c,x]};
/* pinstripe backdrop like the old grouped-table screens */
const BG=(()=>{const[c,x]=mk(W,H);x.fillStyle='#c5ccd4';x.fillRect(0,0,W,H);x.fillStyle='#cbd2d8';for(let i=0;i<W;i+=7)x.fillRect(i,0,3.5,H);return c})();
function glossy(x,X,Y,w,h,r,top,bot,on){const g2=x.createLinearGradient(0,Y,0,Y+h);g2.addColorStop(0,top[0]);g2.addColorStop(.5,top[1]);g2.addColorStop(.5,bot[0]);g2.addColorStop(1,bot[1]);x.fillStyle=g2;rr(x,X,Y,w,h,r);x.fill();x.strokeStyle=on?'#0b3a8a':'#5d6670';x.lineWidth=1;x.stroke()}
function cellAt(x,y){if(x<GX||y<GY||x>=GX+CS*9||y>=GY+CS*9)return-1;return((y-GY)/CS|0)*9+((x-GX)/CS|0)}
/* ---- drawing ---- */
function hud(x){x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,W,20);const b=best[LV[lv].k];
 A.txt(opt.mk?'Mistakes '+mi:LV[lv].n,6,15,12);A.txt('\u23F1 '+fmt(tm),W/2,15,12,'#fff','center');A.txt(b&&b.t!=null?'Best '+fmt(b.t):'Best \u2013',W-6,15,12,'#ffe27a','right')}
function seg(x){const w=SEG.w/3;LV.forEach((L,i)=>{const X=SEG.x+i*w,on=i===lv;x.save();x.beginPath();x.rect(X,SEG.y,w,SEG.h);x.clip();
  glossy(x,SEG.x,SEG.y,SEG.w,SEG.h,6,on?['#7fa9f0','#4c7fd9']:['#ffffff','#eef0f3'],on?['#3a6fd0','#2b5fc4']:['#dfe3e8','#f3f5f7'],on);x.restore();
  x.font='bold 11px Helvetica,Arial,sans-serif';x.textAlign='center';x.fillStyle=on?'#fff':'#3d4a5c';x.fillText(arm>now()&&armLv===i&&i!==lv?'Tap again':L.n,X+w/2,SEG.y+14.5)});
 x.strokeStyle='#5d6670';x.lineWidth=1;rr(x,SEG.x,SEG.y,SEG.w,SEG.h,6);x.stroke();x.beginPath();x.moveTo(SEG.x+w,SEG.y);x.lineTo(SEG.x+w,SEG.y+SEG.h);x.moveTo(SEG.x+2*w,SEG.y);x.lineTo(SEG.x+2*w,SEG.y+SEG.h);x.stroke()}
function grid(x){const T=now(),sv=sel>=0?val(sel):0;x.save();x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=6;x.shadowOffsetY=2;x.fillStyle='#fff';x.fillRect(GX,GY,CS*9,CS*9);x.restore();
 for(let i=0;i<81;i++){const X=GX+CL(i)*CS,Y=GY+RW(i)*CS,v=val(i);let bg=null;
  if(sel>=0&&!won){if(i===sel)bg='#a9cdfa';else if(sv&&v===sv)bg='#c6dbfb';else if(RW(i)===RW(sel)||CL(i)===CL(sel)||BX(i)===BX(sel))bg='#e4edf9'}
  if(opt.mk&&wrong(i)&&i!==sel)bg='#fbdcdc';
  if(won){const d=(RW(i)+CL(i))*.06,k=winT-d;if(k>0&&k<.5)bg='hsl('+((RW(i)*40+CL(i)*20)%360)+',85%,'+(80-k*20)+'%)';else if(k>=.5)bg='#eaf6e4'}
  if(bg){x.fillStyle=bg;x.fillRect(X,Y,CS,CS)}
  const sx=shake&&shake.i===i&&T-shake.t<.3?Math.sin((T-shake.t)*60)*2.5:0;
  if(v){x.textAlign='center';x.font=(given(i)?'bold ':'')+'21px Helvetica,Arial,sans-serif';x.fillStyle=given(i)?'#1d232b':(opt.mk&&wrong(i))?'#d0161b':'#1f5bd1';x.fillText(v,X+CS/2+sx,Y+CS/2+7.5)}
  else if(N[i]){x.font='9px Helvetica,Arial,sans-serif';x.textAlign='center';for(let d=1;d<10;d++)if(N[i]>>d&1){const hl=sv&&d===sv;x.fillStyle=hl?'#1f5bd1':'#6c7682';if(hl)x.font='bold 9px Helvetica,Arial,sans-serif';
   x.fillText(d,X+5.5+((d-1)%3)*11+sx,Y+9.5+((d-1)/3|0)*10.5);if(hl)x.font='9px Helvetica,Arial,sans-serif'}}}
 x.strokeStyle='#b9c1cb';x.lineWidth=.6;x.beginPath();for(let k=1;k<9;k++){if(k%3===0)continue;x.moveTo(GX+k*CS,GY);x.lineTo(GX+k*CS,GY+CS*9);x.moveTo(GX,GY+k*CS);x.lineTo(GX+CS*9,GY+k*CS)}x.stroke();
 x.strokeStyle='#2c333c';x.lineWidth=1.6;x.beginPath();for(let k=0;k<=9;k+=3){x.moveTo(GX+k*CS,GY);x.lineTo(GX+k*CS,GY+CS*9);x.moveTo(GX,GY+k*CS);x.lineTo(GX+CS*9,GY+k*CS)}x.stroke()}
function pad(x){const cnt=Array(10).fill(0);for(let i=0;i<81;i++)cnt[val(i)]++;
 for(let d=1;d<10;d++){const X=padX(d-1),done=cnt[d]>=9;glossy(x,X,PY,PW,PH,6,done?['#e9ecef','#dde1e5']:['#ffffff','#f1f3f6'],done?['#d3d8dd','#e2e5e8']:['#dde2e8','#f6f7f9'],0);
  x.textAlign='center';x.fillStyle=done?'#a7b0ba':pen?'#6c7682':'#1f5bd1';x.font=(pen?'':'bold ')+(pen?17:21)+'px Helvetica,Arial,sans-serif';x.fillText(d,X+PW/2,PY+(pen?22:25));
  x.font='8px Helvetica,Arial,sans-serif';x.fillStyle='#8a939d';x.fillText(done?'\u2713':9-cnt[d],X+PW/2,PY+PH-4)}}
function bar(x){const gr=x.createLinearGradient(0,H-40,0,H);gr.addColorStop(0,'rgba(60,60,60,.92)');gr.addColorStop(.5,'rgba(25,25,25,.95)');gr.addColorStop(.5,'rgba(0,0,0,.96)');gr.addColorStop(1,'rgba(10,10,10,.98)');x.fillStyle=gr;x.fillRect(0,H-40,W,40);
 BTN.forEach(b=>{const on=b.on&&b.on();glossy(x,b.x,BY,b.w,BH,6,on?['#7fa9f0','#4c7fd9']:['#6b6b6b','#3a3a3a'],on?['#3a6fd0','#2b5fc4']:['#262626','#3d3d3d'],on);A.txt(b.n(),b.x+b.w/2,BY+17,11,'#fff','center')})}
const mv8=(dx,dy)=>{if(sel<0)sel=0;sel=((RW(sel)+dy+9)%9)*9+(CL(sel)+dx+9)%9;A.beep(1400,.015,'triangle',.02)};
return{help:'Fill every row, column and 3\u00D73 box with 1\u20139. Tap a cell, then a number. \u270E Notes for pencil marks, \u26A0 to show mistakes. On a computer: type 1\u20139, arrows, N notes, Backspace erase, U undo.',
reset:load,
down(x,y){if(won)return;if(y>=BY-4){const b=BTN.find(b=>x>=b.x&&x<=b.x+b.w);b&&b.f();return}
 if(y>=SEG.y-3&&y<=SEG.y+SEG.h+3&&x>=SEG.x&&x<=SEG.x+SEG.w){const i=Math.min(2,(x-SEG.x)/(SEG.w/3)|0);newGame(i);return}
 if(y>=PY-2&&y<=PY+PH+2){for(let d=1;d<10;d++){const X=padX(d-1);if(x>=X-1.5&&x<=X+PW+1.5){enter(d);return}}return}
 const c=cellAt(x,y);if(c>=0){sel=c;A.beep(1400,.015,'triangle',.02)}},
press(k){if(won)return;if(/^[1-9]$/.test(k))enter(+k);else if(k==='Backspace'||k==='Delete'||k==='0')erase();else if(k==='ArrowLeft')mv8(-1,0);else if(k==='ArrowRight')mv8(1,0);else if(k==='ArrowUp')mv8(0,-1);else if(k==='ArrowDown')mv8(0,1);
 else if(k==='n'||k==='p'||k==='N'||k==='P')BTN[2].f();else if(k==='u'||k==='z'||k==='U'||k==='Z')undo()},
update(dt){if(!won){tm+=dt;return}winT+=dt;if(winT>1.9)finish()},
draw(x){x.drawImage(BG,0,0,W,H);hud(x);seg(x);grid(x);pad(x);bar(x)},
stop(){if(V&&!won)save()},
_state(){return{P:P.slice(),S:S.slice(),V:V.slice(),N:N.slice(),sel,pen,tm,mi,mv,lv,won,mk:opt.mk,gx:GX,gy:GY,cs:CS,py:PY,ph:PH,pw:PW,padX:[...Array(9).keys()].map(padX),by:BY,btn:BTN.map(b=>[b.x,b.w]),seg:SEG}},
_gen:generate,_count:(p)=>solve(p,2),_nearWin(){for(let i=0;i<81;i++)if(!P[i])V[i]=S[i];const e=P.findIndex((v,i)=>!v);V[e]=0;sel=e;return e}}});
