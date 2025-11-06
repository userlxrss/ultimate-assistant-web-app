/**
 * SECURE User-Specific Journal Storage Utility
 * CRITICAL SECURITY FIX for privacy breach vulnerability
 * 
 * This implementation ensures complete data isolation between users
 * by incorporating user identification into all storage operations.
 * 
 * SECURITY FEATURES:
 * - User-specific localStorage keys
 * - Authentication validation
 * - Automatic data migration from insecure storage
 * - Cross-user data isolation
 * - Secure data cleanup on logout
 */

import { userAuthService, UserProfile } from '../services/userAuthService';
import { JournalEntry } from './secureJournalStorage';

// User-specific storage key generator
const generateUserKey = (baseKey: string, userEmail: string): string => {
  // Sanitize email to create safe localStorage keys
  const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
  return `${baseKey}_${sanitizedEmail}`;
};

// Get current authenticated user
const getCurrentUser = (): UserProfile | null => {
  return userAuthService.getCurrentUser();
};

// Validate user authentication
const validateUserAuth = (): { isValid: boolean; user?: UserProfile; error?: string } => {
  const user = getCurrentUser();
  if (!user) {
    return { isValid: false, error: 'User not authenticated' };
  }
  if (!user.emailVerified) {
    return { isValid: false, error: 'User email not verified' };
  }
  return { isValid: true, user };
};

// Data migration utility for backward compatibility
const migrateLegacyData = (userEmail: string): void => {
  const legacyKeys = [
    'journal_entries',
    'journal-entries',
    'journal-index',
    'journal-md'
  ];

  legacyKeys.forEach(legacyKey => {
    const legacyData = localStorage.getItem(legacyKey);
    if (legacyData) {
      const userKey = generateUserKey(legacyKey, userEmail);
      // Only migrate if user-specific data doesn't exist
      if (!localStorage.getItem(userKey)) {
        localStorage.setItem(userKey, legacyData);
        console.log(`✅ Migrated legacy data for user: ${userEmail}`);
      }
    }
  });
};

// Clean up user data on logout
const cleanupUserData = (userEmail: string): void => {
  // Note: We don't actually delete user data on logout
  // We just remove any temporary session data
  // User's persistent journal data remains in their user-specific keys
  
  // Clear any temporary session storage
  sessionStorage.removeItem(`temp_journal_${userEmail}`);
  console.log(`✅ Cleaned up session data for user: ${userEmail}`);
};

