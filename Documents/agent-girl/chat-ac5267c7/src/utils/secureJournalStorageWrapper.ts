/**
 * Secure Journal Storage Wrapper
 * Provides backward compatibility with ExtendedJournalEntry while ensuring user data isolation
 */

import { ExtendedJournalEntry } from '../types/journal';
import { SecureUserJournalStorage } from './secureUserJournalStorage';
import { userAuthService } from '../services/userAuthService';

// Convert ExtendedJournalEntry to JournalEntry format
const convertToJournalEntry = (extendedEntry: ExtendedJournalEntry): any => {
  return {
    id: extendedEntry.date.toISOString(),
    date: extendedEntry.date.toISOString().split('T')[0],
    title: extendedEntry.title || 'Journal Entry - ' + extendedEntry.date.toLocaleDateString(),
    mood: extendedEntry.mood,
    energy: extendedEntry.energy,
    reflections: extendedEntry.reflections || '',
    gratitude: extendedEntry.gratitude || '',
    tags: extendedEntry.tags || [],
    weather: extendedEntry.weather,
    location: extendedEntry.location,
    biggestWin: extendedEntry.biggestWin,
    challenge: extendedEntry.challenge,
    learning: extendedEntry.learning,
    tomorrowFocus: extendedEntry.tomorrowFocus,
    affirmations: extendedEntry.affirmations,
    lastSaved: extendedEntry.lastSaved
  };
};

// Convert JournalEntry back to ExtendedJournalEntry format
const convertToExtendedEntry = (journalEntry: any): ExtendedJournalEntry => {
  return {
    ...journalEntry,
    date: new Date(journalEntry.date),
    lastSaved: journalEntry.lastSaved ? new Date(journalEntry.lastSaved) : undefined
  };
};

export class SecureJournalStorageWrapper {
  // Initialize storage for authenticated user
  static initializeStorage(): void {
    const result = SecureUserJournalStorage.initializeStorage();
    if (!result.success) {
      console.error('Failed to initialize secure journal storage:', result.error);
      throw new Error(result.error);
    }
  }

  // Save ExtendedJournalEntry for authenticated user
  static async saveEntry(entry: ExtendedJournalEntry): Promise<void> {
    const journalEntry = convertToJournalEntry(entry);
    const result = await SecureUserJournalStorage.saveEntry(journalEntry);
    
    if (!result.success) {
      console.error('Failed to save journal entry:', result.error);
      throw new Error(result.error);
    }
  }

  // Get all entries as ExtendedJournalEntry array
  static getAllEntries(): ExtendedJournalEntry[] {
    // This is a synchronous wrapper around the async loadEntries
    // Note: In production, this should be properly handled with async/await
    const user = userAuthService.getCurrentUser();
    if (!user) {
      console.warn('User not authenticated, returning empty entries');
      return [];
    }

    try {
      const userEmail = user.email.replace(/[^a-zA-Z0-9]/g, '_');
      const entriesKey = 'journal_entries_' + userEmail;
      const entries = localStorage.getItem(entriesKey);
      const parsedEntries = entries ? JSON.parse(entries) : [];
      
      return parsedEntries.map(convertToExtendedEntry);
    } catch (error) {
      console.error('Failed to get journal entries:', error);
      return [];
    }
  }

  // Get entry by date
  static getEntryByDate(date: Date): ExtendedJournalEntry | null {
    const entries = this.getAllEntries();
    const dateStr = date.toISOString().split('T')[0];
    return entries.find(entry =>
      entry.date.toISOString().split('T')[0] === dateStr
    ) || null;
  }

  // Delete entry by date
  static async deleteEntry(date: Date): Promise<void> {
    const entryId = date.toISOString();
    const result = await SecureUserJournalStorage.deleteEntry(entryId);
    
    if (!result.success) {
      console.error('Failed to delete journal entry:', result.error);
      throw new Error(result.error);
    }
  }

