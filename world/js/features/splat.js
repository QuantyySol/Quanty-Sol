// Splatoon-style ink turf: neon team colors, spray ink onto block tops (shared G.paint layer, owner 'splat-<team>'), ink tank that
// refills fast on your own color, swim dash through own ink, live turf meter + optional 3-minute turf rounds, painted turf glows at night.
// Desktop: hold F (or toggle 🔫) to spray where you aim, Q = swim dash. Touch: left stick moves, hold+drag the big ink button to aim and spray.
export default{name:'splat',init(G){const T=G.THREE,me=G.player;
 const TEAMS=[0xff2bd6,0x19f0ff],TN=['pink','cyan'],CSS=['#ff2bd6','#19f0ff'],OWN=TN.map(n=>'splat-'+n),ROUND=180;
 // ---- team: join the smaller team among players already here
 const cnt=[0,0];G.others.forEach(o=>{const t=o.target&&o.target.ex&&o.target.ex.team;if(t===0||t===1)cnt[t]++});
 let team=cnt[0]==cnt[1]?(Math.random()<.5?0:1):cnt[0]<cnt[1]?0:1;me.extra.team=team;
 let ink=1,sprayKey=false,sprayBtn=false,sprayTog=false,acc=0,swim=0,swimCd=0,round=null,announced=0,glowT=0;
 // ---- HUD: ink meter (left, top 48) + turf bar (top 62, 14px tall so it clears centered HUD lines lower down)
 const inkM=G.ui.meter(48,CSS[team]);const inkEl=document.querySelectorAll('.meter');const inkBox=inkEl[inkEl.length-1];inkBox.title='Ink tank';
 const st=document.createElement('style');st.textContent=`
 .spl-turf{position:fixed;left:8px;top:62px;width:150px;height:14px;border-radius:7px;overflow:hidden;z-index:6;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.7);display:flex;cursor:pointer;box-shadow:0 0 8px rgba(255,43,214,.35),0 0 8px rgba(25,240,255,.35)}
 .spl-turf i{display:block;height:100%;transition:width .4s}.spl-turf b{position:absolute;inset:0;font:700 9.5px/14px system-ui,sans-serif;text-align:center;color:#fff;text-shadow:0 0 3px #000,0 0 2px #000;letter-spacing:.02em;white-space:nowrap}
 .spl-me{outline:2px solid #fff;outline-offset:-2px}
 .spl-fire{position:fixed;right:84px;bottom:calc(126px + env(safe-area-inset-bottom));width:60px;height:60px;border-radius:50%;z-index:6;font-size:24px;color:#fff;touch-action:none;
  border:2px solid var(--c);background:color-mix(in srgb,var(--c) 30%,rgba(0,0,0,.35));box-shadow:0 0 12px var(--c)}
 .spl-fire.on{background:color-mix(in srgb,var(--c) 70%,transparent);box-shadow:0 0 22px var(--c)}
 #feat button.spl-b{width:44px;height:44px}
 @media (hover:hover) and (pointer:fine){.spl-fire{display:none}}`;document.head.appendChild(st);
 const turf=document.createElement('div');turf.className='spl-turf';turf.title='Team turf (tap to switch team)';turf.innerHTML='<i></i><i></i><b></b>';document.body.appendChild(turf);
 // ---- buttons
 const bSpray=G.ui.addButton('🔫','Ink spray toggle (hold F)',()=>{sprayTog=!sprayTog;bSpray.classList.toggle('on',sprayTog)});bSpray.classList.add('spl-b');
 const bSwim=G.ui.addButton('🦑','Swim dash through your ink (Q)',()=>dash());bSwim.classList.add('spl-b');
 const bRound=G.ui.addButton('⏱','Start a 3-minute turf round',()=>startRound());bRound.classList.add('spl-b');
 const fire=document.createElement('button');fire.className='spl-fire';fire.textContent='💦';fire.setAttribute('aria-label','Hold to spray ink, drag to aim');(document.getElementById('hud')||document.body).appendChild(fire);
 let fid=null,fx=0,fy=0;fire.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();fid=e.pointerId;fx=e.clientX;fy=e.clientY;try{fire.setPointerCapture(fid)}catch(_){}sprayBtn=true;fire.classList.add('on')});
 fire.addEventListener('pointermove',e=>{if(e.pointerId!==fid)return;me.yaw-=(e.clientX-fx)*.007;me.pitch=Math.max(-1.5,Math.min(1.5,me.pitch-(e.clientY-fy)*.007));fx=e.clientX;fy=e.clientY});
 const fend=e=>{if(e.pointerId!==fid)return;fid=null;sprayBtn=false;fire.classList.remove('on')};fire.addEventListener('pointerup',fend);fire.addEventListener('pointercancel',fend);
 function setTeam(t){team=t;me.extra.team=t;fire.style.setProperty('--c',CSS[t]);inkBox.firstChild.style.background=CSS[t];bSpray.title='Ink spray, team '+TN[t]+' (hold F)';G.toast('🎨 You are team '+TN[t].toUpperCase(),1600)}
 setTeam(team);let sprayed=false;setTimeout(()=>{if(sprayed)return;const c=[0,0];G.others.forEach(o=>{const t=o.target&&o.target.ex&&o.target.ex.team;if(t===0||t===1)c[t]++});if(c[team]>c[1-team])setTeam(1-team)},6000);turf.addEventListener('pointerdown',e=>{e.stopPropagation();setTeam(1-team)});
 // ---- keys (hold F = spray). kbd gives keydown; listen for keyup ourselves
 G.on('kbd',k=>{if(k=='f')sprayKey=true;if(k=='q')dash()});
 addEventListener('keyup',e=>{if(e.key.toLowerCase()=='f')sprayKey=false});addEventListener('blur',()=>{sprayKey=false});
 // ---- spray particles (pooled), also drawn for other players from their extra.sp aim point
 const pg=new T.BoxGeometry(.13,.13,.13),pm=TEAMS.map(c=>new T.MeshBasicMaterial({color:c,transparent:true,opacity:.95})),P=[];
 for(let i=0;i<60;i++){const m=new T.Mesh(pg,pm[0]);m.visible=false;G.scene.add(m);P.push({m,t:0})}
 function puff(from,to,t){for(let n=0;n<3;n++){const p=P.find(q=>q.t<=0);if(!p)return;p.m.material=pm[t];p.m.visible=true;p.t=.35;p.a=from.clone();p.b=to.clone().add(new T.Vector3(Math.random()-.5,Math.random()*.3,Math.random()-.5));p.d=.35}}
 // ---- swim dash
 function under(){const p=me.pos;return G.paint.get(Math.floor(p.x),Math.floor(p.y-.1),Math.floor(p.z))}
 function dash(){if(swimCd>0)return;const u=under();if(!(u&&u.owner==OWN[team]))return G.toast('🦑 Swim needs your own ink underfoot',1200);if(ink<.1)return G.toast('Ink low',900);ink-=.1;swim=.7;swimCd=1.1;bSwim.classList.add('on')}
 // ---- turf rounds (synced, kept for late joiners)
 function startRound(){if(round&&Date.now()<round.end)return G.toast('Round in progress',1000);const r={k:'round',n:(round?round.n:0)+1,end:Date.now()+ROUND*1000,keep:1};G.net.send('splat',r);onRound(r)}
 function onRound(r){if(!r||!r.end||(round&&r.n<round.n))return;round={n:r.n,end:r.end};if(Date.now()<r.end)G.toast('⏱ Turf round '+r.n+'! 3:00 to ink the most ground',2200)}
 G.net.on('splat',m=>{if(m.k=='round')onRound(m)});
 // ---- night glow: brighten team materials at night (paint materials are unlit)
 function glow(){const night=G.isNight&&G.isNight(),k=night?.85+.15*Math.sin(performance.now()/450):0;TEAMS.forEach(c=>{const m=G.paint.materials&&G.paint.materials[c];if(!m)return;
   m.opacity=night?1:.82;m.color.setHex(c);if(night)m.color.lerp(new T.Color(0xffffff),.12*k)})}
 const tmp=new T.Vector3();
 G.on('tick',(dt,now)=>{const u=under(),own=u&&u.owner==OWN[team],enemy=u&&u.owner&&OWN.includes(u.owner)&&!own;
  swimCd=Math.max(0,swimCd-dt);if(swim>0){swim-=dt;if(swim<=0)bSwim.classList.remove('on')}
  me.speedMul=swim>0&&own?2.6:own?1.45:enemy?.6:1;
  ink=Math.min(1,ink+dt*(swim>0?.6:own?.45:.06));
  const spraying=(sprayKey||sprayBtn||sprayTog)&&!G.frozen&&ink>.02;me.extra.sp=null;
  if(spraying){acc+=dt;const h=G.raycast(12);if(h){sprayed=true;me.extra.sp=[h.x,h.y,h.z];if(acc>.08){acc=0;ink-=.022;
    for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++){if((a||c)&&Math.random()<.4)continue;const x=h.x+a,z=h.z+c,y=G.world.height(x,z);if(Math.abs(y-h.y)<3)G.paint.set(x,y,z,TEAMS[team],OWN[team])}
    puff(tmp.set(me.pos.x,me.pos.y+1.3,me.pos.z),new T.Vector3(h.x+.5,h.y+1,h.z+.5),team)}}}else if(ink<=.02&&(sprayKey||sprayBtn||sprayTog))G.toast('Out of ink: stand on your color to refill',900);
  // other players' spray
  G.others.forEach(o=>{const ex=o.target&&o.target.ex;if(ex&&ex.sp&&Math.random()<dt*10&&o.g)puff(o.g.position.clone().add(new T.Vector3(0,1.3,0)),new T.Vector3(ex.sp[0]+.5,ex.sp[1]+1,ex.sp[2]+.5),ex.team?1:0)});
  P.forEach(p=>{if(p.t<=0)return;p.t-=dt;const k=1-p.t/p.d;p.m.position.lerpVectors(p.a,p.b,k);p.m.position.y+=Math.sin(k*Math.PI)*.6;if(p.t<=0)p.m.visible=false});
  glowT-=dt;if(glowT<=0){glowT=.1;glow()}
  inkM(ink);inkBox.style.boxShadow=ink<.15?'0 0 8px #ff4d4d':'';
  const n=G.paint.count(),a=n[OWN[0]]||0,b=n[OWN[1]]||0,tot=a+b,pa=tot?Math.round(a/tot*100):50;
  turf.children[0].style.cssText='width:'+pa+'%;background:'+CSS[0];turf.children[1].style.cssText='width:'+(100-pa)+'%;background:'+CSS[1];
  let lbl=(team?'pink ':'YOU pink ')+(tot?pa:0)+'% · '+(tot?100-pa:0)+'% cyan'+(team?' YOU':'');
  if(round){const left=Math.ceil((round.end-Date.now())/1000);if(left>0)lbl+=' · '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
   else if(announced<round.n){announced=round.n;const w=a==b?null:a>b?0:1;G.toast(w==null?'⏱ Round '+round.n+': draw!':'🏆 Round '+round.n+': team '+TN[w].toUpperCase()+' wins '+(w?100-pa:pa)+'%'+(w==team?' (you!)':''),3500)}}
  turf.lastChild.textContent=lbl});
 const prev=G.infoExtra;G.infoExtra=()=>(prev?prev()+' · ':'')+'🎨 '+TN[team]+' ink '+Math.round(ink*100)+'%';
 G.splat={team:()=>team,ink:()=>ink}}}
