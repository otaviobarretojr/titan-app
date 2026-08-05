import { titanDatabase } from '../../../database/titanDatabase'
import packageJson from '../../../../package.json'

export const appInfo = {
  version: '1.0.3',
  channel: 'Stable',
  build: import.meta.env.VITE_APP_BUILD ?? 'local',
  commit: import.meta.env.VITE_GIT_COMMIT ?? 'dev',
  date: import.meta.env.VITE_BUILD_DATE ?? new Date().toISOString().slice(0, 10),
  dexieVersion: titanDatabase.verno,
  serviceWorker: 'PWA com atualização segura',
  changelog: [
    'Perfil editável e onboarding persistente.',
    'Importação TITAN v1.0 com Zod, prévia e rollback.',
    'Planos ativos separados de execução e histórico.',
    'Tema system/light/dark persistido em preferências.',
  ],
  packageVersion: packageJson.version,
}
