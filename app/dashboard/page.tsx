"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminDashboardPage() {
  const { data: stats } = useSWR("/api/admin/stats", fetcher)
  const { data: chart } = useSWR("/api/admin/income-expense", fetcher)
  const { data: dues } = useSWR("/api/admin/pending-dues", fetcher)

  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Members" value={stats?.totalMembers ?? 0} />
        <StatCard title="Active Competitions" value={stats?.activeCompetitions ?? 0} />
        <StatCard title="Income (MoM)" value={`₹${stats?.income ?? 0}`} />
        <StatCard title="Pending Dues" value={`₹${stats?.pendingDues ?? 0}`} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <CardHeader>
            <CardTitle>Income vs Expense</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart ?? []}>
                <CartesianGrid stroke="#2a2e3a" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#6b21a8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <CardHeader>
            <CardTitle>Pending Dues</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm grid gap-2">
              {(dues?.items ?? []).map((d: any) => (
                <li key={d.member_id} className="flex items-center justify-between">
                  <span>{d.name}</span>
                  <span className="text-muted-foreground">₹{d.due}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card className="bg-[var(--card)] border border-[var(--border)] rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  )
}
