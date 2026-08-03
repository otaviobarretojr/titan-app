#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Feature Cardio Premium"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".titan-backups/cardio-$STAMP"
mkdir -p "$BACKUP_DIR" docs/features src/modules/cardio/{components,data,hooks,pages,types,utils}

for item in src/modules/cardio src/database/titanDatabase.ts docs; do
  if [ -e "$item" ]; then
    cp -R "$item" "$BACKUP_DIR/"
  fi
done

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
  paceMinutesPerKm: number | null
}

export type CardioHistoryItem = {
  id: string
  localDate: string
  title: string
  type: CardioType
  durationMinutes: number
  distanceKm: number | null
  averageHeartRate: number | null
  perceivedEffort: number
  paceMinutesPerKm: number | null
}
EOF

cat > src/modules/cardio/utils/cardioMath.ts <<'EOF'
export function calculatePace(
  durationMinutes: number,
  distanceKm: number | null,
) {
  if (!distanceKm || distanceKm <= 0 || durationMinutes <= 0) return null
  return durationMinutes / distanceKm
}

export function formatPace(paceMinutesPerKm: number | null) {
  if (paceMinutesPerKm === null) return '—'

  const minutes = Math.floor(paceMinutesPerKm)
  const seconds = Math.round((paceMinutesPerKm - minutes) * 60)

  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`
}

export function getCardioFeedback(input: {
  type: 'walking' | 'zone2' | 'running' | 'hiit'
  perceivedEffort: number
  averageHeartRate: number | null
}) {
  if (input.type === 'zone2') {
    if (input.perceivedEffort >= 8) {
      return 'Esforço alto para Zona 2. Reduza o ritmo na próxima sessão.'
    }

    if (input.perceivedEffort <= 6) {
      return 'Esforço compatível com uma sessão sustentável.'
    }
  }

  if (input.type === 'hiit' && input.perceivedEffort < 7) {
    return 'Esforço abaixo do esperado para HIIT.'
  }

  if (input.averageHeartRate === null) {
    return 'Registre a frequência cardíaca quando disponível.'
  }

  return 'Sessão registrada. Compare com o histórico para avaliar evolução.'
}
EOF

cat > src/modules/cardio/data/cardioRepository.ts <<'EOF'
import { getTitanLocalDate } from '../../../database/date'
import { titanDatabase } from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'
import type {
  CardioDay,
  CardioHistoryItem,
} from '../types/cardio'
import { calculatePace } from '../utils/cardioMath'

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
    paceMinutesPerKm: calculatePace(
      session?.durationMinutes ?? 0,
      session?.distanceKm ?? null,
    ),
  }
}

export async function getCardioHistory(
  limit = 12,
): Promise<CardioHistoryItem[]> {
  const sessions = await titanDatabase.cardioSessions
    .where('userId')
    .equals(TITAN_USER_ID)
    .reverse()
    .sortBy('localDate')

  const plans = await titanDatabase.cardioPlans
    .where('userId')
    .equals(TITAN_USER_ID)
    .toArray()

  const planById = new Map(plans.map((plan) => [plan.id, plan]))

  return sessions
    .filter((session) => session.status === 'completed')
    .sort((a, b) => b.localDate.localeCompare(a.localDate))
    .slice(0, limit)
    .map((session) => {
      const plan = planById.get(session.cardioPlanId)

      return {
        id: session.id,
        localDate: session.localDate,
        title: plan?.title ?? 'Cardio',
        type: plan?.type ?? 'walking',
        durationMinutes: session.durationMinutes,
        distanceKm: session.distanceKm,
        averageHeartRate: session.averageHeartRate,
        perceivedEffort: session.perceivedEffort,
        paceMinutesPerKm: calculatePace(
          session.durationMinutes,
          session.distanceKm,
        ),
      }
    })
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

  const session = {
    id: `cardio-session-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    cardioPlanId,
    localDate,
    status: 'started' as const,
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

cat > src/modules/cardio/hooks/useCardioHistory.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { getCardioHistory } from '../data/cardioRepository'

export function useCardioHistory() {
  const history = useLiveQuery(() => getCardioHistory(), [], [])

  return {
    history: history ?? [],
    isLoading: history === undefined,
  }
}
EOF

cat > src/modules/cardio/components/CardioHistory.tsx <<'EOF'
import { Activity, HeartPulse, Timer } from 'lucide-react'
import { Card } from '../../../shared/ui'
import type { CardioHistoryItem } from '../types/cardio'
import { formatPace } from '../utils/cardioMath'

type CardioHistoryProps = {
  history: CardioHistoryItem[]
}

export function CardioHistory({ history }: CardioHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-400">
          Nenhuma sessão concluída ainda.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <Card key={item.id}>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
            {new Intl.DateTimeFormat('pt-BR').format(
              new Date(`${item.localDate}T12:00:00`),
            )}
          </p>

          <h3 className="mt-2 text-lg font-bold">{item.title}</h3>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric
              icon={<Timer size={16} aria-hidden="true" />}
              value={`${item.durationMinutes} min`}
            />
            <Metric
              icon={<Activity size={16} aria-hidden="true" />}
              value={
                item.distanceKm
                  ? `${item.distanceKm.toLocaleString('pt-BR')} km`
                  : '—'
              }
            />
            <Metric
              icon={<HeartPulse size={16} aria-hidden="true" />}
              value={
                item.averageHeartRate
                  ? `${item.averageHeartRate} bpm`
                  : '—'
              }
            />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Pace: {formatPace(item.paceMinutesPerKm)} · Esforço{' '}
            {item.perceivedEffort}/10
          </p>
        </Card>
      ))}
    </div>
  )
}

