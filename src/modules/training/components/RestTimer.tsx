import { Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { Button, Card } from '../../../shared/ui'

type RestTimerProps = {
  secondsRemaining: number
  isRunning: boolean
  onPause: () => void
  onResume: () => void
  onReset: () => void
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

export function RestTimer({
  secondsRemaining,
  isRunning,
  onPause,
  onResume,
  onReset,
}: RestTimerProps) {
  if (secondsRemaining <= 0) return null

  return (
    <Card className="sticky top-4 z-30 border-violet-500/30 bg-[#171124] shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-300">
            <Timer size={18} aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Descanso
            </span>
          </div>
          <p className="mt-2 text-4xl font-black">
            {formatTime(secondsRemaining)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            aria-label={isRunning ? 'Pausar descanso' : 'Continuar descanso'}
            onClick={isRunning ? onPause : onResume}
            variant="ghost"
          >
            {isRunning ? (
              <Pause size={19} aria-hidden="true" />
            ) : (
              <Play size={19} aria-hidden="true" />
            )}
          </Button>

          <Button
            aria-label="Encerrar descanso"
            onClick={onReset}
            variant="ghost"
          >
            <RotateCcw size={19} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
