import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.from("bots").select("*").eq("id", params.id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ bot: data })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
  const update = {
    name: body.name,
    type: body.type,
    owner_id: body.owner_id,
    assigned_team: body.assigned_team ?? null,
  }

  const { data, error } = await supabase.from("bots").update(update).eq("id", params.id).select("*").maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ bot: data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (!profile || !["admin", "faculty"].includes(profile.role as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await supabase.from("bots").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
