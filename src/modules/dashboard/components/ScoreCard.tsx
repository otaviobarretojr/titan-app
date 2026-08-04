import { Activity, Minus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Card, ProgressBar } from '../../../shared/ui'
import type { TitanScore } from '../../coach/types/coach'

type ScoreCardProps = {
  score: TitanScore
}

const toneByLabel = {
  Excelente: 'success',
  Bom: 'primary',
  Atenção: 'warning',
  Crítico: 'warning',
  'Sem dados': 'neutral',
} as const

export function ScoreCard({ score }: ScoreCardProps) {
  const target = score.value ?? 0
  const [scoreValue, setScoreValue] = useState(0)
  useEffect(() => {
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 260)
      setScoreValue(Math.round(target * progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return (
    <Card className="overflow-hidden border-blue-400/20 bg-gradient-to-br from-[#18233b] via-[#111827] to-[#111827]" elevated>
      <div className="flex items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-blue-300">
            <Activity size={18} aria-hidden="true" />
            <span className="text-sm font-bold">SCORE TITAN</span>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {score.value === null
              ? 'Registre ações para calcular o score.'
              : 'Calculado com os dados registrados hoje.'}
          </p>
        </div>

        <div aria-label={score.value === null ? 'Score sem dados' : `Score ${score.value} de 100`} className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#60a5fa ${scoreValue * 3.6}deg, rgb(255 255 255 / 0.08) 0deg)` }}>
          <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-[#172033] text-center">
            <span className="text-3xl font-black leading-none">{score.value === null ? '—' : scoreValue}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">de 100</span>
          </div>
        </div>
      </div>

      <div className="mt-4"><Badge tone={toneByLabel[score.label]}>{score.label}</Badge></div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
        <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tendência</p><p className="mt-1 flex items-center gap-1.5 text-sm font-bold"><Minus aria-hidden="true" size={16} /> Hoje</p></div>
        <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Progresso semanal</p><p className="mt-1 text-sm font-bold">{score.value === null ? 'Aguardando dados' : `${score.value}% da referência`}</p></div>
      </div>

      {score.value !== null ? (
        <div className="mt-5">
          <ProgressBar label="Performance diária" value={score.value} />
        </div>
      ) : null}
    </Card>
  )
}
