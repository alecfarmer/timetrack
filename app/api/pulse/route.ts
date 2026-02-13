import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { startOfWeek, format } from "date-fns"

// GET /api/pulse — Get active surveys (employee) or all surveys (admin)
export async function GET(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const isAdmin = org.role === "ADMIN"
  const includeResponses = request.nextUrl.searchParams.get("responses") === "true"
  const weekOf = request.nextUrl.searchParams.get("weekOf")

  // Get surveys
  let surveyQuery = supabase
    .from("PulseSurvey")
    .select("*")
    .eq("orgId", org.orgId)
    .order("createdAt", { ascending: false })

  if (!isAdmin) {
    surveyQuery = surveyQuery.eq("isActive", true)
  }

  const { data: surveys, error: surveyError } = await surveyQuery

  if (surveyError) {
    return NextResponse.json({ error: surveyError.message }, { status: 500 })
  }

  if (!surveys || surveys.length === 0) {
    return NextResponse.json({ surveys: [], responses: [] })
  }

  // Get current week
  const currentWeek = weekOf || format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")

  // For employees: get their own responses for this week
  // For admins with responses=true: get all responses
  let responses: unknown[] = []
  if (includeResponses && isAdmin) {
    const { data } = await supabase
      .from("PulseResponse")
      .select("*")
      .eq("orgId", org.orgId)
      .order("createdAt", { ascending: false })
      .limit(500)

    responses = data || []
  } else {
    // Get employee's own responses for current week
    const { data } = await supabase
      .from("PulseResponse")
      .select("*")
      .eq("orgId", org.orgId)
      .eq("userId", user.id)
      .eq("weekOf", currentWeek)

    responses = data || []
  }

  return NextResponse.json({ surveys, responses, currentWeek })
}

// POST /api/pulse — Submit a response (employee) or create a survey (admin)
export async function POST(request: NextRequest) {
  const { user, org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 })
  }

  const body = await request.json()

  // Admin: create survey
  if (body.action === "create_survey") {
    if (org.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { question, type, frequency } = body
    if (!question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("PulseSurvey")
      .insert({
        orgId: org.orgId,
        question: question.trim(),
        type: type || "rating",
        frequency: frequency || "weekly",
        createdBy: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  }

  // Employee: submit response
  const { surveyId, ratingValue, textValue, boolValue } = body
  if (!surveyId) {
    return NextResponse.json({ error: "surveyId is required" }, { status: 400 })
  }

  // Verify survey belongs to org
  const { data: survey } = await supabase
    .from("PulseSurvey")
    .select("id, orgId, type")
    .eq("id", surveyId)
    .eq("orgId", org.orgId)
    .eq("isActive", true)
    .single()

  if (!survey) {
    return NextResponse.json({ error: "Survey not found" }, { status: 404 })
  }

  const currentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")

  const { data, error } = await supabase
    .from("PulseResponse")
    .upsert(
      {
        surveyId,
        userId: user.id,
        orgId: org.orgId,
        ratingValue: survey.type === "rating" ? ratingValue : null,
        textValue: survey.type === "text" ? textValue : null,
        boolValue: survey.type === "yes_no" ? boolValue : null,
        weekOf: currentWeek,
      },
      { onConflict: "surveyId,userId,weekOf" }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/pulse — Update survey (admin: activate/deactivate)
export async function PATCH(request: NextRequest) {
  const { org, error: authError } = await getAuthUser()
  if (authError) return authError
  if (!org || org.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = await request.json()
  const { id, isActive } = body

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("PulseSurvey")
    .update({ isActive, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .eq("orgId", org.orgId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
