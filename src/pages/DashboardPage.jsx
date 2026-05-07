import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'
import Toast from '../components/shared/Toast'
import { useProjects } from '../hooks/useProjects'
import { supabase } from '../lib/supabase'
import {
  Folder, CheckCheck, TrendingUp, Zap, Calendar, ArrowRight,
  AlertTriangle, Clock, Activity, Timer, Circle, CircleCheck,
  ChevronRight, Flag, Layers
} from 'lucide-react'

// ─── Priority & status style maps ───────────────────────────────────────────────
const PRIORITY = {
  high:   { label: 'High',   bg: 'rgba(239,68,68,0.1)',  text: '#ef4444' },
  medium: { label: 'Medium', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
  low:    { label: 'Low',    bg: 'rgba(34,197,94,0.1)',  text: '#22c55e' },
}

const STATUS_STYLE = {
  todo:        { label: 'To Do',       bg: 'var(--bg-primary)',    text: 'var(--text-muted)' },
  in_progress: { label: 'In Progress', bg: 'rgba(59,130,246,0.1)', text: '#3b82f6'           },
  review:      { label: 'In Review',   bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6'           },
  done:        { label: 'Done',        bg: 'rgba(34,197,94,0.1)',  text: '#22c55e'           },
}

// ─── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, delay = 0 }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-4 animate-fade-up opacity-0"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', animationDelay: `${delay}ms` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}18` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none mb-0.5"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Project progress card ──────────────────────────────────────────────────────
function SprintCard({ project }) {
  const navigate = useNavigate()
  const progress = project.task_count > 0
    ? Math.round((project.completed_tasks / project.task_count) * 100)
    : 0
  return (
    <div className="rounded-xl p-3 cursor-pointer transition-colors"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onClick={() => navigate(`/projects/${project.id}`)}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold truncate mr-2" style={{ color: 'var(--text-primary)' }}>{project.title}</p>
        <span className="text-xs shrink-0 font-bold" style={{ color: 'var(--accent)' }}>{progress}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--bg-primary)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {project.completed_tasks}/{project.task_count} tasks
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium"
          style={{
            background: project.role === 'manager' ? 'rgba(37,99,235,0.1)' : 'var(--bg-primary)',
            color: project.role === 'manager' ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 10,
          }}>
          {project.role === 'manager' ? 'PM' : 'Member'}
        </span>
      </div>
    </div>
  )
}

// ─── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, count, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{title}</h3>
        {count !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            {count}
          </span>
        )}
      </div>
      {action && (
        <button onClick={onAction} className="flex items-center gap-1 text-xs font-medium hover:underline"
          style={{ color: 'var(--accent)' }}>
          {action} <ArrowRight size={12} />
        </button>
      )}
    </div>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div className="rounded-2xl py-8 flex flex-col items-center justify-center text-center"
      style={{ border: '1.5px dashed var(--border)' }}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  )
}

