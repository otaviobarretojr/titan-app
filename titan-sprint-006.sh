#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Sprint 006: Cardio Module"

mkdir -p \
  docs/sprints \
  src/modules/cardio/components \
  src/modules/cardio/data \
  src/modules/cardio/hooks \
  src/modules/cardio/pages \
  src/modules/cardio/types

python3 - <<'PY'
from pathlib import Path

path = Path("src/database/titanDatabase.ts")
content = path.read_text()

insert_types = """
export type CardioPlanRecord = {
  id: string
  userId: string
  localDate: string
  type: 'walking' | 'zone2' | 'running' | 'hiit'
  title: string
  plannedTime: string
  targetDurationMinutes: number
  targetDistanceKm: number | null
  createdAt: string
  updatedAt: string
}

export type CardioSessionRecord = {
  id: string
  userId: string
  cardioPlanId: string
  localDate: string
  status: 'started' | 'completed' | 'cancelled'
  durationMinutes: number
  distanceKm: number | null
  averageHeartRate: number | null
  perceivedEffort: number
  notes: string
  startedAt: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

"""

marker = "export type HydrationEntryRecord = {"
if "export type CardioPlanRecord" not in content:
    content = content.replace(marker, insert_types + marker)

class_marker = "  hydrationEntries!: EntityTable<HydrationEntryRecord, 'id'>"
if "cardioPlans!: EntityTable" not in content:
    content = content.replace(
        class_marker,
        """  cardioPlans!: EntityTable<CardioPlanRecord, 'id'>
  cardioSessions!: EntityTable<CardioSessionRecord, 'id'>
""" + class_marker,
    )

version3 = """
    this.version(3).stores({
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
if "this.version(3)" not in content:
    content = content.replace(constructor_end, version3 + constructor_end)

path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/database/seeds/seedToday.ts")
content = path.read_text()

if "titanDatabase.cardioPlans" not in content:
    content = content.replace(
        "      titanDatabase.exercisePlans,\n      titanDatabase.coachRecommendations,",
        "      titanDatabase.exercisePlans,\n      titanDatabase.cardioPlans,\n      titanDatabase.coachRecommendations,",
    )

seed_block = """
      const cardioPlan = await titanDatabase.cardioPlans
        .where('[userId+localDate]')
        .equals([USER_ID, localDate])
        .first()

      if (!cardioPlan) {
        await titanDatabase.cardioPlans.add({
          id: createId('cardio'),
          userId: USER_ID,
          localDate,
          type: 'zone2',
          title: 'Cardio Zona 2',
          plannedTime: '18:10',
          targetDurationMinutes: 30,
          targetDistanceKm: null,
          createdAt: now,
          updatedAt: now,
        })
      }

