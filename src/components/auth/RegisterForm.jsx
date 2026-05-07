import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Button from '../shared/Button'

export default function RegisterForm({ onSwitch, onSuccess, onError }) {
  const { register, loading } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const getPasswordStrength = (pw) => {
    if (!pw) return { label: '', color: '', width: '0%' }
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    const map = [
      { label: 'Weak', color: '#ef4444', width: '25%' },
      { label: 'Fair', color: '#f59e0b', width: '50%' },
      { label: 'Good', color: '#3b82f6', width: '75%' },
      { label: 'Strong', color: '#22c55e', width: '100%' },
    ]
    return map[score - 1] || map[0]
  }

  const strength = getPasswordStrength(form.password)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password || !form.confirm) {
      onError('Please fill in all fields.')
      return
    }
    if (form.password !== form.confirm) {
      onError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      onError('Password must be at least 8 characters.')
      return
    }
    const { error: err } = await register(form.email, form.password, form.fullName)
    if (err) {
      onError(err.message || 'Something went wrong. Please try again.')
    } else {
      onSuccess?.()
      setForm({ fullName: '', email: '', password: '', confirm: '' })
    }
  }

  const inputStyle = {
    background: 'var(--bg-primary)',
    border: '1.5px solid var(--border)',
    color: 'var(--text-primary)',
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"

  return (
    <div className="animate-fade-up opacity-0">
      <div className="mb-8">
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          className="text-3xl font-bold mb-2">
          Create account
        </h2>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          Join Sprintly and start managing your projects
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full name */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Full name
          </label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Juan dela Cruz"
            className={inputClass}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Email address
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={inputClass}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className={`${inputClass} pr-11`}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {/* Strength bar */}
          {form.password && (
            <div className="mt-2">
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: strength.width, background: strength.color }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Confirm password
          </label>
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            placeholder="Repeat your password"
            className={inputClass}
            style={{
              ...inputStyle,
              borderColor: form.confirm && form.confirm !== form.password ? 'var(--danger)' : undefined
            }}
            onFocus={e => e.target.style.borderColor = form.confirm && form.confirm !== form.password ? 'var(--danger)' : 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = form.confirm && form.confirm !== form.password ? 'var(--danger)' : 'var(--border)'}
          />
        </div>

        {/* Error */}
        

        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
          Create account
        </Button>
      </form>

      <p className="text-sm text-center mt-6" style={{ color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <button
          onClick={onSwitch}
          className="font-semibold hover:underline transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          Sign in
        </button>
      </p>
    </div>
  )
}