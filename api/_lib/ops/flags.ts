/**
 * Agile Ops — safety rails.
 * Invoice / pay output stays OFF until Management cutover approval (Phase 6).
 */

export type OpsFlags = {
  /** Shadow mode: Ops calculates and compares; MIS/Work360 remain truth. */
  shadow: boolean
  /** When false, Ops must not generate invoice or pay files. */
  invoiceFeed: boolean
  /** Attendance source adapter: work360 now, agile_mobile later. */
  attendanceSource: 'work360' | 'agile_mobile' | 'both'
  /** After cutover, allow MIS daily pre-fill from Ops. */
  misPrefill: boolean
  /** Guard + staff may start duty only when a face photo is on file. */
  photoRequiredForDuty: boolean
  /** Cutover approved timestamp (ISO) or empty. */
  cutoverApprovedAt: string
  cutoverApprovedBy: string
}

export function opsFlagsFromEnv(): OpsFlags {
  const shadow = String(process.env.OPS_SHADOW ?? 'true').toLowerCase() !== 'false'
  const invoiceFeed = String(process.env.OPS_INVOICE_FEED ?? 'false').toLowerCase() === 'true'
  const src = String(process.env.OPS_ATTENDANCE_SOURCE ?? 'work360').toLowerCase()
  const attendanceSource: OpsFlags['attendanceSource'] =
    src === 'agile_mobile' ? 'agile_mobile' : src === 'both' ? 'both' : 'work360'
  const misPrefill = String(process.env.OPS_MIS_PREFILL ?? 'false').toLowerCase() === 'true'
  const photoRequiredForDuty =
    String(process.env.OPS_PHOTO_REQUIRED_FOR_DUTY ?? 'true').toLowerCase() !== 'false'
  return {
    shadow,
    invoiceFeed,
    attendanceSource,
    misPrefill,
    photoRequiredForDuty,
    cutoverApprovedAt: process.env.OPS_CUTOVER_APPROVED_AT?.trim() || '',
    cutoverApprovedBy: process.env.OPS_CUTOVER_APPROVED_BY?.trim() || '',
  }
}

/** Hard freeze: never emit invoice/pay payloads unless explicitly allowed + cutover stamped. */
export function canEmitInvoiceFeed(flags: OpsFlags): boolean {
  return Boolean(flags.invoiceFeed && flags.cutoverApprovedAt)
}

export const OPS_APP_IDS = ['control', 'quality', 'meetings', 'ops', 'ops-mobile'] as const
export type OpsAppId = (typeof OPS_APP_IDS)[number]
