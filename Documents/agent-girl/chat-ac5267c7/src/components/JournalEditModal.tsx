import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Heart, Star, Trash2, Plus } from 'lucide-react';
import { ExtendedJournalEntry } from '../types/journal';
import { JournalStorage } from '../utils/journalStorage';
import { useNotifications } from './NotificationSystem';
import ConfirmDialog from './ConfirmDialog';

interface JournalEditModalProps {
  entry: ExtendedJournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: ExtendedJournalEntry) => void;
  onDelete?: (date: Date) => void;
}

const JournalEditModal: React.FC<JournalEditModalProps> = ({
  entry,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [currentEntry, setCurrentEntry] = useState<Partial<ExtendedJournalEntry>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { showSuccess, showError, showWarning } = useNotifications();

  useEffect(() => {
    if (entry) {
      setCurrentEntry({ ...entry });
    }
  }, [entry]);

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!entry || !currentEntry.reflections?.trim()) {
      showWarning('Reflections Required', 'Please add some reflections before saving.');
      return;
    }

    setIsLoading(true);
    try {
      const updatedEntry: ExtendedJournalEntry = {
        ...entry,
        ...currentEntry,
        date: new Date(currentEntry.date || entry.date),
        title: currentEntry.title || `Journal Entry - ${new Date(currentEntry.date || entry.date).toLocaleDateString()}`,
        mood: currentEntry.mood || entry.mood,
        energy: currentEntry.energy || entry.energy,
        reflections: currentEntry.reflections || entry.reflections,
        gratitude: currentEntry.gratitude || entry.gratitude,
        biggestWin: currentEntry.biggestWin || entry.biggestWin,
        challenge: currentEntry.challenge || entry.challenge,
        learning: currentEntry.learning || entry.learning,
        tomorrowFocus: currentEntry.tomorrowFocus || entry.tomorrowFocus,
        tags: currentEntry.tags || entry.tags,
        affirmations: currentEntry.affirmations || entry.affirmations,
        weather: currentEntry.weather || entry.weather,
        location: currentEntry.location || entry.location,
        lastSaved: new Date()
      };

      await JournalStorage.saveEntry(updatedEntry);
      onSave(updatedEntry);
      onClose();
      showSuccess('Entry Updated', 'Your journal entry has been updated successfully.');
    } catch (error) {
      console.error('Error saving entry:', error);
      showError('Update Failed', `Error saving journal entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!entry || !onDelete) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!entry || !onDelete) return;

    onDelete(entry.date);
    onClose();
    showWarning('Entry Deleted', 'Journal entry has been deleted successfully.');
  };

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

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Journal Entry</h2>
          <div className="flex items-center gap-3">
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete entry"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={formatDate(currentEntry.date || entry.date)}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, date: new Date(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
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
                    Mood: {currentEntry.mood || entry.mood}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentEntry.mood || entry.mood}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Star className="inline w-4 h-4 mr-1" />
                    Energy: {currentEntry.energy || entry.energy}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentEntry.energy || entry.energy}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Weather and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weather
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
                    Location
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

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {currentEntry.tags?.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 rounded-full text-sm flex items-center gap-1"
                    >
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="text-sage-500 hover:text-sage-700">×</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add a tag and press Enter..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sage-500 dark:bg-gray-800 dark:text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-sage-500 hover:bg-sage-600 disabled:bg-sage-400 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

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

export default JournalEditModal;