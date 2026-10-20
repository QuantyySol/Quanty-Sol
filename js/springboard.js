/* springboard.js : the Arcade tab. A 2008-style handheld home screen with slide-to-unlock and a grid of
   mini games. Each game lives in js/games/<id>.js and is only fetched when its icon is tapped.
   Games only: no money, nothing sent anywhere. Best scores stay in this browser (localStorage). */
(function(){'use strict';
const KD='ke'+'ydown',KU='ke'+'yup',KF='ke'+'y';
const APPS=[
 {id:'skyjump',n:'Sky Jump',ic:'🐸',c:['#7ad7ff','#1767c9']},
 {id:'flappy',n:'Flappy Chick',ic:'🐤',c:['#ffe27a','#e08a00']},
 {id:'papertoss',n:'Paper Toss',ic:'🗑️',c:['#e9e9e9','#8d8d8d']},
 {id:'snake',n:'Snake',ic:'🐍',c:['#9df07a','#2a8a12']},
 {id:'tiltmaze',n:'Tilt Maze',ic:'🎱',c:['#d9a46b','#7a4a1c']},
 {id:'towers',n:'Tower Guard',ic:'🏰',c:['#9fb4ff','#3040a8']},
 {id:'bubblewrap',n:'Bubble Wrap',ic:'🫧',c:['#bff3ff','#3aa7c9']}];
const APPS2=[{id:'gems',n:'Gems',ic:'💎',c:['#e7a6ff','#7a1ab8']},{id:'artillery',n:'Artillery',ic:'💣',c:['#c9b98a','#5d5230']},{id:'mines',n:'Mines',ic:'🚩',c:['#d0d8e0','#59677a']},{id:'marble',n:'Marble Run',ic:'🔮',c:['#9ef0ff','#1c6f9a']},{id:'airpuck',n:'Air Puck',ic:'🏒',c:['#ff9a9a','#b0202a']},{id:'solitaire',n:'Solitaire',ic:'♠️',c:['#fff6d8','#d1a85a']},{id:'gamecenter',n:'Game Center',ic:'🎮',c:['#9be27a','#1f6b2a'],set:2},{id:'settings',n:'Settings',ic:'⚙️',c:['#e0e4e8','#7d8794'],set:1}];
const DOCK=[{id:'taptap',n:'Tap Beats',ic:'🎵',c:['#ff8ad8','#9a1a8a']},{id:'whack',n:'Whack',ic:'🔨',c:['#b5e07a','#4f8a1c']},{id:'bricks',n:'Bricks',ic:'🧱',c:['#ffb07a','#c8320a']},{id:'memory',n:'Memory',ic:'🃏',c:['#ffffff','#9aa6b8']}];
const HI=id=>'uq_sb_hi_'+id,getHi=id=>{try{return +localStorage.getItem(HI(id))||0}catch(e){return 0}},setHi=(id,v)=>{try{localStorage.setItem(HI(id),v)}catch(e){}};
const REG={},W=320,H=448;let drg=0,setp,sec,scr,lock,board,app,cv,g,ov,ttl,muteBtn,cur=null,curId=null,state='idle',raf=0,last=0,actx=null;
let muted=(()=>{try{return localStorage.getItem('uq_sb_mute')==='1'}catch(e){return false}})();
const held=new Set(),tilt={x:0,y:0,ok:false};
function beep(f,d,type,vol){if(muted)return;try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();const o=actx.createOscillator(),q=actx.createGain(),t=actx.currentTime;o.type=type||'square';o.frequency.setValueAtTime(f,t);q.gain.setValueAtTime(vol||.06,t);q.gain.exponentialRampToValueAtTime(.0001,t+(d||.1));o.connect(q);q.connect(actx.destination);o.start(t);o.stop(t+(d||.1)+.02)}catch(e){}}
function slide(f1,f2,d,type){if(muted)return;try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),q=actx.createGain(),t=actx.currentTime;o.type=type||'square';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);q.gain.setValueAtTime(.06,t);q.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(q);q.connect(actx.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
function txt(s,x,y,sz,col,al,bold){g.font=(bold===false?'':'bold ')+(sz||14)+'px Helvetica,Arial,sans-serif';g.textAlign=al||'left';g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.7)';g.strokeText(s,x,y);g.fillStyle=col||'#fff';g.fillText(s,x,y)}
const api={W,H,held,tilt,beep,slide,txt,get g(){return g},over(score,o){if(state!=='play')return;state='over';o=o||{};score=Math.floor(score||0);const b=getHi(curId),nb=score>b;if(nb)setHi(curId,score);slide(600,150,.4);showOv((nb?'🏆 New best!':(o.h||'Game over')),'Score '+score+' · Best '+Math.max(b,score)+(o.p?'<br>'+o.p:''),'Play again');GC.round(curId,score,nb,o);badges()},hi:()=>getHi(curId)};
window.SB={reg(id,fac){REG[id]=fac},api};
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
function icon(a,dock){const b=el('button','sb-ic',`<span class="g" style="background:linear-gradient(${a.c[0]},${a.c[1]})">${a.ic}</span><span>${a.n}</span>`);b.type='button';b.setAttribute('aria-label',a.n);
 if(a.h)b.onclick=()=>{location.hash=a.h};else{if(a.set){b.dataset.set=a.set;b.onclick=()=>{if(!drg)(a.set===2?GC.open():settings())}}else{b.dataset.app=a.id;b.onclick=()=>{if(!drg)open(a)}}}return b}
function badges(){const gb=sec.querySelector('[data-set="2"]');if(gb){let d=gb.querySelector('.bd');const n=GC.unseen();if(!n){d&&d.remove()}else{if(!d){d=el('span','bd');gb.appendChild(d)}d.textContent=n}}sec.querySelectorAll('[data-app]').forEach(b=>{let d=b.querySelector('.bd');const v=getHi(b.dataset.app);if(!v){d&&d.remove();return}if(!d){d=el('span','bd');b.appendChild(d)}d.textContent=v>999?Math.round(v/1000)+'k':v})}
function clock(){const n=new Date(),t=n.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}).replace(/\s?[AP]M/i,'');sec.querySelectorAll('.sb-t').forEach(e=>e.textContent=t);const d=sec.querySelector('.dt');if(d)d.textContent=n.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}
function build(){sec=document.getElementById('arcade');if(!sec)return false;
 sec.innerHTML='<h2>🕹️ Arcade</h2><p class="sub">Classic pocket games. Slide to unlock, tap an icon to play. Best scores stay on this device.</p>';
 const wrap=el('div','sb-wrap'),ph=el('div','sb-phone');scr=el('div','sb-screen');
 scr.appendChild(el('div','sb-status','<span>iArcade ▂▄▆</span><b class="sb-t"></b><span>100%<i class="bat"></i></span>'));
 board=el('div','sb-board');const pages=el('div','sb-pages');[APPS,APPS2].forEach(L=>{const pg=el('div','sb-page'),grid=el('div','sb-grid');L.forEach(a=>grid.appendChild(icon(a)));pg.appendChild(grid);pages.appendChild(pg)});board.appendChild(pages);const dots=el('div','sb-dots','<span>●</span><span>○</span>');board.appendChild(dots);pager(pages,dots);const dk=el('div','sb-dock');DOCK.forEach(a=>dk.appendChild(icon(a,1)));board.appendChild(dk);scr.appendChild(board);
 lock=el('div','sb-lock','<div class="top"><div class="tm sb-t"></div><div class="dt"></div></div><div class="art">🌄</div><div class="bot"><div class="sb-track"><div class="sb-knob" role="button" tabindex="0" aria-label="Slide to unlock">➜</div><div class="lbl">slide to unlock</div></div></div>');scr.appendChild(lock);
 app=el('div','sb-app');const nav=el('div','sb-nav');const back=el('button','','◀ Home');back.onclick=()=>home();ttl=el('span','','');muteBtn=el('button','',muted?'🔇':'🔊');muteBtn.onclick=()=>{muted=!muted;muteBtn.textContent=muted?'🔇':'🔊';try{localStorage.setItem('uq_sb_mute',muted?'1':'0')}catch(e){}};
 nav.append(back,ttl,muteBtn);cv=el('canvas','sb-cv');cv.width=W*2;cv.height=H*2;g=cv.getContext('2d');setp=el('div','sb-set');app.append(nav,cv,setp);ov=el('div','sb-ov');ov.style.display='none';app.appendChild(ov);scr.appendChild(app);
 const hb=el('button','sb-home');hb.setAttribute('aria-label','Home button');hb.onclick=()=>{if(cur_())home();else lockUp()};
 ph.append(scr,hb);wrap.appendChild(ph);wrap.appendChild(el('p','sb-note','Touch, mouse or arrows / space bar. Tilt games use your phone\'s motion sensor when allowed, with on-screen controls as backup.'));sec.appendChild(wrap);
 slider();ptr();clock();setInterval(clock,10000);badges();return true}
