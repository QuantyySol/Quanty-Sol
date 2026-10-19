/* dock.js : live one-line info on each docked agent card. Uses window.Desk + DeskBooks. Paper trading only. */
(function(){
'use strict';
if(!window.Desk)return;
const E=s=>(Desk.utils&&Desk.utils.E?Desk.utils.E(s):String(s??'')),pc=v=>`<span class="${v>=0?'up':'dn'}">${v>=0?'+':''}${v.toFixed(1)}%</span>`;
const bk=n=>{const b=window.DeskBooks&&DeskBooks.book(n);return b&&b.bank!=null?`${b.bank.toFixed(3)} SOL${b.pct!=null?' '+pc(b.pct):''}`:'bank n/a'};
const info={
 QUANTY(){return bk('quanty')},
 LEDGER(){return bk('ledger')},
 TWITTER(){return bk('twitter')},
 DESIGNER(){return 'designer · ships UI'}};
function paint(){document.querySelectorAll('#minis .mini').forEach(m=>{const nm=m.querySelector('.nm');if(!nm)return;let w=m.querySelector('.dk-t');
 if(!w){w=document.createElement('div');w.className='dk-t';nm.after(w);w.appendChild(nm);const i=document.createElement('div');i.className='dk-i';w.appendChild(i)}
 const f=info[(m.getAttribute('aria-label')||nm.textContent||'').toUpperCase()];if(f){try{w.querySelector('.dk-i').innerHTML=f()}catch(e){}}})}
Desk.on('update',()=>setTimeout(paint,0));addEventListener('desk:live',paint);addEventListener('load',()=>setTimeout(paint,50));setInterval(paint,3000);
})();
