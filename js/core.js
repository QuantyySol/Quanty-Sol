/* Blob Arena core. Features live in js/features/*.js and talk to the game only through window.A (see API.md). */
const $=id=>document.getElementById(id);
const Q=new URLSearchParams(location.search),RQ=(Q.get('room')||'').replace(/[^a-z0-9_-]/gi,'').slice(0,24);
const ROOM='blobarena-v1'+(RQ?'-'+RQ:''),KIND=20421,RELAYS=['wss://nos.lol','wss://nostr.mom','wss://relay.primal.net','wss://relay.damus.io'];
const W=6000,NP=1400,NV=24,PRESP=12000,VRESP=30000,EAT=1.25,MAXC=16,BOTS=10;
// Feature modules to load (js/features/<name>.js). Add yours here: one line, nothing else in core.
const FEATURES=[];
const COLS=['#ff5c7a','#ff9f43','#ffd93d','#6ee7a8','#38d9f5','#5b8cff','#b07cff','#ff7ad9','#f4f4f4','#8bd450'];
const SKINS=['','😀','🐸','🐱','👽','🍩','🌍','🔥','⭐','👾','🐙'];
const BOTN=['Blobby','Nom','Pac','Goo','Orbit','Pebble','Mochi','Zap','Bubbles','Crumb','Jelly','Pip','Dot','Squish'];
const ownNames=o=>Object.getOwnPropertyNames(o);
const rr=m=>Math.sqrt(m)*5.2, now=()=>Date.now();
function hash(i,s){let n=(i*374761393+s*668265263)|0;n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return (n>>>0)/4294967296}
const pel=[];for(let i=0;i<NP;i++)pel.push({i,x:hash(i,1)*W,y:hash(i,2)*W,c:COLS[(hash(i,3)*COLS.length)|0],dead:0});
const vir=[];for(let i=0;i<NV;i++)vir.push({i,x:200+hash(i,11)*(W-400),y:200+hash(i,12)*(W-400),dead:0});
const ID=Math.random().toString(36).slice(2,10);
let myName='',myCol=COLS[(Math.random()*COLS.length)|0],mySkin='',alive=false,peak=0,born=0;
const ents=new Map();let me=null;const ejects=new Map();let cseq=0;const peers=new Map();
// ---------- public API object
const H={};
const A=window.A={W,EAT,MAXC,radius:rr,hash,colors:COLS,
 get room(){return RQ},get id(){return ID},get me(){return me},get alive(){return alive},get myMass(){return me?mass(me):0},
 get entities(){return ents},get players(){return [...ents.values()].filter(e=>!e.bot)},get bots(){return [...ents.values()].filter(e=>e.bot)},
 get cells(){const a=[];for(const e of ents.values())for(const c of e.cells)a.push({cell:c,ent:e});return a},
 pellets:pel,viruses:vir,ejects,get leaderboard(){return lbData},cam:null,ctx:null,
 on(ev,fn){(H[ev]||=[]).push(fn);return()=>{H[ev]=H[ev].filter(f=>f!==fn)}},
 emit(ev,...a){for(const f of H[ev]||[]){try{f(...a)}catch(e){console.error('A.'+ev,e)}}},
 mass:e=>mass(e),feats:{}};
// ---------- start screen
$('nm').value=localStorage.getItem('ba_n')||'';
const cs=$('cols');COLS.forEach(c=>{const b=document.createElement('button');b.style.background=c;b.onclick=()=>{myCol=c;sel()};cs.appendChild(b)});
const ss=$('skins');
function skinButtons(){ss.innerHTML='';for(const s of [...SKINS,...ownNames(skinReg)]){const b=document.createElement('button');b.textContent=skinReg[s]?(skinReg[s].icon||'✦'):(s||'∅');b.title=skinReg[s]?.name||s;b.onclick=()=>{mySkin=s;sel()};b.dataset.s=s;ss.appendChild(b)}sel()}
function sel(){[...cs.children].forEach((b,i)=>b.classList.toggle('on',COLS[i]==myCol));[...ss.children].forEach(b=>b.classList.toggle('on',b.dataset.s==mySkin))}
function newCell(x,y,m){return{id:ID+'.'+(cseq++),x,y,m,vx:0,vy:0,merge:now()+15000}}
function spawnEnt(id,n,c,s,bot){const p=modeCall('spawnPos',{bot})||{x:300+Math.random()*(W-600),y:300+Math.random()*(W-600)};const e={id,owner:ID,n,c,s,bot,cells:[newCell(p.x,p.y,bot?15+Math.random()*40:20)],tx:0,ty:0};ents.set(id,e);A.emit('spawn',e);return e}
function play(){myName=($('nm').value.trim()||'Player '+ID.slice(0,3)).slice(0,15);localStorage.setItem('ba_n',myName);
 me=spawnEnt(ID,myName,myCol,mySkin,false);me.cells[0].m=20;alive=true;peak=20;born=now();$('start').classList.add('hide');$('dead').classList.add('hide')}
