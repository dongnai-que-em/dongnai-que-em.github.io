(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var VIDEOS=window.VIDEOS||[],KNOWLEDGE=window.KNOWLEDGE||'';
var KEY_K='dnqe_api_key',MODEL_K='dnqe_model',DEFAULT_MODEL='claude-haiku-5-5';
var PROMPTS=['Nguyễn Hữu Cảnh vào Đồng Nai năm nào để làm gì?','Phong trào Phú Riềng Đỏ diễn ra thế nào?','Vì sao Chiến khu Đ quan trọng?','Kể về chiến thắng Đồng Xoài 1965'];
var history=[],busy=false,keyCardShown=false,proxy=false; /* proxy=true: server.py giữ key, trình duyệt không cần key */

function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
function lsGet(k){try{return localStorage.getItem(k)||''}catch(e){return''}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
function lsDel(k){try{localStorage.removeItem(k)}catch(e){}}
/* Key nhúng lúc deploy (config.js do workflow sinh từ GitHub secret, không nằm trong repo); key người dùng tự nhập thì ưu tiên hơn */
var EMBEDDED_KEY=(window.DNQE_CONFIG&&window.DNQE_CONFIG.apiKey)||'';
function getKey(){return lsGet(KEY_K)||EMBEDDED_KEY}
function hasKey(){return proxy||!!getKey()}
function getModel(){return lsGet(MODEL_K)||DEFAULT_MODEL}
function maskKey(k){return k.length>12?k.slice(0,7)+'…'+k.slice(-4):'••••'}

/* ---- Prompt hệ thống: phần ổn định (cache) đặt trước, không phụ thuộc lớp ---- */
function buildSystem(){
  var vids=VIDEOS.map(function(v){return v.id+' — '+v.year+' — '+v.title}).join('\n');
  return 'Bạn là trợ lý Giáo dục địa phương Đồng Nai dành cho học sinh THCS (lớp 6–9). Luôn trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, phù hợp lứa tuổi và đúng cấp lớp mà học sinh nêu ở đầu câu hỏi (ví dụ [Học sinh lớp 8]). Chỉ trả lời bằng văn bản thuần: không dùng tiêu đề markdown, không in đậm; có thể dùng các dòng ngắn bắt đầu bằng "•".\n'
  +'Hãy dựa vào tài liệu trong thẻ <tai_lieu>. Nếu tài liệu không đề cập nội dung được hỏi, hãy nói rõ "Tài liệu chưa đề cập…" rồi có thể bổ sung kiến thức chung, ghi chú rõ đó là kiến thức bổ sung ngoài tài liệu.\n\n'
  +'Danh sách video minh họa (ID — năm — tiêu đề):\n'+vids+'\n\n'
  +'Khi có video liên quan đến câu trả lời, hãy thêm ở cuối câu trả lời các dòng riêng có dạng [[video:ID]] (tối đa 2 dòng, chỉ dùng ID có trong danh sách trên).\n\n'
  +'<tai_lieu>\n'+KNOWLEDGE+'\n</tai_lieu>';
}
var SYSTEM=null;

/* ---- Hiển thị ---- */
var box=$('messages');
function scrollEnd(){box.scrollTop=box.scrollHeight}
function addMsg(role,text,opts){
  var m=el('div','msg '+role),b=el('div','bubble'+(opts&&opts.err?' err':''),text);
  m.appendChild(b);box.appendChild(m);scrollEnd();return m;
}
function videoById(id){for(var i=0;i<VIDEOS.length;i++)if(VIDEOS[i].id===id)return VIDEOS[i];return null}
function addBotAnswer(text,ids){
  var m=addMsg('bot',text),act=el('div','msg-actions');
  ids.forEach(function(id){var v=videoById(id);if(!v)return;
    var b=el('button','chip','▶ Xem video: '+v.title);b.type='button';b.addEventListener('click',function(){window.openVideo(id)});act.appendChild(b)});
  var l=el('button','chip','🔊 Nghe');l.type='button';l.addEventListener('click',function(){speak(text)});act.appendChild(l);
  m.appendChild(act);scrollEnd();
  if($('ttsAuto').checked)speak(text);
}
function showKeyCard(){
  if(keyCardShown)return;keyCardShown=true;
  var c=el('div','msg bot keycard');c.id='keyCard';
  c.appendChild(el('h4','','🔑 Cần nhập API key để trò chuyện với trợ lý'));
  c.appendChild(el('div','','Trợ lý dùng Claude của Anthropic. Thầy cô làm theo các bước sau:'));
  var ol=el('ol');['Vào console.anthropic.com, đăng nhập và tạo một API key (bắt đầu bằng sk-ant-).','Bấm "⚙ Cài đặt AI" bên dưới và dán key vào ô API key.','Bấm Lưu rồi đặt câu hỏi. Key chỉ lưu trong trình duyệt này.'].forEach(function(t){ol.appendChild(el('li','',t))});
  c.appendChild(ol);
  var b=el('button','btn primary','⚙ Mở Cài đặt AI');b.type='button';b.addEventListener('click',openSettings);c.appendChild(b);
  box.appendChild(c);
}
function hideKeyCard(){var c=$('keyCard');if(c)c.remove();keyCardShown=false}
function refreshKeyCard(){if(hasKey())hideKeyCard();else showKeyCard()}

/* ---- Cài đặt ---- */
var sm=$('settingsModal');
function openSettings(){
  var k=getKey();$('setKey').value='';
  $('setKeyHint').textContent=proxy?'API key do máy chủ giữ kín (file .env), không cần nhập ở đây.':k?'Key đã lưu: '+maskKey(k)+' (để trống nếu muốn giữ nguyên).':'Chưa có key.';
  $('setModel').value=getModel();sm.classList.add('open');$('setKey').focus();
}
function closeSettings(){sm.classList.remove('open')}
$('openSettings').addEventListener('click',openSettings);
$('setClose').addEventListener('click',closeSettings);
sm.addEventListener('click',function(e){if(e.target===sm)closeSettings()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&sm.classList.contains('open'))closeSettings()});
$('setSave').addEventListener('click',function(){
  var k=$('setKey').value.trim(),m=$('setModel').value.trim()||DEFAULT_MODEL,ok=true;
  if(k)ok=lsSet(KEY_K,k);
  ok=lsSet(MODEL_K,m)&&ok;
  closeSettings();refreshKeyCard();
  window.notice(ok?'Đã lưu cài đặt AI.':'Trình duyệt không cho lưu cài đặt (đang chặn bộ nhớ).');
});
$('setClear').addEventListener('click',function(){lsDel(KEY_K);closeSettings();refreshKeyCard();window.notice('Đã xóa API key khỏi trình duyệt.')});

/* ---- Gọi API ---- */
function errText(status,body){
  var msg=(body&&body.error&&body.error.message)||'';
  if(status===401||status===403)return 'API key không đúng hoặc đã hết hạn. Hãy kiểm tra lại trong "⚙ Cài đặt AI".';
  if(status===400&&/model/i.test(msg))return 'Model không hợp lệ, kiểm tra trong Cài đặt AI.';
  if(status===404&&/model/i.test(msg))return 'Model không hợp lệ, kiểm tra trong Cài đặt AI.';
  if(status===429||status===529||status>=500)return 'AI đang bận, em thử lại sau ít giây nhé.';
  return 'Có lỗi khi hỏi AI (mã '+status+'). '+msg;
}
async function ask(question,grade){
  if(!SYSTEM)SYSTEM=buildSystem();
  var msgs=history.slice(-6).concat([{role:'user',content:'[Học sinh lớp '+grade+'] '+question}]);
  var res;
  try{
    res=await fetch(proxy?'api/chat':'https://api.anthropic.com/v1/messages',{method:'POST',
      headers:proxy?{'content-type':'application/json'}:{'x-api-key':getKey(),'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','content-type':'application/json'},
      body:JSON.stringify({model:getModel(),max_tokens:1024,system:[{type:'text',text:SYSTEM,cache_control:{type:'ephemeral'}}],messages:msgs})});
  }catch(e){var n=new Error('Không kết nối được Internet. Em kiểm tra mạng rồi thử lại nhé.');n.shown=true;throw n}
  var data=null;try{data=await res.json()}catch(e){}
  if(!res.ok){var n2=new Error(errText(res.status,data));n2.shown=true;throw n2}
  var text=((data&&data.content)||[]).filter(function(b){return b.type==='text'}).map(function(b){return b.text}).join('');
  return text;
}
function parse(raw){
  var ids=[];
  var text=raw.replace(/\[\[video:\s*([^\]\s]+)\s*\]\]/g,function(_,id){if(ids.indexOf(id)<0&&videoById(id))ids.push(id);return''}).replace(/\n{3,}/g,'\n\n').trim();
  return{text:text||'(Trợ lý không trả lời được, em thử hỏi lại nhé.)',ids:ids.slice(0,2)};
}

