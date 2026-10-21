/* Flappy Chick: tap to flap through gaps between pipes. */
SB.reg('flappy',A=>{const{W,H}=A;let b,pipes,t,score,gnd,started;
function flap(){b.vy=-300;A.beep(720,.07,'square',.05);started=1}
return{help:'Tap, click or space to flap through the pipes.',
reset(){b={y:H/2,vy:0,r:0};pipes=[];t=1.2;score=0;gnd=0;started=0},down:flap,press(k){if(k===' '||k==='ArrowUp')flap()},
update(dt){gnd=(gnd+dt*120)%24;if(!started){b.y=H/2+Math.sin(performance.now()/200)*6;return}b.vy+=900*dt;b.y+=b.vy*dt;b.r=Math.max(-.5,Math.min(1.2,b.vy/500));
 t-=dt;if(t<=0){t=1.45;const gap=Math.max(105,140-score*1.5);pipes.push({x:W,gy:60+Math.random()*(H-180-gap),gap,s:0})}
 for(const p of pipes){p.x-=120*dt;if(!p.s&&p.x+44<70){p.s=1;score++;A.beep(1320,.08,'sine',.07)}if(70+12>p.x&&70-12<p.x+44&&(b.y-11<p.gy||b.y+11>p.gy+p.gap))return A.over(score)}
 pipes=pipes.filter(p=>p.x>-50);if(b.y>H-50||b.y<-30)A.over(score)},
draw(g){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#4ec0ff');gr.addColorStop(1,'#bfeaff');g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.fillStyle='rgba(255,255,255,.8)';[[40,80],[200,60],[260,140]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,16,0,7);g.arc(x+18,y-6,20,0,7);g.arc(x+38,y,15,0,7);g.fill()});
 pipes.forEach(p=>{[[0,p.gy],[p.gy+p.gap,H-50-p.gy-p.gap]].forEach(([y,h])=>{g.fillStyle='#5fbf2a';g.fillRect(p.x,y,44,h);g.fillStyle='#9be86a';g.fillRect(p.x+4,y,8,h);});g.fillStyle='#3f8f1a';g.fillRect(p.x-3,p.gy-12,50,12);g.fillRect(p.x-3,p.gy+p.gap,50,12);});
 g.fillStyle='#d9b26a';g.fillRect(0,H-50,W,50);g.fillStyle='#6ccf4a';g.fillRect(0,H-50,W,8);g.fillStyle='#4aa82e';for(let x=-gnd;x<W;x+=24)g.fillRect(x,H-50,12,8);
 g.save();g.translate(70,b.y);g.rotate(b.r);g.fillStyle='#ffd23f';g.beginPath();g.ellipse(0,0,14,11,0,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(6,-4,4,0,7);g.fill();g.fillStyle='#000';g.fillRect(7,-5,2,2);g.fillStyle='#ff8a00';g.fillRect(10,0,8,4);g.fillStyle='#f0b000';g.beginPath();g.ellipse(-4,2,7,4,Math.sin(performance.now()/60)*.6,0,7);g.fill();g.restore();
 A.txt(score+'',W/2,60,36,'#fff','center');if(!started)A.txt('Tap to flap',W/2,H/2+50,16,'#fff','center')}}});
