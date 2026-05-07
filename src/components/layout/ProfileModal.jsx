import { useState } from 'react'
import { X, User, Lock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name = '') {
  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4']
  return colors[(name?.charCodeAt(0) || 0) % colors.length]
}

function Toast({ type, message }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
      style={{
        background: type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.1)',
        border: `1px solid ${type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(220,38,38,0.3)'}`,
        color: type === 'success' ? '#16a34a' : '#dc2626',
      }}
    >
      {type === 'success'
        ? <CheckCircle2 size={13} />
        : <AlertTriangle size={13} />
      }
      {message}
    </div>
  )
}

export default function ProfileModal({ onClose }) {
  const { user } = useAuth()
  const name = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const avatarColor = getAvatarColor(name)

  // Profile section
  const [displayName, setDisplayName] = useState(name)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  // Password section
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false })

  const inputStyle = {
    width: '100%',
    padding: '8px 11px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return
    setSavingProfile(true)
    setProfileMsg(null)

    // Update Supabase auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim(), full_name: displayName.trim() },
    })

    // Also update profiles table if you have one
    if (!authError) {
      await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id)
    }

    setSavingProfile(false)
    if (authError) {
      setProfileMsg({ type: 'error', text: authError.message })
    } else {
      setProfileMsg({ type: 'success', text: 'Display name updated!' })
      setTimeout(() => setProfileMsg(null), 3000)
    }
  }

  const handleChangePassword = async () => {
    setPasswordMsg(null)

    if (!passwords.next || !passwords.confirm) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' })
      return
    }
    if (passwords.next.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    setSavingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: passwords.next })

    setSavingPassword(false)
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' })
      setPasswords({ current: '', next: '', confirm: '' })
      setTimeout(() => setPasswordMsg(null), 3000)
    }
  }

  const EyeIcon = ({ show }) => show
    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

  const PasswordField = ({ label, field }) => (
    <div>
      <label className="block mb-1.5" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={showPasswords[field] ? 'text' : 'password'}
          value={passwords[field]}
          onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
          style={{ ...inputStyle, paddingRight: 36 }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          type="button"
          onClick={() => setShowPasswords(p => ({ ...p, [field]: !p[field] }))}
          className="absolute right-2.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        >
          <EyeIcon show={showPasswords[field]} />
        </button>
      </div>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Profile
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Avatar + email */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
              style={{ background: avatarColor, fontSize: 16 }}
            >
              {getInitials(displayName || name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {displayName || name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
            </div>
          </div>

          {/* ── Profile section ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User size={12} style={{ color: 'var(--text-muted)' }} />
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Display Name
              </span>
            </div>

            <div>
              <label className="block mb-1.5" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                Name shown across the app
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label className="block mb-1.5" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                Email address
              </label>
              <input
                type="email"
                value={user?.email}
                disabled
                style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>

            {profileMsg && <Toast type={profileMsg.type} message={profileMsg.text} />}

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || !displayName.trim() || displayName.trim() === name}
              className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                opacity: (savingProfile || !displayName.trim() || displayName.trim() === name) ? 0.5 : 1,
              }}
            >
              {savingProfile
                ? <span className="flex items-center justify-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Saving…</span>
                : 'Save name'
              }
            </button>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* ── Password section ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock size={12} style={{ color: 'var(--text-muted)' }} />
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Change Password
              </span>
            </div>

            <PasswordField label="New password"     field="next"    />
            <PasswordField label="Confirm password" field="confirm" />

            {passwordMsg && <Toast type={passwordMsg.type} message={passwordMsg.text} />}

            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !passwords.next || !passwords.confirm}
              className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                opacity: (savingPassword || !passwords.next || !passwords.confirm) ? 0.5 : 1,
              }}
            >
              {savingPassword
                ? <span className="flex items-center justify-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Updating…</span>
                : 'Update password'
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}