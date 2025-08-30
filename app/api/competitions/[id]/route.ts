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
    .from("competitions")
    .select("*, teams(*, team_members(count)), competition_results(*)")
    .eq("id", params.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ competition: data })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle()
  const role = profile?.role
  if (!role || !["admin", "faculty"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const update = {
    title: body.title,
    description: body.description,
    location: body.location,
    start_date: body.start_date,
    end_date: body.end_date,
    open_for_registration: body.open_for_registration,
    archived: body.archived,
  }

  const { data, error } = await supabase
    .from("competitions")
    .update(update)
    .eq("id", params.id)
    .select("*")
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ competition: data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  // soft archive instead of hard delete
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle()
  const role = profile?.role
  if (!role || !["admin", "faculty"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { error } = await supabase.from("competitions").update({ archived: true }).eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
