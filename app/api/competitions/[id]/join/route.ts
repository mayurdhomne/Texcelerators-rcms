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

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const teamId: string | undefined = body.team_id
  const teamName: string | undefined = body.team_name

  if (teamId) {
    const { error } = await supabase.from("team_members").insert({ team_id: teamId, user_id: user.id, role: "member" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  const name = (teamName || "Solo Team").trim()
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .insert({ competition_id: params.id, name, created_by: user.id })
    .select("*")
    .single()
  if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 })

  await supabase.from("team_members").insert({ team_id: team.id, user_id: user.id, role: "captain" })
  return NextResponse.json({ team }, { status: 201 })
}
