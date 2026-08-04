import { ArrowDown, ArrowUp, Dumbbell, Minus } from 'lucide-react'
import { Card, SectionTitle, SkeletonPage } from '../../../shared/ui'
import { BodyMetricForm } from '../components/BodyMetricForm'
import { BioimpedanceForm } from '../components/BioimpedanceForm'
import { EvolutionChart } from '../components/EvolutionChart'
import { EvolutionHistory } from '../components/EvolutionHistory'
import { ProgressPhotos } from '../components/ProgressPhotos'
import { MeasurementInsights } from '../components/MeasurementInsights'
import { useEvolution } from '../hooks/useEvolution'

export function EvolutionPage() {
  const {
    summary,
    error,
    isLoading,
    saveBodyMetric,
    deleteBodyMetric,
    saveProgressPhoto,
    saveBioimpedance,
    deleteProgressPhoto,
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
    return <SkeletonPage label="Carregando evolução corporal" />
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
          TITAN EVOLUÇÃO
        </p>
        <h1 className="mt-2 text-3xl font-black">Evolução corporal</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Peso, medidas, fotos, força e cardio em um só lugar.
        </p>
      </header>

      <Card elevated>
        <div className="mb-4 flex items-center justify-between"><span className="text-xs font-bold uppercase text-slate-500">Resumo da semana</span><span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300">Cobertura {summary.coverage.measuredDays}/7 dias</span></div>
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
          <Metric
            label="Cintura"
            value={
              summary.latestWaistCm !== null
                ? `${summary.latestWaistCm.toLocaleString('pt-BR')} cm`
                : '—'
            }
          />
          <Metric
            label="Gordura"
            value={
              summary.latestBodyFatPercentage !== null
                ? `${summary.latestBodyFatPercentage.toLocaleString(
                    'pt-BR',
                  )}%`
                : '—'
            }
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Variation
            label="Variação de peso"
            value={summary.weightVariationKg}
            suffix="kg"
          />
          <Variation
            label="Variação de cintura"
            value={summary.waistVariationCm}
            suffix="cm"
          />
        </div>
        <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-slate-300">Tendência: <strong>{{gain:'ganho',loss:'perda',stable:'estabilidade',insufficient:'amostras insuficientes'}[summary.weightTrend]}</strong>. Uma medição isolada pode oscilar; priorize médias e tendência.</p>
        <div className="mt-3 grid grid-cols-2 gap-3"><Metric label="Semana vs. anterior" value={summary.weeklyWeight.variation===null?'Amostras insuficientes':`${summary.weeklyWeight.variation>0?'+':''}${summary.weeklyWeight.variation.toFixed(1)} kg`}/><Metric label="30 dias vs. anteriores" value={summary.monthlyWeight.variation===null?'Amostras insuficientes':`${summary.monthlyWeight.variation>0?'+':''}${summary.monthlyWeight.variation.toFixed(1)} kg`}/></div>
      </Card>

      <EvolutionChart trend={summary.trend} />
      <MeasurementInsights entries={summary.entries} />

      <BodyMetricForm onSave={saveBodyMetric} />
      <BioimpedanceForm onSave={saveBioimpedance} />

      <ProgressPhotos
        photos={summary.photos}
        onDelete={deleteProgressPhoto}
        onSave={saveProgressPhoto}
      />

      <section>
        <SectionTitle title="Força" supportingText="Melhores 1RM estimados" />
        <Card>
          {summary.bestStrengthRecords.length === 0 ? (
            <p className="text-sm text-slate-400">
              Registre séries para gerar recordes de força.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.bestStrengthRecords.map((record) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-3"
                  key={record.exerciseName}
                >
                  <div className="flex items-center gap-3">
                    <Dumbbell
                      className="text-violet-300"
                      size={18}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-bold">
                      {record.exerciseName}
                    </span>
                  </div>
                  <span className="font-black">
                    {record.estimatedOneRepMaxKg.toLocaleString('pt-BR', {
                      maximumFractionDigits: 1,
                    })}{' '}
                    kg
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle title="Cardio acumulado" />
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Metric
              label="Sessões"
              value={`${summary.cardioSummary.completedSessions}`}
            />
            <Metric label="Ritmo médio" value={summary.cardioSummary.averagePace===null?'—':`${summary.cardioSummary.averagePace.toFixed(1)} min/km`}/>
            <Metric
              label="Minutos"
              value={`${summary.cardioSummary.totalMinutes}`}
            />
            <Metric
              label="Distância"
              value={`${summary.cardioSummary.totalDistanceKm.toLocaleString(
                'pt-BR',
                { maximumFractionDigits: 1 },
              )} km`}
            />
          </div>
        </Card>
      </section>

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

type VariationProps = {
  label: string
  value: number | null
  suffix: string
}

function Variation({ label, value, suffix }: VariationProps) {
  const Icon =
    value === null || value === 0
      ? Minus
      : value > 0
        ? ArrowUp
        : ArrowDown

  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={17} aria-hidden="true" />
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-2 text-lg font-black">
        {value === null
          ? '—'
          : `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            })} ${suffix}`}
      </p>
    </div>
  )
}
