import { HeartPulse, Trash2 } from 'lucide-react'
import { Button, Card } from '../../../shared/ui'
import type {
  HealthExam,
  HealthMetric,
} from '../types/health'

type HealthHistoryProps = {
  metrics: HealthMetric[]
  exams: HealthExam[]
  onDeleteMetric: (id: string) => Promise<unknown>
  onDeleteExam: (id: string) => Promise<unknown>
}

export function HealthHistory({
  metrics,
  exams,
  onDeleteMetric,
  onDeleteExam,
}: HealthHistoryProps) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-lg font-bold">Medições</h2>

        <div className="space-y-3">
          {metrics.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-400">
                Nenhuma medição registrada.
              </p>
            </Card>
          ) : (
            metrics.map((item) => (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                      {new Intl.DateTimeFormat('pt-BR').format(
                        new Date(`${item.localDate}T12:00:00`),
                      )}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      {item.systolicPressure &&
                      item.diastolicPressure ? (
                        <span className="rounded-xl bg-white/5 px-3 py-2">
                          {item.systolicPressure}/
                          {item.diastolicPressure} mmHg
                        </span>
                      ) : null}

                      {item.restingHeartRate ? (
                        <span className="rounded-xl bg-white/5 px-3 py-2">
                          {item.restingHeartRate} bpm
                        </span>
                      ) : null}
                    </div>

                    {item.symptom ? (
                      <p className="mt-3 text-sm text-slate-400">
                        Sintoma: {item.symptom}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    aria-label="Excluir medição"
                    onClick={() => onDeleteMetric(item.id)}
                    variant="ghost"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Exames</h2>

        <div className="space-y-3">
          {exams.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-400">
                Nenhum exame registrado.
              </p>
            </Card>
          ) : (
            exams.map((item) => (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-blue-300">
                      <HeartPulse size={17} aria-hidden="true" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {item.category || 'Exame'}
                      </span>
                    </div>

                    <h3 className="mt-2 font-bold">{item.title}</h3>

                    <p className="mt-2 text-sm text-slate-300">
                      Resultado: {item.value || 'Não informado'}
                    </p>

                    {item.referenceRange ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Referência: {item.referenceRange}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    aria-label="Excluir exame"
                    onClick={() => onDeleteExam(item.id)}
                    variant="ghost"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
