#!/usr/bin/env bash
set -euo pipefail

echo "🚀 TITAN — Sprint 011: Sono + Lembretes Locais"

mkdir -p \
  docs/sprints \
  src/modules/health/data \
  src/modules/health/hooks \
  src/modules/health/pages \
  src/services/notifications

cat > src/modules/health/data/sleepRepository.ts <<'EOF'
import { getTitanLocalDate } from '../../../database/date'
import {
  titanDatabase,
  type SleepEntryRecord,
} from '../../../database/titanDatabase'
import { TITAN_USER_ID } from '../../../database/seeds/seedToday'

export async function getTodaySleep() {
  const localDate = getTitanLocalDate()

  return titanDatabase.sleepEntries
    .where('[userId+localDate]')
    .equals([TITAN_USER_ID, localDate])
    .first()
}

export async function saveTodaySleep(durationMinutes: number) {
  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0 ||
    durationMinutes > 24 * 60
  ) {
    throw new Error('Duração de sono inválida.')
  }

  const localDate = getTitanLocalDate()
  const now = new Date().toISOString()
  const existing = await getTodaySleep()

  const record: SleepEntryRecord = {
    id: existing?.id ?? `sleep-${crypto.randomUUID()}`,
    userId: TITAN_USER_ID,
    localDate,
    durationMinutes: Math.round(durationMinutes),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await titanDatabase.sleepEntries.put(record)
}

export async function clearTodaySleep() {
  const existing = await getTodaySleep()

  if (existing) {
    await titanDatabase.sleepEntries.delete(existing.id)
  }
}
EOF

cat > src/modules/health/hooks/useSleep.ts <<'EOF'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  clearTodaySleep,
  getTodaySleep,
  saveTodaySleep,
} from '../data/sleepRepository'

export function useSleep() {
  const [error, setError] = useState<string | null>(null)

  const sleep = useLiveQuery(() => getTodaySleep(), [], undefined)

  async function runAction(action: () => Promise<void>) {
    try {
      setError(null)
      await action()
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar o sono.',
      )
    }
  }

  return {
    sleep,
    error,
    isLoading: sleep === undefined,
    saveSleep: (durationMinutes: number) =>
      runAction(() => saveTodaySleep(durationMinutes)),
    clearSleep: () => runAction(clearTodaySleep),
  }
}
EOF

cat > src/modules/health/pages/SleepPage.tsx <<'EOF'
import { Moon, RotateCcw, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import { useSleep } from '../hooks/useSleep'

export function SleepPage() {
  const { sleep, error, isLoading, saveSleep, clearSleep } = useSleep()
  const [hours, setHours] = useState(7)
  const [minutes, setMinutes] = useState(30)

  useEffect(() => {
    if (!sleep) return
    setHours(Math.floor(sleep.durationMinutes / 60))
    setMinutes(sleep.durationMinutes % 60)
  }, [sleep])

  if (error) {
    return (
      <Card className="border-red-500/20">
        <h1 className="text-xl font-bold">Erro no registro de sono</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">
          Carregando sono...
        </p>
      </div>
    )
  }

  const durationMinutes = hours * 60 + minutes

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-indigo-300">
          TITAN RECUPERAÇÃO
        </p>
        <h1 className="mt-2 text-3xl font-black">Sono</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Registre a duração real do sono para alimentar o Coach e o Score TITAN.
        </p>
      </header>

      <Card elevated>
        <div className="flex items-center gap-3 text-indigo-300">
          <Moon size={24} aria-hidden="true" />
          <h2 className="text-lg font-bold">Sono de hoje</h2>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <NumberField
            label="Horas"
            value={hours}
            min={0}
            max={23}
            onChange={setHours}
          />
          <NumberField
            label="Minutos"
            value={minutes}
            min={0}
            max={59}
            onChange={setMinutes}
          />
        </div>

        <p className="mt-4 text-center text-3xl font-black">
          {hours}h{minutes.toString().padStart(2, '0')}
        </p>

        <Button
          className="mt-5"
          fullWidth
          onClick={() => saveSleep(durationMinutes)}
        >
          <Save size={18} aria-hidden="true" />
          Salvar sono
        </Button>

        {sleep ? (
          <Button
            className="mt-3"
            fullWidth
            onClick={clearSleep}
            variant="ghost"
          >
            <RotateCcw size={18} aria-hidden="true" />
            Limpar registro
          </Button>
        ) : null}
      </Card>
    </div>
  )
}

type NumberFieldProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: NumberFieldProps) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold text-slate-500">
        {label}
      </span>
      <input
        className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-center text-xl font-black text-white outline-none focus:border-indigo-400"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
  )
}
EOF

cat > src/services/notifications/notificationService.ts <<'EOF'
const REMINDER_STORAGE_KEY = 'titan-reminders-enabled'

