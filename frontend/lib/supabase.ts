import { createClient } from "@supabase/supabase-js"

// Fallback values prevent build-time crash when env vars aren't set locally.
// Real values are injected by Vercel at runtime via environment variables.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
