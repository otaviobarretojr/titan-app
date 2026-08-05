import type { buildPreview } from '../../../services/titanFile/titanFileService'

type Preview = ReturnType<typeof buildPreview>
export function TitanImportModal({ preview, onCancel, onConfirm }: { preview: Preview | null; onCancel: () => void; onConfirm: () => void }) {
  if (!preview) return null
  const { envelope } = preview
  return <div className="fixed inset-0 z-[90] bg-black/70 p-5"><div role="dialog" aria-modal="true" aria-labelledby="titan-import-title" className="mx-auto max-w-md rounded-3xl bg-slate-950 p-5 text-white">
    <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Prévia TITAN</p><h2 id="titan-import-title" className="mt-1 text-2xl font-black">{envelope.title}</h2>
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-400">Autor</dt><dd>{envelope.author}</dd></div><div><dt className="text-slate-400">Data</dt><dd>{new Date(envelope.createdAt).toLocaleString('pt-BR')}</dd></div><div><dt className="text-slate-400">Tipo</dt><dd>{envelope.type}</dd></div><div><dt className="text-slate-400">Histórico</dt><dd>Preservado</dd></div></dl>
    <List title="Módulos incluídos" items={preview.modulesIncluded} /><List title="Módulos alterados" items={preview.modulesChanged} /><List title="Módulos preservados" items={preview.modulesPreserved} />
    <div className="mt-5 flex gap-2"><button className="flex-1 rounded-2xl bg-white/10 p-3" onClick={onCancel}>Cancelar</button><button className="flex-1 rounded-2xl bg-blue-500 p-3 font-black" onClick={onConfirm}>Confirmar</button></div>
  </div></div>
}
function List({ title, items }: { title: string; items: string[] }) { return <section className="mt-4"><h3 className="text-sm font-bold text-slate-300">{title}</h3><p className="mt-1 text-sm text-slate-400">{items.length ? items.join(', ') : 'Nenhum'}</p></section> }
