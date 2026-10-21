// Dark Souls-style: preset messages on block faces (appraisals), bloodstains replaying a 3s ghost, per-chunk tallies.
// X (interact) on a message opens a read panel with Appraise (one per player per message); X on a bloodstain replays its ghost.
const PHRASES=['Try jumping','Hidden path ahead','Beware of fall','Amazing view','Treasure?','Be wary of right','Praise the sun','Visions of blocks...','Try building','Time for crossroads'];
const MAX_MSG=120,MAX_STAIN=60,MAX_AP=1500,STAIN_AGE=12*3600e3;
export default{name:'darksouls',init(G){if(G.net.keepCap){G.net.keepCap('souls',MAX_MSG);G.net.keepCap('soulsap',MAX_AP);G.net.keepCap('soulstain',MAX_STAIN)}
 const T=G.THREE,msgs=new Map(),stains=new Map(),tally={},pendAp=new Map();const trail=[];let id=0;
 const ck=(x,z)=>Math.floor(x/16)+','+Math.floor(z/16);const tl=k=>tally[k]||={d:0,m:0};
 const cnt=o=>(o.base||0)+o.ap.size;
 const mkLabel=o=>{const s=G.label('✉ '+o.text+' 👍'+cnt(o),'#ffd27a');s.position.set(o.x+.5+o.n[0]*.6,o.y+.5+o.n[1]*.6+.3,o.z+.5+o.n[2]*.6);s.scale.set(2.2,.55,1);return s};
 function relabel(o){const p=o.s;o.s=mkLabel(o);G.scene.add(o.s);if(p){G.scene.remove(p);p.material&&p.material.map&&p.material.map.dispose();p.material&&p.material.dispose()}if(o.tg)o.tg.pos=o.s.position;if(panelFor===o)showPanel(o)}
 function rmMsg(k){const o=msgs.get(k);if(!o)return;G.scene.remove(o.s);o.rm&&o.rm();msgs.delete(k);tl(ck(o.x,o.z)).m--;if(panelFor===o)closePanel()}
 function addMsg(m){if(!m||m.id==null||msgs.has(m.id)||!Array.isArray(m.n))return;
  const o={id:m.id,x:m.x,y:m.y,z:m.z,n:m.n,text:String(m.text||'').slice(0,60),base:+m.up||0,ap:new Set(pendAp.get(m.id)||[])};pendAp.delete(m.id);
  relabel(o);o.tg={pos:o.s.position,radius:.7,name:'Message',kind:'soulmsg',onInteract:()=>showPanel(o)};o.rm=G.combat.addTarget(o.tg);
  msgs.set(o.id,o);tl(ck(o.x,o.z)).m++;while(msgs.size>MAX_MSG)rmMsg(msgs.keys().next().value)}
 function appraise(mid,by){if(!by)return;const o=msgs.get(mid);if(!o){if(!pendAp.has(mid))pendAp.set(mid,new Set());pendAp.get(mid).add(by);if(pendAp.size>400)pendAp.delete(pendAp.keys().next().value);return}
  if(o.ap.has(by))return;o.ap.add(by);relabel(o)}
 function rmStain(k){const s=stains.get(k);if(!s)return;G.scene.remove(s.g);s.g.geometry.dispose();s.g.material.dispose();s.rm&&s.rm();stains.delete(k);tl(ck(s.x,s.z)).d--}
 function addStain(s){if(!s||s.id==null||stains.has(s.id))return;const g=new T.Mesh(new T.CircleGeometry(.45,12),new T.MeshBasicMaterial({color:0xaa0000,transparent:true,opacity:.85}));
  g.rotation.x=-Math.PI/2;g.position.set(s.x,s.y+.02,s.z);G.scene.add(g);const o={id:s.id,x:s.x,y:s.y,z:s.z,trail:Array.isArray(s.trail)?s.trail:[],g,cool:0};
  o.rm=G.combat.addTarget({pos:g.position,radius:.6,name:'Bloodstain',kind:'soulstain',onInteract:()=>{if(!play(o,true))G.toast(o.playing?'The ghost is already replaying':'The stain is silent')}});
  stains.set(o.id,o);tl(ck(o.x,o.z)).d++;while(stains.size>MAX_STAIN)rmStain(stains.keys().next().value)}
 function play(s,force){if(s.playing||!s.trail.length||(!force&&s.cool>0))return false;s.playing=true;s.cool=6;
  const ghost=G.mkAvatar('👻','#cc2222');ghost.g.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.4}});G.scene.add(ghost.g);let i=0;
  const iv=setInterval(()=>{const q=s.trail[i++];if(!q||!stains.has(s.id)){clearInterval(iv);G.scene.remove(ghost.g);s.playing=false;return}ghost.g.position.set(q[0],q[1],q[2]);ghost.g.rotation.y=q[3]},50);return true}
 // read panel
 let panel=null,panelFor=null;
 function closePanel(){if(panel)panel.style.display='none';panelFor=null}
 function showPanel(o){if(!panel){panel=document.createElement('div');panel.id='dsPanel';
   panel.style.cssText='position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:20;min-width:240px;max-width:86vw;padding:16px 18px;border-radius:14px;background:rgba(14,10,24,.92);border:1px solid #ffd27a66;box-shadow:0 0 24px #ffd27a33;color:#f4e6c4;font:15px/1.4 system-ui,sans-serif;text-align:center';
   panel.addEventListener('pointerdown',e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;e.preventDefault();
    if(b.dataset.a=='ap'&&panelFor){const o=panelFor;if(o.ap.has(G.net.id))return G.toast('Already appraised');appraise(o.id,G.net.id);G.net.send('soulsap',{k:'ap',mid:o.id,by:G.net.id},{keep:1,replace:'ap:'+o.id+':'+G.net.id});G.toast('Appraised! 👍')}
    else closePanel()});document.body.appendChild(panel)}
  panelFor=o;const mine=o.ap.has(G.net.id),esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const bs='margin:4px;padding:9px 16px;min-height:44px;border-radius:10px;border:1px solid #ffd27a88;background:#ffd27a22;color:#ffe9b0;font:inherit;cursor:pointer';
  panel.innerHTML=`<div style="opacity:.7;font-size:12px;letter-spacing:.08em">✉ MESSAGE</div><div style="font-size:20px;margin:8px 0">${esc(o.text)}</div><div style="opacity:.8;margin-bottom:10px">👍 ${cnt(o)} appraisal${cnt(o)==1?'':'s'}</div>`+
   `<button data-a="ap" style="${bs}${mine?';opacity:.45':''}">${mine?'Appraised':'Appraise'}</button><button data-a="x" style="${bs}">Close</button>`;panel.style.display='block'}
 G.on('kbd',k=>{if(k=='Escape')closePanel()});
 G.ui.button('✉','Write message',()=>{const h=G.raycast();if(!h)return G.toast('Look at a block');G.ui.panel(PHRASES,t=>{const m={id:G.net.id+':'+Date.now().toString(36)+(id++),x:h.x,y:h.y,z:h.z,n:h.n,text:t,up:0};addMsg(m);G.net.send('souls',{k:'msg',m},{keep:1,replace:'msg:'+m.id})})});
 G.ui.button('👍','Read nearest message',()=>{let best=null,bd=4;for(const o of msgs.values()){const d=o.s.position.distanceTo(G.camera.position);if(d<bd){bd=d;best=o}}if(!best)return G.toast('No message nearby');showPanel(best)});
 const onSouls=e=>{try{if(e.k=='msg')addMsg(e.m);else if(e.k=='ap')appraise(e.mid,e.by||e.from);else if(e.k=='up'&&e.m){const o=msgs.get(e.m.id);if(o&&(+e.m.up||0)>cnt(o)){o.base=(+e.m.up||0)-o.ap.size;relabel(o)}}else if(e.k=='stain')addStain(e.s)}catch(err){console.error('darksouls',err)}};G.net.on('souls',onSouls);G.net.on('soulsap',onSouls);G.net.on('soulstain',onSouls);
 G.on('tick',(dt,now)=>{const p=G.player.pos;trail.push([p.x,p.y,p.z,G.player.yaw]);if(trail.length>180)trail.shift();
  for(const s of stains.values()){s.cool-=dt;if(s.cool<=0&&Math.hypot(s.x-p.x,s.z-p.z)<1.2&&Math.abs(s.y-p.y)<2)play(s)}
  if(panelFor&&panelFor.s.position.distanceTo(G.camera.position)>7)closePanel()});
 G.on('death',why=>{const p=G.player.pos;const s={id:G.net.id+':'+Date.now().toString(36)+(id++),x:+p.x.toFixed(2),y:Math.max(p.y,0),z:+p.z.toFixed(2),why:String(why||''),trail:trail.filter((_,i)=>i%3==0).slice(-60).map(q=>q.map(v=>+v.toFixed(2)))};addStain(s);G.net.send('soulstain',{k:'stain',s},{keep:1,replace:'stain:'+s.id,maxAge:STAIN_AGE})});
 const prev=G.infoExtra;G.infoExtra=()=>{const t=tally[ck(G.player.pos.x,G.player.pos.z)]||{d:0,m:0};return(prev?prev()+' · ':'')+`☠${t.d} ✉${t.m}`}}}
