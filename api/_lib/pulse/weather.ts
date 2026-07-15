import { WEATHER_CITIES } from './config.js'
import {
  GENERIC_WEATHER_ALERT,
  MAX_NEWS_AGE_MS,
  WEATHER_CACHE_MINUTES,
} from './policy.js'
import { redisCommand } from './store.js'
import type { CityTemp, WeatherBlock } from './types.js'

export { GENERIC_WEATHER_ALERT }

const TIMEOUT_MS = 8000
const WEATHER_ALERT_CACHE_KEY = 'pulse:weather:alert:v2'
const ALERT_CACHE_MS = WEATHER_CACHE_MINUTES * 60 * 1000
const RAIN_OR_STORM_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99,
])

type CityReading = CityTemp & {
  precipMm: number
  storm: boolean
  windKmh: number | null
  humidity: number | null
}

async function fetchJson(url: string, init?: RequestInit): Promise<any | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function cityReading(city: { name: string; lat: number; lon: number }): Promise<CityReading> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}` +
    `&longitude=${city.lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m`
  const data = await fetchJson(url)
  const t = data?.current?.temperature_2m
  const precip = data?.current?.precipitation
  const code = data?.current?.weather_code
  const wind = data?.current?.wind_speed_10m
  const humidity = data?.current?.relative_humidity_2m
  const precipMm = typeof precip === 'number' ? precip : 0
  const storm = typeof code === 'number' && RAIN_OR_STORM_CODES.has(code)
  return {
    name: city.name,
    tempC: typeof t === 'number' ? Math.round(t * 10) / 10 : null,
    precipMm,
    storm,
    windKmh: typeof wind === 'number' ? Math.round(wind * 10) / 10 : null,
    humidity: typeof humidity === 'number' ? Math.round(humidity) : null,
  }
}

async function fetchTemps(): Promise<CityTemp[]> {
  const readings = await Promise.all(WEATHER_CITIES.map(cityReading))
  return readings.map(({ name, tempC }) => ({ name, tempC }))
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim()
}

function pickTag(block: string, tag: string): string {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block)
  return m ? decodeEntities(m[1]) : ''
}

function cleanHeadline(raw: string): string {
  let t = raw.trim()
  t = t.replace(/^\s*(title|url|source)\s*:\s*/i, '')
  const dash = t.lastIndexOf(' - ')
  if (dash > 20) t = t.slice(0, dash)
  return t.replace(/\s+/g, ' ').trim()
}

function parsePubMs(iso: string): number {
  const ms = new Date(iso).getTime()
  return Number.isFinite(ms) ? ms : 0
}

/** Live IMD / weather headlines from Google News (max 18 hours old). */
async function fetchLiveWeatherHeadlines(): Promise<string[]> {
  const queries = [
    'Mumbai Pune expressway OR highway closed landslide when:1d',
    'highway closed OR expressway shut landslide India when:1d',
    'IMD red alert OR orange alert India rain when:1d',
    'Hyderabad OR Mumbai OR Delhi heavy rain OR thunderstorm IMD when:1d',
    'Visakhapatnam OR Vijayawada OR Chennai OR Bangalore weather alert when:1d',
    'Odisha cyclone OR depression OR Bay of Bengal IMD when:1d',
    'flood OR landslide OR heatwave India IMD when:1d',
  ]
  const now = Date.now()
  const seen = new Set<string>()
  const out: string[] = []

  for (const q of queries) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`
    const xml = await fetchText(url)
    if (!xml) continue
    for (const raw of xml.split('<item>').slice(1, 16)) {
      const b = raw.split('</item>')[0]
      const title = cleanHeadline(pickTag(b, 'title'))
      const pub = parsePubMs(pickTag(b, 'pubDate'))
      if (!title || !pub || now - pub > MAX_NEWS_AGE_MS) continue
      const key = title.toLowerCase().slice(0, 60)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(title)
    }
  }
  return out
}

