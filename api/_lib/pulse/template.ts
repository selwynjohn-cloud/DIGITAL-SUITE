import { SUITE_TAP_FEEDBACK_CSS } from '../suite-tap-feedback.js'
import { BRAND, BULLETIN_URL, CHANNEL_URL, CURSOR_ATTRIBUTION, JOB_LINKS, QUIZ_AWARENESS_POINTS, QUIZ_CONTEST_RULES } from './config.js'
import type { Bulletin, NewsItem, NewsSection, QuizWinner } from './types.js'
import { weekWinnerHeading } from './quiz.js'

/** Renders the Agile Pulse bulletin as a self-contained HTML page. */

function esc(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function firstLetter(source: string): string {
  const c = source.trim().charAt(0).toUpperCase()
  return /[A-Z]/.test(c) ? c : 'N'
}

function newsCard(item: NewsItem): string {
  const href = item.url && /^https?:\/\//i.test(item.url) ? item.url : '#'
  const hasPhoto = item.imageUrl && /^https?:\/\//i.test(item.imageUrl)
  // The source-letter box is always the background; a real photo overlays it
  // and, if it fails to load, the letter box shows through.
  const photo = hasPhoto
    ? `<img src="${esc(item.imageUrl)}" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:8px;">`
    : ''
  return `<a href="${esc(href)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;display:flex;gap:12px;padding:12px;background:#ffffff;border-radius:10px;margin-bottom:8px;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
<div style="flex-shrink:0;"><div style="position:relative;width:100px;height:70px;background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:800;overflow:hidden;">${esc(firstLetter(item.source))}${photo}</div><div style="font-size:9px;color:#6b7280;margin-top:2px;text-align:center;max-width:100px;line-height:1.2;">${esc(item.source)} · ${esc(item.time)}</div></div>
<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:700;color:#111827;line-height:1.5;">${esc(item.title)}</div>
<div style="font-size:10px;color:#9ca3af;margin-top:4px;">📡 ${esc(item.source)} · ⏰ ${esc(item.time)}</div></div></a>`
}

function newsSection(section: NewsSection): string {
  const cards =
    section.items.length > 0
      ? section.items.map(newsCard).join('')
      : `<div style="padding:12px;background:#fff;border-radius:10px;border:1px dashed #e5e7eb;font-size:13px;color:#9ca3af;text-align:center;">No fresh updates in this category right now.</div>`
  return `<div style="margin-bottom:20px;"><div style="font-size:14px;font-weight:700;color:#ffffff;margin-bottom:10px;padding:9px 14px;background:${esc(section.headerBg)};border-radius:10px;text-align:center;">${esc(section.emoji)} ${esc(section.title)}<br><span style="font-size:11px;font-weight:400;opacity:0.9;">${esc(section.titleHindi)}</span></div>${cards}</div>`
}

function weatherBlock(b: Bulletin): string {
  const ticker = b.weather.cities
    .filter((c) => c.tempC !== null)
    .map((c) => `${esc(c.name)}: ${esc(c.tempC)}°C`)
    .join(' ◆ ')
  return `<div style="margin-bottom:20px;"><div style="font-size:14px;font-weight:700;color:#ffffff;margin-bottom:10px;padding:9px 14px;background:#0d9488;border-radius:10px;text-align:center;">⛈ Weather Report (IMD) — India<br><span style="font-size:11px;font-weight:400;opacity:0.9;">मौसम रिपोर्ट — भारत | Source: mausam.imd.gov.in</span></div><div style="background:linear-gradient(135deg,#0d9488,#065f46);display:flex;align-items:center;overflow:hidden;height:32px;margin-top:10px;border-radius:6px;"><div style="background:#fbbf24;color:#7f1d1d;font-size:10px;font-weight:800;padding:0 12px;white-space:nowrap;height:100%;display:flex;align-items:center;flex-shrink:0;letter-spacing:1px;">🌡 TEMP</div><div style="overflow:hidden;flex:1;"><div style="display:inline-block;white-space:nowrap;color:#ffffff;font-size:12px;font-weight:600;animation:scroll-ticker 80s linear infinite;padding-left:100%;">${ticker}</div></div></div><div style="padding:8px 12px;margin-top:8px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;font-size:12px;color:#991b1b;font-weight:600;line-height:1.5;">🚨 IMD Alert: ${esc(b.weather.alertText)}</div></div>`
}

function youtubeId(url: string): string {
  const u = url.trim()
  const m =
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i.exec(u)
  return m?.[1] ?? ''
}

function driveFileId(url: string): string {
  const m = /drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/i.exec(url.trim())
  return m?.[1] ?? ''
}

function eventVideoHtml(raw: string): string {
  const url = raw.trim()
  if (!url) return ''
  const yt = youtubeId(url)
  if (yt) {
    return `<div style="margin-top:10px;border-radius:8px;overflow:hidden;border:1px solid #3b82f6;background:#000;"><iframe src="https://www.youtube.com/embed/${esc(yt)}" title="Agile News video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;display:block;"></iframe></div>`
  }
  const drive = driveFileId(url)
  if (drive) {
    return `<div style="margin-top:10px;border-radius:8px;overflow:hidden;border:1px solid #3b82f6;background:#000;"><iframe src="https://drive.google.com/file/d/${esc(drive)}/preview" title="Agile News video" allow="autoplay" allowfullscreen style="width:100%;aspect-ratio:16/9;border:0;display:block;"></iframe></div>`
  }
  if (/\.mp4(\?|#|$)/i.test(url)) {
    const caption =
      url.includes('independence-day-2026')
        ? `<div style="margin:12px 0 8px;font-size:15px;font-weight:800;color:#1e3a8a;line-height:1.4;">Independance day celebration in AIG Hospital, Hyderabad</div>`
        : ''
    return `${caption}<div style="border-radius:8px;overflow:hidden;border:1px solid #3b82f6;background:#f8fafc;"><video src="${esc(url)}" controls playsinline preload="metadata" style="width:100%;display:block;filter:brightness(1.22) contrast(1.04) saturate(1.06);background:#f1f5f9;"></video></div>`
  }
  return `<div style="margin-top:8px;"><a href="${esc(url)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#1d4ed8;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">▶ Watch Video</a></div>`
}

function eventsBlock(b: Bulletin): string {
  if (b.editorial.events.length === 0) return ''
  const items = b.editorial.events
    .map((ev) => {
      const heading = ev.heading
        ? `<div style="font-size:15px;font-weight:800;color:#1e3a8a;margin-bottom:4px;">${esc(ev.heading)}</div>`
        : ''
      const text = ev.text
        ? `<div style="font-size:13px;color:#1e293b;line-height:1.5;white-space:pre-wrap;">${esc(ev.text)}</div>`
        : ''
      const image = ev.imageUrl
        ? `<div style="margin-top:10px;width:100%;border-radius:8px;border:1px solid #3b82f6;overflow:hidden;background:#eff6ff;"><img src="${esc(ev.imageUrl)}" alt="Agile News" style="width:100%;height:auto;display:block;vertical-align:top;"></div>`
        : ''
      const video = eventVideoHtml(ev.videoUrl)
      return `<div style="padding:12px 14px;background:#fff;border-radius:10px;border:1px solid #bfdbfe;margin-bottom:8px;">${heading}${text}${image}${video}</div>`
    })
    .join('')
  return `<div style="margin-bottom:20px;"><div style="font-size:14px;font-weight:800;color:#ffffff;margin-bottom:10px;padding:12px 16px;background:linear-gradient(135deg,#1d4ed8,#1e40af);border-radius:10px;text-align:center;letter-spacing:0.5px;box-shadow:0 3px 10px rgba(29,78,216,0.4);">🏢 Agile News &amp; Events / एजाइल समाचार</div><div style="padding:10px;background:#eff6ff;border-radius:10px;border:2px solid #3b82f6;">${items}</div></div>`
}

function jobBlock(b: Bulletin): string {
  const images = b.editorial.jobImages
    .filter(Boolean)
    .map(
      (src) =>
        `<div style="margin-bottom:10px;"><img src="${esc(src)}" alt="Job Posting" style="width:100%;max-height:340px;object-fit:contain;border-radius:8px;"></div>`,
    )
    .join('')
  return `<div style="margin-bottom:20px;"><div style="font-size:16px;font-weight:800;color:#ffffff;margin-bottom:10px;padding:14px 20px;background:linear-gradient(135deg,#1d4ed8,#1e40af);border-radius:10px;text-align:center;letter-spacing:0.5px;box-shadow:0 3px 10px rgba(29,78,216,0.4);">📢 Agile Group - Job Posting / एजाइल ग्रुप कार्यक्रम</div><div style="padding:12px 20px;background:#fef2f2;border-radius:10px;border:2px solid #ef4444;text-align:center;margin-bottom:10px;"><div style="font-size:15px;font-weight:800;color:#dc2626;">💼 For Immediate Employment Register in</div><a href="${esc(JOB_LINKS.registerUrl)}" target="_blank" rel="noopener" style="font-size:17px;font-weight:800;color:#1d4ed8;text-decoration:underline;">${esc(JOB_LINKS.registerLabel)}</a></div><div style="padding:16px;background:#eff6ff;border-radius:10px;border:2px solid #3b82f6;text-align:center;">${images}<a href="${esc(JOB_LINKS.applyUrl)}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;font-weight:700;border-radius:10px;text-decoration:none;font-size:15px;box-shadow:0 4px 12px rgba(220,38,38,0.3);">👉 Apply Now / आवेदन करें</a></div></div>`
}

function guardsBlock(b: Bulletin): string {
  if (b.editorial.guards.length === 0) return ''
  const rows = b.editorial.guards
    .map((g) => {
      const photo = g.photoUrl
        ? `<img src="${esc(g.photoUrl)}" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:3px solid #fbbf24;flex-shrink:0;">`
        : `<div style="width:80px;height:80px;border-radius:50%;border:3px solid #fbbf24;background:#fde68a;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#92400e;flex-shrink:0;">${esc(firstLetter(g.name.replace(/^(mr|ms|mrs)\.?\s*/i, '')))}</div>`
      const site = [g.clientName, g.location].filter(Boolean).map(esc).join(' · ')
      const siteLine = site
        ? `<div style="font-size:11px;color:#b45309;font-weight:700;margin-top:1px;">${site}</div>`
        : ''
      return `<div style="display:flex;align-items:flex-start;gap:12px;padding:10px;background:#fff;border-radius:8px;margin-bottom:6px;border:1px solid #fde68a;">${photo}<div><div style="font-size:14px;font-weight:800;color:#92400e;">${esc(g.name)}${g.guardId ? ` — ID: ${esc(g.guardId)}` : ''}</div>${siteLine}<div style="font-size:12px;color:#78350f;line-height:1.4;margin-top:3px;white-space:pre-wrap;">${esc(g.citation)}</div></div></div>`
    })
    .join('')
  return `<div style="margin-bottom:20px;"><div style="font-size:14px;font-weight:800;color:#ffffff;margin-bottom:10px;padding:12px 16px;background:linear-gradient(135deg,#d97706,#b45309);border-radius:10px;text-align:center;">🏆 Guards Appreciation for the Week</div><div style="padding:10px;background:#fffbeb;border-radius:10px;border:2px solid #f59e0b;">${rows}</div></div>`
}

function quizBlock(_b: Bulletin): string {
  const rules = QUIZ_CONTEST_RULES.map(
    (r, i) =>
      `<div style="font-size:13px;color:#1e293b;line-height:1.5;margin:0 0 6px"><b>${i + 1}.</b> ${esc(r)}</div>`,
  ).join('')
  return `<div style="margin-bottom:20px;">
<div style="font-size:14px;font-weight:800;color:#ffffff;margin-bottom:10px;padding:12px 16px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:10px;text-align:center;letter-spacing:0.5px;box-shadow:0 3px 10px rgba(109,40,217,0.4);">🧠 The Security Brief — Question of the Day</div>
<div id="pqBox" style="padding:16px;background:#ffffff;border-radius:10px;border:2px solid #8b5cf6;">
<div id="pqLoad" style="color:#64748b;font-size:14px;">Loading today's question…</div>
</div></div>
<script>
(function(){
  var CH=${JSON.stringify(CHANNEL_URL)};
  var RULES=${JSON.stringify(rules)};
  var box=document.getElementById('pqBox');
  var cur=null;
  var locked=false;
  function E(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function optHtml(o){return '<div class="pqOpt" data-k="'+E(o.key)+'" style="cursor:pointer;padding:12px 16px;margin-bottom:8px;border-radius:10px;border:2px solid #d1d5db;background:#f9fafb;font-size:14px;color:#1e293b;"><b style="color:#2563eb;">'+E(o.key)+'.</b> '+E(o.text)+'</div>';}
  function lockOpts(){ var nodes=box.querySelectorAll('.pqOpt'); for(var i=0;i<nodes.length;i++){nodes[i].style.pointerEvents='none';} locked=true; }
  function showMsg(ok, html){
    var msg=document.getElementById('pqMsg'); if(!msg) return;
    msg.style.display='block';
    msg.style.background=ok?'#dcfce7':'#fef2f2';
    msg.style.color=ok?'#166534':'#991b1b';
    msg.innerHTML=html;
  }
  function details(){
    var name=(document.getElementById('pqName')||{}).value||'';
    var agile=document.getElementById('pqAgile');
    var agileOn=agile&&agile.checked;
    var gid=agileOn?((document.getElementById('pqGid')||{}).value||''):'';
    var mob=(document.getElementById('pqMob')||{}).value||'';
    return {name:name, agileOn:agileOn, gid:gid, mob:mob};
  }
  function onPick(e){
    if(locked) return;
    var d=details();
    if(!d.name.trim() || d.mob.replace(/\\D/g,'').length<10){ showMsg(false,'Please enter your name and a 10-digit mobile number first. Then tap your one answer.'); return; }
    if(d.agileOn && d.gid.replace(/\\D/g,'').length<4){ showMsg(false,'Please enter your Agile Guard ID No.'); return; }
    var node=e.currentTarget; var k=node.getAttribute('data-k');
    lockOpts();
    var payload={id:cur.id,key:k,name:d.name,mobile:d.mob};
    if(d.agileOn&&d.gid.trim()) payload.guardId=d.gid;
    fetch('/api/pulse/quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(res){
        if(res.error && !res.alreadyAttempted && res.correct==null){ locked=false; var nodes=box.querySelectorAll('.pqOpt'); for(var i=0;i<nodes.length;i++){nodes[i].style.pointerEvents='auto';} showMsg(false,E(res.error)); return; }
        if(res.alreadyAttempted){
          node.style.background='#fef3c7'; node.style.borderColor='#d97706';
          showMsg(false,'You have already used your one attempt today. Come back tomorrow. To win you must play all 7 days, Sunday to Saturday, with the correct first answer each day.');
          return;
        }
        if(res.correct){
          node.style.background='#dcfce7'; node.style.borderColor='#22c55e';
          var dayLine=res.qualified
            ? 'You have completed all 7 days this week. You are in Sunday\\'s lucky draw.'
            : 'You are marked for today. Come back every day Sunday to Saturday.';
          showMsg(true,'🎉 <b>Correct Answer, Appreciations.</b> 👏 Leaders are built through knowledge.<br><br>💡 <i>'+E(res.explanation)+'</i><br><br>✅ '+dayLine+' <a href="'+CH+'" target="_blank" rel="noopener" style="color:#16a34a;font-weight:800">Follow our Channel</a>');
        } else {
          node.style.background='#fef2f2'; node.style.borderColor='#ef4444';
          showMsg(false,'That was your only attempt today and it was not correct. You cannot try again today. To win you must give the correct first answer every day, Sunday to Saturday.');
        }
      }).catch(function(){ locked=false; var nodes=box.querySelectorAll('.pqOpt'); for(var i=0;i<nodes.length;i++){nodes[i].style.pointerEvents='auto';} showMsg(false,'Network error. Please tap your answer once more.'); });
  }
  function render(q){
    cur=q; locked=false;
    var img=q.imageUrl?'<img src="'+E(q.imageUrl)+'" style="width:100%;max-height:220px;object-fit:contain;border-radius:8px;margin-bottom:10px;">':'';
    var opts=(q.options||[]).map(optHtml).join('');
    box.innerHTML='<div style="padding:12px;background:#fffbeb;border:2px solid #f59e0b;border-radius:8px;margin-bottom:12px"><div style="font-size:14px;font-weight:800;color:#92400e;margin-bottom:8px;text-align:center">How to win this week</div>'+RULES+'</div>'+
      '<input id="pqName" placeholder="Your Name" style="width:100%;padding:9px 11px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:6px;font-size:16px;box-sizing:border-box;">'+
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#5b21b6;margin:8px 0;cursor:pointer"><input type="checkbox" id="pqAgile" style="width:18px;height:18px"> I am an Agile Guard</label>'+
      '<div id="pqGuardWrap" style="display:none;margin-bottom:6px">'+
      '<input id="pqGid" placeholder="Agile Guard ID No." inputmode="numeric" style="width:100%;padding:9px 11px;border:1px solid #c4b5fd;border-radius:8px;font-size:16px;box-sizing:border-box;background:#f5f3ff"></div>'+
      '<input id="pqMob" placeholder="Mobile Number (WhatsApp only — never shown publicly)" inputmode="numeric" style="width:100%;padding:9px 11px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px;font-size:16px;box-sizing:border-box;">'+
      img+'<div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:8px;line-height:1.5;">'+E(q.question)+'</div>'+
      '<div style="font-size:13px;font-weight:800;color:#2563eb;margin-bottom:12px;">Fill your name and mobile, then tap your one answer. You cannot change it.</div>'+
      opts+'<div id="pqMsg" style="display:none;padding:12px;border-radius:8px;margin-top:10px;font-size:13px;line-height:1.6;"></div>';
    var agile=document.getElementById('pqAgile');
    var wrap=document.getElementById('pqGuardWrap');
    if(agile&&wrap) agile.addEventListener('change',function(){ wrap.style.display=agile.checked?'block':'none'; });
    var nodes=box.querySelectorAll('.pqOpt'); for(var i=0;i<nodes.length;i++){nodes[i].addEventListener('click',onPick);}
  }
  fetch('/api/pulse/quiz').then(function(r){return r.json();}).then(function(q){
    if(q && q.question){ render(q); } else { box.innerHTML='<div style="color:#64748b;">Question will appear soon.</div>'; }
  }).catch(function(){ box.innerHTML='<div style="color:#64748b;">Question will appear soon.</div>'; });
})();
</script>`
}

function awarenessBlock(): string {
  const items = QUIZ_AWARENESS_POINTS.map(
    (p) =>
      `<div style="font-size:13px;color:#1e293b;line-height:1.55;margin:0 0 8px;padding-left:2px;">⚬ ${esc(p)}</div>`,
  ).join('')
  return `<div style="margin-bottom:20px;padding:12px 14px;background:#f5f3ff;border-radius:10px;border:2px solid #8b5cf6;">
<div style="font-size:14px;font-weight:800;color:#5b21b6;margin-bottom:8px;">🧠 Security Question of the Day — for everyone</div>
${items}
</div>`
}

function winnersBlock(b: Bulletin): string {
  const live = (b.winners || []).filter((w) => !w.noWinner)
  const none = (b.winners || []).find((w) => w.noWinner)
  const week = live[0]?.weekKey || none?.weekKey || ''
  const heading = week ? weekWinnerHeading(week, live.length || 1) : 'Winner for the Week number-00'
  let list: string
  if (none && !live.length) {
    list = `<div style="padding:8px 10px;background:#fff;border-radius:8px;border:1px solid #d1d5db;font-size:13px;color:#6b7280;font-weight:600;">📋 ${esc(heading)} — <b>No winner this week</b> (no one completed all 7 days)</div>`
  } else if (live.length) {
    const gift = live.length > 1 ? 'Gift coupon is sent to the winners.' : 'Gift coupon is sent to the winner.'
    list = live
      .map((w) => {
        const weekNo = weekWinnerHeading(w.weekKey || week, 1).replace(/^Winner for the /, '')
        const code = w.couponCode ? ` — Code: <b>${esc(w.couponCode)}</b>` : ''
        return `<div style="padding:8px 10px;background:#fff;border-radius:8px;border:1px solid #fde68a;font-size:13px;color:#92400e;font-weight:700;margin-bottom:6px;text-align:center;">🏅 <b>${esc(w.name)}</b> — ${esc(weekNo)}${code}</div>`
      })
      .join('') + `<div style="font-size:13px;color:#166534;font-weight:700;margin-top:4px;text-align:center;">${esc(gift)}</div>`
  } else {
    list = `<div style="padding:8px 10px;background:#fff;border-radius:8px;border:1px dashed #fcd34d;font-size:13px;color:#92400e;">Play all 7 days (Sunday to Saturday). First answer must be correct. Two lucky winners every <b>Sunday morning</b>.</div>`
  }
  return `${awarenessBlock()}<div style="margin-bottom:20px;"><div style="font-size:14px;font-weight:800;color:#ffffff;margin-bottom:10px;padding:12px 16px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:10px;text-align:center;">🏆 ${esc(heading)}</div><div style="padding:10px;background:#fffbeb;border-radius:10px;border:2px solid #f59e0b;text-align:center;">${list}</div></div>
<div style="margin-bottom:20px;padding:12px 14px;background:#eff6ff;border-radius:10px;border:2px solid #3b82f6;text-align:center;font-size:14px;color:#1e3a8a;font-weight:700;">💼 Immediate FREE Job Registration — <a href="${esc(JOB_LINKS.registerUrl)}" target="_blank" rel="noopener" style="color:#1d4ed8;font-weight:800;">SecurityJob.co.in</a></div>`
}

function headerBlock(b: Bulletin): string {
  const logo = BRAND.logoUrl
    ? `<img src="${esc(BRAND.logoUrl)}" alt="Agile" style="height:60px;margin-bottom:8px;filter:brightness(1.1);">`
    : ''
  return `<div style="text-align:center;padding:20px 16px;background:linear-gradient(135deg,#1d4ed8,#1e3a8a);border-radius:14px;margin-bottom:16px;box-shadow:0 4px 12px rgba(29,78,216,0.3);">${logo}<div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">${esc(BRAND.companyName)}</div><div style="font-size:12px;color:#93c5fd;margin-top:4px;"><a href="${esc(BRAND.website)}" style="color:#93c5fd;text-decoration:none;">${esc(BRAND.websiteLabel)}</a></div><div style="margin-top:10px;padding:8px 16px;background:rgba(255,255,255,0.15);border-radius:8px;display:inline-block;"><div style="font-size:16px;font-weight:800;color:#ffffff;letter-spacing:0.4px;">SECURITY NEWS - AGILE GROUP</div><div style="font-size:12px;color:#fecaca;margin-top:3px;">Date: ${esc(b.dateLabel)} · Edition: ${esc(b.editionLabel)}</div></div></div>`
}

function shareBlock(b: Bulletin): string {
  const headline = b.flashHeadlines[0] || 'Today’s security, traffic & weather updates'
  const payload = {
    title: 'SECURITY NEWS - AGILE GROUP',
    text:
      `📰 Security News – Agile Group\n` +
      `🗓️ ${b.dateLabel} · ${b.editionLabel}\n` +
      `🔴 ${headline}\n` +
      `👉 ${BULLETIN_URL}`,
    url: BULLETIN_URL,
  }
  return `<div style="margin:0 0 14px;text-align:center">
<button type="button" id="pulseShare" class="btn">Share</button>
<div id="pulseShareMsg" style="display:none;margin-top:8px;font-size:13px;color:#166534;font-weight:600"></div>
</div>
<script>
(function(){
  var btn=document.getElementById('pulseShare');
  var note=document.getElementById('pulseShareMsg');
  if(!btn) return;
  var p=${JSON.stringify(payload)};
  btn.addEventListener('click',function(){
    function shown(t){ if(note){ note.style.display='block'; note.textContent=t; } }
    if(navigator.share){
      navigator.share({title:p.title,text:p.text,url:p.url}).then(function(){ shown('Shared.'); }).catch(function(){});
      return;
    }
    window.open('https://wa.me/?text='+encodeURIComponent(p.text),'_blank');
    shown('WhatsApp is open — pick who to send.');
  });
})();
</script>`
}

function flashBlock(b: Bulletin): string {
  const text =
    b.flashHeadlines.length > 0
      ? b.flashHeadlines.map(esc).join(' ◆ ')
      : 'Agile Security Force — Stay alert, stay safe.'
  return `<div style="background:linear-gradient(135deg,#1d4ed8,#1e3a8a);border-top:2px solid #c9a84c;border-bottom:2px solid #c9a84c;display:flex;align-items:center;overflow:hidden;height:36px;margin-bottom:12px;border-radius:6px;box-shadow:0 2px 8px rgba(29,78,216,0.3);"><div style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a1628;font-size:11px;font-weight:800;padding:0 14px;white-space:nowrap;height:100%;display:flex;align-items:center;flex-shrink:0;letter-spacing:1.5px;text-transform:uppercase;">⚡ Flash</div><div style="overflow:hidden;flex:1;"><div style="display:inline-block;white-space:nowrap;color:#ffffff;font-size:13px;font-weight:600;animation:scroll-ticker 30s linear infinite;padding-left:100%;">${text}</div></div></div>`
}

function footerBlock(): string {
  return `<div style="text-align:center;padding:20px 16px;background:linear-gradient(135deg,#1d4ed8,#1e3a8a);border-radius:14px;margin-top:8px;box-shadow:0 4px 12px rgba(29,78,216,0.3);border-top:2px solid #c9a84c;"><div style="font-size:14px;color:#ffffff;font-weight:700;">${esc(BRAND.companyName)}</div><div style="margin-top:10px;font-size:13px;"><a href="${esc(BRAND.website)}" style="color:#fde68a;text-decoration:none;font-weight:700">${esc(BRAND.websiteLabel)}</a></div><div style="margin-top:14px;padding:10px 12px;background:rgba(255,255,255,0.08);border-radius:8px;font-size:12px;color:#dbeafe;line-height:1.6;font-style:italic;">${esc(CURSOR_ATTRIBUTION)}</div><div style="margin-top:10px;font-size:13px;color:#eff6ff;font-weight:600;">💼 <a href="${esc(JOB_LINKS.registerUrl)}" style="color:#fde68a;text-decoration:none;font-weight:800">${esc(JOB_LINKS.registerLabel)}</a></div><div style="margin-top:6px;font-size:14px;color:#ffffff;font-weight:700;">© ${new Date().getFullYear()} Agile Security Force Private Limited.</div></div>`
}

export function renderBulletin(b: Bulletin): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SECURITY NEWS - AGILE GROUP ${esc(b.dateLabel)}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Agile Security Force">
<meta property="og:title" content="SECURITY NEWS - AGILE GROUP">
<meta property="og:description" content="Flash News • Traffic Advisory • Weather & IMD Alerts • Security Job Postings • Security Question of the Day.">
<meta property="og:image" content="https://www.agilegroup-digital.co.in/news-assets/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://www.agilegroup-digital.co.in/pulse">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="SECURITY NEWS - AGILE GROUP">
<meta name="twitter:description" content="Flash News • Traffic • Weather • Security Jobs • Question of the Day.">
<meta name="twitter:image" content="https://www.agilegroup-digital.co.in/news-assets/og-card.png">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f3f4f6;color:#1f2937}.c{max-width:600px;margin:0 auto;padding:12px}@keyframes scroll-ticker{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}a{word-break:break-word}
#pulseShare{width:100%;padding:16px 18px;border:0;border-radius:12px;background:#16a34a;color:#fff;font-size:18px;font-weight:800;cursor:pointer}
${SUITE_TAP_FEEDBACK_CSS}</style></head><body><div class="c">
${headerBlock(b)}
${shareBlock(b)}
${flashBlock(b)}
${b.sections.map(newsSection).join('\n')}
${weatherBlock(b)}
${eventsBlock(b)}
${jobBlock(b)}
${guardsBlock(b)}
${quizBlock(b)}
${winnersBlock(b)}
${footerBlock()}
</div></body></html>`
}