// ─── Task row ───────────────────────────────────────────────────────────────────
function TaskRow({ task, index, total, onNavigate, showDue = false, isLast }) {
  const pri = PRIORITY[task.priority] || PRIORITY.medium
  const sta = STATUS_STYLE[task.status] || STATUS_STYLE.todo
  const now = new Date()

  const due = task.due_date ? new Date(task.due_date) : null
  const daysLeft = due ? Math.ceil((due - now) / 86400000) : null
  const isOverdue = daysLeft !== null && daysLeft < 0
  const isUrgent = daysLeft !== null && daysLeft <= 2 && daysLeft >= 0

  const dueFmt = due
    ? due.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
    : null

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
      style={{ borderBottom: !isLast ? '1px solid var(--border)' : 'none' }}
      onClick={() => onNavigate(`/projects/${task.project?.id}`)}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Status dot */}
      <div className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: sta.text }} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          {task.project?.title}
        </p>
      </div>

      {/* Priority pill */}
      <span className="hidden sm:inline shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: pri.bg, color: pri.text, fontSize: 10 }}>
        {pri.label}
      </span>

      {/* Due date */}
      {showDue && due && (
        <div className="flex items-center gap-1 shrink-0 text-xs"
          style={{ color: isOverdue ? '#ef4444' : isUrgent ? '#f59e0b' : 'var(--text-muted)' }}>
          {(isOverdue || isUrgent) && <AlertTriangle size={11} />}
          <span>{dueFmt}</span>
          {daysLeft !== null && (
            <span style={{ color: isOverdue ? '#ef4444' : 'var(--text-muted)', fontSize: 10 }}>
              {isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'today' : `${daysLeft}d`}
            </span>
          )}
        </div>
      )}

      <ChevronRight size={12} style={{ color: 'var(--text-muted)', shrink: 0 }} />
    </div>
  )
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const { projects = [] } = useProjects(user?.id)

  useEffect(() => {
    if (!user) return
    async function fetchMyTasks() {
      setLoading(true)
      const { data } = await supabase
        .from('tasks')
        .select('*, project:projects(id, title)')
        .eq('assigned_to', user.id)   // ← correct field name
        .neq('status', 'done')
        .order('due_date', { ascending: true, nullsLast: true })
      setMyTasks(data || [])
      setLoading(false)
    }
    fetchMyTasks()
  }, [user])

  // ─── Derived values ────────────────────────────────────────────────────────
  const name      = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const firstName = name.split(' ')[0]

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const now = new Date()

  const totalTasks   = projects.reduce((a, p) => a + (p.task_count || 0), 0)
  const completedAll = projects.reduce((a, p) => a + (p.completed_tasks || 0), 0)
  const overallPct   = totalTasks ? Math.round((completedAll / totalTasks) * 100) : 0
  const totalSprints = projects.reduce((a, p) => a + (p.sprint_count || 0), 0)

  // Tasks with no due date or due today or overdue → "needs attention"
  const overdueOrToday = myTasks.filter(t => {
    if (!t.due_date) return false
    const due = new Date(t.due_date)
    const daysLeft = Math.ceil((due - now) / 86400000)
    return daysLeft <= 0
  })

  // No due date tasks
  const noDueDateTasks = myTasks.filter(t => !t.due_date).slice(0, 3)

  // Upcoming: due within next 14 days
  const upcomingTasks = myTasks
    .filter(t => {
      if (!t.due_date) return false
      const due = new Date(t.due_date)
      const daysLeft = Math.ceil((due - now) / 86400000)
      return daysLeft > 0 && daysLeft <= 14
    })
    .slice(0, 6)

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar title="Dashboard" onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto space-y-6">

            {/* Greeting */}
            <div className="animate-fade-up opacity-0">
              <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
                {now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {greeting}, {firstName} 👋
              </h2>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={<Folder size={20} />}      label="Total Projects"    value={projects.length}   sub={`${projects.filter(p => p.role === 'manager').length} as PM`} accent="#3b82f6" delay={0}   />
              <StatCard icon={<CheckCheck size={20} />}  label="Tasks Completed"   value={completedAll}      sub={`of ${totalTasks} total`}                                     accent="#22c55e" delay={60}  />
              <StatCard icon={<TrendingUp size={20} />}  label="Overall Progress"  value={`${overallPct}%`}  sub="across all projects"                                          accent="#8b5cf6" delay={120} />
              <StatCard icon={<Zap size={20} />}         label="Active Sprints"    value={totalSprints}      sub="ongoing iterations"                                           accent="#f59e0b" delay={180} />
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left column */}
              <div className="lg:col-span-2 space-y-6">

                {/* Needs attention — overdue + due today */}
                <section className="animate-fade-up opacity-0" style={{ animationDelay: '200ms' }}>
                  <SectionHeader
                    icon={<AlertTriangle size={14} />}
                    title="Needs Attention"
                    count={overdueOrToday.length + noDueDateTasks.length}
                  />
                  {overdueOrToday.length === 0 && noDueDateTasks.length === 0 ? (
                    <EmptyState message="You're all caught up. No overdue or due-today tasks." />
                  ) : (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                      {/* Overdue / due today */}
                      {overdueOrToday.map((task, i) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          isLast={i === overdueOrToday.length - 1 && noDueDateTasks.length === 0}
                          onNavigate={navigate}
                          showDue
                        />
                      ))}
                      {/* No due date divider */}
                      {noDueDateTasks.length > 0 && (
                        <>
                          {overdueOrToday.length > 0 && (
                            <div className="px-4 py-1.5 flex items-center gap-2"
                              style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                              <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                                No due date set
                              </span>
                            </div>
                          )}
                          {noDueDateTasks.map((task, i) => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              isLast={i === noDueDateTasks.length - 1}
                              onNavigate={navigate}
                              showDue={false}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </section>

                {/* Upcoming deadlines */}
                <section className="animate-fade-up opacity-0" style={{ animationDelay: '260ms' }}>
                  <SectionHeader
                    icon={<Clock size={14} />}
                    title="Upcoming — Next 14 Days"
                    count={upcomingTasks.length}
                  />
                  {upcomingTasks.length === 0 ? (
                    <EmptyState message="No upcoming deadlines in the next 14 days." />
                  ) : (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                      {upcomingTasks.map((task, i) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          isLast={i === upcomingTasks.length - 1}
                          onNavigate={navigate}
                          showDue
                        />
                      ))}
                    </div>
                  )}
                </section>

              </div>

              {/* Right column */}
              <div className="space-y-6">

                {/* Project progress */}
                <section className="animate-fade-up opacity-0" style={{ animationDelay: '300ms' }}>
                  <SectionHeader
                    icon={<Layers size={14} />}
                    title="Project Progress"
                    action="All projects"
                    onAction={() => navigate('/projects')}
                  />
                  {projects.length === 0 ? (
                    <EmptyState message="No projects yet." />
                  ) : (
                    <div className="space-y-2">
                      {projects.map(p => <SprintCard key={p.id} project={p} />)}
                    </div>
                  )}
                </section>

                {/* My tasks summary */}
                <section className="animate-fade-up opacity-0" style={{ animationDelay: '360ms' }}>
                  <SectionHeader icon={<Flag size={14} />} title="My Tasks Summary" />
                  <div className="rounded-2xl p-4 space-y-3"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    {Object.entries(STATUS_STYLE).map(([key, val]) => {
                      const count = myTasks.filter(t => t.status === key).length
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: val.text }} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{val.label}</span>
                          </div>
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                        </div>
                      )
                    })}
                    <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Total assigned</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{myTasks.length}</span>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </div>

          </div>
        </main>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}