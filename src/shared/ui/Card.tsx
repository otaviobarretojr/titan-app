import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type CardProps = ComponentPropsWithoutRef<'article'> & {
  children: ReactNode
  elevated?: boolean
}

export function Card({
  children,
  className = '',
  elevated = false,
  ...props
}: CardProps) {
  return (
    <article
      className={[
        'premium-card rounded-[24px] border border-white/10 p-5',
        elevated ? 'bg-[#172033]' : 'bg-[#111827]',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </article>
  )
}
