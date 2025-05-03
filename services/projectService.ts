import type { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { getUserProfile, UserProfile } from './authService';
import type { Project } from '@/types/project.type';

// Define Project interface

// Table name in Supabase
const PROJECTS_TABLE = 'projects';
const COLUMNS_TABLE = 'task_columns';
const PROJECT_USERS_TABLE = 'project_has_users';

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
 * Get invited projects
 */
export const getInvitedProjects = async (): Promise<Project[]> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from(PROJECT_USERS_TABLE)
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  const invitedProjectIds = data.map(invited => invited.project_id);
  console.log("invitedProjectIds", invitedProjectIds);

  // get project form projects table with same in project_id
  const { data: invitedProjects, error: invitedProjectsError } = await supabase
    .from(PROJECTS_TABLE)
    .select('*')
    .in('id', invitedProjectIds)
    .order('created_at', { ascending: true });

  if (invitedProjectsError) {
    console.error('Error fetching projects:', invitedProjectsError);
    throw invitedProjectsError;
  }

  // Convert string dates to Date objects
  return invitedProjects?.map(project => ({
    ...project,
  })) || [];
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


export const listAssignedUsers = async (projectId: string): Promise<UserProfile[]> => {
  const { data: projectUserData, error: projectUserError } = await supabase
    .from('project_has_users')
    .select('user_id')
    .eq('project_id', projectId);

  if (projectUserError) {
    console.error('Error fetching project users:', projectUserError);
    throw projectUserError;
  }

  if (!projectUserData || projectUserData.length === 0) {
    return [];
  }

  const userIds = projectUserData.map((pu: { user_id: string }) => pu.user_id);
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('user_id, username, avatar_url')
    .in('user_id', userIds);

  if (userError) {
    console.error('Error loading user details:', userError);
    throw userError;
  }

  const { data: userEmailData, error: userEmailError } = await supabase
    .from('user_emails')
    .select('id, email')
    .in('id', userIds);

  if (userEmailError) {
    console.error('Error loading user email details:', userEmailError);
    throw userEmailError;
  }

  const userEmailMap = userEmailData.reduce((map, ue : {id: string, email: string}) => {
    map[ue.id] = ue.email;
    return map;
  }, {} as Record<string, string>);

  return userData.map(user => {
    return {
      id: user.user_id,
      username: user.username,
      avatar_url: user.avatar_url,
      email: userEmailMap[user.user_id] as string
    };
  }) as UserProfile[];
};