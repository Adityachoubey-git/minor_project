"use client"

import { IoTDeviceCard } from "@/components/iot-device-card"

interface Device {
  id: string
  name: string
  type: "esp32" | "relay" | "sensor" | "gateway"
  status: "online" | "offline" | "idle"
  temperature?: number
  humidity?: number
  lastSeen?: string
}

interface DeviceGridProps {
  devices: Device[]
  title?: string
}

export function DeviceGrid({ devices, title = "Connected Devices" }: DeviceGridProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <IoTDeviceCard
            key={device.id}
            {...device}
            onToggle={(enabled) => {
              console.log(`Device ${device.id} toggled:`, enabled)
            }}
          />
        ))}
      </div>
    </div>
  )
}
