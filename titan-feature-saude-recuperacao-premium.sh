#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Feature Saúde e Recuperação Premium"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".titan-backups/health-$STAMP"

mkdir -p \
  "$BACKUP_DIR" \
  docs/features \
  src/modules/health/components \
  src/modules/health/data \
  src/modules/health/hooks \
  src/modules/health/pages \
  src/modules/health/types

for item in src/modules/health src/database/titanDatabase.ts src/app/App.tsx src/modules/settings/pages/SettingsPage.tsx docs; do
  if [ -e "$item" ]; then
    cp -R "$item" "$BACKUP_DIR/"
  fi
done

python3 - <<'PY'
from pathlib import Path

path = Path("src/database/titanDatabase.ts")
content = path.read_text()

health_types = """
export type HealthMetricRecord = {
  id: string
  userId: string
  localDate: string
  systolicPressure: number | null
  diastolicPressure: number | null
  restingHeartRate: number | null
  symptom: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type HealthExamRecord = {
  id: string
  userId: string
  examDate: string
  title: string
  category: string
  value: string
  referenceRange: string
  notes: string
  createdAt: string
  updatedAt: string
}

"""

marker = "export type CardioPlanRecord = {"

if "export type HealthMetricRecord" not in content:
    content = content.replace(marker, health_types + marker)

class_marker = "  progressPhotos!: EntityTable<ProgressPhotoRecord, 'id'>"

if "healthMetrics!: EntityTable" not in content:
    content = content.replace(
        class_marker,
        class_marker
        + "\n  healthMetrics!: EntityTable<HealthMetricRecord, 'id'>"
        + "\n  healthExams!: EntityTable<HealthExamRecord, 'id'>",
    )

