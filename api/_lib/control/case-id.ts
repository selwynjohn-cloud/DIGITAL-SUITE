/**
 * Agile Control — case numbers AC-YYMMDD-####
 */

function yymmddIst(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const y = parts.find((p) => p.type === 'year')?.value?.slice(-2) || '00'
  const m = parts.find((p) => p.type === 'month')?.value || '01'
  const day = parts.find((p) => p.type === 'day')?.value || '01'
  return `${y}${m}${day}`
}

/** Allocate next case number for today (IST). */
export async function nextAcCaseNo(now = new Date()): Promise<string> {
  const day = yymmddIst(now)
  const key = `ac:seq:${day}`
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  let n = Math.floor(Math.random() * 900) + 1
  if (url && token) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['INCR', key]),
      })
      const d = (await res.json()) as { result?: unknown }
      n = Number(d?.result) || n
      if (n === 1) {
        await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['EXPIRE', key, 60 * 60 * 48]),
        })
      }
    } catch {
      /* keep random */
    }
  }
  return `AC-${day}-${String(n).padStart(4, '0')}`
}
