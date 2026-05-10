import { useState } from 'react'
import { PRIORITY_META } from '../data/projectData.jsx'
import Button from '../shared/Button'
import I from '../shared/Icons'
import AssigneePicker from "../shared/AssigneePicker.jsx";

export default function CreateTaskModal({ onClose, onCreate, members, sprints = [], milestones = [], defaultSprintId = '' }) {
  const [form, setForm] = useState({
  title:        "",
  description:  "",
  priority:     "medium",
  assignees:    [],           // ← was: assigned_to: ''
  due_date:     "",
  sprint_id:    defaultSprintId || sprints.find((s) => s.status === "active")?.id || "",
  milestone_id: "",
});
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setError('') }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Task title is required.'); return }
    setLoading(true)

    // Auto-status: needs both assignee AND due_date to be 'todo', otherwise backlog
    const resolvedStatus = (form.assignees.length > 0 && form.due_date) ? "todo" : "backlog";

    try {
      await onCreate?.({
        title:        form.title.trim(),
        description:  form.description.trim() || null,
        status:       resolvedStatus,
        priority:     form.priority,
        assigned_to:  form.assignees[0] || null,
        assignees:    form.assignees,  
        due_date:     form.due_date     || null,
        sprint_id:    form.sprint_id    || null,
        milestone_id: form.milestone_id || null,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls   = "w-full px-3 py-2.5 rounded-xl text-xs outline-none transition-all"
  const inputStyle = { background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
  const focusIn    = e => e.target.style.borderColor = 'var(--accent)'
  const focusOut   = e => e.target.style.borderColor = 'var(--border)'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-up opacity-0"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            New Task
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}
          >
            {I.close}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 max-h-[75vh] overflow-y-auto">

          {/* Title */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="What needs to be done?"
              className={inputCls}
              style={inputStyle}
              onFocus={focusIn}
              onBlur={focusOut}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Description <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Add more details…"
              rows={3}
              className={`${inputCls} resize-none`}
              style={inputStyle}
              onFocus={focusIn}
              onBlur={focusOut}
            />
          </div>

          {/* Priority (full width) */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Priority</label>
            <div className="flex gap-1">
              {Object.entries(PRIORITY_META).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('priority', key)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: form.priority === key ? meta.bg : 'var(--bg-primary)',
                    color:      form.priority === key ? meta.text : 'var(--text-muted)',
                    border:     `1px solid ${form.priority === key ? meta.dot + '60' : 'var(--border)'}`,
                  }}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee + Sprint */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Assignee/s</label>
              <AssigneePicker
    members={members}
    selected={form.assignees}
    onChange={(ids) => set("assignees", ids)}
  />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Sprint</label>
              <select
                value={form.sprint_id}
                onChange={e => set('sprint_id', e.target.value)}
                className={inputCls}
                style={{ ...inputStyle, appearance: 'none' }}
                onFocus={focusIn}
                onBlur={focusOut}
              >
                <option value="">No sprint</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          </div>

          {/* Due Date + Milestone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                className={inputCls}
                style={inputStyle}
                onFocus={focusIn}
                onBlur={focusOut}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Milestone</label>
              <select
                value={form.milestone_id}
                onChange={e => set('milestone_id', e.target.value)}
                className={inputCls}
                style={{ ...inputStyle, appearance: 'none' }}
                onFocus={focusIn}
                onBlur={focusOut}
              >
                <option value="">No milestone</option>
                {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
          </div>

          {/* Hint */}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Tasks without an assignee or due date are automatically added to the Backlog.
          </p>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)' }}
            >
              {I.warn} {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" variant="primary" size="sm" loading={loading} className="flex-1">Create Task</Button>
          </div>
        </form>
      </div>
    </div>
  )
}