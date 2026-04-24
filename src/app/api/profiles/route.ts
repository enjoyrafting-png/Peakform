import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Regular client for authentication checks
const supabase = createClient(supabaseUrl, supabaseAnonKey)
// Service role client for admin operations (only if available)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase

async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-access-token')?.value
    
    if (!token) {
      return null
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return user
  } catch {
    return null
  }
}

async function isAdminUser(userId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return false
    }

    return profile.role === 'admin'
  } catch {
    return false
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isAdminUser(user.id)
    
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden - admin access required' }, { status: 403 })
    }

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')

    if (error) {
      console.error('Error fetching profiles:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ profiles })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await isAdminUser(user.id)
    
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden - admin access required' }, { status: 403 })
    }

    const { athleteId, coachId } = await request.json()

    if (!athleteId) {
      return Response.json({ error: 'athleteId is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ coach_id: coachId || null })
      .eq('id', athleteId)

    if (error) {
      console.error('Error updating profile:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
