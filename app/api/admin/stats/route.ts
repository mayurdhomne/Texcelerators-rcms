import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getServerSupabase()

  const [{ count: members }, { count: activeCompetitions }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "faculty"),
    supabase.from("competitions").select("id", { count: "exact", head: true }).eq("status", "active"),
  ])

  // Simplified placeholders; extend with real sums
  const { data: incomeRows } = await supabase.from("payments").select("amount, status").eq("status", "approved")
  const income = (incomeRows ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)

  const { data: expensesRows } = await supabase.from("expenses").select("amount")
  const expense = (expensesRows ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)

  const pendingDues = Math.max(income - expense, 0) // placeholder

  return NextResponse.json({
    totalMembers: members ?? 0,
    activeCompetitions: activeCompetitions ?? 0,
    income,
    pendingDues,
  })
}
