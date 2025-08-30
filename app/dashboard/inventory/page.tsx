"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type Part = {
  id: string
  name: string
  sku: string | null
  unit: string | null
  quantity: number | null
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminInventoryPage() {
  const { toast } = useToast()
  const { data, error, isLoading, mutate } = useSWR<{ parts: Part[] }>("/api/inventory/parts", fetcher)
  const parts = useMemo(() => data?.parts ?? [], [data])

  const [form, setForm] = useState({ name: "", sku: "", unit: "", quantity: "" })
  const [submitting, setSubmitting] = useState(false)

  async function addPart() {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/inventory/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          sku: form.sku || null,
          unit: form.unit || null,
          quantity: form.quantity ? Number(form.quantity) : 0,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || "Failed to add part")
      toast({ title: "Part added" })
      setForm({ name: "", sku: "", unit: "", quantity: "" })
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
        <h2 className="text-xl font-semibold text-pretty">Inventory</h2>
        <p className="text-sm text-muted-foreground">Manage your spare parts and consumables.</p>
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-base">Add Part</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="pname">Name</Label>
            <Input id="pname" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="psku">SKU</Label>
            <Input id="psku" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="punit">Unit</Label>
            <Input id="punit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pqty">Quantity</Label>
            <Input
              id="pqty"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
          </div>
          <div>
            <Button onClick={addPart} disabled={submitting}>
              {submitting ? "Adding..." : "Add Part"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-base">All Parts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading parts…</p>}
          {error && <p className="text-sm text-red-500">Failed to load parts.</p>}
          {!isLoading && !error && parts.length === 0 && (
            <p className="text-sm text-muted-foreground">No parts added yet.</p>
          )}
          {!isLoading && !error && parts.length > 0 && (
            <div className="grid gap-2">
              {parts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {p.sku || "n/a"} · Unit: {p.unit || "n/a"} · Qty: {p.quantity ?? 0}
                    </p>
                  </div>
                  {/* Future: inline edit and delete actions */}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
