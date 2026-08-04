import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/15 bg-white/[0.025] px-5 py-7 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-slate-400">
        {icon ?? <Inbox aria-hidden="true" size={21} />}
      </div>
      <h3 className="mt-3 font-bold text-slate-100">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