A.play=play;
$('go').onclick=play;$('again').onclick=play;$('nm').addEventListener('k'+'eydown',e=>{if(e.code=='Enter'||e.code=='NumpadEnter')play()});
function toast(m,ms=1800){const t=$('toast');t.textContent=m;t.style.opacity=1;clearTimeout(t._h);t._h=setTimeout(()=>t.style.opacity=0,ms)}
// ---------- input: mouse on desktop, analog stick on touch
const cv=$('cv'),cx=cv.getContext('2d');A.ctx=cx;let VW,VH,DPR;
function rs(){DPR=Math.min(2,devicePixelRatio||1);VW=innerWidth;VH=innerHeight;cv.width=VW*DPR;cv.height=VH*DPR;cv.style.width=VW+'px';cv.style.height=VH+'px';const m=$('mini');m.width=m.clientWidth*DPR;m.height=m.clientHeight*DPR}
addEventListener('resize',rs);rs();
let ptr={x:0,y:0};const stk={on:false,x:0,y:0,mag:0,id:null};let touchMode=matchMedia('(hover:none),(pointer:coarse)').matches;
cv.addEventListener('pointermove',e=>{if(e.pointerType=='mouse'){touchMode=false;ptr.x=e.clientX-VW/2;ptr.y=e.clientY-VH/2}});
const stick=$('stick'),knob=$('knob'),SR=60,DEAD=0.12;
function moveStick(e){const r=stick.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const l=Math.hypot(dx,dy),cl=Math.min(l,SR);
 if(l>0){dx=dx/l*cl;dy=dy/l*cl}knob.style.transform=`translate(${dx}px,${dy}px)`;const mag=cl/SR;stk.mag=mag<DEAD?0:(mag-DEAD)/(1-DEAD);stk.x=l?dx/cl||0:0;stk.y=l?dy/cl||0:0}
stick.addEventListener('pointerdown',e=>{e.preventDefault();touchMode=true;stk.on=true;stk.id=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e)});
stick.addEventListener('pointermove',e=>{if(stk.on&&e.pointerId==stk.id)moveStick(e)});
const endS=e=>{if(e.pointerId!=stk.id)return;stk.on=false;stk.mag=0;stk.id=null;knob.style.transform=''};
stick.addEventListener('pointerup',endS);stick.addEventListener('pointercancel',endS);
const tap=(id,f)=>$(id).addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();f()});
tap('bSplit',()=>A.split());tap('bEject',()=>A.eject());
addEventListener('k'+'eydown',e=>{if(e.target.tagName=='INPUT')return;A.emit('kbd',e.code,e);if(e.defaultPrevented)return;if(e.code=='Space'){e.preventDefault();A.split()}else if(e.code.endsWith('W')&&e.code.length==4)A.eject()});
let cam={x:W/2,y:W/2,z:1};A.cam=cam;
// aim point for a given cell (stick: offset proportional to tilt; mouse: world pointer)
function centroid(){let sx=0,sy=0,sm=0;for(const c of me.cells){sx+=c.x*c.m;sy+=c.y*c.m;sm+=c.m}return{x:sx/sm,y:sy/sm}}
function aimWorld(){if(touchMode){if(!me||!me.cells.length)return{x:cam.x,y:cam.y};const c=centroid(),d=stk.mag?1e5:0;return{x:c.x+stk.x*d,y:c.y+stk.y*d}}return{x:cam.x+ptr.x/cam.z,y:cam.y+ptr.y/cam.z}}
function cellTarget(c,a){if(touchMode){const R=rr(c.m),reach=(R*1.5+30)*stk.mag;if(!stk.mag)return{x:c.x,y:c.y};return{x:c.x+stk.x*reach,y:c.y+stk.y*reach}}return a}
A.aim=aimWorld;A.input={stick:stk,get touch(){return touchMode}};
// ---------- split / eject (with split-variant hooks)
const splitHooks=[];A.onSplit=fn=>splitHooks.push(fn);
A.split=function(opts={}){if(!alive||modeCall('canSplit')===false)return;const a=aimWorld();const add=[];
 for(const c of me.cells){if(me.cells.length+add.length>=MAXC)break;if(c.m<35)continue;const d=Math.hypot(a.x-c.x,a.y-c.y)||1;
  const info={cell:c,ent:me,dir:{x:(a.x-c.x)/d,y:(a.y-c.y)/d},speed:900*(opts.power||1),share:0.5,opts};
  for(const f of splitHooks){try{f(info)}catch(e){console.error('split hook',e)}}if(info.cancel)continue;
  const pm=c.m*info.share;c.m-=pm;const n=newCell(c.x,c.y,pm);n.vx=info.dir.x*info.speed;n.vy=info.dir.y*info.speed;c.merge=n.merge=now()+15000+c.m*20;add.push(n)}
 me.cells.push(...add);if(add.length)A.emit('split',{ent:me,cells:add,opts})};
