import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_ORIGINS = [
  'https://guard-training-app.vercel.app',
  'https://agilegroup-digital.vercel.app',
  'https://www.agilegroup-digital.co.in',
  'http://localhost:5173',
  'http://localhost:4173',
]

export function applyTrainingCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Vary', 'Origin')
  }
}

export function handleTrainingCorsPreflight(req: VercelRequest, res: VercelResponse) {
  applyTrainingCors(req, res)
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}
