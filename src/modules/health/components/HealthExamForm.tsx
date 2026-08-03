import type { ReactNode } from 'react'
import { FilePlus2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'

type HealthExamFormProps = {
  onSave: (input: {
    examDate: string
    title: string
    category: string
    value: string
    referenceRange: string
    notes: string
  }) => Promise<unknown>
}

export function HealthExamForm({ onSave }: HealthExamFormProps) {
  const [examDate, setExamDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [value, setValue] = useState('')
  const [referenceRange, setReferenceRange] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <Card>
      <h2 className="text-lg font-bold">Adicionar exame</h2>

      <div className="mt-5 space-y-3">
        <Field label="Data">
          <input
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-blue-400"
            onChange={(event) => setExamDate(event.target.value)}
            type="date"
            value={examDate}
          />
        </Field>

        <Field label="Nome">
          <input
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-blue-400"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: Hemograma"
            value={title}
          />
        </Field>

        <Field label="Categoria">
          <input
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-blue-400"
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Ex.: Hormonal, metabólico"
            value={category}
          />
        </Field>

        <Field label="Resultado">
          <input
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-blue-400"
            onChange={(event) => setValue(event.target.value)}
            placeholder="Valor e unidade"
            value={value}
          />
        </Field>

        <Field label="Referência">
          <input
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-blue-400"
            onChange={(event) => setReferenceRange(event.target.value)}
            placeholder="Faixa informada pelo laboratório"
            value={referenceRange}
          />
        </Field>

        <Field label="Observações">
          <textarea
            className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-blue-400"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </Field>
      </div>

      <Button
        className="mt-5"
        fullWidth
        onClick={() =>
          onSave({
            examDate,
            title,
            category,
            value,
            referenceRange,
            notes,
          })
        }
      >
        <FilePlus2 size={18} aria-hidden="true" />
        Salvar exame
      </Button>
    </Card>
  )
}

type FieldProps = {
  label: string
  children: ReactNode
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-500">
        {label}
      </span>
      {children}
    </label>
  )
}
