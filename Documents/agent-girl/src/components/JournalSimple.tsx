import React, { useState, useEffect } from 'react';
import { SecureUserJournalStorage } from '../utils/secureUserJournalStorage';
import { JournalEntry } from '../utils/secureJournalStorage';import { JournalDataRecovery } from '../utils/journalDataRecovery';
import {
  saveJournalEntry,
  loadJournalEntries,
  getJournalEntriesForCalendar,
  generateAIInsight,
  uploadJournalPhoto,
  deleteJournalPhoto,
  getCurrentUser,
  saveMonthPassword,
  verifyMonthPassword,
  checkMonthHasPassword
} from '../supabase';
import jsPDF from 'jspdf';
import CryptoJS from 'crypto-js';
import { supabase } from '../supabase';

const JournalSimple: React.FC = () => {
  // Add state for journal
  // Add to existing journal state
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [moodTrend, setMoodTrend] = useState({ direction: 'up', percent: 12 });

  // Update journalEntry state to include tags
  const [journalEntry, setJournalEntry] = useState({
    date: new Date().toLocaleDateString('en-CA'),
    title: '',
    mood: 7,
    energy: 7,
    reflections: '',
    gratitude: '',
    tags: [] // ADD THIS
  });

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Month folders state
  const [expandedMonths, setExpandedMonths] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState(new Set());

  // Modal state for month entries
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedMonthEntries, setSelectedMonthEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);

  // Custom delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // NEW FEATURES STATE
  const [aiInsight, setAiInsight] = useState<string>('');
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [lockedMonths, setLockedMonths] = useState<Set<string>>(new Set());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [monthToLock, setMonthToLock] = useState<string>('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDateEntries, setSelectedDateEntries] = useState<any[]>([]);
  const [passwordModalMode, setPasswordModalMode] = useState<'set' | 'enter'>('set');
  const [passwordError, setPasswordError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Voice recording state
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [activeField, setActiveField] = useState<'reflections' | 'gratitude' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [recognitionRef, setRecognitionRef] = useState<any>(null);
  const [currentTemplate, setCurrentTemplate] = useState<string>('');

  // Enhanced voice recognition state
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'listening' | 'processing' | 'reviewing'>('idle');
  const [lastSpokenTime, setLastSpokenTime] = useState<number>(Date.now());
  const [silenceTimeout, setSilenceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [transcriptBuffer, setTranscriptBuffer] = useState<string[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [showSilencePrompt, setShowSilencePrompt] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  // Utility functions for intelligent transcript processing
  const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const addIntelligentPunctuation = (text: string): string => {
    if (!text) return text;

    // Capitalize first letter of sentences
    let processed = text.replace(/(^\s*[a-z])|(\.\s+[a-z])|(\?\s+[a-z])|(!\s+[a-z])/g, (match) => {
      return match.toUpperCase();
    });

    // Add periods at the end if missing and text looks like a complete sentence
    if (processed.length > 10 && !processed.match(/[.!?]$/)) {
      processed += '.';
    }

    // Clean up extra spaces
    processed = processed.replace(/\s+/g, ' ').trim();

    return processed;
  };

  const processTranscriptSegment = (segment: string, isFinal: boolean): string => {
    if (!segment.trim()) return '';

    let processed = segment.trim();

    if (isFinal) {
      // Apply intelligent processing to final results
      processed = addIntelligentPunctuation(processed);
    }

    return processed;
  };

  const resetSilenceTimer = () => {
    // Temporarily disabled silence detection to prevent glitching
    // User can manually stop recording when ready
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      setSilenceTimeout(null);
    }
    setShowSilencePrompt(false);
    setLastSpokenTime(Date.now());
  };

  const clearSilenceTimer = () => {
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      setSilenceTimeout(null);
    }
    setShowSilencePrompt(false);
  };

  // Month folders functions
  const toggleMonth = (monthYear) => {
    setExpandedMonths(prev =>
      prev.includes(monthYear)
        ? prev.filter(m => m !== monthYear)
        : [...prev, monthYear]
    );
  };

  // Modal functions
  const openMonthModal = (monthYear, monthData) => {
    setSelectedMonth(monthYear);
    setSelectedMonthEntries(monthData.entries);
    setShowMonthModal(true);
  };

  // New password-protected month folder handler
  const handleMonthFolderClick = async (monthYear: string, monthData: any) => {
    try {
      const date = new Date(monthData.entries[0]?.date || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const hasPassword = await checkMonthHasPassword(monthKey);

      if (!hasPassword) {
        // First time - no password set yet
        setMonthToLock(monthKey);
        setSelectedMonth(monthYear);
        setSelectedMonthEntries(monthData.entries);
        setPasswordModalMode('set');
        setPasswordError('');
        setTempPassword('');
        setShowPasswordModal(true);
      } else {
        // Password already exists - require password to open
        setMonthToLock(monthKey);
        setSelectedMonth(monthYear);
        setSelectedMonthEntries(monthData.entries);
        setPasswordModalMode('enter');
        setPasswordError('');
        setTempPassword('');
        setShowPasswordModal(true);
      }
    } catch (error) {
      console.error('Error handling month folder click:', error);
      alert('Error checking password status. Please try again.');
    }
  };

  // Password handling functions
  const handleSetPassword = async () => {
    if (!tempPassword || tempPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters long');
      return;
    }

    try {
      await saveMonthPassword(monthToLock, tempPassword);

      // Update lock state
      setLockedMonths(prev => new Set([...prev, monthToLock]));

      // Show success and open month entries
      setShowPasswordModal(false);
      setTempPassword('');
      setPasswordError('');

      // Show the month entries after setting password
      setShowMonthModal(true);

      // Show success message
      alert('Password set successfully! Your month is now protected.');
    } catch (error) {
      console.error('Error setting password:', error);
      let errorMessage = 'Failed to set password. Please try again.';

      if (error.message?.includes('relation "month_locks" does not exist') ||
        error.message?.includes('Could not find the table') ||
        error.code === 'PGRST205') {
        errorMessage = 'Database table not found. Please run the SQL setup script in your Supabase SQL Editor.';
      } else if (error.message?.includes('permission denied')) {
        errorMessage = 'Permission denied. Please check RLS policies in Supabase.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setPasswordError(errorMessage);
    }
  };

  const handleVerifyPassword = async () => {
    if (!tempPassword) {
      setPasswordError('Please enter a password');
      return;
    }

    try {
      const isCorrect = await verifyMonthPassword(monthToLock, tempPassword);

      if (isCorrect) {
        // Correct password - show entries
        setShowPasswordModal(false);
        setTempPassword('');
        setPasswordError('');
        setShowMonthModal(true);
      } else {
        // Wrong password
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setPasswordError('Error verifying password. Please try again.');
    }
  };

  const closeMonthModal = () => {
    setShowMonthModal(false);
    setSelectedMonth(null);
    setSelectedMonthEntries([]);
    setEditingEntry(null);
    setViewingEntry(null);
  };

  const handleViewEntry = (entry) => {
    setViewingEntry(entry);
    setEditingEntry(null);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setViewingEntry(null);
  };

  const handleDeleteEntry = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return;

    try {
      setSaving(true);
      setError('');

      // Use secure storage for deletion
      const deleteResult = await SecureUserJournalStorage.deleteEntry(entryToDelete.id);

      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Failed to delete entry');
      }

      // Update local state
      const updatedEntries = entries.filter(e => e.id !== entryToDelete.id);
      setEntries(updatedEntries);

      // Update the modal entries
      setSelectedMonthEntries(prev => prev.filter(e => e.id !== entryToDelete.id));

      // Close modals if this was the last entry
      if (selectedMonthEntries.length <= 1) {
        closeMonthModal();
      }

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      console.log('✅ Entry deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete entry:', error);
      setError(`Failed to delete entry: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
      // Close delete modal and clear state
      setShowDeleteModal(false);
      setEntryToDelete(null);
      setEditingEntry(null);
      setViewingEntry(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setEntryToDelete(null);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    try {
      setSaving(true);
      setError('');

      // Use secure storage for saving
      const saveResult = await SecureUserJournalStorage.saveEntry(editingEntry);

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save entry');
      }

      // Update local state
      const updatedEntries = entries.map(e =>
        e.id === editingEntry.id ? editingEntry : e
      );
      setEntries(updatedEntries);

      // Update the modal entries
      setSelectedMonthEntries(prev =>
        prev.map(e => e.id === editingEntry.id ? editingEntry : e)
      );

      setEditingEntry(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      console.log('✅ Entry updated successfully');
    } catch (error) {
      console.error('❌ Failed to save entry:', error);
      setError(`Failed to save entry: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const organizeEntriesByMonth = () => {
    const monthGroups = {};
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthGroups[monthYear]) {
        monthGroups[monthYear] = {
          entries: [],
          avgMood: 0,
          totalEntries: 0
        };
      }
      monthGroups[monthYear].entries.push(entry);
      monthGroups[monthYear].totalEntries++;
    });

    // Calculate average mood for each month
    Object.keys(monthGroups).forEach(monthYear => {
      const monthEntries = monthGroups[monthYear].entries;
      const avgMood = monthEntries.length > 0
        ? (monthEntries.reduce((sum, e) => sum + (e.mood || 0), 0) / monthEntries.length).toFixed(1)
        : 0;
      monthGroups[monthYear].avgMood = avgMood;
    });

    return monthGroups;
  };

  const getMonthEmoji = (avgMood) => {
    const mood = parseFloat(avgMood);
    if (mood >= 7) return '😊';
    if (mood >= 6) return '🙂';
    if (mood >= 5) return '😐';
    if (mood >= 4) return '😔';
    return '😢';
  };

  // Auto-expand current month only - NO AUTO-GENERATION OF ENTRIES
  useEffect(() => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    setExpandedMonths([currentMonth]);
  }, []);

  // NEW FEATURES: Load AI Insight
  useEffect(() => {
    const loadAIInsight = async () => {
      try {
        const insight = await generateAIInsight();
        setAiInsight(insight || "Start journaling to unlock personalized insights about your patterns!");
      } catch (error) {
        console.error('Error loading AI insight:', error);
        setAiInsight("Keep writing to discover your patterns!");
      }
    };

    loadAIInsight();
  }, []);

  // NEW FEATURES: Load calendar data
  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth() + 1;
        const data = await getJournalEntriesForCalendar(year, month);
        setCalendarData(data);
      } catch (error) {
        console.error('Error loading calendar data:', error);
      }
    };

    loadCalendarData();
  }, [calendarMonth]);

  // NEW FEATURES: Online status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
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

  // Handle input changes
  const handleInputChange = (field, value) => {
    setJournalEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // NEW FEATURES: Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setError('');

      const user = await getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const uploadedPhotoUrl = await uploadJournalPhoto(file, user.id);

      if (uploadedPhotoUrl) {
        setPhotoUrl(uploadedPhotoUrl);
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

  // NEW FEATURES: Remove photo
  const handleRemovePhoto = async () => {
    if (photoUrl) {
      await deleteJournalPhoto(photoUrl);
    }
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // NEW FEATURES: Calendar helpers
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
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

  const getDayColor = (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEntries = entries.filter(entry => entry.date === dateStr);

    const hasEntries = dayEntries.length > 0;

    return hasEntries
      ? 'bg-green-600 text-white hover:bg-green-700'
      : 'bg-slate-200 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-slate-600/50';
  };

  const handleDayClick = async (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Filter entries for this date from the main entries array (which already contains user's entries)
    const dayEntries = entries.filter(entry => entry.date === dateStr);

    if (dayEntries.length > 0) {
      // Show entries for this date in a modal
      setSelectedDate(dateStr);
      setSelectedDateEntries(dayEntries);
      setShowDateModal(true);
    } else {
      // Optional: Show message or create new entry for this date
      alert(`No entries found for ${dateStr}. You can create a new entry for this date!`);
    }
  };

  // NEW FEATURES: Password lock functions
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

    const newLocked = new Set(lockedMonths);
    if (monthToLock) {
      newLocked.add(monthToLock);
      setLockedMonths(newLocked);
      localStorage.setItem('locked_months', JSON.stringify([...newLocked]));
    }
    setShowPasswordModal(false);
    setPassword('');
    setMonthToLock('');
    setError('');
  };

  // NEW FEATURES: Export PDF
  const exportMonthToPDF = async (monthYear: string, monthEntries: any[]) => {
    if (!monthEntries || monthEntries.length === 0) {
      alert('No entries found for this month');
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text(`📔 Journal - ${monthYear}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      monthEntries.forEach((entry, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text(`${entry.date} - ${entry.title || 'Untitled'}`, 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(12);
        pdf.text(`Mood: ${entry.mood || 'N/A'}/10 | Energy: ${entry.energy || 'N/A'}/10`, 20, yPosition);
        yPosition += 6;

        if (entry.reflections) {
          const lines = pdf.splitTextToSize(entry.reflections, pageWidth - 40);
          lines.forEach((line: string) => {
            pdf.text(line, 25, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }

        yPosition += 5;
      });

      const fileName = `Journal_${monthYear.replace(' ', '-').toLowerCase()}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF export error:', error);
      setError('Failed to export PDF');
    }
  };

  // Save entry
  const handleSaveEntry = async () => {
    if (!journalEntry.reflections && !journalEntry.gratitude) {
      setError('Please write at least a reflection or gratitude');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const newEntry: JournalEntry = {
        ...journalEntry,
        id: Date.now(),
        timestamp: new Date().toISOString()
      };

      // Use secure storage for saving
      const saveResult = await SecureUserJournalStorage.saveEntry(newEntry);

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save entry');
      }

      // Update local state
      setEntries(prev => [newEntry, ...prev]);

      // Reset form
      setJournalEntry({
        date: new Date().toLocaleDateString('en-CA'),
        title: '',
        mood: 7,
        energy: 7,
        reflections: '',
        gratitude: '',
        tags: []
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      console.log('✅ Journal entry saved successfully');
    } catch (error) {
      console.error('❌ Failed to save journal entry:', error);
      setError(`Failed to save entry: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Handle adding tags
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!journalEntry.tags.includes(newTag)) {
        setJournalEntry(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  // Handle removing tags
  const handleRemoveTag = (tagToRemove) => {
    setJournalEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Auto-expand textarea as user types
  const handleTextareaAutoExpand = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = textarea.scrollHeight + 'px'; // Set to content height
  };

  // Trigger auto-expand for all textareas
  useEffect(() => {
    const textareas = document.querySelectorAll('.journal-form-card textarea');
    textareas.forEach(textarea => {
      // Auto-expand on mount if there's content
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }, [journalEntry.reflections, journalEntry.gratitude]);

  // Handle quick prompts with auto-expand
  const handleQuickPrompt = (type) => {
    const prompts = {
      'no-template': {
        reflections: "",
        gratitude: "",
        isBlank: true
      },
      gratitude: {
        reflections: "Today I'm grateful for...\n\nThree things that made me smile:\n1. \n2. \n3. \n\nWhat brought me joy:",
        gratitude: "I appreciate...\n\nI'm thankful for...\n\nWhat made today special:"
      },
      reflection: {
        reflections: "Today was... (describe your day)\n\nWhat went well:\n\n\nWhat I learned:\n\n\nWhat challenged me:\n\n\nTomorrow I will:",
        gratitude: "I'm thankful for...\n\nMoments of gratitude today:"
      },
      goals: {
        reflections: "My goals for today:\n1. \n2. \n3. \n\nProgress on long-term goals:\n\n\nObstacles I faced:\n\n\nHow I overcame them:\n\n\nNext steps:",
        gratitude: "I'm proud of myself for...\n\nAchievements today:"
      }
    };

    const prompt = prompts[type];
    if (prompt) {
      setCurrentTemplate(type); // Track which template is active
      setJournalEntry(prev => ({
        ...prev,
        reflections: prompt.reflections || "",
        gratitude: prompt.gratitude || ""
      }));

      // Auto-expand and scroll to reflection field (but skip for blank template)
      if (!prompt.isBlank) {
        setTimeout(() => {
          const textareas = document.querySelectorAll('.journal-form-card textarea');
          textareas.forEach((textarea, index) => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
            textarea.classList.add('template-loaded');

            // Focus first textarea and scroll into view smoothly
            if (index === 0) {
              textarea.focus();
              textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Remove animation class after animation completes
            setTimeout(() => {
              textarea.classList.remove('template-loaded');
            }, 400);
          });
        }, 10);
      } else {
        // For blank template, just focus on the first textarea
        setTimeout(() => {
          const textareas = document.querySelectorAll('.journal-form-card textarea');
          if (textareas.length > 0) {
            textareas[0].focus();
            textareas[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 10);
      }
    }
  };

  // Enhanced voice recording functions
  const openVoiceModal = (field: 'reflections' | 'gratitude') => {
    // Reset all states but don't start recording
    setActiveField(field);
    setTranscript('');
    setInterimTranscript('');
    setVoiceError('');
    setIsListening(false);
    setIsProcessing(false);
    setRecordingStatus('idle');
    setShowVoiceModal(true);
    setTranscriptBuffer([]);
    setIsReviewMode(false);
    setEditedTranscript('');

    // Clear any existing timers
    if (debounceTimer) clearTimeout(debounceTimer);
    clearSilenceTimer();
  };

  const startVoiceRecordingInModal = () => {
    // Initialize enhanced speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure for professional-grade reliability
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      let lastFinalIndex = 0;
      let accumulatedText = '';

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        // Process all results from last index to current
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            // Process and accumulate final results
            const processedText = processTranscriptSegment(transcript, true);
            finalText += processedText + ' ';
            accumulatedText += processedText + ' ';
            lastFinalIndex = i;
          } else {
            // Handle interim results with debouncing
            interimText += transcript;
          }
        }

        // Update final transcript
        if (finalText) {
          setTranscript(accumulatedText.trim());

          // Add to buffer for redundancy
          setTranscriptBuffer(prev => [...prev, finalText.trim()]);
        }

        // Debounce interim updates to prevent UI flicker
        if (interimText && debounceTimer) {
          clearTimeout(debounceTimer);
        }

        const newDebounceTimer = setTimeout(() => {
          if (interimText) {
            setInterimTranscript(interimText.trim());
          }
        }, 150); // 150ms debounce for smooth updates

        setDebounceTimer(newDebounceTimer);
      };

      recognition.onerror = (event: any) => {
        console.error('Enhanced speech recognition error:', event.error);
        clearSilenceTimer();

        let errorMessage = 'Voice recognition encountered an issue';
        let shouldRetry = false;

        switch (event.error) {
          case 'not-allowed':
            errorMessage = '🎤 Microphone access denied. Please allow microphone access in your browser settings and try again.';
            break;
          case 'network':
            errorMessage = '🌐 Network connection issue. Please check your internet connection and try again.';
            shouldRetry = true;
            break;
          case 'no-speech':
            errorMessage = '🔇 No speech detected. Please speak clearly and try again.';
            shouldRetry = true;
            break;
          case 'audio-capture':
            errorMessage = '🎧 Microphone not found. Please check your audio devices and try again.';
            break;
          case 'aborted':
            errorMessage = '⏹️ Recording was stopped unexpectedly.';
            shouldRetry = true;
            break;
          case 'service-not-allowed':
            errorMessage = '🚫 Voice recognition service is not available. Please try refreshing the page.';
            break;
          default:
            errorMessage = `❌ Voice recognition error: ${event.error}`;
            shouldRetry = true;
        }

        setVoiceError(errorMessage);
        setIsListening(false);
        setRecordingStatus('idle');
        recognition.stop();

        // Auto-retry for recoverable errors
        if (shouldRetry && !voiceError) {
          setTimeout(() => {
            setVoiceError('');
            startVoiceRecordingInModal();
          }, 2000);
        }
      };

      recognition.onend = () => {
        clearSilenceTimer();
        setIsListening(false);

        // Auto-restart if it ended unexpectedly (and user didn't manually stop)
        if (recordingStatus === 'listening' && !voiceError) {
          console.log('Speech recognition ended unexpectedly, restarting...');
          setTimeout(() => {
            if (recordingStatus === 'listening') {
              recognition.start();
            }
          }, 100);
        } else {
          setRecordingStatus('idle');
        }
      };

      recognition.onstart = () => {
        console.log('Speech recognition started');
        resetSilenceTimer();
        setRecordingStatus('listening');
      };

      recognition.onspeechstart = () => {
        console.log('Speech detected - user is speaking');
      };

      recognition.onspeechend = () => {
        console.log('Speech paused - user may continue speaking');
      };

      setRecognitionRef(recognition);

      // Start recognition with error handling
      try {
        recognition.start();
        setIsListening(true);
        setRecordingStatus('listening');
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setVoiceError('Failed to start voice recognition. Please refresh the page and try again.');
        setIsListening(false);
        setRecordingStatus('idle');
      }
    } else {
      setVoiceError('🚫 Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari for the best experience.');
      setIsListening(false);
      setRecordingStatus('idle');
    }
  };

  const stopVoiceRecording = () => {
    clearSilenceTimer();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (recognitionRef) {
      recognitionRef.stop();
    }

    setIsListening(false);
    setIsProcessing(true);
    setRecordingStatus('processing');
    setInterimTranscript('');
    setShowSilencePrompt(false);

    // Simulate processing delay for UX polish
    setTimeout(() => {
      setIsProcessing(false);
      setRecordingStatus('reviewing');
      setIsReviewMode(true);
      setEditedTranscript(transcript);
    }, 800);
  };

  
  const retryRecording = () => {
    setVoiceError('');
    if (activeField) {
      openVoiceModal(activeField);
    }
  };

  const approveTranscript = () => {
    const finalTranscript = isReviewMode ? editedTranscript : transcript;

    if (activeField && finalTranscript.trim()) {
      setJournalEntry(prev => {
        const currentContent = prev[activeField] || '';
        let newContent = currentContent;

        // Define template patterns to replace
        const templatePatterns = {
          reflections: [
            "Today I'm grateful for...",
            "Three things that made me smile:",
            "1. ",
            "2. ",
            "3. ",
            "What brought me joy:",
            "Today was... (describe your day)",
            "What went well:",
            "What I learned:",
            "What challenged me:",
            "Tomorrow I will:",
            "My goals for today:",
            "Progress on long-term goals:",
            "Obstacles I faced:",
            "How I overcame them:",
            "Next steps:"
          ],
          gratitude: [
            "I appreciate...",
            "I'm thankful for...",
            "What made today special:",
            "I'm proud of myself for...",
            "Achievements today:",
            "Moments of gratitude today:"
          ]
        };

        // Get the relevant patterns for the active field
        const patterns = templatePatterns[activeField] || [];

        // Split content into lines and replace template lines
        const lines = currentContent.split('\n');
        const newLines = [];
        let transcriptInserted = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const isTemplateLine = patterns.some(pattern => line.includes(pattern)) ||
                                 (activeField === 'reflections' && line.match(/^\d+\.\s*$/)) ||
                                 (activeField === 'reflections' && line.match(/^Today was|^What went|^What I learned|^What challenged|^Tomorrow I will|^My goals|^Progress|^Obstacles|^How I|^Next steps/)) ||
                                 (activeField === 'gratitude' && line.match(/^I appreciate|^I'm thankful|^What made|^I'm proud|^Achievements|^Moments/));

          if (isTemplateLine && !transcriptInserted) {
            // Replace this template line with the transcript
            newLines.push(finalTranscript.trim());
            transcriptInserted = true;
          } else if (!isTemplateLine) {
            // Keep non-template lines as they are
            newLines.push(line);
          }
        }

        // If no template was found (user already replaced it), append the transcript
        if (!transcriptInserted) {
          newLines.push(finalTranscript.trim());
        }

        // Join the lines back together
        const finalContent = newLines.join('\n').replace(/\n{3,}/g, '\n\n');

        return {
          ...prev,
          [activeField]: finalContent
        };
      });
    }
    cancelVoiceRecording();
  };

  const cancelVoiceRecording = () => {
    clearSilenceTimer();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    setShowVoiceModal(false);
    setActiveField(null);
    setTranscript('');
    setInterimTranscript('');
    setVoiceError('');
    setIsListening(false);
    setIsProcessing(false);
    setRecordingStatus('idle');
    setTranscriptBuffer([]);
    setShowSilencePrompt(false);
    setIsReviewMode(false);
    setEditedTranscript('');

    if (recognitionRef) {
      recognitionRef.stop();
      setRecognitionRef(null);
    }
  };

  // Export month entries to Markdown
  const exportMonthToMD = (monthYear, monthEntries) => {
    if (!monthEntries || monthEntries.length === 0) {
      alert('No entries found for this month');
      return;
    }

    let markdown = `# 📔 Journal Entries - ${monthYear}\n\n`;
    markdown += `**Total Entries:** ${monthEntries.length}\n\n`;
    markdown += `---\n\n`;

    monthEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach((entry, index) => {
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });

        markdown += `## ${entry.title || 'Untitled'}\n\n`;
        markdown += `**Date:** ${formattedDate} at ${formattedTime}\n\n`;

        if (entry.mood !== undefined || entry.energy !== undefined) {
          markdown += `**Mood:** ${entry.mood || 'N/A'}/10 | **Energy:** ${entry.energy || 'N/A'}/10\n\n`;
        }

        if (entry.reflections) {
          markdown += `### 📝 Reflections\n\n${entry.reflections}\n\n`;
        }

        if (entry.gratitude) {
          markdown += `### 💖 Gratitude\n\n${entry.gratitude}\n\n`;
        }

        if (entry.tags && entry.tags.length > 0) {
          markdown += `**Tags:** ${entry.tags.join(', ')}\n\n`;
        }

        if (index < monthEntries.length - 1) {
          markdown += `---\n\n`;
        }
      });

    markdown += `\n---\n\n`;
    markdown += `*Exported from Productivity Hub on ${new Date().toLocaleDateString()}*\n`;

    // Create and download file
    const filename = `journal-${monthYear.replace(' ', '-').toLowerCase()}.md`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ Exported ${monthEntries.length} entries to ${filename}`);
    alert(`Exported ${monthEntries.length} entries for ${monthYear}`);
  };

  // Load entries on mount using secure storage
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        console.log('📔 Loading journal entries...');

        // Use secure storage to load entries
        const loadResult = await SecureUserJournalStorage.loadEntries();

        if (!loadResult.success) {
          throw new Error(loadResult.error || 'Failed to load entries');
        }

        const loadedEntries = loadResult.data || [];

        // If no entries found, try recovery
        if (loadedEntries.length === 0) {
          console.log('🔍 No entries found, attempting recovery...');
          const recoveryResult = JournalDataRecovery.recoverEntries();
          if (recoveryResult.success && recoveryResult.recoveredEntries.length > 0) {
            console.log('✅ Recovery successful:', recoveryResult.message);
            const recoveredEntries = recoveryResult.recoveredEntries;

            // Save recovered entries using secure storage
            for (const entry of recoveredEntries) {
              await SecureUserJournalStorage.saveEntry(entry);
            }

            setEntries(recoveredEntries);
            return;
          }
        }

        // Filter out only obvious dummy/test entries, preserve real user entries
        const cleanedEntries = loadedEntries.filter(entry => {
          // Remove entries that are clearly dummy data FIRST
          if (entry.title && (entry.title.includes('Dummy') || entry.title.includes('Test') || entry.title.includes('Sample'))) return false;
          if (entry.reflections && (entry.reflections.toLowerCase().includes('dummy') || entry.reflections.toLowerCase().includes('sample') || entry.reflections.toLowerCase().includes('test'))) return false;

          // Keep entries that have real user content
          if (entry.reflections && entry.reflections.trim().length > 20) return true;
          if (entry.gratitude && entry.gratitude.trim().length > 10) return true;
          if (entry.title && entry.title.trim().length > 0 && !entry.title.toLowerCase().includes('dummy') && !entry.title.toLowerCase().includes('test')) return true;

          // Keep entries that have IDs that look like real user entries (timestamps)
          if (entry.id && typeof entry.id === 'number' && entry.id > 1000000000000) return true;

          // Default: reject if we get here
          return false;
        });

        // If we filtered out entries, save the cleaned version
        if (cleanedEntries.length !== loadedEntries.length) {
          console.log(`🧹 Cleaned ${loadedEntries.length - cleanedEntries.length} invalid entries`);
          // Save each cleaned entry
          for (const entry of cleanedEntries) {
            await SecureUserJournalStorage.saveEntry(entry);
          }
        }

        // Load the entries into state
        setEntries(cleanedEntries);

        console.log(`✅ Loaded ${cleanedEntries.length} journal entries`);
        console.log('💡 Real user entries preserved and loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load journal entries:', error);
        setError(`Failed to load entries: ${error.message}`);
        setTimeout(() => setError(''), 5000);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  // Load locked months state from database
  useEffect(() => {
    const loadLockedMonths = async () => {
      try {
        const { data: { user } } = await getCurrentUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('month_locks')
          .select('month')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading locked months:', error);
          return;
        }

        const lockedSet = new Set(data?.map(lock => lock.month) || []);
        setLockedMonths(lockedSet);
      } catch (error) {
        console.error('Error loading locked months:', error);
      }
    };

    loadLockedMonths();
  }, []);

  // Calculate streak on mount
  useEffect(() => {
    if (entries.length === 0) return;

    // Calculate streak
    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedEntries.length > 0) {
      const lastEntryDate = new Date(sortedEntries[0].date).toDateString();

      if (lastEntryDate === today || lastEntryDate === yesterday) {
        currentStreak = 1;

        for (let i = 1; i < sortedEntries.length; i++) {
          const currentDate = new Date(sortedEntries[i].date);
          const prevDate = new Date(sortedEntries[i - 1].date);
          const diffDays = Math.floor((prevDate.getTime() - currentDate.getTime()) / 86400000);

          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    setStreak(currentStreak);
  }, [entries]);

  // Calculate mood trend
  useEffect(() => {
    if (entries.length >= 2) {
      const recent = entries.slice(0, Math.min(7, entries.length));
      const older = entries.slice(7, Math.min(14, entries.length));

      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, e) => sum + e.mood, 0) / recent.length;
        const olderAvg = older.reduce((sum, e) => sum + e.mood, 0) / older.length;
        const diff = ((recentAvg - olderAvg) / olderAvg) * 100;

        setMoodTrend({
          direction: diff >= 0 ? 'up' : 'down',
          percent: Math.abs(Math.round(diff))
        });
      }
    }
  }, [entries]);

  // Calculate stats
  const stats = {
    totalEntries: entries.length,
    thisMonth: entries.filter(e => {
      const entryDate = new Date(e.date);
      const now = new Date();
      return entryDate.getMonth() === now.getMonth() &&
             entryDate.getFullYear() === now.getFullYear();
    }).length,
    avgMood: entries.length > 0
      ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)
      : 'N/A'
  };

  // Export to MD
  const handleExportMD = () => {
    let markdown = '# Journal Entries\n\n';

    entries.forEach(entry => {
      markdown += `## ${entry.title || 'Untitled'}\n`;
      markdown += `**Date:** ${entry.date}\n`;
      markdown += `**Mood:** ${entry.mood}/10 | **Energy:** ${entry.energy}/10\n\n`;
      if (entry.reflections) markdown += `### Reflection\n${entry.reflections}\n\n`;
      if (entry.gratitude) markdown += `### Gratitude\n${entry.gratitude}\n\n`;
      markdown += '---\n\n';
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-export-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  
  return (
    <>
      <style>{`
        /* ========== JOURNAL PAGE - COMPACT & SOPHISTICATED ========== */

        .journal-page {
          padding: 28px 40px;
          max-width: 1300px;
          margin: 0 auto;
          min-height: 100vh;
          background: #FAFBFC;
        }

        .dark .journal-page {
          background: #0F172A;
        }

        /* ===== COMPACT HEADER ===== */
        .journal-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #E5E7EB;
        }

        .dark .journal-header {
          border-bottom-color: #334155;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title h1 {
          font-size: 24px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 2px;
          letter-spacing: -0.02em;
        }

        .dark .header-title h1 {
          color: #F8FAFC;
        }

        .header-title p {
          font-size: 14px;
          color: #64748B;
        }

        .dark .header-title p {
          color: #94A3B8;
        }

        .btn-export {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: white;
          color: #64748B;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-export:hover {
          background: #3B82F6;
          color: white;
          border-color: #3B82F6;
          box-shadow: 0 2px 8px rgba(59,130,246,0.25);
        }

        .dark .btn-export {
          background: #1E293B;
          border-color: #334155;
          color: #94A3B8;
        }

        .dark .btn-export:hover {
          background: #3B82F6;
          color: white;
        }

        .btn-test {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
          margin-right: 8px;
        }

        .btn-test:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
        }

        .btn-test:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-test .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 600ms linear infinite;
        }

        /* Success Toast */
        .success-toast {
          padding: 10px 16px;
          background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
          border: 1px solid #6EE7B7;
          border-radius: 8px;
          color: #065F46;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideDown 300ms ease;
        }

        .dark .success-toast {
          background: rgba(16,185,129,0.15);
          border-color: rgba(16,185,129,0.3);
          color: #6EE7B7;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Loading Toast */
        .loading-toast {
          padding: 10px 16px;
          background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
          border: 1px solid #93C5FD;
          border-radius: 8px;
          color: #1E40AF;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideDown 300ms ease;
        }

        .dark .loading-toast {
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.3);
          color: #93C5FD;
        }

        /* Error Toast */
        .error-toast {
          padding: 10px 16px;
          background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          color: #991B1B;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideDown 300ms ease;
        }

        .dark .error-toast {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.3);
          color: #FCA5A5;
        }

        /* ===== COMPACT CONTAINER ===== */
        .journal-container {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
        }

        /* ===== COMPACT FORM CARD ===== */
        .journal-form-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .dark .journal-form-card {
          background: #1E293B;
          border-color: #334155;
        }

        .form-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #F1F5F9;
        }

        .dark .form-title {
          color: #F8FAFC;
          border-bottom-color: #334155;
        }

        /* ===== COMPACT FORM FIELDS ===== */
        .form-field {
          margin-bottom: 14px;
        }

        .form-field.flex-grow {
          flex: 1;
        }

        .form-field label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark .form-field label {
          color: #94A3B8;
        }

        .form-field input[type="text"],
        .form-field input[type="date"],
        .form-field textarea {
          width: 100%;
          padding: 9px 12px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          color: #0F172A;
          transition: all 150ms ease;
          font-family: inherit;
        }

        .dark .form-field input[type="text"],
        .dark .form-field input[type="date"],
        .dark .form-field textarea {
          background: #0F172A;
          border-color: #334155;
          color: #F8FAFC;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: #3B82F6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }

        .dark .form-field input:focus,
        .dark .form-field textarea:focus {
          background: #1E293B;
        }

        .form-field textarea {
          resize: none;
          overflow: hidden;
          line-height: 1.5;
          min-height: 70px;
        }

        /* Auto-expand textarea styling */
        .auto-expand-textarea {
          resize: none;
          overflow: hidden;
          min-height: 80px;
          max-height: 600px;
          transition: height 150ms ease, border-color 200ms ease;
        }

        .auto-expand-textarea.template-loaded {
          animation: pulseExpand 400ms ease;
        }

        @keyframes pulseExpand {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59,130,246,0);
          }
          50% {
            transform: scale(1.01);
            box-shadow: 0 0 0 8px rgba(59,130,246,0.1);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59,130,246,0);
          }
        }

        .form-field input::placeholder,
        .form-field textarea::placeholder {
          color: #94A3B8;
        }

        /* Compact Form Row */
        .form-row-split {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        /* ===== COMPACT SLIDERS ===== */
        .sliders-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        /* Desktop: Two column sliders */
        @media (min-width: 768px) {
          .sliders-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        .slider-field {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 12px;
          transition: all 150ms ease;
        }

        .dark .slider-field {
          background: #0F172A;
          border-color: #334155;
        }

        .slider-field:hover {
          border-color: #3B82F6;
        }

        .slider-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .slider-header label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }

        .dark .slider-header label {
          color: #94A3B8;
        }

        .slider-value {
          font-size: 16px;
          font-weight: 700;
          color: #3B82F6;
        }

        .mood-slider,
        .energy-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
        }

        .mood-slider {
          background: linear-gradient(to right, #EF4444 0%, #F59E0B 50%, #10B981 100%);
        }

        .energy-slider {
          background: linear-gradient(to right, #94A3B8 0%, #3B82F6 50%, #8B5CF6 100%);
        }

        .mood-slider::-webkit-slider-thumb,
        .energy-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: 2px solid #3B82F6;
          transition: all 150ms ease;
        }

        .mood-slider::-webkit-slider-thumb:hover,
        .energy-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .mood-slider::-moz-range-thumb,
        .energy-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: 2px solid #3B82F6;
        }

        /* ===== COMPACT SAVE BUTTON ===== */
        .btn-save-entry {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 20px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
          margin-top: 8px;
        }

        .btn-save-entry:hover {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }

        .btn-save-entry:active {
          transform: translateY(0);
        }

        .btn-save-entry:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 600ms linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ===== COMPACT SIDEBAR ===== */
        .journal-sidebar {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .search-card,
        .stats-card,
        .recent-card {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        .dark .search-card,
        .dark .stats-card,
        .dark .recent-card {
          background: #1E293B;
          border-color: #334155;
        }

        /* Compact Search */
        .search-input {
          width: 100%;
          padding: 9px 12px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 13px;
          color: #0F172A;
          transition: all 150ms ease;
        }

        .dark .search-input {
          background: #0F172A;
          border-color: #334155;
          color: #F8FAFC;
        }

        .search-input:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }

        .search-input::placeholder {
          color: #94A3B8;
        }

        /* Compact Stats */
        .stats-card h3,
        .recent-card h3 {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-bottom: 8px;
          border-bottom: 1px solid #F1F5F9;
        }

        .dark .stats-card h3,
        .dark .recent-card h3 {
          color: #94A3B8;
          border-bottom-color: #334155;
        }

        .stats-grid {
          display: grid;
          gap: 10px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #F9FAFB;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
        }

        .dark .stat-item {
          background: #0F172A;
          border-color: #334155;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
        }

        .dark .stat-label {
          color: #94A3B8;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #3B82F6;
        }

        /* Compact Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 16px;
          text-align: center;
        }

        .empty-state svg {
          color: #CBD5E1;
          margin-bottom: 10px;
        }

        .dark .empty-state svg {
          color: #475569;
        }

        .empty-state p {
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          margin-bottom: 4px;
        }

        .dark .empty-state p {
          color: #94A3B8;
        }

        .empty-state span {
          font-size: 12px;
          color: #94A3B8;
        }

        /* Compact Entries */
        .entries-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .entry-item {
          padding: 10px 12px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .dark .entry-item {
          background: #0F172A;
          border-color: #334155;
        }

        .entry-item:hover {
          border-color: #3B82F6;
          transform: translateX(2px);
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .entry-title {
          font-size: 13px;
          font-weight: 600;
          color: #0F172A;
        }

        .dark .entry-title {
          color: #F8FAFC;
        }

        .entry-date {
          font-size: 10px;
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .entry-meta {
          display: flex;
          gap: 10px;
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
        }

        .dark .entry-meta {
          color: #94A3B8;
        }

        .entry-mood,
        .entry-energy {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Responsive */
        @media (max-width: 1100px) {
          .journal-container {
            grid-template-columns: 1fr;
          }

          .journal-sidebar {
            order: -1;
          }

          .sliders-row {
            grid-template-columns: 1fr;
          }

          .form-row-split {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .journal-page {
            padding: 20px 16px;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .journal-form-card {
            padding: 16px;
          }
        }

        /* ===== FEATURE 5: QUICK PROMPTS ===== */
        .quick-prompts {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #F9FAFB;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .dark .quick-prompts {
          background: #0F172A;
        }

        .prompts-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark .prompts-label {
          color: #94A3B8;
        }

        .prompt-btn {
          padding: 6px 12px;
          background: white;
          color: #64748B;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .prompt-btn:hover {
          background: #3B82F6;
          color: white;
          border-color: #3B82F6;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(59,130,246,0.2);
        }

        .dark .prompt-btn {
          background: #1E293B;
          border-color: #334155;
          color: #94A3B8;
        }

        .dark .prompt-btn:hover {
          background: #3B82F6;
          color: white;
        }

        /* ===== FEATURE 3: TAGS ===== */
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #EFF6FF;
          color: #1E40AF;
          border: 1px solid #BFDBFE;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .dark .tag {
          background: rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.3);
          color: #93C5FD;
        }

        .tag-remove {
          padding: 0;
          width: 16px;
          height: 16px;
          background: transparent;
          border: none;
          color: #1E40AF;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          line-height: 1;
        }

        .dark .tag-remove {
          color: #93C5FD;
        }

        .tag-remove:hover {
          background: rgba(30,64,175,0.1);
        }

        .dark .tag-remove:hover {
          background: rgba(59,130,246,0.2);
        }

        /* ===== FEATURE 1: WRITING STREAK ===== */
        .streak-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border-radius: 10px;
          margin-bottom: 16px;
          border: 1px solid #FCD34D;
        }

        .dark .streak-banner {
          background: linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.2) 100%);
          border-color: rgba(245,158,11,0.4);
        }

        .streak-flame {
          font-size: 32px;
          animation: flicker 2s infinite;
        }

        @keyframes flicker {
          0%, 100% { transform: scale(1) rotate(-5deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }

        .streak-info {
          display: flex;
          flex-direction: column;
        }

        .streak-number {
          font-size: 24px;
          font-weight: 800;
          color: #D97706;
          line-height: 1;
        }

        .dark .streak-number {
          color: #FCD34D;
        }

        .streak-label {
          font-size: 11px;
          font-weight: 600;
          color: #92400E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark .streak-label {
          color: #FCD34D;
        }

        /* ===== FEATURE 2: MOOD TREND ===== */
        .stat-with-trend {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .trend-indicator {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .trend-indicator.up {
          color: #10B981;
          background: rgba(16,185,129,0.1);
        }

        .trend-indicator.down {
          color: #EF4444;
          background: rgba(239,68,68,0.1);
        }

        /* ===== FEATURE 4: ENTRY PREVIEW & ACTIONS ===== */
        .entry-preview {
          font-size: 12px;
          color: #64748B;
          line-height: 1.4;
          margin: 6px 0;
        }

        .dark .entry-preview {
          color: #94A3B8;
        }

        .entry-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #F1F5F9;
        }

        .dark .entry-footer {
          border-top-color: #334155;
        }

        .entry-actions {
          display: flex;
          gap: 4px;
        }

        .btn-entry-action {
          padding: 4px 6px;
          background: transparent;
          border: none;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 150ms ease;
        }

        .btn-entry-action:hover {
          background: #F1F5F9;
          transform: scale(1.1);
        }

        .dark .btn-entry-action:hover {
          background: #334155;
        }

        /* ===== MODAL STYLES ===== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(6px);
        }

        .modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 800px;
          width: 90%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          animation: modalSlideIn 300ms ease;
        }

        .dark .modal {
          background: #1E293B;
          border: 1px solid #334155;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 16px;
          border-bottom: 1px solid #E5E7EB;
        }

        .dark .modal-header {
          border-bottom-color: #334155;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dark .modal-title {
          color: #F8FAFC;
        }

        .modal-close {
          background: transparent;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          transition: all 150ms ease;
        }

        .modal-close:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .dark .modal-close {
          color: #94A3B8;
        }

        .dark .modal-close:hover {
          background: #334155;
          color: #F8FAFC;
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .modal-entry-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .modal-entry-item {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 16px;
          transition: all 200ms ease;
          cursor: pointer;
        }

        .dark .modal-entry-item {
          background: #0F172A;
          border-color: #334155;
        }

        .modal-entry-item:hover {
          border-color: #3B82F6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .modal-entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .modal-entry-title {
          font-size: 16px;
          font-weight: 600;
          color: #0F172A;
        }

        .dark .modal-entry-title {
          color: #F8FAFC;
        }

        .modal-entry-date {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
        }

        .modal-entry-preview {
          font-size: 14px;
          color: #64748B;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .dark .modal-entry-preview {
          color: #94A3B8;
        }

        .modal-entry-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #E5E7EB;
        }

        .dark .modal-entry-footer {
          border-top-color: #334155;
        }

        .modal-entry-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #64748B;
        }

        .dark .modal-entry-meta {
          color: #94A3B8;
        }

        .modal-entry-actions {
          display: flex;
          gap: 4px;
        }

        .modal-btn-action {
          padding: 6px 10px;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 150ms ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .modal-btn-action:hover {
          background: #3B82F6;
          color: white;
          border-color: #3B82F6;
        }

        .dark .modal-btn-action {
          background: #1E293B;
          border-color: #334155;
          color: #94A3B8;
        }

        .dark .modal-btn-action:hover {
          background: #3B82F6;
          color: white;
        }

        /* ===== NOTION-STYLE PASSWORD MODAL ===== */
        .notion-modal {
          background: #f9fafb;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          max-width: 400px;
          width: 90%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: modalSlideIn 300ms ease;
          border: 1px solid #e5e7eb;
        }

        .dark .notion-modal {
          background: #1f2937;
          border-color: #374151;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }

        .notion-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .dark .notion-modal-header {
          border-bottom-color: #374151;
        }

        .notion-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dark .notion-modal-title {
          color: #f3f4f6;
        }

        .notion-lock-icon {
          font-size: 16px;
          color: #4b5563;
        }

        .dark .notion-lock-icon {
          color: #d1d5db;
        }

        .notion-modal-close {
          background: transparent;
          border: none;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 16px;
          transition: all 150ms ease;
        }

        .notion-modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .dark .notion-modal-close {
          color: #9ca3af;
        }

        .dark .notion-modal-close:hover {
          background: #374151;
          color: #d1d5db;
        }

        .notion-modal-content {
          padding: 20px 24px;
        }

        .notion-modal-description {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .dark .notion-modal-description {
          color: #9ca3af;
        }

        .notion-form-group {
          margin-bottom: 20px;
        }

        .notion-form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .dark .notion-form-label {
          color: #d1d5db;
        }

        .notion-form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: #ffffff;
          color: #111827;
          transition: all 150ms ease;
          outline: none;
        }

        .notion-form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }

        .notion-form-input.error {
          border-color: #ef4444;
        }

        .notion-form-input.error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
        }

        .dark .notion-form-input {
          background: #374151;
          border-color: #4b5563;
          color: #f3f4f6;
        }

        .dark .notion-form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        .notion-error-message {
          font-size: 13px;
          color: #ef4444;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .notion-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .notion-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms ease;
          border: none;
          outline: none;
        }

        .notion-btn-cancel {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .notion-btn-cancel:hover {
          background: #f9fafb;
          color: #374151;
          border-color: #9ca3af;
        }

        .dark .notion-btn-cancel {
          color: #9ca3af;
          border-color: #4b5563;
        }

        .dark .notion-btn-cancel:hover {
          background: #374151;
          color: #d1d5db;
          border-color: #6b7280;
        }

        .notion-btn-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
        }

        .notion-btn-primary:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
          transform: translateY(-1px);
        }

        .notion-btn-primary:active {
          transform: translateY(0);
        }

        .modal-btn-action.delete:hover {
          background: #EF4444;
          border-color: #EF4444;
        }

        /* Entry View/Edit Modal */
        .entry-modal {
          max-width: 600px;
        }

        .entry-form-field {
          margin-bottom: 16px;
        }

        .entry-form-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark .entry-form-field label {
          color: #94A3B8;
        }

        .entry-form-field input,
        .entry-form-field textarea {
          width: 100%;
          padding: 10px 14px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          color: #0F172A;
          font-family: inherit;
          transition: all 150ms ease;
        }

        .dark .entry-form-field input,
        .dark .entry-form-field textarea {
          background: #0F172A;
          border-color: #334155;
          color: #F8FAFC;
        }

        .entry-form-field input:focus,
        .entry-form-field textarea:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
        }

        .entry-form-field textarea {
          resize: vertical;
          min-height: 100px;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #E5E7EB;
        }

        .dark .modal-actions {
          border-top-color: #334155;
        }

        .btn-modal {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
          border: none;
        }

        .btn-modal-primary {
          background: #3B82F6;
          color: white;
        }

        .btn-modal-primary:hover {
          background: #2563EB;
        }

        .btn-modal-secondary {
          background: #F1F5F9;
          color: #64748B;
        }

        .btn-modal-secondary:hover {
          background: #E2E8F0;
        }

        .dark .btn-modal-secondary {
          background: #334155;
          color: #94A3B8;
        }

        .dark .btn-modal-secondary:hover {
          background: #475569;
        }

        .btn-modal-danger {
          background: #EF4444;
          color: white;
        }

        .btn-modal-danger:hover {
          background: #DC2626;
        }

        .month-folder-header {
          cursor: pointer;
          transition: all 200ms ease;
        }

        .month-folder-header:hover {
          background: #F1F5F9;
        }

        .dark .month-folder-header:hover {
          background: #334155;
        }

        /* Month Actions */
        .month-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        
        .month-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          transition: transform 200ms ease;
        }

        .month-folder-header:hover .month-toggle {
          transform: translateX(2px);
        }

        .dark .month-toggle {
          color: #94A3B8;
        }

        /* ===== CUSTOM DELETE MODAL STYLES ===== */
        .delete-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(8px);
          animation: fadeInBackdrop 300ms ease;
        }

        @keyframes fadeInBackdrop {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
        }

        .delete-modal {
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
          max-width: 420px;
          width: 90%;
          animation: modalSlideUpScale 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        .dark .delete-modal {
          background: #1E293B;
          border: 1px solid #334155;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        @keyframes modalSlideUpScale {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .delete-modal-header {
          padding: 32px 32px 24px;
          text-align: center;
          background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
          border-bottom: 1px solid #FCA5A5;
        }

        .dark .delete-modal-header {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.15) 100%);
          border-bottom-color: rgba(239, 68, 68, 0.3);
        }

        .delete-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #FCA5A5 0%, #F87171 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulseIcon 2s infinite;
        }

        .dark .delete-icon {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.4) 100%);
        }

        @keyframes pulseIcon {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        .delete-icon svg {
          width: 32px;
          height: 32px;
          color: #DC2626;
        }

        .dark .delete-icon svg {
          color: #F87171;
        }

        .delete-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #991B1B;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .dark .delete-modal-title {
          color: #FCA5A5;
        }

        .delete-modal-subtitle {
          font-size: 14px;
          color: #7F1D1D;
          line-height: 1.5;
          font-weight: 500;
        }

        .dark .delete-modal-subtitle {
          color: #FCA5A5;
          opacity: 0.8;
        }

        .delete-modal-body {
          padding: 24px 32px 32px;
          text-align: center;
        }

        .delete-entry-preview {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          text-align: left;
        }

        .dark .delete-entry-preview {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .delete-preview-title {
          font-size: 14px;
          font-weight: 600;
          color: #991B1B;
          margin-bottom: 4px;
        }

        .dark .delete-preview-title {
          color: #FCA5A5;
        }

        .delete-preview-date {
          font-size: 12px;
          color: #7F1D1D;
          opacity: 0.7;
        }

        .dark .delete-preview-date {
          color: #FCA5A5;
          opacity: 0.6;
        }

        .delete-modal-text {
          font-size: 14px;
          color: #6B7280;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .dark .delete-modal-text {
          color: #9CA3AF;
        }

        .delete-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn-cancel-delete {
          padding: 12px 24px;
          background: white;
          color: #6B7280;
          border: 2px solid #E5E7EB;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
          min-width: 120px;
        }

        .btn-cancel-delete:hover {
          background: #F9FAFB;
          border-color: #D1D5DB;
          color: #4B5563;
          transform: translateY(-1px);
        }

        .dark .btn-cancel-delete {
          background: #374151;
          border-color: #4B5563;
          color: #D1D5DB;
        }

        .dark .btn-cancel-delete:hover {
          background: #4B5563;
          border-color: #6B7280;
          color: #F3F4F6;
        }

        .btn-confirm-delete {
          padding: 12px 24px;
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
          min-width: 120px;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .btn-confirm-delete:hover {
          background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .btn-confirm-delete:active {
          transform: translateY(0);
        }
      `}</style>

      <div className="journal-page">

        {/* Header */}
        <div className="journal-header">
          <div className="header-content">
            <div className="header-title">
              <h1>📔 Personal Journal</h1>
              <p>Record your thoughts, feelings, and daily reflections</p>
            </div>
            <div className="header-actions">
                <button className="btn-export" onClick={handleExportMD}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export MD
              </button>
            </div>
          </div>
        </div>

        {/* Loading Message */}
        {loading && (
          <div className="loading-toast">
            <div className="spinner"></div>
            Loading journal entries...
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="success-toast">
            ✓ Journal entry saved successfully
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-toast">
            ⚠️ {error}
          </div>
        )}

        {/* Main Content */}
        <div className="journal-container">

          {/* Left Column - Form */}
          <div className="journal-main">

            <div className="journal-form-card">
              <h2 className="form-title">New Entry</h2>

              {/* NEW FEATURE: AI Insight Card */}
              <div className="ai-insight-card" style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                color: 'white',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{ fontSize: '24px' }}>🧠</div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>Your Weekly Insight</div>
                  <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: '1.4' }}>{aiInsight}</div>
                </div>
              </div>

              {/* FEATURE 5: Quick Prompts */}
              <div className="quick-prompts">
                <span className="prompts-label">Quick start:</span>
                <button className="prompt-btn" onClick={() => handleQuickPrompt('no-template')}>
                  📓 No Template
                </button>
                <button className="prompt-btn" onClick={() => handleQuickPrompt('gratitude')}>
                  🙏 Gratitude
                </button>
                <button className="prompt-btn" onClick={() => handleQuickPrompt('reflection')}>
                  💭 Daily Reflection
                </button>
                <button className="prompt-btn" onClick={() => handleQuickPrompt('goals')}>
                  🎯 Goals
                </button>
              </div>

              {/* Date & Title Row */}
              <div className="form-row-split">
                <div className="form-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={journalEntry.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div className="form-field flex-grow">
                  <label>Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="Give your entry a title..."
                    value={journalEntry.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
              </div>

              {/* NEW FEATURE: Photo Upload */}
              <div className="form-field">
                <label>📷 Add Photo (optional)</label>
                {photoUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={photoUrl}
                      alt="Photo preview"
                      style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <button
                      onClick={handleRemovePhoto}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
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
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        border: '2px dashed #D1D5DB',
                        borderRadius: '8px',
                        background: '#F9FAFB',
                        color: '#6B7280',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#8B5CF6';
                        e.target.style.background = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#D1D5DB';
                        e.target.style.background = '#F9FAFB';
                      }}
                    >
                      {uploadingPhoto ? 'Uploading...' : '📷 Choose Photo'}
                    </button>
                  </div>
                )}
              </div>

              {/* Mood & Energy Sliders */}
              <div className="sliders-row">
                <div className="slider-field">
                  <div className="slider-header">
                    <label>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                      Mood
                    </label>
                    <span className="slider-value">{journalEntry.mood}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={journalEntry.mood}
                    onChange={(e) => handleInputChange('mood', parseInt(e.target.value))}
                    className="mood-slider"
                  />
                </div>

                <div className="slider-field">
                  <div className="slider-header">
                    <label>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      Energy
                    </label>
                    <span className="slider-value">{journalEntry.energy}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={journalEntry.energy}
                    onChange={(e) => handleInputChange('energy', parseInt(e.target.value))}
                    className="energy-slider"
                  />
                </div>
              </div>

  
              {/* Reflection */}
              <div className="form-field">
                <label>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Reflections
                </label>
                <div className="mobile-textarea-wrapper">
                  <textarea
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                    className="auto-expand-textarea mobile-textarea"
                    rows="1"
                    placeholder="How was your day? What's on your mind?"
                    value={journalEntry.reflections}
                    onChange={(e) => {
                      handleInputChange('reflections', e.target.value);
                      handleTextareaAutoExpand(e);
                    }}
                    onInput={handleTextareaAutoExpand}
                  />
                  <button
                    type="button"
                    onClick={() => openVoiceModal('reflections')}
                    className={`mobile-voice-button ${activeField === 'reflections' && isListening ? 'recording' : ''}`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Gratitude */}
              <div className="form-field">
                <label>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  Gratitude
                </label>
                <div className="mobile-textarea-wrapper">
                  <textarea
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                    className="auto-expand-textarea mobile-textarea"
                    rows="1"
                    placeholder="What are you grateful for today?"
                    value={journalEntry.gratitude}
                    onChange={(e) => {
                      handleInputChange('gratitude', e.target.value);
                      handleTextareaAutoExpand(e);
                    }}
                    onInput={handleTextareaAutoExpand}
                  />
                  <button
                    type="button"
                    onClick={() => openVoiceModal('gratitude')}
                    className={`mobile-voice-button ${activeField === 'gratitude' && isListening ? 'recording' : ''}`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </button>
                </div>
              </div>

              {/* FEATURE 3: Tags */}
              <div className="form-field">
                <label>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Add tags (press Enter)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleAddTag}
                />
                {journalEntry.tags.length > 0 && (
                  <div className="tags-list">
                    {journalEntry.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                        <button className="tag-remove" onClick={() => handleRemoveTag(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                className="btn-save-entry"
                onClick={handleSaveEntry}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Save Entry
                  </>
                )}
              </button>

            </div>

          </div>

          {/* Right Column - Sidebar */}
          <div className="journal-sidebar">

            {/* Search */}
            <div className="search-card">
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Stats */}
            <div className="stats-card">
              <h3>Journal Stats</h3>

              {/* FEATURE 1: Writing Streak */}
              <div className="streak-banner">
                <div className="streak-flame">🔥</div>
                <div className="streak-info">
                  <span className="streak-number">{streak}</span>
                  <span className="streak-label">Day Streak</span>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Total Entries</span>
                  <span className="stat-value">{stats.totalEntries}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">This Month</span>
                  <span className="stat-value">{stats.thisMonth}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg Mood</span>
                  {/* FEATURE 2: Mood Trend */}
                  <div className="stat-with-trend">
                    <span className="stat-value">{stats.avgMood}</span>
                    {entries.length >= 2 && (
                      <span className={`trend-indicator ${moodTrend.direction}`}>
                        {moodTrend.direction === 'up' ? '↑' : '↓'} {moodTrend.percent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Month Folders */}
            <div className="recent-card">
              <h3>📔 Month Folders</h3>

              {entries.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <p>No entries yet</p>
                  <span>Start writing to see your entries organized in month folders</span>
                </div>
              ) : (
                <div className="month-folders">
                  {Object.entries(organizeEntriesByMonth())
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([monthYear, monthData]) => {
                      // Generate month key for locking
                      const date = new Date(monthData.entries[0]?.date || new Date());
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                      return (
                        <div key={monthYear} className="month-folder">
                        <div
                          className="month-header month-folder-header"
                          onClick={() => handleMonthFolderClick(monthYear, monthData)}
                        >
                          <div className="month-info">
                            <div className="month-details">
                              <div className="month-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {monthYear}
                                {/* Password Lock Icon - Visual Only */}
                                <span
                                  style={{
                                    fontSize: '14px',
                                    opacity: 0.7
                                  }}
                                  title={lockedMonths.has(monthKey) ? "Month is password protected" : "Month is not password protected"}
                                >
                                  {lockedMonths.has(monthKey) ? '🔒' : '🔓'}
                                </span>
                              </div>
                              <div className="month-stats">
                                {monthData.totalEntries} entries
                              </div>
                            </div>
                          </div>
                          <div className="month-actions">
                            <div className="month-toggle">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* NEW FEATURE: Calendar Heat Map */}
            <div className="calendar-heatmap-card bg-white dark:bg-slate-800/40 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-xl shadow-xl p-4 mt-4 overflow-hidden max-w-sm">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white m-0">
                  📅 {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                    className="px-2 py-1 border border-gray-200 dark:border-white/20 rounded-md bg-white dark:bg-slate-700/40 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer text-xs transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setSelectedMonth(new Date())}
                    className="px-2 py-1 border border-gray-200 dark:border-white/20 rounded-md bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer text-xs transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                    className="px-2 py-1 border border-gray-200 dark:border-white/20 rounded-md bg-white dark:bg-slate-700/40 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer text-xs transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Week days */}
              <div className="grid grid-cols-7 gap-px mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-px">
                {getCalendarDays().map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  return (
                    <div
                      key={day}
                      className={`${getDayColor(day)} aspect-square border-0 rounded-md text-xs font-medium flex items-center justify-center`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              {/* Simplified Legend */}
              <div className="flex items-center justify-center gap-4 text-xs mt-3 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700/50 border border-gray-300 dark:border-white/20"></div>
                  <span>No entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-600"></div>
                  <span>Has entry</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* NEW FEATURE: Offline Status Indicator */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#6B7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          {isOnline ? (
            <>
              <span style={{ color: '#10B981' }}>✅</span>
              <span>{syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}</span>
            </>
          ) : (
            <>
              <span style={{ color: '#F59E0B' }}>📶</span>
              <span>Offline - will sync when online</span>
            </>
          )}
        </div>

        {/* Month Entries Modal */}
        {showMonthModal && (
          <div className="modal-overlay" onClick={closeMonthModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {selectedMonth}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportMonthToMD(selectedMonth, selectedMonthEntries)}
                    className="px-3 py-2 bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-600 text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
                    title={`Export ${selectedMonth} entries as Markdown`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export MD
                  </button>
                  {/* NEW FEATURE: Export PDF Button */}
                  <button
                    onClick={() => exportMonthToPDF(selectedMonth, selectedMonthEntries)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                    title={`Export ${selectedMonth} entries as PDF`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Export PDF
                  </button>
                  <button className="modal-close" onClick={closeMonthModal}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="modal-content">
                <div className="modal-entry-list">
                  {selectedMonthEntries
                    .filter(e =>
                      !searchQuery ||
                      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.reflections?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(entry => (
                      <div key={entry.id} className="modal-entry-item">
                        <div className="modal-entry-header">
                          <span className="modal-entry-title">{entry.title || 'Untitled'}</span>
                          <span className="modal-entry-date">{new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                        {entry.reflections && (
                          <p className="modal-entry-preview">
                            {entry.reflections.substring(0, 120)}{entry.reflections.length > 120 ? '...' : ''}
                          </p>
                        )}
                        <div className="modal-entry-footer">
                          <div className="modal-entry-meta">
                            <span>😊 {entry.mood}</span>
                            <span>⚡ {entry.energy}</span>
                          </div>
                          <div className="modal-entry-actions">
                            <button
                              className="modal-btn-action"
                              onClick={() => handleViewEntry(entry)}
                            >
                              👁️ View
                            </button>
                            <button
                              className="modal-btn-action"
                              onClick={() => handleEditEntry(entry)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="modal-btn-action delete"
                              onClick={() => handleDeleteEntry(entry)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Entries Modal */}
        {showDateModal && (
          <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  📅 Entries for {selectedDate}
                </h2>
                <button className="modal-close" onClick={() => setShowDateModal(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="modal-content">
                {selectedDateEntries.length > 0 ? (
                  <div className="modal-entries-list">
                    {selectedDateEntries.map((entry) => (
                      <div key={entry.id} className="modal-entry-item">
                        <div className="modal-entry-header">
                          <span className="modal-entry-title">{entry.title || 'Untitled'}</span>
                          <span className="modal-entry-date">{entry.date}</span>
                        </div>
                        {entry.reflections && (
                          <p className="modal-entry-preview">
                            {entry.reflections.substring(0, 150)}{entry.reflections.length > 150 ? '...' : ''}
                          </p>
                        )}
                        <div className="modal-entry-footer">
                          <div className="modal-entry-meta">
                            <span>😊 {entry.mood}</span>
                            <span>⚡ {entry.energy}</span>
                          </div>
                          <div className="modal-entry-actions">
                            <button
                              className="modal-btn-action"
                              onClick={() => {
                                handleViewEntry(entry);
                                setShowDateModal(false);
                              }}
                            >
                              👁️ View
                            </button>
                            <button
                              className="modal-btn-action"
                              onClick={() => {
                                handleEditEntry(entry);
                                setShowDateModal(false);
                              }}
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No entries found for this date.</p>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setShowDateModal(false);
                        // Optionally set the form date to this date
                        setJournalEntry(prev => ({ ...prev, date: selectedDate }));
                      }}
                    >
                      Create Entry for This Date
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Entry View/Edit Modal */}
        {(viewingEntry || editingEntry) && (
          <div className="modal-overlay" onClick={() => setViewingEntry(null) || setEditingEntry(null)}>
            <div className={`modal entry-modal`} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingEntry ? '✏️ Edit Entry' : '👁️ View Entry'}
                </h2>
                <button className="modal-close" onClick={() => setViewingEntry(null) || setEditingEntry(null)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="modal-content">
                {(editingEntry || viewingEntry) && (
                  <>
                    <div className="entry-form-field">
                      <label>Title</label>
                      <input
                        type="text"
                        value={(editingEntry || viewingEntry).title || ''}
                        onChange={(e) => editingEntry && setEditingEntry({...editingEntry, title: e.target.value})}
                        disabled={!editingEntry}
                        placeholder="Entry title..."
                      />
                    </div>

                    <div className="entry-form-field">
                      <label>Date</label>
                      <input
                        type="date"
                        value={(editingEntry || viewingEntry).date || ''}
                        onChange={(e) => editingEntry && setEditingEntry({...editingEntry, date: e.target.value})}
                        disabled={!editingEntry}
                      />
                    </div>

                    <div className="entry-form-field">
                      <label>Mood ({(editingEntry || viewingEntry).mood}/10)</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={(editingEntry || viewingEntry).mood || 5}
                        onChange={(e) => editingEntry && setEditingEntry({...editingEntry, mood: parseInt(e.target.value)})}
                        disabled={!editingEntry}
                      />
                    </div>

                    <div className="entry-form-field">
                      <label>Energy ({(editingEntry || viewingEntry).energy}/10)</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={(editingEntry || viewingEntry).energy || 5}
                        onChange={(e) => editingEntry && setEditingEntry({...editingEntry, energy: parseInt(e.target.value)})}
                        disabled={!editingEntry}
                      />
                    </div>

                    <div className="entry-form-field">
                      <label>Reflections</label>
                      <textarea
                        value={(editingEntry || viewingEntry).reflections || ''}
                        onChange={(e) => editingEntry && setEditingEntry({...editingEntry, reflections: e.target.value})}
                        disabled={!editingEntry}
                        placeholder="How was your day? What's on your mind?"
                        rows={5}
                      />
                    </div>

                    <div className="entry-form-field">
                      <label>Gratitude</label>
                      <textarea
                        value={(editingEntry || viewingEntry).gratitude || ''}
                        onChange={(e) => editingEntry && setEditingEntry({...editingEntry, gratitude: e.target.value})}
                        disabled={!editingEntry}
                        placeholder="What are you grateful for?"
                        rows={4}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn-modal btn-modal-secondary" onClick={() => setViewingEntry(null) || setEditingEntry(null)}>
                  Close
                </button>
                {editingEntry && (
                  <>
                    <button
                      className="btn-modal btn-modal-danger"
                      onClick={() => {
                        handleDeleteEntry(editingEntry);
                        setEditingEntry(null);
                      }}
                    >
                      Delete
                    </button>
                    <button className="btn-modal btn-modal-primary" onClick={handleSaveEdit}>
                      Save Changes
                    </button>
                  </>
                )}
                {viewingEntry && (
                  <button
                    className="btn-modal btn-modal-primary"
                    onClick={() => handleEditEntry(viewingEntry)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {showDeleteModal && entryToDelete && (
          <div className="delete-modal-overlay" onClick={cancelDelete}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header">
                <div className="delete-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                    <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </div>
                <h3 className="delete-modal-title">
                  Are you sure you want to delete this entry?
                </h3>
                <p className="delete-modal-subtitle">
                  This action cannot be undone. Your journal entry will be permanently removed.
                </p>
              </div>

              <div className="delete-modal-body">
                <div className="delete-entry-preview">
                  <div className="delete-preview-title">{entryToDelete.title || 'Untitled Entry'}</div>
                  <div className="delete-preview-date">
                    {new Date(entryToDelete.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <p className="delete-modal-text">
                  Take a moment to reflect. This entry contains your thoughts and memories from this day.
                  Once deleted, it cannot be recovered.
                </p>

                <div className="delete-modal-actions">
                  <button
                    className="btn-cancel-delete"
                    onClick={cancelDelete}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-confirm-delete"
                    onClick={confirmDeleteEntry}
                  >
                    Delete Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW FEATURE: Compact Notion-Style Password Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="notion-modal" onClick={(e) => e.stopPropagation()}>
              {/* Compact Header */}
              <div className="notion-modal-header">
                <div className="notion-modal-title">
                  <span className="notion-lock-icon">🔒</span>
                  <span>{passwordModalMode === 'set' ? 'Set Password' : 'Enter Password'}</span>
                </div>
                <button className="notion-modal-close" onClick={() => setShowPasswordModal(false)}>
                  ✕
                </button>
              </div>

              {/* Compact Content */}
              <div className="notion-modal-content">
                <p className="notion-modal-description">
                  {passwordModalMode === 'set'
                    ? `Create a password for ${selectedMonth} journal entries.`
                    : `Enter password to view ${selectedMonth} journal entries.`
                  }
                </p>

                <div className="notion-form-group">
                  <label htmlFor="passwordInput" className="notion-form-label">Password</label>
                  <input
                    id="passwordInput"
                    type="password"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder={passwordModalMode === 'set' ? 'Create a strong password' : 'Enter your password'}
                    className={`notion-form-input ${passwordError ? 'error' : ''}`}
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        passwordModalMode === 'set' ? handleSetPassword() : handleVerifyPassword();
                      }
                    }}
                  />
                </div>

                {passwordError && (
                  <div className="notion-error-message">
                    {passwordError}
                  </div>
                )}

                <div className="notion-modal-actions">
                  <button
                    className="notion-btn notion-btn-cancel"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setTempPassword('');
                      setPasswordError('');
                      setMonthToLock('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="notion-btn notion-btn-primary"
                    onClick={passwordModalMode === 'set' ? handleSetPassword : handleVerifyPassword}
                  >
                    {passwordModalMode === 'set' ? 'Set Password' : 'Unlock Month'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Voice Recording Modal with Template Preview - Mobile Responsive */}
        {showVoiceModal && (
          <div className="mobile-modal-overlay">
            <div className="mobile-voice-modal">
              {/* Mobile Handle */}
              <div className="mobile-modal-handle" />

              {/* Modal Header */}
              <div className="mobile-modal-header">
                <h2 className="mobile-modal-title">
                  🎙️ Voice Journal – {activeField === 'reflections' ? 'Reflections' : 'Gratitude'}
                </h2>
                <p className="mobile-modal-subtitle">
                  {isListening ? 'Speak clearly. Your words will appear below.' : 'Click "Start Recording" to begin.'}
                </p>
              </div>
              {/* Template Preview Section */}
              {currentTemplate && currentTemplate !== 'no-template' && (
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '1.5rem',
                  animation: 'fadeIn 0.5s ease-out'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <span style={{
                      fontSize: '1.5rem',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}>
                      {currentTemplate === 'gratitude' ? '🙏' :
                       currentTemplate === 'reflection' ? '💭' :
                       currentTemplate === 'goals' ? '🎯' : '📝'}
                    </span>
                    <div>
                      <h3 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#1e293b'
                      }}>
                        {currentTemplate === 'gratitude' ? 'Gratitude Journal' :
                         currentTemplate === 'reflection' ? 'Daily Reflection' :
                         currentTemplate === 'goals' ? 'Goals & Progress' : 'Journal Entry'}
                      </h3>
                      <p style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '0.85rem',
                        color: '#64748b'
                      }}>
                        Recording for: {activeField === 'reflections' ? 'Reflections' : 'Gratitude'}
                      </p>
                    </div>
                  </div>

                  {/* Template Fields Preview */}
                  <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#475569',
                      marginBottom: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Template Guide:
                    </div>
                    <div style={{
                      display: 'grid',
                      gap: '0.4rem',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      lineHeight: '1.3'
                    }}>
                      {currentTemplate === 'gratitude' && (
                        <>
                          <div style={{ fontSize: '0.7rem' }}>• Today I'm grateful for...</div>
                          <div style={{ fontSize: '0.7rem' }}>• Three things that made me smile</div>
                          <div style={{ fontSize: '0.7rem' }}>• What brought me joy</div>
                          <div style={{ fontSize: '0.7rem' }}>• What I'm thankful for</div>
                        </>
                      )}
                      {currentTemplate === 'reflection' && (
                        <>
                          <div style={{ fontSize: '0.7rem' }}>• Today was... (describe your day)</div>
                          <div style={{ fontSize: '0.7rem' }}>• What went well</div>
                          <div style={{ fontSize: '0.7rem' }}>• What I learned</div>
                          <div style={{ fontSize: '0.7rem' }}>• What challenged me</div>
                          <div style={{ fontSize: '0.7rem' }}>• Tomorrow I will...</div>
                        </>
                      )}
                      {currentTemplate === 'goals' && (
                        <>
                          <div style={{ fontSize: '0.7rem' }}>• My goals for today</div>
                          <div style={{ fontSize: '0.7rem' }}>• Progress on long-term goals</div>
                          <div style={{ fontSize: '0.7rem' }}>• Obstacles I faced</div>
                          <div style={{ fontSize: '0.7rem' }}>• How I overcame them</div>
                          <div style={{ fontSize: '0.7rem' }}>• Next steps</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Divider line */}
              {currentTemplate && currentTemplate !== 'no-template' && (
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, #e5e7eb, transparent)',
                  margin: '0 1.5rem'
                }} />
              )}

              {/* Main Content Area */}
              <div style={{ padding: currentTemplate && currentTemplate !== 'no-template' ? '1.5rem 1.5rem 1rem 1.5rem' : '1.5rem', flex: 1, overflow: 'auto' }}>
                <h2 style={{
                  margin: currentTemplate && currentTemplate !== 'no-template' ? '0 0 1rem 0' : '0 0 1.5rem 0',
                  color: '#1f2937',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  textAlign: 'center'
                }}>
                  🎙️ Voice Journal – {activeField === 'reflections' ? 'Reflections' : 'Gratitude'}
                </h2>

                {voiceError && (
                  <div style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    border: '1px solid #fecaca'
                  }}>
                    {voiceError}
                  </div>
                )}

                {/* Recording Status */}
                <div style={{
                  background: isListening ? '#fee2e2' : '#f9fafb',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  border: isListening ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        color: isListening ? '#ef4444' : '#6b7280',
                        animation: isListening ? 'pulse 1.5s infinite' : 'none'
                      }}
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: isListening ? '#dc2626' : '#374151'
                    }}>
                      {isListening ? 'Listening...' : 'Ready to Record'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: isListening ? '#ef4444' : '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    {isListening
                      ? 'Speak clearly. Your words will appear below.'
                      : 'Click "Start Recording" to begin.'}
                  </div>
                </div>

                {/* Enhanced Transcript Area */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {isProcessing ? (
                      <>
                        <span style={{
                          display: 'inline-block',
                          animation: 'pulse 1.5s infinite'
                        }}>✨</span>
                        Processing transcript...
                      </>
                    ) : isReviewMode ? (
                      <>
                        <span>✅</span>
                        Review & Edit Transcript
                      </>
                    ) : isListening ? (
                      <>
                        <span style={{
                          display: 'inline-block',
                          animation: 'pulse 1.5s infinite',
                          color: '#ef4444'
                        }}>●</span>
                        Live Recording
                      </>
                    ) : (
                      <>
                        <span>📝</span>
                        Transcript
                      </>
                    )}
                  </div>

                  {!isReviewMode ? (
                    <div style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '1rem',
                      border: isListening ? '2px solid #ef4444' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      background: isListening ? '#fef2f2' : 'white',
                      transition: 'all 0.3s ease',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {/* Final transcript */}
                      <div style={{
                        color: '#1f2937',
                        animation: transcript ? 'fadeIn 0.3s ease-out' : 'none'
                      }}>
                        {transcript || (
                          <span style={{ color: '#9ca3af' }}>
                            {isListening ? 'Listening... Speak clearly and naturally.' : 'Click "Start Recording" to begin speaking...'}
                          </span>
                        )}
                      </div>

                      {/* Interim transcript with different styling */}
                      {interimTranscript && (
                        <div style={{
                          color: '#6b7280',
                          fontStyle: 'italic',
                          marginTop: '0.25rem',
                          opacity: 0.8,
                          animation: 'fadeIn 0.2s ease-out'
                        }}>
                          {interimTranscript}
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      style={{
                        width: '100%',
                        height: '150px',
                        padding: '1rem',
                        border: '2px solid #10b981',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        background: '#f0fdf4',
                        transition: 'all 0.3s ease',
                        lineHeight: '1.6'
                      }}
                      placeholder="Review and edit your transcript before saving..."
                      value={editedTranscript}
                      onChange={(e) => setEditedTranscript(e.target.value)}
                    />
                  )}
                </div>

                
                {/* Enhanced Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  position: 'relative'
                }}>
                  {!voiceError ? (
                    <>
                      {!isReviewMode ? (
                        <>
                          <button
                            onClick={
                              isListening
                                ? stopVoiceRecording
                                : startVoiceRecordingInModal
                            }
                            disabled={isProcessing}
                            style={{
                              flex: isListening ? 2 : 1,
                              padding: '1rem',
                              background: isProcessing
                                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                                : isListening
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '1rem',
                              fontWeight: '700',
                              cursor: isProcessing ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: isListening
                                ? '0 4px 12px rgba(239, 68, 68, 0.4)'
                                : '0 4px 12px rgba(59, 130, 246, 0.3)',
                              opacity: isProcessing ? 0.7 : 1
                            }}
                          >
                            {isProcessing ? (
                              <>
                                <span style={{
                                  display: 'inline-block',
                                  animation: 'pulse 1.5s infinite',
                                  marginRight: '0.5rem'
                                }}>⚡</span>
                                Processing...
                              </>
                            ) : isListening ? (
                              <>
                                <span style={{
                                  display: 'inline-block',
                                  animation: 'pulse 1.5s infinite',
                                  marginRight: '0.5rem'
                                }}>●</span>
                                Stop Recording
                              </>
                            ) : (
                              <>
                                🎤 Start Recording
                              </>
                            )}
                          </button>

                          {transcript.trim() && (
                            <button
                              onClick={() => {
                                setIsReviewMode(true);
                                setEditedTranscript(transcript);
                              }}
                              style={{
                                flex: 1,
                                padding: '1rem',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                              }}
                            >
                              ✏️ Review & Approve
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={approveTranscript}
                          style={{
                            flex: 2,
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          ✅ Save Transcript
                        </button>
                      )}

                      {isReviewMode && (
                        <button
                          onClick={() => setIsReviewMode(false)}
                          style={{
                            flex: 1,
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          ↩️ Back
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={retryRecording}
                      style={{
                        flex: 1,
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      🔄 Try Again
                    </button>
                  )}

                  <button
                    onClick={cancelVoiceRecording}
                    style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isReviewMode ? '❌ Cancel' : '❌ Close'}
                  </button>
                </div>
              </div>

              {/* CSS Animations */}
              <style>{`
                /* Voice Recording Modal - Mobile First */
                .mobile-modal-overlay {
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  right: 0 !important;
                  bottom: 0 !important;
                  background: rgba(0, 0, 0, 0.6) !important;
                  display: flex !important;
                  align-items: flex-end !important;
                  justify-content: center !important;
                  z-index: 10000 !important;
                  backdrop-filter: blur(4px) !important;
                  padding: 0 !important;
                  box-sizing: border-box !important;
                }

                .mobile-voice-modal {
                  background: white !important;
                  border-radius: 20px 20px 0 0 !important;
                  max-width: 100% !important;
                  width: 100% !important;
                  max-height: 85vh !important;
                  min-height: 300px !important;
                  overflow-y: auto !important;
                  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.3) !important;
                  animation: slideUpMobile 0.4s cubic-bezier(0.32, 0.72, 0, 1) !important;
                  position: relative !important;
                  display: flex !important;
                  flex-direction: column !important;
                  -webkit-overflow-scrolling: touch !important;
                }

                /* Tablet and Desktop - Centered Modal */
                @media (min-width: 768px) {
                  .mobile-modal-overlay {
                    align-items: center !important;
                    padding: 1rem !important;
                  }

                  .mobile-voice-modal {
                    border-radius: 16px !important;
                    max-width: 600px !important;
                    width: 100% !important;
                    max-height: 90vh !important;
                    min-height: 400px !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                    animation: slideUp 0.3s ease-out !important;
                  }
                }

                /* Large Desktop - Better Centering */
                @media (min-width: 1024px) {
                  .mobile-voice-modal {
                    max-width: 700px !important;
                    min-height: 450px !important;
                  }
                }

                /* Small Mobile Phones */
                @media (max-width: 380px) {
                  .mobile-voice-modal {
                    min-height: 250px !important;
                    max-height: 80vh !important;
                  }

                  .mobile-modal-header {
                    padding: 1rem !important;
                  }

                  .mobile-modal-title {
                    font-size: 1.1rem !important;
                  }

                  .mobile-modal-subtitle {
                    font-size: 0.85rem !important;
                  }
                }

                .dark .mobile-voice-modal {
                  background: #1e293b !important;
                  color: #f8fafc !important;
                }

                .mobile-modal-handle {
                  width: 50px !important;
                  height: 5px !important;
                  background: #d1d5db !important;
                  border-radius: 3px !important;
                  margin: 12px auto 8px auto !important;
                  flex-shrink: 0 !important;
                  touch-action: none !important;
                  cursor: grab !important;
                  transition: background 0.2s ease !important;
                }

                .mobile-modal-handle:hover {
                  background: #9ca3af !important;
                }

                .mobile-modal-handle:active {
                  background: #6b7280 !important;
                  cursor: grabbing !important;
                }

                .dark .mobile-modal-handle {
                  background: #475569 !important;
                }

                .dark .mobile-modal-handle:hover {
                  background: #64748b !important;
                }

                .dark .mobile-modal-handle:active {
                  background: #94a3b8 !important;
                }

                .mobile-modal-header {
                  padding: 1.5rem !important;
                  border-bottom: 1px solid #e5e7eb !important;
                  flex-shrink: 0 !important;
                }

                .dark .mobile-modal-header {
                  border-bottom-color: #475569 !important;
                }

                .mobile-modal-title {
                  margin: 0 0 0.5rem 0 !important;
                  font-size: 1.25rem !important;
                  font-weight: 700 !important;
                  color: #1f2937 !important;
                }

                .dark .mobile-modal-title {
                  color: #f8fafc !important;
                }

                .mobile-modal-subtitle {
                  margin: 0 !important;
                  font-size: 0.9rem !important;
                  color: #6b7280 !important;
                  line-height: 1.4 !important;
                }

                .dark .mobile-modal-subtitle {
                  color: #94a3b8 !important;
                }

                @keyframes pulse {
                  0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                  }
                  50% {
                    transform: scale(1.1);
                    opacity: 0.8;
                  }
                }

                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }

                @keyframes slideUpMobile {
                  from {
                    opacity: 0;
                    transform: translateY(100%) scale(1);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }

                @keyframes slideUp {
                  from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }
              `}</style>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default JournalSimple;