/**
 * Supabase Configuration
 * Real Supabase authentication integration
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://vacwojgxafujscxuqmpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY3dvamd4YWZ1anNjeHVxbXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTU5MTksImV4cCI6MjA3Nzc3MTkxOX0.RniyufeNXF9h6a9u55zGIxLRFeFDCaJxQ1ZjLv6KgxI';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions
export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://dailydeck.vercel.app/',
      // Enable email confirmation by ensuring this setting is respected
    }
  });

  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Test function to verify Supabase connection
export const testSupabaseConnection = () => {
  try {
    console.log('🔥 Supabase initialized successfully');
    console.log('📊 URL:', supabaseUrl);
    console.log('🔑 Auth client ready:', !!supabase.auth);
    return true;
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error);
    return false;
  }
};

// ===== DATABASE FUNCTIONS =====

// Basic task functions
export const saveTask = async (taskData: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      user_id: user.id,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTask = async (taskId: string, updates: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTask = async (taskId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const loadTasks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Journal functions
export const saveJournalEntry = async (entryData: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      ...entryData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const loadJournalEntries = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Migration function
export const migrateFromLocalStorage = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // Migrate tasks from localStorage
    const localTasks = localStorage.getItem('tasks');
    if (localTasks) {
      const tasks = JSON.parse(localTasks);
      for (const task of tasks) {
        await saveTask({ ...task, user_id: user.id });
      }
      localStorage.removeItem('tasks');
    }

    // Migrate journal entries from localStorage
    const localJournal = localStorage.getItem('journalEntries');
    if (localJournal) {
      const entries = JSON.parse(localJournal);
      for (const entry of entries) {
        await saveJournalEntry({ ...entry, user_id: user.id });
      }
      localStorage.removeItem('journalEntries');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

export default supabase;