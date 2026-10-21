/* Artillery: a turn-based cannon duel on hills. Drag back from your cannon to aim and set power. Mind the wind. */
SB.reg('artillery',A=>{const{W,H}=A;let land,me,cpu,shot,wind,turn,score,aim,msg,mt,boom,cpuT;
function hills(){land=[];const a=Math.random()*3,b=Math.random()*3;for(let x=0;x<=W;x+=2)land.push(H-90-Math.sin(x/60+a)*30-Math.sin(x/23+b)*12)}
const gy=x=>land[Math.max(0,Math.min(land.length-1,Math.round(x/2)))];
function round(){hills();me={x:40,hp:3};cpu={x:W-40,hp:me.hp};me.y=gy(me.x);cpu.y=gy(cpu.x);newTurn(0)}
function newTurn(t){turn=t;wind=Math.round((Math.random()*2-1)*30);shot=null;if(t)cpuT=1}
function fire(from,ang,pw){shot={x:from.x,y:from.y-10,vx:Math.cos(ang)*pw,vy:Math.sin(ang)*pw,who:turn};A.slide(200,80,.2,'sawtooth')}
function hit(t,x,y){return Math.hypot(t.x-x,t.y-6-y)<18}
return{help:'Drag back from your cannon (left) and release to fire. Hit the other cannon before it hits you.',
reset(){score=0;me={hp:3};round();me.hp=3;cpu.hp=3;boom=null;msg='';mt=0},
down(x,y){if(turn||shot)return;aim={x,y,cx:x,cy:y}},move(x,y,d){if(aim&&d){aim.cx=x;aim.cy=y}},
up(){if(!aim)return;const dx=aim.x-aim.cx,dy=aim.y-aim.cy,pw=Math.min(420,Math.hypot(dx,dy)*3.2);aim=null;if(pw<40)return;fire(me,Math.atan2(dy,dx),pw)},
press(k){if(k===' '&&!turn&&!shot)fire(me,-.8,260)},
update(dt){if(mt>0)mt-=dt;if(boom){boom.t-=dt;if(boom.t<=0)boom=null}
 if(turn&&!shot&&(cpuT-=dt)<=0){const dx=me.x-cpu.x,ang=-Math.PI+(.75+Math.random()*.25);let best=null;for(let p=120;p<420;p+=4){let x=cpu.x,y=cpu.y-10,vx=Math.cos(ang)*p,vy=Math.sin(ang)*p;for(let i=0;i<400;i++){vx+=wind*.02;vy+=6;x+=vx*.02;y+=vy*.02;if(y>gy(x)||x<0)break}const e=Math.abs(x-me.x);if(!best||e<best.e)best={p,e}}const err=Math.max(4,30-score*3);fire(cpu,ang,best.p+(Math.random()*2-1)*err/3)}
 if(shot){for(let i=0;i<3;i++){shot.vx+=wind*dt/3;shot.vy+=300*dt/3;shot.x+=shot.vx*dt/3;shot.y+=shot.vy*dt/3;const tg=shot.who?me:cpu;
  if(hit(tg,shot.x,shot.y)||shot.y>gy(shot.x)||shot.x<-20||shot.x>W+20){const x=shot.x,y=shot.y;boom={x,y,t:.4};A.slide(300,40,.35,'sawtooth');for(let k=Math.max(0,Math.round((x-20)/2));k<Math.min(land.length,Math.round((x+20)/2));k++){const d=Math.sqrt(Math.max(0,400-(k*2-x)**2));if(land[k]<y+d)land[k]=Math.max(land[k],y+d)}
   [me,cpu].forEach(t=>t.y=gy(t.x));const hm=Math.hypot(me.x-x,me.y-y)<26,hc=Math.hypot(cpu.x-x,cpu.y-y)<26;if(hc){cpu.hp--;msg='Direct hit!';mt=1;score+=1}if(hm){me.hp--;msg='Ouch!';mt=1}
   const was=shot.who;shot=null;if(me.hp<=0)return A.over(score*10);if(cpu.hp<=0){score+=2;msg='Victory! Next battle';mt=1.5;const keep=me.hp;round();me.hp=keep;cpu.hp=3;return}newTurn(was?0:1);return}}}},
draw(g){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#f6c37a');gr.addColorStop(1,'#d87a4a');g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.fillStyle='#5a7a2a';g.beginPath();g.moveTo(0,H);land.forEach((y,i)=>g.lineTo(i*2,y));g.lineTo(W,H);g.fill();g.fillStyle='#3d5a1a';g.beginPath();g.moveTo(0,H);land.forEach((y,i)=>g.lineTo(i*2,y+6));g.lineTo(W,H);g.fill();
 const tank=(t,c,dir)=>{g.fillStyle=c;g.fillRect(t.x-11,t.y-10,22,10);g.beginPath();g.arc(t.x,t.y-10,7,Math.PI,0);g.fill();g.strokeStyle=c;g.lineWidth=3;g.beginPath();g.moveTo(t.x,t.y-12);g.lineTo(t.x+dir*14,t.y-22);g.stroke();A.txt('♥'.repeat(Math.max(0,t.hp)),t.x,t.y-30,10,'#f44','center')};
 tank(me,'#2a5ac8',1);tank(cpu,'#b02a2a',-1);
 if(shot){g.fillStyle='#000';g.beginPath();g.arc(shot.x,shot.y,3,0,7);g.fill()}
 if(boom){g.fillStyle=`rgba(255,${120+boom.t*300|0},0,${boom.t*2})`;g.beginPath();g.arc(boom.x,boom.y,30*(1-boom.t),0,7);g.fill()}
 if(aim){const dx=aim.x-aim.cx,dy=aim.y-aim.cy;g.strokeStyle='rgba(255,255,255,.8)';g.setLineDash([4,4]);g.beginPath();g.moveTo(me.x,me.y-12);g.lineTo(me.x+dx,me.y-12+dy);g.stroke();g.setLineDash([]);A.txt(Math.min(100,Math.round(Math.hypot(dx,dy)*3.2/4.2))+'%',me.x+dx,me.y-18+dy,12)}
 A.txt('Wins '+score,8,22,14);A.txt('Wind '+(wind<0?'← ':'→ ')+Math.abs(wind),W/2,22,13,'#fff','center');A.txt(turn?'Enemy turn…':'Your turn',W-8,22,13,turn?'#faa':'#aef','right');if(mt>0)A.txt(msg,W/2,90,20,'#fff','center')}}});
