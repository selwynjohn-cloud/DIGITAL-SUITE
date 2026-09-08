/**
 * HDFC SSA board — Leaflet India political map (State → District → City → Branch).
 * State outlines from /maps/india-states.geojson. District / city / unit from GPS.
 */
import { hdfcSsaCityGeoJson } from './hdfc-ssa-board-geo.js'

export function hdfcSsaBoardMapJs(): string {
  return `
var SSA_MAP=null, SSA_LAYER_STATES=null, SSA_LAYER_DIST=null, SSA_LAYER_MARK=null;
var SSA_STATE_GJ=null, SSA_MAP_DATA=null, SSA_MAP_UI=null;
var SSA_CITY_GEO=${hdfcSsaCityGeoJson()};
var SSA_STATE_GEO_URLS=['/maps/india-states.geojson'];
function ssaMapNorm(s){
  return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\\s+/g,' ').trim();
}
function ssaCanonState(raw){
  var k=ssaMapNorm(raw);
  if(k==='pondicherry'||k==='puducherry') return 'Puducherry';
  if(k==='orissa'||k==='odisha') return 'Odisha';
  if(k==='nct of delhi'||k==='delhi') return 'Delhi';
  if(k==='andhra pradesh') return 'Andhra Pradesh';
  if(k==='telangana') return 'Telangana';
  if(k==='tamil nadu'||k==='tamilnadu') return 'Tamil Nadu';
  if(k==='madhya pradesh') return 'Madhya Pradesh';
  if(k==='uttaranchal'||k==='uttarakhand') return 'Uttarakhand';
  var titled=String(raw||'').replace(/_/g,' ').trim();
  return titled;
}
function ssaFeatState(p){
  p=p||{};
  return ssaCanonState(p.ST_NM||p.NAME_1||p.st_nm||p.state||p.NAME||p.name||'');
}
function ssaFeatDistrict(p){
  p=p||{};
  return String(p.DISTRICT||p.NAME_2||p.district||p.dtname||p.NAME||'').trim();
}
function ssaCanonDistrictJs(raw){
  var k=ssaMapNorm(raw);
  var map={
    nellore:'SPSR Nellore','spsr nellore':'SPSR Nellore','sri potti sriramulu nellore':'SPSR Nellore',
    tirupati:'Tirupati',chittoor:'Tirupati',
    anantapur:'Anantapuramu',anantapuramu:'Anantapuramu',
    'east godavari':'Kakinada',kakinada:'Kakinada',
    visakhapatnam:'Visakhapatnam',vishakhapatnam:'Visakhapatnam',
    krishna:'NTR',ntr:'NTR',vijayawada:'NTR',
    hyderabad:'Hyderabad','ranga reddy':'Ranga Reddy',rangareddy:'Ranga Reddy',
    chennai:'Chennai',madras:'Chennai',
    puducherry:'Puducherry',pondicherry:'Puducherry',
    bangalore:'Bengaluru Urban',bengaluru:'Bengaluru Urban','bengaluru urban':'Bengaluru Urban','bangalore urban':'Bengaluru Urban',
    ernakulam:'Ernakulam',
    mumbai:'Mumbai','mumbai city':'Mumbai','mumbai suburban':'Mumbai',
    surat:'Surat',bhopal:'Bhopal'
  };
  return map[k]||String(raw||'').replace(/\\s+district$/i,'').replace(/\\s+/g,' ').trim();
}
function ssaFillForRate(r){
  r=Number(r)||0;
  if(r>=70) return '#7c2d12';
  if(r>=50) return '#9a3412';
  if(r>=30) return '#a16207';
  return '#14532d';
}
function ssaFetchFirst(urls, i, ok, fail){
  i=i||0;
  if(i>=urls.length){if(fail)fail();return;}
  fetch(urls[i],{credentials:'omit'}).then(function(r){
    if(!r.ok) throw new Error('bad');
    return r.json();
  }).then(ok).catch(function(){ssaFetchFirst(urls,i+1,ok,fail);});
}
function ssaLoadLeaflet(done){
  if(window.L){done();return;}
  window.__ssaLeafletCbs=window.__ssaLeafletCbs||[];
  window.__ssaLeafletCbs.push(done);
  if(window.__ssaLeafletLoading) return;
  window.__ssaLeafletLoading=true;
  function finish(ok){
    window.__ssaLeafletLoading=false;
    var cbs=window.__ssaLeafletCbs||[];
    window.__ssaLeafletCbs=[];
    if(!ok){
      var box=document.getElementById('ssaIndiaMap');
      if(box) box.innerHTML='<p class="hint">Political map could not load. Use State · District · City · Bank code below.</p>';
      return;
    }
    cbs.forEach(function(fn){try{fn();}catch(e){}});
  }
  function addScript(src, next){
    var s=document.createElement('script');
    s.src=src;
    s.onload=function(){finish(true);};
    s.onerror=next||function(){finish(false);};
    document.head.appendChild(s);
  }
  var css=document.createElement('link');
  css.rel='stylesheet';
  css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  css.onerror=function(){css.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';};
  document.head.appendChild(css);
  addScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', function(){
    addScript('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js', function(){finish(false);});
  });
}
function ssaDestroyMap(){
  if(SSA_MAP){try{SSA_MAP.remove();}catch(e){}}
  SSA_MAP=null; SSA_LAYER_STATES=null; SSA_LAYER_DIST=null; SSA_LAYER_MARK=null;
}
function ssaInitMap(data, ui){
  var box=document.getElementById('ssaIndiaMap');
  if(!box||!window.L) return;
  SSA_MAP_DATA=data; SSA_MAP_UI=ui||{};
  if(SSA_MAP){try{SSA_MAP.remove();}catch(e){} SSA_MAP=null;}
  box.innerHTML='';
  SSA_MAP=L.map(box,{scrollWheelZoom:true, zoomControl:true}).setView([22.3,80.9],4.6);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    attribution:'© OpenStreetMap · © CARTO',
    subdomains:'abcd',
    maxZoom:18
  }).addTo(SSA_MAP);
  setTimeout(function(){if(SSA_MAP) SSA_MAP.invalidateSize();},80);
  function afterStates(){
    ssaPaintStateLayer();
    ssaPaintMarkers();
    ssaFitMap();
    if(SSA_MAP_UI && SSA_MAP_UI.state) ssaPaintDistrictMarkers(SSA_MAP_UI.state);
  }
  if(SSA_STATE_GJ){afterStates();return;}
  ssaFetchFirst(SSA_STATE_GEO_URLS,0,function(gj){
    if(gj && gj.type==='FeatureCollection'){SSA_STATE_GJ=gj; afterStates();}
    else {ssaPaintMarkers(); ssaFitMap();}
  },function(){ssaPaintMarkers(); ssaFitMap();});
}
function ssaStateStyle(name){
  var st=typeof ssaFindState==='function'?ssaFindState(SSA_MAP_DATA||{}, name):null;
  var on=SSA_MAP_UI && SSA_MAP_UI.state && ssaMapNorm(SSA_MAP_UI.state)===ssaMapNorm(name);
  return {
    color: on?'#fde68a':'#1e3a8a',
    weight: on?2.4:1,
    fillColor: st?ssaFillForRate(st.avgRiskRate):'#0b1220',
    fillOpacity: st?(on?0.62:0.42):0.08
  };
}
function ssaPaintStateLayer(){
  if(!SSA_MAP||!window.L||!SSA_STATE_GJ) return;
  if(SSA_LAYER_STATES){try{SSA_MAP.removeLayer(SSA_LAYER_STATES);}catch(e){}}
  SSA_LAYER_STATES=L.geoJSON(SSA_STATE_GJ,{
    style:function(feat){return ssaStateStyle(ssaFeatState(feat&&feat.properties));},
    onEachFeature:function(feat, layer){
      var name=ssaFeatState(feat&&feat.properties);
      if(!name) return;
      layer.bindTooltip(name,{sticky:true,opacity:0.95});
      layer.on('click',function(){
        if(typeof pickBoardState==='function') pickBoardState(name);
      });
    }
  }).addTo(SSA_MAP);
}
function ssaPaintDistrictMarkers(stateName){
  if(SSA_LAYER_DIST && SSA_MAP){try{SSA_MAP.removeLayer(SSA_LAYER_DIST);}catch(e){}}
  SSA_LAYER_DIST=null;
  if(!SSA_MAP||!window.L||!stateName) return;
  var st=typeof ssaFindState==='function'?ssaFindState(SSA_MAP_DATA||{}, stateName):null;
  if(!st) return;
  var picked=SSA_MAP_UI && SSA_MAP_UI.district;
  var by={};
  (st.branches||[]).forEach(function(b){
    var d=String(b.district||'').trim();
    if(!d) return;
    if(!by[d]) by[d]={lats:[], lngs:[], district:d};
    var lat=b.lat, lng=b.lng;
    if(lat==null||lng==null){
      var fb=SSA_CITY_GEO.filter(function(g){return ssaMapNorm(g.city)===ssaMapNorm(b.branchName);})[0];
      if(fb){lat=fb.lat; lng=fb.lng;}
    }
    if(lat==null||lng==null) return;
    by[d].lats.push(lat); by[d].lngs.push(lng);
  });
  SSA_LAYER_DIST=L.featureGroup().addTo(SSA_MAP);
  Object.keys(by).forEach(function(d){
    var row=by[d];
    if(!row.lats.length) return;
    var lat=row.lats.reduce(function(n,x){return n+x;},0)/row.lats.length;
    var lng=row.lngs.reduce(function(n,x){return n+x;},0)/row.lngs.length;
    var on=picked && ssaMapNorm(picked)===ssaMapNorm(d);
    var m=L.circleMarker([lat,lng],{
      radius:on?16:13,
      color:'#93c5fd',
      weight:2,
      fillColor:on?'#1d4ed8':'#1e3a8a',
      fillOpacity:0.55
    });
    m.bindTooltip(d+' district',{permanent:false});
    m.on('click',function(){
      if(typeof pickBoardDistrict==='function') pickBoardDistrict(stateName, d);
    });
    m.addTo(SSA_LAYER_DIST);
  });
}
function ssaSiteVisible(row, ui){
  ui=ui||{};
  if(ui.state && row.state!==ui.state) return false;
  if(ui.district){
    var d=row.site.district||row.city.district||'';
    if(ssaMapNorm(d)!==ssaMapNorm(ui.district)) return false;
  }
  if(ui.city && row.city.branchKey!==ui.city) return false;
  return true;
}
function ssaCityVisible(row, ui){
  ui=ui||{};
  if(ui.state && row.state!==ui.state) return false;
  if(ui.district){
    var d=row.city.district||'';
    var hit=(row.city.sites||[]).some(function(s){return ssaMapNorm(s.district||'')===ssaMapNorm(ui.district);});
    if(ssaMapNorm(d)!==ssaMapNorm(ui.district) && !hit) return false;
  }
  return true;
}
function ssaPaintMarkers(){
  if(!SSA_MAP||!window.L) return;
  if(SSA_LAYER_MARK){try{SSA_MAP.removeLayer(SSA_LAYER_MARK);}catch(e){}}
  SSA_LAYER_MARK=L.layerGroup().addTo(SSA_MAP);
  var ui=SSA_MAP_UI||{};
  var cities=typeof ssaAllCities==='function'?ssaAllCities(SSA_MAP_DATA||{}):[];
  cities.forEach(function(row){
    if(!ssaCityVisible(row, ui)) return;
    var b=row.city;
    var lat=b.lat, lng=b.lng;
    if(lat==null||lng==null){
      var fb=SSA_CITY_GEO.filter(function(g){return ssaMapNorm(g.city)===ssaMapNorm(b.branchName);})[0];
      if(fb){lat=fb.lat; lng=fb.lng;}
    }
    if(lat==null||lng==null) return;
    var on=ui.city && ui.city===b.branchKey;
    var m=L.circleMarker([lat,lng],{
      radius:on?11:8,
      color:'#fde68a',
      weight:2,
      fillColor:'#c9a84c',
      fillOpacity:0.95
    });
    m.bindTooltip(b.branchName+' · '+row.state+(b.district?' · '+b.district:''),{permanent:false});
    m.on('click',function(){
      if(typeof pickBoardCity==='function') pickBoardCity(row.state, b.branchKey);
    });
    m.addTo(SSA_LAYER_MARK);
  });
  var sites=typeof ssaAllSites==='function'?ssaAllSites(SSA_MAP_DATA||{}):[];
  sites.forEach(function(row){
    var s=row.site;
    if(s.lat==null||s.lng==null) return;
    if(!ssaSiteVisible(row, ui)) return;
    var on=ui.site && ui.site===s.id;
    var m=L.circleMarker([s.lat,s.lng],{
      radius:on?8:5,
      color:on?'#fff':'#0b1220',
      weight:on?2:1,
      fillColor:ssaFillForRate(s.riskRate),
      fillOpacity:0.95
    });
    m.bindTooltip((s.bankCode||'HDFC')+' · '+s.location,{permanent:false});
    m.on('click',function(){
      if(typeof pickBoardSite==='function') pickBoardSite(s.id);
    });
    m.addTo(SSA_LAYER_MARK);
  });
}
function ssaFitMap(){
  if(!SSA_MAP) return;
  var ui=SSA_MAP_UI||{};
  if(ui.site){
    var hit=(typeof ssaAllSites==='function'?ssaAllSites(SSA_MAP_DATA||{}):[]).filter(function(x){return x.site.id===ui.site;})[0];
    if(hit && hit.site.lat!=null){SSA_MAP.setView([hit.site.lat,hit.site.lng],14);return;}
  }
  if(ui.city){
    var cities=typeof ssaAllCities==='function'?ssaAllCities(SSA_MAP_DATA||{}):[];
    var c=cities.filter(function(x){return x.city.branchKey===ui.city;})[0];
    if(c && c.city.lat!=null){SSA_MAP.setView([c.city.lat,c.city.lng],11);return;}
  }
  if(SSA_LAYER_DIST && ui.district){
    try{SSA_MAP.fitBounds(SSA_LAYER_DIST.getBounds(),{padding:[24,24],maxZoom:9});return;}catch(e){}
  }
  if(SSA_LAYER_STATES && ui.state){
    var found=null;
    SSA_LAYER_STATES.eachLayer(function(layer){
      var n=ssaFeatState(layer.feature && layer.feature.properties);
      if(ssaMapNorm(n)===ssaMapNorm(ui.state)) found=layer;
    });
    if(found && found.getBounds){try{SSA_MAP.fitBounds(found.getBounds(),{padding:[20,20],maxZoom:7});return;}catch(e){}}
  }
  SSA_MAP.setView([22.3,80.9],4.6);
}
function ssaRefreshMap(data, ui){
  SSA_MAP_DATA=data; SSA_MAP_UI=ui||{};
  if(!SSA_MAP){ssaInitMap(data, ui);return;}
  if(SSA_LAYER_STATES){
    SSA_LAYER_STATES.setStyle(function(feat){return ssaStateStyle(ssaFeatState(feat&&feat.properties));});
  }
  if(ui && ui.state) ssaPaintDistrictMarkers(ui.state);
  else {
    if(SSA_LAYER_DIST && SSA_MAP){try{SSA_MAP.removeLayer(SSA_LAYER_DIST);}catch(e){}}
    SSA_LAYER_DIST=null;
  }
  ssaPaintMarkers();
  ssaFitMap();
  setTimeout(function(){if(SSA_MAP) SSA_MAP.invalidateSize();},80);
}
function ssaBoardFrameHtml(isPublic){
  var back=isPublic?'':'<div class="ssa-board-head"><h3>HDFC State Dashboard</h3><button type="button" class="m-btn m-btn-grey" onclick="SV_VIEW=\\'list\\';if(typeof ssaDestroyMap===\\'function\\')ssaDestroyMap();render()">Back to HDFC list</button></div>';
  return '<div class="ssa-board" id="ssaBoardRoot">'+back+
    '<div class="ssa-map-wrap"><p class="hint">Select from the India political map: State → District → City → Branch. Pins use the GPS already saved on each HDFC unit.</p>'+
    '<div id="ssaIndiaMap"></div>'+
    '<div class="ssa-map-legend"><span><i style="background:#c9a84c"></i>City / branch</span><span><i style="background:#14532d"></i>Unit (lower risk)</span><span><i style="background:#9a3412"></i>Unit (higher risk)</span><span>Units without GPS stay on the list by bank code.</span></div></div>'+
    '<div id="ssaBoardPanel"></div></div>';
}
function ssaPaintBoard(host, data, ui, isPublic){
  if(!host) return;
  var mapEl=document.getElementById('ssaIndiaMap');
  var panel=document.getElementById('ssaBoardPanel');
  var keep=mapEl && panel && host.contains(mapEl);
  if(!keep){
    if(typeof ssaDestroyMap==='function') ssaDestroyMap();
    host.innerHTML=ssaBoardFrameHtml(!!isPublic);
    panel=document.getElementById('ssaBoardPanel');
  }
  if(panel) panel.innerHTML=ssaBoardShellHtml(data, ui, !!isPublic);
  ssaLoadLeaflet(function(){
    if(!SSA_MAP) ssaInitMap(data, ui);
    else ssaRefreshMap(data, ui);
  });
}
`
}
