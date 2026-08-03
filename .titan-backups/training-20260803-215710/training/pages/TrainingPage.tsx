import { Check, Dumbbell, Play } from 'lucide-react'
import { Button, Card, ProgressBar } from '../../../shared/ui'
import { ExerciseCard } from '../components/ExerciseCard'
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

      <Card elevated>
        <ProgressBar
          label={`${completedSets} de ${targetSets} séries registradas`}
          value={progress}
        />

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
              Inicie o treino para liberar o registro das séries.
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
              sessionId={workout.sessionId!}
              onAddSet={addExerciseSet}
              onRemoveLastSet={removeLastExerciseSet}
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
