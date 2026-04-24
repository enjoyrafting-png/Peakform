import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ profiles })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
