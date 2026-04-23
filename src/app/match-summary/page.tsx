'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import SearchModal from '@/components/SearchModal'
import FeedbackModal from '@/components/FeedbackModal'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
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

export default function MatchSummaryPage() {
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
  const [matchStats, setMatchStats] = useState<MatchStats[]>([])
  const [filteredMatchStats, setFilteredMatchStats] = useState<MatchStats[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoaded, setIsLoaded] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const { athletes, selectedAthlete, setSelectedAthlete } = useCoachAthletes(
    profile?.id || null,
    profile?.role === 'coach'
  )

  useEffect(() => {
    setFilteredMatchStats(matchStats)
  }, [matchStats])

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
            .select('*')
            .eq('user_id', selectedAthlete)
            .order('match_date', { ascending: false })

          if (coachError) {
            handleError(coachError, 'MatchSummaryPage')
            alert(getErrorMessage(coachError))
          } else {
            setMatchStats(coachStats || [])
          }
        } else {
          if (error) {
            handleError(error, 'MatchSummaryPage')
            alert(getErrorMessage(error))
          } else {
            setMatchStats(data || [])
          }
        }
      } catch (err) {
        handleError(err, 'MatchSummaryPage')
        alert(getErrorMessage(err))
      } finally {
        setIsLoaded(true)
      }
    }

    fetchMatchStats()
  }, [router, selectedAthlete])

  const summary = useMemo(() => {
    if (matchStats.length === 0) return {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      ties: 0,
      totalRuns: 0,
      totalWickets: 0,
      averageRuns: 0,
      averageWickets: 0,
      bestBatting: 0,
      bestBowling: 0,
      recentForm: { wins: 0, losses: 0 }
    }

    const totalMatches = matchStats.length
    const wins = matchStats.filter(m => m.match_result === 'won').length
    const losses = matchStats.filter(m => m.match_result === 'lost').length
    const draws = matchStats.filter(m => m.match_result === 'draw').length
    const ties = matchStats.filter(m => m.match_result === 'tied').length

    const totalRuns = matchStats.reduce((sum, m) => sum + m.runs_scored, 0)
    const totalWickets = matchStats.reduce((sum, m) => sum + m.wickets_taken, 0)
    
    const averageRuns = totalMatches > 0 ? Math.round(totalRuns / totalMatches) : 0
    const averageWickets = totalMatches > 0 ? Math.round(totalWickets / totalMatches) : 0

    const bestBatting = Math.max(...matchStats.map(m => m.runs_scored), 0)
    const bestBowling = Math.max(...matchStats.map(m => m.wickets_taken), 0)

    const recentForm = {
      wins: matchStats.slice(0, 5).filter(m => m.match_result === 'won').length,
      losses: matchStats.slice(0, 5).filter(m => m.match_result === 'lost').length
    }

    return {
      totalMatches,
      wins,
      losses,
      draws,
      ties,
      totalRuns,
      totalWickets,
      averageRuns,
      averageWickets,
      bestBatting,
      bestBowling,
      recentForm
    }
  }, [matchStats])

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

  const getWinRate = () => {
    return summary.totalMatches > 0 
      ? Math.round((summary.wins / summary.totalMatches) * 100) 
      : 0
  }

  const getRecentMatches = () => {
    return filteredMatchStats.slice(0, 10).map(match => ({
      ...match,
      battingAverage: match.overs_bowled > 0 ? (match.runs_scored / match.overs_bowled * 6).toFixed(2) : '0.00'
    }))
  }

  const getPerformanceTrendData = () => {
    return matchStats.slice(0, 10).reverse().map(match => ({
      opponent: match.opponent,
      runs: match.runs_scored,
      wickets: match.wickets_taken
    }))
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredMatchStats(matchStats)
      return
    }
    const lowerQuery = query.toLowerCase().trim()
    const filtered = matchStats.filter(stat =>
      stat.opponent.toLowerCase().includes(lowerQuery) ||
      stat.venue.toLowerCase().includes(lowerQuery) ||
      stat.match_date.includes(lowerQuery) ||
      stat.match_result.toLowerCase().includes(lowerQuery)
    )
    setFilteredMatchStats(filtered)
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

  const getMatchResultDistribution = () => {
    const wins = matchStats.filter(m => m.match_result === 'won').length
    const losses = matchStats.filter(m => m.match_result === 'lost').length
    const draws = matchStats.filter(m => m.match_result === 'draw').length
    return [
      { name: 'Wins', value: wins, color: '#22c55e' },
      { name: 'Losses', value: losses, color: '#ef4444' },
      { name: 'Draws', value: draws, color: '#eab308' }
    ]
  }

  const getRunsDistributionData = () => {
    const ranges = ['0-20', '21-40', '41-60', '61-80', '81+']
    return ranges.map(range => {
      const [min, max] = range.split('-').map(Number)
      const count = matchStats.filter(m => {
        if (range === '81+') return m.runs_scored >= 81
        return m.runs_scored >= min && m.runs_scored <= max
      }).length
      return { range, count }
    })
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
                    item.path === '/match-summary'
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
            placeholder="Search matches by opponent, venue, date, or result..."
          />

          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            onSubmit={handleFeedbackSubmit}
          />

          <div className="p-8">
            <div className={`max-w-7xl mx-auto ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
              
              {/* Header */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Match Summary</h1>
                    <p className="text-gray-300 text-lg">Comprehensive overview of your cricket performance</p>
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
                      onClick={() => router.push('/schedule')}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-xl"
                    >
                      Add New Match
                    </button>
                  </div>
                </div>
              </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <h3 className="text-lg font-bold text-white">Total Matches</h3>
                </div>
                <p className="text-3xl font-bold text-yellow-400">{summary.totalMatches}</p>
              </div>

              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-500 text-white rounded-lg p-3 mr-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16zm-6.01 0a6 6 0 0112 12 6 6 0 0112 12z"/>
                      <path d="M10 2a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Wins</h3>
                </div>
                <p className="text-3xl font-bold text-green-400">{summary.wins}</p>
              </div>

              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-red-500 text-white rounded-lg p-3 mr-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16zm-6.01 0a6 6 0 0112 12 6 6 0 0112 12z"/>
                      <path d="M10 2a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Losses</h3>
                </div>
                <p className="text-3xl font-bold text-red-400">{summary.losses}</p>
              </div>

              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-yellow-400 text-gray-900 rounded-lg p-3 mr-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16zm-6.01 0a6 6 0 0112 12 6 6 0 0112 12z"/>
                      <path d="M10 2a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Win Rate</h3>
                </div>
                <p className="text-3xl font-bold text-yellow-400">{getWinRate()}%</p>
              </div>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Performance Trend Chart */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Performance Trend (Last 10 Matches)</h2>
                {getPerformanceTrendData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getPerformanceTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="opponent" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="runs" stroke="#facc15" strokeWidth={2} name="Runs Scored" dot={{ fill: '#facc15', strokeWidth: 2, r: 4 }} />
                      <Line type="monotone" dataKey="wickets" stroke="#f97316" strokeWidth={2} name="Wickets Taken" dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400">
                    <p>No match data available. Add match entries to see performance trends.</p>
                  </div>
                )}
              </div>

              {/* Match Result Distribution */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Match Results Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getMatchResultDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getMatchResultDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Runs Distribution Chart */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Runs Score Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getRunsDistributionData()}>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="range" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="url(#colorBar)" name="Number of Matches" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Recent Performance</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-2">Last 5 Matches</h3>
                    <div className="text-gray-300">
                      <p>Wins: {summary.recentForm.wins} | Losses: {summary.recentForm.losses}</p>
                      <p>Form: {summary.recentForm.wins > summary.recentForm.losses ? 'Excellent' : summary.recentForm.wins === summary.recentForm.losses ? 'Average' : 'Needs Improvement'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Batting Averages</h3>
                    <div className="text-gray-300">
                      <p>Average Runs: {summary.averageRuns}</p>
                      <p>Average Wickets: {summary.averageWickets}</p>
                      <p>Total Runs: {summary.totalRuns}</p>
                      <p>Total Wickets: {summary.totalWickets}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Matches Table */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Recent Matches
                {searchQuery && (
                  <>
                    <span className="text-gray-400 text-lg ml-4">Search: &apos;{searchQuery}&apos;</span>
                    <span className="text-gray-400 text-lg ml-2">({filteredMatchStats.length} results)</span>
                  </>
                )}
              </h2>

              {filteredMatchStats.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-300 text-lg">
                    {searchQuery ? 'No matches found for your search.' : 'No match statistics recorded yet.'}
                  </p>
                  {searchQuery ? (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setFilteredMatchStats(matchStats)
                      }}
                      className="mt-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/schedule')}
                      className="mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-xl"
                    >
                      Add Match Entry
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="px-4 py-3 text-gray-200 font-semibold">Date</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Opponent</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Runs</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Wickets</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Result</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Batting Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getRecentMatches().map((match) => (
                        <tr key={match.id} className="border-b border-slate-700 hover:bg-slate-700">
                          <td className="px-4 py-3 text-gray-300">{match.match_date}</td>
                          <td className="px-4 py-3 text-gray-300">{match.opponent}</td>
                          <td className="px-4 py-3 text-gray-300 font-semibold text-yellow-400">{match.runs_scored}</td>
                          <td className="px-4 py-3 text-gray-300 font-semibold text-orange-400">{match.wickets_taken}</td>
                          <td className="px-4 py-3 text-gray-300">
                            <span className={`px-2 py-1 rounded text-sm ${
                              match.match_result === 'won' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                              match.match_result === 'lost' ? 'bg-red-500 bg-opacity-20 text-red-400' :
                              match.match_result === 'draw' ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' :
                              'bg-gray-500 bg-opacity-20 text-gray-400'
                            }`}>
                              {match.match_result.charAt(0).toUpperCase() + match.match_result.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{match.battingAverage}</td>
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
