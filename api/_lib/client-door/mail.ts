import { CLIENT_DOOR_URL, type ClientDoorSite } from './lookup.js'
import {
  CLIENT_DOOR_SEE_TEXT,
  clientDoorFooterHtml,
  clientDoorHeaderHtml,
  clientDoorTitle,
  escDoor,
} from './chrome.js'

export function clientDoorLetterHtml(opts: {
  site: ClientDoorSite
  email: string
}): string {
  const { site, email } = opts
  const clientName = site.name || site.groupLabel
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${escDoor(clientDoorTitle(clientName))}</title></head>
<body style="margin:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a">
  <div style="max-width:640px;margin:0 auto;padding:20px 14px 28px">
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      ${clientDoorHeaderHtml({
        clientName,
        subtitle: `${site.groupLabel}${site.location ? ' · ' + site.location : ''} · ${site.branchName}`,
        branchName: site.branchName,
      })}
      <div style="padding:18px 20px 16px;line-height:1.55">
        <p>Dear Sir / Madam,</p>
        <p>Agile Security Force has opened your <b>Client Door</b>. Use the link below with this work email.</p>
        <p style="margin:16px 0"><a href="${CLIENT_DOOR_URL}" style="display:inline-block;background:#c9a84c;color:#14224f;font-weight:800;text-decoration:none;padding:12px 18px;border-radius:8px">Open Client Door</a></p>
        <p style="font-size:14px;color:#334155">${escDoor(CLIENT_DOOR_URL)}</p>
        <ol style="padding-left:20px;margin:12px 0">
          <li>Enter this email: <b>${escDoor(email)}</b></li>
          <li>Tap <b>Send PIN</b></li>
          <li>Enter the 6-digit PIN from your inbox</li>
          <li>Tap <b>Open</b></li>
        </ol>
        <p>${escDoor(CLIENT_DOOR_SEE_TEXT)}</p>
        <p style="margin-top:18px">Regards,<br><b>Agile Security Force Pvt. Ltd.</b><br>${escDoor(site.branchName)}</p>
        ${clientDoorFooterHtml()}
      </div>
    </div>
  </div>
</body></html>`
}

export function clientDoorLetterText(opts: { site: ClientDoorSite; email: string }): string {
  const { site, email } = opts
  return [
    `Dear Sir / Madam,`,
    ``,
    `Agile Security Force has opened your Client Door.`,
    `Client Door - ${site.name || site.groupLabel}`,
    ``,
    `Open: ${CLIENT_DOOR_URL}`,
    `1. Enter this email: ${email}`,
    `2. Tap Send PIN`,
    `3. Enter the 6-digit PIN from your inbox`,
    `4. Tap Open`,
    ``,
    CLIENT_DOOR_SEE_TEXT,
    ``,
    `Regards,`,
    `Agile Security Force Pvt. Ltd.`,
    site.branchName,
  ].join('\n')
}