export function notificationsSupported() {
  return 'Notification' in window
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

export function remindersEnabled() {
  return localStorage.getItem(REMINDER_STORAGE_KEY) === 'true'
}

export function setRemindersEnabled(enabled: boolean) {
  localStorage.setItem(REMINDER_STORAGE_KEY, String(enabled))
}

export async function showTitanNotification(input: {
  title: string
  body: string
  tag?: string
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
  })
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/App.tsx")
content = path.read_text()

if "SleepPage" not in content:
    content = content.replace(
        "import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'",
        """import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { SleepPage } from '../modules/health/pages/SleepPage'""",
    )

if 'path="/health/sleep"' not in content:
    anchor = '          <Route path="/more" element={<SettingsPage />} />'
    content = content.replace(
        anchor,
        """          <Route path="/health/sleep" element={<SleepPage />} />
""" + anchor,
    )

path.write_text(content)
PY

python3 - <<'PY'
from pathlib import Path

path = Path("src/modules/settings/pages/SettingsPage.tsx")
content = path.read_text()

content = content.replace(
    """  DatabaseBackup,
  Download,
  FileUp,
  Info,
  ShieldCheck,""",
    """  Bell,
  DatabaseBackup,
  Download,
  FileUp,
  Info,
  Moon,
  ShieldCheck,""",
)

if "from 'react-router-dom'" not in content:
    content = content.replace(
        "import { useRef, useState } from 'react'",
        """import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'""",
    )

if "notificationService" not in content:
    content = content.replace(
        "import {\n  downloadBackup,\n  restoreBackup,\n} from '../../../services/backup/backupService'",
        """import {
  downloadBackup,
  restoreBackup,
} from '../../../services/backup/backupService'
import {
  getNotificationPermission,
  remindersEnabled,
  requestNotificationPermission,
  setRemindersEnabled,
  showTitanNotification,
} from '../../../services/notifications/notificationService'""",
    )

content = content.replace(
    "  const [isBusy, setIsBusy] = useState(false)",
    """  const [isBusy, setIsBusy] = useState(false)
  const [notificationsActive, setNotificationsActive] = useState(
    remindersEnabled(),
  )""",
)

insert = """
      <Card>
        <div className="flex gap-3">
          <Moon
            className="shrink-0 text-indigo-300"
            size={23}
            aria-hidden="true"
          />
          <div className="flex-1">
            <h2 className="font-bold">Sono e recuperação</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Registre o sono diário para alimentar o Coach e o Score TITAN.
            </p>

            <Link
              className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-white/10 px-4 text-sm font-bold text-white"
              to="/health/sleep"
            >
              Abrir sono
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex gap-3">
          <Bell
            className="shrink-0 text-amber-300"
            size={23}
            aria-hidden="true"
          />
          <div className="flex-1">
            <h2 className="font-bold">Lembretes locais</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Ative permissões e teste notificações do PWA neste aparelho.
            </p>

            <div className="mt-4 space-y-3">
              <Button
                fullWidth
                onClick={async () => {
                  try {
                    const permission =
                      await requestNotificationPermission()

                    const enabled = permission === 'granted'
                    setRemindersEnabled(enabled)
                    setNotificationsActive(enabled)

                    setMessage(
                      enabled
                        ? 'Notificações ativadas.'
                        : 'Permissão de notificação não concedida.',
                    )
                  } catch (reason) {
                    setMessage(
                      reason instanceof Error
                        ? reason.message
                        : 'Não foi possível ativar notificações.',
                    )
                  }
                }}
                variant="ghost"
              >
                {notificationsActive
                  ? 'Notificações ativadas'
                  : 'Ativar notificações'}
              </Button>

              <Button
                disabled={
                  getNotificationPermission() !== 'granted'
                }
                fullWidth
                onClick={async () => {
                  try {
                    await showTitanNotification({
                      title: 'TITAN',
                      body: 'Notificações funcionando neste aparelho.',
                      tag: 'titan-test',
                    })
                  } catch (reason) {
                    setMessage(
                      reason instanceof Error
                        ? reason.message
                        : 'Não foi possível enviar a notificação.',
                    )
                  }
                }}
                variant="ghost"
              >
                Testar notificação
              </Button>
            </div>
          </div>
        </div>
      </Card>
"""

anchor = """      <Card>
        <div className="flex gap-3">
          <ShieldCheck"""

if "Sono e recuperação" not in content:
    content = content.replace(anchor, insert + "\n" + anchor)

path.write_text(content)
PY

cat > docs/sprints/SPRINT-011.md <<'EOF'
# Sprint 011 — Sono e Lembretes Locais

## Entregas

- Registro diário de sono.
- Atualização reativa do Dashboard e Score.
- Solicitação de permissão de notificação.
- Teste de notificação via Service Worker.
- Configuração local de lembretes.
- Acesso ao sono pela página Mais.

## Observação

Navegadores e PWAs não garantem agendamento persistente sem push externo.
Nesta etapa, o TITAN prepara permissões e notificações locais compatíveis.
EOF

cat >> docs/CHANGELOG.md <<'EOF'

## Sprint 011

### Added

- Registro de sono.
- Página de recuperação.
- Permissão e teste de notificações PWA.
- Configuração local de lembretes.
EOF

echo "🧪 Executando build..."
npm run build

echo "🧹 Executando lint..."
npm run lint

echo ""
echo "✅ Sprint 011 aplicada com sucesso."
echo 'Próximo comando: git add . && git commit -m "feat: add sleep tracking and local notifications" && git push'