A.eject=function(){if(!alive||modeCall('canEject')===false)return;const a=aimWorld();for(const c of me.cells){if(c.m<35)continue;c.m-=16;const d=Math.hypot(a.x-c.x,a.y-c.y)||1,ux=(a.x-c.x)/d,uy=(a.y-c.y)/d,R=rr(c.m);
 const j={id:ID+'e'+(cseq++),x:c.x+ux*(R+12),y:c.y+uy*(R+12),vx:ux*700,vy:uy*700,m:13,c:me.c,t:now()};ejects.set(j.id,j);netSend({t:'ej',j});A.emit('eject',{ent:me,blob:j})}};
// ---------- networking (Nostr ephemeral events, one batched event per ~110 ms)
let fin=null,sk=null;const socks=[],seen=new Set();let outq=[];
function netSend(m){outq.push(m)}
const keepLog=[],keepCaps={},netH={};let kseq=0;
function keepPush(m){const t=now();if(m.exp&&m.exp<t)return;if(m.kid&&keepLog.some(o=>o.kid==m.kid))return;
 for(let i=keepLog.length-1;i>=0;i--){const o=keepLog[i];if((o.exp&&o.exp<t)||(m.rep!=null&&o.t==m.t&&o.rep==m.rep))keepLog.splice(i,1)}
 keepLog.push(m);const cap=keepCaps[m.t];if(cap){let n=0;for(let i=keepLog.length-1;i>=0;i--)if(keepLog[i].t==m.t&&++n>cap)keepLog.splice(i,1)}while(keepLog.length>2000)keepLog.shift()}
const CORE_T=new Set(['pe','ve','ej','ee','eat','ok','bye','hello','sync']);
A.net={get id(){return ID},
 send(t,data={},opt={}){if(CORE_T.has(t))throw new Error('reserved type '+t);const m={...data,t,from:ID};if(opt.to)m.to=opt.to;
  if(opt.keep||opt.replace!=null||opt.maxAge){if(opt.replace!=null)m.rep=String(opt.replace);if(opt.maxAge)m.exp=now()+opt.maxAge;if(opt.keep!==false){m.keep=1;m.kid=ID+'.'+(++kseq);keepPush(m)}}netSend(m)},
 on(t,fn){(netH[t]||=[]).push(fn)},keepCap(t,n){keepCaps[t]=n},kept:()=>keepLog.filter(o=>!o.exp||o.exp>=now()),
 get isHost(){return isLeader()},get peers(){return [...peers.keys()]}};
function flush(){if(!fin)return;const own=[...ents.values()].filter(e=>e.owner==ID).map(e=>({id:e.id,n:e.n,c:e.c,s:e.s,b:e.bot?1:0,x:e.x||undefined,cl:e.cells.map(c=>[c.id,Math.round(c.x),Math.round(c.y),Math.round(c.m*10)/10])}));
 const body={f:ID,e:own,q:outq.splice(0,80)};const ev=fin({kind:KIND,created_at:Math.floor(now()/1000),tags:[['t',ROOM]],content:JSON.stringify(body)},sk);seen.add(ev.id);
 const s=JSON.stringify(['EVENT',ev]);socks.forEach(w=>w.readyState==1&&w.send(s))}
function openRelay(url){let w;try{w=new WebSocket(url)}catch(e){return}socks.push(w);
 w.onopen=()=>w.send(JSON.stringify(['REQ','ba',{kinds:[KIND],'#t':[ROOM],since:Math.floor(now()/1000)-3}]));
 w.onmessage=e=>{let d;try{d=JSON.parse(e.data)}catch(_){return}if(d[0]!='EVENT')return;const ev=d[2];if(!ev||seen.has(ev.id))return;seen.add(ev.id);if(seen.size>4000)seen.clear();
  let b;try{b=JSON.parse(ev.content)}catch(_){return}if(b&&b.f&&b.f!=ID)recv(b)};
 w.onclose=()=>{socks.splice(socks.indexOf(w),1);setTimeout(()=>openRelay(url),3000+Math.random()*3000)};w.onerror=()=>{}}
