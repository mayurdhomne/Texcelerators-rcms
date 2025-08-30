"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Menu, Home, Users, Wallet, Trophy, Bot, Boxes, LogOut } from "lucide-react"
import { getBrowserSupabase } from "@/lib/supabase/browser"

type Role = "admin" | "member" | "faculty"

const adminLinks = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/members", label: "Members", icon: Users },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/competitions", label: "Competitions", icon: Trophy },
  { href: "/assets", label: "Bots/Assets", icon: Bot },
  { href: "/inventory", label: "Inventory", icon: Boxes },
]

const memberLinks = [
  { href: "/member", label: "Overview", icon: Home },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/my-competitions", label: "Competitions", icon: Trophy },
  { href: "/my-bot", label: "My Bot", icon: Bot },
]

const facultyLinks = [
  { href: "/faculty", label: "Overview", icon: Home },
  { href: "/faculty/members", label: "Members", icon: Users },
  { href: "/faculty/finance", label: "Finance", icon: Wallet },
  { href: "/faculty/competitions", label: "Competitions", icon: Trophy },
]

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const supabase = getBrowserSupabase()

  const links = role === "admin" ? adminLinks : role === "faculty" ? facultyLinks : memberLinks

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = "/(auth)/login"
  }

  return (
    <div className="min-h-dvh grid grid-rows-[auto,1fr]">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-7xl flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setOpen((s) => !s)} className="md:hidden">
              <Menu className="size-5" />
            </Button>
            <Link href="/" className="font-semibold text-pretty">
              Texcelerators RCMS
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside
          className={cn(
            "border-r border-border/60 bg-card/50 backdrop-blur",
            "hidden md:block md:sticky md:top-0 md:h-[calc(100dvh-57px)]",
          )}
        >
          <nav className="p-3 space-y-1">
            {links.map((l) => {
              const Icon = l.icon
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 transition",
                    active ? "bg-[var(--sidebar-primary)] text-white" : "hover:bg-muted/30",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{l.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
