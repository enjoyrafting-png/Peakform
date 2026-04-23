'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import { useCoachAthletes } from '@/hooks/useCoachAthletes'
import { handleError, getErrorMessage } from '@/lib/errorHandler'
import type { Profile } from '@/types'

interface TrainingLog {
  id?: string
  date: string
  session_type: string
  intensity: number | string
  duration: number
  created_at?: string
}

export default function PerformancePage() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      // Error handling
    }
  }

  const [logs, setLogs] = useState<TrainingLog[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  const { athletes, selectedAthlete, setSelectedAthlete } = useCoachAthletes(
    profile?.id || null,
    profile?.role === 'coach'
  )

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
            .select('id, date, session_type, intensity, duration, created_at')
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
            .select('id, date, session_type, intensity, duration, created_at')
            .eq('user_id', selectedAthlete)
            .order('date', { ascending: false })

          if (coachError) {
            handleError(coachError, 'PerformancePage')
            alert(getErrorMessage(coachError))
          } else {
            setLogs(coachLogs || [])
          }
        } else {
          if (error) {
            handleError(error, 'PerformancePage')
            alert(getErrorMessage(error))
          } else {
            setLogs(trainingLogs || [])
          }
        }
      } catch (err) {
        handleError(err, 'PerformancePage')
        alert(getErrorMessage(err))
      } finally {
        setIsLoaded(true)
      }
    }

    fetchLogs()
  }, [router, selectedAthlete])

  const stats = useMemo(() => {
    if (logs.length === 0) return { totalSessions: 0, mostCommonType: '-', avgIntensity: '-' }

    const sessionTypes = logs.reduce((acc, log) => {
      acc[log.session_type] = (acc[log.session_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostCommonType = Object.entries(sessionTypes).reduce((a, b) => 
      sessionTypes[a[0]] > sessionTypes[b[0]] ? a : b
    )[0]

    // Filter out null/empty intensities and convert to string
    const validIntensities = logs
      .filter(log => log.intensity !== null && log.intensity !== undefined && log.intensity !== '')
      .map(log => {
        const intensity = log.intensity
        if (typeof intensity === 'number') {
          return intensity === 1 ? 'low' : intensity === 2 ? 'moderate' : intensity === 3 ? 'high' : 'unknown'
        }
        return String(intensity).toLowerCase()
      })

    const intensityCount = validIntensities.reduce((acc, intensity) => {
      acc[intensity] = (acc[intensity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgIntensity = Object.keys(intensityCount).length > 0 
      ? Object.keys(intensityCount).reduce((a, b) => 
          intensityCount[a] > intensityCount[b] ? a : b
        )
      : '-'

    return {
      totalSessions: logs.length,
      mostCommonType: mostCommonType || '-',
      avgIntensity: avgIntensity
    }
  }, [logs])

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
                    item.path === '/performance'
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
                    <h1 className="text-3xl font-bold text-white mb-2">Training Analytics</h1>
                    <p className="text-gray-300 text-lg">Summary of your cricket training performance</p>
                  </div>
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
                </div>
              </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-500 text-white rounded-lg p-3 mr-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2v2a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1H9z"/>
                      <path d="M9 6a1 1 0 000 2v2a1 1 0 001 1h6a1 1 0 001-1V8a1 1 0 00-1-1H9z"/>
                      <path d="M9 10a1 1 0 000 2v2a1 1 0 001 1h6a1 1 0 001-1v-2a1 1 0 00-1-1H9z"/>
                      <path d="M9 14a1 1 0 000 2v2a1 1 0 001 1h6a1 1 0 001-1v-2a1 1 0 00-1-1H9z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Total Sessions</h3>
                </div>
                <p className="text-3xl font-bold text-yellow-400">{stats.totalSessions}</p>
              </div>

              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-500 text-white rounded-lg p-3 mr-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 00-1-1zm0 4a1 1 0 011 1v1a1 1 0 11-2 0V7a1 1 0 00-1-1zm0 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 00-1-1zm0 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 00-1-1z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Most Common Type</h3>
                </div>
                <p className="text-xl font-semibold text-green-400">{stats.mostCommonType}</p>
              </div>

              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-yellow-400 text-gray-900 rounded-lg p-3 mr-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4zm0-6a2 2 0 100-4 2 2 0 000 4zm0-6a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Average Intensity</h3>
                </div>
                <p className="text-xl font-semibold text-yellow-400">{stats.avgIntensity}</p>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Training Sessions</h2>
              
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-300 text-lg">No training sessions recorded yet.</p>
                  <button
                    onClick={() => router.push('/training/log')}
                    className="mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-xl"
                  >
                    Add Training Session
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="px-4 py-3 text-gray-200 font-semibold">Date</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Session Type</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Intensity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700">
                          <td className="px-4 py-3 text-gray-300">{log.date}</td>
                          <td className="px-4 py-3 text-gray-300">
                            <span className="px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-400 rounded text-sm">
                              {log.session_type.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            <span className={`px-2 py-1 rounded text-sm ${
                              log.intensity === 'low' || log.intensity === 1 ? 'bg-green-500 bg-opacity-20 text-green-400' :
                              log.intensity === 'moderate' || log.intensity === 2 ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' :
                              log.intensity === 'high' || log.intensity === 3 ? 'bg-orange-500 bg-opacity-20 text-orange-400' :
                              'bg-red-500 bg-opacity-20 text-red-400'
                            }`}>
                              {(() => {
                                const intensity = log.intensity
                                if (intensity === null || intensity === undefined || intensity === '') return 'N/A'
                                if (typeof intensity === 'number') {
                                  return intensity === 1 ? 'Low' : intensity === 2 ? 'Moderate' : intensity === 3 ? 'High' : 'Unknown'
                                }
                                return String(intensity).charAt(0).toUpperCase() + String(intensity).slice(1)
                              })()}
                            </span>
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
