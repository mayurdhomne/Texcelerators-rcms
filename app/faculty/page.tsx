"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function FacultyOverview() {
  const { data } = useSWR("/api/faculty/overview", fetcher)

  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Members" value={data?.totalMembers ?? 0} />
        <Stat title="Active Competitions" value={data?.activeCompetitions ?? 0} />
        <Stat title="This Month Expenses" value={`₹${data?.expense ?? 0}`} />
      </section>
    </div>
  )
}

function Stat({ title, value }: { title: string; value: number | string }) {
  return (
    <Card className="bg-[var(--card)] border border-[var(--border)] rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  )
}
