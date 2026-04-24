import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Try to use service role key if available, otherwise fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data: profiles, error } = await supabase
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
    const { athleteId, coachId } = await request.json()

    if (!athleteId) {
      return Response.json({ error: 'athleteId is required' }, { status: 400 })
    }

    const { error } = await supabase
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
