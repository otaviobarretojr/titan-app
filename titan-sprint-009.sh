#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Sprint 009: PWA + Backup"

npm install vite-plugin-pwa

mkdir -p \
  docs/sprints \
  public/icons \
  src/modules/settings/pages \
  src/services/backup \
  src/components/feedback

cat > public/icons/titan.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#09090b"/>
  <rect x="72" y="72" width="368" height="368" rx="96" fill="#2563eb"/>
  <path d="M138 150h236v54h-88v166h-60V204h-88z" fill="#fff"/>
</svg>
EOF

cat > public/icons/titan-maskable.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#09090b"/>
  <circle cx="256" cy="256" r="190" fill="#2563eb"/>
  <path d="M138 150h236v54h-88v166h-60V204h-88z" fill="#fff"/>
</svg>
EOF

cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/titan.svg', 'icons/titan-maskable.svg'],
      manifest: {
        name: 'TITAN',
        short_name: 'TITAN',
        description:
          'Sistema operacional de performance pessoal para treino, nutrição, cardio e evolução.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icons/titan.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/titan-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
      },
    }),
  ],
})
EOF

cat > src/services/backup/backupService.ts <<'EOF'
import { z } from 'zod'
import { titanDatabase } from '../../database/titanDatabase'

const backupSchema = z.object({
  format: z.literal('titan-backup'),
  backupVersion: z.literal(1),
  exportedAt: z.string(),
  databaseVersion: z.number().int().positive(),
  tables: z.record(z.string(), z.array(z.unknown())),
})

export type TitanBackup = z.infer<typeof backupSchema>

export async function createBackup(): Promise<TitanBackup> {
  const tables: Record<string, unknown[]> = {}

  for (const table of titanDatabase.tables) {
    tables[table.name] = await table.toArray()
  }

  return {
    format: 'titan-backup',
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    databaseVersion: titanDatabase.verno,
    tables,
  }
}

export async function downloadBackup() {
  const backup = await createBackup()
  const content = JSON.stringify(backup, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = backup.exportedAt.slice(0, 10)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `titan-backup-${date}.json`
  anchor.click()

  URL.revokeObjectURL(url)
}

export async function restoreBackup(file: File) {
  const raw = await file.text()
  const parsed: unknown = JSON.parse(raw)
  const backup = backupSchema.parse(parsed)

  const existingTables = new Set(
    titanDatabase.tables.map((table) => table.name),
  )

  for (const tableName of Object.keys(backup.tables)) {
    if (!existingTables.has(tableName)) {
      throw new Error(`Tabela incompatível no backup: ${tableName}`)
    }
  }

  await titanDatabase.transaction(
    'rw',
    titanDatabase.tables,
    async () => {
      for (const table of titanDatabase.tables) {
        await table.clear()

        const records = backup.tables[table.name] ?? []

        if (records.length > 0) {
          await table.bulkAdd(records)
        }
      }
    },
  )
}
EOF

cat > src/components/feedback/PwaStatus.tsx <<'EOF'
import { Download, RefreshCw, WifiOff } from 'lucide-react'
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
  } = useRegisterSW()

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
EOF

