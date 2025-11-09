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

const JournalEnhanced: React.FC = () => {
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
  const [view, setView] = useState<'form' | 'calendar' | 'list'>('list');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [moodFilter, setMoodFilter] = useState<[number, number]>([1, 10]);
  const [showFilters, setShowFilters] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // View mode for folders
  const [viewMode, setViewMode] = useState<'folders' | 'recent'>('folders');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // Selection state
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Initialize with dummy data for demonstration
  useEffect(() => {
    const dummyEntries: ExtendedJournalEntry[] = [
      {
        id: 'journal-1',
        date: new Date(),
        title: 'Productive Day',
        mood: 8,
        energy: 7,
        reflections: 'Today was really productive. I managed to complete several important tasks and had meaningful conversations with my team.',
        biggestWin: 'Completed the project proposal ahead of schedule',
        learning: 'Breaking tasks into smaller chunks helps with focus',
        tags: ['productivity', 'work', 'success'],
        template: 'Evening Reflection',
        isDraft: false,
        lastSaved: new Date()
      },
      {
        id: 'journal-2',
        date: new Date(Date.now() - 86400000),
        title: 'Learning Experience',
        mood: 6,
        energy: 5,
        reflections: 'Had some challenges today but learned a lot about patience and communication.',
        biggestWin: 'Resolved a difficult client issue',
        learning: 'Taking breaks actually improves problem-solving',
        tags: ['learning', 'challenges', 'growth'],
        template: 'Evening Reflection',
        isDraft: false,
        lastSaved: new Date(Date.now() - 86400000)
      }
    ];
    setEntries(dummyEntries);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const saveEntry = () => {
    if (editingEntry === 'view') {
      setEditingEntry(null);
      return;
    }

    const entry: ExtendedJournalEntry = {
      id: currentEntry.id || `journal-${Date.now()}`,
      date: currentEntry.date || new Date(),
      title: currentEntry.template || 'Journal Entry',
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
      const updatedEntries = entries.map(e => e.id === editingEntry ? entry : e);
      setEntries(updatedEntries);
      setEditingEntry(null);
    } else {
      const updatedEntries = [entry, ...entries];
      setEntries(updatedEntries);
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

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = searchQuery === '' ||
        entry.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.biggestWin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.learning?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => entry.tags?.includes(tag));

      const matchesMood = entry.mood >= moodFilter[0] && entry.mood <= moodFilter[1];

      return matchesSearch && matchesTags && matchesMood;
    });
  }, [entries, searchQuery, selectedTags, moodFilter]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  const handleTextareaAutoExpand = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.max(144, textarea.scrollHeight + 8);
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

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold premium-text-primary">Journal 📔</h1>
                <p className="premium-text-secondary">Month Folders Enabled - Switch to List View to see them!</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle Buttons */}
              <div className="flex bg-white/10 dark:bg-black/20 rounded-xl p-1 backdrop-blur-sm border border-white/20">
                <button
                  onClick={() => setView('form')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    view === 'form'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'premium-text-secondary hover:bg-white/10'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  Form
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    view === 'calendar'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'premium-text-secondary hover:bg-white/10'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    view === 'list'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'premium-text-secondary hover:bg-white/10'
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
              </div>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300"
              >
                {darkMode ? <Sun className="w-5 h-5 premium-text-tertiary" /> : <Moon className="w-5 h-5 premium-text-tertiary" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="premium-card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 premium-text-tertiary" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl premium-button focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="premium-button flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/30 transition-all duration-300"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {selectedTags.length > 0 && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {selectedTags.length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium premium-text-secondary mb-2">
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
                    className="flex-1 mood-slider"
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodFilter[1]}
                    onChange={(e) => setMoodFilter([moodFilter[0], parseInt(e.target.value)])}
                    className="flex-1 mood-slider"
                  />
                  <span className="text-sm">😊</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium premium-text-secondary mb-2">
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
                      className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                        selectedTags.includes(tag)
                          ? 'bg-green-500 text-white'
                          : 'premium-button hover:bg-white/30'
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
              <div className="premium-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold premium-text-primary">
                    {editingEntry === 'view' ? 'View Entry' :
                     editingEntry ? 'Edit Entry' : 'New Entry'}
                  </h2>
                  <button
                    onClick={saveEntry}
                    disabled={editingEntry === 'view'}
                    className={`premium-button flex items-center gap-2 px-4 py-2 transition-all duration-300 ${
                      editingEntry === 'view'
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingEntry === 'view' ? 'View Mode' : 'Save'}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium premium-text-secondary mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={currentEntry.date?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, date: new Date(e.target.value) }))}
                      disabled={editingEntry === 'view'}
                      className={`w-full px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editingEntry === 'view'
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'premium-button'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium premium-text-secondary mb-2">
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
                        className={`flex-1 mood-slider ${editingEntry === 'view' ? 'cursor-not-allowed opacity-50' : ''}`}
                      />
                      <span className="text-2xl">😊</span>
                      <span className="text-lg font-semibold text-green-400 min-w-[3ch]">
                        {currentEntry.mood || 7}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium premium-text-secondary mb-2">
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
                        className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                          editingEntry === 'view'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'premium-button'
                        }`}
                        style={{ minHeight: '144px', maxHeight: '800px' }}
                      />
                      <button
                        onMouseDown={() => setIsRecording(true)}
                        onMouseUp={() => setIsRecording(false)}
                        className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all duration-300 ${
                          isRecording
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'premium-button hover:bg-white/30'
                        }`}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-xs premium-text-muted">
                        {(currentEntry.reflections || '').length} characters
                        {(currentEntry.reflections || '').length > 0 && ` · ${Math.ceil((currentEntry.reflections || '').split(' ').filter(w => w).length / 200)} min read`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium premium-text-secondary mb-2">
                        Biggest Win
                      </label>
                      <input
                        type="text"
                        value={currentEntry.biggestWin || ''}
                        onChange={(e) => setCurrentEntry(prev => ({ ...prev, biggestWin: e.target.value }))}
                        placeholder="What went really well today?"
                        disabled={editingEntry === 'view'}
                        className={`w-full px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editingEntry === 'view'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'premium-button'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium premium-text-secondary mb-2">
                        Learning
                      </label>
                      <input
                        type="text"
                        value={currentEntry.learning || ''}
                        onChange={(e) => setCurrentEntry(prev => ({ ...prev, learning: e.target.value }))}
                        placeholder="What did you learn?"
                        disabled={editingEntry === 'view'}
                        className={`w-full px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          editingEntry === 'view'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'premium-button'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium premium-text-secondary mb-2">
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
                          className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                            currentEntry.tags?.includes(tag)
                              ? 'bg-green-500 text-white'
                              : 'premium-button hover:bg-white/30'
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
              <div className="stats-card p-4">
                <h3 className="text-lg font-semibold premium-text-primary mb-2">Mood Trend</h3>
                <div className="text-2xl font-bold text-green-400">7.2</div>
                <div className="text-sm premium-text-muted">Average this month</div>
              </div>

              <div className="stats-card p-4">
                <h3 className="text-lg font-semibold premium-text-primary mb-2">Streak</h3>
                <div className="text-2xl font-bold text-orange-400">5</div>
                <div className="text-sm premium-text-muted">Days in a row</div>
              </div>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="space-y-6">
            <div className="premium-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold premium-text-primary">Journal Entries</h3>
                <div className="text-sm premium-text-muted">
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>

              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="premium-card p-4 cursor-pointer hover:scale-[1.02] transition-all duration-300"
                    onClick={() => {
                      setCurrentEntry(entry);
                      setEditingEntry(entry.id);
                      setView('form');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold premium-text-primary">{entry.title}</h4>
                          <span className="text-xs premium-text-muted">
                            {entry.date.toLocaleDateString()}
                          </span>
                        </div>
                        {entry.content && (
                          <p className="text-sm premium-text-secondary mb-2 line-clamp-2">
                            {entry.content}
                          </p>
                        )}
                        {entry.biggestWin && (
                          <p className="text-sm premium-text-secondary mb-1">
                            <span className="font-medium">Win:</span> {entry.biggestWin}
                          </p>
                        )}
                        {entry.learning && (
                          <p className="text-sm premium-text-secondary">
                            <span className="font-medium">Learning:</span> {entry.learning}
                          </p>
                        )}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.map(tag => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-1 rounded-full premium-button"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-center">
                        <div className="text-2xl mb-1">
                          {entry.mood >= 8 ? '😊' : entry.mood >= 6 ? '🙂' : entry.mood >= 4 ? '😐' : '😔'}
                        </div>
                        <div className="text-xs premium-text-muted">Mood: {entry.mood}/10</div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredEntries.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 premium-text-tertiary mx-auto mb-3" />
                    <p className="premium-text-secondary">No journal entries found</p>
                    <p className="text-sm premium-text-muted mt-1">
                      Try adjusting your filters or create your first entry
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <div className="premium-card">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 premium-text-tertiary mx-auto mb-4" />
              <h3 className="text-xl font-semibold premium-text-primary mb-2">Calendar View</h3>
              <p className="premium-text-secondary">Calendar functionality coming soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalEnhanced;