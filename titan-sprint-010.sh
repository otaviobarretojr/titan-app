#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Sprint 010: Integrated Dashboard + Coach Engine"

mkdir -p \
  docs/sprints \
  src/modules/coach/engine \
  src/modules/coach/types

cat > src/modules/coach/types/coach.ts <<'EOF'
export type CoachPriority = 'high' | 'medium' | 'low'

export type CoachInsight = {
  id: string
  priority: CoachPriority
  title: string
  message: string
  actionLabel?: string
  actionPath?: string
}

export type TitanScoreBreakdown = {
  nutrition: number
  hydration: number
  training: number
  cardio: number
  recovery: number
}

export type TitanScore = {
  value: number | null
  label: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico' | 'Sem dados'
  breakdown: TitanScoreBreakdown
}
EOF

cat > src/modules/coach/engine/coachEngine.ts <<'EOF'
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
EOF

cat > src/modules/dashboard/types/dashboard.ts <<'EOF'
import type {
  CoachInsight,
  TitanScore,
} from '../../coach/types/coach'

export type DashboardMeal = {
  id: string
  name: string
  plannedTime: string
  caloriesKcal: number
  proteinG: number
  carbohydrateG: number
  fatG: number
}

export type DashboardWorkout = {
  id: string
  name: string
  plannedTime: string
  exerciseCount: number
  estimatedDurationMinutes: number
  status: 'planned' | 'started' | 'completed'
}

export type DashboardCardio = {
  id: string
  title: string
  plannedTime: string
  targetDurationMinutes: number
  status: 'planned' | 'started' | 'completed'
}

export type DashboardSummary = {
  caloriesConsumedKcal: number
  proteinConsumedG: number
  hydrationConsumedMl: number
  sleepMinutes: number | null
  calorieTargetKcal: number
  proteinTargetG: number
  hydrationTargetMl: number
  sleepTargetMinutes: number
}

export type DashboardData = {
  userName: string
  nextMeal: DashboardMeal | null
  workout: DashboardWorkout | null
  cardio: DashboardCardio | null
  insights: CoachInsight[]
  score: TitanScore
  summary: DashboardSummary
}
EOF

