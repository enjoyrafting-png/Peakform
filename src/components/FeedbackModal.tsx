'use client'

import { useState } from 'react'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (type: 'positive' | 'improvement', message: string) => void
}

export default function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<'positive' | 'improvement'>('positive')
  const [message, setMessage] = useState('')
  const [charCount, setCharCount] = useState(0)
  const maxLength = 500

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
            <textarea
              id="feedbackMessage"
              value={message}
              onChange={handleMessageChange}
              placeholder="Please share your feedback here..."
              className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
              maxLength={maxLength}
            />
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
