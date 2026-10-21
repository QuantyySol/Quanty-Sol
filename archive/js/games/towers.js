/* Tower Guard: tap empty grass to build towers (25 gold) that zap creeps walking the road. Don't let 10 through. */
SB.reg('towers',A=>{const{W,H}=A,C=32,PATH=[[0,2],[7,2],[7,6],[2,6],[2,10],[8,10],[8,13]];let road,tw,cr,sh,gold,lives,wave,spawn,left,score,tWave;
function cells(){road=new Set();for(let i=0;i<PATH.length-1;i++){let[x,y]=PATH[i];const[x2,y2]=PATH[i+1];while(x!=x2||y!=y2){road.add(x+','+y);x+=Math.sign(x2-x);y+=Math.sign(y2-y)}road.add(x2+','+y2)}}
const pt=i=>[PATH[i][0]*C+C/2,PATH[i][1]*C+C/2+20];
return{help:'Tap grass to build a tower (25 gold). Stop the creeps on the road.',
reset(){cells();tw=[];cr=[];sh=[];gold=75;lives=10;wave=0;left=0;spawn=0;score=0;tWave=2},
down(x,y){const i=Math.floor(x/C),j=Math.floor((y-20)/C);if(j<0||j>12||i>9)return;const t=tw.find(t=>t.i==i&&t.j==j);if(t){if(gold>=30&&t.lv<3){gold-=30;t.lv++;A.beep(1000,.08)}return}if(road.has(i+','+j)||gold<25){A.beep(120,.05);return}gold-=25;tw.push({i,j,lv:1,cd:0});A.beep(700,.08,'triangle')},
update(dt){if(!left&&!cr.length){tWave-=dt;if(tWave<=0){wave++;left=5+wave*2;spawn=0;tWave=3}}
 if(left){spawn-=dt;if(spawn<=0){spawn=Math.max(.35,.9-wave*.04);left--;const hp=20+wave*wave*4;cr.push({s:0,seg:0,hp,mx:hp,sp:40+wave*2,x:pt(0)[0],y:pt(0)[1]})}}
 for(const c of cr){let mv=c.sp*dt;while(mv>0&&c.seg<PATH.length-1){const[tx,ty]=pt(c.seg+1),d=Math.hypot(tx-c.x,ty-c.y);if(d<=mv){c.x=tx;c.y=ty;c.seg++;mv-=d}else{c.x+=(tx-c.x)/d*mv;c.y+=(ty-c.y)/d*mv;mv=0}}if(c.seg>=PATH.length-1){c.gone=1;lives--;A.beep(100,.2,'sawtooth');if(lives<=0)return A.over(score)}}
 for(const t of tw){t.cd-=dt;if(t.cd>0)continue;const x=t.i*C+C/2,y=t.j*C+C/2+20,R=70+t.lv*12;let tg=null;for(const c of cr)if(!c.gone&&c.hp>0&&Math.hypot(c.x-x,c.y-y)<R&&(!tg||c.seg>tg.seg))tg=c;if(tg){tg.hp-=6*t.lv;t.cd=.45;sh.push({x,y,x2:tg.x,y2:tg.y,t:.08});A.beep(1400,.02,'square',.02)}}
 cr.forEach(c=>{if(c.hp<=0&&!c.gone){c.gone=1;gold+=4+wave;score+=10}});cr=cr.filter(c=>!c.gone);sh.forEach(s=>s.t-=dt);sh=sh.filter(s=>s.t>0)},
draw(g){g.fillStyle='#4f9a3a';g.fillRect(0,0,W,H);g.fillStyle='#c9a66b';road.forEach(k=>{const[i,j]=k.split(',').map(Number);g.fillRect(i*C,j*C+20,C,C)});g.strokeStyle='rgba(0,0,0,.08)';for(let i=0;i<=10;i++){g.beginPath();g.moveTo(i*C,20);g.lineTo(i*C,H);g.stroke()}
 tw.forEach(t=>{const x=t.i*C,y=t.j*C+20;g.fillStyle='#777';g.fillRect(x+6,y+8,20,20);g.fillStyle=['','#5cc8ff','#ffd23f','#ff6bd6'][t.lv];g.beginPath();g.arc(x+16,y+10,7,0,7);g.fill();g.fillStyle='#555';g.fillRect(x+4,y+24,24,6)});
 cr.forEach(c=>{g.fillStyle='#8a2be2';g.beginPath();g.arc(c.x,c.y,9,0,7);g.fill();g.fillStyle='#fff';g.fillRect(c.x-4,c.y-3,3,3);g.fillRect(c.x+2,c.y-3,3,3);g.fillStyle='#000';g.fillRect(c.x-9,c.y-15,18,3);g.fillStyle='#3f3';g.fillRect(c.x-9,c.y-15,18*c.hp/c.mx,3)});
 g.strokeStyle='#bff';g.lineWidth=2;sh.forEach(s=>{g.beginPath();g.moveTo(s.x,s.y);g.lineTo(s.x2,s.y2);g.stroke()});
 g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,W,20);A.txt('🪙'+gold,6,15,13,'#ffd75f');A.txt('Wave '+wave,W/2,15,13,'#fff','center');A.txt('♥'+lives,W-6,15,13,'#f66','right');if(!tw.length)A.txt('Tap grass to build · tap tower to upgrade (30)',W/2,H-10,10,'#fff','center')}}});
