"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let _browserSupabase: SupabaseClient | null = null

export function getBrowserSupabase() {
  if (_browserSupabase) return _browserSupabase
  _browserSupabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return _browserSupabase
}
