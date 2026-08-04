import { RefreshCw, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '../../shared/ui'

export function PwaStatus() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      window.setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
  })

  useEffect(() => {
    function updateConnection() {
      setIsOffline(!navigator.onLine)
    }

    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)

    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  if (needRefresh) {
    return (
      <div className="fixed inset-x-4 top-4 z-[100] mx-auto max-w-md rounded-2xl border border-blue-500/30 bg-[#111827] p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <RefreshCw
            className="shrink-0 text-blue-300"
            size={20}
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="font-bold">Atualização disponível</p>
            <p className="mt-1 text-xs text-slate-400">
              Uma nova versão do TITAN está pronta.
            </p>
          </div>
          <Button
            className="min-h-10 px-3 text-sm"
            onClick={() => updateServiceWorker(true)}
          >
            Atualizar
          </Button>
        </div>
      </div>
    )
  }

  if (isOffline) {
    return (
      <div className="fixed inset-x-4 top-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-amber-500/30 bg-[#111827] p-4 shadow-2xl">
        <WifiOff
          className="shrink-0 text-amber-300"
          size={20}
          aria-hidden="true"
        />
        <div>
          <p className="font-bold">Modo offline</p>
          <p className="mt-1 text-xs text-slate-400">
            Seus registros continuam salvos neste aparelho.
          </p>
        </div>
      </div>
    )
  }

  return null
}
