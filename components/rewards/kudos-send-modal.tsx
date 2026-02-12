"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Send, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { modalOverlay, scaleUp } from "@/lib/animations"

const KUDOS_CATEGORIES = [
  { id: "team_player", label: "Team Player", icon: "🤝" },
  { id: "always_on_time", label: "Always On Time", icon: "⏰" },
  { id: "goes_above", label: "Goes Above & Beyond", icon: "🚀" },
  { id: "helpful", label: "Helpful", icon: "🙋" },
  { id: "positive_energy", label: "Positive Energy", icon: "☀️" },
  { id: "problem_solver", label: "Problem Solver", icon: "🧩" },
  { id: "mentor", label: "Mentor", icon: "🎓" },
  { id: "custom", label: "Custom", icon: "✨" },
]

interface KudosSendModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (data: { toUserId: string; category: string; message?: string; isAnonymous: boolean }) => Promise<void>
  teammates: Array<{ id: string; name: string }>
  remaining: number
}

export function KudosSendModal({ isOpen, onClose, onSend, teammates, remaining }: KudosSendModalProps) {
  const [step, setStep] = useState(0) // 0: select person, 1: select category, 2: message
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [message, setMessage] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const reset = () => {
    setStep(0)
    setSelectedUser("")
    setSelectedCategory("")
    setMessage("")
    setIsAnonymous(false)
    setSending(false)
    setSent(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSend = async () => {
    setSending(true)
    try {
      await onSend({
        toUserId: selectedUser,
        category: selectedCategory,
        message: message || undefined,
        isAnonymous,
      })
      setSent(true)
      setTimeout(handleClose, 1500)
    } catch {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            variants={scaleUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                <h3 className="font-semibold">Send Kudos</h3>
                <span className="text-xs text-muted-foreground">({remaining} left this week)</span>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              {sent ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <span className="text-6xl block mb-4">🎉</span>
                  <h3 className="text-xl font-bold mb-2">Kudos Sent!</h3>
                  <p className="text-muted-foreground">Your recognition means a lot.</p>
                </motion.div>
              ) : (
                <>
                  {/* Step 0: Select teammate */}
                  {step === 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Who do you want to recognize?</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {teammates.map((tm) => (
                          <button
                            key={tm.id}
                            onClick={() => {
                              setSelectedUser(tm.id)
                              setStep(1)
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                              "hover:bg-muted/80 border border-transparent hover:border-border"
                            )}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {tm.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{tm.name}</span>
                          </button>
                        ))}
                        {teammates.length === 0 && (
                          <p className="text-center py-6 text-muted-foreground">No teammates found</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 1: Select category */}
                  {step === 1 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">What are you recognizing them for?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {KUDOS_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategory(cat.id)
                              setStep(2)
                            }}
                            className="flex items-center gap-2 p-3 rounded-xl border hover:bg-muted/80 hover:border-primary/30 transition-colors text-left"
                          >
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-sm font-medium">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="mt-3">
                        ← Back
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Message + send */}
                  {step === 2 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Add a message (optional)</p>
                      <Input
                        placeholder="Great job on..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={500}
                        className="mb-3"
                      />

                      <label className="flex items-center gap-2 mb-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-muted-foreground">Send anonymously</span>
                      </label>

                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                          ← Back
                        </Button>
                        <Button
                          onClick={handleSend}
                          disabled={sending || remaining <= 0}
                          className="flex-1 bg-pink-600 hover:bg-pink-700"
                        >
                          <Send className="h-4 w-4 mr-1.5" />
                          {sending ? "Sending..." : "Send Kudos"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
