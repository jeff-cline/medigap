import { PREP_STEPS } from '@/lib/mammo'

export const dynamic = 'force-dynamic'

// A real, printable PDF generated inline — no dependency, no binary asset to
// ship, and it stays in step with the guidance above because it is built from
// the same source of truth.
function esc(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    // PDF base-14 fonts are Latin-1; swap the typographic characters we use.
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/—/g, '--').replace(/–/g, '-').replace(/…/g, '...')
}

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) { lines.push(line.trim()); line = w }
    else line += ' ' + w
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

export async function GET() {
  const out: string[] = []
  const T = (x: number, y: number, size: number, font: string, s: string) =>
    out.push(`BT /${font} ${size} Tf ${x} ${y} Td (${esc(s)}) Tj ET`)

  let y = 770
  T(56, y, 22, 'F2', 'Getting ready for your mammogram'); y -= 26
  T(56, y, 10, 'F1', 'A checklist from Mammo Express - mammo.express'); y -= 30

  PREP_STEPS.forEach((s, i) => {
    if (y < 120) return
    // checkbox
    out.push(`${56} ${y - 3} 11 11 re S`)
    T(74, y, 12, 'F2', `${i + 1}. ${s.title}`); y -= 17
    for (const line of wrap(s.body, 88)) {
      if (y < 100) break
      T(74, y, 9.5, 'F1', line); y -= 13
    }
    y -= 12
  })

  y = Math.min(y, 150)
  out.push(`56 ${y} m 556 ${y} l S`); y -= 18
  T(56, y, 9, 'F2', 'If you have noticed a lump or any change, you need a diagnostic exam, not a screening one.'); y -= 13
  T(56, y, 9, 'F1', 'Contact a clinician. Mammo Express is a scheduling service, not a medical provider.'); y -= 16
  T(56, y, 8, 'F1', 'Sources: CDC, FDA, National Cancer Institute. Links at mammo.express/prepare')

  const content = out.join('\n')
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objs.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  return new Response(pdf, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="mammogram-checklist.pdf"',
      'cache-control': 'public, max-age=3600',
    },
  })
}
