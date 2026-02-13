"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import {
  Hash,
  Plus,
  Send,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Channel {
  id: string
  name: string
  type: string
  createdAt: string
}

interface Message {
  id: string
  channelId: string
  userId: string
  content: string
  createdAt: string
  editedAt: string | null
}

export default function MessagesPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [creatingChannel, setCreatingChannel] = useState(false)
  const [memberMap, setMemberMap] = useState<Record<string, string>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/channels")
      if (res.ok) {
        const data = await res.json()
        setChannels(data)
        return data
      }
    } catch {
      // silent
    }
    return []
  }, [])

  // Fetch messages for a channel
  const fetchMessages = useCallback(async (channelId: string) => {
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/messages?channelId=${channelId}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch {
      // silent
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  // Fetch org members for display names
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/org/members")
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, string> = {}
        for (const m of data) {
          const name = [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email || m.userId
          map[m.userId] = name
        }
        setMemberMap(map)
      }
    } catch {
      // silent
    }
  }, [])

  // Initial load
  useEffect(() => {
    const init = async () => {
      const [channelData] = await Promise.all([fetchChannels(), fetchMembers()])
      if (channelData.length > 0) {
        setActiveChannel(channelData[0])
        await fetchMessages(channelData[0].id)
      }
      setLoading(false)
    }
    init()
  }, [fetchChannels, fetchMembers, fetchMessages])

  // Supabase Realtime subscription for new messages
  useEffect(() => {
    if (!activeChannel) return

    const channel = supabase
      .channel(`messages:${activeChannel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `channelId=eq.${activeChannel.id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newMsg = payload.new as unknown as Message
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChannel, supabase])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when channel changes
  useEffect(() => {
    if (activeChannel && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeChannel])

  const handleSelectChannel = async (channel: Channel) => {
    setActiveChannel(channel)
    setMessages([])
    await fetchMessages(channel.id)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChannel || sending) return
    const content = newMessage.trim()
    setNewMessage("")
    setSending(true)

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: activeChannel.id, content }),
      })
      if (res.ok) {
        const msg = await res.json()
        // Add immediately (realtime will deduplicate)
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    } catch {
      // Restore message on failure
      setNewMessage(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || creatingChannel) return
    setCreatingChannel(true)
    try {
      const res = await fetch("/api/messages/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName.trim(), type: "team" }),
      })
      if (res.ok) {
        const channel = await res.json()
        setChannels((prev) => [...prev, channel])
        setActiveChannel(channel)
        setMessages([])
        setNewChannelName("")
        setShowCreateChannel(false)
      }
    } catch {
      // silent
    } finally {
      setCreatingChannel(false)
    }
  }

  const getMemberName = (userId: string) => {
    return memberMap[userId] || "Unknown"
  }

  const isOwnMessage = (msg: Message) => msg.userId === user?.id

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return "Today"
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  let currentDate = ""
  for (const msg of messages) {
    const date = formatDate(msg.createdAt)
    if (date !== currentDate) {
      currentDate = date
      groupedMessages.push({ date, messages: [msg] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Mobile: show either channel list or thread
  const showThread = !!activeChannel

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] lg:h-dvh">
      <div className="lg:hidden">
        <PageHeader
          title={showThread ? `# ${activeChannel?.name}` : "Messages"}
          subtitle={showThread ? undefined : `${channels.length} channels`}
          actions={
            showThread ? (
              <Button variant="ghost" size="sm" onClick={() => setActiveChannel(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Channels
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5" onClick={() => setShowCreateChannel(true)}>
                <Plus className="h-4 w-4" />
                New
              </Button>
            )
          }
        />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Channel Sidebar */}
        <div
          className={cn(
            "w-full lg:w-64 lg:border-r lg:flex flex-col bg-background",
            showThread ? "hidden lg:flex" : "flex"
          )}
        >
          {/* Desktop channel header */}
          <div className="hidden lg:flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-sm">Channels</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCreateChannel(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Create channel form */}
          {showCreateChannel && (
            <div className="p-3 border-b space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
                  placeholder="Channel name..."
                  className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={handleCreateChannel} disabled={!newChannelName.trim() || creatingChannel}>
                  {creatingChannel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create"}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowCreateChannel(false); setNewChannelName("") }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Channel list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {channels.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No channels yet</p>
                <p className="text-xs text-muted-foreground mb-3">Create a channel to start messaging your team.</p>
                <Button size="sm" className="gap-1.5" onClick={() => setShowCreateChannel(true)}>
                  <Plus className="h-4 w-4" />
                  Create Channel
                </Button>
              </div>
            ) : (
              channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChannel(ch)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    activeChannel?.id === ch.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Hash className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ch.name}</span>
                  {ch.type === "team" && <Users className="h-3 w-3 shrink-0 ml-auto opacity-50" />}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            !showThread ? "hidden lg:flex" : "flex"
          )}
        >
          {!activeChannel ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium">Select a channel</p>
                <p className="text-sm text-muted-foreground">Choose a channel to start chatting.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop thread header */}
              <div className="hidden lg:flex items-center gap-2 px-4 h-14 border-b shrink-0">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">{activeChannel.name}</h2>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-center">
                    <div>
                      <Hash className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium">Welcome to #{activeChannel.name}</p>
                      <p className="text-sm text-muted-foreground">This is the start of the conversation.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center gap-3 py-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[11px] font-medium text-muted-foreground">{group.date}</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        {group.messages.map((msg, idx) => {
                          const own = isOwnMessage(msg)
                          const prevMsg = idx > 0 ? group.messages[idx - 1] : null
                          const sameAuthor = prevMsg?.userId === msg.userId
                          const timeDiff = prevMsg
                            ? (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) / 60000
                            : Infinity
                          const compact = sameAuthor && timeDiff < 5

                          return (
                            <div key={msg.id} className={cn("group", compact ? "mt-0.5" : "mt-3")}>
                              {!compact && (
                                <div className="flex items-baseline gap-2 mb-0.5">
                                  <span className={cn("text-sm font-semibold", own ? "text-primary" : "text-foreground")}>
                                    {own ? "You" : getMemberName(msg.userId)}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {formatTime(msg.createdAt)}
                                  </span>
                                </div>
                              )}
                              <p className="text-sm leading-relaxed pl-0">{msg.content}</p>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="shrink-0 border-t p-3 safe-area-pb">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder={`Message #${activeChannel.name}...`}
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="h-9 w-9 shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
