export default function Skeleton({ className = '', width, height, rounded = 'md' }) {
  const radius = { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)', full: 'var(--radius-full)' }[rounded] || 'var(--radius-md)'
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
        borderRadius: radius,
        background: 'var(--bg-primary)',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <Skeleton width="32px" height="32px" rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton height="12px" width="60%" />
          <Skeleton height="10px" width="40%" />
        </div>
      </div>
      <Skeleton height="8px" />
      <Skeleton height="8px" width="80%" />
    </div>
  )
}