import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, MessageSquare, Loader2 } from 'lucide-react'
import { useComments } from '../../hooks/useComments'
import { getAvatarColor, getInitials } from '../data/projectData'

function formatDateTime(iso) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  let relative
  if (diffMins < 1) relative = 'just now'
  else if (diffMins < 60) relative = `${diffMins}m ago`
  else if (diffHours < 24) relative = `${diffHours}h ago`
  else if (diffDays < 7) relative = `${diffDays}d ago`
  else relative = date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

  const absolute = date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return { relative, absolute }
}

export default function CommentsSection({ taskId, currentUser }) {
  const { comments, loading, addComment, deleteComment } = useComments(taskId)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (comments.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments.length])

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await addComment(taskId, currentUser.id, text)
      setText('')
      textareaRef.current?.focus()
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const authorName = (comment) =>
    comment.author?.display_name || comment.author?.email || 'Unknown'

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare size={13} style={{ color: 'var(--text-muted)' }} />
        <span
          className="text-xs font-semibold"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          Comments
        </span>
        {comments.length > 0 && (
          <span
            className="px-1.5 py-0.5 rounded-md font-medium text-xs"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 10 }}
          >
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : comments.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-6 rounded-xl gap-2"
          style={{ border: '1px dashed var(--border)', background: 'var(--bg-primary)' }}
        >
          <MessageSquare size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No comments yet. Be the first!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isOwn = comment.user_id === currentUser?.id
            const name = authorName(comment)
            const { relative, absolute } = formatDateTime(comment.created_at)

            return (
              <div
                key={comment.id}
                className="flex gap-2.5 group"
              >
                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold shrink-0 mt-0.5"
                  style={{ background: getAvatarColor(name), fontSize: 8 }}
                >
                  {getInitials(name)}
                </div>

                {/* Bubble */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {isOwn ? 'You' : name}
                    </span>
                    <span
                      className="text-xs cursor-default"
                      style={{ color: 'var(--text-muted)', fontSize: 10 }}
                      title={absolute}
                    >
                      {relative}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--text-muted)', fontSize: 9, opacity: 0.7 }}
                    >
                      · {absolute}
                    </span>
                  </div>
                  <div
                    className="px-3 py-2 rounded-xl rounded-tl-sm text-xs leading-relaxed relative"
                    style={{
                      background: isOwn ? 'var(--accent-light)' : 'var(--bg-primary)',
                      border: `1px solid ${isOwn ? 'rgba(37,99,235,0.2)' : 'var(--border)'}`,
                      color: 'var(--text-primary)',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {comment.content}

                    {/* Delete button — shown on hover for own comments */}
                    {isOwn && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: '#dc2626',
                          color: '#fff',
                          border: '1.5px solid var(--bg-card)',
                        }}
                        title="Delete comment"
                      >
                        <Trash2 size={9} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div
        className="flex gap-2 items-end rounded-xl p-2"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--bg-primary)',
        }}
      >
        {/* Current user avatar */}
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold shrink-0"
          style={{
            background: getAvatarColor(
              currentUser?.user_metadata?.display_name || currentUser?.email || 'U'
            ),
            fontSize: 8,
            marginBottom: 2,
          }}
        >
          {getInitials(currentUser?.user_metadata?.display_name || currentUser?.email || 'U')}
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment… (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="flex-1 resize-none text-xs outline-none bg-transparent leading-relaxed"
          style={{
            color: 'var(--text-primary)',
            minHeight: 24,
            maxHeight: 96,
            fontFamily: 'inherit',
            // Auto-grow trick via JS
          }}
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-all"
          style={{
            background: text.trim() ? 'var(--accent)' : 'var(--bg-card)',
            color: text.trim() ? '#fff' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            opacity: submitting ? 0.6 : 1,
          }}
          title="Send comment"
        >
          {submitting
            ? <Loader2 size={12} className="animate-spin" />
            : <Send size={12} />
          }
        </button>
      </div>

      {error && (
        <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>
      )}
    </div>
  )
}