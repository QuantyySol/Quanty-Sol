/* books.js : ONE source of truth for both paper books, shared by the ticker, VS board, cards and the Performance section.
   Quanty = main desk bank (cash + open marks, MAIN + PREMIG). Ledger = ledger_book. Prefers Desk.live.books (live marks)
   and falls back to desk.json. Paper trading only. */
(function(){
'use strict';
if(!window.Desk){console.warn('books: Desk API missing');return}
const n=(v,f)=>{v=+v;return isFinite(v)?v:f};
function get(){const d=Desk.data||{},lb=d.ledger_book||{},lv=(Desk.live&&Desk.live.books)||{};
 const mk=(live,bank,start,w,l,open)=>{start=n(start,1)||1;const b=live&&isFinite(+live.bank)?+live.bank:n(bank,start);return{bank:b,start,pnl:b-start,pct:(b/start-1)*100,wins:w|0,losses:l|0,open:open|0,live:!!(live&&isFinite(+live.bank)),delayed:!!(live&&live.delayed)}};
 const s=d.stats||{};
 return{quanty:mk(lv.quanty,d.bank_sol,d.start_sol,s.wins,s.losses,(d.open||[]).length),ledger:mk(lv.ledger,lb.bank_sol,lb.start_sol,lb.wins,lb.losses,(lb.open||[]).length),hasLedger:!!d.ledger_book}}
const fS=v=>(v>=0?'+':'')+v.toFixed(4),fP=v=>(v>=0?'+':'')+v.toFixed(1)+'%';
function paint(){const B=get(),q=B.quanty,l=B.ledger,$=id=>document.getElementById(id);
 const b=$('bank'),p=$('pnl');if(b&&Desk.data)b.textContent=q.bank.toFixed(4)+' SOL';if(p&&Desk.data){p.textContent=fS(q.pnl)+' ('+fP(q.pct)+')';p.className=q.pnl>=0?'up':'dn'}
 let box=$('books');const st=$('stats');if(!box&&st){box=document.createElement('div');box.id='books';box.className='books';const sub=st.querySelector('p.sub');(sub||st.firstChild).after(box)}
 if(box){const card=(nm,c,o,src)=>`<div class="card bk" style="--c:${c}"><div class="bk-h"><b>${nm}</b><span class="k">${src}</span></div><div class="bk-g"><div><div class="k">Bank</div><div class="v">${o.bank.toFixed(4)} SOL</div></div><div><div class="k">P&amp;L</div><div class="v ${o.pnl>=0?'up':'dn'}">${fS(o.pnl)} SOL</div></div><div><div class="k">P&amp;L %</div><div class="v ${o.pnl>=0?'up':'dn'}">${fP(o.pct)}</div></div><div><div class="k">W / L · open</div><div class="v">${o.wins} / ${o.losses} · ${o.open}</div></div></div></div>`;
  const tag=o=>o.live?(o.delayed?'live marks (delayed)':'live marks'):'last snapshot';
  box.innerHTML=card('QUANTY · desk book','#39ff88',q,tag(q))+(B.hasLedger?card('LEDGER · own book','#ffbf3f',l,tag(l)):'')}}
window.DeskBooks={get,paint};
Desk.on('update',()=>setTimeout(paint,0));addEventListener('desk:live',paint);
})();
