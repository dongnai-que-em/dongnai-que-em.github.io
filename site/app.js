(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var CHAPTERS=window.CHAPTERS||[],TIMELINE=window.TIMELINE||[],VIDEOS=window.VIDEOS||[],RELICS=window.RELICS||[],
    PRODUCTS=window.PRODUCTS||[],PRODUCT_CATS=window.PRODUCT_CATS||[],LITERATURE=window.LITERATURE||[],LIT_CATS=window.LIT_CATS||[],
    ARTS=window.ARTS||[],QR_MAPS=window.QR_MAPS||[],WARDS=window.WARDS||[];
var PAGES=['trang-chu','lich-su','di-tich','san-vat','van-hoc','trong-em','xa-phuong','hoi-dap'];
var TITLES={'trang-chu':'','lich-su':'Lịch sử','di-tich':'Di tích','san-vat':'Sản vật','van-hoc':'Văn học','trong-em':'Đồng Nai trong em','xa-phuong':'Xã phường','hoi-dap':'Hỏi AI'};

function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function plain(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()}
function chapter(id){for(var i=0;i<CHAPTERS.length;i++)if(CHAPTERS[i].id===id)return CHAPTERS[i];return{title:'',color:'peach'}}
function catName(cats,id){for(var i=0;i<cats.length;i++)if(cats[i].id===id)return cats[i].icon+' '+cats[i].name;return''}

function notice(t){var e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(notice.t);notice.t=setTimeout(function(){e.classList.remove('show')},3500)}
window.notice=notice;

/* ---------- Thẻ nội dung dùng chung ---------- */
function card(o){
  var c=el('button','card');c.type='button';c.setAttribute('aria-label',(o.play==='video'?'Xem video: ':'Xem: ')+o.title);
  var th=el('div','thumb'+(o.shape?' '+o.shape:''));
  var img=document.createElement('img');img.src=o.thumb;img.alt='';img.loading='lazy';img.decoding='async';th.appendChild(img);
  if(o.badge)th.appendChild(el('span','badge',o.badge));
  if(o.play)th.appendChild(el('span','play'+(o.play==='video'?'':' img'),o.play==='video'?'▶':'⤢'));
  c.appendChild(th);
  var b=el('div','cbody');b.appendChild(el('h4','',o.title));if(o.desc)b.appendChild(el('p','',o.desc));
  if(o.tags&&o.tags.length){var m=el('div','meta');o.tags.forEach(function(t){m.appendChild(el('span','tag',t))});b.appendChild(m)}
  c.appendChild(b);c.addEventListener('click',o.onClick);return c;
}
function filterBar(box,items,cur,onPick){
  box.replaceChildren();
  items.forEach(function(it){
    var b=el('button','pill'+(it.id===cur?' on':''));b.type='button';b.setAttribute('aria-pressed',it.id===cur?'true':'false');
    b.appendChild(document.createTextNode(it.label));if(it.count!=null)b.appendChild(el('small','',' '+it.count));
    b.addEventListener('click',function(){onPick(it.id)});box.appendChild(b);
  });
}

/* ---------- Trình xem (video + ảnh) ---------- */
var V={list:[],i:-1,last:null},viewer=$('viewer'),stage=$('stage');
function vOpen(){return viewer.classList.contains('open')}
function stopMedia(){var v=stage.querySelector('video');if(v){v.pause();v.removeAttribute('src');v.load()}}
function show(list,i){
  if(i<0||i>=list.length)return;
  if(!vOpen())V.last=document.activeElement;
  V.list=list;V.i=i;var it=list[i];
  stopMedia();stage.replaceChildren();stage.className='stage';
  if(it.video){
    var v=document.createElement('video');v.controls=true;v.playsInline=true;v.preload='metadata';v.src=it.video;
    if(it.poster)v.poster=it.poster;
    stage.classList.toggle('portrait',it.orient!=='landscape');
    v.addEventListener('ended',function(){
      var n=V.list[V.i+1];if(!n)return;var b=$('vUpNext');b.textContent='Xem tiếp: '+n.title+' ▶';b.classList.add('show');
    });
    stage.appendChild(v);var p=v.play();if(p&&p.catch)p.catch(function(){});
  }else{
    var img=document.createElement('img');img.src=it.img;img.alt=it.title;stage.appendChild(img);
  }
  $('vKick').textContent=it.kick||'';$('vTitle').textContent=it.title;$('vText').textContent=it.text||'';
  var m=$('vMeta');m.replaceChildren();(it.tags||[]).forEach(function(t){m.appendChild(el('span','tag',t))});
  var open=$('vOpen');
  if(it.img){open.href=it.img;open.textContent=it.video?'🖼 Tranh minh họa':'⤢ Ảnh gốc';open.style.display=''}else open.style.display='none';
  $('vPrev').disabled=i===0;$('vNext').disabled=i===list.length-1;
  $('vUpNext').classList.remove('show');
  viewer.classList.add('open');document.body.style.overflow='hidden';stage.scrollTop=0;
  $('vClose').focus({preventScroll:true});
}
function closeViewer(){
  if(!vOpen())return;stopMedia();viewer.classList.remove('open');document.body.style.overflow='';
  if(V.last&&V.last.focus)try{V.last.focus({preventScroll:true})}catch(e){}
}
function step(d){show(V.list,V.i+d)}
$('vClose').addEventListener('click',closeViewer);
$('vPrev').addEventListener('click',function(){step(-1)});
$('vNext').addEventListener('click',function(){step(1)});
$('vUpNext').addEventListener('click',function(){step(1)});
viewer.addEventListener('click',function(e){if(e.target===viewer)closeViewer()});
document.addEventListener('keydown',function(e){
  if(!vOpen())return;
  if(e.key==='Escape'){e.preventDefault();closeViewer()}
  else if(e.target.tagName!=='VIDEO'&&e.key==='ArrowLeft'){e.preventDefault();step(-1)}
  else if(e.target.tagName!=='VIDEO'&&e.key==='ArrowRight'){e.preventDefault();step(1)}
});

/* ---------- Lịch sử ---------- */
function tThumb(t){return t.thumb||'img/lich-su/t/'+t.img+'.jpg'}
function tItem(t){
  var ch=chapter(t.chapter);
  return{title:t.title,kick:'Chương '+t.chapter+' · '+ch.title,text:t.excerpt,tags:['🗓 '+t.year,t.file?'🎬 Video':'🖼 Tranh minh họa'],
    video:t.file,orient:t.orient,img:t.img?'img/lich-su/'+t.img+'.jpg':null,poster:t.img?'img/lich-su/t/'+t.img+'.jpg':null,id:t.id};
}
var TL_ITEMS=TIMELINE.map(tItem);
function openTimeline(id){for(var i=0;i<TIMELINE.length;i++)if(TIMELINE[i].id===String(id))return show(TL_ITEMS,i)}
window.openVideo=openTimeline;window.closeVideo=closeViewer;
function tCard(t){
  return card({thumb:tThumb(t),badge:t.year,play:t.file?'video':'img',title:t.title,onClick:function(){openTimeline(t.id)}});
}
var hist={ch:0,q:''};
function renderHistory(){
  filterBar($('histFilters'),[{id:0,label:'Tất cả',count:TIMELINE.length}].concat(CHAPTERS.map(function(c){
    return{id:c.id,label:c.id+'. '+c.title,count:TIMELINE.filter(function(t){return t.chapter===c.id}).length}})),hist.ch,function(id){hist.ch=id;renderHistory()});
  var box=$('histList');box.replaceChildren();var key=plain(hist.q.trim()),shown=0;
  CHAPTERS.forEach(function(ch){
    if(hist.ch&&hist.ch!==ch.id)return;
    var list=TIMELINE.filter(function(t){return t.chapter===ch.id&&(!key||plain(t.title+' '+t.year).indexOf(key)>=0)});
    if(!list.length)return;shown+=list.length;
    var sec=el('div','chapter bg-'+ch.color),head=el('div','ch-head');
    head.appendChild(el('div','ch-num',String(ch.id)));
    var h=el('div');h.appendChild(el('small','','Chương '+ch.id+' · '+ch.sub));h.appendChild(el('h3','',ch.title));head.appendChild(h);
    var vids=list.filter(function(t){return t.file}).length;
    head.appendChild(el('span','tag cnt',vids+' video'+(list.length>vids?' · '+(list.length-vids)+' tranh':'')));
    sec.appendChild(head);
    if(ch.id===6&&!key){var cv=el('div','ch-cover'),ci=document.createElement('img');ci.src='img/lich-su/t/17-tam-nhin-tuong-lai.jpg';ci.alt='Tranh minh họa tầm nhìn tương lai của Đồng Nai';ci.loading='lazy';cv.appendChild(ci);sec.appendChild(cv)}
    var g=el('div','grid g3');list.forEach(function(t){g.appendChild(tCard(t))});sec.appendChild(g);box.appendChild(sec);
  });
  if(!shown)box.appendChild(el('div','empty','Không tìm thấy sự kiện phù hợp 🤔'));
}
$('histSearch').addEventListener('input',function(){hist.q=this.value;renderHistory()});

/* ---------- Di tích ---------- */
function renderRelics(){
  var items=RELICS.map(function(r){return{title:r.name,kick:'Di tích lịch sử',text:r.text,tags:['📍 '+r.place],img:'img/di-tich/'+r.id+'.jpg'}});
  var box=$('relicList');box.replaceChildren();
  RELICS.forEach(function(r,i){box.appendChild(card({thumb:'img/di-tich/t/'+r.id+'.jpg',shape:'wide',play:'img',title:r.name,desc:r.text,tags:['📍 '+r.place],onClick:function(){show(items,i)}}))});
}

/* ---------- Bộ sưu tập poster (sản vật, văn học) ---------- */
function gallery(o){
  var st={cat:'all'};
  function render(){
    filterBar($(o.filters),[{id:'all',label:'✨ Tất cả',count:o.data.length}].concat(o.cats.map(function(c){
      return{id:c.id,label:c.icon+' '+c.name,count:o.data.filter(function(d){return d.cat===c.id}).length}})),st.cat,function(id){st.cat=id;render()});
    var list=o.data.filter(function(d){return st.cat==='all'||d.cat===st.cat});
    var items=list.map(function(d){return{title:d.name,kick:catName(o.cats,d.cat),text:d.text,tags:o.tags(d),img:'img/'+o.dir+'/'+d.id+'.jpg'}});
    var box=$(o.list);box.replaceChildren();
    list.forEach(function(d,i){box.appendChild(card({thumb:'img/'+o.dir+'/t/'+d.id+'.jpg',shape:'tall top',title:d.name,desc:o.desc(d),onClick:function(){show(items,i)}}))});
  }
  render();
}

/* ---------- Đồng Nai trong em ---------- */
function renderTrongEm(){
  var q=QR_MAPS.map(function(d){return{title:d.name,kick:'Bản đồ khám phá · quét mã QR',text:d.text+' Bấm “Ảnh gốc” để xem rõ và quét mã QR bằng điện thoại.',tags:['📱 Có mã QR'],img:'img/trong-em/'+d.id+'.jpg'}});
  var qb=$('qrList');qb.replaceChildren();
  QR_MAPS.forEach(function(d,i){qb.appendChild(card({thumb:'img/trong-em/t/'+d.id+'.jpg',shape:'tall top',play:'img',badge:'📱 QR',title:d.name,desc:d.text,onClick:function(){show(q,i)}}))});
  var a=ARTS.map(function(d){return{title:d.name,kick:'Nghệ thuật quê hương',text:d.text,tags:[(d.tag==='Âm nhạc'?'🎵 ':'🖌 ')+d.tag],img:'img/trong-em/'+d.id+'.jpg'}});
  var ab=$('artList');ab.replaceChildren();
  ARTS.forEach(function(d,i){ab.appendChild(card({thumb:'img/trong-em/t/'+d.id+'.jpg',shape:'tall top',badge:(d.tag==='Âm nhạc'?'🎵 ':'🖌 ')+d.tag,title:d.name,desc:d.text,onClick:function(){show(a,i)}}))});
}

/* ---------- Xã phường ---------- */
var ward={t:'all',q:''};
function renderWards(){
  var p=WARDS.filter(function(w){return w[0]==='p'}).length;
  filterBar($('wardFilters'),[{id:'all',label:'📍 Tất cả',count:WARDS.length},{id:'p',label:'🏙 Phường',count:p},{id:'x',label:'🌾 Xã',count:WARDS.length-p}],ward.t,function(id){ward.t=id;renderWards()});
  var key=plain(ward.q.trim()),box=$('wardList');box.replaceChildren();var n=0;
  WARDS.forEach(function(w){
    if(ward.t!=='all'&&w[0]!==ward.t)return;if(key&&plain(w[1]).indexOf(key)<0)return;n++;
    var a=el('a','ward');a.href='https://vi.wikipedia.org/wiki/'+w[2];a.target='_blank';a.rel='noopener';
    a.title=(w[0]==='p'?'Phường ':'Xã ')+w[1]+' – mở Wikipedia';
    a.appendChild(el('i',w[0]==='p'?'bg-sky':'bg-mint',w[0]==='p'?'P':'X'));a.appendChild(el('span','',w[1]));a.appendChild(el('em','','↗'));
    box.appendChild(a);
  });
  if(!n)box.appendChild(el('div','empty','Không tìm thấy xã, phường phù hợp 🤔'));
}
$('wardSearch').addEventListener('input',function(){ward.q=this.value;renderWards()});

/* ---------- Trang chủ ---------- */
function renderHome(){
  var art=$('heroArt');
  [['01','1698 · Mở cõi','p1'],['16','2026 · Thành phố','p2'],['06','1930 · Phú Riềng Đỏ','p3']].forEach(function(x){
    var t=TIMELINE.filter(function(t){return t.id===x[0]})[0];if(!t)return;
    var f=el('div','polaroid '+x[2]),i=document.createElement('img');i.src=tThumb(t);i.alt='';f.appendChild(i);f.appendChild(el('span','',x[1]));art.appendChild(f);
  });
  art.appendChild(el('div','blob b1','🍊'));art.appendChild(el('div','blob b2','🏯'));
  var stats=[[VIDEOS.length,'Video','peach'],[TIMELINE.length,'Sự kiện','rose'],[RELICS.length,'Di tích','sky'],[PRODUCTS.length,'Sản vật','lemon'],[LITERATURE.length,'Tác phẩm','lilac'],[WARDS.length,'Xã phường','mint']];
  var sb=$('stats');stats.forEach(function(s){var d=el('div','stat bg-'+s[2]);d.appendChild(el('b','',String(s[0])));d.appendChild(el('span','',s[1]));sb.appendChild(d)});
  var topics=[
    ['lich-su','🎬','Lịch sử','Video & tranh từ 1698 đến 2065','peach',VIDEOS.length+' video',true],
    ['di-tich','🏯','Di tích','Văn miếu, thành cổ, đình, nhà lao','sky',RELICS.length+' di tích'],
    ['san-vat','🍊','Sản vật','Trái ngon, làng nghề, thổ cẩm','lemon',PRODUCTS.length+' sản vật'],
    ['van-hoc','📚','Văn học','Truyện, thơ, ca dao quê hương','rose',LITERATURE.length+' tác phẩm'],
    ['trong-em','🎨','Đồng Nai trong em','Bản đồ QR, âm nhạc, mĩ thuật','lilac',(QR_MAPS.length+ARTS.length)+' chủ đề'],
    ['xa-phuong','📍','Xã phường','Tra cứu 95 xã, phường','mint',WARDS.length+' đơn vị'],
    ['hoi-dap','✨','Hỏi trợ lý AI','Hỏi gì về Đồng Nai cũng được','lilac','Có giọng đọc']
  ];
  var tb=$('topics');
  topics.forEach(function(t){
    var a=el('a','topic bg-'+t[4]+(t[6]?' wide':''));a.href='#'+t[0];
    a.appendChild(el('span','ic',t[1]));a.appendChild(el('span','go','→'));a.appendChild(el('h4','',t[2]));a.appendChild(el('p','',t[3]));
    var m=el('span','tag',t[5]);m.style.marginTop='auto';a.appendChild(m);tb.appendChild(a);
  });
  var strip=$('homeStrip');TIMELINE.slice(0,9).forEach(function(t){strip.appendChild(tCard(t))});
}

/* ---------- Điều hướng theo #hash ---------- */
function route(){
  var name=(location.hash||'').replace('#','');if(PAGES.indexOf(name)<0)name='trang-chu';
  closeViewer();
  document.querySelectorAll('.page').forEach(function(s){s.classList.toggle('on',s.id==='p-'+name)});
  document.querySelectorAll('#nav a').forEach(function(a){var on=a.dataset.p===name;a.classList.toggle('on',on);if(on){a.setAttribute('aria-current','page');try{a.scrollIntoView({block:'nearest',inline:'center'})}catch(e){}}else a.removeAttribute('aria-current')});
  document.title=(TITLES[name]?TITLES[name]+' · ':'')+'Đồng Nai Quê Em';
  window.scrollTo(0,0);
  try{document.dispatchEvent(new CustomEvent('pagechange',{detail:name}))}catch(e){}
}
window.showPage=function(n){location.hash=n};
window.addEventListener('hashchange',route);

renderHome();renderHistory();renderRelics();
gallery({data:PRODUCTS,cats:PRODUCT_CATS,dir:'san-vat',filters:'prodFilters',list:'prodList',desc:function(d){return '📍 '+d.place},tags:function(d){return['📍 '+d.place]}});
gallery({data:LITERATURE,cats:LIT_CATS,dir:'van-hoc',filters:'litFilters',list:'litList',desc:function(d){return d.author},tags:function(d){return['✍️ '+d.author,'📘 '+d.genre].concat(d.year?['🗓 '+d.year]:[])}});
renderTrongEm();renderWards();route();
})();
