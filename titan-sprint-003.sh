#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Sprint 003: Local Database + Reactive Dashboard"

echo "📦 Instalando dependências..."
npm install dexie dexie-react-hooks zod

mkdir -p \
  docs/sprints \
  src/database/seeds \
  src/modules/dashboard/data \
  src/modules/dashboard/hooks \
  src/modules/dashboard/types

cat > src/modules/dashboard/types/dashboard.ts <<'EOF'
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
}

export type DashboardCoachMessage = {
  id: string
  title: string
  message: string
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
  coachMessage: DashboardCoachMessage | null
  summary: DashboardSummary
}
EOF

cat > src/database/titanDatabase.ts <<'EOF'
import Dexie, { type EntityTable } from 'dexie'

export type UserRecord = {
  id: string
  displayName: string
  createdAt: string
  updatedAt: string
}

export type DailyPlanRecord = {
  id: string
  userId: string
  localDate: string
  calorieTargetKcal: number
  proteinTargetG: number
  hydrationTargetMl: number
  sleepTargetMinutes: number
  createdAt: string
  updatedAt: string
}

export type MealPlanRecord = {
  id: string
  userId: string
  localDate: string
  name: string
  plannedTime: string
  sequence: number
  caloriesKcal: number
  proteinG: number
  carbohydrateG: number
  fatG: number
  createdAt: string
  updatedAt: string
}

export type MealEntryRecord = {
  id: string
  userId: string
  mealPlanId: string
  localDate: string
  status: 'partial' | 'completed' | 'substituted' | 'skipped'
  caloriesKcal: number
  proteinG: number
  carbohydrateG: number
  fatG: number
  completedAt: string
  createdAt: string
  updatedAt: string
}

export type WorkoutPlanRecord = {
  id: string
  userId: string
  localDate: string
  name: string
  plannedTime: string
  exerciseCount: number
  estimatedDurationMinutes: number
  createdAt: string
  updatedAt: string
}

export type HydrationEntryRecord = {
  id: string
  userId: string
  localDate: string
  amountMl: number
  consumedAt: string
  createdAt: string
  updatedAt: string
}

export type SleepEntryRecord = {
  id: string
  userId: string
  localDate: string
  durationMinutes: number
  createdAt: string
  updatedAt: string
}

export type CoachRecommendationRecord = {
  id: string
  userId: string
  localDate: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

class TitanDatabase extends Dexie {
  users!: EntityTable<UserRecord, 'id'>
  dailyPlans!: EntityTable<DailyPlanRecord, 'id'>
  mealPlans!: EntityTable<MealPlanRecord, 'id'>
  mealEntries!: EntityTable<MealEntryRecord, 'id'>
  workoutPlans!: EntityTable<WorkoutPlanRecord, 'id'>
  hydrationEntries!: EntityTable<HydrationEntryRecord, 'id'>
  sleepEntries!: EntityTable<SleepEntryRecord, 'id'>
  coachRecommendations!: EntityTable<CoachRecommendationRecord, 'id'>

  constructor() {
    super('titan-database')

    this.version(1).stores({
      users: 'id, displayName, createdAt',
      dailyPlans: 'id, userId, localDate, [userId+localDate]',
      mealPlans:
        'id, userId, localDate, plannedTime, sequence, [userId+localDate]',
      mealEntries:
        'id, userId, mealPlanId, localDate, status, [userId+localDate]',
      workoutPlans: 'id, userId, localDate, [userId+localDate]',
      hydrationEntries:
        'id, userId, localDate, consumedAt, [userId+localDate]',
      sleepEntries: 'id, userId, localDate, [userId+localDate]',
      coachRecommendations:
        'id, userId, localDate, priority, [userId+localDate]',
    })
  }
}

export const titanDatabase = new TitanDatabase()
EOF

cat > src/database/date.ts <<'EOF'
const TITAN_TIMEZONE = 'America/Manaus'

export function getTitanLocalDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TITAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Não foi possível calcular a data local do TITAN.')
  }

  return `${year}-${month}-${day}`
}

export function getTitanCurrentMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TITAN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? 0,
  )

  return hour * 60 + minute
}

export function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}
EOF

cat > src/database/seeds/seedToday.ts <<'EOF'
import { getTitanLocalDate } from '../date'
import { titanDatabase } from '../titanDatabase'

