import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Anon client — subject to RLS policies
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client — bypasses RLS, use only in server API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
