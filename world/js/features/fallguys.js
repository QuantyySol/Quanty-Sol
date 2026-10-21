// Fall Guys-style pop-up races: build a block course (spinners, bouncy pads, slime), call a race, everyone nearby joins.
// Checkpoints respawn you instead of eliminating, live placings ride in player.extra, podium at the end.
export default{name:'fallguys',init(G){const T=G.THREE;const spinners=new Map(),slimes=[];let cid=0,race=null,call=null;
 const hud=document.createElement('div');hud.style.cssText='position:fixed;top:96px;left:50%;transform:translateX(-50%);font:800 22px system-ui,sans-serif;color:#ffd23f;text-shadow:2px 2px 0 #000;z-index:6;text-align:center;pointer-events:none;white-space:nowrap';document.body.appendChild(hud);
 const best=()=>+localStorage.bvBestRace||0;
 function addSpinner(s){if(spinners.has(s.id))return;const g=new T.Group();const bar=new T.Mesh(new T.BoxGeometry(7,.5,.5),new T.MeshLambertMaterial({color:0xff7b00}));bar.position.y=.8;
  const post=new T.Mesh(new T.CylinderGeometry(.25,.25,1),new T.MeshLambertMaterial({color:0x8844ff}));post.position.y=.5;g.add(bar,post);g.position.set(s.x+.5,s.y+1,s.z+.5);G.scene.add(g);spinners.set(s.id,{...s,g})}
 function addSlime(z){if(slimes.some(q=>q.id==z.id))return;const m=new T.Mesh(new T.BoxGeometry(z.w,.08,z.d),new T.MeshBasicMaterial({color:0x7dff4a,transparent:true,opacity:.55}));
  m.position.set(z.cx,z.y+1.04,z.cz);m.rotation.y=z.rot;G.scene.add(m);slimes.push({...z,m})}
 function pad(x,y,z){if(G.ultrahand&&G.ultrahand.springPad){try{G.ultrahand.springPad(x,y,z,{power:16});return}catch(e){}}G.world.placeBlock(x,y,z,11)}
 function share(k,o){G.net.send('fallguys',{k,...o,keep:1})}
 G.ui.addButton('🌀','Place spinner',()=>{const h=G.raycast(8);if(!h)return G.toast('Aim at ground');const s={id:G.net.id+':'+(cid++),x:h.x,y:h.y,z:h.z,sp:1.5+Math.random()};addSpinner(s);share('spin',{s})});
 G.ui.addButton('🏗️','Build race course',()=>{const me=G.player,f=new T.Vector3(-Math.sin(me.yaw),0,-Math.cos(me.yaw)),r=new T.Vector3(f.z,0,-f.x);const y=Math.floor(me.pos.y)+3,o=me.pos.clone();
  const P=(i,j)=>[Math.floor(o.x+f.x*i+r.x*j),Math.floor(o.z+f.z*i+r.z*j)];
  for(let i=2;i<=42;i++)for(let j=-3;j<=3;j++){if(i%10>6&&i>5&&i<38&&Math.abs(j)<3)continue;const [x,z]=P(i,j);const isPad=(i%10==6)&&Math.abs(j)<3;
   if(isPad){pad(x,y,z);continue}G.world.placeBlock(x,y,z,i<=3?13:i>=41?12:(i==10||i==20||i==30)?12:(Math.abs(j)==3?10:9))}
  [12,22,32].forEach(i=>{const [x,z]=P(i,0);const s={id:G.net.id+':'+(cid++),x,y,z,sp:2};addSpinner(s);share('spin',{s})});
  [15,25,35].forEach(i=>{const [x,z]=P(i+.5,0);const sl={id:G.net.id+':'+(cid++),cx:x+.5,cz:z+.5,y,w:6,d:2.5,rot:me.yaw,fx:f.x,fz:f.z};addSlime(sl);share('slime',{sl})});
  const cps=[2,10,20,30].map(i=>P(i,0));const [fx,fz]=P(41,0);
  G.setState('fallguys',{course:{cps,fx,fz,y,len:41,ox:o.x,oz:o.z,dx:f.x,dz:f.z}});G.toast('Course built! Tap 🏁 to call a race.')});
 G.ui.addButton('🏁','Call a race',()=>{const c=course();if(!c)return G.toast('Build a course first 🏗️');const id=G.net.id+':'+Date.now();G.net.send('fallguys',{k:'call',id,by:G.name||'player'});onCall({id,by:G.name},true)});
 function course(){return(G.state('fallguys')||{}).course}
 function progress(p,c){return Math.max(0,(p.x-c.ox)*c.dx+(p.z-c.oz)*c.dz)}
 function onCall(m,mine){const c=course();if(!c||race)return;const [sx,sz]=c.cps[0];const p=G.player.pos;
  if(!mine&&Math.hypot(p.x-sx,p.z-sz)>60){G.toast('🏁 '+m.by+' called a race! Get near the start to join');return}
  call={id:m.id,end:performance.now()+5000};G.player.pos.set(sx+.5+(Math.random()*4-2),c.y+2,sz+.5);G.player.vel.set(0,0,0);G.pauseInput()}
 G.net.on('fallguys',m=>{if(m.k=='spin')addSpinner(m.s);else if(m.k=='slime')addSlime(m.sl);else if(m.k=='call')onCall(m,false);
  else if(m.k=='fin'&&race&&m.rid==race.id){race.fins.push(m);G.toast((m.place==1?'🥇':m.place==2?'🥈':m.place==3?'🥉':'🏅')+' '+m.name+' '+m.t+'s')}});
 G.on('tick',(dt,now)=>{const t=now/1000,p=G.player.pos;
  for(const s of spinners.values()){s.g.rotation.y=t*s.sp;
   if(Math.abs(p.y-(s.y+1))<1.6&&Math.hypot(p.x-s.g.position.x,p.z-s.g.position.z)<3.6){const a=s.g.rotation.y,dir=new T.Vector3(Math.cos(a),0,-Math.sin(a));
    const rel=new T.Vector3(p.x-s.g.position.x,0,p.z-s.g.position.z);const along=rel.dot(dir),perp=rel.clone().sub(dir.clone().multiplyScalar(along)).length();
    if(perp<.6){const push=new T.Vector3(-dir.z,0,dir.x).multiplyScalar(Math.sign(along)*10);push.y=6;G.player.vel.add(push);G.player.fallStart=null}}}
  let onSlime=false;for(const s of slimes){const rx=p.x-s.cx,rz=p.z-s.cz,c=Math.cos(s.rot),sn=Math.sin(s.rot);const lx=rx*c-rz*sn,lz=rx*sn+rz*c;
   if(Math.abs(lx)<s.w/2&&Math.abs(lz)<s.d/2&&Math.abs(p.y-s.y-1)<1.2){onSlime=true;break}}
  if(onSlime&&!G.player._fgSlow){G.player._fgSlow=G.player.speedMul;G.player.speedMul*=.5}else if(!onSlime&&G.player._fgSlow){G.player.speedMul=G.player._fgSlow;G.player._fgSlow=0}
  const c=course();if(!c){hud.textContent='';return}
  if(call){const left=Math.ceil((call.end-now)/1000);hud.textContent=left>0?'Race starts in '+left+'…':'GO! 🏃';
   if(now>=call.end){G.resumeInput();race={id:call.id,t0:now,cp:0,fins:[],done:false};call=null}}
  if(race&&!race.done){const el=((now-race.t0)/1000);const d=progress(p,c);
   c.cps.forEach(([x,z],i)=>{if(i>race.cp&&Math.hypot(p.x-x-.5,p.z-z-.5)<3.5&&Math.abs(p.y-c.y-1)<1.5){race.cp=i;G.toast('Checkpoint '+i+' ✅',900)}});
   G.player.extra.fg={r:race.id,d:+d.toFixed(1)};
   let ahead=0,n=1;for(const o of G.others.values()){const fg=o.target&&o.target.ex&&o.target.ex.fg;if(fg&&fg.r==race.id){n++;if(fg.d>d||fg.fin)ahead++}}
   hud.textContent='⏱ '+el.toFixed(1)+'s · P'+(ahead+1)+'/'+n;
   if(Math.hypot(p.x-c.fx-.5,p.z-c.fz-.5)<4&&Math.abs(p.y-c.y-1)<1.5){const place=race.fins.length+1,tt=el.toFixed(1);race.done=true;G.player.extra.fg={r:race.id,d:999,fin:1};
    G.net.send('fallguys',{k:'fin',rid:race.id,name:G.name||'player',t:tt,place});
    G.toast((place==1?'🥇 Winner! ':'🏆 Qualified! P'+place+' ')+tt+'s'+(!best()||el<best()?' · new best':''),3000);if(!best()||el<best())localStorage.bvBestRace=el.toFixed(1);
    setTimeout(()=>{hud.textContent='';delete G.player.extra.fg;race=null},4000)}
   if(p.y<c.y-6){const [x,z]=c.cps[race.cp];p.set(x+.5,c.y+2,z+.5);G.player.vel.set(0,0,0);G.player.fallStart=null;G.toast('Oof! Back to checkpoint '+race.cp,900)}
   if(el>180){G.toast('Race timed out');hud.textContent='';delete G.player.extra.fg;race=null}}
  else if(!race&&!call)hud.textContent=''});
 const prev=G.infoExtra;G.infoExtra=()=>(prev?prev():'')+(best()?' · 🏁 best '+best()+'s':'')}}
