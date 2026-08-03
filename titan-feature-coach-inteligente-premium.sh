#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Coach Inteligente Premium"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".titan-backups/coach-inteligente-$STAMP"

mkdir -p \
  "$BACKUP_DIR" \
  docs/features \
  src/modules/coach/components \
  src/modules/coach/data \
  src/modules/coach/engine \
  src/modules/coach/hooks \
  src/modules/coach/pages \
  src/modules/coach/types

for item in \
  src/modules/coach \
  src/modules/dashboard \
  src/app/App.tsx \
  src/modules/settings/pages/SettingsPage.tsx \
  docs; do
  if [ -e "$item" ]; then
    cp -R "$item" "$BACKUP_DIR/"
  fi
done

cat > src/modules/coach/types/coach.ts <<'EOF'
export type CoachPriority = 'high' | 'medium' | 'low'
export type CoachCategory =
  | 'nutrition'
  | 'hydration'
  | 'training'
  | 'cardio'
  | 'recovery'
  | 'consistency'

export type CoachInsight = {
  id: string
  category: CoachCategory
  priority: CoachPriority
  title: string
  message: string
  evidence: string
  actionLabel?: string
  actionPath?: string
}

export type TitanScoreBreakdown = {
  nutrition: number
  hydration: number
  training: number
  cardio: number
  recovery: number
  consistency: number
}

export type TitanScore = {
  value: number | null
  label: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico' | 'Sem dados'
  breakdown: TitanScoreBreakdown
}

export type CoachTrend = {
  id: string
  title: string
  direction: 'up' | 'down' | 'stable'
  message: string
}

export type CoachReport = {
  generatedAt: string
  dailyInsights: CoachInsight[]
  weeklyTrends: CoachTrend[]
  score: TitanScore
  executiveSummary: string
}
EOF

cat > src/modules/coach/data/coachRepository.ts <<'EOF'
import {
  getTitanCurrentMinutes,
  getTitanLocalDate,
  timeToMinutes,
} from '../../../database/date'
import { titanDatabase } from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import {
  calculateTitanScore,
  generateCoachInsights,
  generateExecutiveSummary,
  generateWeeklyTrends,
} from '../engine/coachEngine'
import type { CoachReport } from '../types/coach'

function getPreviousDates(count: number) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Manaus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const dates: string[] = []

  for (let index = 0; index < count; index += 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    dates.push(formatter.format(date))
  }

  return dates
}

