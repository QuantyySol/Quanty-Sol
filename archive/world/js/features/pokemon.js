// Pokemon-style: blocky creatures wander; tame one with a throw; it follows you, levels up and helps (mines a matching block when you break one, lights the way at night).
export default{name:'pokemon',init(G){const T=G.THREE;const SPECIES=[['Pebblit',0x9a9a9a,3],['Leafo',0x3fbf3f,7],['Sandee',0xe9cf7a,4],['Flarb',0xff6633,12],['Aquo',0x3a7bd5,5],['Frosty',0xeaf6ff,8]];
 const wild=new Map();let buddy=null;const remoteB=new Map();
 function mk(sp,name){const g=new T.Group();const m=new T.MeshLambertMaterial({color:sp[1]});const b=new T.Mesh(new T.BoxGeometry(.7,.6,.8),m);b.position.y=.4;
  const e=new T.MeshBasicMaterial({color:0});[-.18,.18].forEach(x=>{const eye=new T.Mesh(new T.BoxGeometry(.1,.12,.05),e);eye.position.set(x,.5,-.41);g.add(eye)});
  const ear=new T.Mesh(new T.BoxGeometry(.2,.3,.2),m);ear.position.set(0,.85,0);g.add(b,ear);const l=G.label(name);l.position.y=1.3;l.scale.set(1.6,.4,1);g.add(l);G.scene.add(g);return g}
 function spawn(){const p=G.player.pos;for(let i=0;i<3&&wild.size<6;i++){const a=Math.random()*6.28,d=10+Math.random()*14;const x=Math.floor(p.x+Math.cos(a)*d),z=Math.floor(p.z+Math.sin(a)*d);
  const sp=SPECIES[Math.floor(Math.random()*SPECIES.length)];const y=G.world.height(x,z)+1;if(y<3)continue;const id=Math.random();wild.set(id,{sp,g:mk(sp,'wild '+sp[0]),pos:new T.Vector3(x+.5,y,z+.5),dir:Math.random()*6.28,t:0})}}
 setInterval(spawn,4000);
 G.ui.addButton('🔴','Throw ball: tame nearest creature',()=>{let best=null,bd=6;for(const [id,w] of wild){const d=w.pos.distanceTo(G.player.pos);if(d<bd){bd=d;best=[id,w]}}
  if(!best)return G.toast('No wild creature nearby (look around!)');const [id,w]=best;if(Math.random()<.25){G.toast(w.sp[0]+' broke free!');w.dir+=3;return}
  wild.delete(id);G.scene.remove(w.g);if(buddy)G.scene.remove(buddy.g);buddy={sp:w.sp,lvl:1,xp:0,g:mk(w.sp,'⭐'+w.sp[0]+' Lv1'),pos:w.pos.clone()};G.toast('Gotcha! '+w.sp[0]+' joined you!')});
 G.on('broke',h=>{if(!buddy)return;buddy.xp++;if(buddy.xp>=buddy.lvl*5){buddy.lvl++;buddy.xp=0;G.scene.remove(buddy.g);buddy.g=mk(buddy.sp,'⭐'+buddy.sp[0]+' Lv'+buddy.lvl);G.toast(buddy.sp[0]+' grew to Lv'+buddy.lvl+'!')}
  // helper: mines one adjacent block of the same type
  for(const [dx,dy,dz] of[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]]){if(G.world.getBlock(h.x+dx,h.y+dy,h.z+dz)==h.b){setTimeout(()=>G.world.removeBlock(h.x+dx,h.y+dy,h.z+dz),400);break}}});
 const light=new T.PointLight(0xffdd88,0,12);G.scene.add(light);
 G.net.on('pokemon',()=>{});
 G.on('tick',dt=>{const p=G.player.pos;for(const [id,w] of wild){w.t+=dt;if(w.t>2){w.t=0;w.dir+=Math.random()*2-1}const nx=w.pos.x+Math.sin(w.dir)*dt*1.2,nz=w.pos.z+Math.cos(w.dir)*dt*1.2;
   const y=G.world.height(Math.floor(nx),Math.floor(nz))+1;if(Math.abs(y-w.pos.y)<=1.1){w.pos.set(nx,y,nz)}else w.dir+=2;w.g.position.lerp(w.pos,.2);w.g.rotation.y=w.dir+Math.PI;
   if(w.pos.distanceTo(p)>50){G.scene.remove(w.g);wild.delete(id)}}
  G.player.extra.buddy=buddy?[buddy.sp[0],buddy.lvl,buddy.sp[1]]:null;
  if(buddy){const target=p.clone().add(new T.Vector3(Math.sin(G.player.yaw)*1.5+1,0,Math.cos(G.player.yaw)*1.5));const d=target.clone().sub(buddy.pos);if(d.length()>1)buddy.pos.addScaledVector(d,Math.min(1,dt*3));
   buddy.pos.y=G.world.height(Math.floor(buddy.pos.x),Math.floor(buddy.pos.z))+1;if(buddy.pos.distanceTo(p)>20)buddy.pos.copy(p);buddy.g.position.lerp(buddy.pos,.3);buddy.g.lookAt(p.x,buddy.g.position.y,p.z);buddy.g.rotateY(Math.PI);
   light.position.copy(buddy.pos).add(new T.Vector3(0,1.5,0));light.intensity=G.isNight()?3:0}
  // show other players' buddies
  for(const [pid,o] of G.others){const b=o.target?.ex?.buddy;let rb=remoteB.get(pid);if(b&&!rb){rb=mk([b[0],b[2]],b[0]+' Lv'+b[1]);remoteB.set(pid,rb)}if(!b&&rb){G.scene.remove(rb);remoteB.delete(pid)}
   if(rb){rb.position.lerp(o.g.position.clone().add(new T.Vector3(1,0,1)),.1)}}
  for(const [pid,rb] of remoteB)if(!G.others.has(pid)){G.scene.remove(rb);remoteB.delete(pid)}})}}
