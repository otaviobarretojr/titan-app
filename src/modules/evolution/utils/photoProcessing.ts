export const MAX_PHOTO_INPUT_BYTES = 12 * 1024 * 1024
export const MAX_PHOTO_EDGE = 1600

type CreateBitmap = typeof createImageBitmap

export async function optimizeProgressPhoto(
  file: File,
  createBitmap?: CreateBitmap,
): Promise<string> {
  const supportedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!supportedTypes.includes(file.type)) {
    throw new Error('Use uma imagem JPEG, PNG ou WebP.')
  }

  if (file.size > MAX_PHOTO_INPUT_BYTES) {
    throw new Error('A foto excede o limite de 12 MB.')
  }

  const bitmapFactory =
    createBitmap ??
    (typeof globalThis.createImageBitmap === 'function'
      ? globalThis.createImageBitmap
      : null)

  if (!bitmapFactory) {
    throw new Error(
      'Este navegador não oferece suporte ao processamento de imagens.',
    )
  }

  const bitmap = await bitmapFactory(file)

  try {
    const largestEdge = Math.max(bitmap.width, bitmap.height)
    const scale =
      largestEdge > 0
        ? Math.min(1, MAX_PHOTO_EDGE / largestEdge)
        : 1

    const canvas = document.createElement('canvas')

    canvas.width = Math.max(
      1,
      Math.round(bitmap.width * scale),
    )

    canvas.height = Math.max(
      1,
      Math.round(bitmap.height * scale),
    )

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error(
        'Não foi possível preparar a foto para otimização.',
      )
    }

    context.drawImage(
      bitmap,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const result = canvas.toDataURL('image/webp', 0.82)

    if (!result.startsWith('data:image/webp')) {
      throw new Error('Não foi possível otimizar a foto.')
    }

    return result
  } finally {
    bitmap.close()
  }
}

export function isQuotaError(reason: unknown) {
  return (
    reason instanceof DOMException &&
    (
      reason.name === 'QuotaExceededError' ||
      reason.code === 22
    )
  )
}