/**
 * 🔒 SECURE Supabase Configuration
 * Production-ready authentication with environment-aware configuration
 */

import { createClient } from '@supabase/supabase-js';

// Environment-aware configuration
const getSupabaseConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  // Log environment for debugging
  if (isDevelopment) {
    console.log('🔧 Supabase running in DEVELOPMENT mode');
  } else if (isProduction) {
    console.log('🚀 Supabase running in PRODUCTION mode');
  }

  return {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://vacwojgxafujscxuqmpg.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY3dvamd4YWZ1anNjeHVxbXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTU5MTksImV4cCI6MjA3Nzc3MTkxOX0.RniyufeNXF9h6a9u55zGIxLRFeFDCaJxQ1ZjLv6KgxI',
    redirectUrl: getRedirectUrl()
  };
};

// Get correct redirect URL based on environment
const getRedirectUrl = (): string => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  // Production environment
  if (isProduction) {
    const prodUrl = import.meta.env.VITE_PROD_URL || 'https://dailydeck.vercel.app';
    const verifyUrl = `${prodUrl}/verify`;
    console.log('🌐 Production email verification redirect URL:', verifyUrl);
    return verifyUrl;
  }

  // Development environment
  if (typeof window !== 'undefined') {
    const devUrl = window.location.origin;
    const verifyUrl = `${devUrl}/verify`;
    console.log('🏠 Development email verification redirect URL:', verifyUrl);
    return verifyUrl;
  }

  // Fallback
  const fallbackVerifyUrl = 'http://localhost:5176/verify';
  console.log('⚠️ Using fallback email verification redirect URL:', fallbackVerifyUrl);
  return fallbackVerifyUrl;
};

const config = getSupabaseConfig();

// Create Supabase client with secure configuration
export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Authentication functions
export const signUpWithEmail = async (email: string, password: string) => {
  console.log('🔐 Starting email sign up process...');
  console.log('📧 Email:', email);
  console.log('🔄 Redirect URL will be:', config.redirectUrl);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: config.redirectUrl,
      data: {
        email_confirm_url: config.redirectUrl
      }
    }
  });

  if (error) {
    console.error('❌ Sign up error:', error.message);
    throw error;
  }

  console.log('✅ Sign up initiated successfully');
  console.log('📊 User data:', data.user ? 'User created' : 'Confirmation required');

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

// ===== AVATAR STORAGE FUNCTIONS =====

// Upload avatar to Supabase Storage
export const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
  try {
    console.log('📤 Uploading avatar for user:', userId);

    // Create unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError, data } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Overwrite existing avatar
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw uploadError;
    }

    console.log('✅ Avatar uploaded successfully:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('🔗 Avatar public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Avatar upload failed:', error);
    return null;
  }
};

// Delete avatar from Supabase Storage
export const deleteAvatar = async (userId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting avatar for user:', userId);

    // List files in user's avatar folder
    const { data: files } = await supabase.storage
      .from('avatars')
      .list(`${userId}/`);

    if (files && files.length > 0) {
      // Delete all avatar files for this user
      const { error } = await supabase.storage
        .from('avatars')
        .remove([`${userId}/${files[0].name}`]);

      if (error) {
        console.error('❌ Delete error:', error);
        return false;
      }

      console.log('✅ Avatar deleted successfully');
    }

    return true;
  } catch (error) {
    console.error('❌ Avatar deletion failed:', error);
    return false;
  }
};

// Update user metadata with avatar URL
export const updateUserAvatar = async (avatarUrl: string | null): Promise<boolean> => {
  try {
    console.log('👤 Updating user avatar URL in metadata...');

    const { error } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl
      }
    });

    if (error) {
      console.error('❌ Error updating avatar metadata:', error);
      return false;
    }

    console.log('✅ Avatar URL updated in metadata');
    return true;
  } catch (error) {
    console.error('❌ Failed to update avatar metadata:', error);
    return false;
  }
};

// Get current user's avatar URL from metadata
export const getUserAvatarUrl = (): string | null => {
  // This will be called after getting current user
  return null; // Placeholder - will be used with actual user data
};

export default supabase;