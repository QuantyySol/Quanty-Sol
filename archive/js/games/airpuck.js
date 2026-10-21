/* Air Puck: drag your mallet (bottom) to knock the puck into the computer's goal. First to 7. */
SB.reg('airpuck',A=>{const{W,H}=A,G=110,PR=12,MR=22;let pk,me,ai,sm,sa,lastMe,serve;
function reset2(toAi){pk={x:W/2,y:toAi?H/2-40:H/2+40,vx:0,vy:0};serve=.6}
function coll(m,mvx,mvy){const dx=pk.x-m.x,dy=pk.y-m.y,d=Math.hypot(dx,dy);if(d<PR+MR&&d>0){const nx=dx/d,ny=dy/d;pk.x=m.x+nx*(PR+MR);pk.y=m.y+ny*(PR+MR);const rv=(pk.vx-mvx)*nx+(pk.vy-mvy)*ny;if(rv<0){pk.vx-=1.9*rv*nx;pk.vy-=1.9*rv*ny}const s=Math.hypot(pk.vx,pk.vy);if(s>900){pk.vx*=900/s;pk.vy*=900/s}A.beep(300,.03,'triangle')}}
return{help:'Drag your mallet (or arrows) to hit the puck into the top goal. First to 7 wins.',
reset(){me={x:W/2,y:H-60,tx:W/2,ty:H-60};ai={x:W/2,y:60};sm=0;sa=0;lastMe={x:me.x,y:me.y};reset2(0)},
down(x,y){me.tx=x;me.ty=y},move(x,y,d){if(d){me.tx=x;me.ty=y}},
update(dt){if(A.held.has('ArrowLeft'))me.tx-=400*dt;if(A.held.has('ArrowRight'))me.tx+=400*dt;if(A.held.has('ArrowUp'))me.ty-=400*dt;if(A.held.has('ArrowDown'))me.ty+=400*dt;
 me.tx=Math.max(MR,Math.min(W-MR,me.tx));me.ty=Math.max(H/2+MR,Math.min(H-MR,me.ty));lastMe={x:me.x,y:me.y};me.x+=(me.tx-me.x)*Math.min(1,dt*25);me.y+=(me.ty-me.y)*Math.min(1,dt*25);const mvx=(me.x-lastMe.x)/dt,mvy=(me.y-lastMe.y)/dt;
 const lvl=1+sm*.08;let tx=pk.y<H/2?pk.x:W/2,ty=pk.y<H/2?Math.min(pk.y-10,H/2-MR):60;const ax=ai.x,ay=ai.y,s=260*lvl*dt;const d=Math.hypot(tx-ai.x,ty-ai.y);if(d>s){ai.x+=(tx-ai.x)/d*s;ai.y+=(ty-ai.y)/d*s}else{ai.x=tx;ai.y=ty}ai.y=Math.max(MR,Math.min(H/2-MR,ai.y));
 if(serve>0){serve-=dt;return}pk.x+=pk.vx*dt;pk.y+=pk.vy*dt;pk.vx*=.995;pk.vy*=.995;
 if(pk.x<PR){pk.x=PR;pk.vx=Math.abs(pk.vx);A.beep(200,.02)}if(pk.x>W-PR){pk.x=W-PR;pk.vx=-Math.abs(pk.vx);A.beep(200,.02)}
 const inG=Math.abs(pk.x-W/2)<G/2;if(pk.y<PR){if(inG){sm++;A.slide(500,1500,.3,'sine');if(sm>=7)return A.over(sm*10+(7-sa)*5);reset2(1);return}pk.y=PR;pk.vy=Math.abs(pk.vy)}
 if(pk.y>H-PR){if(inG){sa++;A.slide(400,80,.3,'sawtooth');if(sa>=7)return A.over(sm*10);reset2(0);return}pk.y=H-PR;pk.vy=-Math.abs(pk.vy)}
 coll(me,mvx,mvy);coll(ai,(ai.x-ax)/dt,(ai.y-ay)/dt)},
draw(g){g.fillStyle='#e8f4ff';g.fillRect(0,0,W,H);g.strokeStyle='#d33';g.lineWidth=2;g.beginPath();g.moveTo(0,H/2);g.lineTo(W,H/2);g.stroke();g.strokeStyle='#36c';g.beginPath();g.arc(W/2,H/2,40,0,7);g.stroke();g.beginPath();g.arc(W/2,0,G/2,0,Math.PI);g.stroke();g.beginPath();g.arc(W/2,H,G/2,Math.PI,0);g.stroke();
 g.fillStyle='#222';g.fillRect(W/2-G/2,0,G,4);g.fillRect(W/2-G/2,H-4,G,4);g.fillStyle='rgba(120,160,200,.25)';for(let x=10;x<W;x+=20)for(let y=10;y<H;y+=20)g.fillRect(x,y,1.5,1.5);
 const mal=(m,c)=>{g.fillStyle=c;g.beginPath();g.arc(m.x,m.y,MR,0,7);g.fill();g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.arc(m.x,m.y,MR*.55,0,7);g.fill();g.fillStyle=c;g.beginPath();g.arc(m.x,m.y,MR*.35,0,7);g.fill()};
 mal(ai,'#d33');mal(me,'#2a6ad8');g.fillStyle='#111';g.beginPath();g.arc(pk.x,pk.y,PR,0,7);g.fill();g.strokeStyle='#555';g.beginPath();g.arc(pk.x,pk.y,PR*.6,0,7);g.stroke();
 A.txt(sa+'',W-14,H/2-12,22,'#d33','right');A.txt(sm+'',W-14,H/2+30,22,'#2a6ad8','right')}}});
