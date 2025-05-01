import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';

// Define Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: Date;
  start_task?: Date | null;
  end_task?: Date | null;
}

// Table name in Supabase
const TASKS_TABLE = 'tasks';

/**
 * Fetch all tasks from Supabase
 */
export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from(TASKS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

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
