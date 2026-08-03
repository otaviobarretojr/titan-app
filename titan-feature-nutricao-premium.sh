#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Feature Nutrição Premium"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".titan-backups/nutrition-$STAMP"
mkdir -p "$BACKUP_DIR" docs/features src/modules/nutrition/{components,data,hooks,pages,types,utils}

for item in src/modules/nutrition src/database/titanDatabase.ts docs; do
  if [ -e "$item" ]; then
    cp -R "$item" "$BACKUP_DIR/"
  fi
done

cat > src/modules/nutrition/types/nutrition.ts <<'EOF'
export type MealStatus =
  | 'planned'
  | 'pending'
  | 'partial'
  | 'completed'
  | 'substituted'
  | 'skipped'

export type NutritionMeal = {
  id: string
  name: string
  plannedTime: string
  caloriesKcal: number
  proteinG: number
  carbohydrateG: number
  fatG: number
  status: MealStatus
  consumedCaloriesKcal: number
  consumedProteinG: number
  consumedCarbohydrateG: number
  consumedFatG: number
  completionPercentage: number
}

export type NutritionDaySummary = {
  caloriesConsumedKcal: number
  proteinConsumedG: number
  carbohydrateConsumedG: number
  fatConsumedG: number
  calorieTargetKcal: number
  proteinTargetG: number
  hydrationConsumedMl: number
  hydrationTargetMl: number
  pendingCount: number
}

export type NutritionDayData = {
  localDate: string
  meals: NutritionMeal[]
  summary: NutritionDaySummary
}
EOF

cat > src/modules/nutrition/utils/nutritionMath.ts <<'EOF'
export function getMacroPercentage(value: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((value / target) * 100)))
}

export function calculateRemainingMacros(input: {
  caloriesConsumedKcal: number
  calorieTargetKcal: number
  proteinConsumedG: number
  proteinTargetG: number
}) {
  return {
    caloriesRemainingKcal: Math.max(
      0,
      input.calorieTargetKcal - input.caloriesConsumedKcal,
    ),
    proteinRemainingG: Math.max(
      0,
      input.proteinTargetG - input.proteinConsumedG,
    ),
  }
}
EOF