function alertFromReadings(readings: CityReading[]): string | null {
  const active = readings.filter((r) => r.storm || r.precipMm >= 1.5)
  if (!active.length) return null
  const details = active.slice(0, 6).map((r) => {
    const parts = [`${r.name} ${r.tempC ?? '—'}°C`]
    if (r.precipMm >= 0.5) parts.push(`${r.precipMm}mm rain`)
    if (r.windKmh !== null && r.windKmh >= 25) parts.push(`wind ${r.windKmh} km/h`)
    return parts.join(', ')
  })
  return `Live readings: ${details.join(' | ')}. Cross-check district IMD alerts before deployment.`
}

function composeAlert(headlines: string[], readings: CityReading[]): string {
  if (headlines.length) {
    const lead = headlines.slice(0, 2).join('. ')
    const trimmed = lead.length > 480 ? `${lead.slice(0, 477)}…` : lead
    return `${trimmed}. Fishermen and coastal teams: follow IMD port signals.`
  }
  const fromRain = alertFromReadings(readings)
  if (fromRain) return fromRain
  return GENERIC_WEATHER_ALERT
}

async function readAlertCache(): Promise<{ ts: number; text: string } | null> {
  const d = await redisCommand(['GET', WEATHER_ALERT_CACHE_KEY])
  if (!d?.result || typeof d.result !== 'string') return null
  try {
    return JSON.parse(d.result) as { ts: number; text: string }
  } catch {
    return null
  }
}

async function writeAlertCache(text: string) {
  await redisCommand(['SET', WEATHER_ALERT_CACHE_KEY, JSON.stringify({ ts: Date.now(), text })])
}

async function fetchImdAlertViaPerplexity(): Promise<string | null> {
  const key = process.env.PERPLEXITY_API_KEY?.trim()
  if (!key) return null

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
  const data = await fetchJson('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content:
            'You are an IMD weather desk assistant for private security companies across India. ' +
            'Reply in 2–3 concise sentences, plain text, no markdown. Name affected cities/states.',
        },
        {
          role: 'user',
          content:
            `For ${today}, summarise current IMD warnings across India — red/orange/yellow alerts, ` +
            `heavy rain, thunderstorms, cyclone/depression (Bay of Bengal & Arabian Sea), floods, ` +
            `heatwave. Cover Hyderabad, Mumbai, Delhi, Bangalore, Chennai, Vizag, Ahmedabad, Pune, ` +
            `Odisha coast. If no major alert, say "No major IMD red alert nationally" briefly.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.1,
    }),
  })
  const text = data?.choices?.[0]?.message?.content
  return typeof text === 'string' && text.trim() ? text.trim() : null
}

async function buildAlertText(readings: CityReading[], bypassCache = false): Promise<string> {
  if (!bypassCache) {
    const cached = await readAlertCache()
    if (cached && Date.now() - cached.ts < ALERT_CACHE_MS && cached.text !== GENERIC_WEATHER_ALERT) {
      return cached.text
    }
  }

  const [headlines, perplexity] = await Promise.all([
    fetchLiveWeatherHeadlines(),
    fetchImdAlertViaPerplexity(),
  ])

  let text = composeAlert(headlines, readings)
  // Prefer live headlines; enrich with Perplexity only if headlines sparse.
  if (headlines.length === 0 && perplexity) text = perplexity
  else if (headlines.length === 1 && perplexity) {
    text = `${headlines[0]}. ${perplexity}`
    if (text.length > 520) text = text.slice(0, 517) + '…'
  }

  await writeAlertCache(text)
  return text
}

export async function invalidateWeatherCache(): Promise<void> {
  await redisCommand(['DEL', WEATHER_ALERT_CACHE_KEY])
}

export async function fetchWeather(opts?: { bypassCache?: boolean }): Promise<WeatherBlock> {
  const readings = await Promise.all(WEATHER_CITIES.map(cityReading))
  const cities = readings.map(({ name, tempC }) => ({ name, tempC }))
  const alertText = await buildAlertText(readings, opts?.bypassCache === true)
  return { cities, alertText }
}