version7 = """
    this.version(7).stores({
      users: 'id, displayName, createdAt',
      dailyPlans: 'id, userId, localDate, [userId+localDate]',
      mealPlans:
        'id, userId, localDate, plannedTime, sequence, [userId+localDate]',
      mealEntries:
        'id, userId, mealPlanId, localDate, status, [userId+localDate]',
      workoutPlans: 'id, userId, localDate, [userId+localDate]',
      exercisePlans:
        'id, userId, workoutPlanId, localDate, sequence, name, [workoutPlanId+sequence]',
      workoutSessions:
        'id, userId, workoutPlanId, localDate, status, [userId+localDate]',
      exerciseSets:
        'id, userId, workoutSessionId, exercisePlanId, localDate, setNumber, [workoutSessionId+exercisePlanId]',
      exercisePersonalRecords:
        'id, userId, exercisePlanId, exerciseName, localDate, estimatedOneRepMaxKg, [userId+exercisePlanId]',
      bodyMetrics: 'id, userId, localDate, [userId+localDate]',
      progressPhotos: 'id, userId, localDate, pose, [userId+localDate]',
      healthMetrics: 'id, userId, localDate, [userId+localDate]',
      healthExams: 'id, userId, examDate, category, [userId+examDate]',
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

end = "\n  }\n}\n\nexport const titanDatabase"

if "this.version(7)" not in content:
    content = content.replace(end, version7 + end)

path.write_text(content)
PY

cat > src/modules/health/types/health.ts <<'EOF'
export type HealthMetric = {
  id: string
  localDate: string
  systolicPressure: number | null
  diastolicPressure: number | null
  restingHeartRate: number | null
  symptom: string
  notes: string
}

export type HealthExam = {
  id: string
  examDate: string
  title: string
  category: string
  value: string
  referenceRange: string
  notes: string
}

export type HealthSummary = {
  latestMetric: HealthMetric | null
  metrics: HealthMetric[]
  exams: HealthExam[]
  averageRestingHeartRate: number | null
}
EOF

cat > src/modules/health/data/healthRepository.ts <<'EOF'
import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type HealthExamRecord,
  type HealthMetricRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { HealthSummary } from '../types/health'

export async function getHealthSummary(): Promise<HealthSummary> {
  const [metrics, exams] = await Promise.all([
    titanDatabase.healthMetrics
      .where('userId')
      .equals(TITAN_USER_ID)
      .toArray(),
    titanDatabase.healthExams
      .where('userId')
      .equals(TITAN_USER_ID)
      .toArray(),
  ])

  const sortedMetrics = [...metrics].sort((a, b) =>
    b.localDate.localeCompare(a.localDate),
  )

  const heartRateValues = sortedMetrics
    .map((item) => item.restingHeartRate)
    .filter((value): value is number => value !== null)

  return {
    latestMetric: sortedMetrics[0]
      ? {
          id: sortedMetrics[0].id,
          localDate: sortedMetrics[0].localDate,
          systolicPressure: sortedMetrics[0].systolicPressure,
          diastolicPressure: sortedMetrics[0].diastolicPressure,
          restingHeartRate: sortedMetrics[0].restingHeartRate,
          symptom: sortedMetrics[0].symptom,
          notes: sortedMetrics[0].notes,
        }
      : null,
    metrics: sortedMetrics.map((item) => ({
      id: item.id,
      localDate: item.localDate,
      systolicPressure: item.systolicPressure,
      diastolicPressure: item.diastolicPressure,
      restingHeartRate: item.restingHeartRate,
      symptom: item.symptom,
      notes: item.notes,
    })),
    exams: [...exams]
      .sort((a, b) => b.examDate.localeCompare(a.examDate))
      .map((item) => ({
        id: item.id,
        examDate: item.examDate,
        title: item.title,
        category: item.category,
        value: item.value,
        referenceRange: item.referenceRange,
        notes: item.notes,
      })),
    averageRestingHeartRate:
      heartRateValues.length > 0
        ? Math.round(
            heartRateValues.reduce((sum, value) => sum + value, 0) /
              heartRateValues.length,
          )
        : null,
  }
}

export async function saveHealthMetric(input: {
  systolicPressure: number | null
  diastolicPressure: number | null
  restingHeartRate: number | null
  symptom: string
  notes: string
}) {
  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()

  if (
    input.systolicPressure !== null &&
    (input.systolicPressure < 50 || input.systolicPressure > 300)
  ) {
    throw new Error('Pressão sistólica inválida.')
  }

  if (
    input.diastolicPressure !== null &&
    (input.diastolicPressure < 30 || input.diastolicPressure > 200)
  ) {
    throw new Error('Pressão diastólica inválida.')
  }

  if (
    input.restingHeartRate !== null &&
    (input.restingHeartRate < 25 || input.restingHeartRate > 250)
  ) {
    throw new Error('Frequência cardíaca inválida.')
  }

  const existing = await titanDatabase.healthMetrics
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .first()

  const record: HealthMetricRecord = {
    id: existing?.id ?? `health-metric-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate,
    systolicPressure: input.systolicPressure,
    diastolicPressure: input.diastolicPressure,
    restingHeartRate: input.restingHeartRate,
    symptom: input.symptom.trim(),
    notes: input.notes.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await titanDatabase.healthMetrics.put(record)
}

export async function deleteHealthMetric(id: string) {
  await titanDatabase.healthMetrics.delete(id)
}

export async function saveHealthExam(input: {
  examDate: string
  title: string
  category: string
  value: string
  referenceRange: string
  notes: string
}) {
  if (!input.examDate || !input.title.trim()) {
    throw new Error('Data e nome do exame são obrigatórios.')
  }

  const now = new Date().toISOString()

  const record: HealthExamRecord = {
    id: `health-exam-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    examDate: input.examDate,
    title: input.title.trim(),
    category: input.category.trim(),
    value: input.value.trim(),
    referenceRange: input.referenceRange.trim(),
    notes: input.notes.trim(),
    createdAt: now,
    updatedAt: now,
  }

  await titanDatabase.healthExams.add(record)
}

export async function deleteHealthExam(id: string) {
  await titanDatabase.healthExams.delete(id)
}
EOF

cat > src/modules/health/hooks/useHealth.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  deleteHealthExam,
  deleteHealthMetric,
  getHealthSummary,
  saveHealthExam,
  saveHealthMetric,
} from '../data/healthRepository'

export function useHealth() {
  const [error, setError] = useState<string | null>(null)

  const summary = useLiveQuery(() => getHealthSummary(), [], null)

  async function runAction(action: () => Promise<void>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar os dados de saúde.',
      )
    }
  }

  return {
    summary,
    error,
    isLoading: summary === undefined || summary === null,
    saveMetric: (input: {
      systolicPressure: number | null
      diastolicPressure: number | null
      restingHeartRate: number | null
      symptom: string
      notes: string
    }) => runAction(() => saveHealthMetric(input)),
    deleteMetric: (id: string) =>
      runAction(() => deleteHealthMetric(id)),
    saveExam: (input: {
      examDate: string
      title: string
      category: string
      value: string
      referenceRange: string
      notes: string
    }) => runAction(() => saveHealthExam(input)),
    deleteExam: (id: string) =>
      runAction(() => deleteHealthExam(id)),
  }
}
EOF

cat > src/modules/health/components/HealthMetricForm.tsx <<'EOF'
import { Save } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'

type HealthMetricFormProps = {
  onSave: (input: {
    systolicPressure: number | null
    diastolicPressure: number | null
    restingHeartRate: number | null
    symptom: string
    notes: string
  }) => Promise<unknown>
}

export function HealthMetricForm({
  onSave,
}: HealthMetricFormProps) {
  const [systolicPressure, setSystolicPressure] = useState(0)
  const [diastolicPressure, setDiastolicPressure] = useState(0)
  const [restingHeartRate, setRestingHeartRate] = useState(0)
  const [symptom, setSymptom] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <Card>
      <h2 className="text-lg font-bold">Registro de saúde</h2>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <NumberField
          label="Sistólica"
          suffix="mmHg"
          value={systolicPressure}
          onChange={setSystolicPressure}
        />
        <NumberField
          label="Diastólica"
          suffix="mmHg"
          value={diastolicPressure}
          onChange={setDiastolicPressure}
        />
        <NumberField
          label="FC repouso"
          suffix="bpm"
          value={restingHeartRate}
          onChange={setRestingHeartRate}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold text-slate-500">
          Sintoma
        </span>
        <input
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-blue-400"
          onChange={(event) => setSymptom(event.target.value)}
          placeholder="Ex.: dor de cabeça, tontura, nenhum"
          value={symptom}
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold text-slate-500">
          Observações
        </span>
        <textarea
          className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-blue-400"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Contexto da medição..."
          value={notes}
        />
      </label>

      <Button
        className="mt-5"
        fullWidth
        onClick={() =>
          onSave({
            systolicPressure:
              systolicPressure > 0 ? systolicPressure : null,
            diastolicPressure:
              diastolicPressure > 0 ? diastolicPressure : null,
            restingHeartRate:
              restingHeartRate > 0 ? restingHeartRate : null,
            symptom,
            notes,
          })
        }
      >
        <Save size={18} aria-hidden="true" />
        Salvar registro
      </Button>
    </Card>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  suffix: string
  onChange: (value: number) => void
}

function NumberField({
  label,
  value,
  suffix,
  onChange,
}: NumberFieldProps) {
  return (
    <label>
      <span className="mb-2 block text-[11px] font-bold text-slate-500">
        {label}
      </span>
      <div className="rounded-2xl bg-white/5 p-2">
        <input
          className="min-h-10 w-full bg-transparent text-center font-black text-white outline-none"
          min={0}
          onChange={(event) => onChange(Number(event.target.value))}
          type="number"
          value={value}
        />
        <span className="block text-center text-[10px] text-slate-600">
          {suffix}
        </span>
      </div>
    </label>
  )
}
EOF

cat > src/modules/health/components/HealthExamForm.tsx <<'EOF'
import { FilePlus2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'

type HealthExamFormProps = {
  onSave: (input: {
    examDate: string
    title: string
    category: string
    value: string
    referenceRange: string
    notes: string
  }) => Promise<unknown>
}

export function HealthExamForm({ onSave }: HealthExamFormProps) {
  const [examDate, setExamDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [value, setValue] = useState('')
  const [referenceRange, setReferenceRange] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <Card>
      <h2 className="text-lg font-bold">Adicionar exame</h2>

      <div className="mt-5 space-y-3">
        <Field label="Data">
          <input
            className="field"
            onChange={(event) => setExamDate(event.target.value)}
            type="date"
            value={examDate}
          />
        </Field>

        <Field label="Nome">
          <input
            className="field"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: Hemograma"
            value={title}
          />
        </Field>

        <Field label="Categoria">
          <input
            className="field"
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Ex.: Hormonal, metabólico"
            value={category}
          />
        </Field>

        <Field label="Resultado">
          <input
            className="field"
            onChange={(event) => setValue(event.target.value)}
            placeholder="Valor e unidade"
            value={value}
          />
        </Field>

        <Field label="Referência">
          <input
            className="field"
            onChange={(event) => setReferenceRange(event.target.value)}
            placeholder="Faixa informada pelo laboratório"
            value={referenceRange}
          />
        </Field>

        <Field label="Observações">
          <textarea
            className="field min-h-24 resize-none"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </Field>
      </div>

      <Button
        className="mt-5"
        fullWidth
        onClick={() =>
          onSave({
            examDate,
            title,
            category,
            value,
            referenceRange,
            notes,
          })
        }
      >
        <FilePlus2 size={18} aria-hidden="true" />
        Salvar exame
      </Button>
    </Card>
  )
}

type FieldProps = {
  label: string
  children: React.ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-500">
        {label}
      </span>
      {children}
    </label>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/health/components/HealthExamForm.tsx")
content = path.read_text()

content = content.replace(
    "import { FilePlus2 } from 'lucide-react'",
    """import type { ReactNode } from 'react'
