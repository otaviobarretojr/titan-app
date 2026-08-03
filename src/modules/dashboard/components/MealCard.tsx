import { Utensils } from 'lucide-react'
import { Badge, Button, Card } from '../../../shared/ui'

export function MealCard() {
  return (
    <Card>
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <Utensils size={23} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <Badge tone="warning">16:15 · PRÉ-TREINO</Badge>
          <h3 className="mt-3 text-lg font-bold">Próxima refeição</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">Banana, aveia e fonte de proteína</p>
        </div>
      </div>

      <Button className="mt-5" fullWidth>Abrir refeição</Button>
    </Card>
  )
}
