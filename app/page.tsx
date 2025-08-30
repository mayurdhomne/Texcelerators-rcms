import { redirect } from "next/navigation"
import { getServerSupabase } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/(auth)/login")

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  const role = (data?.role as string) ?? "member"

  if (role === "admin") redirect("/dashboard")
  if (role === "faculty") redirect("/faculty")
  redirect("/member")
}
