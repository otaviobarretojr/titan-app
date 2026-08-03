type SectionTitleProps = {
  title: string
  supportingText?: string
}

export function SectionTitle({ title, supportingText }: SectionTitleProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {supportingText ? (
        <span className="text-xs font-medium text-slate-500">{supportingText}</span>
      ) : null}
    </div>
  )
}
