import React, { useState, useEffect } from 'react';
import { JournalStorage } from '../utils/journalStorage';
import { ExtendedJournalEntry } from '../types/journal';

const JournalSimple: React.FC = () => {
  // Add state for journal
  // Add to existing journal state
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [moodTrend, setMoodTrend] = useState({ direction: 'up', percent: 12 });

  // Update journalEntry state to include tags
  const [journalEntry, setJournalEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    mood: 7,
    energy: 7,
    reflections: '',
    gratitude: '',
    tags: [] // ADD THIS
  });

  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Month folders state
  const [expandedMonths, setExpandedMonths] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState(new Set());

  // Month folders functions
  const toggleMonth = (monthYear) => {
    setExpandedMonths(prev =>
      prev.includes(monthYear)
        ? prev.filter(m => m !== monthYear)
        : [...prev, monthYear]
    );
  };

  const organizeEntriesByMonth = () => {
    const monthGroups = {};
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthGroups[monthYear]) {
        monthGroups[monthYear] = {
          entries: [],
          avgMood: 0,
          totalEntries: 0
        };
      }
      monthGroups[monthYear].entries.push(entry);
      monthGroups[monthYear].totalEntries++;
    });

    // Calculate average mood for each month
    Object.keys(monthGroups).forEach(monthYear => {
      const monthEntries = monthGroups[monthYear].entries;
      const avgMood = monthEntries.length > 0
        ? (monthEntries.reduce((sum, e) => sum + (e.mood || 0), 0) / monthEntries.length).toFixed(1)
        : 0;
      monthGroups[monthYear].avgMood = avgMood;
    });

    return monthGroups;
  };

  const getMonthEmoji = (avgMood) => {
    const mood = parseFloat(avgMood);
    if (mood >= 8) return '🎉';
    if (mood >= 7) return '😊';
    if (mood >= 6) return '🙂';
    if (mood >= 5) return '😐';
    if (mood >= 4) return '😔';
    return '😢';
  };

  // Generate test entries for demo
  useEffect(() => {
    const generateTestEntries = () => {
      const testEntries = [];
      const today = new Date();
      const reflections = [
        "Had a productive morning meeting with the team. The new project proposal was well-received and I feel optimistic about our direction.",
        "Struggled with focus today, but managed to complete the quarterly report. Need to work on time management.",
        "Great conversation with a mentor today. Learned so much about leadership and career growth.",
        "Feeling grateful for the support of my colleagues. We really pulled together to meet the deadline.",
        "Tried a new approach to problem-solving and it paid off. Innovation requires patience."
      ];

      for (let i = 0; i < 15; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);

        testEntries.push({
          id: `test-${i}`,
          date: date.toISOString().split('T')[0],
          title: `Journal Entry ${i + 1}`,
          mood: Math.floor(Math.random() * 10) + 1,
          energy: Math.floor(Math.random() * 10) + 1,
          reflections: reflections[Math.floor(Math.random() * reflections.length)],
          gratitude: "Today I'm grateful for good health and supportive friends.",
          timestamp: date.toISOString()
        });
      }
      return testEntries;
    };

    // Set test entries if no entries exist
    if (entries.length === 0) {
      const testEntries = generateTestEntries();
      setEntries(testEntries);
    }

    // Auto-expand current month
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    setExpandedMonths([currentMonth]);
  }, []);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setJournalEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save entry
  const handleSaveEntry = async () => {
    if (!journalEntry.reflections && !journalEntry.gratitude) {
      alert('Please write at least a reflection or gratitude');
      return;
    }

    setSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newEntry = {
        ...journalEntry,
        id: Date.now(),
        timestamp: new Date().toISOString()
      };

      setEntries(prev => [newEntry, ...prev]);

      // Save to localStorage
      const savedEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      savedEntries.unshift(newEntry);
      localStorage.setItem('journalEntries', JSON.stringify(savedEntries));

      // Reset form
      setJournalEntry({
        date: new Date().toISOString().split('T')[0],
        title: '',
        mood: 7,
        energy: 7,
        reflections: '',
        gratitude: '',
        tags: []
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      alert('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  // Handle adding tags
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!journalEntry.tags.includes(newTag)) {
        setJournalEntry(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  // Handle removing tags
  const handleRemoveTag = (tagToRemove) => {
    setJournalEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Auto-expand textarea as user types
  const handleTextareaAutoExpand = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = textarea.scrollHeight + 'px'; // Set to content height
  };

  // Trigger auto-expand for all textareas
  useEffect(() => {
    const textareas = document.querySelectorAll('.journal-form-card textarea');
    textareas.forEach(textarea => {
      // Auto-expand on mount if there's content
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }, [journalEntry.reflections, journalEntry.gratitude]);

  // Handle quick prompts with auto-expand
  const handleQuickPrompt = (type) => {
    const prompts = {
      gratitude: {
        reflections: "Today I'm grateful for...\n\nThree things that made me smile:\n1. \n2. \n3. \n\nWhat brought me joy:",
        gratitude: "I appreciate...\n\nI'm thankful for...\n\nWhat made today special:"
      },
      reflection: {
        reflections: "Today was... (describe your day)\n\nWhat went well:\n\n\nWhat I learned:\n\n\nWhat challenged me:\n\n\nTomorrow I will:",
        gratitude: "I'm thankful for...\n\nMoments of gratitude today:"
      },
      goals: {
        reflections: "My goals for today:\n1. \n2. \n3. \n\nProgress on long-term goals:\n\n\nObstacles I faced:\n\n\nHow I overcame them:\n\n\nNext steps:",
        gratitude: "I'm proud of myself for...\n\nAchievements today:"
      }
    };

    const prompt = prompts[type];
    if (prompt) {
      setJournalEntry(prev => ({
        ...prev,
        reflections: prompt.reflections,
        gratitude: prompt.gratitude
      }));

      // Auto-expand and scroll to reflection field
      setTimeout(() => {
        const textareas = document.querySelectorAll('.journal-form-card textarea');
        textareas.forEach((textarea, index) => {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
          textarea.classList.add('template-loaded');

          // Focus first textarea and scroll into view smoothly
          if (index === 0) {
            textarea.focus();
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          // Remove animation class after animation completes
          setTimeout(() => {
            textarea.classList.remove('template-loaded');
          }, 400);
        });
      }, 10);
    }
  };

  // Load entries on mount
  useEffect(() => {
    const saved = localStorage.getItem('journalEntries');
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  // Calculate streak on mount
  useEffect(() => {
    const savedEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');

    // Calculate streak
    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const sortedEntries = savedEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedEntries.length > 0) {
      const lastEntryDate = new Date(sortedEntries[0].date).toDateString();

      if (lastEntryDate === today || lastEntryDate === yesterday) {
        currentStreak = 1;

        for (let i = 1; i < sortedEntries.length; i++) {
          const currentDate = new Date(sortedEntries[i].date);
          const prevDate = new Date(sortedEntries[i - 1].date);
          const diffDays = Math.floor((prevDate - currentDate) / 86400000);

          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    setStreak(currentStreak);
  }, [entries]);

  // Calculate mood trend
  useEffect(() => {
    if (entries.length >= 2) {
      const recent = entries.slice(0, Math.min(7, entries.length));
      const older = entries.slice(7, Math.min(14, entries.length));

      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, e) => sum + e.mood, 0) / recent.length;
        const olderAvg = older.reduce((sum, e) => sum + e.mood, 0) / older.length;
        const diff = ((recentAvg - olderAvg) / olderAvg) * 100;

        setMoodTrend({
          direction: diff >= 0 ? 'up' : 'down',
          percent: Math.abs(Math.round(diff))
        });
      }
    }
  }, [entries]);

  // Calculate stats
  const stats = {
    totalEntries: entries.length,
    thisMonth: entries.filter(e => {
      const entryDate = new Date(e.date);
      const now = new Date();
      return entryDate.getMonth() === now.getMonth() &&
             entryDate.getFullYear() === now.getFullYear();
    }).length,
    avgMood: entries.length > 0
      ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)
      : 'N/A'
  };

  // Export to MD
  const handleExportMD = () => {
    let markdown = '# Journal Entries\n\n';

    entries.forEach(entry => {
      markdown += `## ${entry.title || 'Untitled'}\n`;
      markdown += `**Date:** ${entry.date}\n`;
      markdown += `**Mood:** ${entry.mood}/10 | **Energy:** ${entry.energy}/10\n\n`;
      if (entry.reflections) markdown += `### Reflection\n${entry.reflections}\n\n`;
      if (entry.gratitude) markdown += `### Gratitude\n${entry.gratitude}\n\n`;
      markdown += '---\n\n';
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-export-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  return (
    <>
      <style jsx>{`
        /* ========== JOURNAL PAGE - COMPACT & SOPHISTICATED ========== */

        .journal-page {
          padding: 28px 40px;
          max-width: 1300px;
          margin: 0 auto;
          min-height: 100vh;
          background: #FAFBFC;
        }

        .dark .journal-page {
          background: #0F172A;
        }

        /* ===== COMPACT HEADER ===== */
        .journal-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #E5E7EB;
        }

        .dark .journal-header {
          border-bottom-color: #334155;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title h1 {
          font-size: 24px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 2px;
          letter-spacing: -0.02em;
        }

        .dark .header-title h1 {
          color: #F8FAFC;
        }

        .header-title p {
          font-size: 14px;
          color: #64748B;
        }

        .dark .header-title p {
          color: #94A3B8;
        }

        .btn-export {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: white;
          color: #64748B;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-export:hover {
          background: #3B82F6;
          color: white;
          border-color: #3B82F6;
          box-shadow: 0 2px 8px rgba(59,130,246,0.25);
        }

        .dark .btn-export {
          background: #1E293B;
          border-color: #334155;
          color: #94A3B8;
        }

        .dark .btn-export:hover {
          background: #3B82F6;
          color: white;
        }

        /* Success Toast */
        .success-toast {
          padding: 10px 16px;
          background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
          border: 1px solid #6EE7B7;
          border-radius: 8px;
          color: #065F46;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideDown 300ms ease;
        }

        .dark .success-toast {
          background: rgba(16,185,129,0.15);
          border-color: rgba(16,185,129,0.3);
          color: #6EE7B7;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ===== COMPACT CONTAINER ===== */
        .journal-container {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
        }

        /* ===== COMPACT FORM CARD ===== */
        .journal-form-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .dark .journal-form-card {
          background: #1E293B;
          border-color: #334155;
        }

        .form-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #F1F5F9;
        }

        .dark .form-title {
          color: #F8FAFC;
          border-bottom-color: #334155;
        }

        /* ===== COMPACT FORM FIELDS ===== */
        .form-field {
          margin-bottom: 14px;
        }

        .form-field.flex-grow {
          flex: 1;
        }

        .form-field label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark .form-field label {
          color: #94A3B8;
        }

        .form-field input[type="text"],
        .form-field input[type="date"],
        .form-field textarea {
          width: 100%;
          padding: 9px 12px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          color: #0F172A;
          transition: all 150ms ease;
          font-family: inherit;
        }

        .dark .form-field input[type="text"],
        .dark .form-field input[type="date"],
        .dark .form-field textarea {
          background: #0F172A;
          border-color: #334155;
          color: #F8FAFC;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: #3B82F6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }

        .dark .form-field input:focus,
        .dark .form-field textarea:focus {
          background: #1E293B;
        }

        .form-field textarea {
          resize: none;
          overflow: hidden;
          line-height: 1.5;
          min-height: 70px;
        }

        /* Auto-expand textarea styling */
        .auto-expand-textarea {
          resize: none;
          overflow: hidden;
          min-height: 80px;
          max-height: 600px;
          transition: height 150ms ease, border-color 200ms ease;
        }

        .auto-expand-textarea.template-loaded {
          animation: pulseExpand 400ms ease;
        }

        @keyframes pulseExpand {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59,130,246,0);
          }
          50% {
            transform: scale(1.01);
            box-shadow: 0 0 0 8px rgba(59,130,246,0.1);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59,130,246,0);
          }
        }

        .form-field input::placeholder,
        .form-field textarea::placeholder {
          color: #94A3B8;
        }

        /* Compact Form Row */
        .form-row-split {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        /* ===== COMPACT SLIDERS ===== */
        .sliders-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .slider-field {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 12px;
          transition: all 150ms ease;
        }

        .dark .slider-field {
          background: #0F172A;
          border-color: #334155;
        }

        .slider-field:hover {
          border-color: #3B82F6;
        }

        .slider-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .slider-header label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }

        .dark .slider-header label {
          color: #94A3B8;
        }

        .slider-value {
          font-size: 16px;
          font-weight: 700;
          color: #3B82F6;
        }

        .mood-slider,
        .energy-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
        }

        .mood-slider {
          background: linear-gradient(to right, #EF4444 0%, #F59E0B 50%, #10B981 100%);
        }

        .energy-slider {
          background: linear-gradient(to right, #94A3B8 0%, #3B82F6 50%, #8B5CF6 100%);
        }

        .mood-slider::-webkit-slider-thumb,
        .energy-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: 2px solid #3B82F6;
          transition: all 150ms ease;
        }

        .mood-slider::-webkit-slider-thumb:hover,
        .energy-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .mood-slider::-moz-range-thumb,
        .energy-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: 2px solid #3B82F6;
        }

        /* ===== COMPACT SAVE BUTTON ===== */
        .btn-save-entry {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 20px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
          margin-top: 8px;
        }

        .btn-save-entry:hover {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }

        .btn-save-entry:active {
          transform: translateY(0);
        }

        .btn-save-entry:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 600ms linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ===== COMPACT SIDEBAR ===== */
        .journal-sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .search-card,
        .stats-card,
        .recent-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        .dark .search-card,
        .dark .stats-card,
        .dark .recent-card {
          background: #1E293B;
          border-color: #334155;
        }

        /* Compact Search */
        .search-input {
          width: 100%;
          padding: 9px 12px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 13px;
          color: #0F172A;
          transition: all 150ms ease;
        }

        .dark .search-input {
          background: #0F172A;
          border-color: #334155;
          color: #F8FAFC;
        }

        .search-input:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }

        .search-input::placeholder {
          color: #94A3B8;
        }

        /* Compact Stats */
        .stats-card h3,
        .recent-card h3 {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-bottom: 8px;
          border-bottom: 1px solid #F1F5F9;
        }

        .dark .stats-card h3,
        .dark .recent-card h3 {
          color: #94A3B8;
          border-bottom-color: #334155;
        }

        .stats-grid {
          display: grid;
          gap: 10px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #F9FAFB;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
        }

        .dark .stat-item {
          background: #0F172A;
          border-color: #334155;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
        }

        .dark .stat-label {
          color: #94A3B8;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #3B82F6;
        }

        /* Compact Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 16px;
          text-align: center;
        }

        .empty-state svg {
          color: #CBD5E1;
          margin-bottom: 10px;
        }

        .dark .empty-state svg {
          color: #475569;
        }

        .empty-state p {
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          margin-bottom: 4px;
        }

        .dark .empty-state p {
          color: #94A3B8;
        }

        .empty-state span {
          font-size: 12px;
          color: #94A3B8;
        }

        /* Compact Entries */
        .entries-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .entry-item {
          padding: 10px 12px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .dark .entry-item {
          background: #0F172A;
          border-color: #334155;
        }

        .entry-item:hover {
          border-color: #3B82F6;
          transform: translateX(2px);
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .entry-title {
          font-size: 13px;
          font-weight: 600;
          color: #0F172A;
        }

        .dark .entry-title {
          color: #F8FAFC;
        }

        .entry-date {
          font-size: 10px;
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .entry-meta {
          display: flex;
          gap: 10px;
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
        }

        .dark .entry-meta {
          color: #94A3B8;
        }

        .entry-mood,
        .entry-energy {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Responsive */
        @media (max-width: 1100px) {
          .journal-container {
            grid-template-columns: 1fr;
          }

          .journal-sidebar {
            order: -1;
          }

          .sliders-row {
            grid-template-columns: 1fr;
          }

          .form-row-split {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .journal-page {
            padding: 20px 16px;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .journal-form-card {
            padding: 16px;
          }
        }

        /* ===== FEATURE 5: QUICK PROMPTS ===== */
        .quick-prompts {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #F9FAFB;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .dark .quick-prompts {
          background: #0F172A;
        }

        .prompts-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark .prompts-label {
          color: #94A3B8;
        }

        .prompt-btn {
          padding: 6px 12px;
          background: white;
          color: #64748B;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .prompt-btn:hover {
          background: #3B82F6;
          color: white;
          border-color: #3B82F6;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(59,130,246,0.2);
        }

        .dark .prompt-btn {
          background: #1E293B;
          border-color: #334155;
          color: #94A3B8;
        }

        .dark .prompt-btn:hover {
          background: #3B82F6;
          color: white;
        }

        /* ===== FEATURE 3: TAGS ===== */
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #EFF6FF;
          color: #1E40AF;
          border: 1px solid #BFDBFE;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .dark .tag {
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.3);
          color: #93C5FD;
        }

        .tag-remove {
          padding: 0;
          width: 16px;
          height: 16px;
          background: transparent;
          border: none;
          color: #1E40AF;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          line-height: 1;
        }

        .dark .tag-remove {
          color: #93C5FD;
        }

        .tag-remove:hover {
          background: rgba(30,64,175,0.1);
        }

        .dark .tag-remove:hover {
          background: rgba(59,130,246,0.2);
        }

        /* ===== FEATURE 1: WRITING STREAK ===== */
        .streak-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border-radius: 10px;
          margin-bottom: 16px;
          border: 1px solid #FCD34D;
        }

        .dark .streak-banner {
          background: linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.2) 100%);
          border-color: rgba(245,158,11,0.4);
        }

        .streak-flame {
          font-size: 32px;
          animation: flicker 2s infinite;
        }

        @keyframes flicker {
          0%, 100% { transform: scale(1) rotate(-5deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }

        .streak-info {
          display: flex;
          flex-direction: column;
        }

        .streak-number {
          font-size: 24px;
          font-weight: 800;
          color: #D97706;
          line-height: 1;
        }

        .dark .streak-number {
          color: #FCD34D;
        }

        .streak-label {
          font-size: 11px;
          font-weight: 600;
          color: #92400E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark .streak-label {
          color: #FCD34D;
        }

        /* ===== FEATURE 2: MOOD TREND ===== */
        .stat-with-trend {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .trend-indicator {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .trend-indicator.up {
          color: #10B981;
          background: rgba(16,185,129,0.1);
        }

        .trend-indicator.down {
          color: #EF4444;
          background: rgba(239,68,68,0.1);
        }

        /* ===== FEATURE 4: ENTRY PREVIEW & ACTIONS ===== */
        .entry-preview {
          font-size: 12px;
          color: #64748B;
          line-height: 1.4;
          margin: 6px 0;
        }

        .dark .entry-preview {
          color: #94A3B8;
        }

        .entry-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #F1F5F9;
        }

        .dark .entry-footer {
          border-top-color: #334155;
        }

        .entry-actions {
          display: flex;
          gap: 4px;
        }

        .btn-entry-action {
          padding: 4px 6px;
          background: transparent;
          border: none;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 150ms ease;
        }

        .btn-entry-action:hover {
          background: #F1F5F9;
          transform: scale(1.1);
        }

        .dark .btn-entry-action:hover {
          background: #334155;
        }
      `}</style>

      <div className="journal-page">

        {/* Header */}
        <div className="journal-header">
          <div className="header-content">
            <div className="header-title">
              <h1>📔 Personal Journal</h1>
              <p>Record your thoughts, feelings, and daily reflections</p>
            </div>
            <div className="header-actions">
              <button className="btn-export" onClick={handleExportMD}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export MD
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="success-toast">
            ✓ Journal entry saved successfully
          </div>
        )}

        {/* Main Content */}
        <div className="journal-container">

          {/* Left Column - Form */}
          <div className="journal-main">

            <div className="journal-form-card">
              <h2 className="form-title">New Entry</h2>

              {/* FEATURE 5: Quick Prompts */}
              <div className="quick-prompts">
                <span className="prompts-label">Quick start:</span>
                <button className="prompt-btn" onClick={() => handleQuickPrompt('gratitude')}>
                  🙏 Gratitude
                </button>
                <button className="prompt-btn" onClick={() => handleQuickPrompt('reflection')}>
                  💭 Daily Reflection
                </button>
                <button className="prompt-btn" onClick={() => handleQuickPrompt('goals')}>
                  🎯 Goals
                </button>
              </div>

              {/* Date & Title Row */}
              <div className="form-row-split">
                <div className="form-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={journalEntry.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div className="form-field flex-grow">
                  <label>Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="Give your entry a title..."
                    value={journalEntry.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
              </div>

              {/* Mood & Energy Sliders */}
              <div className="sliders-row">
                <div className="slider-field">
                  <div className="slider-header">
                    <label>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                      Mood
                    </label>
                    <span className="slider-value">{journalEntry.mood}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={journalEntry.mood}
                    onChange={(e) => handleInputChange('mood', parseInt(e.target.value))}
                    className="mood-slider"
                  />
                </div>

                <div className="slider-field">
                  <div className="slider-header">
                    <label>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      Energy
                    </label>
                    <span className="slider-value">{journalEntry.energy}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={journalEntry.energy}
                    onChange={(e) => handleInputChange('energy', parseInt(e.target.value))}
                    className="energy-slider"
                  />
                </div>
              </div>

  
              {/* Reflection */}
              <div className="form-field">
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
                  ref={(el) => {
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = el.scrollHeight + 'px';
                    }
                  }}
                  className="auto-expand-textarea"
                  rows="1"
                  placeholder="How was your day? What's on your mind?"
                  value={journalEntry.reflections}
                  onChange={(e) => {
                    handleInputChange('reflections', e.target.value);
                    handleTextareaAutoExpand(e);
                  }}
                  onInput={handleTextareaAutoExpand}
                />
              </div>

              {/* Gratitude */}
              <div className="form-field">
                <label>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  Gratitude
                </label>
                <textarea
                  ref={(el) => {
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = el.scrollHeight + 'px';
                    }
                  }}
                  className="auto-expand-textarea"
                  rows="1"
                  placeholder="What are you grateful for today?"
                  value={journalEntry.gratitude}
                  onChange={(e) => {
                    handleInputChange('gratitude', e.target.value);
                    handleTextareaAutoExpand(e);
                  }}
                  onInput={handleTextareaAutoExpand}
                />
              </div>

              {/* FEATURE 3: Tags */}
              <div className="form-field">
                <label>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Add tags (press Enter)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleAddTag}
                />
                {journalEntry.tags.length > 0 && (
                  <div className="tags-list">
                    {journalEntry.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                        <button className="tag-remove" onClick={() => handleRemoveTag(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                className="btn-save-entry"
                onClick={handleSaveEntry}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Save Entry
                  </>
                )}
              </button>

            </div>

          </div>

          {/* Right Column - Sidebar */}
          <div className="journal-sidebar">

            {/* Search */}
            <div className="search-card">
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Stats */}
            <div className="stats-card">
              <h3>Journal Stats</h3>

              {/* FEATURE 1: Writing Streak */}
              <div className="streak-banner">
                <div className="streak-flame">🔥</div>
                <div className="streak-info">
                  <span className="streak-number">{streak}</span>
                  <span className="streak-label">Day Streak</span>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Entries</span>
                  <span className="stat-value">{stats.totalEntries}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">This Month</span>
                  <span className="stat-value">{stats.thisMonth}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Mood</span>
                  {/* FEATURE 2: Mood Trend */}
                  <div className="stat-with-trend">
                    <span className="stat-value">{stats.avgMood}</span>
                    {entries.length >= 2 && (
                      <span className={`trend-indicator ${moodTrend.direction}`}>
                        {moodTrend.direction === 'up' ? '↑' : '↓'} {moodTrend.percent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Month Folders */}
            <div className="recent-card">
              <h3>📔 Month Folders</h3>

              {entries.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <p>No entries yet</p>
                  <span>Start writing to see your entries organized in month folders</span>
                </div>
              ) : (
                <div className="month-folders">
                  {Object.entries(organizeEntriesByMonth())
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([monthYear, monthData]) => (
                      <div key={monthYear} className="month-folder">
                        <div
                          className="month-header"
                          onClick={() => toggleMonth(monthYear)}
                        >
                          <div className="month-info">
                            <span className="month-emoji">{getMonthEmoji(monthData.avgMood)}</span>
                            <div className="month-details">
                              <div className="month-name">{monthYear}</div>
                              <div className="month-stats">
                                {monthData.totalEntries} entries • Avg mood: {monthData.avgMood}
                              </div>
                            </div>
                          </div>
                          <div className={`month-toggle ${expandedMonths.includes(monthYear) ? 'expanded' : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                        </div>

                        {expandedMonths.includes(monthYear) && (
                          <div className="month-entries">
                            {monthData.entries
                              .filter(e =>
                                !searchQuery ||
                                e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                e.reflections?.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .map(entry => (
                                <div key={entry.id} className="entry-item">
                                  <div className="entry-header">
                                    <span className="entry-title">{entry.title || 'Untitled'}</span>
                                    <span className="entry-date">{new Date(entry.date).toLocaleDateString()}</span>
                                  </div>
                                  {entry.reflections && (
                                    <p className="entry-preview">
                                      {entry.reflections.substring(0, 80)}{entry.reflections.length > 80 ? '...' : ''}
                                    </p>
                                  )}
                                  <div className="entry-footer">
                                    <div className="entry-meta">
                                      <span className="entry-mood">😊 {entry.mood}</span>
                                      <span className="entry-energy">⚡ {entry.energy}</span>
                                    </div>
                                    <div className="entry-actions">
                                      <button className="btn-entry-action" title="View">👁️</button>
                                      <button className="btn-entry-action" title="Edit">✏️</button>
                                      <button className="btn-entry-action" title="Delete" onClick={() => {
                                        if (window.confirm('Delete this entry?')) {
                                          const updatedEntries = entries.filter(e => e.id !== entry.id);
                                          setEntries(updatedEntries);
                                          localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
                                        }
                                      }}>🗑️</button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </>
  );
};

export default JournalSimple;