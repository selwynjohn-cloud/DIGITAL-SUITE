/**
 * Apps in the same group share one emailed PIN (easier login from Command Centre).
 * Example: MIS Management + Branch Report use the same PIN.
 */
const PIN_GROUPS: string[][] = [
  ['mis', 'mis-report'],
]

export function pinAliasIds(appId: string): string[] {
  const id = String(appId ?? '').trim()
  if (!id) return ['']
  for (const group of PIN_GROUPS) {
    if (group.includes(id)) return group
  }
  return [id]
}
