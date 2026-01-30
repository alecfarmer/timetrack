"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Camera, RotateCcw, Check, X } from "lucide-react"

interface PhotoCaptureProps {
  onCapture: (dataUrl: string) => void
  onCancel: () => void
}

export function PhotoCapture({ onCapture, onCancel }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      setStream(newStream)
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
      setError(null)
    } catch {
      setError("Unable to access camera. Please allow camera permissions.")
    }
  }, [stream])

  const handleStart = useCallback(() => {
    startCamera(facingMode)
  }, [startCamera, facingMode])

  const handleFlip = () => {
    const newMode = facingMode === "user" ? "environment" : "user"
    setFacingMode(newMode)
    startCamera(newMode)
  }

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Mirror for selfie mode
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
    setCaptured(dataUrl)

    // Stop camera
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }

  const handleRetake = () => {
    setCaptured(null)
    startCamera(facingMode)
  }

  const handleConfirm = () => {
    if (captured) {
      onCapture(captured)
    }
  }

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
    }
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="text-center p-6">
          <p className="text-white mb-4">{error}</p>
          <Button variant="outline" onClick={handleClose}>Close</Button>
        </div>
      )}

      {!stream && !captured && !error && (
        <div className="text-center p-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Camera className="h-10 w-10 text-white" />
          </div>
          <p className="text-white mb-2 font-medium">Verification Photo</p>
          <p className="text-white/60 text-sm mb-6">Take a selfie to verify your clock-in</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleStart} className="gap-2">
              <Camera className="h-4 w-4" />
              Open Camera
            </Button>
            <Button variant="outline" onClick={handleClose}>Skip</Button>
          </div>
        </div>
      )}

      {stream && !captured && (
        <>
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />
            <div className="absolute inset-0 border-4 border-white/20 rounded-2xl pointer-events-none" />
          </div>
          <div className="flex items-center gap-4 mt-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="h-6 w-6" />
            </Button>
            <button
              onClick={handleCapture}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors"
            >
              <div className="w-14 h-14 rounded-full border-2 border-black/20" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full text-white hover:bg-white/20"
              onClick={handleFlip}
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
          </div>
        </>
      )}

      {captured && (
        <>
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={captured} alt="Captured" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-4 mt-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full text-white hover:bg-white/20"
              onClick={handleRetake}
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              className="rounded-full h-14 px-8 gap-2"
              onClick={handleConfirm}
            >
              <Check className="h-5 w-5" />
              Use Photo
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
