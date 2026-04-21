import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Athlete } from '@/types'

export function useCoachAthletes(profileId: string | null, isCoach: boolean) {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAthletes = async () => {
      if (!profileId || !isCoach) {
        setAthletes([])
        setSelectedAthlete(null)
        return
      }

      setLoading(true)
      try {
        const { data: athletesData } = await supabase
          .from('profiles')
          .select('id, full_name, role, coach_id')
          .eq('coach_id', profileId)
          .eq('role', 'athlete')
        
        setAthletes(athletesData || [])
        if (athletesData && athletesData.length > 0) {
          setSelectedAthlete(athletesData[0].id)
        } else {
          setSelectedAthlete(null)
        }
      } catch (err) {
        setAthletes([])
        setSelectedAthlete(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAthletes()
  }, [profileId, isCoach])

  return {
    athletes,
    selectedAthlete,
    setSelectedAthlete,
    loading
  }
}
