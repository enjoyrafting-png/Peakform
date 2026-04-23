'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  role: 'athlete' | 'coach' | 'admin'
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [trainingData, setTrainingData] = useState<any[]>([])
  const [fitnessData, setFitnessData] = useState<any[]>([])
  const [matchData, setMatchData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<number>(7)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, website, role, created_at, updated_at')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        router.push('/auth/login')
        return
      }

      setProfile(profile)

      // Fetch training data
      const { data: trainingLogs } = await supabase
        .from('training_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10)

      // Fetch fitness data
      const { data: fitnessLogs } = await supabase
        .from('fitness_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10)

      // Fetch match data
      const { data: matchStats } = await supabase
        .from('match_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('match_date', { ascending: false })
        .limit(10)

      setTrainingData(trainingLogs || [])
      setFitnessData(fitnessLogs || [])
      setMatchData(matchStats || [])
      setLoading(false)
      setIsLoaded(true)
    }

    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Process data for charts
  const getTrainingChartData = () => {
    return trainingData.slice(0, timeRange).reverse().map(log => ({
      date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      duration: log.duration || 0,
      intensity: log.intensity
    }))
  }

  const getFitnessChartData = () => {
    return fitnessData.slice(0, 7).reverse().map(log => ({
      date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bmi: log.bmi,
      weight: log.weight
    }))
  }

  const getMatchChartData = () => {
    const wins = matchData.filter(m => m.match_result === 'won').length
    const losses = matchData.filter(m => m.match_result === 'lost').length
    const draws = matchData.filter(m => m.match_result === 'draw').length
    return [
      { name: 'Wins', value: wins, color: '#22c55e' },
      { name: 'Losses', value: losses, color: '#ef4444' },
      { name: 'Draws', value: draws, color: '#eab308' }
    ]
  }

  const getPerformanceTrendData = () => {
    return matchData.slice(0, 10).reverse().map(match => ({
      match: match.opponent,
      runs: match.runs_scored,
      wickets: match.wickets_taken
    }))
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

  const renderRoleSpecificContent = () => {
    switch (profile.role) {
      case 'athlete':
        return (
          <div className="space-y-6">
            {/* Training Progress Chart */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Training Progress (Last {timeRange} Days)</h3>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  aria-label="Select time range"
                  className="bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={21}>21 Days</option>
                  <option value={28}>28 Days</option>
                  <option value={30}>1 Month</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getTrainingChartData()}>
                  <defs>
                    <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#facc15" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="duration" stroke="#facc15" fillOpacity={1} fill="url(#colorDuration)" name="Duration (min)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fitness Metrics Chart */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Fitness Metrics</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getFitnessChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Bar dataKey="bmi" fill="#3b82f6" name="BMI" />
                    <Bar dataKey="weight" fill="#ef4444" name="Weight (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Match Statistics Pie Chart */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Match Statistics</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={getMatchChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getMatchChartData().map((entry, index) => (
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

            {/* Performance Trend Chart */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Performance Trend (Last 10 Matches)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getPerformanceTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="match" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="runs" stroke="#22c55e" strokeWidth={2} name="Runs Scored" />
                  <Line type="monotone" dataKey="wickets" stroke="#f97316" strokeWidth={2} name="Wickets Taken" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      case 'coach':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 shadow-2xl hover:from-slate-700 hover:to-slate-600 transition-all transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-400 text-gray-900 rounded-lg p-2 mr-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Athletes</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Athletes</span>
                  <span className="font-bold text-yellow-400 text-lg">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Today</span>
                  <span className="font-bold text-green-400 text-lg">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Need Attention</span>
                  <span className="font-bold text-orange-400 text-lg">2</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 shadow-2xl hover:from-slate-700 hover:to-slate-600 transition-all transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="bg-blue-400 text-white rounded-lg p-2 mr-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Training Plans</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
                  <p className="font-medium text-white">Week 12 Program</p>
                  <p className="text-sm text-gray-400">5 athletes</p>
                </div>
                <div className="p-3 bg-slate-700 bg-opacity-30 rounded-lg border border-slate-600">
                  <p className="font-medium text-white">Recovery Phase</p>
                  <p className="text-sm text-gray-400">3 athletes</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 shadow-2xl hover:from-slate-700 hover:to-slate-600 transition-all transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="bg-green-400 text-white rounded-lg p-2 mr-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-green-900 bg-opacity-30 rounded-lg border border-green-700">
                  <p className="font-medium text-white">New PR: Sarah</p>
                  <p className="text-sm text-gray-400">Batting: 85 runs</p>
                </div>
                <div className="p-3 bg-slate-700 bg-opacity-30 rounded-lg border border-slate-600">
                  <p className="font-medium text-white">Training completed</p>
                  <p className="text-sm text-gray-400">Team A</p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 shadow-2xl hover:from-slate-700 hover:to-slate-600 transition-all transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-400 text-gray-900 rounded-lg p-2 mr-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">System Overview</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Users</span>
                  <span className="font-bold text-yellow-400 text-lg">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Athletes</span>
                  <span className="font-bold text-green-400 text-lg">89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Coaches</span>
                  <span className="font-bold text-blue-400 text-lg">12</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 shadow-2xl hover:from-slate-700 hover:to-slate-600 transition-all transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="bg-blue-400 text-white rounded-lg p-2 mr-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">User Management</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
                  <p className="font-medium text-white">Pending Approvals</p>
                  <p className="text-sm text-gray-400">3 new users</p>
                </div>
                <div className="p-3 bg-slate-700 bg-opacity-30 rounded-lg border border-slate-600">
                  <p className="font-medium text-white">Role Changes</p>
                  <p className="text-sm text-gray-400">2 requests</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 border border-slate-700 shadow-2xl hover:from-slate-700 hover:to-slate-600 transition-all transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="bg-green-400 text-white rounded-lg p-2 mr-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">System Health</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Database</span>
                  <span className="font-bold text-green-400 text-lg">Healthy</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">API Response</span>
                  <span className="font-bold text-green-400 text-lg">120ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Uptime</span>
                  <span className="font-bold text-green-400 text-lg">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
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
                    item.path === '/dashboard'
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
              
              {/* Header - No Profile Button */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                  <p className="text-gray-300 text-lg">
                    Welcome back, {profile.full_name || 'User'}! 
                    <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-400 bg-opacity-20 text-yellow-300 border border-yellow-500">
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-xl"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Cricket Performance Center
              </h2>
              <p className="text-gray-300 mb-8">
                Manage your cricket career with advanced analytics and insights
              </p>
              
              <div>
                {renderRoleSpecificContent()}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
