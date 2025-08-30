"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type Bot = {
  id: string
  name: string | null
  type: string | null
  owner_id: string | null
  assigned_team: string | null
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminBotsPage() {
  const { toast } = useToast()
  const { data, error, isLoading, mutate } = useSWR<{ bots: Bot[] }>("/api/bots", fetcher)
  const bots = useMemo(() => data?.bots ?? [], [data])

  const [form, setForm] = useState({ name: "", type: "" })
  const [submitting, setSubmitting] = useState(false)

  async function createBot() {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), type: form.type || null }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || "Failed to create bot")
      toast({ title: "Bot created" })
      setForm({ name: "", type: "" })
      mutate()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-semibold text-pretty">Bots / Assets</h2>
        <p className="text-sm text-muted-foreground">Track robots and assign them to teams.</p>
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-base">Create Bot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="bname">Name</Label>
            <Input id="bname" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="btype">Type</Label>
            <Input id="btype" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
          </div>
          <div>
            <Button onClick={createBot} disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-base">All Bots</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading bots…</p>}
          {error && <p className="text-sm text-red-500">Failed to load bots.</p>}
          {!isLoading && !error && bots.length === 0 && (
            <p className="text-sm text-muted-foreground">No bots created yet.</p>
          )}
          {!isLoading && !error && bots.length > 0 && (
            <div className="grid gap-2">
              {bots.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{b.name || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">
                      Type: {b.type || "n/a"} · Team: {b.assigned_team || "Unassigned"}
                    </p>
                  </div>
                  {/* Future: actions to assign team, add maintenance log, etc. */}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
