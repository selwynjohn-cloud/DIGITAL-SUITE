/** Agile Live — site weather (Open-Meteo). Not a copy of Security News. */

const WMO: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
}

const CITY_PIN: { re: RegExp; name: string; lat: number; lon: number }[] = [
  { re: /hyderabad|hi-?tech/i, name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { re: /mumbai/i, name: 'Mumbai', lat: 19.076, lon: 72.877 },
  { re: /surat/i, name: 'Surat', lat: 21.1702, lon: 72.8311 },
  { re: /chennai/i, name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { re: /puducherry|pondicherry/i, name: 'Puducherry', lat: 11.9416, lon: 79.8083 },
  { re: /bangalore|bengaluru/i, name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { re: /visakhapatnam|vizag/i, name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
  { re: /kakinada/i, name: 'Kakinada', lat: 16.9891, lon: 82.2475 },
  { re: /nellore/i, name: 'Nellore', lat: 14.4426, lon: 79.9865 },
  { re: /tada/i, name: 'Tada', lat: 13.586, lon: 80.03 },
  { re: /tirupati/i, name: 'Tirupati', lat: 13.6288, lon: 79.4192 },
  { re: /tadipatri/i, name: 'Tadipatri', lat: 14.9089, lon: 78.0105 },
  { re: /delhi/i, name: 'Delhi', lat: 28.61, lon: 77.21 },
  { re: /pune/i, name: 'Pune', lat: 18.5204, lon: 73.8567 },
]

export function liveWeatherPlace(branch: string, lat?: number | null, lng?: number | null) {
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    const city = CITY_PIN.find((c) => c.re.test(branch))
    return { name: city?.name || branch || 'Duty site', lat, lon: lng }
  }
  const city = CITY_PIN.find((c) => c.re.test(branch))
  return city || { name: branch || 'Duty site', lat: 17.385, lon: 78.4867 }
}

export async function liveWeatherReport(opts: {
  branch: string
  lat?: number | null
  lng?: number | null
}) {
  const place = liveWeatherPlace(opts.branch, opts.lat, opts.lng)
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FKolkata`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return { ok: false as const, error: 'Weather is not available now.' }
    const data = (await res.json()) as {
      current?: {
        temperature_2m?: number
        weather_code?: number
        wind_speed_10m?: number
        relative_humidity_2m?: number
        precipitation?: number
      }
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_sum?: number[] }
    }
    const code = Number(data.current?.weather_code)
    return {
      ok: true as const,
      place: place.name,
      lat: place.lat,
      lon: place.lon,
      tempC: typeof data.current?.temperature_2m === 'number' ? Math.round(data.current.temperature_2m) : null,
      text: WMO[code] || 'Weather update',
      windKmh: typeof data.current?.wind_speed_10m === 'number' ? Math.round(data.current.wind_speed_10m) : null,
      humidity: typeof data.current?.relative_humidity_2m === 'number' ? Math.round(data.current.relative_humidity_2m) : null,
      rainMm: typeof data.current?.precipitation === 'number' ? data.current.precipitation : 0,
      maxC: data.daily?.temperature_2m_max?.[0] != null ? Math.round(data.daily.temperature_2m_max[0]) : null,
      minC: data.daily?.temperature_2m_min?.[0] != null ? Math.round(data.daily.temperature_2m_min[0]) : null,
      trafficUrl: `https://www.google.com/maps/@${place.lat},${place.lon},14z/data=!5m1!1e1`,
    }
  } catch {
    return { ok: false as const, error: 'Weather is not available now.' }
  } finally {
    clearTimeout(timer)
  }
}
