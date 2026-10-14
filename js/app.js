/* キラペン — app.js
   画面: はじめての設定 / My Room / 貯金箱 / 着せ替え・推し
   キャラのパーツは assets/parts.json で管理（画像を置いて1行足すと着せ替えに出る） */
(function(){
'use strict';
var KEY='kirapen-v1';
var DARK='#2B2440';
var COLORS=['#D6246E','#E85A8F','#2F6FD6','#22A3C8','#7B4BC9','#E07A12','#E8B416','#1F9A63','#D23A2E','#3C3F58'];
var HAIRPAL=[['orig','ミルクティー','#DEC7B8'],['#3B3542','黒','#3B3542'],['#7A5236','ブラウン','#7A5236'],['#F2A2C3','ピンク','#F2A2C3'],['#B8A0E8','ラベンダー','#B8A0E8'],['#8AB2EC','ブルー','#8AB2EC'],['#CDCEDA','シルバー','#CDCEDA'],['#F0CF72','ゴールド','#F0CF72']];
var CLOTHPAL=[['orig','そのまま','linear-gradient(135deg,#fff 50%,#E6E0DA 50%)'],['#F4F1EE','白','#F4F1EE'],['#2E3150','ネイビー','#2E3150'],['#D6246E','ピンク','#D6246E'],['#F7B8CF','ベビーピンク','#F7B8CF'],['#2F6FD6','ブルー','#2F6FD6'],['#BFD3F5','水色','#BFD3F5'],['#7B4BC9','パープル','#7B4BC9'],['#E07A12','オレンジ','#E07A12'],['#1F9A63','グリーン','#1F9A63'],['#E8B416','イエロー','#E8B416'],['#3B3542','黒','#3B3542']];
var WALLS=['#F8E1EA','#E2EAF8','#ECE4F7','#E1F2EA','#F6EEDB','#2E3150'];
var FLOORS=['#E8D2BC','#B98E6E','#D9D6D2','#F2C9D6'];
var WALLPATS=['無地','ドット','ストライプ','ハート'];
var FLOORPATS=['無地','フローリング'];
var CATS=[{id:'ticket',name:'チケット',c:'#E07A12'},{id:'goods',name:'グッズ',c:'#D6246E'},{id:'trip',name:'遠征',c:'#2F6FD6'},{id:'stream',name:'配信・CD',c:'#7B4BC9'},{id:'other',name:'その他',c:'#7C8495'}];
var UI_ORDER=['hair','top','bottom','shoes','acc','hold'];
var CHAR_W=148,CHAR_H=180;

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function hex2rgb(h){h=h.replace('#','');return [parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];}
function rgb2hex(a){return '#'+a.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16);}).join('');}
function tint(h,a){return rgb2hex(hex2rgb(h).map(function(v){return v+(255-v)*a;}));}
function shade(h,a){return rgb2hex(hex2rgb(h).map(function(v){return v*(1-a);}));}
function lum(h){var c=hex2rgb(h);return (0.299*c[0]+0.587*c[1]+0.114*c[2])/255;}
function yen(n){return Number(n||0).toLocaleString('ja-JP');}
function uid(){return Math.random().toString(36).slice(2,9);}
function pad(n){return (n<10?'0':'')+n;}
function todayStr(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function monthKey(off){var d=new Date();d.setDate(1);d.setMonth(d.getMonth()+off);return {key:d.getFullYear()+'-'+pad(d.getMonth()+1),label:d.getFullYear()+'年'+(d.getMonth()+1)+'月'};}
var STAR='M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z';
var HEART='M12 21s-9-5.6-9-12a5 5 0 019-3 5 5 0 019 3c0 6.4-9 12-9 12z';
var O=' stroke="#3C2A3E" stroke-opacity=".2" stroke-width="1.5"';
var counter=0,PHOTO=null,VISIT=null;
var KINDS=[['live','ライブ参戦'],['goods','グッズ'],['coord','推し色コーデ'],['word','ひとこと']];
var REASONS=['ライブ中に撮った写真・動画','アイドル本人の写真や画像','悪口・いやがらせ','個人情報がのっている','その他'];
var FEED={items:[],loading:false,done:false,error:'',oshi:'',liked:{},blocks:{},loaded:false,menu:null,confirm:null};
var ADMIN={open:false,loading:false,rows:[],error:''};
var POST={kind:'word',body:'',oshi:'',img:null,blob:null,busy:false};
var REPORT={post:null,reason:REASONS[0],busy:false};
function kindName(k){for(var i=0;i<KINDS.length;i++)if(KINDS[i][0]===k)return KINDS[i][1];return '';}
function ago(iso){var s=(Date.now()-Date.parse(iso))/1000;if(s<60)return 'たった今';if(s<3600)return Math.floor(s/60)+'分前';if(s<86400)return Math.floor(s/3600)+'時間前';if(s<604800)return Math.floor(s/86400)+'日前';var d=new Date(iso);return (d.getMonth()+1)+'/'+d.getDate();}
function safeMe(m){m=m&&typeof m==='object'?JSON.parse(JSON.stringify(m)):defMe();m.layers=m.layers||{};m.colors=m.colors||{};if(!m.layers.hair)m.layers.hair='bob';return m;}
function cloudOn(){return !!(window.KC&&window.KC.ready);}
function cloudUser(){return cloudOn()&&window.KC.user?window.KC.user:null;}
function roomLink(){var u=cloudUser();return u?location.origin+location.pathname+'?room='+u.id:'';}
function copyText(text,inputId){
  var sel=function(){var el=inputId&&document.getElementById(inputId);if(el){el.select();toast('文字を選んだので、コピーしてね');}else toast('コピーできませんでした');};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(function(){toast('コピーしました');},sel);else sel();
}

/* ================= Parts (character art) ================= */
var PARTS=null,SLOT={};
function slotItems(sid){return (SLOT[sid]&&SLOT[sid].items)||[];}
function findItem(sid,id){var l=slotItems(sid);for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return null;}
var RC={},RP={},DATA={};
function loadImg(src,cb){var img=new Image();img.onload=function(){cb(img);};img.onerror=function(){cb(null);};img.src=src;}
function recolor(src,hex,cb){
  loadImg(src,function(img){if(!img)return cb(null);try{
    var c=document.createElement('canvas');c.width=img.width;c.height=img.height;var x=c.getContext('2d');x.drawImage(img,0,0);
    var d=x.getImageData(0,0,c.width,c.height),p=d.data,t=hex2rgb(hex),sum=0,n=0,i,j;
    for(i=0;i<p.length;i+=4){if(p[i+3]>200){sum+=(0.299*p[i]+0.587*p[i+1]+0.114*p[i+2]);n++;}}
    var B=n?Math.max(0.2,Math.min(0.95,sum/n/255)):0.8,top=1/B-1;
    for(i=0;i<p.length;i+=4){if(!p[i+3])continue;var k=(0.299*p[i]+0.587*p[i+1]+0.114*p[i+2])/255/B;
      for(j=0;j<3;j++)p[i+j]=k<=1?t[j]*k:t[j]+(255-t[j])*Math.min(1,(k-1)/top);}
    x.putImageData(d,0,0);cb(c.toDataURL('image/png'));
  }catch(e){cb(null);}});
}
function srcFor(sid,item,color){
  if(!SLOT[sid].recolor||!color||color==='orig')return item.src;
  var k=sid+'|'+item.id+'|'+color;if(RC[k])return RC[k];
  if(!RP[k]){RP[k]=1;recolor(item.src,color,function(u){if(u){RC[k]=u;if(!drag)render();}});}
  return item.src;
}
function layers(me,ov){
  var out=[PARTS.base];
  PARTS.slots.forEach(function(sl){
    var id=ov&&ov.hasOwnProperty(sl.id)?ov[sl.id]:me.layers[sl.id];if(!id)return;
    var it=findItem(sl.id,id);if(it)out.push(srcFor(sl.id,it,me.colors[sl.id]));
  });
  return out;
}
function illustHTML(me,cls,ov){return '<span class="ill '+(cls||'')+'">'+layers(me,ov).map(function(s){return '<img src="'+esc(s)+'" alt="">';}).join('')+'</span>';}
function toData(src,cb){
  if(/^data:/.test(src))return cb(src);if(DATA[src])return cb(DATA[src]);
  loadImg(src,function(img){if(!img)return cb(src);try{var c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);DATA[src]=c.toDataURL('image/png');cb(DATA[src]);}catch(e){cb(src);}});
}

