import * as XLSX from 'xlsx'

export function normHeader(h: string): string {
  return String(h ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function excelSerialToDisplay(n: number): string {
  if (n >= 0 && n < 1) {
    const sec = Math.round(n * 86400)
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}${s ? `:${String(s).padStart(2, '0')}` : ''}`
  }
  if (n > 20000 && n < 80000) {
    const ms = (n - 25569) * 86400 * 1000
    const d = new Date(ms)
    if (!Number.isNaN(d.getTime())) {
      if (d.getUTCFullYear() <= 1900) {
        return d.toISOString().slice(11, 19)
      }
      return d.toISOString().slice(0, 19).replace('T', ' ')
    }
  }
  return String(n)
}

export function cellStr(v: unknown): string {
  if (v == null) return ''
  if (v instanceof Date) {
    if (v.getFullYear() <= 1900) {
      const h = v.getHours()
      const m = v.getMinutes()
      const s = v.getSeconds()
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}${s ? `:${String(s).padStart(2, '0')}` : ''}`
    }
    return v.toISOString().slice(0, 19).replace('T', ' ')
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    if ((v >= 0 && v < 1) || (v > 20000 && v < 80000)) return excelSerialToDisplay(v)
  }
  return String(v).trim()
}

export function sheetRows(buffer: ArrayBuffer): unknown[][] {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][]
}

/** Guess field from Work360 export header text (late start / left post reports). */
export function inferDutyField(header: string): string {
  const h = normHeader(header)
  if (!h) return ''
  if (/employeename|staffname|guardname|personname|username|^name$/.test(h)) return 'guardName'
  if (/employeeid|empid|empcode|employeecode|employeeno|biometricid|userid/.test(h)) return 'employeeId'
  if (h === 'employee' || h === 'empcode' || h === 'empid') return 'employeeId'
  if (h === 'staff' || h === 'user' || h === 'guard') return 'guardName'
  if (/clientname|^client$|companyname/.test(h)) return 'client'
  if (/unitname|sitename|^unit$|^site$|locationname|worklocation/.test(h)) return 'unit'
  if (/actualstart|actualin|actualtime|actualpunch|actualcheckin|intimeactual/.test(h)) return 'dutyStartTime'
  if (/scheduled|shiftstart|expectedin|rosterin|plannedin|dutytime|shifttime|expectedtime/.test(h)) return 'scheduledTime'
  if (/^intime$|punchin|checkin|starttime|punchtime|reporttime|reportingtime|dutyin|startduty/.test(h)) return 'dutyStartTime'
  if (/distance|awayfrom|geofence|deviation|outofloc|outdistance|radius|kmfrom|kilometer|distin/.test(h)) return 'kmFromPost'
  if (/meter|metre/.test(h) && !/parameter|perimeter|diameter/.test(h)) return 'kmFromPost'
  if (/latereport|latereporting|latetime/.test(h)) return 'dutyStartTime'
  if (/missinghour|totalmissing/.test(h)) return 'missingHours'
  if (/leftnotreturn|notreturned|leftpost/.test(h)) return 'statusRaw'
  if (/^fromtime$|leftat|lefttime/.test(h)) return 'leftAt'
  if (/^totime$|returnedat|returntime|backtime/.test(h)) return 'returnedAt'
  if (/postname/.test(h)) return 'unit'
  if (/shiftname/.test(h)) return 'shift'
  if (/^time$|timestamp|datetime|outtime|violationtime|detectedtime|incidenttime|eventtime/.test(h)) return 'incidentTime'
  if (/attendance|status|dailystatus|punchstatus/.test(h)) return 'statusRaw'
  if (/actual/.test(h) && /time|in|start|punch/.test(h)) return 'dutyStartTime'
  if (/shift|schedule|expected|roster|planned/.test(h) && /time|in|start/.test(h)) return 'scheduledTime'
  return ''
}

export function mapSheetRows(
  rows: unknown[][],
  headerMap: Record<string, string>,
  minHeaderHits = 2,
): Record<string, string>[] {
  let headerRow = -1
  const colMap: Record<number, string> = {}
  const colHeaders: string[] = []

  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const row = rows[r]
    if (!Array.isArray(row)) continue
    let hits = 0
    const trial: Record<number, string> = {}
    const headers: string[] = []
    for (let c = 0; c < row.length; c++) {
      const hdr = cellStr(row[c])
      headers[c] = hdr
      const field = headerMap[normHeader(hdr)] || inferDutyField(hdr)
      if (field) {
        trial[c] = field
        hits++
      }
    }
    if (hits >= minHeaderHits) {
      headerRow = r
      Object.assign(colMap, trial)
      headers.forEach((h, i) => {
        colHeaders[i] = h
      })
      break
    }
  }

  if (headerRow < 0) {
    for (let r = 0; r < Math.min(rows.length, 30); r++) {
      const row = rows[r]
      if (!Array.isArray(row)) continue
      let hits = 0
      const trial: Record<number, string> = {}
      const headers: string[] = []
      for (let c = 0; c < row.length; c++) {
        const hdr = cellStr(row[c])
        headers[c] = hdr
        const field = headerMap[normHeader(hdr)] || inferDutyField(hdr)
        if (field) {
          trial[c] = field
          hits++
        }
      }
      if (hits >= 1) {
        headerRow = r
        Object.assign(colMap, trial)
        headers.forEach((h, i) => {
          colHeaders[i] = h
        })
        break
      }
    }
  }

  if (headerRow < 0) return []

  const out: Record<string, string>[] = []
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r]
    if (!Array.isArray(row)) continue
    const rec: Record<string, string> = {}
    let any = false
    for (let c = 0; c < row.length; c++) {
      let field = colMap[c]
      const hdr = colHeaders[c] || cellStr(rows[headerRow]?.[c])
      if (!field && hdr) field = inferDutyField(hdr)
      if (!field) continue
      const val = cellStr(row[c])
      if (!val) continue
      any = true
      if (!rec[field]) rec[field] = val
      else if (field === 'remarks') rec[field] = `${rec[field]} · ${val}`.slice(0, 300)
    }
    if (any) out.push(rec)
  }
  return out
}
