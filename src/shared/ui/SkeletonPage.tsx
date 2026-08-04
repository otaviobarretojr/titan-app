type SkeletonPageProps = {
  label: string
  variant?: 'dashboard' | 'module'
}

export function SkeletonPage({ label, variant = 'module' }: SkeletonPageProps) {
  const cards = variant === 'dashboard' ? 4 : 5

  return (
    <div aria-label={label} aria-live="polite" className="space-y-4" role="status">
      <div className="rounded-[32px] border border-white/8 bg-[var(--titan-surface-elevated)] p-5 shadow-[var(--titan-shadow-soft)]">
        <div className="skeleton h-4 w-32 rounded-full" />
        <div className="mt-4 skeleton h-10 w-3/4 rounded-2xl" />
        <div className="mt-3 skeleton h-4 w-11/12 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-24 rounded-[24px]" />
        <div className="skeleton h-24 rounded-[24px]" />
      </div>
      {Array.from({ length: cards }, (_, index) => (
        <div className="rounded-[28px] border border-white/8 bg-[var(--titan-surface)] p-5" key={index}>
          <div className="skeleton h-5 w-2/5 rounded-full" />
          <div className="mt-4 space-y-3">
            <div className="skeleton h-4 rounded-full" />
            <div className="skeleton h-4 w-4/5 rounded-full" />
          </div>
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}
