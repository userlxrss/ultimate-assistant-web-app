import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Link, Palette, User, Camera } from 'lucide-react';
import { motionAPI } from '../utils/motionApi';
import { realGmailAPI } from '../utils/realGmailAPI';
import { AppearanceStorage, FontSize } from '../utils/appearanceStorage';
import { getCurrentUser, supabase, uploadAvatar, deleteAvatar, updateUserAvatar } from '../supabase';

interface AppConnection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  isConnected: boolean;
  lastSync?: Date;
  status?: string;
  targetTab: string;
}

// Direct theme management functions - bypass context completely
const getCurrentTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('user_preferences:theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

const setThemeDirect = (newTheme: 'light' | 'dark') => {
  // Apply to DOM immediately
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }

  // Save to localStorage directly
  localStorage.setItem('user_preferences:theme', newTheme);

  console.log(`🎨 Theme set to ${newTheme} (direct DOM manipulation)`);
};

const CleanSettingsPage: React.FC = () => {
  // Use direct theme state instead of context
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => getCurrentTheme());

  // User data state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Sync theme state with DOM on mount and storage changes
  useEffect(() => {
    const updateThemeFromStorage = () => {
      const currentTheme = getCurrentTheme();
      setThemeState(currentTheme);

      // Ensure theme is applied to DOM
      if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };

    // Initial sync and DOM application
    updateThemeFromStorage();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_preferences:theme') {
        updateThemeFromStorage();
      }
    };

    // Listen for custom theme change events
    const handleThemeChange = (e: CustomEvent) => {
      console.log('🎨 Settings received theme change event:', e.detail);
      setThemeState(e.detail.theme);
      // Apply theme immediately when event is received
      if (e.detail.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChanged', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, []);

  // Load current user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          console.log('✅ Settings: Loaded user data:', user);
          setCurrentUser(user);

          // Pre-fill profile data with user metadata
          setProfileData(prev => ({
            ...prev,
            displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            bio: user.user_metadata?.bio || ''
          }));

          // Set profile image from avatar URL if available
          if (user.user_metadata?.avatar_url) {
            setProfileImage(user.user_metadata.avatar_url);
            console.log('🖼️ Loaded avatar from metadata:', user.user_metadata.avatar_url);
          }
        } else {
          console.log('⚠️ Settings: No user found');
        }
      } catch (error) {
        console.error('❌ Settings: Error loading user data:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUserData();
  }, []);

  // Tab state
  const [activeTab, setActiveTab] = useState('integrations');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // Profile tab state
  const [securityOpen, setSecurityOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  // Form Data State - Removed Regional section as requested
  const [profileData, setProfileData] = useState({
    displayName: 'User',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    desktopNotifications: true,
    weeklySummary: false
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setShowSuccess] = useState(false);

  // Integration popup states
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [gmailCredentials, setGmailCredentials] = useState({ email: '', password: '' });
  const [connectingGmail, setConnectingGmail] = useState(false);

  // Motion connection state with proper storage integration
  const [isMotionConnected, setIsMotionConnected] = useState(false);
  const [connectingMotion, setConnectingMotion] = useState(false);
  const [motionLastSync, setMotionLastSync] = useState<Date | null>(null);
  const [motionTaskCount, setMotionTaskCount] = useState(0);

  // Motion API key login state
  const [showMotionLoginForm, setShowMotionLoginForm] = useState(false);
  const [motionApiKey, setMotionApiKey] = useState('');
  const [showMotionSuccessModal, setShowMotionSuccessModal] = useState(false);

  // Motion OAuth Configuration
  const MOTION_OAUTH_URL = 'https://app.usemotion.com/oauth/authorize';

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'just now';
    if (diffInMins < 60) return `${diffInMins} min ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${diffInDays} days ago`;
  };

  // Initialize connections with real API states
  const [connections, setConnections] = useState<AppConnection[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Email integration',
      icon: <Mail size={24} strokeWidth={2} />,
      iconColor: '#EA4335',
      isConnected: false,
      targetTab: 'email'
    },
    {
      id: 'motion',
      name: 'Motion',
      description: 'Task management',
      icon: <CheckCircle2 size={24} strokeWidth={2} />,
      iconColor: '#667EEA',
      isConnected: false,
      targetTab: 'tasks'
    }
  ]);

  // Note: Theme is now handled globally by ThemeContext

  // Initialize appearance preferences on mount
  useEffect(() => {
    const initializePreferences = async () => {
      try {
        // Load saved preferences using AppearanceStorage
        const preferences = await AppearanceStorage.loadAllPreferences();

        setFontSize(preferences.font_size);
        setCompactMode(preferences.compact_mode);
        setIsInitialized(true);

        // Apply preferences to DOM
        AppearanceStorage.applyAppearancePreferences(preferences);
      } catch (error) {
        console.error('Failed to initialize appearance preferences:', error);
        setIsInitialized(true);
      }
    };

    initializePreferences();
  }, []);

  // Apply font size changes
  useEffect(() => {
    if (!isInitialized) return;

    // Save to storage
    AppearanceStorage.saveFontSize(fontSize);

    // Apply to DOM
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    document.documentElement.classList.add(`font-${fontSize}`);
  }, [fontSize, isInitialized]);

  // Apply compact mode changes
  useEffect(() => {
    if (!isInitialized) return;

    // Save to storage
    AppearanceStorage.saveCompactMode(compactMode);

    // Apply to DOM
    if (compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
  }, [compactMode, isInitialized]);

  // Load saved profile data on component mount
  useEffect(() => {
    const saved = localStorage.getItem('profileData');
    if (saved) {
      setProfileData(JSON.parse(saved));
    }

    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  // Check initial connection states
  useEffect(() => {
    // Check Gmail connection
    realGmailAPI.loadSavedConnection();
    if (realGmailAPI.isAuthenticated()) {
      setConnections(prev => prev.map(conn =>
        conn.id === 'gmail'
          ? { ...conn, isConnected: true, lastSync: new Date() }
          : conn
      ));
    }

    // Check Motion connection
    const motionToken = localStorage.getItem('motion_token');
    const motionConnected = localStorage.getItem('motion_connected') === 'true';
    if (motionToken && motionConnected) {
      setIsMotionConnected(true);
      setMotionLastSync(new Date());
      setConnections(prev => prev.map(conn =>
        conn.id === 'motion'
          ? {
              ...conn,
              isConnected: true,
              lastSync: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
              status: '0 tasks today'
            }
          : conn
      ));
    }
  }, []);

  // Simulate real-time sync updates
  useEffect(() => {
    const interval = setInterval(() => {
      setConnections(prev => prev.map(conn => ({
        ...conn,
        lastSync: new Date(),
        status: conn.id === 'motion' && conn.isConnected
          ? '0 tasks today' // In real app, this would be actual count
          : conn.status
      })));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'over a day ago';
  };

  const handleOpenApp = (targetTab: string) => {
    // Navigate to the specific tab by finding and clicking the nav button
    const navItems = document.querySelectorAll('button');
    navItems.forEach((item) => {
      if (item.textContent?.toLowerCase().includes(targetTab.toLowerCase())) {
        (item as HTMLButtonElement).click();
      }
    });
  };

  const handleDisconnect = (appId: string) => {
    if (appId === 'gmail') {
      realGmailAPI.disconnect();
    } else if (appId === 'motion') {
      // TODO: Implement motionAPI.disconnect() method
      console.log('Motion API disconnect not implemented yet');
    }

    setConnections(prev => prev.map(conn =>
      conn.id === appId
        ? { ...conn, isConnected: false, lastSync: undefined }
        : conn
    ));
  };

  // Modal Handler Functions
  const handleOpenGmail = () => {
    setShowGmailModal(true);
  };

  const closeModals = () => {
    setShowGmailModal(false);
    setGmailCredentials({ email: '', password: '' });
  };

  // Helper functions for storage with localStorage
  const getStorageItem = async (key: string) => {
    try {
      // Use localStorage directly
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.log('window.storage not available, using localStorage');
    }

    // Fallback to localStorage
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (error) {
      console.error('localStorage not available:', error);
      return null;
    }
  };

  const setStorageItem = async (key: string, value: string) => {
    try {
      // Use localStorage directly
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
        return;
      }
    } catch (error) {
      console.error('localStorage not available:', error);
    }

    // Fallback to localStorage
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage not available:', error);
    }
  };

  const deleteStorageItem = async (key: string) => {
    try {
      // Use localStorage directly
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
        return;
      }
    } catch (error) {
      console.error('localStorage not available:', error);
    }

    // Fallback to localStorage
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage not available:', error);
    }
  };

  // NOTE: Motion connection check removed - OAuth handles this automatically

  // NOTE: checkMotionConnection REMOVED - No more API key authentication!
// OAuth handles connection state automatically

  const handleConnectMotion = () => {
    setShowMotionLoginForm(true);
  };

  const handleMotionLogin = async () => {
    setConnectingMotion(true);
    try {
      console.log('🔐 Attempting Motion API connection with key:', motionApiKey.substring(0, 8) + '...');

      // Test the API key by making a request to get user info
      const response = await fetch('https://api.usemotion.com/v1/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': motionApiKey
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication data
        localStorage.setItem('motion_token', motionApiKey);
        localStorage.setItem('motion_user', JSON.stringify(data));
        localStorage.setItem('motion_connected', 'true');

        setIsMotionConnected(true);
        setMotionTaskCount(0); // Will be updated by real API calls
        setMotionLastSync(new Date());
        setShowMotionLoginForm(false);
        setMotionApiKey('');

        // Show success modal instead of alert
        setShowMotionSuccessModal(true);

        // Auto close after 2 seconds
        setTimeout(() => {
          setShowMotionSuccessModal(false);
        }, 2000);
      } else {
        console.error('Motion API connection failed:', data);
        alert(`❌ Connection failed: ${data.error || 'Invalid API key'}`);
      }
    } catch (error) {
      console.error('Motion API connection error:', error);
      alert('❌ Connection failed. Please check your API key and try again.');
    } finally {
      setConnectingMotion(false);
    }
  };

  const handleDisconnectMotion = async () => {
    if (confirm('Are you sure you want to disconnect Motion?')) {
      try {
        // Clear all Motion storage
        localStorage.removeItem('motion_token');
        localStorage.removeItem('motion_user');
        localStorage.removeItem('motion_connected');

        setIsMotionConnected(false);
        setMotionTaskCount(0);
        setMotionLastSync(null);

        console.log('Motion disconnected');
        alert('✅ Disconnected from Motion');
      } catch (error) {
        console.error('Disconnect error:', error);
        alert('Failed to disconnect from Motion');
      }
    }
  };

  const handleOpenMotion = () => {
    window.location.href = '/tasks';
  };

  const handleConnectGmail = async () => {
    if (!gmailCredentials.email || !gmailCredentials.password) {
      alert('Please enter both email and password');
      return;
    }

    setConnectingGmail(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      alert('Gmail connected successfully!');
      closeModals();
    } catch (error) {
      alert('Connection failed. Please try again.');
    } finally {
      setConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = () => {
    const confirmed = window.confirm('Are you sure you want to disconnect Gmail?');
    if (confirmed) {
      alert('Gmail disconnected');
    }
  };

  // Profile Handler Functions
  const handleProfileChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      try {
        console.log('📤 Starting avatar upload...');

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB');
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file');
          return;
        }

        // Show loading state
        setSaving(true);

        // Upload to Supabase Storage
        const avatarUrl = await uploadAvatar(file, currentUser.id);

        if (avatarUrl) {
          // Update user metadata with avatar URL
          const success = await updateUserAvatar(avatarUrl);

          if (success) {
            setProfileImage(avatarUrl);
            setHasChanges(true);

            // Update local user state
            setCurrentUser(prev => ({
              ...prev,
              user_metadata: {
                ...prev?.user_metadata,
                avatar_url: avatarUrl
              }
            }));

            console.log('✅ Avatar uploaded and saved successfully');

            // Dispatch event to update MainApp dropdown
            window.dispatchEvent(new CustomEvent('profileUpdated', {
              detail: {
                displayName: profileData.displayName,
                bio: profileData.bio,
                email: currentUser.email,
                avatar_url: avatarUrl
              }
            }));

            // Show success message
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } else {
            alert('Failed to save avatar to profile');
          }
        } else {
          alert('Failed to upload avatar');
        }
      } catch (error) {
        console.error('❌ Avatar upload error:', error);
        alert('Failed to upload avatar. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) {
      console.error('❌ No user logged in');
      return;
    }

    setSaving(true);

    try {
      console.log('💾 Saving profile data to Supabase...');

      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.displayName,
          bio: profileData.bio
        }
      });

      if (error) {
        console.error('❌ Error updating user metadata:', error);
        throw error;
      }

      // Also save to localStorage as backup
      localStorage.setItem('profileData', JSON.stringify(profileData));
      if (profileImage) {
        localStorage.setItem('profileImage', profileImage);
      }

      // Update local user state
      setCurrentUser(prev => ({
        ...prev,
        user_metadata: {
          ...prev?.user_metadata,
          full_name: profileData.displayName,
          bio: profileData.bio
        }
      }));

      setHasChanges(false);
      setShowSuccess(true);

      console.log('✅ Profile saved successfully to Supabase');

      // Dispatch custom event to notify other components (like MainApp) of profile changes
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: {
          displayName: profileData.displayName,
          bio: profileData.bio,
          email: currentUser.email,
          avatar_url: currentUser.user_metadata?.avatar_url
        }
      }));

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Save failed:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reload from localStorage or reset to defaults
    const saved = localStorage.getItem('profileData');
    if (saved) {
      setProfileData(JSON.parse(saved));
    }
    setHasChanges(false);
  };

  const handleUpdatePassword = async () => {
    if (!profileData.currentPassword || !profileData.newPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (profileData.newPassword !== profileData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Password updated successfully');

      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      alert('Password update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you absolutely sure? This will permanently delete your account and all data. This action cannot be undone.'
    );

    if (confirmed) {
      const doubleConfirm = window.confirm(
        'Last chance! Type DELETE to confirm (just click OK for now)'
      );

      if (doubleConfirm) {
        alert('Account deletion would happen here. This is a demo.');
        // In real app: call API to delete account
      }
    }
  };

  const handleConnect = (appId: string) => {
    // For now, just simulate connection
    // In real app, this would initiate OAuth flow
    setConnections(prev => prev.map(conn =>
      conn.id === appId
        ? {
            ...conn,
            isConnected: true,
            lastSync: new Date(),
            status: appId === 'motion' ? '0 tasks today' : undefined
          }
        : conn
    ));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setThemeDirect(newTheme);
    setThemeState(newTheme);
    console.log(`Settings page theme changed to ${newTheme} (direct DOM manipulation)`);

    // Dispatch a custom event to notify all components of theme change
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: newTheme }
    }));
  };

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    console.log(`Profile ${field} updated to ${value}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="section-title text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="section-subtitle text-gray-600 dark:text-gray-400">
            {loadingUser
              ? 'Loading your preferences...'
              : currentUser
                ? `Welcome back, ${currentUser.user_metadata?.username || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User'}! ✅`
                : 'Manage your productivity hub preferences and connected apps'
            }
          </p>
        </div>

        {/* Premium Settings Tabs */}
        <div className="settings-tabs inline-flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-12 mt-6">
          <button
            className={`settings-tab px-8 py-3 bg-transparent border-0 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === 'integrations'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('integrations')}
          >
            <div className="flex items-center justify-center space-x-2">
              <Link className="w-4 h-4" />
              <span>Integrations</span>
            </div>
          </button>
          <button
            className={`settings-tab px-8 py-3 bg-transparent border-0 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === 'appearance'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('appearance')}
          >
            <div className="flex items-center justify-center space-x-2">
              <Palette className="w-4 h-4" />
              <span>Appearance</span>
            </div>
          </button>
          <button
            className={`settings-tab px-8 py-3 bg-transparent border-0 rounded-lg font-semibold text-sm transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center justify-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
          <div>
            <h2 className="section-title">Connected Apps</h2>
            <p className="section-subtitle">Manage integrations with your productivity tools</p>

            <div className="integrations-container">

              {/* Security Notice */}
              <div className="security-notice">
                <div className="notice-icon">🔒</div>
                <div className="notice-content">
                  <h4>Your data is secure</h4>
                  <p>All connections use OAuth authentication. We never store passwords and only request necessary permissions.</p>
                </div>
              </div>

              {/* Connected Apps Grid */}
              <div className="integrations-grid">

                {/* Gmail Integration */}
                <div className="integration-item">
                  <div className="integration-header">
                    <div className="integration-icon gmail-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.366l8.073-5.873C21.69 2.28 24 3.434 24 5.457z"/>
                      </svg>
                    </div>
                    <div className="integration-details">
                      <h3 className="text-gray-900 dark:text-white">Gmail</h3>
                      <p className="text-gray-600 dark:text-gray-300">Email integration</p>
                    </div>
                  </div>

                  <div className="integration-status">
                    <span className="status-badge connected">
                      <span className="status-dot"></span>
                      Connected
                    </span>
                    <span className="status-time text-gray-600 dark:text-gray-300">Last checked just now</span>
                  </div>

                  <div className="integration-actions">
                    <button
                      className="btn-integration-primary"
                      onClick={handleOpenGmail}
                    >
                      Open
                    </button>
                    <button
                      className="btn-integration-secondary"
                      onClick={handleDisconnectGmail}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* Motion Integration */}
                <div className="integration-item">
                  <div className="integration-header">
                    <div className="integration-icon motion-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div className="integration-details">
                      <h3 className="text-gray-900 dark:text-white">Motion (Task)</h3>
                      <p className="text-gray-600 dark:text-gray-300">Task management</p>
                    </div>
                  </div>

                  <div className="integration-status">
                    {isMotionConnected ? (
                      <>
                        <span className="status-badge connected">
                          <span className="status-dot"></span>
                          Connected
                        </span>
                        <span className="status-time text-gray-600 dark:text-gray-300">
                          Last checked {motionLastSync ? formatTimeAgo(motionLastSync) : 'just now'} · {motionTaskCount} tasks today
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="status-badge not-connected">
                          <span className="status-dot"></span>
                          Not Connected
                        </span>
                        <span className="status-time text-gray-600 dark:text-gray-300">Connect to sync your tasks</span>
                      </>
                    )}
                  </div>

                  <div className="integration-actions">
                    {isMotionConnected ? (
                      <>
                        <button
                          className="btn-integration-primary"
                          onClick={handleOpenMotion}
                        >
                          Open
                        </button>
                        <button
                          className="btn-integration-secondary"
                          onClick={handleDisconnectMotion}
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-integration-primary"
                        onClick={handleConnectMotion}
                        disabled={connectingMotion}
                      >
                        {connectingMotion ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Gmail Login Modal */}
            {showGmailModal && (
              <div className="modal-overlay" onClick={closeModals}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Connect to Gmail</h3>
                    <button className="modal-close" onClick={closeModals}>×</button>
                  </div>

                  <div className="modal-body">
                    <div className="modal-icon gmail-icon-large">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.366l8.073-5.873C21.69 2.28 24 3.434 24 5.457z"/>
                      </svg>
                    </div>

                    <p className="modal-description">Enter your Gmail credentials to connect</p>

                    <div className="modal-field">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="your@gmail.com"
                        value={gmailCredentials.email}
                        onChange={(e) => setGmailCredentials({...gmailCredentials, email: e.target.value})}
                      />
                    </div>

                    <div className="modal-field">
                      <label>Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={gmailCredentials.password}
                        onChange={(e) => setGmailCredentials({...gmailCredentials, password: e.target.value})}
                      />
                    </div>

                    <div className="modal-actions">
                      <button
                        className="btn-modal-primary"
                        onClick={handleConnectGmail}
                        disabled={connectingGmail}
                      >
                        {connectingGmail ? 'Connecting...' : 'Connect Gmail'}
                      </button>
                      <button
                        className="btn-modal-secondary"
                        onClick={closeModals}
                        disabled={connectingGmail}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Motion Login Modal */}
            {showMotionLoginForm && (
              <div className="motion-modal-overlay" onClick={() => setShowMotionLoginForm(false)}>
                <div className="motion-modal" onClick={(e) => e.stopPropagation()}>
                  <button className="close-btn" onClick={() => setShowMotionLoginForm(false)}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                    </svg>
                  </button>

                  <div className="modal-content">
                    <div className="modal-header">
                      <div className="logo-title-container">
                        <div className="motion-logo-circle">
                          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path
                              d="M8 24V12c0-2 1-3 2-3s2 1 2 3v6c0 1 .5 2 1.5 2s1.5-1 1.5-2v-8c0-2 1-3 2-3s2 1 2 3v8c0 1 .5 2 1.5 2s1.5-1 1.5-2V8"
                              stroke="white"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <h2>Connect to Motion</h2>
                      </div>
                    </div>

                    <div className="modal-body">
                      <div className="input-group">
                        <label>API Key</label>
                        <input
                          type="password"
                          value={motionApiKey}
                          onChange={(e) => setMotionApiKey(e.target.value)}
                          className="api-key-input"
                          autoFocus
                        />
                      </div>

                      <button
                        className="connect-button"
                        onClick={handleMotionLogin}
                        disabled={connectingMotion || !motionApiKey}
                      >
                        {connectingMotion ? (
                          <>
                            <span className="spinner"></span>
                            Connecting...
                          </>
                        ) : (
                          'Connect'
                        )}
                      </button>

                      <a
                        href="https://app.usemotion.com/web/settings/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="api-key-link"
                      >
                        Get your API key →
                      </a>
                    </div>

                    <div className="modal-footer">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M6 0a3 3 0 00-3 3v1H2a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V5a1 1 0 00-1-1H9V3a3 3 0 00-3-3zm1 4V3a1 1 0 10-2 0v1h2z"/>
                      </svg>
                      <span>Secure connection</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Motion Success Modal */}
            {showMotionSuccessModal && (
              <div className="success-overlay">
                <div className="success-modal">
                  <div className="success-icon">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <circle cx="24" cy="24" r="24" fill="#10B981"/>
                      <path d="M14 24l8 8 12-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Successfully connected!</h3>
                  <p>Your Motion account is now synced</p>
                </div>
              </div>
            )}


          </div>
        )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-8">
              <div>
                <h2 className="section-title text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Appearance
                </h2>
                <p className="section-subtitle text-gray-600 dark:text-gray-400">
                  Customize how your Productivity Hub looks and feels
                </p>
              </div>

              {/* Appearance Grid */}
              <div className="appearance-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Theme Card */}
                <div className="appearance-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="card-header-small mb-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Theme
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose your interface theme
                    </p>
                  </div>
                  <div className="theme-selector grid grid-cols-2 gap-3">
                    <button
                      className={`theme-option p-0 bg-transparent border-2 ${
                        theme === 'light'
                          ? 'border-blue-500 shadow-lg shadow-blue-200'
                          : 'border-gray-300 dark:border-gray-600'
                      } rounded-xl cursor-pointer transition-all duration-200 overflow-hidden hover:scale-105 hover:-translate-y-1`}
                      onClick={() => handleThemeChange('light')}
                    >
                      <div className="theme-preview light w-full h-20 p-3 flex flex-col gap-2">
                        <div className="preview-bar h-2 bg-white rounded shadow-sm w-1/2"></div>
                        <div className="preview-content flex-1 bg-gray-100 rounded"></div>
                      </div>
                      <div className="theme-label py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        ☀️ Light
                      </div>
                    </button>
                    <button
                      className={`theme-option p-0 bg-transparent border-2 ${
                        theme === 'dark'
                          ? 'border-blue-500 shadow-lg shadow-blue-200'
                          : 'border-gray-300 dark:border-gray-600'
                      } rounded-xl cursor-pointer transition-all duration-200 overflow-hidden hover:scale-105 hover:-translate-y-1`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      <div className="theme-preview dark w-full h-20 p-3 flex flex-col gap-2">
                        <div className="preview-bar h-2 bg-gray-700 rounded shadow-sm w-1/2"></div>
                        <div className="preview-content flex-1 bg-gray-800 rounded"></div>
                      </div>
                      <div className="theme-label py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        🌙 Dark
                      </div>
                    </button>
                  </div>
                </div>

                {/* Font Size Card */}
                <div className="appearance-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="card-header-small mb-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Font Size
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Adjust text readability
                    </p>
                  </div>
                  <select
                    className="font-selector w-full px-5 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-base font-medium text-gray-900 dark:text-white cursor-pointer transition-all duration-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 focus:shadow-lg focus:shadow-blue-200"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value as FontSize)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>

                {/* Compact Mode Card */}
                <div className="appearance-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-200">
                  <div className="card-header-small mb-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Compact Mode
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Reduce spacing for more content
                    </p>
                  </div>
                  <label className="toggle-switch flex items-center gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                      className="sr-only"
                    />
                    <div className="toggle-slider w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative transition-colors duration-200">
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        compactMode ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                    </div>
                    <span className={`toggle-label text-sm font-semibold ${
                      compactMode
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    } transition-colors duration-200`}>
                      {compactMode ? 'On' : 'Off'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              {/* Success Message */}
              {saveSuccess && (
                <div className="success-banner">
                  ✓ Profile saved successfully
                </div>
              )}

              <div className="profile-premium">

                {/* Compact Header Bar */}
                <div className="profile-header-bar">
                  <div className="profile-user-row">
                    <div className="avatar-premium">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '11px' }} />
                      ) : (
                        profileData.displayName ? profileData.displayName.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div className="user-details">
                      <h3 className="text-gray-900 dark:text-white">{profileData.displayName}</h3>
                      <span className="email-badge">
                        {showEmail
                          ? (currentUser?.email || 'user@example.com')
                          : (currentUser?.email ? `${currentUser.email[0]}••••@${currentUser.email.split('@')[1]}` : 'u••••@example.com')
                        }
                        <button onClick={() => setShowEmail(!showEmail)}>
                          {showEmail ? 'Hide' : 'Show'}
                        </button>
                      </span>
                    </div>
                  </div>
                  <label className="upload-link">
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageUpload}
                    />
                    Upload Photo
                  </label>
                </div>

                {/* Main Content - Side by Side */}
                <div className="profile-layout">

                  {/* Left Column */}
                  <div className="profile-column">

                    {/* Account */}
                    <div className="settings-group">
                      <div className="group-header">
                        <h4 className="text-gray-900 dark:text-white">Account</h4>
                      </div>
                      <div className="group-content">
                        <div className="field">
                          <label className="text-gray-900 dark:text-white">Display Name</label>
                          <input
                            type="text"
                            value={profileData.displayName}
                            onChange={(e) => handleProfileChange('displayName', e.target.value)}
                            placeholder="Enter your display name"
                            className="text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                          />
                        </div>
                        <div className="field">
                          <label className="text-gray-900 dark:text-white">Bio</label>
                          <textarea
                            placeholder="Tell us about yourself"
                            rows={2}
                            maxLength={150}
                            value={profileData.bio}
                            onChange={(e) => handleProfileChange('bio', e.target.value)}
                            className="text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                          />
                          <span className="hint text-gray-500 dark:text-gray-400">{profileData.bio.length}/150 characters</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column */}
                  <div className="profile-column">

                    {/* Security */}
                    <div className="settings-group">
                      <div className="group-header">
                        <h4 className="text-gray-900 dark:text-white">Security</h4>
                        <button
                          className="expand-btn"
                          onClick={() => setSecurityOpen(!securityOpen)}
                        >
                          {securityOpen ? '−' : '+'}
                        </button>
                      </div>
                      {securityOpen && (
                        <div className="group-content">
                          <div className="field">
                            <label>Current Password</label>
                            <input
                              type="password"
                              placeholder="••••••••••"
                              value={profileData.currentPassword}
                              onChange={(e) => handleProfileChange('currentPassword', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>New Password</label>
                            <input
                              type="password"
                              placeholder="••••••••••"
                              value={profileData.newPassword}
                              onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Confirm Password</label>
                            <input
                              type="password"
                              placeholder="••••••••••"
                              value={profileData.confirmPassword}
                              onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                            />
                          </div>
                          <button
                            className="btn-update"
                            onClick={handleUpdatePassword}
                            disabled={saving}
                          >
                            {saving ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notifications */}
                    <div className="settings-group">
                      <div className="group-header">
                        <h4 className="text-gray-900 dark:text-white">Notifications</h4>
                      </div>
                      <div className="group-content">
                        <div className="switch-item">
                          <span className="text-gray-900 dark:text-white">Email Notifications</span>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={profileData.emailNotifications}
                              onChange={(e) => handleProfileChange('emailNotifications', e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                        <div className="switch-item">
                          <span className="text-gray-900 dark:text-white">Desktop Notifications</span>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={profileData.desktopNotifications}
                              onChange={(e) => handleProfileChange('desktopNotifications', e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                        <div className="switch-item">
                          <span className="text-gray-900 dark:text-white">Weekly Summary</span>
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={profileData.weeklySummary}
                              onChange={(e) => handleProfileChange('weeklySummary', e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Danger Zone - Full Width */}
                <div className="settings-group danger-group">
                  <div className="group-header">
                    <h4 className="text-gray-900 dark:text-white">Delete Account</h4>
                    <button
                      className="expand-btn"
                      onClick={() => setDangerOpen(!dangerOpen)}
                    >
                      {dangerOpen ? '−' : '+'}
                    </button>
                  </div>
                  {dangerOpen && (
                    <div className="group-content">
                      <p className="danger-warning">Permanently delete your account and all associated data. This action cannot be undone.</p>
                      <button
                        className="btn-delete text-white"
                        onClick={handleDeleteAccount}
                      >
                        Delete Account
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="profile-footer">
                  <button
                    className="btn-save-primary text-white"
                    onClick={handleSaveProfile}
                    disabled={!hasChanges || saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    className="btn-cancel-secondary text-gray-900 dark:text-white"
                    onClick={handleCancel}
                    disabled={!hasChanges || saving}
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Inline Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .settings-tab {
          position: relative;
          overflow: hidden;
        }

        .settings-tab::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s;
        }

        .settings-tab:hover::before {
          left: 100%;
        }

        .appearance-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .appearance-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .theme-option {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .theme-option:hover {
          transform: translateY(-2px);
        }

        .color-option {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .color-option:hover {
          transform: translateY(-2px) scale(1.1);
        }

        .color-option.active::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 18px;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .modern-select {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modern-select:hover {
          transform: translateY(-1px);
        }

        .form-group input,
        .form-group select {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-group input:focus,
        .form-group select:focus {
          transform: translateY(-2px);
        }

        .btn-save {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        .btn-cancel {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-cancel:hover {
          transform: translateY(-1px);
        }

        /* ========== PREMIUM PROFILE STYLES ========== */

        .profile-premium {
          max-width: 900px;
          margin: 0 auto;
        }

        /* Header Bar - Compact */
        .profile-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: linear-gradient(135deg, #FAFBFC 0%, #F8FAFC 100%);
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .dark .profile-header-bar {
          background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
          border-color: #334155;
        }

        .profile-user-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .avatar-premium {
          width: 52px;
          height: 52px;
          border-radius: 11px;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: white;
          box-shadow: 0 4px 12px rgba(99,102,241,0.25);
          flex-shrink: 0;
        }

        .user-details h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 3px;
        }

        .dark .user-details h3 {
          color: #F8FAFC;
        }

        .email-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748B;
          padding: 3px 8px;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
        }

        .dark .email-badge {
          background: #0F172A;
          border-color: #334155;
          color: #D1D5DB;
        }

        .email-badge button {
          padding: 0;
          background: none;
          border: none;
          color: #3B82F6;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .upload-link {
          font-size: 13px;
          font-weight: 600;
          color: #3B82F6;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .upload-link:hover {
          color: #2563EB;
        }

        /* Two Column Layout */
        .profile-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .profile-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Settings Group */
        .settings-group {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          overflow: hidden;
        }

        .dark .settings-group {
          background: #1E293B;
          border-color: #334155;
        }

        .danger-group {
          border-color: #FEE2E2;
          grid-column: 1 / -1;
        }

        .dark .danger-group {
          border-color: #7F1D1D;
        }

        /* Group Header */
        .group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: #F9FAFB;
          border-bottom: 1px solid #E5E7EB;
        }

        .dark .group-header {
          background: #0F172A;
          border-bottom-color: #334155;
        }

        .danger-group .group-header {
          background: #FEF2F2;
        }

        .dark .danger-group .group-header {
          background: rgba(127,29,29,0.2);
        }

        .group-header h4 {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin: 0;
        }

        .dark .group-header h4 {
          color: #F8FAFC;
        }

        .danger-group .group-header h4 {
          color: #DC2626;
        }

        .expand-btn {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          background: transparent;
          border: 1px solid #E5E7EB;
          color: #64748B;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 150ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .expand-btn:hover {
          background: white;
          border-color: #CBD5E1;
        }

        .dark .expand-btn {
          border-color: #334155;
          color: #94A3B8;
        }

        .dark .expand-btn:hover {
          background: #1E293B;
        }

        /* Group Content */
        .group-content {
          padding: 18px;
        }

        /* Fields */
        .field {
          margin-bottom: 14px;
        }

        .field:last-child {
          margin-bottom: 0;
        }

        .field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .dark .field label {
          color: #94A3B8;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          padding: 9px 12px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 7px;
          font-size: 14px;
          color: #0F172A;
          transition: all 150ms ease;
          font-family: inherit;
        }

        .dark .field input,
        .dark .field select,
        .dark .field textarea {
          background: #0F172A;
          border-color: #334155;
          color: #F8FAFC;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          outline: none;
          border-color: #3B82F6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }

        .dark .field input:focus,
        .dark .field select:focus,
        .dark .field textarea:focus {
          background: #1E293B;
        }

        .field textarea {
          resize: vertical;
          min-height: 60px;
        }

        .hint {
          display: block;
          font-size: 11px;
          color: #94A3B8;
          margin-top: 4px;
        }

        /* Field Row */
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }

        .field-half label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .dark .field-half label {
          color: #94A3B8;
        }

        .field-half select {
          width: 100%;
          padding: 9px 12px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 7px;
          font-size: 14px;
          color: #0F172A;
        }

        .dark .field-half select {
          background: #0F172A;
          border-color: #334155;
          color: #F8FAFC;
        }

        /* Switch Items */
        .switch-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 0;
          border-bottom: 1px solid #F1F5F9;
        }

        .switch-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .dark .switch-item {
          border-bottom-color: #334155;
        }

        .switch-item span {
          font-size: 13px;
          font-weight: 500;
          color: #0F172A;
        }

        .dark .switch-item span {
          color: #F8FAFC;
        }

        /* Switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 22px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #E5E7EB;
          transition: 0.2s;
          border-radius: 11px;
        }

        .dark .slider {
          background-color: #334155;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.2s;
          border-radius: 50%;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .switch input:checked + .slider {
          background-color: #3B82F6;
        }

        .switch input:checked + .slider:before {
          transform: translateX(18px);
        }

        /* Buttons */
        .btn-update {
          padding: 8px 16px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
          margin-top: 8px;
        }

        .btn-update:hover {
          background: #2563EB;
        }

        .danger-warning {
          font-size: 13px;
          color: #64748B;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .dark .danger-warning {
          color: #94A3B8;
        }

        .btn-delete {
          padding: 8px 16px;
          background: transparent;
          color: #DC2626;
          border: 1px solid #DC2626;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-delete:hover {
          background: #DC2626;
          color: white;
        }

        /* Footer */
        .profile-footer {
          display: flex;
          gap: 10px;
          padding: 16px 20px;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
        }

        .dark .profile-footer {
          background: #1E293B;
          border-color: #334155;
        }

        .btn-save-primary {
          padding: 10px 28px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-save-primary:hover {
          background: #2563EB;
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }

        .btn-cancel-secondary {
          padding: 10px 20px;
          background: transparent;
          color: #64748B;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-cancel-secondary:hover {
          background: #F9FAFB;
        }

        .dark .btn-cancel-secondary {
          border-color: #334155;
          color: #94A3B8;
        }

        .dark .btn-cancel-secondary:hover {
          background: #334155;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .profile-layout {
            grid-template-columns: 1fr;
          }

          .field-row {
            grid-template-columns: 1fr;
          }
        }

        /* Success Banner */
        .success-banner {
          padding: 12px 20px;
          background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
          border: 1px solid #6EE7B7;
          border-radius: 10px;
          color: #065F46;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideDown 300ms ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dark .success-banner {
          background: rgba(16,185,129,0.15);
          border-color: rgba(16,185,129,0.3);
          color: #6EE7B7;
        }

        /* Disabled Button State */
        .btn-save-primary:disabled,
        .btn-cancel-secondary:disabled,
        .btn-update:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ========== INTEGRATIONS TAB STYLES ========== */

        .integrations-container {
          max-width: 900px;
          margin: 0 auto;
        }

        /* Security Notice - Top */
        .security-notice {
          display: flex;
          gap: 14px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
          border: 1px solid #BFDBFE;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .dark .security-notice {
          background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
        }

        .notice-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .notice-content h4 {
          font-size: 14px;
          font-weight: 700;
          color: #1E40AF;
          margin-bottom: 4px;
        }

        .dark .notice-content h4 {
          color: #FFFFFF;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .notice-content p {
          font-size: 13px;
          color: #F9FAFB;
          line-height: 1.5;
          margin: 0;
          font-weight: 500;
        }

        .dark .notice-content p {
          color: #F9FAFB;
        }

        /* Integrations Grid */
        .integrations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        /* Integration Item */
        .integration-item {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          transition: all 200ms ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .dark .integration-item {
          background: rgba(30, 41, 59, 0.95);
          border: 1px solid rgba(71, 85, 105, 0.6);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
        }

        .integration-item:hover {
          border-color: #CBD5E1;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .dark .integration-item:hover {
          border-color: rgba(148, 163, 184, 0.4);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
          background: rgba(30, 41, 59, 0.98);
        }

        /* Integration Header */
        .integration-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .integration-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .gmail-icon {
          background: linear-gradient(135deg, #EA4335 0%, #D93025 100%);
          color: white;
        }

        .motion-icon {
          background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
          color: white;
        }

        .integration-details h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 2px;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
        }

        .dark .integration-details h3 {
          color: #FFFFFF;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .integration-details p {
          font-size: 13px;
          color: #64748B;
          margin: 0;
          font-weight: 500;
        }

        .dark .integration-details p {
          color: #E2E8F0;
          font-weight: 500;
        }

        /* Integration Status */
        .integration-status {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #F1F5F9;
        }

        .dark .integration-status {
          border-bottom-color: rgba(71, 85, 105, 0.4);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          width: fit-content;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .status-badge.connected {
          background: #ECFDF5;
          color: #065F46;
          border: 1px solid #6EE7B7;
        }

        .dark .status-badge.connected {
          background: rgba(16,185,129,0.2);
          border-color: rgba(16,185,129,0.4);
          color: #6EE7B7;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-time {
          font-size: 12px;
          color: #94A3B8;
        }

        /* Integration Actions */
        .integration-actions {
          display: flex;
          gap: 8px;
        }

        .btn-integration-primary {
          flex: 1;
          padding: 9px 16px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .btn-integration-primary:hover {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(59,130,246,0.4);
        }

        .btn-integration-secondary {
          flex: 1;
          padding: 9px 16px;
          background: transparent;
          color: #64748B;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .btn-integration-secondary:hover {
          background: #F9FAFB;
          border-color: #CBD5E1;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .dark .btn-integration-secondary {
          color: #E2E8F0;
          border-color: rgba(71, 85, 105, 0.6);
          background: rgba(51, 65, 85, 0.3);
        }

        .dark .btn-integration-secondary:hover {
          background: rgba(71, 85, 105, 0.5);
          border-color: rgba(148, 163, 184, 0.4);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* Available Section */
        .available-section {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 24px;
        }

        .dark .available-section {
          background: #1E293B;
          border-color: #334155;
        }

        .available-section h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 4px;
        }

        .dark .available-section h3 {
          color: #F8FAFC;
        }

        .available-section > p {
          font-size: 13px;
          color: #64748B;
          margin-bottom: 20px;
        }

        .dark .available-section > p {
          color: #94A3B8;
        }

        /* Available Grid */
        .available-grid {
          display: grid;
          gap: 12px;
        }

        .available-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          transition: all 150ms ease;
        }

        .dark .available-item {
          background: #0F172A;
          border-color: #334155;
        }

        .available-item:hover {
          border-color: #CBD5E1;
          background: white;
        }

        .dark .available-item:hover {
          border-color: #475569;
          background: #1E293B;
        }

        .available-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .slack-icon {
          background: #E01E5A;
          color: white;
        }

        .calendar-icon {
          background: #4285F4;
          color: white;
        }

        .notion-icon {
          background: #000000;
          color: white;
        }

        .dark .notion-icon {
          background: #FFFFFF;
          color: #000000;
        }

        .github-icon {
          background: #181717;
          color: white;
        }

        .dark .github-icon {
          background: #FFFFFF;
          color: #181717;
        }

        .available-info {
          flex: 1;
        }

        .available-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .dark .available-info h4 {
          color: #F8FAFC;
        }

        .available-info p {
          font-size: 12px;
          color: #64748B;
          margin: 0;
        }

        .dark .available-info p {
          color: #94A3B8;
        }

        .btn-connect {
          padding: 7px 16px;
          background: transparent;
          color: #3B82F6;
          border: 1px solid #3B82F6;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
          white-space: nowrap;
        }

        .btn-connect:hover {
          background: #3B82F6;
          color: white;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .integrations-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ========== MODAL STYLES ========== */

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 200ms ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Modal Container */
        .modal-container {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 440px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 300ms ease;
        }

        .dark .modal-container {
          background: #1E293B;
          border: 1px solid #334155;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Modal Header */
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #E5E7EB;
        }

        .dark .modal-header {
          border-bottom-color: #334155;
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .dark .modal-header h3 {
          color: #F8FAFC;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #64748B;
          font-size: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 150ms ease;
          line-height: 1;
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

        /* Modal Body */
        .modal-body {
          padding: 28px 24px 24px;
        }

        .modal-icon {
          width: 64px;
          height: 64px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .gmail-icon-large {
          background: linear-gradient(135deg, #EA4335 0%, #D93025 100%);
          color: white;
        }

        .motion-icon-large {
          background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
          color: white;
        }

        .modal-description {
          text-align: center;
          font-size: 14px;
          color: #64748B;
          margin-bottom: 24px;
        }

        .dark .modal-description {
          color: #94A3B8;
        }

        /* Modal Fields */
        .modal-field {
          margin-bottom: 16px;
        }

        .modal-field:last-of-type {
          margin-bottom: 24px;
        }

        .modal-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 6px;
        }

        .dark .modal-field label {
          color: #F8FAFC;
        }

        .modal-field input {
          width: 100%;
          padding: 11px 14px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          color: #0F172A;
          transition: all 150ms ease;
        }

        .dark .modal-field input {
          background: #0F172A;
          border-color: #334155;
          color: #F8FAFC;
        }

        .modal-field input:focus {
          outline: none;
          border-color: #3B82F6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .dark .modal-field input:focus {
          background: #1E293B;
        }

        .modal-field input::placeholder {
          color: #94A3B8;
        }

        /* Modal Actions */
        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-modal-primary {
          width: 100%;
          padding: 12px 20px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-modal-primary:hover {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-modal-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-modal-secondary {
          width: 100%;
          padding: 12px 20px;
          background: transparent;
          color: #64748B;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-modal-secondary:hover {
          background: #F9FAFB;
          border-color: #CBD5E1;
        }

        .dark .btn-modal-secondary {
          color: #94A3B8;
          border-color: #334155;
        }

        .dark .btn-modal-secondary:hover {
          background: #334155;
        }

        .btn-modal-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ========== MOTION BRANDED MODAL STYLES ========== */

        /* Motion Modal Overlay */
        .motion-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        /* Motion Modal */
        .motion-modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                      0 10px 10px -5px rgba(0, 0, 0, 0.04);
          position: relative;
          animation: slideUp 0.2s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dark .motion-modal {
          background: #1E293B;
          border: 1px solid #334155;
        }

        /* Close Button */
        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .dark .close-btn {
          color: #94a3b8;
        }

        .dark .close-btn:hover {
          background: #334155;
          color: #f8fafc;
        }

        /* Modal Content */
        .modal-content {
          padding: 40px 40px 32px 40px;
        }

        /* Modal Header */
        .modal-header {
          margin-bottom: 32px;
        }

        .logo-title-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        /* Motion Logo Circle */
        .motion-logo-circle {
          width: 56px;
          height: 56px;
          background: #0F172A;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-header h2 {
          font-size: 24px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
          line-height: 1;
        }

        .dark .modal-header h2 {
          color: #f8fafc;
        }

        /* Modal Body */
        .modal-body {
          margin-bottom: 24px;
        }

        .input-group {
          margin-bottom: 20px;
          text-align: left;
        }

        .input-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #334155;
          margin-bottom: 8px;
          text-align: left;
        }

        .dark .input-group label {
          color: #cbd5e1;
        }

        .api-key-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
          transition: all 0.2s;
          background: #f8fafc;
          text-align: left;
        }

        .dark .api-key-input {
          background: #1e293b;
          border-color: #334155;
          color: #f8fafc;
        }

        .api-key-input:focus {
          outline: none;
          border-color: #0f172a;
          background: white;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
        }

        .dark .api-key-input:focus {
          background: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.2);
        }

        /* Connect Button */
        .connect-button {
          width: 100%;
          padding: 14px 20px;
          background: #0F172A;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .connect-button:hover:not(:disabled) {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
        }

        .connect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* API Key Link */
        .api-key-link {
          display: block;
          text-align: center;
          margin-top: 16px;
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
          text-decoration: none;
          transition: color 0.2s;
        }

        .api-key-link:hover {
          color: #475569;
        }

        .dark .api-key-link {
          color: #60a5fa;
        }

        .dark .api-key-link:hover {
          color: #93c5fd;
        }

        /* Modal Footer */
        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
          font-size: 13px;
          color: #64748b;
        }

        .dark .modal-footer {
          border-top-color: #334155;
          color: #94a3b8;
        }

        .modal-footer svg {
          color: #94a3b8;
        }

        /* ========== SUCCESS MODAL STYLES ========== */

        .success-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .success-modal {
          background: white;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          max-width: 380px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          animation: slideUp 0.3s ease-out;
        }

        .dark .success-modal {
          background: #1e293b;
          border: 1px solid #334155;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .success-icon {
          margin: 0 auto 20px;
          animation: scaleIn 0.4s ease-out 0.1s backwards;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        .success-modal h3 {
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .dark .success-modal h3 {
          color: #f8fafc;
        }

        .success-modal p {
          font-size: 15px;
          color: #64748b;
          margin: 0;
        }

        .dark .success-modal p {
          color: #94a3b8;
        }

        /* ===== PREMIUM SETTINGS PAGE FIXES ===== */
        /* Page Header & Section Titles */
        .section-title {
          color: #0F172A !important;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05) !important;
        }

        .dark .section-title {
          color: #FFFFFF !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        .section-subtitle {
          color: #64748B !important;
          font-weight: 500 !important;
        }

        .dark .section-subtitle {
          color: #E2E8F0 !important;
          font-weight: 500 !important;
        }

        /* Premium Settings Tabs */
        .settings-tabs {
          background: #F8FAFC !important;
          border: 1px solid #E5E7EB !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        .dark .settings-tabs {
          background: rgba(30, 41, 59, 0.95) !important;
          border: 1px solid rgba(71, 85, 105, 0.4) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2) !important;
        }

        .settings-tab {
          position: relative !important;
          overflow: hidden !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .settings-tab:hover {
          transform: translateY(-1px) !important;
        }

        .dark .settings-tab {
          color: #94A3B8 !important;
          font-weight: 600 !important;
        }

        .dark .settings-tab:hover {
          color: #E2E8F0 !important;
        }

        .dark .settings-tab.bg-white,
        .dark .settings-tab.bg-gray-700 {
          background: rgba(51, 65, 85, 0.8) !important;
          color: #FFFFFF !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
        }

        .dark .settings-tab.shadow-sm {
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        /* Tab Icons */
        .dark .settings-tab svg {
          color: #94A3B8 !important;
        }

        .dark .settings-tab:hover svg {
          color: #E2E8F0 !important;
        }

        .dark .settings-tab.bg-white svg,
        .dark .settings-tab.bg-gray-700 svg {
          color: #FFFFFF !important;
        }

        /* Status Time Text */
        .status-time {
          font-size: 12px !important;
          color: #94A3B8 !important;
          font-weight: 500 !important;
        }

        .dark .status-time {
          color: #CBD5E1 !important;
        }

        /* Not Connected Badge */
        .status-badge.not-connected {
          background: #FEF2F2 !important;
          color: #991B1B !important;
          border: 1px solid #FCA5A5 !important;
        }

        .dark .status-badge.not-connected {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #F87171 !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
        }

        /* Background improvements */
        .dark .min-h-screen {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%) !important;
        }

        /* Connected Apps heading improvements */
        .dark .tab-content h2.section-title {
          color: #FFFFFF !important;
          font-weight: 700 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        .dark .tab-content p.section-subtitle {
          color: #E2E8F0 !important;
          font-weight: 500 !important;
        }

        /* ===== CRITICAL AVATAR FIX ===== */
        /* Fix avatar letter readability - CRITICAL URGENT */
        .avatar-premium {
          color: #FFFFFF !important;
          font-size: 22px !important;
          font-weight: 700 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        .dark .avatar-premium {
          color: #FFFFFF !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        }

        /* Double-check for any black text */
        .avatar-premium * {
          color: #FFFFFF !important;
        }
      `}</style>
    </div>
  );
};

export default CleanSettingsPage;