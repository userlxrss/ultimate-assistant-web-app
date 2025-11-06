import React, { useState, useEffect } from 'react';

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  reflection: string;
  gratitude: string;
  mood: number;
  energy: number;
  tags?: string[];
}

const JournalTab: React.FC = () => {
  // Month folder state
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'folders' | 'recent'>('folders');

  // Modal state
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Existing journal state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [journalEntry, setJournalEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    reflection: '',
    gratitude: '',
    mood: 7,
    energy: 5,
    tags: [] as string[]
  });

  // Auto-expand current month on mount
  useEffect(() => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    setExpandedMonths([currentMonth]);
  }, []);

  // Load entries from localStorage on mount
  useEffect(() => {
    const loadEntries = () => {
      const savedEntries = localStorage.getItem('journalEntries');
      if (savedEntries) {
        try {
          const parsedEntries = JSON.parse(savedEntries);

          // Validate that entries have the required structure
          const validEntries = parsedEntries.filter((entry: any) => {
            return entry &&
                   typeof entry.id === 'string' &&
                   typeof entry.date === 'string' &&
                   typeof entry.reflection === 'string' &&
                   typeof entry.gratitude === 'string' &&
                   (entry.reflection.trim() || entry.gratitude.trim()); // At least one field has content
          });

          // If we found invalid entries, they were likely dummy data
          if (validEntries.length !== parsedEntries.length) {
            console.warn(`Cleaned up ${parsedEntries.length - validEntries.length} invalid journal entries`);
            localStorage.setItem('journalEntries', JSON.stringify(validEntries));
          }

          setEntries(validEntries);
        } catch (error) {
          console.error('Error loading journal entries:', error);
          // Clear corrupted data
          localStorage.removeItem('journalEntries');
          setEntries([]);
        }
      }
    };

    loadEntries();
  }, []);

  // Add a global function to clear journal data (for debugging/emergency use)
  useEffect(() => {
    (window as any).clearJournalData = () => {
      if (confirm('Are you sure you want to clear ALL journal entries? This cannot be undone.')) {
        localStorage.removeItem('journalEntries');
        setEntries([]);
        console.log('Journal data cleared successfully');
        alert('Journal data cleared successfully');
      }
    };
  }, []);

  // Enhanced auto-expand with buffer
  const handleTextareaAutoExpand = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto'; // Reset
    const newHeight = Math.max(80, textarea.scrollHeight + 4); // Add 4px buffer
    textarea.style.height = newHeight + 'px';
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string | number) => {
    setJournalEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save journal entry (create or update)
  const handleSaveEntry = () => {
    if (!journalEntry.reflection.trim() && !journalEntry.gratitude.trim()) {
      alert('Please write at least a reflection or gratitude entry.');
      return;
    }

    let updatedEntries: JournalEntry[];

    if (editingEntryId) {
      // Update existing entry
      updatedEntries = entries.map(entry =>
        entry.id === editingEntryId
          ? { ...entry, ...journalEntry }
          : entry
      );
      alert('Journal entry updated successfully!');
    } else {
      // Create new entry
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        ...journalEntry,
        date: new Date().toISOString()
      };
      updatedEntries = [newEntry, ...entries];
      alert('Journal entry saved successfully!');
    }

    setEntries(updatedEntries);
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));

    // Dispatch custom event to notify other components of the update
    window.dispatchEvent(new CustomEvent('journalEntriesUpdated', { detail: updatedEntries }));

    // Reset form and editing state
    setEditingEntryId(null);
    setJournalEntry({
      date: new Date().toISOString().split('T')[0],
      title: '',
      reflection: '',
      gratitude: '',
      mood: 7,
      energy: 5,
      tags: []
    });

    // Reset textareas height
    const textareas = document.querySelectorAll('.auto-expand-textarea') as NodeListOf<HTMLTextAreaElement>;
    textareas.forEach(textarea => {
      textarea.style.height = '80px';
    });
  };

  // Organize entries by month
  const organizeEntriesByMonth = () => {
    const organized: Record<string, {
      entries: JournalEntry[];
      avgMood: number | string;
      totalEntries: number;
    }> = {};

    entries.forEach(entry => {
      const date = new Date(entry.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!organized[monthYear]) {
        organized[monthYear] = {
          entries: [],
          avgMood: 0,
          totalEntries: 0
        };
      }

      organized[monthYear].entries.push(entry);
    });

    // Calculate stats for each month
    Object.keys(organized).forEach(monthYear => {
      const monthData = organized[monthYear];
      monthData.totalEntries = monthData.entries.length;
      monthData.avgMood = monthData.entries.length > 0
        ? (monthData.entries.reduce((sum, e) => sum + e.mood, 0) / monthData.entries.length).toFixed(1)
        : 'N/A';

      // Sort entries within month by date (newest first)
      monthData.entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return organized;
  };

  // Toggle month expansion
  const toggleMonth = (monthYear: string) => {
    setExpandedMonths(prev =>
      prev.includes(monthYear)
        ? prev.filter(m => m !== monthYear)
        : [...prev, monthYear]
    );
  };

  // Modal functions
  const openMonthModal = (monthYear: string) => {
    setSelectedMonth(monthYear);
    setIsModalOpen(true);
  };

  const closeMonthModal = () => {
    setIsModalOpen(false);
    setSelectedMonth(null);
  };

  // Get month emoji based on avg mood
  const getMonthEmoji = (avgMood: number | string) => {
    if (avgMood === 'N/A') return '📔';
    const mood = parseFloat(avgMood as string);
    if (mood >= 8) return '😊';
    if (mood >= 6) return '🙂';
    if (mood >= 4) return '😐';
    return '😔';
  };

  // Format date for display
  const formatEntryDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Delete entry handler
  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Delete this entry? This action cannot be undone.')) {
      const updatedEntries = entries.filter(e => e.id !== entryId);
      setEntries(updatedEntries);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));

      // Dispatch custom event to notify other components of the update
      window.dispatchEvent(new CustomEvent('journalEntriesUpdated', { detail: updatedEntries }));
    }
  };

  // View entry in expanded mode
  const handleViewEntry = (entry: JournalEntry) => {
    // Fill the form with the entry data
    setJournalEntry({
      date: entry.date.split('T')[0],
      title: entry.title,
      mood: entry.mood,
      energy: entry.energy,
      reflection: entry.reflection,
      gratitude: entry.gratitude,
      tags: entry.tags || []
    });

    // Scroll to form smoothly
    const formCard = document.querySelector('.journal-form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Edit entry handler (similar to view but with edit mode indication)
  const handleEditEntry = (entry: JournalEntry) => {
    // Set editing state
    setEditingEntryId(entry.id);

    // Fill the form with the entry data for editing
    setJournalEntry({
      date: entry.date.split('T')[0],
      title: entry.title,
      mood: entry.mood,
      energy: entry.energy,
      reflection: entry.reflection,
      gratitude: entry.gratitude,
      tags: entry.tags || []
    });

    // Scroll to form smoothly
    const formCard = document.querySelector('.journal-form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Focus on title field for editing
    setTimeout(() => {
      const titleInput = document.querySelector('input[placeholder*="title"]') as HTMLInputElement;
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }
    }, 500);
  };

  // Enhanced Quick Prompt with full expansion
  const handleQuickPrompt = (type: 'gratitude' | 'reflection' | 'goals') => {
    const prompts = {
      gratitude: {
        reflection: "Today I'm grateful for...\n\nThree things that made me smile:\n1. \n2. \n3. \n\nWhat brought me joy:\n\nSpecial moments:",
        gratitude: "I appreciate...\n\nI'm thankful for...\n\nWhat made today special:\n\nPeople who helped me:"
      },
      reflection: {
        reflection: "Today was... (describe your day)\n\nWhat went well:\n\n\nWhat I learned:\n\n\nWhat challenged me:\n\n\nHow I grew:\n\n\nTomorrow I will:",
        gratitude: "I'm thankful for...\n\nMoments of gratitude today:\n\nPeople I appreciate:"
      },
      goals: {
        reflection: "My goals for today:\n1. \n2. \n3. \n\nProgress on long-term goals:\n\n\nObstacles I faced:\n\n\nHow I overcame them:\n\n\nNext steps:\n\n\nLessons learned:",
        gratitude: "I'm proud of myself for...\n\nAchievements today:\n\nProgress I made:"
      }
    };

    const prompt = prompts[type];
    if (prompt) {
      setJournalEntry(prev => ({
        ...prev,
        reflection: prompt.reflection,
        gratitude: prompt.gratitude
      }));

      // Full expansion with animation
      setTimeout(() => {
        const textareas = document.querySelectorAll('.journal-form-card textarea') as NodeListOf<HTMLTextAreaElement>;
        textareas.forEach((textarea, index) => {
          // Force full height calculation
          textarea.style.height = 'auto';
          const fullHeight = textarea.scrollHeight + 8; // Extra buffer
          textarea.style.height = fullHeight + 'px';

          // Add animation class
          textarea.classList.add('template-loaded');

          // Focus and scroll to first textarea
          if (index === 0) {
            setTimeout(() => {
              textarea.focus();
              textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }

          // Remove animation class
          setTimeout(() => {
            textarea.classList.remove('template-loaded');
          }, 500);
        });
      }, 50);
    }
  };

  // Export month entries to Markdown
  const handleExportMonth = async (monthName: string) => {
    try {
      console.log('Exporting journal entries for:', monthName);

      // Get entries for this month
      const entries = getEntriesForMonth(monthName);

      if (!entries || entries.length === 0) {
        alert('No entries found for this month');
        return;
      }

      // Generate markdown content
      const markdownContent = generateMarkdown(monthName, entries);

      // Create and download file
      downloadMarkdownFile(markdownContent, monthName);

      // Show success notification
      showSuccessNotification(`Exported ${entries.length} entries for ${monthName}`);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export entries. Please try again.');
    }
  };

  // Export all entries to Markdown
  const handleExportAllEntries = async () => {
    try {
      console.log('Exporting all journal entries...');

      if (entries.length === 0) {
        alert('No journal entries found');
        return;
      }

      // Generate markdown
      const markdownContent = generateMarkdown('All Time', entries);

      // Download
      downloadMarkdownFile(markdownContent, 'all-entries');

      showSuccessNotification(`Exported ${entries.length} entries`);

    } catch (error) {
      console.error('Export all failed:', error);
      alert('Failed to export entries. Please try again.');
    }
  };

  // Get entries for specific month
  const getEntriesForMonth = (monthName: string) => {
    try {
      // Parse month name (e.g., "October 2025")
      const [month, year] = monthName.split(' ');
      const monthNumber = new Date(`${month} 1, ${year}`).getMonth();

      // Filter entries by month
      const monthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === monthNumber &&
               entryDate.getFullYear() === parseInt(year);
      });

      // Sort entries by date (newest first)
      return monthEntries.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

    } catch (error) {
      console.error('Error getting entries:', error);
      return [];
    }
  };

  // Generate formatted markdown content
  const generateMarkdown = (monthName: string, entries: any[]) => {
    let markdown = '';

    // Header
    markdown += `# 📔 Journal Entries - ${monthName}\n\n`;
    markdown += `**Total Entries:** ${entries.length}\n\n`;
    markdown += `---\n\n`;

    // Each entry
    entries.forEach((entry, index) => {
      const date = new Date(entry.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Entry header
      markdown += `## ${entry.title || 'Untitled'}\n\n`;
      markdown += `**Date:** ${formattedDate} at ${formattedTime}\n\n`;

      // Mood and Energy (if available)
      if (entry.mood !== undefined || entry.energy !== undefined) {
        markdown += `**Mood:** ${entry.mood || 'N/A'}/10 | **Energy:** ${entry.energy || 'N/A'}/10\n\n`;
      }

      // Entry content sections
      if (entry.reflection) {
        markdown += `### 📝 Reflections\n\n`;
        markdown += `${entry.reflection}\n\n`;
      }

      if (entry.gratitude) {
        markdown += `### 💖 Gratitude\n\n`;
        markdown += `${entry.gratitude}\n\n`;
      }

      // Tags (if available)
      if (entry.tags && entry.tags.length > 0) {
        markdown += `**Tags:** ${entry.tags.join(', ')}\n\n`;
      }

      // Separator between entries
      if (index < entries.length - 1) {
        markdown += `---\n\n`;
      }
    });

    // Footer
    markdown += `\n---\n\n`;
    markdown += `*Exported from Productivity Hub on ${new Date().toLocaleDateString()}*\n`;

    return markdown;
  };

  // Download markdown file
  const downloadMarkdownFile = (content: string, monthName: string) => {
    // Create filename (e.g., "journal-october-2025.md")
    const filename = `journal-${monthName.toLowerCase().replace(' ', '-')}.md`;

    // Create blob
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ Downloaded: ${filename}`);
  };

  // Success notification
  const showSuccessNotification = (message: string) => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-slide-in-right';
    notification.textContent = `✓ ${message}`;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-in-right {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in-right {
        animation: slide-in-right 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
  };

  return (
    <div className="journal-container">
      <style>{`
        /* Journal Container Styles */
        .journal-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Journal Form Card */
        .journal-form-card {
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .journal-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .journal-title {
          font-size: 24px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
        }

        .quick-prompts {
          display: flex;
          gap: 8px;
        }

        .quick-prompt-btn {
          padding: 8px 16px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .quick-prompt-btn:hover {
          background: #3B82F6;
          color: white;
          border-color: #3B82F6;
        }

        /* Journal Form Grid */
        .journal-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
        }

        .form-field.full-width {
          grid-column: 1 / -1;
        }

        .form-field label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-field input,
        .form-field select {
          padding: 12px 16px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 15px;
          outline: none;
          transition: all 200ms ease;
        }

        .form-field input:focus,
        .form-field select:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .auto-expand-textarea {
          min-height: 80px;
          max-height: 800px;
          padding: 12px 16px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 15px;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: height 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
        }

        .auto-expand-textarea:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Template loaded animation */
        @keyframes templateLoaded {
          0% {
            opacity: 0.7;
            transform: translateY(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .template-loaded {
          animation: templateLoaded 500ms ease;
          border-color: #3B82F6 !important;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.15) !important;
        }

        /* Character Count */
        .char-count {
          font-size: 11px;
          color: #94A3B8;
          margin-top: 5px;
          text-align: right;
          font-weight: 500;
        }

        /* Slider Styles */
        .slider-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .slider {
          flex: 1;
          height: 6px;
          background: #E5E7EB;
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #3B82F6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider-value {
          min-width: 30px;
          text-align: center;
          font-weight: 600;
          color: #3B82F6;
        }

        /* Journal Actions */
        .journal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-primary {
          padding: 12px 24px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .btn-primary:hover {
          background: #2563EB;
        }

        .btn-secondary {
          padding: 12px 24px;
          background: #F8FAFC;
          color: #64748B;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .btn-secondary:hover {
          background: #E2E8F0;
        }

        /* Search and Filter Bar */
        .search-filter-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 12px 16px 12px 44px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 15px;
          outline: none;
          position: relative;
        }

        .search-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-container {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          pointer-events: none;
        }

        /* Recent Entries Card */
        .recent-card {
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        /* Recent Entries Header */
        .recent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #F1F5F9;
        }

        .view-toggle {
          padding: 4px 10px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .view-toggle:hover {
          background: #3B82F6;
          color: white;
          border-color: #3B82F6;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 48px;
          color: #94A3B8;
        }

        .empty-state svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state p {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #64748B;
        }

        .empty-state span {
          font-size: 14px;
        }

        /* Month Folders */
        .month-folders {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .month-folder {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          overflow: hidden;
          transition: all 200ms ease;
        }

        .month-folder:hover {
          border-color: #3B82F6;
          box-shadow: 0 2px 8px rgba(59,130,246,0.1);
        }

        .month-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .month-header:hover {
          background: rgba(59,130,246,0.05);
          cursor: pointer;
        }

        .month-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .month-emoji {
          font-size: 20px;
        }

        .month-name {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
        }

        .month-count {
          font-size: 11px;
          font-weight: 600;
          color: #94A3B8;
        }

        .month-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .month-mood {
          font-size: 11px;
          font-weight: 600;
          color: #3B82F6;
          padding: 3px 8px;
          background: rgba(59,130,246,0.1);
          border-radius: 5px;
        }

        .expand-icon {
          font-size: 10px;
          color: #94A3B8;
          transition: transform 200ms ease;
        }

        .expand-icon.expanded {
          transform: rotate(90deg);
        }

        /* Month Entries */
        .month-entries {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px 12px 12px;
          background: white;
          animation: expandMonth 300ms ease;
        }

        @keyframes expandMonth {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 2000px;
          }
        }

        /* Entry Item */
        .entry-item {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 16px;
          transition: all 150ms ease;
        }

        .entry-item:hover {
          border-color: #3B82F6;
          box-shadow: 0 2px 8px rgba(59,130,246,0.1);
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .entry-title {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
        }

        .entry-date {
          font-size: 12px;
          color: #64748B;
        }

        .entry-preview {
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
          margin: 8px 0;
        }

        .entry-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }

        .entry-meta {
          display: flex;
          gap: 12px;
        }

        .entry-mood,
        .entry-energy {
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
        }

        .entry-actions {
          display: flex;
          gap: 8px;
        }

        .btn-entry-action {
          padding: 4px 8px;
          background: transparent;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-entry-action:hover {
          background: #E2E8F0;
        }

        /* Entry Tags */
        .entry-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin: 6px 0;
        }

        .entry-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          background: #EFF6FF;
          color: #1E40AF;
          border-radius: 4px;
        }

        /* Show More */
        .show-more {
          text-align: center;
          padding: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
          background: #F9FAFB;
          border-radius: 6px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .show-more:hover {
          background: #3B82F6;
          color: white;
        }

        /* Entries List (Simple View) */
        .entries-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          .journal-container {
            background: #0F172A;
            color: #F8FAFC;
          }

          .journal-form-card,
          .recent-card,
          .month-folder {
            background: #1E293B;
            border-color: #334155;
          }

          .month-entries {
            background: #0F172A;
          }

          .entry-item {
            background: #0F172A;
            border-color: #334155;
          }

          .journal-title,
          .entry-title,
          .month-name {
            color: #F8FAFC;
          }

          .form-field label {
            color: #E2E8F0;
          }

          .form-field input,
          .form-field select,
          .auto-expand-textarea {
            background: #0F172A;
            border-color: #334155;
            color: #F8FAFC;
          }

          .search-input {
            background: #0F172A;
            border-color: #334155;
            color: #F8FAFC;
          }

          .char-count {
            color: #64748B;
          }

          .quick-prompt-btn {
            background: #0F172A;
            border-color: #334155;
            color: #94A3B8;
          }

          .view-toggle {
            background: #0F172A;
            border-color: #334155;
            color: #94A3B8;
          }

          .show-more {
            background: #0F172A;
            color: #94A3B8;
          }
        }
      `}</style>

      {/* Journal Form */}
      <div className="journal-form-card">
        <div className="journal-form-header">
          <h2 className="journal-title">
              {editingEntryId ? '✏️ Edit Journal Entry' : '📝 Journal Entry'}
            </h2>
          <div className="quick-prompts">
            <button
              className="quick-prompt-btn"
              onClick={() => handleQuickPrompt('gratitude')}
            >
              🙏 Gratitude
            </button>
            <button
              className="quick-prompt-btn"
              onClick={() => handleQuickPrompt('reflection')}
            >
              💭 Reflection
            </button>
            <button
              className="quick-prompt-btn"
              onClick={() => handleQuickPrompt('goals')}
            >
              🎯 Goals
            </button>
          </div>
        </div>

        <div className="journal-form-grid">
          <div className="form-field">
            <label>
              📅 Date
            </label>
            <input
              type="date"
              value={journalEntry.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>
              📋 Title (Optional)
            </label>
            <input
              type="text"
              placeholder="Give your entry a title..."
              value={journalEntry.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>

          <div className="form-field full-width">
            <label>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Reflections
            </label>
            <textarea
              placeholder="How was your day? What's on your mind?"
              value={journalEntry.reflection}
              onChange={(e) => {
                handleInputChange('reflection', e.target.value);
                handleTextareaAutoExpand(e);
              }}
              onInput={handleTextareaAutoExpand}
              className="auto-expand-textarea"
            />
            <div className="char-count">
              {journalEntry.reflection.length} characters
              {journalEntry.reflection.length > 0 && ` · ${Math.ceil(journalEntry.reflection.split(' ').filter(w => w).length / 200)} min read`}
            </div>
          </div>

          <div className="form-field full-width">
            <label>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Gratitude
            </label>
            <textarea
              placeholder="What are you grateful for today?"
              value={journalEntry.gratitude}
              onChange={(e) => {
                handleInputChange('gratitude', e.target.value);
                handleTextareaAutoExpand(e);
              }}
              onInput={handleTextareaAutoExpand}
              className="auto-expand-textarea"
            />
            <div className="char-count">
              {journalEntry.gratitude.length} characters
            </div>
          </div>

          <div className="form-field">
            <label>
              😊 Mood: {journalEntry.mood}/10
            </label>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="10"
                value={journalEntry.mood}
                onChange={(e) => handleInputChange('mood', parseInt(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{journalEntry.mood}</span>
            </div>
          </div>

          <div className="form-field">
            <label>
              ⚡ Energy: {journalEntry.energy}/10
            </label>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="10"
                value={journalEntry.energy}
                onChange={(e) => handleInputChange('energy', parseInt(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{journalEntry.energy}</span>
            </div>
          </div>
        </div>

        <div className="journal-actions">
          <button
            className="btn-primary"
            onClick={handleSaveEntry}
          >
            💾 {editingEntryId ? 'Update Entry' : 'Save Entry'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setEditingEntryId(null);
              setJournalEntry({
                date: new Date().toISOString().split('T')[0],
                title: '',
                reflection: '',
                gratitude: '',
                mood: 7,
                energy: 5,
                tags: []
              });
            }}
          >
            🔄 Clear
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search entries by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Recent Entries with Month Folders */}
      <div className="recent-card">
        <div className="recent-header">
          <h3>Recent Entries</h3>
          <div className="flex items-center gap-2">
            <button
              className="view-toggle"
              onClick={() => setViewMode(viewMode === 'folders' ? 'recent' : 'folders')}
            >
              {viewMode === 'folders' ? '📋 List' : '📁 Folders'}
            </button>
            <button
              onClick={handleExportAllEntries}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-all flex items-center gap-1"
              title="Export all entries to Markdown"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export All
            </button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p>No entries yet</p>
            <span>Start writing to see your entries here</span>
          </div>
        ) : viewMode === 'folders' ? (
          <div className="month-folders">
            {Object.entries(organizeEntriesByMonth())
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([monthYear, monthData]) => {
                const filteredEntries = searchQuery
                  ? monthData.entries.filter(e =>
                      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.reflection?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : monthData.entries;

                if (searchQuery && filteredEntries.length === 0) return null;

                return (
                  <div key={monthYear} className="month-folder">
                    <button
                      className="month-header"
                      onClick={() => openMonthModal(monthYear)}
                    >
                      <div className="month-info">
                        <span className="month-emoji">{getMonthEmoji(monthData.avgMood)}</span>
                        <span className="month-name">{monthYear}</span>
                        <span className="month-count">({filteredEntries.length})</span>
                      </div>
                      <div className="month-actions">
                        <span className="month-mood" title="Average mood">
                          {monthData.avgMood !== 'N/A' ? `${monthData.avgMood}/10` : 'N/A'}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
          </div>
        ) : (
          // Simple list view (original Recent Entries)
          <div className="entries-list">
            {entries
              .filter(e =>
                !searchQuery ||
                e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.reflection?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .slice(0, 10)
              .map(entry => (
                <div key={entry.id} className="entry-item">
                  <div className="entry-header">
                    <span className="entry-title">{entry.title || 'Untitled'}</span>
                    <span className="entry-date">{formatEntryDate(entry.date)}</span>
                  </div>
                  {entry.reflection && (
                    <p className="entry-preview">
                      {entry.reflection.substring(0, 80)}{entry.reflection.length > 80 ? '...' : ''}
                    </p>
                  )}
                  <div className="entry-footer">
                    <div className="entry-meta">
                      <span className="entry-mood">😊 {entry.mood}</span>
                      <span className="entry-energy">⚡ {entry.energy}</span>
                    </div>
                    <div className="entry-actions">
                      <button
                        className="btn-entry-action"
                        title="Edit"
                        onClick={() => handleEditEntry(entry)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-entry-action"
                        title="View"
                        onClick={() => handleViewEntry(entry)}
                      >
                        👁️
                      </button>
                      <button
                        className="btn-entry-action"
                        title="Delete"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Month Entries Modal */}
        {isModalOpen && selectedMonth && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={closeMonthModal}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {getMonthEmoji(organizeEntriesByMonth()[selectedMonth]?.avgMood || 'N/A')}
                  {selectedMonth}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportMonth(selectedMonth)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                    title="Export month entries to Markdown"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export MD
                  </button>
                  <button
                    onClick={closeMonthModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Close modal"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                <div className="space-y-4">
                  {getEntriesForMonth(selectedMonth).map(entry => (
                    <div key={entry.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {entry.title || 'Untitled'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                            😊 {entry.mood}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                            ⚡ {entry.energy}
                          </span>
                        </div>
                      </div>

                      {entry.reflection && (
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Reflections
                          </h4>
                          <p className="text-gray-600 whitespace-pre-wrap">{entry.reflection}</p>
                        </div>
                      )}

                      {entry.gratitude && (
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            Gratitude
                          </h4>
                          <p className="text-gray-600 whitespace-pre-wrap">{entry.gratitude}</p>
                        </div>
                      )}

                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {entry.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {getEntriesForMonth(selectedMonth).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <p className="text-lg font-medium">No entries found</p>
                      <p className="text-sm">There are no journal entries for this month.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalTab;