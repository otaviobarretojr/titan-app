import type { ReactNode } from 'react'
import {
  BarChart3,
  Bell,
  Brain,
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
        icon={<Brain size={23} aria-hidden="true" />}
        label="Coach TITAN"
        path="/coach"
      />

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
  icon: ReactNode
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
