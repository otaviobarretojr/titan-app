import { RefreshCw, RotateCcw, LifeBuoy } from 'lucide-react'
import { Button } from '../../shared/ui'

export function RecoveryScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#09090b] p-6 text-white">
      <section aria-labelledby="titan-recovery-title" className="w-full max-w-xl rounded-3xl border border-blue-500/30 bg-white/8 p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-300">Atualização segura</p>
        <h1 id="titan-recovery-title" className="mt-3 text-3xl font-black">O TITAN precisa concluir uma atualização</h1>
        <p className="mt-4 leading-7 text-slate-200">Seus dados continuam salvos neste dispositivo. Recarregue o aplicativo para concluir a atualização.</p>
        <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">Não limpe os dados do navegador sem fazer backup, caso já possua registros reais.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Button autoFocus onClick={() => window.location.reload()}><RefreshCw size={18} />Recarregar aplicativo</Button>
          <Button variant="ghost" onClick={onRetry ?? (() => window.location.reload())}><RotateCcw size={18} />Tentar novamente</Button>
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-bold text-white outline-none transition focus-visible:ring-2 focus-visible:ring-blue-300 motion-reduce:transition-none" href="./docs/PWA_UPDATE_AND_RECOVERY.md" target="_blank" rel="noreferrer"><LifeBuoy size={18} />Abrir ajuda técnica</a>
        </div>
      </section>
    </main>
  )
}
