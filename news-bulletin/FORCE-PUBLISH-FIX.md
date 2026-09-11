# Force Publish missing on Pulse Admin — fix

**Checked:** 11 Sep 2026  
**Admin:** https://www.agilegroup-digital.co.in/pulse/admin  
**Status API:** `GET https://www.agilegroup-digital.co.in/api/pulse/cron?job=status`

## What’s broken

1. **WhatsApp Channel + groups did not send** for Morning Edition (page is live; email may have sent).
   - Cron: `published: false`, `groupsSent: 0`, `emailed: true`
   - Echo: `tokenOk: false`, `vercelCron: false`, `wantForce: false`
   - Status: Morning `sent: false`, `channelSent: false`, `groupsSent: 0` (retry window was still open)
2. **Force Publish / Publish now button is not in the Admin UI.**
   - Schedule card only says auto-published — no tap needed.
   - Client `api()` actions present: `load`, `save`, `upload`, `quiz-*` only — **no** publish action and **zero** “Publish” / “Force” strings in the HTML.

Ops docs require Director → Admin OTP → **Publish now**. That control is gone from the deployed page.

## Immediate workaround (Director / Sai — signed in)

1. Open https://www.agilegroup-digital.co.in/pulse/admin and complete OTP.
2. Open browser DevTools → Console.
3. Paste (Morning). Wait for the alert:

```javascript
api('publishNow',{edition:'morning'}).then(function(res){
  alert(res.status+' '+JSON.stringify(res.body));
}).catch(function(e){alert(String(e));});
```

Afternoon / Evening: change `edition` to `'afternoon'` or `'evening'`.

If the API returns an unknown-action error, retry:

```javascript
api('force-publish',{edition:'morning'}).then(function(res){
  alert(res.status+' '+JSON.stringify(res.body));
});
```

## Permanent UI fix (Pulse app source — not in DIGITAL-SUITE)

Pulse deploys from the Command Centre app on Vercel (`agilegroup-digital.co.in`). That source is **not** in the public `DIGITAL-SUITE` tree. Add this block to the **Daily Bulletin Schedule** card on `/pulse/admin` (same file that renders the schedule HTML + `api()` helper).

### HTML (inside the schedule card, after the auto-publish note)

```html
<div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px">
  <button class="btn btn-blue" type="button" onclick="forcePublish('morning')">🚀 Force Publish — Morning</button>
  <button class="btn btn-blue" type="button" onclick="forcePublish('afternoon')">🚀 Force Publish — Afternoon</button>
  <button class="btn btn-blue" type="button" onclick="forcePublish('evening')">🚀 Force Publish — Evening</button>
</div>
<p class="hint" style="margin-top:8px">Use only if Channel / groups did not auto-send. Confirms before blasting.</p>
```

### JS

```javascript
function forcePublish(edition){
  var label=edition==='morning'?'Morning':edition==='afternoon'?'Afternoon':'Evening';
  if(!confirm('Force publish '+label+' edition now to WhatsApp Channel + all groups?')) return;
  var btn=event&&event.target; if(btn){btn.disabled=true;}
  api('publishNow',{edition:edition}).then(function(res){
    if(btn){btn.disabled=false;}
    if(res.status===200){
      var b=res.body||{};
      alert(label+' published.\nChannel: '+(b.channelSent?'yes':(b.published?'yes':'no'))+'\nGroups: '+(b.groupsSent||0));
    } else {
      alert((res.body&&res.body.error)||('Publish failed ('+res.status+')'));
    }
  }).catch(function(e){ if(btn){btn.disabled=false;} alert(String(e)); });
}
```

Backend must accept authenticated `POST /api/pulse/admin-data` with `{ action: "publishNow", edition, sessionToken }` (OTP session for `sai@agilegroup.co.in` / `director@agilegroup.co.in`) and run the same Channel + groups blast as cron on the force path (ignore outside-slot).

## Cron auth (auto + rescue)

Unauthenticated cron calls currently report `tokenOk: false` and do not set `wantForce`. Production needs:

| Env (Vercel) | Purpose |
|--------------|---------|
| `PULSE_CRON_SECRET` | Authorize `/api/pulse/cron` (`Authorization: Bearer …`) |
| `CRON_SECRET` | Vercel Cron header (if used) |

Vercel Cron must send the secret. Without it, `groupsSent` stays `0` even when `autoPublish: true` and the page has news.

## Agent / DIGITAL-SUITE scope

This folder can document status and share packs. It **cannot** patch live `/pulse/admin` until the Pulse source repo is connected to the agent (or `PULSE_CRON_SECRET` is provided for an authenticated force cron call).
