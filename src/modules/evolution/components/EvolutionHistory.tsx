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
    <div className="relative space-y-3 border-l border-blue-500/30 pl-5 before:absolute before:-left-[5px] before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-blue-400">
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
                  entry.rightArmCm ? `Braço D ${entry.rightArmCm} cm` : null,
                  entry.leftArmCm ? `Braço E ${entry.leftArmCm} cm` : null,
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
              onClick={() => { if (window.confirm('Excluir esta medição permanentemente?')) void onDelete(entry.id) }}
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
