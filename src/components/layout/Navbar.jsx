import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ProfileModal from './ProfileModal'
import { useNotifications } from '../../hooks/useNotifications'
import {Bell} from 'lucide-react'

const Icons = {
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  bell: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  chevronDown: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>,
  logout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  messageSquare: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  eye: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const TYPE_META = {
  task_done:   { icon: Icons.check,         iconBg: 'rgba(34,197,94,0.12)',   iconColor: '#16a34a' },
  task_review: { icon: Icons.eye,           iconBg: 'rgba(245,158,11,0.12)',  iconColor: '#b45309' },
  comment:     { icon: Icons.messageSquare, iconBg: 'rgba(37,99,235,0.10)',   iconColor: 'var(--accent)' },
}

export default function Navbar({ title = 'Dashboard', onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('notif_read') || '[]')) }
    catch { return new Set() }
  })
  const bellRef = useRef(null)

  const { notifications, loading } = useNotifications(user?.id)

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  // Close bell on outside click
  useEffect(() => {
    if (!bellOpen) return
    const handler = (e) => { if (!bellRef.current?.contains(e.target)) setBellOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  const markAllRead = () => {
    const all = new Set(notifications.map(n => n.id))
    setReadIds(all)
    localStorage.setItem('notif_read', JSON.stringify([...all]))
  }

  const markRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev).add(id)
      localStorage.setItem('notif_read', JSON.stringify([...next]))
      return next
    })
  }

  const name = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const colors = ['#3b82f6','#8b5cf6','#f59e0b','#10b981','#ec4899','#06b6d4']
  const avatarColor = colors[(name?.charCodeAt(0) || 0) % colors.length]

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 shrink-0"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
          >
            {Icons.menu}
          </button>
          <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {title}
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

          {/* Bell */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setBellOpen(o => !o)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-80"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
              title="Notifications"
            >
              {Icons.bell}
              {unreadCount > 0 && (
                <span
                  className="absolute flex items-center justify-center font-bold"
                  style={{
                    top: 4, right: 4, minWidth: 14, height: 14, borderRadius: 7,
                    background: '#ef4444', color: '#fff', fontSize: 8,
                    padding: '0 3px', lineHeight: 1,
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {bellOpen && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 340, maxHeight: 480, borderRadius: 16, overflow: 'hidden',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  display: 'flex', flexDirection: 'column', zIndex: 50,
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 shrink-0"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-xs font-semibold"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-medium transition-opacity hover:opacity-70"
                      style={{ color: 'var(--accent)' }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {loading ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading…</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Bell size={32} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n, i) => {
                      const meta = TYPE_META[n.type] || TYPE_META.comment
                      const isRead = readIds.has(n.id)
                      return (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                          style={{
                            borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                            background: isRead ? 'transparent' : 'rgba(37,99,235,0.04)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                          onMouseLeave={e => e.currentTarget.style.background = isRead ? 'transparent' : 'rgba(37,99,235,0.04)'}
                        >
                          {/* Icon */}
                          <div
                            className="shrink-0 flex items-center justify-center rounded-lg"
                            style={{ width: 30, height: 30, background: meta.iconBg, color: meta.iconColor, marginTop: 1 }}
                          >
                            {meta.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {n.title}
                              </p>
                              {!isRead && (
                                <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />
                              )}
                            </div>
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                              {n.body}
                            </p>
                            {n.sub && (
                              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                                {n.sub}
                              </p>
                            )}
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                              {timeAgo(n.time)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-all hover:opacity-80"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold"
                style={{ background: avatarColor, fontSize: 10 }}>
                {getInitials(name)}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: 'var(--text-primary)' }}>
                {name.split(' ')[0]}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{Icons.chevronDown}</span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden shadow-lg z-20 animate-fade-up opacity-0"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontSize: 10 }}>{user?.email}</p>
                  </div>
                  <div className="p-1">
                    {[
                      { label: 'Profile', icon: Icons.user, action: () => { setMenuOpen(false); setProfileOpen(true) } },
                      { label: 'Sign out', icon: Icons.logout, action: async () => { setMenuOpen(false); await logout(); navigate('/') }, danger: true },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors"
                        style={{ color: item.danger ? 'var(--danger)' : 'var(--text-secondary)' }}
                        onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(220,38,38,0.06)' : 'var(--bg-primary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  )
}