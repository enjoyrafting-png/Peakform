'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Profile {
  full_name: string | null
  age: string | null
  playing_role: string | null
  batting_style: string | null
  bowling_style: string | null
  photo: string | null
  team: string | null
  experience: string | null
  goals: string | null
}

interface ProfileVerificationProps {
  profile: Profile
  onConfirm: () => void
  onEdit: () => void
}

export default function ProfileVerification({ profile, onConfirm, onEdit }: ProfileVerificationProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    // Simulate confirmation process
    setTimeout(() => {
      onConfirm()
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Profile</h2>
          <p className="text-gray-600 text-lg">Please confirm your profile information is correct or edit if needed.</p>
        </div>
        
        {/* Profile Information */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-400 text-gray-900 rounded-lg p-2 mr-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-800">Full Name:</span>
                  <span className="ml-2 text-gray-900">{profile.full_name || 'Not set'}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-800">Age:</span>
                  <span className="ml-2 text-gray-900">{profile.age || 'Not set'}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-800">Playing Role:</span>
                  <span className="ml-2 text-gray-900">{profile.playing_role || 'Not set'}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-800">Batting Style:</span>
                  <span className="ml-2 text-gray-900">{profile.batting_style || 'Not set'}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-800">Bowling Style:</span>
                  <span className="ml-2 text-gray-900">{profile.bowling_style || 'Not set'}</span>
                </div>
              </div>
            </div>
            
            {/* Athletic Information */}
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 text-white rounded-lg p-2 mr-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Athletic Information</h3>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-800">Team:</span>
                  <span className="ml-2 text-gray-900">{profile.team || 'Not set'}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-800">Experience:</span>
                  <span className="ml-2 text-gray-900">{profile.experience || 'Not set'} years</span>
                </div>
                {profile.photo && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="font-semibold text-gray-800">Photo:</span>
                    <div className="mt-2">
                      <Image src={profile.photo} alt="Profile" width={80} height={80} className="w-20 h-20 rounded-full object-cover border-2 border-gray-300" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Goals Section */}
          {profile.goals && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-green-500 text-white rounded-lg p-2 mr-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2h6a1 1 0 100-2 2 2 0 00-2 2v11a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Goals & Objectives</h3>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap">{profile.goals}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onEdit}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            Edit Profile
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Confirming...
              </div>
            ) : (
              'Confirm & Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
