/* vsclean.js : clean three-way scoreboard (live P&L in USD, bank in SOL) laid over the VS board graph. View only, paper trading.
   The graph is drawn by vsboard.js on the office canvas; this covers that area with a DOM scoreboard (pointer-events pass through, so tap-to-expand still works). */
(function(){
if(!window.Desk||!Desk.office||!window.DeskBanks){console.warn('vsclean: Desk/DeskBanks missing');return}
var O=Desk.office,stage=document.getElementById('stage');if(!stage)return;
/* same board rect vsboard.js uses (canvas px) */
function rect(){if(window.DeskVS&&DeskVS.rect)return DeskVS.rect();return O.mobile?{x:70,y:430,w:660,h:300}:{x:470,y:92,w:640,h:330}}
function usdRate(){var d=Desk.data||{},v=+d.sol_usd;return isFinite(v)&&v>0?v:null}
function usd(v){var a=Math.abs(v);return (v<0?'-':'+')+'$'+a.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
var E=function(s){return Desk.utils&&Desk.utils.E?Desk.utils.E(s):String(s)};
function mk(cls){var e=document.createElement('div');e.className=cls;return e}
var box=mk('vsc'),ex=null;box.setAttribute('aria-label','Three-way paper P&L scoreboard');stage.appendChild(box);
function place(){var r=rect(),a=O.toClient(r.x,r.y),b=O.toClient(r.x+r.w,r.y+r.h),s=stage.getBoundingClientRect();
 box.style.left=(a.x-s.left)+'px';box.style.top=(a.y-s.top)+'px';box.style.width=(b.x-a.x)+'px';box.style.height=(b.y-a.y)+'px'}
function html(){var L=DeskBanks.list(),rate=usdRate();
 var cols=L.map(function(x){var main=x.pnl==null?'n/a':rate?usd(x.pnl*rate):((x.pnl>=0?'+':'')+x.pnl.toFixed(4)+' SOL');
  return '<div class="vsc-c" style="--c:'+x.col+'"><div class="vsc-n">'+E(x.name.toUpperCase())+'</div><div class="vsc-v '+(x.pnl<0?'dn':'up')+'">'+main+'</div>'+
   '<div class="vsc-s">Bank '+(x.bank==null?'n/a':x.bank.toFixed(4))+' SOL'+(x.pct==null?'':' · '+(x.pct>=0?'+':'')+x.pct.toFixed(1)+'%')+'</div></div>'}).join('');
 return '<div class="vsc-g">'+cols+'</div><div class="vsc-f"><span class="vsc-d"></span>LIVE P&amp;L · PAPER TRADING'+(rate?' · SOL $'+rate.toFixed(2):' · no SOL/USD price in data, shown in SOL')+'</div>'}
function render(){box.innerHTML=html();place();
 ex=document.querySelector('.vs-ov .vs-box');if(ex&&!ex.querySelector('.vsc-x')){var p=mk('vsc vsc-x');ex.insertBefore(p,ex.querySelector('.vs-note'))}
 if(ex){var q=ex.querySelector('.vsc-x');if(q)q.innerHTML=html()}}
Desk.on('update',function(){setTimeout(render,0)});
window.addEventListener('desk:live',function(){setTimeout(render,0)});
window.addEventListener('resize',function(){setTimeout(place,50)});
new MutationObserver(function(){if(document.querySelector('.vs-ov .vs-box')&&!document.querySelector('.vsc-x'))render()}).observe(document.body,{childList:true});
setTimeout(render,0);
})();
