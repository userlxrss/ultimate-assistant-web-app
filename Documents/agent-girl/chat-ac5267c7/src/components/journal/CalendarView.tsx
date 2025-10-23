import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3, Trash2, Plus } from 'lucide-react';
import { ExtendedJournalEntry } from '../../types/journal';

interface CalendarViewProps {
  entries: ExtendedJournalEntry[];
  onEditEntry: (entry: ExtendedJournalEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries, onEditEntry, onDeleteEntry }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getEntriesForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return entries.filter(entry => {
      const entryDateStr = formatDate(entry.date);
      return entryDateStr === dateStr;
    });
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 9) return '😊';
    if (mood >= 7) return '🙂';
    if (mood >= 5) return '😐';
    if (mood >= 3) return '😔';
    return '😢';
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEntries = getEntriesForDate(date);
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 border border-white/10 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px] ${
            isSelected
              ? 'bg-sage-500/20 border-sage-500/50'
              : isToday
              ? 'bg-white/10 border-white/20'
              : 'hover:bg-white/5'
          }`}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-sage-600 dark:text-sage-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {day}
          </div>
          {dayEntries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {dayEntries.slice(0, 3).map((entry, index) => (
                <span key={index} className="text-xs">
                  {getMoodEmoji(entry.mood)}
                </span>
              ))}
              {dayEntries.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">+{dayEntries.length - 3}</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedDateEntries = selectedDate ? getEntriesForDate(selectedDate) : [];

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Calendar View</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-gray-900 dark:text-white font-medium min-w-[150px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Selected Date Entries */}
      {selectedDate && (
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            {selectedDateEntries.length === 0 && (
              <button className="flex items-center gap-2 px-3 py-1 rounded-lg glass-button hover:bg-white/30 transition-all duration-200">
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Entry</span>
              </button>
            )}
          </div>

          {selectedDateEntries.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300 text-center py-8">
              No entries for this date
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDateEntries.map(entry => (
                <div key={entry.id} className="p-4 rounded-xl glass">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Mood: {entry.mood}/10
                        </span>
                        {entry.template && (
                          <span className="text-xs px-2 py-1 bg-sage-500/20 text-sage-600 dark:text-sage-400 rounded-full">
                            {entry.template}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-2 line-clamp-3">
                        {entry.content}
                      </p>
                      {entry.biggestWin && (
                        <p className="text-sm text-sage-600 dark:text-sage-400 mb-1">
                          <strong>Win:</strong> {entry.biggestWin}
                        </p>
                      )}
                      {entry.learning && (
                        <p className="text-sm text-dusty-blue-600 dark:text-dusty-blue-400 mb-2">
                          <strong>Learning:</strong> {entry.learning}
                        </p>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag: string) => (
                            <span key={tag} className="text-xs px-2 py-1 bg-white/20 dark:bg-white/10 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onEditEntry(entry)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;