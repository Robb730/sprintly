import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import ConfirmDialog from '../shared/ConfirmDialog.jsx'
import {
  Link2, Plus, Trash2, Copy, Check, X, Search, AlertTriangle,
  FileText, Folder, GitBranch, Play, PenTool,
} from 'lucide-react'

const SELECT = '*, creator:profiles_with_email!project_resources_created_by_fkey (display_name)'

// ─── helpers ──────────────────────────────────────────────────────────────────

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

// Accepts "example.com" or a full URL. Only http(s) is allowed, so things like
// `javascript:` links can never be saved or rendered as hrefs.
function normalizeUrl(raw) {
  const v = raw.trim()
  if (!v) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`
  try {
    const u = new URL(withScheme)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch { return null }
}

const isSafeHref = (url) => /^https?:\/\//i.test(url)

// A little visual variety so a list of links is scannable.
function iconFor(domain) {
  if (/(^|\.)(github|gitlab|bitbucket)\.(com|org)$/.test(domain)) return GitBranch
  if (/(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/.test(domain)) return Play
  if (/(^|\.)figma\.com$/.test(domain)) return PenTool
  if (domain === 'docs.google.com' || /(^|\.)notion\.(so|site)$/.test(domain)) return FileText
  if (domain === 'drive.google.com' || /(^|\.)dropbox\.com$/.test(domain)) return Folder
  return Link2
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

// ─── card ─────────────────────────────────────────────────────────────────────

function IconAction({ title, onClick, danger, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-opacity hover:opacity-70"
      style={{ color: danger ? 'var(--danger)' : 'var(--text-muted)', background: 'var(--bg-primary)' }}
    >
      {children}
    </button>
  )
}

function ResourceCard({ resource, canDelete, onDelete }) {
  const [copied, setCopied] = useState(false)
  const domain = getDomain(resource.url)
  const Icon = iconFor(domain)
  const href = isSafeHref(resource.url) ? resource.url : undefined

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resource.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div
      className="group relative flex gap-3 p-3 rounded-xl transition-colors"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
      >
        <Icon size={15} />
      </div>

      <div className="flex-1 min-w-0">
        {/* The title link is stretched over the whole card so the entire card is clickable */}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs font-semibold truncate hover:underline after:absolute after:inset-0 after:rounded-xl"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {resource.title}
        </a>
        <p className="truncate" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{domain}</p>

        {resource.description && (
          <p
            className="mt-1 leading-snug"
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {resource.description}
          </p>
        )}

        {/* Footer sits above the stretched link so its buttons stay clickable */}
        <div className="relative z-10 mt-1.5 flex items-center justify-between gap-2" style={{ minHeight: 22 }}>
          <span
            className="truncate"
            style={{ fontSize: 10, color: 'var(--text-muted)' }}
            title={new Date(resource.created_at).toLocaleString()}
          >
            {resource.creator?.display_name || 'Unknown'}, {formatDate(resource.created_at)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <IconAction title={copied ? 'Copied' : 'Copy link'} onClick={copy}>
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </IconAction>
            {canDelete && (
              <IconAction title="Delete link" danger onClick={() => onDelete(resource)}>
                <Trash2 size={11} />
              </IconAction>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── add modal ────────────────────────────────────────────────────────────────

function AddLinkModal({ projectId, userId, onClose, onCreated }) {
  const { show: showToast } = useToast()
  const [form, setForm] = useState({ url: '', title: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (key, val) => { setForm((f) => ({ ...f, [key]: val })); setError('') }

  const normalized = normalizeUrl(form.url)
  const suggestedTitle = normalized ? getDomain(normalized) : 'Name this link'

  const submit = async (e) => {
    e.preventDefault()
    if (!normalized) { setError('Enter a valid web address, like https://example.com.'); return }

    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from('project_resources')
      .insert({
        project_id: projectId,
        title: form.title.trim() || getDomain(normalized),
        url: normalized,
        description: form.description.trim() || null,
        created_by: userId,
      })
      .select(SELECT)
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    showToast('success', 'Link added')
    onCreated(data)
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-md, 10px)',
    border: '1px solid var(--border)', background: 'var(--bg-primary)',
    color: 'var(--text-primary)', fontSize: 12, fontFamily: 'inherit', outline: 'none',
  }
  const focusIn = (e) => (e.target.style.borderColor = 'var(--accent)')
  const focusOut = (e) => (e.target.style.borderColor = 'var(--border)')
  const labelStyle = { color: 'var(--text-muted)', fontSize: 11 }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-link-title"
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden animate-slide-up sm:animate-fade-up sheet-card flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 id="add-link-title" className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Add link
            </h2>
            <p className="mt-0.5" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Share a document, design, or reference with the team.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 -mr-1.5 flex items-center justify-center rounded-lg shrink-0"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div>
            <label htmlFor="link-url" className="block mb-1.5" style={labelStyle}>Link</label>
            <input
              id="link-url"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoFocus
              placeholder="Paste a link"
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              onFocus={focusIn}
              onBlur={focusOut}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="link-title" className="block mb-1.5" style={labelStyle}>
              Title <span style={{ opacity: 0.7 }}>(optional)</span>
            </label>
            <input
              id="link-title"
              type="text"
              placeholder={suggestedTitle}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              onFocus={focusIn}
              onBlur={focusOut}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="link-desc" className="block mb-1.5" style={labelStyle}>
              Note <span style={{ opacity: 0.7 }}>(optional)</span>
            </label>
            <textarea
              id="link-desc"
              rows={2}
              placeholder="What is this and when would someone need it?"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              onFocus={focusIn}
              onBlur={focusOut}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>
          {error && (
            <p className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--danger)' }}>
              <AlertTriangle size={12} /> {error}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 px-5 pt-1 pb-safe sm:pb-5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-3 sm:py-2 rounded-xl text-xs font-medium"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.url.trim()}
            className="py-3 sm:py-2 rounded-xl text-xs font-medium transition-opacity"
            style={{ background: 'var(--accent)', color: '#fff', opacity: saving || !form.url.trim() ? 0.5 : 1 }}
          >
            {saving ? 'Adding…' : 'Add link'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

// ─── tab ──────────────────────────────────────────────────────────────────────

export default function ResourcesTab({ projectId, userId, isManager }) {
  const { show: showToast } = useToast()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)   // first load only
  const [loadError, setLoadError] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [query, setQuery] = useState('')

  // Supabase reuses channels by topic — a second ResourcesTab mount (e.g. the
  // hidden desktop rail + mobile sheet) would get an already-subscribed channel
  // and throw on `.on()`. A unique suffix keeps every mount's channel separate.
  const [channelSuffix] = useState(() => Math.random().toString(36).slice(2))

  // Refetches are silent (no spinner), so realtime updates don't flash the list
  // or unmount an open modal.
  const fetchResources = useCallback(async () => {
    const { data, error } = await supabase
      .from('project_resources')
      .select(SELECT)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) setLoadError(true)
    else { setResources(data || []); setLoadError(false) }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    const t = setTimeout(fetchResources, 0)
    return () => clearTimeout(t)
  }, [projectId, fetchResources])

  useEffect(() => {
    if (!projectId) return
    const channel = supabase
      .channel(`resources:${projectId}:${channelSuffix}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_resources', filter: `project_id=eq.${projectId}` },
        () => fetchResources(),
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [projectId, fetchResources, channelSuffix])

  const handleDelete = async (resource) => {
    // .select() tells us whether a row was actually removed — RLS silently
    // blocks deletes for links you didn't create (unless you're the PM).
    const { data, error } = await supabase
      .from('project_resources')
      .delete()
      .eq('id', resource.id)
      .select('id')
    if (error) { showToast('error', error.message); return }
    if (!data || data.length === 0) {
      showToast('error', 'You can only delete links you added.')
      fetchResources()
      return
    }
    setResources((prev) => prev.filter((r) => r.id !== resource.id))
    showToast('success', 'Link removed')
  }

  const q = query.trim().toLowerCase()
  const visible = q
    ? resources.filter((r) =>
        [r.title, r.description, getDomain(r.url)].some((s) => s?.toLowerCase().includes(q)),
      )
    : resources

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading links">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[74px] rounded-xl animate-pulse"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          />
        ))}
      </div>
    )
  }

  if (loadError && resources.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <AlertTriangle size={18} style={{ color: 'var(--text-muted)' }} />
        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Couldn’t load links</p>
        <button
          type="button"
          onClick={fetchResources}
          className="text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {resources.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{resources.length}</span>{' '}
            {resources.length === 1 ? 'link' : 'links'}
          </p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}
          >
            <Plus size={13} /> Add link
          </button>
        </div>
      )}

      {resources.length > 4 && (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search links"
            aria-label="Search links"
            className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
      )}

      {resources.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 px-4 py-8 rounded-2xl text-center"
          style={{ border: '1.5px dashed var(--border)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}
          >
            <Link2 size={18} />
          </div>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>No links yet</p>
          <p className="max-w-[220px]" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Keep the documents, designs, and references your team needs in one place.
          </p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={13} /> Add a link
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="py-6 text-center" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          No links match “{query.trim()}”.
        </p>
      ) : (
        // One column in the sidebar; flows into more columns when given more room.
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
          {visible.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              canDelete={r.created_by === userId || isManager}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddLinkModal
          projectId={projectId}
          userId={userId}
          onClose={() => setShowAdd(false)}
          onCreated={(r) => setResources((prev) => [r, ...prev.filter((p) => p.id !== r.id)])}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { handleDelete(deleting); setDeleting(null) }}
        title="Delete this link?"
        message={deleting ? `“${deleting.title}” will be removed for everyone on the project.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}