/* Sky Jump: bounce up platforms into space. Brown ones crumble. Tilt, tap sides, or arrows. */
SB.reg('skyjump',A=>{const{W,H}=A;let p,plats,cam,best,score,stars,touchDir=0;
function plat(y){const r=Math.random(),t=score>800&&r<.18?'brk':score>300&&r<.32?'move':'ok';return{x:Math.random()*(W-56),y,w:56,t,vx:t==='move'?(Math.random()<.5?-1:1)*50:0,dead:0,spring:t==='ok'&&Math.random()<.08}}
return{help:'Tilt or tap left/right (or ←/→). Brown platforms crumble, springs launch.',
reset(){p={x:W/2-14,y:H-80,vx:0,vy:-520};cam=0;score=0;best=0;plats=[{x:W/2-28,y:H-30,w:56,t:'ok',vx:0,dead:0}];for(let y=H-90;y>-H;y-=60)plats.push(plat(y));stars=Array.from({length:40},()=>[Math.random()*W,Math.random()*H,Math.random()*1.5+.5])},
down(x){touchDir=x<W/2?-1:1},up(){touchDir=0},
update(dt){let dir=touchDir;if(A.held.has('ArrowLeft')||A.held.has('a'))dir=-1;if(A.held.has('ArrowRight')||A.held.has('d'))dir=1;if(!dir&&A.tilt.ok)dir=A.tilt.x*1.6;
 p.vx+=(dir*360-p.vx)*Math.min(1,dt*8);p.x+=p.vx*dt;if(p.x>W)p.x=-28;if(p.x<-28)p.x=W;
 const py=p.y;p.vy+=1300*dt;p.y+=p.vy*dt;
 if(p.vy>0)for(const q of plats){if(q.dead)continue;if(py+28<=q.y&&p.y+28>=q.y&&p.x+22>q.x&&p.x+6<q.x+q.w){if(q.t==='brk'){q.dead=1;A.slide(300,80,.25,'sawtooth');continue}p.y=q.y-28;p.vy=q.spring?-900:-560;A.slide(q.spring?300:220,q.spring?1200:660,.12,'square');break}}
 plats.forEach(q=>{if(q.vx){q.x+=q.vx*dt;if(q.x<0||q.x>W-q.w)q.vx*=-1}if(q.dead)q.y+=300*dt});
 const top=H*.4;if(p.y<top){const d=top-p.y;p.y=top;plats.forEach(q=>q.y+=d);cam+=d;score=Math.floor(cam/4);stars.forEach(s=>{s[1]+=d*.2;if(s[1]>H)s[1]-=H})}
 plats=plats.filter(q=>q.y<H+40);let minY=Math.min(...plats.map(q=>q.y));while(minY>-40){minY-=55+Math.min(45,score/40)*Math.random();plats.push(plat(minY))}
 if(p.y>H)A.over(score)},
draw(g){const k=Math.min(1,score/3000),gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,`rgb(${10},${20-15*k},${60-40*k})`);gr.addColorStop(1,`rgb(${40-30*k},${90-80*k},${140-120*k})`);g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.fillStyle='#fff';stars.forEach(s=>{g.globalAlpha=k*.9+.1;g.fillRect(s[0],s[1],s[2],s[2])});g.globalAlpha=1;
 if(score>2000){g.fillStyle='#f4f1d0';g.beginPath();g.arc(W-60,60+(3000-Math.min(score,3000))/10,30,0,7);g.fill()}
 plats.forEach(q=>{const c=q.t==='brk'?'#9a6a3a':q.t==='move'?'#5cc8ff':'#39d97a';g.fillStyle=c;g.globalAlpha=q.dead?.4:1;g.fillRect(q.x,q.y,q.w,10);g.fillStyle='rgba(255,255,255,.45)';g.fillRect(q.x+2,q.y+1,q.w-4,3);if(q.spring){g.fillStyle='#ffd75f';g.fillRect(q.x+q.w/2-7,q.y-8,14,8)}g.globalAlpha=1});
 const x=p.x,y=p.y;g.fillStyle='#e8e8f0';g.beginPath();g.moveTo(x+14,y);g.lineTo(x+26,y+18);g.lineTo(x+2,y+18);g.fill();g.fillRect(x+6,y+12,16,14);g.fillStyle='#ff5c6c';g.fillRect(x+2,y+20,6,8);g.fillRect(x+20,y+20,6,8);g.fillStyle='#5cc8ff';g.beginPath();g.arc(x+14,y+15,4,0,7);g.fill();
 if(p.vy<0){g.fillStyle='#ffb03a';g.beginPath();g.moveTo(x+9,y+27);g.lineTo(x+19,y+27);g.lineTo(x+14,y+27+Math.random()*12+6);g.fill()}
 A.txt(score+'',8,22,18);A.txt('BEST '+A.hi(),W-8,22,12,'#9f9','right')}}});