"""

marker = "      const recommendation = await titanDatabase.coachRecommendations"
if "const cardioPlan =" not in content:
    content = content.replace(marker, seed_block + marker)

path.write_text(content)
PY

cat > src/modules/cardio/types/cardio.ts <<'EOF'
export type CardioType = 'walking' | 'zone2' | 'running' | 'hiit'

export type CardioSessionStatus =
  | 'planned'
  | 'started'
  | 'completed'
  | 'cancelled'

export type CardioDay = {
  id: string
  title: string
  type: CardioType
  plannedTime: string
  targetDurationMinutes: number
  targetDistanceKm: number | null
  status: CardioSessionStatus
  sessionId: string | null
  durationMinutes: number
  distanceKm: number | null
  averageHeartRate: number | null
  perceivedEffort: number
  notes: string
}
EOF

cat > src/modules/cardio/data/cardioRepository.ts <<'EOF'
import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type CardioSessionRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type { CardioDay } from '../types/cardio'

export async function getCardioDay(): Promise<CardioDay | null> {
  const localDate = getTitanLocalDate()

  const plan = await titanDatabase.cardioPlans
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .first()

  if (!plan) return null

  const session = await titanDatabase.cardioSessions
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .filter((item) => item.cardioPlanId === plan.id)
    .first()

  return {
    id: plan.id,
    title: plan.title,
    type: plan.type,
    plannedTime: plan.plannedTime,
    targetDurationMinutes: plan.targetDurationMinutes,
    targetDistanceKm: plan.targetDistanceKm,
    status: session?.status ?? 'planned',
    sessionId: session?.id ?? null,
    durationMinutes: session?.durationMinutes ?? plan.targetDurationMinutes,
    distanceKm: session?.distanceKm ?? plan.targetDistanceKm,
    averageHeartRate: session?.averageHeartRate ?? null,
    perceivedEffort: session?.perceivedEffort ?? 5,
    notes: session?.notes ?? '',
  }
}

export async function startCardio(cardioPlanId: string) {
  const localDate = getTitanLocalDate()

  const existing = await titanDatabase.cardioSessions
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .filter((item) => item.cardioPlanId === cardioPlanId)
    .first()

  if (existing) return existing.id

  const now = new Date().toISOString()

  const session: CardioSessionRecord = {
    id: `cardio-session-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    cardioPlanId,
    localDate,
    status: 'started',
    durationMinutes: 0,
    distanceKm: null,
    averageHeartRate: null,
    perceivedEffort: 5,
    notes: '',
    startedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  await titanDatabase.cardioSessions.add(session)
  return session.id
}

export async function completeCardio(input: {
  sessionId: string
  durationMinutes: number
  distanceKm: number | null
  averageHeartRate: number | null
  perceivedEffort: number
  notes: string
}) {
  if (input.durationMinutes <= 0) {
    throw new Error('A duração deve ser maior que zero.')
  }

  if (input.perceivedEffort < 1 || input.perceivedEffort > 10) {
    throw new Error('O esforço percebido deve ficar entre 1 e 10.')
  }

  const session = await titanDatabase.cardioSessions.get(input.sessionId)

  if (!session) {
    throw new Error('Sessão de cardio não encontrada.')
  }

  const now = new Date().toISOString()

  await titanDatabase.cardioSessions.update(input.sessionId, {
    status: 'completed',
    durationMinutes: input.durationMinutes,
    distanceKm: input.distanceKm,
    averageHeartRate: input.averageHeartRate,
    perceivedEffort: input.perceivedEffort,
    notes: input.notes.trim(),
    completedAt: now,
    updatedAt: now,
  })
}

export async function resetCardio(sessionId: string) {
  await titanDatabase.cardioSessions.delete(sessionId)
}
EOF

cat > src/modules/cardio/hooks/useCardioDay.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { seedToday } from '../../../database/seeds/seedToday'
import {
  completeCardio,
  getCardioDay,
  resetCardio,
  startCardio,
} from '../data/cardioRepository'

export function useCardioDay() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    seedToday()
      .then(() => setIsReady(true))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível preparar o cardio.',
        )
      })
  }, [])

  const cardio = useLiveQuery(
    () => (isReady ? getCardioDay() : null),
    [isReady],
    null,
  )

  async function runAction(action: () => Promise<unknown>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar o cardio.',
      )
    }
  }

  return {
    cardio,
    error,
    isLoading:
      !error && (!isReady || cardio === undefined || cardio === null),
    startCardio: (cardioPlanId: string) =>
      runAction(() => startCardio(cardioPlanId)),
    completeCardio: (input: {
      sessionId: string
      durationMinutes: number
      distanceKm: number | null
      averageHeartRate: number | null
      perceivedEffort: number
      notes: string
    }) => runAction(() => completeCardio(input)),
    resetCardio: (sessionId: string) =>
      runAction(() => resetCardio(sessionId)),
  }
}
EOF

cat > src/modules/cardio/components/CardioForm.tsx <<'EOF'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import type { CardioDay } from '../types/cardio'

type CardioFormProps = {
  cardio: CardioDay
  onComplete: (input: {
    sessionId: string
    durationMinutes: number
    distanceKm: number | null
    averageHeartRate: number | null
    perceivedEffort: number
    notes: string
  }) => Promise<unknown>
}

export function CardioForm({
  cardio,
  onComplete,
}: CardioFormProps) {
  const [durationMinutes, setDurationMinutes] = useState(
    cardio.targetDurationMinutes,
  )
  const [distanceKm, setDistanceKm] = useState(
    cardio.targetDistanceKm ?? 0,
  )
  const [averageHeartRate, setAverageHeartRate] = useState(0)
  const [perceivedEffort, setPerceivedEffort] = useState(5)
  const [notes, setNotes] = useState('')

  if (!cardio.sessionId) return null

  return (
    <Card>
      <h2 className="text-lg font-bold">Registrar resultado</h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <NumberField
          label="Duração"
          suffix="min"
          value={durationMinutes}
          onChange={setDurationMinutes}
          min={1}
          step={1}
        />

        <NumberField
          label="Distância"
          suffix="km"
          value={distanceKm}
          onChange={setDistanceKm}
          min={0}
          step={0.1}
        />

        <NumberField
          label="FC média"
          suffix="bpm"
          value={averageHeartRate}
          onChange={setAverageHeartRate}
          min={0}
          step={1}
        />

        <NumberField
          label="Esforço"
          suffix="/10"
          value={perceivedEffort}
          onChange={setPerceivedEffort}
          min={1}
          max={10}
          step={1}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold text-slate-500">
          Observações
        </span>
        <textarea
          className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-blue-400"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ritmo, desconfortos, sensação geral..."
          value={notes}
        />
      </label>

      <Button
        className="mt-5"
        fullWidth
        onClick={() =>
          onComplete({
            sessionId: cardio.sessionId!,
            durationMinutes,
            distanceKm: distanceKm > 0 ? distanceKm : null,
            averageHeartRate:
              averageHeartRate > 0 ? averageHeartRate : null,
            perceivedEffort,
            notes,
          })
        }
        variant="secondary"
      >
        <Check size={19} aria-hidden="true" />
        Finalizar cardio
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

cat > src/modules/cardio/pages/CardioPage.tsx <<'EOF'
import {
  Check,
  Footprints,
  HeartPulse,
  Play,
  RotateCcw,
  Timer,
} from 'lucide-react'
import { Button, Card } from '../../../shared/ui'
import { CardioForm } from '../components/CardioForm'
import { useCardioDay } from '../hooks/useCardioDay'

const cardioLabels = {
  walking: 'Caminhada',
  zone2: 'Zona 2',
  running: 'Corrida',
  hiit: 'HIIT',
}

export function CardioPage() {
  const {
    cardio,
    error,
    isLoading,
    startCardio,
    completeCardio,
    resetCardio,
  } = useCardioDay()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro no cardio</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !cardio) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando cardio...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
          TITAN CARDIO
        </p>
        <h1 className="mt-2 text-3xl font-black">{cardio.title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {cardio.plannedTime} · {cardioLabels[cardio.type]}
        </p>
      </header>

      <Card elevated>
        <div className="grid grid-cols-2 gap-3">
          <Metric
            icon={<Timer size={19} aria-hidden="true" />}
            label="Meta"
            value={`${cardio.targetDurationMinutes} min`}
          />
          <Metric
            icon={<Footprints size={19} aria-hidden="true" />}
            label="Distância"
            value={
              cardio.targetDistanceKm
                ? `${cardio.targetDistanceKm} km`
                : 'Livre'
            }
          />
        </div>

        {cardio.status === 'planned' ? (
          <Button
            className="mt-5"
            fullWidth
            onClick={() => startCardio(cardio.id)}
          >
            <Play size={19} aria-hidden="true" />
            Iniciar cardio
          </Button>
        ) : null}

        {cardio.status === 'completed' ? (
          <div className="mt-5 rounded-2xl bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <Check size={19} aria-hidden="true" />
              <span className="font-bold">Cardio concluído</span>
            </div>

            <p className="mt-3 text-sm text-slate-300">
              {cardio.durationMinutes} min
              {cardio.distanceKm
                ? ` · ${cardio.distanceKm.toLocaleString('pt-BR')} km`
                : ''}
              {cardio.averageHeartRate
                ? ` · ${cardio.averageHeartRate} bpm`
                : ''}
            </p>

            {cardio.sessionId ? (
              <Button
                className="mt-4"
                fullWidth
                onClick={() => resetCardio(cardio.sessionId!)}
                variant="ghost"
              >
                <RotateCcw size={18} aria-hidden="true" />
                Refazer registro
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>

      {cardio.status === 'started' ? (
        <CardioForm cardio={cardio} onComplete={completeCardio} />
      ) : null}

      <Card>
        <div className="flex gap-3">
          <HeartPulse
            className="shrink-0 text-cyan-300"
            size={22}
            aria-hidden="true"
          />
          <div>
            <h2 className="font-bold">Orientação</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Na Zona 2, mantenha um esforço sustentável e registre a
              frequência cardíaca média quando disponível.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

type MetricProps = {
  icon: React.ReactNode
  label: string
  value: string
}

function Metric({ icon, label, value }: MetricProps) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-3 text-lg font-black">{value}</p>
    </div>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/cardio/pages/CardioPage.tsx")
content = path.read_text()
content = content.replace(
    "import {\n",
    "import type { ReactNode } from 'react'\nimport {\n",
    1,
)
content = content.replace("icon: React.ReactNode", "icon: ReactNode")
path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/App.tsx")
content = path.read_text()

if "CardioPage" not in content:
    content = content.replace(
        "import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'",
        """import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { CardioPage } from '../modules/cardio/pages/CardioPage'""",
    )

route = '          <Route path="/cardio" element={<CardioPage />} />\n'

if 'path="/cardio"' not in content:
    anchor = '          <Route path="/nutrition" element={<NutritionPage />} />'
    content = content.replace(anchor, route + anchor)

path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/layouts/AppShell.tsx")
content = path.read_text()

if "HeartPulse" not in content:
    content = content.replace(
        "  House,\n",
        "  House,\n  HeartPulse,\n",
    )

if "label: 'Cardio'" not in content:
    anchor = """  {
    label: 'Evolução',
    to: '/evolution',
    icon: ChartNoAxesCombined,
  },"""
    replacement = """  {
    label: 'Cardio',
    to: '/cardio',
    icon: HeartPulse,
  },
""" + anchor
    content = content.replace(anchor, replacement)

path.write_text(content)
PY

cat > docs/sprints/SPRINT-006.md <<'EOF'
# Sprint 006 — Módulo Cardio

## Objetivo

Permitir iniciar e concluir sessões de caminhada, Zona 2, corrida e HIIT.

## Entregas

- Schema 3 do IndexedDB.
- Plano diário de cardio.
- Início e conclusão de sessão.
- Duração, distância, frequência cardíaca, esforço e observações.
- Persistência após recarregar.
- Reset do registro.
- Navegação para o módulo Cardio.

## Critérios de aceite

- A sessão começa somente após ação do usuário.
- Duração e esforço são validados.
- Dados persistem no IndexedDB.
- Build e lint passam sem erros.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Sprint 006

### Added

- Módulo de Cardio.
- Sessões de caminhada, Zona 2, corrida e HIIT.
- Registro de duração, distância, FC média e esforço percebido.
- Schema 3 do IndexedDB.
EOF

echo "🧪 Executando build..."
npm run build

echo "🧹 Executando lint..."
npm run lint

echo ""
echo "✅ Sprint 006 aplicada com sucesso."
echo 'Próximo comando: git add . && git commit -m "feat: implement cardio session tracking" && git push'