const pendingEat=new Map();let synced=false;
function recv(b){peers.set(b.f,now());const t=now();
 for(const r of b.e||[]){let e=ents.get(r.id);if(!e){e={id:r.id,owner:b.f,cells:[]};ents.set(r.id,e)}if(e.owner==ID)continue;
  e.owner=b.f;e.n=String(r.n||'').slice(0,15);e.c=/^#[0-9a-f]{6}$/i.test(r.c)?r.c:'#888888';e.s=typeof r.s=='string'?r.s.slice(0,16):'';e.bot=!!r.b;e.seen=t;e.x=r.x;
  const old=new Map(e.cells.map(c=>[c.id,c]));e.cells=(r.cl||[]).filter(a=>!pendingEat.has(a[0])).map(a=>{const o=old.get(a[0]);if(o){o.tx=a[1];o.ty=a[2];o.m=a[3];return o}return{id:a[0],x:a[1],y:a[2],tx:a[1],ty:a[2],m:a[3]}})}
 for(const m of b.q||[])onMsg(m,b.f)}
function onMsg(m,from){const t=now();if(!m||typeof m.t!='string')return;if(m.to&&m.to!=ID)return;
 if(m.t=='pe'&&pel[m.i])pel[m.i].dead=t+PRESP;
 else if(m.t=='ve'&&vir[m.i])vir[m.i].dead=t+VRESP;
 else if(m.t=='ej'&&m.j)ejects.set(m.j.id,{...m.j,t});
 else if(m.t=='ee')ejects.delete(m.id);
 else if(m.t=='eat')confirmEat(m,from);
 else if(m.t=='ok'){const e=ents.get(m.ee);if(e&&e.owner==ID){const c=e.cells.find(c=>c.id==m.ec)||e.cells[0];if(c){c.m+=Math.min(m.m,50000);A.emit('eat',{ent:e,cell:c,victim:ents.get(m.ve)||{id:m.ve,n:m.vn},mass:m.m})}}}
 else if(m.t=='bye'){for(const [k,e] of ents)if(e.owner==from)ents.delete(k);peers.delete(from)}
 else if(m.t=='hello'){if(isLeader())netSend({t:'sync',to:from,kl:A.net.kept().slice(-300)})}
 else if(m.t=='sync'){if(synced)return;synced=true;(m.kl||[]).forEach(k=>{keepPush(k);deliver(k,k.from)})}
 else{if(m.keep)keepPush(m);deliver(m,from)}}
function deliver(m,from){for(const f of netH[m.t]||[]){try{f(m,from)}catch(e){console.error('net '+m.t,e)}}}
function confirmEat(m,from){const e=ents.get(m.ve);if(!e||e.owner!=ID)return;const i=e.cells.findIndex(c=>c.id==m.vc);if(i<0)return;const c=e.cells[i];
 if(c.m*EAT>m.em*1.05)return;
 e.cells.splice(i,1);netSend({t:'ok',to:from,ee:m.ee,ec:m.ec,ve:e.id,vn:e.n,m:c.m});A.emit('eaten',{ent:e,cell:c,by:{id:m.ee,n:m.en},mass:c.m});
 if(!e.cells.length){if(e===me)die(m.en);else ents.delete(e.id)}}
async function net(){try{const N=await import('https://esm.sh/nostr-tools@2.7.2/pure');fin=N.finalizeEvent;sk=crypto.getRandomValues(new Uint8Array(32))}catch(e){console.warn('net offline',e);return}
 RELAYS.forEach(openRelay);setInterval(flush,110);setTimeout(()=>netSend({t:'hello'}),2500)}
addEventListener('beforeunload',()=>{outq=[{t:'bye'}];flush()});
function die(by){alive=false;ents.delete(ID);const dead=me;me=null;$('killer').textContent=by||'someone';$('final').textContent=Math.round(peak);$('alive').textContent=Math.round((now()-born)/1000)+'s';
 A.emit('death',{ent:dead,by,peak});if(modeCall('onDeath',{by,peak})!==true)$('dead').classList.remove('hide')}
