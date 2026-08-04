import { useEffect, useMemo, useState } from 'react'
import { clearCloudSession, getCloudConfig, getStoredSession, refreshSessionFromUrl, requestEmailLogin, type CloudSession } from '../../../services/cloudBackup/cloudAuthService'
import { createCloudBackup, deleteCloudBackup, downloadCloudBackup, listCloudBackups, type CloudBackupMetadata } from '../../../services/cloudBackup/cloudBackupService'
import { getDeviceIdentity, updateDeviceName } from '../../../services/cloudBackup/deviceIdentityService'
import { getLocalRecordCounts, replaceLocalDataFromBackup } from '../../../services/cloudBackup/backupRepository'
import { summarizeBackup, type TitanCloudBackup } from '../../../services/cloudBackup/backupSerializer'

export function AccountPage() {
  const config = getCloudConfig()
  const [session, setSession] = useState<CloudSession | null>(() => getStoredSession())
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('')
  const [backups, setBackups] = useState<CloudBackupMetadata[]>([])
  const [selected, setSelected] = useState<{ meta: CloudBackupMetadata; backup: TitanCloudBackup } | null>(null)
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({})
  const [deviceName, setDeviceName] = useState(() => getDeviceIdentity().name)
  const offline = typeof navigator !== 'undefined' && !navigator.onLine

  const status = useMemo(() => !config.configured ? 'não configurado' : session ? 'conectado' : 'desconectado', [config.configured, session])

  useEffect(() => { refreshSessionFromUrl().then((next) => { if (next) setSession(next) }).catch((error: Error) => setMessage(error.message)) }, [])
  useEffect(() => { if (!session || offline) return; listCloudBackups(session).then(setBackups).catch((error: Error) => setMessage(error.message)) }, [session, offline])

  async function signIn() { setBusy(true); setMessage(''); try { await requestEmailLogin(email); setMessage('Enviamos um link seguro para seu e-mail. O app local continua disponível sem login.') } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível entrar.') } finally { setBusy(false) } }
  async function runBackup() { if (!session || busy) return; setBusy(true); setMessage(''); try { const meta = await createCloudBackup(session, (next) => setStage(next === 'preparing' ? 'Preparando dados locais...' : next === 'uploading' ? 'Enviando backup...' : 'Salvando histórico...')); setBackups([meta, ...backups]); setMessage(`Backup criado com ${meta.recordCount} registros e ${formatBytes(meta.sizeBytes)}.`) } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível criar o backup.') } finally { setBusy(false); setStage('') } }
  async function prepareRestore(meta: CloudBackupMetadata) { if (!session || busy || offline) return; setBusy(true); setMessage(''); try { const backup = await downloadCloudBackup(session, meta); setSelected({ meta, backup }); setLocalCounts(await getLocalRecordCounts()) } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível validar o backup.') } finally { setBusy(false) } }
  async function confirmRestore() { if (!selected || busy) return; setBusy(true); try { await replaceLocalDataFromBackup(selected.backup); setMessage('Restauração concluída. Um snapshot local de segurança foi criado antes da substituição.'); setSelected(null) } catch (error) { setMessage(error instanceof Error ? error.message : 'A restauração foi interrompida sem alterar os dados.') } finally { setBusy(false) } }

  const selectedSummary = selected ? summarizeBackup(selected.backup) : null

  return <section className="space-y-5" aria-live="polite">
    <header><p className="text-xs font-bold uppercase tracking-widest text-blue-300">Conta opcional</p><h1 className="mt-2 text-3xl font-black">Backup em nuvem</h1><p className="mt-2 text-sm text-slate-300">Seus dados permanecem locais por padrão. Não há sincronização automática nesta Sprint; você escolhe quando enviar ou restaurar.</p></header>
    <div className="rounded-3xl border border-white/10 bg-white/6 p-4"><p className="text-sm text-slate-300">Status: <strong className="text-white">{offline ? 'offline' : status}</strong></p>{!config.configured ? <p className="mt-2 text-sm text-amber-200">Serviço de nuvem não configurado. Use o backup local em Mais.</p> : null}{offline ? <p className="mt-2 text-sm text-amber-200">Sem internet: backup e restauração em nuvem estão temporariamente indisponíveis.</p> : null}</div>
    <div className="rounded-3xl border border-white/10 bg-white/6 p-4"><label className="text-sm font-semibold" htmlFor="device">Nome deste dispositivo</label><input id="device" className="mt-2 w-full rounded-2xl bg-black/30 p-3" value={deviceName} onChange={(event) => { setDeviceName(event.target.value); updateDeviceName(event.target.value) }} /></div>
    {session ? <button className="w-full rounded-2xl bg-white/10 p-4 font-bold" onClick={() => { clearCloudSession(); setSession(null); setBackups([]) }}>Sair</button> : <div className="rounded-3xl border border-white/10 bg-white/6 p-4"><label className="text-sm font-semibold" htmlFor="email">Entrar por e-mail</label><input id="email" type="email" className="mt-2 w-full rounded-2xl bg-black/30 p-3" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" /><button disabled={!config.configured || offline || busy} className="mt-3 w-full rounded-2xl bg-blue-500 p-4 font-black disabled:opacity-50" onClick={signIn}>Enviar link de acesso</button></div>}
    <button disabled={!session || offline || busy} className="w-full rounded-3xl bg-emerald-500 p-5 text-lg font-black disabled:opacity-50" onClick={runBackup}>Criar backup agora</button>{stage ? <p className="text-sm text-blue-200">{stage}</p> : null}{message ? <p className="rounded-2xl bg-white/10 p-3 text-sm">{message}</p> : null}
    <div className="space-y-3"><h2 className="text-xl font-black">Histórico de backups</h2>{backups.length === 0 ? <p className="rounded-3xl border border-dashed border-white/15 p-4 text-sm text-slate-300">Nenhum backup em nuvem disponível.</p> : backups.map((item) => <article className="rounded-3xl border border-white/10 bg-white/6 p-4" key={item.id}><p className="font-bold">{new Date(item.createdAt).toLocaleString()}</p><p className="text-sm text-slate-300">{item.deviceName} · v{item.appVersion} · {formatBytes(item.sizeBytes)} · {item.recordCount} registros · {item.status}</p><div className="mt-3 flex gap-2"><button className="rounded-xl bg-white/10 px-3 py-2 text-sm" onClick={() => setMessage(`Checksum: ${item.checksum}`)}>Detalhes</button><button disabled={busy || offline} className="rounded-xl bg-blue-500 px-3 py-2 text-sm disabled:opacity-50" onClick={() => prepareRestore(item)}>Restaurar</button><button disabled={busy} className="rounded-xl bg-red-500/80 px-3 py-2 text-sm disabled:opacity-50" onClick={async () => { if (session && confirm('Excluir este backup da nuvem? Seus dados locais não serão apagados.')) { await deleteCloudBackup(session, item); setBackups(backups.filter((backup) => backup.id !== item.id)) } }}>Excluir</button></div></article>)}</div>
    {selected && selectedSummary ? <div className="fixed inset-0 z-[80] bg-black/70 p-5"><div className="mx-auto max-w-md rounded-3xl bg-slate-900 p-5"><h2 className="text-xl font-black">Confirmar substituição?</h2><p className="mt-2 text-sm text-slate-300">Backup de {new Date(selectedSummary.exportedAt).toLocaleString()} com {selectedSummary.records} registros. Dados locais atuais: {Object.values(localCounts).reduce((a, b) => a + b, 0)} registros. Esta ação substitui os dados locais após criar snapshot de segurança.</p><div className="mt-4 flex gap-2"><button className="flex-1 rounded-2xl bg-white/10 p-3" onClick={() => setSelected(null)}>Cancelar</button><button disabled={busy} className="flex-1 rounded-2xl bg-red-500 p-3 font-bold disabled:opacity-50" onClick={confirmRestore}>Substituir dados locais</button></div></div></div> : null}
  </section>
}
function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB` }
