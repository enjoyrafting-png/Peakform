'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CricketLogo from '@/components/CricketLogo'
import { useEffect } from 'react'
import { signupSchema, type SignupFormData } from '@/lib/validation'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'athlete' | 'coach' | 'admin'>('athlete')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({})

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    setFieldErrors({})

    try {
      // Validate form data
      const formData: SignupFormData = { email, password, fullName, role }
      const validationResult = signupSchema.safeParse(formData)

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors
        setFieldErrors(errors as Partial<Record<keyof SignupFormData, string>>)
        setError('Please fix the validation errors')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: window.location.origin + '/auth/login',
        },
      })

      if (error) throw error

      // Create profile immediately after successful signup
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            role: role,
          })
        
        if (profileError) {
          // Don't throw error - user account was created
          setMessage('Account created! Profile setup will be completed automatically.')
        }
      } else {
        // Check user role and redirect accordingly
        if (data.user) {
          const userId = (data.user as any).id
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()
          
          if (profileData?.role === 'athlete') {
            setMessage('Account created! Redirecting to profile creation...')
            setTimeout(() => {
              router.push('/profile/create')
            }, 2000)
          } else {
            setMessage('Account created! Please check your email to confirm your account before signing in.')
          }
        } else {
          setMessage('Account created! Please check your email to confirm your account before signing in.')
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-600"></div>
        <div className="absolute inset-0 bg-pattern"></div>
      </div>

      <div className={`max-w-md w-full space-y-8 relative z-10 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-600 rounded-full blur-xl opacity-50"></div>
              <div className="relative bg-slate-800 rounded-full p-4 border-2 border-yellow-400">
                <CricketLogo size="md" showText={false} />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Join <span className="text-yellow-400">Peakform</span>
          </h2>
          <p className="text-gray-400">
            Create your account and start your cricket journey
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSignUp}>
            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-600 text-red-300 rounded-lg p-4">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-900 bg-opacity-50 border border-green-600 text-green-300 rounded-lg p-4">
                {message}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 border bg-slate-700 bg-opacity-50 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.fullName ? 'border-red-500' : 'border-slate-600'}`}
                    placeholder="Enter your full name"
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.fullName}</p>
                )}
              </div>

              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 border bg-slate-700 bg-opacity-50 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.email ? 'border-red-500' : 'border-slate-600'}`}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 border bg-slate-700 bg-opacity-50 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.password ? 'border-red-500' : 'border-slate-600'}`}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A7.928 7.928 0 0116 16c-2.29 0-4.214-1.154-5.388-2.845A7.928 7.928 0 015 16c-2.29 0-4.214-1.154-5.388-2.845A7.928 7.928 0 012 11.57V8a2 2 0 012-2h2zm2 0a1 1 0 00-1-1H9a1 1 0 00-1 1v1h6V6zm-4 6a1 1 0 100-2 1 1 0 000 2zm2 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'athlete' | 'coach' | 'admin')}
                    required
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-slate-600 bg-slate-700 bg-opacity-50 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  >
                    <option value="athlete" className="text-gray-900 bg-slate-700">Athlete</option>
                    <option value="coach" className="text-gray-900 bg-slate-700">Coach</option>
                    <option value="admin" className="text-gray-900 bg-slate-700">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-slate-600 rounded bg-slate-700"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-400">
                I agree to the{' '}
                <a href="#" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                  Terms and Conditions
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-gray-900 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 transition-all transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                'Create Peakform Account'
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/auth/login')}
                  className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>&copy; 2026 Peakform. Elevate your cricket career.</p>
        </div>
      </div>
    </div>
  )
}
