import type { AnalyticsSummary } from '../types/analytics'

function escapeCsv(value: string | number | boolean | null) {
  const text = value === null ? '' : String(value)

  if (
    text.includes(',') ||
    text.includes('"') ||
    text.includes('\n')
  ) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

export function downloadAnalyticsCsv(
  summary: AnalyticsSummary,
) {
  const header = [
    'data',
    'calorias_kcal',
    'proteina_g',
    'agua_ml',
    'sono_min',
    'treino_concluido',
    'cardio_concluido',
    'peso_kg',
    'cintura_cm',
  ]

  const rows = summary.days.map((day) => [
    day.localDate,
    day.caloriesKcal,
    day.proteinG,
    day.hydrationMl,
    day.sleepMinutes,
    day.workoutCompleted,
    day.cardioCompleted,
    day.weightKg,
    day.waistCm,
  ])

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n')

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `titan-analytics-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`
  anchor.click()

  URL.revokeObjectURL(url)
}
