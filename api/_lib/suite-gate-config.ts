/** Legacy Google Apps + Training LMS targets (after uniform email PIN gate). */

export const RECRUITMENT_URL =
  'https://script.google.com/macros/s/AKfycbyeL3oJ423nSoqFwc_Yhjfw0o4H16fCNMiAvQ--b00yBcdZ9iK7eaj5OwkQmbDoZWs/exec'

export const DEPLOYMENT_URL =
  'https://script.google.com/macros/s/AKfycbyZYSEmhioAAM4UYaF0bRFIfn04rNst_yaShc9Iqf6_oZ7Ce69QCu5-awfS5fdwdOk/exec'

export const REVIEWS_URL =
  'https://script.google.com/macros/s/AKfycby0MYZkRDiXONTxUi2h-a9CEZYRIuN1h4Sw_7ENTPX_1s7vmrs62pWsD0RCMV-lRvDp/exec'

const DEFAULT_TRAINING_LMS = 'https://guard-training-app.vercel.app/'

/** Never point the Digital Learning LMS at the suite gate itself (causes login loops). */
function resolveTrainingLmsBase(): string {
  const raw = (
    process.env.TRAINING_LMS_URL?.trim() ||
    process.env.VITE_TRAINING_URL?.trim() ||
    DEFAULT_TRAINING_LMS
  ).replace(/\/?$/, '/')
  if (/agilegroup-digital\.co\.in\/training\/?/i.test(raw)) return DEFAULT_TRAINING_LMS
  return raw || DEFAULT_TRAINING_LMS
}

const TRAINING_LMS = resolveTrainingLmsBase()

const TRAINING_ACADEMY = process.env.TRAINING_ACADEMY_URL?.trim() || process.env.VITE_TRAINING_ACADEMY_URL?.trim() || ''

export function trainingTargetUrl(portal = ''): string {
  const p = String(portal ?? '').toLowerCase()
  if (TRAINING_ACADEMY && !/agilegroup-digital\.co\.in\/training\/?/i.test(TRAINING_ACADEMY)) {
    return TRAINING_ACADEMY.replace(/\/?$/, '/')
  }
  const base = TRAINING_LMS.replace(/\/?$/, '/')
  if (p === 'trainee') return `${base}?portal=trainee`
  if (p === 'management') return `${base}?portal=management`
  return `${base}?portal=lecturer`
}

export type SuiteGateMeta = {
  appId: string
  title: string
  number: string
  accent: string
  targetUrl: string
}

export const SUITE_GATES: Record<string, Omit<SuiteGateMeta, 'targetUrl'> & { targetUrl?: string }> = {
  recruitment: {
    appId: 'recruitment',
    title: 'Agile Recruitment',
    number: '02',
    accent: '#7c3aed',
    // Suite SPA (DRR + pipeline) — never the old Google Apps Script
    targetUrl: '/recruitment/?portal=management',
  },
  deployment: {
    appId: 'deployment',
    title: 'Agile Deployment',
    number: '04',
    accent: '#9333ea',
    targetUrl: DEPLOYMENT_URL,
  },
  reviews: {
    appId: 'reviews',
    title: 'Agile Reviews',
    number: '10',
    accent: '#db2777',
    targetUrl: REVIEWS_URL,
  },
  training: {
    appId: 'training',
    title: 'Agile Training',
    number: '02',
    accent: '#0f766e',
  },
}
