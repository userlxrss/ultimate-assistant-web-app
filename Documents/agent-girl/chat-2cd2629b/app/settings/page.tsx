'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface ProfileData {
  displayName: string
  username: string
  bio: string
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    username: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        await loadProfileData(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const loadProfileData = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data) {
        setProfileData({
          displayName: data.display_name || '',
          bio: data.bio || '',
          username: data.username || ''
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const saveProfile = async () => {
    if (!currentUser) return

    setSaving(true)
    try {
      // Update user metadata in Supabase auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: profileData.displayName,
          bio: profileData.bio,
          username: profileData.username
        }
      })

      // Also save to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: currentUser.id,
          display_name: profileData.displayName,
          bio: profileData.bio,
          username: profileData.username,
          updated_at: new Date().toISOString()
        })

      if (!authError && !profileError) {
        alert('Profile updated successfully!')
      } else {
        console.error('Error saving profile:', authError || profileError)
        alert('Failed to save profile')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Not authenticated</h2>
          <p className="text-gray-600">Please sign in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update your personal information and profile details.
          </p>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              placeholder="Enter your display name"
              value={profileData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              onBlur={saveProfile}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={profileData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              onBlur={saveProfile}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              placeholder="Tell us about yourself"
              value={profileData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              onBlur={saveProfile}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{currentUser.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">{currentUser.id}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}