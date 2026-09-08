/**
 * OJT training topics catalog — shared list for Track-1 Add Schedule.
 * Trainers pick topics; Training can add/edit for client needs.
 */

import { nid } from '../mis/store.js'

const KEY = 'training:ojt-topic-catalog'

export type OjtTopic = {
  id: string
  sort: number
  category: string
  title: string
  active: boolean
  /** Added for a client suggestion / site need */
  clientSuggested: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return url && token ? { url, token } : null
}

async function redis(command: unknown[]): Promise<{ result?: unknown } | null> {
  const cfg = redisConfig()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  const d = await redis(['GET', key])
  if (d?.result && typeof d.result === 'string') {
    try {
      return JSON.parse(d.result) as T
    } catch {
      return fallback
    }
  }
  return fallback
}

async function setJson(key: string, value: unknown): Promise<boolean> {
  const d = await redis(['SET', key, JSON.stringify(value)])
  return d?.result === 'OK'
}

const SEED_ROWS: { category: string; title: string }[] = [
  { category: 'Motivation & job', title: 'Why security job is important' },
  { category: 'Motivation & job', title: 'Why OJT helps keep your posting' },
  { category: 'Motivation & job', title: 'How training helps client & company' },
  { category: 'Motivation & job', title: 'Discipline, punctuality & honesty' },
  { category: 'Turnout & behaviour', title: 'Uniform & turnout' },
  { category: 'Turnout & behaviour', title: 'Personal grooming' },
  { category: 'Turnout & behaviour', title: 'Personal hygiene on duty' },
  { category: 'Turnout & behaviour', title: 'Soft skills — polite & firm' },
  { category: 'Turnout & behaviour', title: 'Mobile / social media rules' },
  { category: 'Visitors & access', title: 'Visitor management' },
  { category: 'Visitors & access', title: 'Angry / irritated visitors' },
  { category: 'Visitors & access', title: 'Access control (gate / restricted)' },
  { category: 'Visitors & access', title: 'VIP movement access control' },
  { category: 'Visitors & access', title: 'Frisking — method & respect' },
  { category: 'Visitors & access', title: 'Bag and material checking' },
  { category: 'Vehicles', title: 'Vehicle checking' },
  { category: 'Vehicles', title: 'Vehicle movement & parking' },
  { category: 'Vehicles', title: 'Material movement with vehicles' },
  { category: 'Post & records (SLA)', title: 'HOTO (handing / taking over)' },
  { category: 'Post & records (SLA)', title: 'Registers & record keeping' },
  { category: 'Post & records (SLA)', title: 'Incident reporting' },
  { category: 'Post & records (SLA)', title: 'Patrolling & observation' },
  { category: 'Post & records (SLA)', title: 'Emergency communication' },
  { category: 'Post & records (SLA)', title: 'Security levels (Normal → Alert → High)' },
  { category: 'Fire & bomb', title: 'Fire drill & evacuation' },
  { category: 'Fire & bomb', title: 'Fire extinguisher points' },
  { category: 'Fire & bomb', title: 'Bomb threat call handling' },
  { category: 'Fire & bomb', title: 'Suspicious bag / object' },
  { category: 'First aid', title: 'First aid — heat stroke / sunstroke' },
  { category: 'First aid', title: 'First aid — snake bite' },
  { category: 'First aid', title: 'First aid — dog / animal bite' },
  { category: 'First aid', title: 'First aid — bleeding, burns, fainting' },
  { category: 'Travel & special duty', title: 'Travel safety with women employees' },
  { category: 'Travel & special duty', title: 'Protect your traveller' },
  { category: 'Travel & special duty', title: 'Driver security duties' },
  { category: 'Travel & special duty', title: 'STF / quick response support' },
  { category: 'Travel & special duty', title: 'Unusual person / vehicle reporting' },
  { category: 'Industry / site', title: 'Bank & ATM security' },
  { category: 'Industry / site', title: 'Pharma industry security' },
  { category: 'Industry / site', title: 'Automobile industry security' },
  { category: 'Industry / site', title: 'IT / office campus security' },
  { category: 'Industry / site', title: 'Hotel security' },
  { category: 'Industry / site', title: 'Hospital security' },
  { category: 'Industry / site', title: 'School / college campus security' },
  { category: 'Industry / site', title: 'Plant / infrastructure security (cement, fertiliser, etc.)' },
  /** Appended (do not insert mid-list — seed ids ojt-tNN stay stable). */
  { category: 'Turnout & behaviour', title: 'ID card Importance' },
]

/** Correct older catalog spellings / wording when loading (by exact old title). */
const TOPIC_TITLE_SPELLING_FIXES: Record<string, string> = {
  'Bag / material checking': 'Bag and material checking',
  'First aid — heat / sun stroke': 'First aid — heat stroke / sunstroke',
  'First aid - heat / sun stroke': 'First aid — heat stroke / sunstroke',
  'Travel safety with lady employees': 'Travel safety with women employees',
  'Security levels (Normal→Alert→High)': 'Security levels (Normal → Alert → High)',
  'ID card importance': 'ID card Importance',
  'Id card importance': 'ID card Importance',
  'ID Card importance': 'ID card Importance',
  'ID card Improtance': 'ID card Importance',
  'ID card improtance': 'ID card Importance',
  'Id Card Importance': 'ID card Importance',
  'I.D. card Importance': 'ID card Importance',
  'I.D card Importance': 'ID card Importance',
  'Identity card Importance': 'ID card Importance',
  'Identity card importance': 'ID card Importance',
}

export const OJT_TOPIC_CATEGORIES = [
  'Motivation & job',
  'Turnout & behaviour',
  'Visitors & access',
  'Vehicles',
  'Post & records (SLA)',
  'Fire & bomb',
  'First aid',
  'Travel & special duty',
  'Industry / site',
  'Client suggested',
] as const

