import { supabase } from '../utils/supabase';
import type { User } from '@supabase/supabase-js';
import { getCurrentUser } from './authService';

export interface LogEntry {
  id?: string;
  user_id: string;
  user_email: string;
  entity_id: string;
  entity: string;
  action: string;
  metadata?: Record<string, unknown>;
  ts?: string;
}

const LOGS_TABLE = 'logs';

/**
 * Create a new log entry
 */
export const createLog = async (logData: Omit<LogEntry, 'id' | 'ts'>): Promise<LogEntry> => {
  const { data, error } = await supabase
    .from(LOGS_TABLE)
    .insert({
      ...logData,
      ts: new Date()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating log:', error);
    throw error;
  }

  return {
    ...data,
    ts: new Date(data.ts)
  };
};

/**
 * Get logs for a specific entity
 */
export const getEntityLogs = async (entityId: string): Promise<LogEntry[]> => {
  const { data, error } = await supabase
    .from(LOGS_TABLE)
    .select('*')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }

  return data?.map(log => ({
    ...log,
    ts: new Date(log.ts)
  })) || [];
};

/**
 * Get logs for a specific user
 */
export const getUserLogs = async (userId: string): Promise<LogEntry[]> => {
  const { data, error } = await supabase
    .from(LOGS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user logs:', error);
    throw error;
  }

  return data?.map(log => ({
    ...log,
    created_at: new Date(log.created_at)
  })) || [];
};

/**
 * Create a log entry for the current user
 */
export const logAction = async (
  entityId: string, 
  entity: string, 
  action: string,
  metadata?: Record<string, unknown>
): Promise<LogEntry> => {
  const userData : User = await getCurrentUser();

  return createLog({
    user_id: userData.id,
    user_email: userData.email || '',
    entity_id: entityId,
    entity,
    action,
    metadata
  });
};
