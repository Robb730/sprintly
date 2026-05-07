export default function Toast({ type, message, onClose }) {
  const isError = type === 'error'
  const isSuccess = type === 'success'

  

  const config = isError
  ? {
      bg: 'rgba(220, 38, 38, 0.08)',
      border: 'rgba(220, 38, 38, 0.25)',
      color: 'var(--danger)',
      title: 'Error',
    }
  : isSuccess
  ? {
      bg: 'rgba(22, 163, 74, 0.08)',
      border: 'rgba(22, 163, 74, 0.25)',
      color: 'var(--success)',
      title: 'Success',
    }
  : {
      bg: 'rgba(37, 99, 235, 0.08)',
      border: 'rgba(37, 99, 235, 0.25)',
      color: 'var(--accent)',
      title: 'Info',
    }

  return (
    <div
      className="fixed z-50 flex items-start gap-3 animate-toast-in"
      style={{
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: '260px',
        maxWidth: '340px',
        padding: '12px 14px',
        borderRadius: '12px',
        border: `1px solid ${config.border}`,
        background: config.bg,
        color: config.color,
        fontSize: '13px',
      }}
    >
      {/* Icon */}
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        {isError && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        )}
        {isSuccess && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        )}
        {!isError && !isSuccess && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        )}
      </span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>{config.title}</p>
        <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.75 }}>{message}</p>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        style={{ color: 'inherit', opacity: 0.45, flexShrink: 0, marginTop: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}