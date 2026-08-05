export const UPDATE_RELOAD_KEY = 'titan-update-reload-attempted'
export const CHUNK_RECOVERY_KEY = 'titan-chunk-recovery-attempted'

const chunkErrorPatterns = [
  /ChunkLoadError/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk \d* failed/i,
  /loading chunk failed/i,
  /Unable to preload CSS/i,
  /\.js(?:\?|$)/i,
]

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '')
  }
  return String(error ?? '')
}

export function isChunkLoadError(error: unknown): boolean {
  const message = getErrorMessage(error)
  return chunkErrorPatterns.some((pattern) => pattern.test(message))
}

export function markAppBootSuccessful() {
  window.sessionStorage.removeItem(UPDATE_RELOAD_KEY)
}

export function hasReloadAttempted(key = UPDATE_RELOAD_KEY) {
  return window.sessionStorage.getItem(key) === 'true'
}

export function reloadOnce(key = UPDATE_RELOAD_KEY) {
  if (hasReloadAttempted(key)) return false
  window.sessionStorage.setItem(key, 'true')
  window.location.reload()
  return true
}

export async function requestServiceWorkerActivation(registration?: ServiceWorkerRegistration | null) {
  const waiting = registration?.waiting ?? (await navigator.serviceWorker?.getRegistration())?.waiting
  if (!waiting) return false
  waiting.postMessage({ type: 'SKIP_WAITING' })
  return true
}

export async function activateUpdateAndReload(registration?: ServiceWorkerRegistration | null) {
  await requestServiceWorkerActivation(registration)
  if (!navigator.serviceWorker?.controller) return reloadOnce()
  return new Promise<boolean>((resolve) => {
    const timeout = window.setTimeout(() => resolve(reloadOnce()), 4000)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.clearTimeout(timeout)
      resolve(reloadOnce())
    }, { once: true })
  })
}

export async function recoverFromChunkError() {
  await requestServiceWorkerActivation()
  return reloadOnce(CHUNK_RECOVERY_KEY)
}
