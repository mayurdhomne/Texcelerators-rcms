import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getServerSupabase()
  const [{ count: members }, { count: comps }, { data: expenses }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("competitions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("expenses").select("amount, created_at"),
  ])
  const expense = (expenses ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  return NextResponse.json({
    totalMembers: members ?? 0,
    activeCompetitions: comps ?? 0,
    expense,
  })
}
