import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Card, SectionTitle } from '../../../shared/ui'
import { BodyMetricForm } from '../components/BodyMetricForm'
import { EvolutionHistory } from '../components/EvolutionHistory'
import { useEvolution } from '../hooks/useEvolution'

export function EvolutionPage() {
  const {
    summary,
    error,
    isLoading,
    saveBodyMetric,
    deleteBodyMetric,
  } = useEvolution()

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro na evolução</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading || !summary) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Carregando evolução...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
          TITAN EVOLUÇÃO
        </p>
        <h1 className="mt-2 text-3xl font-black">Evolução corporal</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Registre medidas em condições semelhantes para melhorar a comparação.
        </p>
      </header>

      <Card elevated>
        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Peso atual"
            value={
              summary.latestWeightKg !== null
                ? `${summary.latestWeightKg.toLocaleString('pt-BR')} kg`
                : '—'
            }
          />
          <Metric
            label="Média recente"
            value={
              summary.weeklyAverageKg !== null
                ? `${summary.weeklyAverageKg.toLocaleString('pt-BR', {
                    maximumFractionDigits: 1,
                  })} kg`
                : '—'
            }
          />
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 p-4">
          <div className="flex items-center gap-2 text-slate-400">
            <VariationIcon value={summary.weightVariationKg} />
            <span className="text-xs font-bold">Variação</span>
          </div>
          <p className="mt-2 text-lg font-black">
            {summary.weightVariationKg !== null
              ? `${summary.weightVariationKg > 0 ? '+' : ''}${summary.weightVariationKg.toLocaleString(
                  'pt-BR',
                  { maximumFractionDigits: 1 },
                )} kg`
              : 'Dados insuficientes'}
          </p>
        </div>
      </Card>

      <BodyMetricForm onSave={saveBodyMetric} />

      <section>
        <SectionTitle
          supportingText={`${summary.entries.length} registros`}
          title="Histórico"
        />
        <EvolutionHistory
          entries={summary.entries}
          onDelete={deleteBodyMetric}
        />
      </section>
    </div>
  )
}

type MetricProps = {
  label: string
  value: string
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  )
}

function VariationIcon({ value }: { value: number | null }) {
  if (value === null || value === 0) {
    return <Minus size={18} aria-hidden="true" />
  }

  if (value > 0) {
    return <ArrowUp size={18} aria-hidden="true" />
  }

  return <ArrowDown size={18} aria-hidden="true" />
}
