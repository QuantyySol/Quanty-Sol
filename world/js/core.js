// Blockverse core. Features live in js/features/<name>.js and export default {name, init(G)}.
import * as THREE from 'three';
const FEATURES=['darksouls','splat','rocketball','ultrahand','okami','fallguys','pokemon'];
const CS=16, H=64, SEED=1337, RD=4;
export const BLOCKS=[null,
 {n:'grass',c:0x5fa83b},{n:'dirt',c:0x8b5a2b},{n:'stone',c:0x8a8a8a},{n:'sand',c:0xe3d48a},
 {n:'water',c:0x3a7bd5,liquid:1},{n:'wood',c:0x6b4423},{n:'leaves',c:0x2f7d2a},{n:'snow',c:0xf4f8ff},
 {n:'plank',c:0xc8a165},{n:'glass',c:0xbfe8ff},{n:'bounce',c:0xff4fa3},{n:'lamp',c:0xffe27a,glow:1},{n:'brick',c:0xb5462f}];
const HOT=[1,2,3,9,4,10,13,12,11];
// ---- noise
function h2(x,z){let n=x*374761393+z*668265263+SEED*982451653;n=(n^(n>>>13))*1274126177;return((n^(n>>>16))>>>0)/4294967295}
function vn(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
 const a=h2(xi,zi),b=h2(xi+1,zi),c=h2(xi,zi+1),d=h2(xi+1,zi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,z,o=4){let s=0,a=1,f=1,t=0;for(let i=0;i<o;i++){s+=vn(x*f,z*f)*a;t+=a;a/=2;f*=2}return s/t}
// ---- game object
const G=window.G={THREE,BLOCKS,feats:{},handlers:{},on(ev,fn){(this.handlers[ev]||=[]).push(fn)},
 emit(ev,...a){(this.handlers[ev]||[]).forEach(f=>{try{f(...a)}catch(e){console.error(ev,e)}})},time:0.3,dayLen:600};
const renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));document.body.prepend(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(75,1,0.1,400);
scene.fog=new THREE.Fog(0x87ceeb,40,RD*CS);
const hemi=new THREE.HemisphereLight(0xffffff,0x445533,1),sun=new THREE.DirectionalLight(0xffffff,0.8);sun.position.set(30,60,20);
scene.add(hemi,sun);Object.assign(G,{scene,camera,renderer});
// ---- world
const chunks=new Map(),edits=new Map();G.edits=edits;
const ck=(cx,cz)=>cx+','+cz;
function genChunk(cx,cz){const d=new Uint8Array(CS*CS*H);
 for(let x=0;x<CS;x++)for(let z=0;z<CS;z++){const wx=cx*CS+x,wz=cz*CS+z;
  const temp=fbm(wx/220+50,wz/220),hgt=Math.floor(14+fbm(wx/60,wz/60)*26+Math.pow(fbm(wx/150+9,wz/150),3)*30);
  const desert=temp>0.62,snowy=hgt>38;
  for(let y=0;y<H;y++){let b=0;if(y<hgt-3)b=3;else if(y<hgt)b=desert?4:2;else if(y==hgt)b=desert?4:snowy?8:(hgt<=21?4:1);else if(y<=20)b=5;d[(y*CS+z)*CS+x]=b}
  if(!desert&&!snowy&&hgt>21&&h2(wx*7,wz*13)>0.985&&x>1&&x<14&&z>1&&z<14){for(let t=1;t<6;t++)d[((hgt+t)*CS+z)*CS+x]=6;
   for(let a=-2;a<=2;a++)for(let c=-2;c<=2;c++)for(let t=4;t<7;t++)if(Math.abs(a)+Math.abs(c)<(t==6?2:4)){const i=((hgt+t)*CS+z+c)*CS+x+a;if(!d[i])d[i]=7}}
 }
 const c={cx,cz,d,mesh:null,dirty:true};chunks.set(ck(cx,cz),c);
 for(const [k,b] of edits){const [x,y,z]=k.split(',').map(Number);if(Math.floor(x/CS)==cx&&Math.floor(z/CS)==cz)d[(y*CS+(z-cz*CS))*CS+(x-cx*CS)]=b}
 return c}
function get(x,y,z){if(y<0)return 3;if(y>=H)return 0;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);const c=chunks.get(ck(cx,cz));
 if(!c)return 0;return c.d[(y*CS+(z-cz*CS))*CS+(x-cx*CS)]}
function set(x,y,z,b,remote){x|=0;y|=0;z|=0;if(y<0||y>=H)return;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);
 edits.set(x+','+y+','+z,b);const c=chunks.get(ck(cx,cz));if(c){c.d[(y*CS+(z-cz*CS))*CS+(x-cx*CS)]=b;c.dirty=true;
 const lx=x-cx*CS,lz=z-cz*CS;[[lx==0,-1,0],[lx==CS-1,1,0],[lz==0,0,-1],[lz==CS-1,0,1]].forEach(([e,a,bb])=>{if(e){const n=chunks.get(ck(cx+a,cz+bb));if(n)n.dirty=true}})}
 if(!remote)G.net.send({t:'set',x,y,z,b});G.emit('blockSet',x,y,z,b,remote)}
const solid=b=>b&&!BLOCKS[b].liquid;
G.world={get,set,solid,CS,H,height(x,z){for(let y=H-1;y>0;y--)if(solid(get(x,y,z)))return y;return 0}};
const FACES=[[1,0,0,.8],[-1,0,0,.8],[0,1,0,1],[0,-1,0,.5],[0,0,1,.65],[0,0,-1,.65]];
const mat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),wmat=new THREE.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:.7,side:THREE.DoubleSide});
const col=new THREE.Color();
function buildChunk(c){const P=[],C=[],I=[],WP=[],WC=[],WI=[];const ox=c.cx*CS,oz=c.cz*CS;
 for(let y=0;y<H;y++)for(let z=0;z<CS;z++)for(let x=0;x<CS;x++){const b=c.d[(y*CS+z)*CS+x];if(!b)continue;const liq=BLOCKS[b].liquid;
  for(const [dx,dy,dz,sh] of FACES){const nb=get(ox+x+dx,y+dy,oz+z+dz);if(liq?nb:(solid(nb)&&nb!=10))continue;if(liq&&dy!=1)continue;
   const [p,cc,ii]=liq?[WP,WC,WI]:[P,C,I];const base=p.length/3;
   col.setHex(BLOCKS[b].c);const s=BLOCKS[b].glow?1.3:sh*(0.9+0.1*h2(ox+x+y,oz+z));
   const ax=dx?0:1,ay=dx?1:(dy?2:1);// build quad
   const cxp=x+(dx>0?1:0),cyp=y+(dy>0?1:0)-(liq&&dy>0?0.1:0),czp=z+(dz>0?1:0);
   let v;if(dx)v=[[0,0,0],[0,1,0],[0,1,1],[0,0,1]];else if(dy)v=[[0,0,0],[0,0,1],[1,0,1],[1,0,0]];else v=[[0,0,0],[1,0,0],[1,1,0],[0,1,0]];
   for(const q of v){p.push(ox+cxp+q[0],cyp+q[1],oz+czp+q[2]);cc.push(col.r*s,col.g*s,col.b*s)}
   const flip=(dx>0)||(dy<0)||(dz<0);ii.push(...(flip?[base,base+1,base+2,base,base+2,base+3]:[base,base+2,base+1,base,base+3,base+2]))}}
 if(c.mesh){scene.remove(c.mesh);c.mesh.traverse(o=>o.geometry&&o.geometry.dispose())}
 const mk=(p,cc,ii,m)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));g.setIndex(ii);g.computeVertexNormals();return new THREE.Mesh(g,m)};
 c.mesh=mk(P,C,I,mat);if(WP.length)c.mesh.add(mk(WP,WC,WI,wmat));scene.add(c.mesh);c.dirty=false}
