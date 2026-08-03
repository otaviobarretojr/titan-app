#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Analytics Premium Real"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".titan-backups/analytics-$STAMP"

mkdir -p \
  "$BACKUP_DIR" \
  docs/features \
  src/modules/analytics/components \
  src/modules/analytics/data \
  src/modules/analytics/hooks \
  src/modules/analytics/pages \
  src/modules/analytics/types \
  src/modules/analytics/utils

for item in \
  src/modules/analytics \
  src/app/App.tsx \
  src/modules/settings/pages/SettingsPage.tsx \
  docs; do
  if [ -e "$item" ]; then
    cp -R "$item" "$BACKUP_DIR/"
  fi
done

cat > src/modules/analytics/types/analytics.ts <<'EOF'
export type AnalyticsPoint = {
  localDate: string
  caloriesKcal: number
  proteinG: number
  hydrationMl: number
  sleepMinutes: number | null
  workoutCompleted: boolean
  cardioCompleted: boolean
  weightKg: number | null
  waistCm: number | null
}

export type AnalyticsSummary = {
  days: AnalyticsPoint[]
  averages: {
    caloriesKcal: number
    proteinG: number
    hydrationMl: number
    sleepMinutes: number | null
    weightKg: number | null
  }
  totals: {
    workouts: number
    cardios: number
    cardioMinutes: number
    cardioDistanceKm: number
  }
  adherence: {
    nutrition: number
    hydration: number
    sleep: number
    training: number
  }
  personalRecords: Array<{
    exerciseName: string
    estimatedOneRepMaxKg: number
    localDate: string
  }>
}
EOF

cat > src/modules/analytics/utils/analyticsMath.ts <<'EOF'
export function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function percentage(value: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((value / target) * 100)))
}

export function normalize(
  value: number,
  minimum: number,
  maximum: number,
) {
  if (maximum <= minimum) return 50
  return ((value - minimum) / (maximum - minimum)) * 100
}
EOF

cat > src/modules/analytics/data/analyticsRepository.ts <<'EOF'
import { titanDatabase } from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type {
  AnalyticsPoint,
  AnalyticsSummary,
} from '../types/analytics'
import {
  average,
  percentage,
} from '../utils/analyticsMath'

function getLastDates(count: number) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Manaus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const dates: string[] = []

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    dates.push(formatter.format(date))
  }

  return dates
}

