import { useState } from 'react'
import { PRIORITY_META, STATUS_COLUMNS, formatDate, isOverdue, getAvatarColor, getInitials } from '../data/projectData.jsx'
import I from '../shared/Icons'

const STATUS_MAP = Object.fromEntries(STATUS_COLUMNS.map(c => [c.id, c]))

export default function ListView({ tasks, members, onTaskClick, onAddTask, canAddTasks }) {
  const [sortBy, setSortBy]   = useState('status')
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch]   = useState('')

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const filtered = tasks
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av = a[sortBy] ?? '', bv = b[sortBy] ?? ''
      if (sortBy === 'due_date') { av = av || 'z'; bv = bv || 'z' }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

  const SortIcon = ({ col }) => (
    <span style={{ color: sortBy === col ? 'var(--accent)' : 'var(--text-muted)', opacity: sortBy === col ? 1 : 0.4 }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {sortBy === col && sortDir === 'desc'
          ? <polyline points="18 15 12 9 6 15" />
          : <polyline points="6 9 12 15 18 9" />}
      </svg>
    </span>
  )

  const Th = ({ col, label, className = '' }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-3 py-2.5 text-left text-xs font-semibold cursor-pointer select-none whitespace-nowrap ${className}`}
      style={{ color: sortBy === col ? 'var(--accent)' : 'var(--text-muted)', userSelect: 'none' }}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={col} />
      </div>
    </th>
  )

  // ── Shared subcomponents ─────────────────────────────────────────────────────

  const AssigneeCell = ({ task }) => {
    const assigneeIds = Array.isArray(task.assignees) && task.assignees.length > 0
      ? task.assignees
      : task.assigned_to ? [task.assigned_to] : []
    const assignees = assigneeIds.map(id => members.find(m => m.id === id)).filter(Boolean)

    if (!assignees.length) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Unassigned</span>

    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {assignees.slice(0, 3).map(a => (
            <div
              key={a.id}
              className="w-5 h-5 rounded-md flex items-center justify-center text-white font-semibold shrink-0"
              style={{ background: getAvatarColor(a.name), fontSize: 8, outline: '2px solid var(--bg-card)' }}
              title={a.name}
            >
              {getInitials(a.name)}
            </div>
          ))}
          {assignees.length > 3 && (
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center font-semibold shrink-0"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 8, outline: '2px solid var(--bg-card)' }}
            >
              +{assignees.length - 3}
            </div>
          )}
        </div>
        {assignees.length === 1 && (
          <span className="text-xs truncate max-w-[80px]" style={{ color: 'var(--text-secondary)' }}>
            {assignees[0].name.split(' ')[0]}
          </span>
        )}
      </div>
    )
  }

  const DueCell = ({ task }) => {
    const due     = task.due_date
    const overdue = isOverdue(due) && task.status !== 'done'
    if (!due) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
    return (
      <span
        className="text-xs font-medium whitespace-nowrap"
        style={{ color: overdue ? 'var(--color-danger, #ef4444)' : 'var(--text-secondary)' }}
      >
        {overdue && '⚠ '}{formatDate(due)}
      </span>
    )
  }

  const StatusBadge = ({ task }) => {
    const col = STATUS_MAP[task.status]
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ background: `${col?.color}18`, color: col?.color, fontSize: 10 }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col?.color }} />
        {col?.label}
      </span>
    )
  }

  const PriorityBadge = ({ task }) => {
    const pri = PRIORITY_META[task.priority]
    return (
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ background: pri.bg, color: pri.text, fontSize: 10 }}
      >
        {pri.label}
      </span>
    )
  }

  return (
    <>
      <style>{`
        /* ── Responsive breakpoint ── */
        @media (max-width: 640px) {
          .lv-table-wrap  { display: none !important; }
          .lv-cards-wrap  { display: flex !important; }
        }
        @media (min-width: 641px) {
          .lv-table-wrap  { display: block !important; }
          .lv-cards-wrap  { display: none !important; }
        }

        /* ── Card hover ── */
        .lv-card {
          transition: background 0.15s, box-shadow 0.15s;
        }
        .lv-card:active {
          background: var(--bg-primary) !important;
        }
      `}</style>

      <div className="flex flex-col h-full gap-4">

        {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-0" style={{ maxWidth: 320 }}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              {I.search}
            </span>
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </span>

          {canAddTasks && (
            <button
              onClick={() => onAddTask('todo')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80 shrink-0 ml-auto"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {I.plus} Add task
            </button>
          )}
        </div>

        {/* ── Desktop: table ───────────────────────────────────────────────────── */}
        <div
          className="lv-table-wrap rounded-2xl flex-1 overflow-y-auto"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <table className="w-full border-collapse" style={{ minWidth: 600 }}>
            <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <Th col="title"    label="Task"     className="w-[35%]" />
                <Th col="status"   label="Status"   className="w-[14%]" />
                <Th col="priority" label="Priority" className="w-[13%]" />
                <th className="px-3 py-2.5 text-left text-xs font-semibold w-[16%] whitespace-nowrap"
                  style={{ color: 'var(--text-muted)' }}>Assignee</th>
                <Th col="due_date" label="Due date" className="w-[14%]" />
                <th className="px-3 py-2.5 text-xs font-semibold w-[8%]"
                  style={{ color: 'var(--text-muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    {search ? 'No tasks match your search.' : 'No tasks yet.'}
                  </td>
                </tr>
              )}
              {filtered.map((task, i) => {
                const isLast = i === filtered.length - 1
                return (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Title */}
                    <td className="px-3 py-3">
                      <p className="text-xs font-semibold truncate max-w-[260px]"
                        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        {task.title}
                      </p>
                      {task.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {task.tags.map(t => (
                            <span key={t} className="px-1 py-0.5 rounded text-xs"
                              style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 9 }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3"><StatusBadge task={task} /></td>

                    {/* Priority */}
                    <td className="px-3 py-3"><PriorityBadge task={task} /></td>

                    {/* Assignee */}
                    <td className="px-3 py-3"><AssigneeCell task={task} /></td>

                    {/* Due date — dedicated column, never truncated */}
                    <td className="px-3 py-3"><DueCell task={task} /></td>

                    {/* Actions */}
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => onTaskClick(task)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
                          style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}
                          title="View task"
                        >
                          {I.edit}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── Mobile: card list ────────────────────────────────────────────────── */}
        <div
          className="lv-cards-wrap flex-col gap-2 flex-1 overflow-y-auto"
          style={{ display: 'none' }}   /* overridden by CSS above on mobile */
        >
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2"
              style={{ color: 'var(--text-muted)' }}>
              <p className="text-xs">{search ? 'No tasks match your search.' : 'No tasks yet.'}</p>
            </div>
          )}

          {filtered.map(task => (
            <div
              key={task.id}
              className="lv-card rounded-2xl p-3 cursor-pointer"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              onClick={() => onTaskClick(task)}
            >
              {/* Row 1: title + edit button */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-snug"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {task.title}
                  </p>
                  {task.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {task.tags.map(t => (
                        <span key={t} className="px-1 py-0.5 rounded"
                          style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 9 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onTaskClick(task) }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}
                >
                  {I.edit}
                </button>
              </div>

              {/* Row 2: status + priority badges */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <StatusBadge task={task} />
                <PriorityBadge task={task} />
              </div>

              {/* Row 3: assignee + due date */}
              <div className="flex items-center justify-between gap-2">
                <AssigneeCell task={task} />
                <div className="flex items-center gap-1 shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <DueCell task={task} />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  )
}