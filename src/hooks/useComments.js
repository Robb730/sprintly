import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const COMMENT_SELECT = `
  *,
  author:profiles_with_email!comments_user_id_fkey (id, display_name, email)
`

export function useComments(taskId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchComments = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('comments')
      .select(COMMENT_SELECT)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (!error) setComments(data || [])
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    if (!taskId) return
    fetchComments()

    const sub = supabase
      .channel(`comments:${taskId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `task_id=eq.${taskId}`,
      }, fetchComments)
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [taskId, fetchComments])

  const addComment = useCallback(async (taskId, userId, content) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: userId, content: content.trim() })
      .select(COMMENT_SELECT)
      .single()

    if (error) throw error
    setComments(prev => [...prev, data])
    return data
  }, [])

  const deleteComment = useCallback(async (commentId) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
    setComments(prev => prev.filter(c => c.id !== commentId))
  }, [])

  return { comments, loading, addComment, deleteComment }
}