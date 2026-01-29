import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

// DELETE /api/account - Delete the authenticated user's account and all their data
export async function DELETE() {
  try {
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const userId = user!.id

    // Delete in order to respect foreign key constraints:
    // 1. Entries (references WorkDay and Location)
    const { error: entriesError } = await supabase
      .from("Entry")
      .delete()
      .eq("userId", userId)

    if (entriesError) {
      console.error("Failed to delete entries:", entriesError)
      return NextResponse.json(
        { error: "Failed to delete account data", details: entriesError.message },
        { status: 500 }
      )
    }

    // 2. WorkDays (references Location)
    const { error: workDaysError } = await supabase
      .from("WorkDay")
      .delete()
      .eq("userId", userId)

    if (workDaysError) {
      console.error("Failed to delete workdays:", workDaysError)
      return NextResponse.json(
        { error: "Failed to delete account data", details: workDaysError.message },
        { status: 500 }
      )
    }

    // 3. Callouts (references Location)
    const { error: calloutsError } = await supabase
      .from("Callout")
      .delete()
      .eq("userId", userId)

    if (calloutsError) {
      console.error("Failed to delete callouts:", calloutsError)
      return NextResponse.json(
        { error: "Failed to delete account data", details: calloutsError.message },
        { status: 500 }
      )
    }

    // 4. Locations
    const { error: locationsError } = await supabase
      .from("Location")
      .delete()
      .eq("userId", userId)

    if (locationsError) {
      console.error("Failed to delete locations:", locationsError)
      return NextResponse.json(
        { error: "Failed to delete account data", details: locationsError.message },
        { status: 500 }
      )
    }

    // 5. Sign the user out
    const serverSupabase = await createClient()
    await serverSupabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    )
  }
}
