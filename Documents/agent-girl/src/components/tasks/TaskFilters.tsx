import React, { useState } from 'react';
import { Search, Filter, Calendar, Flag, Folder, Tag, X, ChevronDown } from 'lucide-react';
import { TaskFilter, Task } from '../../types/tasks';

interface TaskFiltersProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  tasks: Task[];
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ filter, onFilterChange, tasks }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(filter.search || '');

  // Get unique categories and projects from tasks
  const categories = Array.from(new Set(tasks.map(task => task.category)));
  const projects = Array.from(new Set(tasks.map(task => task.projectId).filter(Boolean)));

  const dateRangeOptions = [
    { value: 'today', label: 'Today', icon: '📅' },
    { value: 'overdue', label: 'Overdue', icon: '⚠️' },
    { value: 'upcoming', label: 'Upcoming', icon: '📆' },
    { value: 'week', label: 'This Week', icon: '🗓️' },
    { value: 'month', label: 'This Month', icon: '📋' }
  ];

  const priorityOptions = [
    { value: 'urgent', label: 'Urgent', color: 'text-red-600 dark:text-red-400' },
    { value: 'high', label: 'High', color: 'text-orange-600 dark:text-orange-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'low', label: 'Low', color: 'text-green-600 dark:text-green-400' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'in-progress', label: 'In Progress', color: 'text-emerald-600 dark:text-emerald-400' },
    { value: 'completed', label: 'Completed', color: 'text-green-600 dark:text-green-400' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600 dark:text-red-400' }
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onFilterChange({ ...filter, search: value });
  };

  const handleClearFilters = () => {
    setSearchValue('');
    onFilterChange({});
  };

  const hasActiveFilters = filter.search || filter.priority || filter.status || filter.category || filter.dateRange;

  return (
    <div className="glass-card p-4 mb-6">
      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search tasks by title, description, or tags..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-button focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
            isExpanded || hasActiveFilters
              ? 'bg-sage-500 text-white'
              : 'glass-button hover:bg-white/30 dark:hover:bg-white/20'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {Object.keys(filter).filter(key => filter[key as keyof TaskFilter]).length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 rounded-xl glass-button hover:bg-white/30 dark:hover:bg-white/20 transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date Range
              </label>
              <select
                value={filter.dateRange || ''}
                onChange={(e) => onFilterChange({ ...filter, dateRange: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg glass-button focus:outline-none focus:ring-2 focus:ring-sage-500 text-sm"
              >
                <option value="">All dates</option>
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Flag className="inline w-4 h-4 mr-1" />
                Priority
              </label>
              <select
                value={filter.priority || ''}
                onChange={(e) => onFilterChange({ ...filter, priority: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg glass-button focus:outline-none focus:ring-2 focus:ring-sage-500 text-sm"
              >
                <option value="">All priorities</option>
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value} className={option.color}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filter.status || ''}
                onChange={(e) => onFilterChange({ ...filter, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg glass-button focus:outline-none focus:ring-2 focus:ring-sage-500 text-sm"
              >
                <option value="">All statuses</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value} className={option.color}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Folder className="inline w-4 h-4 mr-1" />
                Category
              </label>
              <select
                value={filter.category || ''}
                onChange={(e) => onFilterChange({ ...filter, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg glass-button focus:outline-none focus:ring-2 focus:ring-sage-500 text-sm"
              >
                <option value="">All categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Filter */}
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                Project
              </label>
              <select
                value={filter.project || ''}
                onChange={(e) => onFilterChange({ ...filter, project: e.target.value })}
                className="w-full md:w-64 px-3 py-2 rounded-lg glass-button focus:outline-none focus:ring-2 focus:ring-sage-500 text-sm"
              >
                <option value="">All projects</option>
                {projects.map(project => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
              {filter.search && (
                <span className="px-2 py-1 bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 rounded-full text-xs flex items-center gap-1">
                  Search: "{filter.search}"
                  <button onClick={() => onFilterChange({ ...filter, search: undefined })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filter.dateRange && (
                <span className="px-2 py-1 bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 rounded-full text-xs flex items-center gap-1">
                  Date: {dateRangeOptions.find(o => o.value === filter.dateRange)?.label}
                  <button onClick={() => onFilterChange({ ...filter, dateRange: undefined })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filter.priority && (
                <span className="px-2 py-1 bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 rounded-full text-xs flex items-center gap-1">
                  Priority: {priorityOptions.find(o => o.value === filter.priority)?.label}
                  <button onClick={() => onFilterChange({ ...filter, priority: undefined })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filter.status && (
                <span className="px-2 py-1 bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 rounded-full text-xs flex items-center gap-1">
                  Status: {statusOptions.find(o => o.value === filter.status)?.label}
                  <button onClick={() => onFilterChange({ ...filter, status: undefined })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filter.category && (
                <span className="px-2 py-1 bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 rounded-full text-xs flex items-center gap-1">
                  Category: {filter.category}
                  <button onClick={() => onFilterChange({ ...filter, category: undefined })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filter.project && (
                <span className="px-2 py-1 bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 rounded-full text-xs flex items-center gap-1">
                  Project: {filter.project}
                  <button onClick={() => onFilterChange({ ...filter, project: undefined })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFilters;