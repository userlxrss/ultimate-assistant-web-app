import React, { useState } from 'react';
import { Search, Edit3, Trash2, Calendar, Tag, TrendingUp, Clock, List, Folder } from 'lucide-react';
import { ExtendedJournalEntry } from '../../types/journal';
import './ListView-Fix.css';
import './FINAL-MODAL-FIX.css';
import './LIGHT-MODE-COPY.css';

interface ListViewProps {
  entries: ExtendedJournalEntry[];
  onEditEntry: (entry: ExtendedJournalEntry) => void;
  onViewEntry?: (entry: ExtendedJournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  activeFolder?: string | null;
  viewMode?: 'folders' | 'recent';
  openFolder?: (monthYear: string) => void;
  closeFolder?: () => void;
  exportMonthAsMarkdown?: (monthYear: string) => void;
  organizeEntriesByMonth?: () => Record<string, {
    entries: ExtendedJournalEntry[];
    avgMood: number | string;
    totalEntries: number;
  }>;
  getMonthEmoji?: (avgMood: number | string) => string;
  formatEntryDate?: (date: Date) => string;
  setViewMode?: (viewMode: 'folders' | 'recent') => void;
  searchQuery?: string;
  selectedEntries?: Set<string>;
  selectMode?: boolean;
  toggleEntrySelection?: (entryId: string) => void;
  selectAllInMonth?: (entries: ExtendedJournalEntry[]) => void;
  deselectAllInMonth?: (entries: ExtendedJournalEntry[]) => void;
  isMonthFullySelected?: (entries: ExtendedJournalEntry[]) => boolean;
  exportMonthToMD?: (monthYear: string, entries: ExtendedJournalEntry[]) => void;
  clearSelection?: () => void;
  exportSelectedToMD?: () => void;
  exportAllToMD?: (entries: ExtendedJournalEntry[]) => void;
  setSelectMode?: (selectMode: boolean) => void;
}

const ListView: React.FC<ListViewProps> = ({
  entries,
  onEditEntry,
  onViewEntry,
  onDeleteEntry,
  activeFolder = null,
  viewMode = 'folders',
  openFolder,
  closeFolder,
  exportMonthAsMarkdown,
  organizeEntriesByMonth,
  getMonthEmoji,
  formatEntryDate,
  setViewMode,
  searchQuery = '',
  selectedEntries = new Set(),
  selectMode = false,
  toggleEntrySelection,
  selectAllInMonth,
  deselectAllInMonth,
  isMonthFullySelected,
  exportMonthToMD,
  clearSelection,
  exportSelectedToMD,
  exportAllToMD,
  setSelectMode
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'mood' | 'tags'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const getMoodEmoji = (mood: number) => {
    if (mood >= 9) return '😊';
    if (mood >= 7) return '🙂';
    if (mood >= 5) return '😐';
    if (mood >= 3) return '😔';
    return '😢';
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return 'text-green-600 dark:text-green-400';
    if (mood >= 6) return 'text-lime-600 dark:text-lime-400';
    if (mood >= 4) return 'text-yellow-600 dark:text-yellow-400';
    if (mood >= 2) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = a.date.getTime() - b.date.getTime();
        break;
      case 'mood':
        comparison = a.mood - b.mood;
        break;
      case 'tags':
        comparison = (a.tags?.length || 0) - (b.tags?.length || 0);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (field: 'date' | 'mood' | 'tags') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Entries ({entries.length} entries)
        </h2>

        <div className="flex items-center gap-3">
          {selectMode ? (
            <>
              <button
                className="action-btn export-btn"
                onClick={exportSelectedToMD}
                disabled={selectedEntries.size === 0}
              >
                📥 Export ({selectedEntries.size})
              </button>
              <button
                className="action-btn cancel-btn"
                onClick={clearSelection}
              >
                ✕ Cancel
              </button>
            </>
          ) : (
            <>
              {entries.length > 0 && (
                <>
                  <button
                    className="action-btn export-btn"
                    onClick={() => {
                      if (exportAllToMD) {
                        exportAllToMD(entries);
                      }
                    }}
                  >
                    📥 Export All
                  </button>
                  <button
                    className="action-btn select-btn"
                    onClick={() => setSelectMode(true)}
                  >
                    ☑️ Select
                  </button>
                </>
              )}
              <button
                onClick={() => setViewMode && setViewMode(viewMode === 'folders' ? 'recent' : 'folders')}
                className="view-toggle"
              >
                {viewMode === 'folders' ? '📋 List' : '📁 Folders'}
              </button>
            </>
          )}

          {/* Sort Controls (only show in recent view) */}
          {viewMode === 'recent' && !selectMode && (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-300">Sort:</span>
              {[
                { key: 'date', label: 'Date', icon: Calendar },
                { key: 'mood', label: 'Mood', icon: TrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => toggleSort(key as any)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 text-xs ${
                    sortBy === key
                      ? 'bg-sage-500/20 text-sage-600 dark:text-sage-400'
                      : 'glass-button hover:bg-white/30 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {sortBy === key && (
                    <span className="ml-1">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">No journal entries found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Start writing to see your entries here
          </p>
        </div>
      ) : viewMode === 'folders' ? (
        /* Modal-based Month Folders View */
        <>
          <div className="month-folders">
            {Object.entries(organizeEntriesByMonth())
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([monthYear, monthData]) => {
                const filteredEntries = searchQuery
                  ? monthData.entries.filter(e =>
                      e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.biggestWin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.learning?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : monthData.entries;

                if (searchQuery && filteredEntries.length === 0) return null;

                console.log(`🔥 RENDERING MONTH: ${monthYear} with ${filteredEntries.length} entries`);
                return (
                  <div key={monthYear} className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getMonthEmoji(monthData.avgMood)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{monthYear}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {filteredEntries.length} entries • Avg mood: {monthData.avgMood}/10
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => openFolder && openFolder(monthYear)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      >
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Modal Overlay */}
          {activeFolder && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={closeFolder}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              data-modal="journal-month-entries"
            >
              <div
                className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden transform transition-all duration-300 scale-100 opacity-100 modal-enter"
                style={{
                  width: '672px',
                  maxWidth: '672px',
                  minWidth: '672px',
                  maxHeight: '80vh',
                  margin: '0 auto',
                  flex: '0 0 672px',
                  boxSizing: 'border-box'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getMonthEmoji(organizeEntriesByMonth()[activeFolder]?.avgMood || 'N/A')}</span>
                    <div>
                      <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-slate-100">{activeFolder}</h2>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {organizeEntriesByMonth()[activeFolder]?.entries.length || 0} entries
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        exportMonthAsMarkdown && exportMonthAsMarkdown(activeFolder);
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                      title={`Export ${activeFolder} entries as Markdown`}
                      aria-label={`Export ${activeFolder} entries as Markdown`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export MD
                    </button>
                    <button
                      onClick={closeFolder}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
                      aria-label="Close modal"
                    >
                      <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Content - Entries List */}
                <div className="overflow-y-auto max-h-[50vh] space-y-3 mb-6">
                  {organizeEntriesByMonth()[activeFolder]?.entries.map(entry => (
                    <div key={entry.id} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-slate-100">
                              {entry.template || 'Untitled Entry'}
                            </h4>
                            <span className="text-sm text-gray-500 dark:text-slate-400">
                              {formatEntryDate(entry.date)}
                            </span>
                          </div>

                          {entry.content && (
                            <p className="text-sm text-gray-600 dark:text-slate-300 mb-2 line-clamp-2">
                              {entry.content.substring(0, 120)}{entry.content.length > 120 ? '...' : ''}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                              😊 {entry.mood}/10
                            </span>
                            {entry.biggestWin && (
                              <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                                🏆 Win
                              </span>
                            )}
                            {entry.learning && (
                              <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                                💡 Learning
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => onViewEntry && onViewEntry(entry)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200"
                            title="View entry"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => onEditEntry(entry)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200"
                            title="Edit entry"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDeleteEntry(entry.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors duration-200 text-red-500"
                            title="Delete entry"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                </div>
            </div>
          )}
        </>
      ) : (
        /* Recent List View */
        <div className="space-y-4">
          {sortedEntries.slice(0, 20).map(entry => (
            <div
              key={entry.id}
              className="glass p-4 rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className={`text-sm font-medium ${getMoodColor(entry.mood)}`}>
                        {entry.mood}/10
                      </span>
                    </div>
                    {entry.template && (
                      <span className="text-xs px-2 py-1 bg-sage-500/20 text-sage-600 dark:text-sage-400 rounded-full">
                        {entry.template}
                      </span>
                    )}
                    {entry.isDraft && (
                      <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="mb-3">
                    <p className={`text-gray-700 dark:text-gray-300 ${
                      expandedEntry === entry.id ? '' : 'line-clamp-3'
                    }`}>
                      {entry.content}
                    </p>
                    {entry.content.length > 150 && (
                      <button
                        onClick={() => setExpandedEntry(
                          expandedEntry === entry.id ? null : entry.id
                        )}
                        className="text-sm text-sage-600 dark:text-sage-400 hover:underline mt-1"
                      >
                        {expandedEntry === entry.id ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>

                  {/* Win and Learning */}
                  {(entry.biggestWin || entry.learning) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      {entry.biggestWin && (
                        <div className="p-2 bg-green-500/10 dark:bg-green-500/5 rounded-lg">
                          <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                            Biggest Win
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {entry.biggestWin}
                          </p>
                        </div>
                      )}
                      {entry.learning && (
                        <div className="p-2 bg-blue-500/10 dark:bg-blue-500/5 rounded-lg">
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                            Learning
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {entry.learning}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-3 h-3 text-gray-500" />
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-white/20 dark:bg-white/10 rounded-full hover:bg-white/30 transition-colors duration-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Saved */}
                  {entry.lastSaved && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        Last saved: {entry.lastSaved.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEditEntry(entry)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                    title="Edit entry"
                  >
                    <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors duration-200"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {entries.length > 20 && (
            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              Showing 20 of {entries.length} entries. Use Folders view to see all entries organized by month.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ListView;