// ---- player
const me=G.player={pos:new THREE.Vector3(8.5,0,8.5),vel:new THREE.Vector3(),yaw:0,pitch:0,onGround:false,sel:0,extra:{},speedMul:1,fallStart:null};
function collide(p){for(let x=Math.floor(p.x-.3);x<=Math.floor(p.x+.3);x++)for(let y=Math.floor(p.y);y<=Math.floor(p.y+1.7);y++)for(let z=Math.floor(p.z-.3);z<=Math.floor(p.z+.3);z++)if(solid(get(x,y,z)))return true;return false}
G.collide=collide;
const input={f:0,s:0,jump:false};G.input=input;
function physics(dt){const sp=4.6*me.speedMul*(G.mp&&G.mp.sprint?1.6:1)*(G.mp&&G.mp.crouch?.45:1);const sinY=Math.sin(me.yaw),cosY=Math.cos(me.yaw);
 const wx=(-sinY*input.f+cosY*input.s)*sp,wz=(-cosY*input.f-sinY*input.s)*sp;
 const inWater=BLOCKS[get(Math.floor(me.pos.x),Math.floor(me.pos.y+.5),Math.floor(me.pos.z))]?.liquid;
 me.vel.x+=(wx-me.vel.x)*Math.min(1,dt*10);me.vel.z+=(wz-me.vel.z)*Math.min(1,dt*10);
 me.vel.y-=(inWater?8:24)*dt;if(inWater)me.vel.y=Math.max(me.vel.y,-3);
 if(input.jump&&(me.onGround||inWater)){me.vel.y=inWater?4:8.2;G.emit('jump')}
 const below=get(Math.floor(me.pos.x),Math.floor(me.pos.y-.05),Math.floor(me.pos.z));
 for(const ax of ['x','y','z']){const old=me.pos[ax];me.pos[ax]+=me.vel[ax]*dt;if(collide(me.pos)){me.pos[ax]=old;
  if(ax=='y'){if(me.vel.y<0){me.onGround=true;const fell=me.fallStart!=null?me.fallStart-me.pos.y:0;me.fallStart=null;
   if(below==11){me.vel.y=15;me.onGround=false;G.emit('bounce');continue}
   if(fell>14)G.emit('death','fall')}me.vel.y=0}else me.vel[ax]=0}else if(ax=='y'){if(me.vel.y<-.1){me.onGround=false;if(me.fallStart==null)me.fallStart=me.pos.y}}}
 if(inWater)me.fallStart=null;
 if(me.pos.y<-20)G.emit('death','void')}
G.respawn=function(){me.pos.set(8.5,G.world.height(8,8)+2,8.5);me.vel.set(0,0,0);me.fallStart=null};
G.on('death',()=>{G.toast('YOU DIED');setTimeout(G.respawn,10)});
// ---- raycast (voxel DDA)
G.raycast=function(max=7){const o=camera.position,d=new THREE.Vector3();camera.getWorldDirection(d);
 let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z);const st=[Math.sign(d.x),Math.sign(d.y),Math.sign(d.z)];
 const td=[Math.abs(1/d.x),Math.abs(1/d.y),Math.abs(1/d.z)];
 const tm=[(st[0]>0?x+1-o.x:o.x-x)*td[0],(st[1]>0?y+1-o.y:o.y-y)*td[1],(st[2]>0?z+1-o.z:o.z-z)*td[2]];let n=[0,0,0],t=0;
 while(t<max){const b=get(x,y,z);if(solid(b))return{x,y,z,b,n,dist:t};
  const a=tm[0]<tm[1]?(tm[0]<tm[2]?0:2):(tm[1]<tm[2]?1:2);t=tm[a];tm[a]+=td[a];if(a==0)x+=st[0];else if(a==1)y+=st[1];else z+=st[2];n=[0,0,0];n[a]=-st[a]}return null};
G.breakBlock=function(){const h=G.raycast();if(!h)return;if(G.emit('beforeBreak',h),h.cancel)return;set(h.x,h.y,h.z,0);G.emit('broke',h)};
G.placeBlock=function(){const h=G.raycast();if(!h)return;const x=h.x+h.n[0],y=h.y+h.n[1],z=h.z+h.n[2];
 const p=me.pos;if(x==Math.floor(p.x)&&z==Math.floor(p.z)&&(y==Math.floor(p.y)||y==Math.floor(p.y+1)))return;const nb=G.inv?G.inv.takeSel():HOT[me.sel];if(nb)set(x,y,z,nb)};
// highlight
const hl=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01,1.01,1.01)),new THREE.LineBasicMaterial({color:0}));scene.add(hl);
// ---- UI
const $=id=>document.getElementById(id);
G.toast=(m,ms=1800)=>{const t=$('toast');t.textContent=m;t.style.opacity=1;clearTimeout(t._h);t._h=setTimeout(()=>t.style.opacity=0,ms)};
G.ui={button(label,title,fn){const b=document.createElement('button');b.textContent=label;b.title=title;b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();G.ui._used(b);fn(b)});G.ui._tray(b);return b},
 meter(top,color){const m=document.createElement('div');m.className='meter';m.style.top=top+'px';m.innerHTML=`<i style="background:${color};width:100%"></i>`;document.body.appendChild(m);return v=>m.firstChild.style.width=Math.max(0,Math.min(100,v*100))+'%'},
 panel(opts,cb){const p=document.createElement('div');p.className='panel';opts.forEach(o=>{const b=document.createElement('button');b.textContent=o;b.onpointerdown=e=>{e.stopPropagation();p.remove();cb(o)};p.appendChild(b)});
  const x=document.createElement('button');x.textContent='✕';x.onpointerdown=e=>{e.stopPropagation();p.remove()};p.appendChild(x);document.body.appendChild(p)}};
function drawHot(){if(G._drawHot)return G._drawHot();$('hotbar').innerHTML=HOT.map((b,i)=>`<div class="${i==me.sel?'sel':''}" data-i="${i}" style="background:#${BLOCKS[b].c.toString(16).padStart(6,'0')}" title="${BLOCKS[b].n}"></div>`).join('')}
$('hotbar').addEventListener('pointerdown',e=>{e.stopPropagation();if(e.target.dataset.i){me.sel=+e.target.dataset.i;drawHot()}});
// touch controls
let stickId=null,lookId=null,lx=0,ly=0;const stick=$('stick'),knob=$('knob');
stick.addEventListener('pointerdown',e=>{stickId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);e.stopPropagation()});
function moveStick(e){const r=stick.getBoundingClientRect();let dx=e.clientX-r.left-60,dy=e.clientY-r.top-60;const l=Math.hypot(dx,dy);if(l>45){dx*=45/l;dy*=45/l}
 knob.style.left=35+dx+'px';knob.style.top=35+dy+'px';input.f=-dy/45;input.s=dx/45}
stick.addEventListener('pointermove',e=>{if(e.pointerId==stickId)moveStick(e)});
const endStick=e=>{if(e.pointerId==stickId){stickId=null;input.f=input.s=0;knob.style.left=knob.style.top='35px'}};
stick.addEventListener('pointerup',endStick);stick.addEventListener('pointercancel',endStick);
const cv=renderer.domElement;
cv.addEventListener('pointerdown',e=>{if(G.capture&&G.capture.down(e))return;if(e.pointerType=='mouse'){if(document.pointerLockElement!=cv){cv.requestPointerLock?.();return}
  if(e.button==0){if(!G.mp.attack(true))G.surv.startBreak()}else if(e.button==2)G.mp.use();return}lookId=e.pointerId;lx=e.clientX;ly=e.clientY});
