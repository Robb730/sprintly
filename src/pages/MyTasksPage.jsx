import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'
import {
  CheckCircle2, Circle, Clock, AlertTriangle, Flag,
  FolderOpen, ChevronDown, Search, X, Loader2,
  ListTodo, BarChart2, CalendarClock, Inbox
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PRIORITY_META, STATUS_COLUMNS, formatDate, isOverdue } from '../components/data/projectData'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusIcon(status, size = 13) {
  switch (status) {
    case 'done':     return <CheckCircle2 size={size} style={{ color: '#22c55e' }} />
    case 'in_progress': return <Clock size={size} style={{ color: 'var(--accent)' }} />
    case 'review':   return <Clock size={size} style={{ color: '#f59e0b' }} />
    default:         return <Circle size={size} style={{ color: 'var(--text-muted)' }} />
  }
}

const STATUS_OPTIONS = [
  { id: 'all',         label: 'All Tasks' },
  { id: 'todo',        label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review',      label: 'In Review' },
  { id: 'done',        label: 'Done' },
  { id: 'overdue',     label: 'Overdue' },
]

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, bg }) {
  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: bg, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold leading-none" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

// ─── Status quick-change dropdown ─────────────────────────────────────────────
function StatusDropdown({ task, onStatusChange }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const statusMeta = STATUS_COLUMNS.find(s => s.id === task.status)

  const handleChange = async (newStatus) => {
    setOpen(false)
    if (newStatus === task.status) return
    setLoading(true)
    await onStatusChange(task.id, newStatus)
    setLoading(false)
  }

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        {loading
          ? <Loader2 size={11} className="animate-spin" />
          : getStatusIcon(task.status, 11)
        }
        <span>{statusMeta?.label ?? task.status}</span>
        <ChevronDown size={10} style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full mt-1 left-0 z-20 rounded-xl overflow-hidden py-1 min-w-[130px]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
          >
            {STATUS_COLUMNS.map(s => (
              <button
                key={s.id}
                onClick={() => handleChange(s.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors text-left"
                style={{
                  color: task.status === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                  background: task.status === s.id ? 'var(--accent-light)' : 'transparent',
                }}
                onMouseEnter={e => { if (task.status !== s.id) e.currentTarget.style.background = 'var(--bg-primary)' }}
                onMouseLeave={e => { if (task.status !== s.id) e.currentTarget.style.background = 'transparent' }}
              >
                {getStatusIcon(s.id, 11)}
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Task row ─────────────────────────────────────────────────────────────────
function TaskRow({ task, onStatusChange, onTaskClick, index }) {
  const pri     = PRIORITY_META[task.priority] ?? PRIORITY_META['medium']
  const overdue = isOverdue(task.due_date) && task.status !== 'done'

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        animationDelay: `${index * 40}ms`,
      }}
      onClick={() => onTaskClick(task)}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Priority dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: pri.dot }}
        title={`${pri.label} priority`}
      />

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold truncate"
          style={{
            color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {/* Project badge */}
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--text-muted)', fontSize: 10 }}
          >
            <FolderOpen size={9} />
            {task.project?.title ?? 'Unknown project'}
          </span>
          {/* Due date */}
          {task.due_date && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: overdue ? '#dc2626' : 'var(--text-muted)', fontSize: 10 }}
            >
              {overdue ? <AlertTriangle size={9} /> : <CalendarClock size={9} />}
              {overdue ? 'Overdue · ' : ''}{formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <span
        className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium shrink-0"
        style={{ background: pri.bg, color: pri.text, fontSize: 10 }}
      >
        <Flag size={9} />
        {pri.label}
      </span>

      {/* Status dropdown */}
      <div className="shrink-0" onClick={e => e.stopPropagation()}>
        <StatusDropdown task={task} onStatusChange={onStatusChange} />
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
  const msgs = {
    all:         { icon: <Inbox size={28} />, title: 'No tasks assigned to you', sub: 'Tasks assigned to you across all projects will appear here.' },
    todo:        { icon: <ListTodo size={28} />, title: 'No to-do tasks', sub: "You're all caught up on your to-do list." },
    in_progress: { icon: <Clock size={28} />, title: 'Nothing in progress', sub: "You don't have any tasks in progress right now." },
    review:      { icon: <Clock size={28} />, title: 'Nothing in review', sub: 'No tasks awaiting review.' },
    done:        { icon: <CheckCircle2 size={28} />, title: 'No completed tasks', sub: "Completed tasks will show up here." },
    overdue:     { icon: <AlertTriangle size={28} />, title: 'No overdue tasks', sub: "Great job — nothing is overdue!" },
  }
  const { icon, title, sub } = msgs[filter] ?? msgs.all

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div style={{ color: 'var(--text-muted)', opacity: 0.35 }}>{icon}</div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-xs text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  )
}

// ─── Task Detail Modal (inline, re-uses existing modal via dynamic import) ────
// We'll just navigate to project page for full detail; but open a lightweight
// read-only panel here for quick viewing.
function QuickTaskPanel({ task, onClose, onStatusChange }) {
  if (!task) return null
  const pri     = PRIORITY_META[task.priority] ?? PRIORITY_META['medium']
  const overdue = isOverdue(task.due_date) && task.status !== 'done'
  const statusMeta = STATUS_COLUMNS.find(s => s.id === task.status)
  const navigate = useNavigate()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Task Details
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ background: pri.bg, color: pri.text }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ background: pri.dot }} />
              {pri.label}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {statusMeta?.label ?? task.status}
            </span>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 10 }}>
              <FolderOpen size={10} /> {task.project?.title}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold leading-snug"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {task.title}
          </h3>

          {/* Description */}
          {task.description
            ? <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>
            : <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No description provided.</p>
          }

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-primary)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Due Date</p>
              {task.due_date ? (
                <span className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: overdue ? '#dc2626' : 'var(--text-primary)' }}>
                  {overdue && <AlertTriangle size={11} />}
                  {formatDate(task.due_date)}
                  {overdue && <span style={{ fontSize: 10 }}> · Overdue</span>}
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No due date</span>
              )}
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-primary)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
              <StatusDropdown task={task} onStatusChange={async (id, status) => { await onStatusChange(id, status); onClose() }} />
            </div>
          </div>

          {/* Go to project */}
          <button
            onClick={() => { onClose(); navigate(`/projects/${task.project_id}`) }}
            className="w-full py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid rgba(37,99,235,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-light)'}
          >
            Open in project →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MyTasksPage() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)

  const fetchTasks = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // AFTER
