/**
 * Agile Group — INR money standard: stored & shown in ₹ Lakhs (2 decimals).
 * Long numerals (full ₹) are auto-converted to lakhs on save/input.
 */
export const LACS_TO_RUPEES = 100_000
/** Values at or above this are treated as full ₹ and divided by 1,00,000. */
export const RUPEES_INPUT_THRESHOLD = 1000

export function roundMoney2(n: number): number {
  return Math.round(n * 100) / 100
}

export function parseMoneyNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const raw = String(value)
    .replace(/₹|rs\.?|inr/gi, '')
    .replace(/\s*l(?:akhs?)?\s*$/i, '')
    .replace(/,/g, '')
    .trim()
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** Normalize to ₹ Lakhs — accepts lakhs or long full-rupee numerals. */
export function normalizeToLacs(value: unknown): number | null {
  const n = parseMoneyNumber(value)
  if (n == null) return null
  if (Math.abs(n) >= RUPEES_INPUT_THRESHOLD) return roundMoney2(n / LACS_TO_RUPEES)
  return roundMoney2(n)
}

export function lacsToRupees(lacs: number | string | null | undefined): number | null {
  const n = normalizeToLacs(lacs)
  if (n == null) return null
  return roundMoney2(n * LACS_TO_RUPEES)
}

/** @deprecated use normalizeToLacs */
export function rupeesToLacs(rupees: number | string | null | undefined): number | null {
  return normalizeToLacs(rupees)
}

/** Display: ₹12.50 L */
export function formatInrLacs(lacs: number | string | null | undefined): string {
  const n = normalizeToLacs(lacs)
  if (n == null) return '—'
  return `₹${n.toFixed(2)} L`
}

/** Alias — amounts are shown in lakhs company-wide. */
export function formatInrFromLacs(lacs: number | string | null | undefined): string {
  return formatInrLacs(lacs)
}

export function formatInr(rupees: number | string | null | undefined): string {
  if (rupees == null || rupees === '') return '—'
  const n = Number(rupees)
  if (!Number.isFinite(n)) return '—'
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatLacs(lacs: number | string | null | undefined): string {
  return formatInrLacs(lacs)
}

export function normalizeMoneyFieldsLacs<T extends Record<string, unknown>>(
  row: T,
  keys: (keyof T)[],
): T {
  const out = { ...row }
  for (const key of keys) {
    if (out[key] === undefined || out[key] === null || out[key] === '') continue
    const v = normalizeToLacs(out[key])
    if (v != null) (out as Record<string, unknown>)[key as string] = v
  }
  return out
}

/** Inline JS — MIS and other Agile portals. */
export const SUITE_MONEY_JS = `
var LACS_TO_RUPEES=100000,RUPEES_INPUT_THRESHOLD=1000;
function parseMoneyNumber(v){
  if(v==null||v==='')return null;
  var n=Number(String(v).replace(/₹|rs\\.?|inr/gi,'').replace(/\\s*l(?:akhs?)?\\s*$/i,'').replace(/,/g,'').trim());
  return isFinite(n)?n:null;
}
function normalizeToLacs(v){
  var n=parseMoneyNumber(v);
  if(n==null)return null;
  if(Math.abs(n)>=RUPEES_INPUT_THRESHOLD)return Math.round(n/LACS_TO_RUPEES*100)/100;
  return Math.round(n*100)/100;
}
function inrFromLacs(l){var n=normalizeToLacs(l);return n==null?null:Math.round(n*LACS_TO_RUPEES*100)/100;}
function rupeesToLacs(r){return normalizeToLacs(r);}
function fmtInrLacs(l){var n=normalizeToLacs(l);return n==null?'—':'₹'+n.toFixed(2)+' L';}
function fmtInr(v){if(v==null||v===''||!isFinite(Number(v)))return '—';return '₹'+Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmtLacs(l){return fmtInrLacs(l);}
function lacsInputVal(l){var n=normalizeToLacs(l);return n==null?'':n.toFixed(2);}
function moneyInputToLacs(v){return normalizeToLacs(v);}
`

/** @deprecated alias */
export const CLIENT_PERF_MONEY_JS = SUITE_MONEY_JS
