// Okami Celestial Brush: freeze into ink-wash, draw one-finger gestures. circle=day/night, line=cut, loop(arc)=bridge, spiral=wind. Uses ink meter.
export default{name:'okami',init(G){const T=G.THREE;let ink=1,on=false,pts=[],cv,cx;const inkM=G.ui.meter(34,'#111');
 function open(){if(ink<.2)return G.toast('Not enough ink');on=true;G.frozen=true;G.pauseInput();cv=G.overlay();cx=cv.getContext('2d');cv.style.display='block';cv.style.background='rgba(235,220,180,.45)';cv.style.backdropFilter='grayscale(1) sepia(.6)';
  cx.lineCap='round';cx.lineJoin='round';cx.strokeStyle='#111';cx.lineWidth=10;G.toast('Brush: ◯ day · ― cut · ⌒ bridge · 🌀 wind',2500);
  cv.onpointerdown=e=>{pts=[[e.clientX,e.clientY]];cx.beginPath();cx.moveTo(e.clientX,e.clientY)};
  cv.onpointermove=e=>{if(!pts.length)return;pts.push([e.clientX,e.clientY]);cx.lineTo(e.clientX,e.clientY);cx.stroke()};
  cv.onpointerup=()=>{const p=pts;pts=[];finish(p)}}
 function close(){on=false;G.frozen=false;G.resumeInput();cv.style.display='none';cx.clearRect(0,0,cv.width,cv.height)}
 G.ui.addButton('🖌','Celestial brush (B)',()=>on?close():open());G.on('kbd',c=>{if(c=='b')on?close():open()});
 G.okamiClassify=classify;
 function classify(p){if(p.length<5)return null;let len=0,turn=0,prev=null;for(let i=1;i<p.length;i++){const dx=p[i][0]-p[i-1][0],dy=p[i][1]-p[i-1][1];const l=Math.hypot(dx,dy);if(l<2)continue;len+=l;
   const a=Math.atan2(dy,dx);if(prev!=null){let d=a-prev;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;turn+=d}prev=a}
  const close=Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])/(len||1),t=Math.abs(turn);
  if(t>3.3*Math.PI)return'spiral';if(t>1.5*Math.PI&&close<.3)return'circle';if(t>.6*Math.PI)return'loop';if(len>60)return'line';return null}
 function rayAt(x,y){const rc=new T.Raycaster();rc.setFromCamera(new T.Vector2(x/innerWidth*2-1,-y/innerHeight*2+1),G.camera);const o=rc.ray.origin,d=rc.ray.direction;
  for(let t=0;t<10;t+=.1){const X=Math.floor(o.x+d.x*t),Y=Math.floor(o.y+d.y*t),Z=Math.floor(o.z+d.z*t);if(G.world.solid(G.world.getBlock(X,Y,Z)))return[X,Y,Z]}return null}
 function finish(p){const g=classify(p),me=G.player,f=new T.Vector3(-Math.sin(me.yaw),0,-Math.cos(me.yaw));
  if(!g){G.toast('The brush stroke fades...');return}ink-=.2;
  if(g=='circle'){const night=G.isNight();G.setState('okami',{time:Math.floor(G.time)+(night?0.25:0.75)});G.toast(night?'☀️ Sunrise!':'🌙 Crescent!')}
  if(g=='line'){let n=0;for(let i=0;i<p.length;i+=3){const h=rayAt(...p[i]);if(h&&G.world.getBlock(...h)){G.world.removeBlock(...h);n++}}G.toast('⚔️ Power Slash: '+n+' blocks')}
  if(g=='loop'){const y=Math.floor(me.pos.y)-1;for(let i=1;i<=10;i++){const x=Math.floor(me.pos.x+f.x*i),z=Math.floor(me.pos.z+f.z*i);if(!G.world.getBlock(x,y,z))G.world.placeBlock(x,y,z,9)}G.toast('🌉 Bridge!')}
  if(g=='spiral'){G.pushPlayers(me.pos.clone(),6,f.clone().multiplyScalar(12).add(new T.Vector3(0,9,0)));G.toast('🌀 Galestorm!')}
  setTimeout(close,250)}
 G.on('state:okami',s=>{if(s.time!=null)G.time=s.time});
 G.on('tick',dt=>{if(!on)ink=Math.min(1,ink+dt*.03);inkM(ink)})}}
