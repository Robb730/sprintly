import { useState, useRef, useCallback } from 'react'
import TaskCard from './TaskCard'
import { STATUS_COLUMNS } from '../data/projectData.jsx'
import I from '../shared/Icons'
import BulkActionBar from '../shared/BulkActionBar'
import { Check } from 'lucide-react'

export default function KanbanBoard({
  tasks,
  members,
  onTaskClick,
  onAddTask,
  canAddTasks,
  currentUser,
  isManager,
  onStatusChange,
  onDragError,
  groupBy = 'none',
}) {
  const [dragging, setDragging]   = useState(null)
  const [dragOver, setDragOver]   = useState(null)
  const [shakeId, setShakeId]     = useState(null)
  const [selected, setSelected] = useState(new Set())

  const touchTask      = useRef(null)
  const touchGhost     = useRef(null)
  const touchColId     = useRef(null)
  const touchStartXY   = useRef(null)
  const isTouchDragging = useRef(false)
  const longPressTimer = useRef(null)

  const tasksByCol = (colId, list = tasks) => list.filter(t => t.status === colId)

  const canDragTask = (task) => {
    if (task.status === 'backlog') return false
    if (isManager) return true
    return task.assigned_to === currentUser?.id
  }

  const canDropOnCol = (task, colId) => {
    if (colId === 'backlog') return false
    if (isManager) return true
    return task.assigned_to === currentUser?.id
  }

  const triggerShake = (id, msg) => {
    setShakeId(id)
    setTimeout(() => setShakeId(null), 500)
    onDragError?.(msg)
  }

  const handleDragStart = (e, task) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      toggleSelect(task.id)
      return
    }
    if (!canDragTask(task)) { e.preventDefault(); return }
    setDragging(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, colId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = (dragging && canDropOnCol(dragging, colId)) ? 'move' : 'none'
    setDragOver(colId)
  }

  const handleDrop = async (e, colId) => {
    e.preventDefault()
    setDragOver(null)
    if (!dragging) return

    if (!canDropOnCol(dragging, colId)) {
      triggerShake(
        dragging.id,
        colId === 'backlog'
          ? 'Tasks cannot be moved back to Backlog via drag.'
          : 'You can only move tasks assigned to you.'
      )
      setDragging(null)
      return
    }

    if (dragging.status === colId) { setDragging(null); return }

    const taskToMove = dragging
    setDragging(null)
    try {
      await onStatusChange(taskToMove.id, colId)
    } catch {
      onDragError?.('Failed to update task status. Please try again.')
    }
  }

  const handleDragEnd = () => { setDragging(null); setDragOver(null) }

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Swallow the synthetic click that follows a long-press or a touch drag,
  // otherwise it immediately undoes the selection / reopens the task.
  const suppressClick = useRef(false)

  // Touch drag handlers (simplified)
  const createGhost = (sourceEl, x, y) => {
    const rect = sourceEl.getBoundingClientRect()
    const ghost = sourceEl.cloneNode(true)
    ghost.style.cssText = `
      position: fixed; top: ${rect.top}px; left: ${rect.left}px; width: ${rect.width}px;
      z-index: 9999; pointer-events: none; opacity: 0.85;
      transform: scale(1.03) rotate(-1deg); box-shadow: 0 16px 40px rgba(0,0,0,0.25);
      border-radius: 12px; transition: transform 0.1s ease;
    `
    document.body.appendChild(ghost)
    return { ghost, offsetX: x - rect.left, offsetY: y - rect.top }
  }

  const removeGhost = () => {
    if (touchGhost.current?.ghost) {
      touchGhost.current.ghost.remove()
      touchGhost.current = null
    }
  }

  const getColUnderPoint = (x, y) => {
    const g = touchGhost.current?.ghost
    if (g) g.style.display = 'none'
    const el = document.elementFromPoint(x, y)
    if (g) g.style.display = ''
    const colEl = el?.closest('[data-col-id]')
    return colEl ? colEl.getAttribute('data-col-id') : null
  }

  const handleTouchStart = useCallback((e, task) => {
    if (!canDragTask(task)) return
    const touch = e.touches[0]
    touchTask.current = task
    touchStartXY.current = { x: touch.clientX, y: touch.clientY }
    isTouchDragging.current = false

    // Long-press for selection (500ms)
    longPressTimer.current = setTimeout(() => {
      suppressClick.current = true
      toggleSelect(task.id)
      touchTask.current = null
    }, 500)
  }, [tasks, isManager, currentUser])

  const handleTouchMove = useCallback((e) => {
    if (!touchTask.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStartXY.current.x
    const dy = touch.clientY - touchStartXY.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 8 && !isTouchDragging.current) {
      // Vertical swipes scroll the board; only horizontal movement starts a drag.
      if (Math.abs(dy) > Math.abs(dx)) {
        clearTimeout(longPressTimer.current)
        touchTask.current = null
        return
      }
      clearTimeout(longPressTimer.current)
      isTouchDragging.current = true
      const cardEl = e.currentTarget
      const { ghost, offsetX, offsetY } = createGhost(cardEl, touchStartXY.current.x, touchStartXY.current.y)
      touchGhost.current = { ghost, offsetX, offsetY }
      setDragging(touchTask.current)
    }
    if (isTouchDragging.current) {
      e.preventDefault()
      const { ghost, offsetX, offsetY } = touchGhost.current
      ghost.style.left = `${touch.clientX - offsetX}px`
      ghost.style.top = `${touch.clientY - offsetY}px`
      const colId = getColUnderPoint(touch.clientX, touch.clientY)
      touchColId.current = colId
      setDragOver(colId)
    }
  }, [])

  const handleTouchEnd = useCallback(async () => {
    clearTimeout(longPressTimer.current)
    if (!touchTask.current) return
    const task = touchTask.current
    const colId = touchColId.current
    touchTask.current = null
    touchColId.current = null
    touchStartXY.current = null
    const wasDragging = isTouchDragging.current
    isTouchDragging.current = false
    if (wasDragging) suppressClick.current = true
    removeGhost()
    setDragging(null)
    setDragOver(null)

    if (!colId || !wasDragging) return
    if (!canDropOnCol(task, colId)) {
      triggerShake(task.id, colId === 'backlog' ? 'Tasks cannot be moved back to Backlog via drag.' : 'You can only move tasks assigned to you.')
      return
    }
    if (task.status === colId) return
    try {
      await onStatusChange(task.id, colId)
    } catch {
      onDragError?.('Failed to update task status. Please try again.')
    }
  }, [tasks, isManager, currentUser, onStatusChange, onDragError])

  // Build swimlanes
  const swimlanes = groupBy === 'assignee'
    ? (() => {
        const lanes = new Map()
        lanes.set('unassigned', { id: 'unassigned', label: 'Unassigned', members: [] })
        for (const m of members) lanes.set(m.id, { id: m.id, label: m.name, members: [m] })
        const grouped = {}
        for (const lane of lanes.values()) grouped[lane.id] = []
        for (const t of tasks) {
          const ids = Array.isArray(t.assignees) && t.assignees.length ? t.assignees : t.assigned_to ? [t.assigned_to] : []
          if (!ids.length) grouped.unassigned.push(t)
          else for (const id of ids) { if (grouped[id]) grouped[id].push(t) }
        }
        return { lanes: [...lanes.values()], grouped }
      })()
    : null

  const renderColumns = (taskList) => (
    <div className="flex gap-3">
      {STATUS_COLUMNS.map(col => {
        const colTasks = tasksByCol(col.id, taskList)
        const isDragTarget = dragOver === col.id
        const isBacklogCol = col.id === 'backlog'
        return (
          <div
            key={col.id}
            data-col-id={col.id}
            className="flex flex-col shrink-0 rounded-2xl transition-all duration-150"
            style={{
              width: 'min(272px, 82vw)',
              scrollSnapAlign: 'start',
              background: isDragTarget ? 'var(--accent-light)' : 'var(--bg-secondary)',
              border: `1.5px solid ${isDragTarget ? 'var(--accent)' : 'var(--border)'}`,
              minHeight: 160,
            }}
            onDragOver={e => handleDragOver(e, col.id)}
            onDrop={e => handleDrop(e, col.id)}
          >
            <div className="flex items-center justify-between px-3 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{col.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 10 }}>{colTasks.length}</span>
              </div>
              {canAddTasks && (
                <button onClick={() => onAddTask(col.id)} className="w-9 h-9 -my-1.5 flex items-center justify-center rounded-lg transition-all hover:opacity-80" style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }} title={`Add task to ${col.label}`} aria-label={`Add task to ${col.label}`}>
                  {I.plus}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {colTasks.length === 0 && (
                <div className="flex items-center justify-center py-6 rounded-xl border border-dashed" style={{ borderColor: isDragTarget ? 'var(--accent)' : 'var(--border)', color: 'var(--text-muted)' }}>
                  <p className="text-xs">{isBacklogCol ? 'Tasks auto-assigned here' : 'Drop tasks here'}</p>
                </div>
              )}
              {colTasks.map(task => {
                const draggable = canDragTask(task)
                const isSelected = selected.has(task.id)
                return (
                  <div
                    key={task.id}
                    draggable={draggable}
                    onDragStart={e => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={draggable ? (e => handleTouchStart(e, task)) : undefined}
                    onTouchMove={draggable ? handleTouchMove : undefined}
                    onTouchEnd={draggable ? handleTouchEnd : undefined}
                    onTouchCancel={draggable ? handleTouchEnd : undefined}
                    className={shakeId === task.id ? 'card-shake' : ''}
                    style={{
                      opacity: dragging?.id === task.id ? 0.4 : 1,
                      cursor: draggable ? 'grab' : 'default',
                      transition: 'opacity 0.15s',
                      WebkitTouchCallout: draggable ? 'none' : 'default',
                      touchAction: draggable ? 'pan-y' : 'auto',
                      outline: isSelected ? '2px solid var(--accent)' : 'none',
                      borderRadius: 'var(--radius-lg)',
                    }}
                    onClick={(e) => {
                      if (suppressClick.current) { suppressClick.current = false; e.stopPropagation(); return }
                      if (e.ctrlKey || e.metaKey) { e.stopPropagation(); toggleSelect(task.id) }
                      else if (selected.size > 0) { e.stopPropagation(); toggleSelect(task.id) }
                      else { onTaskClick(task) }
                    }}
                  >
                    <TaskCard task={task} members={members} onClick={() => { if (selected.size === 0) onTaskClick(task) }} />
                  </div>
                )
              })}
            </div>
            {canAddTasks && isManager && col.id === 'backlog' && (
              <button onClick={() => onAddTask(col.id)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium transition-colors shrink-0 rounded-b-2xl" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                {I.plus} Add task
              </button>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes cardShake { 0% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } 100% { transform: translateX(0); } }
        .card-shake { animation: cardShake 0.45s ease; }
        .kanban-board.is-dragging * { user-select: none; -webkit-user-select: none; }
      `}</style>

      {swimlanes ? (
        <div className="flex flex-col gap-4">
          {swimlanes.lanes.map(lane => {
            const laneTasks = swimlanes.grouped[lane.id] || []
            if (laneTasks.length === 0 && lane.id !== 'unassigned') return null
            return (
              <div key={lane.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-white font-semibold" style={{ background: 'var(--accent)', fontSize: 9 }}>
                    {lane.label.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{lane.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 10 }}>{laneTasks.length}</span>
                </div>
                <div className="p-3 overflow-x-auto kanban-scroll">{renderColumns(laneTasks)}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className={`kanban-board kanban-scroll flex gap-3 overflow-x-auto pb-4 h-full${dragging ? ' is-dragging' : ''}`} style={{ minHeight: 0 }}>
          {renderColumns(tasks)}
        </div>
      )}

      <BulkActionBar
        selectedCount={selected.size}
        onClear={() => setSelected(new Set())}
        actions={[
          { label: 'Done', icon: <Check size={12} />, onClick: async () => { for (const id of selected) await onStatusChange(id, 'done'); setSelected(new Set()) } },
          { label: 'To Do', onClick: async () => { for (const id of selected) await onStatusChange(id, 'todo'); setSelected(new Set()) } },
        ]}
      />
    </>
  )
}