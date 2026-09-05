type ConfirmDialogProps = {
  open: boolean
  title: string
  /** spelled-out consequence — say exactly what disappears, deletes here are permanent */
  message: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Neo-Y2K confirmation gate for destructive admin actions. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Удалить',
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-3xl border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]"
      >
        <h2 className="font-grotesk text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">{message}</p>
        <p className="mt-2 font-grotesk text-xs font-bold uppercase tracking-wide text-bubblegum-dark">
          Действие необратимо
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-pill border-2 border-black bg-white px-4 py-2 font-grotesk text-sm font-bold text-ink transition hover:bg-silver disabled:opacity-40"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-pill border-2 border-black bg-ink px-5 py-2 font-grotesk text-sm font-bold text-white shadow-[3px_3px_0_0_#E8799F] transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Удаляем...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
