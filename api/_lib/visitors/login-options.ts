import { escBranchHtml } from '../branch-login-options.js'
import { getTenants } from './store.js'

/** Company list for Gate / Officer PIN — same dropdown shape as branch login. */
export async function loadAvmTenantLoginOptionsHtml(): Promise<string> {
  try {
    const tenants = (await getTenants()).filter((t) => t.active !== false)
    const list = tenants.length
      ? tenants
      : [{ id: 'tenant-agile', companyName: 'Agile Security Force Private Limited' }]
    return list
      .sort((a, b) => a.companyName.localeCompare(b.companyName, 'en', { sensitivity: 'base' }))
      .map((t) => `<option value="${escBranchHtml(t.id)}">${escBranchHtml(t.companyName)}</option>`)
      .join('')
  } catch {
    return '<option value="tenant-agile">Agile Security Force Private Limited</option>'
  }
}
