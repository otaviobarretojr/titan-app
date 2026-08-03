#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Notificações + Offline + Backup Premium"

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR=".titan-backups/notifications-offline-backup-$STAMP"

mkdir -p \
  "$BACKUP_DIR" \
  docs/features \
  src/modules/notifications/pages \
  src/modules/notifications/types \
  src/services/notifications \
  src/services/backup \
  src/modules/settings/pages \
  .github/workflows \
  public/icons \
  scripts

for item in \
  src/services/notifications \
  src/services/backup \
  src/modules/settings \
  src/app/App.tsx \
  src/layouts/AppShell.tsx \
  vite.config.ts \
  package.json \
  docs; do
  if [ -e "$item" ]; then
    cp -R "$item" "$BACKUP_DIR/"
  fi
done

cat > src/modules/notifications/types/notifications.ts <<'EOF'
export type ReminderType =
  | 'meal'
  | 'hydration'
  | 'workout'
  | 'cardio'
  | 'sleep'

export type ReminderPreference = {
  id: ReminderType
  label: string
  description: string
  enabled: boolean
  time: string
}
EOF

cat > src/services/notifications/notificationService.ts <<'EOF'
import type {
  ReminderPreference,
  ReminderType,
} from '../../modules/notifications/types/notifications'

const SETTINGS_KEY = 'titan-notification-preferences'
const MASTER_KEY = 'titan-notifications-enabled'

const defaultPreferences: ReminderPreference[] = [
  {
    id: 'meal',
    label: 'Refeições',
    description: 'Lembretes para refeições planejadas.',
    enabled: true,
    time: '12:30',
  },
  {
    id: 'hydration',
    label: 'Hidratação',
    description: 'Lembrete diário de água.',
    enabled: true,
    time: '15:00',
  },
  {
    id: 'workout',
    label: 'Treino',
    description: 'Aviso antes do horário de treino.',
    enabled: true,
    time: '18:30',
  },
  {
    id: 'cardio',
    label: 'Cardio',
    description: 'Lembrete para cardio planejado.',
    enabled: false,
    time: '18:00',
  },
  {
    id: 'sleep',
    label: 'Sono',
    description: 'Aviso para iniciar a rotina noturna.',
    enabled: true,
    time: '21:30',
  },
]

export function notificationsSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  )
}

export function getNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) {
    throw new Error('Este navegador não oferece notificações.')
  }

  return Notification.requestPermission()
}

export function notificationsEnabled() {
  return localStorage.getItem(MASTER_KEY) === 'true'
}

export function setNotificationsEnabled(enabled: boolean) {
  localStorage.setItem(MASTER_KEY, String(enabled))
}

export function getReminderPreferences(): ReminderPreference[] {
  const raw = localStorage.getItem(SETTINGS_KEY)

  if (!raw) return defaultPreferences

  try {
    const parsed = JSON.parse(raw) as ReminderPreference[]
    return defaultPreferences.map((defaultItem) => {
      const saved = parsed.find((item) => item.id === defaultItem.id)
      return saved ?? defaultItem
    })
  } catch {
    return defaultPreferences
  }
}

export function saveReminderPreferences(
  preferences: ReminderPreference[],
) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences))
}

export function updateReminderPreference(
  type: ReminderType,
  changes: Partial<ReminderPreference>,
) {
  const preferences = getReminderPreferences().map((item) =>
    item.id === type ? { ...item, ...changes } : item,
  )

  saveReminderPreferences(preferences)
  return preferences
}

export async function showTitanNotification(input: {
  title: string
  body: string
  tag?: string
  url?: string
}) {
  if (!notificationsSupported()) {
    throw new Error('Notificações não suportadas.')
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Permissão de notificação não concedida.')
  }

  const registration = await navigator.serviceWorker.ready

  await registration.showNotification(input.title, {
    body: input.body,
    tag: input.tag ?? 'titan',
    icon: './icons/titan.svg',
    badge: './icons/titan.svg',
    data: {
      url: input.url ?? './',
    },
  })
}
EOF

