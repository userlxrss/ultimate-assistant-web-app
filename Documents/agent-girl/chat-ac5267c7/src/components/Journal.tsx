import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  List,
  Search,
  Mic,
  MicOff,
  Save,
  Edit3,
  Trash2,
  Tag,
  TrendingUp,
  BarChart3,
  Cloud,
  Hash,
  Clock,
  Star,
  Filter,
  ChevronDown,
  X,
  Plus,
  BookOpen,
  Heart,
  Sun,
  Moon
} from 'lucide-react';
import { JournalEntry } from '../types';
import { ExtendedJournalEntry } from '../types/journal';
import MoodChart from './journal/MoodChart';
import WordCloud from './journal/WordCloud';
import StreakTracker from './journal/StreakTracker';
import EntryTemplates from './journal/EntryTemplates';
import CalendarView from './journal/CalendarView';
import ListView from './journal/ListView';


const Journal: React.FC = () => {
  const [entries, setEntries] = useState<ExtendedJournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Partial<ExtendedJournalEntry>>({
    date: new Date(),
    mood: 7,
    reflections: '',
    biggestWin: '',
    learning: '',
    tags: [],
    template: ''
  });
  const [view, setView] = useState<'form' | 'calendar' | 'list'>('list'); // Fixed to show month folders by default
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [moodFilter, setMoodFilter] = useState<[number, number]>([1, 10]);
  const [showFilters, setShowFilters] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Month folder state for modal-based folder system
  const [viewMode, setViewMode] = useState<'folders' | 'recent'>('folders');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // Selection state
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Generate 45 realistic entries over 60 days
  useEffect(() => {
    const generatedEntries = generateJournalEntries();
    setEntries(generatedEntries);
  }, []);

  // Modal folder functions
  const openFolder = (monthYear: string) => {
    setActiveFolder(monthYear);
  };

  const closeFolder = () => {
    setActiveFolder(null);
  };

  const exportMonthAsMarkdown = (monthYear: string) => {
    const monthData = organizeEntriesByMonth()[monthYear];
    if (monthData) {
      exportMonthToMD(monthYear, monthData.entries);
    }
  };

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (currentEntry.reflections || currentEntry.biggestWin || currentEntry.learning) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 30000);
      setAutoSaveTimer(timer);
    }
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [currentEntry]);

  const generateJournalEntries = (): ExtendedJournalEntry[] => {
    const entries: ExtendedJournalEntry[] = [];
    const today = new Date();
    const templates = ['Morning Pages', 'Evening Reflection', 'Gratitude', 'Goal Review'];
    const reflections = [
      "Had a productive morning meeting with the team. The new project proposal was well-received and I feel optimistic about our direction.",
      "Struggled with focus today, but managed to complete the quarterly report. Need to work on time management.",
      "Great conversation with a mentor today. Learned so much about leadership and career growth.",
      "Feeling grateful for the support of my colleagues. We really pulled together to meet the deadline.",
      "Tried a new approach to problem-solving and it paid off. Innovation requires patience.",
      "Reflection moment: realized I need to set better boundaries with work hours.",
      "Celebrated a small win today - fixed that bug that's been bothering me for days!",
      "Learning experience: asked for help earlier instead of struggling alone. Teamwork makes the dream work.",
      "Meditation session was really helpful. Starting the day with mindfulness makes such a difference.",
      "Challenging day but growth comes from discomfort. Tomorrow is a new opportunity."
    ];

    const wins = [
      "Completed the project proposal ahead of schedule",
      "Successfully resolved the client's concerns",
      "Led a productive team meeting",
      "Finished the online course module",
      "Helped a colleague solve a complex problem",
      "Implemented a new workflow that saved time",
      "Received positive feedback from my manager",
      "Overcame a fear and gave a presentation",
      "Made progress on a personal goal",
      "Maintained work-life balance despite pressure"
    ];

    const learnings = [
      "The importance of clear communication in remote work",
      "How to delegate tasks more effectively",
      "New technique for managing stress under pressure",
      "Better ways to organize my digital workspace",
      "The value of taking regular breaks",
      "How to give and receive constructive feedback",
      "Methods for improving concentration",
      "Understanding different communication styles",
      "The power of saying no to protect my time",
      "Techniques for better decision making"
    ];

    const tags = [
      'work', 'personal', 'growth', 'productivity', 'mindfulness', 'health',
      'learning', 'relationships', 'creativity', 'leadership', 'balance',
      'challenges', 'success', 'reflection', 'goals'
    ];

    for (let i = 0; i < 45; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);

      // Normal distribution of mood (more 5-8, fewer extremes)
      let mood = Math.floor(Math.random() * 10) + 1;
      const random = Math.random();
      if (random < 0.15) mood = Math.floor(Math.random() * 3) + 1; // 15% chance of low mood (1-3)
      else if (random < 0.25) mood = Math.floor(Math.random() * 2) + 9; // 10% chance of high mood (9-10)
      else mood = Math.floor(Math.random() * 4) + 4; // 75% chance of medium mood (4-8)

      const entryTags: string[] = [];
      const numTags = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < numTags; j++) {
        const tag = tags[Math.floor(Math.random() * tags.length)];
        if (!entryTags.includes(tag)) entryTags.push(tag);
      }

      entries.push({
        id: `journal-${i + 1}`,
        date,
        content: reflections[Math.floor(Math.random() * reflections.length)],
        mood,
        energy: Math.floor(Math.random() * 10) + 1,
        themes: [tags[Math.floor(Math.random() * tags.length)]],
        insights: ['Important insight about personal growth'],
        biggestWin: wins[Math.floor(Math.random() * wins.length)],
        learning: learnings[Math.floor(Math.random() * learnings.length)],
        tags: entryTags,
        template: templates[Math.floor(Math.random() * templates.length)],
        isDraft: false
      });
    }

    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const saveDraft = () => {
    if (currentEntry.id) {
      setEntries(prev => prev.map(entry =>
        entry.id === currentEntry.id
          ? { ...entry, ...currentEntry, isDraft: true, lastSaved: new Date() }
          : entry
      ));
    }
  };

  const saveEntry = () => {
    if (editingEntry === 'view') {
      // Don't save when in view mode
      setEditingEntry(null);
      return;
    }

    const entry: ExtendedJournalEntry = {
      id: currentEntry.id || `journal-${Date.now()}`,
      date: currentEntry.date || new Date(),
      content: currentEntry.reflections || '',
      mood: currentEntry.mood || 7,
      energy: 7,
      themes: currentEntry.tags || [],
      insights: [currentEntry.learning || ''].filter(Boolean),
      biggestWin: currentEntry.biggestWin,
      learning: currentEntry.learning,
      tags: currentEntry.tags || [],
      template: currentEntry.template,
      isDraft: false,
      lastSaved: new Date()
    };

    if (editingEntry) {
      setEntries(prev => prev.map(e => e.id === editingEntry ? entry : e));
      setEditingEntry(null);
    } else {
      setEntries(prev => [entry, ...prev]);
    }

    // Reset form
    setCurrentEntry({
      date: new Date(),
      mood: 7,
      reflections: '',
      biggestWin: '',
      learning: '',
      tags: [],
      template: ''
    });
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const editEntry = (entry: ExtendedJournalEntry) => {
    setCurrentEntry(entry);
    setEditingEntry(entry.id);
    setView('form');
  };

  const viewEntry = (entry: ExtendedJournalEntry) => {
    setCurrentEntry(entry);
    setEditingEntry('view'); // Use a special value to indicate view mode
    setView('form');
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setIsListening(true);

    // Simulate voice recording
    setTimeout(() => {
      const simulatedTranscription = "Today was a productive day. I managed to complete several important tasks and had meaningful conversations with my team. Looking forward to building on this momentum tomorrow.";
      setCurrentEntry(prev => ({
        ...prev,
        reflections: prev.reflections ? prev.reflections + ' ' + simulatedTranscription : simulatedTranscription
      }));
      setIsListening(false);
      setIsRecording(false);
    }, 3000);
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    setIsListening(false);
  };

  const applyTemplate = (template: string) => {
    let reflections = '';
    let biggestWin = '';
    let learning = '';

    switch (template) {
      case 'Morning Pages':
        reflections = "Good morning! Today I'm feeling...\n\nMy intentions for today are...\n\nI'm grateful for...\n\nI want to remember...";
        break;
      case 'Evening Reflection':
        reflections = "Today I accomplished...\n\nWhat went well...\n\nWhat could have been better...\n\nTomorrow I will...";
        break;
      case 'Gratitude':
        reflections = "Today I'm grateful for...\n\nThree things that brought me joy:\n1. \n2. \n3. \n\nSomeone who made a difference today...";
        break;
      case 'Goal Review':
        reflections = "Progress on my goals:\n\nWhat worked well:\n\nChallenges faced:\n\nNext steps:";
        break;
    }

    setCurrentEntry(prev => ({
      ...prev,
      reflections,
      biggestWin,
      learning,
      template
    }));
    setShowTemplates(false);

    // Full expansion with animation
    setTimeout(() => {
      const textareas = document.querySelectorAll('.glass-card textarea') as NodeListOf<HTMLTextAreaElement>;
      textareas.forEach((textarea, index) => {
        // Force full height calculation
        textarea.style.height = 'auto';
        const fullHeight = textarea.scrollHeight + 12; // Extra buffer
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
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = searchQuery === '' ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.biggestWin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.learning?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => entry.tags?.includes(tag));

      const matchesMood = entry.mood >= moodFilter[0] && entry.mood <= moodFilter[1];

      return matchesSearch && matchesTags && matchesMood;
    });
  }, [entries, searchQuery, selectedTags, moodFilter]);

  const moodData = useMemo(() => {
    return entries.map(entry => ({
      date: entry.date,
      mood: entry.mood
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [entries]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Enhanced auto-expand with buffer for full template visibility
  const handleTextareaAutoExpand = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto'; // Reset
    const newHeight = Math.max(144, textarea.scrollHeight + 8); // Add 8px buffer (144px = 6 rows * 24px)
    textarea.style.height = newHeight + 'px';
  };

  // Organize entries by month for folder view
  const organizeEntriesByMonth = () => {
    const organized: Record<string, {
      entries: ExtendedJournalEntry[];
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
      monthData.entries.sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    return organized;
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
  const formatEntryDate = (date: Date) => {
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

  // ===== SELECTION FUNCTIONS =====

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const selectAllInMonth = (monthEntries: ExtendedJournalEntry[]) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      monthEntries.forEach(entry => newSet.add(entry.id));
      return newSet;
    });
  };

  const deselectAllInMonth = (monthEntries: ExtendedJournalEntry[]) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      monthEntries.forEach(entry => newSet.delete(entry.id));
      return newSet;
    });
  };

  const isMonthFullySelected = (monthEntries: ExtendedJournalEntry[]) => {
    if (monthEntries.length === 0) return false;
    return monthEntries.every(entry => selectedEntries.has(entry.id));
  };

  const clearSelection = () => {
    setSelectedEntries(new Set());
    setSelectMode(false);
  };

  // ===== EXPORT FUNCTIONS =====

  const exportToMD = (entriesToExport: ExtendedJournalEntry[], filename: string) => {
    if (entriesToExport.length === 0) {
      alert('No entries to export.');
      return;
    }

    let markdown = `# Journal Entries\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleString()}\n`;
    markdown += `**Total Entries:** ${entriesToExport.length}\n\n`;
    markdown += `---\n\n`;

    entriesToExport
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .forEach(entry => {
        markdown += `## ${entry.template || 'Untitled'}\n\n`;
        markdown += `**Date:** ${entry.date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}\n\n`;
        markdown += `**Mood:** ${entry.mood}/10\n\n`;

        if (entry.tags && entry.tags.length > 0) {
          markdown += `**Tags:** ${entry.tags.join(', ')}\n\n`;
        }

        if (entry.content) {
          markdown += `### 📝 Reflections\n\n${entry.content}\n\n`;
        }

        if (entry.biggestWin) {
          markdown += `### 🏆 Biggest Win\n\n${entry.biggestWin}\n\n`;
        }

        if (entry.learning) {
          markdown += `### 💡 Learning\n\n${entry.learning}\n\n`;
        }

        markdown += `---\n\n`;
      });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMonthToMD = (monthYear: string, monthEntries: ExtendedJournalEntry[]) => {
    const filename = `journal-${monthYear.replace(' ', '-').toLowerCase()}.md`;
    exportToMD(monthEntries, filename);
  };

  const exportSelectedToMD = () => {
    const selectedEntriesArray = entries.filter(e => selectedEntries.has(e.id));
    if (selectedEntriesArray.length === 0) {
      alert('Please select entries to export.');
      return;
    }
    const filename = `journal-selected-${Date.now()}.md`;
    exportToMD(selectedEntriesArray, filename);
    clearSelection();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen className="w-8 h-8 text-sage-600 dark:text-sage-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Journal 📔</h1>
                <p className="text-gray-600 dark:text-gray-300">Month Folders Enabled - Switch to List View to see them!</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle Buttons */}
              <div className="flex bg-white/10 dark:bg-black/20 rounded-xl p-1 backdrop-blur-sm border border-white/20">
                <button
                  onClick={() => setView('form')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    view === 'form'
                      ? 'bg-sage-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  Form
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    view === 'calendar'
                      ? 'bg-sage-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    view === 'list'
                      ? 'bg-sage-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
              </div>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200"
              >
                {darkMode ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass-card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-button hover:bg-white/30 transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {selectedTags.length > 0 && (
                <span className="bg-sage-500 text-white text-xs px-2 py-1 rounded-full">
                  {selectedTags.length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mood Range: {moodFilter[0]} - {moodFilter[1]}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">😔</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodFilter[0]}
                    onChange={(e) => setMoodFilter([parseInt(e.target.value), moodFilter[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodFilter[1]}
                    onChange={(e) => setMoodFilter([moodFilter[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                  <span className="text-sm">😊</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-sage-500 text-white'
                          : 'glass-button hover:bg-white/30'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {view === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Entry Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingEntry === 'view' ? 'View Entry' :
                     editingEntry ? 'Edit Entry' : 'New Entry'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg glass-button hover:bg-white/30 transition-all duration-200"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm">Templates</span>
                    </button>
                    <button
                      onClick={saveEntry}
                      disabled={editingEntry === 'view'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                        editingEntry === 'view'
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-sage-500 text-white hover:bg-sage-600'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingEntry === 'view' ? 'View Mode' : 'Save'}</span>
                    </button>
                  </div>
                </div>

                {showTemplates && (
                  <EntryTemplates
                    onSelectTemplate={applyTemplate}
                    onClose={() => setShowTemplates(false)}
                  />
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={currentEntry.date?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, date: new Date(e.target.value) }))}
                      disabled={editingEntry === 'view'}
                      className={`w-full px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                        editingEntry === 'view'
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'glass-button'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mood (1-10)
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">😔</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={currentEntry.mood || 7}
                        onChange={(e) => setCurrentEntry(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                        disabled={editingEntry === 'view'}
                        className={`flex-1 ${editingEntry === 'view' ? 'cursor-not-allowed opacity-50' : ''}`}
                      />
                      <span className="text-2xl">😊</span>
                      <span className="text-lg font-semibold text-sage-600 dark:text-sage-400 min-w-[3ch]">
                        {currentEntry.mood || 7}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reflections
                    </label>
                    <div className="relative">
                      <textarea
                        value={currentEntry.reflections || ''}
                        onChange={(e) => {
                          setCurrentEntry(prev => ({ ...prev, reflections: e.target.value }));
                          handleTextareaAutoExpand(e);
                        }}
                        onInput={handleTextareaAutoExpand}
                        placeholder="How was your day? What's on your mind?"
                        rows={6}
                        disabled={editingEntry === 'view'}
                        className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none ${
                          editingEntry === 'view'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'glass-button'
                        }`}
                        style={{ minHeight: '144px', maxHeight: '800px' }}
                      />
                      <button
                        onMouseDown={startVoiceRecording}
                        onMouseUp={stopVoiceRecording}
                        onTouchStart={startVoiceRecording}
                        onTouchEnd={stopVoiceRecording}
                        className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all duration-200 ${
                          isRecording
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'glass-button hover:bg-white/30'
                        }`}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(currentEntry.reflections || '').length} characters
                        {(currentEntry.reflections || '').length > 0 && ` · ${Math.ceil((currentEntry.reflections || '').split(' ').filter(w => w).length / 200)} min read`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Biggest Win
                      </label>
                      <input
                        type="text"
                        value={currentEntry.biggestWin || ''}
                        onChange={(e) => setCurrentEntry(prev => ({ ...prev, biggestWin: e.target.value }))}
                        placeholder="What went really well today?"
                        disabled={editingEntry === 'view'}
                        className={`w-full px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                          editingEntry === 'view'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'glass-button'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Learning
                      </label>
                      <input
                        type="text"
                        value={currentEntry.learning || ''}
                        onChange={(e) => setCurrentEntry(prev => ({ ...prev, learning: e.target.value }))}
                        placeholder="What did you learn?"
                        disabled={editingEntry === 'view'}
                        className={`w-full px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                          editingEntry === 'view'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'glass-button'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.slice(0, 8).map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            const currentTags = currentEntry.tags || [];
                            setCurrentEntry(prev => ({
                              ...prev,
                              tags: currentTags.includes(tag)
                                ? currentTags.filter(t => t !== tag)
                                : [...currentTags, tag]
                            }));
                          }}
                          className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                            currentEntry.tags?.includes(tag)
                              ? 'bg-sage-500 text-white'
                              : 'glass-button hover:bg-white/30'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Sidebar */}
            <div className="space-y-6">
              <MoodChart data={moodData} />
              <StreakTracker entries={entries} />
              <WordCloud entries={entries} />
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <CalendarView
            entries={filteredEntries}
            onEditEntry={editEntry}
            onDeleteEntry={deleteEntry}
          />
        )}

        {view === 'list' && (
          <ListView
            entries={filteredEntries}
            onEditEntry={editEntry}
            onViewEntry={viewEntry}
            onDeleteEntry={deleteEntry}
            activeFolder={activeFolder}
            viewMode={viewMode}
            openFolder={openFolder}
            closeFolder={closeFolder}
            exportMonthAsMarkdown={exportMonthAsMarkdown}
            organizeEntriesByMonth={organizeEntriesByMonth}
            getMonthEmoji={getMonthEmoji}
            formatEntryDate={formatEntryDate}
            setViewMode={setViewMode}
            searchQuery={searchQuery}
            selectedEntries={selectedEntries}
            selectMode={selectMode}
            toggleEntrySelection={toggleEntrySelection}
            selectAllInMonth={selectAllInMonth}
            deselectAllInMonth={deselectAllInMonth}
            isMonthFullySelected={isMonthFullySelected}
            exportMonthToMD={exportMonthToMD}
            clearSelection={clearSelection}
            exportSelectedToMD={exportSelectedToMD}
            setSelectMode={setSelectMode}
          />
        )}
      </div>
    </div>
  );
};

export default Journal;