import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import {
  User,
  AppState,
  ModuleType,
  JournalEntry,
  Task,
  CalendarEvent,
  Email,
  Contact,
  DashboardData,
  SyncStatus,
  UserPreferences
} from '@/types'

interface AppStore extends AppState {
  // User and preferences
  setUser: (user: User | null) => void
  setCurrentModule: (module: ModuleType) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Journal actions
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void
  deleteJournalEntry: (id: string) => void
  setJournalEntries: (entries: JournalEntry[]) => void

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskComplete: (id: string) => void
  setTasks: (tasks: Task[]) => void

  // Calendar actions
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  setEvents: (events: CalendarEvent[]) => void

  // Email actions
  addEmail: (email: Omit<Email, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEmail: (id: string, updates: Partial<Email>) => void
  deleteEmail: (id: string) => void
  setEmails: (emails: Email[]) => void

  // Contact actions
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void
  setContacts: (contacts: Contact[]) => void

  // Dashboard actions
  setDashboardData: (data: DashboardData) => void

  // Sync status actions
  setSyncStatus: (service: SyncStatus['service'], status: SyncStatus['status'], error?: string) => void
}

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,
      currentModule: 'dashboard',
      sidebarCollapsed: false,
      theme: 'light',

      // Data
      journalEntries: [],
      tasks: [],
      events: [],
      emails: [],
      contacts: [],
      dashboardData: null,
      syncStatus: [],

      // User and preferences actions
      setUser: (user) => set({ user }),
      setCurrentModule: (currentModule) => set({ currentModule }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setTheme: (theme) => set({ theme }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Journal actions
      addJournalEntry: (entry) =>
        set((state) => ({
          journalEntries: [
            {
              ...entry,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...state.journalEntries,
          ],
        })),

      updateJournalEntry: (id, updates) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((entry) =>
            entry.id === id
              ? { ...entry, ...updates, updatedAt: new Date() }
              : entry
          ),
        })),

      deleteJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.filter((entry) => entry.id !== id),
        })),

      setJournalEntries: (journalEntries) => set({ journalEntries }),

      // Task actions
      addTask: (task) =>
        set((state) => ({
          tasks: [
            {
              ...task,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...state.tasks,
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      toggleTaskComplete: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: task.status === 'completed' ? 'pending' : 'completed',
                  completedAt:
                    task.status === 'completed' ? undefined : new Date(),
                  updatedAt: new Date(),
                }
              : task
          ),
        })),

      setTasks: (tasks) => set({ tasks }),

      // Calendar actions
      addEvent: (event) =>
        set((state) => ({
          events: [
            {
              ...event,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...state.events,
          ],
        })),

      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id
              ? { ...event, ...updates, updatedAt: new Date() }
              : event
          ),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        })),

      setEvents: (events) => set({ events }),

      // Email actions
      addEmail: (email) =>
        set((state) => ({
          emails: [
            {
              ...email,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...state.emails,
          ],
        })),

      updateEmail: (id, updates) =>
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === id
              ? { ...email, ...updates, updatedAt: new Date() }
              : email
          ),
        })),

      deleteEmail: (id) =>
        set((state) => ({
          emails: state.emails.filter((email) => email.id !== id),
        })),

      setEmails: (emails) => set({ emails }),

      // Contact actions
      addContact: (contact) =>
        set((state) => ({
          contacts: [
            {
              ...contact,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...state.contacts,
          ],
        })),

      updateContact: (id, updates) =>
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id
              ? { ...contact, ...updates, updatedAt: new Date() }
              : contact
          ),
        })),

      deleteContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
        })),

      setContacts: (contacts) => set({ contacts }),

      // Dashboard actions
      setDashboardData: (dashboardData) => set({ dashboardData }),

      // Sync status actions
      setSyncStatus: (service, status, error) =>
        set((state) => {
          const existingIndex = state.syncStatus.findIndex(
            (s) => s.service === service
          )
          const newStatus: SyncStatus = {
            service,
            status,
            lastSync: new Date(),
            error,
          }

          if (existingIndex >= 0) {
            const updatedStatus = [...state.syncStatus]
            updatedStatus[existingIndex] = newStatus
            return { syncStatus: updatedStatus }
          }

          return { syncStatus: [...state.syncStatus, newStatus] }
        }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        currentModule: state.currentModule,
        journalEntries: state.journalEntries,
        tasks: state.tasks,
        events: state.events,
        emails: state.emails,
        contacts: state.contacts,
      }),
    }
  )
);