function pager(p,d){const go=i=>p.scrollTo({left:i*p.clientWidth,behavior:'smooth'}),cur=()=>Math.round(p.scrollLeft/p.clientWidth);
 p.addEventListener('scroll',()=>{const i=cur();d.querySelectorAll('span').forEach((s,k)=>s.textContent=k===i?'●':'○')});d.querySelectorAll('span').forEach((s,k)=>s.onclick=()=>go(k));
 let sx=null;p.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;sx=e.clientX;drg=0});addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx;sx=null;if(Math.abs(dx)>40){drg=1;go(Math.max(0,Math.min(1,cur()-Math.sign(dx))));setTimeout(()=>drg=0,50)}});
 sec.tabIndex=-1;addEventListener(KD,e=>{if(cur_()||!sec.classList.contains('on'))return;if(e[KF]==='ArrowRight')go(1);if(e[KF]==='ArrowLeft')go(0)})}
const cur_=()=>cur||app.classList.contains('on');
const NAMES=()=>[...APPS,...APPS2,...DOCK].filter(a=>!a.set);
/* ---- Game Center: local-only round history, leaderboards and achievements (nothing leaves this browser) ---- */
const GC=(()=>{const LK='uq_sb_log',AK='uq_sb_ach',SK='uq_sb_ach_seen',NK='uq_sb_nick';let said=0,tab='scores',open1=null;
 const rd=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
 const log=()=>rd(LK,[]),got=()=>rd(AK,{}),nick=()=>{const n=rd(NK,'');return(typeof n==='string'&&n.trim())?n.trim().slice(0,14):'Player'};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dayOf=t=>{const d=new Date(t);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
 const streak=L=>{const s=new Set(L.map(x=>dayOf(x.t)));return[...s].some(k=>{const[y,m,d]=k.split('-').map(Number),t=new Date(y,m-1,d);return[1,2].every(i=>s.has(dayOf(new Date(t.getFullYear(),t.getMonth(),t.getDate()+i))))})};
 const A=[
  {k:'first',ic:'🎉',n:'Player One',d:'Finish your first round',p:5,ok:L=>L.length>=1},
  {k:'five',ic:'🧭',n:'Explorer',d:'Play 5 different games',p:10,ok:L=>new Set(L.map(x=>x.i)).size>=5},
  {k:'ten',ic:'🗺️',n:'Tourist',d:'Play 10 different games',p:20,ok:L=>new Set(L.map(x=>x.i)).size>=10},
  {k:'all',ic:'👑',n:'Completionist',d:'Play every game at least once',p:50,ok:L=>NAMES().every(a=>L.some(x=>x.i===a.id))},
  {k:'r25',ic:'🔁',n:'Regular',d:'Finish 25 rounds',p:15,ok:L=>L.length>=25},
  {k:'r100',ic:'💯',n:'Arcade Rat',d:'Finish 100 rounds',p:40,ok:L=>L.length>=100},
  {k:'best10',ic:'🏆',n:'Record Breaker',d:'Set 10 new best scores',p:15,ok:L=>L.filter(x=>x.b).length>=10},
  {k:'cent',ic:'🔥',n:'Triple Digits',d:'Score 100+ in any game',p:10,ok:L=>L.some(x=>x.s>=100)},
  {k:'k1',ic:'🚀',n:'Four Digits',d:'Score 1,000+ in any game',p:25,ok:L=>L.some(x=>x.s>=1000)},
  {k:'day10',ic:'☕',n:'One More Round',d:'Finish 10 rounds in one day',p:15,ok:L=>{const c={};return L.some(x=>(c[dayOf(x.t)]=(c[dayOf(x.t)]||0)+1)>=10)}},
  {k:'owl',ic:'🦉',n:'Night Owl',d:'Finish a round between midnight and 5 am',p:10,ok:L=>L.some(x=>new Date(x.t).getHours()<5)},
  {k:'egg',ic:'🥚',n:'Goose Egg',d:'Finish a round with 0 points',p:5,ok:L=>L.some(x=>x.s===0)},
  {k:'same5',ic:'🎯',n:'Obsessed',d:'Play the same game 5 times in a row',p:10,ok:L=>L.some((x,i)=>i>=4&&[1,2,3,4].every(j=>L[i-j].i===x.i))},
  {k:'streak',ic:'📅',n:'Three-Day Streak',d:'Play on 3 days in a row',p:25,ok:streak},
  {k:'sol',ic:'♠️',n:'Patience',d:'Win a game of Solitaire',p:10,ok:L=>L.some(x=>x.i==='solitaire')},
  {k:'sol3',ic:'⏱️',n:'Speed Deal',d:'Win Solitaire in under 3 minutes',p:20,ok:L=>L.some(x=>x.i==='solitaire'&&x.d!=null&&x.d<180)}];
 const TOT=A.reduce((a,x)=>a+x.p,0),pts=G=>A.filter(x=>G[x.k]).reduce((a,x)=>a+x.p,0);
 const xt=x=>x.d!=null?`<i class="gc-x">${Math.floor(x.d/60)}:${String(x.d%60).padStart(2,'0')} · ${x.m} mv</i>`:'';
 const ago=t=>{const m=Math.round((Date.now()-t)/6e4);return m<1?'just now':m<60?m+'m ago':m<1440?Math.round(m/60)+'h ago':Math.round(m/1440)+'d ago'};
 const meta=id=>NAMES().find(a=>a.id===id)||{n:id,ic:'🎮'};
 let tq=[],tb=null;function toast(ic,h,p){tq.push([ic,h,p]);if(!tb)nxt()}
 function nxt(){const t=tq.shift();if(!t){tb=null;return}tb=el('div','gc-toast',`<span class="ti">${t[0]}</span><span><b>${esc(t[1])}</b><i>${esc(t[2])}</i></span>`);scr.appendChild(tb);beep(1320,.08,'sine',.05);setTimeout(()=>beep(1760,.12,'sine',.05),90);
  requestAnimationFrame(()=>tb.classList.add('in'));setTimeout(()=>{tb.classList.remove('in');setTimeout(()=>{tb.remove();nxt()},350)},2600)}
 function round(id,s,nb,o){const L=log(),e={i:id,s,t:Date.now(),b:nb?1:0};if(o&&isFinite(o.d)&&isFinite(o.m)){e.d=Math.round(o.d);e.m=Math.round(o.m)}L.push(e);while(L.length>400)L.shift();wr(LK,L);
  const G=got();A.forEach(a=>{if(!G[a.k]&&a.ok(L)){G[a.k]=Date.now();toast(a.ic,'Achievement unlocked',a.n+' · '+a.p+' pts')}});wr(AK,G)}
 function hello(){if(said)return;said=1;const L=log();if(!L.length)return;setTimeout(()=>toast('🎮','Welcome back, '+nick(),L.length+' rounds · '+pts(got())+' pts'),450)}
 const unseen=()=>Math.max(0,Object.entries(got()).length-(+rd(SK,0)||0));
 function wipe(){[LK,AK,SK].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}})}
 function view(){const L=log(),G=got(),n=Object.entries(G).length,games=new Set(L.map(x=>x.i)).size;
  let body='';
  if(tab==='scores'){const by={};L.forEach(x=>(by[x.i]=by[x.i]||[]).push(x));
   const ids=NAMES().map(a=>a.id).filter(id=>by[id]||getHi(id)).sort((a,b)=>((by[b]||[]).length-(by[a]||[]).length)||getHi(b)-getHi(a));
   body=ids.length?'<div class="grp">'+ids.map(id=>{const m=meta(id),R=(by[id]||[]).slice().sort((a,b)=>b.s-a.s||a.t-b.t).slice(0,5),best=Math.max(getHi(id),R.length?R[0].s:0);
    return `<div class="row gc-g" data-g="${id}" role="button" tabindex="0"><span>${m.ic} ${esc(m.n)}</span><span class="gc-r"><b>${best}</b><small>${(by[id]||[]).length} played</small><em>${open1===id?'▾':'▸'}</em></span></div>`+
     (open1===id?'<div class="gc-top">'+(R.length?R.map((x,i)=>`<div><span>${['🥇','🥈','🥉','4.','5.'][i]} ${esc(nick())}${xt(x)}</span><b>${x.s}</b><small>${ago(x.t)}</small></div>`).join(''):'<div><span>Best from before Game Center</span><b>'+best+'</b><small></small></div>')+'</div>':'')}).join('')+'</div>'
    :'<p class="gc-empty">No rounds yet. Pick a game from the home screen and your scores land here.</p>'}
  else if(tab==='ach'){body='<div class="grp">'+A.map(a=>`<div class="row gc-a${G[a.k]?'':' lk'}"><span class="ai">${G[a.k]?a.ic:'🔒'}</span><span class="ad"><b>${a.n}</b><small>${a.d}${G[a.k]?' · '+ago(G[a.k]):''}</small></span><b class="ap">${a.p}</b></div>`).join('')+'</div>'}
  else{const R=L.slice(-12).reverse();body=R.length?'<div class="grp">'+R.map(x=>{const m=meta(x.i);return`<div class="row"><span>${m.ic} ${esc(m.n)}${x.b?' <i class="gc-nb">BEST</i>':''}${xt(x)}</span><span class="gc-r"><b>${x.s}</b><small>${ago(x.t)}</small></span></div>`}).join('')+'</div>':'<p class="gc-empty">Nothing played yet.</p>'}
  setp.innerHTML=`<div class="gc-me"><div class="gc-av">🙂</div><div class="gc-who"><input class="gc-nick" maxlength="14" aria-label="Nickname" value="${esc(nick())}"><small>${L.length} rounds · ${games} games · ${n}/${A.length} achievements</small></div><div class="gc-pts"><b>${pts(G)}</b><small>of ${TOT} pts</small></div></div>
   <div class="gc-seg">${[['scores','Leaderboards'],['ach','Achievements'],['recent','Recent']].map(([k,l])=>`<button type="button" data-t="${k}" class="${tab===k?'on':''}">${l}</button>`).join('')}</div>${body}<p class="gc-foot">Saved only on this device. Nothing here is shared.</p>`;
  setp.querySelectorAll('.gc-seg button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;view()});
  setp.querySelectorAll('.gc-g').forEach(r=>{const f=()=>{open1=open1===r.dataset.g?null:r.dataset.g;view()};r.onclick=f;r.addEventListener(KD,e=>{if(e[KF]==='Enter'||e[KF]===' '){e.preventDefault();f()}})});
  const ni=setp.querySelector('.gc-nick');ni.onchange=()=>{wr(NK,ni.value.replace(/[<>]/g,'').trim().slice(0,14));view()};ni.addEventListener(KD,e=>{e.stopPropagation();if(e[KF]==='Enter')ni.blur()});
  if(tab==='ach')wr(SK,n);badges()}
 function open(){unlock();ttl.textContent='Game Center';app.classList.add('on');cv.style.display='none';ov.style.display='none';setp.style.display='block';setp.classList.add('gc');tab=unseen()?'ach':tab;view();setp.scrollTop=0}
 return{round,hello,unseen,wipe,open}})();