export async function getCoachReport(): Promise<CoachReport | null> {
  const localDate = getTitanLocalDate()
  const lastSevenDates = getPreviousDates(7)

  const [
    dailyPlan,
    meals,
    mealEntries,
    hydrationEntries,
    sleepEntry,
    workout,
    workoutSession,
    cardioPlan,
    cardioSession,
    bodyMetrics,
    weeklyMeals,
    weeklyHydration,
    weeklySleep,
    weeklyWorkouts,
    weeklyCardio,
  ] = await Promise.all([
    titanDatabase.dailyPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.mealPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .toArray(),
    titanDatabase.mealEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .toArray(),
    titanDatabase.hydrationEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .toArray(),
    titanDatabase.sleepEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.workoutPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.workoutSessions
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.cardioPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.cardioSessions
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.bodyMetrics
      .where('userId')
      .equals(TITAN_USER_ID)
      .toArray(),
    titanDatabase.mealEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => lastSevenDates.includes(item.localDate))
      .toArray(),
    titanDatabase.hydrationEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => lastSevenDates.includes(item.localDate))
      .toArray(),
    titanDatabase.sleepEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => lastSevenDates.includes(item.localDate))
      .toArray(),
    titanDatabase.workoutSessions
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => lastSevenDates.includes(item.localDate))
      .toArray(),
    titanDatabase.cardioSessions
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => lastSevenDates.includes(item.localDate))
      .toArray(),
  ])

  if (!dailyPlan) return null

  const currentMinutes = getTitanCurrentMinutes()

  const mealEntryByPlanId = new Map(
    mealEntries.map((entry) => [entry.mealPlanId, entry]),
  )

  const pendingMeals = meals.filter(
    (meal) =>
      !mealEntryByPlanId.has(meal.id) &&
      timeToMinutes(meal.plannedTime) < currentMinutes,
  ).length

  const caloriesConsumedKcal = mealEntries.reduce(
    (sum, item) => sum + item.caloriesKcal,
    0,
  )

  const proteinConsumedG = mealEntries.reduce(
    (sum, item) => sum + item.proteinG,
    0,
  )

  const hydrationConsumedMl = hydrationEntries.reduce(
    (sum, item) => sum + item.amountMl,
    0,
  )

  const workoutStatus =
    workoutSession?.status === 'completed'
      ? 'completed'
      : workoutSession?.status === 'started'
        ? 'started'
        : workout
          ? 'planned'
          : 'none'

  const cardioStatus =
    cardioSession?.status === 'completed'
      ? 'completed'
      : cardioSession?.status === 'started'
        ? 'started'
        : cardioPlan
          ? 'planned'
          : 'none'

  const completedMeals = mealEntries.filter(
    (item) => item.status !== 'skipped',
  ).length

  const consistency =
    meals.length > 0
      ? Math.round((completedMeals / meals.length) * 100)
      : 0

  const engineInput = {
    currentMinutes,
    proteinConsumedG,
    proteinTargetG: dailyPlan.proteinTargetG,
    caloriesConsumedKcal,
    calorieTargetKcal: dailyPlan.calorieTargetKcal,
    hydrationConsumedMl,
    hydrationTargetMl: dailyPlan.hydrationTargetMl,
    sleepMinutes: sleepEntry?.durationMinutes ?? null,
    sleepTargetMinutes: dailyPlan.sleepTargetMinutes,
    pendingMeals,
    workoutStatus,
    cardioStatus,
    plannedWorkoutMinutes: workout
      ? timeToMinutes(workout.plannedTime)
      : null,
    consistency,
  } as const

  const score = calculateTitanScore(engineInput)
  const dailyInsights = generateCoachInsights(engineInput)

  const weeklyTrends = generateWeeklyTrends({
    dates: lastSevenDates,
    proteinTargetG: dailyPlan.proteinTargetG,
    hydrationTargetMl: dailyPlan.hydrationTargetMl,
    sleepTargetMinutes: dailyPlan.sleepTargetMinutes,
    mealEntries: weeklyMeals,
    hydrationEntries: weeklyHydration,
    sleepEntries: weeklySleep,
    workoutSessions: weeklyWorkouts,
    cardioSessions: weeklyCardio,
    bodyMetrics,
  })

  return {
    generatedAt: new Date().toISOString(),
    dailyInsights,
    weeklyTrends,
    score,
    executiveSummary: generateExecutiveSummary({
      score,
      insights: dailyInsights,
      trends: weeklyTrends,
    }),
  }
}
EOF

