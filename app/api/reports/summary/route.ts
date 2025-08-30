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

type RowWithCreatedAt = { created_at: string | null } & Record<string, any>

function monthKey(d: Date) {
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  return `${y}-${m.toString().padStart(2, "0")}`
}

function getLastNMonthKeys(n: number) {
  const out: string[] = []
  const now = new Date()
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - i, 1))
    out.push(monthKey(d))
  }
  return out
}

export async function GET() {
  const supabase = getSupabase()

  // Load tables we need; filter for approved where applicable
  const [{ data: payments, error: payErr }, { data: expenses, error: expErr }] = await Promise.all([
    supabase.from("payments").select("amount, status, created_at"),
    supabase.from("expenses").select("amount, status, created_at"),
  ])
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })
  if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 })

  const [{ data: profiles, error: profErr }, { data: comps, error: compErr }] = await Promise.all([
    supabase.from("profiles").select("id"),
    supabase.from("competitions").select("id, status, created_at"),
  ])
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })
  if (compErr) return NextResponse.json({ error: compErr.message }, { status: 500 })

  const [{ data: bots, error: botsErr }, { data: maintenance, error: maintErr }] = await Promise.all([
    supabase.from("bots").select("id"),
    supabase.from("maintenance_logs").select("cost, created_at"),
  ])
  if (botsErr) return NextResponse.json({ error: botsErr.message }, { status: 500 })
  if (maintErr) return NextResponse.json({ error: maintErr.message }, { status: 500 })

  const [{ data: parts, error: partsErr }] = await Promise.all([supabase.from("inventory_parts").select("quantity")])
  if (partsErr) return NextResponse.json({ error: partsErr.message }, { status: 500 })

  // Totals
  const totalMembers = profiles?.length ?? 0
  const totalCompetitions = comps?.length ?? 0
  const totalBots = bots?.length ?? 0
  const inventoryItems = (parts ?? []).reduce((sum, p: any) => sum + (p.quantity ?? 0), 0)

  const approvedPayments = (payments ?? []).filter((p: any) => (p.status || "").toLowerCase() === "approved")
  const approvedExpenses = (expenses ?? []).filter((e: any) => (e.status || "").toLowerCase() === "approved")

  const totalIncome = approvedPayments.reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)
  const totalExpense = approvedExpenses.reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0)
  const totalMaintenance = (maintenance ?? []).reduce((sum: number, r: any) => sum + (r.cost ?? 0), 0)

  // 6-month series
  const months = getLastNMonthKeys(6)
  const series = months.map((key) => ({ month: key, income: 0, expense: 0 }))

  function bucket(rows: RowWithCreatedAt[], field: "income" | "expense") {
    for (const r of rows) {
      if (!r.created_at) continue
      const d = new Date(r.created_at)
      const key = monthKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)))
      const item = series.find((s) => s.month === key)
      if (item) {
        item[field] += (r as any).amount ?? 0
      }
    }
  }
  bucket(approvedPayments as any, "income")
  bucket(approvedExpenses as any, "expense")

  // Competition distribution by status
  const compByStatus: Record<string, number> = {}
  for (const c of comps ?? []) {
    const s = (c.status || "unknown").toLowerCase()
    compByStatus[s] = (compByStatus[s] ?? 0) + 1
  }

  return NextResponse.json({
    totals: {
      members: totalMembers,
      competitions: totalCompetitions,
      bots: totalBots,
      inventoryItems,
      income: totalIncome,
      expense: totalExpense,
      maintenance: totalMaintenance,
      net: totalIncome - totalExpense - totalMaintenance,
    },
    series, // last 6 months
    competitionsByStatus: compByStatus,
  })
}
