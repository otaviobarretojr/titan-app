type ProgressBarProps = {
  value: number
  label: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>{label}</span>
        <span>{normalizedValue}%</span>
      </div>

      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={normalizedValue}
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-[width] duration-500"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  )
}
