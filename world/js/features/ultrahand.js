// Ultrahand (Zelda: Tears of the Kingdom style) for Blockverse.io. Owner: Launcher.
// Touch: tap ✋ to enter Ultrahand mode. Hold on a block (~0.35s) to grab it; one-finger drag moves it;
// two-finger twist rotates it (90° snaps); tap to glue it onto your contraption (first glue starts one).
// 🔧 adds a part (wheel, fan, spring, rocket) to your hand. 🚀 LAUNCH fires rockets + springs of the contraption
// you ride or built. Ride: stand on it; the stick drives (wheels), jump = fan lift. Desktop: G grab/glue, Q/E rotate,
// R/F nudge held piece up/down, L launch. Contraptions sync via G.net 'ultrahand' (keep:1 for late joiners) and
// despawn after ~3 min with nobody near them.
//
// SPRING-PAD HOOK (for fallguys.js or any feature, no edits to this file needed):
//   G.ultrahand.springPad(x,y,z,{power:16,color:0x66ff66})  // places a synced bouncy spring on top of block x,y,z
//   G.ultrahand.removePad(x,y,z)                            // removes it
//   or fire-and-forget: G.emit('ultrahand:pad',x,y,z,{power})
// Players landing on a pad get launched up (vel.y = power) and G emits 'bounce'. Pads are kept for late joiners.
export default{name:'ultrahand',init(G){
 const T=G.THREE,B=G.BLOCKS,F='ultrahand',me=G.player,UP=new T.Vector3(0,1,0);
 const PART={wheel:{c:0x222222,e:'🛞'},fan:{c:0xdddddd,e:'🌀'},spring:{c:0x66ff66,e:'🌱'},rocket:{c:0xff5533,e:'🚀'}};
 const DESPAWN=180,rigs=new Map(),pads=new Map();let seq=0,mode=false,held=null,draft=null,lastNear=null;
 const mat={};const M=c=>mat[c]||=new T.MeshLambertMaterial({color:c});
 function cellMesh(c){const g=new T.Group();
  if(c.part=='wheel'){const m=new T.Mesh(new T.CylinderGeometry(.48,.48,.35,14).rotateZ(Math.PI/2),M(0x222222));const h=new T.Mesh(new T.CylinderGeometry(.18,.18,.37,8).rotateZ(Math.PI/2),M(0xbbbbbb));g.add(m,h);g.userData.wheel=m}
  else if(c.part=='fan'){g.add(new T.Mesh(new T.BoxGeometry(.9,.25,.9),M(0x555555)));const bl=new T.Group();for(let i=0;i<3;i++){const b=new T.Mesh(new T.BoxGeometry(.85,.05,.18),M(0xdddddd));b.rotation.y=i*Math.PI/3;bl.add(b)}bl.position.y=.2;g.add(bl);g.userData.spin=bl}
  else if(c.part=='spring'){for(let i=0;i<4;i++){const t=new T.Mesh(new T.TorusGeometry(.32,.06,6,14).rotateX(Math.PI/2),M(0x66ff66));t.position.y=-.35+i*.2;g.add(t)}const p=new T.Mesh(new T.BoxGeometry(.8,.1,.8),M(0x2e9d2e));p.position.y=.42;g.add(p)}
  else if(c.part=='rocket'){const b=new T.Mesh(new T.CylinderGeometry(.25,.3,.9,10).rotateX(Math.PI/2),M(0xff5533));const n=new T.Mesh(new T.ConeGeometry(.25,.35,10).rotateX(-Math.PI/2),M(0xffffff));n.position.z=-.6;
   const fl=new T.Mesh(new T.ConeGeometry(.2,.6,8).rotateX(Math.PI/2),new T.MeshBasicMaterial({color:0xffaa00}));fl.position.z=.75;fl.visible=false;g.add(b,n,fl);g.userData.flame=fl}
  else g.add(new T.Mesh(new T.BoxGeometry(.98,.98,.98),M(B[c.b]?.c??0x999999)));
  g.position.set(c.x,c.y,c.z);g.rotation.y=(c.r||0)*Math.PI/2;return g}
 // ---- rigs
 function mkRig(d,remote){if(rigs.has(d.id))return rigs.get(d.id);const g=new T.Group();g.position.fromArray(d.p);g.rotation.y=d.yaw||0;G.scene.add(g);
  const r={id:d.id,owner:d.owner,cells:[],g,body:null,idle:0,seen:performance.now(),burn:0,frozen:!!d.frozen,tag:G.label('🛠','#7fffd4')};r.tag.position.y=1.6;r.tag.scale.set(1,.25,1);g.add(r.tag);
  r.body=G.physics.add({pos:g.position.clone(),radius:.5,bounce:.15,gravity:20,drag:.6,mesh:g});r.body.frozen=remote||r.frozen;
  (d.cells||[]).forEach(c=>addCell(r,c));rigs.set(r.id,r);return r}
 function addCell(r,c){if(r.cells.some(o=>o.x==c.x&&o.y==c.y&&o.z==c.z))return;r.cells.push(c);const m=cellMesh(c);c.m=m;r.g.add(m)}
 const n=(r,k)=>r.cells.filter(c=>c.part==k).length;
 const pack=c=>({x:c.x,y:c.y,z:c.z,b:c.b,part:c.part,r:c.r});
 function killRig(r,remote){G.scene.remove(r.g);G.physics.remove(r.body);rigs.delete(r.id);if(draft===r)draft=null;if(!remote)G.net.send(F,{k:'gone',id:r.id,keep:1})}
 function mine(r){return r.owner==G.net.id}
 // ---- held piece (floats in front of the camera)
 const fwd=()=>{const d=new T.Vector3();G.camera.getWorldDirection(d);return d};
 function holdPiece(c){if(held)dropHeld();held={c,dist:3,off:new T.Vector2(),rot:c.r||0,m:cellMesh({...c,x:0,y:0,z:0})};held.m.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.75}});G.scene.add(held.m);setHint()}
 function heldPos(){const f=fwd(),r=new T.Vector3().crossVectors(f,UP).normalize(),u=new T.Vector3().crossVectors(r,f);
  return G.camera.position.clone().addScaledVector(f,held.dist).addScaledVector(r,held.off.x).addScaledVector(u,held.off.y)}
 function dropHeld(){if(!held)return;G.scene.remove(held.m);
  if(!held.c.part){const p=heldPos().floor();if(!G.world.solid(G.world.getBlock(p.x,p.y,p.z)))G.world.placeBlock(p.x,p.y,p.z,held.c.b)}held=null;setHint()}
 function grab(){const h=G.raycast(8);if(!h){G.toast('Aim at a block');return}if(B[h.b]?.liquid)return;G.world.removeBlock(h.x,h.y,h.z);holdPiece({b:h.b});held.dist=Math.max(2,Math.min(5,h.dist));G.toast('✋ Grabbed '+B[h.b].n+' · tap to glue',1200)}
 function glue(){if(!held)return grab();const wp=heldPos();
  if(!draft||!rigs.has(draft.id)){const p=[Math.floor(wp.x)+.5,Math.floor(wp.y)+.5,Math.floor(wp.z)+.5];
   draft=mkRig({id:G.net.id+':'+Date.now().toString(36)+(seq++),owner:G.net.id,p,yaw:0,frozen:true,cells:[]});G.net.send(F,{k:'new',r:{id:draft.id,owner:draft.owner,p,yaw:0,frozen:true,cells:[]},keep:1})}
  const l=draft.g.worldToLocal(wp.clone());let c={...held.c,x:Math.round(l.x),y:Math.round(l.y),z:Math.round(l.z),r:held.rot};
  while(draft.cells.some(o=>o.x==c.x&&o.y==c.y&&o.z==c.z))c.y++;
  addCell(draft,c);G.net.send(F,{k:'cell',id:draft.id,c:pack(c),keep:1});G.scene.remove(held.m);held=null;
  G.toast('🔗 Glued ('+draft.cells.length+' pieces)'+(draft.cells.length==1?' · keep gluing, then 🚀':''),1100);setHint()}
 // ---- touch capture (hold=grab, drag=move, twist=rotate, tap=glue); chains with any existing G.capture
 const prev=G.capture,pts=new Map();let holdT=null,tap=null,twist=null;
 G.capture={down(e){if(!mode)return prev?.down(e);if(e.pointerType=='mouse'&&document.pointerLockElement!=G.renderer.domElement)return prev?.down(e)||false;
   if(e.pointerType=='mouse'){glue();return true}
   pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pts.size==1){tap={x:e.clientX,y:e.clientY,t:performance.now(),moved:false};if(!held)holdT=setTimeout(()=>{holdT=null;if(tap&&!tap.moved){tap=null;grab()}},350)}
   if(pts.size==2){clearTimeout(holdT);tap=null;const [a,b]=[...pts.values()];twist={a0:Math.atan2(b.y-a.y,b.x-a.x),r0:held?.rot||0}}return true},
  move(e){if(!mode||!pts.has(e.pointerId))return prev?.move(e);const p=pts.get(e.pointerId),dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
   if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>12){tap.moved=true;clearTimeout(holdT)}
   if(pts.size==2&&twist){const [a,b]=[...pts.values()];const da=Math.atan2(b.y-a.y,b.x-a.x)-twist.a0;if(held)held.rot=twist.r0+Math.round(da/(Math.PI/2))}
   else if(held){held.off.x=Math.max(-2.5,Math.min(2.5,held.off.x+dx*.012));held.off.y=Math.max(-2,Math.min(2.5,held.off.y-dy*.012))}
   else{me.yaw-=dx*.006;me.pitch=Math.max(-1.5,Math.min(1.5,me.pitch-dy*.006))}return true},
  up(e){if(!mode||!pts.has(e.pointerId))return prev?.up(e);pts.delete(e.pointerId);clearTimeout(holdT);if(pts.size<2)twist=null;
   if(tap&&!tap.moved&&performance.now()-tap.t<350&&held)glue();tap=null;return true}};
 // ---- UI
 const hint=document.createElement('div');hint.style.cssText='position:fixed;left:50%;bottom:calc(215px + env(safe-area-inset-bottom));transform:translateX(-50%);font:600 13px system-ui,sans-serif;color:#7fffd4;background:rgba(0,20,30,.6);padding:4px 10px;border-radius:10px;pointer-events:none;z-index:6;display:none;text-align:center;max-width:90vw';document.body.appendChild(hint);
 function setHint(){hint.style.display=mode?'block':'none';hint.textContent=held?'drag = move · twist = rotate · tap = glue':'hold a block to grab · 🔧 for parts · 🚀 launch'}
 const mb=G.ui.addButton('✋','Ultrahand mode (G)',()=>toggle());
 function toggle(){mode=!mode;mb.style.outline=mode?'3px solid #7fffd4':'';mb.style.boxShadow=mode?'0 0 14px #7fffd4':'';if(!mode){dropHeld();pts.clear()}setHint();G.toast(mode?'✋ Ultrahand on':'Ultrahand off',900)}
 G.ui.addButton('🔧','Ultrahand: add a part',()=>G.ui.panel(Object.keys(PART).map(k=>PART[k].e+' '+k),s=>{if(!mode)toggle();holdPiece({b:3,part:s.split(' ')[1]});held.dist=2.5}));
 const lb=document.createElement('button');lb.textContent='🚀 LAUNCH';lb.title='Fire rockets and springs (L)';
 lb.style.cssText='position:fixed;right:calc(64px + env(safe-area-inset-right));bottom:calc(150px + env(safe-area-inset-bottom));z-index:7;font:800 16px system-ui,sans-serif;padding:14px 18px;border-radius:16px;border:2px solid #ffb347;background:linear-gradient(135deg,#ff5533,#ff9a2a);color:#fff;box-shadow:0 0 16px rgba(255,120,40,.7);display:none;touch-action:none';
 lb.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();launch()});document.body.appendChild(lb);
 function nearest(){let best=null,bd=12;for(const r of rigs.values()){const d=r.g.position.distanceTo(me.pos);if(d<bd){bd=d;best=r}}return best}
 function launch(){const r=(draft&&rigs.has(draft.id))?draft:nearest();if(!r||!r.cells.length)return G.toast('Glue a contraption first ✋');
  if(!mine(r))claim(r);if(r===draft)draft=null;r.frozen=false;r.body.frozen=false;
  const f=new T.Vector3(-Math.sin(me.yaw),0,-Math.cos(me.yaw));const ro=n(r,'rocket'),sp=n(r,'spring');
  if(sp)r.body.vel.y=Math.max(r.body.vel.y,8+sp*3);if(ro){r.burn=2.2;r.dir=f.toArray()}if(!ro&&!sp)r.body.vel.addScaledVector(f,3);
  G.net.send(F,{k:'fire',id:r.id,burn:r.burn,dir:r.dir});G.toast(ro||sp?'🚀 LAUNCH!':'Released! Add 🚀 or 🌱 for lift-off',1000);G.emit('bounce')}
 function claim(r){r.owner=G.net.id;r.body.frozen=r.frozen;r.body.pos.copy(r.g.position);G.net.send(F,{k:'own',id:r.id})}
 G.on('kbd',k=>{if(k=='g'){if(!mode)toggle();else glue()}if(k=='l')launch();if(held){if(k=='q')held.rot--;if(k=='e')held.rot++;if(k=='r')held.off.y+=.5;if(k=='f')held.off.y-=.5}if(k=='Escape'&&mode)toggle()});
 // ---- network
 G.net.on(F,m=>{const r=rigs.get(m.id||m.r?.id);
  if(m.k=='new'){mkRig(m.r,true);return}if(m.k=='pad'){m.off?removePad(m.x,m.y,m.z,true):springPad(m.x,m.y,m.z,m.o,true);return}if(!r)return;r.seen=performance.now();
  if(m.k=='cell')addCell(r,m.c);
  else if(m.k=='pos'){r.tp=new T.Vector3().fromArray(m.p);r.tyaw=m.yaw;r.frozen=!!m.fz;if(m.b!==undefined)r.burn=m.b}
  else if(m.k=='own'){r.owner=m.from;r.body.frozen=true}
  else if(m.k=='fire'){r.burn=m.burn||0;r.frozen=false}
  else if(m.k=='gone')killRig(r,true)});
 // ---- spring pads (public hook)
 function springPad(x,y,z,o={},remote){x|=0;y|=0;z|=0;const k=x+','+y+','+z;if(pads.has(k))return pads.get(k);const m=cellMesh({part:'spring',x:x+.5,y:y+1.45,z:z+.5});
  if(o.color)m.traverse(q=>{if(q.material&&q.geometry?.type=='TorusGeometry')q.material=M(o.color)});G.scene.add(m);const p={x,y,z,power:o.power||16,m,t:0};pads.set(k,p);
  if(!remote)G.net.send(F,{k:'pad',x,y,z,o:{power:p.power,color:o.color},keep:1});return p}
 function removePad(x,y,z,remote){const k=(x|0)+','+(y|0)+','+(z|0),p=pads.get(k);if(!p)return;G.scene.remove(p.m);pads.delete(k);if(!remote)G.net.send(F,{k:'pad',x,y,z,off:1,keep:1})}
 G.on('ultrahand:pad',(x,y,z,o)=>springPad(x,y,z,o));
 G.ultrahand={springPad:(x,y,z,o)=>springPad(x,y,z,o),removePad:(x,y,z)=>removePad(x,y,z),rigs,pads,PART,
  _test:{build(cells,p){const r=mkRig({id:G.net.id+':t'+(seq++),owner:G.net.id,p,yaw:0,frozen:true,cells:[]});G.net.send(F,{k:'new',r:{id:r.id,owner:r.owner,p,yaw:0,frozen:true,cells:[]},keep:1});
   cells.forEach(c=>{addCell(r,c);G.net.send(F,{k:'cell',id:r.id,c:pack(c),keep:1})});draft=r;return r.id},launch,toggle,grab,glue,holdPiece}};
 // ---- per-frame
 let st=0;const tmp=new T.Vector3();
 G.on('tick',(dt,now)=>{st+=dt;const send=st>.12;if(send)st=0;const pp=me.pos;
  if(held){held.m.position.copy(heldPos());held.m.rotation.y=held.rot*Math.PI/2}
  for(const p of pads.values()){p.t=Math.max(0,p.t-dt);p.m.scale.y=1-p.t*1.5;
   if(Math.abs(pp.x-p.x-.5)<.6&&Math.abs(pp.z-p.z-.5)<.6&&pp.y>p.y+.9&&pp.y<p.y+2.1&&me.vel.y<=.5){me.vel.y=p.power;me.onGround=false;me.fallStart=null;p.t=.25;G.emit('bounce')}}
  let riding=null;lb.style.display=(mode||rigs.size)&&(draft||nearest())?'block':'none';
  for(const r of rigs.values()){const g=r.g;
   const loc=g.worldToLocal(tmp.copy(pp));
   const on=r.cells.find(c=>Math.abs(loc.x-c.x)<.75&&Math.abs(loc.z-c.z)<.75&&loc.y>c.y+.2&&loc.y<c.y+1.4);
   if(on&&!riding)riding={r,c:on};
   let near=false;if(g.position.distanceTo(pp)<10)near=true;else for(const o of G.others.values())if(o.target&&Math.hypot(o.target.x-g.position.x,o.target.z-g.position.z)<10){near=true;break}
   r.idle=near?0:r.idle+dt;
   g.traverse(o=>{if(o.userData.spin)o.userData.spin.rotation.y+=dt*12;if(o.userData.flame)o.userData.flame.visible=r.burn>0});r.burn=Math.max(0,r.burn-dt);
   if(mine(r)){const b=r.body;b.frozen=r.frozen;
    if(!r.frozen){const f=new T.Vector3(-Math.sin(g.rotation.y),0,-Math.cos(g.rotation.y));
     if(r.burn>0){const d=r.dir?new T.Vector3().fromArray(r.dir):f;b.vel.addScaledVector(d,n(r,'rocket')*14*dt);b.vel.y+=n(r,'rocket')*16*dt}
     if(on&&!G.inputPaused){const w=n(r,'wheel');if(w){b.vel.addScaledVector(new T.Vector3(-Math.sin(me.yaw),0,-Math.cos(me.yaw)),G.input.f*w*6*dt);g.rotation.y+=(me.yaw-g.rotation.y)*Math.min(1,dt*3)}
      if(n(r,'fan')&&G.input.jump)b.vel.y+=n(r,'fan')*26*dt}
     if(n(r,'spring')&&b.onGround&&b.vel.y<=.5&&r.burn<=0)b.vel.y=7+n(r,'spring');
     b.onGround=false;b.vel.y=Math.min(b.vel.y,30)}
    if(r.idle>DESPAWN||g.position.y<-30){killRig(r);G.toast('An unattended contraption despawned',1200);continue}
    if(send&&(!r.frozen||!r.sentFrozen)){r.sentFrozen=r.frozen;G.net.send(F,{k:'pos',id:r.id,p:g.position.toArray().map(v=>+v.toFixed(2)),yaw:+g.rotation.y.toFixed(2),fz:r.frozen?1:0,b:+r.burn.toFixed(1)})}}
   else{if(r.tp){g.position.lerp(r.tp,Math.min(1,dt*10));g.rotation.y+=(r.tyaw-g.rotation.y)*Math.min(1,dt*10);r.body.pos.copy(g.position)}
    if(performance.now()-r.seen>DESPAWN*1000&&r.idle>DESPAWN)killRig(r,true)}}
  // ride: carry the player with the contraption
  if(riding){const {r,c}=riding;const top=r.g.localToWorld(new T.Vector3(c.x,c.y+.5,c.z)).y;
   if(lastNear&&lastNear.r===r){me.pos.add(tmp.copy(r.g.position).sub(lastNear.p))}
   if(me.pos.y<top+.02){me.pos.y=top+.02;if(me.vel.y<0)me.vel.y=0;me.onGround=true}me.fallStart=null;
   if(!mine(r)&&!r.frozen&&(G.input.f||G.input.jump))claim(r);lastNear={r,p:r.g.position.clone()}}else lastNear=null});
 const pi=G.infoExtra;G.infoExtra=()=>{const s=pi?pi():'';const x=rigs.size?'🛠 '+rigs.size:'';return s&&x?s+' · '+x:s||x};
}};
export function springPad(x,y,z,o){return window.G?.ultrahand?.springPad(x,y,z,o)}