function seedTopics(): OjtTopic[] {
  const now = new Date().toISOString()
  return SEED_ROWS.map((row, i) => ({
    id: `ojt-t${String(i + 1).padStart(2, '0')}`,
    sort: i + 1,
    category: row.category,
    title: row.title,
    active: true,
    clientSuggested: false,
    createdBy: 'system',
    createdAt: now,
    updatedAt: now,
  }))
}

function normalizeTopic(raw: Partial<OjtTopic>, fallbackSort: number): OjtTopic {
  const now = new Date().toISOString()
  const id = String(raw.id || nid('ojtt')).slice(0, 40)
  return {
    id,
    sort: Number(raw.sort) > 0 ? Math.floor(Number(raw.sort)) : fallbackSort,
    category: String(raw.category || 'Client suggested').trim().slice(0, 80) || 'Client suggested',
    title: String(raw.title || '').trim().slice(0, 500),
    active: raw.active !== false,
    clientSuggested: Boolean(raw.clientSuggested),
    createdBy: String(raw.createdBy || '').slice(0, 120),
    createdAt: String(raw.createdAt || now).slice(0, 40),
    updatedAt: String(raw.updatedAt || now).slice(0, 40),
  }
}

function sortTopics(list: OjtTopic[]): OjtTopic[] {
  return [...list].sort((a, b) => {
    if (a.sort !== b.sort) return a.sort - b.sort
    return a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })
  })
}

/** Load catalog; seed + merge any missing system topics; fix known spellings. */
export async function loadOjtTopics(opts?: { includeInactive?: boolean }): Promise<OjtTopic[]> {
  const stored = await getJson<{ topics?: OjtTopic[] }>(KEY, { topics: [] })
  let list = Array.isArray(stored.topics) ? stored.topics.map((t, i) => normalizeTopic(t, i + 1)) : []
  list = list.filter((t) => t.title)

  const seed = seedTopics()
  const now = new Date().toISOString()
  if (!list.length) {
    await setJson(KEY, { topics: seed })
    list = seed
  } else {
    let changed = false
    list = list.map((t) => {
      let title = t.title
      const exact = TOPIC_TITLE_SPELLING_FIXES[title]
      if (exact) title = exact
      else if (/id\s*\.??\s*card/i.test(title) && /import/i.test(title) && title !== 'ID card Importance') {
        title = 'ID card Importance'
      }
      if (title !== t.title) {
        changed = true
        return { ...t, title, updatedAt: now }
      }
      return t
    })
    const have = new Set(list.map((t) => t.id))
    const haveTitle = new Set(list.map((t) => t.title.trim().toLowerCase()))
    const missing = seed.filter((s) => !have.has(s.id) && !haveTitle.has(s.title.trim().toLowerCase()))
    if (missing.length) {
      const maxSort = list.reduce((m, t) => Math.max(m, t.sort || 0), 0)
      missing.forEach((m, i) => {
        m.sort = maxSort + i + 1
      })
      list = [...list, ...missing]
      changed = true
    }
    if (changed) {
      list = sortTopics(list)
      await setJson(KEY, { topics: list })
    }
  }

  list = sortTopics(list)
  if (opts?.includeInactive) return list
  return list.filter((t) => t.active !== false)
}

export async function saveOjtTopic(
  raw: Partial<OjtTopic>,
  actorEmail: string,
): Promise<{ ok: true; topic: OjtTopic } | { ok: false; error: string }> {
  const title = String(raw.title || '').trim()
  if (!title) return { ok: false, error: 'Topic title is required.' }
  const all = await loadOjtTopics({ includeInactive: true })
  const now = new Date().toISOString()
  const existingIdx = raw.id ? all.findIndex((t) => t.id === raw.id) : -1
  let topic: OjtTopic
  if (existingIdx >= 0) {
    const prev = all[existingIdx]
    topic = normalizeTopic(
      {
        ...prev,
        ...raw,
        title,
        category: raw.category || prev.category,
        active: raw.active !== false,
        clientSuggested: raw.clientSuggested ?? prev.clientSuggested,
        updatedAt: now,
        createdBy: prev.createdBy || actorEmail,
        createdAt: prev.createdAt,
      },
      prev.sort,
    )
    all[existingIdx] = topic
  } else {
    const maxSort = all.reduce((m, t) => Math.max(m, t.sort || 0), 0)
    topic = normalizeTopic(
      {
        id: nid('ojtt'),
        sort: maxSort + 1,
        category: raw.category || 'Client suggested',
        title,
        active: true,
        clientSuggested: raw.clientSuggested !== false,
        createdBy: actorEmail,
        createdAt: now,
        updatedAt: now,
      },
      maxSort + 1,
    )
    all.push(topic)
  }
  const ok = await setJson(KEY, { topics: sortTopics(all) })
  if (!ok) return { ok: false, error: 'Could not save topic.' }
  return { ok: true, topic }
}

export async function setOjtTopicActive(
  id: string,
  active: boolean,
  actorEmail: string,
): Promise<{ ok: true; topic: OjtTopic } | { ok: false; error: string }> {
  const all = await loadOjtTopics({ includeInactive: true })
  const idx = all.findIndex((t) => t.id === id)
  if (idx < 0) return { ok: false, error: 'Topic not found.' }
  const now = new Date().toISOString()
  all[idx] = {
    ...all[idx],
    active,
    updatedAt: now,
    createdBy: all[idx].createdBy || actorEmail,
  }
  const ok = await setJson(KEY, { topics: sortTopics(all) })
  if (!ok) return { ok: false, error: 'Could not update topic.' }
  return { ok: true, topic: all[idx] }
}
