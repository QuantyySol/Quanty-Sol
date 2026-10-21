// Zelda TotK Ultrahand-style: grab & glue blocks plus wheels/fans/springs/rockets into a rideable contraption; Launch; despawns unattended.
export default{name:'ultrahand',init(G){const T=G.THREE,B=G.BLOCKS;let build=null;const rigs=new Map();let rid=0;
 const PART={wheel:[0x222222,'🛞'],fan:[0xdddddd,'🌀'],spring:[0x66ff66,'🌱'],rocket:[0xff5533,'🚀']};
 function mkRig(r){const g=new T.Group();r.cells.forEach(c=>{const m=new T.Mesh(c.part=='wheel'?new T.CylinderGeometry(.45,.45,.3,12).rotateZ(Math.PI/2):new T.BoxGeometry(.98,.98,.98),new T.MeshLambertMaterial({color:c.part?PART[c.part][0]:B[c.b].c}));m.position.set(c.x,c.y,c.z);g.add(m)});
  g.position.fromArray(r.p);g.rotation.y=r.yaw||0;G.scene.add(g);return{...r,g,vel:new T.Vector3(),idle:0}}
 function startBuild(){const p=G.player.pos;build={id:G.net.id+':'+(rid++),cells:[],p:[Math.floor(p.x)+.5,Math.floor(p.y)+.5,Math.floor(p.z)+.5],yaw:0};}
 G.ui.button('✋','Ultrahand: grab block into contraption',()=>{const h=G.raycast();if(!h)return G.toast('Aim at a block');if(!build)startBuild();
  const o=build.cells.length;const c={x:o%3-1,y:Math.floor(o/9),z:Math.floor(o/3)%3-1,b:h.b};build.cells.push(c);G.world.set(h.x,h.y,h.z,0);preview();G.toast('Glued '+B[h.b].n+' ('+build.cells.length+')',700)});
 const pb=G.ui.button('🔧','Add part',()=>{if(!build)startBuild();G.ui.panel(Object.entries(PART).map(e=>e[0]).map(k=>PART[k][1]+' '+k),s=>{const part=s.split(' ')[1];const o=build.cells.length;
  const nw=build.cells.filter(c=>c.part=='wheel').length;const W=[[-1.6,-1],[1.6,-1],[-1.6,1],[1.6,1]][nw%4];build.cells.push(part=='wheel'?{x:W[0],y:0,z:W[1],part,b:3}:part=='spring'?{x:0,y:-1,z:0,part,b:3}:{x:0,y:0,z:1.6+build.cells.filter(c=>c.part==part).length,part,b:3});preview()})});
 let pv=null;function preview(){if(pv)G.scene.remove(pv.g);const p=G.player.pos,f=new T.Vector3(-Math.sin(G.player.yaw),0,-Math.cos(G.player.yaw));
  build.p=[p.x+f.x*3,Math.floor(p.y)+.5,p.z+f.z*3];build.yaw=G.player.yaw;pv=mkRig(build);pv.g.traverse(o=>{if(o.material){o.material.transparent=true;o.material.opacity=.6}})}
 G.ui.button('🚀','Launch contraption',()=>{if(!build||!build.cells.length)return G.toast('Grab blocks first ✋');if(pv)G.scene.remove(pv.g);pv=null;preview();G.scene.remove(pv.g);pv=null;
  const r=mkRig(build);r.owner=G.net.id;rigs.set(r.id,r);G.net.send({t:'uh',k:'new',r:{id:r.id,cells:r.cells,p:r.p,yaw:r.yaw}});build=null;G.toast('Launched! Stand on it to ride.')});
 G.net.on('uh',e=>{if(e.k=='new'&&!rigs.has(e.r.id))rigs.set(e.r.id,mkRig(e.r));const r=rigs.get(e.id||e.r?.id);if(!r)return;if(e.k=='pos'){r.g.position.fromArray(e.p);r.g.rotation.y=e.yaw}if(e.k=='gone'){G.scene.remove(r.g);rigs.delete(r.id)}});
 let st=0;G.on('tick',dt=>{st+=dt;const send=st>.1;if(send)st=0;const pp=G.player.pos;
  for(const r of rigs.values()){const fwd=new T.Vector3(-Math.sin(r.g.rotation.y),0,-Math.cos(r.g.rotation.y));const n=k=>r.cells.filter(c=>c.part==k).length;
   const local=new T.Vector3(pp.x-r.g.position.x,pp.y-r.g.position.y,pp.z-r.g.position.z).applyAxisAngle(new T.Vector3(0,1,0),-r.g.rotation.y);
   const riding=r.cells.some(c=>Math.abs(local.x-c.x)<.8&&Math.abs(local.z-c.z)<.8&&local.y>c.y&&local.y<c.y+1.3);
   r.idle=riding||Math.hypot(local.x,local.z)<8?0:r.idle+dt;
   if(r.owner==G.net.id){const thrust=n('wheel')*3+n('fan')*4+n('rocket')*9;r.vel.addScaledVector(fwd,thrust*dt*.4);r.vel.multiplyScalar(1-dt*.8);
    if(riding){r.g.rotation.y+=G.input.s*-dt*1.5}
    r.vel.y+=n('rocket')*dt*1.5+n('fan')*dt*.8-14*dt;const gy=G.world.height(Math.floor(r.g.position.x),Math.floor(r.g.position.z))+1.5;
    const old=r.g.position.clone();r.g.position.addScaledVector(r.vel,dt);if(r.g.position.y<gy){r.g.position.y=gy;r.vel.y=n('spring')?9:0}
    if(riding){G.player.pos.add(r.g.position.clone().sub(old));G.player.vel.y=Math.max(G.player.vel.y,0);G.player.fallStart=null}
    if(send)G.net.send({t:'uh',k:'pos',id:r.id,p:r.g.position.toArray().map(v=>+v.toFixed(2)),yaw:+r.g.rotation.y.toFixed(2)});
    if(r.idle>45){G.scene.remove(r.g);rigs.delete(r.id);G.net.send({t:'uh',k:'gone',id:r.id})}}}})}}
