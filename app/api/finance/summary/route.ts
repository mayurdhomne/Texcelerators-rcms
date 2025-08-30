import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getServerSupabase()

  const { data: membersCount } = await supabase.from("profiles").select("id", { count: "exact", head: true })
  const { data: activeComps } = await supabase
    .from("competitions")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")

  // Example aggregation placeholders
  return NextResponse.json({
    totalMembers: membersCount?.length ?? 0,
    activeCompetitions: activeComps?.length ?? 0,
    incomeMonthly: [],
    expenseMonthly: [],
    pendingDues: 0,
  })
}
