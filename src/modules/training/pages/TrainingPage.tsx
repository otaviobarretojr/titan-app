import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Check, Dumbbell, Gauge, Play } from 'lucide-react'
import { Button, Card, ProgressBar } from '../../../shared/ui'
import { ExerciseCard } from '../components/ExerciseCard'
import { RestTimer } from '../components/RestTimer'
import { useRestTimer } from '../hooks/useRestTimer'
import { useTrainingWorkout } from '../hooks/useTrainingWorkout'

export function TrainingPage() {
  const {
    workout,
    error,
    isLoading,
    startWorkout,
    addExerciseSet,
    removeLastExerciseSet,
    finishWorkout,
  } = useTrainingWorkout()

  const restTimer = useRestTimer()
  const [now, setNow] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro no treino</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !workout) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando treino...
        </p>
      </div>
    )
  }

  const completedSets = workout.exercises.reduce(
    (total, exercise) => total + exercise.completedSets,
    0,
  )
  const targetSets = workout.exercises.reduce(
    (total, exercise) => total + exercise.targetSets,
    0,
  )
  const progress =
    targetSets > 0 ? Math.round((completedSets / targetSets) * 100) : 0
  const elapsedMinutes = workout.startedAt
    ? Math.max(0, Math.floor(((workout.completedAt ? new Date(workout.completedAt).getTime() : now) - new Date(workout.startedAt).getTime()) / 60000))
    : 0
  const currentExerciseId = workout.exercises.find((exercise) => exercise.completedSets < exercise.targetSets)?.id

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-violet-300">
          TITAN TREINO
        </p>
        <h1 className="mt-2 text-3xl font-black">{workout.name}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {workout.plannedTime} · aproximadamente{' '}
          {workout.estimatedDurationMinutes} minutos
        </p>
      </header>

      <RestTimer
        isRunning={restTimer.isRunning}
        onPause={restTimer.pause}
        onReset={restTimer.reset}
        onResume={restTimer.resume}
        secondsRemaining={restTimer.secondsRemaining}
      />

      <Card elevated>
        <ProgressBar
          label={`${completedSets} de ${targetSets} séries registradas`}
          value={progress}
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric
            icon={<Gauge size={18} aria-hidden="true" />}
            label="Volume"
            value={`${workout.totalVolumeKg.toLocaleString('pt-BR')} kg`}
          />
          <Metric icon={<Gauge size={18} aria-hidden="true" />} label="Tempo total" value={`${elapsedMinutes} min`} />
          <Metric
            icon={<Dumbbell size={18} aria-hidden="true" />}
            label="Exercícios"
            value={`${workout.exercises.length}`}
          />
        </div>

        {workout.status === 'planned' ? (
          <Button
            className="mt-5"
            fullWidth
            onClick={() => startWorkout(workout.id)}
          >
            <Play size={19} aria-hidden="true" />
            Iniciar treino
          </Button>
        ) : null}

        {workout.status === 'completed' ? (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-4 text-emerald-300">
            <Check size={19} aria-hidden="true" />
            <span className="font-bold">Treino concluído</span>
          </div>
        ) : null}
      </Card>

      {workout.status === 'planned' ? (
        <Card>
          <div className="flex gap-3">
            <Dumbbell
              className="shrink-0 text-violet-300"
              size={22}
              aria-hidden="true"
            />
            <p className="text-sm leading-6 text-slate-400">
              Inicie o treino para liberar séries, descanso, volume e recordes.
            </p>
          </div>
        </Card>
      ) : null}

      {workout.status !== 'planned' && workout.sessionId ? (
        <section className="space-y-3">
          {workout.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isCurrent={exercise.id === currentExerciseId}
              sessionId={workout.sessionId!}
              sets={workout.sets.filter(
                (set) => set.exercisePlanId === exercise.id,
              )}
              onAddSet={addExerciseSet}
              onRemoveLastSet={removeLastExerciseSet}
              onStartRest={restTimer.start}
            />
          ))}
        </section>
      ) : null}

      {workout.status === 'started' && workout.sessionId ? (
        <Button
          fullWidth
          onClick={() => finishWorkout(workout.sessionId!)}
          variant="secondary"
        >
          <Check size={19} aria-hidden="true" />
          Finalizar treino
        </Button>
      ) : null}
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
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  )
}
