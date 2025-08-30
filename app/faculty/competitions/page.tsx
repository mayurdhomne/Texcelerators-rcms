"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateCompetitionForm } from "@/components/competitions/create-competition-form"

type Competition = {
  id: string
  name: string
  status: string | null
  start_date: string | null
  end_date: string | null
  fee: number | null
  rules: string | null
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function FacultyCompetitionsPage() {
  const { data, error, isLoading, mutate } = useSWR<Competition[]>("/api/competitions", fetcher)

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold text-pretty">Competitions</h2>
        <p className="text-sm text-muted-foreground">Review and create competitions.</p>
      </div>

      <CreateCompetitionForm onCreated={() => mutate()} />

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-base">All Competitions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading competitions…</p>}
          {error && <p className="text-sm text-red-500">Failed to load competitions.</p>}
          {!isLoading && !error && (!data || data.length === 0) && (
            <p className="text-sm text-muted-foreground">No competitions yet.</p>
          )}
          {!isLoading && !error && data && (
            <div className="grid gap-2">
              {data.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.status || "status: n/a"} · {c.start_date || "start: n/a"} → {c.end_date || "end: n/a"} · Fee:{" "}
                      {typeof c.fee === "number" ? `₹${c.fee}` : "n/a"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
