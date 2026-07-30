/** Legacy Google Apps + Training LMS targets (after uniform email PIN gate). */

export const RECRUITMENT_URL =
  'https://script.google.com/macros/s/AKfycbyeL3oJ423nSoqFwc_Yhjfw0o4H16fCNMiAvQ--b00yBcdZ9iK7eaj5OwkQmbDoZWs/exec'

export const DEPLOYMENT_URL =
  'https://script.google.com/macros/s/AKfycbyZYSEmhioAAM4UYaF0bRFIfn04rNst_yaShc9Iqf6_oZ7Ce69QCu5-awfS5fdwdOk/exec'

export const REVIEWS_URL =
  'https://script.google.com/macros/s/AKfycby0MYZkRDiXONTxUi2h-a9CEZYRIuN1h4Sw_7ENTPX_1s7vmrs62pWsD0RCMV-lRvDp/exec'

const TRAINING_LMS =
  process.env.TRAINING_LMS_URL?.trim() ||
  process.env.VITE_TRAINING_URL?.trim() ||
  'https://guard-training-app.vercel.app/'

const TRAINING_ACADEMY = process.env.TRAINING_ACADEMY_URL?.trim() || process.env.VITE_TRAINING_ACADEMY_URL?.trim() || ''

export function trainingTargetUrl(portal = ''): string {
  const p = String(portal ?? '').toLowerCase()
  if (TRAINING_ACADEMY) return TRAINING_ACADEMY
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
    number: '01',
    accent: '#7c3aed',
    targetUrl: RECRUITMENT_URL,
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
