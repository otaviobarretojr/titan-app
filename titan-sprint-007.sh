#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Sprint 007: Evolution Module"

mkdir -p \
  docs/sprints \
  src/modules/evolution/components \
  src/modules/evolution/data \
  src/modules/evolution/hooks \
  src/modules/evolution/pages \
  src/modules/evolution/types

python3 - <<'PY'
from pathlib import Path

path = Path("src/database/titanDatabase.ts")
content = path.read_text()

insert_types = """
export type BodyMetricRecord = {
  id: string
  userId: string
  localDate: string
  weightKg: number
  waistCm: number | null
  armCm: number | null
  chestCm: number | null
  thighCm: number | null
  calfCm: number | null
  bodyFatPercentage: number | null
  notes: string
  createdAt: string
  updatedAt: string
}

"""

marker = "export type CardioPlanRecord = {"
if "export type BodyMetricRecord" not in content:
    content = content.replace(marker, insert_types + marker)

class_marker = "  cardioPlans!: EntityTable<CardioPlanRecord, 'id'>"
if "bodyMetrics!: EntityTable" not in content:
    content = content.replace(
        class_marker,
        "  bodyMetrics!: EntityTable<BodyMetricRecord, 'id'>\n" + class_marker,
    )

version4 = """
    this.version(4).stores({
      users: 'id, displayName, createdAt',
      dailyPlans: 'id, userId, localDate, [userId+localDate]',
      mealPlans:
        'id, userId, localDate, plannedTime, sequence, [userId+localDate]',
      mealEntries:
        'id, userId, mealPlanId, localDate, status, [userId+localDate]',
      workoutPlans: 'id, userId, localDate, [userId+localDate]',
      exercisePlans:
        'id, userId, workoutPlanId, localDate, sequence, [workoutPlanId+sequence]',
      workoutSessions:
        'id, userId, workoutPlanId, localDate, status, [userId+localDate]',
      exerciseSets:
        'id, userId, workoutSessionId, exercisePlanId, localDate, setNumber, [workoutSessionId+exercisePlanId]',
      bodyMetrics: 'id, userId, localDate, [userId+localDate]',
      cardioPlans: 'id, userId, localDate, type, [userId+localDate]',
      cardioSessions:
        'id, userId, cardioPlanId, localDate, status, [userId+localDate]',
      hydrationEntries:
        'id, userId, localDate, consumedAt, [userId+localDate]',
      sleepEntries: 'id, userId, localDate, [userId+localDate]',
      coachRecommendations:
        'id, userId, localDate, priority, [userId+localDate]',
    })
"""

constructor_end = "\n  }\n}\n\nexport const titanDatabase"
if "this.version(4)" not in content:
    content = content.replace(constructor_end, version4 + constructor_end)

path.write_text(content)
PY

cat > src/modules/evolution/types/evolution.ts <<'EOF'
export type BodyMetric = {
  id: string
  localDate: string
  weightKg: number
  waistCm: number | null
  armCm: number | null
  chestCm: number | null
  thighCm: number | null
  calfCm: number | null
  bodyFatPercentage: number | null
  notes: string
}

export type EvolutionSummary = {
  latestWeightKg: number | null
  previousWeightKg: number | null
  weightVariationKg: number | null
  weeklyAverageKg: number | null
  entries: BodyMetric[]
}
EOF

cat > src/modules/evolution/data/evolutionRepository.ts <<'EOF'
import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type BodyMetricRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { EvolutionSummary } from '../types/evolution'

export async function getEvolutionSummary(): Promise<EvolutionSummary> {
  const entries = await titanDatabase.bodyMetrics
    .where('userId')
    .equals(TITAN_USER_ID)
    .reverse()
    .sortBy('localDate')

  const sorted = [...entries].sort((a, b) =>
    b.localDate.localeCompare(a.localDate),
  )

  const latest = sorted[0] ?? null
  const previous = sorted[1] ?? null

  const lastSeven = sorted.slice(0, 7)
  const weeklyAverageKg =
    lastSeven.length > 0
      ? lastSeven.reduce((total, item) => total + item.weightKg, 0) /
        lastSeven.length
      : null

  return {
    latestWeightKg: latest?.weightKg ?? null,
    previousWeightKg: previous?.weightKg ?? null,
    weightVariationKg:
      latest && previous ? latest.weightKg - previous.weightKg : null,
    weeklyAverageKg,
    entries: sorted,
  }
}

