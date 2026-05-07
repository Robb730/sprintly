import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/activity'

const TASK_SELECT = `
  *,
  assignee:profiles_with_email!tasks_assigned_to_fkey (id, display_name, email)
`

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)
  const fetchTasksRef = useRef(null)

  const fetchTasks = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Tasks error:', JSON.stringify(error, null, 2))
      setError(error)
      setLoading(false)
      return
    }

    if (!mountedRef.current) return
    setTasks(data || [])
    setLoading(false)
  }, [projectId])

  fetchTasksRef.current = fetchTasks

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!projectId) return
    fetchTasks()

    const sub = supabase
      .channel(`tasks:${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`,
      }, () => { fetchTasksRef.current?.() })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [projectId])

  const createTask = useCallback(async (taskData, userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select(TASK_SELECT)
      .single()

    if (error) throw error
    setTasks(prev => [data, ...prev])

    if (userId) {
      logActivity(projectId, userId, 'task_created', {
        task_id: data.id,
        task_title: data.title,
      })
    }

    return data
  }, [projectId])

  const updateTask = useCallback(async (id, updates, userId, oldTask) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(TASK_SELECT)
      .single()

    if (error) throw error
    if (!data) throw new Error('Update blocked — check RLS policy on tasks table')

    setTasks(prev => prev.map(t => t.id === id ? data : t))

    if (userId && oldTask) {
      // Build a human-readable list of what changed
      const changes = []
      if (updates.status && updates.status !== oldTask.status) {
        changes.push(`status: ${oldTask.status} → ${updates.status}`)
      }
      if (updates.priority && updates.priority !== oldTask.priority) {
        changes.push(`priority: ${oldTask.priority} → ${updates.priority}`)
      }
      if (updates.due_date !== undefined && updates.due_date !== oldTask.due_date) {
        changes.push(`due date updated`)
      }
      if (updates.assigned_to !== undefined && updates.assigned_to !== oldTask.assigned_to) {
        changes.push(`assignee changed`)
      }
      if (updates.title && updates.title !== oldTask.title) {
        changes.push(`renamed to "${updates.title}"`)
      }

      if (changes.length > 0) {
        logActivity(projectId, userId, 'task_updated', {
          task_id: data.id,
          task_title: data.title,
          status: data.status,
          changes,
        })
      }
    }

    return data
  }, [projectId])

  const updateTaskStatusOptimistic = useCallback(async (id, newStatus, userId) => {
    const oldTask = tasks.find(t => t.id === id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)
      .select(TASK_SELECT)
      .single()

    if (error) {
      console.error('Status update failed, rolling back:', error)
      await fetchTasksRef.current?.()
      throw error
    }

    setTasks(prev => prev.map(t => t.id === id ? data : t))

    if (userId && oldTask) {
      logActivity(projectId, userId, 'task_status_changed', {
        task_id: data.id,
        task_title: data.title,
        old_status: oldTask.status,
        new_status: newStatus,
      })
    }

    return data
  }, [projectId, tasks])

  const deleteTask = useCallback(async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete failed:', JSON.stringify(error, null, 2))
      throw error
    }
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  return { tasks, loading, error, createTask, updateTask, updateTaskStatusOptimistic, deleteTask, refetch: fetchTasks }
}