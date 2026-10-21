// Fall Guys-style: build an obstacle race course with spinners and bouncy pads; start gate, finish line, timer and best times.
export default{name:'fallguys',init(G){const T=G.THREE;const spinners=new Map();let race=null,cid=0;
 const tm=document.createElement('div');tm.style.cssText='position:fixed;top:100px;left:50%;transform:translateX(-50%);font:bold 22px sans-serif;color:#ffd23f;text-shadow:2px 2px 0 #000;z-index:6';document.body.appendChild(tm);
 function addSpinner(s){if(spinners.has(s.id))return;const g=new T.Group();const bar=new T.Mesh(new T.BoxGeometry(7,.5,.5),new T.MeshLambertMaterial({color:0xff7b00}));bar.position.y=.8;
  const post=new T.Mesh(new T.CylinderGeometry(.25,.25,1),new T.MeshLambertMaterial({color:0x8844ff}));post.position.y=.5;g.add(bar,post);g.position.set(s.x+.5,s.y+1,s.z+.5);G.scene.add(g);spinners.set(s.id,{...s,g})}
 G.ui.addButton('🌀','Place spinner',()=>{const h=G.raycast();if(!h)return G.toast('Aim at ground');const s={id:G.net.id+':'+(cid++),x:h.x,y:h.y,z:h.z,sp:1.5+Math.random()};addSpinner(s);G.net.send('fallguys',{k:'spin',s,keep:1})});
 G.ui.addButton('🏁','Build race course',()=>{const me=G.player,f=new T.Vector3(-Math.sin(me.yaw),0,-Math.cos(me.yaw)),r=new T.Vector3(f.z,0,-f.x);const y=Math.floor(me.pos.y)+3,o=me.pos.clone();
  const P=(i,j)=>[Math.floor(o.x+f.x*i+r.x*j),Math.floor(o.z+f.z*i+r.z*j)];
  for(let i=2;i<=42;i++)for(let j=-3;j<=3;j++){if(i%10>6&&i>5&&i<38&&Math.abs(j)<3)continue;const [x,z]=P(i,j);const pad=(i%10==6)&&Math.abs(j)<3;G.world.placeBlock(x,y,z,i<=3?13:i>=41?12:pad?11:(Math.abs(j)==3?10:9))}
  [12,22,32].forEach(i=>{const [x,z]=P(i,0);const s={id:G.net.id+':'+(cid++),x,y,z,sp:2};addSpinner(s);G.net.send('fallguys',{k:'spin',s,keep:1})});
  const [sx,sz]=P(2,0),[fx,fz]=P(41,0);G.setState('fallguys',{course:{sx,sz,fx,fz,y}});G.toast('Course built! Step on the red start line.')});
 G.net.on('fallguys',m=>{if(m.k=='spin')addSpinner(m.s);if(m.k=='win')G.toast('🏆 '+m.name+' finished in '+m.t+'s')});
 const best=+localStorage.bvBestRace||0;
 G.on('tick',(dt,now)=>{const t=now/1000,p=G.player.pos;for(const s of spinners.values()){s.g.rotation.y=t*s.sp;
   if(Math.abs(p.y-(s.y+1))<1.6&&Math.hypot(p.x-s.g.position.x,p.z-s.g.position.z)<3.6){const a=s.g.rotation.y,dir=new T.Vector3(Math.cos(a),0,-Math.sin(a));
    const rel=new T.Vector3(p.x-s.g.position.x,0,p.z-s.g.position.z);const along=rel.dot(dir),perp=rel.clone().sub(dir.clone().multiplyScalar(along)).length();
    if(perp<.6){const push=new T.Vector3(-dir.z,0,dir.x).multiplyScalar(Math.sign(along)*10);push.y=6;G.player.vel.add(push);G.player.fallStart=null}}}
  const c=G.state('fallguys').course;if(!c)return;
  if(!race&&Math.abs(p.x-c.sx-.5)<4&&Math.abs(p.z-c.sz-.5)<4&&Math.abs(p.y-c.y-1)<1){race={t0:now};G.toast('GO! 🏃')}
  if(race){const el=((now-race.t0)/1000).toFixed(1);tm.textContent='⏱ '+el+'s';
   if(Math.hypot(p.x-c.fx-.5,p.z-c.fz-.5)<4&&Math.abs(p.y-c.y-1)<1.5){G.toast('🏆 Qualified! '+el+'s');G.net.send('fallguys',{k:'win',name:G.name,t:el});if(!best||el<best)localStorage.bvBestRace=el;race=null;setTimeout(()=>tm.textContent='',3000)}
   if(p.y<c.y-6){G.toast('Eliminated! Try again');race=null;tm.textContent=''}}})}}