/* ================= Room items ================= */
function yq(x,a,b){var t=x/310;return a+b*t*(1-t);}
var ITEMS={
  window:{name:'窓',w:96,h:92,rc:1,def:{x:22,y:62,color:'#F7B8CF',on:true},draw:function(c){return '<rect x="6" y="4" width="84" height="78" rx="6" fill="#FFFFFF"'+O+'/><rect x="12" y="10" width="72" height="66" rx="3" fill="#BFE0F5"/><circle cx="66" cy="27" r="8" fill="#FFF3B0"/><ellipse cx="32" cy="44" rx="12" ry="6" fill="#FFFFFF"/><ellipse cx="40" cy="40" rx="8" ry="6" fill="#FFFFFF"/><path d="M48 10 V76 M12 43 H84" stroke="#FFFFFF" stroke-width="3"/><path d="M0 2 H24 Q18 44 28 90 H4 Q9 44 0 2Z" fill="'+c+'"'+O+'/><path d="M96 2 H72 Q78 44 68 90 H92 Q87 44 96 2Z" fill="'+c+'"'+O+'/><circle cx="18" cy="56" r="3" fill="'+shade(c,.2)+'"/><circle cx="78" cy="56" r="3" fill="'+shade(c,.2)+'"/><rect x="-2" y="-2" width="100" height="6" rx="3" fill="#B98C66"/>';}},
  garland:{name:'ガーランド',w:310,h:46,rc:1,def:{x:25,y:12,color:'#D6246E',on:true},draw:function(c){var s='<path d="M0 6 Q155 34 310 6" stroke="#B98C66" stroke-width="2" fill="none"/>';for(var i=0;i<8;i++){var x0=6+i*38,x1=x0+28,y0=yq(x0,6,56),y1=yq(x1,6,56),xm=(x0+x1)/2,ym=(y0+y1)/2+24;s+='<path d="M'+x0+' '+y0+' L'+x1+' '+y1+' L'+xm+' '+ym+' Z" fill="'+[c,'#FFFFFF',tint(c,.5)][i%3]+'"'+O+'/>';}return s;}},
  lights:{name:'ライト',w:300,h:40,rc:1,def:{x:30,y:6,color:'#D6246E',on:false},draw:function(c){var s='<path d="M0 4 Q150 30 300 4" stroke="#7A6A5E" stroke-width="1.6" fill="none"/>';for(var i=0;i<8;i++){var x=18+i*37,y=4+52*(x/300)*(1-x/300),f=[c,'#FFD86B',tint(c,.45)][i%3];s+='<circle cx="'+x+'" cy="'+(y+10)+'" r="9" fill="'+f+'" opacity=".25"/><rect x="'+(x-2.5)+'" y="'+(y+1)+'" width="5" height="4" rx="1" fill="#5B5162"/><ellipse cx="'+x+'" cy="'+(y+10)+'" rx="4.6" ry="6" fill="'+f+'"/>';}return s;}},
  frame:{name:'写真フレーム',w:84,h:100,rc:1,def:{x:138,y:64,color:'#D6246E',on:true},draw:function(c,u){var s='<rect width="84" height="100" rx="4" fill="'+c+'"'+O+'/><rect x="6" y="6" width="72" height="88" rx="2" fill="#FFFFFF"/>';if(PHOTO&&/^data:image\//.test(PHOTO)){s+='<clipPath id="fc'+u+'"><rect x="11" y="11" width="62" height="78"/></clipPath><image href="'+PHOTO+'" x="11" y="11" width="62" height="78" preserveAspectRatio="xMidYMid slice" clip-path="url(#fc'+u+')"/>';}else{s+='<rect x="11" y="11" width="62" height="78" fill="#F3EEE8"/><path d="M15 80 L33 58 L44 69 L53 60 L69 80 Z" fill="#DCD2C7"/><circle cx="56" cy="31" r="7" fill="#DCD2C7"/>';}return s+'<path d="M4 4 H80" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>';}},
  uchiwa:{name:'うちわ',w:56,h:86,rc:1,def:{x:250,y:30,color:'#D6246E',on:false},draw:function(c){return '<rect x="25" y="44" width="6" height="42" rx="3" fill="#C8955F"/><circle cx="28" cy="25" r="25" fill="#FFFFFF"'+O+'/><circle cx="28" cy="25" r="21" fill="'+c+'"/><path d="'+HEART+'" fill="#FFFFFF" transform="translate(17 14) scale(.92)"/><path d="'+STAR+'" fill="#FFD86B" transform="translate(37 4) scale(.45)"/>';}},
  poster:{name:'ポスター',w:70,h:92,rc:1,def:{x:126,y:170,color:'#7B4BC9',on:false},draw:function(c){return '<rect width="70" height="92" rx="3" fill="'+tint(c,.78)+'"'+O+'/><path d="'+STAR+'" fill="'+c+'" transform="translate(13 10) scale(1.8)"/><rect x="12" y="62" width="46" height="5" rx="2.5" fill="'+c+'"/><rect x="18" y="73" width="34" height="4" rx="2" fill="'+c+'" opacity=".55"/><rect x="-5" y="-2" width="20" height="8" fill="#FFFFFF" opacity=".75" transform="rotate(-25 5 2)"/><rect x="55" y="-2" width="20" height="8" fill="#FFFFFF" opacity=".75" transform="rotate(25 65 2)"/>';}},
  shelf:{name:'グッズ棚',w:110,h:122,rc:0,def:{x:236,y:88,color:'#B98C66',on:true},draw:function(){return '<rect width="110" height="122" rx="4" fill="#C9A076"'+O+'/><rect x="6" y="4" width="98" height="114" fill="#EED9BF"/><rect x="18" y="20" width="18" height="30" rx="4" fill="#FFFFFF" stroke="#D6246E" stroke-width="1.5"/><path d="'+STAR+'" fill="#D6246E" transform="translate(21 28) scale(.5)"/><rect x="16" y="49" width="22" height="4" rx="2" fill="#3C3F58"/><rect x="44" y="26" width="18" height="27" rx="2" fill="#2F6FD6"/><rect x="50" y="29" width="18" height="24" rx="2" fill="#F7B8CF"/><ellipse cx="88" cy="42" rx="12" ry="10" fill="#FFE1EC"'+O+'/><ellipse cx="80" cy="33" rx="3.5" ry="5" fill="#FFE1EC"/><ellipse cx="96" cy="33" rx="3.5" ry="5" fill="#FFE1EC"/><circle cx="84" cy="41" r="1.4" fill="'+DARK+'"/><circle cx="92" cy="41" r="1.4" fill="'+DARK+'"/><rect x="0" y="53" width="110" height="8" rx="2" fill="#B98C66"/><rect x="14" y="78" width="9" height="30" rx="1.5" fill="#E07A12"/><rect x="24" y="80" width="9" height="28" rx="1.5" fill="#7B4BC9"/><rect x="34" y="76" width="9" height="32" rx="1.5" fill="#1F9A63"/><rect x="48" y="84" width="26" height="24" rx="2" fill="#FFFFFF"'+O+'/><circle cx="61" cy="96" r="7" fill="#D6246E" opacity=".8"/><path d="M84 107 L94 76" stroke="#D6246E" stroke-width="5" stroke-linecap="round"/><rect x="0" y="108" width="110" height="10" rx="2" fill="#B98C66"/>';}},
  bed:{name:'ベッド',w:150,h:94,rc:1,def:{x:200,y:228,color:'#F7B8CF',on:true},draw:function(c){var s='<rect x="8" y="80" width="9" height="13" rx="2" fill="#A47A55"/><rect x="133" y="80" width="9" height="13" rx="2" fill="#A47A55"/><rect x="6" y="0" width="138" height="36" rx="14" fill="#C9A076"'+O+'/><rect x="0" y="26" width="150" height="56" rx="12" fill="#FFFFFF"'+O+'/><rect x="16" y="18" width="46" height="20" rx="10" fill="#FFFFFF"'+O+'/><rect x="68" y="18" width="40" height="20" rx="10" fill="'+tint(c,.55)+'"'+O+'/><path d="M0 46 H150 V72 Q150 82 138 82 H12 Q0 82 0 72 Z" fill="'+c+'"'+O+'/>';[[24,58],[56,66],[90,57],[122,66]].forEach(function(p){s+='<path d="'+HEART+'" fill="#FFFFFF" opacity=".8" transform="translate('+p[0]+' '+p[1]+') scale(.42)"/>';});return s;}},
  nui:{name:'推しぬい',w:46,h:44,rc:1,def:{x:290,y:228,color:'#D6246E',on:true},draw:function(c){var b=tint(c,.45);return '<ellipse cx="11" cy="11" rx="5.5" ry="7.5" fill="'+b+'"'+O+'/><ellipse cx="35" cy="11" rx="5.5" ry="7.5" fill="'+b+'"'+O+'/><ellipse cx="23" cy="27" rx="21" ry="17" fill="'+b+'"'+O+'/><circle cx="16" cy="25" r="2" fill="'+DARK+'"/><circle cx="30" cy="25" r="2" fill="'+DARK+'"/><path d="M20 30 Q23 33 26 30" stroke="'+DARK+'" stroke-width="1.5" fill="none" stroke-linecap="round"/><ellipse cx="11" cy="31" rx="3.5" ry="2" fill="#F29BB5" opacity=".7"/><ellipse cx="35" cy="31" rx="3.5" ry="2" fill="#F29BB5" opacity=".7"/><path d="'+STAR+'" fill="'+c+'" transform="translate(18 33) scale(.42)"/>';}},
  table:{name:'テーブル',w:92,h:52,rc:0,def:{x:40,y:300,color:'#E8C9A0',on:false},draw:function(){return '<rect x="14" y="18" width="7" height="32" rx="3" fill="#C9A076"/><rect x="71" y="18" width="7" height="32" rx="3" fill="#C9A076"/><ellipse cx="46" cy="17" rx="46" ry="14" fill="#E8C9A0"'+O+'/><ellipse cx="46" cy="14" rx="40" ry="9" fill="#F0D7B4"/><rect x="52" y="2" width="12" height="12" rx="3" fill="#FFFFFF"'+O+'/><path d="M64 5 q5 2 0 6" stroke="#CFC7BF" stroke-width="2" fill="none"/>';}},
  acstand:{name:'アクスタ',w:34,h:58,rc:1,def:{x:72,y:262,color:'#2F6FD6',on:false},draw:function(c){return '<ellipse cx="17" cy="53" rx="16" ry="4.5" fill="#3C3F58"/><rect x="4" y="2" width="26" height="48" rx="6" fill="#FFFFFF" fill-opacity=".92" stroke="'+c+'" stroke-width="2"/><path d="'+STAR+'" fill="'+c+'" transform="translate(7 12) scale(.85)"/><path d="'+HEART+'" fill="'+tint(c,.4)+'" transform="translate(11 34) scale(.5)"/><path d="M8 6 V20" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>';}},
  rug:{name:'ラグ',w:190,h:46,rc:1,def:{x:70,y:322,color:'#D6246E',on:true},draw:function(c){return '<ellipse cx="95" cy="23" rx="95" ry="23" fill="'+tint(c,.62)+'"'+O+'/><ellipse cx="95" cy="23" rx="80" ry="16" fill="'+tint(c,.5)+'"/><path d="'+STAR+'" fill="#FFFFFF" opacity=".8" transform="translate(30 15) scale(.5)"/><path d="'+STAR+'" fill="#FFFFFF" opacity=".8" transform="translate(148 15) scale(.5)"/><path d="'+HEART+'" fill="#FFFFFF" opacity=".8" transform="translate(89 16) scale(.5)"/>';}},
  plant:{name:'観葉植物',w:48,h:74,rc:0,def:{x:12,y:248,color:'#5E9E6E',on:true},draw:function(){return '<ellipse cx="14" cy="16" rx="8" ry="15" fill="#6FB17E" transform="rotate(-25 14 16)"/><ellipse cx="34" cy="16" rx="8" ry="15" fill="#4C8A5C" transform="rotate(25 34 16)"/><ellipse cx="24" cy="12" rx="7" ry="13" fill="#7FC28C"/><ellipse cx="9" cy="30" rx="6" ry="11" fill="#4C8A5C" transform="rotate(-55 9 30)"/><ellipse cx="39" cy="30" rx="6" ry="11" fill="#6FB17E" transform="rotate(55 39 30)"/><path d="M12 40 H36 L33 72 Q24 76 15 72 Z" fill="#E3A07A"'+O+'/><rect x="9" y="36" width="30" height="8" rx="3" fill="#D08B66"/>';}},
  penlight:{name:'ペンライト立て',w:40,h:72,rc:1,def:{x:78,y:236,color:'#D6246E',on:true},draw:function(c){var s='';[[10,c,-12],[20,tint(c,.4),0],[30,shade(c,.15),12]].forEach(function(p){s+='<g transform="rotate('+p[2]+' 20 60)"><circle cx="'+p[0]+'" cy="8" r="7" fill="'+p[1]+'" opacity=".3"/><rect x="'+(p[0]-3.5)+'" y="4" width="7" height="50" rx="3.5" fill="'+p[1]+'"/></g>';});return s+'<rect x="6" y="44" width="28" height="26" rx="6" fill="#FFFFFF"'+O+'/><path d="'+HEART+'" fill="'+c+'" transform="translate(13 50) scale(.58)"/>';}},
  cushion:{name:'クッション',w:48,h:44,rc:1,def:{x:232,y:330,color:'#D6246E',on:false},draw:function(c){return '<path d="M24 42s-22-12.6-22-27a11.5 11.5 0 0122-6.3 11.5 11.5 0 0122 6.3c0 14.4-22 27-22 27z" fill="'+c+'"'+O+'/><path d="M24 36s-16-9.6-16-20.5a8 8 0 0116-4.5 8 8 0 0116 4.5C40 26.4 24 36 24 36z" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-dasharray="3 3" opacity=".7"/>';}},
  piggy:{name:'貯金箱',w:64,h:56,rc:0,def:{x:16,y:318,color:'#F2B9CD',on:true},draw:function(){return '<g transform="scale(.667)"><ellipse cx="48" cy="46" rx="38" ry="30" fill="#F2B9CD"'+O+'/><path d="M14 44 C14 30 28 18 48 18 C68 18 82 30 82 44 Z" fill="#F7CFDD"/><path d="M24 22 L30 8 L38 19 Z" fill="#F2B9CD"/><rect x="38" y="18" width="20" height="5" rx="2.5" fill="#9A174E"/><ellipse cx="82" cy="48" rx="8" ry="7" fill="#F7CFDD"'+O+'/><circle cx="80" cy="47" r="1.5" fill="#9A174E"/><circle cx="84" cy="47" r="1.5" fill="#9A174E"/><circle cx="68" cy="38" r="2.5" fill="'+DARK+'"/><ellipse cx="66" cy="54" rx="5" ry="3" fill="#F29BB5"/><rect x="24" y="72" width="10" height="10" rx="3" fill="#F2B9CD"/><rect x="60" y="72" width="10" height="10" rx="3" fill="#F2B9CD"/></g>';}}
};
var CATALOG=['bed','window','shelf','frame','garland','lights','poster','uchiwa','nui','acstand','penlight','rug','cushion','table','plant','piggy'];
var ORDER=['window','lights','garland','poster','frame','uchiwa','shelf','bed','nui','table','acstand','rug','plant','penlight','piggy','char','cushion'];
function drawItem(id,color,u){var r=PARTS&&PARTS.room&&PARTS.room[id],d=ITEMS[id];if(r&&r.src)return '<image href="'+esc(r.src)+'" width="'+d.w+'" height="'+d.h+'" preserveAspectRatio="xMidYMid meet"/>';return d.draw(color,u);}

/* ================= State ================= */
function defMe(){return {name:'',layers:{hair:'bob'},colors:{hair:'orig'}};}
function newState(){
  var items={};CATALOG.forEach(function(id){var d=ITEMS[id].def;items[id]={on:d.on,x:d.x,y:d.y,color:d.color};});
  return {v:1,onboarded:false,me:defMe(),oshis:[],room:{wall:WALLS[0],wallPat:1,floor:FLOORS[0],floorPat:1,items:items,char:{x:110,y:168},photo:null},money:{budget:25000,records:[]},events:[]};
}
function fixState(s){
  if(!s||s.v!==1||!s.me||!s.room||!s.money)return null;
  s.me.layers=s.me.layers||{};s.me.colors=s.me.colors||{};if(!s.me.layers.hair)s.me.layers.hair='bob';
  s.oshis=s.oshis||[];s.money.records=s.money.records||[];s.events=Array.isArray(s.events)?s.events:[];
  CATALOG.forEach(function(id){if(!s.room.items[id]){var d=ITEMS[id].def;s.room.items[id]={on:false,x:d.x,y:d.y,color:d.color};}});
  return s;
}
function load(){try{var t=localStorage.getItem(KEY);return t?fixState(JSON.parse(t)):null;}catch(e){return null;}}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(S));return true;}catch(e){return false;}}
function save(){var ok=saveLocal();if(S.onboarded&&cloudUser())window.KC.schedulePush(S);return ok;}
function stateFromServer(sv){
  var p=sv.pub||{},q=sv.priv||{};
  return fixState({v:1,onboarded:true,me:p.me||defMe(),oshis:p.oshis||[],room:p.room||newState().room,money:q.money||{budget:25000,records:[]},events:q.events||[]});
}
var S=load()||newState();
var UI={authMode:'in',authEmail:'',authPw:'',authBusy:false,conflict:null,tab:'room',step:0,deco:false,sel:null,pane:'items',month:0,sheet:null,recAmount:'',recMemo:'',recDate:todayStr(),recCat:'goods',recOshi:'',del:null,budgetEdit:false,reset:false,oshiDraft:'',oshiColor:COLORS[0],shareURL:null,backup:null,restoreText:'',calMonth:0,calDay:null,ev:null,evDel:false,doc:null,agree:false,delAcct:0};
var toastT;
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){t.hidden=true;},2200);}

/* ================= Room SVG ================= */
function charG(R,opts){
  var s='<g class="it" data-id="char" transform="translate('+R.char.x+' '+R.char.y+')"><ellipse cx="'+(CHAR_W/2)+'" cy="'+(CHAR_H-6)+'" rx="34" ry="7" fill="#000" opacity=".08"/>';
  (opts.layers||layers(opts.me||S.me)).forEach(function(src){s+='<image href="'+esc(src)+'" width="'+CHAR_W+'" height="'+CHAR_H+'"/>';});
  return s+selRect('char',CHAR_W,CHAR_H,opts)+'</g>';
}
function roomSVG(opts){
  opts=opts||{};var R=opts.room||S.room,M=opts.me||S.me,u='r'+(++counter),s='';PHOTO=R.photo||null;
  var pc=lum(R.wall)<.45?tint(R.wall,.12):shade(R.wall,.07),fl=shade(R.floor,.1);
  s+='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 380" width="360" height="380"'+(opts.id?' id="'+opts.id+'"':'')+(opts.cls?' class="'+opts.cls+'"':'')+' role="img" aria-label="'+esc((M.name||'わたし')+'の部屋')+'"><defs>';
  s+='<pattern id="wp'+u+'" width="24" height="24" patternUnits="userSpaceOnUse">';
  if(R.wallPat===1)s+='<circle cx="6" cy="6" r="2.6" fill="'+pc+'"/><circle cx="18" cy="18" r="2.6" fill="'+pc+'"/>';
  else if(R.wallPat===2)s+='<rect width="12" height="24" fill="'+pc+'"/>';
  else if(R.wallPat===3)s+='<path d="'+HEART+'" fill="'+pc+'" transform="translate(2 2) scale(.4)"/><path d="'+HEART+'" fill="'+pc+'" transform="translate(14 14) scale(.4)"/>';
  s+='</pattern><pattern id="fp'+u+'" width="72" height="24" patternUnits="userSpaceOnUse"><path d="M0 23.5 H72 M24 0 V12 M60 12 V24 M0 11.5 H72" stroke="'+fl+'" stroke-width="1.2" fill="none"/></pattern></defs>';
  s+='<rect width="360" height="262" fill="'+R.wall+'"/>'+(R.wallPat?'<rect width="360" height="262" fill="url(#wp'+u+')"/>':'');
  s+='<rect y="262" width="360" height="118" fill="'+R.floor+'"/>'+(R.floorPat?'<rect y="262" width="360" height="118" fill="url(#fp'+u+')"/>':'');
  s+='<rect y="252" width="360" height="12" fill="#FFFFFF" opacity=".7"/><rect y="262" width="360" height="3" fill="'+shade(R.floor,.18)+'" opacity=".6"/>';
  ORDER.forEach(function(id){
    if(id==='char'){s+=charG(R,opts);return;}
    var it=R.items[id],d=ITEMS[id];if(!it||!it.on)return;
    s+='<g class="it" data-id="'+id+'" transform="translate('+it.x+' '+it.y+')"><rect width="'+d.w+'" height="'+d.h+'" fill="#000" fill-opacity="0"/>'+drawItem(id,it.color,u+id)+selRect(id,d.w,d.h,opts)+'</g>';
  });
  return s+'</svg>';
}
function selRect(id,w,h,opts){if(opts.export||!UI.deco||UI.sel!==id)return '';return '<rect x="-5" y="-5" width="'+(w+10)+'" height="'+(h+10)+'" rx="6" fill="none" stroke="#FFFFFF" stroke-width="4"/><rect x="-5" y="-5" width="'+(w+10)+'" height="'+(h+10)+'" rx="6" fill="none" stroke="#1E2140" stroke-width="2" stroke-dasharray="6 4"/>';}
function thumb(id){var d=ITEMS[id],it=S.room.items[id],p=8;PHOTO=S.room.photo||null;return '<svg viewBox="'+(-p)+' '+(-p)+' '+(d.w+2*p)+' '+(d.h+2*p)+'" aria-hidden="true">'+drawItem(id,it.color,'t'+id+(++counter))+'</svg>';}

