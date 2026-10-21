/* Memory: flip two cards, find the pairs. Fewer flips and faster = more points. */
SB.reg('memory',A=>{const{W,H}=A,S=['🍎','🍌','🍇','🍒','🍋','🥝','🍉','🍓','🍑','🍍'];let cs,open,lock,flips,time,round,score;
function deal(){const n=Math.min(10,4+round*2),p=S.slice(0,n);cs=[...p,...p].sort(()=>Math.random()-.5).map(s=>({s,up:0,done:0}));open=[]}
const geo=()=>{const n=cs.length,c=4,r=Math.ceil(n/c),w=70,h=Math.min(78,(H-60)/r-8);return{c,w,h,ox:(W-c*w-(c-1)*6)/2,oy:44}};
return{help:'Flip cards to find matching pairs. Clear the board to deal a bigger one.',
reset(){round=0;score=0;flips=0;time=0;lock=0;deal()},
down(x,y){if(lock)return;const G=geo(),i=Math.floor((x-G.ox)/(G.w+6)),j=Math.floor((y-G.oy)/(G.h+8)),k=j*G.c+i;if(i<0||i>=G.c||j<0||!cs[k]||cs[k].up||cs[k].done)return;cs[k].up=1;open.push(k);flips++;A.beep(500,.04,'triangle');
 if(open.length==2){const[a,b]=open;if(cs[a].s===cs[b].s){cs[a].done=cs[b].done=1;open=[];score+=10;A.beep(880,.1,'sine');if(cs.every(c=>c.done)){score+=Math.max(0,60-Math.floor(time))+20*round;round++;if(round>3)return A.over(score);setTimeout(deal,500);time=0}}else{lock=1;setTimeout(()=>{cs[a].up=cs[b].up=0;open=[];lock=0},650)}}},
update(dt){time+=dt},
draw(g){g.fillStyle='#0d5a2a';g.fillRect(0,0,W,H);const G=geo();cs.forEach((c,k)=>{const x=G.ox+(k%G.c)*(G.w+6),y=G.oy+Math.floor(k/G.c)*(G.h+8);g.fillStyle=c.up||c.done?'#fff':'#2a5ac8';g.fillRect(x,y,G.w,G.h);g.strokeStyle='#fff';g.lineWidth=2;g.strokeRect(x,y,G.w,G.h);
 if(c.up||c.done){g.globalAlpha=c.done?.5:1;g.font=(G.h*.5|0)+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(c.s,x+G.w/2,y+G.h/2);g.textBaseline='alphabetic';g.globalAlpha=1}else{g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x+6,y+6,G.w-12,G.h-12)}});
 A.txt('Score '+score,8,26,16);A.txt('Round '+(round+1)+'/4',W-8,26,14,'#fff','right')}}});
