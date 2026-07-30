import {
  GENERIC_WEATHER_ALERT,
  MAX_NEWS_AGE_MS,
  MIN_NEWS_ITEMS_TO_PUBLISH,
  PULSE_POLICY,
} from './policy.js'
import { storyFingerprint, totalNewsItems } from './news.js'
import { redisCommand } from './store.js'
import type { NewsSection, WeatherBlock } from './types.js'

export type PulseQualityReport = {
  ok: boolean
  violations: string[]
  newsCount: number
  weatherLive: boolean
}

const AUDIT_LOG_KEY = 'pulse:quality:log:v1'
const MAX_LOG = 40

function isFresh(publishedAt: number, now = Date.now()): boolean {
  return publishedAt > 0 && now - publishedAt <= MAX_NEWS_AGE_MS
}

function storiesSimilar(a: string, b: string): boolean {
  const words = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  const A = new Set(words(a))
  const B = new Set(words(b))
  if (!A.size || !B.size) return false
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  return inter / new Set([...A, ...B]).size >= 0.55
}

function looksStaleByLabel(time: string): boolean {
  return /\b([2-9]|\d{2,})\s*day/i.test(time)
}

export function isGenericWeatherAlert(text: string): boolean {
  const t = text.trim()
  return !t || t === GENERIC_WEATHER_ALERT || t.startsWith('Check the IMD website')
}

/** Scan news — returns violations (does not mutate). */
export function auditNewsSections(sections: NewsSection[]): PulseQualityReport {
  const violations: string[] = []
  const now = Date.now()
  const seenFp = new Set<string>()
  const titles: string[] = []

  for (const s of sections) {
    for (const it of s.items) {
      if (!it.publishedAt || !isFresh(it.publishedAt, now)) {
        violations.push(`Stale or undated news: "${it.title.slice(0, 60)}…"`)
      }
      if (looksStaleByLabel(it.time)) {
        violations.push(`News time label too old: "${it.title.slice(0, 50)}…" (${it.time})`)
      }
      const fp = storyFingerprint(it.title)
      if (seenFp.has(fp)) {
        violations.push(`Duplicate in bulletin: "${it.title.slice(0, 60)}…"`)
      }
      for (const prev of titles) {
        if (storiesSimilar(it.title, prev)) {
          violations.push(`Near-duplicate in bulletin: "${it.title.slice(0, 50)}…"`)
          break
        }
      }
      seenFp.add(fp)
      titles.push(it.title)
    }
  }

  const newsCount = totalNewsItems(sections)
  if (newsCount < MIN_NEWS_ITEMS_TO_PUBLISH) {
    violations.push(`Too few news items (${newsCount}; need at least ${MIN_NEWS_ITEMS_TO_PUBLISH})`)
  }

  return { ok: violations.length === 0, violations, newsCount, weatherLive: true }
}

/** Remove any item that breaks the rules — last line of defence before display. */
export function enforceNewsSections(sections: NewsSection[]): NewsSection[] {
  const now = Date.now()
  const seenFp = new Set<string>()
  const kept: string[] = []

  return sections
    .map((s) => ({
      ...s,
      items: s.items.filter((it) => {
        if (!isFresh(it.publishedAt, now)) return false
        if (looksStaleByLabel(it.time)) return false
        const fp = storyFingerprint(it.title)
        if (seenFp.has(fp)) return false
        for (const prev of kept) {
          if (storiesSimilar(it.title, prev)) return false
        }
        seenFp.add(fp)
        kept.push(it.title)
        return true
      }),
    }))
    .filter((s) => s.items.length > 0)
}

export function auditWeatherBlock(weather: WeatherBlock): PulseQualityReport {
  const violations: string[] = []
  const live = !isGenericWeatherAlert(weather.alertText)
  if (PULSE_POLICY.liveWeatherRequired && !live) {
    violations.push('Weather alert is generic — live IMD/cyclone/rain headline required')
  }
  if (!weather.cities.some((c) => c.tempC !== null)) {
    violations.push('No city temperatures loaded')
  }
  return {
    ok: violations.length === 0,
    violations,
    newsCount: 0,
    weatherLive: live,
  }
}

export function mergeReports(a: PulseQualityReport, b: PulseQualityReport): PulseQualityReport {
  const violations = [...a.violations, ...b.violations]
  return {
    ok: violations.length === 0,
    violations,
    newsCount: a.newsCount,
    weatherLive: b.weatherLive,
  }
}

export async function logQualityReport(edition: string, report: PulseQualityReport) {
  if (report.ok) return
  const entry = { at: Date.now(), edition, violations: report.violations.slice(0, 12) }
  const d = await redisCommand(['GET', AUDIT_LOG_KEY])
  let log: typeof entry[] = []
  if (d?.result && typeof d.result === 'string') {
    try {
      log = JSON.parse(d.result) as typeof entry[]
    } catch {
      log = []
    }
  }
  log.unshift(entry)
  await redisCommand(['SET', AUDIT_LOG_KEY, JSON.stringify(log.slice(0, MAX_LOG))])
}

/** Notify Director when quality gate fails (WhatsApp + optional email line in cron). */
export async function formatQualityAlert(edition: string, report: PulseQualityReport): string {
  const lines = report.violations.slice(0, 6).map((v) => `• ${v}`).join('\n')
  return (
    `⚠️ Agile Pulse quality check — ${edition}\n` +
    `The bulletin was NOT offered for SEND until fixed:\n${lines}\n\n` +
    `Rules: news ≤${PULSE_POLICY.maxNewsAgeHours}h · no repeats · live weather alert.`
  )
}

/** Load news + weather, enforce rules, retry once with fresh data if needed. */
export async function preparePulseContent(edition: string): Promise<{
  sections: NewsSection[]
  weather: WeatherBlock
  report: PulseQualityReport
}> {
  const { fetchNewsSections, invalidateNewsCache } = await import('./news.js')
  const { fetchWeather, invalidateWeatherCache } = await import('./weather.js')

  let sections = enforceNewsSections(await fetchNewsSections())
  let weather = await fetchWeather()
  let report = mergeReports(auditNewsSections(sections), auditWeatherBlock(weather))

  if (!report.ok) {
    await invalidateNewsCache()
    await invalidateWeatherCache()
    sections = enforceNewsSections(await fetchNewsSections({ forceFresh: true }))
    weather = await fetchWeather({ bypassCache: true })
    report = mergeReports(auditNewsSections(sections), auditWeatherBlock(weather))
  }

  if (!report.ok) await logQualityReport(edition, report)
  return { sections, weather, report }
}