const { data, error } = await supabase
  .from('tasks')
  .select(`
    *,
    project:projects!tasks_project_id_fkey (id, title)
  `)
  .or(`assigned_to.eq.${user.id},assignees.cs.{"${user.id}"}`)
  .order('due_date', { ascending: true, nullsFirst: false })

    if (!error) setTasks(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    // Also update selected task if open
    setSelectedTask(prev => prev?.id === taskId ? { ...prev, status: newStatus } : prev)

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      console.error('Status update failed:', error)
      fetchTasks() // rollback
    }
  }

  // Derived stats
  const total      = tasks.length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const done       = tasks.filter(t => t.status === 'done').length
  const overdueCnt = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'done').length

  // Filtered tasks
  const filtered = tasks.filter(t => {
    if (statusFilter === 'overdue') return isOverdue(t.due_date) && t.status !== 'done'
    if (statusFilter !== 'all') return t.status === statusFilter
    return true
  }).filter(t => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.title?.toLowerCase().includes(q) ||
      t.project?.title?.toLowerCase().includes(q)
    )
  })

  // Group by project
  const grouped = filtered.reduce((acc, task) => {
  const key = task.project_id
  if (!acc[key]) acc[key] = { name: task.project?.title ?? 'Unknown', tasks: [] }
  acc[key].tasks.push(task)
  return acc
}, {})

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar title="My Tasks" onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">

            {/* Page title */}
            <div>
              <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                My Tasks
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                All tasks assigned to you across every project
              </p>
            </div>

            {/* Stats row */}
            {!loading && total > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total assigned"  value={total}      icon={<ListTodo size={16} />}      color="var(--accent)"  bg="var(--accent-light)" />
                <StatCard label="In progress"     value={inProgress} icon={<Clock size={16} />}         color="#f59e0b"        bg="rgba(245,158,11,0.12)" />
                <StatCard label="Completed"       value={done}       icon={<CheckCircle2 size={16} />}  color="#22c55e"        bg="rgba(34,197,94,0.12)" />
                <StatCard label="Overdue"         value={overdueCnt} icon={<AlertTriangle size={16} />} color={overdueCnt > 0 ? '#dc2626' : 'var(--text-muted)'} bg={overdueCnt > 0 ? 'rgba(220,38,38,0.1)' : 'var(--bg-primary)'} />
              </div>
            )}

            {/* Filters + search */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Status filter tabs */}
              <div className="flex items-center gap-1 flex-wrap flex-1">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setStatusFilter(opt.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: statusFilter === opt.id
                        ? (opt.id === 'overdue' ? 'rgba(220,38,38,0.12)' : 'var(--accent-light)')
                        : 'var(--bg-card)',
                      color: statusFilter === opt.id
                        ? (opt.id === 'overdue' ? '#dc2626' : 'var(--accent)')
                        : 'var(--text-secondary)',
                      border: `1px solid ${statusFilter === opt.id
                        ? (opt.id === 'overdue' ? 'rgba(220,38,38,0.3)' : 'rgba(37,99,235,0.2)')
                        : 'var(--border)'}`,
                    }}
                  >
                    {opt.label}
                    {opt.id === 'overdue' && overdueCnt > 0 && (
                      <span
                        className="ml-1.5 px-1.5 py-0.5 rounded-full text-white font-bold"
                        style={{ background: '#dc2626', fontSize: 9 }}
                      >
                        {overdueCnt}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', minWidth: 180 }}
              >
                <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search tasks…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-xs"
                  style={{ color: 'var(--text-primary)' }}
                />
                {search && (
                  <button onClick={() => setSearch('')}>
                    <X size={11} style={{ color: 'var(--text-muted)' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState filter={statusFilter} />
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([projectId, group]) => (
                  <div key={projectId} className="space-y-2">
                    {/* Project heading */}
                    <div className="flex items-center gap-2 mb-1">
                      <FolderOpen size={12} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {group.name}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-md text-xs font-medium"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 10 }}
                      >
                        {group.tasks.length}
                      </span>
                    </div>

                    {/* Task rows */}
                    {group.tasks.map((task, i) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        index={i}
                        onStatusChange={handleStatusChange}
                        onTaskClick={setSelectedTask}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Quick view panel */}
      {selectedTask && (
        <QuickTaskPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}