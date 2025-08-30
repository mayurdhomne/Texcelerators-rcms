import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

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
    sku: body.sku,
    unit: body.unit,
    quantity: typeof body.quantity === "number" ? body.quantity : body.quantity ? Number(body.quantity) : undefined,
  }

  const { data, error } = await supabase
    .from("inventory_parts")
    .update(update)
    .eq("id", params.id)
    .select("*")
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ part: data })
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

  const { error } = await supabase.from("inventory_parts").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