const USER_ID = 'otavio'

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function seedToday() {
  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()

  await titanDatabase.transaction(
    'rw',
    [
      titanDatabase.users,
      titanDatabase.dailyPlans,
      titanDatabase.mealPlans,
      titanDatabase.workoutPlans,
      titanDatabase.coachRecommendations,
    ],
    async () => {
      const user = await titanDatabase.users.get(USER_ID)

      if (!user) {
        await titanDatabase.users.add({
          id: USER_ID,
          displayName: 'Otávio',
          createdAt: now,
          updatedAt: now,
        })
      }

      const dailyPlan = await titanDatabase.dailyPlans
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .first()

      if (!dailyPlan) {
        await titanDatabase.dailyPlans.add({
          id: createId('daily-plan'),
          userId: USER_ID,
          localDate,
          calorieTargetKcal: 3624,
          proteinTargetG: 220,
          hydrationTargetMl: 4500,
          sleepTargetMinutes: 450,
          createdAt: now,
          updatedAt: now,
        })
      }

      const mealCount = await titanDatabase.mealPlans
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .count()

      if (mealCount === 0) {
        await titanDatabase.mealPlans.bulkAdd([
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Café da manhã',
            plannedTime: '06:15',
            sequence: 1,
            caloriesKcal: 650,
            proteinG: 45,
            carbohydrateG: 65,
            fatG: 22,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Lanche da manhã',
            plannedTime: '09:30',
            sequence: 2,
            caloriesKcal: 430,
            proteinG: 32,
            carbohydrateG: 42,
            fatG: 14,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Almoço',
            plannedTime: '12:30',
            sequence: 3,
            caloriesKcal: 850,
            proteinG: 55,
            carbohydrateG: 95,
            fatG: 22,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Pré-treino',
            plannedTime: '16:15',
            sequence: 4,
            caloriesKcal: 520,
            proteinG: 34,
            carbohydrateG: 70,
            fatG: 12,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Jantar pós-treino',
            plannedTime: '20:15',
            sequence: 5,
            caloriesKcal: 820,
            proteinG: 58,
            carbohydrateG: 88,
            fatG: 22,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('meal'),
            userId: USER_ID,
            localDate,
            name: 'Ceia',
            plannedTime: '21:30',
            sequence: 6,
            caloriesKcal: 354,
            proteinG: 26,
            carbohydrateG: 28,
            fatG: 14,
            createdAt: now,
            updatedAt: now,
          },
        ])
      }

      const workout = await titanDatabase.workoutPlans
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .first()

      if (!workout) {
        await titanDatabase.workoutPlans.add({
          id: createId('workout'),
          userId: USER_ID,
          localDate,
          name: 'Peito e tríceps',
          plannedTime: '19:00',
          exerciseCount: 7,
          estimatedDurationMinutes: 60,
          createdAt: now,
          updatedAt: now,
        })
      }

      const recommendation = await titanDatabase.coachRecommendations
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .first()

      if (!recommendation) {
        await titanDatabase.coachRecommendations.add({
          id: createId('coach'),
          userId: USER_ID,
          localDate,
          title: 'Prioridade de hoje',
          message:
            'Registre o que realmente consumir e distribua a hidratação até o treino.',
          priority: 'high',
          createdAt: now,
          updatedAt: now,
        })
      }
    },
  )
}

export const TITAN_USER_ID = USER_ID
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
import type { DashboardData } from '../types/dashboard'

export async function getDashboardData(): Promise<DashboardData | null> {
  const localDate = getTitanLocalDate()

  const [
    user,
    dailyPlan,
    meals,
    mealEntries,
    workout,
    coachMessage,
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
    titanDatabase.coachRecommendations
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

  if (!user || !dailyPlan) {
    return null
  }

  const completedMealIds = new Set(
    mealEntries
      .filter((entry) => entry.status !== 'skipped')
      .map((entry) => entry.mealPlanId),
  )

  const currentMinutes = getTitanCurrentMinutes()

  const nextMeal =
    meals.find(
      (meal) =>
        !completedMealIds.has(meal.id) &&
        timeToMinutes(meal.plannedTime) >= currentMinutes,
    ) ??
    meals.find((meal) => !completedMealIds.has(meal.id)) ??
    null

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
        }
      : null,
    coachMessage: coachMessage
      ? {
          id: coachMessage.id,
          title: coachMessage.title,
          message: coachMessage.message,
        }
      : null,
    summary: {
      caloriesConsumedKcal: mealEntries.reduce(
        (total, entry) => total + entry.caloriesKcal,
        0,
      ),
      proteinConsumedG: mealEntries.reduce(
        (total, entry) => total + entry.proteinG,
        0,
      ),
      hydrationConsumedMl: hydrationEntries.reduce(
        (total, entry) => total + entry.amountMl,
        0,
      ),
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

cat > src/modules/dashboard/hooks/useDashboard.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { seedToday } from '../../../database/seeds/seedToday'
import {
  addHydration,
  getDashboardData,
} from '../data/dashboardRepository'

export function useDashboard() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    seedToday()
      .then(() => setIsReady(true))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível preparar os dados do TITAN.',
        )
      })
  }, [])

  const data = useLiveQuery(
    () => (isReady ? getDashboardData() : null),
    [isReady],
    null,
  )

  async function registerWater(amountMl: number) {
    try {
      await addHydration(amountMl)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível registrar a água.',
      )
    }
  }

  return {
    data,
    error,
    isLoading: !error && (!isReady || data === undefined || data === null),
    registerWater,
  }
}
EOF