cat > src/modules/nutrition/data/nutritionRepository.ts <<'EOF'
import {
  getTitanCurrentMinutes,
  getTitanLocalDate,
  timeToMinutes,
} from '../../../database/date'
import {
  titanDatabase,
  type MealEntryRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type {
  MealStatus,
  NutritionDayData,
  NutritionMeal,
} from '../types/nutrition'

function createEntryId() {
  return `meal-entry-${crypto.randomUUID()}`
}

function resolveStatus(
  mealTime: string,
  entry: MealEntryRecord | undefined,
): MealStatus {
  if (entry) return entry.status

  return timeToMinutes(mealTime) < getTitanCurrentMinutes()
    ? 'pending'
    : 'planned'
}

export async function getNutritionDayData(): Promise<NutritionDayData | null> {
  const localDate = getTitanLocalDate()

  const [dailyPlan, mealPlans, mealEntries, hydrationEntries] =
    await Promise.all([
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
      titanDatabase.hydrationEntries
        .where('[userId+localDate]')
        .equals([TITAN_USER_ID, localDate])
        .toArray(),
    ])

  if (!dailyPlan) return null

  const entryByMealId = new Map(
    mealEntries.map((entry) => [entry.mealPlanId, entry]),
  )

  const meals: NutritionMeal[] = mealPlans.map((meal) => {
    const entry = entryByMealId.get(meal.id)
    const completionPercentage =
      meal.caloriesKcal > 0
        ? Math.round(((entry?.caloriesKcal ?? 0) / meal.caloriesKcal) * 100)
        : 0

    return {
      id: meal.id,
      name: meal.name,
      plannedTime: meal.plannedTime,
      caloriesKcal: meal.caloriesKcal,
      proteinG: meal.proteinG,
      carbohydrateG: meal.carbohydrateG,
      fatG: meal.fatG,
      status: resolveStatus(meal.plannedTime, entry),
      consumedCaloriesKcal: entry?.caloriesKcal ?? 0,
      consumedProteinG: entry?.proteinG ?? 0,
      consumedCarbohydrateG: entry?.carbohydrateG ?? 0,
      consumedFatG: entry?.fatG ?? 0,
      completionPercentage,
    }
  })

  return {
    localDate,
    meals,
    summary: {
      caloriesConsumedKcal: mealEntries.reduce(
        (total, entry) => total + entry.caloriesKcal,
        0,
      ),
      proteinConsumedG: mealEntries.reduce(
        (total, entry) => total + entry.proteinG,
        0,
      ),
      carbohydrateConsumedG: mealEntries.reduce(
        (total, entry) => total + entry.carbohydrateG,
        0,
      ),
      fatConsumedG: mealEntries.reduce(
        (total, entry) => total + entry.fatG,
        0,
      ),
      calorieTargetKcal: dailyPlan.calorieTargetKcal,
      proteinTargetG: dailyPlan.proteinTargetG,
      hydrationConsumedMl: hydrationEntries.reduce(
        (total, entry) => total + entry.amountMl,
        0,
      ),
      hydrationTargetMl: dailyPlan.hydrationTargetMl,
      pendingCount: meals.filter((meal) => meal.status === 'pending').length,
    },
  }
}

async function saveMealEntry(
  mealPlanId: string,
  status: MealEntryRecord['status'],
  fraction: number,
) {
  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()
  const meal = await titanDatabase.mealPlans.get(mealPlanId)

  if (!meal || meal.userId !== TITAN_USER_ID || meal.localDate !== localDate) {
    throw new Error('Refeição não encontrada.')
  }

  const existing = await titanDatabase.mealEntries
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .filter((entry) => entry.mealPlanId === mealPlanId)
    .first()

  const entry: MealEntryRecord = {
    id: existing?.id ?? createEntryId(),
    userId: TITAN_USER_ID,
    mealPlanId,
    localDate,
    status,
    caloriesKcal: Math.round(meal.caloriesKcal * fraction),
    proteinG: Math.round(meal.proteinG * fraction),
    carbohydrateG: Math.round(meal.carbohydrateG * fraction),
    fatG: Math.round(meal.fatG * fraction),
    completedAt: now,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await titanDatabase.mealEntries.put(entry)
}

export function completeMeal(mealPlanId: string) {
  return saveMealEntry(mealPlanId, 'completed', 1)
}

export function registerPartialMeal(
  mealPlanId: string,
  percentage: number,
) {
  const normalizedPercentage = Math.min(100, Math.max(0, percentage))
  const status =
    normalizedPercentage === 100 ? 'completed' : 'partial'

  return saveMealEntry(
    mealPlanId,
    status,
    normalizedPercentage / 100,
  )
}

export function substituteMeal(mealPlanId: string) {
  return saveMealEntry(mealPlanId, 'substituted', 1)
}

export function skipMeal(mealPlanId: string) {
  return saveMealEntry(mealPlanId, 'skipped', 0)
}

export async function clearMealEntry(mealPlanId: string) {
  const localDate = getTitanLocalDate()

  const existing = await titanDatabase.mealEntries
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .filter((entry) => entry.mealPlanId === mealPlanId)
    .first()

  if (existing) {
    await titanDatabase.mealEntries.delete(existing.id)
  }
}

export async function addHydration(amountMl: number) {
  if (!Number.isFinite(amountMl) || amountMl <= 0) {
    throw new Error('Quantidade de água inválida.')
  }

  const now = new Date().toISOString()

  await titanDatabase.hydrationEntries.add({
    id: `hydration-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate: getTitanLocalDate(),
    amountMl,
    consumedAt: now,
    createdAt: now,
    updatedAt: now,
  })
}
EOF

cat > src/modules/nutrition/hooks/useNutritionDay.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { seedToday } from '../../../database/seeds/seedToday'
import {
  addHydration,
  clearMealEntry,
  completeMeal,
  getNutritionDayData,
  registerPartialMeal,
  skipMeal,
  substituteMeal,
} from '../data/nutritionRepository'

export function useNutritionDay() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    seedToday()
      .then(() => setIsReady(true))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível preparar as refeições.',
        )
      })
  }, [])

  const data = useLiveQuery(
    () => (isReady ? getNutritionDayData() : null),
    [isReady],
    null,
  )

  async function runAction(action: () => Promise<void>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar a refeição.',
      )
    }
  }

  return {
    data,
    error,
    isLoading: !error && (!isReady || data === undefined || data === null),
    completeMeal: (mealId: string) =>
      runAction(() => completeMeal(mealId)),
    registerPartialMeal: (mealId: string, percentage: number) =>
      runAction(() => registerPartialMeal(mealId, percentage)),
    substituteMeal: (mealId: string) =>
      runAction(() => substituteMeal(mealId)),
    skipMeal: (mealId: string) =>
      runAction(() => skipMeal(mealId)),
    clearMealEntry: (mealId: string) =>
      runAction(() => clearMealEntry(mealId)),
    addHydration: (amountMl: number) =>
      runAction(() => addHydration(amountMl)),
  }
}
EOF

cat > src/modules/nutrition/components/NutritionSummary.tsx <<'EOF'
import { Droplets, Plus } from 'lucide-react'
import { Button, Card, ProgressBar } from '../../../shared/ui'
import type { NutritionDaySummary } from '../types/nutrition'
import {
  calculateRemainingMacros,
  getMacroPercentage,
} from '../utils/nutritionMath'

type NutritionSummaryProps = {
  summary: NutritionDaySummary
  onAddWater: (amountMl: number) => Promise<unknown>
}

export function NutritionSummary({
  summary,
  onAddWater,
}: NutritionSummaryProps) {
  const remaining = calculateRemainingMacros({
    caloriesConsumedKcal: summary.caloriesConsumedKcal,
    calorieTargetKcal: summary.calorieTargetKcal,
    proteinConsumedG: summary.proteinConsumedG,
    proteinTargetG: summary.proteinTargetG,
  })

  return (
    <Card elevated>
      <h2 className="text-lg font-bold">Resumo nutricional</h2>

      <div className="mt-5 space-y-5">
        <ProgressBar
          label={`${summary.caloriesConsumedKcal.toLocaleString(
            'pt-BR',
          )} de ${summary.calorieTargetKcal.toLocaleString('pt-BR')} kcal`}
          value={getMacroPercentage(
            summary.caloriesConsumedKcal,
            summary.calorieTargetKcal,
          )}
        />

        <ProgressBar
          label={`${summary.proteinConsumedG} de ${summary.proteinTargetG} g de proteína`}
          value={getMacroPercentage(
            summary.proteinConsumedG,
            summary.proteinTargetG,
          )}
        />

        <ProgressBar
          label={`${(summary.hydrationConsumedMl / 1000).toLocaleString(
            'pt-BR',
            { maximumFractionDigits: 1 },
          )} de ${(summary.hydrationTargetMl / 1000).toLocaleString(
            'pt-BR',
            { maximumFractionDigits: 1 },
          )} L de água`}
          value={getMacroPercentage(
            summary.hydrationConsumedMl,
            summary.hydrationTargetMl,
          )}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric
          label="Calorias restantes"
          value={`${remaining.caloriesRemainingKcal.toLocaleString(
            'pt-BR',
          )} kcal`}
        />
        <Metric
          label="Proteína restante"
          value={`${remaining.proteinRemainingG} g`}
        />
        <Metric
          label="Carboidratos"
          value={`${summary.carbohydrateConsumedG} g`}
        />
        <Metric
          label="Gorduras"
          value={`${summary.fatConsumedG} g`}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[300, 500, 750].map((amount) => (
          <Button
            key={amount}
            onClick={() => onAddWater(amount)}
            variant="ghost"
          >
            <Plus size={16} aria-hidden="true" />
            {amount} ml
          </Button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Droplets size={16} aria-hidden="true" />
        Registros de água atualizam o Dashboard e o Coach.
      </div>
    </Card>
  )
}

type MetricProps = {
  label: string
  value: string
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  )
}
EOF

cat > src/modules/nutrition/components/MealStatusBadge.tsx <<'EOF'
import { Badge } from '../../../shared/ui'
import type { MealStatus } from '../types/nutrition'

type MealStatusBadgeProps = {
  status: MealStatus
}

const statusConfig = {
  planned: { label: 'Planejada', tone: 'neutral' },
  pending: { label: 'Pendente', tone: 'warning' },
  partial: { label: 'Parcial', tone: 'warning' },
  completed: { label: 'Concluída', tone: 'success' },
  substituted: { label: 'Substituída', tone: 'primary' },
  skipped: { label: 'Não realizada', tone: 'neutral' },
} as const

export function MealStatusBadge({ status }: MealStatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge tone={config.tone}>{config.label}</Badge>
}
EOF

cat > src/modules/nutrition/components/NutritionMealCard.tsx <<'EOF'
import { ChevronRight, RotateCcw, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card, ProgressBar } from '../../../shared/ui'
import type { NutritionMeal } from '../types/nutrition'
import { MealStatusBadge } from './MealStatusBadge'

type NutritionMealCardProps = {
  meal: NutritionMeal
  onReset: (mealId: string) => Promise<unknown>
}

const finalStatuses = new Set([
  'partial',
  'completed',
  'substituted',
  'skipped',
])

export function NutritionMealCard({
  meal,
  onReset,
}: NutritionMealCardProps) {
  return (
    <Card>
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
          <Utensils size={22} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-300">
              {meal.plannedTime}
            </span>
            <MealStatusBadge status={meal.status} />
          </div>

          <h2 className="mt-3 text-lg font-bold">{meal.name}</h2>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {meal.caloriesKcal} kcal · {meal.proteinG} g proteína ·{' '}
            {meal.carbohydrateG} g carboidratos
          </p>
        </div>
      </div>

      {meal.completionPercentage > 0 ? (
        <div className="mt-4">
          <ProgressBar
            label={`${meal.completionPercentage}% registrado`}
            value={meal.completionPercentage}
          />
        </div>
      ) : null}

      <div className="mt-5 flex gap-3">
        <Link
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 font-bold text-white transition hover:bg-blue-500"
          to={`/nutrition/${meal.id}`}
        >
          Abrir
          <ChevronRight size={18} aria-hidden="true" />
        </Link>

        {finalStatuses.has(meal.status) ? (
          <Button
            aria-label={`Limpar registro de ${meal.name}`}
            onClick={() => onReset(meal.id)}
            variant="ghost"
          >
            <RotateCcw size={18} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
EOF

cat > src/modules/nutrition/pages/NutritionPage.tsx <<'EOF'
import { AlertTriangle } from 'lucide-react'
import { Card, SectionTitle } from '../../../shared/ui'
import { NutritionMealCard } from '../components/NutritionMealCard'
import { NutritionSummary } from '../components/NutritionSummary'
import { useNutritionDay } from '../hooks/useNutritionDay'

export function NutritionPage() {
  const {
    data,
    error,
    isLoading,
    clearMealEntry,
    addHydration,
  } = useNutritionDay()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro na nutrição</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando suas refeições...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
          TITAN NUTRIÇÃO
        </p>
        <h1 className="mt-2 text-3xl font-black">Refeições de hoje</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Registre exatamente o que foi consumido. O planejamento não conta
          como adesão.
        </p>
      </header>

      {data.summary.pendingCount > 0 ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <div className="flex gap-3">
            <AlertTriangle
              className="shrink-0 text-amber-300"
              size={22}
              aria-hidden="true"
            />
            <div>
              <p className="font-bold">
                {data.summary.pendingCount}{' '}
                {data.summary.pendingCount === 1
                  ? 'refeição pendente'
                  : 'refeições pendentes'}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Resolva cada pendência como consumida, parcial, substituída
                ou não realizada.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <NutritionSummary
        summary={data.summary}
        onAddWater={addHydration}
      />

      <section>
        <SectionTitle
          title="Linha do dia"
          supportingText={`${data.meals.length} refeições`}
        />

        <div className="space-y-3">
          {data.meals.map((meal) => (
            <NutritionMealCard
              key={meal.id}
              meal={meal}
              onReset={clearMealEntry}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
EOF

cat > src/modules/nutrition/pages/MealDetailPage.tsx <<'EOF'
import {
  ArrowLeft,
  Check,
  CircleOff,
  RefreshCw,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Card } from '../../../shared/ui'
import { MealStatusBadge } from '../components/MealStatusBadge'
import { useNutritionDay } from '../hooks/useNutritionDay'

export function MealDetailPage() {
  const { mealId } = useParams()
  const navigate = useNavigate()
  const [percentage, setPercentage] = useState(50)

  const {
    data,
    error,
    isLoading,
    completeMeal,
    registerPartialMeal,
    substituteMeal,
    skipMeal,
    clearMealEntry,
  } = useNutritionDay()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <p className="font-bold">Não foi possível abrir a refeição.</p>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Carregando refeição...
        </p>
      </div>
    )
  }

  const meal = data.meals.find((item) => item.id === mealId)

  if (!meal) {
    return <Navigate to="/nutrition" replace />
  }

  async function execute(action: () => Promise<unknown>) {
    await action()
    navigate('/nutrition')
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl text-sm font-bold text-slate-300"
        to="/nutrition"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-blue-300">
            {meal.plannedTime}
          </span>
          <MealStatusBadge status={meal.status} />
        </div>

        <h1 className="mt-3 text-3xl font-black">{meal.name}</h1>
      </header>

      <Card elevated>
        <h2 className="text-lg font-bold">Planejamento</h2>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric label="Calorias" value={`${meal.caloriesKcal} kcal`} />
          <Metric label="Proteína" value={`${meal.proteinG} g`} />
          <Metric
            label="Carboidratos"
            value={`${meal.carbohydrateG} g`}
          />
          <Metric label="Gorduras" value={`${meal.fatG} g`} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Registro parcial</h2>

        <p className="mt-2 text-sm text-slate-400">
          Ajuste a porcentagem realmente consumida.
        </p>

        <input
          className="mt-5 w-full accent-blue-500"
          max={100}
          min={0}
          onChange={(event) => setPercentage(Number(event.target.value))}
          step={5}
          type="range"
          value={percentage}
        />

        <p className="mt-3 text-center text-3xl font-black">
          {percentage}%
        </p>

        <Button
          className="mt-4"
          fullWidth
          onClick={() =>
            execute(() => registerPartialMeal(meal.id, percentage))
          }
          variant="ghost"
        >
          Registrar {percentage}%
        </Button>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-bold">Ações rápidas</h2>

        <div className="space-y-3">
          <Button
            fullWidth
            onClick={() => execute(() => completeMeal(meal.id))}
          >
            <Check size={19} aria-hidden="true" />
            Consumida integralmente
          </Button>

          <Button
            fullWidth
            onClick={() => execute(() => substituteMeal(meal.id))}
            variant="ghost"
          >
            <RefreshCw size={18} aria-hidden="true" />
            Registrar substituição equivalente
          </Button>

          <Button
            fullWidth
            onClick={() => execute(() => skipMeal(meal.id))}
            variant="ghost"
          >
            <CircleOff size={18} aria-hidden="true" />
            Não realizada
          </Button>

          {meal.status !== 'planned' && meal.status !== 'pending' ? (
            <Button
              fullWidth
              onClick={() => execute(() => clearMealEntry(meal.id))}
              variant="ghost"
            >
              Limpar registro
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  )
}

type MetricProps = {
  label: string
  value: string
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  )
}
EOF

cat > docs/features/NUTRITION_PREMIUM.md <<'EOF'
# Feature Nutrição Premium

## Incluído

- Resumo de calorias, proteína, carboidratos, gorduras e água.
- Macros restantes.
- Refeições pendentes.
- Registro integral, parcial ajustável, substituição e não realizada.
- Hidratação rápida.
- Atualização automática do Dashboard, Coach e Score.
- Persistência IndexedDB.

## Critérios de aceite

- Refeição planejada não conta como consumida.
- Percentual parcial atualiza macros proporcionalmente.
- Água atualiza hidratação em tempo real.
- Pendências permanecem até resolução manual.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Feature Nutrição Premium

### Added

- Registro parcial ajustável.
- Macros restantes.
- Hidratação rápida.
- Progresso por refeição.
- Resumo nutricional ampliado.
EOF

echo "🧪 Validando..."
npm run validate

echo
echo "✅ Feature Nutrição Premium aplicada."
echo "Backup: $BACKUP_DIR"
echo
echo 'Execute:'
echo 'git add .'
echo 'git commit -m "feat: deliver premium nutrition flow"'
echo 'git push'
