/* interact.js : tap / double-tap / headpat the agents in both rooms, agent-to-agent chats, high-fives on wins,
   Ledger grumbles on losses, idle mini-animations. Dragging + toss physics live in the core and breakroom.js.
   Uses window.Desk + Desk.brk. View only, paper trading only. */
(function(){
'use strict';
if(!window.Desk||!Desk.office||!Desk.brk){console.warn('interact: Desk/brk missing');return}
const O=Desk.office,B=Desk.brk,pick=a=>a[Math.random()*a.length|0],K=()=>O.mobile?1:1.25;
const TAP={ledger:['What. I am busy.','Do not poke the analyst.','Statistically, that was a poke.','I bill by the poke.'],
 twitter:['HI HI HI!!!','YOU FOUND ME!!!','POST THIS INTERACTION','WE ARE SO BACK'],
 designer:['Hi! Mind the padding.','Boop. Very tactile.','Love that tap target size.','Do you like the aurora?'],
 launcher:['Tap confirmed. Hype levels rising!','Careful, that is the concept hand.','You have taste. I can tell.','Zero supply, fees only, full send on vibes.'],
 quanty:['Hi! Paper trades only.','Beep. Scanning the boards.','Quant hello!','Patience is a position.']};
const PAT={ledger:['…fine. That is nice.','*grumbles happily*','Do not tell Twitter.'],twitter:['HEADPATS GO VIRAL!!!','10/10 WOULD PAT AGAIN'],designer:['Careful, the beret!','Aww. Pixel-perfect pat.'],quanty:['Beep boop :)','Affection logged.'],launcher:['Hood up, heart full.','Headpat noted in the concept log.']};
const DANCE={ledger:['*reluctant shuffle*','This is not a dance. It is a rebalance.'],twitter:['DANCE BREAK!!!','VIBES ONLY!!!'],designer:['Motion design!','Easing: cubic-bezier.'],quanty:['Robot dance mode.','Executing groove.'],launcher:['LIFTOFF SHUFFLE!','Countdown dance: 3, 2, 1…']};
const HEAD={quanty:62,ledger:62,twitter:48,designer:52,launcher:54};
function officeAgents(){const A=B.agents(),out=[];['ledger','twitter','designer'].forEach(n=>{const a=A[n];if(a&&a.room!=='brk')out.push({a,n,x:a.x,y:a.y,hc:a.hc||HEAD[n],sw:a.sw||26})});
 if(Desk.quanty)out.push({a:A.quanty,n:'quanty',x:Desk.quanty.x,y:Desk.quanty.y,hc:62,sw:30,q:true});return out}
function brkAgents(){const A=B.agents(),out=[];Object.keys(A).forEach(n=>{const a=A[n];if(a&&a.room==='brk'&&a.br)out.push({a,n,x:a.br.x,y:a.br.y,hc:a.hc||HEAD[n],sw:a.sw||26})});return out}
function hit(list,p){let best=null,bd=1e9;list.forEach(e=>{const k=K(),top=e.y-(e.hc*2+30)*k;if(p.y<top||p.y>e.y+12)return;const dx=Math.abs(p.x-e.x);if(dx<e.sw*k+26&&dx<bd){bd=dx;best=e;best.head=p.y<e.y-e.hc*1.45*k}});return best}
function say(e,t,ms){B.say(e.a,t,ms||2600)}
function bounce(e){if(e.q){try{Desk.quanty.jump=36}catch(_){}}else e.a.jump=30}
function react(room,e,kind){const n=e.n,k=K(),hy=e.y-(e.hc*2+10)*k;
 if(kind==='pat'){say(e,pick(PAT[n]),2600);B.fx(room,e.x,hy,'heart');if(!e.q){e.a.mood=1;setTimeout(()=>{e.a.mood=0},2500)}}
 else if(kind==='dance'){say(e,pick(DANCE[n]),2600);if(!e.q)e.a.dance=110;bounce(e);B.fx(room,e.x,hy,'note')}
 else{say(e,pick(TAP[n]),2400);bounce(e)}}
/* gesture detection (single tap waits briefly so a double-tap can win) */
function bind(el,room,toC,list){let dn=null,last=null,tmr=0;
 el.addEventListener('pointerdown',ev=>{dn={x:ev.clientX,y:ev.clientY,t:performance.now()}});
 el.addEventListener('pointerup',ev=>{if(!dn)return;const ok=Math.hypot(ev.clientX-dn.x,ev.clientY-dn.y)<8&&performance.now()-dn.t<400;dn=null;if(!ok)return;
  if(room==='brk'&&B.view()!=='brk')return;if(room==='office'&&B.view()==='brk')return;
  const e=hit(list(),toC(ev.clientX,ev.clientY));if(!e)return;const now=performance.now();
  if(last&&last.n===e.n&&now-last.t<320){clearTimeout(tmr);last=null;react(room,e,'dance');return}
  last={n:e.n,t:now};clearTimeout(tmr);tmr=setTimeout(()=>{last=null;react(room,e,e.head?'pat':'tap')},260)})}
bind(O.canvas,'office',(x,y)=>O.toCanvas(x,y),officeAgents);bind(B.canvas,'brk',B.toCanvas,brkAgents);
/* agent-to-agent chats */
const CHATS=[['ledger','twitter','Your win rate is a vibe, not a number.','VIBES ARE A NUMBER IF YOU BELIEVE!!!'],['twitter','ledger','LEDGER SMILE FOR THE TIMELINE','No.'],
 ['designer','ledger','Can I make your calculator glow more?','Only if it improves accuracy.'],['twitter','designer','MAKE ME A BANNER!!!','Only if you stop using all caps.'],
 ['designer','twitter','New dock, thoughts?','IT SLAPS!!!'],['ledger','designer','Your palette has 4 colors. Small n.','It is called restraint.'],
 ['quanty','ledger','Fridge again?','Research. Snack-side research.'],['quanty','twitter','No financial advice, remember.','PAPER ONLY, I KNOW!!!'],
 ['launcher','designer','Need a logo that reads at 32px.','Give me the name first.'],['twitter','launcher','IS THIS ONE THE ONE?!','Concepts only. Simulated. But the name slaps.'],
 ['launcher','ledger','Rate this name 1 to 10.','I rate names 0. I rate data.'],['designer','launcher','Your hoodie is very on-brand.','The hoodie IS the brand.']];
function chat(){const lists={office:officeAgents(),brk:brkAgents()};const room=Math.random()<.5?'office':'brk',L=lists[room];if(L.length<2)return;
 const ok=CHATS.filter(c=>L.some(e=>e.n===c[0])&&L.some(e=>e.n===c[1]));if(!ok.length)return;const c=pick(ok),A=L.find(e=>e.n===c[0]),Bb=L.find(e=>e.n===c[1]);
 if(!A.q&&A.a.state==='held')return;say(A,c[2],3000);setTimeout(()=>say(Bb,c[3],3000),2300)}
setInterval(chat,32000);setTimeout(chat,12000);
/* high-fives on wins, grumbles on losses */
Desk.on('trade',t=>{const win=t.side!=='BUY'&&t.pnl_pct!=null&&t.pnl_pct>=0,loss=t.side==='STOP'||t.side==='TRAIL'||(t.pnl_pct!=null&&t.pnl_pct<0);const A=B.agents();
 if(win)setTimeout(()=>{const l=A.ledger,tw=A.twitter;if(!l||!tw)return;const x=(l.x+tw.x)/2,y=Math.min(l.y,tw.y)-110*K();B.fx('office',x,y,'star');tw.say&&tw.say('HIGH FIVE!!!',2400);setTimeout(()=>l.say&&l.say('…fine. Five.',2200),600);if(A.designer){A.designer.jump=30;A.designer.say&&A.designer.say('Yay! ✨',2000)}},3000);
 if(loss)setTimeout(()=>{const l=A.ledger;l&&l.say&&l.say(pick(['*grumble* I said small n.','My spreadsheet weeps.','Logging the pain.','Ugh. Fees AND a loss.']),3000,'#ff5c6c')},4200)});
/* idle mini-animations */
setInterval(()=>{const L=officeAgents().filter(e=>!e.q&&e.a.state==='idle');if(!L.length)return;const e=pick(L);if(Math.random()<.6)e.a.jump=14;else e.a.dance=40},7000);
})();
