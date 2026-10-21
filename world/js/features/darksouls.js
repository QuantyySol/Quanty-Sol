// Dark Souls-style: preset messages on block faces (upvotes), bloodstains replaying a 3s ghost, per-chunk tallies.
const PHRASES=['Try jumping','Hidden path ahead','Beware of fall','Amazing view','Treasure?','Be wary of right','Praise the sun','Visions of blocks...','Try building','Time for crossroads'];
export default{name:'darksouls',init(G){const T=G.THREE,msgs=new Map(),stains=new Map(),tally={};const trail=[];let id=0;
 const ck=(x,z)=>Math.floor(x/16)+','+Math.floor(z/16);const tl=k=>tally[k]||={d:0,m:0};
 function addMsg(m){if(msgs.has(m.id))return;const s=G.label('✉ '+m.text+' 👍'+(m.up||0),'#ffd27a');s.position.set(m.x+.5+m.n[0]*.6,m.y+.5+m.n[1]*.6+.3,m.z+.5+m.n[2]*.6);s.scale.set(2.2,.55,1);G.scene.add(s);msgs.set(m.id,{...m,s});tl(ck(m.x,m.z)).m++}
 function refresh(m){const o=msgs.get(m.id);if(!o)return;o.up=m.up;G.scene.remove(o.s);msgs.delete(m.id);tl(ck(o.x,o.z)).m--;addMsg(o)}
 function addStain(s){if(stains.has(s.id))return;const g=new T.Mesh(new T.CircleGeometry(.45,12),new T.MeshBasicMaterial({color:0xaa0000,transparent:true,opacity:.85}));
  g.rotation.x=-Math.PI/2;g.position.set(s.x,s.y+.02,s.z);G.scene.add(g);stains.set(s.id,{...s,g,cool:0});tl(ck(s.x,s.z)).d++}
 G.ui.button('✉','Write message',()=>{const h=G.raycast();if(!h)return G.toast('Look at a block');G.ui.panel(PHRASES,t=>{const m={id:G.net.id+':'+(id++),x:h.x,y:h.y,z:h.z,n:h.n,text:t,up:0};addMsg(m);G.net.send('souls',{k:'msg',m,keep:1})})});
 G.ui.button('👍','Appraise nearest message',()=>{let best=null,bd=4;for(const o of msgs.values()){const d=o.s.position.distanceTo(G.camera.position);if(d<bd){bd=d;best=o}}
  if(!best)return G.toast('No message nearby');best.up=(best.up||0)+1;refresh(best);G.net.send('souls',{k:'up',m:{id:best.id,up:best.up},keep:1});G.toast('Appraised!')});
 G.net.on('souls',e=>{if(e.k=='msg')addMsg(e.m);if(e.k=='up')refresh(e.m);if(e.k=='stain')addStain(e.s);if(e.k=='hello'&&G.net.isHub){}});
 G.on('tick',(dt,now)=>{const p=G.player.pos;trail.push([p.x,p.y,p.z,G.player.yaw]);if(trail.length>180)trail.shift();
  for(const s of stains.values()){s.cool-=dt;if(s.cool<=0&&Math.hypot(s.x-p.x,s.z-p.z)<1.2&&!s.playing&&s.trail?.length){s.playing=true;s.cool=6;
   const ghost=G.mkAvatar('👻','#cc2222');ghost.g.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.4}});let i=0;
   const iv=setInterval(()=>{const q=s.trail[i++];if(!q){clearInterval(iv);G.scene.remove(ghost.g);s.playing=false;return}ghost.g.position.set(q[0],q[1],q[2]);ghost.g.rotation.y=q[3]},50)}}});
 G.on('death',why=>{const p=G.player.pos;const s={id:G.net.id+':'+(id++),x:+p.x.toFixed(2),y:Math.max(p.y,0),z:+p.z.toFixed(2),trail:trail.filter((_,i)=>i%3==0).slice(-60).map(q=>q.map(v=>+v.toFixed(2)))};addStain(s);G.net.send('souls',{k:'stain',s,keep:1})});
 const prev=G.infoExtra;G.infoExtra=()=>{const t=tally[ck(G.player.pos.x,G.player.pos.z)]||{d:0,m:0};return(prev?prev()+' · ':'')+`☠${t.d} ✉${t.m}`}}}
