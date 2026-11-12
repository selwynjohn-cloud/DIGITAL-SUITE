#!/usr/bin/env node
/**
 * Lock: morning and evening Security News films are one sharp YouTube file.
 * No small WhatsApp copy of the film.
 * Run: npm run check:security-news-film
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(resolve(root, rel), 'utf8')
}

function fail(msg) {
  throw new Error(msg)
}

const show = read('security-news-youtube/show.py')
if (!show.includes('def _yt_video()')) fail('show.py must keep _yt_video for the YouTube film')
if (!show.includes('"-preset", "medium"') || !show.includes('"-crf", "14"')) {
  fail('the YouTube film must stay medium quality, crf 14')
}
const ytUses = show.split('*_yt_video()').length - 1
if (ytUses < 4) fail('story, reader, and thank-you pictures must use _yt_video')

const server = read('security-news-youtube/server.py')
const job = server.slice(server.indexOf('def render_job'))
if (job.includes('_whatsapp_copy(')) fail('render_job must not make a WhatsApp copy of the film')
if (!job.includes('The clear film is on the Desktop')) {
  fail('render_job must say the clear film is ready, not two films')
}
if (!job.includes('thoughts.thought_for') || !job.includes('show.thought_card')) {
  fail('the film must show Thought for the Day after the job card')
}
const thoughts = read('security-news-youtube/thoughts.py')
if ((thoughts.match(/"theme":/g) || []).length !== 31) fail('thoughts.py must keep all 31 days')
if (!thoughts.includes('AGILE SENTINEL- DAILY SECURITY BRIEFING AND MOTIVATION')) {
  fail('the thought card heading must stay Agile Sentinel')
}
if (!job.includes('thoughts.HEADING')) fail('the film must use the Agile Sentinel heading')
if (!job.includes('_film_name(') || !job.includes('~/Desktop')) {
  fail('each news film must go in its own Desktop folder named like 4 Nov-6.00 am')
}
if (!server.includes("def _film_name") || !server.includes("{day.day} {day.strftime('%b')}-{hour}")) {
  fail('_film_name must put the date first, then the time')
}
if (job.includes('show.register_qr_card')) {
  fail('the old Register QR slide must stay off the long film')
}
if (!job.includes('show.hiring_register_card') || !job.includes('register-qr-agile.png')) {
  fail('every long film must end with the hiring Register Now card')
}
if (!job.includes('festivalSafety') || !job.includes('show.poster_card') || !job.includes('festival-safety-alert.jpg')) {
  fail('the next film must be able to show and read the festival safety poster')
}
const festSpeak = job.slice(job.indexOf('festivalSafety'), job.indexOf('Adding the hiring card'))
if (festSpeak.includes('9248707070')) {
  fail('the festival card must not speak 9248707070')
}
const nextFilm = read('security-news-youtube/next-film.json')
if (!nextFilm.includes('"festivalSafety"')) {
  fail('next-film.json must keep the festival safety switch')
}
if (!job.includes('_write_youtube_pack') || !server.includes('short_register_card')) {
  fail('the Short must show the Register QR')
}
if (!show.includes('def register_qr_card') || !show.includes('https://www.securityjob.co.in/#register')) {
  fail('the film QR must open Register Now')
}
if (show.includes('outsourcing-apply') || job.includes('outsourcing-apply')) {
  fail('the film QR must not open an outsourcing letter')
}

const rule = read('.cursor/rules/security-news-daily-films.mdc')
if (!rule.includes('YouTube words.txt')) fail('each news folder must include YouTube words.txt')
if (!rule.includes('Please follow up our news channel for detailed news and more flash news. www.agilegroup.co.in')) {
  fail('the Short must keep the follow line under the picture')
}
if (!rule.includes('running cheetah')) fail('the Short logo must stay the running cheetah')
if (!rule.includes('the heading is the story she is reading')) {
  fail('the Short heading must be the story she is reading')
}
if (!show.includes('def story_heading')) fail('each story heading must come from the story she is reading')
if (!job.includes('show.story_heading(title, spoken)')) fail('the film heading must be that story, not a standing label')
if (!job.includes('show.heading_strip(head_line, head)')) fail('the short heading on each card must be the story she is reading')
const shortCard = show.slice(show.indexOf('def short_register_card'), show.indexOf('def _whole_words'))
if (shortCard.includes('add_text("JOB OPENINGS"')) fail('the Short must not open with Job openings while she reads the news')
if (!shortCard.includes('add_text("Job openings"')) fail('Job openings must sit with Register Now on the Short')
const order = [
  'Positive and Pride of India',
  'Major accidents, attacks, fires and deaths',
  'Bank and ATM thefts',
  'Floods, weather and IMD rain alerts',
  'Strikes, protests and public order',
  'Major arrests and law enforcement',
  'Earthquakes',
  'Sports highlights',
  'Gold and silver rates',
  'Operational takeaways for Agile Group',
]
let at = 0
for (const part of order) {
  const next = rule.indexOf(part, at)
  if (next < 0) fail('the daily film order must keep: ' + part)
  at = next
}
if (!rule.includes('last 18 hours')) fail('flash news must stay inside the last 18 hours')

console.log('security news film: one sharp YouTube file, morning and evening')
