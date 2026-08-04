import { Download, Share } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../shared/ui'
import { isIos, isStandalone, type BeforeInstallPromptEvent } from '../../services/pwa/installService'

export function InstallPwa() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const complete = () => {
      setInstalled(true)
      setInstallEvent(null)
    }
    window.addEventListener('beforeinstallprompt', capture)
    window.addEventListener('appinstalled', complete)
    return () => {
      window.removeEventListener('beforeinstallprompt', capture)
      window.removeEventListener('appinstalled', complete)
    }
  }, [])

  if (installed) return null

  async function install() {
    if (!installEvent) {
      setShowIosHelp(isIos())
      return
    }
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    setInstallEvent(null)
  }

  if (!installEvent && !isIos()) return null

  return (
    <aside aria-live="polite" className="mb-5 rounded-2xl border border-blue-500/30 bg-[#111827] p-4">
      <Button fullWidth onClick={() => void install()}>
        <Download size={18} aria-hidden="true" /> Instalar TITAN
      </Button>
      {showIosHelp ? (
        <p className="mt-3 text-sm leading-6 text-slate-300">
          <Share className="mr-1 inline" size={17} aria-hidden="true" />
          No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.
        </p>
      ) : null}
    </aside>
  )
}
