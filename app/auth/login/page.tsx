import { redirect } from "next/navigation"

export default function Page() {
  // Users may try /auth/login; keep canonical path at /login
  redirect("/login")
  return null
}
