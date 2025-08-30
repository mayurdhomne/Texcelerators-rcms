"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

type Summary = {
  totals: {
    members: number
    competitions: number
    bots: number
    inventoryItems: number
    income: number
    expense: number
    maintenance: number
    net: number
  }
  series: { month: string; income: number; expense: number }[]
  competitionsByStatus: Record<string, number>
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ReportsPage() {
  const { data, error, isLoading } = useSWR<Summary>("/api/reports/summary", fetcher)

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h2 className="text-xl font-semibold text-pretty">Reports & Analytics</h2>
        <p className="text-sm text-muted-foreground">Key metrics and trends across your club.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Members" value={data?.totals.members ?? 0} />
        <StatCard title="Competitions" value={data?.totals.competitions ?? 0} />
        <StatCard title="Bots" value={data?.totals.bots ?? 0} />
        <StatCard title="Inventory Items" value={data?.totals.inventoryItems ?? 0} />
        <StatCard title="Income (₹)" value={data?.totals.income ?? 0} />
        <StatCard title="Expense + Maint. (₹)" value={(data?.totals.expense ?? 0) + (data?.totals.maintenance ?? 0)} />
        <StatCard
          title="Net (₹)"
          value={data ? data.totals.net : 0}
          badge={data && data.totals.net >= 0 ? "positive" : "negative"}
        />
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-base">Income vs Expense (Last 6 months)</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 320 }}>
          {isLoading && <p className="text-sm text-muted-foreground">Loading chart…</p>}
          {error && <p className="text-sm text-red-500">Failed to load data.</p>}
          {!isLoading && !error && data && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.series} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" name="Income" fill="hsl(var(--primary))" />
                <Bar dataKey="expense" name="Expense" fill="hsl(var(--muted-foreground))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-base">Competitions by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {error && <p className="text-sm text-red-500">Failed to load data.</p>}
          {!isLoading && !error && data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.competitionsByStatus).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-[var(--border)] px-3 py-2">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium capitalize">{k}</p>
                  <p className="text-xs mt-1">Count: {v}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, badge }: { title: string; value: number; badge?: "positive" | "negative" }) {
  return (
    <Card className="border-[var(--border)] bg-[var(--card)]">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        {badge && <Badge variant={badge === "positive" ? "default" : "destructive"}>{badge}</Badge>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  )
}