type MetricProps = {
  icon: React.ReactNode
  value: string
}

function Metric({ icon, value }: MetricProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-xs">
      <span className="text-slate-500">{icon}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path("src/modules/cardio/components/CardioHistory.tsx")
content = path.read_text()
content = content.replace(
    "import { Activity, HeartPulse, Timer } from 'lucide-react'",
    """import type { ReactNode } from 'react'
import { Activity, HeartPulse, Timer } from 'lucide-react'""",
)
content = content.replace("React.ReactNode", "ReactNode")
path.write_text(content)
PY

cat > src/modules/cardio/components/CardioForm.tsx <<'EOF'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import type { CardioDay } from '../types/cardio'
import {
  calculatePace,
  formatPace,
  getCardioFeedback,
} from '../utils/cardioMath'

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

  const pace = calculatePace(
    durationMinutes,
    distanceKm > 0 ? distanceKm : null,
  )

  const feedback = getCardioFeedback({
    type: cardio.type,
    perceivedEffort,
    averageHeartRate:
      averageHeartRate > 0 ? averageHeartRate : null,
  })

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

      <div className="mt-4 rounded-2xl bg-white/5 p-4">
        <p className="text-xs font-bold text-slate-500">Pace estimado</p>
        <p className="mt-2 text-xl font-black">{formatPace(pace)}</p>
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

      <p className="mt-4 rounded-2xl bg-cyan-500/5 p-3 text-xs leading-5 text-cyan-200">
        {feedback}
      </p>

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
import type { ReactNode } from 'react'
import {
  Activity,
  Check,
  Footprints,
  HeartPulse,
  Play,
  RotateCcw,
  Timer,
} from 'lucide-react'
import { Button, Card, SectionTitle } from '../../../shared/ui'
import { CardioForm } from '../components/CardioForm'
import { CardioHistory } from '../components/CardioHistory'
import { useCardioDay } from '../hooks/useCardioDay'
import { useCardioHistory } from '../hooks/useCardioHistory'
import { formatPace } from '../utils/cardioMath'

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

  const { history } = useCardioHistory()

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

            <p className="mt-2 text-sm text-slate-400">
              Pace: {formatPace(cardio.paceMinutesPerKm)} · Esforço{' '}
              {cardio.perceivedEffort}/10
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

      <section>
        <SectionTitle
          title="Histórico"
          supportingText={`${history.length} sessões`}
        />
        <CardioHistory history={history} />
      </section>

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
              Na Zona 2, mantenha um esforço sustentável. Em corrida, compare
              pace, duração e esforço ao longo das semanas.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

type MetricProps = {
  icon: ReactNode
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

cat > docs/features/CARDIO_PREMIUM.md <<'EOF'
# Feature Cardio Premium

## Incluído

- Sessões de caminhada, Zona 2, corrida e HIIT.
- Duração, distância, frequência cardíaca e esforço.
- Pace automático.
- Feedback contextual.
- Histórico recente.
- Persistência IndexedDB.
- Integração com Dashboard, Coach e Score.

## Critérios de aceite

- Pace é calculado somente quando há distância válida.
- Histórico mostra somente sessões concluídas.
- Zona 2 alerta quando o esforço está alto.
- Dados persistem após recarregar.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Feature Cardio Premium

### Added

- Pace automático.
- Feedback por tipo de cardio.
- Histórico de sessões.
- Métricas detalhadas.
EOF

echo "🧪 Validando..."
npm run validate

echo
echo "✅ Feature Cardio Premium aplicada."
echo "Backup: $BACKUP_DIR"
echo
echo 'Execute:'
echo 'git add .'
echo 'git commit -m "feat: deliver premium cardio flow"'
echo 'git push'