cat > src/modules/settings/pages/SettingsPage.tsx <<'EOF'
import {
  DatabaseBackup,
  Download,
  FileUp,
  Info,
  ShieldCheck,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import {
  downloadBackup,
  restoreBackup,
} from '../../../services/backup/backupService'

export function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  async function exportData() {
    try {
      setIsBusy(true)
      setMessage(null)
      await downloadBackup()
      setMessage('Backup exportado com sucesso.')
    } catch {
      setMessage('Não foi possível exportar o backup.')
    } finally {
      setIsBusy(false)
    }
  }

  async function importData(file: File) {
    const confirmed = window.confirm(
      'A restauração substituirá todos os dados atuais. Continuar?',
    )

    if (!confirmed) return

    try {
      setIsBusy(true)
      setMessage(null)
      await restoreBackup(file)
      setMessage('Backup restaurado. Recarregando o TITAN...')
      window.setTimeout(() => window.location.reload(), 900)
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível restaurar o backup.',
      )
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
          TITAN CONFIGURAÇÕES
        </p>
        <h1 className="mt-2 text-3xl font-black">Mais</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Proteja seus dados e gerencie a instalação do aplicativo.
        </p>
      </header>

      <Card elevated>
        <div className="flex gap-3">
          <DatabaseBackup
            className="shrink-0 text-blue-300"
            size={24}
            aria-hidden="true"
          />
          <div>
            <h2 className="text-lg font-bold">Backup local</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Exporte seus registros regularmente. Limpar os dados do
              navegador pode remover informações locais.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Button
            disabled={isBusy}
            fullWidth
            onClick={exportData}
          >
            <Download size={18} aria-hidden="true" />
            Exportar backup
          </Button>

          <Button
            disabled={isBusy}
            fullWidth
            onClick={() => fileInputRef.current?.click()}
            variant="ghost"
          >
            <FileUp size={18} aria-hidden="true" />
            Restaurar backup
          </Button>

          <input
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importData(file)
              event.target.value = ''
            }}
            ref={fileInputRef}
            type="file"
          />
        </div>

        {message ? (
          <p
            className="mt-4 rounded-2xl bg-white/5 p-3 text-sm text-slate-300"
            role="status"
          >
            {message}
          </p>
        ) : null}
      </Card>

      <Card>
        <div className="flex gap-3">
          <ShieldCheck
            className="shrink-0 text-emerald-300"
            size={23}
            aria-hidden="true"
          />
          <div>
            <h2 className="font-bold">Privacidade local</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Nesta versão, os dados permanecem no dispositivo e não são
              enviados automaticamente para servidores externos.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex gap-3">
          <Info
            className="shrink-0 text-slate-400"
            size={22}
            aria-hidden="true"
          />
          <div>
            <h2 className="font-bold">Sobre</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              TITAN — sistema operacional de performance pessoal.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/App.tsx")
content = path.read_text()

if "SettingsPage" not in content:
    content = content.replace(
        "import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'",
        """import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { SettingsPage } from '../modules/settings/pages/SettingsPage'""",
    )

old_route = """          <Route
            path="/more"
            element={
              <ModulePlaceholderPage
                eyebrow="Configurações"
                title="Mais"
                description="Backup, perfil, preferências, saúde e configurações do TITAN serão acessados nesta área."
              />
            }
          />"""

new_route = """          <Route path="/more" element={<SettingsPage />} />"""

if old_route in content:
    content = content.replace(old_route, new_route)

path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/layouts/AppShell.tsx")
content = path.read_text()

if "PwaStatus" not in content:
    content = content.replace(
        "import { NavLink, Outlet } from 'react-router-dom'",
        """import { NavLink, Outlet } from 'react-router-dom'
import { PwaStatus } from '../components/feedback/PwaStatus'""",
    )

content = content.replace(
    '<div className="min-h-dvh bg-titan-background text-white">',
    '<div className="min-h-dvh bg-titan-background text-white">\n      <PwaStatus />',
)

path.write_text(content)
PY

cat > src/vite-env.d.ts <<'EOF'
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
EOF

cat > docs/sprints/SPRINT-009.md <<'EOF'
# Sprint 009 — PWA e Backup

## Entregas

- Manifesto instalável.
- Service Worker.
- Funcionamento offline do shell.
- Aviso de atualização.
- Indicador offline.
- Exportação de backup JSON.
- Restauração completa validada.
- Página Mais funcional.

## Critérios de aceite

- Build e lint passam sem erros.
- O manifesto é gerado no build.
- Backup contém todas as tabelas do IndexedDB.
- Restauração exige confirmação.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Sprint 009

### Added

- Configuração PWA.
- Service Worker e cache do App Shell.
- Estado offline e atualização disponível.
- Backup e restauração.
- Página de configurações.
EOF

echo "🧪 Executando build..."
npm run build

echo "🧹 Executando lint..."
npm run lint

echo ""
echo "✅ Sprint 009 aplicada com sucesso."
echo 'Próximo comando: git add . && git commit -m "feat: add pwa and local backup" && git push'
