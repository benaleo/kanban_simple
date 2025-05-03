import { toast } from 'vue-sonner';
import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'vue-router';
import type { Task } from '@/types/kanban.type';

// Table name in Supabase
const TASKS_TABLE = 'tasks';
const PROJECT_USERS_TABLE = 'project_has_users';
const PROJECTS_TABLE = 'projects';

// Router
const router = useRouter();

/**
 * Fetch all tasks from Supabase
 * @param projectId Optional project ID to filter tasks
 */
export const getTasks = async (projectId?: string): Promise<Task[]> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // is owner project
  console.log("running check project")
  const { data: projectData } = await supabase
    .from(PROJECTS_TABLE)
    .select('*')
    .eq('id', projectId)
    .single();

  const isOwner = projectData.user_id === userData.user.id;

  // is invited user in project
  console.log("running check invited")
  const { data: projectUserData } = await supabase
    .from(PROJECT_USERS_TABLE)
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userData.user.id)
    .single();

  const isInvited = projectUserData !== null;
  console.log("isOwner", isOwner);
  console.log("isInvited", isInvited);

  if (!isOwner && !isInvited) {
    router.push('/');
    toast.error('You are not allowed to access this project');
  }

  let query = supabase
    .from(TASKS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  // Filter by project_id if provided
  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  // Convert string dates to Date objects
  return data?.map(task => ({
    ...task,
    created_at: new Date(task.created_at)
  })) || [];
};

/**
 * Create a new task in Supabase
 */
export const createTask = async (task: Omit<Task, 'id' | 'created_at'>): Promise<Task> => {
  const newTask = {
    id: uuidv4(),
    ...task,
    created_at: new Date()
  };

  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .insert(newTask)
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  return {
    ...data,
    created_at: new Date(data.created_at)
  };
};

/**
 * Update an existing task in Supabase
 */
export const updateTask = async (taskId: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task> => {
  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  return {
    ...data,
    created_at: new Date(data.created_at)
  };
};

/**
 * Delete a task from Supabase
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase
    .from(TASKS_TABLE)
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Update task status (when dragging between columns)
 */
export const updateTaskStatus = async (taskId: string, status: string): Promise<Task> => {
  return updateTask(taskId, { status });
};