cat > src/modules/coach/engine/coachEngine.ts <<'EOF'
import type {
  CoachInsight,
  CoachReport,
  CoachTrend,
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
  consistency: number
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
        : clampScore(
            ratio(input.sleepMinutes, input.sleepTargetMinutes) * 100,
          ),
    consistency: clampScore(input.consistency),
  }

  if (!hasEnoughData) {
    return {
      value: null,
      label: 'Sem dados',
      breakdown,
    }
  }

  const value = clampScore(
    breakdown.nutrition * 0.25 +
      breakdown.hydration * 0.15 +
      breakdown.training * 0.2 +
      breakdown.cardio * 0.1 +
      breakdown.recovery * 0.15 +
      breakdown.consistency * 0.15,
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

  if (input.currentMinutes >= 12 * 60 && hydrationRatio < 0.35) {
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

  if (input.currentMinutes >= 16 * 60 && proteinRatio < 0.55) {
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
    input.currentMinutes >= input.plannedWorkoutMinutes - 30
  ) {
    insights.push({
      id: 'workout-soon',
      category: 'training',
      priority: 'medium',
      title: 'Treino se aproxima',
      message:
        'Revise hidratação, refeição pré-treino e primeira carga.',
      evidence: 'O horário planejado está a menos de 30 minutos.',
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
    input.sleepMinutes < input.sleepTargetMinutes * 0.8
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

  if (input.consistency < 50) {
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
      title: 'Dia sob controle',
      message:
        'Continue registrando suas ações para preservar a qualidade da análise.',
      evidence: 'Nenhum desvio prioritário foi detectado.',
    })
  }

  const order = { high: 0, medium: 1, low: 2 }

  return insights
    .sort((a, b) => order[a.priority] - order[b.priority])
    .slice(0, 5)
}

export function generateWeeklyTrends(
  input: WeeklyTrendInput,
): CoachTrend[] {
  const trends: CoachTrend[] = []

  const proteinByDay = input.dates.map((date) =>
    input.mealEntries
      .filter((item) => item.localDate === date)
      .reduce((sum, item) => sum + item.proteinG, 0),
  )

  const hydrationByDay = input.dates.map((date) =>
    input.hydrationEntries
      .filter((item) => item.localDate === date)
      .reduce((sum, item) => sum + item.amountMl, 0),
  )

  const sleepByDay = input.dates
    .map((date) =>
      input.sleepEntries.find((item) => item.localDate === date),
    )
    .filter(
      (item): item is NonNullable<typeof item> => item !== undefined,
    )
    .map((item) => item.durationMinutes)

  const proteinAverage =
    proteinByDay.reduce((sum, value) => sum + value, 0) /
    input.dates.length

  const hydrationAverage =
    hydrationByDay.reduce((sum, value) => sum + value, 0) /
    input.dates.length

  const sleepAverage =
    sleepByDay.length > 0
      ? sleepByDay.reduce((sum, value) => sum + value, 0) /
        sleepByDay.length
      : null

  trends.push({
    id: 'weekly-protein',
    title: 'Proteína semanal',
    direction:
      proteinAverage >= input.proteinTargetG * 0.9
        ? 'up'
        : proteinAverage >= input.proteinTargetG * 0.7
          ? 'stable'
          : 'down',
    message: `Média de ${Math.round(proteinAverage)} g por dia.`,
  })

  trends.push({
    id: 'weekly-hydration',
    title: 'Hidratação semanal',
    direction:
      hydrationAverage >= input.hydrationTargetMl * 0.9
        ? 'up'
        : hydrationAverage >= input.hydrationTargetMl * 0.7
          ? 'stable'
          : 'down',
    message: `Média de ${(hydrationAverage / 1000).toLocaleString(
      'pt-BR',
      { maximumFractionDigits: 1 },
    )} L por dia.`,
  })

  trends.push({
    id: 'weekly-sleep',
    title: 'Sono semanal',
    direction:
      sleepAverage === null
        ? 'stable'
        : sleepAverage >= input.sleepTargetMinutes * 0.9
          ? 'up'
          : sleepAverage >= input.sleepTargetMinutes * 0.75
            ? 'stable'
            : 'down',
    message:
      sleepAverage === null
        ? 'Dados insuficientes de sono.'
        : `Média de ${Math.floor(sleepAverage / 60)}h${Math.round(
            sleepAverage % 60,
          )
            .toString()
            .padStart(2, '0')}.`,
  })

  const completedWorkouts = input.workoutSessions.filter(
    (item) => item.status === 'completed',
  ).length

  const completedCardio = input.cardioSessions.filter(
    (item) => item.status === 'completed',
  ).length

  trends.push({
    id: 'weekly-training',
    title: 'Treino e cardio',
    direction:
      completedWorkouts >= 4
        ? 'up'
        : completedWorkouts >= 2
          ? 'stable'
          : 'down',
    message: `${completedWorkouts} treino(s) e ${completedCardio} cardio(s) concluído(s).`,
  })

  const sortedMetrics = [...input.bodyMetrics].sort((a, b) =>
    a.localDate.localeCompare(b.localDate),
  )

  if (sortedMetrics.length >= 2) {
    const first = sortedMetrics.at(-2)!
    const latest = sortedMetrics.at(-1)!
    const difference = latest.weightKg - first.weightKg

    trends.push({
      id: 'weight-trend',
      title: 'Tendência corporal',
      direction:
        Math.abs(difference) < 0.2
          ? 'stable'
          : difference > 0
            ? 'up'
            : 'down',
      message: `Variação recente de ${difference > 0 ? '+' : ''}${difference.toLocaleString(
        'pt-BR',
        { maximumFractionDigits: 1 },
      )} kg.`,
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

  const highPriority = input.insights.filter(
    (item) => item.priority === 'high',
  )

  const negativeTrends = input.trends.filter(
    (item) => item.direction === 'down',
  )

  if (highPriority.length > 0) {
    return `O dia exige atenção imediata em ${highPriority
      .map((item) => item.title.toLowerCase())
      .join(', ')}.`
  }

  if (negativeTrends.length > 0) {
    return `O dia está controlado, mas a semana mostra queda em ${negativeTrends
      .map((item) => item.title.toLowerCase())
      .join(', ')}.`
  }

  return 'Seu dia está consistente e as tendências semanais permanecem sob controle.'
}
EOF

cat > src/modules/coach/hooks/useCoachReport.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { getCoachReport } from '../data/coachRepository'

export function useCoachReport() {
  const report = useLiveQuery(() => getCoachReport(), [], null)

  return {
    report,
    isLoading: report === undefined || report === null,
  }
}
EOF

cat > src/modules/coach/components/CoachInsightCard.tsx <<'EOF'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '../../../shared/ui'
import type { CoachInsight } from '../types/coach'

type CoachInsightCardProps = {
  insight: CoachInsight
}

const tones = {
  high: 'warning',
  medium: 'primary',
  low: 'success',
} as const

export function CoachInsightCard({
  insight,
}: CoachInsightCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
            {insight.category}
          </p>
          <h2 className="mt-2 font-bold">{insight.title}</h2>
        </div>

        <Badge tone={tones[insight.priority]}>
          {insight.priority === 'high'
            ? 'Alta'
            : insight.priority === 'medium'
              ? 'Média'
              : 'Baixa'}
        </Badge>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        {insight.message}
      </p>

      <p className="mt-3 rounded-2xl bg-white/5 p-3 text-xs leading-5 text-slate-500">
        Evidência: {insight.evidence}
      </p>

      {insight.actionLabel && insight.actionPath ? (
        <Link
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-bold text-white"
          to={insight.actionPath}
        >
          {insight.actionLabel}
          <ChevronRight size={17} aria-hidden="true" />
        </Link>
      ) : null}
    </Card>
  )
}
EOF

cat > src/modules/coach/components/CoachTrendCard.tsx <<'EOF'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
} from 'lucide-react'
import { Card } from '../../../shared/ui'
import type { CoachTrend } from '../types/coach'

type CoachTrendCardProps = {
  trend: CoachTrend
}

export function CoachTrendCard({
  trend,
}: CoachTrendCardProps) {
  const Icon =
    trend.direction === 'up'
      ? ArrowUp
      : trend.direction === 'down'
        ? ArrowDown
        : ArrowRight

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-blue-300">
          <Icon size={18} aria-hidden="true" />
        </div>

        <div>
          <h3 className="font-bold">{trend.title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {trend.message}
          </p>
        </div>
      </div>
    </Card>
  )
}
EOF

cat > src/modules/coach/pages/CoachPage.tsx <<'EOF'
import { Brain, Sparkles } from 'lucide-react'
import { Card, SectionTitle } from '../../../shared/ui'
import { ScoreBreakdown } from '../../dashboard/components/ScoreBreakdown'
import { CoachInsightCard } from '../components/CoachInsightCard'
import { CoachTrendCard } from '../components/CoachTrendCard'
import { useCoachReport } from '../hooks/useCoachReport'

export function CoachPage() {
  const { report, isLoading } = useCoachReport()

  if (isLoading || !report) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando análise...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-blue-300">
          <Brain size={22} aria-hidden="true" />
          <p className="text-sm font-bold uppercase tracking-widest">
            COACH TITAN
          </p>
        </div>

        <h1 className="mt-3 text-3xl font-black">
          Análise inteligente
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Recomendações geradas a partir dos registros reais do TITAN.
        </p>
      </header>

      <Card elevated>
        <div className="flex items-center gap-2 text-blue-300">
          <Sparkles size={18} aria-hidden="true" />
          <span className="text-sm font-bold">
            RESUMO EXECUTIVO
          </span>
        </div>

        <p className="mt-4 text-lg font-bold leading-7">
          {report.executiveSummary}
        </p>

        <div className="mt-5 flex items-end gap-3">
          <span className="text-5xl font-black">
            {report.score.value ?? '—'}
          </span>
          <span className="pb-1 text-sm font-bold text-slate-400">
            {report.score.label}
          </span>
        </div>
      </Card>

      <ScoreBreakdown breakdown={report.score.breakdown} />

      <section>
        <SectionTitle
          title="Prioridades de hoje"
          supportingText={`${report.dailyInsights.length} análises`}
        />

        <div className="space-y-3">
          {report.dailyInsights.map((insight) => (
            <CoachInsightCard
              insight={insight}
              key={insight.id}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Tendências semanais"
          supportingText={`${report.weeklyTrends.length} indicadores`}
        />

        <div className="space-y-3">
          {report.weeklyTrends.map((trend) => (
            <CoachTrendCard
              key={trend.id}
              trend={trend}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/App.tsx")
content = path.read_text()

if "CoachPage" not in content:
    content = content.replace(
        "import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'",
        """import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { CoachPage } from '../modules/coach/pages/CoachPage'""",
    )

if 'path="/coach"' not in content:
    anchor = '          <Route path="/reports" element={<ReportsPage />} />'
    content = content.replace(
        anchor,
        anchor + '\n          <Route path="/coach" element={<CoachPage />} />',
    )

path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/settings/pages/SettingsPage.tsx")
content = path.read_text()

if "Brain" not in content:
    content = content.replace(
        "  Bell,",
        "  Bell,\n  Brain,",
    )

insert = """
      <NavigationCard
        icon={<Brain size={23} aria-hidden="true" />}
        label="Coach TITAN"
        path="/coach"
      />
"""

anchor = """      <NavigationCard
        icon={<Moon"""

if 'label="Coach TITAN"' not in content:
    content = content.replace(anchor, insert + "\n" + anchor)

path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/dashboard/components/ScoreBreakdown.tsx")
content = path.read_text()

if 'label="Consistência"' not in content:
    content = content.replace(
        '<ProgressBar label="Recuperação" value={breakdown.recovery} />',
        """<ProgressBar label="Recuperação" value={breakdown.recovery} />
        <ProgressBar label="Consistência" value={breakdown.consistency} />""",
    )

path.write_text(content)
PY

cat > docs/features/COACH_INTELIGENTE_PREMIUM.md <<'EOF'
# Coach Inteligente Premium

## Incluído

- Score TITAN explicável.
- Prioridades diárias.
- Evidência utilizada em cada recomendação.
- Tendências semanais.
- Resumo executivo.
- Integração com treino, nutrição, água, cardio, sono e evolução.
- Tela dedicada do Coach.

## Arquitetura

Nesta etapa, o Coach usa um motor determinístico local. Isso evita dependência de API, custo externo e envio de dados pessoais.

## Próxima evolução

Uma camada generativa poderá ser conectada futuramente para redação mais natural, preservando o motor local como fonte de verdade.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Coach Inteligente Premium

### Added

- Tela dedicada do Coach.
- Score com consistência.
- Evidências por recomendação.
- Tendências semanais.
- Resumo executivo.
EOF

echo "🧪 Validando..."
npm run validate

echo
echo "✅ Coach Inteligente Premium aplicado."
echo "Backup: $BACKUP_DIR"
echo
echo 'Execute:'
echo 'git add .'
echo 'git commit -m "feat: deliver intelligent coach premium"'
echo 'git push'
