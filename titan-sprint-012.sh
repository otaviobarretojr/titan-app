#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Sprint 012: Reports Module"

mkdir -p \
  docs/sprints \
  src/modules/reports/data \
  src/modules/reports/hooks \
  src/modules/reports/pages \
  src/modules/reports/types

cat > src/modules/reports/types/reports.ts <<'EOF'
export type DailyReport = {
  localDate: string
  caloriesConsumedKcal: number
  proteinConsumedG: number
  hydrationConsumedMl: number
  sleepMinutes: number | null
  workoutCompleted: boolean
  cardioCompleted: boolean
  mealsCompleted: number
  mealsPlanned: number
}

export type WeeklyReport = {
  days: DailyReport[]
  averageCaloriesKcal: number
  averageProteinG: number
  averageHydrationMl: number
  averageSleepMinutes: number | null
  workoutCompletionRate: number
  cardioCompletionRate: number
  mealCompletionRate: number
}
EOF

cat > src/modules/reports/data/reportsRepository.ts <<'EOF'
import { titanDatabase } from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type {
  DailyReport,
  WeeklyReport,
} from '../types/reports'

function getLastDates(count: number) {
  const dates: string[] = []
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Manaus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    dates.push(formatter.format(date))
  }

  return dates
}

export async function getDailyReport(
  localDate: string,
): Promise<DailyReport> {
  const [
    mealPlans,
    mealEntries,
    hydrationEntries,
    sleepEntry,
    workoutSession,
    cardioSession,
  ] = await Promise.all([
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
    titanDatabase.workoutSessions
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
    titanDatabase.cardioSessions
      .where('[userId+localDate]')
      .equals([TITAN_USER_ID, localDate])
      .first(),
  ])

  return {
    localDate,
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
    workoutCompleted: workoutSession?.status === 'completed',
    cardioCompleted: cardioSession?.status === 'completed',
    mealsCompleted: mealEntries.filter(
      (entry) => entry.status !== 'skipped',
    ).length,
    mealsPlanned: mealPlans.length,
  }
}

export async function getWeeklyReport(): Promise<WeeklyReport> {
  const dates = getLastDates(7)
  const days = await Promise.all(dates.map(getDailyReport))

  const total = (selector: (day: DailyReport) => number) =>
    days.reduce((sum, day) => sum + selector(day), 0)

  const sleepDays = days.filter((day) => day.sleepMinutes !== null)

  const plannedMeals = total((day) => day.mealsPlanned)
  const completedMeals = total((day) => day.mealsCompleted)

  return {
    days,
    averageCaloriesKcal: Math.round(
      total((day) => day.caloriesConsumedKcal) / days.length,
    ),
    averageProteinG: Math.round(
      total((day) => day.proteinConsumedG) / days.length,
    ),
    averageHydrationMl: Math.round(
      total((day) => day.hydrationConsumedMl) / days.length,
    ),
    averageSleepMinutes:
      sleepDays.length > 0
        ? Math.round(
            sleepDays.reduce(
              (sum, day) => sum + (day.sleepMinutes ?? 0),
              0,
            ) / sleepDays.length,
          )
        : null,
    workoutCompletionRate: Math.round(
      (days.filter((day) => day.workoutCompleted).length / days.length) *
        100,
    ),
    cardioCompletionRate: Math.round(
      (days.filter((day) => day.cardioCompleted).length / days.length) *
        100,
    ),
    mealCompletionRate:
      plannedMeals > 0
        ? Math.round((completedMeals / plannedMeals) * 100)
        : 0,
  }
}
EOF

cat > src/modules/reports/hooks/useWeeklyReport.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { getWeeklyReport } from '../data/reportsRepository'

export function useWeeklyReport() {
  const report = useLiveQuery(() => getWeeklyReport(), [], null)

  return {
    report,
    isLoading: report === undefined || report === null,
  }
}
EOF

cat > src/modules/reports/pages/ReportsPage.tsx <<'EOF'
import {
  Activity,
  Droplets,
  Dumbbell,
  Moon,
  Utensils,
} from 'lucide-react'
import { Card, ProgressBar } from '../../../shared/ui'
import { useWeeklyReport } from '../hooks/useWeeklyReport'

function formatSleep(minutes: number | null) {
  if (minutes === null) return '—'

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return `${hours}h${rest.toString().padStart(2, '0')}`
}

