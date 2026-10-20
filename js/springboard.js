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
const DOCK=[{id:'taptap',n:'Tap Beats',ic:'🎵',c:['#ff8ad8','#9a1a8a']},{id:'whack',n:'Whack',ic:'🔨',c:['#b5e07a','#4f8a1c']},{id:'bricks',n:'Bricks',ic:'🧱',c:['#ffb07a','#c8320a']},{id:'memory',n:'Memory',ic:'🃏',c:['#ffffff','#9aa6b8']}];
const HI=id=>'uq_sb_hi_'+id,getHi=id=>{try{return +localStorage.getItem(HI(id))||0}catch(e){return 0}},setHi=(id,v)=>{try{localStorage.setItem(HI(id),v)}catch(e){}};
const REG={},W=320,H=448;let sec,scr,lock,board,app,cv,g,ov,ttl,muteBtn,cur=null,curId=null,state='idle',raf=0,last=0,actx=null;
let muted=(()=>{try{return localStorage.getItem('uq_sb_mute')==='1'}catch(e){return false}})();
const held=new Set(),tilt={x:0,y:0,ok:false};
function beep(f,d,type,vol){if(muted)return;try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();const o=actx.createOscillator(),q=actx.createGain(),t=actx.currentTime;o.type=type||'square';o.frequency.setValueAtTime(f,t);q.gain.setValueAtTime(vol||.06,t);q.gain.exponentialRampToValueAtTime(.0001,t+(d||.1));o.connect(q);q.connect(actx.destination);o.start(t);o.stop(t+(d||.1)+.02)}catch(e){}}
function slide(f1,f2,d,type){if(muted)return;try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),q=actx.createGain(),t=actx.currentTime;o.type=type||'square';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);q.gain.setValueAtTime(.06,t);q.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(q);q.connect(actx.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
function txt(s,x,y,sz,col,al,bold){g.font=(bold===false?'':'bold ')+(sz||14)+'px Helvetica,Arial,sans-serif';g.textAlign=al||'left';g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.7)';g.strokeText(s,x,y);g.fillStyle=col||'#fff';g.fillText(s,x,y)}
const api={W,H,held,tilt,beep,slide,txt,get g(){return g},over(score){if(state!=='play')return;state='over';score=Math.floor(score||0);const b=getHi(curId),nb=score>b;if(nb)setHi(curId,score);slide(600,150,.4);showOv((nb?'🏆 New best!':'Game over'),'Score '+score+' · Best '+Math.max(b,score),'Play again');badges()},hi:()=>getHi(curId)};
window.SB={reg(id,fac){REG[id]=fac},api};
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
function icon(a,dock){const b=el('button','sb-ic',`<span class="g" style="background:linear-gradient(${a.c[0]},${a.c[1]})">${a.ic}</span><span>${a.n}</span>`);b.type='button';b.setAttribute('aria-label',a.n);
 if(a.h)b.onclick=()=>{location.hash=a.h};else{b.dataset.app=a.id;b.onclick=()=>open(a)}return b}
function badges(){sec.querySelectorAll('[data-app]').forEach(b=>{let d=b.querySelector('.bd');const v=getHi(b.dataset.app);if(!v){d&&d.remove();return}if(!d){d=el('span','bd');b.appendChild(d)}d.textContent=v>999?Math.round(v/1000)+'k':v})}
function clock(){const n=new Date(),t=n.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}).replace(/\s?[AP]M/i,'');sec.querySelectorAll('.sb-t').forEach(e=>e.textContent=t);const d=sec.querySelector('.dt');if(d)d.textContent=n.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}
function build(){sec=document.getElementById('arcade');if(!sec)return false;
 sec.innerHTML='<h2>🕹️ Arcade</h2><p class="sub">Classic pocket games. Slide to unlock, tap an icon to play. Best scores stay on this device.</p>';
 const wrap=el('div','sb-wrap'),ph=el('div','sb-phone');scr=el('div','sb-screen');
 scr.appendChild(el('div','sb-status','<span>iArcade ▂▄▆</span><b class="sb-t"></b><span>100%<i class="bat"></i></span>'));
 board=el('div','sb-board');const grid=el('div','sb-grid');APPS.forEach(a=>grid.appendChild(icon(a)));board.appendChild(grid);board.appendChild(el('div','sb-dots','● ○'));const dk=el('div','sb-dock');DOCK.forEach(a=>dk.appendChild(icon(a,1)));board.appendChild(dk);scr.appendChild(board);
 lock=el('div','sb-lock','<div class="top"><div class="tm sb-t"></div><div class="dt"></div></div><div class="art">🌄</div><div class="bot"><div class="sb-track"><div class="sb-knob" role="button" tabindex="0" aria-label="Slide to unlock">➜</div><div class="lbl">slide to unlock</div></div></div>');scr.appendChild(lock);
 app=el('div','sb-app');const nav=el('div','sb-nav');const back=el('button','','◀ Home');back.onclick=home;ttl=el('span','','');muteBtn=el('button','',muted?'🔇':'🔊');muteBtn.onclick=()=>{muted=!muted;muteBtn.textContent=muted?'🔇':'🔊';try{localStorage.setItem('uq_sb_mute',muted?'1':'0')}catch(e){}};
 nav.append(back,ttl,muteBtn);cv=el('canvas','sb-cv');cv.width=W*2;cv.height=H*2;g=cv.getContext('2d');app.append(nav,cv);ov=el('div','sb-ov');ov.style.display='none';app.appendChild(ov);scr.appendChild(app);
 const hb=el('button','sb-home');hb.setAttribute('aria-label','Home button');hb.onclick=()=>{if(cur)home();else lockUp()};
 ph.append(scr,hb);wrap.appendChild(ph);wrap.appendChild(el('p','sb-note','Touch, mouse or arrows / space bar. Tilt games use your phone\'s motion sensor when allowed, with on-screen controls as backup.'));sec.appendChild(wrap);
 slider();ptr();clock();setInterval(clock,10000);badges();return true}
function lockUp(){lock.classList.remove('gone');const k=lock.querySelector('.sb-knob');k.style.left='3px'}
function unlock(){lock.classList.add('gone');slide(300,900,.15,'sine')}
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
function home(){cancelAnimationFrame(raf);raf=0;cur&&cur.stop&&cur.stop();cur=null;curId=null;state='idle';app.classList.remove('on');held.clear();badges()}
function draw(){g.setTransform(2,0,0,2,0,0);g.save();cur.draw(g);g.restore()}
function loop(){cancelAnimationFrame(raf);last=performance.now();const f=t=>{if(!cur)return;const dt=Math.min(.05,(t-last)/1000);last=t;if(state==='play')cur.update(dt);if(state!=='idle')draw();raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f)}
function hook(){const h=location.hash.slice(1);if(h!=='arcade'&&cur&&state==='play')pause()}
function init(){if(!build())return;addEventListener('hashchange',hook)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
