import { titanDatabase } from '../../database/titanDatabase'

export type StorageDiagnostics = {
  usage: number | null
  quota: number | null
  persisted: boolean | null
  records: number
  photos: number
}

export function formatBytes(value: number | null) {
  if (value === null) return 'Indisponível'
  if (value < 1024) return `${value} B`
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 ** 2).toFixed(1)} MB`
}

export async function getStorageDiagnostics(): Promise<StorageDiagnostics> {
  const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : {}
  const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null
  const counts = await Promise.all(titanDatabase.tables.map((table) => table.count()))
  return {
    usage: estimate.usage ?? null,
    quota: estimate.quota ?? null,
    persisted,
    records: counts.reduce((total, count) => total + count, 0),
    photos: await titanDatabase.progressPhotos.count(),
  }
}