cat > src/modules/notifications/pages/NotificationsPage.tsx <<'EOF'
import { Bell, BellRing, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import {
  getNotificationPermission,
  getReminderPreferences,
  notificationsEnabled,
  requestNotificationPermission,
  saveReminderPreferences,
  setNotificationsEnabled,
  showTitanNotification,
} from '../../../services/notifications/notificationService'
import type {
  ReminderPreference,
  ReminderType,
} from '../types/notifications'

export function NotificationsPage() {
  const [preferences, setPreferences] = useState<ReminderPreference[]>(
    () => getReminderPreferences(),
  )
  const [masterEnabled, setMasterEnabled] = useState(
    notificationsEnabled(),
  )
  const [message, setMessage] = useState<string | null>(null)

  const permission = useMemo(
    () => getNotificationPermission(),
    [masterEnabled],
  )

  async function enableNotifications() {
    try {
      const result = await requestNotificationPermission()
      const enabled = result === 'granted'
      setNotificationsEnabled(enabled)
      setMasterEnabled(enabled)

      setMessage(
        enabled
          ? 'Notificações ativadas neste aparelho.'
          : 'Permissão de notificação não concedida.',
      )
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível ativar notificações.',
      )
    }
  }

  function updatePreference(
    id: ReminderType,
    changes: Partial<ReminderPreference>,
  ) {
    setPreferences((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    )
  }

  function savePreferences() {
    saveReminderPreferences(preferences)
    setMessage('Preferências salvas.')
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-amber-300">
          TITAN LEMBRETES
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Notificações
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Configure lembretes locais de acordo com sua rotina.
        </p>
      </header>

      <Card elevated>
        <div className="flex items-center gap-3">
          <BellRing
            className="text-amber-300"
            size={24}
            aria-hidden="true"
          />

          <div>
            <h2 className="font-bold">Permissão do aparelho</h2>
            <p className="mt-1 text-sm text-slate-400">
              Estado atual: {permission}
            </p>
          </div>
        </div>

        <Button
          className="mt-5"
          fullWidth
          onClick={enableNotifications}
        >
          <Bell size={18} aria-hidden="true" />
          {masterEnabled
            ? 'Notificações ativadas'
            : 'Ativar notificações'}
        </Button>

        <Button
          className="mt-3"
          disabled={permission !== 'granted'}
          fullWidth
          onClick={async () => {
            try {
              await showTitanNotification({
                title: 'TITAN',
                body: 'As notificações estão funcionando neste aparelho.',
                tag: 'titan-test',
                url: './',
              })
            } catch (reason) {
              setMessage(
                reason instanceof Error
                  ? reason.message
                  : 'Não foi possível testar a notificação.',
              )
            }
          }}
          variant="ghost"
        >
          Testar notificação
        </Button>
      </Card>

      <div className="space-y-3">
        {preferences.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold">{item.label}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
              </div>

              <input
                checked={item.enabled}
                className="h-5 w-5 accent-blue-500"
                onChange={(event) =>
                  updatePreference(item.id, {
                    enabled: event.target.checked,
                  })
                }
                type="checkbox"
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold text-slate-500">
                Horário
              </span>

              <input
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none"
                onChange={(event) =>
                  updatePreference(item.id, {
                    time: event.target.value,
                  })
                }
                type="time"
                value={item.time}
              />
            </label>
          </Card>
        ))}
      </div>

      <Button fullWidth onClick={savePreferences}>
        <Save size={18} aria-hidden="true" />
        Salvar lembretes
      </Button>

      {message ? (
        <p
          className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
EOF

cat > src/services/backup/backupService.ts <<'EOF'
import { z } from 'zod'
import { titanDatabase } from '../../database/titanDatabase'

const backupSchema = z.object({
  format: z.literal('titan-backup'),
  backupVersion: z.literal(2),
  exportedAt: z.string(),
  databaseVersion: z.number(),
  tables: z.record(z.string(), z.array(z.unknown())),
  localStorage: z.record(z.string(), z.string()),
})

export type TitanBackup = z.infer<typeof backupSchema>

function exportTitanLocalStorage() {
  const values: Record<string, string> = {}

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)

    if (!key || !key.startsWith('titan-')) continue

    const value = localStorage.getItem(key)

    if (value !== null) {
      values[key] = value
    }
  }

  return values
}

export async function createBackup(): Promise<TitanBackup> {
  const tables: Record<string, unknown[]> = {}

  for (const table of titanDatabase.tables) {
    tables[table.name] = await table.toArray()
  }

  return {
    format: 'titan-backup',
    backupVersion: 2,
    exportedAt: new Date().toISOString(),
    databaseVersion: titanDatabase.verno,
    tables,
    localStorage: exportTitanLocalStorage(),
  }
}

export async function downloadBackup() {
  const backup = await createBackup()
  const content = JSON.stringify(backup, null, 2)
  const blob = new Blob([content], {
    type: 'application/json',
  })
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
      throw new Error(
        `Tabela incompatível no backup: ${tableName}`,
      )
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

  for (const [key, value] of Object.entries(backup.localStorage)) {
    localStorage.setItem(key, value)
  }
}
EOF

cat > src/modules/settings/pages/SettingsPage.tsx <<'EOF'
import {
  BarChart3,
  Bell,
  DatabaseBackup,
  Download,
  FileUp,
  Info,
  Moon,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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

        <h1 className="mt-2 text-3xl font-black">
          Mais
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Configurações, segurança, relatórios e dados do aplicativo.
        </p>
      </header>

      <Card>
        <div className="flex gap-3">
          <Bell
            className="shrink-0 text-amber-300"
            size={23}
            aria-hidden="true"
          />

          <div className="flex-1">
            <h2 className="font-bold">Notificações</h2>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Refeições, água, treino, cardio e sono.
            </p>

            <Link
              className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-white/10 px-4 text-sm font-bold text-white"
              to="/notifications"
            >
              Configurar lembretes
            </Link>
          </div>
        </div>
      </Card>

      <Card elevated>
        <div className="flex gap-3">
          <DatabaseBackup
            className="shrink-0 text-blue-300"
            size={24}
            aria-hidden="true"
          />

          <div>
            <h2 className="text-lg font-bold">
              Backup completo
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Inclui banco local e preferências do TITAN.
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

              if (file) {
                void importData(file)
              }

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

      <NavigationCard
        icon={<Moon size={23} aria-hidden="true" />}
        label="Sono e recuperação"
        path="/health/sleep"
      />

      <NavigationCard
        icon={<Stethoscope size={23} aria-hidden="true" />}
        label="Saúde"
        path="/health"
      />

      <NavigationCard
        icon={<BarChart3 size={23} aria-hidden="true" />}
        label="Relatórios"
        path="/reports"
      />

      <Card>
        <div className="flex gap-3">
          <ShieldCheck
            className="shrink-0 text-emerald-300"
            size={23}
            aria-hidden="true"
          />

          <div>
            <h2 className="font-bold">
              Privacidade local
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Os dados permanecem no aparelho e não são enviados
              automaticamente para servidores externos.
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

type NavigationCardProps = {
  icon: React.ReactNode
  label: string
  path: string
}

function NavigationCard({
  icon,
  label,
  path,
}: NavigationCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="text-blue-300">{icon}</span>

        <div className="flex-1">
          <h2 className="font-bold">{label}</h2>
        </div>

        <Link
          className="inline-flex min-h-11 items-center rounded-2xl bg-white/10 px-4 text-sm font-bold text-white"
          to={path}
        >
          Abrir
        </Link>
      </div>
    </Card>
  )
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/settings/pages/SettingsPage.tsx")
content = path.read_text()

content = content.replace(
    """import {
  BarChart3,""",
    """import type { ReactNode } from 'react'
import {
  BarChart3,""",
)

content = content.replace("React.ReactNode", "ReactNode")
path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/App.tsx")
content = path.read_text()

if "NotificationsPage" not in content:
    content = content.replace(
        "import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'",
        """import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { NotificationsPage } from '../modules/notifications/pages/NotificationsPage'""",
    )

if 'path="/notifications"' not in content:
    anchor = '          <Route path="/more" element={<SettingsPage />} />'
    content = content.replace(
        anchor,
        """          <Route
            path="/notifications"
            element={<NotificationsPage />}
          />
""" + anchor,
    )

path.write_text(content)
PY

cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/titan-app/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'icons/titan.svg',
        'icons/titan-maskable.svg',
      ],
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
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        globPatterns: [
          '**/*.{js,css,html,svg,png,webp,json}',
        ],
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'titan-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
})
EOF

cat > docs/features/NOTIFICATIONS_OFFLINE_BACKUP_PREMIUM.md <<'EOF'
# Notificações, Offline e Backup Premium

## Incluído

- Preferências de lembretes.
- Refeições, hidratação, treino, cardio e sono.
- Teste de notificação PWA.
- Backup completo do IndexedDB.
- Backup das preferências locais.
- Restauração validada.
- Cache offline aprimorado.
- Atualização controlada do Service Worker.

## Limitação

Navegadores não garantem agendamento persistente de notificações sem serviço externo de push.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Notificações, Offline e Backup Premium

### Added

- Central de notificações.
- Preferências de lembretes.
- Backup versão 2.
- Exportação de preferências locais.
- Cache offline aprimorado.
EOF

echo "🧪 Validando..."
npm run validate

echo
echo "✅ Notificações + Offline + Backup Premium aplicados."
echo "Backup: $BACKUP_DIR"
echo
echo 'Execute:'
echo 'git add .'
echo 'git commit -m "feat: deliver notifications offline and backup premium"'
echo 'git push'
