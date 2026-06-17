// src/lib/supabase/client.ts
// Browser-side Supabase client (anon key, respects RLS)
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => createClientComponentClient()