function settings(){unlock();ttl.textContent='Settings';setp.classList.remove('gc');app.classList.add('on');cv.style.display='none';ov.style.display='none';setp.style.display='block';
 const rows=NAMES().map(a=>`<div class="row"><span>${a.ic} ${a.n}</span><b>${getHi(a.id)||'–'}</b></div>`).join('');
 setp.innerHTML=`<h4>Sounds</h4><div class="grp"><div class="row"><span>Game sounds</span><button class="tog${muted?' off':''}" type="button">${muted?'OFF':'ON'}</button></div></div><h4>Best scores</h4><div class="grp">${rows}</div><div class="grp"><div class="row"><span>Reset best scores &amp; Game Center</span><button class="rst" type="button">Reset</button></div></div>`;
 setp.querySelector('.tog').onclick=()=>{muteBtn.onclick();settings()};
 setp.querySelector('.rst').onclick=e=>{const b=e.target;if(b.dataset.c){NAMES().forEach(a=>{try{localStorage.removeItem(HI(a.id));localStorage.removeItem('uq_sb_best_'+a.id)}catch(_){}});GC.wipe();badges();settings()}else{b.dataset.c=1;b.textContent='Tap again';setTimeout(()=>{if(b.isConnected){delete b.dataset.c;b.textContent='Reset'}},2500)}}}
