'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CricketLogo from '@/components/CricketLogo'
import { useEffect } from 'react'
import { loginSchema, type LoginFormData } from '@/lib/validation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({})

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      // Validate form data
      const formData: LoginFormData = { email, password }
      const validationResult = loginSchema.safeParse(formData)

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors
        setFieldErrors(errors as Partial<Record<keyof LoginFormData, string>>)
        setError('Please fix the validation errors')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, website, role, created_at, updated_at')
        .eq('id', data.user?.id)
        .single()

      if (profileError) {
        // If profile doesn't exist, redirect to profile creation
        if (profileError.code === 'PGRST116') {
          router.push('/profile/create')
        } else {
          setError('Error checking profile: ' + profileError.message)
        }
        return
      }

      if (!profile) {
        router.push('/profile/create')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-600"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className={`max-w-md w-full space-y-8 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="text-center">
            <CricketLogo size="xl" className="mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white">
              Sign in to Peakform
            </h2>
            <p className="text-sm text-gray-400">Don&apos;t have an account?</p>
            <p className="mt-2 text-gray-300">
              Access your cricket performance dashboard
            </p>
          </div>

          <div className="bg-slate-800 bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700 p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-200 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.email ? 'border-red-500' : 'border-slate-600'}`}
                  placeholder="Enter your email"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-700 bg-opacity-50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${fieldErrors.password ? 'border-red-500' : 'border-slate-600'}`}
                  placeholder="Enter your password"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4">
                  <div className="text-red-300 text-sm">{error}</div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 transition-all transform hover:scale-105 shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link href="/auth/forgot-password" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <div className="text-center">
                <p className="text-gray-300">
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/signup" className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>&copy; 2026 Peakform. Elevate your cricket career.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
