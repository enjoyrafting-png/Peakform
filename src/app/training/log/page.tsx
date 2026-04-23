'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import SearchModal from '@/components/SearchModal'
import FeedbackModal from '@/components/FeedbackModal'
import { trainingLogSchema, type TrainingLogFormData } from '@/lib/validation'
import { useCoachAthletes } from '@/hooks/useCoachAthletes'
import { handleError, getErrorMessage } from '@/lib/errorHandler'
import type { Profile } from '@/types'

interface TrainingLog {
  id?: string
  date: string
  session_type: string
  duration: number
  intensity: string
  performance_notes: string
  coach_notes: string
  created_at?: string
}

export default function TrainingLogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      // Error handling
    }
  }
  const [logs, setLogs] = useState<TrainingLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<TrainingLog[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoaded, setIsLoaded] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TrainingLogFormData, string>>>({})
  const [formData, setFormData] = useState({
    date: '',
    session_type: '',
    intensity: '',
    duration: 0,
    performance_notes: '',
    coach_notes: ''
  })
  const recognitionRef = useRef<any>(null)

  const { athletes, selectedAthlete, setSelectedAthlete } = useCoachAthletes(
    profile?.id || null,
    profile?.role === 'coach'
  )

  useEffect(() => {
    setFilteredLogs(logs)
  }, [logs])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          }
        }
        if (finalTranscript) {
          setFormData(prev => ({
            ...prev,
            performance_notes: prev.performance_notes + finalTranscript
          }))
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const enhanceWithAI = async () => {
    if (!formData.performance_notes.trim()) return

    setIsEnhancing(true)
    try {
      const enhanced = await fetch('/api/enhance-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: formData.performance_notes })
      }).then(res => res.json())
      .then(data => data.enhanced || formData.performance_notes)
      .catch(() => {
        return formData.performance_notes
          .replace(/\s+/g, ' ')
          .trim()
      })

      setFormData(prev => ({ ...prev, performance_notes: enhanced }))
    } catch (err) {
      const cleaned = formData.performance_notes.replace(/\s+/g, ' ').trim()
      setFormData(prev => ({ ...prev, performance_notes: cleaned }))
    } finally {
      setIsEnhancing(false)
    }
  }

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch profile data and training logs in parallel
        const [profileResult, logsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, role, coach_id')
            .eq('id', user.id)
            .single(),
          supabase
            .from('training_logs')
            .select('id, date, session_type, intensity, duration, performance_notes, coach_notes, created_at')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
        ])

        const { data: profileData } = profileResult
        const { data: trainingLogs, error } = logsResult
        
        if (profileData) {
          setProfile(profileData)
        }

        // Determine which user_id to filter by
        const targetUserId = profileData?.role === 'coach' && selectedAthlete ? selectedAthlete : user.id

        // If coach, refetch logs for selected athlete
        if (profileData?.role === 'coach' && selectedAthlete && selectedAthlete !== user.id) {
          const { data: coachLogs, error: coachError } = await supabase
            .from('training_logs')
            .select('id, date, session_type, intensity, duration, performance_notes, coach_notes, created_at')
            .eq('user_id', selectedAthlete)
            .order('date', { ascending: false })

          if (coachError) {
            handleError(coachError, 'TrainingLogPage')
            alert(getErrorMessage(coachError))
          } else {
            setLogs(coachLogs || [])
          }
        } else {
          if (error) {
            handleError(error, 'TrainingLogPage')
            alert(getErrorMessage(error))
          } else {
            setLogs(trainingLogs || [])
          }
        }
      } catch (err) {
        handleError(err, 'TrainingLogPage')
        alert(getErrorMessage(err))
      } finally {
        setIsLoaded(true)
      }
    }

    fetchLogs()
  }, [router, selectedAthlete])

  const handleInputChange = (e: any) => {
    const { name, value, type } = e.target
    const processedValue = type === 'number' ? (value === '' ? 0 : Number(value)) : value
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})

    try {
      // Validate form data
      const validationData: TrainingLogFormData = {
        date: formData.date,
        session_type: formData.session_type,
        intensity: formData.intensity as 'low' | 'moderate' | 'high' | 'maximum',
        duration: formData.duration || 0,
        performance_notes: formData.performance_notes || '',
        coach_notes: formData.coach_notes || ''
      }

      const validationResult = trainingLogSchema.safeParse(validationData)

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors
        setFieldErrors(errors as Partial<Record<keyof TrainingLogFormData, string>>)
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
        .from('training_logs')
        .insert({
          user_id: user.id,
          date: formData.date,
          session_type: formData.session_type,
          intensity: formData.intensity === 'low' ? 1 : formData.intensity === 'moderate' ? 2 : formData.intensity === 'high' ? 3 : null,
          duration: formData.duration || 0,
          performance_notes: formData.performance_notes || '',
          coach_notes: formData.coach_notes || ''
        })

      if (error) {
        // Error handling without console logging
        
        // Provide more specific error information
        let errorMessage = 'Error saving training session. Please try again.'
        
        if (error.message) {
          errorMessage += ` Details: ${error.message}`
        }
        
        if (error.details) {
          errorMessage += ` (${error.details})`
        }
        
        alert(errorMessage)
      } else {
        // Show success message
        alert('Training session saved successfully! 🎯')
        
        // Reset form and refresh logs
        setFormData({
          date: '',
          session_type: '',
          intensity: '',
          duration: 0,
          performance_notes: '',
          coach_notes: ''
        })
        setShowForm(false)
        
        // Refresh logs
        const { data: trainingLogs } = await supabase
          .from('training_logs')
          .select('id, date, session_type, intensity, duration, performance_notes, coach_notes, created_at')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
        
        setLogs(trainingLogs || [])
      }
    } catch (err) {
      // Error handling without console logging
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training log?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('training_logs')
        .delete()
        .eq('id', id)

      if (error) {
        // Error handling without console logging
      } else {
        setLogs(prev => prev.filter(log => log.id !== id))
      }
    } catch (err) {
      // Error handling without console logging
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredLogs(logs)
      return
    }
    const lowerQuery = query.toLowerCase().trim()
    const filtered = logs.filter(log =>
      log.session_type.toLowerCase().includes(lowerQuery) ||
      log.date.includes(lowerQuery) ||
      log.intensity.toLowerCase().includes(lowerQuery) ||
      (log.performance_notes && log.performance_notes.toLowerCase().includes(lowerQuery)) ||
      (log.coach_notes && log.coach_notes.toLowerCase().includes(lowerQuery))
    )
    setFilteredLogs(filtered)
    // Scroll to table after search
    setTimeout(() => {
      const tableElement = document.querySelector('.bg-slate-800.bg-opacity-50')
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleFeedbackSubmit = async (type: 'positive' | 'improvement', message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to submit feedback.')
        return
      }

      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          type,
          message
        })

      if (error) {
        alert('Failed to submit feedback. Please try again.')
      } else {
        alert('Thank you for your feedback!')
      }
    } catch (err) {
      alert('An error occurred. Please try again.')
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
                    item.path === '/training/log'
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
            <button onClick={() => setShowFeedbackModal(true)} className="p-1.5 rounded-full bg-slate-800 bg-opacity-50 backdrop-blur-lg border border-slate-600 hover:bg-slate-700 transition-all" title="Feedback">
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            
            {/* Search */}
            <button onClick={() => setShowSearchModal(true)} className="p-1.5 rounded-full bg-slate-800 bg-opacity-50 backdrop-blur-lg border border-slate-600 hover:bg-slate-700 transition-all" title="Search">
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

          <SearchModal
            isOpen={showSearchModal}
            onClose={() => setShowSearchModal(false)}
            onSearch={handleSearch}
            placeholder="Search training logs by session type, date, intensity, or notes..."
          />

          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            onSubmit={handleFeedbackSubmit}
          />

          <div className="p-8">
            <div className={`max-w-6xl mx-auto ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
              
              {/* Header - No Profile Button */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Training Log</h1>
                    <p className="text-gray-300 text-lg">Track your cricket training sessions and performance</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Athlete Selector for Coaches */}
                    {profile?.role === 'coach' && athletes.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <label className="text-white text-sm font-semibold">Viewing:</label>
                        <select
                          value={selectedAthlete || ''}
                          onChange={(e) => setSelectedAthlete(e.target.value)}
                          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                          title="Select athlete to view"
                          aria-label="Select athlete to view"
                        >
                          {athletes.map((athlete) => (
                            <option key={athlete.id} value={athlete.id}>
                              {athlete.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-xl"
                    >
                      {showForm ? 'Cancel' : '+ Add Training Session'}
                    </button>
                  </div>
                </div>
              </div>

            {/* Training Log Form */}
            {showForm && (
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Add Training Session</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="date" className="block text-sm font-semibold text-gray-200 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.date ? 'border-red-500' : 'border-slate-600'}`}
                      />
                      {fieldErrors.date && (
                        <p className="mt-1 text-sm text-red-400">{fieldErrors.date}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="session_type" className="block text-sm font-semibold text-gray-200 mb-2">
                        Session Type
                      </label>
                      <select
                        id="session_type"
                        name="session_type"
                        value={formData.session_type}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none cursor-pointer ${fieldErrors.session_type ? 'border-red-500' : 'border-slate-600'}`}
                      >
                        <option value="">Select session type</option>
                        <option value="batting-practice">Batting Practice</option>
                        <option value="bowling-practice">Bowling Practice</option>
                        <option value="fielding-drills">Fielding Drills</option>
                        <option value="fitness-training">Fitness Training</option>
                        <option value="match-simulation">Match Simulation</option>
                        <option value="recovery">Recovery Session</option>
                      </select>
                      {fieldErrors.session_type && (
                        <p className="mt-1 text-sm text-red-400">{fieldErrors.session_type}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="intensity" className="block text-sm font-semibold text-gray-200 mb-2">
                        Intensity
                      </label>
                      <select
                        id="intensity"
                        name="intensity"
                        value={formData.intensity}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none cursor-pointer ${fieldErrors.intensity ? 'border-red-500' : 'border-slate-600'}`}
                      >
                        <option value="">Select intensity</option>
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                        <option value="maximum">Maximum</option>
                      </select>
                      {fieldErrors.intensity && (
                        <p className="mt-1 text-sm text-red-400">{fieldErrors.intensity}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="duration" className="block text-sm font-semibold text-gray-200 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.duration ? 'border-red-500' : 'border-slate-600'}`}
                        required
                        min="0"
                        placeholder="Enter duration in minutes"
                      />
                      {fieldErrors.duration && (
                        <p className="mt-1 text-sm text-red-400">{fieldErrors.duration}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="performance_notes" className="block text-sm font-semibold text-gray-200 mb-2">
                      Performance Notes
                    </label>
                    <div className="relative">
                      <textarea
                        id="performance_notes"
                        name="performance_notes"
                        value={formData.performance_notes}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full px-4 py-3 pr-24 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-none"
                        placeholder="Describe your performance during the session"
                      />
                      <div className="absolute top-2 right-2 flex flex-col space-y-2">
                        <button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`p-2 rounded-lg transition-all ${
                            isRecording 
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                              : 'bg-slate-600 hover:bg-slate-500 text-gray-300'
                          }`}
                          title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={enhanceWithAI}
                          disabled={isEnhancing || !formData.performance_notes.trim()}
                          className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Enhance with AI"
                        >
                          {isEnhancing ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving Training Log...
                        </div>
                      ) : (
                        'Save Training Session'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            {/* Training Logs Table */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Training History
                {searchQuery && (
                  <>
                    <span className="text-gray-400 text-lg ml-4">Search: &apos;{searchQuery}&apos;</span>
                    <span className="text-gray-400 text-lg ml-2">({filteredLogs.length} results)</span>
                  </>
                )}
              </h2>

              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2h6a1 1 0 100-2 2 2 0 00-2 2v11a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2H6z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg">
                    {searchQuery ? 'No training logs found for your search.' : 'No training logs yet'}
                  </p>
                  <p className="text-gray-500 mt-2">
                    {searchQuery ? 'Try a different search term.' : 'Start by adding your first training session above'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setFilteredLogs(logs)
                      }}
                      className="mt-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-600">
                        <th className="text-left py-3 px-4 font-bold text-white">Date</th>
                        <th className="text-left py-3 px-4 font-bold text-white">Session Type</th>
                        <th className="text-left py-3 px-4 font-bold text-white">Duration</th>
                        <th className="text-left py-3 px-4 font-bold text-white">Intensity</th>
                        <th className="text-left py-3 px-4 font-bold text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-30">
                          <td className="py-3 px-4 text-gray-300">{log.date}</td>
                          <td className="py-3 px-4 text-gray-300">{log.session_type}</td>
                          <td className="py-3 px-4 text-gray-300">{log.duration} min</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              log.intensity === 'high' ? 'bg-red-900 text-red-300' :
                              log.intensity === 'moderate' ? 'bg-yellow-900 text-yellow-300' :
                              log.intensity === 'low' ? 'bg-green-900 text-green-300' :
                              'bg-purple-900 text-purple-300'
                            }`}>
                              {log.intensity}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDelete(log.id!)}
                              className="text-red-400 hover:text-red-300 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
