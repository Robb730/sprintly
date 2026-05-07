import { useNavigate } from 'react-router-dom'

const PRIORITY_COLORS = {
  high:   { bg: 'rgba(220,38,38,0.08)',   text: '#ef4444', dot: '#ef4444' },
  medium: { bg: 'rgba(245,158,11,0.08)',  text: '#f59e0b', dot: '#f59e0b' },
  low:    { bg: 'rgba(34,197,94,0.08)',   text: '#22c55e', dot: '#22c55e' },
}

const CARD_ACCENTS = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#06b6d4']

function getAccent(title = '') {
  return CARD_ACCENTS[title.charCodeAt(0) % CARD_ACCENTS.length]
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate()
  const {
    id,
    title = 'Untitled Project',
    description = '',
    progress = 0,
    task_count = 0,
    completed_tasks = 0,
    members = [],
    due_date,
    role = 'contributor',
    sprint_count = 0,
  } = project

  const accent = getAccent(title)
  const isOverdue = due_date && new Date(due_date) < new Date()
  const dueDateLabel = due_date
    ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(due_date))
    : null

  return (
    <div
      onClick={() => navigate(`/projects/${id}`)}
      className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Color accent bar */}
      <div className="h-1.5 w-full" style={{ background: accent }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-base truncate mb-0.5 group-hover:text-[var(--accent)] transition-colors"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              {title}
            </h3>
            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
              {description || 'No description provided.'}
            </p>
          </div>
          {/* Role badge */}
          <span
            className="ml-3 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize"
            style={{
              background: role === 'manager' ? 'rgba(37,99,235,0.1)' : 'var(--bg-primary)',
              color: role === 'manager' ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${role === 'manager' ? 'rgba(37,99,235,0.2)' : 'var(--border)'}`,
            }}
          >
            {role === 'manager' ? '👑 PM' : '✏️ Contributor'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Progress</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: accent }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {completed_tasks}/{task_count} tasks
          </span>
          {sprint_count > 0 && (
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {sprint_count} sprint{sprint_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Footer: members + due date */}
        <div className="flex items-center justify-between">
          {/* Member avatars */}
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                style={{
                  borderColor: 'var(--bg-card)',
                  background: `hsl(${(m.name?.charCodeAt(0) || i) * 47 % 360}, 60%, 50%)`,
                  zIndex: 10 - i,
                }}
                title={m.name}
              >
                {getInitials(m.name || '?')}
              </div>
            ))}
            {members.length > 4 && (
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold"
                style={{ borderColor: 'var(--bg-card)', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}
              >
                +{members.length - 4}
              </div>
            )}
          </div>

          {/* Due date */}
          {dueDateLabel && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: isOverdue ? 'rgba(220,38,38,0.08)' : 'var(--bg-primary)',
                color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
              }}
            >
              {isOverdue ? '⚠ ' : ''}{dueDateLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}