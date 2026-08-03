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
