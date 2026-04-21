'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'

interface TrainingLog {
  id?: string
  date: string
  session_type: string
  intensity: string
  created_at?: string
}

interface FitnessData {
  id?: string
  date: string
  weight: number
  bmi: number
  body_fat: number
  muscle_mass: number
  bmr: number
  water: number
  body_fat_mass: number
  lean_body_mass: number
  bone_mass: number
  visceral_fat: number
  protein: number
  skeletal_muscle_mass: number
  subcutaneous_fat: number
  body_age: number
  body_type: string
  created_at?: string
}

interface MatchStats {
  id?: string
  match_date: string
  opponent: string
  runs_scored: number
  wickets_taken: number
  overs_bowled: number
  catches: number
  run_out: boolean
  man_of_match: boolean
  bowling_figures: string
  batting_figures: string
  match_result: string
  created_at?: string
}

interface PartialMatchStats {
  match_date: string
  opponent: string
  runs_scored: number
  wickets_taken: number
  match_result: string
}

export default function AIAnalysisPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([])
  const [fitnessData, setFitnessData] = useState<FitnessData[]>([])
  const [matchStats, setMatchStats] = useState<PartialMatchStats[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [analysis, setAnalysis] = useState<string>('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
        }

        // Fetch all data sources in parallel using Promise.all()
        const [trainingResult, fitnessResult, matchResult] = await Promise.all([
          supabase
            .from('training_logs')
            .select('date, session_type, intensity')
            .eq('user_id', user.id)
            .order('date', { ascending: false }),
          supabase
            .from('fitness_data')
            .select('date, weight, bmi, body_fat, muscle_mass, bmr, water, body_fat_mass, lean_body_mass, bone_mass, visceral_fat, protein, skeletal_muscle_mass, subcutaneous_fat, body_age, body_type, created_at')
            .eq('user_id', user.id)
            .order('date', { ascending: false }),
          supabase
            .from('match_stats')
            .select('match_date, opponent, runs_scored, wickets_taken, match_result')
            .eq('user_id', user.id)
            .order('match_date', { ascending: false })
        ])

        const { data: trainingData, error: trainingError } = trainingResult
        const { data: fitnessDataResult, error: fitnessError } = fitnessResult
        const { data: matchDataResult, error: matchError } = matchResult

        setTrainingLogs(trainingData || [])
        setFitnessData(fitnessDataResult || [])
        setMatchStats(matchDataResult || [])
      } catch (err) {
        // Error handling without console logging
      } finally {
        setIsLoaded(true)
      }
    }

    fetchAllData()
  }, [router])

  const generateAIAnalysis = async () => {
    setLoading(true)
    
    try {
      // Prepare data for AI analysis
      const allData = {
        training: trainingLogs,
        fitness: fitnessData,
        matches: matchStats
      }

      // Generate comprehensive analysis
      const analysisPrompt = `
        As a professional cricket coach and fitness expert, analyze the following data and provide comprehensive insights:
        
        TRAINING DATA (${trainingLogs.length} sessions):
        ${trainingLogs.map(log => `- ${log.date}: ${log.session_type} (${log.intensity} intensity)`).join('\n')}
        
        FITNESS DATA (${fitnessData.length} sessions):
        ${fitnessData.map(data => `- ${data.date}: BMI ${data.bmi}, Body Fat ${data.body_fat}%, Muscle Mass ${data.muscle_mass}kg`).join('\n')}
        
        MATCH DATA (${matchStats.length} matches):
        ${matchStats.map(match => `- ${match.match_date}: vs ${match.opponent} (${match.runs_scored}/${match.wickets_taken} - ${match.match_result})`).join('\n')}
        
        Please provide:
        1. Performance trends and patterns
        2. Strengths and areas for improvement
        3. Training recommendations based on current data
        4. Injury prevention suggestions
        5. Peak performance analysis
        6. Comparison with professional standards
        7. Specific actionable recommendations
        8. Recovery and rest day recommendations
        
        Format your response as a comprehensive analysis report.
      `

      // Simulate AI analysis (in real app, this would call an AI API)
      const buildTrainingPatterns = () => {
        if (trainingLogs.length === 0) return 'No training data available'
        
        const sessionTypes = trainingLogs.reduce((acc, log) => {
          acc[log.session_type] = (acc[log.session_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        const highIntensity = trainingLogs.filter(log => log.intensity === 'high').length
        const moderateIntensity = trainingLogs.filter(log => log.intensity === 'moderate').length
        const lowIntensity = trainingLogs.filter(log => log.intensity === 'low').length
        const avgFrequency = trainingLogs.length > 0 ? parseFloat((trainingLogs.length / 4).toFixed(1)) : 0
        
        return `**Most Common Training Types:**
${Object.entries(sessionTypes).map(([type, count]) => `${count} - ${type}`).join('\n')}

**Intensity Distribution:**
- High: ${highIntensity} sessions
- Moderate: ${moderateIntensity} sessions
- Low: ${lowIntensity} sessions

**Training Frequency:**
Average: ${avgFrequency} sessions per week (last 4 weeks)`
      }

      const buildFitnessPerformance = () => {
        if (fitnessData.length === 0) return 'No fitness data Available'
        
        const avgBMI = Math.round(fitnessData.reduce((sum, data) => sum + data.bmi, 0) / fitnessData.length)
        const avgBodyFat = Math.round(fitnessData.reduce((sum, data) => sum + data.body_fat, 0) / fitnessData.length)
        const avgMuscleMass = Math.round(fitnessData.reduce((sum, data) => sum + data.muscle_mass, 0) / fitnessData.length)
        
        return `**Average BMI:** ${avgBMI}
**Average Body Fat:** ${avgBodyFat}%
**Average Muscle Mass:** ${avgMuscleMass}kg`
      }

      const buildMatchPerformance = () => {
        if (matchStats.length === 0) return 'No match data Available'
        
        const wins = matchStats.filter(m => m.match_result === 'won').length
        const winRate = wins > 0 ? Math.round((wins / matchStats.length) * 100) : 0
        const totalRuns = matchStats.reduce((sum, m) => sum + m.runs_scored, 0)
        const totalWickets = matchStats.reduce((sum, m) => sum + m.wickets_taken, 0)
        const bestBatting = Math.max(...matchStats.map(m => m.runs_scored), 0)
        
        return `**Win Rate:** ${winRate}%
**Total Runs Scored:** ${totalRuns}
**Total Wickets Taken:** ${totalWickets}
**Best Batting Score:** ${bestBatting}`
      }

      const highIntensityCount = trainingLogs.filter(log => log.intensity === 'high').length
      const strengthTrainingCount = fitnessData.length
      const winsCount = matchStats.filter(m => m.match_result === 'won').length
      const lossesCount = matchStats.filter(m => m.match_result === 'lost').length

      const mockAnalysis = `# 🏏 Cricket Performance Analysis Report

## 📊 Data Overview
- **Training Sessions**: ${trainingLogs.length} recorded
- **Fitness Activities**: ${fitnessData.length} logged  
- **Matches Played**: ${matchStats.length} completed

## 🎯 Performance Trends

### Training Patterns
${buildTrainingPatterns()}

### Fitness Performance
${buildFitnessPerformance()}

### Match Performance
${buildMatchPerformance()}

## 🎯 AI Recommendations

### Training Recommendations
1. **Increase High-Intensity Sessions**: Current high-intensity training (${highIntensityCount}) is below optimal (recommend 2-3 per week)
2. **Add Variety**: Include more strength training (${strengthTrainingCount === 0 ? 'Consider adding 2 sessions per week' : 'Good balance'})
3. **Recovery Planning**: Schedule rest days after intense sessions to prevent overtraining

### Performance Improvements
1. **Consistency Focus**: ${winsCount > lossesCount ? 'Strong winning record' : 'Focus on consistency in performance'}
2. **Technical Skills**: ${matchStats.length > 5 ? 'Advanced stage - focus on specific skill development' : 'Build fundamental skills first'}

### Injury Prevention
1. **Warm-up Protocol**: Ensure proper warm-up before all training sessions
2. **Load Management**: Gradually increase training intensity to avoid injuries
3. **Recovery Nutrition**: Emphasize post-training recovery and hydration

## 📈 Next Steps
1. **Schedule**: 3 training sessions + 1 match per week
2. **Focus Areas**: Batting consistency + bowling accuracy
3. **Monitoring**: Track heart rate zones during training
4. **Goals**: Set specific, measurable performance targets

---
*Generated by Peakform AI Analysis System*`

      setAnalysis(mockAnalysis)

      // Generate suggestions based on analysis
      const mockSuggestions = [
        'Increase high-intensity training sessions to 2-3 per week',
        'Add strength training 2 times per week',
        'Focus on batting consistency and bowling accuracy',
        'Implement proper warm-up protocol before all sessions',
        'Schedule recovery days after intense training',
        'Set specific performance targets for runs and wickets',
        'Monitor heart rate zones during training sessions',
        'Track progress with weekly performance reviews'
      ]

      setSuggestions(mockSuggestions)
    } catch (err) {
      setAnalysis('Error generating analysis. Please try again.')
    } finally {
      setLoading(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400 opacity-20"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-cyan-500/30 min-h-screen">
          <div className="p-6">
            <CricketLogo size="lg" className="mb-8" />
            
            {/* Navigation Menu */}
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    item.path === '/ai-analysis'
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold shadow-lg shadow-cyan-500/50'
                      : 'hover:bg-slate-800/50 text-gray-300 hover:text-cyan-400'
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
            <button className="p-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 hover:bg-slate-800/80 transition-all" title="Feedback">
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            
            {/* Search */}
            <button className="p-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 hover:bg-slate-800/80 transition-all" title="Search">
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Notifications */}
            <button className="p-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 hover:bg-slate-800/80 transition-all relative" title="Notifications">
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
            <button className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-2 border-cyan-500/30 hover:border-yellow-400 transition-all" title="Profile">
              <span className="text-white text-xs font-bold">{profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}</span>
            </button>
          </div>

          <div className="p-8">
            <div className={`max-w-7xl mx-auto ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
              
              {/* Header */}
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-cyan-500/30 p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      AI Performance Analysis
                    </h1>
                  </div>
                  <p className="text-gray-400 text-lg">Advanced neural insights powered by Peakform AI Engine</p>
                </div>
                <button
                  onClick={generateAIAnalysis}
                  disabled={loading}
                  className="relative group bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">🤖</span>
                        <span>Generate Analysis</span>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/20 group-hover:to-purple-500/20 transition-all"></div>
                </button>
              </div>
            </div>

            {/* AI Analysis Results */}
            {analysis && (
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-cyan-500/30 p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    <h2 className="text-2xl font-bold text-white">AI Analysis Report</h2>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap bg-slate-950/80 rounded-lg p-6 text-gray-300 font-mono text-sm border border-cyan-500/20 shadow-inner">
                      {analysis}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-cyan-500/30 p-8 mb-8 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <h2 className="text-2xl font-bold text-white">AI Recommendations</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="bg-slate-800/80 rounded-lg p-4 border border-cyan-500/20 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
                        <div className="flex items-start">
                          <div className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full p-2 mr-3 flex-shrink-0 shadow-lg">
                            <span className="text-sm font-bold">{index + 1}</span>
                          </div>
                          <p className="text-gray-300 text-sm">{suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Data Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-cyan-500/30 p-6 relative overflow-hidden hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex items-center mb-4">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg p-3 mr-3 shadow-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2v2a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1H9z"/>
                      <path d="M9 6a1 1 0 000 2v2a1 1 0 001 1h6a1 1 0 001-1V8a1 1 0 00-1-1H9z"/>
                      <path d="M9 10a1 1 0 000 2v2a1 1 0 001 1h6a1 1 0 001-1v-2a1 1 0 00-1-1H9z"/>
                      <path d="M9 14a1 1 0 000 2v2a1 1 0 001 1h6a1 1 0 001-1v-2a1 1 0 00-1-1H9z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Training Sessions</h3>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{trainingLogs.length}</p>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-6 relative overflow-hidden hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex items-center mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-3 mr-3 shadow-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16zm-6.01 0a6 6 0 0112 12 6 6 0 0112 12z"/>
                      <path d="M10 2a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Fitness Activities</h3>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{fitnessData.length}</p>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-pink-500/30 p-6 relative overflow-hidden hover:shadow-lg hover:shadow-pink-500/20 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/30 to-red-500/30 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex items-center mb-4">
                  <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg p-3 mr-3 shadow-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16zm-6.01 0a6 6 0 0112 12 6 6 0 0112 12z"/>
                      <path d="M10 2a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16zm0-6a8 8 0 100-16 8 8 0 000 16z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Matches Played</h3>
                </div>
                <p className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">{matchStats.length}</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  )
}
