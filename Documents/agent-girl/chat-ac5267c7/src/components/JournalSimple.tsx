import React, { useState, useEffect } from 'react';
import { Save, Search, Calendar, Heart, Star, Brain, Target, Trash2, Edit, Download, Plus } from 'lucide-react';
import { JournalStorage } from '../utils/journalStorage';
import { ExtendedJournalEntry } from '../types/journal';
import JournalEditModal from './JournalEditModal';
import ConfirmDialog from './ConfirmDialog';
import { useNotifications } from './NotificationSystem';

const JournalSimple: React.FC = () => {
  const [entries, setEntries] = useState<ExtendedJournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Partial<ExtendedJournalEntry>>({
    date: new Date(),
    mood: 7,
    energy: 7,
    reflections: '',
    gratitude: '',
    biggestWin: '',
    challenge: '',
    learning: '',
    tomorrowFocus: '',
    tags: [],
    affirmations: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExtendedJournalEntry | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<Date | null>(null);
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();

  // Load entries from storage on component mount
  useEffect(() => {
    JournalStorage.initializeStorage();
    loadEntries();
  }, []);

  // Safe date formatting helper
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const loadEntries = () => {
    try {
      const storedEntries = JournalStorage.getAllEntries();
      const sortedEntries = storedEntries
        .filter(entry => entry && entry.date) // Filter out invalid entries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(sortedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      setEntries([]);
    }
  };

  const saveEntry = async () => {
    try {
      if (!currentEntry.reflections?.trim()) {
        showWarning('Reflections Required', 'Please add some reflections before saving.');
        return;
      }

      const entry: ExtendedJournalEntry = {
        id: currentEntry.date?.toISOString() || new Date().toISOString(),
        date: currentEntry.date || new Date(),
        mood: currentEntry.mood || 7,
        energy: currentEntry.energy || 7,
        reflections: currentEntry.reflections || '',
        gratitude: currentEntry.gratitude || '',
        biggestWin: currentEntry.biggestWin || '',
        challenge: currentEntry.challenge || '',
        learning: currentEntry.learning || '',
        tomorrowFocus: currentEntry.tomorrowFocus || '',
        tags: currentEntry.tags || [],
        affirmations: currentEntry.affirmations || [],
        weather: currentEntry.weather || '',
        location: currentEntry.location || '',
        title: currentEntry.title || `Journal Entry - ${formatDate(currentEntry.date || new Date())}`,
        content: currentEntry.reflections || '',
        themes: [],
        insights: [],
        template: '',
        isDraft: false,
        lastSaved: new Date()
      };

      await JournalStorage.saveEntry(entry);
      loadEntries();
      resetForm();
      showSuccess('Journal Entry Saved', 'Your entry has been saved successfully.');
    } catch (error) {
      console.error('Error saving entry:', error);
      showError('Save Failed', `Error saving journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setCurrentEntry({
      date: new Date(),
      mood: 7,
      energy: 7,
      reflections: '',
      gratitude: '',
      biggestWin: '',
      challenge: '',
      learning: '',
      tomorrowFocus: '',
      tags: [],
      affirmations: []
    });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleModalSave = (updatedEntry: ExtendedJournalEntry) => {
    loadEntries();
    handleModalClose();
  };

  const editEntry = (entry: ExtendedJournalEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const deleteEntry = (date: Date) => {
    setEntryToDelete(date);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      await JournalStorage.deleteEntry(entryToDelete);
      loadEntries();
      showWarning('Entry Deleted', 'Journal entry has been deleted successfully.');
    } catch (error) {
      console.error('Error deleting entry:', error);
      showError('Delete Failed', 'Error deleting journal entry.');
    } finally {
      setShowConfirmDialog(false);
      setEntryToDelete(null);
    }
  };

  const exportJournal = () => {
    try {
      const markdown = JournalStorage.exportAllAsMarkdown();
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-export-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Export Complete', 'Your journal has been exported as a markdown file.');
    } catch (error) {
      console.error('Error exporting journal:', error);
      showError('Export Failed', 'Error exporting journal entries.');
    }
  };

  const filteredEntries = searchQuery
    ? JournalStorage.searchEntries(searchQuery)
    : entries;

  const addTag = (tag: string) => {
    if (tag && !currentEntry.tags?.includes(tag)) {
      setCurrentEntry(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCurrentEntry(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const addAffirmation = (affirmation: string) => {
    if (affirmation && !currentEntry.affirmations?.includes(affirmation)) {
      setCurrentEntry(prev => ({
        ...prev,
        affirmations: [...(prev.affirmations || []), affirmation]
      }));
    }
  };

  const removeAffirmation = (affirmationToRemove: string) => {
    setCurrentEntry(prev => ({
      ...prev,
      affirmations: prev.affirmations?.filter(aff => aff !== affirmationToRemove) || []
    }));
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-sage-50 via-dusty-blue-50 to-soft-lavender-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">📝 Personal Journal</h1>
              <p className="text-gray-600 dark:text-gray-300">Record your thoughts, feelings, and daily reflections</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportJournal}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export MD
              </button>
              <button
                onClick={() => resetForm()}
                className="px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Entry
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entry Form */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                New Journal Entry
              </h2>

              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={currentEntry.date?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, date: new Date(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentEntry.title || ''}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Give your entry a title..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Mood and Energy */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Heart className="inline w-4 h-4 mr-1" />
                      Mood: {currentEntry.mood}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentEntry.mood || 7}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Star className="inline w-4 h-4 mr-1" />
                      Energy: {currentEntry.energy}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentEntry.energy || 7}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Weather and Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Weather (Optional)
                    </label>
                    <input
                      type="text"
                      value={currentEntry.weather || ''}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, weather: e.target.value }))}
                      placeholder="Sunny, rainy, etc."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={currentEntry.location || ''}
                      onChange={(e) => setCurrentEntry(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Home, office, etc."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Reflections */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📝 Reflections
                  </label>
                  <textarea
                    value={currentEntry.reflections || ''}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, reflections: e.target.value }))}
                    placeholder="How was your day? What's on your mind?"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Gratitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🙏 Gratitude
                  </label>
                  <textarea
                    value={currentEntry.gratitude || ''}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, gratitude: e.target.value }))}
                    placeholder="What are you grateful for today?"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Biggest Win */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🎉 Biggest Win
                  </label>
                  <textarea
                    value={currentEntry.biggestWin || ''}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, biggestWin: e.target.value }))}
                    placeholder="What was your biggest accomplishment today?"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Challenge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    💪 Challenge Faced
                  </label>
                  <textarea
                    value={currentEntry.challenge || ''}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, challenge: e.target.value }))}
                    placeholder="What challenges did you face and how did you handle them?"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Learning */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🧠 What I Learned
                  </label>
                  <textarea
                    value={currentEntry.learning || ''}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, learning: e.target.value }))}
                    placeholder="What new insights or lessons did you gain?"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Tomorrow Focus */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🎯 Focus for Tomorrow
                  </label>
                  <textarea
                    value={currentEntry.tomorrowFocus || ''}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, tomorrowFocus: e.target.value }))}
                    placeholder="What do you want to focus on tomorrow?"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

  
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={saveEntry}
                    className="px-6 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Entry
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Recent Entries */}
          <div className="space-y-6">
            {/* Search */}
            <div className="glass-card rounded-2xl p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Recent Entries */}
            <div className="glass-card rounded-2xl p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Recent Entries</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEntries.slice(0, 10).map(entry => (
                  <div
                    key={entry.id}
                    className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg cursor-pointer hover:bg-white/70 dark:hover:bg-gray-700/70 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {entry.title || formatDate(entry.date)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(entry.date)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs">
                            Mood: {JournalStorage.getMoodEmoji(entry.mood)} {entry.mood}/10
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => editEntry(entry)}
                          className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.date)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {entry.reflections && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                        {entry.reflections}
                      </div>
                    )}
                  </div>
                ))}
                {filteredEntries.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {searchQuery ? 'No entries found matching your search.' : 'No journal entries yet. Start writing!'}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="glass-card rounded-2xl p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Journal Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Entries:</span>
                  <span className="font-medium">{entries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">This Month:</span>
                  <span className="font-medium">
                    {entries.filter(e => {
                      const entryDate = new Date(e.date);
                      const now = new Date();
                      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Mood:</span>
                  <span className="font-medium">
                    {entries.length > 0
                      ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <JournalEditModal
        entry={editingEntry}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        onDelete={deleteEntry}
      />

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Delete Journal Entry"
        message="Are you sure you want to delete this journal entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirmDialog(false)}
        type="danger"
      />
    </div>
  );
};

export default JournalSimple;