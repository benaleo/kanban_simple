import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from './authService';
import type { User } from '@supabase/supabase-js';

// Define Column interface
export interface Column {
  id: string;
  name: string;
  project_id: string;
  created_at: Date;
  order: number;
}

// Table name in Supabase
const COLUMNS_TABLE = 'task_columns';
const TASKS_TABLE = 'tasks';

/**
 * Fetch all columns for a specific project
 */
export const getColumns = async (projectId: string): Promise<Column[]> => {
  const { data, error } = await supabase
    .from(COLUMNS_TABLE)
    .select('*')
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching columns:', error);
    throw error;
  }

  // Convert string dates to Date objects
  return data?.map(column => ({
    ...column,
    created_at: new Date(column.created_at)
  })) || [];
};

/**
 * Create a new column
 */
export const createColumn = async (
  projectId: string, 
  columnData: { name: string, order?: number }
): Promise<Column> => {
w  // Get max order to place new column at the end if not specified
  let order = columnData.order;
  if (order === undefined) {
    const { data: maxOrderData, error: maxOrderError } = await supabase
      .from(COLUMNS_TABLE)
      .select('order')
      .eq('project_id', projectId)
      .order('order', { ascending: false })
      .limit(1);

    if (maxOrderError) {
      console.error('Error getting max order:', maxOrderError);
      throw maxOrderError;
    }

    order = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].order + 1 : 0;
  }

  const newColumn = {
    id: uuidv4(),
    name: columnData.name,
    project_id: projectId,
    created_at: new Date(),
    order
  };

  const { data, error } = await supabase
    .from(COLUMNS_TABLE)
    .insert(newColumn)
    .select()
    .single();

  if (error) {
    console.error('Error creating column:', error);
    throw error;
  }

  return {
    ...data,
    created_at: new Date(data.created_at)
  };
};

/**
 * Update a column
 */
export const updateColumn = async (
  columnId: string, 
  updates: { name?: string; order?: number }
): Promise<Column> => {
  const { data, error } = await supabase
    .from(COLUMNS_TABLE)
    .update(updates)
    .eq('id', columnId)
    .select()
    .single();

  if (error) {
    console.error('Error updating column:', error);
    throw error;
  }

  return {
    ...data,
    created_at: new Date(data.created_at)
  };
};

/**
 * Delete a column
 */
export const deleteColumn = async (columnId: string): Promise<void> => {
  // Then delete the column
  const { error } = await supabase
    .from(COLUMNS_TABLE)
    .update({ is_deleted: true })
    .eq('id', columnId);

  if (error) {
    console.error('Error deleting column:', error);
    throw error;
  }
};

/**
 * Initialize default columns for a new project
 */
export const initializeDefaultColumns = async (projectId: string): Promise<Column[]> => {
  const defaultColumns = [
    { name: 'To Do', order: 0 },
    { name: 'In Progress', order: 1 },
    { name: 'Done', order: 2 }
  ];

  const columns: Column[] = [];

  for (const column of defaultColumns) {
    const createdColumn = await createColumn(projectId, column);
    columns.push(createdColumn);
  }

  return columns;
};

/**
 * Get a column by ID
 */
export const getColumnById = async (columnId: string): Promise<Column> => {
  const { data, error } = await supabase
    .from(COLUMNS_TABLE)
    .select('*')
    .eq('id', columnId)
    .single();

  if (error) {
    console.error('Error fetching column:', error);
    throw error;
  }

  return {
    ...data,
    created_at: new Date(data.created_at)
  };
};