/* ================= Character editor ================= */
function charEditor(){
  var h='<div class="stage">'+illustHTML(S.me,'ill-lg')+'</div>',empty=[];
  UI_ORDER.forEach(function(sid){
    var sl=SLOT[sid];if(!sl)return;var items=sl.items||[];
    if(!items.length){empty.push(sl.name);return;}
    var cur=S.me.layers[sid]||'';
    h+='<div class="stack"><span class="lbl">'+esc(sl.name)+'</span><div class="opts">';
    if(sl.optional)h+='<button type="button" class="opt'+(!cur?' on':'')+'" data-act="layer" data-k="'+sid+'" data-v=""><span class="none">なし</span>なし</button>';
    items.forEach(function(it){var ov={};ov[sid]=it.id;h+='<button type="button" class="opt'+(cur===it.id?' on':'')+'" data-act="layer" data-k="'+sid+'" data-v="'+esc(it.id)+'"><span class="ill-th">'+illustHTML(S.me,'sl-'+sid,ov)+'</span>'+esc(it.name)+'</button>';});
    h+='</div></div>';
    if(sl.recolor&&cur){
      var pal=sl.palette==='hair'?HAIRPAL:CLOTHPAL,cc=S.me.colors[sid]||'orig';
      var cl=sid==='hair'?'髪':sl.name;h+='<div class="stack"><span class="lbl">'+esc(cl)+'の色</span><div class="swrow">';
      pal.forEach(function(c){h+='<button type="button" class="sw'+(cc===c[0]?' on':'')+'" style="background:'+c[2]+'" data-act="lcolor" data-k="'+sid+'" data-v="'+c[0]+'" aria-label="'+esc(sl.name)+'の色 '+c[1]+'"></button>';});
      h+='</div></div>';
    }
  });
  if(empty.length){h+='<div class="stack"><span class="lbl">イラスト準備中</span><div class="soon">';empty.forEach(function(n){h+='<span>'+esc(n)+'</span>';});h+='</div></div>';}
  return h;
}

