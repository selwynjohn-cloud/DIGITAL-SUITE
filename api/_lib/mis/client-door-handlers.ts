import { Resend } from 'resend'
import { clientDoorLetterHtml, clientDoorLetterText } from '../client-door/mail.js'
import {
  clientEmailAllowed,
  listStrategicDoorSites,
  parseClientEmails,
} from '../client-door/lookup.js'
import {
  bookAsLetterSite,
  clubSitesToBooks,
  loadBookEmailMap,
  saveBookEmails,
  type ClientDoorBook,
} from '../client-door/books.js'
import { dropClientDoorInvite, saveClientDoorInvite } from '../client-door/invite.js'
import { formatClientDoorOpenedAt, loadClientDoorOpens } from '../client-door/opens.js'
import { getHodEmailsForBranch } from './digest.js'
import { MIS_DIRECTOR_CC_EMAIL } from './branch-mail-cc.js'
import { isMgmtAllBranches } from '../suite-mgmt-branch-select.js'
import { getBranches } from './store.js'
import { pinMailFrom, sendSuiteEmail } from '../suite-mail.js'
import { clientDoorTitle } from '../client-door/chrome.js'

void isMgmtAllBranches

function s(v: unknown, n = 200): string {
  return String(v ?? '').trim().slice(0, n)
}

async function listClientDoorBooks(_lockedBranchId?: string, _selectedBranchId?: string): Promise<ClientDoorBook[]> {
  const all = await listStrategicDoorSites()
  const books = clubSitesToBooks(all)
  const emailMap = await loadBookEmailMap()
  const opens = await loadClientDoorOpens()
  for (const book of books) {
    const stored = emailMap[book.id] || []
    const fromSites = book.sites.flatMap((site) => site.emails)
    book.emails = [...new Set([...stored, ...fromSites])]
    book.clientEmail = book.emails.join(', ')
    const open = opens[book.id]
    book.lastOpenedAt = open?.at || ''
    book.lastOpenedLabel = open?.at ? formatClientDoorOpenedAt(open.at) : ''
  }
  return books
}

function pickBook(books: ClientDoorBook[], id: string): ClientDoorBook | undefined {
  return books.find((b) => b.id === id) || books.find((b) => b.sites.some((site) => site.id === id))
}

async function writeBookEmails(book: ClientDoorBook, emails: string[]) {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => clientEmailAllowed(e)))]
  await saveBookEmails(book.id, unique)
  const siteIds = book.sites.map((site) => site.id)
  for (const em of unique) await saveClientDoorInvite(em, siteIds)
  return unique
}

function bookOnBranch(_book: ClientDoorBook, _lockedBranchId?: string) {
  return true
}

export async function handleClientDoorBoot(body: Record<string, unknown>, lockedBranchId?: string) {
  const branches = await getBranches(true)
  const branchId = lockedBranchId || s(body.branchId, 40)
  const books = await listClientDoorBooks(lockedBranchId, branchId)
  return {
    status: 200,
    json: {
      ok: true,
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
      sites: books.map((b) => bookAsLetterSite(b)),
      books: books.map((b) => ({
        id: b.id,
        name: b.name,
        groupLabel: b.groupLabel,
        stateLabel: b.stateLabel,
        siteCount: b.siteCount,
        emails: b.emails,
        lastOpenedLabel: b.lastOpenedLabel || '',
      })),
      doorUrl: 'https://www.agilegroup-digital.co.in/client',
    },
  }
}

export async function handleClientDoorPreview(body: Record<string, unknown>, lockedBranchId?: string) {
  const books = await listClientDoorBooks(lockedBranchId)
  const book = pickBook(books, s(body.clientId || body.bookId || body.id))
  if (!book) return { status: 404, json: { error: 'Pick a strategic client.' } }
  if (!bookOnBranch(book, lockedBranchId)) {
    return { status: 403, json: { error: 'This client is on another branch.' } }
  }
  const site = bookAsLetterSite(book)
  const email = parseClientEmails(body.email || book.clientEmail)[0] || ''
  if (!email) return { status: 400, json: { error: 'Enter the client email first.' } }
  if (clientEmailAllowed(email)) {
    await writeBookEmails(book, [...book.emails, email])
  }
  return { status: 200, json: { ok: true, html: clientDoorLetterHtml({ site, email }) } }
}

