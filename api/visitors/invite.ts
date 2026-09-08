/**
 * Public guest invite page — no login, no Command Centre.
 * Government ID photo → text. Company name on invite → company ID card (not visiting card).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SUITE_TAP_FEEDBACK_CSS, suiteTapFeedbackInitScript } from '../_lib/suite-tap-feedback.js'
import { suiteAppOpenPageFooterHtml } from '../_lib/suite-app-footer.js'
import { parseIdOcr } from '../_lib/visitors/ocr.js'
import {
  companyIdRequired,
  getVisitByToken,
  MATERIAL_CATEGORIES,
  normalizeMobile10,
  publicVisit,
  redactSensitiveDigits,
  saveVisit,
  type AvmGovIdType,
  type AvmMaterial,
} from '../_lib/visitors/store.js'

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>
    const token = String(body.token || req.query.token || '').trim()
    const visit = await getVisitByToken(token)
    if (!visit) return json(res, 404, { error: 'This invite link is closed or has expired.' })
    const action = String(body.action || 'get')
    if (action === 'get') {
      return json(res, 200, { ok: true, visit: publicVisit(visit), companyIdRequired: companyIdRequired(visit.visitorCompany) })
    }
    if (action !== 'register') return json(res, 400, { error: 'Unknown action' })
    if (visit.status !== 'invited') {
      return json(res, 200, { ok: true, visit: publicVisit(visit), message: 'Already submitted.' })
    }
    const visitorName = redactSensitiveDigits(String(body.visitorName || '').trim(), 80)
    const visitorMobile = normalizeMobile10(String(body.visitorMobile || visit.visitorMobile))
    const facePhoto = String(body.facePhoto || '')
    const govIdType = String(body.govIdType || '') === 'dl' ? 'dl' : String(body.govIdType || '') === 'aadhaar' ? 'aadhaar' : ''
    const govIdPhoto = String(body.govIdPhoto || '')
    const companyIdPhoto = String(body.companyIdPhoto || '')
    const visitingCard = String(body.idKind || '') === 'visiting'
    if (visitingCard) {
      return json(res, 400, { error: 'A visiting card is not accepted. Use Aadhaar or Driving Licence, and a company ID card with your photo if a company name is on the invite.' })
    }
    if (!visitorName) return json(res, 400, { error: 'Please enter your name.' })
    if (!visitorMobile) return json(res, 400, { error: 'Please enter a 10-digit mobile.' })
    if (!facePhoto.startsWith('data:image/')) return json(res, 400, { error: 'Please add a face photo.' })
    if (!govIdType || !govIdPhoto.startsWith('data:image/')) {
      return json(res, 400, { error: 'Take a photo of your Aadhaar or Driving Licence. The app will read the name.' })
    }
    if (companyIdRequired(visit.visitorCompany) && !companyIdPhoto.startsWith('data:image/')) {
      return json(res, 400, { error: 'This invite names a company. Upload your company ID card with your photo — not a visiting card.' })
    }
    const parsed = parseIdOcr(String(body.ocrText || ''))
    const materials: AvmMaterial[] = Array.isArray(body.materials)
      ? (body.materials as AvmMaterial[]).slice(0, 8).map((m) => ({
          category: MATERIAL_CATEGORIES.includes(String(m.category) as (typeof MATERIAL_CATEGORIES)[number])
            ? String(m.category)
            : 'Other',
          serial: String(m.serial || '').replace(/\b\d{12,}\b/g, '').slice(0, 40),
          outOk: false,
        }))
      : []
    visit.visitorName = visitorName || parsed.ocrName
    visit.visitorMobile = visitorMobile
    visit.facePhoto = facePhoto.slice(0, 220_000)
    visit.govIdType = govIdType as AvmGovIdType
    visit.govIdPhoto = govIdPhoto.slice(0, 220_000)
    visit.companyIdPhoto = companyIdPhoto.startsWith('data:image/') ? companyIdPhoto.slice(0, 220_000) : ''
    visit.ocrName = parsed.ocrName
    visit.ocrText = parsed.ocrText
    visit.materials = materials
    visit.status = 'registered'
    visit.registeredAt = new Date().toISOString()
    await saveVisit(visit)
    return json(res, 200, { ok: true, visit: publicVisit(visit) })
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  const token = String(req.query.token || '').trim()
  return res.status(200).send(PAGE.replace(/__TOKEN__/g, token.replace(/[<>"']/g, '')))
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Agile Visitors — Visit form</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#0b1220;color:#e2e8f0;font-size:16px;padding:14px;padding-bottom:env(safe-area-inset-bottom)}
.hdr{text-align:center;margin:6px 0 14px}
.hdr img{height:48px;background:transparent}
.hdr h1{color:#fff;font-size:20px;margin-top:8px}
.hdr p{color:#7dd3fc;font-size:13px;margin-top:4px}
.card{background:#111a30;border:1px solid #22304f;border-radius:14px;padding:16px;margin-bottom:14px}
label{display:block;font-size:12px;color:#94a3b8;margin:10px 0 4px;font-weight:700}
input,select,textarea{width:100%;padding:12px;border:1px solid #334155;border-radius:8px;background:#0b1220;color:#e2e8f0;font-size:16px}
.btn{padding:14px 16px;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:16px;background:#0ea5e9;color:#fff;width:100%;margin-top:12px}
.green{background:#16a34a}
.note{background:#111a30;border-left:3px solid #0ea5e9;padding:10px 12px;margin-bottom:12px;color:#94a3b8;font-size:13px;line-height:1.5}
.warn{border-left-color:#f59e0b;color:#fcd34d}
.msg{display:none;padding:10px;border-radius:8px;margin-top:10px}
.ok{background:#052e16;color:#86efac}.bad{background:#3a0a0a;color:#fca5a5}
.face{width:120px;height:120px;object-fit:cover;border-radius:12px;border:1px solid #334155;margin-top:8px}
.pass{font-size:28px;letter-spacing:.08em;text-align:center;color:#fde68a;font-weight:800;padding:16px}
${SUITE_TAP_FEEDBACK_CSS}
</style></head>
<body>
<div class="hdr">
  <img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile">
  <h1>Agile Visitors</h1>
  <p>Guest form — no password</p>
</div>
<p class="note">Take a photo of your <b>Aadhaar</b> or <b>Driving Licence</b>. The app reads the name from the photo. A visiting card is not accepted.</p>
<div id="box" class="card">Loading your invite…</div>
${suiteAppOpenPageFooterHtml()}
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
<script>
${suiteTapFeedbackInitScript()}
var TOKEN=${JSON.stringify('__TOKEN__')};
var PHOTO='',GOV='',CO='',OCR='';
function el(id){return document.getElementById(id);}
function h(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function show(html){el('box').innerHTML=html;}
function api(body){
  return fetch('/api/visitors/invite?token='+encodeURIComponent(TOKEN),{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(Object.assign({token:TOKEN},body||{}))
  }).then(function(r){return r.json().then(function(j){return{s:r.status,j:j};});});
}
function compressPhoto(file,cb){
  var img=new Image();
  var url=URL.createObjectURL(file);
  img.onload=function(){
    var w=640,h=Math.round(img.height*(640/img.width));
    var c=document.createElement('canvas');c.width=w;c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    URL.revokeObjectURL(url);
    cb(c.toDataURL('image/jpeg',0.72));
  };
  img.src=url;
}
function onFace(inp){var f=inp.files&&inp.files[0];if(!f)return;compressPhoto(f,function(d){PHOTO=d;var im=el('facePrev');if(im){im.src=d;im.style.display='block';}});}
function onGov(inp){
  var f=inp.files&&inp.files[0];if(!f)return;
  compressPhoto(f,function(d){
    GOV=d;var im=el('govPrev');if(im){im.src=d;im.style.display='block';}
    readId(d);
  });
}
function onCo(inp){var f=inp.files&&inp.files[0];if(!f)return;compressPhoto(f,function(d){CO=d;var im=el('coPrev');if(im){im.src=d;im.style.display='block';}});}
function readId(data){
  var hint=el('ocrHint');if(hint)hint.textContent='Reading name from photo…';
  if(!window.Tesseract){if(hint)hint.textContent='Type your name if the photo cannot be read.';return;}
  window.Tesseract.recognize(data,'eng').then(function(r){
    OCR=(r&&r.data&&r.data.text)||'';
    var m=OCR.match(/(?:name|naam)\\s*[:\\-]?\\s*([A-Za-z][A-Za-z .']{2,60})/i);
    if(m&&el('nm')&&!el('nm').value)el('nm').value=m[1].trim();
    if(hint)hint.textContent=m?'Name read from photo. Please check it.':'Name not clear — please type it.';
  }).catch(function(){if(hint)hint.textContent='Could not read photo. Please type your name.';});
}
function addItem(){
  var wrap=el('items');var row=document.createElement('div');row.style.marginTop='8px';
  row.innerHTML='<select class="cat"><option>Laptop</option><option>Phone</option><option>Files</option><option>Samples</option><option>Other</option></select><input class="ser" placeholder="Serial (optional)" style="margin-top:6px">';
  wrap.appendChild(row);
}
function collectItems(){
  var rows=el('items').querySelectorAll('div');var out=[];
  for(var i=0;i<rows.length;i++){
    var cat=rows[i].querySelector('.cat');var ser=rows[i].querySelector('.ser');
    out.push({category:cat?cat.value:'Other',serial:ser?ser.value:'',outOk:false});
  }
  return out;
}
function render(v,needCo){
  if(!v){show('<p>This invite link is missing or has expired.</p>');return;}
  if(v.status==='invited'){
    var co=needCo||v.companyIdRequired||(v.visitorCompany&&String(v.visitorCompany).trim());
    show('<p style="color:#94a3b8;margin-bottom:8px">Meeting: <b style="color:#fff">'+h(v.buildingName)+'</b> · '+h(v.visitDate)+'<br>Meet: '+h(v.hostName)+(v.visitorCompany?'<br>Your company on invite: <b style="color:#fff">'+h(v.visitorCompany)+'</b>':'')+'</p>'+
      (co?'<p class="note warn">This invite names a company. Upload your <b>company ID card with your photo</b>. A visiting card is not accepted.</p>':'')+
      '<label>Your name *</label><input id="nm" autocomplete="name">'+
      '<label>Mobile *</label><input id="mob" inputmode="numeric" value="'+h(v.visitorMobile)+'">'+
      '<label>Face photo *</label><input id="ph" type="file" accept="image/*" capture="user" onchange="onFace(this)"><img class="face" id="facePrev" alt="" style="display:none">'+
      '<label>Identity proof *</label><select id="gid"><option value="aadhaar">Aadhaar card</option><option value="dl">Driving Licence</option></select>'+
      '<label>Photo of that card *</label><input id="gov" type="file" accept="image/*" capture="environment" onchange="onGov(this)">'+
      '<p id="ocrHint" style="color:#7dd3fc;font-size:13px;margin-top:6px">The app will read the name from the photo.</p>'+
      '<img class="face" id="govPrev" alt="" style="display:none">'+
      (co?'<label>Company ID card with your photo *</label><input id="coid" type="file" accept="image/*" capture="environment" onchange="onCo(this)"><img class="face" id="coPrev" alt="" style="display:none">':'')+
      '<p style="color:#94a3b8;font-size:13px;margin-top:12px">Items you are carrying</p><div id="items"></div>'+
      '<button type="button" class="btn" style="background:#334155" onclick="addItem()">Add item</button>'+
      '<button type="button" class="btn green" onclick="submitForm('+ (co?'true':'false') +')">Submit visit form</button>'+
      '<div class="msg" id="msg"></div>');
    addItem();
    return;
  }
  if(v.status==='registered'){show('<p>Thank you, <b>'+h(v.visitorName)+'</b>. Please wait at the gate after you arrive.</p>');return;}
  if(v.status==='approved'||v.status==='arrived'){
    var q='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(v.passCode||'');
    show('<p>Show this pass at the gate.</p><div class="pass">'+h(v.passCode)+'</div>'+(v.passCode?'<p style="text-align:center"><img alt="Pass" src="'+q+'" width="200" height="200"></p>':''));
    return;
  }
  show('<p>This visit is closed. Thank you.</p>');
}
function submitForm(needCo){
  var msg=el('msg');
  var name=(el('nm')&&el('nm').value||'').trim();
  var mob=(el('mob')&&el('mob').value||'').trim();
  if(!name){msg.style.display='block';msg.className='msg bad';msg.textContent='Enter your name.';return;}
  if(!PHOTO){msg.style.display='block';msg.className='msg bad';msg.textContent='Add a face photo.';return;}
  if(!GOV){msg.style.display='block';msg.className='msg bad';msg.textContent='Add Aadhaar or Driving Licence photo.';return;}
  if(needCo&&!CO){msg.style.display='block';msg.className='msg bad';msg.textContent='Company ID card with photo is required. Not a visiting card.';return;}
  msg.style.display='block';msg.className='msg ok';msg.textContent='Saving…';
  api({action:'register',visitorName:name,visitorMobile:mob,facePhoto:PHOTO,govIdType:el('gid').value,govIdPhoto:GOV,companyIdPhoto:CO,ocrText:OCR,materials:collectItems()}).then(function(res){
    if(res.s!==200){msg.className='msg bad';msg.textContent=(res.j&&res.j.error)||'Could not save.';return;}
    render(res.j.visit,needCo);
  }).catch(function(){msg.className='msg bad';msg.textContent='Network error.';});
}
if(!TOKEN){show('<p>Open the invite link sent to your mobile.</p>');}
else{
  api({action:'get'}).then(function(res){
    if(res.s!==200){show('<p>'+h((res.j&&res.j.error)||'This invite is no longer open.')+'</p>');return;}
    render(res.j.visit,res.j.companyIdRequired);
  }).catch(function(){show('<p>Network error. Please try again.</p>');});
}
</script>
</body></html>`