export async function getAnalyticsSummary(
  daysCount = 30,
): Promise<AnalyticsSummary> {
  const dates = getLastDates(daysCount)

  const [
    dailyPlans,
    mealEntries,
    hydrationEntries,
    sleepEntries,
    workoutSessions,
    cardioSessions,
    bodyMetrics,
    personalRecords,
  ] = await Promise.all([
    titanDatabase.dailyPlans
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.mealEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.hydrationEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.sleepEntries
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.workoutSessions
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.cardioSessions
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.bodyMetrics
      .where('userId')
      .equals(TITAN_USER_ID)
      .filter((item) => dates.includes(item.localDate))
      .toArray(),
    titanDatabase.exercisePersonalRecords
      .where('userId')
      .equals(TITAN_USER_ID)
      .toArray(),
  ])

  const plansByDate = new Map(
    dailyPlans.map((item) => [item.localDate, item]),
  )

  const points: AnalyticsPoint[] = dates.map((localDate) => {
    const dayMeals = mealEntries.filter(
      (item) => item.localDate === localDate,
    )
    const dayHydration = hydrationEntries.filter(
      (item) => item.localDate === localDate,
    )
    const daySleep = sleepEntries.find(
      (item) => item.localDate === localDate,
    )
    const dayWorkout = workoutSessions.find(
      (item) => item.localDate === localDate,
    )
    const dayCardio = cardioSessions.find(
      (item) => item.localDate === localDate,
    )
    const dayMetric = bodyMetrics.find(
      (item) => item.localDate === localDate,
    )

    return {
      localDate,
      caloriesKcal: dayMeals.reduce(
        (sum, item) => sum + item.caloriesKcal,
        0,
      ),
      proteinG: dayMeals.reduce(
        (sum, item) => sum + item.proteinG,
        0,
      ),
      hydrationMl: dayHydration.reduce(
        (sum, item) => sum + item.amountMl,
        0,
      ),
      sleepMinutes: daySleep?.durationMinutes ?? null,
      workoutCompleted: dayWorkout?.status === 'completed',
      cardioCompleted: dayCardio?.status === 'completed',
      weightKg: dayMetric?.weightKg ?? null,
      waistCm: dayMetric?.waistCm ?? null,
    }
  })

  const latestPlan =
    dailyPlans.sort((a, b) =>
      b.localDate.localeCompare(a.localDate),
    )[0] ?? null

  const workoutCount = points.filter(
    (item) => item.workoutCompleted,
  ).length

  const cardioCompleted = cardioSessions.filter(
    (item) => item.status === 'completed',
  )

  const nutritionAdherenceValues = points.map((point) => {
    const plan = plansByDate.get(point.localDate)
    if (!plan) return 0
    return percentage(point.proteinG, plan.proteinTargetG)
  })

  const hydrationAdherenceValues = points.map((point) => {
    const plan = plansByDate.get(point.localDate)
    if (!plan) return 0
    return percentage(point.hydrationMl, plan.hydrationTargetMl)
  })

  const sleepAdherenceValues = points
    .map((point) => {
      const plan = plansByDate.get(point.localDate)
      if (!plan || point.sleepMinutes === null) return null
      return percentage(point.sleepMinutes, plan.sleepTargetMinutes)
    })
    .filter((value): value is number => value !== null)

  const bestByExercise = new Map<
    string,
    (typeof personalRecords)[number]
  >()

  for (const record of personalRecords) {
    const current = bestByExercise.get(record.exerciseName)

    if (
      !current ||
      record.estimatedOneRepMaxKg >
        current.estimatedOneRepMaxKg
    ) {
      bestByExercise.set(record.exerciseName, record)
    }
  }

  return {
    days: points,
    averages: {
      caloriesKcal:
        Math.round(
          average(points.map((item) => item.caloriesKcal)) ?? 0,
        ),
      proteinG:
        Math.round(
          average(points.map((item) => item.proteinG)) ?? 0,
        ),
      hydrationMl:
        Math.round(
          average(points.map((item) => item.hydrationMl)) ?? 0,
        ),
      sleepMinutes: average(
        points
          .map((item) => item.sleepMinutes)
          .filter((value): value is number => value !== null),
      ),
      weightKg: average(
        points
          .map((item) => item.weightKg)
          .filter((value): value is number => value !== null),
      ),
    },
    totals: {
      workouts: workoutCount,
      cardios: cardioCompleted.length,
      cardioMinutes: cardioCompleted.reduce(
        (sum, item) => sum + item.durationMinutes,
        0,
      ),
      cardioDistanceKm: cardioCompleted.reduce(
        (sum, item) => sum + (item.distanceKm ?? 0),
        0,
      ),
    },
    adherence: {
      nutrition:
        Math.round(average(nutritionAdherenceValues) ?? 0),
      hydration:
        Math.round(average(hydrationAdherenceValues) ?? 0),
      sleep:
        Math.round(average(sleepAdherenceValues) ?? 0),
      training:
        latestPlan
          ? Math.round((workoutCount / daysCount) * 100)
          : 0,
    },
    personalRecords: [...bestByExercise.values()]
      .sort(
        (a, b) =>
          b.estimatedOneRepMaxKg -
          a.estimatedOneRepMaxKg,
      )
      .slice(0, 10)
      .map((record) => ({
        exerciseName: record.exerciseName,
        estimatedOneRepMaxKg:
          record.estimatedOneRepMaxKg,
        localDate: record.localDate,
      })),
  }
}
EOF

cat > src/modules/analytics/hooks/useAnalytics.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { getAnalyticsSummary } from '../data/analyticsRepository'

export function useAnalytics() {
  const [period, setPeriod] = useState(30)

  const summary = useLiveQuery(
    () => getAnalyticsSummary(period),
    [period],
    null,
  )

  return {
    period,
    setPeriod,
    summary,
    isLoading: summary === undefined || summary === null,
  }
}
EOF

cat > src/modules/analytics/components/AnalyticsMetricCard.tsx <<'EOF'
import type { ReactNode } from 'react'
import { Card } from '../../../shared/ui'

type AnalyticsMetricCardProps = {
  icon: ReactNode
  label: string
  value: string
  supportingText?: string
}

export function AnalyticsMetricCard({
  icon,
  label,
  value,
  supportingText,
}: AnalyticsMetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>

      <p className="mt-3 text-xl font-black">{value}</p>

      {supportingText ? (
        <p className="mt-1 text-xs text-slate-500">
          {supportingText}
        </p>
      ) : null}
    </Card>
  )
}
EOF

