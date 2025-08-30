"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type CompetitionPayload = {
  name: string
  status?: string | null
  start_date?: string | null
  end_date?: string | null
  fee?: number | null
  rules?: string | null
}

export function CreateCompetitionForm({ onCreated }: { onCreated?: () => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CompetitionPayload>({
    name: "",
    status: "upcoming",
    start_date: "",
    end_date: "",
    fee: undefined,
    rules: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          status: form.status || "upcoming",
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          fee: typeof form.fee === "number" ? form.fee : form.fee ? Number(form.fee) : null,
          rules: form.rules || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create competition")
      }
      toast({ title: "Competition created" })
      setForm({
        name: "",
        status: "upcoming",
        start_date: "",
        end_date: "",
        fee: undefined,
        rules: "",
      })
      onCreated?.()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--card)]">
      <CardHeader>
        <CardTitle className="text-base">Create Competition</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., RoboCup Regionals"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Input
              id="status"
              placeholder="upcoming | ongoing | finished"
              value={form.status || ""}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date || ""}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End date</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date || ""}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fee">Fee (₹)</Label>
            <Input
              id="fee"
              type="number"
              min="0"
              placeholder="e.g., 500"
              value={form.fee ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rules">Rules</Label>
            <Textarea
              id="rules"
              placeholder="Short description or basic rules"
              value={form.rules || ""}
              onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
