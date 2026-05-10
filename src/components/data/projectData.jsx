// ─── Shared helpers ───────────────────────────────────────────────────────────
export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function getAvatarColor(name = '') {
  const colors = ['#3b82f6','#8b5cf6','#f59e0b','#10b981','#ec4899','#06b6d4','#f97316']
  return colors[(name?.charCodeAt(0) || 0) % colors.length]
}

export function Avatar({ name = '', size = 28, className = '' }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg text-white font-semibold shrink-0 ${className}`}
      style={{ width: size, height: size, background: getAvatarColor(name), fontSize: Math.round(size * 0.36) }}
    >
      {getInitials(name)}
    </div>
  )
}

export function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export function isOverdue(due_date) {
  if (!due_date) return false
  const due = new Date(due_date)
  due.setHours(23, 59, 59, 999)          // treat due date as end of that day
  return due < new Date()
}

export const PRIORITY_META = {
  high:   { label: 'High',   bg: 'rgba(239,68,68,0.08)',  text: '#ef4444', dot: '#ef4444'  },
  medium: { label: 'Medium', bg: 'rgba(245,158,11,0.08)', text: '#f59e0b', dot: '#f59e0b'  },
  low:    { label: 'Low',    bg: 'rgba(34,197,94,0.08)',  text: '#22c55e', dot: '#22c55e'  },
}

export const STATUS_COLUMNS = [
  { id: 'backlog',     label: 'Backlog',     color: '#94a3b8' },
  { id: 'todo',        label: 'To Do',       color: '#64748b' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'in_review',   label: 'In Review',   color: '#f59e0b' },
  { id: 'done',        label: 'Done',        color: '#22c55e' },
]

// ─── Mock project data ────────────────────────────────────────────────────────
export const MOCK_PROJECT = {
  id: '1',
  title: 'Sprintly Web App',
  description: 'Agile project tracker built with React and Supabase. Full-stack application with real-time updates.',
  created_at: '2025-04-01',
  due_date: '2025-06-30',
  progress: 68,
  role: 'manager',
  members: [
    { id: 'u1', name: 'Juan dela Cruz',  email: 'juan@email.com',  role: 'manager',     can_add_tasks: true  },
    { id: 'u2', name: 'Maria Santos',    email: 'maria@email.com', role: 'contributor', can_add_tasks: true  },
    { id: 'u3', name: 'Carlo Reyes',     email: 'carlo@email.com', role: 'contributor', can_add_tasks: false },
    { id: 'u4', name: 'Ana Lim',         email: 'ana@email.com',   role: 'contributor', can_add_tasks: false },
  ],
  sprints: [
    { id: 's1', title: 'Sprint 1', start_date: '2025-04-07', end_date: '2025-04-20', status: 'completed' },
    { id: 's2', title: 'Sprint 2', start_date: '2025-04-21', end_date: '2025-05-04', status: 'completed' },
    { id: 's3', title: 'Sprint 3', start_date: '2025-05-05', end_date: '2025-05-18', status: 'active'    },
    { id: 's4', title: 'Sprint 4', start_date: '2025-05-19', end_date: '2025-06-01', status: 'upcoming'  },
  ],
  milestones: [
    { id: 'm1', title: 'Auth & Routing',      due_date: '2025-04-20', status: 'done'        },
    { id: 'm2', title: 'Dashboard Complete',  due_date: '2025-05-10', status: 'in_progress' },
    { id: 'm3', title: 'Project Page Done',   due_date: '2025-05-25', status: 'upcoming'    },
    { id: 'm4', title: 'Final Demo Ready',    due_date: '2025-06-28', status: 'upcoming'    },
  ],
}

export const MOCK_TASKS = [
  { id: 't1',  title: 'Set up Supabase schema',      description: 'Create all tables: users, projects, tasks, sprints, milestones, invitations, comments.', status: 'done',        priority: 'high',   assigned_to: 'u1', sprint_id: 's2', due_date: '2025-04-30', comments: 3, tags: ['backend', 'db']       },
  { id: 't2',  title: 'Auth context + login page',   description: 'Implement Supabase auth with login, register, and protected routes.',                      status: 'done',        priority: 'high',   assigned_to: 'u1', sprint_id: 's2', due_date: '2025-05-01', comments: 1, tags: ['auth']               },
  { id: 't3',  title: 'Dashboard UI',                description: 'Build the main dashboard with stat cards, project list, and task overview.',               status: 'done',        priority: 'medium', assigned_to: 'u2', sprint_id: 's2', due_date: '2025-05-04', comments: 2, tags: ['frontend']            },
  { id: 't4',  title: 'Sidebar + Navbar components', description: 'Collapsible sidebar with mobile drawer, top navbar with notifications.',                   status: 'done',        priority: 'medium', assigned_to: 'u2', sprint_id: 's2', due_date: '2025-05-04', comments: 0, tags: ['frontend', 'ui']      },
  { id: 't5',  title: 'Project page — Kanban view',  description: 'Drag-and-drop Kanban board with sprint filtering and task cards.',                          status: 'in_progress', priority: 'high',   assigned_to: 'u1', sprint_id: 's3', due_date: '2025-05-12', comments: 4, tags: ['frontend', 'kanban']  },
  { id: 't6',  title: 'Project page — List view',    description: 'Sortable, filterable task list with inline status and priority updates.',                   status: 'in_progress', priority: 'medium', assigned_to: 'u3', sprint_id: 's3', due_date: '2025-05-12', comments: 1, tags: ['frontend']            },
  { id: 't7',  title: 'Invite member via email',     description: 'PM can invite registered users to the project by email. Show error if not found.',          status: 'todo',        priority: 'high',   assigned_to: 'u2', sprint_id: 's3', due_date: '2025-05-15', comments: 0, tags: ['backend', 'email']    },
  { id: 't8',  title: 'Task detail modal',           description: 'Full task details with comments, assignee picker, priority, due date.',                     status: 'in_review',   priority: 'medium', assigned_to: 'u4', sprint_id: 's3', due_date: '2025-05-14', comments: 2, tags: ['frontend']            },
  { id: 't9',  title: 'Permissions editor',          description: 'PM can configure per-member permissions: can_add_tasks, can_edit_tasks.',                   status: 'todo',        priority: 'low',    assigned_to: 'u3', sprint_id: 's3', due_date: '2025-05-18', comments: 0, tags: ['backend']             },
  { id: 't10', title: 'Progress overview charts',    description: 'Per-member task completion stats using recharts or d3.',                                    status: 'backlog',      priority: 'low',    assigned_to: null, sprint_id: 's4', due_date: '2025-05-28', comments: 0, tags: ['frontend', 'charts']  },
  { id: 't11', title: 'Sprint management UI',        description: 'Create, edit, complete sprints. Move tasks between sprints.',                               status: 'backlog',      priority: 'medium', assigned_to: null, sprint_id: 's4', due_date: '2025-05-30', comments: 0, tags: ['frontend']            },
  { id: 't12', title: 'Milestone tracker',           description: 'Visual milestone timeline with completion status.',                                         status: 'backlog',      priority: 'low',    assigned_to: null, sprint_id: 's4', due_date: '2025-06-01', comments: 0, tags: []                      },
]

export const MOCK_COMMENTS = {
  t5: [
    { id: 'c1', user: 'Maria Santos',  text: 'Should we use dnd-kit for drag and drop?',    created_at: '2025-05-06T10:00:00Z' },
    { id: 'c2', user: 'Juan dela Cruz', text: 'Yes, dnd-kit is the best option for React.',  created_at: '2025-05-06T10:15:00Z' },
    { id: 'c3', user: 'Carlo Reyes',   text: 'I can help with the column layout if needed.', created_at: '2025-05-06T11:00:00Z' },
    { id: 'c4', user: 'Juan dela Cruz', text: 'Great, let\'s sync tomorrow.',                created_at: '2025-05-07T09:00:00Z' },
  ],
  t8: [
    { id: 'c5', user: 'Ana Lim',       text: 'Done with the modal layout, needs review.',    created_at: '2025-05-07T14:00:00Z' },
    { id: 'c6', user: 'Juan dela Cruz', text: 'Will check it tonight.',                      created_at: '2025-05-07T15:00:00Z' },
  ],
}
