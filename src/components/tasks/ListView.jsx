import { useState } from 'react'
import { PRIORITY_META, STATUS_COLUMNS, formatDate, isOverdue, getAvatarColor, getInitials } from '../data/projectData.jsx'
import I from '../shared/Icons'

const STATUS_MAP = Object.fromEntries(STATUS_COLUMNS.map(c => [c.id, c]))

export default function ListView({ tasks, members, onTaskClick, onAddTask, canAddTasks }) {
  const [sortBy, setSortBy] = useState('status')
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch] = useState('')

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
          ? <polyline points="18 15 12 9 6 15"/>
          : <polyline points="6 9 12 15 18 9"/>}
      </svg>
    </span>
  )

  const Th = ({ col, label, className = '' }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-3 py-2.5 text-left text-xs font-semibold cursor-pointer select-none ${className}`}
      style={{ color: sortBy === col ? 'var(--accent)' : 'var(--text-muted)', userSelect: 'none' }}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={col} />
      </div>
    </th>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>{I.search}</span>
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
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </span>
        {canAddTasks && (
          <button
            onClick={() => onAddTask('todo')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {I.plus} Add task
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden flex-1 overflow-y-auto"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <table className="w-full border-collapse" style={{ minWidth: 640 }}>
          <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <Th col="title"    label="Task"     className="w-[35%]" />
              <Th col="status"   label="Status"   className="w-[14%]" />
              <Th col="priority" label="Priority" className="w-[12%]" />
              <th className="px-3 py-2.5 text-left text-xs font-semibold w-[16%]"
                style={{ color: 'var(--text-muted)' }}>Assignee</th>
              <Th col="due_date" label="Due"      className="w-[12%]" />
              <th className="px-3 py-2.5 text-xs font-semibold w-[11%]"
                style={{ color: 'var(--text-muted)' }}>Actions</th>
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
              const pri = PRIORITY_META[task.priority]
              const col = STATUS_MAP[task.status]
              const assignee = members.find(m => m.id === task.assigned_to)
              const due = task.due_date
              const overdue = isOverdue(due) && task.status !== 'done'
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
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium w-fit px-2 py-0.5 rounded-full"
                      style={{ background: `${col?.color}18`, color: col?.color, fontSize: 10 }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col?.color }} />
                      {col?.label}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: pri.bg, color: pri.text, fontSize: 10 }}>
                      {pri.label}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td className="px-3 py-3">
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-white font-semibold shrink-0"
                          style={{ background: getAvatarColor(assignee.name), fontSize: 8 }}>
                          {getInitials(assignee.name)}
                        </div>
                        <span className="text-xs truncate max-w-[90px]" style={{ color: 'var(--text-secondary)' }}>
                          {assignee.name.split(' ')[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                    )}
                  </td>

                  {/* Due */}
                  <td className="px-3 py-3">
                    {due ? (
                      <span className="flex items-center gap-1 text-xs"
                        style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontSize: 10 }}>
                        {overdue && I.warn}
                        {formatDate(due)}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 10 }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
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
    </div>
  )
}