cv.addEventListener('pointermove',e=>{if(G.capture&&G.capture.move(e))return;if(e.pointerId==lookId){look((e.clientX-lx)*.006,(e.clientY-ly)*.006);lx=e.clientX;ly=e.clientY}});
cv.addEventListener('pointerup',e=>{if(G.capture&&G.capture.up(e))return;if(e.pointerType=='mouse'){G.surv.stopBreak();if(e.button==2)G.mp.useUp()}if(e.pointerId==lookId)lookId=null});
cv.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('mousemove',e=>{if(document.pointerLockElement==cv)look(e.movementX*.0025,e.movementY*.0025)});
function look(dx,dy){me.yaw-=dx;me.pitch=Math.max(-1.5,Math.min(1.5,me.pitch-dy))}
const hold=(id,on,off)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();on()});if(off){b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off)}};

const held={};const kn=event=>event.key.length==1?event.key.toLowerCase():event.key;
addEventListener('keydown',event=>{if(event.target.tagName=='INPUT')return;const k=kn(event);held[k]=1;if(k>='1'&&k<='9'){const n=+k-1;if(n<HOT.length){me.sel=n;drawHot()}}G.emit('kbd',k)});
addEventListener('keyup',event=>held[kn(event)]=0);
addEventListener('wheel',e=>{me.sel=(me.sel+(e.deltaY>0?1:HOT.length-1))%HOT.length;drawHot()});
function kbInput(){if(stickId!=null||G._dpad)return;const f=(held.w||held.ArrowUp?1:0)-(held.s||held.ArrowDown?1:0),s=(held.d||held.ArrowRight?1:0)-(held.a||held.ArrowLeft?1:0);
 if(f||s||G._kb){input.f=f;input.s=s;G._kb=f||s}if(held[' ']!==undefined&&(held[' ']||G._kj)){input.jump=!!held[' '];G._kj=held[' ']}}
// ---- networking: Nostr ephemeral events over several free public relays (wss on 443, no accounts) + ntfy for block-edit persistence
let finalizeEvent,sk;
const ROOM='blockverse-io-w1',KIND=20420,NTFY='https://ntfy.sh/'+ROOM+'-edits';
const RELAYS=['wss://nos.lol','wss://nostr.mom','wss://relay.damus.io','wss://relay.primal.net'];
const others=G.others=new Map();const keepLog=[];const netH={};const seenEv=new Set();let q=[],latestPos=null;const sockets=[];
G.net={id:Math.random().toString(36).slice(2,10),relays:0,
 send(m,msg){if(typeof m=='string'){msg={...(msg||{}),t:m};m=msg}m.from=this.id;if(m.keep){keepLog.push(m);if(keepLog.length>3000)keepLog.shift()}
  if(m.t=='pos')latestPos=m;else q.push(m)},
 on(t,fn){(netH[t]||=[]).push(fn)},get isHub(){return isLeader()}};
function isLeader(){let min=G.net.id;for(const [k] of others)if(k<min)min=k;return min==G.net.id}
function flush(){if(!finalizeEvent)return;const batch=q.splice(0,60);if(latestPos){batch.push(latestPos);latestPos=null}if(!batch.length)return;
 const ev=finalizeEvent({kind:KIND,created_at:Math.floor(Date.now()/1000),tags:[['t',ROOM]],content:JSON.stringify(batch)},sk);seenEv.add(ev.id);
 const s=JSON.stringify(['EVENT',ev]);sockets.forEach(w=>w.readyState==1&&w.send(s))}
setInterval(flush,220);
function openRelay(url){const w=new WebSocket(url);sockets.push(w);
 w.onopen=()=>{w.send(JSON.stringify(['REQ','bv',{kinds:[KIND],'#t':[ROOM],since:Math.floor(Date.now()/1000)-5}]));netStatus()};
 w.onmessage=e=>{let d;try{d=JSON.parse(e.data)}catch(_){return}if(d[0]!='EVENT')return;const ev=d[2];if(seenEv.has(ev.id))return;seenEv.add(ev.id);if(seenEv.size>5000)seenEv.clear();
  try{JSON.parse(ev.content).forEach(onMsg)}catch(_){}};
 w.onclose=()=>{sockets.splice(sockets.indexOf(w),1);netStatus();setTimeout(()=>openRelay(url),3000+Math.random()*3000)};w.onerror=()=>{}}
const pendingSync={};
function onMsg(m){if(!m||m.from==G.net.id)return;if(m.to&&m.to!=G.net.id){if(m.t=='sync')delete pendingSync[m.to];return}
 if(m.keep){keepLog.push(m);if(keepLog.length>3000)keepLog.shift()}
 if(m.t=='set'){set(m.x,m.y,m.z,m.b,true);return}
 if(m.t=='hello'){pendingSync[m.from]=setTimeout(()=>{if(!pendingSync[m.from])return;delete pendingSync[m.from];
   G.net.send({t:'sync',to:m.from,edits:[...edits].slice(-1500),keep:undefined,kl:keepLog.slice(-250),time:G.time})},300+Math.random()*1700);return}
 if(m.t=='sync'){if(G._synced)return;G._synced=true;m.edits.forEach(([k,b])=>{const [x,y,z]=k.split(',').map(Number);set(x,y,z,b,true)});(m.kl||[]).forEach(onMsg);if(m.time)G.time=m.time;return}
 if(m.t=='pos'){let o=others.get(m.from);if(!o){o=mkAvatar(m.name,m.color);others.set(m.from,o);G.toast(m.name+' joined',1200);G.emit('playerJoin',m.from,o)}o.target=m;o.seen=performance.now();return}
 if(m.t=='bye'){const o=others.get(m.from);if(o){scene.remove(o.g);others.delete(m.from)}return}
 (netH[m.t]||[]).forEach(f=>{try{f(m)}catch(e){console.error(e)}})}
async function connectNet(){try{const N=await import('https://esm.sh/nostr-tools@2.7.2/pure');finalizeEvent=N.finalizeEvent;sk=crypto.getRandomValues(new Uint8Array(32))}catch(e){console.warn('net lib failed',e);$('net').textContent='🔴 offline';return}RELAYS.forEach(openRelay);setTimeout(()=>G.net.send({t:'hello'}),2500)}
function netStatus(){const r=sockets.filter(w=>w.readyState==1).length;G.net.relays=r;$('net').textContent=(r?'🟢 ':'🟡 ')+(others.size+1)+' online ▾'}
// ntfy persistence: the leader (lowest id) flushes batched block edits every 20s; everyone loads the last 12h on start
let pendingEdits=[];G.on('blockSet',(x,y,z,b)=>{pendingEdits.push([x+','+y+','+z,b]);if(pendingEdits.length>2000)pendingEdits.shift()});
setInterval(()=>{if(!isLeader()||!pendingEdits.length)return;const batch=pendingEdits.splice(0,400);fetch(NTFY,{method:'POST',body:JSON.stringify(batch)}).catch(()=>{})},20000);
async function loadPersisted(){try{const r=await fetch(NTFY+'/json?poll=1&since=12h');const t=await r.text();
 t.split('\n').filter(Boolean).forEach(l=>{try{const m=JSON.parse(l);if(m.event=='message')JSON.parse(m.message).forEach(([k,b])=>edits.set(k,b))}catch(e){}})}catch(e){}}
// avatars
function label(text,color='#fff'){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='bold 34px sans-serif';x.textAlign='center';
 x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,8,256,48);x.fillStyle=color;x.fillText(text,128,44);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));s.scale.set(2,.5,1);return s}
