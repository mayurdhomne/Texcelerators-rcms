"use client"

import useSWR from "swr"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function MemberDashboard() {
  const { data } = useSWR("/api/member/overview", fetcher)

  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <CardHeader>
            <CardTitle>Fees</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex items-center justify-between">
              <span>Paid</span>
              <span>₹{data?.fees?.paid ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pending</span>
              <span>₹{data?.fees?.pending ?? 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <CardHeader>
            <CardTitle>Upcoming Competitions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid gap-2">
            {(data?.upcoming ?? []).map((c: any) => (
              <div key={c.id}>{c.name}</div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-[var(--card)] border border-[var(--border)] rounded-2xl">
          <CardHeader>
            <CardTitle>Assigned Team/Bot</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div>Team: {data?.team?.name ?? "-"}</div>
            <div>Bot: {data?.bot?.name ?? "-"}</div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
