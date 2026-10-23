import { Inbox, Folder, CheckCircle2, AlertTriangle, Search } from 'lucide-react'

const ICONS = { inbox: Inbox, folder: Folder, check: CheckCircle2, alert: AlertTriangle, search: Search }

export default function EmptyState({ icon = 'inbox', title, message, action, onAction, className = '' }) {
  const IconComp = ICONS[icon] || Inbox
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}
      >
        <IconComp size={24} strokeWidth={1.5} />
      </div>
      {title && (
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          {title}
        </p>
      )}
      {message && (
        <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {message}
        </p>
      )}
      {action && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {action}
        </button>
      )}
    </div>
  )
}