/* ================= Views ================= */
function vWelcome(){
  var ic=function(d){return '<span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg></span>';};
  var h='<div class="welcome"><div class="stage">'+illustHTML(S.me,'ill-lg')+'</div>';
  h+='<div class="stack" style="gap:6px"><span class="tag" style="align-self:flex-start">キラペン</span><h1 class="welcome-title">わたしの部屋を、<br>推し色に。</h1></div>';
  h+='<ul class="welcome-points"><li>'+ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.2-7 8-7s7 2.5 8 7"/>')+'自分のキャラをつくって着せ替え</li><li>'+ic('<path d="M4 11l8-7 8 7v9H4z"/>')+'推し色の家具で、My Roomをかざる</li><li>'+ic('<ellipse cx="12" cy="13" rx="8" ry="6"/><path d="M10 7h4"/>')+'推し活に使ったお金を貯金箱に記録</li></ul>';
  h+='<button class="btn primary block" type="button" data-act="onb-start" style="min-height:54px;font-size:16px">はじめる</button>';
  if(cloudOn())h+='<button class="btn block" type="button" data-act="auth-open">ログインして続きから</button>';
  return h+'</div>';
}
function vOnboard(){
  if(UI.step===0)return vWelcome();
  var h='<div class="row" style="gap:12px">';
  h+='<button class="btn sm" type="button" data-act="onb-back">戻る</button>';
  h+='<div class="progress" style="flex:1"><i class="on"></i><i class="'+(UI.step>=2?'on':'')+'"></i><i class="'+(UI.step>=3?'on':'')+'"></i></div><span class="small muted num">'+UI.step+' / 3</span></div>';
  if(UI.step===1){
    h+='<div class="stack" style="gap:4px"><span class="tag" style="align-self:flex-start">キラペンへようこそ</span><h1>あなたのキャラをつくろう</h1><p class="muted small" style="margin:0">My Roomの主人公になります。あとから着せ替えできます。</p></div>';
    h+=charEditor()+'<label class="field"><span>ニックネーム</span><input class="input" id="onb-name" maxlength="12" placeholder="例：みつき" value="'+esc(S.me.name)+'"></label><button class="btn primary block" type="button" data-act="onb-next">次へ</button>';
  }else if(UI.step===2){
    h+='<div class="stack" style="gap:4px"><h1>推しを登録しよう</h1><p class="muted small" style="margin:0">推しの名前と推し色を入れてね。部屋の家具が推し色にそろって、貯金箱で推しごとの金額が分かるようになります。</p></div>';
    h+=oshiEditor('onb')+'<button class="btn primary block" type="button" data-act="onb-next">次へ</button><button class="btn ghost block" type="button" data-act="onb-next">あとで登録する</button>';
  }else{
    h+='<div class="stack" style="gap:4px"><h1>My Roomができました</h1><p class="muted small" style="margin:0">はじめての家具と飾りを置いておいたよ。模様替えで好きな場所に動かしてね。</p></div><div class="room-wrap">'+roomSVG({})+'</div><button class="btn primary block" type="button" data-act="finish">部屋に入る</button>';
  }
  return h;
}
function oshiEditor(prefix){
  var h='<div class="card stack"><label class="field"><span>推しの名前（グループ名・メンバー名）</span><input class="input" id="'+prefix+'-oshi" maxlength="20" placeholder="例：推しグループの名前" value="'+esc(UI.oshiDraft)+'"></label><div class="stack"><span class="lbl">推し色</span><div class="swrow">';
  COLORS.forEach(function(c){h+='<button type="button" class="sw'+(UI.oshiColor===c?' on':'')+'" style="background:'+c+'" data-act="oshi-color" data-v="'+c+'" aria-label="推し色 '+c+'"></button>';});
  h+='</div></div><button class="btn dark" type="button" data-act="oshi-add">＋ 推しを追加</button></div>';
  if(S.oshis.length){h+='<div class="row wrap">';S.oshis.forEach(function(o){h+='<span class="chip"><span class="dot" style="background:'+o.color+'"></span>'+esc(o.name)+'<button type="button" data-act="oshi-del" data-v="'+o.id+'" aria-label="'+esc(o.name)+'を外す" style="border:0;background:transparent;padding:0 0 0 4px;color:var(--muted)">×</button></span>';});h+='</div>';}
  else h+='<p class="small muted" style="margin:0">まだ登録されていません。</p>';
  return h;
}
function vRoom(){
  var h='<div class="row between"><div><h1>My Room</h1><p class="small muted" style="margin:0">'+esc(S.me.name||'わたし')+'の部屋</p></div><span class="tag">キラペン</span></div>';
  if(!UI.deco)h+=nextBanner();
  h+='<div class="room-wrap">'+roomSVG({id:'room',cls:UI.deco?'deco':''})+'</div>';
  if(!UI.deco){
    h+='<div class="row"><button class="btn primary" style="flex:1" type="button" data-act="deco-start"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16z"/></svg>模様替え</button><button class="btn" style="flex:1" type="button" data-act="tab" data-v="settings">着せ替え</button></div>';
    h+='<div class="row"><button class="btn" style="flex:1" type="button" data-act="share">シェア画像</button><button class="btn" style="flex:1" type="button" data-act="'+(cloudUser()?'link-copy':'auth-open')+'">部屋のリンク</button></div><p class="hint"><span class="dot" style="background:#F2B9CD"></span>部屋の貯金箱をタップすると、推し活に使ったお金を記録できます。</p>';
    if(S.oshis.length){h+='<div class="stack"><h3>わたしの推し</h3><div class="row wrap">';S.oshis.forEach(function(o){h+='<span class="chip"><span class="dot" style="background:'+o.color+'"></span>'+esc(o.name)+'</span>';});h+='</div></div>';}
  }else h+=vDecoPanel();
  return h;
}
function vDecoPanel(){
  var h='<div class="panel"><div class="row between"><h3>模様替え中</h3><button class="btn primary sm" type="button" data-act="deco-done">完了</button></div><p class="small muted" style="margin:0">アイテムやキャラをドラッグして動かせます。タップで選ぶと色を変えられます。</p>';
  if(UI.sel){
    var isChar=UI.sel==='char',d=isChar?null:ITEMS[UI.sel],it=isChar?null:S.room.items[UI.sel];
    h+='<div class="selbar"><div class="row between"><b>'+(isChar?'わたしのキャラ':esc(d.name))+'</b>'+(isChar?'':'<button class="mini" type="button" data-act="deco-toggle" data-v="'+UI.sel+'">片付ける</button>')+'</div>';
    if(!isChar&&d.rc){h+='<div class="swrow">';var list=COLORS.concat(['#F7B8CF','#BFD3F5','#FFFFFF']);S.oshis.forEach(function(o){if(list.indexOf(o.color)<0)list.unshift(o.color);});list.forEach(function(c){h+='<button type="button" class="sw'+(it.color===c?' on':'')+'" style="background:'+c+'" data-act="deco-color" data-v="'+c+'" aria-label="色 '+c+'"></button>';});h+='</div>';}
    if(UI.sel==='frame')h+='<label class="btn sm" for="photo-in" style="align-self:flex-start">'+(S.room.photo?'写真を変える':'写真を選ぶ')+'</label><input type="file" id="photo-in" accept="image/*" hidden><p class="small muted" style="margin:0">自分で撮ったグッズや会場の外の写真を飾れます。アイドル本人の写真は使わないでね。</p>';
    if(isChar)h+='<p class="small muted" style="margin:0">服や髪型は「着せ替え・推し」タブで変えられます。</p>';
    h+='</div>';
  }
  h+='<div class="seg"><button type="button" class="'+(UI.pane==='items'?'on':'')+'" data-act="pane" data-v="items">家具・グッズ</button><button type="button" class="'+(UI.pane==='walls'?'on':'')+'" data-act="pane" data-v="walls">壁紙・床</button></div>';
  if(UI.pane==='items'){h+='<div class="grid4">';CATALOG.forEach(function(id){var on=S.room.items[id].on;h+='<button type="button" class="item'+(on?' on':'')+'" data-act="deco-toggle" data-v="'+id+'">'+thumb(id)+'<span>'+ITEMS[id].name+'</span><span class="st">'+(on?'配置中':'置く')+'</span></button>';});h+='</div>';}
  else{
    h+='<div class="stack"><span class="lbl">壁紙の色</span><div class="swrow">';WALLS.forEach(function(c){h+='<button type="button" class="sw'+(S.room.wall===c?' on':'')+'" style="background:'+c+'" data-act="wall" data-v="'+c+'" aria-label="壁紙 '+c+'"></button>';});h+='</div></div>';
    h+='<div class="stack"><span class="lbl">壁紙の柄</span><div class="row wrap">';WALLPATS.forEach(function(n,i){h+='<button type="button" class="chip'+(S.room.wallPat===i?' on':'')+'" data-act="wallpat" data-v="'+i+'">'+n+'</button>';});h+='</div></div>';
    h+='<div class="stack"><span class="lbl">床の色</span><div class="swrow">';FLOORS.forEach(function(c){h+='<button type="button" class="sw'+(S.room.floor===c?' on':'')+'" style="background:'+c+'" data-act="floor" data-v="'+c+'" aria-label="床 '+c+'"></button>';});h+='</div></div>';
    h+='<div class="stack"><span class="lbl">床の柄</span><div class="row wrap">';FLOORPATS.forEach(function(n,i){h+='<button type="button" class="chip'+(S.room.floorPat===i?' on':'')+'" data-act="floorpat" data-v="'+i+'">'+n+'</button>';});h+='</div></div>';
  }
  return h+'</div>';
}
function monthRecs(key){return S.money.records.filter(function(r){return r.date.slice(0,7)===key;});}
function vMoney(){
  var m=monthKey(UI.month),recs=monthRecs(m.key),total=recs.reduce(function(a,r){return a+r.amount;},0);
  var all=S.money.records.reduce(function(a,r){return a+r.amount;},0),budget=S.money.budget||0,left=budget-total,pct=budget?Math.min(100,Math.round(total/budget*100)):0;
  var h='<div class="row between"><h1>推し活の貯金箱</h1><span class="tag">自分だけに表示</span></div>';
  if(S.money.records.some(function(r){return r.example;}))h+='<div class="banner"><span>使い方の例が入っています</span><button class="mini" type="button" data-act="ex-clear">例を消す</button></div>';
  h+='<div class="row between"><button class="btn sm" type="button" data-act="month" data-v="-1">‹ 前の月</button><b class="num">'+m.label+'</b><button class="btn sm" type="button" data-act="month" data-v="1">次の月 ›</button></div>';
  var fy=Math.round(76-pct*0.6);
  h+='<div class="hero-money"><svg width="92" height="80" viewBox="0 0 96 84" aria-hidden="true"><defs><clipPath id="pigc"><ellipse cx="48" cy="46" rx="38" ry="30"/></clipPath></defs><ellipse cx="48" cy="46" rx="38" ry="30" fill="#F2B9CD"/><rect x="8" y="'+fy+'" width="80" height="84" fill="#D6246E" opacity=".55" clip-path="url(#pigc)"/><path d="M24 22 L30 8 L38 19 Z" fill="#F2B9CD"/><rect x="38" y="18" width="20" height="5" rx="2.5" fill="#9A174E"/><ellipse cx="82" cy="48" rx="8" ry="7" fill="#F7CFDD"/><circle cx="80" cy="47" r="1.5" fill="#9A174E"/><circle cx="84" cy="47" r="1.5" fill="#9A174E"/><circle cx="68" cy="38" r="2.5" fill="#1E2140"/><rect x="24" y="72" width="10" height="10" rx="3" fill="#F2B9CD"/><rect x="60" y="72" width="10" height="10" rx="3" fill="#F2B9CD"/></svg><div style="min-width:0"><div class="small" style="font-weight:700;color:var(--soft-ink)">'+m.label+'に使った金額</div><div class="big num">¥'+yen(total)+'</div><div class="small muted num">これまでの合計 ¥'+yen(all)+'</div></div></div>';
  h+='<div class="card stack">';
  if(UI.budgetEdit)h+='<form class="row" data-form="budget"><label class="field" style="flex:1"><span>毎月の推し活予算（円）</span><input class="input num" id="budget-in" inputmode="numeric" value="'+budget+'"></label><button class="btn primary" type="submit" style="align-self:flex-end">決定</button></form>';
  else h+='<div class="row between"><b class="num">今月の予算 ¥'+yen(budget)+'</b><button class="mini" type="button" data-act="budget-edit">変える</button></div><div class="bar"><i style="width:'+pct+'%"></i></div><div class="small num" style="font-weight:700;color:'+(left<0?'var(--warn)':'var(--ok)')+'">'+(left<0?'予算を ¥'+yen(-left)+' こえています':'あと ¥'+yen(left)+' 使えます')+'</div>';
  h+='</div>';
  if(recs.length){
    var byCat=CATS.map(function(c){return {c:c,v:recs.filter(function(r){return r.cat===c.id;}).reduce(function(a,r){return a+r.amount;},0)};}).filter(function(x){return x.v>0;});
    h+='<div class="stack"><h3>何に使った？</h3><div class="stackbar">';byCat.forEach(function(x){h+='<i style="flex:'+x.v+' 1 0;background:'+x.c.c+'"></i>';});
    h+='</div><div class="legend">';byCat.forEach(function(x){h+='<div><span class="dot" style="background:'+x.c.c+'"></span><span>'+x.c.name+'</span><b class="num">¥'+yen(x.v)+'</b></div>';});h+='</div></div>';
    var byO={};recs.forEach(function(r){var k=r.oshi||'推し全体';byO[k]=(byO[k]||0)+r.amount;});var ks=Object.keys(byO).sort(function(a,b){return byO[b]-byO[a];}),mx=byO[ks[0]];
    h+='<div class="stack"><h3>推しごと</h3>';ks.forEach(function(k){var o=S.oshis.filter(function(x){return x.name===k;})[0],c=o?o.color:'#7C8495';h+='<div class="row" style="font-size:13px"><span style="width:96px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(k)+'</span><div class="bar" style="flex:1;height:8px"><i style="width:'+Math.round(byO[k]/mx*100)+'%;background:'+c+'"></i></div><b class="num" style="width:74px;text-align:right">¥'+yen(byO[k])+'</b></div>';});h+='</div>';
    h+='<div class="stack" style="gap:0"><h3 style="margin-bottom:4px">記録</h3>';
    recs.slice().sort(function(a,b){return a.date<b.date?1:-1;}).forEach(function(r){var c=CATS.filter(function(x){return x.id===r.cat;})[0]||CATS[4];
      h+='<div class="rec"><span class="dot" style="background:'+c.c+'"></span><div class="t"><b>'+esc(r.memo||c.name)+(r.example?' <span class="tag">例</span>':'')+'</b><span class="small muted num">'+r.date.slice(5).replace('-','/')+'・'+c.name+(r.oshi?'・'+esc(r.oshi):'')+'</span></div><div class="stack" style="gap:6px;align-items:flex-end"><b class="num">¥'+yen(r.amount)+'</b><div class="row" style="gap:6px"><button class="mini" type="button" data-act="rec-dup" data-v="'+r.id+'">もう一度</button>'+(UI.del===r.id?'<button class="mini danger" type="button" data-act="rec-del" data-v="'+r.id+'">本当に消す</button>':'<button class="mini" type="button" data-act="rec-del" data-v="'+r.id+'">消す</button>')+'</div></div></div>';});
    h+='</div>';
  }else h+='<div class="card" style="text-align:center"><b>'+m.label+'の記録はまだありません</b><p class="small muted" style="margin:6px 0 0">下のボタンから、使ったお金を貯金箱に入れてみてね。</p></div>';
  h+='<button class="btn primary block" type="button" data-act="rec-open" style="min-height:54px;font-size:16px">＋ 使ったお金を貯金箱に入れる</button><p class="small muted" style="margin:0">「もう一度」を押すと、同じ内容を今日の日付でもう一度入れられます。毎月のサブスク代などに便利です。</p>';
  return h;
}
function vSettings(){
  var h='<h1>着せ替え・推し</h1><label class="field"><span>ニックネーム</span><input class="input" id="set-name" maxlength="12" value="'+esc(S.me.name)+'"></label>';
  h+=charEditor()+'<div class="stack"><h3>推し</h3>'+oshiEditor('set')+'</div>';
  h+=vTheme();
  h+=vAccount();
  h+=docLinks();
  h+='<div class="card stack"><h3>データのバックアップ</h3><p class="small muted" style="margin:0">データはこのスマホのブラウザの中に保存されます。機種変更の前や、念のための控えに、バックアップの文字をメモアプリなどに保存しておいてね。</p>';
  if(UI.backup==='out'){var txt=JSON.stringify(Object.assign({},S,{room:Object.assign({},S.room,{photo:null})}));h+='<textarea class="input" id="backup-out" readonly>'+esc(txt)+'</textarea><div class="row"><button class="btn primary" style="flex:1" type="button" data-act="backup-copy">コピーする</button><button class="btn" style="flex:1" type="button" data-act="backup-close">閉じる</button></div><p class="small muted" style="margin:0">写真フレームの写真はバックアップに含まれません。</p>';}
  else if(UI.backup==='in')h+='<textarea class="input" id="backup-in" placeholder="保存しておいたバックアップの文字を貼り付けてね">'+esc(UI.restoreText)+'</textarea><div class="row"><button class="btn primary" style="flex:1" type="button" data-act="backup-restore">読み込む</button><button class="btn" style="flex:1" type="button" data-act="backup-close">やめる</button></div>';
  else h+='<div class="row"><button class="btn" style="flex:1" type="button" data-act="backup-out">バックアップをとる</button><button class="btn" style="flex:1" type="button" data-act="backup-in">バックアップから戻す</button></div>';
  h+='</div><div class="card stack"><h3>最初からやり直す</h3>';
  h+=UI.reset?'<div class="row"><button class="btn" type="button" data-act="reset-no" style="flex:1">やめる</button><button class="btn" type="button" data-act="reset-yes" style="flex:1;border-color:var(--warn);color:var(--warn)">全部消して最初から</button></div>':'<button class="btn" type="button" data-act="reset-ask">最初からやり直す</button>';
  return h+'</div>';
}
function vAccount(){
  var h='<div class="card stack"><h3>アカウント</h3>';
  if(!cloudOn())return h+'<p class="small muted" style="margin:0">今はオンラインの機能が使えません。電波のよい場所で開き直してね。</p></div>';
  var u=cloudUser();
  if(!u)return h+'<p class="small muted" style="margin:0">ログインすると、My Roomがサーバーに保存されて、機種変更しても続きから使えます。部屋のリンクを送って、友だちに見てもらうこともできます。</p><button class="btn primary" type="button" data-act="auth-open">ログイン・新規登録</button></div>';
  var st=window.KC.status,stTxt=st==='saving'?'保存中…':st==='error'?'保存できませんでした：'+esc(window.KC.error):'サーバーに保存済み';
  h+='<p class="small" style="margin:0">ログイン中：'+esc(u.email||'')+'</p><p class="small" style="margin:0;font-weight:700;color:'+(st==='error'?'var(--warn)':'var(--ok)')+'">'+stTxt+'</p>';
  h+='<label class="field"><span>My Roomのリンク（送ると部屋を見てもらえます）</span><input class="input" id="room-link" readonly value="'+esc(roomLink())+'"></label>';
  h+='<div class="row"><button class="btn primary" style="flex:1" type="button" data-act="link-copy">リンクをコピー</button><button class="btn" style="flex:1" type="button" data-act="auth-out">ログアウト</button></div>';
  h+='<p class="small muted" style="margin:0">貯金箱のお金の記録と予定は、ログインしても本人しか見られません。</p>';
  if(UI.delAcct===0)h+='<button class="btn ghost" type="button" data-act="acct-del">アカウントを削除</button>';
  else h+='<div class="stack" style="gap:8px"><p class="small" style="margin:0;color:var(--warn);font-weight:700">アカウントと、サーバーにある部屋・投稿・写真・貯金箱・予定がすべて消えて、元に戻せません。</p><div class="row"><button class="btn" style="flex:1" type="button" data-act="acct-del-no">やめる</button><button class="btn" style="flex:1;border-color:var(--warn);color:var(--warn)" type="button" data-act="acct-del"'+(UI.delAcct===2?' disabled':'')+'>'+(UI.delAcct===2?'削除しています…':'本当に削除する')+'</button></div></div>';
  return h+'</div>';
}
function vAuthSheet(){
  var up=UI.authMode==='up';
  var h='<div class="overlay" data-act="sheet-bg"><form class="sheet" data-form="auth" role="dialog" aria-label="ログイン"><div class="row between"><h2>'+(up?'新規登録':'ログイン')+'</h2><button class="btn sm" type="button" data-act="auth-close">閉じる</button></div>';
  h+='<div class="seg"><button type="button" class="'+(!up?'on':'')+'" data-act="auth-mode" data-v="in">ログイン</button><button type="button" class="'+(up?'on':'')+'" data-act="auth-mode" data-v="up">新規登録</button></div>';
  h+='<label class="field"><span>メールアドレス</span><input class="input" id="auth-email" type="email" autocomplete="email" inputmode="email" value="'+esc(UI.authEmail)+'"></label>';
  h+='<label class="field"><span>パスワード（6文字以上）</span><input class="input" id="auth-pw" type="password" autocomplete="'+(up?'new-password':'current-password')+'" value="'+esc(UI.authPw)+'"></label>';
  if(up)h+='<label class="agree"><input type="checkbox" id="agree"'+(UI.agree?' checked':'')+'><span><button type="button" class="link" data-act="doc" data-v="terms">利用規約</button>・<button type="button" class="link" data-act="doc" data-v="privacy">プライバシーポリシー</button>・<button type="button" class="link" data-act="doc" data-v="rules">投稿ルール</button>を読んで同意します。13歳未満の方は登録できません。</span></label>';
  h+='<button class="btn primary block" type="submit"'+(UI.authBusy?' disabled':'')+'>'+(UI.authBusy?'少し待ってね…':(up?'登録してログイン':'ログイン'))+'</button>';
  if(up)h+='<p class="small muted" style="margin:0">登録すると、今この端末にあるMy Roomがサーバーに保存されます。</p>';
  return h+'</form></div>';
}
function vConflict(){
  return '<div class="overlay center"><div class="sheet" role="dialog" aria-label="どちらのMy Roomを使う？"><h2>どちらのMy Roomを使う？</h2><p class="small muted" style="margin:0">この端末と、サーバーに保存されているMy Roomがちがいます。使う方を選んでね。選ばなかった方は上書きされます。</p><button class="btn primary block" type="button" data-act="use-server">サーバーのMy Roomを使う</button><button class="btn block" type="button" data-act="use-local">この端末のMy Roomを使う</button></div></div>';
}
function vVisit(){
  if(VISIT.loading)return '<p class="muted">部屋を読み込み中…</p>';
  if(!VISIT.data)return '<div class="card stack"><h2>部屋が見つかりませんでした</h2><p class="small muted" style="margin:0">'+esc(VISIT.error||'リンクがまちがっているか、部屋がまだ保存されていないかもしれません。')+'</p><button class="btn primary" type="button" data-act="leave-visit">自分のMy Roomへ</button></div>';
  var d=VISIT.data.data||{},me=d.me||defMe(),room=d.room;me.layers=me.layers||{};me.colors=me.colors||{};
  var h='<div class="row between"><div><h1>'+esc(VISIT.data.nickname||'ゲスト')+'のMy Room</h1><p class="small muted" style="margin:0">遊びに来ています</p></div><span class="tag">キラペン</span></div>';
  h+='<div class="room-wrap">'+(room?roomSVG({room:room,me:me,export:true}):'')+'</div>';
  if(d.oshis&&d.oshis.length){h+='<div class="stack"><h3>推し</h3><div class="row wrap">';d.oshis.forEach(function(o){h+='<span class="chip"><span class="dot" style="background:'+esc(o.color)+'"></span>'+esc(o.name)+'</span>';});h+='</div></div>';}
  return h+'<button class="btn primary block" type="button" data-act="leave-visit">キラペンで自分の部屋をつくる</button>';
}
/* ---------- みんな（タイムライン） ---------- */
function vFeed(){
  if(ADMIN.open)return vAdmin();
  var h='<div class="feed-head"><div><h1>みんなの推し活</h1><p class="small muted" style="margin:0">ファンのみんなの投稿</p></div>'+(cloudOn()&&window.KC.isAdmin?'<button class="mini" type="button" data-act="admin-open">通報を確認</button>':'')+'</div>';
  if(!cloudOn())return h+'<div class="card"><b>今はオンラインの機能が使えません</b><p class="small muted" style="margin:6px 0 0">電波のよい場所で開き直してね。</p></div>';
  h+='<div class="filters"><button type="button" class="chip'+(!FEED.oshi?' on':'')+'" data-act="feed-oshi" data-v="">すべて</button>';
  S.oshis.forEach(function(o){h+='<button type="button" class="chip'+(FEED.oshi===o.name?' on':'')+'" data-act="feed-oshi" data-v="'+esc(o.name)+'"><span class="dot" style="background:'+o.color+'"></span>'+esc(o.name)+'</button>';});
  h+='</div>';
  var items=FEED.items.filter(function(p){return !FEED.blocks[p.user_id];});
  if(FEED.error&&!items.length)h+='<div class="card stack"><b>読み込めませんでした</b><p class="small muted" style="margin:0">'+esc(FEED.error)+'</p><button class="btn" type="button" data-act="feed-reload">もう一度</button></div>';
  else if(!items.length&&FEED.loading)h+='<p class="muted">読み込み中…</p>';
  else if(!items.length)h+='<div class="card" style="text-align:center"><b>'+(FEED.oshi?esc(FEED.oshi)+'の投稿はまだありません':'まだ投稿がありません')+'</b><p class="small muted" style="margin:6px 0 0">右下の「投稿する」から、最初の推し活をシェアしてみてね。</p></div>';
  items.forEach(function(p){h+=vPostCard(p);});
  if(items.length&&!FEED.done)h+='<button class="btn block" type="button" data-act="feed-more"'+(FEED.loading?' disabled':'')+'>'+(FEED.loading?'読み込み中…':'もっと見る')+'</button>';
  h+='<button class="fab" type="button" data-act="post-open"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>投稿する</button>';
  return h;
}
function vPostCard(p){
  var u=cloudUser(),mine=u&&u.id===p.user_id,admin=cloudOn()&&window.KC.isAdmin,prof=p.profiles||{},me=safeMe(prof.me),likes=(p.likes&&p.likes[0]&&p.likes[0].count)||0,on=!!FEED.liked[p.id];
  var h='<article class="post"><div class="post-top"><button class="ava" type="button" data-act="visit" data-v="'+p.user_id+'" aria-label="'+esc(prof.nickname||'')+'の部屋を見る">'+illustHTML(me)+'</button><div class="who"><b>'+esc(prof.nickname||'ゲスト')+'</b><span class="small muted">'+(p.oshi?'<span class="dot" style="background:'+esc(p.oshi_color||'#7C8495')+'"></span> '+esc(p.oshi)+'推し・':'')+ago(p.created_at)+'</span></div><span class="kind">'+kindName(p.kind)+'</span></div>';
  if(p.hidden)h+='<p class="hidden-note">この投稿は通報が多かったため、ほかの人には表示されていません。</p>';
  if(p.image_path)h+='<img class="post-img" src="'+esc(window.KC.imageUrl(p.image_path))+'" alt="'+esc(prof.nickname||'')+'の投稿の写真" loading="lazy">';
  if(p.body)h+='<div class="post-body">'+esc(p.body)+'</div>';
  h+='<div class="post-act"><button class="like'+(on?' on':'')+'" type="button" data-act="like" data-v="'+p.id+'" aria-pressed="'+on+'"><svg width="16" height="16" viewBox="0 0 24 24" fill="'+(on?'currentColor':'none')+'" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>わかる <span class="num">'+likes+'</span></button><button class="mini" type="button" data-act="visit" data-v="'+p.user_id+'">部屋を見る</button><span style="flex:1"></span><button class="mini" type="button" data-act="post-menu" data-v="'+p.id+'" aria-label="その他の操作">…</button></div>';
  if(FEED.menu===p.id){
    h+='<div class="menu-row">';
    if(mine||admin)h+=FEED.confirm==='del'+p.id?'<button class="mini danger" type="button" data-act="post-del" data-v="'+p.id+'">本当に削除する</button>':'<button class="mini" type="button" data-act="post-del" data-v="'+p.id+'">削除</button>';
    if(!mine){h+='<button class="mini" type="button" data-act="report-open" data-v="'+p.id+'">通報</button>';h+=FEED.confirm==='blk'+p.id?'<button class="mini danger" type="button" data-act="block" data-v="'+p.user_id+'">本当にブロックする</button>':'<button class="mini" type="button" data-act="block" data-v="'+p.user_id+'">この人をブロック</button>';}
    h+='</div>';
  }
  return h+'</article>';
}
function vPostSheet(){
  var h='<div class="overlay" data-act="sheet-bg"><form class="sheet" data-form="post" role="dialog" aria-label="推し活を投稿"><div class="row between"><h2>推し活を投稿</h2><button class="btn sm" type="button" data-act="post-close">閉じる</button></div>';
  h+='<div class="field"><span>なにを投稿する？</span><div class="row wrap">';KINDS.forEach(function(k){h+='<button type="button" class="chip'+(POST.kind===k[0]?' on':'')+'" data-act="post-kind" data-v="'+k[0]+'">'+k[1]+'</button>';});h+='</div></div>';
  h+='<div class="field"><span>写真（なくてもOK）</span><div class="photo-pick">'+(POST.img?'<img src="'+POST.img+'" alt="選んだ写真"><button class="mini" type="button" data-act="post-img-clear">写真を外す</button>':'<label class="btn sm" for="post-file">写真を選ぶ</label>')+'<input type="file" id="post-file" accept="image/*" hidden></div></div>';
  h+='<label class="field"><span>ひとこと</span><textarea class="input post-in" id="post-body" maxlength="300" placeholder="今日の推し活をひとこと…">'+esc(POST.body)+'</textarea><span class="counter num" id="post-count">'+POST.body.length+' / 300</span></label>';
  if(S.oshis.length){h+='<div class="field"><span>どの推し？</span><div class="row wrap"><button type="button" class="chip'+(!POST.oshi?' on':'')+'" data-act="post-oshi" data-v="">えらばない</button>';S.oshis.forEach(function(o){h+='<button type="button" class="chip'+(POST.oshi===o.name?' on':'')+'" data-act="post-oshi" data-v="'+esc(o.name)+'"><span class="dot" style="background:'+o.color+'"></span>'+esc(o.name)+'</button>';});h+='</div></div>';}
  h+='<div class="banner" style="display:block"><b>投稿できないもの</b><br>ライブ中に撮った写真・動画、アイドル本人の写真や画像（公式画像のスクリーンショットもNG）、悪口や個人情報。守られていない投稿は削除することがあります。<br><button type="button" class="link" data-act="doc" data-v="rules">投稿ルールを全部読む</button></div>';
  return h+'<button class="btn primary block" type="submit" style="min-height:54px;font-size:16px"'+(POST.busy?' disabled':'')+'>'+(POST.busy?'投稿しています…':'投稿する')+'</button></form></div>';
}
function vReportSheet(){
  var h='<div class="overlay" data-act="sheet-bg"><form class="sheet" data-form="report" role="dialog" aria-label="投稿を通報"><div class="row between"><h2>投稿を通報</h2><button class="btn sm" type="button" data-act="report-close">閉じる</button></div><p class="small muted" style="margin:0">どんな問題がありますか？通報した人の名前は相手には伝わりません。</p><div class="stack" style="gap:8px">';
  REASONS.forEach(function(r){h+='<button type="button" class="chip'+(REPORT.reason===r?' on':'')+'" style="justify-content:flex-start" data-act="report-reason" data-v="'+esc(r)+'">'+esc(r)+'</button>';});
  return h+'</div><button class="btn primary block" type="submit"'+(REPORT.busy?' disabled':'')+'>'+(REPORT.busy?'送っています…':'通報する')+'</button></form></div>';
}
function vAdmin(){
  var h='<div class="feed-head"><div><h1>通報の確認</h1><p class="small muted" style="margin:0">運営だけに見える画面です</p></div><button class="mini" type="button" data-act="admin-close">戻る</button></div>';
  if(ADMIN.loading)return h+'<p class="muted">読み込み中…</p>';
  if(ADMIN.error)return h+'<div class="card"><b>読み込めませんでした</b><p class="small muted">'+esc(ADMIN.error)+'</p></div>';
  var by={},order=[];ADMIN.rows.forEach(function(r){if(!r.posts)return;if(!by[r.post_id]){by[r.post_id]={post:r.posts,reasons:[]};order.push(r.post_id);}by[r.post_id].reasons.push(r.reason);});
  if(!order.length)return h+'<div class="card" style="text-align:center"><b>通報された投稿はありません</b></div>';
  order.forEach(function(id){var g=by[id],p=g.post,cnt={};g.reasons.forEach(function(x){cnt[x]=(cnt[x]||0)+1;});
    h+='<article class="post"><div class="post-top"><div class="who"><b>'+esc((p.profiles&&p.profiles.nickname)||'ゲスト')+'</b><span class="small muted">'+ago(p.created_at)+'・通報 '+g.reasons.length+'件'+(p.hidden?'・非表示中':'')+'</span></div><span class="kind">'+kindName(p.kind)+'</span></div>';
    if(p.image_path)h+='<img class="post-img" src="'+esc(window.KC.imageUrl(p.image_path))+'" alt="通報された投稿の写真" loading="lazy">';
    if(p.body)h+='<div class="post-body">'+esc(p.body)+'</div>';
    h+='<div class="menu-row" style="padding-top:8px">';Object.keys(cnt).forEach(function(k){h+='<span class="kind">'+esc(k)+' ×'+cnt[k]+'</span>';});h+='</div>';
    h+='<div class="post-act"><button class="mini danger" type="button" data-act="admin-del" data-v="'+id+'">削除する</button><button class="mini" type="button" data-act="admin-keep" data-v="'+id+'">問題なし（表示に戻す）</button></div></article>';});
  return h;
}
function loadFeed(reset){
  if(!cloudOn()||FEED.loading)return;
  FEED.loading=true;FEED.error='';if(reset){FEED.items=[];FEED.done=false;}render();
  var last=FEED.items.length?FEED.items[FEED.items.length-1].created_at:null;
  var pBlocks=cloudUser()&&!FEED.loaded?window.KC.myBlocks().then(function(ids){FEED.blocks={};ids.forEach(function(i){FEED.blocks[i]=1;});},function(){}):Promise.resolve();
  pBlocks.then(function(){return window.KC.fetchPosts({oshi:FEED.oshi,before:reset?null:last,limit:20});}).then(function(rows){
    FEED.items=FEED.items.concat(rows);FEED.done=rows.length<20;FEED.loaded=true;
    return window.KC.myLikes(rows.map(function(r){return r.id;})).then(function(ids){ids.forEach(function(i){FEED.liked[i]=1;});},function(){});
  }).then(function(){FEED.loading=false;render();},function(e){FEED.loading=false;FEED.error=window.KC.message(e);render();});
}
function loadAdmin(){ADMIN.loading=true;ADMIN.error='';render();window.KC.adminReports().then(function(rows){ADMIN.rows=rows;ADMIN.loading=false;render();},function(e){ADMIN.loading=false;ADMIN.error=window.KC.message(e);render();});}
function needLogin(msg){if(!cloudOn()){toast('今はオンラインの機能が使えません');return true;}if(!cloudUser()){toast(msg||'ログインしてね');UI.sheet='auth';UI.authMode='up';render();return true;}return false;}
function findPost(id){id=Number(id);for(var i=0;i<FEED.items.length;i++)if(FEED.items[i].id===id)return FEED.items[i];return null;}
function openVisit(uid){
  if(cloudUser()&&cloudUser().id===uid){UI.tab='room';VISIT=null;render();window.scrollTo(0,0);return;}
  VISIT={loading:true,from:UI.tab};try{history.pushState(null,'',location.pathname+'?room='+uid);}catch(e){}render();window.scrollTo(0,0);
  window.KC.fetchRoom(uid).then(function(d){if(VISIT){VISIT={loading:false,data:d,from:VISIT.from};render();}},function(e){if(VISIT){VISIT={loading:false,error:window.KC.message(e)};render();}});
}
function resizeToBlob(file,cb){
  var fr=new FileReader();fr.onload=function(){loadImg(fr.result,function(img){if(!img)return cb(null);
    var max=1080,sc=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);var url=c.toDataURL('image/jpeg',.82);
    if(c.toBlob)c.toBlob(function(b){cb(b,url);},'image/jpeg',.82);else cb(null,url);
  });};fr.readAsDataURL(file);
}
function vRecSheet(){
  var h='<div class="overlay" data-act="sheet-bg"><form class="sheet" data-form="rec" role="dialog" aria-label="使ったお金を記録"><div class="row between"><h2>使ったお金を記録</h2><button class="btn sm" type="button" data-act="rec-close">閉じる</button></div>';
  h+='<label class="field"><span>金額（円）</span><input class="input num" id="rec-amount" inputmode="numeric" placeholder="3500" value="'+esc(UI.recAmount)+'" style="font-size:22px;font-weight:700"></label>';
  h+='<div class="field"><span>なにに？</span><div class="row wrap">';CATS.forEach(function(c){h+='<button type="button" class="chip'+(UI.recCat===c.id?' on':'')+'" data-act="rec-cat" data-v="'+c.id+'"><span class="dot" style="background:'+c.c+'"></span>'+c.name+'</button>';});h+='</div></div>';
  h+='<div class="field"><span>どの推しに？</span><div class="row wrap"><button type="button" class="chip'+(UI.recOshi===''?' on':'')+'" data-act="rec-oshi" data-v="">推し全体</button>';S.oshis.forEach(function(o){h+='<button type="button" class="chip'+(UI.recOshi===o.name?' on':'')+'" data-act="rec-oshi" data-v="'+esc(o.name)+'"><span class="dot" style="background:'+o.color+'"></span>'+esc(o.name)+'</button>';});h+='</div></div>';
  h+='<label class="field"><span>日付</span><input class="input" type="date" id="rec-date" value="'+esc(UI.recDate)+'"></label><label class="field"><span>メモ（なくてもOK）</span><input class="input" id="rec-memo" maxlength="30" placeholder="例：ツアーのアクスタ" value="'+esc(UI.recMemo)+'"></label>';
  return h+'<button class="btn primary block" type="submit" style="min-height:54px;font-size:16px">貯金箱に入れる</button></form></div>';
}
function vShare(){return '<div class="overlay center" data-act="share-bg"><div class="sheet" role="dialog" aria-label="シェア画像"><div class="row between"><h2>シェア画像</h2><button class="btn sm" type="button" data-act="share-close">閉じる</button></div>'+(UI.shareURL?'<img class="share-img" src="'+UI.shareURL+'" alt="My Roomのシェア画像"><p class="small muted" style="margin:0">画像を長押し（パソコンでは右クリック）して保存し、TikTokやXでシェアしてね。</p>':'<p class="muted">画像をつくっています…</p>')+'</div></div>';}

/* ================= Theme（アプリの色） ================= */
var THEMES=[['#F7A8C6','ピンク'],['#C9B6F2','ラベンダー'],['#A8D8F0','みずいろ'],['#A6E3C8','ミント'],['#F6DE8D','レモン'],['#F9C0A0','ピーチ'],['#B9C2E8','ブルーグレー']];
var DEF_THEME='#F7A8C6';
function hsl2hex(h,s,l){s/=100;l/=100;var k=function(n){return (n+h/30)%12;},a=s*Math.min(l,1-l),f=function(n){return l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));};return rgb2hex([f(0)*255,f(8)*255,f(4)*255]);}
function hex2hsl(hex){var c=hex2rgb(hex).map(function(v){return v/255;}),mx=Math.max.apply(0,c),mn=Math.min.apply(0,c),l=(mx+mn)/2,h=0,s=0,d=mx-mn;
  if(d){s=d/(1-Math.abs(2*l-1));if(mx===c[0])h=((c[1]-c[2])/d)%6;else if(mx===c[1])h=(c[2]-c[0])/d+2;else h=(c[0]-c[1])/d+4;h*=60;if(h<0)h+=360;}return [h,s*100,l*100];}
