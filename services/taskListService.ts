import { supabase } from '../utils/supabase'

export const getTaskLists = async (taskId: string) => {
  const { data, error } = await supabase
    .from('task_list')
    .select('*')
    .eq('task_id', taskId)
    .order('ts', { ascending: true })

  if (error) throw error
  return data
}

export const createTaskListItem = async (taskId: string, name: string, is_checked: boolean) => {
  const { data, error } = await supabase
    .from('task_list')
    .insert([{ task_id: taskId, name, is_checked }])
    .select()

  if (error) throw error
  return data[0]
}

export const updateTaskListItem = async (id: string, updates: { name?: string; is_checked?: boolean }) => {
  const { data, error } = await supabase
    .from('task_list')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

export const deleteTaskListItem = async (id: string) => {
  const { error } = await supabase
    .from('task_list')
    .delete()
    .eq('id', id)

  if (error) throw error
}
