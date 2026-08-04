import { Button } from './Button'

type ConfirmDialogProps = { open: boolean; title: string; description: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmar', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  return <div className="fixed inset-0 z-[70] grid place-items-end bg-black/70 p-4 backdrop-blur-sm sm:place-items-center" onMouseDown={(event) => { if (event.currentTarget === event.target) onCancel() }} role="presentation"><div aria-describedby="confirm-description" aria-labelledby="confirm-title" aria-modal="true" className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#172033] p-5 shadow-2xl" onKeyDown={(event) => { if (event.key === 'Escape') onCancel() }} role="dialog"><h2 className="text-xl font-black" id="confirm-title">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-300" id="confirm-description">{description}</p><div className="mt-5 grid grid-cols-2 gap-3"><Button autoFocus onClick={onCancel} variant="ghost">Cancelar</Button><Button onClick={onConfirm}>{confirmLabel}</Button></div></div></div>
}
