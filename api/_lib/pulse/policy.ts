/**
 * Agile Pulse — permanent editorial rules (Director).
 * All news/weather code MUST use these constants — do not hard-code elsewhere.
 */

/** No flash news older than this (hours). */
export const MAX_NEWS_AGE_HOURS = 18

export const MAX_NEWS_AGE_MS = MAX_NEWS_AGE_HOURS * 60 * 60 * 1000

/** How long to reuse a successful news fetch (minutes). */
export const NEWS_CACHE_MINUTES = 25

/** How long to reuse a weather alert (minutes). */
export const WEATHER_CACHE_MINUTES = 20

/** Remember published story fingerprints (days) — blocks repeats across editions. */
export const PUBLISHED_HISTORY_DAYS = 7

/** Minimum flash-news items before cron may offer SEND TO ALL. */
export const MIN_NEWS_ITEMS_TO_PUBLISH = 1

/** Generic text — must NOT be shown when live weather alerts exist. */
export const GENERIC_WEATHER_ALERT =
  'Check the IMD website (mausam.imd.gov.in) for the latest rainfall and weather ' +
  'warnings in your area before deployment.'

export const PULSE_POLICY = {
  maxNewsAgeHours: MAX_NEWS_AGE_HOURS,
  noRepeatInSameBulletin: true,
  noRepeatAcrossEditionsUnlessFollowUp: true,
  /** Advisory only — do not block publish when IMD has no active alert. */
  liveWeatherRequired: false,
  blockPublicationOnQualityFailure: true,
} as const
