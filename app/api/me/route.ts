import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ user: null }, { status: 200 })

  // profiles columns per live schema: id, full_name, role, ...
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle()

  return NextResponse.json({
    user,
    role: profile?.role ?? "member",
    profile,
  })
}
