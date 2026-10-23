import { useState } from 'react'

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = false, requireType }) {
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)

  const canConfirm = requireType ? typed === requireType : true

  const handleConfirm = async () => {
    if (!canConfirm) return
    setLoading(true)
    try {
      await onConfirm?.()
      onClose?.()
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden animate-slide-up sm:animate-fade-up sheet-card flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </div>
        <div className="px-5 py-4 space-y-3 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>
          {requireType && (
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Type <strong style={{ color: 'var(--text-primary)' }}>{requireType}</strong> to confirm
              </p>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>
          )}
        </div>
        <div className="px-5 pt-1 pb-safe sm:pb-5 grid grid-cols-2 gap-2 shrink-0">
          <button
            onClick={onClose}
            className="py-3 sm:py-2.5 rounded-xl text-xs font-medium"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="py-3 sm:py-2.5 rounded-xl text-xs font-semibold transition-opacity"
            style={{
              background: danger ? 'var(--danger)' : 'var(--accent)',
              color: '#fff',
              opacity: !canConfirm || loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}