// Basic selectors
export const useUser = () => useAppStore((state) => state.user);
export const useCurrentModule = () => useAppStore((state) => state.currentModule);
export const useTheme = () => useAppStore((state) => state.theme);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useError = () => useAppStore((state) => state.error);
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebarCollapsed);

// Module-specific selectors
export const useJournalEntries = () => useAppStore((state) => state.journalEntries);
export const useTasks = () => useAppStore((state) => state.tasks);
export const useEvents = () => useAppStore((state) => state.events);
export const useEmails = () => useAppStore((state) => state.emails);
export const useContacts = () => useAppStore((state) => state.contacts);
export const useDashboardData = () => useAppStore((state) => state.dashboardData);

// Computed selectors - Fixed to work with zustand
export const useTodayTasks = () => {
  const tasks = useTasks();
  const today = new Date().toDateString();
  return tasks.filter(task => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    return !isNaN(taskDate.getTime()) && taskDate.toDateString() === today;
  });
};

export const useOverdueTasks = () => {
  const tasks = useTasks();
  const now = new Date();
  return tasks.filter(task => {
    if (!task.dueDate || task.status === 'completed') return false;
    return task.dueDate < now;
  });
};

export const useCompletedTasksToday = () => {
  const tasks = useTasks();
  const today = new Date().toDateString();
  return tasks.filter(task => {
    if (task.status !== 'completed' || !task.completedAt) return false;
    const completedDate = new Date(task.completedAt);
    return !isNaN(completedDate.getTime()) && completedDate.toDateString() === today;
  });
};

export const useUpcomingEvents = () => {
  const events = useEvents();
  const now = new Date();
  return events
    .filter(event => event.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5);
};

export const useRecentJournalEntries = () => {
  const entries = useJournalEntries();
  return entries
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);
};

// Export all actions for convenience
export const useAppActions = () => ({
  setUser: useAppStore((state) => state.setUser),
  setCurrentModule: useAppStore((state) => state.setCurrentModule),
  setSidebarCollapsed: useAppStore((state) => state.setSidebarCollapsed),
  setTheme: useAppStore((state) => state.setTheme),
  setLoading: useAppStore((state) => state.setLoading),
  setError: useAppStore((state) => state.setError),
  addJournalEntry: useAppStore((state) => state.addJournalEntry),
  updateJournalEntry: useAppStore((state) => state.updateJournalEntry),
  deleteJournalEntry: useAppStore((state) => state.deleteJournalEntry),
  setJournalEntries: useAppStore((state) => state.setJournalEntries),
  addTask: useAppStore((state) => state.addTask),
  updateTask: useAppStore((state) => state.updateTask),
  deleteTask: useAppStore((state) => state.deleteTask),
  toggleTaskComplete: useAppStore((state) => state.toggleTaskComplete),
  setTasks: useAppStore((state) => state.setTasks),
  addEvent: useAppStore((state) => state.addEvent),
  updateEvent: useAppStore((state) => state.updateEvent),
  deleteEvent: useAppStore((state) => state.deleteEvent),
  setEvents: useAppStore((state) => state.setEvents),
  addEmail: useAppStore((state) => state.addEmail),
  updateEmail: useAppStore((state) => state.updateEmail),
  deleteEmail: useAppStore((state) => state.deleteEmail),
  setEmails: useAppStore((state) => state.setEmails),
  addContact: useAppStore((state) => state.addContact),
  updateContact: useAppStore((state) => state.updateContact),
  deleteContact: useAppStore((state) => state.deleteContact),
  setContacts: useAppStore((state) => state.setContacts),
  setDashboardData: useAppStore((state) => state.setDashboardData),
  setSyncStatus: useAppStore((state) => state.setSyncStatus),
});