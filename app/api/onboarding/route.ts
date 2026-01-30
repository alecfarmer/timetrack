import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { validateBody } from "@/lib/validations"
import { z } from "zod"

// Default company locations for new orgs
const DEFAULT_LOCATIONS = [
  {
    name: "US0",
    code: "US0",
    category: "PLANT",
    address: "1401 Antioch Church Rd, Greenville, SC 29605",
    latitude: 34.8526,
    longitude: -82.394,
    geofenceRadius: 50,
    isDefault: true,
  },
  {
    name: "HNA",
    code: "HNA",
    category: "OFFICE",
    address: "1 Parkway S, Greenville, SC 29615",
    latitude: 34.8447,
    longitude: -82.3987,
    geofenceRadius: 50,
  },
  {
    name: "US2",
    code: "US2",
    category: "PLANT",
    address: "6301 US-76, Pendleton, SC 29670",
    latitude: 34.6518,
    longitude: -82.7836,
    geofenceRadius: 50,
  },
  {
    name: "SPA",
    code: "SPA",
    category: "PLANT",
    address: "1000 International Dr, Spartanburg, SC 29303",
    latitude: 34.9285,
    longitude: -81.9571,
    geofenceRadius: 50,
  },
  {
    name: "LXT",
    code: "LXT",
    category: "PLANT",
    address: "2420 Two Notch Rd, Lexington, SC 29072",
    latitude: 33.9812,
    longitude: -81.2365,
    geofenceRadius: 50,
  },
  {
    name: "MCC",
    code: "MCC",
    category: "OFFICE",
    address: "515 Michelin Rd, Greenville, SC 29605",
    latitude: 34.72946,
    longitude: -82.36624,
    geofenceRadius: 50,
  },
  {
    name: "MARC",
    code: "MARC",
    category: "OFFICE",
    address: "515 Michelin Rd, Greenville, SC 29605",
    latitude: 34.725493,
    longitude: -82.36745,
    geofenceRadius: 100,
  },
]

const onboardingSchema = z.object({
  // Option A: Create a new org
  orgName: z.string().min(1).max(100).optional(),
  // Option B: Join existing org via invite code
  inviteCode: z.string().min(1).max(50).optional(),
  // WFH location (optional for both paths)
  wfhAddress: z.string().max(500).optional(),
  wfhLatitude: z.number().min(-90).max(90).optional(),
  wfhLongitude: z.number().min(-180).max(180).optional(),
})

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

// GET /api/onboarding - Check onboarding status
export async function GET() {
  try {
    const { user, org, error: authError } = await getAuthUser()
    if (authError) return authError

    if (org) {
      const { data: wfhLocation } = await supabase
        .from("Location")
        .select("id")
        .eq("orgId", org.orgId)
        .eq("userId", user!.id)
        .eq("category", "HOME")
        .limit(1)
        .single()

      return NextResponse.json({
        needsOnboarding: false,
        hasOrg: true,
        hasWfhLocation: !!wfhLocation,
      })
    }

    const { data: pendingInvites } = await supabase
      .from("Invite")
      .select("id, code, orgId, org:Organization(name)")
      .eq("email", user!.email)
      .is("usedBy", null)
      .gt("expiresAt", new Date().toISOString())

    return NextResponse.json({
      needsOnboarding: true,
      hasOrg: false,
      pendingInvites: pendingInvites || [],
    })
  } catch (error) {
    console.error("Error checking onboarding:", error)
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    )
  }
}

// POST /api/onboarding - Create org or join org + optionally set WFH
export async function POST(request: NextRequest) {
  try {
    const { user, org: existingOrg, error: authError } = await getAuthUser()
    if (authError) return authError

    if (existingOrg) {
      return NextResponse.json(
        { error: "User already belongs to an organization" },
        { status: 409 }
      )
    }

    const body = await request.json()
    const validation = validateBody(onboardingSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { orgName, inviteCode, wfhAddress, wfhLatitude, wfhLongitude } = validation.data

    if (!orgName && !inviteCode) {
      return NextResponse.json(
        { error: "Provide either orgName (to create) or inviteCode (to join)" },
        { status: 400 }
      )
    }

    let orgId: string

    if (inviteCode) {
      // Join existing org via invite code
      const { data: invite, error: inviteError } = await supabase
        .from("Invite")
        .select("*")
        .eq("code", inviteCode)
        .is("usedBy", null)
        .gt("expiresAt", new Date().toISOString())
        .single()

      if (inviteError || !invite) {
        return NextResponse.json(
          { error: "Invalid or expired invite code" },
          { status: 400 }
        )
      }

      if (invite.email && invite.email !== user!.email) {
        return NextResponse.json(
          { error: "This invite is for a different email address" },
          { status: 403 }
        )
      }

      orgId = invite.orgId

      const { error: memberError } = await supabase
        .from("Membership")
        .insert({
          userId: user!.id,
          orgId,
          role: invite.role || "MEMBER",
        })

      if (memberError) {
        console.error("Membership error:", memberError)
        return NextResponse.json(
          { error: "Failed to join organization" },
          { status: 500 }
        )
      }

      await supabase
        .from("Invite")
        .update({ usedBy: user!.id })
        .eq("id", invite.id)

    } else {
      // Create new org
      const slug = slugify(orgName!)
      const { data: org, error: orgError } = await supabase
        .from("Organization")
        .insert({
          name: orgName!,
          slug: `${slug}-${Date.now().toString(36)}`,
          createdBy: user!.id,
        })
        .select()
        .single()

      if (orgError || !org) {
        console.error("Org creation error:", orgError)
        return NextResponse.json(
          { error: "Failed to create organization" },
          { status: 500 }
        )
      }

      orgId = org.id

      const { error: memberError } = await supabase
        .from("Membership")
        .insert({
          userId: user!.id,
          orgId,
          role: "ADMIN",
        })

      if (memberError) {
        console.error("Membership error:", memberError)
        await supabase.from("Organization").delete().eq("id", orgId)
        return NextResponse.json(
          { error: "Failed to create membership" },
          { status: 500 }
        )
      }

      // Create default locations for the org
      const locationsToInsert = DEFAULT_LOCATIONS.map((loc) => ({
        ...loc,
        orgId,
        userId: null as string | null,
        isDefault: loc.isDefault || false,
      }))

      const { error: locError } = await supabase
        .from("Location")
        .insert(locationsToInsert)

      if (locError) {
        console.error("Location creation error:", locError)
      }

      // Create default policy
      await supabase
        .from("PolicyConfig")
        .insert({
          name: "Default Policy",
          requiredDaysPerWeek: 3,
          minimumMinutesPerDay: 0,
          isActive: true,
          orgId,
        })
    }

    // Add WFH location if provided
    if (wfhLatitude !== undefined && wfhLongitude !== undefined) {
      await supabase
        .from("Location")
        .insert({
          name: "WFH",
          code: "WFH",
          category: "HOME",
          address: wfhAddress || "",
          latitude: wfhLatitude,
          longitude: wfhLongitude,
          geofenceRadius: 200,
          isDefault: false,
          orgId,
          userId: user!.id,
        })
    }

    return NextResponse.json({
      success: true,
      orgId,
      joined: !!inviteCode,
    }, { status: 201 })
  } catch (error) {
    console.error("Error during onboarding:", error)
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    )
  }
}
