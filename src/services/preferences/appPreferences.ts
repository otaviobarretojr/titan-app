import { titanDatabase, type AppPreferenceRecord } from '../../database/titanDatabase'

export type ThemeMode = 'system' | 'light' | 'dark'

const legacyThemeMap: Record<string, ThemeMode> = { premium: 'dark', amoled: 'dark' }

export function normalizeThemeMode(value: unknown): ThemeMode {
  if (value === 'system' || value === 'light' || value === 'dark') return value
  if (typeof value === 'string' && value in legacyThemeMap) return legacyThemeMap[value]
  return 'system'
}

export function applyThemeMode(mode: ThemeMode, matcher = window.matchMedia?.bind(window)) {
  const resolved = mode === 'system' ? (matcher?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.themeMode = mode
  return resolved
}

export async function getPreference<T = unknown>(key: string): Promise<T | null> {
  return (await titanDatabase.appPreferences.get(key))?.value as T | undefined ?? null
}

export async function setPreference(key: string, value: unknown) {
  const now = new Date().toISOString()
  const record: AppPreferenceRecord = { key, value, createdAt: now, updatedAt: now }
  const existing = await titanDatabase.appPreferences.get(key)
  await titanDatabase.appPreferences.put(existing ? { ...record, createdAt: existing.createdAt } : record)
}

export async function loadThemePreference(): Promise<ThemeMode> {
  const stored = await getPreference<string>('theme')
  const legacy = localStorage.getItem('titan-theme')
  const mode = normalizeThemeMode(stored ?? legacy)
  if (stored !== mode || legacy) {
    await setPreference('theme', mode)
    localStorage.removeItem('titan-theme')
  }
  return mode
}

export async function saveThemePreference(mode: ThemeMode) {
  await setPreference('theme', mode)
  applyThemeMode(mode)
}

export async function deferOnboarding() {
  await setPreference('onboarding.deferred', true)
}

export async function isOnboardingDeferred() {
  return (await getPreference<boolean>('onboarding.deferred')) === true
}
