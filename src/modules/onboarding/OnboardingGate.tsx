import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { titanDatabase } from '../../database/titanDatabase'
import { Button, Card } from '../../shared/ui'

export function OnboardingGate({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = useLiveQuery(
    async () => (await titanDatabase.userProfile.get('primary')) ?? null,
    [],
    undefined,
  )

  const prefs = useLiveQuery(
    async () => (await titanDatabase.appPreferences.get('app')) ?? null,
    [],
    undefined,
  )

  async function skip() {
    const now = new Date().toISOString()

    await titanDatabase.appPreferences.put({
      id: 'app',
      theme: prefs?.theme ?? 'system',
      onboardingStatus: 'skipped',
      reduceAnimations: prefs?.reduceAnimations ?? false,
      highContrast: prefs?.highContrast ?? false,
      updateChannel: 'stable',
      createdAt: prefs?.createdAt ?? now,
      updatedAt: now,
    })
  }

  if (profile === undefined || prefs === undefined) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-950 text-white">
        <p className="text-sm text-slate-400">Preparando o TITAN...</p>
      </main>
    )
  }

  if (!profile && prefs?.onboardingStatus !== 'skipped') {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center p-6 text-white">
        <Card elevated>
          <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
            Bem-vindo ao TITAN
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Configure sua base
          </h1>

          <div className="mt-5 grid gap-3">
            <Link
              className="rounded-2xl bg-blue-600 p-3 text-center font-bold"
              to="/profile"
            >
              Criar perfil
            </Link>

            <Link
              className="rounded-2xl bg-white/10 p-3 text-center font-bold"
              to="/more"
            >
              Importar Projeto TITAN
            </Link>

            <Link
              className="rounded-2xl bg-white/10 p-3 text-center font-bold"
              to="/more"
            >
              Restaurar backup
            </Link>

            <Button variant="ghost" onClick={() => void skip()}>
              Continuar depois
            </Button>
          </div>
        </Card>
      </main>
    )
  }

  return <>{children}</>
}
