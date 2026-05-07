import { supabase } from './supabase'

export async function logActivity(projectId, userId, action, metadata = {}) {
  const { error } = await supabase
    .from('project_activity')
    .insert({ project_id: projectId, user_id: userId, action, metadata })

  if (error) console.error('Activity log failed:', error.message)
  // fire-and-forget — never throw, never block the main action
}