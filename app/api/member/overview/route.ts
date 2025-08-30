import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const [{ data: payments }, { data: teamRef }, { data: botRef }, { data: upcoming }] = await Promise.all([
    supabase.from("payments").select("amount, status").eq("user_id", user.id).eq("status", "approved"),
    supabase.from("team_members").select("team:teams(id, name)").eq("user_id", user.id).limit(1).maybeSingle(),
    supabase.from("bots").select("id, name").eq("owner_id", user.id).limit(1).maybeSingle(),
    supabase
      .from("competitions")
      .select("id, name, start_date")
      .eq("status", "active")
      .order("start_date", { ascending: true })
      .limit(5),
  ])

  const paid = (payments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)
  const target = 1000
  const pending = Math.max(target - paid, 0)

  return NextResponse.json({
    fees: { paid, pending },
    team: teamRef?.team ?? null,
    bot: botRef ?? null,
    upcoming: upcoming ?? [],
  })
}
