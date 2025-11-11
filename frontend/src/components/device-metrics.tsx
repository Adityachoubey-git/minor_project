"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"

interface DeviceMetric {
  label: string
  value: string | number
  unit?: string
  trend?: "up" | "down" | "stable"
}

interface DeviceMetricsProps {
  title: string
  metrics: DeviceMetric[]
  isLive?: boolean
}

export function DeviceMetrics({ title, metrics, isLive = false }: DeviceMetricsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>Real-time monitoring</CardDescription>
          </div>
          {isLive && (
            <Badge variant="secondary" className="gap-1.5">
              <Activity className="w-3 h-3 animate-pulse" />
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-1">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold">{metric.value}</span>
                {metric.unit && <span className="text-xs text-muted-foreground">{metric.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
