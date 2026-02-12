"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Coins, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShopItemCardProps {
  id: string
  name: string
  description: string | null
  icon: string
  costCoins: number
  category: string
  stock: number | null
  maxPerUser: number | null
  userRedemptions: number
  canPurchase: boolean
  onRedeem: (id: string) => void
  redeeming?: boolean
}

const categoryColors: Record<string, string> = {
  perk: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  swag: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  time_off: "bg-green-500/10 text-green-500 border-green-500/30",
  recognition: "bg-amber-500/10 text-amber-500 border-amber-500/30",
}

export function ShopItemCard({
  id,
  name,
  description,
  icon,
  costCoins,
  category,
  stock,
  maxPerUser,
  userRedemptions,
  canPurchase,
  onRedeem,
  redeeming,
}: ShopItemCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }}>
      <Card className={cn(
        "border shadow-lg overflow-hidden transition-all",
        !canPurchase && "opacity-60"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{name}</h3>
              {description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={cn("text-[10px]", categoryColors[category] || categoryColors.perk)}>
                  {category.replace("_", " ")}
                </Badge>
                {stock !== null && (
                  <span className="text-[10px] text-muted-foreground">
                    {stock} left
                  </span>
                )}
                {maxPerUser && (
                  <span className="text-[10px] text-muted-foreground">
                    {userRedemptions}/{maxPerUser} used
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-1.5 text-yellow-600 font-bold">
              <Coins className="h-4 w-4" />
              <span>{costCoins}</span>
            </div>
            <Button
              size="sm"
              disabled={!canPurchase || redeeming}
              onClick={() => onRedeem(id)}
              className="h-8"
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1" />
              {redeeming ? "..." : "Redeem"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
