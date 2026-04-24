import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Try to use service role key if available, otherwise fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('API Route - Supabase URL:', supabaseUrl)
console.log('API Route - Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log('API Route - Key present:', !!supabaseKey)

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    console.log('API Route - Fetching all profiles...')
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')

    console.log('API Route - Profiles count:', profiles?.length || 0)
    console.log('API Route - Error:', error)

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
