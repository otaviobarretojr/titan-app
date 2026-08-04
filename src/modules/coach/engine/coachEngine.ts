import type {
  CoachInsight,
  CoachTrend,
  TitanScore,
  TitanScoreBreakdown,
} from '../types/coach'

export type CoachEngineInput = {
  currentMinutes: number
  proteinConsumedG: number
  proteinTargetG: number
  caloriesConsumedKcal: number
  calorieTargetKcal: number
  hydrationConsumedMl: number
  hydrationTargetMl: number
  sleepMinutes: number | null
  sleepTargetMinutes: number
  pendingMeals: number
  workoutStatus: 'none' | 'planned' | 'started' | 'completed'
  cardioStatus: 'none' | 'planned' | 'started' | 'completed'
  plannedWorkoutMinutes: number | null
  consistency: number
  hasNutritionData: boolean
  hasHydrationData: boolean
  hasConsistencyData: boolean
}

type WeeklyTrendInput = {
  dates: string[]
  proteinTargetG: number
  hydrationTargetMl: number
  sleepTargetMinutes: number
  mealEntries: Array<{
    localDate: string
    proteinG: number
    status: string
  }>
  hydrationEntries: Array<{
    localDate: string
    amountMl: number
  }>
  sleepEntries: Array<{
    localDate: string
    durationMinutes: number
  }>
  workoutSessions: Array<{
    localDate: string
    status: string
  }>
  cardioSessions: Array<{
    localDate: string
    status: string
  }>
  bodyMetrics: Array<{
    localDate: string
    weightKg: number
    waistCm: number | null
  }>
}

