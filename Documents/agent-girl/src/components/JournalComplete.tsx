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
  Moon,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Folder,
  BarChart
} from 'lucide-react';
import { ExtendedJournalEntry } from '../types/journal';
import { SecureJournalStorageWrapper } from '../utils/secureJournalStorageWrapper';
import { useNotifications } from './NotificationSystem';
import ConfirmDialog from './ConfirmDialog';
import JournalMonthFolders from './JournalMonthFolders';
import JournalStatsPanel from './JournalStatsPanel';

type ViewMode = 'form' | 'list' | 'folders' | 'stats' | 'calendar';

const JournalComplete: React.FC = () => {
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
  const [view, setView] = useState<ViewMode>('list');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [moodFilter, setMoodFilter] = useState<[number, number]>([1, 10]);
  const [showFilters, setShowFilters] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<ExtendedJournalEntry | null>(null);

  const { showSuccess, showError, showWarning, showInfo } = useNotifications();

  // Initialize storage and load entries
  useEffect(() => {
    const initializeJournal = async () => {
      try {
        setLoading(true);
        setError('');

        // Initialize secure storage
        SecureJournalStorageWrapper.initializeStorage();

        // Load existing entries
        const loadedEntries = SecureJournalStorageWrapper.getAllEntries();
        setEntries(loadedEntries);

        showInfo('Journal Loaded', `Loaded ${loadedEntries.length} entries`);
      } catch (error) {
        console.error('Failed to initialize journal:', error);
        setError('Failed to load journal entries');
        showError('Initialization Failed', 'Could not load your journal entries');
      } finally {
        setLoading(false);
      }
    };

    initializeJournal();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
      showInfo('Connection Restored', 'You are back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      showWarning('Offline Mode', 'Changes will be saved locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const saveEntry = async () => {
    if (editingEntry === 'view') {
      setEditingEntry(null);
      return;
    }

    if (!currentEntry.reflections?.trim()) {
      showWarning('Validation Error', 'Please add some reflections before saving');
      return;
    }

    setIsLoading(true);
    setSyncStatus('syncing');
    setError('');

    try {
      const entry: ExtendedJournalEntry = {
        id: currentEntry.id || `journal-${Date.now()}`,
        date: currentEntry.date || new Date(),
        title: currentEntry.title || currentEntry.template || 'Journal Entry',
        content: currentEntry.reflections || '',
        mood: currentEntry.mood || 7,
        energy: currentEntry.energy || 7,
        reflections: currentEntry.reflections || '',
        gratitude: currentEntry.gratitude || '',
        biggestWin: currentEntry.biggestWin,
        learning: currentEntry.learning,
        tags: currentEntry.tags || [],
        template: currentEntry.template,
        isDraft: false,
        lastSaved: new Date(),
        weather: currentEntry.weather,
        location: currentEntry.location,
        challenge: currentEntry.challenge,
        tomorrowFocus: currentEntry.tomorrowFocus,
        affirmations: currentEntry.affirmations
      };

      // Save to persistent storage
      await SecureJournalStorageWrapper.saveEntry(entry);

      if (editingEntry) {
        const updatedEntries = entries.map(e => e.id === editingEntry ? entry : e);
        setEntries(updatedEntries);
        setEditingEntry(null);
        showSuccess('Entry Updated', 'Your journal entry has been updated successfully');
      } else {
        const updatedEntries = [entry, ...entries];
        setEntries(updatedEntries);
        showSuccess('Entry Saved', 'Your journal entry has been saved successfully');
      }

      setSyncStatus('synced');

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
    } catch (error) {
      console.error('Error saving entry:', error);
      setError('Failed to save entry');
      setSyncStatus('offline');
      showError('Save Failed', `Could not save entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entry: ExtendedJournalEntry) => {
    if (!entry) return;

    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    setIsLoading(true);
    setSyncStatus('syncing');

    try {
      await SecureJournalStorageWrapper.deleteEntry(entryToDelete.date);

      const updatedEntries = entries.filter(e => e.id !== entryToDelete.id);
      setEntries(updatedEntries);

      showSuccess('Entry Deleted', 'Your journal entry has been deleted successfully');
      setSyncStatus('synced');
    } catch (error) {
      console.error('Error deleting entry:', error);
      setError('Failed to delete entry');
      showError('Delete Failed', `Could not delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setEntryToDelete(null);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = searchQuery === '' ||
        entry.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.reflections?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleEntryClick = (entry: ExtendedJournalEntry) => {
    setCurrentEntry(entry);
    setEditingEntry(entry.id);
    setView('form');
  };

  const handleNewEntry = () => {
    setCurrentEntry({
      date: new Date(),
      mood: 7,
      reflections: '',
      biggestWin: '',
      learning: '',
      tags: [],
      template: ''
    });
    setEditingEntry(null);
    setView('form');
  };

  const handleTextareaAutoExpand = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.max(144, textarea.scrollHeight + 8);
    textarea.style.height = newHeight + 'px';
  };

  const renderSyncIndicator = () => {
    const getSyncIcon = () => {
      switch (syncStatus) {
        case 'synced':
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'syncing':
          return <Cloud className="w-4 h-4 text-blue-500 animate-pulse" />;
        case 'offline':
          return <WifiOff className="w-4 h-4 text-orange-500" />;
      }
    };

    const getSyncText = () => {
      switch (syncStatus) {
        case 'synced':
          return isOnline ? 'Synced ✅' : 'Offline Synced';
        case 'syncing':
          return 'Syncing...';
        case 'offline':
          return 'Offline';
      }
    };

    return (
      <div className="flex items-center gap-2 text-sm">
        {getSyncIcon()}
        <span className="text-gray-600 dark:text-gray-400">{getSyncText()}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Journal 📔</h1>
                <p className="text-gray-600 dark:text-gray-400">Your personal thoughts and reflections</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sync Status Indicator */}
              {renderSyncIndicator()}

              {/* View Toggle Buttons */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setView('form')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    view === 'form'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  Form
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    view === 'list'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
                <button
                  onClick={() => setView('folders')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    view === 'folders'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  Folders
                </button>
                <button
                  onClick={() => setView('stats')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    view === 'stats'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <BarChart className="w-4 h-4" />
                  Stats
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    view === 'calendar'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </button>
              </div>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
              >
                {darkMode ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Search and Filters - Show for list and folders view */}
        {(view === 'list' || view === 'folders') && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {selectedTags.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {selectedTags.length}
                  </span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 space-y-3 pt-4 border-t border-gray-200 dark:border-gray-600">
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
                        className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
        )}

        {/* Main Content */}
        {view === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Entry Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingEntry === 'view' ? 'View Entry' :
                     editingEntry ? 'Edit Entry' : 'New Entry'}
                  </h2>
                  <button
                    onClick={saveEntry}
                    disabled={isLoading || editingEntry === 'view'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isLoading || editingEntry === 'view'
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingEntry === 'view' ? 'View Mode' : isLoading ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={currentEntry.date?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, date: new Date(e.target.value) }))}
                      disabled={editingEntry === 'view'}
                      className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        editingEntry === 'view'
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'dark:bg-gray-700 dark:text-white'
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
                      <span className="text-lg font-semibold text-green-500 min-w-[3ch]">
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
                        className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                          editingEntry === 'view'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'dark:bg-gray-700 dark:text-white'
                        }`}
                        style={{ minHeight: '144px', maxHeight: '400px' }}
                      />
                      <button
                        onMouseDown={() => setIsRecording(true)}
                        onMouseUp={() => setIsRecording(false)}
                        className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all duration-300 ${
                          isRecording
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
                        }`}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
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
                        className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          editingEntry === 'view'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'dark:bg-gray-700 dark:text-white'
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
                        className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          editingEntry === 'view'
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'dark:bg-gray-700 dark:text-white'
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
                          className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                            currentEntry.tags?.includes(tag)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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

            {/* Quick Stats Sidebar */}
            <div className="space-y-6">
              <JournalStatsPanel entries={entries} />
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Journal Entries</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => handleEntryClick(entry)}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{entry.title}</h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                        {entry.lastSaved && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Saved {new Date(entry.lastSaved).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      {entry.content && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {entry.content}
                        </p>
                      )}
                      {entry.reflections && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {entry.reflections}
                        </p>
                      )}
                      {entry.biggestWin && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span className="font-medium">Win:</span> {entry.biggestWin}
                        </p>
                      )}
                      {entry.learning && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Learning:</span> {entry.learning}
                        </p>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
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
                      <div className="text-xs text-gray-500 dark:text-gray-400">Mood: {entry.mood}/10</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEntry(entry);
                        }}
                        className="mt-2 p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredEntries.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No journal entries found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Try adjusting your filters or create your first entry
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'folders' && (
          <JournalMonthFolders
            entries={filteredEntries}
            onEntryClick={handleEntryClick}
            onNewEntry={handleNewEntry}
          />
        )}

        {view === 'stats' && (
          <JournalStatsPanel entries={filteredEntries} />
        )}

        {view === 'calendar' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Calendar View</h3>
              <p className="text-gray-500 dark:text-gray-500">Calendar functionality coming soon!</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Delete Journal Entry"
        message={`Are you sure you want to delete "${entryToDelete?.title || 'this journal entry'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setEntryToDelete(null);
        }}
        type="danger"
      />
    </div>
  );
};

export default JournalComplete;