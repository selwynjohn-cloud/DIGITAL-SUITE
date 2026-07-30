const BANK_HINTS = ['BANK', 'HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'PNB', 'CANARA', 'UNION', 'IDBI', 'YES BANK', 'INDUSIND']

/** Client priority 1–5 stars. 1–2 Valued · 3–4 High Value · 5 Strategic */
export function normalizeStarRating(v: unknown, fallback = 2): number {
  const n = Math.round(Number(v) || 0)
  if (n >= 1 && n <= 5) return n
  return Math.min(5, Math.max(1, fallback))
}

export function clientTierLabel(stars: number): string {
  if (stars >= 5) return 'Strategic Client'
  if (stars >= 3) return 'High Value Client'
  return 'Valued Client'
}

export function clientTierShort(stars: number): string {
  if (stars >= 5) return 'Strategic'
  if (stars >= 3) return 'High Value'
  return 'Valued'
}

export function starsDisplay(stars: number): string {
  const s = normalizeStarRating(stars)
  return '★'.repeat(s) + '☆'.repeat(5 - s)
}

export function suggestStarRating(name: string, totalSan: number, highValue?: boolean): number {
  if (highValue) return 4
  const n = name.toUpperCase()
  if (totalSan >= 30 || BANK_HINTS.some((h) => n.includes(h))) return 4
  return 2
}

export function isHighValueClient(name: string, totalSan: number): boolean {
  return suggestStarRating(name, totalSan) >= 3
}
