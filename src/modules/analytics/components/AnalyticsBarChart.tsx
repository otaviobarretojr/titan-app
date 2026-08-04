import { Card } from '../../../shared/ui'
import type { AnalyticsPoint } from '../types/analytics'

type Props = { title: string; points: AnalyticsPoint[]; selector: (point: AnalyticsPoint) => number | null; suffix: string; color?: string }
export function AnalyticsBarChart({ title, points, selector, suffix, color = 'from-blue-600 to-cyan-400' }: Props) {
  const visible = points.slice(-30); const populated = visible.map(selector).filter((x): x is number => x !== null); const max = Math.max(...populated, 1)
  return <Card><div className="flex items-center justify-between"><h2 className="text-base font-bold">{title}</h2><span className="text-[10px] text-slate-500">últimos 30 dias</span></div><div className="mt-5 flex h-36 items-end gap-px" role="img" aria-label={`Gráfico de ${title}`}>
    {visible.map((point) => { const value = selector(point); return <div className="group relative flex h-full min-w-0 flex-1 items-end" key={point.localDate} title={`${point.localDate}: ${value ?? 'sem dado'} ${suffix}`}><div className={`w-full rounded-t-sm bg-gradient-to-t ${color} ${value === null ? 'opacity-10' : ''}`} style={{ height: `${value === null ? 2 : Math.max(4, value / max * 100)}%` }} /></div> })}
  </div><div className="mt-2 flex justify-between text-[9px] text-slate-600"><span>{visible[0]?.localDate.slice(5)}</span><span>{visible.at(-1)?.localDate.slice(5)}</span></div></Card>
}
