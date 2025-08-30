"use client"

import useSWR from "swr"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateCompetitionForm } from "@/components/competitions/create-competition-form"
import { useToast } from "@/hooks/use-toast"

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

export default function AdminCompetitionsPage() {
  const { toast } = useToast()
  const { data, error, isLoading, mutate } = useSWR<Competition[]>("/api/competitions", fetcher)

  const onJoin = useCallback(
    async (id: string) => {
      // Admins may test join flow; backend RLS will gate it appropriately
      const res = await fetch(`/api/competitions/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_name: "Admin Solo" }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast({ title: "Join failed", description: body?.error || "Unable to join", variant: "destructive" })
      } else {
        toast({ title: "Joined competition" })
      }
    },
    [toast],
  )

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold text-pretty">Competitions</h2>
        <p className="text-sm text-muted-foreground">Create, view, and manage competitions.</p>
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
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => onJoin(c.id)}>
                      Test join
                    </Button>
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
