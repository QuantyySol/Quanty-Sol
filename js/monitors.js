/* monitors.js — office monitor wall: one small screen per OPEN position + DexScreener links.
   Data: polls window.Desk (Desk.data | Desk.get() | Desk.state) and listens for "desk:update";
   falls back to fetching desk.json itself if window.Desk never appears (8s).
   Mount: element #monitor-wall, else [data-monitor-wall], else inserted before #office/.office, else top of <body>.
   Fields used: open[].{mint,symbol,strategy,pnl_pct,cost_sol,opened_at,curve_pct,price_sol,entry_price_sol},
                marks[symbol]=[[ts,price]], trades[].{mint,symbol,side,ts}.
   Trade-row links: any element with data-mint="<mint>" (e.g. desk-monitor trade rows) opens DexScreener.
   API: window.Monitors = {dexUrl(mint), render(data), linkify(rootEl, trades)} */
(function(){
"use strict";
var B58=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, MAX=8;
function dexUrl(m){return (typeof m==="string"&&B58.test(m))?"https://dexscreener.com/solana/"+m:null;}
function open(m){var u=dexUrl(m); if(u) window.open(u,"_blank","noopener");}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function ts(t){if(t==null)return NaN; if(typeof t==="number")return t<1e12?t*1000:t; return Date.parse(t);}
function dur(ms){if(!(ms>=0))return "--"; var s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60); s%=60;
  return (h?h+"h ":"")+(h||m?m+"m ":"")+s+"s";}

var css=document.createElement("style");
css.textContent=
".mw{display:grid;gap:8px;padding:8px;margin:0 auto 10px;max-width:1100px;grid-template-columns:repeat(var(--mwc,4),minmax(0,1fr));font:12px/1.25 ui-monospace,Menlo,Consolas,monospace}"+
".mw-s{position:relative;background:#05080c;border:3px solid #2a3340;border-radius:8px;box-shadow:0 4px 0 #11161d,inset 0 0 18px #000;color:#cfe;padding:6px 7px 5px;min-height:96px;overflow:hidden;text-decoration:none;display:block;transition:border-color .15s,transform .15s}"+
".mw-s.lnk{cursor:pointer}.mw-s.lnk:hover,.mw-s.lnk:focus{border-color:#5ad1ff;transform:translateY(-2px);box-shadow:0 6px 0 #11161d,0 0 14px #5ad1ff66,inset 0 0 18px #000;outline:none}"+
".mw-s:after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,#ffffff07 0 1px,transparent 1px 3px)}"+
".mw-h{display:flex;justify-content:space-between;align-items:center;gap:4px}.mw-sym{font-weight:700;font-size:13px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
".mw-tag{font-size:9px;padding:1px 4px;border-radius:3px;background:#1f6feb;color:#fff}.mw-tag.p{background:#a35cff}"+
".mw-c{display:block;width:100%;height:38px;margin:3px 0}.mw-r{display:flex;justify-content:space-between;gap:4px;white-space:nowrap}"+
".up{color:#3fe07a}.dn{color:#ff5c5c}.mw-dim{color:#7a8a99}"+
".mw-bar{height:4px;background:#1b2430;border-radius:2px;margin-top:3px;overflow:hidden}.mw-bar i{display:block;height:100%;background:linear-gradient(90deg,#a35cff,#ffcc33)}"+
".mw-on{animation:mwOn .7s steps(1) 1}@keyframes mwOn{0%{opacity:0}15%{opacity:.8}25%{opacity:.1}40%{opacity:1}55%{opacity:.3}70%,100%{opacity:1}}"+
".mw-off{animation:mwOff .5s ease-in forwards}@keyframes mwOff{0%{transform:scale(1,1);filter:brightness(1)}60%{transform:scale(1,.04);filter:brightness(3)}100%{transform:scale(0,0);opacity:0}}"+
".mw-closed{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;background:#05080ce6;z-index:2}"+
".mw-more{display:flex;align-items:center;justify-content:center;font-size:16px;color:#9ab}"+
".mw-ss{display:flex;align-items:center;justify-content:center}.mw-ss canvas{width:100%;height:80px}"+
"@media(max-width:640px){.mw{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}.mw-s{flex:0 0 46%;scroll-snap-align:start}}"+
"[data-mint]{cursor:pointer}[data-mint]:hover{background:#5ad1ff1f}";
document.head.appendChild(css);

var wall=null, screens={}, closing={}, last=null, ssAnim=null;
function mount(){
  if(wall&&document.body.contains(wall))return wall;
  wall=document.getElementById("monitor-wall")||document.querySelector("[data-monitor-wall]");
  if(!wall){wall=document.createElement("div");wall.id="monitor-wall";
    var off=document.getElementById("office")||document.querySelector(".office,[data-office]");
    if(off&&off.parentNode)off.parentNode.insertBefore(wall,off);else document.body.insertBefore(wall,document.body.firstChild);}
  wall.classList.add("mw"); wall.setAttribute("aria-label","Open positions"); return wall;
}
function posId(o){return (o.mint||o.symbol)+"|"+(o.opened_at||"");}
function series(d,o){
  var m=(d.marks||{})[o.symbol]||[], s=m.map(function(p){return +p[1];}).filter(function(v){return v>0;});
  if(o.entry_price_sol&&!s.length)s.push(+o.entry_price_sol); if(o.price_sol)s.push(+o.price_sol); return s;
}
function spark(cv,s,entry,up){
  var r=window.devicePixelRatio||1,w=cv.clientWidth||120,h=cv.clientHeight||38; cv.width=w*r;cv.height=h*r;
  var c=cv.getContext("2d"); c.setTransform(r,0,0,r,0,0); c.clearRect(0,0,w,h);
  if(s.length<2){c.fillStyle="#7a8a99";c.font="10px monospace";c.fillText("warming up…",4,h/2+3);return;}
  var a=s.concat(entry?[+entry]:[]),lo=Math.min.apply(0,a),hi=Math.max.apply(0,a),sp=hi-lo||hi*0.01||1;
  function y(v){return h-2-(v-lo)/sp*(h-4);}
  if(entry){c.strokeStyle="#ffffff30";c.setLineDash([3,3]);c.beginPath();c.moveTo(0,y(entry));c.lineTo(w,y(entry));c.stroke();c.setLineDash([]);}
  var col=up?"#3fe07a":"#ff5c5c"; c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();
  s.forEach(function(v,i){var x=i/(s.length-1)*w; i?c.lineTo(x,y(v)):c.moveTo(x,y(v));}); c.stroke();
  c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.fillStyle=col+"22";c.fill();
}
function makeScreen(o){
  var u=dexUrl(o.mint), el=document.createElement(u?"a":"div");
  el.className="mw-s mw-on"+(u?" lnk":""); if(u){el.href=u;el.target="_blank";el.rel="noopener";el.title="Open "+o.symbol+" on DexScreener";}
  el.innerHTML='<div class="mw-h"><span class="mw-sym"></span><span class="mw-tag"></span></div><canvas class="mw-c"></canvas>'+
    '<div class="mw-r"><b class="mw-pnl"></b><span class="mw-sz mw-dim"></span></div><div class="mw-r mw-dim"><span class="mw-t"></span><span class="mw-cv"></span></div><div class="mw-bar" hidden><i></i></div>';
  setTimeout(function(){el.classList.remove("mw-on");},800); return el;
}
function fill(el,o,d){
  var pm=/premig/i.test(o.strategy||""), p=+o.pnl_pct, up=!(p<0);
  el.querySelector(".mw-sym").textContent="$"+(o.symbol||"?");
  var t=el.querySelector(".mw-tag"); t.textContent=pm?"PREMIG":"MAIN"; t.className="mw-tag"+(pm?" p":"");
  var pe=el.querySelector(".mw-pnl"); pe.textContent=isFinite(p)?(p>=0?"+":"")+p.toFixed(1)+"%":"--"; pe.className="mw-pnl "+(up?"up":"dn");
  el.querySelector(".mw-sz").textContent=o.cost_sol!=null?(+o.cost_sol).toFixed(3)+" SOL":"";
  el.dataset.opened=o.opened_at||""; el._pnl=p;
  var bar=el.querySelector(".mw-bar"), cv=el.querySelector(".mw-cv");
  if(pm&&o.curve_pct!=null){bar.hidden=false;bar.firstChild.style.width=Math.max(0,Math.min(100,+o.curve_pct))+"%";cv.textContent="curve "+(+o.curve_pct).toFixed(0)+"%";}
  else{bar.hidden=true;cv.textContent="";}
  spark(el.querySelector("canvas"),series(d,o),o.entry_price_sol,up);
}
function closeScreen(k,el){
  if(closing[k])return; closing[k]=1; var p=el._pnl, div=document.createElement("div");
  div.className="mw-closed "+(p<0?"dn":"up"); div.textContent="CLOSED "+(isFinite(p)?(p>=0?"+":"")+p.toFixed(1)+"%":"");
  el.appendChild(div); el.removeAttribute("href"); el.classList.remove("lnk");
  setTimeout(function(){el.classList.add("mw-off");},2200);
  setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);delete closing[k];if(!Object.keys(screens).length&&!Object.keys(closing).length)screensaver();layout();},2800);
}
function screensaver(){
  if(wall.querySelector(".mw-ss"))return;
  wall.querySelectorAll(".mw-more").forEach(function(n){n.remove();});
  var msgs=["NO OPEN TRADES","scanning pump.fun…","zzz… waiting for a setup","cash is a position"];
  for(var i=0;i<3;i++){var s=document.createElement("div");s.className="mw-s mw-ss";s.innerHTML="<canvas></canvas>";s.dataset.msg=msgs[i%msgs.length];wall.appendChild(s);}
  var t0=performance.now();
  (function loop(now){ var ss=wall.querySelectorAll(".mw-ss"); if(!ss.length){ssAnim=null;return;}
    ss.forEach(function(s,i){var cv=s.firstChild,r=window.devicePixelRatio||1,w=cv.clientWidth||120,h=cv.clientHeight||80;
      if(cv.width!==w*r){cv.width=w*r;cv.height=h*r;} var c=cv.getContext("2d");c.setTransform(r,0,0,r,0,0);c.fillStyle="#05080c";c.fillRect(0,0,w,h);
      var tt=(now-t0)/1000+i*2; for(var k=0;k<14;k++){var a=(k*137.5+tt*20*(k%3+1))%360*Math.PI/180;c.fillStyle="hsla("+(k*25+tt*30)%360+",80%,60%,.7)";c.fillRect(w/2+Math.cos(a)*(w/2.4)*((k%5+1)/5),h/2+Math.sin(a)*(h/2.4)*((k%4+1)/4),2,2);}
      c.fillStyle="#9fe";c.font="10px monospace";c.textAlign="center";c.fillText(s.dataset.msg,w/2+Math.sin(tt)*w/6,h/2+Math.cos(tt*.7)*h/5+3);});
    ssAnim=requestAnimationFrame(loop);})(t0);
}
function layout(){
  var n=wall.querySelectorAll(".mw-s").length; wall.style.setProperty("--mwc",n<=1?2:n<=4?Math.max(2,n):n<=6?3:4);
}
function render(d){
  if(!d||!document.body)return; last=d; mount();
  var openPos=(d.open||[]).slice().sort(function(a,b){return ts(a.opened_at)-ts(b.opened_at);}), seen={};
  if(openPos.length) wall.querySelectorAll(".mw-ss").forEach(function(n){n.remove();});
  openPos.slice(0,MAX).forEach(function(o){var k=posId(o);seen[k]=1;
    var el=screens[k]; if(!el){el=screens[k]=makeScreen(o);wall.appendChild(el);} fill(el,o,d);});
  Object.keys(screens).forEach(function(k){if(!seen[k]){closeScreen(k,screens[k]);delete screens[k];}});
  var more=wall.querySelector(".mw-more"), extra=openPos.length-MAX;
  if(extra>0){if(!more){more=document.createElement("div");more.className="mw-s mw-more";} more.textContent="+"+extra+" more"; wall.appendChild(more);}
  else if(more)more.remove();
  if(!openPos.length&&!Object.keys(closing).length)screensaver();
  layout(); linkify(document,d.trades||[]);
}
function tick(){ var now=Date.now(); for(var k in screens){var el=screens[k],t=el.querySelector(".mw-t"),o=ts(el.dataset.opened); if(t)t.textContent="\u23F1 "+dur(now-o);} }
/* Trade rows: mark elements that look like trade rows with data-mint if the main page supplied a symbol only. */
function linkify(root,trades){
  (root||document).querySelectorAll("[data-trade-symbol]:not([data-mint])").forEach(function(el){
    var s=el.getAttribute("data-trade-symbol"); for(var i=0;i<trades.length;i++)if(trades[i].symbol===s&&trades[i].mint){el.setAttribute("data-mint",trades[i].mint);break;}});
}
document.addEventListener("click",function(e){
  var el=e.target.closest&&e.target.closest("[data-mint]"); if(!el||el.closest(".mw"))return;
  if(el.tagName==="A"&&el.href)return; var u=dexUrl(el.getAttribute("data-mint")); if(u){e.preventDefault();open(el.getAttribute("data-mint"));}
});
function fromDesk(D){ if(!D)return null; if(D.data)return D.data; if(typeof D.get==="function")try{return D.get();}catch(e){} return D.state||null; }
var waited=0, fb=null;
function poll(){
  var d=fromDesk(window.Desk); if(d&&d!==last)render(d);
  if(!window.Desk){waited+=1; if(waited>=8&&!fb){fb=1;fetchLoop();}}
}
function fetchLoop(){
  fetch("desk.json?t="+Date.now(),{cache:"no-store"}).then(function(r){return r.json();}).then(function(d){if(!window.Desk)render(d);}).catch(function(){})
  .then(function(){if(!window.Desk)setTimeout(fetchLoop,30000);});
}
window.addEventListener("desk:update",function(e){if(e.detail)render(e.detail);});
window.addEventListener("resize",function(){if(last)render(last);});
function start(){ setInterval(poll,1000); setInterval(tick,1000); poll(); }
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start); else start();
window.Monitors={dexUrl:dexUrl,render:render,linkify:linkify};
})();
