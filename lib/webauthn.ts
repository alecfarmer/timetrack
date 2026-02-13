/**
 * WebAuthn utilities for biometric quick login.
 *
 * Client-side helpers for WebAuthn registration and authentication.
 * Uses the Web Authentication API (navigator.credentials).
 */

const RP_NAME = "KPR"

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ""
  for (const byte of bytes) str += String.fromCharCode(byte)
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

/**
 * Check if WebAuthn is supported in the current browser.
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
  )
}

/**
 * Check if a platform authenticator (biometric) is available.
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false
  return window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
}

/**
 * Register a new WebAuthn credential.
 * Returns the credential data to send to the server.
 */
export async function registerCredential(
  userId: string,
  userEmail: string,
  challenge: string
): Promise<{
  credentialId: string
  publicKey: string
  attestationObject: string
  clientDataJSON: string
} | null> {
  if (!isWebAuthnSupported()) return null

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        rp: {
          name: RP_NAME,
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userEmail,
          displayName: userEmail.split("@")[0],
        },
        challenge: base64urlToBuffer(challenge),
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },   // ES256
          { alg: -257, type: "public-key" },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null

    if (!credential) return null

    const response = credential.response as AuthenticatorAttestationResponse

    return {
      credentialId: bufferToBase64url(credential.rawId),
      publicKey: bufferToBase64url(response.getPublicKey?.() || new ArrayBuffer(0)),
      attestationObject: bufferToBase64url(response.attestationObject),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
    }
  } catch (err) {
    console.error("WebAuthn registration failed:", err)
    return null
  }
}

/**
 * Authenticate with an existing WebAuthn credential.
 * Returns the assertion to send to the server for verification.
 */
export async function authenticateCredential(
  challenge: string,
  allowCredentials?: string[]
): Promise<{
  credentialId: string
  authenticatorData: string
  clientDataJSON: string
  signature: string
} | null> {
  if (!isWebAuthnSupported()) return null

  try {
    const credential = (await navigator.credentials.get({
      publicKey: {
        challenge: base64urlToBuffer(challenge),
        rpId: window.location.hostname,
        allowCredentials: allowCredentials?.map((id) => ({
          id: base64urlToBuffer(id),
          type: "public-key" as const,
          transports: ["internal" as const],
        })),
        userVerification: "required",
        timeout: 60000,
      },
    })) as PublicKeyCredential | null

    if (!credential) return null

    const response = credential.response as AuthenticatorAssertionResponse

    return {
      credentialId: bufferToBase64url(credential.rawId),
      authenticatorData: bufferToBase64url(response.authenticatorData),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      signature: bufferToBase64url(response.signature),
    }
  } catch (err) {
    console.error("WebAuthn authentication failed:", err)
    return null
  }
}
