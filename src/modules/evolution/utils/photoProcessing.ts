export const MAX_PHOTO_INPUT_BYTES = 12 * 1024 * 1024
export const MAX_PHOTO_EDGE = 1600

export async function optimizeProgressPhoto(file: File, createBitmap: typeof createImageBitmap = createImageBitmap): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use uma imagem JPEG, PNG ou WebP.')
  if (file.size > MAX_PHOTO_INPUT_BYTES) throw new Error('A foto excede o limite de 12 MB.')
  const bitmap = await createBitmap(file)
  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const result = canvas.toDataURL('image/webp', 0.82)
  if (!result.startsWith('data:image/webp')) throw new Error('Não foi possível otimizar a foto.')
  return result
}

export function isQuotaError(reason: unknown) {
  return reason instanceof DOMException && (reason.name === 'QuotaExceededError' || reason.code === 22)
}
