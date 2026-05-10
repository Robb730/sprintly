import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    // 1. Projects where user is manager
    const { data: managerProjects } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)
      .eq('role', 'manager')

    const managerProjectIds = (managerProjects || []).map(p => p.project_id)

    // 2. All projects user is in
    const { data: allMemberships } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)

    const allProjectIds = (allMemberships || []).map(p => p.project_id)

    const notifs = []

    // 3. Manager notifications: tasks in 'in_review' or 'done'
    //    Join assignees via a separate profiles fetch
    if (managerProjectIds.length > 0) {
      const { data: reviewTasks, error: reviewError } = await supabase
        .from('tasks')
        .select(`
          id, title, status, project_id, created_at, assigned_to,
          assignee:profiles_with_email!tasks_assigned_to_fkey(display_name, email)
        `)
        .in('project_id', managerProjectIds)
        .in('status', ['in_review', 'done'])
        .order('created_at', { ascending: false })
        .limit(20)

      if (reviewError) console.error('reviewError:', reviewError)

      for (const t of reviewTasks || []) {
        const assigneeName = t.assignee?.display_name
          || t.assignee?.email?.split('@')[0]
          || 'Someone'

        const statusLabel = t.status === 'done' ? 'Done' : 'In Review'
        const emoji = t.status === 'done' ? '✅' : '👀'

        notifs.push({
          id: `task-${t.id}`,
          type: t.status === 'done' ? 'task_done' : 'task_review',
          title: t.status === 'done'
            ? `${assigneeName} completed a task`
            : `${assigneeName} submitted a task for review`,
          body: `"${t.title}"`,
          sub: t.status === 'done'
            ? `Marked as Done — ready to close out.`
            : `Moved to In Review — your approval may be needed.`,
          time: t.created_at,
          projectId: t.project_id,
          taskId: t.id,
        })
      }
    }

    // 4. Comment notifications: comments on tasks assigned to me, not by me
    if (allProjectIds.length > 0) {
      const { data: myTasks } = await supabase
        .from('tasks')
        .select('id, title, assignees, assigned_to')
        .in('project_id', allProjectIds)

      const myTaskIds = (myTasks || [])
        .filter(t =>
          t.assigned_to === userId ||
          (Array.isArray(t.assignees) && t.assignees.includes(userId))
        )
        .map(t => t.id)

      const myTaskMap = Object.fromEntries((myTasks || []).map(t => [t.id, t]))

      if (myTaskIds.length > 0) {
        const { data: comments } = await supabase
          .from('comments')
          .select('id, content, created_at, task_id, user_id, author:profiles_with_email!comments_user_id_fkey(display_name, email)')
          .in('task_id', myTaskIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)

        for (const c of comments || []) {
          const task = myTaskMap[c.task_id]
          const authorName = c.author?.display_name
            || c.author?.email?.split('@')[0]
            || 'Someone'
          const preview = c.content.length > 80
            ? c.content.slice(0, 80) + '…'
            : c.content

          notifs.push({
            id: `comment-${c.id}`,
            type: 'comment',
            title: `${authorName} commented on a task`,
            body: `"${task?.title || 'a task'}"`,
            sub: `"${preview}"`,
            time: c.created_at,
            taskId: c.task_id,
          })
        }
      }
    }

    notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
    setNotifications(notifs.slice(0, 30))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    if (!userId) return
    const sub = supabase
      .channel('notifications-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, fetch)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, fetch)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [userId, fetch])

  return { notifications, loading, refetch: fetch }
}