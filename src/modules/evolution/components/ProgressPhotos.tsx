import { Camera, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import type { PhotoPose, ProgressPhoto } from '../types/evolution'
import { optimizeProgressPhoto } from '../utils/photoProcessing'

const poses: Array<[PhotoPose, string]> = [
  ['front', 'Frente'],
  ['back', 'Costas'],
  ['right-side', 'Lateral direita'],
  ['left-side', 'Lateral esquerda'],
]

type ProgressPhotosProps = {
  photos: ProgressPhoto[]
  onSave: (photo: { imageDataUrl: string; pose: PhotoPose; weightKg: number | null; notes: string }) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function ProgressPhotos({ photos, onSave, onDelete }: ProgressPhotosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pose, setPose] = useState<PhotoPose>('front')
  const [filter, setFilter] = useState<PhotoPose | ''>('')
  const [error, setError] = useState('')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')

  const visiblePhotos = useMemo(() => (filter ? photos.filter((photo) => photo.pose === filter) : photos), [photos, filter])

  async function handleFile(file: File) {
    try {
      setError('')
      await onSave({
        imageDataUrl: await optimizeProgressPhoto(file),
        pose,
        weightKg: weight ? Number(weight) : null,
        notes,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível processar a foto.')
    }
  }

  return (
    <section className="space-y-3">
      <Card>
        <h2 className="flex items-center gap-2 font-bold">
          <Camera aria-hidden="true" size={20} />
          Fotos de evolução
        </h2>
        <p className="mt-2 text-sm text-slate-400">A imagem é redimensionada e comprimida localmente antes de ser salva.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor="progress-photo-pose">Pose da foto</label>
          <select
            className="min-h-12 rounded-xl bg-slate-900 px-3"
            id="progress-photo-pose"
            value={pose}
            onChange={(event) => setPose(event.target.value as PhotoPose)}
          >
            {poses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
          <label className="sr-only" htmlFor="progress-photo-weight">Peso relacionado à foto</label>
          <input
            className="min-h-12 rounded-xl bg-white/5 px-3"
            id="progress-photo-weight"
            placeholder="Peso (opcional)"
            type="number"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </div>
        <label className="sr-only" htmlFor="progress-photo-notes">Observações da foto</label>
        <input
          className="mt-2 min-h-12 w-full rounded-xl bg-white/5 px-3"
          id="progress-photo-notes"
          placeholder="Observações"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {error ? <p role="alert" className="mt-2 text-sm text-red-300">{error}</p> : null}
        <Button className="mt-3" fullWidth onClick={() => fileInputRef.current?.click()}>Adicionar foto otimizada</Button>
        <input
          ref={fileInputRef}
          hidden
          aria-label="Selecionar foto de evolução"
          accept="image/jpeg,image/png,image/webp"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
            event.target.value = ''
          }}
        />
      </Card>

      <select
        aria-label="Filtrar fotos por pose"
        className="min-h-11 w-full rounded-xl bg-slate-900 px-3"
        value={filter}
        onChange={(event) => setFilter(event.target.value as PhotoPose | '')}
      >
        <option value="">Todas as poses</option>
        {poses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
      </select>

      <div className="grid grid-cols-2 gap-3">
        {visiblePhotos.map((photo) => {
          const poseLabel = poses.find(([value]) => value === photo.pose)?.[1] ?? photo.pose

          return (
            <Card className="overflow-hidden p-0" key={photo.id}>
              <img className="aspect-[3/4] w-full object-cover" alt={`Evolução ${poseLabel}`} src={photo.imageDataUrl} />
              <div className="p-3">
                <p className="text-xs font-bold text-blue-300">{poseLabel}</p>
                <p className="text-xs text-slate-500">{photo.localDate}{photo.weightKg ? ` · ${photo.weightKg} kg` : ''}</p>
                <Button className="mt-2 w-full" variant="ghost" onClick={() => { if (window.confirm('Excluir esta foto permanentemente?')) void onDelete(photo.id) }}>
                  <Trash2 aria-hidden="true" size={16} />
                  Excluir
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
