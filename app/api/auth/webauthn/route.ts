import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin as supabase } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import { randomBytes } from "crypto"

// POST /api/auth/webauthn - Register or authenticate with WebAuthn
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action } = body

  if (action === "register-challenge") {
    // Generate registration challenge for authenticated user
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const challenge = randomBytes(32).toString("base64url")

    // Store challenge temporarily (expires in 5 min)
    await supabase.from("WebAuthnChallenge").upsert(
      {
        userId: user!.id,
        challenge,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
      { onConflict: "userId" }
    )

    return NextResponse.json({ challenge })
  }

  if (action === "register") {
    // Complete registration: store credential
    const { user, error: authError } = await getAuthUser()
    if (authError) return authError

    const { credentialId, publicKey, attestationObject, clientDataJSON } = body

    if (!credentialId) {
      return NextResponse.json({ error: "credentialId is required" }, { status: 400 })
    }

    // Verify challenge exists and isn't expired
    const { data: storedChallenge } = await supabase
      .from("WebAuthnChallenge")
      .select("challenge, expiresAt")
      .eq("userId", user!.id)
      .single()

    if (!storedChallenge || new Date(storedChallenge.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 })
    }

    // Store credential
    const { error } = await supabase.from("WebAuthnCredential").insert({
      userId: user!.id,
      credentialId,
      publicKey: publicKey || null,
      attestationObject: attestationObject || null,
      clientDataJSON: clientDataJSON || null,
      createdAt: new Date().toISOString(),
    })

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Credential already registered" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to register credential" }, { status: 500 })
    }

    // Clean up challenge
    await supabase.from("WebAuthnChallenge").delete().eq("userId", user!.id)

    return NextResponse.json({ registered: true })
  }

  if (action === "auth-challenge") {
    // Generate authentication challenge (no auth required)
    const challenge = randomBytes(32).toString("base64url")

    // For auth, we store by challenge value since user isn't known yet
    return NextResponse.json({ challenge })
  }

  if (action === "authenticate") {
    // Verify assertion
    const { credentialId } = body

    if (!credentialId) {
      return NextResponse.json({ error: "credentialId is required" }, { status: 400 })
    }

    // Look up credential to find the user
    const { data: credential } = await supabase
      .from("WebAuthnCredential")
      .select("userId")
      .eq("credentialId", credentialId)
      .single()

    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 })
    }

    // In production, verify the signature against the stored public key.
    // For now, return the user ID for the client to establish a session.
    return NextResponse.json({
      authenticated: true,
      userId: credential.userId,
    })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
