/* cards.js : keeps the agent info card (#mbub) inside the scene (above the status line, below the header) and
   refreshes its content live while it is open. Uses window.Desk. */
(function(){
'use strict';
const bub=document.getElementById('mbub'),stage=document.getElementById('stage');if(!bub||!stage)return;
function clamp(){if(bub.style.display!=='block')return;const s=stage.getBoundingClientRect();if(!s.height)return;const tk=stage.querySelector('.ticker'),tr=tk&&tk.getBoundingClientRect();
 const bottom=Math.min(s.bottom,tr&&tr.height?tr.top:s.bottom)-8,top=Math.max(s.top,58)+8,h=bub.offsetHeight;let y=parseFloat(bub.style.top)||0;
 if(y+h>bottom)y=bottom-h;if(y<top)y=top;bub.style.top=y+'px';let x=parseFloat(bub.style.left)||0;x=Math.max(s.left+6,Math.min(s.right-bub.offsetWidth-6,x));bub.style.left=x+'px'}
let busy=false;new MutationObserver(()=>{if(busy)return;busy=true;try{clamp()}finally{Promise.resolve().then(()=>busy=false)}}).observe(bub,{attributes:true,attributeFilter:['style']});setInterval(clamp,500);
function refresh(){if(bub.style.display!=='block'||typeof bub._refresh!=='function')return;try{const h=bub._refresh();if(h!==bub._last){bub.innerHTML=h;bub._last=h;bub._pos&&bub._pos()}}catch(e){}}
setInterval(refresh,1500);if(window.Desk&&Desk.on)Desk.on('update',()=>setTimeout(refresh,0));addEventListener('desk:live',refresh);
})();
