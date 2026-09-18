const RESUME_STORAGE = 'jobpulse_resume'

export async function extractPdfText(file) {
  const [{ getDocument, GlobalWorkerOptions }, workerUrl] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  GlobalWorkerOptions.workerSrc = workerUrl.default
  const buffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: buffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item) => item.str).join(' ') + '\n'
  }
  return text.replace(/\s+/g, ' ').trim()
}

export function loadResume() {
  try {
    return JSON.parse(localStorage.getItem(RESUME_STORAGE)) || null
  } catch {
    return null
  }
}

export function saveResume(data) {
  localStorage.setItem(RESUME_STORAGE, JSON.stringify(data))
}

export function summarize(text, words = 80) {
  if (!text) return ''
  const clean = text.replace(/[•▪◦●]/g, ' • ')
  const parts = clean.split(/\s+/)
  return parts.slice(0, words).join(' ') + (parts.length > words ? '…' : '')
}
