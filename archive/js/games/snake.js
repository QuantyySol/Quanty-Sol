/* Snake: eat apples, avoid your own tail. Golden apples are worth 5 and vanish. */
SB.reg('snake',A=>{const{W,H}=A,C=16,GW=20,GH=26,OY=24;let s,d,nd,f,gold,t,score,sx,sy;
const rnd=()=>{let p;do p=[Math.random()*GW|0,Math.random()*GH|0];while(s.some(q=>q[0]==p[0]&&q[1]==p[1]));return p};
function turn(x,y){if(x===-d[0]&&y===-d[1])return;nd=[x,y]}
return{help:'Swipe or arrows to steer. Eat apples and grow.',
reset(){s=[[10,13],[9,13],[8,13]];d=[1,0];nd=d;f=rnd();gold=null;t=0;score=0},
press(k){({ArrowUp:()=>turn(0,-1),ArrowDown:()=>turn(0,1),ArrowLeft:()=>turn(-1,0),ArrowRight:()=>turn(1,0),w:()=>turn(0,-1),s:()=>turn(0,1),a:()=>turn(-1,0),d:()=>turn(1,0)}[k]||(()=>0))()},
down(x,y){sx=x;sy=y},move(x,y,dn){if(!dn||sx==null)return;const dx=x-sx,dy=y-sy;if(Math.abs(dx)+Math.abs(dy)<18)return;Math.abs(dx)>Math.abs(dy)?turn(Math.sign(dx),0):turn(0,Math.sign(dy));sx=x;sy=y},up(){sx=null},
update(dt){t+=dt;const step=Math.max(.06,.14-score*.0015);if(t<step)return;t=0;d=nd;const h=[(s[0][0]+d[0]+GW)%GW,(s[0][1]+d[1]+GH)%GH];
 if(s.some(q=>q[0]==h[0]&&q[1]==h[1]))return A.over(score);s.unshift(h);
 if(h[0]==f[0]&&h[1]==f[1]){score++;A.beep(880,.06);f=rnd();if(!gold&&Math.random()<.2)gold={p:rnd(),t:6}}
 else if(gold&&h[0]==gold.p[0]&&h[1]==gold.p[1]){score+=5;A.slide(600,1800,.2);gold=null;s.push(s[s.length-1])}else s.pop();
 if(gold&&(gold.t-=step)<=0)gold=null},
draw(g){g.fillStyle='#9bbc0f';g.fillRect(0,0,W,H);g.fillStyle='#8bac0f';for(let i=0;i<GW;i++)for(let j=0;j<GH;j++)if((i+j)%2)g.fillRect(i*C,OY+j*C,C,C);
 g.fillStyle='#306230';g.fillRect(0,0,W,OY);A.txt('SCORE '+score,8,17,14,'#e0f8d0');A.txt('BEST '+A.hi(),W-8,17,12,'#e0f8d0','right');
 const apl=(p,c)=>{g.fillStyle=c;g.beginPath();g.arc(p[0]*C+8,OY+p[1]*C+8,6,0,7);g.fill();g.fillStyle='#3a2';g.fillRect(p[0]*C+7,OY+p[1]*C,2,4)};
 apl(f,'#d8202a');if(gold)apl(gold.p,'#e0a800');
 s.forEach((q,i)=>{g.fillStyle=i?'#0f380f':'#081808';g.fillRect(q[0]*C+1,OY+q[1]*C+1,C-2,C-2)});const h=s[0];g.fillStyle='#e0f8d0';g.fillRect(h[0]*C+4+d[0]*3,OY+h[1]*C+4+d[1]*3,3,3);g.fillRect(h[0]*C+9+d[0]*3,OY+h[1]*C+9+d[1]*3,3,3)}}});
