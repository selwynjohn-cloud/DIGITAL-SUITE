import * as XLSX from 'xlsx'

export function normHeader(h: string): string {
  return String(h ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

export function cellStr(v: unknown): string {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ')
  return String(v).trim()
}

export function sheetRows(buffer: ArrayBuffer): unknown[][] {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][]
}

export function mapSheetRows(
  rows: unknown[][],
  headerMap: Record<string, string>,
  minHeaderHits = 2,
): Record<string, string>[] {
  let headerRow = -1
  const colMap: Record<number, string> = {}

  for (let r = 0; r < Math.min(rows.length, 25); r++) {
    const row = rows[r]
    if (!Array.isArray(row)) continue
    let hits = 0
    const trial: Record<number, string> = {}
    for (let c = 0; c < row.length; c++) {
      const field = headerMap[normHeader(cellStr(row[c]))]
      if (field) {
        trial[c] = field
        hits++
      }
    }
    if (hits >= minHeaderHits) {
      headerRow = r
      Object.assign(colMap, trial)
      break
    }
  }

  if (headerRow < 0) return []

  const out: Record<string, string>[] = []
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r]
    if (!Array.isArray(row)) continue
    const rec: Record<string, string> = {}
    let any = false
    for (const [cStr, field] of Object.entries(colMap)) {
      const val = cellStr(row[Number(cStr)])
      if (val) any = true
      rec[field] = val
    }
    if (any) out.push(rec)
  }
  return out
}
