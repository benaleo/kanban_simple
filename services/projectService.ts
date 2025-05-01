import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';

// Define Project interface
export interface Project {
  id: string;
  name: string;
  user_id: string;
  created_at: Date;
}

// Table name in Supabase
const PROJECTS_TABLE = 'projects';
const COLUMNS_TABLE = 'task_columns';

/**
 * Fetch all projects for the current user
 */
export const getProjects = async (): Promise<Project[]> => {
  // Get current user
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  // Convert string dates to Date objects
  return data?.map(project => ({
    ...project,
    created_at: new Date(project.created_at)
  })) || [];
};

/**
 * Get a project by ID
 */
export const getProjectById = async (projectId: string): Promise<Project> => {
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    throw error;
  }

  return {
    ...data,
    created_at: new Date(data.created_at)
  };
};

/**
 * Create a new project
 */
export const createProject = async (projectData: { name: string }): Promise<Project> => {
  // Get current user
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const newProject = {
    id: uuidv4(),
    name: projectData.name,
    user_id: userData.user.id,
    created_at: new Date()
  };

  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .insert(newProject)
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  const defaultColumns = [
    { name: 'To Do', order: 0 },
    { name: 'In Progress', order: 1 },
    { name: 'Done', order: 2 }
  ];

  const columnsPromises = defaultColumns.map(defaultColumn => {
    const newColumn = {
      id: uuidv4(),
      name: defaultColumn.name,
      project_id: data.id,
      created_at: new Date(),
      order: defaultColumn.order
    };

    return supabase
      .from(COLUMNS_TABLE)
      .insert(newColumn)
      .select()
      .single();
  });

  const columnsResults = await Promise.all(columnsPromises);

  const columnsErrors = columnsResults
    .filter(result => result.error)
    .map(result => result.error);

  if (columnsErrors.length > 0) {
    console.error('Error creating columns:', columnsErrors);
    throw columnsErrors;
  }

  return {
    ...data,
    created_at: new Date(data.created_at)
  };
};

/**
 * Update a project
 */
export const updateProject = async (
  projectId: string, 
  updates: { name: string }
): Promise<Project> => {
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return {
    ...data,
    created_at: new Date(data.created_at)
  };
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  // Start a transaction by deleting all tasks associated with the project first
  const { error: taskError } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', projectId);

  if (taskError) {
    console.error('Error deleting associated tasks:', taskError);
    throw taskError;
  }

  // Then delete the project
  const { error } = await supabase
    .from(PROJECTS_TABLE)
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};
