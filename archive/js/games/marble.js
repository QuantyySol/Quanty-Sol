/* Marble Run: steer a rolling marble down an endless winding track. Tilt, drag or arrows. Stay on the road! */
SB.reg('marble',A=>{const{W,H}=A;let m,dist,seg,sp,trail,dx0,drag;
function cx(y){let x=W/2;for(const s of seg)x+=Math.sin((y+dist)*s[0]+s[1])*s[2];return x}
const wid=()=>Math.max(54,110-dist/120);
return{help:'Tilt, drag or use ←/→ to keep the marble on the track. It speeds up!',
reset(){m={x:W/2,vx:0};dist=0;sp=140;trail=[];seg=[[.004,Math.random()*6,60],[.011,Math.random()*6,25]];m.x=cx(-H*.25)},
down(x){drag=x;dx0=m.x},move(x,y,d){if(d&&drag!=null)m.tx=dx0+(x-drag)*1.3},up(){drag=null;m.tx=null},
update(dt){sp=Math.min(380,sp+dt*6);dist+=sp*dt;let ax=0;if(A.held.has('ArrowLeft'))ax=-1;if(A.held.has('ArrowRight'))ax=1;if(!ax&&A.tilt.ok)ax=A.tilt.x*1.4;
 if(m.tx!=null)m.vx=(m.tx-m.x)*8;else m.vx=(m.vx+ax*900*dt)*.97;m.x+=m.vx*dt;const c=cx(-H*.25);
 if(Math.abs(m.x-c)>wid()/2-4){A.slide(500,60,.6,'sine');return A.over(dist/10)}if(Math.random()<dt*2)A.beep(60+sp/4,.04,'sine',.03);trail.push([m.x,dist]);if(trail.length>30)trail.shift()},
draw(g){g.fillStyle='#14324a';g.fillRect(0,0,W,H);g.fillStyle='#1d4466';for(let y=-(dist%40);y<H;y+=40)g.fillRect(0,y,W,20);const w=wid();
 for(let y=0;y<=H;y+=4){const c=cx(-y);g.fillStyle=((y+dist)/30|0)%2?'#e8e2d0':'#d8d0b8';g.fillRect(c-w/2,H-y-4,w,5);g.fillStyle=((y+dist)/15|0)%2?'#e33':'#fff';g.fillRect(c-w/2-5,H-y-4,5,5);g.fillRect(c+w/2,H-y-4,5,5)}
 trail.forEach((t,i)=>{const y=H*.25+(dist-t[1]);g.fillStyle=`rgba(80,200,255,${i/60})`;g.beginPath();g.arc(t[0],H-y,6,0,7);g.fill()});
 const y=H*.25,gr=g.createRadialGradient(m.x-4,H-y-4,1,m.x,H-y,10);gr.addColorStop(0,'#fff');gr.addColorStop(.4,'#5ad');gr.addColorStop(1,'#124');g.fillStyle=gr;g.beginPath();g.arc(m.x,H-y,10,0,7);g.fill();
 A.txt(Math.floor(dist/10)+' m',8,22,16);A.txt(Math.round(sp/3.6)+' km/h',W-8,22,13,'#aef','right')}}});