import { FilePlus2 } from 'lucide-react'""",
)

content = content.replace("React.ReactNode", "ReactNode")
content = content.replace(
    'className="field"',
    'className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-blue-400"',
)
content = content.replace(
    'className="field min-h-24 resize-none"',
    'className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-blue-400"',
)

path.write_text(content)
PY

cat > src/modules/health/components/HealthHistory.tsx <<'EOF'
import { HeartPulse, Trash2 } from 'lucide-react'
import { Button, Card } from '../../../shared/ui'
import type {
  HealthExam,
  HealthMetric,
} from '../types/health'

type HealthHistoryProps = {
  metrics: HealthMetric[]
  exams: HealthExam[]
  onDeleteMetric: (id: string) => Promise<unknown>
  onDeleteExam: (id: string) => Promise<unknown>
}

export function HealthHistory({
  metrics,
  exams,
  onDeleteMetric,
  onDeleteExam,
}: HealthHistoryProps) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-lg font-bold">Medições</h2>

        <div className="space-y-3">
          {metrics.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-400">
                Nenhuma medição registrada.
              </p>
            </Card>
          ) : (
            metrics.map((item) => (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                      {new Intl.DateTimeFormat('pt-BR').format(
                        new Date(`${item.localDate}T12:00:00`),
                      )}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      {item.systolicPressure &&
                      item.diastolicPressure ? (
                        <span className="rounded-xl bg-white/5 px-3 py-2">
                          {item.systolicPressure}/
                          {item.diastolicPressure} mmHg
                        </span>
                      ) : null}

                      {item.restingHeartRate ? (
                        <span className="rounded-xl bg-white/5 px-3 py-2">
                          {item.restingHeartRate} bpm
                        </span>
                      ) : null}
                    </div>

                    {item.symptom ? (
                      <p className="mt-3 text-sm text-slate-400">
                        Sintoma: {item.symptom}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    aria-label="Excluir medição"
                    onClick={() => onDeleteMetric(item.id)}
                    variant="ghost"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Exames</h2>

        <div className="space-y-3">
          {exams.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-400">
                Nenhum exame registrado.
              </p>
            </Card>
          ) : (
            exams.map((item) => (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-blue-300">
                      <HeartPulse size={17} aria-hidden="true" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {item.category || 'Exame'}
                      </span>
                    </div>

                    <h3 className="mt-2 font-bold">{item.title}</h3>

                    <p className="mt-2 text-sm text-slate-300">
                      Resultado: {item.value || 'Não informado'}
                    </p>

                    {item.referenceRange ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Referência: {item.referenceRange}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    aria-label="Excluir exame"
                    onClick={() => onDeleteExam(item.id)}
                    variant="ghost"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
EOF

cat > src/modules/health/pages/HealthPage.tsx <<'EOF'
import { Activity, HeartPulse, ShieldAlert } from 'lucide-react'
import { Card } from '../../../shared/ui'
import { HealthExamForm } from '../components/HealthExamForm'
import { HealthHistory } from '../components/HealthHistory'
import { HealthMetricForm } from '../components/HealthMetricForm'
import { useHealth } from '../hooks/useHealth'

export function HealthPage() {
  const {
    summary,
    error,
    isLoading,
    saveMetric,
    deleteMetric,
    saveExam,
    deleteExam,
  } = useHealth()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro na saúde</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !summary) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Carregando saúde...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-300">
          TITAN SAÚDE
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Saúde e acompanhamento
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Registre sinais, sintomas e exames sem substituir avaliação médica.
        </p>
      </header>

      <Card elevated>
        <div className="grid grid-cols-2 gap-3">
          <Metric
            icon={<HeartPulse size={19} aria-hidden="true" />}
            label="FC média"
            value={
              summary.averageRestingHeartRate !== null
                ? `${summary.averageRestingHeartRate} bpm`
                : '—'
            }
          />

          <Metric
            icon={<Activity size={19} aria-hidden="true" />}
            label="Pressão recente"
            value={
              summary.latestMetric?.systolicPressure &&
              summary.latestMetric?.diastolicPressure
                ? `${summary.latestMetric.systolicPressure}/${summary.latestMetric.diastolicPressure}`
                : '—'
            }
          />
        </div>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <div className="flex gap-3">
          <ShieldAlert
            className="shrink-0 text-amber-300"
            size={22}
            aria-hidden="true"
          />

          <p className="text-sm leading-6 text-slate-400">
            O TITAN organiza informações. Ele não diagnostica, não interpreta
            exames e não prescreve medicamentos.
          </p>
        </div>
      </Card>

      <HealthMetricForm onSave={saveMetric} />
      <HealthExamForm onSave={saveExam} />

      <HealthHistory
        exams={summary.exams}
        metrics={summary.metrics}
        onDeleteExam={deleteExam}
        onDeleteMetric={deleteMetric}
      />
    </div>
  )
}

type MetricProps = {
  icon: React.ReactNode
  label: string
  value: string
}

function Metric({
  icon,
  label,
  value,
}: MetricProps) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>

      <p className="mt-3 text-xl font-black">{value}</p>
    </div>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/health/pages/HealthPage.tsx")
content = path.read_text()

content = content.replace(
    "import { Activity, HeartPulse, ShieldAlert } from 'lucide-react'",
    """import type { ReactNode } from 'react'
