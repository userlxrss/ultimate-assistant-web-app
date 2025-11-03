/**
 * Secure Journal Storage Utility
 * Simple fallback for emergency recovery
 */

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  mood: number;
  energy: number;
  reflections: string;
  gratitude: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const SecureJournalStorage = {
  // Load journal entries - async version expected by JournalSimple
  loadEntries: async (): Promise<{ success: boolean; data?: JournalEntry[]; error?: string }> => {
    try {
      const entries = localStorage.getItem('journal_entries');
      const parsedEntries = entries ? JSON.parse(entries) : [];
      return { success: true, data: parsedEntries };
    } catch (error) {
      console.error('Failed to load journal entries:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Legacy sync method for backward compatibility
  getEntries: (): JournalEntry[] => {
    try {
      const entries = localStorage.getItem('journal_entries');
      return entries ? JSON.parse(entries) : [];
    } catch (error) {
      console.error('Failed to get journal entries:', error);
      return [];
    }
  },

  // Save journal entry - async version expected by JournalSimple
  saveEntry: async (entry: JournalEntry): Promise<{ success: boolean; error?: string }> => {
    try {
      const entries = SecureJournalStorage.getEntries();

      // Add timestamps if not present
      const entryWithTimestamps = {
        ...entry,
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Check if entry already exists (by id) and update, otherwise add new
      const existingIndex = entries.findIndex((e: JournalEntry) => e.id === entry.id);
      if (existingIndex >= 0) {
        entries[existingIndex] = entryWithTimestamps;
      } else {
        entries.push(entryWithTimestamps);
      }

      localStorage.setItem('journal_entries', JSON.stringify(entries));
      return { success: true };
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Delete journal entry by id
  deleteEntry: async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const entries = SecureJournalStorage.getEntries();
      const filteredEntries = entries.filter((entry: JournalEntry) => entry.id !== id);

      if (filteredEntries.length === entries.length) {
        return { success: false, error: 'Entry not found' };
      }

      localStorage.setItem('journal_entries', JSON.stringify(filteredEntries));
      return { success: true };
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Clear all journal entries
  clearEntries: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      localStorage.removeItem('journal_entries');
      return { success: true };
    } catch (error) {
      console.error('Failed to clear journal entries:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Save multiple entries at once
  saveEntries: async (entries: JournalEntry[]): Promise<{ success: boolean; error?: string }> => {
    try {
      const entriesWithTimestamps = entries.map(entry => ({
        ...entry,
        createdAt: entry.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      localStorage.setItem('journal_entries', JSON.stringify(entriesWithTimestamps));
      return { success: true };
    } catch (error) {
      console.error('Failed to save journal entries:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};