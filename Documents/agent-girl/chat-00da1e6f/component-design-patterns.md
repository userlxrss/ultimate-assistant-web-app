# Component Design Patterns - Ultimate Assistant Hub

## Core Design Principles

### 1. Atomic Design Pattern
We follow Brad Frost's Atomic Design methodology for scalable component architecture:

```
Atoms → Molecules → Organisms → Templates → Pages
```

- **Atoms**: Basic building blocks (buttons, inputs, labels)
- **Molecules**: Simple groups of atoms (search bars, form fields)
- **Organisms**: Complex sections (headers, sidebars, cards)
- **Templates**: Page-level layouts
- **Pages**: Specific instances with real data

### 2. Glassmorphism Design System
All components follow consistent glassmorphism principles with gender-neutral colors.

## Component Library Structure

### Atoms
```typescript
// components/ui/button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'glass',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  children,
  onClick,
  className
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300';

  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    glass: 'glass-button backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <LoadingSpinner className="mr-2 h-4 w-4" />}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// components/ui/input.tsx
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'search';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  label?: string;
  required?: boolean;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  icon,
  label,
  required = false,
  className
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full px-4 py-3 rounded-xl border transition-all duration-300
            ${icon ? 'pl-12' : ''}
            ${focused ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'}
            ${error ? 'border-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
            glass bg-white/50 dark:bg-gray-900/50
            ${className}
          `}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
