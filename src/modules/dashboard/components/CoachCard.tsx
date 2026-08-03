import { ChevronRight, Sparkles } from 'lucide-react'
import { Button, Card } from '../../../shared/ui'

type CoachCardProps = {
  title: string
  message: string
}

export function CoachCard({ title, message }: CoachCardProps) {
  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-blue-600/25 to-cyan-400/5">
      <div className="flex items-center gap-2 text-blue-300">
        <Sparkles size={18} aria-hidden="true" />
        <span className="text-sm font-bold">COACH TITAN</span>
      </div>

      <h2 className="mt-3 text-xl font-bold">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>

      <Button className="mt-4 min-h-11" variant="ghost">
        Ver recomendação
        <ChevronRight size={17} aria-hidden="true" />
      </Button>
    </Card>
  )
}
