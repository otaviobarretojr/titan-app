import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RecoveryScreen } from './RecoveryScreen'
import { isChunkLoadError, recoverFromChunkError } from '../../services/pwa/updateRecovery'

type State = { error: Error | null; recovering: boolean }

export class GlobalErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, recovering: false }

  static getDerivedStateFromError(error: Error): State { return { error, recovering: false } }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TITAN] Falha capturada pelo Error Boundary.', error, info)
    if (isChunkLoadError(error)) {
      this.setState({ recovering: true })
      void recoverFromChunkError().then((reloaded) => {
        if (!reloaded) this.setState({ recovering: false })
      })
    }
  }

  render() {
    if (this.state.error) return <RecoveryScreen onRetry={() => this.setState({ error: null, recovering: false })} />
    return this.props.children
  }
}
