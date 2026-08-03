#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Dashboard + Coach Premium"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".titan-backups/dashboard-coach-$STAMP"
mkdir -p "$BACKUP_DIR" docs/features src/modules/{dashboard,coach}/{components,data,engine,hooks,pages,types}

for item in src/modules/dashboard src/modules/coach docs; do
  if [ -e "$item" ]; then
    cp -R "$item" "$BACKUP_DIR/"
  fi
done

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
        : clampScore(
            ratio(input.sleepMinutes, input.sleepTargetMinutes) * 100,
          ),
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
      message: `Você registrou ${(input.hydrationConsumedMl / 1000).toLocaleString(
        'pt-BR',
        { maximumFractionDigits: 1 },
      )} L de ${(input.hydrationTargetMl / 1000).toLocaleString('pt-BR', {
        maximumFractionDigits: 1,
      })} L.`,
      actionLabel: 'Registrar água',
      actionPath: '/nutrition',
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
        'Revise o pré-treino, hidrate-se e prepare a primeira carga.',
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
        'A recuperação pode estar comprometida. Ajuste intensidade e priorize o sono.',
      actionLabel: 'Abrir sono',
      actionPath: '/health/sleep',
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

  return insights
    .sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    )
    .slice(0, 3)
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

cat > src/modules/dashboard/components/ScoreBreakdown.tsx <<'EOF'
import { Card, ProgressBar } from '../../../shared/ui'
import type { TitanScoreBreakdown } from '../../coach/types/coach'

type ScoreBreakdownProps = {
  breakdown: TitanScoreBreakdown
}

