/* declutter.js : mobile Office declutter. Builds one compact status pill from the existing ticker values (view-only). */
(function(){
var mq=window.matchMedia('(max-width:600px)');
function txt(id){var e=document.getElementById(id);return e?e.textContent.trim():''}
function pill(){var tk=document.querySelector('.stage .ticker');if(!tk)return null;var p=tk.querySelector('.dc-pill');
 if(!p){p=document.createElement('button');p.type='button';p.className='dc-pill';p.setAttribute('aria-label','Desk status, tap for details');
  p.addEventListener('click',function(){tk.classList.toggle('dc-open')});tk.insertBefore(p,tk.firstChild)}return p}
function render(){var p=pill();if(!p)return;
 var lv=txt('lv'),on=lv==='LIVE',pn=txt('pnl'),m=pn.match(/\(([^)]+)\)/),pc=m?m[1]:pn,up=!/^-/.test(pc);
 var E=(window.Desk&&Desk.utils&&Desk.utils.E)||function(s){return String(s).replace(/[&<>"]/g,function(c){return'&#'+c.charCodeAt(0)+';'})};
 p.innerHTML='<span class="dc-d'+(on?' on':'')+'"></span><span class="dc-s" style="color:'+(on?'var(--g)':'#ffd75f')+'">'+(on?'LIVE':'DELAYED')+'</span>'+
  '<i>Bank</i><b>'+E(txt('bank'))+'</b><i>P&amp;L</i><b class="'+(up?'up':'dn')+'">'+E(pc)+'</b><i>Win</i><b>'+E(txt('wr'))+'</b>'}
if(window.Desk&&Desk.on)Desk.on('update',function(){setTimeout(render,0)});
window.addEventListener('desk:live',function(){setTimeout(render,0)});
setInterval(function(){if(mq.matches&&!document.hidden)render()},1000);
render();
})();