function lum(hex){return hex2rgb(hex).map(function(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}).reduce(function(a,v,i){return a+v*[.2126,.7152,.0722][i];},0);}
function contrast(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function themeVars(hex){
  var t=hex2hsl(/^#[0-9a-f]{6}$/i.test(hex||'')?hex:DEF_THEME),h=t[0],s=Math.max(8,Math.min(t[1],78)),gs=Math.min(s,60);
  var acc,L;for(L=58;L>18;L-=1){acc=hsl2hex(h,Math.max(s,30),L);if(contrast(acc,'#FFFFFF')>=4.6)break;}
  var dacc;for(L=68;L<92;L+=1){dacc=hsl2hex(h,Math.max(s,45),L);if(contrast(dacc,hsl2hex(h,30,10))>=6)break;}
  return {light:{'--bg':hsl2hex(h,gs,97),'--surface':'#FFFFFF','--sunk':hsl2hex(h,gs*.7,93),'--line':hsl2hex(h,gs*.55,88),'--fg':hsl2hex(h,32,17),'--muted':hsl2hex(h,10,40),'--accent':acc,'--on-accent':'#FFFFFF','--soft':hsl2hex(h,Math.max(s,40),92),'--soft-ink':hsl2hex(h,Math.max(s,40),30),'--shadow':'rgba(60,40,60,.10)'},
    dark:{'--bg':hsl2hex(h,22,10),'--surface':hsl2hex(h,20,14),'--sunk':hsl2hex(h,18,19),'--line':hsl2hex(h,16,26),'--fg':hsl2hex(h,30,95),'--muted':hsl2hex(h,12,70),'--accent':dacc,'--on-accent':hsl2hex(h,30,10),'--soft':hsl2hex(h,28,22),'--soft-ink':hsl2hex(h,70,82),'--shadow':'rgba(0,0,0,.35)'},
    bar:hsl2hex(h,gs,92)};
}
var THEME_NOW=null;
function applyTheme(hex){
  hex=hex||DEF_THEME;if(THEME_NOW===hex)return;THEME_NOW=hex;var v=themeVars(hex);
  var css=function(o){return Object.keys(o).map(function(k){return k+':'+o[k];}).join(';');};
  var st=document.getElementById('theme-css');if(!st){st=document.createElement('style');st.id='theme-css';document.head.appendChild(st);}
  st.textContent=':root{'+css(v.light)+'}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){'+css(v.dark)+';color-scheme:dark}}:root[data-theme="dark"]{'+css(v.dark)+';color-scheme:dark}';
  var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',v.bar);
}
function vTheme(){
  var cur=S.room.theme||DEF_THEME;
  var sw=function(c,name){return '<button type="button" class="theme-sw'+(cur.toLowerCase()===c.toLowerCase()?' on':'')+'" data-act="theme" data-v="'+c+'" aria-label="'+esc(name)+'" aria-pressed="'+(cur.toLowerCase()===c.toLowerCase())+'"><span style="background:'+c+'"></span><b>'+esc(name)+'</b></button>';};
  var h='<div class="card stack"><h3>アプリの色</h3><p class="small muted" style="margin:0">ボタンや背景の色が変わります。</p>';
  if(S.oshis.length){h+='<span class="lbl">推しの色</span><div class="theme-grid">';S.oshis.forEach(function(o){h+=sw(o.color,o.name);});h+='</div>';}
  h+='<span class="lbl">パステル</span><div class="theme-grid">';THEMES.forEach(function(t){h+=sw(t[0],t[1]);});
  return h+'</div></div>';
}

/* ================= 予定（カレンダー） ================= */
var EKINDS=[['live','ライブ'],['release','発売・配信'],['bday','誕生日・記念日'],['event','イベント'],['other','その他']];
function ekName(k){for(var i=0;i<EKINDS.length;i++)if(EKINDS[i][0]===k)return EKINDS[i][1];return '';}
function oshiColor(n){var o=S.oshis.filter(function(x){return x.name===n;})[0];return o?o.color:'var(--accent)';}
function dstr(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function dparse(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
function evDates(e){return e.kind!=='bday'&&e.dates&&e.dates.length?e.dates:[e.date];}
function dayNo(e,day){var ds=evDates(e);return ds.length>1&&ds.indexOf(day)>=0?(ds.indexOf(day)+1)+'日目':'';}
function eventsOn(day){return S.events.filter(function(e){return (e.kind!=='bday'&&evDates(e).indexOf(day)>=0)||(e.kind==='bday'&&e.date.slice(5)===day.slice(5)&&e.date<=day);}).sort(function(a,b){return (a.time||'99').localeCompare(b.time||'99');});}
function nextDate(e,today){if(e.kind!=='bday'){var ds=evDates(e).filter(function(x){return x>=today;});return ds[0]||null;}var y=+today.slice(0,4),d=y+e.date.slice(4);if(d<today)d=(y+1)+e.date.slice(4);return d<e.date?e.date:d;}
function upcoming(n){var t=todayStr();return S.events.map(function(e){return {e:e,d:nextDate(e,t)};}).filter(function(x){return x.d;}).sort(function(a,b){return a.d===b.d?(a.e.time||'99').localeCompare(b.e.time||'99'):a.d<b.d?-1:1;}).slice(0,n);}
function daysTo(d){return Math.round((dparse(d)-dparse(todayStr()))/864e5);}
function untilTxt(d){var n=daysTo(d);return n===0?'今日！':n===1?'明日':'あと'+n+'日';}
function mdTxt(d){var x=dparse(d);return (x.getMonth()+1)+'/'+x.getDate()+'（'+'日月火水木金土'[x.getDay()]+'）';}
function evRow(e,d,day){
  var n=evDates(e).length,no=dayNo(e,d||day);
  return '<button type="button" class="ev" data-act="ev-edit" data-v="'+e.id+'"><span class="ev-bar" style="background:'+(e.oshi?oshiColor(e.oshi):'var(--accent)')+'"></span><span class="ev-main"><b>'+esc(e.title)+(no?' <span class="kind">'+no+(n>1?'／全'+n+'日':'')+'</span>':'')+'</b><span class="small muted">'+[d?mdTxt(d):'',e.time?esc(e.time):'',e.oshi?esc(e.oshi):''].filter(Boolean).join('・')+(e.memo&&!d?'<br>'+esc(e.memo):'')+'</span></span>'+(d?'<span class="ev-cd'+(daysTo(d)<=1?' hot':'')+'">'+untilTxt(d)+'</span>':'<span class="kind">'+ekName(e.kind)+'</span>')+'</button>';
}
function nextBanner(){
  var u=upcoming(1)[0];if(!u)return '';
  return '<button type="button" class="next-ev" data-act="tab" data-v="cal"><span class="small">次の予定</span><b>'+esc(u.e.title)+'</b><span class="next-cd">'+untilTxt(u.d)+'</span></button>';
}
function vCal(){
  var base=new Date();base.setDate(1);base.setMonth(base.getMonth()+UI.calMonth);
  var y=base.getFullYear(),m=base.getMonth(),today=todayStr(),sel=UI.calDay||today;
  var h='<div><h1>予定</h1><p class="small muted" style="margin:0">ライブや発売日、推しの誕生日をまとめよう</p></div>';
  h+=nextBanner();
  h+='<div class="card cal"><div class="row between"><button class="mini" type="button" data-act="cal-month" data-v="-1" aria-label="前の月">‹</button><h3>'+y+'年'+(m+1)+'月</h3><button class="mini" type="button" data-act="cal-month" data-v="1" aria-label="次の月">›</button></div><div class="cal-grid">';
  '日月火水木金土'.split('').forEach(function(w,i){h+='<span class="cal-w'+(i===0?' sun':i===6?' sat':'')+'">'+w+'</span>';});
  var first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  for(var i=0;i<first;i++)h+='<span></span>';
  for(var d=1;d<=days;d++){var ds=y+'-'+pad(m+1)+'-'+pad(d),evs=eventsOn(ds);
    h+='<button type="button" class="cal-d'+(ds===today?' today':'')+(ds===sel?' sel':'')+'" data-act="cal-day" data-v="'+ds+'" aria-label="'+(m+1)+'月'+d+'日'+(evs.length?' 予定'+evs.length+'件':'')+'"><span>'+d+'</span><i>'+evs.slice(0,3).map(function(e){return '<em style="background:'+(e.oshi?oshiColor(e.oshi):'var(--accent)')+'"></em>';}).join('')+'</i></button>';}
  h+='</div></div>';
  var list=eventsOn(sel);
  h+='<p class="small muted" style="margin:-8px 0 0;text-align:center">日付をタップすると、その日に予定を追加できます</p>';
  h+='<div class="stack" id="day-list" style="scroll-margin-top:16px"><div class="row between"><h3>'+mdTxt(sel)+'</h3><button class="btn primary sm" type="button" data-act="ev-new" data-v="'+sel+'">＋ この日に追加</button></div>';
  h+=list.length?list.map(function(e){return evRow(e,null,sel);}).join(''):'<p class="small muted" style="margin:0">この日の予定はありません。</p>';
  h+='</div>';
  var up=upcoming(8);
  h+='<div class="stack"><h3>これからの予定</h3>'+(up.length?up.map(function(x){return evRow(x.e,x.d);}).join(''):'<div class="card" style="text-align:center"><b>まだ予定がありません</b><p class="small muted" style="margin:6px 0 0">右下の「予定を追加」から、ライブや発売日を入れてみてね。</p></div>')+'</div>';
  h+='<button class="fab" type="button" data-act="ev-new"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>予定を追加</button>';
  return h;
}
function vEventSheet(){
  var e=UI.ev,isNew=!e.id;
  var h='<div class="overlay" data-act="sheet-bg"><form class="sheet" data-form="ev" role="dialog" aria-label="予定"><div class="row between"><h2>'+(isNew?'予定を追加':'予定を編集')+'</h2><button class="btn sm" type="button" data-act="ev-close">閉じる</button></div>';
  h+='<label class="field"><span>なにがある？</span><input class="input" id="ev-title" maxlength="40" placeholder="例：ツアー東京公演" value="'+esc(e.title)+'"></label>';
  h+='<div class="field"><span>種類</span><div class="row wrap">';EKINDS.forEach(function(k){h+='<button type="button" class="chip'+(e.kind===k[0]?' on':'')+'" data-act="ev-kind" data-v="'+k[0]+'">'+k[1]+'</button>';});h+='</div></div>';
  var multi=e.kind!=='bday',ds=e.dates;
  h+='<div class="row"><label class="field" style="flex:1.4"><span>'+(multi&&ds.length>1?'1日目':'日付')+'</span><input class="input" type="date" id="ev-date" value="'+esc(ds[0])+'"></label><label class="field" style="flex:1"><span>時間（なくてもOK）</span><input class="input" type="time" id="ev-time" value="'+esc(e.time)+'"></label></div>';
  if(multi){for(var di=1;di<ds.length;di++)h+='<div class="row"><label class="field" style="flex:1"><span>'+(di+1)+'日目</span><input class="input" type="date" id="ev-dx-'+di+'" value="'+esc(ds[di])+'"></label><button class="mini" type="button" style="align-self:flex-end;min-height:50px" data-act="ev-dx-del" data-v="'+di+'" aria-label="'+(di+1)+'日目を消す">✕</button></div>';
    h+='<button class="btn sm" type="button" data-act="ev-dx-add" style="align-self:flex-start">＋ 日付を追加（何日かあるとき）</button>';}
  if(e.kind==='bday')h+='<p class="small muted" style="margin:0">誕生日・記念日は、毎年同じ日に表示されます。</p>';
  if(S.oshis.length){h+='<div class="field"><span>どの推し？</span><div class="row wrap"><button type="button" class="chip'+(!e.oshi?' on':'')+'" data-act="ev-oshi" data-v="">えらばない</button>';S.oshis.forEach(function(o){h+='<button type="button" class="chip'+(e.oshi===o.name?' on':'')+'" data-act="ev-oshi" data-v="'+esc(o.name)+'"><span class="dot" style="background:'+o.color+'"></span>'+esc(o.name)+'</button>';});h+='</div></div>';}
  h+='<label class="field"><span>メモ（なくてもOK）</span><input class="input" id="ev-memo" maxlength="80" placeholder="例：開場17時、グッズ列は15時から" value="'+esc(e.memo)+'"></label>';
  h+='<button class="btn primary block" type="submit" style="min-height:54px;font-size:16px">'+(isNew?'追加する':'保存する')+'</button>';
  if(!isNew)h+=UI.evDel?'<button class="btn block" type="button" data-act="ev-del" style="border-color:var(--warn);color:var(--warn)">本当に消す</button>':'<button class="btn ghost block" type="button" data-act="ev-del">この予定を消す</button>';
  return h+'</form></div>';
}

/* ================= 投稿ルール・利用規約・プライバシーポリシー ================= */
var CONTACT='lalune.yoi.oo@gmail.com';/* お問い合わせ先（メールアドレスなど）。決まったらここに書く */
var DOC_DATE='2026年10月14日';
var DOCS={
 rules:{title:'投稿ルール',lead:'キラペンは、推しが好きな人どうしが気持ちよく推し活をシェアするための場所です。投稿する前に、ここだけは読んでね。',sec:[
  {h:'投稿していいもの（例）',li:['自分で撮ったグッズ・アクスタ・推し色コーデの写真','推し部屋や祭壇など、自分の部屋の写真（住所がわかるものが写らないように）','撮影OKの場所で撮った、会場の外の看板やフラワースタンド','ライブの感想、推しへの気持ち、推し活の記録']},
  {h:'投稿してはいけないもの',li:['ライブ・イベント中に撮った写真や動画（撮影OKと案内された場合をのぞく）','アイドル本人の写真、公式の画像や動画、テレビ・配信・雑誌のスクリーンショット','ほかの人が撮った写真やイラストを、許可なく使ったもの','アイドルの私生活の情報（自宅、移動先、プライベートでの目撃情報など）、出待ち・入り待ちをすすめる内容','チケットやグッズの売り買い・譲り合いの呼びかけ（定価以上の転売は法律で禁止されています）','悪口、からかい、いやがらせ、ほかのファンやグループへの攻撃','名前・住所・学校・電話番号・顔など、自分やほかの人の個人情報','性的なもの、暴力的なもの、こわがらせるもの','宣伝やスパム、ほかのサービスへのしつこい勧誘']},
  {h:'守られていない投稿を見つけたら',p:['投稿の「…」から「通報」してください。だれが通報したかは相手に伝わりません。','3人から通報された投稿は自動で見えなくなり、運営が確認して削除するかどうかを決めます。','いやな気持ちになる人がいたら、「この人をブロック」でその人の投稿が見えなくなります。']},
  {h:'ルールを守らなかったとき',p:['投稿を削除したり、くり返す場合はアカウントを使えなくしたりすることがあります。']}
 ]},
 terms:{title:'利用規約',lead:'この利用規約は、キラペン（以下「本アプリ」）を使うときのルールです。本アプリを使った時点で、この規約に同意したものとします。',sec:[
  {h:'第1条　本アプリについて',p:['本アプリは、個人が運営している推し活アプリです。アイドル本人や所属事務所、レコード会社などの公式アプリではなく、それらとは関係ありません。']},
  {h:'第2条　使える人',p:['13歳未満の方は、アカウントを作ったり投稿したりできません。','18歳未満の方は、保護者の方の同意を得てから使ってください。']},
  {h:'第3条　アカウント',li:['登録するメールアドレスは、自分のものを使ってください。','パスワードは自分で管理し、ほかの人に教えないでください。','1人で複数のアカウントを作って、ほかの人をまどわせることはしないでください。']},
  {h:'第4条　禁止していること',li:['「投稿ルール」で禁止しているものを投稿すること','法律や公の秩序に反すること','ほかの人の著作権・肖像権・プライバシーなどの権利を侵害すること','本アプリやサーバーに負担をかけたり、こわしたりすること','ほかの人になりすますこと','本アプリを使って商売・勧誘をすること','そのほか、運営が適切でないと判断すること']},
  {h:'第5条　投稿の扱い',li:['投稿した写真や文章の権利は、投稿した人のものです。','運営は、本アプリの中で表示するために必要な範囲で、投稿を使わせてもらいます（サイズの変更など）。','自分の投稿は、いつでも自分で削除できます。','禁止していることにあたる投稿は、予告なく削除することがあります。']},
  {h:'第6条　利用の停止',p:['この規約や投稿ルールを守らない場合、運営は予告なく投稿を削除したり、アカウントを使えなくしたりすることがあります。']},
  {h:'第7条　アプリの変更・終了',p:['運営は、本アプリの内容を変えたり、提供をお休み・終了したりすることがあります。終了するときは、できるだけ前もってアプリの中でお知らせします。','大切なデータは、「データのバックアップ」で控えをとっておいてください。']},
  {h:'第8条　責任について',p:['運営は、本アプリができるだけ正しく動くよう努めますが、不具合が起きないことや、データが消えないことまでは約束できません。','利用者どうしのトラブルは、当事者どうしで解決してください。ただし運営に故意または重い過失がある場合はこの限りではありません。']},
  {h:'第9条　規約の変更',p:['この規約は、必要に応じて変えることがあります。大事な変更はアプリの中でお知らせします。変更後に本アプリを使った場合は、変更に同意したものとします。']},
  {h:'第10条　準拠法',p:['この規約は日本の法律にもとづいて解釈されます。']}
 ]},
 privacy:{title:'プライバシーポリシー',lead:'キラペン（以下「本アプリ」）が、どんな情報をあずかり、どう使うかの説明です。',sec:[
  {h:'1. あずかる情報',li:['ログインに使うメールアドレス（パスワードは暗号化されて保存され、運営も見ることはできません）','ニックネーム、キャラクター、My Room の飾り、推しの名前と色、アプリの色','投稿した写真と文章、「わかる」、ブロック、通報の記録','貯金箱の記録と予定（本人しか見られません）']},
  {h:'2. ほかの人に見えるもの',p:['ニックネーム、キャラクター、My Room、推し、投稿は、本アプリを使うほかの人や、部屋のリンクを開いた人に見えます。','メールアドレス、貯金箱の記録、予定、ブロック、通報は、ほかの人には見えません。']},
  {h:'3. 使う目的',li:['ログインや、データの保存・引き継ぎのため','My Room や投稿を表示するため','通報された投稿を確認するなど、安心して使える場所にするため','不具合を直したり、アプリをよくしたりするため']},
  {h:'4. 広告と解析',p:['本アプリには広告はありません。利用状況を調べる解析ツールも使っていません。']},
  {h:'5. 情報をあずける先',p:['本アプリは、次のサービスを使って動いています。これらのサービスは外国（アメリカなど）にサーバーがある場合があります。'],li:['Supabase：アカウントとデータ・写真の保存','GitHub Pages：アプリの配信','Google Fonts・jsDelivr：文字のデザインやプログラムの読み込み（このときIPアドレスなどの接続情報が送られます）']},
  {h:'6. ほかの人に渡すこと',p:['法律で必要な場合などをのぞき、本人の同意なく、あずかった情報をほかの人や会社に渡したり売ったりしません。']},
  {h:'7. この端末に保存されるもの',p:['キャラクターや部屋、貯金箱、予定などは、使っているスマホのブラウザの中にも保存されます。ブラウザのデータを消すと、この端末からは消えます（ログインしていればサーバーから戻せます）。']},
  {h:'8. 削除',p:['投稿はいつでも自分で削除できます。','「着せ替え・推し」タブの「アカウントを削除」から、アカウントと、サーバーにあるデータ・投稿・写真をすべて削除できます。']},
  {h:'9. 変更',p:['このポリシーを変えるときは、アプリの中でお知らせします。']}
 ]}
};
function vDoc(){
  var d=DOCS[UI.doc];if(!d)return '';
  var h='<div class="row between"><h1>'+d.title+'</h1><button class="mini" type="button" data-act="doc-close">戻る</button></div><p style="margin:0">'+d.lead+'</p>';
  d.sec.forEach(function(s){h+='<section class="doc-sec"><h3>'+s.h+'</h3>'+(s.p||[]).map(function(x){return '<p>'+x+'</p>';}).join('')+(s.li?'<ul>'+s.li.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':'')+'</section>';});
  h+='<section class="doc-sec"><h3>お問い合わせ</h3><p>'+(CONTACT?esc(CONTACT):'お問い合わせ先は準備中です。')+'</p></section>';
  h+='<p class="small muted" style="margin:0">'+DOC_DATE+' 制定</p>';
  var other=Object.keys(DOCS).filter(function(k){return k!==UI.doc;});
  return h+'<div class="row wrap">'+other.map(function(k){return '<button class="mini" type="button" data-act="doc" data-v="'+k+'">'+DOCS[k].title+'</button>';}).join('')+'</div>';
}
function docLinks(){return '<div class="card stack"><h3>ルールと規約</h3><div class="row wrap">'+Object.keys(DOCS).map(function(k){return '<button class="mini" type="button" data-act="doc" data-v="'+k+'">'+DOCS[k].title+'</button>';}).join('')+'</div></div>';}

/* ================= Render ================= */
function render(){
  counter=0;if(!PARTS)return;
  var app=document.getElementById('app'),nav=document.getElementById('nav'),layer=document.getElementById('layer');
  applyTheme(VISIT&&VISIT.data&&VISIT.data.data&&VISIT.data.data.room?VISIT.data.data.room.theme:S.room.theme);
  if(UI.doc){app.innerHTML=vDoc();nav.hidden=true;layer.innerHTML='';return;}
  if(VISIT){app.innerHTML=vVisit();nav.hidden=true;layer.innerHTML='';return;}
  if(!S.onboarded){app.innerHTML=vOnboard();nav.hidden=true;}
  else{nav.hidden=false;['room','feed','cal','money','settings'].forEach(function(t){document.getElementById('nav-'+t).classList.toggle('on',UI.tab===t);});app.innerHTML=UI.tab==='room'?vRoom():UI.tab==='feed'?vFeed():UI.tab==='cal'?vCal():UI.tab==='money'?vMoney():vSettings();}
  layer.innerHTML=UI.conflict?vConflict():UI.sheet==='rec'?vRecSheet():UI.sheet==='share'?vShare():UI.sheet==='auth'?vAuthSheet():UI.sheet==='post'?vPostSheet():UI.sheet==='report'?vReportSheet():UI.sheet==='ev'?vEventSheet():'';
  bindRoom();
}

/* ================= Drag ================= */
var drag=null;
function svgPt(svg,e){var p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
function posOf(id){return id==='char'?S.room.char:S.room.items[id];}
function sizeOf(id){return id==='char'?{w:CHAR_W,h:CHAR_H}:{w:ITEMS[id].w,h:ITEMS[id].h};}
function bindRoom(){
  var svg=document.getElementById('room');if(!svg)return;
  svg.addEventListener('pointerdown',function(e){
    var g=e.target.closest('[data-id]');
    if(!UI.deco){if(g&&g.getAttribute('data-id')==='piggy'){UI.tab='money';render();window.scrollTo(0,0);}return;}
    if(!g){if(UI.sel){UI.sel=null;render();}return;}
    var id=g.getAttribute('data-id'),p=svgPt(svg,e),pos=posOf(id);
    if(UI.sel!==id){UI.sel=id;render();svg=document.getElementById('room');g=svg.querySelector('[data-id="'+id+'"]');}
    drag={id:id,dx:p.x-pos.x,dy:p.y-pos.y,svg:svg,g:g,moved:false};
    try{svg.setPointerCapture(e.pointerId);}catch(err){}
    e.preventDefault();
  });
  svg.addEventListener('pointermove',function(e){
    if(!drag)return;var p=svgPt(drag.svg,e),sz=sizeOf(drag.id),pos=posOf(drag.id);
    pos.x=Math.round(Math.max(-sz.w/2,Math.min(360-sz.w/2,p.x-drag.dx)));
    pos.y=Math.round(Math.max(-10,Math.min(380-sz.h/2,p.y-drag.dy)));
    drag.g.setAttribute('transform','translate('+pos.x+' '+pos.y+')');drag.moved=true;
  });
  function end(){if(drag){if(drag.moved)save();drag=null;}}
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
}

/* ================= Actions ================= */
function addOshi(){
  var n=(UI.oshiDraft||'').trim();if(!n){toast('推しの名前を入れてね');return;}
  if(S.oshis.some(function(o){return o.name===n;})){toast('もう登録されています');return;}
  S.oshis.push({id:uid(),name:n,color:UI.oshiColor});UI.oshiDraft='';save();render();
}
function seedExamples(){
  var m=monthKey(0).key,o=S.oshis[0]?S.oshis[0].name:'';
  S.money.records=[{id:uid(),date:m+'-02',amount:9800,cat:'ticket',oshi:o,memo:'ツアーのチケット',example:true},{id:uid(),date:m+'-04',amount:2000,cat:'trip',oshi:o,memo:'会場までの電車代',example:true},{id:uid(),date:m+'-04',amount:3500,cat:'goods',oshi:o,memo:'アクスタ',example:true}];
}
function act(a,d){
  var v=d.v;
  switch(a){
    case 'layer':if(!v&&SLOT[d.k]&&!SLOT[d.k].optional)return;S.me.layers[d.k]=v||null;save();render();break;
    case 'lcolor':S.me.colors[d.k]=v;save();render();break;
    case 'onb-next':if(UI.step===1&&!S.me.name.trim()){toast('ニックネームを入れてね');return;}UI.step=Math.min(3,UI.step+1);if(UI.step===3&&S.oshis[0]){var oc=S.oshis[0].color;['garland','penlight','frame','rug','nui','uchiwa'].forEach(function(id){S.room.items[id].color=oc;});S.room.items.bed.color=tint(oc,.5);S.room.items.window.color=tint(oc,.55);}render();window.scrollTo(0,0);break;
    case 'onb-back':UI.step=Math.max(0,UI.step-1);render();window.scrollTo(0,0);break;
    case 'onb-start':UI.step=1;render();window.scrollTo(0,0);break;
    case 'finish':S.onboarded=true;seedExamples();save();UI.tab='room';render();window.scrollTo(0,0);break;
    case 'oshi-color':UI.oshiColor=v;render();break;
    case 'oshi-add':addOshi();break;
    case 'oshi-del':S.oshis=S.oshis.filter(function(o){return o.id!==v;});save();render();break;
    case 'tab':UI.tab=v;UI.deco=false;UI.sel=null;UI.del=null;UI.reset=false;UI.backup=null;FEED.menu=null;FEED.confirm=null;render();window.scrollTo(0,0);if(v==='feed'){if(!FEED.loaded)loadFeed(true);if(cloudUser()&&!window.KC.isAdmin)window.KC.checkAdmin();}break;
    case 'doc':UI.docBack={sheet:UI.sheet,y:window.scrollY};UI.sheet=null;UI.doc=v;render();window.scrollTo(0,0);break;
    case 'doc-close':var bk=UI.docBack||{};UI.doc=null;UI.sheet=bk.sheet||null;render();window.scrollTo(0,bk.y||0);break;
    case 'acct-del-no':UI.delAcct=0;render();break;
    case 'acct-del':if(UI.delAcct===0){UI.delAcct=1;render();return;}if(UI.delAcct===2)return;UI.delAcct=2;render();
      window.KC.deleteAccount().then(function(){UI.delAcct=0;try{localStorage.removeItem('kirapen-v1');}catch(e){}S=newState();saveLocal();UI.step=0;UI.tab='room';render();window.scrollTo(0,0);toast('アカウントを削除しました');},function(e){UI.delAcct=1;render();toast(window.KC.message(e));});break;
    case 'theme':S.room.theme=v;save();render();break;
    case 'cal-month':UI.calMonth+=Number(v);render();break;
    case 'cal-day':var had=UI.calDay===v,evs0=eventsOn(v);UI.calDay=v;
      if(had||!evs0.length){act('ev-new',{v:v});break;}
      render();var dl=document.getElementById('day-list');if(dl)dl.scrollIntoView({behavior:'smooth',block:'start'});break;
    case 'ev-new':UI.ev={id:null,title:'',kind:'live',dates:[v||UI.calDay||todayStr()],time:'',oshi:S.oshis[0]?S.oshis[0].name:'',memo:''};UI.evDel=false;UI.sheet='ev';render();setTimeout(function(){var x=document.getElementById('ev-title');if(x)x.focus();},50);break;
    case 'ev-edit':var ee=S.events.filter(function(x){return x.id===v;})[0];if(!ee)return;UI.ev=JSON.parse(JSON.stringify(ee));UI.ev.dates=evDates(ee).slice();UI.ev.time=UI.ev.time||'';UI.ev.memo=UI.ev.memo||'';UI.ev.oshi=UI.ev.oshi||'';UI.evDel=false;UI.sheet='ev';render();break;
    case 'ev-dx-add':var dl0=UI.ev.dates[UI.ev.dates.length-1]||todayStr(),nx=dparse(dl0);nx.setDate(nx.getDate()+1);UI.ev.dates.push(dstr(nx));render();break;
    case 'ev-dx-del':UI.ev.dates.splice(Number(v),1);render();break;
    case 'ev-close':UI.sheet=null;render();break;
    case 'ev-kind':UI.ev.kind=v;render();break;
    case 'ev-oshi':UI.ev.oshi=v||'';render();break;
    case 'ev-del':if(!UI.evDel){UI.evDel=true;render();return;}S.events=S.events.filter(function(x){return x.id!==UI.ev.id;});UI.sheet=null;save();render();toast('予定を消しました');break;
    case 'feed-oshi':FEED.oshi=v||'';loadFeed(true);break;
    case 'feed-reload':loadFeed(true);break;
    case 'feed-more':loadFeed(false);break;
    case 'visit':openVisit(v);break;
    case 'like':if(needLogin('「わかる」するにはログインしてね'))return;(function(){var p=findPost(v);if(!p)return;var on=!FEED.liked[p.id];if(on)FEED.liked[p.id]=1;else delete FEED.liked[p.id];p.likes=[{count:Math.max(0,((p.likes&&p.likes[0]&&p.likes[0].count)||0)+(on?1:-1))}];render();
      window.KC.like(p.id,on).catch(function(e){if(on)delete FEED.liked[p.id];else FEED.liked[p.id]=1;p.likes=[{count:Math.max(0,p.likes[0].count+(on?-1:1))}];render();toast(window.KC.message(e));});})();break;
    case 'post-menu':FEED.menu=FEED.menu===Number(v)?null:Number(v);FEED.confirm=null;render();break;
    case 'post-del':(function(){var p=findPost(v);if(!p)return;if(FEED.confirm!=='del'+p.id){FEED.confirm='del'+p.id;render();return;}
      window.KC.deletePost(p).then(function(){FEED.items=FEED.items.filter(function(x){return x.id!==p.id;});FEED.menu=null;FEED.confirm=null;render();toast('投稿を削除しました');},function(e){toast(window.KC.message(e));});})();break;
    case 'block':if(needLogin())return;if(FEED.confirm!=='blk'+v){FEED.confirm='blk'+v;render();return;}
      window.KC.block(v).then(function(){FEED.blocks[v]=1;FEED.menu=null;FEED.confirm=null;render();toast('ブロックしました。この人の投稿は表示されません');},function(e){toast(window.KC.message(e));});break;
    case 'report-open':if(needLogin('通報するにはログインしてね'))return;REPORT={post:Number(v),reason:REASONS[0],busy:false};UI.sheet='report';render();break;
    case 'report-reason':REPORT.reason=v;render();break;
    case 'report-close':UI.sheet=null;render();break;
    case 'post-open':if(needLogin('投稿するにはログインしてね'))return;UI.sheet='post';POST.busy=false;if(POST.oshi&&!S.oshis.some(function(o){return o.name===POST.oshi;}))POST.oshi='';render();break;
    case 'post-close':UI.sheet=null;render();break;
    case 'post-kind':POST.kind=v;render();break;
    case 'post-oshi':POST.oshi=v||'';render();break;
    case 'post-img-clear':POST.img=null;POST.blob=null;render();break;
    case 'admin-open':ADMIN.open=true;render();window.scrollTo(0,0);loadAdmin();break;
    case 'admin-close':ADMIN.open=false;render();window.scrollTo(0,0);loadFeed(true);break;
    case 'admin-del':(function(){var r=ADMIN.rows.filter(function(x){return String(x.post_id)===String(v);})[0];if(!r||!r.posts)return;
      window.KC.deletePost(r.posts).then(function(){ADMIN.rows=ADMIN.rows.filter(function(x){return String(x.post_id)!==String(v);});render();toast('投稿を削除しました');},function(e){toast(window.KC.message(e));});})();break;
    case 'admin-keep':window.KC.adminKeep(Number(v)).then(function(){ADMIN.rows=ADMIN.rows.filter(function(x){return String(x.post_id)!==String(v);});render();toast('表示に戻しました');},function(e){toast(window.KC.message(e));});break;
    case 'deco-start':UI.deco=true;UI.sel=null;UI.pane='items';render();break;
    case 'deco-done':UI.deco=false;UI.sel=null;save();render();toast('部屋を保存しました');break;
    case 'deco-toggle':var it=S.room.items[v];it.on=!it.on;if(it.on){var df=ITEMS[v].def;it.x=df.x;it.y=df.y;UI.sel=v;}else if(UI.sel===v)UI.sel=null;save();render();break;
    case 'deco-color':if(UI.sel&&UI.sel!=='char'){S.room.items[UI.sel].color=v;save();render();}break;
    case 'pane':UI.pane=v;render();break;
    case 'wall':S.room.wall=v;save();render();break;
    case 'floor':S.room.floor=v;save();render();break;
    case 'wallpat':S.room.wallPat=Number(v);save();render();break;
    case 'floorpat':S.room.floorPat=Number(v);save();render();break;
    case 'month':UI.month+=Number(v);UI.del=null;render();break;
    case 'budget-edit':UI.budgetEdit=true;render();var bi=document.getElementById('budget-in');if(bi)bi.focus();break;
    case 'ex-clear':S.money.records=S.money.records.filter(function(r){return !r.example;});save();render();toast('例を消しました');break;
    case 'rec-open':UI.sheet='rec';UI.recAmount='';UI.recMemo='';UI.recDate=todayStr();if(UI.recOshi&&!S.oshis.some(function(o){return o.name===UI.recOshi;}))UI.recOshi='';render();setTimeout(function(){var x=document.getElementById('rec-amount');if(x)x.focus();},50);break;
    case 'rec-close':case 'share-close':UI.sheet=null;render();break;
    case 'rec-cat':UI.recCat=v;render();break;
    case 'rec-oshi':UI.recOshi=v;render();break;
    case 'rec-dup':var r=S.money.records.filter(function(x){return x.id===v;})[0];if(r){S.money.records.push({id:uid(),date:todayStr(),amount:r.amount,cat:r.cat,oshi:r.oshi,memo:r.memo});UI.month=0;save();render();toast('今日の日付でもう一度入れました');}break;
    case 'rec-del':if(UI.del===v){S.money.records=S.money.records.filter(function(x){return x.id!==v;});UI.del=null;save();render();toast('記録を消しました');}else{UI.del=v;render();}break;
    case 'share':makeShare();break;
    case 'backup-out':UI.backup='out';render();break;
    case 'backup-in':UI.backup='in';UI.restoreText='';render();break;
    case 'backup-close':UI.backup=null;render();break;
    case 'backup-copy':var ta=document.getElementById('backup-out');if(!ta)return;
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ta.value).then(function(){toast('コピーしました');},function(){ta.select();toast('文字を選んだので、コピーしてね');});}else{ta.select();toast('文字を選んだので、コピーしてね');}break;
    case 'backup-restore':var ns=null;try{ns=fixState(JSON.parse(UI.restoreText||''));}catch(e){ns=null;}
      if(!ns){toast('バックアップの文字を読み込めませんでした');return;}ns.room.photo=S.room.photo;S=ns;save();UI.backup=null;render();toast('バックアップから戻しました');break;
    case 'auth-open':if(!cloudOn()){toast('今はオンラインの機能が使えません');return;}UI.sheet='auth';UI.authPw='';render();setTimeout(function(){var x=document.getElementById('auth-email');if(x)x.focus();},50);break;
    case 'auth-close':UI.sheet=null;render();break;
    case 'auth-mode':UI.authMode=v;render();break;
    case 'auth-out':window.KC.signOut().then(function(){toast('ログアウトしました');render();});break;
    case 'link-copy':var lk=roomLink();if(lk)copyText(lk,'room-link');break;
    case 'use-server':var ns=stateFromServer(UI.conflict);UI.conflict=null;if(ns){ns.room.photo=ns.room.photo||null;S=ns;saveLocal();}window.KC.paused=false;render();toast('サーバーのMy Roomにしました');break;
    case 'use-local':UI.conflict=null;window.KC.paused=false;window.KC.schedulePush(S);render();toast('この端末のMy Roomをサーバーに保存します');break;
    case 'leave-visit':if(VISIT&&VISIT.from)UI.tab=VISIT.from;VISIT=null;try{history.replaceState(null,'',location.pathname);}catch(e){}render();window.scrollTo(0,0);break;
    case 'reset-ask':UI.reset=true;render();break;
    case 'reset-no':UI.reset=false;render();break;
    case 'reset-yes':S=newState();save();UI.reset=false;UI.step=0;UI.tab='room';render();window.scrollTo(0,0);break;
  }
}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-act]');if(!t)return;var a=t.getAttribute('data-act');
  if(a==='sheet-bg'||a==='share-bg'){if(e.target===t){UI.sheet=null;render();}return;}
  act(a,{v:t.getAttribute('data-v'),k:t.getAttribute('data-k')});
});
document.addEventListener('input',function(e){
  var id=e.target.id;
  if(id==='onb-name'||id==='set-name'){S.me.name=e.target.value;save();}
  else if(id==='onb-oshi'||id==='set-oshi')UI.oshiDraft=e.target.value;
  else if(id==='rec-amount')UI.recAmount=e.target.value;
  else if(id==='rec-memo')UI.recMemo=e.target.value;
  else if(id==='rec-date')UI.recDate=e.target.value;
  else if(id==='backup-in')UI.restoreText=e.target.value;
  else if(id==='auth-email')UI.authEmail=e.target.value;
  else if(id==='auth-pw')UI.authPw=e.target.value;
  else if(id==='ev-date'){if(UI.ev)UI.ev.dates[0]=e.target.value;}
  else if(id.indexOf('ev-dx-')===0){if(UI.ev)UI.ev.dates[Number(id.slice(6))]=e.target.value;}
  else if(id==='ev-title'||id==='ev-time'||id==='ev-memo'){if(UI.ev)UI.ev[id.slice(3)]=e.target.value;}
  else if(id==='post-body'){POST.body=e.target.value;var pc=document.getElementById('post-count');if(pc)pc.textContent=POST.body.length+' / 300';}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&(e.target.id==='onb-oshi'||e.target.id==='set-oshi')){e.preventDefault();addOshi();}
  if(e.key==='Escape'&&UI.sheet){UI.sheet=null;render();}
});
document.addEventListener('submit',function(e){
  var f=e.target.getAttribute('data-form');if(!f)return;e.preventDefault();
  if(f==='auth'){
    var em=(UI.authEmail||'').trim(),pw=UI.authPw||'';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){toast('メールアドレスを確かめてね');return;}
    if(pw.length<6){toast('パスワードは6文字以上にしてね');return;}
    if(UI.authMode==='up'&&!UI.agree){toast('利用規約などに同意してね');return;}
    UI.authBusy=true;render();
    var p=UI.authMode==='up'?window.KC.signUp(em,pw):window.KC.signIn(em,pw);
    p.then(function(r){UI.authBusy=false;UI.authPw='';
      if(r&&r.needConfirm){UI.sheet=null;render();toast('確認メールを送りました。メールのリンクを押してね');return;}
      UI.sheet=null;render();
    },function(err){UI.authBusy=false;render();toast(window.KC.message(err));});
    return;
  }
  if(f==='post'){
    if(POST.busy)return;var body=(POST.body||'').trim();
    if(!body&&!POST.blob){toast('写真かひとことを入れてね');return;}
    var oo=S.oshis.filter(function(o){return o.name===POST.oshi;})[0];
    POST.busy=true;render();var KC=window.KC;
    KC.push(S).then(function(){return POST.blob?KC.uploadImage(POST.blob):null;}).then(function(path){
      return KC.createPost({kind:POST.kind,body:body.slice(0,300),image_path:path,oshi:oo?oo.name:null,oshi_color:oo?oo.color:null});
    }).then(function(row){
      row.profiles={nickname:S.me.name,me:S.me};row.likes=[{count:0}];
      if(!FEED.oshi||FEED.oshi===row.oshi)FEED.items.unshift(row);
      POST={kind:'word',body:'',oshi:POST.oshi,img:null,blob:null,busy:false};UI.sheet=null;UI.tab='feed';render();window.scrollTo(0,0);toast('投稿しました');
    },function(err){POST.busy=false;render();toast(KC.message(err));});
    return;
  }
  if(f==='ev'){
    var ev=UI.ev,t=(ev.title||'').trim();
    if(!t){toast('なにがあるか入れてね');return;}
    var dts=(ev.kind==='bday'?ev.dates.slice(0,1):ev.dates).filter(function(x){return /^\d{4}-\d{2}-\d{2}$/.test(x||'');});
    if(!dts.length){toast('日付を選んでね');return;}
    dts=dts.filter(function(x,i){return dts.indexOf(x)===i;}).sort().slice(0,14);
    var row={id:ev.id||uid(),title:t.slice(0,40),kind:ev.kind,date:dts[0],time:/^\d{2}:\d{2}$/.test(ev.time||'')?ev.time:'',oshi:ev.oshi||'',memo:(ev.memo||'').trim().slice(0,80)};if(dts.length>1)row.dates=dts;
    var ix=S.events.findIndex(function(x){return x.id===row.id;});if(ix>=0)S.events[ix]=row;else S.events.push(row);
    UI.sheet=null;UI.calDay=nextDate(row,todayStr())||row.date;var d0=new Date(),dd=dparse(UI.calDay);UI.calMonth=(dd.getFullYear()-d0.getFullYear())*12+(dd.getMonth()-d0.getMonth());
    save();render();toast(ix>=0?'予定を保存しました':'予定を追加しました');return;
  }
  if(f==='report'){
    if(REPORT.busy)return;REPORT.busy=true;render();
    window.KC.report(REPORT.post,REPORT.reason).then(function(){UI.sheet=null;FEED.menu=null;render();toast('通報しました。運営が確認します');},function(err){REPORT.busy=false;render();toast(window.KC.message(err));});
    return;
  }
  if(f==='budget'){var n=parseInt(String(document.getElementById('budget-in').value).replace(/[^0-9]/g,''),10);if(isNaN(n)){toast('数字で入れてね');return;}S.money.budget=n;UI.budgetEdit=false;save();render();}
  if(f==='rec'){
    var amt=parseInt(String(UI.recAmount).replace(/[^0-9]/g,''),10);if(!amt||amt<=0){toast('金額を入れてね');return;}
    var date=/^\d{4}-\d{2}-\d{2}$/.test(UI.recDate)?UI.recDate:todayStr();
    S.money.records.push({id:uid(),date:date,amount:amt,cat:UI.recCat,oshi:UI.recOshi,memo:(UI.recMemo||'').trim()});
    UI.sheet=null;var d0=new Date(),dd=new Date(date+'T00:00:00');UI.month=(dd.getFullYear()-d0.getFullYear())*12+(dd.getMonth()-d0.getMonth());
    save();render();toast('貯金箱に入れました');
  }
});
document.addEventListener('change',function(e){
  if(e.target.id==='agree'){UI.agree=e.target.checked;return;}
  if(e.target.id==='post-file'&&e.target.files&&e.target.files[0]){
    resizeToBlob(e.target.files[0],function(b,url){if(!b){toast('この画像は読み込めませんでした');return;}POST.blob=b;POST.img=url;render();});return;}
  if(e.target.id!=='photo-in'||!e.target.files||!e.target.files[0])return;
  var fr=new FileReader();
  fr.onload=function(){loadImg(fr.result,function(img){
    if(!img){toast('この画像は読み込めませんでした');return;}
    var max=320,sc=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);var prev=S.room.photo;S.room.photo=c.toDataURL('image/jpeg',.82);
    if(!save()){S.room.photo=prev;toast('写真を保存できませんでした。別の写真で試してね');}else toast('写真を飾りました');render();
  });};
  fr.readAsDataURL(e.target.files[0]);
});

