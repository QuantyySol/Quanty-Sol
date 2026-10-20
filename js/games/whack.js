/* Whack: bonk moles as they pop up. Don't hit the bunnies. 30 seconds. */
SB.reg('whack',A=>{const{W,H}=A;let holes,time,score,sp,hitfx;
return{help:'Tap the moles. Leave the bunnies alone! 30 seconds.',
reset(){holes=[];for(let j=0;j<4;j++)for(let i=0;i<3;i++)holes.push({x:60+i*100,y:110+j*90,up:0,t:0,b:0,hit:0});time=30;score=0;sp=0;hitfx=[]},
down(x,y){for(const h of holes)if(h.up>.4&&!h.hit&&Math.abs(x-h.x)<40&&y>h.y-60&&y<h.y+15){h.hit=1;h.t=Math.min(h.t,.25);if(h.b){score=Math.max(0,score-3);A.beep(150,.2,'sawtooth')}else{score++;A.beep(900,.05);A.beep(400,.08,'triangle')}hitfx.push({x:h.x,y:h.y-40,t:.3,b:h.b});return}},
update(dt){time-=dt;if(time<=0)return A.over(score);sp-=dt;if(sp<=0){sp=Math.max(.3,.8-score/80);const f=holes.filter(h=>!h.up&&!h.t);if(f.length){const h=f[Math.random()*f.length|0];h.t=Math.max(.6,1.3-score/60);h.b=Math.random()<.18;h.hit=0}}
 holes.forEach(h=>{if(h.t>0){h.t-=dt;h.up=Math.min(1,h.up+dt*6)}else h.up=Math.max(0,h.up-dt*6)});hitfx.forEach(f=>f.t-=dt);hitfx=hitfx.filter(f=>f.t>0)},
draw(g){g.fillStyle='#78c850';g.fillRect(0,0,W,H);g.fillStyle='#6ab840';for(let i=0;i<60;i++)g.fillRect((i*73)%W,(i*131)%H,3,8);
 holes.forEach(h=>{g.fillStyle='#3a2410';g.beginPath();g.ellipse(h.x,h.y,40,14,0,0,7);g.fill();if(h.up>0){g.save();g.beginPath();g.rect(h.x-45,h.y-90,90,90);g.clip();const y=h.y+10-h.up*55;
  g.fillStyle=h.b?'#f4f4f4':'#8a5a32';g.beginPath();g.ellipse(h.x,y,26,30,0,0,7);g.fill();if(h.b){g.beginPath();g.ellipse(h.x-9,y-34,6,16,0,0,7);g.ellipse(h.x+9,y-34,6,16,0,0,7);g.fill()}
  g.fillStyle='#000';if(h.hit){g.font='bold 12px Helvetica';g.textAlign='center';g.fillText('x  x',h.x,y-6)}else{g.fillRect(h.x-10,y-10,4,5);g.fillRect(h.x+6,y-10,4,5)}g.fillStyle='#ff9ab0';g.beginPath();g.arc(h.x,y+2,4,0,7);g.fill();g.restore()}
  g.fillStyle='#2a1808';g.beginPath();g.ellipse(h.x,h.y+2,40,8,0,0,Math.PI);g.fill()});
 hitfx.forEach(f=>A.txt(f.b?'-3':'BONK!',f.x,f.y,16,f.b?'#f44':'#ff0','center'));A.txt('Score '+score,8,26,18);A.txt(Math.ceil(time)+'s',W-8,26,18,time<6?'#f44':'#fff','right')}}});
