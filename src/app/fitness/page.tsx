'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import SearchModal from '@/components/SearchModal'
import { fitnessDataSchema, type FitnessDataFormData } from '@/lib/validation'
import { useCoachAthletes } from '@/hooks/useCoachAthletes'
import { handleError, getErrorMessage } from '@/lib/errorHandler'
import type { Profile } from '@/types'

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

export default function FitnessPage() {
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
  const [fitnessData, setFitnessData] = useState<FitnessData[]>([])
  const [filteredFitnessData, setFilteredFitnessData] = useState<FitnessData[]>([])
  const [isLoaded, setIsLoaded] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FitnessDataFormData, string>>>({})
  const [formData, setFormData] = useState<FitnessDataFormData>({
    date: '',
    weight: 0,
    bmi: 0,
    body_fat: 0,
    muscle_mass: 0,
    bmr: 0,
    water: 0,
    body_fat_mass: 0,
    lean_body_mass: 0,
    bone_mass: 0,
    visceral_fat: 0,
    protein: 0,
    skeletal_muscle_mass: 0,
    subcutaneous_fat: 0,
    body_age: 0,
    body_type: ''
  })

  const { athletes, selectedAthlete, setSelectedAthlete } = useCoachAthletes(
    profile?.id || null,
    profile?.role === 'coach'
  )

  useEffect(() => {
    setFilteredFitnessData(fitnessData)
  }, [fitnessData])

  useEffect(() => {
    const fetchFitnessData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch profile data and fitness data in parallel
        const [profileResult, fitnessResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, role, coach_id')
            .eq('id', user.id)
            .single(),
          supabase
            .from('fitness_data')
            .select('id, date, weight, bmi, body_fat, muscle_mass, bmr, water, body_fat_mass, lean_body_mass, bone_mass, visceral_fat, protein, skeletal_muscle_mass, subcutaneous_fat, body_age, body_type, created_at')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
        ])

        const { data: profileData } = profileResult
        const { data: data, error } = fitnessResult
        
        if (profileData) {
          setProfile(profileData)
        }

        // Determine which user_id to filter by
        const targetUserId = profileData?.role === 'coach' && selectedAthlete ? selectedAthlete : user.id

        // If coach, refetch fitness data for selected athlete
        if (profileData?.role === 'coach' && selectedAthlete && selectedAthlete !== user.id) {
          const { data: coachFitness, error: coachError } = await supabase
            .from('fitness_data')
            .select('id, date, weight, bmi, body_fat, muscle_mass, bmr, water, body_fat_mass, lean_body_mass, bone_mass, visceral_fat, protein, skeletal_muscle_mass, subcutaneous_fat, body_age, body_type, created_at')
            .eq('user_id', selectedAthlete)
            .order('date', { ascending: false })

          if (coachError) {
            handleError(coachError, 'FitnessPage')
            alert(getErrorMessage(coachError))
          } else {
            setFitnessData(coachFitness || [])
          }
        } else {
          if (error) {
            handleError(error, 'FitnessPage')
            alert(getErrorMessage(error))
          } else {
            setFitnessData(data || [])
          }
        }
      } catch (err) {
        handleError(err, 'FitnessPage')
        alert(getErrorMessage(err))
      } finally {
        setIsLoaded(true)
      }
    }

    fetchFitnessData()
  }, [router, selectedAthlete])

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'date' || name === 'body_type' ? value : parseFloat(value) || 0
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})

    try {
      // Validate form data
      const validationData: FitnessDataFormData = {
        date: formData.date,
        weight: formData.weight || 0,
        bmi: formData.bmi || 0,
        body_fat: formData.body_fat || 0,
        muscle_mass: formData.muscle_mass || 0,
        bmr: formData.bmr || 0,
        water: formData.water || 0,
        body_fat_mass: formData.body_fat_mass || 0,
        lean_body_mass: formData.lean_body_mass || 0,
        bone_mass: formData.bone_mass || 0,
        visceral_fat: formData.visceral_fat || 0,
        protein: formData.protein || 0,
        skeletal_muscle_mass: formData.skeletal_muscle_mass || 0,
        subcutaneous_fat: formData.subcutaneous_fat || 0,
        body_age: formData.body_age || 0,
        body_type: formData.body_type || ''
      }

      const validationResult = fitnessDataSchema.safeParse(validationData)

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors
        setFieldErrors(errors as Partial<Record<keyof FitnessDataFormData, string>>)
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
        .from('fitness_data')
        .insert({
          user_id: user.id,
          date: formData.date,
          weight: formData.weight,
          bmi: formData.bmi,
          body_fat: formData.body_fat,
          muscle_mass: formData.muscle_mass,
          bmr: formData.bmr,
          water: formData.water,
          body_fat_mass: formData.body_fat_mass,
          lean_body_mass: formData.lean_body_mass,
          bone_mass: formData.bone_mass,
          visceral_fat: formData.visceral_fat,
          protein: formData.protein,
          skeletal_muscle_mass: formData.skeletal_muscle_mass,
          subcutaneous_fat: formData.subcutaneous_fat,
          body_age: formData.body_age,
          body_type: formData.body_type
        })

      if (error) {
        // Error handling without console logging
        
        // Provide more specific error information
        let errorMessage = 'Error saving fitness data. Please try again.'
        
        if (error.message) {
          errorMessage += ` Details: ${error.message}`
        }
        
        if (error.details) {
          errorMessage += ` (${error.details})`
        }
        
        alert(errorMessage)
      } else {
        // Show success message
        alert('Fitness data saved successfully! 💪')
        
        // Reset form and refresh data
        setFormData({
          date: '',
          weight: 0,
          bmi: 0,
          body_fat: 0,
          muscle_mass: 0,
          bmr: 0,
          water: 0,
          body_fat_mass: 0,
          lean_body_mass: 0,
          bone_mass: 0,
          visceral_fat: 0,
          protein: 0,
          skeletal_muscle_mass: 0,
          subcutaneous_fat: 0,
          body_age: 0,
          body_type: ''
        })
        setShowForm(false)
        
        // Refresh fitness data
        const { data: refreshedData } = await supabase
          .from('fitness_data')
          .select('id, date, weight, bmi, body_fat, muscle_mass, bmr, water, body_fat_mass, lean_body_mass, bone_mass, visceral_fat, protein, skeletal_muscle_mass, subcutaneous_fat, body_age, body_type, created_at')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
        
        setFitnessData(refreshedData || [])
      }
    } catch (err) {
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fitness entry?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('fitness_data')
        .delete()
        .eq('id', id)

      if (error) {
        // Error handling without console logging
      } else {
        setFitnessData(prev => prev.filter(data => data.id !== id))
      }
    } catch (err) {
      // Error handling without console logging
    }
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredFitnessData(fitnessData)
      return
    }
    const lowerQuery = query.toLowerCase()
    const filtered = fitnessData.filter(data =>
      data.date.includes(lowerQuery) ||
      data.body_type.toLowerCase().includes(lowerQuery) ||
      String(data.weight).includes(lowerQuery) ||
      String(data.bmi).includes(lowerQuery)
    )
    setFilteredFitnessData(filtered)
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
                    item.path === '/fitness'
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
            placeholder="Search fitness data by date, body type, weight, or BMI..."
          />

          <div className="p-8">
            <div className={`max-w-6xl mx-auto ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
              
              {/* Header */}
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Fitness Data</h1>
                    <p className="text-gray-300 text-lg">Track your fitness activities and health metrics</p>
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
                      {showForm ? 'Cancel' : '+ Add Fitness Entry'}
                    </button>
                  </div>
                </div>
              </div>

            {/* Fitness Data Form */}
            {showForm && (
              <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Add Fitness Entry</h2>
                
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
                      <label htmlFor="weight" className="block text-sm font-semibold text-gray-200 mb-2">
                        Weight (KG)
                      </label>
                      <input
                        type="number"
                        id="weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        required
                        step="0.1"
                        className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.weight ? 'border-red-500' : 'border-slate-600'}`}
                        placeholder="Enter weight"
                      />
                      {fieldErrors.weight && (
                        <p className="mt-1 text-sm text-red-400">{fieldErrors.weight}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="bmi" className="block text-sm font-semibold text-gray-200 mb-2">
                        BMI
                      </label>
                      <input
                        type="number"
                        id="bmi"
                        name="bmi"
                        value={formData.bmi}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter BMI"
                      />
                    </div>

                    <div>
                      <label htmlFor="body_fat" className="block text-sm font-semibold text-gray-200 mb-2">
                        Body Fat (%)
                      </label>
                      <input
                        type="number"
                        id="body_fat"
                        name="body_fat"
                        value={formData.body_fat}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter body fat percentage"
                      />
                    </div>

                    <div>
                      <label htmlFor="muscle_mass" className="block text-sm font-semibold text-gray-200 mb-2">
                        Muscle Mass (KG)
                      </label>
                      <input
                        type="number"
                        id="muscle_mass"
                        name="muscle_mass"
                        value={formData.muscle_mass}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter muscle mass"
                      />
                    </div>

                    <div>
                      <label htmlFor="bmr" className="block text-sm font-semibold text-gray-200 mb-2">
                        BMR (KCAL)
                      </label>
                      <input
                        type="number"
                        id="bmr"
                        name="bmr"
                        value={formData.bmr}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter BMR"
                      />
                    </div>

                    <div>
                      <label htmlFor="water" className="block text-sm font-semibold text-gray-200 mb-2">
                        Water (%)
                      </label>
                      <input
                        type="number"
                        id="water"
                        name="water"
                        value={formData.water}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter water percentage"
                      />
                    </div>

                    <div>
                      <label htmlFor="body_fat_mass" className="block text-sm font-semibold text-gray-200 mb-2">
                        Body Fat Mass (KG)
                      </label>
                      <input
                        type="number"
                        id="body_fat_mass"
                        name="body_fat_mass"
                        value={formData.body_fat_mass}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter body fat mass"
                      />
                    </div>

                    <div>
                      <label htmlFor="lean_body_mass" className="block text-sm font-semibold text-gray-200 mb-2">
                        Lean Body Mass (KG)
                      </label>
                      <input
                        type="number"
                        id="lean_body_mass"
                        name="lean_body_mass"
                        value={formData.lean_body_mass}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter lean body mass"
                      />
                    </div>

                    <div>
                      <label htmlFor="bone_mass" className="block text-sm font-semibold text-gray-200 mb-2">
                        Bone Mass (KG)
                      </label>
                      <input
                        type="number"
                        id="bone_mass"
                        name="bone_mass"
                        value={formData.bone_mass}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter bone mass"
                      />
                    </div>

                    <div>
                      <label htmlFor="visceral_fat" className="block text-sm font-semibold text-gray-200 mb-2">
                        Visceral Fat
                      </label>
                      <input
                        type="number"
                        id="visceral_fat"
                        name="visceral_fat"
                        value={formData.visceral_fat}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter visceral fat"
                      />
                    </div>

                    <div>
                      <label htmlFor="protein" className="block text-sm font-semibold text-gray-200 mb-2">
                        Protein (%)
                      </label>
                      <input
                        type="number"
                        id="protein"
                        name="protein"
                        value={formData.protein}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter protein percentage"
                      />
                    </div>

                    <div>
                      <label htmlFor="skeletal_muscle_mass" className="block text-sm font-semibold text-gray-200 mb-2">
                        Skeletal Muscle Mass (KG)
                      </label>
                      <input
                        type="number"
                        id="skeletal_muscle_mass"
                        name="skeletal_muscle_mass"
                        value={formData.skeletal_muscle_mass}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter skeletal muscle mass"
                      />
                    </div>

                    <div>
                      <label htmlFor="subcutaneous_fat" className="block text-sm font-semibold text-gray-200 mb-2">
                        Subcutaneous Fat (%)
                      </label>
                      <input
                        type="number"
                        id="subcutaneous_fat"
                        name="subcutaneous_fat"
                        value={formData.subcutaneous_fat}
                        onChange={handleInputChange}
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter subcutaneous fat percentage"
                      />
                    </div>

                    <div>
                      <label htmlFor="body_age" className="block text-sm font-semibold text-gray-200 mb-2">
                        Body Age
                      </label>
                      <input
                        type="number"
                        id="body_age"
                        name="body_age"
                        value={formData.body_age}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                        placeholder="Enter body age"
                      />
                    </div>

                    <div>
                      <label htmlFor="body_type" className="block text-sm font-semibold text-gray-200 mb-2">
                        Body Type
                      </label>
                      <select
                        id="body_type"
                        name="body_type"
                        value={formData.body_type}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all appearance-none cursor-pointer ${fieldErrors.body_type ? 'border-red-500' : 'border-slate-600'}`}
                      >
                        <option value="">Select body type</option>
                        <option value="ectomorph">Ectomorph</option>
                        <option value="mesomorph">Mesomorph</option>
                        <option value="endomorph">Endomorph</option>
                      </select>
                      {fieldErrors.body_type && (
                        <p className="mt-1 text-sm text-red-400">{fieldErrors.body_type}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-600 text-gray-900 font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Fitness Entry'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Fitness Data List */}
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Fitness History</h2>
              
              {filteredFitnessData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-300 text-lg">No fitness data recorded yet.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-xl"
                  >
                    Add Fitness Entry
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="px-4 py-3 text-gray-200 font-semibold">Date</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Weight (KG)</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">BMI</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Body Fat (%)</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Muscle Mass (KG)</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Body Type</th>
                        <th className="px-4 py-3 text-gray-200 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFitnessData.map((data) => (
                        <tr key={data.id} className="border-b border-slate-700 hover:bg-slate-700">
                          <td className="px-4 py-3 text-gray-300">{data.date}</td>
                          <td className="px-4 py-3 text-gray-300">{data.weight}</td>
                          <td className="px-4 py-3 text-gray-300">{data.bmi}</td>
                          <td className="px-4 py-3 text-gray-300">{data.body_fat}</td>
                          <td className="px-4 py-3 text-gray-300">{data.muscle_mass}</td>
                          <td className="px-4 py-3 text-gray-300">
                            <span className="px-2 py-1 bg-green-500 bg-opacity-20 text-green-400 rounded text-sm">
                              {data.body_type ? data.body_type.charAt(0).toUpperCase() + data.body_type.slice(1) : 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            <button
                              onClick={() => handleDelete(data.id!)}
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
    </div>
  )
}