G.label=label;
function mkAvatar(name,color){const g=new THREE.Group();const m=new THREE.MeshLambertMaterial({color:color||0xff8844});
 const body=new THREE.Mesh(new THREE.BoxGeometry(.6,1.1,.35),m);body.position.y=.85;const head=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),new THREE.MeshLambertMaterial({color:0xf1c27d}));head.position.y=1.65;
 const l=label(name||'player');l.position.y=2.3;g.add(body,head,l);scene.add(g);return{g,name}}
G.mkAvatar=mkAvatar;
// ---- loop
let last=performance.now(),posT=0,started=false;
function ensureChunks(){const pcx=Math.floor(me.pos.x/CS),pcz=Math.floor(me.pos.z/CS);let built=0;
 for(let r=0;r<=RD;r++)for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++){if(Math.max(Math.abs(a),Math.abs(b))!=r)continue;const k=ck(pcx+a,pcz+b);if(!chunks.has(k))genChunk(pcx+a,pcz+b)}
 for(const c of chunks.values()){const d=Math.max(Math.abs(c.cx-pcx),Math.abs(c.cz-pcz));
  if(d>RD+2){if(c.mesh){scene.remove(c.mesh);c.mesh.traverse(o=>o.geometry&&o.geometry.dispose())}chunks.delete(ck(c.cx,c.cz));continue}
  if(c.dirty&&d<RD&&built<(started?2:200)){buildChunk(c);built++}}}
G.isNight=()=>{const t=G.time%1;return t>0.55&&t<0.95};
function sky(dt){G.time+=dt/G.dayLen;const t=G.time%1,a=Math.sin(t*Math.PI*2);const l=Math.max(0.12,Math.min(1,a*1.6+0.35));
 const c=new THREE.Color(0x0b1030).lerp(new THREE.Color(0x87ceeb),l);if(t>0.42&&t<0.58)c.lerp(new THREE.Color(0xff9a5a),0.35*(1-Math.abs(t-0.5)/0.08));
 scene.background=c;scene.fog.color=c;hemi.intensity=0.25+l*0.85;sun.intensity=l*0.8;sun.position.set(Math.cos(t*Math.PI*2)*60,Math.max(5,a*60),20)}
function frame(now){requestAnimationFrame(frame);let dt=Math.min(0.05,(now-last)/1000);last=now;if(!started)return;
 if(!G.inputPaused)kbInput();else{input.f=input.s=0;input.jump=false}ensureChunks();if(!G.frozen){physics(dt);sky(dt)}
 camera.position.set(me.pos.x,me.pos.y+(G.mp&&G.mp.crouch?1.2:1.6),me.pos.z);camera.rotation.set(me.pitch,me.yaw,0,'YXZ');
 const h=G.raycast();hl.visible=!!h;if(h)hl.position.set(h.x+.5,h.y+.5,h.z+.5);
 for(const [id,o] of others){if(now-o.seen>10000){scene.remove(o.g);others.delete(id);continue}const t=o.target;
  o.g.position.lerp(new THREE.Vector3(t.x,t.y,t.z),Math.min(1,dt*10));o.g.rotation.y=t.yaw}
 posT+=dt;if(posT>0.1){posT=0;G.net.send({t:'pos',x:+me.pos.x.toFixed(2),y:+me.pos.y.toFixed(2),z:+me.pos.z.toFixed(2),yaw:+me.yaw.toFixed(2),name:G.name,color:G.color,ex:me.extra,hp:G.combat?G.combat.hp:10,cr:G.mp&&G.mp.crouch?1:0})}
 G.emit('tick',dt,now);
 $('info').textContent=`XYZ ${me.pos.x|0} ${me.pos.y|0} ${me.pos.z|0} · ${G.isNight()?'🌙':'☀️'} · ${G.inv?G.inv.selName():''}`+(G.infoExtra?' · '+G.infoExtra():'');
 renderer.render(scene,camera)}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();requestAnimationFrame(frame);
setInterval(netStatus,2000);addEventListener('beforeunload',()=>G.net.send({t:'bye'}));

// ---- extended plugin API
G.world.getBlock=get;G.world.placeBlock=(x,y,z,b)=>set(x,y,z,b);G.world.removeBlock=(x,y,z)=>set(x,y,z,0);
G.ui.addButton=G.ui.button;
// feature tray: every G.ui.button lands in #feat; on touch (or 13+ buttons) #feat becomes a 2-col grid behind a 48px toggle, last-used pinned beside it
{const feat=$('feat'),hud=$('hud'),tg=document.createElement('button'),pin=document.createElement('button');let last=null;
 tg.id='trayT';tg.textContent='☰';tg.title='Features';pin.id='trayPin';pin.style.display='none';hud.append(tg,pin);
 const mode=()=>{const on=matchMedia('(hover:none),(pointer:coarse)').matches||feat.children.length>=13;document.body.classList.toggle('tray',on);if(!on)document.body.classList.remove('trayOpen')};
 const sw=e=>{e.stopPropagation();e.preventDefault()};
 tg.addEventListener('pointerdown',e=>{sw(e);document.body.classList.toggle('trayOpen')});
 pin.addEventListener('pointerdown',e=>{sw(e);if(last)last.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}))});
 G.ui._tray=b=>{feat.appendChild(b);mode()};
 G.ui._used=b=>{if(b===last)return;last=b;feat.prepend(b);pin.textContent=b.textContent;pin.title=b.title;pin.style.display='';document.body.classList.remove('trayOpen')};
 setInterval(()=>{if(last){pin.className=last.className;if(pin.textContent!=last.textContent)pin.textContent=last.textContent}},300);
 addEventListener('resize',mode);mode()}
G.pauseInput=()=>{G.inputPaused=true;input.f=input.s=0;input.jump=false};G.resumeInput=()=>{G.inputPaused=false};
G.overlay=function(){let c=document.getElementById('ovl');if(!c){c=document.createElement('canvas');c.id='ovl';c.style.cssText='position:fixed;inset:0;z-index:9;display:none;touch-action:none';document.body.appendChild(c)}
 c.width=innerWidth;c.height=innerHeight;return c};
G.pushPlayers=function(center,radius,vec,remote){const p=me.pos;if(p.distanceTo(center)<radius){me.vel.add(vec);me.fallStart=null}
 if(!remote)G.net.send({t:'push',c:center.toArray(),r:radius,v:vec.toArray()})};
G.net.on('push',m=>G.pushPlayers(new THREE.Vector3().fromArray(m.c),m.r,new THREE.Vector3().fromArray(m.v),true));
// shared per-face paint layer (all 6 faces): color + owner. face: top|bottom|north(-z)|south(+z)|east(+x)|west(-x)
{const pm=new Map(),mats={},H=Math.PI/2,P=()=>new THREE.PlaneGeometry(1.02,1.02);
 const FG={top:P().rotateX(-H),bottom:P().rotateX(H),south:P(),north:P().rotateY(Math.PI),east:P().rotateY(H),west:P().rotateY(-H)};
 const FO={top:[.5,1.01,.5],bottom:[.5,-.01,.5],south:[.5,.5,1.01],north:[.5,.5,-.01],east:[1.01,.5,.5],west:[-.01,.5,.5]};
 const FN={top:[0,1,0],bottom:[0,-1,0],south:[0,0,1],north:[0,0,-1],east:[1,0,0],west:[-1,0,0]};
 const K=(x,y,z,f)=>x+','+y+','+z+(f&&f!='top'?','+f:'');
 const M=c=>mats[c]||=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.85,polygonOffset:true,polygonOffsetFactor:-2});
 const del=k=>{const o=pm.get(k);if(o){scene.remove(o.m);pm.delete(k)}};
 G.paint={map:pm,faces:Object.keys(FG),normals:FN,get:(x,y,z,face)=>pm.get(K(x,y,z,face)),
  faceFromNormal(n){if(!n)return'top';const[a,b,c]=n;return b>0?'top':b<0?'bottom':a>0?'east':a<0?'west':c>0?'south':'north'},
  set(x,y,z,color,owner,face,remote){if(face===true){remote=true;face='top'}face=FG[face]?face:'top';const k=K(x,y,z,face),o=pm.get(k);
   if(o){if(o.color==color)return;scene.remove(o.m)}
   if(color==null){pm.delete(k);if(!remote)G.net.send({t:'paint',p:[[x,y,z,null,owner,face]],keep:1});return}
   const m=new THREE.Mesh(FG[face],M(color)),f=FO[face];m.position.set(x+f[0],y+f[1],z+f[2]);scene.add(m);pm.set(k,{color,owner,face,m});if(!remote)G._pq.push([x,y,z,color,owner,face])},
  count(){const n={};for(const v of pm.values())n[v.owner]=(n[v.owner]||0)+1;return n},materials:mats};
 G._pq=[];setInterval(()=>{if(G._pq.length){G.net.send({t:'paint',p:G._pq.splice(0),keep:1})}},250);
 G.net.on('paint',m=>m.p.forEach(([x,y,z,c,o,f])=>G.paint.set(x,y,z,c,o,f||'top',true)));
 // placing a block covers the neighbour faces it touches; removing a block drops all its paint
 G.on('blockSet',(x,y,z,b)=>{if(b){for(const f in FN){const n=FN[f],opp={top:'bottom',bottom:'top',north:'south',south:'north',east:'west',west:'east'}[f];del(K(x+n[0],y+n[1],z+n[2],opp))}}
  else for(const f in FG)del(K(x,y,z,f))})}
// shared per-feature state: G.state(featureId) -> object; G.setState(featureId,patch) syncs to everyone (kept for late joiners)
{const S={};G.state=f=>S[f]||={};G.setState=(f,patch,remote)=>{Object.assign(G.state(f),patch);if(!remote)G.net.send({t:'state',f,patch,keep:1});G.emit('state:'+f,G.state(f))};
 G.net.on('state',m=>G.setState(m.f,m.patch,true))}
// simple physics bodies (spheres/boxes vs voxels): G.physics.add({pos:Vector3,vel,radius,bounce,gravity}) -> body; stepped every tick
G.physics={bodies:new Set(),add(b){b.vel||=new THREE.Vector3();b.radius??=.5;b.bounce??=.5;b.gravity??=18;this.bodies.add(b);return b},remove(b){this.bodies.delete(b)},
 step(dt){for(const b of this.bodies){if(b.frozen)continue;b.vel.y-=b.gravity*dt;b.vel.multiplyScalar(1-dt*(b.drag??.3));
  for(const ax of['x','y','z']){const o=b.pos[ax];b.pos[ax]+=b.vel[ax]*dt;const off={x:0,y:0,z:0};off[ax]=Math.sign(b.vel[ax])*b.radius;
   if(solid(get(Math.floor(b.pos.x+off.x),Math.floor(b.pos.y+off.y),Math.floor(b.pos.z+off.z)))){b.pos[ax]=o;b.vel[ax]*=-b.bounce;if(ax=='y')b.onGround=true}}
  b.mesh&&b.mesh.position.copy(b.pos)}}};
