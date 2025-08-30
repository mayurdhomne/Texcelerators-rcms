import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET() {
  // Payment history for current user
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, mode, transaction_id, status, created_at, approved_at, approved_by")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: Request) {
  // Submit an online payment for approval (transaction ID)
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const amount = Number(body?.amount ?? 0)
  const transactionId = (body?.transactionId ?? "").toString().trim()

  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  if (!transactionId) return NextResponse.json({ error: "Transaction ID required" }, { status: 400 })

  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      amount,
      mode: "online",
      transaction_id: transactionId,
      status: "pending",
    })
    .select("id")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: data?.id })
}
