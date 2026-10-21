/* Example feature (not in FEATURES; copy it to start your own). */
export default {name:'_example',init(A){
  const hud=A.ui.hudSlot('_example');
  A.on('tick',()=>{hud.textContent=A.alive?'Rank '+((A.leaderboard.find(r=>r.me)||{}).rank||'-'):''});
  A.net.keepCap('_example_wave',20);
  A.net.on('_example_wave',m=>A.ui.toast((m.n||'someone')+' waved 👋'));
  A.ui.button('👋','Wave',()=>A.net.send('_example_wave',{n:A.me?A.me.n:''},{keep:1,replace:A.id,maxAge:60000}));
  A.skins.add('_ring',{name:'Ring',icon:'◎',draw(ctx,c,e,R){ctx.lineWidth=R*.1;ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(c.x,c.y,R*.55,0,6.283);ctx.stroke()}});
}};
