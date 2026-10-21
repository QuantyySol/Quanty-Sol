/* Gems: swap neighbours to line up 3+. 60 seconds; cascades multiply. */
SB.reg('gems',A=>{const{W,H}=A,N=8,S=38,OX=(W-N*S)/2,OY=70,CL=['#ff4d5e','#ffb03a','#ffe03f','#3fd27a','#4aa8ff','#b56bff','#f4f4f4'];let b,sel,time,score,busy,fx,sx,sy,chain;
const rnd=()=>Math.random()*7|0;
function matches(){const m=new Set();for(let y=0;y<N;y++)for(let x=0;x<N;x++){const c=b[y][x];if(c<0)continue;if(x<N-2&&b[y][x+1]==c&&b[y][x+2]==c)[0,1,2].forEach(i=>m.add(y*N+x+i));if(y<N-2&&b[y+1][x]==c&&b[y+2][x]==c)[0,1,2].forEach(i=>m.add((y+i)*N+x))}return m}
function fill(){for(let x=0;x<N;x++){const col=[];for(let y=N-1;y>=0;y--)if(b[y][x]>=0)col.push(b[y][x]);for(let y=N-1,i=0;y>=0;y--,i++)b[y][x]=i<col.length?col[i]:rnd()}}
function resolve(){const m=matches();if(!m.size){busy=0;chain=0;return}chain++;score+=m.size*10*chain;A.beep(500+chain*150,.1,'triangle');m.forEach(k=>{b[k/N|0][k%N]=-1;fx.push({x:OX+(k%N)*S+S/2,y:OY+(k/N|0)*S+S/2,t:.3})});setTimeout(()=>{fill();setTimeout(resolve,180)},180)}
function swap(a,c){if(busy)return;const[ax,ay]=a,[cx,cy]=c;if(Math.abs(ax-cx)+Math.abs(ay-cy)!==1||cx<0||cy<0||cx>=N||cy>=N)return;const t=b[ay][ax];b[ay][ax]=b[cy][cx];b[cy][cx]=t;if(!matches().size){b[cy][cx]=b[ay][ax];b[ay][ax]=t;A.beep(150,.08);return}busy=1;sel=null;resolve()}
const cell=(x,y)=>[Math.floor((x-OX)/S),Math.floor((y-OY)/S)];
return{help:'Swap neighbouring gems (tap two, or swipe) to make lines of 3. 60 seconds.',
reset(){b=Array.from({length:N},()=>Array.from({length:N},rnd));let g=0;while(matches().size&&g++<50){matches().forEach(k=>b[k/N|0][k%N]=rnd())}time=60;score=0;sel=null;busy=0;fx=[];chain=0},
down(x,y){const c=cell(x,y);if(c[0]<0||c[1]<0||c[0]>=N||c[1]>=N)return;sx=x;sy=y;if(sel&&Math.abs(sel[0]-c[0])+Math.abs(sel[1]-c[1])===1){swap(sel,c);sel=null}else sel=c},
move(x,y,d){if(!d||sx==null||!sel)return;const dx=x-sx,dy=y-sy;if(Math.hypot(dx,dy)<S*.5)return;const c=Math.abs(dx)>Math.abs(dy)?[sel[0]+Math.sign(dx),sel[1]]:[sel[0],sel[1]+Math.sign(dy)];swap(sel,c);sx=null;sel=null},up(){sx=null},
update(dt){time-=dt;fx.forEach(f=>f.t-=dt);fx=fx.filter(f=>f.t>0);if(time<=0&&!busy)A.over(score)},
draw(g){g.fillStyle='#1a0f2e';g.fillRect(0,0,W,H);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const X=OX+x*S,Y=OY+y*S;g.fillStyle=(x+y)%2?'#2a1d46':'#33255a';g.fillRect(X,Y,S,S);const c=b[y][x];if(c<0)continue;
 g.fillStyle=CL[c];g.beginPath();const cx=X+S/2,cy=Y+S/2,r=S*.38;if(c%3==0){g.moveTo(cx,cy-r);g.lineTo(cx+r,cy);g.lineTo(cx,cy+r);g.lineTo(cx-r,cy)}else if(c%3==1){g.arc(cx,cy,r,0,7)}else{for(let i=0;i<6;i++)g.lineTo(cx+r*Math.cos(i*1.047),cy+r*Math.sin(i*1.047))}g.fill();g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.arc(cx-r*.3,cy-r*.3,r*.25,0,7);g.fill()}
 if(sel){g.strokeStyle='#fff';g.lineWidth=3;g.strokeRect(OX+sel[0]*S+2,OY+sel[1]*S+2,S-4,S-4)}fx.forEach(f=>{g.fillStyle=`rgba(255,255,255,${f.t*3})`;g.beginPath();g.arc(f.x,f.y,(.3-f.t)*80,0,7);g.fill()});
 A.txt('Score '+score,10,40,18);A.txt(Math.max(0,Math.ceil(time))+'s',W-10,40,18,time<10?'#f66':'#fff','right');if(chain>1)A.txt('Chain x'+chain,W/2,H-40,18,'#ffe03f','center')}}});
