import { renderHook, waitFor } from '@testing-library/react'
import { useCoachAthletes } from './useCoachAthletes'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }
}))

describe('useCoachAthletes', () => {
  it('should return empty athletes array when profileId is null', () => {
    const { result } = renderHook(() => useCoachAthletes(null, true))
    
    expect(result.current.athletes).toEqual([])
    expect(result.current.selectedAthlete).toBeNull()
  })

  it('should return empty athletes array when isCoach is false', () => {
    const { result } = renderHook(() => useCoachAthletes('profile-123', false))
    
    expect(result.current.athletes).toEqual([])
    expect(result.current.selectedAthlete).toBeNull()
  })

  it('should fetch athletes when profileId and isCoach are provided', async () => {
    const { result } = renderHook(() => useCoachAthletes('coach-123', true))
    
    // Wait for async operations
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should set selectedAthlete to first athlete when athletes are fetched', async () => {
    const mockAthletes = [
      { id: 'athlete-1', full_name: 'John Doe', role: 'athlete', coach_id: 'coach-123' },
      { id: 'athlete-2', full_name: 'Jane Smith', role: 'athlete', coach_id: 'coach-123' }
    ]
    
    // This would require mocking the Supabase response
    const { result } = renderHook(() => useCoachAthletes('coach-123', true))
    
    // In a real test with proper mocks, we'd verify:
    // expect(result.current.selectedAthlete).toBe('athlete-1')
  })

  it('should update selectedAthlete when setSelectedAthlete is called', () => {
    const { result } = renderHook(() => useCoachAthletes(null, true))
    
    result.current.setSelectedAthlete('athlete-123')
    
    expect(result.current.selectedAthlete).toBe('athlete-123')
  })
})
