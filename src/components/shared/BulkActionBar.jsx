export default function BulkActionBar({ selectedCount, onClear, actions = [] }) {
  if (selectedCount === 0) return null
  return (
    <div
      className="fixed z-40 flex items-center justify-center gap-2 flex-wrap px-3 py-2 rounded-2xl shadow-lg animate-fade-up"
      style={{
        bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xl)',
        width: 'max-content',
        maxWidth: 'calc(100vw - 1.5rem)',
      }}
    >
      <span className="text-xs font-semibold px-2" style={{ color: 'var(--text-primary)' }}>
        {selectedCount} selected
      </span>
      <div className="w-px h-5" style={{ background: 'var(--border)' }} />
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={a.onClick}
          disabled={a.disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{
            background: a.danger ? 'rgba(220,38,38,0.08)' : 'var(--bg-primary)',
            color: a.danger ? 'var(--danger)' : 'var(--text-secondary)',
            border: '1px solid var(--border)',
            minHeight: 'var(--touch-min)',
          }}
        >
          {a.icon} {a.label}
        </button>
      ))}
      <button
        onClick={onClear}
        className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Clear selection"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}