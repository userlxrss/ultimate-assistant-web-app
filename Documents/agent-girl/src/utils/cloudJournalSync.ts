import { saveJournalEntry, loadJournalEntries, getCurrentUser } from '../supabase';
import { JournalEntry } from '../utils/secureJournalStorage';

export class CloudJournalSync {
  // Save entry to cloud with localStorage fallback
  static async saveEntry(entry: Partial<JournalEntry>): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Check if user is authenticated
      const user = await getCurrentUser();
      if (!user) {
        console.log('⚠️ User not authenticated, saving to localStorage only');
        // Fallback to localStorage
        const localEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]');
        const newEntry = {
          ...entry,
          id: entry.id || Date.now(),
          timestamp: entry.timestamp || new Date().toISOString(),
          lastSaved: new Date().toISOString()
        };

        const existingIndex = localEntries.findIndex((e: JournalEntry) => e.id === newEntry.id);
        if (existingIndex >= 0) {
          localEntries[existingIndex] = newEntry;
        } else {
          localEntries.push(newEntry);
        }

        localStorage.setItem('journal-entries', JSON.stringify(localEntries));
        return { success: true, data: newEntry };
      }

      // Save to Supabase cloud storage
      const cloudData = {
        title: entry.title || '',
        date: entry.date || new Date().toISOString().split('T')[0],
        mood: entry.mood || 7,
        energy: entry.energy || 7,
        reflections: entry.reflections || '',
        gratitude: entry.gratitude || '',
        tags: entry.tags || [],
        photo_url: entry.photo_url || null
      };

      const savedEntry = await saveJournalEntry(cloudData);
      console.log('✅ Entry saved to cloud:', savedEntry);

      return { success: true, data: savedEntry };

    } catch (error) {
      console.error('❌ Failed to save entry:', error);
      return { success: false, error: error.message };
    }
  }

  // Load entries from cloud with localStorage fallback
  static async loadEntries(): Promise<{ success: boolean; error?: string; data?: JournalEntry[] }> {
    try {
      // Check if user is authenticated
      const user = await getCurrentUser();
      if (!user) {
        console.log('⚠️ User not authenticated, loading from localStorage');
        // Fallback to localStorage
        const localEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]');
        return { success: true, data: localEntries };
      }

      // Load from Supabase cloud storage
      const cloudEntries = await loadJournalEntries();

      // Convert cloud entries to local format
      const formattedEntries: JournalEntry[] = cloudEntries.map(entry => ({
        id: entry.id,
        date: entry.date,
        title: entry.title,
        mood: entry.mood,
        energy: entry.energy,
        reflections: entry.reflections,
        gratitude: entry.gratitude,
        tags: entry.tags || [],
        photo_url: entry.photo_url,
        timestamp: entry.created_at,
        lastSaved: new Date(entry.updated_at)
      }));

      console.log(`✅ Loaded ${formattedEntries.length} entries from cloud`);
      return { success: true, data: formattedEntries };

    } catch (error) {
      console.error('❌ Failed to load entries:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete entry from cloud
  static async deleteEntry(entryId: string | number): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        // Fallback to localStorage
        const localEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]');
        const filteredEntries = localEntries.filter((e: JournalEntry) => e.id !== entryId);
        localStorage.setItem('journal-entries', JSON.stringify(filteredEntries));
        return { success: true };
      }

      // TODO: Implement cloud delete when you have the function
      console.log('🔄 Cloud delete not implemented yet, removing from local state');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to delete entry:', error);
      return { success: false, error: error.message };
    }
  }

  // Migrate all localStorage entries to cloud
  static async migrateToCloud(): Promise<{ success: boolean; migrated: number; error?: string }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { success: false, migrated: 0, error: 'User not authenticated' };
      }

      // Get all local entries
      const localEntries = JSON.parse(localStorage.getItem('journal-entries') || '[]');
      if (localEntries.length === 0) {
        return { success: true, migrated: 0 };
      }

      let migratedCount = 0;
      for (const entry of localEntries) {
        try {
          const result = await this.saveEntry(entry);
          if (result.success) {
            migratedCount++;
          }
        } catch (error) {
          console.error('Failed to migrate entry:', error);
        }
      }

      // Clear localStorage after successful migration
      if (migratedCount > 0) {
        localStorage.removeItem('journal-entries');
        console.log(`✅ Migrated ${migratedCount} entries to cloud`);
      }

      return { success: true, migrated: migratedCount };

    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, migrated: 0, error: error.message };
    }
  }
}