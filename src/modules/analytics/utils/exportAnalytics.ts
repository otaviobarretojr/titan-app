import type { AnalyticsSummary } from '../types/analytics'

export type ReportPeriod = 'weekly' | 'monthly'

const escapeCsv = (value: string | number | boolean | null) => {
  const text = value === null ? '' : String(value)
  return /[,"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const download = (
  content: string | Uint8Array,
  type: string,
  extension: string,
) => {
  const blobContent: BlobPart =
    typeof content === 'string'
      ? content
      : new Uint8Array(content).buffer

  const url = URL.createObjectURL(
    new Blob([blobContent], { type }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `titan-analytics-${new Date().toISOString().slice(0, 10)}.${extension}`
  anchor.click()
  URL.revokeObjectURL(url)
}

const exportRows = (summary: AnalyticsSummary) => summary.days.map((day) => [
  day.localDate, day.titanScore, day.weightKg, day.waistCm, day.strengthKg,
  day.proteinG, day.hydrationMl, day.caloriesKcal, day.sleepMinutes,
])

export function downloadAnalyticsCsv(summary: AnalyticsSummary) {
  const header = ['data', 'score_titan', 'peso_kg', 'cintura_cm', 'forca_1rm_kg', 'proteina_g', 'agua_ml', 'calorias_kcal', 'sono_min']
  download([header, ...exportRows(summary)].map((row) => row.map(escapeCsv).join(',')).join('\n'), 'text/csv;charset=utf-8', 'csv')
}

export function downloadAnalyticsJson(summary: AnalyticsSummary) {
  download(JSON.stringify({ exportedAt: new Date().toISOString(), source: 'TITAN IndexedDB', ...summary }, null, 2), 'application/json', 'json')
}

const ascii = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '').replace(/[()\\]/g, '\\$&')

/** Produces a small, dependency-free PDF entirely in the browser. */
export function createAnalyticsPdf(summary: AnalyticsSummary, period: ReportPeriod): Uint8Array {
  const count = period === 'weekly' ? 7 : 30
  const days = summary.days.slice(-count)
  const label = period === 'weekly' ? 'Relatorio semanal' : 'Relatorio mensal'
  const average = (selector: (day: AnalyticsSummary['days'][number]) => number | null) => {
    const values = days.map(selector).filter((value): value is number => value !== null)
    return values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : null
  }
  const lines = [
    `TITAN - ${label}`,
    `Periodo: ${days[0]?.localDate ?? '-'} a ${days.at(-1)?.localDate ?? '-'}`,
    `Score medio: ${average((day) => day.titanScore) ?? '-'}/100`,
    `Proteina media: ${average((day) => day.proteinG) ?? '-'} g`,
    `Agua media: ${average((day) => day.hydrationMl) ?? '-'} ml`,
    `Calorias medias: ${average((day) => day.caloriesKcal) ?? '-'} kcal`,
    `Sono medio: ${average((day) => day.sleepMinutes) ?? '-'} min`,
    `Treinos: ${days.filter((day) => day.workoutCompleted).length} | Cardios: ${days.filter((day) => day.cardioCompleted).length}`,
    '', 'Historico:',
    ...days.slice(-18).map((day) => `${day.localDate}  Score ${day.titanScore ?? '-'}  Peso ${day.weightKg ?? '-'}kg  Forca ${day.strengthKg ?? '-'}kg`),
  ]
  const stream = `BT /F1 12 Tf 48 790 Td 16 TL ${lines.map((line, index) => `${index ? 'T* ' : ''}(${ascii(line)}) Tj`).join(' ')} ET`
  const objects = ['', '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
  let pdf = '%PDF-1.4\n'; const offsets = [0]
  for (let index = 1; index < objects.length; index += 1) { offsets[index] = pdf.length; pdf += `${index} 0 obj\n${objects[index]}\nendobj\n` }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer << /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(pdf)
}

export function downloadAnalyticsPdf(summary: AnalyticsSummary, period: ReportPeriod) {
  download(createAnalyticsPdf(summary, period), 'application/pdf', 'pdf')
}