import { Activity, HeartPulse, ShieldAlert } from 'lucide-react'""",
)

content = content.replace("React.ReactNode", "ReactNode")
path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/App.tsx")
content = path.read_text()

if "HealthPage" not in content:
    content = content.replace(
        "import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'",
        """import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { HealthPage } from '../modules/health/pages/HealthPage'""",
    )

if 'path="/health"' not in content:
    anchor = '          <Route path="/health/sleep" element={<SleepPage />} />'
    content = content.replace(
        anchor,
        """          <Route path="/health" element={<HealthPage />} />
""" + anchor,
    )

path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/settings/pages/SettingsPage.tsx")
content = path.read_text()

if "Stethoscope" not in content:
    content = content.replace(
        "  ShieldCheck,",
        "  ShieldCheck,\n  Stethoscope,",
    )

insert = """
      <Card>
        <div className="flex gap-3">
          <Stethoscope
            className="shrink-0 text-emerald-300"
            size={23}
            aria-hidden="true"
          />

          <div className="flex-1">
            <h2 className="font-bold">Saúde</h2>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Pressão, frequência cardíaca, sintomas e exames.
            </p>

            <Link
              className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-white/10 px-4 text-sm font-bold text-white"
              to="/health"
            >
              Abrir saúde
            </Link>
          </div>
        </div>
      </Card>
"""

anchor = """      <Card>
        <div className="flex gap-3">
          <Moon"""

if "Abrir saúde" not in content:
    content = content.replace(anchor, insert + "\n" + anchor)

path.write_text(content)
PY

cat > docs/features/HEALTH_RECOVERY_PREMIUM.md <<'EOF'
# Feature Saúde e Recuperação Premium

## Incluído

- Pressão arterial.
- Frequência cardíaca de repouso.
- Sintomas e observações.
- Registro de exames.
- Histórico de saúde.
- Persistência IndexedDB.
- Integração com a página Mais.

## Limites

O módulo organiza dados e não realiza diagnóstico, interpretação clínica ou prescrição.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Feature Saúde e Recuperação Premium

### Added

- Registro de pressão arterial.
- Frequência cardíaca de repouso.
- Sintomas.
- Exames.
- Histórico de saúde.
- Schema 7 do IndexedDB.
EOF

echo "🧪 Validando..."
npm run validate

echo
echo "✅ Feature Saúde e Recuperação Premium aplicada."
echo "Backup: $BACKUP_DIR"
echo
echo 'Execute:'
echo 'git add .'
echo 'git commit -m "feat: deliver premium health and recovery flow"'
echo 'git push'
