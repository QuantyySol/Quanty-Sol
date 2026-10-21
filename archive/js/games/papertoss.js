/* Paper Toss: flick a crumpled paper ball into the bin. Watch the fan's wind. 3 misses and you're out. */
SB.reg('papertoss',A=>{const{W,H}=A,HZ=150,BZ=1;let b,wind,score,miss,sx,sy,st,msg,mt;
const proj=(x,z,h)=>{const s=1/(1+z*2.2);return[W/2+x*s,HZ+(H-60-HZ)*s-h*s,s]};
function newBall(){b={x:0,z:0,h:0,vx:0,vz:0,vh:0,fly:0};wind=Math.round((Math.random()*2-1)*(1+score/4)*10)/10}
return{help:'Flick the paper ball up toward the bin. Mind the wind from the fan.',
reset(){score=0;miss=0;msg='';mt=0;newBall()},
down(x,y){if(b.fly)return;sx=x;sy=y;st=performance.now()},
up(x,y){if(b.fly||sx==null)return;const dy=sy-y,dx=x-sx,dt=Math.max(60,performance.now()-st);sx=null;if(dy<25)return;const sp=Math.min(2.2,dy/dt);b.fly=1;b.vz=.6+sp*.5;b.vh=160+sp*90;b.vx=dx*1.4;A.slide(500,250,.15,'triangle')},
press(k){if(k===' '&&!b.fly){b.fly=1;b.vz=1.1;b.vh=250;b.vx=0}},
update(dt){if(mt>0)mt-=dt;if(!b.fly)return;const pz=b.z;b.vx+=wind*40*dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.vh-=420*dt;b.h+=b.vh*dt;
 if(pz<BZ&&b.z>=BZ){if(Math.abs(b.x)<46&&b.h>-5&&b.h<70&&b.vh<0){score++;msg='Swish!';mt=1;A.beep(660,.08,'sine');setTimeout(()=>A.beep(990,.12,'sine'),90);newBall();return}if(Math.abs(b.x)<60&&b.h<=70&&b.h>-5){b.vz*=-.4;b.vx*=.5;A.beep(150,.08,'square')}}
 if(b.h<0&&b.z>0){miss++;msg=['Miss!','Close!','Nope'][Math.random()*3|0];mt=1;A.beep(120,.15,'sawtooth');if(miss>=3)return A.over(score);newBall()}},
draw(g){g.fillStyle='#d8cbb0';g.fillRect(0,0,W,HZ);g.fillStyle='#bfa98a';g.fillRect(0,HZ-6,W,6);g.fillStyle='#8a6a48';g.fillRect(0,HZ,W,H);
 g.fillStyle='#7a5a3a';for(let i=0;i<8;i++){g.beginPath();g.moveTo(W/2,HZ);g.lineTo(i*W/7-W/2+ (i-3.5)*60,H);g.lineTo(i*W/7-W/2+(i-3.5)*60+6,H);g.fill()}
 g.fillStyle='#9fd0ff';g.fillRect(30,30,90,70);g.strokeStyle='#fff';g.lineWidth=4;g.strokeRect(30,30,90,70);g.beginPath();g.moveTo(75,30);g.lineTo(75,100);g.stroke();
 const fx=W-60;g.fillStyle='#ccc';g.fillRect(fx-2,70,4,40);g.save();g.translate(fx,60);g.rotate(performance.now()/1000*Math.abs(wind)*8);g.fillStyle='#5a6b8a';for(let i=0;i<3;i++){g.rotate(2.09);g.beginPath();g.ellipse(0,-10,5,10,0,0,7);g.fill()}g.restore();
 A.txt('Wind '+(wind>0?'→':wind<0?'←':'')+' '+Math.abs(wind).toFixed(1),W-10,130,13,'#fff','right');
 const[cx,cy,s]=proj(0,BZ,0),bw=50*s,bh=70*s;const draws=()=>{g.fillStyle='#9aa4ad';g.beginPath();g.moveTo(cx-bw,cy-bh);g.lineTo(cx+bw,cy-bh);g.lineTo(cx+bw*.8,cy);g.lineTo(cx-bw*.8,cy);g.fill();g.fillStyle='#6d7780';g.beginPath();g.ellipse(cx,cy-bh,bw,bw*.25,0,0,7);g.fill();g.fillStyle='#3a4248';g.beginPath();g.ellipse(cx,cy-bh,bw*.88,bw*.18,0,0,7);g.fill()};
 const ball=()=>{const[x,y,s2]=proj(b.x,b.z,Math.max(0,b.h));const[,sy2]=proj(b.x,b.z,0);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(x,sy2,14*s2,4*s2,0,0,7);g.fill();g.fillStyle='#f4f4ee';g.beginPath();g.arc(x,y-14*s2,14*s2,0,7);g.fill();g.strokeStyle='#bbb';g.lineWidth=1;g.beginPath();g.moveTo(x-8*s2,y-18*s2);g.lineTo(x+4*s2,y-10*s2);g.lineTo(x+9*s2,y-20*s2);g.stroke()};
 if(b.z>BZ){ball();draws()}else{draws();ball()}
 A.txt('Score '+score,10,H-14,16);A.txt('●'.repeat(3-miss)+'○'.repeat(miss),W-10,H-14,16,'#ffd75f','right');if(mt>0)A.txt(msg,W/2,HZ+40,26,'#fff','center');if(!b.fly&&!score&&!miss)A.txt('Flick up ↑',W/2,H-90,16,'#fff','center')}}});
