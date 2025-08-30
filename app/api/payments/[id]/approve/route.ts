import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  // RLS will only allow admins to update status to approved
  const { data, error } = await supabase
    .from("payments")
    .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