cat > src/modules/dashboard/data/dashboardRepository.ts <<'EOF'
import {
  getTitanCurrentMinutes,
  getTitanLocalDate,
  timeToMinutes,
} from '../../../database/date'
import {
  titanDatabase,
  type HydrationEntryRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import {
  calculateTitanScore,
  generateCoachInsights,
} from '../../coach/engine/coachEngine'
import type { DashboardData } from '../types/dashboard'

export async function getDashboardData(): Promise<DashboardData | null> {
  const localDate = getTitanLocalDate()

  const [
    user,
    dailyPlan,
    meals,
    mealEntries,
    workout,
    workoutSession,
    cardioPlan,
    cardioSession,
    hydrationEntries,
    sleepEntry,
  ] = await Promise.all([
    titanDatabase.users.get(TITAN_USER_ID),
    titanDatabase.dailyPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.mealPlans
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .sortBy('sequence'),
    titanDatabase.mealEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .toArray(),
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
    titanDatabase.hydrationEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .toArray(),
    titanDatabase.sleepEntries
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
  ])

  if (!user || !dailyPlan) return null

  const currentMinutes = getTitanCurrentMinutes()

  const mealEntryByPlanId = new Map(
    mealEntries.map((entry) => [entry.mealPlanId, entry]),
  )

  const unresolvedMeals = meals.filter(
    (meal) => !mealEntryByPlanId.has(meal.id),
  )

  const pendingMeals = unresolvedMeals.filter(
    (meal) => timeToMinutes(meal.plannedTime) < currentMinutes,
  )

  const nextMeal =
    unresolvedMeals.find(
      (meal) => timeToMinutes(meal.plannedTime) >= currentMinutes,
    ) ??
    unresolvedMeals[0] ??
    null

  const caloriesConsumedKcal = mealEntries.reduce(
    (total, entry) => total + entry.caloriesKcal,
    0,
  )
  const proteinConsumedG = mealEntries.reduce(
    (total, entry) => total + entry.proteinG,
    0,
  )
  const hydrationConsumedMl = hydrationEntries.reduce(
    (total, entry) => total + entry.amountMl,
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
    pendingMeals: pendingMeals.length,
    workoutStatus,
    cardioStatus,
    plannedWorkoutMinutes: workout
      ? timeToMinutes(workout.plannedTime)
      : null,
  } as const

  return {
    userName: user.displayName,
    nextMeal: nextMeal
      ? {
          id: nextMeal.id,
          name: nextMeal.name,
          plannedTime: nextMeal.plannedTime,
          caloriesKcal: nextMeal.caloriesKcal,
          proteinG: nextMeal.proteinG,
          carbohydrateG: nextMeal.carbohydrateG,
          fatG: nextMeal.fatG,
        }
      : null,
    workout: workout
      ? {
          id: workout.id,
          name: workout.name,
          plannedTime: workout.plannedTime,
          exerciseCount: workout.exerciseCount,
          estimatedDurationMinutes: workout.estimatedDurationMinutes,
          status:
            workoutStatus === 'none' ? 'planned' : workoutStatus,
        }
      : null,
    cardio: cardioPlan
      ? {
          id: cardioPlan.id,
          title: cardioPlan.title,
          plannedTime: cardioPlan.plannedTime,
          targetDurationMinutes: cardioPlan.targetDurationMinutes,
          status: cardioStatus === 'none' ? 'planned' : cardioStatus,
        }
      : null,
    insights: generateCoachInsights(engineInput),
    score: calculateTitanScore(engineInput),
    summary: {
      caloriesConsumedKcal,
      proteinConsumedG,
      hydrationConsumedMl,
      sleepMinutes: sleepEntry?.durationMinutes ?? null,
      calorieTargetKcal: dailyPlan.calorieTargetKcal,
      proteinTargetG: dailyPlan.proteinTargetG,
      hydrationTargetMl: dailyPlan.hydrationTargetMl,
      sleepTargetMinutes: dailyPlan.sleepTargetMinutes,
    },
  }
}

export async function addHydration(amountMl: number) {
  if (!Number.isFinite(amountMl) || amountMl <= 0) {
    throw new Error('Quantidade de água inválida.')
  }

  const now = new Date().toISOString()

  const entry: HydrationEntryRecord = {
    id: `hydration-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate: getTitanLocalDate(),
    amountMl,
    consumedAt: now,
    createdAt: now,
    updatedAt: now,
  }

  await titanDatabase.hydrationEntries.add(entry)
}
EOF

cat > src/modules/dashboard/components/CoachCard.tsx <<'EOF'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '../../../shared/ui'
import type { CoachInsight } from '../../coach/types/coach'

type CoachCardProps = {
  insight: CoachInsight
}

const tones = {
  high: 'warning',
  medium: 'primary',
  low: 'success',
} as const

export function CoachCard({ insight }: CoachCardProps) {
  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-600/25 to-cyan-400/5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-300">
          <Sparkles size={18} aria-hidden="true" />
          <span className="text-sm font-bold">COACH TITAN</span>
        </div>

        <Badge tone={tones[insight.priority]}>
          {insight.priority === 'high'
            ? 'Alta'
            : insight.priority === 'medium'
              ? 'Média'
              : 'Baixa'}
        </Badge>
      </div>

      <h2 className="mt-3 text-xl font-bold">{insight.title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        {insight.message}
      </p>

      {insight.actionLabel && insight.actionPath ? (
        <Link
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
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

cat > src/modules/dashboard/components/ScoreCard.tsx <<'EOF'
import { Activity } from 'lucide-react'
import { Badge, Card, ProgressBar } from '../../../shared/ui'
import type { TitanScore } from '../../coach/types/coach'

type ScoreCardProps = {
  score: TitanScore
}

const toneByLabel = {
  Excelente: 'success',
  Bom: 'primary',
  Atenção: 'warning',
  Crítico: 'warning',
  'Sem dados': 'neutral',
} as const

export function ScoreCard({ score }: ScoreCardProps) {
  return (
    <Card elevated>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300">
            <Activity size={18} aria-hidden="true" />
            <span className="text-sm font-bold">SCORE TITAN</span>
          </div>

          <p className="mt-3 text-4xl font-black">
            {score.value ?? '—'}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {score.value === null
              ? 'Registre ações para calcular o score.'
              : 'Calculado com os dados registrados hoje.'}
          </p>
        </div>

        <Badge tone={toneByLabel[score.label]}>{score.label}</Badge>
      </div>

      {score.value !== null ? (
        <div className="mt-5">
          <ProgressBar label="Performance diária" value={score.value} />
        </div>
      ) : null}
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/CardioCard.tsx <<'EOF'
import { HeartPulse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '../../../shared/ui'
import type { DashboardCardio } from '../types/dashboard'

type CardioCardProps = {
  cardio: DashboardCardio | null
}

export function CardioCard({ cardio }: CardioCardProps) {
  if (!cardio) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Nenhum cardio programado para hoje.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
          <HeartPulse size={23} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Badge tone={cardio.status === 'completed' ? 'success' : 'neutral'}>
            {cardio.plannedTime} · {cardio.status === 'completed'
              ? 'CONCLUÍDO'
              : cardio.status === 'started'
                ? 'EM ANDAMENTO'
                : 'PLANEJADO'}
          </Badge>

          <h3 className="mt-3 text-lg font-bold">{cardio.title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Meta de {cardio.targetDurationMinutes} minutos
          </p>
        </div>
      </div>

      <Link
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-white/10 px-5 font-bold text-white transition hover:bg-white/15"
        to="/cardio"
      >
        Abrir cardio
      </Link>
    </Card>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/dashboard/pages/DashboardPage.tsx")
content = path.read_text()

if "CardioCard" not in content:
    content = content.replace(
        "import { CoachCard } from '../components/CoachCard'",
        """import { CardioCard } from '../components/CardioCard'
import { CoachCard } from '../components/CoachCard'""",
    )

content = content.replace(
    """      {data.coachMessage ? (
        <CoachCard
          message={data.coachMessage.message}
          title={data.coachMessage.title}
        />
      ) : null}""",
    """      <CoachCard insight={data.insights[0]} />""",
)

content = content.replace(
    "<ScoreCard />",
    "<ScoreCard score={data.score} />",
)

if "<CardioCard cardio={data.cardio} />" not in content:
    anchor = """      <section>
        <SectionTitle title="Score TITAN" />"""
    replacement = """      <section>
        <SectionTitle title="Cardio do dia" />
        <CardioCard cardio={data.cardio} />
      </section>

""" + anchor
    content = content.replace(anchor, replacement)

path.write_text(content)
PY

cat > docs/sprints/SPRINT-010.md <<'EOF'
# Sprint 010 — Dashboard Integrado e Coach Engine

## Entregas

- Motor de recomendações.
- Prioridades alta, média e baixa.
- Score TITAN calculado.
- Integração entre Nutrição, Treino, Cardio, Água e Sono.
- Dashboard com Cardio.
- Próxima ação dinâmica.

## Critérios de aceite

- Score não aparece sem dados suficientes.
- Coach usa apenas registros reais.
- Dashboard reage automaticamente às mudanças no IndexedDB.
- Build e lint passam sem erros.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Sprint 010

### Added

- Coach Engine funcional.
- Score TITAN calculado com dados reais.
- Prioridades dinâmicas.
- Dashboard integrado com cardio, treino, nutrição, água e sono.
EOF

echo "🧪 Executando build..."
npm run build

echo "🧹 Executando lint..."
npm run lint

echo ""
echo "✅ Sprint 010 aplicada com sucesso."
echo 'Próximo comando: git add . && git commit -m "feat: integrate dashboard and coach engine" && git push'
