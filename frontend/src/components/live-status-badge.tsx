"use client"

import { Badge } from "@/components/ui/badge"
import { Activity, Radio, AlertTriangle } from "lucide-react"

type StatusType = "active" | "connected" | "warning" | "offline"

interface LiveStatusBadgeProps {
  status: StatusType
  message?: string
  animated?: boolean
}

export function LiveStatusBadge({ status, message = "", animated = true }: LiveStatusBadgeProps) {
  const statusConfig = {
    active: {
      icon: Activity,
      color: "bg-green-500/20 text-green-700 dark:text-green-400",
      label: "Active",
    },
    connected: {
      icon: Radio,
      color: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
      label: "Connected",
    },
    warning: {
      icon: AlertTriangle,
      color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
      label: "Warning",
    },
    offline: {
      icon: Activity,
      color: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
      label: "Offline",
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`${config.color} gap-1.5`}>
      <Icon className={`w-3 h-3 ${animated && status !== "offline" ? "animate-pulse" : ""}`} />
      <span>{message || config.label}</span>
    </Badge>
  )
}
