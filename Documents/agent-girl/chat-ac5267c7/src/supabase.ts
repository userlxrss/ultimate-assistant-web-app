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

// ===== DATABASE PERSISTENCE FUNCTIONS =====

// Type definitions for database tables
export interface DatabaseTask {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  notes?: string;
  completed: boolean;
  created_at?: string;
  completed_at?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  category: string;
  workspace?: string;
  duration?: number;
  subtasks: any[];
  tags: string[];
  estimated_time?: number;
  actual_time?: number;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  reminder?: string;
  attachments?: string[];
  dependencies?: string[];
  sync_status: 'synced' | 'pending' | 'error';
  last_sync_at?: string;
  project_id?: string;
  assignee?: string;
  color?: string;
}

export interface DatabaseJournalEntry {
  id?: string;
  user_id: string;
  date: string;
  title?: string;
  mood: number;
  energy: number;
  reflections?: string;
  gratitude?: string;
  biggest_win?: string;
  challenge?: string;
  learning?: string;
  tomorrow_focus?: string;
  tags?: string[];
  affirmations?: string[];
  weather?: string;
  location?: string;
  content?: string;
  themes?: string[];
  insights?: string[];
  template?: string;
  is_draft?: boolean;
  last_saved?: string;
}

export interface DatabaseUserProfile {
  id?: string;
  user_id: string;
  display_name?: string;
  bio?: string;
  timezone: string;
  language: string;
  date_format: string;
  email_notifications: boolean;
  desktop_notifications: boolean;
  weekly_summary: boolean;
  theme: 'light' | 'dark';
  font_size: 'small' | 'medium' | 'large' | 'extra-large';
  compact_mode: boolean;
  dashboard_layout?: any;
  preferences?: any;
}

export interface DatabaseCalendarEvent {
  id?: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type_id?: string;
  attendees?: any[];
  description?: string;
  location?: string;
  color?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  reminders?: any[];
  buffer_time?: number;
  timezone?: string;
  visibility?: 'public' | 'private';
  status?: 'confirmed' | 'tentative' | 'cancelled';
  creator?: any;
  organizer?: any;
  notes?: string;
  external_id?: string;
  sync_status: 'synced' | 'pending' | 'error';
  last_sync_at?: string;
}

// ===== TASK FUNCTIONS =====

export const saveTask = async (taskData: Omit<DatabaseTask, 'user_id'>): Promise<DatabaseTask> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      sync_status: 'synced',
      last_sync_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving task:', error);
    throw error;
  }

  console.log('✅ Task saved to database:', data);
  return data;
};

export const updateTask = async (taskId: string, updates: Partial<DatabaseTask>): Promise<DatabaseTask> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      sync_status: 'synced',
      last_sync_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  console.log('✅ Task updated in database:', data);
  return data;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }

  console.log('✅ Task deleted from database:', taskId);
};

export const loadTasks = async (): Promise<DatabaseTask[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading tasks:', error);
    return [];
  }

  console.log('📋 Loaded', data?.length || 0, 'tasks from database');
  return data || [];
};

// ===== JOURNAL FUNCTIONS =====

export const saveJournalEntry = async (entryData: Omit<DatabaseJournalEntry, 'user_id'>): Promise<DatabaseJournalEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      ...entryData,
      user_id: user.id,
      last_saved: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving journal entry:', error);
    throw error;
  }

  console.log('📔 Journal entry saved to database:', data);
  return data;
};

export const updateJournalEntry = async (entryId: string, updates: Partial<DatabaseJournalEntry>): Promise<DatabaseJournalEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .update({
      ...updates,
      last_saved: new Date().toISOString()
    })
    .eq('id', entryId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }

  console.log('📔 Journal entry updated in database:', data);
  return data;
};

export const loadJournalEntries = async (): Promise<DatabaseJournalEntry[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error loading journal entries:', error);
    return [];
  }

  console.log('📔 Loaded', data?.length || 0, 'journal entries from database');
  return data || [];
};

// ===== USER PROFILE FUNCTIONS =====

export const saveUserProfile = async (profileData: Omit<DatabaseUserProfile, 'user_id'>): Promise<DatabaseUserProfile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Use upsert to either create or update the profile
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      ...profileData,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }

  console.log('⚙️ User profile saved to database:', data);
  return data;
};

export const loadUserProfile = async (): Promise<DatabaseUserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error loading user profile:', error);
    return null;
  }

  console.log('⚙️ User profile loaded from database:', !!data);
  return data;
};

// ===== CALENDAR FUNCTIONS =====

export const saveCalendarEvent = async (eventData: Omit<DatabaseCalendarEvent, 'user_id'>): Promise<DatabaseCalendarEvent> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      ...eventData,
      user_id: user.id,
      sync_status: 'synced',
      last_sync_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving calendar event:', error);
    throw error;
  }

  console.log('📅 Calendar event saved to database:', data);
  return data;
};

export const updateCalendarEvent = async (eventId: string, updates: Partial<DatabaseCalendarEvent>): Promise<DatabaseCalendarEvent> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('calendar_events')
    .update({
      ...updates,
      sync_status: 'synced',
      last_sync_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }

  console.log('📅 Calendar event updated in database:', data);
  return data;
};

export const loadCalendarEvents = async (startDate?: string, endDate?: string): Promise<DatabaseCalendarEvent[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true });

  if (startDate) {
    query = query.gte('start_time', startDate);
  }
  if (endDate) {
    query = query.lte('start_time', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading calendar events:', error);
    return [];
  }

  console.log('📅 Loaded', data?.length || 0, 'calendar events from database');
  return data || [];
};

// ===== MIGRATION FUNCTIONS =====

// Migrate data from localStorage to Supabase
export const migrateFromLocalStorage = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ User not authenticated, skipping migration');
    return;
  }

  console.log('🔄 Starting migration from localStorage to Supabase...');

  try {
    // Migrate tasks
    const localTasks = localStorage.getItem('tasks');
    if (localTasks) {
      const tasks = JSON.parse(localTasks);
      for (const task of tasks) {
        await saveTask({
          ...task,
          user_id: user.id
        });
      }
      console.log(`✅ Migrated ${tasks.length} tasks`);
      localStorage.removeItem('tasks');
    }

    // Migrate journal entries
    const localJournal = localStorage.getItem('journalEntries');
    if (localJournal) {
      const entries = JSON.parse(localJournal);
      for (const entry of entries) {
        await saveJournalEntry({
          ...entry,
          user_id: user.id
        });
      }
      console.log(`✅ Migrated ${entries.length} journal entries`);
      localStorage.removeItem('journalEntries');
    }

    // Migrate settings
    const localSettings = localStorage.getItem('userSettings');
    if (localSettings) {
      const settings = JSON.parse(localSettings);
      await saveUserProfile({
        ...settings,
        user_id: user.id
      });
      console.log('✅ Migrated user settings');
      localStorage.removeItem('userSettings');
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

export default supabase;