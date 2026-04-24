'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import Image from 'next/image'
import ProfileVerification from '@/components/ProfileVerification'
import { profileSchema, type ProfileFormData } from '@/lib/validation'
import { useError } from '@/contexts/ErrorContext'

interface ProfileData {
  fullName: string
  age: string
  playingRole: string
  battingStyle: string
  bowlingStyle: string
  photo: string
  team: string
  experience: string
  goals: string
}

export default function CreateProfilePage() {
  const router = useRouter()
  const { showError } = useError()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [existingProfile, setExistingProfile] = useState<any>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({})
  
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    age: '',
    playingRole: '',
    battingStyle: '',
    bowlingStyle: '',
    photo: '',
    team: '',
    experience: '',
    goals: ''
  })

  const [photoInputType, setPhotoInputType] = useState<'url' | 'upload'>('url')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData && profileData.full_name && profileData.playing_role) {
          // Profile exists, show verification popup
          setExistingProfile(profileData)
          setShowVerification(true)
        }
      } catch (err) {
        // Error handling without console logging
      }
    }

    checkExistingProfile()
    setIsLoaded(true)
  }, [router])

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setProfileData(prev => ({
        ...prev,
        photo: data.url
      }))
    } catch (error: any) {
      showError('Error uploading photo: ' + error.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleVerificationConfirm = () => {
    setShowVerification(false)
    router.push('/profile/view')
  }

  const handleVerificationEdit = () => {
    setShowVerification(false)
    // Populate form with existing data
    if (existingProfile) {
      setProfileData({
        fullName: existingProfile.full_name || '',
        age: existingProfile.age || '',
        playingRole: existingProfile.playing_role || '',
        battingStyle: existingProfile.batting_style || '',
        bowlingStyle: existingProfile.bowling_style || '',
        photo: existingProfile.photo || '',
        team: existingProfile.team || '',
        experience: existingProfile.experience || '',
        goals: existingProfile.goals || ''
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setFieldErrors({})

    try {
      // Validate form data
      const formData: ProfileFormData = {
        fullName: profileData.fullName,
        age: profileData.age,
        playingRole: profileData.playingRole,
        battingStyle: profileData.battingStyle || '',
        bowlingStyle: profileData.bowlingStyle || '',
        photo: profileData.photo || '',
        team: profileData.team || '',
        experience: profileData.experience,
        goals: profileData.goals || ''
      }

      const validationResult = profileSchema.safeParse(formData)

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors
        setFieldErrors(errors as Partial<Record<keyof ProfileFormData, string>>)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showError('You must be logged in to create a profile')
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          age: profileData.age,
          playing_role: profileData.playingRole,
          batting_style: profileData.battingStyle,
          bowling_style: profileData.bowlingStyle,
          photo: profileData.photo,
          team: profileData.team,
          experience: profileData.experience,
          goals: profileData.goals
        })
        .eq('id', user.id)

      if (updateError) {
        showError(updateError.message)
      } else {
        setSuccess('Profile created successfully!')
        setTimeout(() => {
          router.push('/profile/view')
        }, 2000)
      }
    } catch (err: any) {
      showError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
                onClick={() => router.push('/profile/view')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-slate-700 text-gray-300 hover:text-yellow-400"
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
                <span className="font-medium">Training Analytics</span>
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
            
            {/* User Profile Circle */}
            <button className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-2 border-slate-600 hover:border-yellow-400 transition-all" title="Profile">
              <span className="text-white text-xs font-bold">{existingProfile?.full_name ? existingProfile.full_name.charAt(0).toUpperCase() : 'U'}</span>
            </button>
          </div>

          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-start ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
                
                {/* Left Side - Cricket Image */}
                <div className="relative lg:sticky lg:top-8">
                  <div className="relative">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-600 rounded-3xl blur-2xl opacity-30"></div>
                    
                    {/* Main Image Container */}
                    <div className="relative bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-slate-700">
                      <div className="relative h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-400/20 to-blue-600/20">
                        <Image
                          src="https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                          alt="Motivational Cricket Player"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {/* Fallback if image doesn't load */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-6xl mb-4">🏏</div>
                            <h3 className="text-2xl font-bold text-white">Cricket Excellence</h3>
                            <p className="text-gray-300">Build Your Legacy</p>
                          </div>
                        </div>
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                        
                        {/* Motivational Text */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-bold text-white mb-2">Unleash Your Potential</h3>
                        <p className="text-gray-300">Track your journey to cricket excellence</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Create Your Cricket Profile
                  </h1>
                  <p className="text-gray-300 text-lg">
                    Join our community of cricket athletes and track your performance
                  </p>
                </div>

              {/* Form Container */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-slate-700">
                {error && (
                  <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-300 rounded-lg p-4 mb-6">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-900 bg-opacity-50 border border-green-700 text-green-300 rounded-lg p-4 mb-6">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <div className="bg-yellow-400 text-gray-900 rounded-lg p-2 mr-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        Personal Information
                      </h3>
                      
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-semibold text-gray-200 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={profileData.fullName}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.fullName ? 'border-red-500' : 'border-slate-600'}`}
                          placeholder="Enter your full name"
                        />
                        {fieldErrors.fullName && (
                          <p className="mt-1 text-sm text-red-400">{fieldErrors.fullName}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="age" className="block text-sm font-semibold text-gray-200 mb-2">
                          Age
                        </label>
                        <input
                          type="number"
                          id="age"
                          name="age"
                          value={profileData.age}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.age ? 'border-red-500' : 'border-slate-600'}`}
                          placeholder="Enter your age"
                        />
                        {fieldErrors.age && (
                          <p className="mt-1 text-sm text-red-400">{fieldErrors.age}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="team" className="block text-sm font-semibold text-gray-200 mb-2">
                          Team
                        </label>
                        <input
                          type="text"
                          id="team"
                          name="team"
                          value={profileData.team}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                          placeholder="Enter your team name"
                        />
                      </div>
                    </div>

                    {/* Cricket Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <div className="bg-blue-500 text-white rounded-lg p-2 mr-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"/>
                          </svg>
                        </div>
                        Cricket Specialization
                      </h3>
                      
                      <div>
                        <label htmlFor="playingRole" className="block text-sm font-semibold text-gray-200 mb-2">
                          Playing Role
                        </label>
                        <select
                          id="playingRole"
                          name="playingRole"
                          value={profileData.playingRole}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none cursor-pointer ${fieldErrors.playingRole ? 'border-red-500' : 'border-slate-600'}`}
                        >
                          <option value="" className="text-gray-900">Select your playing role</option>
                          <option value="batsman" className="text-gray-900">Batsman</option>
                          <option value="bowler" className="text-gray-900">Bowler</option>
                          <option value="all-rounder" className="text-gray-900">All-rounder</option>
                          <option value="wicket-keeper" className="text-gray-900">Wicket-keeper</option>
                        </select>
                        {fieldErrors.playingRole && (
                          <p className="mt-1 text-sm text-red-400">{fieldErrors.playingRole}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="battingStyle" className="block text-sm font-semibold text-gray-200 mb-2">
                          Batting Style
                        </label>
                        <select
                          id="battingStyle"
                          name="battingStyle"
                          value={profileData.battingStyle}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                        >
                          <option value="" className="text-gray-900">Select batting style</option>
                          <option value="right-handed" className="text-gray-900">Right-handed</option>
                          <option value="left-handed" className="text-gray-900">Left-handed</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="bowlingStyle" className="block text-sm font-semibold text-gray-200 mb-2">
                          Bowling Style
                        </label>
                        <select
                          id="bowlingStyle"
                          name="bowlingStyle"
                          value={profileData.bowlingStyle}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                        >
                          <option value="" className="text-gray-900">Select bowling style</option>
                          <option value="right-arm-fast" className="text-gray-900">Right Arm Fast</option>
                          <option value="right-arm-medium" className="text-gray-900">Right Arm Medium</option>
                          <option value="right-arm-spin" className="text-gray-900">Right Arm Spin</option>
                          <option value="left-arm-fast" className="text-gray-900">Left Arm Fast</option>
                          <option value="left-arm-medium" className="text-gray-900">Left Arm Medium</option>
                          <option value="left-arm-spin" className="text-gray-900">Left Arm Spin</option>
                          <option value="na" className="text-gray-900">Not Applicable</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Photo and Experience */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Photo
                      </label>
                      
                      {/* Toggle between URL and Upload */}
                      <div className="flex space-x-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setPhotoInputType('url')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            photoInputType === 'url'
                              ? 'bg-yellow-400 text-gray-900'
                              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          }`}
                        >
                          From URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoInputType('upload')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            photoInputType === 'upload'
                              ? 'bg-yellow-400 text-gray-900'
                              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          }`}
                        >
                          Upload File
                        </button>
                      </div>

                      {photoInputType === 'url' ? (
                        <input
                          type="url"
                          id="photo"
                          name="photo"
                          value={profileData.photo}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                          placeholder="Enter photo URL (optional)"
                        />
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="file"
                            id="photoUpload"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto}
                            aria-label="Upload photo from computer"
                            className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border-2 border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          {uploadingPhoto && (
                            <p className="text-sm text-yellow-400">Uploading photo...</p>
                          )}
                          {profileData.photo && (
                            <div className="mt-2">
                              <img
                                src={profileData.photo}
                                alt="Preview"
                                className="w-24 h-24 object-cover rounded-lg border border-slate-600"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="experience" className="block text-sm font-semibold text-gray-200 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        id="experience"
                        name="experience"
                        value={profileData.experience}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.experience ? 'border-red-500' : 'border-slate-600'}`}
                        placeholder="Enter years of experience"
                      />
                      {fieldErrors.experience && (
                        <p className="mt-1 text-sm text-red-400">{fieldErrors.experience}</p>
                      )}
                    </div>
                  </div>

                  {/* Goals */}
                  <div>
                    <label htmlFor="goals" className="block text-sm font-semibold text-gray-200 mb-2">
                      Goals & Objectives
                    </label>
                    <textarea
                      id="goals"
                      name="goals"
                      value={profileData.goals}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-none"
                      placeholder="Describe your cricket goals and objectives"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-4 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 transition-all transform hover:scale-105 shadow-xl"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Profile...
                        </div>
                      ) : (
                        'Create Cricket Profile'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      </div>

      {/* Profile Verification Popup */}
      {showVerification && existingProfile && (
        <ProfileVerification
          profile={existingProfile}
          onConfirm={handleVerificationConfirm}
          onEdit={handleVerificationEdit}
        />
      )}
    </div>
  )
}
