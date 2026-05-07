import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Button from "../shared/Button";

export default function LoginForm({ onSwitch, onSuccess, onError }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      onError('Please fill in all fields.')
      return
    }
    setLoading(true)
    const { error: err } = await login(form.email, form.password)
    setLoading(false)
    if (err) {
      let msg
      const errMsg = String(err.message || '')
      if (errMsg.includes('Invalid login credentials')) {
        msg = 'No account found or wrong password.'
      } else if (errMsg.includes('Email not confirmed')) {
        msg = 'Please confirm your email first.'
      } else {
        msg = errMsg || 'Something went wrong.'
      }
      onError(msg)
    } else {
      const pendingToken = localStorage.getItem('pending_invite_token')
      if (pendingToken) {
        localStorage.removeItem('pending_invite_token')
        navigate(`/invite/${pendingToken}`)
      } else {
        onSuccess?.()
      }
    }
  }

  return (
    <div className="animate-fade-up opacity-0">
      <div className="mb-8">
        <h2
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          className="text-3xl font-bold mb-2"
        >
          Welcome back
        </h2>
        <p style={{ color: "var(--text-secondary)" }} className="text-sm">
          Sign in to continue to your workspace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Email address
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
            style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Password
            </label>
            <button
              type="button"
              className="text-xs hover:underline transition-colors"
              style={{ color: "var(--accent)" }}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 pr-11"
              style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: "var(--text-muted)" }}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
          Sign in
        </Button>
      </form>

      <p className="text-sm text-center mt-6" style={{ color: "var(--text-secondary)" }}>
        Don't have an account?{" "}
        <button
          onClick={onSwitch}
          className="font-semibold hover:underline transition-colors"
          style={{ color: "var(--accent)" }}
        >
          Create one
        </button>
      </p>
    </div>
  );
}