/** Extract plain text from tender documents: PDF, Word, images, plain text. */

export type TenderFileInput = {
  fileName?: string
  mimeType?: string
  base64: string
}

const MAX_BYTES = 4_000_000

function ext(name: string) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

function guessKind(fileName: string, mimeType: string): 'pdf' | 'docx' | 'doc' | 'image' | 'text' | 'unknown' {
  const e = ext(fileName)
  const m = (mimeType || '').toLowerCase()
  if (m.includes('pdf') || e === 'pdf') return 'pdf'
  if (m.includes('wordprocessingml') || e === 'docx') return 'docx'
  if (m.includes('msword') || e === 'doc') return 'doc'
  if (m.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic'].includes(e)) return 'image'
  if (m.startsWith('text/') || e === 'txt') return 'text'
  return 'unknown'
}

function pdfFallbackText(buf: Buffer): string {
  const raw = buf.toString('latin1')
  const chunks: string[] = []
  const re = /\(([^()\\]{3,200})\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw))) {
    const t = m[1].replace(/\\(\d{3})/g, (_, o) => String.fromCharCode(Number(o))).trim()
    if (/[a-zA-Z]{3}/.test(t)) chunks.push(t)
  }
  const stream = raw.match(/stream[\s\S]{0,80000}?endstream/g) || []
  for (const block of stream.slice(0, 40)) {
    const words = block.match(/[A-Za-z][A-Za-z0-9 ,./:-]{8,}/g)
    if (words) chunks.push(...words.slice(0, 80))
  }
  return chunks.join('\n').replace(/\s+/g, ' ').trim()
}

async function textFromPdf(buf: Buffer): Promise<string> {
  try {
    const { extractText, getDocumentProxy } = await import('unpdf')
    const pdf = await getDocumentProxy(new Uint8Array(buf))
    const { text } = await extractText(pdf, { mergePages: true })
    const joined = Array.isArray(text) ? text.join('\n\n') : String(text ?? '')
    if (joined.trim().length >= 80) return joined.trim()
  } catch {
    /* fallback below */
  }
  const fb = pdfFallbackText(buf)
  if (fb.length >= 60) return fb
  throw new Error('Could not read this PDF. Try saving as Word or take a clear photo.')
}

async function textFromDocx(buf: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer: buf })
  const text = String(result.value ?? '').trim()
  if (text.length < 40) throw new Error('Word file looks empty. Check the file and try again.')
  return text
}

async function textFromDoc(buf: Buffer): Promise<string> {
  try {
    return await textFromDocx(buf)
  } catch {
    /* legacy .doc binary below */
  }
  const chunks: string[] = []
  const latin = buf.toString('latin1')
  const ascii = latin.match(/[\x20-\x7E]{6,}/g)
  if (ascii) chunks.push(...ascii.filter((s) => /[a-zA-Z]{3}/.test(s)))
  for (let i = 0; i < buf.length - 1; i += 2) {
    const c = buf[i] + (buf[i + 1] << 8)
    if (c >= 32 && c < 127) chunks.push(String.fromCharCode(c))
    else if (c === 10 || c === 13) chunks.push('\n')
  }
  const text = chunks.join(' ').replace(/\s+/g, ' ').replace(/ ([A-Z][a-z])/g, '\n$1').trim()
  if (text.length >= 40) return text
  throw new Error('Old Word .doc could not be read. Save as .docx or PDF, or upload a photo.')
}

async function visionOcr(buf: Buffer, mimeType: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) {
    throw new Error(
      'Image upload needs AI vision (OPENAI_API_KEY). For now, paste text or use PDF/Word.',
    )
  }
  const b64 = buf.toString('base64')
  const mime = mimeType?.startsWith('image/') ? mimeType : 'image/jpeg'
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'This is an Indian government or private tender notice or agreement page. Extract ALL readable text exactly as written. Include dates, EMD amounts, eligibility, document lists, online/offline submission, single/two bid. Return plain text only.',
            },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.1,
    }),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Could not read image (${res.status}). ${err.slice(0, 120)}`)
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = data.choices?.[0]?.message?.content?.trim() || ''
  if (text.length < 40) throw new Error('Could not read enough text from this image. Use a clearer photo.')
  return text
}

/** Read document bytes into plain text for tender AI. */
export async function textFromTenderFile(input: TenderFileInput): Promise<{ text: string; method: string }> {
  const raw = String(input.base64 ?? '').replace(/^data:[^;]+;base64,/, '').trim()
  if (!raw) throw new Error('No file received. Please choose PDF, Word, or image.')
  const buf = Buffer.from(raw, 'base64')
  if (!buf.length) throw new Error('File is empty.')
  if (buf.length > MAX_BYTES) throw new Error('File is too big (max 4 MB). Paste the tender text in the box instead, or use a smaller PDF.')

  const fileName = String(input.fileName ?? 'document').slice(0, 200)
  const mimeType = String(input.mimeType ?? '').slice(0, 120)
  const kind = guessKind(fileName, mimeType)

  if (kind === 'text') {
    return { text: buf.toString('utf8').trim(), method: 'text' }
  }
  if (kind === 'pdf') {
    return { text: await textFromPdf(buf), method: 'pdf' }
  }
  if (kind === 'docx') {
    return { text: await textFromDocx(buf), method: 'docx' }
  }
  if (kind === 'doc') {
    return { text: await textFromDoc(buf), method: 'doc' }
  }
  if (kind === 'image') {
    return { text: await visionOcr(buf, mimeType), method: 'image-ocr' }
  }
  throw new Error('Unsupported file type. Use PDF, Word (.docx), or image (JPG/PNG).')
}
