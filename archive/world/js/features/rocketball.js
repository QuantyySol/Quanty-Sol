// Rocket League-style: pop-up arena with block goals, physics ball, dash-bump, double-jump; first to 3 wins.
export default{name:'rocketball',init(G){const T=G.THREE;let A=null,jumps=0,dashCD=0;
 const ballM=new T.Mesh(new T.SphereGeometry(.7,16,12),new T.MeshLambertMaterial({color:0xffffff,emissive:0x333333}));
 const sb=document.createElement('div');sb.style.cssText='position:fixed;top:78px;left:50%;transform:translateX(-50%);font:bold 20px sans-serif;text-shadow:2px 2px 0 #000;z-index:6;display:none';document.body.appendChild(sb);
 function build(a,local){A={...a,score:[0,0],vel:new T.Vector3(),pos:new T.Vector3(a.x,a.y+3,a.z),owner:a.owner};ballM.position.copy(A.pos);G.scene.add(ballM);sb.style.display='block';draw();
  if(!local)return;const {x,y,z}=a;// floor + goals
  for(let i=-8;i<=8;i++)for(let k=-14;k<=14;k++){G.world.set(x+i,y,z+k,i==0&&k==0?12:3);for(let h=1;h<6;h++)if(G.world.get(x+i,y+h,z+k))G.world.set(x+i,y+h,z+k,0)}
  for(const s of[-1,1])for(let i=-3;i<=3;i++)for(let h=1;h<=4;h++){const edge=Math.abs(i)==3||h==4;if(edge)G.world.set(x+i,y+h,z+s*15,s<0?13:10)}}
 function draw(){sb.textContent=`🟥 ${A.score[0]} : ${A.score[1]} 🟦`}
 function reset(){A.pos.set(A.x+.5,A.y+3,A.z+.5);A.vel.set(0,0,0)}
 G.ui.button('⚽','Pop-up ball arena',()=>{if(A)return G.toast('Arena active');const p=G.player.pos,f=new T.Vector3(-Math.sin(G.player.yaw),0,-Math.cos(G.player.yaw));
  const a={x:Math.floor(p.x+f.x*18),z:Math.floor(p.z+f.z*18),owner:G.net.id};a.y=G.world.height(a.x,a.z);build(a,true);G.net.send({t:'rb',k:'new',a});G.toast('Arena! Hit the ball into a goal. First to 3.')});
 G.ui.button('💨','Dash / bump (Shift)',dash);G.on('kbd',c=>{if(c=='Shift')dash()});
 function dash(){if(dashCD>0)return;dashCD=1.2;const f=new T.Vector3(-Math.sin(G.player.yaw),0,-Math.cos(G.player.yaw));G.player.vel.addScaledVector(f,16);G.player.vel.y+=2}
 G.on('jump',()=>jumps=1);
 // double-tap jump: second jump midair
 let air=false;G.on('tick',()=>{if(G.player.onGround)jumps=0;const j=G.input.jump;if(j&&!air&&!G.player.onGround&&jumps==1){G.player.vel.y=8;jumps=2;G.toast('Double jump!',600)}air=j});
 G.net.on('rb',e=>{if(e.k=='new'&&!A)build(e.a,false);if(!A)return;if(e.k=='ball'){A.pos.fromArray(e.p);A.vel.fromArray(e.v)}if(e.k=='hit'&&A.owner==G.net.id)A.vel.fromArray(e.v);if(e.k=='score'){A.score=e.s;draw();G.toast(e.msg)}if(e.k=='end'){end()}});
 function end(){G.scene.remove(ballM);sb.style.display='none';A=null}
 let st=0;G.on('tick',dt=>{dashCD-=dt;if(!A)return;const p=G.player.pos;const d=new T.Vector3(A.pos.x-p.x,A.pos.y-(p.y+.9),A.pos.z-p.z);
  if(d.length()<1.3){const v=d.normalize().multiplyScalar(6+G.player.vel.length()*1.2);v.y=Math.max(v.y,3);A.vel.copy(v);if(A.owner!=G.net.id)G.net.send({t:'rb',k:'hit',v:v.toArray()})}
  if(A.owner!=G.net.id){ballM.position.lerp(A.pos,.3);return}
  A.vel.y-=18*dt;A.vel.multiplyScalar(1-dt*.4);for(const ax of['x','y','z']){const o=A.pos[ax];A.pos[ax]+=A.vel[ax]*dt;
   if(G.world.solid(G.world.get(Math.floor(A.pos.x),Math.floor(A.pos.y-.6),Math.floor(A.pos.z)))||G.world.solid(G.world.get(Math.floor(A.pos.x+(ax=='x'?Math.sign(A.vel.x)*.7:0)),Math.floor(A.pos.y),Math.floor(A.pos.z+(ax=='z'?Math.sign(A.vel.z)*.7:0))))){A.pos[ax]=o;A.vel[ax]*=-.6}}
  ballM.position.copy(A.pos);const dz=A.pos.z-A.z;if(Math.abs(dz)>14.5&&Math.abs(A.pos.x-A.x-.5)<3&&A.pos.y<A.y+5){const t=dz>0?0:1;A.score[t]++;
   const msg=A.score[t]>=3?(t?'🟦 BLUE WINS!':'🟥 RED WINS!'):'GOAL!';G.toast(msg);G.net.send({t:'rb',k:'score',s:A.score,msg});draw();reset();
   if(A.score[t]>=3)setTimeout(()=>{G.net.send({t:'rb',k:'end'});end()},3000)}
  if(A.pos.y<A.y-10)reset();st+=dt;if(st>.1){st=0;G.net.send({t:'rb',k:'ball',p:A.pos.toArray().map(v=>+v.toFixed(2)),v:A.vel.toArray().map(v=>+v.toFixed(2))})}})}}
