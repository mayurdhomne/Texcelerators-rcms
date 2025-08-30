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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("teams")
    .select("*, team_members(user_id, role)")
    .eq("competition_id", params.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ teams: data })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const name = String(body.name || "").trim()
  if (!name) return NextResponse.json({ error: "Team name is required" }, { status: 400 })

  const { data: team, error } = await supabase
    .from("teams")
    .insert({ competition_id: params.id, name, created_by: user.id })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // auto-join creator as captain
  await supabase.from("team_members").insert({ team_id: team.id, user_id: user.id, role: "captain" })
  return NextResponse.json({ team }, { status: 201 })
}
