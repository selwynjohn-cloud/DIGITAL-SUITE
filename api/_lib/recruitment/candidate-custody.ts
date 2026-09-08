export async function ensureCandidateCustody() { return { ok: true as const } }
export async function rememberCandidatesInCustody(_rows?: unknown) { return }
export function custodyExcelPayload(_rows?: unknown) { return { rows: [] as unknown[] } }
