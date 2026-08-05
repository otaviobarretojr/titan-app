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
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../../../shared/ui'
import {
  downloadBackup,
  restoreBackup,
  readBackup,
} from '../../../services/backup/backupService'
import { titanDatabase, type ImportHistoryRecord } from '../../../database/titanDatabase'
import { formatBytes, getStorageDiagnostics, type StorageDiagnostics } from '../../../services/storage/storageDiagnostics'
import { applyThemeMode, loadThemePreference, saveThemePreference, type ThemeMode } from '../../../services/preferences/appPreferences'
import { importTitanModule, previewTitanImport, readTitanFile, recordFailedTitanImport, type TitanImportKind, type TitanPreview } from '../../../services/import/titanImportService'
import { APP_VERSION, BUILD_DATE, GIT_COMMIT, RELEASE_CHANNEL, getDatabaseVersion, getServiceWorkerStatus } from '../../../services/appMetadata'

export function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('system')
  const [preview, setPreview] = useState<TitanPreview | null>(null)
  const [pendingImport, setPendingImport] = useState<{ kind: TitanImportKind; payload: Awaited<ReturnType<typeof readTitanFile>> } | null>(null)
  const [history, setHistory] = useState<ImportHistoryRecord[]>([])
  const [compact, setCompact] = useState(() => localStorage.getItem('titan-compact') === 'true')
  const [diagnostics, setDiagnostics] = useState<StorageDiagnostics | null>(null)

  useEffect(() => { void loadThemePreference().then((mode) => { setTheme(mode); applyThemeMode(mode) }); const sync = () => applyThemeMode(theme); window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', sync); return () => window.matchMedia?.('(prefers-color-scheme: dark)').removeEventListener?.('change', sync) }, [theme])
  useEffect(() => { void titanDatabase.importHistory.orderBy('importedAt').reverse().toArray().then(setHistory) }, [message])

  function changeTheme(value: ThemeMode) {
    setTheme(value)
    void saveThemePreference(value)
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

  async function prepareTitanImport(file: File, kind: TitanImportKind) {
    try {
      setMessage(null)
      const payload = await readTitanFile(file, kind)
      setPendingImport({ kind, payload })
      setPreview(previewTitanImport(payload))
    } catch (reason) {
      await recordFailedTitanImport(kind)
      setMessage(reason instanceof Error ? `${reason.name === 'Error' ? 'Arquivo incompatível' : 'Arquivo incompatível'} — ${reason.message}` : 'Arquivo incompatível — O arquivo não contém um JSON TITAN válido.')
    }
  }

  async function confirmTitanImport() {
    if (!pendingImport) return
    try {
      setIsBusy(true)
      await importTitanModule(pendingImport.payload, pendingImport.kind)
      setMessage('Importação TITAN concluída com sucesso.')
      setPreview(null)
      setPendingImport(null)
    } catch {
      setMessage('A importação falhou sem alterar seus dados.')
    } finally { setIsBusy(false) }
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

      <Card elevated>
        <div className="flex gap-3"><Palette className="text-blue-300"/><div><h2 className="font-bold">Tema</h2><p className="mt-1 text-sm text-slate-400">Use sistema, claro ou escuro; a escolha é persistida em appPreferences.</p></div></div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant={theme === 'system' ? 'primary' : 'ghost'} onClick={() => changeTheme('system')}>Sistema</Button>
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

      <Card elevated>
        <h2 className="text-lg font-bold">Central de importação TITAN</h2>
        <p className="mt-1 text-sm text-slate-400">Cada ação abre um importador específico e aceita apenas o tipo interno correspondente.</p>
        <div className="mt-4 grid gap-2">
          {[
            ['profile', '.titanprofile', 'Projeto TITAN'], ['workout', '.titanworkout', 'Treino'], ['nutrition', '.titannutrition', 'Nutrição'], ['cardio', '.titancardio', 'Cardio'], ['supplements', '.titansupplements', 'Suplementação'], ['project', '.titanproject', 'Projeto completo'],
          ].map(([kind, ext, label]) => <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-2xl bg-white/10 px-4 text-sm font-bold" key={kind}>{label}<input className="hidden" accept={ext} type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void prepareTitanImport(file, kind as TitanImportKind); event.target.value = '' }} /></label>)}
        </div>
        <h3 className="mt-5 font-bold">Histórico de importação</h3>
        <div className="mt-2 space-y-2 text-sm text-slate-300">{history.length === 0 ? <p>Nenhuma importação registrada.</p> : history.map((item) => <p className="rounded-2xl bg-white/5 p-3" key={item.id}>{new Date(item.importedAt).toLocaleString('pt-BR')} · {item.fileType} · {item.title} · {item.author} · {item.result}</p>)}</div>
      </Card>

      {preview ? <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4"><div className="max-w-md rounded-3xl bg-slate-900 p-5" role="dialog" aria-modal="true"><h2 className="text-xl font-black">Confirmar importação: {preview.title}</h2><p className="mt-2 text-sm text-slate-300">Autor: {preview.author}. Data: {new Date(preview.createdAt).toLocaleString('pt-BR')}.</p><p className="mt-3 text-sm">Módulos incluídos: {preview.modules.join(', ') || 'nenhum'}.</p><p className="text-sm">Atualizados: {preview.updated.join(', ') || 'nenhum'}.</p><p className="text-sm">Preservados: {preview.preserved.join(', ')}.</p><p className="mt-3 rounded-2xl bg-amber-400/10 p-3 text-sm text-amber-100">O histórico de importação será preservado.</p><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="ghost" onClick={() => { setPreview(null); setPendingImport(null) }}>Cancelar</Button><Button disabled={isBusy} onClick={() => void confirmTitanImport()}>Confirmar importação</Button></div></div></div> : null}


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
