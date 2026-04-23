'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import Image from 'next/image'

interface Profile {
  id: string
  full_name: string | null
  age: string | null
  playing_role: string | null
  batting_style: string | null
  bowling_style: string | null
  photo: string | null
  team: string | null
  experience: string | null
  goals: string | null
  role: string | null
}

export default function ProfileViewPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      // Error handling
    }
  }

  // Helper function to capitalize first letter of each word
  const capitalizeWords = (str: string) => {
    if (!str) return str
    return str.split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
  }

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
          .select('id, full_name, age, playing_role, batting_style, bowling_style, photo, team, experience, goals, role')
          .eq('id', user.id)
          .single()

        if (error || !profileData) {
          router.push('/profile/create')
          return
        }

        setProfile(profileData)
      } catch (err) {
        router.push('/profile/create')
      } finally {
        setLoading(false)
        setIsLoaded(true)
      }
    }

    fetchProfile()
  }, [router])

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handleEditProfile = () => {
    router.push('/profile/create')
  }

  if (loading) {
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

  if (!profile) {
    return null
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
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-slate-700 text-gray-300 hover:text-yellow-400"
              >
                <span className="text-xl">🏠</span>
                <span className="font-medium">Dashboard</span>
              </button>
              <button
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all bg-slate-700 text-yellow-400"
              >
                <span className="text-xl">👤</span>
                <span className="font-medium">Profile</span>
              </button>
              <button
                onClick={() => router.push('/training/log')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-slate-700 text-gray-300 hover:text-yellow-400"
              >
                <span className="text-xl">📝</span>
                <span className="font-medium">Training Log</span>
              </button>
              <button
                onClick={() => router.push('/performance')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-slate-700 text-gray-300 hover:text-yellow-400"
              >
                <span className="text-xl">📊</span>
                <span className="font-medium">Training Analytics Summary</span>
              </button>
              <button
                onClick={() => router.push('/schedule')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-slate-700 text-gray-300 hover:text-yellow-400"
              >
                <span className="text-xl">📅</span>
                <span className="font-medium">Schedule</span>
              </button>
              <button
                onClick={() => router.push('/match-summary')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-slate-700 text-gray-300 hover:text-yellow-400"
              >
                <span className="text-xl">🏏</span>
                <span className="font-medium">Match Summary</span>
              </button>
              <button
                onClick={() => router.push('/fitness')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-slate-700 text-gray-300 hover:text-yellow-400"
              >
                <span className="text-xl">💪</span>
                <span className="font-medium">Fitness</span>
              </button>
              {profile?.role !== 'coach' && (
                <button
                  onClick={() => router.push('/ai-analysis')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-slate-700 text-gray-300 hover:text-yellow-400"
                >
                  <span className="text-xl">🤖</span>
                  <span className="font-medium">AI Analysis</span>
                </button>
              )}
              <button
                onClick={() => router.push('/settings')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-slate-700 text-gray-300 hover:text-yellow-400"
              >
                <span className="text-xl">⚙️</span>
                <span className="font-medium">Settings</span>
              </button>
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
            <div className="max-w-6xl mx-auto">
              <div className={`space-y-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
                
                {/* Header */}
                <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-white">
                        {profile.full_name}&apos;s Cricket Profile
                      </h1>
                      <p className="text-gray-300 mt-1">
                        Professional Cricket Athlete
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleEditProfile}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-105"
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </div>

              {/* Profile Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - Photo and Basic Info */}
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-600 rounded-full blur-xl opacity-30"></div>
                      {profile.photo ? (
                        <Image
                          src={profile.photo}
                          alt={profile.full_name || 'Profile'}
                          width={128}
                          height={128}
                          className="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                        />
                      ) : (
                        <div className="relative w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                          <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-4">
                      {profile.full_name || 'Unknown'}
                    </h2>
                    <p className="text-gray-300 mt-1">
                      {profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-600">
                      <span className="text-gray-300">Age</span>
                      <span className="font-semibold text-white">{profile.age || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-600">
                      <span className="text-gray-300">Experience</span>
                      <span className="font-semibold text-white">{profile.experience || 'Not specified'} years</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-600">
                      <span className="text-gray-300">Team</span>
                      <span className="font-semibold text-white">{profile.team || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-300">Role</span>
                      <span className="font-semibold text-white">{profile.playing_role || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Detailed Information */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Personal Information */}
                <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-yellow-400 text-gray-900 rounded-lg p-2 mr-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Personal Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Full Name</label>
                      <p className="text-white bg-slate-700 bg-opacity-50 px-4 py-3 rounded-lg border border-slate-600">
                        {profile.full_name || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Age</label>
                      <p className="text-white bg-slate-700 bg-opacity-50 px-4 py-3 rounded-lg border border-slate-600">
                        {profile.age || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Team</label>
                      <p className="text-white bg-slate-700 bg-opacity-50 px-4 py-3 rounded-lg border border-slate-600">
                        {profile.team || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Years of Experience</label>
                      <p className="text-white bg-slate-700 bg-opacity-50 px-4 py-3 rounded-lg border border-slate-600">
                        {profile.experience || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Athletic Information */}
                <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-500 text-white rounded-lg p-2 mr-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Athletic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Playing Role</label>
                      <p className="text-white bg-slate-700 bg-opacity-50 px-4 py-3 rounded-lg border border-slate-600">
                        {profile.playing_role ? capitalizeWords(profile.playing_role) : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Batting Style</label>
                      <p className="text-white bg-slate-700 bg-opacity-50 px-4 py-3 rounded-lg border border-slate-600">
                        {profile.batting_style ? capitalizeWords(profile.batting_style) : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Bowling Style</label>
                      <p className="text-white bg-slate-700 bg-opacity-50 px-4 py-3 rounded-lg border border-slate-600">
                        {profile.bowling_style ? capitalizeWords(profile.bowling_style) : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">Photo URL</label>
                      <p className="text-white bg-slate-700 bg-opacity-50 px-4 py-3 rounded-lg border border-slate-600 truncate">
                        {profile.photo || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Goals & Objectives */}
                <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-500 text-white rounded-lg p-2 mr-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Goals & Objectives</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Career Goals</label>
                    <div className="text-white bg-slate-700 bg-opacity-50 px-4 py-3 rounded-lg border border-slate-600 min-h-[100px] whitespace-pre-wrap">
                      {profile.goals || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