G.on('tick',dt=>G.physics.step(dt));
// ---- multiplayer combat + controls: D-pad/joystick, A/B/X/Y cluster, hearts, emotes, quick chat, players list
{const V3=THREE.Vector3,mp=G.mp={sprint:false,crouch:false},MAX=10,REACH=3.6;let hp=MAX,inv=0,lastHitBy=null;
 const ui=document.createElement('div');ui.id='mp';$('hud').appendChild(ui);
 ui.innerHTML=`<div id="hearts"></div><div id="kfeed"></div>
 <div id="dpad">${['ul','u','ur','l','c','r','dl','d','dr'].map(k=>`<i data-k="${k}">${{u:'▲',d:'▼',l:'◀',r:'▶'}[k]||''}</i>`).join('')}</div>
 <div id="pad"><button id="bA" class="big" title="Jump (Space)">A</button><button id="bB" title="Attack (Z / click), hold to break">B</button>
 <button id="bX" title="Interact (X)">X</button><button id="bY" title="Use / Place (U / right click)">Y</button></div>
 <div id="minis"><button id="bSpr" title="Sprint toggle (Ctrl)">🏃</button><button id="bCr" title="Crouch (C)">🧎</button><button id="bEm" title="Emote (V)">😀</button><button id="bCh" title="Quick chat (T)">💬</button></div>
 <div id="plist" class="panel" style="display:none"></div>`;
 const hearts=$('hearts');function drawHP(){hearts.innerHTML=Array.from({length:MAX},(_,i)=>`<b class="${i<hp?'':'e'}">♥</b>`).join('')}drawHP();
 const kill=t=>{const d=document.createElement('div');d.textContent=t;$('kfeed').prepend(d);setTimeout(()=>d.remove(),5000);while($('kfeed').children.length>4)$('kfeed').lastChild.remove()};
 // registered targets (creatures, signs, contraptions, gates): features call G.combat.addTarget({pos|obj,radius,name,kind,onHit,onInteract})
 const targets=new Set();
 const tpos=t=>t.pos||(t.obj&&t.obj.position)||(t.mesh&&t.mesh.position);
 function aim(){const d=new V3();camera.getWorldDirection(d);const eye=camera.position;let best=null,bd=REACH;
  const test=(p,r,o)=>{if(!p)return;const c=new V3(p.x,p.y+(o.kind=='player'?1:0),p.z),v=c.clone().sub(eye),dist=v.length();if(dist>REACH+r)return;
   const along=v.dot(d);if(along<0)return;const off=v.clone().sub(d.clone().multiplyScalar(along)).length();if(off<r+.5&&dist<bd+r){bd=dist;best=o}};
  for(const [id,o] of others)if(o.target)test(o.target,.6,{kind:'player',id,name:o.target.name,avatar:o});
  for(const t of targets)test(tpos(t),t.radius||.6,t);return best}
 G.combat={get hp(){return hp},max:MAX,targets,aim,
  addTarget(t){targets.add(t);return()=>targets.delete(t)},
  heal(n=MAX){hp=Math.min(MAX,hp+n);drawHP()},
  damage(target,amount=1,kb){if(target==null||target=='me'||target==G.net.id)return hurt(amount,kb,null);
   if(typeof target=='string'){const o=others.get(target);G.net.send({t:'mp',k:'hit',to:target,a:amount,kb:kb||[0,3,0],by:G.name});return}
   if(target.kind=='player')return G.combat.damage(target.id,amount,kb);try{target.onHit&&target.onHit(amount,G.net.id)}catch(e){console.error(e)}}};
 function hurt(a,kb,by){const now=performance.now();if(now<inv||hp<=0)return;inv=now+700;hp=Math.max(0,hp-a);drawHP();lastHitBy=by;
  if(kb)me.vel.add(new V3().fromArray(kb));me.fallStart=null;document.body.classList.add('hurt');setTimeout(()=>document.body.classList.remove('hurt'),200);
  if(hp<=0){G.net.send({t:'mp',k:'kill',v:G.name,by});kill((by||'?')+' ⚔ '+G.name);G.emit('death',by?'player':'damage')}}
 G.on('death',()=>{hp=MAX;inv=performance.now()+1500;setTimeout(drawHP,20)});
 G.net.on('mp',m=>{const o=others.get(m.from);
  if(m.k=='hit')hurt(m.a,m.kb,m.by);
  else if(m.k=='kill')kill(m.by+' ⚔ '+m.v);
  else if(m.k=='sw'&&o){o.g.rotation.x=-.35;setTimeout(()=>o.g.rotation.x=0,180)}
  else if(m.k=='em'&&o)bubble(o,m.e,m.dance);
  else if(m.k=='greet')G.toast('👋 '+m.n+' says hi!');});
 // name tags with health bars + emote bubbles on remote avatars
 const bg=new THREE.SpriteMaterial({color:0x000000,depthTest:false,opacity:.6,transparent:true});
 G.on('playerJoin',(id,o)=>{const b=new THREE.Sprite(bg);b.scale.set(1.2,.12,1);b.position.y=2.02;const f=new THREE.Sprite(new THREE.SpriteMaterial({color:0x44ff66,depthTest:false}));
  f.center.set(0,.5);f.scale.set(1.16,.08,1);f.position.set(-.58,2.02,0);o.g.add(b,f);o.bar=f});
 function bubble(o,txt,dance){if(o.em)o.g.remove(o.em);const l=label(txt,'#ffd23f');l.position.y=2.75;o.g.add(l);o.em=l;o.dance=dance?performance.now()+3000:0;
  clearTimeout(o.emT);o.emT=setTimeout(()=>{o.g.remove(l);if(o.em==l)o.em=null},3200)}
 G.on('tick',(dt,now)=>{for(const [,o] of others){const t=o.target;if(!t)continue;if(o.bar){const r=Math.max(0,(t.hp??MAX)/MAX);o.bar.scale.x=1.16*r;o.bar.material.color.setHex(r>.5?0x44ff66:r>.25?0xffcc33:0xff4444)}
  o.g.scale.y=t.cr?.75:1;if(o.dance&&now<o.dance)o.g.rotation.y+=dt*8}});
 // actions
 let swingT=0;mp.attack=function(fromClick){const now=performance.now();if(now<swingT)return !!aim();const t=aim();
  if(!t&&fromClick)return false;swingT=now+600;G.net.send({t:'mp',k:'sw'});const ev={target:t,hit:t?null:G.raycast(4)};G.emit('attack',ev);
  if(t&&!ev.cancel){const d=new V3();camera.getWorldDirection(d);d.y=0;d.normalize().multiplyScalar(7);d.y=4;const w=G.inv&&G.inv.held(),wd=w&&G.ITEMS[w.id]&&G.ITEMS[w.id].dmg||1;G.combat.damage(t,wd,d.toArray())}return !!t};
 mp.interact=function(){const t=aim(),h=G.raycast(5),ev={target:t,hit:h,type:t?t.kind||'target':h?'block':'none'};G.emit('interact',ev);if(ev.handled)return;
  if(t&&t.onInteract){try{t.onInteract(G.net.id)}catch(e){console.error(e)}}
  else if(t&&t.kind=='player'){G.net.send({t:'mp',k:'greet',to:t.id,n:G.name});G.toast('👋 You greeted '+t.name)}};
 // Use slot: features claim it; last claim wins; unclaimed = place block
 const uses=[];G.ui.setUse=function(o){if(o==null){uses.pop();drawUse();return()=>{}}uses.push(o);drawUse();return()=>{const i=uses.indexOf(o);if(i>=0)uses.splice(i,1);drawUse()}};
 G.ui.clearUse=o=>{const i=uses.indexOf(o);if(i>=0)uses.splice(i,1);drawUse()};
 function drawUse(){const u=uses[uses.length-1],b=$('bY');b.textContent=u?u.icon:'Y';b.title=u?u.label:'Place block';b.classList.toggle('on',!!u)}
 mp.useUp=()=>{G.surv.stopEat();const u=mp._down;mp._down=null;if(u&&u.onRelease){try{u.onRelease()}catch(e){console.error(e)}}};
 mp.use=()=>{if(G.surv.startEat())return;const u=uses[uses.length-1];if(u){mp._down=u;try{u.onPress&&u.onPress()}catch(e){console.error(e)}}else G.placeBlock()};
 const emote=(e)=>{const E={wave:'👋',dance:'💃',laugh:'😂',thumbs:'👍'},txt=E[e]||e;G.net.send({t:'mp',k:'em',e:txt,dance:e=='dance'?1:0});G.toast('You: '+txt,1200);G.emit('emote',e)};
 mp.emote=emote;
 const PH=['Hi! 👋','Follow me!','Help!','GG 🏆','Nice build!','Race? 🏁','Fight me ⚔','Thanks!','Over here!','brb'];
 const press=(id,fn,up)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();b.classList.add('dn');fn()});
  const u=e=>{b.classList.remove('dn');up&&up()};b.addEventListener('pointerup',u);b.addEventListener('pointercancel',u);b.addEventListener('pointerleave',u)};
 press('bA',()=>input.jump=true,()=>input.jump=false);
 press('bB',()=>{if(!mp.attack())G.surv.startBreak()},()=>G.surv.stopBreak());
 press('bX',mp.interact);press('bY',mp.use,mp.useUp);
 const tog=(k,id)=>{mp[k]=!mp[k];$(id).classList.toggle('on',mp[k])};
 press('bSpr',()=>tog('sprint','bSpr'));press('bCr',()=>tog('crouch','bCr'));
 const emPanel=()=>G.ui.panel(['👋 wave','💃 dance','😂 laugh','👍 thumbs'],o=>emote(o.split(' ')[1]));
 const chPanel=()=>G.ui.panel(PH,p=>{G.net.send({t:'mp',k:'em',e:p});G.toast('You: '+p,1500)});
 press('bEm',emPanel);press('bCh',chPanel);
 G.on('kbd',k=>{if(k=='z')mp.attack();else if(k=='x')mp.interact();else if(k=='u')mp.use();else if(k=='c')tog('crouch','bCr');else if(k=='Control')tog('sprint','bSpr');else if(k=='v')emPanel();else if(k=='t')chPanel()});
 // D-pad (8-way) with joystick fallback
 const dp=$('dpad');let dpId=null;const setCtl=c=>{localStorage.bvCtl=c;G._dpad=false;document.body.classList.toggle('joy',c=='joy')};setCtl(localStorage.bvCtl||'dpad');
 function dmove(e){const r=dp.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;
  if(Math.hypot(dx,dy)<12){input.f=input.s=0}else{const a=Math.round(Math.atan2(dy,dx)/(Math.PI/4));const s=Math.round(Math.cos(a*Math.PI/4)),f=-Math.round(Math.sin(a*Math.PI/4));input.f=f;input.s=s}
  [...dp.children].forEach(i=>{const k=i.dataset.k;i.classList.toggle('on',(k.includes('u')&&input.f>0)||(k.includes('d')&&input.f<0)||(k.includes('l')&&input.s<0)||(k.includes('r')&&input.s>0))})}
 dp.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();dpId=e.pointerId;dp.setPointerCapture(e.pointerId);G._dpad=true;dmove(e)});
 dp.addEventListener('pointermove',e=>{if(e.pointerId==dpId)dmove(e)});
 const dend=e=>{if(e.pointerId!=dpId)return;dpId=null;G._dpad=false;input.f=input.s=0;[...dp.children].forEach(i=>i.classList.remove('on'))};
 dp.addEventListener('pointerup',dend);dp.addEventListener('pointercancel',dend);
 // players-online pill -> list with teleport, invite, controls setting
 const pl=$('plist'),net=$('net');net.classList.add('pill');
 const hex=c=>'#'+(c||0xffffff).toString(16).padStart(6,'0');
 const esc=s=>String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
 function drawList(){pl.innerHTML=`<h3>Players online (${others.size+1})</h3><div class="pr"><i style="background:${hex(G.color)}"></i>${esc(G.name)} (you) ${'♥'.repeat(Math.ceil(hp/2))}</div>`+
  [...others].map(([id,o])=>`<div class="pr"><i style="background:${hex(o.target&&o.target.color)}"></i>${esc(o.target&&o.target.name)}<button data-tp="${esc(id)}">Teleport</button></div>`).join('')+
  `<div class="row"><button id="inv">🔗 Invite friends</button><button id="ctl">Controls: ${localStorage.bvCtl=='joy'?'Joystick':'D-pad'}</button><button id="plx">✕</button></div>`}
 net.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();if(pl.style.display=='none'){drawList();pl.style.display='flex'}else pl.style.display='none'});
 pl.addEventListener('pointerdown',async e=>{e.stopPropagation();const b=e.target;
  if(b.dataset.tp){const o=others.get(b.dataset.tp);if(o&&o.target){me.pos.set(o.target.x+1,o.target.y+1,o.target.z);me.vel.set(0,0,0);me.fallStart=null;G.toast('Teleported to '+o.target.name)}pl.style.display='none'}
  else if(b.id=='inv'){const url=location.origin+location.pathname;try{if(navigator.share){await navigator.share({title:'Blockverse',text:'Come play Blockverse with me!',url})}else{await navigator.clipboard.writeText(url);G.toast('Link copied!')}}catch(_){G.toast(url,4000)}}
  else if(b.id=='ctl'){setCtl(localStorage.bvCtl=='joy'?'dpad':'joy');drawList()}
  else if(b.id=='plx')pl.style.display='none'})}
