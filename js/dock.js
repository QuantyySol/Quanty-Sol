/* dock.js : live one-line info on each docked agent card. Uses window.Desk + DeskBooks. Paper trading only. */
(function(){
'use strict';
if(!window.Desk)return;
const E=s=>(Desk.utils&&Desk.utils.E?Desk.utils.E(s):String(s??'')),pc=v=>`<span class="${v>=0?'up':'dn'}">${v>=0?'+':''}${v.toFixed(1)}%</span>`;
const info={
 QUANTY(){const B=window.DeskBooks&&DeskBooks.get();return B&&B.quanty?`${B.quanty.bank.toFixed(3)} SOL ${pc(B.quanty.pct)}`:'…'},
 LEDGER(){const B=window.DeskBooks&&DeskBooks.get();if(!B||!B.ledger||!B.ledger.traded)return'no trades yet';return `book ${B.ledger.bank.toFixed(3)} ${pc(B.ledger.pct)}`},
 TWITTER(){const B=window.DeskBooks&&DeskBooks.get();if(B&&B.twitter&&B.twitter.traded)return `book ${B.twitter.bank.toFixed(3)} ${pc(B.twitter.pct)}`;const t=((Desk.data||{}).trades||[])[0];return 'no trades yet'},
 DESIGNER(){return 'polishing pixels'}};
function paint(){document.querySelectorAll('#minis .mini').forEach(m=>{const nm=m.querySelector('.nm');if(!nm)return;let w=m.querySelector('.dk-t');
 if(!w){w=document.createElement('div');w.className='dk-t';nm.after(w);w.appendChild(nm);const i=document.createElement('div');i.className='dk-i';w.appendChild(i)}
 const f=info[(m.getAttribute('aria-label')||nm.textContent||'').toUpperCase()];if(f){try{w.querySelector('.dk-i').innerHTML=f()}catch(e){}}})}
Desk.on('update',()=>setTimeout(paint,0));addEventListener('desk:live',paint);addEventListener('load',()=>setTimeout(paint,50));setInterval(paint,3000);
})();
