import type { ReactNode } from 'react'
import {
  BarChart3,
  Bell,
  Brain,
  DatabaseBackup,
  Download,
  FileUp,
  Info,
  LineChart,
  Moon,
  ShieldCheck,
  Stethoscope,
  Palette,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../../../shared/ui'
import {
  downloadBackup,
  restoreBackup,
  readBackup,
} from '../../../services/backup/backupService'
import { titanDatabase } from '../../../database/titanDatabase'
import { formatBytes, getStorageDiagnostics, type StorageDiagnostics } from '../../../services/storage/storageDiagnostics'
import { APP_VERSION, BUILD_DATE, GIT_COMMIT, RELEASE_CHANNEL, getDatabaseVersion, getServiceWorkerStatus } from '../../../services/appMetadata'

export function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('titan-theme') ?? 'premium')
  const [compact, setCompact] = useState(() => localStorage.getItem('titan-compact') === 'true')
  const [diagnostics, setDiagnostics] = useState<StorageDiagnostics | null>(null)

  function changeTheme(value: string) {
    setTheme(value)
    localStorage.setItem('titan-theme', value)
    document.documentElement.dataset.theme = value
  }

  async function resetDatabase() {
    if (!window.confirm('Apagar todos os dados locais do TITAN? Esta ação não pode ser desfeita.')) return
    setIsBusy(true)
    await titanDatabase.delete()
    localStorage.removeItem('titan-compact')
    window.location.reload()
  }

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
    let summary
    try {
      summary = (await readBackup(file)).summary
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Backup inválido.')
      return
    }
    const confirmed = window.confirm(
      `Backup de ${new Date(summary.exportedAt).toLocaleString('pt-BR')}: ${summary.records} registros em ${summary.tables} tabelas (banco v${summary.databaseVersion}). A restauração substituirá todos os dados atuais. Continuar?`,
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
          Conta e configurações
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Perfil, planos, importações, aparência, atualizações, changelog, dados e informações técnicas.
        </p>
      </header>

      <Card elevated>
        <h2 className="text-lg font-black">PERFIL</h2><div className="mt-3 grid gap-2 text-sm text-slate-300"><Link to="/profile">Dados pessoais</Link><Link to="/profile">Rotina</Link><Link to="/profile">Objetivos</Link><Link to="/profile">Metas</Link></div>
      </Card>
      <Card elevated>
        <h2 className="text-lg font-black">PLANOS E IMPORTAÇÕES</h2><div className="mt-3 grid gap-2 text-sm text-slate-300"><span>Projeto TITAN</span><span>Treino</span><span>Nutrição</span><span>Cardio</span><span>Suplementação</span><span>Histórico de importações preservado em IndexedDB</span></div>
      </Card>
      <Card elevated>
        <h2 className="text-lg font-black">NOVIDADES</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300"><li>Perfil e configuração inicial.</li><li>Importação de Projeto TITAN.</li><li>Planos independentes.</li><li>Central de configurações.</li><li>Tema e informações da versão.</li></ul>
      </Card>

      <Card elevated>
        <div className="flex gap-3"><Palette className="text-blue-300"/><div><h2 className="font-bold">APARÊNCIA</h2><p className="mt-1 text-sm text-slate-400">Visual One UI com alto contraste e superfícies elevadas.</p></div></div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant={theme === 'premium' ? 'primary' : 'ghost'} onClick={() => changeTheme('premium')}>Sistema</Button>
          <Button variant={theme === 'light' ? 'primary' : 'ghost'} onClick={() => changeTheme('light')}>Claro</Button>
          <Button variant={theme === 'dark' ? 'primary' : 'ghost'} onClick={() => changeTheme('dark')}>Escuro</Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3"><SlidersHorizontal className="text-blue-300"/><div className="flex-1"><h2 className="font-bold">Preferências</h2><p className="text-sm text-slate-400">Exibição compacta de informações.</p></div><button aria-label="Alternar exibição compacta" className={`h-7 w-12 rounded-full p-1 transition-colors duration-200 ${compact ? 'bg-blue-600' : 'bg-white/10'}`} onClick={() => { const next = !compact; setCompact(next); localStorage.setItem('titan-compact', String(next)) }}><span className={`block h-5 w-5 rounded-full bg-white transition-transform duration-200 ${compact ? 'translate-x-5' : ''}`}/></button></div>
      </Card>

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

      <Card className="border-red-500/20">
        <div className="flex gap-3"><Trash2 className="text-red-300"/><div><h2 className="font-bold">Reset do banco</h2><p className="mt-1 text-sm text-slate-400">Remove definitivamente registros, planos e histórico deste aparelho.</p></div></div>
        <Button className="mt-4 bg-red-600 hover:bg-red-500" disabled={isBusy} fullWidth onClick={() => void resetDatabase()}>Apagar dados locais</Button>
      </Card>

      <Card>
        <h2 className="font-bold">Diagnóstico de armazenamento</h2>
        {diagnostics ? (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm" aria-live="polite">
            <div><dt className="text-slate-500">Utilizado</dt><dd>{formatBytes(diagnostics.usage)}</dd></div>
            <div><dt className="text-slate-500">Quota aproximada</dt><dd>{formatBytes(diagnostics.quota)}</dd></div>
            <div><dt className="text-slate-500">Persistente</dt><dd>{diagnostics.persisted === null ? 'Indisponível' : diagnostics.persisted ? 'Sim' : 'Não'}</dd></div>
            <div><dt className="text-slate-500">Registros / fotos</dt><dd>{diagnostics.records} / {diagnostics.photos}</dd></div>
          </dl>
        ) : <p className="mt-2 text-sm text-slate-400">Execute o diagnóstico para consultar este aparelho.</p>}
        <Button className="mt-4" fullWidth onClick={() => void getStorageDiagnostics().then(setDiagnostics).catch(() => setMessage('Diagnóstico indisponível neste navegador.'))}>Executar diagnóstico</Button>
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
        icon={<LineChart size={23} aria-hidden="true" />}
        label="Analytics"
        path="/analytics"
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
            <h2 className="font-bold">Sobre o TITAN</h2>

            <dl className="mt-3 grid gap-2 text-sm text-slate-300">
              <div><dt className="text-slate-500">Nome</dt><dd>TITAN</dd></div>
              <div><dt className="text-slate-500">Versão</dt><dd>{APP_VERSION}</dd></div>
              <div><dt className="text-slate-500">Canal</dt><dd>{RELEASE_CHANNEL}</dd></div>
              <div><dt className="text-slate-500">Banco Dexie</dt><dd>v{getDatabaseVersion()}</dd></div>
              <div><dt className="text-slate-500">Build</dt><dd>{BUILD_DATE}</dd></div>
              <div><dt className="text-slate-500">Commit/build id</dt><dd>{GIT_COMMIT}</dd></div>
              <div><dt className="text-slate-500">Service Worker</dt><dd>{getServiceWorkerStatus(false)}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd>Atualizado</dd></div>
            </dl>
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