// ---- survival: items, inventory (9 hotbar + 27 backpack), drops, hold-to-break hardness, hunger, eating, crafting
{const V3=THREE.Vector3;
 const ITEMS=G.ITEMS={100:{n:'stick',i:'🥢'},101:{n:'wood pickaxe',i:'⛏',tool:'pick',lv:2,st:1},102:{n:'stone pickaxe',i:'⛏',tool:'pick',lv:4,st:1,c:0x8a8a8a},
  103:{n:'wood sword',i:'🗡',dmg:2,st:1},104:{n:'stone sword',i:'🗡',dmg:3,st:1,c:0x8a8a8a},110:{n:'apple',i:'🍎',food:3},111:{n:'bread',i:'🍞',food:5},112:{n:'wheat',i:'🌾'},113:{n:'cooked meat',i:'🍖',food:8},114:{n:'raw meat',i:'🥩',food:2}};
 const NAMES=G.ITEM_IDS={stick:100,wood_pickaxe:101,stone_pickaxe:102,wood_sword:103,stone_sword:104,apple:110,bread:111,wheat:112,cooked_meat:113,raw_meat:114};
 BLOCKS.forEach((b,i)=>{if(b)NAMES[b.n]=i});
 const res=id=>typeof id=='string'&&NAMES[id]!=null?NAMES[id]:id,isBlock=id=>typeof id=='number'&&id>0&&id<100;
 const item=id=>{id=res(id);return isBlock(id)?BLOCKS[id]&&{n:BLOCKS[id].n,c:BLOCKS[id].c,block:1}:ITEMS[id]||{n:String(id),i:'❔'}};
 const HARD={1:.6,2:.5,4:.5,8:.3,7:.3,6:1.5,9:1.5,3:3,13:3,10:.4,11:.8,12:.5};
 const PICK={3:1,13:1,10:1,12:1,6:.5,9:.5};// how much a pickaxe helps
 const DROP=b=>b==1?[[2,1],Math.random()<.25&&[112,1]]:b==7?[Math.random()<.18?[110,1]:Math.random()<.5&&[7,1]]:b==10?[]:[[b,1]];
 const MAXS=id=>item(id).st||64;
 // inventory
 let slots;try{slots=JSON.parse(localStorage.bvInv)}catch(_){}if(!Array.isArray(slots)||slots.length!=36)slots=Array.from({length:36},()=>null);
 if(!localStorage.bvInv){slots[0]={id:9,n:16};slots[1]={id:110,n:3}}
 const save=()=>{localStorage.bvInv=JSON.stringify(slots);drawHotI();if(bp.style.display!='none')drawBP()};
 const inv=G.inv={slots,item,
  get sel(){return me.sel},hotbar:()=>slots.slice(0,9),held:()=>slots[me.sel],
  count(id){id=res(id);return slots.reduce((a,s)=>a+(s&&s.id==id?s.n:0),0)},
  add(id,n=1){id=res(id);for(const s of slots)if(n&&s&&s.id==id&&s.n<MAXS(id)){const k=Math.min(n,MAXS(id)-s.n);s.n+=k;n-=k}
   for(let i=0;i<36&&n;i++)if(!slots[i]){const k=Math.min(n,MAXS(id));slots[i]={id,n:k};n-=k}save();return n},// returns leftover
  remove(id,n=1){id=res(id);if(inv.count(id)<n)return false;for(let i=35;i>=0&&n;i--){const s=slots[i];if(s&&s.id==id){const k=Math.min(n,s.n);s.n-=k;n-=k;if(!s.n)slots[i]=null}}save();return true},
  takeSel(){const s=slots[me.sel];if(!s||!isBlock(s.id))return 0;s.n--;const id=s.id;if(!s.n)slots[me.sel]=null;save();return id},
  selName(){const s=slots[me.sel];return s?item(s.id).n+(s.n>1?' ×'+s.n:''):'empty hand'},swap(a,b){[slots[a],slots[b]]=[slots[b],slots[a]];save()},
  defineItem(id,o={}){if(typeof id=='string'&&NAMES[id]==null)NAMES[id]=id;id=res(id);if(isBlock(id))return id;
   const old=ITEMS[id]||{};ITEMS[id]={...old,n:o.name||old.n||String(id).replace(/_/g,' '),i:o.icon??old.i,food:o.food??old.food,st:o.stack??old.st,c:o.color??old.c,dmg:o.dmg??old.dmg,tool:o.tool??old.tool,lv:o.lv??old.lv};
   try{drawHotI()}catch(_){}return id}};
 const cell=(s,i,cls='')=>{const it=s&&item(s.id);const bg=it&&it.c!=null?'#'+it.c.toString(16).padStart(6,'0'):'rgba(0,0,0,.35)';
  return `<div class="${cls}" data-i="${i}" style="background:${bg}" title="${it?it.n:''}">${it&&it.i?'<em>'+it.i+'</em>':''}${s&&s.n>1?'<s>'+s.n+'</s>':''}</div>`};
 function drawHotI(){$('hotbar').innerHTML=slots.slice(0,9).map((s,i)=>cell(s,i,i==me.sel?'sel':'')).join('')}
 G._drawHot=drawHotI;drawHotI();
 // backpack + crafting
 const R=G.RECIPES=[{out:[9,4],in:[[6,1]]},{out:[100,4],in:[[9,2]]},{out:[101,1],in:[[9,3],[100,2]]},{out:[102,1],in:[[3,3],[100,2]]},
  {out:[103,1],in:[[9,2],[100,1]]},{out:[104,1],in:[[3,2],[100,1]]},{out:[111,1],in:[[112,3]]},{out:[113,1],in:[[114,1],[12,0]]}];
 const bp=document.createElement('div');bp.id='bp';bp.className='panel';bp.style.display='none';document.body.appendChild(bp);let pick=null;
 const ok=r=>r.in.every(([id,n])=>n?inv.count(id)>=n:inv.count(id)>0);
 function drawBP(){bp.innerHTML=`<h3>Backpack</h3><div class="grid">${slots.slice(9).map((s,i)=>cell(s,i+9,pick==i+9?'pk':'')).join('')}</div>
  <div class="grid hb">${slots.slice(0,9).map((s,i)=>cell(s,i,pick==i?'pk':i==me.sel?'sel':'')).join('')}</div><h3>Craft</h3><div class="craft">`+
  R.map((r,k)=>`<button data-r="${k}" ${ok(r)?'':'disabled'}>${r.in.map(([id,n])=>(n?n+' ':'')+(item(id).i||item(id).n)).join(' + ')} → ${r.out[1]>1?r.out[1]:''}${item(r.out[0]).i||''} ${item(r.out[0]).n}</button>`).join('')+`</div><button id="bpx">✕ Close</button>`}
 const toggleBP=()=>{if(bp.style.display=='none'){pick=null;drawBP();bp.style.display='flex'}else bp.style.display='none'};G.inv.open=toggleBP;
 bp.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();const c=e.target.closest('[data-i],[data-r],#bpx');if(!c)return;
  if(c.id=='bpx')return toggleBP();
  if(c.dataset.r!=null){const r=R[+c.dataset.r];if(!ok(r))return;r.in.forEach(([id,n])=>n&&inv.remove(id,n));const left=inv.add(...r.out);if(left)G.toast('Backpack full');else G.toast('Crafted '+item(r.out[0]).n,900);return drawBP()}
  const i=+c.dataset.i;if(pick==null){if(slots[i]||i<9){pick=i;if(i<9){me.sel=i}}drawBP();drawHotI()}else{const a=slots[pick],b=slots[i];
   if(a&&b&&a.id==b.id&&pick!=i){const k=Math.min(a.n,MAXS(b.id)-b.n);b.n+=k;a.n-=k;if(!a.n)slots[pick]=null;save()}else inv.swap(pick,i);pick=null;drawBP()}});
 const bb=document.createElement('button');bb.id='bBag';bb.title='Backpack & crafting (E)';bb.textContent='🎒';$('minis').appendChild(bb);
 bb.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();toggleBP()});
 // drops
 const drops=new Set(),dg=new THREE.BoxGeometry(.28,.28,.28);
 function spawn(id,n,x,y,z){const it=item(id);const m=new THREE.Mesh(dg,new THREE.MeshLambertMaterial({color:it.c??(it.food?0xd9534f:0xc8a165)}));
  m.position.set(x,y,z);scene.add(m);const b=G.physics.add({pos:m.position,vel:new V3((Math.random()-.5)*2,3,(Math.random()-.5)*2),radius:.14,bounce:.2,mesh:m});drops.add({id,n,m,b,t:performance.now()})}
 G.inv.drop=spawn;
 G.on('broke',h=>{for(const d of DROP(h.b))if(d)spawn(d[0],d[1],h.x+.5,h.y+.5,h.z+.5)});
 G.on('tick',(dt,now)=>{for(const d of drops){d.m.rotation.y+=dt*2;const age=now-d.t;
  if(age>300000||(age>400&&d.m.position.distanceTo(new V3(me.pos.x,me.pos.y+.6,me.pos.z))<1.7&&inv.add(d.id,d.n)==0)){scene.remove(d.m);G.physics.remove(d.b);drops.delete(d)}}});
 // hold-to-break with hardness + crack overlay + ring
 const cc=document.createElement('canvas');cc.width=cc.height=64;{const x=cc.getContext('2d');x.strokeStyle='#000';x.lineWidth=3;
  for(let k=0;k<9;k++){x.beginPath();let px=32,py=32;x.moveTo(px,py);for(let j=0;j<4;j++){px+=(Math.random()-.5)*30;py+=(Math.random()-.5)*30;x.lineTo(px,py)}x.stroke()}}
 const crack=new THREE.Mesh(new THREE.BoxGeometry(1.02,1.02,1.02),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cc),transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}));crack.visible=false;scene.add(crack);
 let breaking=false,bk=null,prog=0;const ring=(id,v,p)=>$(id)&&$(id).style.setProperty(v,p);
 G.breakTime=b=>{const h=HARD[b]??1,t=slots[me.sel]&&item(slots[me.sel].id);const mul=t&&t.tool=='pick'?1+(t.lv-1)*(PICK[b]||0):1;return h/mul};
 G.surv={startBreak(){breaking=true},stopBreak(){breaking=false;prog=0;bk=null;crack.visible=false;ring('bB','--p',0)}};
 // hunger + eating
 let hunger=10,hT=0,rT=0,eating=0;try{hunger=+localStorage.bvHunger||10}catch(_){}
 const hb=document.createElement('div');hb.id='hungerbar';$('mp').appendChild(hb);
 const drawHu=()=>{hb.innerHTML=Array.from({length:10},(_,i)=>`<b class="${i<Math.ceil(hunger)?'':'e'}">🍗</b>`).join('');localStorage.bvHunger=hunger};drawHu();
 G.hunger={get value(){return hunger},max:10,set(v){hunger=Math.max(0,Math.min(10,v));drawHu()},eat(id){id=res(id);const f=item(id)&&item(id).food;if(!f||!inv.remove(id,1))return false;G.hunger.set(hunger+f);G.toast('Ate '+item(id).n+' 😋',900);G.emit('eat',id);return true}};
 G.surv.startEat=()=>{const s=slots[me.sel];if(s&&item(s.id).food){if(hunger>=10){G.toast('Not hungry');return true}eating=performance.now();return true}return false};
 G.surv.stopEat=()=>{eating=0;ring('bY','--e',0)};
 G.on('death',()=>{G.hunger.set(Math.max(hunger,6));G.surv.stopBreak()});
 G.on('tick',(dt,now)=>{
  if(breaking&&!G.inputPaused){const h=G.raycast();if(!h||BLOCKS[h.b].liquid){prog=0;bk=null;crack.visible=false}else{const k=h.x+','+h.y+','+h.z;if(k!=bk){bk=k;prog=0}
   prog+=dt/Math.max(.05,G.breakTime(h.b));crack.visible=true;crack.position.set(h.x+.5,h.y+.5,h.z+.5);crack.material.opacity=.15+.75*Math.min(1,prog);
   if(prog>=1){G.breakBlock();prog=0;bk=null;crack.visible=false}}ring('bB','--p',Math.min(1,prog))}
  if(eating){const p=(now-eating)/1600;ring('bY','--e',Math.min(1,p));if(p>=1){const s=slots[me.sel];if(s)G.hunger.eat(s.id);eating=s&&item(s.id).food&&hunger<10?now:0;if(!eating)ring('bY','--e',0)}}
  const rate=(G.mp.sprint&&(input.f||input.s))?3:1;hT+=dt*rate;if(hT>=45){hT=0;G.hunger.set(hunger-.5)}
  rT+=dt;if(rT>=4){rT=0;if(hunger>=9&&G.combat.hp<G.combat.max){G.combat.heal(1);G.hunger.set(hunger-.25)}else if(hunger<=0)G.combat.damage('me',1)}});
 G.on('kbd',k=>{if(k=='e')toggleBP();if(k=='Escape'&&bp.style.display!='none')toggleBP()});
 addEventListener('keyup',e=>{const k=kn(e);if(k=='z')G.surv.stopBreak();if(k=='u')G.mp.useUp()});G.on('kbd',k=>{if(k=='z')G.surv.startBreak()})}
// ---- start
$('nick').value=localStorage.bvName||'';
async function start(){G.name=($('nick').value.trim()||'Player'+(Math.random()*999|0)).slice(0,14);localStorage.bvName=G.name;
 G.color=new THREE.Color().setHSL(Math.random(),.7,.55).getHex();$('start').style.display='none';$('hud').style.display='block';
 await loadPersisted();for(const f of FEATURES){try{const m=await import('./features/'+f+'.js');G.feats[m.default.name]=m.default;m.default.init(G)}catch(e){console.error('feature',f,e)}}
 drawHot();ensureChunks();G.respawn();started=true;connectNet()}
$('play').onclick=start;if(new URLSearchParams(location.search).has('autoplay')){$('nick').value=new URLSearchParams(location.search).get('name')||'';start()}
