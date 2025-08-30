"use client"

import { useState } from "react"
import { getBrowserSupabase } from "@/lib/supabase/browser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mail } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = getBrowserSupabase()

  async function sendOtp() {
    setLoading(true)
    setError(null)
    try {
      const redirectTo = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) throw error
      setSent(true)
    } catch (e: any) {
      setError(e.message ?? "Failed to send login link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-[var(--border)] bg-[var(--card)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-balance">Sign in to RCMS</CardTitle>
          <CardDescription className="text-pretty">
            Use your college email. We’ll send a one-time link to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!sent ? (
            <Button disabled={loading || !email} onClick={sendOtp} className="brand-gradient hover:opacity-90">
              <Mail className="mr-2 h-4 w-4" />
              {loading ? "Sending..." : "Send magic link"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">A sign-in link has been sent. Check your inbox.</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