/* ================= Share image ================= */
function makeShare(){
  UI.sheet='share';UI.shareURL=null;render();
  var srcs=layers(S.me),done=0,datas=[];
  var room=PARTS.room||{},roomSrcs=Object.keys(room).filter(function(k){return room[k]&&room[k].src;}).map(function(k){return room[k].src;});
  var all=srcs.concat(roomSrcs),map={};
  if(!all.length)return build();
  all.forEach(function(src,i){toData(src,function(du){map[src]=du;if(i<srcs.length)datas[i]=du;if(++done===all.length)build();});});
  function build(){
    var svgStr=roomSVG({export:true,layers:datas});
    roomSrcs.forEach(function(src){svgStr=svgStr.split('href="'+esc(src)+'"').join('href="'+map[src]+'"');});
    loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgStr),function(img){
      if(!img){UI.sheet=null;render();toast('画像をつくれませんでした');return;}
      var draw=function(){try{
        var W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');
        x.fillStyle='#FCE7EF';x.fillRect(0,0,W,H);
        var rw=960,rh=Math.round(960*380/360),rx=60,ry=170;
        x.save();roundRect(x,rx,ry,rw,rh,48);x.clip();x.drawImage(img,rx,ry,rw,rh);x.restore();
        x.fillStyle='#1E2140';x.textAlign='center';x.font='700 64px "Zen Maru Gothic", sans-serif';x.fillText((S.me.name||'わたし')+'のMy Room',W/2,120);
        x.font='500 34px "Zen Kaku Gothic New", sans-serif';x.fillStyle='#9A174E';
        var names=S.oshis.slice(0,3).map(function(o){return o.name;}).join('・');x.fillText(names?names+' 推し':'わたしの推し部屋',W/2,ry+rh+66);
        x.font='700 30px "Zen Maru Gothic", sans-serif';x.fillStyle='#1E2140';x.fillText('キラペンでつくったよ',W/2,H-36);
        UI.shareURL=c.toDataURL('image/png');
      }catch(err){UI.sheet=null;toast('画像をつくれませんでした');}
      render();};
      if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw,draw);else draw();
    });
  }
}
function roundRect(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();}

