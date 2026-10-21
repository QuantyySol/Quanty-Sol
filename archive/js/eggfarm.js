/* eggfarm.js : EGG FARM, a tiny idle/clicker mini-game opened from the breakroom coop.
   A game only: no real money, nothing sent anywhere. Progress lives in this browser's localStorage. */
(function(){
'use strict';
if(!window.Desk||!Desk.brk){console.warn('eggfarm: Desk.brk missing');return}
const B=Desk.brk,KEY='uq_eggfarm_v1',OFF_CAP=8*3600;
const TIERS=[{n:'White',c:'#eef6f2',v:1},{n:'Gold',c:'#ffd84a',v:8},{n:'Diamond',c:'#5cc8ff',v:25},{n:'Aurora',c:'#ff5cc8',v:100}];
const CHK=[{n:'Hen',c:'#39ff88'},{n:'Gold Hen',c:'#ffd84a'},{n:'Diamond Hen',c:'#5cc8ff'},{n:'Aurora Hen',c:'#ff5cc8'}];
const P=[[.9,.09,.009,.001],[.55,.38,.06,.01],[.3,.4,.25,.05],[.15,.3,.35,.2]];
const HATCH=[.6,.28,.1,.02];
const E=s=>String(s).replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
function fmt(n){n=Math.floor(n);if(n<1e4)return String(n);const u=['K','M','B','T'];let i=-1;while(n>=1e3&&i<3){n/=1e3;i++}return n.toFixed(n<10?2:n<100?1:0)+u[i]}
function fresh(){return{coins:10,chickens:[{k:0}],eggs:[],basket:[0,0,0,0],up:{feed:0,coop:0,speed:0,conv:0},hatches:0,bought:0,total:0,t:Date.now()}}
let S=load();
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.chickens)return Object.assign(fresh(),s)}catch(e){}return fresh()}
function save(){try{S.t=Date.now();localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const cap=()=>4+S.up.coop*2,layT=()=>4/Math.pow(1.18,S.up.speed),mult=()=>1+S.up.feed*.5,convT=()=>S.up.conv?2.4/(1+.6*(S.up.conv-1)):0;
function eggVal(k){return TIERS[k].v*mult()}
function rate(){/* expected coins per second */let r=0;S.chickens.forEach(c=>{const p=P[c.k];let ev=0;p.forEach((q,i)=>ev+=q*TIERS[i].v);r+=ev*mult()/layT()});return r}
const COST={chicken:()=>Math.round(15*Math.pow(1.35,S.bought)),hatch:()=>Math.round(200*Math.pow(1.5,S.hatches)),feed:()=>Math.round(25*Math.pow(1.6,S.up.feed)),
 coop:()=>Math.round(60*Math.pow(2,S.up.coop)),speed:()=>Math.round(40*Math.pow(1.7,S.up.speed)),conv:()=>Math.round(150*Math.pow(2.2,S.up.conv))};
const SHOP=[['chicken','🐔','Buy hen','+1 hen'],['hatch','🥚','Hatch rare','random rare hen'],['feed','🌽','Feed','eggs +50% value'],['coop','🏠','Coop size','+2 hen slots'],['speed','⚡','Faster lay','lay 18% faster'],['conv','➰','Conveyor','auto-collect eggs']];
/* offline earnings */
let offMsg='';(function(){const dt=Math.min(OFF_CAP,Math.max(0,(Date.now()-(S.t||Date.now()))/1000));if(dt>30){const g=rate()*dt*(S.up.conv?.5:.1);if(g>=1){S.coins+=g;S.total+=g;offMsg='Welcome back! Your hens earned '+fmt(g)+' coins while you were away'+(S.up.conv?'':' (a conveyor earns 5x more offline)')+'.'}}save()})();
/* ---------- svg art: dotted silhouettes ---------- */
const DEFS='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+CHK.map((c,i)=>`<pattern id="ef-d${i}" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.6" fill="${c.c}"/></pattern>`).join('')+
 TIERS.map((t,i)=>`<radialGradient id="ef-e${i}" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${t.c}"/><stop offset="1" stop-color="${i===3?'#5cc8ff':t.c}" stop-opacity=".55"/></radialGradient>`).join('')+'</defs></svg>';
const hen=k=>`<svg viewBox="0 0 64 64" class="ef-hsvg"><g fill="url(#ef-d${k})" stroke="${CHK[k].c}" stroke-width="1.4" stroke-opacity=".9"><path d="M14 36c0-12 10-19 21-17 3-7 13-8 16-1 2 4 0 8-3 10 4 6 3 15-3 20-8 7-26 6-31-5-6 2-10-1-11-6 4 1 8 0 11-1z"/><circle cx="43" cy="20" r="0.1"/></g>`+
 `<path d="M44 12c1-4 5-4 5 0 2-3 6-1 4 2" fill="none" stroke="#ff5c6c" stroke-width="3" stroke-linecap="round"/><path d="M52 22l7 2-7 3z" fill="#ffbf3f"/><circle cx="46" cy="20" r="2.2" fill="#fff"/><circle cx="46.6" cy="20" r="1.1" fill="#05040c"/>`+
 `<path d="M28 54v6M36 54v6" stroke="#ffbf3f" stroke-width="2.4" stroke-linecap="round"/></svg>`;
const egg=k=>`<svg viewBox="0 0 30 38"><ellipse cx="15" cy="20" rx="12" ry="16" fill="url(#ef-e${k})" stroke="${TIERS[k].c}" stroke-width="1.2"/>${k>=2?'<path d="M9 13l3-3M20 26l3-2" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>':''}</svg>`;
/* ---------- modal ---------- */
let ov=null,farm,raf=0,last=0,timers=[],convAcc=0,saveAcc=0,resetArm=0,toastT=0;
function open(){if(ov)return;ov=document.createElement('div');ov.className='ef-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Egg Farm mini-game');
 ov.innerHTML=DEFS+'<div class="ef-box"><div class="ef-top"><div class="ef-ttl">EGG FARM<small>just a game · no real money</small></div><div class="ef-coins"><img src="assets/quanty_coin_64.png" alt=""><b class="ef-c">0</b><i class="ef-r"></i></div><button class="ef-x" aria-label="Close egg farm">✕</button></div>'+
 '<div class="ef-farm" aria-label="Farm. Tap eggs to collect, tap hens to hurry them."><div class="ef-belt"></div></div>'+
 '<div class="ef-bask"><div class="ef-bc"></div><button class="ef-sell">SELL</button></div><div class="ef-shop">'+SHOP.map(s=>`<button data-b="${s[0]}"><span class="ef-ic">${s[1]}</span><span class="ef-t"><b>${s[2]}</b><em></em></span><span class="ef-p"></span></button>`).join('')+'</div>'+
 '<div class="ef-foot"><span class="ef-info"></span><button class="ef-reset">Reset</button></div><div class="ef-toast" role="status"></div></div>';
 document.body.appendChild(ov);farm=ov.querySelector('.ef-farm');document.body.style.overflow='hidden';
 ov.querySelector('.ef-x').onclick=close;ov.addEventListener('click',e=>{if(e.target===ov)close()});
 ov.querySelector('.ef-sell').onclick=e=>sell(e);ov.querySelector('.ef-shop').addEventListener('click',e=>{const b=e.target.closest('button');if(b)buy(b.dataset.b,b)});
 ov.querySelector('.ef-reset').onclick=e=>{const b=e.currentTarget;if(Date.now()-resetArm<3000){S=fresh();save();timers=[];build();ui();toast('Farm reset. Fresh start with one hen.');b.textContent='Reset';resetArm=0}else{resetArm=Date.now();b.textContent='Tap again to reset';setTimeout(()=>{if(b.isConnected)b.textContent='Reset'},3000)}};
 farm.addEventListener('pointerdown',onTap);addEventListener('keydown',onKb);build();ui();if(offMsg){toast(offMsg,5000);offMsg=''}
 last=0;raf=requestAnimationFrame(frame);try{const A=B.agents(),f=A.twitter;if(f)B.sendToBrk(f,{text:'EGG FARM IS SO BACK!!!',mood:'🐣'},true)}catch(e){}}
function close(){cancelAnimationFrame(raf);removeEventListener('keydown',onKb);save();ov&&ov.remove();ov=null;document.body.style.overflow=''}
function onKb(e){if(e.key==='Escape')close()}
function slot(i,n){const cols=n<=4?2:n<=9?3:4,rows=Math.ceil(n/cols),c=i%cols,r=Math.floor(i/cols);return{x:(c+.5)/cols*100,y:(r+.5)/rows*82+4}}
function build(){farm.querySelectorAll('.ef-hen,.ef-egg').forEach(e=>e.remove());const n=S.chickens.length;
 S.chickens.forEach((c,i)=>{const p=slot(i,n),d=document.createElement('button');d.className='ef-hen ef-k'+c.k;d.dataset.i=i;d.style.left=p.x+'%';d.style.top=p.y+'%';d.style.setProperty('--c',CHK[c.k].c);d.style.animationDelay=(-i*.37)+'s';d.setAttribute('aria-label',CHK[c.k].n);d.innerHTML=hen(c.k);farm.appendChild(d);timers[i]=timers[i]==null?Math.random()*layT():timers[i]});
 S.eggs.forEach(e=>drawEgg(e))}
function drawEgg(e){const d=document.createElement('button');d.className='ef-egg ef-t'+e.k;d.style.left=e.x+'%';d.style.top=e.y+'%';d.setAttribute('aria-label',TIERS[e.k].n+' egg');d.innerHTML=egg(e.k);d._e=e;farm.appendChild(d);e.el=d}
function pick(p){let r=Math.random();for(let i=p.length-1;i>0;i--){if(r<p[i])return i;r-=p[i]}return 0}
function lay(i){const c=S.chickens[i];if(!c)return;if(S.eggs.filter(e=>e.h===i).length>=3)return;const p=slot(i,S.chickens.length),k=pick(P[c.k]);
 const e={k,h:i,x:Math.max(4,Math.min(96,p.x+(Math.random()*24-12))),y:Math.min(92,p.y+13+Math.random()*4)};S.eggs.push(e);drawEgg(e);if(k>=2)pop(e.x,e.y-6,TIERS[k].n.toUpperCase()+'!',TIERS[k].c,1)
 const h=farm.querySelector('.ef-hen[data-i="'+i+'"]');if(h){h.classList.remove('ef-lay');void h.offsetWidth;h.classList.add('ef-lay')}}
function collect(e,auto){const j=S.eggs.indexOf(e);if(j<0)return;S.eggs.splice(j,1);S.basket[e.k]++;const el=e.el;if(el){el.classList.add(auto?'ef-conv':'ef-got');setTimeout(()=>el.remove(),420)}
 if(!auto)pop(e.x,e.y,'+1 '+TIERS[e.k].n,TIERS[e.k].c);ui()}
function onTap(e){const t=e.target.closest('.ef-egg,.ef-hen');if(!t)return;e.preventDefault();
 if(t.classList.contains('ef-egg')){collect(t._e)}else{const i=+t.dataset.i;timers[i]=Math.max(0,(timers[i]||0)-1.2);t.classList.remove('ef-poke');void t.offsetWidth;t.classList.add('ef-poke');const r=farm.getBoundingClientRect();pop((e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100-6,'bawk!','#cfe')}}
function sell(ev){let g=0,n=0;S.basket.forEach((c,k)=>{g+=c*eggVal(k);n+=c});if(!n){toast('Basket is empty. Tap eggs to collect them.');return}S.basket=[0,0,0,0];S.coins+=g;S.total+=g;
 const b=ov.querySelector('.ef-sell'),r=b.getBoundingClientRect();popAbs(r.left+r.width/2,r.top,'+'+fmt(g),'#ffd84a',1);b.classList.remove('ef-bump');void b.offsetWidth;b.classList.add('ef-bump');ui();save()}
function buy(id,btn){const c=COST[id]();if(S.coins<c){btn.classList.remove('ef-no');void btn.offsetWidth;btn.classList.add('ef-no');return}
 if((id==='chicken'||id==='hatch')&&S.chickens.length>=cap()){toast('Coop is full. Upgrade coop size for more hens.');return}
 S.coins-=c;if(id==='chicken'){S.chickens.push({k:0});S.bought++}else if(id==='hatch'){let kk=0;const r=Math.random();kk=r<HATCH[3]?3:r<HATCH[3]+HATCH[2]?2:r<HATCH[3]+HATCH[2]+HATCH[1]?1:0;S.chickens.push({k:kk});S.hatches++;toast('Hatched a '+CHK[kk].n+'!'+(kk===3?' Ultra rare!':''),2600)}
 else S.up[id]++;const r=btn.getBoundingClientRect();popAbs(r.left+r.width/2,r.top,'-'+fmt(c),'#ff8fa0');build();ui();save()}
function ui(){if(!ov)return;ov.querySelector('.ef-c').textContent=fmt(S.coins);ov.querySelector('.ef-r').textContent='~'+fmt(rate()*60)+'/min';
 ov.querySelector('.ef-bc').innerHTML=TIERS.map((t,k)=>`<span style="--c:${t.c}">${egg(k)}<b>${S.basket[k]}</b></span>`).join('');
 const sv=S.basket.reduce((a,c,k)=>a+c*eggVal(k),0);ov.querySelector('.ef-sell').textContent=sv?'SELL +'+fmt(sv):'SELL';
 ov.querySelectorAll('.ef-shop button').forEach(b=>{const id=b.dataset.b,c=COST[id](),full=(id==='chicken'||id==='hatch')&&S.chickens.length>=cap();b.querySelector('.ef-p').textContent=full?'FULL':fmt(c);b.classList.toggle('ef-off',S.coins<c||full);
  const lv=id==='chicken'?S.chickens.length+'/'+cap():id==='hatch'?'':id==='coop'?'lv '+S.up.coop:'lv '+S.up[id];b.querySelector('em').textContent=SHOP.find(s=>s[0]===id)[3]+(lv?' · '+lv:'')});
 ov.querySelector('.ef-info').textContent=S.chickens.length+' hens · '+fmt(S.total)+' coins earned';ov.querySelector('.ef-belt').classList.toggle('on',!!S.up.conv)}
function popAbs(x,y,t,c,big){const d=document.createElement('div');d.className='ef-pop'+(big?' big':'');d.style.left=x+'px';d.style.top=y+'px';d.style.color=c;d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),900)}
function pop(px,py,t,c,big){const r=farm.getBoundingClientRect();popAbs(r.left+px/100*r.width,r.top+py/100*r.height,t,c,big)}
function toast(m,ms){const t=ov&&ov.querySelector('.ef-toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),ms||2000)}
function frame(ts){raf=requestAnimationFrame(frame);if(!ov)return;const t=ts/1000,dt=Math.min(.25,last?t-last:0);last=t;if(document.hidden)return;
 const L=layT();S.chickens.forEach((c,i)=>{timers[i]=(timers[i]==null?L:timers[i])-dt;if(timers[i]<=0){timers[i]=L*(.8+Math.random()*.4);lay(i)}});
 const ct=convT();if(ct&&S.eggs.length){convAcc+=dt;if(convAcc>=ct){convAcc=0;collect(S.eggs[0],true)}}
 saveAcc+=dt;if(saveAcc>5){saveAcc=0;save()}}
addEventListener('pagehide',save);
/* ---------- breakroom entry: neon coop ---------- */
let hover=false;
function coopRect(){const g=B.geo(),W=g.W,H=g.H;return g.m?{x:W*.73,y:g.FT+H*.035,w:W*.17,h:H*.075}:{x:W*.655,y:g.FT-H*.02,w:W*.09,h:H*.12}}
const inC=p=>{const r=coopRect();return p.x>r.x&&p.x<r.x+r.w&&p.y>r.y-r.h*.35&&p.y<r.y+r.h};
B.canvas.addEventListener('pointermove',e=>{const h=inC(B.toCanvas(e.clientX,e.clientY));if(h!==hover){hover=h;if(h)B.canvas.style.cursor='pointer';else if(B.canvas.style.cursor==='pointer')B.canvas.style.cursor=''}});
B.canvas.addEventListener('pointerdown',e=>{if(B.view()!=='brk')return;const p=B.toCanvas(e.clientX,e.clientY);if(inC(p)&&!B.hit(p)){e.stopImmediatePropagation();e.preventDefault();open()}},true);
B.layers.bg.push((X,t)=>{const r=coopRect(),s=hover?1.06:1,pu=.65+.35*Math.sin(t/340);X.save();
 /* coop body: dotted silhouette */X.fillStyle='rgba(20,10,30,.9)';X.strokeStyle='#ffd84a';X.lineWidth=2.5;X.beginPath();X.moveTo(r.x,r.y+r.h);X.lineTo(r.x,r.y+r.h*.35);X.lineTo(r.x+r.w/2,r.y);X.lineTo(r.x+r.w,r.y+r.h*.35);X.lineTo(r.x+r.w,r.y+r.h);X.closePath();X.fill();X.shadowColor='#ffd84a';X.shadowBlur=hover?18:10;X.stroke();X.shadowBlur=0;
 X.fillStyle='#ffd84a55';const st=Math.max(6,r.w/14);for(let yy=r.y+r.h*.4;yy<r.y+r.h-4;yy+=st)for(let xx=r.x+st/2;xx<r.x+r.w;xx+=st){X.beginPath();X.arc(xx,yy,1.3,0,7);X.fill()}
 const dx=r.x+r.w/2,dw=r.w*.32,dh=r.h*.4;X.fillStyle='#05040c';X.beginPath();X.ellipse(dx,r.y+r.h-dh*.5,dw/2,dh/2,0,Math.PI,0);X.lineTo(dx+dw/2,r.y+r.h);X.lineTo(dx-dw/2,r.y+r.h);X.fill();
 const ey=r.y+r.h-dh*.25+Math.sin(t/260)*1.5;X.fillStyle='#ff5cc8';X.shadowColor='#ff5cc8';X.shadowBlur=12;X.beginPath();X.ellipse(dx,ey,r.w*.06,r.w*.08,0,0,7);X.fill();X.shadowBlur=0;
 const fs=Math.round((B.geo().m?20:17)*s);X.font='900 '+fs+'px Inter,sans-serif';X.textAlign='center';const tx='🥚 EGG FARM',tw=X.measureText(tx).width+18,y=r.y-10;
 X.fillStyle='rgba(10,8,20,.85)';X.beginPath();X.roundRect(dx-tw/2,y-fs-4,tw,fs+10,9);X.fill();X.strokeStyle='#39ff88';X.lineWidth=2;X.stroke();X.globalAlpha=hover?1:pu;X.fillStyle='#39ff88';X.shadowColor='#39ff88';X.shadowBlur=12;X.fillText(tx,dx,y);X.restore()});
window.DeskEggFarm={open,close};
if(/[?&]eggfarm=1/.test(location.search))setTimeout(open,600);
})();