cat > src/modules/analytics/components/AnalyticsBarChart.tsx <<'EOF'
import { Card } from '../../../shared/ui'
import type { AnalyticsPoint } from '../types/analytics'
import { normalize } from '../utils/analyticsMath'

type AnalyticsBarChartProps = {
  title: string
  points: AnalyticsPoint[]
  selector: (point: AnalyticsPoint) => number
  suffix: string
}

export function AnalyticsBarChart({
  title,
  points,
  selector,
  suffix,
}: AnalyticsBarChartProps) {
  const visiblePoints = points.slice(-14)
  const values = visiblePoints.map(selector)
  const minimum = Math.min(...values, 0)
  const maximum = Math.max(...values, 1)

  return (
    <Card>
      <h2 className="text-lg font-bold">{title}</h2>

      <div className="mt-6 flex h-44 items-end gap-1">
        {visiblePoints.map((point) => {
          const value = selector(point)
          const height =
            value <= 0
              ? 3
              : 20 + normalize(value, minimum, maximum) * 0.8

          return (
            <div
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              key={point.localDate}
              title={`${point.localDate}: ${value} ${suffix}`}
            >
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400"
                style={{ height: `${height}%` }}
              />
              <span className="text-[8px] text-slate-600">
                {point.localDate.slice(8)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
EOF

cat > src/modules/analytics/utils/exportAnalytics.ts <<'EOF'
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
EOF

cat > src/modules/analytics/pages/AnalyticsPage.tsx <<'EOF'
import {
  Activity,
  BarChart3,
  Download,
  Droplets,
  Dumbbell,
  Flame,
  Moon,
  Scale,
  Utensils,
} from 'lucide-react'
import { Button, Card, ProgressBar, SectionTitle } from '../../../shared/ui'
import { AnalyticsBarChart } from '../components/AnalyticsBarChart'
import { AnalyticsMetricCard } from '../components/AnalyticsMetricCard'
import { useAnalytics } from '../hooks/useAnalytics'
import { downloadAnalyticsCsv } from '../utils/exportAnalytics'

function formatSleep(minutes: number | null) {
  if (minutes === null) return '—'

  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)

  return `${hours}h${rest.toString().padStart(2, '0')}`
}

export function AnalyticsPage() {
  const {
    period,
    setPeriod,
    summary,
    isLoading,
  } = useAnalytics()

  if (isLoading || !summary) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando analytics...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
          TITAN ANALYTICS
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Performance
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Indicadores consolidados a partir dos registros reais.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 30].map((days) => (
            <Button
              key={days}
              onClick={() => setPeriod(days)}
              variant={period === days ? 'primary' : 'ghost'}
            >
              {days} dias
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <AnalyticsMetricCard
          icon={<Utensils size={18} aria-hidden="true" />}
          label="Proteína média"
          value={`${summary.averages.proteinG} g`}
        />

        <AnalyticsMetricCard
          icon={<Droplets size={18} aria-hidden="true" />}
          label="Água média"
          value={`${(
            summary.averages.hydrationMl / 1000
          ).toLocaleString('pt-BR', {
            maximumFractionDigits: 1,
          })} L`}
        />

        <AnalyticsMetricCard
          icon={<Moon size={18} aria-hidden="true" />}
          label="Sono médio"
          value={formatSleep(summary.averages.sleepMinutes)}
        />

        <AnalyticsMetricCard
          icon={<Scale size={18} aria-hidden="true" />}
          label="Peso médio"
          value={
            summary.averages.weightKg !== null
              ? `${summary.averages.weightKg.toLocaleString(
                  'pt-BR',
                  { maximumFractionDigits: 1 },
                )} kg`
              : '—'
          }
        />

        <AnalyticsMetricCard
          icon={<Dumbbell size={18} aria-hidden="true" />}
          label="Treinos"
          value={`${summary.totals.workouts}`}
        />

        <AnalyticsMetricCard
          icon={<Activity size={18} aria-hidden="true" />}
          label="Cardios"
          value={`${summary.totals.cardios}`}
          supportingText={`${summary.totals.cardioMinutes} min`}
        />
      </div>

      <Card elevated>
        <h2 className="text-lg font-bold">Aderência</h2>

        <div className="mt-5 space-y-5">
          <ProgressBar
            label="Nutrição"
            value={summary.adherence.nutrition}
          />
          <ProgressBar
            label="Hidratação"
            value={summary.adherence.hydration}
          />
          <ProgressBar
            label="Sono"
            value={summary.adherence.sleep}
          />
          <ProgressBar
            label="Treino"
            value={summary.adherence.training}
          />
        </div>
      </Card>

      <AnalyticsBarChart
        title="Proteína diária"
        points={summary.days}
        selector={(point) => point.proteinG}
        suffix="g"
      />

      <AnalyticsBarChart
        title="Hidratação diária"
        points={summary.days}
        selector={(point) => point.hydrationMl / 1000}
        suffix="L"
      />

      <AnalyticsBarChart
        title="Calorias diárias"
        points={summary.days}
        selector={(point) => point.caloriesKcal}
        suffix="kcal"
      />

      <section>
        <SectionTitle
          title="Recordes pessoais"
          supportingText={`${summary.personalRecords.length} exercícios`}
        />

        <Card>
          {summary.personalRecords.length === 0 ? (
            <p className="text-sm text-slate-400">
              Registre séries para gerar recordes.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.personalRecords.map((record) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-3"
                  key={record.exerciseName}
                >
                  <div>
                    <p className="text-sm font-bold">
                      {record.exerciseName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.localDate}
                    </p>
                  </div>

                  <span className="font-black text-violet-300">
                    {record.estimatedOneRepMaxKg.toLocaleString(
                      'pt-BR',
                      { maximumFractionDigits: 1 },
                    )}{' '}
                    kg
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <Card>
        <div className="flex items-center gap-3">
          <BarChart3
            className="text-cyan-300"
            size={22}
            aria-hidden="true"
          />

          <div>
            <h2 className="font-bold">Exportação</h2>
            <p className="mt-1 text-sm text-slate-400">
              Exporte os dados consolidados em CSV.
            </p>
          </div>
        </div>

        <Button
          className="mt-5"
          fullWidth
          onClick={() => downloadAnalyticsCsv(summary)}
        >
          <Download size={18} aria-hidden="true" />
          Exportar CSV
        </Button>
      </Card>

      <Card>
        <div className="flex gap-3">
          <Flame
            className="shrink-0 text-amber-300"
            size={22}
            aria-hidden="true"
          />

          <p className="text-sm leading-6 text-slate-400">
            Os indicadores refletem apenas o que foi efetivamente registrado
            no TITAN. Dias sem dados permanecem zerados.
          </p>
        </div>
      </Card>
    </div>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/App.tsx")
content = path.read_text()

if "AnalyticsPage" not in content:
    content = content.replace(
        "import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'",
        """import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { AnalyticsPage } from '../modules/analytics/pages/AnalyticsPage'""",
    )

if 'path="/analytics"' not in content:
    anchor = '          <Route path="/reports" element={<ReportsPage />} />'
    content = content.replace(
        anchor,
        anchor
        + '\n          <Route path="/analytics" element={<AnalyticsPage />} />',
    )

path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/settings/pages/SettingsPage.tsx")
content = path.read_text()

if "LineChart" not in content:
    content = content.replace(
        "  Info,",
        "  Info,\n  LineChart,",
    )

insert = """
      <NavigationCard
        icon={<LineChart size={23} aria-hidden="true" />}
        label="Analytics"
        path="/analytics"
      />
"""

anchor = """      <NavigationCard
        icon={<BarChart3"""

if 'label="Analytics"' not in content:
    content = content.replace(anchor, insert + "\n" + anchor)

path.write_text(content)
PY

cat > docs/features/ANALYTICS_PREMIUM.md <<'EOF'
# Analytics Premium

## Incluído

- Períodos de 7, 14 e 30 dias.
- Médias de proteína, água, sono e peso.
- Totais de treino e cardio.
- Aderência por área.
- Gráficos locais sem biblioteca externa.
- Recordes pessoais.
- Exportação CSV.
- Atualização reativa via IndexedDB.

## Limites

A exportação PDF não foi incluída nesta etapa para evitar dependência pesada e aumento do bundle.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Analytics Premium

### Added

- Tela Analytics.
- Indicadores por período.
- Gráficos de proteína, água e calorias.
- Recordes pessoais.
- Exportação CSV.
EOF

echo "🧪 Validando..."
npm run validate

echo
echo "✅ Analytics Premium aplicado."
echo "Backup: $BACKUP_DIR"
echo
echo 'Execute:'
echo 'git add .'
echo 'git commit -m "feat: deliver analytics premium"'
echo 'git push'
