/**
 * Secure Journal Storage Utility
 * Simple fallback for emergency recovery
 */

export const SecureJournalStorage = {
  // Get journal entries
  getEntries: () => {
    try {
      const entries = localStorage.getItem('journal_entries');
      return entries ? JSON.parse(entries) : [];
    } catch (error) {
      console.error('Failed to get journal entries:', error);
      return [];
    }
  },

  // Save journal entry
  saveEntry: (entry: any) => {
    try {
      const entries = SecureJournalStorage.getEntries();
      entries.push(entry);
      localStorage.setItem('journal_entries', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save journal entry:', error);
    }
  },

  // Clear journal entries
  clearEntries: () => {
    try {
      localStorage.removeItem('journal_entries');
    } catch (error) {
      console.error('Failed to clear journal entries:', error);
    }
  }
};