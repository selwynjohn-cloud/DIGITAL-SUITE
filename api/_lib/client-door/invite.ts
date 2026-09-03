/**
 * Remember who was sent the Client door, so Send PIN works even if Master Directory
 * is slow to keep the email.
 */
const INVITE_TTL_SEC = 90 * 24 * 60 * 60

type Invite = { email: string; clientIds: string[]; at: string }

function inviteKey(email: string) {
  return `agil:client-door:invite:${email.trim().toLowerCase()}`
}

async function redisCommand(command: unknown[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    })
    if (!res.ok) return null
    return (await res.json()) as { result?: unknown }
  } catch {
    return null
  }
}

const mem = () => {
  const g = globalThis as unknown as { __clientDoorInvites?: Map<string, Invite> }
  if (!g.__clientDoorInvites) g.__clientDoorInvites = new Map()
  return g.__clientDoorInvites
}

export async function saveClientDoorInvite(email: string, clientIds: string[]): Promise<boolean> {
  const em = email.trim().toLowerCase()
  const ids = [...new Set(clientIds.map((id) => String(id || '').trim()).filter(Boolean))]
  if (!em || !ids.length) return false
  const prev = await loadClientDoorInvite(em)
  const merged = [...new Set([...(prev?.clientIds ?? []), ...ids])]
  const row: Invite = { email: em, clientIds: merged, at: new Date().toISOString() }
  const payload = JSON.stringify(row)
  const result = await redisCommand(['SET', inviteKey(em), payload, 'EX', INVITE_TTL_SEC])
  mem().set(em, row)
  return result?.result === 'OK' || true
}

export async function loadClientDoorInvite(email: string): Promise<Invite | null> {
  const em = email.trim().toLowerCase()
  if (!em) return null
  const data = await redisCommand(['GET', inviteKey(em)])
  if (typeof data?.result === 'string' && data.result) {
    try {
      return JSON.parse(data.result) as Invite
    } catch {
      /* fall through */
    }
  }
  return mem().get(em) ?? null
}

export async function dropClientDoorInvite(email: string, clientId: string): Promise<void> {
  const em = email.trim().toLowerCase()
  const id = String(clientId || '').trim()
  if (!em || !id) return
  const prev = await loadClientDoorInvite(em)
  if (!prev) return
  const next = prev.clientIds.filter((x) => x !== id)
  if (!next.length) {
    await redisCommand(['DEL', inviteKey(em)])
    mem().delete(em)
    return
  }
  const row: Invite = { email: em, clientIds: next, at: new Date().toISOString() }
  await redisCommand(['SET', inviteKey(em), JSON.stringify(row), 'EX', INVITE_TTL_SEC])
  mem().set(em, row)
}
