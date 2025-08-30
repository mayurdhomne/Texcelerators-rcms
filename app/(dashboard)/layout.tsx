import type { ReactNode } from "react"
import { getServerSupabase } from "@/lib/supabase/server"
import Link from "next/link"
import { Users, Wallet, Trophy, Bot, Boxes, BarChart3 } from "lucide-react"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let role: "admin" | "member" | "faculty" | null = null

  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    role = (data?.role as any) ?? "member"
  }

  const adminLinks = [
    { href: "/dashboard", label: "Overview", icon: BarChart3 },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    { href: "/dashboard/members", label: "Members", icon: Users },
    { href: "/dashboard/finance", label: "Finance", icon: Wallet },
    { href: "/dashboard/competitions", label: "Competitions", icon: Trophy },
    { href: "/dashboard/bots", label: "Bots/Assets", icon: Bot },
    { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
  ]
  const memberLinks = [
    { href: "/member", label: "My Dashboard", icon: BarChart3 },
    { href: "/member/competitions", label: "Competitions", icon: Trophy },
    { href: "/member/payments", label: "Payments", icon: Wallet },
  ]
  const facultyLinks = [
    { href: "/faculty", label: "Overview", icon: BarChart3 },
    { href: "/faculty/members", label: "Members", icon: Users },
    { href: "/faculty/competitions", label: "Competitions", icon: Trophy },
    { href: "/faculty/finance", label: "Finance", icon: Wallet },
  ]

  const links = role === "admin" ? adminLinks : role === "faculty" ? facultyLinks : memberLinks

  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      <aside className="hidden md:flex flex-col gap-2 border-r border-[var(--border)] p-4 bg-[var(--card)]">
        <div className="flex items-center gap-2 px-2">
          <div className="h-6 w-6 rounded brand-gradient" />
          <span className="font-semibold">RCMS</span>
        </div>
        <nav className="mt-4 grid gap-1">
          {links.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/30"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="md:hidden h-6 w-6 rounded brand-gradient" />
            <h1 className="text-lg font-medium text-balance">Texcelerators Robotics Club</h1>
          </div>
          <Link
            href="/(auth)/logout"
            className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-[var(--border)]"
          >
            Sign out
          </Link>
        </header>
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
