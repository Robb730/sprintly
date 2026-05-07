import { useState } from 'react'
import Button from '../shared/Button'
import I from '../shared/Icons'
import { supabase } from '../../lib/supabase'

export default function InviteMemberModal({ onClose, onInvite, existingEmails = [], projectId, projectName, inviterName }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // null | 'valid' | 'invalid' | 'already' | 'checking'
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  const handleCheck = async (val) => {
  setEmail(val)
  setStatus(null)
  setErrorMsg('')
  if (!val.includes('@') || !val.includes('.')) return
  if (existingEmails.includes(val)) { setStatus('already'); return }

  setStatus('checking')

  const { data, error } = await supabase
    .from('profiles_with_email')
    .select('id')
    .eq('email', val)
    .maybeSingle()

  console.log('lookup:', data, error) // temp debug
  setStatus(data ? 'valid' : 'invalid')
}

  const handleInvite = async () => {
  if (status !== 'valid' || loading) return
  setLoading(true)
  setErrorMsg('')

  try {
    // 1. Re-verify user exists
    const { data: profile } = await supabase
      .from('profiles_with_email')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!profile) throw new Error('User not found.')

    // 2. Check for existing pending invitation
    const { data: existing } = await supabase
      .from('invitations')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) throw new Error('An invitation is already pending for this email.')

    // 3. Insert invitation
    const { data: invite, error: insertError } = await supabase
      .from('invitations')
      .insert({ project_id: projectId, email })
      .select('token')
      .single()

    if (insertError) throw insertError

    // 4. Send email via Edge Function
    const { error: fnError } = await supabase.functions.invoke('send-invite', {
      body: {
        to: email,
        inviterName,
        projectName,
        token: invite.token,
        appUrl: window.location.origin,
      },
    })

    if (fnError) throw fnError

    setSent(s => [...s, email])
    setEmail('')
    setStatus(null)
  } catch (err) {
    setErrorMsg(err.message || 'Something went wrong.')
  } finally {
    setLoading(false)
  }
}

  const statusConfig = {
    checking: { text: 'Looking up account…',                   color: 'var(--text-muted)' },
    valid:    { text: 'User found — ready to invite.',          color: 'var(--success)'    },
    invalid:  { text: 'No Sprintly account with this email.',   color: 'var(--danger)'     },
    already:  { text: 'This user is already in the project.',   color: 'var(--warning)'    },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-up opacity-0"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Invite Member
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              They must have a Sprintly account.
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}>
            {I.close}
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email address
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => handleCheck(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                placeholder="teammate@example.com"
                className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none transition-all"
                style={{
                  background: 'var(--bg-primary)',
                  border: `1px solid ${
                    status === 'valid'    ? 'var(--success)' :
                    status === 'invalid' || status === 'already' ? 'var(--danger)' :
                    'var(--border)'
                  }`,
                  color: 'var(--text-primary)',
                }}
                autoFocus
              />
              <Button
                variant="primary" size="sm"
                loading={loading}
                disabled={status !== 'valid' || loading}
                onClick={handleInvite}
              >
                {loading ? 'Sending…' : 'Send'}
              </Button>
            </div>

            {status && statusConfig[status] && (
              <p className="text-xs mt-1.5" style={{ color: statusConfig[status].color }}>
                {statusConfig[status].text}
              </p>
            )}
            {errorMsg && (
              <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>{errorMsg}</p>
            )}
          </div>

          {/* Sent list */}
          {sent.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Invites sent</p>
              <div className="space-y-1.5">
                {sent.map(e => (
                  <div key={e} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', color: 'var(--success)' }}>
                    {I.check} {e}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-4">
          <Button variant="secondary" size="sm" onClick={onClose} className="w-full">Done</Button>
        </div>
      </div>
    </div>
  )
}