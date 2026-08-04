import type { ReactNode } from 'react'

type SectionHeaderProps = { title: string; description?: string; action?: ReactNode; id?: string }

export function SectionHeader({ title, description, action, id }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div><h2 className="text-lg font-bold tracking-tight" id={id}>{title}</h2>{description ? <p className="mt-0.5 text-xs text-slate-400">{description}</p> : null}</div>
      {action}
    </div>
  )
}
