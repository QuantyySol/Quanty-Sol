/* books.js : ONE source of truth for the paper books (quanty, ledger, twitter), used by the ticker, VS board,
   dock, cards, Performance section and the breakroom daily top-5. Current values: Desk.live.books.<name> (live marks),
   else desk.json books.<name>, else the legacy fields (bank_sol / ledger_book). A book with no data is reported as
   missing, never invented. Paper trading only. */
(function(){
'use strict';
if(!window.Desk){console.warn('books: Desk API missing');return}
const NAMES=['quanty','ledger','twitter'],COL={quanty:'#39ff88',ledger:'#ffbf3f',twitter:'#5cc8ff'};
const num=v=>{v=+v;return v===v&&isFinite(v)?v:null};
function src(n){const d=Desk.data||{},b=(d.books||{})[n]||null,bh=d.bank_history||{};
 if(b){const cl=b.closed||[],st=d.stats||{},cw=cl.filter(c=>(+c.pnl_sol||0)>0).length,tr=Array.isArray(b.trades)?b.trades.length:(+b.trades||0);
  return{bank:num(b.bank_sol??b.bank),start:num(b.start_sol??b.start)||1,pct:num(b.pnl_pct),wins:b.wins??(n==='quanty'&&st.wins!=null?st.wins:cw),losses:b.losses??(n==='quanty'&&st.losses!=null?st.losses:cl.length-cw),
   open:(b.open||[]).length,hist:b.bank_history||bh[n],closed:cl,trades:tr+cl.length+(b.open||[]).length}}
 if(n==='quanty'&&d.bank_sol!=null){const s=d.stats||{};return{bank:num(d.bank_sol),start:num(d.start_sol)||1,wins:s.wins,losses:s.losses,open:(d.open||[]).length,trades:(d.trades||[]).length+1,hist:(bh.quanty&&bh.quanty.length)?bh.quanty:d.history,closed:d.closed||[]}}
 if(n==='ledger'&&d.ledger_book){const l=d.ledger_book;return{bank:num(l.bank_sol),start:num(l.start_sol)||1,wins:l.wins,losses:l.losses,open:(l.open||[]).length,trades:(l.trades||[]).length+(l.closed||[]).length+(l.open||[]).length,hist:bh.ledger,closed:l.closed||[]}}
 return null}
function book(n){const s=src(n),lv=((Desk.live&&Desk.live.books)||{})[n];if(!s&&!lv)return null;
 const start=(s&&s.start)||1,live=!!(lv&&num(lv.bank)!=null);
 const bank=live?num(lv.bank):(s.bank!=null?s.bank:start);
 const pct=live&&num(lv.pnl_pct)!=null?num(lv.pnl_pct):(s&&s.pct!=null&&!live?s.pct:(bank/start-1)*100);
 return{name:n,col:COL[n],bank,start,pnl:live&&num(lv.pnl_sol)!=null?num(lv.pnl_sol):bank-start,pct,wins:(s&&s.wins)|0,losses:(s&&s.losses)|0,
  open:live&&lv.open!=null?lv.open|0:(s?s.open:0),live,delayed:!!(lv&&lv.delayed),traded:!s||s.trades>0||(live&&Math.abs(num(lv.pnl_sol)||0)>1e-12),hist:(s&&Array.isArray(s.hist))?s.hist:[],closed:s?s.closed:[]}}
function get(){const o={};NAMES.forEach(n=>o[n]=book(n));return o}
/* [[ms, pnl%]] ending at the current (live) value */
function series(n){const b=book(n);if(!b)return[];const a=b.hist.filter(p=>Array.isArray(p)&&num(p[1])!=null).map(p=>[Date.parse(p[0])||0,(p[1]/b.start-1)*100]).filter(p=>p[0]);a.push([Date.now(),b.pct]);return a}
/* daily P&L rows {name,date,pnl,pct}: from bank_history (close-to-close, first day vs start, today uses live bank); else from closed trades */
function daily(n){const b=book(n);if(!b||!b.traded)return[];const day=ms=>new Date(ms).toISOString().slice(0,10),g={};
 (b.closed||[]).forEach(c=>{const t=Date.parse(c.closed_at),p=num(c.pnl_sol);if(t&&p!=null)g[day(t)]=(g[day(t)]||0)+p});
 if(Object.keys(g).length)return Object.keys(g).sort().map(k=>({name:n,date:k,pnl:g[k],pct:g[k]/b.start*100,kind:'realized'}));
 const first={},last={};b.hist.forEach(p=>{const t=Date.parse(p&&p[0]),v=num(p&&p[1]);if(t&&v!=null){const k=day(t);if(!(k in first))first[k]=v;last[k]=v}});
 if(!Object.keys(last).length)return[];last[day(Date.now())]=b.bank;if(!(day(Date.now()) in first))first[day(Date.now())]=b.bank;let prev=null;
 return Object.keys(last).sort().map(k=>{const o=prev??first[k],r={name:n,date:k,pnl:last[k]-o,pct:(last[k]/o-1)*100,kind:'bank'};prev=last[k];return r})}
function topDays(k){let r=[];NAMES.forEach(n=>r=r.concat(daily(n)));return r.filter(x=>Math.abs(x.pnl)>1e-9).sort((a,b)=>b.pnl-a.pnl).slice(0,k||5)}
const fS=v=>(v>=0?'+':'')+v.toFixed(4),fP=v=>(v>=0?'+':'')+v.toFixed(1)+'%';
const badge=dl=>'<span class="lq-dot'+(dl?' dl':'')+'"></span><span class="lq-tag'+(dl?' dl':'')+'">'+(dl?'DELAYED':'LIVE')+'</span>';
function paint(){const B=get(),q=B.quanty,$=id=>document.getElementById(id);
 const b=$('bank'),p=$('pnl');if(q){if(b)b.textContent=q.bank.toFixed(4)+' SOL';if(p){p.textContent=fS(q.pnl)+' ('+fP(q.pct)+')';p.className=q.pnl>=0?'up':'dn'}}
 let box=$('books');const st=$('stats');if(!box&&st){box=document.createElement('div');box.id='books';box.className='books';const sub=st.querySelector('p.sub');(sub||st.firstChild).after(box)}
 if(!box)return;const lab={quanty:'QUANTY',ledger:'LEDGER',twitter:'TWITTER'};
 box.innerHTML=NAMES.map(n=>{const o=B[n];if(!o||!o.traded)return `<div class="card bk" style="--c:${COL[n]}"><div class="bk-h"><b>${lab[n]}</b></div><div class="k">no trades yet</div></div>`;
  return `<div class="card bk" style="--c:${o.col}"><div class="bk-h"><b>${lab[n]}</b><span>${o.live?badge(o.delayed):'<span class="k">snapshot</span>'}</span></div><div class="bk-g"><div><div class="k">Bank</div><div class="v">${o.bank.toFixed(4)}</div></div><div><div class="k">P&amp;L SOL</div><div class="v ${o.pnl>=0?'up':'dn'}">${fS(o.pnl)}</div></div><div><div class="k">P&amp;L %</div><div class="v ${o.pnl>=0?'up':'dn'}">${fP(o.pct)}</div></div><div><div class="k">W/L · open</div><div class="v">${o.wins}/${o.losses} · ${o.open}</div></div></div></div>`}).join('')}
window.DeskBooks={NAMES,COL,get,book,series,daily,topDays,paint,badge};
Desk.on('update',()=>setTimeout(paint,0));addEventListener('desk:live',paint);
})();