  // Convert entry to Markdown format
  static entryToMarkdown(entry: ExtendedJournalEntry): string {
    const date = entry.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let markdown = '# ' + (entry.title || 'Journal Entry - ' + date) + '\n\n';
    markdown += '**Date:** ' + date + '\n';
    markdown += '**Mood:** ' + entry.mood + '/10 ' + this.getMoodEmoji(entry.mood) + '\n';
    markdown += '**Energy:** ' + entry.energy + '/10\n';

    if (entry.weather) {
      markdown += '**Weather:** ' + entry.weather + '\n';
    }

    if (entry.location) {
      markdown += '**Location:** ' + entry.location + '\n';
    }

    if (entry.tags && entry.tags.length > 0) {
      markdown += '**Tags:** ' + entry.tags.map(tag => '#' + tag).join(' ') + '\n';
    }

    markdown += '\n---\n\n';

    if (entry.reflections) {
      markdown += '## 📝 Reflections\n\n' + entry.reflections + '\n\n';
    }

    if (entry.gratitude) {
      markdown += '## 🙏 Gratitude\n\n' + entry.gratitude + '\n\n';
    }

    if (entry.biggestWin) {
      markdown += '## 🎉 Biggest Win\n\n' + entry.biggestWin + '\n\n';
    }

    if (entry.challenge) {
      markdown += '## 💪 Challenge Faced\n\n' + entry.challenge + '\n\n';
    }

    if (entry.learning) {
      markdown += '## 🧠 What I Learned\n\n' + entry.learning + '\n\n';
    }

    if (entry.tomorrowFocus) {
      markdown += '## 🎯 Focus for Tomorrow\n\n' + entry.tomorrowFocus + '\n\n';
    }

    if (entry.affirmations && entry.affirmations.length > 0) {
      markdown += '## ✨ Affirmations\n\n';
      entry.affirmations.forEach(affirmation => {
        markdown += '- ' + affirmation + '\n';
      });
      markdown += '\n';
    }

    markdown += '---\n\n';
    markdown += '*Entry created at ' + entry.date.toLocaleTimeString() + '*\n';

    return markdown;
  }

  // Get mood emoji
  static getMoodEmoji(mood: number): string {
    if (mood >= 9) return '😄';
    if (mood >= 8) return '😊';
    if (mood >= 7) return '🙂';
    if (mood >= 6) return '😐';
    if (mood >= 5) return '😔';
    if (mood >= 4) return '😟';
    if (mood >= 3) return '😢';
    if (mood >= 2) return '😭';
    return '😱';
  }

  // Export all entries as Markdown
  static exportAllAsMarkdown(): string {
    const entries = this.getAllEntries().sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let markdown = '# Journal Entries\n\n';
    markdown += '*Exported on ' + new Date().toLocaleDateString() + '*\n\n';
    markdown += '---\n\n';

    entries.forEach(entry => {
      markdown += this.entryToMarkdown(entry);
      markdown += '\n\n---\n\n';
    });

    return markdown;
  }

  // Search entries
  static searchEntries(query: string): ExtendedJournalEntry[] {
    const entries = this.getAllEntries();
    const lowerQuery = query.toLowerCase();

    return entries.filter(entry =>
      entry.title?.toLowerCase().includes(lowerQuery) ||
      entry.reflections?.toLowerCase().includes(lowerQuery) ||
      entry.gratitude?.toLowerCase().includes(lowerQuery) ||
      entry.biggestWin?.toLowerCase().includes(lowerQuery) ||
      entry.learning?.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Get entries by date range
  static getEntriesByDateRange(startDate: Date, endDate: Date): ExtendedJournalEntry[] {
    const entries = this.getAllEntries();
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get MD content for specific entry
  static getMarkdownContent(date: Date): string | null {
    const entry = this.getEntryByDate(date);
    return entry ? this.entryToMarkdown(entry) : null;
  }

  // Handle user logout
  static handleLogout(): void {
    SecureUserJournalStorage.handleLogout();
  }
}

export default SecureJournalStorageWrapper;
