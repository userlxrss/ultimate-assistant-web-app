import React, { useState } from 'react';
import { Search, Edit3, Trash2, Calendar, Tag, TrendingUp, Clock, List, Folder } from 'lucide-react';
import { ExtendedJournalEntry } from '../../types/journal';

interface ListViewProps {
  entries: ExtendedJournalEntry[];
  onEditEntry: (entry: ExtendedJournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  expandedMonths?: string[];
  viewMode?: 'folders' | 'recent';
  toggleMonth?: (monthYear: string) => void;
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
  setSelectMode?: (selectMode: boolean) => void;
}

const ListView: React.FC<ListViewProps> = ({
  entries,
  onEditEntry,
  onDeleteEntry,
  expandedMonths = [],
  viewMode = 'folders',
  toggleMonth,
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
                <button
                  className="action-btn select-btn"
                  onClick={() => setSelectMode(true)}
                >
                  ☑️ Select
                </button>
              )}
              <button
                onClick={() => setViewMode(viewMode === 'folders' ? 'recent' : 'folders')}
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
        /* Month Folders View */
        <div className="month-folders">
          {Object.entries(organizeEntriesByMonth())
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([monthYear, monthData]) => {
              const isExpanded = expandedMonths.includes(monthYear);
              const filteredEntries = searchQuery
                ? monthData.entries.filter(e =>
                    e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    e.biggestWin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    e.learning?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : monthData.entries;

              if (searchQuery && filteredEntries.length === 0) return null;

              return (
                <div key={monthYear} className="month-folder">
                  <div className="month-header-wrapper">
                    <button
                      className="month-header"
                      onClick={() => toggleMonth(monthYear)}
                    >
                      <div className="month-info">
                        <span className="month-emoji">{getMonthEmoji(monthData.avgMood)}</span>
                        <span className="month-name">{monthYear}</span>
                        <span className="month-count">({filteredEntries.length})</span>
                      </div>
                      <div className="month-actions">
                        <span className="month-mood">
                          {monthData.avgMood !== 'N/A' ? `${monthData.avgMood}/10` : 'N/A'}
                        </span>
                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                          ▶
                        </span>
                      </div>
                    </button>

                    <div className="month-tools">
                      {selectMode && isExpanded && (
                        <button
                          className="select-all-btn"
                          onClick={() => isMonthFullySelected(filteredEntries)
                            ? deselectAllInMonth(filteredEntries)
                            : selectAllInMonth(filteredEntries)
                          }
                        >
                          {isMonthFullySelected(filteredEntries) ? '☑️ All' : '☐ All'}
                        </button>
                      )}
                      <button
                        className="export-month-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportMonthToMD(monthYear, filteredEntries);
                        }}
                        title="Export entire month"
                      >
                        📥
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="month-entries">
                      {filteredEntries.map(entry => (
                        <div
                          key={entry.id}
                          className={`entry-item ${selectedEntries.has(entry.id) ? 'selected' : ''}`}
                        >
                          {selectMode && (
                            <div className="entry-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedEntries.has(entry.id)}
                                onChange={() => toggleEntrySelection(entry.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}

                          <div className="entry-content">
                            <div className="entry-header">
                              <span className="entry-title">{entry.template || 'Untitled'}</span>
                              <span className="entry-date">{formatEntryDate(entry.date)}</span>
                            </div>

                            {entry.content && (
                              <p className="entry-preview">
                                {entry.content.substring(0, 80)}{entry.content.length > 80 ? '...' : ''}
                              </p>
                            )}

                            {entry.tags && entry.tags.length > 0 && (
                              <div className="entry-tags">
                                {entry.tags.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className="entry-tag">{tag}</span>
                                ))}
                                {entry.tags.length > 3 && (
                                  <span className="entry-tag">+{entry.tags.length - 3}</span>
                                )}
                              </div>
                            )}

                            <div className="entry-footer">
                              <div className="entry-meta">
                                <span className="entry-mood">😊 {entry.mood}</span>
                                {entry.biggestWin && (
                                  <span className="entry-win">🏆 Win</span>
                                )}
                                {entry.learning && (
                                  <span className="entry-learning">💡 Learning</span>
                                )}
                              </div>

                              {!selectMode && (
                                <div className="entry-actions">
                                  <button
                                    className="btn-entry-action"
                                    onClick={() => onEditEntry(entry)}
                                    title="View entry"
                                  >
                                    👁️
                                  </button>
                                  <button
                                    className="btn-entry-action"
                                    onClick={() => onDeleteEntry(entry.id)}
                                    title="Delete entry"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
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
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
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