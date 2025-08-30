import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getServerSupabase()
  // Example monthly aggregation demo; replace with SQL view or server agg
  const { data: payments } = await supabase.from("payments").select("amount, created_at, status")
  const { data: expenses } = await supabase.from("expenses").select("amount, created_at")

  const byMonth = new Map<string, { income: number; expense: number }>()
  for (const p of payments ?? []) {
    if (p.status !== "approved") continue
    const month = (p.created_at ?? "").slice(0, 7)
    const cur = byMonth.get(month) ?? { income: 0, expense: 0 }
    cur.income += p.amount ?? 0
    byMonth.set(month, cur)
  }
  for (const e of expenses ?? []) {
    const month = (e.created_at ?? "").slice(0, 7)
    const cur = byMonth.get(month) ?? { income: 0, expense: 0 }
    cur.expense += e.amount ?? 0
    byMonth.set(month, cur)
  }
  const rows = Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, v]) => ({ month, ...v }))

  return NextResponse.json(rows)
}