// ---------- AI bots, hosted by the lowest-id live client
function isLeader(){for(const [k,t] of peers)if(now()-t<4000&&k<ID)return false;return true}
function botTick(){const lead=isLeader();const realN=1+[...peers.values()].filter(t=>now()-t<4000).length;let want=Math.max(2,BOTS-(realN-1)*3);const mw=modeCall('botCount',want);if(typeof mw=='number')want=mw;
 const mine=[...ents.values()].filter(e=>e.bot&&e.owner==ID);
 if(!lead){mine.forEach(e=>ents.delete(e.id));return}
 if(mine.length<want)spawnEnt('b'+ID+(cseq++),BOTN[(Math.random()*BOTN.length)|0],COLS[(Math.random()*COLS.length)|0],'',true);
 else if(mine.length>want){const s=mine.sort((a,b)=>mass(a)-mass(b))[0];ents.delete(s.id)}}
setInterval(botTick,1500);
function mass(e){return e.cells.reduce((s,c)=>s+c.m,0)}
function botAI(e){if(modeCall('botAI',e)===true)return;const c=e.cells[0];if(!c)return;let best=null,bd=1e9,fx=0,fy=0;
 for(const o of ents.values()){if(o===e)continue;for(const oc of o.cells){const d=Math.hypot(oc.x-c.x,oc.y-c.y);if(d>700)continue;
  if(oc.m>c.m*EAT){fx-=(oc.x-c.x)/d*(700-d);fy-=(oc.y-c.y)/d*(700-d)}else if(c.m>oc.m*EAT&&d<bd*0.5+100){best=oc;bd=d}}}
 if(fx||fy){e.tx=c.x+fx;e.ty=c.y+fy;return}
 if(best){e.tx=best.x;e.ty=best.y;return}
 if(e._p==null||now()>e._pt||pel[e._p].dead){let bi=0,b2=1e12;for(let k=0;k<60;k++){const i=(Math.random()*NP)|0,p=pel[i];if(p.dead)continue;const d=(p.x-c.x)**2+(p.y-c.y)**2;if(d<b2){b2=d;bi=i}}e._p=bi;e._pt=now()+3000}
 e.tx=pel[e._p].x;e.ty=pel[e._p].y}
// ---------- physics hooks
const speedMods=[],obstacles=[];
A.physics={addSpeedMod(fn){speedMods.push(fn);return()=>speedMods.splice(speedMods.indexOf(fn),1)},addObstacle(fn){obstacles.push(fn);return()=>obstacles.splice(obstacles.indexOf(fn),1)},
 slowZone(z){return this.addSpeedMod((c)=>Math.hypot(c.x-z.x,c.y-z.y)<z.r?(z.mul??0.5):1)},
 circleWall(o){return this.addObstacle((c)=>{const R=rr(c.m),dx=c.x-o.x,dy=c.y-o.y,d=Math.hypot(dx,dy)||.01,min=o.r+R;if(d<min){c.x=o.x+dx/d*min;c.y=o.y+dy/d*min}})}};