function lockUp(){lock.classList.remove('gone');const k=lock.querySelector('.sb-knob');k.style.left='3px'}
function unlock(){const was=!lock.classList.contains('gone');lock.classList.add('gone');slide(300,900,.15,'sine');if(was)GC.hello()}
function slider(){const k=lock.querySelector('.sb-knob'),tr=lock.querySelector('.sb-track'),lb=lock.querySelector('.lbl');let sx=null,max=0;
 try{lb.animate([{backgroundPosition:'100% 0'},{backgroundPosition:'0% 0'}],{duration:2200,iterations:Infinity})}catch(e){}
 k.addEventListener('pointerdown',e=>{sx=e.clientX;max=tr.clientWidth-k.offsetWidth-6;k.setPointerCapture(e.pointerId);k.style.transition='none'});
 k.addEventListener('pointermove',e=>{if(sx==null)return;const d=Math.max(0,Math.min(max,e.clientX-sx));k.style.left=(3+d)+'px';lb.style.opacity=1-d/max});
 const end=e=>{if(sx==null)return;const d=e.clientX-sx;sx=null;k.style.transition='left .25s';lb.style.opacity=1;if(d>=max*.85)unlock();else k.style.left='3px'};
 k.addEventListener('pointerup',end);k.addEventListener('pointercancel',end);
 k.addEventListener(KD,e=>{if(e[KF]==='Enter'||e[KF]===' '||e[KF]==='ArrowRight'){e.preventDefault();unlock()}})}
