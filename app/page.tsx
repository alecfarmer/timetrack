import { redirect } from "next/navigation"

export default function RootPage() {
  // Redirect to employee app by default
  // Auth state will be checked in the layout
  redirect("/app")
}
