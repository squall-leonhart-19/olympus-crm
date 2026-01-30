import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Only create client if configured, otherwise use null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Auth helpers - these return early if Supabase isn't configured
export const signUp = async (email, password, name) => {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }

  // Get the current origin for redirect (works for both localhost and production)
  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/login`
    : undefined

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: redirectUrl
    }
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  if (!supabase) return { error: null }
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const onAuthStateChange = (callback) => {
  if (!supabase) {
    // Return a no-op unsubscribe function for demo mode
    return { data: { subscription: { unsubscribe: () => { } } } }
  }
  return supabase.auth.onAuthStateChange(callback)
}