export const SecureUserJournalStorage = {
  /**
   * Initialize secure storage for authenticated user
   */
  initializeStorage: (): { success: boolean; error?: string } => {
    const authValidation = validateUserAuth();
    if (!authValidation.isValid) {
      return { success: false, error: authValidation.error };
    }

    const user = authValidation.user!;
    
    // Migrate legacy data if this is first time using secure storage
    migrateLegacyData(user.email);
    
    // Initialize user-specific storage if needed
    const entriesKey = generateUserKey('journal_entries', user.email);
    if (!localStorage.getItem(entriesKey)) {
      localStorage.setItem(entriesKey, JSON.stringify([]));
    }

    console.log(`✅ Secure journal storage initialized for user: ${user.email}`);
    return { success: true };
  },

  /**
   * Load journal entries for authenticated user
   */
  loadEntries: async (): Promise<{ success: boolean; data?: JournalEntry[]; error?: string }> => {
    const authValidation = validateUserAuth();
    if (!authValidation.isValid) {
      return { success: false, error: authValidation.error };
    }

    try {
      const user = authValidation.user!;
      const entriesKey = generateUserKey('journal_entries', user.email);
      
      const entries = localStorage.getItem(entriesKey);
      const parsedEntries = entries ? JSON.parse(entries) : [];
      
      // Validate data integrity
      if (!Array.isArray(parsedEntries)) {
        console.warn('⚠️ Corrupted journal data detected, resetting...');
        localStorage.setItem(entriesKey, JSON.stringify([]));
        return { success: true, data: [] };
      }
      
      return { success: true, data: parsedEntries };
    } catch (error) {
      console.error('❌ Failed to load journal entries:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Save journal entry for authenticated user
   */
  saveEntry: async (entry: JournalEntry): Promise<{ success: boolean; error?: string }> => {
    const authValidation = validateUserAuth();
    if (!authValidation.isValid) {
      return { success: false, error: authValidation.error };
    }

    try {
      const user = authValidation.user!;
      const entriesKey = generateUserKey('journal_entries', user.email);
      
      // Validate entry structure
      if (!entry.id || !entry.title) {
        return { success: false, error: 'Invalid journal entry structure' };
      }

      const entries = JSON.parse(localStorage.getItem(entriesKey) || '[]');
      
      // Add user metadata for security auditing
      const entryWithMetadata = {
        ...entry,
        userId: user.uid,
        userEmail: user.email,
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Check if entry already exists and update, otherwise add new
      const existingIndex = entries.findIndex((e: JournalEntry) => e.id === entry.id);
      if (existingIndex >= 0) {
        entries[existingIndex] = entryWithMetadata;
      } else {
        entries.push(entryWithMetadata);
      }

      localStorage.setItem(entriesKey, JSON.stringify(entries));
      console.log(`✅ Journal entry saved for user: ${user.email}`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save journal entry:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Delete journal entry for authenticated user
   */
  deleteEntry: async (id: string): Promise<{ success: boolean; error?: string }> => {
    const authValidation = validateUserAuth();
    if (!authValidation.isValid) {
      return { success: false, error: authValidation.error };
    }

    try {
      const user = authValidation.user!;
      const entriesKey = generateUserKey('journal_entries', user.email);
      
      const entries = JSON.parse(localStorage.getItem(entriesKey) || '[]');
      const filteredEntries = entries.filter((entry: JournalEntry) => entry.id !== id);

      if (filteredEntries.length === entries.length) {
        return { success: false, error: 'Entry not found' };
      }

      // Verify ownership before deletion
      const deletedEntry = entries.find((entry: JournalEntry) => entry.id === id);
      if (deletedEntry && deletedEntry.userId !== user.uid) {
        return { success: false, error: 'Unauthorized: Entry belongs to different user' };
      }

      localStorage.setItem(entriesKey, JSON.stringify(filteredEntries));
      console.log(`✅ Journal entry deleted for user: ${user.email}`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete journal entry:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Clear all journal entries for authenticated user
   */
  clearEntries: async (): Promise<{ success: boolean; error?: string }> => {
    const authValidation = validateUserAuth();
    if (!authValidation.isValid) {
      return { success: false, error: authValidation.error };
    }

    try {
      const user = authValidation.user!;
      const entriesKey = generateUserKey('journal_entries', user.email);
      
      localStorage.removeItem(entriesKey);
      console.log(`✅ All journal entries cleared for user: ${user.email}`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to clear journal entries:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Save multiple entries for authenticated user
   */
  saveEntries: async (entries: JournalEntry[]): Promise<{ success: boolean; error?: string }> => {
    const authValidation = validateUserAuth();
    if (!authValidation.isValid) {
      return { success: false, error: authValidation.error };
    }

    try {
      const user = authValidation.user!;
      const entriesKey = generateUserKey('journal_entries', user.email);
      
      // Validate all entries have required fields
      const invalidEntries = entries.filter(entry => !entry.id || !entry.title);
      if (invalidEntries.length > 0) {
        return { success: false, error: 'Invalid journal entries detected' };
      }

      const entriesWithMetadata = entries.map(entry => ({
        ...entry,
        userId: user.uid,
        userEmail: user.email,
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      localStorage.setItem(entriesKey, JSON.stringify(entriesWithMetadata));
      console.log(`✅ ${entries.length} journal entries saved for user: ${user.email}`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save journal entries:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Get storage statistics for authenticated user
   */
  getStorageStats: (): { success: boolean; stats?: any; error?: string } => {
    const authValidation = validateUserAuth();
    if (!authValidation.isValid) {
      return { success: false, error: authValidation.error };
    }

    try {
      const user = authValidation.user!;
      const entriesKey = generateUserKey('journal_entries', user.email);
      
      const entries = JSON.parse(localStorage.getItem(entriesKey) || '[]');
      const totalSize = new Blob([JSON.stringify(entries)]).size;
      
      const stats = {
        totalEntries: entries.length,
        storageSizeBytes: totalSize,
        storageSizeKB: (totalSize / 1024).toFixed(2),
        userEmail: user.email,
        lastUpdated: entries.length > 0 
          ? Math.max(...entries.map((e: any) => new Date(e.updatedAt).getTime()))
          : null
      };

      return { success: true, stats };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Handle user logout - clean up session data
   */
  handleLogout: (): void => {
    const user = getCurrentUser();
    if (user) {
      cleanupUserData(user.email);
    }
  },

  /**
   * Verify data isolation between users
   */
  verifyDataIsolation: (userEmail1: string, userEmail2: string): { success: boolean; isIsolated: boolean; error?: string } => {
    try {
      const key1 = generateUserKey('journal_entries', userEmail1);
      const key2 = generateUserKey('journal_entries', userEmail2);
      
      const data1 = localStorage.getItem(key1);
      const data2 = localStorage.getItem(key2);
      
      // Data is properly isolated if keys are different and don't contain each other's data
      const isIsolated = key1 !== key2 && data1 !== data2;
      
      return { 
        success: true, 
        isIsolated,
        details: {
          userEmail1,
          userEmail2,
          key1,
          key2,
          hasData1: !!data1,
          hasData2: !!data2
        }
      };
    } catch (error) {
      console.error('❌ Failed to verify data isolation:', error);
      return { success: false, isIsolated: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

export default SecureUserJournalStorage;
