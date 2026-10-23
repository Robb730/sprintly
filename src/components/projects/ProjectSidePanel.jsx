import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  LayoutList,
  Activity,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  UserPlus,
  UserMinus,
  Calendar,
  Trash2,
} from 'lucide-react'
import { getAvatarColor, getInitials } from '../data/projectData.jsx'
import ActivityFeed from '../activity/ActivityFeed.jsx'
import ResourcesTab from './ResourcesTab.jsx'
import ConfirmDialog from '../shared/ConfirmDialog.jsx'

const PANEL_W = 320
const RAIL_W = 56

// Keys must match the `panelTab` values used by the page.
const TABS = [
  { key: 'team',      label: 'Team',      Icon: Users },
  { key: 'planning',  label: 'Plan',      Icon: LayoutList },
  { key: 'activity',  label: 'Activity',  Icon: Activity },
  { key: 'resources', label: 'Resources', Icon: BookOpen },
]

const cardStyle = { border: '1px solid var(--border)', background: 'var(--bg-card)' }

const PRESENCE_COLOR = {
  online:  '#22c55e',
  away:    '#f59e0b',
  offline: 'var(--text-muted)',
}

// ─── helpers ──────────────────────────────────────────────────────────────────

// A ticking clock so presence states decay without waiting for a realtime event.
function useNow(interval = 15000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

function getPresence(lastSeen, now) {
  if (!lastSeen) return 'offline'
  const seconds = (now - new Date(lastSeen).getTime()) / 1000
  if (seconds < 60) return 'online'
  if (seconds < 300) return 'away'
  return 'offline'
}

function formatAgo(lastSeen, now) {
  const s = Math.max(0, Math.floor((now - new Date(lastSeen).getTime()) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function statusLine(member, presence, now) {
  if (presence === 'online') return 'Active now'
  if (presence === 'away') return `Away, ${formatAgo(member.last_seen_at, now)}`
  if (!member.last_seen_at) return 'Never visited'
  return `Last seen ${formatAgo(member.last_seen_at, now)}`
}

// ─── small pieces ─────────────────────────────────────────────────────────────

function Avatar({ name, presence, size = 32 }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-xl flex items-center justify-center text-white font-semibold"
        style={{ background: getAvatarColor(name), fontSize: Math.round(size * 0.34) }}
      >
        {getInitials(name)}
      </div>
      <span
        style={{
          position: 'absolute',
          right: -2,
          bottom: -2,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: PRESENCE_COLOR[presence],
          opacity: presence === 'offline' ? 0.45 : 1,
          border: '2px solid var(--bg-card)',
        }}
      />
    </div>
  )
}

// ─── Team tab ─────────────────────────────────────────────────────────────────

function TeamTab({ members, now, currentUserId, isManager, onInvite, onRemove }) {
  const [removing, setRemoving] = useState(null)

  // Managers first, then alphabetical. Presence is shown by the dot, not by
  // order, so rows don't jump around as people come and go.
  const sorted = useMemo(
    () =>
      [...members].sort((a, b) => {
        const am = a.role === 'manager'
        const bm = b.role === 'manager'
        if (am !== bm) return am ? -1 : 1
        return a.name.localeCompare(b.name)
      }),
    [members],
  )

  const onlineCount = members.filter(m => getPresence(m.last_seen_at, now) === 'online').length

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="shrink-0"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: onlineCount ? PRESENCE_COLOR.online : 'var(--text-muted)',
              opacity: onlineCount ? 1 : 0.45,
            }}
          />
          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {onlineCount} of {members.length}
            </span>{' '}
            online
          </p>
        </div>
        {isManager && (
          <button
            type="button"
            onClick={onInvite}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}
          >
            <UserPlus size={13} /> Invite
          </button>
        )}
      </div>

      <ul className="rounded-2xl overflow-hidden" style={cardStyle}>
        {sorted.map((m, i) => {
          const presence = getPresence(m.last_seen_at, now)
          const isYou = m.id === currentUserId
          return (
            <li
              key={m.id}
              className="group flex items-center gap-3 px-3 py-2.5 transition-colors"
              style={{ borderTop: i ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-primary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Avatar name={m.name} presence={presence} />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {m.name}
                  {isYou && (
                    <span className="font-normal" style={{ color: 'var(--text-muted)' }}> (you)</span>
                  )}
                </p>
                <p
                  className="truncate"
                  style={{
                    fontSize: 11,
                    color:
                      presence === 'online' ? '#16a34a'
                      : presence === 'away' ? '#b45309'
                      : 'var(--text-muted)',
                  }}
                >
                  {statusLine(m, presence, now)}
                </p>
              </div>

              {m.role === 'manager' ? (
                <span
                  className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium"
                  style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)', fontSize: 10 }}
                >
                  <Crown size={10} /> PM
                </span>
              ) : (
                isManager && (
                  <button
                    type="button"
                    title="Remove member"
                    aria-label={`Remove ${m.name}`}
                    onClick={() => setRemoving(m)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    style={{ color: '#dc2626', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <UserMinus size={13} />
                  </button>
                )
              )}
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          onRemove(removing)
          setRemoving(null)
        }}
        title="Remove member?"
        message={removing ? `${removing.name} will lose access to this project and its tasks.` : ''}
        confirmLabel="Remove"
        danger
      />
    </>
  )
}

// ─── Plan tab ─────────────────────────────────────────────────────────────────

function PlanTab({ project, progress, taskDone, taskTotal, isManager, onDeleteProject, extras }) {
  const due = project.due_date
    ? new Date(project.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <>
      <div className="rounded-2xl p-4 flex flex-col gap-3.5" style={cardStyle}>
        {project.description && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {project.description}
          </p>
        )}

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Progress</span>
            <span className="text-sm font-bold" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
              {progress}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ background: 'var(--bg-primary)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--accent)' }}
            />
          </div>
          <p className="mt-1.5" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {taskTotal ? `${taskDone} of ${taskTotal} tasks done` : 'No tasks yet'}
          </p>
        </div>

        {due && (
          <div
            className="flex items-center gap-2 pt-3 text-xs"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
            Due {due}
          </div>
        )}
      </div>

      {extras}

      {isManager && (
        <button
          type="button"
          onClick={onDeleteProject}
          className="mt-1 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{ color: '#dc2626', border: '1px dashed rgba(220,38,38,0.3)', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Trash2 size={12} /> Delete project
        </button>
      )}
    </>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ProjectSidePanel({
  open,
  onOpenChange,
  tab,
  onTabChange,
  projectId,
  project,
  progress,
  taskDone,
  taskTotal,
  members,
  currentUserId,
  isManager,
  onInvite,
  onRemoveMember,
  onDeleteProject,
  planExtras,
}) {
  const now = useNow()
  const onlineCount = members.filter(m => getPresence(m.last_seen_at, now) === 'online').length

  return (
    <aside
      aria-label="Project sidebar"
      className="hidden lg:flex shrink-0 overflow-hidden transition-[width] duration-300 ease-out"
      style={{
        width: open ? PANEL_W : RAIL_W,
        borderLeft: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}
    >
      {open ? (
        <div className="flex flex-col" style={{ width: PANEL_W }}>
          {/* Tabs + collapse */}
          <div className="flex items-center gap-2 p-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div
              role="tablist"
              aria-label="Sidebar sections"
              className="flex-1 grid grid-cols-4 gap-0.5 p-1 rounded-xl"
              style={{ background: 'var(--bg-primary)' }}
            >
              {TABS.map(({ key, label, Icon }) => {
                const active = tab === key
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onTabChange(key)}
                    className="flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all"
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      background: active ? 'var(--bg-card)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      boxShadow: active ? '0 0 0 1px var(--border)' : 'none',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            >
              <ChevronsRight size={15} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto" role="tabpanel">
            <div className="p-3 flex flex-col gap-3">
              {tab === 'team' && (
                <TeamTab
                  members={members}
                  now={now}
                  currentUserId={currentUserId}
                  isManager={isManager}
                  onInvite={onInvite}
                  onRemove={onRemoveMember}
                />
              )}
              {tab === 'planning' && (
                <PlanTab
                  project={project}
                  progress={progress}
                  taskDone={taskDone}
                  taskTotal={taskTotal}
                  isManager={isManager}
                  onDeleteProject={onDeleteProject}
                  extras={planExtras}
                />
              )}
              {tab === 'activity' && <ActivityFeed projectId={projectId} />}
              {tab === 'resources' && (
                <ResourcesTab projectId={projectId} userId={currentUserId} isManager={isManager} />
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed rail: every section stays one click away */
        <div className="flex flex-col items-center gap-1 py-2" style={{ width: RAIL_W }}>
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
          >
            <ChevronsLeft size={15} />
          </button>
          <div className="my-1" style={{ width: 24, height: 1, background: 'var(--border)' }} />
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key
            return (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => { onTabChange(key); onOpenChange(true) }}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                style={{
                  background: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-card)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={16} />
                {key === 'team' && onlineCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: PRESENCE_COLOR.online,
                      border: '1.5px solid var(--bg-secondary)',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </aside>
  )
}