import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Camera, Download, Lock, Unlock, Wifi, WifiOff, Brain, MapPin } from 'lucide-react';
import {
  saveJournalEntry,
  loadJournalEntries,
  getJournalEntriesForCalendar,
  getJournalEntryByDate,
  generateAIInsight,
  uploadJournalPhoto,
  deleteJournalPhoto,
  getCurrentUser
} from '../supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CryptoJS from 'crypto-js';

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  mood: number;
  energy: number;
  reflections: string;
  gratitude: string;
  tags: string[];
  photo_url?: string;
  is_locked?: boolean;
  created_at: string;
  updated_at: string;
}

const JournalEnhanced: React.FC = () => {
  // State for new entry form
  const [journalEntry, setJournalEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    mood: 7,
    energy: 7,
    reflections: '',
    gratitude: '',
    tags: [] as string[],
    photo_url: null as string | null
  });

  // State for entries and UI
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // New features state
  const [aiInsight, setAiInsight] = useState<string>('');
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Offline mode state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // Encryption state
  const [lockedMonths, setLockedMonths] = useState<Set<string>>(new Set());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [monthToLock, setMonthToLock] = useState<string>('');
  const [password, setPassword] = useState('');
  const [encryptionKey, setEncryptionKey] = useState<string>('');

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      syncOfflineEntries();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load AI Insight
  useEffect(() => {
    const loadAIInsight = async () => {
      try {
        const insight = await generateAIInsight();
        setAiInsight(insight || "Start journaling to unlock personalized insights!");
      } catch (error) {
        console.error('Error loading AI insight:', error);
        setAiInsight("Keep writing to discover your patterns!");
      }
    };

    loadAIInsight();
  }, []);

  // Load calendar data
  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth() + 1;
        const data = await getJournalEntriesForCalendar(year, month);
        setCalendarData(data);
      } catch (error) {
        console.error('Error loading calendar data:', error);
      }
    };

    loadCalendarData();
  }, [selectedMonth]);

  // Load entries
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        const data = await loadJournalEntries();
        setEntries(data);

        // Load locked months from localStorage
        const savedLocked = localStorage.getItem('locked_months');
        if (savedLocked) {
          setLockedMonths(new Set(JSON.parse(savedLocked)));
        }

        // Load encryption key from localStorage
        const savedKey = localStorage.getItem('journal_encryption_key');
        if (savedKey) {
          setEncryptionKey(savedKey);
        }
      } catch (error) {
        console.error('Error loading entries:', error);
        setError('Failed to load journal entries');
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  // Auto-save to localStorage when offline
  useEffect(() => {
    if (!isOnline && journalEntry.title) {
      const draftKey = `draft_${getCurrentUser()?.id || 'anonymous'}`;
      localStorage.setItem(draftKey, JSON.stringify(journalEntry));
    }
  }, [journalEntry, isOnline]);

  // Sync offline entries when back online
  const syncOfflineEntries = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const draftKey = `draft_${user.id}`;
      const savedDraft = localStorage.getItem(draftKey);

      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        await saveJournalEntry(draft);
        localStorage.removeItem(draftKey);
      }

      setSyncStatus('synced');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error syncing offline entries:', error);
      setSyncStatus('offline');
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setError('');

      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const photoUrl = await uploadJournalPhoto(file, user.id);

      if (photoUrl) {
        setPhotoPreview(photoUrl);
        setJournalEntry(prev => ({ ...prev, photo_url: photoUrl }));
      } else {
        throw new Error('Failed to upload photo');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      setError('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    if (journalEntry.photo_url) {
      await deleteJournalPhoto(journalEntry.photo_url);
    }
    setPhotoPreview('');
    setJournalEntry(prev => ({ ...prev, photo_url: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save entry
  const handleSaveEntry = async () => {
    if (!journalEntry.title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const entryData = {
        ...journalEntry,
        tags: journalEntry.tags.filter(tag => tag.trim())
      };

      if (isOnline) {
        await saveJournalEntry(entryData);
        setSyncStatus('synced');
      } else {
        // Save to offline queue
        setOfflineQueue(prev => [...prev, entryData]);
        setSyncStatus('offline');
      }

      // Clear form
      setJournalEntry({
        date: new Date().toISOString().split('T')[0],
        title: '',
        mood: 7,
        energy: 7,
        reflections: '',
        gratitude: '',
        tags: [],
        photo_url: null
      });
      setPhotoPreview('');

      // Reload entries
      const data = await loadJournalEntries();
      setEntries(data);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reload calendar data
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const calData = await getJournalEntriesForCalendar(year, month);
      setCalendarData(calData);

    } catch (error) {
      console.error('Save error:', error);
      setError('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text(`Journal - ${selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Filter entries for selected month
      const monthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === selectedMonth.getMonth() &&
               entryDate.getFullYear() === selectedMonth.getFullYear();
      });

      monthEntries.forEach((entry, index) => {
        // Check if entry is locked
        const monthKey = `${entry.date.substring(0, 7)}`;
        if (lockedMonths.has(monthKey)) {
          pdf.setFontSize(12);
          pdf.text(`📅 ${entry.date} - 🔒 Locked Entry`, 20, yPosition);
          yPosition += 10;
          return;
        }

        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text(`📅 ${entry.date}`, 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(16);
        pdf.text(entry.title, 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(12);
        pdf.text(`Mood: ${'😊'.repeat(entry.mood)} ${entry.mood}/10`, 20, yPosition);
        yPosition += 6;

        pdf.text(`Energy: ${'⚡'.repeat(entry.energy)} ${entry.energy}/10`, 20, yPosition);
        yPosition += 10;

        if (entry.reflections) {
          pdf.setFontSize(11);
          pdf.text('Reflections:', 20, yPosition);
          yPosition += 6;
          const lines = pdf.splitTextToSize(entry.reflections, pageWidth - 40);
          lines.forEach((line: string) => {
            pdf.text(line, 25, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }

        if (entry.gratitude) {
          pdf.text('Gratitude:', 20, yPosition);
          yPosition += 6;
          const lines = pdf.splitTextToSize(entry.gratitude, pageWidth - 40);
          lines.forEach((line: string) => {
            pdf.text(line, 25, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }

        if (entry.tags.length > 0) {
          pdf.text(`Tags: ${entry.tags.join(', ')}`, 20, yPosition);
          yPosition += 10;
        }

        yPosition += 5;
      });

      // Download PDF
      const fileName = `Journal_${selectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF export error:', error);
      setError('Failed to export PDF');
    }
  };

  // Calendar heat map functions
  const getCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getDayIntensity = (day: number) => {
    const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEntries = calendarData.filter(entry => entry.date === dateStr);

    if (dayEntries.length === 0) return 0;
    if (dayEntries.length === 1) return 1;
    if (dayEntries.length === 2) return 2;
    return 3;
  };

  const handleDayClick = async (day: number) => {
    const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);

    try {
      const entry = await getJournalEntryByDate(dateStr);
      if (entry) {
        // Check if entry is locked
        const monthKey = dateStr.substring(0, 7);
        if (lockedMonths.has(monthKey)) {
          setShowPasswordModal(true);
          setMonthToLock(monthKey);
          return;
        }
        setViewingEntry(entry);
      }
    } catch (error) {
      console.error('Error loading entry:', error);
    }
  };

  // Encryption functions
  const encryptData = (data: string, key: string) => {
    return CryptoJS.AES.encrypt(data, key).toString();
  };

  const decryptData = (encryptedData: string, key: string) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  };

  const toggleMonthLock = (monthKey: string) => {
    if (lockedMonths.has(monthKey)) {
      // Unlock month
      const newLocked = new Set(lockedMonths);
      newLocked.delete(monthKey);
      setLockedMonths(newLocked);
      localStorage.setItem('locked_months', JSON.stringify([...newLocked]));
    } else {
      // Lock month
      setShowPasswordModal(true);
      setMonthToLock(monthKey);
    }
  };

  const handlePasswordSubmit = () => {
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (!encryptionKey) {
      // First time setting encryption
      setEncryptionKey(password);
      localStorage.setItem('journal_encryption_key', password);
    }

    if (password === encryptionKey) {
      // Correct password
      const newLocked = new Set(lockedMonths);
      if (monthToLock) {
        newLocked.add(monthToLock);
        setLockedMonths(newLocked);
        localStorage.setItem('locked_months', JSON.stringify([...newLocked]));
      }
      setShowPasswordModal(false);
      setPassword('');
      setMonthToLock('');

      if (selectedDate) {
        // Load the entry again
        handleDayClick(parseInt(selectedDate.split('-')[2]));
      }
    } else {
      setError('Incorrect password');
    }
  };

  // Render calendar heat map
  const renderCalendarHeatMap = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = getCalendarDays();
    const monthKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
    const isMonthLocked = lockedMonths.has(monthKey);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              ←
            </button>
            <button
              onClick={() => setSelectedMonth(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              →
            </button>
            <button
              onClick={() => toggleMonthLock(monthKey)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title={isMonthLocked ? "Unlock month" : "Lock month"}
            >
              {isMonthLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const intensity = getDayIntensity(day);
            const dateStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEntry = calendarData.some(entry => entry.date === dateStr);
            const isToday = new Date().toDateString() === new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day).toDateString();

            const bgColors = [
              'bg-gray-100 dark:bg-gray-700',
              'bg-green-100 dark:bg-green-900',
              'bg-green-300 dark:bg-green-700',
              'bg-green-500 dark:bg-green-500'
            ];

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                  ${bgColors[intensity]}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${hasEntry ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}
                  ${hasEntry ? 'font-semibold' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <span>No entry</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 dark:bg-green-900 rounded"></div>
            <span>1 entry</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-300 dark:bg-green-700 rounded"></div>
            <span>2 entries</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 dark:bg-green-500 rounded"></div>
            <span>3+ entries</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Sync Status */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Journal</h1>
        <div className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">
                {syncStatus === 'synced' ? '✅ Synced' : syncStatus === 'syncing' ? '⏳ Syncing...' : '📶 Offline'}
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600 dark:text-orange-400">📶 Offline</span>
            </>
          )}
        </div>
      </div>

      {/* AI Insight Card */}
      {aiInsight && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
          <div className="flex items-start gap-3">
            <Brain className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Your Weekly Insight</h3>
              <p className="text-sm opacity-90">{aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
          Entry saved successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* New Entry Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">New Entry</h2>

        <div className="space-y-4">
          {/* Date and Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={journalEntry.date}
                onChange={(e) => setJournalEntry(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={journalEntry.title}
                onChange={(e) => setJournalEntry(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Give your entry a title..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo (optional)
            </label>
            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <button
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {uploadingPhoto ? 'Uploading...' : '📷 Add Photo (optional)'}
                </button>
              </div>
            )}
          </div>

          {/* Mood and Energy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mood: {journalEntry.mood}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={journalEntry.mood}
                onChange={(e) => setJournalEntry(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>😢</span>
                <span>😐</span>
                <span>😊</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Energy: {journalEntry.energy}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={journalEntry.energy}
                onChange={(e) => setJournalEntry(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>🔋</span>
                <span>⚡</span>
                <span>🚀</span>
              </div>
            </div>
          </div>

          {/* Reflections */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reflections
            </label>
            <textarea
              value={journalEntry.reflections}
              onChange={(e) => setJournalEntry(prev => ({ ...prev, reflections: e.target.value }))}
              placeholder="What's on your mind today?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Gratitude */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gratitude
            </label>
            <textarea
              value={journalEntry.gratitude}
              onChange={(e) => setJournalEntry(prev => ({ ...prev, gratitude: e.target.value }))}
              placeholder="What are you grateful for today?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {journalEntry.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => setJournalEntry(prev => ({
                      ...prev,
                      tags: prev.tags.filter((_, i) => i !== index)
                    }))}
                    className="ml-1 text-emerald-600 dark:text-emerald-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add a tag and press Enter..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value.trim();
                  if (value && !journalEntry.tags.includes(value)) {
                    setJournalEntry(prev => ({
                      ...prev,
                      tags: [...prev.tags, value]
                    }));
                  }
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveEntry}
            disabled={saving || !journalEntry.title.trim()}
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* Calendar Heat Map */}
      {renderCalendarHeatMap()}

      {/* Export Buttons */}
      <div className="flex gap-4">
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
        <button
          onClick={() => {
            const monthEntries = entries.filter(entry => {
              const entryDate = new Date(entry.date);
              return entryDate.getMonth() === selectedMonth.getMonth() &&
                     entryDate.getFullYear() === selectedMonth.getFullYear();
            });
            const dataStr = JSON.stringify(monthEntries, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Journal_${selectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}.json`;
            link.click();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          <Download className="w-4 h-4" />
          Export MD
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {lockedMonths.has(monthToLock) ? 'Enter Password to Unlock' : 'Set Password to Lock'}
            </h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter 4+ character password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setMonthToLock('');
                  setError('');
                }}
                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entry View Modal */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {viewingEntry.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(viewingEntry.date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setViewingEntry(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            {viewingEntry.photo_url && (
              <img
                src={viewingEntry.photo_url}
                alt="Entry photo"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}

            <div className="space-y-4">
              <div className="flex gap-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Mood:</span>
                  <div className="flex items-center gap-1">
                    {'😊'.repeat(viewingEntry.mood)}
                    <span className="text-sm">{viewingEntry.mood}/10</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Energy:</span>
                  <div className="flex items-center gap-1">
                    {'⚡'.repeat(viewingEntry.energy)}
                    <span className="text-sm">{viewingEntry.energy}/10</span>
                  </div>
                </div>
              </div>

              {viewingEntry.reflections && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Reflections</h4>
                  <p className="text-gray-700 dark:text-gray-300">{viewingEntry.reflections}</p>
                </div>
              )}

              {viewingEntry.gratitude && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Gratitude</h4>
                  <p className="text-gray-700 dark:text-gray-300">{viewingEntry.gratitude}</p>
                </div>
              )}

              {viewingEntry.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingEntry.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEnhanced;