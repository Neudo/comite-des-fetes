import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Variables Supabase manquantes. Copie .env.example en .env et remplis les valeurs.',
  )
}

export const supabase = createClient(url, anonKey)
