import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../utils/supabase'

export interface TaskComment {
  id: string
  message: string
  from_id: string
  task_id: string
  created_at: string | Date
  deleted_at?: string | Date | null
  profile?: {
    username: string
    avatar_url?: string | null
    user_id: string
  }
}

const COMMENTS_TABLE = 'comments'
const PROFILES_TABLE = 'profiles'

// Fetch comments for a task with profile data
export const getCommentsByTask = async (taskId: string): Promise<TaskComment[]> => {
  // Get comments (not deleted)
  const { data: comments, error } = await supabase
    .from(COMMENTS_TABLE)
    .select('id, message, from_id, task_id, created_at, deleted_at')
    .eq('task_id', taskId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error

  if (!comments || comments.length === 0) return []

  // Fetch profiles for distinct from_ids
  const userIds = Array.from(new Set(comments.map(c => c.from_id)))
  const { data: profiles, error: profileErr } = await supabase
    .from(PROFILES_TABLE)
    .select('user_id, username, avatar_url')
    .in('user_id', userIds)

  if (profileErr) throw profileErr

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]))

  return comments.map(c => ({
    ...c,
    profile: profileMap.get(c.from_id) || undefined,
  }))
}

// Add a new comment
export const addComment = async (taskId: string, message: string, fromId: string): Promise<TaskComment> => {
  const newComment = {
    id: uuidv4(),
    message,
    from_id: fromId,
    task_id: taskId,
    created_at: new Date().toISOString(),
    deleted_at: null as string | null,
  }

  const { data, error } = await supabase
    .from(COMMENTS_TABLE)
    .insert(newComment)
    .select()
    .single()

  if (error) throw error

  return data as TaskComment
}

// Soft delete a comment (mark deleted_at)
export const deleteComment = async (commentId: string): Promise<void> => {
  const { error } = await supabase
    .from(COMMENTS_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) throw error
}
