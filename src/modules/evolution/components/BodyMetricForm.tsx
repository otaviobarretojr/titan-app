import { Save } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import type { BodyMetricInput } from '../types/evolution'

const fields: Array<[keyof Omit<BodyMetricInput, 'notes'>, string, number, number]> = [
  ['weightKg', 'Peso (kg)', 20, 500], ['waistCm', 'Cintura', 10, 300], ['rightArmCm', 'Braço direito', 10, 300], ['leftArmCm', 'Braço esquerdo', 10, 300], ['chestCm', 'Peito', 10, 300], ['rightThighCm', 'Coxa direita', 10, 300], ['leftThighCm', 'Coxa esquerda', 10, 300], ['rightCalfCm', 'Panturrilha direita', 10, 300], ['leftCalfCm', 'Panturrilha esquerda', 10, 300], ['hipCm', 'Quadril', 10, 300], ['neckCm', 'Pescoço', 10, 300],
]
export function BodyMetricForm({ onSave }: { onSave: (input: BodyMetricInput) => Promise<unknown> }) {
  const [values, setValues] = useState<Record<string, string>>({ weightKg: '' }); const [notes, setNotes] = useState('')
  return <Card><h2 className="text-lg font-bold">Peso e medidas</h2><p className="mt-1 text-sm text-slate-400">Preencha somente o que mediu. Campos vazios permanecem sem dados.</p>
    <div className="mt-5 grid grid-cols-2 gap-3">{fields.map(([key, label, min, max]) => <label key={key}><span className="mb-2 block text-xs font-bold text-slate-500">{label}</span><input className="min-h-12 w-full rounded-2xl bg-white/5 px-3 text-center font-black outline-none focus:ring-1 focus:ring-blue-400" min={min} max={max} step="0.1" type="number" value={values[key] ?? ''} onChange={(e) => setValues((old) => ({ ...old, [key]: e.target.value }))}/></label>)}</div>
    <textarea aria-label="Observações" className="mt-4 min-h-20 w-full rounded-2xl bg-white/5 p-4 text-sm outline-none" placeholder="Horário e condições da medição" value={notes} onChange={(e) => setNotes(e.target.value)}/>
    <Button className="mt-4" fullWidth onClick={() => onSave(Object.fromEntries([...fields.map(([key]) => [key, values[key] ? Number(values[key]) : null]), ['notes', notes]]) as BodyMetricInput)}><Save size={18}/>Salvar medição</Button>
  </Card>
}
