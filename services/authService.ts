import { supabase } from '../utils/supabase';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'vue-router';

// Define user profile interface
export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: Date;
  email?: string;
}

// User table in Supabase
const PROFILES_TABLE = 'profiles';
const USER_EMAILS_TABLE = 'user_emails';

/**
 * Register a new user
 */
export const registerUser = async (email: string, password: string, username: string): Promise<User> => {
  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Error registering user:', authError);
    throw authError;
  }

  if (!authData.user) {
    throw new Error('User registration failed');
  }

  // Create a profile for the user
  const { error: profileError } = await supabase
    .from(PROFILES_TABLE)
    .insert({
      user_id: authData.user.id,
      username,
      avatar_url: null,
      created_at: new Date()
    });

  if (profileError) {
    console.error('Error creating user profile:', profileError);
    throw profileError;
  }

  // Create a user email for the user
  const { error: emailError } = await supabase
    .from(USER_EMAILS_TABLE)
    .insert({
      id: authData.user.id,
      email
    });

  if (emailError) {
    console.error('Error creating user email:', emailError);
    throw emailError;
  }

  return authData.user;
};

/**
 * Login an existing user
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error logging in:', error);
    throw error;
  }

  if (!data.user) {
    throw new Error('Login failed');
  }

  return data.user;
};

/**
 * Logout the current user
 */
export const logoutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

/**
 * Get the current user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const router = useRouter();
  
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    router.push('/login');
    removeSession();
    return null;
  }
  return data.user;
};

/**
 * Get the current user's session
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    throw error;
  }
  
  return data.session;
};

/**
 * Remove the current user's session on browser
 */
export const removeSession = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error removing session:', error);
    throw error;
  }
};

/**
 * Get the user profile
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return {
    ...data,
    created_at: new Date(data.created_at)
  };
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string, 
  updates: { username?: string; avatar_url?: string }
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return {
    ...data,
    created_at: new Date(data.created_at)
  };
};

/**
 * Update user password
 */
export const updatePassword = async (password: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};
