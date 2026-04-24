import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Regular client for authentication checks
const supabase = createClient(supabaseUrl, supabaseAnonKey)
// Service role client for admin operations
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase

async function getCurrentUser(request: Request) {
  try {
    // First try Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (!error && user) {
        return user
      }
    }

    // Fallback to cookie-based auth
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-access-token')?.value ||
                  cookieStore.get('sb:token')?.value ||
                  cookieStore.get('supabase-auth-token')?.value
    
    if (!token) {
      return null
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return user
  } catch (err) {
    console.error('getCurrentUser error:', err)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('profile-photos')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return Response.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    return Response.json({ url: publicUrl })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