var input=$('chatInput'),sendBtn=$('chatSend');
function setBusy(b){busy=b;sendBtn.disabled=b;sendBtn.textContent=b?'Đang trả lời…':'Gửi'}
async function send(text){
  if(busy)return;
  var q=(text!=null?text:input.value).trim();if(!q)return;
  if(!hasKey()){openSettings();return}
  stopSpeak();
  var typed=input.value;input.value='';
  var um=addMsg('user',q);
  var tm=el('div','msg bot'),tb=el('div','bubble');tb.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';tm.appendChild(tb);box.appendChild(tm);scrollEnd();
  setBusy(true);
  try{
    var raw=await ask(q,$('chatGrade').value),p=parse(raw);
    tm.remove();history.push({role:'user',content:q},{role:'assistant',content:p.text});
    addBotAnswer(p.text,p.ids);
  }catch(e){
    tm.remove();um.remove();
    addMsg('bot',e.shown?e.message:'Có lỗi không mong muốn: '+e.message,{err:true});
    if(!input.value)input.value=text!=null?q:typed||q;  /* giữ lại câu hỏi để gửi lại */
  }finally{setBusy(false);input.focus()}
}
sendBtn.addEventListener('click',function(){send()});
input.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send()}});
var pl=$('prompts');
PROMPTS.forEach(function(p){var b=el('button','prompt',p);b.type='button';b.addEventListener('click',function(){send(p)});pl.appendChild(b)});

