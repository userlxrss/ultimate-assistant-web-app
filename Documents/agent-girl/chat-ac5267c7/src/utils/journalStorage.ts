import { ExtendedJournalEntry } from '../types/journal';

// Journal storage utilities for MD files
export class JournalStorage {
  private static readonly JOURNAL_DIR = './journal-entries';
  private static readonly INDEX_FILE = './journal-entries/index.json';

  // Ensure journal directory exists (for browser, we'll use localStorage)
  static initializeStorage(): void {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('journal-entries')) {
        localStorage.setItem('journal-entries', JSON.stringify([]));
        localStorage.setItem('journal-index', JSON.stringify({}));
      } else {
        // Validate and clean corrupted data
        try {
          const entries = localStorage.getItem('journal-entries');
          if (entries) {
            const parsed = JSON.parse(entries);
            const isValid = Array.isArray(parsed) && parsed.every(entry =>
              entry && (entry.date || entry.id)
            );
            if (!isValid) {
              console.warn('Corrupted journal data found, clearing...');
              localStorage.setItem('journal-entries', JSON.stringify([]));
              localStorage.setItem('journal-index', JSON.stringify({}));
            }
          }
        } catch (error) {
          console.warn('Error parsing journal data, clearing...', error);
          localStorage.setItem('journal-entries', JSON.stringify([]));
          localStorage.setItem('journal-index', JSON.stringify({}));
        }
      }
    }
  }

  // Save entry to localStorage (simulating MD file storage)
  static async saveEntry(entry: ExtendedJournalEntry): Promise<void> {
    this.initializeStorage();

    if (typeof window !== 'undefined') {
      const entries = this.getAllEntries();
      const existingIndex = entries.findIndex(e => e.date === entry.date);

      if (existingIndex >= 0) {
        entries[existingIndex] = entry;
      } else {
        entries.push(entry);
      }

      // Save to localStorage
      localStorage.setItem('journal-entries', JSON.stringify(entries));

      // Also save as individual "MD file" in localStorage
      const mdContent = this.entryToMarkdown(entry);
      const fileName = `journal-${entry.date.toISOString().split('T')[0]}.md`;
      localStorage.setItem(`journal-md-${fileName}`, mdContent);

      // Update index
      const index = JSON.parse(localStorage.getItem('journal-index') || '{}');
      index[entry.date.toISOString()] = {
        fileName,
        title: entry.title || `Journal Entry - ${entry.date.toLocaleDateString()}`,
        date: entry.date.toISOString(),
        mood: entry.mood,
        tags: entry.tags
      };
      localStorage.setItem('journal-index', JSON.stringify(index));
    }
  }

  // Get all entries
  static getAllEntries(): ExtendedJournalEntry[] {
    if (typeof window !== 'undefined') {
      const entries = localStorage.getItem('journal-entries');
      if (!entries) return [];

      const parsed = JSON.parse(entries);
      return parsed.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
        lastSaved: entry.lastSaved ? new Date(entry.lastSaved) : undefined
      }));
    }
    return [];
  }

  // Get entry by date
  static getEntryByDate(date: Date): ExtendedJournalEntry | null {
    const entries = this.getAllEntries();
    const dateStr = date.toISOString().split('T')[0];
    return entries.find(entry =>
      entry.date.toISOString().split('T')[0] === dateStr
    ) || null;
  }

  // Delete entry
  static async deleteEntry(date: Date): Promise<void> {
    if (typeof window !== 'undefined') {
      const entries = this.getAllEntries();
      const filteredEntries = entries.filter(entry =>
        entry.date.toISOString().split('T')[0] !== date.toISOString().split('T')[0]
      );

      localStorage.setItem('journal-entries', JSON.stringify(filteredEntries));

      // Remove MD file
      const fileName = `journal-${date.toISOString().split('T')[0]}.md`;
      localStorage.removeItem(`journal-md-${fileName}`);

      // Update index
      const index = JSON.parse(localStorage.getItem('journal-index') || '{}');
      delete index[date.toISOString()];
      localStorage.setItem('journal-index', JSON.stringify(index));
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

    let markdown = `# ${entry.title || `Journal Entry - ${date}`}\n\n`;
    markdown += `**Date:** ${date}\n`;
    markdown += `**Mood:** ${entry.mood}/10 ${this.getMoodEmoji(entry.mood)}\n`;
    markdown += `**Energy:** ${entry.energy}/10\n`;

    if (entry.weather) {
      markdown += `**Weather:** ${entry.weather}\n`;
    }

    if (entry.location) {
      markdown += `**Location:** ${entry.location}\n`;
    }

    if (entry.tags && entry.tags.length > 0) {
      markdown += `**Tags:** ${entry.tags.map(tag => `#${tag}`).join(' ')}\n`;
    }

    markdown += `\n---\n\n`;

    if (entry.reflections) {
      markdown += `## 📝 Reflections\n\n${entry.reflections}\n\n`;
    }

    if (entry.gratitude) {
      markdown += `## 🙏 Gratitude\n\n${entry.gratitude}\n\n`;
    }

    if (entry.biggestWin) {
      markdown += `## 🎉 Biggest Win\n\n${entry.biggestWin}\n\n`;
    }

    if (entry.challenge) {
      markdown += `## 💪 Challenge Faced\n\n${entry.challenge}\n\n`;
    }

    if (entry.learning) {
      markdown += `## 🧠 What I Learned\n\n${entry.learning}\n\n`;
    }

    if (entry.tomorrowFocus) {
      markdown += `## 🎯 Focus for Tomorrow\n\n${entry.tomorrowFocus}\n\n`;
    }

    if (entry.affirmations && entry.affirmations.length > 0) {
      markdown += `## ✨ Affirmations\n\n`;
      entry.affirmations.forEach(affirmation => {
        markdown += `- ${affirmation}\n`;
      });
      markdown += '\n';
    }

    markdown += `---\n\n`;
    markdown += `*Entry created at ${entry.date.toLocaleTimeString()}*\n`;

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

  // Export all entries as a single MD file
  static exportAllAsMarkdown(): string {
    const entries = this.getAllEntries().sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let markdown = `# Journal Entries\n\n`;
    markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
    markdown += `---\n\n`;

    entries.forEach(entry => {
      markdown += this.entryToMarkdown(entry);
      markdown += `\n\n---\n\n`;
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

  // Get MD content for a specific entry
  static getMarkdownContent(date: Date): string | null {
    const fileName = `journal-${date.toISOString().split('T')[0]}.md`;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`journal-md-${fileName}`) || null;
    }
    return null;
  }
}