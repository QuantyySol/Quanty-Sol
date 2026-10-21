// food.js: animals that drop meat, shakeable apple trees, shared campfires for cooking.
export default{name:'food',init(G){const T=G.THREE,V=T.Vector3;
const LEAF=G.ITEM_IDS&&G.ITEM_IDS.leaves;
// ---------- animals (local wild critters, like pokemon wilds) ----------
const KINDS=[{n:'Pig',c:0xf2a3b3,hp:3,meat:2,s:1},{n:'Cow',c:0x6b4a2e,hp:4,meat:3,s:1.25},{n:'Chicken',c:0xffffff,hp:2,meat:1,s:.7}];
const mobs=new Set();let spawnT=0;
function mkMob(k,x,z){const g=new T.Group(),m=new T.MeshLambertMaterial({color:k.c});
 const b=new T.Mesh(new T.BoxGeometry(.9*k.s,.6*k.s,1.2*k.s),m);b.position.y=.5*k.s;
 const h=new T.Mesh(new T.BoxGeometry(.5*k.s,.5*k.s,.5*k.s),m);h.position.set(0,.8*k.s,.75*k.s);g.add(b,h);
 const y=G.world.height(Math.floor(x),Math.floor(z))+1;g.position.set(x,y,z);G.scene.add(g);
 const mob={k,g,hp:k.hp,dir:Math.random()*6.28,t:0,flee:0};
 mob.rm=G.combat.addTarget({obj:g,radius:.9*k.s,name:k.n,kind:'animal',
  onHit(a){mob.hp-=a||1;mob.flee=2;b.material.emissive&&b.material.emissive.setHex(0x660000);setTimeout(()=>b.material.emissive&&b.material.emissive.setHex(0),150);
   if(mob.hp<=0)kill(mob)},
  onInteract(){G.toast(k.n==='Chicken'?'🐔 bawk':k.n==='Cow'?'🐮 moo':'🐷 oink',900)}});
 mobs.add(mob);return mob}
function kill(m){const p=m.g.position;G.inv.drop('raw_meat',m.k.meat,p.x,p.y+.5,p.z);remove(m);G.toast('🥩 '+m.k.n+' dropped raw meat',1200)}
function remove(m){try{m.rm&&m.rm()}catch(e){}G.scene.remove(m.g);mobs.delete(m)}
// ---------- campfires (shared, kept) ----------
const fires=new Map();let fid=0;try{G.net.keepCap&&G.net.keepCap('food',40)}catch(e){}
function mkFire(id,x,y,z){if(fires.has(id))return;const g=new T.Group();
 const logM=new T.MeshLambertMaterial({color:0x6b4423});for(let i=0;i<2;i++){const l=new T.Mesh(new T.BoxGeometry(.9,.15,.15),logM);l.rotation.y=i*1.57;l.position.y=.1;g.add(l)}
 const fl=new T.Mesh(new T.ConeGeometry(.22,.5,6),new T.MeshBasicMaterial({color:0xff8a1f}));fl.position.y=.4;g.add(fl);
 const lt=new T.PointLight(0xffaa55,1.2,9);lt.position.y=.8;g.add(lt);g.position.set(x+.5,y,z+.5);G.scene.add(g);
 const f={id,g,fl,cooking:0};f.rm=G.combat.addTarget({obj:g,radius:.8,name:'Campfire',kind:'campfire',onHit(){},onInteract(){cook(f)}});fires.set(id,f)}
function cook(f){if(f.cooking)return G.toast('🔥 already cooking',900);
 if(!G.inv.count('raw_meat'))return G.toast('🔥 bring raw meat to cook',1200);
 G.inv.remove('raw_meat',1);f.cooking=3;G.toast('🔥 cooking… 3s',1200)}
G.net.on('food',m=>{if(m.k==='fire')mkFire(m.id,m.x,m.y,m.z);else if(m.k==='unfire'){const f=fires.get(m.id);if(f){f.rm&&f.rm();G.scene.remove(f.g);fires.delete(m.id)}}});
G.ui.addButton('🔥','Place campfire',()=>{const h=G.raycast(5);if(!h)return G.toast('Look at the ground to place a campfire',1400);
 const id=G.net.id+'-'+(fid++)+'-'+Date.now()%1e5,x=h.x+h.n[0],y=h.y+h.n[1],z=h.z+h.n[2];
 mkFire(id,x,y,z);G.net.send('food',{k:'fire',id,x,y,z},{keep:1,replace:'fire:'+id,maxAge:6*3600e3});G.toast('🔥 Campfire placed. Press X on it with raw meat',1800)});
// ---------- apple trees: X on leaves shakes them ----------
let shakeCd=0;
G.on('interact',ev=>{if(ev.type!=='block'||!ev.hit||ev.hit.b!==LEAF)return;ev.handled=true;
 if(shakeCd>0)return G.toast('🌳 give it a sec',700);shakeCd=1.2;const h=ev.hit;
 if(Math.random()<.35){G.inv.drop('apple',1,h.x+.5,h.y-.2,h.z+.5);G.toast('🍎 an apple fell!',1000)}else G.toast('🌳 *rustle*',700)});
// ---------- Y slot near a campfire ----------
let rel=null;
G.on('tick',(dt)=>{const p=G.player.pos;shakeCd=Math.max(0,shakeCd-dt);
 spawnT-=dt;if(spawnT<=0){spawnT=6;if(mobs.size<6){const a=Math.random()*6.28,r=14+Math.random()*16;const k=KINDS[(Math.random()*KINDS.length)|0];mkMob(k,p.x+Math.sin(a)*r,p.z+Math.cos(a)*r)}}
 for(const m of [...mobs]){const gp=m.g.position;m.t+=dt;if(m.t>2.5){m.t=0;m.dir+=Math.random()*2-1}
  let sp=.9;if(m.flee>0){m.flee-=dt;sp=3;m.dir=Math.atan2(gp.x-p.x,gp.z-p.z)}
  const nx=gp.x+Math.sin(m.dir)*dt*sp,nz=gp.z+Math.cos(m.dir)*dt*sp,ny=G.world.height(Math.floor(nx),Math.floor(nz))+1;
  if(Math.abs(ny-gp.y)<=1.2){gp.set(nx,gp.y+(ny-gp.y)*Math.min(1,dt*8),nz)}else m.dir+=Math.PI/2;
  m.g.rotation.y=m.dir;if(gp.distanceTo(p)>60)remove(m)}
 let near=null;for(const f of fires.values()){f.fl.scale.y=.8+Math.sin(performance.now()/120+f.g.position.x)*.2;
  if(f.cooking>0){f.cooking-=dt;if(f.cooking<=0){f.cooking=0;const left=G.inv.add('cooked_meat',1);if(left){const q=f.g.position;G.inv.drop('cooked_meat',left,q.x,q.y+.6,q.z)}G.toast('🍖 cooked meat ready!',1200)}}
  if(f.g.position.distanceTo(p)<3)near=f}
 const selFood=G.inv.held&&G.inv.held()&&G.inv.item(G.inv.held().id)?.food;
 if(near&&!rel&&G.state('splat')?.tool!=='splat'&&G.state?.tool!=='splat'){const f=near;rel=G.ui.setUse({icon:'🍖',label:'Cook',onPress(){cook(f)}})}
 else if(!near&&rel){rel();rel=null}});
}}
