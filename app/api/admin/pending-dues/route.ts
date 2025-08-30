import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

const MEMBERSHIP_TARGET = 1000 // INR; adjust as needed or move to settings table

export async function GET() {
  const supabase = getServerSupabase()
  const { data: profiles } = await supabase.from("profiles").select("id, full_name")
  const { data: payments } = await supabase.from("payments").select("user_id, amount, status").eq("status", "approved")

  const paidByUser = new Map<string, number>()
  for (const p of payments ?? []) {
    paidByUser.set(p.user_id, (paidByUser.get(p.user_id) ?? 0) + (p.amount ?? 0))
  }

  const items = (profiles ?? [])
    .map((m) => {
      const paid = paidByUser.get(m.id) ?? 0
      const due = Math.max(MEMBERSHIP_TARGET - paid, 0)
      return { member_id: m.id, name: m.full_name ?? "Member", due }
    })
    .filter((x) => x.due > 0)
    .slice(0, 10)

  return NextResponse.json({ items })
}