function simEnt(e,dt,aim){const t=now();
 for(const c of e.cells){const R=rr(c.m),tg=e===me?cellTarget(c,aim):aim,dx=tg.x-c.x,dy=tg.y-c.y,d=Math.hypot(dx,dy);let sp=Math.max(80,560*Math.pow(c.m,-0.33)*(e.bot?0.9:1));const f=Math.min(1,d/(R*1.5+30));
  for(const fn of speedMods){try{sp*=fn(c,e)??1}catch(err){console.error('speedMod',err)}}
  if(d>1){c.x+=dx/d*sp*f*dt;c.y+=dy/d*sp*f*dt}
  c.x+=c.vx*dt;c.y+=c.vy*dt;const k=Math.pow(0.03,dt);c.vx*=k;c.vy*=k;
  if(c.m>35)c.m-=c.m*0.0018*dt;c.x=Math.max(0,Math.min(W,c.x));c.y=Math.max(0,Math.min(W,c.y));
  for(const fn of obstacles){try{fn(c,e,dt)}catch(err){console.error('obstacle',err)}}}
 for(let i=0;i<e.cells.length;i++)for(let j=i+1;j<e.cells.length;j++){const a=e.cells[i],b=e.cells[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,ra=rr(a.m),rb=rr(b.m);
  if(t>a.merge&&t>b.merge){if(d<Math.max(ra,rb)*0.6){a.m+=b.m;e.cells.splice(j,1);j--}}
  else if(d<ra+rb){const o=(ra+rb-d)/2;a.x-=dx/d*o;a.y-=dy/d*o;b.x+=dx/d*o;b.y+=dy/d*o}}
 for(const c of e.cells){const R=rr(c.m);
  for(let i=0;i<NP;i++){const p=pel[i];if(p.dead>t)continue;const dx=p.x-c.x;if(dx>R||dx<-R)continue;const dy=p.y-c.y;if(dx*dx+dy*dy<R*R){p.dead=t+PRESP;c.m+=1;netSend({t:'pe',i})}}
  for(const [id,j] of ejects){if(t-j.t<300&&id.startsWith(ID))continue;if(Math.hypot(j.x-c.x,j.y-c.y)<R&&c.m>j.m*1.1){c.m+=j.m;ejects.delete(id);netSend({t:'ee',id})}}
  for(let i=0;i<NV;i++){const v=vir[i];if(v.dead>t)continue;if(c.m>133&&Math.hypot(v.x-c.x,v.y-c.y)<R-20){v.dead=t+VRESP;netSend({t:'ve',i});c.m+=60;
   const n=Math.min(MAXC-e.cells.length,8);if(n>0){const part=c.m/(n+1);c.m=part;for(let k=0;k<n;k++){const a=k/n*6.283,nc=newCell(c.x,c.y,part);nc.vx=Math.cos(a)*600;nc.vy=Math.sin(a)*600;nc.merge=t+20000;e.cells.push(nc)}}}}
  if(modeCall('canEat',e)===false)continue;
  for(const o of ents.values()){if(o===e)continue;for(const oc of o.cells){if(pendingEat.has(oc.id))continue;if(c.m<oc.m*EAT)continue;
   const d=Math.hypot(oc.x-c.x,oc.y-c.y);if(d>R-rr(oc.m)*0.4)continue;
   if(o.owner==ID){const i=o.cells.indexOf(oc);o.cells.splice(i,1);c.m+=oc.m;A.emit('eat',{ent:e,cell:c,victim:o,mass:oc.m});A.emit('eaten',{ent:o,cell:oc,by:e,mass:oc.m});if(!o.cells.length){if(o===me)die(e.n);else ents.delete(o.id)}break}
   pendingEat.set(oc.id,t);netSend({t:'eat',to:o.owner,ve:o.id,vc:oc.id,ee:e.id,ec:c.id,em:c.m,en:e.n});o.cells=o.cells.filter(x=>x!==oc);break}}}}
// ---------- render (overridable)
const skinReg={};A.skins={add(id,def){skinReg[id]=def;skinButtons()},get(id){return skinReg[id]},list:()=>ownNames(skinReg)};
function shade(h){const n=parseInt(h.slice(1),16);return`rgb(${(n>>16)*.7|0},${(n>>8&255)*.7|0},${(n&255)*.7|0})`}
function defaultDrawCell(ctx,c,e,R){ctx.beginPath();ctx.arc(c.x,c.y,R,0,6.283);ctx.fillStyle=e.c;ctx.fill();
 ctx.lineWidth=Math.max(3,R*0.08);ctx.strokeStyle=e.bot?'rgba(140,148,158,.9)':shade(e.c);ctx.stroke();
 if(e.bot){ctx.setLineDash([R*0.15,R*0.12]);ctx.lineWidth=2;ctx.strokeStyle='rgba(13,17,23,.5)';ctx.beginPath();ctx.arc(c.x,c.y,R*0.82,0,6.283);ctx.stroke();ctx.setLineDash([])}
 const sk=skinReg[e.s];if(sk){try{sk.draw(ctx,c,e,R)}catch(err){console.error('skin',err)}}
 else if(e.s&&R>14){ctx.font=`${R*0.9}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=.85;ctx.fillText(e.s,c.x,c.y+(R>30?-R*0.12:0));ctx.globalAlpha=1}
 if(R>16){const fs=Math.max(10,R*0.34);ctx.font=`700 ${fs}px system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=fs*0.18;ctx.strokeStyle='#000';
  const y=e.s?c.y+R*0.45:c.y,label=e.bot?e.n+' · AI':e.n;ctx.strokeText(label,c.x,y);ctx.fillStyle='#fff';ctx.fillText(label,c.x,y);
  if(R>40){ctx.font=`600 ${fs*0.55}px system-ui`;ctx.strokeText(Math.round(c.m),c.x,y+fs*0.8);ctx.fillText(Math.round(c.m),c.x,y+fs*0.8)}}}
A.defaultDrawCell=defaultDrawCell;A.drawCell=null; // set A.drawCell=(ctx,cell,ent,R,def)=>{...} to override; call def() for the stock look
function spiky(x,y,R){cx.beginPath();const N=22;for(let i=0;i<=N*2;i++){const a=i/(N*2)*6.283,r=i%2?R:R*0.9;cx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}cx.closePath();cx.fillStyle='#33d17a';cx.fill();cx.lineWidth=4;cx.strokeStyle='#1f8f4e';cx.stroke()}
// ---------- modes
const modes={ffa:{name:'Free for all'}};let modeId='ffa';
function modeCall(fn,arg){const m=modes[modeId];if(m&&typeof m[fn]=='function'){try{return m[fn](arg,A)}catch(e){console.error('mode '+modeId+'.'+fn,e)}}}
A.modes={add(id,def){modes[id]=def},set(id){if(!modes[id]||id==modeId)return;modeCall('stop');modeId=id;modeCall('start');A.emit('mode',id)},get current(){return modeId},list:()=>ownNames(modes)};
// ---------- UI helpers
A.ui={toast,
 button(label,title,fn){const b=document.createElement('button');b.textContent=label;b.title=title||'';b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();fn(b)});if($('fbar').children.length<4)$('fbar').appendChild(b);else{console.warn('ui.button: slots full, ignored',label);return b}return b},
 panel(title,html,opts={}){const p=document.createElement('div');p.className='fpanel';p.innerHTML=`<button class="x">✕</button><h2></h2><div class="body"></div>`;p.querySelector('h2').textContent=title;
  const body=p.querySelector('.body');if(typeof html=='string')body.innerHTML=html;else if(html)body.appendChild(html);p.querySelector('.x').onclick=()=>{p.remove();opts.onClose&&opts.onClose()};document.body.appendChild(p);return{el:p,body,close(){p.remove()}}},
 hudSlot(id){let d=document.getElementById('hs-'+id);if(!d){d=document.createElement('div');d.id='hs-'+id;$('hslots').appendChild(d)}return d}};
