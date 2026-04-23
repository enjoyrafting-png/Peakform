import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // Simple AI enhancement logic
    let enhanced = message

    // Remove extra whitespace
    enhanced = enhanced.replace(/\s+/g, ' ').trim()

    // Remove common filler words and phrases
    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'really', 'just', 'sort of', 'kind of']
    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      enhanced = enhanced.replace(regex, '')
    })

    // Clean up again after removing filler words
    enhanced = enhanced.replace(/\s+/g, ' ').trim()

    // Capitalize first letter
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1)

    // Ensure it ends with proper punctuation
    if (enhanced.length > 0 && !/[.!?]$/.test(enhanced)) {
      enhanced += '.'
    }

    // Ensure it's within 500 characters
    const maxLength = 500
    if (enhanced.length > maxLength) {
      enhanced = enhanced.slice(0, maxLength - 3) + '...'
    }

    return NextResponse.json({ enhanced })
  } catch (error) {
    console.error('Error enhancing feedback:', error)
    return NextResponse.json({ error: 'Failed to enhance feedback' }, { status: 500 })
  }
}
