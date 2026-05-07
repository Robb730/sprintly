export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const base = `inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 cursor-pointer select-none`

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }

  const variants = {
    primary: `text-white hover:scale-[1.02] active:scale-[0.98]`,
    secondary: `hover:scale-[1.02] active:scale-[0.98]`,
    ghost: `hover:scale-[1.02] active:scale-[0.98]`,
    danger: `text-white hover:scale-[1.02] active:scale-[0.98]`,
  }

  const variantStyles = {
    primary: {
      background: 'var(--accent)',
      boxShadow: '0 2px 12px rgba(37,99,235,0.3)',
    },
    secondary: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      color: 'var(--text-primary)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    },
    danger: {
      background: 'var(--danger)',
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={variantStyles[variant]}
      {...props}
    >
      {loading && (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      )}
      {children}
    </button>
  )
}