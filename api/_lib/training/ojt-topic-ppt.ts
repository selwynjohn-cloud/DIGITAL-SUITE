/**
 * Visual PPT slide decks for Track-1 OJT topics.
 * Built from teaching notes — every slide uses Agile logo header + suite footer.
 */

import { SUITE_APP_FOOTER_LINE } from '../suite-app-footer.js'
import { TRAINING_TRACK1_TITLE } from './track-labels.js'
import type { OjtTeachingNote } from './ojt-teaching-notes.js'
import { TRAINING_BRAND, TRAINING_LOGO_URL } from './training-brand.js'

export const OJT_PPT_LOGO_URL = TRAINING_LOGO_URL
export const OJT_PPT_COMPANY = TRAINING_BRAND.company
export const OJT_PPT_DEPT = TRAINING_BRAND.department
export const OJT_PPT_TAGLINE = TRAINING_BRAND.tagline
export const OJT_PPT_TRACK = TRAINING_TRACK1_TITLE
export const OJT_PPT_FOOTER_LINE = SUITE_APP_FOOTER_LINE
export const OJT_PPT_SITES = 'www.agilegroup-digital.co.in · www.agilegroup.co.in · cursor.ai'

export type OjtPptSlide = {
  kind: 'title' | 'content' | 'split' | 'end'
  eyebrow?: string
  title: string
  subtitle?: string
  bullets?: string[]
  leftTitle?: string
  leftBullets?: string[]
  rightTitle?: string
  rightBullets?: string[]
  accent?: string
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out.length ? out : [[]]
}

/** Build visual PPT slides for one teaching topic. */
export function buildTopicPptSlides(note: OjtTeachingNote): OjtPptSlide[] {
  const slides: OjtPptSlide[] = [
    {
      kind: 'title',
      eyebrow: note.category,
      title: note.topic,
      subtitle: `Teaching PPT · ${OJT_PPT_TRACK}`,
      accent: '#0f766e',
    },
    {
      kind: 'content',
      eyebrow: 'Objective',
      title: 'What we want guards to take away',
      bullets: [note.objective],
      accent: '#0369a1',
    },
  ]

  chunk(note.keyPoints || [], 4).forEach((part, i, all) => {
    slides.push({
      kind: 'content',
      eyebrow: all.length > 1 ? `Key points (${i + 1}/${all.length})` : 'Key points to teach',
      title: note.topic,
      bullets: part,
      accent: '#14224f',
    })
  })

  slides.push({
    kind: 'split',
    eyebrow: 'Classroom guidance',
    title: 'Do  ·  Don’t',
    leftTitle: 'Do',
    leftBullets: note.dos || [],
    rightTitle: "Don't",
    rightBullets: note.donts || [],
    accent: '#0f766e',
  })

  if ((note.askGuards || []).length) {
    slides.push({
      kind: 'content',
      eyebrow: 'Check understanding',
      title: 'Ask the guards',
      bullets: note.askGuards,
      accent: '#a16207',
    })
  }

  slides.push({
    kind: 'end',
    eyebrow: note.category,
    title: 'Thank you',
    subtitle: note.tip
      ? `Trainer tip: ${note.tip}`
      : 'Practice on post · Be polite and firm · Report early',
    bullets: [
      'Use this PPT with the teaching notes in Training Notes.',
      'Keep examples from this site.',
      'End with 2–3 questions before dismissal.',
    ],
    accent: '#14224f',
  })

  return slides
}

/** Brand constants for embedding in the page script. */
export function ojtPptBrandJsonForPage(): string {
  return JSON.stringify({
    logoUrl: OJT_PPT_LOGO_URL,
    company: OJT_PPT_COMPANY,
    dept: OJT_PPT_DEPT,
    tagline: OJT_PPT_TAGLINE,
    track: OJT_PPT_TRACK,
    footerLine: OJT_PPT_FOOTER_LINE,
    sites: OJT_PPT_SITES,
  }).replace(/</g, '\\u003c')
}