export async function handleClientDoorSend(
  body: Record<string, unknown>,
  userName: string,
  lockedBranchId?: string,
) {
  const books = await listClientDoorBooks(lockedBranchId)
  const book = pickBook(books, s(body.clientId || body.bookId || body.id))
  if (!book) return { status: 404, json: { error: 'Pick a strategic client.' } }
  if (!bookOnBranch(book, lockedBranchId)) {
    return { status: 403, json: { error: 'This client is on another branch.' } }
  }
  const typed = parseClientEmails(body.email || '')
  const emails = typed.length ? typed : book.emails
  const email = emails[0] || ''
  if (!email || !clientEmailAllowed(email)) {
    return { status: 400, json: { error: 'Enter a valid client work email.' } }
  }
  await writeBookEmails(book, [...new Set([...book.emails, ...emails])])
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { status: 503, json: { error: 'Email service not configured.' } }
  const site = bookAsLetterSite(book)
  const branchIds = [...new Set(book.sites.map((x) => x.branchId))]
  const hod: string[] = []
  for (const bid of branchIds) hod.push(...(await getHodEmailsForBranch(bid)))
  const cc = [...new Set([...hod, MIS_DIRECTOR_CC_EMAIL].filter((e) => e.includes('@') && !emails.includes(e)))]
  try {
    const resend = new Resend(apiKey)
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to: emails,
      cc,
      subject: `${clientDoorTitle(book.name)} — ${book.stateLabel}`,
      text: clientDoorLetterText({ site, email }),
      html: clientDoorLetterHtml({ site, email }),
      skipDirectorCc: true,
    })
    if ((result as { error?: { message?: string } }).error) {
      return {
        status: 502,
        json: { error: (result as { error?: { message?: string } }).error?.message || 'Could not send.' },
      }
    }
    return { status: 200, json: { ok: true, to: emails, cc, sentBy: userName } }
  } catch (err) {
    console.error('[clientDoorSend]', err)
    return { status: 502, json: { error: 'Could not send Client Door.' } }
  }
}

async function loadLockedBook(id: string, lockedBranchId?: string) {
  const books = await listClientDoorBooks(lockedBranchId)
  const book = pickBook(books, id)
  if (!book) return { error: { status: 404, json: { error: 'Pick a strategic client.' } } }
  if (!bookOnBranch(book, lockedBranchId)) {
    return { error: { status: 403, json: { error: 'This client is on another branch.' } } }
  }
  return { book }
}

export async function handleClientDoorAddEmail(body: Record<string, unknown>, lockedBranchId?: string) {
  const found = await loadLockedBook(s(body.clientId || body.bookId || body.id), lockedBranchId)
  if (found.error) return found.error
  const email = parseClientEmails(body.email)[0] || ''
  if (!email || !clientEmailAllowed(email)) {
    return { status: 400, json: { error: 'Enter a valid client work email.' } }
  }
  const emails = await writeBookEmails(found.book, [...found.book.emails, email])
  return { status: 200, json: { ok: true, emails } }
}

export async function handleClientDoorEditEmail(body: Record<string, unknown>, lockedBranchId?: string) {
  const found = await loadLockedBook(s(body.clientId || body.bookId || body.id), lockedBranchId)
  if (found.error) return found.error
  const from = parseClientEmails(body.from || body.oldEmail)[0] || ''
  const to = parseClientEmails(body.to || body.email)[0] || ''
  if (!from || !to || !clientEmailAllowed(to)) {
    return { status: 400, json: { error: 'Enter the old and new email.' } }
  }
  const next = found.book.emails.map((e) => (e === from ? to : e))
  const emails = await writeBookEmails(found.book, next)
  if (from !== to) {
    for (const site of found.book.sites) await dropClientDoorInvite(from, site.id)
  }
  return { status: 200, json: { ok: true, emails } }
}

export async function handleClientDoorDeleteEmail(body: Record<string, unknown>, lockedBranchId?: string) {
  const found = await loadLockedBook(s(body.clientId || body.bookId || body.id), lockedBranchId)
  if (found.error) return found.error
  const email = parseClientEmails(body.email)[0] || ''
  if (!email) return { status: 400, json: { error: 'Pick an email to delete.' } }
  const emails = await writeBookEmails(
    found.book,
    found.book.emails.filter((e) => e !== email),
  )
  for (const site of found.book.sites) await dropClientDoorInvite(email, site.id)
  return { status: 200, json: { ok: true, emails } }
}
