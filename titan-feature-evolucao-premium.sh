#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Feature Evolução Premium"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".titan-backups/evolution-$STAMP"
mkdir -p "$BACKUP_DIR" docs/features src/modules/evolution/{components,data,hooks,pages,types,utils}

for item in src/modules/evolution src/database/titanDatabase.ts docs; do
  if [ -e "$item" ]; then
    cp -R "$item" "$BACKUP_DIR/"
  fi
done

python3 - <<'PY'
from pathlib import Path

path = Path("src/database/titanDatabase.ts")
content = path.read_text()

photo_type = """
export type ProgressPhotoRecord = {
  id: string
  userId: string
  localDate: string
  imageDataUrl: string
  pose: 'front' | 'side' | 'back' | 'other'
  notes: string
  createdAt: string
  updatedAt: string
}

"""

marker = "export type CardioPlanRecord = {"
if "export type ProgressPhotoRecord" not in content:
    content = content.replace(marker, photo_type + marker)

class_marker = "  bodyMetrics!: EntityTable<BodyMetricRecord, 'id'>"
if "progressPhotos!: EntityTable" not in content:
    content = content.replace(
        class_marker,
        class_marker + "\n  progressPhotos!: EntityTable<ProgressPhotoRecord, 'id'>",
    )

version6 = """
    this.version(6).stores({
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
if "this.version(6)" not in content:
    content = content.replace(end, version6 + end)

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

export type ProgressPhoto = {
  id: string
  localDate: string
  imageDataUrl: string
  pose: 'front' | 'side' | 'back' | 'other'
  notes: string
}

export type EvolutionTrendPoint = {
  localDate: string
  weightKg: number
  waistCm: number | null
}

export type EvolutionSummary = {
  latestWeightKg: number | null
  previousWeightKg: number | null
  weightVariationKg: number | null
  weeklyAverageKg: number | null
  latestWaistCm: number | null
  waistVariationCm: number | null
  latestBodyFatPercentage: number | null
  entries: BodyMetric[]
  photos: ProgressPhoto[]
  trend: EvolutionTrendPoint[]
  bestStrengthRecords: Array<{
    exerciseName: string
    estimatedOneRepMaxKg: number
    localDate: string
  }>
  cardioSummary: {
    completedSessions: number
    totalMinutes: number
    totalDistanceKm: number
  }
}
EOF

cat > src/modules/evolution/utils/evolutionMath.ts <<'EOF'
export function calculateVariation(
  latest: number | null,
  previous: number | null,
) {
  if (latest === null || previous === null) return null
  return latest - previous
}

export function calculateAverage(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function normalizeChartValue(
  value: number,
  minimum: number,
  maximum: number,
) {
  if (maximum <= minimum) return 50
  return ((value - minimum) / (maximum - minimum)) * 100
}
EOF

cat > src/modules/evolution/data/evolutionRepository.ts <<'EOF'
import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type BodyMetricRecord,
  type ProgressPhotoRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { EvolutionSummary } from '../types/evolution'
import {
  calculateAverage,
  calculateVariation,
} from '../utils/evolutionMath'

export async function getEvolutionSummary(): Promise<EvolutionSummary> {
  const [metrics, photos, personalRecords, cardioSessions] =
    await Promise.all([
      titanDatabase.bodyMetrics
        .where('userId')
        .equals(TITAN_USER_ID)
        .toArray(),
      titanDatabase.progressPhotos
        .where('userId')
        .equals(TITAN_USER_ID)
        .toArray(),
      titanDatabase.exercisePersonalRecords
        .where('userId')
        .equals(TITAN_USER_ID)
        .toArray(),
      titanDatabase.cardioSessions
        .where('userId')
        .equals(TITAN_USER_ID)
        .toArray(),
    ])

  const sortedMetrics = [...metrics].sort((a, b) =>
    b.localDate.localeCompare(a.localDate),
  )
  const latest = sortedMetrics[0] ?? null
  const previous = sortedMetrics[1] ?? null

  const lastSeven = sortedMetrics.slice(0, 7)

  const latestWithWaist = sortedMetrics.find(
    (item) => item.waistCm !== null,
  )
  const previousWithWaist = sortedMetrics
    .filter((item) => item.waistCm !== null)
    .at(1)

  const bestRecordByExercise = new Map<
    string,
    (typeof personalRecords)[number]
  >()

  for (const record of personalRecords) {
    const current = bestRecordByExercise.get(record.exerciseName)

    if (
      !current ||
      record.estimatedOneRepMaxKg > current.estimatedOneRepMaxKg
    ) {
      bestRecordByExercise.set(record.exerciseName, record)
    }
  }

  const completedCardio = cardioSessions.filter(
    (session) => session.status === 'completed',
  )

  return {
    latestWeightKg: latest?.weightKg ?? null,
    previousWeightKg: previous?.weightKg ?? null,
    weightVariationKg: calculateVariation(
      latest?.weightKg ?? null,
      previous?.weightKg ?? null,
    ),
    weeklyAverageKg: calculateAverage(
      lastSeven.map((item) => item.weightKg),
    ),
    latestWaistCm: latestWithWaist?.waistCm ?? null,
    waistVariationCm: calculateVariation(
      latestWithWaist?.waistCm ?? null,
      previousWithWaist?.waistCm ?? null,
    ),
    latestBodyFatPercentage:
      sortedMetrics.find((item) => item.bodyFatPercentage !== null)
        ?.bodyFatPercentage ?? null,
    entries: sortedMetrics,
    photos: [...photos]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((photo) => ({
        id: photo.id,
        localDate: photo.localDate,
        imageDataUrl: photo.imageDataUrl,
        pose: photo.pose,
        notes: photo.notes,
      })),
    trend: [...metrics]
      .sort((a, b) => a.localDate.localeCompare(b.localDate))
      .slice(-12)
      .map((item) => ({
        localDate: item.localDate,
        weightKg: item.weightKg,
        waistCm: item.waistCm,
      })),
    bestStrengthRecords: [...bestRecordByExercise.values()]
      .sort(
        (a, b) =>
          b.estimatedOneRepMaxKg - a.estimatedOneRepMaxKg,
      )
      .slice(0, 6)
      .map((record) => ({
        exerciseName: record.exerciseName,
        estimatedOneRepMaxKg: record.estimatedOneRepMaxKg,
        localDate: record.localDate,
      })),
    cardioSummary: {
      completedSessions: completedCardio.length,
      totalMinutes: completedCardio.reduce(
        (sum, item) => sum + item.durationMinutes,
        0,
      ),
      totalDistanceKm: completedCardio.reduce(
        (sum, item) => sum + (item.distanceKm ?? 0),
        0,
      ),
    },
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

export async function saveProgressPhoto(input: {
  imageDataUrl: string
  pose: ProgressPhotoRecord['pose']
  notes: string
}) {
  if (!input.imageDataUrl.startsWith('data:image/')) {
    throw new Error('Imagem inválida.')
  }

  const now = new Date().toISOString()

  await titanDatabase.progressPhotos.add({
    id: `progress-photo-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate: getTitanLocalDate(),
    imageDataUrl: input.imageDataUrl,
    pose: input.pose,
    notes: input.notes.trim(),
    createdAt: now,
    updatedAt: now,
  })
}

export async function deleteProgressPhoto(id: string) {
  await titanDatabase.progressPhotos.delete(id)
}
EOF

cat > src/modules/evolution/hooks/useEvolution.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  deleteBodyMetric,
  deleteProgressPhoto,
  getEvolutionSummary,
  saveBodyMetric,
  saveProgressPhoto,
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
    saveProgressPhoto: (input: {
      imageDataUrl: string
      pose: 'front' | 'side' | 'back' | 'other'
      notes: string
    }) => runAction(() => saveProgressPhoto(input)),
    deleteProgressPhoto: (id: string) =>
      runAction(() => deleteProgressPhoto(id)),
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
        <NumberField label="Peso" suffix="kg" value={weightKg} onChange={setWeightKg} min={1} step={0.1} />
        <NumberField label="Cintura" suffix="cm" value={waistCm} onChange={setWaistCm} min={0} step={0.1} />
        <NumberField label="Braço" suffix="cm" value={armCm} onChange={setArmCm} min={0} step={0.1} />
        <NumberField label="Peito" suffix="cm" value={chestCm} onChange={setChestCm} min={0} step={0.1} />
        <NumberField label="Coxa" suffix="cm" value={thighCm} onChange={setThighCm} min={0} step={0.1} />
        <NumberField label="Panturrilha" suffix="cm" value={calfCm} onChange={setCalfCm} min={0} step={0.1} />
        <NumberField label="Gordura" suffix="%" value={bodyFatPercentage} onChange={setBodyFatPercentage} min={0} max={100} step={0.1} />
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

cat > src/modules/evolution/components/EvolutionChart.tsx <<'EOF'
import { Card } from '../../../shared/ui'
import type { EvolutionTrendPoint } from '../types/evolution'
import { normalizeChartValue } from '../utils/evolutionMath'

type EvolutionChartProps = {
  trend: EvolutionTrendPoint[]
}

export function EvolutionChart({ trend }: EvolutionChartProps) {
  if (trend.length < 2) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Registre pelo menos duas medições para visualizar a tendência.
        </p>
      </Card>
    )
  }

  const weights = trend.map((item) => item.weightKg)
  const minimum = Math.min(...weights)
  const maximum = Math.max(...weights)

  return (
    <Card>
      <h2 className="text-lg font-bold">Tendência de peso</h2>

      <div className="mt-6 flex h-44 items-end gap-2">
        {trend.map((item) => {
          const normalized = normalizeChartValue(
            item.weightKg,
            minimum,
            maximum,
          )
          const height = 30 + normalized * 0.7

          return (
            <div
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
              key={item.localDate}
            >
              <span className="text-[10px] font-bold text-slate-400">
                {item.weightKg.toLocaleString('pt-BR', {
                  maximumFractionDigits: 1,
                })}
              </span>
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-cyan-400"
                style={{ height: `${height}%` }}
              />
              <span className="text-[9px] text-slate-600">
                {item.localDate.slice(5).replace('-', '/')}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
EOF

cat > src/modules/evolution/components/ProgressPhotos.tsx <<'EOF'
import { Camera, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import type { ProgressPhoto } from '../types/evolution'

type ProgressPhotosProps = {
  photos: ProgressPhoto[]
  onSave: (input: {
    imageDataUrl: string
    pose: 'front' | 'side' | 'back' | 'other'
    notes: string
  }) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

export function ProgressPhotos({
  photos,
  onSave,
  onDelete,
}: ProgressPhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pose, setPose] = useState<
    'front' | 'side' | 'back' | 'other'
  >('front')

  async function handleFile(file: File) {
    const imageDataUrl = await readFileAsDataUrl(file)
    await onSave({ imageDataUrl, pose, notes: '' })
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-3">
          <Camera className="text-blue-300" size={22} aria-hidden="true" />
          <div>
            <h2 className="font-bold">Fotos de evolução</h2>
            <p className="mt-1 text-sm text-slate-400">
              Use iluminação, distância e posição semelhantes.
            </p>
          </div>
        </div>

        <select
          className="mt-4 min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white"
          onChange={(event) =>
            setPose(
              event.target.value as 'front' | 'side' | 'back' | 'other',
            )
          }
          value={pose}
        >
          <option value="front">Frente</option>
          <option value="side">Lateral</option>
          <option value="back">Costas</option>
          <option value="other">Outra</option>
        </select>

        <Button
          className="mt-4"
          fullWidth
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={18} aria-hidden="true" />
          Adicionar foto
        </Button>

        <input
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
            event.target.value = ''
          }}
          ref={inputRef}
          type="file"
        />
      </Card>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <Card className="overflow-hidden p-0" key={photo.id}>
              <img
                alt={`Evolução ${photo.pose}`}
                className="aspect-[3/4] w-full object-cover"
                src={photo.imageDataUrl}
              />
              <div className="p-3">
                <p className="text-xs font-bold uppercase text-blue-300">
                  {photo.pose}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Intl.DateTimeFormat('pt-BR').format(
                    new Date(`${photo.localDate}T12:00:00`),
                  )}
                </p>
                <Button
                  className="mt-3 w-full"
                  onClick={() => onDelete(photo.id)}
                  variant="ghost"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
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
                  entry.chestCm ? `Peito ${entry.chestCm} cm` : null,
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
import { Activity, ArrowDown, ArrowUp, Dumbbell, Minus } from 'lucide-react'
import { Card, SectionTitle } from '../../../shared/ui'
import { BodyMetricForm } from '../components/BodyMetricForm'
import { EvolutionChart } from '../components/EvolutionChart'
import { EvolutionHistory } from '../components/EvolutionHistory'
import { ProgressPhotos } from '../components/ProgressPhotos'
import { useEvolution } from '../hooks/useEvolution'

export function EvolutionPage() {
  const {
    summary,
    error,
    isLoading,
    saveBodyMetric,
    deleteBodyMetric,
    saveProgressPhoto,
    deleteProgressPhoto,
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
          Peso, medidas, fotos, força e cardio em um só lugar.
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
          <Metric
            label="Cintura"
            value={
              summary.latestWaistCm !== null
                ? `${summary.latestWaistCm.toLocaleString('pt-BR')} cm`
                : '—'
            }
          />
          <Metric
            label="Gordura"
            value={
              summary.latestBodyFatPercentage !== null
                ? `${summary.latestBodyFatPercentage.toLocaleString(
                    'pt-BR',
                  )}%`
                : '—'
            }
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Variation
            label="Variação de peso"
            value={summary.weightVariationKg}
            suffix="kg"
          />
          <Variation
            label="Variação de cintura"
            value={summary.waistVariationCm}
            suffix="cm"
          />
        </div>
      </Card>

      <EvolutionChart trend={summary.trend} />

      <BodyMetricForm onSave={saveBodyMetric} />

      <ProgressPhotos
        photos={summary.photos}
        onDelete={deleteProgressPhoto}
        onSave={saveProgressPhoto}
      />

      <section>
        <SectionTitle title="Força" supportingText="Melhores 1RM estimados" />
        <Card>
          {summary.bestStrengthRecords.length === 0 ? (
            <p className="text-sm text-slate-400">
              Registre séries para gerar recordes de força.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.bestStrengthRecords.map((record) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-3"
                  key={record.exerciseName}
                >
                  <div className="flex items-center gap-3">
                    <Dumbbell
                      className="text-violet-300"
                      size={18}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-bold">
                      {record.exerciseName}
                    </span>
                  </div>
                  <span className="font-black">
                    {record.estimatedOneRepMaxKg.toLocaleString('pt-BR', {
                      maximumFractionDigits: 1,
                    })}{' '}
                    kg
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle title="Cardio acumulado" />
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Metric
              label="Sessões"
              value={`${summary.cardioSummary.completedSessions}`}
            />
            <Metric
              label="Minutos"
              value={`${summary.cardioSummary.totalMinutes}`}
            />
            <Metric
              label="Distância"
              value={`${summary.cardioSummary.totalDistanceKm.toLocaleString(
                'pt-BR',
                { maximumFractionDigits: 1 },
              )} km`}
            />
          </div>
        </Card>
      </section>

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

type VariationProps = {
  label: string
  value: number | null
  suffix: string
}

function Variation({ label, value, suffix }: VariationProps) {
  const Icon =
    value === null || value === 0
      ? Minus
      : value > 0
        ? ArrowUp
        : ArrowDown

  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={17} aria-hidden="true" />
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-2 text-lg font-black">
        {value === null
          ? '—'
          : `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            })} ${suffix}`}
      </p>
    </div>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path("src/modules/evolution/pages/EvolutionPage.tsx")
content = path.read_text()
content = content.replace(
    "import { Activity, ArrowDown, ArrowUp, Dumbbell, Minus } from 'lucide-react'",
    "import { ArrowDown, ArrowUp, Dumbbell, Minus } from 'lucide-react'",
)
path.write_text(content)
PY

cat > docs/features/EVOLUTION_PREMIUM.md <<'EOF'
# Feature Evolução Premium

## Incluído

- Peso e medidas corporais.
- Média recente e variações.
- Tendência visual de peso.
- Fotos de evolução.
- Recordes de força.
- Resumo acumulado de cardio.
- Histórico completo.
- Persistência IndexedDB.

## Critérios de aceite

- Registro do mesmo dia é atualizado.
- Fotos permanecem no aparelho.
- Gráfico exige pelo menos duas medições.
- Recordes vêm dos dados reais de treino.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Feature Evolução Premium

### Added

- Fotos de evolução.
- Tendência de peso.
- Variação de cintura.
- Recordes de força.
- Resumo acumulado de cardio.
- Schema 6 do IndexedDB.
EOF

echo "🧪 Validando..."
npm run validate

echo
echo "✅ Feature Evolução Premium aplicada."
echo "Backup: $BACKUP_DIR"
echo
echo 'Execute:'
echo 'git add .'
echo 'git commit -m "feat: deliver premium evolution flow"'
echo 'git push'
