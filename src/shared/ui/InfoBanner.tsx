import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

type Tone = 'info' | 'success' | 'error'
type InfoBannerProps = { title: string; children: ReactNode; tone?: Tone }
const styles = { info: 'border-blue-400/20 bg-blue-500/10 text-blue-200', success: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200', error: 'border-red-400/20 bg-red-500/10 text-red-200' }
const icons = { info: Info, success: CheckCircle2, error: AlertCircle }

export function InfoBanner({ title, children, tone = 'info' }: InfoBannerProps) {
  const Icon = icons[tone]
  return <div className={`flex gap-3 rounded-2xl border p-4 ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'}><Icon aria-hidden="true" className="mt-0.5 shrink-0" size={19} /><div><p className="text-sm font-bold">{title}</p><div className="mt-1 text-sm leading-6 text-slate-300">{children}</div></div></div>
}
