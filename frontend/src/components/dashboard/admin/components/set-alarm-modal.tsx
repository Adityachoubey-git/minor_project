"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl"
import { Loader } from "@/components/loader"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Clock } from "lucide-react"

interface Device {
  id: number
  Name: string
  PinNumber: number
  labId: number
  Lab: { id: number; name: string } | null
}

interface Lab {
  id: number
  name: string
}

interface SetAlarmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  devices?: Device[]
  selectedLabId?: string
}

export default function SetAlarmModal({
  open,
  onOpenChange,
  devices: initialDevices,
  selectedLabId,
}: SetAlarmModalProps) {
  const [devices, setDevices] = useState<Device[]>(initialDevices || [])
  const [labs, setLabs] = useState<Lab[]>([])
  const [currentLabId, setCurrentLabId] = useState<string>(selectedLabId || "")
  const [selectedDevices, setSelectedDevices] = useState<number[]>([])
  const [state, setState] = useState<"on" | "off">("off")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  useEffect(() => {
    if (!open) return

    const fetchLabsAndDevices = async () => {
      setFetchingData(true)
      try {
        // Fetch labs
        const labsRes = await axios.get(`${Base_Url}/lab/get`, { params: { limit: 100 }, withCredentials: true })
        if (labsRes.data.success) {
          setLabs(labsRes.data.labs)
        }

        // If a lab is already selected or passed as prop, fetch its devices
        if (selectedLabId) {
          const devicesRes = await axios.get(`${Base_Url}/devices/get`, {
            params: { labId: selectedLabId, limit: 100 },
            withCredentials: true,
          })
          if (devicesRes.data.success) {
            setDevices(devicesRes.data.devices)
            setCurrentLabId(selectedLabId)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching labs or devices:", error)
        toast.error("Failed to load labs and devices")
      } finally {
        setFetchingData(false)
      }
    }

    fetchLabsAndDevices()
  }, [open, selectedLabId])

  useEffect(() => {
    if (!currentLabId) {
      setDevices([])
      return
    }

    const fetchDevices = async () => {
      setFetchingData(true)
      try {
        const devicesRes = await axios.get(`${Base_Url}/devices/get`, {
          params: { labId: currentLabId, limit: 100 },
          withCredentials: true,
        })
        if (devicesRes.data.success) {
          setDevices(devicesRes.data.devices)
        }
      } catch (error) {
        console.error("[v0] Error fetching devices:", error)
        toast.error("Failed to load devices")
      } finally {
        setFetchingData(false)
      }
    }

    fetchDevices()
  }, [currentLabId])

  const toggleDeviceSelection = (deviceId: number) => {
    setSelectedDevices((prev) => (prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]))
  }

  const handleSetAlarm = async () => {
    if (selectedDevices.length === 0) {
      toast.error("Please select at least one device")
      return
    }
    if (!date || !time) {
      toast.error("Please select both date and time")
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(
        `${Base_Url}/alarms/create`,
        {
          deviceIds: selectedDevices,
          state,
          date,
          time,
        },
        { withCredentials: true },
      )

      if (response.data.success) {
        toast.success(response.data.message)
        setSelectedDevices([])
        setState("off")
        setDate("")
        setTime("")
        onOpenChange(false)
      }
    } catch (error: any) {
      console.error("[v0] Error setting alarm:", error)
      toast.error(error.response?.data?.message || "Failed to set alarm")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {(loading || fetchingData) && <Loader fullScreen />}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule Device Alarm
            </DialogTitle>
            <DialogDescription>Set a scheduled time to turn devices ON or OFF</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Lab Selection */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Select Lab</label>
              <Select value={currentLabId} onValueChange={setCurrentLabId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lab..." />
                </SelectTrigger>
                <SelectContent>
                  {labs.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id.toString()}>
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Device Selection */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Select Devices</label>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 border rounded-lg">
                {devices.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-2">
                    {currentLabId ? "No devices available" : "Please select a lab first"}
                  </p>
                ) : (
                  devices.map((device) => (
                    <label key={device.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(device.id)}
                        onChange={() => toggleDeviceSelection(device.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{device.Name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* State Selection */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Device State</label>
              <Select value={state} onValueChange={(value) => setState(value as "on" | "off")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">Turn ON</SelectItem>
                  <SelectItem value="off">Turn OFF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Time</label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSetAlarm} disabled={loading} className="flex-1">
                {loading ? "Setting Alarm..." : "Set Alarm"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
