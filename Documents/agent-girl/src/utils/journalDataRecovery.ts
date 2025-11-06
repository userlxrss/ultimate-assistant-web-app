/**
 * Journal Data Recovery Utility
 *
 * This utility helps recover lost journal entries by scanning multiple storage locations
 * and attempting to restore any real user entries that may have been accidentally cleared.
 */

export interface RecoveryResult {
  recoveredEntries: any[];
  sourcesSearched: string[];
  success: boolean;
  message: string;
}

export class JournalDataRecovery {
  /**
   * Scan all possible storage locations for journal entries
   */
  static scanForRecoverableEntries(): RecoveryResult {
    const sourcesSearched: string[] = [];
    const allRecoveredEntries: any[] = [];

    // Check primary localStorage key
    try {
      const primaryEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      if (primaryEntries.length > 0) {
        allRecoveredEntries.push(...primaryEntries);
        sourcesSearched.push('journalEntries (primary)');
      }
    } catch (error) {
      console.warn('Error reading journalEntries:', error);
    }

    // Check alternative localStorage keys
    const alternativeKeys = [
      'journal-entries',
      'journalData',
      'journal',
      'entries',
      'journal-backup',
      'journal-entries-backup',
      'journalEntriesBackup'
    ];

    alternativeKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const entries = JSON.parse(data);
          if (Array.isArray(entries) && entries.length > 0) {
            // Only add entries that aren't duplicates
            const newEntries = entries.filter(entry =>
              !allRecoveredEntries.some(existing =>
                existing.id === entry.id ||
                (existing.date === entry.date && existing.content === entry.content)
              )
            );
            if (newEntries.length > 0) {
              allRecoveredEntries.push(...newEntries);
              sourcesSearched.push(`${key} (${newEntries.length} entries)`);
            }
          }
        }
      } catch (error) {
        console.warn(`Error reading ${key}:`, error);
      }
    });

    // Check sessionStorage
    try {
      const sessionEntries = JSON.parse(sessionStorage.getItem('journalEntries') || '[]');
      if (sessionEntries.length > 0) {
        const newEntries = sessionEntries.filter(entry =>
          !allRecoveredEntries.some(existing =>
            existing.id === entry.id ||
            (existing.date === entry.date && existing.content === entry.content)
          )
        );
        if (newEntries.length > 0) {
          allRecoveredEntries.push(...newEntries);
          sourcesSearched.push(`sessionStorage (${newEntries.length} entries)`);
        }
      }
    } catch (error) {
      console.warn('Error reading sessionStorage:', error);
    }

    // Filter out obvious dummy/test data
    const realEntries = this.filterRealEntries(allRecoveredEntries);

    return {
      recoveredEntries: realEntries,
      sourcesSearched,
      success: realEntries.length > 0,
      message: `Found ${realEntries.length} real journal entries from ${sourcesSearched.length} sources`
    };
  }

  /**
   * Recover and restore entries to localStorage
   */
  static recoverEntries(): RecoveryResult {
    const recoveryResult = this.scanForRecoverableEntries();

    if (recoveryResult.success && recoveryResult.recoveredEntries.length > 0) {
      // Save recovered entries to primary storage
      localStorage.setItem('journalEntries', JSON.stringify(recoveryResult.recoveredEntries));

      // Also create a backup
      const backupKey = `journal-backup-${new Date().toISOString()}`;
      localStorage.setItem(backupKey, JSON.stringify(recoveryResult.recoveredEntries));

      return {
        ...recoveryResult,
        message: `✅ Successfully recovered ${recoveryResult.recoveredEntries.length} journal entries! ${recoveryResult.message}`
      };
    }

    return {
      ...recoveryResult,
      message: '❌ No recoverable journal entries found'
    };
  }

  /**
   * Filter out dummy/test entries and keep only real user content
   */
  private static filterRealEntries(entries: any[]): any[] {
    return entries.filter(entry => {
      // Keep entries with real content
      if (entry.reflections && entry.reflections.trim().length > 20) return true;
      if (entry.content && entry.content.trim().length > 20) return true;
      if (entry.gratitude && entry.gratitude.trim().length > 10) return true;
      if (entry.biggestWin && entry.biggestWin.trim().length > 10) return true;
      if (entry.learning && entry.learning.trim().length > 10) return true;

      // Remove entries that are clearly dummy/test data
      const content = (entry.content || entry.reflections || '').toLowerCase();
      if (content.includes('dummy') || content.includes('sample') || content.includes('test')) return false;
      if (entry.title && (entry.title.toLowerCase().includes('dummy') || entry.title.toLowerCase().includes('test'))) return false;

      // Keep entries with real user IDs (timestamps)
      if (entry.id && typeof entry.id === 'number' && entry.id > 1000000000000) return true;
      if (entry.id && typeof entry.id === 'string' && entry.id.includes('journal-')) {
        const timestamp = parseInt(entry.id.split('-')[1]);
        if (timestamp > 1000000000000) return true;
      }

      // Keep entries with meaningful dates (recent entries)
      if (entry.date) {
        const entryDate = new Date(entry.date);
        const now = new Date();
        const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff >= 0 && daysDiff <= 365) return true; // Keep entries from last year
      }

      return false;
    });
  }

  /**
   * Create emergency backup of current entries
   */
  static createEmergencyBackup(): void {
    try {
      const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      if (entries.length > 0) {
        const backupKey = `journal-emergency-backup-${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify(entries));
        console.log(`✅ Emergency backup created: ${backupKey} with ${entries.length} entries`);
      }
    } catch (error) {
      console.error('Failed to create emergency backup:', error);
    }
  }

  /**
   * Get list of available backups
   */
  static getAvailableBackups(): string[] {
    const backups: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('journal-backup') || key.includes('journal-emergency-backup'))) {
        backups.push(key);
      }
    }
    return backups.sort();
  }
}

// Add recovery functions to window for easy access
if (typeof window !== 'undefined') {
  (window as any).journalRecovery = {
    scan: () => JournalDataRecovery.scanForRecoverableEntries(),
    recover: () => JournalDataRecovery.recoverEntries(),
    backup: () => JournalDataRecovery.createEmergencyBackup(),
    listBackups: () => JournalDataRecovery.getAvailableBackups()
  };

  console.log('🔧 Journal recovery tools added to window.journalRecovery');
  console.log('   - window.journalRecovery.scan() - Scan for recoverable entries');
  console.log('   - window.journalRecovery.recover() - Recover lost entries');
  console.log('   - window.journalRecovery.backup() - Create emergency backup');
  console.log('   - window.journalRecovery.listBackups() - List available backups');
}