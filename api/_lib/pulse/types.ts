/** Shared types for the Agile Pulse news bulletin engine. */

export type NewsItem = {
  title: string
  url: string
  source: string
  time: string
  /** Unix ms when the story was published (used for 18-hour freshness rule) */
  publishedAt: number
  /** Photo from the news source (may be empty) */
  imageUrl: string
}

export type NewsSection = {
  /** Section heading in English */
  title: string
  /** Section heading in Hindi (shown small under the English one) */
  titleHindi: string
  emoji: string
  /** Background colour for the section header bar */
  headerBg: string
  items: NewsItem[]
}

export type CityTemp = {
  name: string
  tempC: number | null
}

export type WeatherBlock = {
  cities: CityTemp[]
  /** IMD alert summary text (may include source markers like [1]) */
  alertText: string
}

export type EventItem = {
  id: string
  heading: string
  text: string
  /** Image link OR /api/pulse/image?id=... for an uploaded photo */
  imageUrl: string
  /** Optional video link */
  videoUrl: string
}

export type GuardAppreciation = {
  id: string
  name: string
  guardId: string
  clientName: string
  location: string
  /** Photo link OR /api/pulse/image?id=... for an uploaded photo */
  photoUrl: string
  citation: string
}

export type QuizOption = {
  /** A, B, C, D */
  key: string
  text: string
}

export type Quiz = {
  question: string
  options: QuizOption[]
  correctKey: string
  explanation: string
}

/** A question in the rotating Security Question bank. */
export type QuizQuestion = {
  id: string
  /** 'text' or 'image' (identify-the-equipment) */
  type: 'text' | 'image'
  question: string
  /** For image questions: a picture link or /api/pulse/image?id=... */
  imageUrl: string
  options: QuizOption[]
  correctKey: string
  explanation: string
}

/** A weekly prize-draw entry (one per correct answer). */
export type QuizEntry = {
  name: string
  mobile: string
  date: string
  /** Agile guard ID — used for personalised photo on thank-you card. */
  guardId?: string
}

/** A published weekly winner (mobile shown as last 4 digits only). */
export type QuizWinner = {
  weekKey: string
  name: string
  mobileLast4: string
  date: string
  /** True when the week had no correct entries — published automatically. */
  noWinner?: boolean
}

/** A drawn winner awaiting Director approval (full mobile kept for WhatsApp only). */
export type PendingQuizWinner = {
  weekKey: string
  name: string
  mobile: string
  mobileLast4: string
  entryCount: number
  ts: number
  guardId?: string
}

/** The content managers edit in the admin portal (stored in the database). */
export type EditorialContent = {
  events: EventItem[]
  /** Up to 3 job-posting images (links or uploaded /api/pulse/image?id=...) */
  jobImages: string[]
  /** Up to 3 guard appreciations */
  guards: GuardAppreciation[]
}

export type Bulletin = {
  /** Human date, e.g. "02 July 2026 (Thursday)" */
  dateLabel: string
  /** Edition label, e.g. "Morning Edition" */
  editionLabel: string
  /** Next auto bulletin slot, e.g. "Evening Bulletin — 6:00 PM IST" */
  nextBulletinLabel: string
  flashHeadlines: string[]
  sections: NewsSection[]
  weather: WeatherBlock
  editorial: EditorialContent
  winners: QuizWinner[]
}
