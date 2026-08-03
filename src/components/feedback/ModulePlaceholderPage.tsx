import { ArrowLeft, Construction } from 'lucide-react'
import { Link } from 'react-router-dom'

type ModulePlaceholderPageProps = {
  eyebrow: string
  title: string
  description: string
}

export function ModulePlaceholderPage({
  eyebrow,
  title,
  description,
}: ModulePlaceholderPageProps) {
  return (
    <div className="flex min-h-[70dvh] flex-col justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
        <Construction size={27} aria-hidden="true" />
      </div>

      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-blue-300">
        {eyebrow}
      </p>

      <h1 className="mt-2 text-4xl font-black tracking-tight">{title}</h1>

      <p className="mt-4 max-w-sm text-base leading-7 text-slate-400">
        {description}
      </p>

      <Link
        className="mt-8 flex min-h-12 w-fit items-center gap-2 rounded-2xl bg-white px-5 font-bold text-slate-950 transition hover:bg-slate-200"
        to="/"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar para hoje
      </Link>
    </div>
  )
}
