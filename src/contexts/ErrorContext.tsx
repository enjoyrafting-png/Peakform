'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ErrorContextType {
  showError: (message: string) => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null)

  const showError = (message: string) => {
    setError(message)
  }

  const handleClose = () => {
    setError(null)
  }

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleClose}></div>
          <div className="relative bg-slate-800 bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-600 w-full max-w-md p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Error in Peakform</h3>
              <p className="text-gray-300 mb-6">{error}</p>
              <button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}
