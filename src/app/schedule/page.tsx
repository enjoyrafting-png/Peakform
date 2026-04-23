'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import { matchStatsSchema, type MatchStatsFormData } from '@/lib/validation'
import { useCoachAthletes } from '@/hooks/useCoachAthletes'
import { handleError, getErrorMessage } from '@/lib/errorHandler'
import type { Profile } from '@/types'

interface MatchStats {
  id?: string
  match_date: string
  opponent: string
  venue: string
  runs_scored: number
  wickets_taken: number
  overs_bowled: number
  catches: number
  run_out: boolean
  man_of_match: boolean
  bowling_figures: string
  batting_figures: string
  match_result: string
  notes: string
  created_at?: string
}

export default function SchedulePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [matchStats, setMatchStats] = useState<MatchStats[]>([])
  const [isLoaded, setIsLoaded] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof MatchStatsFormData, string>>>({})
  const [formData, setFormData] = useState<MatchStatsFormData>({
    match_date: '',
    opponent: '',
    venue: '',
    runs_scored: 0,
    wickets_taken: 0,
    overs_bowled: 0,
    catches: 0,
    run_out: false,
    man_of_match: false,
    bowling_figures: '',
    batting_figures: '',
    match_result: 'won',
    notes: ''
  })

  const { athletes, selectedAthlete, setSelectedAthlete } = useCoachAthletes(
    profile?.id || null,
    profile?.role === 'coach'
  )

  useEffect(() => {
    const fetchMatchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch profile data and match stats in parallel
        const [profileResult, statsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, role, coach_id')
            .eq('id', user.id)
            .single(),
          supabase
            .from('match_stats')
            .select('id, match_date, opponent, venue, runs_scored, wickets_taken, overs_bowled, catches, run_out, man_of_match, bowling_figures, batting_figures, match_result, notes, created_at')
            .eq('user_id', user.id)
            .order('match_date', { ascending: false })
        ])

        const { data: profileData } = profileResult
        const { data: data, error } = statsResult
        
        if (profileData) {
          setProfile(profileData)
        }

        // Determine which user_id to filter by
        const targetUserId = profileData?.role === 'coach' && selectedAthlete ? selectedAthlete : user.id

        // If coach, refetch stats for selected athlete
        if (profileData?.role === 'coach' && selectedAthlete && selectedAthlete !== user.id) {
          const { data: coachStats, error: coachError } = await supabase
            .from('match_stats')
            .select('id, match_date, opponent, venue, runs_scored, wickets_taken, overs_bowled, catches, run_out, man_of_match, bowling_figures, batting_figures, match_result, notes, created_at')
            .eq('user_id', selectedAthlete)
            .order('match_date', { ascending: false })

          if (coachError) {
            handleError(coachError, 'SchedulePage')
            alert(getErrorMessage(coachError))
          } else {
            setMatchStats(coachStats || [])
          }
        } else {
          if (error) {
            handleError(error, 'SchedulePage')
            alert(getErrorMessage(error))
          } else {
            setMatchStats(data || [])
          }
        }
      } catch (err) {
        handleError(err, 'SchedulePage')
        alert(getErrorMessage(err))
      } finally {
        setIsLoaded(true)
      }
    }

    fetchMatchStats()
  }, [router, selectedAthlete])

  const handleInputChange = (e: any) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number'
        ? value === '' ? 0 : Number(value)
        : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})

    try {
      // Validate form data
      const validationData: MatchStatsFormData = {
        match_date: formData.match_date,
        opponent: formData.opponent,
        venue: formData.venue || '',
        runs_scored: formData.runs_scored || 0,
        wickets_taken: formData.wickets_taken || 0,
        overs_bowled: formData.overs_bowled || 0,
        catches: formData.catches || 0,
        run_out: formData.run_out || false,
        man_of_match: formData.man_of_match || false,
        bowling_figures: formData.bowling_figures || '',
        batting_figures: formData.batting_figures || '',
        match_result: formData.match_result as 'won' | 'lost' | 'draw',
        notes: formData.notes || ''
      }

      const validationResult = matchStatsSchema.safeParse(validationData)

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors
        setFieldErrors(errors as Partial<Record<keyof MatchStatsFormData, string>>)
        
        // Show specific validation errors in alert
        const errorMessages = Object.entries(errors)
          .filter(([_, msgs]) => msgs && msgs.length > 0)
          .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
          .join('\n')
        
        alert(`Please fix the following validation errors:\n\n${errorMessages}`)
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
        .from('match_stats')
        .insert({
          user_id: user.id,
          match_date: formData.match_date,
          opponent: formData.opponent,
          venue: formData.venue,
          runs_scored: formData.runs_scored,
          wickets_taken: formData.wickets_taken,
          overs_bowled: formData.overs_bowled,
          catches: formData.catches,
          run_out: formData.run_out,
          man_of_match: formData.man_of_match,
          bowling_figures: formData.bowling_figures,
          batting_figures: formData.batting_figures,
          match_result: formData.match_result,
          notes: formData.notes
        })

      if (error) {
        // Error handling without console logging
        
        // Provide more specific error information
        let errorMessage = 'Error saving match stats. Please try again.'
        
        if (error.message) {
          errorMessage += ` Details: ${error.message}`
        }
        
        if (error.details) {
          errorMessage += ` (${error.details})`
        }
        
        alert(errorMessage)
      } else {
        // Show success message
        alert('Match stats saved successfully! 🏏')
        
        // Reset form and refresh data
        setFormData({
          match_date: '',
          opponent: '',
          venue: '',
          runs_scored: 0,
          wickets_taken: 0,
          overs_bowled: 0,
          catches: 0,
          run_out: false,
          man_of_match: false,
          bowling_figures: '',
          batting_figures: '',
          match_result: 'won',
          notes: ''
        })
        setShowForm(false)
        
        // Refresh match stats
        const { data: refreshedData } = await supabase
          .from('match_stats')
          .select('id, match_date, opponent, venue, runs_scored, wickets_taken, overs_bowled, catches, run_out, man_of_match, bowling_figures, batting_figures, match_result, notes, created_at')
          .eq('user_id', user.id)
          .order('match_date', { ascending: false })
        
        setMatchStats(refreshedData || [])
      }
    } catch (err) {
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match entry?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('match_stats')
        .delete()
        .eq('id', id)

      if (error) {
        // Error handling without console logging
      } else {
        setMatchStats(prev => prev.filter(stats => stats.id !== id))
      }
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
                    item.path === '/schedule'
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
                    <h1 className="text-3xl font-bold text-white mb-2">Match Statistics</h1>
                    <p className="text-gray-300 text-lg">Track your cricket match performance</p>
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
                      {showForm ? 'Cancel' : '+ Add Match Entry'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Stats Form */}
            {showForm && (
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Add Match Entry</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="match_date" className="block text-sm font-semibold text-gray-200 mb-2">
                        Match Date
                      </label>
                      <input
                        type="date"
                        id="match_date"
                        name="match_date"
                        value={formData.match_date}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.match_date ? 'border-red-500' : 'border-slate-600'}`}
                      />
                      {fieldErrors.match_date && (
                        <p className="mt-1 text-sm text-red-400">{fieldErrors.match_date}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="opponent" className="block text-sm font-semibold text-gray-200 mb-2">
                        Opponent
                      </label>
                      <input
                        type="text"
                        id="opponent"
                        name="opponent"
                        value={formData.opponent}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.opponent ? 'border-red-500' : 'border-slate-600'}`}
                        placeholder="Enter opponent team name"
                      />
                      {fieldErrors.opponent && (
                        <p className="mt-1 text-sm text-red-400">{fieldErrors.opponent}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="venue" className="block text-sm font-semibold text-gray-200 mb-2">
                        Venue
                      </label>
                      <input
                        type="text"
                        id="venue"
                        name="venue"
                        value={formData.venue}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter match venue"
                      />
                    </div>

                    <div>
                      <label htmlFor="runs_scored" className="block text-sm font-semibold text-gray-200 mb-2">
                        Runs Scored
                      </label>
                      <input
                        type="number"
                        id="runs_scored"
                        name="runs_scored"
                        value={formData.runs_scored}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter runs scored"
                      />
                    </div>

                    <div>
                      <label htmlFor="wickets_taken" className="block text-sm font-semibold text-gray-200 mb-2">
                        Wickets Taken
                      </label>
                      <input
                        type="number"
                        id="wickets_taken"
                        name="wickets_taken"
                        value={formData.wickets_taken}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter wickets taken"
                      />
                    </div>

                    <div>
                      <label htmlFor="overs_bowled" className="block text-sm font-semibold text-gray-200 mb-2">
                        Overs Bowled
                      </label>
                      <input
                        type="number"
                        id="overs_bowled"
                        name="overs_bowled"
                        value={formData.overs_bowled}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter overs bowled"
                      />
                    </div>

                    <div>
                      <label htmlFor="catches" className="block text-sm font-semibold text-gray-200 mb-2">
                        Catches
                      </label>
                      <input
                        type="number"
                        id="catches"
                        name="catches"
                        value={formData.catches}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter catches taken"
                      />
                    </div>

                    <div>
                      <label htmlFor="match_result" className="block text-sm font-semibold text-gray-200 mb-2">
                        Match Result
                      </label>
                      <select
                        id="match_result"
                        name="match_result"
                        value={formData.match_result}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none cursor-pointer ${fieldErrors.match_result ? 'border-red-500' : 'border-slate-600'}`}
                      >
                        <option value="">Select match result</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                        <option value="draw">Draw</option>
                        <option value="tied">Tied</option>
                      </select>
                      {fieldErrors.match_result && (
                        <p className="mt-1 text-sm text-red-400">{fieldErrors.match_result}</p>
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <label htmlFor="bowling_figures" className="block text-sm font-semibold text-gray-200 mb-2">
                        Bowling Figures
                      </label>
                      <input
                        type="text"
                        id="bowling_figures"
                        name="bowling_figures"
                        value={formData.bowling_figures}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="e.g., 10-2-25-3"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label htmlFor="batting_figures" className="block text-sm font-semibold text-gray-200 mb-2">
                        Batting Figures
                      </label>
                      <input
                        type="text"
                        id="batting_figures"
                        name="batting_figures"
                        value={formData.batting_figures}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="e.g., 45 (6x4x6)"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="run_out"
                          name="run_out"
                          checked={formData.run_out}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-yellow-400 bg-slate-700 border-slate-600 rounded focus:ring-2 focus:ring-yellow-400"
                        />
                        <label htmlFor="run_out" className="text-sm font-semibold text-gray-200 ml-2">
                          Run Out
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="man_of_match"
                          name="man_of_match"
                          checked={formData.man_of_match}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-yellow-400 bg-slate-700 border-slate-600 rounded focus:ring-2 focus:ring-yellow-400"
                        />
                        <label htmlFor="man_of_match" className="text-sm font-semibold text-gray-200 ml-2">
                          Man of Match
                        </label>
                      </div>
                    </div>

                    <div className="lg:col-span-3">
                      <label htmlFor="notes" className="block text-sm font-semibold text-gray-200 mb-2">
                        Match Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-none"
                        placeholder="Additional notes about the match"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-600 text-gray-900 font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Match Entry'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Match Stats List */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Match History</h2>
              
              {matchStats.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-300 text-lg">No match statistics recorded yet.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-xl"
                  >
                    Add Match Entry
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="px-4 py-3 text-gray-200 font-semibold">Date</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Opponent</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Venue</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Runs</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Wickets</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Result</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchStats.map((stats) => (
                        <tr key={stats.id} className="border-b border-slate-700 hover:bg-slate-700">
                          <td className="px-4 py-3 text-gray-300">{stats.match_date}</td>
                          <td className="px-4 py-3 text-gray-300">{stats.opponent}</td>
                          <td className="px-4 py-3 text-gray-300">{stats.venue}</td>
                          <td className="px-4 py-3 text-gray-300 font-semibold text-yellow-400">{stats.runs_scored}</td>
                          <td className="px-4 py-3 text-gray-300 font-semibold text-orange-400">{stats.wickets_taken}</td>
                          <td className="px-4 py-3 text-gray-300">
                            <span className={`px-2 py-1 rounded text-sm ${
                              stats.match_result === 'won' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                              stats.match_result === 'lost' ? 'bg-red-500 bg-opacity-20 text-red-400' :
                              stats.match_result === 'draw' ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' :
                              'bg-gray-500 bg-opacity-20 text-gray-400'
                            }`}>
                              {stats.match_result.charAt(0).toUpperCase() + stats.match_result.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            <button
                              onClick={() => handleDelete(stats.id!)}
                              className="text-red-400 hover:text-red-300 transition-colors"
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
  )
}
