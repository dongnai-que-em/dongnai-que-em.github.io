(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var CHAPTERS=window.CHAPTERS||[],VIDEOS=window.VIDEOS||[];
var TITLES={home:'Không gian học tập quê hương Đồng Nai',videos:'Video minh họa lịch sử Đồng Nai',library:'Kho học liệu lớp 8',chat:'Hỏi đáp bài học'};
var CRUMBS={home:'Tổng quan',videos:'Video minh họa',library:'Kho học liệu',chat:'Hỏi đáp'};

function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function plain(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()}

/* Toast */
function notice(t){var e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(notice.timer);notice.timer=setTimeout(function(){e.classList.remove('show')},3500)}
window.notice=notice;

/* Điều hướng */
function showPage(name){
  if(!$('page-'+name))name='home';
  document.querySelectorAll('.section').forEach(function(s){s.classList.toggle('active',s.id==='page-'+name)});
  document.querySelectorAll('#nav button').forEach(function(b){b.classList.toggle('active',b.dataset.page===name)});
  $('pageTitle').textContent=TITLES[name]||TITLES.home;$('crumbCurrent').textContent=CRUMBS[name]||'';
  window.scrollTo(0,0);
  try{document.dispatchEvent(new CustomEvent('pagechange',{detail:name}))}catch(e){}
}
window.showPage=showPage;
document.querySelectorAll('#nav button').forEach(function(b){b.addEventListener('click',function(){showPage(b.dataset.page)})});
document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(){showPage(b.dataset.go)})});

/* Tổng quan */
function renderHome(){
  $('statVideos').textContent=VIDEOS.length;$('statChapters').textContent=CHAPTERS.length;
  var area=$('gradeCards'),icons=['📗','📘','📙','📕'];
  for(var n=6;n<=9;n++){(function(n){
    var active=n===8,b=el('button','grade-card'+(active?' selected':' soon'));b.type='button';
    var top=el('div','grade-top');top.appendChild(el('div','gicon',icons[n-6]));top.appendChild(el('div','arrow','↗'));
    b.appendChild(top);b.appendChild(el('h4','','Lớp '+n));
    b.appendChild(el('p','',active?VIDEOS.length+' video • 3 tài liệu':'Đang cập nhật'));
    b.addEventListener('click',function(){if(active)showPage('videos');else notice('Lớp '+n+' đang cập nhật, em quay lại sau nhé.')});
    area.appendChild(b);
  })(n)}
}

/* Danh sách video */
function chapterTitle(id){for(var i=0;i<CHAPTERS.length;i++)if(CHAPTERS[i].id===id)return CHAPTERS[i].title;return''}
function renderVideos(q){
  var box=$('videoList');box.replaceChildren();
  var key=plain((q||'').trim()),shown=0;
  CHAPTERS.forEach(function(ch){
    var list=VIDEOS.filter(function(v){return v.chapter===ch.id&&(!key||plain(v.title+' '+v.year).indexOf(key)>=0)});
    if(!list.length)return;shown+=list.length;
    var sec=el('div','chapter'),head=el('div','chapter-head');
    head.appendChild(el('div','chapter-num',String(ch.id)));head.appendChild(el('h3','','Chương '+ch.id+' – '+ch.title));head.appendChild(el('small','',list.length+' video'));
    sec.appendChild(head);
    var grid=el('div','video-grid');
    list.forEach(function(v){
      var c=el('button','vcard'+(v.orient==='landscape'?' wide':''));c.type='button';
      var th=el('div','vthumb'),img=document.createElement('img');img.src=v.thumb;img.alt='';img.loading='lazy';img.decoding='async';th.appendChild(img);
      th.appendChild(el('span','vyear',v.year));th.appendChild(el('span','vplay','▶'));
      c.appendChild(th);c.appendChild(el('div','vtitle',v.title));
      c.setAttribute('aria-label','Xem video: '+v.title);
      c.addEventListener('click',function(){openVideo(v.id)});
      grid.appendChild(c);
    });
    sec.appendChild(grid);box.appendChild(sec);
  });
  if(!shown)box.appendChild(el('div','empty','Không tìm thấy video phù hợp.'));
}
$('videoSearch').addEventListener('input',function(){renderVideos(this.value)});

/* Trình phát */
var cur=-1,lastFocus=null,player=$('vPlayer'),modal=$('videoModal');
function indexOf(id){id=String(id);for(var i=0;i<VIDEOS.length;i++)if(VIDEOS[i].id===id)return i;return-1}
function isOpen(){return modal.classList.contains('open')}
function openVideo(id){
  var i=indexOf(id);if(i<0)return;
  var v=VIDEOS[i];cur=i;
  if(!isOpen())lastFocus=document.activeElement;
  $('vmodal').classList.toggle('landscape',v.orient==='landscape');
  $('vChap').textContent='Chương '+v.chapter+' · '+chapterTitle(v.chapter);
  $('vTitle').textContent=v.title;$('vYear').textContent=v.year;$('vExcerpt').textContent=v.excerpt||'';
  $('vPrev').disabled=i===0;$('vNext').disabled=i===VIDEOS.length-1;
  $('vUpNext').classList.remove('show');
  player.pause();player.src=v.file;
  modal.classList.add('open');document.body.style.overflow='hidden';
  var p=player.play();if(p&&p.catch)p.catch(function(){});
  $('vClose').focus();
}
function closeVideo(){
  if(!isOpen())return;
  player.pause();player.removeAttribute('src');player.load();
  modal.classList.remove('open');document.body.style.overflow='';cur=-1;
  if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}
}
function step(d){var n=cur+d;if(n>=0&&n<VIDEOS.length)openVideo(VIDEOS[n].id)}
window.openVideo=openVideo;window.closeVideo=closeVideo;
$('vClose').addEventListener('click',closeVideo);
$('vPrev').addEventListener('click',function(){step(-1)});
$('vNext').addEventListener('click',function(){step(1)});
$('vUpNext').addEventListener('click',function(){step(1)});
modal.addEventListener('click',function(e){if(e.target===modal)closeVideo()});
player.addEventListener('ended',function(){
  var n=cur+1;if(n>=VIDEOS.length)return;
  var b=$('vUpNext');b.textContent='Xem tiếp: '+VIDEOS[n].title+' ▶';b.classList.add('show');
});
document.addEventListener('keydown',function(e){
  if(!isOpen())return;
  if(e.key==='Escape'){e.preventDefault();closeVideo()}
  else if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}
  else if(e.key==='ArrowRight'){e.preventDefault();step(1)}
});

renderHome();renderVideos('');
})();