cat > src/modules/dashboard/components/CoachCard.tsx <<'EOF'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Button, Card } from '../../../shared/ui'

type CoachCardProps = {
  title: string
  message: string
}

export function CoachCard({ title, message }: CoachCardProps) {
  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-600/25 to-cyan-400/5">
      <div className="flex items-center gap-2 text-blue-300">
        <Sparkles size={18} aria-hidden="true" />
        <span className="text-sm font-bold">COACH TITAN</span>
      </div>

      <h2 className="mt-3 text-xl font-bold">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>

      <Button className="mt-4 min-h-11" variant="ghost">
        Ver recomendação
        <ChevronRight size={17} aria-hidden="true" />
      </Button>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/MealCard.tsx <<'EOF'
import { Utensils } from 'lucide-react'
import { Badge, Button, Card } from '../../../shared/ui'
import type { DashboardMeal } from '../types/dashboard'

type MealCardProps = {
  meal: DashboardMeal | null
}

export function MealCard({ meal }: MealCardProps) {
  if (!meal) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Nenhuma refeição pendente para hoje.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <Utensils size={23} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Badge tone="warning">
            {meal.plannedTime} · {meal.name.toUpperCase()}
          </Badge>

          <h3 className="mt-3 text-lg font-bold">Próxima refeição</h3>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {meal.caloriesKcal} kcal · {meal.proteinG} g de proteína
          </p>
        </div>
      </div>

      <Button className="mt-5" fullWidth>
        Abrir refeição
      </Button>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/WorkoutCard.tsx <<'EOF'
import { Dumbbell } from 'lucide-react'
import { Badge, Button, Card } from '../../../shared/ui'
import type { DashboardWorkout } from '../types/dashboard'

type WorkoutCardProps = {
  workout: DashboardWorkout | null
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  if (!workout) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Nenhum treino programado para hoje.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
          <Dumbbell size={24} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Badge>{workout.plannedTime} · TREINO</Badge>

          <h3 className="mt-3 text-lg font-bold">{workout.name}</h3>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {workout.exerciseCount} exercícios · aproximadamente{' '}
            {workout.estimatedDurationMinutes} minutos
          </p>
        </div>
      </div>

      <Button className="mt-5" fullWidth variant="secondary">
        Iniciar treino
      </Button>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/ScoreCard.tsx <<'EOF'
import { Activity } from 'lucide-react'
import { Badge, Card } from '../../../shared/ui'

export function ScoreCard() {
  return (
    <Card elevated>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300">
            <Activity size={18} aria-hidden="true" />
            <span className="text-sm font-bold">SCORE TITAN</span>
          </div>

          <p className="mt-3 text-4xl font-black">—</p>
          <p className="mt-1 text-sm text-slate-400">
            Dados insuficientes para calcular o score.
          </p>
        </div>

        <Badge tone="neutral">Aguardando</Badge>
      </div>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/MetricsGrid.tsx <<'EOF'
import type { ReactNode } from 'react'
import { Droplets, Dumbbell, Flame, Moon, Plus } from 'lucide-react'
import { Button, Card } from '../../../shared/ui'
import type { DashboardSummary } from '../types/dashboard'

type MetricsGridProps = {
  summary: DashboardSummary
  onAddWater: (amountMl: number) => Promise<void>
}

function formatLiters(valueMl: number) {
  return `${(valueMl / 1000).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })} L`
}

function formatSleep(valueMinutes: number | null) {
  if (valueMinutes === null) return '—'

  const hours = Math.floor(valueMinutes / 60)
  const minutes = valueMinutes % 60

  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

export function MetricsGrid({
  summary,
  onAddWater,
}: MetricsGridProps) {
  const metrics = [
    {
      icon: <Flame size={19} aria-hidden="true" />,
      label: 'Calorias',
      value: summary.caloriesConsumedKcal.toLocaleString('pt-BR'),
      target: `Meta ${summary.calorieTargetKcal.toLocaleString('pt-BR')} kcal`,
    },
    {
      icon: <Dumbbell size={19} aria-hidden="true" />,
      label: 'Proteína',
      value: `${summary.proteinConsumedG} g`,
      target: `Meta ${summary.proteinTargetG} g`,
    },
    {
      icon: <Droplets size={19} aria-hidden="true" />,
      label: 'Água',
      value: formatLiters(summary.hydrationConsumedMl),
      target: `Meta ${formatLiters(summary.hydrationTargetMl)}`,
    },
    {
      icon: <Moon size={19} aria-hidden="true" />,
      label: 'Sono',
      value: formatSleep(summary.sleepMinutes),
      target: `Meta ${formatSleep(summary.sleepTargetMinutes)}`,
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <Button
        className="mt-3"
        fullWidth
        onClick={() => onAddWater(300)}
        variant="ghost"
      >
        <Plus size={18} aria-hidden="true" />
        Registrar 300 ml de água
      </Button>
    </div>
  )
}

type MetricCardProps = {
  icon: ReactNode
  label: string
  value: string
  target: string
}

function MetricCard({
  icon,
  label,
  value,
  target,
}: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>

      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{target}</p>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/pages/DashboardPage.tsx <<'EOF'
import { Card, SectionTitle } from '../../../shared/ui'
import { CoachCard } from '../components/CoachCard'
import { MealCard } from '../components/MealCard'
import { MetricsGrid } from '../components/MetricsGrid'
import { ScoreCard } from '../components/ScoreCard'
import { WorkoutCard } from '../components/WorkoutCard'
import { useDashboard } from '../hooks/useDashboard'

function getCurrentDayLabel() {
  const value = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Manaus',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Manaus',
      hour: '2-digit',
      hour12: false,
    }).format(new Date()),
  )

  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  const { data, error, isLoading, registerWater } = useDashboard()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Não foi possível abrir o TITAN</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando seu plano de hoje...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {getCurrentDayLabel()}
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {getGreeting()}, {data.userName}
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            Sua próxima decisão está logo abaixo.
          </p>
        </div>

        <div
          aria-label="TITAN"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 font-black shadow-lg shadow-blue-600/20"
        >
          T
        </div>
      </header>

      {data.coachMessage ? (
        <CoachCard
          message={data.coachMessage.message}
          title={data.coachMessage.title}
        />
      ) : null}

      <section>
        <SectionTitle supportingText="Próxima ação" title="Agora" />
        <MealCard meal={data.nextMeal} />
      </section>

      <section>
        <SectionTitle title="Treino do dia" />
        <WorkoutCard workout={data.workout} />
      </section>

      <section>
        <SectionTitle title="Score TITAN" />
        <ScoreCard />
      </section>

      <section>
        <SectionTitle title="Resumo de hoje" />
        <MetricsGrid
          onAddWater={registerWater}
          summary={data.summary}
        />
      </section>
    </div>
  )
}
EOF

cat > docs/sprints/SPRINT-003.md <<'EOF'
# Sprint 003 — Banco local e Dashboard reativo

## Objetivo

Criar a primeira persistência real do TITAN usando IndexedDB e alimentar o Dashboard com dados locais reativos.

## Entregas

- Dexie e dexie-react-hooks.
- Schema inicial do banco.
- Seed diário idempotente.
- Próxima refeição calculada pelo horário de Manaus.
- Metas e valores consumidos lidos do banco.
- Registro rápido de 300 ml de água.
- Score sem valor inventado quando faltarem dados.

## Regras

- O seed cria planejamento, não adesão.
- Não são criados automaticamente registros de refeição, água ou sono.
- O histórico de cada data permanece separado.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Sprint 003

### Added

- IndexedDB com Dexie.
- Seed diário idempotente.
- Dashboard alimentado por dados locais.
- Registro rápido de hidratação.
- Score com estado de dados insuficientes.

### Changed

- Removidos valores demonstrativos tratados como se fossem registros reais.
EOF

echo "🧪 Executando build..."
npm run build

echo "🧹 Executando lint..."
npm run lint

echo ""
echo "✅ Sprint 003 aplicada com sucesso."
echo 'Próximo comando: git add . && git commit -m "feat: add local database and reactive dashboard" && git push'
