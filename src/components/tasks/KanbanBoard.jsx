import { useState, useRef, useCallback } from 'react'
import TaskCard from './TaskCard'
import { STATUS_COLUMNS } from '../data/projectData.jsx'
import I from '../shared/Icons'

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
}) {
  // ── Shared drag state ────────────────────────────────────────────────────────
  const [dragging, setDragging]   = useState(null)
  const [dragOver, setDragOver]   = useState(null)
  const [shakeId, setShakeId]     = useState(null)

  // ── Touch-drag state (refs to avoid stale closures in move handlers) ─────────
  const touchTask      = useRef(null)   // task being touch-dragged
  const touchGhost     = useRef(null)   // floating clone element
  const touchColId     = useRef(null)   // column currently under finger
  const touchStartXY   = useRef(null)   // {x,y} where touch began
  const isTouchDragging = useRef(false) // true once we've committed to a drag

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const tasksByCol = (colId) => tasks.filter(t => t.status === colId)

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

  // ── Mouse / desktop drag handlers ────────────────────────────────────────────
  const handleDragStart = (e, task) => {
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

  // ── Touch drag handlers ───────────────────────────────────────────────────────
  // We create a floating "ghost" clone that follows the finger.
  // Column detection uses document.elementFromPoint on every touchmove.

  const createGhost = (sourceEl, x, y) => {
    const rect   = sourceEl.getBoundingClientRect()
    const ghost  = sourceEl.cloneNode(true)
    const width  = rect.width

    ghost.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${width}px;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.85;
      transform: scale(1.03) rotate(-1deg);
      box-shadow: 0 16px 40px rgba(0,0,0,0.25);
      border-radius: 12px;
      transition: transform 0.1s ease;
    `
    document.body.appendChild(ghost)
    return { ghost, offsetX: x - rect.left, offsetY: y - rect.top }
  }

  const moveGhost = (ghost, x, y, offsetX, offsetY) => {
    ghost.style.left = `${x - offsetX}px`
    ghost.style.top  = `${y - offsetY}px`
  }

  const removeGhost = () => {
    if (touchGhost.current?.ghost) {
      touchGhost.current.ghost.remove()
      touchGhost.current = null
    }
  }

  // Find the kanban column element under a point (ignoring the ghost)
  const getColUnderPoint = (x, y) => {
    // Temporarily hide ghost so elementFromPoint can see what's underneath
    const g = touchGhost.current?.ghost
    if (g) g.style.display = 'none'
    const el = document.elementFromPoint(x, y)
    if (g) g.style.display = ''

    // Walk up DOM to find a [data-col-id] attribute
    const colEl = el?.closest('[data-col-id]')
    return colEl ? colEl.getAttribute('data-col-id') : null
  }

  const handleTouchStart = useCallback((e, task) => {
    if (!canDragTask(task)) return

    const touch = e.touches[0]
    touchTask.current    = task
    touchStartXY.current = { x: touch.clientX, y: touch.clientY }
    isTouchDragging.current = false

    // Don't preventDefault here — let scroll work until intentional drag
  }, [tasks, isManager, currentUser])

  const handleTouchMove = useCallback((e) => {
    if (!touchTask.current) return

    const touch = e.touches[0]
    const dx    = touch.clientX - touchStartXY.current.x
    const dy    = touch.clientY - touchStartXY.current.y
    const dist  = Math.sqrt(dx * dx + dy * dy)

    // Start drag after moving 8px (avoids accidental drags on taps/scrolls)
    if (!isTouchDragging.current) {
      if (dist < 8) return
      isTouchDragging.current = true

      // Build ghost from the card element
      const cardEl = e.currentTarget
      const { ghost, offsetX, offsetY } = createGhost(cardEl, touchStartXY.current.x, touchStartXY.current.y)
      touchGhost.current = { ghost, offsetX, offsetY }

      setDragging(touchTask.current)
    }

    // Always prevent scroll while touch-dragging
    e.preventDefault()

    const { ghost, offsetX, offsetY } = touchGhost.current
    moveGhost(ghost, touch.clientX, touch.clientY, offsetX, offsetY)

    const colId = getColUnderPoint(touch.clientX, touch.clientY)
    touchColId.current = colId
    setDragOver(colId)
  }, [])

  const handleTouchEnd = useCallback(async (e) => {
    if (!touchTask.current) return

    const task  = touchTask.current
    const colId = touchColId.current

    // Reset all refs
    touchTask.current       = null
    touchColId.current      = null
    touchStartXY.current    = null
    isTouchDragging.current = false
    removeGhost()
    setDragging(null)
    setDragOver(null)

    if (!colId) return  // dropped outside any column

    if (!canDropOnCol(task, colId)) {
      triggerShake(
        task.id,
        colId === 'backlog'
          ? 'Tasks cannot be moved back to Backlog via drag.'
          : 'You can only move tasks assigned to you.'
      )
      return
    }

    if (task.status === colId) return  // same column, no-op

    try {
      await onStatusChange(task.id, colId)
    } catch {
      onDragError?.('Failed to update task status. Please try again.')
    }
  }, [tasks, isManager, currentUser, onStatusChange, onDragError])

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes cardShake {
          0%   { transform: translateX(0); }
          20%  { transform: translateX(-6px); }
          40%  { transform: translateX(6px); }
          60%  { transform: translateX(-4px); }
          80%  { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        .card-shake { animation: cardShake 0.45s ease; }

        /* Prevent text selection while dragging on touch */
        .kanban-board.is-dragging * {
          user-select: none;
          -webkit-user-select: none;
        }
      `}</style>

      <div
        className={`kanban-board flex gap-3 overflow-x-auto pb-4 h-full${dragging ? ' is-dragging' : ''}`}
        style={{ minHeight: 0 }}
      >
        {STATUS_COLUMNS.map(col => {
          const colTasks     = tasksByCol(col.id)
          const isDragTarget = dragOver === col.id
          const isBacklogCol = col.id === 'backlog'

          return (
            <div
              key={col.id}
              data-col-id={col.id}                      // ← used by touch detection
              className="flex flex-col shrink-0 rounded-2xl transition-all duration-150"
              style={{
                width: 272,
                background: isDragTarget ? 'var(--accent-light)' : 'var(--bg-secondary)',
                border: `1.5px solid ${isDragTarget ? 'var(--accent)' : 'var(--border)'}`,
                minHeight: 200,
              }}
              // Desktop drop target events
              onDragOver={e => handleDragOver(e, col.id)}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-3 shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                  >
                    {col.label}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 10 }}
                  >
                    {colTasks.length}
                  </span>
                </div>
                {canAddTasks && (
                  <button
                    onClick={() => onAddTask(col.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
                    style={{ color: 'var(--text-muted)', background: 'var(--bg-primary)' }}
                    title={`Add task to ${col.label}`}
                  >
                    {I.plus}
                  </button>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colTasks.length === 0 && (
                  <div
                    className="flex items-center justify-center py-8 rounded-xl border border-dashed"
                    style={{
                      borderColor: isDragTarget ? 'var(--accent)' : 'var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <p className="text-xs">
                      {isBacklogCol ? 'Tasks auto-assigned here' : 'Drop tasks here'}
                    </p>
                  </div>
                )}

                {colTasks.map(task => {
                  const draggable = canDragTask(task)
                  return (
                    <div
                      key={task.id}
                      // ── Desktop ──────────────────────────────────────
                      draggable={draggable}
                      onDragStart={e => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      // ── Touch / mobile ───────────────────────────────
                      onTouchStart={draggable ? (e => handleTouchStart(e, task)) : undefined}
                      onTouchMove={draggable ? handleTouchMove : undefined}
                      onTouchEnd={draggable ? handleTouchEnd : undefined}
                      // ────────────────────────────────────────────────
                      className={shakeId === task.id ? 'card-shake' : ''}
                      style={{
                        opacity:    dragging?.id === task.id ? 0.4 : 1,
                        cursor:     draggable ? 'grab' : 'default',
                        transition: 'opacity 0.15s',
                        // Prevents iOS long-press callout interfering with drag
                        WebkitTouchCallout: draggable ? 'none' : 'default',
                        touchAction: draggable ? 'none' : 'auto',
                      }}
                    >
                      <TaskCard task={task} members={members} onClick={onTaskClick} />
                    </div>
                  )
                })}
              </div>

              {/* Add task footer — Backlog only, PM only */}
              {canAddTasks && isManager && col.id === 'backlog' && (
                <button
                  onClick={() => onAddTask(col.id)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium transition-colors shrink-0 rounded-b-2xl"
                  style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color      = 'var(--accent)'
                    e.currentTarget.style.background = 'var(--accent-light)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color      = 'var(--text-muted)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {I.plus} Add task
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}