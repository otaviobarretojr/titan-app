import { Camera, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import type { ProgressPhoto } from '../types/evolution'

type ProgressPhotosProps = {
  photos: ProgressPhoto[]
  onSave: (input: {
    imageDataUrl: string
    pose: 'front' | 'side' | 'back' | 'other'
    notes: string
  }) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

export function ProgressPhotos({
  photos,
  onSave,
  onDelete,
}: ProgressPhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pose, setPose] = useState<
    'front' | 'side' | 'back' | 'other'
  >('front')

  async function handleFile(file: File) {
    const imageDataUrl = await readFileAsDataUrl(file)
    await onSave({ imageDataUrl, pose, notes: '' })
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-3">
          <Camera className="text-blue-300" size={22} aria-hidden="true" />
          <div>
            <h2 className="font-bold">Fotos de evolução</h2>
            <p className="mt-1 text-sm text-slate-400">
              Use iluminação, distância e posição semelhantes.
            </p>
          </div>
        </div>

        <select
          className="mt-4 min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white"
          onChange={(event) =>
            setPose(
              event.target.value as 'front' | 'side' | 'back' | 'other',
            )
          }
          value={pose}
        >
          <option value="front">Frente</option>
          <option value="side">Lateral</option>
          <option value="back">Costas</option>
          <option value="other">Outra</option>
        </select>

        <Button
          className="mt-4"
          fullWidth
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={18} aria-hidden="true" />
          Adicionar foto
        </Button>

        <input
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
            event.target.value = ''
          }}
          ref={inputRef}
          type="file"
        />
      </Card>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <Card className="overflow-hidden p-0" key={photo.id}>
              <img
                alt={`Evolução ${photo.pose}`}
                className="aspect-[3/4] w-full object-cover"
                src={photo.imageDataUrl}
              />
              <div className="p-3">
                <p className="text-xs font-bold uppercase text-blue-300">
                  {photo.pose}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Intl.DateTimeFormat('pt-BR').format(
                    new Date(`${photo.localDate}T12:00:00`),
                  )}
                </p>
                <Button
                  className="mt-3 w-full"
                  onClick={() => onDelete(photo.id)}
                  variant="ghost"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
