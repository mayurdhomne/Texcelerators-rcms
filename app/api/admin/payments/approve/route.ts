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
  const paymentId = (body?.paymentId ?? "").toString()
  const approve = Boolean(body?.approve)
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 })

  const status = approve ? "approved" : "rejected"
  const { error } = await supabase
    .from("payments")
    .update({ status, approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", paymentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, status })
}
