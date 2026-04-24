'use client'

import { useState, useEffect, useRef } from 'react'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (type: 'positive' | 'improvement', message: string) => void
}

export default function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<'positive' | 'improvement'>('positive')
  const [message, setMessage] = useState('')
  const [charCount, setCharCount] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const maxLength = 500
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          }
        }
        if (finalTranscript) {
          setMessage(prev => {
            const newValue = prev + finalTranscript
            return newValue.length > maxLength ? newValue.slice(0, maxLength) : newValue
          })
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [maxLength])

  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const enhanceWithAI = async () => {
    if (!message.trim()) return

    setIsEnhancing(true)
    try {
      console.log('Original message:', message)
      // Simple AI enhancement - condense and make professional
      const enhanced = await fetch('/api/enhance-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      }).then(res => res.json())
      .then(data => {
        console.log('Enhanced message:', data.enhanced)
        return data.enhanced || message
      })
      .catch((error) => {
        console.error('Enhancement error:', error)
        // Fallback: simple truncation and cleanup
        return message
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, maxLength)
      })

      setMessage(enhanced)
      setCharCount(enhanced.length)
    } catch (err) {
      console.error('Enhancement error:', err)
      // Fallback enhancement
      const cleaned = message.replace(/\s+/g, ' ').trim().slice(0, maxLength)
      setMessage(cleaned)
      setCharCount(cleaned.length)
    } finally {
      setIsEnhancing(false)
    }
  }

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSubmit(feedbackType, message.trim())
      setMessage('')
      setCharCount(0)
      onClose()
    }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setMessage(value)
      setCharCount(value.length)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-800 bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-600 w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Share Your Feedback</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 font-semibold mb-3">What type of feedback would you like to share?</label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="feedbackType"
                  value="positive"
                  checked={feedbackType === 'positive'}
                  onChange={(e) => setFeedbackType(e.target.value as 'positive' | 'improvement')}
                  className="w-5 h-5 text-yellow-400 bg-slate-700 border-slate-600 focus:ring-yellow-400 focus:ring-offset-slate-800"
                />
                <span className="text-gray-300">Happy to know your positive feedback</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="feedbackType"
                  value="improvement"
                  checked={feedbackType === 'improvement'}
                  onChange={(e) => setFeedbackType(e.target.value as 'positive' | 'improvement')}
                  className="w-5 h-5 text-yellow-400 bg-slate-700 border-slate-600 focus:ring-yellow-400 focus:ring-offset-slate-800"
                />
                <span className="text-gray-300">Go in to suggest some improvements</span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="feedbackMessage" className="block text-gray-300 font-semibold mb-3">
              Your Feedback
            </label>
            <div className="relative">
              <textarea
                id="feedbackMessage"
                value={message}
                onChange={handleMessageChange}
                placeholder="Please share your feedback here..."
                className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg p-3 pr-24 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                maxLength={maxLength}
              />
              <div className="absolute top-2 right-2 flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2 rounded-lg transition-all ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'bg-slate-600 hover:bg-slate-500 text-gray-300'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={enhanceWithAI}
                  disabled={isEnhancing || !message.trim()}
                  className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Enhance with AI"
                >
                  {isEnhancing ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-gray-400 text-sm">Maximum 500 characters</span>
              <span className={`text-sm ${charCount >= maxLength ? 'text-red-400' : 'text-gray-400'}`}>
                {charCount}/{maxLength}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
