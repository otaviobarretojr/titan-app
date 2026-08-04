type LoadingCardProps = {
  lines?: number
  label?: string
}

export function LoadingCard({ lines = 2, label = 'Carregando conteúdo' }: LoadingCardProps) {
  return (
    <div aria-label={label} className="rounded-[24px] border border-white/5 bg-[#111827] p-5" role="status">
      <div className="skeleton h-5 w-2/5 rounded-lg" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <div className={`skeleton h-4 rounded-lg ${index === lines - 1 ? 'w-3/4' : 'w-full'}`} key={index} />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