function pos(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]}
function ptr(){let down=false;
 cv.addEventListener('pointerdown',e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);down=true;if(state!=='play')return;const[x,y]=pos(e);cur.down&&cur.down(x,y)});
 cv.addEventListener('pointermove',e=>{if(state!=='play')return;const[x,y]=pos(e);cur.move&&cur.move(x,y,down)});
 const up=e=>{down=false;if(state!=='play')return;const[x,y]=pos(e);cur.up&&cur.up(x,y)};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 ov.addEventListener('pointerdown',e=>{e.preventDefault();start()});
 addEventListener(KD,e=>{if(!cur||!sec.classList.contains('on'))return;const k=e[KF];if(/^Arrow| $/.test(k)||k==='Enter')e.preventDefault();if(state!=='play'){if(k===' '||k==='Enter')start();if(k==='Escape')home();return}if(e.repeat)return;held.add(k);cur.press&&cur.press(k)});
 addEventListener(KU,e=>{held.delete(e[KF]);cur&&state==='play'&&cur.release&&cur.release(e[KF])});
 addEventListener('deviceorientation',e=>{if(e.gamma==null)return;tilt.ok=true;let gx=e.gamma,gy=e.beta;const o=(screen.orientation&&screen.orientation.angle)||window.orientation||0;if(o==90){gx=e.beta;gy=-e.gamma}else if(o==-90||o==270){gx=-e.beta;gy=e.gamma}tilt.x=Math.max(-1,Math.min(1,gx/30));tilt.y=Math.max(-1,Math.min(1,(gy-35)/30))});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play')pause()})}