export function ScoreBreakdown({
  breakdown,
}: ScoreBreakdownProps) {
  return (
    <Card>
      <h2 className="text-lg font-bold">Composição do score</h2>

      <div className="mt-5 space-y-4">
        <ProgressBar label="Nutrição" value={breakdown.nutrition} />
        <ProgressBar label="Hidratação" value={breakdown.hydration} />
        <ProgressBar label="Treino" value={breakdown.training} />
        <ProgressBar label="Cardio" value={breakdown.cardio} />
        <ProgressBar label="Recuperação" value={breakdown.recovery} />
      </div>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/CoachInsightsList.tsx <<'EOF'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '../../../shared/ui'
import type { CoachInsight } from '../../coach/types/coach'

type CoachInsightsListProps = {
  insights: CoachInsight[]
}

const tones = {
  high: 'warning',
  medium: 'primary',
  low: 'success',
} as const

export function CoachInsightsList({
  insights,
}: CoachInsightsListProps) {
  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-600/25 to-cyan-400/5">
      <div className="flex items-center gap-2 text-blue-300">
        <Sparkles size={18} aria-hidden="true" />
        <span className="text-sm font-bold">COACH TITAN</span>
      </div>

      <div className="mt-4 space-y-4">
        {insights.map((insight, index) => (
          <div
            className={index > 0 ? 'border-t border-white/10 pt-4' : ''}
            key={insight.id}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">{insight.title}</h2>
              <Badge tone={tones[insight.priority]}>
                {insight.priority === 'high'
                  ? 'Alta'
                  : insight.priority === 'medium'
                    ? 'Média'
                    : 'Baixa'}
              </Badge>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {insight.message}
            </p>

            {insight.actionLabel && insight.actionPath ? (
              <Link
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-bold text-white"
                to={insight.actionPath}
              >
                {insight.actionLabel}
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  )
}
EOF

cat > src/modules/dashboard/components/DailyMetricsGrid.tsx <<'EOF'
import { Droplets, Flame, Moon, Utensils } from 'lucide-react'
import { Card } from '../../../shared/ui'
import type { DashboardSummary } from '../types/dashboard'

type DailyMetricsGridProps = {
  summary: DashboardSummary
}

function formatSleep(minutes: number | null) {
  if (minutes === null) return '—'
  return `${Math.floor(minutes / 60)}h${(minutes % 60)
    .toString()
    .padStart(2, '0')}`
}

export function DailyMetricsGrid({
  summary,
}: DailyMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Metric
        icon={<Flame size={18} aria-hidden="true" />}
        label="Calorias"
        value={`${summary.caloriesConsumedKcal.toLocaleString('pt-BR')}`}
        target={`/${summary.calorieTargetKcal.toLocaleString('pt-BR')} kcal`}
      />
      <Metric
        icon={<Utensils size={18} aria-hidden="true" />}
        label="Proteína"
        value={`${summary.proteinConsumedG}`}
        target={`/${summary.proteinTargetG} g`}
      />
      <Metric
        icon={<Droplets size={18} aria-hidden="true" />}
        label="Água"
        value={`${(summary.hydrationConsumedMl / 1000).toLocaleString(
          'pt-BR',
          { maximumFractionDigits: 1 },
        )}`}
        target={`/${(summary.hydrationTargetMl / 1000).toLocaleString(
          'pt-BR',
          { maximumFractionDigits: 1 },
        )} L`}
      />
      <Metric
        icon={<Moon size={18} aria-hidden="true" />}
        label="Sono"
        value={formatSleep(summary.sleepMinutes)}
        target={`/${formatSleep(summary.sleepTargetMinutes)}`}
      />
    </div>
  )
}

type MetricProps = {
  icon: React.ReactNode
  label: string
  value: string
  target: string
}

function Metric({
  icon,
  label,
  value,
  target,
}: MetricProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-3 text-xl font-black">
        {value}
        <span className="ml-1 text-xs font-semibold text-slate-500">
          {target}
        </span>
      </p>
    </Card>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path("src/modules/dashboard/components/DailyMetricsGrid.tsx")
content = path.read_text()
content = content.replace(
    "import { Droplets, Flame, Moon, Utensils } from 'lucide-react'",
    """import type { ReactNode } from 'react'
import { Droplets, Flame, Moon, Utensils } from 'lucide-react'""",
)
content = content.replace("React.ReactNode", "ReactNode")
path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/dashboard/pages/DashboardPage.tsx")
content = path.read_text()

imports = """import { CoachInsightsList } from '../components/CoachInsightsList'
import { DailyMetricsGrid } from '../components/DailyMetricsGrid'
import { ScoreBreakdown } from '../components/ScoreBreakdown'
"""

if "CoachInsightsList" not in content:
    first_import_end = content.find("\n", content.find("import"))
    content = content[: first_import_end + 1] + imports + content[first_import_end + 1 :]

content = content.replace(
    "<CoachCard insight={data.insights[0]} />",
    "<CoachInsightsList insights={data.insights} />",
)

if "<DailyMetricsGrid summary={data.summary} />" not in content:
    anchor = """      <section>
        <SectionTitle title="Score TITAN" />"""
    replacement = """      <section>
        <SectionTitle title="Resumo do dia" />
        <DailyMetricsGrid summary={data.summary} />
      </section>

""" + anchor
    content = content.replace(anchor, replacement)

if "<ScoreBreakdown breakdown={data.score.breakdown} />" not in content:
    content = content.replace(
        "<ScoreCard score={data.score} />",
        """<ScoreCard score={data.score} />
        <div className="mt-3">
          <ScoreBreakdown breakdown={data.score.breakdown} />
        </div>""",
    )

content = content.replace(
    "import { CoachCard } from '../components/CoachCard'\n",
    "",
)

path.write_text(content)
PY

cat > docs/features/DASHBOARD_COACH_PREMIUM.md <<'EOF'
# Dashboard + Coach Premium

## Incluído

- Até três prioridades do Coach.
- Score TITAN com composição detalhada.
- Resumo diário de calorias, proteína, água e sono.
- Recomendações contextuais.
- Integração com treino, nutrição, cardio e recuperação.
- Atualização reativa via IndexedDB.

## Critérios de aceite

- Coach usa apenas dados reais.
- Score fica vazio quando não há dados suficientes.
- Prioridades são ordenadas por gravidade.
- Dashboard atualiza sem recarregar a página.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Dashboard + Coach Premium

### Added

- Lista de prioridades.
- Composição detalhada do Score TITAN.
- Resumo diário ampliado.
- Recomendações contextuais.
EOF

echo "🧪 Validando..."
npm run validate

echo
echo "✅ Dashboard + Coach Premium aplicado."
echo "Backup: $BACKUP_DIR"
echo
echo 'Execute:'
echo 'git add .'
echo 'git commit -m "feat: deliver premium dashboard and coach"'
echo 'git push'
