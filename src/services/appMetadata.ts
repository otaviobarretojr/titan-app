import { titanDatabase } from '../database/titanDatabase'

export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.3'
export const BUILD_DATE = import.meta.env.VITE_BUILD_DATE ?? 'desconhecida'
export const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT ?? 'local'
export const RELEASE_CHANNEL = 'Stable'

export function getDatabaseVersion() { return titanDatabase.verno }
export function getServiceWorkerStatus(updateAvailable = false) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return 'Indisponível'
  return updateAvailable ? 'Atualização disponível' : 'Atualizado'
}