export async function saveBodyMetric(input: {
  weightKg: number
  waistCm: number | null
  armCm: number | null
  chestCm: number | null
  thighCm: number | null
  calfCm: number | null
  bodyFatPercentage: number | null
  notes: string
}) {
  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0) {
    throw new Error('Peso inválido.')
  }

  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()

  const existing = await titanDatabase.bodyMetrics
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .first()

  const record: BodyMetricRecord = {
    id: existing?.id ?? `body-metric-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate,
    weightKg: input.weightKg,
    waistCm: input.waistCm,
    armCm: input.armCm,
    chestCm: input.chestCm,
    thighCm: input.thighCm,
    calfCm: input.calfCm,
    bodyFatPercentage: input.bodyFatPercentage,
    notes: input.notes.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await titanDatabase.bodyMetrics.put(record)
}

export async function deleteBodyMetric(id: string) {
  await titanDatabase.bodyMetrics.delete(id)
}
EOF

cat > src/modules/evolution/hooks/useEvolution.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  deleteBodyMetric,
  getEvolutionSummary,
  saveBodyMetric,
} from '../data/evolutionRepository'

export function useEvolution() {
  const [error, setError] = useState<string | null>(null)

  const summary = useLiveQuery(() => getEvolutionSummary(), [], null)

  async function runAction(action: () => Promise<void>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar a evolução.',
      )
    }
  }

  return {
    summary,
    error,
    isLoading: summary === undefined || summary === null,
    saveBodyMetric: (input: {
      weightKg: number
      waistCm: number | null
      armCm: number | null
      chestCm: number | null
      thighCm: number | null
      calfCm: number | null
      bodyFatPercentage: number | null
      notes: string
    }) => runAction(() => saveBodyMetric(input)),
    deleteBodyMetric: (id: string) =>
      runAction(() => deleteBodyMetric(id)),
  }
}
EOF

cat > src/modules/evolution/components/BodyMetricForm.tsx <<'EOF'
import { Save } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'

type BodyMetricFormProps = {
  onSave: (input: {
    weightKg: number
    waistCm: number | null
    armCm: number | null
    chestCm: number | null
    thighCm: number | null
    calfCm: number | null
    bodyFatPercentage: number | null
    notes: string
  }) => Promise<unknown>
}

export function BodyMetricForm({ onSave }: BodyMetricFormProps) {
  const [weightKg, setWeightKg] = useState(92)
  const [waistCm, setWaistCm] = useState(0)
  const [armCm, setArmCm] = useState(0)
  const [chestCm, setChestCm] = useState(0)
  const [thighCm, setThighCm] = useState(0)
  const [calfCm, setCalfCm] = useState(0)
  const [bodyFatPercentage, setBodyFatPercentage] = useState(0)
  const [notes, setNotes] = useState('')

  return (
    <Card>
      <h2 className="text-lg font-bold">Registrar medidas</h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <NumberField
          label="Peso"
          suffix="kg"
          value={weightKg}
          onChange={setWeightKg}
          min={1}
          step={0.1}
        />
        <NumberField
          label="Cintura"
          suffix="cm"
          value={waistCm}
          onChange={setWaistCm}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Braço"
          suffix="cm"
          value={armCm}
          onChange={setArmCm}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Peito"
          suffix="cm"
          value={chestCm}
          onChange={setChestCm}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Coxa"
          suffix="cm"
          value={thighCm}
          onChange={setThighCm}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Panturrilha"
          suffix="cm"
          value={calfCm}
          onChange={setCalfCm}
          min={0}
          step={0.1}
        />
        <NumberField
          label="Gordura"
          suffix="%"
          value={bodyFatPercentage}
          onChange={setBodyFatPercentage}
          min={0}
          max={100}
          step={0.1}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold text-slate-500">
          Observações
        </span>
        <textarea
          className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-blue-400"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Condição da medição, retenção, horário..."
          value={notes}
        />
      </label>

      <Button
        className="mt-5"
        fullWidth
        onClick={() =>
          onSave({
            weightKg,
            waistCm: waistCm > 0 ? waistCm : null,
            armCm: armCm > 0 ? armCm : null,
            chestCm: chestCm > 0 ? chestCm : null,
            thighCm: thighCm > 0 ? thighCm : null,
            calfCm: calfCm > 0 ? calfCm : null,
            bodyFatPercentage:
              bodyFatPercentage > 0 ? bodyFatPercentage : null,
            notes,
          })
        }
      >
        <Save size={18} aria-hidden="true" />
        Salvar medição
      </Button>
    </Card>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max?: number
  step: number
  suffix: string
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: NumberFieldProps) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold text-slate-500">
        {label}
      </span>
      <div className="flex items-center rounded-2xl bg-white/5 px-3">
        <input
          className="min-h-12 min-w-0 flex-1 border-0 bg-transparent text-center font-black text-white outline-none"
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value))}
          step={step}
          type="number"
          value={value}
        />
        <span className="text-xs font-bold text-slate-500">{suffix}</span>
      </div>
    </label>
  )
}
EOF

cat > src/modules/evolution/components/EvolutionHistory.tsx <<'EOF'
import { Trash2 } from 'lucide-react'
import { Button, Card } from '../../../shared/ui'
import type { BodyMetric } from '../types/evolution'

type EvolutionHistoryProps = {
  entries: BodyMetric[]
  onDelete: (id: string) => Promise<unknown>
}

export function EvolutionHistory({
  entries,
  onDelete,
}: EvolutionHistoryProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Nenhuma medição registrada ainda.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
                {new Intl.DateTimeFormat('pt-BR').format(
                  new Date(`${entry.localDate}T12:00:00`),
                )}
              </p>
              <p className="mt-2 text-2xl font-black">
                {entry.weightKg.toLocaleString('pt-BR')} kg
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {[
                  entry.waistCm ? `Cintura ${entry.waistCm} cm` : null,
                  entry.armCm ? `Braço ${entry.armCm} cm` : null,
                  entry.bodyFatPercentage
                    ? `Gordura ${entry.bodyFatPercentage}%`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Somente peso registrado'}
              </p>
            </div>

            <Button
              aria-label="Excluir medição"
              onClick={() => onDelete(entry.id)}
              variant="ghost"
            >
              <Trash2 size={18} aria-hidden="true" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
EOF

cat > src/modules/evolution/pages/EvolutionPage.tsx <<'EOF'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Card, SectionTitle } from '../../../shared/ui'
import { BodyMetricForm } from '../components/BodyMetricForm'
import { EvolutionHistory } from '../components/EvolutionHistory'
import { useEvolution } from '../hooks/useEvolution'

export function EvolutionPage() {
  const {
    summary,
    error,
    isLoading,
    saveBodyMetric,
    deleteBodyMetric,
  } = useEvolution()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro na evolução</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !summary) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Carregando evolução...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
          TITAN EVOLUÇÃO
        </p>
        <h1 className="mt-2 text-3xl font-black">Evolução corporal</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Registre medidas em condições semelhantes para melhorar a comparação.
        </p>
      </header>

      <Card elevated>
        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Peso atual"
            value={
              summary.latestWeightKg !== null
                ? `${summary.latestWeightKg.toLocaleString('pt-BR')} kg`
                : '—'
            }
          />
          <Metric
            label="Média recente"
            value={
              summary.weeklyAverageKg !== null
                ? `${summary.weeklyAverageKg.toLocaleString('pt-BR', {
                    maximumFractionDigits: 1,
                  })} kg`
                : '—'
            }
          />
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <VariationIcon value={summary.weightVariationKg} />
            <span className="text-xs font-bold">Variação</span>
          </div>
          <p className="mt-2 text-lg font-black">
            {summary.weightVariationKg !== null
              ? `${summary.weightVariationKg > 0 ? '+' : ''}${summary.weightVariationKg.toLocaleString(
                  'pt-BR',
                  { maximumFractionDigits: 1 },
                )} kg`
              : 'Dados insuficientes'}
          </p>
        </div>
      </Card>

      <BodyMetricForm onSave={saveBodyMetric} />

      <section>
        <SectionTitle
          supportingText={`${summary.entries.length} registros`}
          title="Histórico"
        />
        <EvolutionHistory
          entries={summary.entries}
          onDelete={deleteBodyMetric}
        />
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
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  )
}

function VariationIcon({ value }: { value: number | null }) {
  if (value === null || value === 0) {
    return <Minus size={18} aria-hidden="true" />
  }

  if (value > 0) {
    return <ArrowUp size={18} aria-hidden="true" />
  }

  return <ArrowDown size={18} aria-hidden="true" />
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/App.tsx")
content = path.read_text()

if "EvolutionPage" not in content:
    content = content.replace(
        "import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'",
        """import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { EvolutionPage } from '../modules/evolution/pages/EvolutionPage'""",
    )

old_route = """          <Route
            path="/evolution"
            element={
              <ModulePlaceholderPage
                eyebrow="Acompanhamento"
                title="Evolução"
                description="Peso, medidas, fotos, desempenho e tendências corporais ficarão reunidos aqui."
              />
            }
          />"""

new_route = """          <Route
            path="/evolution"
            element={<EvolutionPage />}
          />"""

if old_route in content:
    content = content.replace(old_route, new_route)
elif 'path="/evolution"' not in content:
    anchor = '          <Route path="/cardio" element={<CardioPage />} />'
    content = content.replace(anchor, anchor + "\n" + new_route)

path.write_text(content)
PY

cat > docs/sprints/SPRINT-007.md <<'EOF'
# Sprint 007 — Módulo Evolução

## Objetivo

Registrar peso, medidas corporais e acompanhar tendências recentes.

## Entregas

- Schema 4 do IndexedDB.
- Peso, cintura, braço, peito, coxa, panturrilha e gordura corporal.
- Atualização do registro do mesmo dia.
- Média recente.
- Variação entre medições.
- Histórico persistente.
- Exclusão de registros.

## Critérios de aceite

- Peso é obrigatório e validado.
- Dados persistem no IndexedDB.
- Registro do mesmo dia é atualizado sem duplicação.
- Build e lint passam sem erros.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Sprint 007

### Added

- Módulo de evolução corporal.
- Registro de peso e medidas.
- Média recente e variação de peso.
- Histórico persistente.
- Schema 4 do IndexedDB.
EOF

echo "🧪 Executando build..."
npm run build

echo "🧹 Executando lint..."
npm run lint

echo ""
echo "✅ Sprint 007 aplicada com sucesso."
echo 'Próximo comando: git add . && git commit -m "feat: implement body evolution tracking" && git push'
