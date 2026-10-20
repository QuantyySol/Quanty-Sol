/* pages.js : keeps the active nav tab in view on mobile (edge-fade state) and gives empty lists an intentional look. View only. */
(function(){
var nav=document.querySelector('header nav');
function fades(){if(!nav)return;var m=nav.scrollWidth-nav.clientWidth;nav.classList.toggle('pg-s0',nav.scrollLeft<=2);nav.classList.toggle('pg-s1',nav.scrollLeft>=m-2)}
function center(smooth){if(!nav||nav.scrollWidth<=nav.clientWidth)return fades();var a=nav.querySelector('a.on')||nav.querySelector('a[href="'+location.hash+'"]');if(!a)return fades();
 var x=a.offsetLeft-(nav.clientWidth-a.offsetWidth)/2;nav.scrollTo({left:Math.max(0,x),behavior:smooth?'smooth':'auto'});setTimeout(fades,smooth?350:0)}
if(nav){nav.addEventListener('scroll',fades,{passive:true});
 new MutationObserver(function(){center(true)}).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
 window.addEventListener('hashchange',function(){setTimeout(function(){center(true)},30)});
 window.addEventListener('resize',function(){center(false)});
 window.addEventListener('load',function(){center(false)});center(false)}
var EMPTY={op:['Nothing open right now','Waiting for the next paper entry'],cl:['Waiting for the first trade','Paper buys and sells will show here']};
function empties(){Object.keys(EMPTY).forEach(function(id){var el=document.getElementById(id);if(!el)return;var r=el.children;
 if(r.length===1&&r[0].classList.contains('row')&&!r[0].children.length){r[0].className='row pg-empty';r[0].innerHTML='<b>'+EMPTY[id][0]+'</b><small>'+EMPTY[id][1]+'</small>'}})}
if(window.Desk&&Desk.on)Desk.on('update',function(){setTimeout(empties,0)});
empties();
})();
/* About copy: keep the bank sentence true to the data (each book's start_sol). */
(function(){function fix(){var d=window.Desk&&Desk.data,b=d&&d.books;if(!b)return;var s=Object.keys(b).map(function(k){return +b[k].start_sol}).filter(function(v){return v>0});
 if(!s.length||!s.every(function(v){return v===s[0]}))return;var p=document.querySelector('#about .card p');if(!p)return;
 p.innerHTML=p.innerHTML.replace(/with a fake [\d.]+ SOL bank\./,'with a separate fake '+s[0]+' SOL bank for each trader.')}
 if(window.Desk&&Desk.on)Desk.on('update',function(){setTimeout(fix,0)});})();
