"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { staggerContainer, staggerChild } from "@/lib/animations"
import { tzHeaders } from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  ShoppingCart,
  Plus,
  Coins,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  X,
} from "lucide-react"

interface ShopItem {
  id: string
  name: string
  description: string | null
  icon: string
  costCoins: number
  category: string
  stock: number | null
  maxPerUser: number | null
  isActive: boolean
  totalRedemptions: number
}

interface Redemption {
  id: string
  userId: string
  userName: string
  shopItemId: string
  costCoins: number
  status: string
  createdAt: string
  shopItem: ShopItem | null
}

export default function AdminShopPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [activeTab, setActiveTab] = useState<"items" | "pending" | "history">("items")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formIcon, setFormIcon] = useState("🎁")
  const [formCost, setFormCost] = useState("")
  const [formCategory, setFormCategory] = useState("perk")
  const [formStock, setFormStock] = useState("")
  const [formMaxPerUser, setFormMaxPerUser] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      const [itemsRes, redemptionsRes] = await Promise.all([
        fetch("/api/admin/rewards/shop", { headers: tzHeaders() }),
        fetch("/api/admin/rewards/redemptions?status=all", { headers: tzHeaders() }),
      ])
      if (itemsRes.ok) {
        const data = await itemsRes.json()
        setItems(data.items || [])
      }
      if (redemptionsRes.ok) {
        const data = await redemptionsRes.json()
        setRedemptions(data.redemptions || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreateItem = async () => {
    if (!formName || !formCost) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/rewards/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({
          name: formName,
          description: formDescription || undefined,
          icon: formIcon,
          costCoins: parseInt(formCost),
          category: formCategory,
          stock: formStock ? parseInt(formStock) : null,
          maxPerUser: formMaxPerUser ? parseInt(formMaxPerUser) : null,
        }),
      })
      if (res.ok) {
        setShowCreateForm(false)
        setFormName("")
        setFormDescription("")
        setFormIcon("🎁")
        setFormCost("")
        setFormCategory("perk")
        setFormStock("")
        setFormMaxPerUser("")
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleRedemptionAction = async (id: string, status: "approved" | "rejected") => {
    try {
      await fetch("/api/admin/rewards/redemptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({ id, status }),
      })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const toggleItemActive = async (item: ShopItem) => {
    try {
      await fetch("/api/admin/rewards/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...tzHeaders() },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const pendingRedemptions = redemptions.filter((r) => r.status === "pending")
  const historyRedemptions = redemptions.filter((r) => r.status !== "pending")

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Rewards Shop" subtitle="Manage shop items and redemptions" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Rewards Shop"
        subtitle="Manage shop items and redemptions"
      />

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        {[
          { id: "items", label: `Items (${items.length})` },
          { id: "pending", label: `Pending (${pendingRedemptions.length})` },
          { id: "history", label: "History" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items Tab */}
      {activeTab === "items" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>

          {/* Create Form Modal */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="border-primary/30">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">New Shop Item</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Free Coffee" />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <Input value={formIcon} onChange={(e) => setFormIcon(e.target.value)} className="w-20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="A free coffee from the office machine" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Cost (Coins)</Label>
                        <Input type="number" value={formCost} onChange={(e) => setFormCost(e.target.value)} placeholder="50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={formCategory} onValueChange={setFormCategory}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="perk">Perk</SelectItem>
                            <SelectItem value="swag">Swag</SelectItem>
                            <SelectItem value="time_off">Time Off</SelectItem>
                            <SelectItem value="recognition">Recognition</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Stock (optional)</Label>
                        <Input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} placeholder="∞" />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Per User</Label>
                        <Input type="number" value={formMaxPerUser} onChange={(e) => setFormMaxPerUser(e.target.value)} placeholder="∞" />
                      </div>
                    </div>
                    <Button onClick={handleCreateItem} disabled={saving || !formName || !formCost}>
                      {saving ? "Creating..." : "Create Item"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Items Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((item) => (
              <motion.div key={item.id} variants={staggerChild}>
                <Card className={cn(!item.isActive && "opacity-50")}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                          {item.stock !== null && <span className="text-[10px] text-muted-foreground">{item.stock} in stock</span>}
                          <span className="text-[10px] text-muted-foreground">{item.totalRedemptions} redeemed</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1.5 text-yellow-600 font-bold">
                        <Coins className="h-4 w-4" />
                        <span>{item.costCoins}</span>
                      </div>
                      <Button
                        variant={item.isActive ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleItemActive(item)}
                      >
                        {item.isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {items.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No shop items yet. Add your first item above.</p>
            </div>
          )}
        </>
      )}

      {/* Pending Redemptions Tab */}
      {activeTab === "pending" && (
        <div className="space-y-3">
          {pendingRedemptions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No pending redemptions</p>
            </div>
          ) : (
            pendingRedemptions.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-2xl">{r.shopItem?.icon || "🎁"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.shopItem?.name || "Unknown Item"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.userName} &middot; {r.costCoins} coins &middot; {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRedemptionAction(r.id, "rejected")}>
                      <XCircle className="h-4 w-4 mr-1 text-destructive" />
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => handleRedemptionAction(r.id, "approved")}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {historyRedemptions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No redemption history</p>
            </div>
          ) : (
            historyRedemptions.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <span className="text-xl">{r.shopItem?.icon || "🎁"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.shopItem?.name || "Unknown"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {r.userName} &middot; {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={r.status === "approved" || r.status === "fulfilled" ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {r.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
