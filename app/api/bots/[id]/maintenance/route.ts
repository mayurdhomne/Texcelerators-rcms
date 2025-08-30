import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("maintenance_logs")
    .select("*")
    .eq("bot_id", params.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ logs: data ?? [] })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (!profile || !["admin", "faculty"].includes(profile.role as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const payload = {
    bot_id: params.id,
    cost: typeof body.cost === "number" ? body.cost : Number(body.cost || 0),
    note: String(body.note || "").trim() || null,
  }

  const { data, error } = await supabase.from("maintenance_logs").insert(payload).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ log: data }, { status: 201 })
}
