/* Tilt Maze: roll the ball into the hole. Tilt your phone, or drag/arrows. 60 seconds, as many mazes as you can. */
SB.reg('tiltmaze',A=>{const{W,H}=A;let m,b,lvl,time,score,drag=null,asked=0;const OY=30;
function gen(n){const c=n,r=Math.round(n*1.4),cs=Math.floor(Math.min(W/c,(H-OY)/r)),g=Array.from({length:r},()=>Array.from({length:c},()=>({w:[1,1,1,1],v:0})));const st=[[0,0]];g[0][0].v=1;const D=[[0,-1,0,2],[1,0,1,3],[0,1,2,0],[-1,0,3,1]];
 while(st.length){const[x,y]=st[st.length-1],o=D.filter(([dx,dy])=>g[y+dy]&&g[y+dy][x+dx]&&!g[y+dy][x+dx].v);if(!o.length){st.pop();continue}const[dx,dy,a,bb]=o[Math.random()*o.length|0];g[y][x].w[a]=0;g[y+dy][x+dx].w[bb]=0;g[y+dy][x+dx].v=1;st.push([x+dx,y+dy])}
 const ox=(W-c*cs)/2,walls=[];g.forEach((row,y)=>row.forEach((k,x)=>{const X=ox+x*cs,Y=OY+y*cs;if(k.w[0])walls.push([X,Y,cs,0]);if(k.w[3])walls.push([X,Y,0,cs]);if(y==r-1&&k.w[2])walls.push([X,Y+cs,cs,0]);if(x==c-1&&k.w[1])walls.push([X+cs,Y,0,cs])}));
 return{cs,walls,hole:[ox+(c-.5)*cs,OY+(r-.5)*cs],start:[ox+cs/2,OY+cs/2]}}
function level(){m=gen(Math.min(9,3+lvl));b={x:m.start[0],y:m.start[1],vx:0,vy:0,r:m.cs*.28}}
return{help:'Tilt your phone (or drag / arrows) to roll the ball into the hole. 60 seconds.',
reset(){lvl=0;score=0;time=60;level();if(!asked&&window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission){asked=1;DeviceOrientationEvent.requestPermission().catch(()=>0)}},
down(x,y){drag=[x,y,x,y]},move(x,y,d){if(drag&&d){drag[2]=x;drag[3]=y}},up(){drag=null},
update(dt){time-=dt;if(time<=0)return A.over(score);let ax=0,ay=0;if(drag){ax=(drag[2]-drag[0])/40;ay=(drag[3]-drag[1])/40}else if(A.held.size){ax=(A.held.has('ArrowRight')-A.held.has('ArrowLeft'));ay=(A.held.has('ArrowDown')-A.held.has('ArrowUp'))}else if(A.tilt.ok){ax=A.tilt.x*1.5;ay=A.tilt.y*1.5}
 ax=Math.max(-1,Math.min(1,ax));ay=Math.max(-1,Math.min(1,ay));b.vx=(b.vx+ax*700*dt)*.985;b.vy=(b.vy+ay*700*dt)*.985;
 const steps=4;for(let i=0;i<steps;i++){b.x+=b.vx*dt/steps;b.y+=b.vy*dt/steps;for(const[x,y,w,h]of m.walls){const cx=Math.max(x,Math.min(x+w,b.x)),cy=Math.max(y,Math.min(y+h,b.y)),dx=b.x-cx,dy=b.y-cy,d=Math.hypot(dx,dy);if(d<b.r&&d>0){b.x=cx+dx/d*b.r;b.y=cy+dy/d*b.r;if(Math.abs(dx)>Math.abs(dy)){if(Math.abs(b.vx)>120)A.beep(200,.03,'square',.03);b.vx*=-.4}else{if(Math.abs(b.vy)>120)A.beep(200,.03,'square',.03);b.vy*=-.4}}}}
 if(Math.hypot(b.x-m.hole[0],b.y-m.hole[1])<m.cs*.3){score+=lvl+1;lvl++;time+=5;A.slide(400,1600,.25,'sine');level()}},
draw(g){g.fillStyle='#c79a63';g.fillRect(0,0,W,H);g.fillStyle='rgba(120,70,30,.25)';for(let y=0;y<H;y+=7)g.fillRect(0,y,W,2);
 g.fillStyle='#000';g.beginPath();g.arc(m.hole[0],m.hole[1],m.cs*.32,0,7);g.fill();g.strokeStyle='#ffd75f';g.lineWidth=2;g.stroke();
 g.strokeStyle='#5a3a1a';g.lineWidth=5;g.lineCap='round';g.beginPath();m.walls.forEach(([x,y,w,h])=>{g.moveTo(x,y);g.lineTo(x+w,y+h)});g.stroke();
 const gr=g.createRadialGradient(b.x-b.r*.3,b.y-b.r*.3,1,b.x,b.y,b.r);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#667');g.fillStyle=gr;g.beginPath();g.arc(b.x,b.y,b.r,0,7);g.fill();
 A.txt('Maze '+(lvl+1)+'  Score '+score,8,20,14);A.txt(Math.ceil(time)+'s',W-8,20,14,time<10?'#f66':'#fff','right');
 if(drag){g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=2;g.beginPath();g.arc(drag[0],drag[1],30,0,7);g.moveTo(drag[0],drag[1]);g.lineTo(drag[2],drag[3]);g.stroke()}}}});
