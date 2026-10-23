import { useState, useRef, useEffect } from 'react'

export default function InlineEdit({ value, onSave, placeholder = 'Click to edit', className = '', style = {}, inputStyle = {}, type = 'text', multiline = false }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commit = async () => {
    setEditing(false)
    if (draft !== value) {
      try {
        await onSave?.(draft)
      } catch {
        setDraft(value || '')
      }
    }
  }

  const cancel = () => {
    setDraft(value || '')
    setEditing(false)
  }

  if (editing) {
    const Tag = multiline ? 'textarea' : 'input'
    return (
      <Tag
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) commit()
          if (e.key === 'Escape') cancel()
        }}
        className={className}
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--accent)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 8px',
          outline: 'none',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          width: '100%',
          resize: multiline ? 'vertical' : 'none',
          ...inputStyle,
        }}
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={className}
      style={{
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: 'var(--radius-sm)',
        transition: 'background var(--transition-fast)',
        display: 'inline-block',
        minWidth: '40px',
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      title="Click to edit"
    >
      {value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  )
}