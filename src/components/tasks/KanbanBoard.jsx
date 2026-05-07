import { useState } from 'react'
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
  onStatusChange,   // async (id, newStatus) — expects updateTaskStatusOptimistic
  onDragError,
}) {
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [shakeId, setShakeId]   = useState(null)

  const tasksByCol = (colId) => tasks.filter(t => t.status === colId)

  // Backlog tasks are never draggable by anyone
  const canDragTask = (task) => {
    if (task.status === 'backlog') return false
    if (isManager) return true
    return task.assigned_to === currentUser?.id
  }

  const canDropOnCol = (task, colId) => {
    // Nobody can drop INTO backlog via drag
    if (colId === 'backlog') return false
    if (isManager) return true
    return task.assigned_to === currentUser?.id
  }

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
      setShakeId(dragging.id)
      setTimeout(() => setShakeId(null), 500)
      onDragError?.(
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
      `}</style>

      <div className="flex gap-3 overflow-x-auto pb-4 h-full" style={{ minHeight: 0 }}>
        {STATUS_COLUMNS.map(col => {
          const colTasks     = tasksByCol(col.id)
          const isDragTarget = dragOver === col.id
          const isBacklogCol = col.id === 'backlog'

          return (
            <div
              key={col.id}
              className="flex flex-col shrink-0 rounded-2xl transition-all duration-150"
              style={{
                width: 272,
                background: isDragTarget ? 'var(--accent-light)' : 'var(--bg-secondary)',
                border: `1.5px solid ${isDragTarget ? 'var(--accent)' : 'var(--border)'}`,
                minHeight: 200,
              }}
              onDragOver={e => handleDragOver(e, col.id)}
              onDrop={e => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-3 shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                  <span className="text-xs font-semibold"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {col.label}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 10 }}>
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
                      draggable={draggable}
                      onDragStart={e => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={shakeId === task.id ? 'card-shake' : ''}
                      style={{
                        opacity: dragging?.id === task.id ? 0.4 : 1,
                        cursor: draggable ? 'grab' : 'default',
                        transition: 'opacity 0.15s',
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
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
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