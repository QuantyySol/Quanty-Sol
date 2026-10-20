/* Bricks: classic paddle and ball. Drag or arrows. 3 lives, clear the wall for the next level. */
SB.reg('bricks',A=>{const{W,H}=A;let pad,ball,br,lives,score,lvl,stuck;const CL=['#ff5c5c','#ffa83f','#ffe03f','#5cd65c','#4aa8ff','#a86bff'];
function wall(){br=[];for(let j=0;j<6;j++)for(let i=0;i<8;i++)if(lvl%2==0||(i+j)%2==0)br.push({x:8+i*38,y:50+j*18,c:CL[j],hp:j<lvl?2:1})}
function serve(){stuck=1;ball={x:pad.x,y:H-48,vx:0,vy:0}}
function launch(){if(!stuck)return;stuck=0;const s=230+lvl*25;ball.vx=s*.5*(Math.random()<.5?-1:1);ball.vy=-s}
return{help:'Drag (or ←/→) to move, tap/space to launch.',
reset(){pad={x:W/2,w:60};lives=3;score=0;lvl=0;wall();serve()},
down(x){pad.x=x;launch()},move(x,y,d){if(d)pad.x=x},press(k){if(k===' ')launch()},
update(dt){if(A.held.has('ArrowLeft'))pad.x-=320*dt;if(A.held.has('ArrowRight'))pad.x+=320*dt;pad.x=Math.max(pad.w/2,Math.min(W-pad.w/2,pad.x));
 if(stuck){ball.x=pad.x;return}ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;if(ball.x<5||ball.x>W-5){ball.vx*=-1;ball.x=Math.max(5,Math.min(W-5,ball.x));A.beep(400,.03)}if(ball.y<30){ball.vy=Math.abs(ball.vy);A.beep(400,.03)}
 if(ball.vy>0&&ball.y>H-46&&ball.y<H-34&&Math.abs(ball.x-pad.x)<pad.w/2+5){const s=Math.hypot(ball.vx,ball.vy)*1.01,a=(ball.x-pad.x)/(pad.w/2)*1.05;ball.vx=s*Math.sin(a);ball.vy=-s*Math.cos(a);A.beep(300,.05,'triangle')}
 for(const b of br)if(ball.x>b.x-5&&ball.x<b.x+40&&ball.y>b.y-5&&ball.y<b.y+21){const ox=Math.min(ball.x-b.x+5,b.x+40-ball.x),oy=Math.min(ball.y-b.y+5,b.y+21-ball.y);ox<oy?ball.vx*=-1:ball.vy*=-1;if(--b.hp<=0){b.dead=1;score+=10}A.beep(700+Math.random()*300,.05);break}
 br=br.filter(b=>!b.dead);if(!br.length){lvl++;wall();serve();A.slide(400,1200,.3,'sine')}
 if(ball.y>H){lives--;A.slide(400,100,.3,'sawtooth');if(lives<=0)return A.over(score);serve()}},
draw(g){g.fillStyle='#0c1030';g.fillRect(0,0,W,H);br.forEach(b=>{g.fillStyle=b.c;g.fillRect(b.x,b.y,36,16);g.fillStyle='rgba(255,255,255,.4)';g.fillRect(b.x,b.y,36,5);if(b.hp>1){g.strokeStyle='#fff';g.strokeRect(b.x+1,b.y+1,34,14)}});
 const gr=g.createLinearGradient(0,H-44,0,H-34);gr.addColorStop(0,'#eee');gr.addColorStop(1,'#778');g.fillStyle=gr;g.fillRect(pad.x-pad.w/2,H-44,pad.w,10);g.fillStyle='#fff';g.beginPath();g.arc(ball.x,ball.y,5,0,7);g.fill();
 A.txt('Score '+score,8,22,14);A.txt('Lv '+(lvl+1),W/2,22,14,'#fff','center');A.txt('●'.repeat(lives),W-8,22,14,'#ff5c5c','right');if(stuck)A.txt('Tap to launch',W/2,H/2+60,14,'#fff','center')}}});
