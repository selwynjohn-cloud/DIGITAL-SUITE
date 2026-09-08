/** Agile Live chat shell — phone-first (Android), WhatsApp-style list. */

export const LIVE_LOGO = '/agile-logo.png'
export const LIVE_LOGO_CLEAR = '/agile-logo-clear.png'

export function liveLogoImg(className = 'live-logo'): string {
  return `<img class="${className}" src="${LIVE_LOGO_CLEAR}" alt="Agile" onerror="this.onerror=null;this.src='${LIVE_LOGO}'">`
}

export function liveAvatarImg(className = 'live-av'): string {
  return `<img class="${className}" src="${LIVE_LOGO}" alt="">`
}

export function liveOpsIcon(): string {
  return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 13h6v6H4v-6zm10 0h6v6h-6v-6z"/></svg>`
}

/** Phone-first. Laptop two-column only from 1100px. */
export const LIVE_SHELL_CSS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;height:100dvh;background:#071018;color:#f1f5f9;font-family:Roboto,'Noto Sans','Noto Sans Telugu','Noto Sans Tamil','Noto Sans Malayalam','Noto Sans Kannada','Noto Sans Oriya','Noto Nastaliq Urdu','Segoe UI',system-ui,sans-serif}
body{display:flex;flex-direction:column;overflow:hidden}
.hidden{display:none!important}
.live-fill{flex:1;min-height:0;display:flex;flex-direction:column}
.live-desk{flex:1;min-height:0;display:flex;flex-direction:column}
.live-side{flex:1;min-height:0;display:flex;flex-direction:column;background:#071018}
.live-head{
  flex:none;display:flex;align-items:flex-start;gap:10px;
  padding:calc(10px + env(safe-area-inset-top)) 12px 12px;
  background:linear-gradient(135deg,#14224f,#0f766e);
  border-bottom:3px solid #c9a84c;
}
.live-crest{
  flex:none;width:104px;height:104px;border-radius:50%;
  display:grid;place-items:center;
  background:rgba(255,255,255,.22);border:3px solid #c9a84c;padding:4px
}
.live-head .live-logo,.live-crest .live-logo{height:88px;width:auto;background:transparent;margin:0;flex:none;display:block}
.live-me{min-width:0;flex:1}
.live-me .live-nm,.live-me b.live-nm{display:block;font-size:18px;line-height:1.2;letter-spacing:-.02em;font-style:normal}
.live-me .live-id,.live-me .live-desig,.live-me .live-card,.live-me .live-br,.live-me span{
  display:block;font-size:13px;color:#fde68a;font-weight:800;margin-top:3px;line-height:1.3
}
.live-card-pick{display:block;margin-top:6px;color:#fde68a;font-size:12px;font-weight:800}
.live-card-pick input[type=date]{margin-top:4px;min-height:44px;background:#071018;color:#f1f5f9;border:1px solid #c9a84c}
.live-head-btn{flex:none;margin-top:4px;min-height:44px;padding:8px 12px}
.live-who{display:block;font-size:13px;font-style:normal;font-weight:800;color:#e2e8f0;margin-top:3px}
.live-times{flex:none;margin:0;padding:8px 12px;background:#0c1a24;border-bottom:1px solid #1e293b;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 10px;text-align:center}
.live-times p{margin:0;font-size:13px;font-weight:800;line-height:1.35;text-align:center;width:100%}
.live-times.one-line p{width:auto}
.live-times.one-line{flex-wrap:nowrap;justify-content:center}
.live-times .muted{font-weight:700}
.live-how{background:#132033;border-radius:12px;padding:10px 12px;margin:8px 0;font-size:13px;line-height:1.45;color:#cbd5e1}
.live-how b{color:#fde68a}
.live-cal .d{cursor:pointer}
.live-cal .d.pick{outline:2px solid #22c55e}
.reliever{display:flex;align-items:center;gap:10px;margin:10px 0;font-size:15px;font-weight:800}
.reliever input{width:22px;height:22px;min-height:22px;flex:none}
.live-ico{
  width:40px;height:40px;border:none;border-radius:50%;
  background:rgba(255,255,255,.14);color:#fff;
  display:grid;place-items:center;cursor:pointer;padding:0;flex:none
}
.live-ico:active{filter:brightness(.88)}
.live-head-actions{flex:none;display:flex;flex-direction:column;gap:8px;align-items:center;margin-top:4px}
.live-back-login{font-size:30px;font-weight:800;line-height:1;width:44px;height:44px}
.live-week{flex:none;margin:0 12px 8px;padding:12px 14px;background:#0c1a24;border:1px solid #1e293b;border-radius:14px}
.live-week b{display:block;color:#fde68a;font-size:14px;margin:0 0 6px}
.live-week .week-today{margin:0 0 8px;font-size:15px;font-weight:800;line-height:1.35;color:#f1f5f9}
.live-week-days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.live-week-days span{display:block;text-align:center;font-size:11px;font-weight:800;padding:6px 0;border-radius:8px;background:#132033;color:#94a3b8}
.live-week-days span.on{background:#14532d;color:#bbf7d0}
.live-week-days span.off{background:#7f1d1d;color:#fecaca}
.live-week-days span.extra{background:#854d0e;color:#fde68a}
#offExtraBox label{display:block;margin:8px 0 4px;color:#94a3b8;font-size:13px;font-weight:800}
.live-week-days span.today{outline:2px solid #c9a84c}
.live-week-list{max-height:220px;overflow:auto;-webkit-overflow-scrolling:touch}
.live-ops-phone{flex:none;margin:0 12px 8px;max-height:52vh;overflow:auto;-webkit-overflow-scrolling:touch}
.live-ops-phone .card{margin-bottom:8px}
.live-ops-phone .month-row{font-size:16px;line-height:1.4}
.live-ops-phone .month-row .btn{display:inline-block;width:auto;margin:6px 0 0;padding:8px 12px}
.live-ops-deploy{display:flex;flex-direction:column;gap:8px}
.live-ops-phone .live-ops-contacts{border:2px solid #c9a84c;background:#102033;margin-top:4px}
.live-ops-contacts > h3{font-size:18px}
.live-ops-group{margin-top:14px;padding-top:12px;border-top:1px solid #334155}
.live-ops-group h3{font-size:16px;color:#e2e8f0}
.live-ops-shift,.ops-unit{margin:10px 0 4px;font-size:15px;font-weight:800;color:#fde68a}
.ops-unit{margin-top:14px;color:#f1f5f9}
#ops .live-ops-phone{max-height:none;margin:0 0 12px}
.live-week-list .month-row{padding:8px 0}
.live-search{flex:none;padding:10px 12px;background:#071018}
.live-search input,.live-search select{
  width:100%;border:none;border-radius:24px;background:#132033;color:#f1f5f9;
  padding:14px 16px;font-size:16px;font-family:inherit;min-height:48px
}
.live-search input::placeholder{color:#94a3b8}
.live-tab{flex:1;min-height:0;display:flex;flex-direction:column}
.live-tab.hidden{display:none!important}
.live-tab-body{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:12px 14px}
.live-subfoot{
  flex:none;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:6px;
  background:#0c1a24;border-top:1px solid #1e293b;padding:8px 8px 4px
}
.live-subfoot button{
  border:none;border-radius:12px;background:#132033;color:#e2e8f0;cursor:pointer;font-family:inherit;
  font-size:13px;font-weight:800;min-height:44px;padding:8px 6px;line-height:1.2
}
.live-subfoot button.on{background:#14532d;color:#bbf7d0}
.live-foot{
  flex:none;display:grid;grid-template-columns:repeat(4,1fr);
  background:#071018;border-top:1px solid #1e293b;
  padding:6px 4px calc(8px + env(safe-area-inset-bottom))
}
.live-foot button{
  border:none;background:transparent;color:#94a3b8;cursor:pointer;font-family:inherit;
  font-size:12px;font-weight:800;min-height:58px;padding:4px 2px;line-height:1.15;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px
}
.live-foot button svg{display:block}
.live-foot button.on{color:#fde68a}
.live-split{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.live-split .btn{text-align:center;text-decoration:none}
.live-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:8px 0}
.live-cal .dow{text-align:center;font-size:10px;font-weight:800;color:#94a3b8;padding:2px 0}
.live-cal .d{
  text-align:center;font-size:12px;font-weight:800;padding:8px 0;border-radius:8px;
  background:#132033;color:#94a3b8;border:none;width:100%;font-family:inherit;cursor:default
}
.live-cal .d.duty,.live-cal .d.ot{background:#16a34a;color:#ecfccb}
.live-cal .d.off{background:#c9a84c;color:#14224f}
.live-cal .d.absent{background:#dc2626;color:#fee2e2}
.live-cal .d.future{background:#0c1a24;color:#64748b}
.live-cal .d.today{outline:2px solid #fde68a}
.live-cal-leg{
  display:flex;flex-wrap:nowrap;justify-content:center;align-items:center;gap:18px;
  margin:8px 0 0;font-size:12px;font-weight:800;color:#e2e8f0
}
.live-cal-leg span{flex:none;text-align:center;white-space:nowrap}
.live-cal-leg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px}
.live-cal-leg .duty{background:#16a34a}
.live-cal-leg .off{background:#c9a84c}
.live-cal-leg .absent{background:#dc2626}
.dash-rounds{display:flex;justify-content:center;align-items:center;gap:12px;margin:12px 0 4px}
.dash-round{
  width:84px;height:84px;flex:none;
  border-radius:50%;background:#071018;border:2px solid #c9a84c;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:6px
}
.dash-round b{display:block;font-size:14px;line-height:1.1;color:#fde68a}
.dash-round span{display:block;font-size:10px;color:#94a3b8;margin-top:3px;font-weight:800;line-height:1.15}
.dash-round.on{border-color:#16a34a;background:#052e16}
.dash-round.warn{border-color:#dc2626;background:#450a0a}
.dash-round.ok{border-color:#16a34a}
.live-list{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;background:#071018}
.live-row{
  display:flex;align-items:center;gap:14px;width:100%;
  min-height:76px;padding:12px 14px;border:none;border-bottom:1px solid #122033;
  background:transparent;color:inherit;text-align:left;cursor:pointer;font-family:inherit;
  text-decoration:none
}
.live-row.on{background:#123044}
.live-row:active{background:#1a3a4a}
.live-av{width:56px;height:56px;border-radius:50%;object-fit:cover;background:#111;flex:none;border:2px solid #c9a84c}
.live-row-mid{min-width:0;flex:1}
.live-row-top{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.live-num{font-size:17px;font-weight:800;letter-spacing:.03em}
.live-time{font-size:12px;color:#5eead4;flex:none;font-weight:700}
.live-row-sub{display:flex;justify-content:space-between;gap:8px;margin-top:3px}
.live-sub{font-size:14px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.live-role{font-size:12px;font-weight:800;color:#c9a84c;flex:none}
.live-main{flex:1;min-height:0;display:flex;flex-direction:column;background:#071018}
.live-chat-bar{
  flex:none;display:flex;align-items:center;gap:10px;
  padding:calc(8px + env(safe-area-inset-top)) 10px 10px;
  background:linear-gradient(135deg,#14224f,#0f766e);
  border-bottom:3px solid #c9a84c
}
.live-chat-bar .live-av{width:44px;height:44px}
.live-chat-who{min-width:0;flex:1}
.live-chat-who b{display:block;font-size:17px}
.live-chat-who span{display:block;font-size:13px;color:#fde68a;font-weight:700}
.live-back{
  width:48px;height:48px;border:none;border-radius:50%;background:rgba(255,255,255,.12);
  color:#fff;font-size:28px;line-height:1;cursor:pointer
}
.live-chat{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:12px}
.bub{max-width:86%;margin:8px 0;padding:10px 12px 12px;border-radius:14px;font-size:16px;line-height:1.45;position:relative;-webkit-touch-callout:none}
.bub-more{
  position:absolute;top:4px;right:4px;width:36px;height:36px;border:none;border-radius:10px;
  background:rgba(255,255,255,.12);color:#f8fafc;font-size:20px;line-height:1;cursor:pointer;padding:0
}
.bub.me{margin-left:auto;background:#0f766e}
.bub.them{background:#132033}
.bub small{display:block;font-size:11px;color:#94a3b8;margin-bottom:3px;padding-right:36px}
.bub img,.bub video{display:block;max-width:100%;border-radius:8px;margin-top:6px}
.bub audio{width:100%;margin-top:6px}
.bub a.file{display:block;margin-top:6px;font-weight:800;color:#86efac}
.composer-wrap{flex:none;background:#0c1a24}
.composer{
  flex:none;background:#0c1a24;
  padding:10px 10px calc(12px + env(safe-area-inset-bottom));
  display:flex;gap:8px;align-items:center
}
.composer input[type=text]{
  flex:1;min-width:0;border:none;border-radius:24px;background:#132033;color:#f1f5f9;
  padding:14px 16px;font-size:16px;font-family:inherit;min-height:48px
}
.btn{
  border:none;border-radius:14px;font-size:16px;font-weight:800;cursor:pointer;
  min-height:52px;padding:12px 16px;touch-action:manipulation
}
.btn.green{background:#16a34a;color:#fff}
.btn.navy{background:#1d4ed8;color:#fff}
.btn.amber{background:#d97706;color:#fff}
.btn.red{background:#dc2626;color:#fff}
.btn.grey{background:#1e293b;color:#e2e8f0}
.btn.gold{background:#c9a84c;color:#14224f}
.composer .btn{border-radius:24px;min-width:52px}
.composer .btn.voice,.composer .btn.emoji{min-width:48px;padding:10px}
.composer .btn.voice{touch-action:none;-webkit-touch-callout:none;user-select:none}
.composer .btn.voice.on{background:#dc2626;color:#fff}
.live-side .composer-wrap{border-top:1px solid #1e293b}
.live-side .composer{padding:8px 10px}
.live-rec{
  display:flex;align-items:center;flex-wrap:wrap;gap:10px;
  margin:8px 10px 0;padding:10px 12px;
  background:#7f1d1d;border-radius:14px;color:#fff
}
.live-rec.hidden{display:none!important}
.live-rec-ico{
  width:48px;height:48px;border-radius:50%;flex:none;
  background:#dc2626;display:grid;place-items:center;
  animation:livePulse 1.2s ease-out infinite
}
.live-rec-wave{display:flex;align-items:flex-end;gap:3px;height:28px;flex:none}
.live-rec-wave i{
  display:block;width:4px;background:#fecaca;border-radius:2px;
  transform-origin:bottom;animation:liveBar .7s ease-in-out infinite alternate
}
.live-rec-wave i:nth-child(1){height:8px;animation-delay:0s}
.live-rec-wave i:nth-child(2){height:14px;animation-delay:.08s}
.live-rec-wave i:nth-child(3){height:22px;animation-delay:.16s}
.live-rec-wave i:nth-child(4){height:28px;animation-delay:.24s}
.live-rec-wave i:nth-child(5){height:20px;animation-delay:.32s}
.live-rec-wave i:nth-child(6){height:12px;animation-delay:.4s}
.live-rec-wave i:nth-child(7){height:18px;animation-delay:.48s}
.live-rec p{margin:0;font-size:14px;font-weight:800;line-height:1.3;flex:1;min-width:120px}
.live-rec .btn{min-height:44px;padding:8px 12px;flex:none;font-size:14px}
.live-rec.sending{background:#14532d}
.live-rec.sending .live-rec-ico{background:#16a34a;animation:none}
@keyframes liveBar{from{transform:scaleY(.35)}to{transform:scaleY(1)}}
@keyframes livePulse{
  0%{box-shadow:0 0 0 0 rgba(220,38,38,.55)}
  70%{box-shadow:0 0 0 14px rgba(220,38,38,0)}
  100%{box-shadow:0 0 0 0 rgba(220,38,38,0)}
}
.live-emoji{
  display:flex;flex-wrap:wrap;gap:4px;
  max-height:148px;overflow:auto;-webkit-overflow-scrolling:touch;
  padding:8px 10px;background:#0c1a24
}
.live-emoji.hidden{display:none!important}
.live-emoji button{
  width:40px;height:40px;border:none;background:#132033;color:#f8fafc;
  border-radius:10px;font-size:22px;line-height:1;cursor:pointer;padding:0
}
.live-pop{
  position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.5);
  display:flex;align-items:center;justify-content:center;padding:20px
}
.live-pop.hidden{display:none!important}
.live-pop-card{
  width:min(360px,100%);background:#0f172a;border:2px solid #c9a84c;
  border-radius:16px;padding:22px 18px;text-align:center
}
.live-pop-card h2{margin:0 0 8px;font-size:20px;color:#f8fafc;line-height:1.3}
.live-pop-card p{margin:0 0 16px;color:#94a3b8;font-size:14px;font-weight:700}
.live-pop-card .btn.wide{width:100%}
.live-msg-menu{
  position:fixed;z-index:90;min-width:188px;
  background:#0f172a;border:1px solid #334155;border-radius:12px;
  box-shadow:0 10px 30px rgba(0,0,0,.45);overflow:hidden
}
.live-msg-menu.hidden{display:none!important}
.live-msg-menu button{
  display:block;width:100%;text-align:left;border:none;background:transparent;
  color:#f1f5f9;padding:14px 16px;font-size:16px;font-weight:800;cursor:pointer
}
.live-msg-menu button:active,.live-msg-menu button:hover{background:#1e293b}
.live-home-chat .live-main{display:none!important}
.live-home-chat .live-desk{display:flex;flex-direction:column}
.msg{flex:none;padding:8px 12px;font-size:14px;font-weight:800;display:none;text-align:center;position:relative;z-index:1}
.msg.ok{display:block;background:#14532d;color:#bbf7d0}
.msg.err{display:block;background:#7f1d1d;color:#fecaca}
.live-lang{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#0c1a24;border-bottom:1px solid #1e293b}
.live-lang label{flex:none;font-size:13px;font-weight:800;color:#fde68a}
.live-lang select{
  flex:1;min-height:44px;font-size:16px;font-family:inherit;
  background:#132033;color:#f1f5f9;border:1px solid #c9a84c;border-radius:10px;padding:8px 10px
}
.live-duty-btns{display:flex;gap:8px;padding:10px 12px 4px}
.live-duty-btns .btn{flex:1;min-height:52px;font-size:16px;line-height:1.2}
.btn.alarm-red{
  background:#b91c1c;color:#fff;border:2px solid #fecaca;min-height:56px;font-size:16px;font-weight:800
}
.btn.connect{background:#0f766e;color:#fff;border:2px solid #5eead4;min-height:56px;font-size:15px;font-weight:800}
.btn.connect small{display:block;font-size:12px;font-weight:700;opacity:.92}
.live-alarm-lv{display:flex;gap:8px;padding:4px 12px 8px}
.live-duty-lv{display:flex;flex-direction:column;gap:8px;padding:4px 12px 8px}
.live-alarm-lv.hidden,.live-duty-lv.hidden{display:none!important}
.live-alarm-lv .btn{flex:1;min-height:52px;font-weight:800;font-size:13px;line-height:1.2}
.live-alarm-lv .btn.low{background:#16a34a;color:#fff}
.live-alarm-lv .btn.med{background:#ca8a04;color:#14224f}
.live-alarm-lv .btn.high{background:#dc2626;color:#fff}
.live-alarm-hint{margin:0 12px 8px;font-size:12px;color:#94a3b8;font-weight:700;line-height:1.35}
.live-duty-lv .reliever{
  margin:0;padding:12px 14px;min-height:48px;background:#132033;
  border:1px solid #c9a84c;border-radius:12px;color:#e2e8f0
}
.ops{position:fixed;inset:0;background:#071018;z-index:40;display:flex;flex-direction:column;overflow:auto}
.ops-bar{
  display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;
  padding:calc(10px + env(safe-area-inset-top)) 12px 12px;
  background:linear-gradient(135deg,#14224f,#0f766e);border-bottom:3px solid #c9a84c
}
.ops > .live-head{position:sticky;top:0;z-index:2}
.ops-body{padding:14px 14px calc(28px + env(safe-area-inset-bottom));max-width:440px;margin:0 auto;width:100%}
.ops-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ops-tiles .btn{min-height:72px;font-size:17px}
.ops-tiles .wide{grid-column:1/-1}
.live-break-pop{
  grid-column:1/-1;
  background:#0c1a24;border:2px solid #c9a84c;border-radius:14px;padding:14px
}
.duty-geo{margin:0 0 10px}
.duty-geo b{color:#fde68a}
.month-row{border-bottom:1px solid #1e293b;padding:10px 0}
.month-row:last-child{border-bottom:none}
.ops-body .btn.wide{width:100%;display:block;text-align:center;text-decoration:none;margin-top:8px}
.live-alarm{
  position:fixed;inset:0;z-index:80;background:rgba(127,29,29,.92);
  display:flex;flex-direction:column;justify-content:center;padding:24px 18px;
  text-align:center;color:#fff
}
.live-remind{
  position:fixed;inset:0;z-index:78;background:rgba(7,16,24,.88);
  display:flex;align-items:flex-end;justify-content:center
}
.live-remind-card{
  width:100%;max-width:480px;background:#0c1a24;border-top:3px solid #c9a84c;
  padding:18px 16px calc(20px + env(safe-area-inset-bottom));border-radius:16px 16px 0 0
}
.live-remind-card h2{margin:0 0 8px;color:#fde68a;font-size:22px}
.live-remind-card p{margin:0 0 10px;font-size:16px;line-height:1.4}
.live-remind-card .wage{background:#132033;border-radius:12px;padding:12px;margin:10px 0}
.live-remind-card .wage b{display:block;color:#fde68a;margin:0 0 6px}
.live-alarm h2{margin:0 0 12px;font-size:26px;line-height:1.25}
.live-alarm p{margin:0 0 18px;font-size:17px;font-weight:700}
.live-pop{
  position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.55);
  display:flex;align-items:flex-end;justify-content:center
}
.live-pop-card{
  width:100%;max-width:480px;background:#0c1a24;border-top:3px solid #c9a84c;
  padding:18px 16px calc(20px + env(safe-area-inset-bottom));border-radius:16px 16px 0 0
}
.live-selfie{
  position:fixed;inset:0;z-index:75;background:#071018;
  display:flex;flex-direction:column
}
.live-selfie video{
  flex:1;width:100%;min-height:0;object-fit:cover;background:#000;transform:scaleX(-1)
}
.live-selfie .selfie-bar{
  flex:none;padding:12px 14px calc(16px + env(safe-area-inset-bottom));
  display:flex;flex-wrap:wrap;gap:8px;align-items:center
}
.live-selfie .selfie-bar .reliever{width:100%;margin:0;color:#fde68a}
.card{background:#0c1a24;border:1px solid #1e293b;border-radius:16px;padding:16px;margin-bottom:12px}
h3{margin:0 0 8px;color:#fde68a}
.muted{color:#94a3b8;font-size:14px;line-height:1.5}
label{display:block;font-size:13px;font-weight:800;color:#fde68a;margin:10px 0 6px}
input,select{width:100%;padding:14px;border:1px solid #1e293b;border-radius:12px;background:#071018;color:#f1f5f9;font-size:16px;font-family:inherit;min-height:48px}
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
.kpi{background:#071018;border:1px solid #1e293b;border-radius:12px;padding:12px;text-align:center}
.kpi b{display:block;font-size:22px;color:#fde68a}
.kpi span{font-size:12px;color:#94a3b8}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:10px 6px;border-bottom:1px solid #1e293b;text-align:left;vertical-align:top}
th{color:#c9a84c;font-size:11px;text-transform:uppercase}
.pill{display:inline-block;padding:4px 8px;border-radius:999px;font-size:12px;font-weight:800}
.pill.ok{background:#065f46;color:#a7f3d0}
.pill.late{background:#7c2d12;color:#fdba74}
.pill.miss{background:#7f1d1d;color:#fecaca}
.pill.way{background:#422006;color:#fde68a}
.rule{color:#fde68a;font-size:12px;line-height:1.45;margin:8px 12px}
.live-disclaimer{margin-top:16px;padding:12px 14px;background:#132033;border:1px solid #c9a84c;border-radius:12px;text-align:center;display:flex;flex-direction:column;align-items:center}
.live-disclaimer b{display:block;width:100%;color:#fde68a;font-size:15px;margin:0 0 8px;text-align:center}
.live-disclaimer p{margin:0;width:100%;font-size:12px;line-height:1.5;color:#cbd5e1;font-weight:700;text-align:center;text-wrap:balance}
.live-disclaimer .by-order{margin-top:10px;width:auto;align-self:flex-end;color:#fde68a;font-size:13px;text-align:right}
.live-open-head{
  flex:none;display:flex;align-items:center;gap:12px;
  padding:calc(10px + env(safe-area-inset-top)) 14px 12px;
  background:linear-gradient(135deg,#14224f,#0f766e);
  border-bottom:3px solid #c9a84c;
}
.live-open-head .live-crest{margin:0}
.live-open-titles{min-width:0;flex:1}
.live-open-titles p{margin:0;font-size:13px;font-weight:800;line-height:1.35}
.live-open-titles .live-open-l1{color:#e2e8f0}
.live-open-titles .live-open-l2{color:#fde68a;margin-top:4px}
.live-open-titles b.live-open-app{display:block;font-size:20px;line-height:1.2;letter-spacing:.04em;margin-top:6px;color:#fff}
.live-open-titles .live-open-cc{color:#fde68a;margin-top:4px;font-size:14px}
.live-open-titles a{color:#fde68a;text-decoration:underline}
.live-honour{
  flex:none;margin:0;padding:14px 4px;text-align:center;overflow:hidden;
  background:linear-gradient(105deg,#9f1239 0%,#c2410c 28%,#ca8a04 52%,#0f766e 76%,#1d4ed8 100%);
  border-bottom:3px solid #fde68a;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.22);
}
.live-honour p{
  margin:0;font-size:16px;font-weight:900;line-height:1.2;color:#fff;
  white-space:nowrap;letter-spacing:-.08em;text-shadow:0 1px 8px rgba(0,0,0,.45);
}
.gate .suite-app-footer{margin:12px 12px 16px;flex:none}
#loginNote{padding:0 16px 12px;max-width:440px;margin:0 auto;width:100%}
.add-box{flex:none;padding:10px 12px calc(12px + env(safe-area-inset-bottom));border-top:1px solid #1e293b;background:#0c1a24}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.row .btn{flex:1}
#login{width:100%;max-width:440px;margin:0 auto;padding:16px 16px 12px;overflow:auto;flex:1;min-height:0}
.gate{flex:1;min-height:0;display:flex;flex-direction:column;padding:0;overflow:auto;-webkit-overflow-scrolling:touch}
.gate-card{flex:1;display:flex;flex-direction:column;padding:16px 16px 12px}
.gate-card .btn.green{margin-top:16px}
@media(min-width:1100px){
  .live-desk{display:grid;grid-template-columns:380px 1fr;height:100dvh}
  .live-desk .live-side{display:flex;flex-direction:column;min-height:0;border-right:1px solid #1e293b}
  .live-desk .live-main{display:flex!important}
  .live-home-chat .live-desk{display:flex;flex-direction:column}
  .live-home-chat .live-main{display:none!important}
  #ops .live-ops-deploy{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-items:start}
}
`

function liveFootIcon(d: string): string {
  return `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`
}

/** Same person header on first page and Dashboard. */
export function liveLoginArrowHtml(): string {
  return `<button type="button" class="live-ico live-back-login" id="btnToLogin" aria-label="Login page" title="Login page">‹</button>`
}

export const LIVE_HONOUR_LINE = 'Honouring our Guards who protect the dreams of many'

/** Regular Open / PIN login header — same crest logo as the main page + Director’s four lines. */
export function liveOpenHeadHtml(_sub?: string): string {
  return `<header class="live-open-head">
    <div class="live-crest">${liveLogoImg()}</div>
    <div class="live-open-titles">
      <p class="live-open-l1">Agile Security Force Private Limited, <a href="https://www.agilegroup.co.in" target="_blank" rel="noopener noreferrer">www.AgileGroup.co.in</a></p>
      <p class="live-open-l2">Job Website, <a href="https://www.securityjob.co.in" target="_blank" rel="noopener noreferrer">www.SecurityJob.co.in</a></p>
      <b class="live-open-app">AGILE LIVE</b>
      <p class="live-open-cc">Central Control -<a href="tel:+919248707070">9248707070</a></p>
    </div>
  </header>`
}

export function liveIconHeadHtml(): string {
  return `<link rel="icon" type="image/png" sizes="32x32" href="/agile-live-icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/agile-live-icon-192.png">
<link rel="icon" type="image/png" href="/agile-live-icon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/agile-live-icon-180.png">
<link rel="manifest" href="/live-manifest.webmanifest">`
}

export function liveHonourBannerHtml(): string {
  return `<div class="live-honour" role="note"><p>${LIVE_HONOUR_LINE}</p></div>
<script>(function(){function f(){var b=document.querySelector('.live-honour');var p=b&&b.querySelector('p');if(!p||!b)return;var s=12;p.style.fontSize=s+'px';while(s<20&&p.scrollWidth<=b.clientWidth-2){s+=0.4;p.style.fontSize=s+'px'}if(p.scrollWidth>b.clientWidth-2){s-=0.4;p.style.fontSize=s+'px'}}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',f);else f();window.addEventListener('resize',f)})();</script>`
}

export function liveDisclaimerHtml(): string {
  return `<div class="live-disclaimer">
    <b>Disclaimer</b>
    <p>This platform and its communications are strictly for internal Agile Security Force operations and official use only. All discussions, data, and shared media are confidential and protected. Unauthorized sharing, external distribution, or misuse of this information is strictly prohibited and subject to disciplinary and legal action.</p>
    <p class="by-order">By order.</p>
  </div>`
}

export function livePersonHeadHtml(opts: {
  whoId: string
  idId: string
  desigId: string
  cardId: string
  cardPickId: string
  cardDateId: string
  branchId: string
  extra: string
  lead?: string
}): string {
  return `<div class="live-head">
    ${opts.lead || ''}
    <div class="live-crest">${liveLogoImg()}</div>
    <div class="live-me">
      <b class="live-nm" id="${opts.whoId}">Name</b>
      <span class="live-id" id="${opts.idId}">ID No.</span>
      <span class="live-desig" id="${opts.desigId}">Designation</span>
      <span class="live-card" id="${opts.cardId}">ID card validity</span>
      <label class="live-card-pick hidden" id="${opts.cardPickId}">ID card validity
        <input type="date" id="${opts.cardDateId}">
      </label>
      <span class="live-br" id="${opts.branchId}">Branch —</span>
    </div>
    ${opts.extra}
  </div>`
}

export function liveFooterHtml(active: 'Chat' | 'News' | 'Train' | 'Profile' = 'Chat'): string {
  const on = (g: string) => (g === active ? ' on' : '')
  return `<nav class="live-subfoot" id="subFoot" aria-label="Sub menu"></nav>
<nav class="live-foot" aria-label="Agile Live">
  <button type="button" class="app-tap-btn${on('Chat')}" id="footChat" data-group="Chat">${liveFootIcon('M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4z')}<span data-i18n="chat">Chat</span></button>
  <button type="button" class="app-tap-btn${on('News')}" id="footNews" data-group="News">${liveFootIcon('M5 4h11v16H5zM18 7h2v13h-2zM7 7h7v2H7zm0 4h7v2H7z')}<span data-i18n="news">News</span></button>
  <button type="button" class="app-tap-btn${on('Train')}" id="footTrain" data-group="Train">${liveFootIcon('M12 3l9 4.5-9 4.5L3 7.5 12 3zm0 11 7.5-3.7V16c0 2.2-3.1 4-7.5 4s-7.5-1.8-7.5-4v-5.7L12 14z')}<span data-i18n="train">Training</span></button>
  <button type="button" class="app-tap-btn${on('Profile')}" id="footProfile" data-group="Profile">${liveFootIcon('M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.4 0-8 2.1-8 4.7V21h16v-2.3C20 16.1 16.4 14 12 14z')}<span data-i18n="profile">Profile</span></button>
</nav>`
}