import React, { useState, useEffect } from 'react';
import { Download, Filter, Calendar, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { TimeEntry, TimesheetFilter } from '../../types';
import { TimeTrackingStorage } from '../../utils/timeTrackingStorage';
import { TimeTrackingCalculations } from '../../utils/timeTrackingCalculations';

const TimesheetView: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [filters, setFilters] = useState<TimesheetFilter>({
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
      end: new Date()
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, filters, searchTerm]);

  const loadEntries = () => {
    const allEntries = TimeTrackingStorage.getTimeEntries();
    setEntries(allEntries);
  };

  const applyFilters = () => {
    let filtered = TimeTrackingCalculations.filterTimeEntries(entries, filters);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.date.includes(searchTerm) ||
        entry.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const csv = TimeTrackingStorage.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDate = new Date(value);
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: newDate
      }
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: {
        start: new Date(new Date().setDate(new Date().getDate() - 30)),
        end: new Date()
      }
    });
    setSearchTerm('');
  };

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  // Statistics
  const summary = TimeTrackingCalculations.getTimesheetSummary(filteredEntries);

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
              Timesheet
            </h2>
            <p className={`text-sm ${isDark ? 'glass-noir-text-secondary' : 'theme-text-secondary'}`}>
              View and export your work hours
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by date or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
            />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
                Start Date
              </label>
              <input
                type="date"
                value={filters.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
                End Date
              </label>
              <input
                type="date"
                value={filters.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            {/* Status Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  status: e.target.value as TimeEntry['status'] || undefined
                }))}
                className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
              >
                <option value="">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="clocked_in">Clocked In</option>
                <option value="on_break">On Break</option>
                <option value="clocked_out">Clocked Out</option>
              </select>
            </div>
            {/* Late Arrivals */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'glass-noir-text-secondary' : 'text-gray-700'}`}>
                Late Arrivals
              </label>
              <select
                value={filters.showLateArrivalsOnly ? 'yes' : 'no'}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  showLateArrivalsOnly: e.target.value === 'yes'
                }))}
                className={`w-full p-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300'}`}
              >
                <option value="no">All Entries</option>
                <option value="yes">Late Arrivals Only</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
          <p className={`text-sm ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>Total Days</p>
          <p className={`text-2xl font-bold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
            {summary.totalDays}
          </p>
        </div>
        <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
          <p className={`text-sm ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>Total Hours</p>
          <p className={`text-2xl font-bold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
            {summary.totalHours.toFixed(1)}h
          </p>
        </div>
        <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
          <p className={`text-sm ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>Average/Day</p>
          <p className={`text-2xl font-bold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
            {summary.averageHoursPerDay.toFixed(1)}h
          </p>
        </div>
        <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
          <p className={`text-sm ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>Late Arrivals</p>
          <p className={`text-2xl font-bold ${isDark ? 'glass-noir-text-primary' : 'theme-text-primary'}`}>
            {summary.lateArrivals}
          </p>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-gray-200'} shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-slate-900/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Clock In
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Clock Out
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Hours
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Breaks
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
              {paginatedEntries.map((entry) => (
                <tr key={entry.date} className={isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                    {entry.isLateArrival && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Late
                      </span>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {entry.clockIn ?
                      entry.clockIn.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '--:--'
                    }
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {entry.clockOut ?
                      entry.clockOut.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '--:--'
                    }
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {entry.totalHours.toFixed(2)}h
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    <div className="space-y-1">
                      {entry.lunchBreak && (
                        <div className="text-xs">
                          <span className="font-medium">Lunch:</span> {entry.lunchBreak.duration || 0}m
                        </div>
                      )}
                      {entry.shortBreaks.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Short:</span> {entry.shortBreaks.length} breaks
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      entry.status === 'clocked_out' ? 'bg-green-100 text-green-800' :
                      entry.status === 'clocked_in' ? 'bg-blue-100 text-blue-800' :
                      entry.status === 'on_break' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    <div className="max-w-xs truncate" title={entry.notes}>
                      {entry.notes || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg font-medium ${isDark ? 'glass-noir-text-secondary' : 'text-gray-900'}`}>
              No entries found
            </p>
            <p className={`text-sm ${isDark ? 'glass-noir-text-muted' : 'text-gray-500'}`}>
              Try adjusting your filters or search terms
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-6 py-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm ${isDark ? 'glass-noir-text-muted' : 'text-gray-700'}`}>
                Showing {((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, filteredEntries.length)} of {filteredEntries.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700 disabled:opacity-50' : 'hover:bg-gray-100 disabled:opacity-50'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className={`px-3 py-1 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'} text-sm`}>
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700 disabled:opacity-50' : 'hover:bg-gray-100 disabled:opacity-50'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetView;