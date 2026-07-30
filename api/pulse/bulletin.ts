import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getEditorial } from '../_lib/pulse/store.js'
import { getWinners } from '../_lib/pulse/quiz.js'
import { renderBulletin } from '../_lib/pulse/template.js'
import { DEFAULT_EDITORIAL, editionLabelForHour, nextBulletinLabel } from '../_lib/pulse/config.js'
import { preparePulseContent } from '../_lib/pulse/quality.js'
import { flashHeadlinesFrom } from '../_lib/pulse/news.js'
import type { Bulletin, EditorialContent, NewsSection, QuizWinner, WeatherBlock } from '../_lib/pulse/types.js'

/**
 * GET /api/pulse/bulletin — Agile Pulse HTML page (/pulse).
 * All news and weather pass permanent quality gates before display.
 */

const IST_OFFSET_MIN = 5 * 60 + 30

function istNow(): Date {
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000
  return new Date(utcMs + IST_OFFSET_MIN * 60000)
}

function dateLabel(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'long' })
  const weekday = d.toLocaleString('en-US', { weekday: 'long' })
  return `${day} ${month} ${d.getFullYear()} (${weekday})`
}

function editionLabel(d: Date): string {
  return editionLabelForHour(d.getHours())
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const now = istNow()
  const edition = editionLabel(now)
  const nextSlot = nextBulletinLabel(now.getHours())

  let editorial: EditorialContent = DEFAULT_EDITORIAL
  let winners: QuizWinner[] = []
  let sections: NewsSection[] = []
  let weather: WeatherBlock = { cities: [], alertText: '' }

  try {
    const prepared = await preparePulseContent(edition)
    sections = prepared.sections
    weather = prepared.weather
    ;[editorial, winners] = await Promise.all([getEditorial(), getWinners()])
  } catch {
    editorial = DEFAULT_EDITORIAL
    winners = []
  }

  const bulletin: Bulletin = {
    dateLabel: dateLabel(now),
    editionLabel: edition,
    nextBulletinLabel: nextSlot,
    flashHeadlines: flashHeadlinesFrom(sections),
    sections,
    weather,
    editorial,
    winners,
  }

  const html = renderBulletin(bulletin)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800')
  return res.status(200).send(html)
}
