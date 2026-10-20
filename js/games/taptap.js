/* Tap Beats: notes fall in 4 lanes; tap the lane (or D F J K) as they cross the line. 10 misses ends it. */
SB.reg('taptap',A=>{const{W,H}=A,LY=H-70,LW=W/4,CL=['#ff5c8a','#ffd23f','#3fd27a','#4aa8ff'],MEL=[523,587,659,784];let n,t,beat,score,combo,miss,fx,flash;
const KM={d:0,f:1,j:2,k:3,ArrowLeft:0,ArrowDown:1,ArrowUp:2,ArrowRight:3};
function hit(l){flash[l]=.15;let best=null;for(const q of n)if(q.l===l&&!q.done&&Math.abs(q.y-LY)<34&&(!best||Math.abs(q.y-LY)<Math.abs(best.y-LY)))best=q;
 if(best){best.done=1;const perf=Math.abs(best.y-LY)<12;combo++;score+=(perf?3:1)*(1+Math.floor(combo/10));fx.push({l,t:.4,s:perf?'Perfect':'Good'});A.beep(MEL[l]*(combo%8<4?1:1.5),.12,'triangle',.08)}else{combo=0;A.beep(110,.05,'square',.04)}}
return{help:'Tap a lane (or D F J K) when a note hits the line.',
reset(){n=[];t=0;beat=0;score=0;combo=0;miss=0;fx=[];flash=[0,0,0,0]},
down(x){hit(Math.min(3,x/LW|0))},press(k){if(k in KM)hit(KM[k])},
update(dt){t+=dt;const bpm=100+Math.min(80,score/4),sp=220+score/3;if(t>=60/bpm/2){t=0;beat++;if(beat%2==0)A.beep(80,.05,'sine',.05);if(Math.random()<.6){const l=Math.random()*4|0;n.push({l,y:-20,done:0});if(Math.random()<.12)n.push({l:(l+2)%4,y:-20,done:0})}}
 n.forEach(q=>{q.y+=sp*dt;if(!q.done&&q.y>LY+34){q.done=2;miss++;combo=0;A.beep(90,.1,'sawtooth',.05)}});n=n.filter(q=>q.y<H+20&&q.done!==1);fx.forEach(f=>f.t-=dt);fx=fx.filter(f=>f.t>0);flash=flash.map(f=>Math.max(0,f-dt));if(miss>=10)A.over(score)},
draw(g){g.fillStyle='#14061f';g.fillRect(0,0,W,H);for(let i=0;i<4;i++){g.fillStyle=flash[i]?CL[i]+'55':i%2?'#1d0b2c':'#190826';g.fillRect(i*LW,0,LW,H)}
 g.fillStyle='#fff';g.fillRect(0,LY-2,W,4);for(let i=0;i<4;i++){g.strokeStyle=CL[i];g.lineWidth=3;g.beginPath();g.arc(i*LW+LW/2,LY,24,0,7);g.stroke();A.txt('DFJK'[i],i*LW+LW/2,H-20,13,'#aaa','center')}
 n.forEach(q=>{if(q.done)return;g.fillStyle=CL[q.l];g.beginPath();g.arc(q.l*LW+LW/2,q.y,20,0,7);g.fill();g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.arc(q.l*LW+LW/2-5,q.y-6,7,0,7);g.fill()});
 fx.forEach(f=>A.txt(f.s,f.l*LW+LW/2,LY-40-(.4-f.t)*60,13,'#fff','center'));A.txt(score+'',8,24,20);A.txt(combo>1?combo+'x combo':'',W/2,24,14,'#ffd23f','center');A.txt('♥'.repeat(Math.max(0,10-miss)),W-8,24,11,'#ff5c8a','right')}}});
