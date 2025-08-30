import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.from("inventory_parts").select("*").order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ parts: data ?? [] })
}

export async function POST(req: Request) {
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
    name: String(body.name || "").trim(),
    sku: String(body.sku || "").trim() || null,
    unit: String(body.unit || "").trim() || null,
    quantity: typeof body.quantity === "number" ? body.quantity : Number(body.quantity || 0),
  }
  if (!payload.name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const { data, error } = await supabase.from("inventory_parts").insert(payload).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ part: data }, { status: 201 })
}
