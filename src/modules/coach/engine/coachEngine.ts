import type {
  CoachInsight,
  TitanScore,
  TitanScoreBreakdown,
} from '../types/coach'

type CoachEngineInput = {
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
  const hasEnoughData =
    input.proteinConsumedG > 0 ||
    input.caloriesConsumedKcal > 0 ||
    input.hydrationConsumedMl > 0 ||
    input.sleepMinutes !== null ||
    input.workoutStatus === 'completed' ||
    input.cardioStatus === 'completed'

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
  }

  if (!hasEnoughData) {
    return {
      value: null,
      label: 'Sem dados',
      breakdown,
    }
  }

  const value = clampScore(
    breakdown.nutrition * 0.3 +
      breakdown.hydration * 0.2 +
      breakdown.training * 0.25 +
      breakdown.cardio * 0.1 +
      breakdown.recovery * 0.15,
  )

  const label =
    value >= 85
      ? 'Excelente'
      : value >= 70
        ? 'Bom'
        : value >= 50
          ? 'Atenção'
          : 'Crítico'

  return { value, label, breakdown }
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
      priority: 'high',
      title:
        input.pendingMeals === 1
          ? 'Existe 1 refeição pendente'
          : `Existem ${input.pendingMeals} refeições pendentes`,
      message:
        'Resolva cada pendência como consumida, parcial, substituída ou não realizada.',
      actionLabel: 'Abrir nutrição',
      actionPath: '/nutrition',
    })
  }

  if (input.currentMinutes >= 12 * 60 && hydrationRatio < 0.35) {
    insights.push({
      id: 'hydration-low',
      priority: 'high',
      title: 'Hidratação abaixo do esperado',
      message: `Você registrou ${Math.round(
        input.hydrationConsumedMl / 100,
      ) / 10} L de ${input.hydrationTargetMl / 1000} L.`,
      actionLabel: 'Registrar água',
      actionPath: '/',
    })
  }

  if (input.currentMinutes >= 16 * 60 && proteinRatio < 0.55) {
    const missingProtein = Math.max(
      0,
      input.proteinTargetG - input.proteinConsumedG,
    )

    insights.push({
      id: 'protein-low',
      priority: 'medium',
      title: 'Proteína atrasada',
      message: `Ainda faltam aproximadamente ${missingProtein} g para a meta diária.`,
      actionLabel: 'Revisar refeições',
      actionPath: '/nutrition',
    })
  }

  if (
    input.workoutStatus === 'planned' &&
    input.plannedWorkoutMinutes !== null &&
    input.currentMinutes >= input.plannedWorkoutMinutes - 30
  ) {
    insights.push({
      id: 'workout-soon',
      priority: 'medium',
      title: 'Treino se aproxima',
      message:
        'Revise o pré-treino, hidrate-se e prepare a primeira carga do treino.',
      actionLabel: 'Abrir treino',
      actionPath: '/training',
    })
  }

  if (input.workoutStatus === 'started') {
    insights.push({
      id: 'workout-running',
      priority: 'high',
      title: 'Treino em andamento',
      message:
        'Continue registrando cada série com carga, repetições e RIR.',
      actionLabel: 'Continuar treino',
      actionPath: '/training',
    })
  }

  if (input.cardioStatus === 'started') {
    insights.push({
      id: 'cardio-running',
      priority: 'medium',
      title: 'Cardio em andamento',
      message:
        'Finalize a sessão registrando duração, distância, esforço e frequência cardíaca.',
      actionLabel: 'Continuar cardio',
      actionPath: '/cardio',
    })
  }

  if (
    input.sleepMinutes !== null &&
    input.sleepMinutes < input.sleepTargetMinutes * 0.8
  ) {
    insights.push({
      id: 'sleep-low',
      priority: 'medium',
      title: 'Sono abaixo da meta',
      message:
        'Reduza a intensidade se a recuperação estiver comprometida e priorize o horário de dormir.',
    })
  }

  if (insights.length === 0) {
    insights.push({
      id: 'on-track',
      priority: 'low',
      title: 'Dia sob controle',
      message:
        'Continue registrando suas ações. O Coach ajustará as prioridades conforme o dia evoluir.',
    })
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 }

  return insights.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  )
}
