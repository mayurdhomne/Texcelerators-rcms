import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if ((me?.role as string) !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const memberId = (body?.memberId ?? "").toString()
  const amount = Number(body?.amount ?? 0)
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 })
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 })

  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: memberId,
      amount,
      mode: "cash",
      transaction_id: null,
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: data?.id })
}
