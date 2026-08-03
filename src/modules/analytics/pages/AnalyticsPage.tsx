import {
  Activity,
  BarChart3,
  Download,
  Droplets,
  Dumbbell,
  Flame,
  Moon,
  Scale,
  Utensils,
} from 'lucide-react'
import { Button, Card, ProgressBar, SectionTitle } from '../../../shared/ui'
import { AnalyticsBarChart } from '../components/AnalyticsBarChart'
import { AnalyticsMetricCard } from '../components/AnalyticsMetricCard'
import { useAnalytics } from '../hooks/useAnalytics'
import { downloadAnalyticsCsv } from '../utils/exportAnalytics'

function formatSleep(minutes: number | null) {
  if (minutes === null) return '—'

  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)

  return `${hours}h${rest.toString().padStart(2, '0')}`
}

export function AnalyticsPage() {
  const {
    period,
    setPeriod,
    summary,
    isLoading,
  } = useAnalytics()

  if (isLoading || !summary) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Preparando analytics...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
          TITAN ANALYTICS
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Performance
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Indicadores consolidados a partir dos registros reais.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 30].map((days) => (
            <Button
              key={days}
              onClick={() => setPeriod(days)}
              variant={period === days ? 'primary' : 'ghost'}
            >
              {days} dias
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <AnalyticsMetricCard
          icon={<Utensils size={18} aria-hidden="true" />}
          label="Proteína média"
          value={`${summary.averages.proteinG} g`}
        />

        <AnalyticsMetricCard
          icon={<Droplets size={18} aria-hidden="true" />}
          label="Água média"
          value={`${(
            summary.averages.hydrationMl / 1000
          ).toLocaleString('pt-BR', {
            maximumFractionDigits: 1,
          })} L`}
        />

        <AnalyticsMetricCard
          icon={<Moon size={18} aria-hidden="true" />}
          label="Sono médio"
          value={formatSleep(summary.averages.sleepMinutes)}
        />

        <AnalyticsMetricCard
          icon={<Scale size={18} aria-hidden="true" />}
          label="Peso médio"
          value={
            summary.averages.weightKg !== null
              ? `${summary.averages.weightKg.toLocaleString(
                  'pt-BR',
                  { maximumFractionDigits: 1 },
                )} kg`
              : '—'
          }
        />

        <AnalyticsMetricCard
          icon={<Dumbbell size={18} aria-hidden="true" />}
          label="Treinos"
          value={`${summary.totals.workouts}`}
        />

        <AnalyticsMetricCard
          icon={<Activity size={18} aria-hidden="true" />}
          label="Cardios"
          value={`${summary.totals.cardios}`}
          supportingText={`${summary.totals.cardioMinutes} min`}
        />
      </div>

      <Card elevated>
        <h2 className="text-lg font-bold">Aderência</h2>

        <div className="mt-5 space-y-5">
          <ProgressBar
            label="Nutrição"
            value={summary.adherence.nutrition}
          />
          <ProgressBar
            label="Hidratação"
            value={summary.adherence.hydration}
          />
          <ProgressBar
            label="Sono"
            value={summary.adherence.sleep}
          />
          <ProgressBar
            label="Treino"
            value={summary.adherence.training}
          />
        </div>
      </Card>

      <AnalyticsBarChart
        title="Proteína diária"
        points={summary.days}
        selector={(point) => point.proteinG}
        suffix="g"
      />

      <AnalyticsBarChart
        title="Hidratação diária"
        points={summary.days}
        selector={(point) => point.hydrationMl / 1000}
        suffix="L"
      />

      <AnalyticsBarChart
        title="Calorias diárias"
        points={summary.days}
        selector={(point) => point.caloriesKcal}
        suffix="kcal"
      />

      <section>
        <SectionTitle
          title="Recordes pessoais"
          supportingText={`${summary.personalRecords.length} exercícios`}
        />

        <Card>
          {summary.personalRecords.length === 0 ? (
            <p className="text-sm text-slate-400">
              Registre séries para gerar recordes.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.personalRecords.map((record) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-3"
                  key={record.exerciseName}
                >
                  <div>
                    <p className="text-sm font-bold">
                      {record.exerciseName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.localDate}
                    </p>
                  </div>

                  <span className="font-black text-violet-300">
                    {record.estimatedOneRepMaxKg.toLocaleString(
                      'pt-BR',
                      { maximumFractionDigits: 1 },
                    )}{' '}
                    kg
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <Card>
        <div className="flex items-center gap-3">
          <BarChart3
            className="text-cyan-300"
            size={22}
            aria-hidden="true"
          />

          <div>
            <h2 className="font-bold">Exportação</h2>
            <p className="mt-1 text-sm text-slate-400">
              Exporte os dados consolidados em CSV.
            </p>
          </div>
        </div>

        <Button
          className="mt-5"
          fullWidth
          onClick={() => downloadAnalyticsCsv(summary)}
        >
          <Download size={18} aria-hidden="true" />
          Exportar CSV
        </Button>
      </Card>

      <Card>
        <div className="flex gap-3">
          <Flame
            className="shrink-0 text-amber-300"
            size={22}
            aria-hidden="true"
          />

          <p className="text-sm leading-6 text-slate-400">
            Os indicadores refletem apenas o que foi efetivamente registrado
            no TITAN. Dias sem dados permanecem zerados.
          </p>
        </div>
      </Card>
    </div>
  )
}
