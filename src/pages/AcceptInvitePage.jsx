import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [invitedEmail, setInvitedEmail] = useState('')

  useEffect(() => {
    async function acceptInvite() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // 2. Look up invitation first (so we know the target email)
      const { data: invite, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .maybeSingle()

        console.log('token:', token)
        console.log('invite:', invite)
        console.log('error:', error)

      if (error || !invite) {
        setStatus('error')
        setMessage('This invitation link is invalid or has expired.')
        console.log('invite:', invite)
        console.log('error:', error)
        return
      }

      if (invite.status === 'accepted') {
        setStatus('error')
        setMessage('This invitation has already been used.')
        return
      }

      // 3. Not logged in — tell them which account to use
      if (!user) {
        setInvitedEmail(invite.email)
        localStorage.setItem('pending_invite_token', token)
        setStatus('need_login')
        return
      }

      // 4. Wrong account logged in
      if (invite.email !== user.email) {
        setInvitedEmail(invite.email)
        setStatus('wrong_account')
        return
      }

      // 5. Add to project_members
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invite.project_id,
          user_id: user.id,
          role: 'contributor',
        })

      if (memberError && memberError.code !== '23505') {
        setStatus('error')
        setMessage(memberError.message)
        return
      }

      // 6. Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invite.id)

      setStatus('success')
      setTimeout(() => navigate(`/projects/${invite.project_id}`), 2000)
    }

    acceptInvite()
  }, [token])

  const handleGoToLogin = async () => {
    // Sign out current user (if any) so they can log in with the right account
    await supabase.auth.signOut()
    localStorage.setItem('pending_invite_token', token)
    navigate('/')
  }

  if (status === 'need_login') {
    return (
      <div className="flex h-screen items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center space-y-4 p-8 rounded-2xl max-w-sm w-full"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 36 }}>🔐</div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Sign in to accept
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            This invitation was sent to{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {invitedEmail}
            </span>
            . Please sign in with that account, then click the invitation link again.
          </p>
          <button
            onClick={handleGoToLogin}
            className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Go to sign in
          </button>
        </div>
      </div>
    )
  }

  if (status === 'wrong_account') {
    return (
      <div className="flex h-screen items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center space-y-4 p-8 rounded-2xl max-w-sm w-full"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 36 }}>👤</div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Wrong account
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            This invitation was sent to{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {invitedEmail}
            </span>
            . You're currently signed in with a different account. Please sign in with the correct account and click the link again.
          </p>
          <button
            onClick={handleGoToLogin}
            className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Sign in with correct account
          </button>
        </div>
      </div>
    )
  }

  const ui = {
    loading: { emoji: '⏳', title: 'Checking invitation…',  sub: 'Please wait.',                    color: 'var(--text-muted)' },
    success: { emoji: '🎉', title: 'Invitation accepted!',  sub: 'Redirecting you to the project…', color: 'var(--success)'    },
    error:   { emoji: '❌', title: 'Something went wrong.', sub: message,                           color: 'var(--danger)'     },
  }[status]

  return (
    <div className="flex h-screen items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center space-y-3 p-8 rounded-2xl max-w-sm w-full"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 40 }}>{ui.emoji}</div>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{ui.title}</h2>
        <p className="text-xs" style={{ color: ui.color }}>{ui.sub}</p>
      </div>
    </div>
  )
}