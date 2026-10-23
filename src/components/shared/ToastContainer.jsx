import { useState, useEffect, useRef } from 'react'
import { useToast } from '../../hooks/useToast'

const TYPE_META = {
  error: { color: '#ef4444', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  success: { color: '#22c55e', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0' },
  info: { color: '#3b82f6', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0' },
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToast()
  const [exiting, setExiting] = useState(new Set())
  const timers = useRef(new Map())

  const handleDismiss = (id) => {
    setExiting(prev => new Set(prev).add(id))
    const t = setTimeout(() => {
      dismiss(id)
      setExiting(prev => {
        const next = new Set(prev); next.delete(id); return next
      })
    }, 220)
    timers.current.set(id, t)
  }

  // Auto-dismiss
  useEffect(() => {
    toasts.forEach(t => {
      if (t.duration && t.duration !== 0 && !timers.current.has(`auto-${t.id}`)) {
        const timer = setTimeout(() => handleDismiss(t.id), t.duration)
        timers.current.set(`auto-${t.id}`, timer)
      }
    })
  }, [toasts])

  useEffect(() => {
    return () => { for (const t of timers.current.values()) clearTimeout(t) }
  }, [])

  return (
    <div
      className="fixed z-[100] flex flex-col gap-2 pointer-events-none"
      style={{
        top: 'max(1rem, env(safe-area-inset-top))',
        right: 'max(1rem, env(safe-area-inset-right))',
        width: 'min(340px, 92vw)',
      }}
    >
      {toasts.map(t => {
        const meta = TYPE_META[t.type] || TYPE_META.info
        const isExiting = exiting.has(t.id)
        return (
          <div
            key={t.id}
            className="pointer-events-auto"
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: 'var(--text-sm)',
              animation: isExiting ? 'toast-out 0.22s cubic-bezier(0.4,0,1,1) forwards' : 'toast-in 0.28s cubic-bezier(0.16,1,0.3,1) forwards',
            }}
          >
            <span className="shrink-0 flex items-center justify-center rounded-md"
              style={{ width: 24, height: 24, background: `${meta.color}18`, color: meta.color }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={meta.icon} />
              </svg>
            </span>
            <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.3 }}>{t.message}</span>
            <button onClick={() => handleDismiss(t.id)}
              className="shrink-0 flex items-center justify-center rounded-md transition-opacity hover:opacity-60"
              style={{ width: 20, height: 20, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              aria-label="Dismiss">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}