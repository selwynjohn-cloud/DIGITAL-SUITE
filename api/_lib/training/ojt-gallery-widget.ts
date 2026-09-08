/**
 * Training completion photos — album picker that never sits inside a hidden tab.
 * iPhone refuses file boxes that live under display:none; this dock stays on the page.
 */

export function ojtGalleryWidgetHtml(): string {
  return `
<style>${ojtGalleryWidgetCss()}</style>
<div id="ojtGalDock" class="ojt-gal-dock">
  <div class="ojt-gal-dock-title">Training photos from album (maximum 3)</div>
  <p class="ojt-gal-dock-hint">Tap <b>Choose File</b>, then pick a picture from your phone album. A red <b>Delete</b> appears under each photo.</p>
  <input type="file" id="ojtGalFile">
  <div id="ojtGalDockGrid" class="ojt-gal-dock-grid"></div>
</div>
<script>
(function(){
  var MAX=3;
  var photos=[];
  function $(id){ return document.getElementById(id); }
  function toast(msg){
    if(typeof trainingToast==='function') trainingToast(msg);
    else alert(msg);
  }
  function list(){ return photos.slice(); }
  function render(){
    var grid=$('ojtGalDockGrid');
    var formGrid=$('rPhotoGrid');
    var meta=$('rPhotoMeta');
    var html=photos.map(function(p,i){
      var img=(p.base64&&p.base64!=='__stored__')
        ? '<img src="data:'+(p.type||'image/jpeg')+';base64,'+p.base64+'" alt="Photo '+(i+1)+'">'
        : '<div class="ojt-gal-ph">Saved photo '+(i+1)+'</div>';
      return '<div class="ojt-gal-card">'+img+
        '<div class="ojt-gal-card-bot"><span>Photo '+(i+1)+'</span>'+
        '<button type="button" class="ojt-gal-del" data-ojt-del="'+String(p.id||'')+'">Delete</button></div></div>';
    }).join('');
    if(grid){
      grid.innerHTML=html;
      grid.querySelectorAll('[data-ojt-del]').forEach(function(btn){
        btn.onclick=function(){
          var id=btn.getAttribute('data-ojt-del');
          photos=photos.filter(function(p){ return p.id!==id; });
          render();
          toast('Photo deleted.');
        };
      });
    }
    if(formGrid) formGrid.innerHTML=grid?grid.innerHTML:'';
    if(formGrid){
      formGrid.querySelectorAll('[data-ojt-del]').forEach(function(btn){
        btn.onclick=function(){
          var id=btn.getAttribute('data-ojt-del');
          photos=photos.filter(function(p){ return p.id!==id; });
          render();
          toast('Photo deleted.');
        };
      });
    }
    if(meta) meta.textContent=photos.length+' of '+MAX+' photos — tap Delete to remove';
    if(window.OJT_GALLERY) window.OJT_GALLERY.photos=photos;
  }
  function addInfo(info){
    if(!info||!info.base64) return;
    if(photos.length>=MAX){ toast('Maximum '+MAX+' photos allowed.'); return; }
    photos.push({
      id:'ph'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
      name:info.name||'photo.jpg',
      type:info.type||'image/jpeg',
      base64:info.base64
    });
    render();
    toast('Photo added ('+photos.length+' of '+MAX+').');
  }
  function compress(file, cb){
    var r=new FileReader();
    r.onload=function(){
      var img=new Image();
      img.onload=function(){
        var w=img.width||1280,h=img.height||1280,mx=1280;
        if(w>mx){ h=Math.max(1,Math.round(h*mx/w)); w=mx; }
        var c=document.createElement('canvas');
        c.width=w; c.height=h;
        var ctx=c.getContext('2d');
        if(!ctx){ fallback(); return; }
        ctx.drawImage(img,0,0,w,h);
        var du=c.toDataURL('image/jpeg',0.82);
        var i=du.indexOf('base64,');
        var b64=i>=0?du.slice(i+7):'';
        if(!b64){ fallback(); return; }
        cb({name:String(file.name||'photo.jpg').replace(/\\.[^.]+$/,'')+'.jpg',type:'image/jpeg',base64:b64});
      };
      img.onerror=fallback;
      img.src=r.result;
    };
    r.onerror=function(){ toast('Could not read that picture. Try another one from the album.'); };
    r.readAsDataURL(file);
    function fallback(){
      var s=String(r.result||'');
      var i=s.indexOf('base64,');
      var b64=i>=0?s.slice(i+7):'';
      if(!b64){ toast('Could not read that picture. Try another one from the album.'); return; }
      cb({name:file.name||'photo.jpg',type:file.type||'image/jpeg',base64:b64});
    }
  }
  function addFiles(fileList){
    var files=Array.prototype.slice.call(fileList||[]).filter(Boolean);
    if(!files.length){ toast('No picture came through. Tap Choose File again.'); return; }
    files.forEach(function(f){
      if(photos.length>=MAX) return;
      compress(f, addInfo);
    });
  }
  window.OJT_GALLERY={
    photos:photos,
    list:list,
    set:function(rows){
      var hasLocal=photos.some(function(p){ return p.base64 && p.base64!=='__stored__'; });
      if(hasLocal){ render(); return; }
      photos=(rows||[]).slice(0,MAX).map(function(p,i){
        return {id:p.id||('ph'+i),name:p.name||('photo-'+(i+1)+'.jpg'),type:p.type||'image/jpeg',base64:p.base64||'__stored__'};
      });
      render();
    },
    add:addInfo,
    addFiles:addFiles,
    render:render
  };
  var inp=$('ojtGalFile');
  if(inp){
    inp.onchange=function(){
      addFiles(inp.files);
      try{ inp.value=''; }catch(e){}
    };
  }
})();
</script>
`
}

export function ojtGalleryWidgetCss(): string {
  return `
.ojt-gal-dock{
  position:relative;margin:16px 16px 28px;padding:14px 14px 16px;
  border:2px solid #c9a84c;border-radius:14px;background:#14224f;z-index:20;
}
.ojt-gal-dock-title{font-weight:800;color:#fde68a;margin-bottom:6px}
.ojt-gal-dock-hint{color:#e2e8f0;font-size:.9rem;line-height:1.45;margin:0 0 10px}
.ojt-gal-dock input[type=file]{
  display:block;width:100%;max-width:480px;min-height:56px;font-size:16px;
  padding:10px;border-radius:10px;border:1px solid #fde68a;background:#0b1220;color:#fde68a;
}
.ojt-gal-dock-grid{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.ojt-gal-card{width:140px;border:1px solid rgba(201,168,76,.45);border-radius:10px;overflow:hidden;background:#0b1220}
.ojt-gal-card img,.ojt-gal-ph{width:100%;height:120px;object-fit:cover;display:block;background:#111a30}
.ojt-gal-ph{display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:12px;text-align:center;padding:8px}
.ojt-gal-card-bot{padding:8px;display:flex;flex-direction:column;gap:6px}
.ojt-gal-card-bot span{color:#94a3b8;font-size:12px}
.ojt-gal-del{
  width:100%;min-height:44px;border:1px solid #fecaca;border-radius:8px;
  background:#b91c1c;color:#fff;font-weight:800;font-size:15px;cursor:pointer;
}
`
}
