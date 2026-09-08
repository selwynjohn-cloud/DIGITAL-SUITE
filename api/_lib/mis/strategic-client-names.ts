/**
 * Fixed Apex / Strategic Client name list (5★) — no store imports (safe for client-rules).
 */
export type StrategicClientGroup = {
  key: string
  label: string
  match: string[]
}

export const STRATEGIC_CLIENT_GROUPS: StrategicClientGroup[] = [
  { key: 'hdfc', label: 'HDFC', match: ['HDFC'] },
  { key: 'canara', label: 'Canara', match: ['CANARA'] },
  { key: 'idbi', label: 'IDBI', match: ['IDBI'] },
  {
    key: 'ultra',
    label: 'Ultra cement',
    match: ['ULTRA TECH', 'ULTRATECH', 'ADITHYA BIRLA ULTRA', 'ULTRA CEMENT'],
  },
  { key: 'aig', label: 'AIG', match: ['AIG'] },
  { key: 'premier', label: 'Premier Energies', match: ['PREMIER ENERGIES'] },
  {
    key: 'harsha',
    label: 'Harsha Toyota',
    match: ['HARSHA TOYOTA', 'HARSHA ANDHRA'],
  },
  { key: 'coromandel', label: 'Coromandel', match: ['COROMANDEL'] },
  { key: 'gemini', label: 'Gemini', match: ['GEMINI EDIBLES', 'GEMINI'] },
  { key: 'zigma', label: 'Zigma', match: ['ZIGMA'] },
  { key: 'krc', label: 'KRC', match: ['KRC'] },
]

function norm(s: string): string {
  return String(s ?? '')
    .trim()
    .toUpperCase()
}

export function matchStrategicGroup(name: string): StrategicClientGroup | null {
  const n = norm(name)
  if (!n) return null
  for (const g of STRATEGIC_CLIENT_GROUPS) {
    if (g.match.some((m) => n.includes(m))) return g
  }
  return null
}

export function isNamedStrategicClient(name: string): boolean {
  return matchStrategicGroup(name) != null
}
