/* layout.js : compact trade monitor (tap to expand) and canvas cleanup of the old big monitor frame. Uses window.Desk. */
(function(){
'use strict';
if(!window.Desk||!Desk.office){console.warn('layout: Desk API missing');return}
const O=Desk.office,scr=document.querySelector('.stage .screen');if(!scr)return;
const btn=document.createElement('button');btn.className='scr-x';btn.type='button';btn.textContent='⤢ expand';btn.setAttribute('aria-label','Expand trade monitor');scr.appendChild(btn);
const set=b=>{scr.classList.toggle('big',b);btn.textContent=b?'✕ close':'⤢ expand';btn.setAttribute('aria-label',b?'Shrink trade monitor':'Expand trade monitor')};
btn.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();set(!scr.classList.contains('big'))});
scr.addEventListener('click',e=>{if(!scr.classList.contains('big')){e.preventDefault();e.stopPropagation();set(true)}},true);
document.addEventListener('click',e=>{if(scr.classList.contains('big')&&!scr.contains(e.target))set(false)});
/* paint over the old big monitor frame + stand, then a small neon wall mount behind the compact screen */
O.addActor({id:'layout-bg',y:-.9,draw(X){const W=O.width,H=O.height,m=O.mobile,s=m?{x:.04,y:.03,w:.92,h:.46}:{x:.36,y:.07,w:.6,h:.55};
 const mx=s.x*W,my=s.y*H,mw=s.w*W,mh=s.h*H,dy=my+mh+14+H*.06+12;
 const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0e1518');g.addColorStop(1,'#090d0f');X.fillStyle=g;X.fillRect(mx-60,Math.max(0,my-60),mw+120,dy-Math.max(0,my-60));
 if(scr.classList.contains('big'))return;
 const r=scr.getBoundingClientRect(),a=O.toCanvas(r.left,r.top),b=O.toCanvas(r.right,r.bottom);
 X.fillStyle='#1a2427';X.fillRect((a.x+b.x)/2-8,b.y,16,m?20:34);X.fillRect((a.x+b.x)/2-40,b.y+(m?18:30),80,6)}});
})();
