/**
 * ₹ coin stacks — Monthly bill vs Balance to be paid (Client Performance).
 */
import { formatInrFromLacs, formatLacs } from './client-perf-money.js'

export const CLIENT_PERF_BILLING_CHART_TITLE = 'Monthly Billing vs Balance to be paid as on date'

export function clientPerfDeployChartTitle(days: number): string {
  const n = Math.max(0, Number(days) || 0)
  return `Deployment — No of ${n} days`
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

type CoinCol = { label: string; value: number; light: string; mid: string; dark: string }

const GOLD_COIN = { light: '#ffe566', mid: '#e8a317', dark: '#b45309' }
const BALANCE_COIN = { light: '#fcd34d', mid: '#d97706', dark: '#92400e' }

/** Thick ₹ coin with reeded edge — like reference infographic. */
function rsCoinSvg(cx: number, topY: number, r: number, light: string, mid: string, dark: string): string {
  const h = 9
  const bottomY = topY + h
  const sideTop = topY + r * 0.2
  let s = ''
  s += `<ellipse cx="${cx}" cy="${bottomY + 5}" rx="${r * 0.92}" ry="${r * 0.26}" fill="rgba(0,0,0,0.2)"/>`
  s += `<rect x="${cx - r}" y="${sideTop}" width="${r * 2}" height="${h - 1}" fill="${mid}"/>`
  for (let x = -r + 3; x < r - 2; x += 3) {
    s += `<line x1="${cx + x}" y1="${sideTop}" x2="${cx + x}" y2="${bottomY - 1}" stroke="${dark}" stroke-width="0.9" opacity="0.42"/>`
  }
  s += `<rect x="${cx - r + 3}" y="${sideTop}" width="5" height="${h - 1}" fill="rgba(255,255,255,0.18)"/>`
  s += `<ellipse cx="${cx}" cy="${bottomY}" rx="${r}" ry="${r * 0.3}" fill="${dark}"/>`
  s += `<ellipse cx="${cx}" cy="${topY}" rx="${r}" ry="${r * 0.34}" fill="${light}" stroke="${dark}" stroke-width="1.4"/>`
  s += `<ellipse cx="${cx}" cy="${topY}" rx="${r * 0.78}" ry="${r * 0.26}" fill="none" stroke="${dark}" stroke-width="0.9" opacity="0.55"/>`
  s += `<ellipse cx="${cx - r * 0.28}" cy="${topY - 2}" rx="${r * 0.24}" ry="${r * 0.1}" fill="rgba(255,255,255,0.4)"/>`
  s += `<text x="${cx}" y="${topY + 6}" text-anchor="middle" font-size="${Math.round(r * 1.05)}" font-weight="900" fill="${dark}" font-family="Arial,sans-serif">₹</text>`
  return `<g>${s}</g>`
}

function billingPctOfBill(bill: number, value: number, isMonthlyBill: boolean): number {
  const b = Math.max(0, Number(bill) || 0)
  if (isMonthlyBill) return b > 0 ? 100 : 0
  return b > 0 ? Math.round((Math.max(0, Number(value) || 0) / b) * 100) : 0
}

function coinCount(value: number, billRef: number, isMonthlyBill: boolean): number {
  if (isMonthlyBill && billRef > 0) return 10
  if (billRef > 0) return Math.max(1, Math.min(10, Math.round((value / billRef) * 9) + 1))
  return value > 0 ? 1 : 0
}

function coinStackRs(
  cx: number,
  floorY: number,
  n: number,
  light: string,
  mid: string,
  dark: string,
): string {
  const r = 17
  const step = 10
  let html = ''
  for (let i = 0; i < n; i++) {
    const topY = floorY - 12 - i * step
    html += rsCoinSvg(cx, topY, r, light, mid, dark)
  }
  return html
}

function stackTopY(floorY: number, n: number): number {
  return floorY - 12 - (n - 1) * 10 - 22
}

function emptyBillingMsg(dark: boolean): string {
  const color = dark ? '#94a3b8' : '#64748b'
  return `<div style="color:${color};padding:24px;text-align:center;font-size:13px">Enter monthly bill &amp; balance on branch portal</div>`
}

/** Coin stacks only — Monthly bill vs Balance to be paid. */
export function billingCoinStacksSvg(
  bill: number | null | undefined,
  _collected: number | null | undefined,
  balance: number | null | undefined,
  dark = false,
): string {
  if (bill == null && balance == null) return emptyBillingMsg(dark)
  const b = Math.max(0, Number(bill) || 0)
  const bal = Math.max(0, Number(balance) ?? 0)
  if (!b && !bal) return emptyBillingMsg(dark)

  const cols: CoinCol[] = [
    { label: 'Monthly bill', value: b, ...GOLD_COIN },
    { label: 'Balance to be paid', value: bal, ...BALANCE_COIN },
  ]
  const billRef = Math.max(b, 0.01)
  const floorY = 168
  const centers = [95, 205]
  const pctColor = dark ? '#fde68a' : '#14224f'
  const labelColor = dark ? '#cbd5e1' : '#334155'
  const floorColor = dark ? '#475569' : '#94a3b8'

  let svg =
    `<svg width="300" height="210" viewBox="0 0 300 210" xmlns="http://www.w3.org/2000/svg">` +
    `<ellipse cx="150" cy="${floorY + 14}" rx="110" ry="9" fill="rgba(15,23,42,0.22)"/>` +
    `<line x1="35" y1="${floorY}" x2="265" y2="${floorY}" stroke="${floorColor}" stroke-width="2.5"/>`

  cols.forEach((col, i) => {
    const cx = centers[i]
    const isMonthlyBill = i === 0
    const nCoins = coinCount(col.value, billRef, isMonthlyBill)
    const pct = billingPctOfBill(b, col.value, isMonthlyBill)
    const top = stackTopY(floorY, nCoins)
    const topLabel = isMonthlyBill ? formatLacs(col.value) : `${pct}%`
    svg += coinStackRs(cx, floorY, nCoins, col.light, col.mid, col.dark)
    svg += `<text x="${cx}" y="${top - 6}" text-anchor="middle" font-size="16" font-weight="900" fill="${pctColor}">${esc(topLabel)}</text>`
    svg += `<text x="${cx}" y="${floorY + 24}" text-anchor="middle" font-size="11" font-weight="700" fill="${labelColor}">${esc(col.label)}</text>`
  })

  svg += `</svg>`

  const legendColor = dark ? '#94a3b8' : '#475569'
  const legend =
    `<div style="margin-top:6px;font-size:11px;color:${legendColor};text-align:center;line-height:1.7">` +
    cols
      .map((col, i) => {
        const isMonthlyBill = i === 0
        const pct = billingPctOfBill(b, col.value, isMonthlyBill)
        const valueLabel = isMonthlyBill
          ? `<b>${esc(formatLacs(col.value))}</b>`
          : `<b>${esc(formatInrLacs(col.value))}</b> (${pct}%)`
        return (
          `<span style="display:inline-block;margin:4px 10px">` +
          `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:4px;background:linear-gradient(180deg,${col.light},${col.dark});border:1px solid ${col.dark}"></span>` +
          `${esc(col.label)} ${valueLabel}</span>`
        )
      })
      .join('') +
    `</div>`

  return svg + legend
}

/** @deprecated alias */
export const bar3dBillingSvg = billingCoinStacksSvg

/** Browser-side billing chart (Management + Branch portals). */
export const CLIENT_PERF_BILLING_BAR_JS = `
function cpRsCoin(cx,topY,r,light,mid,dark){
  var h=9,bottomY=topY+h,sideTop=topY+r*0.2,s='',x;
  s+='<ellipse cx="'+cx+'" cy="'+(bottomY+5)+'" rx="'+(r*0.92)+'" ry="'+(r*0.26)+'" fill="rgba(0,0,0,0.2)"/>';
  s+='<rect x="'+(cx-r)+'" y="'+sideTop+'" width="'+(r*2)+'" height="'+(h-1)+'" fill="'+mid+'"/>';
  for(x=-r+3;x<r-2;x+=3)s+='<line x1="'+(cx+x)+'" y1="'+sideTop+'" x2="'+(cx+x)+'" y2="'+(bottomY-1)+'" stroke="'+dark+'" stroke-width="0.9" opacity="0.42"/>';
  s+='<rect x="'+(cx-r+3)+'" y="'+sideTop+'" width="5" height="'+(h-1)+'" fill="rgba(255,255,255,0.18)"/>';
  s+='<ellipse cx="'+cx+'" cy="'+bottomY+'" rx="'+r+'" ry="'+(r*0.3)+'" fill="'+dark+'"/>';
  s+='<ellipse cx="'+cx+'" cy="'+topY+'" rx="'+r+'" ry="'+(r*0.34)+'" fill="'+light+'" stroke="'+dark+'" stroke-width="1.4"/>';
  s+='<ellipse cx="'+cx+'" cy="'+topY+'" rx="'+(r*0.78)+'" ry="'+(r*0.26)+'" fill="none" stroke="'+dark+'" stroke-width="0.9" opacity="0.55"/>';
  s+='<ellipse cx="'+(cx-r*0.28)+'" cy="'+(topY-2)+'" rx="'+(r*0.24)+'" ry="'+(r*0.1)+'" fill="rgba(255,255,255,0.4)"/>';
  s+='<text x="'+cx+'" y="'+(topY+6)+'" text-anchor="middle" font-size="'+Math.round(r*1.05)+'" font-weight="900" fill="'+dark+'" font-family="Arial,sans-serif">₹</text>';
  return '<g>'+s+'</g>';
}
function cpRsStack(cx,floorY,n,light,mid,dark){
  var r=17,step=10,html='',i,topY;
  for(i=0;i<n;i++){topY=floorY-12-i*step;html+=cpRsCoin(cx,topY,r,light,mid,dark);}
  return html;
}
function cpCoinCount(val,billRef,isBill){
  if(isBill&&billRef>0)return 10;
  if(billRef>0)return Math.max(1,Math.min(10,Math.round(val/billRef*9)+1));
  return val>0?1:0;
}
function cpStackTop(floorY,n){return floorY-12-(n-1)*10-22;}
function cpBillingPct(bill,val,isBill){
  var b=Math.max(0,Number(bill)||0);
  if(isBill)return b>0?100:0;
  return b>0?Math.round(Math.max(0,Number(val)||0)*100/b):0;
}
function deployChartTitle(days){var n=Math.max(0,Number(days)||0);return 'Deployment — No of '+n+' days';}
function billingChartTitle(){return 'Monthly Billing vs Balance to be paid as on date';}
function billingCoinStacks(bill,coll,bal){
  if(bill==null&&bal==null)return '<div style="color:#94a3b8;padding:24px">Enter monthly bill &amp; balance on branch portal</div>';
  var b=Math.max(0,Number(bill)||0),bl=Math.max(0,Number(bal)||0);
  if(!b&&!bl)return '<div style="color:#94a3b8;padding:24px">Enter monthly bill &amp; balance on branch portal</div>';
  var cols=[
    {label:'Monthly bill',value:b,light:'#ffe566',mid:'#e8a317',dark:'#b45309'},
    {label:'Balance to be paid',value:bl,light:'#fcd34d',mid:'#d97706',dark:'#92400e'}
  ],billRef=Math.max(b,0.01),floorY=168,centers=[95,205],svg='',i,col,cx,nCoins,pct,top,legend='';
  svg='<svg width="300" height="210" viewBox="0 0 300 210"><ellipse cx="150" cy="'+(floorY+14)+'" rx="110" ry="9" fill="rgba(15,23,42,0.22)"/><line x1="35" y1="'+floorY+'" x2="265" y2="'+floorY+'" stroke="#64748b" stroke-width="2.5"/>';
  for(i=0;i<cols.length;i++){
    col=cols[i];cx=centers[i];
    nCoins=cpCoinCount(col.value,billRef,i===0);
    pct=cpBillingPct(b,col.value,i===0);
    top=cpStackTop(floorY,nCoins);
    svg+=cpRsStack(cx,floorY,nCoins,col.light,col.mid,col.dark);
    svg+='<text x="'+cx+'" y="'+(top-6)+'" text-anchor="middle" font-size="16" font-weight="900" fill="#fde68a">'+(i===0?h(fmtLacs(col.value)):pct+'%')+'</text>';
    svg+='<text x="'+cx+'" y="'+(floorY+24)+'" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">'+h(col.label)+'</text>';
  }
  svg+='</svg><div class="chart-legend">';
  for(i=0;i<cols.length;i++){
    col=cols[i];pct=cpBillingPct(b,col.value,i===0);
    legend+='<span><i class="dot" style="background:linear-gradient(180deg,'+col.light+','+col.dark+');border:1px solid '+col.dark+'"></i>'+h(col.label)+' '+(i===0?'<b>'+h(fmtLacs(col.value))+'</b>':'<b>'+h(fmtInrLacs(col.value))+'</b> ('+pct+'%)')+'</span>';
  }
  return svg+legend+'</div>';
}
function bar3dBilling(bill,coll,bal){return billingCoinStacks(bill,coll,bal);}
`
