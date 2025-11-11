"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Cpu, Signal, Zap, Thermometer } from "lucide-react"

interface IoTDeviceCardProps {
  id: string
  name: string
  type: "esp32" | "relay" | "sensor" | "gateway"
  status: "online" | "offline" | "idle"
  temperature?: number
  humidity?: number
  lastSeen?: string
  onToggle?: (enabled: boolean) => void
}

export function IoTDeviceCard({
  id,
  name,
  type,
  status,
  temperature,
  humidity,
  lastSeen,
  onToggle,
}: IoTDeviceCardProps) {
  const statusColors = {
    online: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900",
    offline: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900",
    idle: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900",
  }

  const typeIcons = {
    esp32: <Cpu className="w-4 h-4" />,
    relay: <Zap className="w-4 h-4" />,
    sensor: <Thermometer className="w-4 h-4" />,
    gateway: <Signal className="w-4 h-4" />,
  }

  const typeLabels = {
    esp32: "ESP32 Controller",
    relay: "Power Relay",
    sensor: "Sensor",
    gateway: "IoT Gateway",
  }

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">{typeIcons[type]}</div>
            <div className="flex-1">
              <CardTitle className="text-base">{name}</CardTitle>
              <CardDescription className="text-xs">{typeLabels[type]}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[status]}>
            <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-current" />
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics */}
        {temperature !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Temperature</span>
              <span className="font-medium">{temperature}°C</span>
            </div>
            <Progress value={Math.min((temperature / 50) * 100, 100)} className="h-1.5" />
          </div>
        )}

        {humidity !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Humidity</span>
              <span className="font-medium">{humidity}%</span>
            </div>
            <Progress value={humidity} className="h-1.5" />
          </div>
        )}

        {/* Control */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {lastSeen ? `Last seen ${lastSeen}` : "Never connected"}
          </span>
          {onToggle && <Switch onCheckedChange={onToggle} defaultChecked={status === "online"} />}
        </div>

        {/* Action */}
        <Button variant="ghost" size="sm" className="w-full justify-center">
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}
