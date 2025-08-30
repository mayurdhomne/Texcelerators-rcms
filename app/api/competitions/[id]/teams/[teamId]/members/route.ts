import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => cookieStore.set({ name, value, ...options }),
      remove: (name, options) => cookieStore.set({ name, value: "", ...options, maxAge: 0 }),
    },
  })
}

export async function GET(_: Request, { params }: { params: { teamId: string } }) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("team_members")
    .select("user_id, role, joined_at")
    .eq("team_id", params.teamId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members: data })
}

export async function POST(req: Request, { params }: { params: { teamId: string } }) {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const targetUserId = String(body.user_id || user.id)

  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: params.teamId, user_id: targetUserId, role: "member" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: { teamId: string } }) {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const removeUserId = searchParams.get("user_id") || user.id

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", params.teamId)
    .eq("user_id", removeUserId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
