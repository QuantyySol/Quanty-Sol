// Splatoon-style: team paint spray (shared G.paint layer), territory meter, ink tank refills on own color, swim speed on own paint, glows at night.
export default{name:'splat',init(G){const TEAMS=[0xff3da8,0x2fe0ff],TN=['pink','cyan'];const team=Math.random()<.5?0:1;G.player.extra.team=team;let ink=1,spray=false,acc=0;
 const inkM=G.ui.meter(48,'#'+TEAMS[team].toString(16).padStart(6,'0')),terr=document.createElement('div');terr.className='meter';terr.style.top='62px';
 terr.innerHTML='<i style="background:#ff3da8;float:left"></i><i style="background:#2fe0ff;float:left"></i>';document.body.appendChild(terr);
 const b=G.ui.addButton('🔫','Ink spray, team '+TN[team]+' (F)',()=>{spray=!spray;b.classList.toggle('on',spray)});
 G.on('kbd',c=>{if(c=='f'){spray=!spray;b.classList.toggle('on',spray)}});G.toast('You are team '+TN[team]+' 🎨');
 G.on('tick',dt=>{const p=G.player.pos;const under=G.paint.get(Math.floor(p.x),Math.floor(p.y-.1),Math.floor(p.z));
  const own=under&&under.owner=='splat-'+TN[team],enemy=under&&under.owner?.startsWith('splat-')&&!own;
  G.player.speedMul=own?1.7:enemy?0.6:1;ink=Math.min(1,ink+dt*(own?.5:.05));
  if(spray&&ink>0.02){acc+=dt;if(acc>.08){acc=0;const h=G.raycast(12);if(h){ink-=.025;for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++){if(Math.random()<.4&&(a||c))continue;
     const x=h.x+a,z=h.z+c,y=G.world.height(x,z);if(Math.abs(y-h.y)<3)G.paint.set(x,y,z,TEAMS[team],'splat-'+TN[team])}}}}
  inkM(ink);TEAMS.forEach(c=>{const m=G.paint.materials[c];if(m)m.opacity=G.isNight()?1:.8});
  const n=G.paint.count(),a=n['splat-pink']||0,bb=n['splat-cyan']||0,tot=a+bb||1;terr.children[0].style.width=a/tot*100+'%';terr.children[1].style.width=bb/tot*100+'%'})}}