```

### Molecules
```typescript
// components/ui/search-bar.tsx
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  loading?: boolean;
  suggestions?: string[];
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  onSearch,
  loading = false,
  suggestions = [],
  className
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(value) => {
              setQuery(value);
              setShowSuggestions(value.length > 0);
            }}
            onFocus={() => setShowSuggestions(query.length > 0)}
            className="pl-12"
          />
          {loading && (
            <LoadingSpinner className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5" />
          )}
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-white/20 shadow-xl z-50">
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-white/10 dark:hover:bg-black/20 transition-colors"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// components/ui/date-picker.tsx
interface DatePickerProps {
  selected?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="glass"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-start"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selected ? format(selected, 'PPP') : placeholder}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 glass rounded-xl border border-white/20 shadow-xl z-50">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="font-medium py-2">
                {day}
              </div>
            ))}
            {generateCalendarDays(currentMonth).map((date, index) => (
              <button
                key={index}
                onClick={() => date && handleDateSelect(date)}
                disabled={!date}
                className={`
                  py-2 rounded-lg transition-all duration-200
                  ${!date ? 'invisible' : 'hover:bg-white/20'}
                  ${selected && isSameDay(date, selected) ? 'bg-blue-500 text-white' : ''}
                  ${isToday(date) ? 'font-bold' : ''}
                `}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Organisms
```typescript
// components/layout/sidebar.tsx
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule: string;
  onModuleChange: (module: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'journal', label: 'Journal', icon: BookOpenIcon },
  { id: 'tasks', label: 'Tasks', icon: CheckSquareIcon },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'email', label: 'Email', icon: MailIcon },
  { id: 'contacts', label: 'Contacts', icon: UsersIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentModule,
  onModuleChange
}) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="h-full glass border-r border-white/20 p-6">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-white">Assistant Hub</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.id || pathname.includes(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onModuleChange(item.id);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">John Doe</p>
                  <p className="text-gray-300 text-sm">john@example.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// components/dashboard/analytics-card.tsx
interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  loading?: boolean;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'blue',
  loading = false
}) => {
  const colorClasses = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    purple: 'from-purple-400 to-purple-600',
    orange: 'from-orange-400 to-orange-600',
  };

  if (loading) {
    return (
      <Card variant="glass" className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="p-6 hover:scale-[1.02] transition-transform">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
        </div>
        {icon && (
          <div className={`
            p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]}
            text-white shadow-lg
          `}>
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="flex items-center space-x-2">
          {change.trend === 'up' ? (
            <TrendingUpIcon className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDownIcon className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            change.trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {Math.abs(change.value)}%
          </span>
          <span className="text-sm text-gray-500">from last week</span>
        </div>
      )}
    </Card>
  );
};
```

## Module-Specific Components

### Dashboard Module
```typescript
// components/dashboard/dashboard-grid.tsx
export const DashboardGrid: React.FC = () => {
  const { data: analytics, isLoading } = useDashboardAnalytics();
  const { data: recentTasks } = useRecentTasks();
  const { data: upcomingEvents } = useUpcomingEvents();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <AnalyticsCard
        title="Tasks Completed"
        value={analytics?.tasksCompleted || 0}
        change={{
          value: analytics?.tasksChange || 0,
          trend: analytics?.tasksTrend || 'up'
        }}
        icon={<CheckSquareIcon className="h-6 w-6" />}
        color="green"
        loading={isLoading}
      />
      <AnalyticsCard
        title="Journal Entries"
        value={analytics?.journalEntries || 0}
        change={{
          value: analytics?.journalChange || 0,
          trend: analytics?.journalTrend || 'up'
        }}
        icon={<BookOpenIcon className="h-6 w-6" />}
        color="purple"
        loading={isLoading}
      />
      <AnalyticsCard
        title="Emails Processed"
        value={analytics?.emailsProcessed || 0}
        change={{
          value: analytics?.emailsChange || 0,
          trend: analytics?.emailsTrend || 'up'
        }}
        icon={<MailIcon className="h-6 w-6" />}
        color="blue"
        loading={isLoading}
      />
      <AnalyticsCard
        title="Productivity Score"
        value={`${analytics?.productivityScore || 0}%`}
        change={{
          value: analytics?.productivityChange || 0,
          trend: analytics?.productivityTrend || 'up'
        }}
        icon={<TrendingUpIcon className="h-6 w-6" />}
        color="orange"
        loading={isLoading}
      />
    </div>
  );
};
```

### Journal Module
```typescript
// components/journal/journal-editor.tsx
export const JournalEditor: React.FC = () => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const { createEntry, isLoading } = useCreateJournalEntry();

  const handleSave = async () => {
    try {
      await createEntry({
        title,
        content,
        moodScore: mood,
        tags
      });
      // Reset form or navigate away
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card variant="glass" className="p-8">
        <div className="space-y-6">
          <Input
            label="Entry Title"
            placeholder="What's on your mind today?"
            value={title}
            onChange={setTitle}
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Mood Score: {mood}/10
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  onClick={() => setMood(score)}
                  className={`
                    w-10 h-10 rounded-lg transition-all duration-200
                    ${mood >= score ? 'bg-blue-500 text-white' : 'glass text-gray-300'}
                  `}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts..."
              rows={12}
              className="w-full px-4 py-3 rounded-xl glass resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <TagInput
            tags={tags}
            onChange={setTags}
            placeholder="Add tags..."
          />

          <div className="flex justify-end space-x-4">
            <Button variant="ghost" onClick={() => {/* Discard */}}>
              Discard
            </Button>
            <Button
              onClick={handleSave}
              loading={isLoading}
              disabled={!title || !content}
            >
              Save Entry
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
```

## Performance Patterns

### 1. Component Memoization
```typescript
// Expensive component wrapped in React.memo
const ExpensiveChart = React.memo(({ data }: { data: ChartData[] }) => {
  // Complex rendering logic
  return <Chart data={data} />;
});

// Custom hook for memoized calculations
const useFilteredTasks = (tasks: Task[], filter: TaskFilter) => {
  return useMemo(() => {
    return tasks.filter(task => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.search && !task.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filter]);
};
```

### 2. Virtual Scrolling
```typescript
// components/ui/virtual-list.tsx
export const VirtualList: React.FC<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}> = ({ items, itemHeight, containerHeight, renderItem }) => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Accessibility Patterns

### 1. ARIA Support
```typescript
// components/ui/modal.tsx
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="glass rounded-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <h2 id="modal-title" className="text-xl font-bold mb-4">
          {title}
        </h2>
        <div className="mb-6">
          {children}
        </div>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>,
    document.body
  );
};
```

### 2. Focus Management
```typescript
// Custom hook for focus management
const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
};
```

These component design patterns provide a solid foundation for building maintainable, accessible, and performant user interfaces for the Ultimate Assistant Hub. The glassmorphism design system ensures a consistent, modern aesthetic across all components while maintaining excellent user experience.