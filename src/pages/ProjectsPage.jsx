import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'
import ProjectCard from '../components/projects/ProjectCard'
import CreateProjectModal from '../components/projects/CreateProjectModal'
import Toast from '../components/shared/Toast'
import Button from '../components/shared/Button'
import { useProjects } from '../hooks/useProjects'

const Icons = {
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  emptyBox: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
}



function FilterTab({ value, label, current, onClick }) {
  const active = value === current
  return (
    <button onClick={() => onClick(value)}
      className="px-3 py-1.5 text-xs font-medium transition-all rounded-lg"
      style={{ background: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--text-muted)' }}>
      {label}
    </button>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
    const { projects, loading, createProject } = useProjects(user?.id)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 4000) }

  const handleCreate = async ({ title, description }) => {
    try {
      await createProject({ title, description }, user)
      showToast('success', `"${title}" created.`)
      setShowCreate(false)
    } catch (e) {
      showToast('error', e.message)
    }
  }

  const filtered = projects
    .filter(p => filter === 'mine' ? p.role === 'manager' : filter === 'member' ? p.role === 'contributor' : true)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-screen overflow-hidden" style={{ background:'var(--bg-primary)' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar title="My Projects" onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto space-y-5">

            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-up opacity-0">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily:'var(--font-display)', color:'var(--text-primary)' }}>Projects</h2>
                <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>
                  {projects.filter(p=>p.role==='manager').length} owned · {projects.filter(p=>p.role==='contributor').length} shared with you
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
                {Icons.plus} New Project
              </Button>
            </div>

            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-2 animate-fade-up opacity-0" style={{ animationDelay:'60ms' }}>
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl"
                style={{ border:'1px solid var(--border)', background:'var(--bg-card)' }}>
                <span style={{ color:'var(--text-muted)' }}>{Icons.search}</span>
                <input
                  type="text" placeholder="Search projects…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none"
                  style={{ color:'var(--text-primary)' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-xs" style={{ color:'var(--text-muted)' }}>✕</button>
                )}
              </div>
              {/* Filter pill */}
              <div className="flex items-center rounded-xl p-0.5 shrink-0"
                style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                <FilterTab value="all"    label="All"    current={filter} onClick={setFilter} />
                <FilterTab value="mine"   label="PM"     current={filter} onClick={setFilter} />
                <FilterTab value="member" label="Member" current={filter} onClick={setFilter} />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 animate-fade-up opacity-0" style={{ animationDelay:'100ms' }}>
              {[
                { label:'Total',    value: projects.length },
                { label:'As PM',    value: projects.filter(p=>p.role==='manager').length },
                { label:'As Member',value: projects.filter(p=>p.role==='contributor').length },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                  <p className="text-lg font-bold" style={{ color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>{s.value}</p>
                  <p className="text-xs" style={{ color:'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl flex flex-col items-center justify-center py-16 text-center"
                style={{ border:'1.5px dashed var(--border)' }}>
                <div className="mb-3" style={{ color:'var(--text-muted)' }}>{Icons.emptyBox}</div>
                <p className="text-sm font-semibold mb-1" style={{ color:'var(--text-primary)' }}>No projects</p>
                <p className="text-xs mb-4" style={{ color:'var(--text-muted)' }}>
                  {search ? `No results for "${search}".` : filter === 'all' ? 'Create your first project.' : 'No projects match this filter.'}
                </p>
                {filter === 'all' && !search && (
                  <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>Create Project</Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((p, i) => (
                  <div key={p.id} className="animate-fade-up opacity-0" style={{ animationDelay:`${i * 50}ms` }}>
                    <ProjectCard project={p} />
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}