import { useState } from 'react'
import { Activity, Award, CalendarCheck, Download, Dumbbell, FileJson, Flame, Gauge, Scale, ShieldCheck } from 'lucide-react'
import { Button, Card, ProgressBar, SectionTitle } from '../../../shared/ui'
import { AnalyticsBarChart } from '../components/AnalyticsBarChart'
import { AnalyticsMetricCard } from '../components/AnalyticsMetricCard'
import { TrendList } from '../components/TrendList'
import { useAnalytics } from '../hooks/useAnalytics'
import { downloadAnalyticsCsv, downloadAnalyticsJson, downloadAnalyticsPdf, type ReportPeriod } from '../utils/exportAnalytics'

const signed = (value: number | null, suffix = '') => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${suffix}`
const comparison = (value: number | null) => value === null ? 'Dados insuficientes' : `${signed(value, '%')} vs. período anterior`

export function AnalyticsPage() {
  const { period, setPeriod, summary, isLoading } = useAnalytics()
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('weekly')
  if (isLoading || !summary) return <div className="flex min-h-[70dvh] items-center justify-center"><p className="text-sm font-semibold text-slate-400">Calculando Analytics no dispositivo...</p></div>
  const charts = [
    ['Peso', (p: typeof summary.days[number]) => p.weightKg, 'kg'], ['Cintura', (p: typeof summary.days[number]) => p.waistCm, 'cm'],
    ['Proteína', (p: typeof summary.days[number]) => p.proteinG || null, 'g'], ['Calorias', (p: typeof summary.days[number]) => p.caloriesKcal || null, 'kcal'],
    ['Água', (p: typeof summary.days[number]) => p.hydrationMl ? p.hydrationMl / 1000 : null, 'L'], ['Sono', (p: typeof summary.days[number]) => p.sleepMinutes ? p.sleepMinutes / 60 : null, 'h'],
    ['Força (1RM)', (p: typeof summary.days[number]) => p.strengthKg, 'kg'],
    ['Score TITAN', (p: typeof summary.days[number]) => p.titanScore, 'pts'],
  ] as const
  return <div className="space-y-6">
    <header><p className="text-sm font-bold uppercase tracking-widest text-cyan-300">Analytics executivo</p><h1 className="mt-2 text-3xl font-black">Visão TITAN</h1><p className="mt-2 text-sm leading-6 text-slate-400">Tendências calculadas localmente, somente com os seus registros no IndexedDB.</p></header>
    <Card><div className="grid grid-cols-4 gap-2">{[[7, '7d'], [30, '30d'], [90, '90d'], [365, '1 ano']].map(([days, label]) => <Button key={days} onClick={() => setPeriod(Number(days))} variant={period === days ? 'primary' : 'ghost'}>{label}</Button>)}</div></Card>

    <section><SectionTitle title="Pulso executivo" supportingText="Indicadores centrais do período" /><div className="grid grid-cols-2 gap-3">
      <AnalyticsMetricCard icon={<Gauge size={18} />} label="Score médio" value={`${summary.consistency}`} supportingText="de 100 pontos" />
      <AnalyticsMetricCard icon={<CalendarCheck size={18} />} label="Cobertura" value={`${summary.coverage.percentage}%`} supportingText={`${summary.coverage.daysWithData}/${summary.coverage.totalDays} dias`} />
      <AnalyticsMetricCard icon={<Flame size={18} />} label="Streak atual" value={`${summary.streaks.current} dias`} supportingText={`recorde: ${summary.streaks.best}`} />
      <AnalyticsMetricCard icon={<Dumbbell size={18} />} label="Atividades" value={`${summary.totals.workouts + summary.totals.cardios}`} supportingText={`${summary.totals.workouts} treino · ${summary.totals.cardios} cardio`} />
    </div></section>

    <section><SectionTitle title="Evolução" supportingText="Primeiro x último registro do período" /><div className="grid grid-cols-3 gap-2">
      <AnalyticsMetricCard icon={<Scale size={16} />} label="Peso" value={signed(summary.evolution.weightKg, ' kg')} />
      <AnalyticsMetricCard icon={<Activity size={16} />} label="Cintura" value={signed(summary.evolution.waistCm, ' cm')} />
      <AnalyticsMetricCard icon={<Gauge size={16} />} label="Score" value={signed(summary.evolution.titanScore, ' pts')} />
    </div></section>

    <Card elevated><h2 className="text-lg font-bold">Comparativos</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-slate-500">Semanal</p><p className="mt-2 font-black">{summary.comparisons.weekly.current ?? '—'} pts</p><p className="mt-1 text-[10px] text-slate-400">{comparison(summary.comparisons.weekly.changePercentage)}</p></div><div className="rounded-2xl bg-white/5 p-4"><p className="text-xs text-slate-500">Mensal</p><p className="mt-2 font-black">{summary.comparisons.monthly.current ?? '—'} pts</p><p className="mt-1 text-[10px] text-slate-400">{comparison(summary.comparisons.monthly.changePercentage)}</p></div></div></Card>

    <div className="grid gap-4 lg:grid-cols-2"><TrendList title="Tendências semanais" items={summary.weeklyTrends} /><TrendList title="Tendências mensais" items={summary.monthlyTrends} /></div>
    <Card><h2 className="font-bold">Consistência e cobertura</h2><div className="mt-5 space-y-4">{Object.entries(summary.coverage.byMetric).map(([label, value]) => <ProgressBar key={label} label={label} value={value} />)}</div></Card>
    <section><SectionTitle title="Histórico visual" supportingText="Toque nas barras para consultar os valores" /><div className="grid gap-4 lg:grid-cols-2">{charts.map(([title, selector, suffix]) => <AnalyticsBarChart key={title} title={title} points={summary.days} selector={selector} suffix={suffix} />)}</div></section>
    <Card><h2 className="font-bold">Aderência às metas</h2><div className="mt-5 space-y-4"><ProgressBar label="Proteína" value={summary.adherence.nutrition} /><ProgressBar label="Água" value={summary.adherence.hydration} /><ProgressBar label="Sono" value={summary.adherence.sleep} /><ProgressBar label="Treino" value={summary.adherence.training} /></div></Card>
    <section><SectionTitle title="Recordes pessoais" supportingText={`${summary.personalRecords.length} melhores marcas`} /><Card>{summary.personalRecords.length ? <div className="space-y-2">{summary.personalRecords.map((record) => <div className="flex items-center justify-between rounded-xl bg-white/5 p-3" key={record.exerciseName}><div className="flex items-center gap-3"><Award className="text-amber-300" size={18} /><div><p className="text-sm font-bold">{record.exerciseName}</p><p className="text-[10px] text-slate-500">{record.localDate}</p></div></div><strong>{record.estimatedOneRepMaxKg.toFixed(1)} kg</strong></div>)}</div> : <p className="text-sm text-slate-400">Complete séries para desbloquear recordes.</p>}</Card></section>
    <section><SectionTitle title="Timeline do Coach" supportingText="Eventos persistidos no dispositivo" /><Card>{summary.coachTimeline.length ? <ol className="space-y-4">{summary.coachTimeline.map((event) => <li className="border-l-2 border-cyan-400/40 pl-4" key={event.id}><p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">{event.localDate} · prioridade {event.priority}</p><h3 className="mt-1 text-sm font-bold">{event.title}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{event.message}</p></li>)}</ol> : <p className="text-sm text-slate-400">A Timeline aparecerá quando o Coach persistir recomendações.</p>}</Card></section>
    <Card><div className="flex items-center gap-3"><ShieldCheck className="text-emerald-300" /><div><h2 className="font-bold">Relatórios privados e offline</h2><p className="text-xs text-slate-400">Gerados localmente; nenhum dado sai deste dispositivo.</p></div></div><div className="mt-5 grid grid-cols-2 gap-2"><Button onClick={() => downloadAnalyticsCsv(summary)}><Download size={17} />CSV</Button><Button onClick={() => downloadAnalyticsJson(summary)}><FileJson size={17} />JSON</Button></div><div className="mt-3 flex gap-2"><select aria-label="Período do relatório PDF" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-900 px-4 text-sm font-bold" value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)}><option value="weekly">Semanal</option><option value="monthly">Mensal</option></select><Button onClick={() => downloadAnalyticsPdf(summary, reportPeriod)}><Download size={17} />Gerar PDF</Button></div></Card>
  </div>
}
