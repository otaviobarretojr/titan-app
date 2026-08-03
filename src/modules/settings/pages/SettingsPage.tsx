import {
  Bell,
  DatabaseBackup,
  Download,
  FileUp,
  Info,
  Moon,
  ShieldCheck,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../../../shared/ui'
import {
  downloadBackup,
  restoreBackup,
} from '../../../services/backup/backupService'
import {
  getNotificationPermission,
  remindersEnabled,
  requestNotificationPermission,
  setRemindersEnabled,
  showTitanNotification,
} from '../../../services/notifications/notificationService'

export function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [notificationsActive, setNotificationsActive] = useState(
    remindersEnabled(),
  )

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