/* ================= Boot ================= */
function syncAfterLogin(){
  var KC=window.KC;KC.paused=true;
  KC.pull().then(function(sv){
    if(!sv){KC.paused=false;if(S.onboarded){KC.schedulePush(S);toast('My Roomをサーバーに保存しました');}render();return;}
    if(!S.onboarded){var ns=stateFromServer(sv);if(ns){S=ns;saveLocal();}KC.paused=false;UI.tab='room';render();toast('おかえりなさい！');return;}
    UI.conflict=sv;render();
  },function(e){KC.paused=false;toast(KC.message(e));render();});
}
function boot(p){
  PARTS=p;SLOT={};PARTS.slots.forEach(function(s){SLOT[s.id]=s;});
  if(!findItem('hair',S.me.layers.hair)&&slotItems('hair')[0])S.me.layers.hair=slotItems('hair')[0].id;
  var rid=null;try{rid=new URLSearchParams(location.search).get('room');var dq=new URLSearchParams(location.search).get('doc');if(dq&&DOCS[dq])UI.doc=dq;}catch(e){}
  if(rid&&/^[0-9a-f-]{36}$/i.test(rid)){
    VISIT={loading:true};
    var go=function(){if(!cloudOn()){VISIT={loading:false,error:'今はオンラインの機能が使えません。'};render();return;}
      window.KC.fetchRoom(rid).then(function(d){VISIT={loading:false,data:d};render();},function(e){VISIT={loading:false,error:window.KC.message(e)};render();});};
    go();
  }
  window.addEventListener('popstate',function(){var q='';try{q=new URLSearchParams(location.search).get('room')||'';}catch(e){}if(!q&&VISIT){if(VISIT.from)UI.tab=VISIT.from;VISIT=null;render();}});
  var lastUid=null;
  if(window.KC&&window.KC.onChange)window.KC.onChange(function(){var nu=cloudUser()?cloudUser().id:null;if(nu!==lastUid){lastUid=nu;FEED.liked={};FEED.blocks={};FEED.loaded=false;FEED.menu=null;ADMIN.open=false;if(UI.tab==='feed'&&S.onboarded)setTimeout(function(){loadFeed(true);},0);}if(window.KC.justSignedIn){window.KC.justSignedIn=false;syncAfterLogin();}else render();});
  render();
  /* スプラッシュ：キャラの画像とログイン状態がそろうまで（最短0.9秒、最長4秒） */
  var srcs=layers(S.me),left=srcs.length,imgsDone=false;
  srcs.forEach(function(s){loadImg(s,function(){if(--left<=0)imgsDone=true;});});
  if(!srcs.length)imgsDone=true;
  var t0=Date.now(),tick=setInterval(function(){
    var cloudReady=!window.KC||window.KC.loaded;
    if((imgsDone&&cloudReady&&Date.now()-t0>900)||Date.now()-t0>4000){clearInterval(tick);hideSplash();}
  },100);
}
function hideSplash(){var sp=document.getElementById('splash');if(!sp)return;sp.classList.add('done');setTimeout(function(){sp.classList.add('hide');setTimeout(function(){if(sp.parentNode)sp.parentNode.removeChild(sp);},500);},350);}
if(window.KIRAPEN_PARTS)boot(window.KIRAPEN_PARTS);
else fetch('assets/parts.json',{cache:'no-cache'}).then(function(r){return r.json();}).then(boot).catch(function(){hideSplash();document.getElementById('app').innerHTML='<div class="card"><b>読み込みに失敗しました</b><p class="small muted">通信のよい場所で、もう一度開いてみてね。</p></div>';});
if('serviceWorker' in navigator&&location.protocol==='https:'&&!window.KIRAPEN_PARTS){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').then(function(r){try{r.update();}catch(e){}}).catch(function(){});var had=!!navigator.serviceWorker.controller,rl=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(had&&!rl){rl=true;location.reload();}});});}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
})();