/* ---- TTS ---- */
var synth=window.speechSynthesis,voices=[];
function loadVoices(){
  if(!synth){$('ttsStatus').textContent='Trình duyệt này không hỗ trợ đọc thành tiếng.';$('ttsVoice').disabled=true;return}
  var all=synth.getVoices();
  voices=all.filter(function(v){return /^vi/i.test(v.lang)});
  var sel=$('ttsVoice'),prev=sel.value;sel.replaceChildren();
  voices.forEach(function(v,i){var o=el('option','',v.name+' ('+v.lang+')');o.value=String(i);sel.appendChild(o)});
  if(prev&&voices[+prev])sel.value=prev;
  $('ttsStatus').textContent=voices.length?'Đã tìm thấy '+voices.length+' giọng tiếng Việt.':'Thiết bị chưa có giọng tiếng Việt, sẽ dùng giọng mặc định.';
}
if(synth){loadVoices();if(synth.addEventListener)synth.addEventListener('voiceschanged',loadVoices)}else loadVoices();
$('ttsRate').addEventListener('input',function(){$('ttsRateVal').textContent=this.value});
function stopSpeak(){if(synth)synth.cancel()}
function speak(text){
  if(!synth){window.notice('Trình duyệt này không hỗ trợ đọc thành tiếng.');return}
  synth.cancel();
  var u=new SpeechSynthesisUtterance(text),v=voices[+$('ttsVoice').value];
  u.lang='vi-VN';if(v){u.voice=v;u.lang=v.lang}u.rate=parseFloat($('ttsRate').value)||0.95;
  synth.speak(u);
}
$('ttsStop').addEventListener('click',stopSpeak);

/* ---- Khởi động ---- */
document.addEventListener('pagechange',function(e){
  if(e.detail==='chat'){refreshKeyCard();setTimeout(function(){try{input.focus({preventScroll:true})}catch(_){}},0)}else stopSpeak();
});
window.addEventListener('beforeunload',stopSpeak);
refreshKeyCard();
/* Dò xem có server.py (proxy giữ key) không; trên GitHub Pages/file:// sẽ lỗi và rơi về nhập key tay */
fetch('api/status',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(s){
  if(s&&s.proxy&&s.hasKey){proxy=true;refreshKeyCard()}
}).catch(function(){});
})();