// ---------- frame loop
let last=performance.now(),lbT=0,lbData=[];
function frame(tn){requestAnimationFrame(frame);const dt=Math.min(0.05,(tn-last)/1000);last=tn;const t=now();
 if(alive&&me){simEnt(me,dt,aimWorld());const m=mass(me);peak=Math.max(peak,m);$('mass').textContent=Math.round(m)}
 for(const e of ents.values())if(e.bot&&e.owner==ID){botAI(e);simEnt(e,dt,{x:e.tx,y:e.ty})}
 for(const [k,e] of ents){if(e.owner!=ID){if(t-(e.seen||0)>3500){ents.delete(k);continue}for(const c of e.cells){const k2=1-Math.pow(0.0005,dt);c.x+=(c.tx-c.x)*k2;c.y+=(c.ty-c.y)*k2}}}
 for(const [k,j] of ejects){j.x+=j.vx*dt;j.y+=j.vy*dt;const f=Math.pow(0.02,dt);j.vx*=f;j.vy*=f;if(t-j.t>60000)ejects.delete(k)}
 for(const [k,v] of pendingEat)if(t-v>2000)pendingEat.delete(k);
 for(const [k,v] of peers)if(t-v>10000)peers.delete(k);
 A.emit('tick',dt);modeCall('tick',dt);
 if(me&&me.cells.length){let sx=0,sy=0,sm=0;for(const c of me.cells){sx+=c.x*c.m;sy+=c.y*c.m;sm+=c.m}const tz=Math.max(0.25,Math.min(1.4,1.25*Math.pow(Math.max(20,sm),-0.18)*2.2))*Math.min(1.2,Math.max(0.75,Math.min(VW,VH)/700));
  cam.x+=(sx/sm-cam.x)*Math.min(1,dt*8);cam.y+=(sy/sm-cam.y)*Math.min(1,dt*8);cam.z+=(tz-cam.z)*Math.min(1,dt*3)}
 else{cam.x+=Math.sin(t/4000)*0.5;cam.z+=(0.6-cam.z)*dt}
 cx.setTransform(DPR,0,0,DPR,0,0);cx.fillStyle='#0d1117';cx.fillRect(0,0,VW,VH);
 cx.setTransform(DPR*cam.z,0,0,DPR*cam.z,DPR*(VW/2-cam.x*cam.z),DPR*(VH/2-cam.y*cam.z));
 const x0=cam.x-VW/2/cam.z,y0=cam.y-VH/2/cam.z,x1=cam.x+VW/2/cam.z,y1=cam.y+VH/2/cam.z;A.view={x0,y0,x1,y1};
 cx.strokeStyle='rgba(255,255,255,.05)';cx.lineWidth=1/cam.z;cx.beginPath();for(let g=Math.max(0,Math.floor(x0/50)*50);g<=Math.min(W,x1);g+=50){cx.moveTo(g,Math.max(0,y0));cx.lineTo(g,Math.min(W,y1))}
 for(let g=Math.max(0,Math.floor(y0/50)*50);g<=Math.min(W,y1);g+=50){cx.moveTo(Math.max(0,x0),g);cx.lineTo(Math.min(W,x1),g)}cx.stroke();
 cx.strokeStyle='rgba(255,92,122,.5)';cx.lineWidth=6;cx.strokeRect(0,0,W,W);
 A.emit('drawWorld',cx);
 for(const p of pel){if(p.dead>t||p.x<x0-10||p.x>x1+10||p.y<y0-10||p.y>y1+10)continue;cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,5.5,0,6.283);cx.fill()}
 for(const j of ejects.values()){cx.fillStyle=j.c;cx.beginPath();cx.arc(j.x,j.y,rr(j.m),0,6.283);cx.fill()}
 const all=[];for(const e of ents.values())for(const c of e.cells)all.push([c,e]);all.sort((a,b)=>a[0].m-b[0].m);
 let vDrawn=false;const drawV=()=>{for(const v of vir)if(v.dead<=t&&v.x>x0-80&&v.x<x1+80&&v.y>y0-80&&v.y<y1+80)spiky(v.x,v.y,60);vDrawn=true};
 for(const [c,e] of all){if(!vDrawn&&c.m>133)drawV();const R=rr(c.m);if(c.x+R<x0||c.x-R>x1||c.y+R<y0||c.y-R>y1)continue;
  if(A.drawCell){try{A.drawCell(cx,c,e,R,()=>defaultDrawCell(cx,c,e,R))}catch(err){console.error('drawCell',err);defaultDrawCell(cx,c,e,R)}}else defaultDrawCell(cx,c,e,R)}
 if(!vDrawn)drawV();
 A.emit('draw',cx);
 cx.setTransform(DPR,0,0,DPR,0,0);A.emit('drawHud',cx,VW,VH);
 const mm=$('mini'),mc=mm.getContext('2d'),S=mm.width/W;mc.clearRect(0,0,mm.width,mm.height);
 for(const e of ents.values()){mc.fillStyle=e===me?'#58e6a9':e.bot?'rgba(140,148,158,.6)':e.c;for(const c of e.cells){mc.beginPath();mc.arc(c.x*S,c.y*S,Math.max(e.bot?1.5:2.5,rr(c.m)*S)*(e===me||!e.bot?DPR:1),0,6.283);mc.fill()}}
 mc.strokeStyle='rgba(255,255,255,.4)';mc.lineWidth=1;mc.strokeRect(x0*S,y0*S,(x1-x0)*S,(y1-y0)*S);
 if(t-lbT>500){lbT=t;board()}}
