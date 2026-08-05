import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { GlobalErrorBoundary } from './components/feedback/GlobalErrorBoundary'
import { isChunkLoadError, markAppBootSuccessful, recoverFromChunkError } from './services/pwa/updateRecovery'
import './styles/globals.css'

function renderBootstrapFallback(message = 'Não foi possível iniciar o TITAN.') {
  const root = document.getElementById('root')
  if (!root) return
  root.innerHTML = `<main style="min-height:100dvh;display:grid;place-items:center;background:#09090b;color:white;padding:24px;font-family:system-ui,sans-serif"><section style="max-width:560px;border:1px solid rgba(59,130,246,.35);border-radius:24px;padding:24px;background:rgba(255,255,255,.08)"><h1>O TITAN precisa concluir uma atualização</h1><p>${message} Seus dados continuam salvos neste dispositivo. Recarregue o aplicativo para concluir a atualização.</p><p style="color:#fde68a">Não limpe os dados do navegador sem fazer backup, caso já possua registros reais.</p><button style="min-height:44px;border-radius:14px;padding:0 16px;font-weight:700" onclick="window.location.reload()">Recarregar aplicativo</button></section></main>`
}

window.addEventListener('error', (event) => {
  console.error('[TITAN] Erro global.', event.error ?? event.message)
  if (isChunkLoadError(event.error ?? event.message)) void recoverFromChunkError()
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[TITAN] Promessa rejeitada.', event.reason)
  if (isChunkLoadError(event.reason)) void recoverFromChunkError()
})

try {
  { const saved = localStorage.getItem('titan-theme'); document.documentElement.dataset.theme = saved === 'light' || saved === 'system' ? saved : 'dark' }
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    renderBootstrapFallback('Elemento raiz da aplicação não encontrado.')
  } else {
    createRoot(rootElement).render(
      <StrictMode>
        <GlobalErrorBoundary>
          <App />
        </GlobalErrorBoundary>
      </StrictMode>,
    )
    window.setTimeout(markAppBootSuccessful, 1000)
  }
} catch (error) {
  console.error('[TITAN] Falha antes da montagem do React.', error)
  renderBootstrapFallback()
  if (isChunkLoadError(error)) void recoverFromChunkError()
}
