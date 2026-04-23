'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import { profileUpdateSchema, passwordChangeSchema, type ProfileUpdateFormData, type PasswordChangeFormData } from '@/lib/validation'

interface Profile {
  id?: string
  username: string
  full_name: string
  avatar_url: string
  website: string
  role: string
  created_at?: string
}

export default function SettingsPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      // Error handling
    }
  }

  const [loading, setLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [profileForm, setProfileForm] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
    website: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profileFieldErrors, setProfileFieldErrors] = useState<Partial<Record<keyof ProfileUpdateFormData, string>>>({})
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Partial<Record<keyof PasswordChangeFormData, string>>>({})
  const [activeTab, setActiveTab] = useState('profile')
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    trainingReminders: true,
    matchReminders: true,
    weeklySummary: false
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, website, role, created_at')
          .eq('id', user.id)
          .single()

        if (error) {
          // Error handling without console logging
        } else if (profileData) {
          setProfile(profileData)
          setProfileForm({
            username: profileData.username || '',
            full_name: profileData.full_name || '',
            avatar_url: profileData.avatar_url || '',
            website: profileData.website || ''
          })
        }
      } catch (err) {
        // Error handling without console logging
      } finally {
        setIsLoaded(true)
      }
    }

    fetchProfile()
  }, [router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProfileFieldErrors({})

    try {
      // Validate form data
      const validationResult = profileUpdateSchema.safeParse(profileForm)

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors
        setProfileFieldErrors(errors as Partial<Record<keyof ProfileUpdateFormData, string>>)
        alert('Please fix the validation errors')
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('User not authenticated. Please log in again.')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileForm.username,
          full_name: profileForm.full_name,
          avatar_url: profileForm.avatar_url,
          website: profileForm.website
        })
        .eq('id', user.id)

      if (error) {
        alert('Error updating profile. Please try again.')
      } else {
        alert('Profile updated successfully!')
        setProfile((prev: any) => prev ? { ...prev, ...profileForm } : null)
      }
    } catch (err) {
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setPasswordFieldErrors({})

    try {
      // Validate form data
      const validationResult = passwordChangeSchema.safeParse(passwordForm)

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors
        setPasswordFieldErrors(errors as Partial<Record<keyof PasswordChangeFormData, string>>)
        alert('Please fix the validation errors')
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('User not authenticated. Please log in again.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) {
        alert('Error updating password. Please try again.')
      } else {
        alert('Password updated successfully!')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (err) {
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (err) {
      // Error handling without console logging
    }
  }

  const menuItems = [
    { name: 'Dashboard', icon: 'Dashboard', path: '/dashboard' },
    { name: 'Profile', icon: 'Profile', path: '/profile/view' },
    { name: 'Training Log', icon: 'Training Log', path: '/training/log' },
    { name: 'Training Analytics Summary', icon: 'Training Analytics Summary', path: '/performance' },
    { name: 'Schedule', icon: 'Schedule', path: '/schedule' },
    { name: 'Match Summary', icon: 'Match Summary', path: '/match-summary' },
    { name: 'Fitness', icon: 'Fitness', path: '/fitness' },
    ...(profile?.role !== 'coach' ? [{ name: 'AI Analysis', icon: 'AI Analysis', path: '/ai-analysis' }] : []),
    { name: 'Settings', icon: 'Settings', path: '/settings' }
  ]

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-600 rounded-full blur-xl opacity-30"></div>
            <div className="relative bg-slate-800 rounded-full p-6 border-2 border-yellow-400">
              <div className="flex flex-col items-center justify-center">
                <CricketLogo size="lg" showText={true} />
                <p className="text-white text-sm font-semibold mt-2">Loading</p>
              </div>
            </div>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mt-6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-600"></div>
        <div className="absolute inset-0 bg-pattern"></div>
      </div>

      <div className="relative z-10 flex">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-slate-800 bg-opacity-50 backdrop-blur-lg border-r border-slate-700 min-h-screen">
          <div className="p-6">
            <CricketLogo size="lg" className="mb-8" />
            
            {/* Navigation Menu */}
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    item.path === '/settings'
                      ? 'bg-yellow-400 text-gray-900 font-semibold'
                      : 'hover:bg-slate-700 text-gray-300'
                  }`}
                >
                  <span className="text-xl">{
                    item.name === 'Dashboard' ? '🏠' :
                    item.name === 'Profile' ? '👤' :
                    item.name === 'Training Log' ? '📝' :
                    item.name === 'Training Analytics Summary' ? '📊' :
                    item.name === 'Schedule' ? '📅' :
                    item.name === 'Match Summary' ? '🏏' :
                    item.name === 'Fitness' ? '💪' :
                    item.name === 'AI Analysis' ? '🤖' :
                    '⚙️'
                  }</span>
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Right Icons Bar */}
          <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
            {/* Feedback */}
            <button className="p-1.5 rounded-full bg-slate-800 bg-opacity-50 backdrop-blur-lg border border-slate-600 hover:bg-slate-700 transition-all" title="Feedback">
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            
            {/* Search */}
            <button className="p-1.5 rounded-full bg-slate-800 bg-opacity-50 backdrop-blur-lg border border-slate-600 hover:bg-slate-700 transition-all" title="Search">
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Notifications */}
            <button className="p-1.5 rounded-full bg-slate-800 bg-opacity-50 backdrop-blur-lg border border-slate-600 hover:bg-slate-700 transition-all relative" title="Notifications">
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Upgrade to Pro */}
            <button className="p-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 border border-yellow-500 transition-all" title="Upgrade to Pro">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </button>
            
            {/* Sign Out */}
            <button onClick={handleSignOut} className="p-1.5 rounded-full bg-slate-800 bg-opacity-50 backdrop-blur-lg border border-slate-600 hover:bg-red-600 hover:border-red-500 transition-all" title="Sign Out">
              <svg className="w-3.5 h-3.5 text-gray-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
            
            {/* User Profile Circle */}
            <button className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-2 border-slate-600 hover:border-yellow-400 transition-all" title="Profile">
              <span className="text-white text-xs font-bold">{profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}</span>
            </button>
          </div>

          <div className="p-8">
            <div className={`max-w-6xl mx-auto ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
              
              {/* Header */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-gray-300 text-lg">Manage your account and preferences</p>
                  </div>
                </div>
              </div>

            {/* Settings Tabs */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
              <div className="flex space-x-4 mb-8 border-b border-slate-700 pb-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'profile' 
                      ? 'bg-yellow-400 text-gray-900' 
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'security' 
                      ? 'bg-yellow-400 text-gray-900' 
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === 'notifications' 
                      ? 'bg-yellow-400 text-gray-900' 
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  Notifications
                </button>
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="username" className="block text-sm font-semibold text-gray-200 mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          id="username"
                          value={profileForm.username}
                          onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                          className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${profileFieldErrors.username ? 'border-red-500' : 'border-slate-600'}`}
                          placeholder="Enter username"
                        />
                        {profileFieldErrors.username && (
                          <p className="mt-1 text-sm text-red-400">{profileFieldErrors.username}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="full_name" className="block text-sm font-semibold text-gray-200 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="full_name"
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                          className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${profileFieldErrors.full_name ? 'border-red-500' : 'border-slate-600'}`}
                          placeholder="Enter full name"
                        />
                        {profileFieldErrors.full_name && (
                          <p className="mt-1 text-sm text-red-400">{profileFieldErrors.full_name}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="avatar_url" className="block text-sm font-semibold text-gray-200 mb-2">
                          Avatar URL
                        </label>
                        <input
                          type="url"
                          id="avatar_url"
                          value={profileForm.avatar_url}
                          onChange={(e) => setProfileForm({...profileForm, avatar_url: e.target.value})}
                          className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${profileFieldErrors.avatar_url ? 'border-red-500' : 'border-slate-600'}`}
                          placeholder="Enter avatar URL"
                        />
                        {profileFieldErrors.avatar_url && (
                          <p className="mt-1 text-sm text-red-400">{profileFieldErrors.avatar_url}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="website" className="block text-sm font-semibold text-gray-200 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          id="website"
                          value={profileForm.website}
                          onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                          className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${profileFieldErrors.website ? 'border-red-500' : 'border-slate-600'}`}
                          placeholder="Enter website URL"
                        />
                        {profileFieldErrors.website && (
                          <p className="mt-1 text-sm text-red-400">{profileFieldErrors.website}</p>
                        )}
                      </div>
                    </div>

                    {profile && (
                      <div className="bg-slate-700 bg-opacity-30 rounded-lg p-4">
                        <p className="text-sm text-gray-400">
                          <span className="font-semibold">Role:</span> {profile.role}
                        </p>
                        <p className="text-sm text-gray-400">
                          <span className="font-semibold">Member since:</span> {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-600 text-gray-900 font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
                  
                  <form onSubmit={handlePasswordChange} className="space-y-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-200">Change Password</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-200 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${passwordFieldErrors.currentPassword ? 'border-red-500' : 'border-slate-600'}`}
                          placeholder="Enter current password"
                        />
                        {passwordFieldErrors.currentPassword && (
                          <p className="mt-1 text-sm text-red-400">{passwordFieldErrors.currentPassword}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-200 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${passwordFieldErrors.newPassword ? 'border-red-500' : 'border-slate-600'}`}
                          placeholder="Enter new password"
                        />
                        {passwordFieldErrors.newPassword && (
                          <p className="mt-1 text-sm text-red-400">{passwordFieldErrors.newPassword}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-200 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${passwordFieldErrors.confirmPassword ? 'border-red-500' : 'border-slate-600'}`}
                          placeholder="Confirm new password"
                        />
                        {passwordFieldErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-400">{passwordFieldErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-600 text-gray-900 font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>

                  <div className="border-t border-slate-700 pt-8">
                    <h3 className="text-lg font-semibold text-gray-200 mb-4">Account Actions</h3>
                    <button
                      onClick={handleSignOut}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-700 bg-opacity-30 rounded-lg">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Email Notifications</h3>
                        <p className="text-gray-400 text-sm">Receive email notifications about your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                          className="sr-only peer"
                          aria-label="Email notifications"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700 bg-opacity-30 rounded-lg">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Training Reminders</h3>
                        <p className="text-gray-400 text-sm">Get reminders about your scheduled training sessions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.trainingReminders}
                          onChange={(e) => setNotificationSettings({...notificationSettings, trainingReminders: e.target.checked})}
                          className="sr-only peer"
                          aria-label="Training reminders"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700 bg-opacity-30 rounded-lg">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Match Reminders</h3>
                        <p className="text-gray-400 text-sm">Get reminders about upcoming matches</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.matchReminders}
                          onChange={(e) => setNotificationSettings({...notificationSettings, matchReminders: e.target.checked})}
                          className="sr-only peer"
                          aria-label="Match reminders"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700 bg-opacity-30 rounded-lg">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Weekly Summary</h3>
                        <p className="text-gray-400 text-sm">Receive a weekly summary of your training progress</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.weeklySummary}
                          onChange={(e) => setNotificationSettings({...notificationSettings, weeklySummary: e.target.checked})}
                          className="sr-only peer"
                          aria-label="Weekly summary"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => alert('Notification preferences saved! ✅')}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-xl"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