function board(){const L=[...ents.values()].filter(e=>e.cells.length).map(e=>({e,m:mass(e)})).sort((a,b)=>b.m-a.m);
 lbData=L.map((x,i)=>({rank:i+1,id:x.e.id,name:x.e.n,mass:x.m,bot:!!x.e.bot,me:x.e===me}));const top=L.slice(0,10);
 if(me&&!top.find(x=>x.e===me)){const r=L.findIndex(x=>x.e===me);if(r>=0)top.push({...L[r],rank:r+1})}
 $('lbl').innerHTML=top.map((x,i)=>`<li class="${x.e===me?'me':x.e.bot?'bot':''}"><span>${x.rank||i+1}. ${esc(x.e.n)}${x.e.bot?'<span class="tag">AI</span>':x.e===me?'<span class="you">YOU</span>':''}</span><span>${Math.round(x.m)}</span></li>`).join('');
 const humans=[...ents.values()].filter(e=>!e.bot).length,live=socks.filter(w=>w.readyState==1).length;
 $('pc').textContent=humans+(humans==1?' player':' players')+' live';$('net').textContent=(live?'🟢 ':'🟡 ')+(1+[...peers.values()].filter(v=>now()-v<4000).length)+' online'+(RQ?' · room '+RQ:'')}
function esc(s){return String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';')}
A.esc=esc;
// ---------- boot: load features, then start
(async()=>{for(const f of FEATURES){try{const m=await import('./features/'+f+'.js');const d=m.default;A.feats[d.name||f]=d;d.init(A)}catch(e){console.error('feature '+f,e)}}
 skinButtons();net();requestAnimationFrame(frame)})();
window.__ba={ents,get me(){return me},ID,play,peers,pel};
