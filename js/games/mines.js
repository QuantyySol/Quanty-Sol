/* Mines: classic Minesweeper. Tap to dig, long-press (or flag mode) to flag. Score = cells cleared, bonus for speed. */
SB.reg('mines',A=>{const{W,H}=A,C=9,R=12,S=34,OX=(W-C*S)/2,OY=40,M=16;let g0,first,flagMode,time,done,hold,dc,lost;
function nb(x,y,f){for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if((i||j)&&g0[y+j]&&g0[y+j][x+i])f(g0[y+j][x+i],x+i,y+j)}
function plant(sx,sy){let n=0;while(n<M){const x=Math.random()*C|0,y=Math.random()*R|0;if(g0[y][x].m||Math.abs(x-sx)<=1&&Math.abs(y-sy)<=1)continue;g0[y][x].m=1;n++}g0.forEach((r,y)=>r.forEach((c,x)=>{c.n=0;nb(x,y,o=>c.n+=o.m)}))}
function open(x,y){const c=g0[y][x];if(c.o||c.f)return;c.o=1;dc++;if(c.n===0&&!c.m)nb(x,y,(o,i,j)=>open(i,j))}
function tapCell(x,y,flag){const c=g0[y]&&g0[y][x];if(!c||done)return;if(flag||flagMode){if(!c.o){c.f=!c.f;A.beep(700,.04)}return}if(c.f)return;if(first){first=0;plant(x,y)}
 if(c.o&&c.n){let f=0;nb(x,y,o=>f+=o.f);if(f===c.n)nb(x,y,(o,i,j)=>{if(!o.f&&!o.o){if(o.m)lose();else open(i,j)}});return}
 if(c.m)return lose();open(x,y);A.beep(400,.03,'triangle');if(dc===C*R-M){done=1;A.slide(500,1500,.4,'sine');setTimeout(()=>A.over(dc+Math.max(0,300-Math.floor(time))),900)}}
function lose(){done=1;lost=1;g0.forEach(r=>r.forEach(c=>{if(c.m)c.o=1}));A.slide(300,40,.5,'sawtooth');setTimeout(()=>A.over(dc),1100)}
const cell=(x,y)=>[Math.floor((x-OX)/S),Math.floor((y-OY)/S)];
return{help:'Tap to dig. Long-press or use the 🚩 toggle to flag. Clear every safe cell.',
reset(){g0=Array.from({length:R},()=>Array.from({length:C},()=>({m:0,o:0,f:0,n:0})));first=1;flagMode=0;time=0;done=0;dc=0;lost=0},
down(x,y){if(y>H-40){if(x>W/2-60&&x<W/2+60){flagMode^=1;A.beep(900,.04)}return}hold={x,y,t:0,fired:0}},
up(x,y){if(!hold)return;const h=hold;hold=null;if(h.fired)return;const[i,j]=cell(h.x,h.y);tapCell(i,j,0)},
press(k){if(k==='f')flagMode^=1},
update(dt){if(!first&&!done)time+=dt;if(hold&&!hold.fired&&(hold.t+=dt)>.4){hold.fired=1;const[i,j]=cell(hold.x,hold.y);tapCell(i,j,1)}},
draw(g){g.fillStyle='#c0c0c0';g.fillRect(0,0,W,H);const NC=['','#0000ff','#008000','#ff0000','#000080','#800000','#008080','#000','#808080'];
 g0.forEach((r,y)=>r.forEach((c,x)=>{const X=OX+x*S,Y=OY+y*S;if(c.o){g.fillStyle=c.m?(lost?'#f55':'#ddd'):'#ddd';g.fillRect(X,Y,S,S);g.strokeStyle='#999';g.strokeRect(X+.5,Y+.5,S-1,S-1);g.textAlign='center';g.font='bold 18px Helvetica';if(c.m){g.fillStyle='#000';g.beginPath();g.arc(X+S/2,Y+S/2,8,0,7);g.fill()}else if(c.n){g.fillStyle=NC[c.n];g.fillText(c.n,X+S/2,Y+S/2+6)}}
  else{g.fillStyle='#bdbdbd';g.fillRect(X,Y,S,S);g.fillStyle='#fff';g.fillRect(X,Y,S,3);g.fillRect(X,Y,3,S);g.fillStyle='#7b7b7b';g.fillRect(X,Y+S-3,S,3);g.fillRect(X+S-3,Y,3,S);if(c.f){g.fillStyle='#f00';g.beginPath();g.moveTo(X+12,Y+8);g.lineTo(X+24,Y+13);g.lineTo(X+12,Y+18);g.fill();g.fillStyle='#000';g.fillRect(X+11,Y+8,2,18)}}}));
 let fl=0;g0.forEach(r=>r.forEach(c=>fl+=c.f));A.txt('💣 '+(M-fl),10,26,16);A.txt('⏱ '+Math.floor(time),W-10,26,16,'#fff','right');
 g.fillStyle=flagMode?'#d33':'#666';g.fillRect(W/2-60,H-36,120,28);A.txt(flagMode?'🚩 Flag mode ON':'⛏ Dig mode',W/2,H-17,13,'#fff','center')}}});
