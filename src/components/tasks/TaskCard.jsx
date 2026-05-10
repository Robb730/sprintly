import { Avatar, PRIORITY_META, formatDate, isOverdue, getAvatarColor, getInitials } from '../data/projectData.jsx'
import I from '../shared/Icons'

export default function TaskCard({ task, members, onClick }) {
  const pri = PRIORITY_META[task.priority]
  const assignee = members.find(m => m.id === task.assigned_to)
  const due = task.due_date
  const overdue = isOverdue(due) && task.status !== 'done'

  return (
    <div
      onClick={() => onClick(task)}
      className="group rounded-xl p-3 cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded-md text-xs font-medium"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 10 }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-xs font-semibold leading-snug mb-2.5"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
        {task.title}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Priority dot */}
          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{ background: pri.bg, color: pri.text, fontSize: 10 }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pri.dot }} />
            {pri.label}
          </span>

          {/* Comment count */}
          {task.comments > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{I.message}</span>
              {task.comments}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Due date */}
          {due && (
            <span className="flex items-center gap-0.5 text-xs"
              style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontSize: 10 }}>
              {overdue && <span style={{ color: 'var(--danger)' }}>{I.warn}</span>}
              {I.calendar}
              {formatDate(due)}
            </span>
          )}

          {/* Assignee avatar */}
          {(() => {
  const assignedMembers = task.assignees?.length > 0
    ? members.filter(m => task.assignees.includes(m.id))
    : assignee ? [assignee] : []
  
  const visible = assignedMembers.slice(0, 3)
  const overflow = assignedMembers.length - visible.length

  return assignedMembers.length > 0 ? (
    <div className="flex items-center" style={{ gap: 2 }}>
      {visible.map(m => (
        <div
          key={m.id}
          className="w-5 h-5 rounded-md flex items-center justify-center text-white font-semibold"
          style={{ background: getAvatarColor(m.name), fontSize: 8, border: '1.5px solid var(--bg-card)' }}
          title={m.name}
        >
          {getInitials(m.name)}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center font-semibold"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 8, border: '1.5px solid var(--border)' }}
        >
          +{overflow}
        </div>
      )}
    </div>
  ) : (
    <div className="w-5 h-5 rounded-md border border-dashed flex items-center justify-center"
      style={{ borderColor: 'var(--border)' }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
        <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
      </svg>
    </div>
  )
})()}
        </div>
      </div>
    </div>
  )
}