export function ReportsPage() {
  const { report, isLoading } = useWeeklyReport()

  if (isLoading || !report) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando relatório...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
          TITAN RELATÓRIOS
        </p>
        <h1 className="mt-2 text-3xl font-black">Últimos 7 dias</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Resumo calculado apenas com registros reais salvos no TITAN.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Utensils size={19} aria-hidden="true" />}
          label="Proteína média"
          value={`${report.averageProteinG} g`}
        />
        <MetricCard
          icon={<Droplets size={19} aria-hidden="true" />}
          label="Água média"
          value={`${(report.averageHydrationMl / 1000).toLocaleString(
            'pt-BR',
            { maximumFractionDigits: 1 },
          )} L`}
        />
        <MetricCard
          icon={<Moon size={19} aria-hidden="true" />}
          label="Sono médio"
          value={formatSleep(report.averageSleepMinutes)}
        />
        <MetricCard
          icon={<Activity size={19} aria-hidden="true" />}
          label="Calorias médias"
          value={`${report.averageCaloriesKcal.toLocaleString(
            'pt-BR',
          )} kcal`}
        />
      </div>

      <Card elevated>
        <h2 className="text-lg font-bold">Consistência</h2>

        <div className="mt-5 space-y-5">
          <ProgressBar
            label="Refeições registradas"
            value={report.mealCompletionRate}
          />
          <ProgressBar
            label="Treinos concluídos"
            value={report.workoutCompletionRate}
          />
          <ProgressBar
            label="Cardios concluídos"
            value={report.cardioCompletionRate}
          />
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-bold">Linha da semana</h2>

        <div className="space-y-3">
          {report.days.map((day) => (
            <Card key={day.localDate} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {new Intl.DateTimeFormat('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    }).format(new Date(`${day.localDate}T12:00:00`))}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {day.proteinConsumedG} g proteína ·{' '}
                    {(day.hydrationConsumedMl / 1000).toLocaleString(
                      'pt-BR',
                      { maximumFractionDigits: 1 },
                    )}{' '}
                    L água
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusIcon active={day.workoutCompleted}>
                    <Dumbbell size={17} aria-hidden="true" />
                  </StatusIcon>
                  <StatusIcon active={day.cardioCompleted}>
                    <Activity size={17} aria-hidden="true" />
                  </StatusIcon>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

type MetricCardProps = {
  icon: React.ReactNode
  label: string
  value: string
}

function MetricCard({
  icon,
  label,
  value,
}: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>

      <p className="mt-4 text-xl font-black">{value}</p>
    </Card>
  )
}

type StatusIconProps = {
  active: boolean
  children: React.ReactNode
}

function StatusIcon({
  active,
  children,
}: StatusIconProps) {
  return (
    <div
      className={[
        'flex h-9 w-9 items-center justify-center rounded-xl',
        active
          ? 'bg-emerald-500/10 text-emerald-300'
          : 'bg-white/5 text-slate-600',
      ].join(' ')}
    >
      {children}
    </div>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/reports/pages/ReportsPage.tsx")
content = path.read_text()
content = content.replace(
    "import {\n",
    "import type { ReactNode } from 'react'\nimport {\n",
    1,
)
content = content.replace("React.ReactNode", "ReactNode")
path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/App.tsx")
content = path.read_text()

if "ReportsPage" not in content:
    content = content.replace(
        "import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'",
        """import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { ReportsPage } from '../modules/reports/pages/ReportsPage'""",
    )

if 'path="/reports"' not in content:
    anchor = '          <Route path="/health/sleep" element={<SleepPage />} />'
    content = content.replace(
        anchor,
        anchor + '\n          <Route path="/reports" element={<ReportsPage />} />',
    )

path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/settings/pages/SettingsPage.tsx")
content = path.read_text()

if "BarChart3" not in content:
    content = content.replace(
        "  Bell,\n",
        "  BarChart3,\n  Bell,\n",
    )

insert = """
      <Card>
        <div className="flex gap-3">
          <BarChart3
            className="shrink-0 text-blue-300"
            size={23}
            aria-hidden="true"
          />
          <div className="flex-1">
            <h2 className="font-bold">Relatórios</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Consulte médias e consistência dos últimos sete dias.
            </p>

            <Link
              className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-white/10 px-4 text-sm font-bold text-white"
              to="/reports"
            >
              Abrir relatórios
            </Link>
          </div>
        </div>
      </Card>
"""

anchor = """      <Card>
        <div className="flex gap-3">
          <Moon"""

if "Abrir relatórios" not in content:
    content = content.replace(anchor, insert + "\n" + anchor)

path.write_text(content)
PY

cat > docs/sprints/SPRINT-012.md <<'EOF'
# Sprint 012 — Relatórios Semanais

## Entregas

- Relatório dos últimos sete dias.
- Médias de proteína, calorias, água e sono.
- Taxas de conclusão de refeições, treino e cardio.
- Linha diária da semana.
- Acesso pela página Mais.

## Critérios de aceite

- Usa somente registros reais.
- Atualiza automaticamente com IndexedDB.
- Build e lint passam sem erros.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Sprint 012

### Added

- Relatórios semanais.
- Médias de consumo, hidratação e sono.
- Indicadores de consistência.
- Linha diária dos últimos sete dias.
EOF

echo "🧪 Executando build..."
npm run build

echo "🧹 Executando lint..."
npm run lint

echo ""
echo "✅ Sprint 012 aplicada com sucesso."
echo 'Próximo comando: git add . && git commit -m "feat: add weekly performance reports" && git push'
