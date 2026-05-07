import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ProfileModal from './ProfileModal'

const Icons = {
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  bell: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  chevronDown: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>,
  logout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function Navbar({ title = 'Dashboard', onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

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
          <h1
            className="text-base font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Bell
          <button
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-80"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            title="Notifications"
          >
            {Icons.bell}
            <span
              className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
          </button> */}

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-all hover:opacity-80"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold"
                style={{ background: avatarColor, fontSize: 10 }}
              >
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
                  {/* User info */}
                  <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontSize: 10 }}>{user?.email}</p>
                  </div>

                  <div className="p-1">
                    {[
                      {
                        label: 'Profile',
                        icon: Icons.user,
                        action: () => { setMenuOpen(false); setProfileOpen(true) },
                      },
                      {
                        label: 'Sign out',
                        icon: Icons.logout,
                        action: async () => { setMenuOpen(false); await logout(); navigate('/') },
                        danger: true,
                      },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors"
                        style={{ color: item.danger ? 'var(--danger)' : 'var(--text-secondary)' }}
                        onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(220,38,38,0.06)' : 'var(--bg-primary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Profile modal */}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  )
}