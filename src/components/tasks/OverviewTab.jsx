import { Avatar, PRIORITY_META, STATUS_COLUMNS, getAvatarColor, getInitials } from '../data/projectData.jsx'

function ProgressBar({ value, color, height = 6 }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height, background: 'var(--bg-primary)' }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

function StatBlock({ label, value, sub, color }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <p className="text-2xl font-bold mb-0.5" style={{ color: color || 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

export default function OverviewTab({ project, tasks, members }) {
  const total      = tasks.length
  const done       = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const overdue    = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
  const progress   = total ? Math.round((done / total) * 100) : 0

  // Per-member stats
  const memberStats = members.map(m => {
    const assigned = tasks.filter(t => t.assigned_to === m.id)
    const mDone    = assigned.filter(t => t.status === 'done').length
    const mPct     = assigned.length ? Math.round((mDone / assigned.length) * 100) : 0
    return { ...m, assigned: assigned.length, done: mDone, pct: mPct }
  })

  // Per-status breakdown
  const statusBreakdown = STATUS_COLUMNS.map(col => ({
    ...col,
    count: tasks.filter(t => t.status === col.id).length,
    pct: total ? Math.round((tasks.filter(t => t.status === col.id).length / total) * 100) : 0,
  }))

  // Per-priority breakdown
  const priorityBreakdown = Object.entries(PRIORITY_META).map(([key, meta]) => ({
    key, ...meta,
    count: tasks.filter(t => t.priority === key).length,
  }))

  // Milestone progress
  const milestones = project.milestones || []
  const milestoneStatusColor = { done: '#22c55e', in_progress: '#3b82f6', upcoming: 'var(--text-muted)' }

  return (
    <div className="space-y-6 pb-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="Total Tasks"   value={total}      color="var(--text-primary)" />
        <StatBlock label="Completed"     value={done}       color="#22c55e" sub={`${progress}% done`} />
        <StatBlock label="In Progress"   value={inProgress} color="#3b82f6" />
        <StatBlock label="Overdue"       value={overdue}    color={overdue > 0 ? '#ef4444' : 'var(--text-muted)'} />
      </div>

      {/* Overall progress */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Overall Progress
          </h4>
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{progress}%</span>
        </div>
        <ProgressBar value={progress} color="var(--accent)" height={8} />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{done} of {total} tasks completed</span>
          {project.due_date && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Due {new Date(project.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h4 className="text-sm font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            By Status
          </h4>
          <div className="space-y-3">
            {statusBreakdown.map(col => (
              <div key={col.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{col.label}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{col.count} <span style={{ opacity: 0.5 }}>/ {total}</span></span>
                </div>
                <ProgressBar value={col.pct} color={col.color} height={5} />
              </div>
            ))}
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h4 className="text-sm font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            By Priority
          </h4>
          <div className="space-y-3">
            {priorityBreakdown.map(p => (
              <div key={p.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: p.bg, color: p.text, fontSize: 10 }}>
                    {p.label}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.count} tasks · {total ? Math.round((p.count / total) * 100) : 0}%
                  </span>
                </div>
                <ProgressBar value={total ? (p.count / total) * 100 : 0} color={p.dot} height={5} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member stats */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h4 className="text-sm font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Team Progress
        </h4>
        <div className="space-y-4">
          {memberStats.map(m => (
            <div key={m.id} className="flex items-center gap-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold shrink-0"
                style={{ background: getAvatarColor(m.name), fontSize: 10 }}>
                {getInitials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                  <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                    {m.done}/{m.assigned} · {m.pct}%
                  </span>
                </div>
                <ProgressBar value={m.pct} color={getAvatarColor(m.name)} height={5} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h4 className="text-sm font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Milestones
          </h4>
          <div className="space-y-3">
            {milestones.map((ms, i) => {
              const color = milestoneStatusColor[ms.status] || 'var(--text-muted)'
              const isDone = ms.status === 'done'
              return (
                <div key={ms.id} className="flex items-center gap-3">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: color, background: isDone ? color : 'transparent' }}>
                      {isDone && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    {i < milestones.length - 1 && (
                      <div className="w-0.5 h-4 mt-1" style={{ background: 'var(--border)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{ms.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize ml-2 shrink-0"
                        style={{ background: `${color}18`, color }}>
                        {ms.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Due {new Date(ms.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}