function ratio(value: number, target: number) {
  if (target <= 0) return 0

  return Math.min(1, Math.max(0, value / target))
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function calculateTitanScore(
  input: CoachEngineInput,
): TitanScore {
  const breakdown: TitanScoreBreakdown = {
    nutrition: clampScore(
      (ratio(input.proteinConsumedG, input.proteinTargetG) * 0.6 +
        ratio(input.caloriesConsumedKcal, input.calorieTargetKcal) * 0.4) *
        100,
    ),
    hydration: clampScore(
      ratio(input.hydrationConsumedMl, input.hydrationTargetMl) * 100,
    ),
    training:
      input.workoutStatus === 'completed'
        ? 100
        : input.workoutStatus === 'started'
          ? 60
          : input.workoutStatus === 'planned'
            ? 20
            : 0,
    cardio:
      input.cardioStatus === 'completed'
        ? 100
        : input.cardioStatus === 'started'
          ? 60
          : input.cardioStatus === 'planned'
            ? 20
            : 0,
    recovery:
      input.sleepMinutes === null
        ? 0
        : clampScore(ratio(input.sleepMinutes, input.sleepTargetMinutes) * 100),
    consistency: clampScore(input.consistency),
  }

  const categories = [
    input.hasNutritionData
      ? { category: 'nutrition' as const, value: breakdown.nutrition, weight: 0.25 }
      : null,
    input.hasHydrationData
      ? { category: 'hydration' as const, value: breakdown.hydration, weight: 0.15 }
      : null,
    input.workoutStatus !== 'none'
      ? { category: 'training' as const, value: breakdown.training, weight: 0.2 }
      : null,
    input.cardioStatus !== 'none'
      ? { category: 'cardio' as const, value: breakdown.cardio, weight: 0.1 }
      : null,
    input.sleepMinutes !== null
      ? { category: 'recovery' as const, value: breakdown.recovery, weight: 0.15 }
      : null,
    input.hasConsistencyData
      ? { category: 'consistency' as const, value: breakdown.consistency, weight: 0.15 }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  if (categories.length === 0) {
    return {
      value: null,
      label: 'Sem dados',
      breakdown,
      measuredCategories: [],
    }
  }

  const totalWeight = categories.reduce((sum, item) => sum + item.weight, 0)
  const value = clampScore(
    categories.reduce((sum, item) => sum + item.value * item.weight, 0) /
      totalWeight,
  )
  const label =
    value >= 85
      ? 'Excelente'
      : value >= 70
        ? 'Bom'
        : value >= 50
          ? 'Atenção'
          : 'Crítico'

  return {
    value,
    label,
    breakdown,
    measuredCategories: categories.map((item) => item.category),
  }
}

export function generateCoachInsights(
  input: CoachEngineInput,
): CoachInsight[] {
  const insights: CoachInsight[] = []

  const hydrationRatio = ratio(
    input.hydrationConsumedMl,
    input.hydrationTargetMl,
  )

  const proteinRatio = ratio(
    input.proteinConsumedG,
    input.proteinTargetG,
  )

  if (input.pendingMeals > 0) {
    insights.push({
      id: 'pending-meals',
      category: 'nutrition',
      priority: 'high',
      title:
        input.pendingMeals === 1
          ? 'Existe 1 refeição pendente'
          : `Existem ${input.pendingMeals} refeições pendentes`,
      message:
        'Resolva cada pendência como consumida, parcial, substituída ou não realizada.',
      evidence: `${input.pendingMeals} pendência(s) identificada(s) pelo horário planejado.`,
      actionLabel: 'Abrir nutrição',
      actionPath: '/nutrition',
    })
  }

  if (
    input.currentMinutes >= 12 * 60 &&
    hydrationRatio < 0.35
  ) {
    insights.push({
      id: 'hydration-low',
      category: 'hydration',
      priority: 'high',
      title: 'Hidratação abaixo do esperado',
      message:
        'Aumente o consumo gradualmente ao longo das próximas horas.',
      evidence: `${input.hydrationConsumedMl} ml registrados de ${input.hydrationTargetMl} ml.`,
      actionLabel: 'Registrar água',
      actionPath: '/nutrition',
    })
  }

  if (
    input.currentMinutes >= 16 * 60 &&
    proteinRatio < 0.55
  ) {
    insights.push({
      id: 'protein-low',
      category: 'nutrition',
      priority: 'medium',
      title: 'Proteína atrasada',
      message:
        'Distribua a proteína restante entre as próximas refeições.',
      evidence: `${input.proteinConsumedG} g registrados de ${input.proteinTargetG} g.`,
      actionLabel: 'Revisar refeições',
      actionPath: '/nutrition',
    })
  }

  if (input.workoutStatus === 'started') {
    insights.push({
      id: 'workout-running',
      category: 'training',
      priority: 'high',
      title: 'Treino em andamento',
      message:
        'Continue registrando carga, repetições e RIR em cada série.',
      evidence: 'Existe uma sessão de treino ativa.',
      actionLabel: 'Continuar treino',
      actionPath: '/training',
    })
  } else if (
    input.workoutStatus === 'planned' &&
    input.plannedWorkoutMinutes !== null &&
    input.currentMinutes >=
      input.plannedWorkoutMinutes - 30
  ) {
    insights.push({
      id: 'workout-soon',
      category: 'training',
      priority: 'medium',
      title: 'Treino se aproxima',
      message:
        'Revise hidratação, refeição pré-treino e primeira carga.',
      evidence:
        'O horário planejado está a menos de 30 minutos.',
      actionLabel: 'Abrir treino',
      actionPath: '/training',
    })
  }

  if (input.cardioStatus === 'started') {
    insights.push({
      id: 'cardio-running',
      category: 'cardio',
      priority: 'medium',
      title: 'Cardio em andamento',
      message:
        'Finalize registrando duração, distância, frequência cardíaca e esforço.',
      evidence: 'Existe uma sessão de cardio ativa.',
      actionLabel: 'Continuar cardio',
      actionPath: '/cardio',
    })
  }

  if (
    input.sleepMinutes !== null &&
    input.sleepMinutes <
      input.sleepTargetMinutes * 0.8
  ) {
    insights.push({
      id: 'sleep-low',
      category: 'recovery',
      priority: 'medium',
      title: 'Sono abaixo da meta',
      message:
        'A recuperação pode estar comprometida. Evite aumentar volume sem necessidade.',
      evidence: `${input.sleepMinutes} minutos registrados de ${input.sleepTargetMinutes}.`,
      actionLabel: 'Abrir sono',
      actionPath: '/health/sleep',
    })
  }

  if (input.hasConsistencyData && input.consistency < 50) {
    insights.push({
      id: 'consistency-low',
      category: 'consistency',
      priority: 'medium',
      title: 'Consistência baixa hoje',
      message:
        'Priorize concluir as ações essenciais antes de buscar perfeição.',
      evidence: `Consistência atual estimada em ${input.consistency}%.`,
    })
  }

  if (insights.length === 0) {
    insights.push({
      id: 'on-track',
      category: 'consistency',
      priority: 'low',
      title: 'Nenhuma prioridade detectada',
      message:
        'Continue registrando suas ações para preservar a qualidade da análise.',
      evidence:
        'Nenhum desvio prioritário foi detectado nos registros disponíveis.',
    })
  }

  const priorityOrder = {
    high: 0,
    medium: 1,
    low: 2,
  }

  return insights
    .sort(
      (first, second) =>
        priorityOrder[first.priority] -
        priorityOrder[second.priority],
    )
    .slice(0, 5)
}

export function generateWeeklyTrends(
  input: WeeklyTrendInput,
): CoachTrend[] {
  const trends: CoachTrend[] = []
  const proteinByDay = input.dates
    .map((date) => input.mealEntries
      .filter((item) => item.localDate === date && item.status !== 'skipped')
      .reduce((sum, item) => sum + item.proteinG, 0))
    .filter((value) => value > 0)
  const hydrationByDay = input.dates
    .map((date) => input.hydrationEntries
      .filter((item) => item.localDate === date)
      .reduce((sum, item) => sum + item.amountMl, 0))
    .filter((value) => value > 0)
  const sleepByDay = input.dates
    .map((date) => input.sleepEntries.find((item) => item.localDate === date))
    .filter((item): item is NonNullable<typeof item> => item !== undefined)
    .map((item) => item.durationMinutes)

  const addAverageTrend = (
    values: number[],
    id: string,
    title: string,
    target: number,
    format: (average: number) => string,
  ) => {
    if (values.length === 0) return
    const average = values.reduce((sum, value) => sum + value, 0) / values.length
    trends.push({
      id,
      title,
      direction: average >= target * 0.9 ? 'up' : average >= target * 0.7 ? 'stable' : 'down',
      message: `${format(average)} em ${values.length} dia(s) registrado(s).`,
      sampleSize: values.length,
    })
  }

  addAverageTrend(
    proteinByDay,
    'weekly-protein',
    'Proteína semanal',
    input.proteinTargetG,
    (average) => `Média de ${Math.round(average)} g`,
  )
  addAverageTrend(
    hydrationByDay,
    'weekly-hydration',
    'Hidratação semanal',
    input.hydrationTargetMl,
    (average) => `Média de ${(average / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`,
  )
  addAverageTrend(
    sleepByDay,
    'weekly-sleep',
    'Sono semanal',
    input.sleepTargetMinutes,
    (average) => `Média de ${Math.floor(average / 60)}h${Math.round(average % 60).toString().padStart(2, '0')}`,
  )

  const completedWorkouts = input.workoutSessions.filter((item) => item.status === 'completed').length
  const completedCardio = input.cardioSessions.filter((item) => item.status === 'completed').length
  const activitySampleSize = input.workoutSessions.length + input.cardioSessions.length
  if (activitySampleSize > 0) {
    trends.push({
      id: 'weekly-training',
      title: 'Treino e cardio',
      direction: completedWorkouts >= 4 ? 'up' : completedWorkouts >= 2 ? 'stable' : 'down',
      message: `${completedWorkouts} treino(s) e ${completedCardio} cardio(s) concluído(s).`,
      sampleSize: activitySampleSize,
    })
  }

  const sortedMetrics = [...input.bodyMetrics].sort((first, second) =>
    first.localDate.localeCompare(second.localDate),
  )
  if (sortedMetrics.length >= 2) {
    const previous = sortedMetrics[sortedMetrics.length - 2]
    const latest = sortedMetrics[sortedMetrics.length - 1]
    const difference = latest.weightKg - previous.weightKg
    trends.push({
      id: 'weight-trend',
      title: 'Tendência corporal',
      direction: Math.abs(difference) < 0.2 ? 'stable' : difference > 0 ? 'up' : 'down',
      message: `Variação recente de ${difference > 0 ? '+' : ''}${difference.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg.`,
      sampleSize: 2,
    })
  }

  return trends.slice(0, 5)
}

export function generateExecutiveSummary(input: {
  score: TitanScore
  insights: CoachInsight[]
  trends: CoachTrend[]
}) {
  if (input.score.value === null) {
    return 'Ainda não há dados suficientes para uma leitura confiável do dia.'
  }

  const highPriorityInsights =
    input.insights.filter(
      (item) => item.priority === 'high',
    )

  const negativeTrends =
    input.trends.filter(
      (item) => item.direction === 'down',
    )

  if (highPriorityInsights.length > 0) {
    return `O dia exige atenção imediata em ${highPriorityInsights
      .map((item) =>
        item.title.toLowerCase(),
      )
      .join(', ')}.`
  }

  if (negativeTrends.length > 0) {
    return `O dia está controlado, mas a semana mostra queda em ${negativeTrends
      .map((item) =>
        item.title.toLowerCase(),
      )
      .join(', ')}.`
  }

  return 'Seu dia está consistente e as tendências semanais permanecem sob controle.'
}
