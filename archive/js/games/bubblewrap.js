/* Bubble Wrap: pop as many bubbles as you can in 20 seconds. Golden ones are worth 5. */
SB.reg('bubblewrap',A=>{const{W,H}=A,R=19,C=7,RW=10;let bs,time,score,pops;
function sheet(){bs=[];for(let j=0;j<RW;j++)for(let i=0;i<C-(j%2);i++)bs.push({x:24+i*44+(j%2)*22,y:50+j*40,p:0,gold:Math.random()<.06})}
return{help:'Pop every bubble you can in 20 seconds. Drag across to pop fast.',
reset(){time=20;score=0;pops=[];sheet()},
down(x,y){this.move(x,y,1)},move(x,y,d){if(!d)return;for(const b of bs)if(!b.p&&Math.hypot(b.x-x,b.y-y)<R){b.p=1;score+=b.gold?5:1;pops.push({x:b.x,y:b.y,t:.3});A.beep(b.gold?1500:300+Math.random()*500,.04,'square',.08);if(bs.every(q=>q.p)){time+=3;sheet()}}},
update(dt){time-=dt;pops.forEach(p=>p.t-=dt);pops=pops.filter(p=>p.t>0);if(time<=0)A.over(score)},
draw(g){g.fillStyle='#dff3fb';g.fillRect(0,0,W,H);bs.forEach(b=>{if(b.p){g.fillStyle='rgba(150,190,210,.5)';g.beginPath();g.ellipse(b.x,b.y,R*.8,R*.4,.3,0,7);g.fill();return}const gr=g.createRadialGradient(b.x-6,b.y-7,2,b.x,b.y,R);gr.addColorStop(0,'#fff');gr.addColorStop(1,b.gold?'#f2c84b':'#9fd4ea');g.fillStyle=gr;g.beginPath();g.arc(b.x,b.y,R,0,7);g.fill();g.strokeStyle='rgba(80,140,170,.5)';g.stroke()});
 pops.forEach(p=>A.txt('pop!',p.x,p.y-(.3-p.t)*60,12,'#38a','center'));A.txt('Popped '+score,8,24,16,'#fff');A.txt(Math.ceil(time)+'s',W-8,24,16,time<5?'#f66':'#fff','right')}}});
