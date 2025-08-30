"use client"

import useSWR from "swr"
import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

export default function MemberCompetitionsPage() {
  const { toast } = useToast()
  const { data, error, isLoading } = useSWR<Competition[]>("/api/competitions", fetcher)
  const [teamName, setTeamName] = useState("")

  const onJoinSolo = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/competitions/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamName ? { team_name: teamName } : {}),
      })
      const body = await res.json()
      if (!res.ok) {
        toast({ title: "Join failed", description: body?.error || "Unable to join", variant: "destructive" })
      } else {
        toast({ title: "Joined successfully" })
        setTeamName("")
      }
    },
    [teamName, toast],
  )

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold text-pretty">Competitions</h2>
        <p className="text-sm text-muted-foreground">
          Join a competition by creating a team or joining an existing one.
        </p>
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-base">Browse</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <Input
              placeholder="Optional team name (e.g., Solo Team)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground md:ml-2">Leave empty to join as a default solo team.</p>
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">Loading competitions…</p>}
          {error && <p className="text-sm text-red-500">Failed to load competitions.</p>}
          {!isLoading && !error && (!data || data.length === 0) && (
            <p className="text-sm text-muted-foreground">No competitions available.</p>
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
                    <Button onClick={() => onJoinSolo(c.id)}>Join</Button>
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
