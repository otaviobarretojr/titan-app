import type { ReactNode } from 'react'
import { Card } from './Card'
import { ProgressBar } from './ProgressBar'

type StatCardProps = {
  icon: ReactNode
  label: string
  value: string
  supportingText?: string
  progress?: number
  action?: ReactNode
}

export function StatCard({ icon, label, value, supportingText, progress, action }: StatCardProps) {
  return (
    <Card className="flex min-h-40 flex-col p-4">
      <div className="flex items-center gap-2 text-slate-400">{icon}<span className="text-xs font-bold">{label}</span></div>
      <p className="mt-3 text-2xl font-black tracking-tight">{value}</p>
      {supportingText ? <p className="mt-1 text-xs leading-5 text-slate-400">{supportingText}</p> : null}
      {progress === undefined ? null : <div className="mt-auto pt-3"><ProgressBar label={`Progresso de ${label.toLowerCase()}`} value={progress} /></div>}
      {action ? <div className="mt-auto pt-3">{action}</div> : null}
    </Card>
  )
}
