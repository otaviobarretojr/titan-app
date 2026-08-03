import type { ReactNode } from 'react'

type BadgeTone = 'primary' | 'success' | 'warning' | 'neutral'

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  primary: 'bg-blue-500/10 text-blue-300',
  success: 'bg-emerald-500/10 text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-300',
  neutral: 'bg-white/10 text-slate-300',
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={['inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold', toneClasses[tone]].join(' ')}>
      {children}
    </span>
  )
}