function showOv(h,p,b){ov.innerHTML=`<h3>${h}</h3>${p?`<p>${p}</p>`:''}<span class="go">${b}</span>`;ov.style.display='block'}
function pause(){state='paused';showOv('Paused','','Resume')}
function loadGame(id){return new Promise((res,rej)=>{if(REG[id])return res();const s=document.createElement('script');s.src='js/games/'+id+'.js?v=1';s.onload=()=>REG[id]?res():rej();s.onerror=rej;document.head.appendChild(s)})}
async function open(a){if(cur)return;unlock();curId=a.id;ttl.textContent=a.n;app.classList.add('on');g.setTransform(2,0,0,2,0,0);g.fillStyle='#000';g.fillRect(0,0,W,H);txt('Loading…',W/2,H/2,16,'#fff','center');ov.style.display='none';
 try{await loadGame(a.id)}catch(e){txt('Could not load game',W/2,H/2+30,13,'#f88','center');return}
 if(curId!==a.id)return;cur=REG[a.id](api);cur.reset();state='ready';draw();showOv(a.ic+' '+a.n,(cur.help||'')+'<br>Best: '+getHi(a.id),'Tap to play');loop()}
function start(){if(!cur)return;if(state==='paused'){state='play';ov.style.display='none';return}if(cur.needs&&cur.needs()===false)return;cur.reset();state='play';ov.style.display='none';beep(880,.06)}
function home(){setp.style.display='none';setp.classList.remove('gc');cv.style.display='';cancelAnimationFrame(raf);raf=0;cur&&cur.stop&&cur.stop();cur=null;curId=null;state='idle';app.classList.remove('on');held.clear();badges()}
function draw(){g.setTransform(2,0,0,2,0,0);g.save();cur.draw(g);g.restore()}
function loop(){cancelAnimationFrame(raf);last=performance.now();const f=t=>{if(!cur)return;const dt=Math.min(.05,(t-last)/1000);last=t;if(state==='play')cur.update(dt);if(state!=='idle')draw();raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f)}
function hook(){const h=location.hash.slice(1);if(h!=='arcade'&&cur&&state==='play')pause()}
function init(){if(!build())return;addEventListener('hashchange',hook)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
