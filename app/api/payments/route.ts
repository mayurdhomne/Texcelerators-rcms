import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  const { amount, mode, transaction_id } = body as {
    amount: number
    mode: "online" | "cash"
    transaction_id?: string
  }

  // member can create "online" submission (pending). cash requires admin; enforced by RLS.
  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      amount,
      mode,
      transaction_id: transaction_id ?? null,
      status: mode === "online" ? "pending" : "approved", // cash should be inserted by admin normally
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
