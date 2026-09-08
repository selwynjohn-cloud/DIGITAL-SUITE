/** Work360 often puts biometric / employee codes in numeric columns — not distance. */
export function looksLikeEmployeeCode(raw?: string): boolean {
  const s = String(raw ?? '').trim()
  if (!s) return false
  if (/^\d{8,}$/.test(s)) return true
  if (/^[01]\d{9,}$/.test(s)) return true
  if (/^[A-Z]{0,3}\d{6,}$/i.test(s) && s.length >= 8) return true
  return false
}

/** Parse a distance string from Work360 exports into kilometres (number). */
export function parseKmNumber(raw?: string, assumeMeters = false): number {
  if (!raw) return 0
  const s = String(raw).trim()
  if (!s || looksLikeEmployeeCode(s)) return 0
  const kmMatch = s.match(/([\d.]+)\s*km/i)
  if (kmMatch) return parseFloat(kmMatch[1]) || 0
  const meterMatch = s.match(/([\d.]+)\s*m(?:eters?|etres?)?/i)
  if (meterMatch) return (parseFloat(meterMatch[1]) || 0) / 1000
  const n = parseFloat(s.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return 0
  if (assumeMeters || (n > 50 && n <= 50000)) return n / 1000
  if (n > 50000) return 0
  return n
}

/** Work360 gzadmin sometimes stores distance as 100000 + meters (e.g. 100000494 = 494 m). */
export function parseWork360Distance(raw?: string): string {
  if (!raw) return ''
  const s = String(raw).trim()
  if (!s) return ''
  const gz = s.match(/^100000(\d{1,4})$/)
  if (gz) {
    const meters = parseInt(gz[1], 10)
    if (meters > 0) return formatKmLabel(String(meters), true)
  }
  return formatKmLabel(s, true)
}

/** Display label for KM — keeps existing "X km" text or adds unit to plain numbers. */
export function formatKmLabel(raw?: string, assumeMeters = false): string {
  if (!raw) return ''
  const s = String(raw).trim()
  if (!s || looksLikeEmployeeCode(s)) return ''
  if (/km/i.test(s)) return s.replace(/\s+/g, ' ')
  const n = parseKmNumber(s, assumeMeters || /m(?:eters?|etres?)?/i.test(s))
  if (n > 0 && n <= 100) {
    const rounded = Math.round(n * 1000) / 1000
    return `${rounded} km`
  }
  return ''
}

/** Normalise Work360 / Excel time cells to a readable HH:MM (or full datetime if needed). */
export function formatTimeLabel(raw?: string): string {
  if (!raw) return ''
  const s = String(raw).trim()
  if (!s) return ''
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s)
    if (Number.isFinite(n) && n >= 0 && n < 1) {
      const sec = Math.round(n * 86400)
      const h = Math.floor(sec / 3600)
      const m = Math.floor((sec % 3600) / 60)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
  }
  const epochTime = s.match(/(?:1899-12-30|1900-01-0[01])\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)/i)
  if (epochTime) return epochTime[1].replace(/\s+/g, ' ')
  const isoTime = s.match(/^\d{4}-\d{2}-\d{2}[ T](\d{1,2}:\d{2}(?::\d{2})?)/)
  if (isoTime) return isoTime[1]
  const dmyTime = s.match(/^\d{1,2}[/-]\d{1,2}[/-]\d{4}\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)/i)
  if (dmyTime) return dmyTime[1].replace(/\s+/g, ' ')
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 8).trim()
  return s.slice(0, 40)
}
